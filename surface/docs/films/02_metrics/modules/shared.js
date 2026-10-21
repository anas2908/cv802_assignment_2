window.PS = (function () {
  const TAU = Math.PI * 2;
  const C = { cx: 1250, cy: 555, R: 262 };
  const cl = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rad = th => C.R * (1 + 0.17 * Math.cos(2 * th) + 0.07 * Math.sin(3 * th + 0.6));
  const at = (th, s) => { const r = rad(th) * (s || 1); return [C.cx + r * Math.cos(th), C.cy + r * Math.sin(th)]; };
  const nrm = th => { const a = at(th - 1e-3), b = at(th + 1e-3); const tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty); return [ty / L, -tx / L]; };
  function dots(n, seed, jit, skip) {
    const r = rng(seed), out = [];
    for (let i = 0; i < n; i++) {
      const th = (i + 0.5 * r()) / n * TAU;
      const j = 1 + (r() - 0.5) * 2 * (jit || 0);
      if (skip && skip(th)) continue;
      const p = at(th, j), q = nrm(th);
      out.push({ x: p[0], y: p[1], th, nx: q[0], ny: q[1], r: r() });
    }
    return out;
  }
  function inside(x, y) { const th = Math.atan2(y - C.cy, x - C.cx); return Math.hypot(x - C.cx, y - C.cy) < rad(th); }
  function chi(x, y, soft) { const th = Math.atan2(y - C.cy, x - C.cx); const d = rad(th) - Math.hypot(x - C.cx, y - C.cy); return 1 / (1 + Math.exp(-d / soft)); }
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
  function dot(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function outline(ctx, color, w, from, to, s) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); const a = from || 0, b = to == null ? TAU : to; const n = Math.max(2, Math.ceil((b - a) / TAU * 260)); for (let i = 0; i <= n; i++) { const p = at(a + (b - a) * i / n, s); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); }
  function caps(els, times, t) { els.forEach((el, i) => { const a = times[i], b = times[i + 1]; let o = eo(seg(t, a, a + 0.45)); if (b != null) o *= 1 - seg(t, b - 0.3, b); el.style.opacity = o; el.style.transform = 'translateY(' + (1 - eo(seg(t, a, a + 0.45))) * 18 + 'px)'; }); }
  const PARTS = [
    { c: [0, 1.6, 0], r: [0.095, 0.12, 0.105], k: 'skin', w: 1 },
    { c: [0, 1.15, 0], r: [0.21, 0.31, 0.13], k: 'shirt', w: 5 },
    { c: [-0.255, 1.22, 0.0], r: [0.065, 0.17, 0.07], k: 'shirt', w: 1.2 },
    { c: [0.255, 1.22, 0.0], r: [0.065, 0.17, 0.07], k: 'shirt', w: 1.2 },
    { c: [0, 1.12, 0.15], r: [0.25, 0.06, 0.065], k: 'skin', w: 1.3 },
    { c: [-0.1, 0.45, 0], r: [0.085, 0.43, 0.09], k: 'legs', w: 3 },
    { c: [0.1, 0.45, 0], r: [0.085, 0.43, 0.09], k: 'legs', w: 3 }];
  function cloud(n, seed) {
    const r = rng(seed), out = [], tot = PARTS.reduce((s, p) => s + p.w, 0);
    PARTS.forEach(p => { const m = Math.round(n * p.w / tot); for (let i = 0; i < m; i++) { const u = r() * 2 - 1, ph = r() * TAU, s = Math.sqrt(1 - u * u); const e = 1 + (r() - 0.5) * 0.06; out.push({ x: p.c[0] + p.r[0] * s * Math.cos(ph) * e, y: p.c[1] + p.r[1] * u * e, z: p.c[2] + p.r[2] * s * Math.sin(ph) * e, k: p.k }); } });
    return out;
  }
  function project(p, yaw, sc, ox, oy) { const c = Math.cos(yaw), s = Math.sin(yaw); const x = p.x * c - p.z * s, z = p.x * s + p.z * c; return [ox + x * sc, oy - (p.y - 0.88) * sc, z]; }
  return { TAU, C, seg, eo, eio, rng, rad, at, nrm, dots, inside, chi, col, mix, arrow, dot, outline, caps, cloud, project };
})();
// Straight-line toy for the metrics lessons: 13 dots, a mesh line with a hole (700-960) and a tail with no dots (1460-1760).
window.TOY = (function () {
  const J = [-9, 7, -4, 11, -7, 5, -11, 8, -3, 9, -8, 4, -6];
  const D = J.map((j, k) => [260 + k * 100, 430 + j]);
  const MY = 452, SEGS = [[260, 700], [960, 1760]], TAU = 40, MM = 10;
  const S = []; for (let x = 260; x <= 1760; x += 100) if (SEGS.some(s => x >= s[0] && x <= s[1])) S.push([x, MY]);
  const near = (p, L) => { let b = null, bd = 1e9; L.forEach(q => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; b = q; } }); return [b, bd]; };
  const onMesh = p => { let b = null, bd = 1e9; SEGS.forEach(s => { const x = Math.max(s[0], Math.min(s[1], p[0])); const d = Math.hypot(x - p[0], MY - p[1]); if (d < bd) { bd = d; b = [x, MY]; } }); return [b, bd]; };
  const ACC = S.map(p => { const r = near(p, D); return { p, q: r[0], d: r[1] }; });
  const COM = D.map(p => { const r = onMesh(p); return { p, q: r[0], d: r[1] }; });
  const mean = L => L.reduce((s, l) => s + l.d, 0) / L.length / MM;
  const nP = ACC.filter(l => l.d < TAU).length, nR = COM.filter(l => l.d < TAU).length;
  function dots(ctx, c, a, r) { D.forEach((q, i) => { const v = typeof a === 'function' ? a(i) : a; if (v <= 0) return; ctx.globalAlpha = Math.min(1, v); PS.dot(ctx, q[0], q[1], (r || 13) * Math.min(1, v * 1.4), c.s); }); ctx.globalAlpha = 1; }
  function mesh(ctx, c, prog, alpha) { const xe = 260 + 1500 * prog; ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = c.m; ctx.lineWidth = 9; ctx.lineCap = 'round'; SEGS.forEach(s => { if (xe <= s[0]) return; ctx.beginPath(); ctx.moveTo(s[0], MY); ctx.lineTo(Math.min(s[1], xe), MY); ctx.stroke(); }); ctx.globalAlpha = 1; }
  function samples(ctx, c, a) { S.forEach((p, i) => { const v = typeof a === 'function' ? a(i) : a; if (v <= 0) return; ctx.globalAlpha = Math.min(1, v); PS.dot(ctx, p[0], p[1], 8, c.a); }); ctx.globalAlpha = 1; }
  function lines(ctx, L, fn) { L.forEach((l, i) => { const st = fn(l, i); if (!st || st.p <= 0) return; ctx.globalAlpha = st.a == null ? 1 : st.a; ctx.strokeStyle = st.col; ctx.lineWidth = st.w || 4; ctx.lineCap = 'round'; if (st.dash) ctx.setLineDash([9, 8]); ctx.beginPath(); ctx.moveTo(l.p[0], l.p[1]); ctx.lineTo(l.p[0] + (l.q[0] - l.p[0]) * st.p, l.p[1] + (l.q[1] - l.p[1]) * st.p); ctx.stroke(); ctx.setLineDash([]); }); ctx.globalAlpha = 1; }
  function bracket(ctx, c, x0, x1, y, p) { if (p <= 0) return; const xm = (x0 + x1) / 2, h = (x1 - x0) / 2 * p; ctx.globalAlpha = p; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xm - h, y - 10); ctx.lineTo(xm - h, y); ctx.lineTo(xm + h, y); ctx.lineTo(xm + h, y - 10); ctx.stroke(); ctx.globalAlpha = 1; }
  function mark(ctx, c, x, y, ok, p) { if (p <= 0) return; ctx.globalAlpha = p; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = ok ? c.m : c.a; ctx.beginPath(); if (ok) { ctx.moveTo(x - 11, y); ctx.lineTo(x - 3, y + 9); ctx.lineTo(x + 12, y - 10); } else { ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9); } ctx.stroke(); ctx.globalAlpha = 1; }
  return { D, S, MY, SEGS, TAU, MM, ACC, COM, meanAcc: mean(ACC), meanCom: mean(COM), nP, nR, P: nP / ACC.length, R: nR / COM.length, dots, mesh, samples, lines, bracket, mark };
})();