const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('p-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:1000px;gap:22px">' +
      '<span class="tag">CV802 · Surface methods · Part 1</span>' +
      '<h1 class="line big">Point2Mesh</h1>' +
      '<p class="sub p-title-sub">shrink-wrapping the dots, guided by a network that learns from this scan alone</p>' +
      '<p class="note warm p-title-n" style="margin-top:26px">on the right: our real result, 10,000 triangles</p></div>' +
      '<p class="cap">Poisson solved, IER chose, MeshAnything wrote. Point2Mesh does it another way: it shrink-wraps the dots.</p>' +
      '<p class="cap">And the network that guides it has never seen any other shape. It learns from this one scan alone.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.sub = kit.stage.querySelector('.p-title-sub').style; this.n = kit.stage.querySelector('.p-title-n').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.S = MESH.at(MESH.stage(MESH.load(kit, 'p2m-s4.json')), 1);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    PS.caps(this.caps, [0.3, 4.4], t);
    const s = 800 * (1 + 0.012 * Math.sin(t * 2.0));
    MESH.draw(this.k.fx, this.S, { c: this.c, cx: 1440, cy: 510, s, yaw: lerp(-0.7, 0.5, eio(seg(t, 0, 8))), pitch: 0.12, edge: 0.32, lw: 0.6 });
  },
});