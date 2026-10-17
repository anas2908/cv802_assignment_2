#!/usr/bin/env bash
# run.sh <run_dir> [--res 256] [--alpha 4] [--trim 2]   (on the allocation node; base env, no API Poisson)
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$1"; shift; mkdir -p "${RUN}"
"${BASE_PY}" -m surface.methods.poisson.poisson "${RUN}" --input "${INPUT_PLY}" "$@" 2>&1 | tee "${RUN}/log.txt"
