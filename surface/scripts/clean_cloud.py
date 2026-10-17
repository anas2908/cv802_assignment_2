"""Outlier cleanup for a coloured point cloud (keeps normals): statistical outlier removal + removal of small
disconnected clusters (floaters). Our implementation (scipy KD-tree + connected components).

python -m surface.scripts.clean_cloud <in.ply> <out.ply> [--k 16] [--std 2.0] [--radius-mult 4] [--min-cluster 0.01]
"""
import argparse
import json

import numpy as np
from plyfile import PlyData, PlyElement
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree

ap = argparse.ArgumentParser()
ap.add_argument("inp")
ap.add_argument("out")
ap.add_argument("--k", type=int, default=16)
ap.add_argument("--std", type=float, default=2.0, help="drop points whose mean kNN distance > mean + std*sigma")
ap.add_argument("--radius-mult", type=float, default=4.0, help="cluster link radius = mult * median spacing")
ap.add_argument("--min-cluster", type=float, default=0.01, help="drop clusters smaller than this fraction of points")
a = ap.parse_args()

ply = PlyData.read(a.inp)
v = ply["vertex"].data
xyz = np.stack([v["x"], v["y"], v["z"]], 1).astype(np.float64)
tree = cKDTree(xyz)
d, _ = tree.query(xyz, k=a.k + 1, workers=-1)
md = d[:, 1:].mean(1)
keep = md < md.mean() + a.std * md.std()
print(f"statistical outliers: {(~keep).sum()} of {len(xyz)}")

idx = np.nonzero(keep)[0]
sub = xyz[idx]
r = a.radius_mult * float(np.median(d[:, 1]))
pairs = cKDTree(sub).query_pairs(r, output_type="ndarray")
g = coo_matrix((np.ones(len(pairs)), (pairs[:, 0], pairs[:, 1])), shape=(len(sub), len(sub)))
n, lab = connected_components(g, directed=False)
cnt = np.bincount(lab)
big = cnt[lab] >= a.min_cluster * len(sub)
print(f"clusters: {n}; removed {(~big).sum()} points in {(cnt < a.min_cluster * len(sub)).sum()} small clusters (link radius {r:.4f})")
final = idx[big]
PlyData([PlyElement.describe(v[final], "vertex")], text=False).write(a.out)
report = {"input": a.inp, "output": a.out, "points_in": int(len(xyz)), "points_out": int(len(final)),
          "statistical_outliers": int((~keep).sum()), "floater_points": int((~big).sum()), "params": vars(a)}
open(a.out.replace(".ply", ".cleanup.json"), "w").write(json.dumps(report, indent=1))
print(json.dumps(report))
