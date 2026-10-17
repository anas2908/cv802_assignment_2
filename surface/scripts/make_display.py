"""Lightweight display copy of a finished run for the browser viewer (the full-resolution deliverable is untouched).

Meshes above --max-faces are decimated (quadric, fast_simplification); their texture is re-baked from the
full-resolution textured mesh onto a new UV atlas (closest point -> barycentric UV -> bilinear sample).
Writes <run>/display.obj, display.mtl, display.jpg.  python -m surface.scripts.make_display <run> [<run> ...]
"""
import argparse
import time
from pathlib import Path

import numpy as np
from PIL import Image

from surface.common import geom, io
from surface.common.texture import dilate_image, sample_texture, uv_atlas, uv_to_pixel
from surface.common.raster import rasterize

ap = argparse.ArgumentParser()
ap.add_argument("runs", nargs="+")
ap.add_argument("--max-faces", type=int, default=250000)
ap.add_argument("--tex", type=int, default=4096)
ap.add_argument("--quality", type=int, default=90)
a = ap.parse_args()


def write(run: Path, V, F, VT, FT, img):
    with open(run / "display.mtl", "w") as f:
        f.write("newmtl material0\nKa 1 1 1\nKd 1 1 1\nKs 0 0 0\nmap_Kd display.jpg\n")
    Image.fromarray(np.asarray(img).clip(0, 255).astype(np.uint8)).save(run / "display.jpg", quality=a.quality)
    with open(run / "display.obj", "w") as f:
        f.write("mtllib display.mtl\nusemtl material0\n")
        np.savetxt(f, V, fmt="v %.5f %.5f %.5f")
        np.savetxt(f, VT, fmt="vt %.5f %.5f")
        np.savetxt(f, np.concatenate([F + 1, FT + 1], 1)[:, [0, 3, 1, 4, 2, 5]], fmt="f %d/%d %d/%d %d/%d")


for r in a.runs:
    run = Path(r)
    t0 = time.time()
    if not (run / "mesh.obj").exists():
        print("skip (no mesh.obj):", run)
        continue
    if (run / "display.obj").exists() and (run / "display.obj").stat().st_mtime > (run / "mesh.obj").stat().st_mtime:
        print("up to date:", run)
        continue
    V, F, VT, FT, img = (np.asarray(x) for x in io.read_textured_obj(run / "mesh.obj"))
    if len(F) <= a.max_faces:
        write(run, V, F, VT, FT, img if img.shape[0] <= a.tex else np.asarray(Image.fromarray(img).resize((a.tex, a.tex), Image.LANCZOS)))
        print(f"{run.name}: {len(F)} faces kept, JPEG texture ({time.time() - t0:.0f}s)")
        continue
    import fast_simplification
    Vd, Fd = fast_simplification.simplify(V.astype(np.float32), F.astype(np.int64), 1 - a.max_faces / len(F))
    Vd, Fd = np.asarray(Vd, np.float64), np.asarray(Fd, np.int64)
    VTd, FTd, _ = uv_atlas(Vd, Fd, tex_size=a.tex)
    H = W = a.tex
    import torch
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    pix = torch.tensor(uv_to_pixel(VTd[FTd], H, W), dtype=torch.float32, device=dev)
    face, bary = rasterize(pix, H, W, border=1.0)
    face, bary = face.view(-1).cpu().numpy(), bary.view(-1, 3).double().cpu().numpy()
    cov = face >= 0
    pos = (bary[cov][:, :, None] * Vd[Fd[face[cov]]]).sum(1)
    _, fi, b, _ = geom.closest_points_on_mesh(V, F, pos)          # nearest point on the full-resolution surface
    uv = (VT[FT[np.asarray(fi)]] * np.asarray(b)[:, :, None]).sum(1)
    out = np.zeros((H * W, 3), np.float64)
    out[cov] = sample_texture(img, uv)
    tex = out.reshape(H, W, 3).clip(0, 255).astype(np.uint8)
    tex, _ = dilate_image(tex, cov.reshape(H, W), iters=8)
    tex = np.asarray(tex).clip(0, 255).astype(np.uint8)   # dilate_image returns floats; JPEG needs 8-bit
    write(run, Vd, Fd, VTd, FTd, tex)
    print(f"{run.name}: {len(F)} -> {len(Fd)} faces, texture re-baked ({time.time() - t0:.0f}s)")
