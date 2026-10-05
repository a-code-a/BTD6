// The in-game scene: world simulation, input, placement and round flow.
(function () {
  const U = MT.util;
  const CFG = MT.CFG;
  const S = MT.Draw.S;
  const TARGET_MODES = ['First', 'Last', 'Close', 'Strong'];
  const CELL = 80, GOX = 120, GOY = 120;
  const GCOLS = Math.ceil((CFG.MAP_W + GOX * 2) / CELL), GROWS = Math.ceil((CFG.H + GOY * 2) / CELL);
  // screen shake: maximum offset in logical px at full trauma, and how fast it fades
  const SHAKE_PX = 6;
  const SHAKE_DECAY = 1.6;

  class GameScene extends Phaser.Scene {
    constructor() {
      super('Game');
    }

    init(data) {
      this.mapDef = MT.MAPS.find((m) => m.id === data.map) || MT.MAPS[0];
      this.diff = MT.DIFFS[data.diff] || MT.DIFFS.medium;
      const hero = data.hero || MT.Save.settings().hero;
      this.heroId = MT.HEROES[hero] ? hero : 'gru';
      this.heroDef = MT.HEROES[this.heroId];
    }

    create() {
      const cam = MT.setupCamera(this);
      this.camBase = { x: cam.scrollX, y: cam.scrollY };
      this.trauma = 0;
      this.slowmo = 0;
      this.uid = 0;
      this.paths = this.mapDef.paths.map((p) => new MT.Path(p));
      this.layout = MT.MapArt.layout(this.mapDef, this.paths);
      this.add.image(0, 0, MT.MapArt.texture(this, this.mapDef, this.paths)).setOrigin(0).setScale(1 / S).setDepth(-100);
      MT.MapArt.overlays(this, this.mapDef, this.paths).forEach((o) => {
        this.add.image(o.x, o.y, o.key).setOrigin(o.ox, o.oy).setScale(1 / S).setDepth(1000 + o.y + 80);
      });

      this.enemies = [];
      this.towers = [];
      this.projectiles = [];
      this.pickups = [];
      this.timed = [];
      this.runners = [];
      this.biters = [];
      this.seenBoss = {};
      this.fusionHinted = {};
      this.money = CFG.START_CASH;
      this.lives = this.diff.lives;
      this.round = 0;
      this.roundActive = false;
      this.speed = 1;
      this.paused = false;
      this.over = false;
      this.freeplay = false;
      this.won = false;
      this.spawnList = [];
      this.spawnIdx = 0;
      this.roundTime = 0;
      this.spawnCounter = 0;
      this.scaling = { speed: 1, hp: 1 };
      this.cashMul = 1;
      this.totalPops = 0;
      this.heroPlaced = false;
      this.placing = null;
      this.selected = null;
      this.fuseHover = null;
      this.pointer = { x: -100, y: -100 };
      this.grid = Array.from({ length: GCOLS * GROWS }, () => []);
      this.originCache = {};

      this.fx = new MT.Effects(this);
      this.gBars = this.add.graphics().setDepth(5000);
      this.gRange = this.add.graphics().setDepth(2900);
      this.gTop = this.add.graphics().setDepth(7000);
      this.ghost = this.add.image(0, 0, MT.TowerArt.key(this, 'banana', [0, 0, 0])).setScale(1 / S).setAlpha(0.75).setVisible(false).setDepth(5900);

      this.hud = new MT.HUD(this);
      this.setupInput();
      this.cameras.main.fadeIn(350, 20, 30, 50);
      this.hud.toast('Place some minions, then press PLAY!', 3200);
      window.__mt = this;
      this.events.once('shutdown', () => {
        if (window.__mt === this) window.__mt = null;
        this.input.keyboard.removeAllListeners();
      });
    }

    // ------------------------------------------------------------------ helpers
    enemyOrigin(type) {
      if (this.originCache[type] == null) {
        const sp = MT.EnemyArt.SPEC[type];
        const { th, foot } = MT.EnemyArt.texSize(sp);
        this.originCache[type] = sp.blimp ? 66 / th : (foot - sp.h * 0.69) / th;
      }
      return this.originCache[type];
    }

    price(base, x, y) {
      let v = base * this.diff.price;
      if (x != null) v *= 1 - this.discountAt(x, y);
      return U.round5(v);
    }

    discountAt(x, y) {
      let d = 0;
      for (const t of this.towers) {
        const b = t.stats.buff;
        if (t.type === 'lab' && b && b.discount && U.dist(x, y, t.x, t.y) <= t.stats.range) d = Math.max(d, b.discount);
      }
      return d;
    }

    defOf(type) {
      return MT.HEROES[type] || MT.TOWERS[type];
    }

    placeCost(type, x, y) {
      return this.price(this.defOf(type).cost, x, y);
    }

    addMoney(v) {
      this.money += v;
    }

    cheatMoney() {
      if (this.over) return;
      this.money += CFG.CHEAT_MONEY;
      MT.Audio.play('coin');
      this.hud.toast(`CHEAT: +${U.money(CFG.CHEAT_MONEY)} bananas!`, 1600);
      this.hud.flashMoney();
    }

    // Gentle, capped screen shake. Amounts add up but never exceed a few pixels,
    // and the player can turn it down or off in the pause menu.
    shake(amount) {
      const mode = MT.Save.settings().shake;
      if (mode === 'off') return;
      const k = mode === 'low' ? 0.45 : 1;
      this.trauma = Math.min(1, this.trauma + amount * k);
    }

    canPlace(x, y, size) {
      if (x < size * 0.7 || x > CFG.MAP_W - size * 0.7 || y < size * 0.7 || y > CFG.H - size * 0.7) return false;
      const pw = this.mapDef.pathWidth / 2;
      for (const p of this.paths) if (p.distTo(x, y) < pw + size * 0.8) return false;
      for (const b of this.layout.blockers) if (U.dist(x, y, b.x, b.y) < b.r + size * 0.55) return false;
      for (const wa of this.layout.water) if (MT.MapArt.waterDist(wa, x, y) < size * 0.5) return false;
      for (const t of this.towers) if (U.dist(x, y, t.x, t.y) < t.size + size - 6) return false;
      return true;
    }

    towerAt(x, y) {
      let best = null, bd = 1e9;
      for (const t of this.towers) {
        const d = Math.min(U.dist(x, y, t.x, t.y), U.dist(x, y, t.x, t.y - 16));
        if (d < t.size + 10 && d < bd) {
          bd = d;
          best = t;
        }
      }
      return best;
    }

    // ------------------------------------------------------------------ input
    setupInput() {
      this.input.on('pointermove', (p) => {
        this.pointer.x = p.worldX;
        this.pointer.y = p.worldY;
      });
      this.input.on('pointerdown', (p, over) => {
        MT.Audio.init();
        this.pointer.x = p.worldX;
        this.pointer.y = p.worldY;
        if (this.over || this.paused) return;
        if (p.rightButtonDown()) {
          this.cancelPlacing();
          this.select(null);
          return;
        }
        if (over.length) return;
        const x = p.worldX, y = p.worldY;
        if (x >= CFG.MAP_W) return;
        if (this.placing) {
          this.tryPlace(x, y);
          return;
        }
        this.select(this.towerAt(x, y));
      });
      const kb = this.input.keyboard;
      this.shiftKey = kb.addKey('SHIFT', false);
      kb.on('keydown', (ev) => {
        MT.Audio.init();
        if (this.over) return;
        const k = ev.key;
        if (k === 'Escape') {
          if (this.placing) this.cancelPlacing();
          else if (this.selected) this.select(null);
          else this.hud.togglePause();
          return;
        }
        if (this.paused) return;
        if (k === ' ') {
          ev.preventDefault && ev.preventDefault();
          this.playButton();
          return;
        }
        const up = k.toUpperCase();
        if (up === this.heroDef.key) return this.startPlacing(this.heroId);
        for (const id of MT.TOWER_ORDER) if (MT.TOWERS[id].key === up) return this.startPlacing(id);
        if (this.selected) {
          if (k === ',') this.buyUpgrade(this.selected, 0);
          if (k === '.') this.buyUpgrade(this.selected, 1);
          if (k === '/') this.buyUpgrade(this.selected, 2);
          if (up === 'F') MT.Fusion.fuse(this, this.selected);
          if (k === 'Tab') {
            ev.preventDefault && ev.preventDefault();
            this.cycleTarget(this.selected, 1);
          }
          if (k === 'Backspace' || k === 'Delete') this.sell(this.selected);
        }
      });
    }

    startPlacing(type) {
      if (this.over) return;
      const hero = MT.isHero(type);
      if (hero && this.heroPlaced) {
        this.hud.toast(this.heroDef.name + ' is already on the map!');
        MT.Audio.play('error');
        return;
      }
      const cost = this.placeCost(type);
      if (cost > this.money) {
        this.hud.toast('Not enough bananas!');
        MT.Audio.play('error');
        return;
      }
      this.select(null);
      this.placing = { type };
      const key = hero ? MT.TowerArt.heroKey(this, type, 1) : MT.TowerArt.key(this, type, [0, 0, 0]);
      this.ghost.setTexture(key).setOrigin(0.5, hero ? 64 / 110 : type === 'farm' || type === 'lab' ? 58 / 92 : 49 / 92).setVisible(true);
      this.hud.setPlacing(type);
    }

    cancelPlacing() {
      this.placing = null;
      this.ghost.setVisible(false);
      this.hud.setPlacing(null);
    }

    tryPlace(x, y) {
      if (!this.placing) return;
      const type = this.placing.type;
      const hero = MT.isHero(type);
      const def = this.defOf(type);
      const cost = this.placeCost(type, x, y);
      if (!this.canPlace(x, y, def.size)) {
        MT.Audio.play('error');
        this.hud.toast("Can't place that there!", 1200);
        return;
      }
      if (cost > this.money) {
        MT.Audio.play('error');
        this.hud.toast('Not enough bananas!', 1200);
        return;
      }
      this.money -= cost;
      const t = new MT.Tower(this, type, x, y, hero);
      t.spent = cost;
      this.towers.push(t);
      if (hero) this.heroPlaced = true;
      this.recalcBuffs();
      this.fx.dust.explode(10, x, y + 14);
      MT.Audio.play(hero ? 'bello' : 'place');
      const lines = hero ? def.quotes : type === 'farm' || type === 'lab' ? null : ['Bello!', 'Banana!', 'Bee-do!', 'Tank yu!', 'Poopaye!', 'Tulaliloo!', 'Bapples!'];
      if (lines) this.fx.speech(x, y - (hero ? 70 : 54), U.pick(lines));
      const shift = this.shiftKey && this.shiftKey.isDown;
      if (!shift || hero || this.placeCost(type) > this.money) this.cancelPlacing();
      this.hud.onTowersChanged();
    }

    select(t) {
      if (this.placing && t) this.cancelPlacing();
      this.selected = t;
      this.fuseHover = null;
      if (t) {
        MT.Audio.play('click');
        this.hud.showTower(t);
      } else this.hud.showShop();
    }

    buyUpgrade(t, pi) {
      if (t.hero || t.fused) return;
      const state = t.pathState(pi);
      if (state !== 'open') {
        MT.Audio.play('error');
        return;
      }
      const cost = t.upgradeCost(pi);
      if (cost > this.money) {
        MT.Audio.play('error');
        this.hud.toast('Not enough bananas!', 1200);
        return;
      }
      this.money -= cost;
      t.spent += cost;
      t.tiers[pi]++;
      t.recompute();
      t.refreshTexture();
      this.recalcBuffs();
      this.fx.sparks.explode(14, t.x, t.y - 10);
      this.fx.ring(t.x, t.y, 50, 0xffd83a, { dur: 400 });
      MT.Audio.play('upgrade');
      if (t.type !== 'farm' && t.type !== 'lab') this.fx.speech(t.x, t.y - 54, U.pick(['Bee-do bee-do!', 'Kanpai!', 'Whaaa!', 'Gelato!', 'Bananaaa!']));
      if (t.tiers[pi] === 4) {
        this.fx.ring(t.x, t.y, 90, 0xffffff, { dur: 600, force: true });
        MT.Fusion.checkHint(this, t.type);
      }
      this.hud.showTower(t);
      this.hud.onTowersChanged();
    }

    heroLevelCost(t) {
      if (t.level >= 10) return 0;
      return U.round5((MT.HERO_XP[t.level] - t.xp) * 2 * this.diff.price);
    }

    buyHeroLevel(t) {
      const cost = this.heroLevelCost(t);
      if (!cost || cost > this.money) {
        MT.Audio.play('error');
        return;
      }
      this.money -= cost;
      t.spent += Math.floor(cost * 0.5);
      this.gainHeroXp(t, MT.HERO_XP[t.level] - t.xp);
    }

    gainHeroXp(t, amount) {
      t.xp += amount;
      let leveled = false;
      while (t.level < 10 && t.xp >= MT.HERO_XP[t.level]) {
        t.level++;
        leveled = true;
      }
      if (leveled) {
        t.recompute();
        t.refreshTexture();
        this.recalcBuffs();
        const col = U.hexInt(t.def.color || '#7fdbff');
        this.fx.ring(t.x, t.y, 60, col, { dur: 500 });
        this.fx.sparks.explode(18, t.x, t.y - 20);
        this.fx.floatText(t.x, t.y - 50, 'LEVEL ' + t.level + '!', t.def.color || '#7fdbff', 20);
        MT.Audio.play('upgrade');
        this.hud.onTowersChanged();
      }
      if (this.selected === t) this.hud.showTower(t);
    }

    sell(t) {
      const v = t.sellValue();
      this.money += v;
      t.destroy();
      this.towers = this.towers.filter((x) => x !== t);
      if (t.hero) this.heroPlaced = false;
      this.fx.dust.explode(12, t.x, t.y);
      this.fx.floatText(t.x, t.y - 20, '+' + U.money(v));
      MT.Audio.play('sell');
      this.recalcBuffs();
      this.select(null);
      this.hud.onTowersChanged();
    }

    cycleTarget(t, dir) {
      t.targetMode = (t.targetMode + dir + TARGET_MODES.length) % TARGET_MODES.length;
      this.hud.showTower(t);
    }

    recalcBuffs() {
      const supports = this.towers.filter((t) => t.stats.buff);
      for (const t of this.towers) {
        const isAttacker = t.baseStats.attack !== 'none';
        let b = null;
        if (isAttacker) {
          for (const s of supports) {
            if (s === t) continue;
            if (s.hero && (t.type === 'farm' || t.type === 'lab')) continue;
            const r = s.stats.buffRange || s.stats.range;
            if (U.dist(s.x, s.y, t.x, t.y) > r) continue;
            const sb = s.stats.buff;
            b = b || { range: 0, rate: 0, pierce: 0, camo: false, armored: false };
            b.range = Math.max(b.range, sb.range || 0);
            b.rate = Math.max(b.rate, sb.rate || 0);
            b.pierce = Math.max(b.pierce, sb.pierce || 0);
            b.camo = b.camo || !!sb.camo;
            b.armored = b.armored || !!sb.armored;
          }
        }
        t.buffs = b;
        t.applyBuffs();
      }
    }

    // ------------------------------------------------------------------ rounds
    playButton() {
      MT.Audio.init();
      if (this.over) return;
      if (!this.roundActive) this.startRound();
      else {
        this.speed = this.speed === 1 ? CFG.FAST_SPEED : 1;
        this.hud.onRoundState();
      }
    }

    startRound() {
      if (this.roundActive || this.over) return;
      this.round++;
      this.roundActive = true;
      this.roundTime = 0;
      this.spawnIdx = 0;
      this.spawnList = MT.Rounds.spawns(this.round);
      this.scaling = MT.Rounds.scaling(this.round);
      this.cashMul = MT.Rounds.cashMul(this.round);
      const dur = Math.max(8, (this.spawnList.length ? this.spawnList[this.spawnList.length - 1].t : 0) + 6);
      for (const t of this.towers) {
        if (t.type !== 'farm') continue;
        const n = t.stats.bananas;
        t.bananaTimes = [];
        for (let i = 0; i < n; i++) t.bananaTimes.push(((i + 0.5) / n) * dur);
      }
      const head = MT.Rounds.headline(this.round);
      this.hud.toast(head || 'Round ' + this.round, head ? 2600 : 1400, !!head);
      MT.Audio.play('roundStart');
      this.hud.onRoundState();
    }

    endRound() {
      this.roundActive = false;
      const bonus = 100 + this.round;
      let income = bonus;
      for (const t of this.towers) if (t.stats.flat) income += t.stats.flat;
      this.money += income;
      this.collectAllPickups();
      const hero = this.towers.find((t) => t.hero);
      if (hero) this.gainHeroXp(hero, 20 + this.round * 8);
      for (const t of this.towers) t.bananaTimes = null;
      MT.Audio.play('roundEnd');
      this.hud.toast(`Round ${this.round} complete!  +${U.money(income)}`, 1800);
      if (!this.freeplay && !this.won && this.round >= this.diff.rounds) {
        this.won = true;
        this.victory();
        return;
      }
      this.hud.onRoundState();
      if (MT.Save.settings().autoStart) this.time.delayedCall(400, () => !this.over && !this.paused && this.startRound());
    }

    victory() {
      MT.Save.award(this.mapDef.id, this.diff.id);
      MT.Save.addStats(this.totalPops);
      MT.Audio.play('victory');
      this.over = true;
      this.hud.showVictory();
    }

    continueFreeplay() {
      this.over = false;
      this.freeplay = true;
      this.hud.hideOverlay();
      this.hud.onRoundState();
    }

    defeat() {
      if (this.over) return;
      this.over = true;
      this.lives = 0;
      MT.Save.addStats(this.totalPops);
      MT.Audio.play('defeat');
      this.hud.showDefeat();
    }

    leak(e) {
      const cost = Math.max(1, Math.ceil(MT.enemyRbe(e.type, e.fort) - (e.maxHp - e.hp)));
      this.lives -= cost;
      e.leaked = true;
      e.destroy();
      MT.Audio.play('leak');
      this.fx.vignette(0xff2020, e.boss ? 0.55 : 0.32, e.boss ? 600 : 300);
      if (this.lives <= 0) this.defeat();
    }

    // ------------------------------------------------------------------ combat
    rebuildGrid() {
      const g = this.grid;
      for (let i = 0; i < g.length; i++) g[i].length = 0;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const cx = U.clamp(Math.floor((e.x + GOX) / CELL), 0, GCOLS - 1);
        const cy = U.clamp(Math.floor((e.y + GOY) / CELL), 0, GROWS - 1);
        g[cx + cy * GCOLS].push(e);
      }
    }

    queryEnemies(x, y, r) {
      const out = [];
      const x0 = U.clamp(Math.floor((x - r + GOX) / CELL), 0, GCOLS - 1), x1 = U.clamp(Math.floor((x + r + GOX) / CELL), 0, GCOLS - 1);
      const y0 = U.clamp(Math.floor((y - r + GOY) / CELL), 0, GROWS - 1), y1 = U.clamp(Math.floor((y + r + GOY) / CELL), 0, GROWS - 1);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
        const cell = this.grid[cx + cy * GCOLS];
        for (let i = 0; i < cell.length; i++) out.push(cell[i]);
      }
      return out;
    }

    findTarget(t) {
      return this.findTargetFrom(t, t.x, t.y, t.stats.range);
    }

    // best enemy for tower t (respecting its targeting mode) around a point
    findTargetFrom(t, x, y, range) {
      const s = t.stats;
      const mode = TARGET_MODES[t.targetMode];
      let best = null, bestScore = -Infinity;
      for (const e of this.enemies) {
        if (e.dead || (e.camo && !s.camo)) continue;
        const rr = range + e.radius * 0.6;
        const d2 = U.dist2(x, y, e.x, e.y);
        if (d2 > rr * rr) continue;
        let score;
        if (mode === 'First') score = -e.remaining;
        else if (mode === 'Last') score = e.remaining;
        else if (mode === 'Close') score = -d2;
        else score = e.def.rbe * 1000 + e.hp - e.remaining * 0.001;
        if (s.preferBoss && e.boss) score += 1e12;
        if (s.preferUnslowed && e.slowT <= 0) score += 1e12;
        if (score > bestScore) {
          bestScore = score;
          best = e;
        }
      }
      return best;
    }

    nearestEnemy(x, y, r, camo, exclude) {
      let best = null, bd = r * r;
      for (const e of this.enemies) {
        if (e.dead || (e.camo && !camo) || (exclude && exclude.has(e.id))) continue;
        const d = U.dist2(x, y, e.x, e.y);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      return best;
    }

    addProjectile(p) {
      this.projectiles.push(p);
    }

    // apply a hit with all the projectile's status effects; returns spawned
    // children, or null if the hit was blocked by armor
    applyHit(e, p, tower, dmgOverride) {
      if (e.dead) return null;
      const harmful = p.type === 'sharp' || p.type === 'cold';
      if (e.def.armored && harmful && !p.armored && !(tower && tower.buffArmored)) {
        this.fx.clank(e.x, e.y);
        MT.Audio.play('clank');
        return null;
      }
      if (p.slow && (!e.boss || p.slow.moab)) {
        const strong = tower && ((tower.type === 'jelly' && tower.tiers[2] >= 4) || tower.fused);
        const mul = e.boss ? Math.max(p.slow.mul, strong ? 0.5 : 0.7) : p.slow.mul;
        e.applySlow(mul, p.slow.dur, p.slow.soak, tower && tower.type === 'jelly' && (tower.tiers[0] >= 1 || tower.fused));
      }
      if (p.dot && (!e.boss || !p.slow || p.slow.moab)) e.applyDot(p.dot, tower);
      if (p.freeze) {
        if (!e.boss) {
          e.freeze = Math.max(e.freeze, p.freeze.dur);
          e.brittle = !!p.brittle;
        } else if (p.freeze.moab) e.tryStun(p.freeze.moab);
      }
      if (p.stun) {
        if (!e.boss) e.stun = Math.max(e.stun, p.stun.dur);
        else if (p.stun.moab) e.tryStun(p.stun.dur * 0.6);
      }
      if (p.knock && !e.boss) e.dist = Math.max(0, e.dist - p.knock * 3);
      let d = dmgOverride != null ? dmgOverride : p.dmg;
      if (e.boss) d += p.moabDmg || 0;
      if (e.type === 'brute') d += p.bruteDmg || 0;
      if (d > 0 && e.freeze > 0 && e.brittle) d += 1;
      if (d <= 0) return [];
      return this.damageEnemy(e, d, tower);
    }

    damageEnemy(e, d, tower) {
      if (e.dead) return [];
      e.hp -= d;
      if (e.hp > 0) {
        e.setDamageState();
        if (e.boss) {
          e.onHurt();
          if (e.def.phases) MT.Bosses.checkPhase(this, e);
        }
        return [];
      }
      const overflow = -e.hp;
      this.popEnemy(e, tower);
      const kids = this.spawnChildren(e);
      if (overflow > 0 && kids.length) {
        const first = kids[0];
        const sub = this.damageEnemy(first, overflow, tower);
        if (first.dead) kids.splice(0, 1, ...sub);
      }
      return kids;
    }

    popEnemy(e, tower) {
      e.destroy();
      this.money += this.cashMul;
      this.totalPops++;
      if (tower) tower.pops++;
      if (e.boss) MT.Bosses.death(this, e);
      else this.fx.pop(e.x, e.y, false);
      MT.Audio.play(e.boss ? 'bigpop' : 'pop');
    }

    spawnChildren(e) {
      const kids = [];
      const n = e.def.children.length;
      e.def.children.forEach((type, i) => {
        const off = (i - (n - 1) / 2) * (e.boss ? 16 : 6);
        const k = new MT.Enemy(this, type, { path: e.pathIndex, dist: Math.max(0, e.dist + off), camo: e.camo, burst: e.boss });
        if (e.slowSoak && e.slowT > 0) {
          k.applySlow(e.slowMul, e.slowT, true, e.slowAcid);
          if (e.dot) k.dot = Object.assign({}, e.dot);
        }
        this.enemies.push(k);
        kids.push(k);
        if (k.boss) MT.Bosses.onSpawn(this, k);
      });
      return kids;
    }

    explode(x, y, p, tower, hitSet) {
      const ex = p.explode;
      const cand = this.queryEnemies(x, y, ex.r + 60);
      const list = [];
      for (const e of cand) {
        if (e.dead) continue;
        const rr = ex.r + e.radius * 0.5;
        const d2 = U.dist2(x, y, e.x, e.y);
        if (d2 <= rr * rr) list.push([d2, e]);
      }
      list.sort((a, b) => a[0] - b[0]);
      const ep = Object.assign({}, p, { dmg: ex.dmg, explode: null });
      const n = Math.min(ex.pierce, list.length);
      for (let i = 0; i < n; i++) {
        const kids = this.applyHit(list[i][1], ep, tower);
        if (hitSet && kids) kids.forEach((k) => hitSet.add(k.id));
      }
      if (p.quiet) {
        // the caller draws its own effect (lightning strikes, ...)
      } else if (p.tex === 'p_ice') {
        this.fx.ring(x, y, ex.r, 0x9fe6ff, { disc: true, dur: 300 });
        this.fx.snow.explode(8, x, y);
        MT.Audio.play('freeze');
      } else if (p.tex === 'p_jelly' || p.tex === 'p_jelly_acid') {
        this.fx.goo.explode(8, x, y);
        if (ex.r > 50) this.fx.ring(x, y, ex.r, 0x9be15d, { disc: true, dur: 260 });
      } else if (p.tex === 'p_goo') {
        this.fx.splat(x, y, ex.r, 0x8bdc3a);
        MT.Audio.play('splat');
      } else if (p.tex === 'p_squid') {
        this.fx.splat(x, y, ex.r, 0x3b2f5c);
        MT.Audio.play('splat');
      } else {
        this.fx.boom(x, y, ex.r);
        MT.Audio.play('boom');
      }
      if (p.cluster) {
        const c = p.cluster;
        for (let i = 0; i < c.n; i++) {
          const a = (i / c.n) * Math.PI * 2;
          const bp = { tex: 'p_minibomb', speed: 230, dmg: 0, pierce: 1, type: 'explosive', r: 5, explode: { r: c.r, dmg: c.dmg, pierce: c.pierce }, moabDmg: Math.floor((p.moabDmg || 0) / 4) };
          this.addProjectile(new MT.Projectile(this, tower, x, y, a, bp, { life: 0.26, explodeOnExpire: true }));
        }
      }
    }

    instantHit(t, target) {
      const s = t.stats;
      let p = s.proj;
      if (p.crit && t.shots % p.crit.every === p.crit.every - 1) p = Object.assign({}, p, { dmg: p.dmg * p.crit.mult });
      const m = t.muzzle();
      const sx = m.x, sy = m.y;
      const col = t.fused ? U.hexInt(t.def.fusion.color) : t.type === 'lab' ? 0xe040fb : 0xff1744;
      const width = t.fused ? 4.5 : t.type === 'lab' ? 2.5 : 3;
      if (t.fused && t.type === 'sniper') {
        // the satellite fires from the sky
        this.fx.beam(target.x + 40, -20, target.x, target.y, col, width + 2);
      } else this.fx.beam(sx, sy, target.x, target.y, col, width);
      this.fx.sparks.explode(3, target.x, target.y);
      MT.Audio.play('laser');
      const hit = new Set([target.id]);
      const kids = this.applyHit(target, p, t);
      if (kids) kids.forEach((k) => hit.add(k.id));
      if (p.shrapnel) {
        const a = Math.atan2(target.y - sy, target.x - sx);
        const sp = { tex: 'p_shrapnel', speed: 520, dmg: p.shrapnel.dmg, pierce: p.shrapnel.pierce, type: 'sharp', r: 4 };
        for (let i = 0; i < p.shrapnel.n; i++) {
          const pr = new MT.Projectile(this, t, target.x, target.y, a + (i - (p.shrapnel.n - 1) / 2) * 0.28, sp, { life: 0.22 });
          hit.forEach((id) => pr.hit.add(id));
          this.addProjectile(pr);
        }
      }
      if (p.bounce) {
        let cur = target;
        for (let b = 0; b < p.bounce; b++) {
          const nxt = this.nearestEnemy(cur.x, cur.y, 150, s.camo, hit);
          if (!nxt) break;
          this.fx.beam(cur.x, cur.y, nxt.x, nxt.y, col, 2);
          hit.add(nxt.id);
          const k2 = this.applyHit(nxt, p, t);
          if (k2) k2.forEach((k) => hit.add(k.id));
          cur = nxt;
        }
      }
    }

    // chain lightning: hit the target, then jump to the nearest un-hit mutant
    chainHit(t, target) {
      const s = t.stats;
      const p = s.proj;
      const ch = p.chain || { jumps: 2, range: 80 };
      const col = t.fused ? 0xd1b3ff : 0x80d8ff;
      const w = t.fused ? 3.4 : 2.2;
      const m = t.muzzle();
      const hit = new Set([target.id]);
      this.fx.lightning(t.x, t.y - 34, target.x, target.y, col, w);
      const kids = this.applyHit(target, p, t);
      if (kids) kids.forEach((k) => hit.add(k.id));
      let cur = target;
      for (let j = 0; j < ch.jumps; j++) {
        const nxt = this.nearestEnemy(cur.x, cur.y, ch.range, s.camo, hit);
        if (!nxt) break;
        this.fx.lightning(cur.x, cur.y, nxt.x, nxt.y, col, w * 0.8);
        hit.add(nxt.id);
        const k2 = this.applyHit(nxt, p, t);
        if (k2) k2.forEach((k) => hit.add(k.id));
        cur = nxt;
      }
      this.fx.sparks.explode(2, m.x, m.y - 20);
      MT.Audio.play('zap');
    }

    enemiesInRange(x, y, r, camo) {
      const out = [];
      for (const e of this.enemies) {
        if (e.dead || (e.camo && !camo)) continue;
        const rr = r + e.radius * 0.5;
        if (U.dist2(x, y, e.x, e.y) <= rr * rr) out.push(e);
      }
      return out;
    }

    auraBlast(t) {
      const s = t.stats;
      const list = this.enemiesInRange(t.x, t.y, s.range, s.camo);
      const n = Math.min(list.length, s.proj.pierce);
      for (let i = 0; i < n; i++) this.applyHit(list[i], s.proj, t);
      this.fx.ring(t.x, t.y, s.range, 0xb3ecff, { disc: true, dur: 380 });
      this.fx.snow.explode(t.fused ? 22 : 10, t.x, t.y);
      MT.Audio.play('freeze');
    }

    ringBlast(t) {
      const s = t.stats;
      const list = this.enemiesInRange(t.x, t.y, s.range, s.camo);
      const n = Math.min(list.length, s.proj.pierce + t.bonusPierce);
      for (let i = 0; i < n; i++) this.applyHit(list[i], s.proj, t);
      const fire = s.ring === 'fire';
      if (s.ring === 'nado') {
        this.fx.swirl(t.x, t.y, s.range, 0x9be15d);
        MT.Audio.play('fart');
        return;
      }
      this.fx.ring(t.x, t.y, s.range, fire ? 0xff7a1a : 0x9be15d, { disc: true, dur: Math.min(450, s.rate * 900) });
      if (!fire) this.fx.gas.explode(4, t.x, t.y);
      MT.Audio.play(fire ? 'rocket' : 'fart');
    }

    rateMul(t) {
      let m = 1;
      for (const e of this.timed) {
        if (e.type === 'bananaFrenzy' && t.type === 'banana') m *= 0.33;
        if (e.type === 'overdrive' && U.dist(t.x, t.y, e.x, e.y) <= e.r) m *= 0.5;
      }
      return m;
    }

    globalSlow(e) {
      let m = 1;
      for (const f of this.timed) {
        if (f.type === 'jellyStorm') m *= e.boss ? 0.75 : 0.5;
        if (f.type === 'snowstorm' && e.boss) m *= 0.5;
      }
      return m;
    }

    // ------------------------------------------------------------------ abilities
    abilityList() {
      const out = [];
      for (const t of this.towers) {
        [t.stats.ability, t.stats.ability2].forEach((id) => id && out.push({ tower: t, id }));
      }
      return out;
    }

    useAbility(t, id) {
      const A = MT.ABILITIES[id];
      if ((t.abilityCd[id] || 0) > 0 || this.over) {
        MT.Audio.play('error');
        return;
      }
      t.abilityCd[id] = A.cd;
      MT.Audio.play('ability');
      MT.Abilities.use(this, t, id);
      this.hud.onTowersChanged();
    }

    findStrongest(list) {
      return list.sort((a, b) => b.def.rbe - a.def.rbe)[0] || null;
    }

    launchMissile(t, target, tex, onHit, delay = 0) {
      const sx = t.x, sy = t.y - 20;
      const img = this.add.image(sx, sy, tex).setScale(1 / S).setDepth(6400).setVisible(delay === 0);
      const tx = target ? target.x : CFG.MAP_W / 2, ty = target ? target.y : CFG.H / 2;
      img.rotation = Math.atan2(ty - sy, tx - sx);
      // arc up first, then dive onto the target
      const state = { k: 0 };
      this.tweens.add({
        targets: state, k: 1, duration: 750, delay, ease: 'Quad.easeIn',
        onStart: () => img.setVisible(true),
        onUpdate: () => {
          const gx = target && !target.dead ? target.x : tx, gy = target && !target.dead ? target.y : ty;
          const k = state.k;
          const nx = U.lerp(sx, gx, k), ny = U.lerp(sy, gy, k) - Math.sin(k * Math.PI) * 120;
          img.rotation = Math.atan2(ny - img.y, nx - img.x);
          img.setPosition(nx, ny);
          this.fx.trail.explode(1, nx, ny);
        },
        onComplete: () => {
          img.destroy();
          this.fx.boom(img.x, img.y, 90);
          this.fx.ring(img.x, img.y, 110, 0xffab40, { dur: 420, force: true });
          this.shake(0.12);
          MT.Audio.play('boom');
          onHit(target);
        },
      });
    }

    // ------------------------------------------------------------------ bananas
    spawnBanana(farm) {
      const s = farm.stats;
      const value = Math.round(s.value * s.valueMul);
      const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 36;
      const tx = U.clamp(farm.x + Math.cos(a) * d, 16, CFG.MAP_W - 16);
      const ty = U.clamp(farm.y + 10 + Math.sin(a) * d * 0.6, 16, CFG.H - 16);
      const img = this.add.image(farm.x, farm.y - 16, s.golden ? 'fx_banana_gold' : 'fx_banana').setScale(0.9 / S).setDepth(5600);
      const pk = { img, value, auto: s.autoCollect ? 0.9 : null, done: false };
      img.setInteractive({ useHandCursor: true });
      img.on('pointerover', () => this.collect(pk));
      img.on('pointerdown', () => this.collect(pk));
      this.tweens.add({ targets: img, x: tx, duration: 500, ease: 'Linear' });
      this.tweens.add({ targets: img, y: ty - 30, duration: 220, ease: 'Quad.easeOut', yoyo: false, onComplete: () => this.tweens.add({ targets: img, y: ty, duration: 280, ease: 'Bounce.easeOut' }) });
      this.pickups.push(pk);
    }

    collect(pk) {
      if (pk.done) return;
      pk.done = true;
      this.money += pk.value;
      MT.Audio.play('coin');
      this.fx.floatText(pk.img.x, pk.img.y - 12, '+' + U.money(pk.value), '#ffe14a', 16);
      pk.img.disableInteractive();
      this.tweens.add({ targets: pk.img, x: 1062, y: 74, scale: 0.4 / S, duration: 450, ease: 'Quad.easeIn', onComplete: () => pk.img.destroy() });
    }

    collectAllPickups() {
      this.pickups.forEach((pk) => this.collect(pk));
      this.pickups = [];
    }

    // ------------------------------------------------------------------ loop
    update(time, delta) {
      const real = Math.min(delta, 50) / 1000;
      if (!this.paused && !this.over) {
        let dt = real * this.speed;
        if (this.slowmo > 0) {
          this.slowmo -= real;
          dt *= 0.3;
        }
        const steps = Math.max(1, Math.ceil(dt / (1 / 60) - 1e-6));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) this.step(h);
      }
      this.renderFrame(time, delta / 1000);
    }

    step(dt) {
      if (this.roundActive) {
        this.roundTime += dt;
        const list = this.spawnList;
        while (this.spawnIdx < list.length && list[this.spawnIdx].t <= this.roundTime) {
          const s = list[this.spawnIdx++];
          const e = new MT.Enemy(this, s.type, { path: this.spawnCounter++ % this.paths.length, dist: 0, camo: s.camo, fort: s.fort });
          this.enemies.push(e);
          if (e.boss) MT.Bosses.onSpawn(this, e);
        }
        for (const t of this.towers) {
          if (t.bananaTimes && t.bananaTimes.length && t.bananaTimes[0] <= this.roundTime) {
            t.bananaTimes.shift();
            this.spawnBanana(t);
          }
        }
      }
      for (const e of this.enemies) if (!e.dead) e.update(dt);
      if (this.over) return;
      this.rebuildGrid();
      for (const t of this.towers) t.update(dt);
      for (const p of this.projectiles) if (!p.dead) p.update(dt);
      MT.Abilities.step(this, dt);
      this.enemies = this.enemies.filter((e) => !e.dead);
      this.projectiles = this.projectiles.filter((p) => !p.dead);
      for (let i = this.timed.length - 1; i >= 0; i--) {
        this.timed[i].t -= dt;
        if (this.timed[i].t <= 0) this.timed.splice(i, 1);
      }
      for (const t of this.towers) for (const k in t.abilityCd) if (t.abilityCd[k] > 0) t.abilityCd[k] -= dt;
      for (const pk of this.pickups) {
        if (pk.auto != null && !pk.done) {
          pk.auto -= dt;
          if (pk.auto <= 0) this.collect(pk);
        }
      }
      if (this.pickups.length > 40 || (this.pickups.length && this.pickups[0].done)) this.pickups = this.pickups.filter((p) => !p.done);
      if (this.roundActive && this.spawnIdx >= this.spawnList.length && this.enemies.length === 0) this.endRound();
    }

    renderFrame(time, dt) {
      for (const e of this.enemies) if (!e.dead) e.render(time, dt);
      for (const p of this.projectiles) if (!p.dead) p.render(dt);
      for (const t of this.towers) t.render(dt, time);
      MT.Abilities.render(this, dt, time);
      this.fx.update(dt);
      // screen shake (applied as a small camera offset)
      const cam = this.cameras.main;
      if (this.trauma > 0) {
        this.trauma = Math.max(0, this.trauma - dt * SHAKE_DECAY);
        const amp = SHAKE_PX * Math.pow(this.trauma, 1.6);
        const n = time * 0.045;
        cam.setScroll(this.camBase.x + Math.sin(n * 1.7) * Math.cos(n * 0.9) * amp, this.camBase.y + Math.sin(n * 1.3 + 2) * Math.cos(n * 1.1) * amp);
      } else if (cam.scrollX !== this.camBase.x || cam.scrollY !== this.camBase.y) cam.setScroll(this.camBase.x, this.camBase.y);
      // boss health bars
      const g = this.gBars;
      g.clear();
      for (const e of this.enemies) {
        if (!e.boss || e.dead || e.def.final) continue;
        const w = e.radius * 1.8, x = e.x - w / 2, y = e.y - e.radius * 1.75 - 10;
        g.fillStyle(0x1a1a1a, 0.8);
        g.fillRoundedRect(x - 2, y - 2, w + 4, 9, 4);
        const f = Math.max(0, e.hp / e.maxHp);
        g.fillStyle(f > 0.5 ? 0x7be35a : f > 0.25 ? 0xffc61a : 0xff4a3a, 1);
        g.fillRoundedRect(x, y, Math.max(2, w * f), 5, 2.5);
      }
      MT.Bosses.drawBar(this, this.gTop, time);
      // range / placement preview
      const rg = this.gRange;
      rg.clear();
      if (this.placing) {
        const type = this.placing.type;
        const def = this.defOf(type);
        const x = this.pointer.x, y = this.pointer.y;
        const ok = x < CFG.MAP_W && this.canPlace(x, y, def.size) && this.placeCost(type, x, y) <= this.money;
        this.ghost.setPosition(x, y).setVisible(x < CFG.MAP_W);
        this.ghost.setTint(ok ? 0xffffff : 0xff8080);
        if (x < CFG.MAP_W) {
          const r = def.base.range > 1000 ? 0 : def.base.range + (def.base.attack === 'plane' ? def.base.orbit : 0);
          if (r) {
            rg.fillStyle(ok ? 0xffffff : 0xff3030, 0.16);
            rg.fillCircle(x, y, r);
            rg.lineStyle(2, ok ? 0xffffff : 0xff3030, 0.6);
            rg.strokeCircle(x, y, r);
          }
          rg.fillStyle(ok ? 0x5cff5c : 0xff3030, 0.35);
          rg.fillCircle(x, y, def.size);
        }
      } else if (this.selected) {
        const t = this.selected;
        const r = t.stats.range > 1000 ? 0 : t.stats.range + (t.stats.attack === 'plane' ? t.stats.orbit : 0);
        if (r) {
          rg.fillStyle(0xffffff, 0.14);
          rg.fillCircle(t.x, t.y, r);
          rg.lineStyle(2, 0xffffff, 0.55);
          rg.strokeCircle(t.x, t.y, r);
        }
        if (t.stats.buffRange) {
          rg.lineStyle(2, 0x7fdbff, 0.5);
          rg.strokeCircle(t.x, t.y, t.stats.buffRange);
        }
        if (this.fuseHover) {
          // highlight the towers that would be fused
          const pulse = 0.55 + Math.sin(time * 0.012) * 0.35;
          this.fuseHover.forEach((f) => {
            rg.lineStyle(4, 0xe040fb, pulse);
            rg.strokeCircle(f.x, f.y - 8, 30);
            if (f !== t) {
              rg.lineStyle(2, 0xe040fb, pulse * 0.7);
              rg.lineBetween(f.x, f.y - 8, t.x, t.y - 8);
            }
          });
        }
      }
      this.hud.update(dt);
    }

    // ------------------------------------------------------------------ debug / tests
    debugSim(seconds) {
      const h = 1 / 60;
      for (let i = 0; i < seconds * 60 && !this.over; i++) this.step(h);
    }
  }

  MT.GameScene = GameScene;
  MT.TARGET_MODES = TARGET_MODES;
})();
