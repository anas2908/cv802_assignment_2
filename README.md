# Surface Extraction from a 3D Capture — CV802 Sub-project 2

Coloured 3D point clouds of a person (from Sub-project 1: VGGSfM and COLMAP MVS) turned into **textured triangle
meshes (`.obj`)** with eight surface-reconstruction methods, compared with the same metrics and browsable in one
**local web page**: the 3D viewer (every mesh and point cloud, side by side), the metric tables, the teaching films,
the report and the slides.

## View the results (CPU only, about a minute)

```bash
git clone https://github.com/anas2908/cv802_assignment_2.git
cd cv802_assignment_2
bash run_viewer.sh
```

Needs only Python 3.8+ — nothing to install, no GPU, nothing is reconstructed: the meshes and point clouds ship with
the repository. The page opens in your browser (the address is also printed, `http://127.0.0.1:<port>/hub/`); press
`Ctrl-C` to stop. Five tabs:

- **Viewer** — pick an input (VGGSfM, MVS, MVS cleaned) and a method; *Textured / Shaded*, wireframe and input-dot
  overlays, dot size, front/back/side views, and a second method side by side with a draggable divider.
- **Compare** — every method on every input (F-score / Chamfer), then all metrics per input; click a row to open it.
- **Videos** — the twelve teaching topics (18 films); open a storyboard to step through one still per scene.
- **Report** and **Slides** — the one-page report and the 130-slide deck, with PDF downloads.

The earlier viewer is still there at `/viewer` (run names start with their input: `vggsfm__…`, `mvs__…`,
`mvs_clean__…`) and the ranking page at `/compare`. The page loads three.js from the repository; only the web fonts
come from the internet.

## Inputs

| Input | Points | Source |
|---|---|---|
| **VGGSfM** (main) | 138,677 | VGGSfM v2 reconstruction, cleaned by projecting into person masks |
| **MVS** | 487,451 | COLMAP PatchMatch stereo + fusion on the reviewed camera model, with COLMAP normals |
| **MVS, floaters removed** | 487,047 | MVS with 404 floating outlier points removed (`surface/scripts/clean_cloud.py`) |

## Methods

| Method | Type | Implementation |
|---|---|---|
| Screened Poisson Surface Reconstruction | classical, implicit | **own implementation from scratch** (normals, screened Poisson solver on the GPU, marching tetrahedra, density trimming) |
| Meshing with Intrinsic-Extrinsic Ratio (IER) | learned, pretrained | official code + weights |
| Point2Mesh | self-prior optimisation | official code |
| MeshAnything V1 / V2 | autoregressive transformer, pretrained | official code + weights (dense-mesh input as recommended by the authors) |
| Deep Hybrid Self-Prior (DHSP) | 3D + 2D self-priors, predicts colour | official code + OptCuts; mesh re-meshed before UV flattening |
| NKSR * | neural kernel field, pretrained | official code + weights |
| Shape As Points * | differentiable Poisson optimisation | official code |
| 2D Gaussian Splatting * | surfel splatting on the photos, initialised from the points | official code |

\* extra methods beyond the course list. Shape-only methods are textured by **projecting the original photos** onto
the mesh (best visible view per texel, exposure-balanced, person masks, 4096² texture); without cameras the texture is
baked from the point colours.

## Results

| Method | VGGSfM (mask-cleaned) | MVS (COLMAP E10) | MVS (floaters removed) |
|---|---|---|---|
| Screened Poisson (own implementation) | 0.999 / 0.15% | 0.999 / 0.13% | 0.999 / 0.13% |
| IER meshing (ECCV'20) | 0.998 / 0.19% | 1.000 / 0.12% | 1.000 / 0.12% |
| Point2Mesh (SIGGRAPH'20) | 0.844 / 0.55% 🖨 | 0.133 / 3.98% 🖨 | 0.387 / 1.30% 🖨 |
| MeshAnything V2 ('24) | 0.987 / 0.30% | 0.873 / 0.52% | 0.908 / 0.44% |
| Deep Hybrid Self-Prior (ICCV'21) | 0.901 / 0.58% 🖨 | 0.900 / 0.64% | 0.916 / 0.63% |
| NKSR (CVPR'23) * | 0.998 / 0.16% | 1.000 / 0.08% | 1.000 / 0.08% |
| Shape As Points (NeurIPS'21) * | 0.998 / 0.19% 🖨 | 0.963 / 0.20% 🖨 | 0.948 / 0.24% 🖨 |
| 2D Gaussian Splatting (SIGGRAPH'24) * | 0.972 / 0.29% | 0.938 / 0.31% | 0.928 / 0.34% |

Cells: F-score at 1 % of the bounding-box diagonal ↑ / Chamfer-L1 as % of the diagonal ↓, best run per method, measured against that input point cloud. 🖨 = watertight (3D-printable). * = extra method beyond the course list.

## Report, slides and films

- One-page report (CVPR style): [`surface/docs/deliverables/CV802_SP2_one_page_report.pdf`](surface/docs/deliverables/CV802_SP2_one_page_report.pdf)
- Presentation, 130 slides: [`surface/docs/deliverables/slides/CV802_SP2_surface_extraction.pptx`](surface/docs/deliverables/slides/CV802_SP2_surface_extraction.pptx)
  ([PDF](surface/docs/deliverables/slides/CV802_SP2_surface_extraction.pdf)) — methods, experiments, GPU time, result
  tables with run times, quality vs time and size, close-ups of face, arms and feet, then the films and one still per
  film scene.
- Both are generated from the run metrics: `surface/docs/deliverables/build_all.sh` (report → `report/`, slides →
  `slides/build_slides.py`; close-up renders: `make_closeups.py`).
- Teaching films, 12 topics in 18 films (56 min): [`surface/docs/films/`](surface/docs/films/) — the film source with
  the images each one shows; see its README for how to export MP4s.

## Experiments at a glance

- **Two inputs**, same pipeline and metrics: VGGSfM (main) and MVS (with and without floating outliers).
- **Poisson**: grid 256³ / 384³, screened vs classic, trimmed vs watertight (watertight = printable).
- **MeshAnything**: raw points (F@1 % ≈ 0.5, out of the training domain) vs a dense mesh through the authors'
  marching-cubes path (≈ 0.99); several seeds and marching-cubes levels.
- **Point2Mesh**: paper defaults, `--unoriented` (fixes flipped-normal pull, 0.65 → 0.84), 20k faces.
- **DHSP**: the 3D prior alone is crumpled; OptCuts did not converge on it in 15 h; re-meshing first lets OptCuts
  converge in seconds and the full 2D-refinement pipeline complete (clean surface, own texture). On the MVS clouds
  the full pipeline scores below its 3D prior (outliers become fins) and the final texture atlas falls back to xatlas
  (the refined surface has genus 2).
- **Texturing**: point-colour baking vs photo projection v1 / v2 (4K, exposure-balanced).
- **3D printing**: watertight meshes exported as 180 mm STL + coloured OBJ with printability checks.

## Repository layout

```text
run_viewer.sh        one-command CPU viewer for the bundled results
results/             viewer-ready meshes per input (best run of every method), zipped
surface/inputs/      the three input point clouds
surface/common/      I/O, kNN, normals, texture baking, photo texturing, metrics, renderer, finalize
surface/methods/     one folder per method: setup.sh (environment, official code, weights), run.sh, pipeline.json
surface/scripts/     job queue, finalize, cleanup, 3D-print export, packaging, results tables
surface/ui/          dependency-free web server, dashboard, mesh viewer (three.js), compare page
surface/ui/hub/      the all-in-one page: viewer meshes and point clouds (.glbz), metrics, storyboards, report, slides;
                     build_hub_data.py rebuilds its meshes from results/
surface/docs/        brief, one-page summary, presentation notes; deliverables/ (report, slides, figures); films/
```

## Re-running the reconstructions

Requires Linux with an NVIDIA GPU (developed on an RTX 5000 Ada, 32 GB, under Slurm). For each method,
`surface/methods/<method>/setup.sh` builds its environment and downloads the official code and pretrained weights,
`run.sh <run_dir>` reconstructs the surface, and `surface/scripts/finalize.sh <run_dir>` writes the textured OBJ,
metrics and renders. Photo texturing (`python -m surface.common.phototex`) and 2DGS also need the photographs,
camera models and person masks from the Sub-project 1 repository
([cv802_ass1](https://github.com/anas2908/cv802_ass1), `datasets/`). Data and environment locations are set in
`surface/scripts/env.sh`; `surface/scripts/best_queue.sh` reproduces the full set of experiments.
More detail: [`surface/README.md`](surface/README.md).

## References

- M. Kazhdan, M. Bolitho, H. Hoppe. Poisson Surface Reconstruction. SGP 2006; M. Kazhdan, H. Hoppe. Screened Poisson Surface Reconstruction. ACM TOG 2013.
- M. Liu, X. Zhang, H. Su. Meshing Point Clouds with Predicted Intrinsic-Extrinsic Ratio Guidance. ECCV 2020. [code](https://github.com/Colin97/Point2Mesh)
- R. Hanocka, G. Metzer, R. Giryes, D. Cohen-Or. Point2Mesh: A Self-Prior for Deformable Meshes. SIGGRAPH 2020. [code](https://github.com/ranahanocka/point2mesh)
- Y. Chen et al. MeshAnything / MeshAnything V2. 2024. [code](https://github.com/buaacyw/MeshAnythingV2)
- X. Wei, Z. Chen, Y. Fu, Z. Cui, Y. Zhang. Deep Hybrid Self-Prior for Full 3D Mesh Generation. ICCV 2021. [code](https://github.com/weixk2015/DHSP3D)
- M. Li et al. OptCuts: Joint Optimization of Surface Cuts and Parameterization. SIGGRAPH Asia 2018. [code](https://github.com/liminchen/OptCuts)
- J. Huang et al. Neural Kernel Surface Reconstruction. CVPR 2023. [code](https://github.com/nv-tlabs/NKSR)
- S. Peng et al. Shape As Points: A Differentiable Poisson Solver. NeurIPS 2021. [code](https://github.com/autonomousvision/shape_as_points)
- B. Huang et al. 2D Gaussian Splatting for Geometrically Accurate Radiance Fields. SIGGRAPH 2024. [code](https://github.com/hbb1/2d-gaussian-splatting)
