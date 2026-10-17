#!/usr/bin/env bash
# run.sh <run_dir> [--points 100000] [--grid 256]
# Official SAP optimisation (coarse-to-fine 32->64->128->256 via optim_hierarchy.py) on our cloud with normals.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$1"; shift; NPTS=100000; GRID=256
while [[ $# -gt 0 ]]; do case "$1" in --points) NPTS="$2"; shift 2;; --grid) GRID="$2"; shift 2;; *) echo "unknown arg $1"; exit 2;; esac; done
mkdir -p "${RUN}/work"; RUN="$(cd "${RUN}" && pwd)"; W="${RUN}/work"
exec > >(tee "${RUN}/log.txt") 2>&1
ENV="${DATA}/envs/p2m"; REPO="${TP}/sap"; export PATH="${ENV}/bin:${PATH}"
prog() { printf '{"percent": %d, "stage": "%s", "message": "%s"}' "$1" "$2" "$3" >| "${RUN}/progress.json"; echo "[$1%] $2 $3"; }
prog 3 prep "${NPTS} points with normals, SAP normalisation (mean-centred, max|x| = 0.9)"
"${BASE_PY}" -m surface.methods.common_io prep --out "${W}" --name shirt.ply --n "${NPTS}" --mode fps --norm sap --fmt ply_normals
sed -e "s|data_path: .*|data_path: '${W}/shirt.ply'|" -e "s|grid_res: .*|grid_res: ${GRID}|" -e "s|out_dir: .*|out_dir: '${W}/out'|" \
    -e "s|num_points: .*|num_points: ${NPTS}|" "${REPO}/configs/optim_based/teaser.yaml" >| "${W}/config.yaml"
T0=$(date +%s)
prog 10 optimise "SAP differentiable Poisson, coarse-to-fine to ${GRID}^3"
( cd "${REPO}" && python optim_hierarchy.py "${W}/config.yaml" )
MESH=$(ls "${W}/out/res_${GRID}/vis/mesh/"*.ply 2>/dev/null | sort | tail -1)
[[ -n "${MESH}" ]] || { echo "no SAP mesh"; ls -R "${W}/out" | head -40; exit 1; }
printf '{"paper": "Peng, Jiang, Liao, Niemeyer, Pollefeys, Geiger. Shape As Points: A Differentiable Poisson Solver, NeurIPS 2021", "official_code": "https://github.com/autonomousvision/shape_as_points", "commit": "a094733", "params": {"points": %s, "grid": %s, "schedule": "32/64/128/256 x 1000/1000/1000/200 (optim_hierarchy defaults)"}, "elapsed_seconds": %s, "device": "cuda", "deviations": "input: our cloud with its normals (FPS-subsampled); PyTorch 2.1"}' \
  "${NPTS}" "${GRID}" "$(( $(date +%s) - T0 ))" >| "${W}/info.json"
prog 86 post "de-normalise to the input frame"
"${BASE_PY}" -m surface.methods.common_io post --mesh "${MESH}" --transform "${W}/transform.json" --run "${RUN}" \
  --method-id sap --method-name "Shape As Points (NeurIPS 2021)" --info "${W}/info.json"
prog 89 "method done" "$(basename "${MESH}")"
