const { seg, eo, eio, eob, lerp, TextFx } = kit;
const BX = [[200, 300], [760, 300], [760, 700], [200, 700]], BW = 400, BH = 112;
const TXT = ['points + arrows: the shape', 'Poisson in one step (FFT)', 'marching cubes: a mesh', 'gap to our dots (Chamfer)'];
kit.scene('s-loop', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">SAP · Optimisation</span><h2 class="line">Learning by doing</h2></div>';
    TXT.forEach((s, i) => { h += '<p class="box ' + (i === 3 ? 'hot ' : '') + 's-loop-b" style="left:' + BX[i][0] + 'px;top:' + BX[i][1] + 'px;width:' + BW + 'px;height:' + BH + 'px;display:flex;align-items:center;justify-content:center;text-align:center">' + s + '</p>'; });
    h += '<p class="note warm s-loop-g" style="left:30px;top:540px">nudge every</p><p class="note warm s-loop-g" style="left:30px;top:576px">point + arrow</p>' +
      '<div class="words" style="left:1250px;top:310px;width:640px;gap:12px">' +
      '<p class="note s-loop-n" style="color:var(--second)">every step is smooth, so the gap</p><p class="note s-loop-n" style="color:var(--second)">traces back to each point</p>' +
      '<p class="note s-loop-n" style="margin-top:24px">repeat thousands of times</p>' +
      '<p class="note warm s-loop-n" style="margin-top:24px">it compares only dot positions:</p><p class="note warm s-loop-n">our arrows are never needed</p></div>' +
      '<p class="cap">So SAP learns its points by trial: points and arrows go through Poisson, marching cubes makes a mesh, and the mesh is compared with our dots.</p>' +
      '<p class="cap">Because every step is smooth, the gap can be traced back to each point and arrow: move this way, and the gap shrinks.</p>' +
      '<p class="cap">Nudge them all and repeat, thousands of times. Note what it compares: only our dots’ positions. It never needs our arrows.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.s-loop-b'); this.g = q('.s-loop-g'); this.n = q('.s-loop-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 8.0, 15.0], t);
    const BT = [0.8, 2.0, 3.2, 4.4];
    this.b.forEach((el, i) => { const p = seg(t, BT[i], BT[i] + 0.5); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.9, 1, eob(p, 1.6)) + ')'; });
    this.g.forEach((el, i) => el.style.opacity = eo(seg(t, 8.4 + i * 0.3, 8.9 + i * 0.3)));
    const NT = [8.6, 9.0, 15.2, 16.0, 16.4]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c;
    const A = [[BX[0][0] + BW + 8, BX[0][1] + BH / 2, BX[1][0] - 8, BX[1][1] + BH / 2, 1.6], [BX[1][0] + BW / 2, BX[1][1] + BH + 8, BX[2][0] + BW / 2, BX[2][1] - 8, 2.8], [BX[2][0] - 8, BX[2][1] + BH / 2, BX[3][0] + BW + 8, BX[3][1] + BH / 2, 4.0]];
    A.forEach(([x0, y0, x1, y1, a]) => { const p = eo(seg(t, a, a + 0.5)); if (p <= 0) return; ctx.globalAlpha = p; PS.arrow(ctx, x0, y0, lerp(x0, x1, p), lerp(y0, y1, p), c.m, 3, 12); ctx.globalAlpha = 1; });
    const g = eo(seg(t, 8.2, 9.2)); if (g > 0) { const x = BX[3][0] + BW / 2, y0 = BX[3][1] - 8, y1 = BX[0][1] + BH + 8; ctx.globalAlpha = g; PS.arrow(ctx, x, y0, x, lerp(y0, y1, g), c.a, 5, 16); ctx.globalAlpha = 1; }
    if (t > 5.0) {
      const path = [[680, 356], [960, 556], [680, 756], [400, 556]], u = ((t - 5.0) / 3.2) % 1, k = Math.floor(u * 4), f = eio(u * 4 - k), a = path[k], b = path[(k + 1) % 4];
      PS.dot(ctx, lerp(a[0], b[0], f), lerp(a[1], b[1], f), 9, k === 3 ? c.a : c.s);
    }
  },
});