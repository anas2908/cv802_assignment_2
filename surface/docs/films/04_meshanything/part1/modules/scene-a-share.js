const { seg, eo, eio, eob, lerp, TextFx } = kit;
const V = [[280, 470], [380, 300], [480, 470], [580, 300], [680, 470], [780, 300], [880, 470], [980, 300], [1080, 470], [1240, 470], [1340, 300], [1440, 470]];
const T = [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6], [5, 6, 7], [6, 7, 8], [9, 10, 11]];
const TA = k => k < 7 ? 1.4 + k * 0.6 : 14.0;
const TB = k => k === 0 ? 7.6 : k < 7 ? 8.8 + (k - 1) * 0.7 : 15.2;
kit.scene('a-share', {
  init(kit) {
    const chip = (s, cls) => '<p class="box num ' + cls + '" style="font-size:26px;padding:6px 0;width:54px;text-align:center">' + s + '</p>';
    let a = '', b = '';
    T.forEach(f => f.forEach(i => a += chip(i + 1, 'a-share-a')));
    [0, 1, 2].forEach(i => b += chip(i + 1, 'a-share-b')); for (let i = 3; i < 9; i++) b += chip(i + 1, 'a-share-b');
    b += chip('&', 'hot a-share-b'); [9, 10, 11].forEach(i => b += chip(i + 1, 'a-share-b'));
    let h = '<div class="ground"><div class="words head"><span class="tag">MeshAnything V2 · Its key trick</span><h2 class="line">Share the edge</h2></div>' +
      '<p class="note a-share-l" style="left:200px;top:566px">plain: every triangle in full (each chip is one corner = 3 numbers)</p>' +
      '<div class="words" style="left:200px;top:610px;flex-direction:row;gap:7px">' + a + '</div>' +
      '<p class="note warm a-share-l" style="left:200px;top:690px">V2: reuse the last edge, add only the new corner</p>' +
      '<div class="words" style="left:200px;top:734px;flex-direction:row;gap:7px">' + b + '</div>' +
      '<p class="eq num a-share-c" style="left:1560px;top:556px;font-size:40px">72 tokens</p>' +
      '<p class="eq num a-share-c" style="left:1560px;top:680px;font-size:40px;color:var(--accent)">37 tokens</p>' +
      '<div class="words" style="left:200px;top:816px;gap:6px"><p class="eq a-share-e" style="font-size:46px">about half the tokens, same mesh</p>' +
      '<p class="note warm a-share-e">our mesh: 1,435 triangles · 12,915 numbers plain · about 6,100 with sharing</p></div>';
    V.forEach((p, i) => { h += '<p class="note warm a-share-n" style="left:' + (p[0] - (i > 8 ? 16 : 8)) + 'px;top:' + (p[1] < 400 ? p[1] - 62 : p[1] + 20) + 'px;font-size:30px">' + (i + 1) + '</p>'; });
    h += '<p class="cap">The plain way writes every triangle in full: three corners, nine numbers, even when its neighbour already wrote two of them.</p>' +
      '<p class="cap">Neighbours share an edge. So V2 writes the first triangle in full, then only the one new corner of each next triangle.</p>' +
      '<p class="cap">When no neighbour is left, it writes the new-strip mark &amp; and starts the next triangle in full.</p>' +
      '<p class="cap">About half the tokens for the same mesh. Shorter sentences let V2 write bigger meshes: about 1,600 triangles, double V1.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.l = q('.a-share-l'); this.A = q('.a-share-a'); this.B = q('.a-share-b'); this.cn = q('.a-share-c'); this.e = q('.a-share-e'); this.n = q('.a-share-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.6, 17.8], t);
    this.l[0].style.opacity = eo(seg(t, 1.0, 1.5)); this.l[1].style.opacity = eo(seg(t, 7.1, 7.6));
    const pop = (el, a, hot) => { const p = seg(t, a, a + 0.35); el.style.opacity = eo(p); el.style.transform = 'translateY(' + (1 - eo(p)) * 14 + 'px)'; el.style.borderColor = hot ? 'var(--accent)' : ''; };
    this.A.forEach((el, i) => { const k = Math.floor(i / 3); pop(el, TA(k) + (i % 3) * 0.13, false); });
    const bt = [TB(0), TB(0) + 0.15, TB(0) + 0.3]; for (let k = 1; k < 7; k++) bt.push(TB(k)); bt.push(14.8, 15.2, 15.35, 15.5);
    this.B.forEach((el, i) => pop(el, bt[i], i === 9));
    this.cn.forEach((el, i) => el.style.opacity = eo(seg(t, 16.4 + i * 0.5, 16.9 + i * 0.5)));
    this.e.forEach((el, i) => { const p = eo(seg(t, 18.4 + i * 0.9, 18.9 + i * 0.9)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    this.n.forEach((el, i) => el.style.opacity = eo(seg(t, i > 8 ? 13.7 : -0.6, i > 8 ? 14.2 : -0.1)));
    const ctx = this.k.fx, c = this.c;
    let cur = -1; for (let k = 0; k < 8; k++) if (t >= TA(k) && t < TA(k) + 0.6) cur = k;
    let curB = -1; for (let k = 0; k < 8; k++) { const s0 = TB(k), s1 = k === 7 ? 16.2 : k === 0 ? 8.8 : TB(k) + 0.7; if (t >= s0 && t < s1) curB = k; }
    T.forEach((f, k) => {
      const p = k < 7 ? 1 : eo(seg(t, 13.6, 14.1)); if (p <= 0) return;
      const hot = cur === k || curB === k;
      ctx.globalAlpha = p; PS.tri(ctx, V[f[0]], V[f[1]], V[f[2]], hot ? PS.mix(c.g, c.a, 0.42) : PS.mix(c.g, c.m, 0.22), hot ? c.a : c.m, 3); ctx.globalAlpha = 1;
    });
    if (curB >= 1 && curB < 7) { const e0 = V[curB], e1 = V[curB + 1], nw = V[curB + 2]; ctx.strokeStyle = c.s; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(e0[0], e0[1]); ctx.lineTo(e1[0], e1[1]); ctx.stroke(); PS.dot(ctx, nw[0], nw[1], 16 + 3 * Math.sin(t * 8), c.a); }
    V.forEach((p, i) => { const a = i > 8 ? eo(seg(t, 13.6, 14.1)) : 1; if (a > 0) { ctx.globalAlpha = a; PS.dot(ctx, p[0], p[1], 10, c.s); ctx.globalAlpha = 1; } });
  },
});