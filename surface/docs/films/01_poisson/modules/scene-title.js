const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('title', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head" style="top:300px;width:820px">' +
      '<span class="tag title-tag">CV802 · Sub-project 2</span>' +
      '<h1 class="line big">Screened Poisson reconstruction</h1>' +
      '<p class="sub title-sub">From loose dots to a closed skin, in ten steps</p></div></div>'));
    this.k = kit;
    this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.tag = kit.stage.querySelector('.title-tag').style;
    this.sub = kit.stage.querySelector('.title-sub').style;
    this.pts = PS.cloud(1900, 11);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.75);
    this.tag.opacity = eo(seg(t, -0.6, 0.0));
    this.sub.opacity = eo(seg(t, -0.3, 0.3));
    this.sub.transform = 'translateX(' + (1 - eo(seg(t, -0.3, 0.3))) * 26 + 'px)';
    const ctx = this.k.fx, c = this.c;
    const yaw = 0.35 + 0.42 * t;
    const sc = 430 * (1 + 0.012 * Math.sin(t * 2.0));
    const gather = eo(seg(t, -1.2, 1.4));
    const P = this.pts.map((p, i) => {
      const q = PS.project(p, yaw, sc, 1350, 560);
      const a = (i * 2.399) % PS.TAU, d = (1 - gather) * 140 * (0.4 + (i % 7) / 7);
      return [q[0] + Math.cos(a) * d, q[1] + Math.sin(a) * d, q[2], p.k];
    }).sort((A, B) => A[2] - B[2]);
    for (const q of P) {
      const depth = 0.35 + 0.65 * Math.min(1, Math.max(0, (q[2] + 0.3) / 0.6));
      const base = q[3] === 'legs' ? c.m : q[3] === 'skin' ? PS.mix(c.s, c.a, 0.55).replace(/,1\)$/, ',1)') : c.s;
      ctx.globalAlpha = depth * gather;
      ctx.fillStyle = base;
      ctx.beginPath(); ctx.arc(q[0], q[1], 2.5, 0, PS.TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
});