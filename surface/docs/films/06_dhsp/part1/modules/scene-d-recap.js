const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('d-recap', {
  async init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · Recap</span><h2 class="line">Part 1 in one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1150px;gap:14px">' +
      '<p class="eq d-recap-e" style="font-size:46px">Point2Mesh: one 3D self-prior</p>' +
      '<p class="eq d-recap-e" style="font-size:46px;color:var(--accent)">DHSP: a 3D self-prior plus two 2D image priors</p>' +
      '<p class="box hot d-recap-e" style="margin-top:24px;font-size:28px">shape from the 3D prior; the mesh flattened into a UV square; a picture of the shape and a picture of the colours, both completed by image priors</p>' +
      '<p class="note warm d-recap-e" style="margin-top:18px;font-size:30px">Part 2: our scan, the crumpled prior, and our fix</p></div>' +
      '<p class="cap">DHSP in one line: shape from a 3D self-prior, detail and colour from 2D image priors, all trained on one scan.</p>' +
      '<p class="cap">Part 2: what happened on our scan, why the full recipe would not run at first, and how we fixed it.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line'); this.caps = [...kit.stage.querySelectorAll('.cap')]; this.e = [...kit.stage.querySelectorAll('.d-recap-e')];
    this.U = DH.uvmesh(MESH.load(kit, 'dh-final.json'));
    this.cols = null; try { this.cols = DH.texColors(this.U, await kit.assets.image('dh_tex.jpg')); } catch (e) { this.cols = null; }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4], t);
    const ET = [0.6, 1.4, 3.0, 6.6];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const a = eo(seg(t, 0.3, 1.3));
    DH.unfold(this.k.fx, this.U, { c: this.c, cx: 1560, cy: 566, s: 640, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 12))), pitch: 0.12, sq: [0, 0, 1], colors: this.cols, fill: a, edge: this.cols ? 0.1 : 0.4, lw: 0.6, stroke: this.cols ? PS.mix(this.c.g, this.c.s, 0.4) : null }, 0);
  },
});