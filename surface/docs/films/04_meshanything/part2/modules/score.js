kit.score(function (S, T) {
  S.tempo(80, { t0: 0 });
  S.program('pad', 'pad', { rev: 0.7, gain: -4 });
  S.program('pluck', 'pluck', { rev: 0.5, gain: -9, pan: 0.2 });
  S.program('bass', 'bass', { gain: -10 });
  const ids = ['b-train', 'b-domain', 'b-fix', 'b-table', 'b-lessons', 'b-compare', 'b-limits', 'b-recap'];
  const ch = [['A2', 'C4', 'E4', 'G4'], ['F2', 'A3', 'C4', 'E4'], ['C3', 'E4', 'G4', 'B4'], ['G2', 'B3', 'D4', 'F#4'], ['D3', 'F4', 'A4', 'C5'], ['A#2', 'D4', 'F4', 'A4'], ['F2', 'A3', 'C4', 'E4'], ['A2', 'C4', 'E4', 'A4']];
  const oct = (p, d) => p.replace(/\d/, m => String(+m + d));
  ids.forEach((id, i) => {
    const t0 = T[id], t1 = i < ids.length - 1 ? T[ids[i + 1]] : T.END;
    S.chord('pad', ch[i], { t: t0, dur: t1 - t0 + 0.4, vel: i === 0 ? 34 : 40 });
    S.note('bass', oct(ch[i][0], -1), { t: t0, dur: t1 - t0, vel: 46 });
    if (i > 0) {
      const arp = [ch[i][1], ch[i][2], ch[i][3], ch[i][2]].map(p => oct(p, 1));
      for (let k = 0; t0 + 0.5 + k * 0.75 < t1 - 0.4; k++) S.note('pluck', arp[k % 4], { t: t0 + 0.5 + k * 0.75, dur: 0.6, vel: k % 4 === 0 ? 38 : 30 });
      S.fx('whoosh', Math.max(0, t0 - 0.25), { dur: 0.5, vel: 24 });
    }
  });
  S.fx('sparkle', 0.1, { vel: 34 });
  S.fx('ding', T['b-fix'] + 15.0, { vel: 32 });
  S.fx('pop', T['b-table'] + 12.8, { vel: 32 });
  S.fx('chime', T['b-recap'] + 7.2, { vel: 34 });
  S.master({ gain: -8, fadeOut: 2 });
});