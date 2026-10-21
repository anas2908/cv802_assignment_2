const { seg, eo, eio, lerp, TextFx } = kit;
const Q = [250, 225, 660];
kit.scene('n-bumps', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">NKSR · Toy in 2D</span><h2 class="line">A field of bumps</h2></div>' +
      '<div class="words" style="left:1010px;top:270px;width:840px;gap:14px">' +
      '<p class="note n-bumps-n">cells only near the dots: sparse</p>' +
      '<p class="note n-bumps-n">each cell holds one bump that fades to zero</p>' +
      '<p class="note warm n-bumps-n">ask: 0 on each dot, +ε just outside, −ε just inside</p>' +
      '<p class="eq n-bumps-n" style="font-size:44px;margin-top:10px">(AᵀA + λI) α = Aᵀb</p>' +
      '<p class="note num n-bumps-m" style="color:var(--second)">bumps</p>' +
      '<p class="note n-bumps-n" style="margin-top:10px">the weighted bumps add up to the function</p>' +
      '<p class="note warm n-bumps-n">its zero line is the surface</p></div>' +
      '<p class="cap">In 2D: dots along an outline, each with an arrow pointing out, just like the arrows from Video 1.</p>' +
      '<p class="cap">NKSR places small cells only where there are dots. Each cell holds one bump: a little hill that fades to zero.</p>' +
      '<p class="cap">Each bump gets a weight. We ask for zero on every dot, a little above zero just outside, a little below just inside.</p>' +
      '<p class="cap">That is one linear system for all the weights at once. Even in this browser it is solved in about a second.</p>' +
      '<p class="cap">Add up the weighted bumps and you get the function: blue outside, gold inside. Its zero line is the surface.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.n-bumps-n'); this.m = q('.n-bumps-m')[0];
    const P = TOY.resample(TOY.SH, 120), r = PS.rng(3);
    this.D = P.map((p, i) => { const a = P[(i + 119) % 120], b = P[(i + 1) % 120], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty); return { p: [p[0] + (r() - 0.5) * 0.02, p[1] + (r() - 0.5) * 0.02], n: [-ty / L, tx / L] }; });
    this.S = KT.solve(this.D, { dil: 1, lam: 1e-4 }); this.img = KT.image(this.S, this.c, 0.1);
    this.m.textContent = this.S.M + ' bumps → ' + this.S.M + ' weights, solved together';
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.6, 11.0, 16.4, 21.6], t);
    const NT = [3.6, 6.8, 11.4, 16.6, 17.2, 22.0, 24.4];
    [...this.n.slice(0, 4), this.m, ...this.n.slice(4)].forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c, S = this.S, map = (x, y) => [Q[0] + (x + 0.78) / 1.56 * Q[2], Q[1] + (y + 0.78) / 1.56 * Q[2]], px = Q[2] / 1.56;
    const hm = eo(seg(t, 21.6, 23.4));
    if (hm > 0 && this.img) { ctx.globalAlpha = hm; ctx.drawImage(this.img, Q[0], Q[1], Q[2], Q[2]); ctx.globalAlpha = 1; }
    const ce = eo(seg(t, 3.4, 5.4)) * (1 - 0.6 * eo(seg(t, 21.6, 23.0)));
    if (ce > 0) { const h = 0.075 * px; ctx.strokeStyle = PS.mix(c.g, c.m, 0.8); ctx.lineWidth = 1.5; for (let j = 0; j < S.nFine; j++) { const v = Math.min(1, Math.max(0, ce * 1.6 - j / S.nFine * 0.6)); if (v <= 0) continue; ctx.globalAlpha = v * 0.8; const p = map(S.C[j][0], S.C[j][1]); ctx.strokeRect(p[0] - h / 2, p[1] - h / 2, h, h); } ctx.globalAlpha = 1; }
    const bu = eo(seg(t, 6.6, 8.6)) * (1 - eo(seg(t, 15.0, 16.0)));
    if (bu > 0) { ctx.lineWidth = 2; for (let j = 0; j < S.nFine; j += 9) { const p = map(S.C[j][0], S.C[j][1]); const g = ctx.createRadialGradient ? null : null; ctx.globalAlpha = bu * 0.55; ctx.strokeStyle = c.a; ctx.beginPath(); ctx.arc(p[0], p[1], S.C[j][2] * px, 0, PS.TAU); ctx.stroke(); ctx.globalAlpha = bu * 0.9; PS.dot(ctx, p[0], p[1], 4, c.a); } ctx.globalAlpha = 1; }
    const cs = eo(seg(t, 11.2, 12.4)) * (1 - eo(seg(t, 20.0, 21.0)));
    if (cs > 0) { ctx.font = '600 22px ' + kit.fonts.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (let i = 0; i < this.D.length; i += 10) { const d = this.D[i], e = 0.07; [[1, '+', c.m], [-1, '−', c.a]].forEach(([s, sym, col]) => { const p = map(d.p[0] + s * e * d.n[0], d.p[1] + s * e * d.n[1]); ctx.globalAlpha = cs; ctx.fillStyle = col; ctx.fillText(sym, p[0], p[1]); }); const p0 = map(d.p[0], d.p[1]); ctx.fillStyle = c.s; ctx.fillText('0', p0[0] + 14, p0[1] - 14); } ctx.globalAlpha = 1; }
    const da = eo(seg(t, 0.4, 1.6));
    ctx.lineCap = 'round';
    this.D.forEach((d, i) => { const p = map(d.p[0], d.p[1]); ctx.globalAlpha = da; PS.dot(ctx, p[0], p[1], 4, c.s); const ar = eo(seg(t, 1.6, 2.8)) * (1 - 0.7 * eo(seg(t, 21.6, 22.6))); if (ar > 0 && i % 3 === 0) { ctx.globalAlpha = ar; ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + d.n[0] * 26, p[1] + d.n[1] * 26); ctx.stroke(); } });
    ctx.globalAlpha = 1;
    const ct = eo(seg(t, 23.4, 25.0));
    if (ct > 0) { ctx.globalAlpha = ct; ctx.strokeStyle = c.s; ctx.lineWidth = 3.5; S.segs.forEach(s => { if (s[2] > 0.06) return; const a = map(s[0][0], s[0][1]), b = map(s[1][0], s[1][1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }); ctx.globalAlpha = 1; }
  },
});