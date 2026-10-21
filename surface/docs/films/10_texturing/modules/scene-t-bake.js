const { seg, eo, eio, lerp, TextFx } = kit;
const TX = [520, 560];
kit.scene('t-bake', {
  init(kit) {
    const B = 1.28;
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Photo texturing · Step 2</span><h2 class="line">First guess: the dots</h2></div>' +
      '<div class="words" style="left:200px;top:850px;width:640px;align-items:center"><p class="note t-bake-l">a texel and its 8 nearest dots</p></div>' +
      '<p class="eq t-bake-e" style="left:200px;top:240px;font-size:40px">colour = Σ wᵢ cᵢ / Σ wᵢ,  wᵢ = 1 / dᵢ²</p>' +
      '<div class="t-bake-w" style="position:absolute;left:1080px;top:226px;width:' + Math.round(325 * B) + 'px;height:' + Math.round(520 * B) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('tex_fig.jpg') + '" style="position:absolute;left:' + Math.round(-10 * B) + 'px;top:' + Math.round(-76 * B) + 'px;width:' + Math.round(1344 * B) + 'px;height:' + Math.round(616 * B) + 'px"></div>' +
      '<div class="words t-bake-r" style="left:1080px;top:904px;width:416px;align-items:center"><p class="note warm">soft and blotchy: no sharper than the dots</p></div>' +
      '<p class="cap">First guess: each texel finds its 8 nearest dots and mixes their colours, closer dots counting more: weight 1 over distance squared.</p>' +
      '<p class="cap">That fills the whole texture quickly. It is the colour you saw on most meshes in the earlier films.</p>' +
      '<p class="cap">But it can never be sharper than the dots themselves: edges come out soft and blotchy.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.t-bake-l')[0].style; this.e = q('.t-bake-e')[0].style; this.w = q('.t-bake-w')[0].style; this.r = q('.t-bake-r')[0].style;
    const r = PS.rng(31), c = this.c; this.D = []; for (let i = 0; i < 70; i++) { const a = r() * PS.TAU, d = 40 + Math.sqrt(r()) * 280; this.D.push({ x: TX[0] + d * Math.cos(a), y: TX[1] + d * Math.sin(a) * 0.85, col: [c.m, c.s, c.a][Math.floor(r() * 3)], m: 0.45 + 0.4 * r() }); }
    const nn = this.D.map((p, i) => [Math.hypot(p.x - TX[0], p.y - TX[1]), i]).sort((a, b) => a[0] - b[0]).slice(0, 8); this.nn = nn;
    const W = nn.map(([d]) => 1 / (d * d)), S = W.reduce((a, b) => a + b, 0), G = PS.hex(c.g); let acc = [0, 0, 0]; nn.forEach(([d, i], k) => { const col = PS.hex(this.D[i].col).map((v, ch) => G[ch] + (v - G[ch]) * this.D[i].m); acc = acc.map((v, ch) => v + col[ch] * W[k] / S); }); this.mixc = 'rgb(' + acc.map(Math.round).join(',') + ')'; this.W = W.map(w => w / S);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.0], t);
    this.l.opacity = eo(seg(t, 1.2, 1.7)); this.e.opacity = eo(seg(t, 3.4, 4.0));
    const w = eo(seg(t, 6.6, 7.4)); this.w.opacity = w; this.w.transform = 'scale(' + lerp(0.96, 1, w) * lerp(1, 1.025, eio(seg(t, 6.6, 18))) + ')'; this.r.opacity = eo(seg(t, 12.2, 12.7));
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 0.4, 1.4));
    this.D.forEach(p => { ctx.globalAlpha = a; PS.dot(ctx, p.x, p.y, 9, PS.mix(c.g, p.col, p.m)); });
    const ln = eo(seg(t, 1.8, 3.0));
    if (ln > 0) this.nn.forEach(([d, i], k) => { const p = this.D[i]; ctx.globalAlpha = ln; ctx.strokeStyle = c.a; ctx.lineWidth = 1 + 14 * this.W[k]; ctx.beginPath(); ctx.moveTo(TX[0], TX[1]); ctx.lineTo(lerp(TX[0], p.x, ln), lerp(TX[1], p.y, ln)); ctx.stroke(); ctx.strokeStyle = c.s; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, PS.TAU); ctx.stroke(); });
    const tx = eo(seg(t, 3.6, 4.4)); ctx.globalAlpha = a; ctx.fillStyle = tx > 0 ? this.mixc : c.g; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.fillRect(TX[0] - 22, TX[1] - 22, 44, 44); ctx.strokeRect(TX[0] - 22, TX[1] - 22, 44, 44); ctx.globalAlpha = 1;
  },
});