const { seg, eo, eio, lerp, TextFx } = kit;
// the tmux view (an illustration with our real step names and F-scores); p2m_run's iteration counts up
const ROWS = [['poisson_r384', 'done', 'F@1% 0.999'], ['ma_v2_greedy', 'done', 'F@1% 0.113'], ['ier_run', 'done', 'F@1% 0.998'], ['p2m_run', 'running', ''], ['dhsp_run', 'waiting', ''], ['select_best', 'waiting', '']];
const LOG = ['### p2m_run: Point2Mesh 6000 iterations', '[3%] prep 30000 points with oriented normals, largest extent 1', '[6%] initial mesh convex hull -> Manifold -> 2000 faces', '[10%] optimise self-prior CNN, 6000 iterations (progress in log)',
  '[25%] optimise iteration 1200/6000', '[40%] optimise iteration 2400/6000', '[55%] optimise iteration 3600/6000', '[70%] optimise iteration 4800/6000'];
const BX = 110, BY = 236, BW = 1700, BH = 660, RY = 306, RH = 56, BAR = [700, 1180], LY = 660, LH = 30;
kit.scene('r-live', {
  init(kit) {
    let rows = ''; ROWS.forEach(([id], i) => { const y = RY + i * RH; rows += '<p class="note r-live-r" style="left:150px;top:' + (y + 2) + 'px;font-size:24px;color:var(--second)">' + id + '</p>' + PILL.html('r-live-p', 470, y, 170) + '<p class="note r-live-v" style="left:1200px;top:' + (y + 4) + 'px;font-size:22px">' + '</p><p class="note r-live-f" style="left:1330px;top:' + (y + 4) + 'px;font-size:22px;color:var(--second)"></p>'; });
    let log = ''; LOG.forEach((s, j) => { log += '<p class="note r-live-l" style="left:24px;top:' + (j * LH) + 'px;font-size:20px;color:' + (j ? 'var(--second)' : 'var(--accent)') + '">' + s + '</p>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Running it · Watching</span><h2 class="line">Watching it run</h2></div>' +
      '<div class="r-live-b" style="position:absolute;left:' + BX + 'px;top:' + BY + 'px;width:' + BW + 'px;height:' + BH + 'px;box-sizing:border-box;border:2px solid color-mix(in srgb, var(--main) 45%, var(--ground));border-radius:14px;background:color-mix(in srgb, var(--ground) 94%, var(--main))">' +
      '<p class="note" style="left:24px;top:12px;font-size:20px;color:var(--second)">tmux session cv802 (an illustration)</p><p class="note" style="right:24px;top:12px;font-size:20px;color:var(--accent)">attach: tmux attach -t cv802 · detach: Ctrl-b, d</p>' +
      '<div style="position:absolute;left:0;right:0;top:404px;border-top:2px solid color-mix(in srgb, var(--main) 35%, var(--ground))"></div>' +
      '<div style="position:absolute;left:0;top:' + (LY - BY) + 'px;width:' + BW + 'px;height:' + (BY + BH - LY - 14) + 'px;overflow:hidden"><div class="r-live-s" style="position:absolute;left:0;top:0;width:100%">' + log + '</div></div></div>' + rows +
      '<div class="words r-live-d" style="left:' + BX + 'px;top:520px;width:' + BW + 'px;align-items:center"><p class="eq" style="font-size:48px;color:var(--accent)">detached: the queue keeps running</p></div>' +
      '<p class="cap">The queue runs inside tmux, a terminal that keeps going after you log out. The top half shows every step and its progress.</p>' +
      '<p class="cap">Each run keeps its progress.json up to date, so the table shows how far it is. The bottom half is the queue’s own output.</p>' +
      '<p class="cap">Detach, go to sleep, attach again in the morning: the queue never noticed you left.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.r-live-b')[0].style; this.r = q('.r-live-r'); this.p = q('.r-live-p'); this.v = q('.r-live-v'); this.f = q('.r-live-f'); this.l = q('.r-live-l'); this.s = q('.r-live-s')[0].style; this.d = q('.r-live-d')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.4, 12.4], t);
    const det = eo(seg(t, 12.8, 13.4)) * (1 - eo(seg(t, 16.0, 16.6))), dim = 1 - det, a = eo(seg(t, 0.3, 0.9));
    this.b.opacity = a * (1 - 0.75 * det); this.d.opacity = det;
    const it = Math.round(lerp(1200, 4800, seg(t, 0.5, 17.5)) / 10) * 10, pc = Math.round(10 + 75 * it / 6000);
    ROWS.forEach(([id, st, fs], i) => {
      const p = eo(seg(t, 0.6 + 0.1 * i, 1.1 + 0.1 * i)) * dim; this.r[i].style.opacity = p; this.p[i].style.opacity = p; this.v[i].style.opacity = p; this.f[i].style.opacity = p;
      PILL.set(this.p[i], st); this.v[i].textContent = st === 'done' ? '100%' : st === 'running' ? pc + '%' : ''; this.f[i].textContent = st === 'running' ? 'iteration ' + it + '/6000' : fs;
    });
    // the log: one line every two seconds, scrolling up once the pane is full
    const shown = Math.min(LOG.length, 4 + Math.floor(seg(t, 1.0, 17.0) * (LOG.length - 4) + 1e-6));
    this.l.forEach((el, j) => el.style.opacity = (j < shown ? 1 : 0) * dim);
    this.s.transform = 'translateY(' + (-Math.max(0, shown - 7) * LH) + 'px)';
    const ctx = this.k.fx, c = this.c;
    ROWS.forEach(([, st], i) => { const y = RY + i * RH + 10, p = eo(seg(t, 0.6 + 0.1 * i, 1.1 + 0.1 * i)) * dim; if (p <= 0) return; const v = st === 'done' ? 1 : st === 'running' ? pc / 100 : 0;
      ctx.globalAlpha = p; ctx.fillStyle = PS.mix(c.g, c.s, 0.12); ctx.fillRect(BAR[0], y, BAR[1] - BAR[0], 18); ctx.fillStyle = st === 'running' ? c.a : c.m; ctx.fillRect(BAR[0], y, (BAR[1] - BAR[0]) * v, 18); ctx.globalAlpha = 1; });
  },
});
