const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 1.1;
kit.scene('e-colour', {
  init(kit) {
    const win = (left, sx, w, cls) => '<div class="' + cls + '" style="position:absolute;left:' + left + 'px;top:240px;width:' + Math.round(w * SC) + 'px;height:' + Math.round(600 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('dh_fig.jpg') + '" style="position:absolute;left:' + Math.round(-sx * SC) + 'px;top:' + Math.round(-75 * SC) + 'px;width:' + Math.round(1051 * SC) + 'px;height:' + Math.round(696 * SC) + 'px"></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · Colour</span><h2 class="line">Its own colour</h2></div>' +
      '<div class="e-colour-t" style="position:absolute;left:110px;top:300px;width:360px;height:360px;overflow:hidden;border-radius:10px"><img src="' + kit.assets.url('dh_tex.jpg') + '" style="width:360px;height:360px"></div>' +
      '<div class="words e-colour-tl" style="left:110px;top:676px;width:360px;align-items:center"><p class="note">its texture, 1,024 × 1,024</p></div>' +
      win(520, 537, 262, 'e-colour-w') + win(860, 810, 232, 'e-colour-w') +
      '<div class="words e-colour-l" style="left:520px;top:910px;width:288px;align-items:center"><p class="note warm">DHSP</p></div>' +
      '<div class="words e-colour-l" style="left:860px;top:910px;width:255px;align-items:center"><p class="note">our photos</p></div>' +
      '<div class="words" style="left:1190px;top:300px;width:700px;gap:10px">' +
      '<p class="eq num e-colour-n" style="font-size:40px;color:var(--accent)">DHSP: 18.5 dB</p><p class="eq num e-colour-n" style="font-size:40px">photos: 17.7 dB</p>' +
      '<p class="note e-colour-n" style="color:var(--second)">PSNR against the dot colours</p>' +
      '<p class="note warm e-colour-n" style="margin-top:30px">yet the photos are sharper:</p><p class="note warm e-colour-n">the face, the flag, the letters</p></div>' +
      '<p class="cap">DHSP is the only method here that makes its own colour. On the left its texture; in the middle, that texture on the mesh.</p>' +
      '<p class="cap">Beside it, our photo texture on the same mesh. Against the dot colours, DHSP scores higher: 18.5 dB versus 17.7.</p>' +
      '<p class="cap">But the photos are sharper: the face, the flag, the letters. PSNR rewards matching the dots, and DHSP was fitted to exactly those.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.t = q('.e-colour-t')[0].style; this.tl = q('.e-colour-tl')[0].style; this.w = q('.e-colour-w'); this.l = q('.e-colour-l'); this.n = q('.e-colour-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.6, 14.2], t);
    const pt = eo(seg(t, 0.8, 1.6)); this.t.opacity = pt; this.t.transform = 'scale(' + lerp(0.96, 1, pt) * lerp(1, 1.03, eio(seg(t, 0.8, 22))) + ')'; this.tl.opacity = eo(seg(t, 1.4, 1.9));
    const WT = [3.0, 8.0]; this.w.forEach((el, i) => { const p = eo(seg(t, WT[i], WT[i] + 0.8)); el.style.opacity = p; el.style.transform = 'scale(' + lerp(0.96, 1, p) * lerp(1, 1.02, eio(seg(t, WT[i], 22))) + ')'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, WT[i] + 0.6, WT[i] + 1.1)));
    const NT = [9.0, 9.6, 10.2, 14.6, 15.0]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
  },
});