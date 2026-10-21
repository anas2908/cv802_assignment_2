const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('c-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · Part 1 recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1220px;gap:14px">' +
      '<p class="eq c-recap-e" style="font-size:46px">every method is wrapped to leave the same files,</p>' +
      '<p class="eq c-recap-e" style="font-size:46px;color:var(--accent)">and one finalizer makes them a checked mesh</p>' +
      '<p class="box hot c-recap-e" style="margin-top:24px;font-size:28px">setup.sh: an environment, the official code at a fixed version, weights, a self-test; run.sh: thin out, centre and scale, run, put back; finalize: clean, texture, measure, render, and manifest.json last</p>' +
      '<p class="note warm c-recap-e" style="margin-top:18px;font-size:30px">next, Part 2: running all 113 runs on the cluster</p></div>' +
      '<p class="cap">Part 1 in one line: each method is wrapped to leave the same files, and one shared finalizer turns them into a checked, textured mesh.</p>' +
      '<p class="cap">Next, in Part 2: how all 113 runs were started, queued and watched on the cluster, and how the results were packed.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.c-recap-e'); this.S = VW.mesh(kit, 'vw-dh.json');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 3.0, 7.2]; this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    MESH.draw(this.k.fx, this.S, { c: this.c, cx: 1610, cy: 566, s: 640, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 14))), pitch: 0.08, colors: this.S.C, edge: 0, fill: eo(seg(t, 0.3, 1.3)) });
  },
});
