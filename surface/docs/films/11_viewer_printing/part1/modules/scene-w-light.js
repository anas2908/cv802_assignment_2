const { seg, eo, eio, lerp, TextFx } = kit;
const OX = 1380, OY = 600, OS = 600, KEEP = 32, MBPX = 2;
const BARS = [['Poisson, full: 1,023,553 triangles', 262, 169.1, 0, '169 MB', 1.0], ['Poisson, browser copy: 200,000', 382, 14.1, 5.5, '14 MB + 5.5 MB image', 8.2],
  ['NKSR, full: 2,088,273 triangles', 502, 348.0, 0, '348 MB', 2.0], ['NKSR, browser copy: 200,000', 622, 13.8, 5.7, '14 MB + 5.7 MB image', 9.0]];
kit.scene('w-light', {
  init(kit) {
    let html = '';
    BARS.forEach(([lab, y, a, b, sz]) => { html += '<p class="note w-light-b" style="left:110px;top:' + y + 'px;font-size:24px;color:var(--second)">' + lab + '</p><p class="note w-light-b" style="left:' + (110 + (a + b) * MBPX + 14) + 'px;top:' + (y + 38) + 'px;font-size:24px">' + sz + '</p>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The viewer · Speed</span><h2 class="line">A lighter copy</h2></div>' + html +
      '<div class="words w-light-k" style="left:1044px;top:236px;width:672px;align-items:center"><p class="note warm w-light-kn">160 corners</p></div>' +
      '<p class="note w-light-n" style="left:110px;top:720px">remove the corner that changes the shape least</p>' +
      '<p class="note w-light-n" style="left:110px;top:766px;color:var(--second)">repeat until 200,000 triangles are left</p>' +
      '<p class="note w-light-n" style="left:110px;top:830px">texture: copy the colour of the closest spot</p>' +
      '<p class="note warm w-light-n" style="left:110px;top:876px">downloads still give the full mesh</p>' +
      '<p class="cap">Our Poisson mesh has over a million triangles: a 169 MB file. A browser would take long to load it, and it would turn slowly.</p>' +
      '<p class="cap">So any mesh above 200,000 triangles gets a lighter copy for the browser. Corners are removed one by one, always the one that changes the shape least.</p>' +
      '<p class="cap">The new triangles need their own texture: each new texel copies the colour of the closest spot on the full mesh. Downloads still give the full mesh.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.w-light-b'); this.kn = q('.w-light-kn')[0]; this.ks = q('.w-light-k')[0].style; this.n = q('.w-light-n');
    // the 2D toy: drop corners of the shirt outline one at a time, always the one whose triangle with its neighbours is smallest
    const P = TOY.OUT, n = P.length, alive = new Array(n).fill(true), order = [];
    const area = (i) => { let a = (i - 1 + n) % n; while (!alive[a]) a = (a - 1 + n) % n; let b = (i + 1) % n; while (!alive[b]) b = (b + 1) % n; return Math.abs((P[a][0] - P[i][0]) * (P[b][1] - P[i][1]) - (P[b][0] - P[i][0]) * (P[a][1] - P[i][1])) / 2; };
    for (let r = 0; r < n - KEEP; r++) { let best = -1, ba = 1e9; for (let i = 0; i < n; i++) if (alive[i]) { const a = area(i); if (a < ba) { ba = a; best = i; } } alive[best] = false; order.push(best); }
    this.rank = new Array(n).fill(1e9); order.forEach((i, r) => { this.rank[i] = r; });
    const S = p => [OX + p[0] * OS, OY + p[1] * OS]; this.SP = P.map(S);
    const c = this.c, band = [c.m, c.a, c.s]; this.col = P.map((_, i) => { const f = (i / n) * 6, k = Math.floor(f), u = f - k; return PS.mix(band[k % 3], band[(k + 1) % 3], u, 1); });
    const fin = []; for (let i = 0; i < n; i++) if (this.rank[i] >= n - KEEP) fin.push(i);
    this.pieces = []; fin.forEach((i, j) => { const a = this.SP[i], b = this.SP[fin[(j + 1) % fin.length]]; for (let m = 0; m < 8; m++) { const s0 = m / 8, s1 = (m + 1) / 8, mx = lerp(a[0], b[0], (s0 + s1) / 2), my = lerp(a[1], b[1], (s0 + s1) / 2); let best = 0, bd = 1e9; this.SP.forEach((p, k) => { const d = (p[0] - mx) ** 2 + (p[1] - my) ** 2; if (d < bd) { bd = d; best = k; } }); this.pieces.push([lerp(a[0], b[0], s0), lerp(a[1], b[1], s0), lerp(a[0], b[0], s1), lerp(a[1], b[1], s1), this.col[best]]); } });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 14.0], t);
    BARS.forEach((B, i) => { const p = eo(seg(t, B[5] + 0.6, B[5] + 1.1)); this.b[2 * i].style.opacity = eo(seg(t, B[5], B[5] + 0.5)); this.b[2 * i + 1].style.opacity = p; });
    const NT = [7.4, 8.0, 14.6, 15.2]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const n = TOY.N, dec = eio(seg(t, 7.0, 12.6)), removed = Math.round(dec * (n - KEEP)), left = n - removed;
    this.kn.textContent = left + ' corners'; this.ks.opacity = eo(seg(t, 0.6, 1.1));
    const ctx = this.k.fx, c = this.c;
    BARS.forEach(([lab, y, a, b, sz, t0]) => { const p = eio(seg(t, t0 + 0.2, t0 + 1.0)); if (p <= 0) return; ctx.fillStyle = PS.mix(c.g, c.m, 0.75); ctx.fillRect(110, y + 40, a * MBPX * p, 30); if (b) { ctx.fillStyle = c.a; ctx.fillRect(110 + a * MBPX * p, y + 40, b * MBPX * p, 30); } });
    const ob = eo(seg(t, 0.6, 1.4));
    if (ob > 0) { ctx.lineCap = 'round'; ctx.lineWidth = 12; for (let i = 0; i < n; i++) { const a = this.SP[i], b = this.SP[(i + 1) % n]; ctx.globalAlpha = ob * 0.55; ctx.strokeStyle = this.col[i]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } ctx.globalAlpha = 1; }
    const keep = []; for (let i = 0; i < n; i++) if (this.rank[i] >= removed) keep.push(this.SP[i]);
    if (ob > 0) {
      ctx.globalAlpha = ob; ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath(); keep.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
      keep.forEach(p => PS.dot(ctx, p[0], p[1], left > 80 ? 3 : 5, c.s)); ctx.globalAlpha = 1;
    }
    const rb = seg(t, 14.4, 17.4);
    if (rb > 0) { ctx.lineWidth = 6; ctx.lineCap = 'round'; const m = Math.floor(rb * this.pieces.length); for (let j = 0; j < m; j++) { const [x0, y0, x1, y1, cl] = this.pieces[j]; ctx.strokeStyle = cl; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); } }
  },
});
