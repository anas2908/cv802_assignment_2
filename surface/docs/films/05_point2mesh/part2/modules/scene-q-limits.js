const { seg, eo, eio, lerp, TextFx } = kit;
const L = ['slow: about 42 minutes on our GPU, where the others take seconds', 'it must cover every dot: stray dots pull out membranes', 'needs good arrows: flipped ones held the default run back', 'folds where the skin turns inside out: the red patches', 'detail is capped by 10,000 triangles; more did not help', 'strengths: always closed, smooth, no training data, ready to 3D print'];
const LT = [0.8, 2.6, 4.4, 8.0, 9.8, 14.0];
kit.scene('q-limits', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Honest view</span><h2 class="line">Limits and strengths</h2></div>' +
      '<div class="words" style="left:110px;top:244px;width:1080px;gap:14px">' + L.map((s, i) => '<p class="box ' + (i === 5 ? 'hot ' : '') + 'q-limits-b">' + s + '</p>').join('') + '</div>' +
      '<p class="cap">Point2Mesh has clear limits: it is slow, it must cover every stray dot, and it depends on good arrows.</p>' +
      '<p class="cap">Folds can appear, and its 10,000 triangles hold far less detail than the million of our Poisson mesh.</p>' +
      '<p class="cap">Its strengths: the mesh is always closed and smooth, it needs no training data, and it is ready to 3D print.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.q-limits-b');
    this.S = MESH.at(MESH.stage(MESH.load(kit, 'p2m-s4.json')), 1);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.6, 13.8], t);
    this.b.forEach((el, i) => { const p = eo(seg(t, LT[i], LT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const a = eo(seg(t, 0.2, 1.2));
    MESH.draw(this.k.fx, this.S, { c: this.c, cx: 1560, cy: 566, s: 640, yaw: lerp(-0.6, PS.TAU - 0.6, seg(t, 0, 20)), pitch: 0.12, edge: 0.35 * a, fill: a, lw: 0.6 });
  },
});