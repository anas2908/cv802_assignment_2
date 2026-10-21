const { seg, eo, eio, lerp, TextFx } = kit;
const CX = 960, CY = 560, SC = 620;
kit.scene('p-wrap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · The idea</span><h2 class="line">Shrink-wrap</h2></div>' +
      '<div class="words" style="left:110px;top:322px;gap:14px"><p class="note warm p-wrap-n">1 · start loose: the convex hull</p><p class="note warm p-wrap-n">2 · pull it tight onto the dots</p><p class="note warm p-wrap-n">3 · one closed skin, no holes</p></div>' +
      '<p class="cap">Picture plastic wrap around the dots. At first it is loose and touches only the outermost dots: the convex hull.</p>' +
      '<p class="cap">Then the air is sucked out. The wrap is pulled inwards, everywhere at once, until it hugs every dot.</p>' +
      '<p class="cap">The result is one closed skin with no holes. That is Point2Mesh in a picture; the rest is how it pulls.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.p-wrap-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 13.4], t);
    [3.0, 6.8, 13.6].forEach((a, i) => { const p = eo(seg(t, a, a + 0.5)); this.n[i].style.opacity = p; this.n[i].style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const ctx = this.k.fx, c = this.c, br = 1 + 0.008 * Math.sin(t * PS.TAU / 3.2);
    const S = p => [CX + p[0] * SC * br, CY + p[1] * SC * br];
    const d = seg(t, 0.4, 2.4);
    TOY.DOTS.forEach((p, i) => { const a = eo(Math.min(1, Math.max(0, d * 2 - i / TOY.N))); if (a > 0) { ctx.globalAlpha = a; const q = S(p); PS.dot(ctx, q[0], q[1], 5, c.s); } });
    ctx.globalAlpha = 1;
    const w = eio(seg(t, 6.6, 13.0)), h = seg(t, 3.0, 5.0);
    if (h > 0) {
      const P = TOY.WRAP.map((p, k) => S([lerp(p[0], TOY.OUT[k][0], w), lerp(p[1], TOY.OUT[k][1], w)]));
      const fill = eo(seg(t, 13.2, 14.2));
      if (fill > 0) { ctx.globalAlpha = 0.28 * fill; ctx.fillStyle = c.a; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.strokeStyle = c.a; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      PS.poly(ctx, P.concat([P[0]]), eio(h));
      const ar = seg(t, 6.6, 7.2) * (1 - seg(t, 11.6, 12.6));
      if (ar > 0) for (let k = 0; k < TOY.N; k += 8) { const p = P[k], q = S(TOY.OUT[k]), dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); if (L < 8) continue; const m = Math.min(L, 46); ctx.globalAlpha = ar; PS.arrow(ctx, p[0], p[1], p[0] + dx / L * m, p[1] + dy / L * m, c.m, 3, 11); ctx.globalAlpha = 1; }
    }
  },
});