#!/usr/bin/env bash
# Poisson only needs the shared base env (numpy/scipy/torch); nothing to download.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
bash "${CODE}/surface/scripts/setup_base_env.sh"
