#!/usr/bin/env bash
# Idempotent setup of the shared base environment DATA/envs/base (Python 3.11, torch cu121,
# numpy/scipy/trimesh/xatlas/pillow/plyfile). Run ON THE NODE:
#   surface/scripts/node_run.sh 'bash surface/scripts/setup_base_env.sh'
# The headless renderer is our own torch rasteriser in surface/common/render.py (no X/EGL needed).
set -Eeuo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CODE="$(cd "${HERE}/../.." && pwd)"
DATA="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}"
case "$(hostname)" in lo-0*) echo "ERROR: do not run on the login node; use node_run.sh" >&2; exit 2;; esac
export UV_CACHE_DIR="${DATA}/cache/uv" UV_PYTHON_INSTALL_DIR="${DATA}/tools/python"
export UV_LINK_MODE=copy
UV="${DATA}/tools/uv/uv"
ENV="${DATA}/envs/base"
PY="${ENV}/bin/python"
TORCH_VERSION="${TORCH_VERSION:-2.5.1}"
if [[ ! -x "${PY}" ]]; then
  "${UV}" venv --python 3.11 "${ENV}"
fi
if ! "${PY}" -c "import torch, sys; sys.exit(0 if torch.__version__.startswith('${TORCH_VERSION}') else 1)" 2>/dev/null; then
  "${UV}" pip install --python "${PY}" "torch==${TORCH_VERSION}" --index-url https://download.pytorch.org/whl/cu121
fi
"${UV}" pip install --python "${PY}" -r "${CODE}/surface/common/requirements-base.txt"
"${PY}" - <<'PY'
import torch, numpy, scipy, trimesh, xatlas, PIL, plyfile
print("torch", torch.__version__, "cuda build", torch.version.cuda, "cuda available", torch.cuda.is_available())
print("numpy", numpy.__version__, "scipy", scipy.__version__, "trimesh", trimesh.__version__, "pillow", PIL.__version__)
PY
echo "base env OK: ${ENV}"
