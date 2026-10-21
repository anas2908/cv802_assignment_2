const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 0.8;
kit.scene('n-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:1100px;gap:22px">' +
      '<span class="tag">CV802 · Extra method 1</span>' +
      '<h1 class="line big">NKSR</h1>' +
      '<p class="sub n-title-sub">Neural Kernel Surface Reconstruction: Poisson’s idea, with building blocks a network has learned</p>' +
      '<p class="note warm n-title-n" style="margin-top:26px">on the right: our real NKSR mesh in its own colours</p></div>' +
      '<div class="n-title-w" style="position:absolute;left:1420px;top:168px;width:' + Math.round(300 * SC) + 'px;height:' + Math.round(940 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('nk_col.png') + '" style="position:absolute;left:' + Math.round(-240 * SC) + 'px;top:' + Math.round(-55 * SC) + 'px;width:' + Math.round(768 * SC) + 'px;height:' + Math.round(1024 * SC) + 'px"></div>' +
      '<p class="cap">From NVIDIA, 2023: Neural Kernel Surface Reconstruction, a pretrained network built for large, noisy real scans.</p>' +
      '<p class="cap">It is our fastest method: a full mesh of our scan in about 7 seconds. On the right, its result in its own colours.</p></div>'));
    this.line = kit.stage.querySelector('.line'); this.sub = kit.stage.querySelector('.n-title-sub').style; this.n = kit.stage.querySelector('.n-title-n').style; this.w = kit.stage.querySelector('.n-title-w').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    this.w.opacity = eo(seg(t, -0.4, 0.4)); this.w.transform = 'scale(' + lerp(1, 1.03, eio(seg(t, 0, 8))) + ')';
    PS.caps(this.caps, [0.3, 4.4], t);
  },
});