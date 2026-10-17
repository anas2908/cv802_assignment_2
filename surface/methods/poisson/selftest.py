"""Sphere test for our Poisson solver + marching tetrahedra: radius error and watertightness."""
import numpy as np
import trimesh

from surface.methods.poisson.poisson import reconstruct

rng = np.random.default_rng(0)
p = rng.normal(size=(40000, 3))
p /= np.linalg.norm(p, axis=1, keepdims=True)
V, F, info = reconstruct(p * 0.5, p.copy(), depth_res=128, alpha=4.0)
r = np.linalg.norm(V, axis=1)
m = trimesh.Trimesh(V, F, process=True)
print(f"faces={len(F)} radius mean={r.mean():.4f} (0.5) max|err|={np.abs(r - 0.5).max():.4f} "
      f"watertight={m.is_watertight} winding={m.is_winding_consistent} volume>0={m.volume > 0}")
assert abs(r.mean() - 0.5) < 0.01 and m.is_watertight and m.volume > 0, "Poisson selftest failed"
print("POISSON SELFTEST OK")
