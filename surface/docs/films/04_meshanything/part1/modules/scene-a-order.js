const { seg, eo, eio, eob, lerp, TextFx } = kit;
const V = [[280, 620], [380, 430], [480, 620], [580, 430], [680, 620], [780, 430], [880, 620], [980, 430], [1080, 620]];
const T = [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6], [5, 6, 7], [6, 7, 8]];
const LET = 'abcdefg', IN = [3, 1, 6, 0, 5, 2, 4];
kit.scene('a-order', {
  init(kit) {
    const bx = s => '<p class="box num a-order-b" style="font-size:30px;padding:8px 14px">' + s + '</p>';
    let h = '<div class="ground"><div class="words head"><span class="tag">MeshAnything · Tokens</span><h2 class="line">A fixed reading order</h2></div>' +
      '<div class="words" style="left:1260px;top:300px;width:600px;gap:14px">' +
      '<p class="note a-order-r">listed in a random order:</p>' +
      '<p class="eq num a-order-r" style="font-size:40px">d b g a f c e</p>' +
      '<p class="eq num a-order-r" style="font-size:40px">f a c g b e d</p>' +
      '<p class="eq num a-order-r" style="font-size:40px">b e a d g c f</p>' +
      '<p class="note warm a-order-r">one mesh, three different sentences</p>' +
      '<p class="note a-order-r" style="margin-top:28px">real rule: by z, then y, then x</p></div>' +
      '<div class="words" style="left:250px;top:728px;flex-direction:row;gap:12px">' + T.map(f => bx('(' + f.map(i => i + 1).join(' ') + ')')).join('') + '</div>' +
      '<div class="words" style="left:250px;top:818px"><p class="eq a-order-e" style="font-size:46px">one mesh → always the same sentence</p></div>';
    V.forEach((p, i) => { h += '<p class="note warm a-order-n" style="left:' + (p[0] - 8) + 'px;top:' + (p[1] < 500 ? p[1] - 62 : p[1] + 22) + 'px;font-size:30px">' + (i + 1) + '</p>'; });
    h += '<p class="cap">The same mesh could be listed in any order. Three random orders give three different sentences for one shape.</p>' +
      '<p class="cap">So the corners are first sorted by position along one direction, and numbered in that order.</p>' +
      '<p class="cap">Each triangle is then written by its corner numbers, smallest first. Now one mesh always gives one sentence.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.r = q('.a-order-r'); this.n = q('.a-order-n'); this.b = q('.a-order-b'); this.e = q('.a-order-e')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 12.0], t);
    const RT = [2.6, 3.2, 4.0, 4.8, 5.8, 10.0], dim = 1 - 0.7 * eo(seg(t, 10.2, 10.8));
    this.r.forEach((el, i) => { const p = eo(seg(t, RT[i], RT[i] + 0.5)); el.style.opacity = p * (i < 5 ? dim : 1); el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const sx = lerp(220, 1140, eio(seg(t, 7.0, 10.0)));
    this.n.forEach((el, i) => { const p = seg(t, 7.0 + (V[i][0] - 220) / 920 * 3.0, 7.4 + (V[i][0] - 220) / 920 * 3.0); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.6, 1, eob(p, 1.8)) + ')'; });
    this.b.forEach((el, i) => { const p = seg(t, 10.8 + i * 0.4, 11.2 + i * 0.4); el.style.opacity = eo(p); el.style.transform = 'translateY(' + (1 - eo(p)) * 16 + 'px)'; });
    this.e.opacity = eo(seg(t, 14.0, 14.6));
    const ctx = this.k.fx, c = this.c;
    const hi = Math.floor((t - 10.8) / 0.4);
    ctx.font = '600 34px ' + kit.fonts.mono;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    T.forEach((f, k) => {
      const p = eo(seg(t, 0.5 + IN[k] * 0.22, 0.9 + IN[k] * 0.22)); if (p <= 0) return;
      const hot = t > 10.8 && t < 13.8 && hi === k;
      ctx.globalAlpha = p; PS.tri(ctx, V[f[0]], V[f[1]], V[f[2]], hot ? PS.mix(c.g, c.a, 0.45) : PS.mix(c.g, c.m, 0.22), hot ? c.a : c.m, 3);
      const cx = (V[f[0]][0] + V[f[1]][0] + V[f[2]][0]) / 3, cy = (V[f[0]][1] + V[f[1]][1] + V[f[2]][1]) / 3;
      ctx.fillStyle = PS.mix(c.g, c.s, 0.85); ctx.fillText(LET[k], cx, cy); ctx.globalAlpha = 1;
    });
    V.forEach((p, i) => { const on = seg(t, 7.0 + (p[0] - 220) / 920 * 3.0, 7.3 + (p[0] - 220) / 920 * 3.0); PS.dot(ctx, p[0], p[1], 10 * eo(seg(t, 0.4, 0.9)), on > 0 ? PS.mix(c.s, c.a, on) : c.s); });
    const sw = seg(t, 6.8, 7.1) * (1 - seg(t, 10.0, 10.4));
    if (sw > 0) { ctx.globalAlpha = sw; ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, 360); ctx.lineTo(sx, 690); ctx.stroke(); PS.arrow(ctx, sx - 30, 700, sx + 40, 700, c.a, 3, 12); ctx.globalAlpha = 1; }
  },
});