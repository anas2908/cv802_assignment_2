const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('g-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:240px;width:1150px;gap:22px">' +
      '<span class="tag">CV802 · Extra method 3</span>' +
      '<h1 class="line big">2D Gaussian Splatting</h1>' +
      '<p class="sub g-title-sub">a shape made of small flat coloured disks, learned from our photos</p>' +
      '<p class="note warm g-title-n" style="margin-top:26px">on the right: our real disks (every tenth, drawn larger)</p></div>' +
      '<p class="cap">Every method so far learned from the dots. 2D Gaussian Splatting learns from the photos themselves.</p>' +
      '<p class="cap">On the right are its real building blocks on our scan: small, flat, coloured disks.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line'); this.sub = kit.stage.querySelector('.g-title-sub').style; this.n = kit.stage.querySelector('.g-title-n').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.G = GS.decode([MESH.load(kit, 'gs-s1.json'), MESH.load(kit, 'gs-s2.json')]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    PS.caps(this.caps, [0.3, 4.4], t);
    GS.draw(this.k.fx, this.G, { cx: 1500, cy: 510, s: 800, yaw: lerp(-0.6, 0.45, eio(seg(t, 0, 8))), pitch: 0.12, grow: 2.2 });
  },
});