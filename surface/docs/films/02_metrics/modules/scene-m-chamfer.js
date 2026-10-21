const { seg, eo, eio, lerp, TextFx } = kit;
const BASE = 610, HS = 0.9;
const CH = [{ L: () => TOY.ACC, x0: 180, step: 48, w: 32, key: 'acc' }, { L: () => TOY.COM, x0: 1060, step: 52, w: 34, key: 'com' }];
kit.scene('m-chamfer', {
  init(kit) {
    const a = TOY.meanAcc, b = TOY.meanCom, ch = (a + b) / 2;
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words head"><span class="tag">Part 11 · Metrics</span><h2 class="line">Chamfer: the average gap</h2></div>' +
      '<p class="note m-chamfer-la" style="left:180px;top:268px">list 1: mesh → dots (accuracy)</p>' +
      '<p class="note m-chamfer-lb" style="left:1060px;top:268px;color:var(--second)">list 2: dots → mesh (completeness)</p>' +
      '<div class="words" style="left:180px;top:668px;width:1560px;gap:14px">' +
      '<p class="eq m-chamfer-e1" style="font-size:48px;white-space:normal">Chamfer = ½ × (mean of list 1 + mean of list 2)</p>' +
      '<p class="eq num m-chamfer-e2" style="font-size:48px;white-space:normal;color:var(--accent)">= ½ × ( ' + a.toFixed(1) + ' mm + ' + b.toFixed(1) + ' mm ) = ' + ch.toFixed(1) + ' mm</p>' +
      '<p class="note m-chamfer-e3" style="position:static;font-size:30px;color:var(--second)">lower is better; 0 would mean the mesh passes through every dot</p></div>' +
      '<p class="cap">Each direction gave us a list of distances. Stand every line up as a bar: long line, tall bar.</p>' +
      '<p class="cap">Now average each list. The dashed lines show the two averages.</p>' +
      '<p class="cap">Chamfer distance is simply the average of those two averages.</p>' +
      '<p class="cap">Lower is better: 0 would mean the mesh passes exactly through every dot.</p></div>'));
    this.k = kit; this.c = PS.col(kit);
    this.mono = (kit.fonts && kit.fonts.mono) || 'monospace';
    this.line = kit.stage.querySelector('.line');
    this.caps = [...kit.stage.querySelectorAll('.cap')];
    const q = k => kit.stage.querySelector('.m-chamfer-' + k).style;
    Object.assign(this, { la: q('la'), lb: q('lb'), e1: q('e1'), e2: q('e2'), e3: q('e3') });
    this.means = [a, b];
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.2);
    PS.caps(this.caps, [0.3, 5.4, 8.6, 12.6], t);
    const ctx = this.k.fx, c = this.c;
    CH.forEach((C, ci) => {
      const L = C.L(), col = ci ? c.s : c.a, t0 = ci ? 2.2 : 1.0;
      ctx.globalAlpha = eo(seg(t, t0 - 0.4, t0)); ctx.strokeStyle = PS.mix(c.g, c.s, 0.45); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(C.x0 - 12, BASE); ctx.lineTo(C.x0 + L.length * C.step, BASE); ctx.stroke();
      L.forEach((l, i) => {
        const p = eio(seg(t, t0 + i * 0.16, t0 + 0.6 + i * 0.16)); if (p <= 0) return;
        const h = Math.min(l.d, 300) * HS * p;
        ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.fillRect(C.x0 + i * C.step, BASE - h, C.w, h);
      });
      const mp = eio(seg(t, 5.8 + ci * 1.0, 6.6 + ci * 1.0));
      if (mp > 0) {
        const y = BASE - this.means[ci] * TOY.MM * HS, x1 = C.x0 - 12, x2 = C.x0 + L.length * C.step;
        ctx.globalAlpha = 1; ctx.setLineDash([12, 8]); ctx.strokeStyle = ci ? c.m : c.m; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(lerp(x1, x2, mp), y); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = eo(seg(t, 6.4 + ci * 1.0, 6.9 + ci * 1.0)); ctx.font = '600 28px ' + this.mono; ctx.fillStyle = c.m; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('dashed line = average = ' + this.means[ci].toFixed(1) + ' mm', x1 + 6, BASE + 12);
      }
      ctx.globalAlpha = 1;
    });
    this.la.opacity = eo(seg(t, 0.8, 1.3)); this.lb.opacity = eo(seg(t, 2.0, 2.5));
    this.e1.opacity = eo(seg(t, 8.8, 9.4)); this.e2.opacity = eo(seg(t, 10.8, 11.4)); this.e3.opacity = eo(seg(t, 12.8, 13.4));
  },
});