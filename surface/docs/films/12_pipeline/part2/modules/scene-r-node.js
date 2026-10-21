const { seg, eo, eio, lerp, TextFx } = kit;
const LB = [110, 300, 600, 340], NB = [1210, 300, 600, 340];
kit.scene('r-node', {
  init(kit) {
    const box = (b, cls, title, items, warmLast) => '<div class="box ' + cls + '" style="left:' + b[0] + 'px;top:' + b[1] + 'px;width:' + b[2] + 'px;height:' + b[3] + 'px;padding:26px 30px' + (warmLast ? '' : ';border-color:var(--main)') + '"><p style="margin:0;font-family:var(--display);font-size:44px">' + title + '</p>' +
      items.map((s, i) => '<p class="' + cls + '-i" style="margin:' + (i ? 12 : 22) + 'px 0 0;font-size:27px;color:' + (warmLast && i === items.length - 1 ? 'var(--accent)' : 'var(--second)') + '">' + s + '</p>').join('') + '</div>';
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Running it · The cluster</span><h2 class="line">Never on the login node</h2></div>' +
      box(LB, 'r-node-l', 'login node', ['shared by everyone', 'edit files, git, read logs', 'never Python or GPU work'], true) +
      box(NB, 'r-node-n', 'our allocation', ['one node: 12 CPUs, 32 GB', 'one RTX 5000 Ada GPU, 32 GB', 'reserved once with salloc'], false) +
      '<div class="words r-node-a" style="left:730px;top:400px;width:460px;align-items:center"><p class="note warm" style="font-size:26px">node_run.sh</p></div>' +
      '<div class="words r-node-a" style="left:730px;top:500px;width:460px;align-items:center"><p class="note" style="font-size:22px;color:var(--second)">srun --overlap</p></div>' +
      '<p class="box r-node-c" style="left:110px;top:700px;width:1700px;font-family:var(--mono);font-size:26px;color:var(--main)">$ surface/scripts/node_run.sh \'bash surface/scripts/queue.sh\'</p>' +
      '<p class="note r-node-x" style="left:110px;top:808px;font-size:24px;color:var(--second)">no allocation running?  node_run.sh stops with an error instead of running anything</p>' +
      '<p class="cap">A cluster has a login node that everyone shares. The rule is strict: never compute there; only edit files, use git and read logs.</p>' +
      '<p class="cap">The work runs on our own allocation, reserved once: one node with 12 CPUs, 32 GB of memory and one RTX 5000 Ada GPU.</p>' +
      '<p class="cap">node_run.sh sends any command there through srun, and refuses to run at all if the allocation is not up. Nothing lands on the login node by mistake.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.k = kit; this.c = PS.col(kit); this.line = kit.stage.querySelector('.line'); this.caps = q('.cap');
    this.l = q('.r-node-l')[0].style; this.n = q('.r-node-n')[0].style; this.li = q('.r-node-l-i'); this.ni = q('.r-node-n-i'); this.a = q('.r-node-a'); this.cmd = q('.r-node-c')[0].style; this.x = q('.r-node-x')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 8.0, 15.6], t);
    const sh = (st, a) => { const p = eo(seg(t, a, a + 0.5)); st.opacity = p; st.transform = 'translateY(' + (1 - p) * 14 + 'px)'; };
    sh(this.l, 0.5); this.li.forEach((el, i) => el.style.opacity = eo(seg(t, 1.2 + 0.7 * i, 1.7 + 0.7 * i)));
    sh(this.n, 8.2); this.ni.forEach((el, i) => el.style.opacity = eo(seg(t, 8.8 + 0.7 * i, 9.3 + 0.7 * i)));
    this.a.forEach(el => el.style.opacity = eo(seg(t, 16.0, 16.5))); sh(this.cmd, 16.8); this.x.opacity = eo(seg(t, 18.6, 19.1));
    const p = eio(seg(t, 15.8, 16.8)); if (p > 0) PS.arrow(this.k.fx, LB[0] + LB[2] + 16, 470, lerp(LB[0] + LB[2] + 16, NB[0] - 16, p), 470, this.c.a, 4, 16);
  },
});
