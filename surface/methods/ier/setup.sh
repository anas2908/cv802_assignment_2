#!/usr/bin/env bash
# IER meshing (Liu et al. ECCV 2020), official code + official pretrained ShapeNet model.
# Original stack: PyTorch 1.3 / CUDA 10. Ported minimally: PyTorch 1.12.1+cu116, SparseConvNet built with
# CUDA 11.6 + gcc-9 for sm_86 (binary-compatible with the RTX 5000 Ada, sm_89).
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
ENV="${DATA}/envs/ier"; PY="${ENV}/bin/python"; REPO="${TP}/ier"
[[ -d "${REPO}" ]] || git clone -q --recursive https://github.com/Colin97/Point2Mesh "${REPO}"
git -C "${REPO}" checkout -q aa080b2 && git -C "${REPO}" submodule update --init --recursive -q
[[ -x "${PY}" ]] || "${UV}" venv --python 3.10 "${ENV}"
"${UV}" pip install --python "${PY}" torch==1.12.1+cu116 --extra-index-url https://download.pytorch.org/whl/cu116
"${UV}" pip install --python "${PY}" "numpy<1.24" plyfile tqdm scipy pillow "setuptools<70" wheel gdown
export NVCC_PREPEND_FLAGS="-ccbin /usr/bin/g++-9" CUDA_HOME=/apps/local/cuda-11.6 CC=gcc-9 CXX=g++-9 TORCH_CUDA_ARCH_LIST="8.6" PATH="/apps/local/cuda-11.6/bin:${PATH}"
if ! "${PY}" -c "import sparseconvnet" 2>/dev/null; then
  ( cd "${REPO}/SparseConvNet" && rm -rf build && "${PY}" setup.py develop )
fi
"${PY}" -c "import torch, sparseconvnet; print('torch', torch.__version__, 'scn OK', torch.cuda.is_available())"
# annoy 1.16 (README: 1.17 changed the API); C++ candidate proposal + post-processing
if [[ ! -f "${REPO}/annoy/src/annoylib.h" ]] || ! grep -q "1.16" "${REPO}/annoy/setup.py" 2>/dev/null; then
  rm -rf "${REPO}/annoy" && mkdir -p "${DATA}/work/ier" && curl -sL https://github.com/spotify/annoy/archive/v1.16.zip -o "${DATA}/work/ier/annoy.zip" \
    && ( cd "${DATA}/work/ier" && rm -rf annoy-1.16 && unzip -q annoy.zip ) && mv "${DATA}/work/ier/annoy-1.16" "${REPO}/annoy"
fi
for d in preprocess_with_pc postprocess; do
  ( cd "${REPO}/${d}" && mkdir -p build && cd build && CC=gcc-12 CXX=g++-12 cmake .. -DCMAKE_BUILD_TYPE=Release >/dev/null && make -j6 )
done
CK="${REPO}/log/shapenet_pretrained/checkpoints/best_model.pth"
[[ -s "${CK}" ]] || "${ENV}/bin/gdown" 147_jSh36s7PiyTauS9PTcNBeN77iICCB -O "${CK}"
sha256sum "${CK}"
echo "ier setup OK"
