const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 0.685;
kit.scene('a-ours', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · Our scan</span><h2 class="line">The same person, two meshes</h2></div>' +
      '<div class="a-ours-win" style="position:absolute;left:230px;top:226px;width:' + Math.round(354 * SC) + 'px;height:' + Math.round(1022 * SC) + 'px;overflow:hidden;border-radius:10px;border:2px solid color-mix(in srgb, var(--main) 40%, var(--ground))">' +
      '<img class="a-ours-img" src="' + kit.assets.url('poisson_wire.png') + '" style="position:absolute;left:' + Math.round(-846 * SC) + 'px;top:' + Math.round(-190 * SC) + 'px;width:' + Math.round(2400 * SC) + 'px;height:' + Math.round(1350 * SC) + 'px;transform-origin:' + Math.round(1023 * SC) + 'px ' + Math.round(700 * SC) + 'px"></div>' +
      '<div class="words a-ours-p" style="left:540px;top:430px;width:420px"><p class="eq num">1,023,553</p><p class="note">triangles · Poisson (ours)</p></div>' +
      '<div class="words a-ours-m" style="left:1430px;top:430px;width:420px"><p class="eq num" style="color:var(--accent)">1,435</p><p class="note warm">triangles · MeshAnything</p></div>' +
      '<div class="words a-ours-r" style="left:1430px;top:600px;width:420px"><p class="eq" style="font-size:44px">about 700 times fewer</p></div>' +
      '<p class="cap">On the left, our own Poisson mesh from Video 1 as a wireframe: so many triangles that they blur into cloth.</p>' +
      '<p class="cap">On the right, MeshAnything on the same scan. Every single triangle is big enough to see.</p>' +
      '<p class="cap">About 700 times fewer triangles for the same person. Light enough for a game, though fine detail is lost.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.win = kit.stage.querySelector('.a-ours-win').style; this.img = kit.stage.querySelector('.a-ours-img').style;
    this.p = kit.stage.querySelector('.a-ours-p').style; this.m = kit.stage.querySelector('.a-ours-m').style; this.r = kit.stage.querySelector('.a-ours-r').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.4, 10.4], t);
    const w = eo(seg(t, 0.6, 1.4)); this.win.opacity = w; this.win.transform = 'translateY(' + (1 - w) * 20 + 'px)';
    this.img.transform = 'scale(' + lerp(1, 1.025, eio(seg(t, 0.6, 16))) + ')';
    const fade = (st, a) => { const p = eo(seg(t, a, a + 0.5)); st.opacity = p; st.transform = 'translateX(' + (1 - p) * 26 + 'px)'; };
    fade(this.p, 1.8); fade(this.m, 7.4); fade(this.r, 10.6);
    const q = eo(seg(t, 5.6, 6.8));
    if (q > 0) MA.draw(this.k.fx, 'v2', { c: this.c, cx: 1200, cy: 576, s: 690, yaw: lerp(0.35, -0.35, eio(seg(t, 5.6, 16))), pitch: 0.1, edge: 0.85 * q, fill: q, lw: 1.4 });
  },
});