# CV802 Sub-project 2 — Surface Extraction

Coloured point cloud from Sub-project 1 → **textured triangle mesh (`.obj` + `.mtl` + `texture.png`)**,
with a browser **Mesh Viewer** (bonus) and 3D-print exports. Brief: [`docs/CV802LabWeek5.md`](docs/CV802LabWeek5.md).

Two inputs of the light-shirt subject (both from Sub-project 1):

| Dataset | File | Points | Notes |
|---|---|---|---|
| **VGGSfM** (default) | `inputs/light_shirt_vggsfm_clean.ply` | 138,677 | VGGSfM v2 run after person-mask projection cleanup; we estimate normals (PCA + MST) |
| **MVS** | `inputs/light_shirt_mvs_e10.ply` | 487,451 | COLMAP PatchMatch + fusion on the reviewed E10 cameras (1600 px, person masks); carries COLMAP normals. Contains silhouette streaks and floating outliers |

## Methods

All five methods of the brief, plus one extra state-of-the-art method. Shape-only methods are textured by our finalizer
(UV atlas + colour baked from the input points); DHSP and NKSR produce colour themselves.

| id | Method | Code | Notes |
|---|---|---|---|
| `poisson` | Screened Poisson (Kazhdan 2006; Kazhdan & Hoppe 2013) | **ours, from scratch — no API** | normals, splatting, screened Poisson PCG solve on a GPU grid, own marching tetrahedra, density trimming |
| `ier` | Meshing with Intrinsic-Extrinsic Ratio (ECCV 2020) | official + pretrained | ported to PyTorch 1.12 / CUDA 11.6 |
| `point2mesh` | Point2Mesh (SIGGRAPH 2020) | official | PyTorch 2.1 port (device fixes) |
| `meshanything` | MeshAnything V1/V2 (2024) | official + pretrained | dense-mesh `--mc` input as the authors recommend |
| `dhsp` | Deep Hybrid Self-Prior (ICCV 2021) | official ("under constructing") | 3D prior faithful; 2D stage patched, OptCuts built (headless) |
| `nksr` | Neural Kernel Surface Reconstruction (CVPR 2023) — **extra** | official + pretrained | compiled from source (PyTorch 2.7) |

Per-method details, parameters and deviations: `methods/<id>/` (`setup.sh`, `run.sh`, `pipeline.json`).

## Results (best run per method)

Metrics against the input cloud: Chamfer-L1 as % of the bounding-box diagonal, F-score at 1 % / 0.5 % of the diagonal,
normal consistency, colour PSNR of the texture at the input points. Full tables (every run):
[`docs/results/`](docs/results/).

**VGGSfM input**

| Method | Faces | Chamfer %↓ | F@1%↑ | Normal cons.↑ | PSNR↑ | Watertight |
|---|---|---|---|---|---|---|
| Poisson (ours) 384³ | 1.02 M | **0.149** | **0.999** | 0.75 | 19.5 | trimmed (watertight run: 0.998) |
| NKSR (extra) | 2.09 M | 0.156 | 0.997 | 0.75 | 19.5 | no |
| DHSP (3D prior) | 16 k | 0.162 | 0.999 | **0.65 ⚠** | 23.1 | yes, but crumpled |
| IER | 17.5 k | 0.187 | 0.998 | 0.82 | 22.3 | no (holes) |
| MeshAnything V2 | 1.4 k | 0.295 | 0.987 | 0.82 | 21.0 | no |
| Point2Mesh (`--unoriented`) | 10 k | 0.553 | 0.844 | 0.80 | 18.2 | yes |

**MVS input**

| Method | Faces | Chamfer %↓ | F@1%↑ | Normal cons.↑ | PSNR↑ |
|---|---|---|---|---|---|
| NKSR (extra) | 3.38 M | **0.080** | **1.000** | **0.84** | 20.0 |
| Poisson (ours) 256³ / 384³ | 277 k / 644 k | 0.127 / 0.100 | 0.999 | 0.83 | 22.1 |
| IER | 16 k | 0.120 | 1.000 | 0.78 | 21.9 |
| DHSP (3D prior) | 16 k | 0.152 | 0.980 | 0.73 | 23.5 |
| MeshAnything V2 | 1.1 k | 0.518 | 0.873 | 0.72 | 15.4 |
| Point2Mesh (`--unoriented`) | 10 k | 3.98 | 0.133 ✘ | 0.60 | 12.8 |

**Findings**
- Our from-scratch screened Poisson is on par with the learned methods on both inputs; NKSR wins on the dense MVS cloud and is fastest (seconds).
- MeshAnything is only usable with the authors' dense-mesh `--mc` input: raw points gave F@1% 0.51, a Poisson mesh → `--mc` gave 0.987.
- Point2Mesh is sensitive to normal orientation (paper's `--unoriented`: 0.646 → 0.844) and to outliers (MVS floaters create webbing).
- DHSP's 3D prior (paper loss: Chamfer + 0.2·edge) scores high on Chamfer/F but is crumpled (normal consistency 0.65). Its 2D refinement needs a
  continuous UV atlas: OptCuts did not converge within 2 h on this mesh; with xatlas the 2D priors produce chart-seam artifacts.
  Chamfer/F-score alone hide this — inspect the shaded renders.

## 3D printing

`scripts/print_export.py` makes a run printable: largest component, outward normals, +Z up, feet at z = 0, scaled to 180 mm;
writes `print/figure.stl` (single colour) and `print/figure.obj` + `texture.png` (colour printers) with `print_report.json`
(watertight, winding, volume, non-manifold edges). Self-intersections are **not** checked.
Recommended: **MVS Poisson watertight** (most detail) or **VGGSfM Poisson watertight**; Point2Mesh v3 for a smooth low-poly print.
Use supports under the crossed arms.

## Running it (CIAI workstation cluster)

Never compute on the login node; everything runs on one Slurm allocation (single RTX 5000 Ada, 32 GB).

```bash
cd cv802_ass1
bash surface/scripts/allocate.sh                          # salloc -N1 -n12 --mem=32G (once; job id saved)
surface/scripts/node_run.sh 'bash surface/methods/<id>/setup.sh'     # per method, idempotent
bash surface/scripts/start_queue.sh && tmux attach -t cv802          # full unattended queue with progress view
# or one run:  surface/scripts/node_run.sh 'surface/methods/poisson/run.sh $DATA/outputs/poisson/my-run && surface/scripts/finalize.sh $DATA/outputs/poisson/my-run'
bash surface/scripts/run_ui.sh                            # UI for the VGGSfM input  (VS Code: forward port 8790)
CV802_SP2_DATASET=mvs bash surface/scripts/run_ui.sh      # UI for the MVS input     (port 8792)
bash surface/scripts/run_viewer_local.sh                  # read-only viewer of bundled results, any machine
```

Select the MVS input for scripts with `source surface/scripts/dataset_mvs.sh`. Heavy data (envs, weights, runs) live
under `/l/users/$USER/cv802_sp2` (`outputs/` = VGGSfM, `outputs_mvs/` = MVS). Engineering contract: [`docs/CONTRACT.md`](docs/CONTRACT.md).

## Layout

```text
common/      I/O, kNN, normals (ours), texture baking, metrics, renderer, finalize
methods/     one folder per method (setup.sh, run.sh, pipeline.json, glue code)
scripts/     node_run / allocate / queue / finalize / print_export / UI launchers / results tables
ui/          dependency-free server + dashboard, mesh viewer (three.js), compare page
inputs/      the two input clouds
docs/        brief, contract, one-pager, presentation notes, results tables
```
