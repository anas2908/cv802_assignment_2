const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('i-trap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 1</span><h2 class="line">The trap: close is not connected</h2></div>' +
      '<p class="note i-trap-n1" style="left:210px;top:734px;color:var(--second)">chest</p>' +
      '<p class="note i-trap-n2" style="left:1140px;top:420px;color:var(--second)">arm</p>' +
      '<p class="cap">Now look from the side at an arm crossed in front of the chest. There are dots on both.</p>' +
      '<p class="cap">The real links run along each surface: along the chest, and around the arm.</p>' +
      '<p class="cap">But the gap between arm and chest is small. A link straight across it is even shorter than the real links.</p>' +
      '<p class="cap">So “nearest neighbours” happily builds triangles across the gap (yellow). Distance alone cannot tell real from fake.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.n1 = kit.stage.querySelector('.i-trap-n1').style; this.n2 = kit.stage.querySelector('.i-trap-n2').style;
    const C = IW.CH, A = IW.ARM;
    this.real = Math.hypot(C[4][0] - C[3][0], C[4][1] - C[3][1]);
    this.fake = Math.hypot(C[10][0] - A[0][0], C[10][1] - A[0][1]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 2.6, 6.8, 11.2], t);
    const ctx = this.k.fx, c = this.c, C = IW.CH, A = IW.ARM;
    IW.links(ctx, c, eio(seg(t, 3.0, 6.0)));
    const tr = eo(seg(t, 11.6, 12.6));
    if (tr > 0) { ctx.globalAlpha = tr; ctx.fillStyle = PS.mix(c.g, c.a, 0.45); ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A[1][0], A[1][1]); ctx.lineTo(C[10][0], C[10][1]); ctx.lineTo(A[17][0], A[17][1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
    const fk = eio(seg(t, 7.2, 8.0));
    if (fk > 0) { ctx.strokeStyle = c.a; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(A[0][0], A[0][1]); ctx.lineTo(lerp(A[0][0], C[10][0], fk), lerp(A[0][1], C[10][1], fk)); ctx.stroke(); }
    IW.dots(ctx, c, i => eo(seg(t, 0.4 + i * 0.03, 0.8 + i * 0.03)));
    ctx.font = '600 22px ' + this.mono; ctx.textBaseline = 'middle';
    const r1 = eo(seg(t, 5.0, 5.6));
    if (r1 > 0) { ctx.globalAlpha = r1; ctx.fillStyle = c.m; ctx.textAlign = 'center'; ctx.fillText(Math.round(this.real) + ' px', (C[3][0] + C[4][0]) / 2, (C[3][1] + C[4][1]) / 2 - 30); }
    const r2 = eo(seg(t, 8.0, 8.6));
    if (r2 > 0) { ctx.globalAlpha = r2; ctx.fillStyle = c.a; ctx.textAlign = 'left'; ctx.fillText(Math.round(this.fake) + ' px', 1052, 666); }
    ctx.globalAlpha = 1;
    this.n1.opacity = eo(seg(t, 1.6, 2.1)); this.n2.opacity = eo(seg(t, 1.8, 2.3));
  },
});