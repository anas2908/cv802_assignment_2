const { seg, eo, eio, lerp, TextFx } = kit;
const FLOW = [['138,677 input dots', 'var(--second)'], ['setup.sh · run.sh', 'var(--main)'], ['geometry.ply', 'var(--main)'], ['finalize', 'var(--accent)'], ['textured OBJ + metrics', 'var(--accent)'], ['viewer · report · slides', 'var(--second)']];
const FX = 1330, FY0 = 236, FH = 74, FW = 480;
kit.scene('c-title', {
  init(kit) {
    let fl = ''; FLOW.forEach(([s, col], i) => { fl += '<p class="box c-title-f" style="left:' + FX + 'px;top:' + (FY0 + i * (FH + 34)) + 'px;width:' + FW + 'px;height:' + FH + 'px;padding:0;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:24px;color:' + col + '">' + s + '</p>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words" style="left:110px;top:250px;width:1100px;gap:22px">' +
      '<span class="tag">CV802 · How it all runs</span>' +
      '<h1 class="line big">The code pipeline</h1>' +
      '<p class="sub c-title-sub">from one point cloud to 113 finished, checked runs</p>' +
      '<p class="note warm c-title-n" style="margin-top:26px">Part 1: one run, from start to finish</p></div>' + fl +
      '<p class="cap">Eight methods, three inputs, 113 finished runs. None of it was run by hand: one pipeline of scripts did all of it.</p>' +
      '<p class="cap">Part 1 follows a single run, from the input dots to a finished, checked mesh. Part 2 runs everything.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.sub = q('.c-title-sub')[0].style; this.n = q('.c-title-n')[0].style; this.f = q('.c-title-f'); this.caps = q('.cap');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, -0.8);
    this.sub.opacity = eo(seg(t, -0.3, 0.3)); this.n.opacity = eo(seg(t, 1.4, 2.0));
    PS.caps(this.caps, [0.3, 4.4], t);
    this.f.forEach((el, i) => { const p = eo(seg(t, -0.4 + 0.45 * i, 0.1 + 0.45 * i)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 14 + 'px)'; });
    const ctx = this.k.fx, c = this.c;
    for (let i = 0; i < FLOW.length - 1; i++) { const p = eio(seg(t, 0.0 + 0.45 * i, 0.4 + 0.45 * i)); if (p <= 0) continue; const y0 = FY0 + i * (FH + 34) + FH + 4, y1 = y0 + 26; PS.arrow(ctx, FX + FW / 2, y0, FX + FW / 2, lerp(y0, y1, p), c.a, 3, 11); }
  },
});
