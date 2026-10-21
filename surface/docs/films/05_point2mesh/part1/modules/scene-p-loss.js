const { seg, eo, eio, lerp, TextFx } = kit;
const CX = [400, 960, 1520], VY = 490;
const COLS = [['1 · gap to the dots', '15k → 25k points on the skin', 'vs our 30,000 dots'], ['2 · arrows agree (× 0.1)', 'triangle arrow vs dot arrow', '--unoriented: line, not sign'], ['3 · even triangles (× 0.1)', 'neighbours: similar areas', 'no slivers, no giants']];
const CT = [2.0, 8.0, 13.5];
kit.scene('p-loss', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">Point2Mesh · The goal</span><h2 class="line">What it minimises</h2></div>' +
      '<div class="words" style="left:110px;top:236px;width:1700px;align-items:center"><p class="eq p-loss-e" style="font-size:50px">loss = gap + 0.1 × arrows + 0.1 × evenness</p></div>';
    COLS.forEach((L, i) => { h += '<div class="words p-loss-c" style="left:' + (CX[i] - 260) + 'px;top:654px;width:520px;align-items:center;gap:6px">' + L.map((s, j) => '<p class="note' + (j ? '' : ' warm') + '"' + (j ? ' style="color:var(--second)"' : '') + '>' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:110px;top:832px;width:1700px;align-items:center"><p class="note p-loss-b">optimiser: Adam · 10,000 steps · about 42 minutes on our GPU</p></div>' +
      '<p class="cap">Each step, the network’s weights are nudged to make one number smaller: the loss. It has three parts.</p>' +
      '<p class="cap">First, the gap: points spread over the skin are matched with our 30,000 dots, both ways, as in the Chamfer distance.</p>' +
      '<p class="cap">Second, the arrows: each triangle should face the way the nearby dots’ arrows point. Weight 0.1.</p>' +
      '<p class="cap">Third, evenness: neighbouring triangles should have similar areas, so the skin has no slivers or giants. Weight 0.1.</p>' +
      '<p class="cap">The optimiser, Adam, repeats this 10,000 times. On our GPU the whole run took about 42 minutes.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.p-loss-e')[0].style; this.cl = q('.p-loss-c'); this.b = q('.p-loss-b')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.0, 10.6, 15.8, 20.4], t);
    const pe = eo(seg(t, 0.6, 1.2)); this.e.opacity = pe; this.e.transform = 'translateY(' + (1 - pe) * 14 + 'px)';
    this.cl.forEach((el, i) => { const p = eo(seg(t, CT[i] + 0.4, CT[i] + 0.9)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    this.b.opacity = eo(seg(t, 20.6, 21.1));
    const ctx = this.k.fx, c = this.c; ctx.lineCap = 'round';
    const v1 = eo(seg(t, CT[0], CT[0] + 0.8));
    if (v1 > 0) {
      const g = lerp(70, 22, eio(seg(t, 3.0, 6.5)));
      ctx.globalAlpha = v1;
      for (let i = 0; i < 9; i++) { const x = CX[0] - 200 + i * 50, y = VY + 30 * Math.sin(i * 0.7), y2 = y - g + 10 * Math.sin(i * 1.9); ctx.strokeStyle = PS.mix(c.g, c.s, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y2); ctx.stroke(); PS.dot(ctx, x, y, 7, c.s); PS.dot(ctx, x + 8, y2, 7, c.a); }
      ctx.globalAlpha = 1;
    }
    const v2 = eo(seg(t, CT[1], CT[1] + 0.8));
    if (v2 > 0) {
      const r = lerp(0.65, 0.05, eio(seg(t, 9.5, 12.5))), cx = CX[1] - 40, cy = VY + 40, A = [[-110, 30], [100, -10], [10, -60]].map(p => [cx + p[0] * Math.cos(r) - p[1] * Math.sin(r), cy + p[0] * Math.sin(r) + p[1] * Math.cos(r)]);
      ctx.globalAlpha = v2; PS.tri(ctx, A[0], A[1], A[2], PS.mix(c.g, c.a, 0.3), c.a, 3);
      const m = [(A[0][0] + A[1][0] + A[2][0]) / 3, (A[0][1] + A[1][1] + A[2][1]) / 3]; PS.arrow(ctx, m[0], m[1], m[0] + 110 * Math.sin(r - 0.05), m[1] - 110 * Math.cos(r - 0.05), c.a, 4, 14);
      PS.dot(ctx, CX[1] + 130, VY + 20, 8, c.s); PS.arrow(ctx, CX[1] + 130, VY + 20, CX[1] + 130, VY - 90, c.m, 4, 14); ctx.globalAlpha = 1;
    }
    const v3 = eo(seg(t, CT[2], CT[2] + 0.8));
    if (v3 > 0) {
      const s = eio(seg(t, 15.0, 18.0)), P = [[CX[2] - 170, VY + 70], [CX[2] + 170, VY + 70], [CX[2] + lerp(120, 0, s), VY - 90], [CX[2] + 10, VY - 100]];
      const mid = [lerp(CX[2] + 130, CX[2] + 0, s), VY + 70];
      ctx.globalAlpha = v3; PS.tri(ctx, P[0], mid, P[3], PS.mix(c.g, c.m, 0.3), c.m, 3); PS.tri(ctx, mid, P[1], P[3], PS.mix(c.g, c.a, 0.3 + 0.2 * (1 - s)), c.a, 3);
      [P[0], P[1], P[3], mid].forEach(p => PS.dot(ctx, p[0], p[1], 7, c.s)); ctx.globalAlpha = 1;
    }
  },
});