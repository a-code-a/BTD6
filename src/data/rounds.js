// Round composition. Each group: [type, count, spacing(s), startDelay(s), flags]
// flags: 'c' = camo, 'f' = fortified, 'r' = regrow. Codes: p=pip g=grumble c=chomper
// d=dasher z=zoomer r=rascal j=jailbird h=hulk b=brute t=tincan M=mega T=titan Z=zeppelin
// P=phantom X=mecha G=goo E=El Macho (final boss)
// a=glider (flying) J=jetpack (flying) m=mole (burrows) s=shield carrier
// u=rubber (energy immune) l=magma (fire + ice immune) N=medic (heals) R=rage (speeds up)
// enemy heroes (the Boss Battle villains): V=Vector K=Bratt S=Scarlet (flying) L=Maxime
(function () {
  const CODES = { p: 'pip', g: 'grumble', c: 'chomper', d: 'dasher', z: 'zoomer', r: 'rascal', j: 'jailbird', h: 'hulk', b: 'brute', t: 'tincan', M: 'mega', T: 'titan', Z: 'zeppelin', P: 'phantom', X: 'mecha', G: 'goo', E: 'macho', a: 'glider', J: 'jetpack', m: 'mole', s: 'shield', V: 'vector', K: 'bratt', S: 'scarlet', L: 'maxime', u: 'rubber', l: 'magma', N: 'healer', R: 'rage' };

  // compact notation: "c30@.55+4cf" => 30 chompers, 0.55s apart, start at 4s, camo+fortified
  // (an "r" at the end makes them regrow)
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
    'p20@.4 c15@.5+4 d12@.6+9 z5@1+15 a6@.9+17',
    'c20@.4 d8@.6+6',
    'd12@.5 g10@.4+6r',
    'c80@.18 a12@.5+8',
    'c10@.5 d4@.6+3 z7@.6+6 d5@.5+11',
    'r6@1.4',
    'd40@.3 z14@.5+6 m4@1.4+10',
    'r16@.7',
    'r7@.9 r7@.9+3 z10@.5+6',
    'c20@.4 c2@1+9c z6@.6+4r',
    'd31@.35 z10@.6+6',
    'j23@.8 z4@1+10 m8@.9+6',
    'p100@.1 g60@.12+3 c45@.15+7 d45@.2+12',
    't6@1.5 s2@3+3',
    'd65@.2 z20@.3+8 u6@.8+10',
    't9@1 a20@.3+4',
    'j8@1 r10@.8+4 J3@2+8',
    'r25@.4 r28@.4+6 z8@.6+12 r8@.6+6r',
    'd20@.4c p13@.4+5 m10@.6+8 u10@.6+3',
    'd160@.08 j6@1+10',
    'z35@.25 r30@.35+4 h5@1.5+12 s4@2+6',
    'z140@.1 l4@1.2+4',
    'r25@.35 j25@.4+6 r15@.5+12c J6@1.2+10',
    'h17@.6 b10@.9+6 t4@1+14 N3@2+5',
    'r10@.5 j10@.5+3 h20@.5+7 b18@.6+13 s6@1.2+8 m12@.5+4 R3@2+9',
    'M1@1 b4@1.5+3',
    'r60@.2r b7@1+8 l6@.8+4',
    'h10@.6 M2@6+4 J10@.8+6',
    'h28@.4 b15@.6+8 R6@1+5',
    'j50@.2 b10@.8+6 s8@1+10',
    'z120@.08 b20@.6+8 t10@.8+14c V1@1+4',
    'M1@1 b16@.6+3c m20@.4+6',
    'z70@.1c b12@.8+6 u30@.15+3c',
    'z120@.08 h50@.2+8 J16@.6+4 a40@.15+8',
    'c343@.03 h41@.2+6 b29@.4+12 N6@1.5+8',
    'b30@.3 M10@2+6 T1@1+20',
    'h15@.4c b10@.6+4f',
    'M10@2 b25@.4+5 s12@.8+4f S1@1+6',
    'z80@.08c M3@3+5 l20@.4+3r',
    'b35@.3 M6@2.5+6',
    'M10@1.8 b45@.3+4 J24@.4+6 T2@5+12 R12@.6+5f',
    'h40@.2c M8@2+4 P1@2+12',
    'b40@.3 M12@1.6+6 P1@1+14',
    'b50@.25f M13@1.6+6 m30@.3+8f h40@.2+2r',
    'b80@.15 M6@2+8 T2@4+10',
    'T2@3 M8@1.5+6 X1@1+14 K1@1+20',
    'b25@.3c M16@1.1+4',
    'h120@.1 M18@1+6 s20@.5+6 J20@.5+10',
    'b120@.1 t75@.1+6 X1@1+12 N10@.9+6f',
    'M9@1.5f b30@.3+3 X1@1+10',
    'T3@4 M20@1+6',
    'M22@1 b30@.3+6f G1@1+12 J30@.3+4f V1@1+16 u60@.1+4 l40@.15+8',
    'b50@.2f M15@1+6',
    'T4@3 M10@1.2+6 P2@4+12',
    't150@.06cf b40@.2+10 T3@3+12f',
    'h200@.04 M12@1+8 X2@5+10 s30@.3+8f R30@.3+6f',
    'T6@2.5 b60@.15+4',
    'M40@.6 G2@5+12 S1@1+8 K1@1+20',
    'b100@.1cf T4@3+8',
    'T8@2 M20@.8+6 P4@3+10 m60@.15+4f J30@.3+8f N20@.5+4f',
    'T10@1.6 M30@.6+4 Z1@1+20',
    'b200@.06c T6@2+10 X3@4+14',
    'T12@1.4 M30@.5+4 G2@6+12 l60@.1+6fr',
    'Z1@1 T6@2+8 P4@2+10 a120@.05+2 J40@.25+8f V1@1+14',
    'T20@1 M40@.4+6f X2@4+10 G2@6+14',
    'Z2@8 T10@1.5+10 E1@1+22',
  ];

  function parse(str) {
    return str.split(/\s+/).filter(Boolean).map((tok) => {
      const m = tok.match(/^([a-zA-Z])(\d+)@([\d.]+)(?:\+([\d.]+))?([cfr]*)$/);
      if (!m) throw new Error('bad round token ' + tok);
      return { type: CODES[m[1]], count: +m[2], spacing: +m[3], delay: +(m[4] || 0), camo: m[5].includes('c'), fort: m[5].includes('f'), regrow: m[5].includes('r') };
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
    // endgame monsters join the freeplay waves
    groups.push({ type: 'mecha', count: 1 + Math.floor(k / 2), spacing: 3, delay: 8, camo: false, fort: k > 10 });
    if (k >= 2 && k % 2 === 0) groups.push({ type: 'phantom', count: 2 + Math.floor(k / 4), spacing: 2.5, delay: 5, camo: true, fort: k > 14 });
    if (k >= 3) groups.push({ type: 'goo', count: 1 + Math.floor(k / 3), spacing: 4, delay: 12, camo: false, fort: k > 12 });
    // the tactical mutants keep coming too
    groups.push({ type: 'jetpack', count: 20 + k * 3, spacing: 0.2, delay: 4, camo: k % 5 === 0, fort: k > 4 });
    groups.push({ type: 'shield', count: 10 + k * 2, spacing: 0.3, delay: 1, camo: false, fort: k > 2 });
    if (k % 2 === 1) groups.push({ type: 'mole', count: 40 + k * 4, spacing: 0.1, delay: 2, camo: k % 3 === 1, fort: true });
    // immune, healing and raging mutants, some of them regrowing
    groups.push({ type: k % 2 ? 'rubber' : 'magma', count: 50 + k * 5, spacing: 0.06, delay: 3, camo: k % 4 === 2, fort: k > 5, regrow: k % 3 === 2 });
    groups.push({ type: 'rage', count: 12 + k * 2, spacing: 0.25, delay: 5, camo: false, fort: true });
    if (k % 2 === 0) groups.push({ type: 'healer', count: 8 + k, spacing: 0.5, delay: 7, camo: false, fort: k > 3 });
    if (k % 10 === 0) groups.push({ type: 'macho', count: Math.max(1, Math.floor(k / 10)), spacing: 18, delay: 16, camo: false, fort: k >= 30 });
    // the enemy heroes keep coming back, more of them the longer you survive
    if (k % 3 === 0) {
      const n = 1 + Math.floor(k / 15);
      for (let i = 0; i < n; i++) groups.push({ type: VILLAINS[(k / 3 + i) % VILLAINS.length], count: 1, spacing: 1, delay: 6 + i * 8, camo: false, fort: false });
    }
    return groups;
  }

  // enemy heroes: the Boss Battle villains also invade classic games
  const VILLAINS = ['vector', 'bratt', 'scarlet', 'maxime'];
  const HERO_TIP = { vector: 'His squids ink your towers!', bratt: 'His gum bombs trap your towers!', scarlet: 'She flies: only anti-air can hurt her!', maxime: 'His Roach Ray turns towers into cockroaches!' };

  MT.Rounds = {
    get(n) {
      const groups = n < R.length ? parse(R[n]) : freeplay(n);
      // an enemy hero gets tougher the later it shows up, and walks faster
      // than in its own boss battle so a round doesn't drag on
      groups.forEach((g) => {
        if (MT.ENEMIES[g.type].bossFight) Object.assign(g, { hpMul: Math.max(1, n / 30), speedMul: 2.5 });
      });
      return groups;
    },
    // flattened, time-sorted spawn list
    spawns(n) {
      return this.flatten(this.get(n));
    },
    flatten(groups) {
      const list = [];
      groups.forEach((g) => {
        for (let i = 0; i < g.count; i++) list.push({ t: g.delay + i * g.spacing, type: g.type, camo: g.camo, fort: g.fort, regrow: g.regrow, hpMul: g.hpMul, speedMul: g.speedMul });
      });
      list.sort((a, b) => a.t - b.t);
      return list;
    },
    // escort waves in a boss battle: every kind of mutant, getting tougher
    bossWave(n, tier) {
      const k = n + (tier === 'elite' ? 8 : 0);
      const G = (type, count, spacing, delay, camo, fort) => ({ type, count, spacing, delay, camo: !!camo, fort: !!fort });
      const g = [G(k < 8 ? 'rascal' : k < 14 ? 'jailbird' : 'hulk', 3 + k, 0.5, 0, k >= 11 && k % 4 === 3)];
      if (k % 2 === 0) g.push(G(k < 8 ? 'glider' : 'jetpack', 2 + Math.floor(k / 3), 0.6, 2, false, k > 14));
      if (k % 3 === 0) g.push(G('mole', 2 + Math.floor(k / 3), 0.7, 3, false, k > 9));
      if (k % 4 === 1 && k > 1) g.push(G('shield', 1 + Math.floor(k / 5), 1.5, 4, false, k > 12));
      if (k >= 7 && k % 2 === 1) g.push(G('brute', Math.floor(k / 3), 0.8, 5, k % 5 === 0, k > 10));
      if (k >= 8 && k % 4 === 3) g.push(G('tincan', 3 + Math.floor(k / 3), 0.4, 1, false, k > 12));
      if (k >= 12 && k % 3 === 1) g.push(G('mega', 1 + Math.floor((k - 12) / 4), 3, 6, false, k > 18));
      return g;
    },
    // Late-game ramp so maxed and fused towers still meet a challenge: giants
    // and Barrel Brutes get +5% health per round after round 40 (2x at round 60,
    // 3x at 80) and everything gets up to 20% faster from round 60 on. Freeplay
    // keeps climbing much faster from there.
    scaling(n) {
      if (n <= 40) return { speed: 1, hp: 1 };
      if (n <= 80) return { speed: 1 + Math.max(0, n - 60) * 0.01, hp: 1 + (n - 40) * 0.05 };
      const k = n - 80;
      return { speed: 1.2 + Math.min(1.3, k * 0.03), hp: 3 * (1 + k * 0.2) + (n > 100 ? (n - 100) * 0.6 : 0) };
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
      if (types.includes('macho')) return 'FINAL BOSS: MUTANT EL MACHO!';
      const heroes = [...new Set(types.filter((t) => MT.ENEMIES[t].bossFight))];
      if (heroes.length > 1) return 'THE VILLAINS TEAM UP! Spread out your towers.';
      if (heroes.length) return `ENEMY HERO: ${MT.ENEMIES[heroes[0]].name.toUpperCase()}! ${HERO_TIP[heroes[0]]}`;
      if (types.includes('mecha') && n <= 80) return 'MECHA MUTANTS! Their EMP shuts down towers.';
      if (types.includes('goo') && n <= 80) return 'GOO BEHEMOTH! It regenerates, burst it fast!';
      if (types.includes('phantom') && n <= 80) return 'PHANTOM MUTANTS! Camo giants that teleport.';
      if (types.includes('zeppelin')) return 'PX-41 ZEPPELIN INCOMING!';
      if (types.includes('titan')) return 'A PURPLE TITAN APPROACHES!';
      if (types.includes('mega')) return n === 40 ? 'MEGA MUTANT INCOMING!' : null;
      if (types.includes('glider') && n <= 18) return 'FLYING MUTANTS! Only anti-air can hit them: heroes, Sniper, Tesla, Pilot...';
      if (types.includes('mole') && n <= 26) return 'MOLE MUTANTS dig under the track! Sonar pings drag them up.';
      if (types.includes('shield') && n <= 35) return 'SHIELD CARRIERS protect their friends. Pop the carrier first!';
      if (types.includes('jetpack') && n <= 37) return 'JETPACK MUTANTS! Big flyers full of Gliders.';
      if (types.includes('rubber') && n <= 33) return 'RUBBER MUTANTS! Lasers and lightning bounce right off.';
      if (types.includes('magma') && n <= 41) return 'MAGMA MUTANTS! Fire and ice do nothing to them.';
      if (types.includes('healer') && n <= 49) return 'MEDIC MUTANTS heal the giants and brutes around them. Pop them first!';
      if (types.includes('rage') && n <= 43) return 'RAGE MUTANTS get faster with every hit. Hit them hard!';
      if (g.some((x) => x.regrow) && n <= 24) return 'REGROW MUTANTS grow back if you leave them alone!';
      if (g.some((x) => x.camo) && n <= 40) return 'CAMO MUTANTS! You need detection.';
      if (types.includes('tincan') && n <= 30) return 'ARMORED TIN CANS! Bananas bounce off.';
      if (types.includes('brute') && n <= 38) return 'BARREL BRUTES!';
      return null;
    },
    authored: R.length - 1,
  };
})();
