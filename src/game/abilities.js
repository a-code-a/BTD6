// Activated abilities (tower tier 4s, heroes and super fusions) plus the
// little simulated helpers some of them spawn: stampeding minions, jelly
// waves, piranhas and sky lasers.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const W = MT.CFG.MAP_W, H = MT.CFG.H;

  const alive = (game) => game.enemies.filter((e) => !e.dead);
  // strongest first: giants by size, then health
  const byStrength = (list) => list.slice().sort((a, b) => (b.boss - a.boss) || b.def.rbe - a.def.rbe || b.hp - a.hp);
  const strongestBoss = (game) => byStrength(alive(game).filter((e) => e.boss))[0] || null;

  function pathPoints(game, spacing) {
    const out = [];
    game.paths.forEach((p) => {
      for (let d = 0; d < p.length; d += spacing) {
        const q = p.at(d);
        if (q.x > -10 && q.x < W + 10 && q.y > -10 && q.y < H + 10) out.push({ x: q.x, y: q.y });
      }
    });
    return out;
  }

  function blast(game, t, x, y, r, dmg, pierce, moab, tex) {
    game.explode(x, y, { tex: tex || 'p_rocket', type: 'explosive', explode: { r, dmg, pierce }, moabDmg: moab, quiet: tex === 'quiet' }, t);
  }

  // remove a small mutant entirely (no children), paying out its full value
  function obliterate(game, e, t) {
    if (e.dead || e.boss) return;
    e.destroy();
    const v = MT.enemyRbe(e.type, e.fort);
    game.money += game.cashMul * v;
    game.totalPops += v;
    if (t) t.pops += v;
  }

  // something heavy falls from the sky onto (x, y)
  function skyDrop(game, x, y, tex, scale, dur, onImpact, trailCol) {
    const sh = game.add.image(x, y + 4, 'fx_shadow').setScale(0.1, 0.06).setAlpha(0.45).setDepth(990);
    const img = game.add.image(x + 140, y - 440, tex).setScale(scale / S).setDepth(6550);
    let n = 0;
    game.tweens.add({
      targets: img, x, y, angle: 160, duration: dur, ease: 'Quad.easeIn',
      onUpdate: () => {
        if (trailCol != null && (n++ & 1) === 0) game.fx.glowTrail(img.x, img.y, trailCol);
      },
      onComplete: () => {
        img.destroy();
        onImpact(x, y);
      },
    });
    game.tweens.add({ targets: sh, scaleX: 0.9 * scale, scaleY: 0.5 * scale, duration: dur, ease: 'Quad.easeIn', onComplete: () => sh.destroy() });
  }

  // a plane flies along every track dropping bombs
  function bomberRun(game, t, o) {
    game.paths.forEach((path, pi) => {
      const sprite = game.add.image(-100, -100, o.tex).setScale(o.scale / S).setDepth(6600);
      const shadow = game.add.image(-100, -100, 'fx_shadow').setScale(0.9 * o.scale, 0.5 * o.scale).setAlpha(0.3).setDepth(990);
      const st = { d: -80 };
      let next = 0;
      game.tweens.add({
        targets: st, d: path.length + 100, duration: o.dur, delay: pi * 250, ease: 'Linear',
        onUpdate: () => {
          const p = path.at(st.d), a = path.angleAt(Math.max(0, Math.min(path.length, st.d)));
          sprite.setPosition(p.x, p.y - 74).setRotation(a).setFlipY(Math.cos(a) < 0);
          shadow.setPosition(p.x, p.y + 6);
          if (st.d >= next && st.d > 0 && st.d < path.length) {
            next = st.d + o.spacing;
            dropBomb(game, t, p.x, p.y - 66, p.x, p.y, o);
          }
        },
        onComplete: () => {
          sprite.destroy();
          shadow.destroy();
        },
      });
    });
    MT.Audio.play('jet');
  }

  function dropBomb(game, t, sx, sy, x, y, o) {
    const b = game.add.image(sx, sy, 'p_minibomb').setScale(1.5 / S).setDepth(6550);
    game.tweens.add({
      targets: b, y, duration: 240, ease: 'Quad.easeIn',
      onComplete: () => {
        b.destroy();
        blast(game, t, x, y, o.r, o.dmg, o.pierce, o.moab);
      },
    });
  }

  // lightning bolts from the sky onto random mutants (giants preferred)
  function boltStorm(game, t, n, dmg, moab, color, width) {
    game.fx.screenFlash(0x8fa8ff, 0.18, 300);
    for (let i = 0; i < n; i++) {
      game.time.delayedCall(i * (1800 / n), () => {
        const list = alive(game);
        if (!list.length) return;
        const bosses = list.filter((e) => e.boss);
        const e = bosses.length && Math.random() < 0.5 ? U.pick(bosses) : U.pick(list);
        game.fx.lightning(e.x + U.rand(-70, 70), -30, e.x, e.y - 6, color, width, 0.28);
        game.fx.ring(e.x, e.y, 46, color, { dur: 260 });
        game.fx.sparks.explode(6, e.x, e.y);
        blast(game, t, e.x, e.y, 46, dmg, 24, moab, 'quiet');
        MT.Audio.play('thunder');
      });
    }
  }

  function danceAll(game, small, giant, dot, t) {
    alive(game).forEach((e) => {
      e.dance = Math.max(e.dance, e.boss ? giant : small);
      if (dot) e.applyDot(dot, t);
    });
    const list = alive(game).slice(0, 40);
    list.forEach((e) => game.fx.notes.explode(1, e.x, e.y - e.radius));
    const cols = [0xff4081, 0x40c4ff, 0xffd83a, 0x7be35a];
    cols.forEach((c, i) => game.time.delayedCall(i * 220, () => game.fx.screenFlash(c, 0.16, 220)));
    MT.Audio.play('papoy');
  }

  const IMPL = {
    // ------------------------------------------------------------ towers
    bananaFrenzy(game) {
      game.timed.push({ type: 'bananaFrenzy', t: 12 });
      for (const tw of game.towers) if (tw.type === 'banana') game.fx.ring(tw.x, tw.y, 40, 0xffd83a);
    },
    overdrive(game, t) {
      game.timed.push({ type: 'overdrive', t: 15, x: t.x, y: t.y, r: t.stats.range });
      game.fx.ring(t.x, t.y, t.stats.range, 0xffeb3b, { disc: true, dur: 600, force: true });
    },
    megaMissile(game, t, all) {
      const target = strongestBoss(game) || game.findStrongest(all);
      game.launchMissile(t, target, 'p_missile', (tg) => {
        if (tg && !tg.dead) {
          if (tg.boss) game.damageEnemy(tg, 1500, t);
          else blast(game, t, tg.x, tg.y, 110, 20, 200, 0);
        }
      });
    },
    snowstorm(game, t, all) {
      all.forEach((e) => {
        if (!e.boss) {
          e.freeze = Math.max(e.freeze, 4);
          e.brittle = true;
        }
      });
      game.timed.push({ type: 'snowstorm', t: 6 });
      for (let i = 0; i < 6; i++) game.fx.snow.explode(12, U.rand(60, W - 60), U.rand(60, H - 60));
      game.fx.screenFlash(0xc8f0ff, 0.35, 400);
    },
    jellyStorm(game, t, all) {
      all.forEach((e) => {
        e.applySlow(e.boss ? 0.75 : 0.4, 10, false, true);
        e.applyDot({ dmg: 1, every: 1, dur: 10 }, t);
      });
      game.timed.push({ type: 'jellyStorm', t: 10 });
      game.fx.screenFlash(0xa0ff78, 0.3, 400);
    },
    supplyDrop(game, t) {
      const x = U.clamp(t.x + U.rand(-120, 120), 40, W - 40), y = U.clamp(t.y + U.rand(-80, 80), 60, H - 40);
      const crate = game.add.image(x, y - 300, 'fx_crate').setScale(1 / S).setDepth(6500);
      game.tweens.add({
        targets: crate, y, duration: 1100, ease: 'Sine.easeIn',
        onComplete: () => {
          game.fx.smoke.explode(10, x, y + 12);
          const v = U.round5(1500 * Math.min(1, game.cashMul * 2 + 0.3));
          game.money += v;
          game.fx.floatText(x, y - 30, '+' + U.money(v), '#7CFF6B', 24);
          MT.Audio.play('coin');
          game.tweens.add({ targets: crate, alpha: 0, delay: 500, duration: 400, onComplete: () => crate.destroy() });
        },
      });
    },
    darkDome(game, t, all) {
      game.fx.screenFlash(0x3c0060, 0.45, 600);
      game.fx.ring(t.x, t.y, 900, 0x7c4dff, { disc: true, dur: 700, depth: 6000, force: true });
      all.forEach((e) => {
        if (!e.boss) obliterate(game, e, t);
        else game.damageEnemy(e, 3000, t);
      });
    },
    lightningStorm(game, t) {
      boltStorm(game, t, 18, 6, 150, 0x80d8ff, 3);
    },
    bombingRun(game, t) {
      bomberRun(game, t, { tex: 'fx_bomber', scale: 1, dur: 2600, spacing: 70, r: 55, dmg: 5, pierce: 30, moab: 120 });
    },
    papoySong(game) {
      danceAll(game, 4, 2);
    },

    // ------------------------------------------------------------ heroes
    shrinkRay(game, t, all) {
      game.fx.ring(t.x, t.y, 1100, 0x40c4ff, { disc: true, dur: 700, depth: 6000, force: true });
      all.forEach((e) => {
        game.fx.sparks.explode(2, e.x, e.y);
        if (!e.boss) game.damageEnemy(e, 1, t);
        else game.damageEnemy(e, Math.min(400, Math.ceil(e.maxHp * 0.1)), t);
      });
    },
    moonHeist(game, t) {
      const target = strongestBoss(game);
      const tx = target ? target.x : W / 2, ty = target ? target.y : H / 2;
      const img = game.add.image(-90, -90, 'fx_moon').setScale(1.4 / S).setDepth(6500);
      const sh = game.add.image(tx, ty + 6, 'fx_shadow').setScale(0.2, 0.1).setAlpha(0.4).setDepth(990);
      game.tweens.add({ targets: sh, scaleX: 2.2, scaleY: 1, duration: 950, ease: 'Quad.easeIn' });
      game.tweens.add({
        targets: img, x: tx, y: ty, angle: 360, scale: 1.9 / S, duration: 950, ease: 'Quad.easeIn',
        onUpdate: () => game.fx.glowTrail(img.x, img.y, 0xb3e5fc),
        onComplete: () => {
          img.destroy();
          sh.destroy();
          game.fx.boom(tx, ty, 140);
          game.fx.shockwave(tx, ty, 260, 0xb3e5fc, 600);
          game.fx.debris.explode(16, tx, ty);
          game.shake(0.3);
          MT.Audio.play('boom');
          if (target && !target.dead) game.damageEnemy(target, 3000, t);
          alive(game).forEach((e) => game.damageEnemy(e, 5, t));
        },
      });
    },
    lipstickTaser(game, t) {
      const list = game.enemiesInRange(t.x, t.y, 270, true).slice(0, 70);
      list.forEach((e, i) => {
        if (i < 26) game.fx.lightning(t.x, t.y - 30, e.x, e.y, 0xff4fa3, 2.2, 0.35);
        e.tryStun(e.boss ? 1.2 : 2.2);
        game.damageEnemy(e, e.boss ? 60 : 3, t);
      });
      game.fx.ring(t.x, t.y, 270, 0xff4fa3, { disc: true, dur: 500, force: true });
      game.fx.sparks.explode(20, t.x, t.y - 30);
      MT.Audio.play('zap');
    },
    airstrike(game, t) {
      bomberRun(game, t, { tex: 'fx_jet', scale: 1, dur: 2000, spacing: 60, r: 60, dmg: 10, pierce: 40, moab: 300 });
      game.fx.floatText(t.x, t.y - 70, 'AVL, GO!', '#4dd0e1', 22);
    },
    fartGun(game, t) {
      const R = 300;
      game.enemiesInRange(t.x, t.y, R, true).forEach((e) => {
        if (e.boss) game.damageEnemy(e, 250, t);
        else game.applyHit(e, { dmg: 6, knock: 18, type: 'normal' }, t);
      });
      for (let i = 0; i < 10; i++) game.fx.gas.explode(4, t.x + U.rand(-R, R) * 0.7, t.y + U.rand(-R, R) * 0.5);
      game.fx.swirl(t.x, t.y, R, 0x9be15d);
      game.fx.shockwave(t.x, t.y, R, 0x9be15d, 500);
      game.fx.screenFlash(0x9be15d, 0.15, 300);
      game.fx.floatText(t.x, t.y - 70, 'FART GUN!', '#9be15d', 24);
      MT.Audio.play('fart');
      MT.Audio.play('boom');
    },
    antidote(game, t, all) {
      game.fx.shockwave(t.x, t.y, 1300, 0x80ffea, 900);
      game.fx.screenFlash(0x80ffea, 0.3, 500);
      let shown = 0;
      all.forEach((e) => {
        if (e.boss) {
          game.damageEnemy(e, Math.min(Math.ceil(e.maxHp * 0.2), 8000), t);
          return;
        }
        if (shown++ < 40) cured(game, e.x, e.y);
        obliterate(game, e, t);
      });
      game.fx.floatText(t.x, t.y - 70, 'CURED!', '#80ffea', 26);
      MT.Audio.play('victory');
    },
    stampede(game, t) {
      game.paths.forEach((path) => {
        for (let i = 0; i < 12; i++) {
          const sprite = game.add.image(-100, -100, 'fx_runner').setScale(1 / S).setDepth(1000);
          game.runners.push({ kind: 'minion', path, dist: path.length + 30 + i * 30, speed: 300, hit: new Set(), pierce: 30, tower: t, sprite, ph: Math.random() * 6 });
        }
      });
      game.fx.floatText(t.x, t.y - 70, 'BANANAAA!', '#ffd83a', 24);
      MT.Audio.play('bello');
    },
    giantKevin(game, t) {
      t.giant = 10;
      t.stompT = 0.5;
      t.applyBuffs();
      game.fx.shockwave(t.x, t.y, 200, 0xffd83a, 600);
      game.fx.sparks.explode(26, t.x, t.y - 30);
      game.fx.bigText('GIANT KEVIN!', '#ffd83a', 48);
      game.shake(0.15);
      MT.Audio.play('roar');
    },
    piranhaFrenzy(game, t) {
      const targets = byStrength(alive(game)).slice(0, 6);
      targets.forEach((e, i) => {
        const sprite = game.add.image(t.x, t.y - 20, 'fx_piranha').setScale(1 / S).setDepth(6300);
        const b = { kind: 'piranha', e, t: 3, dps: 0, sprite, flying: true, tower: t };
        game.biters.push(b);
        const st = { k: 0 };
        const sx = t.x, sy = t.y - 20;
        game.tweens.add({
          targets: st, k: 1, duration: 420, delay: i * 70, ease: 'Quad.easeIn',
          onUpdate: () => {
            const tg = b.e && !b.e.dead ? b.e : null;
            const gx = tg ? tg.x : sx, gy = tg ? tg.y - 10 : sy;
            sprite.setPosition(U.lerp(sx, gx, st.k), U.lerp(sy, gy, st.k) - Math.sin(st.k * Math.PI) * 70);
            sprite.setFlipX(gx < sx);
          },
          onComplete: () => {
            b.flying = false;
          },
        });
      });
      MT.Audio.play('splat');
    },
    pyramidDrop(game, t, all) {
      const target = strongestBoss(game) || byStrength(all)[0];
      const tx = target ? target.x : W / 2, ty = target ? target.y : H / 2;
      skyDrop(game, tx, ty, 'fx_pyramid', 1.4, 1000, (x, y) => {
        if (target && !target.dead) game.damageEnemy(target, 5000, t);
        game.enemiesInRange(x, y, 170, true).forEach((e) => {
          if (e.boss) game.damageEnemy(e, 600, t);
          else game.damageEnemy(e, 20, t);
        });
        const pyr = game.add.image(x, y + 10, 'fx_pyramid').setOrigin(0.5, 0.85).setScale(1.4 / S).setDepth(1000 + y + 30);
        game.tweens.add({ targets: pyr, alpha: 0, y: y + 30, delay: 600, duration: 700, onComplete: () => pyr.destroy() });
        game.fx.dust.explode(26, x, y + 10);
        game.fx.shockwave(x, y, 280, 0xe8c66a, 600);
        game.fx.boom(x, y, 120);
        game.shake(0.35);
        MT.Audio.play('boom');
      });
      game.fx.floatText(t.x, t.y - 70, 'OH YEAH!', '#ff8a3a', 24);
    },

    // ------------------------------------------------------------ super fusions
    bananaApocalypse(game, t) {
      const pts = pathPoints(game, 40);
      for (let i = 0; i < 30; i++) {
        game.time.delayedCall(i * 85, () => {
          const list = alive(game);
          const tgt = list.length && Math.random() < 0.6 ? U.pick(list) : U.pick(pts);
          if (!tgt) return;
          const x = tgt.x, y = tgt.y;
          skyDrop(game, x, y, 'p_jugg', 2.2, 650, () => {
            blast(game, t, x, y, 70, 20, 60, 250);
            game.fx.ring(x, y, 70, 0xffc400, { dur: 300 });
          }, 0xffc400);
        });
      }
      game.fx.screenFlash(0xffd83a, 0.2, 400);
      game.fx.floatText(t.x, t.y - 80, 'BANANA APOCALYPSE!', '#ffc400', 24);
    },
    nuclearToot(game, t, all) {
      const cloud = game.add.image(t.x, t.y, 'fx_nuke').setOrigin(0.5, 0.95).setScale(0.2 / S).setDepth(6300).setAlpha(0.95);
      game.tweens.add({ targets: cloud, scale: 1.6 / S, duration: 900, ease: 'Cubic.easeOut' });
      game.tweens.add({ targets: cloud, alpha: 0, y: t.y - 40, delay: 1100, duration: 900, onComplete: () => cloud.destroy() });
      game.fx.shockwave(t.x, t.y, 1200, 0x9be15d, 900);
      game.fx.screenFlash(0xb8ff7a, 0.45, 700);
      game.shake(0.4);
      all.forEach((e) => {
        if (e.boss) game.damageEnemy(e, 2500, t);
        else game.damageEnemy(e, 30, t);
      });
      alive(game).forEach((e) => e.applyDot({ dmg: 5, every: 0.5, dur: 6 }, t));
      for (let i = 0; i < 8; i++) game.fx.gas.explode(5, U.rand(40, W - 40), U.rand(40, H - 40));
      MT.Audio.play('nuke');
    },
    armageddon(game, t, all) {
      let list = byStrength(all.filter((e) => e.boss));
      if (!list.length) list = byStrength(all);
      for (let i = 0; i < 10; i++) {
        const target = list.length ? list[i % list.length] : null;
        game.launchMissile(t, target, 'p_missile', (tg) => {
          if (tg && !tg.dead && tg.boss) game.damageEnemy(tg, 3000, t);
          else if (tg) blast(game, t, tg.x, tg.y, 110, 20, 200, 0);
        }, i * 110);
      }
      game.fx.floatText(t.x, t.y - 80, 'ARMAGEDDON!', '#ff7043', 24);
    },
    iceAge(game, t, all) {
      all.forEach((e) => {
        e.freeze = Math.max(e.freeze, e.boss ? 4 : 5);
        e.brittle = true;
      });
      game.fx.shockwave(t.x, t.y, 1300, 0xbfe9ff, 900);
      game.fx.screenFlash(0xd8f4ff, 0.5, 700);
      for (let i = 0; i < 10; i++) game.fx.snow.explode(10, U.rand(40, W - 40), U.rand(40, H - 40));
      game.fx.bigText('ICE AGE!', '#b3ecff', 50);
      MT.Audio.play('freeze');
    },
    jellyTsunami(game, t) {
      game.paths.forEach((path) => {
        const sprite = game.add.image(-100, -100, 'fx_jellywave').setScale(1 / S).setDepth(3200);
        game.runners.push({ kind: 'wave', path, dist: path.length + 20, speed: path.length / 1.5, hit: new Set(), tower: t, sprite });
      });
      game.fx.screenFlash(0xff6fa0, 0.25, 400);
      MT.Audio.play('splat');
    },
    orbitalStrike(game, t, all) {
      const target = strongestBoss(game) || byStrength(all)[0];
      if (!target) return;
      const beam = game.add.image(target.x, target.y, 'fx_pillar').setOrigin(0.5, 0.97).setTint(0x40c4ff).setScale(1.1 / S, 2 / S).setAlpha(0).setDepth(6400).setBlendMode(Phaser.BlendModes.ADD);
      game.tweens.add({ targets: beam, alpha: 1, duration: 120 });
      game.biters.push({ kind: 'beam', e: target, t: 1.4, dps: 12000 / 1.4, sprite: beam, tower: t, tick: 0 });
      game.fx.screenFlash(0x9be7ff, 0.35, 400);
      game.shake(0.3);
      MT.Audio.play('laserBig');
    },
    wrathOfZeus(game, t) {
      boltStorm(game, t, 45, 12, 350, 0xd1b3ff, 4.5);
      game.fx.bigText('WRATH OF ZEUS!', '#d1b3ff', 46);
    },
    carpetBomb(game, t) {
      bomberRun(game, t, { tex: 'fx_jet_gold', scale: 1.15, dur: 2200, spacing: 45, r: 70, dmg: 15, pierce: 60, moab: 500 });
    },
    encore(game, t) {
      danceAll(game, 6, 3, { dmg: 5, every: 0.5, dur: 6 }, t);
      game.fx.bigText('ENCORE!', '#ff4081', 50);
    },
    bananaRain(game, t) {
      const v = U.round5(3000 + game.round * 120);
      for (let i = 0; i < 24; i++) {
        game.time.delayedCall(i * 40, () => {
          const x = t.x + U.rand(-120, 120), y = t.y + U.rand(-70, 70);
          const b = game.add.image(x, y - 300, 'fx_banana_gold').setScale(0.9 / S).setDepth(6500);
          game.tweens.add({
            targets: b, y, duration: 500, ease: 'Bounce.easeOut',
            onComplete: () => game.tweens.add({ targets: b, x: 1062, y: 74, scale: 0.4 / S, delay: 200, duration: 450, ease: 'Quad.easeIn', onComplete: () => b.destroy() }),
          });
        });
      }
      game.money += v;
      game.fx.floatText(t.x, t.y - 80, '+' + U.money(v), '#ffe14a', 30);
      MT.Audio.play('coin');
    },
    labOverload(game, t) {
      game.timed.push({ type: 'overdrive', t: 20, x: t.x, y: t.y, r: 5000 });
      game.towers.forEach((o) => {
        if (o !== t && o.stats.attack !== 'none') game.fx.lightning(t.x, t.y - 40, o.x, o.y - 20, 0xe040fb, 2, 0.4);
      });
      game.fx.shockwave(t.x, t.y, 900, 0xe040fb, 700);
      game.fx.bigText('LAB OVERLOAD!', '#e040fb', 46);
    },
    supernova(game, t, all) {
      game.slowmo = 0.6;
      game.fx.screenFlash(0xffffff, 0.7, 900);
      game.fx.shockwave(t.x, t.y, 1400, 0xfff176, 1000);
      game.fx.shockwave(t.x, t.y, 900, 0xffffff, 700);
      game.fx.glow.particleTint = 0xfff176;
      game.fx.glow.explode(40, t.x, t.y - 20);
      game.shake(0.45);
      all.forEach((e) => {
        if (e.boss) game.damageEnemy(e, 25000, t);
        else obliterate(game, e, t);
      });
      game.fx.bigText('SUPERNOVA!', '#fff176', 56);
      MT.Audio.play('nuke');
    },
  };

  // a cured purple minion turns back yellow and hops away
  function cured(game, x, y) {
    const img = game.add.image(x, y, 'fx_cured').setScale(0.4 / S).setDepth(6200);
    game.tweens.add({ targets: img, scale: 1 / S, y: y - 26, duration: 260, ease: 'Back.easeOut' });
    game.tweens.add({ targets: img, alpha: 0, y: y - 46, delay: 600, duration: 400, onComplete: () => img.destroy() });
  }

  function kevinStomp(game, t) {
    const R = 200;
    game.enemiesInRange(t.x, t.y, R, true).forEach((e) => {
      if (e.boss) game.damageEnemy(e, 120, t);
      else game.applyHit(e, { dmg: 8, knock: 4, type: 'normal' }, t);
    });
    game.fx.shockwave(t.x, t.y + 10, R, 0xffd83a, 420);
    game.fx.dust.explode(10, t.x, t.y + 20);
    game.shake(0.06);
    MT.Audio.play('stomp');
  }

  // per-simulation-step update of runners (stampede, tsunami) and biters
  function step(game, dt) {
    const R = game.runners;
    for (let i = R.length - 1; i >= 0; i--) {
      const r = R[i];
      r.dist -= r.speed * dt;
      const p = r.path.at(r.dist);
      r.x = p.x;
      r.y = p.y;
      if (r.kind === 'minion') {
        if (r.dist < r.path.length) {
          for (const e of game.queryEnemies(p.x, p.y, 30)) {
            if (e.dead || r.hit.has(e.id) || U.dist2(p.x, p.y, e.x, e.y) > (e.radius + 12) ** 2) continue;
            r.hit.add(e.id);
            const kids = e.boss ? game.damageEnemy(e, 50, r.tower) : game.applyHit(e, { dmg: 4, knock: 6, type: 'normal' }, r.tower);
            if (kids) kids.forEach((k) => r.hit.add(k.id));
            r.pierce--;
            if (r.pierce <= 0) break;
          }
        }
        if (r.pierce <= 0 || r.dist < -30) {
          game.fx.dust.explode(4, p.x, p.y);
          r.sprite.destroy();
          R.splice(i, 1);
        }
      } else if (r.kind === 'wave') {
        for (const e of game.enemies) {
          if (e.dead || e.path !== r.path || r.hit.has(e.id) || e.dist < r.dist) continue;
          r.hit.add(e.id);
          e.dist = Math.max(0, e.dist - (e.boss ? 90 : 220));
          e.applySlow(e.boss ? 0.7 : 0.4, 8, true, true);
          e.applyDot({ dmg: e.boss ? 20 : 2, every: 0.5, dur: 6 }, r.tower);
        }
        if (r.dist < -40) {
          r.sprite.destroy();
          R.splice(i, 1);
        }
      }
    }
    const B = game.biters;
    for (let i = B.length - 1; i >= 0; i--) {
      const b = B[i];
      if (b.flying) continue;
      if (!b.e || b.e.dead) {
        // find a new victim
        const next = b.kind === 'piranha' ? byStrength(alive(game))[0] : null;
        if (next && b.t > 0.3) b.e = next;
        else {
          if (b.kind === 'beam') game.tweens.add({ targets: b.sprite, alpha: 0, duration: 200, onComplete: () => b.sprite.destroy() });
          else b.sprite.destroy();
          B.splice(i, 1);
          continue;
        }
      }
      b.t -= dt;
      if (b.kind === 'piranha') {
        game.damageEnemy(b.e, (b.e.boss ? 350 : 60) * dt, b.tower);
      } else if (b.kind === 'beam') {
        game.damageEnemy(b.e, b.dps * dt, b.tower);
        b.tick -= dt;
        if (b.tick <= 0 && !b.e.dead) {
          b.tick = 0.15;
          game.enemiesInRange(b.e.x, b.e.y, 120, true).forEach((o) => o !== b.e && game.damageEnemy(o, o.boss ? 80 : 4, b.tower));
        }
      }
      if (b.t <= 0) {
        if (b.kind === 'beam') game.tweens.add({ targets: b.sprite, alpha: 0, duration: 250, onComplete: () => b.sprite.destroy() });
        else {
          game.fx.puffs.explode(4, b.sprite.x, b.sprite.y);
          b.sprite.destroy();
        }
        B.splice(i, 1);
      }
    }
  }

  // per-frame visuals for runners and biters
  function render(game, dt, time) {
    for (const r of game.runners) {
      if (r.x == null) continue;
      if (r.kind === 'minion') {
        r.ph += dt * 18;
        const a = r.path.angleAt(Math.max(0, Math.min(r.path.length, r.dist)));
        r.sprite.setPosition(r.x, r.y - Math.abs(Math.sin(r.ph)) * 5 - 6);
        r.sprite.setFlipX(Math.cos(a) > 0);
        r.sprite.setRotation(Math.sin(r.ph) * 0.15);
        r.sprite.setDepth(1000 + r.y);
      } else {
        const a = r.path.angleAt(Math.max(0, Math.min(r.path.length, r.dist)));
        r.sprite.setPosition(r.x, r.y - 10).setRotation(a + Math.PI);
        r.sprite.setScale((1 + Math.sin(time * 0.02) * 0.05) / S);
        if (Math.random() < 0.6) {
          game.fx.goo.explode(1, r.x + U.rand(-20, 20), r.y + U.rand(-14, 14));
        }
      }
    }
    for (const b of game.biters) {
      if (!b.e || b.e.dead) continue;
      if (b.kind === 'piranha' && !b.flying) {
        const ch = Math.sin(time * 0.05 + b.t * 7);
        b.sprite.setPosition(b.e.x + Math.cos(time * 0.01 + b.t) * b.e.radius * 0.6, b.e.y - b.e.radius * 0.4 + ch * 3);
        b.sprite.setScale((1 + ch * 0.1) / S, (1 - ch * 0.1) / S);
      } else if (b.kind === 'beam') {
        b.sprite.setPosition(b.e.x, b.e.y + 6);
        b.sprite.scaleX = (1.1 + Math.sin(time * 0.05) * 0.15) / S;
        if (Math.random() < 0.7) game.fx.sparks.explode(1, b.e.x + U.rand(-20, 20), b.e.y + U.rand(-10, 10));
      }
    }
  }

  function use(game, t, id) {
    const fn = IMPL[id];
    if (fn) fn(game, t, alive(game));
  }

  MT.Abilities = { use, step, render, kevinStomp, IMPL };
})();
