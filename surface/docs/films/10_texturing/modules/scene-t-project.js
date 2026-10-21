const { seg, eo, eio, lerp, TextFx } = kit;
const CX = 640, CY = 560, SC = 560, P = [-0.32, 0.2], N = [-1, 0];
const CAMS = [{ p: [-1.05, 0.02], t: 2.6 }, { p: [0.92, 0.32], t: 8.2 }, { p: [-0.38, 0.62], t: 14.4 }];
kit.scene('t-project', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Photo texturing · Step 3</span><h2 class="line">Asking every photo</h2></div>' +
      '<div class="words" style="left:1180px;top:290px;width:700px;gap:14px">' +
      '<p class="note t-project-n">✓ this camera sees it: use its photo</p>' +
      '<p class="note warm t-project-n">✗ hidden: the body is in front (z-buffer)</p>' +
      '<p class="note warm t-project-n">✗ too sideways: cosine below 0.25</p>' +
      '<p class="note t-project-m" style="margin-top:30px;color:var(--accent)">all four checks, for every texel and photo:</p>' +
      '<p class="note t-project-m" style="color:var(--second)">1 · in front of the camera, inside the image</p>' +
      '<p class="note t-project-m" style="color:var(--second)">2 · facing the camera (cosine above 0.25)</p>' +
      '<p class="note t-project-m" style="color:var(--second)">3 · nothing in front of it (z-buffer)</p>' +
      '<p class="note t-project-m" style="color:var(--second)">4 · inside the person mask</p></div>' +
      '<p class="cap">Now each texel asks every photo for its colour. Here is one texel on the side of the body, with its arrow.</p>' +
      '<p class="cap">This camera faces it squarely and nothing is in the way, so its photo can be used.</p>' +
      '<p class="cap">This one is blocked: its ray hits the body first. A depth image of the mesh from that camera catches this: a z-buffer.</p>' +
      '<p class="cap">And this one sees it almost edge-on, so its photo would be smeared. Below a cosine of 0.25, it is skipped.</p>' +
      '<p class="cap">One more check: the spot must fall inside the person mask of that photo. Only photos passing all four get a say.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.t-project-n'); this.m = q('.t-project-m');
    this.R = CAMS.map(cm => { const dx = P[0] - cm.p[0], dy = P[1] - cm.p[1], L = Math.hypot(dx, dy), d = [dx / L, dy / L], hit = TS.inter(cm.p, d, TOY.SH), cos = -(N[0] * d[0] + N[1] * d[1]); return { L, d, hit, hidden: hit < L - 0.02, cos }; });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.0, 11.6, 17.8, 23.6], t);
    [3.6, 9.4, 15.6].forEach((a, i) => { const p = eo(seg(t, a, a + 0.5)); this.n[i].style.opacity = p; this.n[i].style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.m.forEach((el, i) => { const p = eo(seg(t, 23.8 + i * 0.4, 24.3 + i * 0.4)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c, S = p => [CX + p[0] * SC, CY + p[1] * SC], a = eo(seg(t, 0.3, 1.3));
    ctx.globalAlpha = a; ctx.fillStyle = PS.mix(c.g, c.m, 0.16); ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.beginPath(); TOY.SH.forEach((p, i) => { const q = S(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke();
    const pp = S(P); PS.dot(ctx, pp[0], pp[1], 10, c.a); PS.arrow(ctx, pp[0], pp[1], pp[0] + N[0] * 60, pp[1] + N[1] * 60, c.a, 3, 12); ctx.globalAlpha = 1;
    CAMS.forEach((cm, i) => {
      const v = eo(seg(t, cm.t, cm.t + 0.6)); if (v <= 0) return; const R = this.R[i], q = S(cm.p), dim = t > CAMS[Math.min(2, i + 1)].t && i < 2 ? 0.45 : 1;
      ctx.globalAlpha = v * dim; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(R.d[1], R.d[0])); ctx.fillStyle = PS.mix(c.g, c.s, 0.7); ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-16, -16); ctx.lineTo(-16, 16); ctx.closePath(); ctx.fill(); ctx.restore();
      const rp = eio(seg(t, cm.t + 0.4, cm.t + 1.6)), endD = R.hidden ? R.hit : R.L, e = [cm.p[0] + R.d[0] * endD * rp, cm.p[1] + R.d[1] * endD * rp], eq = S(e), ok = !R.hidden && R.cos > 0.25;
      ctx.strokeStyle = ok ? c.m : c.a; ctx.lineWidth = ok ? 4 : 3; ctx.setLineDash(ok ? [] : [10, 8]); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(eq[0], eq[1]); ctx.stroke(); ctx.setLineDash([]);
      if (rp > 0.98) { if (R.hidden) { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(eq[0] - 12, eq[1] - 12); ctx.lineTo(eq[0] + 12, eq[1] + 12); ctx.moveTo(eq[0] + 12, eq[1] - 12); ctx.lineTo(eq[0] - 12, eq[1] + 12); ctx.stroke(); } else PS.dot(ctx, eq[0], eq[1], 8, ok ? c.m : c.a); }
      ctx.globalAlpha = 1;
    });
  },
});