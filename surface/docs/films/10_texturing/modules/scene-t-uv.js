const { seg, eo, eio, lerp, TextFx } = kit;
const NX = 6, NY = 5, SQ = [1060, 290, 520];
kit.scene('t-uv', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Photo texturing · Step 1</span><h2 class="line">A texture for every mesh</h2></div>' +
      '<div class="words" style="left:200px;top:820px;width:560px;align-items:center"><p class="note t-uv-l">a piece of the skin</p></div>' +
      '<div class="words" style="left:' + SQ[0] + 'px;top:' + (SQ[1] + SQ[2] + 14) + 'px;width:' + SQ[2] + 'px;align-items:center"><p class="note warm t-uv-l">its texture: 4,096 × 4,096 texels</p></div>' +
      '<div class="words" style="left:1620px;top:330px;width:280px;gap:10px"><p class="note t-uv-n" style="color:var(--second)">one texel →</p><p class="note t-uv-n" style="color:var(--second)">one 3D spot</p><p class="note t-uv-n" style="color:var(--second)">+ its arrow</p></div>' +
      '<p class="cap">First every mesh gets a texture: it is unfolded into a flat square image, as in the DHSP film, 4,096 by 4,096 pixels.</p>' +
      '<p class="cap">Each pixel of that image, a texel, sits on one triangle. So every texel knows its 3D spot on the skin and that triangle’s arrow.</p>' +
      '<p class="cap">Huge meshes, over 600,000 triangles, get a simpler layout: each pair of triangles gets its own little square.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.t-uv-l'); this.n = q('.t-uv-n');
    this.P3 = []; this.P2 = []; for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const u = i / (NX - 1), v = j / (NY - 1); this.P3.push([250 + u * 420 + 60 * Math.sin(v * 2.4), 330 + v * 420 + 50 * Math.sin(u * 3.1) - 40 * u]); this.P2.push([SQ[0] + u * SQ[2], SQ[1] + v * SQ[2]]); }
    this.T = []; for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c2 = a + NX, d = c2 + 1; this.T.push([a, b, d], [a, d, c2]); }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.4], t);
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, 0.8 + i * 3.6, 1.3 + i * 3.6))); this.n.forEach((el, i) => el.style.opacity = eo(seg(t, 8.6 + i * 0.4, 9.1 + i * 0.4)));
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 0.4, 1.4)), un = eio(seg(t, 2.6, 6.0));
    const ghost = (P, al) => { ctx.globalAlpha = al; this.T.forEach(tr => PS.tri(ctx, P[tr[0]], P[tr[1]], P[tr[2]], PS.mix(c.g, c.m, 0.2), c.m, 2)); ctx.globalAlpha = 1; };
    ghost(this.P3, a);
    if (un > 0) { const P = this.P3.map((p, i) => [lerp(p[0], this.P2[i][0], un), lerp(p[1], this.P2[i][1], un)]); ghost(P, 0.9); }
    const gr = eo(seg(t, 6.6, 7.6));
    if (gr > 0) { ctx.globalAlpha = gr * 0.35; ctx.strokeStyle = c.s; ctx.lineWidth = 1; for (let k = 0; k <= 26; k++) { const x = SQ[0] + k * SQ[2] / 26, y = SQ[1] + k * SQ[2] / 26; ctx.beginPath(); ctx.moveTo(x, SQ[1]); ctx.lineTo(x, SQ[1] + SQ[2]); ctx.moveTo(SQ[0], y); ctx.lineTo(SQ[0] + SQ[2], y); ctx.stroke(); } ctx.globalAlpha = 1; }
    const hl = eo(seg(t, 8.4, 9.2));
    if (hl > 0) {
      const cs = SQ[2] / 26, ci = 11, cj = 9, cx = SQ[0] + (ci + 0.5) * cs, cy = SQ[1] + (cj + 0.5) * cs;
      ctx.globalAlpha = hl; ctx.fillStyle = c.a; ctx.fillRect(SQ[0] + ci * cs, SQ[1] + cj * cs, cs, cs);
      const u = (ci + 0.5) / 26, v = (cj + 0.5) / 26, fi = Math.min(NX - 2, Math.floor(u * (NX - 1))), fj = Math.min(NY - 2, Math.floor(v * (NY - 1))), fu = u * (NX - 1) - fi, fv = v * (NY - 1) - fj, A = this.P3[fj * NX + fi], Bq = this.P3[fj * NX + fi + 1], Cq = this.P3[(fj + 1) * NX + fi], Dq = this.P3[(fj + 1) * NX + fi + 1];
      const p = [lerp(lerp(A[0], Bq[0], fu), lerp(Cq[0], Dq[0], fu), fv), lerp(lerp(A[1], Bq[1], fu), lerp(Cq[1], Dq[1], fu), fv)];
      const lk = eio(seg(t, 9.2, 10.4)); ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(lerp(cx, p[0], lk), lerp(cy, p[1], lk)); ctx.stroke(); ctx.setLineDash([]);
      if (lk > 0.95) { PS.dot(ctx, p[0], p[1], 9, c.a); const dx = Bq[0] - A[0], dy = Bq[1] - A[1], L = Math.hypot(dx, dy); PS.arrow(ctx, p[0], p[1], p[0] + dy / L * 60, p[1] - dx / L * 60, c.a, 3, 12); }
      ctx.globalAlpha = 1;
    }
  },
});