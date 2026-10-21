const { seg, eo, lerp, TextFx } = kit;
const CX = [110, 400, 620, 790, 930, 1040, 1150, 1330], Y0 = 248, DY = 56;
const HEAD = ['method', 'triangles', 'Chamfer', 'F@1%', 'NC', 'closed', 'time', 'MVS Chamfer'];
const ROWS = [['Poisson (ours)', '1,023,553', '0.149%', '0.999', '0.75', 'no', '39 s', '0.127%'], ['IER', '17,488', '0.187%', '0.998', '0.82', 'no', '29 s', '0.120%'], ['MeshAnything', '1,435', '0.295%', '0.987', '0.82', 'no', '77 s', '0.518%'], ['Point2Mesh', '10,000', '0.553%', '0.844', '0.80', 'yes', '42 min', '3.977%'], ['DHSP', '6,000', '0.583%', '0.901', '0.89', 'yes', '> 1.5 h', '0.636%'], ['NKSR', '2,088,273', '0.156%', '0.998', '0.75', 'no', '6.6 s', '0.080%'], ['SAP', '64,168', '0.195%', '0.998', '0.81', 'yes', '7.8 min', '0.197%']];
kit.scene('s-compare', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">SAP · Results</span><h2 class="line">Against the others</h2></div>' +
      '<div class="s-compare-hl" style="position:absolute;left:92px;top:' + (Y0 + 7 * DY - 9) + 'px;width:1420px;height:48px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="s-compare-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="s-compare-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 26 : 25) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:110px;top:' + (Y0 + 8 * DY + 22) + 'px;width:1700px;gap:8px">' +
      '<p class="note s-compare-n" style="color:var(--second)">our watertight Poisson variant (Video 1): closed too, Chamfer 0.154%, F@1% 0.998</p>' +
      '<p class="eq s-compare-e" style="font-size:40px;margin-top:8px;color:var(--accent)">closed and close to the dots, without needing our arrows</p></div>' +
      '<p class="cap">SAP beside the six methods so far. It is one of the few closed meshes, and among those the closest to the dots.</p>' +
      '<p class="cap">Only our own watertight Poisson variant matches it. But Poisson needs good arrows; SAP needs none.</p>' +
      '<p class="cap">It is slower than Poisson or NKSR, minutes instead of seconds, but far faster than Point2Mesh or DHSP.</p></div>';
    kit.stage.append(kit.h(h));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.s-compare-h')[0].style; this.r = q('.s-compare-r'); this.hl = q('.s-compare-hl')[0].style; this.n = q('.s-compare-n')[0].style; this.e = q('.s-compare-e')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.6], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, 1.0 + i * 0.45, 1.5 + i * 0.45)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const hl = eo(seg(t, 4.6, 5.2)); this.hl.opacity = hl; this.hl.transform = 'scaleX(' + lerp(0.96, 1, hl) + ')';
    this.n.opacity = eo(seg(t, 7.2, 7.7)); this.e.opacity = eo(seg(t, 8.2, 8.7));
  },
});