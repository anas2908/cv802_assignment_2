const { seg, eo, eio, lerp, TextFx } = kit;
const L = [['113 manifest.json files', 'one per finished run', 0.6], ['collect_results.py', 'reads every one', 1.6], ['results.json', 'all the numbers, one file', 2.6]];
const R = [['make_figures.py', '23 figures', 7.0], ['LaTeX, pdflatex', 'the one-page report (PDF)', 8.0], ['build_slides.py', '22 slides: PPTX, then PDF', 9.0]];
const LX = 110, RX = 1010, W = 700, Y = [250, 420, 590], H = 120;
kit.scene('r-docs', {
  init(kit) {
    const box = (x, y, a, b, hot) => '<div class="box ' + (hot ? 'hot ' : '') + 'r-dc-b" style="left:' + x + 'px;top:' + y + 'px;width:' + W + 'px;height:' + H + 'px;padding:20px 26px"><p style="margin:0;font-family:var(--mono);font-size:26px;color:' + (hot ? 'var(--accent)' : 'var(--main)') + '">' + a + '</p><p style="margin:10px 0 0;font-size:25px;color:var(--second)">' + b + '</p></div>';
    let html = ''; L.forEach(([a, b], i) => { html += box(LX, Y[i], a, b, i === 2); }); R.forEach(([a, b], i) => { html += box(RX, Y[i], a, b, false); });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Running it · The documents</span><h2 class="line">The report and slides</h2></div>' + html +
      '<p class="box r-dc-c" style="left:110px;top:760px;width:1600px;font-family:var(--mono);font-size:26px;color:var(--main)">$ bash surface/docs/deliverables/build_all.sh --figures</p>' +
      '<p class="cap">The report and the slides are built by a script too. It first collects every run’s metrics into one file, results.json.</p>' +
      '<p class="cap">From that file it draws the figures, fills the LaTeX report and builds the slides, then turns both into PDFs.</p>' +
      '<p class="cap">So no number in the report was typed by hand: rerun a method, rebuild, and every table and figure follows.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.r-dc-b'); this.cmd = q('.r-dc-c')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.4], t);
    const T = L.concat(R).map(x => x[2]); this.b.forEach((el, i) => { const p = eo(seg(t, T[i], T[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    const cp = eo(seg(t, 13.8, 14.3)); this.cmd.opacity = cp;
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 2; i++) { const p = eio(seg(t, L[i + 1][2] - 0.4, L[i + 1][2])); if (p <= 0) continue; const x = LX + W / 2, y0 = Y[i] + H + 8, y1 = Y[i + 1] - 8; PS.arrow(ctx, x, y0, x, lerp(y0, y1, p), c.a, 3, 11); }
    R.forEach(([, , a], i) => { const p = eio(seg(t, a - 0.5, a)); if (p <= 0) return; const x0 = LX + W + 10, y0 = Y[2] + H / 2, x1 = RX - 10, y1 = Y[i] + H / 2; PS.arrow(ctx, x0, y0, lerp(x0, x1, p), lerp(y0, y1, p), c.a, 3, 11); });
  },
});
