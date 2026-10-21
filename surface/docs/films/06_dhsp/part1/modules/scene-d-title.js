const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('d-title', {
  async init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:240px;width:1020px;gap:22px">' +
      '<span class="tag">CV802 · Surface methods · Part 1</span>' +
      '<h1 class="line big">DHSP</h1>' +
      '<p class="sub d-title-sub">Deep Hybrid Self-Prior: a 3D prior for the shape, 2D image priors for detail and colour</p>' +
      '<p class="note warm d-title-n" style="margin-top:26px">on the right: our real DHSP mesh in its own colours</p></div>' +
      '<p class="cap">The methods so far made shape only; we added the colour ourselves. DHSP makes shape and colour, learning from this one scan.</p>' +
      '<p class="cap">Its trick: mix a 3D self-prior for the shape with 2D image priors for the fine detail and the colours.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.sub = kit.stage.querySelector('.d-title-sub').style; this.n = kit.stage.querySelector('.d-title-n').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.U = DH.uvmesh(MESH.load(kit, 'dh-final.json'));
    this.cols = null; try { this.cols = DH.texColors(this.U, await kit.assets.image('dh_tex.jpg')); } catch (e) { this.cols = null; }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    PS.caps(this.caps, [0.3, 4.4], t);
    const s = 800 * (1 + 0.012 * Math.sin(t * 2.0));
    DH.unfold(this.k.fx, this.U, { c: this.c, cx: 1460, cy: 512, s, yaw: lerp(-0.7, 0.5, eio(seg(t, 0, 8))), pitch: 0.12, sq: [0, 0, 1], colors: this.cols, edge: this.cols ? 0.12 : 0.4, lw: 0.6, stroke: this.cols ? PS.mix(this.c.g, this.c.s, 0.4) : null }, 0);
  },
});