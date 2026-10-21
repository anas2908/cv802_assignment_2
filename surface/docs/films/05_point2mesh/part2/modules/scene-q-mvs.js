const { seg, eo, eio, lerp, TextFx } = kit;
const TC = [330, 520], TS = 320, FLT = [0.66, -0.36];
kit.scene('q-mvs', {
  init(kit) {
    const win = (left, sx, w, cls) => '<div class="' + cls + '" style="position:absolute;left:' + left + 'px;top:262px;width:' + w + 'px;height:600px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('p2m_fig.jpg') + '" style="position:absolute;left:' + (-sx) + 'px;top:-76px;width:942px;height:696px"></div>';
    const lab = (cx, a, b, cls) => '<div class="words ' + cls + '" style="left:' + (cx - 150) + 'px;top:872px;width:300px;align-items:center;gap:2px"><p class="note" style="color:var(--second)">' + a + '</p><p class="note warm">' + b + '</p></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Other input</span><h2 class="line">Stray dots</h2></div>' +
      win(640, 417, 269, 'q-mvs-w') + win(950, 696, 240, 'q-mvs-w') + lab(774, 'raw MVS', 'F@1% 0.133', 'q-mvs-l') + lab(1070, 'MVS-clean', 'F@1% 0.387', 'q-mvs-l') +
      '<p class="note q-mvs-t" style="left:150px;top:740px">illustration</p>' +
      '<div class="words" style="left:1290px;top:290px;width:600px;gap:10px">' +
      '<p class="note q-mvs-n">the MVS cloud has stray dots</p><p class="note q-mvs-n">floating in the air</p>' +
      '<p class="note warm q-mvs-n" style="margin-top:18px">a shrink-wrap must cover them all,</p><p class="note warm q-mvs-n">so it stretches out membranes</p>' +
      '<p class="note q-mvs-n" style="margin-top:18px;color:var(--second)">404 strays removed: 0.133 → 0.387</p><p class="note q-mvs-n" style="color:var(--second)">still far below VGGSfM: 0.844</p></div>' +
      '<p class="cap">Our second input, the MVS cloud, is denser but has stray dots floating in the air around the person.</p>' +
      '<p class="cap">A shrink-wrap has to cover every dot, so it stretches thin membranes out to the strays. F-score at 1%: only 0.133.</p>' +
      '<p class="cap">Removing 404 stray dots helps, to 0.387, but folds remain and it stays far below the VGGSfM result of 0.844.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.q-mvs-w'); this.l = q('.q-mvs-l'); this.n = q('.q-mvs-n'); this.t = q('.q-mvs-t')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.0, 12.6], t);
    const WT = [6.4, 13.0];
    this.w.forEach((el, i) => { const p = eo(seg(t, WT[i], WT[i] + 0.8)); el.style.opacity = p; el.style.transform = 'scale(' + lerp(0.96, 1, p) * lerp(1, 1.02, eio(seg(t, WT[i], 22))) + ')'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, WT[i] + 0.6, WT[i] + 1.1)));
    const NT = [0.8, 1.1, 6.2, 6.5, 13.2, 13.5]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 20 + 'px)'; });
    this.t.opacity = eo(seg(t, 1.0, 1.5));
    const ctx = this.k.fx, c = this.c, S = p => [TC[0] + p[0] * TS, TC[1] + p[1] * TS];
    const d = eo(seg(t, 0.4, 1.4)); if (d <= 0) return;
    ctx.globalAlpha = d; TOY.DOTS.forEach((p, i) => { if (i % 2) return; const q = S(p); PS.dot(ctx, q[0], q[1], 3.5, c.s); });
    const fq = S(FLT), fl = eo(seg(t, 1.8, 2.4)); if (fl > 0) { ctx.globalAlpha = fl; PS.dot(ctx, fq[0], fq[1], 7, c.a); }
    ctx.globalAlpha = d;
    const m = eio(seg(t, 2.6, 6.0)), pull = eio(seg(t, 4.0, 6.2));
    let best = 0, bd = 1e9; TOY.OUT.forEach((p, k) => { const dd = Math.hypot(p[0] - FLT[0], p[1] - FLT[1]); if (dd < bd) { bd = dd; best = k; } });
    const P = TOY.WRAP.map((w, k) => { const o = TOY.OUT[k], g = Math.max(0, 1 - Math.abs(((k - best + TOY.N / 2 + TOY.N) % TOY.N) - TOY.N / 2) / 9), tx = lerp(o[0], FLT[0], g * pull), ty = lerp(o[1], FLT[1], g * pull); return S([lerp(w[0], tx, m), lerp(w[1], ty, m)]); });
    ctx.strokeStyle = c.a; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = 1;
  },
});