const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('s-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">SAP · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1700px;gap:14px">' +
      '<p class="eq s-recap-e" style="font-size:46px">the shape is a set of points with arrows,</p>' +
      '<p class="eq s-recap-e" style="font-size:46px;color:var(--accent)">turned into a surface by a Poisson solve smooth enough to learn through</p>' +
      '<p class="box hot s-recap-e" style="margin-top:24px;font-size:28px;width:1300px">FFT Poisson in one step; points nudged by the gap to our dots; closed and accurate without our arrows; stray dots become blobs</p>' +
      '<p class="note warm s-recap-e" style="margin-top:18px;font-size:30px">next: 2D Gaussian Splatting, which learns from the photos instead</p></div>' +
      '<p class="cap">SAP in one line: the shape is a set of points with arrows, and a differentiable Poisson solve lets those points learn.</p>' +
      '<p class="cap">Next on the roadmap: 2D Gaussian Splatting, the one method that learns from our photos rather than our dots.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.s-recap-e');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 3.0, 7.2];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
  },
});