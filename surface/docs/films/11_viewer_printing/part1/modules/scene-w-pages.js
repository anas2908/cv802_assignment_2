const { seg, eo, eio, lerp, TextFx } = kit;
const CX = [110, 690, 1270], CT = 250, CW = 540, CH = 304;
const PG = [['ui_dashboard.jpg', 'Dashboard', 'start a method on the GPU', 'watch its run live'], ['ui_viewer_compare.jpg', 'Mesh viewer', 'turn any result in 3D', 'alone or side by side'], ['ui_compare.jpg', 'Compare', 'every run in one table', 'best of each column in green']];
const ON = [[0.8, 7.2], [7.6, 14.6], [15.0, 99]];
kit.scene('w-pages', {
  init(kit) {
    let html = '';
    PG.forEach(([img, a, b, c2], i) => {
      html += '<div class="w-pages-c" style="position:absolute;left:' + CX[i] + 'px;top:' + CT + 'px;width:' + CW + 'px;height:' + CH + 'px;overflow:hidden;border-radius:10px"><img src="' + kit.assets.url(img) + '" style="position:absolute;left:0;top:0;width:' + CW + 'px;height:' + CH + 'px"></div>';
      html += '<div class="w-pages-h" style="position:absolute;left:' + (CX[i] - 6) + 'px;top:' + (CT - 6) + 'px;width:' + (CW + 12) + 'px;height:' + (CH + 12) + 'px;box-sizing:border-box;border:4px solid var(--accent);border-radius:14px"></div>';
      html += '<div class="words w-pages-l" style="left:' + CX[i] + 'px;top:' + (CT + CH + 22) + 'px;width:' + CW + 'px;gap:8px;align-items:center"><p class="eq" style="font-size:40px">' + a + '</p><p class="note" style="font-size:22px">' + b + '</p><p class="note" style="font-size:22px">' + c2 + '</p></div>';
    });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The viewer · The site</span><h2 class="line">Three pages</h2></div>' + html +
      '<div class="words w-pages-r" style="left:110px;top:790px;width:1700px;align-items:center"><p class="note warm" style="font-size:24px">the copy in our repository opens read-only: it shows results, it cannot start runs</p></div>' +
      '<p class="cap">The site has three pages. On our cluster, the dashboard started each method on the GPU and showed its progress live.</p>' +
      '<p class="cap">The mesh viewer turns any result in 3D, alone or next to another one. Most of this film is about it.</p>' +
      '<p class="cap">The compare page puts every run in one table, all measured the same way, with the best value of each column in green.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.cards = q('.w-pages-c'); this.h = q('.w-pages-h'); this.l = q('.w-pages-l'); this.r = q('.w-pages-r')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 14.8], t);
    this.cards.forEach((el, i) => {
      const p = eo(seg(t, 0.4 + i * 0.25, 1.1 + i * 0.25)), on = eo(seg(t, ON[i][0], ON[i][0] + 0.5)) * (1 - eo(seg(t, ON[i][1], ON[i][1] + 0.4)));
      const sc = lerp(0.96, 1, p) * (1 + 0.035 * on); el.style.opacity = p; el.style.transform = 'scale(' + sc + ')';
      this.h[i].style.opacity = on; this.h[i].style.transform = 'scale(' + (1 + 0.035 * on) + ')';
      this.l[i].style.opacity = eo(seg(t, 0.9 + i * 0.25, 1.4 + i * 0.25)) * (0.55 + 0.45 * Math.max(on, t < 0.8 ? 1 : 0));
    });
    this.r.opacity = eo(seg(t, 4.0, 4.5));
  },
});
