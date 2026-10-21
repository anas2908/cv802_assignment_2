const { seg, eo, eio, lerp, TextFx } = kit;
const CMD = '$ bash run_viewer.sh', BX = [110, 560, 1010, 1460], BY = 420, BW = 360, BH = 150;
const STEPS = [['1 · Unpack', 'results/*.zip → a cache'], ['2 · Pick a port', 'any free one'], ['3 · Start the server', 'Python, read-only'], ['4 · Open the browser', '127.0.0.1:port/viewer']];
kit.scene('w-run', {
  init(kit) {
    let boxes = ''; STEPS.forEach(([a, b], i) => { boxes += '<div class="box w-run-b" style="left:' + BX[i] + 'px;top:' + BY + 'px;width:' + BW + 'px;height:' + BH + 'px;padding:26px 24px"><p style="margin:0;font-size:30px">' + a + '</p><p style="margin:12px 0 0;font-family:var(--mono);font-size:22px;color:var(--main)">' + b + '</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The viewer · Starting it</span><h2 class="line">One command</h2></div>' +
      '<div class="box hot" style="left:110px;top:240px;width:780px;height:96px;padding:22px 28px"><p class="w-run-cmd" style="margin:0;font-family:var(--mono);font-size:36px;color:var(--accent);white-space:nowrap"></p></div>' +
      '<p class="note w-run-t" style="left:930px;top:270px;color:var(--second)">typed once, inside the cloned repository</p>' + boxes +
      '<div class="words" style="left:110px;top:650px;width:880px;gap:14px">' +
      '<p class="note w-run-n">✓ nothing to install: Python 3.8 or newer is enough</p>' +
      '<p class="note w-run-n">✓ no GPU needed: it only shows finished results</p>' +
      '<p class="note w-run-n">✓ three.js ships inside the repo: works offline</p></div>' +
      '<div class="w-run-w" style="position:absolute;left:1060px;top:640px;width:760px;height:270px;border-radius:12px;box-sizing:border-box;border:2px solid color-mix(in srgb, var(--main) 55%, var(--ground))"><p style="position:absolute;left:0;right:0;top:0;margin:0;padding:8px 16px;font-family:var(--mono);font-size:20px;color:var(--second);border-bottom:2px solid color-mix(in srgb, var(--main) 35%, var(--ground))">127.0.0.1:8800/viewer</p></div>' +
      '<p class="cap">Anyone who clones our repository types one command. Nothing to install: just Python, which most computers already have.</p>' +
      '<p class="cap">The script unpacks the zipped results, finds a free port, starts a small Python web server and opens the browser.</p>' +
      '<p class="cap">The server only reads files, so nothing can be changed or broken. The 3D library, three.js, ships with the repo, so it even works offline.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.S = VW.mesh(kit, 'vw-dh.json');
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.cmd = q('.w-run-cmd')[0]; this.tn = q('.w-run-t')[0].style; this.b = q('.w-run-b'); this.n = q('.w-run-n'); this.w = q('.w-run-w')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 13.4], t);
    const nch = Math.max(0, Math.min(CMD.length, Math.floor((t - 0.8) * 14))); this.cmd.textContent = CMD.slice(0, nch);
    this.tn.opacity = eo(seg(t, 2.4, 2.9));
    const BT = [6.8, 7.8, 8.8, 9.8]; this.b.forEach((el, i) => { const p = eo(seg(t, BT[i], BT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 20 + 'px)'; });
    this.n.forEach((el, i) => { const p = eo(seg(t, 13.6 + i * 0.8, 14.1 + i * 0.8)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const w = eo(seg(t, 10.4, 11.0)); this.w.opacity = w;
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 3; i++) { const p = eio(seg(t, BT[i] + 0.4, BT[i + 1])); if (p <= 0) continue; const x0 = BX[i] + BW + 12, x1 = BX[i + 1] - 12; PS.arrow(ctx, x0, BY + BH / 2, lerp(x0, x1, p), BY + BH / 2, c.a, 3, 13); }
    const p4 = eio(seg(t, 10.0, 10.6)); if (p4 > 0) PS.arrow(ctx, BX[3] + BW / 2, BY + BH + 10, BX[3] + BW / 2, lerp(BY + BH + 10, 632, p4), c.a, 3, 13);
    if (w > 0) MESH.draw(ctx, this.S, { c, cx: 1440, cy: 800, s: 190, yaw: lerp(-0.6, 0.8, eio(seg(t, 10.4, 20))), pitch: 0.08, colors: this.S.C, edge: 0, fill: w });
  },
});
