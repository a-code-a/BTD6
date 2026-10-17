// Three more heroes with new roles, unlocked with Gru Coins:
//  - Dru (economy): interest on saved bananas, richer pops and discounts near him
//  - Agnes (support): one Best Friend tower that grows stronger, patches up lives
//  - El Macho (tank): holds mutants in place, punches crowds, shrugs off boss attacks
(function () {
  const P = (o) => Object.assign({ tex: 'p_banana', speed: 500, dmg: 1, pierce: 1, type: 'sharp', r: 6, spin: 0 }, o);
  const BUFF = (o) => Object.assign({ range: 0, rate: 0, pierce: 0, camo: false, armored: false, discount: 0 }, o);

  Object.assign(MT.HEROES, {
    dru: {
      id: 'dru', name: 'Dru', title: "Gru's Rich Twin", cost: 620, key: 'H', size: 18, color: '#ffd740', partner: 'potion',
      desc: 'Hero. The investor: pays interest on the bananas you save, so spending less now means more later. Abilities: Family Fortune, Golden Supercar.',
      trait: { id: 'invest', name: 'Investor', desc: 'At the end of every round Dru pays interest on the bananas you did NOT spend (up to a limit). Spend now for defence, or save up for a big payout? The upgrade panel shows what the next payout will be.' },
      quotes: ['Brother!', 'Let us be villains together!', 'I have SO much money!'],
      base: { range: 140, rate: 0.7, attack: 'proj', interest: { pct: 0.02, cap: 150 }, proj: P({ tex: 'p_goldcoin', speed: 620, dmg: 1, pierce: 2, type: 'normal', r: 7, spin: 14 }) },
      levels: [
        null,
        { desc: 'Golden coins. INVESTOR: 2% interest on your saved bananas every round (max $150).' },
        { desc: '+1 pierce, +15 range.', fx: (s) => { s.proj.pierce += 1; s.range += 15; } },
        { desc: 'Ability: FAMILY FORTUNE drops a pile of cash.', fx: (s) => { s.ability = 'familyFortune'; } },
        { desc: 'Interest 3% (max $400).', fx: (s) => { s.interest = { pct: 0.03, cap: 400 }; } },
        { desc: 'Gold Rush: +15% bananas for pops near Dru.', fx: (s) => { s.cashAura = { r: 170, pct: 0.15 }; } },
        { desc: 'Camo detection, +1 damage.', fx: (s) => { s.camo = true; s.proj.dmg += 1; } },
        { desc: 'Towers near Dru cost 6% less.', fx: (s) => { s.buff = BUFF({ discount: 0.06 }); s.buffRange = 170; } },
        { desc: 'Interest 4% (max $800), Gold Rush +25%.', fx: (s) => { s.interest = { pct: 0.04, cap: 800 }; s.cashAura.pct = 0.25; } },
        { desc: '+2 damage, 25% faster, +6 damage to giants.', fx: (s) => { s.proj.dmg += 2; s.rate *= 0.75; s.proj.moabDmg = 6; } },
        { desc: 'Ability: GOLDEN SUPERCAR! Its pops pay double. Interest 5% (max $1,500).', fx: (s) => { s.ability2 = 'goldenCar'; s.interest = { pct: 0.05, cap: 1500 }; } },
      ],
    },

    agnes: {
      id: 'agnes', name: 'Agnes', title: 'Unicorn Super-Fan', cost: 560, key: 'H', size: 16, color: '#ff9ce6', partner: 'rockstar',
      desc: 'Hero. Picks a Best Friend tower that gets stronger every round it stays her friend, and heals lives. Abilities: It\'s So Fluffy!, Unicorn Parade.',
      trait: { id: 'friend', name: 'Best Friend', desc: 'Click FRIEND, then one of your towers: it becomes her Best Friend and attacks faster. Every round it stays her friend it earns a heart that makes it even stronger. Picking a new friend starts the hearts again from zero, so choose well!' },
      quotes: ["It's so fluffy!", 'Unicorns are real!', 'I love you, Gru!'],
      base: { range: 135, rate: 0.75, attack: 'proj', friend: { rate: 0.1, range: 0, pierce: 0, dmg: 0, camo: false, hearts: 3 }, proj: P({ tex: 'p_rainbow', speed: 520, dmg: 1, pierce: 3, type: 'normal', r: 7, spin: 10, homing: true }) },
      levels: [
        null,
        { desc: 'Homing rainbow stars. BEST FRIEND: one tower attacks 10% faster, +5% per heart (one per round, max 3).' },
        { desc: 'Best Friend also gets +15% range.', fx: (s) => { s.friend.range = 0.15; } },
        { desc: "Ability: IT'S SO FLUFFY! Mutants stare, +3 lives.", fx: (s) => { s.ability = 'soFluffy'; } },
        { desc: '+1 pierce, +15 range.', fx: (s) => { s.proj.pierce += 1; s.range += 15; } },
        { desc: 'Best Friend: +1 pierce and Camo detection.', fx: (s) => { s.friend.pierce = 1; s.friend.camo = true; } },
        { desc: 'Camo detection, +1 damage, +1 life per round.', fx: (s) => { s.camo = true; s.proj.dmg += 1; s.lifeRegen = 1; } },
        { desc: 'Sticky rainbows slow mutants. Every heart also gives +10% damage.', fx: (s) => { s.proj.slow = { mul: 0.8, dur: 1.2 }; s.friend.dmg = 0.1; } },
        { desc: 'Towers near Agnes attack 10% faster. Up to 5 hearts.', fx: (s) => { s.buff = BUFF({ rate: 0.1 }); s.buffRange = 150; s.friend.hearts = 5; } },
        { desc: '+2 damage, 20% faster, +2 lives per round.', fx: (s) => { s.proj.dmg += 2; s.rate *= 0.8; s.lifeRegen = 2; } },
        { desc: 'Ability: UNICORN PARADE tramples every track! Best Friend +15% speed.', fx: (s) => { s.ability2 = 'unicornParade'; s.friend.rate = 0.25; } },
      ],
    },

    elmacho: {
      id: 'elmacho', name: 'El Macho', title: 'Retired Super-Villain', cost: 680, key: 'H', size: 20, color: '#ff5252', partner: 'rocket',
      desc: 'Hero. A roadblock: grabs the mutants that reach him and holds them in place while your towers hit them. Abilities: Pollito!, Shark Rocket.',
      trait: { id: 'block', name: 'Roadblock', desc: 'Small mutants that walk into El Macho\'s reach are HELD in place, a few at a time. Holding costs Guard (the bar under his feet): when it runs out he lets go and catches his breath. Put him at a corner next to your splash towers!' },
      quotes: ['I am EL MACHO!', 'Pollito, attack!', 'Olé!'],
      base: { range: 70, rate: 0.6, attack: 'melee', block: { hold: 3, guard: 3, giants: 0 }, proj: P({ dmg: 2, pierce: 4, type: 'normal', r: 34, knock: 2, moabDmg: 4 }) },
      levels: [
        null,
        { desc: 'Punches hit crowds. ROADBLOCK: holds up to 3 small mutants in place (3s of Guard, refills while free).' },
        { desc: '+10 range, punches hit 1 more mutant.', fx: (s) => { s.range += 10; s.proj.pierce += 1; } },
        { desc: 'Ability: POLLITO! pecks the strongest mutants.', fx: (s) => { s.ability = 'pollito'; } },
        { desc: 'Intimidate: mutants nearby walk 20% slower. Holds 4.', fx: (s) => { s.slowAura = { mul: 0.8, moabMul: 0.9 }; s.block.hold = 4; } },
        { desc: '+2 damage. Guard lasts 4.5s.', fx: (s) => { s.proj.dmg += 2; s.block.guard = 4.5; } },
        { desc: 'Camo detection, +15 range.', fx: (s) => { s.camo = true; s.range += 15; } },
        { desc: 'Unbreakable: boss attacks can\'t knock him out. Holds 6, Guard 6s.', fx: (s) => { s.tank = true; s.proj.dmg += 1; s.block.hold = 6; s.block.guard = 6; } },
        { desc: '+15 damage to giants, +4 to Barrel Brutes. Wrestles giants: they walk 40% slower in his reach.', fx: (s) => { s.proj.moabDmg += 15; s.proj.bruteDmg = 4; s.block.giants = 0.6; } },
        { desc: 'Punches 25% faster, hit 2 more mutants.', fx: (s) => { s.rate *= 0.75; s.proj.pierce += 2; } },
        { desc: 'Ability: SHARK ROCKET into the biggest giant! Holds 8.', fx: (s) => { s.ability2 = 'sharkRocket'; s.proj.moabDmg += 10; s.block.hold = 8; } },
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
