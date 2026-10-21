const { seg, eo, eio, lerp, TextFx } = kit;
const XS = [...Array(9)].map((_, k) => 420 + k * 140), DY = 420, TY = 478, BAD = [3, 6];
kit.scene('m-psnr', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Do the colours match?</h2></div>' +
      '<p class="note m-psnr-a1" style="left:150px;top:402px;color:var(--second)">dot</p>' +
      '<p class="note m-psnr-a1" style="left:150px;top:488px;color:var(--second)">texture</p>' +
      '<div class="words m-psnr-a2" style="left:420px;top:640px;gap:12px">' +
      '<p class="note" style="position:static;font-size:30px">colours close  →  high score</p>' +
      '<p class="note warm" style="position:static;font-size:30px">colours far apart (yellow boxes)  →  lower score</p></div>' +
      '<img class="m-psnr-img" src="' + kit.assets.url('texture.jpg') + '" style="position:absolute;left:310px;top:236px;width:1300px;height:596px;border-radius:6px">' +
      '<p class="note m-psnr-b" style="left:340px;top:850px;font-size:22px;color:var(--second)">dot colours: 19.5 dB</p>' +
      '<p class="note warm m-psnr-b" style="left:652px;top:850px;font-size:22px">photos (ours): 18.0 dB</p>' +
      '<p class="cap">Every dot has its own colour. We compare it with the texture colour right next to it on the mesh.</p>' +
      '<p class="cap">Close colours give a high score, big differences a low one. This score is called PSNR, in decibels.</p>' +
      '<p class="cap">Surprise: our photo texture looks far sharper, yet it scores a little lower than plain dot colours.</p>' +
      '<p class="cap">The score compares against the dots’ own blurry colours, and sharp detail disagrees with blur. So we judge looks from the pictures.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.a1 = [...kit.stage.querySelectorAll('.m-psnr-a1')]; this.a2 = kit.stage.querySelector('.m-psnr-a2').style;
    this.img = kit.stage.querySelector('.m-psnr-img').style; this.b = [...kit.stage.querySelectorAll('.m-psnr-b')];
    const c = this.c, base = [PS.mix(c.s, c.a, 0.25), PS.mix(c.s, c.g, 0.15), PS.mix(c.a, c.g, 0.35), PS.mix(c.s, c.m, 0.2), PS.mix(c.g, c.s, 0.25), PS.mix(c.m, c.g, 0.5), PS.mix(c.s, c.a, 0.45), PS.mix(c.g, c.m, 0.3), PS.mix(c.s, c.g, 0.3)];
    this.dc = base;
    this.tc = base.map((col, i) => i === 3 ? PS.mix(c.m, c.g, 0.55) : i === 6 ? PS.mix(c.g, c.s, 0.55) : col);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 4.4, 8.6, 12.8], t);
    const ctx = this.k.fx, c = this.c;
    const A = eo(seg(t, 0.4, 1.0)) * (1 - seg(t, 8.2, 8.7));
    this.a1.forEach(e => e.style.opacity = A);
    this.a2.opacity = eo(seg(t, 4.8, 5.4)) * (1 - seg(t, 8.2, 8.7));
    if (A > 0) XS.forEach((x, i) => {
      const p = eo(seg(t, 0.6 + i * 0.15, 1.0 + i * 0.15)), q = eo(seg(t, 2.2 + i * 0.15, 2.6 + i * 0.15));
      ctx.globalAlpha = A * p; PS.dot(ctx, x, DY, 22, this.dc[i]); ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, DY, 22, 0, PS.TAU); ctx.stroke();
      ctx.globalAlpha = A * q; ctx.fillStyle = this.tc[i]; ctx.fillRect(x - 26, TY, 52, 52); ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.strokeRect(x - 26, TY, 52, 52);
      if (BAD.includes(i)) { const r = eo(seg(t, 5.2, 5.8)); ctx.globalAlpha = A * r; ctx.strokeStyle = c.a; ctx.lineWidth = 5; ctx.strokeRect(x - 36, DY - 32, 72, TY + 62 - (DY - 32)); }
      ctx.globalAlpha = 1;
    });
    const B = eo(seg(t, 8.6, 9.4));
    this.img.opacity = B; this.img.transform = 'scale(' + lerp(1, 1.02, seg(t, 8.6, 17)) + ')';
    this.b.forEach((e, i) => e.style.opacity = eo(seg(t, 9.6 + i * 0.6, 10.2 + i * 0.6)));
  },
});