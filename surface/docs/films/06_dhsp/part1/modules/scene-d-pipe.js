const { seg, eo, eob, lerp, TextFx } = kit;
const X = [110, 560, 1010, 1460], W = 360, Y = [292, 520], H = 120;
const TXT = ['coloured dots from the scan', '1 · 3D self-prior: shape, 16,000 triangles', '2 · flatten: the OptCuts UV map', '3 · 2D geometry prior: complete the shape picture', '4 · read back, then 3D polish', '5 · flatten the polished mesh again', '6 · 2D texture prior: paint the colours', 'a textured mesh, made from dots alone'];
const POS = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [0, 1]], BT = [0.8, 2.0, 3.6, 5.2, 7.4, 9.0, 10.6, 12.4];
kit.scene('d-pipe', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">DHSP · Recipe</span><h2 class="line">The whole pipeline</h2></div>';
    TXT.forEach((s, i) => { const p = POS[i]; h += '<p class="box ' + (i === 0 || i === 7 ? 'hot ' : '') + 'd-pipe-b" style="left:' + X[p[0]] + 'px;top:' + Y[p[1]] + 'px;width:' + W + 'px;height:' + H + 'px;display:flex;align-items:center">' + s + '</p>'; });
    h += '<div class="words" style="left:110px;top:752px;width:1700px;align-items:center"><p class="eq d-pipe-e" style="font-size:44px">a 3D prior for the overall shape, 2D priors for detail and colour</p></div>' +
      '<p class="cap">The whole DHSP recipe, as its authors give it, in six steps.</p>' +
      '<p class="cap">First the 3D prior makes the shape. Then the mesh is flattened, and a 2D prior completes a picture of the shape.</p>' +
      '<p class="cap">Read back and polished in 3D, flattened again, and a second 2D prior paints the texture. Every network trains on this scan alone.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line'); this.caps = [...kit.stage.querySelectorAll('.cap')]; this.b = [...kit.stage.querySelectorAll('.d-pipe-b')]; this.e = kit.stage.querySelector('.d-pipe-e').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 3.2, 10.0], t);
    this.b.forEach((el, i) => { const p = seg(t, BT[i], BT[i] + 0.5); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.9, 1, eob(p, 1.6)) + ')'; });
    this.e.opacity = eo(seg(t, 14.4, 15.0));
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 7; i++) {
      const p = eo(seg(t, BT[i + 1] - 0.4, BT[i + 1])); if (p <= 0) continue; ctx.globalAlpha = p;
      const a = POS[i], b = POS[i + 1];
      if (a[1] === b[1]) { const dir = b[0] > a[0] ? 1 : -1, y = Y[a[1]] + H / 2, x0 = dir > 0 ? X[a[0]] + W + 8 : X[a[0]] - 8, x1 = dir > 0 ? X[b[0]] - 8 : X[b[0]] + W + 8; PS.arrow(ctx, x0, y, lerp(x0, x1, p), y, c.a, 3, 11); }
      else { const x = X[a[0]] + W / 2, y0 = Y[0] + H + 8, y1 = Y[1] - 8; PS.arrow(ctx, x, y0, x, lerp(y0, y1, p), c.a, 3, 11); }
      ctx.globalAlpha = 1;
    }
  },
});