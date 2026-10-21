const { seg, eo, eio, lerp, TextFx } = kit;
const LQ = [200, 300, 520], RQ = [1200, 300, 520];
function inPoly(x, y, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if (((a[1] > y) !== (b[1] > y)) && (x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])) c = !c; } return c; }
kit.scene('n-keep', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">NKSR · The idea</span><h2 class="line">What it keeps from Poisson</h2></div>' +
      '<div class="words" style="left:' + LQ[0] + 'px;top:' + (LQ[1] + LQ[2] + 16) + 'px;width:' + LQ[2] + 'px;align-items:center;gap:4px"><p class="note n-keep-a">Poisson: a full grid around the shape</p></div>' +
      '<div class="words" style="left:' + RQ[0] + 'px;top:' + (RQ[1] + RQ[2] + 16) + 'px;width:' + RQ[2] + 'px;align-items:center;gap:4px"><p class="note warm n-keep-b">NKSR: only near the dots</p></div>' +
      '<div class="words" style="left:780px;top:400px;width:360px;gap:12px;align-items:center"><p class="note n-keep-c" style="color:var(--second)">both:</p><p class="note n-keep-c">inside / outside</p><p class="note n-keep-c">one linear system</p><p class="note n-keep-c">surface = the zero line</p></div>' +
      '<p class="cap">NKSR keeps Poisson’s big idea: a function that is negative inside and positive outside, with the surface where it crosses zero.</p>' +
      '<p class="cap">And, like Poisson, that function comes from solving one linear system. But Poisson fills a whole grid around the person…</p>' +
      '<p class="cap">…while NKSR only builds the function near the dots, from building blocks a network has learned. Here is how, in 2D.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.a = q('.n-keep-a')[0].style; this.b = q('.n-keep-b')[0].style; this.cc = q('.n-keep-c');
    const P = TOY.resample(TOY.SH, 120), r = PS.rng(3);
    this.D = P.map((p, i) => { const a = P[(i + 119) % 120], b = P[(i + 1) % 120], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty); return { p: [p[0] + (r() - 0.5) * 0.02, p[1] + (r() - 0.5) * 0.02], n: [-ty / L, tx / L] }; });
    this.S = KT.solve(this.D, { dil: 1, lam: 1e-4 }); this.img = KT.image(this.S, this.c, 0.1);
    this.cells = []; const n = 16; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = -0.78 + (i + 0.5) * 1.56 / n, y = -0.78 + (j + 0.5) * 1.56 / n; this.cells.push([i, j, inPoly(x, y, TOY.SH)]); }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.0], t);
    this.a.opacity = eo(seg(t, 6.6, 7.1)); this.b.opacity = eo(seg(t, 12.2, 12.7));
    this.cc.forEach((el, i) => el.style.opacity = eo(seg(t, 1.6 + i * 0.6, 2.1 + i * 0.6)));
    const ctx = this.k.fx, c = this.c, map = (Q, x, y) => [Q[0] + (x + 0.78) / 1.56 * Q[2], Q[1] + (y + 0.78) / 1.56 * Q[2]];
    const pa = eo(seg(t, 6.6, 8.0));
    if (pa > 0) { const cs = LQ[2] / 16; this.cells.forEach(([i, j, ins], k) => { const v = eo(Math.min(1, Math.max(0, pa * 1.5 - k / this.cells.length * 0.5))); ctx.globalAlpha = v; ctx.fillStyle = ins ? PS.mix(c.g, c.a, 0.5) : PS.mix(c.g, c.m, 0.16); ctx.fillRect(LQ[0] + i * cs + 1, LQ[1] + j * cs + 1, cs - 2, cs - 2); }); ctx.globalAlpha = pa; ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.beginPath(); TOY.OUT.forEach((p, i) => { const q = map(LQ, p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; }
    const pb = eo(seg(t, 12.2, 13.6));
    if (pb > 0) {
      if (this.img) { ctx.globalAlpha = pb; ctx.drawImage(this.img, RQ[0], RQ[1], RQ[2], RQ[2]); ctx.globalAlpha = 1; }
      ctx.globalAlpha = pb; ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.lineCap = 'round'; this.S.segs.forEach(s => { if (s[2] > 0.06) return; const a = map(RQ, s[0][0], s[0][1]), b = map(RQ, s[1][0], s[1][1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }); ctx.globalAlpha = 1;
    }
    const da = eo(seg(t, 0.6, 1.6));
    [LQ, RQ].forEach((Q, k) => { if (k === 0 && pa <= 0 && t > 0) {} ctx.globalAlpha = da; this.D.forEach(d => { const q = map(Q, d.p[0], d.p[1]); PS.dot(ctx, q[0], q[1], 3.2, c.s); }); ctx.globalAlpha = 1; });
  },
});