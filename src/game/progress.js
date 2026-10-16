// Meta progression: Gru Coins earned in every game, the research tree in
// Gru's Lab (small permanent bonuses), unlockable heroes, and achievements.
(function () {
  const U = MT.util;

  // ---------------------------------------------------------------- research
  // cat: eco / atk / def / hero (only used for the colour of the card)
  const RESEARCH = [
    { id: 'cash', cat: 'eco', name: 'Head Start', icon: 'ic_coin', costs: [60, 120, 200], desc: (n) => `+$${100 * n} bananas at the start of every game` },
    { id: 'round', cat: 'eco', name: 'Round Bonus', icon: 'ab_crate', costs: [80, 160, 260], desc: (n) => `+${10 * n}% end-of-round bananas` },
    { id: 'farm', cat: 'eco', name: 'Better Bananas', icon: 'ab_bananarain', costs: [100, 200, 320], desc: (n) => `Farm bananas are worth +${4 * n}%` },
    { id: 'sell', cat: 'eco', name: 'Fair Trade', icon: 'ab_golden', costs: [120, 240], desc: (n) => `Towers sell for ${70 + 3 * n}% of their price (normally 70%)` },
    { id: 'discount', cat: 'eco', name: 'Minion Union', icon: 'ab_overload', costs: [250, 500], desc: (n) => `Towers and upgrades cost ${2 * n}% less` },
    { id: 'speed', cat: 'atk', name: 'Banana Coffee', icon: 'ab_bolt', costs: [150, 300, 480], desc: (n) => `Every tower attacks ${2 * n}% faster` },
    { id: 'range', cat: 'atk', name: 'Binoculars', icon: 'ic_target', costs: [120, 240, 380], desc: (n) => `+${3 * n}% range for every tower` },
    { id: 'pierce', cat: 'atk', name: 'Sharper Everything', icon: 'ab_spikes', costs: [500], desc: () => '+1 pierce for every tower' },
    { id: 'giant', cat: 'atk', name: 'Giant Slayer', icon: 'ab_missile', costs: [140, 280, 450], desc: (n) => `+${n} damage per hit against giants` },
    { id: 'lives', cat: 'def', name: 'Extra Lives', icon: 'ic_heart', costs: [80, 160, 260], desc: (n) => `+${10 * n} lives in every game` },
    { id: 'regen', cat: 'def', name: 'Band-Aids', icon: 'ab_serum', costs: [150, 300], desc: (n) => `Get ${n} li${n > 1 ? 'ves' : 'fe'} back after every round` },
    { id: 'heroLevel', cat: 'hero', name: 'Hero Training', icon: 'ic_hero', costs: [200, 400], desc: (n) => `Heroes arrive at level ${1 + n}` },
    { id: 'xp', cat: 'hero', name: 'Fast Learner', icon: 'ab_legend', costs: [100, 200, 320], desc: (n) => `Heroes earn +${10 * n}% XP from rounds` },
    { id: 'cd', cat: 'hero', name: 'Quick Recharge', icon: 'ab_zap', costs: [150, 300, 480], desc: (n) => `Ability cooldowns ${4 * n}% shorter` },
  ];
  RESEARCH.forEach((r) => (r.max = r.costs.length));
  const CAT = {
    eco: { name: 'ECONOMY', color: '#ffd83a' },
    atk: { name: 'ATTACK', color: '#ff8a65' },
    def: { name: 'DEFENSE', color: '#7be35a' },
    hero: { name: 'HEROES', color: '#7fdbff' },
  };

  function perks() {
    const L = (id) => MT.Save.research(id);
    return {
      cash: 100 * L('cash'),
      round: 1 + 0.1 * L('round'),
      farm: 1 + 0.04 * L('farm'),
      sell: 0.03 * L('sell'),
      discount: 0.02 * L('discount'),
      rate: 1 - 0.02 * L('speed'),
      range: 1 + 0.03 * L('range'),
      pierce: L('pierce'),
      giant: L('giant'),
      lives: 10 * L('lives'),
      regen: L('regen'),
      heroLevel: L('heroLevel'),
      xp: 1 + 0.1 * L('xp'),
      cd: 1 - 0.04 * L('cd'),
    };
  }

  function researchLevels() {
    return RESEARCH.reduce((a, r) => a + MT.Save.research(r.id), 0);
  }

  function buyResearch(id) {
    const r = RESEARCH.find((x) => x.id === id);
    const lv = MT.Save.research(id);
    if (!r || lv >= r.max) return false;
    if (!MT.Save.spendCoins(r.costs[lv])) return false;
    MT.Save.setResearch(id, lv + 1);
    return true;
  }

  // ---------------------------------------------------------------- Gru Coins
  const ROUND_COINS = { easy: 2, medium: 3, hard: 4 };
  const WIN_COINS = { easy: 40, medium: 70, hard: 110 };
  const BOSS_COINS = { normal: 60, elite: 120 };
  const RUSH_COINS = { normal: 250, elite: 500 };
  const counts = (g) => g && !g.sandbox && !g.cheated;

  function give(g, n) {
    if (!n || !counts(g)) return 0;
    MT.Save.addCoins(n);
    g.coinsEarned += n;
    return n;
  }

  // classic round over: pay coins and bank the pops and counters
  function endRound(g) {
    if (g.sandbox) return 0;
    MT.Save.bankPops(g.totalPops - g.popsBanked, g.round);
    g.popsBanked = g.totalPops;
    bankCounters(g);
    const per = ROUND_COINS[g.diff.id] || 3;
    return give(g, g.round > g.diff.rounds ? 4 : per);
  }

  function bankCounters(g) {
    if (!counts(g)) return;
    const c = g.cnt;
    if (c.regrow) MT.Save.bump('regrowPops', c.regrow);
    if (c.healer) MT.Save.bump('healerPops', c.healer);
    c.regrow = c.healer = 0;
  }

  // a boss battle wave survived
  function bossWave(g) {
    return give(g, g.bossTier === 'elite' ? 2 : 1);
  }

  function victory(g, first) {
    bankCounters(g);
    let n;
    if (g.mode === 'boss') n = (g.rush ? RUSH_COINS : BOSS_COINS)[g.bossTier] || 60;
    else n = WIN_COINS[g.diff.id] || 60;
    // a medal (or boss tier) won for the first time pays double
    give(g, first ? n * 2 : n);
    if (counts(g) && g.heroUsed) MT.Save.addFlag('heroWins', g.heroId);
  }

  function defeat(g) {
    bankCounters(g);
  }

  function onFusion(g, kind) {
    if (counts(g)) MT.Save.bump(kind + 's');
    g.markDirty();
    MT.Ach.check(g);
  }

  function onMacho(g) {
    if (counts(g) && g.mode === 'classic') MT.Save.bump('machoKills');
  }

  // ---------------------------------------------------------------- heroes
  const heroesUnlocked = () => MT.HERO_ORDER.filter((id) => MT.Save.heroUnlocked(id)).length;
  function unlockHero(id) {
    const cost = MT.HERO_UNLOCK[id];
    if (!cost || MT.Save.heroUnlocked(id)) return true;
    if (!MT.Save.spendCoins(cost)) return false;
    MT.Save.unlockHero(id);
    return true;
  }

  MT.Progress = {
    RESEARCH, CAT, perks, researchLevels, buyResearch,
    endRound, bossWave, victory, defeat, onFusion, onMacho,
    heroesUnlocked, unlockHero, WIN_COINS, ROUND_COINS,
  };

  // ================================================================ achievements
  // prog(c) returns [value, goal]; it is done when value >= goal
  const A = (id, name, desc, icon, coins, prog) => ({ id, name, desc, icon, coins, prog });
  const yes = (b) => [b ? 1 : 0, 1];
  const ACH = [
    A('firstPop', 'First Pop!', 'Pop your very first mutant.', 'ab_banana', 10, (c) => yes(c.pops >= 1)),
    A('pops10k', 'Pop Star', 'Pop 10,000 mutants.', 'ab_note', 50, (c) => [c.pops, 10000]),
    A('pops1m', 'Pop Legend', 'Pop 1,000,000 mutants.', 'ab_supernova', 300, (c) => [c.pops, 1000000]),
    A('winEasy', 'Rookie', 'Win any map on Easy.', 'ic_medal0', 25, (c) => yes(c.medalsBy.easy > 0)),
    A('winMedium', 'Seasoned Minion', 'Win any map on Medium.', 'ic_medal1', 40, (c) => yes(c.medalsBy.medium > 0)),
    A('winHard', 'Hardcore', 'Win any map on Hard.', 'ic_medal2', 75, (c) => yes(c.medalsBy.hard > 0)),
    A('medals15', 'Medal Collector', 'Earn 15 medals.', 'ic_medal1', 100, (c) => [c.medals, 15]),
    A('medalsAll', 'All That Glitters', 'Earn every medal on every map.', 'ic_medal2', 500, (c) => [c.medals, c.medalsMax]),
    A('interactive', 'Theme Park Tycoon', 'Win on every interactive map.', 'ab_encore', 100, (c) => [c.interactive, c.interactiveMax]),
    A('fusion', 'Better Together', 'Make a Super Fusion.', 'ab_overload', 25, (c) => yes(c.fusions > 0)),
    A('ultimate', 'Ultimate Power', 'Create an Ultimate giant.', 'ab_apocalypse', 75, (c) => yes(c.ultimates > 0)),
    A('omega', 'Omega!', 'Build an Omega Mech.', 'ab_supernova', 100, (c) => yes(c.omegas > 0)),
    A('ascend', 'Ascended', 'Give a hero its first ★ star.', 'ab_legend', 30, (c) => yes(c.stars >= 1)),
    A('legend', 'Living Legend', 'Get a hero all the way to ★10.', 'ab_legend', 100, (c) => [c.stars, 10]),
    A('boss', 'Villain Vanquisher', 'Win a Boss Battle.', 'ic_skull', 50, (c) => yes(c.bossWins > 0)),
    A('eliteAll', 'Elite Hunter', 'Beat every villain on Elite.', 'ic_skull', 300, (c) => [c.eliteWins, c.bossMax]),
    A('speedrun', 'Speedrunner', 'Beat a villain on Normal in under 4:00.', 'ab_jet', 75, (c) => yes(c.fastBoss)),
    A('rush', 'Boss Rush Champion', 'Survive the Boss Rush.', 'ab_armageddon', 200, (c) => yes(c.rushWin)),
    A('macho', 'Macho Mash', 'Defeat Mutant El Macho at the end of a Hard game (or in freeplay).', 'ab_giant', 100, (c) => yes(c.macho > 0)),
    A('round100', 'Freeplay Fanatic', 'Reach round 100.', 'ab_zeus', 100, (c) => [c.best, 100]),
    A('round150', 'Banana Immortal', 'Reach round 150.', 'ab_zeus', 250, (c) => [c.best, 150]),
    A('flawless', 'Flawless', 'Win on Medium or Hard without losing a single life.', 'ic_heart', 150, (c) => yes(c.flawless)),
    A('minimal', 'Minimalist', 'Win a classic game building 8 towers or fewer.', 'ic_target', 100, (c) => yes(c.minimal)),
    A('noHero', 'Who Needs Heroes?', 'Win on Hard without placing a hero.', 'ic_hero', 100, (c) => yes(c.noHero)),
    A('tycoon', 'Banana Tycoon', 'Earn $50,000 with Banana Farms in one game.', 'ab_bananarain', 75, (c) => [c.farmCash, 50000]),
    A('spender', 'Big Spender', 'Spend $1,000,000 on towers in one game.', 'ab_golden', 75, (c) => [c.spent, 1000000]),
    A('powers', 'Power Player', 'Use 25 powers.', 'pw_boost', 50, (c) => [c.powersUsed, 25]),
    A('lab', 'Lab Rat', "Buy 10 levels of research in Gru's Lab.", 'ab_serum', 50, (c) => [c.research, 10]),
    A('heroesAll', 'The Whole Family', 'Unlock every hero.', 'ab_stampede', 100, (c) => [c.heroes, c.heroMax]),
    A('heroWins', 'Hero Team', 'Win a game with every hero.', 'ic_hero', 200, (c) => [c.heroWins, c.heroMax]),
    A('regrow', 'Weed Whacker', 'Pop 2,000 regrow mutants.', 'fx_regrow', 50, (c) => [c.regrowPops, 2000]),
    A('medic', 'No Doctors Allowed', 'Pop 150 Medic Mutants.', 'ab_serum', 50, (c) => [c.healerPops, 150]),
  ];

  // everything the achievement tests look at, from the save (plus the running game)
  function context(g, o = {}) {
    const S = MT.Save;
    const medalsBy = { easy: 0, medium: 0, hard: 0 };
    let interactive = 0;
    MT.MAPS.forEach((m) => {
      const md = S.medals(m.id);
      Object.keys(medalsBy).forEach((d) => md[d] && medalsBy[d]++);
      if (m.interactive && (md.easy || md.medium || md.hard)) interactive++;
    });
    const bosses = MT.BOSS_ORDER;
    let bossWins = 0, eliteWins = 0, fastBoss = false;
    bosses.forEach((id) => {
      const b = S.bossBest(id);
      if (b.normal || b.elite) bossWins++;
      if (b.elite) eliteWins++;
      if (b.normal && b.normal < 240) fastBoss = true;
    });
    const live = g && !g.sandbox ? g.totalPops - g.popsBanked : 0;
    const c = {
      pops: S.stats().pops + live,
      medalsBy, medals: medalsBy.easy + medalsBy.medium + medalsBy.hard, medalsMax: MT.MAPS.length * 3,
      interactive, interactiveMax: MT.MAPS.filter((m) => m.interactive).length,
      fusions: S.counter('fusions'), ultimates: S.counter('ultimates'), omegas: S.counter('omegas'),
      stars: S.counter('maxStars'),
      bossWins, eliteWins, bossMax: bosses.length, fastBoss, rushWin: !!(S.bossBest('rush').normal || S.bossBest('rush').elite),
      macho: S.counter('machoKills'),
      best: Math.max(S.stats().best || 0, g && !g.sandbox ? g.round : 0),
      powersUsed: S.counter('powersUsed'), research: researchLevels(),
      heroes: heroesUnlocked(), heroMax: MT.HERO_ORDER.length, heroWins: Object.keys(S.flagSet('heroWins')).length,
      regrowPops: S.counter('regrowPops') + (g ? g.cnt.regrow : 0), healerPops: S.counter('healerPops') + (g ? g.cnt.healer : 0),
      flawless: false, minimal: false, noHero: false, farmCash: 0, spent: 0,
    };
    if (g && g.mode === 'classic') {
      const rows = g.towers.map((t) => g.towerRecord(t, false)).concat(g.stat.sold);
      c.spent = rows.reduce((a, r) => a + r.spent, 0);
      c.farmCash = g.units().filter((t) => t.type === 'farm').reduce((a, t) => a + t.earned, 0)
        + g.stat.sold.filter((r) => r.type === 'farm').reduce((a, r) => a + r.earned, 0);
      if (o.won) {
        c.flawless = g.stat.livesLost === 0 && (g.diff.id === 'medium' || g.diff.id === 'hard');
        c.minimal = g.stat.built <= 8;
        c.noHero = g.diff.id === 'hard' && !g.heroUsed;
      }
    }
    return c;
  }

  // unlock everything that is now done; g is the running game (or null in the menus)
  function check(g, o) {
    if (g && (g.sandbox || g.cheated)) return [];
    if (g) {
      const hero = g.towers.find((t) => t.hero);
      if (hero) MT.Save.setMax('maxStars', hero.stars);
    }
    const c = context(g, o);
    const got = [];
    for (const a of ACH) {
      if (MT.Save.achieved(a.id)) continue;
      const [v, goal] = a.prog(c);
      if (v < goal) continue;
      MT.Save.setAchieved(a.id);
      MT.Save.addCoins(a.coins);
      if (g) g.coinsEarned += a.coins;
      got.push(a);
    }
    got.forEach((a) => {
      if (g && g.hud) g.hud.achievement(a);
      else MT.Ach.pending.push(a);
    });
    return got;
  }

  function progress(a) {
    const [v, goal] = a.prog(context(null));
    return { v: Math.min(v, goal), goal, done: MT.Save.achieved(a.id) };
  }

  // slide-in banner: "ACHIEVEMENT UNLOCKED"; queued so they never overlap
  function banner(scene, a, x, y, depth = 30000) {
    scene._achQ = scene._achQ || [];
    if (scene._achBusy) {
      scene._achQ.push([a, x, y, depth]);
      return;
    }
    scene._achBusy = true;
    const w = 330, h = 76;
    const c = scene.add.container(x + w + 40, y).setDepth(depth);
    const g = scene.add.graphics();
    g.fillStyle(0x140c28, 0.94);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(3, 0xffd83a, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    c.add(g);
    const icon = scene.add.image(-w / 2 + 40, 0, a.icon).setDisplaySize(50, 50);
    c.add(icon);
    c.add(MT.text(scene, -w / 2 + 76, -20, 'ACHIEVEMENT UNLOCKED!', 12, { title: true, ox: 0, color: '#ffd83a', strokeThickness: 3 }));
    const nm = MT.text(scene, -w / 2 + 76, 2, a.name, 20, { title: true, ox: 0 });
    if (nm.width > 236) nm.setScale(236 / nm.width);
    c.add(nm);
    c.add(MT.text(scene, -w / 2 + 76, 24, `+${a.coins} Gru Coins`, 13, { ox: 0, color: '#b8ffb0', strokeThickness: 3 }));
    MT.Audio.play('fusionReady');
    scene.tweens.add({ targets: c, x, duration: 380, ease: 'Back.easeOut' });
    scene.tweens.add({
      targets: c, x: x + w + 40, delay: 3000, duration: 320, ease: 'Back.easeIn',
      onComplete: () => {
        c.destroy();
        scene._achBusy = false;
        const next = scene._achQ.shift();
        if (next) banner(scene, ...next);
      },
    });
  }

  // menus: show the ones unlocked outside a game
  function flush(scene, x, y) {
    while (MT.Ach.pending.length) banner(scene, MT.Ach.pending.shift(), x, y);
  }

  MT.Ach = { LIST: ACH, check, context, progress, banner, flush, pending: [] };
  void U;
})();
