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
  // zones and traps sit on the ground: they never reach flying mutants
  const GROUND = { ground: true };

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
      // 'classic' rounds, 'boss' battle (data.boss + data.tier) or the sandbox
      this.mode = data.boss ? 'boss' : 'classic';
      this.bossId = data.boss || null;
      this.bossTier = data.tier || 'normal';
      this.sandbox = !!this.diff.sandbox;
      this.launchData = data;
    }

    create() {
      const cam = MT.setupCamera(this);
      this.camBase = { x: cam.scrollX, y: cam.scrollY };
      this.trauma = 0;
      this.slowmo = 0;
      this.uid = 0;
      this.paths = this.mapDef.paths.map((p) => new MT.Path(p));
      // flying mutants take a shortcut: the same start and end, but only every 4th bend
      this.airPaths = this.mapDef.paths.map((ctrl) => {
        const pts = [ctrl[0]];
        for (let i = 4; i < ctrl.length - 2; i += 4) pts.push(ctrl[i]);
        pts.push(ctrl[ctrl.length - 1]);
        if (pts.length < 3) pts.splice(1, 0, [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]);
        return new MT.Path(pts);
      });
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
      this.zones = []; // lingering gas / fire clouds on the ground
      this.traps = []; // nail piles and banana peels on the track
      this.giantObjs = []; // vortices, tornadoes, shells... from the giant towers
      this.moving = null; // tower currently being relocated
      // Phaser reuses the scene object on restart: clear everything a previous game left behind
      this.bossBarText = null;
      this.introBusy = false;
      this.introQueue = [];
      this.noWaterHint = false;
      this.defeatReason = null;
      this.bossDown = false;
      this.boss = null;
      this.seenBoss = {};
      this.fusionHinted = {};
      this.money = this.mode === 'boss' ? MT.BossFight.startCash(this) : CFG.START_CASH;
      this.lives = this.diff.lives;
      // numbers for the end-of-game report
      this.stat = { time: 0, livesLost: 0, abilities: 0, built: 0, sold: [] };
      this.sbQueue = [];
      this.sbT = 0;
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
      if (this.mode === 'boss') MT.BossFight.prepare(this);
      else this.hud.toast(this.sandbox ? 'SANDBOX: unlimited bananas! Open the sandbox panel (top right).' : 'Place some minions, then press PLAY!', 3200);
      this.hud.refreshPreview();
      MT.Audio.music('game');
      this.musicCheck = 0;
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
      for (const t of this.units()) {
        const b = t.stats.buff;
        if (t.type === 'lab' && b && b.discount && U.dist(x, y, t.x, t.y) <= t.stats.range) d = Math.max(d, b.discount);
      }
      return d;
    }

    // every acting tower, with Omega Towers expanded into their three parts
    units() {
      const out = [];
      for (const t of this.towers) {
        if (t.omega) out.push(...t.subs);
        else out.push(t);
      }
      return out;
    }

    strongestBoss() {
      let best = null;
      for (const e of this.enemies) {
        if (e.dead || !e.boss) continue;
        if (!best || e.def.rbe > best.def.rbe || (e.def.rbe === best.def.rbe && e.hp > best.hp)) best = e;
      }
      return best;
    }

    inWater(x, y, margin) {
      return this.layout.pools.some((wa) => MT.MapArt.waterDist(wa, x, y) <= -margin);
    }

    defOf(type) {
      return MT.HEROES[type] || MT.TOWERS[type];
    }

    // can this tower / projectile touch this mutant at all? Burrowed moles are
    // out of reach, flyers need anti-air, and ground traps never reach the sky
    hittable(e, tower, p) {
      if (e.dead || e.burrowed) return false;
      if (e.flying && ((p && p.ground) || (tower && !tower.stats.air))) return false;
      return true;
    }

    spawnEnemy(type, o) {
      const e = new MT.Enemy(this, type, o);
      this.enemies.push(e);
      if (e.boss) MT.Bosses.onSpawn(this, e);
      return e;
    }

    // a boss attack (or EMP) knocks a tower out for a while
    disableTower(t, dur, kind) {
      if (!t || t.dead) return;
      t.disabled = Math.max(t.disabled, dur);
      t.disableKind = kind;
      const key = { ink: 'fx_inksplat', gum: 'fx_gumbubble', lava: 'fx_meltdown' }[kind];
      if (!key || t.disableSprite) return;
      const sp = this.add.image(t.x, t.y - 16, key);
      sp.baseScale = ((t.size + 8) / 24) / S;
      sp.grow = 0.3;
      sp.setScale(sp.baseScale * 0.3);
      t.disableSprite = sp;
      this.tweens.add({ targets: sp, grow: 1, duration: 240, ease: 'Back.easeOut' });
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

    // o.water: the tower can only float on water; o.ignore: a tower being moved
    canPlace(x, y, size, o = {}) {
      if (x < size * 0.7 || x > CFG.MAP_W - size * 0.7 || y < size * 0.7 || y > CFG.H - size * 0.7) return false;
      const pw = this.mapDef.pathWidth / 2;
      for (const p of this.paths) if (p.distTo(x, y) < pw + size * 0.8) return false;
      if (o.water) {
        if (!this.inWater(x, y, size * 0.45)) return false;
      } else {
        for (const b of this.layout.blockers) if (U.dist(x, y, b.x, b.y) < b.r + size * 0.55) return false;
        for (const wa of this.layout.water) if (MT.MapArt.waterDist(wa, x, y) < size * 0.5) return false;
      }
      for (const t of this.towers) if (t !== o.ignore && U.dist(x, y, t.x, t.y) < t.size + size - 6) return false;
      return true;
    }

    placeOpts(type) {
      const def = this.defOf(type);
      return { water: !!(def && def.waterOnly) };
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
          if (this.moving) {
            this.cancelMove();
            return;
          }
          this.cancelPlacing();
          this.select(null);
          return;
        }
        if (over.length) return;
        const x = p.worldX, y = p.worldY;
        if (x >= CFG.MAP_W) return;
        if (this.moving) {
          this.tryMove(x, y);
          return;
        }
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
          if (this.moving) this.cancelMove();
          else if (this.placing) this.cancelPlacing();
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
        // 1-9 fire the abilities in the ability bar
        if (k.length === 1 && k >= '1' && k <= '9') return this.hud.useAbilitySlot(+k - 1);
        const up = k.toUpperCase();
        if (up === this.heroDef.key) return this.startPlacing(this.heroId);
        for (const id of MT.TOWER_ORDER) if (MT.TOWERS[id].key === up) return this.startPlacing(id);
        if (this.selected) {
          if (k === ',') this.buyUpgrade(this.selected, 0);
          if (k === '.') this.buyUpgrade(this.selected, 1);
          if (k === '/') this.buyUpgrade(this.selected, 2);
          if (up === 'F') MT.Fusion.fuse(this, this.selected);
          if (up === 'M') this.startMove(this.selected);
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
      this.cancelMove();
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
      if (!this.canPlace(x, y, def.size, this.placeOpts(type))) {
        MT.Audio.play('error');
        this.hud.toast(def.waterOnly ? 'Submarines can only go on water, lava or goo!' : "Can't place that there!", 1400);
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
      this.stat.built++;
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

    // ------------------------------------------------------------------ moving towers
    moveFee(t) {
      return U.round5(Math.min(5000, Math.max(50, t.spent * 0.05)));
    }

    startMove(t) {
      if (!t || this.over || t.fusing) return;
      const fee = this.moveFee(t);
      if (fee > this.money) {
        MT.Audio.play('error');
        this.hud.toast('Not enough bananas to move it!', 1400);
        return;
      }
      this.cancelPlacing();
      this.moving = { t, fee };
      this.ghost.setTexture(t.texKey()).setOrigin(0.5, t.originY()).setFlipX(false).setVisible(true);
      this.hud.toast(`Click a new spot for ${t.name}  (${U.money(fee)})  ·  Esc to cancel`, 2400);
      MT.Audio.play('click');
    }

    cancelMove() {
      if (!this.moving) return;
      this.moving = null;
      this.ghost.setVisible(false);
    }

    canMoveTo(t, x, y) {
      return x < CFG.MAP_W && this.canPlace(x, y, t.size, { water: !!t.def.waterOnly, ignore: t });
    }

    tryMove(x, y) {
      const m = this.moving;
      if (!m) return;
      const t = m.t;
      if (!this.towers.includes(t)) return this.cancelMove();
      if (!this.canMoveTo(t, x, y)) {
        MT.Audio.play('error');
        this.hud.toast(t.def.waterOnly ? 'It has to stay on water!' : "Can't move it there!", 1200);
        return;
      }
      if (m.fee > this.money) {
        MT.Audio.play('error');
        this.hud.toast('Not enough bananas!', 1200);
        return;
      }
      this.money -= m.fee;
      this.fx.dust.explode(10, t.x, t.y + 14);
      t.moveTo(x, y);
      this.fx.dust.explode(12, x, y + 14);
      this.fx.ring(x, y, 46, 0xffffff, { dur: 350 });
      this.cancelMove();
      this.recalcBuffs();
      MT.Audio.play('place');
      this.hud.showTower(t);
      this.hud.onTowersChanged();
    }

    select(t) {
      if (this.placing && t) this.cancelPlacing();
      if (this.moving && this.moving.t !== t) this.cancelMove();
      this.selected = t;
      this.fuseHover = null;
      if (t) {
        MT.Audio.play('click');
        this.hud.showTower(t);
      } else this.hud.showShop();
    }

    buyUpgrade(t, pi) {
      if (t.hero || t.fused || t.omega) return;
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
      t.bump = 1;
      this.fx.upgradeBurst(t, pi, t.tiers[pi]);
      MT.Audio.play('upgrade');
      if (t.type !== 'farm' && t.type !== 'lab') this.fx.speech(t.x, t.y - 54, U.pick(['Bee-do bee-do!', 'Kanpai!', 'Whaaa!', 'Gelato!', 'Bananaaa!']));
      if (t.tiers[pi] === 4) {
        this.fx.ring(t.x, t.y, 90, 0xffffff, { dur: 600, force: true });
        MT.Fusion.checkHint(this, t.type);
      }
      this.hud.showTower(t);
      this.hud.onTowersChanged();
    }

    // XP still missing for the next level, or for the next star once maxed
    heroXpToNext(t) {
      if (t.level < MT.HERO_MAX_LEVEL) return MT.HERO_XP[t.level] - t.xp;
      return MT.starXp(t.stars) - t.sxp;
    }

    heroLevelCost(t) {
      return U.round5(this.heroXpToNext(t) * 2 * this.diff.price);
    }

    buyHeroLevel(t) {
      const cost = this.heroLevelCost(t);
      if (!cost || cost > this.money) {
        MT.Audio.play('error');
        return;
      }
      this.money -= cost;
      t.spent += Math.floor(cost * 0.5);
      this.gainHeroXp(t, this.heroXpToNext(t));
    }

    // levels 1-10 first; past that the XP keeps flowing into ascension stars
    gainHeroXp(t, amount) {
      const MAX = MT.HERO_MAX_LEVEL;
      let leveled = false, ascended = 0;
      if (t.level < MAX) {
        t.xp += amount;
        amount = 0;
        while (t.level < MAX && t.xp >= MT.HERO_XP[t.level]) {
          t.level++;
          leveled = true;
        }
        if (t.level >= MAX) {
          amount = t.xp - MT.HERO_XP[MAX - 1];
          t.xp = MT.HERO_XP[MAX - 1];
        }
      }
      if (t.level >= MAX && amount > 0) {
        t.sxp += amount;
        while (t.sxp >= MT.starXp(t.stars)) {
          t.sxp -= MT.starXp(t.stars);
          t.stars++;
          ascended++;
        }
      }
      if (leveled || ascended) {
        t.recompute();
        t.refreshTexture();
        this.recalcBuffs();
        const col = U.hexInt(t.def.color || '#7fdbff');
        if (ascended) {
          t.makeHeroVisuals();
          t.bump = 1;
          this.fx.shockwave(t.x, t.y, 150, 0xffd54f, 600);
          this.fx.ring(t.x, t.y, 80, col, { dur: 600, force: true });
          this.fx.glow.particleTint = 0xffd54f;
          this.fx.glow.explode(24, t.x, t.y - 24);
          this.fx.floatText(t.x, t.y - 60, (t.stars === 1 ? 'ASCENDED ★' : 'STAR ★') + t.stars + '!', '#ffe082', 22);
          if (t.stars === MT.LEGEND_STAR) this.hud.toast(t.def.name + ' unlocked LEGEND FORM!', 2200);
          else if (t.stars === 1) this.hud.toast(t.def.name + ' ascended! Nearby towers now get a Command bonus.', 2400);
        } else {
          this.fx.ring(t.x, t.y, 60, col, { dur: 500 });
          this.fx.floatText(t.x, t.y - 50, 'LEVEL ' + t.level + '!', t.def.color || '#7fdbff', 20);
        }
        this.fx.sparks.explode(18, t.x, t.y - 20);
        MT.Audio.play('upgrade');
        this.hud.onTowersChanged();
      }
      if (this.selected === t) this.hud.showTower(t);
    }

    // one row of the end-of-game report
    towerRecord(t, sold) {
      const subs = t.subs || [];
      return {
        name: t.name, key: t.texKey(), hero: t.hero, omega: t.omega, ultimate: t.ultimate, fused: t.fused, sold: !!sold,
        pops: Math.floor(t.totalPops), dmg: Math.round(subs.reduce((a, u) => a + u.dmg, t.dmg)),
        spent: t.spent, earned: Math.round(subs.reduce((a, u) => a + u.earned, t.earned)),
      };
    }

    sell(t) {
      this.stat.sold.push(this.towerRecord(t, true));
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
      if (t.subs) t.subs.forEach((u) => (u.targetMode = t.targetMode));
      this.hud.showTower(t);
    }

    recalcBuffs() {
      const units = this.units();
      const supports = units.filter((t) => t.stats.buff);
      for (const t of units) {
        const isAttacker = t.baseStats.attack !== 'none';
        let b = null;
        if (isAttacker) {
          for (const s of supports) {
            if (s === t) continue;
            if (s.hero && (t.type === 'farm' || t.type === 'lab')) continue;
            const r = s.stats.buffRange || s.stats.range;
            if (U.dist(s.x, s.y, t.x, t.y) > r) continue;
            const sb = s.stats.buff;
            // a hero's partner tower gets double the aura, Legend Form doubles it again
            const k = s.hero ? (s.def.partner === t.type ? 2 : 1) * (s.legend > 0 ? 2 : 1) : 1;
            b = b || { range: 0, rate: 0, pierce: 0, dmg: 0, camo: false, armored: false, air: false };
            b.range = Math.max(b.range, (sb.range || 0) * Math.min(k, 2));
            b.rate = Math.max(b.rate, Math.min(0.6, (sb.rate || 0) * k));
            b.dmg = Math.max(b.dmg, Math.min(1, (sb.dmg || 0) * k));
            b.pierce = Math.max(b.pierce, sb.pierce || 0);
            b.camo = b.camo || !!sb.camo;
            b.armored = b.armored || !!sb.armored;
            b.air = b.air || !!sb.air;
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
      if (this.mode === 'boss') {
        MT.BossFight.startFight(this);
        return;
      }
      this.round++;
      this.roundActive = true;
      this.roundTime = 0;
      this.spawnIdx = 0;
      this.spawnList = MT.Rounds.spawns(this.round);
      this.scaling = MT.Rounds.scaling(this.round);
      this.cashMul = MT.Rounds.cashMul(this.round);
      const dur = Math.max(8, (this.spawnList.length ? this.spawnList[this.spawnList.length - 1].t : 0) + 6);
      this.growBananas(0, dur);
      const head = MT.Rounds.headline(this.round);
      this.hud.toast(head || 'Round ' + this.round, head ? 2600 : 1400, !!head);
      MT.Audio.play('roundStart');
      this.hud.onRoundState();
      this.hud.refreshPreview();
    }

    // farms drop their bananas spread over the next `dur` seconds
    growBananas(from, dur) {
      for (const t of this.units()) {
        if (t.type !== 'farm') continue;
        const n = t.stats.bananas;
        t.bananaTimes = [];
        for (let i = 0; i < n; i++) t.bananaTimes.push(from + ((i + 0.5) / n) * dur);
      }
    }

    // flat income from farms, banks and the giant towers, credited to whoever made it
    flatIncome() {
      let income = 0;
      for (const t of this.units()) {
        if (!t.stats.flat) continue;
        income += t.stats.flat;
        t.earned += t.stats.flat;
      }
      return income + MT.Giants.roundEnd(this);
    }

    endRound() {
      this.roundActive = false;
      const bonus = 100 + this.round;
      const income = bonus + this.flatIncome();
      this.money += income;
      this.collectAllPickups();
      const hero = this.towers.find((t) => t.hero);
      if (hero) this.gainHeroXp(hero, 20 + this.round * 8);
      for (const t of this.units()) t.bananaTimes = null;
      // nail piles are swept up between rounds
      this.traps.forEach((tr) => this.removeTrap(tr, true));
      this.traps = [];
      MT.Audio.play('roundEnd');
      this.hud.toast(`Round ${this.round} complete!  +${U.money(income)}`, 1800);
      if (!this.freeplay && !this.won && this.round >= this.diff.rounds) {
        this.won = true;
        this.victory();
        return;
      }
      this.hud.onRoundState();
      this.hud.refreshPreview();
      if (MT.Save.settings().autoStart) this.time.delayedCall(400, () => !this.over && !this.paused && this.startRound());
    }

    victory() {
      if (this.over) return;
      if (this.mode === 'boss') MT.Save.bossWin(this.bossId, this.bossTier, this.stat.time);
      else if (!this.sandbox) MT.Save.award(this.mapDef.id, this.diff.id);
      if (!this.sandbox) MT.Save.addStats(this.totalPops, this.round, true);
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

    defeat(reason) {
      if (this.over || this.sandbox) return;
      this.over = true;
      this.lives = 0;
      this.defeatReason = reason || null;
      MT.Save.addStats(this.totalPops, this.round, false);
      MT.Audio.play('defeat');
      this.hud.showDefeat();
    }

    leak(e) {
      const cost = Math.max(1, Math.ceil(MT.enemyRbe(e.type, e.fort) - (e.maxHp - e.hp)));
      if (e.def.bossFight && !this.sandbox) {
        // a boss reaching the end of the track wins the battle
        e.leaked = true;
        e.destroy();
        this.stat.livesLost += this.lives;
        this.fx.vignette(0xff2020, 0.7, 900);
        this.defeat('escaped');
        return;
      }
      if (this.bossDown) {
        // the boss is beaten: stragglers don't matter any more
        e.leaked = true;
        e.destroy();
        return;
      }
      this.stat.livesLost += Math.min(cost, Math.max(0, this.lives));
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
        if (e.dead || (e.camo && !s.camo) || !this.hittable(e, t)) continue;
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

    nearestEnemy(x, y, r, camo, exclude, air = true) {
      let best = null, bd = r * r;
      for (const e of this.enemies) {
        if (e.dead || e.burrowed || (e.flying && !air) || (e.camo && !camo) || (exclude && exclude.has(e.id))) continue;
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
      if (e.dead || !this.hittable(e, tower, p)) return null;
      // a shield bubble soaks up the whole hit (effects included)
      const src = e.shieldSrc;
      if (src && !src.dead && src.bubble && src.bubble.hp > 0 && !(src.bubble.broken > 0)) {
        let d = dmgOverride != null ? dmgOverride : p.dmg || 0;
        if (e.boss) d += p.moabDmg || 0;
        this.absorb(src, e, Math.max(1, d));
        return [];
      }
      const harmful = p.type === 'sharp' || p.type === 'cold';
      const shredded = e.shredT > 0; // rocket shred: armor is off and every hit does +1
      if (e.def.armored && harmful && !p.armored && !(tower && tower.buffArmored) && !shredded) {
        this.fx.clank(e.x, e.y);
        MT.Audio.play('clank');
        return null;
      }
      if (p.shred) e.shredT = Math.max(e.shredT, p.shred);
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
      if (d > 0 && shredded) d += 1;
      if (d <= 0) return [];
      if (tower && tower.dmgMul > 1) d *= tower.dmgMul;
      return this.damageEnemy(e, d, tower);
    }

    // a shield bubble takes a hit; it shatters when its pool runs dry
    absorb(src, e, d) {
      const b = src.bubble;
      b.hp -= d;
      b.hitT = 0.12;
      if (Math.random() < 0.3) this.fx.ring(e.x, e.y, e.radius * 1.3, b.color, { dur: 220, alpha: 0.7 });
      if (b.hp > 0) return;
      b.hp = 0;
      b.broken = b.cd;
      const r = b.self ? src.radius * 1.6 : b.r;
      this.fx.ring(src.x, src.y, r, b.color, { dur: 420, force: true });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        this.fx.sparkle(src.x + Math.cos(a) * r * 0.9, src.y + Math.sin(a) * r * 0.75, b.color);
      }
      this.fx.sparks.explode(8, src.x, src.y);
      if (b.self || src.boss) this.fx.floatText(src.x, src.y - src.radius - 30, 'SHIELD DOWN!', '#9fe0ff', 20);
      MT.Audio.play('shieldBreak', src.x);
    }

    // which mutants are inside a shield bubble right now
    assignShields() {
      for (const e of this.enemies) e.shieldSrc = null;
      for (const c of this.enemies) {
        const b = c.bubble;
        if (c.dead || !b || b.hp <= 0 || b.broken > 0 || c.burrowed) continue;
        if (b.self) {
          c.shieldSrc = c;
          continue;
        }
        const r2 = b.r * b.r;
        for (const o of this.queryEnemies(c.x, c.y, b.r + 10)) {
          if (o === c || o.dead || o.burrowed || U.dist2(c.x, c.y, o.x, o.y) > r2) continue;
          if (!o.shieldSrc || o.shieldSrc.bubble.hp < b.hp) o.shieldSrc = c;
        }
      }
    }

    damageEnemy(e, d, tower) {
      if (e.dead) return [];
      if (tower) tower.dmg += Math.min(d, Math.max(0, e.hp));
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
      if (tower) {
        tower.pops++;
        tower.earned += this.cashMul;
      }
      if (e.boss) MT.Bosses.death(this, e);
      else this.fx.pop(e.x, e.y, false);
      MT.Audio.play(e.boss ? 'bigpop' : 'pop', e.x);
    }

    spawnChildren(e) {
      const kids = [];
      const n = e.def.children.length;
      e.def.children.forEach((type, i) => {
        const off = (i - (n - 1) / 2) * (e.boss ? 16 : 6);
        const k = new MT.Enemy(this, type, { path: e.pathIndex, dist: Math.max(0, this.childDist(e, type) + off), camo: e.camo, burst: e.boss });
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

    // where along its own route a child should appear (flyers and walkers use different routes)
    childDist(e, type) {
      if (!!MT.ENEMIES[type].flying === e.flying) return e.dist;
      const route = (MT.ENEMIES[type].flying ? this.airPaths : this.paths)[e.pathIndex];
      return route.project(e.x, e.y + (e.flying ? MT.Enemy.FLY : 0));
    }

    explode(x, y, p, tower, hitSet) {
      const ex = p.explode;
      const cand = this.queryEnemies(x, y, ex.r + 60);
      const list = [];
      for (const e of cand) {
        if (e.dead || !this.hittable(e, tower, p)) continue;
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
        MT.Audio.play('freeze', x);
      } else if (p.tex === 'p_jelly' || p.tex === 'p_jelly_acid') {
        this.fx.goo.explode(8, x, y);
        if (ex.r > 50) this.fx.ring(x, y, ex.r, 0x9be15d, { disc: true, dur: 260 });
      } else if (p.tex === 'p_goo') {
        this.fx.splat(x, y, ex.r, 0x8bdc3a);
        MT.Audio.play('splat', x);
      } else if (p.tex === 'p_squid') {
        this.fx.splat(x, y, ex.r, 0x3b2f5c);
        MT.Audio.play('splat', x);
      } else {
        this.fx.boom(x, y, ex.r);
        MT.Audio.play('boom', x);
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
      // focus fire (Laser Sniper): consecutive hits on the same mutant stack up damage
      let stacks = 0;
      if (s.focus) {
        if (t.focusId === target.id) t.focusStacks = Math.min(s.focus.max, t.focusStacks + 1);
        else t.focusStacks = 0;
        t.focusId = target.id;
        stacks = t.focusStacks;
        if (stacks) p = Object.assign({}, p, { dmg: p.dmg + stacks * Math.max(1, Math.round(p.dmg * 0.2)) });
      }
      const m = t.muzzle();
      const sx = m.x, sy = m.y;
      const col = t.fused ? U.hexInt(t.def.fusion.color) : t.type === 'lab' ? 0xe040fb : 0xff1744;
      const width = (t.fused ? 4.5 : t.type === 'lab' ? 2.5 : 3) + stacks * 0.5;
      if (t.fused && t.type === 'sniper') {
        // the satellite fires from the sky
        this.fx.beam(target.x + 40, -20, target.x, target.y, col, width + 2);
      } else this.fx.beam(sx, sy, target.x, target.y, col, width);
      this.fx.sparks.explode(3, target.x, target.y);
      MT.Audio.play('laser', t.x);
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
          const nxt = this.nearestEnemy(cur.x, cur.y, 150, s.camo, hit, s.air);
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
      // from the head coil, or from the Omega Mech's arm
      if (t.component) this.fx.lightning(m.x, m.y, target.x, target.y, col, w);
      else this.fx.lightning(t.x, t.y - 34, target.x, target.y, col, w);
      const kids = this.applyHit(target, p, t);
      if (kids) kids.forEach((k) => hit.add(k.id));
      let cur = target;
      for (let j = 0; j < ch.jumps; j++) {
        const nxt = this.nearestEnemy(cur.x, cur.y, ch.range, s.camo, hit, s.air);
        if (!nxt) break;
        this.fx.lightning(cur.x, cur.y, nxt.x, nxt.y, col, w * 0.8);
        hit.add(nxt.id);
        const k2 = this.applyHit(nxt, p, t);
        if (k2) k2.forEach((k) => hit.add(k.id));
        cur = nxt;
      }
      this.fx.sparks.explode(2, m.x, m.y - 20);
      MT.Audio.play('zap', target.x);
    }

    // ------------------------------------------------------------------ sonar, clouds, traps
    // submarine sonar: mutants in range permanently lose their Camo
    sonarPing(t) {
      const r = t.stats.range;
      let n = 0;
      for (const e of this.enemies) {
        if (e.dead || !e.camo) continue;
        if (U.dist2(t.x, t.y, e.x, e.y) > r * r) continue;
        e.camo = false;
        e.sprite.setTexture(e.texKey()).setAlpha(1);
        this.fx.sparkle(e.x, e.y - e.radius, 0x80deea);
        n++;
      }
      // ...and drags digging moles back up to the surface, dazed
      for (const e of this.enemies) {
        if (e.dead || !e.burrowed || U.dist2(t.x, t.y, e.x, e.y) > r * r) continue;
        e.dig(false);
        e.stun = Math.max(e.stun, 0.8);
        this.fx.floatText(e.x, e.y - 24, 'FOUND YOU!', '#80deea', 14);
        n++;
      }
      this.fx.ring(t.x, t.y, r, 0x4dd0e1, { dur: 700, alpha: n ? 0.8 : 0.35 });
      if (n) MT.Audio.play('sonar');
    }

    // a lingering gas (or fire) cloud left on the ground by a fart puff
    addZone(x, y, c, tower, kind) {
      if (this.zones.length > 140) this.zones.shift();
      this.zones.push({ x, y, r: c.r, t: c.dur, dmg: c.dmg, every: c.every, tick: 0.1, pierce: c.pierce, tower, kind, fxT: 0 });
    }

    stepZones(dt) {
      const Z = this.zones;
      for (let i = Z.length - 1; i >= 0; i--) {
        const z = Z[i];
        z.t -= dt;
        z.tick -= dt;
        if (z.tick <= 0) {
          z.tick = z.every;
          let n = z.pierce;
          for (const e of this.queryEnemies(z.x, z.y, z.r + 40)) {
            if (n <= 0) break;
            if (e.dead || !this.hittable(e, null, GROUND) || U.dist2(z.x, z.y, e.x, e.y) > (z.r + e.radius * 0.5) ** 2) continue;
            this.applyHit(e, { dmg: z.dmg, type: z.kind === 'fire' ? 'fire' : 'normal', ground: true }, z.tower);
            n--;
          }
        }
        if (z.t <= 0) Z.splice(i, 1);
      }
    }

    // the track points a trap tower can reach (cached per position + range)
    trackPoints(t) {
      const r = t.stats.range;
      if (t.trackPts && t.trackPtsR === r) return t.trackPts;
      const pts = [];
      this.paths.forEach((p) => {
        for (let d = 0; d < p.length; d += 8) {
          const q = p.at(d);
          if (q.x < 4 || q.x > CFG.MAP_W - 4 || q.y < 4 || q.y > CFG.H - 4) continue;
          if (U.dist2(q.x, q.y, t.x, t.y) <= r * r) pts.push({ x: q.x, y: q.y, path: p, d });
        }
      });
      t.trackPts = pts;
      t.trackPtsR = r;
      return pts;
    }

    // Nail Minion: drop a nail pile (or banana peel) somewhere on the track in range
    placeTrap(t) {
      const s = t.stats;
      const pts = this.trackPoints(t);
      if (!pts.length || (!this.roundActive && !this.enemies.length)) return false;
      let spot = null;
      if (s.smart) {
        // land right in front of the leading mutant in range
        const e = this.findTarget(t);
        if (e) {
          const q = e.path.at(e.dist + 24 + e.speedNow() * 0.5);
          if (U.dist2(q.x, q.y, t.x, t.y) <= s.range * s.range) spot = q;
        }
      }
      if (!spot) spot = U.pick(pts);
      const peel = s.peel && t.shots % s.peel.every === s.peel.every - 1;
      const p = peel
        ? Object.assign({}, s.proj, { tex: 'fx_peel', dmg: 0, pierce: s.peel.pierce, knock: s.peel.knock, stun: { dur: 0.3 }, mine: null, type: 'normal' })
        : s.proj;
      const x = spot.x + U.rand(-6, 6), y = spot.y + U.rand(-6, 6);
      const sprite = this.add.image(t.x, t.y - 20, p.tex).setScale((0.6 * (p.scale || 1)) / S).setDepth(980 + y * 0.001).setRotation(U.rand(-0.4, 0.4));
      const tr = { x, y, p, pierce: p.pierce + (t.bonusPierce || 0), max: p.pierce, life: p.life || 14, tower: t, hit: new Set(), sprite };
      // the pile is thrown in an arc onto the track
      const st = { k: 0 };
      const sx = t.x, sy = t.y - 20;
      this.tweens.add({
        targets: st, k: 1, duration: 260, ease: 'Quad.easeOut',
        onUpdate: () => sprite.setPosition(U.lerp(sx, x, st.k), U.lerp(sy, y, st.k) - Math.sin(st.k * Math.PI) * 30),
        onComplete: () => sprite.setScale((p.scale || 1) / S),
      });
      this.traps.push(tr);
      t.aimAt({ x, y, dead: false });
      // keep the number of piles per tower under control
      let mine = 0;
      for (let i = this.traps.length - 1; i >= 0; i--) {
        if (this.traps[i].tower !== t) continue;
        mine++;
        if (mine > (s.maxTraps || 24)) {
          this.removeTrap(this.traps[i], true);
          this.traps.splice(i, 1);
        }
      }
      MT.Audio.play('nail');
      return true;
    }

    removeTrap(tr, silent) {
      if (tr.gone) return;
      tr.gone = true;
      if (!silent && tr.p.mine) {
        this.explode(tr.x, tr.y, { tex: 'p_rocket', type: 'explosive', shred: 3, explode: tr.p.mine, moabDmg: Math.round((tr.p.moabDmg || 0) / 2) }, tr.tower);
      }
      const sp = tr.sprite;
      this.tweens.add({ targets: sp, alpha: 0, scale: sp.scale * 0.6, duration: 200, onComplete: () => sp.destroy() });
    }

    stepTraps(dt) {
      const T = this.traps;
      for (let i = T.length - 1; i >= 0; i--) {
        const tr = T[i];
        tr.life -= dt;
        // traps hit everything that steps on them, Camo included
        for (const e of this.queryEnemies(tr.x, tr.y, 40)) {
          if (e.dead || tr.hit.has(e.id) || !this.hittable(e, null, GROUND)) continue;
          if (U.dist2(tr.x, tr.y, e.x, e.y) > (10 + e.radius * 0.6) ** 2) continue;
          tr.hit.add(e.id);
          const kids = this.applyHit(e, tr.p, tr.tower);
          if (!kids) continue;
          kids.forEach((k) => tr.hit.add(k.id));
          tr.pierce--;
          if (tr.p.tex === 'fx_peel') this.fx.dust.explode(2, e.x, e.y);
          if (tr.pierce <= 0) break;
        }
        if (tr.pierce <= 0 || tr.life <= 0) {
          this.removeTrap(tr, tr.pierce > 0);
          T.splice(i, 1);
        } else if (tr.sprite.active) {
          tr.sprite.setAlpha(tr.life < 1.5 ? 0.4 + (tr.life / 1.5) * 0.6 : 1);
        }
      }
    }

    enemiesInRange(x, y, r, camo, air = true) {
      const out = [];
      for (const e of this.enemies) {
        if (e.dead || e.burrowed || (e.flying && !air) || (e.camo && !camo)) continue;
        const rr = r + e.radius * 0.5;
        if (U.dist2(x, y, e.x, e.y) <= rr * rr) out.push(e);
      }
      return out;
    }

    auraBlast(t) {
      const s = t.stats;
      const list = this.enemiesInRange(t.x, t.y, s.range, s.camo, s.air);
      const n = Math.min(list.length, s.proj.pierce);
      for (let i = 0; i < n; i++) this.applyHit(list[i], s.proj, t);
      this.fx.ring(t.x, t.y, s.range, 0xb3ecff, { disc: true, dur: 380 });
      this.fx.snow.explode(t.fused ? 22 : 10, t.x, t.y);
      MT.Audio.play('freeze');
    }

    ringBlast(t) {
      const s = t.stats;
      const list = this.enemiesInRange(t.x, t.y, s.range, s.camo, s.air);
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
      for (const t of this.units()) {
        [t.stats.ability, t.stats.ability2, t.stats.ability3].forEach((id) => id && out.push({ tower: t, id }));
      }
      return out;
    }

    useAbility(t, id) {
      const A = MT.ABILITIES[id];
      if ((t.abilityCd[id] || 0) > 0 || this.over) {
        MT.Audio.play('error');
        return;
      }
      t.abilityCd[id] = A.cd * t.cdMul;
      this.stat.abilities++;
      MT.Audio.play('ability');
      this.fx.abilityCast(t, A, id);
      this.hud.flashAbility(t, id);
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
      const pk = { img, value, farm, auto: s.autoCollect ? 0.9 : null, done: false };
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
      if (pk.farm) pk.farm.earned += pk.value;
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
      // boss music while one of the big endgame giants is on the field
      this.musicCheck -= real;
      if (this.musicCheck <= 0) {
        this.musicCheck = 1;
        const bossy = this.enemies.some((e) => !e.dead && (e.def.final || e.def.bossFight || e.type === 'zeppelin' || e.type === 'mecha' || e.type === 'goo' || e.type === 'phantom'));
        MT.Audio.music(bossy ? 'boss' : 'game');
      }
    }

    step(dt) {
      this.stat.time += dt;
      if (this.sandbox) {
        // unlimited bananas and lives
        if (this.money < 1e9) this.money = 1e9;
        this.lives = this.diff.lives;
      }
      if (this.mode === 'boss') MT.BossFight.step(this, dt);
      if (this.sbQueue.length) {
        this.sbT -= dt;
        while (this.sbT <= 0 && this.sbQueue.length) {
          const q = this.sbQueue.shift();
          this.spawnEnemy(q.type, { path: this.spawnCounter++ % this.paths.length, dist: 0, camo: q.camo, fort: q.fort });
          this.sbT += 0.14;
        }
      }
      if (this.roundActive) {
        this.roundTime += dt;
        const list = this.spawnList;
        while (this.spawnIdx < list.length && list[this.spawnIdx].t <= this.roundTime) {
          const s = list[this.spawnIdx++];
          this.spawnEnemy(s.type, { path: this.spawnCounter++ % this.paths.length, dist: 0, camo: s.camo, fort: s.fort });
        }
        for (const t of this.units()) {
          if (t.bananaTimes && t.bananaTimes.length && t.bananaTimes[0] <= this.roundTime) {
            t.bananaTimes.shift();
            this.spawnBanana(t);
          }
        }
      }
      for (const e of this.enemies) if (!e.dead) e.update(dt);
      if (this.over) return;
      this.rebuildGrid();
      this.assignShields();
      for (const t of this.towers) t.update(dt);
      for (const p of this.projectiles) if (!p.dead) p.update(dt);
      this.stepZones(dt);
      this.stepTraps(dt);
      MT.Giants.step(this, dt);
      MT.Abilities.step(this, dt);
      this.enemies = this.enemies.filter((e) => !e.dead);
      this.projectiles = this.projectiles.filter((p) => !p.dead);
      for (let i = this.timed.length - 1; i >= 0; i--) {
        this.timed[i].t -= dt;
        if (this.timed[i].t <= 0) this.timed.splice(i, 1);
      }
      for (const t of this.units()) for (const k in t.abilityCd) if (t.abilityCd[k] > 0) t.abilityCd[k] -= dt;
      for (const pk of this.pickups) {
        if (pk.auto != null && !pk.done) {
          pk.auto -= dt;
          if (pk.auto <= 0) this.collect(pk);
        }
      }
      if (this.pickups.length > 40 || (this.pickups.length && this.pickups[0].done)) this.pickups = this.pickups.filter((p) => !p.done);
      if (this.mode === 'classic' && this.roundActive && this.spawnIdx >= this.spawnList.length && this.enemies.length === 0) this.endRound();
    }

    renderFrame(time, dt) {
      for (const e of this.enemies) if (!e.dead) e.render(time, dt);
      for (const p of this.projectiles) if (!p.dead) p.render(dt);
      for (const t of this.towers) t.render(dt, time);
      for (const z of this.zones) {
        z.fxT -= dt;
        if (z.fxT <= 0) {
          z.fxT = 0.22;
          const ox = U.rand(-z.r, z.r) * 0.7, oy = U.rand(-z.r, z.r) * 0.45;
          if (z.kind === 'fire') this.fx.sparkle(z.x + ox, z.y + oy, 0xff7a1a);
          else this.fx.gas.explode(1, z.x + ox, z.y + oy);
        }
      }
      MT.Abilities.render(this, dt, time);
      MT.Giants.render(this, dt, time);
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
        if (!e.boss || e.dead || e.def.final || e.def.bossFight) continue;
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
      if (this.moving) {
        const t = this.moving.t;
        const x = this.pointer.x, y = this.pointer.y;
        const ok = this.canMoveTo(t, x, y) && this.moving.fee <= this.money;
        this.ghost.setPosition(x, y).setVisible(x < CFG.MAP_W).setTint(ok ? 0xffffff : 0xff8080);
        if (x < CFG.MAP_W) {
          const r = t.stats.range > 1000 ? 0 : t.stats.range + (t.stats.attack === 'plane' ? t.stats.orbit : 0);
          if (r) {
            rg.fillStyle(ok ? 0xffffff : 0xff3030, 0.14);
            rg.fillCircle(x, y, r);
            rg.lineStyle(2, ok ? 0xffffff : 0xff3030, 0.6);
            rg.strokeCircle(x, y, r);
          }
          rg.fillStyle(ok ? 0x5cff5c : 0xff3030, 0.35);
          rg.fillCircle(x, y, t.size);
          // dotted line from the old spot
          rg.lineStyle(2, 0xffffff, 0.5);
          const n = Math.floor(U.dist(t.x, t.y, x, y) / 14);
          for (let i = 0; i < n; i += 2) {
            const a = i / n, b = Math.min(1, (i + 1) / n);
            rg.lineBetween(U.lerp(t.x, x, a), U.lerp(t.y, y, a), U.lerp(t.x, x, b), U.lerp(t.y, y, b));
          }
        }
      } else if (this.placing) {
        const type = this.placing.type;
        const def = this.defOf(type);
        const x = this.pointer.x, y = this.pointer.y;
        const ok = x < CFG.MAP_W && this.canPlace(x, y, def.size, this.placeOpts(type)) && this.placeCost(type, x, y) <= this.money;
        if (def.waterOnly) {
          // show where the submarine is allowed to go
          const pulse = 0.7 + Math.sin(time * 0.008) * 0.25;
          for (const wa of this.layout.pools) {
            if (wa.type === 'river' || wa.type === 'sea') {
              MT.MapArt.waterDist(wa, 0, 0);
              const pts = wa._pts.map(([px, py]) => ({ x: px, y: py }));
              rg.lineStyle(wa.width - 8, 0x80deea, 0.22 * pulse);
              rg.strokePoints(pts, false);
            } else {
              rg.fillStyle(0x80deea, 0.22 * pulse);
              rg.fillCircle(wa.x, wa.y, wa.r - 4);
              rg.lineStyle(4, 0xe0f7fa, pulse);
              rg.strokeCircle(wa.x, wa.y, wa.r - 4);
            }
          }
          if (!this.layout.pools.length && !this.noWaterHint) {
            this.noWaterHint = true;
            this.hud.toast('This map has no water for submarines!', 1800);
          }
        }
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

    // ------------------------------------------------------------------ sandbox
    sandboxSend(type, n, camo, fort) {
      for (let i = 0; i < n; i++) this.sbQueue.push({ type, camo, fort });
      if (this.sbT < 0) this.sbT = 0;
    }

    sandboxRound(n) {
      if (this.roundActive) {
        this.hud.toast('Wait until the current round is over.', 1400);
        return;
      }
      this.round = Math.max(0, n - 1);
      this.startRound();
    }

    sandboxClear() {
      this.enemies.forEach((e) => {
        if (e.dead) return;
        this.fx.pop(e.x, e.y, e.boss);
        e.destroy();
      });
      this.enemies = [];
      this.sbQueue = [];
      if (this.roundActive) {
        this.spawnIdx = this.spawnList.length;
        this.endRound();
      }
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
