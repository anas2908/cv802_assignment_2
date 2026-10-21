const { seg, eo, eio, lerp, TextFx } = kit;
const CX = [210, 450, 580, 760, 990, 1190, 1400], Y0 = 248, DY = 64;
const HEAD = ['input', 'model', 'grid', 'decoding', 'triangles', 'Chamfer', 'F@1%'];
const ROWS = [['raw dots', 'V1', '–', 'greedy', '795', '1.40%', '0.44'], ['raw dots', 'V2', '–', 'greedy', '624', '4.58%', '0.11'], ['raw dots', 'V2', '–', 'sampling', '1,802', '1.27%', '0.51'],
  ['dense mesh', 'V1', '128', 'greedy', '471', '0.42%', '0.93'], ['dense mesh', 'V2', '128', 'greedy', '1,435', '0.30%', '0.987'], ['dense mesh', 'V2', '256', 'greedy', '1,810', '0.31%', '0.972'], ['dense mesh', 'V2', '128', 'sampling', '2,058', '0.34%', '0.96']];
const RT = [1.6, 2.4, 3.2, 6.6, 7.4, 8.2, 9.0];
kit.scene('b-table', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">MeshAnything · Experiments</span><h2 class="line">Our experiments</h2></div>' +
      '<div class="b-table-best" style="position:absolute;left:186px;top:' + (Y0 + 5 * DY - 10) + 'px;width:1360px;height:56px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>';
    h += '<div class="b-table-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="b-table-r">' + r.map((s, j) => '<p class="note num" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:28px;color:' + (i < 3 ? 'color-mix(in srgb, var(--second) 70%, var(--ground))' : 'var(--second)') + '">' + s + '</p>').join('') + '</div>'; });
    h += '<p class="note b-table-x" style="left:210px;top:' + (Y0 + 8 * DY + 14) + 'px">grid = steps of the marching-cubes rebuild · sampling: two seeds, both about 0.96</p>' +
      '<p class="cap">We ran MeshAnything seven ways on our VGGSfM scan. First, three runs fed our raw dots directly: all poor.</p>' +
      '<p class="cap">Then four runs through our Poisson mesh: every one is far better, whatever the version or the decoding.</p>' +
      '<p class="cap">The best: V2, the 128-step grid it was trained on, and greedy decoding. 1,435 triangles, F-score 0.987.</p>' +
      '<p class="cap">Chamfer is the average gap as a % of the box diagonal; F@1% is the share of points within 1%. See the Metrics video.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.b-table-h')[0].style; this.r = q('.b-table-r'); this.best = q('.b-table-best')[0].style; this.x = q('.b-table-x')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.6, 19.0], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, RT[i], RT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const b = eo(seg(t, 12.8, 13.4)); this.best.opacity = b; this.best.transform = 'scaleX(' + lerp(0.96, 1, b) + ')';
    this.x.opacity = eo(seg(t, 15.0, 15.5));
    const ctx = this.k.fx, c = this.c;
    const br = (a, i0, i1, col) => { const p = eio(seg(t, a, a + 0.6)); if (p <= 0) return; const y0 = Y0 + (i0 + 1) * DY - 4, y1 = Y0 + (i1 + 1) * DY + 38, ym = lerp((y0 + y1) / 2, y1, 0) ; ctx.globalAlpha = p; ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(176, y0); ctx.lineTo(160, y0); ctx.lineTo(160, lerp(y0, y1, p)); ctx.lineTo(176, lerp(y0, y1, p)); ctx.stroke(); ctx.globalAlpha = 1; };
    br(4.0, 0, 2, PS.mix(c.g, c.s, 0.5)); br(9.8, 3, 6, c.m);
  },
});