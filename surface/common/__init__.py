"""Shared foundation for Sub-project 2 (I/O, kNN, normals, texture baking, metrics, rendering,
run bookkeeping). See surface/common/README.md. Submodules are imported lazily so that light-weight
users (e.g. the UI) do not pay for torch."""

__all__ = ["io", "knn", "normals", "geom", "raster", "texture", "metrics", "render", "run_context", "paths"]
