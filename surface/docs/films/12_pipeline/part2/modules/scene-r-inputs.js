const { seg, eo, eio, lerp, TextFx } = kit;
const SW = ['export CV802_SP2_INPUT_PLY=…/inputs/light_shirt_mvs_e10_clean.ply', 'export CV802_SP2_OUTPUTS=…/outputs_mvs_clean', 'export CV802_SP2_FRONT_FLIP=0', 'export CV802_SP2_DATASET_LABEL="MVS point cloud, outlier-cleaned …"'];
const CARDS = [['VGGSfM', '138,677 dots', 'mask-cleaned VGGSfM, the main input', 58], ['MVS', '487,451 dots', 'COLMAP stereo, with its own normals', 27], ['MVS, cleaned', '487,047 dots', 'the same, 404 floaters removed', 28]];
const CX = [110, 700, 1290], CW = 520, CT = 470, CHh = 330;
kit.scene('r-inputs', {
  init(kit) {
    let sw = ''; SW.forEach((s, i) => { sw += '<p class="note r-in-s" style="left:30px;top:' + (20 + i * 38) + 'px;font-size:21px;color:' + (i === 2 ? 'var(--second)' : 'var(--main)') + '">' + s + '</p>'; });
    let cards = ''; CARDS.forEach(([a, b, c2, n], i) => { cards += '<div class="box r-in-c" style="left:' + CX[i] + 'px;top:' + CT + 'px;width:' + CW + 'px;height:' + CHh + 'px;padding:24px 28px"><p style="margin:0;font-family:var(--display);font-size:42px">' + a + '</p><p style="margin:10px 0 0;font-family:var(--mono);font-size:24px;color:var(--main)">' + b + '</p><p style="margin:10px 0 0;font-size:24px;color:var(--second)">' + c2 + '</p><p class="r-in-n" style="margin:26px 0 0;font-family:var(--display);font-size:64px;color:var(--accent)">' + n + ' runs</p></div>'; });
    kit.stage.append(kit.h('<div class="ground"><div class="words head"><span class="tag">Running it · Three inputs</span><h2 class="line">Three inputs, one pipeline</h2></div>' +
      '<div class="box r-in-b" style="left:110px;top:236px;width:1700px;height:190px;padding:0">' + sw + '</div>' +
      '<p class="note r-in-x" style="left:1250px;top:250px;font-size:20px;color:var(--accent)">surface/scripts/dataset_mvs_clean.sh</p>' + cards +
      '<div class="words r-in-t" style="left:110px;top:840px;width:1700px;align-items:center"><p class="eq" style="font-size:42px">58 + 27 + 28 = <span style="color:var(--accent)">113 finished runs</span></p></div>' +
      '<p class="cap">Everything runs for three inputs: the VGGSfM dots, the MVS dots, and the MVS dots with their 404 floaters removed.</p>' +
      '<p class="cap">Switching input is one small file: which cloud to read, which folder to write into, and what to call it. The scripts stay the same.</p>' +
      '<p class="cap">Same scripts, same metrics, separate folders: 58 finished runs on VGGSfM, 27 on MVS and 28 on cleaned MVS. 113 in all.</p></div>'));
    const q = s => [...kit.stage.querySelectorAll(s)];
    this.line = kit.stage.querySelector('.line'); this.caps = q('.cap'); this.b = q('.r-in-b')[0].style; this.s = q('.r-in-s'); this.x = q('.r-in-x')[0].style; this.c = q('.r-in-c'); this.n = q('.r-in-n'); this.tt = q('.r-in-t')[0].style;
  },
  render(t) {
    TextFx.fadeFromRight(this.line, t, 0.0);
    PS.caps(this.caps, [0.3, 6.8, 13.4], t);
    this.c.forEach((el, i) => { const p = eo(seg(t, 0.6 + 0.6 * i, 1.1 + 0.6 * i)); el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * 16 + 'px)'; });
    this.n.forEach((el, i) => el.style.opacity = eo(seg(t, 13.8 + 0.5 * i, 14.3 + 0.5 * i)));
    this.b.opacity = eo(seg(t, 7.0, 7.5)); this.x.opacity = eo(seg(t, 7.2, 7.7)); this.s.forEach((el, i) => el.style.opacity = eo(seg(t, 7.6 + 0.5 * i, 8.1 + 0.5 * i)));
    this.tt.opacity = eo(seg(t, 15.8, 16.4));
  },
});
