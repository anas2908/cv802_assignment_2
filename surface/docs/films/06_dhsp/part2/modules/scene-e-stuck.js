const { seg, eo, eio, lerp, TextFx } = kit;
const Z = [[180, 470], [260, 380], [300, 520], [380, 400], [400, 560], [480, 430], [470, 590], [560, 460], [600, 600], [690, 480], [760, 560]];
kit.scene('e-stuck', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · On our scan</span><h2 class="line">The recipe stalls</h2></div>' +
      '<div class="words" style="left:160px;top:236px;width:640px;align-items:center"><p class="note e-stuck-a">a crumpled skin, seen edge-on</p></div>' +
      '<div class="words" style="left:160px;top:760px;width:640px;align-items:center"><p class="note warm e-stuck-b">laid flat, the folds overlap</p></div>' +
      '<div class="words e-stuck-c" style="left:860px;top:500px;width:240px;align-items:center;gap:2px"><p class="note" style="color:var(--second)">OptCuts:</p><p class="note" style="color:var(--second)">stopped at 15 h</p></div>' +
      '<div class="words" style="left:1180px;top:236px;width:600px;align-items:center"><p class="note e-stuck-d">the fallback, xatlas: many small pieces</p></div>' +
      '<div class="words" style="left:1180px;top:880px;width:600px;align-items:center"><p class="note warm e-stuck-e">every edge of a piece is a seam</p></div>' +
      '<p class="cap">Next, the recipe flattens the skin with OptCuts. On this crumpled surface it never finished: we stopped it after 15 hours.</p>' +
      '<p class="cap">Folded triangles fight each other: there is no way to lay them flat in one piece without overlaps.</p>' +
      '<p class="cap">A faster tool, xatlas, cuts the skin into many small pieces instead. But every cut is a seam, and the 2D priors smear across seams.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = ['a', 'b', 'c', 'd', 'e'].map(s => q('.e-stuck-' + s)[0].style);
    const r = PS.rng(12), P = []; for (let i = 0; i < 42; i++) { const w = 40 + r() * 70, h = 30 + r() * 60; P.push([1200 + r() * (560 - w), 300 + r() * (540 - h), w, h, r()]); } this.P = P;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 13.0], t);
    [0.8, 8.4, 3.0, 13.2, 15.6].forEach((a, i) => this.l[i].opacity = eo(seg(t, a, a + 0.5)));
    const ctx = this.k.fx, c = this.c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const a = eo(seg(t, 0.6, 1.6)), f = eio(seg(t, 8.2, 11.4));
    if (a > 0) {
      const L = []; for (let i = 1; i < Z.length; i++) L.push(Math.hypot(Z[i][0] - Z[i - 1][0], Z[i][1] - Z[i - 1][1]));
      const flat = [[400, 690]]; for (let i = 0; i < L.length; i++) { const dir = i % 2 ? -1 : 1, prev = flat[i]; flat.push([prev[0] + dir * L[i], 690 + ((i + 1) % 2) * 16]); }
      const P = Z.map((p, i) => [lerp(p[0], flat[i][0], f), lerp(p[1], flat[i][1], f)]);
      ctx.globalAlpha = a; ctx.strokeStyle = c.m; ctx.lineWidth = 6; ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      if (f > 0.6) { ctx.globalAlpha = a * eo(seg(f, 0.6, 1)); ctx.strokeStyle = c.a; ctx.lineWidth = 6; for (let i = 1; i < P.length; i += 2) { ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i + 1 < P.length ? i + 1 : i][0], P[i + 1 < P.length ? i + 1 : i][1]); ctx.stroke(); } }
      ctx.globalAlpha = a; P.forEach(p => PS.dot(ctx, p[0], p[1], 6, c.s)); ctx.globalAlpha = 1;
    }
    const ck = eo(seg(t, 2.8, 3.4));
    if (ck > 0) { const x = 980, y = 420, r = 56, sp = t * 2.2; ctx.globalAlpha = ck; ctx.strokeStyle = c.s; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, PS.TAU); ctx.stroke(); ctx.strokeStyle = c.a; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 * Math.sin(sp), y - 40 * Math.cos(sp)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26 * Math.sin(sp / 12), y - 26 * Math.cos(sp / 12)); ctx.stroke(); ctx.globalAlpha = 1; }
    const xa = seg(t, 13.2, 15.4);
    if (xa > 0) { ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.globalAlpha = eo(xa); ctx.strokeRect(1180, 280, 600, 580); ctx.setLineDash([]); this.P.forEach((p, i) => { const v = eo(Math.min(1, Math.max(0, xa * 1.5 - i / this.P.length * 0.5))); if (v <= 0) return; ctx.globalAlpha = v; ctx.fillStyle = PS.mix(c.g, c.m, 0.2 + 0.25 * p[4]); ctx.fillRect(p[0], p[1], p[2], p[3]); ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.strokeRect(p[0], p[1], p[2], p[3]); }); ctx.globalAlpha = 1; }
  },
});