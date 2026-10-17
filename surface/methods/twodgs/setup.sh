#!/usr/bin/env bash
# 2D Gaussian Splatting (Huang et al., SIGGRAPH 2024), official code. Env: Python 3.10, PyTorch 2.1 cu121,
# CUDA rasteriser submodules compiled with nvcc 12.2 for sm_89.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
ENV="${DATA}/envs/twodgs"; PY="${ENV}/bin/python"; REPO="${TP}/twodgs"
[[ -d "${REPO}" ]] || git clone -q --recursive https://github.com/hbb1/2d-gaussian-splatting "${REPO}"
git -C "${REPO}" checkout -q f3e3b9f && git -C "${REPO}" submodule update --init --recursive -q
[[ -x "${PY}" ]] || "${UV}" venv --python 3.10 "${ENV}"
"${UV}" pip install --python "${PY}" torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu121
"${UV}" pip install --python "${PY}" "numpy<2" "open3d==0.18.0" mediapy lpips scikit-image tqdm trimesh plyfile opencv-python-headless "setuptools<70" wheel ninja
if ! "${PY}" -c "import diff_surfel_rasterization, simple_knn" 2>/dev/null; then
  export CC=gcc-12 CXX=g++-12
  "${UV}" pip install --python "${PY}" --no-build-isolation "${REPO}/submodules/diff-surfel-rasterization" "${REPO}/submodules/simple-knn"
fi
"${PY}" -c "import torch, diff_surfel_rasterization, simple_knn, open3d; print('2dgs OK', torch.__version__, torch.cuda.is_available())"
echo "twodgs setup OK"
