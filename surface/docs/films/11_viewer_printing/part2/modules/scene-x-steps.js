const { seg, eo, eio, lerp, TextFx } = kit;
const ST = [['1 · Keep the largest piece', 'Poisson’s closed mesh had 4 pieces', 1.0], ['2 · Point every outside out', 'fix triangles listed the wrong way', 4.2], ['3 · Turn it so up is +z', 'the scan had its head towards −y', 7.2],
  ['4 · Scale to 180 mm tall', 'one factor for all three axes', 12.8], ['5 · Centre it, feet at z = 0', 'standing on the build plate', 15.6], ['6 · Save, then check again', 'figure.stl and a coloured figure.obj', 18.8]];
const RY0 = 250, RH = 98, CX = 600, SC = 600;
kit.scene('x-steps', {
  init(kit) {
    let rows = ''; ST.forEach(([a, b], i) => { rows += '<div class="x-st-r" style="position:absolute;left:1120px;top:' + (RY0 + i * RH) + 'px;width:720px;height:90px"><p class="eq" style="left:0;top:0;font-size:36px">' + a + '</p><p class="note" style="left:0;top:48px;font-size:22px">' + b + '</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · Our export</span><h2 class="line">Our print export</h2></div>' +
      '<div class="x-st-h" style="position:absolute;left:1098px;top:' + (RY0 - 12) + 'px;width:760px;height:96px;box-sizing:border-box;border:3px solid var(--accent);border-radius:12px"></div>' + rows +
      '<p class="note x-st-m" style="left:878px;top:545px">180 mm</p>' +
      '<p class="cap">Our export script prepares each closed mesh in a few fixed steps. First it keeps only the largest connected piece, and makes every outside point outwards.</p>' +
      '<p class="cap">In the scan’s own axes the person stands on their head: up was −y. Slicers expect up to be +z, so the mesh is turned upright.</p>' +
      '<p class="cap">Then it is scaled to 180 mm tall, by the same factor on every axis, and centred with its feet at height zero on the build plate.</p>' +
      '<p class="cap">It is only turned, moved and scaled, never remeshed. Then it is saved as an STL, plus a coloured OBJ for colour printers, and checked again.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.r = q('.x-st-r'); this.h = q('.x-st-h')[0].style; this.m = q('.x-st-m')[0].style;
    this.S = VW.mesh(kit, 'vw-dh.json'); this.N = VW.vnorm(this.S);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 12.8, 18.6], t);
    let act = 0; ST.forEach(([, , a], i) => { if (t >= a) act = i; });
    const prev = Math.max(0, act - 1), sw = act ? eio(seg(t, ST[act][2], ST[act][2] + 0.5)) : 1;
    this.h.transform = 'translateY(' + lerp(prev * RH, act * RH, sw) + 'px)'; this.h.opacity = eo(seg(t, 0.8, 1.3));
    this.r.forEach((el, i) => { const p = eo(seg(t, ST[i][2] - 0.2, ST[i][2] + 0.3)); el.style.opacity = p * (i === act ? 1 : 0.55); el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.m.opacity = eo(seg(t, 13.4, 13.9));
    const ctx = this.k.fx, c = this.c, S = this.S, up = eio(seg(t, 7.6, 10.8)), pl = eo(seg(t, 15.6, 16.4)), cy = lerp(540, 560, eio(seg(t, 15.8, 16.8))), fy = cy + 0.5 * SC;
    if (pl > 0) { ctx.globalAlpha = pl; ctx.fillStyle = PS.mix(c.g, c.m, 0.18); ctx.strokeStyle = PS.mix(c.g, c.m, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, 866, 220, 40, 0, 0, PS.TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
    VW.toScan(S, 1 - up);
    const o = { c, cx: CX, cy, s: SC, yaw: 0.35, pitch: 0.08 };
    MESH.draw(ctx, S, Object.assign({ colors: S.C, edge: 0, fill: eo(seg(t, 0.2, 1.0)) }, o));
    // step 2: the outward arrows on every 14th corner that faces us
    const nt = eo(seg(t, 4.4, 5.0)) * (1 - eo(seg(t, 6.8, 7.3)));
    if (nt > 0) {
      const M = VW.rot(1 - up), B = MESH.basis(o), pr = VW.proj(o), P = S.P, Nn = this.N; ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.globalAlpha = nt; ctx.beginPath();
      for (let i = 0; i < S.nv; i += 14) { const n = [0, 1, 2].map(r => M[r][0] * Nn[3 * i] + M[r][1] * Nn[3 * i + 1] + M[r][2] * Nn[3 * i + 2]); if (n[0] * B.F0 * B.cp + n[2] * B.F1 * B.cp + n[1] * B.sp < 0.1) continue; const a = pr(P[3 * i], P[3 * i + 1], P[3 * i + 2]), b = pr(P[3 * i] + n[0] * 0.04, P[3 * i + 1] + n[1] * 0.04, P[3 * i + 2] + n[2] * 0.04); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    // step 4: the height bar
    const b = eio(seg(t, 12.8, 13.6)); if (b > 0) { ctx.strokeStyle = c.m; ctx.lineWidth = 2.5; const y0 = fy, y1 = lerp(fy, cy - 0.5 * SC, b); ctx.beginPath(); ctx.moveTo(860, y0); ctx.lineTo(860, y1); ctx.moveTo(848, y0); ctx.lineTo(872, y0); if (b > 0.98) { ctx.moveTo(848, y1); ctx.lineTo(872, y1); } ctx.stroke(); }
  },
});
