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
  MT.ENEMY_ORDER = ['pip', 'grumble', 'chomper', 'dasher', 'zoomer', 'rascal', 'jailbird', 'hulk', 'brute', 'tincan', 'mega', 'titan', 'zeppelin'];
})();
