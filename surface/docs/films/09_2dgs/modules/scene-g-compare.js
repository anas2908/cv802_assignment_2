const { seg, eo, lerp, TextFx } = kit;
const CX = [110, 400, 620, 790, 930, 1040, 1150, 1330], Y0 = 240, DY = 52;
const HEAD = ['method', 'triangles', 'Chamfer', 'F@1%', 'NC', 'closed', 'time', 'learns from'];
const ROWS = [['Poisson (ours)', '1,023,553', '0.149%', '0.999', '0.75', 'no', '39 s', 'dots + arrows'], ['IER', '17,488', '0.187%', '0.998', '0.82', 'no', '29 s', 'dots (pretrained)'], ['MeshAnything', '1,435', '0.295%', '0.987', '0.82', 'no', '77 s', 'a dense mesh'], ['Point2Mesh', '10,000', '0.553%', '0.844', '0.80', 'yes', '42 min', 'dots + arrows'], ['DHSP', '6,000', '0.583%', '0.901', '0.89', 'yes', '> 1.5 h', 'coloured dots'], ['NKSR', '2,088,273', '0.156%', '0.998', '0.75', 'no', '6.6 s', 'dots + arrows'], ['SAP', '64,168', '0.195%', '0.998', '0.81', 'yes', '7.8 min', 'dots only'], ['2DGS', '657,447', '0.289%', '0.972', '0.75', 'no', '47 min', 'the photos']];
kit.scene('g-compare', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">2DGS · Results</span><h2 class="line">All eight methods</h2></div>' +
      '<div class="g-compare-hl" style="position:absolute;left:92px;top:' + (Y0 + 8 * DY - 8) + 'px;width:1640px;height:46px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="g-compare-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="g-compare-r">' + r.map((s, j) => '<p class="note' + (j && j < 7 ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j && j < 7 ? 25 : 24) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:110px;top:' + (Y0 + 9 * DY + 22) + 'px;width:1700px"><p class="eq g-compare-e" style="font-size:40px;color:var(--accent)">the only one that learns from photos: the best face, a mid-table score</p></div>' +
      '<p class="cap">2DGS beside the seven other methods. Against the dots it sits mid-table: Chamfer 0.289%, F-score at 1% of 0.972.</p>' +
      '<p class="cap">It is the only method that learns from the photos, which shows in the face and the shirt edges, and it costs 47 minutes.</p>' +
      '<p class="cap">That completes all eight methods. Each answered the same question, dots to surface, in its own way.</p></div>';
    kit.stage.append(kit.h(h));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.g-compare-h')[0].style; this.r = q('.g-compare-r'); this.hl = q('.g-compare-hl')[0].style; this.e = q('.g-compare-e')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.6, 14.4], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, 1.0 + i * 0.4, 1.5 + i * 0.4)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const hl = eo(seg(t, 4.6, 5.2)); this.hl.opacity = hl; this.hl.transform = 'scaleX(' + lerp(0.96, 1, hl) + ')';
    this.e.opacity = eo(seg(t, 8.0, 8.6));
  },
});