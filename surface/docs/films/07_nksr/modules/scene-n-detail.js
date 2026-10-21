const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 0.7;
kit.scene('n-detail', {
  init(kit) {
    const win = (left, name, cls) => '<div class="' + cls + '" style="position:absolute;left:' + left + 'px;top:226px;width:' + Math.round(300 * SC) + 'px;height:' + Math.round(950 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url(name) + '" style="position:absolute;left:' + Math.round(-240 * SC) + 'px;top:' + Math.round(-50 * SC) + 'px;width:' + Math.round(768 * SC) + 'px;height:' + Math.round(1024 * SC) + 'px"></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">NKSR · Our scan</span><h2 class="line">Detail level</h2></div>' +
      win(330, 'nk_d1.png', 'n-detail-w') + win(760, 'nk_d05.png', 'n-detail-w') +
      '<div class="words n-detail-l" style="left:285px;top:' + (226 + Math.round(950 * SC) + 10) + 'px;width:300px;align-items:center"><p class="note">full detail · NC 0.75</p></div>' +
      '<div class="words n-detail-l" style="left:715px;top:' + (226 + Math.round(950 * SC) + 10) + 'px;width:300px;align-items:center"><p class="note warm">half detail · NC 0.84</p></div>' +
      '<div class="words" style="left:1180px;top:320px;width:700px;gap:12px">' +
      '<p class="note n-detail-n" style="color:var(--second)">full detail: follows every dot,</p><p class="note n-detail-n" style="color:var(--second)">so scan noise becomes bumps</p>' +
      '<p class="note warm n-detail-n" style="margin-top:24px">half detail: each bump covers</p><p class="note warm n-detail-n">more dots and averages the noise</p>' +
      '<p class="eq n-detail-n" style="font-size:40px;margin-top:30px">closer, or smoother</p></div>' +
      '<p class="cap">Full detail follows every dot, so the scan’s noise becomes bumps all over the surface: normal consistency 0.75.</p>' +
      '<p class="cap">At half detail each bump covers more dots, which averages the noise away: smoother, normal consistency 0.84.</p>' +
      '<p class="cap">A clear trade-off: closer to the dots, or smoother. The scores favour full detail; the eye may prefer half.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.n-detail-w'); this.l = q('.n-detail-l'); this.n = q('.n-detail-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.4], t);
    const WT = [0.6, 7.0]; this.w.forEach((el, i) => { const p = eo(seg(t, WT[i], WT[i] + 0.8)); el.style.opacity = p; el.style.transform = 'scale(' + lerp(0.96, 1, p) * lerp(1, 1.025, eio(seg(t, WT[i], 20))) + ')'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, WT[i] + 0.6, WT[i] + 1.1)));
    const NT = [1.4, 1.8, 7.4, 7.8, 13.6]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
  },
});