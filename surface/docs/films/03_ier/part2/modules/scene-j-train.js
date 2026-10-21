const { seg, eo, eio, lerp, TextFx } = kit;
const BX = [80, 445, 810, 1175, 1540], BW = 310, BY = 300, IY = 560;
const TXT = ['A known shape: one of about 23,000 ShapeNet objects', 'Sample about 12,500 dots on its surface', 'Propose candidates from 50 neighbours, as in Part 1', 'Measure the true ratio by walking on the real surface', 'Label every candidate: good, okay or bad'];
const AT = [-0.5, 4.2, 6.2, 9.2, 11.2];
const blob = (cx, cy, th, s) => { const r = 62 * (s || 1) * (1 + 0.18 * Math.cos(2 * th + 0.5) + 0.1 * Math.sin(3 * th)); return [cx + r * Math.cos(th), cy + r * Math.sin(th)]; };
kit.scene('j-train', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">IER · Part 2</span><h2 class="line">How IER was trained</h2></div>';
    TXT.forEach((s, i) => { h += '<p class="box j-train-b" style="left:' + BX[i] + 'px;top:' + BY + 'px;width:' + BW + 'px">' + s + '</p>'; });
    h += '<p class="eq j-train-e" style="left:110px;top:716px;font-size:46px;color:var(--accent)">then a network learns: dots in → label out</p>' +
      '<p class="cap">Before IER ever saw our scan, it was trained on about 23,000 everyday objects whose true surfaces are known.</p>' +
      '<p class="cap">For each object: sample about 12,500 dots and propose candidate triangles, exactly as in Part 1.</p>' +
      '<p class="cap">Because the true surface is known, the real walking distance, and so the label of every candidate, can be computed.</p>' +
      '<p class="cap">A network is then trained to predict those labels from the dots alone. Once trained, it needs no surface.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.b = [...kit.stage.querySelectorAll('.j-train-b')]; this.e = kit.stage.querySelector('.j-train-e').style;
    this.ring = []; for (let i = 0; i <= 90; i++) this.ring.push(i / 90 * PS.TAU);
  },
  shape(ctx, cx, p) { const c = this.c; ctx.strokeStyle = c.m; ctx.lineWidth = 4; ctx.beginPath(); this.ring.forEach((th, i) => { if (i / 90 > p) return; const q = blob(cx, IY, th); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke(); },
  dots(ctx, cx, p) { for (let i = 0; i < 18; i++) { const q = blob(cx, IY, i / 18 * PS.TAU); PS.dot(ctx, q[0], q[1], 6 * eo(Math.min(1, Math.max(0, p * 2 - i / 18))), this.c.s); } },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    PS.caps(this.caps, [0.3, 4.0, 9.0, 14.0], t);
    const ctx = this.k.fx, c = this.c;
    this.b.forEach((el, i) => { const p = eo(seg(t, AT[i], AT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 16 + 'px)'; });
    for (let i = 0; i < 4; i++) { const p = eo(seg(t, AT[i + 1] - 0.4, AT[i + 1])); if (p > 0) { ctx.globalAlpha = p; PS.arrow(ctx, BX[i] + BW + 6, BY + 60, BX[i] + BW + 6 + 40 * p, BY + 60, c.a, 3, 11); ctx.globalAlpha = 1; } }
    const cx = i => BX[i] + BW / 2;
    const p0 = eio(seg(t, 1.0, 2.4)); if (p0 > 0) this.shape(ctx, cx(0), p0);
    const p1 = seg(t, 4.4, 5.6); if (p1 > 0) { ctx.globalAlpha = 0.35; this.shape(ctx, cx(1), 1); ctx.globalAlpha = 1; this.dots(ctx, cx(1), p1); }
    const p2 = seg(t, 6.4, 8.0); if (p2 > 0) { ctx.globalAlpha = 0.35; this.shape(ctx, cx(2), 1); ctx.globalAlpha = 1; this.dots(ctx, cx(2), 1); const o = blob(cx(2), IY, 0); for (let k = 2; k < 9; k++) { const q = blob(cx(2), IY, k / 18 * PS.TAU), f = eo(Math.min(1, Math.max(0, p2 * 7 - (k - 2)))); if (f <= 0) continue; ctx.globalAlpha = f * 0.8; ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } ctx.globalAlpha = 1; }
    const p3 = eio(seg(t, 9.4, 11.0)); if (p3 > 0) { this.shape(ctx, cx(3), 1); this.dots(ctx, cx(3), 1); const a = blob(cx(3), IY, 0.3), b = blob(cx(3), IY, 2.6); ctx.setLineDash([8, 7]); ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], p3), lerp(a[1], b[1], p3)); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = c.m; ctx.lineWidth = 7; ctx.beginPath(); for (let k = 0; k <= 40; k++) { const th = 0.3 + (2.6 - 0.3) * k / 40 * p3, q = blob(cx(3), IY, th); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
    const p4 = seg(t, 11.4, 12.8); if (p4 > 0) { [[c.m, -70], [c.s, 0], [c.a, 70]].forEach(([col, dx], k) => { const f = eo(Math.min(1, Math.max(0, p4 * 3 - k))); if (f <= 0) return; const x = cx(4) + dx; ctx.globalAlpha = f; ctx.fillStyle = PS.mix(c.g, col, 0.45); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, IY - 36); ctx.lineTo(x + 30, IY + 26); ctx.lineTo(x - 30, IY + 26); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }); }
    this.e.opacity = eo(seg(t, 14.4, 15.0));
  },
});