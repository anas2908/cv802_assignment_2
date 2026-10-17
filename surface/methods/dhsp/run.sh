#!/usr/bin/env bash
# run.sh <run_dir> [--points 25000] [--steps 2000] [--epochs 4]
# Official DHSP README pipeline: (1) hull -> Manifold -> 2000-face init; (2) 3D self-prior (train.py);
# (3) UV flattening [OptCuts -> xatlas, deviation]; (4) project_geo / im_complete (2D self-prior) / back_proj;
# (5) 3D self-prior again. Colour: projected texture when the 2D stage succeeds, else vertex colours.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$1"; shift; NPTS=25000; STEPS=2000; EPOCHS=4; LAP=0
while [[ $# -gt 0 ]]; do case "$1" in --points) NPTS="$2"; shift 2;; --steps) STEPS="$2"; shift 2;; --epochs) EPOCHS="$2"; shift 2;;
  --lap) LAP="$2"; shift 2;;   # optional Laplacian smoothness weight (code option, 0 in the paper/README)
  *) echo "unknown arg $1"; exit 2;; esac; done
mkdir -p "${RUN}/work"; RUN="$(cd "${RUN}" && pwd)"
# The official code splits paths at the first "." (e.g. path.split('.')[0]), which breaks under /l/users/anas.khan.
# Work through a dot-free symlink on the node's local disk instead (DOTFREE).
W="/tmp/cv802_dhsp_$(basename "${RUN}" | tr -c 'A-Za-z0-9_\n' '_')"; ln -sfn "${RUN}/work" "${W}"
exec > >(tee "${RUN}/log.txt") 2>&1
PY="${DATA}/envs/p2m/bin/python"; REPO="${TP}/dhsp"; MF="${TP}/Manifold/build"; N=shirt
export PYTHONPATH="${REPO}:${PYTHONPATH}"
prog() { printf '{"percent": %d, "stage": "%s", "message": "%s"}' "$1" "$2" "$3" > "${RUN}/progress.json"; echo "[$1%] $2 $3"; }
prog 3 prep "coloured point cloud (${NPTS} pts) as OBJ, largest extent 1"
"${BASE_PY}" -m surface.methods.common_io prep --out "${W}" --name "${N}.obj" --n "${NPTS}" --mode fps --norm unit --fmt obj_color
mkdir -p "${W}/datasets/train" "${W}/datasets/result/${N}/input" "${W}/input" "${W}/output" "${W}/output_2d"
cp "${W}/${N}.obj" "${W}/datasets/train/${N}.obj"
T0=$(date +%s)
prog 6 "initial mesh" "convex hull -> manifold -> simplify 2000 faces (README step 1)"
"${BASE_PY}" -c "
import numpy as np, trimesh; p=np.loadtxt('${W}/${N}.obj', usecols=(1,2,3))
trimesh.convex.convex_hull(p).export('${W}/${N}_convex.obj')"
"${MF}/manifold" "${W}/${N}_convex.obj" "${W}/${N}_manifold.obj"
"${MF}/simplify" -i "${W}/${N}_manifold.obj" -o "${W}/datasets/result/${N}/input/${N}_ep1.obj" -f 2000
cd "${REPO}"
prog 10 "3D self-prior" "train.py, ${EPOCHS} epochs x ${STEPS} steps (README step 2)"
"${PY}" train.py --dataroot "${W}/datasets" --name "${N}" --arch meshunet --obj_filename "${N}.obj" \
  --resblocks 2 --lr 0.001 --weight_edge_loss 0.2 --weight_lap_loss "${LAP}" --epoch_steps "${STEPS}" --epoch "${EPOCHS}"
P=$(ls -t "${W}/datasets/result/${N}/${N}_ep${EPOCHS}"_step*.obj 2>/dev/null | head -1)
[[ -n "${P}" ]] || P=$(ls -t "${W}"/datasets/result/${N}/*.obj "${W}"/datasets/result/${N}/output/*.obj 2>/dev/null | head -1)
cp "${P}" "${W}/${N}_p.obj"; FINAL="${W}/${N}_p.obj"; STAGE2D=failed
if [[ "${DHSP_SKIP_INLINE_2D:-0}" == 1 ]]; then   # 2D stages run separately by run_2d.sh (remesh + OptCuts)
  TEX=skipped
else
prog 55 "UV flattening" "xatlas (replaces OptCuts, README step 3)"
"${BASE_PY}" - <<PY
import numpy as np, xatlas
from surface.common import io
V, F, _ = io.read_mesh("${W}/${N}_p.obj")
vm, idx, uv = xatlas.parametrize(V.astype(np.float32), F.astype(np.uint32))
with open("${W}/${N}_p_uv.obj", "w") as f:
    for v in V[vm]: f.write("v %.6f %.6f %.6f\n" % tuple(v))
    for t in uv: f.write("vt %.6f %.6f\n" % tuple(t))
    for a, b, c in idx + 1: f.write(f"f {a}/{a} {b}/{b} {c}/{c}\n")
PY
cd "${W}"
set +e
prog 60 "2D self-prior" "project_geo / im_complete / back_proj (README step 4)"
"${PY}" "${REPO}/project_geo.py" "${N}" && "${PY}" "${REPO}/im_complete.py" "${N}" && "${PY}" "${REPO}/back_proj.py" "${N}"
if [[ $? -eq 0 ]]; then STAGE2D=ok; fi
if [[ "${STAGE2D}" == ok && -f "${W}/datasets/train/${N}n.obj" ]]; then
  prog 75 "3D self-prior (refine)" "README step 5"
  ( cd "${REPO}" && "${PY}" train.py --dataroot "${W}/datasets" --name "${N}n" --arch meshunet --obj_filename "${N}.obj" \
      --resblocks 2 --lr 0.001 --weight_edge_loss 0.2 --epoch_steps 1200 --epoch 1 )
  Q=$(ls -t "${W}/datasets/result/${N}n"/*.obj 2>/dev/null | head -1); [[ -n "${Q}" ]] && FINAL="${Q}"
fi
prog 82 "texture" "project_texture / im_complete_text (2D texture self-prior)"
"${PY}" "${REPO}/project_texture.py" "${N}" && "${PY}" "${REPO}/im_complete_text.py" "${N}"; TEX=$?
set -e
fi
printf '{"paper": "Wei, Chen, Fu, Cui, Zhang. Deep Hybrid Self-Prior for Full 3D Mesh Generation, ICCV 2021", "official_code": "https://github.com/weixk2015/DHSP3D", "commit": "02775c6", "params": {"points": %s, "steps": %s, "epochs": %s, "weight_lap_loss": %s}, "stage_2d": "%s", "texture_stage_exit": %s, "final_mesh": "%s", "elapsed_seconds": %s, "device": "cuda", "deviations": "OptCuts UV flattening replaced by xatlas; meshlab convex hull replaced by trimesh; PyTorch 2.1"}' \
  "${NPTS}" "${STEPS}" "${EPOCHS}" "${LAP}" "${STAGE2D}" "\"${TEX}\"" "$(basename "${FINAL}")" "$(( $(date +%s) - T0 ))" > "${W}/info.json"
prog 86 post "de-normalise to the VGGSfM frame"
"${BASE_PY}" -m surface.methods.common_io post --mesh "${FINAL}" --transform "${W}/transform.json" --run "${RUN}" \
  --method-id dhsp --method-name "Deep Hybrid Self-Prior (ICCV 2021)" --info "${W}/info.json"
prog 89 "method done" "2D stage: ${STAGE2D}"
