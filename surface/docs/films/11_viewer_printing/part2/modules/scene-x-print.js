const { seg, eo, eio, lerp, TextFx } = kit;
const CX = 600, CY = 560, SC = 600;
kit.scene('x-print', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · In practice</span><h2 class="line">Ready for the printer</h2></div>' +
      '<div class="x-pr-f" style="position:absolute;left:110px;top:236px;width:1014px;height:616px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('fig_print.jpg') + '" style="position:absolute;left:0;top:0;width:1014px;height:616px"></div>' +
      '<div class="words x-pr-fl" style="left:110px;top:864px;width:1014px;align-items:center"><p class="note">our closed meshes, textured from the photos</p></div>' +
      '<div class="words x-pr-ml" style="left:300px;top:212px;width:600px;align-items:center"><p class="note warm">our DHSP mesh: faces pointing down in yellow</p></div>' +
      '<div class="words" style="left:1200px;top:280px;width:640px;gap:12px">' +
      '<p class="eq x-pr-n" style="font-size:40px">about 53 × 52 × 180 mm</p><p class="note x-pr-n" style="color:var(--second)">the size of each closed figure</p>' +
      '<p class="eq x-pr-n" style="font-size:40px;margin-top:24px">about 100 cm³</p><p class="note x-pr-n" style="color:var(--second)">of plastic, if printed solid</p>' +
      '<p class="eq x-pr-n" style="font-size:40px;margin-top:24px;color:var(--accent)">supports under the arms</p><p class="note x-pr-n" style="color:var(--second)">a layer needs something below it</p>' +
      '<p class="eq x-pr-n" style="font-size:40px;margin-top:24px">STL, or a coloured OBJ</p><p class="note x-pr-n" style="color:var(--second)">plus a report of every check</p></div>' +
      '<p class="cap">Here are closed meshes as written for printing, 180 mm tall: about 53 by 52 by 180 mm, and about 100 cm³ of plastic if printed solid.</p>' +
      '<p class="cap">One practical catch: a printer can only build on top of what is already there. Surfaces facing down, like under the crossed arms, need supports.</p>' +
      '<p class="cap">The export notes this for the slicer: add supports under the arms and a base plate. The STL is exactly the mesh that passed the checks.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.f = q('.x-pr-f')[0].style; this.fl = q('.x-pr-fl')[0].style; this.ml = q('.x-pr-ml')[0].style; this.n = q('.x-pr-n');
    // faces whose outside points down more than 45 degrees: the ones that need support
    const S = this.S = VW.mesh(kit, 'vw-dh.json'), P = S.P, F = S.F, A = PS.hex(this.c.a); let vol = 0; const ny = [];
    for (let k = 0; k < S.nf; k++) { const a = 3 * F[3 * k], b = 3 * F[3 * k + 1], e = 3 * F[3 * k + 2], ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[e] - P[a], vy = P[e + 1] - P[a + 1], vz = P[e + 2] - P[a + 2], nx = uy * vz - uz * vy, nY = uz * vx - ux * vz, nz = ux * vy - uy * vx; vol += P[a] * nx + P[a + 1] * nY + P[a + 2] * nz; ny.push([nY / (Math.hypot(nx, nY, nz) || 1), (P[a + 1] + P[b + 1] + P[e + 1]) / 3]); }
    const sg = vol < 0 ? -1 : 1; this.cols = ny.map(([n, y]) => (sg * n < -0.707 && y > -0.47 ? A : [196, 200, 206]));
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.6], t);
    const swp = eio(seg(t, 8.6, 9.6)), fa = eo(seg(t, 0.2, 0.9)) * (1 - swp);
    this.f.opacity = fa; this.f.transform = 'scale(' + lerp(0.97, 1, eo(seg(t, 0.2, 0.9))) + ')'; this.fl.opacity = eo(seg(t, 0.8, 1.3)) * (1 - swp); this.ml.opacity = eo(seg(t, 9.8, 10.3));
    const NT = [1.4, 1.9, 3.0, 3.5, 7.4, 7.9, 14.0, 14.5]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const m = eo(seg(t, 9.2, 10.0)); if (m <= 0) return;
    const ctx = this.k.fx, c = this.c;
    ctx.globalAlpha = m; ctx.fillStyle = PS.mix(c.g, c.m, 0.18); ctx.strokeStyle = PS.mix(c.g, c.m, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, CY + 0.5 * SC + 6, 220, 40, 0, 0, PS.TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    MESH.draw(ctx, this.S, { c, cx: CX, cy: CY, s: SC, yaw: lerp(-0.4, 0.9, eio(seg(t, 9.2, 20))), pitch: -0.1, colors: this.cols, edge: 0, fill: m });
  },
});
