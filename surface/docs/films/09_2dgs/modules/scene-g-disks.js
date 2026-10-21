const { seg, eo, eio, lerp, TextFx } = kit;
const DC = [1560, 470];
kit.scene('g-disks', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">2DGS · The building blocks</span><h2 class="line">A shape made of disks</h2></div>' +
      '<div class="words" style="left:1300px;top:640px;width:560px;gap:8px">' +
      '<p class="eq num g-disks-n" style="font-size:44px">144,469 disks</p>' +
      '<p class="note g-disks-n" style="color:var(--second)">started from our 138,677 dots</p>' +
      '<p class="note g-disks-n" style="color:var(--second)">split, cloned and pruned in training</p></div>' +
      '<p class="note warm g-disks-g" style="left:1330px;top:452px">centre</p><p class="note g-disks-g" style="left:1660px;top:390px">axis 1</p><p class="note g-disks-g" style="left:1600px;top:540px">axis 2</p>' +
      '<p class="note g-disks-g" style="left:1330px;top:560px;color:var(--second)">+ colour, opacity</p>' +
      '<p class="cap">After training, our scan is 144,469 small disks. They began as our 138,677 dots and were split, cloned and pruned along the way.</p>' +
      '<p class="cap">Each disk has a centre, two axes that set its size and tilt, a colour, and an opacity. Most are a few millimetres to a few centimetres wide.</p>' +
      '<p class="cap">Up close they overlap like fish scales. Each one is flat, so together they form a thin skin, not a cloud.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.g-disks-n'); this.g = q('.g-disks-g');
    this.G = GS.decode([MESH.load(kit, 'gs-s1.json'), MESH.load(kit, 'gs-s2.json')]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 15.4], t);
    this.n.forEach((el, i) => { const p = eo(seg(t, 1.0 + i * 0.5, 1.5 + i * 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.g.forEach((el, i) => el.style.opacity = eo(seg(t, 7.4 + i * 0.4, 7.9 + i * 0.4)));
    const ctx = this.k.fx, c = this.c, z = eio(seg(t, 13.0, 16.0)) * (1 - eio(seg(t, 21.0, 23.5))), s = lerp(720, 2600, z), cy = lerp(566, 540 + 0.16 * s, z);
    ctx.save(); ctx.beginPath(); ctx.rect(110, 206, 1120, 726); ctx.clip();
    if (z > 0.01) { ctx.globalAlpha = 0.5 * z; ctx.strokeStyle = PS.mix(c.g, c.s, 0.4); ctx.lineWidth = 2; ctx.strokeRect(112, 208, 1116, 722); ctx.globalAlpha = 1; }
    GS.draw(ctx, this.G, { cx: 680, cy, s, yaw: lerp(-0.5, 0.4, eio(seg(t, 0, 24))), pitch: 0.12, grow: lerp(2.2, 1.6, z) });
    ctx.restore();
    const ga = eo(seg(t, 7.2, 8.2));
    if (ga > 0) { const u = [80, -40], v = [22, 50], br = 1 + 0.02 * Math.sin(t * 2); ctx.globalAlpha = ga; ctx.setTransform(u[0] * br, u[1] * br, v[0] * br, v[1] * br, DC[0], DC[1]); ctx.fillStyle = PS.mix(c.g, c.a, 0.55); ctx.beginPath(); ctx.arc(0, 0, 1, 0, PS.TAU); ctx.fill(); ctx.setTransform(1, 0, 0, 1, 0, 0); PS.arrow(ctx, DC[0], DC[1], DC[0] + u[0], DC[1] + u[1], c.m, 3, 12); PS.arrow(ctx, DC[0], DC[1], DC[0] + v[0], DC[1] + v[1], c.m, 3, 12); PS.dot(ctx, DC[0], DC[1], 6, c.s); ctx.globalAlpha = 1; }
  },
});