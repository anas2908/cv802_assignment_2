#!/usr/bin/env bash
# Start (or resume) the unattended queue in tmux session "cv802": top pane = live progress, bottom = queue output.
# Attach any time with:  tmux attach -t cv802      (detach: Ctrl-b then d)
set -Eeuo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
tmux has-session -t cv802 2>/dev/null && { echo "tmux session cv802 already exists: tmux attach -t cv802"; exit 0; }
DATA="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}"; rm -f "${DATA}/runtime/queue/queue.state"
tmux new-session -d -s cv802 -n queue "bash ${HERE}/queue_status.sh"
tmux split-window -v -t cv802:queue -l 12 "${HERE}/node_run.sh 'bash ${HERE}/queue.sh'; echo; echo 'queue process ended - press Enter'; read"
tmux select-pane -t cv802:queue.0
echo "Queue started. Watch it with:  tmux attach -t cv802"
