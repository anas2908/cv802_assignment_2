#!/usr/bin/env bash
# run.sh <run_dir> [--points 12500] [--K 50]
# Official IER pipeline: candidate triangles (kNN) -> pretrained IER classifier -> greedy manifold post-processing.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$1"; shift; NPTS=12500; K=50
while [[ $# -gt 0 ]]; do case "$1" in --points) NPTS="$2"; shift 2;; --K) K="$2"; shift 2;; *) echo "unknown arg $1"; exit 2;; esac; done
RUN="$(cd "${RUN}" 2>/dev/null && pwd || (mkdir -p "${RUN}" && cd "${RUN}" && pwd))"; W="${RUN}/work"; mkdir -p "${W}/pickles"
exec > >(tee "${RUN}/log.txt") 2>&1
PY="${DATA}/envs/ier/bin/python"; REPO="${TP}/ier"; TAG="shirt$(date +%s)"
prog() { printf '{"percent": %d, "stage": "%s", "message": "%s"}' "$1" "$2" "$3" > "${RUN}/progress.json"; echo "[$1%] $2 $3"; }
prog 5 prep "farthest-point sample ${NPTS} points (network trained on 12,000-12,800), unit bbox diagonal"
"${BASE_PY}" -m surface.methods.common_io prep --out "${W}" --name "${TAG}.ply" --n "${NPTS}" --mode fps --norm diag1 --fmt ply
T0=$(date +%s)
prog 15 candidates "kNN candidate triangles (K=${K})"
( cd "${REPO}/preprocess_with_pc" && "${PY}" main.py --input "${W}/${TAG}.ply" --output "${W}/pickles/${TAG}.p" --K "${K}" --log_dir "${W}/log_pre" )
prog 40 classify "pretrained IER network"
echo "${TAG}" >| "${W}/pickles/models.txt"   # test-set id list expected by network/dataset.py
( cd "${REPO}/network" && "${PY}" test.py --input_dir "${W}/pickles" --output_dir "test_${TAG}" --log_dir shapenet_pretrained )
prog 70 postprocess "sort candidates + greedy manifold merge"
( cd "${REPO}/postprocess" && "${PY}" main.py --pickle_file "${W}/pickles/${TAG}.p" --pred_dir "../log/shapenet_pretrained/test_${TAG}" --output "${W}/ier_mesh.ply" )
printf '{"paper": "Liu, Zhang, Su. Meshing Point Clouds with Predicted Intrinsic-Extrinsic Ratio Guidance, ECCV 2020", "official_code": "https://github.com/Colin97/Point2Mesh", "commit": "aa080b2", "weights": "official shapenet_pretrained/best_model.pth", "params": {"points": %s, "K": %s}, "elapsed_seconds": %s, "device": "cuda", "deviations": "PyTorch 1.12.1/CUDA 11.6 instead of 1.3.1/CUDA 10.0; input normalised to a unit bounding-box diagonal and FPS-subsampled to the trained density"}' \
  "${NPTS}" "${K}" "$(( $(date +%s) - T0 ))" > "${W}/info.json"
prog 85 post "de-normalise to the VGGSfM frame"
"${BASE_PY}" -m surface.methods.common_io post --mesh "${W}/ier_mesh.ply" --transform "${W}/transform.json" --run "${RUN}" \
  --method-id ier --method-name "IER meshing (ECCV 2020)" --info "${W}/info.json"
prog 89 "method done" ""
