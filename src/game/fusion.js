// Fusions, three levels deep:
//  - Super Fusion: three towers of one kind with a tier-4 upgrade -> one super tower
//  - Ultimate:     three super towers of the SAME kind -> its giant Ultimate form
//  - Omega:        three super towers of DIFFERENT kinds -> one Omega Tower that
//                  fires all three attacks and owns all three abilities
// The selected tower is the one that transforms; the partners fly into it.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const NEEDED = 3;

  // ---------------------------------------------------------------- who can take part
  const maxedOfType = (game, type) => game.towers.filter((t) => t.type === type && t.maxed && !t.fusing);
  const isPlainFused = (t) => t.fused && !t.ultimate && !t.omega && !t.component && !t.fusing;
  const fusedOfType = (game, type) => game.towers.filter((t) => t.type === type && isPlainFused(t));

  const nearestFirst = (t, list) => list.slice().sort((a, b) => U.dist2(a.x, a.y, t.x, t.y) - U.dist2(b.x, b.y, t.x, t.y));

  // super fusion partners
  function candidates(game, t) {
    if (!t || t.hero || t.fused || !t.def.fusion) return [];
    return [t].concat(nearestFirst(t, maxedOfType(game, t.type).filter((o) => o !== t)).slice(0, NEEDED - 1));
  }

  function ultimateCandidates(game, t) {
    if (!t || !isPlainFused(t)) return [];
    return [t].concat(nearestFirst(t, fusedOfType(game, t.type).filter((o) => o !== t)).slice(0, NEEDED - 1));
  }

  // one fused tower each of two other kinds, nearest first
  function omegaCandidates(game, t) {
    if (!t || !isPlainFused(t)) return [t].filter(Boolean);
    const out = [t];
    const seen = { [t.type]: true };
    for (const o of nearestFirst(t, game.towers.filter((o) => o !== t && isPlainFused(o)))) {
      if (seen[o.type]) continue;
      seen[o.type] = true;
      out.push(o);
      if (out.length >= NEEDED) break;
    }
    return out;
  }

  // ---------------------------------------------------------------- status for the UI
  function status(game, t) {
    const f = t.def.fusion;
    if (!f || t.hero || t.fused || t.fusing) return { can: false, reason: '' };
    const have = maxedOfType(game, t.type).length;
    const cost = game.price(f.cost);
    if (!t.maxed) return { can: false, have, cost, reason: 'This tower needs a tier 4 upgrade first.' };
    if (have < NEEDED) return { can: false, have, cost, reason: `Needs ${NEEDED} ${t.def.name}s with a tier 4 upgrade (you have ${have}).` };
    if (cost > game.money) return { can: false, have, cost, reason: 'Not enough bananas!' };
    return { can: true, have, cost, reason: '' };
  }

  function ultimateStatus(game, t) {
    if (!t || !isPlainFused(t)) return { can: false, reason: '' };
    const have = fusedOfType(game, t.type).length;
    const cost = game.price(t.def.fusion.ultimate.cost);
    if (have < NEEDED) return { can: false, have, cost, reason: `Needs ${NEEDED} ${t.def.fusion.name}s (you have ${have}).` };
    if (cost > game.money) return { can: false, have, cost, reason: 'Not enough bananas!' };
    return { can: true, have, cost, reason: '' };
  }

  function omegaStatus(game, t) {
    if (!t || !isPlainFused(t)) return { can: false, reason: '' };
    const have = omegaCandidates(game, t).length;
    const cost = game.price(MT.OMEGA.cost);
    if (have < NEEDED) return { can: false, have, cost, reason: `Needs ${NEEDED} super towers of DIFFERENT kinds (you have ${have}).` };
    if (cost > game.money) return { can: false, have, cost, reason: 'Not enough bananas!' };
    return { can: true, have, cost, reason: '' };
  }

  // toast once when a new kind of fusion becomes possible
  function checkHint(game, type) {
    if (MT.TOWERS[type] && MT.TOWERS[type].fusion && !game.fusionHinted[type] && maxedOfType(game, type).length >= NEEDED) {
      game.fusionHinted[type] = true;
      game.hud.toast(`SUPER FUSION ready: ${MT.TOWERS[type].fusion.name}!\nSelect a maxed ${MT.TOWERS[type].name} and press FUSE.`, 3600, true);
      MT.Audio.play('fusionReady');
    }
  }

  function checkGiantHints(game) {
    const fused = game.towers.filter(isPlainFused);
    const byType = {};
    fused.forEach((t) => (byType[t.type] = (byType[t.type] || 0) + 1));
    for (const type in byType) {
      if (byType[type] >= NEEDED && !game.fusionHinted['ult_' + type]) {
        game.fusionHinted['ult_' + type] = true;
        game.hud.toast(`ULTIMATE ready: ${MT.TOWERS[type].fusion.ultimate.name}!\nSelect a ${MT.TOWERS[type].fusion.name} and press ULTIMATE.`, 3600, true);
        MT.Audio.play('fusionReady');
        return;
      }
    }
    if (Object.keys(byType).length >= NEEDED && !game.fusionHinted.omega) {
      game.fusionHinted.omega = true;
      game.hud.toast('OMEGA MECH ready!\nSelect a super tower and press OMEGA.', 3600, true);
      MT.Audio.play('fusionReady');
    }
  }

  // ---------------------------------------------------------------- shared animation
  // partners spiral up into the target, then onDone() transforms it
  function mergeAnimation(game, target, donors, col, big, onDone) {
    MT.Audio.play('fusion');
    donors.forEach((d, i) => {
      const sp = d.sprite;
      const sx = d.x, sy = d.y;
      const state = { k: 0 };
      game.tweens.add({
        targets: state, k: 1, duration: big ? 1200 : 900, delay: i * 120, ease: 'Cubic.easeIn',
        onUpdate: () => {
          const k = state.k;
          const ang = k * Math.PI * (big ? 3.5 : 2.5) + i * Math.PI;
          const rad = (1 - k) * (big ? 70 : 46);
          const x = U.lerp(sx, target.x, k) + Math.cos(ang) * rad;
          const y = U.lerp(sy, target.y, k) + Math.sin(ang) * rad * 0.6 - Math.sin(k * Math.PI) * (big ? 140 : 90);
          sp.setPosition(x, y).setScale((1 - k * 0.7) / S).setRotation(k * 8).setDepth(6200);
          sp.setTint(Phaser.Display.Color.GetColor(255, 255 - k * 120, 255 - k * 60));
          game.fx.sparkle(x, y, col);
          if (d.aura) d.aura.setPosition(x, y);
          if (d.halo) d.halo.setPosition(x, y);
        },
        onComplete: () => d.destroy(),
      });
    });
    game.fx.ring(target.x, target.y, big ? 170 : 120, col, { dur: big ? 1200 : 900, force: true });
    game.fx.ring(target.x, target.y, 70, 0xffffff, { dur: 600, force: true });
    const pillar = game.add.image(target.x, target.y - 20, 'fx_pillar').setOrigin(0.5, 0.92).setTint(col).setAlpha(0)
      .setScale((big ? 1 : 0.6) / S, 0.2 / S).setDepth(6150).setBlendMode(Phaser.BlendModes.ADD);
    game.tweens.add({ targets: pillar, alpha: 0.9, scaleY: (big ? 2 : 1.4) / S, duration: big ? 1200 : 900, ease: 'Quad.easeIn' });
    if (big) game.fx.vignette(col, 0.4, 1600);
    game.time.delayedCall(big ? 1400 : 1050, () => {
      game.tweens.add({ targets: pillar, alpha: 0, scaleX: (big ? 2.4 : 1.6) / S, duration: 500, onComplete: () => pillar.destroy() });
      onDone();
    });
  }

  function boomAt(game, t, col, title, sub, big) {
    game.fx.shockwave(t.x, t.y, big ? 420 : 260, col, big ? 900 : 650);
    game.fx.ring(t.x, t.y, big ? 260 : 180, 0xffffff, { disc: true, dur: 500, force: true });
    game.fx.sparks.explode(big ? 50 : 30, t.x, t.y - 20);
    game.fx.glow.particleTint = col;
    game.fx.glow.explode(big ? 60 : 30, t.x, t.y - 20);
    game.fx.screenFlash(col, big ? 0.45 : 0.3, big ? 700 : 450);
    game.shake(big ? 0.35 : 0.2);
    if (big) game.slowmo = 0.6;
    game.fx.bigText(title, '#' + col.toString(16).padStart(6, '0'), big ? 58 : 54, sub);
    MT.Audio.play('fusionBoom');
  }

  // take partners out of the simulation right away
  function retire(game, donors, into) {
    game.towers = game.towers.filter((o) => !donors.includes(o));
    donors.forEach((d) => {
      into.spent += d.spent;
      d.planes.forEach((p) => {
        p.sprite.destroy();
        p.shadow.destroy();
      });
      d.planes = [];
    });
  }

  // ---------------------------------------------------------------- super fusion
  function fuse(game, t) {
    if (!t) return;
    const st = status(game, t);
    if (!st.can) {
      MT.Audio.play('error');
      if (st.reason) game.hud.toast(st.reason, 2000);
      return;
    }
    const donors = candidates(game, t).slice(1);
    game.money -= st.cost;
    retire(game, donors, t);
    t.spent += st.cost;
    t.fusing = true;
    game.select(null);
    const col = U.hexInt(t.def.fusion.color);
    mergeAnimation(game, t, donors, col, false, () => {
      if (!game.towers.includes(t)) return;
      t.fusing = false;
      t.fused = true;
      finishTransform(game, t);
      boomAt(game, t, col, 'SUPER FUSION!', t.def.fusion.name, false);
      checkGiantHints(game);
    });
  }

  function finishTransform(game, t) {
    t.recompute();
    t.refreshTexture();
    t.makeFusedVisuals();
    t.age = 0;
    t.abilityCd = {};
    game.recalcBuffs();
    game.select(t);
    game.hud.onTowersChanged();
  }

  // ---------------------------------------------------------------- ultimate
  function fuseUltimate(game, t) {
    const st = ultimateStatus(game, t);
    if (!st.can) {
      MT.Audio.play('error');
      if (st.reason) game.hud.toast(st.reason, 2200);
      return;
    }
    const donors = ultimateCandidates(game, t).slice(1);
    game.money -= st.cost;
    retire(game, donors, t);
    t.spent += st.cost;
    t.fusing = true;
    game.select(null);
    const col = U.hexInt(t.def.fusion.color);
    mergeAnimation(game, t, donors, col, true, () => {
      if (!game.towers.includes(t)) return;
      t.fusing = false;
      t.ultimate = true;
      t.size = t.def.size + 8;
      finishTransform(game, t);
      boomAt(game, t, col, 'ULTIMATE!', t.def.fusion.ultimate.name, true);
    });
  }

  // ---------------------------------------------------------------- omega
  function fuseOmega(game, t) {
    const st = omegaStatus(game, t);
    if (!st.can) {
      MT.Audio.play('error');
      if (st.reason) game.hud.toast(st.reason, 2200);
      return;
    }
    const parts = omegaCandidates(game, t);
    const donors = parts.slice(1);
    game.money -= st.cost;
    retire(game, donors, t);
    t.spent += st.cost;
    t.fusing = true;
    game.select(null);
    mergeAnimation(game, t, donors, 0xffffff, true, () => {
      if (!game.towers.includes(t)) return;
      // the three super towers become parts of one new Omega Mech:
      // the selected one powers its back, the other two become its arms
      const subs = parts.map((p, i) => {
        const u = new MT.Tower(game, p.type, t.x, t.y, false, { component: true });
        u.pops = p.pops;
        u.targetMode = t.targetMode;
        Object.assign(u, MT.TowerArt.OMEGA_SLOTS[i]);
        return u;
      });
      const omega = new MT.Tower(game, 'omega', t.x, t.y, false, { subs });
      omega.spent = t.spent;
      omega.recompute();
      omega.refreshTexture();
      game.towers = game.towers.filter((o) => o !== t);
      t.destroy();
      game.towers.push(omega);
      omega.makeFusedVisuals();
      game.recalcBuffs();
      game.select(omega);
      game.hud.onTowersChanged();
      boomAt(game, omega, 0xffffff, 'OMEGA MECH!', parts.map((p) => p.def.fusion.name).join('  +  '), true);
    });
  }

  MT.Fusion = {
    NEEDED, candidates, status, fuse, checkHint, maxedOfType,
    ultimateCandidates, ultimateStatus, fuseUltimate, omegaCandidates, omegaStatus, fuseOmega, isPlainFused,
  };
})();
