# Shared environment for Sub-project 2 scripts (sourced, runs on the allocation node).
export CODE="${CODE:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)}"
export DATA="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}"
export CV802_SP2_DATA_ROOT="${DATA}"
export UV="${DATA}/tools/uv/uv" UV_CACHE_DIR="${DATA}/cache/uv" UV_PYTHON_INSTALL_DIR="${DATA}/tools/python"
export PIP_CACHE_DIR="${DATA}/cache/pip" XDG_CACHE_HOME="${DATA}/cache/xdg"
export HF_HOME="${DATA}/cache/hf" TORCH_HOME="${DATA}/cache/torch"
export CUDA_HOME=/usr/local/cuda-12.2 TORCH_CUDA_ARCH_LIST="8.9" MAX_JOBS=6
export PYTHONPATH="${CODE}${PYTHONPATH:+:${PYTHONPATH}}" PYTHONUNBUFFERED=1
export INPUT_PLY="${CV802_SP2_INPUT_PLY:-${CODE}/surface/inputs/light_shirt_vggsfm_clean.ply}"
export OUTPUTS="${CV802_SP2_OUTPUTS:-${DATA}/outputs}"   # per-dataset outputs (DATA/outputs = VGGSfM input)
export BASE_PY="${DATA}/envs/base/bin/python"
export TP="${DATA}/third_party"
