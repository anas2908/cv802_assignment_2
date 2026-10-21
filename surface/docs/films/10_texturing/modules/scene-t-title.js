const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 1.28;
kit.scene('t-title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:1150px;gap:22px">' +
      '<span class="tag">CV802 · Our own step</span>' +
      '<h1 class="line big">Photo texturing</h1>' +
      '<p class="sub t-title-sub">painting every mesh with the 125 photos instead of the dots</p>' +
      '<p class="note warm t-title-n" style="margin-top:26px">on the right: our Poisson mesh, painted this way</p></div>' +
      '<div class="t-title-w" style="position:absolute;left:1400px;top:206px;width:' + Math.round(320 * SC) + 'px;height:' + Math.round(520 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('tex_fig.jpg') + '" style="position:absolute;left:' + Math.round(-347 * SC) + 'px;top:' + Math.round(-76 * SC) + 'px;width:' + Math.round(1344 * SC) + 'px;height:' + Math.round(616 * SC) + 'px"></div>' +
      '<p class="cap">Most of our methods give shape only. The colours you have seen in this series came from our own step: photo texturing.</p>' +
      '<p class="cap">It paints each mesh with the 125 photos instead of the dots. On the right, our Poisson mesh painted this way.</p></div>'));
    this.line = kit.stage.querySelector('.line'); this.sub = kit.stage.querySelector('.t-title-sub').style; this.n = kit.stage.querySelector('.t-title-n').style; this.w = kit.stage.querySelector('.t-title-w').style;
    this.caps = [...kit.stage.querySelectorAll('.cap')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    this.w.opacity = eo(seg(t, -0.4, 0.4)); this.w.transform = 'scale(' + lerp(1, 1.03, eio(seg(t, 0, 8))) + ')';
    PS.caps(this.caps, [0.3, 4.4], t);
  },
});