const { seg, eo, eio, lerp, TextFx } = kit;
const COLS = 6, ROWS = 4, T0 = 6.4, DT = 0.28;
kit.scene('j-build', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 2</span><h2 class="line">Building the mesh</h2></div>' +
      '<div class="words" style="left:1000px;top:300px;width:800px;gap:16px">' +
      '<p class="box j-build-r1">1. Throw away every candidate labelled bad.</p>' +
      '<p class="box j-build-r2">2. Sort the rest: good before okay, small triangles first.</p>' +
      '<p class="box hot j-build-r3">3. Add a triangle only if it crosses no triangle already in the mesh, and none of its edges would get a third triangle.</p></div>' +
      '<p class="note num j-build-ca" style="left:1000px;top:770px">added: 0</p>' +
      '<p class="note warm num j-build-cr" style="left:1300px;top:770px">rejected: 0</p>' +
      '<p class="cap">The network has labelled every candidate. Now IER builds one mesh from them.</p>' +
      '<p class="cap">First the bad candidates are thrown away (yellow). The rest are sorted: good before okay, small before big.</p>' +
      '<p class="cap">Then IER goes down the list one by one, and adds a triangle only if it keeps the mesh clean.</p>' +
      '<p class="cap">A candidate is rejected if it crosses a triangle already in the mesh, or if one of its edges would get a third triangle.</p>' +
      '<p class="cap">What survives is the mesh: every corner is one of our dots, and every triangle passed the network and the checks.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.j-build-' + k);
    this.r = [1, 2, 3].map(i => q('r' + i).style); this.ca = q('ca'); this.cr = q('cr');
    this.P = PS.jgrid(260, 330, 105, COLS, ROWS, 20, 13);
    const T = PS.gtris(COLS, ROWS), steps = [];
    for (let j = 0; j + 1 < ROWS; j++) for (let i = 0; i + 1 < COLS; i++) {
      const k = (j * (COLS - 1) + i) * 2, a = j * COLS + i, b = a + 1, c = a + COLS, d = c + 1;
      steps.push({ t: T[k], ok: true }, { t: T[k + 1], ok: true });
      steps.push({ t: (i + j) % 2 ? [a, b, c] : [a, b, d], ok: false });
    }
    this.steps = steps;
    this.bad = [[0, 9, 22], [5, 14, 18], [2, 21, 11]];
  },
  tri(ctx, t, fill, stroke, w, a) { const A = this.P[t[0]], B = this.P[t[1]], C = this.P[t[2]]; ctx.globalAlpha = a; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); ctx.globalAlpha = 1; },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 3.0, 6.2, 12.0, 20.0], t);
    const ctx = this.k.fx, c = this.c;
    const show = eo(seg(t, 0.8, 1.8));
    this.bad.forEach(b => { const out = seg(t, 3.6, 4.6); if (show * (1 - out) > 0) this.tri(ctx, b, null, c.a, 3, show * (1 - out)); });
    let added = 0, rej = 0;
    this.steps.forEach((s, i) => {
      const ts = T0 + i * DT;
      if (t < ts) { if (show > 0 && s.ok) this.tri(ctx, s.t, null, PS.mix(c.g, c.s, 0.45), 1.5, show * 0.5); return; }
      if (s.ok) { added++; this.tri(ctx, s.t, PS.mix(c.g, c.m, 0.3), c.m, 2.5, eo(seg(t, ts, ts + 0.25))); }
      else { rej++; const f = 1 - seg(t, ts + 0.2, ts + 0.6); if (f > 0) { this.tri(ctx, s.t, null, c.a, 4, f); const A = this.P[s.t[0]], B = this.P[s.t[1]], C = this.P[s.t[2]], mx = (A[0] + B[0] + C[0]) / 3, my = (A[1] + B[1] + C[1]) / 3; ctx.globalAlpha = f; ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mx - 9, my - 9); ctx.lineTo(mx + 9, my + 9); ctx.moveTo(mx + 9, my - 9); ctx.lineTo(mx - 9, my + 9); ctx.stroke(); ctx.globalAlpha = 1; } }
    });
    this.P.forEach((p, i) => PS.dot(ctx, p[0], p[1], 9 * eo(seg(t, 0.3 + i * 0.03, 0.7 + i * 0.03)), c.s));
    this.ca.textContent = 'added: ' + added; this.cr.textContent = 'rejected: ' + rej;
    this.ca.style.opacity = eo(seg(t, 6.2, 6.6)); this.cr.style.opacity = eo(seg(t, 6.2, 6.6));
    this.r[0].opacity = eo(seg(t, 3.0, 3.5)); this.r[1].opacity = eo(seg(t, 4.8, 5.3)); this.r[2].opacity = eo(seg(t, 12.2, 12.7));
  },
});