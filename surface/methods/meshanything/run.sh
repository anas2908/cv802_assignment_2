#!/usr/bin/env bash
# run.sh <run_dir> [--version v1|v2] [--seed N] [--sampling] [--input mesh|pc] [--mc-level 7|8] [--source-mesh PATH]
# Official MeshAnything inference.
#  --input mesh (default, as the authors recommend): a dense mesh of our scan (watertight screened Poisson) goes through
#    the official "--input_type mesh --mc" path (mesh2sdf + marching cubes + 8192 surface samples), which matches the
#    training domain ("helps us to align the inference point cloud to our training domain", MeshAnythingV2 README).
#  --input pc: our raw VGGSfM points + PCA/MST normals (pc_normal mode; out of the training domain, kept for comparison).
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$1"; shift; VER=v2; SEED=0; SAMPLING=""; INPUT=mesh; MC=7
SRC="${OUTPUTS}/poisson/poisson-v1-r256-a4-t2/geometry_watertight.ply"
while [[ $# -gt 0 ]]; do case "$1" in
  --version) VER="$2"; shift 2;; --seed) SEED="$2"; shift 2;; --sampling) SAMPLING="--sampling"; shift;;
  --input) INPUT="$2"; shift 2;; --mc-level) MC="$2"; shift 2;; --source-mesh) SRC="$2"; shift 2;;
  *) echo "unknown arg $1"; exit 2;; esac; done
mkdir -p "${RUN}/work"; exec > >(tee "${RUN}/log.txt") 2>&1
PY="${DATA}/envs/meshanything/bin/python"; REPO="${TP}/meshanything_${VER}"
prog() { printf '{"percent": %d, "stage": "%s", "message": "%s"}' "$1" "$2" "$3" >| "${RUN}/progress.json"; echo "[$1%] $2 $3"; }
if [[ "${INPUT}" == mesh ]]; then
  prog 5 prep "dense mesh $(basename "$(dirname "${SRC}")") rotated to up=+Y"
  "${BASE_PY}" -m surface.methods.common_io prep --out "${RUN}/work" --name shirt.obj --from-mesh "${SRC}" \
    --rotate --norm maxabs --fmt obj_mesh
  ARGS=(--input_path "${RUN}/work/shirt.obj" --input_type mesh --mc)
  [[ "${VER}" == v2 ]] && ARGS+=(--mc_level "${MC}")   # V1 has a fixed marching-cubes level
  NPTS=8192; DESC="dense mesh (watertight screened Poisson) -> official --mc preprocessing (mc_level ${MC})"
else
  NPTS=$([[ "${VER}" == v2 ]] && echo 8192 || echo 4096)   # exactly what the model samples -> exact de-normalisation
  prog 5 prep "sampling ${NPTS} points + normals, up=+Y"
  "${BASE_PY}" -m surface.methods.common_io prep --out "${RUN}/work" --name shirt.npy --n "${NPTS}" --mode fps --seed "${SEED}" \
    --rotate --extremes --norm maxabs --fmt npy_normals
  ARGS=(--input_path "${RUN}/work/shirt.npy" --input_type pc_normal)
  DESC="raw VGGSfM points with our PCA+MST normals (pc_normal)"
fi
prog 20 generate "MeshAnything ${VER} seed=${SEED} ${SAMPLING:-greedy} input=${INPUT}"
T0=$(date +%s)
( cd "${REPO}" && "${PY}" main.py "${ARGS[@]}" --out_dir "${RUN}/work/out" --seed "${SEED}" ${SAMPLING} )
OBJ=$(find "${RUN}/work/out" -name '*_gen.obj' | head -1); [[ -n "${OBJ}" ]] || { echo "no output mesh"; exit 1; }
"${BASE_PY}" - "${RUN}/work/info.json" <<PY
import json, sys
json.dump({"paper": "Chen et al., MeshAnything" + (" V2" if "${VER}" == "v2" else "") + " (2024)",
           "official_code": "https://github.com/buaacyw/MeshAnything" + ("V2" if "${VER}" == "v2" else ""),
           "commit": "$(git -C "${REPO}" rev-parse --short HEAD)", "elapsed_seconds": $(( $(date +%s) - T0 )), "device": "cuda",
           "params": {"version": "${VER}", "seed": ${SEED}, "sampling": "${SAMPLING:-greedy}", "input": "${INPUT}",
                      "mc_level": ${MC}, "source_mesh": "${SRC}" if "${INPUT}" == "mesh" else None, "points_sampled": ${NPTS}},
           "input_description": "${DESC}",
           "deviations": "input rotated so up=+Y (authors' recommendation); for --input mesh the dense mesh is our own screened Poisson reconstruction of the VGGSfM cloud"},
          open(sys.argv[1], "w"), indent=1)
PY
prog 85 post "de-normalise to the VGGSfM frame"
"${BASE_PY}" -m surface.methods.common_io post --mesh "${OBJ}" --transform "${RUN}/work/transform.json" --run "${RUN}" \
  --method-id meshanything --method-name "MeshAnything ${VER}" --info "${RUN}/work/info.json"
prog 89 "method done" "$(basename "${OBJ}")"
