#!/usr/bin/env bash
# Reserve the single workstation GPU (RTX 5000 Ada, 32 GB) used by Sub-project 2.
set -Eeuo pipefail
DATA_ROOT="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}"
mkdir -p "${DATA_ROOT}/runtime"
salloc -N1 -n12 --mem=32G --no-shell -J cv802_sp2 2>&1 | tee "${DATA_ROOT}/runtime/salloc.log"
JOB="$(grep -oE 'Granted job allocation [0-9]+' "${DATA_ROOT}/runtime/salloc.log" | awk '{print $4}')"
echo "${JOB}" > "${DATA_ROOT}/runtime/jobid"
echo "Allocation ${JOB} on $(squeue -h -j "${JOB}" -o %N)"
