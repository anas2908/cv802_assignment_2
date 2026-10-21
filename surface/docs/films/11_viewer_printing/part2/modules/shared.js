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
// Real mesh data from our VGGSfM scan, stored in json modules vw-*.json: coordinates turned into the person frame
// (x = left, y = up, z = front), 12 bits each, 2 characters per number; faces 3 characters per corner index.
window.MESH = (function () {
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', IX = {};
  for (let i = 0; i < 64; i++) IX[AL[i]] = i;
  const n12 = (s, i, lo, hi) => lo + (IX[s[i]] * 64 + IX[s[i + 1]]) / 4095 * (hi - lo);
  function verts(s) { const n = s.length / 2, P = new Float32Array(n); for (let i = 0; i < n; i++) P[i] = n12(s, 2 * i, -0.6, 0.6); return P; }
  function faces(s) { const n = s.length / 3, F = new Int32Array(n); for (let i = 0; i < n; i++) F[i] = IX[s[3 * i]] * 4096 + IX[s[3 * i + 1]] * 64 + IX[s[3 * i + 2]]; return F; }
  function stage(o) { const F = faces(o.f), V = o.v.map(verts); return { F, V, nf: F.length / 3, nv: V[0].length / 3, P: new Float32Array(V[0].length) }; }
  function dots(o) { const s = o.d, n = s.length / 12, P = new Float32Array(3 * n), N = new Float32Array(3 * n); for (let i = 0; i < n; i++) for (let d = 0; d < 3; d++) { P[3 * i + d] = n12(s, 12 * i + 2 * d, -0.6, 0.6); N[3 * i + d] = n12(s, 12 * i + 6 + 2 * d, -1, 1); } return { n, P, N }; }
  const cache = {};
  function load(kit, name) { if (cache[name]) return cache[name]; const j = kit.json(name); return (cache[name] = j); }
  // positions at keyframe position k (fractional k blends neighbouring snapshots)
  function at(S, k) { const a = Math.max(0, Math.min(S.V.length - 1, Math.floor(k))), b = Math.min(S.V.length - 1, a + 1), p = Math.max(0, Math.min(1, k - a)), A = S.V[a], B = S.V[b]; for (let i = 0; i < S.P.length; i++) S.P[i] = A[i] + (B[i] - A[i]) * p; return S; }
  const FR = [-0.669, 0.744];
  function basis(o) {
    const th = o.yaw || 0, ph = o.pitch == null ? 0.1 : o.pitch, ct = Math.cos(th), st = Math.sin(th), fx = FR[0], fz = FR[1];
    return { R0: fz * ct + fx * st, R1: -fx * ct + fz * st, F0: fx * ct - fz * st, F1: fz * ct + fx * st, cp: Math.cos(ph), sp: Math.sin(ph), s: o.s || 700, cx: o.cx || 960, cy: o.cy || 540 };
  }
  const ramps = {};
  function ramp(a, b, k0, k1) { const key = a + b + k0 + k1; if (ramps[key]) return ramps[key]; const r = []; for (let i = 0; i <= 24; i++) r.push(PS.mix(a, b, k0 + (k1 - k0) * i / 24)); return (ramps[key] = r); }
  const LX = -0.35, LY = 0.5, LZ = 0.79;
  function draw(ctx, S, o) {
    const B = basis(o), P = S.P, F = S.F, nv = S.nv, c = o.c;
    const X = S.X || (S.X = new Float32Array(nv)), Y = S.Y || (S.Y = new Float32Array(nv)), U = S.U || (S.U = new Float32Array(nv)), Vv = S.Vv || (S.Vv = new Float32Array(nv)), D = S.D || (S.D = new Float32Array(nv));
    for (let i = 0; i < nv; i++) { const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2], sx = x * B.R0 + z * B.R1, d = x * B.F0 + z * B.F1, v = y * B.cp - d * B.sp; U[i] = sx; Vv[i] = v; D[i] = d * B.cp + y * B.sp; X[i] = B.cx + sx * B.s; Y[i] = B.cy - v * B.s; }
    const nf = S.nf, dep = S.dep || (S.dep = new Float32Array(nf)), sh = S.sh || (S.sh = new Float32Array(nf)), idx = S.idx || (S.idx = Array.from({ length: nf }, (_, i) => i));
    for (let k = 0; k < nf; k++) {
      const a = F[3 * k], b = F[3 * k + 1], e = F[3 * k + 2]; dep[k] = D[a] + D[b] + D[e];
      const ux = U[b] - U[a], uy = Vv[b] - Vv[a], uz = D[b] - D[a], vx = U[e] - U[a], vy = Vv[e] - Vv[a], vz = D[e] - D[a];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, L = Math.hypot(nx, ny, nz) || 1;
      sh[k] = Math.abs(nx * LX + ny * LY + nz * LZ) / L;
    }
    idx.sort((p, q) => dep[p] - dep[q]);
    const base = o.tint || c.m, fr = ramp(c.g, base, 0.08, 0.5), lw = o.lw == null ? 0.8 : o.lw, ea = o.edge == null ? 0.45 : o.edge, fa = o.fill == null ? 1 : o.fill;
    ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = base;
    for (let j = 0; j < nf; j++) {
      const k = idx[j], a = F[3 * k], b = F[3 * k + 1], e = F[3 * k + 2];
      ctx.beginPath(); ctx.moveTo(X[a], Y[a]); ctx.lineTo(X[b], Y[b]); ctx.lineTo(X[e], Y[e]); ctx.closePath();
      ctx.globalAlpha = fa; if (o.colors && o.colors[k]) { const cc = o.colors[k], lit = 0.5 + 0.5 * sh[k]; ctx.fillStyle = 'rgb(' + Math.round(cc[0] * lit) + ',' + Math.round(cc[1] * lit) + ',' + Math.round(cc[2] * lit) + ')'; } else ctx.fillStyle = fr[Math.round(sh[k] * 24)]; ctx.fill();
      if (ea > 0) { ctx.globalAlpha = fa * ea; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
  function pts(ctx, Q, o, r, color, alpha, tick, every, tcolor) {
    const B = basis(o), pr = (x, y, z) => { const sx = x * B.R0 + z * B.R1, d = x * B.F0 + z * B.F1; return [B.cx + sx * B.s, B.cy - (y * B.cp - d * B.sp) * B.s, d * B.cp + y * B.sp]; };
    for (let i = 0; i < Q.n; i++) {
      const al = typeof alpha === 'function' ? alpha(i) : (alpha == null ? 1 : alpha); if (al <= 0) continue;
      const x = Q.P[3 * i], y = Q.P[3 * i + 1], z = Q.P[3 * i + 2], p = pr(x, y, z), front = 0.45 + 0.55 * Math.max(0, Math.min(1, (p[2] + 0.2) / 0.4));
      ctx.globalAlpha = Math.min(1, al) * front; ctx.fillStyle = color; ctx.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r);
      if (tick && i % (every || 12) === 0) { const q = pr(x + Q.N[3 * i] * tick, y + Q.N[3 * i + 1] * tick, z + Q.N[3 * i + 2] * tick); ctx.strokeStyle = tcolor || color; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
  return { verts, faces, stage, dots, load, at, draw, pts, basis };
})();
// A 2D toy used by several scenes: a shirt outline (unit size, y down), its convex hull, and noisy dots along it.
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
// Viewer and printing helpers: a real mesh with one photo colour per face (sampled from its texture), its edges,
// outward normals for the input dots, horizontal slices, and turning the mesh back into the scan's own axes.
window.VW = (function () {
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', IX = {};
  for (let i = 0; i < 64; i++) IX[AL[i]] = i;
  function mesh(kit, name) {
    const o = MESH.load(kit, name), S = MESH.stage(o); MESH.at(S, 0);
    if (o.c) { S.C = []; for (let k = 0; k < S.nf; k++) S.C.push([0, 1, 2].map(j => Math.round(IX[o.c[3 * k + j]] / 63 * 255))); }
    return S;
  }
  // every edge with the number of triangles that share it: 1 = border of a hole, 2 = closed, 3 or more = a fin
  function edges(S) {
    const E = new Map(), F = S.F;
    for (let k = 0; k < S.nf; k++) for (let m = 0; m < 3; m++) { const u = F[3 * k + m], v = F[3 * k + (m + 1) % 3], key = u < v ? u * 65536 + v : v * 65536 + u; E.set(key, (E.get(key) || 0) + 1); }
    const bnd = [], fin = []; let ok = 0;
    E.forEach((n, key) => { const e = [Math.floor(key / 65536), key % 65536]; if (n === 1) bnd.push(e); else if (n === 2) ok++; else fin.push(e); });
    return { bnd, fin, ok, total: E.size };
  }
  // project a 3D point of the person frame like MESH.draw does: [x, y, depth] (bigger depth = nearer)
  function proj(o) { const B = MESH.basis(o); return (x, y, z) => { const sx = x * B.R0 + z * B.R1, d = x * B.F0 + z * B.F1; return [B.cx + sx * B.s, B.cy - (y * B.cp - d * B.sp) * B.s, d * B.cp + y * B.sp]; }; }
  function lines(ctx, S, list, o, color, w, alpha) {
    const pr = proj(o), P = S.P; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.beginPath();
    list.forEach(([u, v]) => { const a = pr(P[3 * u], P[3 * u + 1], P[3 * u + 2]), b = pr(P[3 * v], P[3 * v + 1], P[3 * v + 2]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); });
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  // outward corner normals of a closed mesh, then for each dot the normal of its nearest corner
  function dotNormals(S, D) {
    const P = S.P, F = S.F, N = new Float32Array(3 * S.nv); let vol = 0;
    for (let k = 0; k < S.nf; k++) {
      const a = 3 * F[3 * k], b = 3 * F[3 * k + 1], c = 3 * F[3 * k + 2], ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; vol += P[a] * nx + P[a + 1] * ny + P[a + 2] * nz;
      for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
    }
    const sg = vol < 0 ? -1 : 1, out = new Float32Array(3 * D.n);
    for (let i = 0; i < D.n; i++) {
      const x = D.P[3 * i], y = D.P[3 * i + 1], z = D.P[3 * i + 2]; let best = 0, bd = 1e9;
      for (let v = 0; v < S.nv; v++) { const dx = P[3 * v] - x, dy = P[3 * v + 1] - y, dz = P[3 * v + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = v; } }
      const L = Math.hypot(N[3 * best], N[3 * best + 1], N[3 * best + 2]) || 1; for (let d = 0; d < 3; d++) out[3 * i + d] = sg * N[3 * best + d] / L;
    }
    return out;
  }
  // dots on the side facing the camera of view o, as a function i -> 0 or 1 for MESH.pts
  function facing(o, NN, a) { const B = MESH.basis(o); return i => (NN[3 * i] * B.F0 * B.cp + NN[3 * i + 2] * B.F1 * B.cp + NN[3 * i + 1] * B.sp > 0.05 ? a : 0); }
  // the mesh cut by the horizontal plane y = h: segments [x1, z1, x2, z2]
  function slice(S, h) {
    const P = S.P, F = S.F, out = [];
    for (let k = 0; k < S.nf; k++) {
      const q = []; for (let m = 0; m < 3; m++) { const a = F[3 * k + m], b = F[3 * k + (m + 1) % 3], ya = P[3 * a + 1] - h, yb = P[3 * b + 1] - h; if ((ya < 0) !== (yb < 0)) { const s = ya / (ya - yb); q.push(P[3 * a] + (P[3 * b] - P[3 * a]) * s, P[3 * a + 2] + (P[3 * b + 2] - P[3 * a + 2]) * s); } }
      if (q.length === 4) out.push(q);
    }
    return out;
  }
  // rotation taking the person frame back into the scan's own axes (the VGGSfM frame), as axis and angle
  const R = [[0.9635, 0.0385, -0.2651], [-0.0047, -0.9870, -0.1607], [-0.2678, 0.1561, -0.9507]];
  const RT = [0, 1, 2].map(i => [0, 1, 2].map(j => R[j][i])), ang = Math.acos(Math.max(-1, Math.min(1, (RT[0][0] + RT[1][1] + RT[2][2] - 1) / 2)));
  const ax = (() => { const v = [RT[2][1] - RT[1][2], RT[0][2] - RT[2][0], RT[1][0] - RT[0][1]], L = Math.hypot(v[0], v[1], v[2]) || 1; return v.map(x => x / L); })();
  // the rotation by p of the way from the person frame into the scan's axes, as a 3x3 matrix
  function rot(p) { const th = ang * p, c = Math.cos(th), s = Math.sin(th), [x, y, z] = ax, C = 1 - c; return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]]; }
  // S.P = that rotation applied to the mesh's own shape S.V[0]
  function toScan(S, p) {
    const M = rot(p), V = S.V[0], P = S.P;
    for (let i = 0; i < S.nv; i++) { const a = V[3 * i], b = V[3 * i + 1], d = V[3 * i + 2]; for (let r = 0; r < 3; r++) P[3 * i + r] = M[r][0] * a + M[r][1] * b + M[r][2] * d; }
    return S;
  }
  // outward unit normal of every corner (face normals summed), for the shape in S.V[0]
  function vnorm(S) {
    const P = S.V[0], F = S.F, N = new Float32Array(3 * S.nv); let vol = 0;
    for (let k = 0; k < S.nf; k++) { const a = 3 * F[3 * k], b = 3 * F[3 * k + 1], c = 3 * F[3 * k + 2], ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; vol += P[a] * nx + P[a + 1] * ny + P[a + 2] * nz; for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; } }
    const sg = vol < 0 ? -1 : 1; for (let i = 0; i < S.nv; i++) { const L = Math.hypot(N[3 * i], N[3 * i + 1], N[3 * i + 2]) || 1; for (let d = 0; d < 3; d++) N[3 * i + d] *= sg / L; }
    return N;
  }
  return { mesh, edges, proj, lines, dotNormals, facing, slice, rot, toScan, vnorm };
})();
