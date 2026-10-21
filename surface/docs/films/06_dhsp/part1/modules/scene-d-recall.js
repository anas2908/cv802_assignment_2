const { seg, eo, eio, lerp, TextFx } = kit;
const ST = [['dh-ep1.json', 2.4, 'start: the convex hull'], ['dh-ep2.json', 7.0, 'after round 1'], ['dh-ep3.json', 10.0, 'after round 2'], ['dh-prior.json', 13.0, 'after round 4']];
kit.scene('d-recall', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">DHSP · Stage 1</span><h2 class="line">A 3D self-prior first</h2></div>' +
      '<div class="words d-recall-panel" style="left:1300px;top:270px;width:580px;gap:6px">' +
      '<p class="note">triangles</p><p class="eq num d-recall-v" style="font-size:60px;color:var(--accent)">2,000</p>' +
      '<p class="note d-recall-v" style="color:var(--second)">start: the convex hull</p>' +
      '<p class="note" style="margin-top:26px">loss: gap + 0.2 × edge length</p>' +
      '<p class="note">4 rounds, 2,000 → 3,456 steps each</p>' +
      '<p class="note">at 16,000: worked on in 4 parts</p></div>' +
      '<p class="note d-recall-d" style="left:200px;top:236px;color:var(--second)">our dots in their own colours</p>' +
      '<p class="cap">DHSP takes our dots together with their colours. Its first stage is a 3D self-prior, much like Point2Mesh.</p>' +
      '<p class="cap">From the convex hull, a mesh network pulls the skin onto the dots. The loss is the gap plus 0.2 times the edge lengths, which keeps triangles small and even.</p>' +
      '<p class="cap">Four rounds, each ending with twice as many triangles: from 2,000 up to 16,000.</p>' +
      '<p class="cap">From afar the result looks good. Up close it hides a problem, and Part 2 is about it.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.panel = q('.d-recall-panel')[0].style; this.v = q('.d-recall-v'); this.d = q('.d-recall-d')[0].style;
    this.D = DH.cdots(MESH.load(kit, 'dh-dots.json'));
    this.S = ST.map(s => MESH.at(MESH.stage(MESH.load(kit, s[0])), 0));
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.0, 12.0, 17.4], t);
    const pp = eo(seg(t, 2.0, 2.5)); this.panel.opacity = pp; this.panel.transform = 'translateX(' + (1 - pp) * 26 + 'px)'; this.d.opacity = eo(seg(t, 0.6, 1.1)) * (1 - eo(seg(t, 2.4, 2.9)));
    let i = 0; for (let j = 0; j < ST.length; j++) if (t >= ST[j][1] - 0.6) i = j;
    this.v[0].textContent = this.S[i].nf.toLocaleString('en-US'); this.v[1].textContent = ST[i][2];
    const ctx = this.k.fx, c = this.c, o = { c, cx: 760, cy: 566, s: 720, yaw: lerp(-0.6, 0.6, eio(seg(t, 0, 22))), pitch: 0.12, edge: 0.4, lw: 0.6 };
    const da = eo(seg(t, 0.3, 1.3)) * (1 - 0.6 * eo(seg(t, 2.4, 4.0)));
    if (da > 0) this.dotsCol(ctx, o, da);
    const sw = i > 0 ? eo(seg(t, ST[i][1] - 0.6, ST[i][1])) : 1;
    const f0 = eo(seg(t, 2.4, 3.6));
    if (i > 0 && sw < 1) MESH.draw(ctx, this.S[i - 1], Object.assign({}, o, { fill: 0.92 * (1 - sw) }));
    if (f0 > 0) MESH.draw(ctx, this.S[i], Object.assign({}, o, { fill: 0.92 * sw * f0, tint: i === 0 ? c.a : c.m, edge: i === 0 ? 0.8 : 0.4 }));
  },
  dotsCol(ctx, o, a) {
    const th = o.yaw, ph = o.pitch, ct = Math.cos(th), st = Math.sin(th), fx = -0.669, fz = 0.744, R0 = fz * ct + fx * st, R1 = -fx * ct + fz * st, F0 = fx * ct - fz * st, F1 = fz * ct + fx * st, cp = Math.cos(ph), sp = Math.sin(ph), D = this.D;
    for (let i = 0; i < D.n; i++) { const x = D.P[3 * i], y = D.P[3 * i + 1], z = D.P[3 * i + 2], sx = x * R0 + z * R1, d = x * F0 + z * F1; ctx.globalAlpha = a; ctx.fillStyle = D.C[i]; ctx.fillRect(o.cx + sx * o.s - 2, o.cy - (y * cp - d * sp) * o.s - 2, 4, 4); }
    ctx.globalAlpha = 1;
  },
});