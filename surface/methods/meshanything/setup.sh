#!/usr/bin/env bash
# MeshAnything V1 + V2 (official code, pretrained HF weights). Env: Python 3.10, torch 2.1.1+cu118, flash-attn wheel.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
ENV="${DATA}/envs/meshanything"; PY="${ENV}/bin/python"
for r in MeshAnything:meshanything_v1:7a3cd73 MeshAnythingV2:meshanything_v2:461d3b6; do
  IFS=: read -r repo dir commit <<< "${r}"
  [[ -d "${TP}/${dir}" ]] || git clone -q "https://github.com/buaacyw/${repo}" "${TP}/${dir}"
  git -C "${TP}/${dir}" checkout -q "${commit}"
done
[[ -x "${PY}" ]] || "${UV}" venv --python 3.10 "${ENV}"
"${UV}" pip install --python "${PY}" torch==2.1.1 torchvision==0.16.1 --index-url https://download.pytorch.org/whl/cu118
grep -v -E '^(gradio|spaces)' "${TP}/meshanything_v2/requirements.txt" > "${DATA}/work/ma_requirements.txt"
"${UV}" pip install --python "${PY}" -r "${DATA}/work/ma_requirements.txt" setuptools wheel ninja
"${UV}" pip install --python "${PY}" \
  "https://github.com/Dao-AILab/flash-attention/releases/download/v2.5.8/flash_attn-2.5.8+cu118torch2.1cxx11abiFALSE-cp310-cp310-linux_x86_64.whl"
"${PY}" -c "import torch, flash_attn, transformers; print('torch', torch.__version__, 'flash_attn', flash_attn.__version__, 'cuda', torch.cuda.is_available())"
# download weights once (HF_HOME under DATA/cache/hf)
"${PY}" - <<'PY'
from huggingface_hub import snapshot_download
for r in ("Yiwen-ntu/meshanythingv2", "Yiwen-ntu/MeshAnything"):
    print(r, snapshot_download(r))
PY
echo "meshanything setup OK"
