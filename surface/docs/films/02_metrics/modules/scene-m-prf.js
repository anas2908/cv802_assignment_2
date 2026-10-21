const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('m-prf', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Precision, recall, F-score</h2></div>' +
      '<div class="words" style="left:180px;top:660px;width:1560px;gap:14px">' +
      '<p class="eq num m-prf-e1" style="font-size:44px;white-space:normal">P = 0 ÷ 14</p>' +
      '<p class="eq num m-prf-e2" style="font-size:44px;white-space:normal">R = 0 ÷ 13</p>' +
      '<p class="eq num m-prf-e3" style="font-size:46px;white-space:normal;color:var(--accent)">F</p></div>' +
      '<p class="cap">Precision P: of all the mesh points, what share is within τ of a dot? Count the ticks. The invented part pulls it down.</p>' +
      '<p class="cap">Recall R: of all the dots, what share is within τ of the mesh? Count again. The hole pulls it down.</p>' +
      '<p class="cap">The F-score combines the two: F = 2PR ÷ (P + R). It is a number from 0 to 1, and higher is better.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.m-prf-' + k);
    this.e1 = q('e1'); this.e2 = q('e2'); this.e3 = q('e3');
    const P = TOY.P, R = TOY.R, F = 2 * P * R / (P + R);
    this.e3.textContent = 'F = 2 × ' + P.toFixed(2) + ' × ' + R.toFixed(2) + ' ÷ (' + P.toFixed(2) + ' + ' + R.toFixed(2) + ') = ' + F.toFixed(2);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 8.6, 15.4], t);
    const ctx = this.k.fx, c = this.c, T = TOY.TAU;
    const nA = TOY.ACC.length, nC = TOY.COM.length;
    TOY.mesh(ctx, c, 1);
    const aA = t < 8.4 ? eo(seg(t, 0.4, 1.2)) : lerp(1, 0.15, eo(seg(t, 8.4, 9.0)));
    const aC = t < 8.8 ? 0 : t < 15.2 ? eo(seg(t, 8.8, 9.6)) : lerp(1, 0.15, eo(seg(t, 15.2, 15.8)));
    if (t >= 15.2) TOY.lines(ctx, TOY.ACC, l => ({ p: 1, a: 0.15, col: l.d < T ? c.m : c.a, w: 4 }));
    else TOY.lines(ctx, TOY.ACC, l => ({ p: 1, a: aA, col: l.d < T ? c.m : c.a, w: l.d < T ? 4 : 6 }));
    TOY.lines(ctx, TOY.COM, l => ({ p: 1, a: aC, col: l.d < T ? c.m : c.a, w: l.d < T ? 4 : 6, dash: true }));
    TOY.samples(ctx, c, t < 8.4 ? 1 : 0.4);
    TOY.dots(ctx, c, 1);
    let kA = 0, kC = 0;
    TOY.ACC.forEach((l, i) => { const at = 1.6 + i * 0.3, p = eo(seg(t, at, at + 0.25)) * (1 - seg(t, 8.4, 9.0)); if (t >= at && l.d < T) kA++; TOY.mark(ctx, c, l.p[0], 505, l.d < T, p); });
    TOY.COM.forEach((l, i) => { const at = 9.8 + i * 0.3, p = eo(seg(t, at, at + 0.25)) * (1 - seg(t, 15.2, 15.8)); if (t >= at && l.d < T) kC++; TOY.mark(ctx, c, l.p[0], 375, l.d < T, p); });
    this.e1.textContent = t < 6.0 ? 'P = ' + kA + ' ÷ ' + nA : 'P = ' + TOY.nP + ' ÷ ' + nA + ' = ' + TOY.P.toFixed(2);
    this.e2.textContent = t < 13.9 ? 'R = ' + kC + ' ÷ ' + nC : 'R = ' + TOY.nR + ' ÷ ' + nC + ' = ' + TOY.R.toFixed(2);
    this.e1.style.opacity = eo(seg(t, 1.2, 1.7)); this.e2.style.opacity = eo(seg(t, 9.4, 9.9)); this.e3.style.opacity = eo(seg(t, 16.4, 17.0));
  },
});