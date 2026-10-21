const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('s-idea', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">SAP · The idea</span><h2 class="line">The shape is the points</h2></div>' +
      '<div class="words" style="left:1200px;top:300px;width:680px;gap:12px">' +
      '<p class="note s-idea-n" style="color:var(--second)">the shape = 100,000 points,</p><p class="note s-idea-n" style="color:var(--second)">each with an arrow</p>' +
      '<p class="note s-idea-n" style="margin-top:26px">surface: Poisson on the points,</p><p class="note s-idea-n">then marching cubes</p>' +
      '<p class="note warm s-idea-n" style="margin-top:26px">every step is smooth maths,</p><p class="note warm s-idea-n">so each point can learn where to go</p></div>' +
      '<p class="cap">In SAP the shape is stored as 100,000 points, each with an arrow. These are its final points on our scan, every twentieth one.</p>' +
      '<p class="cap">To turn them into a surface it runs Poisson, just like Video 1, and draws the zero surface with marching cubes.</p>' +
      '<p class="cap">The twist: every step is smooth maths, so SAP can work out how each point and arrow should move to fit the scan better.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.s-idea-n');
    this.D = MESH.dots(MESH.load(kit, 'sap-ptsF.json')); this.S = MESH.at(MESH.stage(MESH.load(kit, 'sap-s128.json')), 0);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 14.4], t);
    const NT = [0.8, 1.2, 7.6, 8.0, 14.6, 15.0];
    this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c, o = { c, cx: 720, cy: 566, s: 700, yaw: lerp(-0.5, 0.5, eio(seg(t, 0, 22))), pitch: 0.12 };
    const m = eo(seg(t, 8.6, 10.6)) * (1 - 0.7 * eo(seg(t, 15.0, 16.6)));
    if (m > 0) MESH.draw(ctx, this.S, Object.assign({}, o, { fill: m * 0.95, edge: 0.25 * m, lw: 0.5 }));
    const d = eo(seg(t, 0.3, 1.8)) * (1 - 0.75 * m);
    if (d > 0) MESH.pts(ctx, this.D, o, 1.4, c.s, i => d * 1.5 - (i % 89) / 89 * 0.5, 0.035, 9, c.a);
  },
});