const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('i-problem', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 1</span><h2 class="line">The catch</h2></div>' +
      '<div class="words" style="left:110px;top:300px;width:660px;gap:18px">' +
      '<p class="box i-problem-b1">Training: on about 23,000 shapes whose true surface is known, the real ratio and label of every candidate are computed.</p>' +
      '<p class="box hot i-problem-b2">Use: on our scan there is no surface yet. The network sees only the dots and has to guess each label.</p></div>' +
      '<p class="eq i-problem-nx" style="left:110px;top:800px;font-size:44px;color:var(--accent)">Next, Part 2: the network, and building the mesh</p>' +
      '<p class="cap">There is a catch. To measure the walking distance you need the surface, and the surface is exactly what we are missing.</p>' +
      '<p class="cap">So IER learns it instead. A neural network looks only at the dots and guesses each candidate’s label: good, okay or bad.</p>' +
      '<p class="cap">Part 2 shows how that network looks at the dots, and how the chosen triangles are joined into one mesh.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.i-problem-' + k).style;
    this.b1 = q('b1'); this.b2 = q('b2'); this.nx = q('nx');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 5.0, 10.0], t);
    const ctx = this.k.fx, c = this.c, A = IW.ARM, C = IW.CH;
    IW.dots(ctx, c, i => eo(seg(t, 0.3 + i * 0.02, 0.7 + i * 0.02)));
    const q = eo(seg(t, 1.8, 2.6));
    if (q > 0) {
      ctx.globalAlpha = q; ctx.setLineDash([6, 10]); ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(IW.AC[0], IW.AC[1], IW.AR, Math.PI / 2, -Math.PI / 2, true); ctx.stroke(); ctx.setLineDash([]);
      PS.dot(ctx, A[0][0], A[0][1], 14, c.a);
      ctx.font = '700 64px ' + this.mono; ctx.fillStyle = c.a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', IW.AC[0] + 175, IW.AC[1] - 20 + 6 * Math.sin(t * 2.2));
      ctx.globalAlpha = 1;
    }
    this.b1.opacity = eo(seg(t, 5.4, 6.0)); this.b2.opacity = eo(seg(t, 7.4, 8.0)); this.nx.opacity = eo(seg(t, 10.4, 11.0));
  },
});