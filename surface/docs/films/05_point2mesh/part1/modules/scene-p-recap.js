const { seg, eo, eob, lerp, TextFx } = kit;
const BX = [105, 470, 835, 1200, 1565], BY = 300;
const TXT = ['30,000 dots with arrows', 'convex hull: 2,000 triangles', 'a random mesh CNN pushes every corner', 'loss: gap + arrows + evenness', 'rebuilt 1.5× every 1,000 steps: 10,000 triangles'];
kit.scene('p-recap', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Recap</span><h2 class="line">Part 1 in one line</h2></div>';
    TXT.forEach((s, i) => { h += '<p class="box ' + (i === 4 ? 'hot ' : '') + 'p-recap-b" style="left:' + BX[i] + 'px;top:' + BY + 'px;width:300px;height:134px;display:flex;align-items:center">' + s + '</p>'; });
    h += '<div class="words" style="left:110px;top:510px;width:1700px;gap:12px">' +
      '<p class="eq p-recap-e" style="font-size:46px;color:var(--second)">Poisson solves, IER chooses, MeshAnything writes,</p>' +
      '<p class="eq p-recap-e" style="font-size:46px;color:var(--accent)">Point2Mesh shrink-wraps, with a network trained on this scan alone</p>' +
      '<p class="note warm p-recap-e" style="font-size:30px;margin-top:22px">Part 2: why the arrows’ direction mattered, stray dots, our runs</p></div>' +
      '<p class="cap">Point2Mesh in one line: start from the hull and let a fresh, untrained network pull it onto the dots.</p>' +
      '<p class="cap">Its one shared filter prefers clean shapes, so it fits the body before the noise. Part 2: what happened on our scan.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.b = [...kit.stage.querySelectorAll('.p-recap-b')]; this.e = [...kit.stage.querySelectorAll('.p-recap-e')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6], t);
    this.b.forEach((el, i) => { const p = seg(t, 0.6 + i * 0.6, 1.1 + i * 0.6); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.9, 1, eob(p, 1.6)) + ')'; });
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 4; i++) { const p = eo(seg(t, 1.0 + i * 0.6, 1.4 + i * 0.6)); if (p > 0) { ctx.globalAlpha = p; PS.arrow(ctx, BX[i] + 306, BY + 56, BX[i] + 306 + 52 * p, BY + 56, c.a, 3, 11); ctx.globalAlpha = 1; } }
    this.e.forEach((el, i) => { const p = eo(seg(t, 4.4 + i * 0.7, 4.9 + i * 0.7)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
  },
});