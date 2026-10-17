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
  const STOMPERS = { mega: 1, titan: 1, mecha: 1, macho: 1, vector: 1, bratt: 1, elmacho: 1, maxime: 1 };
  // flying mutants hover this many px above their route
  const FLY = 24;
  // art that faces right and should turn with the direction of travel
  const FACERS = { zeppelin: 1, mecha: 1, vector: 1, bratt: 1, scarlet: 1, jetpack: 1, glider: 1, maxime: 1 };
  // side-view airships that steer along the track in pseudo-3D: they pitch
  // up / down with the path, look shorter when heading towards or away from
  // the camera, and swing round (instead of snapping) when they turn back
  const STEERERS = { zeppelin: 1 };
  const PITCH = 0.62; // share of the path's slope the hull follows
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

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
      // flyers follow a corner-cutting air route instead of the track
      this.flying = !!def.flying;
      this.path = (this.flying ? game.airPaths : game.paths)[this.pathIndex];
      this.dist = o.dist || 0;
      this.camo = !!o.camo || !!def.alwaysCamo;
      this.fort = !!o.fort && (def.boss || def.armored || type === 'brute' || def.fortifiable);
      const sc = game.scaling;
      let hp = def.hp;
      if (this.fort) hp = type === 'tincan' ? 4 : hp * 2;
      // the late-game health ramp hits giants and the barrel brutes
      if (this.boss || type === 'brute') hp = Math.round(hp * sc.hp);
      if (o.hpMul) hp = Math.round(hp * o.hpMul);
      this.maxHp = hp;
      this.hp = hp;
      this.speed = def.speed * MT.CFG.SPEED_UNIT * sc.speed * (o.speedMul || 1);
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
      this.shredT = 0; // armor shredded by rockets: no armor, +1 damage taken
      this.markT = 0; // Lucy's Agent Mark: takes markAmp more damage while it lasts
      this.markAmp = 0;
      this.held = false; // grabbed by El Macho's Roadblock
      this.reversed = 0; // how often Vector's reverse squids shoved it back
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
      // Mole Mutant: alternates between running on the surface and digging under it
      this.burrowed = false;
      this.burrowAcc = 0;
      // Shield Carrier bubble (soaks up hits on nearby mutants); shieldSrc = who protects us now
      const sh = def.shield;
      this.bubble = sh ? { hp: sh.hp * (this.fort ? 2 : 1), max: sh.hp * (this.fort ? 2 : 1), regen: sh.regen, cd: sh.cooldown, broken: 0, r: sh.r, color: 0x6ecbff, hitT: 0 } : null;
      this.shieldSrc = null;
      // Regrow: when left alone it grows back into the mutant it came out of.
      // chain = the bigger mutants above it, up to the one it started as
      this.regrow = o.regrow && MT.canRegrow(type) ? { chain: o.regrowChain || [], fort: !!(o.regrowFort || o.fort), t: MT.REGROW_TIME } : null;
      this.healT = def.heal ? def.heal.every * (0.4 + Math.random() * 0.6) : 0; // Medic Mutant pulse
      this.rageHits = 0; // Rage Mutant: every hit makes it faster
      this.immFx = 0;
      this.ai = null; // boss battle brain, see MT.BossFight
      const p = this.path.atInto(this.dist, { x: 0, y: 0, dx: 1 });
      this.x = p.x;
      this.y = p.y - (this.flying ? FLY : 0);
      this.dir = p.dx >= 0 ? 1 : -1;
      this.sprite = game.add.image(this.x, this.y, this.texKey()).setScale(1 / S);
      this.sprite.setOrigin(0.5, game.enemyOrigin(type));
      if (this.camo && !def.alwaysCamo) this.sprite.setAlpha(0.82);
      this.sprite.setDepth(1000 + this.y);
      this.overlay = null;
      if (this.flying) this.shadow = game.add.image(this.x, this.y + FLY, 'fx_shadow').setAlpha(0.3).setDepth(990).setScale((this.radius * 2.2) / 128, (this.radius * 1.2) / 48);
      // airships cast a flat shadow on the track below the tilted hull
      else if (STEERERS[type]) this.shadow = game.add.image(this.x, this.y, 'fx_shadow').setAlpha(0.32).setDepth(990);
      if (def.ai) MT.BossFight.attach(game, this);
    }
    texKey() {
      return MT.EnemyArt.key(this.game, this.type, this.camo, this.fort, this.dmgState);
    }
    get remaining() {
      return this.path.length - this.dist;
    }
    // look: how the slow shows on the mutant (jelly by default, 'wet' water, 'bite' bat bites)
    applySlow(mul, dur, soak, acid, look) {
      if (this.def.noSlow) return;
      if (this.slowT <= 0 || mul <= this.slowMul) {
        this.slowMul = mul;
        this.slowSoak = !!soak;
        this.slowAcid = !!acid;
        this.slowLook = look || null;
      }
      this.slowT = Math.max(this.slowT, dur);
    }
    applyDot(dot, tower) {
      // damage buffs (brews, Legend Form, POWER UP) count for the poison too
      const dmg = tower && tower.dmgMul > 1 ? dot.dmg * tower.dmgMul : dot.dmg;
      if (!this.dot || dmg >= this.dot.dmg) this.dot = { dmg, every: dot.every, t: dot.every, left: dot.dur, tower };
      else this.dot.left = Math.max(this.dot.left, dot.dur);
    }
    // giants can't be stun-locked: after a stun they shrug off stuns for a moment
    tryStun(dur) {
      if (!this.boss) {
        this.stun = Math.max(this.stun, dur);
        return;
      }
      if (this.stunImmune > 0) return;
      if (this.def.final || this.def.bossFight) dur *= 0.5;
      this.stun = Math.max(this.stun, dur);
      this.stunImmune = dur + 1.4;
    }
    speedNow() {
      if (this.burrowed) return this.speed * this.def.burrow.speed * this.enrage;
      if (this.stun > 0 || this.freeze > 0 || this.dance > 0 || this.held) return 0;
      let m = this.auraMul * this.game.globalSlow(this) * this.enrage;
      if (this.slowT > 0) m *= this.slowMul;
      return this.speed * m;
    }
    // dig under (down = true) or pop back up out of the ground
    dig(down) {
      this.burrowed = down;
      this.burrowAcc = 0;
      const g = this.game;
      g.fx.dust.explode(down ? 6 : 9, this.x, this.y + this.radius * 0.6);
      if (!down) {
        this.burst = true;
        this.age = 0;
        g.fx.debris.explode(3, this.x, this.y);
      }
      MT.Audio.play('dig', this.x);
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
      if (this.shredT > 0) this.shredT -= dt;
      if (this.markT > 0) this.markT -= dt;
      if (this.immFx > 0) this.immFx -= dt;
      const def = this.def;
      // Magma Mutants melt every bit of ice straight away
      if (this.freeze > 0 && def.immune && def.immune.includes('cold')) this.freeze = 0;
      if (this.regrow && this.regrow.chain.length) {
        this.regrow.t -= dt;
        if (this.regrow.t <= 0) {
          // replaced by the bigger mutant it grows back into
          this.game.regrowEnemy(this);
          return;
        }
      }
      if (def.heal) {
        this.healT -= dt;
        if (this.healT <= 0) {
          this.healT = def.heal.every;
          this.game.healPulse(this);
        }
      }
      if (this.ai) {
        MT.BossFight.update(this.game, this, dt);
        if (this.dead) return;
      }
      const bb = this.bubble;
      if (bb) {
        if (bb.hitT > 0) bb.hitT -= dt;
        if (bb.broken > 0) {
          bb.broken -= dt;
          if (bb.broken <= 0) {
            if (bb.once) this.bubble = null;
            else {
              bb.hp = bb.max;
              bb.grow = 0;
              MT.Audio.play('shield', this.x);
            }
          }
        } else bb.hp = Math.min(bb.max, bb.hp + bb.regen * dt);
      }
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
      const moved = this.speedNow() * dt;
      this.dist += moved;
      if (def.burrow) {
        const b = def.burrow;
        this.burrowAcc += moved;
        if (!this.burrowed && this.burrowAcc >= b.up && this.dist > 60 && this.remaining > b.down + 90) this.dig(true);
        else if (this.burrowed && (this.burrowAcc >= b.down || this.remaining < 70)) this.dig(false);
      }
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
      this.y = p.y - (this.flying ? FLY : 0);
      if (Math.abs(p.dx) > 0.3) this.dir = p.dx > 0 ? 1 : -1;
      this.auraMul = 1;
    }
    // visual-only update, once per rendered frame
    render(time, dt) {
      const sp = this.sprite;
      this.age += dt;
      if (this.hitT > 0) this.hitT -= dt;
      if (this.hitCool > 0) this.hitCool -= dt;
      this.renderBubble(time, dt);
      this.renderRegrow(time);
      if (this.burrowed) {
        // only a travelling mound of dirt shows where the mole is digging
        sp.setVisible(false);
        if (this.overlay) this.overlay.setVisible(false);
        if (this.regrowSprite) this.regrowSprite.setVisible(false);
        if (!this.mound) this.mound = this.game.add.image(0, 0, 'fx_mound').setScale(0.9 / S);
        const q = Math.sin(time * 0.03 + this.wobble);
        this.mound.setVisible(true).setPosition(this.x, this.y + this.radius * 0.55 + q).setDepth(1000 + this.y).setScale((0.85 + q * 0.06) / S, (0.85 - q * 0.06) / S);
        if (Math.random() < dt * 9) this.game.fx.dust.explode(1, this.x + U.rand(-8, 8), this.y + this.radius * 0.7);
        return;
      }
      if (this.mound) this.mound.setVisible(false);
      if (!sp.visible) sp.setVisible(true);
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
        if (STOMPERS[this.type] && !this.flying && (s > 0) !== (this.lastStep > 0)) {
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
      if (this.flying) {
        // hovering: a slow bob and a wing-flap squash instead of walking
        const f = time * 0.02 + this.wobble;
        lift = Math.sin(f * 0.3) * 3.5;
        sy *= 1 + Math.sin(f * 1.7) * 0.05;
        rot = Math.sin(f * 0.45) * 0.07;
        if (this.shadow) this.shadow.setPosition(this.x, this.y + FLY + this.radius * 0.8).setAlpha(0.2 + (lift + 3.5) * 0.02);
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
      if (STEERERS[this.type]) {
        const st = this.steer(dt);
        sx *= st.sx;
        sy *= st.sy;
        rot = rot * 0.4 + st.rot;
        if (this.shadow) {
          // a top-down projection, so it simply lies along the heading
          const r = this.radius;
          this.shadow.setPosition(this.x, this.y + r * 0.75).setRotation(this.head).setScale((r * 2) / 128, (r * 0.7) / 48);
        }
      }
      sp.setScale(sx / S, sy / S);
      sp.x = this.x;
      sp.y = this.y + lift;
      sp.rotation = rot;
      if (FACERS[this.type] && !STEERERS[this.type]) sp.setFlipX(this.dir < 0);
      sp.setDepth(1000 + this.y + (this.flying ? 400 : 0));
      if (this.def.alwaysCamo) sp.setAlpha(0.62 + Math.sin(time * 0.004 + this.wobble) * 0.16);
      // a furious Rage Mutant lets off steam
      if (this.def.rage && this.enrage > 1.5 && Math.random() < dt * this.enrage * 4) this.game.fx.puffs.explode(1, this.x + U.rand(-6, 6), sp.y - this.radius * 1.4);
      // status tint
      if (this.freeze > 0) sp.setTint(0xa8dcff);
      else if (this.hitT > 0) sp.setTint(0xffd2d2);
      else if (this.shieldSrc && this.shieldSrc !== this) sp.setTint(0xcdeeff);
      else if (this.slowT > 0) sp.setTint(this.slowLook === 'wet' ? 0xc4e8ff : this.slowLook === 'bite' ? 0xe8c8ff : this.slowAcid ? 0xd8ffb0 : 0xffc0d0);
      else if (this.enrage > 1) sp.setTint(0xffb0b0);
      else if (this.shredT > 0) sp.setTint(0xffcf9e);
      else sp.clearTint();
      this.updateOverlay();
    }
    // heading-based pose for STEERERS: { sx, sy, rot } multipliers
    steer(dt) {
      const d = U.clamp(this.dist, 6, this.path.length - 6);
      const want = this.path.angleAt(d);
      // ease the heading so corners become smooth banked turns
      if (this.head == null) this.head = want;
      else this.head += angDiff(this.head, want) * Math.min(1, dt * 2.5);
      const c = Math.cos(this.head), s = Math.sin(this.head);
      // facing eases between -1 and 1: going through 0 reads as the hull
      // swinging round towards the camera
      if (this.face == null) this.face = c < 0 ? -1 : 1;
      const goal = Math.abs(c) > 0.2 ? Math.sign(c) : this.face < 0 ? -1 : 1;
      this.face += (goal - this.face) * Math.min(1, dt * 3);
      const f = this.face;
      const side = f < 0 ? -1 : 1;
      // nose dips when flying down-screen (towards the camera), lifts going up
      const pitch = Math.atan2(s, Math.abs(c)) * PITCH;
      return {
        sx: side * Math.max(0.18, Math.abs(f)) * (1 - 0.28 * Math.abs(s)),
        sy: 1 + 0.07 * s,
        rot: pitch * side,
      };
    }
    // regrow badge: a little green heart that fills up until the mutant grows back
    renderRegrow(time) {
      const rg = this.regrow;
      if (!rg) return;
      if (!this.regrowSprite) this.regrowSprite = this.game.add.image(0, 0, 'fx_regrow');
      const ready = rg.chain.length ? 1 - Math.max(0, rg.t) / MT.REGROW_TIME : 0;
      const pulse = 1 + (ready > 0.7 ? Math.sin(time * 0.03) * 0.15 : 0);
      const sz = Math.max(15, Math.min(22, this.radius * 1.2)) * pulse;
      this.regrowSprite.setVisible(true).setDisplaySize(sz, sz)
        .setPosition(this.x + this.radius * 0.85, this.sprite.y - this.radius * 1.35)
        .setAlpha(rg.chain.length ? 0.8 + 0.2 * ready : 0.7)
        .setDepth(1000 + this.y + (this.flying ? 460 : 60));
    }
    // the shield dome of a Shield Carrier (or a boss shielding itself)
    renderBubble(time, dt) {
      const bb = this.bubble;
      const on = bb && bb.hp > 0 && !(bb.broken > 0) && !this.burrowed;
      if (!on) {
        if (this.bubbleSprite) this.bubbleSprite.setVisible(false);
        return;
      }
      if (!this.bubbleSprite) this.bubbleSprite = this.game.add.image(0, 0, 'fx_bubble').setBlendMode(Phaser.BlendModes.ADD);
      bb.grow = Math.min(1, (bb.grow == null ? 1 : bb.grow) + dt * 2.5);
      const r = (bb.self ? this.radius * 1.55 : bb.r) * (0.3 + 0.7 * backOut(bb.grow));
      const pulse = 1 + Math.sin(time * 0.006 + this.wobble) * 0.025;
      const k = bb.hp / bb.max;
      this.bubbleSprite.setVisible(true).setTint(bb.color)
        .setPosition(this.x, this.y - (bb.self ? this.radius * 0.2 : 0))
        .setDisplaySize(r * 2 * pulse, r * (bb.self ? 2 : 1.7) * pulse)
        .setAlpha(Math.min(1, 0.32 + 0.45 * k + (bb.hitT > 0 ? 0.35 : 0)))
        .setDepth(1000 + this.y + (this.flying ? 401 : bb.self ? 2 : 40));
      this.bubbleSprite.rotation += dt * 0.3;
    }
    updateOverlay() {
      let want = null;
      if (this.freeze > 0) want = 'fx_ice';
      else if (this.slowT > 0 && !this.boss && this.slowLook !== 'bite') want = this.slowLook === 'wet' ? 'fx_wet' : this.slowAcid ? 'fx_jelly_acid' : 'fx_jelly';
      if (!want) {
        if (this.overlay) {
          this.overlay.destroy();
          this.overlay = null;
        }
        return;
      }
      if (!this.overlay) this.overlay = this.game.add.image(0, 0, want);
      this.overlay.setVisible(true);
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
      [this.shadow, this.mound, this.bubbleSprite, this.regrowSprite].forEach((o) => o && o.destroy());
      this.shadow = this.mound = this.bubbleSprite = this.regrowSprite = null;
      if (this.ai) MT.BossFight.detach(this.game, this);
    }
  }
  Enemy.FLY = FLY;
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
      if (p.boomerang && tower) {
        // flies out on a curve, then turns around and returns to the thrower
        this.boomer = true;
        this.maxTravel = (o.range || 150) * 0.95;
        this.travel = 0;
        this.back = false;
        this.curve = 1.4 * (tower.facing || 1) * (tower.shots % 2 ? 1 : -1);
        this.life = (this.maxTravel * 2.8) / p.speed + 0.6;
        this.basePierce = this.pierce;
      }
    }
    update(dt) {
      const g = this.game;
      this.age += dt;
      if (this.boomer) {
        const t = this.tower;
        if (!this.back) {
          this.travel += this.speed * dt;
          this.angle += this.curve * dt;
          if (this.travel >= this.maxTravel) {
            // on the way back it can hit everything again
            this.back = true;
            this.hit.clear();
            this.pierce = this.basePierce;
          }
        } else {
          if (t.dead || U.dist2(this.x, this.y, t.x, t.y - 10) < 18 * 18) {
            this.kill();
            return;
          }
          const want = Math.atan2(t.y - 10 - this.y, t.x - this.x);
          this.angle += U.clamp(Phaser.Math.Angle.Wrap(want - this.angle), -10 * dt, 10 * dt);
        }
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
      }
      if (this.p.homing) {
        if (!this.target || this.target.dead || this.target.burrowed) this.target = g.nearestEnemy(this.x, this.y, 260, this.tower && this.tower.stats.camo, null, !this.tower || this.tower.stats.air);
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
        if (e.dead || this.hit.has(e.id) || !g.hittable(e, this.tower, this.p)) continue;
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
      if (this.p.cloud) this.game.addZone(this.x, this.y, this.p.cloud, this.tower, this.p.cloudKind || (this.p.tex === 'p_fire' ? 'fire' : 'gas'));
    }
  }

  // ===================================================================== Tower
  const TILTERS = { proj: 1, instant: 1, chain: 1, trap: 1, lob: 1 };
  // Where each tower's weapon sits in its (right-facing) art, relative to the
  // sprite origin. Shots leave from there, mirrored when the tower turns left.
  const MUZZLE = {
    banana: [20, -14], fart: [26, 8], rocket: [32, -17], freeze: [30, 9], jelly: [26, 8], sniper: [35, -5],
    tesla: [27, -4], rockstar: [18, 0], nails: [20, -12], sub: [30, 3], lab: [25, -31], super: [22, -12],
    ninja: [22, -6], catapult: [8, -24], potion: [19, -17], fireman: [31, 4], vampire: [21, -4],
  };
  // the same for the Ultimate forms (their weapon, if they hold one)
  const ULT_MUZZLE = {
    banana: [0, -20], fart: [35, -75], rocket: [54, -34], jelly: [0, -24], sniper: [64, -24], rockstar: [0, -10],
    nails: [44, -40], sub: [30, -6], lab: [71, -85], super: [0, -12],
    ninja: [38, 0], catapult: [32, -90], potion: [0, -24], fireman: [66, -48], vampire: [0, -60],
  };
  // Ultimate forms with a weapon on one side turn round to face their target
  // (the symmetric ones and the stage with its sign stay put)
  const ULT_FLIP = { fart: 1, rocket: 1, sniper: 1, lab: 1, nails: 1, sub: 1, ninja: 1, fireman: 1 };

  // Strengthen a stat block by factor k (Ultimate form = 2.5, Omega part = 1.5).
  function boostStats(s, k) {
    const dmg = k, pierce = 1 + (k - 1) * 0.6, rate = 1 / (1 + (k - 1) * 0.4), range = 1 + (k - 1) * 0.12;
    if (s.range && s.range < 1000) s.range = Math.round(s.range * range);
    if (s.rate && s.rate < 900) s.rate *= rate;
    const bp = (p) => {
      if (!p) return;
      ['dmg', 'moabDmg', 'bruteDmg'].forEach((f) => { if (p[f]) p[f] = Math.ceil(p[f] * dmg); });
      if (p.pierce && p.pierce > 1) p.pierce = Math.ceil(p.pierce * pierce);
      if (p.explode) {
        p.explode.dmg = Math.ceil(p.explode.dmg * dmg);
        p.explode.pierce = Math.ceil(p.explode.pierce * pierce);
        p.explode.r = Math.round(p.explode.r * range);
      }
      if (p.mine) p.mine.dmg = Math.ceil(p.mine.dmg * dmg);
      if (p.cluster) p.cluster.dmg = Math.ceil(p.cluster.dmg * dmg);
      if (p.dot) p.dot.dmg = Math.ceil(p.dot.dmg * dmg);
      if (p.chain) p.chain.jumps = Math.ceil(p.chain.jumps * pierce);
      if (p.scale) p.scale *= 1 + (k - 1) * 0.15;
    };
    bp(s.proj);
    if (s.alt) bp(s.alt.proj);
    if (s.planes) s.planes = Math.min(4, s.planes + (k > 2 ? 1 : 0));
    if (s.maxTraps) s.maxTraps = Math.round(s.maxTraps * pierce);
    if (s.bananas) s.bananas = Math.round(s.bananas * pierce);
    if (s.value) s.value = Math.round(s.value * dmg);
    if (s.flat) s.flat = Math.round(s.flat * dmg);
    if (s.buff) {
      s.buff.rate = Math.min(0.5, (s.buff.rate || 0) + 0.05 * (k - 1));
      s.buff.range = (s.buff.range || 0) + 0.05 * (k - 1);
      if (k > 2) s.buff.pierce = (s.buff.pierce || 0) + 1;
    }
    if (s.buffRange) s.buffRange = Math.round(s.buffRange * range);
    return s;
  }

  class Tower {
    // o.component: a hidden part of an Omega Tower (no own sprite or panel)
    constructor(game, type, x, y, isHero, o = {}) {
      this.game = game;
      this.type = type;
      this.hero = !!isHero;
      this.def = isHero ? MT.HEROES[type] : type === 'omega' ? MT.OMEGA : MT.TOWERS[type];
      this.id = ++game.uid;
      this.x = x;
      this.y = y;
      this.tiers = [0, 0, 0];
      this.fused = !!o.component;
      this.component = !!o.component;
      this.ultimate = false;
      this.omega = type === 'omega';
      this.subs = o.subs || null;
      this.heat = 0;
      this.focusId = -1;
      this.focusStacks = 0;
      this.sonarT = 1;
      this.trackPts = null;
      this.moveAge = 1;
      this.level = 1;
      this.xp = 0;
      this.stars = 0; // hero ascension past level 10
      this.sxp = 0; // XP towards the next star
      this.legend = 0; // Legend Form time left
      this.powerLv = 0; // POWER UP stars of an Ultimate or Omega Mech (Omega parts share them)
      this.dmgMul = 1;
      this.pops = 0;
      this.spent = 0;
      this.dmg = 0; // damage dealt, for the end-of-game stats
      this.earned = 0; // bananas this tower made (pops, farms, banks)
      this.bump = 0; // upgrade squash animation
      this.disableKind = null; // what knocked it out: emp / ink / gum / lava
      this.disableSprite = null;
      this.cool = 0.15;
      this.targetMode = 0;
      this.targetName = null; // the chosen targeting mode, kept by name across upgrades
      this.spot = null; // Catapult "Spot" mode: where the boulders land
      this.huntX = null; // centre of the Pilot's patrol (follows mutants in "Hunt" mode)
      this.huntY = null;
      this.cashBonus = 0; // Dru's Gold Rush: extra bananas per pop
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
      if (this.component) this.sprite.setVisible(false);
      this.recompute();
    }
    originY() {
      if (this.omega) return MT.TowerArt.OMEGA_OY;
      if (this.ultimate) return MT.TowerArt.ULT_OY;
      if (this.fused) return MT.TowerArt.FUSED_OY;
      if (this.hero) return 64 / 110;
      if (this.type === 'farm' || this.type === 'lab') return 58 / 92;
      return 49 / 92;
    }
    texKey() {
      if (this.hero) return MT.TowerArt.heroKey(this.game, this.type, this.level, this.stars);
      if (this.omega) return MT.TowerArt.omegaKey(this.game, this.subs.map((s) => s.type));
      if (this.ultimate) return MT.TowerArt.ultimateKey(this.game, this.type);
      if (this.fused) return MT.TowerArt.fusedKey(this.game, this.type);
      return MT.TowerArt.key(this.game, this.type, this.tiers);
    }
    refreshTexture() {
      this.sprite.setTexture(this.texKey());
      this.sprite.setOrigin(0.5, this.originY());
      if (this.planes.length) this.syncPlanes(true);
    }
    get name() {
      if (this.omega) return this.def.name;
      if (this.ultimate) return this.def.fusion.ultimate.name;
      return this.fused ? this.def.fusion.name : this.def.name;
    }
    // ability strength / cooldown multipliers for the bigger fusion tiers
    get power() {
      if (this.hero) return 1 + 0.2 * this.stars;
      return this.ultimate ? 2.5 : this.component ? 1.5 : 1;
    }
    get cdMul() {
      const lab = (this.game.perks && this.game.perks.cd) || 1;
      if (this.hero) return Math.max(0.5, Math.pow(0.95, this.stars)) * lab;
      return (this.ultimate ? 0.7 : this.component ? 0.8 : 1) * lab;
    }
    get powerSpeed() {
      return 1 + MT.POWER.speed * this.powerLv;
    }
    get totalPops() {
      return this.omega ? this.subs.reduce((a, s) => a + s.pops, this.pops) : this.pops;
    }
    recompute() {
      let s;
      if (this.omega) {
        const subs = this.subs || [];
        s = { range: Math.max(60, ...subs.map((u) => (u.stats.range < 1000 ? u.stats.range : 0))), rate: 999, attack: 'omega' };
      } else if (this.fused) {
        s = U.deepClone(this.def.fusion.base);
        if (this.ultimate) boostStats(s, 2.5);
        else if (this.component) boostStats(s, 1.5);
      } else {
        s = U.deepClone(this.def.base);
        if (this.hero) {
          for (let l = 2; l <= this.level; l++) {
            const L = this.def.levels[l];
            if (L && L.fx) L.fx(s);
          }
          MT.ascendStats(s, this.stars);
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
      this.syncTarget();
    }
    // the list of targeting modes depends on the attack: keep the chosen one by name
    syncTarget() {
      const list = MT.targetModes(this);
      const i = this.targetName ? list.indexOf(this.targetName) : -1;
      this.targetMode = i >= 0 ? i : Math.min(this.targetMode, list.length - 1);
      if (i < 0) this.targetName = list[this.targetMode];
    }
    applyBuffs() {
      const s = U.deepClone(this.baseStats);
      const b = this.buffs;
      this.buffArmored = false;
      this.bonusPierce = 0;
      this.dmgMul = 1 + ((b && b.dmg) || 0);
      if (b && s.attack !== 'none') {
        if (b.range) s.range *= 1 + b.range;
        if (b.rate) s.rate *= 1 - b.rate;
        if (b.camo) s.camo = true;
        if (b.armored) this.buffArmored = true;
        this.bonusPierce = b.pierce || 0;
      }
      // Gru's Lab research (meta progression) helps every tower a little
      const pk = this.game.perks;
      if (pk && s.attack !== 'none') {
        if (pk.rate !== 1 && s.rate < 900) s.rate *= pk.rate;
        if (pk.range !== 1 && s.range < 1000) s.range *= pk.range;
        this.bonusPierce += pk.pierce || 0;
      }
      // Kevin's Teamwork speeds up Kevin himself too
      if (this.hero && s.teamwork) s.rate *= 1 - MT.HeroTraits.teamRate(this);
      if (this.giant > 0) {
        s.range *= 1.5;
        s.rate *= 0.35;
      }
      if (this.legend > 0) {
        s.range *= 1.2;
        s.rate *= 0.4;
        this.dmgMul *= 2;
      }
      // an Alchemist's brew: a short boost on top of everything else
      if (this.brewT > 0 && this.brew && s.attack !== 'none') {
        const bw = this.brew;
        s.range *= 1 + (bw.range || 0);
        s.rate *= 1 - (bw.rate || 0);
        this.bonusPierce += bw.pierce || 0;
        this.dmgMul *= 1 + (bw.dmg || 0);
      }
      // POWER UP stars: more damage, faster attacks and more income
      if (this.powerLv > 0) {
        const n = this.powerLv;
        this.dmgMul *= 1 + MT.POWER.dmg * n;
        if (s.rate < 900) s.rate /= 1 + MT.POWER.speed * n;
        if (s.flat) s.flat = Math.round(s.flat * (1 + MT.POWER.income * n));
        if (s.value) s.value = Math.round(s.value * (1 + MT.POWER.income * n));
      }
      // heroes and every fusion tier can shoot down flying mutants; a Lab radar grants it too
      if (this.hero || this.fused || this.omega || (b && b.air)) s.air = true;
      this.stats = s;
    }
    // can this path be upgraded given crosspath rules
    pathState(pi) {
      if (this.fused || this.omega) return 'max';
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
      if (this.omega) {
        // the Omega Mech runs its three parts (they fire from its arms and back)
        // and charges the Omega Beam in its core
        for (const u of this.subs) u.update(dt);
        MT.Giants.omegaUpdate(g, this, dt * this.powerSpeed);
        return;
      }
      // POWER UP stars make the giant attacks come faster too
      if (this.ultimate) MT.Giants.update(g, this, dt * this.powerSpeed);
      // sonar pings strip Camo from mutants in range
      if (s.sonar) {
        this.sonarT -= dt;
        if (this.sonarT <= 0) {
          this.sonarT = s.sonar;
          g.sonarPing(this);
        }
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
      if (this.legend > 0) {
        this.legend -= dt;
        if (this.legend <= 0) {
          this.legend = 0;
          this.applyBuffs();
          g.recalcBuffs();
          g.fx.ring(this.x, this.y, 70, MT.util.hexInt(this.def.color), { dur: 400 });
        }
      }
      if (s.attack === 'plane') {
        this.planeA += (s.planeSpeed || 1.5) * dt;
        this.updateHunt(dt);
      }
      // Alchemist brews wear off; Alchemists hand out new ones; Bee-do sirens wail
      if (this.brewT > 0) {
        this.brewT -= dt;
        if (this.brewT <= 0) {
          this.brewT = 0;
          this.brew = null;
          this.applyBuffs();
        }
      }
      if (s.brew) MT.NewTowers.brewTick(g, this, dt);
      if (s.siren) MT.NewTowers.sirenTick(g, this, dt);
      if (s.attack === 'none') return;
      // momentum (Super Minion): heat builds up while firing, cools when idle
      if (s.momentum && this.idle > 0.4) this.heat = Math.max(0, this.heat - dt * 0.6);
      this.idle = (this.idle || 0) + dt;
      this.cool -= dt;
      if (this.cool > 0) return;
      let rate = s.rate * g.rateMul(this);
      if (s.momentum) rate /= 1 + this.heat * s.momentum;
      let fired = false;
      switch (s.attack) {
        case 'trap':
          fired = g.placeTrap(this);
          break;
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
        case 'lob': {
          // "Spot" mode: boulders always land on the chosen spot, like a mortar
          if (this.spot && MT.targetName(this) === 'Spot') {
            if (g.enemiesInRange(this.spot.x, this.spot.y, 130, s.camo, !!s.air).length) {
              MT.NewTowers.lob(g, this, MT.spotTarget(this.spot), true);
              fired = true;
            }
            break;
          }
          const t = g.findTarget(this);
          if (t) {
            MT.NewTowers.lob(g, this, t);
            fired = true;
          }
          break;
        }
        case 'melee': {
          const t = g.findTarget(this);
          if (t) {
            this.aimAt(t);
            g.meleeHit(this, t);
            fired = true;
          }
          break;
        }
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
        this.idle = 0;
        if (s.momentum) this.heat = Math.min(1, this.heat + Math.max(0.01, s.rate * 0.35));
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
      if (Math.abs(dx) > this.flipDeadzone) this.setFacing(dx < 0 ? -1 : 1);
    }
    // the giant tiers are big structures: they don't tilt, and only the ones
    // holding a weapon on one side turn round (with a wider dead zone)
    get landmark() {
      return this.ultimate || this.omega;
    }
    get flipDeadzone() {
      if (!this.landmark) return 3;
      return this.ultimate && ULT_FLIP[this.type] ? 30 : Infinity;
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
      // Omega parts fire from the mech's arms / back
      if (this.component && this.ox != null) return { x: this.x + this.ox, y: this.y + this.oy };
      const f = this.facing;
      if (this.ultimate) {
        const u = ULT_MUZZLE[this.type];
        if (u) return { x: this.x + u[0] * f, y: this.y + u[1] };
      }
      const m = !this.hero && MUZZLE[this.type];
      if (m) {
        // follow the sprite: mirrored with the facing, rotated with the tilt
        const k = this.fused && !this.ultimate ? MT.TowerArt.FUSED_BOX.FK : 1;
        const r = f * this.tilt * 0.55;
        const mx = m[0] * f * k, my = m[1] * k;
        const c = Math.cos(r), sn = Math.sin(r);
        return { x: this.x + mx * c - my * sn, y: this.y + mx * sn + my * c };
      }
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
      // (the giant tiers are buildings: they turn round but never tilt)
      if (!this.landmark) this.tilt = U.clamp(Math.atan2(t.y - (this.y - 6), Math.abs(dx0) + 1), -0.75, 0.75);
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
      // rhythm (Rock Star): every Nth note is a power chord
      const chord = s.rhythm && this.shots % s.rhythm === s.rhythm - 1;
      // Ninja caltrops: every few throws a pile lands right in front of the target
      if (s.caltrops && this.shots % s.caltrops.every === s.caltrops.every - 1) MT.NewTowers.caltrops(g, this, t);
      if (chord) p = Object.assign({}, p, { dmg: Math.max(1, p.dmg) * 3, pierce: p.pierce * 2, r: (p.r || 10) * 1.5, knock: (p.knock || 0) + 6, scale: (p.scale || 1) * 1.5 });
      // Vector's REVERSE squid: a big one that shoves the mutants back where it lands
      if (s.reverse && this.shots % s.reverse.every === s.reverse.every - 1) p = Object.assign({}, p, { reverse: s.reverse, explode: null, pierce: 1, r: (p.r || 8) * 1.4, scale: (p.scale || 1) * 1.6 });
      for (let i = 0; i < s.count; i++) {
        const a = base + (s.count > 1 ? ((i - (s.count - 1) / 2) * s.spread * Math.PI) / 180 : 0);
        g.addProjectile(new Projectile(g, this, sx, sy, a, p, { range: s.range, bonusPierce: this.bonusPierce, target: t }));
      }
      if (chord) {
        g.fx.ring(this.x, this.y - 10, 70, 0xff4081, { dur: 380 });
        g.fx.notes.explode(4, this.x, this.y - 30);
        MT.Audio.play('chord');
      }
      // extra missile every few volleys (Ballistic Missile), aimed at the biggest giant
      if (s.alt && this.shots % s.alt.every === s.alt.every - 1) {
        const tg = (s.alt.boss && g.strongestBoss()) || t;
        const a = Math.atan2(tg.y - sy, tg.x - sx);
        g.addProjectile(new Projectile(g, this, sx, sy - 6, a, s.alt.proj, { range: 2000, target: tg }));
        MT.Audio.play('rocket');
      }
      if (this.fused || s.count >= 3) g.fx.muzzle(sx, sy, this.fused ? MT.util.hexInt(this.def.fusion.color) : 0xffffff);
      const snd = {
        p_rocket: 'rocket', p_jelly: 'jelly', p_jelly_acid: 'jelly', p_laser: 'laser', p_plasma: 'laser', p_sun: 'laser', p_dart: 'laser', p_ice: 'freeze', p_freezebolt: 'freeze', p_wave: 'guitar', p_lipstick: 'laser', p_goo: 'jelly', p_squid: 'jelly',
        p_shuriken: 'shuriken', p_shuriken_gold: 'shuriken', p_potion: 'potion', p_potion_gold: 'potion', p_potion_big: 'potion', p_water: 'spray', p_waterball: 'splash', p_bat: 'bat', p_bat_big: 'bat',
      }[s.proj.tex] || 'throw';
      MT.Audio.play(snd, this.x);
    }
    // ---------------------------------------------------------- planes
    // flight patterns (the Pilot's targeting modes): circle, figure 8, a wide
    // loop, or "Hunt", where the whole patrol follows the leading mutant
    planePos(i, out) {
      const s = this.stats;
      const n = this.planes.length || 1;
      const a = this.planeA + (i * TAU) / n;
      const R = s.orbit || 62;
      const cx = this.huntX != null ? this.huntX : this.x, cy = this.huntY != null ? this.huntY : this.y;
      const mode = MT.targetName(this);
      let px, py, vx, vy;
      if (mode === 'Figure 8') {
        px = Math.sin(a) * R * 1.5;
        py = Math.sin(a) * Math.cos(a) * R * 1.2;
        vx = Math.cos(a) * 1.5;
        vy = Math.cos(2 * a) * 1.2;
      } else if (mode === 'Wide') {
        px = Math.cos(a) * R * 1.75;
        py = Math.sin(a) * R * 1.1;
        vx = -Math.sin(a) * 1.75;
        vy = Math.cos(a) * 1.1;
      } else {
        px = Math.cos(a) * R;
        py = Math.sin(a) * R * 0.7;
        vx = -Math.sin(a);
        vy = Math.cos(a) * 0.7;
      }
      out.gx = cx + px;
      out.gy = cy + py;
      out.x = out.gx;
      out.y = out.gy - 34;
      out.a = a;
      out.head = Math.atan2(vy, vx);
      return out;
    }
    // "Hunt": the patrol centre glides after the leading mutant, otherwise back home
    updateHunt(dt) {
      const g = this.game;
      let gx = this.x, gy = this.y;
      if (MT.targetName(this) === 'Hunt') {
        this.huntRe = (this.huntRe || 0) - dt;
        if (this.huntRe <= 0 || !this.huntTarget || this.huntTarget.dead) {
          this.huntRe = 0.4;
          this.huntTarget = g.findTargetFrom(this, this.x, this.y, 5000);
        }
        if (this.huntTarget && !this.huntTarget.dead) {
          gx = U.clamp(this.huntTarget.x, 30, MT.CFG.MAP_W - 30);
          gy = U.clamp(this.huntTarget.y, 50, MT.CFG.H - 30);
        }
      }
      if (this.huntX == null) {
        this.huntX = this.x;
        this.huntY = this.y;
      }
      const d = U.dist(this.huntX, this.huntY, gx, gy), step = 190 * dt;
      if (d <= step) {
        this.huntX = gx;
        this.huntY = gy;
      } else {
        this.huntX += ((gx - this.huntX) / d) * step;
        this.huntY += ((gy - this.huntY) / d) * step;
      }
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
        // the plane banks round to point its guns at the target
        pl.aim = base;
        pl.aimT = 0.45;
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
      if (this.component) {
        // hidden part of an Omega Tower: only its planes are visible
        this.renderPlanes(time, dt);
        return;
      }
      const sp = this.sprite;
      this.age += dt;
      this.moveAge += dt;
      const tg = this.aimTarget;
      let want = 0;
      const canTilt = TILTERS[this.stats.attack] && this.type !== 'lab' && this.type !== 'farm' && !this.landmark;
      if (tg && !tg.dead && this.aimHold > 0) {
        const dx = tg.x - this.x, dy = tg.y - (this.y - 6);
        if (canTilt) want = U.clamp(Math.atan2(dy, Math.abs(dx) + 1), -0.75, 0.75);
        if (Math.abs(dx) > Math.max(6, this.flipDeadzone)) this.setFacing(dx < 0 ? -1 : 1);
      } else this.aimTarget = null;
      if (this.landmark) MT.Giants.renderTower(this.game, this, dt, time);
      this.aimHold -= dt;
      this.tilt += (want - this.tilt) * Math.min(1, dt * 12);
      this.kick = Math.max(0, this.kick - dt * 7);
      // growth: giant Kevin / fusion pop
      const goal = this.giant > 0 ? 2.3 : this.legend > 0 ? 1.35 : 1;
      this.growth += (goal - this.growth) * Math.min(1, dt * 6);
      const pop = this.age < 0.24 ? backOut(this.age / 0.24) : 1;
      const k = this.kick;
      const breathe = 1 + Math.sin(time * 0.004 + this.id) * 0.012;
      const base = ((pop * this.growth) / S) * (this.omega ? MT.TowerArt.OMEGA_SCALE : 1);
      // springy bounce right after an upgrade
      let bx = 0, by = 0;
      if (this.bump > 0) {
        const w = Math.sin((1 - this.bump) * Math.PI * 4) * this.bump;
        bx = w * 0.16;
        by = -w * 0.14;
        this.bump = Math.max(0, this.bump - dt * 2.4);
      }
      sp.setScale(base * (1 + 0.07 * k + bx), base * (1 - 0.07 * k + by) * breathe);
      sp.rotation = this.facing * this.tilt * 0.55;
      // position, with a little hop arc right after the tower was moved
      let px = this.x, py = this.y;
      if (this.moveAge < 0.45 && this.moveFrom) {
        const m = this.moveAge / 0.45;
        const e = 1 - (1 - m) * (1 - m);
        px = U.lerp(this.moveFrom.x, this.x, e);
        py = U.lerp(this.moveFrom.y, this.y, e) - Math.sin(m * Math.PI) * 46;
      }
      const dir = this.aimAngle();
      sp.x = px - Math.cos(dir) * 2.5 * k;
      sp.y = py - Math.sin(dir) * 2.5 * k;
      sp.setDepth(1000 + this.y + (this.giant > 0 ? 400 : 0));
      if (this.disabled > 0) {
        const kind = this.disableKind;
        if (kind === 'ink') sp.setTint(0x77779c);
        else if (kind === 'gum') sp.setTint(0xffc6e6);
        else if (kind === 'roach') sp.setTint(0xa1887f);
        else if (kind === 'peck') sp.setTint(0xffe0b2);
        else if (kind === 'lava') {
          sp.setTint(Math.floor(time / 120) % 2 ? 0xff9c6b : 0xffc9a8);
          if (Math.random() < dt * 10) this.game.fx.sparkle(px + U.rand(-14, 14), py - U.rand(0, 30), 0xff7a1a);
        } else {
          sp.setTint(Math.floor(time / 90) % 2 ? 0x7f8cff : 0xc0c8ff);
          if (Math.random() < dt * 6) this.game.fx.sparks.explode(1, this.x + U.rand(-12, 12), this.y - U.rand(0, 30));
        }
        if (this.disableSprite) {
          const d = this.disableSprite;
          const wob = Math.sin(time * 0.01 + this.id) * 0.04;
          const k = d.baseScale * (d.grow == null ? 1 : d.grow);
          d.setPosition(px, py - 16).setDepth(1000 + this.y + 6).setScale(k * (1 + wob), k * (1 - wob));
        }
      } else if (this.disableSprite) {
        this.clearDisable();
      } else if (this.heat > 0.15) {
        // momentum glow: warmer tint the faster it fires
        const h = Math.round(255 - this.heat * 70);
        sp.setTint(Phaser.Display.Color.GetColor(255, h, Math.round(h * 0.8)));
        if (Math.random() < dt * this.heat * 14) this.game.fx.sparkle(this.x + U.rand(-14, 14), this.y - U.rand(0, 36), 0xff9100);
      } else if (this.legend > 0) {
        // Legend Form: shimmering gold
        const k2 = 0.5 + 0.5 * Math.sin(time * 0.012);
        sp.setTint(Phaser.Display.Color.GetColor(255, Math.round(236 + 19 * k2), Math.round(150 + 105 * k2)));
      } else sp.clearTint();
      if (this.hero) this.renderHero(dt, time, px, py);
      if (this.aura) {
        const sc = this.auraScale || 0.9;
        this.aura.setPosition(px, py - 8);
        this.aura.rotation += dt * 0.8;
        const pulse = 1 + Math.sin(time * 0.004) * 0.06;
        this.aura.setScale((sc * pulse) / S);
        this.aura.setDepth(1000 + this.y - 2);
        if (this.halo) {
          this.halo.setPosition(px, py - 8);
          this.halo.rotation -= dt * 1.6;
          this.halo.setDepth(1000 + this.y - 1);
          if (this.ultimate || this.omega) {
            // shimmering rainbow halo for the giant tiers
            const c = Phaser.Display.Color.HSVToRGB((time * 0.0002) % 1, 0.55, 1);
            this.halo.setTint(c.color);
          }
        }
        const spread = (this.ultimate ? 34 : this.omega ? 48 : 26);
        if (Math.random() < dt * (this.omega ? 8 : this.ultimate ? 5 : 3)) this.game.fx.sparkle(px + U.rand(-spread, spread), py - U.rand(0, spread * 2), this.auraColor);
      }
      if (this.orbs) {
        const R = this.omega ? 70 : this.hero ? 34 : 50;
        this.orbs.forEach((o, i) => {
          const a = time * 0.0018 + (i * TAU) / this.orbs.length;
          o.setPosition(px + Math.cos(a) * R, py - 24 + Math.sin(a) * R * 0.35);
          o.setDepth(1000 + this.y + (Math.sin(a) > 0 ? 3 : -3));
          o.setScale((0.38 + Math.sin(time * 0.006 + i) * 0.06) * (this.omega ? 1.2 : 1));
        });
      }
      if (this.subs) this.subs.forEach((u) => u.render(dt, time));
      // the POWER UP ★ badge sits on top of the giant
      if (this.badge && !this.hero) this.badge.setPosition(px, py - sp.displayHeight * sp.originY + 4).setDepth(1000 + this.y + 1);
      this.renderPlanes(time, dt);
      if (this.brewT > 0 && Math.random() < dt * 6) this.game.fx.sparkle(px + U.rand(-12, 12), py - U.rand(0, 34), 0xff5252);
    }
    renderPlanes(time, dt = 0.016) {
      if (!this.planes.length) return;
      this.planes.forEach((pl, i) => {
        const pos = this.planePos(i, pl.pos);
        const heading = pos.head;
        // fly along the patrol circle, but swing the nose towards the target while shooting
        pl.aimT = Math.max(0, (pl.aimT || 0) - dt);
        const want = pl.aimT > 0 ? pl.aim : heading;
        if (pl.cur == null) pl.cur = heading;
        pl.cur = Phaser.Math.Angle.Wrap(pl.cur + Phaser.Math.Angle.Wrap(want - pl.cur) * Math.min(1, dt * 12));
        pl.sprite.setPosition(pos.x, pos.y + Math.sin(time * 0.005 + i) * 2);
        pl.sprite.rotation = pl.cur;
        pl.sprite.setFlipY(Math.cos(pl.cur) < 0);
        pl.sprite.setDepth(5500 + pos.y * 0.01);
        pl.shadow.setPosition(pos.gx, pos.gy + 4);
      });
    }
    // ascended heroes: aura, halo, orbiting stars and a ★ badge
    makeHeroVisuals() {
      const g = this.game;
      const n = this.stars;
      if (!n) return;
      const col = MT.util.hexInt(this.def.color);
      this.auraColor = n >= 10 ? 0xffd54f : col;
      this.auraScale = 0.75 + Math.min(0.5, n * 0.04);
      if (!this.aura) {
        this.aura = g.add.image(this.x, this.y - 8, 'fx_aura').setBlendMode(Phaser.BlendModes.ADD);
        this.halo = g.add.image(this.x, this.y - 8, 'fx_halo').setBlendMode(Phaser.BlendModes.ADD);
      }
      this.aura.setTint(col).setAlpha(Math.min(0.8, 0.4 + n * 0.04));
      this.halo.setTint(0xffd54f).setAlpha(Math.min(0.7, 0.3 + n * 0.04)).setScale((0.8 + Math.min(0.4, n * 0.03)) / MT.Draw.S);
      const want = n >= 10 ? 3 : n >= 5 ? 2 : 1;
      if (!this.orbs || this.orbs.length !== want) {
        if (this.orbs) this.orbs.forEach((o) => o.destroy());
        this.orbs = [];
        for (let i = 0; i < want; i++) this.orbs.push(g.add.image(this.x, this.y, 'fx_star').setTint(i % 2 ? col : 0xffe082).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.95));
      }
      if (!this.badge) this.badge = MT.text(g, this.x, this.y, '', 13, { title: true, color: '#ffe082', strokeThickness: 3 });
      this.badge.setText('★' + n);
    }
    renderHero(dt, time, px, py) {
      // the ★ badge floats just above the hero's head (and its halo)
      const top = MT.HeroArt.headY(this.type) * this.growth;
      if (this.badge) this.badge.setPosition(px, py + top - 14).setDepth(1000 + this.y + 1).setScale(this.legend > 0 ? 1.2 : 1);
      if (this.legend > 0 && Math.random() < dt * 14) {
        this.game.fx.sparkle(px + U.rand(-26, 26), py - U.rand(0, 70), Math.random() < 0.5 ? 0xffd54f : MT.util.hexInt(this.def.color));
      }
    }
    makeFusedVisuals() {
      const g = this.game;
      const col = this.omega ? 0xffffff : MT.util.hexInt(this.def.fusion.color);
      this.auraColor = col;
      this.auraScale = this.omega ? 1.7 : this.ultimate ? 1.3 : 0.9;
      if (!this.aura) {
        this.aura = g.add.image(this.x, this.y - 8, 'fx_aura').setBlendMode(Phaser.BlendModes.ADD);
        this.halo = g.add.image(this.x, this.y - 8, 'fx_halo').setBlendMode(Phaser.BlendModes.ADD);
      }
      this.aura.setTint(col).setAlpha(this.omega ? 0.6 : 0.75);
      this.halo.setTint(col).setAlpha(0.6).setScale((this.omega ? 1.9 : this.ultimate ? 1.4 : 1) / S);
      if ((this.ultimate || this.omega) && !this.orbs) {
        const cols = this.omega ? this.subs.map((u) => MT.util.hexInt(u.def.fusion.color)) : [col, 0xffffff, col];
        this.orbs = cols.map((c) => g.add.image(this.x, this.y, 'fx_puff').setTint(c).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.95));
      }
      // POWER UP: the aura grows with every star, and a ★ badge floats above
      const n = this.powerLv;
      if (n > 0) {
        this.auraScale += n * 0.04;
        this.aura.setAlpha(Math.min(0.95, 0.75 + n * 0.02));
        if (!this.badge) this.badge = MT.text(g, this.x, this.y, '', 15, { title: true, strokeThickness: 4 });
        this.badge.setText('★' + n).setColor(n >= MT.POWER.max ? '#ffd54f' : '#ffe082');
      }
    }
    // a boss attack knocked this tower out; the overlay pops when it recovers
    clearDisable() {
      const d = this.disableSprite;
      this.disableSprite = null;
      this.disableKind = null;
      this.sprite.clearTint();
      if (!d) return;
      this.game.fx.puffs.explode(6, d.x, d.y);
      this.game.tweens.add({ targets: d, alpha: 0, scale: d.scale * 1.4, duration: 200, onComplete: () => d.destroy() });
    }
    // relocate the tower (the sprite hops over in render)
    moveTo(x, y) {
      this.moveFrom = { x: this.sprite.x, y: this.sprite.y };
      this.moveAge = 0;
      this.x = x;
      this.y = y;
      this.trackPts = null;
      this.huntX = this.huntY = null;
      if (this.subs) {
        this.subs.forEach((u) => {
          u.x = x;
          u.y = y;
          u.trackPts = null;
          u.huntX = u.huntY = null;
        });
      }
    }
    sellValue() {
      return Math.floor(this.spent * (this.game.sellRate || MT.CFG.SELL_RATE));
    }
    destroy() {
      this.dead = true;
      MT.Giants.cleanup(this);
      this.sprite.destroy();
      this.planes.forEach((p) => {
        p.sprite.destroy();
        p.shadow.destroy();
      });
      this.planes = [];
      if (this.aura) this.aura.destroy();
      if (this.halo) this.halo.destroy();
      if (this.orbs) this.orbs.forEach((o) => o.destroy());
      this.aura = this.halo = this.orbs = null;
      if (this.badge) this.badge.destroy();
      this.badge = null;
      if (this.disableSprite) this.disableSprite.destroy();
      this.disableSprite = null;
      if (this.subs) this.subs.forEach((u) => u.destroy());
    }
  }
  MT.boostStats = boostStats;

  MT.Enemy = Enemy;
  MT.Projectile = Projectile;
  MT.Tower = Tower;
  MT.ease = { backOut };
})();
