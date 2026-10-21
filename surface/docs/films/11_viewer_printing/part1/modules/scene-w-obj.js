const { seg, eo, eio, lerp, TextFx } = kit;
// one triangle on screen (corners 1, 2, 3) and the texture square with its three spots (u, v)
const C3 = [[840, 320], [1170, 430], [900, 650]], SQ = [1340, 300, 460], UV = [[0.20, 0.75], [0.70, 0.80], [0.35, 0.25]];
const TP = UV.map(([u, v]) => [SQ[0] + u * SQ[2], SQ[1] + (1 - v) * SQ[2]]);
const ROWS = [['v  0.12  0.80  0.31', 250], ['v  0.31  0.42  0.27', 302], ['v  0.05  0.36  0.33', 354], ['vt 0.20  0.75', 420], ['vt 0.70  0.80', 472], ['vt 0.35  0.25', 524]];
kit.scene('w-obj', {
  init(kit) {
    let rows = ''; ROWS.forEach(([s, y], i) => { rows += '<p class="note w-obj-r" style="left:110px;top:' + y + 'px;font-size:30px;color:' + (i < 3 ? 'var(--second)' : 'var(--main)') + '">' + s + '</p>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The viewer · The files</span><h2 class="line">What the browser gets</h2></div>' + rows +
      '<p class="note w-obj-f" style="left:110px;top:590px;font-size:30px;color:var(--accent)">f  1 2 3</p>' +
      '<p class="note w-obj-f" style="left:110px;top:590px;font-size:30px;color:var(--accent)">f  1/1 2/2 3/3</p>' +
      '<p class="note w-obj-m" style="left:110px;top:680px;font-size:26px;color:var(--second)">mesh.mtl:  map_Kd texture.png</p>' +
      '<p class="note w-obj-m" style="left:110px;top:724px;font-size:22px">the second file only names the image</p>' +
      '<p class="note w-obj-c" style="left:520px;top:308px;font-size:22px;color:var(--second)">← corners: x y z</p>' +
      '<p class="note w-obj-c" style="left:520px;top:478px;font-size:22px">← texture spots: u v</p>' +
      '<p class="note warm w-obj-c" style="left:520px;top:596px;font-size:22px">← one triangle</p>' +
      '<p class="note warm w-obj-k" style="left:796px;top:270px;font-size:28px">1</p>' +
      '<p class="note warm w-obj-k" style="left:1186px;top:446px;font-size:28px">2</p>' +
      '<p class="note warm w-obj-k" style="left:858px;top:640px;font-size:28px">3</p>' +
      '<div class="words w-obj-x" style="left:' + SQ[0] + 'px;top:' + (SQ[1] + SQ[2] + 16) + 'px;width:' + SQ[2] + 'px;align-items:center"><p class="note">texture.png</p></div>' +
      '<p class="cap">Every result is saved as an OBJ file, which is plain text. Each line starting with v is one corner: three numbers, x, y and z.</p>' +
      '<p class="cap">A line starting with f is one triangle. It names three corners by their order in the file: here corners 1, 2 and 3.</p>' +
      '<p class="cap">Lines starting with vt are spots on the texture image. In f 1/1 2/2 3/3, the second number of each pair picks the spot.</p>' +
      '<p class="cap">So every triangle cuts its own small piece out of the image and wears it. The MTL file just names which image.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap');
    this.r = q('.w-obj-r'); this.f = q('.w-obj-f'); this.m = q('.w-obj-m'); this.cm = q('.w-obj-c'); this.kk = q('.w-obj-k'); this.x = q('.w-obj-x')[0].style;
    // affine map from the texture square (screen) onto the screen triangle
    const [a, b, c] = TP, [A, B, Cc] = C3, d = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    const m11 = ((B[0] - A[0]) * (c[1] - a[1]) - (Cc[0] - A[0]) * (b[1] - a[1])) / d, m12 = ((Cc[0] - A[0]) * (b[0] - a[0]) - (B[0] - A[0]) * (c[0] - a[0])) / d;
    const m21 = ((B[1] - A[1]) * (c[1] - a[1]) - (Cc[1] - A[1]) * (b[1] - a[1])) / d, m22 = ((Cc[1] - A[1]) * (b[0] - a[0]) - (B[1] - A[1]) * (c[0] - a[0])) / d;
    this.M = [m11, m21, m12, m22, A[0] - m11 * a[0] - m12 * a[1], A[1] - m21 * a[0] - m22 * a[1]];
  },
  pattern(ctx, al) {
    const c = this.c, [x0, y0, S] = SQ;
    ctx.globalAlpha = al; ctx.fillStyle = PS.mix(c.g, c.m, 0.22); ctx.fillRect(x0, y0, S, S);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, S, S); ctx.clip();
    ctx.lineWidth = 20; for (let i = -10; i < 22; i++) { ctx.strokeStyle = i % 3 === 0 ? PS.mix(c.g, c.a, 0.8) : i % 3 === 1 ? PS.mix(c.g, c.m, 0.55) : PS.mix(c.g, c.s, 0.35); ctx.beginPath(); ctx.moveTo(x0 + i * 46, y0); ctx.lineTo(x0 + i * 46 - S, y0 + S); ctx.stroke(); }
    ctx.fillStyle = PS.mix(c.g, c.s, 0.85); ctx.beginPath(); ctx.arc(x0 + 0.42 * S, y0 + 0.36 * S, 0.13 * S, 0, PS.TAU); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.2, 19.8], t);
    const show = (el, a) => { const p = eo(seg(t, a, a + 0.45)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 22 + 'px)'; return p; };
    const RT = [1.0, 1.5, 2.0, 13.8, 14.3, 14.8]; this.r.forEach((el, i) => show(el, RT[i]));
    const sw = eio(seg(t, 15.8, 16.4)); this.f[0].style.opacity = eo(seg(t, 7.0, 7.45)) * (1 - sw); this.f[1].style.opacity = sw;
    show(this.m[0], 20.0); show(this.m[1], 20.6);
    [2.4, 14.4, 7.6].forEach((a, i) => show(this.cm[i], a));
    this.kk.forEach((el, i) => el.style.opacity = eo(seg(t, 1.4 + 0.5 * i, 1.9 + 0.5 * i)));
    this.x.opacity = eo(seg(t, 13.4, 13.9));
    const ctx = this.k.fx, c = this.c;
    // the texture square and its three spots
    const tx = eo(seg(t, 13.0, 13.8)); if (tx > 0) this.pattern(ctx, tx);
    const tr = eio(seg(t, 7.4, 8.6));
    if (tr > 0) { ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.lineJoin = 'round'; const L = [C3[0], C3[1], C3[2], C3[0]]; PS.poly(ctx, L.map(p => p), tr); }
    const fl = eo(seg(t, 8.6, 9.2)) * (1 - eo(seg(t, 18.0, 18.6))); if (fl > 0) { ctx.globalAlpha = fl; PS.tri(ctx, C3[0], C3[1], C3[2], PS.mix(c.g, c.m, 0.3), null); ctx.globalAlpha = 1; }
    const pf = eo(seg(t, 18.0, 19.2));
    if (pf > 0) { ctx.save(); ctx.beginPath(); ctx.moveTo(C3[0][0], C3[0][1]); ctx.lineTo(C3[1][0], C3[1][1]); ctx.lineTo(C3[2][0], C3[2][1]); ctx.closePath(); ctx.clip(); ctx.transform(...this.M); this.pattern(ctx, pf); ctx.restore(); }
    if (tr >= 1) { ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(C3[0][0], C3[0][1]); ctx.lineTo(C3[1][0], C3[1][1]); ctx.lineTo(C3[2][0], C3[2][1]); ctx.closePath(); ctx.stroke(); }
    C3.forEach((p, i) => { const a = eo(seg(t, 1.2 + 0.5 * i, 1.6 + 0.5 * i)); if (a > 0) { ctx.globalAlpha = a; PS.dot(ctx, p[0], p[1], 10, c.s); ctx.globalAlpha = 1; } });
    const ut = eio(seg(t, 15.0, 15.8));
    if (ut > 0) { ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.globalAlpha = ut; ctx.beginPath(); ctx.moveTo(TP[0][0], TP[0][1]); ctx.lineTo(TP[1][0], TP[1][1]); ctx.lineTo(TP[2][0], TP[2][1]); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.font = '600 22px ' + kit.fonts.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    TP.forEach((p, i) => { const a = eo(seg(t, 14.0 + 0.5 * i, 14.4 + 0.5 * i)); if (a <= 0) return; ctx.globalAlpha = a; PS.dot(ctx, p[0], p[1], 15, c.g); ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 15, 0, PS.TAU); ctx.stroke(); ctx.fillStyle = c.a; ctx.fillText(String(i + 1), p[0], p[1] + 1); ctx.globalAlpha = 1; });
    const lk = eio(seg(t, 16.6, 18.0));
    if (lk > 0) { ctx.setLineDash([9, 8]); ctx.strokeStyle = PS.mix(c.g, c.a, 0.8); ctx.lineWidth = 2; TP.forEach((p, i) => { const q = C3[i], L = Math.hypot(q[0] - p[0], q[1] - p[1]), s0 = 19 / L; ctx.beginPath(); ctx.moveTo(lerp(p[0], q[0], s0), lerp(p[1], q[1], s0)); ctx.lineTo(lerp(p[0], q[0], Math.max(s0, lk)), lerp(p[1], q[1], Math.max(s0, lk))); ctx.stroke(); }); ctx.setLineDash([]); }
  },
});
