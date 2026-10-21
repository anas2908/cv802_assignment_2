const { seg, eo, lerp, TextFx } = kit;
const CX = [140, 520, 690, 860, 1140, 1320, 1500, 1660], Y0 = 270, DY = 74;
const HEAD = ['run', 'detail', 'passes', 'triangles', 'time', 'Chamfer', 'F@1%', 'NC'];
const ROWS = [['full detail, 2 passes', '1.0', '2', '8,403,162', '24.5 s', '0.157%', '0.997', '0.75'], ['full detail, 1 pass', '1.0', '1', '2,088,273', '6.6 s', '0.156%', '0.998', '0.75'], ['half detail, 1 pass', '0.5', '1', '112,286', '1.4 s', '0.206%', '0.993', '0.84']];
const RT = [1.2, 2.0, 2.8];
kit.scene('n-runs', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">NKSR · Our scan</span><h2 class="line">Our runs</h2></div>' +
      '<div class="n-runs-best" style="position:absolute;left:118px;top:' + (Y0 + 2 * DY - 10) + 'px;width:1680px;height:54px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="n-runs-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="n-runs-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 28 : 26) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:140px;top:' + (Y0 + 4 * DY + 30) + 'px;width:1680px;gap:12px">' +
      '<p class="note n-runs-n">passes: extra rounds that refine the triangles where the surface is</p>' +
      '<p class="eq n-runs-e" style="font-size:42px;margin-top:10px">a second pass: 4× the triangles, no gain</p>' +
      '<p class="eq n-runs-e" style="font-size:42px;color:var(--accent)">half detail: 18× fewer triangles, smoother, slightly less close</p></div>' +
      '<p class="cap">We ran NKSR three ways on our VGGSfM scan. Every run took seconds, not minutes.</p>' +
      '<p class="cap">An extra refinement pass when making triangles quadrupled the mesh, to 8.4 million, with no gain in accuracy.</p>' +
      '<p class="cap">Half detail gives 18 times fewer triangles and a smoother surface, for a slightly larger gap. We kept full detail, one pass.</p></div>';
    kit.stage.append(kit.h(h));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.n-runs-h')[0].style; this.r = q('.n-runs-r'); this.best = q('.n-runs-best')[0].style; this.n = q('.n-runs-n')[0].style; this.e = q('.n-runs-e');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.0], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, RT[i], RT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    this.n.opacity = eo(seg(t, 4.0, 4.5));
    this.e.forEach((el, i) => { const p = eo(seg(t, i ? 13.4 : 7.2, (i ? 13.4 : 7.2) + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const b = eo(seg(t, 18.6, 19.2)); this.best.opacity = b; this.best.transform = 'scaleX(' + lerp(0.96, 1, b) + ')';
  },
});