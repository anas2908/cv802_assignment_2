"""Make a finished run 3D-printable: z-up, feet on the build plate, real-world size, printability checks.

python -m surface.scripts.print_export <run_dir> [--height-mm 180] [--mesh geometry.ply]
Writes <run_dir>/print/{figure.stl, figure.obj+mtl+texture.png (if the run is textured), print_report.json}.
The STL is the mesh actually checked; it is only rotated, translated and uniformly scaled (no remeshing).
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

import numpy as np
import trimesh

from surface.common import io
from surface.common.render import view_frame


def checks(m: trimesh.Trimesh) -> dict:
    edges = np.sort(m.faces[:, [0, 1, 1, 2, 2, 0]].reshape(-1, 2), axis=1)
    _, counts = np.unique(edges, axis=0, return_counts=True)
    ext = m.bounds[1] - m.bounds[0]
    return {
        "watertight": bool(m.is_watertight), "winding_consistent": bool(m.is_winding_consistent),
        "is_volume": bool(m.is_volume), "boundary_edges": int((counts == 1).sum()),
        "non_manifold_edges": int((counts > 2).sum()), "components": int(len(m.split(only_watertight=False))),
        "faces": int(len(m.faces)), "volume_cm3": float(m.volume / 1000) if m.is_volume else None,
        "size_mm": {"width_x": float(ext[0]), "depth_y": float(ext[1]), "height_z": float(ext[2])},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir")
    ap.add_argument("--height-mm", type=float, default=180.0, help="printed height of the figure")
    ap.add_argument("--mesh", default="geometry.ply", help="mesh inside run_dir to export")
    a = ap.parse_args()
    run = Path(a.run_dir)
    out = run / "print"
    out.mkdir(exist_ok=True)

    V, F, _ = io.read_mesh(run / a.mesh)
    m = trimesh.Trimesh(np.asarray(V, float), np.asarray(F), process=True)
    before = checks(m)
    # keep the largest connected piece (printing needs one solid), make normals point outwards
    parts = m.split(only_watertight=False)
    if len(parts) > 1:
        m = max(parts, key=lambda p: len(p.faces))
    trimesh.repair.fix_normals(m)

    fr = view_frame()                      # person frame: left, up, front (world)
    R = np.stack([fr["left"], fr["front"], fr["up"]])   # -> x = left, y = front, z = up (z-up for slicers)
    if np.linalg.det(R) < 0:
        R[0] *= -1
    T = np.eye(4)
    T[:3, :3] = R
    m.apply_transform(T)
    s = a.height_mm / (m.bounds[1, 2] - m.bounds[0, 2])
    m.apply_scale(s)
    lo, hi = m.bounds
    m.apply_translation([-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]])   # centred, feet at z = 0
    after = checks(m)
    m.export(out / "figure.stl")

    textured = (run / "mesh.obj").exists() and a.mesh == "geometry.ply"
    if textured:  # same transform applied to the textured deliverable (for colour printers)
        Vt, Ft, VT, FT, img = io.read_textured_obj(run / "mesh.obj")
        Vt = (np.asarray(Vt) @ R.T) * s
        Vt += np.array([-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]])
        io.write_textured_obj(out, Vt, np.asarray(Ft), np.asarray(VT), np.asarray(FT), np.asarray(img), basename="figure")

    printable = after["watertight"] and after["winding_consistent"] and after["is_volume"] and after["non_manifold_edges"] == 0
    report = {"source_mesh": str(run / a.mesh), "height_mm": a.height_mm, "units": "mm", "up_axis": "+Z",
              "checks_before": before, "checks_after": after, "printable": bool(printable),
              "kept_largest_component": before["components"] > 1, "textured_obj": textured,
              "note": "STL for single-colour FDM/SLA; figure.obj + texture.png for colour printers. Slice with supports "
                      "under the crossed arms; consider a base plate for stability."}
    (out / "print_report.json").write_text(json.dumps(report, indent=1))
    print(json.dumps({"printable": printable, **after}, indent=1))


if __name__ == "__main__":
    main()
