// Round composition. Each group: [type, count, spacing(s), startDelay(s), flags]
// flags: 'c' = camo, 'f' = fortified. Codes: p=pip g=grumble c=chomper
// d=dasher z=zoomer r=rascal j=jailbird h=hulk b=brute t=tincan M=mega T=titan Z=zeppelin
(function () {
  const CODES = { p: 'pip', g: 'grumble', c: 'chomper', d: 'dasher', z: 'zoomer', r: 'rascal', j: 'jailbird', h: 'hulk', b: 'brute', t: 'tincan', M: 'mega', T: 'titan', Z: 'zeppelin' };

  // compact notation: "c30@.55+4cf" => 30 chompers, 0.55s apart, start at 4s, camo+fortified
  const R = [
    null,
    'p20@.75',
    'p35@.55',
    'p25@.6 g5@.8+10',
    'p35@.45 g18@.6+4',
    'p5@1 g27@.55+2',
    'p15@.6 g15@.6+3 c4@1+9',
    'p20@.5 g20@.6+2 c5@1+10',
    'p10@.6 g20@.5+3 c14@.6+8',
    'c30@.55',
    'g102@.18',
    'p10@.5 g10@.5+3 c12@.6+5 d3@1.2+11',
    'g15@.5 c10@.6+4 d5@.9+9',
    'g50@.3 c23@.45+6',
    'p49@.25 g15@.4+6 c10@.5+10 d9@.6+14',
    'p20@.4 c15@.5+4 d12@.6+9 z5@1+15',
    'c20@.4 d8@.6+6',
    'd12@.5',
    'c80@.18',
    'c10@.5 d4@.6+3 z7@.6+6 d5@.5+11',
    'r6@1.4',
    'd40@.3 z14@.5+6',
    'r16@.7',
    'r7@.9 r7@.9+3 z10@.5+6',
    'c20@.4 c2@1+9c',
    'd31@.35 z10@.6+6',
    'j23@.8 z4@1+10',
    'p100@.1 g60@.12+3 c45@.15+7 d45@.2+12',
    't6@1.5',
    'd65@.2 z20@.3+8',
    't9@1',
    'j8@1 r10@.8+4',
    'r25@.4 r28@.4+6 z8@.6+12',
    'd20@.4c p13@.4+5',
    'd160@.08 j6@1+10',
    'z35@.25 r30@.35+4 h5@1.5+12',
    'z140@.1',
    'r25@.35 j25@.4+6 r15@.5+12c',
    'h17@.6 b10@.9+6 t4@1+14',
    'r10@.5 j10@.5+3 h20@.5+7 b18@.6+13',
    'M1@1 b4@1.5+3',
    'r60@.2 b7@1+8',
    'h10@.6 M2@6+4',
    'h28@.4 b15@.6+8',
    'j50@.2 b10@.8+6',
    'z120@.08 b20@.6+8 t10@.8+14c',
    'M1@1 b16@.6+3c',
    'z70@.1c b12@.8+6',
    'z120@.08 h50@.2+8',
    'c343@.03 h41@.2+6 b29@.4+12',
    'b20@.4 M8@2.2+6',
    'h15@.4c b10@.6+4f',
    'M10@2 b25@.4+5',
    'z80@.08c M3@3+5',
    'b35@.3 M6@2.5+6',
    'M10@1.8 b45@.3+4',
    'h40@.2c M8@2+4',
    'b40@.3 M12@1.6+6',
    'b50@.25f M13@1.6+6',
    'b80@.15 M6@2+8',
    'T1@1 M4@3+6',
    'b25@.3c M16@1.1+4',
    'h120@.1 M18@1+6',
    'b120@.1 t75@.1+6',
    'M9@1.5f b30@.3+3',
    'T3@4 M20@1+6',
    'M22@1 b30@.3+6f',
    'b50@.2f M15@1+6',
    'T4@3 M10@1.2+6',
    't150@.06cf b40@.2+10',
    'h200@.04 M12@1+8',
    'T6@2.5 b60@.15+4',
    'M40@.6',
    'b100@.1cf T4@3+8',
    'T8@2 M20@.8+6',
    'T10@1.6 M30@.6+4',
    'b200@.06c T6@2+10',
    'T12@1.4 M30@.5+4',
    'Z1@1 T6@2+8',
    'T20@1 M40@.4+6f',
    'Z2@8 T10@1.5+10',
  ];

  function parse(str) {
    return str.split(/\s+/).filter(Boolean).map((tok) => {
      const m = tok.match(/^([a-zA-Z])(\d+)@([\d.]+)(?:\+([\d.]+))?([cf]*)$/);
      if (!m) throw new Error('bad round token ' + tok);
      return { type: CODES[m[1]], count: +m[2], spacing: +m[3], delay: +(m[4] || 0), camo: m[5].includes('c'), fort: m[5].includes('f') };
    });
  }

  // Freeplay beyond the authored rounds: escalating mixes of giants.
  function freeplay(n) {
    const k = n - 80;
    const groups = [];
    const fort = k > 6;
    groups.push({ type: 'brute', count: 40 + k * 6, spacing: 0.08, delay: 0, camo: k % 3 === 0, fort });
    groups.push({ type: 'mega', count: 10 + k * 2, spacing: 0.5, delay: 3, camo: false, fort });
    groups.push({ type: 'titan', count: 4 + Math.floor(k * 0.8), spacing: 1.2, delay: 6, camo: false, fort: k > 3 });
    if (k >= 2) groups.push({ type: 'zeppelin', count: 1 + Math.floor(k / 3), spacing: 4, delay: 10, camo: false, fort: k > 8 });
    if (k % 4 === 0) groups.push({ type: 'tincan', count: 60 + k * 5, spacing: 0.05, delay: 2, camo: true, fort: true });
    return groups;
  }

  MT.Rounds = {
    get(n) {
      if (n < R.length) return parse(R[n]);
      return freeplay(n);
    },
    // flattened, time-sorted spawn list
    spawns(n) {
      const list = [];
      this.get(n).forEach((g) => {
        for (let i = 0; i < g.count; i++) list.push({ t: g.delay + i * g.spacing, type: g.type, camo: g.camo, fort: g.fort });
      });
      list.sort((a, b) => a.t - b.t);
      return list;
    },
    // Speed / health ramp in freeplay (like BTD6 after round 80)
    scaling(n) {
      if (n <= 80) return { speed: 1, hp: 1 };
      const k = n - 80;
      return { speed: 1 + Math.min(1.5, k * 0.02), hp: 1 + k * 0.05 + (n > 100 ? (n - 100) * 0.1 : 0) };
    },
    // cash per pop multiplier (BTD6 style income falloff)
    cashMul(n) {
      if (n > 120) return 0.02;
      if (n > 100) return 0.05;
      if (n > 85) return 0.1;
      if (n > 60) return 0.2;
      if (n > 50) return 0.5;
      return 1;
    },
    // what to announce at the start of a round
    headline(n) {
      const g = this.get(n);
      const types = g.map((x) => x.type);
      if (types.includes('zeppelin')) return 'PX-41 ZEPPELIN INCOMING!';
      if (types.includes('titan')) return 'A PURPLE TITAN APPROACHES!';
      if (types.includes('mega')) return n === 40 ? 'MEGA MUTANT INCOMING!' : null;
      if (g.some((x) => x.camo) && n <= 40) return 'CAMO MUTANTS! You need detection.';
      if (types.includes('tincan') && n <= 30) return 'ARMORED TIN CANS! Bananas bounce off.';
      if (types.includes('brute') && n <= 38) return 'BARREL BRUTES!';
      return null;
    },
    authored: R.length - 1,
  };
})();
