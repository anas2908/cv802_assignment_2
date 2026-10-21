const { seg, eo, eob, lerp, TextFx } = kit;
const X = [110, 560, 1010, 1460], W = 360, Y = [292, 520], H = 120;
const TXT = ['our dots + arrows: 138,677 dots', 'rescaled to metres: a 1.75 m person', 'sparse voxels near the dots, at several sizes', 'network: features and a clean arrow per voxel', 'one linear system for all the weights', 'cut away what is far from the dots', 'zero surface → triangles (dual marching cubes)', 'each corner coloured by its nearest dot'];
const POS = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [0, 1]], BT = [0.8, 2.2, 8.4, 10.0, 11.6, 15.4, 17.0, 18.6];
kit.scene('n-pipe', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">NKSR · Pipeline</span><h2 class="line">The whole pipeline</h2></div>';
    TXT.forEach((s, i) => { const p = POS[i]; h += '<p class="box ' + (i === 4 ? 'hot ' : '') + 'n-pipe-b" style="left:' + X[p[0]] + 'px;top:' + Y[p[1]] + 'px;width:' + W + 'px;height:' + H + 'px;display:flex;align-items:center">' + s + '</p>'; });
    h += '<div class="words" style="left:110px;top:752px;width:1700px;align-items:center"><p class="eq n-pipe-e" style="font-size:44px">our whole scan: about 7 seconds on one GPU</p></div>' +
      '<p class="cap">The whole NKSR pipeline. First our dots and arrows, scaled so the person is 1.75 m tall, because the network was trained in metres.</p>' +
      '<p class="cap">Sparse voxels only near the dots, a network that gives them features and clean arrows, and one linear system for all the weights.</p>' +
      '<p class="cap">Then the far-away parts are cut, the zero surface is turned into triangles, and each corner takes the colour of its nearest dot.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line'); this.caps = [...kit.stage.querySelectorAll('.cap')]; this.b = [...kit.stage.querySelectorAll('.n-pipe-b')]; this.e = kit.stage.querySelector('.n-pipe-e').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 8.0, 15.0], t);
    this.b.forEach((el, i) => { const p = seg(t, BT[i], BT[i] + 0.5); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.9, 1, eob(p, 1.6)) + ')'; });
    this.e.opacity = eo(seg(t, 20.0, 20.6));
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