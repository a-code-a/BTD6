// Tower definitions. Each tower has base stats and three upgrade paths of four
// tiers. Crosspathing works like BTD6: one path may go to tier 3-4, a second
// path up to tier 2, the third stays closed.
(function () {
  const up = (name, cost, desc, fx) => ({ name, cost, desc, fx });
  const P = (o) => Object.assign({ tex: 'p_banana', speed: 500, dmg: 1, pierce: 1, type: 'sharp', r: 6, spin: 0 }, o);

  MT.TOWERS = {
    banana: {
      name: 'Banana Thrower', cost: 200, key: 'Q', size: 16,
      desc: 'Throws spinning bananas. Cheap and reliable.',
      base: { range: 120, rate: 0.95, attack: 'proj', proj: P({ tex: 'p_banana', speed: 560, pierce: 2, r: 7, spin: 16 }) },
      paths: [
        { name: 'Banana Power', ups: [
          up('Ripe Bananas', 140, 'Bananas pop 1 extra mutant.', (s) => { s.proj.pierce += 1; }),
          up('Super Ripe', 220, 'Bananas pop 2 more mutants.', (s) => { s.proj.pierce += 2; }),
          up('Banana Boulder', 300, 'Hurls a huge rolling ball of bananas that plows through 18 mutants.', (s) => { Object.assign(s.proj, { tex: 'p_boulder', r: 13, pierce: 18, speed: 380, spin: 6, life: 1.6 }); }),
          up('Banana Juggernaut', 1800, 'Giant golden ball: 50 pierce, 2 damage, smashes armor and barrels.', (s) => { Object.assign(s.proj, { tex: 'p_jugg', r: 16, pierce: 50, dmg: 2, armored: true, bruteDmg: 3, speed: 420 }); }),
        ] },
        { name: 'Quick Hands', ups: [
          up('Quick Toss', 100, 'Throws 15% faster.', (s) => { s.rate *= 0.85; }),
          up('Speedy Toss', 190, 'Throws even faster.', (s) => { s.rate *= 0.78; }),
          up('Triple Toss', 400, 'Throws three bananas at once.', (s) => { s.count = 3; s.spread = 16; }),
          up('Banana Frenzy', 7000, 'Ability: every Banana Thrower attacks 3x faster for 12s.', (s) => { s.rate *= 0.6; s.ability = 'bananaFrenzy'; }),
        ] },
        { name: 'Sharp Eyes', ups: [
          up('Long Arm', 90, 'Increases range.', (s) => { s.range += 25; }),
          up('Goggle Zoom', 200, 'More range and can see Camo mutants.', (s) => { s.range += 25; s.camo = true; }),
          up('Banana Crossbow', 625, 'Fast banana bolts deal 3 damage.', (s) => { Object.assign(s.proj, { tex: 'p_bolt', dmg: 3, speed: 900, r: 6, spin: 0 }); s.proj.pierce += 1; s.range += 30; }),
          up('Sharpshooter', 2000, '6 damage bolts and a crit for 5x damage every 10 shots.', (s) => { s.proj.dmg = 6; s.proj.crit = { every: 10, mult: 5 }; s.rate *= 0.8; }),
        ] },
      ],
    },

    fart: {
      name: 'Fart Blaster', cost: 280, key: 'W', size: 16,
      desc: 'Blasts stinky gas puffs in every direction.',
      base: { range: 80, rate: 1.4, attack: 'radial', count: 8, proj: P({ tex: 'p_gas', speed: 250, type: 'normal', r: 9 }) },
      paths: [
        { name: 'Stinkier', ups: [
          up('Bean Diet', 150, 'Blasts 33% faster.', (s) => { s.rate *= 0.75; }),
          up('Chili Beans', 300, 'Blasts even faster.', (s) => { s.rate *= 0.67; }),
          up('Gas Cloud', 600, 'Releases a toxic ring that hits everything in range.', (s) => { s.attack = 'ring'; s.rate = 0.8; s.proj.pierce = 40; s.ring = 'gas'; }),
          up('Toxic Tornado', 4500, 'Constant toxic storm: 2 damage, poisons mutants.', (s) => { s.rate = 0.3; s.proj.dmg = 2; s.range += 15; s.proj.pierce = 120; s.proj.dot = { dmg: 1, every: 1, dur: 3 }; }),
        ] },
        { name: 'Bigger Blast', ups: [
          up('Long Toots', 100, 'Puffs travel further.', (s) => { s.range += 12; }),
          up('Extra Puffs', 250, 'Shoots 10 puffs.', (s) => { s.count = 10; }),
          up('Fart Storm', 680, '16 puffs that pop 3 mutants each.', (s) => { s.count = 16; s.proj.pierce += 2; }),
          up('Gas Giant', 2800, 'Massive puffs: +1 damage, +4 pierce and knockback.', (s) => { s.proj.dmg += 1; s.proj.pierce += 4; s.rate *= 0.6; s.proj.knock = 6; s.proj.r = 13; }),
        ] },
        { name: 'Chemistry', ups: [
          up('Sticky Gas', 120, '+1 pierce.', (s) => { s.proj.pierce += 1; }),
          up('Skunk Formula', 300, 'Sniffs out Camo mutants. +1 pierce.', (s) => { s.camo = true; s.proj.pierce += 1; }),
          up('Flame Fart', 1000, 'Fiery farts: +1 damage and burn over time.', (s) => { Object.assign(s.proj, { tex: 'p_fire', type: 'fire' }); s.proj.dmg += 1; s.proj.dot = { dmg: 1, every: 1, dur: 3 }; }),
          up('Inferno Ring', 5500, 'A permanent ring of fire scorches everything nearby.', (s) => { s.attack = 'ring'; s.ring = 'fire'; s.rate = 0.25; s.proj.dmg = 3; s.proj.pierce = 80; }),
        ] },
      ],
    },

    rocket: {
      name: 'Rocket Minion', cost: 525, key: 'E', size: 17,
      desc: 'Fires explosive rockets. Blasts through armor. Cannot see Camo.',
      base: { range: 150, rate: 1.5, attack: 'proj', proj: P({ tex: 'p_rocket', speed: 420, dmg: 0, pierce: 1, type: 'explosive', r: 7, explode: { r: 38, dmg: 1, pierce: 14 } }) },
      paths: [
        { name: 'Bigger Boom', ups: [
          up('Bigger Rockets', 350, 'Larger explosions hit more mutants.', (s) => { s.proj.explode.r = 52; s.proj.explode.pierce = 22; }),
          up('Heavy Warhead', 650, 'Explosions deal 2 damage.', (s) => { s.proj.explode.dmg = 2; s.proj.explode.pierce = 28; s.proj.bruteDmg = 1; }),
          up('Mega Rocket', 1100, 'Huge 3 damage blasts. Extra damage to giants.', (s) => { Object.assign(s.proj.explode, { r: 66, dmg: 3, pierce: 36 }); s.proj.moabDmg = 5; }),
          up('Moon Buster', 3200, 'Devastating 6 damage blasts that wreck giants.', (s) => { Object.assign(s.proj.explode, { r: 80, dmg: 6, pierce: 50 }); s.proj.moabDmg = 20; s.proj.bruteDmg = 4; }),
        ] },
        { name: 'Fast Launch', ups: [
          up('Quick Reload', 250, 'Fires 25% faster.', (s) => { s.rate *= 0.75; }),
          up('Auto Loader', 400, 'Fires 25% faster again.', (s) => { s.rate *= 0.75; }),
          up('Cluster Rockets', 800, 'Explosions scatter 8 mini-bombs.', (s) => { s.proj.cluster = { n: 8, r: 24, dmg: 1, pierce: 8 }; }),
          up('Rocket Swarm', 3500, 'Double fire rate, 12 stronger mini-bombs.', (s) => { s.rate *= 0.5; s.proj.cluster = { n: 12, r: 28, dmg: 2, pierce: 10 }; }),
        ] },
        { name: 'Smart Rockets', ups: [
          up('Laser Guidance', 200, 'More range, faster rockets.', (s) => { s.range += 25; s.proj.speed *= 1.3; }),
          up('Homing Rockets', 300, 'Rockets chase their target.', (s) => { s.proj.homing = true; }),
          up('Giant Seeker', 1200, 'Prefers giants and deals +12 damage to them.', (s) => { s.proj.moabDmg = (s.proj.moabDmg || 0) + 12; s.preferBoss = true; }),
          up('Giant Eliminator', 5000, '+50 damage to giants. Ability: Mega Missile.', (s) => { s.proj.moabDmg += 50; s.ability = 'megaMissile'; }),
        ] },
      ],
    },

    freeze: {
      name: 'Freeze Ray Minion', cost: 450, key: 'R', size: 16,
      desc: 'Freezes nearby mutants solid. Cold cannot hurt armor.',
      base: { range: 75, rate: 2.2, attack: 'aura', proj: P({ dmg: 1, pierce: 40, type: 'cold', freeze: { dur: 1.4 } }) },
      paths: [
        { name: 'Colder', ups: [
          up('Permafrost', 150, 'Thawed mutants stay slowed for a while.', (s) => { s.proj.slow = { mul: 0.6, dur: 2.5 }; }),
          up('Deep Freeze', 300, 'Freezes longer and pops 2 layers.', (s) => { s.proj.freeze.dur += 0.6; s.proj.dmg = 2; }),
          up('Arctic Wind', 2000, 'Everything in its (larger) range is slowed by 60%, giants by 25%.', (s) => { s.slowAura = { mul: 0.4, moabMul: 0.75 }; s.range += 30; }),
          up('Snowstorm', 3000, 'Ability: freezes every mutant on screen.', (s) => { s.ability = 'snowstorm'; s.proj.freeze.dur += 0.5; }),
        ] },
        { name: 'Faster', ups: [
          up('Enhanced Freeze', 200, 'Freezes 33% more often.', (s) => { s.rate *= 0.75; }),
          up('Larger Radius', 150, 'More range.', (s) => { s.range += 20; }),
          up('Brittle Ice', 1200, 'Frozen mutants take +1 damage from everything. Can crack armor.', (s) => { s.proj.brittle = true; s.proj.armored = true; }),
          up('Ice Avalanche', 4000, '3 damage blasts that briefly stun even giants.', (s) => { s.proj.dmg = 3; s.rate *= 0.6; s.proj.freeze.moab = 0.5; }),
        ] },
        { name: 'Ice Tech', ups: [
          up('Cold Snap', 100, 'Can freeze Camo mutants.', (s) => { s.camo = true; }),
          up('Cryo Rounds', 300, '+1 damage.', (s) => { s.proj.dmg += 1; }),
          up('Cryo Cannon', 1600, 'Fires freezing ice bombs at long range.', (s) => {
            s.attack = 'proj'; s.range = 160; s.rate = 1.2;
            Object.assign(s.proj, { tex: 'p_ice', speed: 600, pierce: 1, r: 8, explode: { r: 42, dmg: s.proj.dmg, pierce: 16 } });
          }),
          up('Icicle Impale', 5000, 'Giant icicles: +30 damage to giants and freezes them.', (s) => { s.proj.moabDmg = 30; s.proj.freeze.moab = 1; s.proj.explode.dmg += 2; }),
        ] },
      ],
    },

    jelly: {
      name: 'Jelly Gunner', cost: 275, key: 'T', size: 16,
      desc: 'Shoots sticky jelly that slows mutants down.',
      base: { range: 120, rate: 1.0, attack: 'proj', preferUnslowed: true, proj: P({ tex: 'p_jelly', speed: 450, dmg: 0, pierce: 1, type: 'normal', r: 7, slow: { mul: 0.5, dur: 8 } }) },
      paths: [
        { name: 'Acid Jelly', ups: [
          up('Fizzy Jelly', 200, 'Jelly slowly dissolves mutants.', (s) => { s.proj.dot = { dmg: 1, every: 2.3, dur: 8 }; }),
          up('Acid Jelly', 300, 'Dissolves much faster. Eats through armor.', (s) => { s.proj.dot.every = 1.0; s.proj.armored = true; }),
          up('Jelly Dissolver', 2500, 'Jelly sticks to giants and melts 2 per tick.', (s) => { s.proj.slow.moab = true; s.proj.dot.dmg = 2; }),
          up('Jelly Liquefier', 5000, 'Turbo acid: 4 damage every 0.4s.', (s) => { s.proj.dot = { dmg: 4, every: 0.4, dur: 8 }; }),
        ] },
        { name: 'Splatter', ups: [
          up('Bigger Blobs', 120, 'Jelly hits 2 mutants.', (s) => { s.proj.pierce = 2; }),
          up('Jelly Splatter', 400, 'Jelly splashes onto nearby mutants.', (s) => { s.proj.explode = { r: 34, dmg: 0, pierce: 6 }; }),
          up('Jelly Hose', 1200, 'Sprays jelly 3x as fast.', (s) => { s.rate *= 0.33; }),
          up('Jelly Storm', 4500, 'Ability: covers every mutant on screen in acid jelly.', (s) => { s.ability = 'jellyStorm'; }),
        ] },
        { name: 'Stronger Jelly', ups: [
          up('Sticky Jelly', 280, 'Slows by 60% for longer.', (s) => { s.proj.slow.mul = 0.4; s.proj.slow.dur += 3; }),
          up('Stickier Jelly', 380, 'Slows by 70%. Jelly sticks to the next layer too.', (s) => { s.proj.slow.mul = 0.3; s.proj.slow.soak = true; }),
          up('Giant Jelly', 1600, 'Jelly also slows giants. More range.', (s) => { s.proj.slow.moab = true; s.range += 20; }),
          up('Jelly Trap', 4000, 'Small mutants get stuck in place for 1.5s.', (s) => { s.proj.stun = { dur: 1.5 }; }),
        ] },
      ],
    },

    sniper: {
      name: 'Laser Sniper', cost: 350, key: 'Y', size: 16,
      desc: 'Hits anything anywhere on the map. Lasers burn through armor.',
      base: { range: 2000, rate: 1.6, attack: 'instant', proj: P({ dmg: 2, pierce: 1, type: 'energy' }) },
      paths: [
        { name: 'Power', ups: [
          up('Full Power', 350, '4 damage per shot.', (s) => { s.proj.dmg = 4; }),
          up('Overcharged', 1300, '7 damage per shot.', (s) => { s.proj.dmg = 7; }),
          up('Deadly Precision', 2500, '18 damage, +15 to barrels.', (s) => { s.proj.dmg = 18; s.proj.bruteDmg = 15; }),
          up('Giant Cripple', 5500, '30 damage and stuns giants.', (s) => { s.proj.dmg = 30; s.proj.stun = { dur: 1.2, moab: true }; }),
        ] },
        { name: 'Gadgets', ups: [
          up('Night Goggles', 300, 'Can see Camo mutants.', (s) => { s.camo = true; }),
          up('Shrapnel Shot', 450, 'Hits spray 5 bits of shrapnel.', (s) => { s.proj.shrapnel = { n: 5, dmg: 1, pierce: 2 }; }),
          up('Bouncing Laser', 3200, 'Laser bounces to 4 more mutants.', (s) => { s.proj.bounce = 4; }),
          up('Supply Drop', 7200, 'Ability: drops a crate full of cash.', (s) => { s.ability = 'supplyDrop'; }),
        ] },
        { name: 'Speed', ups: [
          up('Fast Trigger', 400, 'Shoots 30% faster.', (s) => { s.rate *= 0.7; }),
          up('Even Faster', 400, 'Shoots 30% faster again.', (s) => { s.rate *= 0.7; }),
          up('Semi-Auto', 3500, 'Shoots 3x as fast.', (s) => { s.rate *= 0.33; }),
          up('Full Auto Laser', 4750, 'Twice as fast again, +2 damage.', (s) => { s.rate *= 0.5; s.proj.dmg += 2; }),
        ] },
      ],
    },

    tesla: {
      name: 'Tesla Minion', cost: 600, key: 'A', size: 16,
      desc: 'Zaps mutants with chain lightning that jumps from one to the next. Lightning burns through armor.',
      base: { range: 125, rate: 1.1, attack: 'chain', count: 1, proj: P({ dmg: 1, pierce: 1, type: 'energy', chain: { jumps: 3, range: 85 } }) },
      paths: [
        { name: 'High Voltage', ups: [
          up('Copper Coils', 250, 'Lightning jumps 2 more times.', (s) => { s.proj.chain.jumps += 2; }),
          up('Overvolt', 550, 'Zaps deal 2 damage.', (s) => { s.proj.dmg = 2; }),
          up('Arc Reactor', 1900, '4 damage, 4 more jumps, +6 damage to barrels.', (s) => { s.proj.dmg = 4; s.proj.chain.jumps += 4; s.proj.bruteDmg = 6; }),
          up('Storm Lord', 6500, '8 damage, +15 to giants. Ability: Lightning Storm.', (s) => { s.proj.dmg = 8; s.proj.moabDmg = 15; s.ability = 'lightningStorm'; }),
        ] },
        { name: 'Overcharge', ups: [
          up('Fast Capacitor', 220, 'Zaps 25% faster.', (s) => { s.rate *= 0.75; }),
          up('Static Shock', 400, 'Zaps stun small mutants for a moment.', (s) => { s.proj.stun = { dur: 0.35 }; }),
          up('Triple Coil', 2200, 'Fires 3 lightning chains at once.', (s) => { s.count = 3; }),
          up('EMP Overload', 5200, 'Zaps twice as fast and briefly stun giants too.', (s) => { s.rate *= 0.5; s.proj.stun = { dur: 0.5, moab: true }; }),
        ] },
        { name: 'Coil Tech', ups: [
          up('Long Wires', 150, '+20 range and longer jumps.', (s) => { s.range += 20; s.proj.chain.range += 20; }),
          up('Spark Sensors', 300, 'Can zap Camo mutants.', (s) => { s.camo = true; }),
          up('Plasma Arc', 1500, '+30 range, +1 damage, jumps much further.', (s) => { s.range += 30; s.proj.dmg += 1; s.proj.chain.range += 50; }),
          up('Giga Coil', 5500, '+40 damage to giants and zaps them first.', (s) => { s.proj.moabDmg = (s.proj.moabDmg || 0) + 40; s.preferBoss = true; }),
        ] },
      ],
    },

    pilot: {
      name: 'Minion Pilot', cost: 800, key: 'S', size: 18,
      desc: 'Circles the area in a little propeller plane and strafes mutants from above.',
      base: { range: 120, rate: 0.5, attack: 'plane', planes: 1, orbit: 62, planeSpeed: 1.5, proj: P({ tex: 'p_dart', speed: 760, dmg: 1, pierce: 2, r: 5 }) },
      paths: [
        { name: 'Firepower', ups: [
          up('Twin Guns', 300, 'Fires two darts at once.', (s) => { s.count = 2; s.spread = 5; }),
          up('Hot Rounds', 550, '+1 damage and +1 pierce.', (s) => { s.proj.dmg += 1; s.proj.pierce += 1; }),
          up('Rocket Pods', 1700, 'Every 3rd volley also fires an explosive rocket.', (s) => { s.alt = { every: 3, proj: P({ tex: 'p_rocket', speed: 560, dmg: 0, pierce: 1, type: 'explosive', r: 7, explode: { r: 48, dmg: 3, pierce: 20 }, moabDmg: 6 }) }; }),
          up('Gunship', 7000, 'Heavy gunship: 4 guns, 3 damage, a rocket every volley.', (s) => { s.count = 4; s.spread = 8; s.proj.dmg = 3; s.proj.moabDmg = 4; if (s.alt) s.alt.every = 1; }),
        ] },
        { name: 'Squadron', ups: [
          up('Turbo Prop', 250, 'Flies faster and fires 20% faster.', (s) => { s.planeSpeed *= 1.4; s.rate *= 0.8; }),
          up('Wingman', 1100, 'A second plane joins the patrol.', (s) => { s.planes = 2; }),
          up('Squadron', 3600, 'A third plane joins. All planes fire faster.', (s) => { s.planes = 3; s.rate *= 0.8; }),
          up('Ace Squadron', 9000, 'Elite aces: 2x fire rate, +2 pierce, +1 damage.', (s) => { s.rate *= 0.5; s.proj.pierce += 2; s.proj.dmg += 1; }),
        ] },
        { name: 'Recon', ups: [
          up('Radar', 200, 'Can see Camo mutants.', (s) => { s.camo = true; }),
          up('Long Patrol', 350, 'Wider patrol circle and more range.', (s) => { s.orbit += 30; s.range += 20; }),
          up('Homing Darts', 1500, 'Darts chase mutants and pierce armor.', (s) => { s.proj.homing = true; s.proj.armored = true; }),
          up('Bombing Run', 6200, 'Ability: a bomber squadron carpet-bombs the whole track.', (s) => { s.ability = 'bombingRun'; s.proj.moabDmg = (s.proj.moabDmg || 0) + 3; }),
        ] },
      ],
    },

    rockstar: {
      name: 'Rock Star Minion', cost: 425, key: 'D', size: 16,
      desc: 'Shreds a banana guitar. Sound waves pierce through whole crowds of mutants.',
      base: { range: 115, rate: 1.25, attack: 'proj', proj: P({ tex: 'p_wave', speed: 380, dmg: 1, pierce: 6, type: 'normal', r: 12, life: 1.0 }) },
      paths: [
        { name: 'Loud', ups: [
          up('Amplifier', 200, 'Waves hit 4 more mutants.', (s) => { s.proj.pierce += 4; }),
          up('Power Chords', 450, 'Waves deal 2 damage.', (s) => { s.proj.dmg = 2; }),
          up('Heavy Metal', 1600, 'Huge 4 damage waves, +6 to barrels.', (s) => { s.proj.dmg = 4; s.proj.r = 16; s.proj.pierce += 6; s.proj.bruteDmg = 6; }),
          up('Rock God', 6000, '8 damage, 30 pierce, +10 to giants.', (s) => { s.proj.dmg = 8; s.proj.pierce = 30; s.proj.moabDmg = 10; s.proj.r = 19; }),
        ] },
        { name: 'Tempo', ups: [
          up('Fast Strum', 180, 'Plays 20% faster.', (s) => { s.rate *= 0.8; }),
          up('Power Trio', 500, 'Fires 3 waves in a fan.', (s) => { s.count = 3; s.spread = 20; }),
          up('Minion Band', 2100, 'The band joins! Nearby towers attack 15% faster.', (s) => { s.rate *= 0.8; s.buff = { range: 0, rate: 0.15, pierce: 0, camo: false, armored: false, discount: 0 }; s.buffRange = 150; }),
          up('World Tour', 7500, 'Ability: the Papoy Song makes every mutant dance in place.', (s) => { s.ability = 'papoySong'; s.rate *= 0.8; }),
        ] },
        { name: 'Disco', ups: [
          up('Funky Beat', 150, 'Waves slow mutants briefly.', (s) => { s.proj.slow = { mul: 0.7, dur: 1.2 }; }),
          up('Disco Lights', 300, 'Can see Camo mutants. +15 range.', (s) => { s.camo = true; s.range += 15; }),
          up('Disco Ball', 1400, 'Waves stun small mutants for 0.5s.', (s) => { s.proj.stun = { dur: 0.5 }; }),
          up('Night Fever', 4800, 'Knockback, longer stuns, and slows giants too.', (s) => { s.proj.stun = { dur: 0.9 }; s.proj.knock = 4; s.proj.slow = { mul: 0.6, dur: 2, moab: true }; }),
        ] },
      ],
    },

    farm: {
      name: 'Banana Farm', cost: 1250, key: 'U', size: 26,
      desc: 'Grows bananas worth cash every round. Collect them!',
      base: { range: 60, rate: 999, attack: 'none', bananas: 4, value: 20, valueMul: 1, flat: 0 },
      paths: [
        { name: 'More Bananas', ups: [
          up('More Bananas', 500, '6 bananas per round.', (s) => { s.bananas = 6; }),
          up('Greater Production', 600, '8 bananas per round.', (s) => { s.bananas = 8; }),
          up('Banana Plantation', 3000, '12 bananas worth $30 each.', (s) => { s.bananas = 12; s.value = 30; }),
          up('Banana Empire', 15000, '16 bananas worth $75 each.', (s) => { s.bananas = 16; s.value = 75; }),
        ] },
        { name: 'Banana Value', ups: [
          up('Banana Baskets', 300, 'Bananas are worth 25% more.', (s) => { s.valueMul = 1.25; }),
          up('Valuable Bananas', 800, 'Bananas are worth 50% more.', (s) => { s.valueMul = 1.5; }),
          up('Golden Bananas', 3500, 'Golden bananas worth 2.2x.', (s) => { s.valueMul = 2.2; s.golden = true; }),
          up('Banana Bank', 7500, '+$800 every round. Bananas 2.5x.', (s) => { s.flat += 800; s.valueMul = 2.5; }),
        ] },
        { name: 'Workers', ups: [
          up('Banana Picker', 250, 'Bananas are collected automatically.', (s) => { s.autoCollect = true; }),
          up('Marketplace', 400, '+$60 every round.', (s) => { s.flat += 60; }),
          up('Minion Market', 2700, '+$300 every round.', (s) => { s.flat += 300; }),
          up('Banana Central', 9000, '+$1000 every round.', (s) => { s.flat += 1000; }),
        ] },
      ],
    },

    lab: {
      name: "Gru's Lab", cost: 1200, key: 'I', size: 24,
      desc: 'Support: towers in range get +12% range. Upgrades give powerful buffs.',
      base: { range: 160, rate: 999, attack: 'none', buff: { range: 0.12, rate: 0, pierce: 0, camo: false, armored: false, discount: 0 }, flat: 0 },
      paths: [
        { name: 'Gadgets', ups: [
          up('Bigger Radius', 400, 'Larger support radius.', (s) => { s.range = 200; }),
          up('Minion Drums', 1500, 'Towers in range attack 15% faster.', (s) => { s.buff.rate = 0.15; }),
          up("Nefario's Gadgets", 2400, 'Towers in range get +1 pierce.', (s) => { s.buff.pierce = 1; }),
          up('Lab Overdrive', 10000, 'Ability: nearby towers attack twice as fast for 15s.', (s) => { s.ability = 'overdrive'; s.buff.rate = 0.2; }),
        ] },
        { name: 'Bank of Evil', ups: [
          up('Grant Funding', 500, 'Towers & upgrades in range cost 10% less.', (s) => { s.buff.discount = 0.1; }),
          up('Villain Loans', 1000, 'Towers & upgrades in range cost 15% less.', (s) => { s.buff.discount = 0.15; }),
          up('Bank of Evil', 2000, '+$300 every round.', (s) => { s.flat += 300; }),
          up('Evil Empire', 8000, '+$1000 every round, 20% discount.', (s) => { s.flat += 700; s.buff.discount = 0.2; }),
        ] },
        { name: 'Radar', ups: [
          up('Radar Scanner', 500, 'Towers in range can see Camo.', (s) => { s.buff.camo = true; }),
          up('Armor Piercers', 1300, 'Towers in range can damage armor with anything.', (s) => { s.buff.armored = true; }),
          up('Lab Turret', 3000, 'The lab fires lasers itself.', (s) => { s.attack = 'instant'; s.rate = 0.35; s.camo = true; s.proj = P({ dmg: 3, pierce: 1, type: 'energy' }); }),
          up('Ultimate Lab', 12000, 'Turret fires mega-lasers rapidly.', (s) => { s.rate = 0.12; s.proj.dmg = 12; s.proj.moabDmg = 10; }),
        ] },
      ],
    },

    super: {
      name: 'Super Minion', cost: 2500, key: 'O', size: 17,
      desc: 'A caped hero minion that attacks incredibly fast.',
      base: { range: 165, rate: 0.06, attack: 'proj', proj: P({ tex: 'p_dart', speed: 950, r: 5 }) },
      paths: [
        { name: 'Laser Vision', ups: [
          up('Laser Eyes', 3000, 'Lasers pop 2 mutants and burn armor.', (s) => { Object.assign(s.proj, { tex: 'p_laser', type: 'energy' }); s.proj.pierce = 2; }),
          up('Plasma Blasts', 4500, 'Plasma: 2 damage, 3 pierce, twice as fast.', (s) => { Object.assign(s.proj, { tex: 'p_plasma', dmg: 2, pierce: 3 }); s.rate *= 0.5; }),
          up('Sun Minion', 20000, 'Sun beams: 5 damage, 13 pierce.', (s) => { Object.assign(s.proj, { tex: 'p_sun', dmg: 5, pierce: 13, r: 10 }); }),
          up('Banana Sun God', 60000, 'Ultimate power: 12 damage, 25 pierce.', (s) => { Object.assign(s.proj, { dmg: 12, pierce: 25, moabDmg: 10 }); }),
        ] },
        { name: 'Super Gadgets', ups: [
          up('Super Range', 1000, '+40 range.', (s) => { s.range += 40; }),
          up('Epic Range', 1500, '+40 range, faster shots.', (s) => { s.range += 40; s.proj.speed *= 1.3; }),
          up('Robo Minion', 7000, 'Robot arm fires a second stream.', (s) => { s.count = 2; s.spread = 6; }),
          up('Mega Robo', 30000, 'Three homing streams, +3 damage.', (s) => { s.count = 3; s.spread = 8; s.proj.dmg += 3; s.proj.homing = true; }),
        ] },
        { name: 'Dark Side', ups: [
          up('Knockback', 1500, 'Shots push mutants back.', (s) => { s.proj.knock = 3; }),
          up('Ultravision', 2200, 'Sees Camo. +20 range.', (s) => { s.camo = true; s.range += 20; }),
          up('Dark Minion', 16000, '+2 damage, +2 pierce, extra damage to giants.', (s) => { s.proj.dmg += 2; s.proj.pierce += 2; s.proj.moabDmg = 4; s.proj.type = 'energy'; }),
          up('Dark Legend', 40000, 'Ability: a dark dome wipes the screen.', (s) => { s.proj.moabDmg += 10; s.ability = 'darkDome'; }),
        ] },
      ],
    },
  };

  MT.TOWER_ORDER = ['banana', 'fart', 'rocket', 'freeze', 'jelly', 'sniper', 'tesla', 'pilot', 'rockstar', 'farm', 'lab', 'super'];

  // ---------------------------------------------------------------- super fusions
  // Three towers of the same kind with a tier-4 upgrade can be fused into one
  // far stronger tower. The two partners are consumed.
  const FUSIONS = {
    banana: {
      name: 'Banana Overlord', cost: 9000, color: '#ffc400',
      desc: 'A golden god of bananas. Hurls 5 giant golden balls at once that smash armor, barrels and giants.',
      base: { range: 210, rate: 0.16, attack: 'proj', count: 5, spread: 10, camo: true, ability: 'bananaApocalypse',
        proj: P({ tex: 'p_jugg', speed: 520, dmg: 4, pierce: 60, r: 16, spin: 10, armored: true, bruteDmg: 6, moabDmg: 8, life: 1.5, scale: 1.15, trail: 0xffc400 }) },
    },
    fart: {
      name: 'Fartnado', cost: 16000, color: '#76d13a',
      desc: 'A roaring tornado of toxic gas. Shreds and poisons everything around it and blows mutants back.',
      base: { range: 150, rate: 0.14, attack: 'ring', ring: 'nado', camo: true, ability: 'nuclearToot',
        proj: P({ dmg: 4, pierce: 400, type: 'normal', knock: 3, dot: { dmg: 2, every: 0.5, dur: 4 }, moabDmg: 6 }) },
    },
    rocket: {
      name: 'Doomsday Launcher', cost: 22000, color: '#ff5722',
      desc: 'Triple homing warheads with cluster bombs. Giants melt. Ability: Armageddon.',
      base: { range: 240, rate: 0.3, attack: 'proj', count: 3, spread: 14, preferBoss: true, camo: true, ability: 'armageddon',
        proj: P({ tex: 'p_rocket', scale: 1.5, speed: 520, dmg: 0, pierce: 1, type: 'explosive', r: 9, homing: true, trail: 0xff7043,
          explode: { r: 100, dmg: 12, pierce: 80 }, moabDmg: 120, bruteDmg: 10, cluster: { n: 10, r: 30, dmg: 3, pierce: 12 } }) },
    },
    freeze: {
      name: 'Absolute Zero', cost: 16000, color: '#4fc3f7',
      desc: 'Pure cold. A huge aura that freezes everything, even giants, and shatters armor. Ability: Ice Age.',
      base: { range: 220, rate: 0.9, attack: 'aura', camo: true, ability: 'iceAge', slowAura: { mul: 0.35, moabMul: 0.55 },
        proj: P({ dmg: 8, pierce: 600, type: 'cold', armored: true, brittle: true, freeze: { dur: 2.2, moab: 0.7 }, moabDmg: 40 }) },
    },
    jelly: {
      name: 'Jelly Kraken', cost: 16000, color: '#ec407a',
      desc: 'A many-armed jelly monster. 4 homing acid blobs that slow giants and dissolve anything.',
      base: { range: 210, rate: 0.16, attack: 'proj', count: 4, spread: 18, camo: true, ability: 'jellyTsunami',
        proj: P({ tex: 'p_jelly_acid', scale: 1.4, speed: 520, dmg: 2, pierce: 3, type: 'normal', r: 9, homing: true, armored: true,
          slow: { mul: 0.3, dur: 8, soak: true, moab: true }, dot: { dmg: 8, every: 0.3, dur: 6 }, explode: { r: 55, dmg: 3, pierce: 20 }, moabDmg: 10 }) },
    },
    sniper: {
      name: 'Orbital Laser', cost: 24000, color: '#40c4ff',
      desc: 'A laser satellite in orbit. Rapid 40 damage beams that bounce and stun giants. Ability: Orbital Strike.',
      base: { range: 2000, rate: 0.06, attack: 'instant', camo: true, preferBoss: true, ability: 'orbitalStrike',
        proj: P({ dmg: 40, pierce: 1, type: 'energy', moabDmg: 40, bruteDmg: 30, bounce: 4, stun: { dur: 0.6, moab: true }, shrapnel: { n: 4, dmg: 4, pierce: 4 } }) },
    },
    tesla: {
      name: 'Thunder God', cost: 20000, color: '#b388ff',
      desc: 'Commands the storm: three massive lightning chains that jump to 10 mutants each. Ability: Wrath of Zeus.',
      base: { range: 200, rate: 0.12, attack: 'chain', count: 3, camo: true, ability: 'wrathOfZeus',
        proj: P({ dmg: 8, pierce: 1, type: 'energy', moabDmg: 30, bruteDmg: 10, chain: { jumps: 10, range: 120 }, stun: { dur: 0.25 } }) },
    },
    pilot: {
      name: 'Minion Air Force', cost: 22000, color: '#ffd83a',
      desc: 'Three golden jets with homing darts and missiles circle the battlefield. Ability: Carpet Bomb.',
      base: { range: 150, rate: 0.12, attack: 'plane', planes: 3, orbit: 95, planeSpeed: 2.2, camo: true, count: 2, spread: 6, ability: 'carpetBomb',
        proj: P({ tex: 'p_dart', speed: 900, dmg: 4, pierce: 4, r: 5, armored: true, homing: true, moabDmg: 6 }),
        alt: { every: 4, proj: P({ tex: 'p_rocket', speed: 600, dmg: 0, pierce: 1, type: 'explosive', r: 8, homing: true, explode: { r: 60, dmg: 6, pierce: 30 }, moabDmg: 40 }) } },
    },
    rockstar: {
      name: 'Rock Legend', cost: 18000, color: '#ff4081',
      desc: 'A stadium-sized concert. Five giant sound waves, stuns, knockback, and the whole band buffs nearby towers.',
      base: { range: 200, rate: 0.18, attack: 'proj', count: 5, spread: 18, camo: true, ability: 'encore',
        buff: { range: 0.1, rate: 0.15, pierce: 1, camo: false, armored: false, discount: 0 }, buffRange: 200,
        proj: P({ tex: 'p_wave', speed: 460, dmg: 6, pierce: 40, type: 'normal', r: 18, life: 1.1, knock: 4, stun: { dur: 0.4 }, moabDmg: 10, bruteDmg: 6 }) },
    },
    farm: {
      name: 'Banana Republic', cost: 45000, color: '#ffca28',
      desc: 'A whole banana nation. 24 golden bananas per round, auto-collected, plus $6000 every round.',
      base: { range: 70, rate: 999, attack: 'none', bananas: 24, value: 120, valueMul: 2.5, golden: true, autoCollect: true, flat: 6000, ability: 'bananaRain' },
    },
    lab: {
      name: "Nefario's Doomsday Lab", cost: 50000, color: '#e040fb',
      desc: 'Massive buffs (+20% range, 30% faster, +2 pierce, camo, armor) in a huge radius, 25% discounts and a doom-laser turret.',
      base: { range: 280, rate: 0.07, attack: 'instant', camo: true, ability: 'labOverload', flat: 1000,
        buff: { range: 0.2, rate: 0.3, pierce: 2, camo: true, armored: true, discount: 0.25 },
        proj: P({ dmg: 20, pierce: 1, type: 'energy', moabDmg: 30, bounce: 2 }) },
    },
    super: {
      name: 'Banana Galaxy God', cost: 120000, color: '#fff176',
      desc: 'The ultimate minion. Homing star blasts with 30 damage and 30 pierce. Ability: Supernova.',
      base: { range: 280, rate: 0.04, attack: 'proj', count: 3, spread: 6, camo: true, ability: 'supernova',
        proj: P({ tex: 'p_sun', speed: 1100, dmg: 30, pierce: 30, type: 'energy', r: 11, homing: true, moabDmg: 50, bruteDmg: 10, knock: 2, trail: 0xffe082 }) },
    },
  };
  Object.keys(FUSIONS).forEach((k) => {
    MT.TOWERS[k].fusion = FUSIONS[k];
  });

  // ---------------------------------------------------------------- abilities
  MT.ABILITIES = {
    bananaFrenzy: { name: 'Banana Frenzy', cd: 45, icon: 'ab_banana', desc: 'All Banana Throwers attack 3x faster for 12s.' },
    megaMissile: { name: 'Mega Missile', cd: 30, icon: 'ab_missile', desc: '1500 damage to the strongest giant.' },
    snowstorm: { name: 'Snowstorm', cd: 50, icon: 'ab_snow', desc: 'Freeze everything on screen.' },
    jellyStorm: { name: 'Jelly Storm', cd: 50, icon: 'ab_jelly', desc: 'Slow and dissolve everything on screen.' },
    supplyDrop: { name: 'Supply Drop', cd: 60, icon: 'ab_crate', desc: 'Drops $1500 in cash.' },
    overdrive: { name: 'Lab Overdrive', cd: 60, icon: 'ab_bolt', desc: 'Nearby towers attack 2x faster for 15s.' },
    darkDome: { name: 'Dark Dome', cd: 90, icon: 'ab_dark', desc: 'Destroys every small mutant on screen, 3000 damage to giants.' },
    lightningStorm: { name: 'Lightning Storm', cd: 45, icon: 'ab_zap', desc: '18 lightning bolts strike mutants all over the map.' },
    bombingRun: { name: 'Bombing Run', cd: 50, icon: 'ab_bomber', desc: 'Bombers carpet-bomb the whole track.' },
    papoySong: { name: 'Papoy Song', cd: 50, icon: 'ab_note', desc: 'Every mutant dances in place for 4s (giants 2s).' },
    // heroes
    shrinkRay: { name: 'Shrink Ray', cd: 40, icon: 'ab_shrink', desc: 'Every mutant on screen shrinks one layer.' },
    moonHeist: { name: 'Moon Heist', cd: 60, icon: 'ab_moon', desc: '3000 damage to the biggest giant.' },
    lipstickTaser: { name: 'Lipstick Taser', cd: 35, icon: 'ab_lipstick', desc: 'Zaps every mutant near Lucy and stuns them.' },
    airstrike: { name: 'AVL Airstrike', cd: 60, icon: 'ab_jet', desc: 'A jet carpet-bombs the entire track.' },
    fartGun: { name: 'Fart Gun', cd: 35, icon: 'ab_fartgun', desc: 'A colossal stink blast around Nefario.' },
    antidote: { name: 'Antidote Serum', cd: 90, icon: 'ab_serum', desc: 'Cures every small mutant on screen. Giants lose 20% health.' },
    stampede: { name: 'Minion Stampede', cd: 40, icon: 'ab_stampede', desc: 'A horde of minions charges down the track.' },
    giantKevin: { name: 'GIANT KEVIN', cd: 70, icon: 'ab_giant', desc: 'Kevin grows huge for 10s and stomps everything nearby.' },
    piranhaFrenzy: { name: 'Piranha Frenzy', cd: 40, icon: 'ab_piranha', desc: 'Piranhas devour the 6 strongest mutants.' },
    pyramidDrop: { name: 'Pyramid Heist', cd: 70, icon: 'ab_pyramid', desc: 'Drops a stolen pyramid on the biggest giant: 5000 damage.' },
    // super fusions
    bananaApocalypse: { name: 'Banana Apocalypse', cd: 50, icon: 'ab_apocalypse', desc: '30 golden banana meteors rain onto the track.' },
    nuclearToot: { name: 'Nuclear Toot', cd: 60, icon: 'ab_nuke', desc: 'Everything on screen takes 30 damage and is poisoned. 2500 to giants.' },
    armageddon: { name: 'Armageddon', cd: 55, icon: 'ab_armageddon', desc: '10 mega missiles hit the strongest giants.' },
    iceAge: { name: 'Ice Age', cd: 60, icon: 'ab_iceage', desc: 'Freezes EVERYTHING, even giants, for 5 seconds.' },
    jellyTsunami: { name: 'Jelly Tsunami', cd: 55, icon: 'ab_tsunami', desc: 'A jelly wave washes all mutants back along the track.' },
    orbitalStrike: { name: 'Orbital Strike', cd: 50, icon: 'ab_orbital', desc: 'A sky laser burns the strongest giant for 12000 damage.' },
    wrathOfZeus: { name: 'Wrath of Zeus', cd: 45, icon: 'ab_zeus', desc: '45 giant lightning bolts strike all over the map.' },
    carpetBomb: { name: 'Carpet Bomb', cd: 45, icon: 'ab_bomber', desc: 'Heavy bombers flatten the whole track.' },
    encore: { name: 'Encore!', cd: 55, icon: 'ab_encore', desc: 'Every mutant dances for 6s (giants 3s) while the music hurts.' },
    bananaRain: { name: 'Banana Rain', cd: 60, icon: 'ab_bananarain', desc: 'Golden bananas rain from the sky: instant cash.' },
    labOverload: { name: 'Lab Overload', cd: 70, icon: 'ab_overload', desc: 'Every tower on the map attacks 2x faster for 20s.' },
    supernova: { name: 'Supernova', cd: 100, icon: 'ab_supernova', desc: 'A star explodes: destroys every small mutant, 25000 damage to giants.' },
  };
})();
