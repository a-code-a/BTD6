// Giant / boss behaviour and presentation: warning banners when a new giant
// shows up, special powers (EMP, blink, rage phases) and the death sequences.
(function () {
  const U = MT.util;
  const W = MT.CFG.MAP_W, H = MT.CFG.H;
  const S = MT.Draw.S;

  // colour and tagline for the entrance banner
  const INTRO = {
    mega: { color: '#c490ea', tag: 'A giant mutant with 200 health.' },
    titan: { color: '#ff7a5a', tag: 'Armored, slow and very, very tough.' },
    zeppelin: { color: '#ffd83a', tag: 'An airship packed with Purple Titans!' },
    phantom: { color: '#b3a6ff', tag: 'Always Camo. Blinks forward through space!' },
    mecha: { color: '#80d8ff', tag: 'Armored. Its EMP pulse shuts down towers!' },
    goo: { color: '#9be15d', tag: 'Regenerates health and ignores jelly!' },
    macho: { color: '#ff4a3a', tag: 'He drank the PX-41 serum. THE FINAL BOSS!' },
    vector: { color: '#ff8a3a', tag: 'Squid launcher armed. Oh yeah!' },
    bratt: { color: '#c06bff', tag: 'Bubblegum, keytar, mullet. It is 1985 again!' },
    scarlet: { color: '#ff4a6a', tag: 'Flying in a rocket dress: only anti-air can hurt her!' },
  };
  // death-burst colour per giant
  const DEATH = { mega: 0xc490ea, titan: 0xff7a5a, zeppelin: 0xffd83a, phantom: 0xb3a6ff, mecha: 0x80d8ff, goo: 0x9be15d, macho: 0xff4a3a, vector: 0xff8a3a, bratt: 0xc06bff, scarlet: 0xff4a6a };
  // gentle screen shake when a giant goes down (much smaller than before)
  const SHAKE = { mega: 0.08, titan: 0.16, zeppelin: 0.26, phantom: 0.12, mecha: 0.2, goo: 0.16, macho: 0.75, vector: 0.6, bratt: 0.6, scarlet: 0.6 };

  function onSpawn(game, e) {
    if (game.seenBoss[e.type]) return;
    game.seenBoss[e.type] = true;
    if (INTRO[e.type]) intro(game, e.type);
  }

  // slide-in "WARNING" banner across the map (queued so two never overlap)
  function intro(game, type) {
    const s = game;
    if (s.introBusy) {
      s.introQueue = s.introQueue || [];
      s.introQueue.push(type);
      return;
    }
    s.introBusy = true;
    const def = MT.ENEMIES[type];
    const info = INTRO[type];
    const big = !!def.final || !!def.bossFight;
    const c = s.add.container(W + 600, H * 0.36).setDepth(6950);
    const g = s.add.graphics();
    const bw = 760, bh = big ? 132 : 104;
    g.fillStyle(0x0b0612, 0.88);
    g.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 18);
    g.lineStyle(4, U.hexInt(info.color), 1);
    g.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 18);
    // hazard stripes
    for (let i = 0; i < 2; i++) {
      const yy = i === 0 ? -bh / 2 + 6 : bh / 2 - 14;
      for (let k = -bw / 2 + 14; k < bw / 2 - 20; k += 22) {
        g.fillStyle(i === 0 ? 0xffc61a : 0xffc61a, 0.85);
        g.fillTriangle(k, yy, k + 11, yy, k + 4, yy + 8);
      }
    }
    c.add(g);
    const icon = s.add.image(-bw / 2 + 80, 0, MT.EnemyArt.key(s, type, false, false, 0));
    const ih = icon.height / S;
    icon.setScale(Math.min(1, (bh - 18) / ih) / S);
    c.add(icon);
    c.add(MT.text(s, 40, -bh / 2 + 26, def.bossFight ? '!!  BOSS BATTLE  !!' : big ? '!!  FINAL BOSS  !!' : '!  WARNING  !', 18, { title: true, color: '#ffc61a' }));
    c.add(MT.text(s, 40, big ? -2 : 4, def.name.toUpperCase(), big ? 44 : 36, { title: true, color: info.color }));
    c.add(MT.text(s, 40, bh / 2 - 22, info.tag, 16, { color: '#ffffff' }));
    MT.Audio.play(big ? 'roar' : 'warning');
    game.fx.vignette(U.hexInt(info.color), big ? 0.6 : 0.4, big ? 1400 : 900);
    if (big) game.shake(0.25);
    s.tweens.add({ targets: c, x: W / 2, duration: 420, ease: 'Back.easeOut' });
    s.tweens.add({
      targets: c, x: -700, delay: big ? 2600 : 2000, duration: 380, ease: 'Back.easeIn',
      onComplete: () => {
        c.destroy();
        s.introBusy = false;
        const next = s.introQueue && s.introQueue.shift();
        if (next) intro(s, next);
      },
    });
  }

  function death(game, e) {
    if (e.def.bossFight) {
      game.fx.bossDeath(e.x, e.y - e.radius * 0.2, e.radius * 1.4, DEATH[e.type], true);
      game.shake(SHAKE[e.type]);
      MT.BossFight.onDeath(game, e);
      return;
    }
    const big = !!e.def.final;
    const col = DEATH[e.type] || 0xc490ea;
    game.fx.bossDeath(e.x, e.y - e.radius * 0.2, e.radius, col, big);
    game.shake(SHAKE[e.type] || 0.1);
    if (e.type === 'goo') {
      game.fx.splat(e.x, e.y, e.radius * 2, 0x9be15d);
      MT.Audio.play('splat');
    }
    if (e.type === 'mecha') {
      game.fx.sparks.explode(20, e.x, e.y - e.radius * 0.5);
      MT.Audio.play('emp');
    }
    if (big) {
      game.slowmo = 0.9;
      game.fx.screenFlash(0xffffff, 0.55, 700);
      game.fx.bigText('EL MACHO DEFEATED!', '#ffd83a', 56, 'The PX-41 menace is over... for now.');
      MT.Audio.play('victory');
      // confetti burst
      game.fx.notes.explode(16, e.x, e.y - 40);
    }
  }

  // phantom: leave an afterimage and pop up further along the track
  function blink(game, e) {
    const d = e.def.blink.dist;
    if (e.remaining < d + 60) return;
    const ghost = game.add.image(e.sprite.x, e.sprite.y, e.sprite.texture.key).setOrigin(e.sprite.originX, e.sprite.originY).setScale(1 / S).setAlpha(0.6).setTint(0xb3a6ff).setDepth(e.sprite.depth - 1);
    game.tweens.add({ targets: ghost, alpha: 0, scaleX: 1.3 / S, scaleY: 0.7 / S, duration: 380, onComplete: () => ghost.destroy() });
    game.fx.ring(e.x, e.y, e.radius * 1.4, 0xb3a6ff, { dur: 300 });
    e.dist += d;
    const p = e.path.at(e.dist);
    e.x = p.x;
    e.y = p.y;
    e.burst = true;
    e.age = 0;
    game.fx.ring(e.x, e.y, e.radius * 1.8, 0xd1c4ff, { disc: true, dur: 360 });
    MT.Audio.play('blink');
  }

  // mecha: electromagnetic pulse that knocks out nearby towers
  function emp(game, e) {
    const em = e.def.emp;
    let n = 0;
    for (const t of game.towers) {
      if (t.hero || t.stats.attack === 'none') continue;
      if (U.dist(t.x, t.y, e.x, e.y) > em.r) continue;
      t.disabled = Math.max(t.disabled, em.dur);
      game.fx.lightning(e.x, e.y - e.radius * 0.8, t.x, t.y - 20, 0x80d8ff, 2.4, 0.3);
      n++;
    }
    game.fx.shockwave(e.x, e.y, em.r, 0x80d8ff, 520);
    game.fx.ring(e.x, e.y, em.r, 0x40c4ff, { disc: true, dur: 420, force: true });
    if (n) {
      game.fx.floatText(e.x, e.y - e.radius - 30, 'EMP!', '#80d8ff', 24);
      MT.Audio.play('emp');
    }
  }

  // El Macho gets angrier (and calls friends) as his health drops
  function checkPhase(game, e) {
    if (e.ai) return MT.BossFight.phase(game, e);
    const ph = e.def.phases;
    if (e.phase >= ph.length) return;
    if (e.hp / e.maxHp > ph[e.phase]) return;
    e.phase++;
    e.enrage = 1 + e.phase * 0.35;
    const spawn = (type, n, camo) => {
      for (let i = 0; i < n; i++) {
        const k = new MT.Enemy(game, type, { path: e.pathIndex, dist: Math.max(0, e.dist - 40 - i * 18), camo, burst: true });
        game.enemies.push(k);
      }
    };
    spawn('brute', 4 + e.phase * 2, false);
    spawn('mega', 1 + e.phase, false);
    game.fx.shockwave(e.x, e.y, 260, 0xff4a3a, 600);
    game.fx.vignette(0xff2020, 0.55, 900);
    game.fx.floatText(e.x, e.y - e.radius - 40, e.phase === 1 ? 'EL MACHO IS ANGRY!' : 'EL MACHO IS FURIOUS!', '#ff6b6b', 26);
    game.shake(0.3);
    MT.Audio.play('roar');
  }

  // big health bar across the top of the map while a final boss is alive
  function drawBar(game, g, time) {
    g.clear();
    const boss = game.enemies.find((e) => !e.dead && (e.def.final || e.def.bossFight));
    if (!boss) {
      if (game.bossBarText) game.bossBarText.setVisible(false);
      return;
    }
    const w = 520, h = 18, x = W / 2 - w / 2, y = 22;
    const f = Math.max(0, boss.hp / boss.maxHp);
    g.fillStyle(0x0b0612, 0.85);
    g.fillRoundedRect(x - 8, y - 8, w + 16, h + 30, 10);
    g.fillStyle(0x2a0f12, 1);
    g.fillRoundedRect(x, y, w, h, 7);
    const pulse = 0.85 + Math.sin(time * 0.01) * 0.15;
    g.fillStyle(boss.enrage > 1 ? 0xff2a2a : 0xe0452e, pulse);
    g.fillRoundedRect(x, y, Math.max(6, w * f), h, 7);
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(x + 3, y + 3, Math.max(2, w * f - 6), 5, 3);
    g.lineStyle(2, 0xffd83a, 1);
    g.strokeRoundedRect(x, y, w, h, 7);
    (boss.def.phases || []).forEach((p) => {
      g.lineStyle(2, 0x0b0612, 1);
      g.lineBetween(x + w * p, y, x + w * p, y + h);
    });
    // a self-shield shows as a glowing blue layer over the health bar
    const bb = boss.bubble;
    if (bb && bb.self && bb.hp > 0) {
      g.fillStyle(bb.color, 0.75 + Math.sin(time * 0.012) * 0.2);
      g.fillRoundedRect(x, y + h - 7, Math.max(6, w * (bb.hp / bb.max)), 7, 3);
    }
    if (!game.bossBarText) game.bossBarText = MT.text(game, W / 2, y + h + 12, '', 14, { title: true, color: '#ffd83a' }).setDepth(7001);
    const phase = boss.def.bossFight ? `   ·   PHASE ${boss.phase + 1}/3` : '';
    game.bossBarText.setVisible(true).setText(`${boss.def.name.toUpperCase()}   ${Math.ceil(boss.hp).toLocaleString('en-US')} / ${boss.maxHp.toLocaleString('en-US')}${phase}`);
  }

  MT.Bosses = { INTRO, onSpawn, intro, death, blink, emp, checkPhase, drawBar };
})();
