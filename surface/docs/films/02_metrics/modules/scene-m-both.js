const { seg, eo, eio, lerp, TextFx } = kit;
const R1 = 390, R2 = 640;
function arc(ctx, a, b, p, col, w, dash, up) {
  if (p <= 0) return; const L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.min(0.1, 0.0001 * L) * L;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - (L > 60 ? k * up : 0);
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; if (dash) ctx.setLineDash([9, 8]);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); const n = 24, m = Math.ceil(n * p);
  for (let i = 1; i <= m; i++) { const s = Math.min(p, i / n); const x = (1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * mx + s * s * b[0], y = (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * my + s * s * b[1]; ctx.lineTo(x, y); }
  ctx.stroke(); ctx.setLineDash([]);
}
kit.scene('m-both', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Why measure both ways?</h2></div>' +
      '<p class="note m-both-a" style="left:180px;top:428px;color:var(--second)">a tiny mesh  ·  accuracy good  ·  completeness bad</p>' +
      '<p class="note m-both-b" style="left:180px;top:684px;color:var(--second)">a mesh much longer than the dots  ·  completeness good  ·  accuracy bad</p>' +
      '<p class="cap">Why do we need both directions? Look at two meshes that each cheat one of them.</p>' +
      '<p class="cap">A tiny mesh next to one dot: all of it is near a dot, so accuracy is perfect. But most dots are far from it.</p>' +
      '<p class="cap">A mesh much longer than the dots: every dot is covered, so completeness is perfect. But most of the mesh is invented.</p>' +
      '<p class="cap">Each one passes one test and fails the other. Only a mesh that is good both ways really fits the dots.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.la = kit.stage.querySelector('.m-both-a').style; this.lb = kit.stage.querySelector('.m-both-b').style;
    const J = [-6, 5, -3, 7, -5, 4, -7, 6, -2, 5, -4];
    this.d1 = J.map((j, k) => [360 + k * 120, R1 - 20 + j]); this.m1 = [330, 430];
    this.d2 = J.slice(0, 7).map((j, k) => [660 + k * 100, R2 - 20 + j]); this.m2 = [200, 1720];
    this.s2 = []; for (let x = 200; x <= 1720; x += 95) this.s2.push([x, R2]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 2.6, 7.0, 11.6], t);
    const ctx = this.k.fx, c = this.c;
    const a1 = eo(seg(t, 0.8, 1.6));
    if (a1 > 0) {
      ctx.globalAlpha = a1; ctx.strokeStyle = c.m; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(this.m1[0], R1); ctx.lineTo(this.m1[1], R1); ctx.stroke(); ctx.globalAlpha = 1;
      this.d1.forEach((d, i) => { const cx = Math.max(this.m1[0], Math.min(this.m1[1], d[0])); arc(ctx, d, [cx, R1], eo(seg(t, 3.0 + i * 0.22, 3.4 + i * 0.22)), c.s, 3, true, 1); });
      this.d1.forEach(d => { ctx.globalAlpha = a1; PS.dot(ctx, d[0], d[1], 12, c.s); }); ctx.globalAlpha = 1;
    }
    const a2 = eo(seg(t, 6.8, 7.6));
    if (a2 > 0) {
      ctx.globalAlpha = a2; ctx.strokeStyle = c.m; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(this.m2[0], R2); ctx.lineTo(this.m2[1], R2); ctx.stroke(); ctx.globalAlpha = 1;
      this.s2.forEach((s, i) => { let b = this.d2[0], bd = 1e9; this.d2.forEach(d => { const dd = Math.hypot(d[0] - s[0], d[1] - s[1]); if (dd < bd) { bd = dd; b = d; } }); arc(ctx, s, b, eo(seg(t, 8.2 + i * 0.13, 8.6 + i * 0.13)), c.a, 3, false, 1); });
      this.s2.forEach(s => { ctx.globalAlpha = a2; PS.dot(ctx, s[0], s[1], 7, c.a); });
      this.d2.forEach(d => { ctx.globalAlpha = a2; PS.dot(ctx, d[0], d[1], 12, c.s); }); ctx.globalAlpha = 1;
    }
    this.la.opacity = eo(seg(t, 5.2, 5.8)); this.lb.opacity = eo(seg(t, 10.6, 11.2));
  },
});