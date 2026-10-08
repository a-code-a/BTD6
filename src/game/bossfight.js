// Boss Battles: three villains with their own attack patterns and three
// phases each, plus the flow of the boss game mode (build, summon the boss,
// escort waves keep coming until the boss goes down or escapes).
(function () {
  const U = MT.util;
  const S = MT.Draw.S;

  const TIERS = {
    normal: { name: 'Normal', hp: 1, cd: 1, cash: 12000, wave: 25, color: '#7be35a' },
    elite: { name: 'Elite', hp: 2.5, cd: 0.72, cash: 20000, wave: 18, color: '#ff5a4a' },
  };

  // attack plans per phase: [move, cooldown(s), option]
  const BOSSES = {
    vector: {
      map: 'desert', color: '#ff8a3a', tint: 0xff8a3a, shield: 0x6ecbff,
      tag: 'Squids that ink your towers, shields and rocket boots. Oh yeah!',
      phaseNames: ['SQUID BARRAGE!', 'ROCKET BOOTS!'],
      moves: [
        [['squid', 5, 1], ['summon', 15, [['jailbird', 2], ['shield', 1]]]],
        [['squid', 5, 2], ['summon', 13, [['jetpack', 2], ['hulk', 1]]]],
        [['squid', 4, 2], ['dash', 12, 100], ['summon', 12, [['mole', 3], ['shield', 1]]]],
      ],
      onPhase: [null, (g, e) => selfShield(g, e, 0.09), (g, e) => dash(g, e, 120)],
      quotes: ['Squid launcher!', 'Oh yeah!', 'Fear my piranhas!', 'Committing crimes with both direction AND magnitude!'],
    },
    bratt: {
      map: 'beach', color: '#c06bff', tint: 0xc06bff, shield: 0xff8fd0,
      tag: 'Bubblegum bombs trap your towers. Then the 80s strike back!',
      phaseNames: ['GUM SHIELD!', 'THE 80s STRIKE BACK!'],
      moves: [
        [['gum', 6, 1], ['summon', 14, [['mole', 3]]]],
        [['gum', 5, 1], ['keytar', 9, 200], ['summon', 14, [['mole', 4], ['shield', 1]]]],
        [['gum', 4.5, 2], ['keytar', 8, 220], ['summon', 12, [['jetpack', 2], ['brute', 2]]]],
      ],
      onPhase: [null, (g, e) => selfShield(g, e, 0.11), (g, e) => (e.enrage = 1.5)],
      quotes: ['I\'ve been a bad boy!', 'Dance fight!', 'Bubblegum time!', 'Bad to the bone!'],
    },
    scarlet: {
      map: 'city', color: '#ff4a6a', tint: 0xff4a6a, shield: 0xff8a80,
      tag: 'Flies in a rocket dress. Only anti-air can hurt her!',
      phaseNames: ['HYPNO-PARTY!', 'ROCKET DRESS!'],
      moves: [
        [['lava', 5.5, 1], ['summon', 13, [['glider', 6]]]],
        [['lava', 4.5, 2], ['summon', 13, [['shield', 1], ['mole', 3]]]],
        [['lava', 3.8, 2], ['dash', 12, 110], ['summon', 11, [['jetpack', 3]]]],
      ],
      onPhase: [null, (g, e) => summon(g, e, 'shield', 2, { ahead: true }), (g, e) => (e.enrage = 1.45)],
      quotes: ['Bow before the queen!', 'Lava lamps, darling!', 'Overkill? Never heard of it.', 'Mine. All mine!'],
    },
  };

  const tierOf = (game) => TIERS[game.bossTier] || TIERS.normal;

  // ---------------------------------------------------------------- brain
  function attach(game, e) {
    const B = BOSSES[e.type];
    e.ai = { timers: {}, B, talkT: 6 };
    planPhase(game, e);
  }

  function detach() {}

  function planPhase(game, e) {
    const plan = e.ai.B.moves[Math.min(e.phase, 2)];
    const k = game.mode === 'boss' ? tierOf(game).cd : 1;
    e.ai.plan = plan.map(([id, every, opt]) => ({ id, every: every * k, opt }));
    // first use comes a bit sooner than the full cooldown
    e.ai.plan.forEach((m, i) => (e.ai.timers[m.id] = m.every * (0.45 + i * 0.2)));
  }

  function update(game, e, dt) {
    const ai = e.ai;
    if (!ai || game.over) return;
    // stunned or frozen bosses think much slower: a real counter to their attacks
    const k = e.stun > 0 || e.freeze > 0 ? 0.3 : 1;
    for (const m of ai.plan) {
      ai.timers[m.id] -= dt * k;
      if (ai.timers[m.id] > 0) continue;
      ai.timers[m.id] = m.every;
      MOVES[m.id](game, e, m.opt);
    }
    ai.talkT -= dt;
    if (ai.talkT <= 0) {
      ai.talkT = 9 + Math.random() * 6;
      game.fx.speech(e.x, e.y - e.radius * 2.2, U.pick(ai.B.quotes));
    }
  }

  // ---------------------------------------------------------------- moves
  // which towers does the boss go after? strong attackers near it
  function pickTargets(game, e, n, range) {
    const free = (t) => !t.dead && !t.fusing && t.disabled <= 0 && !shielded(game, t);
    let list = game.towers.filter((t) => free(t) && t.stats.attack !== 'none' && U.dist(t.x, t.y, e.x, e.y) <= range);
    if (!list.length) list = game.towers.filter((t) => free(t) && U.dist(t.x, t.y, e.x, e.y) <= range * 1.8);
    list.sort((a, b) => b.totalPops - a.totalPops);
    const pool = list.slice(0, Math.max(n + 2, 4));
    const out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return out;
  }

  // a tower that just shook off a boss attack can't be hit again right away
  const shielded = (game, t) => t.bossImmune > game.stat.time;
  function knockOut(game, t, dur, kind) {
    if (t.dead || shielded(game, t)) return false;
    game.disableTower(t, dur, kind);
    t.bossImmune = game.stat.time + dur + 3;
    return true;
  }

  // a projectile thrown in a high arc onto a tower, with a warning reticle first
  function lob(game, e, t, tex, scale, onLand) {
    const tx = t.x, ty = t.y - 14;
    game.fx.ring(tx, t.y, 34, 0xff3030, { dur: 520, force: true, alpha: 0.9 });
    const sx = e.x + e.dir * e.radius * 0.7, sy = e.y - e.radius * 0.9;
    const img = game.add.image(sx, sy, tex).setScale(scale / S).setDepth(6500);
    const sh = game.add.image(tx, t.y + 4, 'fx_shadow').setScale(0.15, 0.1).setAlpha(0.4).setDepth(990);
    const dist = U.dist(sx, sy, tx, ty);
    const st = { k: 0 };
    let n = 0;
    game.tweens.add({
      targets: st, k: 1, duration: 520 + dist * 0.6, ease: 'Sine.easeIn',
      onUpdate: () => {
        const k = st.k;
        img.setPosition(U.lerp(sx, tx, k), U.lerp(sy, ty, k) - Math.sin(k * Math.PI) * (110 + dist * 0.22));
        img.rotation += 0.18;
        sh.setScale(0.15 + k * 0.5, 0.1 + k * 0.3);
        if ((n++ & 1) === 0) game.fx.glowTrail(img.x, img.y, e.ai ? e.ai.B.tint : 0xffffff);
      },
      onComplete: () => {
        img.destroy();
        sh.destroy();
        if (!game.over) onLand(tx, t.y);
      },
    });
  }

  function windUp(game, e) {
    e.hitT = 0.12;
    game.fx.ring(e.x, e.y - e.radius * 0.4, e.radius * 1.4, e.ai.B.tint, { dur: 300, force: true });
  }

  const MOVES = {
    squid(game, e, n) {
      const tg = pickTargets(game, e, n, 300);
      if (!tg.length) return;
      windUp(game, e);
      MT.Audio.play('squid', e.x);
      tg.forEach((t, i) => game.time.delayedCall(i * 140, () => lob(game, e, t, 'p_squid', 2, (x, y) => {
        game.fx.splat(x, y - 10, 34, 0x3b2f5c);
        knockOut(game, t, 2.2, 'ink');
        MT.Audio.play('splat', x);
      })));
    },
    gum(game, e, n) {
      const tg = pickTargets(game, e, n, 300);
      if (!tg.length) return;
      windUp(game, e);
      tg.forEach((t, i) => game.time.delayedCall(i * 160, () => lob(game, e, t, 'fx_gumball', 1.1, (x, y) => {
        // the gum bomb traps every tower near where it lands
        game.towers.forEach((o) => {
          if (U.dist(o.x, o.y, x, y) <= 60) knockOut(game, o, 2.6, 'gum');
        });
        game.fx.ring(x, y, 62, 0xff8fd0, { disc: true, dur: 380, force: true });
        game.fx.goo.particleTint = 0xff8fd0;
        game.fx.goo.explode(10, x, y - 10);
        game.fx.goo.particleTint = 0xff4f7b;
        MT.Audio.play('gum', x);
      })));
    },
    lava(game, e, n) {
      const tg = pickTargets(game, e, n, 320);
      if (!tg.length) return;
      windUp(game, e);
      tg.forEach((t, i) => game.time.delayedCall(i * 150, () => lob(game, e, t, 'fx_lavalamp', 1.1, (x, y) => {
        game.towers.forEach((o) => {
          if (U.dist(o.x, o.y, x, y) <= 50) knockOut(game, o, 2.2, 'lava');
        });
        game.fx.boom(x, y - 6, 54);
        game.fx.ring(x, y, 50, 0xff7a1a, { disc: true, dur: 420, force: true });
        MT.Audio.play('boom', x);
      })));
    },
    keytar(game, e, r) {
      // a sonic power chord: towers close to Bratt are stunned for a moment
      game.fx.shockwave(e.x, e.y, r, 0xc06bff, 600);
      game.fx.ring(e.x, e.y, r, 0xff8fd0, { disc: true, dur: 500, force: true });
      game.fx.notes.explode(10, e.x, e.y - e.radius);
      let n = 0;
      game.towers.forEach((t) => {
        if (t.dead || U.dist(t.x, t.y, e.x, e.y) > r) return;
        if (knockOut(game, t, 1.2, 'stun')) n++;
      });
      if (n) game.fx.floatText(e.x, e.y - e.radius * 2, 'KEYTAR SOLO!', '#ff8fd0', 22);
      MT.Audio.play('chord', e.x);
    },
    dash(game, e, d) {
      dash(game, e, d);
    },
    summon(game, e, list) {
      list.forEach(([type, n]) => summon(game, e, type, n));
      game.fx.floatText(e.x, e.y - e.radius * 2, 'MINIONS, ATTACK!', e.ai.B.color, 18);
    },
  };

  function summon(game, e, type, n, o = {}) {
    const flying = !!MT.ENEMIES[type].flying;
    const route = (flying ? game.airPaths : game.paths)[e.pathIndex];
    const base = flying === e.flying ? e.dist : route.project(e.x, e.y + (e.flying ? MT.Enemy.FLY : 0));
    const fort = game.mode === 'boss' && game.bossTier === 'elite';
    // reinforcements never appear past 40% of the track, so there's always time to stop them
    const cap = route.length * 0.4;
    for (let i = 0; i < n; i++) {
      const dist = Math.min(o.ahead ? base + 50 + i * 26 : base - 26 - i * 18, cap - i * 18);
      const k = game.spawnEnemy(type, { path: e.pathIndex, dist: U.clamp(dist, 0, route.length - 40), burst: true, fort });
      if (i === 0 && U.dist(k.x, k.y, e.x, e.y) > 120) game.fx.ring(k.x, k.y, 40, e.ai ? e.ai.B.tint : 0xffffff, { disc: true, dur: 400 });
    }
    game.fx.puffs.explode(10, e.x, e.y);
    game.fx.ring(e.x, e.y, e.radius * 2, e.ai ? e.ai.B.tint : 0xffffff, { dur: 400 });
  }

  function dash(game, e, d) {
    d = Math.min(d, e.remaining - 260);
    if (d <= 20) return;
    const ghost = game.add.image(e.sprite.x, e.sprite.y, e.sprite.texture.key).setOrigin(e.sprite.originX, e.sprite.originY)
      .setScale(1 / S).setFlipX(e.sprite.flipX).setAlpha(0.6).setTint(e.ai.B.tint).setDepth(e.sprite.depth - 1);
    game.tweens.add({ targets: ghost, alpha: 0, scaleX: 1.3 / S, duration: 420, onComplete: () => ghost.destroy() });
    for (let s = 0; s < d; s += 24) {
      const p = e.path.at(e.dist + s);
      game.time.delayedCall(s * 0.8, () => game.fx.dust.explode(2, p.x, p.y + (e.flying ? 0 : e.radius * 0.6)));
    }
    e.dist += d;
    const p = e.path.at(e.dist);
    e.x = p.x;
    e.y = p.y - (e.flying ? MT.Enemy.FLY : 0);
    e.burst = true;
    e.age = 0;
    game.fx.ring(e.x, e.y, e.radius * 1.8, e.ai.B.tint, { disc: true, dur: 380, force: true });
    game.shake(0.12);
    MT.Audio.play('jet', e.x);
  }

  // the boss protects itself with a one-off bubble worth a share of its health
  function selfShield(game, e, share) {
    const hp = Math.round(e.maxHp * share);
    e.bubble = { hp, max: hp, regen: 0, cd: 0, broken: 0, r: e.radius * 1.5, color: e.ai.B.shield, hitT: 0, self: true, once: true, grow: 0 };
    game.fx.floatText(e.x, e.y - e.radius * 2.2, 'SHIELD UP!', '#9fe0ff', 22);
    MT.Audio.play('shield', e.x);
  }

  // ---------------------------------------------------------------- phases
  function phase(game, e) {
    const ph = e.def.phases;
    if (e.phase >= ph.length || e.hp / e.maxHp > ph[e.phase]) return;
    e.phase++;
    const B = e.ai.B;
    e.stun = 0;
    e.freeze = 0;
    e.stunImmune = 2.5;
    e.enrage = Math.max(e.enrage, 1 + e.phase * 0.15);
    planPhase(game, e);
    const fn = B.onPhase[e.phase];
    if (fn) fn(game, e);
    game.fx.bigText(`PHASE ${e.phase + 1}`, B.color, 52, B.phaseNames[e.phase - 1]);
    game.fx.shockwave(e.x, e.y, 280, B.tint, 650);
    game.fx.vignette(B.tint, 0.5, 900);
    game.shake(0.3);
    MT.Audio.play('roar');
  }

  function onDeath(game, e) {
    if (game.mode !== 'boss' || e.type !== game.bossId || game.bossDown) return;
    game.bossDown = true;
    game.roundActive = false;
    game.slowmo = 1;
    game.fx.screenFlash(0xffffff, 0.6, 800);
    game.fx.bigText(`${e.def.name.toUpperCase()} DEFEATED!`, '#ffd83a', 50, `Boss battle won in ${fmtTime(game.stat.time)}`);
    game.time.delayedCall(2200, () => game.victory());
  }

  function fmtTime(sec) {
    const s = Math.round(sec);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // ---------------------------------------------------------------- game mode
  function startCash(game) {
    return tierOf(game).cash;
  }

  function prepare(game) {
    const def = MT.ENEMIES[game.bossId];
    game.hud.toast(`BOSS BATTLE: ${def.name}! Build your defense, then press PLAY.`, 3600, true);
  }

  function startFight(game) {
    const T = tierOf(game);
    game.roundActive = true;
    game.roundTime = 0;
    game.spawnList = [];
    game.spawnIdx = 0;
    game.round = 0;
    game.waveT = 6;
    game.bossDown = false;
    game.boss = game.spawnEnemy(game.bossId, { path: 0, dist: 0, hpMul: T.hp });
    MT.Audio.play('roundStart');
    game.hud.onRoundState();
    game.hud.refreshPreview();
  }

  function step(game, dt) {
    if (!game.roundActive || game.bossDown) return;
    game.waveT -= dt;
    if (game.waveT > 0) return;
    const T = tierOf(game);
    game.waveT = T.wave;
    game.round++;
    const spawns = MT.Rounds.flatten(MT.Rounds.bossWave(game.round, game.bossTier)).map((s) => Object.assign(s, { t: s.t + game.roundTime }));
    game.spawnList = game.spawnList.slice(game.spawnIdx).concat(spawns).sort((a, b) => a.t - b.t);
    game.spawnIdx = 0;
    // every wave pays like the end of a classic round
    const income = 250 + game.round * 50 + game.flatIncome();
    game.money += income;
    game.collectAllPickups();
    game.growBananas(game.roundTime, T.wave);
    const hero = game.towers.find((t) => t.hero);
    if (hero) game.gainHeroXp(hero, 40 + game.round * 14);
    game.hud.toast(`Wave ${game.round}  ·  +${U.money(income)}`, 1500);
    game.hud.refreshPreview();
  }

  MT.BossFight = { TIERS, BOSSES, attach, detach, update, phase, onDeath, startCash, prepare, startFight, step, fmtTime };
})();
