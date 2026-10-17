#!/usr/bin/env bash
# Shape As Points (Peng et al., NeurIPS 2021), official code, optimisation-based mode (no training data).
# Reuses the Point2Mesh env (PyTorch 2.1 cu121 + PyTorch3D 0.7.5) and adds SAP's extra dependencies.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
bash "${CODE}/surface/methods/point2mesh/setup.sh" > /dev/null
PY="${DATA}/envs/p2m/bin/python"; REPO="${TP}/sap"
[[ -d "${REPO}" ]] || git clone -q https://github.com/autonomousvision/shape_as_points "${REPO}"
git -C "${REPO}" checkout -q a094733
"${UV}" pip install --python "${PY}" torch-scatter -f https://data.pyg.org/whl/torch-2.1.0+cu121.html
"${UV}" pip install --python "${PY}" pykdtree plyfile scikit-image "numpy<1.24" trimesh tensorboard pyyaml tqdm "open3d==0.18.0" ipdb "libigl==2.5.1"
"${PY}" -c "import torch, torch_scatter, pytorch3d, pykdtree, skimage; print('sap deps OK', torch.__version__)"
echo "sap setup OK"
