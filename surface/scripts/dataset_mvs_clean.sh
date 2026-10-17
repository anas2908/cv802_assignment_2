# Source this for the outlier-cleaned light-shirt MVS cloud (surface/scripts/clean_cloud.py on the E10 MVS cloud).
export CV802_SP2_INPUT_PLY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/inputs/light_shirt_mvs_e10_clean.ply"
export CV802_SP2_OUTPUTS="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}/outputs_mvs_clean"
export CV802_SP2_FRONT_FLIP=0
export CV802_SP2_DATASET_LABEL="MVS point cloud, outlier-cleaned (light shirt, COLMAP E10 PatchMatch, statistical + floater removal)"
