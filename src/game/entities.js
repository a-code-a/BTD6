// Enemy, Projectile and Tower simulation objects.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;

  // ===================================================================== Enemy
  class Enemy {
    constructor(game, type, o) {
      const def = MT.ENEMIES[type];
      this.game = game;
      this.type = type;
      this.def = def;
      this.id = ++game.uid;
      this.boss = !!def.boss;
      this.pathIndex = o.path || 0;
      this.path = game.paths[this.pathIndex];
      this.dist = o.dist || 0;
      this.camo = !!o.camo;
      this.fort = !!o.fort && (def.boss || def.armored || type === 'brute');
      const sc = game.scaling;
      let hp = def.hp;
      if (this.fort) hp = type === 'tincan' ? 4 : hp * 2;
      if (this.boss) hp = Math.round(hp * sc.hp);
      this.maxHp = hp;
      this.hp = hp;
      this.speed = def.speed * MT.CFG.SPEED_UNIT * sc.speed;
      this.radius = def.radius;
      this.freeze = 0;
      this.brittle = false;
      this.stun = 0;
      this.slowT = 0;
      this.slowMul = 1;
      this.slowSoak = false;
      this.slowAcid = false;
      this.dot = null;
      this.auraMul = 1;
      this.dead = false;
      this.leaked = false;
      this.dmgState = 0;
      this.wobble = Math.random() * 6.28;
      const p = this.path.atInto(this.dist, { x: 0, y: 0, dx: 1 });
      this.x = p.x;
      this.y = p.y;
      this.dir = p.dx >= 0 ? 1 : -1;
      this.sprite = game.add.image(this.x, this.y, this.texKey()).setScale(1 / S);
      this.sprite.setOrigin(0.5, game.enemyOrigin(type));
      if (this.camo) this.sprite.setAlpha(0.82);
      this.sprite.setDepth(1000 + this.y);
      this.overlay = null;
    }
    texKey() {
      return MT.EnemyArt.key(this.game, this.type, this.camo, this.fort, this.dmgState);
    }
    get remaining() {
      return this.path.length - this.dist;
    }
    applySlow(mul, dur, soak, acid) {
      if (this.slowT <= 0 || mul <= this.slowMul) {
        this.slowMul = mul;
        this.slowSoak = !!soak;
        this.slowAcid = !!acid;
      }
      this.slowT = Math.max(this.slowT, dur);
    }
    applyDot(dot, tower) {
      if (!this.dot || dot.dmg >= this.dot.dmg) this.dot = { dmg: dot.dmg, every: dot.every, t: dot.every, left: dot.dur, tower };
      else this.dot.left = Math.max(this.dot.left, dot.dur);
    }
    speedNow() {
      if (this.stun > 0 || this.freeze > 0) return 0;
      let m = this.auraMul * this.game.globalSlow(this);
      if (this.slowT > 0) m *= this.slowMul;
      return this.speed * m;
    }
    update(dt) {
      if (this.freeze > 0) {
        this.freeze -= dt;
        if (this.freeze <= 0) this.brittle = false;
      }
      if (this.stun > 0) this.stun -= dt;
      if (this.slowT > 0) this.slowT -= dt;
      this.dist += this.speedNow() * dt;
      if (this.dot) {
        this.dot.left -= dt;
        this.dot.t -= dt;
        if (this.dot.t <= 0) {
          this.dot.t += this.dot.every;
          const d = this.dot;
          this.game.damageEnemy(this, d.dmg, d.tower);
          if (this.dead) return;
        }
        if (this.dot && this.dot.left <= 0) this.dot = null;
      }
      if (this.dist >= this.path.length) {
        this.game.leak(this);
        return;
      }
      const p = this.path.atInto(this.dist, Enemy._tmp);
      this.x = p.x;
      this.y = p.y;
      if (Math.abs(p.dx) > 0.3) this.dir = p.dx > 0 ? 1 : -1;
      this.auraMul = 1;
    }
    // visual-only update, once per rendered frame
    render(time) {
      const sp = this.sprite;
      const moving = this.freeze <= 0 && this.stun <= 0;
      const w = this.boss ? 0.05 : 0.12;
      const t = time * 0.012 * (this.speed / 60 + 0.6) + this.wobble;
      sp.x = this.x;
      sp.y = this.y + (moving ? -Math.abs(Math.sin(t)) * (this.boss ? 3 : 2.2) : 0);
      sp.rotation = moving ? Math.sin(t) * w : 0;
      if (this.type === 'zeppelin') sp.setFlipX(this.dir < 0);
      sp.setDepth(1000 + this.y);
      // status tint
      if (this.freeze > 0) sp.setTint(0xa8dcff);
      else if (this.slowT > 0) sp.setTint(this.slowAcid ? 0xd8ffb0 : 0xffc0d0);
      else sp.clearTint();
      this.updateOverlay();
    }
    updateOverlay() {
      let want = null;
      if (this.freeze > 0) want = 'fx_ice';
      else if (this.slowT > 0 && !this.boss) want = this.slowAcid ? 'fx_jelly_acid' : 'fx_jelly';
      if (!want) {
        if (this.overlay) {
          this.overlay.destroy();
          this.overlay = null;
        }
        return;
      }
      if (!this.overlay) this.overlay = this.game.add.image(0, 0, want);
      if (this.overlay.texture.key !== want) this.overlay.setTexture(want);
      const r = this.radius;
      if (want === 'fx_ice') this.overlay.setDisplaySize(r * 2.4, r * 2.8).setPosition(this.x, this.y - r * 0.2);
      else this.overlay.setDisplaySize(r * 2.2, r * 1.1).setPosition(this.x, this.sprite.y - r * 0.85);
      this.overlay.setDepth(1000 + this.y + 0.5);
    }
    setDamageState() {
      const n = this.def.damageStates;
      if (!n) return;
      const st = Math.min(n - 1, Math.floor((1 - this.hp / this.maxHp) * n));
      if (st !== this.dmgState) {
        this.dmgState = st;
        this.sprite.setTexture(this.texKey());
      }
    }
    destroy() {
      this.dead = true;
      this.sprite.destroy();
      if (this.overlay) this.overlay.destroy();
      this.overlay = null;
    }
  }
  Enemy._tmp = { x: 0, y: 0, dx: 1 };

  // ================================================================ Projectile
  class Projectile {
    constructor(game, tower, x, y, angle, p, o = {}) {
      this.game = game;
      this.tower = tower;
      this.p = p;
      this.x = x;
      this.y = y;
      this.speed = p.speed;
      this.angle = angle;
      this.vx = Math.cos(angle) * p.speed;
      this.vy = Math.sin(angle) * p.speed;
      this.pierce = p.pierce + (o.bonusPierce || 0);
      this.hit = new Set();
      this.r = p.r || 6;
      this.life = o.life != null ? o.life : ((o.range || 150) * (p.life || 1.25)) / p.speed + 0.05;
      this.target = o.target || null;
      this.explodeOnExpire = !!o.explodeOnExpire;
      this.dead = false;
      this.sprite = game.add.image(x, y, p.tex).setScale((p.scale || 1) / S).setRotation(angle).setDepth(3000);
      if (p.tex === 'p_gas' || p.tex === 'p_fire') {
        this.sprite.setAlpha(0.9);
        this.grow = true;
      }
      this.spin = p.spin || 0;
      this.age = 0;
    }
    update(dt) {
      const g = this.game;
      this.age += dt;
      if (this.p.homing) {
        if (!this.target || this.target.dead) this.target = g.nearestEnemy(this.x, this.y, 260, this.tower && this.tower.stats.camo);
        if (this.target) {
          const want = Math.atan2(this.target.y - this.y, this.target.x - this.x);
          let diff = Phaser.Math.Angle.Wrap(want - this.angle);
          const turn = 9 * dt;
          this.angle += U.clamp(diff, -turn, turn);
          this.vx = Math.cos(this.angle) * this.speed;
          this.vy = Math.sin(this.angle) * this.speed;
        }
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0 || this.x < -60 || this.x > MT.CFG.MAP_W + 60 || this.y < -60 || this.y > MT.CFG.H + 60) {
        if (this.explodeOnExpire && this.p.explode) g.explode(this.x, this.y, this.p, this.tower, this.hit);
        this.kill();
        return;
      }
      // collision
      const cand = g.queryEnemies(this.x, this.y, this.r + 60);
      for (let i = 0; i < cand.length; i++) {
        const e = cand[i];
        if (e.dead || this.hit.has(e.id)) continue;
        const rr = e.radius + this.r;
        if (U.dist2(this.x, this.y, e.x, e.y) > rr * rr) continue;
        this.onHit(e);
        if (this.dead) return;
      }
    }
    onHit(e) {
      const g = this.game;
      if (this.p.explode) {
        g.explode(this.x, this.y, this.p, this.tower, this.hit);
        this.kill();
        return;
      }
      this.hit.add(e.id);
      const kids = g.applyHit(e, this.p, this.tower);
      if (kids) kids.forEach((k) => this.hit.add(k.id));
      this.pierce -= 1;
      if (this.pierce <= 0) this.kill();
    }
    render() {
      if (this.spin) this.sprite.rotation += this.spin * 0.016;
      else this.sprite.rotation = this.angle;
      if (this.grow) {
        const s = (1 + Math.min(1, this.age * 2.5) * 0.7) / S * (this.p.scale || 1) * (this.r / 9);
        this.sprite.setScale(s);
        this.sprite.setAlpha(Math.max(0.15, 0.95 - this.age * 1.4));
      }
      this.sprite.x = this.x;
      this.sprite.y = this.y;
    }
    kill() {
      if (this.dead) return;
      this.dead = true;
      this.sprite.destroy();
    }
  }

  // ===================================================================== Tower
  class Tower {
    constructor(game, type, x, y, isHero) {
      this.game = game;
      this.type = type;
      this.hero = !!isHero;
      this.def = isHero ? MT.HERO : MT.TOWERS[type];
      this.id = ++game.uid;
      this.x = x;
      this.y = y;
      this.tiers = [0, 0, 0];
      this.level = 1;
      this.xp = 0;
      this.pops = 0;
      this.spent = 0;
      this.cool = 0.15;
      this.targetMode = 0;
      this.shots = 0;
      this.facing = 1;
      this.buffs = null;
      this.abilityCd = {};
      this.size = this.def.size;
      this.sprite = game.add.image(x, y, this.texKey()).setScale(1 / S);
      this.sprite.setOrigin(0.5, this.originY());
      this.sprite.setDepth(1000 + y);
      this.recompute();
    }
    originY() {
      if (this.hero) return 64 / 110;
      if (this.type === 'farm' || this.type === 'lab') return 58 / 92;
      return 49 / 92;
    }
    texKey() {
      return this.hero ? MT.TowerArt.gruKey(this.game, this.level) : MT.TowerArt.key(this.game, this.type, this.tiers);
    }
    refreshTexture() {
      this.sprite.setTexture(this.texKey());
    }
    get name() {
      return this.def.name;
    }
    recompute() {
      const s = U.deepClone(this.def.base);
      s.count = s.count || 1;
      s.spread = s.spread || 0;
      if (this.hero) {
        for (let l = 2; l <= this.level; l++) {
          const L = MT.HERO.levels[l];
          if (L && L.fx) L.fx(s);
        }
      } else {
        this.def.paths.forEach((path, pi) => {
          for (let t = 0; t < this.tiers[pi]; t++) path.ups[t].fx(s);
        });
      }
      this.baseStats = s;
      this.applyBuffs();
    }
    applyBuffs() {
      const s = U.deepClone(this.baseStats);
      const b = this.buffs;
      this.buffArmored = false;
      this.bonusPierce = 0;
      if (b && s.attack !== 'none') {
        if (b.range) s.range *= 1 + b.range;
        if (b.rate) s.rate *= 1 - b.rate;
        if (b.camo) s.camo = true;
        if (b.armored) this.buffArmored = true;
        this.bonusPierce = b.pierce || 0;
      }
      this.stats = s;
    }
    // can this path be upgraded given crosspath rules
    pathState(pi) {
      const t = this.tiers;
      const cur = t[pi];
      if (cur >= 4) return 'max';
      const others = t.filter((_, i) => i !== pi);
      const opened = t.filter((v) => v > 0).length;
      // max two paths, and only one of them past tier 2
      if (cur === 0 && opened >= 2) return 'closed';
      if (cur + 1 >= 3 && others.some((v) => v >= 3)) return 'closed';
      return 'open';
    }
    upgradeCost(pi) {
      const up = this.def.paths[pi].ups[this.tiers[pi]];
      return this.game.price(up.cost, this.x, this.y);
    }
    update(dt) {
      const g = this.game;
      const s = this.stats;
      // aura slow (Arctic Wind)
      if (s.slowAura) {
        const r2 = s.range * s.range;
        for (const e of g.enemies) {
          if (e.dead || (e.camo && !s.camo)) continue;
          if (U.dist2(this.x, this.y, e.x, e.y) <= r2) e.auraMul = Math.min(e.auraMul, e.boss ? s.slowAura.moabMul : s.slowAura.mul);
        }
      }
      if (s.attack === 'none') return;
      this.cool -= dt;
      if (this.cool > 0) return;
      const rate = s.rate * g.rateMul(this);
      let fired = false;
      switch (s.attack) {
        case 'proj': {
          const t = g.findTarget(this);
          if (t) {
            this.fireAt(t);
            fired = true;
          }
          break;
        }
        case 'radial': {
          if (g.findTarget(this)) {
            for (let i = 0; i < s.count; i++) {
              const a = (i / s.count) * Math.PI * 2 + this.shots * 0.2;
              g.addProjectile(new Projectile(g, this, this.x, this.y, a, s.proj, { range: s.range, bonusPierce: this.bonusPierce, life: s.range / s.proj.speed }));
            }
            MT.Audio.play(s.proj.tex === 'p_fire' ? 'rocket' : 'fart');
            fired = true;
          }
          break;
        }
        case 'instant': {
          const t = g.findTarget(this);
          if (t) {
            g.instantHit(this, t);
            this.face(t);
            fired = true;
          }
          break;
        }
        case 'aura': {
          if (g.findTarget(this)) {
            g.auraBlast(this);
            fired = true;
          }
          break;
        }
        case 'ring': {
          if (g.findTarget(this)) {
            g.ringBlast(this);
            fired = true;
          }
          break;
        }
      }
      if (fired) {
        this.shots++;
        this.cool = rate;
        if (rate > 0.18) this.bounce();
      } else {
        this.cool = 0.05;
      }
    }
    face(t) {
      const f = t.x < this.x ? -1 : 1;
      if (f !== this.facing) {
        this.facing = f;
        this.sprite.setFlipX(f < 0);
      }
    }
    fireAt(t) {
      const g = this.game;
      const s = this.stats;
      this.face(t);
      const sx = this.x + this.facing * 14, sy = this.y - 6;
      // lead the target a little
      const d = U.dist(sx, sy, t.x, t.y);
      const lead = Math.min(0.5, d / s.proj.speed);
      const tp = t.path.at(t.dist + t.speedNow() * lead);
      const base = Math.atan2(tp.y - sy, tp.x - sx);
      let p = s.proj;
      if (p.crit) {
        if (this.shots % p.crit.every === p.crit.every - 1) p = Object.assign({}, p, { dmg: p.dmg * p.crit.mult, scale: 1.4 });
      }
      if (this.tierActive('jellyAcid')) p = Object.assign({}, p, { tex: 'p_jelly_acid' });
      for (let i = 0; i < s.count; i++) {
        const a = base + (s.count > 1 ? ((i - (s.count - 1) / 2) * s.spread * Math.PI) / 180 : 0);
        g.addProjectile(new Projectile(g, this, sx, sy, a, p, { range: s.range, bonusPierce: this.bonusPierce, target: t }));
      }
      const snd = { p_rocket: 'rocket', p_jelly: 'jelly', p_laser: 'laser', p_plasma: 'laser', p_sun: 'laser', p_dart: 'laser', p_ice: 'freeze', p_freezebolt: 'freeze' }[s.proj.tex] || 'throw';
      MT.Audio.play(snd);
    }
    tierActive(flag) {
      if (flag === 'jellyAcid') return this.type === 'jelly' && this.tiers[0] >= 1;
      return false;
    }
    bounce() {
      const sp = this.sprite;
      if (this.bouncing) return;
      this.bouncing = true;
      this.game.tweens.add({
        targets: sp, scaleX: (1 / S) * 1.08, scaleY: (1 / S) * 0.92, duration: 60, yoyo: true,
        onComplete: () => { sp.setScale(1 / S); this.bouncing = false; },
      });
    }
    sellValue() {
      return Math.floor(this.spent * MT.CFG.SELL_RATE);
    }
    destroy() {
      this.sprite.destroy();
    }
  }

  MT.Enemy = Enemy;
  MT.Projectile = Projectile;
  MT.Tower = Tower;
})();
