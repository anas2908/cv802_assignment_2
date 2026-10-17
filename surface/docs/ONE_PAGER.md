# CV802 Sub-project 2 — Surface Extraction (one page)

**Goal.** Turn the coloured 3D points of Sub-project 1 into a textured triangle mesh (`.obj`), plus a mesh viewer.
**Inputs.** Light-shirt subject: (a) VGGSfM cloud after person-mask cleanup, 138 k points; (b) COLMAP MVS cloud, 487 k points with normals.
**Pipeline.** Method → `geometry.ply` → shared finalizer: UV atlas, texture baked from the input colours (or the method's own colour),
textured OBJ, metrics vs the input (Chamfer as % of the bbox diagonal, F-score at 1 % / 0.5 %, normal consistency, colour PSNR), renders.
Everything ran on one RTX 5000 Ada through Slurm; a browser UI runs methods, shows progress/GPU, and views/compares meshes (three.js).

**Methods.** (1) **Screened Poisson, implemented from scratch** (no API): PCA+MST normals, density-weighted normal splatting,
screened Poisson system solved by PCG on a GPU grid (coarse-to-fine), own marching tetrahedra, density trimming.
(2) **IER meshing** (ECCV'20, pretrained): candidate triangles scored by intrinsic-extrinsic ratio. (3) **Point2Mesh** (SIGGRAPH'20):
self-prior MeshCNN shrink-wraps a convex hull. (4) **MeshAnything V2** (2024, pretrained): autoregressive artist mesh, fed a dense
mesh via the authors' `--mc` path. (5) **Deep Hybrid Self-Prior** (ICCV'21): 3D + 2D self-priors for shape and colour.
(6) Extra: **NKSR** (CVPR'23, pretrained neural kernel field).

| Best run | VGGSfM Chamfer % / F@1% | MVS Chamfer % / F@1% | Faces | Watertight |
|---|---|---|---|---|
| Poisson (ours) | **0.149 / 0.999** | 0.100 / 0.999 | 0.3–1 M | optional (untrimmed) |
| NKSR (extra) | 0.156 / 0.997 | **0.080 / 1.000** | 2–3 M | no |
| IER | 0.187 / 0.998 | 0.120 / 1.000 | 17 k | no |
| DHSP 3D prior | 0.162 / 0.999 (crumpled) | 0.152 / 0.980 | 16 k | yes |
| MeshAnything V2 | 0.295 / 0.987 | 0.518 / 0.873 | 1–1.4 k | no |
| Point2Mesh | 0.553 / 0.844 | 3.98 / 0.133 | 10 k | yes |

**Observations.**

- A carefully implemented classical method (screened Poisson) matches pretrained networks on dense, clean clouds; NKSR is best on
  the denser MVS cloud and reconstructs in seconds.
- Input domain matters: MeshAnything went from F@1% 0.51 (raw points) to 0.987 with the authors' dense-mesh preprocessing.
- Self-prior methods are fragile on real scans: Point2Mesh depends on normal orientation (`--unoriented`: 0.65 → 0.84) and breaks
  on outliers; DHSP's 3D prior (Chamfer + 0.2·edge, as in the paper) is crumpled, and its 2D refinement needs a continuous UV atlas
  that OptCuts did not deliver in practical time.
- Point-to-surface metrics hide surface quality — normal consistency and shaded renders exposed DHSP's crumpling.

<!--FIGURE-->

**Deliverables.** Textured OBJ for every method and input; mesh viewer UI with side-by-side comparison; 3D-print STLs
(180 mm, watertight checks). Recommended for printing: MVS screened-Poisson watertight mesh.
