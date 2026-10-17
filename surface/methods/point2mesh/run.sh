#!/usr/bin/env bash
# run.sh <run_dir> [--points 30000] [--iterations 6000] [--init-faces 2000] [--max-faces 16000]
# Official Point2Mesh: convex hull -> Manifold -> CNN self-prior optimisation with iterative upsampling.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$1"; shift; NPTS=30000; IT=6000; INITF=2000; MAXF=16000; EXTRA=()
while [[ $# -gt 0 ]]; do case "$1" in --points) NPTS="$2"; shift 2;; --iterations) IT="$2"; shift 2;; --init-faces) INITF="$2"; shift 2;; --max-faces) MAXF="$2"; shift 2;; --unoriented) EXTRA+=(--unoriented); shift;; *) echo "unknown arg $1"; exit 2;; esac; done
mkdir -p "${RUN}/work"; RUN="$(cd "${RUN}" && pwd)"; W="${RUN}/work"
exec > >(tee "${RUN}/log.txt") 2>&1
PY="${DATA}/envs/p2m/bin/python"; REPO="${TP}/point2mesh"
export PYTHONPATH="${REPO}:${PYTHONPATH}"   # scripts/process_data/*.py import the repo packages
prog() { printf '{"percent": %d, "stage": "%s", "message": "%s"}' "$1" "$2" "$3" > "${RUN}/progress.json"; echo "[$1%] $2 $3"; }
prog 3 prep "${NPTS} points with oriented normals, largest extent 1"
"${BASE_PY}" -m surface.methods.common_io prep --out "${W}" --name shirt.xyz --n "${NPTS}" --mode fps --norm unit --fmt xyz_normals
T0=$(date +%s)
prog 6 "initial mesh" "convex hull -> Manifold -> ${INITF} faces"
( cd "${REPO}" && "${PY}" scripts/process_data/convex_hull.py --i "${W}/shirt.xyz" --faces "${INITF}" --o "${W}/init.obj" --manifold-path "${TP}/Manifold/build" )
prog 10 optimise "self-prior CNN, ${IT} iterations (progress in log)"
( cd "${REPO}" && "${PY}" main.py --input-pc "${W}/shirt.xyz" --initial-mesh "${W}/init.obj" --save-path "${W}/ckpt" \
    --iterations "${IT}" --max-faces "${MAXF}" "${EXTRA[@]}" ) &
PID=$!
while kill -0 "${PID}" 2>/dev/null; do
  n=$(grep -o "iter: [0-9]*" "${RUN}/log.txt" 2>/dev/null | tail -1 | grep -o "[0-9]*$" || true)
  [[ -n "${n}" ]] && prog $(( 10 + 75 * n / IT )) optimise "iteration ${n}/${IT}"
  sleep 20
done
wait "${PID}"
OBJ="${W}/ckpt/last_recon.obj"; [[ -s "${OBJ}" ]] || OBJ=$(ls -t "${W}/ckpt"/recon_iter_*.obj | head -1)
printf '{"paper": "Hanocka, Metzer, Giryes, Cohen-Or. Point2Mesh: A Self-Prior for Deformable Meshes, SIGGRAPH 2020", "official_code": "https://github.com/ranahanocka/point2mesh", "commit": "333dba0", "params": {"points": %s, "iterations": %s, "init_faces": %s, "max_faces": %s, "unoriented": %s}, "elapsed_seconds": %s, "device": "cuda", "deviations": "PyTorch 2.1 + PyTorch3D 0.7.5 instead of 1.4 + 0.2; input FPS-subsampled with our PCA+MST normals and scaled to unit extent"}' \
  "${NPTS}" "${IT}" "${INITF}" "${MAXF}" "$([[ ${#EXTRA[@]} -gt 0 ]] && echo true || echo false)" "$(( $(date +%s) - T0 ))" > "${W}/info.json"
prog 86 post "de-normalise to the VGGSfM frame"
"${BASE_PY}" -m surface.methods.common_io post --mesh "${OBJ}" --transform "${W}/transform.json" --run "${RUN}" \
  --method-id point2mesh --method-name "Point2Mesh (SIGGRAPH 2020)" --info "${W}/info.json"
prog 89 "method done" "$(basename "${OBJ}")"
