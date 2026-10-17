#!/usr/bin/env bash
# run_2d.sh <run_dir>   — DHSP README steps 4-5 + 2D texture self-prior, resuming from an existing 3D stage
# (<run_dir>/work/shirt_p.obj from run.sh). Writes method_texture/{mesh.obj,mesh.mtl,texture.png} = DHSP's own colour.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$(cd "$1" && pwd)"; N=shirt
W="/tmp/cv802_dhsp_$(basename "${RUN}" | tr -c 'A-Za-z0-9_\n' '_')"; ln -sfn "${RUN}/work" "${W}"   # dot-free path
PY="${DATA}/envs/p2m/bin/python"; REPO="${TP}/dhsp"
export PYTHONPATH="${REPO}:${PYTHONPATH}"
prog() { printf '{"percent": %d, "stage": "%s", "message": "%s"}' "$1" "$2" "$3" >| "${RUN}/progress.json"; echo "[$1%] $2 $3"; }
[[ -f "${W}/${N}_p.obj" ]] || { echo "run the 3D stage first (run.sh)"; exit 1; }
# UV flattening with OptCuts (as in the DHSP README; mode 100 = its headless offline optimisation, same as mode 10
# without the viewer). Falls back to xatlas only if OptCuts fails; the method used is recorded in uv_methods.txt.
optcuts_uv() { # optcuts_uv <in.obj> <out_uv.obj> [remesh_faces]
  local in="$1" out="$2" faces="${3:-0}"
  local tmp="/tmp/cv802_optcuts_$(basename "${RUN}")_$(basename "${in}" .obj)"   # per run: parallel runs must not share it
  local src="${in}"
  rm -rf "${tmp}"; mkdir -p "${tmp}"; cp "${in}" "${tmp}/m.obj"
  if [[ "${faces}" -gt 0 ]]; then
    # The 3D prior's surface is crumpled (about half of adjacent faces fold), and OptCuts does not converge on it.
    # Rebuild a clean watertight surface with Manifold (the tool DHSP already uses) and simplify, then flatten.
    "${TP}/Manifold/build/manifold" "${tmp}/m.obj" "${tmp}/m_man.obj" 20000 > /dev/null
    "${TP}/Manifold/build/simplify" -i "${tmp}/m_man.obj" -o "${tmp}/m.obj" -f "${faces}" > /dev/null
    # simplification can leave zero-area triangles, which OptCuts rejects: drop them (and unused vertices)
    "${BASE_PY}" - "${tmp}/m.obj" <<'PY'
import sys, numpy as np, trimesh
m = trimesh.load(sys.argv[1], process=False)
n0 = len(m.faces)
m.update_faces(m.nondegenerate_faces(height=1e-9)); m.update_faces(m.unique_faces()); m.remove_unreferenced_vertices()
m.merge_vertices()
m.export(sys.argv[1])
print(f"cleaned remeshed mesh: {n0} -> {len(m.faces)} faces")
PY
    src="${tmp}/m.obj"   # the xatlas fallback must flatten the re-meshed surface too
    echo "$(basename "${out}"): remeshed to ${faces} faces (Manifold + simplify) before UV flattening" >> uv_methods.txt
  fi
  if [[ "${OPTCUTS_SKIP:-0}" != 1 ]] && ( cd "${tmp}" && timeout 7200 "${TP}/OptCuts/build/OptCuts_bin" 100 m.obj 0.999 1 0 4.15 1 0 > optcuts.log 2>&1 ); then
    local r; r=$(find "${tmp}" -name finalResult_mesh_normalizedUV.obj | head -1)
    if [[ -n "${r}" ]]; then cp "${r}" "${out}"; echo "$(basename "${out}"): OptCuts" >> uv_methods.txt; return 0; fi
  fi
  echo "OptCuts failed for ${in} (see ${tmp}/optcuts.log); falling back to xatlas"
  "${BASE_PY}" - "${src}" "${out}" <<'PY'
import sys, numpy as np, xatlas
from surface.common import io
V, F, _ = io.read_mesh(sys.argv[1])
import os
atlas = xatlas.Atlas()
atlas.add_mesh(V.astype(np.float32), F.astype(np.uint32))
co, po = xatlas.ChartOptions(), xatlas.PackOptions()
co.max_cost = float(os.environ.get("XA_MAX_COST", "2"))   # larger -> fewer, bigger charts (closer to OptCuts' low-seam atlas)
po.padding = int(os.environ.get("XA_PADDING", "0")); po.resolution = 1024
atlas.generate(co, po)
vm, idx, uv = atlas[0]
print(f"xatlas: {atlas.chart_count} charts (max_cost {co.max_cost}, padding {po.padding})")
with open(sys.argv[2], "w") as f:
    for v in V[vm]: f.write("v %.6f %.6f %.6f\n" % tuple(v))
    for t in uv: f.write("vt %.6f %.6f\n" % tuple(t))
    for a, b, c in idx + 1: f.write(f"f {a}/{a} {b}/{b} {c}/{c}\n")
PY
  echo "$(basename "${out}"): xatlas (fallback)" >> uv_methods.txt
}

cd "${W}"; mkdir -p input output output_2d output_mesh input_f "datasets/result/${N}n/input"
ln -sfn "${REPO}/util" util          # back_proj calls util/Manifold/build/simplify relative to the cwd

if [[ "${DHSP_FROM_TEXTURE:-0}" == 1 ]]; then
  # resume after the 3D refinement (README step 5 done): redo only UV flattening of the refined mesh + texture prior
  [[ -s "${N}_f.obj" ]] || { echo "DHSP_FROM_TEXTURE=1 needs ${N}_f.obj"; exit 1; }
  grep -v "^${N}_f_uv.obj" uv_methods.txt >| uv_methods.tmp 2>/dev/null || true; mv -f uv_methods.tmp uv_methods.txt
else
: >| uv_methods.txt
prog 55 "UV flattening" "OptCuts on the 3D-prior mesh (README step 3)"
if [[ "${DHSP_TEXTURE_ONLY:-0}" == 1 && "${DHSP_UV:-xatlas}" == xatlas ]]; then
  OPTCUTS_SKIP=1 optcuts_uv "${N}_p.obj" "${N}_p_uv.obj"
else
  optcuts_uv "${N}_p.obj" "${N}_p_uv.obj" "${DHSP_REMESH_FACES:-0}"
fi
if [[ "${DHSP_TEXTURE_ONLY:-0}" == 1 ]]; then
  # 2D texture self-prior only, on the 3D-prior mesh (the 2D geometry-image stage needs OptCuts' low-seam atlas)
  cp "${N}_p.obj" "${N}_f.obj"; cp "${N}_p_uv.obj" "${N}_f_uv.obj"; echo "${N}_f_uv.obj: same atlas as ${N}_p_uv.obj (texture-only mode)" >> uv_methods.txt
else
prog 60 "2D geometry prior" "project_geo -> im_complete (DIP on the xyz geometry image) -> back_proj (README step 4)"
"${PY}" "${REPO}/project_geo.py" "${N}"
"${PY}" "${REPO}/im_complete.py" "${N}"
"${PY}" "${REPO}/back_proj.py" "${N}"
[[ -s "datasets/result/${N}n/input/${N}_ep1.obj" ]] || { echo "back_proj produced no refined input mesh"; exit 1; }

prog 70 "3D self-prior refine" "train.py on the back-projected mesh (README step 5)"
( cd "${REPO}" && "${PY}" train.py --dataroot "${W}/datasets" --name "${N}n" --arch meshunet --obj_filename "${N}.obj" \
    --resblocks 2 --lr 0.001 --weight_edge_loss 0.2 --weight_lap_loss "${DHSP_LAP:-0}" --epoch_steps 1200 --epoch 1 )
FINAL=$(ls -t "datasets/result/${N}n"/*.obj "datasets/result/${N}n/output"/*.obj 2>/dev/null | head -1)
[[ -n "${FINAL}" ]] || { echo "refine produced no mesh"; exit 1; }
cp "${FINAL}" "${N}_f.obj"
fi
fi   # DHSP_FROM_TEXTURE
if [[ "${DHSP_TEXTURE_ONLY:-0}" != 1 ]]; then

prog 78 "UV flattening" "OptCuts on the refined mesh -> ${N}_f_uv.obj"
optcuts_uv "${N}_f.obj" "${N}_f_uv.obj" "${DHSP_REMESH_FACES_F:-${DHSP_REMESH_FACES:-0}}"

fi
prog 82 "2D texture prior" "project_texture -> im_complete_text (DIP completes the colour texture)"
"${PY}" "${REPO}/project_texture.py" "${N}"
"${PY}" "${REPO}/im_complete_text.py" "${N}"
TEX="output/${N}hr.jpg"; [[ -s "${TEX}" ]] || { echo "no texture produced"; exit 1; }

prog 86 "assemble" "DHSP's own texture on the refined mesh, back to the VGGSfM frame"
"${BASE_PY}" - "${W}" "${N}" "${RUN}" <<'PY'
# The DHSP texture is sampled with its own uv2color convention; pick the image orientation whose colours agree
# with the input points (objective check, no colour is copied from the points).
import json, os, sys
import numpy as np
from PIL import Image
from surface.common import io, paths
from surface.common.knn import knn
from surface.common.texture import sample_texture
w, n, run = sys.argv[1:4]
V, F, VT, FT, _ = io.read_textured_obj(f"{w}/{n}_f_uv.obj")
img = np.asarray(Image.open(f"{w}/output/{n}hr.jpg").convert("RGB"))
t = json.load(open(f"{w}/transform.json"))
R, c, s = np.array(t["R"]), np.array(t["center"]), t["scale"]
Vw = (np.asarray(V, float) / s + c) @ R
xyz, rgb = io.read_point_cloud(paths.input_ply())
cen = Vw[np.asarray(F)].mean(1)
_, nn = knn(cen, xyz, k=1)
ref = rgb[np.asarray(nn).ravel()].astype(float)
uvc = np.asarray(VT)[np.asarray(FT)].mean(1)
best = None
for name, im in (("as-is", img), ("flip-v", img[::-1]), ("flip-u", img[:, ::-1]), ("flip-uv", img[::-1, ::-1])):
    err = np.abs(sample_texture(im, uvc) - ref).mean()
    print(f"texture orientation {name}: mean |rgb err| vs nearest input point = {err:.1f}")
    if best is None or err < best[0]:
        best = (err, name, im)
io.write_textured_obj(f"{run}/method_texture", Vw, np.asarray(F), np.asarray(VT), np.asarray(FT), best[2])
io.write_mesh_ply(f"{run}/geometry.ply", Vw, np.asarray(F))
info = json.load(open(f"{run}/method_info.json"))
info.update({"stage_2d": "ok", "final_mesh": (f"{n}_p.obj (3D prior; 2D texture prior only)" if os.environ.get("DHSP_TEXTURE_ONLY") == "1" else f"{n}_f.obj (README step 5 refine)"), "texture": "DHSP 2D self-prior (im_complete_text)",
             "uv_parameterisation": open(f"{w}/uv_methods.txt").read().strip().splitlines(), "texture_orientation": best[1], "texture_orientation_err": round(float(best[0]), 2),
             "deviations": info.get("deviations", "") + "; im_complete.py name argument added, back_proj.py author path replaced, "
                           "final UV atlas by xatlas"})
json.dump(info, open(f"{run}/method_info.json", "w"), indent=1)
print("assembled", len(Vw), "vertices", len(F), "faces; orientation", best[1])
PY
prog 89 "method done" "DHSP texture assembled"
