const { seg, eo, eio, lerp, TextFx } = kit;
const FLOW = [['A finished run', 'point2mesh-v3-paper-unoriented', 0.6], ['Photo texture', 'a new folder: …-phototex2', 2.0], ['Finalize again', 'keeps the photo texture', 7.0], ['Print export', 'closed meshes: print/figure.stl', 8.4]];
const FX = [110, 545, 980, 1415], FW = 395, FY = 240, FH = 120;
// every Point2Mesh run on VGGSfM with its F@1% and texture: select_best keeps the highest F, then prefers photo texture v2
const P2M = [['point2mesh-v1-it6000', 0.602, 'dots'], ['point2mesh-v2-paper-defaults', 0.646, 'dots'], ['point2mesh-v3-paper-unoriented', 0.844, 'dots'], ['point2mesh-v3-paper-unoriented-phototex', 0.844, 'photos v1'],
  ['point2mesh-v3-paper-unoriented-phototex2', 0.844, 'photos v2'], ['point2mesh-v4-unoriented-20k-phototex2', 0.655, 'photos v2']];
const TY = 470, TH = 52;
kit.scene('r-after', {
  init(kit) {
    let html = '';
    FLOW.forEach(([a, b], i) => { html += '<div class="box r-af-f" style="left:' + FX[i] + 'px;top:' + FY + 'px;width:' + FW + 'px;height:' + FH + 'px;padding:18px 18px"><p style="margin:0;font-size:30px">' + a + '</p><p style="margin:10px 0 0;font-family:var(--mono);font-size:18px;color:var(--main)">' + b + '</p></div>'; });
    html += '<p class="note r-af-t" style="left:150px;top:' + (TY - 44) + 'px;font-size:20px;color:var(--accent)">select_best: every Point2Mesh run on VGGSfM</p><p class="note r-af-t" style="left:760px;top:' + (TY - 44) + 'px;font-size:20px;color:var(--accent)">F@1%</p><p class="note r-af-t" style="left:880px;top:' + (TY - 44) + 'px;font-size:20px;color:var(--accent)">colour</p>';
    P2M.forEach(([r, f, x], i) => { const y = TY + i * TH; html += '<div class="r-af-b" style="position:absolute;left:130px;top:' + (y - 4) + 'px;width:1040px;height:' + (TH - 8) + 'px;border-radius:8px;background:color-mix(in srgb, var(--ground) 82%, var(--main))"></div><div class="r-af-r" style="position:absolute;left:0;top:' + y + 'px;width:1200px;height:' + TH + 'px"><p class="note" style="left:150px;top:2px;font-size:22px;color:var(--second)">' + r + '</p><p class="note" style="left:760px;top:2px;font-size:22px">' + f.toFixed(3) + '</p><p class="note" style="left:880px;top:3px;font-size:20px;color:var(--second)">' + x + '</p></div>'; });
    html += '<p class="note warm r-af-w" style="left:150px;top:' + (TY + 6 * TH + 16) + 'px;font-size:22px">latest → point2mesh-v3-paper-unoriented-phototex2</p>';
    html += '<div class="words r-af-x" style="left:1230px;top:' + (TY - 44) + 'px;width:600px;gap:12px"><p class="eq" style="font-size:38px;color:var(--accent)">DHSP is the exception</p>' +
      '<p class="note" style="font-size:20px;color:var(--second)">dhsp-v5-lap1 (3D prior only)   0.999</p><p class="note" style="font-size:20px;color:var(--main)">…-remesh-optcuts-phototex2   0.901 ★</p>' +
      '<p class="note" style="margin-top:12px;white-space:normal;color:var(--second)">the 3D prior alone scores higher but is crumpled; the finished pipeline is chosen</p></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Running it · After each run</span><h2 class="line">After each run</h2></div>' + html +
      '<p class="cap">When a method’s run is done, more steps follow. First, photo texturing paints it from the photos, as a new run folder of its own.</p>' +
      '<p class="cap">That copy is finalized again, keeping its new photo texture, and measured again. Closed meshes also get their 3D-print export.</p>' +
      '<p class="cap">Then select_best picks each method’s best run: the highest F-score first, and on a tie the photo texture wins.</p>' +
      '<p class="cap">One exception: for DHSP the finished pipeline is preferred, because its 3D-prior-only mesh scores higher but is crumpled.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.f = q('.r-af-f'); this.tt = q('.r-af-t'); this.b = q('.r-af-b'); this.r = q('.r-af-r'); this.w = q('.r-af-w')[0].style; this.x = q('.r-af-x')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.4, 19.8], t);
    this.f.forEach((el, i) => { const p = eo(seg(t, FLOW[i][2], FLOW[i][2] + 0.5)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    this.tt.forEach(el => el.style.opacity = eo(seg(t, 13.4, 13.9)));
    const top = eo(seg(t, 15.2, 15.7)), win = eo(seg(t, 16.6, 17.1));
    P2M.forEach(([, f, x], i) => { const p = eo(seg(t, 13.6 + 0.2 * i, 14.1 + 0.2 * i)); this.r[i].style.opacity = p * (f > 0.8 || top < 0.5 ? 1 : 0.45); this.b[i].style.opacity = f > 0.8 ? (x === 'photos v2' ? Math.max(top * 0.5, win) : top * 0.5 * (1 - win)) : 0; });
    this.w.opacity = eo(seg(t, 17.2, 17.7)); const xp = eo(seg(t, 20.0, 20.6)); this.x.opacity = xp; this.x.transform = 'translateX(' + (1 - xp) * 24 + 'px)';
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 3; i++) { const a = FLOW[i + 1][2] - 0.4, p = eio(seg(t, a, a + 0.4)); if (p <= 0) continue; const x0 = FX[i] + FW + 6, x1 = FX[i + 1] - 6; PS.arrow(ctx, x0, FY + FH / 2, lerp(x0, x1, p), FY + FH / 2, c.a, 3, 10); }
  },
});
