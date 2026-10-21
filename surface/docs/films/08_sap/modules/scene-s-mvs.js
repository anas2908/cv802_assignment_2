const { seg, eo, eio, lerp, TextFx } = kit;
const SC = 0.7;
kit.scene('s-mvs', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">SAP · MVS cloud</span><h2 class="line">Every stray dot, wrapped</h2></div>' +
      '<div class="s-mvs-w" style="position:absolute;left:420px;top:226px;width:' + Math.round(360 * SC) + 'px;height:' + Math.round(950 * SC) + 'px;overflow:hidden;border-radius:12px"><img src="' + kit.assets.url('sap_mvs.png') + '" style="position:absolute;left:' + Math.round(-200 * SC) + 'px;top:' + Math.round(-50 * SC) + 'px;width:' + Math.round(768 * SC) + 'px;height:' + Math.round(1024 * SC) + 'px"></div>' +
      '<div class="words" style="left:860px;top:300px;width:1000px;gap:12px">' +
      '<p class="eq num s-mvs-n" style="font-size:42px">MVS: F@1% 0.963, Chamfer 0.197%</p>' +
      '<p class="note s-mvs-n" style="color:var(--second)">small closed blobs around stray dots,</p><p class="note s-mvs-n" style="color:var(--second)">and gaps that break the legs</p>' +
      '<p class="note s-mvs-n" style="margin-top:24px">404 strays removed (MVS-clean): F@1% 0.948</p>' +
      '<p class="eq s-mvs-n" style="font-size:40px;margin-top:24px;color:var(--accent)">always closed means every stray dot gets wrapped</p></div>' +
      '<p class="cap">On the MVS cloud, stray dots get wrapped too: SAP makes small closed blobs around them, and gaps break the legs.</p>' +
      '<p class="cap">It still scores F-score at 1% of 0.963 there, but the picture shows why the VGGSfM result is the one to keep.</p>' +
      '<p class="cap">Like Point2Mesh, a method that always closes its surface pays for every stray dot.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.w = q('.s-mvs-w')[0].style; this.n = q('.s-mvs-n');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 12.0], t);
    const p = eo(seg(t, 0.6, 1.4)); this.w.opacity = p; this.w.transform = 'scale(' + lerp(0.96, 1, p) * lerp(1, 1.03, eio(seg(t, 0.6, 18))) + ')';
    const NT = [1.4, 2.2, 2.6, 6.8, 12.2]; this.n.forEach((el, i) => { const q2 = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = q2; el.style.transform = 'translateX(' + (1 - q2) * 24 + 'px)'; });
  },
});