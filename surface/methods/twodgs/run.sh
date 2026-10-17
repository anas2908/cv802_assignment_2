#!/usr/bin/env bash
# run.sh <run_dir> --model <colmap_dir> [--iters 30000] [--max-side 1200]
# 2DGS trained on the light-shirt photos with masks (white background), initialised from our point cloud;
# mesh by the official TSDF fusion of rendered depth (bounded mode), cropped to the input's bounding box.
set -Eeuo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/../../scripts/env.sh"
RUN="$1"; shift; MODEL=""; ITERS=30000; MAXS=1200
while [[ $# -gt 0 ]]; do case "$1" in --model) MODEL="$2"; shift 2;; --iters) ITERS="$2"; shift 2;; --max-side) MAXS="$2"; shift 2;; *) echo "unknown arg $1"; exit 2;; esac; done
mkdir -p "${RUN}/work"; RUN="$(cd "${RUN}" && pwd)"; W="${RUN}/work"
exec > >(tee "${RUN}/log.txt") 2>&1
PY="${DATA}/envs/twodgs/bin/python"; REPO="${TP}/twodgs"
prog() { printf '{"percent": %d, "stage": "%s", "message": "%s"}' "$1" "$2" "$3" >| "${RUN}/progress.json"; echo "[$1%] $2 $3"; }
prog 3 prep "undistort cameras, person-on-white RGBA photos, init from our point cloud"
"${BASE_PY}" -m surface.methods.twodgs.prep "${W}/scene" --model "${MODEL}" --images "${CODE}/datasets/light_shirt/images" \
  --masks "${CODE}/datasets/reviewed/mac_masks/light_shirt/masks" --max-side "${MAXS}"
read -r DIAG DTR < <("${BASE_PY}" -c "import json;s=json.load(open('${W}/scene/scene.json'));print(s['diag'], s['cam_dist_max']+s['diag'])")
VOX=$(python3 -c "print(${DIAG}/600)")
T0=$(date +%s)
prog 10 train "2DGS ${ITERS} iterations (white background, depth_ratio 1 for objects)"
( cd "${REPO}" && "${PY}" train.py -s "${W}/scene" -m "${W}/model" -w --data_device cpu --depth_ratio 1 --iterations "${ITERS}" \
    --test_iterations -1 --save_iterations "${ITERS}" --quiet ) &
PID=$!
while kill -0 "${PID}" 2>/dev/null; do sleep 30; done
wait "${PID}"
prog 80 mesh "TSDF fusion of rendered depth (voxel ${VOX})"
( cd "${REPO}" && "${PY}" render.py -s "${W}/scene" -m "${W}/model" --skip_train --skip_test --depth_ratio 1 -w --data_device cpu \
    --voxel_size "${VOX}" --sdf_trunc "$(python3 -c "print(4*${VOX})")" --depth_trunc "${DTR}" --num_cluster 1 )
MESH=$(ls "${W}"/model/train/ours_*/fuse_post.ply | tail -1)
"${BASE_PY}" - "${MESH}" "${RUN}" "${W}/scene/scene.json" <<'PY'
import json, sys, numpy as np, trimesh
from surface.common import io, paths
mesh_path, run, scene = sys.argv[1:4]
m = trimesh.load(mesh_path, process=False)
xyz, _ = io.read_point_cloud(paths.input_ply())
lo, hi = xyz.min(0), xyz.max(0); pad = 0.05 * (hi - lo)
keep = np.all((m.vertices >= lo - pad) & (m.vertices <= hi + pad), axis=1)
m.update_faces(keep[m.faces].all(1)); m.remove_unreferenced_vertices()
parts = m.split(only_watertight=False); m = max(parts, key=lambda p: len(p.faces)) if len(parts) else m
col = m.visual.vertex_colors[:, :3] if hasattr(m.visual, "vertex_colors") else None
io.write_mesh_ply(f"{run}/geometry.ply", m.vertices, m.faces, col)
print("2dgs mesh", len(m.vertices), "vertices", len(m.faces), "faces (cropped to the input bbox, largest part)")
PY
printf '{"method_id": "twodgs", "method_name": "2D Gaussian Splatting (SIGGRAPH 2024)", "paper": "Huang, Yu, Chen, Geiger, Gao. 2D Gaussian Splatting for Geometrically Accurate Radiance Fields, SIGGRAPH 2024", "official_code": "https://github.com/hbb1/2d-gaussian-splatting", "commit": "f3e3b9f", "params": {"iterations": %s, "max_side": %s, "voxel": %s, "depth_trunc": %s, "camera_model": "%s"}, "elapsed_seconds": %s, "device": "cuda", "input": "photos + undistorted cameras + person masks; initialised from our point cloud", "deviations": "image-based (uses the photos, not only the points); white background from person masks; mesh cropped to the input bbox"}' \
  "${ITERS}" "${MAXS}" "${VOX}" "${DTR}" "${MODEL}" "$(( $(date +%s) - T0 ))" >| "${RUN}/method_info.json"
prog 89 "method done" ""
