const { seg, eo, lerp, TextFx } = kit;
const CX = [110, 400, 620, 790, 930, 1040, 1150, 1330], Y0 = 254, DY = 60;
const HEAD = ['method', 'triangles', 'Chamfer', 'F@1%', 'NC', 'closed', 'time', 'MVS Chamfer'];
const ROWS = [['Poisson (ours)', '1,023,553', '0.149%', '0.999', '0.75', 'no', '39 s', '0.127%'], ['IER', '17,488', '0.187%', '0.998', '0.82', 'no', '29 s', '0.120%'], ['MeshAnything', '1,435', '0.295%', '0.987', '0.82', 'no', '77 s', '0.518%'], ['Point2Mesh', '10,000', '0.553%', '0.844', '0.80', 'yes', '42 min', '3.977%'], ['DHSP', '6,000', '0.583%', '0.901', '0.89', 'yes', '> 1.5 h', '0.636%'], ['NKSR', '2,088,273', '0.156%', '0.998', '0.75', 'no', '6.6 s', '0.080%']];
kit.scene('n-compare', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">NKSR · Results</span><h2 class="line">Against the others</h2></div>' +
      '<div class="n-compare-hl" style="position:absolute;left:92px;top:' + (Y0 + 6 * DY - 9) + 'px;width:1420px;height:50px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="n-compare-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="n-compare-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 26 : 25) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:110px;top:' + (Y0 + 7 * DY + 26) + 'px;width:1700px;gap:8px">' +
      '<p class="eq n-compare-e" style="font-size:42px">as close as Poisson, the fastest, best on MVS,</p>' +
      '<p class="eq n-compare-e" style="font-size:42px;color:var(--accent)">but huge, bumpy on noisy dots, and never closed</p></div>' +
      '<p class="cap">NKSR beside the five methods so far. On VGGSfM it is as close to the dots as Poisson, and the fastest of all.</p>' +
      '<p class="cap">On the denser MVS cloud it is the best of all, with well under Poisson’s gap. But its meshes are huge, and never closed.</p>' +
      '<p class="cap">A strong, fast choice for accurate open surfaces; not one for 3D printing.</p></div>';
    kit.stage.append(kit.h(h));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.n-compare-h')[0].style; this.r = q('.n-compare-r'); this.hl = q('.n-compare-hl')[0].style; this.e = q('.n-compare-e');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.8], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, 1.0 + i * 0.5, 1.5 + i * 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const hl = eo(seg(t, 4.4, 5.0)); this.hl.opacity = hl; this.hl.transform = 'scaleX(' + lerp(0.96, 1, hl) + ')';
    this.e.forEach((el, i) => { const p = eo(seg(t, i ? 8.6 : 7.2, (i ? 8.6 : 7.2) + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
  },
});