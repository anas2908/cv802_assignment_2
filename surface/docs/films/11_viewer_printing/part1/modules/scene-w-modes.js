const { seg, eo, eio, lerp, TextFx } = kit;
const MT = [0, 6.2, 12.2, 18.2], RY = [300, 450, 600, 750];
const MODES = [['Textured', 'what the person looks like'], ['Shaded', 'the bare shape: every bump shows'], ['Wireframe', 'the triangles: how many, how even'], ['Input dots', 'where the surface leaves the dots']];
kit.scene('w-modes', {
  init(kit) {
    let rows = '';
    MODES.forEach(([a, b], i) => { rows += '<div class="w-modes-r" style="position:absolute;left:1100px;top:' + RY[i] + 'px;width:720px;height:110px"><div style="position:absolute;left:0;top:10px;width:26px;height:26px;border-radius:50%;box-sizing:border-box;border:3px solid var(--main)"></div><div class="w-modes-d" style="position:absolute;left:7px;top:17px;width:12px;height:12px;border-radius:50%;background:var(--accent)"></div><p class="eq" style="left:50px;top:-6px;font-size:40px">' + a + '</p><p class="note" style="left:50px;top:52px;font-size:24px">' + b + '</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The viewer · Display</span><h2 class="line">Four ways to look</h2></div>' +
      '<div class="w-modes-h" style="position:absolute;left:1080px;width:760px;height:120px;top:' + (RY[0] - 14) + 'px;box-sizing:border-box;border:3px solid var(--accent);border-radius:12px"></div>' +
      '<p class="note warm w-modes-t" style="left:1100px;top:244px;font-size:24px">display</p>' + rows +
      '<p class="note w-modes-t" style="left:1100px;top:890px;font-size:22px;color:var(--second)">our DHSP mesh: 6,000 triangles, photo colours</p>' +
      '<p class="cap">Textured is what the person looks like. But colour can hide a lot, as the photo texturing film showed.</p>' +
      '<p class="cap">Shaded drops the colours and lights the bare shape, so every bump and dent shows. This is how to judge a surface.</p>' +
      '<p class="cap">The wireframe draws the edges of every triangle: how many there are, and whether they are even or stretched.</p>' +
      '<p class="cap">And the dots overlay puts the input points back on top. Where the surface leaves the dots, it was guessed.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.r = q('.w-modes-r'); this.d = q('.w-modes-d'); this.h = q('.w-modes-h')[0].style; this.tt = q('.w-modes-t');
    this.S = VW.mesh(kit, 'vw-dh.json'); this.D = MESH.dots(MESH.load(kit, 'dh-dots.json')); this.NN = VW.dotNormals(this.S, this.D);
  },
  mode(m, o, a) {
    const ctx = this.k.fx, c = this.c, S = this.S;
    if (m === 0) MESH.draw(ctx, S, Object.assign({ colors: S.C, edge: 0, fill: a }, o));
    else if (m === 1) MESH.draw(ctx, S, Object.assign({ tint: c.s, edge: 0, fill: a }, o));
    else if (m === 2) MESH.draw(ctx, S, Object.assign({ colors: S.C, tint: c.m, edge: 0.7, lw: 0.7, fill: a }, o));
    else { MESH.draw(ctx, S, Object.assign({ tint: c.s, edge: 0, fill: a }, o)); MESH.pts(ctx, this.D, o, 1.6, c.a, VW.facing(o, this.NN, a)); }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, MT.map((x, i) => i ? x : 0.3), t);
    let m = 0; for (let i = 1; i < 4; i++) if (t >= MT[i]) m = i;
    const sw = m ? eio(seg(t, MT[m], MT[m] + 0.5)) : 1, y = m ? lerp(RY[m - 1], RY[m], sw) : RY[0];
    this.h.transform = 'translateY(' + (y - RY[0]) + 'px)'; this.h.opacity = eo(seg(t, 0.4, 0.9));
    this.r.forEach((el, i) => { const p = eo(seg(t, 0.4 + 0.2 * i, 0.9 + 0.2 * i)); el.style.opacity = p * (i === m ? 1 : 0.5); el.style.transform = 'translateX(' + (1 - p) * 22 + 'px)'; this.d[i].style.opacity = i === m ? sw : (m && i === m - 1 ? 1 - sw : 0); });
    this.tt.forEach((el, i) => el.style.opacity = eo(seg(t, 0.4 + 0.6 * i, 0.9 + 0.6 * i)));
    const o = { c: this.c, cx: 640, cy: 575, s: 650, yaw: 0.55 * Math.sin(PS.TAU * t / 13), pitch: 0.08 }, a = eo(seg(t, -0.4, 0.6));
    if (m && sw < 1) { this.mode(m - 1, o, a); this.mode(m, o, sw); } else this.mode(m, o, a);
  },
});
