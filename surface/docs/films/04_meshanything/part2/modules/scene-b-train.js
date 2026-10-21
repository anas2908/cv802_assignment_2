const { seg, eo, eio, eob, lerp, TextFx } = kit;
const R = [[0.18,-0.5],[0.26,-0.42],[0.2,-0.25],[0.36,0.0],[0.4,0.22],[0.3,0.45],[0.22,0.5]];
const VASE = R.concat(R.slice().reverse().map(p => [-p[0], p[1]]));
const CX = [400, 960, 1520], IY = 322, IS = 140;
function along(step) { const out = []; for (let i = 0; i < VASE.length; i++) { const a = VASE[i], b = VASE[(i + 1) % VASE.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) * IS, m = Math.max(1, Math.round(L / step)); for (let j = 0; j < m; j++) out.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m), b[1] - a[1], -(b[0] - a[0])]); } return out; }
kit.scene('b-train', {
  init(kit) {
    const bx = (s, x, y, hot) => '<p class="box ' + (hot ? 'hot ' : '') + 'b-train-b" style="left:' + (x - 210) + 'px;top:' + y + 'px;width:420px;text-align:center">' + s + '</p>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · Part 2</span><h2 class="line">How it was trained</h2></div>' +
      bx('artist mesh, fewer than 1,600 triangles', 400, 418) + bx('rebuilt as a closed shell on a 128-step grid', 960, 418) + bx('8,192 dots + arrows: the input', 1520, 418, 1) +
      '<p class="note b-train-l" style="left:190px;top:548px">the lesson, repeated over and over:</p>' +
      bx('read the dots, guess the next token', 400, 594) + bx('check the artist’s real next token', 960, 594) + bx('nudge its numbers, then repeat', 1520, 594) +
      '<p class="note warm b-train-l" style="left:190px;top:812px">we used the authors’ trained model as is: no training on our side</p>' +
      '<p class="cap">MeshAnything learned from thousands of artist meshes, each with fewer than 1,600 triangles.</p>' +
      '<p class="cap">Each was rebuilt as a closed shell on a 128-step grid, and 8,192 dots with arrows were spread over it: that is the input.</p>' +
      '<p class="cap">The lesson: read the dots, guess the next token of the artist’s real sentence, check it, nudge the numbers. Again and again.</p>' +
      '<p class="cap">Shapes were also stretched and turned at random, so it learns shapes rather than memorising them.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.b-train-b'); this.l = q('.b-train-l');
    this.D = along(15); this.S = along(3);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    PS.caps(this.caps, [0.3, 6.0, 12.2, 18.6], t);
    const BT = [0.9, 4.2, 7.6, 12.4, 13.4, 14.4], LT = [11.9, 18.9];
    this.b.forEach((el, i) => { const p = seg(t, BT[i], BT[i] + 0.5); el.style.opacity = eo(p); el.style.transform = 'translateY(' + (1 - eo(p)) * 16 + 'px)'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, LT[i], LT[i] + 0.5)));
    const ctx = this.k.fx, c = this.c, br = 1 + 0.012 * Math.sin(t * PS.TAU / 3.2);
    const P = (p, cx) => [cx + p[0] * IS * br, IY + p[1] * IS * br];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const a = eo(seg(t, 0.4, 1.6));
    if (a > 0) { ctx.globalAlpha = a; const ce = P([0, 0.05], CX[0]); for (let i = 0; i < VASE.length; i++) PS.tri(ctx, ce, P(VASE[i], CX[0]), P(VASE[(i + 1) % VASE.length], CX[0]), PS.mix(c.g, c.m, 0.16 + 0.12 * (i % 3)), c.m, 2.5); ctx.globalAlpha = 1; }
    const b = eio(seg(t, 3.6, 5.4));
    if (b > 0) {
      const g = 8 * br; ctx.globalAlpha = 0.35 * b; ctx.strokeStyle = PS.mix(c.g, c.m, 0.5); ctx.lineWidth = 1;
      for (let k = -9; k <= 9; k++) { ctx.beginPath(); ctx.moveTo(CX[1] + k * g, IY - 80); ctx.lineTo(CX[1] + k * g, IY + 80); ctx.moveTo(CX[1] - 72, IY + k * g); ctx.lineTo(CX[1] + 72, IY + k * g); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.beginPath();
      const n = Math.floor(this.S.length * b); for (let i = 0; i <= n && i < this.S.length; i++) { const p = P(this.S[i], CX[1]), q = [CX[1] + Math.round((p[0] - CX[1]) / g) * g, IY + Math.round((p[1] - IY) / g) * g]; i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke();
    }
    const d = seg(t, 7.0, 8.6);
    if (d > 0) this.D.forEach((p, i) => { const f = eo(Math.min(1, Math.max(0, d * 1.6 - i / this.D.length * 0.6))); if (f <= 0) return; const q = P(p, CX[2]), L = Math.hypot(p[2], p[3]) || 1; ctx.globalAlpha = f; ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0] + p[2] / L * 18 * f, q[1] + p[3] / L * 18 * f); ctx.stroke(); PS.dot(ctx, q[0], q[1], 4, c.s); ctx.globalAlpha = 1; });
    [[2.4, 0], [6.0, 1]].forEach(([s, k]) => { const p = eo(seg(t, s, s + 0.5)); if (p > 0) { ctx.globalAlpha = p; PS.arrow(ctx, CX[k] + 110, IY, CX[k] + 110 + 340 * p, IY, c.a, 3, 12); ctx.globalAlpha = 1; } });
    [[12.9, 0], [13.9, 1]].forEach(([s, k]) => { const p = eo(seg(t, s, s + 0.4)); if (p > 0) { ctx.globalAlpha = p; PS.arrow(ctx, CX[k] + 216, 634, CX[k] + 216 + 120 * p, 634, c.a, 3, 11); ctx.globalAlpha = 1; } });
    const lp = eio(seg(t, 15.2, 16.6));
    if (lp > 0) { ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); const N = 40; for (let i = 0; i <= N * lp; i++) { const u = i / N, x = lerp(1520, 400, u), y = 690 + Math.sin(u * Math.PI) * 70; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); if (lp > 0.98) PS.arrow(ctx, 404, 708, 400, 690, c.a, 3, 13); }
  },
});