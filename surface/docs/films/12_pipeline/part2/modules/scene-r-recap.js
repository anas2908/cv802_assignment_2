const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('r-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1220px;gap:14px">' +
      '<p class="eq r-recap-e" style="font-size:46px">one queue runs every step on one locked GPU,</p>' +
      '<p class="eq r-recap-e" style="font-size:46px;color:var(--accent)">then picks, packs and reports the results itself</p>' +
      '<p class="box hot r-recap-e" style="margin-top:24px;font-size:28px">never on the login node; node_run.sh and one allocation; a GPU lock; a queue that skips finished steps and survives failures; photo texture, print export, best run; three inputs, 113 runs; viewer zips; report and slides from results.json</p>' +
      '<p class="note warm r-recap-e" style="margin-top:18px;font-size:30px">that is the whole roadmap: dots in, textured, measured, printable meshes out</p></div>' +
      '<p class="cap">Part 2 in one line: one queue runs every step on one locked GPU, then picks, packs and reports the results by itself.</p>' +
      '<p class="cap">And that completes the roadmap: from the dots of Sub-project 1 to textured, measured, viewable and printable meshes.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.r-recap-e'); this.S = VW.mesh(kit, 'vw-dh.json');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0], t);
    const ET = [0.6, 1.4, 3.0, 7.4]; this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 0.3, 1.3));
    ctx.globalAlpha = a; ctx.fillStyle = PS.mix(c.g, c.m, 0.18); ctx.strokeStyle = PS.mix(c.g, c.m, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(1610, 846 + 6, 200, 38, 0, 0, PS.TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    MESH.draw(ctx, this.S, { c, cx: 1610, cy: 546, s: 600, yaw: lerp(-0.5, 0.8, eio(seg(t, 0, 14))), pitch: 0.08, colors: this.S.C, edge: 0, fill: a });
  },
});
