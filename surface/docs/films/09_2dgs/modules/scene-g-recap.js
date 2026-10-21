const { seg, eo, eio, lerp, TextFx } = kit;
kit.scene('g-recap', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">2DGS · Recap</span><h2 class="line">In one line</h2></div>' +
      '<div class="words" style="left:110px;top:290px;width:1220px;gap:14px">' +
      '<p class="eq g-recap-e" style="font-size:46px">a skin of small flat disks, learned from the photos,</p>' +
      '<p class="eq g-recap-e" style="font-size:46px;color:var(--accent)">then fused into a mesh from their depth</p>' +
      '<p class="box hot g-recap-e" style="margin-top:24px;font-size:28px">125 photos and cameras; disks redraw every photo; flat disks give a clear depth; depth maps fused; the best face, a mid-table score</p>' +
      '<p class="note warm g-recap-e" style="margin-top:18px;font-size:30px">next: our own photo texturing, which colours every mesh</p></div>' +
      '<p class="cap">2DGS in one line: learn a skin of flat, coloured disks from the photos, then fuse their depths into a mesh.</p>' +
      '<p class="cap">Next on the roadmap: our own photo texturing, the step that gave every one of these meshes its colours.</p></div>'));
    this.k = kit; const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.e = q('.g-recap-e');
    this.G = GS.decode([MESH.load(kit, 'gs-s1.json'), MESH.load(kit, 'gs-s2.json')]);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8], t);
    const ET = [0.6, 1.4, 3.0, 7.2];
    this.e.forEach((el, i) => { const p = eo(seg(t, ET[i], ET[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    GS.draw(this.k.fx, this.G, { cx: 1610, cy: 566, s: 640, yaw: lerp(-0.5, 0.6, eio(seg(t, 0, 14))), pitch: 0.12, grow: 2.2, alpha: eo(seg(t, 0.3, 1.3)) });
  },
});