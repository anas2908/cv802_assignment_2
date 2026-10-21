const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('a-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:980px;gap:22px">' +
      '<span class="tag">CV802 · Surface methods · Part 1</span>' +
      '<h1 class="line big">MeshAnything</h1>' +
      '<p class="sub a-title-sub">a mesh, written like a sentence</p>' +
      '<p class="note warm a-title-n" style="margin-top:26px">on the right: our real result, 1,435 triangles</p></div>' +
      '<p class="cap">Poisson solved for a surface. IER chose triangles between our dots. MeshAnything does something new: it writes the mesh.</p>' +
      '<p class="cap">Piece by piece, the way a language model writes a sentence. This film shows how.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.sub = kit.stage.querySelector('.a-title-sub').style; this.n = kit.stage.querySelector('.a-title-n').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    PS.caps(this.caps, [0.3, 4.4], t);
    const ctx = this.k.fx, c = this.c;
    const yaw = lerp(-0.75, 0.55, eio(seg(t, 0, 8))), s = 780 * (1 + 0.012 * Math.sin(t * 2.0));
    MA.draw(ctx, 'v2', { c, cx: 1390, cy: 500, s, yaw, pitch: 0.12, edge: 0.55, lw: 1.1 });
  },
});