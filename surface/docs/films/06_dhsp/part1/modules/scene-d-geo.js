const { seg, eo, eio, lerp, TextFx } = kit;
const SQ = [1120, 250, 630];
kit.scene('d-geo', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · 2D geometry prior</span><h2 class="line">A picture of the shape</h2></div>' +
      '<div class="words d-geo-l" style="left:200px;top:236px;gap:4px"><p class="note" style="color:var(--second)">red: left ↔ right</p><p class="note" style="color:var(--second)">green: down ↔ up</p><p class="note" style="color:var(--second)">blue: back ↔ front</p></div>' +
      '<div class="words" style="left:' + SQ[0] + 'px;top:' + (SQ[1] + SQ[2] + 12) + 'px;width:' + SQ[2] + 'px;align-items:center"><p class="note d-geo-q">dots in the square: a picture full of gaps</p><p class="note warm d-geo-r" style="position:absolute;top:0;left:0;right:0;text-align:center">filled by the image prior: the geometry image</p></div>' +
      '<p class="note d-geo-x" style="left:200px;top:880px;color:color-mix(in srgb, var(--second) 60%, var(--ground))">shown on our final mesh</p>' +
      '<p class="cap">Now the shape. Each dot finds the nearest spot on the skin and takes that spot’s address in the square.</p>' +
      '<p class="cap">There it stores its 3D position as a colour: red for left and right, green for up and down, blue for back and front.</p>' +
      '<p class="cap">An image prior, trained only on this one picture, fills every gap smoothly: a complete geometry image.</p>' +
      '<p class="cap">Reading positions back moves the mesh corners to where the picture says. Then the 3D prior polishes once more, for 1,200 steps.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.d-geo-l')[0].style; this.q = q('.d-geo-q')[0].style; this.r = q('.d-geo-r')[0].style; this.x = q('.d-geo-x')[0].style;
    this.U = DH.uvmesh(MESH.load(kit, 'dh-final.json')); this.D = DH.cdots(MESH.load(kit, 'dh-dots.json'));
    this.DUV = DH.dotUV(this.U, this.D); this.DC = DH.dotGeo(this.D); this.GC = DH.geoColors(this.U);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.6, 11.4, 17.6], t);
    this.l.opacity = eo(seg(t, 5.8, 6.3)); this.x.opacity = eo(seg(t, 1.0, 1.5));
    this.q.opacity = eo(seg(t, 8.4, 8.9)) * (1 - eo(seg(t, 11.4, 11.9))); this.r.opacity = eo(seg(t, 12.0, 12.5)) * (1 - eo(seg(t, 17.6, 18.1)));
    const ctx = this.k.fx, c = this.c, yaw = 0.15, o = { c, cx: 700, cy: 566, s: 720, yaw, pitch: 0.12, sq: SQ, edge: 0.25, lw: 0.6 };
    const back = eio(seg(t, 18.0, 23.0)), fillIn = eo(seg(t, 11.6, 15.4));
    ctx.globalAlpha = 0.6; ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.strokeRect(SQ[0], SQ[1], SQ[2], SQ[2]); ctx.setLineDash([]); ctx.globalAlpha = 1;
    const ga = eo(seg(t, 0.4, 1.4));
    if (fillIn <= 0) DH.unfold(ctx, this.U, Object.assign({}, o, { fill: 0.22 * ga, edge: 0.5 }), 1);
    else DH.unfold(ctx, this.U, Object.assign({}, o, { fill: Math.max(0.22, fillIn), colors: this.GC, edge: 0.1, stroke: PS.mix(c.g, c.s, 0.3) }), 1 - back);
    const fly = eio(seg(t, 3.0, 8.0)), da = eo(seg(t, 0.8, 1.8)) * (1 - eo(seg(t, 13.0, 15.0)));
    if (da > 0) {
      const th = yaw, ph = 0.12, ct = Math.cos(th), st = Math.sin(th), fx = -0.669, fz = 0.744, R0 = fz * ct + fx * st, R1 = -fx * ct + fz * st, F0 = fx * ct - fz * st, F1 = fz * ct + fx * st, cp = Math.cos(ph), sp = Math.sin(ph), D = this.D;
      for (let i = 0; i < D.n; i++) {
        const x = D.P[3 * i], y = D.P[3 * i + 1], z = D.P[3 * i + 2], sx = x * R0 + z * R1, d = x * F0 + z * F1, X = o.cx + sx * o.s, Y = o.cy - (y * cp - d * sp) * o.s;
        const f = eio(Math.min(1, Math.max(0, fly * 1.4 - (i % 50) / 50 * 0.4))), qx = SQ[0] + this.DUV[2 * i] * SQ[2], qy = SQ[1] + (1 - this.DUV[2 * i + 1]) * SQ[2];
        ctx.globalAlpha = da; ctx.fillStyle = seg(t, 5.4, 6.4) > 0.5 ? this.DC[i] : c.s; ctx.fillRect(lerp(X, qx, f) - 2, lerp(Y, qy, f) - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
    }
  },
});