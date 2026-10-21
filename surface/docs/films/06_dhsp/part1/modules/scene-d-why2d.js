const { seg, eo, eio, eob, lerp, TextFx } = kit;
const GX = 200, GY = 300, CS = 40, N = 12;
kit.scene('d-why2d', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · The 2D idea</span><h2 class="line">Why pictures</h2></div>' +
      '<div class="words" style="left:200px;top:800px;width:480px;align-items:center"><p class="note d-why2d-a">a picture: a neat grid</p></div>' +
      '<div class="words" style="left:1180px;top:800px;width:520px;align-items:center"><p class="note d-why2d-b">a mesh: no rows, no columns</p></div>' +
      '<p class="note warm d-why2d-g" style="left:720px;top:470px">an image prior</p><p class="note warm d-why2d-g" style="left:720px;top:506px">fills the gap</p>' +
      '<div class="words" style="left:110px;top:870px;width:1700px;align-items:center"><p class="eq d-why2d-e" style="font-size:42px;color:var(--accent)">so DHSP first turns the mesh surface into a picture</p></div>' +
      '<p class="cap">Why bring in pictures? Because networks for images are very good at one thing: filling in what is missing.</p>' +
      '<p class="cap">A picture is a neat grid where every pixel has neighbours on all sides. A network fitted to one picture can complete its gaps.</p>' +
      '<p class="cap">A mesh has no rows or columns. So DHSP turns the surface into a picture first, by flattening it.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.a = q('.d-why2d-a')[0].style; this.b = q('.d-why2d-b')[0].style; this.g = q('.d-why2d-g'); this.e = q('.d-why2d-e')[0].style;
    const c = this.c; this.col = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = i / (N - 1), v = j / (N - 1), w = 0.5 + 0.5 * Math.sin(u * 3.1 + v * 1.7), z = 0.5 + 0.5 * Math.cos(v * 3.3 - u * 1.2); this.col.push(PS.mix(PS.mix(c.g, c.m, 0.25 + 0.55 * w).replace(/rgba\((\d+),(\d+),(\d+),1\)/, (m, r, g, b) => '#' + [r, g, b].map(x => (+x).toString(16).padStart(2, '0')).join('')), c.a, 0.45 * z)); }
    this.hole = (i, j) => Math.hypot(i - 6.5, j - 5.5) < 3.2;
    const r = PS.rng(5), P = []; for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) P.push([1190 + i * 96 + (r() - 0.5) * 60, 330 + j * 88 + (r() - 0.5) * 50]);
    const T = []; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const a = j * 6 + i, b = a + 1, c2 = a + 6, d = c2 + 1; if ((i * 7 + j * 3) % 2) T.push([a, b, d], [a, d, c2]); else T.push([a, b, c2], [b, d, c2]); }
    this.P = P; this.T = T;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 13.0], t);
    this.a.opacity = eo(seg(t, 1.2, 1.7)); this.b.opacity = eo(seg(t, 13.2, 13.7)); this.g.forEach((el, i) => el.style.opacity = eo(seg(t, 8.2 + i * 0.2, 8.7 + i * 0.2))); this.e.opacity = eo(seg(t, 15.4, 16.0));
    const ctx = this.k.fx, c = this.c;
    const ga = eo(seg(t, 0.6, 1.6)), fill = seg(t, 8.4, 11.6);
    if (ga > 0) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const h = this.hole(i, j), d = Math.hypot(i - 6.5, j - 5.5), fa = h ? eo(Math.min(1, Math.max(0, fill * 1.6 - (3.2 - d) / 3.2 * 0.6))) : 1, gone = h ? eo(seg(t, 4.4, 5.4)) : 0;
      const x = GX + i * CS, y = GY + j * CS; ctx.globalAlpha = ga;
      ctx.fillStyle = PS.mix(c.g, c.g, 0); ctx.fillRect(x, y, CS - 3, CS - 3);
      const vis = h ? Math.max(1 - gone, fa) : 1; if (vis > 0) { ctx.globalAlpha = ga * vis; ctx.fillStyle = this.col[j * N + i]; ctx.fillRect(x, y, CS - 3, CS - 3); }
      if (h && gone > 0.5 && fa < 1) { ctx.globalAlpha = ga * (1 - fa) * 0.8; ctx.strokeStyle = c.a; ctx.lineWidth = 1.5; ctx.strokeRect(x + 1, y + 1, CS - 5, CS - 5); }
    }
    ctx.globalAlpha = 1;
    const ma = eo(seg(t, 13.0, 14.2));
    if (ma > 0) { ctx.globalAlpha = ma; this.T.forEach(tr => PS.tri(ctx, this.P[tr[0]], this.P[tr[1]], this.P[tr[2]], PS.mix(c.g, c.m, 0.2), c.m, 2)); this.P.forEach(p => PS.dot(ctx, p[0], p[1], 5, c.s)); ctx.globalAlpha = 1; }
  },
});