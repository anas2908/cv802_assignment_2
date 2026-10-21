const { seg, eo, eio, eob, lerp, TextFx } = kit;
const LAY = [16, 32, 64, 64, 128], LX = [760, 850, 940, 1030, 1120], VC = [1560, 520];
kit.scene('p-net', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">Point2Mesh · The trick</span><h2 class="line">Let a network push</h2></div>' +
      '<p class="note p-net-a" style="left:130px;top:250px">input: 6 fixed random numbers per edge</p>' +
      '<p class="note warm p-net-a" style="left:130px;top:740px">one small filter, the same at every edge</p>' +
      '<p class="note p-net-b" style="left:730px;top:330px">mesh CNN (+ 3 residual blocks)</p>';
    LAY.forEach((n, i) => { h += '<p class="note num p-net-b" style="left:' + (LX[i] - 8 - (n > 99 ? 8 : 0)) + 'px;top:620px;color:var(--second)">' + n + '</p>'; });
    h += '<p class="note p-net-c" style="left:1330px;top:262px">each corner: the average push</p><p class="note p-net-c" style="left:1330px;top:298px">of all its edges</p>' +
      '<p class="note warm p-net-d" style="left:1000px;top:792px">gap to the dots → update the weights, repeat</p>' +
      '<p class="cap">Point2Mesh never pushes the corners itself. Instead, a neural network outputs every push at once.</p>' +
      '<p class="cap">It is a mesh CNN: each edge looks at its four neighbours through one small filter, and the same filter is used everywhere.</p>' +
      '<p class="cap">Its input is just fixed random numbers, 6 per edge. It outputs 6 numbers per edge: a push for each of the edge’s two corners.</p>' +
      '<p class="cap">Each corner averages the pushes of its edges. Only the network’s weights ever change, to shrink the gap to the dots.</p>' +
      '<p class="cap">No dataset and no pretraining: the network starts random and is trained on this one scan alone.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.a = q('.p-net-a'); this.b = q('.p-net-b'); this.cc = q('.p-net-c'); this.d = q('.p-net-d')[0];
    this.P = PS.jgrid ? null : null;
    const r = PS.rng(4), P = []; for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) P.push([150 + i * 82 + (r() - 0.5) * 26, 320 + j * 76 + (r() - 0.5) * 22]);
    const T = []; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const a = j * 6 + i, b = a + 1, c2 = a + 6, d = c2 + 1; if ((i + j) % 2) { T.push([a, b, d], [a, d, c2]); } else { T.push([a, b, c2], [b, d, c2]); } }
    const E = {}, key = (u, v) => u < v ? u + '-' + v : v + '-' + u;
    T.forEach((tr, ti) => [[0, 1], [1, 2], [2, 0]].forEach(([x, y]) => { const k = key(tr[x], tr[y]); (E[k] = E[k] || { u: tr[x], v: tr[y], t: [] }).t.push(ti); }));
    const inner = Object.values(E).filter(e => e.t.length === 2).sort((p, q) => (P[p.u][0] + P[p.v][0]) - (P[q.u][0] + P[q.v][0]) + 0.3 * ((P[p.u][1] + P[p.v][1]) - (P[q.u][1] + P[q.v][1])));
    this.Pp = P; this.T = T; this.E = Object.values(E); this.inner = inner.filter((_, i) => i % 3 === 0);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.6, 11.4, 17.0, 22.0], t);
    const f = (el, a) => { const p = eo(seg(t, a, a + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 20 + 'px)'; };
    f(this.a[0], 1.2); f(this.a[1], 3.0); this.b.forEach((el, i) => f(el, 6.6 + i * 0.15)); this.cc.forEach((el, i) => f(el, 12.0 + i * 0.3)); f(this.d, 17.8);
    const ctx = this.k.fx, c = this.c, P = this.Pp;
    const pa = eo(seg(t, 0.5, 1.8));
    ctx.lineCap = 'round';
    if (pa > 0) { ctx.globalAlpha = pa; this.T.forEach(tr => PS.tri(ctx, P[tr[0]], P[tr[1]], P[tr[2]], PS.mix(c.g, c.m, 0.14), PS.mix(c.g, c.m, 0.75), 2)); P.forEach(p => PS.dot(ctx, p[0], p[1], 5, c.s)); ctx.globalAlpha = 1; }
    const st = seg(t, 2.6, 3.2);
    if (st > 0) {
      const j = Math.floor(Math.max(0, t - 2.6) / 0.6) % this.inner.length, e = this.inner[j];
      const nb = []; e.t.forEach(ti => { const tr = this.T[ti]; [[0, 1], [1, 2], [2, 0]].forEach(([x, y]) => { const u = tr[x], v = tr[y]; if (!((u === e.u && v === e.v) || (u === e.v && v === e.u))) nb.push([u, v]); }); });
      ctx.globalAlpha = st; ctx.lineWidth = 7; ctx.strokeStyle = c.m; nb.forEach(([u, v]) => { ctx.beginPath(); ctx.moveTo(P[u][0], P[u][1]); ctx.lineTo(P[v][0], P[v][1]); ctx.stroke(); });
      ctx.lineWidth = 9; ctx.strokeStyle = c.a; ctx.beginPath(); ctx.moveTo(P[e.u][0], P[e.u][1]); ctx.lineTo(P[e.v][0], P[e.v][1]); ctx.stroke(); ctx.globalAlpha = 1;
    }
    const a1 = eo(seg(t, 6.2, 6.7)); if (a1 > 0) { ctx.globalAlpha = a1; PS.arrow(ctx, 600, 510, 700, 510, c.a, 3, 12); ctx.globalAlpha = 1; }
    LAY.forEach((n, i) => { const p = eob(seg(t, 6.6 + i * 0.15, 7.1 + i * 0.15), 1.6); if (p <= 0) return; const hgt = (24 + Math.log2(n) * 24) * p; ctx.fillStyle = PS.mix(c.g, c.m, 0.35 + i * 0.1); ctx.strokeStyle = c.m; ctx.lineWidth = 2; ctx.fillRect(LX[i] - 26, 510 - hgt / 2, 52, hgt); ctx.strokeRect(LX[i] - 26, 510 - hgt / 2, 52, hgt); });
    const a2 = eo(seg(t, 11.6, 12.1)); if (a2 > 0) { ctx.globalAlpha = a2; PS.arrow(ctx, 1170, 510, 1270, 510, c.a, 3, 12); ctx.globalAlpha = 1; }
    const v = eo(seg(t, 11.8, 12.6));
    if (v > 0) {
      const nb = [0.3, 1.5, 2.5, 3.6, 4.9].map(a => [VC[0] + 150 * Math.cos(a), VC[1] + 150 * Math.sin(a)]), pr = [[38, -60], [70, -20], [10, -74], [60, -50], [44, -36]];
      ctx.globalAlpha = v; ctx.strokeStyle = PS.mix(c.g, c.m, 0.8); ctx.lineWidth = 3; nb.forEach(q => { ctx.beginPath(); ctx.moveTo(VC[0], VC[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); PS.dot(ctx, q[0], q[1], 7, c.s); });
      const pp = eo(seg(t, 13.0, 14.0)); pr.forEach(d => { if (pp > 0) { ctx.globalAlpha = v * pp * 0.8; PS.arrow(ctx, VC[0], VC[1], VC[0] + d[0] * pp, VC[1] + d[1] * pp, c.m, 2.5, 10); } });
      const av = eo(seg(t, 15.4, 16.4)); if (av > 0) { const m = pr.reduce((s, d) => [s[0] + d[0] / 5, s[1] + d[1] / 5], [0, 0]); ctx.globalAlpha = av; PS.arrow(ctx, VC[0], VC[1], VC[0] + m[0] * 1.6 * av, VC[1] + m[1] * 1.6 * av, c.a, 6, 18); }
      ctx.globalAlpha = v; PS.dot(ctx, VC[0], VC[1], 11, c.a); ctx.globalAlpha = 1;
    }
    const lp = eio(seg(t, 17.6, 19.0));
    if (lp > 0) { ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); const N = 40; for (let i = 0; i <= N * lp; i++) { const u = i / N, x = lerp(1560, 940, u), y = 690 + Math.sin(u * Math.PI) * 80; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); if (lp > 0.98) PS.arrow(ctx, 944, 706, 940, 686, c.a, 3, 13); }
  },
});