const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('orient', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 5</span><h2 class="line">Make the arrows agree</h2></div>' +
      '<div class="words" style="left:110px;top:400px;width:640px"><p class="box orient-b1">Tree link cost = 1 − |nᵢ · nⱼ|. Parallel tiles are cheap, so the tree follows smooth skin.</p>' +
      '<p class="box hot orient-b2">Vote: most arrows point toward the local centre, so flip them all.</p></div>' +
      '<p class="cap">Fresh from PCA, each arrow points in or out at random.</p>' +
      '<p class="cap">Link neighbours whose tiles are almost parallel: a tree of safe links (the MST).</p>' +
      '<p class="cap">Pass the direction along the tree. A dot that disagrees with its parent flips.</p>' +
      '<p class="cap">Now they all agree, but they all point inward. A vote checks, and flips every arrow out.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.b1 = kit.stage.querySelector('.orient-b1').style; this.b2 = kit.stage.querySelector('.orient-b2').style;
    this.d = PS.dots(34, 7, 0);
    const r = PS.rng(21);
    this.s0 = this.d.map((q, i) => i === 0 ? -1 : (r() < 0.5 ? -1 : 1));
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 1.6, 3.6, 7.8], t);
    const ctx = this.k.fx, c = this.c, d = this.d, n = d.length;
    PS.outline(ctx, PS.mix(c.g, c.s, 0.18), 2);
    const tp = seg(t, 1.6, 3.4);
    ctx.strokeStyle = PS.mix(c.g, c.s, 0.55); ctx.lineWidth = 3;
    for (let i = 0; i < n - 1; i++) {
      const p = Math.min(1, Math.max(0, tp * (n - 1) - i)); if (p <= 0) break;
      ctx.beginPath(); ctx.moveTo(d[i].x, d[i].y); ctx.lineTo(lerp(d[i].x, d[i + 1].x, p), lerp(d[i].y, d[i + 1].y, p)); ctx.stroke();
    }
    const wp = eio(seg(t, 3.7, 7.5)) * (n - 1);
    const vote = eio(seg(t, 9.4, 10.3));
    const vl = eo(seg(t, 8.0, 8.6)) * (1 - seg(t, 9.2, 9.6));
    if (vl > 0) {
      ctx.globalAlpha = vl * 0.7; ctx.setLineDash([6, 8]); ctx.strokeStyle = c.a; ctx.lineWidth = 2;
      for (let i = 0; i < n; i += 4) { ctx.beginPath(); ctx.moveTo(d[i].x, d[i].y); ctx.lineTo(PS.C.cx, PS.C.cy); ctx.stroke(); }
      ctx.setLineDash([]); ctx.globalAlpha = 1; PS.dot(ctx, PS.C.cx, PS.C.cy, 9 * vl, c.a);
    }
    d.forEach((q, i) => {
      PS.dot(ctx, q.x, q.y, 6, c.s);
      let ang = this.s0[i] > 0 ? 0 : Math.PI;
      if (i > 0 && this.s0[i] !== this.s0[0]) ang += Math.PI * eio(Math.min(1, Math.max(0, (wp - (i - 1)) / 0.9)));
      ang += Math.PI * vote;
      const ca = Math.cos(ang), sa = Math.sin(ang), vx = q.nx * ca - q.ny * sa, vy = q.nx * sa + q.ny * ca;
      const grow = eo(seg(t, 0.2 + i * 0.02, 0.8 + i * 0.02));
      const L = 44 * grow;
      const hot = wp >= i - 0.2 && wp <= i + 0.8;
      PS.arrow(ctx, q.x + vx * 8, q.y + vy * 8, q.x + vx * (8 + L), q.y + vy * (8 + L), hot ? c.a : c.m, 3.5, 13);
    });
    if (t > 3.6 && t < 7.8) { const i = Math.min(n - 1, Math.floor(wp)), f = wp - i, j = Math.min(n - 1, i + 1); PS.dot(ctx, lerp(d[i].x, d[j].x, f), lerp(d[i].y, d[j].y, f), 11, c.a); }
    if (t <= 3.6) PS.dot(ctx, d[0].x, d[0].y, 11 * eo(seg(t, 3.0, 3.5)), c.a);
    this.b1.opacity = eo(seg(t, 1.9, 2.4)) * (1 - seg(t, 7.6, 8.0));
    this.b2.opacity = eo(seg(t, 8.3, 8.8));
  },
});