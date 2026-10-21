const { seg, eo, eio, lerp, TextFx } = kit;
function quad(P0, C, P1, n) { const o = []; for (let i = 1; i <= n; i++) { const s = i / n; o.push([(1 - s) * (1 - s) * P0[0] + 2 * (1 - s) * s * C[0] + s * s * P1[0], (1 - s) * (1 - s) * P0[1] + 2 * (1 - s) * s * C[1] + s * s * P1[1]]); } return o; }
function at(P, d) { let s = 0; for (let i = 1; i < P.length; i++) { const L = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (s + L >= d) { const f = (d - s) / L; return [lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f), i]; } s += L; } const e = P[P.length - 1]; return [e[0], e[1], P.length]; }
kit.scene('i-geo', {
  init(kit) {
    const C = IW.CH, A = IW.ARM;
    this.p1 = []; for (let x = C[3][0]; x <= C[5][0]; x += 4) this.p1.push([x, IW.chestY(x)]);
    const arm = []; for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 - i / 40 * Math.PI; arm.push([IW.AC[0] + IW.AR * Math.cos(a), IW.AC[1] + IW.AR * Math.sin(a)]); }
    const top = arm[arm.length - 1], S = [1500, 300], E = [1720, IW.chestY(1720)];
    const back = []; for (let x = 1716; x >= C[10][0]; x -= 4) back.push([x, IW.chestY(x)]);
    this.p2 = arm.concat(quad(top, [1250, 290], S, 30), quad(S, [1710, 380], E, 30), back);
    this.r1 = Math.hypot(C[5][0] - C[3][0], C[5][1] - C[3][1]); this.w1 = IW.len(this.p1);
    this.r2 = Math.hypot(C[10][0] - A[0][0], C[10][1] - A[0][1]); this.w2 = IW.len(this.p2);
    const fmt = v => Math.round(v).toLocaleString('en-US');
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">IER · Part 1</span><h2 class="line">Two kinds of distance</h2></div>' +
      '<div class="words i-geo-g1" style="left:110px;top:300px;gap:10px">' +
      '<p class="note i-geo-a1" style="position:static;color:var(--accent)">ruler (straight): ' + fmt(this.r1) + '</p>' +
      '<p class="note i-geo-a2" style="position:static">ant (walking): ' + fmt(this.w1) + '</p>' +
      '<p class="note i-geo-a3" style="position:static;color:var(--second)">walking ÷ straight ≈ ' + (this.w1 / this.r1).toFixed(2) + '</p></div>' +
      '<div class="words i-geo-g2" style="left:110px;top:300px;gap:10px">' +
      '<p class="note i-geo-b1" style="position:static;color:var(--accent)">ruler (straight): ' + fmt(this.r2) + '</p>' +
      '<p class="note i-geo-b2" style="position:static">ant (walking): ' + fmt(this.w2) + '</p>' +
      '<p class="note i-geo-b3" style="position:static;color:var(--second)">walking ÷ straight ≈ ' + Math.round(this.w2 / this.r2) + '</p></div>' +
      '<p class="note i-geo-sh" style="left:1530px;top:246px;color:var(--second)">to the shoulder</p>' +
      '<p class="cap">There are two ways to measure how far apart two dots are.</p>' +
      '<p class="cap">Straight through the air, like a ruler (extrinsic), or walking along the surface, like an ant (intrinsic).</p>' +
      '<p class="cap">Two dots on the chest: the ant’s walk is barely longer than the ruler. The ratio is about 1.</p>' +
      '<p class="cap">Arm to chest: the ruler is short, but the ant must go up the arm, over the shoulder and back down. A huge ratio.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.i-geo-' + k).style;
    Object.assign(this, { g1: q('g1'), g2: q('g2'), a1: q('a1'), a2: q('a2'), a3: q('a3'), b1: q('b1'), b2: q('b2'), b3: q('b3'), sh: q('sh') });
  },
  walk(ctx, P, p, total) {
    if (p <= 0) return; const e = at(P, total * p);
    ctx.strokeStyle = this.c.m; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < e[2]; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
    PS.dot(ctx, e[0], e[1], 12, this.c.a);
  },
  ruler(ctx, a, b, p) { if (p <= 0) return; ctx.setLineDash([10, 8]); ctx.strokeStyle = this.c.a; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], p), lerp(a[1], b[1], p)); ctx.stroke(); ctx.setLineDash([]); },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 3.4, 9.2, 15.0], t);
    const ctx = this.k.fx, c = this.c, C = IW.CH, A = IW.ARM;
    IW.links(ctx, c, 1, 0.45);
    IW.dots(ctx, c, 1);
    const P1 = 1 - seg(t, 8.8, 9.3);
    if (P1 > 0) { ctx.globalAlpha = P1; this.ruler(ctx, [C[3][0], C[3][1] - 40], [C[5][0], C[5][1] - 40], eio(seg(t, 3.6, 4.4))); this.walk(ctx, this.p1, eio(seg(t, 4.6, 7.0)), this.w1); ctx.globalAlpha = 1; }
    if (t > 9.2) { this.ruler(ctx, A[0], C[10], eio(seg(t, 9.6, 10.2))); this.walk(ctx, this.p2, eio(seg(t, 10.6, 16.0)), this.w2); }
    this.g1.opacity = 1 - seg(t, 8.8, 9.3); this.g2.opacity = eo(seg(t, 9.4, 9.8));
    this.a1.opacity = eo(seg(t, 4.4, 4.9)); this.a2.opacity = eo(seg(t, 7.0, 7.5)); this.a3.opacity = eo(seg(t, 7.8, 8.3));
    this.b1.opacity = eo(seg(t, 10.2, 10.7)); this.b2.opacity = eo(seg(t, 16.0, 16.5)); this.b3.opacity = eo(seg(t, 16.8, 17.3));
    this.sh.opacity = eo(seg(t, 12.2, 12.7));
  },
});