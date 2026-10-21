const { seg, eo, eio, lerp, TextFx } = kit;
const CAM = [250, 560], PX = 430;
kit.scene('g-render', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">2DGS · Training</span><h2 class="line">Redrawing a photo</h2></div>' +
      '<p class="note g-render-a" style="left:170px;top:660px">camera</p><p class="note g-render-a" style="left:380px;top:760px">pixels</p><p class="note g-render-a" style="left:880px;top:900px">disks</p>' +
      '<div class="words" style="left:1230px;top:270px;width:640px;gap:12px">' +
      '<p class="eq g-render-n" style="font-size:38px">pixel = Σ colour × opacity × light left</p>' +
      '<p class="note g-render-n" style="color:var(--second)">front to back: each disk adds its colour,</p><p class="note g-render-n" style="color:var(--second)">times the light still left</p>' +
      '<p class="note warm g-render-n" style="margin-top:22px">redrawn pixel vs the real photo pixel</p>' +
      '<p class="note g-render-n" style="margin-top:150px">the difference nudges every disk it touched:</p><p class="note g-render-n">place, tilt, size, colour, opacity</p>' +
      '<p class="note g-render-n" style="margin-top:22px;color:var(--second)">125 photos · 30,000 steps</p></div>' +
      '<p class="note g-render-s" style="left:1240px;top:494px;color:var(--second)">redrawn</p><p class="note warm g-render-s" style="left:1440px;top:494px">photo</p>' +
      '<p class="cap">To learn, 2DGS redraws each photo from the disks. From the camera, one ray goes out through every pixel.</p>' +
      '<p class="cap">Where a ray crosses a disk, the disk adds its colour, weighted by its opacity and by how much light is still left. Front to back.</p>' +
      '<p class="cap">The redrawn pixel is compared with the real photo, and the difference nudges every disk it touched.</p>' +
      '<p class="cap">Repeated for all 125 photos over 30,000 steps, the disks settle where the photos say the person is.</p></div>'));
    this.k = kit; this.c = PS.col(kit); const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.a = q('.g-render-a'); this.n = q('.g-render-n'); this.s = q('.g-render-s');
    const c = this.c; this.D = []; for (let k = 0; k < 7; k++) { const y = 300 + k * 90, x = 930 + 40 * Math.sin(k * 0.9); this.D.push({ x, y, col: [c.m, c.s, c.a][k % 3], mix: 0.4 + 0.1 * (k % 2), op: 0.75 }); }
    this.back = { x: 1040, y: 570, col: c.a, mix: 0.6, op: 0.9 };
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.0, 14.0, 21.0], t);
    this.a.forEach((el, i) => el.style.opacity = eo(seg(t, 0.8 + i * 0.4, 1.3 + i * 0.4)));
    const NT = [7.2, 7.6, 8.0, 14.2, 15.0, 15.4, 21.2]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.s.forEach(el => el.style.opacity = eo(seg(t, 14.2, 14.7)));
    const ctx = this.k.fx, c = this.c; ctx.lineCap = 'round';
    const a0 = eo(seg(t, 0.4, 1.4));
    ctx.globalAlpha = a0; ctx.fillStyle = PS.mix(c.g, c.s, 0.25); ctx.strokeStyle = c.s; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(CAM[0] - 50, CAM[1] - 34); ctx.lineTo(CAM[0] + 10, CAM[1] - 34); ctx.lineTo(CAM[0] + 10, CAM[1] + 34); ctx.lineTo(CAM[0] - 50, CAM[1] + 34); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(CAM[0] + 10, CAM[1] - 14); ctx.lineTo(CAM[0] + 40, CAM[1] - 28); ctx.lineTo(CAM[0] + 40, CAM[1] + 28); ctx.lineTo(CAM[0] + 10, CAM[1] + 14); ctx.stroke(); ctx.globalAlpha = 1;
    const nudge = eio(seg(t, 16.0, 19.0));
    const disk = (d, a) => { const dx = d.x - CAM[0], dy = d.y - CAM[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L; ctx.globalAlpha = a * d.op; ctx.strokeStyle = PS.mix(c.g, d.col, d.mix + 0.3); ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(d.x - nx * 42, d.y - ny * 42); ctx.lineTo(d.x + nx * 42, d.y + ny * 42); ctx.stroke(); ctx.globalAlpha = 1; };
    const da = eo(seg(t, 0.8, 2.0)); if (da > 0) { this.D.forEach(d => disk(d, da)); disk(this.back, da); }
    const ra = eo(seg(t, 2.4, 4.0)) * (1 - 0.6 * eo(seg(t, 7.0, 7.6)));
    if (ra > 0) this.D.forEach((d, k) => { const py = lerp(CAM[1] - 120, CAM[1] + 120, k / 6); ctx.globalAlpha = ra * 0.7; ctx.strokeStyle = c.m; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(CAM[0] + 40, CAM[1]); ctx.lineTo(d.x + (d.x - CAM[0]) * 0.15, d.y + (d.y - CAM[1]) * 0.15); ctx.stroke(); const pp = eo(seg(t, 4.0 + k * 0.2, 4.4 + k * 0.2)); ctx.globalAlpha = pp; ctx.fillStyle = PS.mix(c.g, d.col, d.mix); ctx.fillRect(PX - 18, py - 15, 36, 30); ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.lineWidth = 1.5; ctx.strokeRect(PX - 18, py - 15, 36, 30); ctx.globalAlpha = 1; });
    const hr = eo(seg(t, 7.2, 8.4));
    if (hr > 0) { const d = this.D[3], end = [this.back.x + (this.back.x - CAM[0]) * 0.12, this.back.y + (this.back.y - CAM[1]) * 0.12]; ctx.globalAlpha = hr; ctx.strokeStyle = c.a; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(CAM[0] + 40, CAM[1]); ctx.lineTo(lerp(CAM[0] + 40, end[0], hr), lerp(CAM[1], end[1], hr)); ctx.stroke(); [[d, 'α₁'], [this.back, 'α₂']].forEach(([q, lab], i) => { const v = eo(seg(t, 9.0 + i * 1.2, 9.6 + i * 1.2)); if (v <= 0) return; ctx.globalAlpha = v; PS.dot(ctx, q.x, q.y, 9, c.a); ctx.font = '600 28px ' + kit.fonts.mono; ctx.fillStyle = c.a; ctx.fillText(lab, q.x + 18, q.y - 22); }); ctx.globalAlpha = 1; }
    const sw = eo(seg(t, 14.2, 15.0));
    if (sw > 0) { const r = PS.hex(c.m), b = PS.hex(c.a), ph = PS.hex(c.s), mixc = (A, B, p) => 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',') + ')', g = PS.hex(c.g), rend = r.map((v, i) => g[i] + (v - g[i]) * 0.55), tgt = ph.map((v, i) => g[i] + (v - g[i]) * 0.7); ctx.globalAlpha = sw; ctx.fillStyle = mixc(rend, tgt, nudge * 0.85); ctx.fillRect(1240, 532, 140, 76); ctx.fillStyle = mixc(tgt, tgt, 0); ctx.fillRect(1440, 532, 140, 76); ctx.strokeStyle = c.s; ctx.lineWidth = 2; ctx.strokeRect(1240, 532, 140, 76); ctx.strokeStyle = c.a; ctx.strokeRect(1440, 532, 140, 76); ctx.globalAlpha = 1; }
    const na = eo(seg(t, 15.6, 16.2)) * (1 - eo(seg(t, 20.0, 20.6)));
    if (na > 0) [this.D[3], this.back].forEach(q => { ctx.globalAlpha = na; PS.arrow(ctx, q.x, q.y + 30, q.x + 26 * Math.sin(t * 3), q.y + 60, c.a, 3, 10); ctx.globalAlpha = 1; });
  },
});