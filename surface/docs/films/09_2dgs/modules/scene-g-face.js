const { seg, eo, eio, lerp, TextFx } = kit;
const W = [['gs_shaded.png', 340, 55, 125, 145, 2.5, 180, 250], ['gs_col.png', 340, 55, 125, 145, 2.5, 540, 250], ['gs_shaded.png', 295, 235, 170, 115, 2.3, 980, 300]];
kit.scene('g-face', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">2DGS · Strengths and traps</span><h2 class="line">It sees the face</h2></div>';
    W.forEach(([n, sx, sy, w, ht, k, x, y]) => { h += '<div class="g-face-w" style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + Math.round(w * k) + 'px;height:' + Math.round(ht * k) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url(n) + '" style="position:absolute;left:' + Math.round(-sx * k) + 'px;top:' + Math.round(-sy * k) + 'px;width:' + Math.round(768 * k) + 'px;height:' + Math.round(1024 * k) + 'px"></div>'; });
    h += '<div class="words g-face-l" style="left:180px;top:640px;width:672px;align-items:center"><p class="note warm">the most recognisable face of all our methods</p></div>' +
      '<div class="words g-face-l" style="left:980px;top:582px;width:391px;align-items:center;gap:4px"><p class="note">the shirt’s letters,</p><p class="note">raised into the shape</p></div>' +
      '<div class="words" style="left:180px;top:730px;width:1600px;gap:8px"><p class="eq g-face-e" style="font-size:42px">photos give it detail the dots never had,</p><p class="eq g-face-e" style="font-size:42px;color:var(--accent)">and sometimes mistake a colour edge for a shape edge</p></div>' +
      '<p class="cap">Because it learns from the photos, 2DGS gives the most recognisable face of all our methods: nose, eyes, the line of the jaw.</p>' +
      '<p class="cap">But photos can also fool it: the letters printed on the shirt come out as real bumps, because a colour edge looked like a shape edge.</p>' +
      '<p class="cap">It never sees the dots in its loss, so against them its gap is larger than the dot-based methods’. The eye and the score disagree.</p></div>';
    kit.stage.append(kit.h(h));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.g-face-w'); this.l = q('.g-face-l'); this.e = q('.g-face-e');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.6, 15.0], t);
    const WT = [0.6, 1.4, 7.8]; this.w.forEach((el, i) => { const p = eo(seg(t, WT[i], WT[i] + 0.8)); el.style.opacity = p; el.style.transform = 'scale(' + lerp(0.95, 1, p) * lerp(1, 1.03, eio(seg(t, WT[i], 24))) + ')'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, i ? 8.4 : 2.0, (i ? 8.4 : 2.0) + 0.5)));
    this.e.forEach((el, i) => { const p = eo(seg(t, i ? 10.2 : 3.4, (i ? 10.2 : 3.4) + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
  },
});