"""Headless screenshots of the UI pages (WebGL via SwiftShader). Usage: python ui_screenshots.py <base_url> <out_dir>"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

base, out = sys.argv[1].rstrip("/"), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
pages = [("dashboard", "/", 3000), ("viewer", "/viewer", 15000), ("compare", "/compare", 3000)]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    logs = []
    pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))
    for name, path, wait in pages:
        pg.goto(base + path)
        pg.wait_for_timeout(wait)
        pg.screenshot(path=str(out / f"{name}.png"))
    if len(sys.argv) > 3:  # extra viewer state: compare + wireframe
        pg.goto(base + "/viewer?" + sys.argv[3]); pg.wait_for_timeout(20000)
        pg.check("#wire"); pg.wait_for_timeout(4000)
        pg.screenshot(path=str(out / "viewer_compare.png"))
    b.close()
print("\n".join(logs[-30:]))
