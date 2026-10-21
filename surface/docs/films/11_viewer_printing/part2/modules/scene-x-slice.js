const { seg, eo, eio, lerp, TextFx } = kit;
const NL = 60, LO = -0.495, HI = 0.495, VIEW = { cx: 540, cy: 600, s: 600, yaw: 0.5, pitch: 0.38 }, TX = 1440, TY = 590, TS = 1500, CHEST = 0.17;
kit.scene('x-slice', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · The printer</span><h2 class="line">How a printer builds</h2></div>' +
      '<div class="words x-slice-k" style="left:340px;top:236px;width:400px;align-items:center"><p class="note warm x-slice-kn">layer 0 of 900</p></div>' +
      '<div class="words x-slice-t" style="left:1100px;top:296px;width:680px;align-items:center"><p class="note" style="color:var(--second)">seen from above: this layer</p></div>' +
      '<div class="words" style="left:1100px;top:846px;width:680px;gap:8px;align-items:center"><p class="note x-slice-n" style="font-size:24px">a typical layer: 0.2 mm, so about 900 layers</p><p class="note warm x-slice-n" style="font-size:24px">each layer: trace the outline, fill the inside</p></div>' +
      '<p class="cap">A printer builds the figure layer by layer, from the bottom up. Software called a slicer cuts the mesh into thin flat slices.</p>' +
      '<p class="cap">At a typical 0.2 mm per layer, our 180 mm figure becomes about 900 slices. Each slice is a flat outline.</p>' +
      '<p class="cap">For every slice the nozzle traces the outline, then fills the inside. So the slicer must know, at every point, what is inside.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.kn = q('.x-slice-kn')[0]; this.ks = q('.x-slice-k')[0].style; this.ts = q('.x-slice-t')[0].style; this.n = q('.x-slice-n');
    this.S = VW.mesh(kit, 'vw-dh.json'); this.H = []; this.L = [];
    for (let i = 0; i < NL; i++) { const h = LO + (HI - LO) * (i + 0.5) / NL; this.H.push(h); this.L.push(VW.slice(this.S, h)); }
    this.chest = VW.slice(this.S, CHEST);
    // the nozzle's fill lines for the chest layer: even-odd pairs along rows of constant z
    this.fill = []; for (let z = -0.158; z < 0.158; z += 0.006) { const xs = []; this.chest.forEach(([x1, z1, x2, z2]) => { if ((z1 - z) * (z2 - z) < 0) xs.push(x1 + (x2 - x1) * (z - z1) / (z2 - z1)); }); xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) this.fill.push([xs[k], xs[k + 1], z]); }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 14.4], t);
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 0.2, 1.0)), pr = VW.proj(VIEW);
    MESH.draw(ctx, this.S, Object.assign({ c, tint: c.s, edge: 0, fill: 0.22 * a }, VIEW));
    const bp = seg(t, 1.6, 9.0), shown = Math.floor(bp * NL + 1e-6), layer = Math.round(bp * 900);
    this.kn.textContent = 'layer ' + layer + ' of 900'; this.ks.opacity = eo(seg(t, 1.2, 1.7)); this.ts.opacity = eo(seg(t, 1.8, 2.3));
    this.n.forEach((el, i) => el.style.opacity = eo(seg(t, [7.8, 14.8][i], [8.3, 15.3][i])));
    const ci = Math.round((CHEST - LO) / (HI - LO) * NL - 0.5), hl = eo(seg(t, 9.6, 10.4));
    for (let i = 0; i < shown; i++) {
      const top = i === shown - 1 && t < 9.4, ch = i === ci ? hl : 0;
      ctx.strokeStyle = top || ch > 0.5 ? c.a : c.m; ctx.globalAlpha = top || ch > 0.5 ? 1 : 0.55; ctx.lineWidth = top || ch > 0.5 ? 2.6 : 1.4; ctx.beginPath();
      this.L[i].forEach(([x1, z1, x2, z2]) => { const p = pr(x1, this.H[i], z1), q = pr(x2, this.H[i], z2); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // the current layer from above; after the build, the chest layer and its fill
    const tv = eo(seg(t, 1.8, 2.3)); if (tv <= 0) return;
    const segs = t < 9.4 ? this.L[Math.max(0, shown - 1)] : this.chest, X = x => TX + x * TS, Y = z => TY + z * TS;
    if (shown > 0 || t >= 9.4) { ctx.globalAlpha = tv; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); segs.forEach(([x1, z1, x2, z2]) => { ctx.moveTo(X(x1), Y(z1)); ctx.lineTo(X(x2), Y(z2)); }); ctx.stroke(); ctx.globalAlpha = 1; }
    const fp = seg(t, 14.8, 18.6), nf = Math.floor(fp * this.fill.length);
    if (nf > 0) { ctx.strokeStyle = c.m; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k < nf; k++) { const [x0, x1, z] = this.fill[k]; ctx.moveTo(X(x0) + 3, Y(z)); ctx.lineTo(X(x1) - 3, Y(z)); } ctx.stroke(); if (fp < 1) { const [, x1, z] = this.fill[Math.min(nf, this.fill.length - 1)]; PS.dot(ctx, X(x1), Y(z), 7, c.s); } }
  },
});
