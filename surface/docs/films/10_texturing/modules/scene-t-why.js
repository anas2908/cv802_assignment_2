const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('t-why', {
  init(kit) {
    const B = 1.28;
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Photo texturing · The idea</span><h2 class="line">Dots or photos</h2></div>' +
      '<div class="t-why-w" style="position:absolute;left:260px;top:226px;width:' + Math.round(325 * B) + 'px;height:' + Math.round(520 * B) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('tex_fig.jpg') + '" style="position:absolute;left:' + Math.round(-10 * B) + 'px;top:' + Math.round(-76 * B) + 'px;width:' + Math.round(1344 * B) + 'px;height:' + Math.round(616 * B) + 'px"></div>' +
      '<div class="t-why-w" style="position:absolute;left:820px;top:226px;width:500px;height:666px;overflow:hidden;border-radius:12px;background:color-mix(in srgb, var(--ground) 80%, var(--second))"><img src="' + kit.assets.url('photo0.png') + '" style="position:absolute;left:0;top:0;width:500px;height:666px"></div>' +
      '<div class="words t-why-l" style="left:260px;top:904px;width:416px;align-items:center"><p class="note">colour from the dots alone</p></div>' +
      '<div class="words t-why-l" style="left:820px;top:904px;width:500px;align-items:center"><p class="note warm">one of our 125 photos</p></div>' +
      '<div class="words" style="left:1400px;top:300px;width:480px;gap:12px"><p class="eq num t-why-n" style="font-size:40px">138,677 dots</p><p class="note t-why-n" style="color:var(--second)">scattered, with gaps</p>' +
      '<p class="eq num t-why-n" style="font-size:40px;margin-top:24px;color:var(--accent)">125 × 12 MP</p><p class="note t-why-n" style="color:var(--second)">sharp photos, many views</p></div>' +
      '<p class="cap">Where can colour come from? The dots carry 138,677 colours, scattered over the person with gaps between them.</p>' +
      '<p class="cap">The photos carry far more: 125 views of about 12 million pixels each, sharp where the dots are soft.</p>' +
      '<p class="cap">So the plan: give each mesh a texture image, start it from the dots, then repaint it from the photos.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.t-why-w'); this.l = q('.t-why-l'); this.n = q('.t-why-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.0, 12.0], t);
    const WT = [0.6, 6.2]; this.w.forEach((el, i) => { const p = eo(seg(t, WT[i], WT[i] + 0.8)); el.style.opacity = p; el.style.transform = 'scale(' + lerp(0.96, 1, p) * lerp(1, 1.025, eio(seg(t, WT[i], 18))) + ')'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, WT[i] + 0.6, WT[i] + 1.1)));
    const NT = [1.2, 1.6, 6.6, 7.0]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
  },
});