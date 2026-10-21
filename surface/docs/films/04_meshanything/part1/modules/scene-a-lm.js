const { seg, eo, eob, lerp, TextFx } = kit;
const R1 = [['corners', 52], ['sides', 38], ['angles', 8], ['wheels', 1]];
const R2 = [['and', 47], ['that', 26], ['joined', 14], ['only', 6]];
const RY = [468, 543, 618, 693];
function bars(R, k) { let h = ''; R.forEach((r, i) => { const w = Math.round(r[1] * 11); h += '<div class="a-lm-r' + k + '" style="position:absolute;left:0;top:' + RY[i] + 'px;width:1920px;height:60px">' +
  '<p class="note a-lm-lab" style="left:150px;top:8px;width:290px;text-align:right;font-size:32px;color:var(--second)">' + r[0] + '</p>' +
  '<div class="a-lm-bar" style="position:absolute;left:470px;top:10px;height:42px;width:' + w + 'px;border-radius:6px;background:color-mix(in srgb, var(--main) 70%, var(--ground));transform-origin:0 50%"></div>' +
  '<div class="a-lm-gold" style="position:absolute;left:470px;top:10px;height:42px;width:' + w + 'px;border-radius:6px;background:var(--accent);opacity:0"></div>' +
  '<p class="note num a-lm-pc" style="left:' + (486 + w) + 'px;top:12px;font-size:30px">' + r[1] + '%</p></div>'; }); return h; }
const slot = (k, w, word) => '<div class="box hot a-lm-s' + k + '" style="position:relative;width:' + w + 'px;height:74px;font-size:40px;border-style:dashed"><span class="a-lm-q" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--accent)">?</span><span class="a-lm-w" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">' + word + '</span></div>';
kit.scene('a-lm', {
  init(kit) {
    const chip = s => '<p class="box a-lm-c" style="font-size:40px;height:74px;display:flex;align-items:center">' + s + '</p>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · The idea it borrows</span><h2 class="line">How a language model writes</h2></div>' +
      '<p class="note a-lm-t1" style="left:200px;top:236px">the sentence so far</p>' +
      '<div class="words" style="left:200px;top:282px;flex-direction:row;gap:14px">' + chip('A') + chip('triangle') + chip('has') + chip('three') + slot(1, 210, 'corners') + slot(2, 130, 'and') + '</div>' +
      '<p class="note a-lm-t2" style="left:200px;top:410px">its score for every possible next token</p>' + bars(R1, 1) + bars(R2, 2) +
      '<p class="note warm a-lm-g" style="left:200px;top:800px">greedy: always take the top score</p>' +
      '<p class="note a-lm-g" style="left:1000px;top:800px">sampling: a weighted roll of the dice</p>' +
      '<p class="cap">A language model writes text one small piece at a time. Each piece is called a token.</p>' +
      '<p class="cap">For the next token it scores every option it knows, then picks one. Here the top pick is corners.</p>' +
      '<p class="cap">Then it repeats, each time looking back at everything written so far. Token by token, a sentence grows.</p>' +
      '<p class="cap">Always taking the top score is called greedy. Picking at random, weighted by the scores, is called sampling.</p></div>'));
    this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap');
    this.chips = q('.a-lm-c'); this.s = [q('.a-lm-s1')[0], q('.a-lm-s2')[0]];
    this.r = [q('.a-lm-r1'), q('.a-lm-r2')]; this.t1 = q('.a-lm-t1')[0].style; this.t2 = q('.a-lm-t2')[0].style; this.g = q('.a-lm-g');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.2, 10.4, 15.6], t);
    this.t1.opacity = eo(seg(t, 0.5, 1.0)); this.t2.opacity = eo(seg(t, 2.8, 3.3));
    this.chips.forEach((el, i) => { const p = seg(t, 0.6 + i * 0.3, 1.1 + i * 0.3); el.style.opacity = eo(p); el.style.transform = 'translateY(' + (1 - eo(p)) * 22 + 'px)'; });
    const S = [[2.2, 6.4], [8.4, 12.2]];
    this.s.forEach((el, k) => { const p = seg(t, S[k][0], S[k][0] + 0.5), w = seg(t, S[k][1], S[k][1] + 0.5); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.85, 1, eob(p, 1.6)) + ')';
      el.children[0].style.opacity = 1 - w; const ws = el.children[1].style; ws.opacity = eo(w); ws.transform = 'translateY(' + (1 - eo(w)) * -26 + 'px)'; el.style.borderStyle = w > 0.5 ? 'solid' : 'dashed'; });
    const B = [[3.0, 5.6, 8.0], [9.0, 11.6, 99]];
    this.r.forEach((rows, k) => rows.forEach((row, i) => {
      const a = B[k][0] + i * 0.2, out = seg(t, B[k][2], B[k][2] + 0.5);
      row.style.opacity = eo(seg(t, a, a + 0.3)) * (1 - out);
      row.children[1].style.transform = 'scaleX(' + eo(seg(t, a, a + 0.6)) + ')';
      row.children[3].style.opacity = eo(seg(t, a + 0.4, a + 0.7));
      const gold = i === 0 ? eo(seg(t, B[k][1], B[k][1] + 0.4)) : 0;
      row.children[2].style.opacity = gold * eo(seg(t, a, a + 0.6)); row.children[0].style.color = gold > 0.5 ? 'var(--accent)' : 'var(--second)';
    }));
    this.g.forEach((el, i) => { const p = eo(seg(t, 15.8 + i * 0.6, 16.3 + i * 0.6)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
  },
});