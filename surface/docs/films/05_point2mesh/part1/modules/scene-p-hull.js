const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('p-hull', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · On our scan</span><h2 class="line">The starting skin</h2></div>' +
      '<div class="words" style="left:1240px;top:300px;width:620px;gap:10px">' +
      '<p class="eq num p-hull-n" style="font-size:50px">30,000 dots</p><p class="note p-hull-n">each with its arrow from Video 1</p>' +
      '<p class="eq num p-hull-n" style="font-size:50px;margin-top:30px;color:var(--accent)">2,000 triangles</p><p class="note warm p-hull-n">the convex hull, rebuilt by Manifold</p>' +
      '<p class="note p-hull-n" style="margin-top:30px;color:var(--second)">closed: no holes, from start to finish</p></div>' +
      '<p class="cap">Our scan: 30,000 dots picked evenly from the cloud, each with its arrow from Video 1. Every fifth one is drawn here.</p>' +
      '<p class="cap">Around them, the convex hull: the tightest shape with no dents that still contains every dot.</p>' +
      '<p class="cap">A tool called Manifold rebuilds it as a clean closed mesh of 2,000 triangles. This is the skin we start from.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.p-hull-n');
    this.D = MESH.dots(MESH.load(kit, 'p2m-dots.json'));
    this.H = MESH.at(MESH.stage(MESH.load(kit, 'p2m-s0.json')), 0);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.8, 11.2], t);
    const NT = [1.0, 1.6, 6.0, 6.6, 12.0];
    this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const ctx = this.k.fx, c = this.c, o = { c, cx: 780, cy: 566, s: 720, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 18))), pitch: 0.12 };
    const d = seg(t, 0.4, 2.4);
    MESH.pts(ctx, this.D, o, 1.3, c.s, i => d * 1.7 - (i % 97) / 97 * 0.7, 0.03, 15, c.m);
    const h = eo(seg(t, 5.8, 7.6));
    if (h > 0) MESH.draw(ctx, this.H, Object.assign({}, o, { tint: c.a, fill: 0.42 * h, edge: 0.9, lw: 1.1 }));
  },
});