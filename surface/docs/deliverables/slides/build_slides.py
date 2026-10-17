"""Presentation for CV802 Sub-project 2 (16:9 .pptx with speaker notes), generated from results.json + figs/.

python build_slides.py      (docs env: python-pptx, matplotlib)  ->  slides/CV802_SP2_surface_extraction.pptx
then soffice --headless --convert-to pdf (build_all.sh). Pending results (still training) appear as red "pending".
"""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from PIL import Image  # noqa: E402
from pptx import Presentation  # noqa: E402
from pptx.dml.color import RGBColor  # noqa: E402
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE  # noqa: E402
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN  # noqa: E402
from pptx.util import Emu, Inches, Pt  # noqa: E402

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import resmodel as rm  # noqa: E402

FIGS = HERE.parent / "figs"
EQ = HERE / "eq"
EQ.mkdir(exist_ok=True)
OUT = HERE / "CV802_SP2_surface_extraction.pptx"

NAVY = RGBColor(0x17, 0x24, 0x3A)
INK = RGBColor(0x2B, 0x2F, 0x3A)
GREY = RGBColor(0x6B, 0x72, 0x80)
LIGHT = RGBColor(0xF1, 0xF4, 0xF7)
ACCENT = RGBColor(0x1E, 0x7B, 0x5C)      # same green as the viewer UI
ACCENT2 = RGBColor(0xD9, 0x82, 0x2B)
RED = RGBColor(0xB0, 0x3A, 0x3A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = "Arial"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]
SW, SH = 13.333, 7.5
state = {"n": 0}


# ------------------------------------------------------------------ helpers
def eq_png(name, tex, size=26, color="#17243A"):
    p = EQ / f"{name}.png"
    fig = plt.figure(figsize=(0.01, 0.01))
    fig.text(0, 0, f"${tex}$", fontsize=size, color=color)
    fig.savefig(p, dpi=300, transparent=True, bbox_inches="tight", pad_inches=0.04)
    plt.close(fig)
    return p


def text(slide, x, y, w, h, paras, size=18, color=INK, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
         font=FONT, spacing=1.08, after=6):
    """paras: str or list of str / (str, level) / dict(text, level, size, color, bold). '**x**' marks bold runs."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(0.04)
    tf.margin_top = tf.margin_bottom = Inches(0.02)
    if isinstance(paras, (str, dict)):
        paras = [paras]
    first = True
    for p in paras:
        if isinstance(p, tuple):
            p = {"text": p[0], "level": p[1]}
        elif isinstance(p, str):
            p = {"text": p}
        par = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        lvl = p.get("level", 0)
        par.alignment = p.get("align", align)
        par.line_spacing = spacing
        par.space_after = Pt(p.get("after", after))
        sz = p.get("size", size - 2 * lvl)
        t = p["text"]
        bullet = p.get("bullet", lvl > 0 or p.get("b", False))
        if bullet:
            t = ("•  " if lvl <= 1 else "–  ") + t
            par.level = 0
            if lvl >= 1:
                tf_indent = Inches(0.28 * lvl)
                par._pPr.set("marL", str(int(tf_indent + Inches(0.22))))
                par._pPr.set("indent", str(-int(Inches(0.22))))
        parts = t.split("**")
        for i, part in enumerate(parts):
            if not part:
                continue
            r = par.add_run()
            r.text = part
            r.font.name = p.get("font", font)
            r.font.size = Pt(sz)
            r.font.bold = (i % 2 == 1) or p.get("bold", bold)
            r.font.color.rgb = p.get("color", color) if i % 2 == 0 else p.get("hl", NAVY)
    return tb


def rect(slide, x, y, w, h, fill=LIGHT, line=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08):
    s = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(1.25)
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    s.shadow.inherit = False
    return s


def box(slide, x, y, w, h, title, body=None, fill=LIGHT, tcolor=NAVY, size=15, bsize=12.5, line=None):
    rect(slide, x, y, w, h, fill=fill, line=line)
    paras = [{"text": title, "bold": True, "size": size, "color": tcolor, "after": 2}]
    if body:
        for b in ([body] if isinstance(body, str) else body):
            paras.append({"text": b, "size": bsize, "color": INK if fill != NAVY else WHITE, "after": 1})
    text(slide, x + 0.08, y + 0.05, w - 0.16, h - 0.1, paras, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)


def arrow(slide, x1, y1, x2, y2, color=GREY, width=2.0):
    c = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    c.line.color.rgb = color
    c.line.width = Pt(width)
    ln = c.line._get_or_add_ln()
    from pptx.oxml.ns import qn
    tail = ln.makeelement(qn("a:tailEnd"), {"type": "triangle", "w": "med", "len": "med"})
    ln.append(tail)
    return c


def image(slide, path, x, y, w=None, h=None, align="center"):
    """Place an image inside the box (x, y, w, h) keeping its aspect ratio."""
    path = Path(path)
    iw, ih = Image.open(path).size
    if w is not None and h is not None:
        s = min(w / iw, h / ih)
        pw, ph = iw * s, ih * s
        ox = x + (w - pw) / 2 if align == "center" else (x if align == "left" else x + w - pw)
        oy = y + (h - ph) / 2
    elif w is not None:
        pw, ph, ox, oy = w, w * ih / iw, x, y
    else:
        pw, ph, ox, oy = h * iw / ih, h, x, y
    return slide.shapes.add_picture(str(path), Inches(ox), Inches(oy), Inches(pw), Inches(ph))


def new_slide(title, sub=None, notes="", section=None):
    s = prs.slides.add_slide(BLANK)
    state["n"] += 1
    rect(s, 0, 0, SW, 0.09, fill=ACCENT, shape=MSO_SHAPE.RECTANGLE)
    rect(s, 0.45, 0.42, 0.09, 0.62, fill=ACCENT, shape=MSO_SHAPE.RECTANGLE)
    text(s, 0.65, 0.3, 11.2, 0.6, {"text": title, "size": 30, "bold": True, "color": NAVY})
    if sub:
        text(s, 0.67, 0.86, 11.8, 0.4, {"text": sub, "size": 15, "color": GREY})
    if section:
        text(s, 10.3, 0.2, 2.6, 0.3, {"text": section.upper(), "size": 10, "color": ACCENT, "bold": True},
             align=PP_ALIGN.RIGHT)
    text(s, 0.45, 7.08, 8, 0.3, {"text": "CV802 · Sub-project 2 · Surface Extraction · Anas Khan", "size": 10,
                                 "color": GREY})
    text(s, 11.9, 7.08, 1.0, 0.3, {"text": str(state["n"]), "size": 10, "color": GREY}, align=PP_ALIGN.RIGHT)
    s.notes_slide.notes_text_frame.text = notes.strip()
    return s


def table(slide, x, y, w, rows, col_w=None, size=12, header_fill=NAVY, row_h=0.32, bold_cells=(), red_cells=(),
          first_col_bold=True, zebra=True):
    nr, nc = len(rows), len(rows[0])
    gt = slide.shapes.add_table(nr, nc, Inches(x), Inches(y), Inches(w), Inches(row_h * nr))
    t = gt.table
    if col_w:
        tot = sum(col_w)
        for i, cw in enumerate(col_w):
            t.columns[i].width = Emu(int(Inches(w) * cw / tot))
    for r in range(nr):
        t.rows[r].height = Inches(row_h)
        for c in range(nc):
            cell = t.cell(r, c)
            cell.margin_left = cell.margin_right = Inches(0.05)
            cell.margin_top = cell.margin_bottom = Inches(0.01)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            v = rows[r][c]
            tf = cell.text_frame
            tf.text = ""
            par = tf.paragraphs[0]
            par.alignment = PP_ALIGN.LEFT if c == 0 else PP_ALIGN.CENTER
            run = par.add_run()
            run.text = str(v)
            run.font.name = FONT
            run.font.size = Pt(size)
            cell.fill.solid()
            if r == 0:
                cell.fill.fore_color.rgb = header_fill
                run.font.color.rgb = WHITE
                run.font.bold = True
            else:
                cell.fill.fore_color.rgb = LIGHT if (zebra and r % 2 == 0) else WHITE
                run.font.color.rgb = INK
                run.font.bold = (c == 0 and first_col_bold) or (r, c) in bold_cells
                if (r, c) in red_cells or str(v) == "pending":
                    run.font.color.rgb = RED
                    run.font.italic = True
    return t


def best_cells(rows, cols_hi):
    """(row, col) of the best value per column; cols_hi: {col: True if higher is better}."""
    out = set()
    for c, hi in cols_hi.items():
        vals = []
        for r in range(1, len(rows)):
            try:
                vals.append((float(str(rows[r][c]).rstrip("%")), r))
            except ValueError:
                pass
        if vals:
            b = max(vals)[0] if hi else min(vals)[0]
            out |= {(r, c) for v, r in vals if v == b}
    return out


V = "vggsfm"
g = lambda rid, ds=V: rm.run(ds, rid)
P = lambda ds: rm.best(ds, "poisson")

# ------------------------------------------------------------------ equations
E_POI = eq_png("poisson", r"\left(-\Delta+\beta\,S^{\top}WS\right)\chi\;=\;-\nabla\cdot\mathbf{V}\;+\;\beta\,S^{\top}W\,c", 28)
E_MST = eq_png("mst", r"w_{ij}=1-|\mathbf{n}_i\cdot\mathbf{n}_j|", 22)
E_TEX = eq_png("tex", r"c(t)=\frac{\sum_k w_k^{8}\,g_k\,I_k(\pi_k(\mathbf{x}_t))}{\sum_k w_k^{8}},\qquad "
                      r"w_k=\cos^{4}\theta_k\,\left(\frac{d}{z_k}\right)^{2}", 24)
E_CD = eq_png("cd", r"\mathrm{CD}=\frac{1}{2}\left(\frac{1}{|M|}\sum_{m\in M}\min_{p\in P}\|m-p\|"
                    r"+\frac{1}{|P|}\sum_{p\in P}\min_{m\in M}\|p-m\|\right)", 22)
E_F = eq_png("fscore", r"F_\tau=\frac{2\,\mathrm{Pr}\,\mathrm{Re}}{\mathrm{Pr}+\mathrm{Re}},\quad"
                       r"\mathrm{Pr}=\frac{|\{m:d(m,P)<\tau\}|}{|M|},\quad \mathrm{Re}=\frac{|\{p:d(p,M)<\tau\}|}{|P|}", 20)
E_NC = eq_png("nc", r"\mathrm{NC}=\frac{1}{|M|}\sum_{m}\left|\mathbf{n}_{\mathrm{face}}(m)\cdot\mathbf{n}_{P}(\mathrm{nn}(m))\right|", 20)
E_IER = eq_png("ier", r"\mathrm{IER}(p,q)=\frac{d_{\mathrm{geodesic}}(p,q)}{\|p-q\|}", 24)
E_P2M = eq_png("p2m", r"\mathcal{L}=\mathcal{L}_{\mathrm{Chamfer}}(\mathrm{mesh},P)\;(+\;\mathrm{normal\ term}),\quad"
                      r"\mathrm{mesh}=M_0+\mathrm{CNN}_\theta(z)", 22)

# ------------------------------------------------------------------ 1 title
s = prs.slides.add_slide(BLANK)
state["n"] += 1
rect(s, 0, 0, SW, SH, fill=NAVY, shape=MSO_SHAPE.RECTANGLE)
rect(s, 0, 4.55, SW, 2.95, fill=WHITE, shape=MSO_SHAPE.RECTANGLE)
image(s, FIGS / "fig_strip_vggsfm.jpg", 0.3, 4.62, 12.73, 2.8)
text(s, 0.8, 0.85, 11.8, 0.4, {"text": "CV802 ADVANCED 3D COMPUTER VISION · SUB-PROJECT 2: SURFACE EXTRACTION",
                               "size": 14, "bold": True, "color": RGBColor(0x8F, 0xD9, 0xBC)})
text(s, 0.8, 1.35, 11.8, 1.6, {"text": "From Coloured Points to Printable Textured Meshes", "size": 42, "bold": True,
                               "color": WHITE})
text(s, 0.8, 2.95, 11.8, 0.9, {"text": "Eight surface-reconstruction methods, one shared pipeline, our own screened "
                               "Poisson and photo texturing, and a mesh viewer", "size": 19,
                               "color": RGBColor(0xD5, 0xDC, 0xE6)})
text(s, 0.8, 3.9, 11.8, 0.5, {"text": "Anas Khan  ·  MBZUAI", "size": 18, "bold": True, "color": WHITE})
s.notes_slide.notes_text_frame.text = (
    "Hello, I am Anas. Sub-project 2 takes the coloured point cloud from Sub-project 1 and turns it into a textured "
    "mesh. The strip at the bottom is the whole story: the input points on the left, then the best mesh of each of the "
    "eight methods, each shown textured and as plain shaded geometry. In the next minutes: the task, our pipeline, "
    "the methods and what we had to change to make them work on a real scan, results on three inputs, the viewer and "
    "3D printing.")

# ------------------------------------------------------------------ 2 task
s = new_slide("The task", "Week-5 brief (slides 5-7): 3D points with colour  ->  textured mesh (.obj), bonus for a mesh viewer",
              section="Task", notes="""
The brief from the Week-5 lab slides: the input is the coloured point cloud from Sub-project 1 (slide 5), the output is
a textured 3D mesh in .obj format, with a bonus for a mesh viewer (slide 6). Slide 7 lists five example methods plus
'your own novel methods'. We implemented all five: Poisson from scratch because the slide says do not use the API,
then IER, Point2Mesh, MeshAnything and DHSP using the official code. As the slide notes, the first four give shape
only, so texture is our job: we built a photo-projection texturer. We also added three recent methods, NKSR, Shape As
Points and 2D Gaussian Splatting, and we deliver the viewer and printable meshes.""")
image(s, FIGS / "input_vggsfm_front.png", 0.55, 1.45, 2.6, 5.4)
text(s, 3.05, 3.6, 0.6, 0.6, {"text": "→", "size": 40, "color": ACCENT, "bold": True})
image(s, Path(g("poisson-v2-r384-a4-t2-phototex2")["dir"]) / "preview_front.png", 3.55, 1.45, 2.6, 5.4)
text(s, 0.6, 6.7, 5.6, 0.35, [{"text": "input: 138,677 coloured points   →   output: textured .obj", "size": 12,
                                "color": GREY, "align": PP_ALIGN.CENTER}])
rows = [["Method on slide 7", "What we did", "Colour"],
        ["Poisson (DO NOT USE API)", "own implementation, GPU", "our texturing"],
        ["IER (ECCV'20)", "official code + weights", "our texturing"],
        ["Point2Mesh (SIGGRAPH'20)", "official code", "our texturing"],
        ["MeshAnything (2024)", "official V1 / V2 + weights", "our texturing"],
        ["DHSP (ICCV'21)", "official code, full pipeline", "own (2D prior)"],
        ["Your own novel methods", "photo texturing, DHSP fix, viewer", "-"],
        ["Extra (beyond slides)", "NKSR, SAP, 2DGS", "our texturing"]]
table(s, 6.55, 1.5, 6.35, rows, col_w=[2.5, 2.6, 1.4], size=12.5, row_h=0.42)
text(s, 6.55, 5.05, 6.35, 1.8, [
    {"text": "**Deliverables (slide 8):** presentation · code · one-page document", "size": 14, "b": True},
    {"text": "**Bonus:** browser mesh viewer, side-by-side, CPU only", "size": 14, "b": True},
    {"text": "**Our goal:** best quality, 3D-printable", "size": 14, "b": True}])

# ------------------------------------------------------------------ 3 inputs
s = new_slide("Three input clouds of the same person", "All from Sub-project 1; every method runs on all three",
              section="Inputs", notes="""
We use the light-shirt capture in three versions. The main input is VGGSfM: 139 thousand points, already cleaned in
Sub-project 1 by projecting the points into the person masks. The second is the COLMAP MVS cloud: 3.5 times denser,
with normals from PatchMatch, but with silhouette streaks and floating outliers, you can see the spray around the
legs and head. The third is the same MVS cloud with 404 floating points removed by our cleanup script, which keeps
the legs intact. Same pipeline and metrics for all three, so differences come from the input alone.""")
image(s, FIGS / "fig_inputs.jpg", 0.5, 1.4, 12.3, 4.25)
rows = [["Input", "Points", "Normals", "Character"],
        ["VGGSfM (main)", "138,677", "ours (PCA + MST)", "clean, sparser, mask-cleaned"],
        ["COLMAP MVS", "487,451", "COLMAP PatchMatch", "dense; streaks + floating outliers"],
        ["MVS-clean", "487,047", "COLMAP PatchMatch", "404 floaters removed (clean_cloud.py)"]]
table(s, 0.9, 5.7, 11.5, rows, col_w=[2.2, 1.3, 2.4, 4.6], size=12.5, row_h=0.33)

# ------------------------------------------------------------------ 4 pipeline
s = new_slide("One pipeline for every method", "Methods only produce geometry; everything after it is shared and identical",
              section="System", notes="""
This is the system. Every method gets the same input and writes one file, geometry.ply. A shared finalizer then does
everything else identically for all methods: cleans the mesh, builds a UV atlas with xatlas, textures it, computes
the metrics against the input cloud, renders the same camera views, and writes a manifest. Because of that the
comparison is fair. Shape-only methods are re-textured from the photos by our photo-projection step. The manifest is
what the viewer reads, the 3D-print export makes STL files, and packaging zips viewer-sized copies for GitHub.
Everything ran on one RTX 5000 Ada with 32 GB through Slurm, as a restartable job queue in tmux; in total about 110
finished runs over three inputs.""")
y0 = 1.75
box(s, 0.45, y0 + 0.55, 1.75, 1.3, "Input cloud", ["xyz + rgb", "(+ normals)"])
arrow(s, 2.22, y0 + 1.2, 2.55, y0 + 1.2)
box(s, 2.57, y0 + 0.55, 1.75, 1.3, "Normals", ["PCA k=24", "MST orientation"])
arrow(s, 4.34, y0 + 1.2, 4.67, y0 + 1.2)
rect(s, 4.69, y0 - 0.25, 2.55, 2.9, fill=WHITE, line=ACCENT)
text(s, 4.75, y0 - 0.2, 2.45, 0.35, {"text": "8 methods", "size": 15, "bold": True, "color": ACCENT},
     align=PP_ALIGN.CENTER)
for i, m in enumerate(rm.ORDER):
    text(s, 4.8, y0 + 0.17 + i * 0.29, 2.4, 0.3, {"text": rm.SHORT[m] + (" *" if m in rm.EXTRA else ""), "size": 12.5,
                                                  "color": INK}, align=PP_ALIGN.CENTER)
arrow(s, 7.26, y0 + 1.2, 7.6, y0 + 1.2)
rect(s, 7.62, y0 - 0.25, 3.0, 2.9, fill=NAVY)
text(s, 7.7, y0 - 0.17, 2.85, 2.8, [
    {"text": "Shared finalizer", "size": 16, "bold": True, "color": WHITE, "after": 6},
    {"text": "clean mesh (degenerate faces)", "size": 12.5, "color": WHITE, "b": True, "after": 2},
    {"text": "UV atlas (xatlas, 4096²)", "size": 12.5, "color": WHITE, "b": True, "after": 2},
    {"text": "texture: photos / points / own", "size": 12.5, "color": WHITE, "b": True, "after": 2},
    {"text": "metrics vs input cloud", "size": 12.5, "color": WHITE, "b": True, "after": 2},
    {"text": "same-camera renders", "size": 12.5, "color": WHITE, "b": True, "after": 2},
    {"text": "manifest.json (last)", "size": 12.5, "color": WHITE, "b": True, "after": 2}])
for i, (t, b) in enumerate((("Mesh viewer", "three.js, side by side"), ("3D print", "180 mm STL + checks"),
                            ("GitHub bundle", "viewer-sized zips"))):
    yy = y0 - 0.25 + i * 1.0
    arrow(s, 10.64, y0 + 1.2, 10.95, yy + 0.4)
    box(s, 10.97, yy, 1.95, 0.85, t, b, fill=LIGHT, size=13.5, bsize=11)
text(s, 0.5, 5.1, 12.3, 1.9, [
    {"text": "**Contract:** run.sh <run_dir> → geometry.ply + method_info.json + progress.json;  finalize.sh <run_dir> → "
             "mesh.obj / .mtl / texture, metrics.json, previews, manifest.json", "size": 13.5, "b": True},
    {"text": "**Compute:** one RTX 5000 Ada (32 GB) through Slurm; restartable job queue in tmux with live GPU monitor; "
             "nothing runs on the login node", "size": 13.5, "b": True},
    {"text": "**Scale:** ≈110 finished runs over 3 inputs (ablations, seeds, texture variants); best run per method "
             "selected automatically (select_best.py)", "size": 13.5, "b": True}])

# ------------------------------------------------------------------ 5 poisson
p2 = g("poisson-v2-r384-a4-t2")
s = new_slide("Screened Poisson, implemented from scratch", "No Poisson / marching-cubes library: normals, solver and "
              "mesh extraction are our own code (PyTorch tensors on the GPU)", section="Method 1", notes=f"""
Poisson reconstruction looks for an indicator function chi that is 1 inside the person and 0 outside. Its gradient
should equal the oriented normal field, so we splat the inward normals into a vector field V and take the divergence:
that gives a Poisson equation, minus Laplacian chi equals minus divergence of V. The screened version from 2013 adds a
term that pins chi to the iso-value at the sample points, which keeps fine detail and stops over-smoothing.
Step one, normals: PCA on 24 neighbours gives a direction but not a sign; we fix the signs by walking a minimum
spanning tree over the neighbour graph with edge cost one minus the absolute dot product, so flips propagate along
smooth surfaces first, then flip each component outward using a local centroid vote. Step two, splat. Step three,
solve the sparse system with Jacobi-preconditioned conjugate gradients on the GPU, coarse to fine on 96, 192, 384 cube
grids, each level warm-starting the next. Step four, the iso-value is the weighted mean of chi at the samples and we
extract the surface with our own marching tetrahedra, which is crack-free. Finally we trim faces more than two voxels
from any sample, because Poisson always closes the surface. Result: {rm.fmt(p2, 'faces')} faces in {p2['seconds']:.0f}
seconds, Chamfer {p2['cd']:.3f} percent of the diagonal, F-score {p2['f1']:.3f}. We verified the solver on a sphere.""")
steps = [("1  Oriented normals", "PCA (k = 24) gives ±n; signs propagated along a minimum spanning tree, then each "
          "component flipped outward (local-centroid vote)"),
         ("2  Splat", "inward normals × local spacing² → vector field V on a 384³ grid ([1,2,1] smoothing ≈ B-spline)"),
         ("3  Solve", "screened Poisson system, Jacobi-preconditioned CG on the GPU, coarse-to-fine 96³ → 192³ → 384³"),
         ("4  Extract", "iso = weighted mean of χ at the samples; own marching tetrahedra (Kuhn split, welded "
          "vertices → crack-free, consistently oriented)"),
         ("5  Trim", "drop faces > 2 voxels from every sample, keep large components (watertight variant: no trim)")]
for i, (t, b) in enumerate(steps):
    yy = 1.45 + i * 0.93
    rect(s, 0.5, yy, 6.3, 0.83, fill=LIGHT)
    text(s, 0.62, yy + 0.04, 6.1, 0.8, [{"text": t, "size": 14.5, "bold": True, "color": ACCENT, "after": 1},
                                        {"text": b, "size": 11.5, "color": INK}])
image(s, E_POI, 7.1, 1.5, 5.8, 0.75)
text(s, 7.1, 2.3, 5.8, 1.5, [
    {"text": "χ: indicator (1 inside, 0 outside);  ∇χ ≈ V (normals)", "size": 12.5, "b": True, "after": 2},
    {"text": "S: trilinear sampling of χ at the points;  c: iso-value", "size": 12.5, "b": True, "after": 2},
    {"text": "β (α = 4): screening weight;  α = 0 → classic 2006 Poisson", "size": 12.5, "b": True, "after": 2},
    {"text": "MST edge cost:", "size": 12.5, "b": True}])
image(s, E_MST, 9.0, 3.42, 2.4, 0.4, align="left")
rows = [["Run (VGGSfM)", "Faces", "CD %", "F@1%", "Time"],
        ["384³, screened, trimmed", rm.fmt(p2, "faces"), f"{p2['cd']:.3f}", f"{p2['f1']:.3f}", rm.fmt(p2, "seconds")],
        ["MVS-clean, 384³", rm.fmt(g("poisson-v2-r384-a4-t2", "mvs_clean"), "faces"),
         f"{g('poisson-v2-r384-a4-t2', 'mvs_clean')['cd']:.3f}", f"{g('poisson-v2-r384-a4-t2', 'mvs_clean')['f1']:.3f}",
         rm.fmt(g("poisson-v2-r384-a4-t2", "mvs_clean"), "seconds")]]
table(s, 7.1, 4.05, 5.8, rows, col_w=[2.6, 0.9, 0.8, 0.8, 0.7], size=12, row_h=0.36)
text(s, 7.1, 5.3, 5.8, 1.6, [
    {"text": "**Deviation from the paper:** dense grid + cascadic CG instead of an adaptive octree + multigrid; "
             "marching tetrahedra instead of marching cubes", "size": 12, "b": True},
    {"text": "**Sanity check:** sphere radius error 0.0007 (selftest.py)", "size": 12, "b": True}])

# ------------------------------------------------------------------ 6 poisson ablation
a0, a1, a2, a4 = (g(x) for x in ("poisson-v3-r256-a0-t2", "poisson-v1-r256-a4-t2", "poisson-v2-r384-a4-t2",
                                 "poisson-v4-r384-a4-watertight"))
s = new_slide("Poisson: what each design choice buys", "Ablation on the VGGSfM cloud (shaded geometry)",
              section="Method 1", notes=f"""
Four Poisson variants. Classic Poisson without screening, alpha zero, is the smoothest: highest normal consistency but
it loses detail and drifts off the points, F at half a percent {a0['f05']:.3f}. Adding screening at the same 256 grid
pulls the surface onto the samples, {a1['f05']:.3f}. Going to 384 cubed adds detail and is our best, {a2['f05']:.3f}.
The watertight variant skips trimming: almost the same accuracy, and it is closed, so it can be 3D printed. The
trade-off you see: more detail also reproduces the noise of the SfM points, the bumpy texture on the legs.""")
image(s, FIGS / "fig_poisson_ablation.jpg", 0.4, 1.35, 7.6, 5.6)
rows = [["Variant", "CD %", "F@0.5%", "NC", "Faces"]]
for r, n in ((a0, "classic, 256³"), (a1, "screened, 256³"), (a2, "screened, 384³"), (a4, "384³ watertight")):
    rows.append([n, f"{r['cd']:.3f}", f"{r['f05']:.3f}", f"{r['nc']:.2f}", rm.fmt(r, "faces")])
table(s, 8.25, 1.6, 4.7, rows, col_w=[1.9, 0.8, 0.9, 0.6, 0.8], size=12.5, row_h=0.4,
      bold_cells=best_cells(rows, {1: False, 2: True, 3: True}))
text(s, 8.25, 3.85, 4.7, 3.0, [
    {"text": "**Screening** pins χ to the samples → +0.04 F@0.5%", "size": 13.5, "b": True},
    {"text": "**Finer grid** → more detail, also more scan noise", "size": 13.5, "b": True},
    {"text": "**No trimming** → closed surface for printing at almost no cost", "size": 13.5, "b": True},
    {"text": "**NC** rewards smoothness, CD/F reward closeness: read them together", "size": 13.5, "b": True}])

# ------------------------------------------------------------------ 7 IER + MeshAnything
ier, ma_raw, ma = rm.best(V, "ier"), g("meshanything-v2-greedy"), g("meshanything-v2-mesh-mc7-greedy")
ma_s1 = g("meshanything-v2-sample-s1")  # best raw-point run (sampling, seed 1)
s = new_slide("Learned priors: IER and MeshAnything", "Pretrained networks only work inside their training domain",
              section="Methods 2-4", notes=f"""
IER, ECCV 2020: it proposes candidate triangles from k nearest neighbours and a pretrained network classifies each by
the intrinsic-extrinsic ratio, geodesic over Euclidean distance between the vertices. Near one means the triangle lies
on the surface, large means it jumps across a gap, for example between the arm and the chest. A greedy step keeps a
manifold set. It was trained on 12 to 13 thousand points per shape, so we farthest-point sample 12,500 points: F
{ier['f1']:.3f}. Its red faces in the renders show the triangles are not consistently oriented, which is why our photo
texturing uses a two-sided mode for it.
MeshAnything is an autoregressive transformer that writes an artist-style low-poly mesh face by face. On our raw points
it failed, F {ma_raw['f1']:.2f} greedy and at best {ma_s1['f1']:.2f} with sampling, because it was trained on points
sampled from clean meshes. The authors recommend passing a dense mesh through their marching-cubes path; we fed our own
watertight Poisson mesh and got {ma['f1']:.3f} with only {ma['faces']} faces.""")
text(s, 0.5, 1.4, 6.1, 0.4, {"text": "IER meshing (ECCV'20)", "size": 19, "bold": True, "color": ACCENT})
text(s, 0.5, 1.85, 6.1, 2.2, [
    {"text": "kNN candidate triangles → pretrained network scores each by", "size": 13.5, "b": True},
    {"text": "≈1 on the surface, ≫1 across gaps (arm ↔ chest) → greedy manifold selection", "size": 13.5, "b": True}])
image(s, E_IER, 1.0, 2.62, 4.6, 0.6)
text(s, 0.5, 3.4, 6.1, 1.3, [
    {"text": f"**Our fix:** FPS to the training density (12.5k pts, unit diagonal) → F@1% {ier['f1']:.3f}",
     "size": 13.5, "b": True},
    {"text": "**Caveat:** inconsistent winding (red faces), holes → two-sided photo texturing", "size": 13.5, "b": True}])
text(s, 6.9, 1.4, 6.0, 0.4, {"text": "MeshAnything V2 (2024)", "size": 19, "bold": True, "color": ACCENT})
text(s, 6.9, 1.85, 6.0, 1.3, [
    {"text": "autoregressive transformer generates an artist mesh face by face (≤1.6k faces)", "size": 13.5, "b": True},
    {"text": f"raw points: F@1% ≤ {ma_s1['f1']:.2f} → our Poisson mesh via the authors' --mc path: **{ma['f1']:.3f}**",
     "size": 13.5, "b": True}])
image(s, FIGS / "fig_meshanything.jpg", 7.3, 3.2, 5.3, 3.75)
rows = [["MeshAnything run", "F@1%", "faces"],
        ["V1, raw points", f"{g('meshanything-v1-greedy')['f1']:.3f}", g("meshanything-v1-greedy")["faces"]],
        ["V2, raw points (greedy)", f"{ma_raw['f1']:.3f}", ma_raw["faces"]],
        ["V2, raw points (sampled)", f"{ma_s1['f1']:.3f}", ma_s1["faces"]],
        ["V1, mesh --mc", f"{g('meshanything-v1-mesh-mc-greedy')['f1']:.3f}", g("meshanything-v1-mesh-mc-greedy")["faces"]],
        ["V2, mesh --mc 7", f"{ma['f1']:.3f}", ma["faces"]],
        ["V2, mesh --mc 8", f"{g('meshanything-v2-mesh-mc8-greedy')['f1']:.3f}", g("meshanything-v2-mesh-mc8-greedy")["faces"]]]
table(s, 0.6, 4.6, 5.6, rows, col_w=[2.8, 1.2, 1.2], size=12, row_h=0.34, bold_cells={(5, 1)})

# ------------------------------------------------------------------ 8 point2mesh
p_def, p_un = g("point2mesh-v2-paper-defaults"), g("point2mesh-v3-paper-unoriented")
s = new_slide("Self-prior: Point2Mesh", "A randomly initialised CNN, optimised on this one cloud, deforms a convex hull",
              section="Methods 2-4", notes=f"""
Point2Mesh needs no training data. Start from the convex hull of the points, simplified by Manifold to 2,000 faces. A
MeshCNN with random weights predicts vertex displacements and is optimised for one shape only, with a Chamfer loss to
the points plus a normal term; the network's own bias towards smooth, self-similar displacements is the 'self-prior'.
Every so often the mesh is subdivided and re-made manifold, so it shrink-wraps the person. With paper defaults the
normal term pulled the surface the wrong way where our normals point inward, F {p_def['f1']:.3f}. The paper's
unoriented option, which only compares directions up to sign, fixed that: {p_un['f1']:.3f}. It is watertight by
construction, so printable, but smooth and low detail. On the raw MVS cloud the floating outliers pull membranes
out of the body; after removing them it partly recovers. The red faces mark folded triangles.""")
image(s, FIGS / "fig_point2mesh.jpg", 0.4, 1.35, 7.8, 5.6)
rows = [["Run", "Input", "F@1%", "CD %"],
        ["paper defaults", "VGGSfM", f"{p_def['f1']:.3f}", f"{p_def['cd']:.2f}"],
        ["--unoriented", "VGGSfM", f"{p_un['f1']:.3f}", f"{p_un['cd']:.2f}"],
        ["--unoriented", "MVS", f"{g('point2mesh-v3-paper-unoriented', 'mvs')['f1']:.3f}",
         f"{g('point2mesh-v3-paper-unoriented', 'mvs')['cd']:.2f}"],
        ["--unoriented", "MVS-clean", f"{g('point2mesh-v3-paper-unoriented', 'mvs_clean')['f1']:.3f}",
         f"{g('point2mesh-v3-paper-unoriented', 'mvs_clean')['cd']:.2f}"]]
table(s, 8.4, 1.6, 4.5, rows, col_w=[1.6, 1.2, 0.8, 0.8], size=12.5, row_h=0.38, bold_cells={(2, 2), (2, 3)})
text(s, 8.4, 3.75, 4.5, 3.2, [
    {"text": "loss: Chamfer(mesh, points) + normal term; mesh = hull + CNN(θ) displacements", "size": 13, "b": True},
    {"text": "hull → Manifold (2k faces) → CNN displacements → subdivide + re-manifold", "size": 13, "b": True},
    {"text": "**Normal orientation** matters: unoriented loss +0.20 F", "size": 13, "b": True},
    {"text": "**Outliers** break shrink-wrapping (MVS)", "size": 13, "b": True},
    {"text": "**Watertight** by construction → printable", "size": 13, "b": True}])

# ------------------------------------------------------------------ 9 DHSP
dp, df = g("dhsp-v1"), g("dhsp-v5-lap1-remesh-optcuts")
s = new_slide("DHSP: getting the full hybrid pipeline to run", "Deep Hybrid Self-Prior (ICCV'21): 3D mesh prior + 2D "
              "image priors, recovers shape and colour", section="Method 5", notes=f"""
DHSP extends Point2Mesh with 2D priors. Its README pipeline: a 3D self-prior mesh, then flatten it to a UV map with
OptCuts, project the geometry into a 2D 'geometry image' and complete it with a deep image prior, project back, refine
in 3D again, and finally complete a colour texture with a second 2D image prior. So it is the only listed method that
predicts colour itself.
The problem: the 3D prior alone already scores F {dp['f1']:.3f}, but it is crumpled, about half the neighbouring faces
fold, normal consistency {dp['nc']:.2f}. OptCuts never converged on that surface, we stopped it after 15 hours, and with
xatlas instead the 2D priors produced seam artifacts. Our fix: re-mesh the prior first, Manifold plus simplification to
3,000 faces, before OptCuts, and 6,000 for the refined mesh. Then OptCuts converges in seconds and the complete
pipeline runs. The final mesh is clean, normal consistency {df['nc']:.2f}, watertight, with DHSP's own colour; it loses
some F-score, {df['f1']:.3f}, because it is coarser. {"The MVS versions are still training." if rm.pending_list() else
"On the MVS inputs the refined surface has genus 2, because the arms touch the body, so OptCuts cannot cut it into a disk for the final texture atlas; there we fall back to xatlas on the same clean re-meshed surface. And honestly, on MVS the full pipeline is not better than its 3D prior: the 2D geometry prior turns MVS outliers into fins."}""")
flow = ["3D prior", "re-mesh\n(ours)", "OptCuts\nUV", "2D geometry\nprior", "back-project\n+ 3D refine",
        "2D texture\nprior"]
for i, t in enumerate(flow):
    xx = 0.5 + i * 2.1
    rect(s, xx, 1.45, 1.8, 0.85, fill=ACCENT2 if "ours" in t else (NAVY if i in (0, 4) else LIGHT))
    text(s, xx, 1.45, 1.8, 0.85, {"text": t, "size": 13, "bold": True,
                                  "color": WHITE if (i in (0, 4) or "ours" in t) else NAVY},
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    if i < len(flow) - 1:
        arrow(s, xx + 1.82, 1.87, xx + 2.08, 1.87)
image(s, FIGS / "fig_dhsp.jpg", 0.4, 2.5, 7.4, 4.45)
rows = [["DHSP run (VGGSfM)", "F@1%", "NC", "WT"],
        ["v1 3D prior only", f"{dp['f1']:.3f}", f"{dp['nc']:.2f}", "yes"],
        ["v2 + xatlas 2D texture", f"{g('dhsp-v2-texture2d')['f1']:.3f}", f"{g('dhsp-v2-texture2d')['nc']:.2f}", "no"],
        ["v4 re-mesh + OptCuts", f"{g('dhsp-v4-remesh-optcuts')['f1']:.3f}", f"{g('dhsp-v4-remesh-optcuts')['nc']:.2f}",
         "yes"],
        ["v5 + Laplacian 1", f"{df['f1']:.3f}", f"{df['nc']:.2f}", "yes"]]
table(s, 8.0, 2.65, 4.9, rows, col_w=[2.6, 0.8, 0.7, 0.6], size=12, row_h=0.38, bold_cells={(4, 2), (3, 2)})
mv, mc = rm.best("mvs", "dhsp"), rm.best("mvs_clean", "dhsp")
text(s, 8.0, 4.7, 4.9, 2.3, [
    {"text": "**Crumpled prior:** F-score high, surface folded (NC 0.65)", "size": 13, "b": True},
    {"text": "**OptCuts:** no convergence in 15 h → converges in seconds after re-meshing", "size": 13, "b": True},
    {"text": "**MVS / MVS-clean:** F@1% " + rm.fmt(mv, "f1", pend="pending") + " / " + rm.fmt(mc, "f1", pend="pending")
     + ("" if rm.PENDING in (mv, mc) else " — below the 3D prior (0.98): MVS outliers become fins; final atlas by "
        "xatlas (genus-2 surface)"), "size": 13, "b": True}])

# ------------------------------------------------------------------ 10 extra
nk, sp, tg = rm.best(V, "nksr"), rm.best(V, "sap"), rm.best(V, "twodgs")
s = new_slide("Beyond the list: three recent methods", "Added to see where current methods stand on the same input",
              section="Extra", notes=f"""
Three recent methods. NKSR, CVPR 2023, from NVIDIA: a pretrained neural kernel field built for noisy real scans. It is
the most accurate on the dense MVS clouds and runs in seconds, but its mesh is open and has non-manifold edges, so it is
not printable. Shape As Points, NeurIPS 2021, makes Poisson differentiable: it optimises the oriented points
themselves through a spectral Poisson solver, coarse to fine; the result is watertight and smooth, our cleanest
printable mesh. 2D Gaussian Splatting, SIGGRAPH 2024, is different: it uses the photos, not only the points. Flat
Gaussian discs are optimised to re-render the masked photos, initialised from our point cloud, and the mesh comes from
fusing the rendered depth maps. It gives the sharpest look, F {tg['f1']:.3f}, but it is open at the boundary.""")
image(s, FIGS / "fig_extra.jpg", 0.4, 1.35, 8.3, 4.45)
rows = [["Method", "Idea", "F@1%", "Time", "WT"],
        ["NKSR (CVPR'23)", "pretrained kernel field", f"{nk['f1']:.3f}", rm.fmt(nk, "seconds"), "no"],
        ["SAP (NeurIPS'21)", "differentiable Poisson", f"{sp['f1']:.3f}", rm.fmt(sp, "seconds"), "yes"],
        ["2DGS (SIGGRAPH'24)", "surfels fit to photos", f"{tg['f1']:.3f}", rm.fmt(tg, "seconds"), "no"]]
table(s, 0.5, 5.9, 8.1, rows, col_w=[2.2, 2.7, 0.9, 0.9, 0.6], size=12.5, row_h=0.3)
text(s, 8.95, 1.45, 4.0, 5.5, [
    {"text": "NKSR", "size": 16, "bold": True, "color": ACCENT, "after": 1},
    {"text": f"best on dense MVS (CD {rm.best('mvs_clean', 'nksr')['cd']:.2f}%), seconds; open, non-manifold", "size": 12.5},
    {"text": "Shape As Points", "size": 16, "bold": True, "color": ACCENT, "after": 1},
    {"text": "optimises oriented points through a spectral Poisson solver (32³ → 256³); watertight", "size": 12.5},
    {"text": "2D Gaussian Splatting", "size": 16, "bold": True, "color": ACCENT, "after": 1},
    {"text": "surfels fitted to the masked photos, TSDF fusion of rendered depth; sharpest appearance, uses images "
             "rather than only points", "size": 12.5}])

# ------------------------------------------------------------------ 11 texture
pt, ptx = g("poisson-v2-r384-a4-t2"), g("poisson-v2-r384-a4-t2-phototex2")
s = new_slide("Texture: projecting the photos onto the mesh", "Our own multi-view texturing for every shape-only method",
              section="Our method", notes="""
The slides say the first four methods give shape only and we must get texture ourselves. The simple baseline colours
each texel from the nearest input points: blurry, because the points are sparse and noisy. Our method projects the
original photos instead. Every texel of the UV atlas is rasterised to a 3D point with a normal. We project it into
every camera from Sub-project 1, and keep the view only if the point is in front, inside the image, inside the person
mask, facing the camera, and visible in a z-buffer of the mesh, so occluded surfaces such as the chest behind the
crossed arms do not get arm colours. The visible views are blended with weights that favour frontal and close views,
cos to the fourth times d over z squared, raised to the eighth power so the best view dominates and the result stays
sharp. A per-photo gain balances exposure. Texels no photo sees keep the point colour. The lettering on the shirt
becomes readable. Note PSNR at the points goes down slightly, because the reference is the blurry point colours.""")
image(s, FIGS / "fig_texture.jpg", 0.4, 1.35, 8.0, 3.65)
image(s, E_TEX, 0.6, 5.2, 7.6, 0.85)
text(s, 0.6, 6.15, 7.8, 0.8, {"text": "I_k: photo k, π_k: its COLMAP projection, θ_k: angle normal ↔ view, z_k: depth, "
                                      "g_k: exposure gain, d: scene diagonal", "size": 11.5, "color": GREY})
text(s, 8.7, 1.45, 4.25, 5.5, [
    {"text": "Per texel, per photo:", "size": 15, "bold": True, "color": ACCENT, "after": 4},
    {"text": "in front of the camera, inside the image", "size": 13, "b": True},
    {"text": "inside the person mask", "size": 13, "b": True},
    {"text": "faces the camera (cos θ > 0.25)", "size": 13, "b": True},
    {"text": "passes the z-buffer test (no occluded colour)", "size": 13, "b": True},
    {"text": "Blend:", "size": 15, "bold": True, "color": ACCENT, "after": 4},
    {"text": "frontal + close views win; ^8 keeps it sharp", "size": 13, "b": True},
    {"text": "per-photo exposure gain vs point colours", "size": 13, "b": True},
    {"text": "4096² texture; unseen texels → point colour", "size": 13, "b": True},
    {"text": "DHSP keeps its own colour; NKSR/2DGS also get photos", "size": 13, "b": True}])

# ------------------------------------------------------------------ 12 results table
s = new_slide("Results: best run of every method on all three inputs",
              "Measured against each input cloud (no ground-truth surface exists)", section="Results", notes="""
The main table. Chamfer distance in percent of the bounding-box diagonal, lower is better; F-score at one percent of the
diagonal, higher is better; normal consistency; watertight. On the VGGSfM input our Poisson has the best Chamfer and
F-score, tied with IER, NKSR and SAP at about 0.998 to 0.999. On the dense MVS clouds NKSR is best with Chamfer 0.08
percent. Low-poly methods, MeshAnything and DHSP, lose some F-score by construction because a 1,400 or 6,000 face
mesh cannot follow every point. Point2Mesh is the weakest and fails on raw MVS. Red cells are still training.""")
rows = [["Method", "Faces", "CD % ↓", "F@1% ↑", "NC ↑", "CD % ↓", "F@1% ↑", "CD % ↓", "F@1% ↑", "WT"]]
for m in rm.ORDER:
    rv = rm.best(V, m)
    row = [rm.SHORT[m] + (" *" if m in rm.EXTRA else ""), rm.fmt(rv, "faces")]
    row += [rm.fmt(rv, "cd"), rm.fmt(rv, "f1"), rm.fmt(rv, "nc", 2)]
    for ds in ("mvs", "mvs_clean"):
        r = rm.best(ds, m)
        row += [rm.fmt(r, "cd", pend="pending"), rm.fmt(r, "f1", pend="pending")]
    row.append("✓" if rv not in (None, rm.PENDING) and rv["watertight"] else "")
    rows.append(row)
hdr = rect(s, 0.5, 1.4, 12.35, 0.38, fill=WHITE)
for x0, w0, t in ((2.95, 4.5, "VGGSfM (main)"), (7.45, 2.3, "MVS"), (9.75, 2.3, "MVS-clean")):
    text(s, x0, 1.42, w0, 0.35, {"text": t, "size": 14, "bold": True, "color": ACCENT}, align=PP_ALIGN.CENTER)
table(s, 0.5, 1.8, 12.35, rows, col_w=[2.3, 1.0, 1.15, 1.15, 0.95, 1.15, 1.15, 1.15, 1.15, 0.6], size=13.5, row_h=0.47,
      bold_cells=best_cells(rows, {2: False, 3: True, 4: True, 5: False, 6: True, 7: False, 8: True}))
text(s, 0.5, 6.15, 12.35, 0.8, [
    {"text": "CD: Chamfer-L1 in % of the bbox diagonal · F@1%: F-score at 1% of the diagonal · NC: normal consistency · "
             "WT: watertight (VGGSfM mesh) · * beyond the course list" + (" · pending: still training"
                                                                            if rm.pending_list() else ""),
     "size": 11.5, "color": GREY}])

# ------------------------------------------------------------------ 13 qualitative
s = new_slide("Qualitative comparison (VGGSfM)", "Top: textured · bottom: shaded geometry · red = back-facing "
              "(inconsistently oriented) faces", section="Results", notes="""
The same meshes as pictures, because the numbers hide a lot. Look at the shaded row. Poisson and NKSR follow every
bump of the noisy points. IER has red triangles everywhere: they are flipped. Point2Mesh is smooth but has folded
regions. MeshAnything is an artist-style low-poly mesh. DHSP after our fix is clean and closed. SAP is the smoothest
closed surface. 2DGS has the most recognisable face and the cleanest shirt edges because it uses the photos.""")
image(s, FIGS / "fig_grid_vggsfm.jpg", 0.4, 1.3, 12.5, 5.7)

# ------------------------------------------------------------------ 14 mvs
s = new_slide("Denser but noisier: the MVS clouds", "MVS-clean (404 floaters removed); DHSP pending while training"
              if rm.pending_list() else "MVS-clean (404 floaters removed)", section="Results", notes="""
The MVS cloud is 3.5 times denser, so methods that follow the points closely, NKSR, Poisson, IER, get even lower
Chamfer. But MVS has holes where PatchMatch found no consistent depth, the dark trousers, and those methods keep the
holes. Watertight methods, SAP, Point2Mesh, close them but SAP grows blobs around the head from remaining outliers.
Removing the 404 floaters mainly helps Point2Mesh, which shrink-wraps everything it sees.""")
image(s, FIGS / "fig_grid_mvs_clean.jpg", 0.4, 1.3, 9.2, 5.7)
text(s, 9.8, 1.5, 3.1, 5.4, [
    {"text": "Denser input → lower CD for point-following methods (NKSR " +
             f"{rm.best('mvs_clean', 'nksr')['cd']:.2f}%)", "size": 13, "b": True},
    {"text": "Dark trousers: few MVS points → holes in open meshes", "size": 13, "b": True},
    {"text": "Outliers: SAP blobs, Point2Mesh membranes (raw MVS F " +
             f"{g('point2mesh-v3-paper-unoriented', 'mvs')['f1']:.2f}" + " → clean " +
             f"{g('point2mesh-v3-paper-unoriented', 'mvs_clean')['f1']:.2f})", "size": 13, "b": True},
    {"text": "VGGSfM stays the better input for closed, printable meshes", "size": 13, "b": True}])

# ------------------------------------------------------------------ 15 viewer
s = new_slide("Bonus: the mesh viewer", "Dependency-free Python server + three.js; runs the methods and compares results",
              section="Bonus", notes="""
The bonus. A small web app, no dependencies beyond the Python standard library and a vendored three.js. The dashboard
starts any method on the GPU allocation and shows progress, logs and live GPU use. The viewer shows any run textured,
shaded, as wireframe, with the input points overlaid, and two runs side by side with synchronised cameras. The compare
page ranks all runs by the metrics. For GitHub we package viewer-sized copies, so anyone can clone the repository and
run one command, bash run_viewer.sh, on a CPU, without retraining.""")
image(s, FIGS / "ui_viewer_compare.png", 0.4, 1.35, 8.4, 4.75)
image(s, FIGS / "ui_dashboard.png", 9.0, 1.35, 3.9, 2.2)
text(s, 9.0, 3.7, 3.9, 3.3, [
    {"text": "textured / shaded / wireframe / input-point overlay", "size": 13, "b": True},
    {"text": "two runs side by side, synchronised cameras", "size": 13, "b": True},
    {"text": "dashboard: launch methods, progress, live GPU", "size": 13, "b": True},
    {"text": "compare page: all runs ranked by metric", "size": 13, "b": True}])
text(s, 0.4, 6.25, 8.4, 0.7, {"text": "git clone …/cv802_assignment_2  &&  bash run_viewer.sh      (CPU only, no install)",
                              "size": 12, "bold": True, "color": ACCENT, "font": "Courier New"})

# ------------------------------------------------------------------ 16 printing
s = new_slide("3D printing", "print_export.py: largest component, outward normals, +Z up, feet at z = 0, 180 mm tall",
              section="Bonus", notes="""
We wanted a physical print. The export script keeps the largest component, orients normals outward, puts the figure
upright with the feet on the build plate, scales it to 180 millimetres and checks watertightness, winding, volume and
non-manifold edges. It writes an STL for single-colour printers and a textured OBJ for colour printers. Our Poisson
watertight variant, SAP, DHSP and Point2Mesh pass; NKSR and 2DGS are open surfaces and fail. Self-intersections are not
checked, so a slicer repair pass is still advisable, and the crossed arms need supports.""")
image(s, FIGS / "fig_print.jpg", 0.4, 1.35, 7.4, 4.6)
prs_rows = [["Mesh (VGGSfM)", "Watertight", "Volume", "Printable"]]
for rid, n in (("poisson-v4-r384-a4-watertight", "Poisson watertight"), ("sap-v1-p100k-g256-phototex2", "SAP"),
               ("dhsp-v5-lap1-remesh-optcuts-phototex2", "DHSP (full)"),
               ("point2mesh-v3-paper-unoriented", "Point2Mesh"), ("nksr-v2-ours-d1-mise1", "NKSR"),
               ("twodgs-v1-30k-phototex2", "2DGS")):
    r = g(rid)
    pr = r.get("print") if r else None
    if not pr:
        continue
    a = pr["checks_after"]
    prs_rows.append([n, "yes" if a["watertight"] else "no", f"{a['volume_cm3']:.0f} cm³" if a.get("volume_cm3") else "-",
                     "yes" if pr.get("printable") else "no"])
table(s, 8.0, 1.5, 4.9, prs_rows, col_w=[2.0, 1.1, 1.0, 1.0], size=12.5, row_h=0.4)
text(s, 8.0, 4.5, 4.9, 2.4, [
    {"text": "STL (single colour) + OBJ/texture (colour printers)", "size": 13, "b": True},
    {"text": "Recommended: SAP or DHSP (clean, closed); Poisson watertight for most detail", "size": 13, "b": True},
    {"text": "Not checked: self-intersections; supports under crossed arms", "size": 13, "b": True}])

# ------------------------------------------------------------------ 17 lessons
s = new_slide("What we learned", section="Findings", notes="""
Five lessons. One: a carefully implemented classical method is competitive; our Poisson matches pretrained networks on
this data. Two: point-based metrics are not enough; DHSP's crumpled prior had the best-looking numbers. Always check
normal consistency and shaded renders. Three: learned methods are tied to their training domain: point density for
IER, mesh-like input for MeshAnything, metric scale for NKSR. Four: self-prior methods are fragile on real scans:
normal orientation and outliers decide whether Point2Mesh works, and DHSP needed a re-meshing step. Five: texture
quality comes from the photos, not from the points.""")
lessons = [("A careful classical method is competitive", "our from-scratch Poisson ties the pretrained networks on "
            "VGGSfM (F@1% 0.999, 39 s)"),
           ("Point metrics hide surface quality", "DHSP's crumpled prior scored F@1% 0.999; check NC and shaded renders"),
           ("Learned methods live in their training domain", "IER: point density · MeshAnything: mesh-like input "
            "(0.51 → 0.987) · NKSR: metric scale"),
           ("Self-priors are fragile on real scans", "Point2Mesh: normal orientation (+0.20 F) and outliers; DHSP: "
            "re-mesh before OptCuts"),
           ("Texture comes from the photos", "visibility-aware projection makes the lettering readable; points alone blur")]
for i, (t, b) in enumerate(lessons):
    yy = 1.45 + i * 1.08
    rect(s, 0.5, yy, 0.75, 0.9, fill=ACCENT)
    text(s, 0.5, yy, 0.75, 0.9, {"text": str(i + 1), "size": 26, "bold": True, "color": WHITE}, align=PP_ALIGN.CENTER,
         anchor=MSO_ANCHOR.MIDDLE)
    rect(s, 1.35, yy, 11.5, 0.9, fill=LIGHT)
    text(s, 1.5, yy + 0.04, 11.3, 0.85, [{"text": t, "size": 17, "bold": True, "color": NAVY, "after": 1},
                                         {"text": b, "size": 13.5, "color": INK}], anchor=MSO_ANCHOR.MIDDLE)

# ------------------------------------------------------------------ 18 deliverables
s = new_slide("Deliverables and code", "Week-5 slide 8: presentation · code · one-page document", section="Summary",
              notes="""
Everything is on GitHub: the training and run code for every method, the shared finalizer and texturing, the viewer,
the input clouds and the packaged meshes. The photos and model weights are not in the repository; setup scripts
download the official code and weights. The one-page report and these slides are generated from the same results
file, so the numbers are consistent.""")
text(s, 0.5, 1.45, 6.2, 5.5, [
    {"text": "github.com/anas2908/cv802_assignment_2", "size": 17, "bold": True, "color": ACCENT, "after": 10},
    {"text": "run_viewer.sh — one command, CPU only", "size": 14, "b": True},
    {"text": "results/ — best mesh of every method × 3 inputs (zipped)", "size": 14, "b": True},
    {"text": "surface/methods/<method>/ — setup.sh, run.sh, pipeline.json", "size": 14, "b": True},
    {"text": "surface/common/ — normals, texture, photo texturing, metrics, renderer", "size": 14, "b": True},
    {"text": "surface/scripts/ — queue, finalize, print export, packaging", "size": 14, "b": True},
    {"text": "surface/ui/ — server, dashboard, viewer, compare", "size": 14, "b": True},
    {"text": "surface/docs/ — one-page report, slides, result tables", "size": 14, "b": True}])
rows = [["Deliverable", "Where"],
        ["Textured .obj for every method × input", "results/*.zip, viewer"],
        ["Code (all methods + training)", "surface/"],
        ["One-page report (CVPR style)", "surface/docs/deliverables/report"],
        ["Presentation", "surface/docs/deliverables/slides"],
        ["Mesh viewer (bonus)", "run_viewer.sh"],
        ["3D-print files", "print/ in each watertight run"]]
table(s, 7.0, 1.5, 5.9, rows, col_w=[3.2, 2.7], size=12.5, row_h=0.45)

# ------------------------------------------------------------------ 19 team
s = new_slide("Team and contributions", "Week-5 slide 9 asks for job assignments", section="Summary", notes="""
Fill in the names and roles before presenting.""")
rows = [["Member", "Responsibility"],
        ["[name]", "screened Poisson from scratch: normals, solver, marching tetrahedra"],
        ["[name]", "learned methods: IER, MeshAnything, NKSR; environments"],
        ["[name]", "self-prior methods: Point2Mesh, DHSP (re-mesh + OptCuts pipeline), SAP, 2DGS"],
        ["[name]", "photo texturing, metrics, mesh viewer, 3D-print export, report and slides"]]
table(s, 0.8, 1.7, 11.7, rows, col_w=[2.2, 9.5], size=15, row_h=0.62)
text(s, 0.8, 5.2, 11.7, 1.0, {"text": "Thank you — questions?", "size": 30, "bold": True, "color": NAVY},
     align=PP_ALIGN.CENTER)

# ------------------------------------------------------------------ backup
s = new_slide("Backup: metric definitions", "All computed against the input cloud P; mesh M sampled with 200k points",
              section="Backup", notes="""
Chamfer: average of the two one-sided mean distances, accuracy (mesh to points) and completeness (points to mesh),
reported in percent of the bounding-box diagonal so the three inputs are comparable. F-score at threshold tau:
precision is the fraction of mesh samples within tau of a point, recall the fraction of points within tau of the mesh.
Normal consistency compares face normals with the input normals at the nearest point, absolute value so orientation
does not matter. Texture PSNR samples the texture at the closest surface point of each input point.""")
image(s, E_CD, 0.7, 1.6, 9.0, 0.8, align="left")
image(s, E_F, 0.7, 2.75, 11.0, 0.75, align="left")
image(s, E_NC, 0.7, 3.85, 7.0, 0.7, align="left")
text(s, 0.7, 4.85, 12.0, 2.0, [
    {"text": "τ = 1% (and 0.5%) of the bounding-box diagonal; CD reported as % of the diagonal", "size": 14, "b": True},
    {"text": "PSNR: texture sampled at the closest surface point of each input point vs that point's RGB", "size": 14,
     "b": True},
    {"text": "Limitation: no ground-truth surface — metrics measure agreement with a noisy input, not truth", "size": 14,
     "b": True}])

s = new_slide("Backup: runtime and memory (VGGSfM)", "One RTX 5000 Ada, 32 GB", section="Backup", notes="""
Runtimes of the best runs. Poisson, NKSR, IER and MeshAnything take seconds to a minute. Point2Mesh, DHSP and 2DGS
are per-shape optimisations and take tens of minutes to hours.""")
rows = [["Method", "Run", "Faces", "Method time", "Peak GPU"]]
for m in rm.ORDER:
    r = rm.best(V, m)
    base = rm.run(V, r["run"].replace("-phototex2", "")) or r
    rows.append([rm.SHORT[m], base["run"], rm.fmt(base, "faces"), rm.fmt(base, "seconds"),
                 f"{base['peak_gpu_mib'] / 1024:.1f} GB" if base.get("peak_gpu_mib") else "-"])
table(s, 0.6, 1.5, 12.1, rows, col_w=[2.0, 5.2, 1.3, 1.6, 1.4], size=13, row_h=0.5)
text(s, 0.6, 6.2, 12.1, 0.7, {"text": "DHSP: 3D prior ≈ 100 min + 2D pipeline ≈ 35 min; photo texturing adds 1-5 min per mesh",
                              "size": 12.5, "color": GREY})

s = new_slide("Backup: how the code is organised", section="Backup", notes="""
Where things live, in case of questions about the code.""")
tree = ("run_viewer.sh                one-command CPU viewer\n"
        "results/                     packaged meshes per input (zip)\n"
        "surface/inputs/              the three input clouds\n"
        "surface/common/              io, knn, normals (PCA+MST), texture (xatlas bake),\n"
        "                             phototex (photo projection), raster, render, metrics, finalize\n"
        "surface/methods/poisson/     poisson.py  (our solver + marching tetrahedra)\n"
        "surface/methods/<m>/         setup.sh · run.sh · pipeline.json   for ier, point2mesh,\n"
        "                             meshanything, dhsp (+ run_2d.sh), nksr, sap, twodgs\n"
        "surface/scripts/             node_run, queue, best_queue, extra_queue, finalize,\n"
        "                             select_best, print_export, clean_cloud, package_results\n"
        "surface/ui/                  server.py + web/ (dashboard, viewer, compare)\n"
        "surface/docs/deliverables/   results.json → report, slides, figures")
text(s, 0.6, 1.4, 12.2, 5.5, {"text": tree, "size": 14.5, "font": "Courier New", "color": INK}, spacing=1.15)

prs.save(OUT)
print("wrote", OUT, "slides:", len(prs.slides))
