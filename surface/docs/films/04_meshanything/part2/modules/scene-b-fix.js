const { seg, eo, eio, eob, lerp, TextFx } = kit;
const BX = [105, 470, 835, 1200, 1565], BY = 236;
const TXT = ['our raw dots (138,677)', 'our Poisson mesh, closed (Video 1)', 'their marching-cubes step, 128 steps', '8,192 clean dots + arrows', 'MeshAnything V2'];
kit.scene('b-fix', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">MeshAnything · On our scan</span><h2 class="line">The fix</h2></div>';
    TXT.forEach((s, i) => { h += '<p class="box ' + (i === 1 || i === 4 ? 'hot ' : '') + 'b-fix-b" style="left:' + BX[i] + 'px;top:' + BY + 'px;width:300px;height:100px;display:flex;align-items:center;justify-content:center;text-align:center">' + s + '</p>'; });
    h += '<p class="note b-fix-m" style="left:210px;top:378px">before: raw dots</p><p class="note warm b-fix-m" style="left:780px;top:378px">after: through our mesh</p>' +
      '<div class="words" style="left:1240px;top:440px;width:640px;gap:18px">' +
      '<p class="eq num b-fix-n" style="font-size:40px">F@1%: 0.51 → 0.987</p>' +
      '<p class="eq num b-fix-n" style="font-size:40px">Chamfer: 1.27% → 0.30%</p>' +
      '<p class="eq num b-fix-n" style="font-size:40px">triangles: 1,802 → 1,435</p>' +
      '<p class="note b-fix-n" style="margin-top:16px">also: turned so up is +Y, fitted into the box,</p>' +
      '<p class="note b-fix-n">then moved back onto our scan afterwards</p></div>' +
      '<p class="cap">The authors’ advice: give the model a dense mesh, not raw dots. We already had one: our own Poisson mesh from Video 1.</p>' +
      '<p class="cap">Their marching-cubes step rebuilds it on the same 128-step grid used in training, then spreads 8,192 dots with arrows over it.</p>' +
      '<p class="cap">Now the dots look just like training dots, and the mesh comes out whole.</p>' +
      '<p class="cap">F-score at 1% jumps from 0.51 to 0.99 and the Chamfer gap shrinks four times. Same model; only the input changed.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.b-fix-b'); this.m = q('.b-fix-m'); this.n = q('.b-fix-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.6, 18.8], t);
    const BT = [0.6, 1.6, 6.6, 8.4, 10.2];
    this.b.forEach((el, i) => { const p = seg(t, BT[i], BT[i] + 0.5); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.9, 1, eob(p, 1.6)) + ')'; });
    this.m.forEach((el, i) => el.style.opacity = eo(seg(t, 12.4 + i, 12.9 + i)));
    const NT = [15.0, 15.8, 16.6, 20.6, 21.0];
    this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < 4; i++) { const p = eo(seg(t, BT[i + 1] - 0.4, BT[i + 1])); if (p > 0) { ctx.globalAlpha = p; PS.arrow(ctx, BX[i] + 306, BY + 50, BX[i] + 306 + 52 * p, BY + 50, c.a, 3, 11); ctx.globalAlpha = 1; } }
    const yaw = lerp(-0.35, 0.35, eio(seg(t, 12, 26)));
    const r = eo(seg(t, 12.2, 13.0)); if (r > 0) MA.draw(ctx, 'r2', { c, cx: 330, cy: 668, s: 470, yaw, pitch: 0.1, edge: 0.5 * r, fill: 0.55 * r, lw: 1 });
    const g = eo(seg(t, 13.2, 14.4)); if (g > 0) MA.draw(ctx, 'v2', { c, cx: 900, cy: 668, s: 470, yaw, pitch: 0.1, edge: 0.75 * g, fill: g, lw: 1.1 });
  },
});