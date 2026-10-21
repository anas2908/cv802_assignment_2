const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('n-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">NKSR · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1700px;gap:14px">' +
      '<p class="eq n-recap-e" style="font-size:46px">Poisson’s recipe, with bumps a network has learned,</p>' +
      '<p class="eq n-recap-e" style="font-size:46px;color:var(--accent)">built only near the dots</p>' +
      '<p class="box hot n-recap-e" style="margin-top:24px;font-size:28px;width:1300px">pretrained, done in seconds, millions of triangles; as close as Poisson and best on MVS; but open, and it trusts every dot, noise included</p>' +
      '<p class="note warm n-recap-e" style="margin-top:18px;font-size:30px">next: Shape As Points, a Poisson solver that can be trained through</p></div>' +
      '<p class="cap">NKSR in one line: Poisson’s recipe of one linear system, with learned building blocks placed only near the dots.</p>' +
      '<p class="cap">Next on the roadmap: Shape As Points, which turns the Poisson step itself into something a network can learn through.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.n-recap-e');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 3.0, 7.2];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
  },
});