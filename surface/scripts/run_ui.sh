#!/usr/bin/env bash
# Start the Sub-project 2 UI on the GPU allocation (never on the login node). Run from the login node:
#   bash surface/scripts/run_ui.sh            (Ctrl-C stops it; or run it inside tmux)
set -Eeuo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DATA="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}"
PORT="${CV802_UI_PORT:-8794}"; TAG=""
# live UIs show only this dataset's runs (the repo bundle mixes both datasets; it is for run_viewer_local.sh)
EXTRA="--results-root ${DATA}/runtime/no_bundle"
DS="${CV802_SP2_DATASET:-vggsfm}"
if [[ "${DS}" != vggsfm ]]; then   # other inputs: own outputs, port, view frame (surface/scripts/dataset_<name>.sh)
  source "${HERE}/dataset_${DS}.sh"; TAG="_${DS}"
  case "${DS}" in mvs) PORT="${CV802_UI_PORT:-8792}";; mvs_clean) PORT="${CV802_UI_PORT:-8796}";; *) PORT="${CV802_UI_PORT:-8798}";; esac
  EXTRA="${EXTRA} --outputs-root ${CV802_SP2_OUTPUTS} --input-ply ${CV802_SP2_INPUT_PLY}"
  export CV802_SP2_FRAME_JSON="${CV802_SP2_OUTPUTS}/view_frame.json"
fi
JOB="$(cat "${DATA}/runtime/jobid")"; NODE="$(squeue -h -j "${JOB}" -o %N)"
TOKEN="${CV802_UI_TOKEN:-$(head -c 18 /dev/urandom | base64 | tr '+/' '-_')}"
echo "${TOKEN}" >| "${DATA}/runtime/ui_token${TAG}"
cat <<MSG
============================================================
CV802 Sub-project 2 UI on ${NODE}:${PORT} (allocation ${JOB})

VS Code: open the PORTS panel -> "Forward a Port" -> type  ${PORT}
then open   http://localhost:${PORT}/?token=${TOKEN}
(a tiny bridge on the login node forwards localhost:${PORT} to ${NODE}:${PORT};
 if VS Code picks another local port, use that port instead)

Without VS Code, on your laptop:
  ssh -N -L ${PORT}:${NODE}:${PORT} ${USER}@<login-node>
  then open http://localhost:${PORT}/?token=${TOKEN}
============================================================
MSG
# idle-cheap byte bridge so VS Code can forward a plain localhost port on the login node
python3 "${HERE}/login_forward.py" "${NODE}" "${PORT}" > "${DATA}/runtime/logs/ui_forward.log" 2>&1 &
FWD=$!; trap 'kill ${FWD} 2>/dev/null' EXIT
"${HERE}/node_run.sh" "python3 -B ${HERE}/../ui/server.py --host 0.0.0.0 --port ${PORT} --token ${TOKEN} ${EXTRA}"
