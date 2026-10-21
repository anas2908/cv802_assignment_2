const { seg, eo, eio, lerp, TextFx } = kit;
const OX = 760, OY = 590, OS = 600, FR = [360, 270, 1160, 910], GAP = [0.08, 0.30];
const P1 = [-0.1, 0.2], P2 = [-0.55, 0.2];
kit.scene('x-inside', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · The slicer</span><h2 class="line">Inside or outside?</h2></div>' +
      '<div class="words" style="left:1240px;top:320px;width:600px;gap:12px">' +
      '<p class="note x-in-n">ray from A: 1 crossing → inside</p>' +
      '<p class="note x-in-n" style="color:var(--second)">ray from B: 2 crossings → outside</p>' +
      '<p class="eq x-in-n" style="font-size:40px;margin-top:20px">odd: inside · even: outside</p>' +
      '<p class="note warm x-in-n" style="margin-top:40px">a gap: A’s ray now crosses 0 times</p>' +
      '<p class="note warm x-in-n">so A is called outside: wrong</p>' +
      '<p class="eq x-in-n" style="font-size:40px;margin-top:20px;color:var(--accent)">the fill leaks out</p></div>' +
      '<p class="note x-in-l" style="left:' + (OX + P1[0] * OS - 14) + 'px;top:' + (OY + P1[1] * OS - 52) + 'px">A</p>' +
      '<p class="note x-in-l" style="left:' + (OX + P2[0] * OS - 14) + 'px;top:' + (OY + P2[1] * OS - 52) + 'px;color:var(--second)">B</p>' +
      '<p class="cap">How does the slicer know what is inside? From a point it sends a ray sideways and counts how often it crosses the outline.</p>' +
      '<p class="cap">An odd count means inside, an even count means outside. With a closed outline this works everywhere, and the fill is perfect.</p>' +
      '<p class="cap">Now open a small gap. Rays through it miscount, and the fill leaks out of the figure. So every outline must be closed.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.x-in-n'); this.l = q('.x-in-l');
    // the shirt outline as segments, its right side split so a gap can open between y = 0.08 and 0.30
    const SH = TOY.SH, segs = [];
    for (let i = 0; i < SH.length; i++) { const a = SH[i], b = SH[(i + 1) % SH.length]; if (i === 8) { segs.push([a, [0.32, GAP[0]], 0], [[0.32, GAP[0]], [0.32, GAP[1]], 1], [[0.32, GAP[1]], b, 0]); } else segs.push([a, b, 0]); }
    this.segs = segs.map(([a, b, g]) => [[OX + a[0] * OS, OY + a[1] * OS], [OX + b[0] * OS, OY + b[1] * OS], g]);
    this.rows = []; for (let y = FR[1] + 14.3; y < FR[3] - 10; y += 12.7) this.rows.push(y);
  },
  hits(y, open) { const xs = []; this.segs.forEach(([a, b, g]) => { if (open && g) return; if ((a[1] - y) * (b[1] - y) < 0) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])); }); return xs.sort((p, q) => p - q); },
  ray(ctx, P, prog, open, al) {
    const c = this.c, x0 = OX + P[0] * OS, y0 = OY + P[1] * OS, x1 = lerp(x0, FR[2], prog);
    ctx.globalAlpha = al; PS.dot(ctx, x0, y0, 9, c.s); ctx.strokeStyle = c.s; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(x0 + 12, y0); ctx.lineTo(x1, y0); ctx.stroke(); ctx.setLineDash([]);
    this.hits(y0, open).filter(x => x > x0 && x < x1).forEach(x => { ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y0, 12, 0, PS.TAU); ctx.stroke(); });
    ctx.globalAlpha = 1;
  },
  sweep(ctx, prog, open, al) {
    const c = this.c, n = Math.floor(prog * this.rows.length); ctx.globalAlpha = al; ctx.lineWidth = 6; ctx.lineCap = 'butt';
    for (let r = 0; r < n; r++) { const y = this.rows[r], xs = this.hits(y, open); ctx.strokeStyle = PS.mix(c.g, c.m, 0.7); ctx.beginPath(); for (let k = 0; k + 1 < xs.length; k += 2) { ctx.moveTo(xs[k] + 4, y); ctx.lineTo(xs[k + 1] - 4, y); } ctx.stroke(); if (xs.length % 2) { ctx.strokeStyle = c.a; ctx.beginPath(); ctx.moveTo(xs[xs.length - 1] + 4, y); ctx.lineTo(FR[2] - 4, y); ctx.stroke(); } }
    ctx.globalAlpha = 1;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 14.4], t);
    const NT = [3.8, 6.0, 7.8, 16.6, 17.2, 19.0]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.l[0].style.opacity = Math.max(eo(seg(t, 2.4, 2.9)) * (1 - eo(seg(t, 7.4, 7.9))), eo(seg(t, 15.2, 15.6)) * (1 - eo(seg(t, 17.0, 17.4)))); this.l[1].style.opacity = eo(seg(t, 4.6, 5.1)) * (1 - eo(seg(t, 7.4, 7.9)));
    const ctx = this.k.fx, c = this.c, open = t >= 14.4, gp = eo(seg(t, 14.4, 15.0));
    ctx.globalAlpha = eo(seg(t, 0.2, 0.8)) * 0.5; ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]); ctx.strokeRect(FR[0], FR[1], FR[2] - FR[0], FR[3] - FR[1]); ctx.setLineDash([]); ctx.globalAlpha = 1;
    // the fills: closed (fades when the gap opens), then open with leaks
    const f1 = 1 - eo(seg(t, 14.0, 14.4)); if (t >= 8.2 && f1 > 0) this.sweep(ctx, seg(t, 8.2, 12.6), false, f1);
    if (t >= 17.4) this.sweep(ctx, seg(t, 17.4, 20.8), true, 1);
    // the outline, drawn on in order; the gap piece fades out
    const op = eio(seg(t, 0.6, 2.0)), ns = Math.ceil(op * this.segs.length);
    ctx.strokeStyle = c.s; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < ns; i++) { const [a, b, g] = this.segs[i]; ctx.globalAlpha = g ? 1 - gp : 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (gp > 0) { const x = OX + 0.32 * OS; [GAP[0], GAP[1]].forEach(y => PS.dot(ctx, x, OY + y * OS, 5, c.a)); }
    // the rays
    const r1 = 1 - eo(seg(t, 7.4, 7.9)); if (t >= 2.6 && r1 > 0) this.ray(ctx, P1, eio(seg(t, 2.6, 3.6)), false, r1);
    if (t >= 4.8 && r1 > 0) this.ray(ctx, P2, eio(seg(t, 4.8, 5.8)), false, r1);
    const r3 = 1 - eo(seg(t, 17.0, 17.4)); if (t >= 15.4 && r3 > 0) this.ray(ctx, P1, eio(seg(t, 15.4, 16.4)), true, r3);
  },
});
