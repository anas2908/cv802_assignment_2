"""Markdown results table over every finished run of one dataset.

python -m surface.scripts.results_table [--outputs DIR] [--best-only]
"""
import argparse
import json
from pathlib import Path

from surface.common import paths

ap = argparse.ArgumentParser()
ap.add_argument("--outputs", default=None)
ap.add_argument("--best-only", action="store_true")
a = ap.parse_args()
root = Path(a.outputs) if a.outputs else paths.outputs_root()

print("| Method | Run | Faces | Chamfer % diag ↓ | F@1% ↑ | F@0.5% ↑ | Normal cons. ↑ | Colour PSNR ↑ | Method time | Printable |")
print("|---|---|---|---|---|---|---|---|---|---|")
for m in sorted(p for p in root.iterdir() if p.is_dir()):
    latest = (m / "latest").read_text().strip() if (m / "latest").exists() else None
    for r in sorted(m.glob("*/manifest.json")):
        d = json.loads(r.read_text())
        best = d["run_id"] == latest
        if a.best_only and not best:
            continue
        k = d["metrics"]
        pr = r.parent / "print" / "print_report.json"
        printable = json.loads(pr.read_text())["printable"] if pr.exists() else None
        t = d["method_info"].get("elapsed_seconds")
        row = [d["method_name"], ("**" + d["run_id"] + "**") if best else d["run_id"], f"{k['faces']:,}",
               f"{k['chamfer_pct_diag']:.3f}", f"{k['fscore_1pct']:.3f}", f"{k['fscore_0_5pct']:.3f}",
               f"{k['normal_consistency']:.2f}", f"{k['color_psnr_db']:.1f}", f"{t:.0f} s" if isinstance(t, (int, float)) else "—",
               {True: "yes", False: "no", None: "—"}[printable]]
        print("| " + " | ".join(row) + " |")
