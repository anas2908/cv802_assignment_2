const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 0.66;
kit.scene('s-grow', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">SAP · Our real run</span><h2 class="line">Sphere to body</h2></div>' +
      '<div class="words s-grow-panel" style="left:1180px;top:270px;width:340px;gap:6px">' +
      '<p class="note">grid</p><p class="eq num s-grow-v" style="font-size:56px">32³</p>' +
      '<p class="note" style="margin-top:12px">step</p><p class="eq num s-grow-v" style="font-size:56px">0</p>' +
      '<p class="note" style="margin-top:12px">triangles</p><p class="eq num s-grow-v" style="font-size:56px;color:var(--accent)">1,544</p></div>' +
      '<div class="s-grow-w" style="position:absolute;left:1560px;top:226px;width:' + Math.round(320 * SC) + 'px;height:' + Math.round(950 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('sap_vgg.png') + '" style="position:absolute;left:' + Math.round(-225 * SC) + 'px;top:' + Math.round(-50 * SC) + 'px;width:' + Math.round(768 * SC) + 'px;height:' + Math.round(1024 * SC) + 'px"></div>' +
      '<div class="words s-grow-wl" style="left:1510px;top:868px;width:310px;align-items:center"><p class="note warm">grid 256: the final mesh</p></div>' +
      '<p class="cap">Our real run. It starts from 100,000 points on a small sphere, and the surface Poisson makes from them.</p>' +
      '<p class="cap">On a coarse grid of 32 steps, 1,000 nudges turn the sphere into a rough body.</p>' +
      '<p class="cap">Then finer grids, each starting from the last mesh: 64 steps, then 128…</p>' +
      '<p class="cap">…and finally 256, for 200 more steps: 64,168 triangles, closed, in about 8 minutes on our GPU.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.panel = q('.s-grow-panel')[0].style; this.v = q('.s-grow-v'); this.w = q('.s-grow-w')[0].style; this.wl = q('.s-grow-wl')[0].style;
    this.P0 = MESH.dots(MESH.load(kit, 'sap-pts0.json'));
    const s32 = MESH.load(kit, 'sap-s32.json');
    this.F = [['0000', 2.0], ['0100', 4.2], ['0200', 5.6], ['0300', 7.0], ['0500', 8.6], ['1000', 10.4]].map(([k, t0]) => ({ S: MESH.at(MESH.stage(s32[k]), 0), t0, grid: 32, step: +k }));
    this.F.push({ S: MESH.at(MESH.stage(MESH.load(kit, 'sap-s64.json')), 0), t0: 13.2, grid: 64, step: 1000 });
    this.F.push({ S: MESH.at(MESH.stage(MESH.load(kit, 'sap-s128.json')), 0), t0: 16.6, grid: 128, step: 1000 });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.0, 12.6, 20.4], t);
    const pp = eo(seg(t, 1.0, 1.5)); this.panel.opacity = pp; this.panel.transform = 'translateX(' + (1 - pp) * 26 + 'px)';
    const w = eo(seg(t, 20.8, 21.8)); this.w.opacity = w; this.w.transform = 'scale(' + lerp(0.96, 1, w) * lerp(1, 1.025, eio(seg(t, 20.8, 32))) + ')'; this.wl.opacity = eo(seg(t, 21.4, 21.9));
    let i = 0; for (let j = 0; j < this.F.length; j++) if (t >= this.F[j].t0 - 0.5) i = j;
    const fr = this.F[i], fin = t >= 20.8;
    this.v[0].textContent = (fin ? 256 : fr.grid) + '³'; this.v[1].textContent = fin ? '200' : fr.step.toLocaleString('en-US'); this.v[2].textContent = (fin ? 64168 : fr.S.nf).toLocaleString('en-US');
    const ctx = this.k.fx, c = this.c, o = { c, cx: 680, cy: 566, s: 700, yaw: lerp(-0.6, 0.5, eio(seg(t, 0, 32))), pitch: 0.12, lw: 0.6 };
    const pa = eo(seg(t, 0.3, 1.2)) * (1 - eo(seg(t, 2.0, 3.0)));
    if (pa > 0) MESH.pts(ctx, this.P0, o, 1.3, c.s, pa, 0.04, 8, c.a);
    const sw = eo(seg(t, fr.t0 - 0.5, fr.t0 + 0.1)), a0 = eo(seg(t, 2.0, 3.0));
    if (i > 0 && sw < 1) MESH.draw(ctx, this.F[i - 1].S, Object.assign({}, o, { fill: 0.95 * (1 - sw), edge: 0.35 * (1 - sw) }));
    MESH.draw(ctx, fr.S, Object.assign({}, o, { fill: 0.95 * sw * a0, edge: 0.35 * sw * a0 }));
  },
});