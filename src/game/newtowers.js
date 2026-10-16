// Gameplay for the five newer minions: the Catapult's lobbed boulders, the
// Ninja's caltrops, the Alchemist's brews, the Fireman's Bee-do siren, their
// abilities, the attacks of their Ultimate forms and their Omega Beam powers.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const W = MT.CFG.MAP_W, H = MT.CFG.H;
  const G = MT.Giants;
  const FLY = MT.Enemy.FLY;

  const alive = (game) => game.enemies.filter((e) => !e.dead);
  const powerOf = (t) => (t && t.power) || 1;
  const more = (n, pw) => Math.round(n * (0.6 + 0.4 * pw));
  const byStrength = (list) => list.slice().sort((a, b) => (b.boss - a.boss) || b.def.rbe - a.def.rbe || b.hp - a.hp);
  const leadersFirst = (list) => list.slice().sort((a, b) => a.remaining - b.remaining);

  // ================================================================ Catapult
  // boulders arc over everything and burst where the target will be
  // spot: the target is a fixed point on the map (Catapult "Spot" mode); extra
  // boulders then land around it instead of going to other mutants
  function lob(g, t, target, spot) {
    const s = t.stats;
    t.aimAt(target);
    const m = t.muzzle();
    const targets = [target];
    if (spot) {
      while (targets.length < s.count) targets.push(null);
    } else if (s.count > 1) {
      // extra boulders go to the next mutants in range, or land around the first
      const others = leadersFirst(g.enemiesInRange(t.x, t.y, s.range, s.camo, s.air).filter((e) => e !== target && g.hittable(e, t)));
      for (let i = 0; targets.length < s.count; i++) targets.push(others[i] || null);
    }
    // burning pots leave a glowing streak, plain boulders just fly
    const fire = s.proj.tex === 'p_firepot' ? 0xff9100 : s.proj.tex === 'p_greekfire' ? 0x76ff03 : null;
    const trail = s.proj.trail != null ? s.proj.trail : fire;
    targets.forEach((e, i) => {
      const aim = e || target;
      const d = U.dist(m.x, m.y, aim.x, aim.y);
      const dur = 0.45 + d / 560;
      const spread = e ? 0 : U.rand(-60, 60);
      const q = aim.path.at(aim.dist + aim.speedNow() * (dur + i * 0.08) + spread);
      const tx = q.x + (e ? 0 : U.rand(-10, 10)), ty = q.y - (aim.flying ? FLY : 0) + (e ? 0 : U.rand(-8, 8));
      G.spawn(g, {
        kind: 'shell', sx: m.x, sy: m.y, tx, ty, age: 0, dur, delay: i * 0.08, arc: 46 + d * 0.32,
        p: s.proj, tower: t, tex: s.proj.tex, scale: s.proj.scale || 1, spin: s.proj.spin || 6, trail, noSmoke: true,
      });
    });
    g.fx.dust.explode(3, t.x, t.y + 14);
    MT.Audio.play('catapult', t.x);
  }

  // ================================================================ Ninja
  // a pile of caltrops thrown onto the track right in front of the target
  function throwTrap(g, t, x, y, p) {
    const sprite = g.add.image(t.x, t.y - 20, p.tex).setScale(0.6 / S).setDepth(980 + y * 0.001).setRotation(U.rand(-0.4, 0.4));
    const tr = { x, y, p, pierce: p.pierce, max: p.pierce, life: p.life || 10, tower: t, hit: new Set(), sprite };
    const st = { k: 0 };
    const sx = t.x, sy = t.y - 20;
    g.tweens.add({
      targets: st, k: 1, duration: 240, ease: 'Quad.easeOut',
      onUpdate: () => sprite.setPosition(U.lerp(sx, x, st.k), U.lerp(sy, y, st.k) - Math.sin(st.k * Math.PI) * 26),
      onComplete: () => sprite.setScale(1 / S),
    });
    g.traps.push(tr);
  }

  function caltrops(g, t, target) {
    const c = t.stats.caltrops;
    if (!target || target.flying || target.dead) return;
    const q = target.path.at(target.dist + 28 + target.speedNow() * 0.4);
    throwTrap(g, t, q.x + U.rand(-5, 5), q.y + U.rand(-5, 5), { tex: 'fx_caltrops', dmg: c.dmg, pierce: c.pierce, type: 'sharp', r: 10, life: c.life });
  }

  // ================================================================ Alchemist
  // every few seconds a brew flies to the towers that need it most
  function brewTick(g, t, dt) {
    const b = t.stats.brew;
    t.brewCd = (t.brewCd == null ? 1.5 : t.brewCd) - dt;
    if (t.brewCd > 0) return;
    const r2 = t.stats.range * t.stats.range;
    const cands = g.units().filter((o) => o !== t && !o.dead && o.stats.attack !== 'none' && U.dist2(o.x, o.y, t.x, t.y) <= r2);
    if (!cands.length) {
      t.brewCd = 0.6;
      return;
    }
    t.brewCd = b.every;
    cands.sort((a, c) => (a.brewT || 0) - (c.brewT || 0) || U.dist2(a.x, a.y, t.x, t.y) - U.dist2(c.x, c.y, t.x, t.y));
    cands.slice(0, b.n).forEach((o, i) => {
      // the boost works right away (simulation time); the flask is just for show
      o.brew = { pierce: b.pierce, range: b.range, rate: b.rate, dmg: b.dmg };
      o.brewT = b.dur;
      o.applyBuffs();
      const img = g.add.image(t.x, t.y - 20, 'p_brew').setScale(1 / S).setDepth(6300);
      const st = { k: 0 };
      const sx = t.x, sy = t.y - 20;
      g.tweens.add({
        targets: st, k: 1, duration: 340, delay: i * 90, ease: 'Sine.easeInOut',
        onUpdate: () => {
          img.setPosition(U.lerp(sx, o.x, st.k), U.lerp(sy, o.y - 20, st.k) - Math.sin(st.k * Math.PI) * 50);
          img.rotation += 0.25;
        },
        onComplete: () => {
          img.destroy();
          if (o.dead) return;
          o.bump = Math.max(o.bump, 0.6);
          g.fx.ring(o.x, o.y - 6, 30, 0xff5252, { dur: 300 });
          g.fx.glow.particleTint = 0xff5252;
          g.fx.glow.explode(6, o.x, o.y - 20);
          MT.Audio.play('glass', o.x);
        },
      });
    });
    t.aimAt(cands[0]);
    MT.Audio.play('potion', t.x);
  }

  // ================================================================ Fireman
  // BEE-DO! the siren stuns everything close by (it is loud enough for Camo too)
  function sirenTick(g, t, dt) {
    const sr = t.stats.siren;
    t.sirenT = (t.sirenT == null ? 1 : t.sirenT) - dt;
    if (t.sirenT > 0) return;
    const list = g.enemiesInRange(t.x, t.y, t.stats.range, true);
    if (!list.length) {
      t.sirenT = 0.3;
      return;
    }
    t.sirenT = sr.every;
    list.forEach((e) => {
      if (!e.boss) e.stun = Math.max(e.stun, sr.stun);
      else if (sr.moab) e.tryStun(sr.stun * 0.6);
    });
    g.fx.ring(t.x, t.y - 8, t.stats.range, 0xff1744, { dur: 320 });
    g.time.delayedCall(170, () => g.fx.ring(t.x, t.y - 8, t.stats.range * 0.8, 0x2979ff, { dur: 320 }));
    if (Math.random() < 0.35) g.fx.floatText(t.x, t.y - 58, 'BEE-DO!', '#ff5252', 15);
    MT.Audio.play('siren', t.x);
  }

  // ================================================================ abilities
  function slash(game, e, col) {
    const a = U.rand(-0.9, -0.4);
    const r = e.radius + 14;
    const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    game.fx.beam(e.x - dx, e.y - dy, e.x + dx, e.y + dy, col, 5, 0.16);
    game.fx.beam(e.x - dx, e.y - dy, e.x + dx, e.y + dy, 0xffffff, 2, 0.12);
    game.fx.smoke.explode(2, e.x, e.y);
  }

  // something heavy and burning falls out of the sky
  function meteor(game, x, y, scale, onImpact) {
    const sh = game.add.image(x, y + 4, 'fx_shadow').setScale(0.1, 0.06).setAlpha(0.45).setDepth(990);
    const img = game.add.image(x + 160, y - 460, 'p_meteor').setScale(scale / S).setDepth(6550);
    let n = 0;
    game.tweens.add({
      targets: img, x, y, angle: 200, duration: 620, ease: 'Quad.easeIn',
      onUpdate: () => {
        if ((n++ & 1) === 0) game.fx.glowTrail(img.x, img.y, 0xff7043);
      },
      onComplete: () => {
        img.destroy();
        onImpact(x, y);
      },
    });
    game.tweens.add({ targets: sh, scaleX: 0.9 * scale, scaleY: 0.5 * scale, duration: 620, ease: 'Quad.easeIn', onComplete: () => sh.destroy() });
  }

  function meteorRain(game, t, n, dmg, moab) {
    const pts = [];
    game.paths.forEach((p) => {
      for (let d = 0; d < p.length; d += 40) {
        const q = p.at(d);
        if (q.x > 10 && q.x < W - 10 && q.y > 10 && q.y < H - 10) pts.push(q);
      }
    });
    for (let i = 0; i < n; i++) {
      game.time.delayedCall(i * 75, () => {
        const list = alive(game);
        const tgt = list.length && Math.random() < 0.65 ? U.pick(list) : U.pick(pts);
        if (!tgt) return;
        const x = tgt.x, y = tgt.y;
        meteor(game, x, y, 1.4, () => {
          game.explode(x, y, { tex: 'p_firepot', type: 'fire', explode: { r: 64, dmg, pierce: 50 }, moabDmg: moab }, t);
          game.addZone(x, y, { r: 36, dur: 3, dmg: 2, every: 0.5, pierce: 16 }, t, 'fire');
          game.fx.ring(x, y, 64, 0xff7043, { dur: 300 });
        });
      });
    }
    game.fx.screenFlash(0xff7043, 0.2, 400);
  }

  function batSwarm(game, t, n, dmg, moab, spread) {
    for (let i = 0; i < n; i++) {
      game.time.delayedCall((i / n) * spread, () => {
        const list = alive(game);
        if (!list.length) return;
        const e = Math.random() < 0.4 ? byStrength(list)[0] : U.pick(list);
        const sx = t.x + U.rand(-20, 20), sy = t.y - 30 + U.rand(-10, 10);
        const p = { tex: Math.random() < 0.3 ? 'p_bat_big' : 'p_bat', speed: 420, dmg, pierce: 4, type: 'normal', r: 9, homing: true, life: 2.6, moabDmg: moab };
        game.addProjectile(new MT.Projectile(game, t, sx, sy, Math.atan2(e.y - sy, e.x - sx) + U.rand(-0.6, 0.6), p, { range: 600, target: e }));
        if (i % 6 === 0) MT.Audio.play('bat', sx);
      });
    }
  }

  function soakAll(game, small, giant) {
    alive(game).forEach((e, i) => {
      if (e.boss) e.tryStun(giant);
      else e.stun = Math.max(e.stun, small);
      e.applySlow(e.boss ? 0.7 : 0.6, small + 2, false, false, 'wet');
      if (i < 40) game.fx.water.explode(2, e.x, e.y - 6);
    });
  }

  // a wall of water rolling backwards down a track
  function floodWave(game, t, path, from, to, speed, o = {}) {
    return G.spawn(game, { kind: 'flood', path, dist: from, end: to, speed, hit: new Set(), tower: t, dmg: o.dmg || 8, moab: o.moab || 160, push: o.push || 25, bossPush: o.bossPush || 30 });
  }

  Object.assign(MT.Abilities.IMPL, {
    shadowStrike(game, t, all) {
      const pw = powerOf(t);
      leadersFirst(all).slice(0, more(40, pw)).forEach((e, i) => {
        game.time.delayedCall(i * 35, () => {
          if (e.dead) return;
          slash(game, e, 0x7c4dff);
          if (e.boss) game.damageEnemy(e, 600 * pw, t);
          else game.applyHit(e, { dmg: 10 * pw, type: 'normal', armored: true, decamo: true, stun: { dur: 0.6 } }, t);
        });
      });
      game.fx.screenFlash(0x311b92, 0.25, 300);
      game.fx.floatText(t.x, t.y - 70, 'HI-YAH!', '#b39ddb', 24);
      MT.Audio.play('swoosh');
    },
    thousandCuts(game, t, all) {
      const pw = powerOf(t);
      const list = leadersFirst(all).slice(0, more(100, pw));
      list.forEach((e, i) => {
        game.time.delayedCall(i * 18, () => {
          if (e.dead) return;
          slash(game, e, 0x9575cd);
          if (e.boss) game.damageEnemy(e, 2500 * pw, t);
          else game.applyHit(e, { dmg: 20 * pw, type: 'normal', armored: true, decamo: true, stun: { dur: 1 } }, t);
          if (i % 8 === 0) MT.Audio.play('shuriken', e.x);
        });
      });
      game.fx.screenFlash(0x1a0033, 0.4, 500);
      game.fx.floatText(t.x, t.y - 80, 'THOUSAND CUTS!', '#b39ddb', 26);
      MT.Audio.play('swoosh');
    },
    meteorShower(game, t) {
      meteorRain(game, t, 24, 8 * powerOf(t), 300 * powerOf(t));
      game.fx.floatText(t.x, t.y - 70, 'FIRE!', '#ff7043', 24);
    },
    meteorStorm(game, t) {
      meteorRain(game, t, more(40, powerOf(t)), 14 * powerOf(t), 800 * powerOf(t));
      game.fx.floatText(t.x, t.y - 80, 'METEOR STORM!', '#ff7043', 26);
    },
    goldenTouch(game, t) {
      game.timed.push({ type: 'goldenTouch', t: 12 });
      game.fx.weather('gold', 4);
      game.fx.shockwave(t.x, t.y, 500, 0xffd740, 700);
      game.fx.floatText(t.x, t.y - 70, 'GOLDEN TOUCH!', '#ffd740', 24);
      MT.Audio.play('coin');
    },
    potionRain(game, t, all) {
      const pw = powerOf(t);
      game.timed.push({ type: 'goldenTouch', t: 10 });
      all.slice(0, 90).forEach((e, i) => {
        game.time.delayedCall(i * 14, () => {
          if (e.dead) return;
          const img = game.add.image(e.x + U.rand(-20, 20), e.y - 260, 'p_potion_big').setScale(1 / S).setDepth(6500);
          game.tweens.add({
            targets: img, x: e.x, y: e.y, angle: 300, duration: 380, ease: 'Quad.easeIn',
            onComplete: () => {
              img.destroy();
              game.fx.splat(e.x, e.y, 30, 0x76ff03);
              if (e.boss) game.applyHit(e, { dmg: 0, moabDmg: 400 * pw, type: 'normal', dot: { dmg: 20 * pw, every: 0.5, dur: 6 } }, t);
              else game.applyHit(e, { dmg: 3 * pw, type: 'normal', armored: true, gold: 5, dot: { dmg: 4 * pw, every: 0.5, dur: 4 } }, t);
            },
          });
        });
      });
      game.fx.weather('gold', 3);
      game.fx.floatText(t.x, t.y - 80, 'POTION RAIN!', '#69f0ae', 26);
      MT.Audio.play('glass');
    },
    beedoo(game, t) {
      soakAll(game, 3, 1.5);
      game.fx.screenFlash(0xff1744, 0.2, 260);
      game.time.delayedCall(280, () => game.fx.screenFlash(0x2979ff, 0.2, 260));
      game.fx.shockwave(t.x, t.y, 900, 0xff5252, 700);
      game.fx.floatText(t.x, t.y - 70, 'BEE-DO BEE-DO!', '#ff5252', 26);
      MT.Audio.play('beedoo');
    },
    megaSiren(game, t) {
      const pw = powerOf(t);
      soakAll(game, 4, 2);
      game.paths.forEach((path) => floodWave(game, t, path, path.length + 30, -40, path.length / 1.7, { dmg: 10 * pw, moab: 400 * pw, push: 70, bossPush: 60 }));
      game.fx.screenFlash(0xff1744, 0.25, 260);
      game.time.delayedCall(280, () => game.fx.screenFlash(0x2979ff, 0.25, 260));
      game.fx.floatText(t.x, t.y - 80, 'BEE-DO BEE-DO!', '#ff5252', 28);
      MT.Audio.play('beedoo');
      MT.Audio.play('splash');
    },
    batStorm(game, t) {
      const pw = powerOf(t);
      batSwarm(game, t, more(60, pw), 4 * pw, 30 * pw, 1500);
      game.fx.screenFlash(0x1a0033, 0.3, 500);
      game.fx.floatText(t.x, t.y - 70, 'BAT STORM!', '#b388ff', 24);
    },
    eternalNight(game, t, all) {
      const pw = powerOf(t);
      batSwarm(game, t, more(150, pw), 10 * pw, 80 * pw, 2200);
      game.fx.vignette(0x1a0033, 0.55, 2400);
      game.fx.screenFlash(0x1a0033, 0.45, 700);
      game.healLives(Math.min(15, Math.ceil(all.length / 10)), t.x, t.y - 80);
      game.fx.floatText(t.x, t.y - 100, 'ETERNAL NIGHT!', '#ff5252', 26);
    },
    bloodMoon(game, t, all) {
      const pw = powerOf(t);
      const moon = game.add.image(W / 2, -80, 'fx_bloodmoon').setScale(1.2 / S).setDepth(6700).setAlpha(0.95);
      game.tweens.add({ targets: moon, y: 110, duration: 700, ease: 'Back.easeOut' });
      game.tweens.add({ targets: moon, alpha: 0, delay: 1700, duration: 600, onComplete: () => moon.destroy() });
      game.fx.screenFlash(0xb71c1c, 0.4, 700);
      let n = 0;
      game.time.delayedCall(500, () => {
        all.forEach((e) => {
          if (e.dead) return;
          n++;
          if (e.boss) game.damageEnemy(e, Math.min(Math.ceil(e.maxHp * 0.15), 6000 * pw), t);
          else game.damageEnemy(e, 6 * pw, t);
          if (n < 40) game.fx.sparkle(e.x, e.y - e.radius, 0xff1744);
        });
        game.healLives(Math.min(15, Math.floor(n / 10)), t.x, t.y - 80);
        MT.Audio.play('roar');
      });
    },
  });

  // ================================================================ Ultimate attacks
  Object.assign(G.ULT, {
    // Shuriken Storm: huge spinning shurikens roll back down the track
    ninja(g, t, dt) {
      if (!G.every(t, 'saw', 3.2, dt)) return;
      const e = G.leader(G.near(g, t, t.stats.range + 40).filter((x) => !x.flying));
      if (!e) return G.retry(t, 'saw', 0.4);
      t.aimAt(e);
      G.spawn(g, { kind: 'saw', path: e.path, dist: e.dist + 70, end: e.dist - 650, speed: 330, hit: new Set(), tower: t, ph: 0 });
      MT.Audio.play('shuriken');
      MT.Audio.play('swoosh');
    },
    // Boulder Barrage: volleys of flaming boulders onto the strongest mutant
    catapult(g, t, dt) {
      if (!G.every(t, 'barrage', 2.4, dt)) return;
      const e = G.strongest(G.near(g, t, t.stats.range * 1.4));
      if (!e) return G.retry(t, 'barrage', 0.3);
      const m = t.muzzle();
      const p = { tex: 'p_colossal', type: 'normal', shred: 3, explode: { r: 60, dmg: 16, pierce: 40 }, moabDmg: 140, cloud: { r: 34, dur: 2.5, dmg: 4, every: 0.4, pierce: 20 }, cloudKind: 'fire' };
      for (let i = 0; i < 6; i++) {
        const lead = e.path.at(e.dist + e.speedNow() * 0.9 + U.rand(-45, 45));
        G.spawn(g, { kind: 'shell', sx: m.x + U.rand(-50, 50), sy: m.y + U.rand(-6, 6), tx: lead.x + U.rand(-12, 12), ty: lead.y - (e.flying ? FLY : 0) + U.rand(-8, 8), age: 0, dur: 0.85, delay: i * 0.09, arc: 170, p, tower: t, tex: 'p_colossal', scale: 1.1, spin: 5, trail: 0xff7043 });
      }
      MT.Audio.play('catapult');
    },
    // Acid Geysers: acid bursts out of the ground under the mutants
    potion(g, t, dt) {
      if (!G.every(t, 'geyser', 0.7, dt)) return;
      const list = G.near(g, t, t.stats.range).filter((x) => !x.flying);
      if (!list.length) return G.retry(t, 'geyser', 0.2);
      const e = Math.random() < 0.5 ? G.strongest(list) : U.pick(list);
      const q = e.path.at(e.dist + e.speedNow() * 0.35);
      g.fx.ring(q.x, q.y, 34, 0x76ff03, { dur: 350 });
      G.spawn(g, { kind: 'geyser', x: q.x, y: q.y, age: 0, dur: 0.35, tower: t });
    },
    // Flood Wave: a wall of water washes everything back down the track
    fireman(g, t, dt) {
      if (!G.every(t, 'flood', 4, dt)) return;
      const e = G.leader(G.near(g, t, t.stats.range + 60).filter((x) => !x.flying));
      if (!e) return G.retry(t, 'flood', 0.4);
      t.aimAt(e);
      floodWave(g, t, e.path, e.dist + 90, e.dist - 700, 360, { dmg: 10, moab: 160, push: 25, bossPush: 30 });
      g.fx.floatText(t.x, t.y - 110, 'BEE-DO!', '#ff5252', 18);
      MT.Audio.play('beedoo');
      MT.Audio.play('splash');
    },
    // Bat Cloud: bats pour out of the castle and bite everything in range
    vampire(g, t, dt) {
      if (!G.every(t, 'bats', 0.12, dt)) return;
      const list = G.near(g, t, t.stats.range);
      if (!list.length) return;
      const e = U.pick(list);
      const sx = t.x + U.rand(-34, 34), sy = t.y - 70 + U.rand(-10, 10);
      const p = { tex: 'p_bat', speed: 520, dmg: 10, pierce: 2, type: 'normal', r: 8, homing: true, life: 1.6, moabDmg: 45 };
      g.addProjectile(new MT.Projectile(g, t, sx, sy, Math.atan2(e.y - sy, e.x - sx) + U.rand(-0.5, 0.5), p, { range: 400, target: e }));
      if (Math.random() < 0.15) MT.Audio.play('bat', sx);
    },
  });

  // ---------------------------------------------------------------- their objects
  Object.assign(G.STEP, {
    saw(g, o, dt) {
      o.dist -= o.speed * dt;
      const p = o.path.at(o.dist);
      o.x = p.x;
      o.y = p.y;
      for (const e of g.queryEnemies(p.x, p.y, 60)) {
        if (e.dead || o.hit.has(e.id) || e.path !== o.path || U.dist2(p.x, p.y, e.x, e.y) > (34 + e.radius * 0.5) ** 2) continue;
        o.hit.add(e.id);
        if (e.boss) {
          g.applyHit(e, { dmg: 0, moabDmg: 260, type: 'normal' }, o.tower);
          e.dist = Math.max(0, e.dist - 15);
        } else {
          const kids = g.applyHit(e, { dmg: 14, knock: 6, type: 'sharp', armored: true, decamo: true }, o.tower);
          if (kids) kids.forEach((k) => o.hit.add(k.id));
        }
        g.fx.sparks.explode(2, e.x, e.y);
      }
      return o.dist > Math.max(o.end, -20);
    },
    geyser(g, o, dt) {
      o.age += dt;
      if (o.age < o.dur) return true;
      g.explode(o.x, o.y, { tex: 'p_potion_big', type: 'normal', armored: true, gold: 5, explode: { r: 54, dmg: 10, pierce: 30 }, moabDmg: 110, dot: { dmg: 6, every: 0.5, dur: 4 } }, o.tower);
      G.spawn(g, { kind: 'puddle', x: o.x, y: o.y, r: 40, life: 4, max: 4, tick: 0, tower: o.tower, rot: Math.random() * 6.28, tint: 0x76ff03, fx: 'gas', slowLook: 'acid' });
      const col = g.add.image(o.x, o.y + 6, 'fx_geyser').setOrigin(0.5, 1).setScale(0.9 / S, 0.1 / S).setDepth(1000 + o.y + 5);
      g.tweens.add({ targets: col, scaleY: 1 / S, duration: 160, ease: 'Back.easeOut' });
      g.tweens.add({ targets: col, alpha: 0, scaleX: 1.3 / S, delay: 320, duration: 300, onComplete: () => col.destroy() });
      return false;
    },
    flood(g, o, dt) {
      o.dist -= o.speed * dt;
      const p = o.path.at(o.dist);
      o.x = p.x;
      o.y = p.y;
      for (const e of g.queryEnemies(p.x, p.y, 70)) {
        if (e.dead || o.hit.has(e.id) || e.path !== o.path || U.dist2(p.x, p.y, e.x, e.y) > (40 + e.radius * 0.5) ** 2) continue;
        o.hit.add(e.id);
        if (e.boss) {
          g.applyHit(e, { dmg: 0, moabDmg: o.moab, type: 'normal', slow: { mul: 0.6, dur: 1.5, moab: true, look: 'wet' } }, o.tower);
          if (!e.def.final && !e.def.bossFight) e.dist = Math.max(0, e.dist - o.bossPush);
        } else {
          const kids = g.applyHit(e, { dmg: o.dmg, knock: o.push, type: 'normal', decamo: true, slow: { mul: 0.5, dur: 1.5, look: 'wet' } }, o.tower);
          if (kids) kids.forEach((k) => o.hit.add(k.id));
        }
      }
      return o.dist > Math.max(o.end, -30);
    },
  });

  Object.assign(G.RENDER, {
    saw(g, o, dt) {
      if (o.x == null) return;
      if (!o.sprite) o.sprite = g.add.image(o.x, o.y, 'fx_bigshuriken').setScale(1 / S);
      o.ph += dt;
      o.sprite.setPosition(o.x, o.y - 18).setRotation(o.sprite.rotation - dt * 14).setDepth(1000 + o.y + 30);
      if (Math.random() < dt * 20) g.fx.sparkle(o.x + U.rand(-20, 20), o.y - U.rand(0, 30), 0xd1c4e9);
    },
    flood(g, o, dt, time) {
      if (o.x == null) return;
      if (!o.sprite) o.sprite = g.add.image(o.x, o.y, 'fx_floodwave').setOrigin(0.5, 0.85).setScale(1 / S);
      const a = o.path.angleAt(Math.max(0, Math.min(o.path.length, o.dist)));
      // the wave faces the way it rolls (backwards along the track)
      o.sprite.setPosition(o.x, o.y + 10).setFlipX(Math.cos(a) > 0).setDepth(1000 + o.y + 30);
      o.sprite.scaleX = (1 + Math.sin(time * 0.02) * 0.05) / S;
      if (Math.random() < dt * 30) g.fx.water.explode(1, o.x + U.rand(-26, 26), o.y + U.rand(-30, 4));
    },
  });

  // ---------------------------------------------------------------- Omega Beam powers
  Object.assign(G.ELEMENT, {
    ninja: (p, o) => {
      p.armored = true;
      o.decamo = true;
      p.dmg *= 1.2;
    },
    catapult: (p, o) => {
      o.blasts = true;
      p.moabDmg *= 1.2;
    },
    potion: (p) => {
      p.dot = { dmg: 10, every: 0.5, dur: 4 };
      p.gold = 5;
    },
    fireman: (p) => {
      p.knock = Math.max(p.knock || 0, 20);
      p.knockBoss = 8;
      p.slow = p.slow || { mul: 0.6, dur: 2, moab: true, look: 'wet' };
    },
    vampire: (p, o) => {
      o.heal = true;
      p.moabDmg *= 1.15;
    },
  });

  MT.NewTowers = { lob, caltrops, brewTick, sirenTick };
})();
