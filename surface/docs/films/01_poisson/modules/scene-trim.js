const { seg, eo, eio, lerp, TextFx } = kit;
const GAP = th => { let d = Math.atan2(Math.sin(th - Math.PI / 2), Math.cos(th - Math.PI / 2)); return Math.abs(d) < 0.6; };
kit.scene('trim', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 10</span><h2 class="line">Trim invented skin</h2></div>' +
      '<div class="words" style="left:110px;top:400px;width:640px"><p class="box trim-b1">Trimmed: no invented skin, small openings. Best accuracy, F@0.5% 0.988.</p>' +
      '<p class="box hot trim-b2">Watertight (untrimmed): closed like a balloon, needed for 3D printing. F@0.5% 0.977.</p></div>' +
      '<p class="note warm trim-n" style="left:1150px;top:800px">no dots here</p>' +
      '<p class="cap">χ always has a closed border, so Poisson invents skin where there were no dots (under the feet).</p>' +
      '<p class="cap">Trim: delete every triangle that is more than 2 cells from the nearest dot.</p>' +
      '<p class="cap">We keep both versions: trimmed for accuracy, watertight for printing.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.trim-' + k).style;
    this.b1 = q('b1'); this.b2 = q('b2'); this.n = q('n');
    this.d = PS.dots(60, 12, 0.02, GAP);
    this.segs = [];
    for (let k = 0; k < 120; k++) {
      const a = k / 120 * PS.TAU, b = (k + 1) / 120 * PS.TAU, m = PS.at((a + b) / 2);
      const dmin = Math.min(...this.d.map(q => Math.hypot(q.x - m[0], q.y - m[1])));
      this.segs.push({ a, b, far: dmin > 34 });
    }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 3.4, 6.6], t);
    const ctx = this.k.fx, c = this.c;
    const op = eio(seg(t, 1.4, 2.9));
    const check = eo(seg(t, 3.8, 4.8)), cut = eio(seg(t, 5.0, 6.2)), back = eo(seg(t, 7.4, 8.2));
    this.segs.forEach((s, k) => {
      const p = Math.min(1, Math.max(0, op * 120 - k)); if (p <= 0) return;
      let color = c.m, alpha = 1, w = 6, dash = false;
      if (s.far) {
        color = check > 0 ? PS.mix(c.m, c.a, check) : c.m;
        alpha = 1 - cut;
        if (back > 0 && cut >= 1) { alpha = back * 0.7; dash = true; w = 4; }
      }
      if (alpha <= 0) return;
      ctx.globalAlpha = alpha; if (dash) ctx.setLineDash([12, 10]);
      PS.outline(ctx, color, w, s.a, s.a + (s.b - s.a) * p);
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    });
    const dp = eo(seg(t, 0.2, 1.3));
    this.d.forEach((q, i) => PS.dot(ctx, q.x, q.y, 6 * eo(Math.min(1, Math.max(0, dp * 1.5 - i / this.d.length * 0.5))), c.s));
    if (check > 0 && cut < 1) {
      ctx.globalAlpha = check * (1 - cut) * 0.8; ctx.setLineDash([6, 8]); ctx.strokeStyle = c.a; ctx.lineWidth = 2;
      this.segs.forEach((s, k) => { if (!s.far || k % 3) return; const m = PS.at((s.a + s.b) / 2); ctx.beginPath(); ctx.arc(m[0], m[1], 34, 0, PS.TAU); ctx.stroke(); });
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    this.n.opacity = eo(seg(t, 3.0, 3.5)) * (1 - seg(t, 6.3, 6.7));
    this.b1.opacity = eo(seg(t, 6.7, 7.3)); this.b2.opacity = eo(seg(t, 7.5, 8.1));
  },
});