const { seg, eo, eio, lerp, TextFx } = kit;
const VW = 1720, IW = 3288, IT = 86;
const G = [['Input', '138,677 dots', 8, 203], ['Poisson', '1,023,553 triangles', 211, 587], ['IER', '17,488 triangles', 595, 976], ['Point2Mesh', '10,000 triangles', 984, 1362],
  ['MeshAnything', '1,435 triangles', 1370, 1741], ['DHSP', '6,000 triangles', 1749, 2136], ['NKSR', '2,088,273 triangles', 2144, 2518], ['SAP', '64,168 triangles', 2526, 2896], ['2DGS', '657,447 triangles', 2904, 3280]];
const STOPS = [[0, -50], [5.4, -50], [7.4, 760], [12.4, 760], [14.4, IW - VW + 50]];
kit.scene('t-all', {
  init(kit) {
    let lab = '', hl = '';
    G.forEach(([n, s, a, b], i) => {
      lab += '<div class="words" style="left:' + a + 'px;top:4px;width:' + (b - a) + 'px;gap:6px;align-items:center"><p class="note" style="font-family:var(--sans);font-size:28px;color:var(--second)">' + n + '</p><p class="note' + (i === 4 ? ' warm' : '') + '" style="font-size:20px">' + s + '</p></div>';
      if (i > 4) { const m = Math.round((a + b) / 2) + 2; hl += '<div class="t-all-s" style="position:absolute;left:' + (m - 4) + 'px;top:' + (IT - 4) + 'px;width:' + (b - m + 8) + 'px;height:628px;box-sizing:border-box;border:3px solid var(--main);border-radius:8px"></div>'; }
    });
    const mask = 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Photo texturing · Every method</span><h2 class="line">All eight methods</h2></div>' +
      '<div class="t-all-v" style="position:absolute;left:100px;top:210px;width:' + VW + 'px;height:720px;overflow:hidden;-webkit-mask-image:' + mask + ';mask-image:' + mask + '">' +
      '<div class="t-all-i" style="position:absolute;left:0;top:0;width:' + IW + 'px;height:720px">' + lab +
      '<div style="position:absolute;left:0;top:' + IT + 'px;width:' + IW + 'px;height:620px;overflow:hidden"><img src="' + kit.assets.url('strip.jpg') + '" style="position:absolute;left:0;top:-76px;width:' + IW + 'px;height:712px"></div>' +
      '<div class="t-all-h" style="position:absolute;left:1366px;top:' + (IT - 4) + 'px;width:380px;height:628px;box-sizing:border-box;border:3px solid var(--accent);border-radius:8px"></div>' + hl + '</div></div>' +
      '<p class="cap">The same step paints every method’s mesh. It needs only the mesh, the 125 photos and where each camera stood.</p>' +
      '<p class="cap">Triangle count does not matter: MeshAnything’s 1,435 triangles get the same 4,096 by 4,096 texture as Poisson’s million.</p>' +
      '<p class="cap">Colour can hide the shape. Each right half is the bare shape, bumps and all, that the photo texture paints over.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.v = q('.t-all-v')[0].style; this.i = q('.t-all-i')[0].style; this.h = q('.t-all-h')[0].style; this.s = q('.t-all-s');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.0, 13.0], t);
    const v = eo(seg(t, 0.2, 1.0)); this.v.opacity = v; this.v.transform = 'translateY(' + (1 - v) * 16 + 'px)';
    let x = STOPS[0][1]; for (let k = 1; k < STOPS.length; k++) if (t >= STOPS[k - 1][0]) x = lerp(STOPS[k - 1][1], STOPS[k][1], eio(seg(t, STOPS[k - 1][0], STOPS[k][0])));
    this.i.transform = 'translateX(' + (-x).toFixed(1) + 'px)';
    this.h.opacity = eo(seg(t, 7.6, 8.1)) * (1 - eo(seg(t, 12.0, 12.4)));
    this.s.forEach((el, k) => el.style.opacity = eo(seg(t, 14.8 + k * 0.5, 15.3 + k * 0.5)));
  },
});
