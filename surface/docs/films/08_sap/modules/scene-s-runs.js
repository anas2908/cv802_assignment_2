const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('s-runs', {
  init(kit) {
    const A = 0.7, B = 1.18;
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">SAP · Our scan</span><h2 class="line">Our result</h2></div>' +
      '<div class="s-runs-w" style="position:absolute;left:250px;top:226px;width:' + Math.round(320 * A) + 'px;height:' + Math.round(950 * A) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('sap_vgg.png') + '" style="position:absolute;left:' + Math.round(-225 * A) + 'px;top:' + Math.round(-50 * A) + 'px;width:' + Math.round(768 * A) + 'px;height:' + Math.round(1024 * A) + 'px"></div>' +
      '<div class="s-runs-w" style="position:absolute;left:600px;top:226px;width:' + Math.round(186 * B) + 'px;height:' + Math.round(560 * B) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('extra.jpg') + '" style="position:absolute;left:' + Math.round(-806 * B) + 'px;top:' + Math.round(-75 * B) + 'px;width:' + Math.round(1502 * B) + 'px;height:' + Math.round(656 * B) + 'px"></div>' +
      '<div class="words s-runs-l" style="left:212px;top:902px;width:300px;align-items:center"><p class="note">shape</p></div>' +
      '<div class="words s-runs-l" style="left:560px;top:902px;width:300px;align-items:center"><p class="note">with our photo texture</p></div>' +
      '<div class="words" style="left:1010px;top:290px;width:860px;gap:10px">' +
      '<p class="eq num s-runs-n" style="font-size:42px">64,168 triangles · closed</p>' +
      '<p class="eq num s-runs-n" style="font-size:42px">7.8 minutes</p>' +
      '<p class="note s-runs-n" style="margin-top:18px;color:var(--second)">Chamfer 0.195% · F@1% 0.998 · F@0.5% 0.961</p>' +
      '<p class="note s-runs-n" style="color:var(--second)">normal consistency 0.81</p>' +
      '<p class="note warm s-runs-n" style="margin-top:26px">our arrows were never used,</p><p class="note warm s-runs-n">so their mistakes could not hurt it</p></div>' +
      '<p class="cap">Our SAP result on the VGGSfM scan: 64,168 triangles, one closed surface, in under 8 minutes.</p>' +
      '<p class="cap">It is close to the dots, F-score at 1% of 0.998, and fairly smooth, normal consistency 0.81. With our photo texture it looks like the person.</p>' +
      '<p class="cap">And it got there without our arrows at all, so the arrow mistakes that hurt Point2Mesh could not hurt it.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.s-runs-w'); this.l = q('.s-runs-l'); this.n = q('.s-runs-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 14.0], t);
    const WT = [0.6, 8.0]; this.w.forEach((el, i) => { const p = eo(seg(t, WT[i], WT[i] + 0.8)); el.style.opacity = p; el.style.transform = 'scale(' + lerp(0.96, 1, p) * lerp(1, 1.025, eio(seg(t, WT[i], 22))) + ')'; });
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, WT[i] + 0.6, WT[i] + 1.1)));
    const NT = [1.2, 1.8, 7.2, 7.8, 14.2, 14.6]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
  },
});