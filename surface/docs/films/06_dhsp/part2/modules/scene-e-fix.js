const { seg, eo, eio, eob, lerp, TextFx } = kit;
kit.scene('e-fix', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · Our contribution</span><h2 class="line">Our fix: rebuild first</h2></div>' +
      '<div class="words e-fix-l" style="left:180px;top:880px;width:500px;align-items:center"><p class="note">3D prior: 16,000 triangles, 42% fold</p></div>' +
      '<div class="words e-fix-r" style="left:1250px;top:880px;width:500px;align-items:center"><p class="note warm">after our fix: 6,000, under 2% fold</p></div>' +
      '<p class="box hot e-fix-b" style="left:745px;top:400px;width:430px;text-align:center">Manifold rebuild + simplify: 3,000 triangles, then 6,000</p>' +
      '<div class="words e-fix-o" style="left:745px;top:640px;width:430px;align-items:center;gap:4px"><p class="note" style="color:var(--second)">OptCuts: 15 h unfinished</p><p class="note warm">→ done in seconds</p></div>' +
      '<p class="cap">Our fix: before flattening, rebuild the crumpled skin as a clean closed surface with Manifold, then simplify it.</p>' +
      '<p class="cap">3,000 triangles for the shape picture, 6,000 for the final mesh. Folded neighbours drop from 42% to under 2%.</p>' +
      '<p class="cap">Now OptCuts finishes in seconds and the whole recipe runs from start to end: shape, shape picture, polish, colours.</p>' +
      '<p class="cap">The price: a coarser mesh, 6,000 triangles instead of 16,000, so it sits a little further from the dots.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.e-fix-l')[0].style; this.r = q('.e-fix-r')[0].style; this.b = q('.e-fix-b')[0].style; this.o = q('.e-fix-o')[0].style;
    this.S = MESH.at(MESH.stage(MESH.load(kit, 'dh-prior.json')), 0); const g = PS.hex(this.c.a); this.cols = Array.from(FOLD(this.S).flags, x => x ? g : null);
    this.U = DH.uvmesh(MESH.load(kit, 'dh-final.json'));
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.4, 19.6], t);
    this.l.opacity = eo(seg(t, 1.0, 1.5)); this.r.opacity = eo(seg(t, 8.6, 9.1)); this.o.opacity = eo(seg(t, 13.6, 14.1));
    const pb = seg(t, 5.6, 6.2); this.b.opacity = eo(pb); this.b.transform = 'scale(' + lerp(0.9, 1, eob(pb, 1.6)) + ')';
    const ctx = this.k.fx, c = this.c, yaw = lerp(-0.45, 0.45, eio(seg(t, 0, 26)));
    const a = eo(seg(t, 0.3, 1.3));
    MESH.draw(ctx, this.S, { c, cx: 430, cy: 560, s: 600, yaw, pitch: 0.12, edge: 0.3 * a, fill: a, lw: 0.5, colors: this.cols });
    const ar = eo(seg(t, 6.4, 7.6)); if (ar > 0) { ctx.globalAlpha = ar; PS.arrow(ctx, 700, 580, lerp(700, 1220, ar), 580, c.a, 4, 16); ctx.globalAlpha = 1; }
    const fb = eo(seg(t, 7.6, 8.8)); if (fb > 0) DH.unfold(ctx, this.U, { c, cx: 1500, cy: 560, s: 600, yaw, pitch: 0.12, sq: [0, 0, 1], fill: fb, edge: 0.4, lw: 0.6 }, 0);
  },
});