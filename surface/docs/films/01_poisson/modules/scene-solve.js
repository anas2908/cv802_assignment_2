const { seg, eo, eio, lerp, TextFx } = kit;
const CH = [0, 0, 1, 0, 0, -1, 0], X0 = 900, CW = 92;
const VAL = [0, 0, 0, 1, 1, 1, 0, 0];
kit.scene('solve', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 7</span><h2 class="line">Rebuild χ from its changes</h2></div>' +
      '<p class="note solve-a" style="left:1256px;top:418px">body</p>' +
      '<p class="note solve-a" style="left:640px;top:545px">χ = ?</p>' +
      '<p class="note warm solve-a" style="left:640px;top:645px">change</p>' +
      '<p class="note solve-a" style="left:640px;top:745px">stairs</p>' +
      '<div class="words" style="left:110px;top:390px;width:700px"><p class="eq solve-b">Δχ = ∇ · V</p><p class="sub solve-b">find the χ that best agrees with every arrow</p></div>' +
      '<p class="note solve-b solve-res" style="left:110px;top:600px">grid 96³</p>' +
      '<p class="note warm solve-b solve-it num" style="left:110px;top:648px">CG iteration 0</p>' +
      '<p class="note solve-b" style="left:110px;top:700px">error</p>' +
      '<p class="cap">Back to one row of 8 cells crossing the body. We want χ for each cell, but we don’t know it yet.</p>' +
      '<p class="cap">The arrows only tell how χ changes from cell to cell: +1 entering the body, −1 leaving it.</p>' +
      '<p class="cap">Start at 0 and add the changes: 0 0 0 1 1 1 0 0. Like working out stair heights from the steps.</p>' +
      '<p class="cap">Real data: millions of cells, 6 neighbours each, and noisy arrows that never fit perfectly.</p>' +
      '<p class="cap">So the computer guesses χ, checks the error, improves, and repeats: conjugate gradient, on the GPU.</p>' +
      '<p class="cap">To be quick it solves a small blurry grid first, then refines it: 96³ → 192³ → 384³.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.A = [...kit.stage.querySelectorAll('.solve-a')]; this.B = [...kit.stage.querySelectorAll('.solve-b')];
    this.res = kit.stage.querySelector('.solve-res'); this.it = kit.stage.querySelector('.solve-it');
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
  },
  render(t) {
    t = t / 1.5;   // slowed down: the scene runs 24 s instead of 16 s
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 1.8, 4.0, 7.4, 10.2, 13.0], t);
    const ctx = this.k.fx, c = this.c;
    const A = eo(seg(t, 0.3, 0.9)) * (1 - seg(t, 7.0, 7.5));
    this.A.forEach(e => e.style.opacity = A);
    if (A > 0) {
      ctx.globalAlpha = A;
      ctx.fillStyle = PS.mix(c.g, c.m, 0.2); ctx.fillRect(X0 + 3 * CW - 8, 500, 3 * CW + 4, 124);
      ctx.font = '600 32px ' + this.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const fillP = seg(t, 4.1, 6.6) * 8;
      for (let i = 0; i < 8; i++) {
        const x = X0 + i * CW, ap = eo(seg(t, 0.4 + i * 0.08, 0.8 + i * 0.08)), f = eo(Math.min(1, Math.max(0, fillP - i)));
        ctx.globalAlpha = A * ap; ctx.strokeStyle = PS.mix(c.g, c.s, 0.65); ctx.lineWidth = 2; ctx.strokeRect(x, 520, 84, 84);
        if (f > 0 && VAL[i]) { ctx.globalAlpha = A * f; ctx.fillStyle = c.m; ctx.fillRect(x + 2, 522, 80, 80); }
        ctx.globalAlpha = A * ap; ctx.fillStyle = f > 0.5 && VAL[i] ? c.g : c.s;
        ctx.fillText(f > 0.5 ? String(VAL[i]) : '?', x + 42, 563);
      }
      const ar = eo(seg(t, 1.9, 2.6));
      if (ar > 0) { ctx.globalAlpha = A * ar; const b1 = X0 + 3 * CW - 4, b2 = X0 + 6 * CW - 4; PS.arrow(ctx, b1 - 44, 474, b1 + 40, 474, c.a, 5, 18); PS.arrow(ctx, b2 + 44, 474, b2 - 40, 474, c.a, 5, 18); }
      for (let i = 0; i < 7; i++) {
        const p = eo(seg(t, 2.5 + i * 0.12, 2.9 + i * 0.12)); if (p <= 0) continue;
        ctx.globalAlpha = A * p; ctx.fillStyle = CH[i] ? c.a : PS.mix(c.g, c.s, 0.7);
        ctx.fillText(CH[i] > 0 ? '+1' : CH[i] < 0 ? '−1' : '0', X0 + (i + 1) * CW - 4, 664);
      }
      if (fillP > 0) {
        ctx.globalAlpha = A; ctx.strokeStyle = c.m; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
        const xe = X0 + Math.min(8, fillP) * CW;
        for (let x = X0; x <= xe; x += 2) { const i = Math.min(7, Math.floor((x - X0) / CW)); const y = 790 - 70 * VAL[i]; x === X0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    const B = eo(seg(t, 7.4, 8.0));
    this.B.forEach(e => e.style.opacity = B);
    if (B > 0) {
      const lv = t < 12.8 ? 0 : t < 14.3 ? 1 : 2, N = [12, 24, 48][lv];
      const lp = eo(lv === 0 ? seg(t, 7.6, 12.6) : lv === 1 ? seg(t, 12.8, 14.2) : seg(t, 14.3, 15.6));
      const soft = lerp([120, 30, 12][lv], [40, 14, 5][lv], lp);
      const err = lerp([1, 0.5, 0.2][lv], [0.38, 0.16, 0.04][lv], lp);
      this.res.textContent = 'grid ' + ['96³', '192³', '384³'][lv];
      this.it.textContent = 'CG iteration ' + Math.round([600, 300, 250][lv] * lp);
      const x0 = 920, y0 = 222, W = 660, cs = W / N;
      ctx.globalAlpha = B;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = PS.chi(x0 + (i + 0.5) * cs, y0 + (j + 0.5) * cs, soft); ctx.fillStyle = PS.mix(c.g, c.m, v * 0.92); ctx.fillRect(x0 + i * cs, y0 + j * cs, cs + 0.6, cs + 0.6); }
      ctx.strokeStyle = PS.mix(c.g, c.s, 0.4); ctx.lineWidth = 2; ctx.strokeRect(220, 712, 470, 20);
      ctx.fillStyle = c.a; ctx.fillRect(222, 714, 466 * err, 16);
      ctx.globalAlpha = 1;
    }
  },
});