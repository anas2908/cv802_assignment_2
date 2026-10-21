kit.score(function (S, T) {
  S.tempo(80, { t0: 0 });
  S.program('pad', 'pad', { rev: 0.7, gain: -4 });
  S.program('pluck', 'pluck', { rev: 0.5, gain: -9, pan: 0.2 });
  S.program('bass', 'bass', { gain: -10 });
  const ids = ['title', 'dots', 'grid', 'normals', 'pca', 'orient', 'splat', 'solve', 'screen', 'extract', 'trim', 'recap'];
  const ch = [['D3', 'A3', 'D4', 'F#4'], ['B2', 'F#3', 'B3', 'D4'], ['G2', 'D3', 'G3', 'B3'], ['A2', 'E3', 'A3', 'C#4'], ['D3', 'A3', 'D4', 'F#4'], ['F#2', 'C#3', 'F#3', 'A3'], ['G2', 'D3', 'G3', 'B3'], ['E2', 'B2', 'E3', 'G3'], ['A2', 'E3', 'A3', 'C#4'], ['B2', 'F#3', 'B3', 'D4'], ['G2', 'D3', 'G3', 'B3'], ['D3', 'A3', 'D4', 'F#4']];
  const oct = (p, d) => p.replace(/\d/, m => String(+m + d));
  ids.forEach((id, i) => {
    const t0 = T[id], t1 = i < ids.length - 1 ? T[ids[i + 1]] : T.END;
    S.chord('pad', ch[i], { t: t0, dur: t1 - t0 + 0.4, vel: i === 0 ? 34 : 40 });
    S.note('bass', oct(ch[i][0], -1), { t: t0, dur: t1 - t0, vel: 46 });
    if (i > 0 && i < ids.length - 1) {
      const arp = [ch[i][1], ch[i][2], ch[i][3], ch[i][2]].map(p => oct(p, 1));
      for (let k = 0; t0 + 0.5 + k * 0.75 < t1 - 0.4; k++) S.note('pluck', arp[k % 4], { t: t0 + 0.5 + k * 0.75, dur: 0.6, vel: k % 4 === 0 ? 40 : 32 });
      S.fx('whoosh', Math.max(0, t0 - 0.25), { dur: 0.5, vel: 26 });
    }
  });
  S.fx('sparkle', 0.1, { vel: 36 });
  S.fx('revswell', T.recap, { dur: 1.2, vel: 36 });
  S.fx('ding', T.recap + 2.4, { vel: 50 });
  S.chord('pad', ['D4', 'F#4', 'A4', 'D5'], { t: T.recap + 2.4, dur: 3.6, vel: 46 });
  S.master({ gain: -8, fadeOut: 2 });
});