#!/usr/bin/env bash
# finalize.sh <run_dir> [--color-source points|vertex|method] [--tex-size N] — runs on the node (no srun inside).
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/env.sh"
exec "${BASE_PY}" -m surface.common.finalize "$@"
