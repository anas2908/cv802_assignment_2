"""Collect the metrics of every finished run (all three inputs) into deliverables/results.json.

The report, the slides and the study notes are all generated from this file, so re-running
collect_results.py + build_all.sh after new runs finish refreshes every number (pending cells included).
python3 surface/docs/deliverables/collect_results.py     (stdlib only)
"""
import glob
import json
import os
from pathlib import Path

DATA = Path(os.environ.get("CV802_SP2_DATA_ROOT", f"/l/users/{os.environ.get('USER', '')}/cv802_sp2"))
DATASETS = {"vggsfm": "outputs", "mvs": "outputs_mvs", "mvs_clean": "outputs_mvs_clean"}
# DHSP's complete paper pipeline (re-mesh -> OptCuts -> 2D geometry prior -> refine -> 2D texture prior); while these
# runs are still training the documents show a placeholder instead of the 3D-prior-only numbers
DHSP_FULL = {"vggsfm": "dhsp-v5-lap1-remesh-optcuts", "mvs": "dhsp-v4-mvs-remesh-optcuts",
             "mvs_clean": "dhsp-v4-mvsclean-remesh-optcuts"}

out = {"datasets": {}, "dhsp_full": DHSP_FULL}
for ds, sub in DATASETS.items():
    runs = {}
    for p in sorted(glob.glob(str(DATA / sub / "*" / "*" / "manifest.json"))):
        m = json.loads(Path(p).read_text())
        k, mi = m["metrics"], m.get("method_info", {})
        latest = (Path(p).parent.parent / "latest")
        runs[m["run_id"]] = {
            "method": m["method_id"], "run": m["run_id"],
            "best": latest.exists() and latest.read_text().strip() == m["run_id"],
            "faces": k["faces"], "cd": k["chamfer_pct_diag"], "f1": k["fscore_1pct"], "f05": k["fscore_0_5pct"],
            "nc": k["normal_consistency"], "psnr": k["color_psnr_db"], "watertight": k["watertight"],
            "seconds": mi.get("elapsed_seconds"), "peak_gpu_mib": mi.get("peak_gpu_mib"),
            "texture": (mi.get("texture") or {}).get("method") if isinstance(mi.get("texture"), dict) else mi.get("texture"),
            "dir": str(Path(p).parent),
        }
        pr = Path(p).parent / "print" / "print_report.json"
        if pr.exists():
            runs[m["run_id"]]["print"] = json.loads(pr.read_text())
    out["datasets"][ds] = runs
Path(__file__).with_name("results.json").write_text(json.dumps(out, indent=1))
for ds, runs in out["datasets"].items():
    full = DHSP_FULL[ds]
    state = "done" if (full in runs or full + "-phototex2" in runs) else "PENDING"
    print(f"{ds:10s} {len(runs):3d} runs, best: {sum(r['best'] for r in runs.values())}, DHSP full pipeline: {state}")
