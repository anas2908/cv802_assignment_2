const { seg, eo, eio, lerp, TextFx } = kit;
const CY = 490, RR = 160, CL = 620, CR = 1300, G0 = -0.42, G1 = 0.04;
const rad = th => RR * (1 + 0.12 * Math.cos(2 * th) + 0.05 * Math.sin(3 * th + 0.4));
const P = (cx, th) => [cx + rad(th) * Math.cos(th), CY + rad(th) * Math.sin(th)];
const inGap = th => { const a = Math.atan2(Math.sin(th), Math.cos(th)); return a > G0 && a < G1; };
kit.scene('m-wt', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Can it be printed?</h2></div>' +
      '<p class="note m-wt-l1" style="left:390px;top:722px">closed: holds water  →  printable</p>' +
      '<p class="note warm m-wt-l2" style="left:1060px;top:722px">a hole: water leaks out</p>' +
      '<p class="note warm m-wt-l3" style="left:1540px;top:330px">open ends</p>' +
      '<div class="words" style="left:180px;top:790px;gap:10px">' +
      '<p class="note m-wt-p1" style="position:static">printable:  Poisson (untrimmed) · Shape As Points · DHSP (after our fix) · Point2Mesh</p>' +
      '<p class="note warm m-wt-p2" style="position:static">not printable:  Poisson (trimmed) · IER · MeshAnything · NKSR · 2DGS</p></div>' +
      '<p class="cap">A 3D printer fills the inside of a mesh with plastic, so the mesh must be closed, with a clear inside.</p>' +
      '<p class="cap">Think of pouring in water: a closed mesh holds it, a mesh with a hole leaks. Closed means watertight.</p>' +
      '<p class="cap">The rule: every edge is shared by exactly two triangles. Here every point joins two pieces, except the yellow open ends.</p>' +
      '<p class="cap">Watertight meshes can go to the printer. Open ones need repair first, or a method that closes the surface.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.m-wt-' + k).style;
    Object.assign(this, { l1: q('l1'), l2: q('l2'), l3: q('l3'), p1: q('p1'), p2: q('p2') });
    this.gapY = P(CR, G1)[1];
  },
  shape(ctx, cx, leaky, prog) {
    const N = 240, n = Math.floor(N * prog); let pen = false;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const th = -Math.PI / 2 + i / N * PS.TAU; if (leaky && inGap(th)) { pen = false; continue; } const p = P(cx, th); pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; }
    ctx.stroke();
  },
  fill(ctx, cx, level) {
    ctx.save(); ctx.beginPath(); for (let i = 0; i <= 240; i++) { const p = P(cx, i / 240 * PS.TAU); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.closePath(); ctx.clip();
    ctx.globalAlpha = 0.55; ctx.fillStyle = this.c.m; ctx.fillRect(cx - 260, level, 520, 400); ctx.restore(); ctx.globalAlpha = 1;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 4.4, 9.6, 13.6], t);
    const ctx = this.k.fx, c = this.c;
    const bottom = CY + RR * 1.2, top = CY - RR * 1.2;
    const f = eio(seg(t, 2.6, 7.0)), lvL = lerp(bottom, top, f), lvR = Math.max(lvL, this.gapY);
    if (f > 0) { this.fill(ctx, CL, lvL); this.fill(ctx, CR, lvR); }
    if (lvL <= this.gapY + 1 && f > 0) {
      const s = eo(seg(t, 4.2, 5.2)), g = P(CR, G1);
      ctx.globalAlpha = 0.6 * s; ctx.strokeStyle = c.m; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(g[0], g[1]); ctx.quadraticCurveTo(g[0] + 50, g[1] + 20, g[0] + 60, g[1] + lerp(20, 190, s)); ctx.stroke();
      for (let k = 0; k < 4; k++) { const ph = (t * 1.3 + k * 0.25) % 1; PS.dot(ctx, g[0] + 62, g[1] + 200 + ph * 50, 6 * s * (1 - ph), c.m); }
      ctx.globalAlpha = 1;
    }
    const o = eio(seg(t, 0.6, 2.2));
    ctx.strokeStyle = c.s; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o > 0) { this.shape(ctx, CL, false, o); this.shape(ctx, CR, true, o); }
    const vp = eo(seg(t, 9.8, 11.0));
    if (vp > 0) {
      for (let i = 0; i < 30; i++) { const th = i / 30 * PS.TAU; [CL, CR].forEach(cx => { if (cx === CR && inGap(th)) return; const p = P(cx, th); PS.dot(ctx, p[0], p[1], 6 * vp, c.m); }); }
      [G0, G1].forEach(th => { const p = P(CR, th); PS.dot(ctx, p[0], p[1], 13 * vp, c.a); });
    }
    this.l1.opacity = eo(seg(t, 7.2, 7.8)); this.l2.opacity = eo(seg(t, 7.6, 8.2)); this.l3.opacity = eo(seg(t, 10.6, 11.2));
    this.p1.opacity = eo(seg(t, 13.8, 14.4)); this.p2.opacity = eo(seg(t, 14.6, 15.2));
  },
});