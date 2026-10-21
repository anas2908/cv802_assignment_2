const { seg, eo, eio, lerp, TextFx } = kit;
const L = [['geometry.ply', 'the mesh, in the scan’s frame', 7.8], ['method_info.json', 'paper, code version, settings', 8.6], ['progress.json', 'percent done, current stage', 9.4], ['log.txt', 'all the method printed', 10.2]];
const R = [['mesh.obj + texture', 'the textured deliverable', 14.8], ['metrics.json', 'how close, holes, colour', 15.6], ['preview_*.png', 'front, back, sides, shaded', 16.4], ['manifest.json', 'written last: done', 17.2]];
const CX0 = 560, CW = 820, CT = 240, CH = 640, COL = [590, 990], CHW = 370, Y0 = 344, DY = 112;
kit.scene('c-contract', {
  init(kit) {
    const chip = (x, y, a, b, warm) => '<div class="box c-con-c" style="left:' + x + 'px;top:' + y + 'px;width:' + CHW + 'px;height:96px;padding:12px 16px' + (warm ? ';border-color:var(--accent)' : '') + '"><p style="margin:0;font-family:var(--mono);font-size:23px;color:' + (warm ? 'var(--accent)' : 'var(--main)') + '">' + a + '</p><p style="margin:6px 0 0;font-size:20px;color:var(--second)">' + b + '</p></div>';
    let chips = ''; L.forEach(([a, b], i) => { chips += chip(COL[0], Y0 + i * DY, a, b, false); }); R.forEach(([a, b], i) => { chips += chip(COL[1], Y0 + i * DY, a, b, true); });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · The rule</span><h2 class="line">One contract</h2></div>' +
      '<div class="c-con-k" style="position:absolute;left:' + CX0 + 'px;top:' + CT + 'px;width:' + CW + 'px;height:' + CH + 'px;box-sizing:border-box;border:2px dashed color-mix(in srgb, var(--second) 45%, var(--ground));border-radius:14px"></div>' +
      '<p class="note c-con-k" style="left:' + (CX0 + 26) + 'px;top:' + (CT + 18) + 'px;font-size:22px;color:var(--second)">outputs/sap/sap-v1-p100k-g256/</p>' +
      '<p class="note c-con-h" style="left:' + COL[0] + 'px;top:' + (Y0 - 34) + 'px;font-size:20px">written by the method</p>' +
      '<p class="note warm c-con-h" style="left:' + COL[1] + 'px;top:' + (Y0 - 34) + 'px;font-size:20px">added by the finalizer</p>' + chips +
      '<div class="words" style="left:110px;top:380px;width:420px;gap:14px"><p class="eq c-con-n" style="font-size:38px">whatever happens inside,</p><p class="eq c-con-n" style="font-size:38px;color:var(--accent)">the same files come out</p></div>' +
      '<div class="words" style="left:1430px;top:380px;width:420px;gap:14px"><p class="note c-con-m">one finalizer for all</p><p class="note c-con-m">one viewer for all</p><p class="note c-con-m">one metrics table for all</p></div>' +
      '<p class="cap">Every method is wrapped to obey one contract: whatever happens inside, it must leave the same few files in its run folder.</p>' +
      '<p class="cap">The method writes its mesh as geometry.ply, in the scan’s own frame, plus a note of its paper, code version, settings and time.</p>' +
      '<p class="cap">A shared finalizer then adds the textured OBJ, the metrics and preview pictures. So one viewer and one table work for every method.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.k = q('.c-con-k'); this.h = q('.c-con-h'); this.c = q('.c-con-c'); this.n = q('.c-con-n'); this.m = q('.c-con-m');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.6, 14.6], t);
    this.k.forEach(el => el.style.opacity = eo(seg(t, 0.5, 1.1)));
    this.h[0].style.opacity = eo(seg(t, 7.6, 8.0)); this.h[1].style.opacity = eo(seg(t, 14.6, 15.0));
    L.concat(R).forEach(([, , a], i) => { const p = eo(seg(t, a, a + 0.5)); this.c[i].style.opacity = p; this.c[i].style.transform = 'translateY(' + (1 - p) * 16 + 'px)'; });
    this.n.forEach((el, i) => { const p = eo(seg(t, 1.4 + 0.8 * i, 1.9 + 0.8 * i)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.m.forEach((el, i) => { const p = eo(seg(t, 18.2 + 0.5 * i, 18.7 + 0.5 * i)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
  },
});
