"""Markdown results tables for the README from results/summary.json (written by package_results.py)."""
import json
import sys
from pathlib import Path

NAMES = {"poisson": "Screened Poisson (own implementation)", "ier": "IER meshing (ECCV'20)", "point2mesh": "Point2Mesh (SIGGRAPH'20)",
         "meshanything": "MeshAnything V2 ('24)", "dhsp": "Deep Hybrid Self-Prior (ICCV'21)", "nksr": "NKSR (CVPR'23) *",
         "sap": "Shape As Points (NeurIPS'21) *", "twodgs": "2D Gaussian Splatting (SIGGRAPH'24) *"}
ORDER = list(NAMES)
s = json.loads(Path(sys.argv[1] if len(sys.argv) > 1 else "results/summary.json").read_text())
cols = [d for d in ("vggsfm", "mvs", "mvs_clean") if d in s]
by = {d: {r["method_id"]: r for r in s[d]["runs"]} for d in cols}

print("| Method | " + " | ".join(s[d]["label"] for d in cols) + " |")
print("|---|" + "---|" * len(cols))
for m in ORDER:
    cells = []
    for d in cols:
        r = by[d].get(m)
        cells.append("—" if r is None else f"{r['f1']:.3f} / {r['chamfer_pct']:.2f}%" + (" 🖨" if r["watertight"] else ""))
    if any(c != "—" for c in cells):
        print(f"| {NAMES[m]} | " + " | ".join(cells) + " |")
print()
print("Cells: F-score at 1 % of the bounding-box diagonal ↑ / Chamfer-L1 as % of the diagonal ↓, best run per method, "
      "measured against that input point cloud. 🖨 = watertight (3D-printable). * = extra method beyond the course list.")
