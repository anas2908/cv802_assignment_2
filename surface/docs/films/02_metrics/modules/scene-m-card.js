const { seg, eo, eio, lerp, TextFx } = kit;
const COLX = [140, 560, 1240], ROWY = [292, 372, 452, 532, 612, 692];
const ROWS = [['score', 'the question it answers', 'what it catches'], ['Chamfer %', 'how far apart, on average?', 'overall closeness'], ['F-score', 'what share is close enough?', 'invented skin, holes'], ['Normal consistency', 'do the directions agree?', 'crumpling'], ['Colour PSNR', 'do the colours match the dots?', 'colour errors'], ['Watertight', 'is the mesh closed?', 'not printable']];
kit.scene('m-card', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">All the scores at a glance</h2></div>';
    ROWS.forEach((r, j) => r.forEach((cell, i) => { const st = j === 0 ? 'font-size:24px;color:var(--second);opacity:.7' : i === 0 ? 'font-size:32px;color:var(--accent)' : i === 1 ? 'font-size:30px;color:var(--second)' : 'font-size:30px'; h += '<p class="note m-card-r' + j + '" style="left:' + COLX[i] + 'px;top:' + ROWY[j] + 'px;' + st + '">' + cell + '</p>'; }));
    h += '<p class="cap">Distances say how close. Normal consistency says how clean. PSNR says how faithful in colour. Watertight says printable.</p>' +
      '<p class="cap">No single number is enough, so for every method we report all of them, and we also look at the shaded pictures.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.rows = ROWS.map((_, j) => [...kit.stage.querySelectorAll('.m-card-r' + j)]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.4, 7.4], t);
    this.rows.forEach((r, j) => r.forEach(el => { const p = eo(seg(t, 0.6 + j * 0.9, 1.1 + j * 0.9)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; }));
    const ctx = this.k.fx, c = this.c;
    for (let j = 1; j < ROWS.length; j++) {
      const p = eio(seg(t, 0.9 + j * 0.9, 1.5 + j * 0.9)); if (p <= 0) continue;
      ctx.globalAlpha = 0.35; ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(140, ROWY[j] - 14); ctx.lineTo(140 + 1640 * p, ROWY[j] - 14); ctx.stroke(); ctx.globalAlpha = 1;
    }
  },
});