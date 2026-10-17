#!/usr/bin/env bash
# run.sh <run_dir> [--normals ours|nksr] [--detail 1.0] [--mise-iter 2]
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$1"; shift; mkdir -p "${RUN}"; export DATA
# cached input normals of the selected dataset (computed once by the shared code)
export NORMALS_NPZ="$("${BASE_PY}" -c "from surface.common import io, paths; from surface.common.finalize import input_normals; input_normals(io.read_point_cloud(paths.input_ply())[0]); print(paths.input_normals_cache())")"
printf '{"percent": 20, "stage": "reconstruct", "message": "NKSR pretrained kernel field"}' >| "${RUN}/progress.json"
"${DATA}/envs/nksr/bin/python" "$(dirname -- "${BASH_SOURCE[0]}")/nksr_run.py" "${RUN}" --input "${INPUT_PLY}" "$@" 2>&1 | tee "${RUN}/log.txt"
printf '{"percent": 89, "stage": "method done", "message": ""}' >| "${RUN}/progress.json"
