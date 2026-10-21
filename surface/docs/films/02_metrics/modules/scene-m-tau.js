const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('m-tau', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">F-score: close enough?</h2></div>' +
      '<p class="note warm m-tau-r" style="left:330px;top:548px">τ = 4 mm</p>' +
      '<div class="words" style="left:180px;top:668px;width:1560px;gap:14px">' +
      '<p class="eq m-tau-e0" style="font-size:46px;white-space:normal">τ = the largest distance that still counts as “close enough”</p>' +
      '<p class="note m-tau-e1" style="position:static;font-size:30px">blue: shorter than τ → close enough</p>' +
      '<p class="note warm m-tau-e2" style="position:static;font-size:30px">yellow: longer than τ → too far</p></div>' +
      '<p class="cap">Here are both lists of lines again: solid from the mesh, dashed from the dots.</p>' +
      '<p class="cap">The F-score counts instead of averaging. First choose a threshold τ: the largest distance that still counts as close.</p>' +
      '<p class="cap">Every line shorter than τ turns blue. Every longer line stays yellow: too far.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.m-tau-' + k).style;
    this.r = q('r'); this.e0 = q('e0'); this.e1 = q('e1'); this.e2 = q('e2');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 2.6, 7.4], t);
    const ctx = this.k.fx, c = this.c, T = TOY.TAU;
    TOY.mesh(ctx, c, 1);
    const rc = eio(seg(t, 7.6, 9.4));
    const colOf = (l, base) => l.d < T ? PS.mix(base, c.m, rc) : (base === c.s ? PS.mix(c.s, c.a, rc) : c.a);
    const la = eo(seg(t, 0.4, 1.4));
    TOY.lines(ctx, TOY.ACC, l => ({ p: la, col: colOf(l, c.a), w: l.d >= T && rc > 0.5 ? 6 : 4 }));
    TOY.lines(ctx, TOY.COM, l => ({ p: la, col: colOf(l, c.s), w: l.d >= T && rc > 0.5 ? 6 : 4, dash: true }));
    TOY.samples(ctx, c, 1);
    TOY.dots(ctx, c, 1);
    const rp = eio(seg(t, 3.2, 4.2));
    if (rp > 0) {
      ctx.strokeStyle = c.a; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(270, 565); ctx.lineTo(270 + T * rp, 565); ctx.moveTo(270, 553); ctx.lineTo(270, 577); ctx.moveTo(270 + T * rp, 553); ctx.lineTo(270 + T * rp, 577); ctx.stroke();
      const cp = eo(seg(t, 4.6, 5.6));
      [0, 6, 12].forEach(i => { const d = TOY.D[i]; ctx.globalAlpha = cp; ctx.setLineDash([6, 6]); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(d[0], d[1], T, 0, PS.TAU); ctx.stroke(); ctx.setLineDash([]); });
      ctx.globalAlpha = 1;
    }
    this.r.opacity = eo(seg(t, 3.8, 4.3));
    this.e0.opacity = eo(seg(t, 3.0, 3.6)); this.e1.opacity = eo(seg(t, 9.0, 9.6)); this.e2.opacity = eo(seg(t, 9.8, 10.4));
  },
});