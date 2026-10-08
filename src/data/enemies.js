// Evil purple minions. Popping one reveals its children (like bloon layers).
(function () {
  const E = {
    pip: { name: 'Pip', hp: 1, speed: 1.0, children: [], radius: 10, desc: 'A small mutant. Pops in one hit.' },
    grumble: { name: 'Grumble', hp: 1, speed: 1.4, children: ['pip'], radius: 11, desc: 'Becomes a Pip when popped.' },
    chomper: { name: 'Chomper', hp: 1, speed: 1.8, children: ['grumble'], radius: 12, desc: 'Big teeth, short temper.' },
    dasher: { name: 'Dasher', hp: 1, speed: 3.2, children: ['chomper'], radius: 11, desc: 'Fast. Wears red sneakers.' },
    zoomer: { name: 'Zoomer', hp: 1, speed: 3.5, children: ['dasher'], radius: 11, desc: 'Very fast roller-skater.' },
    rascal: { name: 'Rascal', hp: 1, speed: 1.8, children: ['zoomer', 'zoomer'], radius: 13, desc: 'Splits into two Zoomers.' },
    jailbird: { name: 'Jailbird', hp: 1, speed: 1.8, children: ['rascal', 'rascal'], radius: 14, desc: 'Escaped convict. Splits into two Rascals.' },
    hulk: { name: 'Hulk', hp: 1, speed: 2.2, children: ['jailbird', 'jailbird'], radius: 16, desc: 'Muscle-bound. Splits into two Jailbirds.' },
    brute: { name: 'Barrel Brute', hp: 10, speed: 2.5, children: ['hulk', 'hulk'], radius: 17, damageStates: 4, desc: 'Hides in a barrel. Takes 10 hits.' },
    tincan: { name: 'Tin Can', hp: 1, speed: 1.0, children: ['rascal', 'rascal'], radius: 14, armored: true, desc: 'Armored! Sharp attacks (bananas) bounce off.' },
    mega: { name: 'Mega Mutant', hp: 200, speed: 1.0, children: ['brute', 'brute', 'brute', 'brute'], radius: 34, boss: true, damageStates: 5, desc: 'A giant mutant with 200 health.' },
    titan: { name: 'Purple Titan', hp: 700, speed: 0.25, children: ['mega', 'mega', 'mega', 'mega'], radius: 44, boss: true, damageStates: 5, desc: 'Armored titan. Slow but very tough.' },
    zeppelin: { name: 'PX-41 Zeppelin', hp: 4000, speed: 0.18, children: ['titan', 'titan', 'titan', 'titan'], radius: 56, boss: true, damageStates: 5, desc: 'An airship full of mutants.' },
    // ---- endgame monsters
    phantom: { name: 'Phantom Mutant', hp: 1800, speed: 0.55, children: ['mega', 'mega', 'mega', 'mega'], radius: 40, boss: true, damageStates: 5, alwaysCamo: true, blink: { every: 4.5, dist: 90 }, desc: 'A ghostly giant. Always Camo, and it blinks forward through space.' },
    mecha: { name: 'Mecha Mutant', hp: 2400, speed: 0.38, children: ['titan', 'titan'], radius: 50, boss: true, armored: true, damageStates: 5, emp: { every: 6.5, r: 165, dur: 1.8 }, desc: 'An armored battle mech. Its EMP pulse shuts down nearby towers!' },
    goo: { name: 'Goo Behemoth', hp: 3200, speed: 0.32, children: ['mega', 'mega', 'mega', 'mega', 'mega', 'mega'], radius: 50, boss: true, damageStates: 5, regen: 0.015, noSlow: true, desc: 'A wobbling mountain of goo. Regenerates and shrugs off jelly.' },
    macho: { name: 'Mutant El Macho', hp: 40000, speed: 0.22, children: ['zeppelin', 'mecha'], radius: 70, boss: true, damageStates: 5, final: true, phases: [0.66, 0.33], desc: 'El Macho drank his own PX-41 serum. The final boss!' },
    // ---- mutants that need new tactics
    glider: { name: 'Glider', hp: 2, speed: 2.0, children: [], radius: 12, flying: true, desc: 'Flaps over the scenery on bat wings and cuts every corner. Only anti-air towers can hit it.' },
    jetpack: { name: 'Jetpack Mutant', hp: 10, speed: 1.4, children: ['glider', 'glider', 'glider'], radius: 16, flying: true, fortifiable: true, desc: 'Rockets straight across the map. Pops into three Gliders. Needs anti-air.' },
    mole: { name: 'Mole Mutant', hp: 6, speed: 1.5, children: ['chomper', 'chomper'], radius: 14, fortifiable: true, burrow: { up: 150, down: 210, speed: 1.7 }, desc: 'Digs under the track for long stretches. Nothing can hit it underground, but sonar pings drag it back up.' },
    shield: { name: 'Shield Carrier', hp: 14, speed: 1.1, children: ['rascal', 'rascal'], radius: 16, fortifiable: true, shield: { r: 88, hp: 30, regen: 5, cooldown: 4 }, desc: 'Projects a bubble that soaks up every hit on the mutants around it. Pop the carrier first!' },
    // ---- boss battle villains (only appear in Boss Battles)
    vector: { name: 'Mutant Vector', hp: 5500, speed: 0.14, children: [], radius: 40, boss: true, bossFight: true, damageStates: 5, phases: [0.66, 0.33], ai: 'vector', desc: 'Vector took a sip of PX-41. Fires squids that ink your towers, hides behind shields and dashes on rocket boots.' },
    bratt: { name: 'Balthazar Bratt', hp: 7000, speed: 0.13, children: [], radius: 42, boss: true, bossFight: true, damageStates: 5, phases: [0.66, 0.33], ai: 'bratt', desc: 'The 80s child star turned villain. Bubblegum bombs trap your towers, and he calls in moles and jetpacks.' },
    scarlet: { name: 'Scarlet Overkill', hp: 4500, speed: 0.15, children: [], radius: 38, boss: true, bossFight: true, flying: true, damageStates: 5, phases: [0.66, 0.33], ai: 'scarlet', desc: 'Flies in her rocket dress, so only anti-air towers can hurt her. Lava-lamp bombs melt your towers.' },
  };

  // Red-bloon-equivalent: total hits needed to clear it completely
  const rbeCache = {};
  function rbe(type, fort) {
    const key = type + (fort ? 'f' : '');
    if (rbeCache[key] != null) return rbeCache[key];
    const e = E[type];
    let v = e.hp * (fort && (e.boss || e.armored || type === 'brute') ? 2 : 1);
    e.children.forEach((c) => (v += rbe(c, false)));
    rbeCache[key] = v;
    return v;
  }
  Object.keys(E).forEach((k) => {
    E[k].id = k;
    E[k].rbe = rbe(k, false);
  });

  MT.ENEMIES = E;
  MT.enemyRbe = rbe;
  MT.ENEMY_ORDER = ['pip', 'grumble', 'chomper', 'dasher', 'zoomer', 'rascal', 'jailbird', 'hulk', 'brute', 'tincan', 'glider', 'jetpack', 'mole', 'shield', 'mega', 'titan', 'zeppelin', 'phantom', 'mecha', 'goo', 'macho'];
  MT.BOSS_ORDER = ['vector', 'bratt', 'scarlet'];
})();
