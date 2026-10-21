"""Close-up crops for the slides: the input points and each method's best VGGSfM mesh (shaded geometry), rendered
front-on at high resolution with one camera, then cut to the same face / crossed-arms / feet boxes.

python -m surface.docs.deliverables.make_closeups     (base env, on a GPU node, from the repo root)
Writes surface/docs/deliverables/slides/assets/closeups/<face|arms|feet>_<method>.jpg
"""
import json
import os
from pathlib import Path

import numpy as np
import torch
from PIL import Image

os.environ.setdefault("CV802_SP2_FRONT_FLIP", "1")          # the VGGSfM frame (same as every preview)
from surface.common import io
from surface.common.render import make_camera, render_mesh, render_points, view_frame
from surface.docs.deliverables import resmodel as rm

HERE = Path(__file__).resolve().parent
OUT = HERE / "slides" / "assets" / "closeups"
SIZE = (1800, 2400)
BOX = {"face": (780, 150, 1110, 480), "arms": (570, 540, 1230, 960), "feet": (570, 1980, 1260, 2340)}


def crops(img, name):
    for k, b in BOX.items():
        img.crop(b).save(OUT / f"{k}_{name}.jpg", quality=92)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    xyz, rgb = io.read_point_cloud(HERE.parents[1] / "inputs" / "light_shirt_vggsfm_clean.ply")
    cam = make_camera(view_frame(xyz, rgb, use_cache=True), "front")
    crops(Image.fromarray(render_points(xyz, rgb, cam, size=SIZE, radius_px=3.6, device=dev)), "points")
    for m in rm.ORDER:
        r = rm.best("vggsfm", m)
        d = Path(r["dir"])
        geo = d.parent / d.name.replace("-phototex2", "").replace("-phototex", "") / "geometry.ply"   # same geometry
        V, F = io.read_mesh(geo if geo.exists() else d / "geometry.ply")[:2]
        crops(Image.fromarray(render_mesh(np.asarray(V), np.asarray(F), cam, size=SIZE, mode="shaded", device=dev)), m)
        print(m, len(F), flush=True)


if __name__ == "__main__":
    main()
