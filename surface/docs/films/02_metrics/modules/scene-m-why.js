const { seg, eo, eio, lerp, TextFx } = kit;
const COLX = [140, 660, 900, 1140, 1460], ROWY = [300, 395, 485, 575];
const ROWS = [['', 'precision P', 'recall R', 'plain average', 'F-score'], ['a good mesh', '0.99', '0.99', '0.99', '0.99'], ['misses half the dots', '1.00', '0.50', '0.75', '0.67'], ['mostly invented', '0.20', '1.00', '0.60', '0.33']];
kit.scene('m-why', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Why not a plain average?</h2></div>';
    ROWS.forEach((r, j) => r.forEach((cell, i) => { if (!cell) return; const col = j === 0 ? 'color:var(--muted, var(--second));opacity:.75' : i === 4 ? 'color:var(--accent)' : i === 0 ? 'color:var(--second)' : 'color:var(--second)'; h += '<p class="note num m-why-c m-why-r' + j + '" style="left:' + COLX[i] + 'px;top:' + ROWY[j] + 'px;font-size:' + (j === 0 ? 26 : 34) + 'px;' + col + '">' + cell + '</p>'; }));
    h += '<div class="words" style="left:180px;top:690px;width:1560px"><p class="eq m-why-e" style="font-size:46px;white-space:normal">F = 2PR ÷ (P + R) is pulled toward the weaker of P and R</p></div>' +
      '<p class="cap">Why combine P and R this way, instead of a plain average?</p>' +
      '<p class="cap">A mesh that misses half the dots would still average 0.75. The F-score gives it only 0.67.</p>' +
      '<p class="cap">A mostly invented mesh averages 0.60, but scores just 0.33. To score well, a mesh must be good both ways.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.rows = [0, 1, 2, 3].map(j => [...kit.stage.querySelectorAll('.m-why-r' + j)]);
    this.e = kit.stage.querySelector('.m-why-e').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 3.8, 7.8], t);
    const at = [0.8, 1.6, 4.0, 8.0];
    this.rows.forEach((r, j) => r.forEach(el => { const p = eo(seg(t, at[j], at[j] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; }));
    const ctx = this.k.fx, c = this.c;
    [[2, 5.0], [3, 9.0]].forEach(([j, t0]) => {
      const p = eio(seg(t, t0, t0 + 0.7)); if (p <= 0) return;
      const y = ROWY[j] + 48;
      ctx.strokeStyle = c.s; ctx.lineWidth = 4; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(COLX[3], y); ctx.lineTo(COLX[3] + 90 * p, y); ctx.stroke();
      ctx.strokeStyle = c.a; ctx.globalAlpha = 1; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(COLX[4], y); ctx.lineTo(COLX[4] + 90 * p, y); ctx.stroke();
    });
    this.e.opacity = eo(seg(t, 10.0, 10.6));
  },
});