"""NKSR reconstruction of the light-shirt VGGSfM cloud (official API, as in examples/recons_colored_mesh.py)."""
import argparse
import json
import os
import time

import numpy as np
import torch
from plyfile import PlyData

import nksr
from nksr import fields

ap = argparse.ArgumentParser()
ap.add_argument("run_dir")
ap.add_argument("--input", required=True)
ap.add_argument("--normals", default="ours", choices=["ours", "nksr"], help="our PCA+MST normals or NKSR's estimator")
ap.add_argument("--detail", type=float, default=1.0, help="detail_level in [0, 1]")
ap.add_argument("--height-m", type=float, default=1.75, help="assumed person height: rescale to metric like the training data")
ap.add_argument("--mise-iter", type=int, default=2)
a = ap.parse_args()
t0 = time.time()
dev = torch.device("cuda:0")
v = PlyData.read(a.input)["vertex"]
xyz = np.stack([v["x"], v["y"], v["z"]], 1).astype(np.float64)
rgb = np.stack([v["red"], v["green"], v["blue"]], 1).astype(np.float32) / 255.0
s = a.height_m / (xyz.max(0) - xyz.min(0)).max()               # the person's height is the largest extent
c = xyz.mean(0)
X = torch.tensor((xyz - c) * s, dtype=torch.float32, device=dev)
C = torch.tensor(rgb, device=dev)
rec = nksr.Reconstructor(dev)
if a.normals == "ours":
    n = np.load(os.environ["NORMALS_NPZ"])["normals"]
    field = rec.reconstruct(X, torch.tensor(n, dtype=torch.float32, device=dev), detail_level=a.detail)
else:
    field = rec.reconstruct(X, detail_level=a.detail, preprocess_fn=nksr.get_estimate_normal_preprocess_fn(64, 85.0))
field.set_texture_field(fields.PCNNField(X, C))
mesh = field.extract_dual_mesh(max_points=2 ** 22, mise_iter=a.mise_iter)
V = mesh.v.detach().cpu().numpy() / s + c
F = mesh.f.detach().cpu().numpy().astype(np.int32)
col = (np.clip(mesh.c.detach().cpu().numpy(), 0, 1) * 255).astype(np.uint8)
with open(os.path.join(a.run_dir, "geometry.ply"), "wb") as f:
    f.write((f"ply\nformat binary_little_endian 1.0\nelement vertex {len(V)}\nproperty float x\nproperty float y\n"
             f"property float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nelement face {len(F)}\n"
             "property list uchar int vertex_indices\nend_header\n").encode())
    vd = np.zeros(len(V), dtype=[("p", "<f4", 3), ("c", "u1", 3)]); vd["p"] = V; vd["c"] = col; f.write(vd.tobytes())
    fd = np.zeros(len(F), dtype=[("n", "u1"), ("i", "<i4", 3)]); fd["n"] = 3; fd["i"] = F; f.write(fd.tobytes())
json.dump({"method_id": "nksr", "method_name": "NKSR: Neural Kernel Surface Reconstruction (CVPR 2023)",
           "paper": "Huang, Gojcic, Atzmon, Litany, Fidler, Williams. Neural Kernel Surface Reconstruction, CVPR 2023",
           "official_code": "https://github.com/nv-tlabs/NKSR", "commit": "e403368", "weights": "official pretrained kitchen-sink (ks)",
           "params": vars(a), "metric_scale": float(s), "elapsed_seconds": round(time.time() - t0, 1),
           "peak_gpu_mib": round(torch.cuda.max_memory_allocated() / 2 ** 20), "device": "cuda",
           "colour": "official PCNNField texture field (nearest-neighbour colour field of the input points)",
           "deviations": "input rescaled to an assumed 1.75 m person height (training data is metric), mapped back afterwards"},
          open(os.path.join(a.run_dir, "method_info.json"), "w"), indent=1)
print(f"NKSR: {len(V)} vertices, {len(F)} faces in {time.time() - t0:.1f}s")
