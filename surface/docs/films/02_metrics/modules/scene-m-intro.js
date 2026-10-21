const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('m-intro', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">How do we score a mesh?</h2></div>' +
      '<p class="note m-intro-n1" style="left:230px;top:350px;color:var(--second)">input dots</p>' +
      '<p class="note m-intro-n2" style="left:230px;top:482px">our mesh</p>' +
      '<p class="note warm m-intro-n3" style="left:788px;top:528px">hole</p>' +
      '<p class="note warm m-intro-n4" style="left:1530px;top:528px">no dots here</p>' +
      '<p class="cap">There is no perfect 3D scan of the person to compare against.</p>' +
      '<p class="cap">So we score every mesh against its own input dots. Here is a simple example, seen from the side.</p>' +
      '<p class="cap">The mesh follows the dots, but it has a hole, and it carries on where there are no dots at all.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.n = [1, 2, 3, 4].map(i => kit.stage.querySelector('.m-intro-n' + i).style);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    PS.caps(this.caps, [0.3, 4.6, 9.2], t);
    const ctx = this.k.fx, c = this.c;
    TOY.dots(ctx, c, i => eo(seg(t, -0.6 + i * 0.12, -0.1 + i * 0.12)));
    TOY.mesh(ctx, c, eio(seg(t, 4.8, 7.2)));
    TOY.bracket(ctx, c, 700, 960, 512, eo(seg(t, 9.6, 10.4)));
    TOY.bracket(ctx, c, 1460, 1760, 512, eo(seg(t, 10.8, 11.6)));
    this.n[0].opacity = eo(seg(t, 3.2, 3.8));
    this.n[1].opacity = eo(seg(t, 7.0, 7.6));
    this.n[2].opacity = eo(seg(t, 10.0, 10.6));
    this.n[3].opacity = eo(seg(t, 11.2, 11.8));
  },
});