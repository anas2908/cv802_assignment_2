const { seg, eo, eio, lerp, TextFx } = kit;
const LQ = [150, 250, 520];
kit.scene('n-learned', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">NKSR · The learned part</span><h2 class="line">Learned bumps</h2></div>' +
      '<div class="words" style="left:150px;top:790px;width:520px;align-items:center"><p class="note n-learned-a">each cell: a list of numbers (features)</p></div>' +
      '<div class="words" style="left:760px;top:300px;width:1100px;gap:12px"><p class="eq n-learned-e" style="font-size:48px">K(x, y) = ⟨φ(x), φ(y)⟩ · B(x − y)</p>' +
      '<p class="note n-learned-e" style="color:var(--second)">bump = feature similarity × a small smooth hill</p></div>' +
      '<div class="words" style="left:780px;top:760px;width:340px;align-items:center"><p class="note n-learned-f">fixed bumps (toy)</p></div>' +
      '<div class="words" style="left:1180px;top:760px;width:340px;align-items:center"><p class="note warm n-learned-f">learned bumps</p></div>' +
      '<p class="note n-learned-i" style="left:1590px;top:600px;color:color-mix(in srgb, var(--second) 60%, var(--ground))">illustration</p>' +
      '<div class="words" style="left:760px;top:830px;width:1100px"><p class="note warm n-learned-g">pretrained once: the “kitchen-sink” model, objects + rooms + streets</p></div>' +
      '<p class="cap">In the toy, every bump had the same fixed shape. In NKSR, the bumps are learned.</p>' +
      '<p class="cap">A sparse 3D network looks at the dots around each cell and gives that cell a list of numbers: its features.</p>' +
      '<p class="cap">The bump between two places is how similar their features are, times a small smooth hill. So bumps change shape from place to place.</p>' +
      '<p class="cap">The network was trained once on a mix of objects, rooms and street scenes. It also predicts a clean arrow for each cell. We only run it.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.a = q('.n-learned-a')[0].style; this.e = q('.n-learned-e'); this.f = q('.n-learned-f'); this.i = q('.n-learned-i')[0].style; this.g = q('.n-learned-g')[0].style;
    const r = PS.rng(8); this.cells = TOY.resample(TOY.SH, 36).map(p => ({ p, bars: Array.from({ length: 6 }, () => 0.2 + 0.8 * r()) }));
    this.ell = Array.from({ length: 9 }, (_, i) => ({ x: i, rx: 26 + r() * 30, ry: 14 + r() * 26, a: (r() - 0.5) * 1.6 }));
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.0, 12.0, 18.6], t);
    this.a.opacity = eo(seg(t, 6.6, 7.1)); this.e.forEach((el, i) => el.style.opacity = eo(seg(t, 12.2 + i * 0.6, 12.7 + i * 0.6))); this.f.forEach((el, i) => el.style.opacity = eo(seg(t, 1.0 + i * 1.6, 1.5 + i * 1.6))); this.i.opacity = eo(seg(t, 2.0, 2.5)); this.g.opacity = eo(seg(t, 18.8, 19.3));
    const ctx = this.k.fx, c = this.c, map = (x, y) => [LQ[0] + (x + 0.78) / 1.56 * LQ[2], LQ[1] + (y + 0.78) / 1.56 * LQ[2]];
    const fa = eo(seg(t, 6.2, 8.4));
    if (fa > 0) this.cells.forEach((cl, k) => { const v = Math.min(1, Math.max(0, fa * 1.5 - k / 36 * 0.5)); if (v <= 0) return; const p = map(cl.p[0], cl.p[1]); ctx.globalAlpha = v; ctx.strokeStyle = PS.mix(c.g, c.m, 0.7); ctx.lineWidth = 1.5; ctx.strokeRect(p[0] - 18, p[1] - 18, 36, 36); cl.bars.forEach((h, j) => { ctx.fillStyle = j % 2 ? c.m : c.a; ctx.fillRect(p[0] - 15 + j * 5, p[1] + 15 - 28 * h * v, 4, 28 * h * v); }); });
    ctx.globalAlpha = 1;
    const rows = [[950, 560, false], [1350, 560, true]];
    rows.forEach(([cx, cy, learned], k) => { const v = eo(seg(t, 1.0 + k * 1.6, 2.2 + k * 1.6)); if (v <= 0) return; ctx.globalAlpha = v; ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = cx - 150 + i * 7.5, y = cy + 40 * Math.sin(i / 40 * 3.2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      this.ell.forEach((e, i) => { const x = cx - 140 + i * 35, y = cy + 40 * Math.sin((x - cx + 150) / 300 * 3.2), br = 1 + 0.03 * Math.sin(t * 2 + i); ctx.strokeStyle = learned ? c.a : c.m; ctx.lineWidth = 2; ctx.beginPath(); if (learned) ctx.ellipse(x, y, e.rx * br, e.ry * br, e.a, 0, PS.TAU); else ctx.arc(x, y, 30, 0, PS.TAU); ctx.stroke(); }); ctx.globalAlpha = 1; });
  },
});