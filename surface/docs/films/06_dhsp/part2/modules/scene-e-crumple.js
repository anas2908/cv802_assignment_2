const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('e-crumple', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · Part 2</span><h2 class="line">The crumpled prior</h2></div>' +
      '<div class="words" style="left:1290px;top:290px;width:600px;gap:10px">' +
      '<p class="eq num e-crumple-n" style="font-size:46px">F@1%  0.999</p><p class="note e-crumple-n" style="color:var(--second)">as close to the dots as Poisson</p>' +
      '<p class="eq num e-crumple-n" style="font-size:46px;margin-top:22px">NC  0.65</p><p class="note e-crumple-n" style="color:var(--second)">but the surface is crumpled</p>' +
      '<p class="eq num e-crumple-n" style="font-size:46px;margin-top:22px;color:var(--accent)">42% fold</p><p class="note warm e-crumple-n">of neighbouring triangle pairs</p><p class="note e-crumple-n">after round 2: only 1%</p></div>' +
      '<p class="cap">Back to our scan. DHSP’s 3D prior alone already sits very close to the dots: F-score at 1% of 0.999, as good as Poisson.</p>' +
      '<p class="cap">But its normal consistency is only 0.65. Up close, the skin is crumpled like a paper ball.</p>' +
      '<p class="cap">We counted: 42% of neighbouring triangle pairs face opposite ways, shown in gold. After round 2 it was only 1%; the folding comes late.</p>' +
      '<p class="cap">The dots are matched, but the surface between them is folded. And that breaks the next step of the recipe.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.n = q('.e-crumple-n');
    this.S = MESH.at(MESH.stage(MESH.load(kit, 'dh-prior.json')), 0);
    const f = FOLD(this.S), g = PS.hex(this.c.a); this.share = f.share; this.cols = Array.from(f.flags, x => x ? g : null);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.6, 19.0], t);
    const NT = [5.6, 5.9, 7.0, 7.3, 13.0, 13.3, 13.8];
    this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const z = eio(seg(t, 8.0, 11.5)) * (1 - eio(seg(t, 19.0, 23.0))), s = lerp(760, 1900, z), cy = lerp(566, 560 + 0.12 * s, z);
    const a = eo(seg(t, 0.3, 1.4)), hl = eo(seg(t, 12.4, 13.4));
    const ctx = this.k.fx; ctx.save(); ctx.beginPath(); ctx.rect(110, 206, 1150, 726); ctx.clip();
    if (z > 0.01) { ctx.globalAlpha = 0.5 * z; ctx.strokeStyle = PS.mix(this.c.g, this.c.s, 0.4); ctx.lineWidth = 2; ctx.strokeRect(112, 208, 1146, 722); ctx.globalAlpha = 1; }
    MESH.draw(ctx, this.S, { c: this.c, cx: 700, cy, s, yaw: lerp(-0.45, 0.35, eio(seg(t, 0, 26))), pitch: 0.12, edge: 0.3 * a, fill: a, lw: 0.6, colors: hl > 0.5 ? this.cols : null });
    ctx.restore();
  },
});