window.PS = (function () {
  const TAU = Math.PI * 2;
  const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function col(kit) {
    let s = null; try { s = getComputedStyle(kit.stage); } catch (e) {}
    const g = (k, d) => { const v = s ? s.getPropertyValue(k).trim() : ''; return /^#[0-9a-fA-F]{6}$/.test(v) ? v : d; };
    return { g: g('--ground', '#0E1420'), m: g('--main', '#58C4DD'), s: g('--second', '#ECF1F6'), a: g('--accent', '#F2C14E') };
  }
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, p, al) { const A = hex(a), B = hex(b); const c = A.map((v, i) => Math.round(v + (B[i] - v) * p)); return 'rgba(' + c.join(',') + ',' + (al == null ? 1 : al) + ')'; }
  function arrow(ctx, x1, y1, x2, y2, color, w, head) {
    const L = Math.hypot(x2 - x1, y2 - y1); if (L < 0.5) return;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, h = Math.min(head || 13, L * 0.6);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w || 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * h * 0.6, y2 - uy * h * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * h - uy * h * 0.55, y2 - uy * h + ux * h * 0.55); ctx.lineTo(x2 - ux * h + uy * h * 0.55, y2 - uy * h - ux * h * 0.55); ctx.closePath(); ctx.fill();
  }
  function dot(ctx, x, y, r, color) { if (r <= 0) return; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function caps(els, times, t) { els.forEach((el, i) => { const a = times[i], b = times[i + 1]; let o = eo(seg(t, a, a + 0.45)); if (b != null) o *= 1 - seg(t, b - 0.3, b); el.style.opacity = o; el.style.transform = 'translateY(' + (1 - eo(seg(t, a, a + 0.45))) * 18 + 'px)'; }); }
  function poly(ctx, pts, prog) { if (!pts.length) return; const n = Math.max(1, Math.floor((pts.length - 1) * prog)); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= n && i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }
  function tri(ctx, a, b, c, fill, stroke, lw) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.stroke(); } }
  return { TAU, seg, eo, rng, col, hex, mix, arrow, dot, caps, poly, tri };
})();
// Real Point2Mesh data (our VGGSfM scan, best run: paper settings + --unoriented), stored in json modules p2m-*.json:
window.TOY = (function () {
  const SH = [[-0.16,-0.48],[-0.08,-0.40],[0,-0.37],[0.08,-0.40],[0.16,-0.48],[0.40,-0.38],[0.56,-0.12],[0.40,-0.02],[0.32,-0.16],[0.32,0.50],[-0.32,0.50],[-0.32,-0.16],[-0.40,-0.02],[-0.56,-0.12],[-0.40,-0.38]];
  const C = [0, 0.04];
  function resample(poly, n) { const L = [0]; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; L.push(L[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); } const T = L[poly.length], out = []; let j = 0; for (let k = 0; k < n; k++) { const s = k / n * T; while (L[j + 1] < s) j++; const a = poly[j], b = poly[(j + 1) % poly.length], p = (s - L[j]) / (L[j + 1] - L[j] || 1); out.push([a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p]); } return out; }
  function hull(P) { const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = []; for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); } for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); } return lo.slice(0, -1).concat(up.slice(0, -1)); }
  function ray(poly, th) { const dx = Math.cos(th), dy = Math.sin(th); let best = null; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue; const t = ((a[0] - C[0]) * ey - (a[1] - C[1]) * ex) / den, u = ((a[0] - C[0]) * dy - (a[1] - C[1]) * dx) / den; if (t > 0 && u >= 0 && u <= 1 && (best == null || t > best)) best = t; } return best == null ? C.slice() : [C[0] + dx * best, C[1] + dy * best]; }
  const N = 160, OUT = resample(SH, N), r = PS.rng(9);
  const DOTS = OUT.map(p => [p[0] + (r() - 0.5) * 0.05, p[1] + (r() - 0.5) * 0.05]);
  const HULL = hull(DOTS), WRAP = OUT.map(p => ray(HULL, Math.atan2(p[1] - C[1], p[0] - C[0])));
  const SMOOTH = DOTS.map((_, i) => { let x = 0, y = 0; for (let k = -4; k <= 4; k++) { const q = DOTS[(i + k + N) % N]; x += q[0]; y += q[1]; } return [x / 9, y / 9]; });
  return { SH, N, OUT, DOTS, HULL, WRAP, SMOOTH, resample };
})();
// A 2D toy of NKSR's core step: an inside/outside function written as a sum of small bumps (kernels) centred on
// sparse cells near the dots; the bump weights come from ONE linear system (least squares, solved by conjugate
// gradients) asking f = 0 on the dots and f = +-eps a small step along/against each dot's arrow.
window.KT = (function () {
  const wend = (r, R) => { const q = r / R; if (q >= 1) return 0; const a = 1 - q; return a * a * a * a * (4 * q + 1); };
  function solve(D, opt) {
    const h = opt.h || 0.075, R = (opt.R || 2.6) * h, h1 = opt.h1 || 0.26, R1 = 2.4 * h1, eps = opt.eps || 0.035, lam = opt.lam || 1e-5, B = opt.box || 0.78, N = opt.N || 140;
    const cells = new Map(); D.forEach(d => { const i0 = Math.floor(d.p[0] / h), j0 = Math.floor(d.p[1] / h); const dl = opt.dil == null ? 1 : opt.dil; for (let a = -dl; a <= dl; a++) for (let b = -dl; b <= dl; b++) cells.set((i0 + a) + ',' + (j0 + b), [(i0 + a + 0.5) * h, (j0 + b + 0.5) * h, R]); });
    const C = [...cells.values()], nFine = C.length;
    if (opt.coarse) for (let y = -B; y <= B + 1e-9; y += h1) for (let x = -B; x <= B + 1e-9; x += h1) C.push([x, y, R1]);
    const M = C.length, near = (x, y) => { const out = []; for (let j = 0; j < M; j++) { const w = wend(Math.hypot(x - C[j][0], y - C[j][1]), C[j][2]); if (w > 0) out.push([j, w]); } return out; };
    const rows = [], b = [], wt = [];
    D.forEach(d => { [[0, 0], [1, eps], [-1, -eps]].forEach(([s, v]) => { rows.push(near(d.p[0] + s * eps * d.n[0], d.p[1] + s * eps * d.n[1])); b.push(v); wt.push(1); }); });
    if (opt.coarse) for (let k = 0; k < 40; k++) { const a = k / 40 * 2 * Math.PI, x = 0.97 * B * Math.cos(a), y = 0.97 * B * Math.sin(a); rows.push(near(x, y)); b.push(0.08); wt.push(0.05); }
    const G = new Float64Array(M * M), g = new Float64Array(M);
    rows.forEach((r, i) => { const w2 = wt[i]; for (const [j, w] of r) { g[j] += w2 * w * b[i]; for (const [k, u] of r) G[j * M + k] += w2 * w * u; } });
    for (let j = 0; j < M; j++) G[j * M + j] += lam;
    const x = new Float64Array(M), r0 = Float64Array.from(g), Dg = new Float64Array(M), z = new Float64Array(M), p = new Float64Array(M), Ap = new Float64Array(M);
    for (let j = 0; j < M; j++) { Dg[j] = 1 / G[j * M + j]; z[j] = r0[j] * Dg[j]; p[j] = z[j]; }
    let rz = 0; for (let j = 0; j < M; j++) rz += r0[j] * z[j];
    let it = 0; const g2 = g.reduce((s, v) => s + v * v, 0);
    for (; it < (opt.maxit || 3 * M); it++) { for (let j = 0; j < M; j++) { let s = 0; const o = j * M; for (let k = 0; k < M; k++) s += G[o + k] * p[k]; Ap[j] = s; } let pAp = 0; for (let j = 0; j < M; j++) pAp += p[j] * Ap[j]; const al = rz / pAp; let rn = 0; for (let j = 0; j < M; j++) { x[j] += al * p[j]; r0[j] -= al * Ap[j]; rn += r0[j] * r0[j]; } if (rn < 1e-20 * g2) { it++; break; } let rz2 = 0; for (let j = 0; j < M; j++) { z[j] = r0[j] * Dg[j]; rz2 += r0[j] * z[j]; } const be = rz2 / rz; rz = rz2; for (let j = 0; j < M; j++) p[j] = z[j] + be * p[j]; }
    const F = new Float32Array(N * N), dmin = new Float32Array(N * N), xs = i => -B + 2 * B * i / (N - 1);
    for (let jy = 0; jy < N; jy++) for (let ix = 0; ix < N; ix++) { const X = xs(ix), Y = xs(jy); let f = 0; for (let j = 0; j < M; j++) { const dx = X - C[j][0], dy = Y - C[j][1]; if (Math.abs(dx) > C[j][2] || Math.abs(dy) > C[j][2]) continue; const w = wend(Math.hypot(dx, dy), C[j][2]); if (w) f += x[j] * w; } F[jy * N + ix] = f; let dm = 9; for (const d of D) { const q = Math.hypot(X - d.p[0], Y - d.p[1]); if (q < dm) dm = q; } dmin[jy * N + ix] = dm; }
    const segs = [];
    for (let jy = 0; jy < N - 1; jy++) for (let ix = 0; ix < N - 1; ix++) {
      const v = [F[jy * N + ix], F[jy * N + ix + 1], F[(jy + 1) * N + ix + 1], F[(jy + 1) * N + ix]], P = [[xs(ix), xs(jy)], [xs(ix + 1), xs(jy)], [xs(ix + 1), xs(jy + 1)], [xs(ix), xs(jy + 1)]], cut = [];
      for (let e = 0; e < 4; e++) { const a = v[e], c = v[(e + 1) % 4]; if ((a < 0) !== (c < 0)) { const t = a / (a - c), A = P[e], Cc = P[(e + 1) % 4]; cut.push([A[0] + (Cc[0] - A[0]) * t, A[1] + (Cc[1] - A[1]) * t]); } }
      if (cut.length >= 2) { const dm = dmin[jy * N + ix]; segs.push([cut[0], cut[1], dm]); if (cut.length === 4) segs.push([cut[2], cut[3], dm]); }
    }
    return { C, nFine, alpha: x, F, dmin, N, B, R, eps, segs, M, iters: it };
  }
  // the field drawn as a picture (outside: main colour, inside: accent), with optional masking far from the dots
  function image(S, c, mask) {
    try {
      const cv = document.createElement('canvas'); cv.width = S.N; cv.height = S.N; const g = cv.getContext('2d'), im = g.createImageData(S.N, S.N), A = PS.hex(c.a), Mn = PS.hex(c.m), G = PS.hex(c.g);
      for (let k = 0; k < S.N * S.N; k++) { const f = S.F[k], t = Math.min(1, Math.abs(f) / (2 * S.eps)), col = f > 0 ? Mn : A, m = mask ? Math.max(0, Math.min(1, (mask - S.dmin[k]) / (0.35 * mask))) : 1, o = 4 * k; for (let ch = 0; ch < 3; ch++) im.data[o + ch] = col[ch]; im.data[o + 3] = Math.round(255 * (0.18 + 0.6 * t) * m); }
      g.putImageData(im, 0, 0); return cv;
    } catch (e) { return null; }
  }
  return { solve, image, wend };
})();
