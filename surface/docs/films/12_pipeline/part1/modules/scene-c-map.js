const { seg, eo, eio, lerp, TextFx } = kit;
const ROWS = [['inputs/', 'the three input point clouds', 0.6], ['methods/', 'one folder per method: setup.sh, run.sh, pipeline.json', 1.3], ['common/', 'shared tools: files, normals, textures, photo texturing, metrics, renders', 2.0],
  ['scripts/', 'the queue, cluster helpers, print export, packaging', 7.8], ['ui/', 'the server and the three web pages', 8.5], ['docs/', 'the report and slides, rebuilt from the results', 9.2]];
const RY0 = 262, RH = 96;
kit.scene('c-map', {
  init(kit) {
    let rows = ''; ROWS.forEach(([a, b], i) => { rows += '<div class="c-map-r" style="position:absolute;left:170px;top:' + (RY0 + i * RH) + 'px;width:1180px;height:80px"><p class="note" style="left:0;top:8px;font-size:30px;color:var(--accent)">' + a + '</p><p class="note" style="left:200px;top:12px;font-family:var(--sans);font-size:27px;color:var(--second);white-space:normal;width:980px">' + b + '</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · The code</span><h2 class="line">The repository</h2></div>' +
      '<p class="note c-map-g" style="left:110px;top:216px;font-size:22px;color:var(--main)">surface/  ·  in git</p>' + rows +
      '<p class="note c-map-d" style="left:1440px;top:216px;font-size:22px;color:var(--main)">outside git: the cluster’s big disk</p>' +
      '<div class="words c-map-d" style="left:1440px;top:262px;width:380px;gap:16px">' +
      ['environments', 'official code clones', 'model weights and caches', '113 run folders, with every mesh'].map(s => '<p class="box" style="font-size:26px">' + s + '</p>').join('') + '</div>' +
      '<p class="cap">All the code sits in one folder, surface. Each method gets its own small folder, and everything the methods share lives in common.</p>' +
      '<p class="cap">The scripts run things on the cluster and pack the results; ui is the viewer; docs holds the report and the slides, rebuilt from the results.</p>' +
      '<p class="cap">The heavy things never go into git: the environments, the official code, the model weights and every run live on the cluster’s big disk.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.r = q('.c-map-r'); this.g = q('.c-map-g')[0].style; this.d = q('.c-map-d');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.6, 14.6], t);
    this.g.opacity = eo(seg(t, 0.3, 0.8));
    this.r.forEach((el, i) => { const p = eo(seg(t, ROWS[i][2], ROWS[i][2] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    this.d.forEach(el => { const p = eo(seg(t, 14.8, 15.4)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
    const ctx = this.k.fx, c = this.c;
    // the tree: a trunk down the left, one branch per folder
    const tr = eio(seg(t, 0.4, 9.6)); ctx.strokeStyle = PS.mix(c.g, c.m, 0.8); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const yEnd = RY0 + (ROWS.length - 1) * RH + 30; ctx.beginPath(); ctx.moveTo(130, 252); ctx.lineTo(130, lerp(252, yEnd, Math.min(1, tr * 1.02))); ctx.stroke();
    ROWS.forEach(([, , a], i) => { const p = eio(seg(t, a - 0.1, a + 0.4)); if (p <= 0) return; const y = RY0 + i * RH + 30; ctx.beginPath(); ctx.moveTo(130, y); ctx.lineTo(lerp(130, 160, p), y); ctx.stroke(); });
    const dv = eo(seg(t, 14.6, 15.2)); if (dv > 0) { ctx.globalAlpha = dv; ctx.setLineDash([8, 10]); ctx.strokeStyle = PS.mix(c.g, c.s, 0.5); ctx.beginPath(); ctx.moveTo(1400, 220); ctx.lineTo(1400, 900); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  },
});
