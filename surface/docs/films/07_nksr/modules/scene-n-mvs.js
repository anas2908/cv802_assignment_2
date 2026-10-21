const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 0.7;
kit.scene('n-mvs', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">NKSR · MVS cloud</span><h2 class="line">Best scores, holes too</h2></div>' +
      '<div class="n-mvs-w" style="position:absolute;left:420px;top:226px;width:' + Math.round(360 * SC) + 'px;height:' + Math.round(950 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('nk_mvs.png') + '" style="position:absolute;left:' + Math.round(-190 * SC) + 'px;top:' + Math.round(-50 * SC) + 'px;width:' + Math.round(768 * SC) + 'px;height:' + Math.round(1024 * SC) + 'px"></div>' +
      '<div class="words" style="left:860px;top:300px;width:1000px;gap:12px">' +
      '<p class="eq num n-mvs-n" style="font-size:44px">Chamfer 0.080%</p><p class="eq num n-mvs-n" style="font-size:44px">F@1% 1.000</p>' +
      '<p class="note warm n-mvs-n">the best scores of any method, on any input</p>' +
      '<p class="note n-mvs-n" style="margin-top:26px;color:var(--second)">yet: holes, loose flakes, and red patches</p>' +
      '<p class="note n-mvs-n" style="color:var(--second)">(red = the inside, seen through a hole)</p>' +
      '<p class="note n-mvs-n" style="margin-top:26px">it sits right on the dots, and that is all the scores measure;</p>' +
      '<p class="note n-mvs-n">where the cloud has gaps, a hole costs nothing</p>' +
      '<p class="eq n-mvs-n" style="font-size:42px;margin-top:22px;color:var(--accent)">good scores are not a good mesh: look at it</p></div>' +
      '<p class="cap">On our denser MVS cloud, NKSR posts the best numbers of the whole project: Chamfer 0.080%, F-score at 1% of 1.000.</p>' +
      '<p class="cap">Yet look at it: holes, loose flakes, and red patches where we see the inside through the holes.</p>' +
      '<p class="cap">Both are true. It sits right on the dots, which is all the scores measure; where the cloud has gaps, holes cost nothing.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.n-mvs-w')[0].style; this.n = q('.n-mvs-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 13.6], t);
    const p = eo(seg(t, 0.6, 1.4)); this.w.opacity = p; this.w.transform = 'scale(' + lerp(0.96, 1, p) * lerp(1, 1.03, eio(seg(t, 0.6, 24))) + ')';
    const NT = [1.2, 1.8, 2.6, 7.2, 7.8, 13.8, 14.4, 19.0];
    this.n.forEach((el, i) => { const q2 = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = q2; el.style.transform = 'translateX(' + (1 - q2) * 24 + 'px)'; });
  },
});