// Gru's Lab (spend Gru Coins on research and powers) and the achievements screen.
(function () {
  const S = MT.Draw.S;
  const W = MT.CFG.W;
  const MA = () => MT.MenuArt;
  const num = (v) => Math.round(v).toLocaleString('en-US');

  function setup(scene, title) {
    MT.setupCamera(scene);
    scene.cameras.main.fadeIn(300, 10, 8, 30);
    MT.Audio.music('menu');
    MA().backdrop(scene, { dim: 0.5 });
    MA().header(scene, title);
  }

  // the Gru Coin counter in the top-right corner of a menu screen
  function coinBadge(scene, x = W - 120, y = 48) {
    const c = scene.add.container(x, y).setDepth(40);
    const g = scene.add.graphics();
    g.fillStyle(0x140c28, 0.85);
    g.fillRoundedRect(-92, -22, 184, 44, 22);
    g.lineStyle(2, 0xffd740, 0.8);
    g.strokeRoundedRect(-92, -22, 184, 44, 22);
    const icon = scene.add.image(-66, 0, 'ic_grucoin').setDisplaySize(34, 34);
    const t = MT.text(scene, -42, 1, '', 24, { title: true, ox: 0, color: '#ffd83a' });
    c.add([g, icon, t]);
    c.refresh = () => {
      t.setText(num(MT.Save.coins()));
      if (t.width > 120) t.setScale(120 / t.width);
    };
    c.bump = () => {
      c.refresh();
      scene.tweens.add({ targets: c, scale: { from: 1.15, to: 1 }, duration: 260, ease: 'Back.easeOut' });
    };
    c.refresh();
    c.setInteractive(new Phaser.Geom.Rectangle(-92, -22, 184, 44), Phaser.Geom.Rectangle.Contains);
    const tip = new MT.UI.Tooltip(scene);
    c.on('pointerover', () => tip.show(x - 170, y + 30, 'Gru Coins', 'Earned for every round you survive, every win (double for a new medal), boss battles and achievements. Spend them in Gru\'s Lab and on new heroes.'));
    c.on('pointerout', () => tip.hide());
    return c;
  }

  function pips(scene, x, y, lv, max, col) {
    const g = scene.add.graphics();
    for (let i = 0; i < max; i++) {
      g.fillStyle(i < lv ? MT.util.hexInt(col) : 0x1b335c, 1);
      g.fillRoundedRect(x + i * 17, y, 13, 9, 3);
      g.lineStyle(1.5, 0x2a1d14, 1);
      g.strokeRoundedRect(x + i * 17, y, 13, 9, 3);
    }
    return g;
  }

  // ------------------------------------------------------------------ Gru's Lab
  class LabScene extends Phaser.Scene {
    constructor() {
      super('Lab');
    }
    create() {
      setup(this, "GRU'S LAB");
      this.coins = coinBadge(this);
      this.tabs = [['research', 'RESEARCH', 'ic_flask'], ['powers', 'POWERS', 'ic_power']].map(([id, label, icon], i) => {
        const b = new MT.UI.Button(this, W / 2 + (i ? 116 : -116), 112, 220, 46, { style: 'dark', label, icon, size: 21, iconSize: 0.62, onClick: () => this.tab(id) });
        b.id = id;
        return b;
      });
      MT.text(this, W / 2, 704, 'Earn Gru Coins by surviving rounds, winning games and boss battles, and with achievements.', 13, { color: '#d8ccff' });
      this.tab(this.mode || 'research');
    }
    tab(id) {
      this.mode = id;
      this.tabs.forEach((b) => b.setStyle(b.id === id ? 'yellow' : 'dark'));
      if (this.page) this.page.destroy();
      this.page = this.add.container(0, 0);
      if (id === 'research') this.research();
      else this.powers();
    }
    afterBuy() {
      this.coins.bump();
      MT.Audio.play('upgrade');
      MT.Ach.check(null);
      MT.Ach.flush(this, W - 190, 120);
      this.tab(this.mode);
    }

    research() {
      const p = this.page;
      const list = MT.Progress.RESEARCH;
      const CW = 232, CH = 170, GAP = 12;
      const rows = [list.slice(0, 5), list.slice(5, 10), list.slice(10)];
      rows.forEach((row, r) => {
        const x0 = W / 2 - (row.length * CW + (row.length - 1) * GAP) / 2;
        row.forEach((R, i) => this.researchCard(p, R, x0 + i * (CW + GAP), 140 + r * (CH + 6), CW, CH));
      });
      p.add(MT.text(this, W / 2, 680, `${MT.Progress.researchLevels()} / ${list.reduce((a, R) => a + R.max, 0)} research levels`, 15, { title: true, color: '#ffe066' }));
    }

    researchCard(p, R, x, y, w, h) {
      const lv = MT.Save.research(R.id);
      const max = lv >= R.max;
      const cat = MT.Progress.CAT[R.cat];
      p.add(MT.UI.panel(this, x, y, w, h, max ? 'yellow' : 'denim'));
      p.add(this.add.image(x + 34, y + 36, R.icon).setDisplaySize(44, 44));
      const nm = MT.text(this, x + 62, y + 24, R.name, 17, { title: true, ox: 0, color: max ? '#2a1d14' : '#ffffff', stroke: max ? false : undefined });
      if (nm.width > w - 72) nm.setScale((w - 72) / nm.width);
      p.add(nm);
      p.add(MT.text(this, x + 62, y + 44, cat.name, 10, { title: true, ox: 0, color: max ? '#7a5200' : cat.color, strokeThickness: 2 }));
      p.add(pips(this, x + w - 14 - R.max * 17 + 4, y + 40, lv, R.max, cat.color));
      const now = lv ? R.desc(lv) : 'Not researched yet';
      const nowT = MT.text(this, x + 14, y + 60, 'Now: ' + now, 11, { ox: 0, oy: 0, wrap: w - 26, align: 'left', color: max ? '#5d4037' : '#9fb3d1', strokeThickness: max ? 0 : 3, stroke: max ? false : undefined });
      p.add(nowT);
      if (max) {
        p.add(MT.text(this, x + w / 2, y + h - 26, 'MAXED!', 20, { title: true, color: '#c62828', stroke: false }));
        return;
      }
      p.add(MT.text(this, x + 14, y + 64 + nowT.height, 'Next: ' + R.desc(lv + 1), 12, { ox: 0, oy: 0, wrap: w - 26, align: 'left', color: '#e8ffd6', strokeThickness: 3 }));
      const cost = R.costs[lv];
      const ok = MT.Save.coins() >= cost;
      const b = new MT.UI.Button(this, x + w / 2, y + h - 22, 150, 34, {
        style: ok ? 'green' : 'gray', icon: 'ic_grucoin', label: num(cost), size: 17, iconSize: 0.7,
        onClick: () => {
          if (MT.Progress.buyResearch(R.id)) this.afterBuy();
        },
        onDisabledClick: () => this.notEnough(cost),
      });
      b.setEnabled(ok);
      p.add(b);
    }

    powers() {
      const p = this.page;
      const CW = 384, CH = 236;
      MT.POWER_ORDER.forEach((id, i) => {
        const x = W / 2 - (3 * CW + 2 * 14) / 2 + (i % 3) * (CW + 14), y = 146 + Math.floor(i / 3) * (CH + 14);
        this.powerCard(p, id, x, y, CW, CH);
      });
      p.add(MT.text(this, W / 2, 674, 'Use powers in a game with the POWERS button (hotkey P). They work in Boss Battles too.', 14, { color: '#ffe066' }));
    }

    powerCard(p, id, x, y, w, h) {
      const P = MT.POWERS[id];
      const have = MT.Save.powerCount(id);
      p.add(MT.UI.panel(this, x, y, w, h, 'denim'));
      p.add(this.add.image(x + 54, y + 56, P.icon).setDisplaySize(72, 72));
      p.add(MT.text(this, x + 102, y + 34, P.name, 22, { title: true, ox: 0 }));
      p.add(MT.text(this, x + 102, y + 62, P.place === 'track' ? 'Drop it on the track' : P.place ? 'Drop it anywhere' : 'Works instantly', 12, { ox: 0, color: '#9fd0ff' }));
      p.add(MT.text(this, x + 20, y + 100, P.desc, 13, { ox: 0, oy: 0, wrap: w - 40, align: 'left', strokeThickness: 3 }));
      p.add(MT.text(this, x + w - 20, y + 34, '×' + have, 26, { title: true, ox: 1, color: have ? '#ffd83a' : '#9fb3d1' }));
      [[1, P.cost], [5, P.cost * 4]].forEach(([n, cost], k) => {
        const ok = MT.Save.coins() >= cost;
        const b = new MT.UI.Button(this, x + w / 2 + (k ? 92 : -92), y + h - 32, 168, 42, {
          style: ok ? (k ? 'orange' : 'green') : 'gray', icon: 'ic_grucoin', label: `${n === 1 ? 'BUY 1' : 'BUY 5'}  ${num(cost)}`, size: 15, iconSize: 0.62,
          onClick: () => {
            if (!MT.Save.spendCoins(cost)) return this.notEnough(cost);
            MT.Save.addPower(id, n);
            this.afterBuy();
          },
          onDisabledClick: () => this.notEnough(cost),
        });
        b.setEnabled(ok);
        p.add(b);
      });
      p.add(MT.text(this, x + w / 2 + 92, y + h - 62, '1 free!', 11, { title: true, color: '#ffb36b', strokeThickness: 3 }));
    }

    notEnough(cost) {
      const need = cost - MT.Save.coins();
      const t = MT.text(this, W / 2, 640, `You need ${num(need)} more Gru Coins!`, 22, { title: true, color: '#ff8a80' }).setDepth(50);
      this.tweens.add({ targets: t, alpha: 0, y: 610, delay: 900, duration: 400, onComplete: () => t.destroy() });
    }
  }

  // ------------------------------------------------------------------ Achievements
  class AchievementsScene extends Phaser.Scene {
    constructor() {
      super('Achievements');
    }
    create() {
      setup(this, 'ACHIEVEMENTS');
      coinBadge(this);
      this.pageIdx = 0;
      const list = MT.Ach.LIST;
      const done = list.filter((a) => MT.Save.achieved(a.id));
      const coins = done.reduce((s, a) => s + a.coins, 0);
      MT.text(this, W / 2, 104, `${done.length} / ${list.length} unlocked   ·   ${num(coins)} of ${num(list.reduce((s, a) => s + a.coins, 0))} Gru Coins collected`, 17, { title: true, color: '#ffe066' });
      this.pages = Math.ceil(list.length / 16);
      const flip = (d) => {
        MT.Audio.play('click');
        this.show((this.pageIdx + d + this.pages) % this.pages);
      };
      this.prev = new MT.UI.Button(this, W / 2 - 150, 676, 56, 42, { style: 'yellow', label: '<', size: 24, onClick: () => flip(-1) });
      this.next = new MT.UI.Button(this, W / 2 + 150, 676, 56, 42, { style: 'yellow', label: '>', size: 24, onClick: () => flip(1) });
      this.pageLabel = MT.text(this, W / 2, 676, '', 20, { title: true });
      this.input.keyboard.on('keydown-LEFT', () => flip(-1));
      this.input.keyboard.on('keydown-RIGHT', () => flip(1));
      this.show(0);
    }
    show(idx) {
      this.pageIdx = idx;
      if (this.page) this.page.destroy();
      const p = (this.page = this.add.container(0, 0));
      const CW = 292, CH = 116, GAP = 12;
      const x0 = W / 2 - (4 * CW + 3 * GAP) / 2;
      MT.Ach.LIST.slice(idx * 16, idx * 16 + 16).forEach((a, i) => {
        const x = x0 + (i % 4) * (CW + GAP), y = 134 + Math.floor(i / 4) * (CH + 10);
        this.card(p, a, x, y, CW, CH);
      });
      this.pageLabel.setText(`PAGE ${idx + 1}/${this.pages}`);
    }
    card(p, a, x, y, w, h) {
      const pr = MT.Ach.progress(a);
      const done = pr.done;
      p.add(MT.UI.panel(this, x, y, w, h, done ? 'yellow' : 'denim'));
      const icon = this.add.image(x + 38, y + 40, a.icon).setDisplaySize(52, 52);
      if (!done) icon.setTint(0x9aa6b8).setAlpha(0.75);
      p.add(icon);
      const dark = { color: '#2a1d14', stroke: false };
      const nm = MT.text(this, x + 74, y + 22, a.name, 17, Object.assign({ title: true, ox: 0 }, done ? dark : {}));
      if (nm.width > w - 86) nm.setScale((w - 86) / nm.width);
      p.add(nm);
      p.add(MT.text(this, x + 74, y + 36, a.desc, 11, Object.assign({ ox: 0, oy: 0, wrap: w - 86, align: 'left', strokeThickness: 3 }, done ? { color: '#4e342e', stroke: false } : { color: '#dfe9ff' })));
      // progress bar (or a tick) + reward
      const by = y + h - 22;
      if (done) {
        p.add(MT.text(this, x + 20, by, '✔ UNLOCKED', 13, { title: true, ox: 0, color: '#2e7d32', stroke: false }));
      } else {
        const g = this.add.graphics();
        const bw = w - 120, f = pr.goal ? Math.min(1, pr.v / pr.goal) : 0;
        g.fillStyle(0x1b335c, 1);
        g.fillRoundedRect(x + 16, by - 6, bw, 12, 6);
        g.fillStyle(0x7be35a, 1);
        if (f > 0) g.fillRoundedRect(x + 16, by - 6, Math.max(10, bw * f), 12, 6);
        g.lineStyle(1.5, 0x2a1d14, 1);
        g.strokeRoundedRect(x + 16, by - 6, bw, 12, 6);
        p.add(g);
        if (pr.goal > 1) p.add(MT.text(this, x + 16 + bw / 2, by, `${num(pr.v)} / ${num(pr.goal)}`, 10, { title: true, strokeThickness: 2 }));
      }
      p.add(this.add.image(x + w - 70, by, 'ic_grucoin').setDisplaySize(20, 20));
      p.add(MT.text(this, x + w - 56, by + 1, '+' + a.coins, 15, Object.assign({ title: true, ox: 0, color: '#ffd83a' }, done ? { color: '#7a5200', stroke: false } : {})));
    }
  }

  MT.LabScene = LabScene;
  MT.AchievementsScene = AchievementsScene;
  MT.coinBadge = coinBadge;
})();
