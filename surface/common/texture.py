"""UV atlas + texture baking for shape-only meshes.

``bake_texture(V, F, ...)`` returns a :class:`TexturedMesh` (V, F, VT, FT, image) where

* the UV atlas comes from xatlas (charts packed into ``tex_size``^2 with padding); for very large
  meshes xatlas is slow, so above ``grid_atlas_faces`` faces (default 1.5M) a simple per-triangle
  grid atlas is used instead (documented in the returned info),
* every texel is rasterised in UV space (our torch rasteriser, 1-texel border so bilinear
  filtering at chart edges reads valid colours) to a 3D surface position via barycentrics,
* the texel colour is either the inverse-distance-weighted mean of the ``k`` nearest input points
  (``color_source='points'``; neighbours farther than ``cutoff`` are ignored, falling back to the
  single nearest point) or the barycentric interpolation of per-vertex colours (``'vertex'``),
* empty texels are filled by iterative seam dilation (``dilate`` texels), the rest with the mean
  colour, so mip-mapping / bilinear filtering never bleeds black into the surface.

UV convention: OBJ (origin bottom-left). Texel (row r, col c) <-> (u, v) = ((c+.5)/W, 1-(r+.5)/H).
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

import numpy as np

from .knn import get_device, knn
from .raster import rasterize

__all__ = ["TexturedMesh", "uv_atlas", "bake_texture", "sample_texture", "uv_to_pixel", "dilate_image"]


@dataclass
class TexturedMesh:
    V: np.ndarray       # (Nv,3) float64 positions (original vertex set)
    F: np.ndarray       # (Nf,3) int64 position indices
    VT: np.ndarray      # (Nt,2) float64 uv, OBJ convention
    FT: np.ndarray      # (Nf,3) int64 uv indices
    image: np.ndarray   # (H,W,3) uint8, top row first
    info: dict = field(default_factory=dict)


def uv_to_pixel(uv, H, W):
    """OBJ uv -> continuous pixel coordinates (x right, y down; texel centres at +0.5)."""
    uv = np.asarray(uv, np.float64)
    return np.stack([uv[..., 0] * W, (1.0 - uv[..., 1]) * H], -1)


def _grid_atlas(F, tex_size, pad=1.0):
    """Per-triangle atlas: pairs of triangles share a square cell of a regular grid.
    Fast for any face count; wastes no space but cuts every edge (seams everywhere)."""
    nF = len(F)
    ncell = (nF + 1) // 2
    g = int(np.ceil(np.sqrt(ncell)))
    cell = tex_size / g
    ci = np.arange(nF) // 2
    cx, cy = (ci % g) * cell, (ci // g) * cell
    lo, hi = pad, cell - pad
    if hi - lo < 0.5:
        lo, hi = 0.15 * cell, 0.85 * cell
    first = (np.arange(nF) % 2) == 0
    # Two right triangles per cell with a gap along the diagonal.
    d = min(pad, 0.1 * cell)
    t0 = np.array([[lo, lo], [hi - d, lo], [lo, hi - d]])
    t1 = np.array([[hi, hi], [lo + d, hi], [hi, lo + d]])
    tri = np.where(first[:, None, None], t0[None], t1[None]) + np.stack([cx, cy], 1)[:, None, :]
    # tri is in pixel coords (y down) -> uv
    uv = np.stack([tri[..., 0] / tex_size, 1.0 - tri[..., 1] / tex_size], -1)
    VT = uv.reshape(-1, 2)
    FT = np.arange(3 * nF, dtype=np.int64).reshape(nF, 3)
    return VT, FT


def uv_atlas(V, F, tex_size=2048, padding=4, method="auto", grid_atlas_faces=600_000, log=print):
    """Compute a UV atlas. Returns ``(VT (Nt,2), FT (Nf,3), info)``; ``FT`` rows correspond to ``F`` rows."""
    t0 = time.time()
    F = np.asarray(F, np.int64)
    if method == "auto":
        method = "grid" if len(F) > grid_atlas_faces else "xatlas"
    if method == "grid":
        VT, FT = _grid_atlas(F, tex_size, pad=max(1.0, padding / 2))
        return VT, FT, {"atlas": "grid", "atlas_seconds": round(time.time() - t0, 2)}
    import xatlas

    Vf = np.ascontiguousarray(V, np.float32)
    Fu = np.ascontiguousarray(F, np.uint32)
    tpu = 0.0
    for attempt in range(6):
        atlas = xatlas.Atlas()
        atlas.add_mesh(Vf, Fu)
        co = xatlas.ChartOptions()
        po = xatlas.PackOptions()
        po.resolution = int(tex_size)
        po.padding = int(padding)
        po.bilinear = True
        po.blockAlign = True
        po.texels_per_unit = float(tpu)
        if len(F) > 300_000:
            co.max_iterations = 1
        atlas.generate(co, po, verbose=False)
        if atlas.atlas_count <= 1:
            break
        # Charts did not fit into one tex_size^2 page: shrink the texel density and retry.
        tpu = float(atlas.texels_per_unit) / (np.sqrt(atlas.atlas_count) * 1.15)
        log(f"[texture] xatlas produced {atlas.atlas_count} pages; retrying with texels_per_unit={tpu:.2f}")
    else:
        raise RuntimeError("xatlas could not pack the charts into a single page")
    vmapping, indices, uvs = atlas[0]
    indices = indices.astype(np.int64)
    # xatlas keeps the face order; check that the mapped faces reproduce F.
    mapped = vmapping.astype(np.int64)[indices]
    if mapped.shape != F.shape or not np.array_equal(mapped, F):
        bad = int((mapped != F).any(1).sum()) if mapped.shape == F.shape else -1
        raise RuntimeError(f"xatlas changed the face order/count (mismatched faces: {bad})")
    info = {"atlas": "xatlas", "atlas_seconds": round(time.time() - t0, 2), "charts": int(getattr(atlas, "chart_count", -1)),
            "atlas_size": [int(getattr(atlas, "width", 0)), int(getattr(atlas, "height", 0))]}
    return uvs.astype(np.float64), indices, info


def dilate_image(img, mask, iters=16):
    """Fill empty texels (mask False) from the mean of filled 8-neighbours, ``iters`` rings.
    Works on numpy float arrays (H,W,C); returns (img, mask)."""
    import torch
    import torch.nn.functional as Fnn

    dev = get_device()
    x = torch.as_tensor(img, dtype=torch.float32, device=dev).permute(2, 0, 1)[None]
    m = torch.as_tensor(mask, dtype=torch.float32, device=dev)[None, None]
    k = torch.ones((1, 1, 3, 3), device=dev)
    kc = torch.ones((x.shape[1], 1, 3, 3), device=dev)
    for _ in range(iters):
        if bool(m.min() > 0):
            break
        s = Fnn.conv2d(x * m, kc, padding=1, groups=x.shape[1])
        c = Fnn.conv2d(m, k, padding=1)
        new = (c > 0) & (m == 0)
        x = torch.where(new, s / c.clamp(min=1), x)
        m = torch.where(new, torch.ones_like(m), m)
    return x[0].permute(1, 2, 0).cpu().numpy(), m[0, 0].cpu().numpy() > 0


def _idw_colors(pos, xyz, rgb, k, cutoff, power, device):
    d, idx = knn(pos, xyz, k, device=device)
    col = rgb[idx].astype(np.float64)                         # (n,k,3)
    use = d <= cutoff
    use[:, 0] = True                                          # nearest point always contributes
    w = np.where(use, 1.0 / np.maximum(d, 1e-9) ** power, 0.0)
    out = (w[:, :, None] * col).sum(1) / w.sum(1, keepdims=True)
    return out, d[:, 0]


def bake_texture(V, F, xyz=None, rgb=None, vertex_rgb=None, color_source="points", tex_size=2048, k=8,
                 power=2.0, cutoff=None, padding=4, dilate=16, atlas="auto", device=None, uv=None, log=print):
    """Build a UV atlas and bake a colour texture. See the module docstring.

    ``cutoff`` (world units) defaults to 3x the median nearest-neighbour spacing of the input points.
    ``uv=(VT, FT)`` reuses an existing atlas. Returns :class:`TexturedMesh`."""
    import torch

    t0 = time.time()
    V = np.asarray(V, np.float64)
    F = np.asarray(F, np.int64)
    dev = get_device(device) if not hasattr(device, "type") else device
    info = {"color_source": color_source, "tex_size": int(tex_size)}
    if uv is None:
        VT, FT, ainfo = uv_atlas(V, F, tex_size=tex_size, padding=padding, method=atlas, log=log)
    else:
        VT, FT = uv
        ainfo = {"atlas": "given"}
    info.update(ainfo)
    log(f"[texture] atlas={info['atlas']} faces={len(F)} uv_verts={len(VT)} ({info.get('atlas_seconds', 0)} s)")
    H = W = int(tex_size)
    t1 = time.time()
    pix = uv_to_pixel(VT[FT], H, W)                              # (F,3,2)
    max_cand = 8_000_000 if dev.type == "cuda" else 2_000_000
    face, bary = rasterize(
        torch.as_tensor(pix, dtype=torch.float32, device=dev), H, W, border=1.0, max_candidates=max_cand)
    face = face.cpu().numpy().reshape(-1)
    bary = bary.double().cpu().numpy().reshape(-1, 3)
    cov = face >= 0
    info["texel_coverage"] = float(cov.mean())
    log(f"[texture] rasterised {cov.sum()} texels ({100 * cov.mean():.1f}%) in {time.time() - t1:.1f} s")
    fi = face[cov]
    b = bary[cov]
    img = np.zeros((H * W, 3), np.float64)
    t2 = time.time()
    if color_source == "vertex":
        if vertex_rgb is None:
            raise ValueError("color_source='vertex' needs vertex_rgb")
        vc = np.asarray(vertex_rgb, np.float64)
        img[cov] = (b[:, :, None] * vc[F[fi]]).sum(1)
    elif color_source == "points":
        if xyz is None or rgb is None:
            raise ValueError("color_source='points' needs xyz and rgb")
        xyz = np.asarray(xyz, np.float64)
        rgb = np.asarray(rgb)
        if cutoff is None:
            dnn, _ = knn(xyz, xyz, 2, device=dev)
            cutoff = 3.0 * float(np.median(dnn[:, 1]))
        info.update({"k": int(k), "idw_power": float(power), "cutoff": float(cutoff)})
        out = np.empty((len(fi), 3))
        dn = np.empty(len(fi))
        step = 2_000_000
        for s in range(0, len(fi), step):
            fs, bs = fi[s:s + step], b[s:s + step]
            pos = (bs[:, :, None] * V[F[fs]]).sum(1)
            out[s:s + step], dn[s:s + step] = _idw_colors(pos, xyz, rgb, k, cutoff, power, dev)
        img[cov] = out
        info["texel_nearest_point_dist_median"] = float(np.median(dn)) if len(dn) else None
        info["texel_nearest_point_dist_p95"] = float(np.percentile(dn, 95)) if len(dn) else None
    else:
        raise ValueError(f"unknown color_source {color_source!r}")
    log(f"[texture] coloured texels in {time.time() - t2:.1f} s")
    img = img.reshape(H, W, 3)
    mask = cov.reshape(H, W)
    if dilate > 0:
        img, mask2 = dilate_image(img, mask, iters=dilate)
    else:
        mask2 = mask
    if (~mask2).any():
        fill = img[mask].mean(0) if mask.any() else np.array([128.0, 128.0, 128.0])
        img[~mask2] = fill
    image = np.clip(np.round(img), 0, 255).astype(np.uint8)
    info["bake_seconds"] = round(time.time() - t0, 2)
    return TexturedMesh(V=V, F=F, VT=np.asarray(VT, np.float64), FT=np.asarray(FT, np.int64), image=image, info=info)


def sample_texture(image, uv, mode="bilinear"):
    """Sample a uint8 (H,W,3) texture at OBJ uv coordinates (n,2) -> float64 (n,3) in 0..255.
    Bilinear with clamp-to-edge (same as the viewers' default)."""
    img = np.asarray(image, np.float64)
    H, W = img.shape[:2]
    p = uv_to_pixel(uv, H, W) - 0.5
    if mode == "nearest":
        x = np.clip(np.round(p[:, 0]).astype(int), 0, W - 1)
        y = np.clip(np.round(p[:, 1]).astype(int), 0, H - 1)
        return img[y, x]
    x0 = np.floor(p[:, 0]); y0 = np.floor(p[:, 1])
    fx = (p[:, 0] - x0)[:, None]; fy = (p[:, 1] - y0)[:, None]
    x0 = x0.astype(int); y0 = y0.astype(int)
    x1 = np.clip(x0 + 1, 0, W - 1); y1 = np.clip(y0 + 1, 0, H - 1)
    x0 = np.clip(x0, 0, W - 1); y0 = np.clip(y0, 0, H - 1)
    return (img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x1] * fx * (1 - fy)
            + img[y1, x0] * (1 - fx) * fy + img[y1, x1] * fx * fy)
