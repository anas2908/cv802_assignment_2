"""Screenshots of the live UI for the slides (uitest env with Playwright; WebGL via SwiftShader).
python ui_shots.py <base_url> <token> <out_dir>
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

base, token, out = sys.argv[1].rstrip("/"), sys.argv[2], Path(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1600, "height": 900}, device_scale_factor=1.5)
    pg.goto(f"{base}/?token={token}")
    pg.wait_for_timeout(4000)
    pg.screenshot(path=str(out / "ui_dashboard.png"))
    runs = pg.evaluate("fetch('/api/runs').then(r => r.json())")
    items = runs.get("runs", runs) if isinstance(runs, dict) else runs
    keys = [r.get("key") or r.get("id") for r in items]
    print(len(keys), "runs;", keys[:40])
    pick = lambda s: next((k for k in keys if k and s in k), None)
    a, c = pick("poisson-v2-r384-a4-t2-phototex2"), pick("twodgs-v2-30k-1600-phototex2")
    pg.goto(f"{base}/viewer?run={a}&compare={c}")
    pg.wait_for_timeout(25000)
    pg.screenshot(path=str(out / "ui_viewer_compare.png"))
    try:
        pg.check("#wire"); pg.wait_for_timeout(5000)
        pg.screenshot(path=str(out / "ui_viewer_wire.png"))
    except Exception as e:  # noqa: BLE001
        print("wireframe toggle:", e)
    pg.goto(f"{base}/compare")
    pg.wait_for_timeout(5000)
    pg.screenshot(path=str(out / "ui_compare.png"), full_page=False)
    b.close()
