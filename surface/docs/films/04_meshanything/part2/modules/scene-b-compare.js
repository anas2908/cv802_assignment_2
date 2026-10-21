const { seg, eo, eio, lerp, TextFx } = kit;
const CX = [110, 560, 830, 1080], Y0 = 254, DY = 70;
const COLS = ['Poisson (ours)', 'IER', 'MeshAnything'];
const ROWS = [['triangles', '1,023,553', '17,488', '1,435'], ['Chamfer', '0.149%', '0.187%', '0.295%'], ['F@1%', '0.999', '0.998', '0.987'], ['normal consistency', '0.75', '0.82', '0.82']];
kit.scene('b-compare', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">MeshAnything · Results</span><h2 class="line">Against Poisson and IER</h2></div>' +
      '<div class="b-compare-hl" style="position:absolute;left:1060px;top:' + (Y0 - 12) + 'px;width:224px;height:' + (DY * 5 + 4) + 'px;border-radius:12px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 10%, var(--ground))"></div>' +
      '<div class="b-compare-h">' + COLS.map((s, j) => '<p class="note" style="left:' + CX[j + 1] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="b-compare-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 30 : 26) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:110px;top:' + (Y0 + 5 * DY + 30) + 'px;width:1200px;gap:8px"><p class="eq b-compare-e" style="font-size:46px">about 700 times fewer triangles than Poisson,</p><p class="eq b-compare-e" style="font-size:46px">for about twice the average gap</p></div>' +
      '<div class="b-compare-win" style="position:absolute;left:1470px;top:250px;width:184px;height:596px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('ma_fig.jpg') + '" style="position:absolute;left:-592px;top:-75px;width:785px;height:696px"></div>' +
      '<div class="words b-compare-il" style="left:1362px;top:862px;width:400px;align-items:center"><p class="note warm">with our photo texture</p></div>' +
      '<p class="cap">The three methods so far, on the same scan. Poisson is the most accurate, and by far the heaviest.</p>' +
      '<p class="cap">MeshAnything uses about 700 times fewer triangles than Poisson, for roughly twice the average gap.</p>' +
      '<p class="cap">With our photo texture on top, its 1,435 triangles still look like the person, and its surface is as smooth as IER’s.</p></div>';
    kit.stage.append(kit.h(h));
    this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.b-compare-h')[0].style; this.r = q('.b-compare-r'); this.hl = q('.b-compare-hl')[0].style; this.e = q('.b-compare-e'); this.win = q('.b-compare-win')[0].style; this.il = q('.b-compare-il')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.0], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, 1.4 + i * 1.0, 1.9 + i * 1.0)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const hl = eo(seg(t, 6.2, 6.8)); this.hl.opacity = hl; this.hl.transform = 'scaleY(' + lerp(0.94, 1, hl) + ')';
    this.e.forEach((el, i) => { const p = eo(seg(t, 7.8 + i * 0.7, 8.3 + i * 0.7)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const w = eo(seg(t, 12.6, 13.4)); this.win.opacity = w; this.win.transform = 'scale(' + lerp(0.96, 1, w) * lerp(1, 1.02, eio(seg(t, 12.6, 20))) + ')'; this.il.opacity = eo(seg(t, 13.2, 13.7));
  },
});