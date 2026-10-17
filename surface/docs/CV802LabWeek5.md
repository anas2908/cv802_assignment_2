# CV802 Lab Week 5 — BYO 3D Capture Project & Sub-project 2: Surface Extraction

Transcription of `CV802LabWeek5.pdf` (Paul Zheng, 09/18/2025, MBZUAI Metaverse Lab).
Place the original slide PDF next to this file as `surface/docs/CV802LabWeek5.pdf`.

## Project overview — 3D Capture System

| Stage | Input | Output |
|---|---|---|
| Sub-project 1: SfM and MVS | Multi-view images | 3D points with color |
| **Sub-project 2: Surface Extraction** | **3D points with color** | **Textured mesh** |
| Sub-project 3: Novel-view Synthesis | Multi-view images | Synthesized novel views |

## Sub-project 2 — Surface Extraction

- **Input:** 3D points from Sub-project 1.
- **Output:** textured 3D mesh. Output format should be **.obj**.
  You will get a **bonus if you provide a Mesh Viewer**.

### Example methods

1. **Poisson Surface Reconstruction (DO NOT USE API)** — famous approach, easy to implement.
2. **Meshing Point Clouds with Predicted Intrinsic-Extrinsic Ratio (ECCV 2020)** —
   good to learn how to combine a geometric prior with deep learning.
3. **Point2Mesh: A Self-Prior for Deformable Meshes** — self-supervised, no need to
   train on a large-scale dataset.
4. **MeshAnything: Artist-Created Mesh Generation with Autoregressive Transformers** —
   recent method with high-quality output, good to have a try.
   *Only shape* (true for all methods above) — you need to get texture by yourself.
5. **Deep Hybrid Self-Prior for Full 3D Mesh Generation** — self-supervised
   (shape **and color**), no need to train on a large-scale dataset.
6. Your own novel methods!

### Timeline

| When | Milestone |
|---|---|
| Week 5 | Project introduction; general plan |
| Week 5→6 | Decision of method; literature overview; detailed plan |
| Week 6 | Good understanding of your own method; job assignments; start implementation; weekly updates |
| Week 6→10 | Build your method; visualize results; improve your method; finalize your project |
| Week 10 | **Deliverables:** presentation; code based on starter code; one-page documents |

### For next week

Presentation of your chosen method (< 5 minutes):
- prove you have a good understanding of your own method;
- job assignments;
- start weekly updates.
