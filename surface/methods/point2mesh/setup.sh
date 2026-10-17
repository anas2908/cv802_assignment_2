#!/usr/bin/env bash
# Point2Mesh (Hanocka et al. SIGGRAPH 2020), official code. Original: PyTorch 1.4 + PyTorch3D 0.2.
# Ported: PyTorch 2.1.0+cu121 + PyTorch3D 0.7.5 (prebuilt wheel, else source build); Manifold built from source.
# The same env and Manifold build are reused by DHSP (its 3D prior is Point2Mesh-based).
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
ENV="${DATA}/envs/p2m"; PY="${ENV}/bin/python"; REPO="${TP}/point2mesh"; MF="${TP}/Manifold"
[[ -d "${REPO}" ]] || git clone -q https://github.com/ranahanocka/point2mesh "${REPO}"
git -C "${REPO}" checkout -q 333dba0
[[ -d "${MF}" ]] || git clone -q --recursive https://github.com/hjwdzh/Manifold "${MF}"
if [[ ! -x "${MF}/build/manifold" ]]; then
  ( mkdir -p "${MF}/build" && cd "${MF}/build" && CC=gcc-12 CXX=g++-12 cmake .. -DCMAKE_BUILD_TYPE=Release >/dev/null && make -j6 )
fi
ls -la "${MF}/build/manifold" "${MF}/build/simplify"
# point the official options at our Manifold build (the only source edit)
sed -i "s|^MANIFOLD_DIR = .*|MANIFOLD_DIR = r'${MF}/build'  # cv802: local build|" "${REPO}/options.py"
# PyTorch>=1.5 compatibility (create_submesh device fix): old torch allowed indexing a CPU mask with CUDA indices
sed -i 's|        vs_mask = torch.zeros(mesh.vs.shape\[0\])$|        vs_mask = torch.zeros(mesh.vs.shape[0], device=vs_index.device)  # cv802: torch>=1.5 device fix|' "${REPO}/models/layers/mesh.py"
sed -i 's|                face = self.sub_mesh_index\[i\]\[face\].to(face.device).long()$|                face = self.sub_mesh_index[i][face.to(self.sub_mesh_index[i].device)].long()  # cv802: device fix|' "${REPO}/models/layers/mesh.py"
[[ -x "${PY}" ]] || "${UV}" venv --python 3.10 "${ENV}"
"${UV}" pip install --python "${PY}" torch==2.1.0 --index-url https://download.pytorch.org/whl/cu121
"${UV}" pip install --python "${PY}" "numpy<1.24" scipy trimesh matplotlib tensorboardX fvcore iopath "setuptools<70" wheel ninja cython
if ! "${PY}" -c "import pytorch3d" 2>/dev/null; then
  "${UV}" pip install --python "${PY}" pytorch3d -f https://dl.fbaipublicfiles.com/pytorch3d/packaging/wheels/py310_cu121_pyt210/download.html \
  || FORCE_CUDA=1 CC=gcc-12 CXX=g++-12 "${UV}" pip install --python "${PY}" --no-build-isolation "git+https://github.com/facebookresearch/pytorch3d.git@v0.7.5"
fi
"${PY}" -c "import torch, pytorch3d; from pytorch3d.loss import chamfer_distance; print('torch', torch.__version__, 'pytorch3d', pytorch3d.__version__, torch.cuda.is_available())"
echo "point2mesh setup OK"
