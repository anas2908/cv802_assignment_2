const { seg, eo, eio, lerp, TextFx } = kit;
// a few real queue steps; [id, time it starts, time it ends] (an illustration of a run of the queue)
const ST = [['setup_meshanything', -2, 0.6], ['poisson_r384', 0.6, 1.8], ['ma_v2_greedy', 1.8, 3.0], ['ier_run', 3.0, 4.4], ['p2m_run', 4.4, 99], ['dhsp_run', 99, 99], ['select_best', 99, 99]];
kit.scene('r-title', {
  init(kit) {
    let rows = ''; ST.forEach(([id], i) => { rows += '<p class="note r-title-r" style="left:1300px;top:' + (262 + i * 78) + 'px;font-size:24px;color:var(--second)">' + id + '</p>' + PILL.html('r-title-p', 1620, 260 + i * 78); });
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:1100px;gap:22px">' +
      '<span class="tag">CV802 · How it all runs</span>' +
      '<h1 class="line big">Running everything</h1>' +
      '<p class="sub r-title-sub">one GPU, one queue, three inputs, 113 finished runs</p>' +
      '<p class="note warm r-title-n" style="margin-top:26px">Part 2 of the code pipeline</p></div>' + rows +
      '<p class="cap">Part 1 followed one run. Here is how all of them ran: on one cluster GPU, driven by a queue that could be left alone for hours.</p>' +
      '<p class="cap">It covers the cluster rules, the queue, what happens after each run, and how the results became the viewer, report and slides.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.sub = q('.r-title-sub')[0].style; this.n = q('.r-title-n')[0].style; this.r = q('.r-title-r'); this.p = q('.r-title-p'); this.caps = q('.cap');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    PS.caps(this.caps, [0.3, 4.4], t);
    ST.forEach(([id, a, b], i) => { const p = eo(seg(t, -0.4 + 0.12 * i, 0.1 + 0.12 * i)); this.r[i].style.opacity = p; this.p[i].style.opacity = p; PILL.set(this.p[i], t >= b ? 'done' : t >= a ? 'running' : 'waiting'); });
  },
});
