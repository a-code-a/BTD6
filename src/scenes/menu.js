// Boot (texture generation), main menu and map/difficulty selection.
(function () {
  const S = MT.Draw.S;
  const W = MT.CFG.W, H = MT.CFG.H;

  // --------------------------------------------------------------------- Boot
  class BootScene extends Phaser.Scene {
    constructor() {
      super('Boot');
    }
    create() {
      MT.setupCamera(this);
      this.cameras.main.setBackgroundColor('#1b2a49');
      const t = MT.text(this, W / 2, H / 2, 'Loading bananas...', 28, { title: true, color: '#ffd83a' });
      this.time.delayedCall(30, () => {
        MT.FXArt.generate(this);
        MT.FXArt.generate2(this);
        MT.GiantArt.generate(this);
        MT.TOWER_ORDER.forEach((id) => MT.TowerArt.key(this, id, [0, 0, 0]));
        MT.HERO_ORDER.forEach((id) => MT.TowerArt.heroKey(this, id, 1));
        MT.ENEMY_ORDER.forEach((id) => MT.EnemyArt.key(this, id, false, false, 0));
        t.destroy();
        const el = document.getElementById('boot');
        if (el) el.remove();
        this.scene.start('Menu');
      });
    }
  }

  // ------------------------------------------------------------- shared bits
  function menuBackground(scene, dim = 0.45) {
    const map = MT.MAPS[0];
    const paths = map.paths.map((p) => new MT.Path(p));
    const key = MT.MapArt.texture(scene, map, paths);
    const bg = scene.add.image(W / 2, H / 2, key).setScale((W / MT.CFG.MAP_W) / S);
    scene.add.rectangle(0, 0, W, H, 0x0b1430, dim).setOrigin(0);
    // vignette
    const g = scene.add.graphics();
    for (let i = 0; i < 12; i++) {
      g.lineStyle(40, 0x05080f, 0.05);
      g.strokeRect(-20 + i * 6, -20 + i * 6, W + 40 - i * 12, H + 40 - i * 12);
    }
    return bg;
  }

  function bob(scene, obj, amp = 6, dur = 700, delay = 0) {
    scene.tweens.add({ targets: obj, y: obj.y - amp, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay });
  }

  function gradientTitle(scene, x, y, str, size, c1, c2) {
    const t = MT.text(scene, x, y, str, size, { title: true, strokeThickness: Math.round(size / 6) });
    const grd = t.context.createLinearGradient(0, 0, 0, t.height);
    grd.addColorStop(0.15, c1);
    grd.addColorStop(0.85, c2);
    t.setFill(grd);
    return t;
  }

  // --------------------------------------------------------------------- Menu
  class MenuScene extends Phaser.Scene {
    constructor() {
      super('Menu');
    }
    create() {
      MT.setupCamera(this);
      this.cameras.main.fadeIn(400, 20, 30, 50);
      menuBackground(this, 0.35);

      // characters
      const macho = this.add.image(1150, 420, MT.EnemyArt.key(this, 'macho', false, false, 0)).setScale(0.62).setAlpha(0.95);
      bob(this, macho, 5, 900);
      const gru = this.add.image(250, 470, MT.TowerArt.gruKey(this, 10)).setScale(1.25);
      bob(this, gru, 4, 1400);
      const heroes = [['lucy', 120, 420, 0.95], ['kevin', 420, 470, 0.85]];
      heroes.forEach(([id, x, y, s], i) => {
        const im = this.add.image(x, y, MT.TowerArt.heroKey(this, id, 10)).setScale(s);
        bob(this, im, 5, 1100 + i * 200, i * 300);
      });
      const yellows = [
        ['banana', [2, 0, 0], 120, 600, 0.75], ['freeze', [0, 0, 0], 380, 620, 0.75], ['tesla', [2, 0, 0], 470, 610, 0.62],
        ['super', [0, 0, 0], 40, 520, 0.6], ['rockstar', [0, 2, 0], 270, 665, 0.6],
      ];
      yellows.forEach(([type, tiers, x, y, s], i) => {
        const im = this.add.image(x, y, MT.TowerArt.key(this, type, tiers)).setScale(s);
        bob(this, im, 8, 380 + i * 60, i * 120);
      });
      const purples = [['mecha', 960, 470, 0.6], ['hulk', 880, 610, 0.95], ['zoomer', 1180, 640, 1.1], ['pip', 1020, 650, 1.2], ['tincan', 800, 655, 0.9], ['phantom', 1190, 150, 0.55]];
      purples.forEach(([type, x, y, s], i) => {
        const im = this.add.image(x, y, MT.EnemyArt.key(this, type, false, false, 0)).setScale(s);
        bob(this, im, 10, 300 + i * 40, i * 90);
        this.tweens.add({ targets: im, angle: { from: -6, to: 6 }, duration: 260 + i * 30, yoyo: true, repeat: -1 });
      });

      // title
      const t1 = gradientTitle(this, W / 2, 112, 'MINION', 104, '#fff27a', '#ffb800');
      const t2 = gradientTitle(this, W / 2, 200, 'TOWER DEFENSE', 64, '#ffffff', '#9fd0ff');
      MT.text(this, W / 2, 262, 'Gru vs. the Evil Purple Minions', 24, { color: '#e9d6ff' });
      t1.setScale(0.6);
      this.tweens.add({ targets: t1, scale: 1, duration: 600, ease: 'Back.easeOut' });
      this.tweens.add({ targets: t1, angle: { from: -1.5, to: 1.5 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      t2.setAlpha(0);
      this.tweens.add({ targets: t2, alpha: 1, duration: 600, delay: 250 });

      // buttons
      new MT.UI.Button(this, W / 2, 360, 280, 76, { style: 'yellow', label: 'PLAY', size: 40, icon: 'ic_play', iconSize: 0.55, color: '#ffffff', onClick: () => this.go('MapSelect') });
      new MT.UI.Button(this, W / 2, 448, 280, 56, { style: 'blue', label: 'HOW TO PLAY', size: 24, onClick: () => this.howTo() });
      const set = MT.Save.settings();
      this.sfxBtn = new MT.UI.Button(this, W / 2 - 70, 524, 124, 48, { style: 'purple', icon: 'ic_sound', label: set.sfx ? 'ON' : 'OFF', size: 20, onClick: (b) => {
        MT.Save.setSetting('sfx', !MT.Save.settings().sfx);
        MT.Audio.applySettings();
        b.setLabel(MT.Save.settings().sfx ? 'ON' : 'OFF');
      } });
      this.musBtn = new MT.UI.Button(this, W / 2 + 70, 524, 124, 48, { style: 'purple', icon: 'ic_music', label: set.music ? 'ON' : 'OFF', size: 20, onClick: (b) => {
        MT.Save.setSetting('music', !MT.Save.settings().music);
        MT.Audio.init();
        MT.Audio.applySettings();
        b.setLabel(MT.Save.settings().music ? 'ON' : 'OFF');
      } });
      const st = MT.Save.stats();
      MT.text(this, W / 2, H - 22, `Mutants popped: ${st.pops.toLocaleString('en-US')}   ·   Games played: ${st.games}`, 14, { color: '#cfe3ff' });
      MT.text(this, W - 10, H - 22, 'Fan-made tribute · all art drawn in code', 12, { ox: 1, color: '#9fb3d1' });
      this.input.once('pointerdown', () => MT.Audio.init());
      this.input.keyboard.once('keydown', () => MT.Audio.init());
    }
    go(scene, data) {
      MT.Audio.init();
      this.cameras.main.fadeOut(250, 20, 30, 50);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
    }
    howTo() {
      const c = this.add.container(0, 0).setDepth(100);
      c.add(this.add.rectangle(0, 0, W, H, 0x0b1020, 0.7).setOrigin(0).setInteractive());
      c.add(MT.UI.panel(this, 240, 70, 800, 580, 'denim'));
      c.add(MT.text(this, W / 2, 118, 'HOW TO PLAY', 40, { title: true, color: '#ffd83a' }));
      const lines = [
        '• Evil purple minions march along the path towards Gru. Stop them!',
        '• Pick a minion tower on the right, then click the map to place it.',
        '• Popping a mutant earns bananas ($). Big mutants split into smaller ones.',
        '• Click a placed tower to upgrade it. Each tower has 3 paths with 4 tiers:',
        '   one path can reach tier 4, a second path tier 2.',
        '• FUSE 3 maxed towers of one kind into a super tower. Then: 3 same super',
        '   towers → ULTIMATE giant, 3 different ones → OMEGA MECH. MOVE relocates towers.',
        '• Camo mutants need detection. Armored Tin Cans block bananas & ice.',
        '• Banana Farms grow cash — hover over bananas to collect them.',
        '• Pick a hero before each game. Heroes level up and unlock abilities.',
        '• Late game brings monsters: Phantoms, Mechas (EMP!), Goo... and El Macho.',
        '• Press PLAY to start a round, press again for 3x speed.',
        '',
        'Hotkeys: Q W E R T Y A S D G J U I O = towers, H = hero, Space = play/speed,',
        ', . / = upgrades, F = fuse, M = move, Tab = targeting, Backspace = sell, Esc = pause',
      ];
      c.add(MT.text(this, 280, 160, lines.join('\n'), 17, { ox: 0, oy: 0, lineSpacing: 5, strokeThickness: 3 }));
      c.add(new MT.UI.Button(this, W / 2, 600, 220, 56, { style: 'green', label: 'GOT IT!', size: 26, onClick: () => c.destroy() }));
    }
  }

  // ---------------------------------------------------------------- MapSelect
  class MapSelectScene extends Phaser.Scene {
    constructor() {
      super('MapSelect');
    }
    create() {
      MT.setupCamera(this);
      this.cameras.main.fadeIn(300, 20, 30, 50);
      menuBackground(this, 0.6);
      gradientTitle(this, W / 2, 56, 'CHOOSE A MAP', 52, '#fff27a', '#ffb800');
      const order = { Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3 };
      const maps = MT.MAPS.slice().sort((a, b) => order[a.difficulty] - order[b.difficulty]);
      const diffCol = { Beginner: '#7be35a', Intermediate: '#ffc61a', Advanced: '#ff8a3a', Expert: '#ff5a5a' };
      maps.forEach((m, i) => {
        const col = i < 3 ? i : i - 3;
        const row = i < 3 ? 0 : 1;
        const cx = row === 0 ? 250 + col * 390 : 445 + col * 390;
        const cy = 250 + row * 290;
        const c = this.add.container(cx, cy);
        const paths = m.paths.map((p) => new MT.Path(p));
        c.add(this.add.image(0, 0, MT.UI.panelKey(this, 340, 270, 'denim')).setScale(1 / S));
        const th = this.add.image(0, -36, MT.MapArt.thumb(this, m, paths)).setScale(300 / 510);
        c.add(th);
        const frame = this.add.graphics();
        frame.lineStyle(3, 0x2a1d14, 1);
        frame.strokeRoundedRect(-150, -142, 300, 212, 6);
        c.add(frame);
        c.add(MT.text(this, -150, 92, m.name, 22, { title: true, ox: 0 }));
        c.add(MT.text(this, -150, 115, m.difficulty, 14, { ox: 0, color: diffCol[m.difficulty] }));
        const medals = MT.Save.medals(m.id);
        ['easy', 'medium', 'hard'].forEach((d, k) => {
          c.add(this.add.image(78 + k * 32, 100, medals[d] ? 'ic_medal' + k : 'ic_medal_empty').setScale(0.85 / S * 1.0));
        });
        c.setSize(340, 270);
        c.setInteractive({ useHandCursor: true });
        c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.04, duration: 120 }));
        c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
        c.on('pointerdown', () => {
          MT.Audio.init();
          MT.Audio.play('click');
          this.pickDifficulty(m);
        });
      });
      new MT.UI.Button(this, 90, 56, 130, 50, { style: 'red', icon: 'ic_home', label: 'BACK', size: 20, onClick: () => this.go('Menu') });
    }
    go(scene, data) {
      this.cameras.main.fadeOut(250, 20, 30, 50);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
    }
    pickDifficulty(m) {
      const c = this.add.container(0, 0).setDepth(100);
      c.add(this.add.rectangle(0, 0, W, H, 0x0b1020, 0.72).setOrigin(0).setInteractive());
      c.add(MT.UI.panel(this, 290, 34, 700, 652, 'denim'));
      c.add(MT.text(this, W / 2, 76, m.name, 38, { title: true, color: '#ffd83a' }));
      c.add(MT.text(this, W / 2, 112, 'Choose your hero', 18, { color: '#e8f1ff' }));
      let hero = MT.Save.settings().hero;
      if (!MT.HEROES[hero]) hero = 'gru';
      const nameT = MT.text(this, W / 2, 268, '', 22, { title: true });
      const info = MT.text(this, W / 2, 298, '', 15, { color: '#ffffff', wrap: 620 });
      const cards = [];
      const select = (id) => {
        hero = id;
        MT.Save.setSetting('hero', id);
        cards.forEach((cd) => {
          cd.bg.setTexture(MT.UI.panelKey(this, 112, 112, cd.id === id ? 'yellow' : 'card'));
          cd.card.setScale(cd.id === id ? 1.08 : 1);
        });
        const Hd = MT.HEROES[id];
        nameT.setText(`${Hd.name}  ·  ${Hd.title}`).setColor(Hd.color);
        info.setText(Hd.desc);
      };
      MT.HERO_ORDER.forEach((id, i) => {
        const x = W / 2 + (i - (MT.HERO_ORDER.length - 1) / 2) * 124, y = 186;
        const card = this.add.container(x, y);
        const bg = this.add.image(0, 0, MT.UI.panelKey(this, 112, 112, 'card')).setScale(1 / S);
        const im = this.add.image(0, 2, MT.TowerArt.heroKey(this, id, 1)).setScale(0.42);
        const pr = MT.text(this, 0, 44, '$' + MT.HEROES[id].cost, 13, { title: true });
        card.add([bg, im, pr]);
        card.setSize(112, 112).setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => {
          MT.Audio.init();
          MT.Audio.play('click');
          select(id);
        });
        c.add(card);
        cards.push({ id, card, bg });
      });
      c.add([nameT, info]);
      select(hero);
      c.add(MT.text(this, W / 2, 342, 'Select difficulty', 18, { color: '#e8f1ff' }));
      const styles = { easy: 'green', medium: 'yellow', hard: 'red' };
      ['easy', 'medium', 'hard'].forEach((d, i) => {
        const D = MT.DIFFS[d];
        c.add(new MT.UI.Button(this, W / 2, 404 + i * 78, 440, 66, {
          style: styles[d], label: D.name.toUpperCase(), size: 30, sub: D.blurb, subSize: 14,
          onClick: () => this.go('Game', { map: m.id, diff: d, hero }),
        }));
      });
      c.add(new MT.UI.Button(this, W / 2, 636, 180, 44, { style: 'blue', label: 'BACK', size: 22, onClick: () => c.destroy() }));
    }
  }

  MT.BootScene = BootScene;
  MT.MenuScene = MenuScene;
  MT.MapSelectScene = MapSelectScene;
})();
