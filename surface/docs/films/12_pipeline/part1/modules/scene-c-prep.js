const { seg, eo, eio, lerp, TextFx } = kit;
const CX = 620, CY = 600, K = 48, WS = 520;
// box conventions: [label index, start time, pixels per toy unit, box half-width, box half-height] (filled in init)
const STEPS = [['1 · thin out the dots', ['SAP 100,000 · Point2Mesh 30,000', 'IER 12,500 · MeshAnything 8,192'], 0.6, 260], ['2 · centre and scale', ['into the box each method expects'], 13.4, 470], ['3 · remember how', ['transform.json'], 19.8, 610]];
const LAB = [['random 48: clumps and gaps', 'warm', 3.4, 6.6], ['farthest point sampling: even', '', 7.0, 13.0], ['SAP: centred, every |x| ≤ 0.9', '', 13.6, 15.0], ['Point2Mesh, DHSP: longest side = 1', '', 15.2, 16.6], ['IER: box diagonal = 1', '', 16.8, 18.2], ['MeshAnything: |x| ≤ 0.9995, up = +y', 'warm', 18.4, 99]];
kit.scene('c-prep', {
  init(kit) {
    let side = ''; STEPS.forEach(([a, b, , y]) => { side += '<div class="c-prep-s" style="position:absolute;left:1240px;top:' + y + 'px;width:600px"><p class="eq" style="position:static;font-size:38px">' + a + '</p>' + b.map(s => '<p class="note" style="position:static;margin-top:6px;color:var(--second)">' + s + '</p>').join('') + '</div><div class="c-prep-b" style="position:absolute;left:1216px;top:' + (y + 6) + 'px;width:6px;height:' + (40 + 40 * b.length) + 'px;border-radius:3px;background:var(--accent)"></div>'; });
    let lab = ''; LAB.forEach(([s, w]) => { lab += '<div class="words c-prep-l" style="left:170px;top:250px;width:900px;align-items:center"><p class="note' + (w ? ' warm' : '') + '">' + s + '</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · run.sh, before</span><h2 class="line">Preparing the input</h2></div>' + side + lab +
      '<p class="box c-prep-j" style="left:1240px;top:720px;width:600px;padding:12px 18px;font-family:var(--mono);font-size:22px;color:var(--accent)">{ "R": rotation, "center": [x, y, z], "scale": s }</p>' +
      '<p class="cap">Most run.sh scripts start the same way. The methods take fewer dots than our 138,677, so the dots are thinned out first.</p>' +
      '<p class="cap">Farthest point sampling: each new dot is the one farthest from all the dots kept so far, so the kept dots spread out evenly.</p>' +
      '<p class="cap">Then they are centred and scaled into the box that method expects. Each has its own; MeshAnything also turns them so up is +y.</p>' +
      '<p class="cap">The rotation, centre and scale are saved in transform.json, so the result can later be put back exactly where the scan was.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.s = q('.c-prep-s'); this.b = q('.c-prep-b'); this.l = q('.c-prep-l'); this.j = q('.c-prep-j')[0].style;
    const r = PS.rng(21), base = TOY.resample(TOY.SH, 480); this.D = base.map(p => [p[0] + (r() - 0.5) * 0.045, p[1] + (r() - 0.5) * 0.045]);
    let lo = [1e9, 1e9], hi = [-1e9, -1e9]; this.D.forEach(p => { lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[1])]; hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[1])]; });
    this.C0 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2]; const hw = (hi[0] - lo[0]) / 2, hh = (hi[1] - lo[1]) / 2, U = 270;
    // pixels per toy unit and box half-sizes for each convention (U pixels = 1 normalised unit)
    this.CONV = [[0.9 / Math.max(hw, hh) * U, 0.9 * U, 0.9 * U], [1 / (2 * Math.max(hw, hh)) * U, null, null], [1 / Math.hypot(2 * hw, 2 * hh) * U, null, null], [0.9995 / Math.max(hw, hh) * U, 0.9995 * U, 0.9995 * U]];
    this.CONV.forEach(cv => { if (cv[1] == null) { cv[1] = hw * cv[0]; cv[2] = hh * cv[0]; } });
    // random pick and farthest point sampling of K dots
    this.RND = []; const used = new Set(); while (this.RND.length < K) { const i = Math.floor(r() * this.D.length); if (!used.has(i)) { used.add(i); this.RND.push(i); } }
    const n = this.D.length, dmin = new Array(n).fill(1e9); this.FPS = [Math.floor(r() * n)]; this.RAD = [0];
    for (let k = 1; k < K; k++) { const last = this.D[this.FPS[k - 1]]; let best = 0, bd = -1; for (let i = 0; i < n; i++) { const d = Math.hypot(this.D[i][0] - last[0], this.D[i][1] - last[1]); if (d < dmin[i]) dmin[i] = d; if (dmin[i] > bd) { bd = dmin[i]; best = i; } } this.FPS.push(best); this.RAD.push(bd); }
  },
  scaleAt(t) {
    // pixels per toy unit and the box (null before scaling starts)
    const T = [13.6, 15.2, 16.8, 18.4]; if (t < T[0] - 0.4) return [WS, null];
    let i = 0; for (let j = 1; j < 4; j++) if (t >= T[j] - 0.4) i = j;
    const p = eio(seg(t, T[i] - 0.4, T[i] + 0.4)), prev = i ? this.CONV[i - 1] : [WS, null, null], cur = this.CONV[i];
    const s = lerp(prev[0], cur[0], p), bw = prev[1] == null ? cur[1] : lerp(prev[1], cur[1], p), bh = prev[2] == null ? cur[2] : lerp(prev[2], cur[2], p);
    return [s, [bw, bh, i === 0 && !prev[1] ? p : 1]];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 13.2, 19.6], t);
    let act = 0; STEPS.forEach(([, , a], i) => { if (t >= a) act = i; });
    this.s.forEach((el, i) => { const p = eo(seg(t, STEPS[i][2], STEPS[i][2] + 0.5)); el.style.opacity = p * (i === act ? 1 : 0.5); el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; this.b[i].style.opacity = i === act ? p : 0; });
    this.l.forEach((el, i) => { el.style.opacity = eo(seg(t, LAB[i][2], LAB[i][2] + 0.4)) * (1 - eo(seg(t, LAB[i][3] - 0.3, LAB[i][3]))); });
    const jp = eo(seg(t, 20.0, 20.5)); this.j.opacity = jp; this.j.transform = 'translateY(' + (1 - jp) * 14 + 'px)';
    const ctx = this.k.fx, c = this.c, [S, box] = this.scaleAt(t), X = p => [CX + (p[0] - this.C0[0]) * S, CY + (p[1] - this.C0[1]) * S];
    const fade = 1 - eo(seg(t, 12.8, 13.6)), a0 = eo(seg(t, 0.6, 1.4));
    // all the dots (fade out once only the kept ones matter)
    if (fade > 0) { ctx.globalAlpha = a0 * fade * 0.8; ctx.fillStyle = PS.mix(c.g, c.m, 0.75); this.D.forEach(p => { const q = X(p); ctx.fillRect(q[0] - 2, q[1] - 2, 4, 4); }); ctx.globalAlpha = 1; }
    // random pick, for contrast
    const ra = eo(seg(t, 3.4, 3.9)) * (1 - eo(seg(t, 6.3, 6.7)));
    if (ra > 0) { ctx.globalAlpha = ra; this.RND.forEach(i => { const q = X(this.D[i]); PS.dot(ctx, q[0], q[1], 6, c.a); }); ctx.globalAlpha = 1; }
    // farthest point sampling, one dot at a time; the newest shows the gap it fills
    const nk = t < 7.0 ? 0 : Math.min(K, 1 + Math.floor(seg(t, 7.0, 12.2) * (K - 1)));
    for (let k = 0; k < nk; k++) { const q = X(this.D[this.FPS[k]]); PS.dot(ctx, q[0], q[1], 6, c.s); }
    if (nk > 1 && t < 12.4) { const k = nk - 1, q = X(this.D[this.FPS[k]]); ctx.save(); ctx.beginPath(); ctx.rect(110, 300, 1080, 610); ctx.clip(); ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(q[0], q[1], this.RAD[k] * S, 0, PS.TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); PS.dot(ctx, q[0], q[1], 8, c.a); }
    // the method's box
    if (box) { ctx.globalAlpha = box[2]; ctx.strokeStyle = c.a; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]); ctx.strokeRect(CX - box[0], CY - box[1], 2 * box[0], 2 * box[1]); ctx.setLineDash([]); ctx.globalAlpha = 1; PS.dot(ctx, CX, CY, 4, c.a); }
  },
});
