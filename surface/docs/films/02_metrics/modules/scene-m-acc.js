const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('m-acc', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Direction 1: mesh → dots</h2></div>' +
      '<div class="words" style="left:180px;top:660px;width:1560px;gap:14px">' +
      '<p class="eq m-acc-e1" style="font-size:46px;white-space:normal">accuracy: distance from each mesh point to its nearest dot</p>' +
      '<p class="note warm m-acc-e2" style="position:static;font-size:30px">no dots behind the mesh → long lines = invented skin</p></div>' +
      '<p class="note warm m-acc-n" style="left:1490px;top:528px">no dots here</p>' +
      '<p class="cap">Direction 1 goes from the mesh to the dots. We call it accuracy.</p>' +
      '<p class="cap">Put sample points (yellow) along the mesh. From each one, draw a line to the nearest dot and measure it.</p>' +
      '<p class="cap">Where the mesh has no dots behind it, the lines get long. Accuracy catches invented skin.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.e1 = kit.stage.querySelector('.m-acc-e1').style; this.e2 = kit.stage.querySelector('.m-acc-e2').style; this.n = kit.stage.querySelector('.m-acc-n').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 3.4, 9.8], t);
    const ctx = this.k.fx, c = this.c;
    TOY.mesh(ctx, c, 1);
    TOY.dots(ctx, c, 1);
    const far = l => l.d >= TOY.TAU;
    TOY.lines(ctx, TOY.ACC, (l, i) => ({ p: eo(seg(t, 3.8 + i * 0.36, 4.2 + i * 0.36)), col: c.a, w: far(l) && t > 9.8 ? 6 : 4 }));
    TOY.samples(ctx, c, i => eo(seg(t, 1.4 + i * 0.12, 1.8 + i * 0.12)));
    ctx.font = '600 26px ' + this.mono; ctx.fillStyle = c.a; ctx.textBaseline = 'middle';
    const L0 = TOY.ACC[0], LN = TOY.ACC[TOY.ACC.length - 1];
    ctx.globalAlpha = eo(seg(t, 4.6, 5.2)); ctx.textAlign = 'left'; ctx.fillText((L0.d / TOY.MM).toFixed(0) + ' mm', L0.p[0] + 18, 395);
    ctx.globalAlpha = eo(seg(t, 9.0, 9.6)); ctx.textAlign = 'center'; ctx.fillText((LN.d / TOY.MM).toFixed(0) + ' mm', (LN.p[0] + LN.q[0]) / 2, 395);
    ctx.globalAlpha = 1;
    TOY.bracket(ctx, c, 1500, 1760, 512, eo(seg(t, 10.2, 11.0)));
    this.n.opacity = eo(seg(t, 10.6, 11.2));
    this.e1.opacity = eo(seg(t, 3.6, 4.2)); this.e2.opacity = eo(seg(t, 11.4, 12.0));
  },
});