const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('w-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:1150px;gap:22px">' +
      '<span class="tag">CV802 · Our own tool</span>' +
      '<h1 class="line big">The mesh viewer</h1>' +
      '<p class="sub w-title-sub">every result of every method, in your browser, side by side</p>' +
      '<p class="note warm w-title-n" style="margin-top:26px">on the right: our DHSP mesh, 6,000 triangles, live</p></div>' +
      '<p class="cap">Eight methods, three inputs, dozens of runs. To look at all of them fairly, we built our own viewer.</p>' +
      '<p class="cap">It runs in any web browser. This film shows how it works, and how to read what it shows you.</p></div>'));
    this.k = kit; this.c = PS.col(kit); this.S = VW.mesh(kit, 'vw-dh.json');
    this.line = kit.stage.querySelector('.line'); this.sub = kit.stage.querySelector('.w-title-sub').style; this.n = kit.stage.querySelector('.w-title-n').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    PS.caps(this.caps, [0.3, 4.4], t);
    MESH.draw(this.k.fx, this.S, { c: this.c, cx: 1560, cy: 560, s: 700, yaw: lerp(-0.7, 0.7, eio(seg(t, -0.5, 8.5))), pitch: 0.08, colors: this.S.C, edge: 0, fill: eo(seg(t, -0.6, 0.4)) });
  },
});
