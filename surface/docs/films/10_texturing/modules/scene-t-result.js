const { seg, eo, eio, lerp, TextFx } = kit;
const B = 1.15, PL = [130, 519], PT = 228, ZS = 2.4, ZX = 960, ZT = [262, 572];
kit.scene('t-result', {
  init(kit) {
    const url = kit.assets.url('tex_fig.jpg'), W = Math.round(1344 * B), H = Math.round(616 * B);
    const panel = (x, ox) => '<div class="t-res-p" style="position:absolute;left:' + x + 'px;top:' + PT + 'px;width:' + Math.round(321 * B) + 'px;height:' + Math.round(520 * B) + 'px;overflow:hidden;border-radius:12px"><img src="' + url + '" style="position:absolute;left:' + Math.round(-ox * B) + 'px;top:' + Math.round(-76 * B) + 'px;width:' + W + 'px;height:' + H + 'px"></div>';
    const zoom = (y, ox, v) => '<div class="t-res-z" style="position:absolute;left:' + ZX + 'px;top:' + y + 'px;width:432px;height:240px;overflow:hidden;border-radius:10px;box-sizing:border-box;border:3px solid var(--' + v + ')"><img src="' + url + '" style="position:absolute;left:' + Math.round(-ox * ZS) + 'px;top:' + Math.round(-230 * ZS) + 'px;width:' + Math.round(1344 * ZS) + 'px;height:' + Math.round(616 * ZS) + 'px"></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Photo texturing · Our result</span><h2 class="line">Before and after</h2></div>' +
      panel(PL[0], 682) + panel(PL[1], 1013) +
      '<div class="words t-res-l" style="left:' + PL[0] + 'px;top:842px;width:369px;align-items:center"><p class="note">from the dots</p></div>' +
      '<div class="words t-res-l" style="left:' + PL[1] + 'px;top:842px;width:369px;align-items:center"><p class="note warm">from the photos</p></div>' +
      zoom(ZT[0], 700, 'main') + zoom(ZT[1], 1031, 'accent') +
      '<p class="note t-res-zn" style="left:1420px;top:366px">speckled, soft print</p>' +
      '<p class="note warm t-res-zn" style="left:1420px;top:676px">crisp FIFA WORLD CUP</p>' +
      '<div class="words" style="left:960px;top:262px;width:880px;gap:12px">' +
      '<p class="eq num t-res-n" style="font-size:40px">81% of the texture seen</p>' +
      '<p class="note t-res-n" style="color:var(--second)">the other 19% keeps its dot colour</p>' +
      '<p class="eq num t-res-n" style="font-size:40px;margin-top:22px">125 photos · 4,096² · 76 s</p>' +
      '<p class="note t-res-n" style="color:var(--second)">about a minute per mesh</p>' +
      '<p class="eq num t-res-n" style="font-size:40px;margin-top:22px;color:var(--accent)">score vs dots: 19.5 → 18.0 dB</p>' +
      '<p class="note t-res-n" style="color:var(--second)">it rewards copying the dots</p>' +
      '<p class="note warm t-res-n" style="margin-top:22px">green patch: one photo’s different light</p></div>' +
      '<p class="cap">Our Poisson mesh from behind. Left: colours from the dots alone. Right: the same mesh repainted from the photos.</p>' +
      '<p class="cap">Look closer at the small print. From the dots it is speckled and soft; from the photos, FIFA WORLD CUP is crisp.</p>' +
      '<p class="cap">81% of the texture is seen by some photo; the rest keeps its dot colour. All 125 photos take about a minute.</p>' +
      '<p class="cap">Two honest catches: one photo’s different light leaves a green patch, and the score against the dots drops, since it rewards copying them.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap');
    this.p = q('.t-res-p'); this.l = q('.t-res-l'); this.z = q('.t-res-z'); this.zn = q('.t-res-zn'); this.n = q('.t-res-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.8, 18.4], t);
    const PT0 = [0.4, 1.6]; this.p.forEach((el, i) => { const p = eo(seg(t, PT0[i], PT0[i] + 0.8)); el.style.opacity = p; el.style.transform = 'scale(' + lerp(0.96, 1, p) + ')'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, PT0[i] + 0.6, PT0[i] + 1.1)));
    const zo = 1 - eo(seg(t, 12.3, 12.8)), ZT0 = [7.0, 8.4];
    this.z.forEach((el, i) => { const p = eo(seg(t, ZT0[i], ZT0[i] + 0.7)); el.style.opacity = p * zo; el.style.transform = 'scale(' + lerp(0.94, 1, p) + ')'; });
    this.zn.forEach((el, i) => { const p = eo(seg(t, ZT0[i] + 0.8, ZT0[i] + 1.3)); el.style.opacity = p * zo; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const NT = [13.2, 13.7, 14.6, 15.1, 18.8, 19.3, 20.6]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c;
    [[c.m, 7.0], [c.a, 8.4]].forEach(([cl, t0], i) => {
      const a = eo(seg(t, t0 - 0.4, t0 + 0.2)) * zo; if (a <= 0) return;
      ctx.globalAlpha = a; ctx.strokeStyle = cl; ctx.lineWidth = 3;
      ctx.strokeRect(PL[i] + 18 * B, PT + 154 * B, 180 * B, 100 * B); ctx.globalAlpha = 1;
    });
    const g = eo(seg(t, 20.4, 21.0));
    if (g > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(PL[1], PT, 321 * B, 520 * B); ctx.clip();
      ctx.globalAlpha = g; ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.setLineDash([12, 10]);
      ctx.beginPath(); ctx.ellipse(586, 736, 66 * lerp(0.8, 1, g), 86 * lerp(0.8, 1, g), 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore(); ctx.globalAlpha = 1;
    }
  },
});
