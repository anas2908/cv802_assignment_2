const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('e-recap', {
  async init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:280px;width:1180px;gap:14px">' +
      '<p class="eq e-recap-e" style="font-size:46px">a 3D prior for the shape,</p>' +
      '<p class="eq e-recap-e" style="font-size:46px;color:var(--accent)">2D image priors for detail and colour</p>' +
      '<p class="box hot e-recap-e" style="margin-top:24px;font-size:28px">On our scan the 3D prior came out crumpled, and the recipe stalled. Rebuilding it before flattening let the whole recipe run: smooth, closed, coloured.</p>' +
      '<p class="note warm e-recap-e" style="margin-top:18px;font-size:30px">next: three extra methods, NKSR, Shape As Points, 2DGS</p></div>' +
      '<p class="cap">DHSP in one line: shape from a 3D self-prior, detail and colour from 2D image priors, all trained on this one scan.</p>' +
      '<p class="cap">That completes the five methods of the assignment. Next on the roadmap: the three extra methods we added.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line'); this.caps = [...kit.stage.querySelectorAll('.cap')]; this.e = [...kit.stage.querySelectorAll('.e-recap-e')];
    this.U = DH.uvmesh(MESH.load(kit, 'dh-final.json'));
    this.cols = null; try { this.cols = DH.texColors(this.U, await kit.assets.image('dh_tex.jpg')); } catch (e) { this.cols = null; }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 3.0, 7.2];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const a = eo(seg(t, 0.3, 1.3));
    DH.unfold(this.k.fx, this.U, { c: this.c, cx: 1580, cy: 566, s: 640, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 14))), pitch: 0.12, sq: [0, 0, 1], colors: this.cols, fill: a, edge: this.cols ? 0.1 : 0.4, lw: 0.6, stroke: this.cols ? PS.mix(this.c.g, this.c.s, 0.4) : null }, 0);
  },
});