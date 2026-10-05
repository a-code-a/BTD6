// Heroes. One hero per game, picked before the match. Heroes level up every
// round (or by paying bananas) and unlock two abilities each.
(function () {
  const P = (o) => Object.assign({ tex: 'p_banana', speed: 500, dmg: 1, pierce: 1, type: 'sharp', r: 6, spin: 0 }, o);
  const BUFF = (o) => Object.assign({ range: 0, rate: 0, pierce: 0, camo: false, armored: false, discount: 0 }, o);

  MT.HERO_XP = [0, 120, 300, 560, 900, 1350, 1950, 2700, 3700, 5000];

  MT.HEROES = {
    gru: {
      id: 'gru', name: 'Gru', title: 'Super-Villain Dad', cost: 540, key: 'H', size: 18, color: '#7fdbff',
      desc: 'Hero. Freeze ray that slows. Abilities: Shrink Ray and Moon Heist.',
      quotes: ['Lightbulb!', 'Minions, assemble!', 'Freeze ray: ready.'],
      base: { range: 140, rate: 0.6, attack: 'proj', proj: P({ tex: 'p_freezebolt', speed: 650, pierce: 3, type: 'normal', r: 7, slow: { mul: 0.75, dur: 1 } }) },
      levels: [
        null,
        { desc: 'Freeze ray: slows what it hits.' },
        { desc: '+15 range.', fx: (s) => { s.range += 15; } },
        { desc: 'Ability: SHRINK RAY shrinks every mutant on screen.', fx: (s) => { s.ability = 'shrinkRay'; } },
        { desc: '+2 pierce.', fx: (s) => { s.proj.pierce += 2; } },
        { desc: 'Bigger freeze ray: 33% faster.', fx: (s) => { s.rate *= 0.75; } },
        { desc: 'Camo detection, +1 damage.', fx: (s) => { s.camo = true; s.proj.dmg += 1; } },
        { desc: 'Freeze ray freezes small mutants briefly.', fx: (s) => { s.proj.freeze = { dur: 0.4 }; } },
        { desc: 'Minion towers near Gru attack 10% faster.', fx: (s) => { s.buff = BUFF({ rate: 0.1 }); s.buffRange = 160; } },
        { desc: '+1 damage, +15 range.', fx: (s) => { s.proj.dmg += 1; s.range += 15; } },
        { desc: 'Ability: MOON HEIST rams the moon into the biggest giant!', fx: (s) => { s.ability2 = 'moonHeist'; s.rate *= 0.8; } },
      ],
    },

    lucy: {
      id: 'lucy', name: 'Lucy Wilde', title: 'AVL Super Agent', cost: 600, key: 'H', size: 17, color: '#4dd0e1',
      desc: 'Hero. Rapid lipstick-taser shots that stun. Abilities: Lipstick Taser and AVL Airstrike.',
      quotes: ['Lipstick taser!', 'Agent Wilde, on it!', 'Bam! Gotcha!'],
      base: { range: 150, rate: 0.42, attack: 'proj', proj: P({ tex: 'p_lipstick', speed: 820, dmg: 1, pierce: 2, type: 'energy', r: 6 }) },
      levels: [
        null,
        { desc: 'Lipstick taser: fast energy shots that burn armor.' },
        { desc: '+1 pierce.', fx: (s) => { s.proj.pierce += 1; } },
        { desc: 'Ability: LIPSTICK TASER zaps and stuns every mutant near Lucy.', fx: (s) => { s.ability = 'lipstickTaser'; } },
        { desc: 'Shoots 20% faster.', fx: (s) => { s.rate *= 0.8; } },
        { desc: 'Camo detection, +20 range.', fx: (s) => { s.camo = true; s.range += 20; } },
        { desc: '+1 damage. Shots stun small mutants briefly.', fx: (s) => { s.proj.dmg += 1; s.proj.stun = { dur: 0.25 }; } },
        { desc: 'Twin tasers: 2 shots at once.', fx: (s) => { s.count = 2; s.spread = 7; } },
        { desc: '+5 damage to giants.', fx: (s) => { s.proj.moabDmg = 5; } },
        { desc: '+2 damage, 20% faster.', fx: (s) => { s.proj.dmg += 2; s.rate *= 0.8; } },
        { desc: 'Ability: AVL AIRSTRIKE carpet-bombs the entire track!', fx: (s) => { s.ability2 = 'airstrike'; s.proj.moabDmg += 5; } },
      ],
    },

    nefario: {
      id: 'nefario', name: 'Dr. Nefario', title: 'Mad Gadget Scientist', cost: 650, key: 'H', size: 18, color: '#9be15d',
      desc: 'Hero. Lobs goo bombs that splash and slow. Abilities: Fart Gun and Antidote Serum.',
      quotes: ['Fart gun? Ha ha!', 'I have a new gadget!', 'Where is my scooter?'],
      base: { range: 135, rate: 1.0, attack: 'proj', proj: P({ tex: 'p_goo', speed: 420, dmg: 0, pierce: 1, type: 'normal', r: 8, explode: { r: 40, dmg: 1, pierce: 12 }, slow: { mul: 0.7, dur: 1.5 } }) },
      levels: [
        null,
        { desc: 'Goo bombs: splash damage that slows.' },
        { desc: '+15 range.', fx: (s) => { s.range += 15; } },
        { desc: 'Ability: FART GUN blasts every mutant around Nefario.', fx: (s) => { s.ability = 'fartGun'; } },
        { desc: 'Bigger blasts.', fx: (s) => { s.proj.explode.r += 12; s.proj.explode.pierce += 8; } },
        { desc: 'Blasts deal 2 damage.', fx: (s) => { s.proj.explode.dmg = 2; } },
        { desc: 'Camo detection. Towers near Nefario get +10% range.', fx: (s) => { s.camo = true; s.buff = BUFF({ range: 0.1 }); s.buffRange = 150; } },
        { desc: 'Goo melts armor. Throws 25% faster.', fx: (s) => { s.proj.armored = true; s.rate *= 0.75; } },
        { desc: '+20 damage to giants.', fx: (s) => { s.proj.moabDmg = 20; } },
        { desc: '3 damage blasts that scatter mini goo bombs.', fx: (s) => { s.proj.explode.dmg = 3; s.proj.cluster = { n: 6, r: 26, dmg: 1, pierce: 8 }; } },
        { desc: 'Ability: ANTIDOTE SERUM cures every small mutant on screen!', fx: (s) => { s.ability2 = 'antidote'; s.rate *= 0.8; } },
      ],
    },

    kevin: {
      id: 'kevin', name: 'Kevin', title: 'Leader of the Minions', cost: 500, key: 'H', size: 17, color: '#ffd83a',
      desc: 'Hero. A tall minion with a banana blaster who inspires the troops. Abilities: Minion Stampede and GIANT KEVIN.',
      quotes: ['Bello! Kevin!', 'Bananaaa!', 'Kanpai!'],
      base: { range: 135, rate: 0.55, attack: 'proj', proj: P({ tex: 'p_banana', speed: 620, dmg: 1, pierce: 3, r: 7, spin: 16 }) },
      levels: [
        null,
        { desc: 'Banana blaster: each banana pops 3 mutants.' },
        { desc: '+1 pierce, +10 range.', fx: (s) => { s.proj.pierce += 1; s.range += 10; } },
        { desc: 'Ability: MINION STAMPEDE sends a horde of minions down the track.', fx: (s) => { s.ability = 'stampede'; } },
        { desc: 'Inspire: towers near Kevin attack 8% faster.', fx: (s) => { s.buff = BUFF({ rate: 0.08 }); s.buffRange = 150; } },
        { desc: 'Double banana shots.', fx: (s) => { s.count = 2; s.spread = 10; } },
        { desc: 'Camo detection, +1 damage.', fx: (s) => { s.camo = true; s.proj.dmg += 1; } },
        { desc: 'Inspire: 15% faster and +1 pierce for nearby towers.', fx: (s) => { s.buff.rate = 0.15; s.buff.pierce = 1; } },
        { desc: 'Triple banana shots, +6 damage to giants.', fx: (s) => { s.count = 3; s.spread = 12; s.proj.moabDmg = 6; } },
        { desc: '+2 damage, 20% faster.', fx: (s) => { s.proj.dmg += 2; s.rate *= 0.8; } },
        { desc: 'Ability: GIANT KEVIN! Kevin grows huge and stomps everything.', fx: (s) => { s.ability2 = 'giantKevin'; } },
      ],
    },

    vector: {
      id: 'vector', name: 'Vector', title: 'Squid-Launching Villain', cost: 700, key: 'H', size: 17, color: '#ff8a3a',
      desc: 'Hero. Fires sticky squids that slow mutants. Abilities: Piranha Frenzy and Pyramid Heist.',
      quotes: ['Oh yeah!', 'Squid launcher!', 'Direction AND magnitude!'],
      base: { range: 150, rate: 0.85, attack: 'proj', proj: P({ tex: 'p_squid', speed: 520, dmg: 1, pierce: 2, type: 'normal', r: 8, spin: 3, slow: { mul: 0.6, dur: 2.5 } }) },
      levels: [
        null,
        { desc: 'Squid launcher: sticky squids slow mutants.' },
        { desc: '+15 range.', fx: (s) => { s.range += 15; } },
        { desc: 'Ability: PIRANHA FRENZY sends piranhas to devour the strongest mutants.', fx: (s) => { s.ability = 'piranhaFrenzy'; } },
        { desc: 'Launches 25% faster.', fx: (s) => { s.rate *= 0.75; } },
        { desc: 'Squids burst into ink and splash nearby mutants.', fx: (s) => { s.proj.explode = { r: 34, dmg: 1, pierce: 8 }; } },
        { desc: 'Camo detection, +1 damage.', fx: (s) => { s.camo = true; s.proj.dmg += 1; if (s.proj.explode) s.proj.explode.dmg += 1; } },
        { desc: 'Squid ink corrodes armor.', fx: (s) => { s.proj.armored = true; } },
        { desc: 'Fires 3 squids at once.', fx: (s) => { s.count = 3; s.spread = 14; } },
        { desc: '+10 damage to giants, +1 damage.', fx: (s) => { s.proj.moabDmg = 10; if (s.proj.explode) s.proj.explode.dmg += 1; } },
        { desc: 'Ability: PYRAMID HEIST drops a stolen pyramid on the biggest giant!', fx: (s) => { s.ability2 = 'pyramidDrop'; s.rate *= 0.8; } },
      ],
    },
  };

  MT.HERO_ORDER = ['gru', 'lucy', 'nefario', 'kevin', 'vector'];
  MT.HERO = MT.HEROES.gru; // legacy alias
  MT.isHero = (type) => !!MT.HEROES[type];
})();
