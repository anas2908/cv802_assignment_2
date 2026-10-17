"""Screened Poisson Surface Reconstruction, implemented from scratch (no Poisson/marching-cubes API).

Kazhdan, Bolitho, Hoppe, "Poisson Surface Reconstruction", SGP 2006;
Kazhdan & Hoppe, "Screened Poisson Surface Reconstruction", ACM TOG 2013.

Pipeline (all our own code; numpy/scipy/torch arithmetic only):
 1. oriented normals: PCA + MST propagation (surface/common/normals.py, our implementation);
 2. density-adaptive sample weights and splatting of the inward normal field -n into a vector field V
    on a regular grid (trilinear splat + [1,2,1] smoothing ~ quadratic B-spline filter);
 3. divergence of V and Jacobi-preconditioned CG solve of the screened Poisson system
        (-L + beta * S^T W S) chi = -div V + beta * S^T W c,
    where L is the 7-point Laplacian (chi = 0 on the grid boundary), S trilinear interpolation at the
    samples and c the iso-value of the unscreened solution; coarse-to-fine (cascadic multigrid) warm starts;
 4. iso-surface chi = mean chi(samples), extracted with our own marching tetrahedra (Kuhn 6-tet split,
    welded edge vertices -> watertight, consistently oriented);
 5. density-based trimming (cf. PoissonRecon's SurfaceTrimmer): drop faces far from every input sample,
    then tiny components.
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as Fn

from surface.common import io
from surface.common.knn import knn
from surface.common.normals import estimate_normals

DEV = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def progress(run: Path | None, pct: int, stage: str, msg: str = "") -> None:
    print(f"[{pct:3d}%] {stage}: {msg}", flush=True)
    if run is not None:
        (run / "progress.json").write_text(json.dumps({"percent": pct, "stage": stage, "message": msg}))


# ---------------------------------------------------------------- trilinear splat / interpolation
def _corners(g: torch.Tensor, R: int):
    i0 = torch.floor(g).long().clamp(0, R - 2)
    f = g - i0
    out = []
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                idx = ((i0[:, 0] + dx) * R + (i0[:, 1] + dy)) * R + (i0[:, 2] + dz)
                out.append((idx, w))
    return out


def splat(corners, vals: torch.Tensor, R: int) -> torch.Tensor:
    """S^T: scatter per-sample values (N,) or (N,C) to the grid."""
    shape = (R ** 3,) + tuple(vals.shape[1:])
    grid = torch.zeros(shape, device=vals.device, dtype=vals.dtype)
    for idx, w in corners:
        grid.index_add_(0, idx, vals * (w if vals.ndim == 1 else w[:, None]))
    return grid.reshape((R, R, R) + tuple(vals.shape[1:]))


def interp(corners, grid: torch.Tensor) -> torch.Tensor:
    """S: trilinear interpolation of a scalar grid at the samples."""
    flat = grid.reshape(-1)
    return sum(flat[idx] * w for idx, w in corners)


def smooth121(x: torch.Tensor, times: int = 1) -> torch.Tensor:
    k = torch.tensor([0.25, 0.5, 0.25], device=x.device, dtype=x.dtype)
    for _ in range(times):
        for axis in range(3):
            xp = Fn.pad(x.movedim(axis, -1), (1, 1))  # field is zero near the grid border
            x = (k[0] * xp[..., :-2] + k[1] * xp[..., 1:-1] + k[2] * xp[..., 2:]).movedim(-1, axis)
    return x


def neg_laplacian(x: torch.Tensor) -> torch.Tensor:
    p = Fn.pad(x[None, None], (1, 1, 1, 1, 1, 1))[0, 0]  # chi = 0 outside the grid (Dirichlet)
    return 6 * x - (p[2:, 1:-1, 1:-1] + p[:-2, 1:-1, 1:-1] + p[1:-1, 2:, 1:-1] + p[1:-1, :-2, 1:-1]
                    + p[1:-1, 1:-1, 2:] + p[1:-1, 1:-1, :-2])


def divergence(V: torch.Tensor) -> torch.Tensor:
    d = torch.zeros(V.shape[:3], device=V.device, dtype=V.dtype)
    for a in range(3):
        f = V[..., a]
        fp = Fn.pad(f[None, None], (1, 1, 1, 1, 1, 1))[0, 0]
        sl_p = [slice(1, -1)] * 3
        sl_m = [slice(1, -1)] * 3
        sl_p[a] = slice(2, None)
        sl_m[a] = slice(None, -2)
        d += 0.5 * (fp[tuple(sl_p)] - fp[tuple(sl_m)])
    return d


def pcg(apply_A, b, x0, diag, iters, tol=1e-5, log=print):
    x = x0.clone()
    r = b - apply_A(x)
    z = r / diag
    p = z.clone()
    rz = (r * z).sum()
    bn = b.norm().clamp_min(1e-30)
    for it in range(iters):
        Ap = apply_A(p)
        alpha = rz / (p * Ap).sum()
        x += alpha * p
        r -= alpha * Ap
        rel = (r.norm() / bn).item() if it % 25 == 0 or it == iters - 1 else None
        if rel is not None:
            log(f"    cg it {it:4d} rel.residual {rel:.2e}")
            if rel < tol:
                break
        z = r / diag
        rz_new = (r * z).sum()
        p = z + (rz_new / rz) * p
        rz = rz_new
    return x


# ---------------------------------------------------------------- Poisson solve at one resolution
def solve_level(gpts, normals, w, R, beta_scale, chi0=None, target=None, iters=300, log=print):
    cor = _corners(gpts, R)
    V = splat(cor, -normals * w[:, None], R)          # inward field (grad of indicator: 1 inside, 0 outside)
    V = torch.stack([smooth121(V[..., a], 2) for a in range(3)], -1)
    rhs = -divergence(V)
    ws = splat(cor, w, R)
    touched = (ws > 0).sum().item()
    beta = beta_scale * touched / w.sum().item() if target is not None else 0.0
    diag = 6.0 + beta * splat([(i, c * c) for i, c in cor], w, R)
    if beta > 0:
        rhs = rhs + beta * target * ws

    def A(x):
        y = neg_laplacian(x)
        if beta > 0:
            y = y + beta * splat(cor, w * interp(cor, x), R)
        return y

    x0 = chi0 if chi0 is not None else torch.zeros_like(rhs)
    chi = pcg(A, rhs, x0, diag, iters, log=log)
    return chi, cor, beta


def upsample(chi: torch.Tensor, R: int) -> torch.Tensor:
    return Fn.interpolate(chi[None, None], size=(R, R, R), mode="trilinear", align_corners=True)[0, 0]


# ---------------------------------------------------------------- marching tetrahedra (own implementation)
_CUBE = np.array([[x, y, z] for x in (0, 1) for y in (0, 1) for z in (0, 1)])  # corner id = 4x+2y+z
_TETS = []
for perm in ((0, 1, 2), (0, 2, 1), (1, 0, 2), (1, 2, 0), (2, 0, 1), (2, 1, 0)):  # Kuhn split along 0->7
    c = np.zeros(3, int)
    path = [c.copy()]
    for a in perm:
        c[a] = 1
        path.append(c.copy())
    _TETS.append([4 * p[0] + 2 * p[1] + p[2] for p in path])
_TETS = np.array(_TETS)  # (6,4)


def marching_tetrahedra(field: np.ndarray, iso: float):
    """Iso-surface {field = iso} of a regular grid. Inside = field > iso. Returns (V grid coords, F)."""
    R0, R1, R2 = field.shape
    f = field - iso
    ins = f > 0
    # cubes with a sign change
    c = np.zeros((R0 - 1, R1 - 1, R2 - 1), np.int8)
    for (x, y, z) in _CUBE:
        c += ins[x:R0 - 1 + x, y:R1 - 1 + y, z:R2 - 1 + z]
    cubes = np.argwhere((c > 0) & (c < 8))
    corner = cubes[:, None, :] + _CUBE[None]                               # (C,8,3)
    gid = (corner[..., 0] * R1 + corner[..., 1]) * R2 + corner[..., 2]     # global vertex ids (C,8)
    tv = gid[:, _TETS].reshape(-1, 4)                                      # (C*6,4)
    flat = f.reshape(-1)
    tf = flat[tv]
    ti = tf > 0
    n_in = ti.sum(1)
    keep = (n_in > 0) & (n_in < 4)
    tv, tf, ti, n_in = tv[keep], tf[keep], ti[keep], n_in[keep]

    edges, tris_e = [], []        # triangle = 3 edges (a,b) between an inside and an outside vertex
    order = np.argsort(~ti, axis=1, kind="stable")                         # inside vertices first
    sv = np.take_along_axis(tv, order, 1)
    for k in (1, 2, 3):
        m = n_in == k
        s = sv[m]
        if k == 1:      # one inside vertex a, outside b,c,d
            tri = [[(s[:, 0], s[:, 1]), (s[:, 0], s[:, 2]), (s[:, 0], s[:, 3])]]
        elif k == 3:    # one outside vertex d
            tri = [[(s[:, 0], s[:, 3]), (s[:, 1], s[:, 3]), (s[:, 2], s[:, 3])]]
        else:           # inside a,b ; outside c,d -> quad (a,c)(a,d)(b,d)(b,c)
            tri = [[(s[:, 0], s[:, 2]), (s[:, 0], s[:, 3]), (s[:, 1], s[:, 3])],
                   [(s[:, 0], s[:, 2]), (s[:, 1], s[:, 3]), (s[:, 1], s[:, 2])]]
        for t in tri:
            tris_e.append(np.stack([np.stack(e, 1) for e in t], 1))       # (T,3,2) [inside, outside]
    E = np.concatenate(tris_e, 0)                                          # (T,3,2)
    keys = E[..., 0].astype(np.int64) * (R0 * R1 * R2) + E[..., 1]
    uniq, inv = np.unique(keys.reshape(-1), return_inverse=True)
    a = uniq // (R0 * R1 * R2)
    b = uniq % (R0 * R1 * R2)
    fa, fb = flat[a], flat[b]
    t = (fa / (fa - fb))[:, None]                                          # fa > 0 > fb
    pa = np.stack(np.unravel_index(a, f.shape), 1).astype(np.float64)
    pb = np.stack(np.unravel_index(b, f.shape), 1).astype(np.float64)
    V = pa + t * (pb - pa)
    F = inv.reshape(-1, 3)
    # orient: normal must point from inside to outside (outward)
    n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    out_dir = pb[np.searchsorted(uniq, keys[:, 0])] - pa[np.searchsorted(uniq, keys[:, 0])]
    flip = (n * out_dir).sum(1) < 0
    F[flip] = F[flip][:, ::-1]
    good = (F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])
    return V, F[good]


def keep_large_components(V, F, min_frac=0.01):
    import scipy.sparse as sp
    from scipy.sparse.csgraph import connected_components

    if len(F) == 0:
        return V, F
    rows = np.concatenate([F[:, 0], F[:, 1], F[:, 2]])
    cols = np.concatenate([F[:, 1], F[:, 2], F[:, 0]])
    g = sp.coo_matrix((np.ones(len(rows)), (rows, cols)), shape=(len(V), len(V)))
    _, lab = connected_components(g, directed=False)
    flab = lab[F[:, 0]]
    cnt = np.bincount(flab)
    F = F[cnt[flab] >= min_frac * len(F)]
    used = np.unique(F)
    remap = -np.ones(len(V), np.int64)
    remap[used] = np.arange(len(used))
    return V[used], remap[F]


# ---------------------------------------------------------------- driver
def reconstruct(xyz, normals, depth_res=256, alpha=4.0, margin=8, log=print, run=None):
    lo, hi = xyz.min(0), xyz.max(0)
    center = (lo + hi) / 2
    scale = (depth_res - 1 - 2 * margin) / (hi - lo).max()
    to_grid = lambda p: (p - center) * scale + (depth_res - 1) / 2
    from_grid = lambda g: (g - (depth_res - 1) / 2) / scale + center

    # density-adaptive weights (2006 paper): w_i proportional to 1 / local sampling density
    d, _ = knn(xyz, xyz, k=9)
    spacing = np.asarray(d)[:, 1:].mean(1)
    w = spacing ** 2
    w = w / w.mean()

    levels = [r for r in (depth_res // 4, depth_res // 2, depth_res) if r >= 32]
    chi, iters = None, {levels[0]: 600, levels[-1]: 250}
    nT = torch.tensor(normals, dtype=torch.float32, device=DEV)
    wT = torch.tensor(w, dtype=torch.float32, device=DEV)
    for li, R in enumerate(levels):
        progress(run, 10 + 15 * li, "poisson solve", f"unscreened level {R}^3")
        s = (R - 1) / (depth_res - 1)
        g = torch.tensor(to_grid(xyz) * s, dtype=torch.float32, device=DEV)
        chi0 = upsample(chi, R) if chi is not None else None
        chi, cor, _ = solve_level(g, nT, wT, R, 0.0, chi0, None, iters.get(R, 300), log)
    c0 = (interp(cor, chi) * wT).sum().item() / wT.sum().item()
    log(f"  unscreened iso {c0:.5f}")
    beta = 0.0
    if alpha > 0:
        progress(run, 55, "poisson solve", f"screened (alpha={alpha}) at {depth_res}^3")
        chi, cor, beta = solve_level(g, nT, wT, depth_res, alpha, chi, c0, 250, log)
    sample_vals = interp(cor, chi)
    iso = (sample_vals * wT).sum().item() / wT.sum().item()
    log(f"  iso {iso:.5f}; chi(samples) std {sample_vals.std().item():.5f}; beta {beta:.3f}")

    progress(run, 75, "marching tetrahedra", f"iso={iso:.4f}")
    Vg, F = marching_tetrahedra(chi.float().cpu().numpy(), iso)
    V = from_grid(Vg)
    return V, F, {"iso": iso, "unscreened_iso": c0, "beta": beta, "levels": levels,
                  "voxel_size": float(1 / scale), "median_spacing": float(np.median(spacing))}


def trim(V, F, xyz, voxel, factor=2.0, min_frac=0.01):
    """Density trimming: remove faces whose centroid is farther than factor*voxel from every sample."""
    cen = V[F].mean(1)
    d, _ = knn(cen, xyz, k=1)
    keep = np.asarray(d).ravel() <= factor * voxel
    return keep_large_components(V, F[keep], min_frac)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir")
    ap.add_argument("--input", required=True)
    ap.add_argument("--res", type=int, default=256)
    ap.add_argument("--alpha", type=float, default=4.0, help="screening weight (0 = classic 2006 Poisson)")
    ap.add_argument("--trim", type=float, default=2.0, help="trim distance in voxels (0 = no trimming)")
    a = ap.parse_args()
    run = Path(a.run_dir)
    run.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    progress(run, 2, "normals", "PCA + MST orientation")
    xyz, rgb = io.read_point_cloud(a.input)
    from surface.common.finalize import input_normals   # cached: input-file normals if present, else our PCA+MST
    normals = input_normals(xyz)
    V, F, info = reconstruct(xyz, normals, a.res, a.alpha, log=print, run=run)
    io.write_mesh_ply(run / "geometry_watertight.ply", V, F)
    progress(run, 85, "trimming", f"{len(F)} faces before trimming")
    if a.trim > 0:
        Vt, Ft = trim(V, F, xyz, info["voxel_size"], a.trim)
    else:
        Vt, Ft = keep_large_components(V, F)
    io.write_mesh_ply(run / "geometry.ply", Vt, Ft)
    info.update(watertight_faces=int(len(F)), trimmed_faces=int(len(Ft)))
    peak = torch.cuda.max_memory_allocated() / 2 ** 20 if DEV.type == "cuda" else 0
    (run / "method_info.json").write_text(json.dumps({
        "method_id": "poisson", "method_name": "Screened Poisson Surface Reconstruction (from scratch)",
        "paper": "Kazhdan et al. SGP 2006; Kazhdan & Hoppe TOG 2013", "official_code": None,
        "params": vars(a), "elapsed_seconds": round(time.time() - t0, 1), "peak_gpu_mib": round(peak),
        "device": str(DEV), "details": info,
        "deviations": "dense grid with cascadic CG instead of an adaptive octree with multigrid; trilinear splat + "
                      "[1,2,1] smoothing instead of exact degree-2 B-splines; marching tetrahedra instead of marching cubes",
    }, indent=1))
    progress(run, 89, "method done", f"{len(Ft)} faces (trimmed), {len(F)} watertight")


if __name__ == "__main__":
    main()
