const { seg, eo, eio, lerp, TextFx } = kit;
const CX = 1560, CY = 520, SC = 640, FY = CY + 0.5 * SC;
kit.scene('x-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:1100px;gap:22px">' +
      '<span class="tag">CV802 · Part 2 of the viewer film</span>' +
      '<h1 class="line big">3D printing</h1>' +
      '<p class="sub x-title-sub">what a printer needs from a mesh, and which of ours have it</p>' +
      '<p class="note warm x-title-n" style="margin-top:26px">on the right: our DHSP mesh on a build plate</p></div>' +
      '<p class="note x-title-m" style="left:1218px;top:505px">180 mm</p>' +
      '<p class="cap">The project also asked: could the person be 3D printed? A printer is far stricter about a mesh than a screen is.</p>' +
      '<p class="cap">This part shows what a printer needs, which of our meshes pass, and why some of them never could.</p></div>'));
    this.k = kit; this.c = PS.col(kit); this.S = VW.mesh(kit, 'vw-dh.json');
    this.line = kit.stage.querySelector('.line'); this.sub = kit.stage.querySelector('.x-title-sub').style; this.n = kit.stage.querySelector('.x-title-n').style; this.m = kit.stage.querySelector('.x-title-m').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0)); this.m.opacity = eo(seg(t, 2.2, 2.7));
    PS.caps(this.caps, [0.3, 4.4], t);
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, -0.6, 0.4));
    ctx.globalAlpha = a; ctx.fillStyle = PS.mix(c.g, c.m, 0.18); ctx.strokeStyle = PS.mix(c.g, c.m, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, FY + 6, 230, 42, 0, 0, PS.TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    MESH.draw(ctx, this.S, { c, cx: CX, cy: CY, s: SC, yaw: lerp(-0.7, 0.7, eio(seg(t, -0.5, 8.5))), pitch: 0.08, colors: this.S.C, edge: 0, fill: a });
    const b = eio(seg(t, 2.0, 2.8)); if (b > 0) { ctx.strokeStyle = c.m; ctx.lineWidth = 2.5; const y0 = FY, y1 = lerp(FY, CY - 0.5 * SC, b); ctx.beginPath(); ctx.moveTo(1340, y0); ctx.lineTo(1340, y1); ctx.moveTo(1328, y0); ctx.lineTo(1352, y0); if (b > 0.98) { ctx.moveTo(1328, y1); ctx.lineTo(1352, y1); } ctx.stroke(); }
  },
});
