const { seg, eo, eio, lerp, TextFx } = kit;
const GX0 = 160, GY0 = 380, CS = 40, GC = 40, GR = 9;
const FA = [0.9, 0.2, 0.7, 0.1, 0.8, 0.4, 0.3, 0.95], FB = [0.2, 0.85, 0.15, 0.7, 0.3, 0.9, 0.6, 0.1];
kit.scene('j-net', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 2</span><h2 class="line">What the network sees</h2></div>' +
      '<div class="words" style="left:110px;top:232px;gap:10px">' +
      '<p class="note j-net-n1" style="position:static;color:var(--second)">1. the dots go into a fine, sparse 3D grid</p>' +
      '<p class="note j-net-n2" style="position:static;color:var(--second)">2. a 3D U-Net looks around each dot at several scales</p>' +
      '<p class="note j-net-n3" style="position:static">3. each dot gets a feature: 64 numbers</p></div>' +
      '<p class="cap">First, all dots go into a fine 3D grid. Only the cells that contain a dot are used: a sparse grid.</p>' +
      '<p class="cap">A 3D convolutional network (a U-Net) looks around every dot at several scales: close up, then further out.</p>' +
      '<p class="cap">For every dot it produces a list of 64 numbers, a feature that describes the shape around that dot.</p>' +
      '<p class="cap">A dot on the arm and the dot just below it on the chest get different features, even though they are close in space.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.n = [1, 2, 3].map(i => kit.stage.querySelector('.j-net-n' + i).style);
    const occ = new Set();
    [...IW.CH, ...IW.ARM].forEach(p => { const i = Math.floor((p[0] - GX0) / CS), j = Math.floor((p[1] - GY0) / CS); if (i >= 0 && j >= 0 && i < GC && j < GR) occ.add(i + ',' + j); });
    this.occ = [...occ].map(s => s.split(',').map(Number));
  },
  bar(ctx, x, y, F, p) { const c = this.c; F.forEach((v, i) => { const f = eo(Math.min(1, Math.max(0, p * 8 - i))); if (f <= 0) return; ctx.globalAlpha = f; ctx.fillStyle = PS.mix(c.g, i % 2 ? c.m : c.a, 0.2 + 0.8 * v); ctx.fillRect(x + i * 38, y, 34, 34); }); ctx.globalAlpha = 1; },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 6.6, 12.8, 18.0], t);
    const ctx = this.k.fx, c = this.c, A = IW.ARM[0], B = IW.CH[10];
    const gp = eo(seg(t, 1.2, 2.4)) * (1 - 0.6 * seg(t, 6.4, 7.2));
    if (gp > 0) { ctx.globalAlpha = gp * 0.25; ctx.strokeStyle = c.s; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i <= GC; i++) { ctx.moveTo(GX0 + i * CS, GY0); ctx.lineTo(GX0 + i * CS, GY0 + GR * CS); } for (let j = 0; j <= GR; j++) { ctx.moveTo(GX0, GY0 + j * CS); ctx.lineTo(GX0 + GC * CS, GY0 + j * CS); } ctx.stroke(); ctx.globalAlpha = 1; }
    const op = seg(t, 2.8, 5.4);
    this.occ.forEach((o, k) => { const f = eo(Math.min(1, Math.max(0, op * this.occ.length * 0.3 - k * 0.3))); if (f <= 0) return; ctx.globalAlpha = f * 0.45 * (1 - 0.5 * seg(t, 6.4, 7.2)); ctx.fillStyle = c.m; ctx.fillRect(GX0 + o[0] * CS + 1, GY0 + o[1] * CS + 1, CS - 2, CS - 2); });
    ctx.globalAlpha = 1;
    IW.dots(ctx, c, i => eo(seg(t, 0.3 + i * 0.02, 0.7 + i * 0.02)));
    [40, 95, 170].forEach((s, k) => { const t0 = 7.2 + k * 1.6, p = eio(seg(t, t0, t0 + 1.0)); if (p <= 0) return; ctx.globalAlpha = 1 - 0.55 * seg(t, t0 + 1.4, t0 + 2.0) * (k < 2 ? 1 : 0); ctx.setLineDash([9, 7]); ctx.strokeStyle = c.a; ctx.lineWidth = 3; const r = s * p; ctx.strokeRect(A[0] - r, A[1] - r, 2 * r, 2 * r); ctx.setLineDash([]); ctx.globalAlpha = 1; });
    PS.dot(ctx, A[0], A[1], 13 * eo(seg(t, 6.8, 7.2)), c.a);
    const fb = seg(t, 13.4, 15.4);
    if (fb > 0) {
      ctx.font = '600 22px ' + this.mono; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.s;
      ctx.globalAlpha = eo(Math.min(1, fb * 3)); ctx.fillText('arm dot', 1406, 279); this.bar(ctx, 1420, 262, FA, fb);
      ctx.globalAlpha = 1;
    }
    const fc = seg(t, 18.4, 20.2);
    if (fc > 0) {
      PS.dot(ctx, B[0], B[1], 13 * eo(Math.min(1, fc * 3)), c.m);
      ctx.font = '600 22px ' + this.mono; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.s;
      ctx.globalAlpha = eo(Math.min(1, fc * 3)); ctx.fillText('chest dot', 1406, 335); this.bar(ctx, 1420, 318, FB, fc); ctx.globalAlpha = 1;
    }
    const ld = eo(seg(t, 14.0, 14.8));
    if (ld > 0) { ctx.globalAlpha = 0.5 * ld; ctx.setLineDash([5, 7]); ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A[0] + 14, A[1] - 6); ctx.quadraticCurveTo(1300, 560, 1416, 296); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    const ld2 = eo(seg(t, 18.8, 19.6));
    if (ld2 > 0) { ctx.globalAlpha = 0.5 * ld2; ctx.setLineDash([5, 7]); ctx.strokeStyle = c.m; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(B[0] + 14, B[1]); ctx.quadraticCurveTo(1380, 700, 1416, 352); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    this.n[0].opacity = eo(seg(t, 1.0, 1.5)); this.n[1].opacity = eo(seg(t, 6.8, 7.3)); this.n[2].opacity = eo(seg(t, 13.0, 13.5));
  },
});