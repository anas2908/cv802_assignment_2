const { seg, eo, eio, lerp, TextFx } = kit;
const COS = [0.95, 0.85, 0.7, 0.55, 0.4, 0.3], Z = [1.0, 1.1, 0.9, 1.2, 1.0, 1.3], BX = 200, BY = 760, BW = 90, GAP = 40, HMAX = 420;
kit.scene('t-blend', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Photo texturing · Step 4</span><h2 class="line">Picking the best photo</h2></div>' +
      '<p class="note t-blend-a" style="left:200px;top:806px">six photos that see one texel</p>' +
      '<p class="note t-blend-b" style="left:200px;top:240px;color:var(--second)">share of each photo in the texel</p>' +
      '<div class="words" style="left:1110px;top:280px;width:780px;gap:12px">' +
      '<p class="eq t-blend-n" style="font-size:40px">w = cos⁴ × (mesh size / distance)²</p>' +
      '<p class="note t-blend-n" style="color:var(--second)">frontal and close photos count more</p>' +
      '<p class="eq t-blend-n" style="font-size:40px;margin-top:22px;color:var(--accent)">then w⁸: the best one dominates</p>' +
      '<p class="note t-blend-n" style="color:var(--second)">averaging would blur misaligned photos</p>' +
      '<p class="note t-blend-n" style="margin-top:22px">brightness matched to the dots first</p>' +
      '<p class="note t-blend-n">texels no photo sees keep their dot colour</p></div>' +
      '<p class="note t-blend-s" style="left:1110px;top:700px;color:var(--second)">blended colour</p>' +
      '<p class="cap">Usually several photos pass all the checks. Each gets a weight: frontal views and close views count more.</p>' +
      '<p class="cap">Plain averaging would blur the details, since no two photos line up perfectly. So the weights are raised to the 8th power, and the best photo dominates.</p>' +
      '<p class="cap">Each photo’s brightness is first matched to the dot colours, and texels that no photo sees keep their dot colour.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.a = q('.t-blend-a')[0].style; this.b = q('.t-blend-b')[0].style; this.n = q('.t-blend-n'); this.s = q('.t-blend-s')[0].style;
    const w = COS.map((cs, i) => Math.pow(cs, 4) / (Z[i] * Z[i])), s1 = w.reduce((x, y) => x + y, 0), w8 = w.map(v => Math.pow(v, 8)), s8 = w8.reduce((x, y) => x + y, 0);
    this.p1 = w.map(v => v / s1); this.p8 = w8.map(v => v / s8);
    const c = this.c, G = PS.hex(c.g); this.cols = [c.a, c.s, c.m, c.a, c.s, c.m].map((h, i) => PS.hex(h).map((v, ch) => G[ch] + (v - G[ch]) * (0.55 + 0.07 * i)));
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 15.4], t);
    this.a.opacity = eo(seg(t, 0.8, 1.3)); this.b.opacity = eo(seg(t, 2.6, 3.1)); this.s.opacity = eo(seg(t, 4.4, 4.9));
    const NT = [2.0, 2.6, 8.4, 9.0, 15.6, 16.2]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c, m = eio(seg(t, 9.6, 12.0));
    const sh = this.p1.map((v, i) => lerp(v, this.p8[i], m));
    ctx.font = '600 24px ' + kit.fonts.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    sh.forEach((v, i) => { const g = eo(seg(t, 2.6 + i * 0.15, 3.4 + i * 0.15)); if (g <= 0) return; const x = BX + i * (BW + GAP), h = HMAX * v * g; ctx.fillStyle = 'rgb(' + this.cols[i].map(Math.round).join(',') + ')'; ctx.fillRect(x, BY - h, BW, h); ctx.strokeStyle = c.s; ctx.lineWidth = 2; ctx.strokeRect(x, BY - h, BW, h); ctx.fillStyle = c.s; ctx.fillText(Math.round(v * 100) + '%', x + BW / 2, BY - h - 20); ctx.fillText('cos ' + COS[i].toFixed(2), x + BW / 2, BY + 18); });
    const sw = eo(seg(t, 4.4, 5.2));
    if (sw > 0) { const mix = [0, 1, 2].map(ch => sh.reduce((s, v, i) => s + v * this.cols[i][ch], 0)); ctx.globalAlpha = sw; ctx.fillStyle = 'rgb(' + mix.map(Math.round).join(',') + ')'; ctx.fillRect(1110, 740, 200, 110); ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.strokeRect(1110, 740, 200, 110); ctx.globalAlpha = 1; }
  },
});