kit.score(function (S, T) {
  S.tempo(80, { t0: 0 });
  S.program('pad', 'pad', { rev: 0.7, gain: -4 });
  S.program('pluck', 'pluck', { rev: 0.5, gain: -9, pan: 0.2 });
  S.program('bass', 'bass', { gain: -10 });
  const ids = ['c-title', 'c-map', 'c-contract', 'c-setup', 'c-prep', 'c-post', 'c-finalize', 'c-manifest', 'c-recap'];
  const ch = [['D3', 'F4', 'A4', 'C5'], ['A#2', 'D4', 'F4', 'A4'], ['F2', 'A3', 'C4', 'E4'], ['C3', 'E4', 'G4', 'B4'], ['G2', 'A#3', 'D4', 'F4'], ['A2', 'C4', 'E4', 'G4'], ['A#2', 'D4', 'F4', 'A4'], ['F2', 'A3', 'C4', 'E4'], ['D3', 'F4', 'A4', 'D5']];
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
  [0.6, 1.3, 2.0, 7.8, 8.5, 9.2].forEach(x => S.fx('pop', T['c-map'] + x, { vel: 24 }));
  S.fx('chime', T['c-map'] + 14.8, { vel: 28 });
  [7.8, 8.6, 9.4, 10.2, 14.8, 15.6, 16.4].forEach(x => S.fx('pop', T['c-contract'] + x, { vel: 24 })); S.fx('ding', T['c-contract'] + 17.2, { vel: 32 });
  [0.8, 1.6, 7.0, 7.8, 8.6, 13.6].forEach(x => S.fx('pop', T['c-setup'] + x, { vel: 22 })); S.fx('ding', T['c-setup'] + 14.6, { vel: 30 });
  const fps = []; for (let k = 0; k < 24; k++) fps.push(T['c-prep'] + 7.0 + k * 0.22); S.ticks(fps, { vel: 16 });
  S.fx('whoosh', T['c-prep'] + 13.4, { dur: 0.8, vel: 18 }); S.fx('chime', T['c-prep'] + 20.0, { vel: 28 });
  S.fx('whoosh', T['c-post'] + 7.4, { dur: 2.6, vel: 18 }); S.fx('ding', T['c-post'] + 10.6, { vel: 32 });
  [7.0, 8.8, 13.4, 19.8].forEach(x => S.fx('pop', T['c-finalize'] + x, { vel: 26 })); S.fx('chime', T['c-finalize'] + 22.6, { vel: 34 });
  S.fx('ding', T['c-manifest'] + 7.6, { vel: 28 });
  S.fx('chime', T['c-recap'] + 3.2, { vel: 34 });
  S.master({ gain: -8, fadeOut: 2 });
});
