const { seg, eo, eio, lerp, TextFx } = kit;
const BXC = [430, 600], WXC = [1060, 600], WS = 470, U = 250;
kit.scene('c-post', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · run.sh, after</span><h2 class="line">Putting it back</h2></div>' +
      '<div class="words c-post-l" style="left:130px;top:250px;width:600px;align-items:center"><p class="note warm">the method’s mesh, in its own box</p></div>' +
      '<div class="words c-post-w" style="left:760px;top:250px;width:600px;align-items:center"><p class="note" style="color:var(--second)">the scan’s dots, where they really are</p></div>' +
      '<div class="words" style="left:1450px;top:300px;width:400px;gap:10px">' +
      '<p class="note c-post-n" style="color:var(--second)">prepare</p><p class="eq c-post-n" style="font-size:40px">q = s · (p − c)</p>' +
      '<p class="note c-post-n" style="margin-top:22px;color:var(--second)">put back</p><p class="eq c-post-n" style="font-size:40px;color:var(--accent)">p = q / s + c</p>' +
      '<p class="note c-post-n" style="margin-top:22px;white-space:normal">s, c and the turn come from transform.json</p>' +
      '<p class="note warm c-post-n" style="margin-top:22px;white-space:normal">size check: within 0.67 to 1.5 of the input, or rescale</p></div>' +
      '<p class="box c-post-f" style="left:300px;top:846px;font-family:var(--mono);font-size:24px;color:var(--main)">geometry.ply</p>' +
      '<p class="box c-post-f" style="left:560px;top:846px;font-family:var(--mono);font-size:24px;color:var(--main)">method_info.json</p>' +
      '<p class="cap">The official code writes its mesh inside its own small box. The post step undoes the preparation, using transform.json.</p>' +
      '<p class="cap">Divide by the scale, add the centre back, turn back if it was turned. The mesh lands exactly on the scan’s dots again.</p>' +
      '<p class="cap">A size check catches a method that rescaled on its own. Then geometry.ply and method_info.json are written: the contract is met.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.c-post-l')[0].style; this.w = q('.c-post-w')[0].style; this.n = q('.c-post-n'); this.f = q('.c-post-f');
    const r = PS.rng(21), base = TOY.resample(TOY.SH, 480); this.D = base.map(p => [p[0] + (r() - 0.5) * 0.045, p[1] + (r() - 0.5) * 0.045]);
    let lo = [1e9, 1e9], hi = [-1e9, -1e9]; this.D.forEach(p => { lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[1])]; hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[1])]; });
    this.C0 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2]; this.hw = Math.max((hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2); this.M = TOY.resample(TOY.SH, 160);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.4], t);
    this.l.opacity = eo(seg(t, 1.0, 1.5)) * (1 - eo(seg(t, 7.0, 7.5))); this.w.opacity = eo(seg(t, 0.4, 0.9));
    const NT = [1.6, 1.9, 7.2, 7.5, 8.2, 13.8]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.f.forEach((el, i) => { const p = eo(seg(t, 15.6 + 0.5 * i, 16.1 + 0.5 * i)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    const ctx = this.k.fx, c = this.c, bs = 0.9 / this.hw * U, mv = eio(seg(t, 7.4, 10.4));
    // the scan's dots, in place
    ctx.globalAlpha = eo(seg(t, 0.4, 1.2)) * 0.85; ctx.fillStyle = PS.mix(c.g, c.m, 0.8); this.D.forEach(p => { ctx.fillRect(WXC[0] + (p[0] - this.C0[0]) * WS - 2, WXC[1] + (p[1] - this.C0[1]) * WS - 2, 4, 4); }); ctx.globalAlpha = 1;
    // the method's box (fades as the mesh leaves it)
    const ba = eo(seg(t, 0.8, 1.4)) * (1 - 0.7 * mv); ctx.globalAlpha = ba; ctx.strokeStyle = c.a; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]); ctx.strokeRect(BXC[0] - 0.9 * U, BXC[1] - 0.9 * U, 1.8 * U, 1.8 * U); ctx.setLineDash([]); ctx.globalAlpha = 1;
    // the mesh outline: in the box, then put back onto the dots
    const s = lerp(bs, WS, mv), cx = lerp(BXC[0], WXC[0], mv), cy = lerp(BXC[1], WXC[1], mv), ma = eo(seg(t, 1.0, 1.8));
    if (ma > 0) { ctx.globalAlpha = ma; ctx.strokeStyle = mv >= 1 ? c.s : c.a; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.beginPath(); this.M.forEach((p, i) => { const x = cx + (p[0] - this.C0[0]) * s, y = cy + (p[1] - this.C0[1]) * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; }
    const ok = eo(seg(t, 10.6, 11.2)); if (ok > 0) { ctx.globalAlpha = ok; ctx.strokeStyle = c.m; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(WXC[0] - 26, 900 - 18); ctx.lineTo(WXC[0] - 6, 900); ctx.lineTo(WXC[0] + 30, 900 - 38); ctx.stroke(); ctx.globalAlpha = 1; }
  },
});
