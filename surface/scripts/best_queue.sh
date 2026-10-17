#!/usr/bin/env bash
# Best-quality pass for every method of the brief (+ NKSR), VGGSfM first, then the outlier-cleaned MVS cloud.
# Every final mesh gets photo texture v2 (4K, exposure-balanced); watertight ones get 3D-print exports.
# Steps whose result already exists are skipped, so the queue can simply be restarted. Runs ON the node.
set -uo pipefail
cd "$(dirname -- "${BASH_SOURCE[0]}")/../.."
source surface/scripts/env.sh
export DHSP_SKIP_INLINE_2D=1   # DHSP 2D stages run via run_2d.sh (remesh + OptCuts), not the inline xatlas path
Q="${DATA}/runtime/queue"; R=surface/scripts/rerun_step.sh
VGG_CAMS=${DATA}/work/phototex/vggsfm_from_ciai/light-shirt-vggsfm-v1-colmap-consistent-v1/colmap/sparse/0
MVS_CAMS=${DATA}/work/phototex/sparse/sparse
PTX="--tex-size 4096 --gain --sharpen 8 --depth-scale 1.0 --images datasets/light_shirt/images --masks datasets/reviewed/mac_masks/light_shirt/masks"

st() { echo "$2" >| "${Q}/$1.status"; [[ "$2" == running ]] && { date +%s >| "${Q}/$1.start"; echo "$1" >| "${Q}/current"; }; [[ "$2" == done || "$2" == failed* ]] && date +%s >| "${Q}/$1.end"; }
have() { [[ -f "${OUTPUTS}/$1/manifest.json" ]]; }
method() { # method <step> <method> <run> [finalize args] -- [run args]     (skips when already complete)
  local s="$1" m="$2" r="$3"; shift 3
  if have "${m}/${r}"; then st "$s" done; return 0; fi
  bash "$R" "$s" "$m" "$r" "$@"
}
dhsp_2d() { # dhsp_2d <step> <src 3D-prior run> <dst run> [lap]   remesh + OptCuts pipeline (README steps 3-5 + texture)
  local s="$1" src="$2" dst="$3" lap="${4:-0}"
  if have "dhsp/${dst}"; then st "$s" done; return 0; fi
  st "$s" running
  { local S="${OUTPUTS}/dhsp/${src}" D="${OUTPUTS}/dhsp/${dst}"
    rm -rf -- "${D:?}"; mkdir -p "${D}"; cp "${S}/method_info.json" "${D}/"; cp -r "${S}/work" "${D}/work"
    rm -rf -- "${D:?}/work/output" "${D:?}/work/output_2d" "${D:?}/work/output_mesh" "${D:?}/work/input" "${D:?}/work/input_f" \
              "${D:?}/work/datasets/result/shirtn" "${D:?}/work/uv_methods.txt" "${D:?}/work/shirt_p_uv.obj" "${D:?}/work/shirt_f.obj" "${D:?}/work/shirt_f_uv.obj"
    echo "### outputs/dhsp/${dst}"
    flock /tmp/cv802_sp2_gpu.lock env DHSP_REMESH_FACES=3000 DHSP_REMESH_FACES_F=6000 DHSP_LAP="${lap}" \
      surface/methods/dhsp/run_2d.sh "${D}" && surface/scripts/finalize.sh "${D}" --color-source method; } >| "${Q}/${s}.log" 2>&1 \
    && st "$s" done || st "$s" failed
}
ptx() { # ptx <step> <cams> <run...>    photo texture v2 for each method/run (skips existing)
  local s="$1" cams="$2"; shift 2; st "$s" running; local n=0
  { for mr in "$@"; do
      local m="${mr%%/*}" r="${mr#*/}" extra=""
      [[ "${m}" == ier ]] && extra="--two-sided"
      have "${m}/${r}" || { echo "skip ${mr} (no run)"; continue; }
      have "${m}/${r}-phototex2" && { echo "have ${mr}-phototex2"; n=$((n+1)); continue; }
      echo "### outputs/${m}/${r}-phototex2"
      flock /tmp/cv802_sp2_gpu.lock "${BASE_PY}" -m surface.common.phototex "${OUTPUTS}/${m}/${r}" "${OUTPUTS}/${m}/${r}-phototex2" \
        --model "${cams}" ${PTX} ${extra} \
        && surface/scripts/finalize.sh "${OUTPUTS}/${m}/${r}-phototex2" --color-source method && n=$((n+1))
    done; } >| "${Q}/${s}.log" 2>&1
  [[ ${n} -gt 0 ]] && st "$s" done || st "$s" failed
}
prints() { # prints <step> <run...>
  local s="$1"; shift; st "$s" running
  { for mr in "$@"; do have "${mr}" && { echo "== ${mr}"; "${BASE_PY}" -m surface.scripts.print_export "${OUTPUTS}/${mr}" --height-mm 180; }; done; } >| "${Q}/${s}.log" 2>&1
  st "$s" done
}
pick() { st "$1" running; "${BASE_PY}" -m surface.scripts.select_best >| "${Q}/$1.log" 2>&1 && st "$1" done || st "$1" failed; }

# ============================ 1. VGGSfM (priority) ============================
dhsp_2d v_dhsp_v4 dhsp-v1 dhsp-v4-remesh-optcuts 0
method  v_p2m_v4  point2mesh  point2mesh-v4-unoriented-20k -- --iterations 15000 --max-faces 20000 --unoriented
method  v_ma_mc8  meshanything meshanything-v2-wt384-mc8 -- --version v2 --input mesh --mc-level 8 --source-mesh "${OUTPUTS}/poisson/poisson-v4-r384-a4-watertight/geometry.ply"
method  v_ma_mc7  meshanything meshanything-v2-wt384-mc7 -- --version v2 --input mesh --mc-level 7 --source-mesh "${OUTPUTS}/poisson/poisson-v4-r384-a4-watertight/geometry.ply"
method v_dhsp_lap dhsp dhsp-v5-lap1 -- --lap 1.0
dhsp_2d v_dhsp_v5 dhsp-v5-lap1 dhsp-v5-lap1-remesh-optcuts 1.0
ptx v_ptx "${VGG_CAMS}" poisson/poisson-v2-r384-a4-t2 poisson/poisson-v4-r384-a4-watertight poisson/poisson-v1-r256-a4-t2 \
    nksr/nksr-v2-ours-d1-mise1 nksr/nksr-v3-ours-d05-mise1 ier/ier-v1-p12500 \
    meshanything/meshanything-v2-mesh-mc7-greedy meshanything/meshanything-v2-wt384-mc8 meshanything/meshanything-v2-wt384-mc7 \
    point2mesh/point2mesh-v3-paper-unoriented point2mesh/point2mesh-v4-unoriented-20k \
    dhsp/dhsp-v1-3dprior dhsp/dhsp-v4-remesh-optcuts dhsp/dhsp-v5-lap1-remesh-optcuts
prints v_print poisson/poisson-v4-r384-a4-watertight-phototex2 point2mesh/point2mesh-v3-paper-unoriented-phototex2 \
    point2mesh/point2mesh-v4-unoriented-20k-phototex2 dhsp/dhsp-v4-remesh-optcuts-phototex2 dhsp/dhsp-v5-lap1-remesh-optcuts-phototex2
pick v_select

# ===================== 2. MVS, outlier-cleaned (secondary) =====================
source surface/scripts/dataset_mvs_clean.sh; source surface/scripts/env.sh; mkdir -p "${OUTPUTS}"
method c_poisson256 poisson poisson-v1-r256-a4-t2 -- --res 256 --alpha 4 --trim 2
method c_poisson384 poisson poisson-v2-r384-a4-t2 -- --res 384 --alpha 4 --trim 2
method c_poisson_wt poisson poisson-v4-r384-a4-watertight -- --res 384 --alpha 4 --trim 0
method c_ier  ier  ier-v1-p12500 -- --points 12500
method c_nksr nksr nksr-v2-ours-d1-mise1 --color-source vertex -- --normals ours --detail 1.0 --mise-iter 1
method c_nksr05 nksr nksr-v3-ours-d05-mise1 --color-source vertex -- --normals ours --detail 0.5 --mise-iter 1
method c_ma_mc8 meshanything meshanything-v2-wt384-mc8 -- --version v2 --input mesh --mc-level 8 --source-mesh "${OUTPUTS}/poisson/poisson-v4-r384-a4-watertight/geometry.ply"
method c_ma_mc7 meshanything meshanything-v2-wt384-mc7 -- --version v2 --input mesh --mc-level 7 --source-mesh "${OUTPUTS}/poisson/poisson-v4-r384-a4-watertight/geometry.ply"
method c_p2m_v3 point2mesh point2mesh-v3-paper-unoriented -- --iterations 10000 --max-faces 10000 --unoriented
method c_p2m_v4 point2mesh point2mesh-v4-unoriented-20k -- --iterations 15000 --max-faces 20000 --unoriented
method c_dhsp dhsp dhsp-v1-mvsclean --
dhsp_2d c_dhsp_2d dhsp-v1-mvsclean dhsp-v4-mvsclean-remesh-optcuts 0
ptx c_ptx "${MVS_CAMS}" poisson/poisson-v2-r384-a4-t2 poisson/poisson-v4-r384-a4-watertight poisson/poisson-v1-r256-a4-t2 \
    nksr/nksr-v2-ours-d1-mise1 nksr/nksr-v3-ours-d05-mise1 ier/ier-v1-p12500 \
    meshanything/meshanything-v2-wt384-mc8 meshanything/meshanything-v2-wt384-mc7 \
    point2mesh/point2mesh-v3-paper-unoriented point2mesh/point2mesh-v4-unoriented-20k \
    dhsp/dhsp-v1-mvsclean dhsp/dhsp-v4-mvsclean-remesh-optcuts
prints c_print poisson/poisson-v4-r384-a4-watertight-phototex2 point2mesh/point2mesh-v3-paper-unoriented-phototex2 \
    point2mesh/point2mesh-v4-unoriented-20k-phototex2 dhsp/dhsp-v4-mvsclean-remesh-optcuts-phototex2
pick c_select

# =============== 3. original MVS cloud: photo texture v2 for its best runs ===============
source surface/scripts/dataset_mvs.sh; source surface/scripts/env.sh
ptx m_ptx "${MVS_CAMS}" poisson/poisson-v1-r256-a4-t2 poisson/poisson-v2-r384-a4-t2 poisson/poisson-v4-r384-a4-watertight \
    nksr/nksr-v2-ours-d1-mise1 nksr/nksr-v3-ours-d05-mise1 ier/ier-v1-p12500 meshanything/meshanything-v2-mesh-mc7-greedy dhsp/dhsp-v1-mvs
pick m_select

# ============================ 4. results tables ============================
for ds in "" mvs mvs_clean; do
  if [[ -n "${ds}" ]]; then source "surface/scripts/dataset_${ds}.sh"; else unset CV802_SP2_INPUT_PLY CV802_SP2_OUTPUTS CV802_SP2_FRONT_FLIP CV802_SP2_DATASET_LABEL; fi
  source surface/scripts/env.sh; tag="${ds:-vggsfm}"
  "${BASE_PY}" -m surface.scripts.results_table >| "surface/docs/results/${tag}_all_runs.md"
  "${BASE_PY}" -m surface.scripts.results_table --best-only >| "surface/docs/results/${tag}_best.md"
done
# =============== 5. extra state-of-the-art methods beyond the slides (separate file) ===============
unset CV802_SP2_INPUT_PLY CV802_SP2_OUTPUTS CV802_SP2_FRONT_FLIP CV802_SP2_DATASET_LABEL
[[ -f surface/scripts/extra_queue.sh ]] && bash surface/scripts/extra_queue.sh
echo finished >| "${Q}/queue.state"; date >| "${Q}/finished_at"; echo "" >| "${Q}/current"
