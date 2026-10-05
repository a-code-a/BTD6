// Visual effects layer: pops, explosions, rings, beams, floating text.
(function () {
  const S = MT.Draw.S;

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
      this.popPool = [];
      this.activePops = 0;
      this.beams = [];
      this.beamG = scene.add.graphics().setDepth(3500);
      this.ringPool = [];
      this.active = { boom: 0, ring: 0, text: 0 };
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
      if (this.beams.length > 60) this.beams.shift();
      this.beams.push({ x1, y1, x2, y2, color, width, life, max: life });
    }

    clank(x, y) {
      this.sparks.explode(3, x, y);
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

    speech(x, y, str) {
      if (this.bubble) this.bubble.destroy();
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
        g.lineStyle(b.width * 2.6, b.color, 0.25 * a);
        g.lineBetween(b.x1, b.y1, b.x2, b.y2);
        g.lineStyle(b.width, b.color, 0.9 * a);
        g.lineBetween(b.x1, b.y1, b.x2, b.y2);
        g.lineStyle(Math.max(1, b.width * 0.35), 0xffffff, a);
        g.lineBetween(b.x1, b.y1, b.x2, b.y2);
      }
    }
  }

  MT.Effects = Effects;
  MT.Effects.S = S;
})();
