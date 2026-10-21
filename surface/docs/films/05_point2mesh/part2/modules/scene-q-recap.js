const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('q-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:270px;width:1180px;gap:14px">' +
      '<p class="eq q-recap-e" style="font-size:46px">Poisson solves, IER chooses, MeshAnything writes,</p>' +
      '<p class="eq q-recap-e" style="font-size:46px;color:var(--accent)">Point2Mesh shrink-wraps</p>' +
      '<p class="box hot q-recap-e" style="margin-top:26px;font-size:28px">hull → a fresh, untrained network pulls it onto the dots → rebuilt finer every 1,000 steps. On a real scan: unoriented arrows and a clean cloud.</p>' +
      '<p class="note warm q-recap-e" style="margin-top:18px;font-size:30px">next on the roadmap: DHSP, which builds on Point2Mesh</p></div>' +
      '<p class="cap">Point2Mesh in one line: shrink-wrap the dots, guided by a network trained on this one scan alone.</p>' +
      '<p class="cap">On our scan, unoriented arrows and a clean cloud mattered most. Next: DHSP, which builds on Point2Mesh.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.q-recap-e');
    this.S = MESH.at(MESH.stage(MESH.load(kit, 'p2m-s4.json')), 1);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 3.6, 7.2];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const a = eo(seg(t, 0.4, 1.4));
    MESH.draw(this.k.fx, this.S, { c: this.c, cx: 1580, cy: 566, s: 620, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 14))), pitch: 0.12, edge: 0.35 * a, fill: a, lw: 0.6 });
  },
});