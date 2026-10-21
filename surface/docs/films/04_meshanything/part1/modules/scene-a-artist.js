const { seg, eo, eio, lerp, TextFx } = kit;
const SH = [[-0.16,-0.48],[-0.08,-0.40],[0,-0.37],[0.08,-0.40],[0.16,-0.48],[0.40,-0.38],[0.56,-0.12],[0.40,-0.02],[0.32,-0.16],[0.32,0.50],[-0.32,0.50],[-0.32,-0.16],[-0.40,-0.02],[-0.56,-0.12],[-0.40,-0.38]];
function dense() { const out = []; for (let i = 0; i < SH.length; i++) { const a = SH[i], b = SH[(i + 1) % SH.length], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.022)); for (let j = 0; j < m; j++) out.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]); } out.push(out[0]); return out; }
kit.scene('a-artist', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · The goal</span><h2 class="line">Two kinds of mesh</h2></div>' +
      '<div class="words" style="left:270px;top:236px;width:500px;align-items:center"><p class="note a-artist-l">like a scanner</p></div>' +
      '<div class="words" style="left:1150px;top:236px;width:500px;align-items:center"><p class="note warm a-artist-l">like a 3D artist</p></div>' +
      '<div class="words" style="left:270px;top:846px;width:500px;align-items:center"><p class="eq num a-artist-n">191 pieces</p></div>' +
      '<div class="words" style="left:1150px;top:846px;width:500px;align-items:center"><p class="eq num a-artist-n" style="color:var(--accent)">15 pieces</p></div>' +
      '<p class="note warm a-artist-h" style="left:430px;top:620px">31 corners here</p>' +
      '<p class="note warm a-artist-h" style="left:1310px;top:620px">2 corners here</p>' +
      '<p class="cap">Here is one outline, drawn twice. On the left, the way a scanner would: many tiny, equal pieces.</p>' +
      '<p class="cap">On the right, the way a 3D artist would: a corner only where the outline turns. Same shape, far fewer pieces.</p>' +
      '<p class="cap">That tidy kind is called an artist mesh, the kind people build by hand for games. MeshAnything is trained to make it.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.lab = [...kit.stage.querySelectorAll('.a-artist-l')]; this.num = [...kit.stage.querySelectorAll('.a-artist-n')]; this.hl = [...kit.stage.querySelectorAll('.a-artist-h')];
    this.D = dense(); this.A = SH.concat([SH[0]]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.2], t);
    this.lab[0].style.opacity = eo(seg(t, 0.5, 1.0)); this.lab[1].style.opacity = eo(seg(t, 6.4, 6.9));
    this.num.forEach((el, i) => { const p = eo(seg(t, i ? 8.8 : 4.2, (i ? 8.8 : 4.2) + 0.5)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    this.hl.forEach((el, i) => el.style.opacity = eo(seg(t, 9.6 + i * 0.5, 10.1 + i * 0.5)));
    const ctx = this.k.fx, c = this.c, br = 1 + 0.01 * Math.sin(t * PS.TAU / 3.2);
    const pl = (P, cx) => P.map(p => [cx + p[0] * 520 * br, 565 + p[1] * 520 * br]);
    const L = pl(this.D, 520), R = pl(this.A, 1400);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const p1 = eio(seg(t, 0.8, 4.0));
    if (p1 > 0) { ctx.strokeStyle = c.m; ctx.lineWidth = 4; PS.poly(ctx, L, p1); const n = Math.floor((L.length - 1) * p1); for (let i = 0; i <= n && i < L.length - 1; i++) PS.dot(ctx, L[i][0], L[i][1], 4.5, c.s); }
    const p2 = eio(seg(t, 6.6, 8.6));
    if (p2 > 0) { ctx.strokeStyle = c.a; ctx.lineWidth = 5; PS.poly(ctx, R, p2); const n = Math.floor((R.length - 1) * p2); for (let i = 0; i <= n && i < R.length - 1; i++) PS.dot(ctx, R[i][0], R[i][1], 9, c.s); }
    const h = eo(seg(t, 9.4, 10.0));
    if (h > 0) {
      ctx.globalAlpha = h; ctx.strokeStyle = c.a; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(L[60][0], L[60][1]); for (let i = 61; i <= 90; i++) ctx.lineTo(L[i][0], L[i][1]); ctx.stroke();
      for (let i = 60; i <= 90; i++) PS.dot(ctx, L[i][0], L[i][1], 6, c.a);
      ctx.beginPath(); ctx.moveTo(R[8][0], R[8][1]); ctx.lineTo(R[9][0], R[9][1]); ctx.stroke();
      PS.dot(ctx, R[8][0], R[8][1], 12, c.a); PS.dot(ctx, R[9][0], R[9][1], 12, c.a); ctx.globalAlpha = 1;
    }
  },
});