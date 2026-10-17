#!/usr/bin/env bash
# rerun_step.sh <step_id> <method> <run_id> <finalize args...> -- <run args...>
# Re-run one queue step on the node (GPU-locked), updating the same status/log files the tmux view reads.
set -uo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/env.sh"
Q="${DATA}/runtime/queue"; S="$1"; M="$2"; ID="$3"; shift 3
FARGS=(); while [[ $# -gt 0 && "$1" != "--" ]]; do FARGS+=("$1"); shift; done; [[ "${1:-}" == "--" ]] && shift
O="${OUTPUTS}/${M}/${ID}"
export FINALIZE_ARGS="${FARGS[*]:-}"   # forwarded to finalize.sh inside the locked shell
echo "waiting for GPU" >| "${Q}/${S}.status"
flock /tmp/cv802_sp2_gpu.lock bash -c '
  Q="$1"; S="$2"; M="$3"; O="$4"; shift 4
  echo running >| "${Q}/${S}.status"; date +%s >| "${Q}/${S}.start"; echo "${S}" >| "${Q}/current"
  rm -rf -- "${O:?}"
  { echo "### $(date) rerun ${S}: outputs/${M}/$(basename "${O}")"; } >| "${Q}/${S}.log"
  if "${CODE}/surface/methods/${M}/run.sh" "${O}" "$@" >> "${Q}/${S}.log" 2>&1 \
     && { [[ "${M}" != dhsp ]] && "${CODE}/surface/scripts/finalize.sh" "${O}" ${FINALIZE_ARGS} \
          || "${CODE}/surface/scripts/finalize.sh" "${O}" --color-source vertex || "${CODE}/surface/scripts/finalize.sh" "${O}"; } >> "${Q}/${S}.log" 2>&1
  then echo done >| "${Q}/${S}.status"; else echo failed >| "${Q}/${S}.status"; fi
  date +%s >| "${Q}/${S}.end"; echo "" >| "${Q}/current"
' _ "${Q}" "${S}" "${M}" "${O}" "$@"
