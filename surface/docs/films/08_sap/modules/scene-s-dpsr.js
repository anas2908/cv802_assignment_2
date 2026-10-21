const { seg, eo, eio, lerp, TextFx } = kit;
const Q = [250, 225, 660];
kit.scene('s-dpsr', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">SAP · Differentiable Poisson, in 2D</span><h2 class="line">Poisson in one step</h2></div>' +
      '<div class="words" style="left:1010px;top:262px;width:860px;gap:12px">' +
      '<p class="note s-dpsr-n">1 · spread each arrow onto the nearest grid cells</p>' +
      '<p class="note s-dpsr-n">2 · FFT: the grid becomes a sum of waves</p>' +
      '<p class="eq s-dpsr-n" style="font-size:44px;margin:6px 0">χ̂(ω) = iω · V̂(ω) / (−|ω|²)</p>' +
      '<p class="note warm s-dpsr-n">3 · one division per wave, then a little smoothing</p>' +
      '<p class="note s-dpsr-n">4 · FFT back: the inside-outside function</p>' +
      '<p class="note s-dpsr-n">5 · its zero line is the surface</p></div>' +
      '<p class="cap">Here is SAP’s Poisson solver in 2D, running live in this page. Start with points and their arrows.</p>' +
      '<p class="cap">Each arrow is spread onto its nearest grid cells, giving a grid of arrows.</p>' +
      '<p class="cap">An FFT rewrites that grid as a sum of waves. For waves, Poisson’s equation is a single division per wave: no iterations.</p>' +
      '<p class="cap">Divide, smooth a little, transform back: the inside-outside function appears. The whole solve takes milliseconds.</p>' +
      '<p class="cap">Its zero line is the surface. Our own Poisson in Video 1 needed hundreds of solver steps; with waves it is one go.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.s-dpsr-n');
    const P = TOY.resample(TOY.SH, 160), r = PS.rng(3);
    this.D = P.map((p, i) => { const a = P[(i + 159) % 160], b = P[(i + 1) % 160], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty); return { p: [p[0] + (r() - 0.5) * 0.02, p[1] + (r() - 0.5) * 0.02], n: [-ty / L, tx / L] }; });
    this.S = DP.solve(this.D, {}); this.img = DP.image(this.S, this.c);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.4, 10.4, 16.4, 22.4], t);
    const NT = [3.2, 8.6, 10.6, 15.2, 16.6, 22.6];
    this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c, S = this.S, N = S.N, map = (x, y) => [Q[0] + (x + S.B) / (2 * S.B) * Q[2], Q[1] + (y + S.B) / (2 * S.B) * Q[2]], cp = Q[2] / N;
    const hm = eo(seg(t, 16.4, 18.4));
    if (hm > 0 && this.img) { ctx.globalAlpha = hm; ctx.imageSmoothingEnabled = true; ctx.drawImage(this.img, Q[0], Q[1], Q[2], Q[2]); ctx.globalAlpha = 1; }
    const gr = eo(seg(t, 3.0, 4.2)) * (1 - eo(seg(t, 16.0, 17.0)));
    if (gr > 0) { ctx.globalAlpha = gr * 0.35; ctx.strokeStyle = c.m; ctx.lineWidth = 1; for (let i = 0; i <= N; i += 4) { ctx.beginPath(); ctx.moveTo(Q[0] + i * cp, Q[1]); ctx.lineTo(Q[0] + i * cp, Q[1] + Q[2]); ctx.moveTo(Q[0], Q[1] + i * cp); ctx.lineTo(Q[0] + Q[2], Q[1] + i * cp); ctx.stroke(); } ctx.globalAlpha = 1; }
    const sp = eo(seg(t, 5.6, 7.4)) * (1 - eo(seg(t, 16.0, 17.0)));
    if (sp > 0) { ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.lineCap = 'round'; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = y * N + x, vx = S.Vx[k], vy = S.Vy[k], L = Math.hypot(vx, vy); if (L < 0.15) continue; const cx = Q[0] + (x + 0.5) * cp, cy = Q[1] + (y + 0.5) * cp, s = Math.min(1, L) * cp * 1.1; ctx.globalAlpha = sp * Math.min(1, L); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + vx / L * s, cy + vy / L * s); ctx.stroke(); } ctx.globalAlpha = 1; }
    const wv = eo(seg(t, 9.0, 10.4)) * (1 - eo(seg(t, 15.0, 16.0)));
    if (wv > 0) [[1, 0], [1, 1], [3, 1]].forEach(([fx, fy], k) => { const x0 = 1080 + k * 250, y0 = 640, sz = 180; ctx.globalAlpha = wv; for (let j = 0; j < 30; j++) for (let i = 0; i < 30; i++) { const v = 0.5 + 0.5 * Math.cos(2 * Math.PI * (fx * i + fy * j) / 30 + t * 1.5); ctx.fillStyle = PS.mix(c.g, k === 1 ? c.a : c.m, 0.15 + 0.7 * v); ctx.fillRect(x0 + i * sz / 30, y0 + j * sz / 30, sz / 30 + 0.5, sz / 30 + 0.5); } ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2; ctx.strokeRect(x0, y0, sz, sz); ctx.globalAlpha = 1; });
    const da = eo(seg(t, 0.4, 1.4)), ar = eo(seg(t, 1.2, 2.2)) * (1 - eo(seg(t, 5.6, 6.6)));
    ctx.lineCap = 'round';
    this.D.forEach((d, i) => { const p = map(d.p[0], d.p[1]); ctx.globalAlpha = da; PS.dot(ctx, p[0], p[1], 3.6, c.s); if (ar > 0 && i % 4 === 0) { ctx.globalAlpha = ar; ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + d.n[0] * 26, p[1] + d.n[1] * 26); ctx.stroke(); } });
    ctx.globalAlpha = 1;
    const ct = eo(seg(t, 22.6, 24.2));
    if (ct > 0) { ctx.globalAlpha = ct; ctx.strokeStyle = c.s; ctx.lineWidth = 3.5; S.segs.forEach(s => { const a = map(s[0][0], s[0][1]), b = map(s[1][0], s[1][1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }); ctx.globalAlpha = 1; }
  },
});