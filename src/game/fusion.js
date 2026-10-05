// Super Fusion: three towers of the same kind that each own a tier-4 upgrade
// can be merged into one far stronger tower. The selected tower transforms,
// the two nearest partners fly into it and are consumed.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const NEEDED = 3;

  function maxedOfType(game, type) {
    return game.towers.filter((t) => t.type === type && t.maxed);
  }

  // the towers that would take part if `t` were fused right now (t first)
  function candidates(game, t) {
    if (!t || t.hero || t.fused || !t.def.fusion) return [];
    const others = maxedOfType(game, t.type).filter((o) => o !== t);
    others.sort((a, b) => U.dist2(a.x, a.y, t.x, t.y) - U.dist2(b.x, b.y, t.x, t.y));
    return [t].concat(others.slice(0, NEEDED - 1));
  }

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

  // toast once per tower type when fusion becomes possible
  function checkHint(game, type) {
    if (game.fusionHinted[type] || !MT.TOWERS[type].fusion) return;
    if (maxedOfType(game, type).length < NEEDED) return;
    game.fusionHinted[type] = true;
    game.hud.toast(`SUPER FUSION ready: ${MT.TOWERS[type].fusion.name}!\nSelect a maxed ${MT.TOWERS[type].name} and press FUSE.`, 3600, true);
    MT.Audio.play('fusionReady');
  }

  function fuse(game, t) {
    if (!t) return;
    const st = status(game, t);
    if (!st.can) {
      MT.Audio.play('error');
      if (st.reason) game.hud.toast(st.reason, 2000);
      return;
    }
    const parts = candidates(game, t);
    const donors = parts.slice(1);
    game.money -= st.cost;
    // take the partners out of the simulation straight away
    game.towers = game.towers.filter((o) => !donors.includes(o));
    donors.forEach((d) => {
      t.spent += d.spent;
      d.planes.forEach((p) => {
        p.sprite.destroy();
        p.shadow.destroy();
      });
      d.planes = [];
    });
    t.spent += st.cost;
    t.fusing = true;
    game.select(null);
    game.fuseHover = null;
    const col = U.hexInt(t.def.fusion.color);
    MT.Audio.play('fusion');

    // partners spiral up and into the chosen tower
    donors.forEach((d, i) => {
      const sp = d.sprite;
      const sx = d.x, sy = d.y;
      const state = { k: 0 };
      game.tweens.add({
        targets: state, k: 1, duration: 900, delay: i * 120, ease: 'Cubic.easeIn',
        onUpdate: () => {
          const k = state.k;
          const ang = k * Math.PI * 2.5 + i * Math.PI;
          const rad = (1 - k) * 46;
          const x = U.lerp(sx, t.x, k) + Math.cos(ang) * rad;
          const y = U.lerp(sy, t.y, k) + Math.sin(ang) * rad * 0.6 - Math.sin(k * Math.PI) * 90;
          sp.setPosition(x, y).setScale(((1 - k * 0.7) / S)).setRotation(k * 8).setDepth(6200);
          sp.setTint(Phaser.Display.Color.GetColor(255, 255 - k * 120, 255 - k * 60));
          game.fx.sparkle(x, y, col);
        },
        onComplete: () => d.destroy(),
      });
    });
    // charge-up glow on the target
    game.fx.ring(t.x, t.y, 120, col, { dur: 900, force: true });
    game.fx.ring(t.x, t.y, 70, 0xffffff, { dur: 600, force: true });
    const pillar = game.add.image(t.x, t.y - 20, 'fx_pillar').setOrigin(0.5, 0.92).setTint(col).setAlpha(0).setScale(0.6 / S, 0.2 / S).setDepth(6150).setBlendMode(Phaser.BlendModes.ADD);
    game.tweens.add({ targets: pillar, alpha: 0.9, scaleY: 1.4 / S, duration: 900, ease: 'Quad.easeIn' });

    game.time.delayedCall(1050, () => {
      if (!game.towers.includes(t)) {
        pillar.destroy();
        return;
      }
      t.fusing = false;
      t.fused = true;
      t.recompute();
      t.refreshTexture();
      t.makeFusedVisuals();
      t.age = 0;
      t.abilityCd = {};
      game.recalcBuffs();
      game.fx.shockwave(t.x, t.y, 260, col, 650);
      game.fx.ring(t.x, t.y, 180, 0xffffff, { disc: true, dur: 500, force: true });
      game.fx.sparks.explode(30, t.x, t.y - 20);
      game.fx.glow.particleTint = col;
      game.fx.glow.explode(30, t.x, t.y - 20);
      game.fx.screenFlash(col, 0.3, 450);
      game.shake(0.2);
      game.fx.bigText('SUPER FUSION!', t.def.fusion.color, 54, t.def.fusion.name);
      MT.Audio.play('fusionBoom');
      game.tweens.add({ targets: pillar, alpha: 0, scaleX: 1.6 / S, duration: 500, onComplete: () => pillar.destroy() });
      game.select(t);
      game.hud.onTowersChanged();
    });
  }

  MT.Fusion = { NEEDED, candidates, status, fuse, checkHint, maxedOfType };
})();
