const { seg, eo, eio, lerp, TextFx } = kit;
const LT = [0.6, 6.0, 12.0, 17.6, 99];
const LS = ['1. The input matters most: raw dots 0.51, through our mesh 0.987', '2. V2 beats V1: more triangles allowed, more shape kept', '3. Greedy beats sampling: the dice add stray triangles', '4. Keep the grid it was trained on: 128 steps is enough'];
kit.scene('b-lessons', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">MeshAnything · Experiments</span><h2 class="line">What we learned</h2></div>' +
      '<div class="words" style="left:110px;top:250px;width:800px;gap:22px">' + LS.map(s => '<p class="box b-lessons-l" style="font-size:28px">' + s + '</p>').join('') + '</div>';
    const lab = (k, x, s, warm) => '<p class="note' + (warm ? ' warm' : '') + ' b-lessons-v' + k + '" style="left:' + (x - 200) + 'px;top:826px;width:400px;text-align:center">' + s + '</p>';
    h += lab(0, 1220, 'raw dots · F 0.51') + lab(0, 1620, 'through our mesh · F 0.987', 1) + lab(1, 1220, 'V1 · 471 triangles') + lab(1, 1620, 'V2 · 1,435 triangles', 1);
    const card = (k, y, a, b, hot) => '<div class="box ' + (hot ? 'hot ' : '') + 'b-lessons-v' + k + '" style="left:1060px;top:' + y + 'px;width:740px"><p class="eq" style="position:static;font-size:42px">' + a + '</p><p class="note" style="position:static;margin-top:6px;color:var(--second)">' + b + '</p></div>';
    h += card(2, 360, 'greedy', '1,435 triangles · F 0.987 · Chamfer 0.30%', 1) + card(2, 560, 'sampling (2 seeds)', '2,058 triangles · F 0.96 · Chamfer 0.34%') +
      card(3, 360, '128-step grid', '1,435 triangles · F 0.987 · 77 s', 1) + card(3, 560, '256-step grid', '1,810 triangles · F 0.972 · 105 s');
    h += '<p class="cap">Lesson one: the input matters most. Same model: F-score 0.51 on raw dots, 0.987 through our mesh.</p>' +
      '<p class="cap">Lesson two: V2 beats V1. V1 is limited to about 800 triangles and used 471 here; V2 used 1,435 and kept more shape.</p>' +
      '<p class="cap">Lesson three: greedy beats sampling. Rolling the dice adds stray triangles: more of them, slightly worse scores.</p>' +
      '<p class="cap">Lesson four: keep the grid it was trained on. 128 steps did as well as 256, and faster.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.b-lessons-l'); this.v = [0, 1, 2, 3].map(k => q('.b-lessons-v' + k));
  },
  vis(k, t) { return eo(seg(t, LT[k] + 0.3, LT[k] + 0.9)) * (1 - eo(seg(t, LT[k + 1] - 0.4, LT[k + 1]))); },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.2, 12.2, 17.8], t);
    this.l.forEach((el, i) => { const p = eo(seg(t, LT[i], LT[i] + 0.5)), on = t >= LT[i] && t < LT[i + 1]; el.style.opacity = p * (on ? 1 : 0.45); el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; el.style.borderColor = on ? 'var(--accent)' : ''; });
    this.v.forEach((els, k) => { const a = this.vis(k, t); els.forEach((el, j) => { el.style.opacity = a; el.style.transform = 'translateY(' + (1 - a) * 12 * (j % 2 ? 1.6 : 1) + 'px)'; }); });
    const ctx = this.k.fx, c = this.c, yaw = lerp(-0.4, 0.4, eio(seg(t, 0, 24)));
    const o = (cx, a, extra) => Object.assign({ c, cx, cy: 566, s: 460, yaw, pitch: 0.1, edge: 0.75 * a, fill: a, lw: 1.1 }, extra || {});
    const a0 = this.vis(0, t); if (a0 > 0) { MA.draw(ctx, 'r2', o(1220, a0, { tint: () => c.a, edge: 0.55 * a0, fill: 0.6 * a0 })); MA.draw(ctx, 'v2', o(1620, a0)); }
    const a1 = this.vis(1, t); if (a1 > 0) { MA.draw(ctx, 'v1', o(1220, a1)); MA.draw(ctx, 'v2', o(1620, a1)); }
  },
});