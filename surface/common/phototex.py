"""Photo-based multi-view texturing (our implementation): re-colour a finished run's UV texture from the original
photos, using the COLMAP cameras of the same frame (light-shirt MVS: reviewed E10 model).

For every texel: 3D position + normal from the UV atlas -> project into each camera (SIMPLE_RADIAL / RADIAL /
PINHOLE) -> keep views where the texel is in front, inside the image, inside the person mask, faces the camera and
passes a z-buffer visibility test -> blend the photo colours with weights favouring frontal, close, high-resolution
views (w = cos^4 * (f/z)^2, sharpened so the best view dominates). Texels no photo sees keep the point-baked colour.

python -m surface.common.phototex <src_run> <dst_run> --model <colmap_dir> --images <dir> [--masks <dir>]
then: finalize.sh <dst_run> --color-source method
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import time
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from surface.common import io
from surface.common.raster import rasterize
from surface.common.texture import dilate_image, uv_to_pixel

DEV = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def project(cam, Xc):
    """Camera-frame points (N,3) -> pixel coords (N,2) for the COLMAP models used here."""
    x, y = Xc[:, 0] / Xc[:, 2], Xc[:, 1] / Xc[:, 2]
    m, p = cam["model"], cam["params"]
    if m in ("SIMPLE_RADIAL", "RADIAL"):
        f, cx, cy, k1 = p[0], p[1], p[2], p[3]
        k2 = p[4] if m == "RADIAL" else 0.0
        r2 = x * x + y * y
        d = 1 + k1 * r2 + k2 * r2 * r2
        return torch.stack([f * x * d + cx, f * y * d + cy], 1)
    if m == "SIMPLE_PINHOLE":
        return torch.stack([p[0] * x + p[1], p[0] * y + p[2]], 1)
    if m == "PINHOLE":
        return torch.stack([p[0] * x + p[2], p[1] * y + p[3]], 1)
    raise ValueError(f"camera model {m} not supported")


def load_model(model_dir):
    import pycolmap
    r = pycolmap.Reconstruction(str(model_dir))
    cams = {cid: {"model": c.model.name, "params": [float(v) for v in c.params], "w": c.width, "h": c.height}
            for cid, c in r.cameras.items()}
    views = []
    for im in r.images.values():
        T = im.cam_from_world() if callable(im.cam_from_world) else im.cam_from_world
        views.append({"name": im.name, "cam": cams[im.camera_id], "R": np.asarray(T.rotation.matrix()),
                      "t": np.asarray(T.translation)})
    return views


def find(root: Path, name: str, exts):
    # VGGSfM stages images as "<index>__<hash>__<original name>"; COLMAP keeps "<folder>/<name>"
    for nm in dict.fromkeys((name, os.path.basename(name).split("__")[-1])):
        base = os.path.splitext(nm)[0]
        for e in exts:
            for cand in (root / (base + e), *root.rglob(os.path.basename(base) + e)):
                if cand.exists():
                    return cand
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src_run")
    ap.add_argument("dst_run")
    ap.add_argument("--model", required=True)
    ap.add_argument("--images", required=True)
    ap.add_argument("--masks", default=None)
    ap.add_argument("--depth-scale", type=float, default=0.5, help="z-buffer resolution relative to the camera")
    ap.add_argument("--min-cos", type=float, default=0.25)
    ap.add_argument("--sharpen", type=float, default=4.0)
    ap.add_argument("--tex-size", type=int, default=0, help="output texture size (0 = same as the source); UVs are reused")
    ap.add_argument("--gain", action="store_true", help="per-photo exposure compensation against the point colours")
    ap.add_argument("--two-sided", action="store_true",
                    help="ignore face orientation (meshes without consistent winding, e.g. IER); visibility from the z-buffer")
    a = ap.parse_args()
    t0 = time.time()
    src, dst = Path(a.src_run), Path(a.dst_run)
    V, F, VT, FT, base_img = io.read_textured_obj(src / "mesh.obj")
    V = torch.tensor(np.asarray(V), dtype=torch.float32, device=DEV)
    F_np = np.asarray(F)
    Ft = torch.tensor(F_np, dtype=torch.long, device=DEV)
    base_img = np.asarray(base_img)
    if a.tex_size and a.tex_size != base_img.shape[0]:   # same UV atlas, higher-resolution texture
        base_img = np.asarray(Image.fromarray(base_img).resize((a.tex_size, a.tex_size), Image.BICUBIC))
    H, W = base_img.shape[:2]

    # texel -> (face, barycentric) -> 3D position and face normal
    pix = torch.tensor(uv_to_pixel(np.asarray(VT)[np.asarray(FT)], H, W), dtype=torch.float32, device=DEV)
    face, bary = rasterize(pix, H, W, border=1.0)
    face, bary = face.view(-1), bary.view(-1, 3)
    cov = face >= 0
    tid = torch.nonzero(cov).squeeze(1)
    fi = face[tid]
    P = (bary[tid][:, :, None] * V[Ft[fi]]).sum(1)
    tri = V[Ft]
    fn = torch.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0], dim=1)
    fn = fn / fn.norm(dim=1, keepdim=True).clamp_min(1e-12)
    N = fn[fi]
    diag = float((V.max(0).values - V.min(0).values).norm())
    print(f"[phototex] mesh {len(F_np)} faces, texture {W}x{H}, {len(tid)} covered texels", flush=True)

    acc = torch.zeros((len(tid), 3), device=DEV)
    wsum = torch.zeros(len(tid), device=DEV)
    wmax = torch.zeros(len(tid), device=DEV)
    used, report = 0, []
    views = load_model(a.model)
    for v in views:
        img_p = find(Path(a.images), v["name"], (".jpg", ".JPG", ".jpeg", ".png"))
        if img_p is None:
            continue
        cam = v["cam"]
        img = Image.open(img_p).convert("RGB")
        if img.size != (cam["w"], cam["h"]):
            img = img.resize((cam["w"], cam["h"]), Image.BILINEAR)
        photo = torch.tensor(np.asarray(img), dtype=torch.float32, device=DEV)
        mask = None
        if a.masks:
            mp = find(Path(a.masks), v["name"], (".png",))
            if mp is not None:
                mimg = Image.open(mp).convert("L").resize((cam["w"], cam["h"]), Image.NEAREST)
                mask = torch.tensor(np.asarray(mimg) >= 128, device=DEV)
        R = torch.tensor(v["R"], dtype=torch.float32, device=DEV)
        t = torch.tensor(v["t"], dtype=torch.float32, device=DEV)
        # z-buffer of the mesh in this camera (reduced resolution)
        s = a.depth_scale
        Hd, Wd = int(cam["h"] * s), int(cam["w"] * s)
        Vc = V @ R.T + t
        ok_v = Vc[:, 2] > 1e-6
        uvv = project(cam, Vc.clamp(min=-1e9)) * s
        tri_xy = uvv[Ft]
        inv_w = torch.where(ok_v, 1.0 / Vc[:, 2].clamp_min(1e-6), torch.zeros_like(Vc[:, 2]))[Ft]
        dface, dbary = rasterize(tri_xy, Hd, Wd, inv_w=inv_w)
        depth = torch.full((Hd, Wd), float("inf"), device=DEV)
        hit = dface >= 0
        depth[hit] = 1.0 / (dbary[hit] * inv_w[dface[hit]]).sum(1).clamp_min(1e-9)
        # texels in this view
        Pc = P @ R.T + t
        z = Pc[:, 2]
        uv = project(cam, Pc)
        inside = (z > 1e-6) & (uv[:, 0] >= 0) & (uv[:, 0] < cam["w"] - 1) & (uv[:, 1] >= 0) & (uv[:, 1] < cam["h"] - 1)
        cam_c = -R.T @ t
        vd = cam_c[None] - P
        cosv = (N * vd).sum(1) / vd.norm(dim=1).clamp_min(1e-9)
        if a.two_sided:
            cosv = cosv.abs()
        good = inside & (cosv > a.min_cos)
        idx = torch.nonzero(good).squeeze(1)
        if len(idx) == 0:
            continue
        ui = (uv[idx, 0] * s).long().clamp(0, Wd - 1)
        vi = (uv[idx, 1] * s).long().clamp(0, Hd - 1)
        vis = z[idx] <= depth[vi, ui] * 1.0 + 0.004 * diag            # z-buffer test with a small tolerance
        if mask is not None:
            vis &= mask[uv[idx, 1].long(), uv[idx, 0].long()]
        idx = idx[vis]
        if len(idx) == 0:
            continue
        x, y = uv[idx, 0], uv[idx, 1]
        x0, y0 = x.floor().long(), y.floor().long()
        fx, fy = (x - x0)[:, None], (y - y0)[:, None]
        col = (photo[y0, x0] * (1 - fx) * (1 - fy) + photo[y0, x0 + 1] * fx * (1 - fy)
               + photo[y0 + 1, x0] * (1 - fx) * fy + photo[y0 + 1, x0 + 1] * fx * fy)
        base_c = torch.tensor(base_img.reshape(-1, 3)[tid[idx].cpu().numpy()], dtype=torch.float32, device=DEV)
        if a.gain:  # robust per-channel exposure gain of this photo relative to the (multi-view averaged) point colours
            g = (base_c.median(0).values / col.median(0).values.clamp_min(1.0)).clamp(0.6, 1.6)
            col = (col * g).clamp(0, 255)
        # frontal + close views win; (diag/z)^2 ranks views like (f/z)^2 but stays O(1), so w**sharpen cannot overflow
        w = cosv[idx] ** 4 * (diag / z[idx]) ** 2
        acc[idx] += w[:, None] ** a.sharpen * col
        wsum[idx] += w ** a.sharpen
        wmax[idx] = torch.maximum(wmax[idx], w)
        # sanity: agreement of this photo with the point-baked texture where seen (frame / alignment check)
        report.append((v["name"], int(len(idx)), float((col - base_c).abs().mean())))
        used += 1
    seen = wsum > 0
    out = base_img.reshape(-1, 3).astype(np.float32).copy()
    seen &= torch.isfinite(wsum) & torch.isfinite(acc).all(1)
    new = (acc[seen] / wsum[seen][:, None]).clamp(0, 255).cpu().numpy()
    out[tid[seen].cpu().numpy()] = new
    img = out.reshape(H, W, 3).astype(np.uint8)
    img, _ = dilate_image(img, cov.view(H, W).cpu().numpy(), iters=8)
    errs = [r[2] for r in report]
    print(f"[phototex] {used} views used; texels seen by >=1 photo: {seen.float().mean() * 100:.1f}%; "
          f"median |photo - point colour| per view {np.median(errs):.1f}", flush=True)

    dst.mkdir(parents=True, exist_ok=True)
    io.write_textured_obj(dst / "method_texture", np.asarray(V.cpu()), F_np, np.asarray(VT), np.asarray(FT), img)
    shutil.copy2(src / "geometry.ply", dst / "geometry.ply")
    info = json.loads((src / "method_info.json").read_text())
    info["method_name"] = info.get("method_name", "") + " + photo texture"
    info["texture"] = {"method": "photo-based multi-view texturing (ours)", "views_used": used,
                       "texels_seen_pct": round(float(seen.float().mean() * 100), 1), "model": str(a.model),
                       "masks": bool(a.masks), "two_sided": bool(a.two_sided), "gain": bool(a.gain), "tex_size": int(W), "weights": "cos^4 * (diag/z)^2, sharpened ^%g" % a.sharpen,
                       "per_view_check": sorted(report, key=lambda r: -r[1])[:10], "seconds": round(time.time() - t0, 1)}
    (dst / "method_info.json").write_text(json.dumps(info, indent=1))
    print(f"[phototex] wrote {dst} in {time.time() - t0:.1f}s", flush=True)


if __name__ == "__main__":
    main()
