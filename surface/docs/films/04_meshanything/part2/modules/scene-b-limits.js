const { seg, eo, eio, lerp, TextFx } = kit;
const L = ['needs a clean dense mesh first: on the noisier MVS cloud, F@1% fell to 0.87', 'about 1,500 triangles: no room for a face, fingers or wrinkles', 'corners snap to 128 steps: on a 1.8 m person, about 1.4 cm each', 'a few holes and flipped triangles: not watertight, so not printable as is', 'one token at a time: about 45 seconds for some 6,000 tokens', 'strength: a light, tidy, artist-style mesh, ready for games and phones'];
const LT = [0.8, 3.0, 8.0, 10.2, 12.4, 15.2];
kit.scene('b-limits', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · Honest view</span><h2 class="line">Limits and strengths</h2></div>' +
      '<div class="words" style="left:110px;top:244px;width:1040px;gap:14px">' + L.map((s, i) => '<p class="box ' + (i === 5 ? 'hot ' : '') + 'b-limits-b">' + s + '</p>').join('') + '</div>' +
      '<p class="cap">MeshAnything has real limits. It needs a clean dense mesh to start from, and 1,500 triangles cannot hold a face or fingers.</p>' +
      '<p class="cap">Corners snap to 128 steps, a few triangles are missing or flipped, and writing one token at a time takes about 45 seconds.</p>' +
      '<p class="cap">Its strength: a light, tidy mesh like an artist would build, ready for games, phones and quick previews.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.b-limits-b');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.8, 15.0], t);
    this.b.forEach((el, i) => { const p = eo(seg(t, LT[i], LT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const a = eo(seg(t, 0.2, 1.2));
    MA.draw(this.k.fx, 'v2', { c: this.c, cx: 1520, cy: 566, s: 640, yaw: lerp(-0.6, PS.TAU - 0.6, seg(t, 0, 22)), pitch: 0.1, edge: 0.7 * a, fill: a, lw: 1.1 });
  },
});