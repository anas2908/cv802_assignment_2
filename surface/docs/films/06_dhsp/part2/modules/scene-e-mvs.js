const { seg, eo, eio, lerp, TextFx } = kit;
const CX = [1040, 1330, 1560], Y0 = 300, DY = 66;
const ROWS = [['', '3D prior', 'full recipe'], ['MVS', '0.980', '0.900'], ['MVS-clean', '0.982', '0.916']];
kit.scene('e-mvs', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">DHSP · Other input</span><h2 class="line">On the MVS cloud</h2></div>' +
      '<p class="note e-mvs-t" style="left:1040px;top:252px;color:var(--second)">F@1%</p>';
    ROWS.forEach((r, i) => { h += '<div class="e-mvs-r">' + r.map((s, j) => s ? '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + i * DY) + 'px;font-size:' + (i ? 28 : 26) + 'px;color:' + (i ? 'var(--second)' : 'var(--accent)') + '">' + s + '</p>' : '').join('') + '</div>'; });
    h += '<div class="words" style="left:1040px;top:520px;width:820px;gap:10px"><p class="note warm e-mvs-n">stray dots → thin fins in the shape picture</p><p class="note warm e-mvs-n">arms touching the body → loops, no one-piece cut</p><p class="note e-mvs-n" style="color:var(--second)">final atlas by xatlas: the mesh is not closed</p></div>' +
      '<div class="words e-mvs-i" style="left:250px;top:840px;width:540px;align-items:center"><p class="note">illustration: arms touching the body make loops</p></div>' +
      '<p class="cap">On our MVS cloud the story changes. The 3D prior is fine, F-score 0.98, but the full recipe drops to 0.90.</p>' +
      '<p class="cap">Stray dots become thin fins in the shape picture, and the image prior happily completes them.</p>' +
      '<p class="cap">And there the arms touch the body, making loops like a mug with two handles. OptCuts cannot cut that into one flat piece, so xatlas steps in.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.t = q('.e-mvs-t')[0].style; this.r = q('.e-mvs-r'); this.n = q('.e-mvs-n'); this.i = q('.e-mvs-i')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 12.6], t);
    this.t.opacity = eo(seg(t, 0.8, 1.3)); this.r.forEach((el, i) => { const p = eo(seg(t, 0.8 + i * 0.6, 1.3 + i * 0.6)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    [6.8, 12.8, 14.6].forEach((a, i) => { const p = eo(seg(t, a, a + 0.5)); this.n[i].style.opacity = p; this.n[i].style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.i.opacity = eo(seg(t, 12.8, 13.3));
    const ctx = this.k.fx, c = this.c, a = eo(seg(t, 12.6, 13.8)); if (a <= 0) return;
    const cx = 520, cy = 560; ctx.globalAlpha = a; ctx.lineWidth = 5; ctx.strokeStyle = c.m; ctx.fillStyle = PS.mix(c.g, c.m, 0.18);
    ctx.beginPath(); ctx.ellipse(cx, cy, 150, 250, 0, 0, PS.TAU); ctx.fill(); ctx.stroke();
    const loop = (sx) => { const k = eio(seg(t, 13.0, 15.0)); ctx.beginPath(); ctx.moveTo(cx + sx * 140, cy - 150); ctx.bezierCurveTo(cx + sx * 330, cy - 120, cx + sx * 300, cy + 60, cx + sx * lerp(260, 40, k), cy + 40); ctx.stroke(); return k; };
    ctx.lineWidth = 34; ctx.strokeStyle = PS.mix(c.g, c.m, 0.55); loop(1); const k = loop(-1);
    if (k > 0.95) { const hl = eo(seg(t, 15.0, 15.8)); ctx.globalAlpha = a * hl; ctx.lineWidth = 4; ctx.strokeStyle = c.a; ctx.setLineDash([8, 7]); [1, -1].forEach(sx => { ctx.beginPath(); ctx.ellipse(cx + sx * 175, cy - 40, 52, 82, 0, 0, PS.TAU); ctx.stroke(); }); ctx.setLineDash([]); }
    ctx.globalAlpha = 1;
  },
});