const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('dots', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 1</span><h2 class="line">The problem</h2></div>' +
      '<p class="note dots-n1" style="left:110px;top:400px">each dot = x, y, z + r, g, b</p>' +
      '<p class="note warm dots-n2" style="left:110px;top:470px">mesh = triangles glued edge to edge</p>' +
      '<p class="cap">Sub-project 1 gave us about 139,000 loose dots, each just a position and a colour.</p>' +
      '<p class="cap">Zoom in: nothing connects them. No surface, no inside, no outside.</p>' +
      '<p class="cap">Our goal: a connected skin of triangles (a mesh), saved as .obj.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.n1 = kit.stage.querySelector('.dots-n1').style;
    this.n2 = kit.stage.querySelector('.dots-n2').style;
    this.pts = PS.cloud(1900, 11);
    const r = PS.rng(5), V = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) V.push([1080 + i * 68 + (r() - 0.5) * 26 + (j % 2) * 34, 470 + j * 62 + (r() - 0.5) * 22]);
    const T = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) { const a = j * 6 + i, b = a + 1, c2 = a + 6, d = c2 + 1; T.push(j % 2 ? [a, d, c2] : [a, b, c2]); T.push(j % 2 ? [a, b, d] : [b, d, c2]); }
    T.sort((A, B) => (V[A[0]][0] + V[A[0]][1]) - (V[B[0]][0] + V[B[0]][1]));
    this.V = V; this.T = T;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 3.4, 6.6], t);
    const ctx = this.k.fx, c = this.c;
    const z = eio(seg(t, 1.8, 4.2));
    const sc = 430 * Math.exp(z * Math.log(3.4));
    const fy = lerp(0.88, 1.12, z);
    const ox = lerp(1350, 1250, z), oy = 560 + (fy - 0.88) * sc;
    const yaw = 2.87 + 0.12 * t;
    const P = this.pts.map(p => { const q = PS.project(p, yaw, sc, ox, oy); q.push(p.k); return q; }).sort((A, B) => A[2] - B[2]);
    const rr = lerp(2.5, 5.2, z);
    const fade = 1 - 0.55 * eo(seg(t, 6.6, 7.4));
    for (const q of P) {
      if (q[0] < -20 || q[0] > 1940 || q[1] < -20 || q[1] > 1100) continue;
      const depth = 0.35 + 0.65 * Math.min(1, Math.max(0, (q[2] + 0.3) / 0.6));
      ctx.globalAlpha = depth * fade;
      ctx.fillStyle = q[3] === 'legs' ? c.m : q[3] === 'skin' ? PS.mix(c.s, c.a, 0.55) : c.s;
      ctx.beginPath(); ctx.arc(q[0], q[1], rr, 0, PS.TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.n1.opacity = eo(seg(t, 3.7, 4.2)) * (1 - seg(t, 6.3, 6.7));
    const shown = this.T.length * eo(seg(t, 6.9, 8.9));
    ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    this.T.forEach((tri, i) => {
      const p = Math.min(1, Math.max(0, shown - i));
      if (p <= 0) return;
      const A = this.V[tri[0]], B = this.V[tri[1]], D = this.V[tri[2]];
      ctx.globalAlpha = p;
      ctx.fillStyle = PS.mix(c.g, c.m, 0.32);
      ctx.strokeStyle = c.a;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    for (const v of this.V) PS.dot(ctx, v[0], v[1], 5 * eo(seg(t, 6.7, 7.2)), c.s);
    this.n2.opacity = eo(seg(t, 8.4, 9.0));
  },
});