// Saved games: a classic game is written to storage between rounds (see
// GameScene.autosave) and can be continued later from the main menu or the
// difficulty picker. Only what matters between two rounds is kept: towers
// with their upgrades, fusions, POWER UP stars and hero levels, bananas, lives, the round,
// the report numbers and the power traps still lying on the track.
(function () {
  const VERSION = 1;

  function cooldowns(t) {
    const out = {};
    for (const k in t.abilityCd) if (t.abilityCd[k] > 0.5) out[k] = Math.round(t.abilityCd[k] * 10) / 10;
    return out;
  }

  function towerState(t) {
    const o = {
      type: t.type, x: Math.round(t.x), y: Math.round(t.y), spent: t.spent, pops: t.pops, dmg: Math.round(t.dmg), earned: Math.round(t.earned),
      tm: t.targetName, cd: cooldowns(t),
    };
    if (t.spot) o.spot = t.spot;
    if (t.hero) {
      Object.assign(o, { hero: 1, level: t.level, xp: t.xp, stars: t.stars, sxp: t.sxp });
      // Gru's plan, Nefario's gadgets, Agnes' Best Friend
      const tr = MT.HeroTraits.save(t);
      if (tr) o.trait = tr;
    }
    else if (t.omega) o.subs = t.subs.map((u) => ({ type: u.type, pops: u.pops, dmg: Math.round(u.dmg), earned: Math.round(u.earned), cd: cooldowns(u) }));
    else {
      o.tiers = t.tiers.slice();
      if (t.fused) o.fused = 1;
      if (t.ultimate) o.ult = 1;
    }
    if (t.powerLv) o.pl = t.powerLv;
    return o;
  }

  function save(g) {
    const run = {
      v: VERSION, map: g.mapDef.id, diff: g.diff.id, hero: g.heroId,
      mapName: g.mapDef.name, diffName: g.diff.name, heroName: g.heroDef.name,
      round: g.round, money: Math.floor(g.money), lives: g.lives, maxLives: g.maxLives,
      freeplay: g.freeplay, won: g.won, totalPops: g.totalPops, cheated: g.cheated, heroUsed: g.heroUsed, coinsEarned: g.coinsEarned,
      stat: Object.assign({}, g.stat, { time: Math.round(g.stat.time), sold: g.stat.sold.slice(-40), rounds: g.stat.rounds.slice(-250) }),
      seenBoss: g.seenBoss, fusionHinted: g.fusionHinted, spawnCounter: g.spawnCounter % 2,
      towers: g.towers.filter((t) => !t.fusing && !t.dead).map(towerState),
      peels: g.traps.filter((tr) => tr.keep === 'peel' && !tr.gone).map((tr) => [Math.round(tr.x), Math.round(tr.y), tr.pierce]),
      sprinklers: g.camoTraps.map((ct) => [Math.round(ct.x), Math.round(ct.y), ct.left]),
      mapFx: g.mapFx ? g.mapFx.saveState() : null,
    };
    MT.Save.putRun(g.runKey(), run);
  }

  function common(t, o) {
    t.spent = o.spent || 0;
    t.pops = o.pops || 0;
    t.dmg = o.dmg || 0;
    t.earned = o.earned || 0;
    t.abilityCd = Object.assign({}, o.cd || {});
    if (o.tm) {
      t.targetName = o.tm;
      t.syncTarget();
    }
    if (o.spot) t.spot = { x: o.spot.x, y: o.spot.y };
    t.age = 1; // no pop-in animation
  }

  function buildTower(g, o) {
    let t;
    if (o.hero) {
      if (!MT.HEROES[o.type]) return null;
      t = new MT.Tower(g, o.type, o.x, o.y, true);
      t.level = o.level || 1;
      t.xp = o.xp || 0;
      t.stars = o.stars || 0;
      t.sxp = o.sxp || 0;
      t.recompute();
      t.refreshTexture();
      if (t.stars) t.makeHeroVisuals();
      MT.HeroTraits.load(g, t, o.trait);
      g.heroPlaced = true;
    } else if (o.subs) {
      if (o.subs.some((u) => !MT.TOWERS[u.type])) return null;
      const subs = o.subs.map((u, i) => {
        const c = new MT.Tower(g, u.type, o.x, o.y, false, { component: true });
        Object.assign(c, MT.TowerArt.OMEGA_SLOTS[i]);
        common(c, Object.assign({ tm: o.tm }, u));
        return c;
      });
      t = new MT.Tower(g, 'omega', o.x, o.y, false, { subs });
      t.recompute();
      t.refreshTexture();
      t.makeFusedVisuals();
    } else {
      if (!MT.TOWERS[o.type]) return null;
      t = new MT.Tower(g, o.type, o.x, o.y, false);
      t.tiers = (o.tiers || [0, 0, 0]).slice(0, 3);
      if (o.fused) t.fused = true;
      if (o.ult) {
        t.ultimate = true;
        t.size = t.def.size + 8;
      }
      t.recompute();
      t.refreshTexture();
      if (t.fused) t.makeFusedVisuals();
    }
    if (o.pl && (t.ultimate || t.omega)) MT.Fusion.setPower(t, o.pl);
    common(t, o);
    return t;
  }

  function restore(g, run) {
    g.round = run.round || 0;
    g.money = run.money != null ? run.money : g.money;
    g.maxLives = Math.max(g.maxLives, run.maxLives || 0);
    g.lives = run.lives != null ? run.lives : g.lives;
    g.freeplay = !!run.freeplay;
    g.won = !!run.won;
    g.totalPops = run.totalPops || 0;
    g.popsBanked = g.totalPops; // already counted when the game was saved
    g.cheated = !!run.cheated;
    g.heroUsed = !!run.heroUsed;
    g.coinsEarned = run.coinsEarned || 0;
    Object.assign(g.stat, run.stat || {});
    g.stat.sold = (run.stat && run.stat.sold) || [];
    g.stat.rounds = (run.stat && run.stat.rounds) || [];
    g.seenBoss = run.seenBoss || {};
    g.fusionHinted = run.fusionHinted || {};
    g.spawnCounter = run.spawnCounter || 0;
    if (g.mapFx && run.mapFx) g.mapFx.loadState(run.mapFx);
    (run.towers || []).forEach((o) => {
      const t = buildTower(g, o);
      if (t) g.towers.push(t);
    });
    (run.peels || []).forEach(([x, y, n]) => MT.Powers.peelPile(g, x, y, n));
    (run.sprinklers || []).forEach(([x, y, n]) => MT.Powers.sprinkler(g, x, y, n));
    MT.HeroTraits.afterLoad(g);
    g.recalcBuffs();
    g.hud.onTowersChanged();
    g.hud.onRoundState();
    g.hud.refreshPreview();
  }

  // short description for the CONTINUE buttons
  function label(run) {
    return `${run.mapName} · ${run.diffName} · Round ${run.round + 1}${run.freeplay ? ' (freeplay)' : ''}`;
  }

  MT.RunSave = { save, restore, label, VERSION };
})();
