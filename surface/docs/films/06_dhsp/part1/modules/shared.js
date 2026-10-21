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
// coordinates turned into the person frame (x = left, y = up, z = front), 12 bits each, 2 characters per number.
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
      ctx.globalAlpha = fa; ctx.fillStyle = fr[Math.round(sh[k] * 24)]; ctx.fill();
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
  return { verts, faces, stage, dots, load, at, draw, pts };
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
// DHSP additions: the final mesh with its flattening (UV) coordinates, coloured dots, and drawing that blends a mesh
// between its 3D shape (p = 0) and its flat UV square (p = 1).
window.DH = (function () {
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', IX = {};
  for (let i = 0; i < 64; i++) IX[AL[i]] = i;
  const n12 = (s, i, lo, hi) => lo + (IX[s[i]] * 64 + IX[s[i + 1]]) / 4095 * (hi - lo);
  const FR = [-0.669, 0.744];
  function uvmesh(o) {
    const S = MESH.stage({ f: o.f, v: o.v }), nt = o.t.length / 4, T = new Float32Array(2 * nt);
    for (let i = 0; i < nt; i++) { T[2 * i] = n12(o.t, 4 * i, 0, 1); T[2 * i + 1] = n12(o.t, 4 * i + 2, 0, 1); }
    S.T = T; S.G = MESH.faces(o.g); MESH.at(S, 0);
    const VT = new Int32Array(S.nv).fill(-1); for (let k = 0; k < 3 * S.nf; k++) if (VT[S.F[k]] < 0) VT[S.F[k]] = S.G[k];
    S.VT = VT; return S;
  }
  function cdots(o) {
    const s = o.d, n = s.length / 12, P = new Float32Array(3 * n), C = [];
    for (let i = 0; i < n; i++) { for (let d = 0; d < 3; d++) P[3 * i + d] = n12(s, 12 * i + 2 * d, -0.6, 0.6); const r = n12(s, 12 * i + 6, 0, 1), g = n12(s, 12 * i + 8, 0, 1), b = n12(s, 12 * i + 10, 0, 1); C.push('rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')'); }
    return { n, P, C };
  }
  // every dot gets the UV spot of its nearest mesh corner (as DHSP's project step does with dense surface samples)
  function dotUV(S, D) {
    const out = new Float32Array(2 * D.n), P = S.P;
    for (let i = 0; i < D.n; i++) { const x = D.P[3 * i], y = D.P[3 * i + 1], z = D.P[3 * i + 2]; let best = 0, bd = 1e9; for (let v = 0; v < S.nv; v++) { const dx = P[3 * v] - x, dy = P[3 * v + 1] - y, dz = P[3 * v + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = v; } } const t = S.VT[best]; out[2 * i] = S.T[2 * t]; out[2 * i + 1] = S.T[2 * t + 1]; }
    return out;
  }
  // per-face colour from a texture image (sampled at the face's UV centre), or from its 3D position (geometry image)
  function texColors(S, img) {
    try { const N = 256, cv = document.createElement('canvas'); cv.width = N; cv.height = N; const g = cv.getContext('2d'); g.drawImage(img, 0, 0, N, N); const px = g.getImageData(0, 0, N, N).data, out = [];
      for (let k = 0; k < S.nf; k++) { let u = 0, v = 0; for (let j = 0; j < 3; j++) { const t = S.G[3 * k + j]; u += S.T[2 * t] / 3; v += S.T[2 * t + 1] / 3; } const x = Math.min(N - 1, Math.max(0, Math.floor(u * N))), y = Math.min(N - 1, Math.max(0, Math.floor((1 - v) * N))), q = 4 * (y * N + x); out.push([px[q], px[q + 1], px[q + 2]]); }
      return out; } catch (e) { return null; }
  }
  const xyzRGB = (x, y, z) => [Math.round(255 * Math.min(1, Math.max(0, (x + 0.2) / 0.4))), Math.round(255 * Math.min(1, Math.max(0, y + 0.5))), Math.round(255 * Math.min(1, Math.max(0, (z + 0.2) / 0.4)))];
  function geoColors(S) { const out = []; for (let k = 0; k < S.nf; k++) { let x = 0, y = 0, z = 0; for (let j = 0; j < 3; j++) { const v = S.F[3 * k + j]; x += S.P[3 * v] / 3; y += S.P[3 * v + 1] / 3; z += S.P[3 * v + 2] / 3; } out.push(xyzRGB(x, y, z)); } return out; }
  function dotGeo(D) { const out = []; for (let i = 0; i < D.n; i++) { const c = xyzRGB(D.P[3 * i], D.P[3 * i + 1], D.P[3 * i + 2]); out.push('rgb(' + c.join(',') + ')'); } return out; }
  // draw the mesh blended between 3D (p = 0) and the flat UV square sq = [x0, y0, size] (p = 1)
  function unfold(ctx, S, o, p) {
    const th = o.yaw || 0, ph = o.pitch == null ? 0.1 : o.pitch, ct = Math.cos(th), st = Math.sin(th), fx = FR[0], fz = FR[1];
    const R0 = fz * ct + fx * st, R1 = -fx * ct + fz * st, F0 = fx * ct - fz * st, F1 = fz * ct + fx * st, cp = Math.cos(ph), sp = Math.sin(ph), s = o.s, P = S.P;
    const X = S.uX || (S.uX = new Float32Array(S.nv)), Y = S.uY || (S.uY = new Float32Array(S.nv)), D = S.uD || (S.uD = new Float32Array(S.nv)), U = S.uU || (S.uU = new Float32Array(S.nv)), V = S.uV || (S.uV = new Float32Array(S.nv));
    for (let i = 0; i < S.nv; i++) { const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2], sx = x * R0 + z * R1, d = x * F0 + z * F1, v = y * cp - d * sp; U[i] = sx; V[i] = v; D[i] = d * cp + y * sp; X[i] = o.cx + sx * s; Y[i] = o.cy - v * s; }
    const nf = S.nf, idx = S.uIdx || (S.uIdx = Array.from({ length: nf }, (_, i) => i)), dep = S.uDep || (S.uDep = new Float32Array(nf)), sh = S.uSh || (S.uSh = new Float32Array(nf));
    for (let k = 0; k < nf; k++) {
      const a = S.F[3 * k], b = S.F[3 * k + 1], e = S.F[3 * k + 2]; dep[k] = (D[a] + D[b] + D[e]) * (1 - p);
      const ux = U[b] - U[a], uy = V[b] - V[a], uz = D[b] - D[a], vx = U[e] - U[a], vy = V[e] - V[a], vz = D[e] - D[a], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, L = Math.hypot(nx, ny, nz) || 1;
      sh[k] = Math.abs(nx * -0.35 + ny * 0.5 + nz * 0.79) / L;
    }
    if (p < 0.999) idx.sort((q, r) => dep[q] - dep[r]);
    const sq = o.sq, c = o.c, fa = o.fill == null ? 1 : o.fill, ea = o.edge == null ? 0.4 : o.edge, cols = o.colors;
    ctx.lineJoin = 'round'; ctx.lineWidth = o.lw || 0.7; ctx.strokeStyle = o.stroke || c.m;
    for (let j = 0; j < nf; j++) {
      const k = idx[j]; ctx.beginPath();
      for (let m = 0; m < 3; m++) { const v = S.F[3 * k + m], t = S.G[3 * k + m], qx = sq[0] + S.T[2 * t] * sq[2], qy = sq[1] + (1 - S.T[2 * t + 1]) * sq[2], x = X[v] + (qx - X[v]) * p, y = Y[v] + (qy - Y[v]) * p; m ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath();
      const lit = 0.55 + 0.45 * (sh[k] * (1 - p) + 0.75 * p);
      if (cols) { const cc = cols[k]; ctx.fillStyle = 'rgb(' + Math.round(cc[0] * lit) + ',' + Math.round(cc[1] * lit) + ',' + Math.round(cc[2] * lit) + ')'; }
      else ctx.fillStyle = PS.mix(c.g, c.m, 0.08 + 0.4 * (sh[k] * (1 - p) + 0.6 * p));
      ctx.globalAlpha = fa; ctx.fill(); if (ea > 0) { ctx.globalAlpha = fa * ea; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
  return { uvmesh, cdots, dotUV, texColors, geoColors, dotGeo, unfold };
})();
