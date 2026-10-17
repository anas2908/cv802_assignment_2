"""Point DATA/outputs/<method>/latest at the complete run with the best F-score@1% and print a summary."""
import json
from pathlib import Path

from surface.common import paths

rows = []
for mdir in sorted(paths.outputs_root().iterdir()):
    runs = [json.loads(p.read_text()) for p in mdir.glob("*/manifest.json")]
    if not runs:
        continue
    # geometry first (F@1%, rounded so identical meshes tie); then prefer photo texture v2 > v1 > others
    tex_rank = lambda m: 2 if m["run_id"].endswith("-phototex2") else 1 if m["run_id"].endswith("-phototex") else 0
    # DHSP: the 3D-prior-only meshes score high on F-score but are crumpled (folded/flipped faces); the completed
    # paper pipeline (remesh + OptCuts + 2D refinement) has a clean surface, so it is preferred whenever it exists.
    stage = lambda m: 1 if (m["method_id"] == "dhsp" and "remesh-optcuts" in m["run_id"]) else 0
    best = max(runs, key=lambda m: (stage(m), round(m["metrics"]["fscore_1pct"], 4), tex_rank(m)))
    (mdir / "latest").write_text(best["run_id"] + "\n")
    for m in runs:
        k = m["metrics"]
        rows.append((m["method_id"], m["run_id"] + (" *" if m is best else ""), k["faces"], k["chamfer_pct_diag"],
                     k["fscore_1pct"], k["color_psnr_db"], k["watertight"]))
print(f"{'method':13s} {'run (* = latest)':34s} {'faces':>8s} {'CD %diag':>9s} {'F@1%':>6s} {'PSNR':>6s} watertight")
for r in rows:
    print(f"{r[0]:13s} {r[1]:34s} {r[2]:8d} {r[3]:9.3f} {r[4]:6.3f} {r[5]:6.1f} {r[6]}")
(paths.outputs_root() / "summary.json").write_text(json.dumps(rows, indent=1))
