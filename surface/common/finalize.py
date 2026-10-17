"""Turn a method's geometry.ply into the Sub-project 2 deliverable (see docs/CONTRACT.md).

python -m surface.common.finalize <run_dir> [--color-source points|vertex|method] [--tex-size 2048]
Writes mesh.obj/mesh.mtl/texture.png, metrics.json, previews and manifest.json (last).
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import time
from pathlib import Path

import numpy as np

from surface.common import geom, io, paths
from surface.common.knn import knn
from surface.common.normals import estimate_normals
from surface.common.render import render_previews
from surface.common.texture import bake_texture, sample_texture


def progress(run_dir: Path, percent: int, stage: str, message: str = "") -> None:
    tmp = run_dir / "progress.json.tmp"
    tmp.write_text(json.dumps({"percent": percent, "stage": stage, "message": message}))
    os.replace(tmp, run_dir / "progress.json")


def input_normals(xyz):
    cache = paths.input_normals_cache()
    if cache.exists():
        return np.load(cache)["normals"]
    n = None
    try:  # inputs that carry oriented normals (COLMAP MVS: oriented towards the cameras) keep them
        from plyfile import PlyData
        v = PlyData.read(str(paths.input_ply()))["vertex"]
        if {"nx", "ny", "nz"} <= set(v.data.dtype.names):
            n = np.stack([v["nx"], v["ny"], v["nz"]], 1).astype(np.float64)
            n /= np.linalg.norm(n, axis=1, keepdims=True).clip(1e-12)
    except Exception:
        n = None
    if n is None:
        n = estimate_normals(xyz)
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.savez(cache, normals=n)
    return n


def mesh_stats(V, F) -> dict:
    import trimesh

    m = trimesh.Trimesh(V, F, process=False)
    edges = np.sort(F[:, [0, 1, 1, 2, 2, 0]].reshape(-1, 2), axis=1)
    _, counts = np.unique(edges, axis=0, return_counts=True)
    comps = trimesh.graph.connected_components(m.face_adjacency, nodes=np.arange(len(F)))
    return {
        "vertices": int(len(V)), "faces": int(len(F)),
        "watertight": bool(m.is_watertight), "winding_consistent": bool(m.is_winding_consistent),
        "boundary_edges": int((counts == 1).sum()), "non_manifold_edges": int((counts > 2).sum()),
        "connected_components": int(len(comps)), "surface_area": float(m.area),
    }


def geometry_metrics(V, F, xyz, nrm, diag, n_samples=200_000) -> dict:
    samp, sface, _ = geom.sample_surface(V, F, n_samples, seed=0)
    d_m2p, idx = knn(samp, xyz, k=1)                       # mesh -> points (accuracy)
    d_m2p, idx = np.asarray(d_m2p).ravel(), np.asarray(idx).ravel()
    d_p2m, face, bary, _ = geom.closest_points_on_mesh(V, F, xyz)  # points -> mesh (completeness)
    d_p2m = np.asarray(d_p2m)
    out = {"bbox_diagonal": float(diag)}
    for name, d in (("mesh_to_points", d_m2p), ("points_to_mesh", d_p2m)):
        out[name] = {"mean": float(d.mean()), "median": float(np.median(d)), "p95": float(np.percentile(d, 95)),
                     "mean_pct_diag": float(100 * d.mean() / diag)}
    out["chamfer_l1"] = float(0.5 * (d_m2p.mean() + d_p2m.mean()))
    out["chamfer_pct_diag"] = float(100 * out["chamfer_l1"] / diag)
    for pct in (0.5, 1.0):
        t = diag * pct / 100
        p, r = float((d_m2p < t).mean()), float((d_p2m < t).mean())
        out[f"fscore@{pct}%"] = {"precision": p, "recall": r, "f": 0 if p + r == 0 else 2 * p * r / (p + r)}
    fn = geom.face_normals(V, F)[np.asarray(sface)]
    out["normal_consistency"] = float(np.abs((fn * nrm[idx]).sum(1)).mean())
    return out, np.asarray(face), np.asarray(bary)


def texture_metrics(tm, xyz, rgb, face, bary) -> dict:
    # Colour of the texture at the closest surface point of each input point vs that point's RGB.
    uv = (tm.VT[tm.FT[face]] * bary[:, :, None]).sum(1)
    col = sample_texture(tm.image, uv)
    err = col - rgb.astype(np.float64)
    mse = float((err ** 2).mean())
    return {"mae_rgb": float(np.abs(err).mean()), "psnr_db": float(10 * np.log10(255 ** 2 / max(mse, 1e-9)))}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir")
    ap.add_argument("--color-source", default="points", choices=["points", "vertex", "method"])
    ap.add_argument("--tex-size", type=int, default=2048)
    a = ap.parse_args()
    run = Path(a.run_dir).resolve()
    t0 = time.time()
    (run / "manifest.json").unlink(missing_ok=True)
    progress(run, 90, "finalize", "loading geometry")
    xyz, rgb = io.read_point_cloud(paths.input_ply())
    diag = geom.bbox_diagonal(xyz)
    if a.color_source == "method":
        V, F, mVT, mFT, mimg = io.read_textured_obj(run / "method_texture" / "mesh.obj")
        vrgb = None
    else:
        V, F, vrgb = io.read_mesh(run / "geometry.ply")
    if a.color_source == "method":  # keep the method's own UV layout untouched
        V, F, clean_info = np.asarray(V, np.float64), np.asarray(F, np.int64), {"skipped": "method texture"}
    else:
        V, F, vrgb, clean_info = geom.clean_mesh(np.asarray(V, np.float64), np.asarray(F, np.int64), vrgb)
    if a.color_source == "vertex" and vrgb is None:
        raise SystemExit("--color-source vertex needs per-vertex colours in geometry.ply")

    progress(run, 92, "finalize", "texturing")
    if a.color_source == "method":
        from surface.common.texture import TexturedMesh
        tm = TexturedMesh(V, F, np.asarray(mVT), np.asarray(mFT), np.asarray(mimg), {"source": "method"})
    else:
        tm = bake_texture(V, F, xyz=xyz, rgb=rgb, vertex_rgb=vrgb, color_source=a.color_source, tex_size=a.tex_size)
    io.write_textured_obj(run, tm.V, tm.F, tm.VT, tm.FT, tm.image, VN=geom.vertex_normals(tm.V, tm.F))

    progress(run, 95, "finalize", "metrics")
    nrm = input_normals(xyz)
    gm, face, bary = geometry_metrics(V, F, xyz, nrm, diag)
    metrics = {"geometry": gm, "mesh": mesh_stats(V, F), "texture": texture_metrics(tm, xyz, rgb, face, bary),
               "clean": clean_info, "color_source": a.color_source}
    (run / "metrics.json").write_text(json.dumps(metrics, indent=1))

    progress(run, 97, "finalize", "rendering previews")
    render_previews(run, tm.V, tm.F, VT=tm.VT, FT=tm.FT, image=tm.image)

    info = json.loads((run / "method_info.json").read_text()) if (run / "method_info.json").exists() else {}
    method_id = info.get("method_id", run.parent.name)
    files = []
    for f in sorted(run.iterdir()):
        if f.is_file() and f.name not in ("manifest.json", "progress.json"):
            files.append({"path": f.name, "bytes": f.stat().st_size, "sha256": io.sha256_file(f)})
    manifest = {
        "schema_version": 1, "method_id": method_id, "method_name": info.get("method_name", method_id),
        "run_id": run.name, "status": "complete",
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "input": {"path": str(paths.input_ply()), "sha256": io.sha256_file(paths.input_ply()), "point_count": int(len(xyz))},
        "mesh": {"vertices": int(len(V)), "faces": int(len(F))},
        "texture": {"size": int(tm.image.shape[0]), "color_source": a.color_source},
        "files": files, "method_info": info,
        "metrics": {"chamfer_pct_diag": gm["chamfer_pct_diag"], "fscore_1pct": gm["fscore@1.0%"]["f"],
                    "fscore_0_5pct": gm["fscore@0.5%"]["f"], "normal_consistency": gm["normal_consistency"],
                    "color_psnr_db": metrics["texture"]["psnr_db"], "watertight": metrics["mesh"]["watertight"],
                    "faces": int(len(F))},
        "finalize_seconds": round(time.time() - t0, 1),
    }
    (run / "manifest.json").write_text(json.dumps(manifest, indent=1))
    (run.parent / "latest").write_text(run.name + "\n")
    progress(run, 100, "complete", f"{len(F)} faces, chamfer {gm['chamfer_pct_diag']:.3f}% diag")
    print(json.dumps(manifest["metrics"], indent=1))


if __name__ == "__main__":
    main()
