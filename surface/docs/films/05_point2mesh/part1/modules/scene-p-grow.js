const { seg, eo, eio, lerp, TextFx } = kit;
const fmt = n => n.toLocaleString('en-US');
kit.scene('p-grow', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Our real run</span><h2 class="line">Coarse to fine</h2></div>' +
      '<div class="words p-grow-panel" style="left:1300px;top:280px;width:560px;gap:6px">' +
      '<p class="note">step</p><p class="eq num p-grow-v" style="font-size:60px">0</p>' +
      '<p class="note" style="margin-top:16px">triangles</p><p class="eq num p-grow-v" style="font-size:60px;color:var(--accent)">2,000</p></div>' +
      '<p class="note warm p-grow-r" style="left:1300px;top:600px">rebuilt by Manifold: 1.5× triangles</p>' +
      '<p class="note p-grow-r" style="left:1300px;top:636px;color:var(--second)">and a fresh network takes over</p>' +
      '<p class="note p-grow-f" style="left:1300px;top:700px;color:var(--second)">at 10,000: split into 2 parts</p>' +
      '<p class="cap">Now our real run. It starts from the 2,000-triangle hull, and the network pulls it in, step by step.</p>' +
      '<p class="cap">Within the first few hundred steps the hull already shrinks onto the body: head, arms and legs take shape.</p>' +
      '<p class="cap">Every 1,000 steps, Manifold rebuilds the skin with 1.5 times more triangles, and a fresh network takes over from there.</p>' +
      '<p class="cap">2,000, then 3,000, 4,500, 6,750 and finally 10,000 triangles: the coarse shape first, finer detail later.</p>' +
      '<p class="cap">10,000 steps and about 42 minutes later: our Point2Mesh result. Closed, smooth, 10,000 triangles.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.panel = q('.p-grow-panel')[0].style; this.v = q('.p-grow-v'); this.r = q('.p-grow-r'); this.f = q('.p-grow-f')[0].style;
    const s12 = MESH.load(kit, 'p2m-s12.json');
    this.D = MESH.dots(MESH.load(kit, 'p2m-dots.json'));
    this.ST = [
      { S: MESH.stage(MESH.load(kit, 'p2m-s0.json')), t0: 1.5, t1: 9.5, steps: [0, 100, 200, 300, 500, 900] },
      { S: MESH.stage(s12.a), t0: 10.4, t1: 13.4, steps: [1000, 1900] },
      { S: MESH.stage(s12.b), t0: 14.0, t1: 17.0, steps: [2000, 2900] },
      { S: MESH.stage(MESH.load(kit, 'p2m-s3.json')), t0: 17.6, t1: 20.6, steps: [3000, 3900] },
      { S: MESH.stage(MESH.load(kit, 'p2m-s4.json')), t0: 21.2, t1: 27.0, steps: [4000, 10000] }];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 5.0, 10.0, 17.0, 26.0], t);
    const pp = eo(seg(t, 0.8, 1.3)); this.panel.opacity = pp; this.panel.transform = 'translateX(' + (1 - pp) * 26 + 'px)';
    const ctx = this.k.fx, c = this.c, o = { c, cx: 780, cy: 566, s: 720, yaw: lerp(-0.6, 0.55, eio(seg(t, 0, 32))), pitch: 0.12, edge: 0.4, lw: 0.7 };
    let i = 0; for (let j = 0; j < this.ST.length; j++) if (t >= this.ST[j].t0 - 0.6) i = j;
    const st = this.ST[i], n = st.steps.length, kf = seg(t, st.t0, st.t1) * (n - 1), k0 = Math.min(n - 2, Math.floor(kf));
    const step = n > 1 ? lerp(st.steps[k0], st.steps[k0 + 1], kf - k0) : st.steps[0];
    this.v[0].textContent = fmt(Math.round(Math.min(10000, step) / 10) * 10); this.v[1].textContent = fmt(st.S.nf);
    const rb = i > 0 ? seg(t, st.t0 - 0.8, st.t0 - 0.4) * (1 - seg(t, st.t0 + 1.0, st.t0 + 1.4)) : 0; this.r.forEach(el => el.style.opacity = eo(rb));
    this.f.opacity = eo(seg(t, 21.6, 22.1));
    const da = 0.35 * eo(seg(t, 0.2, 1.2)); if (da > 0) MESH.pts(ctx, this.D, o, 1.1, c.s, da);
    const sw = i > 0 ? eo(seg(t, st.t0 - 0.6, st.t0)) : 1;
    if (sw < 1) { const pr = this.ST[i - 1]; MESH.draw(ctx, MESH.at(pr.S, pr.steps.length - 1), Object.assign({}, o, { fill: 0.9 * (1 - sw), edge: 0.4 })); }
    MESH.draw(ctx, MESH.at(st.S, kf), Object.assign({}, o, { fill: 0.9 * sw * eo(seg(t, 0.4, 1.4)) }));
  },
});