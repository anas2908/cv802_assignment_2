const { seg, eo, eio, lerp, TextFx } = kit;
const FA = [['geometry.ply', 1], ['mesh.obj · texture.png', 1], ['metrics.json', 0], ['preview_*.png', 0], ['manifest.json', 0]];
const FB = [['geometry.ply', 1], ['mesh.obj · texture.png', 1], ['metrics.json', 1], ['preview_*.png', 1], ['manifest.json', 2]];
const X = [160, 1060], W = 700, T = 250, RY = 340, RH = 74;
kit.scene('c-manifest', {
  init(kit) {
    const card = (x, title, files, sub) => {
      let h = '<div class="c-man-k" style="position:absolute;left:' + x + 'px;top:' + T + 'px;width:' + W + 'px;height:560px;box-sizing:border-box;border:2px dashed color-mix(in srgb, var(--second) 45%, var(--ground));border-radius:14px"></div>' +
        '<p class="note c-man-k" style="left:' + (x + 26) + 'px;top:' + (T + 22) + 'px;font-size:22px;color:var(--second)">' + title + '</p>';
      files.forEach(([f, ok], i) => { h += '<p class="note c-man-f" style="left:' + (x + 80) + 'px;top:' + (RY + i * RH) + 'px;font-size:26px;color:' + (ok === 2 ? 'var(--accent)' : ok ? 'var(--main)' : 'color-mix(in srgb, var(--second) 35%, var(--ground))') + '">' + f + (ok ? '' : '  (missing)') + '</p>'; });
      return h + '<div class="words c-man-v" style="left:' + x + 'px;top:' + (T + 470) + 'px;width:' + W + 'px;align-items:center"><p class="eq" style="font-size:34px;color:' + sub[1] + '">' + sub[0] + '</p></div>';
    };
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · Done</span><h2 class="line">Done means manifest</h2></div>' +
      card(X[0], 'an example: a run that crashed at metrics', FA, ['not done: the queue runs it again', 'var(--accent)']) +
      card(X[1], 'outputs/sap/sap-v1-p100k-g256/', FB, ['done: viewer, tables and picker use it', 'var(--main)']) +
      '<div class="words c-man-n" style="left:160px;top:842px;width:1600px;align-items:center"><p class="note" style="color:var(--second)">finalize deletes the old manifest first, so a re-run that crashes can never look finished</p></div>' +
      '<p class="cap">Why write the manifest last? Because a run can crash halfway, and a half-finished folder must never look finished.</p>' +
      '<p class="cap">A folder without manifest.json is simply not done: the queue runs it again, and the viewer and the best-run picker ignore it.</p>' +
      '<p class="cap">Each file is listed with its sha256 fingerprint, so anyone can check later that nothing changed after the metrics were taken.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.kk = q('.c-man-k'); this.f = q('.c-man-f'); this.v = q('.c-man-v'); this.n = q('.c-man-n')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.4], t);
    this.kk.forEach((el, i) => el.style.opacity = eo(seg(t, i < 2 ? 0.5 : 0.9, (i < 2 ? 0.5 : 0.9) + 0.5)));
    this.f.forEach((el, i) => { const a = (i < 5 ? 1.0 : 3.4) + (i % 5) * 0.35, p = eo(seg(t, a, a + 0.4)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 20 + 'px)'; });
    this.v.forEach((el, i) => { const p = eo(seg(t, [6.8, 7.6][i], [7.3, 8.1][i])); el.style.opacity = p; });
    this.n.opacity = eo(seg(t, 13.4, 13.9));
    const ctx = this.k.fx, c = this.c;
    // a tick or a cross in front of every file line; a fingerprint mark after the manifest's line
    [FA, FB].forEach((fs, k) => fs.forEach(([, ok], i) => {
      const a = (k ? 3.4 : 1.0) + i * 0.35 + 0.2, p = eo(seg(t, a, a + 0.4)); if (p <= 0) return; const x = X[k] + 46, y = RY + i * RH + 18;
      ctx.globalAlpha = p; ctx.lineWidth = 4; ctx.lineCap = 'round';
      if (ok) { ctx.strokeStyle = ok === 2 ? c.a : c.m; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 3, y + 9); ctx.lineTo(x + 13, y - 10); ctx.stroke(); }
      else { ctx.strokeStyle = PS.mix(c.g, c.a, 0.8); ctx.beginPath(); ctx.moveTo(x - 10, y - 10); ctx.lineTo(x + 10, y + 10); ctx.moveTo(x + 10, y - 10); ctx.lineTo(x - 10, y + 10); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }));
    const fp = eo(seg(t, 12.8, 13.4)); if (fp > 0) { ctx.globalAlpha = fp; ctx.strokeStyle = c.a; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(X[1] + 560, RY + 4 * RH + 18, 6 + k * 6, Math.PI * 0.15, Math.PI * 1.55); ctx.stroke(); } ctx.globalAlpha = 1; }
  },
});
