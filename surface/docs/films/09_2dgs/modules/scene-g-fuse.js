const { seg, eo, eio, lerp, TextFx } = kit;
const Q = [250, 225, 660], CT = [7.0, 9.0, 11.0, 13.0, 15.0, 17.0];
kit.scene('g-fuse', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">2DGS · Making the mesh</span><h2 class="line">Disks to a mesh</h2></div>' +
      '<div class="words" style="left:1010px;top:262px;width:860px;gap:12px">' +
      '<p class="note g-fuse-n">1 · a depth map from every camera</p>' +
      '<p class="note g-fuse-n">2 · each grid cell: distance in front of the</p><p class="note g-fuse-n">   seen surface, cut off, averaged (TSDF)</p>' +
      '<p class="eq num g-fuse-c" style="font-size:44px;margin:8px 0">cameras fused</p>' +
      '<p class="note warm g-fuse-n">3 · zero line → marching cubes → mesh</p>' +
      '<p class="note g-fuse-n" style="color:var(--second)">ours: 125 depth maps → 657,447 triangles</p>' +
      '<p class="note g-fuse-n" style="color:var(--second)">kept: the largest piece inside the scan’s box</p></div>' +
      '<p class="cap">To get a mesh, 2DGS renders a depth map from every camera: how far away the surface is along each pixel’s ray.</p>' +
      '<p class="cap">A grid then fuses them. Each cell stores how far in front of the seen surface it sits, cut off at a small distance, averaged over cameras.</p>' +
      '<p class="cap">Camera by camera, the outline fills in. Places that no camera sees well, like deep armpits, stay uncertain.</p>' +
      '<p class="cap">Its zero line is the surface, and marching cubes turns it into triangles. We keep the largest piece inside the scan’s box.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.g-fuse-n'); this.cn = q('.g-fuse-c')[0];
    this.cams = [180, 0, 135, 45, 225, 315].map(d => { const a = d * Math.PI / 180; return [0.95 * Math.cos(a), 0.95 * Math.sin(a)]; });
    this.T = TS.fuse(TOY.SH, this.cams, { N: 90 }); this.imgs = this.T.steps.map(st => TS.image(st, this.T.N, this.c));
    this.rays = this.cams.map(cm => { const out = []; const dx = -cm[0], dy = -cm[1], a0 = Math.atan2(dy, dx); for (let k = -14; k <= 14; k++) { const a = a0 + k * 0.03, d = [Math.cos(a), Math.sin(a)], h = TS.inter(cm, d, TOY.SH); if (isFinite(h)) out.push([cm[0] + d[0] * h, cm[1] + d[1] * h]); } return out; });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 14.4, 21.0], t);
    const NT = [0.8, 6.8, 7.0, 21.2, 22.0, 22.6]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    let k = -1; CT.forEach((s, i) => { if (t >= s) k = i; }); const pc = eo(seg(t, 6.8, 7.3)); this.cn.style.opacity = pc; this.cn.textContent = 'cameras fused: ' + (k + 1) + ' of 6';
    const ctx = this.k.fx, c = this.c, map = (x, y) => [Q[0] + (x + 0.78) / 1.56 * Q[2], Q[1] + (y + 0.78) / 1.56 * Q[2]];
    if (k >= 0 && this.imgs[k]) { ctx.globalAlpha = eo(seg(t, CT[k], CT[k] + 0.6)); ctx.drawImage(this.imgs[k], Q[0], Q[1], Q[2], Q[2]); if (k > 0 && this.imgs[k - 1]) { ctx.globalAlpha = 1 - eo(seg(t, CT[k], CT[k] + 0.6)); ctx.drawImage(this.imgs[k - 1], Q[0], Q[1], Q[2], Q[2]); } ctx.globalAlpha = 1; }
    const oa = eo(seg(t, 0.4, 1.4)) * (1 - 0.6 * eo(seg(t, 21.0, 22.0)));
    if (oa > 0) { ctx.globalAlpha = oa * 0.7; ctx.setLineDash([9, 8]); ctx.strokeStyle = c.s; ctx.lineWidth = 2.5; ctx.beginPath(); TOY.SH.forEach((p, i) => { const q = map(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    this.cams.forEach((cm, i) => { const a = eo(seg(t, 1.6 + i * 0.3, 2.1 + i * 0.3)); if (a <= 0) return; const p = map(cm[0], cm[1]), d = Math.atan2(-cm[1], -cm[0]); ctx.globalAlpha = a; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(d); ctx.fillStyle = i === k ? c.a : PS.mix(c.g, c.s, 0.6); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-14, -14); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; });
    const r0 = Math.max(0, k), fan = (k < 0 ? eo(seg(t, 3.0, 4.2)) : eo(seg(t, CT[r0], CT[r0] + 0.4)) * (1 - eo(seg(t, CT[r0] + 1.4, CT[r0] + 1.9)))) * (t < 18.6 ? 1 : 0);
    if (fan > 0) { const cm = this.cams[r0], p0 = map(cm[0], cm[1]); ctx.strokeStyle = c.a; ctx.lineWidth = 1.5; this.rays[r0].forEach(h => { const q = map(h[0], h[1]); ctx.globalAlpha = fan * 0.7; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); PS.dot(ctx, q[0], q[1], 3.5, c.a); }); ctx.globalAlpha = 1; }
    if (k >= 0) { const st = this.T.steps[k], ca = eo(seg(t, CT[k] + 0.3, CT[k] + 0.9)); ctx.strokeStyle = c.s; ctx.lineWidth = t > 21 ? 4 : 2.5; st.segs.forEach(s => { const a = map(s[0][0], s[0][1]), b = map(s[1][0], s[1][1]); ctx.globalAlpha = Math.max(ca, k > 0 ? 0.8 : 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }); ctx.globalAlpha = 1; }
  },
});