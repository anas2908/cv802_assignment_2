const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('j-limits', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 2</span><h2 class="line">Where IER struggles</h2></div>' +
      '<div class="words" style="left:110px;top:280px;width:820px;gap:16px">' +
      '<p class="box j-limits-b">Holes: where no candidate passed every check, the mesh stays open. Not watertight, so not printable.</p>' +
      '<p class="box j-limits-b">Red triangles: each one is picked on its own, so front and back sides are mixed. Our photo texturing needed a two-sided mode.</p>' +
      '<p class="box j-limits-b">Only 12,500 of our 138,677 dots are used, so it carries less detail than Poisson.</p>' +
      '<p class="box hot j-limits-b">Strengths: fast (29 s), our real dots as corners, and no triangles bridging gaps like arm to chest.</p></div>' +
      '<p class="note j-limits-l" style="left:1000px;top:198px;color:var(--second)">zoom on the shaded IER mesh (red = a triangle’s back side)</p>' +
      '<div class="j-limits-win" style="position:absolute;left:1000px;top:240px;width:760px;height:650px;overflow:hidden;border-radius:10px">' +
      '<img class="j-limits-img" src="' + kit.assets.url('ier_shaded.png') + '" style="position:absolute;left:-380px;top:-356px;width:1520px;height:2027px;transform-origin:760px 680px"></div>' +
      '<p class="cap">Up close, two problems show. First, holes: where no candidate passed all the checks, the mesh stays open.</p>' +
      '<p class="cap">Second, red triangles. Each triangle is picked on its own, so their front and back sides are not consistent.</p>' +
      '<p class="cap">And IER uses only 12,500 of our 138,677 dots, so it carries less detail than Poisson.</p>' +
      '<p class="cap">Its strengths: it is fast, its corners are our real dots, and it refuses to bridge gaps like arm to chest.</p></div>'));
    this.k = kit;
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.b = [...kit.stage.querySelectorAll('.j-limits-b')];
    this.l = kit.stage.querySelector('.j-limits-l').style; this.win = kit.stage.querySelector('.j-limits-win').style; this.img = kit.stage.querySelector('.j-limits-img').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 6.0, 12.0, 17.0], t);
    const at = [0.8, 6.2, 12.2, 17.2];
    this.b.forEach((e, i) => { const p = eo(seg(t, at[i], at[i] + 0.5)); e.style.opacity = p; e.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    this.win.opacity = eo(seg(t, 0.4, 1.0)); this.l.opacity = eo(seg(t, 0.6, 1.1));
    this.img.transform = 'scale(' + lerp(1, 1.06, seg(t, 0, 22)) + ')';
  },
});