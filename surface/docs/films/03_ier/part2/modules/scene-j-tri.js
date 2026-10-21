const { seg, eo, eio, lerp, TextFx } = kit;
const TV = [[300, 560], [560, 470], [520, 700]];
const BP = [[114, 543], [590, 453], [550, 683]], CB = [760, 543], CW = 26;
const F = [[0.9, 0.3, 0.7, 0.2, 0.8, 0.5], [0.4, 0.8, 0.2, 0.9, 0.3, 0.6], [0.7, 0.1, 0.9, 0.4, 0.6, 0.2]];
const P1 = [0.82, 0.12, 0.06], P2 = [0.05, 0.07, 0.88];
kit.scene('j-tri', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 2</span><h2 class="line">Judging one triangle</h2></div>' +
      '<p class="box j-tri-box" style="left:1270px;top:512px;width:200px;text-align:center">small classifier</p>' +
      '<p class="note warm j-tri-gap" style="left:180px;top:836px">second example: a triangle across a gap</p>' +
      '<p class="cap">To judge one candidate triangle, take the features of its three corner dots.</p>' +
      '<p class="cap">Put the three features side by side, and pass them through a small classifier.</p>' +
      '<p class="cap">It gives a score for good, okay and bad. The highest score is the label.</p>' +
      '<p class="cap">A triangle across a gap gets a high “bad” score. Millions of candidates are judged at once on the GPU: about 30 s for our scan.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    this.box = kit.stage.querySelector('.j-tri-box').style; this.gap = kit.stage.querySelector('.j-tri-gap').style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 4.8, 8.8, 13.4], t);
    const ctx = this.k.fx, c = this.c;
    const sw = eio(seg(t, 13.0, 14.0)), tc = sw > 0.5 ? c.a : c.m;
    const V = TV.map((v, i) => i === 2 ? [lerp(v[0], 700, sw), lerp(v[1], 760, sw)] : v);
    const tp = eo(seg(t, 0.4, 1.2));
    if (tp > 0) { ctx.globalAlpha = tp; ctx.fillStyle = PS.mix(c.g, tc, 0.25); ctx.strokeStyle = tc; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(V[0][0], V[0][1]); ctx.lineTo(V[1][0], V[1][1]); ctx.lineTo(V[2][0], V[2][1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; V.forEach(v => PS.dot(ctx, v[0], v[1], 11, c.s)); }
    const mv = eio(seg(t, 5.0, 7.0));
    F.forEach((f, k) => {
      const ap = eo(seg(t, 1.4 + k * 0.5, 2.0 + k * 0.5)); if (ap <= 0) return;
      const x = lerp(BP[k][0], CB[0] + k * 6 * CW, mv), y = lerp(BP[k][1], CB[1], mv);
      f.forEach((v, i) => { ctx.globalAlpha = ap; ctx.fillStyle = PS.mix(c.g, k === 1 ? c.a : c.m, 0.25 + 0.75 * v); ctx.fillRect(x + i * CW, y, CW - 3, 34); });
      ctx.globalAlpha = 1;
    });
    const a1 = eo(seg(t, 7.2, 7.8));
    if (a1 > 0) { ctx.globalAlpha = a1; PS.arrow(ctx, CB[0] + 18 * CW + 6, CB[1] + 17, 1262, CB[1] + 17, c.a, 3, 11); PS.arrow(ctx, 1478, CB[1] + 17, 1522, CB[1] + 17, c.a, 3, 11); ctx.globalAlpha = 1; }
    this.box.opacity = a1;
    const op = eo(seg(t, 9.0, 10.0));
    if (op > 0) {
      const P = P1.map((v, i) => lerp(v, P2[i], sw)), best = P.indexOf(Math.max(...P));
      ['good', 'okay', 'bad'].forEach((n, i) => {
        const y = 470 + i * 62, col = i === 0 ? c.m : i === 1 ? c.s : c.a;
        ctx.globalAlpha = op; ctx.font = (i === best ? '700 ' : '500 ') + '24px ' + this.mono; ctx.fillStyle = col; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(n, 1590, y + 15);
        ctx.fillStyle = PS.mix(c.g, c.s, 0.2); ctx.fillRect(1604, y, 176, 30); ctx.fillStyle = col; ctx.fillRect(1604, y, 176 * P[i] * op, 30);
        if (i === best) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(1600, y - 4, 184, 38); }
      });
      ctx.globalAlpha = 1;
    }
    this.gap.opacity = eo(seg(t, 13.4, 14.0));
  },
});