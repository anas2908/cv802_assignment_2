"""Build the mesh data of the all-in-one page (surface/ui/hub) from the packaged results.

python surface/ui/hub/build_hub_data.py [out_dir]     (base env; out_dir defaults to surface/ui/hub)


For each input (vggsfm, mvs, mvs_clean): every best run in results/<ds>.zip becomes one GLB (positions, normals,
UVs and its JPEG texture inside), turned into the person frame (x = left, y = up, z = front), centred and scaled to
unit height; the input cloud becomes a GLB of coloured points; every GLB is stored gzip-compressed (.glbz, unpacked
in the browser); metrics go to data/results.json.
"""
import gzip
import io
import json
import os
import struct
import sys
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent
TEX = 2048
DATASETS = {
    "vggsfm": ("VGGSfM (mask-cleaned)", "light_shirt_vggsfm_clean.ply", "1"),
    "mvs": ("MVS (COLMAP E10)", "light_shirt_mvs_e10.ply", "0"),
    "mvs_clean": ("MVS, floaters removed", "light_shirt_mvs_e10_clean.ply", "0"),
}
MAX_POINTS = 250_000


def read_obj(text):
    V, T, FV, FT = [], [], [], []
    for line in text.splitlines():
        if line.startswith("v "):
            V.append(line[2:].split()[:3])
        elif line.startswith("vt "):
            T.append(line[3:].split()[:2])
        elif line.startswith("f "):
            p = [s.split("/") for s in line[2:].split()[:3]]
            FV.append([int(a[0]) - 1 for a in p]); FT.append([int(a[1]) - 1 for a in p])
    return np.array(V, float), np.array(T, float), np.array(FV, np.int64), np.array(FT, np.int64)


def vertex_normals(V, F):
    n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    N = np.zeros_like(V)
    for k in range(3):
        np.add.at(N, F[:, k], n)
    return N / np.linalg.norm(N, axis=1, keepdims=True).clip(1e-12)


def pad4(b, fill=b"\x00"):
    return b + fill * ((4 - len(b) % 4) % 4)


def glb(attrs, indices=None, image=None, mode=4):
    """attrs: list of (name, np.array, componentType, normalized). Returns GLB bytes."""
    bin_ = b""
    views, accs = [], []

    def add(arr, ctype, normalized=False, target=None, minmax=False):
        nonlocal bin_
        data = arr.tobytes()
        views.append({"buffer": 0, "byteOffset": len(bin_), "byteLength": len(data), **({"target": target} if target else {})})
        bin_ = pad4(bin_ + data)
        typ = {1: "SCALAR", 2: "VEC2", 3: "VEC3", 4: "VEC4"}[1 if arr.ndim == 1 else arr.shape[1]]
        acc = {"bufferView": len(views) - 1, "componentType": ctype, "count": int(arr.shape[0]), "type": typ}
        if normalized:
            acc["normalized"] = True
        if minmax:
            acc["min"] = arr.min(0).tolist(); acc["max"] = arr.max(0).tolist()
        accs.append(acc)
        return len(accs) - 1

    prim = {"attributes": {}, "mode": mode}
    for name, arr, ctype, norm in attrs:
        prim["attributes"][name] = add(arr, ctype, norm, 34962, minmax=(name == "POSITION"))
    if indices is not None:
        big = indices.max() >= 65535
        prim["indices"] = add(indices.astype(np.uint32 if big else np.uint16).ravel(), 5125 if big else 5123, target=34963)
    doc = {"asset": {"version": "2.0", "generator": "cv802 hub"}, "scene": 0, "scenes": [{"nodes": [0]}],
           "nodes": [{"mesh": 0}], "meshes": [{"primitives": [prim]}], "accessors": accs, "bufferViews": views}
    if image is not None:
        views.append({"buffer": 0, "byteOffset": len(bin_), "byteLength": len(image)})
        bin_ = pad4(bin_ + image)
        doc.update({"images": [{"bufferView": len(views) - 1, "mimeType": "image/jpeg"}], "samplers": [{"magFilter": 9729, "minFilter": 9987}],
                    "textures": [{"sampler": 0, "source": 0}],
                    "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0, "roughnessFactor": 1}, "doubleSided": True}]})
        prim["material"] = 0
    doc["buffers"] = [{"byteLength": len(bin_)}]
    js = pad4(json.dumps(doc, separators=(",", ":")).encode(), b" ")
    total = 12 + 8 + len(js) + 8 + len(bin_)
    return struct.pack("<III", 0x46546C67, 2, total) + struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(bin_), 0x004E4942) + bin_


def frame_for(ds, flip, ply):
    os.environ["CV802_SP2_FRONT_FLIP"] = flip
    os.environ["CV802_SP2_INPUT_PLY"] = str(ply)
    from surface.common import io as sio
    from surface.common.render import view_frame
    xyz, rgb = sio.read_point_cloud(ply)
    fr = view_frame(xyz, rgb, use_cache=(ds == "vggsfm"))
    R = np.stack([fr["left"], fr["up"], fr["front"]])
    Y = xyz @ R.T
    lo, hi = np.percentile(Y, 0.1, axis=0), np.percentile(Y, 99.9, axis=0)
    c = (lo + hi) / 2
    s = 1.0 / (hi[1] - lo[1])
    return R, c, s, xyz, rgb


def main():
    for d in ("mesh", "points", "data", "thumbs"):
        (OUT / d).mkdir(parents=True, exist_ok=True)
    index = {}
    for ds, (label, cloud, flip) in DATASETS.items():
        ply = REPO / "surface" / "inputs" / cloud
        R, c, s, xyz, rgb = frame_for(ds, flip, ply)
        T = lambda P: ((np.asarray(P, float) @ R.T) - c) * s
        # input dots
        idx = np.arange(len(xyz))
        if len(idx) > MAX_POINTS:
            idx = np.random.default_rng(0).choice(len(xyz), MAX_POINTS, replace=False)
        P = T(xyz[idx]).astype(np.float32)
        b = glb([("POSITION", P, 5126, False), ("COLOR_0", np.ascontiguousarray(rgb[idx].astype(np.uint8)), 5121, True)], mode=0)
        (OUT / "points" / f"{ds}.glbz").write_bytes(gzip.compress(b, 9))
        print(ds, "points", len(idx), f"{len(b) / 1e6:.1f} MB", flush=True)
        z = zipfile.ZipFile(REPO / "results" / f"{ds}.zip")
        runs = sorted({n.rsplit("/", 1)[0] for n in z.namelist() if n.endswith("/manifest.json")})
        rows = []
        for base in runs:
            man = json.loads(z.read(base + "/manifest.json"))
            met = json.loads(z.read(base + "/metrics.json"))
            info = json.loads(z.read(base + "/method_info.json")) if base + "/method_info.json" in z.namelist() else {}
            V, VT, FV, FT = read_obj(z.read(base + "/mesh.obj").decode())
            N = vertex_normals(V, FV)
            pairs = np.stack([FV.ravel(), FT.ravel()], 1)
            uniq, inv = np.unique(pairs, axis=0, return_inverse=True)
            pos = T(V[uniq[:, 0]]).astype(np.float32)
            nrm = (N[uniq[:, 0]] @ R.T).astype(np.float32)
            uv = VT[uniq[:, 1]].copy(); uv[:, 1] = 1 - uv[:, 1]
            img = Image.open(io.BytesIO(z.read(base + "/texture.jpg"))).convert("RGB")
            if img.size[0] > TEX:
                img = img.resize((TEX, TEX), Image.LANCZOS)
            jb = io.BytesIO(); img.save(jb, "JPEG", quality=85, optimize=True)
            b = glb([("POSITION", pos, 5126, False), ("NORMAL", nrm, 5126, False), ("TEXCOORD_0", uv.astype(np.float32), 5126, False)],
                    indices=inv.reshape(-1, 3), image=jb.getvalue())
            mid = man["method_id"]
            (OUT / "mesh" / ds).mkdir(exist_ok=True)
            (OUT / "mesh" / ds / f"{mid}.glbz").write_bytes(gzip.compress(b, 9))
            th = Image.open(io.BytesIO(z.read(base + "/thumb.png"))).convert("RGB"); tb = io.BytesIO(); th.save(tb, "JPEG", quality=82)
            (OUT / "thumbs" / f"{ds}__{mid}.jpg").write_bytes(tb.getvalue())
            g, m, tx = met["geometry"], met["mesh"], met.get("texture", {})
            rows.append({"method_id": mid, "method": man.get("method_name"), "run": man.get("source_run", man["run_id"]),
                         "file": f"mesh/{ds}/{mid}.glb", "thumb": f"thumbs/{ds}__{mid}.jpg", "mb": round(len(b) / 1e6, 1),
                         "faces_full": man["metrics"]["faces"], "faces_view": int(len(FV)),
                         "chamfer_pct": g["chamfer_pct_diag"], "f1": g["fscore@1.0%"]["f"], "f05": g["fscore@0.5%"]["f"],
                         "nc": g["normal_consistency"], "psnr": tx.get("psnr_db"), "watertight": m.get("watertight"),
                         "boundary_edges": m.get("boundary_edges"), "components": m.get("connected_components"),
                         "colour": man.get("texture", {}).get("color_source"), "paper": info.get("paper"),
                         "seconds": info.get("elapsed_seconds")})
            print(ds, mid, len(FV), "faces", f"{len(b) / 1e6:.1f} MB", flush=True)
        index[ds] = {"label": label, "points": f"points/{ds}.glb", "n_points": int(len(xyz)), "n_points_shown": int(len(idx)), "runs": rows}
    (OUT / "data" / "results.json").write_text(json.dumps(index, indent=1))


if __name__ == "__main__":
    main()
