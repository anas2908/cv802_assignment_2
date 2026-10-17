"""Figures for the report and slides, built from the finished runs' preview renders (results.json).

python -m surface.docs.deliverables.make_figures [--only inputs|grids|studies]   (base env, run on the node; CPU is enough)
Writes surface/docs/deliverables/figs/*.jpg. Pending runs (DHSP full pipeline on MVS while training) get a
"pending" tile, so the figure layout does not change when the result arrives.
"""
import argparse
import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from surface.docs.deliverables import resmodel as rm

HERE = Path(__file__).resolve().parent
FIGS = HERE / "figs"
CODE = HERE.parents[2]
DATA = Path(os.environ.get("CV802_SP2_DATA_ROOT", f"/l/users/{os.environ.get('USER', '')}/cv802_sp2"))
BG = (226, 229, 234)
FONT_DIR = "/usr/share/fonts/opentype/urw-base35/"
INPUT_PLY = {"vggsfm": CODE / "surface/inputs/light_shirt_vggsfm_clean.ply",
             "mvs": CODE / "surface/inputs/light_shirt_mvs_e10.ply",
             "mvs_clean": CODE / "surface/inputs/light_shirt_mvs_e10_clean.ply"}
FRAME = {"vggsfm": CODE / "surface/common/view_frame.json",
         "mvs": DATA / "outputs_mvs/view_frame.json", "mvs_clean": DATA / "outputs_mvs_clean/view_frame.json"}


def font(size, bold=False):
    return ImageFont.truetype(FONT_DIR + ("NimbusSans-Bold.otf" if bold else "NimbusSans-Regular.otf"), size)


def load(path):
    return Image.open(path).convert("RGB")


def content_box(img, tol=6):
    a = np.asarray(img).astype(int)
    m = (np.abs(a - np.array(BG)).sum(2) > tol)
    ys, xs = np.nonzero(m)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else (0, 0, img.width, img.height)


def union_box(imgs, pad=12):
    bs = [content_box(i) for i in imgs]
    x0, y0 = min(b[0] for b in bs) - pad, min(b[1] for b in bs) - pad
    x1, y1 = max(b[2] for b in bs) + pad, max(b[3] for b in bs) + pad
    W, H = imgs[0].size
    return max(0, x0), max(0, y0), min(W, x1), min(H, y1)


def pending_tile(size, text="training\nin progress"):
    t = Image.new("RGB", size, (240, 241, 244))
    d = ImageDraw.Draw(t)
    d.rectangle([4, 4, size[0] - 5, size[1] - 5], outline=(170, 170, 180), width=3)
    f = font(max(18, size[0] // 9), bold=True)
    d.multiline_text((size[0] // 2, size[1] // 2), text, fill=(150, 60, 60), font=f, anchor="mm", align="center", spacing=8)
    return t


def grid(cols, rows, labels, sublabels=None, row_labels=None, tile_h=560, title=None, gap=10, out=None):
    """cols x rows tiles (PIL images or None = pending). Labels above each column."""
    # crop every column with one box so the rows line up
    tiles = []
    for c in range(cols):
        col = [rows[r][c] for r in range(len(rows))]
        real = [t for t in col if isinstance(t, Image.Image)]
        box = union_box(real) if real else None
        tiles.append([t.crop(box) if isinstance(t, Image.Image) else t for t in col])
    widths = []
    fl, fs = font(27, True), font(23)
    for c in range(cols):
        real = [t for t in tiles[c] if isinstance(t, Image.Image)]
        w = int(real[0].width * tile_h / real[0].height) if real else int(tile_h * 0.42)
        tw = fl.getlength(labels[c])
        if sublabels:
            tw = max([tw] + [fs.getlength(x) for x in sublabels[c].split("\n")])
        widths.append(max(w, int(tw) + 16))
    nsub = max((len(x.split("\n")) for x in sublabels), default=0) if sublabels else 0
    lab_h = 46 + 30 * nsub
    rl_w = 46 if row_labels else 0
    top = (60 if title else 0) + lab_h
    W = rl_w + sum(widths) + gap * (cols + 1)
    H = top + len(rows) * (tile_h + gap) + gap
    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(canvas)
    if title:
        d.text((W // 2, 30), title, fill=(20, 20, 30), font=font(34, True), anchor="mm")
    x = rl_w + gap
    for c in range(cols):
        cx = x + widths[c] // 2
        y_lab = (60 if title else 0) + 22
        d.text((cx, y_lab), labels[c], fill=(15, 15, 25), font=font(27, True), anchor="mm")
        if sublabels:
            d.multiline_text((cx, y_lab + 30 + 14 * (len(sublabels[c].split("\n")) - 1)), sublabels[c], fill=(70, 70, 85),
                             font=fs, anchor="mm", align="center", spacing=6)
        for r in range(len(rows)):
            y = top + r * (tile_h + gap)
            t = tiles[c][r]
            if t is None:
                t = pending_tile((widths[c], tile_h))
            elif t == "blank":
                t = Image.new("RGB", (widths[c], tile_h), (255, 255, 255))
            else:
                w = int(t.width * tile_h / t.height)
                t0 = t.resize((min(w, widths[c]), tile_h), Image.LANCZOS)
                t = Image.new("RGB", (widths[c], tile_h), BG)
                t.paste(t0, ((widths[c] - t0.width) // 2, 0))
            canvas.paste(t, (x, y))
        x += widths[c] + gap
    if row_labels:
        for r, lab in enumerate(row_labels):
            y = top + r * (tile_h + gap) + tile_h // 2
            txt = Image.new("RGBA", (tile_h, 40), (255, 255, 255, 0))
            ImageDraw.Draw(txt).text((tile_h // 2, 20), lab, fill=(60, 60, 75), font=font(26, True), anchor="mm")
            txt = txt.rotate(90, expand=True)
            canvas.paste(txt, (4, y - tile_h // 2), txt)
    if out:
        canvas.save(FIGS / out, quality=90)
        print("wrote", FIGS / out, canvas.size)
    return canvas


def preview(r, name):
    if r is None or r == rm.PENDING:
        return None
    p = Path(r["dir"]) / name
    return load(p) if p.exists() else None


def shaded_of(ds, r):
    """Shaded render of the geometry (identical for a run and its photo-textured copy)."""
    return preview(r, "preview_shaded.png")


# ------------------------------------------------------------------ inputs
def render_inputs():
    import torch
    from surface.common import io
    from surface.common.render import make_camera, render_points, view_frame
    dev = torch.device("cpu")
    for ds in rm.DS:
        xyz, rgb = io.read_point_cloud(INPUT_PLY[ds])
        # same frame as the finalizer's previews: estimated from the cloud; the front sign differs per frame
        os.environ["CV802_SP2_FRONT_FLIP"] = "1" if ds == "vggsfm" else "0"
        frame = view_frame(xyz, rgb, use_cache=False)
        for v in ("front", "back"):
            img = render_points(xyz, rgb, make_camera(frame, v), radius_px=1.6 if ds == "vggsfm" else 1.1, device=dev)
            Image.fromarray(img).save(FIGS / f"input_{ds}_{v}.png")
        print("rendered input", ds, len(xyz))


def inputs_figure():
    rows = [[load(FIGS / f"input_{ds}_{v}.png") for ds in rm.DS for v in ("front", "back")]]
    labels = [f"{rm.DS_LABEL[ds]} {v}" for ds in rm.DS for v in ("front", "back")]
    subs = []
    for ds in rm.DS:
        n = {"vggsfm": "138,677 pts", "mvs": "487,451 pts", "mvs_clean": "487,047 pts"}[ds]
        subs += [n, ""]
    grid(6, rows, labels, subs, tile_h=620, out="fig_inputs.jpg")


# ------------------------------------------------------------------ method grids
def method_grid(ds, out, with_input=True, view="preview_front.png"):
    cols, labels, subs, top, bot = 0, [], [], [], []
    if with_input:
        inp = load(FIGS / f"input_{ds}_front.png") if view == "preview_front.png" else load(FIGS / f"input_{ds}_back.png")
        top.append(inp); bot.append("blank"); labels.append("Input points"); subs.append(rm.DS_LABEL[ds] + "\n"); cols += 1
    for m in rm.ORDER:
        r = rm.best(ds, m)
        if r is None:
            continue
        top.append(preview(r, view))
        bot.append(shaded_of(ds, r) if view == "preview_front.png" else None)
        labels.append(rm.SHORT[m] + ("*" if m in rm.EXTRA else ""))
        subs.append("result pending\n" if r == rm.PENDING else f"F@1% {r['f1']:.3f}\nCD {r['cd']:.2f}%")
        cols += 1
    rows = [top, bot] if view == "preview_front.png" else [top]
    grid(cols, rows, labels, subs, row_labels=["textured", "shaded geometry"] if len(rows) == 2 else None,
         tile_h=600, out=out)


def pair_strip(ds, out):
    """One row: each method as [textured | shaded] pair (compact figure for the one-page report)."""
    cols, labels, subs, row = 0, [], [], []
    inp = load(FIGS / f"input_{ds}_front.png")
    row.append(inp.crop(union_box([inp]))); labels.append("Input"); subs.append(f"{rm.DS_LABEL[ds]} points"); cols += 1
    for m in rm.ORDER:
        r = rm.best(ds, m)
        if r is None:
            continue
        if r == rm.PENDING:
            row.append(None)
        else:
            a, b = preview(r, "preview_front.png"), shaded_of(ds, r)
            box = union_box([a, b], pad=6)
            a, b = a.crop(box), b.crop(box)
            pair = Image.new("RGB", (a.width * 2 + 6, a.height), (255, 255, 255))
            pair.paste(a, (0, 0)); pair.paste(b, (a.width + 6, 0))
            row.append(pair)
        labels.append(rm.SHORT[m] + ("*" if m in rm.EXTRA else ""))
        subs.append("pending" if r == rm.PENDING else f"F@1% {r['f1']:.3f}")
        cols += 1
    grid(cols, [row], labels, subs, tile_h=620, gap=8, out=out)


# ------------------------------------------------------------------ studies (before / after)
def study(items, out, tile_h=600, title=None):
    """items: list of (label, sublabel, image or None)."""
    grid(len(items), [[i[2] for i in items]], [i[0] for i in items], [i[1] for i in items], tile_h=tile_h, title=title, out=out)


def crop_upper(img, frac=0.48):
    b = content_box(img)
    h = b[3] - b[1]
    return img.crop((b[0] - 20, b[1] - 10, b[2] + 20, b[1] + int(h * frac)))


def studies():
    V = "vggsfm"
    g = lambda rid: rm.run(V, rid)
    lab = lambda r: f"F@1% {r['f1']:.3f} | NC {r['nc']:.2f}"
    # Poisson ablation (shaded geometry)
    its = []
    for rid, name in (("poisson-v3-r256-a0-t2", "classic (alpha=0), 256^3"), ("poisson-v1-r256-a4-t2", "screened, 256^3"),
                      ("poisson-v2-r384-a4-t2", "screened, 384^3"), ("poisson-v4-r384-a4-watertight", "384^3 watertight")):
        r = g(rid)
        its.append((name, f"CD {r['cd']:.3f}% | F@0.5% {r['f05']:.3f}", shaded_of(V, r)))
    study(its, "fig_poisson_ablation.jpg")
    # texturing: point colours vs photos (upper body)
    a, b = g("poisson-v2-r384-a4-t2"), g("poisson-v2-r384-a4-t2-phototex2")
    study([("point-colour bake", "IDW of k nearest points", crop_upper(preview(a, "preview_front.png"))),
           ("photo projection (ours)", "visibility + masks + gain, 4K", crop_upper(preview(b, "preview_front.png"))),
           ("back: point bake", "", crop_upper(preview(a, "preview_back.png"))),
           ("back: photos", "", crop_upper(preview(b, "preview_back.png")))], "fig_texture.jpg", tile_h=520)
    # MeshAnything input domain
    its = []
    for rid, name in (("meshanything-v2-sample-s1", "raw points"), ("meshanything-v2-mesh-mc7-greedy", "dense mesh -> --mc")):
        r = g(rid)
        its.append((name, f"F@1% {r['f1']:.3f} | {r['faces']} faces", shaded_of(V, r)))
    its.append(("textured", "photo texture v2", preview(g("meshanything-v2-mesh-mc7-greedy-phototex2"), "preview_front.png")))
    study(its, "fig_meshanything.jpg")
    # Point2Mesh normal orientation + MVS outliers
    its = []
    for rid, name in (("point2mesh-v2-paper-defaults", "paper defaults"), ("point2mesh-v3-paper-unoriented", "--unoriented")):
        r = g(rid)
        its.append((name, f"F@1% {r['f1']:.3f}", shaded_of(V, r)))
    rm_mvs = rm.run("mvs", "point2mesh-v3-paper-unoriented")
    its.append(("MVS input (outliers)", f"F@1% {rm_mvs['f1']:.3f}", shaded_of("mvs", rm_mvs)))
    rc = rm.run("mvs_clean", "point2mesh-v3-paper-unoriented")
    its.append(("MVS-clean", f"F@1% {rc['f1']:.3f}", shaded_of("mvs_clean", rc)))
    study(its, "fig_point2mesh.jpg")
    # DHSP: 3D prior (crumpled) -> full pipeline
    p, f, ft = g("dhsp-v1"), g("dhsp-v5-lap1-remesh-optcuts"), g("dhsp-v5-lap1-remesh-optcuts-phototex2")
    study([("3D prior only", lab(p), shaded_of(V, p)), ("full pipeline", lab(f), shaded_of(V, f)),
           ("DHSP's own colour", "2D texture self-prior", preview(f, "preview_front.png")),
           ("photo texture", "ours, on DHSP mesh", preview(ft, "preview_front.png"))], "fig_dhsp.jpg")
    # extra SOTA
    its = []
    for m in ("nksr", "sap", "twodgs"):
        r = rm.best(V, m)
        its.append((rm.SHORT[m], f"F@1% {r['f1']:.3f} | {rm.fmt(r, 'faces')} faces", shaded_of(V, r)))
        its.append((rm.SHORT[m] + " textured", "", preview(r, "preview_front.png")))
    study(its, "fig_extra.jpg", tile_h=560)
    # printable candidates (shaded back views show closed surfaces)
    its = []
    for ds, m in (("vggsfm", "sap"), ("vggsfm", "dhsp"), ("vggsfm", "point2mesh"), ("mvs_clean", "sap")):
        r = rm.best(ds, m)
        its.append((f"{rm.SHORT[m]} ({rm.DS_LABEL[ds]})", "watertight" if r != rm.PENDING and r["watertight"] else "",
                    preview(r, "preview_left.png") if r != rm.PENDING else None))
    study(its, "fig_print.jpg", tile_h=520)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="all")
    a = ap.parse_args()
    FIGS.mkdir(exist_ok=True)
    if a.only in ("all", "inputs"):
        render_inputs()
        inputs_figure()
    if a.only in ("all", "grids"):
        for ds in rm.DS:
            method_grid(ds, f"fig_grid_{ds}.jpg")
        method_grid("vggsfm", "fig_grid_vggsfm_back.jpg", view="preview_back.png")
        pair_strip("vggsfm", "fig_strip_vggsfm.jpg")
    if a.only in ("all", "studies"):
        studies()


if __name__ == "__main__":
    main()
