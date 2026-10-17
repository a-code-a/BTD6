// Five more minions: the Ninja (kung-fu training), the Catapult knight (the
// minions' medieval days), the Alchemist (Nefario's potion lab), the Fireman
// ("BEE-DO BEE-DO!") and the Vampire (they once served Dracula). Same layout as
// data/towers.js: base stats, three upgrade paths of four tiers, a Super Fusion
// and its Ultimate form.
(function () {
  const up = (name, cost, desc, fx) => ({ name, cost, desc, fx });
  const P = (o) => Object.assign({ tex: 'p_banana', speed: 500, dmg: 1, pierce: 1, type: 'sharp', r: 6, spin: 0 }, o);

  const NEW = {
    ninja: {
      name: 'Ninja Minion', cost: 400, key: 'Z', size: 16,
      desc: 'A kung-fu trained minion. Throws seeking banana shurikens and sees Camo mutants from the start.',
      trait: 'Shadow senses: sees Camo mutants without any upgrades, and its shurikens seek out their target.',
      base: { range: 135, rate: 0.62, attack: 'proj', camo: true, proj: P({ tex: 'p_shuriken', speed: 640, dmg: 1, pierce: 2, r: 7, spin: 24, homing: true }) },
      paths: [
        { name: 'Way of the Blade', ups: [
          up('Sharp Shurikens', 250, 'Shurikens pop 2 more mutants.', (s) => { s.proj.pierce += 2; }),
          up('Double Shot', 400, 'Throws 2 shurikens at once.', (s) => { s.count = 2; s.spread = 10; }),
          up('Banana-jitsu', 900, 'Throws 5 shurikens at once, +1 pierce.', (s) => { s.count = 5; s.spread = 9; s.proj.pierce += 1; }),
          up('Grandmaster Ninja', 6000, '8 golden shurikens with 3 damage that cut through armor.', (s) => { s.count = 8; s.spread = 7; s.rate *= 0.8; Object.assign(s.proj, { tex: 'p_shuriken_gold', dmg: 3, armored: true }); }),
        ] },
        { name: 'Distraction', ups: [
          up('Smoke Puff', 200, 'Shurikens knock mutants back a little.', (s) => { s.proj.knock = 2; }),
          up('Counter-Espionage', 350, 'Hit mutants lose their Camo for good, so every tower can see them.', (s) => { s.proj.decamo = true; }),
          up('Flash Bomb', 2200, 'Every 4th throw is a flash bomb that stuns small mutants in the blast.', (s) => {
            s.alt = { every: 4, proj: P({ tex: 'p_flashbomb', speed: 520, dmg: 0, pierce: 1, type: 'normal', r: 7, explode: { r: 56, dmg: 2, pierce: 30 }, stun: { dur: 1 } }) };
          }),
          up('Shadow Master', 7000, 'Flash bombs every 3rd throw. Ability: Shadow Strike.', (s) => { s.alt.every = 3; s.alt.proj.explode.dmg = 4; s.ability = 'shadowStrike'; }),
        ] },
        { name: 'Shinobi Arts', ups: [
          up('Ninja Discipline', 300, '+15 range and throws 15% faster.', (s) => { s.range += 15; s.rate *= 0.85; }),
          up('Caltrops', 450, 'Every 3rd throw also scatters caltrops right in front of the target.', (s) => { s.caltrops = { every: 3, dmg: 1, pierce: 6, life: 10 }; }),
          up('Sticky Bomb', 2500, 'Every 3rd throw sticks a bomb on the strongest giant: +60 damage.', (s) => {
            s.alt = { every: 3, boss: true, proj: P({ tex: 'p_stickybomb', speed: 600, dmg: 0, pierce: 1, type: 'explosive', r: 7, homing: true, explode: { r: 40, dmg: 3, pierce: 12 }, moabDmg: 60 }) };
          }),
          up('Master Bomber', 9000, 'Sticky bombs every 2nd throw: 300 damage to giants and a short stun.', (s) => {
            s.alt.every = 2;
            Object.assign(s.alt.proj, { moabDmg: 300, stun: { dur: 0.6, moab: true } });
            s.alt.proj.explode.dmg = 8;
          }),
        ] },
      ],
    },

    catapult: {
      name: 'Catapult Minion', cost: 750, key: 'X', size: 20,
      desc: 'A knight minion with a wooden catapult from the good old days. Lobs boulders over everything for huge splash damage.',
      trait: 'Siege: boulders fly over everything and land just ahead of the target, crushing all mutants in the blast, armor too. Cannot hit flying mutants.',
      base: { range: 210, rate: 2.1, attack: 'lob', proj: P({ tex: 'p_rock', speed: 400, dmg: 0, pierce: 1, type: 'normal', r: 10, spin: 8, explode: { r: 40, dmg: 2, pierce: 18 } }) },
      paths: [
        { name: 'Bigger Boulders', ups: [
          up('Heavy Stones', 300, 'Bigger blasts hit 8 more mutants.', (s) => { s.proj.explode.r += 10; s.proj.explode.pierce += 8; }),
          up('Watermelon Bombs', 650, 'Juicy melons: 3 damage, and the splash slows mutants.', (s) => { s.proj.tex = 'p_melon'; s.proj.explode.dmg = 3; s.proj.slow = { mul: 0.7, dur: 1.5 }; }),
          up('Iron Wrecking Ball', 2000, 'Spiked iron balls: 5 damage, +20 to giants, and they shred armor.', (s) => { Object.assign(s.proj, { tex: 'p_ironball', moabDmg: 20, shred: 3 }); s.proj.explode.dmg = 5; s.proj.explode.r += 8; }),
          up('Colossal Boulder', 9000, 'Gigantic boulders: 14 damage, +80 to giants, and they stun small mutants.', (s) => {
            Object.assign(s.proj, { tex: 'p_colossal', scale: 1.2, moabDmg: 80, stun: { dur: 0.8 } });
            s.proj.explode.dmg = 14;
            s.proj.explode.r += 16;
            s.proj.explode.pierce += 20;
          }),
        ] },
        { name: 'Rapid Reload', ups: [
          up('Oiled Gears', 250, 'Lobs 20% faster.', (s) => { s.rate *= 0.8; }),
          up('Double Bucket', 550, 'Lobs 2 boulders at once.', (s) => { s.count = 2; }),
          up('Siege Workshop', 2200, 'Lobs twice as fast.', (s) => { s.rate *= 0.5; }),
          up('Royal Artillery', 8000, 'Lobs 4 boulders at once, and each one bursts into 6 bomblets.', (s) => { s.count = 4; s.proj.cluster = { n: 6, r: 26, dmg: 2, pierce: 8 }; }),
        ] },
        { name: 'Fire Pots', ups: [
          up('Long Throw', 200, '+50 range.', (s) => { s.range += 50; }),
          up('Burning Pitch', 500, 'Fire pots: blasts leave burning pitch on the track.', (s) => { s.proj.tex = 'p_firepot'; s.proj.type = 'fire'; s.proj.cloud = { r: 30, dur: 2.5, dmg: 1, every: 0.5, pierce: 10 }; s.proj.cloudKind = 'fire'; }),
          up('Greek Fire', 1800, 'Green fire burns longer and deals 2. A spotter flag lets it target Camo.', (s) => { s.proj.tex = 'p_greekfire'; s.proj.cloud = { r: 36, dur: 4, dmg: 2, every: 0.5, pierce: 14 }; s.proj.cloudKind = 'greek'; s.camo = true; }),
          up('Rain of Fire', 7000, '+10 damage to giants. Ability: Meteor Shower.', (s) => { s.proj.moabDmg = (s.proj.moabDmg || 0) + 10; s.ability = 'meteorShower'; }),
        ] },
      ],
    },

    potion: {
      name: 'Alchemist Minion', cost: 500, key: 'C', size: 16,
      desc: "Mixes potions in Dr. Nefario's lab. Throws acid flasks that splash a whole group, and can brew other towers or turn mutants to gold.",
      trait: 'Acid splash: potions splash a group of mutants and the acid keeps eating them. Acid burns through armor.',
      base: { range: 120, rate: 1.4, attack: 'proj', proj: P({ tex: 'p_potion', speed: 430, dmg: 0, pierce: 1, type: 'normal', r: 8, spin: 10, armored: true, explode: { r: 34, dmg: 1, pierce: 10 }, dot: { dmg: 1, every: 1, dur: 3 } }) },
      paths: [
        { name: 'Acid Mixtures', ups: [
          up('Stronger Acid', 250, 'Acid eats mutants faster.', (s) => { s.proj.dot.every = 0.6; }),
          up('Bigger Flasks', 450, 'Bigger splash hits 8 more mutants.', (s) => { s.proj.explode.r += 12; s.proj.explode.pierce += 8; }),
          up('Acid Pools', 1600, 'Splash deals 2, and potions leave bubbling acid pools on the track.', (s) => { s.proj.explode.dmg = 2; s.proj.cloud = { r: 30, dur: 3, dmg: 1, every: 0.5, pierce: 12 }; s.proj.cloudKind = 'acid'; }),
          up('Unstable Concoction', 6500, 'Mega acid: 4 damage per tick, splash 4, +12 to giants.', (s) => { s.proj.dot = { dmg: 4, every: 0.5, dur: 4 }; s.proj.explode.dmg = 4; s.proj.moabDmg = 12; s.proj.cloud.dmg = 3; }),
        ] },
        { name: 'Brews', ups: [
          up('Berserker Brew', 300, 'Every few seconds brews a nearby tower: +1 pierce, +10% range, 15% faster for 8s.', (s) => { s.brew = { every: 5, n: 1, dur: 8, pierce: 1, range: 0.1, rate: 0.15, dmg: 0 }; }),
          up('Stronger Stimulant', 550, 'Brews last 12s and add +25% damage.', (s) => { s.brew.dur = 12; s.brew.dmg = 0.25; }),
          up('Brew Barrage', 2400, 'Brews 3 towers at once, more often.', (s) => { s.brew.n = 3; s.brew.every = 3.5; }),
          up('Permanent Brew', 7500, 'Every tower in range is always brewed: 20% faster, +1 pierce, +15% range, +25% damage.', (s) => {
            s.brew = null;
            s.buff = { range: 0.15, rate: 0.2, pierce: 1, dmg: 0.25, camo: false, armored: false, discount: 0 };
          }),
        ] },
        { name: 'Transmutation', ups: [
          up('Quick Mix', 200, 'Throws potions 20% faster.', (s) => { s.rate *= 0.8; }),
          up('Lead to Gold', 600, 'Splashed mutants turn gold: they pay +$2 when they pop.', (s) => { s.proj.gold = 2; s.proj.tex = 'p_potion_gold'; }),
          up('Midas Mix', 2800, 'Gold mutants pay +$5, and potions deal +6 to giants.', (s) => { s.proj.gold = 5; s.proj.moabDmg = (s.proj.moabDmg || 0) + 6; }),
          up("Philosopher's Banana", 9000, 'Gold mutants pay +$10. Ability: Golden Touch.', (s) => { s.proj.gold = 10; s.ability = 'goldenTouch'; }),
        ] },
      ],
    },

    fireman: {
      name: 'Fireman Minion', cost: 450, key: 'V', size: 17,
      desc: 'BEE-DO BEE-DO! A fire-fighting minion with a water hose. The jet pushes mutants back down the track.',
      trait: 'Water jet: soaked mutants get pushed back down the track. Siren upgrades stun everything nearby.',
      base: { range: 110, rate: 0.5, attack: 'proj', proj: P({ tex: 'p_water', speed: 620, dmg: 1, pierce: 2, type: 'normal', r: 7, knock: 3, life: 1 }) },
      paths: [
        { name: 'Pressure', ups: [
          up('High Pressure', 250, '+2 pierce and a stronger push.', (s) => { s.proj.pierce += 2; s.proj.knock += 2; }),
          up('Fire Hose', 500, 'Jets deal 2 damage.', (s) => { s.proj.dmg = 2; }),
          up('Water Cannon', 1800, 'Big water balls splash a whole group and blast them back.', (s) => {
            Object.assign(s.proj, { tex: 'p_waterball', r: 9, knock: 8, explode: { r: 38, dmg: 3, pierce: 16 } });
            s.rate *= 1.4;
          }),
          up('Tsunami Cannon', 7000, 'Massive blasts: 8 damage, +25 to giants, and even giants get pushed back.', (s) => { Object.assign(s.proj.explode, { r: 54, dmg: 8, pierce: 30 }); s.proj.moabDmg = 25; s.proj.knockBoss = 4; s.proj.knock = 12; }),
        ] },
        { name: 'Bee-Do', ups: [
          up('Bee-Do Siren', 300, 'Every 3s the siren goes BEE-DO and stuns small mutants nearby for 0.5s.', (s) => { s.siren = { every: 3, stun: 0.5 }; }),
          up('Louder Siren', 500, 'Stuns for 0.9s, every 2.2s.', (s) => { s.siren = { every: 2.2, stun: 0.9 }; }),
          up('Fire Truck', 2400, 'Rides a fire truck with two hoses: twice the water.', (s) => { s.count = 2; s.spread = 8; s.rate *= 0.85; }),
          up('Emergency!', 7500, 'The siren stuns giants too. Ability: BEE-DO BEE-DO!', (s) => { s.siren.moab = true; s.ability = 'beedoo'; }),
        ] },
        { name: 'Hydrant', ups: [
          up('Longer Hose', 150, '+20 range.', (s) => { s.range += 20; }),
          up('Washdown', 400, 'Sees Camo, and the water washes the Camo paint off mutants it hits.', (s) => { s.camo = true; s.proj.decamo = true; }),
          up('Flood', 1500, 'Water leaves puddles on the track that slow mutants down.', (s) => { s.proj.cloud = { r: 30, dur: 3, dmg: 0, every: 0.5, pierce: 20, slow: { mul: 0.6, dur: 0.8, look: 'wet' } }; s.proj.cloudKind = 'water'; }),
          up('Riptide', 5500, 'Puddles drag mutants backwards and deal 2. Jets +1 damage.', (s) => { s.proj.cloud.dmg = 2; s.proj.cloud.knock = 3; s.proj.cloud.dur = 4; s.proj.dmg += 1; }),
        ] },
      ],
    },

    vampire: {
      name: 'Vampire Minion', cost: 650, key: 'B', size: 16,
      desc: 'The minions once served Count Dracula. This one kept the cape. Sends homing bats, and its bites heal your lives.',
      trait: 'Life drain: every 30 mutants its bats pop heal you 1 life (up to 3 per round). Bats chase their prey.',
      base: { range: 140, rate: 1.0, attack: 'proj', lifesteal: 30, healCap: 3, proj: P({ tex: 'p_bat', speed: 320, dmg: 1, pierce: 3, type: 'normal', r: 8, homing: true, life: 2.2 }) },
      paths: [
        { name: 'Bat Swarm', ups: [
          up('More Bats', 250, 'Sends 2 bats at once.', (s) => { s.count = 2; s.spread = 20; }),
          up('Bat Colony', 600, 'Sends 3 bats, +1 pierce.', (s) => { s.count = 3; s.proj.pierce += 1; }),
          up('Swarm of the Night', 2400, 'Sends 6 bats, and sends them faster.', (s) => { s.count = 6; s.spread = 14; s.rate *= 0.8; }),
          up('Lord of the Night', 8500, '10 vampire bats with 3 damage each. Ability: Bat Storm.', (s) => { s.count = 10; s.spread = 12; s.proj.dmg = Math.max(3, s.proj.dmg); s.ability = 'batStorm'; }),
        ] },
        { name: 'Bloodline', ups: [
          up('Sharp Fangs', 300, 'Bats deal +1 damage.', (s) => { s.proj.dmg += 1; }),
          up('Life Drain', 650, 'Heals a life every 15 pops (up to 6 per round), and bitten mutants are slowed.', (s) => { s.lifesteal = 15; s.healCap = 6; s.proj.slow = { mul: 0.75, dur: 1.2, look: 'bite' }; }),
          up('Vampire Bite', 2600, 'Bats deal +12 to giants and drain them: giants are slowed too.', (s) => { s.proj.moabDmg = (s.proj.moabDmg || 0) + 12; s.proj.slow.moab = true; }),
          up('Count Dracula', 9500, 'Heals a life every 8 pops (up to 12 per round). Ability: Blood Moon.', (s) => { s.lifesteal = 8; s.healCap = 12; s.ability = 'bloodMoon'; }),
        ] },
        { name: 'Creature of the Night', ups: [
          up('Night Vision', 250, 'Can see Camo mutants.', (s) => { s.camo = true; }),
          up('Echolocation', 400, '+30 range and faster bats.', (s) => { s.range += 30; s.proj.speed *= 1.3; }),
          up('Fear', 1800, 'Bats terrify small mutants: they flee backwards and freeze in fear for a moment.', (s) => { s.proj.knock = 5; s.proj.stun = { dur: 0.4 }; }),
          up('Creature of Darkness', 6000, 'Giant vampire bats: 6 damage, 8 pierce, and they bite through armor.', (s) => { Object.assign(s.proj, { tex: 'p_bat_big', dmg: 6, pierce: 8, armored: true, r: 11 }); }),
        ] },
      ],
    },
  };
  Object.assign(MT.TOWERS, NEW);
  // new minions go in front of the economy/support towers and the Super Minion
  const tail = ['farm', 'lab', 'super'];
  MT.TOWER_ORDER = MT.TOWER_ORDER.filter((t) => !tail.includes(t)).concat(Object.keys(NEW), tail);

  // ---------------------------------------------------------------- super fusions
  const FUSIONS = {
    ninja: {
      name: 'Shadow Shogun', cost: 15000, color: '#9575cd',
      desc: 'A legendary ninja lord. Throws 6 huge golden shurikens that seek, cut armor and strip Camo, plus flash bombs that stun even giants.',
      base: { range: 190, rate: 0.15, attack: 'proj', count: 6, spread: 9, camo: true, ability: 'thousandCuts',
        proj: P({ tex: 'p_shuriken_gold', scale: 1.4, speed: 760, dmg: 7, pierce: 10, r: 9, spin: 26, homing: true, armored: true, decamo: true, moabDmg: 30, bruteDmg: 6, trail: 0x7c4dff }),
        alt: { every: 4, proj: P({ tex: 'p_flashbomb', speed: 560, dmg: 0, pierce: 1, type: 'normal', r: 8, explode: { r: 80, dmg: 10, pierce: 60 }, stun: { dur: 1.2, moab: true } }) } },
    },
    catapult: {
      name: 'Royal Trebuchet', cost: 18000, color: '#ff7043',
      desc: 'A castle-sized trebuchet. Lobs 3 colossal flaming boulders that burst into bomblets and set the track on fire.',
      base: { range: 300, rate: 0.5, attack: 'lob', count: 3, camo: true, ability: 'meteorStorm',
        proj: P({ tex: 'p_colossal', scale: 1.5, speed: 500, dmg: 0, pierce: 1, type: 'normal', r: 14, spin: 6, shred: 4, stun: { dur: 0.6 }, moabDmg: 120, bruteDmg: 10, trail: 0xff7043,
          explode: { r: 80, dmg: 14, pierce: 70 }, cluster: { n: 8, r: 30, dmg: 4, pierce: 10 }, cloud: { r: 40, dur: 3, dmg: 3, every: 0.4, pierce: 20 }, cloudKind: 'fire' }) },
    },
    potion: {
      name: 'Grand Alchemist', cost: 18000, color: '#00e676',
      desc: 'Master of potions. 4 homing mega flasks splash acid pools and turn mutants gold, and every tower nearby is brewed.',
      base: { range: 200, rate: 0.2, attack: 'proj', count: 4, spread: 14, camo: true, ability: 'potionRain', buffRange: 200,
        buff: { range: 0.1, rate: 0.15, pierce: 1, dmg: 0.25, camo: false, armored: false, discount: 0 },
        proj: P({ tex: 'p_potion_big', scale: 1.3, speed: 520, dmg: 0, pierce: 1, type: 'normal', r: 10, spin: 8, homing: true, armored: true, gold: 5, moabDmg: 60, trail: 0x69f0ae,
          explode: { r: 60, dmg: 10, pierce: 40 }, dot: { dmg: 8, every: 0.4, dur: 4 }, cloud: { r: 40, dur: 3, dmg: 4, every: 0.4, pierce: 25 }, cloudKind: 'acid' }) },
    },
    fireman: {
      name: 'Bee-Do Brigade', cost: 16000, color: '#ff1744',
      desc: 'A whole fire brigade on a giant truck. 3 water cannons blast mutants far back and flood the track, and the siren stuns everything.',
      base: { range: 200, rate: 0.2, attack: 'proj', count: 3, spread: 12, camo: true, ability: 'megaSiren', siren: { every: 2, stun: 1, moab: true },
        proj: P({ tex: 'p_waterball', scale: 1.4, speed: 620, dmg: 0, pierce: 1, type: 'normal', r: 10, knock: 12, knockBoss: 6, decamo: true, moabDmg: 70, trail: 0x4fc3f7,
          explode: { r: 64, dmg: 12, pierce: 50 }, cloud: { r: 36, dur: 3, dmg: 3, every: 0.5, pierce: 25, slow: { mul: 0.5, dur: 1, look: 'wet' } }, cloudKind: 'water' }) },
    },
    vampire: {
      name: 'Count Minionula', cost: 20000, color: '#d50000',
      desc: 'The king of vampires. Releases swarms of 12 huge homing bats that bite through armor, drain giants and heal you all the time.',
      base: { range: 220, rate: 0.3, attack: 'proj', count: 12, spread: 12, camo: true, lifesteal: 6, healCap: 20, ability: 'eternalNight',
        proj: P({ tex: 'p_bat_big', scale: 1.2, speed: 420, dmg: 8, pierce: 10, type: 'normal', r: 11, homing: true, armored: true, life: 2.4, moabDmg: 55, trail: 0xff1744, slow: { mul: 0.6, dur: 2, moab: true, look: 'bite' } }) },
    },
  };
  const ULTIMATE = {
    ninja: { name: 'Shadow Dojo', mech: 'Shuriken Storm', desc: 'A hidden temple with a giant ninja master. Huge spinning shurikens roll back down the track and slice everything in their way.' },
    catapult: { name: 'Banana Castle', mech: 'Boulder Barrage', desc: 'A royal castle with a trebuchet on every tower. Volleys of 6 flaming boulders crash onto the strongest mutants.' },
    potion: { name: 'Great Cauldron', mech: 'Acid Geysers', desc: 'A bubbling cauldron the size of a house. Acid geysers erupt under the mutants, melt them and leave acid pools behind.' },
    fireman: { name: 'Bee-Do HQ', mech: 'Flood Wave', desc: 'The fire station of the future. Giant flood waves roll back down the track and wash every mutant far back.' },
    vampire: { name: "Dracula's Castle", mech: 'Bat Cloud', desc: 'A haunted castle under a blood moon. Clouds of bats pour out, bite every mutant in range and heal you as they feed.' },
  };
  Object.keys(FUSIONS).forEach((k) => {
    MT.TOWERS[k].fusion = FUSIONS[k];
    FUSIONS[k].ultimate = Object.assign({ cost: FUSIONS[k].cost * 2.5 }, ULTIMATE[k]);
  });

  // what each one adds to the Omega Beam (see game/newtowers.js)
  Object.assign(MT.OMEGA_ELEMENTS, {
    ninja: 'cuts armor + strips Camo', catapult: 'boulder blasts', potion: 'acid + gold pops', fireman: 'washes mutants back', vampire: 'heals lives',
  });

  Object.assign(MT.ABILITIES, {
    shadowStrike: { name: 'Shadow Strike', cd: 45, icon: 'ab_shadow', desc: 'The ninja dashes along the track and slashes 40 mutants. Giants take 600 damage.' },
    meteorShower: { name: 'Meteor Shower', cd: 50, icon: 'ab_meteor', desc: '24 flaming boulders rain onto the track and set it on fire.' },
    goldenTouch: { name: 'Golden Touch', cd: 60, icon: 'ab_golden', desc: 'For 12s every pop pays 3x the bananas.' },
    beedoo: { name: 'BEE-DO BEE-DO!', cd: 45, icon: 'ab_siren', desc: 'Every mutant on screen is stunned for 3s (giants 1.5s) and soaked.' },
    batStorm: { name: 'Bat Storm', cd: 45, icon: 'ab_bats', desc: 'A storm of 60 bats swarms the map and bites every mutant it finds.' },
    bloodMoon: { name: 'Blood Moon', cd: 70, icon: 'ab_bloodmoon', desc: 'Every mutant takes heavy damage (giants 15%, up to 6000) and you heal a life for every 10 hit.' },
    // super fusions
    thousandCuts: { name: 'Thousand Cuts', cd: 50, icon: 'ab_cuts', desc: 'Shadow clones slash 100 mutants all over the map. Giants take 2500 damage.' },
    meteorStorm: { name: 'Meteor Storm', cd: 55, icon: 'ab_meteor', desc: '40 flaming meteors rain down. Giants take 800 per hit.' },
    potionRain: { name: 'Potion Rain', cd: 55, icon: 'ab_potionrain', desc: 'Potions rain on every mutant: acid and gold, and every pop pays 3x for 10s.' },
    megaSiren: { name: 'Mega Siren', cd: 50, icon: 'ab_siren', desc: 'BEE-DO BEE-DO! Stuns everything for 4s and a flood wave washes every mutant back.' },
    eternalNight: { name: 'Eternal Night', cd: 60, icon: 'ab_bats', desc: 'Night falls: 150 bats swarm the map, and you heal 1 life for every 10 bites.' },
  });
})();
