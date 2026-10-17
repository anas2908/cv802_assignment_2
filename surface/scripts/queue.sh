#!/usr/bin/env bash
# Unattended Sub-project 2 queue. Runs ON the allocation node (started by start_queue.sh inside tmux).
# Each step writes DATA/runtime/queue/<step>.{status,log}; finished steps are skipped on a re-run, so after
# fixing a failure just start the queue again. A failed step never stops the remaining steps.
set -uo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/env.sh"
Q="${DATA}/runtime/queue"; mkdir -p "${Q}"
OUT="${DATA}/outputs"; M="${CODE}/surface/methods"; FIN="${CODE}/surface/scripts/finalize.sh"
echo $$ >| "${Q}/queue.pid"

# step <id> <weight-minutes> <description> <command...>
STEPS=()
step() { STEPS+=("$1|$2|$3|$4"); }
gpu() { echo "flock /tmp/cv802_sp2_gpu.lock bash -c $(printf %q "$*")"; }
run_fin() { # run_fin <method> <run_id> <finalize args> -- <run args>
  local m="$1" id="$2" fargs="$3"; shift 3
  gpu "rm -rf '${OUT}/${m}/${id}' && ${M}/${m}/run.sh '${OUT}/${m}/${id}' $* && ${FIN} '${OUT}/${m}/${id}' ${fargs}"
}

step setup_meshanything 12 "MeshAnything env + weights"     "bash ${M}/meshanything/setup.sh"
step setup_ier          15 "IER env, SparseConvNet, weights" "bash ${M}/ier/setup.sh"
step setup_point2mesh   20 "Point2Mesh env, PyTorch3D, Manifold" "bash ${M}/point2mesh/setup.sh"
step poisson_refinalize  5 "Poisson v1 re-finalize"          "$(gpu "${FIN} '${OUT}/poisson/poisson-v1-r256-a4-t2'")"
step poisson_r384        8 "Poisson 384^3, alpha 4"          "$(run_fin poisson poisson-v2-r384-a4-t2 '' --res 384 --alpha 4 --trim 2)"
step poisson_classic     5 "Poisson 256^3, unscreened (2006)" "$(run_fin poisson poisson-v3-r256-a0-t2 '' --res 256 --alpha 0 --trim 2)"
step ma_v2_greedy        4 "MeshAnything V2 greedy"          "$(run_fin meshanything meshanything-v2-greedy '' --version v2 --seed 0)"
step ma_v2_s1            4 "MeshAnything V2 sampling seed 1" "$(run_fin meshanything meshanything-v2-sample-s1 '' --version v2 --seed 1 --sampling)"
step ma_v2_s2            4 "MeshAnything V2 sampling seed 2" "$(run_fin meshanything meshanything-v2-sample-s2 '' --version v2 --seed 2 --sampling)"
step ma_v1_greedy        4 "MeshAnything V1 greedy"          "$(run_fin meshanything meshanything-v1-greedy '' --version v1 --seed 0)"
step ier_run             8 "IER meshing 12.5k points"        "$(run_fin ier ier-v1-p12500 '' --points 12500)"
step p2m_run            80 "Point2Mesh 6000 iterations"      "$(run_fin point2mesh point2mesh-v1-it6000 '' --iterations 6000)"
step setup_dhsp          8 "DHSP chamfer ext"                "bash ${M}/dhsp/setup.sh"
step dhsp_run           90 "DHSP hybrid self-prior"          "$(gpu "rm -rf '${OUT}/dhsp/dhsp-v1' && ${M}/dhsp/run.sh '${OUT}/dhsp/dhsp-v1' && (${FIN} '${OUT}/dhsp/dhsp-v1' --color-source vertex || ${FIN} '${OUT}/dhsp/dhsp-v1' --color-source points)")"
step select_best         1 "pick best run per method"        "${BASE_PY} -m surface.scripts.select_best"

printf '%s\n' "${STEPS[@]}" | cut -d'|' -f1-3 >| "${Q}/plan.txt"
deps() { case "$1" in ma_*) echo setup_meshanything;; ier_run) echo setup_ier;; p2m_run|setup_dhsp) echo setup_point2mesh;; dhsp_run) echo setup_dhsp;; esac; }

for s in "${STEPS[@]}"; do
  IFS='|' read -r id w desc cmd <<< "${s}"
  [[ "$(cat "${Q}/${id}.status" 2>/dev/null)" == done ]] && continue
  d="$(deps "${id}")"
  if [[ -n "${d}" && "$(cat "${Q}/${d}.status" 2>/dev/null)" != done ]]; then
    echo "skipped (needs ${d})" >| "${Q}/${id}.status"; continue
  fi
  echo running >| "${Q}/${id}.status"; date +%s >| "${Q}/${id}.start"
  echo "${id}" >| "${Q}/current"
  { echo "### $(date) ${id}: ${desc}"; echo "### ${cmd}"; } >| "${Q}/${id}.log"
  if bash -c "${cmd}" >> "${Q}/${id}.log" 2>&1; then echo done >| "${Q}/${id}.status"; else echo "failed ($?)" >| "${Q}/${id}.status"; fi
  date +%s >| "${Q}/${id}.end"
done
echo "" >| "${Q}/current"; echo finished >| "${Q}/queue.state"; date >| "${Q}/finished_at"
