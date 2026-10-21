const { seg, eo, eio, lerp, TextFx } = kit;
const ROWS = [['Poisson, trimmed (our best)', 0, '10,079 hole edges where trimming cut'], ['Poisson, watertight setting', 1, '4 pieces: keep the largest, then closed'], ['IER', 0, '11,018 hole edges'],
  ['Point2Mesh', 1, '10,000 triangles · 97 cm³'], ['MeshAnything', 0, '65 hole edges · 10 fins'], ['DHSP', 1, '6,000 triangles · 126 cm³'], ['NKSR', 0, '8,994 separate pieces'],
  ['SAP', 1, '64,168 triangles · 101 cm³'], ['2DGS', 0, 'about 30,000 hole edges']];
const Y0 = 300, RH = 62;
kit.scene('x-table', {
  init(kit) {
    let html = '<p class="note x-tb-hd" style="left:150px;top:250px;font-size:22px;color:var(--accent)">best mesh of each method</p><p class="note x-tb-hd" style="left:880px;top:250px;font-size:22px;color:var(--accent)">closed?</p><p class="note x-tb-hd" style="left:1040px;top:250px;font-size:22px;color:var(--accent)">what the check found</p>';
    ROWS.forEach(([m, ok, d], i) => {
      const y = Y0 + i * RH;
      html += '<div class="x-tb-b" style="position:absolute;left:120px;top:' + (y - 6) + 'px;width:1700px;height:' + (RH - 8) + 'px;border-radius:8px;background:color-mix(in srgb, var(--ground) 80%, ' + (ok ? 'var(--main)' : 'var(--accent)') + ')"></div>';
      html += '<div class="x-tb-r" style="position:absolute;left:0;top:' + y + 'px;width:1920px;height:' + RH + 'px"><p class="eq" style="left:150px;top:-2px;font-size:32px">' + m + '</p><p class="note" style="left:900px;top:4px;font-size:30px;color:' + (ok ? 'var(--main)' : 'var(--accent)') + '">' + (ok ? '✓' : '✗') + '</p><p class="note" style="left:1040px;top:8px;font-size:24px;color:var(--second)">' + d + '</p></div>';
    });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">3D printing · Results</span><h2 class="line">Which of ours can print</h2></div>' + html +
      '<p class="cap">We ran the checks on the best mesh of every method. Four pass: Poisson in its watertight setting, Point2Mesh, DHSP and SAP.</p>' +
      '<p class="cap">Our best Poisson mesh fails only because trimming cut away its thin, poorly supported parts. Skipping the trim closes it.</p>' +
      '<p class="cap">IER, MeshAnything, NKSR and 2DGS fail: holes, fins, or thousands of loose pieces. A slicer’s repair tool can try to patch them, but not reliably.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.hd = q('.x-tb-hd'); this.b = q('.x-tb-b'); this.r = q('.x-tb-r');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 8.0, 15.6], t);
    this.hd.forEach(el => el.style.opacity = eo(seg(t, 0.4, 0.9)));
    this.r.forEach((el, i) => { const p = eo(seg(t, 0.8 + 0.3 * i, 1.3 + 0.3 * i)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    ROWS.forEach(([, ok], i) => { const on = ok ? eo(seg(t, 4.6 + 0.2 * i, 5.1 + 0.2 * i)) : eo(seg(t, 15.8 + 0.2 * i, 16.3 + 0.2 * i)), pz = (i < 2) ? eo(seg(t, 8.2, 8.7)) : 0; this.b[i].style.opacity = Math.max(on, pz); });
  },
});
