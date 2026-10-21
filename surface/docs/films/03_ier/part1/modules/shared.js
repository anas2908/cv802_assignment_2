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
  function jgrid(x0, y0, step, cols, rows, jit, seed) { const r = rng(seed), P = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) P.push([x0 + i * step + (r() - 0.5) * 2 * jit, y0 + j * step + (r() - 0.5) * 2 * jit]); return P; }
  function gtris(cols, rows) { const T = []; for (let j = 0; j + 1 < rows; j++) for (let i = 0; i + 1 < cols; i++) { const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1; if ((i + j) % 2) { T.push([a, b, d]); T.push([a, d, c]); } else { T.push([a, b, c]); T.push([b, d, c]); } } return T; }
  return { TAU, seg, eo, rng, col, mix, arrow, dot, caps, poly, jgrid, gtris };
})();
// The side view used across the IER films: a chest line and an arm crossed in front of it, with a small gap.
window.IW = (function () {
  const chestY = x => 690 + 25 * Math.sin((x - 200) / 300);
  const CH = []; for (let x = 200; x <= 1720; x += 80) CH.push([x, chestY(x)]);
  const AC = [1000, 530], AR = 115, AN = 18;
  const ARM = []; for (let i = 0; i < AN; i++) { const a = Math.PI / 2 + i / AN * Math.PI * 2; ARM.push([AC[0] + AR * Math.cos(a), AC[1] + AR * Math.sin(a)]); }
  const len = P => { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; };
  function dots(ctx, c, a) { [...CH, ...ARM].forEach((p, i) => { const v = typeof a === 'function' ? a(i) : a; if (v <= 0) return; ctx.globalAlpha = Math.min(1, v); PS.dot(ctx, p[0], p[1], 10, c.s); }); ctx.globalAlpha = 1; }
  function links(ctx, c, p, alpha) {
    if (p <= 0) return; ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = c.m; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    PS.poly(ctx, CH, p);
    const ring = ARM.concat([ARM[0]]); PS.poly(ctx, ring, p); ctx.globalAlpha = 1;
  }
  return { chestY, CH, AC, AR, ARM, len, dots, links };
})();