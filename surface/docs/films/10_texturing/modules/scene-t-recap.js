const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 1.16;
kit.scene('t-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Photo texturing · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1180px;gap:14px">' +
      '<p class="eq t-recap-e" style="font-size:46px">unfold each mesh into a texture, start from the dots,</p>' +
      '<p class="eq t-recap-e" style="font-size:46px;color:var(--accent)">then repaint it from the best photo that sees each spot</p>' +
      '<p class="box hot t-recap-e" style="margin-top:24px;font-size:28px">4,096² texture per mesh; a photo counts only if the spot is in front, facing it, not hidden and inside the mask; weights favour frontal, close views, raised to the 8th; brightness matched; unseen spots keep the dots</p>' +
      '<p class="note warm t-recap-e" style="margin-top:18px;font-size:30px">next: our mesh viewer, and printing the meshes in 3D</p></div>' +
      '<div class="t-recap-w" style="position:absolute;left:1440px;top:220px;width:' + Math.round(320 * SC) + 'px;height:' + Math.round(520 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('tex_fig.jpg') + '" style="position:absolute;left:' + Math.round(-347 * SC) + 'px;top:' + Math.round(-76 * SC) + 'px;width:' + Math.round(1344 * SC) + 'px;height:' + Math.round(616 * SC) + 'px"></div>' +
      '<p class="cap">Photo texturing in one line: unfold each mesh into a texture, start from the dot colours, then repaint each spot from the best photo that truly sees it.</p>' +
      '<p class="cap">Next on the roadmap: the mesh viewer we built to compare all of this, and getting our meshes ready for a 3D printer.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.t-recap-e'); this.w = q('.t-recap-w')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6], t);
    const ET = [0.6, 1.4, 3.0, 7.0];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const w = eo(seg(t, 0.3, 1.1)); this.w.opacity = w; this.w.transform = 'scale(' + lerp(0.96, 1, w) * lerp(1, 1.03, eio(seg(t, 0, 12))) + ')';
  },
});
