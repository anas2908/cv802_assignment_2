const { seg, eo, eio, lerp, TextFx } = kit;
const F = x => 700 - 0.0011 * (x - 1250) * (x - 1250);
const FA = x => Math.atan(-0.0022 * (x - 1250));
kit.scene('pca', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 4</span><h2 class="line">One small tile per dot</h2></div>' +
      '<p class="note warm pca-n1" style="left:1390px;top:500px">24 nearest neighbours</p>' +
      '<p class="note pca-n2" style="left:1300px;top:470px">out or in?</p>' +
      '<p class="cap">Zoom into the shoulder. Pick one dot and gather its 24 nearest neighbours.</p>' +
      '<p class="cap">Fit a flat tile through them (PCA). Up close, skin is almost flat.</p>' +
      '<p class="cap">The arrow is the direction where the neighbours spread least. But out or in? A tile has two faces.</p>' +
      '<p class="cap">Repeat for every dot: each one gets its own tile and arrow line. Not one plane, 139,000 tiny ones.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.n1 = kit.stage.querySelector('.pca-n1').style; this.n2 = kit.stage.querySelector('.pca-n2').style;
    const r = PS.rng(9), P = [];
    for (let i = 0; i < 190; i++) { const x = 880 + r() * 740; const a = FA(x); const n = (r() + r() + r() - 1.5) * 13; P.push([x - Math.sin(a) * n, F(x) - Math.cos(a) * n]); }
    P.push([1250, F(1250)]);
    this.P = P; this.me = P[P.length - 1];
    const d = P.map((p, i) => [Math.hypot(p[0] - this.me[0], p[1] - this.me[1]), i]).sort((A, B) => A[0] - B[0]);
    this.nb = new Set(d.slice(1, 25).map(v => v[1])); this.rad = d[24][0] + 10;
    this.more = [960, 1050, 1140, 1350, 1440, 1530, 1600].map(x => [x, F(x), FA(x)]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 2.8, 5.0, 8.2], t);
    const ctx = this.k.fx, c = this.c, me = this.me;
    const hp = eo(seg(t, 1.0, 2.4));
    this.P.forEach((p, i) => PS.dot(ctx, p[0], p[1], 6, this.nb.has(i) && hp > 0 ? PS.mix(c.s, c.a, hp) : c.s));
    PS.dot(ctx, me[0], me[1], 10, c.a);
    if (hp > 0) { ctx.globalAlpha = 0.9; ctx.setLineDash([8, 8]); ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(me[0], me[1], this.rad * hp, 0, PS.TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    this.n1.opacity = hp * (1 - seg(t, 4.6, 5.0));
    const tp = eio(seg(t, 2.9, 4.5)), ta = lerp(0.95, FA(1250), tp), L = this.rad * 1.15;
    if (t > 2.8) {
      ctx.globalAlpha = eo(seg(t, 2.8, 3.2)); ctx.strokeStyle = c.m; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(me[0] - Math.cos(ta) * L, me[1] - Math.sin(ta) * L); ctx.lineTo(me[0] + Math.cos(ta) * L, me[1] + Math.sin(ta) * L); ctx.stroke(); ctx.globalAlpha = 1;
    }
    const ap = eo(seg(t, 4.8, 5.7));
    if (ap > 0) {
      const sw = t > 6.0 ? Math.cos(Math.PI * eio(seg(t, 6.0, 7.0))) * (t < 7.4 ? 1 : Math.cos(Math.PI * (1 - eio(seg(t, 7.4, 8.2))))) : 1;
      const nx = Math.sin(ta), ny = -Math.cos(ta), len = 120 * ap * sw;
      PS.arrow(ctx, me[0], me[1], me[0] + nx * len, me[1] + ny * len, c.a, 5, 20);
      if (t > 6.0 && t < 8.3) { ctx.globalAlpha = 0.35 * Math.sin(Math.PI * seg(t, 6.0, 8.3)); PS.arrow(ctx, me[0], me[1], me[0] - nx * 120 * sw, me[1] - ny * 120 * sw, c.s, 3, 14); ctx.globalAlpha = 1; }
    }
    this.n2.opacity = eo(seg(t, 6.0, 6.4)) * (1 - seg(t, 7.9, 8.3));
    this.more.forEach((m, i) => {
      const p = eo(seg(t, 8.4 + i * 0.28, 8.9 + i * 0.28)); if (p <= 0) return;
      const a = m[2], l = 52, nx = Math.sin(a), ny = -Math.cos(a);
      ctx.globalAlpha = p; ctx.strokeStyle = c.m; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m[0] - Math.cos(a) * l, m[1] - Math.sin(a) * l); ctx.lineTo(m[0] + Math.cos(a) * l, m[1] + Math.sin(a) * l); ctx.stroke();
      ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m[0] - nx * 60 * p, m[1] - ny * 60 * p); ctx.lineTo(m[0] + nx * 60 * p, m[1] + ny * 60 * p); ctx.stroke();
      ctx.globalAlpha = 1;
    });
  },
});