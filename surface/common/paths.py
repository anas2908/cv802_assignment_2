"""Canonical paths (see surface/docs/CONTRACT.md)."""
from __future__ import annotations

import getpass
import os
from pathlib import Path

CODE_ROOT = Path(__file__).resolve().parents[2]          # .../cv802_ass1
SURFACE_ROOT = CODE_ROOT / "surface"
INPUT_NAME = "light_shirt_vggsfm_clean.ply"
INPUT_SHA256 = "ca1c35a7dec46aaa7aeb614c3ce79917dbb6b095222a141120cf7ade8412a04f"
INPUT_POINT_COUNT = 138677
METHOD_IDS = ("poisson", "ier", "point2mesh", "meshanything", "dhsp", "ours")


def data_root() -> Path:
    return Path(os.environ.get("CV802_SP2_DATA_ROOT", f"/l/users/{getpass.getuser()}/cv802_sp2"))


def input_ply() -> Path:
    """Reconstruction input. Default: the light-shirt VGGSfM cloud; CV802_SP2_INPUT_PLY selects another dataset
    (e.g. surface/inputs/light_shirt_mvs_e10.ply)."""
    return Path(os.environ.get("CV802_SP2_INPUT_PLY", SURFACE_ROOT / "inputs" / INPUT_NAME))


def outputs_root() -> Path:
    """Run outputs for the selected input (CV802_SP2_OUTPUTS, default DATA/outputs for the VGGSfM input)."""
    return Path(os.environ.get("CV802_SP2_OUTPUTS", data_root() / "outputs"))


def cache_dir(name: str) -> Path:
    return data_root() / "cache" / name


def input_normals_cache() -> Path:
    name = input_ply().stem
    tag = "v1" if name == Path(INPUT_NAME).stem else name    # keep the original cache name for the VGGSfM input
    return data_root() / "cache" / "common" / f"input_normals_{tag}.npz"
