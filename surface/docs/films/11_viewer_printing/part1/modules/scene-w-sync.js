const { seg, eo, eio, lerp, TextFx } = kit;
const PANE = [[110, 930], [990, 1810]], PT = 230, PB = 900, MX = [520, 1400], MY = 590, MS = 560;
// the view buttons: [time it arrives, yaw, pitch]
const VIEWS = [['Front', 13.6, 0, 0.08], ['Back', 14.8, Math.PI, 0.08], ['Left', 16.0, Math.PI / 2, 0.08], ['Right', 17.2, -Math.PI / 2, 0.08], ['Top', 18.4, 0, 1.3]];
kit.scene('w-sync', {
  init(kit) {
    let html = '';
    PANE.forEach(([a, b], i) => { html += '<div class="w-sync-p" style="position:absolute;left:' + a + 'px;top:' + PT + 'px;width:' + (b - a) + 'px;height:' + (PB - PT) + 'px;box-sizing:border-box;border:2px solid color-mix(in srgb, var(--main) 45%, var(--ground));border-radius:12px"><p class="note" style="' + (i ? 'right' : 'left') + ':18px;top:14px;font-size:24px;color:var(--second)">' + ['DHSP · 6,000 triangles', 'MeshAnything · 1,435 triangles'][i] + '</p></div>'; });
    VIEWS.forEach(([n], i) => { html += '<p class="box w-sync-b" style="left:' + (1250 + i * 112) + 'px;top:118px;width:100px;padding:8px 0;text-align:center;font-family:var(--mono);font-size:22px">' + n + '</p>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The viewer · Compare side by side</span><h2 class="line">One camera, two results</h2></div>' + html +
      '<p class="note w-sync-o" style="left:1000px;top:190px;font-size:24px">one camera</p>' +
      '<p class="cap">Pick a second result and the screen splits in two. Both halves are drawn from one shared camera.</p>' +
      '<p class="cap">So when you turn one, the other turns with it: you always compare the same side, from the same distance.</p>' +
      '<p class="cap">The view buttons jump to the front, back, sides or top. They come from the person’s own up and front, measured from the scan.</p>' +
      '<p class="cap">DHSP’s 6,000 triangles against MeshAnything’s 1,435: same pose, same light, so only the meshes differ.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.p = q('.w-sync-p'); this.b = q('.w-sync-b'); this.o = q('.w-sync-o')[0].style;
    this.A = VW.mesh(kit, 'vw-dh.json'); this.B = VW.mesh(kit, 'vw-ma.json');
  },
  cam(t) {
    // drag: the cursor pulls the shared camera around, then the view buttons take over
    const cxAt = u => u < 9.4 ? lerp(420, 660, eio(seg(u, 6.9, 8.9))) : lerp(660, 470, eio(seg(u, 9.4, 11.0)));
    const yawAt = u => (cxAt(u) - 420) / 240 * 1.1 + 0.25 * Math.sin(PS.TAU * Math.min(u, 6.5) / 13);
    let yaw = yawAt(t), pitch = 0.08, prev = [yawAt(12.8), 0.08];
    for (const [, ta, y, p] of VIEWS) { if (t >= ta - 0.7) { const k = eio(seg(t, ta - 0.7, ta)); yaw = lerp(prev[0], y, k); pitch = lerp(prev[1], p, k); } prev = [y, p]; }
    if (t >= 19.6) { const k = eio(seg(t, 19.6, 20.4)); yaw = 0.5 * Math.sin(PS.TAU * Math.max(0, t - 20.4) / 12); pitch = lerp(1.3, 0.08, k); }
    return { yaw, pitch, cx: cxAt(t) };
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 13.2, 19.6], t);
    this.p.forEach((el, i) => { const p = eo(seg(t, 0.4 + 0.3 * i, 1.0 + 0.3 * i)); el.style.opacity = p; });
    let act = -1; VIEWS.forEach(([, ta], i) => { if (t >= ta - 0.35 && t < 19.6) act = i; });
    this.b.forEach((el, i) => { el.style.opacity = eo(seg(t, 13.0 + 0.1 * i, 13.4 + 0.1 * i)); el.style.borderColor = i === act ? 'var(--accent)' : ''; el.style.color = i === act ? 'var(--accent)' : ''; });
    const ctx = this.k.fx, c = this.c, V = this.cam(t), a = eo(seg(t, 1.0, 1.8));
    [this.A, this.B].forEach((S, i) => {
      ctx.save(); ctx.beginPath(); ctx.rect(PANE[i][0] + 2, PT + 56, PANE[i][1] - PANE[i][0] - 4, PB - PT - 58); ctx.clip();
      MESH.draw(ctx, S, { c, cx: MX[i], cy: MY, s: MS, yaw: V.yaw, pitch: V.pitch, colors: S.C, tint: c.m, edge: 0.55, lw: 0.7, fill: a });
      ctx.restore();
    });
    // one camera feeding both halves
    const co = eo(seg(t, 1.8, 2.4)) * (1 - eo(seg(t, 6.2, 6.8))); this.o.opacity = co;
    if (co > 0) {
      ctx.globalAlpha = co; ctx.fillStyle = PS.mix(c.g, c.s, 0.8); ctx.fillRect(944, 200, 32, 24); ctx.beginPath(); ctx.moveTo(976, 212); ctx.lineTo(990, 203); ctx.lineTo(990, 221); ctx.closePath(); ctx.fill();
      const lk = eio(seg(t, 2.2, 3.4)); ctx.setLineDash([9, 8]); ctx.strokeStyle = c.a; ctx.lineWidth = 2;
      MX.forEach(x => { ctx.beginPath(); ctx.moveTo(960, 228); ctx.lineTo(lerp(960, x, lk), lerp(228, 300, lk)); ctx.stroke(); }); ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    const cu = eo(seg(t, 6.6, 6.9)) * (1 - eo(seg(t, 11.2, 11.6)));
    if (cu > 0) { ctx.globalAlpha = cu; ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(V.cx, 700, 16, 0, PS.TAU); ctx.stroke(); PS.dot(ctx, V.cx, 700, 5, c.a); ctx.globalAlpha = 1; }
  },
});
