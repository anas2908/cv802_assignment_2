const { seg, eo, eio, lerp, TextFx } = kit;
// a small open fan of four triangles around o, and later a fin: a fifth triangle on the edge o-p2
const O = [700, 570], R = [[420, 650], [470, 350], [760, 262], [1030, 420], [990, 770]], Q = [590, 246];
const TRI = [[0, 1], [1, 2], [2, 3], [3, 4]];
kit.scene('x-rule', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · Watertight</span><h2 class="line">The watertight rule</h2></div>' +
      '<div class="words" style="left:1180px;top:300px;width:660px;gap:12px">' +
      '<p class="eq x-rule-n" style="font-size:40px">2 per edge: closed</p><p class="note x-rule-n" style="color:var(--second)">one triangle on each side</p>' +
      '<p class="eq x-rule-n" style="font-size:40px;margin-top:26px;color:var(--accent)">1: the border of a hole</p><p class="note x-rule-n" style="color:var(--second)">nothing on the other side</p>' +
      '<p class="eq x-rule-n" style="font-size:40px;margin-top:26px;color:var(--accent)">3 or more: a fin</p><p class="note x-rule-n" style="color:var(--second)">no longer one inside, one outside</p>' +
      '<p class="box hot x-rule-n" style="margin-top:30px;font-size:28px">watertight: every edge is shared by exactly 2 triangles</p></div>' +
      '<p class="cap">A mesh is closed, or watertight, when every edge is shared by exactly two triangles: one on each side of it.</p>' +
      '<p class="cap">An edge with only one triangle is the border of a hole. Water could leak in there, and so does the slicer’s fill.</p>' +
      '<p class="cap">An edge with three or more triangles is a fin. The surface is then no longer a simple skin with one inside and one outside.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.x-rule-n');
  },
  badge(ctx, a, b, txt, col, al) {
    const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2, c = this.c; ctx.globalAlpha = al;
    PS.dot(ctx, x, y, 17, c.g); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 17, 0, PS.TAU); ctx.stroke();
    ctx.fillStyle = col; ctx.font = '600 22px ' + kit.fonts.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 1); ctx.globalAlpha = 1;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 13.0], t);
    const NT = [1.8, 2.2, 7.0, 7.4, 13.4, 13.8, 17.0]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c;
    TRI.forEach(([i, j], k) => { const a = eo(seg(t, 0.4 + 0.25 * k, 0.9 + 0.25 * k)); if (a <= 0) return; ctx.globalAlpha = a; PS.tri(ctx, O, R[i], R[j], PS.mix(c.g, c.m, 0.18 + 0.05 * k), null); ctx.globalAlpha = 1; });
    const fin = eo(seg(t, 13.2, 13.9));
    if (fin > 0) { ctx.globalAlpha = 0.75 * fin; PS.tri(ctx, O, R[2], Q, PS.mix(c.g, c.a, 0.35), c.a, 2.5); ctx.globalAlpha = 1; }
    const inner = eo(seg(t, 1.6, 2.2)), outer = eo(seg(t, 6.8, 7.4));
    ctx.lineCap = 'round';
    // border edges: one triangle each
    const border = [[O, R[0]], [R[0], R[1]], [R[1], R[2]], [R[2], R[3]], [R[3], R[4]], [R[4], O]];
    border.forEach(([a, b]) => { ctx.strokeStyle = outer > 0 ? PS.mix(c.s, c.a, outer) : c.s; ctx.lineWidth = 2.5 + 2 * outer; ctx.globalAlpha = eo(seg(t, 0.4, 1.4)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
    ctx.globalAlpha = 1;
    // inner edges: two triangles each
    [1, 2, 3].forEach(i => { ctx.strokeStyle = PS.mix(c.s, c.m, inner); ctx.lineWidth = 2.5 + 2 * inner; ctx.globalAlpha = eo(seg(t, 0.4, 1.4)); ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(R[i][0], R[i][1]); ctx.stroke(); });
    ctx.globalAlpha = 1;
    if (fin > 0) { ctx.strokeStyle = c.a; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(R[2][0], R[2][1]); ctx.stroke(); }
    [1, 2, 3].forEach(i => this.badge(ctx, O, R[i], i === 2 && fin > 0.5 ? '3' : '2', i === 2 && fin > 0.5 ? c.a : c.m, inner));
    border.forEach(([a, b]) => this.badge(ctx, a, b, '1', c.a, outer));
    [O].concat(R).forEach(p => PS.dot(ctx, p[0], p[1], 6, c.s));
    if (fin > 0) { ctx.globalAlpha = fin; PS.dot(ctx, Q[0], Q[1], 6, c.a); ctx.globalAlpha = 1; }
  },
});
