"""Headless renders with identical camera framing for every method.

Renderer: our own perspective-correct z-buffer rasteriser in torch (``raster.py``), so it needs no
display, EGL or OpenGL; it runs on the GPU when available and on the CPU otherwise.

View frame: ``view_frame()`` returns the person's ``up`` and ``front`` directions and the framing
box. For the fixed Sub-project 2 input these were estimated from the data and verified visually;
they are stored in ``view_frame.json`` next to this file, so every method is rendered from exactly
the same cameras. ``estimate_view_frame()`` recomputes them for another cloud:

* up axis   = principal (largest-variance) PCA axis of the cloud; its sign follows the SfM/COLMAP
  camera convention (image y points down, so world "up" has a negative y component);
* front     = horizontal direction from the head centre to the skin-coloured head points (the face),
  checked against the toes (feet extend forwards from the ankles).

Cameras: ``front`` looks at the person's face, ``back`` at their back, ``left`` at their left side
(camera on the person's left), ``right`` at their right side. All views share the target (input bbox
centre), distance and field of view.
"""
from __future__ import annotations

import json
import os
import math
from pathlib import Path

import numpy as np

from .geom import face_normals, vertex_normals
from .knn import get_device

__all__ = ["view_frame", "estimate_view_frame", "make_camera", "render_mesh", "render_points",
           "render_previews", "VIEW_NAMES"]

VIEW_NAMES = ("front", "back", "left", "right")
_FRAME_JSON = Path(__file__).with_name("view_frame.json")
BACKGROUND = (226, 229, 234)


def _normalize(v):
    v = np.asarray(v, np.float64)
    return v / max(np.linalg.norm(v), 1e-30)


def estimate_view_frame(xyz, rgb):
    """Estimate (up, front) of a standing person from a coloured cloud (see module docstring)."""
    xyz = np.asarray(xyz, np.float64)
    rgb = np.asarray(rgb, np.float64)
    c = xyz.mean(0)
    X = xyz - c
    w, v = np.linalg.eigh(X.T @ X / len(X))
    up = v[:, 2]
    if up[1] > 0:  # COLMAP/VGGSfM: camera y points down in the image -> world up has y < 0
        up = -up
    t = X @ up
    lo, hi = np.percentile(t, 0.5), np.percentile(t, 99.5)
    Hh = hi - lo
    P = X - t[:, None] * up[None]                           # horizontal components
    head = t > hi - 0.13 * Hh
    r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
    skin = (r > 90) & (r > g) & (g > b) & (r - b > 20) & (r < 250)
    front = None
    diag = {}
    if (head & skin).sum() > 50:
        f = P[head & skin].mean(0) - P[head].mean(0)
        diag["head_skin_points"] = int((head & skin).sum())
        diag["head_skin_offset"] = float(np.linalg.norm(f))
        front = _normalize(f)
    feet = t < lo + 0.04 * Hh
    ankles = (t > lo + 0.06 * Hh) & (t < lo + 0.12 * Hh)
    if feet.sum() > 50 and ankles.sum() > 50:
        toes = _normalize(P[feet].mean(0) - P[ankles].mean(0))
        diag["feet_vs_face_cos"] = float(toes @ front) if front is not None else None
        if front is None:
            front = toes
    if front is None:
        front = _normalize(np.cross(up, v[:, 0]))
    front = _normalize(front - (front @ up) * up)
    return {"up": up.tolist(), "front": front.tolist(), "diagnostics": diag}


def view_frame(xyz=None, rgb=None, use_cache=True):
    """The shared view frame: {'up','front','left','center','extent_*', 'fov_deg', 'distance'}.

    Uses ``view_frame.json`` (frozen for the Sub-project 2 input) unless ``use_cache`` is False."""
    if use_cache and _FRAME_JSON.exists():
        with open(_FRAME_JSON) as f:
            return json.load(f)
    if xyz is None:
        from .io import read_point_cloud
        from .paths import input_ply
        xyz, rgb = read_point_cloud(input_ply())
    est = estimate_view_frame(xyz, rgb)
    # The estimator's front sign is verified per dataset by rendering (the jersey's "SPAIN 6" is on the back):
    # VGGSfM frame -> flip (default); COLMAP/MVS frame -> CV802_SP2_FRONT_FLIP=0.
    flip = -1.0 if os.environ.get("CV802_SP2_FRONT_FLIP", "1") == "1" else 1.0
    up, front = np.array(est["up"]), flip * np.array(est["front"])
    left = _normalize(np.cross(up, front))                 # person's left (right-handed: left = up x front)
    R = np.stack([left, up, front])                         # rows: frame axes
    Y = np.asarray(xyz) @ R.T
    lo, hi = np.percentile(Y, 0.1, axis=0), np.percentile(Y, 99.9, axis=0)
    center = ((lo + hi) / 2) @ R                            # back to world
    ext = hi - lo
    fov = 30.0
    half_h = 0.5 * ext[1] * 1.10
    half_w = 0.5 * max(ext[0], ext[2]) * 1.10
    aspect = 768 / 1024
    tan = math.tan(math.radians(fov / 2))
    dist = max(half_h / tan, half_w / (tan * aspect)) + 0.5 * max(ext[0], ext[2])
    return {"up": up.tolist(), "front": front.tolist(), "left": left.tolist(), "center": center.tolist(),
            "extent_left_up_front": ext.tolist(), "fov_deg": fov, "distance": float(dist),
            "image_size": [768, 1024], "estimate_diagnostics": est["diagnostics"]}


def make_camera(frame, view="front", azimuth_deg=None, elevation_deg=0.0):
    """Camera dict (eye, target, up, fov_deg) for a named view or an azimuth around ``up``
    (azimuth 0 = front, 90 = person's left, 180 = back, 270 = person's right)."""
    if azimuth_deg is None:
        azimuth_deg = {"front": 0.0, "left": 90.0, "back": 180.0, "right": 270.0}[view]
    up, front, left = (np.array(frame[k]) for k in ("up", "front", "left"))
    a, e = math.radians(azimuth_deg), math.radians(elevation_deg)
    d = (math.cos(a) * front + math.sin(a) * left) * math.cos(e) + math.sin(e) * up
    target = np.array(frame["center"])
    return {"eye": target + frame["distance"] * d, "target": target, "up": up, "fov_deg": frame["fov_deg"]}


def _project(V, cam, H, W, torch, dev):
    eye = torch.tensor(cam["eye"], dtype=torch.float64, device=dev)
    tgt = torch.tensor(cam["target"], dtype=torch.float64, device=dev)
    upv = torch.tensor(cam["up"], dtype=torch.float64, device=dev)
    fwd = tgt - eye; fwd = fwd / fwd.norm()
    right = torch.linalg.cross(fwd, upv); right = right / right.norm()
    tup = torch.linalg.cross(right, fwd)
    P = V - eye
    xc, yc, zc = P @ right, P @ tup, P @ fwd
    f = (H / 2) / math.tan(math.radians(cam["fov_deg"]) / 2)
    px = W / 2 + f * xc / zc
    py = H / 2 - f * yc / zc
    return torch.stack([px, py], 1), 1.0 / zc, eye


def render_mesh(V, F, cam, size=(768, 1024), VT=None, FT=None, image=None, vertex_rgb=None, mode="textured",
                ssaa=2, device=None, background=BACKGROUND):
    """Render a mesh. ``mode``: 'textured' (texture or vertex colours, mild headlight shading),
    'shaded' (geometry only: flat face normals, two-sided; back faces tinted red),
    'normals' (face-normal colour map). Returns uint8 (H, W, 3)."""
    import torch
    import torch.nn.functional as Fnn

    from .raster import rasterize

    dev = get_device(device) if not hasattr(device, "type") else device
    W, H = int(size[0]), int(size[1])
    Hs, Ws = H * ssaa, W * ssaa
    Vt = torch.as_tensor(np.asarray(V, np.float64), device=dev)
    Ft = torch.as_tensor(np.asarray(F, np.int64), device=dev)
    xy, iw, eye = _project(Vt, cam, Hs, Ws, torch, dev)
    tri_xy = xy[Ft].float()
    tri_iw = iw[Ft].float()
    max_cand = 8_000_000 if dev.type == "cuda" else 2_000_000
    face, bary = rasterize(tri_xy, Hs, Ws, inv_w=tri_iw, max_candidates=max_cand)
    hit = face >= 0
    fid = face.clamp(min=0)
    bg = torch.tensor(background, dtype=torch.float32, device=dev) / 255.0
    out = bg.expand(Hs, Ws, 3).clone()
    if hit.any():
        fh = fid[hit]
        bh = bary[hit].double()
        tri = Vt[Ft[fh]]
        pos = (bh[:, :, None] * tri).sum(1)
        vdir = eye[None] - pos
        vdir = vdir / vdir.norm(dim=1, keepdim=True).clamp(min=1e-30)
        fn = torch.as_tensor(face_normals(V, F), device=dev)[fh]
        facing = (fn * vdir).sum(1)
        cam_up = torch.as_tensor(np.asarray(cam["up"], np.float64), device=dev)
        if mode == "shaded":
            n = torch.where(facing[:, None] < 0, -fn, fn)
            # key light from the upper front-left of the camera, fill light from the camera.
            fwd = -vdir.mean(0); fwd = fwd / fwd.norm()
            right = torch.linalg.cross(fwd, cam_up); right = right / right.norm()
            l1 = (-fwd * 0.75 + cam_up * 0.55 - right * 0.35); l1 = l1 / l1.norm()
            diff = 0.65 * (n @ l1).clamp(min=0) + 0.35 * (n * vdir).sum(1).clamp(min=0)
            base_front = torch.tensor([0.78, 0.80, 0.84], device=dev, dtype=torch.float64)
            base_back = torch.tensor([0.85, 0.45, 0.42], device=dev, dtype=torch.float64)
            base = torch.where((facing < 0)[:, None], base_back, base_front)
            col = base * (0.18 + 0.85 * diff[:, None])
        elif mode == "normals":
            col = 0.5 * (fn + 1.0)
        else:
            if image is not None and VT is not None:
                VTt = torch.as_tensor(np.asarray(VT, np.float64), device=dev)
                FTt = torch.as_tensor(np.asarray(FT, np.int64), device=dev)
                uv = (bh[:, :, None] * VTt[FTt[fh]]).sum(1)
                tex = torch.as_tensor(np.asarray(image)[..., :3], device=dev).float().permute(2, 0, 1)[None] / 255.0
                grid = torch.stack([uv[:, 0] * 2 - 1, (1 - uv[:, 1]) * 2 - 1], 1).float()[None, None]
                alb = Fnn.grid_sample(tex, grid, mode="bilinear", align_corners=False, padding_mode="border")
                alb = alb[0, :, 0].T.double()
            elif vertex_rgb is not None:
                vc = torch.as_tensor(np.asarray(vertex_rgb, np.float64) / 255.0, device=dev)
                alb = (bh[:, :, None] * vc[Ft[fh]]).sum(1)
            else:
                alb = torch.full((len(fh), 3), 0.8, dtype=torch.float64, device=dev)
            vn = torch.as_tensor(vertex_normals(V, F), device=dev)
            n = (bh[:, :, None] * vn[Ft[fh]]).sum(1)
            n = n / n.norm(dim=1, keepdim=True).clamp(min=1e-30)
            lam = (n * vdir).sum(1).abs()
            col = alb * (0.72 + 0.28 * lam[:, None])
        out[hit] = col.float().clamp(0, 1)
    img = out.permute(2, 0, 1)[None]
    if ssaa > 1:
        img = Fnn.avg_pool2d(img, ssaa)
    return (img[0].permute(1, 2, 0).clamp(0, 1) * 255 + 0.5).byte().cpu().numpy()


def render_points(xyz, rgb, cam, size=(768, 1024), radius_px=1.6, ssaa=2, device=None, background=BACKGROUND):
    """Splat a coloured point cloud (square splats, z-buffered) with the same camera model."""
    import torch
    import torch.nn.functional as Fnn

    dev = get_device(device) if not hasattr(device, "type") else device
    W, H = int(size[0]), int(size[1])
    Hs, Ws = H * ssaa, W * ssaa
    P = torch.as_tensor(np.asarray(xyz, np.float64), device=dev)
    xy, iw, _ = _project(P, cam, Hs, Ws, torch, dev)
    C = torch.as_tensor(np.asarray(rgb), device=dev).float() / 255.0
    r = max(1, int(round(radius_px * ssaa)))
    offs = [(dx, dy) for dx in range(-r + 1, r) for dy in range(-r + 1, r)]
    zbuf = torch.full((Hs * Ws,), -float("inf"), dtype=torch.float64, device=dev)
    for dx, dy in offs:
        x = (xy[:, 0].floor() + dx).long(); y = (xy[:, 1].floor() + dy).long()
        m = (x >= 0) & (x < Ws) & (y >= 0) & (y < Hs) & (iw > 0)
        zbuf.scatter_reduce_(0, (y * Ws + x)[m], iw[m], reduce="amax")
    owner = torch.full((Hs * Ws,), -1, dtype=torch.long, device=dev)
    ids = torch.arange(len(P), device=dev)
    for dx, dy in offs:
        x = (xy[:, 0].floor() + dx).long(); y = (xy[:, 1].floor() + dy).long()
        m = (x >= 0) & (x < Ws) & (y >= 0) & (y < Hs) & (iw > 0)
        pix = (y * Ws + x)[m]
        win = iw[m] >= zbuf[pix]
        owner.scatter_reduce_(0, pix[win], ids[m][win], reduce="amax")
    bg = torch.tensor(background, dtype=torch.float32, device=dev) / 255.0
    out = bg.expand(Hs * Ws, 3).clone()
    hit = owner >= 0
    out[hit] = C[owner[hit]]
    img = out.view(Hs, Ws, 3).permute(2, 0, 1)[None]
    if ssaa > 1:
        img = Fnn.avg_pool2d(img, ssaa)
    return (img[0].permute(1, 2, 0).clamp(0, 1) * 255 + 0.5).byte().cpu().numpy()


def _save(img, path):
    from PIL import Image

    path = Path(path)
    tmp = path.with_name(path.name + ".tmp.png")
    Image.fromarray(img).save(tmp)
    tmp.replace(path)
    return path


def render_previews(out_dir, V, F, VT=None, FT=None, image=None, vertex_rgb=None, frame=None, size=(768, 1024),
                    device=None, thumb_size=(240, 320), log=print):
    """Write preview_{front,back,left,right}.png (textured), preview_shaded.png (front, geometry only),
    preview_shaded_grid.png (front/left/back/right shaded strip) and thumb.png. Returns written paths."""
    from PIL import Image

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    frame = frame or view_frame()
    written = []
    for v in VIEW_NAMES:
        img = render_mesh(V, F, make_camera(frame, v), size=size, VT=VT, FT=FT, image=image, vertex_rgb=vertex_rgb,
                          mode="textured", device=device)
        written.append(_save(img, out / f"preview_{v}.png"))
        if v == "front":
            th = Image.fromarray(img).resize(thumb_size, Image.LANCZOS)
            written.append(_save(np.asarray(th), out / "thumb.png"))
    shaded = []
    for v in ("front", "left", "back", "right"):
        shaded.append(render_mesh(V, F, make_camera(frame, v), size=size, mode="shaded", device=device))
    written.append(_save(shaded[0], out / "preview_shaded.png"))
    half = [np.asarray(Image.fromarray(s).resize((size[0] // 2, size[1] // 2), Image.LANCZOS)) for s in shaded]
    written.append(_save(np.concatenate(half, axis=1), out / "preview_shaded_grid.png"))
    return written
