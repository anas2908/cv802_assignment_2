const { seg, eo, eio, lerp, TextFx } = kit;
const CX = 1610, CY = 540, SC = 600;
kit.scene('x-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1220px;gap:14px">' +
      '<p class="eq x-recap-e" style="font-size:46px">a printer needs a closed skin: every edge shared by two,</p>' +
      '<p class="eq x-recap-e" style="font-size:46px;color:var(--accent)">and four of our methods make one by design</p>' +
      '<p class="box hot x-recap-e" style="margin-top:24px;font-size:28px">layers need closed outlines; holes and fins break inside and outside; neighbours agree on which side is out; largest piece, up is +z, 180 mm, feet on the plate; Poisson (watertight), Point2Mesh, DHSP and SAP pass</p>' +
      '<p class="note warm x-recap-e" style="margin-top:18px;font-size:30px">next: the code pipeline that runs it all</p></div>' +
      '<p class="cap">3D printing in one line: a printer needs a closed skin where every edge is shared by two triangles, and four of our methods make one.</p>' +
      '<p class="cap">Next, the last stage of the roadmap: the code pipeline that runs every method, checks the results and packs them up.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.x-recap-e'); this.S = VW.mesh(kit, 'vw-dh.json');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 3.0, 7.2]; this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 0.3, 1.3));
    ctx.globalAlpha = a; ctx.fillStyle = PS.mix(c.g, c.m, 0.18); ctx.strokeStyle = PS.mix(c.g, c.m, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, CY + 0.5 * SC + 6, 200, 38, 0, 0, PS.TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    MESH.draw(ctx, this.S, { c, cx: CX, cy: CY, s: SC, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 14))), pitch: 0.08, colors: this.S.C, edge: 0, fill: a });
  },
});
