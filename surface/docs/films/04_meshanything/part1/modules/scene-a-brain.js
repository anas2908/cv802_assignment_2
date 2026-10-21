const { seg, eo, eio, eob, lerp, TextFx } = kit;
const X0 = 360, RY = 782, TOK = ['40', '88', '64', '72', '104', '56', '64', '56', '80'];
const XS = []; for (let i = 0; i < 6; i++) XS.push([X0 + i * 34, 26]); XS.push([X0 + 204, 40]); TOK.forEach((s, i) => XS.push([X0 + 252 + i * 78, 70]));
const TT0 = 11.2, TDT = 0.6;
kit.scene('a-brain', {
  init(kit) {
    let row = ''; for (let i = 0; i < 6; i++) row += '<p class="box ' + (i ? '' : 'hot ') + 'a-brain-p" style="width:26px;height:46px;padding:0"></p>';
    row += '<p class="note a-brain-p" style="width:40px;text-align:center;font-size:30px;color:var(--second)">…</p>';
    TOK.forEach(s => row += '<p class="box num a-brain-t" style="width:70px;height:46px;padding:0;display:flex;align-items:center;justify-content:center;font-size:26px">' + s + '</p>');
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">MeshAnything · The model</span><h2 class="line">Where the shape comes in</h2></div>' +
      '<p class="note a-brain-d" style="left:200px;top:664px">8,192 dots + their arrows</p>' +
      '<p class="box a-brain-enc" style="left:570px;top:390px;width:290px;text-align:center">shape encoder (pretrained)</p>' +
      '<div class="words a-brain-lab" style="left:1290px;top:330px;width:560px;gap:12px"><p class="eq">257 shape tokens</p><p class="note">1 summary + 256 details</p><p class="note warm">written first, like a prompt</p></div>' +
      '<p class="box hot a-brain-tr" style="left:110px;top:779px;width:220px;height:52px;padding:0;display:flex;align-items:center;justify-content:center">transformer</p>' +
      '<div class="words" style="left:' + X0 + 'px;top:' + RY + 'px;flex-direction:row;gap:8px">' + row + '</div>' +
      '<p class="note a-brain-n" style="left:360px;top:852px">each new token looks back at the prompt and at everything already written</p>' +
      '<p class="cap">How does the model know what to write? It starts from 8,192 dots with arrows, spread over the shape surface.</p>' +
      '<p class="cap">A pretrained shape encoder squeezes those dots into 257 shape tokens: a short description of the whole shape.</p>' +
      '<p class="cap">These tokens go first, like a prompt. Then a transformer writes mesh tokens after them, one at a time.</p>' +
      '<p class="cap">Each new token looks back at the shape tokens and everything written so far. The transformer has 350 million learned numbers.</p>' +
      '<p class="cap">It was trained so that, given a shape, the right next token gets the top score. Part 2 shows that training.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap');
    this.d = q('.a-brain-d')[0].style; this.enc = q('.a-brain-enc')[0].style; this.lab = q('.a-brain-lab')[0].style; this.tr = q('.a-brain-tr')[0].style; this.n = q('.a-brain-n')[0].style;
    this.p = q('.a-brain-p'); this.t = q('.a-brain-t');
    this.Q = MA.surf('v2', 8192, 11);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.6, 10.6, 15.6, 20.0], t);
    const f = (st, a, dx) => { const p = eo(seg(t, a, a + 0.5)); st.opacity = p; st.transform = 'translateX(' + (1 - p) * (dx || 24) + 'px)'; };
    f(this.d, 1.6); f(this.enc, 3.0); f(this.lab, 6.6); f(this.tr, 9.0); f(this.n, 16.4);
    this.p.forEach((el, i) => { const p = seg(t, 9.4 + i * 0.12, 9.8 + i * 0.12); el.style.opacity = eo(p); el.style.transform = 'translateY(' + (1 - eo(p)) * -30 + 'px)'; });
    this.t.forEach((el, i) => { const p = seg(t, TT0 + i * TDT, TT0 + i * TDT + 0.3); el.style.opacity = eo(p); el.style.transform = 'scale(' + lerp(0.7, 1, eob(p, 1.7)) + ')'; });
    const ctx = this.k.fx, c = this.c;
    const da = eo(seg(t, 0.4, 2.0)), yaw = lerp(-0.4, 0.4, eio(seg(t, 0, 24)));
    if (da > 0) MA.pts(ctx, this.Q, { cx: 330, cy: 432, s: 420, yaw, pitch: 0.1 }, 1.3, c.s, i => da * 1.6 - (i % 97) / 97 * 0.6, 0.035, 24, c.m);
    const a1 = eo(seg(t, 2.4, 2.9)); if (a1 > 0) { ctx.globalAlpha = a1; PS.arrow(ctx, 500, 436, 556, 436, c.a, 3, 12); ctx.globalAlpha = 1; }
    const a2 = eo(seg(t, 3.6, 4.1)); if (a2 > 0) { ctx.globalAlpha = a2; PS.arrow(ctx, 872, 436, 928, 436, c.a, 3, 12); ctx.globalAlpha = 1; }
    for (let i = -1; i < 256; i++) {
      const p = eo(seg(t, 4.0 + (i + 1) / 257 * 1.8, 4.3 + (i + 1) / 257 * 1.8)); if (p <= 0) continue;
      const x = i < 0 ? 940 : 966 + (i % 16) * 17, y = i < 0 ? 296 : 296 + Math.floor(i / 16) * 17;
      const shade = i < 0 ? 1 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(i * 1.7 + 0.6 * Math.cos(i * 0.31)));
      ctx.globalAlpha = p; ctx.fillStyle = i < 0 ? c.a : PS.mix(c.g, c.m, shade); ctx.fillRect(x, y, 16, 16);
    }
    ctx.globalAlpha = 1;
    const j = Math.floor((t - TT0) / TDT);
    if (j >= 0 && j < 9) {
      const age = (t - TT0) - j * TDT, al = eo(seg(age, 0.1, 0.35)) * (1 - seg(age, 0.45, 0.6) * 0.6);
      const me = XS[7 + j], mx = me[0] + me[1] / 2;
      ctx.strokeStyle = c.a; ctx.lineWidth = 2;
      for (let i = 0; i < 7 + j; i++) { if (i === 6) continue; const o = XS[i], ox = o[0] + o[1] / 2, h = Math.min(74, 18 + (mx - ox) * 0.12); ctx.globalAlpha = al * (i < 6 ? 0.95 : 0.6); ctx.beginPath(); ctx.moveTo(mx, RY - 4); ctx.quadraticCurveTo((mx + ox) / 2, RY - 4 - h * 2, ox, RY - 4); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  },
});