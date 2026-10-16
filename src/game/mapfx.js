// Interactive map features (see data/maps2.js): things on the map the player
// can click, or that act on their own. Each feature kind is a small class with
// optional step(dt) (simulation time), render(dt, time, ui), route(o) (pick the
// path of a new mutant) and roundEnd(income) (bananas to take back).
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const TAU = Math.PI * 2;
  const UI_DEPTH = 5650;

  const ground = (e) => !e.dead && !e.flying && !e.burrowed;

  // shared click / hover handling for a feature's sprite
  function clickable(g, it, sprite, tip) {
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerover', () => {
      it.hover = true;
      const f = it.f;
      g.hud.tip.show(sprite.x + 34, sprite.y - 60, f.name, (tip ? tip() : f.desc) || '');
    });
    sprite.on('pointerout', () => {
      it.hover = false;
      g.hud.tip.hide();
    });
    sprite.on('pointerdown', (p) => {
      if (p.rightButtonDown() || g.over || g.paused || g.placing || g.moving) return;
      MT.Audio.init();
      it.click();
      if (it.hover) g.hud.tip.show(sprite.x + 34, sprite.y - 60, it.f.name, (tip ? tip() : it.f.desc) || '');
    });
  }

  // ring around a clickable: fills up while cooling down, pulses when ready
  function cooldownRing(ui, x, y, r, frac, time, col) {
    ui.lineStyle(5, 0x000000, 0.35);
    ui.strokeCircle(x, y, r);
    if (frac > 0) {
      ui.lineStyle(4, 0xffffff, 0.9);
      ui.beginPath();
      ui.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - frac), false);
      ui.strokePath();
    } else {
      const k = 0.5 + 0.5 * Math.sin(time * 0.006);
      ui.lineStyle(4, col, 0.55 + 0.45 * k);
      ui.strokeCircle(x, y, r + k * 3);
    }
  }

  function notReady(g, it, msg) {
    MT.Audio.play('error');
    g.hud.toast(msg || `${it.f.name} is recharging (${Math.ceil(it.cd)}s)`, 1200);
  }

  // ---------------------------------------------------------------- rollercoaster
  class Coaster {
    constructor(g, f) {
      this.g = g;
      this.f = f;
      this.path = new MT.Path(f.loop.concat([f.loop[0]]));
      this.L = this.path.length;
      this.park = this.path.project(f.x + 44, f.y);
      this.gap = 30;
      this.cars = [0, 1, 2, 3].map(() => g.add.image(0, 0, 'mf_coaster').setScale(1 / S));
      this.run = false;
      this.d = 0;
      this.v = 0;
      this.cd = 0;
      this.hit = new Set();
      this.btn = g.add.image(f.x, f.y, 'mf_launch').setScale(1 / S).setOrigin(0.5, 0.8).setDepth(1000 + f.y + 40);
      clickable(g, this, this.btn);
    }
    wrap(d) {
      return ((d % this.L) + this.L) % this.L;
    }
    click() {
      if (this.run || this.cd > 0) return notReady(this.g, this);
      this.run = true;
      this.d = 0;
      this.v = 140;
      this.cd = this.f.cd;
      this.hit.clear();
      this.btn.setScale(0.85 / S);
      this.g.tweens.add({ targets: this.btn, scale: 1 / S, duration: 220, ease: 'Back.easeOut' });
      this.g.fx.speech(this.f.x + 60, this.f.y - 70, 'WHEEEE!');
      MT.Audio.play('jet');
    }
    step(dt) {
      if (this.cd > 0) this.cd -= dt;
      if (!this.run) return;
      const g = this.g;
      // speed up out of the station, race round, brake back in
      const left = this.L - this.d;
      this.v = left < 170 ? Math.max(110, this.v - 1000 * dt) : Math.min(580, this.v + 650 * dt);
      this.d += this.v * dt;
      if (this.d >= this.L) {
        this.d = 0;
        this.run = false;
      }
      for (let i = 0; i < this.cars.length; i++) {
        const q = this.path.at(this.wrap(this.park + this.d - i * this.gap));
        for (const e of g.queryEnemies(q.x, q.y, 50)) {
          if (!ground(e) || this.hit.has(e.id) || U.dist2(q.x, q.y, e.x, e.y) > (18 + e.radius * 0.6) ** 2) continue;
          this.hit.add(e.id);
          if (e.boss) {
            g.applyHit(e, { dmg: 0, moabDmg: 250, type: 'normal', ground: true }, null);
            e.tryStun(0.5);
          } else {
            const kids = g.applyHit(e, { dmg: 4, knock: 20, stun: { dur: 0.6 }, type: 'normal', ground: true }, null);
            if (kids) kids.forEach((k) => this.hit.add(k.id));
          }
          g.fx.sparks.explode(3, e.x, e.y);
          g.fx.dust.explode(2, e.x, e.y + 6);
        }
      }
    }
    render(dt, time, ui) {
      const bob = this.run ? Math.sin(time * 0.05) * 1.2 : 0;
      this.cars.forEach((c, i) => {
        const dist = this.wrap(this.park + (this.run ? this.d : 0) - i * this.gap);
        const q = this.path.at(dist);
        c.setPosition(q.x, q.y - 3 + bob).setRotation(this.path.angleAt(dist)).setDepth(1000 + q.y + 6);
      });
      if (this.run && Math.random() < dt * 30) {
        const q = this.path.at(this.wrap(this.park + this.d));
        this.g.fx.sparkle(q.x, q.y, U.pick([0xff5252, 0xffd740, 0x40c4ff]));
      }
      cooldownRing(ui, this.btn.x, this.btn.y - 18, 26, this.cd > 0 ? this.cd / this.f.cd : 0, time, 0xffd740);
    }
  }

  // ---------------------------------------------------------------- decorations that spin
  class Spinner {
    constructor(g, f) {
      this.f = f;
      this.sp = g.add.image(f.x, f.y, f.key).setScale(1 / S).setDepth(f.depth === 'top' ? 1000 + f.y + 90 : 986);
    }
    render(dt) {
      this.sp.rotation += this.f.speed * dt;
    }
  }

  // ---------------------------------------------------------------- drawbridges
  // two routes split at a fork; the lever decides which one is open
  class Drawbridge {
    constructor(g, f) {
      this.g = g;
      this.f = f;
      this.active = 0;
      this.cd = 0;
      const [pa, pb] = g.paths;
      // where the routes split
      let j = 0;
      while (j < pa.length && U.dist(pa.at(j).x, pa.at(j).y, pb.at(j).x, pb.at(j).y) < 6) j += 4;
      this.junction = j;
      this.bridges = f.bridges.map((b) => {
        const p = g.paths[b.path];
        const d = p.project(b.x, b.y);
        const q = p.at(d);
        const sp = g.add.image(q.x, q.y, 'mf_bridge_down').setScale(1 / S).setRotation(p.angleAt(d)).setDepth(984);
        return Object.assign({}, b, { d, sp, up: b.path !== this.active ? 1 : 0, x: q.x, y: q.y });
      });
      this.lever = g.add.image(f.x, f.y, 'mf_lever_0').setScale(1 / S).setOrigin(0.5, 0.85).setDepth(1000 + f.y + 20);
      clickable(g, this, this.lever, () => `${f.desc}\nOpen now: the ${this.active ? 'SOUTH' : 'NORTH'} route.`);
    }
    route() {
      return this.active;
    }
    // saved games remember which route is open
    save() {
      return { active: this.active };
    }
    load(o) {
      this.active = o.active ? 1 : 0;
      this.lever.setTexture('mf_lever_' + this.active);
      this.bridges.forEach((b) => (b.up = b.path !== this.active ? 1 : 0));
    }
    click() {
      const g = this.g;
      if (this.cd > 0) return notReady(g, this, 'The bridges are still moving!');
      this.cd = 1.2;
      this.active = 1 - this.active;
      // mutants that haven't reached the fork yet turn towards the open route
      const np = g.paths[this.active];
      for (const e of g.enemies) {
        if (!ground(e) || e.pathIndex === this.active || e.dist > this.junction - 12) continue;
        e.pathIndex = this.active;
        e.path = np;
        e.dist = np.project(e.x, e.y);
      }
      this.lever.setTexture('mf_lever_' + this.active);
      g.fx.floatText(this.f.x, this.f.y - 64, this.active ? 'SOUTH ROUTE!' : 'NORTH ROUTE!', '#69f0ae', 16);
      MT.Audio.play('clank');
      MT.Audio.play('click');
    }
    step(dt) {
      if (this.cd > 0) this.cd -= dt;
      const g = this.g;
      this.bridges.forEach((b) => {
        const closing = b.path !== this.active;
        // a bridge only goes up once nobody is still walking towards it
        let busy = false;
        if (closing) {
          for (const e of g.enemies) {
            if (ground(e) && e.pathIndex === b.path && e.dist >= this.junction - 12 && e.dist <= b.d + 30) {
              busy = true;
              break;
            }
          }
        }
        b.busy = busy;
        const goal = closing && !busy ? 1 : 0;
        b.up += U.clamp(goal - b.up, -dt * 2.5, dt * 2.5);
      });
    }
    render(dt, time, ui) {
      this.bridges.forEach((b) => {
        const up = b.up > 0.5;
        const key = up ? 'mf_bridge_up' : 'mf_bridge_down';
        if (b.sp.texture.key !== key) b.sp.setTexture(key);
        // squash while it swings
        const k = Math.abs(b.up - 0.5) * 2;
        b.sp.setScale(1 / S, (0.35 + 0.65 * k) / S);
        if (b.busy && Math.floor(time / 250) % 2) {
          ui.fillStyle(0xffd740, 0.9);
          ui.fillCircle(b.x, b.y - 30, 4);
        }
      });
      cooldownRing(ui, this.lever.x, this.lever.y - 22, 28, 0, time, this.active ? 0x40c4ff : 0x69f0ae);
    }
  }

  // ---------------------------------------------------------------- Vector's shark
  class Shark {
    constructor(g, f) {
      this.g = g;
      this.f = f;
      this.cd = 0;
      this.a = 0;
      this.busy = false;
      this.fin = g.add.image(f.x, f.y, 'mf_fin').setScale(1 / S).setDepth(985);
      this.btn = g.add.image(f.x, f.y + 58, 'mf_feed').setScale(1 / S).setDepth(1000 + f.y + 120);
      clickable(g, this, this.btn);
    }
    // the mutant to eat: the biggest one close to the moat
    pick() {
      const f = this.f;
      let best = null;
      for (const e of this.g.enemies) {
        if (!ground(e)) continue;
        if (Math.abs(U.dist(e.x, e.y, f.x, f.y) - f.r) > 170) continue;
        if (!best || e.def.rbe > best.def.rbe || (e.def.rbe === best.def.rbe && e.remaining < best.remaining)) best = e;
      }
      return best;
    }
    click() {
      const g = this.g, f = this.f;
      if (this.busy || this.cd > 0) return notReady(g, this);
      const e = this.pick();
      if (!e) return notReady(g, this, 'No mutants close enough to the moat!');
      this.cd = f.cd;
      this.busy = true;
      const a = Math.atan2(e.y - f.y, e.x - f.x);
      const sx = f.x + Math.cos(a) * f.r, sy = f.y + Math.sin(a) * f.r;
      const shark = g.add.image(sx, sy, 'mf_shark').setScale(0.6 / S).setDepth(6400).setFlipX(e.x < sx);
      this.fin.setVisible(false);
      g.fx.splat(sx, sy, 30, 0x4fc3f7);
      g.fx.water.explode(10, sx, sy);
      MT.Audio.play('splash');
      const st = { k: 0 };
      g.tweens.add({
        targets: st, k: 1, duration: 380, ease: 'Quad.easeOut',
        onUpdate: () => {
          const tx = e.dead ? sx : e.x, ty = e.dead ? sy : e.y;
          shark.setPosition(U.lerp(sx, tx, st.k), U.lerp(sy, ty, st.k) - Math.sin(st.k * Math.PI) * 60);
          shark.setScale((0.6 + st.k * 0.5) / S).setRotation((e.x < sx ? 1 : -1) * (0.6 - st.k * 0.9));
        },
        onComplete: () => {
          this.chomp(e);
          g.tweens.add({
            targets: shark, x: sx, y: sy, scale: 0.4 / S, duration: 340, ease: 'Quad.easeIn',
            onComplete: () => {
              shark.destroy();
              g.fx.splat(sx, sy, 34, 0x4fc3f7);
              g.fx.water.explode(12, sx, sy);
              MT.Audio.play('splash');
              this.fin.setVisible(true);
              this.busy = false;
            },
          });
        },
      });
    }
    chomp(e) {
      const g = this.g;
      if (e.dead) return;
      g.fx.floatText(e.x, e.y - 40, 'CHOMP!', '#ff5252', 22);
      g.shake(0.1);
      MT.Audio.play('bigpop', e.x);
      if (e.boss) {
        g.damageEnemy(e, 1500, null);
        e.tryStun(1);
        return;
      }
      // gulp it (and a few small ones around it) whole, children and all
      const meal = [e].concat(g.enemiesInRange(e.x, e.y, 46, true).filter((o) => o !== e && !o.boss && ground(o)).slice(0, 4));
      meal.forEach((o) => {
        if (o.dead) return;
        const v = MT.enemyRbe(o.type, o.fort);
        o.destroy();
        g.money += g.cashMul * v;
        g.totalPops += v;
        g.fx.pop(o.x, o.y, false);
      });
    }
    step(dt) {
      if (this.cd > 0) this.cd -= dt;
      this.a += dt * 0.7;
    }
    render(dt, time, ui) {
      const f = this.f;
      const x = f.x + Math.cos(this.a) * f.r, y = f.y + Math.sin(this.a) * f.r;
      this.fin.setPosition(x, y).setFlipX(Math.sin(this.a) > 0);
      cooldownRing(ui, this.btn.x, this.btn.y, 26, this.cd > 0 ? this.cd / f.cd : 0, time, 0x40c4ff);
    }
  }

  // ---------------------------------------------------------------- AVL recall tube
  class Tube {
    constructor(g, f) {
      this.g = g;
      this.f = f;
      this.cd = 0;
      this.on = 0;
      const p = g.paths[0];
      this.d = p.length * f.at;
      const q = p.at(this.d);
      this.x = q.x;
      this.y = q.y;
      this.sp = g.add.image(q.x, q.y, 'mf_tube').setScale(1 / S).setDepth(985);
      this.taken = new Set();
      clickable(g, this, this.sp);
    }
    click() {
      if (this.on > 0 || this.cd > 0) return notReady(this.g, this);
      this.on = this.f.dur;
      this.cd = this.f.cd;
      this.taken.clear();
      this.n = 0;
      this.sp.setTexture('mf_tube_on');
      this.g.fx.ring(this.x, this.y, 60, 0x18ffff, { dur: 400 });
      MT.Audio.play('charge');
    }
    step(dt) {
      if (this.cd > 0) this.cd -= dt;
      if (this.on <= 0) return;
      const g = this.g;
      this.on -= dt;
      if (this.on <= 0) this.sp.setTexture('mf_tube');
      for (const e of g.queryEnemies(this.x, this.y, 60)) {
        if (!ground(e) || this.taken.has(e.id) || U.dist2(this.x, this.y, e.x, e.y) > (30 + e.radius * 0.5) ** 2) continue;
        if (e.boss) {
          e.auraMul = Math.min(e.auraMul, 0.5);
          continue;
        }
        if (this.n >= 30) continue;
        this.taken.add(e.id);
        this.n++;
        // whoosh: back to the start of the track
        const ghost = g.add.image(e.x, e.y, e.sprite.texture.key).setOrigin(e.sprite.originX, e.sprite.originY).setScale(1 / S).setDepth(e.sprite.depth + 1);
        g.tweens.add({ targets: ghost, x: this.x, y: this.y, scale: 0.1 / S, angle: 360, alpha: 0.4, duration: 260, onComplete: () => ghost.destroy() });
        e.dist = 0;
        e.stun = Math.max(e.stun, 0.5);
        const start = e.path.at(24);
        g.fx.ring(start.x, start.y, 30, 0x18ffff, { dur: 300 });
        MT.Audio.play('swoosh');
      }
    }
    render(dt, time, ui) {
      if (this.on > 0) this.sp.rotation -= dt * 6;
      else this.sp.rotation *= 0.9;
      cooldownRing(ui, this.x, this.y, 44, this.cd > 0 && this.on <= 0 ? this.cd / this.f.cd : 0, time, 0x18ffff);
    }
  }

  // ---------------------------------------------------------------- bubble vents
  class Vent {
    constructor(g, f) {
      this.g = g;
      this.f = f;
      const p = g.paths[0];
      const q = p.at(p.length * f.at);
      this.x = q.x;
      this.y = q.y;
      this.t = f.offset || 0;
      this.on = 0;
      this.sp = g.add.image(q.x, q.y, 'mf_vent').setScale(1 / S).setDepth(984);
      // hover for info (the vents work on their own)
      this.sp.setInteractive();
      this.sp.on('pointerover', () => g.hud.tip.show(q.x + 30, q.y - 50, f.name, f.desc));
      this.sp.on('pointerout', () => g.hud.tip.hide());
    }
    step(dt) {
      const g = this.g, f = this.f;
      this.t += dt;
      if (this.on <= 0 && this.t >= f.every) {
        this.t = 0;
        this.on = f.dur;
        MT.Audio.play('splash', this.x);
      }
      if (this.on <= 0) return;
      this.on -= dt;
      for (const e of g.queryEnemies(this.x, this.y, 60)) {
        if (!ground(e) || U.dist2(this.x, this.y, e.x, e.y) > (34 + e.radius * 0.5) ** 2) continue;
        if (e.camo) {
          e.camo = false;
          e.sprite.setTexture(e.texKey()).setAlpha(1);
          g.fx.sparkle(e.x, e.y - e.radius, 0x80deea);
        }
        e.applySlow(e.boss ? 0.8 : 0.65, 0.6, false, false, 'wet');
      }
    }
    render(dt) {
      if (this.on > 0 && Math.random() < dt * 26) {
        const b = this.g.add.image(this.x + U.rand(-16, 16), this.y, 'mf_bubble').setScale(U.rand(0.6, 1.3) / S).setDepth(5200);
        this.g.tweens.add({ targets: b, y: this.y - U.rand(50, 110), x: b.x + U.rand(-12, 12), alpha: 0, duration: U.rand(600, 1000), onComplete: () => b.destroy() });
      }
    }
  }

  // ---------------------------------------------------------------- bank lasers
  class Lasers {
    constructor(g, f) {
      this.g = g;
      this.f = f;
      this.cd = 0;
      this.on = 0;
      this.tick = 0;
      const p = g.paths[0];
      const half = g.mapDef.pathWidth / 2 + 12;
      this.gates = f.gates.map((k) => {
        const d = p.length * k;
        const q = p.at(d), a = p.angleAt(d) + Math.PI / 2;
        const ax = q.x + Math.cos(a) * half, ay = q.y + Math.sin(a) * half;
        const bx = q.x - Math.cos(a) * half, by = q.y - Math.sin(a) * half;
        [[ax, ay], [bx, by]].forEach(([x, y]) => g.add.image(x, y, 'mf_laserpost').setScale(1 / S).setOrigin(0.5, 0.8).setDepth(1000 + y));
        return { ax, ay: ay - 4, bx, by: by - 4, x: q.x, y: q.y };
      });
      this.panel = g.add.image(f.x, f.y, 'mf_panel').setScale(1 / S).setOrigin(0.5, 0.85).setDepth(1000 + f.y + 20);
      clickable(g, this, this.panel);
    }
    click() {
      if (this.on > 0 || this.cd > 0) return notReady(this.g, this);
      this.on = this.f.dur;
      this.cd = this.f.cd;
      this.g.fx.floatText(this.f.x, this.f.y - 60, 'ALARM!', '#ff5252', 18);
      MT.Audio.play('warning');
    }
    step(dt) {
      if (this.cd > 0) this.cd -= dt;
      if (this.on <= 0) return;
      const g = this.g;
      this.on -= dt;
      this.tick -= dt;
      if (this.tick > 0) return;
      this.tick = 0.2;
      this.gates.forEach((gt) => {
        let zapped = false;
        for (const e of g.queryEnemies(gt.x, gt.y, 70)) {
          if (!ground(e)) continue;
          // distance from the mutant to the laser line
          const vx = gt.bx - gt.ax, vy = gt.by - gt.ay;
          const t = U.clamp(((e.x - gt.ax) * vx + (e.y - gt.ay) * vy) / (vx * vx + vy * vy), 0, 1);
          if (U.dist(e.x, e.y, gt.ax + vx * t, gt.ay + vy * t) > 10 + e.radius * 0.5) continue;
          g.applyHit(e, { dmg: 2, moabDmg: 30, type: 'energy', decamo: true, ground: true }, null);
          zapped = true;
        }
        if (zapped) {
          g.fx.sparks.explode(2, gt.x, gt.y);
          MT.Audio.play('zap', gt.x);
        }
      });
    }
    render(dt, time, ui) {
      if (this.on > 0) {
        const flick = 0.7 + 0.3 * Math.sin(time * 0.05);
        this.gates.forEach((gt) => {
          ui.lineStyle(7, 0xff1744, 0.25 * flick);
          ui.lineBetween(gt.ax, gt.ay, gt.bx, gt.by);
          ui.lineStyle(2.4, 0xff5252, flick);
          ui.lineBetween(gt.ax, gt.ay, gt.bx, gt.by);
          ui.lineStyle(1, 0xffffff, 0.9);
          ui.lineBetween(gt.ax, gt.ay, gt.bx, gt.by);
        });
      }
      cooldownRing(ui, this.panel.x, this.panel.y - 22, 28, this.cd > 0 && this.on <= 0 ? this.cd / this.f.cd : 0, time, 0xff5252);
    }
  }

  // ---------------------------------------------------------------- loan desk
  class Loan {
    constructor(g, f) {
      this.g = g;
      this.f = f;
      this.debt = 0;
      this.sign = g.add.image(f.x, f.y - 50, 'mf_loan').setScale(1 / S).setDepth(1000 + f.y + 30);
      this.label = MT.text(g, f.x, f.y - 76, '', 12, { color: '#b8ffb0', strokeThickness: 3 }).setDepth(UI_DEPTH + 1);
      clickable(g, this, this.sign, () => f.desc + (this.debt > 0
        ? `\nYou still owe ${U.money(this.debt)}. Pay it back before the next loan.`
        : `\nLoan now: ${U.money(this.amount())}, you pay back ${U.money(Math.ceil(this.amount() * 1.25))}.`));
    }
    amount() {
      return U.round5(Math.min(8000, 400 + this.g.round * 90));
    }
    save() {
      return { debt: this.debt };
    }
    load(o) {
      this.debt = o.debt || 0;
    }
    click() {
      const g = this.g;
      if (g.sandbox) return notReady(g, this, 'Bananas are free in the Sandbox!');
      if (this.debt > 0) return notReady(g, this, `Pay back your loan first! You owe ${U.money(this.debt)}.`);
      const v = this.amount();
      g.money += v;
      this.debt = Math.ceil(v * 1.25);
      g.fx.floatText(this.f.x, this.f.y - 90, '+' + U.money(v), '#7CFF6B', 22);
      g.hud.flashMoney();
      MT.Audio.play('coin');
    }
    // half of every round's bananas go to the bank until the loan is paid off
    roundEnd(income) {
      if (this.debt <= 0) return 0;
      const pay = Math.min(this.debt, Math.floor(income * 0.5));
      this.debt -= pay;
      this.g.fx.floatText(this.f.x, this.f.y - 90, `-${U.money(pay)} to the bank`, '#ff8a80', 16);
      return pay;
    }
    render(dt, time, ui) {
      const txt = this.debt > 0 ? `Owe ${U.money(this.debt)}` : 'LOANS';
      if (this.label.text !== txt) this.label.setText(txt).setColor(this.debt > 0 ? '#ff8a80' : '#b8ffb0');
      this.label.setVisible(this.debt > 0);
      // glows while a loan is available
      if (this.debt <= 0 && !this.g.sandbox) {
        const k = 0.5 + 0.5 * Math.sin(time * 0.006);
        ui.lineStyle(3, 0x69f0ae, 0.4 + 0.5 * k);
        ui.strokeRoundedRect(this.sign.x - 40, this.sign.y - 17, 80, 34, 9);
      }
    }
  }

  const KINDS = { coaster: Coaster, spinner: Spinner, drawbridge: Drawbridge, shark: Shark, tube: Tube, vent: Vent, lasergrid: Lasers, loan: Loan };

  class MapFX {
    constructor(g) {
      this.g = g;
      MT.MapArt.fxTextures(g);
      this.items = g.mapDef.features.map((f) => new KINDS[f.type](g, f));
      this.ui = g.add.graphics().setDepth(UI_DEPTH);
    }
    step(dt) {
      for (const it of this.items) if (it.step) it.step(dt);
    }
    render(dt, time) {
      this.ui.clear();
      for (const it of this.items) if (it.render) it.render(dt, time, this.ui);
    }
    // state for saved games (open drawbridge, unpaid loan)
    saveState() {
      return this.items.map((it) => (it.save ? it.save() : null));
    }
    loadState(list) {
      (list || []).forEach((s, i) => s && this.items[i] && this.items[i].load && this.items[i].load(s));
    }
    // the route a freshly spawned mutant takes
    route(o) {
      for (const it of this.items) if (it.route) return it.route(o);
      return o.path;
    }
    roundEnd(income) {
      let take = 0;
      for (const it of this.items) if (it.roundEnd) take += it.roundEnd(income);
      return take;
    }
  }

  MT.MapFX = {
    create(g) {
      return g.mapDef.features && g.mapDef.features.length ? new MapFX(g) : null;
    },
    KINDS,
  };
})();
