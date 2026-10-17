# Sub-project 2 engineering contract

Every method, the shared finalizer, and the UI follow this contract.

## Paths

| Name | Path |
|---|---|
| `CODE` (git) | `/home/anas.khan/cv_802_repo/cv802_ass1` — Sub-project 2 code lives in `CODE/surface/` |
| `DATA` (Lustre, not git) | `/l/users/anas.khan/cv802_sp2` (env `CV802_SP2_DATA_ROOT`) |
| Input cloud | `CODE/surface/inputs/light_shirt_vggsfm_clean.ply` (copy: `DATA/inputs/`) — 138,677 points, float xyz + uchar rgb, sha256 `ca1c35a7…a04f`. This is the light-shirt VGGSfM run after mask-projection cleanup. It is the **only** reconstruction input. |
| Environments | `DATA/envs/<name>` (one per method if dependencies conflict; `DATA/envs/base` is shared) |
| Caches/weights | `DATA/cache/<method>` (set `HF_HOME`, `TORCH_HOME`, `PIP_CACHE_DIR`, `XDG_CACHE_HOME`, `UV_CACHE_DIR` under it) |
| Third-party clones | `DATA/third_party/<repo>` (official code, never copied wholesale into git) |
| Run outputs | `DATA/outputs/<method_id>/<run_id>/` |

## Compute rules (strict)

- **Never run Python, pip, compilers, or any computation on the login node (`lo-01`/`lo-02`).**
  Reading or editing files and `git` on source files are fine there.
- Use the single allocation. Allocation job id: `cat DATA/runtime/jobid` (node ws-l5-032,
  12 CPUs, **32 GB RAM for the whole job, shared by every concurrent step**, one RTX 5000 Ada 32 GB GPU).
- `CODE/surface/scripts/node_run.sh '<cmd>'` runs a command on that node (CPU/IO, concurrent).
- `CV802_GPU_LOCK=1 CODE/surface/scripts/node_run.sh '<cmd>'` serialises **any** command that touches CUDA
  (including small tests and CUDA-extension builds), so only one GPU job runs at a time.
- `CV802_BUILD_LOCK=1` serialises heavy C++/CUDA compiles (use `MAX_JOBS=4`). Both locks may be combined.
- Other steps run concurrently; keep a step's RAM well under 12 GB; never `scancel` the job.
- Long jobs: start them in the background, write a log under `DATA/runtime/logs/`, and poll it.
  A foreground srun dies with the Bash tool's 10-minute limit.
- CUDA toolkit: `/usr/local/cuda-12.2` (nvcc 12.2; use `CC=gcc-12 CXX=g++-12` with nvcc). Driver supports CUDA 12.8.
  GPU arch: `TORCH_CUDA_ARCH_LIST=8.9`. Internet (PyPI, GitHub, Hugging Face) works from the node.
- Python: `uv` is installed at `DATA/tools/uv/uv`; always export `UV_CACHE_DIR=DATA/cache/uv` (shared, concurrency-safe
  wheel cache) and `UV_PYTHON_INSTALL_DIR=DATA/tools/python` (CPython 3.10 and 3.11 already installed). Create envs with
  `uv venv --python 3.10|3.11 DATA/envs/<name>` and `uv pip install --python DATA/envs/<name>/bin/python ...`.
  PyTorch wheels: `--index-url https://download.pytorch.org/whl/cu121` (or cu118/cu124 when a method needs it).

## Method ids

`poisson`, `ier`, `point2mesh`, `meshanything`, `dhsp`, plus `ours` if a novel method is added later.

## Method stage → `geometry.ply`

Each method lives in `CODE/surface/methods/<method_id>/` with:

- `README.md`: paper and official code links, the algorithm in our own words, deviations, and parameters.
- `setup.sh`: idempotent environment and weight setup; run on the node.
- `run.sh <run_dir> [extra args]`: runs the method on the input and writes into `<run_dir>`:
  - `geometry.ply`: a triangle mesh (float xyz vertices, int faces). It may carry per-vertex `red green blue`
    uchar colours if the method itself predicts colour (dhsp).
  - `method_info.json`: `{method_id, method_name, paper, official_code, commit, params, elapsed_seconds,
    peak_gpu_mib, device, notes, deviations}`.
  - `progress.json` (updated during the run): `{"percent": 0-100, "stage": "...", "message": "..."}`.
  - `log.txt` (stdout/stderr of the run).
  - Optional extra artefacts (intermediate meshes, loss curves as `.png`/`.json`).
- Keep the input in its original VGGSfM world frame and scale. If you normalise internally, transform back
  before writing `geometry.ply`.

## Finalizer (shared; base env) → textured OBJ

`CODE/surface/scripts/finalize.sh <run_dir> [--color-source points|vertex] [--tex-size 2048]` turns
`geometry.ply` into the deliverable and writes:

- `mesh.obj` + `mesh.mtl` + `texture.png`: UV-mapped OBJ (`v`, `vt`, `vn`, `f v/vt/vn`, `mtllib`, `usemtl`,
  `map_Kd texture.png`) — the required **.obj** deliverable.
- `metrics.json`: geometry against the input cloud (chamfer both directions, F-score at 0.5 % and 1 % of the
  bbox diagonal, normal consistency where input normals are estimated), mesh statistics (vertices, faces,
  watertight, edge-manifold, connected components, boundary edges, surface area), and texture fidelity
  (colour error of the baked texture sampled back at input points: mean abs RGB error / PSNR).
- `preview_front.png`, `preview_back.png`, `preview_left.png`, `preview_right.png` (textured renders),
  `preview_shaded.png` (untextured, to judge geometry), and `thumb.png` (small UI card image).
- `manifest.json`: `{schema_version: 1, method_id, method_name, run_id, status: "complete", created_at,
  input: {path, sha256, point_count}, mesh: {vertices, faces}, texture: {size, color_source},
  files: [{path, bytes, sha256}], method_info: <copied>, metrics: <summary>}`.
- Write `manifest.json` last; its presence means the run is complete and viewable.
- `DATA/outputs/<method_id>/latest` contains the run_id of the newest complete run.

Texturing (Sub-project 2 requires texture; all methods except dhsp give shape only):
`--color-source points` creates a UV atlas (xatlas), rasterises each texel's 3D position, and colours it by
inverse-distance-weighted k-nearest input points (with seam dilation). `--color-source vertex` interpolates
the mesh's own per-vertex colours. `--color-source method` keeps a texture the method produced itself in
`<run_dir>/method_texture/{mesh.obj,mesh.mtl,texture.png}` (for dhsp's learned colour) and only adds metrics,
previews and the manifest.

## UI

`CODE/surface/ui/` is a dependency-free Python HTTP server plus a static web app (three.js vendored locally).
It discovers runs by scanning `DATA/outputs/*/*/manifest.json` (and bundled `CODE/surface/results/`),
launches methods through the same `run.sh` → `finalize.sh` pipeline, shows progress, logs, and live GPU stats,
and includes a textured-mesh viewer (the bonus Mesh Viewer).
