"""Package the best run of every method for each input into results/<dataset>.zip for the CPU-only viewer.

Each run is stored viewer-sized: mesh.obj (<= --max-faces, decimated with the texture re-baked), mesh.mtl,
texture.jpg, metrics.json, method_info.json, manifest.json and the preview renders. Full-resolution meshes stay
with the training outputs. Run on a machine with the outputs:  python -m surface.scripts.package_results <out_dir>
"""
import argparse
import json
import os
import subprocess
import sys
import zipfile
from pathlib import Path

DATA = Path(os.environ.get("CV802_SP2_DATA_ROOT", f"/l/users/{os.environ.get('USER', '')}/cv802_sp2"))
DATASETS = {  # name -> (outputs dir, input cloud file, label)
    "vggsfm": ("outputs", "light_shirt_vggsfm_clean.ply", "VGGSfM (mask-cleaned)"),
    "mvs": ("outputs_mvs", "light_shirt_mvs_e10.ply", "MVS (COLMAP E10)"),
    "mvs_clean": ("outputs_mvs_clean", "light_shirt_mvs_e10_clean.ply", "MVS (floaters removed)"),
}
PREVIEWS = ("preview_front.png", "preview_back.png", "preview_left.png", "preview_right.png", "preview_shaded.png",
            "preview_shaded_grid.png", "thumb.png")

ap = argparse.ArgumentParser()
ap.add_argument("out_dir", help="where the .zip files are written (e.g. <repo>/results)")
ap.add_argument("--max-faces", type=int, default=200000)
ap.add_argument("--max-zip-mb", type=float, default=95.0)
a = ap.parse_args()
out = Path(a.out_dir)
out.mkdir(parents=True, exist_ok=True)
summary = {}
for ds, (sub, cloud, label) in DATASETS.items():
    root = DATA / sub
    runs = []
    for m in sorted(p for p in root.iterdir() if (p / "latest").exists()):
        run = m / (m / "latest").read_text().strip()
        if (run / "manifest.json").exists():
            runs.append(run)
    # viewer-sized copies (decimate + re-bake texture where needed)
    subprocess.run([sys.executable, "-m", "surface.scripts.make_display", *map(str, runs), "--max-faces", str(a.max_faces)], check=True)
    zp = out / f"{ds}.zip"
    rows = []
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for run in runs:
            man = json.loads((run / "manifest.json").read_text())
            rid = f"{ds}__{run.name}"
            base = f"{ds}/{man['method_id']}/{rid}/"
            obj = (run / "display.obj").read_text().replace("mtllib display.mtl", "mtllib mesh.mtl")
            z.writestr(base + "mesh.obj", obj)
            z.writestr(base + "mesh.mtl", (run / "display.mtl").read_text().replace("display.jpg", "texture.jpg"))
            z.write(run / "display.jpg", base + "texture.jpg")
            for f in ("metrics.json", "method_info.json", *PREVIEWS):
                if (run / f).exists():
                    z.write(run / f, base + f)
            man.update({"run_id": rid, "dataset": ds, "dataset_label": label, "source_run": run.name,
                        "input": {**man.get("input", {}), "path": f"surface/inputs/{cloud}"},
                        "viewer_copy": {"faces_max": a.max_faces, "texture": "texture.jpg",
                                        "note": "decimated display copy; metrics refer to the full-resolution mesh"}})
            man["files"] = [{"path": n} for n in ("mesh.obj", "mesh.mtl", "texture.jpg", "metrics.json", "method_info.json")]
            z.writestr(base + "manifest.json", json.dumps(man, indent=1))
            k = man["metrics"]
            rows.append({"method_id": man["method_id"], "method": man.get("method_name"), "run": run.name,
                         "faces": k["faces"], "chamfer_pct": k["chamfer_pct_diag"], "f1": k["fscore_1pct"],
                         "f05": k["fscore_0_5pct"], "watertight": k["watertight"], "psnr": k["color_psnr_db"]})
    mb = zp.stat().st_size / 2 ** 20
    print(f"{ds}: {len(runs)} runs -> {zp} ({mb:.1f} MB)")
    if mb > a.max_zip_mb:
        print(f"WARNING {zp} is {mb:.0f} MB > {a.max_zip_mb} MB; lower --max-faces")
    summary[ds] = {"label": label, "runs": rows, "zip_mb": round(mb, 1)}
(out / "summary.json").write_text(json.dumps(summary, indent=1))
print("wrote", out / "summary.json")
