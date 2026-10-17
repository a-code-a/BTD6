// In-game HUD: sidebar shop, upgrade panel, round controls, abilities, overlays.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const X0 = MT.CFG.SIDEBAR_X;
  const DEPTH = 10000;

  class HUD {
    constructor(scene) {
      this.scene = scene;
      this.tip = new MT.UI.Tooltip(scene);
      this.last = {};
      this.root = scene.add.container(0, 0).setDepth(DEPTH);
      this.root.add(MT.UI.panel(scene, X0, 0, 260, 720, 'denim'));
      this.buildStats();
      this.buildShop();
      this.buildControls();
      this.upg = scene.add.container(X0, 104).setDepth(DEPTH + 1).setVisible(false);
      this.abilityC = scene.add.container(0, 0).setDepth(DEPTH - 5);
      this.abilityG = scene.add.graphics().setDepth(DEPTH - 4);
      this.abilityBtns = [];
      this.toastC = scene.add.container(MT.CFG.MAP_W / 2, 64).setDepth(DEPTH + 50).setAlpha(0);
      this.toastBg = scene.add.graphics();
      this.toastText = MT.text(scene, 0, 0, '', 22, { title: true });
      this.toastC.add([this.toastBg, this.toastText]);
      this.overlay = null;
      this.prev = scene.add.container(8, 8).setDepth(DEPTH - 6);
      this.prevCollapsed = false;
      if (scene.sandbox) this.buildSandbox();
      this.buildPowers();
      // round badge frame for the ability bar
      MT.Draw.make(scene, 'hud_abframe', 60, 60, (ctx) => {
        const D = MT.Draw;
        D.circlePath(ctx, 30, 31, 27);
        D.fs(ctx, 'rgba(0,0,0,0.35)');
        D.circlePath(ctx, 30, 30, 27);
        ctx.fillStyle = D.rad(ctx, 24, 22, 2, 30, 30, 27, [[0, '#3b5a8f'], [1, '#13213d']]);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = D.lin(ctx, 0, 3, 0, 57, [[0, '#fff3b0'], [0.5, '#e0a500'], [1, '#8a5a00']]);
        ctx.stroke();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = D.OL;
        D.circlePath(ctx, 30, 30, 29.5);
        ctx.stroke();
      });
    }

    // ------------------------------------------------------------ top stats
    buildStats() {
      const s = this.scene;
      this.root.add(MT.UI.panel(s, X0 + 10, 10, 240, 88, 'dark'));
      this.roundLabel = MT.text(s, X0 + 116, 30, 'ROUND 0/40', 22, { title: true, color: '#ffd83a' });
      this.root.add(this.roundLabel);
      // cheat: opens a menu where you pick how many bananas you get
      if (!s.sandbox) {
        this.cheatBtn = new MT.UI.Button(s, X0 + 224, 30, 34, 28, {
          style: 'yellow', label: '+$', size: 15,
          onClick: () => this.toggleCheat(),
          onHover: (on) => (on ? this.tip.show(X0 - 268, 14, 'Cheat menu', 'Choose how many bananas you get.\nUsing it switches off Gru Coins and achievements for this game.') : this.tip.hide()),
        }).setDepth(DEPTH + 2);
        this.buildCheat();
      }
      this.root.add(s.add.image(X0 + 34, 72, 'ic_coin').setScale(0.75 / S * 2 / 2 * 1.0).setDisplaySize(30, 30));
      this.moneyText = MT.text(s, X0 + 54, 72, '$0', 22, { title: true, ox: 0 });
      this.root.add(this.moneyText);
      this.root.add(s.add.image(X0 + 188, 72, 'ic_heart').setDisplaySize(26, 26));
      this.livesText = MT.text(s, X0 + 204, 72, '0', 22, { title: true, ox: 0 });
      this.root.add(this.livesText);
    }

    // ------------------------------------------------------------ cheat menu
    // drops down over the shop, below the banana counter so you see it go up
    buildCheat() {
      const s = this.scene;
      const C = MT.CFG;
      const W = 248, H = 342;
      this.cheatOpen = false;
      const c = (this.cheatPanel = s.add.container(X0 + 6, 102).setDepth(DEPTH + 3).setVisible(false));
      // swallow clicks so the shop cards underneath don't react
      c.add(s.add.zone(0, 0, W, H).setOrigin(0).setInteractive());
      c.add(MT.UI.panel(s, 0, 0, W, H, 'denim'));
      c.add(MT.text(s, W / 2, 24, 'CHEAT BANANAS', 20, { title: true, color: '#ffd83a' }));
      const B = (x, y, w, h, label, style, fn, size = 15) => {
        const b = new MT.UI.Button(s, x, y, w, h, { style, label, size, onClick: fn });
        c.add(b);
        return b;
      };
      B(W - 22, 24, 26, 26, 'X', 'red', () => this.toggleCheat(false), 13);
      const give = (v) => {
        this.toggleCheat(false);
        s.cheatMoney(v);
      };
      // quick picks
      const short = (v) => (v >= 1e9 ? v / 1e9 + 'B' : v >= 1e6 ? v / 1e6 + 'M' : v >= 1e3 ? v / 1e3 + 'K' : String(v));
      c.add(MT.text(s, 14, 52, 'Quick pick', 13, { ox: 0, color: '#cfe3ff' }));
      C.CHEAT_PRESETS.forEach((v, i) => B(44 + (i % 3) * 80, 84 + Math.floor(i / 3) * 44, 72, 36, '+' + short(v), 'yellow', () => give(v), 16));
      // custom amount: 100, 200, 500, 1K, 2K, 5K ... up to CHEAT_MAX
      const steps = [];
      for (let m = C.CHEAT_MIN; m <= C.CHEAT_MAX; m *= 10) [1, 2, 5].forEach((k) => m * k <= C.CHEAT_MAX && steps.push(m * k));
      c.add(MT.text(s, 14, 166, 'Custom amount', 13, { ox: 0, color: '#cfe3ff' }));
      const amt = MT.text(s, W / 2, 194, '', 24, { title: true, color: '#7CFF6B' });
      c.add(amt);
      let idx = steps.indexOf(MT.Save.settings().cheatAmount);
      if (idx < 0) idx = steps.indexOf(10000);
      const down10 = B(36, 230, 52, 32, '÷10', 'blue', () => setIdx(idx - 3), 17);
      const down = B(96, 230, 44, 32, '-', 'blue', () => setIdx(idx - 1), 20);
      const up = B(152, 230, 44, 32, '+', 'blue', () => setIdx(idx + 1), 20);
      const up10 = B(212, 230, 52, 32, '×10', 'blue', () => setIdx(idx + 3), 17);
      const setIdx = (i) => {
        idx = U.clamp(i, 0, steps.length - 1);
        amt.setText(U.money(steps[idx]));
        amt.scaleX = amt.width > W - 28 ? (W - 28) / amt.width : 1;
        [down10, down].forEach((b) => b.setEnabled(idx > 0));
        [up, up10].forEach((b) => b.setEnabled(idx < steps.length - 1));
      };
      setIdx(idx);
      B(W / 2, 274, 220, 38, 'GET BANANAS', 'green', () => {
        MT.Save.setSetting('cheatAmount', steps[idx]);
        give(steps[idx]);
      }, 18);
      c.add(MT.text(s, W / 2, 316, 'Using it turns off Gru Coins\nand achievements for this game.', 11, { color: '#ffb0a3', strokeThickness: 2 }));
    }

    toggleCheat(force) {
      if (!this.cheatPanel) return;
      this.cheatOpen = force != null ? force : !this.cheatOpen;
      this.cheatPanel.setVisible(this.cheatOpen);
      this.cheatBtn.setStyle(this.cheatOpen ? 'orange' : 'yellow');
      this.tip.hide();
    }

    // ------------------------------------------------------------ shop
    buildShop() {
      const s = this.scene;
      this.shop = s.add.container(0, 0).setDepth(DEPTH + 1);
      this.cards = [];
      const ids = MT.TOWER_ORDER.concat([s.heroId]);
      // four narrow cards per row so every minion (and the hero) fits
      const COLS = 4, CW = 58, CH = 97;
      ids.forEach((id, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        const x = X0 + 8 + col * 61, y = 106 + row * 101;
        const hero = MT.isHero(id);
        const def = hero ? MT.HEROES[id] : MT.TOWERS[id];
        const c = s.add.container(x + CW / 2, y + CH / 2);
        const bg = s.add.image(0, 0, MT.UI.panelKey(s, CW, CH, hero ? 'yellow' : 'card')).setScale(1 / S);
        const key = hero ? MT.TowerArt.heroKey(s, id, 1) : MT.TowerArt.key(s, id, [0, 0, 0]);
        const big = id === 'farm' || id === 'lab' || id === 'catapult';
        const icon = s.add.image(0, -9, key).setScale(hero ? 0.25 : big ? 0.26 : 0.29);
        const price = MT.text(s, 0, 34, '$0', 13, { title: true });
        const hk = MT.text(s, -21, -38, def.key, 11, { title: true, color: '#ffd166' });
        c.add([bg, icon, price, hk]);
        c.setSize(CW, CH);
        c.setInteractive({ useHandCursor: true });
        c.on('pointerover', () => {
          c.setScale(1.05);
          const cost = s.placeCost(id);
          // towers describe their trait in one string, heroes have a name + rules
          const trait = !def.trait ? '' : hero ? `\n★ ${def.trait.name}: ${def.trait.desc}` : `\n★ ${def.trait}`;
          this.tip.show(X0 - 268, y, `${def.name}  ·  ${U.money(cost)}`, def.desc + trait + `\nHotkey: ${def.key}`);
        });
        c.on('pointerout', () => {
          c.setScale(1);
          this.tip.hide();
        });
        c.on('pointerdown', () => {
          MT.Audio.init();
          if (s.placing && s.placing.type === id) s.cancelPlacing();
          else s.startPlacing(id);
        });
        this.shop.add(c);
        this.cards.push({ id, c, bg, icon, price });
      });
    }

    // ------------------------------------------------------------ controls
    buildControls() {
      const s = this.scene;
      this.playBtn = new MT.UI.Button(s, X0 + 98, 652, 170, 62, {
        style: 'green', icon: 'ic_play', label: 'PLAY', size: 26, iconSize: 0.6,
        onClick: () => s.playButton(),
      }).setDepth(DEPTH + 2);
      this.menuBtn = new MT.UI.Button(s, X0 + 222, 652, 58, 58, {
        style: 'blue', icon: 'ic_gear', iconSize: 0.62, onClick: () => this.togglePause(),
      }).setDepth(DEPTH + 2);
      this.autoBtn = MT.text(s, X0 + 130, 703, '', 13, { color: '#cfe3ff' }).setDepth(DEPTH + 2);
      this.autoBtn.setInteractive({ useHandCursor: true });
      this.autoBtn.on('pointerdown', () => {
        MT.Save.setSetting('autoStart', !MT.Save.settings().autoStart);
        this.refreshAuto();
        MT.Audio.play('click');
      });
      this.refreshAuto();
      this.onRoundState();
    }

    refreshAuto() {
      this.autoBtn.setText((MT.Save.settings().autoStart ? '☑' : '☐') + ' Auto-start rounds');
    }

    onRoundState() {
      const s = this.scene;
      if (!s.roundActive) {
        this.playBtn.setStyle('green').setLabel('PLAY');
        this.playBtn.icon.setTexture('ic_play');
      } else {
        const fast = s.speed > 1;
        this.playBtn.setStyle(fast ? 'yellow' : 'blue').setLabel(fast ? 'FAST x3' : 'SPEED');
        this.playBtn.icon.setTexture('ic_ff');
      }
    }

    setPlacing(type) {
      this.cards.forEach((cd) => cd.bg.setTint(cd.id === type ? 0xfff2a8 : 0xffffff));
    }

    // ------------------------------------------------------------ per frame
    update(dt) {
      const s = this.scene;
      const money = Math.floor(s.money);
      const total = s.freeplay || s.sandbox ? '' : '/' + s.diff.rounds;
      const rl = s.mode === 'boss' ? (s.round > 0 ? `WAVE ${s.round}` : 'BOSS BATTLE') : `ROUND ${Math.max(1, s.round)}${total}`;
      if (rl !== this.last.round) this.roundLabel.setText((this.last.round = rl));
      if (money !== this.last.money) {
        this.moneyText.setText(s.sandbox ? 'UNLIMITED' : U.money(money));
        // squeeze big numbers so they never run into the lives counter
        const maxW = 116;
        this.moneyText.scaleX = this.moneyText.width > maxW ? maxW / this.moneyText.width : 1;
        this.last.money = money;
        this.refreshAffordability();
      }
      const lives = Math.max(0, Math.ceil(s.lives));
      if (lives !== this.last.lives) {
        this.livesText.setText(s.sandbox ? 'MAX' : String(lives));
        if (this.last.lives != null && lives < this.last.lives) {
          this.livesText.setColor('#ff6b6b');
          s.time.delayedCall(250, () => this.livesText.setColor('#ffffff'));
        }
        this.last.lives = lives;
      }
      this.updateAbilities();
      this.refreshTrait();
    }

    // little bounce + green tint on the banana counter
    flashMoney() {
      const s = this.scene;
      s.tweens.killTweensOf(this.moneyText);
      this.moneyText.scaleY = 1;
      this.moneyText.setColor('#7CFF6B');
      s.tweens.add({ targets: this.moneyText, scaleY: 1.3, duration: 120, yoyo: true, ease: 'Quad.easeOut', onComplete: () => this.moneyText.setColor('#ffffff') });
    }

    refreshAffordability() {
      const s = this.scene;
      this.cards.forEach((cd) => {
        const cost = s.placeCost(cd.id);
        const hero = MT.isHero(cd.id);
        const ok = cost <= s.money && !(hero && s.heroPlaced);
        cd.price.setText(hero && s.heroPlaced ? 'PLACED' : U.money(cost));
        // keep long prices inside the narrow card
        cd.price.scaleX = cd.price.width > 54 ? 54 / cd.price.width : 1;
        if (cd.ok !== ok) {
          cd.ok = ok;
          cd.price.setColor(ok ? '#ffffff' : '#ff7b7b');
          cd.icon.setAlpha(ok ? 1 : 0.55);
        }
      });
      if (this.upgRefs) this.refreshUpgradeButtons();
    }

    onTowersChanged() {
      this.rebuildAbilities();
      this.refreshAffordability();
    }

    // ------------------------------------------------------------ selection panel
    showShop() {
      this.shop.setVisible(true);
      this.upg.setVisible(false);
      this.upgRefs = null;
      this.traitHero = null;
      this.planMenu = null;
    }

    showTower(t) {
      const s = this.scene;
      this.shop.setVisible(false);
      this.tip.hide();
      this.traitHero = null;
      this.planMenu = null;
      this.upg.removeAll(true);
      this.upg.setVisible(true);
      const add = (o) => (this.upg.add(o), o);
      add(MT.UI.panel(s, 6, 0, 248, 504, 'dark'));
      const key = t.texKey();
      add(s.add.image(42, 42, key).setScale(t.hero ? 0.36 : t.omega ? 0.17 : t.ultimate ? 0.24 : t.fused ? 0.32 : 0.4));
      const nameCol = t.omega ? '#ffffff' : t.fused ? t.def.fusion.color : t.hero ? t.def.color || '#ffd83a' : '#ffffff';
      const nameT = add(MT.text(s, 78, 22, t.name, 20, { title: true, ox: 0, color: nameCol }));
      if (nameT.width > 128) nameT.setScale(128 / nameT.width);
      this.popsText = add(MT.text(s, 78, 43, `Pops: ${Math.floor(t.totalPops)}`, 13, { ox: 0, color: '#cfe3ff' }));
      const close = new MT.UI.Button(s, 230, 22, 32, 32, { style: 'red', icon: 'ic_close', iconSize: 0.6, onClick: () => s.select(null) });
      add(close);
      // MOVE: relocate the tower for a small fee (Lucy grapples there for free)
      const fee = s.moveFee(t);
      const grapple = !!t.stats.grapple;
      this.moveBtn = add(new MT.UI.Button(s, 190, 47, 52, 22, {
        style: grapple ? 'teal' : 'blue', label: grapple ? 'GRAPPLE' : 'MOVE', size: grapple ? 10 : 12,
        onClick: () => s.startMove(t),
        onHover: (on) => (on ? this.tip.show(X0 - 268, 30, grapple ? 'Grapple' : 'Move', grapple ? `Lucy zips to a new spot for free. Then the grapple needs ${t.stats.grapple}s to recharge.\nHotkey: M` : `Pick this tower up and put it somewhere else for ${U.money(fee)}.\nHotkey: M`) : this.tip.hide()),
      }));
      // the tower's signature mechanic (full text on hover)
      if (t.hero) this.buildHeroTrait(t, add);
      else if (t.def.trait && !t.omega) {
        const [label] = t.def.trait.split(':');
        const tr = add(MT.text(s, 78, 64, '★ ' + label, 12, { ox: 0, color: '#ffd166', strokeThickness: 3 }));
        if (tr.width > 170) tr.setScale(170 / tr.width);
        tr.setInteractive({ useHandCursor: true });
        tr.on('pointerover', () => this.tip.show(X0 - 268, 40, label, t.def.trait.slice(label.length + 1).trim()));
        tr.on('pointerout', () => this.tip.hide());
      }
      this.upgRefs = { t, rows: [] };
      let y = 84;
      if (t.stats.attack !== 'none' || t.hero) {
        const atk = t.stats.attack;
        const what = atk === 'plane' ? 'Flight' : atk === 'trap' ? 'Nails' : 'Target';
        add(MT.text(s, 22, y + 14, what, 13, { ox: 0, color: '#cfe3ff' }));
        add(new MT.UI.Button(s, 96, y + 14, 30, 28, { style: 'blue', label: '<', size: 18, onClick: () => s.cycleTarget(t, -1) }));
        const mode = MT.targetName(t);
        const spot = mode === 'Spot';
        const mt = add(MT.text(s, 152, y + 14, spot ? 'Spot ✎' : mode, mode.length > 7 ? 15 : 17, { title: true, color: spot ? '#ffab91' : '#ffffff' }));
        if (mt.width > 80) mt.setScale(80 / mt.width);
        mt.setInteractive({ useHandCursor: true });
        mt.on('pointerover', () => this.tip.show(X0 - 268, 84, `${what}: ${mode}`, (MT.MODE_TIPS[mode] || '') + (spot ? '\nClick here to pick a new spot.' : '\nChange it with < > or Tab.')));
        mt.on('pointerout', () => this.tip.hide());
        mt.on('pointerdown', () => spot && s.startSpotting(t));
        add(new MT.UI.Button(s, 208, y + 14, 30, 28, { style: 'blue', label: '>', size: 18, onClick: () => s.cycleTarget(t, 1) }));
      } else {
        add(MT.text(s, 130, y + 14, this.infoLine(t), 13, { color: '#cfe3ff', wrap: 230 }));
      }
      y += 40;
      this.fuseBtn = this.ultBtn = this.omegaBtn = this.powerBtn = null;
      const giantRow = MT.Fusion.isPlainFused(t);
      const powerRow = t.ultimate || t.omega;
      if (t.hero) this.buildHeroRows(t, y, add);
      else if (t.omega) this.buildOmegaInfo(t, y, add);
      else if (t.fused) this.buildFusedInfo(t, y, add, giantRow ? 284 : 316);
      else {
        for (let pi = 0; pi < 3; pi++) this.buildPathRow(t, pi, 12, y + pi * 108, add);
      }
      if (giantRow) this.buildGiantButtons(t, add);
      if (powerRow) {
        // the giant tiers: SELL next to POWER UP
        add(new MT.UI.Button(s, 70, 470, 112, 42, {
          style: 'red', label: 'SELL', sub: U.money(t.sellValue()), size: 17, subSize: 11, onClick: () => s.sell(t),
        }));
        this.buildPowerButton(t, add);
      } else if (!t.hero && !t.fused && !t.omega && t.def.fusion) {
        add(new MT.UI.Button(s, 70, 470, 112, 42, {
          style: 'red', label: 'SELL', sub: U.money(t.sellValue()), size: 17, subSize: 11, onClick: () => s.sell(t),
        }));
        this.fuseBtn = add(new MT.UI.Button(s, 192, 470, 120, 42, {
          style: 'purple', label: 'FUSE', sub: '', size: 18, subSize: 11,
          onClick: () => MT.Fusion.fuse(s, t),
          onDisabledClick: () => {
            const st = MT.Fusion.status(s, t);
            if (st.reason) this.toast(st.reason, 2200);
          },
          onHover: (on) => {
            if (!on) {
              this.tip.hide();
              s.fuseHover = null;
              return;
            }
            const f = t.def.fusion;
            const st = MT.Fusion.status(s, t);
            s.fuseHover = MT.Fusion.candidates(s, t);
            this.tip.show(X0 - 268, 420, `SUPER FUSION: ${f.name}`, `${f.desc}\nAbility: ${MT.ABILITIES[f.base.ability].name}\nCost: ${U.money(st.cost || s.price(f.cost))} + 3 ${t.def.name}s with a tier 4 upgrade.` + (st.reason ? `\n${st.reason}` : '\nHotkey: F'));
          },
        }));
      } else {
        add(new MT.UI.Button(s, 130, 470, 228, 42, {
          style: 'red', label: `SELL  ${U.money(t.sellValue())}`, size: 20, onClick: () => s.sell(t),
        }));
      }
      this.refreshUpgradeButtons();
    }

    // short stat lines for a tower's current stats
    statLines(t) {
      const st = t.stats;
      const p = st.proj;
      const lines = [];
      if (st.attack === 'none') {
        if (t.type === 'farm') lines.push(this.infoLine(t));
      } else {
        lines.push(`Range: ${st.range > 1000 ? 'whole map' : Math.round(st.range)}`);
        lines.push(`Attacks per second: ${(1 / st.rate).toFixed(1)}${st.count > 1 ? `  ×${st.count}` : ''}${st.planes > 1 ? `  ×${st.planes} planes` : ''}`);
        if (p) {
          // with damage buffs and POWER UP stars included
          const dm = t.dmgMul > 1 ? t.dmgMul : 1;
          const dmg = Math.round((p.explode ? p.explode.dmg : p.dmg) * dm);
          lines.push(`Damage: ${dmg}${p.moabDmg ? `  (+${Math.round(p.moabDmg * dm)} vs giants)` : ''}`);
          if (st.attack !== 'aura' && st.attack !== 'ring') lines.push(`Pierce: ${p.explode ? p.explode.pierce : p.pierce}`);
        }
        lines.push(`Camo: ${st.camo ? 'yes' : 'no'}   ·   Anti-air: ${st.air ? 'yes' : 'no'}`);
      }
      if (st.buff) lines.push('Buffs nearby towers');
      return lines;
    }

    buildFusedInfo(t, y, add, h) {
      const s = this.scene;
      const f = t.def.fusion;
      add(MT.UI.panel(s, 12, y, 236, h, 'card'));
      add(MT.text(s, 130, y + 18, t.ultimate ? 'ULTIMATE' + (t.powerLv ? `  ★${t.powerLv}` : '') : 'SUPER FUSION', 16, { title: true, color: f.color }));
      const desc = t.ultimate
        ? `★ ${f.ultimate.mech}: ${f.ultimate.desc} Plus 2.5x damage and a stronger ability.`
        : f.desc;
      const descT = add(MT.text(s, 24, y + 34, desc, 12, { ox: 0, oy: 0, wrap: 212, color: '#e8f1ff', strokeThickness: 3, align: 'left' }));
      const statY = y + 42 + descT.height;
      add(MT.text(s, 24, statY, this.statLines(t).join('\n'), 13, { ox: 0, oy: 0, color: '#b8ffb0', strokeThickness: 3, align: 'left', lineSpacing: 2 }));
      const A = MT.ABILITIES[t.stats.ability];
      if (A) {
        const ay = y + h - 52;
        add(s.add.image(42, ay + 12, A.icon).setScale(0.62 / S));
        add(MT.text(s, 68, ay, A.name, 15, { title: true, ox: 0, color: '#ffd83a' }));
        add(MT.text(s, 68, ay + 12, A.desc, 11, { ox: 0, oy: 0, wrap: 172, color: '#e8f1ff', strokeThickness: 3, align: 'left' }));
      }
    }

    buildOmegaInfo(t, y, add) {
      const s = this.scene;
      add(MT.UI.panel(s, 12, y, 236, 316, 'card'));
      add(MT.text(s, 130, y + 18, 'OMEGA MECH' + (t.powerLv ? `  ★${t.powerLv}` : ''), 16, { title: true, color: '#ffffff' }));
      const elems = t.subs.map((u) => MT.OMEGA_ELEMENTS[u.type]).join(', ');
      const beamT = add(MT.text(s, 24, y + 32, `Omega Beam every 5s pierces the whole map: ${elems}.`, 11, { ox: 0, oy: 0, wrap: 212, color: '#ffd83a', strokeThickness: 3, align: 'left' }));
      const top = y + 38 + beamT.height;
      const slotName = ['BACK', 'LEFT ARM', 'RIGHT ARM'];
      t.subs.forEach((u, i) => {
        const ry = top + i * 74;
        const f = u.def.fusion;
        // the part's slot on the mech sits on its own line above its name
        add(MT.text(s, 66, ry + 2, slotName[i], 9, { ox: 0, color: '#cfe3ff', strokeThickness: 2 }));
        add(s.add.image(40, ry + 32, MT.TowerArt.fusedKey(s, u.type)).setScale(0.2));
        const nm = add(MT.text(s, 66, ry + 16, f.name, 14, { title: true, ox: 0, color: f.color }));
        if (nm.width > 172) nm.setScale(172 / nm.width);
        const st = u.stats, p = st.proj;
        const bits = [];
        if (st.attack !== 'none' && p) bits.push(`${Math.round((p.explode ? p.explode.dmg : p.dmg) * Math.max(1, u.dmgMul))} dmg`, `${(1 / st.rate).toFixed(1)}/s`);
        else if (u.type === 'farm') bits.push(`+${U.money(st.flat)}/round`);
        if (st.buff) bits.push('buffs');
        add(MT.text(s, 66, ry + 33, bits.join(' · '), 11, { ox: 0, color: '#b8ffb0', strokeThickness: 3 }));
        const A = MT.ABILITIES[st.ability];
        if (A) {
          add(s.add.image(76, ry + 54, A.icon).setScale(0.36 / S));
          add(MT.text(s, 92, ry + 54, A.name, 12, { ox: 0, color: '#ffd83a', strokeThickness: 3 }));
        }
      });
    }

    // fused towers can go one step further: Ultimate (same kind) or Omega (mixed)
    buildGiantButtons(t, add) {
      const s = this.scene;
      const hoverTip = (title, body, cands) => (on) => {
        if (!on) {
          this.tip.hide();
          s.fuseHover = null;
          return;
        }
        s.fuseHover = cands();
        this.tip.show(X0 - 268, 380, title, body());
      };
      this.ultBtn = add(new MT.UI.Button(s, 70, 428, 112, 36, {
        style: 'yellow', label: 'ULTIMATE', size: 14, sub: '', subSize: 10,
        onClick: () => MT.Fusion.fuseUltimate(s, t),
        onDisabledClick: () => {
          const st = MT.Fusion.ultimateStatus(s, t);
          if (st.reason) this.toast(st.reason, 2200);
        },
        onHover: hoverTip(`ULTIMATE: ${t.def.fusion.ultimate.name}`, () => {
          const st = MT.Fusion.ultimateStatus(s, t);
          const ul = t.def.fusion.ultimate;
          return `Merge 3 ${t.def.fusion.name}s into a brand-new giant.\n★ ${ul.mech}: ${ul.desc}\nAlso 2.5x damage and a stronger ${MT.ABILITIES[t.def.fusion.base.ability].name}.\nCost: ${U.money(st.cost || 0)}` + (st.reason ? `\n${st.reason}` : '');
        }, () => MT.Fusion.ultimateCandidates(s, t)),
      }));
      this.omegaBtn = add(new MT.UI.Button(s, 192, 428, 120, 36, {
        style: 'purple', label: 'OMEGA', size: 15, sub: '', subSize: 10,
        onClick: () => MT.Fusion.fuseOmega(s, t),
        onDisabledClick: () => {
          const st = MT.Fusion.omegaStatus(s, t);
          if (st.reason) this.toast(st.reason, 2200);
        },
        onHover: hoverTip('OMEGA TOWER', () => {
          const st = MT.Fusion.omegaStatus(s, t);
          const parts = MT.Fusion.omegaCandidates(s, t).map((o) => o.def.fusion.name).join(' + ');
          return `Build a giant Omega Mech from 3 super towers of DIFFERENT kinds: this one becomes its back, the others its arm weapons. Its core fires the Omega Beam, mixing all three powers.\nNow: ${parts}\nCost: ${U.money(st.cost || 0)}` + (st.reason ? `\n${st.reason}` : '');
        }, () => MT.Fusion.omegaCandidates(s, t)),
      }));
    }

    // what n POWER UP stars give
    powerLine(t, n = t.powerLv) {
      const P = MT.POWER;
      const income = t.type === 'farm' || t.type === 'lab' || (t.subs && t.subs.some((u) => u.type === 'farm' || u.type === 'lab'));
      return `★${n}: +${Math.round(P.dmg * n * 100)}% damage, +${Math.round(P.speed * n * 100)}% speed` + (income ? `, +${Math.round(P.income * n * 100)}% income` : '');
    }

    // Ultimates and Omega Mechs: pour bananas into POWER UP stars
    buildPowerButton(t, add) {
      const s = this.scene;
      const P = MT.POWER;
      this.powerBtn = add(new MT.UI.Button(s, 192, 470, 120, 42, {
        style: 'yellow', label: '', size: 16, sub: '', subSize: 11,
        onClick: () => MT.Fusion.powerUp(s, t),
        onDisabledClick: () => {
          const st = MT.Fusion.powerStatus(s, t);
          if (st.reason) this.toast(st.reason, 1800);
        },
        onHover: (on) => {
          if (!on) return this.tip.hide();
          const st = MT.Fusion.powerStatus(s, t);
          const now = t.powerLv ? `Now ${this.powerLine(t)}\n` : '';
          const next = st.max ? 'This giant is at full power!' : `Next ${this.powerLine(t, t.powerLv + 1)}\nCost: ${U.money(st.cost || 0)}   ·   Hotkey: ,`;
          this.tip.show(X0 - 268, 400, 'POWER UP', `Pour bananas into this giant to make it even stronger. Every ★ adds +${Math.round(P.dmg * 100)}% damage and +${Math.round(P.speed * 100)}% speed to all of its attacks, up to ★${P.max}.\n${now}${next}`);
        },
      }));
    }

    infoLine(t) {
      const st = t.stats;
      if (t.type === 'farm') {
        const v = Math.round(st.value * st.valueMul);
        return `${st.bananas} bananas × ${U.money(v)}` + (st.flat ? ` + ${U.money(st.flat)}` : '') + ' per round';
      }
      if (t.type === 'lab') return 'Buffs towers inside its ring';
      return '';
    }

    buildPathRow(t, pi, x, y, add) {
      const s = this.scene;
      const path = t.def.paths[pi];
      const row = s.add.container(x, y);
      add(row);
      row.add(MT.UI.panel(s, 0, 0, 236, 104, 'card'));
      for (let j = 0; j < 4; j++) {
        const g = s.add.graphics();
        const owned = j < t.tiers[pi];
        g.fillStyle(owned ? 0x7be35a : 0x1b335c, 1);
        g.fillRoundedRect(12 + j * 15, 11, 12, 12, 3);
        g.lineStyle(1.5, 0x2a1d14, 1);
        g.strokeRoundedRect(12 + j * 15, 11, 12, 12, 3);
        row.add(g);
      }
      row.add(MT.text(s, 76, 17, path.name.toUpperCase(), 11, { ox: 0, color: '#ffd166', strokeThickness: 3 }));
      const state = t.pathState(pi);
      const up = path.ups[t.tiers[pi]];
      const nameT = MT.text(s, 12, 40, up ? up.name : path.ups[3].name, 15, { title: true, ox: 0 });
      row.add(nameT);
      const desc = MT.text(s, 12, 58, up ? up.desc : 'Fully upgraded!', 11, { ox: 0, oy: 0, wrap: 142, color: '#e8f1ff', strokeThickness: 3, align: 'left' });
      row.add(desc);
      const btn = new MT.UI.Button(s, 196, 66, 70, 52, {
        style: 'green', label: '', size: 16, sub: '', subSize: 11,
        onClick: () => s.buyUpgrade(t, pi),
      });
      row.add(btn);
      if (state === 'closed') {
        row.setAlpha(0.6);
        nameT.setColor('#c0c8d4');
      }
      this.upgRefs.rows.push({ pi, btn, state, up });
    }

    // the hero's signature trait: its name (hover for the rules) and a live
    // status, or the button that drives it (Gru's PLAN, Nefario's GADGET, Agnes' FRIEND)
    buildHeroTrait(t, add) {
      const s = this.scene;
      const T = t.def.trait;
      if (!T) return;
      const tr = add(MT.text(s, 78, 67, '★ ' + T.name, 12, { ox: 0, color: '#ffd166', strokeThickness: 3 }));
      if (tr.width > 84) tr.setScale(84 / tr.width);
      tr.setInteractive({ useHandCursor: true });
      tr.on('pointerover', () => this.tip.show(X0 - 268, 40, `★ ${T.name}`, MT.HeroTraits.tooltip(s, t)));
      tr.on('pointerout', () => this.tip.hide());
      this.traitBtn = this.traitText = null;
      const btn = {
        plan: ['purple', () => this.togglePlanMenu(t)],
        gadgets: ['teal', () => MT.HeroTraits.startPick(s, t, 'gadget')],
        friend: ['purple', () => MT.HeroTraits.startPick(s, t, 'friend')],
      }[T.id];
      if (btn) {
        this.traitBtn = add(new MT.UI.Button(s, 208, 71, 80, 22, {
          style: btn[0], label: '', size: 11, onClick: btn[1],
          onHover: (on) => (on ? this.tip.show(X0 - 268, 40, `★ ${T.name}`, MT.HeroTraits.tooltip(s, t)) : this.tip.hide()),
        }));
      } else this.traitText = add(MT.text(s, 206, 71, '', 10, { color: '#b8ffb0', strokeThickness: 3 }));
      this.traitHero = t;
      this.refreshTrait(true);
    }

    // once per frame while a hero is selected (Guard, cooldowns, interest change all the time)
    refreshTrait(force) {
      const t = this.traitHero;
      if (!t || !this.upg.visible) return;
      const s = this.scene;
      if (t.stats.grapple && this.moveBtn) this.moveBtn.setEnabled(!(t.grappleCd > 0));
      if (this.planMenu) this.planMenu.refresh();
      const st = MT.HeroTraits.status(s, t);
      if (!force && st === this.last.trait) return;
      this.last.trait = st;
      if (this.traitText) this.traitText.setText(st);
      else if (this.traitBtn) {
        const id = t.def.trait.id;
        const label = id === 'plan' ? st : id === 'gadgets' ? `GADGET ${st}` : t.friend ? `FRIEND ♥${t.hearts || 0}` : 'PICK FRIEND';
        this.traitBtn.setLabel(label);
        this.traitBtn.label.setScale(1);
        if (this.traitBtn.label.width > 72) this.traitBtn.label.setScale(72 / this.traitBtn.label.width);
      }
    }

    // Gru's Master Plan: a little menu with every unlocked plan
    togglePlanMenu(t) {
      const s = this.scene;
      if (this.planMenu) {
        this.planMenu.destroy();
        this.planMenu = null;
        return;
      }
      const H = MT.HeroTraits;
      const list = t.stats.plans;
      const c = s.add.container(6, 86);
      const h = 34 + list.length * 50;
      c.add(s.add.zone(0, 0, 248, h).setOrigin(0).setInteractive());
      c.add(MT.UI.panel(s, 0, 0, 248, h, 'denim'));
      const head = MT.text(s, 124, 16, '', 13, { title: true, color: '#ffd83a' });
      c.add(head);
      const btns = list.map((id, i) => {
        const P = H.PLANS[id];
        const b = new MT.UI.Button(s, 124, 54 + i * 50, 228, 44, {
          style: id === t.plan ? 'purple' : 'dark', label: P.name, sub: P.desc(H.planValue(t, id)), size: 15, subSize: 10, color: P.color,
          onClick: () => {
            this.togglePlanMenu(t);
            H.setPlan(s, t, id);
          },
        });
        c.add(b);
        return b;
      });
      c.refresh = () => {
        const cd = t.planCd > 0 ? Math.ceil(t.planCd) : 0;
        const txt = cd ? `NEXT PLAN IN ${cd}s` : s.roundActive ? 'CHOOSE A PLAN  (then 20s wait)' : 'CHOOSE A PLAN  (free now)';
        if (head.text !== txt) head.setText(txt);
        btns.forEach((b, i) => b.setEnabled(!cd || list[i] === t.plan));
      };
      c.refresh();
      this.upg.add(c);
      this.planMenu = c;
    }

    buildHeroRows(t, y, add) {
      const s = this.scene;
      const H = t.def;
      const XP = MT.HERO_XP;
      const maxed = t.level >= MT.HERO_MAX_LEVEL;
      add(MT.UI.panel(s, 12, y, 236, 54, 'card'));
      add(MT.text(s, 24, y + 17, maxed ? `Level ${t.level}  ★${t.stars}` : `Level ${t.level}`, 19, { title: true, ox: 0, color: maxed && t.stars ? '#ffe082' : '#ffd83a' }));
      let frac, xpLabel;
      if (maxed) {
        // past level 10 the bar fills towards the next ascension star
        const need = MT.starXp(t.stars);
        frac = U.clamp(t.sxp / need, 0, 1);
        xpLabel = `${Math.floor(t.sxp)}/${need} XP`;
      } else {
        const next = XP[t.level], prev = XP[t.level - 1];
        frac = U.clamp((t.xp - prev) / (next - prev), 0, 1);
        xpLabel = `${Math.floor(t.xp)}/${next} XP`;
      }
      const g = s.add.graphics();
      g.fillStyle(0x1b335c, 1);
      g.fillRoundedRect(24, y + 32, 210, 11, 5.5);
      g.fillStyle(maxed ? 0xffc61a : 0x7fdbff, 1);
      g.fillRoundedRect(24, y + 32, Math.max(8, 210 * frac), 11, 5.5);
      g.lineStyle(2, 0x2a1d14, 1);
      g.strokeRoundedRect(24, y + 32, 210, 11, 5.5);
      add(g);
      add(MT.text(s, 234, y + 17, xpLabel, 12, { ox: 1, color: '#cfe3ff' }));
      if (maxed) this.buildAscendRows(t, y + 60, add);
      else this.buildLevelList(t, y, add);
      const cost = s.heroLevelCost(t);
      this.heroBtn = new MT.UI.Button(s, 130, 424, 228, 40, {
        style: maxed ? 'yellow' : 'blue', label: maxed ? `ASCEND ★${t.stars + 1}  ${U.money(cost)}` : `LEVEL UP  ${U.money(cost)}`, size: 18,
        onClick: () => s.buyHeroLevel(t),
        onHover: (on) => {
          if (!on) return this.tip.hide();
          if (maxed) this.tip.show(X0 - 268, 360, 'Ascend', 'Spend bananas to earn the next ★ right away. Stars also come by themselves from round XP. There is no star limit: every star makes the hero and its Command aura stronger.');
          else this.tip.show(X0 - 268, 360, 'Level up', 'Buy the XP for the next level. Past level 10 the hero ascends and earns ★ stars without limit.');
        },
      });
      add(this.heroBtn);
    }

    // level 10+: what the current stars give and what the next one adds
    buildAscendRows(t, y, add) {
      const s = this.scene;
      const partner = MT.TOWERS[t.def.partner];
      if (partner) {
        const pt = add(MT.text(s, 18, y, `Partner tower: ${partner.name} (2x Command)`, 11, { ox: 0, oy: 0, color: '#ffd166', strokeThickness: 3 }));
        if (pt.width > 226) pt.setScale(226 / pt.width);
      }
      y += 18;
      add(MT.text(s, 18, y, 'ASCENSION', 15, { title: true, ox: 0, oy: 0, color: '#ffe082' }));
      add(MT.text(s, 238, y + 3, `now  →  ★${t.stars + 1}`, 11, { ox: 1, oy: 0, color: '#9fb3d1', strokeThickness: 3 }));
      y += 21;
      const stripes = s.add.graphics();
      add(stripes);
      MT.ascendRows(t.stars).forEach(([label, cur, nxt], i) => {
        if (i % 2 === 0) {
          stripes.fillStyle(0x1b335c, 0.6);
          stripes.fillRoundedRect(14, y - 2, 232, 17, 4);
        }
        add(MT.text(s, 20, y, label, 11, { ox: 0, oy: 0, color: '#cfe3ff', strokeThickness: 3 }));
        add(MT.text(s, 172, y, cur, 11, { ox: 1, oy: 0, color: t.stars ? '#b8ffb0' : '#8094b3', strokeThickness: 3 }));
        add(MT.text(s, 184, y, '→', 11, { oy: 0, color: '#9fb3d1', strokeThickness: 3 }));
        add(MT.text(s, 238, y, nxt, 11, { ox: 1, oy: 0, color: '#ffe082', strokeThickness: 3 }));
        y += 17;
      });
      add(MT.text(s, 130, y + 4, MT.ascendMilestone(t.stars), 11, { oy: 0, wrap: 230, color: '#ff9cf0', strokeThickness: 3 }));
    }

    buildLevelList(t, y, add) {
      const s = this.scene;
      const H = t.def;
      // the level list must end above the LEVEL UP button
      const top = y + 60, bottom = 402;
      const make = (l, size, wrap) => add(MT.text(s, 18, 0, `${l <= t.level ? '✔' : '·'} ${l}. ${H.levels[l].desc}`, size, {
        ox: 0, oy: 0, wrap, color: l <= t.level ? '#b8ffb0' : '#9fb3d1', strokeThickness: 3, align: 'left',
      }));
      const stack = (lines) => {
        let yy = top;
        lines.forEach((line) => {
          line.setY(yy);
          yy += line.height;
        });
        return yy;
      };
      // all ten levels, a bit smaller if needed
      let lines = [];
      for (let l = 1; l <= 10; l++) lines.push(make(l, 11, 226));
      if (stack(lines) <= bottom) return;
      lines.forEach((line) => line.setFontSize(10).setWordWrapWidth(232, true));
      if (stack(lines) <= bottom) return;
      // still too long: the levels already reached fold into one line (hover to read them)
      lines.forEach((line) => line.destroy());
      lines = [];
      const done = Math.max(0, t.level - 1);
      if (done) {
        const sum = add(MT.text(s, 18, 0, `✔ Levels 1-${done} unlocked  (hover to read)`, 10, { ox: 0, oy: 0, color: '#b8ffb0', strokeThickness: 3 }));
        sum.setInteractive({ useHandCursor: true });
        sum.on('pointerover', () => this.tip.show(X0 - 268, 140, `${H.name}: levels 1-${done}`, H.levels.slice(1, done + 1).map((L, i) => `${i + 1}. ${L.desc}`).join('\n')));
        sum.on('pointerout', () => this.tip.hide());
        lines.push(sum);
      }
      for (let l = done + 1; l <= 10; l++) lines.push(make(l, 10, 232));
      if (stack(lines) <= bottom) return;
      // and if even that does not fit, the last ones hide behind a "more" line
      const more = add(MT.text(s, 18, 0, '·', 10, { ox: 0, oy: 0, color: '#9fb3d1', strokeThickness: 3 }));
      while (stack(lines.concat([more])) > bottom && lines.length > (done ? 2 : 1)) lines.pop().destroy();
      const from = done + lines.length - (done ? 1 : 0) + 1; // first hidden level
      more.setText(`· Levels ${from}-10  (hover to read)`);
      more.setInteractive({ useHandCursor: true });
      more.on('pointerover', () => this.tip.show(X0 - 268, 200, `${H.name}: levels ${from}-10`, H.levels.slice(from).map((L, i) => `${from + i}. ${L.desc}`).join('\n')));
      more.on('pointerout', () => this.tip.hide());
      stack(lines.concat([more]));
    }

    refreshUpgradeButtons() {
      const R = this.upgRefs;
      if (!R) return;
      const s = this.scene;
      const t = R.t;
      if (this.popsText) this.popsText.setText(`Pops: ${Math.floor(t.totalPops)}`);
      if (this.moveBtn) this.moveBtn.setEnabled(s.moveFee(t) <= s.money && !(t.grappleCd > 0));
      if (this.fuseBtn) {
        const st = MT.Fusion.status(s, t);
        this.fuseBtn.setEnabled(st.can).setSub(st.have != null ? `${Math.min(st.have, MT.Fusion.NEEDED)}/${MT.Fusion.NEEDED} maxed` : '');
      }
      if (this.ultBtn) {
        const st = MT.Fusion.ultimateStatus(s, t);
        this.ultBtn.setEnabled(st.can).setSub(st.have != null ? `${Math.min(st.have, 3)}/3 same` : '');
      }
      if (this.omegaBtn) {
        const st = MT.Fusion.omegaStatus(s, t);
        this.omegaBtn.setEnabled(st.can).setSub(st.have != null ? `${Math.min(st.have, 3)}/3 kinds` : '');
      }
      if (this.powerBtn) {
        const st = MT.Fusion.powerStatus(s, t);
        if (st.max) this.powerBtn.setLabel(`MAX ★${t.powerLv}`).setSub('full power').setEnabled(false);
        else this.powerBtn.setLabel(`POWER ★${t.powerLv + 1}`).setSub(U.money(st.cost || 0)).setEnabled(st.can);
      }
      if (t.hero && this.heroBtn) {
        const cost = s.heroLevelCost(t);
        this.heroBtn.setEnabled(cost <= s.money);
        return;
      }
      R.rows.forEach((r) => {
        const st = t.pathState(r.pi);
        if (st === 'max') {
          r.btn.setStyle('yellow').setLabel('MAX').setSub('').setEnabled(true);
          r.btn.disableInteractive();
        } else if (st === 'closed') {
          r.btn.setStyle('gray').setLabel('').setSub('CLOSED').setEnabled(false);
        } else {
          const cost = t.upgradeCost(r.pi);
          const ok = cost <= s.money;
          r.btn.setStyle(ok ? 'green' : 'gray').setLabel(U.money(cost)).setSub('BUY').setEnabled(ok);
        }
      });
    }

    // ------------------------------------------------------------ abilities
    rebuildAbilities() {
      const s = this.scene;
      this.abilityBtns.forEach((b) => b.c.destroy());
      this.abilityBtns = [];
      const list = s.abilityList().slice(0, 16);
      list.forEach((ab, i) => {
        const A = MT.ABILITIES[ab.id];
        const x = 36 + i * 62, y = 682;
        const c = s.add.container(x, y).setDepth(DEPTH - 5);
        const frame = s.add.image(0, 0, 'hud_abframe').setScale(1 / S);
        const img = s.add.image(0, 0, A.icon).setDisplaySize(42, 42);
        const cdText = MT.text(s, 0, 1, '', 18, { title: true }).setVisible(false);
        const key = MT.text(s, 19, -20, i < 9 ? String(i + 1) : '', 12, { title: true, color: '#ffd83a', strokeThickness: 3 });
        c.add([frame, img, cdText, key]);
        c.setSize(56, 56).setInteractive({ useHandCursor: true });
        c.on('pointerdown', () => s.useAbility(ab.tower, ab.id));
        c.on('pointerover', () => {
          c.setScale(1.1);
          const pw = ab.tower.hero && ab.tower.stars ? `\nAscension power: x${ab.tower.power.toFixed(1)}` : '';
          this.tip.show(x - 20, y - 130, A.name, A.desc + `\nCooldown: ${Math.round(A.cd * ab.tower.cdMul)}s` + pw + (i < 9 ? `\nHotkey: ${i + 1}` : ''));
        });
        c.on('pointerout', () => {
          c.setScale(1);
          this.tip.hide();
        });
        this.abilityBtns.push({ c, img, cdText, ab, A, x, y, ready: true });
      });
    }

    // the badge pops when its ability is used
    flashAbility(t, id) {
      const b = this.abilityBtns.find((o) => o.ab.tower === t && o.ab.id === id);
      if (!b) return;
      const s = this.scene;
      s.tweens.killTweensOf(b.img);
      b.img.setDisplaySize(58, 58);
      s.tweens.add({ targets: b.img, displayWidth: 42, displayHeight: 42, duration: 260, ease: 'Back.easeOut' });
      s.fx.ring(b.x, b.y, 50, 0xffd83a, { dur: 380, force: true, depth: DEPTH });
    }

    useAbilitySlot(i) {
      const b = this.abilityBtns[i];
      if (b) this.scene.useAbility(b.ab.tower, b.ab.id);
    }

    updateAbilities() {
      const g = this.abilityG;
      const now = this.scene.time.now;
      g.clear();
      this.abilityBtns.forEach((b) => {
        const cd = b.ab.tower.abilityCd[b.ab.id] || 0;
        const max = b.A.cd * b.ab.tower.cdMul;
        if (cd > 0) {
          const f = Math.min(1, cd / max);
          g.fillStyle(0x05080f, 0.62);
          g.slice(b.x, b.y, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f, false);
          g.fillPath();
          g.lineStyle(3, 0x7fdbff, 0.9);
          g.beginPath();
          g.arc(b.x, b.y, 27, -Math.PI / 2 + Math.PI * 2 * f, Math.PI * 1.5, false);
          g.strokePath();
          b.img.setAlpha(0.6);
          b.cdText.setVisible(true).setText(String(Math.ceil(cd)));
          b.ready = false;
        } else {
          if (!b.ready) {
            // ready again: bounce + sparkle
            b.ready = true;
            this.scene.tweens.add({ targets: b.c, scale: { from: 1.3, to: 1 }, duration: 320, ease: 'Back.easeOut' });
            this.scene.fx.glow.particleTint = 0xffd83a;
            this.scene.fx.glow.explode(10, b.x, b.y);
            MT.Audio.play('ready');
          }
          b.img.setAlpha(1);
          b.cdText.setVisible(false);
          const pulse = 0.5 + 0.5 * Math.sin(now / 180 + b.x);
          g.lineStyle(6, 0xffd83a, 0.25 + 0.3 * pulse);
          g.strokeCircle(b.x, b.y, 31);
          // a shine sweeping around the rim
          const a = (now / 500 + b.x * 0.01) % (Math.PI * 2);
          g.lineStyle(3, 0xffffff, 0.8);
          g.beginPath();
          g.arc(b.x, b.y, 28, a, a + 0.7, false);
          g.strokePath();
        }
      });
    }

    // ------------------------------------------------------------ next round preview
    refreshPreview() {
      const s = this.scene;
      const c = this.prev;
      c.removeAll(true);
      let groups, label;
      if (s.mode === 'boss') {
        if (s.bossDown) return c.setVisible(false);
        groups = MT.Rounds.bossWave(s.round + 1, s.bossTier);
        label = s.round > 0 ? `NEXT WAVE ${s.round + 1}` : 'FIRST WAVE';
      } else {
        const n = s.round + 1;
        if (!s.freeplay && !s.sandbox && n > s.diff.rounds) return c.setVisible(false);
        groups = MT.Rounds.get(n);
        label = `NEXT: ROUND ${n}`;
      }
      const agg = [];
      groups.forEach((g) => {
        const k = g.type + (g.camo ? 'c' : '') + (g.fort ? 'f' : '') + (g.regrow ? 'r' : '');
        let a = agg.find((o) => o.k === k);
        if (!a) agg.push((a = { k, type: g.type, camo: g.camo, fort: g.fort, regrow: g.regrow, count: 0 }));
        a.count += g.count;
      });
      const items = agg.slice(0, 7);
      const title = MT.text(s, 12, 13, label + (this.prevCollapsed ? '  ▸' : ''), 13, { title: true, ox: 0, color: '#ffd83a', strokeThickness: 3 });
      const w = this.prevCollapsed ? title.width + 24 : Math.max(title.width + 24, 14 + items.length * 48);
      const h = this.prevCollapsed ? 26 : 74;
      const bg = s.add.graphics();
      bg.fillStyle(0x101624, 0.78);
      bg.fillRoundedRect(0, 0, w, h, 10);
      bg.lineStyle(2, 0xffd166, 0.55);
      bg.strokeRoundedRect(0, 0, w, h, 10);
      c.add([bg, title]);
      bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, 26), Phaser.Geom.Rectangle.Contains);
      bg.on('pointerdown', () => {
        this.prevCollapsed = !this.prevCollapsed;
        MT.Audio.play('click');
        this.refreshPreview();
      });
      if (!this.prevCollapsed) {
        items.forEach((a, i) => {
          const x = 30 + i * 48, y = 46;
          const def = MT.ENEMIES[a.type];
          const im = s.add.image(x, y, MT.EnemyArt.key(s, a.type, a.camo, a.fort, 0));
          const k = Math.min(32 / im.height, 34 / im.width);
          im.setScale(k);
          const cnt = MT.text(s, x + 18, y + 14, '×' + a.count, 12, { title: true, ox: 1, strokeThickness: 3 });
          c.add([im, cnt]);
          const tags = [];
          if (a.camo) tags.push('Camo');
          if (a.fort) tags.push('Fortified');
          if (a.regrow) tags.push('Regrow: grows back if left alone');
          if (def.flying) tags.push('Flying: needs anti-air');
          if (def.burrow) tags.push('Burrows underground');
          if (def.shield) tags.push('Shields its friends');
          if (def.armored) tags.push('Armored');
          if (def.immune) tags.push('Immune to ' + def.immune.map((d) => (d === 'cold' ? 'ice' : d)).join(' + '));
          if (def.heal) tags.push('Heals the mutants around it');
          if (def.rage) tags.push('Gets faster with every hit');
          if (a.regrow) c.add(s.add.image(x + 13, y - 10, 'fx_regrow').setDisplaySize(13, 13));
          im.setInteractive({ useHandCursor: false });
          im.on('pointerover', () => this.tip.show(8, 86, `${def.name} ×${a.count}`, (tags.length ? tags.join(' · ') + '\n' : '') + def.desc));
          im.on('pointerout', () => this.tip.hide());
          if (def.flying) c.add(MT.text(s, x - 16, y - 12, '✈', 11, { color: '#80d8ff', strokeThickness: 2, font: 'Arial' }));
        });
      }
      c.setVisible(true);
    }

    // ------------------------------------------------------------ sandbox panel
    buildSandbox() {
      const s = this.scene;
      const ids = MT.ENEMY_ORDER.concat(MT.BOSS_ORDER);
      this.sb = { round: 1, idx: 0, camo: false, fort: false, regrow: false };
      const W0 = MT.CFG.MAP_W;
      this.sbBtn = new MT.UI.Button(s, W0 - 74, 28, 132, 40, {
        style: 'purple', label: 'SANDBOX', size: 17,
        onClick: () => this.toggleSandbox(),
      }).setDepth(DEPTH + 3);
      const c = (this.sbPanel = s.add.container(W0 - 352, 54).setDepth(DEPTH + 3).setVisible(false));
      c.add(MT.UI.panel(s, 0, 0, 344, 352, 'denim'));
      c.add(MT.text(s, 172, 24, 'SANDBOX TOOLS', 20, { title: true, color: '#ff9cf0' }));
      const B = (x, y, w, h, label, style, fn, size = 15) => {
        const b = new MT.UI.Button(s, x, y, w, h, { style, label, size, onClick: fn });
        c.add(b);
        return b;
      };
      // round picker
      c.add(MT.text(s, 20, 58, 'Round', 14, { ox: 0, color: '#cfe3ff' }));
      const rt = MT.text(s, 172, 58, '', 18, { title: true });
      c.add(rt);
      const setR = (v) => {
        this.sb.round = U.clamp(v, 1, 200);
        rt.setText('ROUND ' + this.sb.round);
      };
      setR(1);
      B(80, 58, 36, 28, '-10', 'blue', () => setR(this.sb.round - 10), 12);
      B(116, 58, 30, 28, '-', 'blue', () => setR(this.sb.round - 1));
      B(228, 58, 30, 28, '+', 'blue', () => setR(this.sb.round + 1));
      B(264, 58, 36, 28, '+10', 'blue', () => setR(this.sb.round + 10), 12);
      B(172, 94, 200, 32, 'PLAY THIS ROUND', 'green', () => s.sandboxRound(this.sb.round), 15);
      // mutant sender
      c.add(MT.text(s, 20, 132, 'Send mutants', 14, { ox: 0, color: '#cfe3ff' }));
      const icon = s.add.image(172, 160, MT.EnemyArt.key(s, ids[0], false, false, 0));
      const name = MT.text(s, 172, 192, '', 14, { title: true });
      c.add([icon, name]);
      const setT = (i) => {
        this.sb.idx = (i + ids.length) % ids.length;
        const id = ids[this.sb.idx];
        icon.setTexture(MT.EnemyArt.key(s, id, this.sb.camo, this.sb.fort, 0));
        icon.setScale(Math.min(40 / icon.height, 60 / icon.width));
        name.setText(MT.ENEMIES[id].name);
      };
      B(110, 162, 34, 34, '<', 'blue', () => setT(this.sb.idx - 1), 18);
      B(234, 162, 34, 34, '>', 'blue', () => setT(this.sb.idx + 1), 18);
      const camoB = B(70, 226, 96, 30, 'CAMO', 'gray', () => {
        this.sb.camo = !this.sb.camo;
        camoB.setStyle(this.sb.camo ? 'green' : 'gray');
        setT(this.sb.idx);
      }, 14);
      const fortB = B(172, 226, 96, 30, 'FORTIFIED', 'gray', () => {
        this.sb.fort = !this.sb.fort;
        fortB.setStyle(this.sb.fort ? 'green' : 'gray');
        setT(this.sb.idx);
      }, 12);
      const regB = B(121, 262, 198, 28, 'REGROW', 'gray', () => {
        this.sb.regrow = !this.sb.regrow;
        regB.setStyle(this.sb.regrow ? 'green' : 'gray');
      }, 13);
      const send = (n) => () => s.sandboxSend(ids[this.sb.idx], n, this.sb.camo, this.sb.fort, this.sb.regrow);
      B(258, 210, 50, 24, 'x1', 'yellow', send(1), 13);
      B(258, 238, 50, 24, 'x10', 'yellow', send(10), 13);
      B(310, 224, 46, 52, 'x50', 'orange', send(50), 13);
      setT(0);
      // utilities
      B(62, 318, 100, 32, 'CLEAR', 'red', () => s.sandboxClear(), 14);
      B(172, 318, 112, 32, 'COOLDOWNS', 'teal', () => {
        s.units().forEach((t) => (t.abilityCd = {}));
        this.toast('Ability cooldowns reset!', 1200);
      }, 13);
      // first click: level 10, every click after that: +5 ascension stars
      B(282, 318, 100, 32, 'HERO MAX', 'blue', () => {
        const h = s.towers.find((t) => t.hero);
        if (!h) return this.toast('Place your hero first!', 1200);
        if (h.level < MT.HERO_MAX_LEVEL) return s.gainHeroXp(h, MT.HERO_XP[9] - h.xp + 1);
        let xp = -h.sxp;
        for (let k = 0; k < 5; k++) xp += MT.starXp(h.stars + k);
        s.gainHeroXp(h, xp);
      }, 13);
    }

    toggleSandbox() {
      const on = !this.sbPanel.visible;
      this.sbPanel.setVisible(on);
      this.sbBtn.setLabel(on ? 'CLOSE' : 'SANDBOX');
      if (on && this.powersOpen) this.togglePowers(false);
    }

    // ------------------------------------------------------------ powers (hotkey P)
    buildPowers() {
      const s = this.scene;
      const W0 = MT.CFG.MAP_W;
      const bx = s.sandbox ? W0 - 214 : W0 - 74;
      this.powersOpen = false;
      this.pwBtn = new MT.UI.Button(s, bx, 28, 132, 40, {
        style: 'orange', icon: 'ic_power', label: 'POWERS', size: 16, iconSize: 0.6,
        onClick: () => this.togglePowers(),
        onHover: (on) => (on ? this.tip.show(bx - 130, 54, 'Powers  ·  hotkey P', 'One-use items: peels, sprinklers, freeze bombs, cash, boosts and lives. Buy more with Gru Coins in Gru\'s Lab.') : this.tip.hide()),
      }).setDepth(DEPTH + 3);
      const c = (this.pwPanel = s.add.container(bx + 66 - 250, 54).setDepth(DEPTH + 3).setVisible(false));
      c.add(MT.UI.panel(s, 0, 0, 250, 30 + MT.POWER_ORDER.length * 54, 'denim'));
      c.add(MT.text(s, 125, 20, s.sandbox ? 'POWERS  (free in the Sandbox)' : 'POWERS', 15, { title: true, color: '#ffb36b' }));
      this.pwRows = MT.POWER_ORDER.map((id, i) => {
        const P = MT.POWERS[id];
        const y = 34 + i * 54;
        const row = s.add.container(10, y);
        const bg = s.add.image(0, 0, MT.UI.panelKey(s, 230, 50, 'card')).setOrigin(0).setScale(1 / S);
        const icon = s.add.image(26, 25, P.icon).setDisplaySize(40, 40);
        const name = MT.text(s, 52, 17, P.name, 14, { title: true, ox: 0 });
        const sub = MT.text(s, 52, 35, P.place === 'track' ? 'drop on the track' : P.place ? 'drop anywhere' : 'instant', 10, { ox: 0, color: '#cfe3ff', strokeThickness: 2 });
        const cnt = MT.text(s, 220, 25, '', 18, { title: true, ox: 1, color: '#ffd83a' });
        row.add([bg, icon, name, sub, cnt]);
        row.setSize(230, 50);
        row.setInteractive(new Phaser.Geom.Rectangle(0, 0, 230, 50), Phaser.Geom.Rectangle.Contains);
        row.on('pointerover', () => {
          bg.setTint(0xfff2a8);
          this.tip.show(X0 - 520, 54 + y, `${P.name}  ·  ${MT.Powers.count(s, id) === Infinity ? '∞' : MT.Powers.count(s, id)} left`, P.desc);
        });
        row.on('pointerout', () => {
          bg.setTint(s.powerPlacing === id ? 0xffd27a : 0xffffff);
          this.tip.hide();
        });
        row.on('pointerdown', () => {
          MT.Audio.init();
          this.tip.hide();
          MT.Powers.use(s, id);
          if (MT.POWERS[id].place && s.powerPlacing === id) this.togglePowers(false);
        });
        c.add(row);
        return { id, row, bg, icon, cnt };
      });
      this.refreshPowers();
    }

    togglePowers(force) {
      const s = this.scene;
      if (s.over) return;
      this.powersOpen = force != null ? force : !this.powersOpen;
      this.pwPanel.setVisible(this.powersOpen);
      if (this.powersOpen && this.sbPanel && this.sbPanel.visible) this.toggleSandbox();
      this.refreshPowers();
      MT.Audio.play('click');
    }

    refreshPowers() {
      if (!this.pwRows) return;
      const s = this.scene;
      let total = 0;
      this.pwRows.forEach((r) => {
        const n = MT.Powers.count(s, r.id);
        if (n !== Infinity) total += n;
        r.cnt.setText(n === Infinity ? '∞' : '×' + n).setColor(n > 0 ? '#ffd83a' : '#ff7b7b');
        r.icon.setAlpha(n > 0 ? 1 : 0.45);
        r.bg.setTint(s.powerPlacing === r.id ? 0xffd27a : 0xffffff);
      });
      this.pwBtn.setLabel(this.powersOpen ? 'CLOSE' : s.sandbox ? 'POWERS' : `POWERS ${total}`);
    }

    // ------------------------------------------------------------ achievements
    achievement(a) {
      MT.Ach.banner(this.scene, a, MT.CFG.MAP_W - 186, 112, DEPTH + 60);
    }

    // ------------------------------------------------------------ toasts
    toast(msg, ms = 1600, big = false) {
      const s = this.scene;
      this.toastText.setWordWrapWidth(big ? 760 : 820, true);
      this.toastText.setText(msg).setFontSize(big ? 28 : 22).setColor(big ? '#ffd83a' : '#ffffff');
      const w = this.toastText.width + 40, h = this.toastText.height + 16;
      this.toastBg.clear();
      this.toastBg.fillStyle(0x101624, 0.82);
      this.toastBg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      this.toastBg.lineStyle(2, big ? 0xffd83a : 0xffffff, 0.6);
      this.toastBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      s.tweens.killTweensOf(this.toastC);
      // stay clear of the final boss health bar at the top of the map
      const bossBar = s.enemies && s.enemies.some((e) => !e.dead && (e.def.final || e.def.bossFight));
      this.toastC.y = bossBar ? 64 + 60 + h / 2 - 20 : 64;
      this.toastC.setAlpha(0).setScale(0.8);
      s.tweens.add({ targets: this.toastC, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' });
      s.tweens.add({ targets: this.toastC, alpha: 0, delay: ms, duration: 300 });
    }

    // ------------------------------------------------------------ overlays
    makeOverlay(title, color, buttons, sub) {
      const s = this.scene;
      this.hideOverlay();
      const c = s.add.container(0, 0).setDepth(DEPTH + 100);
      const dim = s.add.rectangle(0, 0, MT.CFG.W, MT.CFG.H, 0x0b1020, 0.62).setOrigin(0).setInteractive();
      c.add(dim);
      const pw = 460, ph = 150 + buttons.length * 70;
      const px = 640 - pw / 2, py = 360 - ph / 2;
      c.add(MT.UI.panel(s, px, py, pw, ph, 'denim'));
      c.add(MT.text(s, 640, py + 50, title, 44, { title: true, color }));
      if (sub) c.add(MT.text(s, 640, py + 92, sub, 16, { color: '#e8f1ff' }));
      buttons.forEach((b, i) => {
        c.add(new MT.UI.Button(s, 640, py + 140 + i * 70, 300, 56, Object.assign({ size: 24 }, b)));
      });
      this.overlay = c;
      c.setAlpha(0);
      s.tweens.add({ targets: c, alpha: 1, duration: 200 });
      return c;
    }

    hideOverlay() {
      if (this.overlay) this.overlay.destroy();
      this.overlay = null;
    }

    togglePause() {
      const s = this.scene;
      if (s.over) return;
      if (s.paused) {
        s.paused = false;
        this.hideOverlay();
        MT.Audio.muffle(false);
        return;
      }
      s.paused = true;
      s.cancelPlacing();
      MT.Audio.muffle(true);
      this.showPauseMenu();
    }

    showPauseMenu() {
      const s = this.scene;
      const set = MT.Save.settings();
      this.makeOverlay('PAUSED', '#ffd83a', [
        { label: 'RESUME', style: 'green', onClick: () => this.togglePause() },
        { label: 'STATS', style: 'purple', icon: 'ic_trophy', onClick: () => this.showResults('pause') },
        { label: (set.sfx ? 'SOUND: ON' : 'SOUND: OFF'), style: 'blue', icon: 'ic_sound', onClick: (b) => {
          MT.Save.setSetting('sfx', !MT.Save.settings().sfx);
          MT.Audio.applySettings();
          b.setLabel(MT.Save.settings().sfx ? 'SOUND: ON' : 'SOUND: OFF');
        } },
        { label: (set.music ? 'MUSIC: ON' : 'MUSIC: OFF'), style: 'blue', icon: 'ic_music', onClick: (b) => {
          MT.Save.setSetting('music', !MT.Save.settings().music);
          MT.Audio.applySettings();
          b.setLabel(MT.Save.settings().music ? 'MUSIC: ON' : 'MUSIC: OFF');
        } },
        { label: this.shakeLabel(), style: 'blue', onClick: (b) => {
          const order = ['on', 'low', 'off'];
          const cur = order.indexOf(MT.Save.settings().shake);
          MT.Save.setSetting('shake', order[(cur + 1) % order.length]);
          b.setLabel(this.shakeLabel());
          if (MT.Save.settings().shake !== 'off') s.shake(0.6);
        } },
        { label: 'RESTART', style: 'yellow', icon: 'ic_restart', onClick: () => this.restart() },
        { label: 'MAIN MENU', style: 'red', icon: 'ic_home', onClick: () => this.home() },
      ], s.mode === 'boss' ? `${MT.BossFight.title(s)} · ${MT.BossFight.TIERS[s.bossTier].name} · ${s.heroDef.name}` : `${s.mapDef.name} · ${s.diff.name} · ${s.heroDef.name}` + (s.mode === 'classic' && !s.sandbox ? '  ·  saved every round' : ''));
    }

    shakeLabel() {
      const m = MT.Save.settings().shake;
      return 'SHAKE: ' + (m === 'on' ? 'ON' : m === 'off' ? 'OFF' : 'LOW');
    }

    showVictory() {
      this.showResults('victory');
      this.confetti();
    }

    showDefeat() {
      this.showResults('defeat');
    }

    // end-of-game report: summary numbers + the best towers, what they cost and earned
    showResults(kind) {
      const s = this.scene;
      this.hideOverlay();
      this.tip.hide();
      const c = s.add.container(0, 0).setDepth(DEPTH + 100);
      c.add(s.add.rectangle(0, 0, MT.CFG.W, MT.CFG.H, 0x0b1020, 0.7).setOrigin(0).setInteractive());
      const px = 150, py = 40, pw = 980, ph = 640;
      c.add(MT.UI.panel(s, px, py, pw, ph, 'denim'));
      const boss = s.mode === 'boss';
      const bossName = boss ? MT.BossFight.title(s) : '';
      const head = {
        victory: boss ? [s.rush ? 'BOSS RUSH CLEARED!' : 'BOSS DEFEATED!', '#7CFF6B', s.rush ? `All ${MT.BossFight.RUSH.length} villains down (${MT.BossFight.TIERS[s.bossTier].name}) in ${MT.BossFight.fmtTime(s.stat.time)}!` : `You beat ${bossName} (${MT.BossFight.TIERS[s.bossTier].name}) in ${MT.BossFight.fmtTime(s.stat.time)}!`]
          : ['VICTORY!', '#7CFF6B', `You beat ${s.mapDef.name} on ${s.diff.name}! Medal earned.`],
        defeat: boss ? ['DEFEAT', '#ff6b6b', s.defeatReason === 'escaped' ? `${MT.ENEMIES[s.bossId].name} escaped with your bananas!` : 'The mutants broke through!']
          : ['DEFEAT', '#ff6b6b', `The mutants broke through on round ${s.round}.`],
        pause: ['GAME STATS', '#ffd83a', `${boss ? bossName : s.mapDef.name} · ${boss ? MT.BossFight.TIERS[s.bossTier].name : s.diff.name}`],
      }[kind];
      c.add(MT.MenuArt.title(s, 640, py + 46, head[0], 46, '#ffffff', head[1]));
      c.add(MT.text(s, 640, py + 88, head[2], 17, { color: '#e8f1ff' }));
      // Gru Coins earned in this game (none in the sandbox or after the cheat)
      if (!s.sandbox) {
        const cx = px + pw - 110, cy = py + 46;
        c.add(s.add.image(cx - 48, cy, 'ic_grucoin').setDisplaySize(36, 36));
        c.add(MT.text(s, cx - 26, cy - 6, s.cheated ? 'CHEATED' : `+${s.coinsEarned}`, s.cheated ? 16 : 24, { title: true, ox: 0, color: s.cheated ? '#ff8a80' : '#ffd83a' }));
        c.add(MT.text(s, cx - 26, cy + 16, s.cheated ? 'no coins this game' : 'Gru Coins', 12, { ox: 0, color: '#cfe3ff' }));
      }
      // records: towers on the map + the ones that were sold
      const rows = s.towers.map((t) => s.towerRecord(t, false)).concat(s.stat.sold);
      // boss battles are about damage, classic games about pops
      rows.sort(boss ? (a, b) => b.dmg - a.dmg || b.pops - a.pops : (a, b) => b.pops - a.pops || b.dmg - a.dmg);
      const spent = rows.reduce((a, r) => a + r.spent, 0);
      const earned = rows.reduce((a, r) => a + r.earned, 0);
      // summary column
      const sx = px + 30, sy = py + 130;
      c.add(MT.UI.panel(s, sx - 10, sy - 14, 260, 450, 'dark'));
      const lines = [
        [boss ? 'Waves survived' : 'Rounds', String(s.round)],
        ['Game time', MT.BossFight.fmtTime(s.stat.time)],
        ['Mutants popped', s.totalPops.toLocaleString('en-US')],
        ['Lives lost', s.sandbox ? '-' : s.stat.livesLost.toLocaleString('en-US')],
        ['Towers built', String(s.stat.built)],
        ['Abilities used', String(s.stat.abilities)],
        ['Bananas spent', U.money(spent)],
        ['Bananas earned', U.money(earned)],
      ];
      lines.forEach(([k, v], i) => {
        c.add(MT.text(s, sx + 6, sy + 14 + i * 40, k, 14, { ox: 0, color: '#9fb3d1' }));
        c.add(MT.text(s, sx + 234, sy + 14 + i * 40, v, 19, { title: true, ox: 1 }));
      });
      // MVP
      const mvp = rows[0];
      if (mvp) {
        c.add(MT.text(s, sx + 120, sy + 344, 'MVP', 18, { title: true, color: '#ffd83a' }));
        const im = s.add.image(sx + 70, sy + 394, mvp.key);
        im.setScale(Math.min(64 / im.height, 70 / im.width));
        c.add(im);
        const nm = MT.text(s, sx + 110, sy + 384, mvp.name, 16, { title: true, ox: 0 });
        if (nm.width > 130) nm.setScale(130 / nm.width);
        c.add(nm);
        c.add(MT.text(s, sx + 110, sy + 406, boss ? `${mvp.dmg.toLocaleString('en-US')} damage` : `${mvp.pops.toLocaleString('en-US')} pops`, 13, { ox: 0, color: '#b8ffb0' }));
      }
      // right side: tabs for the tower table, the round history and the highlights
      const tx = px + 300, ty = py + 130;
      c.add(MT.UI.panel(s, tx - 10, ty - 14, 660, 450, 'dark'));
      const tabs = [['towers', 'TOWERS'], ['rounds', boss ? 'WAVES' : 'ROUNDS'], ['facts', 'HIGHLIGHTS']];
      const pages = {}, tabBtns = {};
      const showTab = (id) => {
        this.statsTab = id;
        for (const k in pages) pages[k].setVisible(k === id);
        for (const k in tabBtns) tabBtns[k].setStyle(k === id ? 'purple' : 'dark');
      };
      tabs.forEach(([id, label], i) => {
        pages[id] = s.add.container(0, 0);
        c.add(pages[id]);
        tabBtns[id] = new MT.UI.Button(s, tx + 62 + i * 132, ty + 10, 124, 30, { style: 'dark', label, size: 15, onClick: () => showTab(id) });
        c.add(tabBtns[id]);
      });
      this.statsTowers(pages.towers, rows, tx, ty);
      this.statsRounds(pages.rounds, tx, ty, boss);
      this.statsFacts(pages.facts, rows, tx, ty, boss);
      showTab(pages[this.statsTab] ? this.statsTab : 'towers');
      // buttons
      const btns = {
        victory: boss
          ? [{ label: 'PLAY AGAIN', style: 'green', icon: 'ic_restart', onClick: () => this.restart() }, { label: 'BOSS MENU', style: 'red', icon: 'ic_skull', onClick: () => this.home('BossSelect') }, { label: 'MAIN MENU', style: 'blue', icon: 'ic_home', onClick: () => this.home() }]
          : [{ label: 'FREEPLAY', style: 'green', onClick: () => s.continueFreeplay() }, { label: 'MAIN MENU', style: 'blue', icon: 'ic_home', onClick: () => this.home() }],
        defeat: [{ label: 'TRY AGAIN', style: 'green', icon: 'ic_restart', onClick: () => this.restart() }, { label: boss ? 'BOSS MENU' : 'MAIN MENU', style: 'blue', icon: boss ? 'ic_skull' : 'ic_home', onClick: () => this.home(boss ? 'BossSelect' : 'Menu') }],
        pause: [{ label: 'BACK', style: 'blue', onClick: () => this.showPauseMenu() }],
      }[kind];
      btns.forEach((b, i) => c.add(new MT.UI.Button(s, 640 + (i - (btns.length - 1) / 2) * 250, py + ph - 42, 230, 54, Object.assign({ size: 22 }, b))));
      this.overlay = c;
      c.setAlpha(0);
      s.tweens.add({ targets: c, alpha: 1, duration: 220 });
    }

    // every tower of the game in a list that scrolls (mouse wheel, drag, or the scrollbar)
    statsTowers(p, rows, tx, ty) {
      const s = this.scene;
      const cols = [['TOWER', tx + 60, 0], ['POPS', tx + 372, 1], ['DAMAGE', tx + 462, 1], ['COST', tx + 545, 1], ['EARNED', tx + 626, 1]];
      cols.forEach(([t, x, ox]) => p.add(MT.text(s, x, ty + 44, t, 13, { title: true, ox, color: '#ffd83a' })));
      if (!rows.length) {
        p.add(MT.text(s, tx + 320, ty + 200, 'No towers were built.', 18, { color: '#9fb3d1' }));
        return;
      }
      const RH = 50;
      const view = { x: tx - 6, y: ty + 58, w: 652, h: 372 };
      const contentH = rows.length * RH;
      const maxScroll = Math.max(0, contentH - view.h);
      p.add(MT.text(s, tx + 640, ty + 10, `${rows.length} towers` + (maxScroll ? '  ·  scroll for more' : ''), 12, { ox: 1, color: '#9fb3d1' }));
      const zone = s.add.zone(view.x, view.y, view.w, view.h).setOrigin(0).setInteractive();
      p.add(zone);
      const list = s.add.container(0, 0);
      p.add(list);
      const maskG = s.make.graphics({}, false);
      maskG.fillStyle(0xffffff).fillRect(view.x, view.y, view.w, view.h);
      list.setMask(maskG.createGeometryMask());
      p.once('destroy', () => maskG.destroy());
      const maxPops = Math.max(1, ...rows.map((r) => r.pops));
      const allPops = rows.reduce((a, r) => a + r.pops, 0) || 1;
      const medal = ['#ffd83a', '#e3ebf5', '#d1844a'];
      const g = s.add.graphics();
      list.add(g);
      rows.forEach((r, i) => {
        const y = view.y + 24 + i * RH;
        g.fillStyle(i % 2 ? 0x1b335c : 0x24497f, 0.55);
        g.fillRoundedRect(tx - 2, y - 22, 632, 46, 8);
        // pops bar
        g.fillStyle(0x7be35a, 0.35);
        g.fillRoundedRect(tx + 52, y + 15, 270 * (r.pops / maxPops), 5, 2.5);
        const im = s.add.image(tx + 24, y, r.key);
        im.setScale(Math.min(40 / im.height, 44 / im.width));
        list.add(im);
        const nm = MT.text(s, tx + 52, y - 9, r.name + (r.sold ? '  (sold)' : ''), 15, { title: true, ox: 0, color: r.sold ? '#9fb3d1' : '#ffffff' });
        if (nm.width > 270) nm.setScale(270 / nm.width);
        list.add(nm);
        // upgrades + share of all pops
        const pct = (r.pops / allPops) * 100;
        const share = r.pops ? (pct >= 10 ? Math.round(pct) : pct.toFixed(1)) + '% of pops' : 'no pops';
        list.add(MT.text(s, tx + 52, y + 6, [r.info, share].filter(Boolean).join('  ·  '), 11, { ox: 0, color: '#9fb3d1', strokeThickness: 2 }));
        // gold, silver and bronze stars for the top three, numbers for the rest
        list.add(i < 3 ? MT.text(s, tx + 6, y - 20, '★', 16, { color: medal[i], font: 'Arial' }) : MT.text(s, tx + 8, y - 17, String(i + 1), 11, { title: true, color: '#9fb3d1' }));
        list.add(MT.text(s, tx + 372, y, r.pops.toLocaleString('en-US'), 15, { title: true, ox: 1 }));
        list.add(MT.text(s, tx + 462, y, r.dmg.toLocaleString('en-US'), 15, { title: true, ox: 1, color: '#ffb4a8' }));
        list.add(MT.text(s, tx + 545, y, U.money(r.spent), 14, { ox: 1, color: '#cfe3ff' }));
        list.add(MT.text(s, tx + 626, y, r.earned ? U.money(r.earned) : '-', 14, { ox: 1, color: '#b8ffb0' }));
      });
      if (!maxScroll) return;
      // scrollbar
      const bar = s.add.graphics();
      p.add(bar);
      const trackX = tx + 640, trackY = view.y + 4, trackH = view.h - 8;
      const thumbH = Math.max(30, (trackH * view.h) / contentH);
      let scroll = 0;
      const setScroll = (v) => {
        scroll = U.clamp(v, 0, maxScroll);
        list.y = -scroll;
        bar.clear();
        bar.fillStyle(0x0b1020, 0.7).fillRoundedRect(trackX - 3, trackY, 6, trackH, 3);
        bar.fillStyle(0xffd83a, 0.95).fillRoundedRect(trackX - 3, trackY + ((trackH - thumbH) * scroll) / maxScroll, 6, thumbH, 3);
      };
      setScroll(0);
      const onWheel = (ptr, over, dx, dy) => p.visible && setScroll(scroll + dy * 0.5);
      // drag the list itself, or the scrollbar on the right edge
      let drag = null;
      zone.on('pointerdown', (ptr) => (drag = { y: ptr.worldY, from: scroll, thumb: ptr.worldX > trackX - 14 }));
      const onMove = (ptr) => {
        if (!drag) return;
        if (!ptr.isDown) return (drag = null);
        const dy = ptr.worldY - drag.y;
        setScroll(drag.thumb ? drag.from + (dy * maxScroll) / (trackH - thumbH) : drag.from - dy);
      };
      s.input.on('wheel', onWheel);
      s.input.on('pointermove', onMove);
      p.once('destroy', () => {
        s.input.off('wheel', onWheel);
        s.input.off('pointermove', onMove);
      });
    }

    // bar chart with one bar per round (or boss wave); hover a bar for its numbers
    statsRounds(p, tx, ty, boss) {
      const s = this.scene;
      const RN = boss ? 'Wave' : 'Round';
      const R = s.stat.rounds.slice(-200);
      if (!R.length) {
        p.add(MT.text(s, tx + 320, ty + 200, boss ? 'Survive a wave to see it here.' : 'Finish a round to see it here.', 18, { color: '#9fb3d1' }));
        return;
      }
      const num = (v) => v.toLocaleString('en-US');
      const metrics = [
        { id: 'pops', label: 'POPS', color: 0x7be35a, fmt: num },
        { id: 'cash', label: 'BANANAS', color: 0xffd83a, fmt: U.money },
        { id: 'lost', label: 'LIVES LOST', color: 0xff6b6b, fmt: num },
      ];
      const cx = tx + 66, cw = 560, cy = ty + 92, ch = 240;
      const slot = cw / R.length;
      const bw = Math.min(40, Math.max(1, slot > 4 ? slot * 0.72 : slot - 0.6));
      const g = s.add.graphics();
      p.add(g);
      const axisTop = MT.text(s, cx - 8, cy, '', 12, { ox: 1, color: '#9fb3d1', strokeThickness: 2 });
      const axisMid = MT.text(s, cx - 8, cy + ch / 2, '', 12, { ox: 1, color: '#9fb3d1', strokeThickness: 2 });
      p.add([axisTop, axisMid, MT.text(s, cx - 8, cy + ch, '0', 12, { ox: 1, color: '#9fb3d1', strokeThickness: 2 })]);
      // round numbers under the chart, about seven of them
      const every = Math.max(1, Math.ceil(R.length / 7));
      R.forEach((r, i) => {
        if (i % every === 0 || i === R.length - 1) p.add(MT.text(s, cx + (i + 0.5) * slot, cy + ch + 14, String(r.r), 11, { color: '#9fb3d1', strokeThickness: 2 }));
      });
      p.add(MT.text(s, cx + cw / 2, cy + ch + 32, RN.toUpperCase(), 11, { title: true, color: '#6f86a8' }));
      const bestText = MT.text(s, tx + 630, ty + 54, '', 13, { ox: 1, color: '#e8f1ff' });
      const info = MT.text(s, tx + 320, ty + 404, '', 14, { color: '#ffffff' });
      p.add([bestText, info]);
      let m = metrics[0], hover = -1, bestI = 0, max = 1;
      const describe = (r) => `${RN} ${r.r}:  ${num(r.pops)} pops  ·  ${U.money(r.cash)} earned  ·  ${num(r.lost)} lives lost  ·  ${MT.BossFight.fmtTime(r.t)}`;
      const draw = () => {
        g.clear();
        // grid lines at 25 / 50 / 75 / 100 %
        g.lineStyle(1, 0xffffff, 0.1);
        for (let k = 0; k <= 4; k++) g.lineBetween(cx, cy + (ch * k) / 4, cx + cw, cy + (ch * k) / 4);
        R.forEach((r, i) => {
          const h = r[m.id] > 0 ? Math.max(2, (ch * r[m.id]) / max) : 0;
          const top = i === hover ? 0xffffff : i === bestI ? 0xffd83a : m.color;
          g.fillStyle(top, i === hover || i === bestI ? 1 : 0.8);
          g.fillRect(cx + i * slot + (slot - bw) / 2, cy + ch - h, bw, h);
        });
        g.lineStyle(2, 0x9fb3d1, 0.6);
        g.lineBetween(cx, cy + ch, cx + cw, cy + ch);
        info.setText(describe(R[hover >= 0 ? hover : bestI]));
        info.setColor(hover >= 0 ? '#ffffff' : '#ffd83a');
        info.scaleX = info.width > 630 ? 630 / info.width : 1;
      };
      const pick = (id) => {
        m = metrics.find((x) => x.id === id);
        bestI = R.reduce((b, r, i) => (r[m.id] > R[b][m.id] ? i : b), 0);
        max = Math.max(1, R[bestI][m.id]);
        axisTop.setText(m.fmt(max));
        axisMid.setText(m.fmt(Math.round(max / 2)));
        bestText.setText(R[bestI][m.id] > 0 ? `Best: ${RN} ${R[bestI].r}  ·  ${m.fmt(R[bestI][m.id])}` : `No ${m.label.toLowerCase()} yet`);
        btns.forEach((b) => b.setStyle(b.metric === id ? 'blue' : 'dark'));
        draw();
      };
      const btns = metrics.map((x, i) => {
        const b = new MT.UI.Button(s, tx + 46 + i * 98, ty + 54, 92, 26, { style: 'dark', label: x.label, size: 12, onClick: () => pick(x.id) });
        b.metric = x.id;
        p.add(b);
        return b;
      });
      // hovering the chart shows that round's numbers
      const zone = s.add.zone(cx, cy - 10, cw, ch + 20).setOrigin(0).setInteractive();
      p.add(zone);
      zone.on('pointermove', (ptr) => {
        const i = U.clamp(Math.floor((ptr.worldX - cx) / slot), 0, R.length - 1);
        if (i !== hover) {
          hover = i;
          draw();
        }
      });
      zone.on('pointerout', () => {
        hover = -1;
        draw();
      });
      pick('pops');
    }

    // little cards with the most interesting numbers of the game
    statsFacts(p, rows, tx, ty, boss) {
      const s = this.scene, st = s.stat, R = st.rounds;
      const RN = boss ? 'Wave' : 'Round';
      const num = (v) => Math.round(v).toLocaleString('en-US');
      const time = MT.BossFight.fmtTime;
      const bestRound = (k) => R.reduce((b, r) => (r[k] > (b ? b[k] : 0) ? r : b), null);
      const topTower = (fn) => rows.reduce((b, r) => (fn(r) > (b ? fn(b) : 0) ? r : b), null);
      const bp = bestRound('pops'), bl = bestRound('lost'), bc = bestRound('cash'), bt = bestRound('t');
      const te = topTower((r) => r.earned);
      const val = (r) => (r.spent > 0 ? r.pops / r.spent : 0);
      const bv = topTower(val);
      const ex = topTower((r) => r.spent);
      const perBanana = bv ? val(bv) : 0;
      const facts = [
        ['Pops per minute', num(s.totalPops / Math.max(1, st.time / 60)), `over ${time(st.time)} of play`, '#7CFF6B'],
        ['Total damage', num(rows.reduce((a, r) => a + r.dmg, 0)), 'dealt by all towers', '#ffb4a8'],
        ['Giants popped', num(st.giants), 'the big blimp-sized ones', '#ffb36b'],
        ['Villains defeated', num(st.villains), 'bosses and enemy heroes', '#ff9cf0'],
        [`Best ${RN.toLowerCase()}`, bp ? `${RN} ${bp.r}` : '-', bp ? `${num(bp.pops)} pops` : 'none finished yet', '#7CFF6B'],
        [`Toughest ${RN.toLowerCase()}`, bl ? `${RN} ${bl.r}` : 'None!', bl ? `${num(bl.lost)} lives lost` : 'no lives lost', bl ? '#ff8a80' : '#7CFF6B'],
        [`Richest ${RN.toLowerCase()}`, bc ? `${RN} ${bc.r}` : '-', bc ? `${U.money(bc.cash)} earned` : 'none finished yet', '#ffd83a'],
        [`Longest ${RN.toLowerCase()}`, bt ? `${RN} ${bt.r}` : '-', bt ? `took ${time(bt.t)}` : 'none finished yet', '#cfe3ff'],
        ['Top earner', te ? te.name : '-', te ? `${U.money(te.earned)} earned` : 'nothing earned yet', '#b8ffb0'],
        ['Best value', bv ? bv.name : '-', bv ? `${perBanana >= 10 ? num(perBanana) : perBanana.toFixed(2)} pops per banana` : 'no pops yet', '#7fdbff'],
        ['Most expensive', ex ? ex.name : '-', ex ? `${U.money(ex.spent)} spent` : 'nothing built', '#cfe3ff'],
        ['Peak bananas', s.sandbox ? '-' : U.money(st.peak), 'most bananas at once', '#ffd83a'],
        ['Mutants leaked', num(st.leaks), `${num(st.livesLost)} lives lost`, st.leaks ? '#ff8a80' : '#7CFF6B'],
        ['Lives healed', num(st.healed), 'by heroes, bats and research', '#ff9cc2'],
        ['Powers used', num(s.cnt.powers), `${num(st.abilities)} abilities too`, '#ffb36b'],
        st.cheat ? ['Cheat bananas', U.money(st.cheat), 'from the +$ menu', '#ff8a80'] : ['Towers sold', num(st.sold.length), `out of ${num(st.built)} built`, '#cfe3ff'],
      ];
      const COLS = 4, CW = 152, CH = 86, GAP = 8;
      const g = s.add.graphics();
      p.add(g);
      facts.forEach(([label, value, sub, color], i) => {
        const x = tx - 2 + (i % COLS) * (CW + GAP), y = ty + 42 + Math.floor(i / COLS) * (CH + GAP);
        g.fillStyle(0x24497f, 0.55);
        g.fillRoundedRect(x, y, CW, CH, 10);
        g.fillStyle(U.hexInt(color), 0.9);
        g.fillRoundedRect(x + 10, y + 6, CW - 20, 3, 1.5);
        p.add(MT.text(s, x + CW / 2, y + 22, label, 12, { color: '#9fb3d1', strokeThickness: 2 }));
        const v = MT.text(s, x + CW / 2, y + 46, value, 19, { title: true, color });
        if (v.width > CW - 14) v.setScale((CW - 14) / v.width);
        p.add(v);
        const sb = MT.text(s, x + CW / 2, y + 69, sub, 10, { color: '#cfe3ff', strokeThickness: 2 });
        if (sb.width > CW - 10) sb.setScale((CW - 10) / sb.width);
        p.add(sb);
      });
    }

    confetti() {
      const s = this.scene;
      const em = s.add.particles(0, 0, 'fx_spark', {
        x: { min: 0, max: MT.CFG.W }, y: -10, speedY: { min: 120, max: 260 }, speedX: { min: -60, max: 60 },
        lifespan: 4000, scale: { start: 1.2, end: 0.6 }, rotate: { min: 0, max: 360 }, quantity: 3, frequency: 40,
        tint: [0xffd83a, 0x7be35a, 0x3a7fe0, 0xff6b6b, 0xc89bff],
      }).setDepth(DEPTH + 99);
      s.time.delayedCall(2500, () => em.stop());
    }

    restart() {
      const s = this.scene;
      if (this.leaving) return;
      this.leaving = true;
      s.scene.restart(Object.assign({}, s.launchData, { map: s.mapDef.id, diff: s.diff.id, hero: s.heroId, resume: null }));
    }

    home(to = 'Menu') {
      const s = this.scene;
      // a second click while the screen fades out would start the next scene twice
      if (this.leaving) return;
      this.leaving = true;
      // changes made since the last round end are kept
      if (s.dirty && !s.roundActive) s.autosave();
      s.cameras.main.fadeOut(250, 20, 30, 50);
      s.cameras.main.once('camerafadeoutcomplete', () => s.scene.start(to));
    }
  }

  MT.HUD = HUD;
})();
