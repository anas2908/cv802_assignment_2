const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('i-classes', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 1</span><h2 class="line">Three kinds of candidates</h2></div>' +
      '<p class="eq i-classes-h1" style="left:180px;top:262px;font-size:46px;color:var(--main)">good</p>' +
      '<p class="eq i-classes-h2" style="left:740px;top:262px;font-size:46px">okay</p>' +
      '<p class="eq i-classes-h3" style="left:1280px;top:262px;font-size:46px;color:var(--accent)">bad</p>' +
      '<p class="note i-classes-n1" style="left:180px;top:640px;font-size:23px">ratio ≤ 1.3, on the surface</p>' +
      '<p class="note i-classes-n2" style="left:740px;top:640px;font-size:23px;color:var(--second)">ratio ≤ 1.3, cuts off the surface</p>' +
      '<p class="note warm i-classes-n3" style="left:1280px;top:640px;font-size:23px">ratio > 1.3, crosses a gap</p>' +
      '<p class="cap">To train IER, every candidate on thousands of shapes with a known true surface got one of three labels.</p>' +
      '<p class="cap">Good: ratio up to 1.3, and the triangle lies right on the surface.</p>' +
      '<p class="cap">Okay: ratio up to 1.3, but the triangle cuts a little off the surface, for example across a sharp bend.</p>' +
      '<p class="cap">Bad: ratio above 1.3. The triangle jumps across empty space. Bad candidates are never used.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.i-classes-' + k).style;
    this.h = [1, 2, 3].map(i => q('h' + i)); this.n = [1, 2, 3].map(i => q('n' + i));
    this.s1 = []; for (let x = 200; x <= 620; x += 4) this.s1.push([x, 470 + 22 * Math.sin((x - 180) / 90)]);
    this.d1 = []; for (let x = 200; x <= 620; x += 52) this.d1.push([x, 470 + 22 * Math.sin((x - 180) / 90)]);
    const V = x => x < 950 ? 400 + (x - 740) * (160 / 210) : 560 - (x - 950) * (160 / 210);
    this.s2 = []; for (let x = 740; x <= 1160; x += 4) this.s2.push([x, V(x)]);
    this.d2 = []; for (let x = 740; x <= 1160; x += 42) this.d2.push([x, V(x)]);
    this.c2 = [[908, V(908)], [992, V(992)]];
    this.s3a = []; for (let a = 0.15; a <= Math.PI - 0.15; a += 0.04) this.s3a.push([1490 - 95 * Math.cos(a), 400 + 95 * Math.sin(a)]);
    this.d3a = []; for (let a = 0.25; a <= Math.PI - 0.2; a += 0.42) this.d3a.push([1490 - 95 * Math.cos(a), 400 + 95 * Math.sin(a)]);
    this.d3b = []; for (let x = 1290; x <= 1700; x += 52) this.d3b.push([x, 565]);
  },
  panel(ctx, S, D, p, cand, col) {
    const c = this.c; if (p <= 0) return;
    ctx.globalAlpha = 1; ctx.strokeStyle = PS.mix(c.g, c.s, 0.35); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    S.forEach(s => PS.poly(ctx, s, eio(p)));
    D.forEach((d, i) => PS.dot(ctx, d[0], d[1], 9 * eo(Math.min(1, Math.max(0, p * 2 - i * 0.05))), c.s));
  },
  cand(ctx, a, b, p, col) { if (p <= 0) return; ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], p), lerp(a[1], b[1], p)); ctx.stroke(); PS.dot(ctx, a[0], a[1], 11, col); if (p > 0.95) PS.dot(ctx, b[0], b[1], 11, col); },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 3.0, 8.0, 13.0], t);
    const ctx = this.k.fx, c = this.c;
    this.panel(ctx, [this.s1], this.d1, seg(t, 3.2, 4.6));
    this.cand(ctx, this.d1[3], this.d1[4], eio(seg(t, 4.8, 5.6)), c.m);
    this.panel(ctx, [this.s2], this.d2, seg(t, 8.2, 9.6));
    this.cand(ctx, this.c2[0], this.c2[1], eio(seg(t, 9.8, 10.6)), c.s);
    this.panel(ctx, [this.s3a, [[1280, 565], [1710, 565]]], this.d3a.concat(this.d3b), seg(t, 13.2, 14.6));
    this.cand(ctx, this.d3a[3] || this.d3a[this.d3a.length - 1], [1498, 565], eio(seg(t, 14.8, 15.6)), c.a);
    const at = [3.2, 8.2, 13.2], nt = [6.0, 11.0, 16.0];
    this.h.forEach((s, i) => s.opacity = eo(seg(t, at[i], at[i] + 0.5)));
    this.n.forEach((s, i) => s.opacity = eo(seg(t, nt[i], nt[i] + 0.5)));
  },
});