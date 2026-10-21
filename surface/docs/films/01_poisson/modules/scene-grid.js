const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('grid', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 2</span><h2 class="line">Inside or outside?</h2></div>' +
      '<div class="words" style="left:110px;top:380px;width:620px"><p class="eq grid-eq">χ = 1 inside, 0 outside</p>' +
      '<p class="sub grid-sub">χ (chi) is the indicator function</p></div>' +
      '<p class="cap">Take one slice through the body. The dots trace its outline.</p>' +
      '<p class="cap">Fill the space with tiny cells and ask each one: are you inside the body, or outside?</p>' +
      '<p class="cap">Inside = 1, outside = 0. This 0/1 map is called χ.</p>' +
      '<p class="cap">The skin is simply the border between the 1s and the 0s.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.eq = kit.stage.querySelector('.grid-eq').style;
    this.sub = kit.stage.querySelector('.grid-sub').style;
    this.d = PS.dots(70, 3, 0.03);
    this.S = 34; this.x0 = 896; this.y0 = 198; this.N = 21;
    this.cells = [];
    for (let j = 0; j < this.N; j++) for (let i = 0; i < this.N; i++) {
      const x = this.x0 + i * this.S, y = this.y0 + j * this.S;
      this.cells.push({ x, y, i, j, in: PS.inside(x + this.S / 2, y + this.S / 2) });
    }
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 2.0, 5.4, 8.2], t);
    const ctx = this.k.fx, c = this.c, S = this.S, N = this.N;
    const g = eo(seg(t, 1.9, 2.9));
    const sweep = seg(t, 3.0, 5.6);
    for (const cell of this.cells) {
      const p = eo(Math.min(1, Math.max(0, sweep * (N + 6) - cell.i - cell.j * 0.25)));
      if (p <= 0) continue;
      ctx.globalAlpha = p * (cell.in ? 0.62 : 0.10);
      ctx.fillStyle = cell.in ? c.m : c.s;
      ctx.fillRect(cell.x + 1.5, cell.y + 1.5, S - 3, S - 3);
    }
    ctx.globalAlpha = g * 0.35; ctx.strokeStyle = c.s; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { ctx.moveTo(this.x0 + i * S, this.y0); ctx.lineTo(this.x0 + i * S, this.y0 + N * S); ctx.moveTo(this.x0, this.y0 + i * S); ctx.lineTo(this.x0 + N * S, this.y0 + i * S); }
    ctx.stroke();
    ctx.globalAlpha = 1;
    const rowP = seg(t, 5.8, 7.6), row = 10;
    if (rowP > 0) {
      ctx.font = '600 17px ' + this.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const cell of this.cells) {
        if (cell.j !== row) continue;
        const p = eo(Math.min(1, Math.max(0, rowP * (N + 3) - cell.i)));
        ctx.globalAlpha = p; ctx.fillStyle = cell.in ? c.g : c.s;
        ctx.fillText(cell.in ? '1' : '0', cell.x + S / 2, cell.y + S / 2 + 1);
      }
      ctx.globalAlpha = 1;
    }
    const ap = eo(seg(t, 0.1, 1.5));
    this.d.forEach((q, i) => PS.dot(ctx, q.x, q.y, 5 * eo(Math.min(1, Math.max(0, ap * 1.6 - i / this.d.length * 0.6))), c.s));
    const cp = eio(seg(t, 8.3, 9.8));
    if (cp > 0) { ctx.shadowColor = c.a; ctx.shadowBlur = 12; PS.outline(ctx, c.a, 5, -Math.PI / 2, -Math.PI / 2 + PS.TAU * cp); ctx.shadowBlur = 0; }
    this.eq.opacity = eo(seg(t, 5.6, 6.2)); this.sub.opacity = eo(seg(t, 6.0, 6.6));
  },
});