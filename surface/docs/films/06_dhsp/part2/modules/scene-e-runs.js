const { seg, eo, lerp, TextFx } = kit;
const CX = [140, 640, 860, 1040, 1200, 1380], Y0 = 254, DY = 70;
const HEAD = ['run', 'triangles', 'F@1%', 'NC', 'closed', 'own colour'];
const ROWS = [['3D prior only', '16,000', '0.999', '0.65', 'yes', '–'], ['+ xatlas pieces, texture', '16,000', '0.999', '0.65', 'no', '15.3 dB'], ['rebuild + OptCuts: full recipe', '6,000', '0.874', '0.89', 'yes', '18.2 dB'], ['+ Laplacian smoothing', '6,000', '0.901', '0.89', 'yes', '18.5 dB']];
const RT = [1.2, 6.8, 12.8, 18.4];
kit.scene('e-runs', {
  init(kit) {
    let h = '<div class="ground"><div class="words head"><span class="tag">DHSP · Experiments</span><h2 class="line">Our runs</h2></div>' +
      '<div class="e-runs-best" style="position:absolute;left:118px;top:' + (Y0 + 4 * DY - 10) + 'px;width:1480px;height:54px;border-radius:10px;border:2px solid var(--accent);background:color-mix(in srgb, var(--accent) 12%, var(--ground))"></div>' +
      '<div class="e-runs-h">' + HEAD.map((s, j) => '<p class="note" style="left:' + CX[j] + 'px;top:' + Y0 + 'px;color:var(--accent)">' + s + '</p>').join('') + '</div>';
    ROWS.forEach((r, i) => { h += '<div class="e-runs-r">' + r.map((s, j) => '<p class="note' + (j ? ' num' : '') + '" style="left:' + CX[j] + 'px;top:' + (Y0 + (i + 1) * DY) + 'px;font-size:' + (j ? 28 : 26) + 'px;color:var(--second)">' + s + '</p>').join('') + '</div>'; });
    h += '<div class="words" style="left:140px;top:' + (Y0 + 5 * DY + 24) + 'px;width:1650px;gap:10px">' +
      '<p class="note e-runs-n">own colour: PSNR of DHSP’s texture against the dot colours, higher is better</p>' +
      '<p class="note e-runs-n">Laplacian: pulls every corner towards the average of its neighbours (weight 1)</p>' +
      '<p class="eq e-runs-e" style="font-size:42px;margin-top:10px">full recipe: smooth and coloured, but coarser (F 0.999 → 0.901)</p></div>' +
      '<p class="cap">Our four DHSP runs on the VGGSfM scan. The 3D prior alone is the most accurate, but crumpled and without colour.</p>' +
      '<p class="cap">With xatlas pieces, the texture prior smears across the seams: only 15.3 dB, and the mesh comes out cut along them.</p>' +
      '<p class="cap">Our rebuild lets the full recipe run: a smooth, closed mesh, coloured by DHSP itself.</p>' +
      '<p class="cap">A Laplacian smoothness term, pulling each corner towards its neighbours, lifts F-score at 1% to 0.901: our best DHSP run.</p></div>';
    kit.stage.append(kit.h(h));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.h = q('.e-runs-h')[0].style; this.r = q('.e-runs-r'); this.best = q('.e-runs-best')[0].style; this.n = q('.e-runs-n'); this.e = q('.e-runs-e')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.6, 12.6, 18.2], t);
    this.h.opacity = eo(seg(t, 0.6, 1.1));
    this.r.forEach((el, i) => { const p = eo(seg(t, RT[i], RT[i] + 0.5)); el.style.opacity = p; el.style.transform = 'translateX(' + (1 - p) * 26 + 'px)'; });
    const b = eo(seg(t, 19.2, 19.8)); this.best.opacity = b; this.best.transform = 'scaleX(' + lerp(0.96, 1, b) + ')';
    this.n.forEach((el, i) => el.style.opacity = eo(seg(t, i ? 18.8 : 7.4, (i ? 18.8 : 7.4) + 0.5)));
    this.e.opacity = eo(seg(t, 20.4, 21.0));
  },
});