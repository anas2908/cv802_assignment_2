#!/usr/bin/env bash
# Run a shell command on the Sub-project 2 Slurm allocation, never on the login node.
# Usage: surface/scripts/node_run.sh '<command>'      (CPU/IO work, may run concurrently)
#        CV802_GPU_LOCK=1 surface/scripts/node_run.sh '<command>'   (serialised GPU work)
#        CV802_BUILD_LOCK=1 surface/scripts/node_run.sh '<command>' (serialised heavy compiles)
set -Eeuo pipefail
DATA_ROOT="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}"
JOB="${CV802_SP2_JOBID:-$(cat "${DATA_ROOT}/runtime/jobid")}"
if ! squeue -h -j "${JOB}" -o %T 2>/dev/null | grep -q RUNNING; then
  echo "ERROR: allocation ${JOB} is not running. Start one with surface/scripts/allocate.sh" >&2
  exit 3
fi
CMD="$*"
if [[ "${CV802_BUILD_LOCK:-0}" == "1" ]]; then
  CMD="flock /tmp/cv802_sp2_build.lock bash -lc $(printf %q "${CMD}")"
fi
if [[ "${CV802_GPU_LOCK:-0}" == "1" ]]; then
  # The lock lives on the node's local disk because Lustre may not support flock.
  CMD="flock /tmp/cv802_sp2_gpu.lock bash -lc $(printf %q "${CMD}")"
fi
exec srun --jobid="${JOB}" --overlap --ntasks=1 --cpus-per-task=12 --mem=0 \
  --export=ALL,CV802_SP2_DATA_ROOT="${DATA_ROOT}" bash -lc "${CMD}"
