const { seg, eo, eio, lerp, TextFx } = kit;
const COLS = 8, ROWS = 6;
kit.scene('i-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head" style="top:290px;width:840px">' +
      '<span class="tag i-title-tag">Method 2 · ECCV 2020</span>' +
      '<h1 class="line big">Meshing with IER</h1>' +
      '<p class="sub i-title-sub">Don’t build a new surface: choose which dots to join into triangles</p></div></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.tag = kit.stage.querySelector('.i-title-tag').style; this.sub = kit.stage.querySelector('.i-title-sub').style;
    this.P = PS.jgrid(1080, 300, 90, COLS, ROWS, 20, 7);
    const cx = 1080 + 90 * (COLS - 1) / 2, cy = 300 + 90 * (ROWS - 1) / 2;
    this.T = PS.gtris(COLS, ROWS).map(t => { const m = [0, 1].map(k => (this.P[t[0]][k] + this.P[t[1]][k] + this.P[t[2]][k]) / 3); return { t, d: Math.hypot(m[0] - cx, m[1] - cy) }; });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.tag.opacity = eo(seg(t, -0.6, 0.0)); this.sub.opacity = eo(seg(t, -0.3, 0.3));
    const ctx = this.k.fx, c = this.c;
    this.T.forEach(o => {
      const p = eo(seg(t, -0.6 + o.d / 340 * 4.2, -0.1 + o.d / 340 * 4.2)); if (p <= 0) return;
      const A = this.P[o.t[0]], B = this.P[o.t[1]], C = this.P[o.t[2]];
      ctx.globalAlpha = p; ctx.fillStyle = PS.mix(c.g, c.m, 0.28); ctx.strokeStyle = c.m; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    this.P.forEach(p => PS.dot(ctx, p[0], p[1], 8, c.s));
  },
});