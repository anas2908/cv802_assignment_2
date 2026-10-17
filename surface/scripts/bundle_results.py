"""Copy one representative finished run per method and dataset into surface/results/ for the read-only viewer
(scripts/run_viewer_local.sh). Large intermediates stay on Lustre. Run ids are prefixed with the dataset."""
import json
import shutil
from pathlib import Path

from surface.common import paths

DATA = paths.data_root()
OUT = paths.SURFACE_ROOT / "results"
PICK = {  # dataset -> outputs dir, runs (moderate size; full-resolution runs remain on Lustre)
    "vggsfm": ("outputs", ["poisson/poisson-v1-r256-a4-t2", "nksr/nksr-v3-ours-d05-mise1", "ier/ier-v1-p12500",
                           "dhsp/dhsp-v1-3dprior", "meshanything/meshanything-v2-mesh-mc7-greedy",
                           "point2mesh/point2mesh-v3-paper-unoriented"]),
    "mvs": ("outputs_mvs", ["poisson/poisson-v1-r256-a4-t2", "nksr/nksr-v3-ours-d05-mise1", "ier/ier-v1-p12500",
                            "dhsp/dhsp-v1-mvs", "meshanything/meshanything-v2-mesh-mc7-greedy",
                            "point2mesh/point2mesh-v3-paper-unoriented"]),
}
KEEP = ("mesh.obj", "mesh.mtl", "texture.png", "metrics.json", "method_info.json", "thumb.png")
if OUT.exists():
    shutil.rmtree(OUT)
total = 0
for ds, (sub, runs) in PICK.items():
    for r in runs:
        src = DATA / sub / r
        method, run = r.split("/")
        dst = OUT / ds / method / f"{ds}__{run}"
        dst.mkdir(parents=True)
        files = [f for f in src.iterdir() if f.name in KEEP or f.name.startswith("preview_")]
        for f in files:
            shutil.copy2(f, dst / f.name)
            total += f.stat().st_size
        m = json.loads((src / "manifest.json").read_text())
        m["run_id"] = f"{ds}__{run}"
        m["bundle"] = {"dataset": ds, "source_run": str(src), "note": "display bundle; full run (logs, geometry.ply, print/) on Lustre"}
        m["input"]["path"] = f"surface/inputs/{Path(m['input']['path']).name}"
        m["files"] = [x for x in m["files"] if (dst / x["path"]).exists()]
        (dst / "manifest.json").write_text(json.dumps(m, indent=1))
        print(f"{ds:7s} {method:13s} {run:38s} {sum(f.stat().st_size for f in dst.iterdir()) / 1e6:6.1f} MB")
print(f"total {total / 1e6:.0f} MB -> {OUT}")
