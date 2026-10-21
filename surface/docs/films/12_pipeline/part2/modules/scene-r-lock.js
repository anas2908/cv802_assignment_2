const { seg, eo, eio, lerp, TextFx } = kit;
// GPU jobs wait in line at the lock and take the GPU one at a time; CPU jobs run side by side
const G = ['poisson_r384', 'ma_v2_greedy', 'ier_run', 'p2m_run'], C = ['print_export', 'results_table', 'select_best'];
const GY = 360, CY = 650, CHW = 230, GATE = 1010, GPU = [1080, 1480], DONE = 1560, GSLOT = [3.0, 8.0, 13.0, 18.0], GRUN = 4.5;
kit.scene('r-lock', {
  init(kit) {
    let html = '';
    G.forEach(s => { html += '<p class="box r-lock-g" style="left:0;top:' + (GY - 26) + 'px;width:' + CHW + 'px;padding:10px 0;text-align:center;font-family:var(--mono);font-size:22px;color:var(--accent)">' + s + '</p>'; });
    C.forEach(s => { html += '<p class="box r-lock-c" style="left:0;top:' + (CY - 26) + 'px;width:' + CHW + 'px;padding:10px 0;text-align:center;font-family:var(--mono);font-size:22px;color:var(--main)">' + s + '</p>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Running it · The GPU</span><h2 class="line">One GPU, one at a time</h2></div>' +
      '<div class="r-lock-f" style="position:absolute;left:' + (GPU[0] - 20) + 'px;top:' + (GY - 90) + 'px;width:' + (GPU[1] - GPU[0] + 40) + 'px;height:180px;box-sizing:border-box;border:3px solid var(--accent);border-radius:14px"></div>' +
      '<p class="note warm r-lock-f" style="left:' + (GPU[0] - 4) + 'px;top:' + (GY - 82) + 'px;font-size:22px">GPU: one job at a time</p>' +
      '<div class="r-lock-f" style="position:absolute;left:' + (GATE - 8) + 'px;top:' + (GY - 70) + 'px;width:10px;height:140px;border-radius:5px;background:var(--accent)"></div>' +
      '<p class="note r-lock-f" style="left:620px;top:' + (GY - 118) + 'px;font-size:22px;color:var(--second)">flock /tmp/cv802_sp2_gpu.lock</p>' +
      '<div class="r-lock-f" style="position:absolute;left:' + (GPU[0] - 20) + 'px;top:' + (CY - 120) + 'px;width:' + (GPU[1] - GPU[0] + 40) + 'px;height:240px;box-sizing:border-box;border:3px solid var(--main);border-radius:14px"></div>' +
      '<p class="note r-lock-f" style="left:' + (GPU[0] - 4) + 'px;top:' + (CY - 112) + 'px;font-size:22px">12 CPUs: side by side</p>' +
      '<p class="note r-lock-f" style="left:' + DONE + 'px;top:' + (GY - 82) + 'px;font-size:22px;color:var(--second)">finished</p>' + html +
      '<p class="cap">Many steps want the GPU, but there is only one, and two big jobs at once could run it out of memory.</p>' +
      '<p class="cap">So every GPU step first takes a lock, a small file, using flock. The next one waits in line until the lock is free again.</p>' +
      '<p class="cap">Work that only needs the CPUs, like print exports and tables, skips the line and runs side by side.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.g = q('.r-lock-g'); this.cc = q('.r-lock-c'); this.f = q('.r-lock-f');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 7.4, 14.6], t);
    this.f.forEach(el => el.style.opacity = eo(seg(t, 0.4, 0.9)));
    // GPU jobs: arrive into the line, then enter the GPU at their slot, then leave to "finished"
    this.g.forEach((el, i) => {
      const arrive = eo(seg(t, 0.8 + 0.4 * i, 1.6 + 0.4 * i)), t0 = GSLOT[i], t1 = t0 + GRUN;
      let ahead = 0; GSLOT.forEach((s, j) => { if (j < i) ahead += 1 - eio(seg(t, s, s + 0.6)); });
      const qx = GATE - 20 - CHW - ahead * (CHW + 14), inX = (GPU[0] + GPU[1]) / 2 - CHW / 2, outX = DONE + (i % 2) * 40;
      let x = lerp(-CHW, qx, arrive), y = 0;
      if (t >= t0) x = lerp(qx, inX, eio(seg(t, t0, t0 + 0.6)));
      if (t >= t1) { x = lerp(inX, outX, eio(seg(t, t1, t1 + 0.6))); y = lerp(0, 10 + 70 * i, eio(seg(t, t1, t1 + 0.6))); }
      el.style.opacity = arrive; el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      el.style.borderColor = t >= t0 && t < t1 ? 'var(--accent)' : '';
    });
    // CPU jobs: all at once
    this.cc.forEach((el, i) => {
      const a = eo(seg(t, 14.8 + 0.3 * i, 15.6 + 0.3 * i)), inX = (GPU[0] + GPU[1]) / 2 - CHW / 2, x = lerp(-CHW, inX, eio(seg(t, 14.8 + 0.3 * i, 16.4 + 0.3 * i))), y = (i - 1) * 60 + 20;
      el.style.opacity = a; el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y + 'px)';
    });
  },
});
