# Sub-project 2 — talk outline (< 5 minutes)

Figures come from each run's `preview_*.png` (`/l/users/$USER/cv802_sp2/outputs[_mvs]/<method>/<run>/`) and from the
UI's Compare page / side-by-side viewer (live demo if time allows).

| # | Slide | Time | Content / figure |
|---|---|---|---|
| 1 | Task & inputs | 30 s | Points → textured `.obj`. Two light-shirt clouds: VGGSfM (138 k, cleaned) and COLMAP MVS (487 k). Figure: input points front/back. |
| 2 | Pipeline | 30 s | Method → geometry → shared finalizer (UV atlas, texture, metrics, renders) → UI viewer / 3D-print export. One RTX 5000 via Slurm. |
| 3 | Poisson from scratch | 50 s | Normals (PCA + MST orientation) → splat inward normals → screened Poisson `(−Δ + β SᵀS)χ = −∇·V + βSᵀc`, PCG on a GPU grid, coarse-to-fine → iso = mean χ at samples → own marching tetrahedra → density trimming. Sphere test: radius error 0.0007. Figure: `preview_shaded_grid.png` (MVS 384³). |
| 4 | Learned / self-prior methods | 70 s | IER: candidate triangles + pretrained IER classifier. Point2Mesh: self-prior CNN shrink-wraps a hull. MeshAnything: autoregressive artist mesh (needs dense-mesh `--mc` input). DHSP: 3D + 2D self-priors. NKSR: pretrained neural kernel field. One preview each. |
| 5 | Results | 60 s | Best-run table (Chamfer %, F@1%, faces) for both inputs; compare strip from the UI. Poisson ≈ learned methods; NKSR best on MVS. |
| 6 | Lessons | 40 s | Input domain (MeshAnything 0.51 → 0.987); normal orientation (Point2Mesh `--unoriented`); outliers (Point2Mesh webbing on MVS); metrics hide crumpling (DHSP normal consistency 0.65); DHSP 2D stage needs a continuous UV atlas (OptCuts). |
| 7 | Demo / bonus | 20 s | Mesh viewer: textured / shaded / wireframe / point overlay, synchronized side-by-side; 180 mm STL for printing. |

## Points that show understanding (Q&A)
- **Why screening?** Pure Poisson fits gradients only; the screening term pins χ to the iso value at the samples, reducing over-smoothing (2013 paper).
- **Why trim?** Poisson always closes the surface; trimming removes faces far from samples (hallucinated caps, floater blobs).
- **Why marching tetrahedra?** Simple self-written, crack-free table-free extraction; consistent Kuhn split guarantees a watertight surface.
- **IER ratio**: geodesic / Euclidean distance between candidate-triangle vertices — near 1 on true surface triangles, large across gaps.
- **Self-prior**: a randomly initialised network has an implicit bias towards regular/self-similar outputs; optimising it on one shape regularises the fit.
- **Chamfer vs quality**: F-score measures closeness to the points, not surface regularity — check normal consistency and renders.

## Job assignment (fill in)

| Member | Responsibility |
|---|---|
| … | Poisson implementation, normals, marching tetrahedra |
| … | Learned methods (IER, MeshAnything, NKSR) + environments |
| … | Self-prior methods (Point2Mesh, DHSP) |
| … | Texturing, metrics, UI / mesh viewer, 3D-print export, report |
