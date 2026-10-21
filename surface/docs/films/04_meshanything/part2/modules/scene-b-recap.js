const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('b-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:270px;width:1150px;gap:14px">' +
      '<p class="eq b-recap-e" style="font-size:46px">Poisson: solves for a surface</p>' +
      '<p class="eq b-recap-e" style="font-size:46px;color:var(--main)">IER: chooses triangles between our dots</p>' +
      '<p class="eq b-recap-e" style="font-size:46px;color:var(--accent)">MeshAnything: writes a new mesh, token by token</p>' +
      '<p class="box hot b-recap-e" style="margin-top:26px;font-size:28px">shape → 257 tokens → a transformer writes corners → a light artist mesh. On a real scan, feed it a clean dense mesh first.</p>' +
      '<p class="note warm b-recap-e" style="margin-top:18px;font-size:30px">next on the roadmap: Point2Mesh</p></div>' +
      '<p class="cap">MeshAnything in one line: turn the shape into 257 tokens, then let a transformer write a light mesh, corner by corner.</p>' +
      '<p class="cap">On a real scan, give it a clean dense mesh first. Next on the roadmap: Point2Mesh.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.b-recap-e');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 2.2, 4.0, 7.2];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const a = eo(seg(t, 0.4, 1.4));
    MA.draw(this.k.fx, 'v2', { c: this.c, cx: 1540, cy: 566, s: 620, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 14))), pitch: 0.1, edge: 0.7 * a, fill: a, lw: 1.1 });
  },
});