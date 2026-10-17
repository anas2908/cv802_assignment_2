"""Input preparation / output de-normalisation shared by the third-party method wrappers (base env).

prep: subsample the input cloud, rotate it into the person frame (x=left, y=up, z=front), normalise it,
      and write it in the format a method expects, plus transform.json.
post: map a method's output mesh back to the VGGSfM world frame and write geometry.ply + method_info.json.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from surface.common import io, paths
from surface.common.render import view_frame


def input_normals(xyz):
    from surface.common.finalize import input_normals as cached
    return cached(xyz)


def fps(xyz, n, seed=0):
    import torch

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    p = torch.tensor(xyz, dtype=torch.float32, device=dev)
    idx = torch.zeros(n, dtype=torch.long, device=dev)
    d = torch.full((len(p),), float("inf"), device=dev)
    idx[0] = int(np.random.default_rng(seed).integers(len(p)))
    for i in range(1, n):
        d = torch.minimum(d, ((p - p[idx[i - 1]]) ** 2).sum(1))
        idx[i] = torch.argmax(d)
    return idx.cpu().numpy()


def prep(a):
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    if a.from_mesh:
        return prep_mesh(a)
    xyz, rgb = io.read_point_cloud(paths.input_ply())
    nrm = input_normals(xyz)
    fr = view_frame()
    R = np.stack([fr["left"], fr["up"], fr["front"]]) if a.rotate else np.eye(3)
    rng = np.random.default_rng(a.seed)
    if a.n and a.n < len(xyz):
        idx = fps(xyz, a.n, a.seed) if a.mode == "fps" else rng.choice(len(xyz), a.n, replace=False)
        if a.extremes:  # keep per-axis extremes so the method's own bbox normalisation is reproducible
            c = (xyz - xyz.mean(0)) @ R.T
            ext = np.unique(np.concatenate([c.argmin(0), c.argmax(0)]))
            idx = np.concatenate([ext, idx[~np.isin(idx, ext)][: a.n - len(ext)]])
        xyz, rgb, nrm = xyz[idx], rgb[idx], nrm[idx]
    p = xyz @ R.T
    n = nrm @ R.T
    lo, hi = p.min(0), p.max(0)
    center = (lo + hi) / 2
    q = p - center
    if a.norm == "sap":             # Shape-As-Points convention: mean-centred, max |coord| = 0.9 (identity for SAP)
        q = p - p.mean(0)
        center = p.mean(0)
        s = 0.9 / np.abs(q).max()
    elif a.norm == "maxabs":          # MeshAnything convention: max |coord| = 0.9995
        s = 0.9995 / np.abs(q).max()
    elif a.norm == "diag1":         # ShapeNet-style unit bounding-box diagonal
        s = 1.0 / np.linalg.norm(hi - lo)
    elif a.norm == "unit":          # largest extent = 1
        s = 1.0 / (hi - lo).max()
    else:
        s = 1.0
    q = q * s
    f = out / a.name
    if a.fmt == "npy_normals":
        np.save(f, np.concatenate([q, n], 1).astype(np.float32))
    elif a.fmt == "xyz_normals":
        np.savetxt(f, np.concatenate([q, n], 1), fmt="%.6f")
    elif a.fmt == "ply":
        with open(f, "w") as fh:
            fh.write(f"ply\nformat ascii 1.0\nelement vertex {len(q)}\nproperty float x\nproperty float y\n"
                     "property float z\nend_header\n")
            np.savetxt(fh, q, fmt="%.6f")
    elif a.fmt == "ply_normals":
        with open(f, "w") as fh:
            fh.write(f"ply\nformat ascii 1.0\nelement vertex {len(q)}\nproperty float x\nproperty float y\nproperty float z\n"
                     "property float nx\nproperty float ny\nproperty float nz\nproperty uchar red\nproperty uchar green\n"
                     "property uchar blue\nend_header\n")
            for (x, y, z), (u, v, w), (r_, g_, b_) in zip(q, n, rgb):
                fh.write(f"{x:.6f} {y:.6f} {z:.6f} {u:.5f} {v:.5f} {w:.5f} {r_} {g_} {b_}\n")
    elif a.fmt == "obj_color":
        with open(f, "w") as fh:
            np.savetxt(fh, np.concatenate([q, rgb / 255.0], 1), fmt="v %.6f %.6f %.6f %.4f %.4f %.4f")
    (out / "transform.json").write_text(json.dumps({"R": R.tolist(), "center": center.tolist(), "scale": float(s),
                                                    "n_points": int(len(q)), "file": f.name,
                                                    "extent_max": float((q.max(0) - q.min(0)).max())}))
    print(f"prep: wrote {f} ({len(q)} points, scale {s:.4f})")


def prep_mesh(a):
    """Rotate a dense mesh into the person frame (y = up) and normalise it like the point path."""
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    V, F, _ = io.read_mesh(a.from_mesh)
    fr = view_frame()
    R = np.stack([fr["left"], fr["up"], fr["front"]]) if a.rotate else np.eye(3)
    p = np.asarray(V, np.float64) @ R.T
    lo, hi = p.min(0), p.max(0)
    center = (lo + hi) / 2
    q = p - center
    s = 0.9995 / np.abs(q).max() if a.norm == "maxabs" else 1.0
    q = q * s
    f = out / a.name
    with open(f, "w") as fh:
        np.savetxt(fh, q, fmt="v %.6f %.6f %.6f")
        np.savetxt(fh, np.asarray(F) + 1, fmt="f %d %d %d")
    (out / "transform.json").write_text(json.dumps({"R": R.tolist(), "center": center.tolist(), "scale": float(s),
                                                    "file": f.name, "source_mesh": str(a.from_mesh),
                                                    "extent_max": float((q.max(0) - q.min(0)).max())}))
    print(f"prep: wrote mesh {f} ({len(V)} vertices, {len(F)} faces, scale {s:.4f})")


def post(a):
    t = json.loads(Path(a.transform).read_text())
    V, F, vrgb = io.read_mesh(a.mesh)
    R, c, s = np.array(t["R"]), np.array(t["center"]), t["scale"]
    V = np.asarray(V, np.float64)
    ratio = (V.max(0) - V.min(0)).max() / t["extent_max"]
    if not 0.67 < ratio < 1.5:  # output lives in a different normalised range than the input we gave
        print(f"post: WARNING output extent / input extent = {ratio:.3f}; rescaling about the bbox centre")
        mid = (V.max(0) + V.min(0)) / 2
        V = (V - mid) / ratio
        t["rescaled_by"] = float(1 / ratio)
    Vw = (np.asarray(V, np.float64) / s + c) @ R      # inverse of q = s * (R p - center)
    run = Path(a.run)
    io.write_mesh_ply(run / "geometry.ply", Vw, np.asarray(F), vrgb)
    info = json.loads(Path(a.info).read_text()) if a.info and Path(a.info).exists() else {}
    info.update({"method_id": a.method_id, "method_name": a.method_name, "input_transform": t,
                 "output_vertices": int(len(Vw)), "output_faces": int(len(F))})
    (run / "method_info.json").write_text(json.dumps(info, indent=1))
    print(f"post: geometry.ply with {len(Vw)} vertices, {len(F)} faces")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("prep")
    p.add_argument("--out", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--n", type=int, default=0)
    p.add_argument("--mode", default="fps", choices=["fps", "random"])
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--rotate", action="store_true")
    p.add_argument("--extremes", action="store_true")
    p.add_argument("--norm", default="none", choices=["none", "maxabs", "diag1", "unit", "sap"])
    p.add_argument("--fmt", required=True, choices=["npy_normals", "xyz_normals", "ply", "obj_color", "obj_mesh", "ply_normals"])
    p.add_argument("--from-mesh", default=None, help="prepare this dense mesh instead of the point cloud")
    q = sub.add_parser("post")
    q.add_argument("--mesh", required=True)
    q.add_argument("--transform", required=True)
    q.add_argument("--run", required=True)
    q.add_argument("--method-id", required=True)
    q.add_argument("--method-name", required=True)
    q.add_argument("--info")
    a = ap.parse_args()
    prep(a) if a.cmd == "prep" else post(a)


if __name__ == "__main__":
    main()
