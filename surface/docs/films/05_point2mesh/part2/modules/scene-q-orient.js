const { seg, eo, eio, lerp, TextFx } = kit;
const TX = [560, 720, 880, 1040, 1200, 1360], TY = 430, DX = [600, 680, 760, 840, 920, 1000, 1080, 1160, 1240, 1320], DY = 540, FL = 5;
kit.scene('q-orient', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Point2Mesh · Part 2</span><h2 class="line">Which way the arrows point</h2></div>' +
      '<div class="q-orient-a" style="position:absolute;inset:0">' +
      '<p class="note warm q-orient-f" style="left:1040px;top:640px">a flipped arrow</p>' +
      '<div class="words" style="left:300px;top:720px;width:1320px;align-items:center;gap:8px">' +
      '<p class="eq q-orient-o" style="font-size:40px">default: the triangle must face the arrow’s way</p>' +
      '<p class="eq q-orient-u" style="font-size:40px;color:var(--accent)">--unoriented: the same line is enough</p></div></div>' +
      '<div class="words q-orient-l" style="left:410px;top:864px;width:500px;align-items:center"><p class="note">paper defaults · F@1% 0.646</p></div>' +
      '<div class="words q-orient-l" style="left:1010px;top:864px;width:500px;align-items:center"><p class="note warm">--unoriented · F@1% 0.844</p></div>' +
      '<div class="words q-orient-n" style="left:1490px;top:400px;width:420px;gap:14px"><p class="eq num" style="font-size:30px">F@1%  0.646 → 0.844</p><p class="eq num" style="font-size:30px">Chamfer  0.82% → 0.55%</p></div>' +
      '<p class="cap">Our dot arrows come from Video 1. That orientation step is not perfect: in tight spots, like the crossed arms, some end up pointing inwards.</p>' +
      '<p class="cap">By default, each triangle must face exactly the way the nearby arrows point. A flipped arrow says: turn inside out here.</p>' +
      '<p class="cap">The unoriented option only asks that the triangle and the arrow lie on the same line. A flipped arrow is then harmless.</p>' +
      '<p class="cap">On our scan: paper defaults on the left, unoriented on the right. Everything else is the same.</p>' +
      '<p class="cap">F-score at 1% rises from 0.646 to 0.844 and the Chamfer gap falls from 0.82% to 0.55%: our best Point2Mesh run.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.A = q('.q-orient-a')[0].style; this.f = q('.q-orient-f')[0].style; this.o = q('.q-orient-o')[0].style; this.u = q('.q-orient-u')[0].style; this.l = q('.q-orient-l'); this.n = q('.q-orient-n')[0].style;
    this.Sd = MESH.at(MESH.stage(MESH.load(kit, 'p2m-def.json')), 0); this.Su = MESH.at(MESH.stage(MESH.load(kit, 'p2m-s4.json')), 1);
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    PS.caps(this.caps, [0.3, 5.4, 10.4, 15.6, 21.2], t);
    const pa = 1 - eo(seg(t, 14.6, 15.2)); this.A.opacity = pa;
    this.f.opacity = eo(seg(t, 2.6, 3.1)); this.o.opacity = eo(seg(t, 5.6, 6.1)) * (1 - 0.6 * eo(seg(t, 10.4, 10.9))); this.u.opacity = eo(seg(t, 10.6, 11.1));
    this.l.forEach((el, i) => el.style.opacity = eo(seg(t, 16.0 + i * 0.8, 16.5 + i * 0.8))); const pn = eo(seg(t, 21.4, 22.0)); this.n.opacity = pn; this.n.transform = 'translateX(' + (1 - pn) * 26 + 'px)';
    const ctx = this.k.fx, c = this.c; ctx.lineCap = 'round';
    if (pa > 0) {
      ctx.globalAlpha = pa;
      const a0 = eo(seg(t, 0.6, 1.6)), tw = eio(seg(t, 6.2, 8.6)) * (1 - eio(seg(t, 10.4, 11.6))), wob = Math.sin(t * 5) * 0.08 * tw;
      for (let i = 0; i < 5; i++) {
        const ang = (i === 2 ? 2.3 : i === 1 || i === 3 ? 0.55 : 0) * tw * (i === 1 ? -1 : 1) + (i === 2 ? wob : 0), mx = (TX[i] + TX[i + 1]) / 2, hl = 80;
        const p1 = [mx - hl * Math.cos(ang), TY - hl * Math.sin(ang)], p2 = [mx + hl * Math.cos(ang), TY + hl * Math.sin(ang)];
        ctx.globalAlpha = pa * a0; ctx.strokeStyle = c.a; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
        PS.arrow(ctx, mx, TY, mx + 70 * Math.sin(ang), TY - 70 * Math.cos(ang), c.a, 3, 12);
      }
      DX.forEach((x, i) => { const d = eo(seg(t, 1.0 + i * 0.08, 1.4 + i * 0.08)); if (d <= 0) return; ctx.globalAlpha = pa * d; const up = i !== FL; PS.dot(ctx, x, DY, 7, c.s); PS.arrow(ctx, x, DY, x, DY + (up ? -60 : 60), up ? c.m : c.a, 3, 11); if (!up) { ctx.strokeStyle = c.a; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, DY, 18, 0, PS.TAU); ctx.stroke(); } });
      const ok = eo(seg(t, 11.4, 12.0));
      if (ok > 0) { ctx.globalAlpha = pa * ok; ctx.strokeStyle = c.a; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(DX[FL], DY + 70); ctx.lineTo(DX[FL], TY - 90); ctx.stroke(); ctx.setLineDash([]); }
      ctx.globalAlpha = 1;
    }
    const m = eo(seg(t, 15.0, 16.2));
    if (m > 0) { const yaw = lerp(-0.45, 0.45, eio(seg(t, 15, 28))), o = { c, cy: 548, s: 600, yaw, pitch: 0.12, edge: 0.35 * m, fill: m, lw: 0.6 }; MESH.draw(ctx, this.Sd, Object.assign({}, o, { cx: 660 })); MESH.draw(ctx, this.Su, Object.assign({}, o, { cx: 1260 })); }
  },
});