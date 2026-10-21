const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('n-colour', {
  init(kit) {
    const A = 0.7, B = 1.18;
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">NKSR · Colour</span><h2 class="line">Its own colour</h2></div>' +
      '<div class="n-colour-w" style="position:absolute;left:330px;top:226px;width:' + Math.round(300 * A) + 'px;height:' + Math.round(950 * A) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('nk_col.png') + '" style="position:absolute;left:' + Math.round(-240 * A) + 'px;top:' + Math.round(-50 * A) + 'px;width:' + Math.round(768 * A) + 'px;height:' + Math.round(1024 * A) + 'px"></div>' +
      '<div class="n-colour-w" style="position:absolute;left:700px;top:226px;width:' + Math.round(205 * B) + 'px;height:' + Math.round(560 * B) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('extra.jpg') + '" style="position:absolute;left:' + Math.round(-315 * B) + 'px;top:' + Math.round(-75 * B) + 'px;width:' + Math.round(1502 * B) + 'px;height:' + Math.round(656 * B) + 'px"></div>' +
      '<div class="words n-colour-l" style="left:285px;top:902px;width:300px;align-items:center"><p class="note warm">NKSR: 19.5 dB</p></div>' +
      '<div class="words n-colour-l" style="left:671px;top:902px;width:300px;align-items:center"><p class="note">our photos: 18.6 dB</p></div>' +
      '<div class="words" style="left:1110px;top:330px;width:760px;gap:12px">' +
      '<p class="note n-colour-n" style="color:var(--second)">NKSR: each corner takes the colour</p><p class="note n-colour-n" style="color:var(--second)">of its nearest dot</p>' +
      '<p class="note n-colour-n" style="margin-top:24px">PSNR against the dot colours</p>' +
      '<p class="note warm n-colour-n" style="margin-top:24px">photos: sharper face, flag, letters</p></div>' +
      '<p class="cap">NKSR also gives its mesh colour: each corner simply takes the colour of its nearest dot.</p>' +
      '<p class="cap">Against the dot colours that scores 19.5 dB, above our photo texture’s 18.6, because it is made from those very dots.</p>' +
      '<p class="cap">But the photos are sharper: the face, the flag and the letters. As with DHSP, the score rewards copying the dots.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.n-colour-w'); this.l = q('.n-colour-l'); this.n = q('.n-colour-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.8, 11.0], t);
    const WT = [0.6, 6.0]; this.w.forEach((el, i) => { const p = eo(seg(t, WT[i], WT[i] + 0.8)); el.style.opacity = p; el.style.transform = 'scale(' + lerp(0.96, 1, p) * lerp(1, 1.025, eio(seg(t, WT[i], 16))) + ')'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, WT[i] + 0.6, WT[i] + 1.1)));
    const NT = [1.2, 1.5, 6.4, 11.2]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
  },
});