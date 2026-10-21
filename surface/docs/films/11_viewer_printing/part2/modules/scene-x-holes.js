const { seg, eo, eio, lerp, TextFx } = kit;
const PANE = [[110, 930], [990, 1810]], PT = 230, PB = 900, MX = [520, 1400], MY = 615, MS = 540;
kit.scene('x-holes', {
  init(kit) {
    const lab = (i, a, b, col) => '<p class="note" style="' + (i ? 'right' : 'left') + ':18px;top:14px;font-size:24px;color:var(--second)">' + a + '</p><p class="note x-holes-s" style="' + (i ? 'right' : 'left') + ':18px;top:48px;font-size:24px;color:' + col + '">' + b + '</p>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · Our meshes</span><h2 class="line">Holes on our meshes</h2></div>' +
      '<div class="x-holes-p" style="position:absolute;left:' + PANE[0][0] + 'px;top:' + PT + 'px;width:' + (PANE[0][1] - PANE[0][0]) + 'px;height:' + (PB - PT) + 'px;box-sizing:border-box;border:2px solid color-mix(in srgb, var(--main) 45%, var(--ground));border-radius:12px">' + lab(0, 'DHSP · 9,000 edges', 'every edge shared by 2', 'var(--main)') + '</div>' +
      '<div class="x-holes-p" style="position:absolute;left:' + PANE[1][0] + 'px;top:' + PT + 'px;width:' + (PANE[1][1] - PANE[1][0]) + 'px;height:' + (PB - PT) + 'px;box-sizing:border-box;border:2px solid color-mix(in srgb, var(--main) 45%, var(--ground));border-radius:12px">' + lab(1, 'MeshAnything · 2,179 edges', '<span style="color:var(--accent)">65 hole edges</span> · <span style="color:var(--main)">10 fins</span>', 'var(--second)') + '</div>' +
      '<p class="cap">Our meshes can be checked edge by edge. DHSP has 9,000 edges, and every one of them is shared by exactly two triangles.</p>' +
      '<p class="cap">MeshAnything’s 1,435 triangles leave 65 edges with only one triangle, small holes, and 10 edges with three or four: fins.</p>' +
      '<p class="cap">On a screen you would never notice them. To a slicer, each one is a place where inside and outside are not defined.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.p = q('.x-holes-p'); this.s = q('.x-holes-s');
    this.A = VW.mesh(kit, 'vw-dh.json'); this.B = VW.mesh(kit, 'vw-ma.json'); this.E = VW.edges(this.B);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 14.8], t);
    this.p.forEach((el, i) => el.style.opacity = eo(seg(t, 0.4 + 0.3 * i, 1.0 + 0.3 * i)));
    this.s[0].style.opacity = eo(seg(t, 2.4, 2.9)); this.s[1].style.opacity = eo(seg(t, 7.8, 8.3));
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 1.0, 1.8)), yaw = 0.9 * Math.sin(PS.TAU * t / 22), hl = eo(seg(t, 8.0, 8.8));
    [this.A, this.B].forEach((S, i) => {
      const o = { c, cx: MX[i], cy: MY, s: MS, yaw, pitch: 0.08 };
      ctx.save(); ctx.beginPath(); ctx.rect(PANE[i][0] + 2, PT + 90, PANE[i][1] - PANE[i][0] - 4, PB - PT - 92); ctx.clip();
      MESH.draw(ctx, S, Object.assign({ tint: c.s, edge: i ? 0.3 : 0.22, lw: 0.6, fill: a }, o));
      if (i && hl > 0) { VW.lines(ctx, S, this.E.bnd, o, c.a, 3.5, hl); VW.lines(ctx, S, this.E.fin, o, c.m, 6, hl); }
      ctx.restore();
    });
  },
});
