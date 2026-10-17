#!/usr/bin/env bash
# NKSR (Huang et al., CVPR 2023), official code + pretrained "kitchen-sink" weights (downloaded on first use).
# Pre-built wheels expired (README, 2025-09); we compile the official CUDA package from source:
# PyTorch 2.7.0+cu128 as the authors require, compiled with the node's nvcc 12.2 (same CUDA major) for sm_89.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
ENV="${DATA}/envs/nksr"; PY="${ENV}/bin/python"; REPO="${TP}/nksr"
[[ -d "${REPO}" ]] || git clone -q https://github.com/nv-tlabs/NKSR "${REPO}"
git -C "${REPO}" checkout -q e403368
[[ -x "${PY}" ]] || "${UV}" venv --python 3.11 "${ENV}"
"${UV}" pip install --python "${PY}" torch==2.7.0+cu128 torchvision --extra-index-url https://download.pytorch.org/whl/cu128
"${UV}" pip install --python "${PY}" torch-scatter -f https://data.pyg.org/whl/torch-2.7.0+cu128.html \
  || "${UV}" pip install --python "${PY}" --no-build-isolation torch-scatter
"${UV}" pip install --python "${PY}" "python-pycg>=1.0.1" open3d numpy matplotlib ninja GitPython pyntcloud plyfile setuptools wheel   # nksr imports pycg.vis -> open3d (NKSR env only)
if ! "${PY}" -c "import nksr" 2>/dev/null; then
  ( cd "${REPO}" && CC=gcc-12 CXX=g++-12 MAX_JOBS=8 "${UV}" pip install --python "${PY}" --no-build-isolation package/ )
fi
"${PY}" -c "import torch, nksr; print('torch', torch.__version__, 'nksr OK', torch.cuda.is_available())"
echo "nksr setup OK"
