const { seg, eo, lerp, TextFx } = kit;
const CX = [140, 520, 720, 960, 1130, 1310, 1480, 1630], Y0 = 270, DY = 72;
const HEAD = ['cameras + dots', 'photo size', 'triangles', 'time', 'Chamfer', 'F@1%', 'NC'];
const ROWS = [['VGGSfM', '1,200 px', '646,855', '25 min', '0.287%', '0.969', '0.76'], ['VGGSfM', '1,600 px', '657,447', '47 min', '0.289%', '0.972', '0.75'], ['MVS', '1,200 px', '588,070', '30 min', '0.308%', '0.938', '0.74'], ['MVS-clean', '1,200 px', '583,765', '16 min', '0.336%', '0.928', '0.75']];
const CXX = [140, 520, 720, 960, 1130, 1310, 1480];
kit.scene('g-runs', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">2DGS · Experiments</span><h2 class="line">Our runs</h2></div>' +
      '<div class="g-runs-best" style="position:absolute;left:118px;top:' + (Y0 + 2 * DY - 10) + 'px;width:1500px;height:54px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="g-runs-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CXX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="g-runs-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CXX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 28 : 26) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:140px;top:' + (Y0 + 5 * DY + 26) + 'px;width:1680px;gap:10px">' +
      '<p class="note g-runs-n" style="color:var(--second)">all runs: 30,000 steps on one GPU, scored against each run’s own dots</p>' +
      '<p class="eq g-runs-e" style="font-size:42px;margin-top:8px">bigger photos: a little better, twice the time</p>' +
      '<p class="eq g-runs-e" style="font-size:42px;color:var(--accent)">it learns from pixels; the dots are only its starting point</p></div>' +
      '<p class="cap">We trained 2DGS four times, each for 30,000 steps on one GPU.</p>' +
      '<p class="cap">Bigger photos, 1,600 instead of 1,200 pixels across, helped a little and took twice as long: 47 minutes.</p>' +
      '<p class="cap">With the MVS cameras and cloud it scored a bit lower. Remember, it is graded against dots it never tries to match directly.</p></div>';
    kit.stage.append(kit.h(h));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.g-runs-h')[0].style; this.r = q('.g-runs-r'); this.best = q('.g-runs-best')[0].style; this.n = q('.g-runs-n')[0].style; this.e = q('.g-runs-e');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.4], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    const RT = [1.2, 7.0, 13.6, 14.2]; this.r.forEach((el, i) => { const p = eo(seg(t, RT[i], RT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const b = eo(seg(t, 8.2, 8.8)); this.best.opacity = b; this.best.transform = 'scaleX(' + lerp(0.96, 1, b) + ')';
    this.n.opacity = eo(seg(t, 2.0, 2.5)); this.e.forEach((el, i) => { const p = eo(seg(t, i ? 15.4 : 9.0, (i ? 15.4 : 9.0) + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
  },
});