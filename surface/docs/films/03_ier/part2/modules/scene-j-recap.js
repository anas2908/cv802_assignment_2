const { seg, eo, eob, lerp, TextFx } = kit;
const BX = [105, 470, 835, 1200, 1565], BY = 320;
const TXT = ['our dots (12,500 of them)', 'candidates from 50 neighbours', 'network labels: good, okay, bad', 'sorted, then added greedily', 'a mesh made of our own dots'];
kit.scene('j-recap', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">IER · Recap</span><h2 class="line">IER in one line</h2></div>';
    TXT.forEach((s, i) => { h += '<p class="box ' + (i === 4 ? 'hot ' : '') + 'j-recap-b" style="left:' + BX[i] + 'px;top:' + BY + 'px;width:300px;height:104px;display:flex;align-items:center">' + s + '</p>'; });
    h += '<div class="words" style="left:110px;top:540px;width:1700px;gap:14px">' +
      '<p class="eq j-recap-e" style="font-size:46px;color:var(--second)">Poisson: solves for a brand-new surface</p>' +
      '<p class="eq j-recap-e" style="font-size:46px;color:var(--main)">IER: chooses triangles between our own dots</p>' +
      '<p class="note warm j-recap-e" style="font-size:30px;margin-top:20px">next method on the roadmap: MeshAnything</p></div>' +
      '<p class="cap">IER in one line: propose triangles between nearby dots, let a trained network judge them, keep the best ones that fit together.</p>' +
      '<p class="cap">Poisson solves for a new surface. IER chooses among triangles of our own dots. Two very different answers to the same question.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.b = [...kit.stage.querySelectorAll('.j-recap-b')]; this.e = [...kit.stage.querySelectorAll('.j-recap-e')];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4], t);
    this.b.forEach((el, i) => { const p = seg(t, 0.6 + i * 0.6, 1.1 + i * 0.6); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.9, 1, eob(p, 1.6)) + ')'; });
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 4; i++) { const p = eo(seg(t, 1.0 + i * 0.6, 1.4 + i * 0.6)); if (p > 0) { ctx.globalAlpha = p; PS.arrow(ctx, BX[i] + 306, BY + 52, BX[i] + 306 + 52 * p, BY + 52, c.a, 3, 11); ctx.globalAlpha = 1; } }
    this.e.forEach((el, i) => el.style.opacity = eo(seg(t, 6.6 + i * 0.8, 7.1 + i * 0.8)));
  },
});