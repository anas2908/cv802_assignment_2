"""Render docs/ONE_PAGER.md to docs/ONE_PAGER.pdf (A4, one page) with a row of front renders (MVS best runs).
Run with the uitest env (markdown + playwright): python -m surface.scripts.make_one_pager"""
import base64
import os
from pathlib import Path

import markdown
from playwright.sync_api import sync_playwright

docs = Path(__file__).resolve().parents[1] / "docs"
data = Path(os.environ.get("CV802_SP2_DATA_ROOT", f"/l/users/{os.environ['USER']}/cv802_sp2"))
figs = [("Poisson (ours)", "poisson"), ("NKSR", "nksr"), ("IER", "ier"), ("DHSP", "dhsp"),
        ("MeshAnything V2", "meshanything"), ("Point2Mesh", "point2mesh")]
cells = []
for label, m in figs:
    d = data / "outputs_mvs" / m
    run = (d / "latest").read_text().strip()
    png = d / run / "preview_front.png"
    b64 = base64.b64encode(png.read_bytes()).decode()
    cells.append(f'<figure><img src="data:image/png;base64,{b64}"><figcaption>{label}</figcaption></figure>')
fig = '<div class="fig">' + "".join(cells) + '</div><p class="cap">Front renders of the best run per method on the MVS input (texture from the finalizer or the method).</p>'
body = markdown.markdown((docs / "ONE_PAGER.md").read_text(), extensions=["tables"]).replace("<!--FIGURE-->", fig)
css = """@page{size:A4;margin:10mm 12mm}body{font:9pt/1.3 "DejaVu Sans",Arial,sans-serif;color:#111}
h1{font-size:14pt;margin:0 0 4px;color:#13457a}p{margin:3px 0}ul{margin:2px 0 3px 15px;padding:0}li{margin:1px 0}
table{border-collapse:collapse;width:100%;margin:4px 0;font-size:8.4pt}th,td{border:1px solid #bbb;padding:2px 5px;text-align:left}
th{background:#e8eef6}code{font-size:8.2pt}.fig{display:flex;gap:4px;margin:5px 0 0}figure{margin:0;flex:1;text-align:center}
figure img{width:100%;height:150px;object-fit:cover;object-position:center 45%;border:1px solid #ccc}
figcaption{font-size:7.8pt}.cap{font-size:7.8pt;color:#555;margin-top:1px}"""
html = f"<html><head><meta charset=utf-8><style>{css}</style></head><body>{body}</body></html>"
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.set_content(html)
    pg.pdf(path=str(docs / "ONE_PAGER.pdf"), format="A4", print_background=True)
    b.close()
print("wrote", docs / "ONE_PAGER.pdf")
