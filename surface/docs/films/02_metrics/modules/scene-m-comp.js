const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('m-comp', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Direction 2: dots → mesh</h2></div>' +
      '<div class="words" style="left:180px;top:660px;width:1560px;gap:14px">' +
      '<p class="eq m-comp-e1" style="font-size:46px;white-space:normal">completeness: distance from each dot to the closest point on the mesh</p>' +
      '<p class="note warm m-comp-e2" style="position:static;font-size:30px">no mesh under the dots → long lines = a hole</p></div>' +
      '<p class="note warm m-comp-n" style="left:788px;top:528px">hole</p>' +
      '<p class="cap">Direction 2 goes the other way, from the dots to the mesh. We call it completeness.</p>' +
      '<p class="cap">From every dot, draw a line (dashed) to the closest point on the mesh and measure it.</p>' +
      '<p class="cap">Dots above the hole have long lines: the mesh failed to cover them. Completeness catches holes.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.e1 = kit.stage.querySelector('.m-comp-e1').style; this.e2 = kit.stage.querySelector('.m-comp-e2').style; this.n = kit.stage.querySelector('.m-comp-n').style;
    this.big = TOY.COM.reduce((b, l, i) => l.d > TOY.COM[b].d ? i : b, 0);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 2.6, 9.6], t);
    const ctx = this.k.fx, c = this.c;
    TOY.mesh(ctx, c, 1);
    const far = l => l.d >= TOY.TAU;
    TOY.lines(ctx, TOY.COM, (l, i) => ({ p: eo(seg(t, 3.0 + i * 0.4, 3.4 + i * 0.4)), col: c.s, w: far(l) && t > 9.6 ? 6 : 4, dash: true }));
    TOY.COM.forEach((l, i) => { const p = eo(seg(t, 3.3 + i * 0.4, 3.6 + i * 0.4)); if (p > 0) { ctx.globalAlpha = p; PS.dot(ctx, l.q[0], l.q[1], 7, c.s); ctx.globalAlpha = 1; } });
    TOY.dots(ctx, c, 1);
    ctx.font = '600 26px ' + this.mono; ctx.fillStyle = c.s; ctx.textBaseline = 'middle';
    const L0 = TOY.COM[0], LB = TOY.COM[this.big];
    ctx.globalAlpha = eo(seg(t, 3.8, 4.4)); ctx.textAlign = 'left'; ctx.fillText((L0.d / TOY.MM).toFixed(0) + ' mm', L0.p[0] + 18, 395);
    ctx.globalAlpha = eo(seg(t, 8.4, 9.0)); ctx.textAlign = 'center'; ctx.fillText((LB.d / TOY.MM).toFixed(0) + ' mm', (LB.p[0] + LB.q[0]) / 2, 382);
    ctx.globalAlpha = 1;
    TOY.bracket(ctx, c, 700, 960, 512, eo(seg(t, 10.0, 10.8)));
    this.n.opacity = eo(seg(t, 10.4, 11.0));
    this.e1.opacity = eo(seg(t, 2.8, 3.4)); this.e2.opacity = eo(seg(t, 11.2, 11.8));
  },
});