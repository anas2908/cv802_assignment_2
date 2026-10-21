const { seg, eo, eio, lerp, TextFx } = kit;
// two triangles sharing the edge A-B; each lists its corners anticlockwise (as seen), so its outside faces you
const A = [520, 300], B = [520, 720], L = [250, 530], Rr = [790, 520];
kit.scene('x-winding', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · Orientation</span><h2 class="line">Which side is out</h2></div>' +
      '<p class="note x-w-n" style="left:200px;top:790px;font-size:24px">1 → 2 → 3 anticlockwise: the outside faces you</p>' +
      '<p class="note x-w-n" style="left:200px;top:834px;font-size:24px;color:var(--second)">neighbours walk their shared edge in opposite ways</p>' +
      '<p class="note warm x-w-n" style="left:200px;top:878px;font-size:24px">one flipped: both walk it the same way</p>' +
      '<div class="words x-w-v" style="left:1130px;top:860px;width:640px;align-items:center"><p class="eq" style="font-size:36px">DHSP: 126 cm³ inside, at 180 mm tall</p></div>' +
      '<p class="note x-w-v" style="left:1130px;top:236px;font-size:22px;color:var(--second)">arrows: the outside of our DHSP mesh</p>' +
      '<p class="cap">Each triangle lists its corners in an order. Going round 1, 2, 3 anticlockwise means its outside is facing you.</p>' +
      '<p class="cap">Neighbours must agree: they walk their shared edge in opposite directions. Flip one, and they disagree about which side is out.</p>' +
      '<p class="cap">A closed mesh whose triangles all agree, with every outside facing away from the middle, encloses a real volume: something solid to print.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.x-w-n'); this.v = q('.x-w-v');
    this.S = VW.mesh(kit, 'vw-dh.json'); const D = MESH.dots(MESH.load(kit, 'dh-dots.json')); this.Q = { n: D.n, P: D.P, N: VW.dotNormals(this.S, D) };
  },
  // a triangle's corner order as a turning arrow around its centre; dir = +1 anticlockwise (as seen), -1 clockwise
  turn(ctx, P, dir, col, al) {
    const cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3, r = 46, a0 = -2.4, a1 = a0 + dir * -4.6;
    ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1, dir > 0); ctx.stroke();
    const ex = cx + r * Math.cos(a1), ey = cy + r * Math.sin(a1), tx = -Math.sin(a1) * -dir, ty = Math.cos(a1) * -dir; PS.arrow(ctx, ex - tx * 14, ey - ty * 14, ex + tx * 2, ey + ty * 2, col, 3, 13);
    // out of the screen: a dot in a ring; into the screen: a cross in a ring
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, PS.TAU); ctx.stroke();
    if (dir > 0) PS.dot(ctx, cx, cy, 4, col); else { ctx.beginPath(); ctx.moveTo(cx - 7, cy - 7); ctx.lineTo(cx + 7, cy + 7); ctx.moveTo(cx + 7, cy - 7); ctx.lineTo(cx - 7, cy + 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
  },
  // an arrow along the shared (vertical) edge, shifted sideways by ox into one triangle
  edgeArrow(ctx, from, to, ox, col, al) {
    ctx.globalAlpha = al; PS.arrow(ctx, from[0] + ox, lerp(from[1], to[1], 0.22), to[0] + ox, lerp(from[1], to[1], 0.78), col, 3.5, 15); ctx.globalAlpha = 1;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.4, 11.6], t);
    const NT = [1.4, 5.8, 8.2]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.v.forEach((el, i) => el.style.opacity = eo(seg(t, [13.6, 12.2][i], [14.1, 12.7][i])));
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 0.3, 1.0)), flip = eo(seg(t, 7.8, 8.4)), back = eo(seg(t, 10.8, 11.4)), fl = flip * (1 - back);
    ctx.globalAlpha = a; PS.tri(ctx, A, L, B, PS.mix(c.g, c.m, 0.2), c.s, 2.5); PS.tri(ctx, B, Rr, A, PS.mix(c.g, fl > 0.5 ? c.a : c.m, fl > 0.5 ? 0.25 : 0.2), c.s, 2.5); ctx.globalAlpha = 1;
    // corner numbers: left 1 = A, 2 = L, 3 = B; right 1 = B, 2 = R, 3 = A (or, flipped, 1 = B, 2 = A, 3 = R)
    ctx.font = '600 24px ' + kit.fonts.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const num = (P, cen, s, col) => { const x = lerp(P[0], cen[0], 0.2), y = lerp(P[1], cen[1], 0.2); ctx.fillStyle = col; ctx.fillText(s, x, y); };
    const cL = [(A[0] + L[0] + B[0]) / 3, (A[1] + L[1] + B[1]) / 3], cR = [(A[0] + Rr[0] + B[0]) / 3, (A[1] + Rr[1] + B[1]) / 3], na = eo(seg(t, 0.8, 1.3));
    ctx.globalAlpha = na; num(A, cL, '1', c.a); num(L, cL, '2', c.a); num(B, cL, '3', c.a);
    num(B, cR, '1', c.a); num(fl > 0.5 ? A : Rr, cR, '2', c.a); num(fl > 0.5 ? Rr : A, cR, '3', c.a); ctx.globalAlpha = 1;
    this.turn(ctx, [A, L, B], 1, c.m, eo(seg(t, 1.2, 1.8)));
    this.turn(ctx, [B, Rr, A], fl > 0.5 ? -1 : 1, fl > 0.5 ? c.a : c.m, eo(seg(t, 1.2, 1.8)));
    // the shared edge: left walks B -> A, right walks A -> B (or B -> A once flipped)
    const ea = eo(seg(t, 5.8, 6.4));
    if (ea > 0) { this.edgeArrow(ctx, B, A, -24, c.m, ea); if (fl > 0.5) this.edgeArrow(ctx, B, A, 24, c.a, ea); else this.edgeArrow(ctx, A, B, 24, c.m, ea); }
    if (fl > 0.5) { const mx = A[0], my = (A[1] + B[1]) / 2; ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mx - 14, my - 14 + 120); ctx.lineTo(mx + 14, my + 14 + 120); ctx.moveTo(mx + 14, my - 14 + 120); ctx.lineTo(mx - 14, my + 14 + 120); ctx.stroke(); }
    // the real mesh with its outsides
    const m = eo(seg(t, 11.8, 12.6));
    if (m > 0) { const o = { c, cx: 1450, cy: 560, s: 560, yaw: lerp(-0.6, 0.6, eio(seg(t, 11.8, 20))), pitch: 0.08 }; MESH.draw(ctx, this.S, Object.assign({ tint: c.s, edge: 0, fill: m }, o)); MESH.pts(ctx, this.Q, o, 0, c.a, VW.facing(o, this.Q.N, m), 0.035, 9, c.a); }
  },
});
