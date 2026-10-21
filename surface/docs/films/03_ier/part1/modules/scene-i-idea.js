const { seg, eo, eio, lerp, TextFx } = kit;
const wy = x => 470 + 40 * Math.sin((x - 220) / 100);
kit.scene('i-idea', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 1</span><h2 class="line">A different idea</h2></div>' +
      '<p class="note i-idea-t1" style="left:220px;top:262px;color:var(--second)">Poisson: makes a new surface</p>' +
      '<p class="note i-idea-t2" style="left:1080px;top:262px;color:var(--second)">IER: joins our own dots</p>' +
      '<p class="note warm i-idea-b1" style="left:220px;top:640px">corners are new points (yellow)</p>' +
      '<p class="note i-idea-b2" style="left:1080px;top:640px">corners are our dots (rings)</p>' +
      '<p class="cap">Poisson built a brand-new surface from an inside/outside map. Its triangle corners are new points.</p>' +
      '<p class="cap">IER does something simpler. It keeps our dots exactly where they are.</p>' +
      '<p class="cap">It only decides which three dots should be joined into a triangle. Every corner of the mesh is an input dot.</p>' +
      '<p class="cap">So the whole question becomes: which triangles are real? IER answers it by choosing, not by solving.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.i-idea-' + k).style;
    Object.assign(this, { t1: q('t1'), t2: q('t2'), b1: q('b1'), b2: q('b2') });
    const r = PS.rng(3);
    this.L = []; for (let x = 220; x <= 840; x += 31) this.L.push([x, wy(x) + (r() - 0.5) * 24]);
    this.C = []; for (let x = 220; x <= 840; x += 4) this.C.push([x, wy(x)]);
    this.NP = []; for (let x = 240; x <= 830; x += 42) this.NP.push([x, wy(x)]);
    this.P = PS.jgrid(1080, 330, 88, 8, 4, 18, 11); this.T = PS.gtris(8, 4);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 4.4, 9.4, 13.6], t);
    const ctx = this.k.fx, c = this.c;
    const dv = eo(seg(t, 0.6, 1.4));
    ctx.globalAlpha = dv * 0.5; ctx.strokeStyle = c.s; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(960, 290); ctx.lineTo(960, 620); ctx.stroke(); ctx.globalAlpha = 1;
    this.L.forEach((p, i) => PS.dot(ctx, p[0], p[1], 8 * eo(seg(t, 0.5 + i * 0.04, 0.9 + i * 0.04)), c.s));
    const cp = eio(seg(t, 2.0, 4.0));
    if (cp > 0) { ctx.strokeStyle = c.m; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; PS.poly(ctx, this.C, cp); }
    this.NP.forEach((p, i) => { const v = eo(seg(t, 4.0 + i * 0.06, 4.4 + i * 0.06)); if (v > 0) { ctx.globalAlpha = v; ctx.fillStyle = c.a; ctx.fillRect(p[0] - 6, p[1] - 6, 12, 12); ctx.globalAlpha = 1; } });
    this.P.forEach((p, i) => PS.dot(ctx, p[0], p[1], 8 * eo(seg(t, 4.8 + i * 0.03, 5.2 + i * 0.03)), c.s));
    this.T.forEach((tr, i) => {
      const p = eo(seg(t, 6.0 + i * 0.07, 6.5 + i * 0.07)); if (p <= 0) return;
      const A = this.P[tr[0]], B = this.P[tr[1]], C = this.P[tr[2]];
      ctx.globalAlpha = p; ctx.fillStyle = PS.mix(c.g, c.m, 0.25); ctx.strokeStyle = c.m; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    });
    const rg = eo(seg(t, 10.0, 10.8));
    if (rg > 0) this.P.forEach(p => { ctx.globalAlpha = rg; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p[0], p[1], 14, 0, PS.TAU); ctx.stroke(); ctx.globalAlpha = 1; });
    this.P.forEach(p => { if (t > 6.0) PS.dot(ctx, p[0], p[1], 8, c.s); });
    this.t1.opacity = eo(seg(t, 0.8, 1.3)); this.t2.opacity = eo(seg(t, 4.6, 5.1));
    this.b1.opacity = eo(seg(t, 4.4, 5.0)); this.b2.opacity = eo(seg(t, 10.4, 11.0));
  },
});