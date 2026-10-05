// Enemy, Projectile and Tower simulation objects.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const TAU = Math.PI * 2;
  const backOut = (t) => {
    const c = 1.9;
    const x = t - 1;
    return 1 + (c + 1) * x * x * x + c * x * x;
  };
  // giants that walk on legs kick up dust when they stomp
  const STOMPERS = { mega: 1, titan: 1, mecha: 1, macho: 1 };

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
      this.camo = !!o.camo || !!def.alwaysCamo;
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
      this.stunImmune = 0;
      this.slowT = 0;
      this.slowMul = 1;
      this.slowSoak = false;
      this.slowAcid = false;
      this.dot = null;
      this.auraMul = 1;
      this.enrage = 1;
      this.dance = 0;
      this.dead = false;
      this.leaked = false;
      this.dmgState = 0;
      this.hitT = 0;
      this.hitCool = 0;
      this.age = 0;
      this.burst = !!o.burst; // popped out of a bigger mutant: scale-in animation
      this.phase = 0;
      this.blinkT = def.blink ? def.blink.every : 0;
      this.empT = def.emp ? def.emp.every * 0.5 : 0;
      this.lastStep = 0;
      this.wobble = Math.random() * 6.28;
      const p = this.path.atInto(this.dist, { x: 0, y: 0, dx: 1 });
      this.x = p.x;
      this.y = p.y;
      this.dir = p.dx >= 0 ? 1 : -1;
      this.sprite = game.add.image(this.x, this.y, this.texKey()).setScale(1 / S);
      this.sprite.setOrigin(0.5, game.enemyOrigin(type));
      if (this.camo && !def.alwaysCamo) this.sprite.setAlpha(0.82);
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
      if (this.def.noSlow) return;
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
    // giants can't be stun-locked: after a stun they shrug off stuns for a moment
    tryStun(dur) {
      if (!this.boss) {
        this.stun = Math.max(this.stun, dur);
        return;
      }
      if (this.stunImmune > 0) return;
      if (this.def.final) dur *= 0.5;
      this.stun = Math.max(this.stun, dur);
      this.stunImmune = dur + 1.4;
    }
    speedNow() {
      if (this.stun > 0 || this.freeze > 0 || this.dance > 0) return 0;
      let m = this.auraMul * this.game.globalSlow(this) * this.enrage;
      if (this.slowT > 0) m *= this.slowMul;
      return this.speed * m;
    }
    update(dt) {
      if (this.freeze > 0) {
        this.freeze -= dt;
        if (this.freeze <= 0) this.brittle = false;
      }
      if (this.stun > 0) this.stun -= dt;
      else if (this.stunImmune > 0) this.stunImmune -= dt;
      if (this.slowT > 0) this.slowT -= dt;
      if (this.dance > 0) this.dance -= dt;
      const def = this.def;
      if (def.regen && this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * def.regen * dt);
        this.setDamageState();
      }
      if (def.blink) {
        this.blinkT -= dt;
        if (this.blinkT <= 0 && this.stun <= 0 && this.freeze <= 0) {
          this.blinkT = def.blink.every;
          MT.Bosses.blink(this.game, this);
        }
      }
      if (def.emp) {
        this.empT -= dt;
        if (this.empT <= 0) {
          this.empT = def.emp.every;
          MT.Bosses.emp(this.game, this);
        }
      }
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
    render(time, dt) {
      const sp = this.sprite;
      this.age += dt;
      if (this.hitT > 0) this.hitT -= dt;
      if (this.hitCool > 0) this.hitCool -= dt;
      const moving = this.freeze <= 0 && this.stun <= 0 && this.dance <= 0;
      const w = this.boss ? 0.05 : 0.12;
      const t = time * 0.012 * (this.speed / 60 + 0.6) * this.enrage + this.wobble;
      let sx = 1, sy = 1;
      let rot = 0, lift = 0;
      if (this.dance > 0) {
        const d = time * 0.022 + this.wobble;
        rot = Math.sin(d) * 0.32;
        lift = -Math.abs(Math.sin(d * 2)) * (this.boss ? 5 : 4);
      } else if (moving) {
        const s = Math.sin(t);
        lift = -Math.abs(s) * (this.boss ? 3 : 2.2);
        rot = s * w;
        // heavy footsteps
        if (STOMPERS[this.type] && (s > 0) !== (this.lastStep > 0)) {
          const side = s > 0 ? 1 : -1;
          this.game.fx.stomp(this.x + side * this.radius * 0.35, this.y + this.radius * 0.95, this.radius);
        }
        this.lastStep = s;
      }
      if (this.type === 'goo') {
        const q = Math.sin(time * 0.006 + this.wobble);
        sx = 1 + q * 0.06;
        sy = 1 - q * 0.06;
        rot *= 0.4;
      }
      if (this.burst && this.age < 0.28) {
        const k = 0.35 + 0.65 * backOut(this.age / 0.28);
        sx *= k;
        sy *= k;
      }
      if (this.hitT > 0) {
        sx *= 1.035;
        sy *= 0.97;
      }
      sp.setScale(sx / S, sy / S);
      sp.x = this.x;
      sp.y = this.y + lift;
      sp.rotation = rot;
      if (this.type === 'zeppelin' || this.type === 'mecha') sp.setFlipX(this.dir < 0);
      sp.setDepth(1000 + this.y);
      if (this.def.alwaysCamo) sp.setAlpha(0.62 + Math.sin(time * 0.004 + this.wobble) * 0.16);
      // status tint
      if (this.freeze > 0) sp.setTint(0xa8dcff);
      else if (this.hitT > 0) sp.setTint(0xffd2d2);
      else if (this.slowT > 0) sp.setTint(this.slowAcid ? 0xd8ffb0 : 0xffc0d0);
      else if (this.enrage > 1) sp.setTint(0xffb0b0);
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
    // small "ouch" feedback on giants: a squash + tint, never a screen shake
    onHurt() {
      if (this.hitCool > 0) return;
      this.hitT = 0.07;
      this.hitCool = 0.16;
    }
    setDamageState() {
      const n = this.def.damageStates;
      if (!n) return;
      const st = Math.max(0, Math.min(n - 1, Math.floor((1 - this.hp / this.maxHp) * n)));
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
  const GROW = { p_gas: 1, p_fire: 1, p_wave: 1 };
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
      if (GROW[p.tex]) {
        this.sprite.setAlpha(0.9);
        this.grow = true;
      }
      this.spin = p.spin || 0;
      this.age = 0;
      this.trailT = 0;
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
    render(dt) {
      if (this.spin) this.sprite.rotation += this.spin * 0.016;
      else this.sprite.rotation = this.angle;
      if (this.grow) {
        const s = (1 + Math.min(1, this.age * 2.5) * 0.7) / S * (this.p.scale || 1) * (this.r / 9);
        this.sprite.setScale(s);
        this.sprite.setAlpha(Math.max(0.15, 0.95 - this.age * 1.4));
      }
      this.sprite.x = this.x;
      this.sprite.y = this.y;
      if (this.p.trail) {
        this.trailT -= dt;
        if (this.trailT <= 0) {
          this.trailT = 0.035;
          this.game.fx.glowTrail(this.x, this.y, this.p.trail);
        }
      }
    }
    kill() {
      if (this.dead) return;
      this.dead = true;
      this.sprite.destroy();
    }
  }

  // ===================================================================== Tower
  const TILTERS = { proj: 1, instant: 1, chain: 1 };
  class Tower {
    constructor(game, type, x, y, isHero) {
      this.game = game;
      this.type = type;
      this.hero = !!isHero;
      this.def = isHero ? MT.HEROES[type] : MT.TOWERS[type];
      this.id = ++game.uid;
      this.x = x;
      this.y = y;
      this.tiers = [0, 0, 0];
      this.fused = false;
      this.level = 1;
      this.xp = 0;
      this.pops = 0;
      this.spent = 0;
      this.cool = 0.15;
      this.targetMode = 0;
      this.shots = 0;
      this.facing = 1;
      this.tilt = 0;
      this.kick = 0;
      this.aimTarget = null;
      this.aimHold = 0;
      this.age = 0;
      this.growth = 1;
      this.giant = 0;
      this.stompT = 0;
      this.disabled = 0;
      this.planeA = Math.random() * TAU;
      this.planes = [];
      this.buffs = null;
      this.abilityCd = {};
      this.size = this.def.size;
      this.sprite = game.add.image(x, y, this.texKey()).setScale(1 / S);
      this.sprite.setOrigin(0.5, this.originY());
      this.sprite.setDepth(1000 + y);
      this.recompute();
    }
    originY() {
      if (this.fused) return MT.TowerArt.FUSED_OY;
      if (this.hero) return 64 / 110;
      if (this.type === 'farm' || this.type === 'lab') return 58 / 92;
      return 49 / 92;
    }
    texKey() {
      if (this.hero) return MT.TowerArt.heroKey(this.game, this.type, this.level);
      if (this.fused) return MT.TowerArt.fusedKey(this.game, this.type);
      return MT.TowerArt.key(this.game, this.type, this.tiers);
    }
    refreshTexture() {
      this.sprite.setTexture(this.texKey());
      this.sprite.setOrigin(0.5, this.originY());
      if (this.planes.length) this.syncPlanes(true);
    }
    get name() {
      return this.fused ? this.def.fusion.name : this.def.name;
    }
    recompute() {
      let s;
      if (this.fused) {
        s = U.deepClone(this.def.fusion.base);
      } else {
        s = U.deepClone(this.def.base);
        if (this.hero) {
          for (let l = 2; l <= this.level; l++) {
            const L = this.def.levels[l];
            if (L && L.fx) L.fx(s);
          }
        } else {
          this.def.paths.forEach((path, pi) => {
            for (let t = 0; t < this.tiers[pi]; t++) path.ups[t].fx(s);
          });
        }
      }
      s.count = s.count || 1;
      s.spread = s.spread || 0;
      this.baseStats = s;
      this.applyBuffs();
      this.syncPlanes(false);
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
      if (this.giant > 0) {
        s.range *= 1.5;
        s.rate *= 0.35;
      }
      this.stats = s;
    }
    // can this path be upgraded given crosspath rules
    pathState(pi) {
      if (this.fused) return 'max';
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
    // a tower with any tier-4 upgrade counts as "maxed" for fusion
    get maxed() {
      return !this.hero && !this.fused && Math.max(...this.tiers) >= 4;
    }
    update(dt) {
      const g = this.game;
      const s = this.stats;
      if (this.disabled > 0) {
        this.disabled -= dt;
        return;
      }
      // aura slow (Arctic Wind)
      if (s.slowAura) {
        const r2 = s.range * s.range;
        for (const e of g.enemies) {
          if (e.dead || (e.camo && !s.camo)) continue;
          if (U.dist2(this.x, this.y, e.x, e.y) <= r2) e.auraMul = Math.min(e.auraMul, e.boss ? s.slowAura.moabMul : s.slowAura.mul);
        }
      }
      if (this.giant > 0) {
        this.giant -= dt;
        this.stompT -= dt;
        if (this.stompT <= 0) {
          this.stompT = 0.6;
          MT.Abilities.kevinStomp(g, this);
        }
        if (this.giant <= 0) this.applyBuffs();
      }
      if (s.attack === 'plane') this.planeA += (s.planeSpeed || 1.5) * dt;
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
          const t = g.findTarget(this);
          if (t) {
            this.aimAt(t);
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
            this.aimAt(t);
            g.instantHit(this, t);
            fired = true;
          }
          break;
        }
        case 'chain': {
          const first = g.findTarget(this);
          if (first) {
            this.aimAt(first);
            const targets = [first];
            if (s.count > 1) {
              const others = g.enemiesInRange(this.x, this.y, s.range, s.camo).filter((e) => e !== first);
              others.sort((a, b) => a.remaining - b.remaining);
              for (let i = 0; i < others.length && targets.length < s.count; i++) targets.push(others[i]);
            }
            targets.forEach((tg) => g.chainHit(this, tg));
            fired = true;
          }
          break;
        }
        case 'plane':
          fired = this.firePlanes();
          break;
        case 'aura': {
          const t = g.findTarget(this);
          if (t) {
            this.aimAt(t);
            g.auraBlast(this);
            fired = true;
          }
          break;
        }
        case 'ring': {
          const t = g.findTarget(this);
          if (t) {
            this.aimAt(t);
            g.ringBlast(this);
            fired = true;
          }
          break;
        }
      }
      if (fired) {
        this.shots++;
        this.cool = rate;
        if (rate > 0.18) this.kick = 1;
        else this.kick = Math.max(this.kick, 0.45);
      } else {
        this.cool = 0.05;
      }
    }
    // remember who we're shooting at so the sprite keeps turning towards it
    aimAt(e) {
      this.aimTarget = e;
      this.aimHold = 0.9;
      const dx = e.x - this.x;
      if (Math.abs(dx) > 3) this.setFacing(dx < 0 ? -1 : 1);
    }
    setFacing(f) {
      if (f === this.facing) return;
      this.facing = f;
      this.sprite.setFlipX(f < 0);
    }
    // world-space angle the weapon is pointing at right now
    aimAngle() {
      return this.facing > 0 ? this.tilt : Math.PI - this.tilt;
    }
    muzzle() {
      const a = this.aimAngle();
      const reach = this.hero ? 22 : this.fused ? 20 : 16;
      return { x: this.x + Math.cos(a) * reach, y: this.y - 6 + Math.sin(a) * reach };
    }
    fireAt(t) {
      const g = this.game;
      const s = this.stats;
      this.aimAt(t);
      // snap the tilt so the first shot already leaves from the right spot
      const dx0 = t.x - this.x;
      this.tilt = U.clamp(Math.atan2(t.y - (this.y - 6), Math.abs(dx0) + 1), -0.75, 0.75);
      const m = this.muzzle();
      const sx = m.x, sy = m.y;
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
      if (this.fused || s.count >= 3) g.fx.muzzle(sx, sy, this.fused ? MT.util.hexInt(this.def.fusion.color) : 0xffffff);
      const snd = { p_rocket: 'rocket', p_jelly: 'jelly', p_jelly_acid: 'jelly', p_laser: 'laser', p_plasma: 'laser', p_sun: 'laser', p_dart: 'laser', p_ice: 'freeze', p_freezebolt: 'freeze', p_wave: 'guitar', p_lipstick: 'laser', p_goo: 'jelly', p_squid: 'jelly' }[s.proj.tex] || 'throw';
      MT.Audio.play(snd);
    }
    // ---------------------------------------------------------- planes
    planePos(i, out) {
      const s = this.stats;
      const n = this.planes.length || 1;
      const a = this.planeA + (i * TAU) / n;
      const R = s.orbit || 62;
      out.gx = this.x + Math.cos(a) * R;
      out.gy = this.y + Math.sin(a) * R * 0.7;
      out.x = out.gx;
      out.y = out.gy - 34;
      out.a = a;
      return out;
    }
    syncPlanes(retex) {
      const want = this.stats && this.stats.attack === 'plane' ? this.stats.planes || 1 : 0;
      while (this.planes.length > want) {
        const p = this.planes.pop();
        p.sprite.destroy();
        p.shadow.destroy();
      }
      const key = MT.TowerArt.planeKey(this.game, this.tiers, this.fused);
      while (this.planes.length < want) {
        const sprite = this.game.add.image(this.x, this.y - 34, key).setScale(1 / S).setDepth(5500);
        const shadow = this.game.add.image(this.x, this.y, 'fx_shadow').setScale(0.55, 0.45).setAlpha(0.3).setDepth(990);
        this.planes.push({ sprite, shadow, pos: {} });
      }
      if (retex || this.planes.some((p) => p.sprite.texture.key !== key)) this.planes.forEach((p) => p.sprite.setTexture(key));
    }
    firePlanes() {
      const g = this.game;
      const s = this.stats;
      let fired = false;
      const altNow = s.alt && this.shots % s.alt.every === s.alt.every - 1;
      this.planes.forEach((pl, i) => {
        const pos = this.planePos(i, pl.pos);
        const t = g.findTargetFrom(this, pos.gx, pos.gy, s.range);
        if (!t) return;
        fired = true;
        const d = U.dist(pos.x, pos.y, t.x, t.y);
        const lead = Math.min(0.5, d / s.proj.speed);
        const tp = t.path.at(t.dist + t.speedNow() * lead);
        const base = Math.atan2(tp.y - pos.y, tp.x - pos.x);
        for (let k = 0; k < s.count; k++) {
          const a = base + (s.count > 1 ? ((k - (s.count - 1) / 2) * s.spread * Math.PI) / 180 : 0);
          g.addProjectile(new Projectile(g, this, pos.x, pos.y, a, s.proj, { range: s.range + 40, bonusPierce: this.bonusPierce, target: t }));
        }
        if (altNow) g.addProjectile(new Projectile(g, this, pos.x, pos.y, base, s.alt.proj, { range: s.range + 60, target: t }));
      });
      if (fired) MT.Audio.play(altNow ? 'rocket' : 'laser');
      return fired;
    }
    tierActive(flag) {
      if (flag === 'jellyAcid') return this.type === 'jelly' && this.tiers[0] >= 1 && !this.fused;
      return false;
    }
    // ---------------------------------------------------------- per-frame visuals
    render(dt, time) {
      const sp = this.sprite;
      this.age += dt;
      const tg = this.aimTarget;
      let want = 0;
      const canTilt = TILTERS[this.stats.attack] && this.type !== 'lab' && this.type !== 'farm';
      if (tg && !tg.dead && this.aimHold > 0) {
        const dx = tg.x - this.x, dy = tg.y - (this.y - 6);
        if (canTilt) want = U.clamp(Math.atan2(dy, Math.abs(dx) + 1), -0.75, 0.75);
        if (Math.abs(dx) > 6) this.setFacing(dx < 0 ? -1 : 1);
      } else this.aimTarget = null;
      this.aimHold -= dt;
      this.tilt += (want - this.tilt) * Math.min(1, dt * 12);
      this.kick = Math.max(0, this.kick - dt * 7);
      // growth: giant Kevin / fusion pop
      const goal = this.giant > 0 ? 2.3 : 1;
      this.growth += (goal - this.growth) * Math.min(1, dt * 6);
      const pop = this.age < 0.24 ? backOut(this.age / 0.24) : 1;
      const k = this.kick;
      const breathe = 1 + Math.sin(time * 0.004 + this.id) * 0.012;
      const base = (pop * this.growth) / S;
      sp.setScale(base * (1 + 0.07 * k), base * (1 - 0.07 * k) * breathe);
      sp.rotation = this.facing * this.tilt * 0.55;
      const dir = this.aimAngle();
      sp.x = this.x - Math.cos(dir) * 2.5 * k;
      sp.y = this.y - Math.sin(dir) * 2.5 * k;
      sp.setDepth(1000 + this.y + (this.giant > 0 ? 400 : 0));
      if (this.disabled > 0) {
        sp.setTint(Math.floor(time / 90) % 2 ? 0x7f8cff : 0xc0c8ff);
        if (Math.random() < dt * 6) this.game.fx.sparks.explode(1, this.x + U.rand(-12, 12), this.y - U.rand(0, 30));
      } else sp.clearTint();
      if (this.aura) {
        this.aura.rotation += dt * 0.8;
        const pulse = 1 + Math.sin(time * 0.004) * 0.06;
        this.aura.setScale((0.9 * pulse) / S * 1.0);
        this.aura.setDepth(1000 + this.y - 2);
        if (this.halo) {
          this.halo.rotation -= dt * 1.6;
          this.halo.setDepth(1000 + this.y - 1);
        }
        if (Math.random() < dt * 3) this.game.fx.sparkle(this.x + U.rand(-26, 26), this.y - U.rand(0, 50), this.auraColor);
      }
      if (this.planes.length) {
        const n = this.planes.length;
        this.planes.forEach((pl, i) => {
          const pos = this.planePos(i, pl.pos);
          const heading = Math.atan2(Math.cos(pos.a) * 0.7, -Math.sin(pos.a)) + (this.stats.planeSpeed < 0 ? Math.PI : 0);
          pl.sprite.setPosition(pos.x, pos.y + Math.sin(time * 0.005 + i) * 2);
          pl.sprite.rotation = heading;
          pl.sprite.setFlipY(Math.cos(heading) < 0);
          pl.sprite.setDepth(5500 + pos.y * 0.01);
          pl.shadow.setPosition(pos.gx, pos.gy + 4);
          pl.shadow.setScale(n > 0 ? 0.55 : 0.5, 0.42);
        });
      }
    }
    makeFusedVisuals() {
      const g = this.game;
      const col = MT.util.hexInt(this.def.fusion.color);
      this.auraColor = col;
      if (!this.aura) {
        this.aura = g.add.image(this.x, this.y - 8, 'fx_aura').setTint(col).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD);
        this.halo = g.add.image(this.x, this.y - 8, 'fx_halo').setTint(col).setAlpha(0.6).setScale(1 / S).setBlendMode(Phaser.BlendModes.ADD);
      }
    }
    sellValue() {
      return Math.floor(this.spent * MT.CFG.SELL_RATE);
    }
    destroy() {
      this.sprite.destroy();
      this.planes.forEach((p) => {
        p.sprite.destroy();
        p.shadow.destroy();
      });
      this.planes = [];
      if (this.aura) this.aura.destroy();
      if (this.halo) this.halo.destroy();
      this.aura = this.halo = null;
    }
  }

  MT.Enemy = Enemy;
  MT.Projectile = Projectile;
  MT.Tower = Tower;
  MT.ease = { backOut };
})();
