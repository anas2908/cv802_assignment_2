const { seg, eo, eio, lerp, TextFx } = kit;
// a shortened copy of surface/methods/sap/setup.sh
const LINES = [['# Shape As Points: official code, optimisation mode', 'var(--second)', 0.8], ['bash ../point2mesh/setup.sh   # environment, shared with Point2Mesh', 'var(--main)', 1.6],
  ['git clone github.com/autonomousvision/shape_as_points', 'var(--main)', 7.0], ['git checkout a094733       # one fixed version', 'var(--accent)', 7.8],
  ['uv pip install torch-scatter pykdtree plyfile …', 'var(--main)', 8.6], ['python -c "import torch, torch_scatter, pytorch3d"', 'var(--main)', 13.6], ['sap setup OK', 'var(--accent)', 14.6]];
const SIDE = [['an environment per method family', 'so their libraries never clash', 1.8], ['official code, fixed commit', 'the same code every time', 7.4], ['weights, if pretrained', 'downloaded once, then cached', 9.4], ['a quick self-test', 'fails early, not mid-run', 13.8]];
kit.scene('c-setup', {
  init(kit) {
    let term = ''; LINES.forEach(([s, col], i) => { term += '<p class="note c-set-l" style="left:34px;top:' + (30 + i * 62) + 'px;font-size:24px;color:' + col + '">' + s + '</p>'; });
    let side = ''; SIDE.forEach(([a, b]) => { side += '<div class="c-set-s"><p class="eq" style="position:static;font-size:36px">' + a + '</p><p class="note" style="position:static;margin-top:6px;color:var(--second)">' + b + '</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">The pipeline · setup.sh</span><h2 class="line">Setting up a method</h2></div>' +
      '<div class="box c-set-t" style="left:110px;top:240px;width:1060px;height:500px;padding:0">' + term + '</div>' +
      '<p class="note c-set-x" style="left:110px;top:770px;font-size:22px;color:var(--second)">a shortened copy of surface/methods/sap/setup.sh</p>' +
      '<div class="words" style="left:1240px;top:260px;width:600px;gap:34px">' + side + '</div>' +
      '<p class="cap">Before a method can run, its setup.sh prepares a Python environment for it, so different methods’ libraries never clash with each other.</p>' +
      '<p class="cap">It clones the authors’ official code at one fixed version, downloads the pretrained weights if the method has them, and caches it all.</p>' +
      '<p class="cap">Last, a quick test import, so a broken install fails at once, not an hour into a run. Running setup twice changes nothing.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.t = q('.c-set-t')[0].style; this.x = q('.c-set-x')[0].style; this.l = q('.c-set-l'); this.s = q('.c-set-s');
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.4], t);
    this.t.opacity = eo(seg(t, 0.3, 0.8)); this.x.opacity = eo(seg(t, 1.0, 1.5));
    this.l.forEach((el, i) => { const p = eo(seg(t, LINES[i][2], LINES[i][2] + 0.4)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 16 + 'px)'; });
    this.s.forEach((el, i) => { const p = eo(seg(t, SIDE[i][2], SIDE[i][2] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 24 + 'px)'; });
  },
});
