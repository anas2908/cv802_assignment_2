const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('splat', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 6</span><h2 class="line">Arrows onto the grid</h2></div>' +
      '<p class="note warm splat-n" style="left:110px;top:400px">nearer corner, bigger share</p>' +
      '<p class="cap">The solver works on a grid of corners, but our arrows sit on loose dots.</p>' +
      '<p class="cap">Share each dot’s inward arrow among the grid corners around it. Nearer corners get more.</p>' +
      '<p class="cap">Do this for every dot: the grid now holds an arrow field V, non-zero only near the skin.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.note = kit.stage.querySelector('.splat-n').style;
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    const S = 60, X0 = 930, Y0 = 245, NX = 12, NY = 11; Object.assign(this, { S, X0, Y0, NX, NY });
    this.d = PS.dots(64, 8, 0.02);
    const V = []; for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) V.push([0, 0]);
    for (const q of this.d) {
      const fx = (q.x - X0) / S, fy = (q.y - Y0) / S, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
      [[0, 0, (1 - u) * (1 - v)], [1, 0, u * (1 - v)], [0, 1, (1 - u) * v], [1, 1, u * v]].forEach(w => {
        const ii = i + w[0], jj = j + w[1]; if (ii < 0 || jj < 0 || ii >= NX || jj >= NY) return;
        const k = jj * NX + ii; V[k][0] -= q.nx * w[2]; V[k][1] -= q.ny * w[2];
      });
    }
    this.V = V;
    this.f = this.d[5];
    const fx = (this.f.x - X0) / S, fy = (this.f.y - Y0) / S, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    this.fc = [[i, j, (1 - u) * (1 - v)], [i + 1, j, u * (1 - v)], [i, j + 1, (1 - u) * v], [i + 1, j + 1, u * v]];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 1.4, 4.8], t);
    const ctx = this.k.fx, c = this.c, { S, X0, Y0, NX, NY } = this;
    PS.outline(ctx, PS.mix(c.g, c.s, 0.2), 2);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) PS.dot(ctx, X0 + i * S, Y0 + j * S, 3, PS.mix(c.g, c.s, 0.45));
    const fade = 1 - 0.65 * seg(t, 4.6, 5.2);
    this.d.forEach(q => { ctx.globalAlpha = q === this.f ? 1 : fade; PS.dot(ctx, q.x, q.y, 5, c.s); PS.arrow(ctx, q.x, q.y, q.x - q.nx * 34, q.y - q.ny * 34, c.m, 3, 11); });
    ctx.globalAlpha = 1;
    const fp = eo(seg(t, 1.6, 3.2)) * (1 - seg(t, 4.4, 4.9));
    if (fp > 0) {
      const f = this.f; PS.dot(ctx, f.x, f.y, 9, c.a);
      ctx.font = '600 22px ' + this.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      this.fc.forEach(w => {
        const x = X0 + w[0] * S, y = Y0 + w[1] * S;
        ctx.globalAlpha = fp; ctx.strokeStyle = c.a; ctx.lineWidth = 1 + 9 * w[2];
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(x, y); ctx.stroke();
        PS.dot(ctx, x, y, 5 + 10 * w[2], c.a);
        ctx.fillStyle = c.s; ctx.fillText(w[2].toFixed(2), x + (x < f.x ? -34 : 34), y + (y < f.y ? -18 : 18));
      });
      ctx.globalAlpha = 1;
    }
    this.note.opacity = fp;
    const vp = seg(t, 4.9, 8.4);
    if (vp > 0) {
      this.V.forEach((v, k) => {
        const m = Math.hypot(v[0], v[1]); if (m < 0.04) return;
        const i = k % NX, j = Math.floor(k / NX), x = X0 + i * S, y = Y0 + j * S;
        const order = Math.hypot(x - PS.C.cx, y - PS.C.cy) / 420;
        const p = eo(Math.min(1, Math.max(0, vp * 1.8 - order * 0.8))); if (p <= 0) return;
        const L = Math.min(48, 30 * m) * p;
        PS.arrow(ctx, x, y, x + v[0] / m * L, y + v[1] / m * L, c.a, 3, 11);
      });
    }
  },
});