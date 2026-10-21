const { seg, eo, eio, eob, lerp, TextFx } = kit;
const GX = 200, GB = 870, GS = 620, ST = GS / 16;
const gp = (i, j) => [GX + i * ST, GB - j * ST];
const CO = [[5, 11], [9, 13], [8, 7]];
kit.scene('a-grid', {
  init(kit) {
    const nb = (s, k) => '<p class="box num a-grid-d" style="font-size:30px;padding:8px 12px;border-color:' + ['var(--main)', 'var(--second)', 'var(--accent)'][k] + '">' + s + '</p>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · Tokens</span><h2 class="line">Corners into numbers</h2></div>' +
      '<p class="note a-grid-ax" style="left:192px;top:880px">0</p><p class="note a-grid-ax" style="left:776px;top:880px">127</p><p class="note a-grid-ax" style="left:136px;top:236px">127</p>' +
      '<p class="note warm a-grid-ax" style="left:' + (gp(5, 0)[0] - 16) + 'px;top:880px">40</p><p class="note warm a-grid-ax" style="left:150px;top:' + (gp(0, 11)[1] - 17) + 'px">88</p>' +
      '<div class="words" style="left:920px;top:250px;width:900px;gap:18px">' +
      '<p class="note a-grid-r">each side cut into 128 equal steps (16 drawn here)</p>' +
      '<p class="eq num a-grid-r" style="font-size:50px">corner → (40, 88, 64)</p>' +
      '<p class="note a-grid-r">x, y read off the grid; z (depth) is cut the same way</p>' +
      '<p class="eq num a-grid-r" style="font-size:50px;margin-top:14px">triangle → 9 numbers</p>' +
      '<div class="words a-grid-r" style="position:static;flex-direction:row;gap:10px">' + nb('40', 0) + nb('88', 0) + nb('64', 0) + nb('72', 1) + nb('104', 1) + nb('56', 1) + nb('64', 2) + nb('56', 2) + nb('80', 2) + '</div>' +
      '<p class="eq a-grid-r" style="margin-top:14px">a mesh → one long list of numbers</p>' +
      '<p class="note warm a-grid-r">dictionary: 128 numbers + 4 marks = 132 tokens</p></div>' +
      '<p class="cap">To write a mesh as tokens, first put the shape in a box and cut each side into 128 equal steps.</p>' +
      '<p class="cap">Every corner snaps to the nearest step, so its position becomes three whole numbers from 0 to 127: x, y and z.</p>' +
      '<p class="cap">A triangle has three corners, so it becomes nine numbers. These numbers are the words of a mesh.</p>' +
      '<p class="cap">Its whole dictionary is only 132 tokens: the 128 numbers plus a few marks such as start, end and new strip.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.ax = q('.a-grid-ax'); this.r = q('.a-grid-r'); this.d = q('.a-grid-d');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.6, 10.4, 16.8], t);
    const RT = [2.4, 8.2, 9.0, 14.6, 99, 17.4, 19.6];
    this.r.forEach((el, i) => { const p = eo(seg(t, RT[i], RT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    this.r[4].style.opacity = 1; this.r[4].style.transform = 'none';
    this.d.forEach((el, i) => { const a = 13.2 + Math.floor(i / 3) * 0.45 + (i % 3) * 0.1, p = seg(t, a, a + 0.4); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.8, 1, eob(p, 1.7)) + ')'; });
    this.ax.forEach((el, i) => el.style.opacity = i < 3 ? eo(seg(t, 2.0, 2.6)) : eo(seg(t, 7.4, 7.9)));
    const ctx = this.k.fx, c = this.c;
    const b = eio(seg(t, 0.6, 1.8));
    if (b > 0) { ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.globalAlpha = b; ctx.strokeRect(GX, GB - GS, GS, GS); ctx.globalAlpha = 1; }
    ctx.lineWidth = 1.5; ctx.strokeStyle = PS.mix(c.g, c.m, 0.55);
    for (let i = 1; i < 16; i++) { const a = eo(seg(t, 1.2 + i * 0.05, 1.8 + i * 0.05)); if (a <= 0) continue; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(GX + i * ST, GB); ctx.lineTo(GX + i * ST, GB - GS); ctx.moveTo(GX, GB - i * ST); ctx.lineTo(GX + GS, GB - i * ST); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i <= 16; i++) for (let j = 0; j <= 16; j++) { const a = eo(seg(t, 2.0, 2.8)); if (a > 0) { ctx.globalAlpha = a * 0.5; PS.dot(ctx, GX + i * ST, GB - j * ST, 2.6, c.m); } }
    ctx.globalAlpha = 1;
    const A = gp(5, 11), f = seg(t, 3.4, 6.4), sn = eob(seg(t, 6.5, 7.1), 1.8);
    const fx = 330 + 70 * Math.sin(f * 5.2) + f * 60, fy = 520 - 60 * Math.cos(f * 4.1) - f * 20;
    const fl = [lerp(330, 402, eio(f)) + 26 * Math.sin(f * 9) * (1 - f), lerp(520, 452, eio(f)) - 30 * Math.sin(f * 7) * (1 - f)];
    const P = [lerp(fl[0], A[0], sn), lerp(fl[1], A[1], sn)];
    const g = eo(seg(t, 7.2, 7.7));
    if (g > 0) { ctx.globalAlpha = g; ctx.setLineDash([8, 8]); ctx.strokeStyle = c.a; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0], GB); ctx.moveTo(A[0], A[1]); ctx.lineTo(GX, A[1]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    const tp = eo(seg(t, 10.6, 12.4));
    if (tp > 0) {
      const B = gp(9, 13), C = gp(8, 7);
      ctx.globalAlpha = tp; PS.tri(ctx, A, B, C, PS.mix(c.g, c.a, 0.32), c.a, 4); ctx.globalAlpha = 1;
      PS.dot(ctx, B[0], B[1], 12 * eob(seg(t, 10.6, 11.1), 1.7), c.s); PS.dot(ctx, C[0], C[1], 12 * eob(seg(t, 11.2, 11.7), 1.7), c.a);
    }
    const d = eo(seg(t, 3.0, 3.4)); if (d > 0) { ctx.globalAlpha = d; PS.dot(ctx, P[0], P[1], 13, c.m); ctx.globalAlpha = 1; }
  },
});