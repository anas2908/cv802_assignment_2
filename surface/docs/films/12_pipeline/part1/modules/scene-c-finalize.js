const { seg, eo, eio, lerp, TextFx } = kit;
const BX = 110, BW = 1700, BY = 268, CW = 320, CG = 25, CT = 340, CH = 400;
// progress.json as the run goes: [time, percent, stage]
const PR = [[0.8, 3, 'prep'], [1.2, 10, 'optimise'], [3.2, 86, 'post'], [3.6, 89, 'method done'], [6.8, 90, 'finalize: loading geometry'], [8.6, 92, 'finalize: texturing'], [13.2, 95, 'finalize: metrics'], [19.6, 97, 'finalize: rendering previews'], [22.4, 100, 'complete']];
const CARDS = [['Clean', 'drop broken triangles and unused corners', 7.0], ['Texture', 'flatten into a texture and paint it: from the dots or the photos', 8.8], ['Measure', 'Chamfer, F-score, normals, colour PSNR, holes and pieces', 13.4], ['Render', 'front, back, sides and a shaded strip', 19.8], ['Manifest', 'every file with its size and fingerprint, written last', 22.6]];
kit.scene('c-finalize', {
  init(kit) {
    let cards = ''; CARDS.forEach(([a, b], i) => { const x = BX + i * (CW + CG); cards += '<div class="box c-fin-c" style="left:' + x + 'px;top:' + CT + 'px;width:' + CW + 'px;height:' + CH + 'px;padding:20px 22px"><p style="margin:0;font-family:var(--display);font-size:38px">' + (i + 1) + ' · ' + a + '</p><p style="margin:160px 0 0;font-size:24px;line-height:1.3;color:var(--second)">' + b + '</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · finalize</span><h2 class="line">The finalizer</h2></div>' +
      '<p class="note c-fin-p" style="left:110px;top:216px;font-size:24px"></p>' + cards +
      '<p class="note c-fin-k" style="left:110px;top:300px;font-size:20px;color:var(--second)">the method: 0 to 89%</p><p class="note warm c-fin-k" style="left:1540px;top:300px;font-size:20px">finalize: 90 to 100%</p>' +
      '<p class="cap">Every run ends in the same finalizer. It reports progress too: the method fills 0 to 89 percent, the finalizer 90 to 100.</p>' +
      '<p class="cap">It drops broken triangles, lays the mesh out flat for a texture and paints it: from the dots, or from the photos.</p>' +
      '<p class="cap">Then it measures the mesh against the input dots, exactly as in the metrics film, and checks for holes and loose pieces.</p>' +
      '<p class="cap">Last it renders preview pictures and writes manifest.json: every file with its size and fingerprint. That file means done.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.p = q('.c-fin-p')[0]; this.cards = q('.c-fin-c'); this.kk = q('.c-fin-k');
  },
  pct(t) { let v = 0, st = ''; for (let i = 0; i < PR.length; i++) { if (t >= PR[i][0]) { const nx = PR[i + 1], p = nx ? eio(seg(t, PR[i][0], Math.min(nx[0], PR[i][0] + 0.8))) : 1, prev = i ? PR[i - 1][1] : 0; v = lerp(prev, PR[i][1], p); st = PR[i][2]; } } return [v, st]; },
  icon(ctx, i, x, y, a) {
    const c = this.c; ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (i === 0) { PS.tri(ctx, [x - 60, y + 30], [x + 10, y - 40], [x + 60, y + 30], PS.mix(c.g, c.m, 0.25), c.m, 2.5); ctx.strokeStyle = c.a; ctx.beginPath(); ctx.moveTo(x - 50, y + 44); ctx.lineTo(x + 70, y + 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 52, y + 26); ctx.lineTo(x + 76, y + 50); ctx.moveTo(x + 76, y + 26); ctx.lineTo(x + 52, y + 50); ctx.stroke(); }
    else if (i === 1) { for (let u = 0; u < 4; u++) for (let v = 0; v < 4; v++) { ctx.fillStyle = (u + v) % 2 ? PS.mix(c.g, c.a, 0.7) : PS.mix(c.g, c.m, 0.55); ctx.fillRect(x - 56 + u * 28, y - 56 + v * 28, 28, 28); } ctx.strokeStyle = c.s; ctx.strokeRect(x - 56, y - 56, 112, 112); }
    else if (i === 2) { ctx.strokeStyle = c.m; ctx.beginPath(); ctx.arc(x, y + 90, 110, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); [[-50, -2], [-18, -24], [20, -26], [52, -4]].forEach(([dx, dy], k) => { const px = x + dx, py = y + dy + (k % 2 ? -14 : 10); PS.dot(ctx, px, py, 5, c.a); ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + dx * 0.06, y + dy + 4); ctx.stroke(); }); }
    else if (i === 3) { for (let k = 0; k < 4; k++) { const bx = x - 66 + k * 34; ctx.strokeStyle = c.s; ctx.lineWidth = 2; ctx.strokeRect(bx, y - 44, 28, 88); PS.dot(ctx, bx + 14, y - 26, 6, k === 3 ? c.s : c.a); ctx.strokeStyle = k === 3 ? c.s : c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx + 14, y - 16); ctx.lineTo(bx + 14, y + 30); ctx.stroke(); } }
    else { ctx.strokeStyle = c.s; ctx.lineWidth = 2.5; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 56, y - 40 + k * 26); ctx.lineTo(x + 30, y - 40 + k * 26); ctx.stroke(); } ctx.strokeStyle = c.a; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 36, y + 8); ctx.lineTo(x + 50, y + 24); ctx.lineTo(x + 76, y - 14); ctx.stroke(); }
    ctx.globalAlpha = 1;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 13.0, 19.4], t);
    const [v, st] = this.pct(t); this.p.textContent = 'progress.json: ' + Math.round(v) + '% · ' + (st || 'waiting'); this.p.style.opacity = eo(seg(t, 0.4, 0.8));
    this.kk.forEach(el => el.style.opacity = eo(seg(t, 0.6, 1.1)));
    let act = -1; CARDS.forEach(([, , a], i) => { if (t >= a) act = i; });
    this.cards.forEach((el, i) => { const p = eo(seg(t, CARDS[i][2], CARDS[i][2] + 0.5)); el.style.opacity = 0.25 + 0.75 * p * (i === act ? 1 : 0.6); el.style.borderColor = i === act ? 'var(--accent)' : ''; });
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 0.4, 0.9));
    ctx.globalAlpha = a; ctx.fillStyle = PS.mix(c.g, c.s, 0.12); ctx.fillRect(BX, BY, BW, 20); ctx.globalAlpha = 1;
    const w89 = Math.min(v, 89) / 100 * BW; ctx.fillStyle = c.m; ctx.fillRect(BX, BY, w89, 20);
    if (v > 89) { ctx.fillStyle = c.a; ctx.fillRect(BX + 0.89 * BW, BY, (v - 89) / 100 * BW, 20); }
    CARDS.forEach(([, , a0], i) => { const p = eo(seg(t, a0, a0 + 0.5)); this.icon(ctx, i, BX + i * (CW + CG) + CW / 2, CT + 150, 0.25 + 0.75 * p); });
  },
});
