const { seg, eo, eio, lerp, TextFx } = kit;
const IX = 110, IY = 228, K = 0.5;
// highlight boxes on the screenshot, in its own pixels: thumbnails, the metrics table, the tick box and definitions
const HL = [[586, 146, 2354, 1018, 1.0, 6.4], [586, 1032, 2354, 1350, 7.0, 13.0], [36, 450, 498, 870, 13.6, 99]];
kit.scene('w-compare', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The viewer · Ranking</span><h2 class="line">The compare page</h2></div>' +
      '<div class="w-cmp-i" style="position:absolute;left:' + IX + 'px;top:' + IY + 'px;width:' + 2400 * K + 'px;height:' + 1350 * K + 'px;overflow:hidden;border-radius:10px"><img src="' + kit.assets.url('ui_compare.jpg') + '" style="position:absolute;left:0;top:0;width:' + 2400 * K + 'px;height:' + 1350 * K + 'px"></div>' +
      '<div class="words" style="left:1370px;top:262px;width:470px;gap:12px">' +
      '<p class="eq w-cmp-n" style="font-size:38px">every run, one table</p><p class="note w-cmp-n" style="color:var(--second)">same dots, same metrics</p>' +
      '<p class="eq w-cmp-n" style="font-size:38px;margin-top:26px;color:var(--accent)">best value in green</p><p class="note w-cmp-n" style="color:var(--second)">one per column</p>' +
      '<p class="eq w-cmp-n" style="font-size:38px;margin-top:26px">one tick: best runs only</p><p class="note w-cmp-n" style="color:var(--second)">a row opens the viewer</p></div>' +
      '<p class="cap">The compare page lists every finished run as a picture and a row of numbers, all measured against the same input dots.</p>' +
      '<p class="cap">The columns are the metrics from our metrics film: Chamfer, F-score, normal consistency and colour PSNR. The best value in each column is green.</p>' +
      '<p class="cap">One tick keeps only the best run of each method, the definitions sit beside the table, and clicking a row opens it in the viewer.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.i = q('.w-cmp-i')[0].style; this.n = q('.w-cmp-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.4], t);
    const p = eo(seg(t, 0.2, 0.9)); this.i.opacity = p; this.i.transform = 'scale(' + lerp(0.97, 1, p) + ')';
    const NT = [1.2, 1.7, 7.4, 7.9, 14.0, 14.5]; this.n.forEach((el, i) => { const a = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = a; el.style.transform = 'translateX(' + (1 - a) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c;
    HL.forEach(([x0, y0, x1, y1, a, b]) => {
      const o = eo(seg(t, a, a + 0.5)) * (1 - eo(seg(t, b, b + 0.4))); if (o <= 0) return;
      ctx.globalAlpha = o; ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      const X0 = IX + x0 * K - 4, Y0 = IY + y0 * K - 4; ctx.strokeRect(X0, Y0, (x1 - x0) * K + 8, Math.min((y1 - y0) * K + 8, IY + 1350 * K - Y0)); ctx.globalAlpha = 1;
    });
  },
});
