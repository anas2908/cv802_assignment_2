"""Small mesh-geometry helpers shared by texture baking, metrics and rendering (numpy)."""
from __future__ import annotations

import numpy as np

__all__ = [
    "face_normals", "face_areas", "vertex_normals", "sample_surface", "closest_point_triangles",
    "closest_points_on_mesh", "clean_mesh", "bbox_diagonal",
]


def bbox_diagonal(xyz):
    xyz = np.asarray(xyz, np.float64)
    return float(np.linalg.norm(xyz.max(0) - xyz.min(0)))


def face_normals(V, F, normalize=True):
    V = np.asarray(V, np.float64)
    n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    if normalize:
        n = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-30)
    return n


def face_areas(V, F):
    return 0.5 * np.linalg.norm(face_normals(V, F, normalize=False), axis=1)


def vertex_normals(V, F):
    """Area-weighted vertex normals (follow the face winding)."""
    fn = face_normals(V, F, normalize=False)
    vn = np.zeros((len(V), 3))
    for j in range(3):
        _bincount_add(vn, F[:, j], fn)
    return vn / np.maximum(np.linalg.norm(vn, axis=1, keepdims=True), 1e-30)


def _bincount_add(out, idx, vals):
    for c in range(vals.shape[1]):
        out[:, c] += np.bincount(idx, weights=vals[:, c], minlength=len(out))


def sample_surface(V, F, n, seed=0):
    """Area-weighted uniform surface samples. Returns ``(points (n,3), face_idx (n,), bary (n,3))``."""
    rng = np.random.default_rng(seed)
    a = face_areas(V, F)
    p = a / a.sum()
    fi = rng.choice(len(F), size=n, p=p)
    r1 = np.sqrt(rng.random(n))
    r2 = rng.random(n)
    bary = np.stack([1 - r1, r1 * (1 - r2), r1 * r2], axis=1)
    tri = np.asarray(V, np.float64)[F[fi]]
    pts = (bary[:, :, None] * tri).sum(1)
    return pts, fi, bary


def closest_point_triangles(p, a, b, c):
    """Exact closest point on triangles ``(a,b,c)`` to points ``p`` (all (n,3)), Ericson's method.
    Returns ``(closest (n,3), bary (n,3), dist (n,))``."""
    p, a, b, c = (np.asarray(x, np.float64) for x in (p, a, b, c))
    ab, ac, ap = b - a, c - a, p - a
    d1 = (ab * ap).sum(1); d2 = (ac * ap).sum(1)
    bp = p - b
    d3 = (ab * bp).sum(1); d4 = (ac * bp).sum(1)
    cp = p - c
    d5 = (ab * cp).sum(1); d6 = (ac * cp).sum(1)
    va = d3 * d6 - d5 * d4
    vb = d5 * d2 - d1 * d6
    vc = d1 * d4 - d3 * d2
    n = len(p)
    bary = np.zeros((n, 3))
    done = np.zeros(n, bool)

    def setb(mask, u, v, w):
        m = mask & ~done
        bary[m, 0] = u[m] if np.ndim(u) else u
        bary[m, 1] = v[m] if np.ndim(v) else v
        bary[m, 2] = w[m] if np.ndim(w) else w
        done[m] = True

    with np.errstate(divide="ignore", invalid="ignore"):
        setb((d1 <= 0) & (d2 <= 0), 1.0, 0.0, 0.0)
        setb((d3 >= 0) & (d4 <= d3), 0.0, 1.0, 0.0)
        v_ab = d1 / (d1 - d3)
        setb((vc <= 0) & (d1 >= 0) & (d3 <= 0), 1 - v_ab, v_ab, 0.0)
        setb((d6 >= 0) & (d5 <= d6), 0.0, 0.0, 1.0)
        w_ac = d2 / (d2 - d6)
        setb((vb <= 0) & (d2 >= 0) & (d6 <= 0), 1 - w_ac, 0.0, w_ac)
        w_bc = (d4 - d3) / ((d4 - d3) + (d5 - d6))
        setb((va <= 0) & ((d4 - d3) >= 0) & ((d5 - d6) >= 0), 0.0, 1 - w_bc, w_bc)
        denom = 1.0 / (va + vb + vc)
        v_in = vb * denom
        w_in = vc * denom
        setb(np.ones(n, bool), 1 - v_in - w_in, v_in, w_in)
    bary = np.nan_to_num(bary, nan=1.0 / 3.0)
    q = bary[:, :1] * a + bary[:, 1:2] * b + bary[:, 2:] * c
    return q, bary, np.linalg.norm(p - q, axis=1)


def closest_points_on_mesh(V, F, query, n_samples=None, k_cand=16, device=None, samples=None, seed=0):
    """Closest point on a triangle mesh for each query point.

    Candidate faces are the faces of the ``k_cand`` nearest area-weighted surface samples (dense:
    ``n_samples`` defaults to clamp(8*F, 300k, 2M)); the exact point-triangle distance is then taken
    over the candidates. This is exact whenever the true closest face is among the candidates,
    which holds in practice for dense sampling (approximation documented in metrics.json).
    Returns ``(dist (Q,), face (Q,), bary (Q,3), closest (Q,3))``."""
    from .knn import knn

    V = np.asarray(V, np.float64)
    query = np.asarray(query, np.float64)
    if samples is None:
        if n_samples is None:
            n_samples = int(np.clip(8 * len(F), 300000, 2000000))
        samples = sample_surface(V, F, n_samples, seed=seed)
    sp, sf, _ = samples
    k = int(min(k_cand, len(sp)))
    _, si = knn(query, sp, k, device=device)
    best_d = np.full(len(query), np.inf)
    best_f = np.zeros(len(query), np.int64)
    best_b = np.zeros((len(query), 3))
    best_q = np.zeros((len(query), 3))
    cand = sf[si]                                   # (Q,k) face ids
    for j in range(k):
        f = cand[:, j]
        q, b, d = closest_point_triangles(query, V[F[f, 0]], V[F[f, 1]], V[F[f, 2]])
        m = d < best_d
        best_d[m] = d[m]; best_f[m] = f[m]; best_b[m] = b[m]; best_q[m] = q[m]
    return best_d, best_f, best_b, best_q


def clean_mesh(V, F, rgb=None):
    """Drop faces with repeated vertex indices or non-finite/zero area, and unreferenced vertices.
    Returns ``(V, F, rgb, info)``."""
    V = np.asarray(V, np.float64)
    F = np.asarray(F, np.int64).reshape(-1, 3)
    n0v, n0f = len(V), len(F)
    ok = (F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])
    ok &= np.all((F >= 0) & (F < len(V)), axis=1)
    F = F[ok]
    a = face_areas(V, F)
    ok2 = np.isfinite(a) & (a > 0)
    F = F[ok2]
    used = np.zeros(len(V), bool)
    used[F.ravel()] = True
    remap = -np.ones(len(V), np.int64)
    remap[used] = np.arange(used.sum())
    V2 = V[used]
    F2 = remap[F]
    rgb2 = None if rgb is None else np.asarray(rgb)[used]
    info = {"removed_faces": int(n0f - len(F2)), "removed_vertices": int(n0v - len(V2))}
    return V2, F2, rgb2, info
