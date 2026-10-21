const { seg, eo, eio, lerp, TextFx } = kit;
const CX = 960, CY = 560, SC = 620, BX = 1430, BW = 380;
kit.scene('p-push', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Moving the skin</span><h2 class="line">Pushing the corners</h2></div>' +
      '<div class="words" style="left:110px;top:322px;gap:14px"><p class="note p-push-n">push: a small step for every corner</p><p class="note p-push-n">goal: shrink the gap to the dots</p><p class="note warm p-push-n">problem: the noise gets copied</p></div>' +
      '<p class="note p-push-g" style="left:' + BX + 'px;top:300px">gap to the dots</p>' +
      '<p class="note p-push-g" style="left:' + BX + 'px;top:400px;color:var(--second)">(the Chamfer distance)</p>' +
      '<p class="note warm p-push-t" style="left:1380px;top:640px">dashed: the real, smooth edge</p>' +
      '<p class="cap">The skin is a mesh, so it moves by pushing its corners. Every step, each corner gets a small push.</p>' +
      '<p class="cap">Which way? Whichever shrinks the gap between skin and dots: the Chamfer distance from the Metrics video.</p>' +
      '<p class="cap">Pushed freely, each corner just runs to its nearest dots, noise and all. The gap is tiny, but the skin is jagged.</p>' +
      '<p class="cap">A scan always has noise. We want a skin that follows the shape, not every wobble. That needs something smarter.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.p-push-n'); this.g = q('.p-push-g'); this.tt = q('.p-push-t')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.4, 12.2, 17.2], t);
    [0.8, 5.6, 12.4].forEach((a, i) => { const p = eo(seg(t, a, a + 0.5)); this.n[i].style.opacity = p; this.n[i].style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    this.g.forEach(el => el.style.opacity = eo(seg(t, 2.0, 2.5))); this.tt.opacity = eo(seg(t, 13.2, 13.7));
    const ctx = this.k.fx, c = this.c, S = p => [CX + p[0] * SC, CY + p[1] * SC];
    TOY.DOTS.forEach(p => { const q = S(p); PS.dot(ctx, q[0], q[1], 5, c.s); });
    const m = eio(seg(t, 5.8, 11.6));
    const P = TOY.WRAP.map((p, k) => S([lerp(p[0], TOY.DOTS[k][0], m), lerp(p[1], TOY.DOTS[k][1], m)]));
    const tr = eo(seg(t, 13.0, 14.0));
    if (tr > 0) { ctx.globalAlpha = tr; ctx.setLineDash([10, 10]); ctx.strokeStyle = c.s; ctx.lineWidth = 3; const O = TOY.OUT.map(S); ctx.beginPath(); O.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke();
    P.forEach(q => PS.dot(ctx, q[0], q[1], 3.5, c.a));
    const gl = eo(seg(t, 2.0, 2.8)) * (1 - eo(seg(t, 10.8, 11.8)));
    if (gl > 0) { ctx.globalAlpha = gl * 0.9; ctx.strokeStyle = c.m; ctx.lineWidth = 2; for (let k = 0; k < TOY.N; k += 4) { const a = P[k], b = S(TOY.DOTS[k]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } ctx.globalAlpha = 1; }
    const ar = eo(seg(t, 3.0, 3.6)) * (1 - eo(seg(t, 6.4, 7.2)));
    if (ar > 0) for (let k = 2; k < TOY.N; k += 8) { const a = P[k], b = S(TOY.DOTS[k]), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 10) continue; const s = Math.min(L, 40); ctx.globalAlpha = ar; PS.arrow(ctx, a[0], a[1], a[0] + dx / L * s, a[1] + dy / L * s, c.s, 3, 11); ctx.globalAlpha = 1; }
    const ga = eo(seg(t, 2.0, 2.5));
    if (ga > 0) {
      let g = 0, g0 = 0; for (let k = 0; k < TOY.N; k++) { const b = S(TOY.DOTS[k]), w = S(TOY.WRAP[k]); g += Math.hypot(P[k][0] - b[0], P[k][1] - b[1]); g0 += Math.hypot(w[0] - b[0], w[1] - b[1]); }
      const f = g / g0; ctx.globalAlpha = ga; ctx.fillStyle = PS.mix(c.g, c.m, 0.25); ctx.fillRect(BX, 350, BW, 34); ctx.fillStyle = c.m; ctx.fillRect(BX, 350, BW * f, 34); ctx.globalAlpha = 1;
    }
  },
});