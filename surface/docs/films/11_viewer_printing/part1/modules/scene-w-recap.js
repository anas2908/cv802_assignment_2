const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('w-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The viewer · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1220px;gap:14px">' +
      '<p class="eq w-recap-e" style="font-size:46px">one command opens every result in the browser,</p>' +
      '<p class="eq w-recap-e" style="font-size:46px;color:var(--accent)">seen four ways, side by side, from one camera</p>' +
      '<p class="box hot w-recap-e" style="margin-top:24px;font-size:28px">a Python server that only reads; OBJ corners, triangles and texture spots; light copies above 200,000 triangles; textured, shaded, wireframe and dots; one shared camera; one table with the same metrics for every run</p>' +
      '<p class="note warm w-recap-e" style="margin-top:18px;font-size:30px">next, Part 2: printing our meshes in 3D</p></div>' +
      '<p class="cap">The viewer in one line: one command opens every result in the browser, to be seen four ways and compared side by side.</p>' +
      '<p class="cap">Next, in Part 2: which of our meshes can be 3D printed, and what a mesh needs before a printer will take it.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.w-recap-e');
    this.S = VW.mesh(kit, 'vw-dh.json');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 3.0, 7.2];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    MESH.draw(this.k.fx, this.S, { c: this.c, cx: 1610, cy: 566, s: 640, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 14))), pitch: 0.08, colors: this.S.C, tint: this.c.m, edge: 0.55, lw: 0.7, fill: eo(seg(t, 0.3, 1.3)) });
  },
});
