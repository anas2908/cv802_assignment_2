const { seg, eo, eio, eob, lerp, TextFx } = kit;
const nAt = t => t < 8.0 ? 16 * seg(t, 1.6, 8.0) : (p => 16 + 1419 * (0.15 * p + 0.85 * eio(p)))(seg(t, 8.0, 24.0));
const fmt = n => n.toLocaleString('en-US');
function hx(a, b, p) { const A = PS.hex(a), B = PS.hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join(''); }
kit.scene('a-write', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · Our real result</span><h2 class="line">Watch it write</h2></div>' +
      '<div class="words a-write-panel" style="left:1300px;top:290px;width:560px;gap:6px">' +
      '<p class="note">triangles written</p><p class="eq num a-write-v" style="font-size:60px">0</p>' +
      '<p class="note" style="margin-top:14px">tokens written</p><p class="eq num a-write-v" style="font-size:60px">0</p>' +
      '<p class="note" style="margin-top:14px">strips (each new one after a &amp;)</p><p class="eq num a-write-v" style="font-size:60px">0</p>' +
      '<p class="note warm" style="margin-top:22px">greedy: always the top score</p></div>' +
      '<p class="eq num a-write-end" style="left:1300px;top:770px;font-size:64px;color:var(--accent)">END</p>' +
      '<p class="eq num a-write-amp" style="left:1000px;top:440px;font-size:64px;color:var(--accent)">&amp;</p>' +
      '<p class="cap">Here is our real MeshAnything result being written, in the exact order the model produced its triangles.</p>' +
      '<p class="cap">The first triangles arrive one by one. Each new one, in gold, reuses an edge of the one before it.</p>' +
      '<p class="cap">Strip after strip it sweeps across the body. When a strip runs out, it writes &amp; and starts a new one.</p>' +
      '<p class="cap">It never sees what it will write later: each choice comes from the shape tokens and what is already written.</p>' +
      '<p class="cap">Then it writes the END token and stops: 1,435 triangles in about 45 seconds on our GPU.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.panel = q('.a-write-panel')[0].style; this.v = q('.a-write-v');
    this.end = q('.a-write-end')[0].style; this.amp = q('.a-write-amp')[0].style;
    this.Q = MA.surf('v2', 8192, 11); this.M = MA.get('v2');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 3.9, 9.6, 17.0, 25.0], t);
    const pp = eo(seg(t, 0.8, 1.3)); this.panel.opacity = pp; this.panel.transform = 'translateX(' + (1 - pp) * 26 + 'px)';
    const n = nAt(t), M = this.M, w = Math.floor(n);
    const last = Math.max(0, Math.min(M.nf, w) - 1);
    this.v[0].textContent = fmt(Math.min(M.nf, w)); this.v[1].textContent = w ? fmt(M.tok[last]) : '0'; this.v[2].textContent = w ? fmt(M.strip[last] + 1) : '0';
    const e = seg(t, 24.4, 24.9); this.end.opacity = eo(e); this.end.transform = 'scale(' + lerp(0.7, 1, eob(e, 1.8)) + ')';
    const am = seg(t, 8.2, 8.6) * (1 - seg(t, 9.6, 10.0)); this.amp.opacity = eo(am);
    const ctx = this.k.fx, c = this.c;
    const yaw = t < 24 ? lerp(0.84, 0.55, eio(seg(t, 0, 24))) : lerp(0.55, -0.35, eio(seg(t, 24, 30)));
    const o = { c, cx: 760, cy: 556, s: 700, yaw, pitch: 0.12, edge: 0.6, lw: 1.1 };
    const ga = 0.55 * eo(seg(t, 0, 1.0)) * (1 - eo(seg(t, 14, 24)));
    if (ga > 0) MA.pts(ctx, this.Q, o, 1.1, c.s, ga);
    const slow = t < 8.2;
    o.n = n; o.hi = slow && w > 0 ? Math.min(M.nf - 1, w) : null;
    if (!slow) o.tint = k => k > n - 40 ? hx(c.m, c.a, Math.max(0, (k - (n - 40)) / 40)) : null;
    if (n > 0) MA.draw(ctx, 'v2', o);
  },
});