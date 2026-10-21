const { seg, eo, eio, lerp, TextFx } = kit;
const R1 = 360, R2 = 620, A = 34, XS = [...Array(13)].map((_, k) => 300 + k * 110);
kit.scene('m-nc', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Smooth or crumpled?</h2></div>' +
      '<p class="note m-nc-l1" style="left:300px;top:404px">smooth mesh: the arrows agree  →  high normal consistency</p>' +
      '<p class="note warm m-nc-l2" style="left:300px;top:682px">crumpled mesh: the arrows point every which way  →  low</p>' +
      '<p class="note m-nc-l3" style="left:300px;top:776px;color:var(--second)">DHSP: before our fix 0.65 (crumpled), after our fix 0.89 (smooth)</p>' +
      '<p class="cap">Chamfer and F-score only measure distances. A crumpled mesh can sit just as close to the dots as a smooth one.</p>' +
      '<p class="cap">So we also compare directions: each dot’s arrow (white) against the arrows of the mesh around it.</p>' +
      '<p class="cap">Smooth mesh: the arrows agree, so normal consistency is high. Crumpled mesh: they disagree, so it is low.</p>' +
      '<p class="cap">This caught DHSP’s first mesh: almost perfect F-score, but crumpled. Our fix made it smooth.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.m-nc-' + k).style;
    this.l1 = q('l1'); this.l2 = q('l2'); this.l3 = q('l3');
    const z = [];
    XS.forEach((x, k) => { z.push([x, R2]); if (k < XS.length - 1) z.push([x + 55, R2 + (k % 2 ? A : -A)]); });
    this.z = z;
    this.s1 = []; XS.slice(0, -1).forEach(x => { this.s1.push([[x, R1], [x + 55, R1]]); this.s1.push([[x + 55, R1], [x + 110, R1]]); });
    this.s2 = []; for (let i = 0; i + 1 < z.length; i++) this.s2.push([z[i], z[i + 1]]);
  },
  marrow(ctx, s, p, col) {
    const a = s[0], b = s[1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const nx = dy / L, ny = -dx / L, u = ny > 0 ? -1 : 1;
    PS.arrow(ctx, mx + nx * u * 6, my + ny * u * 6, mx + nx * u * (6 + 44 * p), my + ny * u * (6 + 44 * p), col, 3.5, 12);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 4.0, 8.6, 12.6], t);
    const ctx = this.k.fx, c = this.c;
    const m1 = eio(seg(t, 0.6, 1.8)), m2 = eio(seg(t, 1.0, 2.2));
    ctx.strokeStyle = c.m; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (m1 > 0) { ctx.beginPath(); ctx.moveTo(XS[0], R1); ctx.lineTo(lerp(XS[0], XS[12], m1), R1); ctx.stroke(); }
    if (m2 > 0) { const n = Math.ceil((this.z.length - 1) * m2); ctx.strokeStyle = c.a; ctx.beginPath(); ctx.moveTo(this.z[0][0], this.z[0][1]); for (let i = 1; i <= n; i++) ctx.lineTo(this.z[i][0], this.z[i][1]); ctx.stroke(); }
    XS.forEach((x, k) => { const p = eo(seg(t, 0.3 + k * 0.06, 0.7 + k * 0.06)); PS.dot(ctx, x, R1, 11 * p, c.s); PS.dot(ctx, x, R2, 11 * p, c.s); });
    const da = eo(seg(t, 4.3, 5.3));
    if (da > 0) XS.forEach(x => { PS.arrow(ctx, x, R1 - 14, x, R1 - 14 - 50 * da, c.s, 3.5, 12); PS.arrow(ctx, x, R2 - 14, x, R2 - 14 - 50 * da, c.s, 3.5, 12); });
    const ma = eo(seg(t, 5.6, 6.8));
    if (ma > 0) { this.s1.forEach(s => this.marrow(ctx, s, ma, c.m)); this.s2.forEach(s => this.marrow(ctx, s, ma, c.a)); }
    this.l1.opacity = eo(seg(t, 8.8, 9.4)); this.l2.opacity = eo(seg(t, 9.6, 10.2)); this.l3.opacity = eo(seg(t, 12.8, 13.4));
  },
});