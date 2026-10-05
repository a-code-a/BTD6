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
    }

    // ------------------------------------------------------------ top stats
    buildStats() {
      const s = this.scene;
      this.root.add(MT.UI.panel(s, X0 + 10, 10, 240, 88, 'dark'));
      this.roundLabel = MT.text(s, X0 + 130, 30, 'ROUND 0/40', 22, { title: true, color: '#ffd83a' });
      this.root.add(this.roundLabel);
      this.root.add(s.add.image(X0 + 34, 72, 'ic_coin').setScale(0.75 / S * 2 / 2 * 1.0).setDisplaySize(30, 30));
      this.moneyText = MT.text(s, X0 + 54, 72, '$0', 22, { title: true, ox: 0 });
      this.root.add(this.moneyText);
      this.root.add(s.add.image(X0 + 170, 72, 'ic_heart').setDisplaySize(28, 28));
      this.livesText = MT.text(s, X0 + 188, 72, '0', 22, { title: true, ox: 0 });
      this.root.add(this.livesText);
    }

    // ------------------------------------------------------------ shop
    buildShop() {
      const s = this.scene;
      this.shop = s.add.container(0, 0).setDepth(DEPTH + 1);
      this.cards = [];
      const ids = MT.TOWER_ORDER.concat(['gru']);
      ids.forEach((id, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = X0 + 10 + col * 124, y = 106 + row * 98;
        const def = id === 'gru' ? MT.HERO : MT.TOWERS[id];
        const c = s.add.container(x + 58, y + 46);
        const bg = s.add.image(0, 0, MT.UI.panelKey(s, 116, 92, id === 'gru' ? 'yellow' : 'card')).setScale(1 / S);
        const key = id === 'gru' ? MT.TowerArt.gruKey(s, 1) : MT.TowerArt.key(s, id, [0, 0, 0]);
        const icon = s.add.image(0, -8, key).setScale(id === 'gru' ? 0.31 : id === 'farm' || id === 'lab' ? 0.33 : 0.36);
        const price = MT.text(s, 0, 32, '$0', 16, { title: true });
        const hk = MT.text(s, -48, -36, def.key, 12, { title: true, color: '#ffd166' });
        c.add([bg, icon, price, hk]);
        c.setSize(116, 92);
        c.setInteractive({ useHandCursor: true });
        c.on('pointerover', () => {
          c.setScale(1.04);
          const cost = s.placeCost(id);
          this.tip.show(x - 270, y, `${def.name}  ·  ${U.money(cost)}`, def.desc + `\nHotkey: ${def.key}`);
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
      const total = s.freeplay ? '' : '/' + s.diff.rounds;
      const rl = `ROUND ${Math.max(1, s.round)}${total}`;
      if (rl !== this.last.round) this.roundLabel.setText((this.last.round = rl));
      if (money !== this.last.money) {
        this.moneyText.setText(U.money(money));
        this.last.money = money;
        this.refreshAffordability();
      }
      const lives = Math.max(0, Math.ceil(s.lives));
      if (lives !== this.last.lives) {
        this.livesText.setText(String(lives));
        if (this.last.lives != null && lives < this.last.lives) {
          this.livesText.setColor('#ff6b6b');
          s.time.delayedCall(250, () => this.livesText.setColor('#ffffff'));
        }
        this.last.lives = lives;
      }
      this.updateAbilities();
    }

    refreshAffordability() {
      const s = this.scene;
      this.cards.forEach((cd) => {
        const cost = s.placeCost(cd.id);
        const ok = cost <= s.money && !(cd.id === 'gru' && s.heroPlaced);
        cd.price.setText(cd.id === 'gru' && s.heroPlaced ? 'PLACED' : U.money(cost));
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
    }

    showTower(t) {
      const s = this.scene;
      this.shop.setVisible(false);
      this.tip.hide();
      this.upg.removeAll(true);
      this.upg.setVisible(true);
      const add = (o) => (this.upg.add(o), o);
      add(MT.UI.panel(s, 6, 0, 248, 504, 'dark'));
      const key = t.texKey();
      add(s.add.image(42, 40, key).setScale(t.hero ? 0.36 : 0.4));
      const nameT = add(MT.text(s, 78, 22, t.name, 20, { title: true, ox: 0, color: t.hero ? '#ffd83a' : '#ffffff' }));
      if (nameT.width > 128) nameT.setScale(128 / nameT.width);
      this.popsText = add(MT.text(s, 78, 46, `Pops: ${t.pops}`, 13, { ox: 0, color: '#cfe3ff' }));
      const close = new MT.UI.Button(s, 230, 22, 32, 32, { style: 'red', icon: 'ic_close', iconSize: 0.6, onClick: () => s.select(null) });
      add(close);
      this.upgRefs = { t, rows: [] };
      let y = 70;
      if (t.stats.attack !== 'none' || t.hero) {
        add(MT.text(s, 22, y + 14, 'Target', 13, { ox: 0, color: '#cfe3ff' }));
        add(new MT.UI.Button(s, 96, y + 14, 30, 28, { style: 'blue', label: '<', size: 18, onClick: () => s.cycleTarget(t, -1) }));
        add(MT.text(s, 152, y + 14, MT.TARGET_MODES[t.targetMode], 17, { title: true }));
        add(new MT.UI.Button(s, 208, y + 14, 30, 28, { style: 'blue', label: '>', size: 18, onClick: () => s.cycleTarget(t, 1) }));
      } else {
        add(MT.text(s, 130, y + 14, this.infoLine(t), 13, { color: '#cfe3ff', wrap: 230 }));
      }
      y += 40;
      if (t.hero) this.buildHeroRows(t, y, add);
      else {
        for (let pi = 0; pi < 3; pi++) this.buildPathRow(t, pi, 12, y + pi * 112, add);
      }
      const sell = new MT.UI.Button(s, 130, 470, 228, 42, {
        style: 'red', label: `SELL  ${U.money(t.sellValue())}`, size: 20, onClick: () => s.sell(t),
      });
      add(sell);
      this.refreshUpgradeButtons();
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

    buildHeroRows(t, y, add) {
      const s = this.scene;
      const H = MT.HERO;
      add(MT.UI.panel(s, 12, y, 236, 70, 'card'));
      add(MT.text(s, 24, y + 20, `Level ${t.level}`, 22, { title: true, ox: 0, color: '#ffd83a' }));
      const next = t.level < 10 ? H.xp[t.level] : H.xp[9];
      const prev = H.xp[t.level - 1];
      const frac = t.level >= 10 ? 1 : U.clamp((t.xp - prev) / (next - prev), 0, 1);
      const g = s.add.graphics();
      g.fillStyle(0x1b335c, 1);
      g.fillRoundedRect(24, y + 42, 210, 14, 7);
      g.fillStyle(0x7fdbff, 1);
      g.fillRoundedRect(24, y + 42, Math.max(8, 210 * frac), 14, 7);
      g.lineStyle(2, 0x2a1d14, 1);
      g.strokeRoundedRect(24, y + 42, 210, 14, 7);
      add(g);
      add(MT.text(s, 234, y + 20, t.level >= 10 ? 'MAX' : `${Math.floor(t.xp)}/${next} XP`, 12, { ox: 1, color: '#cfe3ff' }));
      let ly = y + 82;
      for (let l = 1; l <= 10; l++) {
        const L = H.levels[l];
        const have = l <= t.level;
        const line = add(MT.text(s, 18, ly, `${have ? '✔' : '·'} ${l}. ${L.desc}`, 11, {
          ox: 0, oy: 0, wrap: 226, color: have ? '#b8ffb0' : '#9fb3d1', strokeThickness: 3, align: 'left',
        }));
        ly += line.height + 1;
      }
      const cost = s.heroLevelCost(t);
      this.heroBtn = new MT.UI.Button(s, 130, 424, 228, 40, {
        style: 'blue', label: t.level >= 10 ? 'MAX LEVEL' : `LEVEL UP  ${U.money(cost)}`, size: 18,
        onClick: () => s.buyHeroLevel(t),
      });
      add(this.heroBtn);
    }

    refreshUpgradeButtons() {
      const R = this.upgRefs;
      if (!R) return;
      const s = this.scene;
      const t = R.t;
      if (this.popsText) this.popsText.setText(`Pops: ${t.pops}`);
      if (t.hero && this.heroBtn) {
        const cost = s.heroLevelCost(t);
        this.heroBtn.setEnabled(t.level < 10 && cost <= s.money);
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
      this.abilityBtns.forEach((b) => b.img.destroy());
      this.abilityBtns = [];
      const list = s.abilityList().slice(0, 12);
      list.forEach((ab, i) => {
        const A = MT.ABILITIES[ab.id];
        const x = 36 + i * 60, y = 684;
        const img = s.add.image(x, y, A.icon).setScale(0.95 / S).setDepth(DEPTH - 5).setInteractive({ useHandCursor: true });
        img.on('pointerdown', () => s.useAbility(ab.tower, ab.id));
        img.on('pointerover', () => this.tip.show(x - 20, y - 120, A.name, A.desc + `\nCooldown: ${A.cd}s`));
        img.on('pointerout', () => this.tip.hide());
        this.abilityBtns.push({ img, ab, A, x, y });
      });
    }

    updateAbilities() {
      const g = this.abilityG;
      g.clear();
      this.abilityBtns.forEach((b) => {
        const cd = b.ab.tower.abilityCd[b.ab.id] || 0;
        if (cd > 0) {
          const f = cd / b.A.cd;
          g.fillStyle(0x000000, 0.55);
          g.slice(b.x, b.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f, false);
          g.fillPath();
          b.img.setAlpha(0.75);
        } else {
          b.img.setAlpha(1);
          g.lineStyle(3, 0xffffff, 0.5 + 0.4 * Math.sin(this.scene.time.now / 200));
          g.strokeCircle(b.x, b.y, 27);
        }
      });
    }

    // ------------------------------------------------------------ toasts
    toast(msg, ms = 1600, big = false) {
      const s = this.scene;
      this.toastText.setText(msg).setFontSize(big ? 28 : 22).setColor(big ? '#ffd83a' : '#ffffff');
      const w = this.toastText.width + 40, h = this.toastText.height + 16;
      this.toastBg.clear();
      this.toastBg.fillStyle(0x101624, 0.82);
      this.toastBg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      this.toastBg.lineStyle(2, big ? 0xffd83a : 0xffffff, 0.6);
      this.toastBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      s.tweens.killTweensOf(this.toastC);
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
        return;
      }
      s.paused = true;
      s.cancelPlacing();
      const set = MT.Save.settings();
      this.makeOverlay('PAUSED', '#ffd83a', [
        { label: 'RESUME', style: 'green', onClick: () => this.togglePause() },
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
        { label: 'RESTART', style: 'yellow', icon: 'ic_restart', onClick: () => this.restart() },
        { label: 'MAIN MENU', style: 'red', icon: 'ic_home', onClick: () => this.home() },
      ], `${s.mapDef.name} · ${s.diff.name}`);
    }

    showVictory() {
      const s = this.scene;
      this.makeOverlay('VICTORY!', '#7CFF6B', [
        { label: 'FREEPLAY', style: 'green', onClick: () => s.continueFreeplay() },
        { label: 'MAIN MENU', style: 'blue', icon: 'ic_home', onClick: () => this.home() },
      ], `You beat ${s.mapDef.name} on ${s.diff.name}! Medal earned.`);
      this.confetti();
    }

    showDefeat() {
      const s = this.scene;
      this.makeOverlay('DEFEAT', '#ff6b6b', [
        { label: 'TRY AGAIN', style: 'green', icon: 'ic_restart', onClick: () => this.restart() },
        { label: 'MAIN MENU', style: 'blue', icon: 'ic_home', onClick: () => this.home() },
      ], `The mutants broke through on round ${s.round}.`);
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
      s.scene.restart({ map: s.mapDef.id, diff: s.diff.id });
    }

    home() {
      const s = this.scene;
      s.cameras.main.fadeOut(250, 20, 30, 50);
      s.cameras.main.once('camerafadeoutcomplete', () => s.scene.start('Menu'));
    }
  }

  MT.HUD = HUD;
})();
