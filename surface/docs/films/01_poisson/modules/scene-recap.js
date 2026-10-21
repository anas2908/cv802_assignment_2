const { seg, eo, eob, lerp, TextFx } = kit;
const STEPS = ['1  Loose dots', '2  Inside/outside map χ', '3  Arrows (normals)', '4  PCA tile per dot', '5  MST + vote: all out', '6  Splat onto grid', '7  Solve Δχ = ∇·V', '8  Pins (α = 4)', '9  Marching tetrahedra', '10  Trim or keep closed'];
kit.scene('recap', {
  init(kit) {
    let html = '<div class="ground"><div class="words head"><span class="tag">Recap</span><h2 class="line">The whole pipeline</h2></div>';
    STEPS.forEach((s, i) => { const r = Math.floor(i / 5), c = i % 5; html += '<p class="box recap-s" style="left:' + (120 + c * 344) + 'px;top:' + (300 + r * 170) + 'px;width:300px;height:118px;display:flex;align-items:center">' + s + '</p>'; });
    html += '<div class="words" style="left:120px;top:690px;width:1600px"><h3 class="line big recap-big">1.02 million triangles in 39 s</h3>' +
      '<p class="sub recap-sub">VGGSfM input · F@1% 0.999 · Chamfer 0.149% of the diagonal · most accurate of all 8 methods</p></div></div>';
    kit.stage.append(kit.h(html));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.boxes = [...kit.stage.querySelectorAll('.recap-s')];
    this.big = kit.stage.querySelector('.recap-big'); this.sub = kit.stage.querySelector('.recap-sub').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    this.boxes.forEach((b, i) => { const p = seg(t, 0.25 + i * 0.16, 0.65 + i * 0.16); b.style.opacity = eo(p); b.style.transform = 'scale(' + lerp(0.9, 1, eob(p, 1.6)) + ')'; });
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 9; i++) {
      if (i === 4) continue;
      const p = eo(seg(t, 0.55 + i * 0.16, 0.8 + i * 0.16)); if (p <= 0) continue;
      const r = Math.floor(i / 5), cc = i % 5, x = 120 + cc * 344 + 304, y = 300 + r * 170 + 59;
      ctx.globalAlpha = p; PS.arrow(ctx, x, y, x + 34 * p, y, c.a, 3, 10); ctx.globalAlpha = 1;
    }
    const p4 = eo(seg(t, 1.2, 1.5));
    if (p4 > 0) { ctx.globalAlpha = p4; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1650, 418); ctx.lineTo(1650, 444); ctx.lineTo(270, 444); ctx.stroke(); PS.arrow(ctx, 270, 444, 270, 466, c.a, 3, 10); ctx.globalAlpha = 1; }
    TextFx.fadeFromRight(this.big, t, 2.3);
    this.sub.opacity = eo(seg(t, 2.9, 3.5));
  },
});