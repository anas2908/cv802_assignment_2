const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('m-scale', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Why “% of the diagonal”?</h2></div>' +
      '<div class="words" style="left:140px;top:320px;gap:20px">' +
      '<p class="note num m-scale-n1" style="position:static;font-size:32px;color:var(--second)">diagonal = 0.00 units</p>' +
      '<p class="note num m-scale-n2" style="position:static;font-size:32px;color:var(--second)">Chamfer = 0.0000 units</p>' +
      '<p class="note warm num m-scale-n3" style="position:static;font-size:36px">Chamfer ÷ diagonal = 0.149 %</p></div>' +
      '<div class="words" style="left:140px;top:670px;width:1000px;gap:16px">' +
      '<p class="eq m-scale-e1" style="font-size:48px;white-space:normal">Chamfer % = (Chamfer ÷ diagonal) × 100</p>' +
      '<p class="note warm num m-scale-e2" style="position:static;font-size:32px">0.149 % × 1.9 m ≈ 2.8 mm (average gap)</p></div>' +
      '<p class="cap">SfM has no real scale: the same person can come out 3 units tall in one run and 7 units tall in another.</p>' +
      '<p class="cap">So we divide by the diagonal of the box around the dots. As the size changes, the percentage stays the same.</p>' +
      '<p class="cap">Our best Poisson: Chamfer 0.149% of the diagonal. The box diagonal is about 1.9 m, so that is about 2.8 mm.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.m-scale-' + k);
    this.n1 = q('n1'); this.n2 = q('n2'); this.n3 = q('n3').style; this.e1 = q('e1').style; this.e2 = q('e2').style;
    this.pts = PS.cloud(1300, 11);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 5.8, 10.8], t);
    const ctx = this.k.fx, c = this.c;
    const s = t < 2 ? 1 : t < 14 ? 1 - 0.42 * (0.5 - 0.5 * Math.cos(PS.TAU * (t - 2) / 6)) : 1;
    const sc = 330 * s, yaw = 0.6 + 0.12 * t;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const P = this.pts.map(p => { const q = PS.project(p, yaw, sc, 1400, 520); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); q.push(p.k); return q; });
    const ap = eo(seg(t, 0.4, 1.4));
    P.forEach(q => { ctx.globalAlpha = ap * 0.85; ctx.fillStyle = q[3] === 'legs' ? c.m : c.s; ctx.fillRect(q[0] - 2, q[1] - 2, 4, 4); });
    const bx = eo(seg(t, 1.4, 2.2));
    if (bx > 0) {
      ctx.globalAlpha = bx; ctx.setLineDash([10, 8]); ctx.strokeStyle = PS.mix(c.g, c.a, 0.7); ctx.lineWidth = 2; ctx.strokeRect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20); ctx.setLineDash([]);
      PS.arrow(ctx, x0 - 10, y1 + 10, x1 + 10, y0 - 10, c.a, 4, 18);
      ctx.font = '600 26px ' + this.mono; ctx.fillStyle = c.a; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('diagonal', x1 + 24, (y0 + y1) / 2);
    }
    ctx.globalAlpha = 1;
    const diag = Math.hypot(x1 - x0 + 20, y1 - y0 + 20) / 100;
    this.n1.textContent = 'diagonal = ' + diag.toFixed(2) + ' units';
    this.n2.textContent = 'Chamfer  = ' + (diag * 0.00149).toFixed(4) + ' units';
    this.n1.style.opacity = eo(seg(t, 2.4, 3.0)); this.n2.style.opacity = eo(seg(t, 3.0, 3.6)); this.n3.opacity = eo(seg(t, 6.4, 7.0));
    this.e1.opacity = eo(seg(t, 7.4, 8.0)); this.e2.opacity = eo(seg(t, 11.2, 11.8));
  },
});