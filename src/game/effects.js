// Visual effects layer: pops, explosions, rings, beams, lightning, floating text.
(function () {
  const S = MT.Draw.S;
  const W = MT.CFG.MAP_W, H = MT.CFG.H;

  class Effects {
    constructor(scene) {
      this.scene = scene;
      const P = (key, cfg) => scene.add.particles(0, 0, key, Object.assign({ emitting: false, maxAliveParticles: 220 }, cfg));
      this.puffs = P('fx_puff', {
        speed: { min: 30, max: 90 }, scale: { start: 0.42, end: 0 }, alpha: { start: 0.85, end: 0 },
        lifespan: 380, tint: [0x9b59d0, 0x7b2fb0, 0xc490ea, 0x5e2585],
      }).setDepth(4000);
      this.sparks = P('fx_spark', {
        speed: { min: 60, max: 160 }, scale: { start: 0.7, end: 0 }, lifespan: 300, rotate: { min: 0, max: 360 },
        tint: [0xffffff, 0xffd83a, 0xffb300],
      }).setDepth(4001);
      this.smoke = P('fx_puff', {
        speed: { min: 20, max: 70 }, scale: { start: 0.6, end: 1.4 }, alpha: { start: 0.55, end: 0 },
        lifespan: 700, tint: [0x5d5d5d, 0x8a8a8a, 0x3b3b3b],
      }).setDepth(3990);
      this.snow = P('fx_snow', {
        speed: { min: 30, max: 120 }, scale: { start: 0.9, end: 0.2 }, alpha: { start: 1, end: 0 },
        lifespan: 600, rotate: { min: 0, max: 360 },
      }).setDepth(4002);
      this.goo = P('fx_puff', {
        speed: { min: 30, max: 80 }, scale: { start: 0.3, end: 0 }, lifespan: 300, tint: [0xff4f7b, 0xff8fb1],
      }).setDepth(4000);
      this.gas = P('fx_puff', {
        speed: { min: 10, max: 40 }, scale: { start: 0.5, end: 1.2 }, alpha: { start: 0.45, end: 0 }, lifespan: 600,
        tint: [0x9be15d, 0x6abf2a, 0xc5f08a],
      }).setDepth(3980);
      this.dust = P('fx_puff', {
        speed: { min: 30, max: 90 }, scale: { start: 0.45, end: 0.9 }, alpha: { start: 0.6, end: 0 }, lifespan: 450,
        tint: [0xfff3d6, 0xe9d9b5, 0xffffff],
      }).setDepth(3990);
      this.trail = P('fx_puff', {
        speed: { min: 0, max: 15 }, scale: { start: 0.25, end: 0.6 }, alpha: { start: 0.5, end: 0 }, lifespan: 400,
        tint: [0xffffff, 0xd0d0d0],
      }).setDepth(2990);
      // additive glow used for coloured trails, sparkles and muzzle flashes
      this.glow = P('fx_puff', {
        speed: { min: 0, max: 20 }, scale: { start: 0.32, end: 0 }, alpha: { start: 0.8, end: 0 }, lifespan: 300,
        blendMode: 'ADD', maxAliveParticles: 260,
      }).setDepth(3010);
      this.debris = P('fx_chunk', {
        speed: { min: 140, max: 340 }, angle: { min: 200, max: 340 }, gravityY: 700, scale: { start: 0.9, end: 0.4 },
        rotate: { min: 0, max: 360 }, lifespan: 750, tint: [0x7b2fb0, 0x9b59d0, 0x5e2585, 0xc490ea],
      }).setDepth(4003);
      this.notes = P('fx_note', {
        speedY: { min: -70, max: -30 }, speedX: { min: -25, max: 25 }, scale: { start: 0.8, end: 0.3 }, alpha: { start: 1, end: 0 },
        lifespan: 900, tint: [0xff4081, 0x40c4ff, 0xffd83a, 0x7be35a, 0xb388ff],
      }).setDepth(4004);
      this.popPool = [];
      this.activePops = 0;
      this.beams = [];
      this.beamG = scene.add.graphics().setDepth(3500);
      this.ringPool = [];
      this.active = { boom: 0, ring: 0, text: 0, stomp: 0, swirl: 0 };
      // full-map overlays for flashes and danger vignettes (never covers the HUD)
      this.flashRect = scene.add.rectangle(0, 0, W, H, 0xffffff, 1).setOrigin(0).setDepth(6800).setAlpha(0).setVisible(false);
      this.vig = scene.add.image(W / 2, H / 2, 'fx_vignette').setDisplaySize(W, H).setDepth(6790).setAlpha(0).setVisible(false);
    }

    pop(x, y, big) {
      this.puffs.explode(big ? 14 : 4, x, y);
      if (big) {
        this.sparks.explode(10, x, y);
        this.smoke.explode(8, x, y);
      }
      if (this.activePops > 45) return;
      let img = this.popPool.pop();
      if (!img) img = this.scene.add.image(0, 0, 'fx_pop').setDepth(4005);
      this.activePops++;
      img.setVisible(true).setPosition(x, y).setScale(big ? 0.9 : 0.3).setAlpha(1).setRotation(Math.random() * 3);
      this.scene.tweens.add({
        targets: img, scale: big ? 1.6 : 0.6, alpha: 0, duration: big ? 320 : 170, ease: 'Quad.easeOut',
        onComplete: () => {
          img.setVisible(false);
          this.activePops--;
          this.popPool.push(img);
        },
      });
    }

    boom(x, y, r) {
      this.smoke.explode(Math.min(10, 3 + Math.floor(r / 10)), x, y);
      this.sparks.explode(5, x, y);
      if (this.active.boom > 24) return;
      this.active.boom++;
      const img = this.scene.add.image(x, y, 'fx_boom').setDepth(4010).setScale(0.2).setRotation(Math.random() * 6);
      this.scene.tweens.add({
        targets: img, scale: (r / 46) * 1.0, alpha: 0, duration: 300, ease: 'Cubic.easeOut',
        onComplete: () => { img.destroy(); this.active.boom--; },
      });
    }

    ring(x, y, r, color, opts = {}) {
      if (this.active.ring > 30 && !opts.force) return;
      this.active.ring++;
      let img = this.ringPool.pop();
      if (!img) img = this.scene.add.image(0, 0, 'fx_ring').setDepth(opts.depth || 2950);
      img.setVisible(true).setPosition(x, y).setTint(color).setAlpha(opts.alpha || 0.9).setScale((r * 0.2) / 58).setDepth(opts.depth || 2950);
      this.scene.tweens.add({
        targets: img, scale: r / 58, alpha: 0, duration: opts.dur || 350, ease: 'Quad.easeOut',
        onComplete: () => { img.setVisible(false); this.ringPool.push(img); this.active.ring--; },
      });
      if (opts.disc) {
        const d = this.scene.add.image(x, y, 'fx_disc').setDepth(2940).setTint(color).setAlpha(0.6).setScale((r * 2) / 128);
        this.scene.tweens.add({ targets: d, alpha: 0, duration: opts.dur || 350, onComplete: () => d.destroy() });
      }
    }

    beam(x1, y1, x2, y2, color, width = 3, life = 0.12) {
      if (this.beams.length > 80) this.beams.shift();
      this.beams.push({ x1, y1, x2, y2, color, width, life, max: life });
    }

    // jagged electric bolt, re-randomised every frame so it crackles
    lightning(x1, y1, x2, y2, color, width = 2.2, life = 0.16) {
      if (this.beams.length > 80) this.beams.shift();
      this.beams.push({ x1, y1, x2, y2, color, width, life, max: life, jag: true });
    }

    clank(x, y) {
      this.sparks.explode(3, x, y);
    }

    glowTrail(x, y, color) {
      this.glow.particleTint = color;
      this.glow.explode(1, x, y);
    }

    sparkle(x, y, color) {
      this.glow.particleTint = color;
      this.glow.explode(1, x, y);
    }

    muzzle(x, y, color) {
      this.glow.particleTint = color;
      this.glow.explode(3, x, y);
    }

    stomp(x, y, r) {
      if (this.active.stomp > 14) return;
      this.dust.explode(r > 50 ? 3 : 2, x, y);
    }

    splat(x, y, r, color) {
      this.goo.particleTint = color;
      this.goo.explode(9, x, y);
      this.goo.particleTint = 0xff4f7b;
      this.ring(x, y, r, color, { disc: true, dur: 260 });
    }

    // spinning gas tornado for the Fartnado
    swirl(x, y, r, color) {
      if (this.active.swirl > 6) return;
      this.active.swirl++;
      const img = this.scene.add.image(x, y - 6, 'fx_swirl').setDepth(2945).setTint(color).setAlpha(0.75).setScale((r * 0.5) / 64);
      this.scene.tweens.add({
        targets: img, scale: r / 64, angle: 220, alpha: 0, duration: 420, ease: 'Quad.easeOut',
        onComplete: () => { img.destroy(); this.active.swirl--; },
      });
      this.gas.explode(3, x + (Math.random() - 0.5) * r, y + (Math.random() - 0.5) * r * 0.6);
    }

    // a short full-map colour flash (alpha-limited, never blinding)
    screenFlash(color, alpha = 0.35, dur = 300) {
      const r = this.flashRect;
      this.scene.tweens.killTweensOf(r);
      r.setFillStyle(color, 1).setAlpha(alpha).setVisible(true);
      this.scene.tweens.add({ targets: r, alpha: 0, duration: dur, ease: 'Quad.easeOut', onComplete: () => r.setVisible(false) });
    }

    // coloured edge vignette (used for leaks and boss warnings)
    vignette(color, alpha = 0.4, dur = 400) {
      const v = this.vig;
      if (v.visible && v.alpha > alpha) return;
      this.scene.tweens.killTweensOf(v);
      v.setTint(color).setAlpha(alpha).setVisible(true);
      this.scene.tweens.add({ targets: v, alpha: 0, duration: dur, ease: 'Sine.easeOut', onComplete: () => v.setVisible(false) });
    }

    shockwave(x, y, r, color, dur = 450) {
      const img = this.scene.add.image(x, y, 'fx_shock').setDepth(4006).setTint(color).setAlpha(0.95).setScale((r * 0.15) / 64);
      this.scene.tweens.add({ targets: img, scale: r / 64, alpha: 0, duration: dur, ease: 'Cubic.easeOut', onComplete: () => img.destroy() });
    }

    // the big multi-stage explosion when a giant goes down
    bossDeath(x, y, r, color, big) {
      const s = this.scene;
      // size class: 1 = mega-sized, 2 = titan and up, 3 = final boss
      const tier = big ? 3 : r >= 44 ? 2 : 1;
      // when lots of giants pop together, keep it readable instead of a white-out
      const now = s.time.now;
      this.deathLog = (this.deathLog || []).filter((t) => now - t < 600);
      this.deathLog.push(now);
      const crowded = this.deathLog.length > 4 && tier < 3;
      this.puffs.explode(tier === 3 ? 30 : tier === 2 ? 16 : 10, x, y);
      this.sparks.explode(tier === 3 ? 30 : tier === 2 ? 12 : 6, x, y);
      this.smoke.explode(tier === 3 ? 16 : tier === 2 ? 8 : 4, x, y);
      this.debris.explode(Math.min(28, Math.round(r / (tier === 1 ? 4 : 2.5))), x, y - r * 0.3);
      if (crowded) {
        this.pop(x, y, true);
        return;
      }
      this.shockwave(x, y, r * (tier === 3 ? 5 : tier === 2 ? 3 : 2.3), color, tier === 3 ? 700 : 420);
      if (tier >= 2) {
        const flash = s.add.image(x, y, 'fx_disc').setDepth(4007).setTint(tier === 3 ? 0xffffff : color).setAlpha(tier === 3 ? 0.85 : 0.5).setScale((r * 1.1) / 64);
        if (tier === 3) flash.setBlendMode(Phaser.BlendModes.ADD);
        s.tweens.add({ targets: flash, scale: (r * 2.3) / 64, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });
      }
      const n = tier === 3 ? 8 : tier === 2 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        s.time.delayedCall(70 + i * (big ? 110 : 80), () => {
          const a = Math.random() * Math.PI * 2, d = Math.random() * r * (big ? 1.1 : 0.8);
          this.boom(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7 - r * 0.2, r * (big ? 1.1 : 0.7));
        });
      }
      this.pop(x, y, true);
    }

    floatText(x, y, str, color = '#ffd83a', size = 18) {
      if (this.active.text > 16) return;
      this.active.text++;
      const t = MT.text(this.scene, x, y, str, size, { title: true, color }).setDepth(6000);
      this.scene.tweens.add({
        targets: t, y: y - 36, alpha: 0, duration: 900, ease: 'Quad.easeOut',
        onComplete: () => { t.destroy(); this.active.text--; },
      });
    }

    // big punchy title in the middle of the map (fusion, boss defeated, ...)
    bigText(str, color = '#ffd83a', size = 54, sub) {
      const s = this.scene;
      const c = s.add.container(W / 2, H * 0.4).setDepth(6900);
      const t = MT.text(s, 0, 0, str, size, { title: true, color, strokeThickness: Math.round(size / 6) });
      c.add(t);
      if (sub) c.add(MT.text(s, 0, size * 0.8, sub, 20, { color: '#ffffff' }));
      c.setScale(0.2).setAlpha(0);
      s.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' });
      s.tweens.add({ targets: c, alpha: 0, y: H * 0.4 - 30, delay: 1500, duration: 400, onComplete: () => c.destroy() });
      return c;
    }

    // tower upgrade: stars in the path colour spiral up, plus a tier label
    upgradeBurst(t, pi, tier) {
      const s = this.scene;
      const col = [0xff6b6b, 0x4fc3f7, 0x9be15d][pi] || 0xffd83a;
      const css = ['#ff8a80', '#81d4fa', '#b9f6ca'][pi] || '#ffd83a';
      this.ring(t.x, t.y, 56, col, { dur: 420, force: true });
      this.glow.particleTint = col;
      this.glow.explode(12, t.x, t.y - 14);
      this.sparks.explode(8, t.x, t.y - 10);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const st = s.add.image(t.x + Math.cos(a) * 14, t.y - 6, 'fx_spark').setTint(col).setDepth(6050).setScale(0.9).setBlendMode(Phaser.BlendModes.ADD);
        s.tweens.add({
          targets: st, x: t.x + Math.cos(a + 1.2) * 30, y: t.y - 46 - i * 5, angle: 220, alpha: 0, scale: 0.3,
          duration: 650, delay: i * 35, ease: 'Quad.easeOut', onComplete: () => st.destroy(),
        });
      }
      this.floatText(t.x, t.y - 60, tier >= 4 ? 'MAX TIER!' : `TIER ${tier}`, css, tier >= 4 ? 22 : 17);
      if (tier >= 4) {
        const pil = s.add.image(t.x, t.y + 8, 'fx_pillar').setOrigin(0.5, 0.97).setTint(col).setBlendMode(Phaser.BlendModes.ADD).setDepth(1000 + t.y + 40).setAlpha(0).setScale(0.7 / S, 0.3 / S);
        s.tweens.add({ targets: pil, alpha: 0.9, scaleY: 1 / S, duration: 200, yoyo: true, hold: 200, ease: 'Quad.easeOut', onComplete: () => pil.destroy() });
        this.shockwave(t.x, t.y, 130, col, 520);
      }
    }

    // an ability goes off: the tower charges up in a pillar of light, then a
    // cut-in banner with the ability's name sweeps across the map
    abilityCast(t, A) {
      const s = this.scene;
      const U = MT.util;
      const col = t.omega ? 0xffffff : t.fused ? U.hexInt(t.def.fusion.color) : t.hero ? U.hexInt(t.def.color || '#7fdbff') : 0xffd83a;
      const pil = s.add.image(t.x, t.y + 8, 'fx_pillar').setOrigin(0.5, 0.97).setTint(col).setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1000 + t.y + 50).setAlpha(0).setScale(0.8 / S, 0.25 / S);
      s.tweens.add({ targets: pil, alpha: 0.9, scaleY: 1.15 / S, duration: 180, yoyo: true, hold: 300, ease: 'Quad.easeOut', onComplete: () => pil.destroy() });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const p = s.add.image(t.x + Math.cos(a) * 80, t.y - 16 + Math.sin(a) * 50, 'fx_puff').setTint(col).setBlendMode(Phaser.BlendModes.ADD).setScale(0.45).setDepth(6060);
        s.tweens.add({ targets: p, x: t.x, y: t.y - 16, scale: 0.08, alpha: 0.2, duration: 300, ease: 'Quad.easeIn', onComplete: () => p.destroy() });
      }
      s.time.delayedCall(300, () => {
        this.ring(t.x, t.y, 110, col, { dur: 520, force: true });
        this.shockwave(t.x, t.y, 170, col, 560);
        this.glow.particleTint = col;
        this.glow.explode(20, t.x, t.y - 20);
      });
      this.cutIn(A, t, col);
    }

    cutIn(A, t, col) {
      const s = this.scene;
      if (this.cut) this.cut.destroy();
      const c = s.add.container(0, H * 0.3).setDepth(6960);
      this.cut = c;
      const g = s.add.graphics();
      g.fillStyle(0x0b0612, 0.84);
      g.fillPoints([{ x: -60, y: -46 }, { x: W + 60, y: -70 }, { x: W + 60, y: 44 }, { x: -60, y: 66 }], true);
      g.fillStyle(col, 1);
      g.fillPoints([{ x: -60, y: -52 }, { x: W + 60, y: -76 }, { x: W + 60, y: -68 }, { x: -60, y: -44 }], true);
      g.fillPoints([{ x: -60, y: 64 }, { x: W + 60, y: 42 }, { x: W + 60, y: 50 }, { x: -60, y: 72 }], true);
      c.add(g);
      // speed lines streaming past
      for (let i = 0; i < 12; i++) {
        const ln = s.add.rectangle(Math.random() * W, -36 + Math.random() * 84, 50 + Math.random() * 140, 2, 0xffffff, 0.35 + Math.random() * 0.3);
        c.add(ln);
        s.tweens.add({ targets: ln, x: ln.x - 260, duration: 1100, ease: 'Linear' });
      }
      const icon = s.add.image(140, -2, A.icon).setDisplaySize(86, 86);
      const portrait = s.add.image(W - 110, 4, t.texKey());
      const pk = Math.min(110 / portrait.height, 130 / portrait.width);
      portrait.setScale(pk).setFlipX(true);
      const hex = '#' + col.toString(16).padStart(6, '0');
      const name = MT.text(s, 210, -10, A.name.toUpperCase(), 44, { title: true, ox: 0, color: hex, strokeThickness: 7 });
      const sub = MT.text(s, 214, 28, t.name, 17, { ox: 0, color: '#ffffff' });
      c.add([portrait, icon, name, sub]);
      s.tweens.add({ targets: icon, angle: { from: -12, to: 12 }, duration: 160, yoyo: true, repeat: 3 });
      s.tweens.add({ targets: portrait, x: W - 150, duration: 1100, ease: 'Linear' });
      c.x = -W;
      s.tweens.add({ targets: c, x: 0, duration: 200, ease: 'Cubic.easeOut' });
      s.tweens.add({
        targets: c, x: W * 1.1, delay: 1000, duration: 220, ease: 'Cubic.easeIn',
        onComplete: () => {
          c.destroy();
          if (this.cut === c) this.cut = null;
        },
      });
      MT.Audio.play('cutin');
    }

    // falling snow / jelly / gold over the whole map while a big ability lasts
    weather(kind, dur) {
      const s = this.scene;
      const cfg = {
        snow: { key: 'fx_snow', tint: [0xffffff, 0xd8f4ff, 0xb3e5fc], speedY: { min: 70, max: 150 }, scale: { min: 0.5, max: 1.1 }, quantity: 3 },
        jelly: { key: 'fx_puff', tint: [0x9be15d, 0xc5f08a, 0x6abf2a], speedY: { min: 220, max: 320 }, scale: { min: 0.14, max: 0.26 }, quantity: 3 },
        gold: { key: 'fx_spark', tint: [0xffd83a, 0xffb300, 0xffffff], speedY: { min: 160, max: 260 }, scale: { min: 0.5, max: 1 }, quantity: 2 },
      }[kind];
      if (!cfg) return;
      const em = s.add.particles(0, 0, cfg.key, {
        x: { min: 0, max: W }, y: -12, speedY: cfg.speedY, speedX: { min: -30, max: 30 }, lifespan: 5000,
        scale: cfg.scale, alpha: { start: 0.95, end: 0.6 }, rotate: { min: 0, max: 360 }, quantity: cfg.quantity, frequency: 70, tint: cfg.tint,
        deathZone: { type: 'onLeave', source: new Phaser.Geom.Rectangle(-20, -40, W + 40, H + 60) },
      }).setDepth(6700);
      const real = (dur * 1000) / Math.max(1, s.speed || 1);
      s.time.delayedCall(real, () => em.stop());
      s.time.delayedCall(real + 5200, () => em.destroy());
    }

    speech(x, y, str) {
      if (this.bubble) this.bubble.destroy();
      MT.Audio.say(str);
      const s = this.scene;
      const c = s.add.container(x, y).setDepth(6100);
      const t = MT.text(s, 0, 0, str, 15, { title: true, color: '#2a1d14', stroke: false });
      const w = t.width + 18, h = t.height + 10;
      const g = s.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.lineStyle(2.5, 0x2a1d14, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.fillTriangle(-6, h / 2 - 1, 6, h / 2 - 1, -2, h / 2 + 9);
      g.lineBetween(-6, h / 2, -2, h / 2 + 9);
      g.lineBetween(6, h / 2, -2, h / 2 + 9);
      c.add([g, t]);
      c.setScale(0.3);
      this.bubble = c;
      s.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.easeOut' });
      s.tweens.add({
        targets: c, alpha: 0, y: y - 10, delay: 900, duration: 300,
        onComplete: () => { c.destroy(); if (this.bubble === c) this.bubble = null; },
      });
    }

    update(dt) {
      const g = this.beamG;
      g.clear();
      for (let i = this.beams.length - 1; i >= 0; i--) {
        const b = this.beams[i];
        b.life -= dt;
        if (b.life <= 0) {
          this.beams.splice(i, 1);
          continue;
        }
        const a = b.life / b.max;
        if (b.jag) {
          const pts = jaggedPoints(b.x1, b.y1, b.x2, b.y2);
          g.lineStyle(b.width * 3.2, b.color, 0.22 * a);
          g.strokePoints(pts, false);
          g.lineStyle(b.width, b.color, 0.95 * a);
          g.strokePoints(pts, false);
          g.lineStyle(Math.max(1, b.width * 0.4), 0xffffff, a);
          g.strokePoints(pts, false);
          continue;
        }
        g.lineStyle(b.width * 2.6, b.color, 0.25 * a);
        g.lineBetween(b.x1, b.y1, b.x2, b.y2);
        g.lineStyle(b.width, b.color, 0.9 * a);
        g.lineBetween(b.x1, b.y1, b.x2, b.y2);
        g.lineStyle(Math.max(1, b.width * 0.35), 0xffffff, a);
        g.lineBetween(b.x1, b.y1, b.x2, b.y2);
      }
    }
  }

  function jaggedPoints(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const n = Math.max(3, Math.min(12, Math.round(len / 18)));
    const nx = -dy / len, ny = dx / len;
    const pts = [{ x: x1, y: y1 }];
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const off = (Math.random() - 0.5) * Math.min(26, len * 0.22);
      pts.push({ x: x1 + dx * t + nx * off, y: y1 + dy * t + ny * off });
    }
    pts.push({ x: x2, y: y2 });
    return pts;
  }

  MT.Effects = Effects;
  MT.Effects.S = S;
})();
