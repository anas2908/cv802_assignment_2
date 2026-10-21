const { seg, eo, eio, lerp, TextFx } = kit;
const LY = 620, X0 = 300, X1 = 1600, VX = v => X0 + (Math.min(v, 3) - 1) / 2 * (X1 - X0);
function quad(P0, C, P1, n) { const o = []; for (let i = 1; i <= n; i++) { const s = i / n; o.push([(1 - s) * (1 - s) * P0[0] + 2 * (1 - s) * s * C[0] + s * s * P1[0], (1 - s) * (1 - s) * P0[1] + 2 * (1 - s) * s * C[1] + s * s * P1[1]]); } return o; }
kit.scene('i-ratio', {
  init(kit) {
    const C = IW.CH, A = IW.ARM;
    const p1 = []; for (let x = C[3][0]; x <= C[5][0]; x += 4) p1.push([x, IW.chestY(x)]);
    const arm = []; for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 - i / 40 * Math.PI; arm.push([IW.AC[0] + IW.AR * Math.cos(a), IW.AC[1] + IW.AR * Math.sin(a)]); }
    const back = []; for (let x = 1716; x >= C[10][0]; x -= 4) back.push([x, IW.chestY(x)]);
    const p2 = arm.concat(quad(arm[40], [1250, 290], [1500, 300], 30), quad([1500, 300], [1710, 380], [1720, IW.chestY(1720)], 30), back);
    this.v1 = IW.len(p1) / Math.hypot(C[5][0] - C[3][0], C[5][1] - C[3][1]);
    this.v2 = IW.len(p2) / Math.hypot(C[10][0] - A[0][0], C[10][1] - A[0][1]);
    this.M = [{ v: this.v1, txt: 'two chest dots: ' + this.v1.toFixed(2), y: 576, at: 4.8, good: true },
      { v: this.v2, txt: 'arm → chest: ≈ ' + Math.round(this.v2), y: 576, at: 6.6, good: false },
      { v: 1.04, txt: 'example real triangle: 1.04', y: 532, at: 11.0, good: true },
      { v: 4.8, txt: 'example triangle across the gap: 4.8', y: 532, at: 12.6, good: false }];
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 1</span><h2 class="line">The intrinsic–extrinsic ratio</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1500px;gap:18px">' +
      '<p class="eq i-ratio-e1" style="font-size:50px">IER = walking distance ÷ straight distance</p>' +
      '<p class="eq i-ratio-e2" style="font-size:42px;color:var(--main)">for a triangle: its 3 walks added ÷ its 3 straight edges added</p></div>' +
      '<p class="note i-ratio-k" style="left:300px;top:700px">≤ 1.3: keep (can be real)</p>' +
      '<p class="note warm i-ratio-r" style="left:1000px;top:700px">> 1.3: reject (crosses empty space)</p>' +
      '<p class="cap">Divide the walking distance by the straight distance. This is the intrinsic–extrinsic ratio, IER.</p>' +
      '<p class="cap">On the same surface it stays close to 1. Across a gap it shoots far above.</p>' +
      '<p class="cap">A triangle has three edges, so add up the three walks and divide by the three straight edges.</p>' +
      '<p class="cap">IER uses a cut-off of 1.3. Up to 1.3 the triangle can be real; above it, it crosses empty space.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.i-ratio-' + k).style;
    Object.assign(this, { e1: q('e1'), e2: q('e2'), kk: q('k'), rr: q('r') });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 4.6, 9.4, 14.6], t);
    const ctx = this.k.fx, c = this.c;
    const lp = eio(seg(t, 2.0, 3.2));
    ctx.strokeStyle = PS.mix(c.g, c.s, 0.6); ctx.lineWidth = 4; ctx.lineCap = 'round';
    if (lp > 0) { ctx.beginPath(); ctx.moveTo(X0, LY); ctx.lineTo(lerp(X0, X1 + 60, lp), LY); ctx.stroke(); }
    ctx.font = '500 22px ' + this.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = c.s;
    [[1, '1.0'], [1.3, '1.3'], [2, '2.0'], [3, '3.0+']].forEach(([v, s]) => { const x = VX(v), p = eo(seg(t, 2.6, 3.2)); ctx.globalAlpha = p; ctx.beginPath(); ctx.moveTo(x, LY - 10); ctx.lineTo(x, LY + 10); ctx.stroke(); ctx.fillText(s, x, LY + 18); });
    const th = eo(seg(t, 14.8, 15.6));
    if (th > 0) { ctx.globalAlpha = th; ctx.strokeStyle = c.a; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(VX(1.3), LY - 26); ctx.lineTo(VX(1.3), LY + 12); ctx.stroke(); ctx.fillStyle = c.a; ctx.font = '700 22px ' + this.mono; ctx.textBaseline = 'top'; ctx.fillText('1.3', VX(1.3), LY + 18); }
    ctx.globalAlpha = 1;
    this.M.forEach(m => {
      const p = eo(seg(t, m.at, m.at + 0.7)); if (p <= 0) return;
      const x = VX(m.v), col = m.good ? c.m : c.a;
      ctx.globalAlpha = p; PS.dot(ctx, x, lerp(LY - 60, LY, p), 11, col);
      if (m.v > 3) PS.arrow(ctx, x + 14, LY, x + 60, LY, col, 4, 14);
      ctx.font = '600 23px ' + this.mono; ctx.fillStyle = col; ctx.textBaseline = 'bottom'; ctx.textAlign = m.good ? 'left' : 'right';
      ctx.fillText(m.txt, m.good ? X0 - 10 : X1 + 60, m.y - 16);
      ctx.globalAlpha = 1;
    });
    this.e1.opacity = eo(seg(t, 0.6, 1.2)); this.e2.opacity = eo(seg(t, 9.6, 10.2));
    this.kk.opacity = eo(seg(t, 15.4, 16.0)); this.rr.opacity = eo(seg(t, 16.0, 16.6));
  },
});