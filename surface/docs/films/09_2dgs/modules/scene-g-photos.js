const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('g-photos', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">2DGS · The input</span><h2 class="line">Learning from photos</h2></div>' +
      '<div class="g-photos-w" style="position:absolute;left:1290px;top:250px;width:330px;height:440px;border-radius:12px;overflow:hidden;border:2px solid var(--accent);background:color-mix(in srgb, var(--ground) 80%, var(--second))"><img src="' + kit.assets.url('photo0.png') + '" style="position:absolute;left:0;top:0;width:330px;height:440px"></div>' +
      '<div class="words g-photos-l" style="left:1190px;top:706px;width:530px;align-items:center;gap:4px"><p class="note warm">photo 1 of 125, from the gold camera</p><p class="note" style="color:var(--second)">background removed by our mask</p></div>' +
      '<p class="note g-photos-c" style="left:150px;top:240px">125 real camera positions (from Sub-project 1)</p>' +
      '<p class="cap">2DGS uses our 125 photos, and for each one the exact camera position and direction, found back in Sub-project 1.</p>' +
      '<p class="cap">Here are all 125 real cameras around the person. The gold one took the photo on the right.</p>' +
      '<p class="cap">Our person masks remove the background, so it learns only the person. It starts from our dots, then learns from the pixels.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.g-photos-w')[0].style; this.l = q('.g-photos-l')[0].style; this.cl = q('.g-photos-c')[0].style;
    this.cams = MESH.load(kit, 'gs-cams.json'); this.G = GS.decode([MESH.load(kit, 'gs-s1.json'), MESH.load(kit, 'gs-s2.json')]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.6, 14.6], t);
    const w = eo(seg(t, 8.2, 9.0)); this.w.opacity = w; this.w.transform = 'scale(' + lerp(0.94, 1, w) + ')'; this.l.opacity = eo(seg(t, 8.8, 9.3)); this.cl.opacity = eo(seg(t, 2.6, 3.1));
    const ctx = this.k.fx, c = this.c, yaw = lerp(-0.9, 0.5, eio(seg(t, 0, 22))), ph = 0.32, s = 360, cx = 650, cy = 590;
    const ct = Math.cos(yaw), st = Math.sin(yaw), fx = -0.669, fz = 0.744, R0 = fz * ct + fx * st, R1 = -fx * ct + fz * st, F0 = fx * ct - fz * st, F1 = fz * ct + fx * st, cp = Math.cos(ph), sp = Math.sin(ph);
    const pr = (x, y, z) => { const sx = x * R0 + z * R1, d = x * F0 + z * F1; return [cx + sx * s, cy - (y * cp - d * sp) * s, d * cp + y * sp]; };
    GS.draw(ctx, this.G, { cx, cy, s, yaw, pitch: ph, grow: 2.4, alpha: eo(seg(t, 0.3, 1.5)) });
    const ca = seg(t, 2.4, 6.0);
    if (ca > 0) {
      ctx.lineJoin = 'round';
      this.cams.forEach((cm, i) => {
        const v = eo(Math.min(1, Math.max(0, ca * 1.5 - i / 125 * 0.5))); if (v <= 0) return;
        const p = cm.p, z = cm.z, y = cm.y, x = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]], L = 0.07, hw = 0.03, hh = 0.04;
        const b = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, e]) => pr(p[0] + z[0] * L + x[0] * hw * a + y[0] * hh * e, p[1] + z[1] * L + x[1] * hw * a + y[1] * hh * e, p[2] + z[2] * L + x[2] * hw * a + y[2] * hh * e)), o = pr(p[0], p[1], p[2]);
        const hot = i === 0 && t > 7.8; ctx.globalAlpha = v * (hot ? 1 : 0.75); ctx.strokeStyle = hot ? c.a : c.m; ctx.lineWidth = hot ? 3 : 1.4;
        ctx.beginPath(); b.forEach(q => { ctx.moveTo(o[0], o[1]); ctx.lineTo(q[0], q[1]); }); ctx.moveTo(b[0][0], b[0][1]); b.forEach(q => ctx.lineTo(q[0], q[1])); ctx.closePath(); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
  },
});