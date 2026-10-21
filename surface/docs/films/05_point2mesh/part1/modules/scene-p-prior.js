const { seg, eo, eio, lerp, TextFx } = kit;
const PX = [520, 1400], PY = 548, SC = 470;
kit.scene('p-prior', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Why a network</span><h2 class="line">The self-prior</h2></div>' +
      '<div class="words" style="left:270px;top:226px;width:500px;align-items:center"><p class="note p-prior-l">corners pushed freely</p></div>' +
      '<div class="words" style="left:1150px;top:226px;width:500px;align-items:center"><p class="note warm p-prior-l">pushed by the network</p></div>' +
      '<div class="words" style="left:270px;top:812px;width:500px;align-items:center"><p class="note p-prior-r" style="color:var(--second)">copies every wobble</p></div>' +
      '<div class="words" style="left:1150px;top:812px;width:500px;align-items:center"><p class="note p-prior-r" style="color:var(--second)">shape first, noise much later</p></div>' +
      '<p class="note p-prior-i" style="left:855px;top:526px;color:color-mix(in srgb, var(--second) 60%, var(--ground))">illustration</p>' +
      '<p class="cap">Why use a network at all? Side by side: on the left, corners pushed freely; on the right, pushed by the network.</p>' +
      '<p class="cap">The free corners copy the noise straight away. The network first finds the overall shape, smooth and regular.</p>' +
      '<p class="cap">Why? One shared filter makes the same kind of push everywhere. Regular patterns are easy for it; random wiggles are hard.</p>' +
      '<p class="cap">So the shape is fitted long before the noise. This built-in taste for clean shapes is called a self-prior.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.p-prior-l'); this.r = q('.p-prior-r'); this.i = q('.p-prior-i')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 13.0, 19.0], t);
    this.l.forEach(el => el.style.opacity = eo(seg(t, 0.6, 1.1))); this.i.opacity = eo(seg(t, 1.0, 1.5));
    this.r.forEach((el, i) => { const p = eo(seg(t, i ? 9.4 : 8.4, (i ? 9.4 : 8.4) + 0.5)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 12 + 'px)'; });
    const ctx = this.k.fx, c = this.c;
    const d = eo(seg(t, 0.4, 1.8)), mL = eio(seg(t, 2.4, 8.0)), mR = eio(seg(t, 2.4, 9.0)), late = 0.18 * eio(seg(t, 15.0, 22.0));
    [0, 1].forEach(side => {
      const S = p => [PX[side] + p[0] * SC, PY + p[1] * SC];
      if (d > 0) { ctx.globalAlpha = d; TOY.DOTS.forEach(p => { const q = S(p); PS.dot(ctx, q[0], q[1], 4, c.s); }); ctx.globalAlpha = 1; }
      const P = TOY.WRAP.map((w, k) => { const tgt = side ? [lerp(TOY.SMOOTH[k][0], TOY.DOTS[k][0], late), lerp(TOY.SMOOTH[k][1], TOY.DOTS[k][1], late)] : TOY.DOTS[k], m = side ? mR : mL; return S([lerp(w[0], tgt[0], m), lerp(w[1], tgt[1], m)]); });
      const a = eo(seg(t, 1.6, 2.4)); if (a <= 0) return;
      ctx.globalAlpha = a; ctx.strokeStyle = side ? c.a : c.m; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1;
    });
  },
});