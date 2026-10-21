const { seg, eo, eio, lerp, TextFx } = kit;
const SQ = [1120, 250, 630];
kit.scene('d-flatten', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · UV map</span><h2 class="line">Flatten the skin</h2></div>' +
      '<p class="note warm d-flatten-s" style="left:200px;top:240px">gold: where OptCuts cuts</p>' +
      '<div class="words" style="left:' + SQ[0] + 'px;top:' + (SQ[1] + SQ[2] + 12) + 'px;width:' + SQ[2] + 'px;align-items:center"><p class="note d-flatten-q">the UV square: 6,000 triangles, one piece</p></div>' +
      '<p class="cap">To make a picture of a surface, cut it open and lay it flat, like peeling an orange or unfolding a cardboard box.</p>' +
      '<p class="cap">A tool called OptCuts chooses where to cut, shown in gold, so that the flat piece stretches as little as possible.</p>' +
      '<p class="cap">Then every triangle is laid out in a flat square. Each point of the skin gets a 2D address in it: its UV coordinates.</p>' +
      '<p class="cap">This is our real mesh. With this map, anything painted in the square can be wrapped straight back onto the body.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.s = q('.d-flatten-s')[0].style; this.q = q('.d-flatten-q')[0].style;
    const U = this.U = DH.uvmesh(MESH.load(kit, 'dh-final.json')), E = {}, seams = [];
    for (let k = 0; k < U.nf; k++) for (let m = 0; m < 3; m++) { const a = U.F[3 * k + m], b = U.F[3 * k + (m + 1) % 3], ta = U.G[3 * k + m], tb = U.G[3 * k + (m + 1) % 3], key = a < b ? a + ',' + b : b + ',' + a; (E[key] = E[key] || []).push({ a, b, ta, tb }); }
    Object.values(E).forEach(L => { if (L.length !== 2) return; const [p, r] = L, ok = (p.a === r.a ? p.ta === r.ta && p.tb === r.tb : p.ta === r.tb && p.tb === r.ta); if (!ok) seams.push([p.a, p.b]); });
    this.seams = seams;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.4, 10.4, 17.6], t);
    this.s.opacity = eo(seg(t, 5.0, 5.5)) * (1 - eo(seg(t, 9.0, 9.6))); this.q.opacity = eo(seg(t, 15.0, 15.6)) * (1 - eo(seg(t, 22.0, 22.6)));
    const ctx = this.k.fx, c = this.c, p = eio(seg(t, 8.6, 15.0)) * (1 - eio(seg(t, 22.4, 27.4)));
    const a = eo(seg(t, 0.3, 1.5)), yaw = lerp(-0.5, 0.35, eio(seg(t, 0, 30)));
    const o = { c, cx: 700, cy: 566, s: 720, yaw, pitch: 0.12, sq: SQ, edge: 0.35, lw: 0.6, fill: a };
    if (p > 0.02) { ctx.globalAlpha = 0.6 * Math.min(1, p * 2); ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.strokeRect(SQ[0], SQ[1], SQ[2], SQ[2]); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    DH.unfold(ctx, this.U, o, p);
    const sa = eo(seg(t, 4.6, 5.4)) * (1 - eo(seg(t, 8.6, 9.6)));
    if (sa > 0) { const U = this.U; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.lineCap = 'round'; this.seams.forEach(([u, v]) => { const d = (U.uD[u] + U.uD[v]) / 2; if (d < -0.02) return; ctx.globalAlpha = sa; ctx.beginPath(); ctx.moveTo(U.uX[u], U.uY[u]); ctx.lineTo(U.uX[v], U.uY[v]); ctx.stroke(); }); ctx.globalAlpha = 1; }
  },
});