const { seg, eo, eio, lerp, TextFx } = kit;
const Q = [250, 225, 660];
kit.scene('n-mask', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">NKSR · The mask</span><h2 class="line">Only near the dots</h2></div>' +
      '<div class="words" style="left:1010px;top:290px;width:840px;gap:14px">' +
      '<p class="note warm n-mask-n">here the scan has no dots</p>' +
      '<p class="note n-mask-n" style="margin-top:14px">NKSR predicts how far each place is from the dots</p>' +
      '<p class="note n-mask-n">and cuts the surface where it is more than 2 cells away</p>' +
      '<p class="note warm n-mask-n" style="margin-top:14px">so the surface stays open at the gap</p>' +
      '<p class="note n-mask-n" style="margin-top:28px;color:var(--second)">+ honest: nothing invented where there is no data</p>' +
      '<p class="note n-mask-n" style="color:var(--second)">− never closed: cannot be 3D printed as it is</p></div>' +
      '<p class="cap">What if part of the scan has no dots? Here the bottom of the outline is missing.</p>' +
      '<p class="cap">Far from the dots the function is only a guess. NKSR also predicts how far each place is from the dots, and cuts away anything too far.</p>' +
      '<p class="cap">So where the scan has a hole, the mesh keeps a hole. Poisson would have closed it; NKSR leaves it open.</p>' +
      '<p class="cap">That is honest, but it means an NKSR mesh is never closed, so it cannot be 3D printed without repair.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.n-mask-n');
    const P = TOY.resample(TOY.SH, 120), r = PS.rng(3);
    const D = P.map((p, i) => { const a = P[(i + 119) % 120], b = P[(i + 1) % 120], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty); return { p: [p[0] + (r() - 0.5) * 0.02, p[1] + (r() - 0.5) * 0.02], n: [-ty / L, tx / L] }; });
    this.gone = D.filter(d => d.p[1] >= 0.3); this.D = D.filter(d => d.p[1] < 0.3);
    this.S = KT.solve(this.D, { dil: 1, lam: 1e-4 }); this.img = KT.image(this.S, this.c, 0.1);
    const ends = []; this.S.segs.forEach(s => { if (s[2] > 0.06) return; [s[0], s[1]].forEach(p => { if (p[1] > 0.18) ends.push(p); }); }); ends.sort((a, b) => b[1] - a[1]);
    const L1 = ends.filter(p => p[0] < 0).slice(0, 1), R1 = ends.filter(p => p[0] > 0).slice(0, 1); this.ends = L1.concat(R1);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.6, 11.8, 17.0], t);
    const NT = [1.6, 6.0, 6.6, 12.0, 17.2, 17.8];
    this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c, map = (x, y) => [Q[0] + (x + 0.78) / 1.56 * Q[2], Q[1] + (y + 0.78) / 1.56 * Q[2]];
    const hm = eo(seg(t, 6.2, 8.0));
    if (hm > 0 && this.img) { ctx.globalAlpha = hm; ctx.drawImage(this.img, Q[0], Q[1], Q[2], Q[2]); ctx.globalAlpha = 1; }
    const da = eo(seg(t, 0.4, 1.4));
    ctx.globalAlpha = da; this.D.forEach(d => { const p = map(d.p[0], d.p[1]); PS.dot(ctx, p[0], p[1], 4, c.s); });
    const gh = eo(seg(t, 1.4, 2.2)) * (1 - 0.5 * eo(seg(t, 8.0, 9.0)));
    if (gh > 0) { ctx.globalAlpha = gh * 0.7; ctx.strokeStyle = c.a; ctx.lineWidth = 2; this.gone.forEach(d => { const p = map(d.p[0], d.p[1]); ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, PS.TAU); ctx.stroke(); }); }
    ctx.globalAlpha = 1;
    const ct = eo(seg(t, 7.6, 9.2));
    if (ct > 0) { ctx.globalAlpha = ct; ctx.strokeStyle = c.s; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; this.S.segs.forEach(s => { if (s[2] > 0.06) return; const a = map(s[0][0], s[0][1]), b = map(s[1][0], s[1][1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }); ctx.globalAlpha = 1; }
    const en = eo(seg(t, 12.0, 12.8));
    if (en > 0) this.ends.forEach(p => { const q = map(p[0], p[1]); ctx.globalAlpha = en; ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(q[0], q[1], 22 + 3 * Math.sin(t * 3), 0, PS.TAU); ctx.stroke(); ctx.globalAlpha = 1; });
  },
});