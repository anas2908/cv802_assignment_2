const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('normals', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 3</span><h2 class="line">Arrows point outside</h2></div>' +
      '<p class="note normals-a" style="left:110px;top:472px">χ = 1</p>' +
      '<p class="note normals-b" style="left:110px;top:722px">χ = 0</p>' +
      '<p class="note warm normals-c" style="left:440px;top:782px">along the walk →</p>' +
      '<p class="cap">Every dot gets an arrow, its normal, pointing out of the body.</p>' +
      '<p class="cap">Now walk straight through the body and watch χ along the way.</p>' +
      '<p class="cap">χ is flat, then jumps exactly at the skin, inward, opposite the outward arrows. So the arrows tell us how χ changes.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.notes = ['a', 'b', 'c'].map(k => kit.stage.querySelector('.normals-' + k).style);
    this.d = PS.dots(48, 4, 0.0);
    const y = PS.C.cy + 10; this.wy = y; this.wa = 880; this.wb = 1620;
    this.cross = [];
    let prev = PS.inside(this.wa, y);
    for (let x = this.wa; x <= this.wb; x += 1) { const v = PS.inside(x, y); if (v !== prev) this.cross.push(x); prev = v; }
  },
  gx(x) { return 262 + (x - this.wa) / (this.wb - this.wa) * 540; },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 3.0, 7.2], t);
    const ctx = this.k.fx, c = this.c;
    PS.outline(ctx, PS.mix(c.g, c.s, 0.25), 2);
    const gp = seg(t, 0.4, 2.6);
    this.d.forEach((q, i) => {
      PS.dot(ctx, q.x, q.y, 5, c.s);
      const p = eo(Math.min(1, Math.max(0, gp * 1.5 - (i / this.d.length) * 0.5)));
      if (p > 0) PS.arrow(ctx, q.x + q.nx * 8, q.y + q.ny * 8, q.x + q.nx * (8 + 46 * p), q.y + q.ny * (8 + 46 * p), c.m, 3, 12);
    });
    const wl = eo(seg(t, 2.9, 3.5));
    if (wl > 0) {
      ctx.globalAlpha = wl; ctx.setLineDash([10, 10]); ctx.strokeStyle = c.a; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(this.wa, this.wy); ctx.lineTo(this.wb, this.wy); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(240, 470); ctx.lineTo(240, 760); ctx.lineTo(820, 760); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    this.notes.forEach(s => s.opacity = wl);
    const mp = eio(seg(t, 3.4, 7.0));
    if (mp > 0) {
      const mx = lerp(this.wa, this.wb, mp);
      ctx.strokeStyle = c.m; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
      let started = false, prevIn = PS.inside(this.wa, this.wy);
      for (let x = this.wa; x <= mx; x += 2) {
        const v = PS.inside(x, this.wy) ? 1 : 0, gy = 740 - 250 * v, gxx = this.gx(x);
        if (!started) { ctx.moveTo(gxx, gy); started = true; } else ctx.lineTo(gxx, gy);
      }
      ctx.stroke();
      this.cross.forEach((cx, k) => {
        if (mx < cx) return;
        const p = eo(seg(mx, cx, cx + 40));
        const up = k % 2 === 0;
        const gxx = this.gx(cx);
        PS.arrow(ctx, gxx - 16, up ? 720 : 510, gxx - 16, up ? 720 - 190 * p : 510 + 190 * p, c.a, 4, 16);
        const dir = up ? 1 : -1;
        PS.arrow(ctx, cx - dir * 70 * p, this.wy - 0, cx, this.wy, c.a, 5, 18);
      });
      PS.dot(ctx, mx, this.wy, 10, c.a);
      PS.dot(ctx, this.gx(mx), 740 - 250 * (PS.inside(mx, this.wy) ? 1 : 0), 8, c.a);
    }
  },
});