const { seg, eo, eio, lerp, TextFx } = kit;
const CX = [110, 470, 700, 880, 1030, 1150, 1260], Y0 = 254, DY = 68;
const HEAD = ['method', 'triangles', 'Chamfer', 'F@1%', 'NC', 'closed', 'time'];
const ROWS = [['Poisson (ours)', '1,023,553', '0.149%', '0.999', '0.75', 'no', '39 s'], ['IER', '17,488', '0.187%', '0.998', '0.82', 'no', '29 s'], ['MeshAnything', '1,435', '0.295%', '0.987', '0.82', 'no', '77 s'], ['Point2Mesh', '10,000', '0.553%', '0.844', '0.80', 'yes', '42 min']];
kit.scene('q-compare', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Results</span><h2 class="line">Against the others</h2></div>' +
      '<div class="q-compare-hl" style="position:absolute;left:92px;top:' + (Y0 + 4 * DY - 10) + 'px;width:1300px;height:54px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="q-compare-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="q-compare-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 28 : 26) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:110px;top:' + (Y0 + 5 * DY + 26) + 'px;width:1250px;gap:10px">' +
      '<p class="eq q-compare-e" style="font-size:42px">the least accurate of the four on our scan,</p>' +
      '<p class="eq q-compare-e" style="font-size:42px;color:var(--accent)">but the only closed mesh, and no training data</p></div>' +
      '<p class="cap">The four methods so far, on the same VGGSfM scan. Point2Mesh has the largest gap and the lowest F-score.</p>' +
      '<p class="cap">But it is the only one whose mesh is closed, so it can be 3D printed as it is, and it needs no training data at all.</p>' +
      '<p class="cap">The price: about 42 minutes on our GPU, against well under two minutes for each of the other three.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.q-compare-h')[0].style; this.r = q('.q-compare-r'); this.hl = q('.q-compare-hl')[0].style; this.e = q('.q-compare-e');
    this.S = MESH.at(MESH.stage(MESH.load(kit, 'p2m-s4.json')), 1);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.4], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, 1.2 + i * 0.7, 1.7 + i * 0.7)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const hl = eo(seg(t, 4.4, 5.0)); this.hl.opacity = hl; this.hl.transform = 'scaleX(' + lerp(0.96, 1, hl) + ')';
    this.e.forEach((el, i) => { const p = eo(seg(t, i ? 7.4 : 5.4, (i ? 7.4 : 5.4) + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const m = eo(seg(t, 0.4, 1.4));
    MESH.draw(this.k.fx, this.S, { c: this.c, cx: 1640, cy: 566, s: 600, yaw: lerp(-0.5, 0.5, eio(seg(t, 0, 20))), pitch: 0.12, edge: 0.35 * m, fill: m, lw: 0.6 });
  },
});