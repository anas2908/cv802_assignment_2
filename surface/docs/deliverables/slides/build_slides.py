"""CV802 Assignment 2 deck in the plain style of the Assignment 1 slides (white, Arial, black titles, grey text).

python build_slides.py [out.pptx]     (docs env: python-pptx, Pillow; run from anywhere)
Inputs: assets/ (cropped figures, close-ups, film meta), ../figs/ (result grids), the film stills and metrics of the
all-in-one page (surface/ui/hub/stills, surface/ui/hub/data/results.json)."""
import json
import sys
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.chart.data import CategoryChartData, XyChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_LABEL_POSITION, XL_MARKER_STYLE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt, Emu
from lxml import etree

HERE = Path(__file__).resolve().parent
HUB = HERE.parents[2] / "ui" / "hub"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "CV802_SP2_surface_extraction.pptx"
A = HERE / "assets"                         # prepared images
F = HERE.parent / "figs"
STILLS = HUB / "stills"                     # one still per film scene
RES = json.load(open(HUB / "data" / "results.json"))   # best runs per input
BLACK, GREY, LINE = RGBColor(0, 0, 0), RGBColor(0x59, 0x59, 0x59), RGBColor(0xBF, 0xC5, 0xCC)
PIE = ["4285F4", "DB4437", "F4B400", "0F9D58", "AB47BC", "00ACC1", "FF7043", "9E9D24", "5C6BC0"]

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(10), Inches(5.625)
BLANK = prs.slide_layouts[6]
count = [0]


def text(slide, s, x, y, w, h, size=20, color=GREY, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(0.05); tf.margin_top = tf.margin_bottom = Inches(0.02)
    for i, line in enumerate(s.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run(); r.text = line
        r.font.name = "Arial"; r.font.size = Pt(size); r.font.color.rgb = color; r.font.bold = bold
    return tb


def slide(title=None, number=True):
    s = prs.slides.add_slide(BLANK)
    count[0] += 1
    if title:
        text(s, title, 0.42, 0.3, 9.2, 0.75, size=32, color=BLACK)
    if number:
        text(s, str(count[0]), 9.25, 5.22, 0.5, 0.3, size=11, color=GREY, align=PP_ALIGN.RIGHT)
    return s


def pic(s, path, x, y, w=None, h=None):
    """Place an image inside the box (x, y, w, h) keeping its aspect ratio; returns its (x, y, w, h)."""
    iw, ih = Image.open(path).size
    if w and h:
        sc = min(w / iw, h / ih); pw, ph = iw * sc, ih * sc; x, y = x + (w - pw) / 2, y + (h - ph) / 2
    elif w:
        pw, ph = w, w * ih / iw
    else:
        pw, ph = h * iw / ih, h
    s.shapes.add_picture(str(path), Inches(x), Inches(y), Inches(pw), Inches(ph))
    return x, y, pw, ph


def border(cell, color="BFC5CC", width=9525):
    tcPr = cell._tc.get_or_add_tcPr()
    for tag in ("a:lnL", "a:lnR", "a:lnT", "a:lnB"):
        ln = etree.SubElement(tcPr, qn(tag), w=str(width), cap="flat", cmpd="sng", algn="ctr")
        sf = etree.SubElement(ln, qn("a:solidFill")); etree.SubElement(sf, qn("a:srgbClr"), val=color)
        etree.SubElement(ln, qn("a:prstDash"), val="solid")


def table(s, rows, x, y, widths, size=12, row_h=0.3, align=None, fills=None, merge=()):
    t = s.shapes.add_table(len(rows), len(rows[0]), Inches(x), Inches(y), Inches(sum(widths)), Inches(row_h * len(rows))).table
    tblPr = t._tbl.tblPr
    for k in ("firstRow", "bandRow"):
        tblPr.set(k, "0")
    style = tblPr.find(qn("a:tableStyleId"))
    if style is not None:
        style.text = "{5940675A-B579-460E-94D1-54222C63F5DA}"   # "No Style, Table Grid"
    for j, w in enumerate(widths):
        t.columns[j].width = Inches(w)
    for i, row in enumerate(rows):
        t.rows[i].height = Inches(row_h)
        for j, val in enumerate(row):
            c = t.cell(i, j); border(c)
            if fills and (i, j) in fills:
                c.fill.solid(); c.fill.fore_color.rgb = RGBColor.from_string(fills[(i, j)])
            else:
                c.fill.background()
            c.margin_left = c.margin_right = Inches(0.08); c.margin_top = c.margin_bottom = Inches(0.03)
            c.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf = c.text_frame; tf.word_wrap = True
            p = tf.paragraphs[0]; p.text = ""
            p.alignment = (align[j] if align else (PP_ALIGN.LEFT if j == 0 else PP_ALIGN.RIGHT))
            r = p.add_run(); r.text = str(val)
            r.font.name = "Arial"; r.font.size = Pt(size); r.font.bold = True; r.font.color.rgb = BLACK
    for r0, c0, r1, c1 in merge:              # group headers, centred
        t.cell(r0, c0).merge(t.cell(r1, c1))
        t.cell(r0, c0).text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    return t


def arrow(s, x1, y1, x2, y2):
    ln = s.shapes.add_connector(1, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    ln.line.color.rgb = GREY; ln.line.width = Pt(1.25)
    etree.SubElement(ln.line._get_or_add_ln(), qn("a:tailEnd"), type="triangle", w="med", len="med")


def pie(s, title, cats, vals, x, y, w, h, fmt='0'):
    cd = CategoryChartData(); cd.categories = cats; cd.add_series(title, vals)
    ch = s.shapes.add_chart(XL_CHART_TYPE.PIE, Inches(x), Inches(y), Inches(w), Inches(h), cd).chart
    ch.has_title = True; ch.chart_title.text_frame.text = title
    tp = ch.chart_title.text_frame.paragraphs[0]; tp.runs[0].font.size = Pt(14); tp.runs[0].font.name = "Arial"; tp.runs[0].font.bold = False; tp.runs[0].font.color.rgb = GREY
    ch.has_legend = True; ch.legend.position = XL_LEGEND_POSITION.RIGHT; ch.legend.include_in_layout = False
    ch.legend.font.size = Pt(11); ch.legend.font.name = "Arial"; ch.legend.font.color.rgb = GREY
    plot = ch.plots[0]
    for i, pt in enumerate(plot.series[0].points):
        pt.format.fill.solid(); pt.format.fill.fore_color.rgb = RGBColor.from_string(PIE[i % len(PIE)])
        pt.format.line.color.rgb = RGBColor(255, 255, 255)
    plot.has_data_labels = True
    dl = plot.data_labels; dl.number_format = fmt; dl.number_format_is_linked = False; dl.show_value = True
    dl.font.size = Pt(11); dl.font.name = "Arial"; dl.font.color.rgb = RGBColor(255, 255, 255); dl.font.bold = True
    dl.position = XL_LABEL_POSITION.CENTER
    return ch


def bars(s, title, cats, vals, x, y, w, h, fmt='0.0'):
    cd = CategoryChartData(); cd.categories = cats; cd.add_series(title, vals)
    ch = s.shapes.add_chart(XL_CHART_TYPE.BAR_CLUSTERED, Inches(x), Inches(y), Inches(w), Inches(h), cd).chart
    ch.has_title = True; ch.chart_title.text_frame.text = title
    tp = ch.chart_title.text_frame.paragraphs[0]; tp.runs[0].font.size = Pt(14); tp.runs[0].font.name = "Arial"; tp.runs[0].font.bold = False; tp.runs[0].font.color.rgb = GREY
    ch.has_legend = False
    plot = ch.plots[0]; plot.gap_width = 60
    ser = plot.series[0]; ser.format.fill.solid(); ser.format.fill.fore_color.rgb = RGBColor.from_string(PIE[0])
    plot.has_data_labels = True; dl = plot.data_labels; dl.number_format = fmt; dl.number_format_is_linked = False
    dl.font.size = Pt(10); dl.font.name = "Arial"; dl.font.color.rgb = GREY; dl.position = XL_LABEL_POSITION.OUTSIDE_END
    ca, va = ch.category_axis, ch.value_axis
    ca.tick_labels.font.size = Pt(11); ca.tick_labels.font.name = "Arial"; ca.tick_labels.font.color.rgb = GREY
    ca.format.line.color.rgb = LINE; ca.reverse_order = True
    va.visible = False; va.has_major_gridlines = False
    return ch


def scatter(s, title, pts, x, y, w, h, xtitle, xfmt, xmin, xmax):
    """pts: [(label, x value, F@1%, label position)], one labelled point per method; log x axis."""
    cd = XyChartData()
    for lab, xv, yv, _ in pts:
        cd.add_series(lab).add_data_point(xv, yv)
    ch = s.shapes.add_chart(XL_CHART_TYPE.XY_SCATTER, Inches(x), Inches(y), Inches(w), Inches(h), cd).chart
    ch.has_title = True; ch.chart_title.text_frame.text = title
    tp = ch.chart_title.text_frame.paragraphs[0]; tp.runs[0].font.size = Pt(14); tp.runs[0].font.name = "Arial"; tp.runs[0].font.bold = False; tp.runs[0].font.color.rgb = GREY
    ch.has_legend = False
    for i, (ser, (lab, xv, yv, pos)) in enumerate(zip(ch.plots[0].series, pts)):
        ser.marker.style = XL_MARKER_STYLE.CIRCLE; ser.marker.size = 10
        ser.marker.format.fill.solid(); ser.marker.format.fill.fore_color.rgb = RGBColor.from_string(PIE[i % len(PIE)])
        ser.marker.format.line.color.rgb = RGBColor(255, 255, 255)
        ser.format.line.fill.background()
        dl = ser.points[0].data_label; dl.has_text_frame = True; dl.text_frame.text = lab; dl.position = pos
        r = dl.text_frame.paragraphs[0].runs[0]; r.font.size = Pt(10); r.font.name = "Arial"; r.font.color.rgb = GREY
    for ax, t, fmt, lo, hi in ((ch.category_axis, xtitle, xfmt, xmin, xmax), (ch.value_axis, "F@1% ↑", "0.00", 0.8, 1.0)):
        ax.minimum_scale, ax.maximum_scale = lo, hi
        ax.has_major_gridlines = True; ax.major_gridlines.format.line.color.rgb = RGBColor(0xE3, 0xE6, 0xEA)
        ax.format.line.color.rgb = LINE
        ax.tick_labels.number_format = fmt; ax.tick_labels.number_format_is_linked = False
        ax.tick_labels.font.size = Pt(10); ax.tick_labels.font.name = "Arial"; ax.tick_labels.font.color.rgb = GREY
        ax.has_title = True; ax.axis_title.text_frame.text = t
        r = ax.axis_title.text_frame.paragraphs[0].runs[0]; r.font.size = Pt(11); r.font.name = "Arial"; r.font.bold = False; r.font.color.rgb = GREY
    ch.value_axis.major_unit = 0.05
    lb = etree.Element(qn("c:logBase")); lb.set("val", "10")
    ch.category_axis._element.find(qn("c:scaling")).insert(0, lb)
    return ch


GREEN, BLUE = "D9EAD3", "CFE2F3"


def num(v):
    v = str(v).replace(",", "").strip()
    for unit, k in (("min", 60), ("h", 3600), ("s", 1)):
        if v.endswith(" " + unit):
            return float(v[: -len(unit) - 1]) * k
    return float(v)


def rank_fills(rows, cols, start=1):
    """cols: {column index: +1 higher is better / -1 lower is better}; rows before `start` are headers.
    Best value(s) green, second best blue."""
    out = {}
    for j, sign in cols.items():
        vals = sorted({num(r[j]) for r in rows[start:]}, reverse=(sign > 0))
        for i, r in enumerate(rows[start:], start):
            v = num(r[j])
            if v == vals[0]: out[(i, j)] = GREEN
            elif len(vals) > 1 and v == vals[1]: out[(i, j)] = BLUE
    return out


def legend(s):
    from pptx.enum.shapes import MSO_SHAPE
    for k, (col, lab) in enumerate([(GREEN, "best"), (BLUE, "second best")]):
        x = 6.9 + k * 1.15
        b = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(0.62), Inches(0.2), Inches(0.2))
        b.fill.solid(); b.fill.fore_color.rgb = RGBColor.from_string(col); b.line.color.rgb = LINE; b.shadow.inherit = False
        text(s, lab, x + 0.25, 0.55, 1.0, 0.35, size=12)


PANELS = json.load(open(A / "panels.json"))


def labelled_fig(s, key, x, y, w, h, labels, size=11):
    """A figure whose header was cropped off; one bold label and one grey line above each panel."""
    P = PANELS[key]; ih = h - 0.5
    px, py, pw, ph = pic(s, A / f"fig_{key}_body.jpg", x, y + 0.5, w=w, h=ih)
    sc = pw / P["w"]
    for (a, b), (t1, t2) in zip(P["panels"], labels):
        cx = px + (a + b) / 2 * sc
        text(s, t1, cx - 0.9, py - 0.5, 1.8, 0.25, size=size, color=BLACK, bold=True, align=PP_ALIGN.CENTER)
        text(s, t2, cx - 0.9, py - 0.27, 1.8, 0.25, size=9, color=GREY, align=PP_ALIGN.CENTER)


def best(ds, m):
    return next(r for r in RES[ds]["runs"] if r["method_id"] == m)


NAMES = [("poisson", "Poisson (ours)"), ("ier", "IER"), ("point2mesh", "Point2Mesh"), ("meshanything", "MeshAnything V2"),
         ("dhsp", "DHSP"), ("nksr", "NKSR*"), ("sap", "SAP*"), ("twodgs", "2DGS*")]
# DHSP runs in two stages; results.json records only the 3D stage, the 2D stage time comes from its queue log
DHSP_3D, DHSP_2D = {"vggsfm": 6075, "mvs": 6699, "mvs_clean": 13277}, {"vggsfm": 1961, "mvs": 7773, "mvs_clean": 7804}


def seconds(ds, m):
    return DHSP_3D[ds] + DHSP_2D[ds] if m == "dhsp" else best(ds, m)["seconds"]


def dur(t):
    return f"{t:.0f} s" if t < 100 else (f"{t / 60:.0f} min" if t < 6000 else f"{t / 3600:.1f} h")


faces = lambda n: f"{n / 1e6:.2f}M" if n >= 1e6 else (f"{n / 1e3:.0f}k" if n >= 1e4 else f"{n / 1e3:.1f}k")

# 1 title
s = slide(number=False)
text(s, "CV802", 0.3, 1.3, 9.4, 1.0, size=54, color=BLACK, align=PP_ALIGN.CENTER)
text(s, "Assignment 2: Surface Extraction", 0.3, 2.3, 9.4, 0.9, size=40, color=BLACK, align=PP_ALIGN.CENTER)
text(s, "Anas Khan", 0.3, 3.75, 9.4, 0.7, size=28, color=GREY, align=PP_ALIGN.CENTER)

# 2 problem statement
s = slide("Problem Statement:")
items = [("ps_points.png", "points"), ("ps_poisson.png", "Poisson"), ("ps_ier.png", "IER"), ("ps_point2mesh.png", "Point2Mesh"),
         ("ps_meshanything.png", "MeshAnything"), ("ps_dhsp.png", "DHSP"), ("ps_nksr.png", "NKSR"), ("ps_sap.png", "SAP")]
xs = [0.45] + [2.15 + k * 1.05 for k in range(7)]
for (img, lab), x in zip(items, xs):
    px, py, pw, ph = pic(s, A / img, x, 1.15, h=2.9)
    text(s, lab, px + pw / 2 - 0.6, 4.12, 1.2, 0.35, size=12, align=PP_ALIGN.CENTER)
arrow(s, 1.45, 2.6, 2.02, 2.6)
text(s, "VGGSfM points from Assignment 1  →  textured meshes (.obj)", 0.42, 4.65, 9.2, 0.4, size=16, align=PP_ALIGN.CENTER)

# 3 inputs
s = slide("Inputs")
pic(s, F / "fig_inputs.jpg", 0.42, 1.05, w=9.16, h=4.1)

# 4 methods
s = slide("Methods")
rows = [["Method", "Venue", "Year"], ["Screened Poisson (our implementation)", "SGP / ACM TOG", "2006 / 2013"], ["IER meshing", "ECCV", "2020"],
        ["Point2Mesh", "SIGGRAPH", "2020"], ["MeshAnything V2", "arXiv", "2024"], ["Deep Hybrid Self-Prior (DHSP)", "ICCV", "2021"],
        ["NKSR*", "CVPR", "2023"], ["Shape As Points (SAP)*", "NeurIPS", "2021"], ["2D Gaussian Splatting (2DGS)*", "SIGGRAPH", "2024"]]
table(s, rows, 0.6, 1.1, [4.6, 2.3, 1.9], size=15, row_h=0.36, align=[PP_ALIGN.LEFT, PP_ALIGN.LEFT, PP_ALIGN.LEFT])
text(s, "* beyond the course list", 0.6, 4.85, 5, 0.35, size=12)

# 5 experiments
s = slide("Experiments")
text(s, "61 reconstructions in total", 0.42, 0.95, 9.2, 0.4, size=18)
geo = [("MeshAnything", 15), ("DHSP", 11), ("Poisson", 10), ("Point2Mesh", 8), ("NKSR", 7), ("2DGS", 4), ("IER", 3), ("SAP", 3)]
pie(s, "Reconstructions per method", [g[0] for g in geo], [g[1] for g in geo], 0.3, 1.45, 4.8, 3.8)
pie(s, "Reconstructions per input", ["VGGSfM", "MVS", "MVS-clean"], [34, 13, 14], 5.1, 1.45, 4.6, 3.8)

# 6 compute time
s = slide("GPU time")
tm = [("DHSP", 16.22), ("Point2Mesh", 9.63), ("2DGS", 1.95), ("Others", 0.90)]
pie(s, "Hours per method (28.7 h)", [t[0] for t in tm], [t[1] for t in tm], 0.3, 1.0, 4.7, 3.9, fmt='0.0')
bt = [("DHSP", 133.9), ("2DGS", 47.1), ("Point2Mesh", 41.7), ("SAP", 7.8), ("MeshAnything", 1.3), ("Poisson", 0.6), ("IER", 0.5), ("NKSR", 0.1)]
bars(s, "Best run on VGGSfM (minutes)", [b[0] for b in bt], [b[1] for b in bt], 5.1, 1.0, 4.6, 3.9)
text(s, "One RTX 5000 Ada (32 GB). Others: SAP, MeshAnything, Poisson, IER, NKSR. DHSP includes its 3D and 2D stages. Not counted: failed attempts, e.g. a 15 h flattening run that never finished.",
     0.42, 4.95, 9.2, 0.5, size=11)

# 7 results figure
s = slide("Results (VGGSfM)")
pic(s, F / "fig_grid_vggsfm.jpg", 0.42, 1.0, w=9.16, h=4.2)

# 8 results table VGGSfM
COURSE, EXTRA = NAMES[:5], NAMES[5:]
s = slide("Comparison (½)")
legend(s)
for k, (group, lab, y) in enumerate([(COURSE, "Course list", 1.0), (EXTRA, "Beyond the course list", 3.38)]):
    rows = [["Method", "Faces", "Chamfer % ↓", "F@1% ↑", "F@0.5% ↑", "NC ↑", "Watertight", "Time ↓"]]
    for m, n in group:
        r = best("vggsfm", m)
        rows.append([n, faces(r["faces_full"]), f"{r['chamfer_pct']:.3f}", f"{r['f1']:.3f}", f"{r['f05']:.3f}", f"{r['nc']:.2f}",
                     "yes" if r["watertight"] else "no", dur(seconds("vggsfm", m))])
    text(s, lab, 0.42, y, 4, 0.3, size=13)
    table(s, rows, 0.42, y + 0.3, [1.85, 0.85, 1.3, 1.0, 1.15, 0.8, 1.1, 1.11], size=12, row_h=0.33,
          fills=rank_fills(rows, {2: -1, 3: 1, 4: 1, 5: 1, 7: -1}))
text(s, "VGGSfM input (138,677 points), best run per method.", 0.42, 5.08, 7, 0.3, size=11)

# 9 results table MVS
s = slide("Comparison (2/2)")
legend(s)
for k, (group, lab, y) in enumerate([(COURSE, "Course list", 0.98), (EXTRA, "Beyond the course list", 3.4)]):
    rows = [["Method", "MVS (487,451 points)", "", "", "MVS-clean (487,047 points)", "", ""],
            ["", "F@1% ↑", "Chamfer % ↓", "Time ↓", "F@1% ↑", "Chamfer % ↓", "Time ↓"]]
    for m, n in group:
        a, b = best("mvs", m), best("mvs_clean", m)
        rows.append([n, f"{a['f1']:.3f}", f"{a['chamfer_pct']:.3f}", dur(seconds("mvs", m)),
                     f"{b['f1']:.3f}", f"{b['chamfer_pct']:.3f}", dur(seconds("mvs_clean", m))])
    text(s, lab, 0.42, y, 4, 0.3, size=13)
    table(s, rows, 0.42, y + 0.28, [1.75, 1.15, 1.35, 1.0, 1.15, 1.35, 1.41], size=12, row_h=0.29,
          fills=rank_fills(rows, {1: 1, 2: -1, 3: -1, 4: 1, 5: -1, 6: -1}, start=2), merge=[(0, 0, 1, 0), (0, 1, 0, 3), (0, 4, 0, 6)])

# quality vs time and size (best run per method on VGGSfM)
s = slide("Quality vs time and size")
L = XL_LABEL_POSITION
POS_T = {"poisson": L.ABOVE, "ier": L.BELOW, "point2mesh": L.RIGHT, "meshanything": L.BELOW, "dhsp": L.LEFT, "nksr": L.ABOVE,
         "sap": L.ABOVE, "twodgs": L.LEFT}
POS_F = {"poisson": L.ABOVE, "ier": L.ABOVE, "point2mesh": L.RIGHT, "meshanything": L.BELOW, "dhsp": L.RIGHT, "nksr": L.BELOW,
         "sap": L.ABOVE, "twodgs": L.BELOW}
short = lambda n: n.replace(" (ours)", "").replace(" V2", "").replace("*", "")
scatter(s, "F@1% vs time", [(short(n), seconds("vggsfm", m), best("vggsfm", m)["f1"], POS_T[m]) for m, n in NAMES],
        0.3, 0.95, 4.65, 4.2, "Time (s, log scale)", '#,##0', 1, 100000)
scatter(s, "F@1% vs triangles", [(short(n), best("vggsfm", m)["faces_full"], best("vggsfm", m)["f1"], POS_F[m]) for m, n in NAMES],
        5.05, 0.95, 4.65, 4.2, "Triangles (log scale)", '#,##0', 1000, 10000000)
text(s, "VGGSfM input, best run per method. Higher is better; further left is faster (left chart) or lighter (right chart).", 0.42, 5.15, 7, 0.3, size=11)

# 10 back view
s = slide("Back view (VGGSfM)")
pic(s, F / "fig_grid_vggsfm_back.jpg", 0.42, 1.1, w=9.16, h=4.0)

# close-ups: same crop of every best mesh (shaded geometry) and of the input points
CU = [("points", "Input points")] + NAMES
for key, title, asp in (("face", "Close-up: face", 1.0), ("arms", "Close-up: crossed arms", 660 / 420), ("feet", "Close-up: feet", 690 / 360)):
    s = slide(title)
    cw, gap = 1.72, 0.14
    ih = min(cw / asp, 1.62)
    top = 1.0 + (3.95 - 2 * (ih + 0.32) - 0.12) / 2
    for i, (m, n) in enumerate(CU):
        row, col = (0, i) if i < 5 else (1, i - 5)
        x0 = 0.42 + col * (cw + gap) + (0 if row == 0 else (cw + gap) / 2)
        y0 = top + row * (ih + 0.44)
        pic(s, A / "closeups" / f"{key}_{m}.jpg", x0, y0, w=cw, h=ih)
        text(s, n, x0, y0 + ih + 0.02, cw, 0.28, size=11, align=PP_ALIGN.CENTER)
    text(s, "Shaded geometry of the best VGGSfM run per method, same crop for all. Red: triangles seen from the back.", 0.42, 5.12, 8.6, 0.3, size=11)

# 11-12 MVS figures
s = slide("Results (MVS)")
pic(s, F / "fig_grid_mvs.jpg", 0.42, 1.0, w=9.16, h=4.2)
s = slide("Results (MVS-clean)")
pic(s, F / "fig_grid_mvs_clean.jpg", 0.42, 1.0, w=9.16, h=4.2)

# 13 Poisson
s = slide("Poisson experiments")
labelled_fig(s, "poisson", 0.42, 1.1, 5.35, 4.0, [("256³, no screening", "Chamfer 0.230%"), ("256³, screened", "Chamfer 0.179%"),
                                               ("384³, screened", "Chamfer 0.149%"), ("384³, not trimmed", "Chamfer 0.154%")], size=10)
rows = [["Run", "Faces", "F@1%", "Time"], ["256³, no screening", "265k", "0.990", "14 s"], ["256³, screened", "358k", "0.998", "17 s"],
        ["384³, screened", "1.02M", "0.999", "39 s"], ["384³, not trimmed", "1.05M", "0.998", "25 s"]]
table(s, rows, 5.85, 1.6, [1.75, 0.7, 0.7, 0.55], size=12, row_h=0.38, fills=rank_fills(rows, {2: 1, 3: -1}))
legend(s)
text(s, "Screened: surface pulled onto the points\nNo screening: follows point directions only\nTrimmed: parts far from points are cut off", 5.85, 3.75, 3.75, 0.9, size=11)

# 14 MeshAnything
s = slide("MeshAnything experiments")
labelled_fig(s, "meshanything", 0.42, 1.05, 4.15, 4.1, [("raw points", "F@1% 0.508 · 1,802 faces"), ("Poisson mesh as input", "F@1% 0.987 · 1,435 faces")])
rows = [["Input", "Model", "Decoding", "Faces", "F@1%", "Time"], ["raw points", "V2", "greedy", "624", "0.113", "92 s"],
        ["raw points", "V2", "sampling", "1,802", "0.508", "77 s"], ["raw points", "V1", "greedy", "795", "0.442", "59 s"],
        ["Poisson mesh", "V1", "greedy", "471", "0.929", "51 s"], ["Poisson mesh", "V2", "sampling", "2,058", "0.965", "95 s"],
        ["Poisson mesh", "V2", "greedy", "1,435", "0.987", "77 s"]]
legend(s)
table(s, rows, 4.62, 1.3, [1.3, 0.74, 0.95, 0.68, 0.72, 0.6], size=12, row_h=0.4, fills=rank_fills(rows, {4: 1, 5: -1}),
      align=[PP_ALIGN.LEFT, PP_ALIGN.LEFT, PP_ALIGN.LEFT, PP_ALIGN.RIGHT, PP_ALIGN.RIGHT, PP_ALIGN.RIGHT])

# 15 Point2Mesh
s = slide("Point2Mesh experiments")
labelled_fig(s, "point2mesh", 0.42, 1.05, 4.95, 4.1, [("paper defaults", "F@1% 0.646"), ("unoriented", "F@1% 0.844"), ("MVS input", "F@1% 0.133"), ("MVS-clean", "F@1% 0.387")])
rows = [["Run", "Faces", "F@1%", "Time"], ["first try", "16k", "0.602", "21 min"], ["paper defaults", "10k", "0.646", "44 min"],
        ["+ unoriented", "10k", "0.844", "42 min"], ["+ unoriented, 20k", "20k", "0.655", "3.4 h"], ["MVS", "10k", "0.133", "40 min"],
        ["MVS-clean", "10k", "0.387", "39 min"]]
legend(s)
table(s, rows, 5.55, 1.3, [1.7, 0.65, 0.7, 0.85], size=12, row_h=0.4, fills=rank_fills(rows, {2: 1, 3: -1}))

# 16 DHSP
s = slide("DHSP experiments")
pic(s, A / "fig_dhsp_crop.jpg", 0.42, 1.1, w=4.7, h=4.0)
rows = [["Run", "Faces", "F@1%", "NC", "Time"], ["3D prior only", "16k", "0.999", "0.65", dur(6360)],
        ["full pipeline", "6k", "0.874", "0.89", dur(6360 + 8460)], ["full, extra smoothing", "6k", "0.901", "0.89", dur(DHSP_3D["vggsfm"] + DHSP_2D["vggsfm"])],
        ["MVS, full", "6k", "0.900", "0.69", dur(seconds("mvs", "dhsp"))], ["MVS-clean, full", "6k", "0.916", "0.72", dur(seconds("mvs_clean", "dhsp"))]]
legend(s)
table(s, rows, 5.2, 1.4, [1.8, 0.7, 0.7, 0.55, 0.6], size=12, row_h=0.4, fills=rank_fills(rows, {2: 1, 3: 1, 4: -1}))
text(s, "Full pipeline time = 3D stage + 2D stage.", 5.2, 3.95, 4.3, 0.3, size=11)

# 17 IER
s = slide("IER experiments")
pic(s, A / "ier_textured.png", 0.42, 1.1, h=3.9)
pic(s, A / "ier_shaded.png", 3.45, 1.1, h=3.9)
rows = [["Input", "Faces", "F@1%", "Time"], ["VGGSfM", "17.5k", "0.998", "29 s"], ["MVS", "16.4k", "1.000", "42 s"], ["MVS-clean", "16.7k", "1.000", "50 s"]]
legend(s)
table(s, rows, 6.6, 1.5, [1.25, 0.75, 0.7, 0.6], size=12, row_h=0.4, fills=rank_fills(rows, {2: 1, 3: -1}))

# 18 extra methods
s = slide("NKSR, SAP and 2DGS")
pic(s, F / "fig_extra.jpg", 0.42, 1.0, w=9.16, h=3.9)
text(s, "NKSR: 2.09M faces in 7 s    SAP: 64k faces in 8 min    2DGS: 657k faces in 47 min", 0.42, 4.95, 9.2, 0.4, size=14, align=PP_ALIGN.CENTER)

# 22 findings
s = slide("Findings")
text(s, "1.  Our own Poisson ties the best learned methods on VGGSfM (F@1% 0.999).\n"
        "2.  NKSR is best on the dense MVS clouds (Chamfer 0.08%).\n"
        "3.  A high score can hide a crumpled surface (DHSP 3D prior: F@1% 0.999, NC 0.65).\n"
        "4.  The input matters: MeshAnything 0.51 → 0.987 with a mesh input;\n      Point2Mesh 0.13 → 0.39 after removing MVS floaters.\n"
        "5.  Four methods give closed (watertight) meshes.", 0.42, 1.15, 9.2, 4.0, size=17)

# the videos
s = slide(number=False)
text(s, "Let’s go through the videos!", 0.3, 2.2, 9.4, 1.0, size=40, color=BLACK, align=PP_ALIGN.CENTER)
s = slide("Disclaimer")
text(s, "The next seven videos took a lot of effort to make.\n\n"
        "Every scene was planned, animated and checked against our own runs, so every number in them is a real result.\n\n"
        "They explain each method step by step, which is why the slides before them skip formulas and methodology.",
     0.42, 1.25, 9.0, 3.5, size=20)
VIDEOS = [("Screened Poisson", ["v1_poisson"]), ("The metrics", ["v2_metrics"]), ("IER meshing", ["v3_ier_p1", "v3_ier_p2"]),
          ("MeshAnything", ["v4_ma_p1", "v4_ma_p2"]), ("Point2Mesh", ["v5_p2m_p1", "v5_p2m_p2"]),
          ("Deep Hybrid Self-Prior (DHSP)", ["v6_dhsp_p1", "v6_dhsp_p2"]), ("NKSR", ["v7_nksr"])]
META = {f: json.load(open(A / f"meta_{f}.json")) for _, fs in VIDEOS for f in fs}
mmss = lambda d: f"{int(d // 60)} min {int(round(d % 60))} s"
for k, (name, fs) in enumerate(VIDEOS, 1):
    s = slide(f"Video {k}: {name}")
    if len(fs) == 1:
        m = META[fs[0]]
        px, py, pw, ph = pic(s, STILLS / f"{fs[0]}_00.jpg", 1.35, 1.0, w=7.3, h=4.1)
        text(s, f"{mmss(m['duration'])}  ·  {len(m['parts'])} scenes", 0.42, py + ph + 0.05, 9.16, 0.35, size=14, align=PP_ALIGN.CENTER)
    else:
        for j, f in enumerate(fs):
            m = META[f]
            px, py, pw, ph = pic(s, STILLS / f"{f}_00.jpg", 0.42 + j * 4.66, 1.45, w=4.5, h=2.53)
            text(s, f"Part {j + 1}  ·  {mmss(m['duration'])}  ·  {len(m['parts'])} scenes", px, py + ph + 0.08, pw, 0.35, size=14, align=PP_ALIGN.CENTER)
    total = sum(META[f]["duration"] for f in fs)
    if len(fs) > 1:
        text(s, f"{mmss(total)} in total", 0.42, 4.55, 9.16, 0.35, size=12, align=PP_ALIGN.CENTER)

# extras: one still per scene of each video (scenes about photo texturing left out)
s = slide("Extras: stills from the videos")
text(s, "One still per scene, in order, from the seven videos.", 0.42, 1.1, 9.2, 0.5, size=18)
SKIP = {"v2_metrics": {11}, "v3_ier_p2": {4, 5}, "v4_ma_p2": {5}, "v6_dhsp_p2": {4}, "v7_nksr": {9}}
for _, fs in VIDEOS:
    for f in fs:
        for i in range(len(META[f]["parts"])):
            if i not in SKIP.get(f, ()):
                s = slide(number=False)
                s.shapes.add_picture(str(STILLS / f"{f}_{i:02d}.jpg"), 0, 0, prs.slide_width, prs.slide_height)

prs.save(OUT)
print("saved", OUT, count[0], "slides")
