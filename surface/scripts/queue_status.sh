#!/usr/bin/env bash
# Live progress of the Sub-project 2 queue (reads small status files only; light enough for the login node).
# Usage: queue_status.sh [--once]      refreshes every 60 s
DATA="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}"; Q="${DATA}/runtime/queue"
B=$'\e[1m'; D=$'\e[2m'; R=$'\e[0m'; G=$'\e[32m'; Y=$'\e[33m'; RE=$'\e[31m'; C=$'\e[36m'

bar() { # bar <percent> <width>
  local p=$1 w=$2 f; (( p > 100 )) && p=100; f=$(( p * w / 100 ))
  printf '%s%s%s%s %3d%%' "${G}" "$(printf '█%.0s' $(seq 1 $f) 2>/dev/null)" "${D}$(printf '░%.0s' $(seq 1 $(( w - f ))) 2>/dev/null)" "${R}" "$p"
}
run_dir() { grep -o "outputs[a-z_]*/[a-z0-9]*/[A-Za-z0-9._-]*" "${Q}/$1.log" 2>/dev/null | head -1; }
fscore() { # F@1% of the step's finished run, if any
  local d; d=$(run_dir "$1"); [[ -n "$d" && -f "${DATA}/$d/manifest.json" ]] || return
  grep -o '"fscore_1pct": *[0-9.]*' "${DATA}/$d/manifest.json" | head -1 | grep -o '[0-9.]*$' | cut -c1-5
}
live_line() { # one readable line about what the running step is doing
  local log="${Q}/$1.log" l
  l=$(grep -E "iter: [0-9]+ out of|\(epoch: [0-9]+, steps: [0-9]+|^\[ *[0-9]+%\]|cg it|texture\]|Iteration|it/s" "$log" 2>/dev/null | tail -1)
  if [[ "$l" =~ epoch:\ ([0-9]+),\ steps:\ ([0-9]+).*\)\ loss:\ ([0-9.]+) ]]; then
    echo "3D self-prior: epoch ${BASH_REMATCH[1]}/4, step ${BASH_REMATCH[2]}, loss ${BASH_REMATCH[3]}"
  elif [[ "$l" =~ iter:\ ([0-9]+)\ out\ of:\ ([0-9]+).*loss:\ (-?[0-9.]+) ]]; then
    echo "optimising: iteration ${BASH_REMATCH[1]}/${BASH_REMATCH[2]}, loss ${BASH_REMATCH[3]}"
  else
    echo "${l}" | sed 's/^ *//'
  fi
}

draw() {
  local cols; cols=$(tput cols 2>/dev/null || echo 100)
  clear 2>/dev/null || true
  local job; job=$(cat "${DATA}/runtime/jobid" 2>/dev/null)
  echo "${B}${C}CV802 · Sub-project 2 · surface extraction queue${R}     $(date '+%H:%M')"
  echo "${D}GPU job ${job} on $(squeue -h -j "${job}" -o '%N · %L left' 2>/dev/null)   (refresh 15 s, Ctrl-b d to detach)${R}"
  local GF="${DATA}/runtime/gpu_stats.txt"
  if [[ -f "$GF" ]]; then   # written every 10 s on the GPU node by gpu_sampler.sh
    IFS=', ' read -r gt gu gm gtot gtemp gpw gn < "$GF"
    gt=${gt//[^0-9]/}; gu=${gu//[^0-9]/}; gm=${gm//[^0-9]/}; gtot=${gtot//[^0-9]/}; gn=${gn//[^0-9]/}   # tolerate [N/A] / partial reads
    local age=$(( $(date +%s) - ${gt:-0} )) mp=$(( 100 * ${gm:-0} / (${gtot:-1} > 0 ? ${gtot:-1} : 1) ))
    echo "  ${B}GPU${R}      $(bar "${gu:-0}" 30)  util   ${D}${gtemp}°C ${gpw%.*} W · ${gn} processes · ${age}s ago${R}"
    echo "  ${B}VRAM${R}     $(bar "${mp}" 30)  $(( ${gm:-0} / 1024 )).$(( (${gm:-0} % 1024) * 10 / 1024 )) / $(( ${gtot:-0} / 1024 )) GB"
  fi
  [[ -f "${Q}/plan.txt" ]] || { echo "queue not started yet"; return; }

  local tot=0 dn=0 cur; cur=$(cat "${Q}/current" 2>/dev/null)
  while IFS='|' read -r id w desc; do
    tot=$(( tot + w )); st=$(cat "${Q}/${id}.status" 2>/dev/null || echo pending)
    case "${st}" in done|failed*|skipped*) dn=$(( dn + w ));; running)
      el=$(( $(date +%s) - $(cat "${Q}/${id}.start" 2>/dev/null || date +%s) )); pp=$(( el * 100 / (w * 60) )); (( pp > 95 )) && pp=95
      dn=$(( dn + w * pp / 100 ));; esac
  done < "${Q}/plan.txt"
  echo; echo "  ${B}Overall${R}  $(bar $(( dn * 100 / (tot > 0 ? tot : 1) )) 40)"; echo

  printf "  ${B}%-2s %-34s %-12s %8s  %s${R}\n" "" "Step" "Status" "Time" "F@1%"
  local errs=()
  while IFS='|' read -r id w desc; do
    st=$(cat "${Q}/${id}.status" 2>/dev/null || echo pending); t=""; f=""
    [[ -f "${Q}/${id}.end" && -f "${Q}/${id}.start" && "${st}" != running && "${st}" != waiting* ]] && t="$(( ($(cat "${Q}/${id}.end") - $(cat "${Q}/${id}.start")) / 60 )) min"
    case "${st}" in
      done) ic="${G}✔${R}"; sc="${G}done${R}"; f=$(fscore "${id}");;
      running) ic="${Y}▶${R}"; sc="${Y}running${R}"; t="$(( ($(date +%s) - $(cat "${Q}/${id}.start")) / 60 ))/${w}m";;
      failed*) ic="${RE}✘${R}"; sc="${RE}failed${R}"; errs+=("${id}");;
      waiting*) ic="${C}…${R}"; sc="${C}waits GPU${R}";;
      skipped*) ic="${D}–${R}"; sc="${D}skipped${R}";;
      *) ic=" "; sc="${D}pending${R}";;
    esac
    printf "  %s %-34s %-21s %8s  %s\n" "${ic}" "${desc:0:34}" "${sc}" "${t}" "${f}"
  done < "${Q}/plan.txt"

  if [[ -n "${cur}" && "$(cat "${Q}/${cur}.status" 2>/dev/null)" == running ]]; then
    local d p stage; d=$(run_dir "${cur}")
    echo; echo "  ${B}Now:${R} $(grep -m1 "^${cur}|" "${Q}/plan.txt" | cut -d'|' -f3)"
    if [[ -n "$d" && -f "${DATA}/$d/progress.json" ]]; then
      p=$(grep -o '"percent": *[0-9]*' "${DATA}/$d/progress.json" | grep -o '[0-9]*$')
      stage=$(grep -o '"stage": *"[^"]*"' "${DATA}/$d/progress.json" | cut -d'"' -f4)
      echo "  stage    $(bar "${p:-0}" 30)  ${stage}"
    fi
    echo "  ${D}$(live_line "${cur}" | cut -c1-$(( cols - 4 )))${R}"
  fi

  echo
  if (( ${#errs[@]} )); then
    echo "  ${RE}${B}Errors${R}"
    for e in "${errs[@]}"; do
      echo "  ${RE}${e}:${R} $(grep -E "Error|error:" "${Q}/${e}.log" 2>/dev/null | grep -v "^ *File" | tail -1 | sed 's/^ *//' | cut -c1-$(( cols - 8 - ${#e} )))"
    done
  else
    echo "  ${G}No errors.${R}"
  fi
  [[ "$(cat "${Q}/queue.state" 2>/dev/null)" == finished && -z "${cur}" ]] && echo "  ${G}${B}Queue finished $(cat "${Q}/finished_at")${R}"
}
if [[ "${1:-}" == "--once" ]]; then draw; exit 0; fi
while true; do ( draw ) || echo "  (status refresh error, retrying)"; sleep 15; done   # one bad refresh never closes the window
