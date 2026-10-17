#!/usr/bin/env bash
# Deep Hybrid Self-Prior (Wei et al. ICCV 2021), official code (README marks it "under constructing").
# Reuses the Point2Mesh env (PyTorch 2.1 cu121) + Manifold build. Adds the CUDA chamfer extension the code
# imports as `chamfer` (AtlasNet/ChamferDistancePytorch chamfer3D, same forward/backward API).
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
bash "${CODE}/surface/methods/point2mesh/setup.sh"
PY="${DATA}/envs/p2m/bin/python"; REPO="${TP}/dhsp"
[[ -d "${REPO}" ]] || git clone -q https://github.com/weixk2015/DHSP3D "${REPO}"
git -C "${REPO}" checkout -q 02775c6
sed -i "s|data = data_iter.next()|data = next(data_iter)  # cv802: Python 3 iterator API|" "${REPO}/train.py"   # next(data_iter) fix
# 2D-stage fixes (the README says the code is "under constructing"):
grep -q "add_argument('name'" "${REPO}/im_complete.py" || sed -i "s|^args = parser.parse_args()|parser.add_argument('name', metavar='NAME', help='names')  # cv802: im_complete name arg was never declared\nargs = parser.parse_args()|" "${REPO}/im_complete.py"
sed -i 's|/home/weixingkui/data/%s_m.obj|%s_m.obj|g' "${REPO}/back_proj.py"   # cv802: author-machine path -> local file
grep -rl "from skimage.measure import compare_psnr" "${REPO}" --include=*.py | xargs -r sed -i 's|from skimage.measure import compare_psnr|from skimage.metrics import peak_signal_noise_ratio as compare_psnr  # cv802: skimage>=0.18 API|'
mkdir -p "${REPO}/util" && ln -sfn "${TP}/Manifold" "${REPO}/util/Manifold"
"${UV}" pip install --python "${PY}" torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu121
"${UV}" pip install --python "${PY}" pillow scikit-image tensorboardX "numpy<1.24"
if ! "${PY}" -c "import torch, chamfer" 2>/dev/null; then
  [[ -d "${TP}/ChamferDistancePytorch" ]] || git clone -q https://github.com/ThibaultGROUEIX/ChamferDistancePytorch "${TP}/ChamferDistancePytorch"
  ( cd "${TP}/ChamferDistancePytorch/chamfer3D" && CC=gcc-12 CXX=g++-12 "${PY}" setup.py install )
  SP=$("${PY}" -c "import site; print(site.getsitepackages()[0])")
  printf 'import torch  # noqa: F401  (loads libtorch before the extension)\nfrom chamfer_3D import *  # noqa: F401,F403\n' > "${SP}/chamfer.py"
fi
"${PY}" -c "import torch, chamfer; print('chamfer ext OK', chamfer.forward)"
echo "dhsp setup OK"
