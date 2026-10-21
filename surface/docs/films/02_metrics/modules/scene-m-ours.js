const { seg, eo, eio, lerp, TextFx } = kit;
const COLX = [140, 900, 1170, 1420], ROWY = [300, 385, 458, 531, 604];
const ROWS = [['Poisson run (VGGSfM)', 'Chamfer %', 'F@1%', 'F@0.5%'], ['classic α=0, 256³', '0.230', '0.990', '0.931'], ['screened α=4, 256³', '0.179', '0.998', '0.970'], ['screened α=4, 384³ (best)', '0.149', '0.999', '0.988'], ['watertight, 384³', '0.154', '0.998', '0.977']];
kit.scene('m-ours', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Our Poisson numbers</h2></div>';
    ROWS.forEach((r, j) => r.forEach((cell, i) => { const st = j === 0 ? 'font-size:26px;color:var(--second);opacity:.75' : j === 3 ? 'font-size:32px;color:var(--accent)' : 'font-size:32px;color:var(--second)'; h += '<p class="note num m-ours-r' + j + '" style="left:' + COLX[i] + 'px;top:' + ROWY[j] + 'px;' + st + '">' + cell + '</p>'; }));
    h += '<div class="words" style="left:140px;top:700px;width:1640px;gap:14px">' +
      '<p class="note num m-ours-e1" style="position:static;font-size:32px">τ = 1% of the diagonal (≈ 2 cm)  ·  strict τ = 0.5% (≈ 1 cm)</p>' +
      '<p class="eq m-ours-e2" style="font-size:44px;white-space:normal">Chamfer = how far, on average. F-score = what share is close enough.</p></div>' +
      '<p class="cap">For the real meshes, τ is 1% of the diagonal (about 2 cm), and a stricter 0.5% (about 1 cm).</p>' +
      '<p class="cap">At 1% every Poisson run looks almost perfect. At 0.5% the differences show: the pins and the finer grid clearly help.</p>' +
      '<p class="cap">We report both numbers for every method: Chamfer for the average gap, F-score for the share that is close enough.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.rows = [0, 1, 2, 3, 4].map(j => [...kit.stage.querySelectorAll('.m-ours-r' + j)]);
    this.e1 = kit.stage.querySelector('.m-ours-e1').style; this.e2 = kit.stage.querySelector('.m-ours-e2').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 5.4, 10.8], t);
    this.rows.forEach((r, j) => r.forEach(el => { const p = eo(seg(t, 0.8 + j * 0.7, 1.3 + j * 0.7)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; }));
    const ctx = this.k.fx, c = this.c;
    const hp = eio(seg(t, 6.0, 6.8));
    if (hp > 0) {
      ctx.globalAlpha = hp; ctx.strokeStyle = c.a; ctx.lineWidth = 3;
      const x = COLX[3] - 22, y = ROWY[1] - 16, w = 170, hh = (ROWY[4] + 52 - y) * hp;
      ctx.beginPath(); ctx.moveTo(x + 12, y); ctx.lineTo(x + w - 12, y); ctx.quadraticCurveTo(x + w, y, x + w, y + 12); ctx.lineTo(x + w, y + hh - 12); ctx.quadraticCurveTo(x + w, y + hh, x + w - 12, y + hh); ctx.lineTo(x + 12, y + hh); ctx.quadraticCurveTo(x, y + hh, x, y + hh - 12); ctx.lineTo(x, y + 12); ctx.quadraticCurveTo(x, y, x + 12, y); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    this.e1.opacity = eo(seg(t, 1.0, 1.6)); this.e2.opacity = eo(seg(t, 11.2, 11.8));
  },
});