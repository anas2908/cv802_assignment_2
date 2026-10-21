const { seg, eo, eob, lerp, TextFx } = kit;
const BX = [105, 470, 835, 1200, 1565], BY = 300;
const TXT = ['8,192 dots with arrows', '257 shape tokens, like a prompt', 'a transformer writes corner numbers', 'strips of triangles, a &amp; between them', 'an artist mesh: 1,435 triangles'];
kit.scene('a-recap', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">MeshAnything · Recap</span><h2 class="line">Part 1 in one line</h2></div>';
    TXT.forEach((s, i) => { h += '<p class="box ' + (i === 4 ? 'hot ' : '') + 'a-recap-b" style="left:' + BX[i] + 'px;top:' + BY + 'px;width:300px;height:104px;display:flex;align-items:center">' + s + '</p>'; });
    h += '<div class="words" style="left:110px;top:500px;width:1700px;gap:12px">' +
      '<p class="eq a-recap-e" style="font-size:46px;color:var(--second)">Poisson: solves for a surface</p>' +
      '<p class="eq a-recap-e" style="font-size:46px;color:var(--main)">IER: chooses triangles between our dots</p>' +
      '<p class="eq a-recap-e" style="font-size:46px;color:var(--accent)">MeshAnything: writes a new mesh, token by token</p>' +
      '<p class="note warm a-recap-e" style="font-size:30px;margin-top:22px">Part 2: training, why our raw dots failed, our experiments</p></div>' +
      '<p class="cap">MeshAnything in one line: describe the shape as 257 tokens, then let a transformer write the mesh one corner at a time.</p>' +
      '<p class="cap">Three methods, three ideas: solve, choose, write. Part 2 shows how it was trained and what happened on our scan.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.b = [...kit.stage.querySelectorAll('.a-recap-b')]; this.e = [...kit.stage.querySelectorAll('.a-recap-e')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6], t);
    this.b.forEach((el, i) => { const p = seg(t, 0.6 + i * 0.6, 1.1 + i * 0.6); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.9, 1, eob(p, 1.6)) + ')'; });
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 4; i++) { const p = eo(seg(t, 1.0 + i * 0.6, 1.4 + i * 0.6)); if (p > 0) { ctx.globalAlpha = p; PS.arrow(ctx, BX[i] + 306, BY + 52, BX[i] + 306 + 52 * p, BY + 52, c.a, 3, 11); ctx.globalAlpha = 1; } }
    this.e.forEach((el, i) => { const p = eo(seg(t, 4.4 + i * 0.7, 4.9 + i * 0.7)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
  },
});