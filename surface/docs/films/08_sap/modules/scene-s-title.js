const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 0.8;
kit.scene('s-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:1150px;gap:22px">' +
      '<span class="tag">CV802 · Extra method 2</span>' +
      '<h1 class="line big">Shape As Points</h1>' +
      '<p class="sub s-title-sub">a Poisson solver so smooth that the points themselves can learn</p>' +
      '<p class="note warm s-title-n" style="margin-top:26px">on the right: our real SAP mesh, 64,168 triangles, closed</p></div>' +
      '<div class="s-title-w" style="position:absolute;left:1440px;top:168px;width:' + Math.round(320 * SC) + 'px;height:' + Math.round(950 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('sap_vgg.png') + '" style="position:absolute;left:' + Math.round(-225 * SC) + 'px;top:' + Math.round(-50 * SC) + 'px;width:' + Math.round(768 * SC) + 'px;height:' + Math.round(1024 * SC) + 'px"></div>' +
      '<p class="cap">Shape As Points, from 2021, asks a new question: what if the shape itself is just a set of points with arrows?</p>' +
      '<p class="cap">A fast, smooth Poisson solve turns those points into a closed surface, and the points can learn. On the right, our result.</p></div>'));
    this.line = kit.stage.querySelector('.line'); this.sub = kit.stage.querySelector('.s-title-sub').style; this.n = kit.stage.querySelector('.s-title-n').style; this.w = kit.stage.querySelector('.s-title-w').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    this.w.opacity = eo(seg(t, -0.4, 0.4)); this.w.transform = 'scale(' + lerp(1, 1.03, eio(seg(t, 0, 8))) + ')';
    PS.caps(this.caps, [0.3, 4.4], t);
  },
});