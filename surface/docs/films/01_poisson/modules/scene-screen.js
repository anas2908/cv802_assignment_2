const { seg, eo, eio, lerp, TextFx } = kit;
const sg = x => 1 / (1 + Math.exp(-x));
const XA = 1090, XB = 1470, Y0 = 760, Y1 = 400, SX0 = 1000, SX1 = 1560;
kit.scene('screen', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Step 8</span><h2 class="line">Pins keep the skin on the dots</h2></div>' +
      '<div class="words screen-rows" style="left:110px;top:400px;width:720px;gap:10px">' +
      '<p class="note num screen-r1" style="position:static;color:var(--second)">wanted  0   0   0   1   1   1   0   0</p>' +
      '<p class="note num screen-r2" style="position:static">step 7  0  .1  .3  .7  .9  .8  .3  .1</p>' +
      '<p class="box hot screen-rule" style="margin-top:26px">Extra rule: at every dot, χ = 0.5. The dots are pins.</p></div>' +
      '<div class="words screen-eqw" style="left:110px;top:400px;width:760px"><p class="eq" style="font-size:40px">(−Δ + β·SᵀWS) χ = −∇·V + β·SᵀW·c</p>' +
      '<p class="sub">step 7 (arrows) + step 8 (pins) = screened Poisson</p></div>' +
      '<p class="note screen-sk" style="left:1660px;top:552px">χ = 0.5</p>' +
      '<p class="note warm num screen-f" style="left:1600px;top:830px">F@0.5% 0.931</p>' +
      '<p class="cap">Because the arrows are noisy, step 7 gives a soft edge that sits slightly off the dots.</p>' +
      '<p class="cap">We know the dots are exactly on the skin. Extra rule: at every dot, χ = 0.5. Like pins holding a cloth.</p>' +
      '<p class="cap">α is the pin strength. 0 = classic Poisson, smooth but drifting. 4 = ours: F@0.5% 0.931 → 0.970.</p>' +
      '<p class="cap">Steps 7 and 8 are solved together, as one equation: screened Poisson.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.screen-' + k);
    this.r1 = q('r1').style; this.r2 = q('r2').style; this.rule = q('rule').style; this.rows = q('rows').style;
    this.eqw = q('eqw').style; this.sk = q('sk').style; this.fS = q('f').style; this.f = q('f');
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
  },
  render(t) {
    t = t * 13 / 20;   // slowed down: the scene runs 20 s instead of 13 s
    TextFx.fadeFromRight(this.line, t, 0.15);
    PS.caps(this.caps, [0.2, 4.0, 8.8, 11.8], t);
    const ctx = this.k.fx, c = this.c;
    const p1 = eio(seg(t, 4.8, 7.0)), knob = eio(seg(t, 9.6, 11.6));
    const pe = t < 8.8 ? p1 : t < 9.6 ? 1 - eio(seg(t, 8.8, 9.4)) : knob;
    const soft = lerp(48, 12, pe), sa = lerp(44, 0, pe), sb = lerp(-32, 0, pe);
    const f = x => sg((x - (XA + sa)) / soft) * sg(((XB + sb) - x) / soft);
    const Y = v => lerp(Y0, Y1, v), ym = Y(0.5);
    ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(920, Y0); ctx.lineTo(1650, Y0); ctx.stroke();
    ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(920, ym); ctx.lineTo(1650, ym); ctx.stroke(); ctx.setLineDash([]);
    this.sk.opacity = eo(seg(t, 0.6, 1.2));
    const dp = eo(seg(t, 0.4, 1.4));
    ctx.strokeStyle = c.m; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath();
    const xe = lerp(920, 1650, dp);
    for (let x = 920; x <= xe; x += 3) { const y = Y(f(x)); x === 920 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    [XA, XB].forEach((x, k) => {
      PS.dot(ctx, x, ym, 11, c.s);
      const g = eo(seg(t, 1.6, 2.2)) * (1 - pe) * (t < 8.8 ? 1 : 0);
      if (g > 0.02) {
        let cx = x; for (let s = -80; s <= 80; s += 0.5) { if (Math.abs(f(x + s) - 0.5) < Math.abs(f(cx) - 0.5)) cx = x + s; }
        ctx.globalAlpha = g; PS.arrow(ctx, x, ym + 40, cx, ym + 40, c.a, 3, 10); PS.arrow(ctx, cx, ym + 40, x, ym + 40, c.a, 3, 10); ctx.globalAlpha = 1;
      }
      const pin = eo(seg(t, 4.2 + k * 0.25, 4.7 + k * 0.25)) * (t < 8.8 ? 1 : t < 9.6 ? 1 - seg(t, 8.8, 9.3) : knob);
      if (pin > 0) { const top = lerp(ym - 240, ym - 70, Math.min(1, pin)); ctx.globalAlpha = pin; ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + 70); ctx.stroke(); PS.dot(ctx, x, top, 14, c.a); ctx.globalAlpha = 1; }
    });
    const sl = eo(seg(t, 8.9, 9.4));
    if (sl > 0) {
      ctx.globalAlpha = sl; ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(SX0, 850); ctx.lineTo(SX1, 850); ctx.stroke();
      ctx.strokeStyle = c.a; ctx.beginPath(); ctx.moveTo(SX0, 850); ctx.lineTo(lerp(SX0, SX1, pe), 850); ctx.stroke();
      PS.dot(ctx, lerp(SX0, SX1, pe), 850, 15, c.a);
      ctx.font = '600 24px ' + this.mono; ctx.fillStyle = c.s; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('α = 0', SX0, 878); ctx.fillText('α = 4', SX1, 878); ctx.globalAlpha = 1;
    }
    this.fS.opacity = sl; this.f.textContent = 'F@0.5% ' + (0.931 + 0.039 * (t < 9.6 ? 0 : knob)).toFixed(3);
    this.r1.opacity = eo(seg(t, 0.5, 1.0)); this.r2.opacity = eo(seg(t, 1.3, 1.8)); this.rule.opacity = eo(seg(t, 4.0, 4.5));
    this.rows.opacity = 1 - seg(t, 11.4, 11.8);
    this.eqw.opacity = eo(seg(t, 11.9, 12.4));
  },
});