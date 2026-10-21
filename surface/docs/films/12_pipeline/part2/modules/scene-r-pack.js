const { seg, eo, eio, lerp, TextFx } = kit;
const BOX = [['On the cluster', ['113 runs, full meshes', 'Poisson 169 MB · NKSR 348 MB'], 0.6], ['Best of each method', ['8 per input, 24 in all', 'picked by select_best'], 7.6], ['A viewer-sized copy', ['at most 200,000 triangles', 'JPEG texture, re-baked'], 8.8]];
const BXs = [110, 700, 1290], BW = 520, BY = 250, BH = 200;
const ZIP = [['results/vggsfm.zip', '54 MB'], ['results/mvs.zip', '50 MB'], ['results/mvs_clean.zip', '52 MB'], ['results/summary.json', 'every number']];
const ZX = [110, 540, 970, 1400], ZY = 600, ZW = 410;
kit.scene('r-pack', {
  init(kit) {
    let html = '';
    BOX.forEach(([a, b], i) => { html += '<div class="box r-pk-b" style="left:' + BXs[i] + 'px;top:' + BY + 'px;width:' + BW + 'px;height:' + BH + 'px;padding:24px 28px"><p style="margin:0;font-family:var(--display);font-size:40px">' + a + '</p>' + b.map((s, k) => '<p style="margin:' + (k ? 8 : 16) + 'px 0 0;font-size:25px;color:' + (k ? 'var(--second)' : 'var(--main)') + '">' + s + '</p>').join('') + '</div>'; });
    ZIP.forEach(([a, b], i) => { html += '<div class="box hot r-pk-z" style="left:' + ZX[i] + 'px;top:' + ZY + 'px;width:' + ZW + 'px;height:110px;padding:18px 22px"><p style="margin:0;font-family:var(--mono);font-size:23px;color:var(--accent)">' + a + '</p><p style="margin:10px 0 0;font-size:24px;color:var(--second)">' + b + '</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Running it · Packing</span><h2 class="line">Packing the results</h2></div>' + html +
      '<p class="note r-pk-n" style="left:110px;top:770px;font-size:24px">$ bash run_viewer.sh   unpacks these and opens the viewer</p>' +
      '<p class="note r-pk-n" style="left:110px;top:814px;font-size:22px;color:var(--second)">the metrics in each copy still describe the full-resolution mesh</p>' +
      '<p class="cap">The full meshes stay on the cluster: some are hundreds of megabytes. The repository gets a lighter package instead.</p>' +
      '<p class="cap">For each input, the best run of every method is copied at viewer size: at most 200,000 triangles, with a JPEG texture.</p>' +
      '<p class="cap">Each input becomes one zip of about 50 MB, plus a summary. These are exactly what run_viewer.sh unpacks and shows.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.r-pk-b'); this.z = q('.r-pk-z'); this.n = q('.r-pk-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 14.6], t);
    this.b.forEach((el, i) => { const p = eo(seg(t, BOX[i][2], BOX[i][2] + 0.5)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    this.z.forEach((el, i) => { const p = eo(seg(t, 14.8 + 0.4 * i, 15.3 + 0.4 * i)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    this.n.forEach((el, i) => el.style.opacity = eo(seg(t, 17.2 + 0.6 * i, 17.7 + 0.6 * i)));
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 2; i++) { const a = BOX[i + 1][2] - 0.4, p = eio(seg(t, a, a + 0.4)); if (p <= 0) continue; const x0 = BXs[i] + BW + 8, x1 = BXs[i + 1] - 8; PS.arrow(ctx, x0, BY + BH / 2, lerp(x0, x1, p), BY + BH / 2, c.a, 3, 11); }
    const d = eio(seg(t, 14.4, 15.0)); if (d > 0) { const x = BXs[2] + BW / 2, y0 = BY + BH + 10; PS.arrow(ctx, x, y0, x, lerp(y0, ZY - 12, d), c.a, 3, 12); }
  },
});
