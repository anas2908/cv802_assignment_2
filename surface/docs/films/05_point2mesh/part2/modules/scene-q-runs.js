const { seg, eo, lerp, TextFx } = kit;
const CX = [150, 560, 760, 960, 1210, 1390, 1600], Y0 = 254, DY = 68;
const HEAD = ['run', 'steps', 'max tri.', 'arrows', 'F@1%', 'Chamfer', 'time'];
const ROWS = [['first try', '6,000', '16,000', 'default', '0.602', '0.85%', '21 min'], ['paper settings', '10,000', '10,000', 'default', '0.646', '0.82%', '44 min'], ['paper + unoriented', '10,000', '10,000', 'unoriented', '0.844', '0.55%', '42 min'], ['bigger and longer', '15,000', '20,000', 'unoriented', '0.655', '0.80%', '3 h 22 min']];
const RT = [1.4, 2.4, 7.0, 8.0];
kit.scene('q-runs', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Experiments</span><h2 class="line">Our four runs</h2></div>' +
      '<div class="q-runs-best" style="position:absolute;left:126px;top:' + (Y0 + 3 * DY - 10) + 'px;width:1700px;height:54px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="q-runs-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="q-runs-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 28 : 26) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:150px;top:' + (Y0 + 5 * DY + 20) + 'px;width:1650px;gap:12px">' +
      '<p class="eq q-runs-e" style="font-size:44px">the arrows’ direction mattered most: 0.646 → 0.844</p>' +
      '<p class="eq q-runs-e" style="font-size:44px">more triangles and more steps: no better, five times slower</p></div>' +
      '<p class="cap">We ran Point2Mesh four times on our VGGSfM scan. Each run took from 20 minutes to over 3 hours on our GPU.</p>' +
      '<p class="cap">Our first try and the paper settings both used the default arrow term, and both stayed around 0.6.</p>' +
      '<p class="cap">Switching to unoriented arrows made by far the biggest difference: F-score 0.844, our best run.</p>' +
      '<p class="cap">Twice the triangles and 50% more steps did not help: 0.655, and five times slower.</p></div>';
    kit.stage.append(kit.h(h));
    this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.q-runs-h')[0].style; this.r = q('.q-runs-r'); this.best = q('.q-runs-best')[0].style; this.e = q('.q-runs-e');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 12.0, 17.6], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, RT[i], RT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const b = eo(seg(t, 12.2, 12.8)); this.best.opacity = b; this.best.transform = 'scaleX(' + lerp(0.96, 1, b) + ')';
    this.e.forEach((el, i) => { const p = eo(seg(t, i ? 18.0 : 13.0, (i ? 18.0 : 13.0) + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
  },
});