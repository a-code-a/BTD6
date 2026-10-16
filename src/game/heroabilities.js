// Abilities of Dru, Agnes and El Macho (heroes from data/heroes2.js).
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const W = MT.CFG.MAP_W, H = MT.CFG.H;

  const powerOf = (t) => (t && t.power) || 1;
  const more = (n, pw) => Math.round(n * (0.6 + 0.4 * pw));
  const alive = (g) => g.enemies.filter((e) => !e.dead);
  const byStrength = (list) => list.slice().sort((a, b) => (b.boss - a.boss) || b.def.rbe - a.def.rbe || b.hp - a.hp);

  // something big charging back down every track (see Abilities.step, kind 'charge')
  function charge(g, t, o) {
    g.paths.forEach((path, pi) => {
      const sprite = g.add.image(-200, -200, o.tex).setScale((o.scale || 1) / S).setDepth(1000);
      g.runners.push(Object.assign({
        kind: 'charge', path, dist: path.length + 60 + pi * 40, hit: new Set(), tower: t, sprite, ph: 0,
      }, o.run));
    });
  }

  Object.assign(MT.Abilities.IMPL, {
    // ------------------------------------------------------------ Dru
    familyFortune(g, t) {
      const pw = powerOf(t);
      const v = U.round5((250 + g.round * 25) * Math.min(1, g.cashMul * 2 + 0.4) * pw);
      for (let i = 0; i < 18; i++) {
        g.time.delayedCall(i * 35, () => {
          const x = t.x + U.rand(-90, 90), y = t.y + U.rand(-50, 50);
          const c = g.add.image(x, y - 260, 'p_goldcoin').setScale(1.4 / S).setDepth(6500);
          g.tweens.add({
            targets: c, y, angle: 540, duration: 480, ease: 'Bounce.easeOut',
            onComplete: () => g.tweens.add({ targets: c, x: 1062, y: 74, scale: 0.5 / S, delay: 150, duration: 420, ease: 'Quad.easeIn', onComplete: () => c.destroy() }),
          });
        });
      }
      g.money += v;
      t.earned += v;
      g.hud.flashMoney();
      g.fx.weather('gold', 2);
      g.fx.floatText(t.x, t.y - 80, '+' + U.money(v), '#ffe14a', 28);
      MT.Audio.play('coin');
    },
    goldenCar(g, t) {
      const pw = powerOf(t);
      charge(g, t, {
        tex: 'fx_goldcar', scale: 1,
        run: { speed: 420, radius: 26, pierce: more(70, pw), dmg: 6 * pw, bossDmg: 900 * pw, knock: 10, gold: 1, bob: 1.5, trail: [0xffd740, 0xfff59d] },
      });
      g.fx.floatText(t.x, t.y - 80, 'VROOOM!', '#ffd740', 26);
      MT.Audio.play('jet');
    },

    // ------------------------------------------------------------ Agnes
    soFluffy(g, t) {
      const pw = powerOf(t);
      const R = 260 + 75 * (pw - 1);
      g.enemiesInRange(t.x, t.y, R, true).forEach((e) => {
        if (e.boss) e.tryStun(1.5);
        else e.dance = Math.max(e.dance, 3 + (pw - 1));
      });
      g.healLives(Math.round(3 * pw), t.x, t.y - 90);
      g.fx.shockwave(t.x, t.y, R, 0xff9ce6, 650);
      g.fx.ring(t.x, t.y, R, 0xffffff, { disc: true, dur: 500, force: true, alpha: 0.5 });
      for (let i = 0; i < 6; i++) g.fx.sparkle(t.x + U.rand(-50, 50), t.y - U.rand(10, 80), U.pick([0xff9ce6, 0xfff176, 0x80d8ff]));
      g.fx.notes.explode(8, t.x, t.y - 40);
      g.fx.floatText(t.x, t.y - 70, "IT'S SO FLUFFY!", '#ff9ce6', 26);
      MT.Audio.play('papoy');
    },
    unicornParade(g, t) {
      const pw = powerOf(t);
      charge(g, t, {
        tex: 'fx_unicorn', scale: 1.1,
        run: { speed: 340, radius: 30, pierce: more(60, pw), dmg: 5 * pw, bossDmg: 600 * pw, knock: 14, stun: { dur: 1 }, bob: 6, trail: [0xff5252, 0xffd740, 0x69f0ae, 0x40c4ff, 0xb388ff] },
      });
      g.fx.screenFlash(0xff9ce6, 0.2, 400);
      g.fx.floatText(t.x, t.y - 80, 'UNICORN PARADE!', '#ff9ce6', 26);
      MT.Audio.play('victory');
    },

    // ------------------------------------------------------------ El Macho
    pollito(g, t) {
      const pw = powerOf(t);
      const targets = byStrength(alive(g)).slice(0, more(4, pw));
      targets.forEach((e, i) => {
        const sprite = g.add.image(t.x, t.y - 30, 'fx_chicken').setScale(1 / S).setDepth(6300);
        const b = { kind: 'chicken', e, t: 4, pw, sprite, flying: true, tower: t };
        g.biters.push(b);
        const st = { k: 0 };
        const sx = t.x, sy = t.y - 30;
        g.tweens.add({
          targets: st, k: 1, duration: 450, delay: i * 90, ease: 'Quad.easeIn',
          onUpdate: () => {
            const tg = b.e && !b.e.dead ? b.e : null;
            const gx = tg ? tg.x : sx, gy = tg ? tg.y - 10 : sy;
            sprite.setPosition(U.lerp(sx, gx, st.k), U.lerp(sy, gy, st.k) - Math.sin(st.k * Math.PI) * 90);
            sprite.setFlipX(gx < sx);
          },
          onComplete: () => (b.flying = false),
        });
      });
      g.fx.floatText(t.x, t.y - 80, 'POLLITO!', '#ff5252', 26);
      MT.Audio.play('squid');
    },
    sharkRocket(g, t, all) {
      const pw = powerOf(t);
      const target = byStrength(all.filter((e) => e.boss))[0] || byStrength(all)[0];
      g.launchMissile(t, target, 'fx_sharkrocket', (tg) => {
        const x = tg ? tg.x : W / 2, y = tg ? tg.y : H / 2;
        if (tg && !tg.dead) g.damageEnemy(tg, (tg.boss ? 6000 : 50) * pw, t);
        g.explode(x, y, { tex: 'p_rocket', type: 'explosive', explode: { r: 140, dmg: 25 * pw, pierce: 200 }, moabDmg: 400 * pw }, t);
        g.fx.shockwave(x, y, 260, 0xff5252, 650);
        g.fx.water.explode(16, x, y);
        g.fx.floatText(x, y - 60, 'OLÉ!', '#ff5252', 30);
        g.shake(0.3);
      });
      g.fx.floatText(t.x, t.y - 80, 'SHARK ROCKET!', '#ff5252', 26);
      MT.Audio.play('rocket');
    },
  });
})();
