const { seg, eo, eio, lerp, TextFx } = kit;
const PX = [500, 1180], PY = 550, SC = 520;
kit.scene('g-flat', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">2DGS · The 2D in 2DGS</span><h2 class="line">Why flat disks</h2></div>' +
      '<div class="words" style="left:250px;top:236px;width:500px;align-items:center"><p class="note g-flat-l">3D Gaussian Splatting: blobs</p></div>' +
      '<div class="words" style="left:930px;top:236px;width:500px;align-items:center"><p class="note warm g-flat-l">2DGS: flat disks</p></div>' +
      '<div class="words" style="left:250px;top:830px;width:500px;align-items:center"><p class="note g-flat-q" style="color:var(--second)">where is the surface?</p></div>' +
      '<div class="words" style="left:930px;top:830px;width:500px;align-items:center"><p class="note g-flat-q" style="color:var(--second)">one depth, one arrow each</p></div>' +
      '<div class="words" style="left:1540px;top:330px;width:360px;gap:10px"><p class="note g-flat-r">extra rules:</p><p class="note g-flat-r" style="color:var(--second)">disks on one ray</p><p class="note g-flat-r" style="color:var(--second)">gather together</p><p class="note g-flat-r" style="margin-top:16px;color:var(--second)">each disk’s tilt</p><p class="note g-flat-r" style="color:var(--second)">agrees with the</p><p class="note g-flat-r" style="color:var(--second)">surface around it</p></div>' +
      '<p class="cap">Why flat disks? The older 3D Gaussian Splatting uses round blobs. They redraw photos beautifully, but where exactly is the surface inside a blob?</p>' +
      '<p class="cap">A flat disk has a clear answer: it lies on the surface, with one depth and one arrow, so the shape can be read straight off.</p>' +
      '<p class="cap">Two extra rules help: disks along one ray should gather together, and each disk’s tilt should agree with the surface around it.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.g-flat-l'); this.q = q('.g-flat-q'); this.r = q('.g-flat-r');
    const P = TOY.resample(TOY.SH, 46), r = PS.rng(21);
    this.items = P.map((p, i) => { const a = P[(i + 45) % 46], b = P[(i + 1) % 46], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty); return { p, t: [tx / L, ty / L], n: [-ty / L, tx / L], rx: 0.03 + r() * 0.05, ry: 0.02 + r() * 0.04, ang: r() * Math.PI, off: (r() - 0.5) * 0.06 }; });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.6, 14.4], t);
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, 0.8 + i * 6.8, 1.3 + i * 6.8))); this.q.forEach((el, i) => el.style.opacity = eo(seg(t, 3.6 + i * 6.2, 4.1 + i * 6.2))); this.r.forEach((el, i) => el.style.opacity = eo(seg(t, 14.6 + i * 0.3, 15.1 + i * 0.3)));
    const ctx = this.k.fx, c = this.c, br = 1 + 0.01 * Math.sin(t * 2);
    const a = eo(seg(t, 0.8, 2.4));
    if (a > 0) this.items.forEach((it, i) => { const x = PX[0] + (it.p[0] + it.n[0] * it.off) * SC, y = PY + (it.p[1] + it.n[1] * it.off) * SC; ctx.globalAlpha = a * 0.45; ctx.fillStyle = PS.mix(c.g, [c.m, c.s, c.a][i % 3], 0.6); ctx.beginPath(); ctx.ellipse(x, y, it.rx * SC * br, it.ry * SC * br, it.ang + 0.2 * Math.sin(t * 0.7 + i), 0, PS.TAU); ctx.fill(); });
    ctx.globalAlpha = 1;
    const b = eo(seg(t, 7.6, 9.2));
    if (b > 0) this.items.forEach((it, i) => { const x = PX[1] + it.p[0] * SC, y = PY + it.p[1] * SC, h = 0.045 * SC; ctx.globalAlpha = b; ctx.strokeStyle = PS.mix(c.g, [c.m, c.s, c.a][i % 3], 0.85); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - it.t[0] * h, y - it.t[1] * h); ctx.lineTo(x + it.t[0] * h, y + it.t[1] * h); ctx.stroke(); const ar = eo(seg(t, 10.0, 11.0)); if (ar > 0 && i % 2 === 0) { ctx.globalAlpha = b * ar; PS.arrow(ctx, x, y, x + it.n[0] * 34, y + it.n[1] * 34, c.a, 2.5, 9); } });
    ctx.globalAlpha = 1;
  },
});