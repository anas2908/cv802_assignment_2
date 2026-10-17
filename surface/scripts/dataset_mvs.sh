# Source this to work on the light-shirt MVS cloud (COLMAP E10 PatchMatch, 1600 px, person masks) instead of VGGSfM.
export CV802_SP2_INPUT_PLY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/inputs/light_shirt_mvs_e10.ply"
export CV802_SP2_OUTPUTS="${CV802_SP2_DATA_ROOT:-/l/users/${USER}/cv802_sp2}/outputs_mvs"
export CV802_SP2_FRONT_FLIP=0     # verified by rendering: the estimator's front is correct in the COLMAP frame
export CV802_SP2_DATASET_LABEL="MVS point cloud (light shirt, COLMAP E10 PatchMatch 1600 px, 487,451 points)"
