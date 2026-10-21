const { seg, eo, eio, lerp, TextFx } = kit;
const GS = 34, GX0 = 880, GY0 = 190, GN = 23, FOC = [1522, 470], ZMAX = 3.2;
const CLIP = [880, 185, 780, 735];
const TA = { v: [[1150, 330], [1020, 610], [1290, 630], [1205, 515]], in: [1, 0, 0, 0] };
const TB = { v: [[1600, 330], [1470, 610], [1740, 630], [1655, 515]], in: [1, 0, 0, 1] };
const CF = [[1110, 440], [1370, 440], [1370, 700], [1110, 700]];
const CUBE = CF.concat(CF.map(p => [p[0] + 130, p[1] - 105]));
const CIN = [1, 0, 0, 1, 1, 0, 0, 0];
const CE = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const PE0 = [170, 720], PE1 = [770, 720], PY = v => 720 - 300 * v;
kit.scene('extract', {
  init(kit) {
    const caps = ['After step 8, every grid corner holds a number χ: near 1 deep inside, near 0 far outside, about 0.5 at the skin.',
      'Zoom in on the skin. Each dot is a grid corner, and its number is its χ.',
      'One rule: χ of 0.5 or more means inside (blue). Less than 0.5 means outside (white).',
      'Take one edge that joins a blue corner (0.8) and a white one (0.2).',
      'Walking along it, χ falls from 0.8 to 0.2, so it must pass 0.5. Here that happens exactly halfway, so the skin point goes halfway.',
      'On an edge from 0.6 to 0.1, χ reaches 0.5 early, so the skin point sits close to the 0.6 corner.',
      'Do this on every edge that joins a blue and a white corner. Blue–blue or white–white edges have no skin on them.',
      'Inside each little square, join its two skin points with a short line.',
      'Zoom out: all those short lines join up into the outline of the body slice.',
      'In 3D the grid is made of cubes. Each cube is cut along its diagonal into 6 pyramids (tetrahedra), 4 corners each.',
      '1 blue corner and 3 white: the skin slices off that corner. 3 crossing points make 1 triangle.',
      '2 blue and 2 white: 4 crossing points make a 4-sided patch, split into 2 triangles.',
      'Neighbours share edges, so they share skin points: the triangles meet with no gaps. About a million triangles in all.'];
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 9</span><h2 class="line">Draw the skin</h2></div>' +
      '<div class="words ex-leg" style="left:110px;top:290px;gap:8px"><p class="note num" style="position:static">χ ≥ 0.5  →  inside (blue)</p><p class="note num" style="position:static;color:var(--second)">χ < 0.5  →  outside (white)</p></div>' +
      '<p class="note warm ex-h1" style="left:400px;top:790px">halfway</p>' +
      '<p class="note warm ex-h2" style="left:200px;top:790px">close to the 0.6 corner</p>' +
      '<p class="note warm ex-one" style="left:1540px;top:300px">1 of the 6 pyramids</p>' +
      '<p class="note ex-t1" style="left:1030px;top:670px">1 vs 3 → 1 triangle</p>' +
      '<p class="note ex-t2" style="left:1470px;top:670px">2 vs 2 → 2 triangles</p>' +
      '<p class="box hot ex-end" style="left:110px;top:430px;width:640px">Marching tetrahedra: our own code, about 1 million triangles at 384³, with no cracks.</p>' +
      caps.map(s => '<p class="cap">' + s + '</p>').join('') + '</div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.ex-' + k).style;
    Object.assign(this, { leg: q('leg'), h1: q('h1'), h2: q('h2'), one: q('one'), t1: q('t1'), t2: q('t2'), end: q('end') });
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    const V = []; for (let j = 0; j < GN; j++) { V.push([]); for (let i = 0; i < GN; i++) V[j].push(PS.chi(GX0 + i * GS, GY0 + j * GS, 9)); }
    this.V = V;
    const E = {}, list = [], cross = (va, vb) => (va - 0.5) * (vb - 0.5) < 0;
    const add = (key, a, b, va, vb) => { const f = (0.5 - va) / (vb - va); const p = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; E[key] = list.length; list.push({ a, b, p, d: Math.hypot(p[0] - FOC[0], p[1] - FOC[1]) }); };
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
      const a = [GX0 + i * GS, GY0 + j * GS];
      if (i + 1 < GN && cross(V[j][i], V[j][i + 1])) add('h' + i + ',' + j, a, [a[0] + GS, a[1]], V[j][i], V[j][i + 1]);
      if (j + 1 < GN && cross(V[j][i], V[j + 1][i])) add('v' + i + ',' + j, a, [a[0], a[1] + GS], V[j][i], V[j + 1][i]);
    }
    this.E = list;
    this.S = [];
    for (let j = 0; j < GN - 1; j++) for (let i = 0; i < GN - 1; i++) {
      const ks = ['h' + i + ',' + j, 'v' + (i + 1) + ',' + j, 'h' + i + ',' + (j + 1), 'v' + i + ',' + j].filter(k => k in E).map(k => list[E[k]].p);
      for (let m = 0; m + 1 < ks.length; m += 2) { const A = ks[m], B = ks[m + 1]; this.S.push({ A, B, d: Math.hypot((A[0] + B[0]) / 2 - FOC[0], (A[1] + B[1]) / 2 - FOC[1]) }); }
    }
    this.one1 = list.slice().sort((x, y) => x.d - y.d)[0];
  },
  cam(t) { const p = eio(seg(t, 3.8, 6.0)) * (1 - eio(seg(t, 33.5, 36.0))); return { z: Math.exp(Math.log(ZMAX) * p), fx: lerp(PS.C.cx, FOC[0], p), fy: lerp(PS.C.cy, FOC[1], p), p }; },
  tet(ctx, T, p) {
    const c = this.c, E6 = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    ctx.globalAlpha = eo(Math.min(1, p * 2)); ctx.strokeStyle = PS.mix(c.g, c.s, 0.55); ctx.lineWidth = 3;
    E6.forEach(e => { ctx.beginPath(); ctx.moveTo(T.v[e[0]][0], T.v[e[0]][1]); ctx.lineTo(T.v[e[1]][0], T.v[e[1]][1]); ctx.stroke(); });
    const pts = []; E6.forEach(e => { if (T.in[e[0]] !== T.in[e[1]]) { const A = T.v[e[0]], B = T.v[e[1]]; pts.push([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]); } });
    const pp = eo(seg(p, 0.35, 0.6)), tp = eo(seg(p, 0.6, 1));
    const P = pts.length === 4 ? [pts[0], pts[1], pts[3], pts[2]] : pts;
    if (tp > 0) {
      ctx.globalAlpha = tp * 0.55; ctx.fillStyle = c.a; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = tp; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.stroke();
      if (P.length === 4) { ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[2][0], P[2][1]); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.globalAlpha = 1; P.forEach(q => PS.dot(ctx, q[0], q[1], 8 * pp, c.a));
    ctx.globalAlpha = eo(Math.min(1, p * 2));
    T.v.forEach((q, i) => { if (T.in[i]) PS.dot(ctx, q[0], q[1], 13, c.m); else { ctx.fillStyle = c.g; ctx.beginPath(); ctx.arc(q[0], q[1], 11, 0, PS.TAU); ctx.fill(); ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.stroke(); } });
    ctx.globalAlpha = 1;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 6.2, 9.4, 13.2, 17.6, 20.2, 24.2, 30.6, 34.0, 38.2, 45.2, 48.6, 52.6], t);
    const ctx = this.k.fx, c = this.c, cm = this.cam(t);
    const X = w => [(w[0] - cm.fx) * cm.z + 1250, (w[1] - cm.fy) * cm.z + 560];
    const L2 = 1 - seg(t, 37.6, 38.2);
    if (L2 > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(CLIP[0], CLIP[1], CLIP[2], CLIP[3]); ctx.clip();
      const heat = (t < 6 ? eo(seg(t, 0.2, 1.4)) : lerp(1, 0.22, eo(seg(t, 6.0, 7.5)))) * L2 * (1 + 0.6 * seg(t, 33.5, 36));
      for (let j = 0; j < GN - 1; j++) for (let i = 0; i < GN - 1; i++) {
        const v = (this.V[j][i] + this.V[j][i + 1] + this.V[j + 1][i] + this.V[j + 1][i + 1]) / 4;
        const a = X([GX0 + i * GS, GY0 + j * GS]);
        ctx.globalAlpha = heat; ctx.fillStyle = PS.mix(c.g, c.m, v * 0.85); ctx.fillRect(a[0], a[1], GS * cm.z + 0.7, GS * cm.z + 0.7);
      }
      ctx.globalAlpha = 1;
      const box = eo(seg(t, 2.6, 3.4)) * (1 - seg(t, 5.6, 6.2));
      if (box > 0) { const a = X([FOC[0] - 120, FOC[1] - 110]); ctx.globalAlpha = box; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.strokeRect(a[0], a[1], 240 * cm.z, 220 * cm.z); ctx.globalAlpha = 1; }
      const cp = eo(seg(t, 6.5, 8.0)) * L2, zt = Math.min(1, Math.max(0, (cm.z - 2.4) / 0.6));
      const vt = cp * zt * (1 - seg(t, 30.3, 30.8));
      ctx.font = '500 20px ' + this.mono; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const r = 4 + 6 * (cm.z - 1) / (ZMAX - 1);
      if (cp > 0) for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
        const s = X([GX0 + i * GS, GY0 + j * GS]); if (s[0] < 860 || s[0] > 1680 || s[1] < 160 || s[1] > 940) continue;
        const v = this.V[j][i], ord = Math.hypot(s[0] - 1250, s[1] - 560) / 500;
        const col = eo(seg(t, 9.6 + ord * 1.4, 10.2 + ord * 1.4));
        ctx.globalAlpha = cp;
        if (v >= 0.5) PS.dot(ctx, s[0], s[1], r, PS.mix(c.s, c.m, col));
        else { ctx.fillStyle = c.g; ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, PS.TAU); ctx.fill(); ctx.strokeStyle = c.s; ctx.lineWidth = 2.5; ctx.stroke(); }
        if (vt > 0) { ctx.globalAlpha = vt; ctx.fillStyle = PS.mix(c.g, c.s, 0.8); ctx.fillText(v.toFixed(2), s[0] + 9, s[1] + 8); }
      }
      const hl = eo(seg(t, 13.4, 14.0)) * (1 - seg(t, 23.8, 24.3));
      if (hl > 0) { const a = X(this.one1.a), b = X(this.one1.b); ctx.globalAlpha = hl * (0.6 + 0.4 * Math.sin(t * 3)); ctx.strokeStyle = c.a; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      this.E.forEach(e => {
        const p = eo(seg(t, 24.6 + Math.min(e.d, 150) / 150 * 2.2, 25.0 + Math.min(e.d, 150) / 150 * 2.2)) * L2; if (p <= 0) return;
        const a = X(e.a), b = X(e.b), s = X(e.p);
        ctx.globalAlpha = p * lerp(1, 0.35, seg(t, 30.6, 31.4)); ctx.strokeStyle = c.a; ctx.lineWidth = 4 + cm.z; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.globalAlpha = p; PS.dot(ctx, s[0], s[1], 3 + 2.6 * cm.z, c.a);
      });
      this.S.forEach(sg => {
        const s0 = sg.d < 140 ? 30.8 + sg.d / 140 * 2.0 : 34.0 + Math.min(1, sg.d / 420) * 3.0;
        const p = eio(seg(t, s0, s0 + 0.5)) * L2; if (p <= 0) return;
        const A = X(sg.A), B = X(sg.B);
        ctx.globalAlpha = 1; ctx.strokeStyle = c.a; ctx.lineWidth = 3 + 1.6 * cm.z; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(lerp(A[0], B[0], p), lerp(A[1], B[1], p)); ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.restore();
    }
    this.leg.opacity = eo(seg(t, 9.6, 10.2)) * (1 - seg(t, 37.4, 37.9));
    const LP = eo(seg(t, 13.2, 13.8)) * (1 - seg(t, 23.8, 24.4));
    if (LP > 0) {
      const sw = seg(t, 20.0, 20.6), ex2 = sw > 0.5, k = Math.abs(sw - 0.5) * 2;
      const va = ex2 ? 0.6 : 0.8, vb = ex2 ? 0.1 : 0.2, f = (0.5 - va) / (vb - va);
      const pr = ex2 ? eio(seg(t, 20.8, 22.4)) : eio(seg(t, 15.0, 17.4));
      ctx.globalAlpha = LP; ctx.strokeStyle = PS.mix(c.g, c.s, 0.6); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(PE0[0], PE0[1]); ctx.lineTo(PE1[0], PE1[1]); ctx.stroke();
      ctx.setLineDash([10, 10]); ctx.strokeStyle = PS.mix(c.g, c.a, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(150, PY(0.5)); ctx.lineTo(800, PY(0.5)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '600 24px ' + this.mono; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.a; ctx.fillText('0.5', 806, PY(0.5));
      ctx.globalAlpha = LP * k; ctx.strokeStyle = c.m; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(PE0[0], PY(va)); ctx.lineTo(PE1[0], PY(vb)); ctx.stroke();
      ctx.globalAlpha = LP; PS.dot(ctx, PE0[0], PE0[1], 22, c.m);
      ctx.fillStyle = c.g; ctx.beginPath(); ctx.arc(PE1[0], PE1[1], 20, 0, PS.TAU); ctx.fill(); ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.stroke();
      ctx.globalAlpha = LP * k; ctx.font = '600 30px ' + this.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = c.s;
      ctx.fillText(va.toFixed(1), PE0[0], 752); ctx.fillText(vb.toFixed(1), PE1[0], 752);
      const px = lerp(PE0[0], PE1[0], f * pr), pv = lerp(va, vb, f * pr);
      if (pr > 0 && k > 0.2) {
        ctx.globalAlpha = LP * k; PS.dot(ctx, px, PY(pv), 9, c.a);
        ctx.setLineDash([6, 6]); ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, PY(pv)); ctx.lineTo(px, PE0[1]); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '600 26px ' + this.mono; ctx.textBaseline = 'bottom'; ctx.fillStyle = c.a; ctx.fillText('χ = ' + pv.toFixed(2), px, PY(pv) - 16);
        const hit = eo(seg(t, ex2 ? 22.4 : 17.4, ex2 ? 22.8 : 17.8));
        PS.dot(ctx, px, PE0[1], 7 + 9 * hit, c.a);
      }
      ctx.globalAlpha = 1;
    }
    this.h1.opacity = LP * eo(seg(t, 17.6, 18.0)) * (1 - seg(t, 19.9, 20.2));
    this.h2.opacity = LP * eo(seg(t, 22.6, 23.0));
    const L3 = eo(seg(t, 38.2, 38.8)) * (1 - seg(t, 44.6, 45.2));
    if (L3 > 0) {
      const ep = seg(t, 38.3, 39.6) * 12;
      ctx.strokeStyle = PS.mix(c.g, c.s, 0.6); ctx.lineWidth = 3;
      CE.forEach((e, i) => { const p = Math.min(1, Math.max(0, ep - i)); if (p <= 0) return; const A = CUBE[e[0]], B = CUBE[e[1]]; ctx.globalAlpha = L3; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(lerp(A[0], B[0], p), lerp(A[1], B[1], p)); ctx.stroke(); });
      const tf = eo(seg(t, 42.0, 43.2));
      if (tf > 0) { const T4 = [3, 0, 4, 5].map(i => CUBE[i]); ctx.globalAlpha = L3 * tf * 0.35; ctx.fillStyle = c.a; ctx.beginPath(); ctx.moveTo(T4[0][0], T4[0][1]); ctx.lineTo(T4[1][0], T4[1][1]); ctx.lineTo(T4[2][0], T4[2][1]); ctx.lineTo(T4[3][0], T4[3][1]); ctx.closePath(); ctx.fill(); ctx.globalAlpha = L3 * tf; ctx.strokeStyle = c.a; ctx.lineWidth = 3; [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]].forEach(e => { ctx.beginPath(); ctx.moveTo(T4[e[0]][0], T4[e[0]][1]); ctx.lineTo(T4[e[1]][0], T4[e[1]][1]); ctx.stroke(); }); }
      const dg = eo(seg(t, 41.0, 41.8));
      if (dg > 0) { const A = CUBE[3], B = CUBE[5]; ctx.globalAlpha = L3; ctx.setLineDash([10, 8]); ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(lerp(A[0], B[0], dg), lerp(A[1], B[1], dg)); ctx.stroke(); ctx.setLineDash([]); }
      const cc = eo(seg(t, 39.6, 40.6));
      CUBE.forEach((q, i) => { ctx.globalAlpha = L3 * eo(seg(t, 38.6 + i * 0.1, 39.0 + i * 0.1)); if (CIN[i] && cc > 0) PS.dot(ctx, q[0], q[1], 14, PS.mix(c.s, c.m, cc)); else { ctx.fillStyle = c.g; ctx.beginPath(); ctx.arc(q[0], q[1], 12, 0, PS.TAU); ctx.fill(); ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.stroke(); } });
      ctx.globalAlpha = 1;
    }
    this.one.opacity = L3 * eo(seg(t, 42.4, 42.9));
    const pa = seg(t, 45.2, 47.6), pb = seg(t, 48.6, 51.0);
    if (pa > 0) this.tet(ctx, TA, pa);
    if (pb > 0) this.tet(ctx, TB, pb);
    this.t1.opacity = eo(seg(t, 46.8, 47.2)); this.t2.opacity = eo(seg(t, 50.2, 50.6));
    this.end.opacity = eo(seg(t, 52.8, 53.4));
  },
});