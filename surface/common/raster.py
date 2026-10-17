"""A small triangle rasteriser in pure torch (GPU or CPU), used for

* texture baking: rasterising triangles in UV (texel) space, with an optional border so texels
  just outside a chart still get a valid surface position (clamped to the triangle), and
* headless rendering: perspective-correct, z-buffered rasterisation in screen space.

Algorithm: every triangle enumerates the pixel centres of its (integer) bounding box; candidates
are generated in chunks bounded by ``max_candidates``. A first pass resolves the best score per
pixel with ``scatter_reduce(amax)`` (score = 1/w for depth, -distance for UV borders); a second
pass picks the triangle achieving that score (largest id on ties, so the result is deterministic).
Barycentrics are recomputed analytically for the winning triangle.
Pixel (row r, col c) has its centre at ``(x, y) = (c + 0.5, r + 0.5)``; y grows downwards.
"""
from __future__ import annotations

import torch

__all__ = ["rasterize", "barycentric_2d"]


def _bbox(xy, H, W, border):
    lo = torch.floor(xy.min(1).values - 0.5 - border).clamp(min=0)
    hi = torch.ceil(xy.max(1).values - 0.5 + border)
    hi[:, 0] = hi[:, 0].clamp(max=W - 1)
    hi[:, 1] = hi[:, 1].clamp(max=H - 1)
    lo = lo.long(); hi = hi.long()
    w = (hi[:, 0] - lo[:, 0] + 1).clamp(min=0)
    h = (hi[:, 1] - lo[:, 1] + 1).clamp(min=0)
    return lo, w, h


def barycentric_2d(p, a, b, c):
    """Barycentrics of 2D points p w.r.t. triangles (a,b,c); all (n,2). Returns (n,3) and the signed area*2."""
    v0 = b - a; v1 = c - a; v2 = p - a
    den = v0[:, 0] * v1[:, 1] - v1[:, 0] * v0[:, 1]
    safe = torch.where(den.abs() < 1e-20, torch.full_like(den, 1e-20), den)
    l1 = (v2[:, 0] * v1[:, 1] - v1[:, 0] * v2[:, 1]) / safe
    l2 = (v0[:, 0] * v2[:, 1] - v2[:, 0] * v0[:, 1]) / safe
    return torch.stack([1 - l1 - l2, l1, l2], 1), den


def _seg_closest(p, a, b):
    ab = b - a
    t = ((p - a) * ab).sum(1) / (ab * ab).sum(1).clamp(min=1e-20)
    t = t.clamp(0, 1)
    q = a + t[:, None] * ab
    return (p - q).norm(dim=1), t


def _dist_to_tri(p, a, b, c, bary):
    """Distance from 2D p to triangle (0 inside) and barycentrics of the closest point."""
    inside = (bary >= -1e-7).all(1)
    dab, tab = _seg_closest(p, a, b)
    dbc, tbc = _seg_closest(p, b, c)
    dca, tca = _seg_closest(p, c, a)
    d = torch.stack([dab, dbc, dca], 1)
    dmin, which = d.min(1)
    z = torch.zeros_like(tab)
    b_ab = torch.stack([1 - tab, tab, z], 1)
    b_bc = torch.stack([z, 1 - tbc, tbc], 1)
    b_ca = torch.stack([tca, z, 1 - tca], 1)
    bc = torch.where((which == 0)[:, None], b_ab, torch.where((which == 1)[:, None], b_bc, b_ca))
    dist = torch.where(inside, torch.zeros_like(dmin), dmin)
    bc = torch.where(inside[:, None], bary, bc)
    return dist, bc


def _chunks(area, max_candidates):
    """Split faces into contiguous chunks with sum(area) <= max_candidates (a single larger face is
    its own chunk)."""
    cs = torch.cumsum(area, 0).cpu()
    F = area.shape[0]
    s = 0
    while s < F:
        base = cs[s - 1].item() if s > 0 else 0
        e = int(torch.searchsorted(cs, torch.tensor(base + max_candidates, dtype=cs.dtype), right=True).item())
        e = max(e, s + 1)
        yield s, min(e, F)
        s = e


def _candidates(xy, lo, w, h, s, e, H, W):
    area = (w[s:e] * h[s:e])
    total = int(area.sum().item())
    if total == 0:
        return None
    dev = xy.device
    fid = torch.repeat_interleave(torch.arange(s, e, device=dev), area)
    start = torch.cumsum(area, 0) - area
    local = torch.arange(total, device=dev) - torch.repeat_interleave(start, area)
    ww = w[fid]
    px = lo[fid, 0] + local % ww
    py = lo[fid, 1] + torch.div(local, ww, rounding_mode="floor")
    pix = py * W + px
    p = torch.stack([px.float() + 0.5, py.float() + 0.5], 1) if xy.dtype == torch.float32 else \
        torch.stack([px.to(xy.dtype) + 0.5, py.to(xy.dtype) + 0.5], 1)
    return fid, pix, p


@torch.no_grad()
def rasterize(xy, H, W, inv_w=None, border=0.0, max_candidates=8_000_000):
    """Rasterise triangles given per-vertex pixel coordinates ``xy`` (F,3,2) (x right, y down).

    * ``inv_w`` (F,3): per-vertex 1/w for perspective-correct barycentrics and z-buffering
      (the triangle with the largest interpolated 1/w, i.e. the nearest, wins).
    * ``border`` (texels, only without ``inv_w``): pixels whose centre lies within ``border`` of a
      triangle are also assigned (barycentrics of the closest point on the triangle); pixels
      inside a triangle always win over border pixels.
    Returns ``face (H,W) long`` (-1 = empty) and ``bary (H,W,3)`` (perspective-corrected).
    """
    dev = xy.device
    F = xy.shape[0]
    face = torch.full((H * W,), -1, dtype=torch.long, device=dev)
    bary_out = torch.zeros((H * W, 3), dtype=xy.dtype, device=dev)
    if F == 0:
        return face.view(H, W), bary_out.view(H, W, 3)
    valid = torch.isfinite(xy).all(2).all(1)
    if inv_w is not None:
        valid &= (inv_w > 0).all(1)
        border = 0.0
    lo, w, h = _bbox(torch.nan_to_num(xy), H, W, border)
    w = torch.where(valid, w, torch.zeros_like(w))
    h = torch.where(valid, h, torch.zeros_like(h))
    area = w * h
    NEG = torch.tensor(-float("inf"), dtype=xy.dtype, device=dev)
    best = torch.full((H * W,), -float("inf"), dtype=xy.dtype, device=dev)

    def scores(s, e):
        cand = _candidates(xy, lo, w, h, s, e, H, W)
        if cand is None:
            return None
        fid, pix, p = cand
        tri = xy[fid]
        bc, den = barycentric_2d(p, tri[:, 0], tri[:, 1], tri[:, 2])
        nondeg = den.abs() > 1e-12
        if inv_w is not None:
            inside = (bc >= -1e-6).all(1) & nondeg
            iw = inv_w[fid]
            sc = (bc * iw).sum(1)
            sc = torch.where(inside, sc, NEG)
        else:
            dist, bc = _dist_to_tri(p, tri[:, 0], tri[:, 1], tri[:, 2], bc)
            ok = (dist <= border + 1e-9) & nondeg
            sc = torch.where(ok, -dist, NEG)
        return fid, pix, sc, bc

    chunks = list(_chunks(area, max_candidates))
    for s, e in chunks:
        r = scores(s, e)
        if r is None:
            continue
        fid, pix, sc, _ = r
        m = torch.isfinite(sc)
        best.scatter_reduce_(0, pix[m], sc[m], reduce="amax")
    for s, e in chunks:
        r = scores(s, e)
        if r is None:
            continue
        fid, pix, sc, bc = r
        m = torch.isfinite(sc) & (sc >= best[pix])
        face.scatter_reduce_(0, pix[m], fid[m], reduce="amax")
    for s, e in chunks:  # third pass: barycentrics of the winning candidates
        r = scores(s, e)
        if r is None:
            continue
        fid, pix, sc, bc = r
        m = torch.isfinite(sc) & (face[pix] == fid)
        bary_out[pix[m]] = bc[m]
    if inv_w is not None:
        f = face.clamp(min=0)
        bw = bary_out * inv_w[f]
        bary_out = bw / bw.sum(1, keepdim=True).clamp(min=1e-30)
        bary_out[face < 0] = 0
    return face.view(H, W), bary_out.view(H, W, 3)
