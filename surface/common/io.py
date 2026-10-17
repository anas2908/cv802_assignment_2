"""Mesh / point-cloud I/O for Sub-project 2 (no open3d).

Conventions
-----------
* Points/vertices are float64 ``(N, 3)`` arrays in the VGGSfM world frame.
* Colours are uint8 ``(N, 3)`` RGB.
* Faces are int64 ``(F, 3)`` arrays (triangles; polygons are fan-triangulated on read).
* UVs (``VT``) use the OBJ convention: origin at the bottom-left of the texture image,
  ``v`` grows upwards. Image arrays are stored top row first (as PIL/numpy do), so texel row
  ``r`` corresponds to ``v = 1 - (r + 0.5) / H``.
"""
from __future__ import annotations

import os
import struct
from pathlib import Path

import numpy as np

__all__ = [
    "read_point_cloud",
    "read_mesh",
    "read_obj",
    "write_mesh_ply",
    "write_point_cloud_ply",
    "write_textured_obj",
    "read_textured_obj",
    "sha256_file",
]

_PLY_TYPES = {
    "char": "i1", "int8": "i1", "uchar": "u1", "uint8": "u1",
    "short": "i2", "int16": "i2", "ushort": "u2", "uint16": "u2",
    "int": "i4", "int32": "i4", "uint": "u4", "uint32": "u4",
    "float": "f4", "float32": "f4", "double": "f8", "float64": "f8",
}


def sha256_file(path, chunk: int = 1 << 20) -> str:
    import hashlib

    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(chunk)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


# --------------------------------------------------------------------------------------------
# PLY reading (ascii, binary_little_endian, binary_big_endian)
# --------------------------------------------------------------------------------------------
def _parse_ply_header(f):
    line = f.readline().strip()
    if line != b"ply":
        raise ValueError("not a PLY file")
    fmt = None
    elements = []  # list of (name, count, [props]) ; prop = (name, type) or (name, ('list', ctype, itype))
    while True:
        line = f.readline()
        if not line:
            raise ValueError("unexpected EOF in PLY header")
        tok = line.decode("ascii", "replace").strip().split()
        if not tok:
            continue
        if tok[0] == "format":
            fmt = tok[1]
        elif tok[0] == "element":
            elements.append((tok[1], int(tok[2]), []))
        elif tok[0] == "property":
            if tok[1] == "list":
                elements[-1][2].append((tok[4], ("list", _PLY_TYPES[tok[2]], _PLY_TYPES[tok[3]])))
            else:
                elements[-1][2].append((tok[2], _PLY_TYPES[tok[1]]))
        elif tok[0] == "end_header":
            break
    return fmt, elements


def _read_ply(path):
    """Return dict element_name -> dict prop_name -> array (list props -> list/array of rows)."""
    out = {}
    with open(path, "rb") as f:
        fmt, elements = _parse_ply_header(f)
        if fmt == "ascii":
            rest = f.read().decode("ascii", "replace").split()
            pos = 0
            for name, count, props in elements:
                has_list = any(isinstance(t, tuple) for _, t in props)
                if not has_list:
                    n = len(props)
                    arr = np.array(rest[pos:pos + n * count], dtype=np.float64).reshape(count, n)
                    pos += n * count
                    out[name] = {p: arr[:, i].astype(t) for i, (p, t) in enumerate(props)}
                else:
                    cols = {p: [] for p, _ in props}
                    for _ in range(count):
                        for p, t in props:
                            if isinstance(t, tuple):
                                k = int(rest[pos]); pos += 1
                                cols[p].append(np.array(rest[pos:pos + k], dtype=np.float64).astype(t[2]))
                                pos += k
                            else:
                                cols[p].append(float(rest[pos])); pos += 1
                    out[name] = {p: (v if isinstance(t, tuple) else np.array(v).astype(t))
                                 for (p, t), v in zip(props, cols.values())}
            return out
        endian = "<" if fmt == "binary_little_endian" else ">"
        data = f.read()
    pos = 0
    for name, count, props in elements:
        has_list = any(isinstance(t, tuple) for _, t in props)
        if not has_list:
            dt = np.dtype([(p, endian + t) for p, t in props])
            arr = np.frombuffer(data, dtype=dt, count=count, offset=pos)
            pos += dt.itemsize * count
            out[name] = {p: arr[p].copy() for p, _ in props}
            continue
        # Fast path: a single list property of triangles (the overwhelmingly common face layout).
        if len(props) == 1 and count > 0:
            p, (_, ctype, itype) = props[0]
            cdt, idt = np.dtype(endian + ctype), np.dtype(endian + itype)
            first = int(np.frombuffer(data, dtype=cdt, count=1, offset=pos)[0])
            rec = np.dtype([("n", cdt), ("v", idt, (first,))])
            if pos + rec.itemsize * count <= len(data):
                arr = np.frombuffer(data, dtype=rec, count=count, offset=pos)
                if np.all(arr["n"] == first):
                    out[name] = {p: arr["v"].astype(np.int64)}
                    pos += rec.itemsize * count
                    continue
        cols = {p: [] for p, _ in props}
        for _ in range(count):
            for p, t in props:
                if isinstance(t, tuple):
                    cdt, idt = np.dtype(endian + t[1]), np.dtype(endian + t[2])
                    k = int(np.frombuffer(data, dtype=cdt, count=1, offset=pos)[0]); pos += cdt.itemsize
                    cols[p].append(np.frombuffer(data, dtype=idt, count=k, offset=pos).astype(np.int64))
                    pos += idt.itemsize * k
                else:
                    dt = np.dtype(endian + t)
                    cols[p].append(np.frombuffer(data, dtype=dt, count=1, offset=pos)[0]); pos += dt.itemsize
        out[name] = {p: (v if isinstance(t, tuple) else np.array(v)) for (p, t), v in zip(props, cols.values())}
    return out


def _colors_from(el):
    for names in (("red", "green", "blue"), ("r", "g", "b"), ("diffuse_red", "diffuse_green", "diffuse_blue")):
        if all(n in el for n in names):
            c = np.stack([el[n] for n in names], axis=1)
            if c.dtype.kind == "f":
                c = np.clip(np.round(c * 255.0 if c.max() <= 1.0 + 1e-6 else c), 0, 255)
            return c.astype(np.uint8)
    return None


def _triangulate(polys):
    if isinstance(polys, np.ndarray) and polys.ndim == 2:
        if polys.shape[1] == 3:
            return polys.astype(np.int64)
        polys = list(polys)
    tris = []
    for p in polys:
        p = np.asarray(p, dtype=np.int64)
        for i in range(1, len(p) - 1):
            tris.append((p[0], p[i], p[i + 1]))
    return np.asarray(tris, dtype=np.int64).reshape(-1, 3)


def read_point_cloud(path):
    """Read a coloured point cloud (PLY). Returns ``(xyz float64 Nx3, rgb uint8 Nx3)``.

    Points without colour get mid-grey."""
    ply = _read_ply(path)
    v = ply["vertex"]
    xyz = np.stack([v["x"], v["y"], v["z"]], axis=1).astype(np.float64)
    rgb = _colors_from(v)
    if rgb is None:
        rgb = np.full((len(xyz), 3), 128, np.uint8)
    return xyz, rgb


def read_obj(path):
    """Minimal OBJ reader. Returns ``(V, F, vertex_rgb or None, VT or None, FT or None)``.

    Supports ``v x y z [r g b]`` vertex colours (0..1 floats or 0..255) and polygon fans."""
    V, C, VT, F, FT = [], [], [], [], []
    with open(path, "r", errors="replace") as f:
        for line in f:
            if line.startswith("v "):
                t = line.split()
                V.append([float(x) for x in t[1:4]])
                if len(t) >= 7:
                    C.append([float(x) for x in t[4:7]])
            elif line.startswith("vt "):
                t = line.split()
                VT.append([float(t[1]), float(t[2])])
            elif line.startswith("f "):
                t = line.split()[1:]
                vi, ti = [], []
                for w in t:
                    s = w.split("/")
                    vi.append(int(s[0]))
                    ti.append(int(s[1]) if len(s) > 1 and s[1] else 0)
                for i in range(1, len(vi) - 1):
                    F.append([vi[0], vi[i], vi[i + 1]])
                    FT.append([ti[0], ti[i], ti[i + 1]])
    V = np.asarray(V, np.float64).reshape(-1, 3)
    F = np.asarray(F, np.int64).reshape(-1, 3)
    F = np.where(F < 0, F + len(V), F - 1)
    rgb = None
    if C and len(C) == len(V):
        C = np.asarray(C, np.float64)
        if C.max() <= 1.0 + 1e-6:
            C = C * 255.0
        rgb = np.clip(np.round(C), 0, 255).astype(np.uint8)
    VT_a = FT_a = None
    if VT and FT and np.all(np.asarray(FT) != 0):
        VT_a = np.asarray(VT, np.float64)
        FT_a = np.asarray(FT, np.int64)
        FT_a = np.where(FT_a < 0, FT_a + len(VT_a), FT_a - 1)
    return V, F, rgb, VT_a, FT_a


def read_mesh(path):
    """Read a triangle mesh (PLY ascii/binary or OBJ). Returns ``(V float64, F int64, vertex_rgb uint8 or None)``."""
    path = str(path)
    if path.lower().endswith(".obj"):
        V, F, rgb, _, _ = read_obj(path)
        return V, F, rgb
    ply = _read_ply(path)
    v = ply["vertex"]
    V = np.stack([v["x"], v["y"], v["z"]], axis=1).astype(np.float64)
    rgb = _colors_from(v)
    F = np.zeros((0, 3), np.int64)
    if "face" in ply:
        fe = ply["face"]
        key = "vertex_indices" if "vertex_indices" in fe else ("vertex_index" if "vertex_index" in fe else next(iter(fe)))
        F = _triangulate(fe[key])
    return V, F, rgb


# --------------------------------------------------------------------------------------------
# Writing
# --------------------------------------------------------------------------------------------
def _atomic_replace(tmp, path):
    os.replace(tmp, path)


def write_mesh_ply(path, V, F, rgb=None):
    """Binary little-endian PLY: float xyz, optional uchar rgb, uchar-count int vertex_indices."""
    V = np.asarray(V, np.float32)
    F = np.asarray(F, np.int32).reshape(-1, 3)
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    hdr = ["ply", "format binary_little_endian 1.0", f"element vertex {len(V)}",
           "property float x", "property float y", "property float z"]
    if rgb is not None:
        hdr += ["property uchar red", "property uchar green", "property uchar blue"]
    hdr += [f"element face {len(F)}", "property list uchar int vertex_indices", "end_header"]
    if rgb is not None:
        vdt = np.dtype([("p", "<f4", 3), ("c", "u1", 3)])
        va = np.empty(len(V), vdt); va["p"] = V; va["c"] = np.asarray(rgb, np.uint8)
    else:
        va = V.astype("<f4")
    fdt = np.dtype([("n", "u1"), ("v", "<i4", 3)])
    fa = np.empty(len(F), fdt); fa["n"] = 3; fa["v"] = F
    tmp = path.with_name(path.name + ".tmp")
    with open(tmp, "wb") as f:
        f.write(("\n".join(hdr) + "\n").encode("ascii"))
        f.write(va.tobytes())
        f.write(fa.tobytes())
    _atomic_replace(tmp, path)


def write_point_cloud_ply(path, xyz, rgb=None, normals=None):
    xyz = np.asarray(xyz, np.float32)
    fields = [("p", "<f4", 3)]
    hdr = ["ply", "format binary_little_endian 1.0", f"element vertex {len(xyz)}",
           "property float x", "property float y", "property float z"]
    if normals is not None:
        fields.append(("n", "<f4", 3)); hdr += ["property float nx", "property float ny", "property float nz"]
    if rgb is not None:
        fields.append(("c", "u1", 3)); hdr += ["property uchar red", "property uchar green", "property uchar blue"]
    hdr.append("end_header")
    a = np.empty(len(xyz), np.dtype(fields)); a["p"] = xyz
    if normals is not None:
        a["n"] = normals
    if rgb is not None:
        a["c"] = rgb
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        f.write(("\n".join(hdr) + "\n").encode("ascii"))
        f.write(a.tobytes())


def _write_rows(f, prefix, arr, fmt, chunk=200000):
    if len(arr) == 0:
        return
    row = prefix + " " + " ".join([fmt] * arr.shape[1]) + "\n"
    for s in range(0, len(arr), chunk):  # chunked to bound the size of the formatted string
        blk = arr[s:s + chunk]
        f.write((row * len(blk)) % tuple(blk.ravel().tolist()))


def write_textured_obj(out_dir, V, F, VT, FT, image, VN=None, basename="mesh", texture_name="texture.png",
                       material="material0"):
    """Write ``<basename>.obj``, ``<basename>.mtl`` and ``texture.png`` into ``out_dir``.

    ``VT`` must follow the OBJ convention (origin bottom-left, v up); ``image`` is a uint8 HxWx3 array
    stored top row first (``texture.uv_to_pixel`` maps between the two). ``VN`` (per-vertex normals,
    indexed like ``V``) is optional; when given, faces are written ``f v/vt/vn``.
    Returns the list of written paths."""
    from PIL import Image

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    V = np.asarray(V, np.float64); F = np.asarray(F, np.int64)
    VT = np.asarray(VT, np.float64); FT = np.asarray(FT, np.int64)
    obj_p, mtl_p, tex_p = out / f"{basename}.obj", out / f"{basename}.mtl", out / texture_name
    img = np.asarray(image)
    if img.dtype != np.uint8:
        img = np.clip(np.round(img * (255.0 if img.max() <= 1.0 else 1.0)), 0, 255).astype(np.uint8)
    Image.fromarray(img[..., :3]).save(tex_p.with_name(tex_p.name + ".tmp.png"))
    _atomic_replace(tex_p.with_name(tex_p.name + ".tmp.png"), tex_p)
    with open(mtl_p.with_name(mtl_p.name + ".tmp"), "w") as f:
        f.write(f"# CV802 Sub-project 2\nnewmtl {material}\nKa 1.000 1.000 1.000\nKd 1.000 1.000 1.000\n"
                f"Ks 0.000 0.000 0.000\nNs 1.0\nd 1.0\nillum 1\nmap_Kd {texture_name}\n")
    _atomic_replace(mtl_p.with_name(mtl_p.name + ".tmp"), mtl_p)
    with open(obj_p.with_name(obj_p.name + ".tmp"), "w") as f:
        f.write(f"# CV802 Sub-project 2 textured mesh\n# vertices {len(V)} faces {len(F)}\n")
        f.write(f"mtllib {basename}.mtl\n")
        _write_rows(f, "v", V, "%.7g")
        _write_rows(f, "vt", VT, "%.7f")
        if VN is not None:
            _write_rows(f, "vn", np.asarray(VN, np.float64), "%.5f")
        f.write(f"usemtl {material}\ns off\n")
        if VN is not None:
            a = np.stack([F + 1, FT + 1, F + 1], axis=2).reshape(len(F), 9)
            row = "f %d/%d/%d %d/%d/%d %d/%d/%d\n"
        else:
            a = np.stack([F + 1, FT + 1], axis=2).reshape(len(F), 6)
            row = "f %d/%d %d/%d %d/%d\n"
        for s in range(0, len(F), 200000):  # chunked to bound peak memory of the formatted string
            blk = a[s:s + 200000]
            f.write((row * len(blk)) % tuple(blk.ravel().tolist()))
    _atomic_replace(obj_p.with_name(obj_p.name + ".tmp"), obj_p)
    return [obj_p, mtl_p, tex_p]


def read_textured_obj(obj_path):
    """Read an OBJ + its map_Kd texture. Returns ``(V, F, VT, FT, image uint8 HxWx3 or None)``."""
    from PIL import Image

    obj_path = Path(obj_path)
    V, F, _, VT, FT = read_obj(obj_path)
    img = None
    mtl = None
    with open(obj_path, "r", errors="replace") as f:
        for line in f:
            if line.startswith("mtllib"):
                mtl = obj_path.parent / line.split(None, 1)[1].strip()
                break
    if mtl is not None and mtl.exists():
        with open(mtl, "r", errors="replace") as f:
            for line in f:
                if line.strip().startswith("map_Kd"):
                    tp = obj_path.parent / line.strip().split(None, 1)[1].strip()
                    if tp.exists():
                        img = np.asarray(Image.open(tp).convert("RGB"))
                    break
    return V, F, VT, FT, img
