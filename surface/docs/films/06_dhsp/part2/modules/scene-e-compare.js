const { seg, eo, eio, lerp, TextFx } = kit;
const CX = [110, 450, 670, 840, 980, 1090, 1190], Y0 = 254, DY = 64;
const HEAD = ['method', 'triangles', 'Chamfer', 'F@1%', 'NC', 'closed', 'time'];
const ROWS = [['Poisson (ours)', '1,023,553', '0.149%', '0.999', '0.75', 'no', '39 s'], ['IER', '17,488', '0.187%', '0.998', '0.82', 'no', '29 s'], ['MeshAnything', '1,435', '0.295%', '0.987', '0.82', 'no', '77 s'], ['Point2Mesh', '10,000', '0.553%', '0.844', '0.80', 'yes', '42 min'], ['DHSP', '6,000', '0.583%', '0.901', '0.89', 'yes', '> 1.5 h']];
kit.scene('e-compare', {
  async init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">DHSP · Results</span><h2 class="line">Against the others</h2></div>' +
      '<div class="e-compare-hl" style="position:absolute;left:92px;top:' + (Y0 + 5 * DY - 10) + 'px;width:1250px;height:52px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="e-compare-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="e-compare-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 27 : 26) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:110px;top:' + (Y0 + 6 * DY + 28) + 'px;width:1200px;gap:10px">' +
      '<p class="eq e-compare-e" style="font-size:42px">the smoothest surface so far, closed, with its own colour,</p>' +
      '<p class="eq e-compare-e" style="font-size:42px;color:var(--accent)">but by far the slowest</p></div>' +
      '<p class="cap">DHSP beside the four methods so far, on the VGGSfM scan. It has the smoothest surface of all: normal consistency 0.89.</p>' +
      '<p class="cap">It is closed like Point2Mesh, more accurate than it, and it brings its own colour. But it is by far the slowest.</p>' +
      '<p class="cap">Its 3D prior alone matched Poisson for accuracy; the full recipe trades a little accuracy for a clean, coloured mesh.</p></div>';
    kit.stage.append(kit.h(h));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.e-compare-h')[0].style; this.r = q('.e-compare-r'); this.hl = q('.e-compare-hl')[0].style; this.e = q('.e-compare-e');
    this.U = DH.uvmesh(MESH.load(kit, 'dh-final.json'));
    this.cols = null; try { this.cols = DH.texColors(this.U, await kit.assets.image('dh_tex.jpg')); } catch (e) { this.cols = null; }
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.6], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, 1.0 + i * 0.6, 1.5 + i * 0.6)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const hl = eo(seg(t, 4.4, 5.0)); this.hl.opacity = hl; this.hl.transform = 'scaleX(' + lerp(0.96, 1, hl) + ')';
    this.e.forEach((el, i) => { const p = eo(seg(t, i ? 8.6 : 7.2, (i ? 8.6 : 7.2) + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const a = eo(seg(t, 0.4, 1.4));
    DH.unfold(this.k.fx, this.U, { c: this.c, cx: 1640, cy: 566, s: 600, yaw: lerp(-0.5, 0.5, eio(seg(t, 0, 20))), pitch: 0.12, sq: [0, 0, 1], colors: this.cols, fill: a, edge: this.cols ? 0.1 : 0.4, lw: 0.6, stroke: this.cols ? PS.mix(this.c.g, this.c.s, 0.4) : null }, 0);
  },
});