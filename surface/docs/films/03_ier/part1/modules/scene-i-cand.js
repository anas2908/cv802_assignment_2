const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('i-cand', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 1 · Step 1</span><h2 class="line">Propose candidate triangles</h2></div>' +
      '<div class="words" style="left:110px;top:724px;gap:10px">' +
      '<p class="note i-cand-n1" style="position:static;color:var(--second)">8 neighbours  →  28 candidate triangles</p>' +
      '<p class="note i-cand-n2" style="position:static;color:var(--second)">50 neighbours (what IER uses)  →  1,225 per dot</p>' +
      '<p class="note warm i-cand-n3" style="position:static">12,500 dots  →  millions of candidates, most of them wrong</p></div>' +
      '<p class="cap">Look at the skin from above. Every dot is a possible triangle corner.</p>' +
      '<p class="cap">Pick one dot (yellow) and find its nearest neighbours. Here we show 8; IER uses 50.</p>' +
      '<p class="cap">The dot plus any two of its neighbours makes one candidate triangle. Together they form a tangled fan.</p>' +
      '<p class="cap">With 50 neighbours that is 1,225 candidates per dot, millions in total. Ones with very long edges are dropped at once.</p>' +
      '<p class="cap">Only a few candidates belong to the real skin (blue). The rest of IER is about picking exactly those.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.n = [1, 2, 3].map(i => kit.stage.querySelector('.i-cand-n' + i).style);
    this.P = PS.jgrid(300, 300, 90, 15, 5, 24, 5);
    const me = this.P[37]; this.me = me;
    const nb = this.P.map((p, i) => [Math.hypot(p[0] - me[0], p[1] - me[1]), i]).filter(v => v[1] !== 37).sort((a, b) => a[0] - b[0]).slice(0, 8).map(v => v[1]);
    this.nb = nb;
    this.cand = []; for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) this.cand.push([nb[a], nb[b]]);
    const ang = i => Math.atan2(this.P[i][1] - me[1], this.P[i][0] - me[0]);
    const ring = nb.slice().sort((a, b) => ang(a) - ang(b));
    this.real = new Set(); for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length]; this.real.add(Math.min(a, b) + ',' + Math.max(a, b)); }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 2.2, 5.6, 11.0, 15.4], t);
    const ctx = this.k.fx, c = this.c, me = this.me;
    const sel = eio(seg(t, 15.6, 16.6));
    this.cand.forEach((pr, i) => {
      const p = eo(seg(t, 5.8 + i * 0.15, 6.2 + i * 0.15)); if (p <= 0) return;
      const key = Math.min(pr[0], pr[1]) + ',' + Math.max(pr[0], pr[1]), real = this.real.has(key);
      const A = this.P[pr[0]], B = this.P[pr[1]];
      ctx.globalAlpha = p * (real ? 1 : lerp(0.75, 0.12, sel)); ctx.lineJoin = 'round';
      if (real && sel > 0) { ctx.fillStyle = PS.mix(c.g, c.m, 0.35 * sel); ctx.beginPath(); ctx.moveTo(me[0], me[1]); ctx.lineTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = real && sel > 0 ? PS.mix(c.a, c.m, sel) : c.a; ctx.lineWidth = real && sel > 0 ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(me[0], me[1]); ctx.lineTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.closePath(); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    const nl = eo(seg(t, 2.6, 4.4));
    if (nl > 0 && t < 6.0) { ctx.setLineDash([6, 7]); ctx.strokeStyle = c.s; ctx.lineWidth = 2; this.nb.forEach(i => { const p = this.P[i]; ctx.globalAlpha = nl * (1 - seg(t, 5.4, 6.0)); ctx.beginPath(); ctx.moveTo(me[0], me[1]); ctx.lineTo(lerp(me[0], p[0], nl), lerp(me[1], p[1], nl)); ctx.stroke(); }); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    this.P.forEach((p, i) => PS.dot(ctx, p[0], p[1], 9 * eo(seg(t, 0.3 + i * 0.012, 0.7 + i * 0.012)), c.s));
    if (nl > 0) this.nb.forEach(i => { const p = this.P[i]; ctx.globalAlpha = nl; ctx.strokeStyle = c.m; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p[0], p[1], 15, 0, PS.TAU); ctx.stroke(); ctx.globalAlpha = 1; });
    PS.dot(ctx, me[0], me[1], 13 * eo(seg(t, 2.2, 2.7)), c.a);
    this.n[0].opacity = eo(seg(t, 10.2, 10.7)); this.n[1].opacity = eo(seg(t, 11.4, 11.9)); this.n[2].opacity = eo(seg(t, 12.8, 13.3));
  },
});