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
      this.roundLabel = MT.text(s, X0 + 116, 30, 'ROUND 0/40', 22, { title: true, color: '#ffd83a' });
      this.root.add(this.roundLabel);
      // cheat: instant bananas
      this.cheatBtn = new MT.UI.Button(s, X0 + 224, 30, 34, 28, {
        style: 'yellow', label: '+$', size: 15,
        onClick: () => s.cheatMoney(),
        onHover: (on) => (on ? this.tip.show(X0 - 268, 14, 'Cheat', `Get ${U.money(MT.CFG.CHEAT_MONEY)} bananas instantly.`) : this.tip.hide()),
      }).setDepth(DEPTH + 2);
      this.root.add(s.add.image(X0 + 34, 72, 'ic_coin').setScale(0.75 / S * 2 / 2 * 1.0).setDisplaySize(30, 30));
      this.moneyText = MT.text(s, X0 + 54, 72, '$0', 22, { title: true, ox: 0 });
      this.root.add(this.moneyText);
      this.root.add(s.add.image(X0 + 188, 72, 'ic_heart').setDisplaySize(26, 26));
      this.livesText = MT.text(s, X0 + 204, 72, '0', 22, { title: true, ox: 0 });
      this.root.add(this.livesText);
    }

    // ------------------------------------------------------------ shop
    buildShop() {
      const s = this.scene;
      this.shop = s.add.container(0, 0).setDepth(DEPTH + 1);
      this.cards = [];
      const ids = MT.TOWER_ORDER.concat([s.heroId]);
      const CW = 76, CH = 97;
      ids.forEach((id, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = X0 + 10 + col * 81, y = 106 + row * 101;
        const hero = MT.isHero(id);
        const def = hero ? MT.HEROES[id] : MT.TOWERS[id];
        const c = s.add.container(x + CW / 2, y + CH / 2);
        const bg = s.add.image(0, 0, MT.UI.panelKey(s, CW, CH, hero ? 'yellow' : 'card')).setScale(1 / S);
        const key = hero ? MT.TowerArt.heroKey(s, id, 1) : MT.TowerArt.key(s, id, [0, 0, 0]);
        const icon = s.add.image(0, -9, key).setScale(hero ? 0.27 : id === 'farm' || id === 'lab' ? 0.29 : 0.31);
        const price = MT.text(s, 0, 34, '$0', 14, { title: true });
        const hk = MT.text(s, -29, -38, def.key, 11, { title: true, color: '#ffd166' });
        c.add([bg, icon, price, hk]);
        c.setSize(CW, CH);
        c.setInteractive({ useHandCursor: true });
        c.on('pointerover', () => {
          c.setScale(1.05);
          const cost = s.placeCost(id);
          this.tip.show(X0 - 268, y, `${def.name}  ·  ${U.money(cost)}`, def.desc + (def.trait ? `\n★ ${def.trait}` : '') + `\nHotkey: ${def.key}`);
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
        // squeeze big numbers so they never run into the lives counter
        const maxW = 116;
        this.moneyText.scaleX = this.moneyText.width > maxW ? maxW / this.moneyText.width : 1;
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
      add(s.add.image(42, 42, key).setScale(t.hero ? 0.36 : t.omega ? 0.17 : t.ultimate ? 0.24 : t.fused ? 0.32 : 0.4));
      const nameCol = t.omega ? '#ffffff' : t.fused ? t.def.fusion.color : t.hero ? t.def.color || '#ffd83a' : '#ffffff';
      const nameT = add(MT.text(s, 78, 22, t.name, 20, { title: true, ox: 0, color: nameCol }));
      if (nameT.width > 128) nameT.setScale(128 / nameT.width);
      this.popsText = add(MT.text(s, 78, 43, `Pops: ${Math.floor(t.totalPops)}`, 13, { ox: 0, color: '#cfe3ff' }));
      const close = new MT.UI.Button(s, 230, 22, 32, 32, { style: 'red', icon: 'ic_close', iconSize: 0.6, onClick: () => s.select(null) });
      add(close);
      // MOVE: relocate the tower for a small fee
      const fee = s.moveFee(t);
      this.moveBtn = add(new MT.UI.Button(s, 190, 47, 52, 22, {
        style: 'blue', label: 'MOVE', size: 12,
        onClick: () => s.startMove(t),
        onHover: (on) => (on ? this.tip.show(X0 - 268, 30, 'Move', `Pick this tower up and put it somewhere else for ${U.money(fee)}.\nHotkey: M`) : this.tip.hide()),
      }));
      // the tower's signature mechanic (full text on hover)
      if (t.def.trait && !t.omega) {
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
        add(MT.text(s, 22, y + 14, 'Target', 13, { ox: 0, color: '#cfe3ff' }));
        add(new MT.UI.Button(s, 96, y + 14, 30, 28, { style: 'blue', label: '<', size: 18, onClick: () => s.cycleTarget(t, -1) }));
        add(MT.text(s, 152, y + 14, MT.TARGET_MODES[t.targetMode], 17, { title: true }));
        add(new MT.UI.Button(s, 208, y + 14, 30, 28, { style: 'blue', label: '>', size: 18, onClick: () => s.cycleTarget(t, 1) }));
      } else {
        add(MT.text(s, 130, y + 14, this.infoLine(t), 13, { color: '#cfe3ff', wrap: 230 }));
      }
      y += 40;
      this.fuseBtn = this.ultBtn = this.omegaBtn = null;
      const giantRow = MT.Fusion.isPlainFused(t);
      if (t.hero) this.buildHeroRows(t, y, add);
      else if (t.omega) this.buildOmegaInfo(t, y, add);
      else if (t.fused) this.buildFusedInfo(t, y, add, giantRow ? 284 : 316);
      else {
        for (let pi = 0; pi < 3; pi++) this.buildPathRow(t, pi, 12, y + pi * 108, add);
      }
      if (giantRow) this.buildGiantButtons(t, add);
      if (!t.hero && !t.fused && !t.omega && t.def.fusion) {
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
          const dmg = p.explode ? p.explode.dmg : p.dmg;
          lines.push(`Damage: ${dmg}${p.moabDmg ? `  (+${p.moabDmg} vs giants)` : ''}`);
          if (st.attack !== 'aura' && st.attack !== 'ring') lines.push(`Pierce: ${p.explode ? p.explode.pierce : p.pierce}`);
        }
        lines.push(`Camo: ${st.camo ? 'yes' : 'no'}`);
      }
      if (st.buff) lines.push('Buffs nearby towers');
      return lines;
    }

    buildFusedInfo(t, y, add, h) {
      const s = this.scene;
      const f = t.def.fusion;
      add(MT.UI.panel(s, 12, y, 236, h, 'card'));
      add(MT.text(s, 130, y + 18, t.ultimate ? 'ULTIMATE' : 'SUPER FUSION', 16, { title: true, color: f.color }));
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
      add(MT.text(s, 130, y + 18, 'OMEGA MECH', 16, { title: true, color: '#ffffff' }));
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
        if (st.attack !== 'none' && p) bits.push(`${p.explode ? p.explode.dmg : p.dmg} dmg`, `${(1 / st.rate).toFixed(1)}/s`);
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
      const H = t.def;
      const XP = MT.HERO_XP;
      add(MT.UI.panel(s, 12, y, 236, 54, 'card'));
      add(MT.text(s, 24, y + 17, `Level ${t.level}`, 19, { title: true, ox: 0, color: '#ffd83a' }));
      const next = t.level < 10 ? XP[t.level] : XP[9];
      const prev = XP[t.level - 1];
      const frac = t.level >= 10 ? 1 : U.clamp((t.xp - prev) / (next - prev), 0, 1);
      const g = s.add.graphics();
      g.fillStyle(0x1b335c, 1);
      g.fillRoundedRect(24, y + 32, 210, 11, 5.5);
      g.fillStyle(0x7fdbff, 1);
      g.fillRoundedRect(24, y + 32, Math.max(8, 210 * frac), 11, 5.5);
      g.lineStyle(2, 0x2a1d14, 1);
      g.strokeRoundedRect(24, y + 32, 210, 11, 5.5);
      add(g);
      add(MT.text(s, 234, y + 17, t.level >= 10 ? 'MAX' : `${Math.floor(t.xp)}/${next} XP`, 12, { ox: 1, color: '#cfe3ff' }));
      // the level list must end above the LEVEL UP button
      let ly = y + 60;
      const lines = [];
      for (let l = 1; l <= 10; l++) {
        const L = H.levels[l];
        const have = l <= t.level;
        const line = add(MT.text(s, 18, ly, `${have ? '✔' : '·'} ${l}. ${L.desc}`, 11, {
          ox: 0, oy: 0, wrap: 226, color: have ? '#b8ffb0' : '#9fb3d1', strokeThickness: 3, align: 'left',
        }));
        lines.push(line);
        ly += line.height;
      }
      if (ly > 400) {
        let yy = y + 60;
        lines.forEach((line) => {
          line.setFontSize(10).setWordWrapWidth(232, true).setY(yy);
          yy += line.height;
        });
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
      if (this.popsText) this.popsText.setText(`Pops: ${Math.floor(t.totalPops)}`);
      if (this.moveBtn) this.moveBtn.setEnabled(s.moveFee(t) <= s.money);
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
      const list = s.abilityList().slice(0, 16);
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
      const bossBar = s.enemies && s.enemies.some((e) => !e.dead && e.def.final);
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
        { label: this.shakeLabel(), style: 'blue', onClick: (b) => {
          const order = ['on', 'low', 'off'];
          const cur = order.indexOf(MT.Save.settings().shake);
          MT.Save.setSetting('shake', order[(cur + 1) % order.length]);
          b.setLabel(this.shakeLabel());
          if (MT.Save.settings().shake !== 'off') s.shake(0.6);
        } },
        { label: 'RESTART', style: 'yellow', icon: 'ic_restart', onClick: () => this.restart() },
        { label: 'MAIN MENU', style: 'red', icon: 'ic_home', onClick: () => this.home() },
      ], `${s.mapDef.name} · ${s.diff.name} · ${s.heroDef.name}`);
    }

    shakeLabel() {
      const m = MT.Save.settings().shake;
      return 'SHAKE: ' + (m === 'on' ? 'ON' : m === 'off' ? 'OFF' : 'LOW');
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
      s.scene.restart({ map: s.mapDef.id, diff: s.diff.id, hero: s.heroId });
    }

    home() {
      const s = this.scene;
      s.cameras.main.fadeOut(250, 20, 30, 50);
      s.cameras.main.once('camerafadeoutcomplete', () => s.scene.start('Menu'));
    }
  }

  MT.HUD = HUD;
})();
