// Three more heroes with new roles, unlocked with Gru Coins:
//  - Dru (economy): bananas every round, richer pops and discounts near him
//  - Agnes (support): buffs the towers around her and patches up lives
//  - El Macho (tank): short-range punches, slows mutants, shrugs off boss attacks
(function () {
  const P = (o) => Object.assign({ tex: 'p_banana', speed: 500, dmg: 1, pierce: 1, type: 'sharp', r: 6, spin: 0 }, o);
  const BUFF = (o) => Object.assign({ range: 0, rate: 0, pierce: 0, camo: false, armored: false, discount: 0 }, o);

  Object.assign(MT.HEROES, {
    dru: {
      id: 'dru', name: 'Dru', title: "Gru's Rich Twin", cost: 620, key: 'H', size: 18, color: '#ffd740', partner: 'potion',
      desc: 'Hero. Makes money: bananas every round and richer pops nearby. Abilities: Family Fortune, Golden Supercar.',
      quotes: ['Brother!', 'Let us be villains together!', 'I have SO much money!'],
      base: { range: 140, rate: 0.7, attack: 'proj', proj: P({ tex: 'p_goldcoin', speed: 620, dmg: 1, pierce: 2, type: 'normal', r: 7, spin: 14 }) },
      levels: [
        null,
        { desc: 'Golden coins that pierce 2 mutants.' },
        { desc: 'Pocket money: +$60 every round.', fx: (s) => { s.flat = 60; } },
        { desc: 'Ability: FAMILY FORTUNE drops a pile of cash.', fx: (s) => { s.ability = 'familyFortune'; } },
        { desc: '+1 pierce, +15 range.', fx: (s) => { s.proj.pierce += 1; s.range += 15; } },
        { desc: 'Gold Rush: +15% bananas for pops near Dru.', fx: (s) => { s.cashAura = { r: 170, pct: 0.15 }; } },
        { desc: 'Camo detection, +1 damage.', fx: (s) => { s.camo = true; s.proj.dmg += 1; } },
        { desc: 'Towers near Dru cost 6% less.', fx: (s) => { s.buff = BUFF({ discount: 0.06 }); s.buffRange = 170; } },
        { desc: '+$150 every round, Gold Rush +25%.', fx: (s) => { s.flat = 150; s.cashAura.pct = 0.25; } },
        { desc: '+2 damage, 25% faster, +6 damage to giants.', fx: (s) => { s.proj.dmg += 2; s.rate *= 0.75; s.proj.moabDmg = 6; } },
        { desc: 'Ability: GOLDEN SUPERCAR! Its pops pay double.', fx: (s) => { s.ability2 = 'goldenCar'; s.flat = 250; } },
      ],
    },

    agnes: {
      id: 'agnes', name: 'Agnes', title: 'Unicorn Super-Fan', cost: 560, key: 'H', size: 16, color: '#ff9ce6', partner: 'rockstar',
      desc: 'Hero. Rainbow stars, buffs the towers around her and heals lives. Abilities: It\'s So Fluffy!, Unicorn Parade.',
      quotes: ["It's so fluffy!", 'Unicorns are real!', 'I love you, Gru!'],
      base: { range: 135, rate: 0.75, attack: 'proj', proj: P({ tex: 'p_rainbow', speed: 520, dmg: 1, pierce: 3, type: 'normal', r: 7, spin: 10, homing: true }) },
      levels: [
        null,
        { desc: 'Homing rainbow stars.' },
        { desc: 'Towers near Agnes get +10% range.', fx: (s) => { s.buff = BUFF({ range: 0.1 }); s.buffRange = 160; } },
        { desc: "Ability: IT'S SO FLUFFY! Mutants stare, +3 lives.", fx: (s) => { s.ability = 'soFluffy'; } },
        { desc: '+1 pierce, +15 range.', fx: (s) => { s.proj.pierce += 1; s.range += 15; } },
        { desc: 'Towers near Agnes attack 10% faster.', fx: (s) => { s.buff.rate = 0.1; } },
        { desc: 'Camo detection, +1 damage, +1 life per round.', fx: (s) => { s.camo = true; s.proj.dmg += 1; s.lifeRegen = 1; } },
        { desc: 'Sticky rainbows slow mutants.', fx: (s) => { s.proj.slow = { mul: 0.8, dur: 1.2 }; } },
        { desc: 'Towers near Agnes: +1 pierce and Camo detection.', fx: (s) => { s.buff.pierce = 1; s.buff.camo = true; } },
        { desc: '+2 damage, 20% faster, +2 lives per round.', fx: (s) => { s.proj.dmg += 2; s.rate *= 0.8; s.lifeRegen = 2; } },
        { desc: 'Ability: UNICORN PARADE tramples every track!', fx: (s) => { s.ability2 = 'unicornParade'; s.buff.rate = 0.15; } },
      ],
    },

    elmacho: {
      id: 'elmacho', name: 'El Macho', title: 'Retired Super-Villain', cost: 680, key: 'H', size: 20, color: '#ff5252', partner: 'rocket',
      desc: 'Hero. A tank: punches crowds, slows mutants, can\'t be knocked out. Abilities: Pollito!, Shark Rocket.',
      quotes: ['I am EL MACHO!', 'Pollito, attack!', 'Olé!'],
      base: { range: 70, rate: 0.6, attack: 'melee', proj: P({ dmg: 2, pierce: 4, type: 'normal', r: 34, knock: 2, moabDmg: 4 }) },
      levels: [
        null,
        { desc: 'Punches hit the target and everything next to it.' },
        { desc: '+10 range, punches hit 1 more mutant.', fx: (s) => { s.range += 10; s.proj.pierce += 1; } },
        { desc: 'Ability: POLLITO! pecks the strongest mutants.', fx: (s) => { s.ability = 'pollito'; } },
        { desc: 'Intimidate: mutants nearby walk 20% slower.', fx: (s) => { s.slowAura = { mul: 0.8, moabMul: 0.9 }; } },
        { desc: '+2 damage, punches knock mutants back.', fx: (s) => { s.proj.dmg += 2; s.proj.knock = 5; } },
        { desc: 'Camo detection, +15 range.', fx: (s) => { s.camo = true; s.range += 15; } },
        { desc: 'Unbreakable: boss attacks can\'t knock him out.', fx: (s) => { s.tank = true; s.proj.dmg += 1; } },
        { desc: '+15 damage to giants, +4 to Barrel Brutes.', fx: (s) => { s.proj.moabDmg += 15; s.proj.bruteDmg = 4; } },
        { desc: 'Punches 25% faster, hit 2 more mutants.', fx: (s) => { s.rate *= 0.75; s.proj.pierce += 2; } },
        { desc: 'Ability: SHARK ROCKET into the biggest giant!', fx: (s) => { s.ability2 = 'sharkRocket'; s.proj.moabDmg += 10; } },
      ],
    },
  });
  MT.HERO_ORDER.push('dru', 'agnes', 'elmacho');
  // Gru Coins needed to unlock a hero (the original five are free)
  MT.HERO_UNLOCK = { dru: 200, agnes: 300, elmacho: 400 };

  Object.assign(MT.ABILITIES, {
    familyFortune: { name: 'Family Fortune', cd: 45, icon: 'ab_fortune', desc: 'Dru drops a pile of cash: more bananas the later the round.' },
    goldenCar: { name: 'Golden Supercar', cd: 60, icon: 'ab_car', desc: 'A golden supercar races down every track, smashing mutants. Every pop pays double.' },
    soFluffy: { name: "It's So Fluffy!", cd: 40, icon: 'ab_fluffy', desc: 'Every mutant near Agnes stops to stare for 3s (giants 1.5s) and you get 3 lives back.' },
    unicornParade: { name: 'Unicorn Parade', cd: 60, icon: 'ab_unicorn', desc: 'A giant rainbow unicorn charges down every track, trampling and stunning mutants.' },
    pollito: { name: 'Pollito!', cd: 40, icon: 'ab_pollito', desc: 'El Macho\'s chicken pecks the 4 strongest mutants to pieces.' },
    sharkRocket: { name: 'Shark Rocket', cd: 70, icon: 'ab_shark', desc: 'El Macho rides a rocket-shark into the biggest giant: 6000 damage and a huge blast.' },
  });
})();
