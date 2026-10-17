"""Build a 2DGS training scene from a COLMAP model + the light-shirt photos + person masks (base env, pycolmap).

out/images/<basename>  RGBA (person on a white background, alpha = undistorted person mask), max side --max-side
out/sparse/0/{cameras,images}.bin  undistorted PINHOLE cameras (same world frame as the model)
out/sparse/0/points3D.ply  initialisation = our input point cloud (x,y,z,nx,ny,nz,rgb), FPS/random-subsampled
"""
import argparse
import json
import os
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

from surface.common import io, paths
from surface.common.finalize import input_normals
from surface.common.phototex import find

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--model", required=True)
ap.add_argument("--images", required=True)
ap.add_argument("--masks", required=True)
ap.add_argument("--max-side", type=int, default=1200)
ap.add_argument("--init-points", type=int, default=200000)
a = ap.parse_args()

import pycolmap

out = Path(a.out)
if out.exists():
    shutil.rmtree(out)
raw, rawm = out / "_raw", out / "_rawmask"
rec = pycolmap.Reconstruction(a.model)
names = [im.name for im in rec.images.values()]
missing = 0
for nm in names:
    src, msk = find(Path(a.images), nm, (".jpg", ".JPG", ".jpeg", ".png")), find(Path(a.masks), nm, (".png",))
    if src is None or msk is None:
        missing += 1
        continue
    for root, target in ((raw, src), (rawm, msk)):
        p = root / nm
        p.parent.mkdir(parents=True, exist_ok=True)
        if not p.exists():
            os.symlink(os.path.abspath(target), p)
print(f"staged {len(names) - missing}/{len(names)} images (+ masks)")

und, undm = out / "_und", out / "_undm"
pycolmap.undistort_images(str(und), a.model, str(raw))
pycolmap.undistort_images(str(undm), a.model, str(rawm))

(out / "images").mkdir(parents=True)
(out / "sparse" / "0").mkdir(parents=True)
for f in ("cameras.bin", "images.bin", "points3D.bin"):
    if (und / "sparse" / f).exists():
        shutil.copy2(und / "sparse" / f, out / "sparse" / "0" / f)
done = 0
for nm in names:
    ip, mp = und / "images" / nm, undm / "images" / nm
    if not ip.exists() or not mp.exists():
        continue
    rgb = Image.open(ip).convert("RGB")
    m = Image.open(mp).convert("L").resize(rgb.size, Image.BILINEAR)
    s = min(1.0, a.max_side / max(rgb.size))
    if s < 1.0:   # uniform resize: 2DGS takes the field of view from the cameras, so intrinsics stay valid
        size = (round(rgb.size[0] * s), round(rgb.size[1] * s))
        rgb, m = rgb.resize(size, Image.LANCZOS), m.resize(size, Image.BILINEAR)
    r = np.asarray(rgb, np.float32)
    al = (np.asarray(m, np.float32) / 255.0)[..., None]
    comp = r * al + 255.0 * (1 - al)                     # person on white (train with --white_background)
    rgba = np.concatenate([comp, al * 255.0], 2).clip(0, 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(out / "images" / os.path.basename(nm), format="PNG")   # PNG data, original name
    done += 1
print(f"wrote {done} RGBA images")

xyz, rgb_pts = io.read_point_cloud(paths.input_ply())
nrm = input_normals(xyz)
if len(xyz) > a.init_points:
    idx = np.random.default_rng(0).choice(len(xyz), a.init_points, replace=False)
    xyz, rgb_pts, nrm = xyz[idx], rgb_pts[idx], nrm[idx]
from plyfile import PlyData, PlyElement
v = np.zeros(len(xyz), dtype=[("x", "f4"), ("y", "f4"), ("z", "f4"), ("nx", "f4"), ("ny", "f4"), ("nz", "f4"),
                              ("red", "u1"), ("green", "u1"), ("blue", "u1")])
v["x"], v["y"], v["z"] = xyz.T
v["nx"], v["ny"], v["nz"] = nrm.T
v["red"], v["green"], v["blue"] = rgb_pts.T
PlyData([PlyElement.describe(v, "vertex")]).write(str(out / "sparse" / "0" / "points3D.ply"))

# scene scale for TSDF meshing: camera distances to the cloud centre and the cloud diagonal
centre = (xyz.min(0) + xyz.max(0)) / 2
diag = float(np.linalg.norm(xyz.max(0) - xyz.min(0)))
dists = [float(np.linalg.norm(-(im.cam_from_world() if callable(im.cam_from_world) else im.cam_from_world).rotation.matrix().T
                              @ (im.cam_from_world() if callable(im.cam_from_world) else im.cam_from_world).translation - centre))
         for im in rec.images.values()]
json.dump({"images": done, "init_points": int(len(xyz)), "diag": diag, "centre": centre.tolist(),
           "cam_dist_max": max(dists), "cam_dist_median": float(np.median(dists))}, open(out / "scene.json", "w"), indent=1)
shutil.rmtree(raw), shutil.rmtree(rawm)
print(json.load(open(out / "scene.json")))
