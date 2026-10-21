const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 0.596;
kit.scene('b-domain', {
  init(kit) {
    const col = (x, a, b, warm, cls) => '<div class="words ' + cls + '" style="left:' + (x - 300) + 'px;top:842px;width:600px;align-items:center;gap:4px"><p class="note' + (warm ? ' warm' : '') + '" style="font-size:28px">' + a + '</p><p class="note" style="color:var(--second)">' + b + '</p></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · On our scan</span><h2 class="line">The input matters</h2></div>' +
      '<div class="b-domain-win" style="position:absolute;left:868px;top:262px;width:' + Math.round(310 * SC) + 'px;height:560px;overflow:hidden;border-radius:12px">' +
      '<img src="' + kit.assets.url('raw_dots.png') + '" style="position:absolute;left:' + Math.round(-230 * SC) + 'px;top:' + Math.round(-55 * SC) + 'px;width:' + Math.round(768 * SC) + 'px;height:' + Math.round(1024 * SC) + 'px"></div>' +
      col(330, 'clean dots, as in training', 'even · smooth · closed', 0, 'b-domain-c') + col(960, 'our raw scan dots', '138,677 dots · uneven · gaps', 0, 'b-domain-c') + col(1590, 'V2 fed the raw dots', 'F@1% 0.51 · Chamfer 1.27%', 1, 'b-domain-c') +
      '<p class="cap">During training the dots always came from a clean closed shell: evenly spread, smooth, no gaps, arrows pointing out.</p>' +
      '<p class="cap">Our raw scan dots are different: uneven, a little noisy, with gaps, and their arrows are our own guesses from Video 1.</p>' +
      '<p class="cap">Fed our raw dots directly, the model got confused and wrote a shattered body of floating pieces.</p>' +
      '<p class="cap">Like reading messy handwriting after only ever seeing print. The model is fine; the input is unfamiliar.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.col = q('.b-domain-c'); this.win = q('.b-domain-win')[0].style;
    this.Q = MA.surf('v2', 8192, 5);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.2, 12.6, 18.8], t);
    const CT = [1.6, 6.8, 13.4];
    this.col.forEach((el, i) => { const p = eo(seg(t, CT[i], CT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    const w = eo(seg(t, 6.0, 6.8)); this.win.opacity = w; this.win.transform = 'scale(' + lerp(0.96, 1, w) * lerp(1, 1.02, eio(seg(t, 6, 26))) + ')';
    const ctx = this.k.fx, c = this.c, yaw = lerp(-0.3, 0.3, eio(seg(t, 0, 26)));
    const d = seg(t, 0.4, 2.2);
    if (d > 0) MA.pts(ctx, this.Q, { cx: 330, cy: 542, s: 560, yaw, pitch: 0.1 }, 1.2, c.s, i => d * 1.7 - (i % 89) / 89 * 0.7, 0.03, 20, c.m);
    const r = eo(seg(t, 12.0, 13.4));
    if (r > 0) MA.draw(ctx, 'r2', { c, cx: 1590, cy: 542, s: 560, yaw, pitch: 0.1, edge: 0.7 * r, fill: r, lw: 1.1, tint: () => c.a });
  },
});