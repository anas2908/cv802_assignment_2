const { seg, eo, eio, lerp, TextFx } = kit;
const FLAT = [[170, 560], [340, 560], [510, 560], [680, 560]], FOLD = [[170, 560], [560, 500], [300, 590], [680, 620]], SC = 1.08;
kit.scene('q-folds', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · A closer look</span><h2 class="line">The red patches</h2></div>' +
      '<div class="q-folds-w" style="position:absolute;left:' + Math.round(960 - 93 * SC) + 'px;top:246px;width:' + Math.round(186 * SC) + 'px;height:' + Math.round(600 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('p2m_fig.jpg') + '" style="position:absolute;left:' + Math.round(-219 * SC) + 'px;top:' + Math.round(-76 * SC) + 'px;width:' + Math.round(942 * SC) + 'px;height:' + Math.round(696 * SC) + 'px"></div>' +
      '<p class="note q-folds-i" style="left:170px;top:690px">illustration: a skin folding over</p>' +
      '<div class="words" style="left:1180px;top:300px;width:680px;gap:10px">' +
      '<p class="note warm q-folds-n">red = the inside of the skin</p><p class="note q-folds-n" style="color:var(--second)">the skin folded over itself there</p>' +
      '<p class="note q-folds-n" style="margin-top:18px;color:var(--second)">still closed: no holes</p>' +
      '<p class="note q-folds-n" style="margin-top:18px">unoriented arrows cannot tell</p><p class="note q-folds-n">inside from outside</p></div>' +
      '<p class="cap">Our best run has red patches. In our renders, red means we are looking at the inside of the skin.</p>' +
      '<p class="cap">There the skin folded over itself, so its inner side faces out. The skin is still closed: no holes.</p>' +
      '<p class="cap">A likely side effect of the unoriented arrows: to that term, inside and outside look exactly the same.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.q-folds-w')[0].style; this.i = q('.q-folds-i')[0].style; this.n = q('.q-folds-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.0, 12.0], t);
    const w = eo(seg(t, 0.6, 1.4)); this.w.opacity = w; this.w.transform = 'scale(' + lerp(0.96, 1, w) * lerp(1, 1.025, eio(seg(t, 0.6, 18))) + ')';
    this.i.opacity = eo(seg(t, 6.0, 6.5));
    const NT = [1.6, 6.4, 7.6, 12.4, 12.8]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 20 + 'px)'; });
    const a = eo(seg(t, 6.0, 6.6)); if (a <= 0) return;
    const ctx = this.k.fx, c = this.c, f = eio(seg(t, 7.0, 9.5)), P = FLAT.map((p, i) => [lerp(p[0], FOLD[i][0], f), lerp(p[1], FOLD[i][1], f)]);
    ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (let s = 0; s < 3; s++) {
      const A = P[s], B = P[s + 1], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, back = dx < 0, col = back ? c.a : c.m;
      ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      for (let k = 1; k < 4; k++) { const x = A[0] + dx * k / 4, y = A[1] + dy * k / 4; PS.arrow(ctx, x, y, x + dy / L * 40, y - dx / L * 40, col, 2.5, 9); }
    }
    P.forEach(p => PS.dot(ctx, p[0], p[1], 6, c.s)); ctx.globalAlpha = 1;
  },
});