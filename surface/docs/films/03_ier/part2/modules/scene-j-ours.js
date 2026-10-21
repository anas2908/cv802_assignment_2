const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('j-ours', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 2</span><h2 class="line">IER on our scan</h2></div>' +
      '<div class="words" style="left:110px;top:270px;gap:10px">' +
      '<p class="note j-ours-a" style="position:static;color:var(--second)">input: 12,500 of our 138,677 dots</p>' +
      '<p class="note j-ours-a" style="position:static;color:var(--second)">picked by farthest-point sampling (evenly spread)</p>' +
      '<p class="note j-ours-a" style="position:static">why: IER was trained on about 12,500 dots per shape</p>' +
      '<p class="note j-ours-b" style="position:static;color:var(--second)">50 neighbours · scaled to a box diagonal of 1</p>' +
      '<p class="note j-ours-b" style="position:static;color:var(--second)">authors’ trained weights · ported to newer PyTorch</p></div>' +
      '<div class="words" style="left:110px;top:600px;gap:10px">' +
      '<p class="note warm j-ours-c" style="position:static;font-size:30px">17,488 triangles in 29 s</p>' +
      '<p class="note j-ours-c" style="position:static">F@1% 0.998 · Chamfer 0.187% · NC 0.82</p>' +
      '<p class="note j-ours-d" style="position:static;color:var(--second)">MVS cloud: F@1% 1.000 · Chamfer 0.120% (tied best)</p></div>' +
      '<p class="note j-ours-l1" style="left:960px;top:212px;color:var(--second)">textured (our photo texture)</p>' +
      '<p class="note j-ours-l2" style="left:1440px;top:212px;color:var(--second)">shaded geometry</p>' +
      '<img class="j-ours-i1" src="' + kit.assets.url('ier_textured.png') + '" style="position:absolute;left:960px;top:252px;width:465px;height:620px;border-radius:8px">' +
      '<img class="j-ours-i2" src="' + kit.assets.url('ier_shaded.png') + '" style="position:absolute;left:1440px;top:252px;width:465px;height:620px;border-radius:8px">' +
      '<p class="cap">On our scan: IER expects about 12,500 dots, so we picked 12,500 of the 138,677, spread evenly over the body.</p>' +
      '<p class="cap">We used the authors’ trained network, 50 neighbours, and scaled the cloud the same way as in training.</p>' +
      '<p class="cap">Result: 17,488 triangles in 29 seconds. F@1% 0.998 and Chamfer 0.187%: very close to the dots.</p>' +
      '<p class="cap">On the denser MVS cloud it reached F@1% 1.000, tied best with NKSR.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const all = k => [...kit.stage.querySelectorAll('.j-ours-' + k)];
    Object.assign(this, { a: all('a'), b: all('b'), cc: all('c'), d: all('d'), l1: all('l1'), l2: all('l2'), i1: all('i1'), i2: all('i2') });
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 6.0, 12.0, 17.0], t);
    const op = (els, a, st) => els.forEach((e, i) => { const p = eo(seg(t, a + i * (st || 0.4), a + 0.5 + i * (st || 0.4))); e.style.opacity = p; });
    op(this.a, 0.8); op(this.b, 6.2); op(this.cc, 12.2, 0.8); op(this.d, 17.2);
    op(this.i1, 11.6); op(this.l1, 11.8); op(this.i2, 13.0); op(this.l2, 13.2);
    [...this.i1, ...this.i2].forEach(e => e.style.transform = 'scale(' + lerp(1, 1.015, seg(t, 11, 22)) + ')');
  },
});