const { seg, eo, eio, lerp, TextFx } = kit;
const SQ = [1120, 250, 630], IMG = ['dh_tex0.jpg', 'dh_tex200.jpg', 'dh_tex600.jpg', 'dh_tex.jpg'], IT = [8.0, 11.0, 14.0, 17.0];
const LAB = ['image prior, step 0: pure noise', 'step 200', 'step 600', 'the finished texture'];
kit.scene('d-texture', {
  async init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">DHSP · 2D texture prior</span><h2 class="line">Painting the colours</h2></div>' +
      '<div style="position:absolute;left:' + SQ[0] + 'px;top:' + SQ[1] + 'px;width:' + SQ[2] + 'px;height:' + SQ[2] + 'px;overflow:hidden">';
    IMG.forEach(n => { h += '<img class="d-texture-i" src="' + kit.assets.url(n) + '" style="position:absolute;left:0;top:0;width:' + SQ[2] + 'px;height:' + SQ[2] + 'px;opacity:0">'; });
    h += '</div>';
    LAB.forEach((s, i) => { h += '<div class="words" style="left:' + SQ[0] + 'px;top:' + (SQ[1] + SQ[2] + 12) + 'px;width:' + SQ[2] + 'px;align-items:center"><p class="note' + (i === 3 ? ' warm' : '') + ' d-texture-l">' + s + '</p></div>'; });
    h += '<p class="cap">Colour works the same way. The mesh is flattened again, and every dot drops its own colour at its address in the square.</p>' +
      '<p class="cap">An image prior starts from pure noise and is trained to match those colours, on this one picture. These are its real outputs.</p>' +
      '<p class="cap">Step by step it paints a full 1,024 by 1,024 texture: shirt, trousers, skin, even the red letters on the shirt.</p>' +
      '<p class="cap">Wrapped back through the UV map, the texture colours the mesh: DHSP’s own colour, made from the dots alone.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.im = q('.d-texture-i'); this.lab = q('.d-texture-l');
    this.U = DH.uvmesh(MESH.load(kit, 'dh-final.json')); this.D = DH.cdots(MESH.load(kit, 'dh-dots.json')); this.DUV = DH.dotUV(this.U, this.D);
    this.cols = null; try { this.cols = DH.texColors(this.U, await kit.assets.image('dh_tex.jpg')); } catch (e) { this.cols = null; }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.8, 13.6, 20.4], t);
    const iv = i => eo(seg(t, IT[i], IT[i] + 0.8)) * (i < 3 ? 1 - eo(seg(t, IT[i + 1] + 0.6, IT[i + 1] + 1.0)) : 1 - eo(seg(t, 20.6, 21.4)));
    this.im.forEach((el, i) => { el.style.opacity = iv(i); el.style.transform = 'scale(' + lerp(1, 1.015, seg(t, IT[i], IT[i] + 3)) + ')'; });
    this.lab.forEach((el, i) => el.style.opacity = iv(i));
    const ctx = this.k.fx, c = this.c, yaw = lerp(0.1, -0.4, eio(seg(t, 21, 30))), o = { c, cx: 700, cy: 566, s: 720, yaw, pitch: 0.12, sq: SQ, lw: 0.6 };
    if (t < 20.6) { ctx.globalAlpha = 0.6; ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.strokeRect(SQ[0], SQ[1], SQ[2], SQ[2]); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    const pre = eo(seg(t, 0.4, 1.4)) * (1 - eo(seg(t, 8.0, 8.8)));
    if (pre > 0) DH.unfold(ctx, this.U, Object.assign({}, o, { fill: 0.2 * pre, edge: 0.5 }), 1);
    const wrap = eo(seg(t, 20.4, 21.4)), back = eio(seg(t, 21.4, 26.4));
    if (wrap > 0) DH.unfold(ctx, this.U, Object.assign({}, o, { fill: wrap, colors: this.cols, edge: this.cols ? 0.08 : 0.4, stroke: this.cols ? PS.mix(c.g, c.s, 0.4) : null }), 1 - back);
    const fly = seg(t, 2.0, 7.0), da = eo(seg(t, 0.8, 1.6)) * (1 - eo(seg(t, 9.0, 10.0)));
    if (da > 0) {
      const th = 0.1, ph = 0.12, ct = Math.cos(th), st = Math.sin(th), fx = -0.669, fz = 0.744, R0 = fz * ct + fx * st, R1 = -fx * ct + fz * st, F0 = fx * ct - fz * st, F1 = fz * ct + fx * st, cp = Math.cos(ph), sp = Math.sin(ph), D = this.D;
      for (let i = 0; i < D.n; i++) {
        const x = D.P[3 * i], y = D.P[3 * i + 1], z = D.P[3 * i + 2], sx = x * R0 + z * R1, d = x * F0 + z * F1, X = o.cx + sx * o.s, Y = o.cy - (y * cp - d * sp) * o.s;
        const f = eio(Math.min(1, Math.max(0, fly * 1.4 - (i % 50) / 50 * 0.4))), qx = SQ[0] + this.DUV[2 * i] * SQ[2], qy = SQ[1] + (1 - this.DUV[2 * i + 1]) * SQ[2];
        ctx.globalAlpha = da; ctx.fillStyle = D.C[i]; ctx.fillRect(lerp(X, qx, f) - 2.5, lerp(Y, qy, f) - 2.5, 5, 5);
      }
      ctx.globalAlpha = 1;
    }
  },
});