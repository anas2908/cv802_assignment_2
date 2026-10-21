const { seg, eo, eio, lerp, TextFx } = kit;
// [icon kind, icon x, icon y, appear time]
const IC = [['grid', 150, 386, 1.0], ['skin', 150, 586, 7.2], ['tris', 1040, 378, 13.8], ['near', 1040, 508, 14.6], ['seen', 1040, 638, 15.4], ['cut', 1040, 768, 19.8]];
kit.scene('x-why', {
  init(kit) {
    const row = (x, y, a, b, col) => '<div class="words x-why-r" style="left:' + x + 'px;top:' + y + 'px;width:700px;gap:6px"><p class="eq" style="font-size:34px' + (col ? ';color:' + col : '') + '">' + a + '</p>' + b.map(s => '<p class="note" style="font-size:22px;color:var(--second)">' + s + '</p>').join('') + '</div>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · Why</span><h2 class="line">Closed by design</h2></div>' +
      '<p class="eq x-why-h" style="left:110px;top:250px;font-size:44px;color:var(--main)">closed by design</p>' +
      '<p class="eq x-why-h" style="left:1000px;top:250px;font-size:44px;color:var(--accent)">open by design</p>' +
      row(220, 350, 'Poisson, SAP', ['decide inside or outside on a whole grid,', 'then take the border between them']) +
      row(220, 550, 'Point2Mesh, DHSP', ['start from a closed skin around the dots', 'and only move its corners']) +
      row(1110, 346, 'IER, MeshAnything', ['place triangles one at a time']) +
      row(1110, 476, 'NKSR', ['solves only close to the dots']) +
      row(1110, 606, '2DGS', ['depth only where the photos saw']) +
      row(1110, 736, 'Poisson, trimmed', ['closed first, then cut on purpose']) +
      '<p class="cap">This is no accident. Poisson and SAP decide inside or outside for every point of a grid, so the border between them is always closed.</p>' +
      '<p class="cap">Point2Mesh and DHSP start from a closed skin around the dots and only ever move its corners, so the skin stays closed.</p>' +
      '<p class="cap">IER and MeshAnything place triangles one at a time, NKSR only solves near the dots, and 2DGS only knows what the photos saw. Nothing forces them closed.</p>' +
      '<p class="cap">And our trimmed Poisson was closed until we cut it on purpose: trimming removes invented surface, but it opens holes.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.x-why-h'); this.r = q('.x-why-r');
  },
  icon(ctx, kind, x, y, a) {
    const c = this.c; ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.lineCap = 'round';
    if (kind === 'grid') { for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const px = x + i * 13, py = y + j * 13, inn = Math.hypot(i, j) < 1.6; PS.dot(ctx, px, py, inn ? 4 : 3, inn ? c.m : PS.mix(c.g, c.s, 0.4)); } ctx.strokeStyle = c.m; ctx.beginPath(); ctx.arc(x, y, 22, 0, PS.TAU); ctx.stroke(); }
    else if (kind === 'skin') { ctx.strokeStyle = c.m; ctx.beginPath(); ctx.arc(x, y, 24, 0, PS.TAU); ctx.stroke(); for (let k = 0; k < 4; k++) { const th = k * Math.PI / 2 + 0.6, ox = x + Math.cos(th) * 40, oy = y + Math.sin(th) * 40; PS.arrow(ctx, ox, oy, x + Math.cos(th) * 28, y + Math.sin(th) * 28, c.m, 2.5, 9); } }
    else if (kind === 'tris') { [[-16, -10, 0.2], [14, -14, 1.6], [0, 16, 3.0]].forEach(([dx, dy, r]) => { const P = [0, 1, 2].map(k => [x + dx + 11 * Math.cos(r + k * 2.1), y + dy + 11 * Math.sin(r + k * 2.1)]); PS.tri(ctx, P[0], P[1], P[2], null, c.a, 2.5); }); }
    else if (kind === 'near') { ctx.strokeStyle = PS.mix(c.g, c.a, 0.35); ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(x, y + 14, 26, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); for (let k = 0; k < 6; k++) { const th = Math.PI * (1.12 + k * 0.15); PS.dot(ctx, x + 26 * Math.cos(th), y + 14 + 26 * Math.sin(th), 3.5, c.a); } }
    else if (kind === 'seen') { ctx.strokeStyle = c.a; ctx.beginPath(); ctx.arc(x, y, 22, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke(); ctx.setLineDash([3, 7]); ctx.strokeStyle = PS.mix(c.g, c.a, 0.4); ctx.beginPath(); ctx.arc(x, y, 22, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.strokeStyle = c.a; ctx.beginPath(); ctx.arc(x, y, 22, 0.5, PS.TAU - 0.5); ctx.stroke(); PS.dot(ctx, x + 22 * Math.cos(0.5), y + 22 * Math.sin(0.5), 4, c.a); PS.dot(ctx, x + 22 * Math.cos(-0.5), y + 22 * Math.sin(-0.5), 4, c.a); }
    ctx.globalAlpha = 1;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.4, 19.6], t);
    [0.4, 13.2].forEach((a, i) => this.h[i].style.opacity = eo(seg(t, a, a + 0.5)));
    this.r.forEach((el, i) => { const p = eo(seg(t, IC[i][3], IC[i][3] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    IC.forEach(([k, x, y, a]) => { const p = eo(seg(t, a, a + 0.5)); if (p > 0) this.icon(this.k.fx, k, x, y, p); });
  },
});
