const { seg, eo, eio, lerp, TextFx } = kit;
// steps from surface/scripts/queue.sh: [id, minutes, description]; the failure of setup_ier is an example
const ST = [['setup_meshanything', 12, 'MeshAnything env + weights'], ['setup_ier', 15, 'IER env, SparseConvNet, weights'], ['poisson_r384', 8, 'Poisson 384³, alpha 4'], ['ma_v2_greedy', 4, 'MeshAnything V2 greedy'],
  ['ier_run', 8, 'IER meshing, 12.5k points'], ['p2m_run', 80, 'Point2Mesh, 6000 iterations'], ['dhsp_run', 90, 'DHSP hybrid self-prior'], ['select_best', 1, 'pick the best run per method']];
const Y0 = 290, RH = 62, A = ST.map((_, k) => 1.0 + 1.2 * k), B2 = [15.0, 15.3, 16.9, 17.1, 17.3, 18.6, 18.8, 19.0, 19.3];
kit.scene('r-queue', {
  init(kit) {
    let rows = '';
    ST.forEach(([id, m, d], i) => { const y = Y0 + i * RH; rows += '<div class="r-q-r" style="position:absolute;left:0;top:' + y + 'px;width:1240px;height:' + RH + 'px"><p class="note" style="left:140px;top:10px;font-size:24px;color:var(--second)">' + id + '</p><p class="note" style="left:430px;top:12px;font-size:22px;color:color-mix(in srgb, var(--second) 60%, var(--ground))">' + m + ' min</p><p class="note" style="left:540px;top:10px;font-family:var(--sans);font-size:25px;color:var(--second)">' + d + '</p></div>' + PILL.html('r-q-p', 1010, y + 10); });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Running it · The queue</span><h2 class="line">The queue</h2></div>' +
      '<p class="note r-q-t" style="left:140px;top:236px;font-size:20px;color:var(--second)">steps from queue.sh; the failure shown is an example</p>' +
      '<div class="r-q-h" style="position:absolute;left:120px;top:' + Y0 + 'px;width:1100px;height:' + (RH - 6) + 'px;border-radius:10px;background:color-mix(in srgb, var(--ground) 84%, var(--accent))"></div>' + rows +
      '<p class="note warm r-q-e" style="left:140px;top:812px;font-size:24px">ier_run skipped: it needs setup_ier</p>' +
      '<p class="note warm r-q-e" style="left:140px;top:812px;font-size:24px">second start, after fixing setup_ier</p>' +
      '<div class="words" style="left:1290px;top:300px;width:560px;gap:22px">' +
      '<p class="note r-q-n">each step: a .status and a .log</p><p class="note r-q-n">a failure never stops the rest</p><p class="note r-q-n">a step can need another</p>' +
      '<p class="note r-q-n" style="color:var(--accent)">finished steps are skipped</p><p class="note r-q-n" style="color:var(--accent)">after a fix: just start it again</p></div>' +
      '<p class="cap">The queue is a plain list of steps: a name, a rough time and the command. It writes a status file and a log for every step.</p>' +
      '<p class="cap">A failed step never stops the others, and a step that needs a failed one is skipped, with the reason written down.</p>' +
      '<p class="cap">After a fix you simply start the queue again. Finished steps are skipped, so only what is missing runs.</p>' +
      '<p class="cap">That is how it could run for hours alone: each step either finishes, or leaves a log that says exactly why not.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.r = q('.r-q-r'); this.p = q('.r-q-p'); this.h = q('.r-q-h')[0].style; this.e = q('.r-q-e'); this.n = q('.r-q-n'); this.tt = q('.r-q-t')[0].style;
  },
  state(k, t) {
    if (t >= B2[0]) { if (k === 1) return t < B2[1] ? 'failed' : t < B2[2] ? 'running' : 'done'; if (k === 4) return t < B2[4] ? 'skipped' : t < B2[5] ? 'running' : 'done'; return 'done'; }
    if (t < A[k]) return 'waiting';
    if (k === 4) return 'skipped';
    if (t < A[k] + 1.2) return 'running';
    return k === 1 ? 'failed' : 'done';
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.6, 20.0], t);
    this.tt.opacity = eo(seg(t, 0.4, 0.9));
    this.r.forEach((el, i) => { const p = eo(seg(t, 0.3 + 0.08 * i, 0.8 + 0.08 * i)); el.style.opacity = p; this.p[i].style.opacity = p; PILL.set(this.p[i], this.state(i, t)); });
    // the highlight follows the step being looked at
    let row = -1, f = 0;
    if (t >= A[0] && t < A[7] + 1.2) { row = Math.min(7, Math.floor((t - A[0]) / 1.2)); f = eio(seg(t, A[row], A[row] + 0.25)); }
    else if (t >= B2[0] && t < B2[8]) { for (let k = 0; k < 8; k++) if (t >= B2[k]) row = k; f = eio(seg(t, B2[row], B2[row] + 0.15)); }
    const prev = Math.max(0, row - 1), y = row < 0 ? 0 : lerp(prev, row, row === 0 ? 1 : f) * RH;
    this.h.transform = 'translateY(' + y.toFixed(1) + 'px)'; this.h.opacity = row < 0 ? 0 : 1;
    this.e[0].style.opacity = eo(seg(t, A[4], A[4] + 0.4)) * (1 - eo(seg(t, 14.4, 14.8))); this.e[1].style.opacity = eo(seg(t, 14.8, 15.2));
    const NT = [1.2, 7.0, 7.6, 13.8, 14.4]; this.n.forEach((el, i) => { const p = eo(seg(t, NT[i], NT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
  },
});
