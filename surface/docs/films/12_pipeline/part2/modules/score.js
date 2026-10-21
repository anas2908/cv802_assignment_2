kit.score(function (S, T) {
  S.tempo(80, { t0: 0 });
  S.program('pad', 'pad', { rev: 0.7, gain: -4 });
  S.program('pluck', 'pluck', { rev: 0.5, gain: -9, pan: 0.2 });
  S.program('bass', 'bass', { gain: -10 });
  const ids = ['r-title', 'r-node', 'r-lock', 'r-queue', 'r-live', 'r-after', 'r-inputs', 'r-pack', 'r-docs', 'r-recap'];
  const ch = [['D3', 'F4', 'A4', 'C5'], ['A#2', 'D4', 'F4', 'A4'], ['F2', 'A3', 'C4', 'E4'], ['C3', 'E4', 'G4', 'B4'], ['G2', 'A#3', 'D4', 'F4'], ['A2', 'C4', 'E4', 'G4'], ['A#2', 'D4', 'F4', 'A4'], ['F2', 'A3', 'C4', 'E4'], ['G2', 'B3', 'D4', 'F4'], ['D3', 'F4', 'A4', 'D5']];
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
  S.fx('whoosh', T['r-node'] + 15.8, { dur: 1.0, vel: 20 }); S.fx('ding', T['r-node'] + 18.6, { vel: 26 });
  [3.0, 8.0, 13.0, 18.0].forEach(x => S.fx('pop', T['r-lock'] + x, { vel: 26 })); S.fx('chime', T['r-lock'] + 15.0, { vel: 26 });
  for (let k = 0; k < 8; k++) S.fx('pop', T['r-queue'] + 1.0 + 1.2 * k, { vel: k === 1 ? 32 : 20 });
  S.fx('ding', T['r-queue'] + 16.9, { vel: 28 }); S.fx('ding', T['r-queue'] + 18.6, { vel: 28 });
  S.fx('whoosh', T['r-live'] + 12.8, { dur: 0.8, vel: 18 }); S.fx('chime', T['r-live'] + 16.2, { vel: 28 });
  S.fx('pop', T['r-after'] + 2.0, { vel: 26 }); S.fx('pop', T['r-after'] + 7.0, { vel: 26 }); S.fx('pop', T['r-after'] + 8.4, { vel: 26 }); S.fx('ding', T['r-after'] + 16.6, { vel: 30 }); S.fx('ding', T['r-after'] + 20.4, { vel: 26 });
  S.fx('chime', T['r-inputs'] + 15.8, { vel: 32 });
  [14.8, 15.2, 15.6, 16.0].forEach(x => S.fx('pop', T['r-pack'] + x, { vel: 22 }));
  [7.0, 8.0, 9.0].forEach(x => S.fx('pop', T['r-docs'] + x, { vel: 24 })); S.fx('ding', T['r-docs'] + 13.8, { vel: 26 });
  S.fx('chime', T['r-recap'] + 3.2, { vel: 34 }); S.fx('sparkle', T['r-recap'] + 7.4, { vel: 30 });
  S.master({ gain: -8, fadeOut: 2 });
});
