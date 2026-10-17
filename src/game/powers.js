// Powers: one-use items bought with Gru Coins in Gru's Lab and used from the
// POWERS panel in a game (hotkey P). Some are dropped onto the track.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const CFG = MT.CFG;

  // place: 'track' = must be dropped on the track, 'any' = anywhere on the map
  MT.POWERS = {
    peel: { name: 'Banana Peels', icon: 'pw_peel', cost: 15, place: 'track', desc: 'A pile of peels on the track: 40 mutants slip, lose a layer and slide back. Stays until it is used up.' },
    camoTrap: { name: 'Camo Sprinkler', icon: 'pw_camo', cost: 15, place: 'track', desc: 'A sprinkler on the track that washes the Camo paint off the next 300 mutants. Stays until it is used up.' },
    freeze: { name: 'Freeze Bomb', icon: 'pw_freeze', cost: 20, place: 'any', r: 150, desc: 'Freezes every small mutant in a big circle for 4 seconds and stuns the giants in it.' },
    cash: { name: 'Cash Drop', icon: 'pw_cash', cost: 25, desc: 'Gru drops a crate with $1,000.' },
    boost: { name: 'Minion Boost', icon: 'pw_boost', cost: 30, desc: 'Every tower attacks twice as fast for 15 seconds.' },
    lives: { name: 'Healthy Bananas', icon: 'pw_lives', cost: 30, desc: '+25 lives, right now.' },
  };
  MT.POWER_ORDER = ['peel', 'camoTrap', 'freeze', 'cash', 'boost', 'lives'];

  // how many the player has (the sandbox has as many as it likes)
  const count = (g, id) => (g.sandbox ? Infinity : MT.Save.powerCount(id));

  function consume(g, id) {
    if (!g.sandbox) {
      MT.Save.addPower(id, -1);
      MT.Save.bump('powersUsed');
    }
    g.cnt.powers++;
    g.powerCd[id] = 1;
    g.hud.refreshPowers();
    g.markDirty();
    MT.Ach.check(g);
  }

  function use(g, id) {
    const P = MT.POWERS[id];
    if (!P || g.over || g.paused) return;
    if (count(g, id) <= 0) {
      MT.Audio.play('error');
      g.hud.toast(`No ${P.name} left! Buy more in Gru's Lab.`, 1800);
      return;
    }
    if ((g.powerCd[id] || 0) > 0) return;
    if (P.place) {
      g.cancelPlacing();
      g.cancelMove();
      g.spotting = null;
      g.select(null);
      g.powerPlacing = id;
      g.hud.toast(P.place === 'track' ? `Click the track to drop the ${P.name}  ·  Esc to cancel` : `Click where the ${P.name} should go off  ·  Esc to cancel`, 2200);
      g.hud.refreshPowers();
      MT.Audio.play('click');
      return;
    }
    IMPL[id](g);
    MT.Audio.play('ability');
    consume(g, id);
  }

  // the nearest point on any track, if (x, y) is on (or right next to) one
  function trackSpot(g, x, y) {
    let best = null, bd = Infinity;
    for (const p of g.paths) {
      const d = p.project(x, y);
      const q = p.at(d);
      const dd = U.dist(x, y, q.x, q.y);
      if (dd < bd) {
        bd = dd;
        best = { x: q.x, y: q.y };
      }
    }
    return best && bd <= g.mapDef.pathWidth / 2 + 14 ? best : null;
  }

  function drop(g, x, y) {
    const id = g.powerPlacing;
    const P = MT.POWERS[id];
    if (!P) return;
    let at = { x, y };
    if (P.place === 'track') {
      at = trackSpot(g, x, y);
      if (!at) {
        MT.Audio.play('error');
        g.hud.toast('Drop it on the track!', 1200);
        return;
      }
    }
    g.powerPlacing = null;
    IMPL[id](g, at.x, at.y);
    MT.Audio.play('place');
    consume(g, id);
  }

  // ---------------------------------------------------------------- the powers
  function peelPile(g, x, y, pierce) {
    const sprite = g.add.image(x, y - 140, 'fx_peelpile').setScale(1 / S).setDepth(981 + y * 0.001);
    const p = { tex: 'fx_peelpile', dmg: 1, pierce: 40, type: 'normal', knock: 7, stun: { dur: 0.4 }, ground: true };
    const tr = { x, y, p, pierce: pierce || p.pierce, max: p.pierce, life: 1e9, tower: null, hit: new Set(), sprite, keep: 'peel' };
    g.tweens.add({ targets: sprite, y, duration: 260, ease: 'Bounce.easeOut' });
    g.traps.push(tr);
    return tr;
  }

  function sprinkler(g, x, y, left) {
    const sprite = g.add.image(x, y, 'fx_sprinkler').setScale(0.3 / S).setDepth(982 + y * 0.001);
    g.tweens.add({ targets: sprite, scale: 1 / S, duration: 300, ease: 'Back.easeOut' });
    const ct = { x, y, r: 36, left: left || 300, sprite, spray: 0 };
    g.camoTraps.push(ct);
    return ct;
  }

  const IMPL = {
    peel(g, x, y) {
      peelPile(g, x, y);
      g.fx.dust.explode(6, x, y);
    },
    camoTrap(g, x, y) {
      sprinkler(g, x, y);
      g.fx.water.explode(8, x, y);
    },
    freeze(g, x, y) {
      const r = MT.POWERS.freeze.r;
      g.enemiesInRange(x, y, r, true).forEach((e) => {
        if (e.def.immune && e.def.immune.includes('cold')) return;
        if (e.boss) e.tryStun(1.2);
        else {
          e.freeze = Math.max(e.freeze, 4);
          e.brittle = true;
        }
      });
      g.fx.ring(x, y, r, 0xb3ecff, { disc: true, dur: 500, force: true });
      g.fx.shockwave(x, y, r, 0xe1f5fe, 500);
      g.fx.snow.explode(24, x, y);
      g.fx.screenFlash(0xd8f4ff, 0.25, 300);
      MT.Audio.play('freeze');
    },
    cash(g) {
      const x = U.rand(160, CFG.MAP_W - 160), y = U.rand(160, CFG.H - 140);
      const crate = g.add.image(x, y - 320, 'fx_crate').setScale(1 / S).setDepth(6500);
      g.tweens.add({
        targets: crate, y, duration: 900, ease: 'Sine.easeIn',
        onComplete: () => {
          g.fx.smoke.explode(10, x, y + 12);
          g.money += 1000;
          g.fx.floatText(x, y - 30, '+$1,000', '#7CFF6B', 26);
          g.hud.flashMoney();
          MT.Audio.play('coin');
          g.tweens.add({ targets: crate, alpha: 0, delay: 500, duration: 400, onComplete: () => crate.destroy() });
        },
      });
    },
    boost(g) {
      g.timed.push({ type: 'overdrive', t: 15, x: 0, y: 0, r: 99999 });
      g.towers.forEach((t) => {
        if (t.stats.attack !== 'none') g.fx.ring(t.x, t.y, 40, 0xffeb3b, { dur: 400 });
      });
      g.fx.screenFlash(0xffeb3b, 0.2, 300);
      g.hud.toast('MINION BOOST! Every tower attacks 2x faster for 15s.', 2000);
    },
    lives(g) {
      if (!g.sandbox) g.lives += 25;
      g.fx.floatText(CFG.MAP_W - 120, 60, '+25 ♥', '#ff5c7a', 28);
      g.fx.screenFlash(0xff5c7a, 0.15, 300);
      MT.Audio.play('coin');
    },
  };

  // per simulation step: the camo sprinklers, cooldowns
  function step(g, dt) {
    for (const k in g.powerCd) if (g.powerCd[k] > 0) g.powerCd[k] -= dt;
    const C = g.camoTraps;
    for (let i = C.length - 1; i >= 0; i--) {
      const ct = C[i];
      ct.spray -= dt;
      for (const e of g.queryEnemies(ct.x, ct.y, ct.r + 30)) {
        if (e.dead || !e.camo || e.flying || e.burrowed || e.def.alwaysCamo) continue;
        if (U.dist2(ct.x, ct.y, e.x, e.y) > (ct.r + e.radius * 0.5) ** 2) continue;
        e.camo = false;
        e.sprite.setTexture(e.texKey()).setAlpha(1);
        g.fx.sparkle(e.x, e.y - e.radius, 0x80deea);
        ct.left--;
        if (ct.spray <= 0) {
          ct.spray = 0.25;
          g.fx.water.explode(3, ct.x, ct.y - 6);
        }
        if (ct.left <= 0) break;
      }
      if (ct.left <= 0) {
        const sp = ct.sprite;
        g.tweens.add({ targets: sp, alpha: 0, scale: sp.scale * 0.5, duration: 250, onComplete: () => sp.destroy() });
        C.splice(i, 1);
      }
    }
  }

  // drop preview while placing a power
  function preview(g, rg, time) {
    const P = MT.POWERS[g.powerPlacing];
    const x = g.pointer.x, y = g.pointer.y;
    if (!P || x >= CFG.MAP_W) return;
    if (P.place === 'track') {
      const at = trackSpot(g, x, y);
      const ok = !!at;
      const px = ok ? at.x : x, py = ok ? at.y : y;
      rg.fillStyle(ok ? 0x5cff5c : 0xff3030, 0.3);
      rg.fillCircle(px, py, 24);
      g.drawCrosshair(rg, px, py, time, ok ? 0x5cff5c : 0xff3030);
    } else {
      rg.fillStyle(0xb3ecff, 0.16);
      rg.fillCircle(x, y, P.r);
      rg.lineStyle(2, 0xe1f5fe, 0.7);
      rg.strokeCircle(x, y, P.r);
      g.drawCrosshair(rg, x, y, time, 0x80d8ff);
    }
  }

  MT.Powers = { use, drop, step, preview, count, peelPile, sprinkler, trackSpot };
})();
