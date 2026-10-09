// Boot (texture generation), the main menu and map/difficulty selection.
(function () {
  const S = MT.Draw.S;
  const W = MT.CFG.W, H = MT.CFG.H;
  const MA = () => MT.MenuArt;

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
        MT.MenuArt.generate(this);
        MT.EnemyArt2.generate(this);
        MT.TOWER_ORDER.forEach((id) => MT.TowerArt.key(this, id, [0, 0, 0]));
        MT.HERO_ORDER.forEach((id) => MT.TowerArt.heroKey(this, id, 1));
        MT.ENEMY_ORDER.concat(MT.BOSS_ORDER).forEach((id) => MT.EnemyArt.key(this, id, false, false, 0));
        t.destroy();
        const el = document.getElementById('boot');
        if (el) el.remove();
        this.scene.start('Menu');
      });
    }
  }

  const DIFF_COL = { Beginner: '#7be35a', Intermediate: '#ffc61a', Advanced: '#ff8a3a', Expert: '#ff5a5a' };
  function medalCount() {
    let n = 0;
    MT.MAPS.forEach((m) => {
      const md = MT.Save.medals(m.id);
      ['easy', 'medium', 'hard'].forEach((d) => md[d] && n++);
    });
    return n;
  }
  function heroId() {
    const h = MT.Save.settings().hero;
    return MT.HEROES[h] ? h : 'gru';
  }

  // Cartoon speech bubble that pops up above a character.
  function bubble(scene, x, y, str) {
    const t = MT.text(scene, 0, 0, str, 16, { color: '#2a1d14', stroke: false, wrap: 200 });
    const w = t.width + 26, h = t.height + 16;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.lineStyle(3, 0x2a1d14, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.fillTriangle(-8, h / 2 - 2, 8, h / 2 - 2, -2, h / 2 + 12);
    g.lineBetween(-8, h / 2, -2, h / 2 + 12);
    g.lineBetween(8, h / 2, -2, h / 2 + 12);
    const c = scene.add.container(x, y - h / 2 - 10, [g, t]).setDepth(50).setScale(0.3);
    scene.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: c, alpha: 0, delay: 1800, duration: 300, onComplete: () => c.destroy() });
    return c;
  }

  // --------------------------------------------------------------------- Menu
  class MenuScene extends Phaser.Scene {
    constructor() {
      super('Menu');
    }
    create() {
      MT.setupCamera(this);
      this.cameras.main.fadeIn(450, 10, 8, 30);
      MT.Audio.music('menu');
      MA().backdrop(this);
      this.sky();
      this.villains();
      this.heroShowcase();
      this.logo();
      this.buttons();
      this.statsBar();
      this.input.once('pointerdown', () => MT.Audio.init());
      this.input.keyboard.once('keydown', () => MT.Audio.init());
      this.input.keyboard.on('keydown-ENTER', () => MA().go(this, 'MapSelect'));
    }

    // a zeppelin crossing the moon and a minion plane doing loops
    sky() {
      const zep = this.add.image(-160, 150, MT.EnemyArt.key(this, 'zeppelin', false, false, 0));
      MA().fit(zep, 140, 84).setAlpha(0.9).setTint(0xc8b0e0);
      this.tweens.add({ targets: zep, x: W + 180, duration: 80000, repeat: -1, delay: 800 });
      MA().bob(this, zep, 6, 2400);
      const plane = this.add.image(0, 0, MT.TowerArt.planeKey(this, [2, 0, 0])).setScale(0.62);
      let t = 0;
      const fly = (time, dt) => {
        t += dt / 1000;
        const a = t * 0.9;
        const x = 128 + Math.cos(a) * 96, y = 150 + Math.sin(a * 2) * 42;
        const dx = -Math.sin(a) * 96, dy = Math.cos(a * 2) * 84;
        plane.setPosition(x, y).setRotation(Math.atan2(dy, dx));
        plane.setFlipY(dx < 0);
      };
      this.events.on('update', fly);
      this.events.once('shutdown', () => this.events.off('update', fly));
    }

    villains() {
      const glow = this.add.image(1110, 590, 'menu_glow').setTint(0xb04cff).setScale(3.6, 2).setAlpha(0.4);
      this.tweens.add({ targets: glow, alpha: 0.2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const ph = this.add.image(950, 420, MT.EnemyArt.key(this, 'phantom', false, false, 0));
      MA().fit(ph, 110, 110).setAlpha(0.5);
      MA().bob(this, ph, 14, 1900);
      this.tweens.add({ targets: ph, alpha: 0.2, duration: 2300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const macho = this.add.image(1140, 672, MT.EnemyArt.key(this, 'macho', false, false, 0)).setOrigin(0.5, 0.95);
      MA().fit(macho, 290, 300);
      this.tweens.add({ targets: macho, scaleY: macho.scaleY * 1.025, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const squad = [['hulk', 912, 684, 74], ['chomper', 984, 702, 52], ['pip', 1046, 712, 40], ['tincan', 1186, 714, 50], ['jailbird', 1246, 704, 58]];
      squad.forEach(([type, x, y, h], i) => {
        const im = this.add.image(x, y, MT.EnemyArt.key(this, type, false, false, 0)).setOrigin(0.5, 0.92);
        MA().fit(im, h * 1.2, h);
        this.tweens.add({ targets: im, y: y - 7, duration: 230 + i * 25, yoyo: true, repeat: -1, ease: 'Quad.easeOut', delay: i * 70 });
        this.tweens.add({ targets: im, angle: { from: -6, to: 6 }, duration: 460 + i * 50, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        im.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          MT.Audio.init();
          MT.Audio.play('pop', x);
          this.tweens.add({ targets: im, scale: im.scale * 1.25, duration: 90, yoyo: true });
        });
      });
    }

    heroShowcase() {
      const x = 222, feet = 650;
      const spot = this.add.image(x, feet - 2, 'menu_glow').setTint(0xfff3a0).setScale(1.9, 0.5).setAlpha(0.7);
      this.tweens.add({ targets: spot, alpha: 0.45, duration: 1300, yoyo: true, repeat: -1 });
      const buddies = [['banana', [2, 0, 0], 84, 676], ['freeze', [0, 2, 0], 360, 682]];
      buddies.forEach(([type, tiers, bx, by], i) => {
        const im = this.add.image(bx, by, MT.TowerArt.key(this, type, tiers)).setOrigin(0.5, MT.TowerArt.FOOT / MT.TowerArt.TH);
        MA().fit(im, 76, 84);
        if (i) im.setFlipX(true);
        this.tweens.add({ targets: im, y: by - 9, duration: 340 + i * 60, yoyo: true, repeat: -1, ease: 'Quad.easeOut', delay: i * 200 });
      });
      this.heroImg = this.add.image(x, feet, MT.TowerArt.heroKey(this, heroId(), 10)).setOrigin(0.5, 0.93);
      MA().fit(this.heroImg, 210, 210);
      this.heroBase = this.heroImg.scale;
      this.tweens.add({ targets: this.heroImg, scaleY: this.heroBase * 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.heroImg.setInteractive({ useHandCursor: true }).on('pointerdown', () => MA().go(this, 'Heroes'));
      // name plate
      this.plate = this.add.graphics();
      this.heroName = MT.text(this, x, 698, '', 22, { title: true });
      // arrows to flip through the heroes
      [[-1, x - 118], [1, x + 118]].forEach(([dir, ax]) => {
        const a = this.add.image(ax, 520, 'ic_arrow').setScale(0.75).setFlipX(dir < 0).setInteractive({ useHandCursor: true });
        this.tweens.add({ targets: a, x: ax + dir * 5, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        a.on('pointerover', () => a.setTint(0xffe066));
        a.on('pointerout', () => a.clearTint());
        a.on('pointerdown', () => this.cycleHero(dir));
      });
      this.updateHero(false);
    }
    cycleHero(dir) {
      MT.Audio.init();
      MT.Audio.play('click');
      const ids = MT.HERO_ORDER;
      const i = (ids.indexOf(heroId()) + dir + ids.length) % ids.length;
      MT.Save.setSetting('hero', ids[i]);
      this.updateHero(true);
    }
    updateHero(say) {
      const def = MT.HEROES[heroId()];
      this.heroImg.setTexture(MT.TowerArt.heroKey(this, def.id, 10));
      this.heroName.setText(def.name.toUpperCase()).setColor(def.color);
      const w = this.heroName.width + 40;
      this.plate.clear();
      this.plate.fillStyle(0x140c28, 0.8);
      this.plate.fillRoundedRect(this.heroImg.x - w / 2, 682, w, 34, 12);
      this.plate.lineStyle(2, 0xffd166, 0.8);
      this.plate.strokeRoundedRect(this.heroImg.x - w / 2, 682, w, 34, 12);
      if (say) {
        this.tweens.add({ targets: this.heroImg, scaleX: { from: this.heroBase * 0.7, to: this.heroBase }, duration: 300, ease: 'Back.easeOut' });
        const q = def.quotes[Math.floor(Math.random() * def.quotes.length)];
        if (this.bub) this.bub.destroy();
        this.bub = bubble(this, this.heroImg.x + 40, 430, q);
        MT.Audio.say(q);
      }
    }

    logo() {
      const logo = this.add.image(W / 2, -170, 'menu_logo').setScale(0.92 / S);
      this.tweens.add({ targets: logo, y: 150, duration: 900, ease: 'Bounce.easeOut', delay: 150 });
      this.tweens.add({ targets: logo, angle: { from: -1.2, to: 1.2 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const tag = MT.text(this, W / 2, 302, 'Gru vs. the Evil Purple Minions', 22, { color: '#ffe3f1' }).setAlpha(0);
      this.tweens.add({ targets: tag, alpha: 1, duration: 500, delay: 900 });
    }

    buttons() {
      const glow = this.add.image(W / 2, 372, 'menu_glow').setTint(0xffe066).setScale(3.4, 1.3).setAlpha(0.45);
      this.tweens.add({ targets: glow, alpha: 0.15, scaleX: 3.8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const play = new MT.UI.Button(this, W / 2, 366, 320, 80, { style: 'yellow', label: 'PLAY', size: 48, icon: 'ic_play', iconSize: 0.55, onClick: () => MA().go(this, 'MapSelect') });
      const boss = new MT.UI.Button(this, W / 2, 446, 320, 52, { style: 'red', label: 'BOSS BATTLES', size: 24, icon: 'ic_skull', iconSize: 0.62, onClick: () => MA().go(this, 'BossSelect') });
      const grid = [
        ['HEROES', 'blue', 'ic_hero', () => MA().go(this, 'Heroes')],
        ['ALMANAC', 'purple', 'ic_book', () => MA().go(this, 'Almanac')],
        ['HOW TO PLAY', 'green', 'ic_help', () => this.howTo()],
        ['SETTINGS', 'teal', 'ic_gear', () => MA().go(this, 'Settings')],
      ];
      const btns = grid.map(([label, style, icon, fn], i) => new MT.UI.Button(this, W / 2 + (i % 2 ? 110 : -110), 512 + Math.floor(i / 2) * 60, 208, 50, { style, label, icon, size: 20, iconSize: 0.6, onClick: fn }));
      [play, boss].concat(btns).forEach((b, i) => {
        const y = b.y;
        b.setAlpha(0).y += 24;
        this.tweens.add({ targets: b, alpha: 1, y, duration: 380, delay: 700 + i * 80, ease: 'Back.easeOut' });
      });
    }

    statsBar() {
      const st = MT.Save.stats();
      const str = `${medalCount()}/${MT.MAPS.length * 3} MEDALS   ·   ${st.pops.toLocaleString('en-US')} POPPED   ·   ${st.wins} WINS   ·   BEST ROUND ${st.best || 0}`;
      const t = MT.text(this, W / 2, 700, str, 13, { title: true, color: '#ffe9a8', strokeThickness: 3 });
      const w = t.width + 36;
      const g = this.add.graphics();
      g.fillStyle(0x140c28, 0.78);
      g.fillRoundedRect(W / 2 - w / 2, 686, w, 28, 14);
      g.lineStyle(2, 0xffd166, 0.5);
      g.strokeRoundedRect(W / 2 - w / 2, 686, w, 28, 14);
      t.setDepth(1);
    }

    howTo() {
      const c = this.add.container(0, 0).setDepth(100);
      c.add(this.add.rectangle(0, 0, W, H, 0x0b0820, 0.75).setOrigin(0).setInteractive());
      c.add(MT.UI.panel(this, 220, 60, 840, 600, 'denim'));
      c.add(MA().title(this, W / 2, 108, 'HOW TO PLAY', 42));
      const lines = [
        '• Evil purple minions march along the path towards Gru. Stop them!',
        '• Pick a minion tower on the right, then click the map to place it.',
        '• Popping a mutant earns bananas ($). Big mutants split into smaller ones.',
        '• Click a placed tower to upgrade it. Each tower has 3 paths with 4 tiers:',
        '   one path can reach tier 4, a second path tier 2.',
        '• FUSE 3 maxed towers of one kind into a super tower. Then: 3 same super',
        '   towers → ULTIMATE giant, 3 different ones → OMEGA MECH. MOVE relocates towers.',
        '• Camo mutants need detection. Armored Tin Cans block bananas & ice.',
        '• FLYING mutants need anti-air: heroes, Sniper, Tesla, Pilot, Super Minion...',
        '• MOLES dig under the track (sonar pulls them up). SHIELD CARRIERS protect friends.',
        '• Submarines only float on water: rivers, ponds, the sea, goo and lava.',
        '• Pick a hero before each game. Heroes level up and unlock abilities (keys 1-9),',
        '   then ASCEND past level 10: unlimited ★ stars that also boost nearby towers.',
        '• 10 maps × 3 difficulties = 30 medals. BOSS BATTLES pit you against villains,',
        '   SANDBOX gives unlimited bananas to test combos. The ALMANAC lists everything.',
        '',
        'Hotkeys: Q W E R T Y A S D G J U I O = towers, H = hero, Space = play/speed,',
        ', . / = upgrades, F = fuse, M = move, Tab = targeting, Backspace = sell, Esc = pause',
      ];
      c.add(MT.text(this, 252, 146, lines.join('\n'), 16, { ox: 0, oy: 0, lineSpacing: 4, strokeThickness: 3, align: 'left' }));
      c.add(new MT.UI.Button(this, W / 2, 618, 220, 52, { style: 'green', label: 'GOT IT!', size: 24, onClick: () => c.destroy() }));
      c.setAlpha(0);
      this.tweens.add({ targets: c, alpha: 1, duration: 180 });
    }
  }

  // ---------------------------------------------------------------- MapSelect
  class MapSelectScene extends Phaser.Scene {
    constructor() {
      super('MapSelect');
    }
    create() {
      MT.setupCamera(this);
      this.cameras.main.fadeIn(300, 10, 8, 30);
      MT.Audio.music('menu');
      MA().backdrop(this, { dim: 0.45 });
      MA().header(this, 'CHOOSE A MAP');
      const medal = this.add.image(1150, 50, 'ic_medal2').setScale(0.5);
      MT.text(this, 1172, 52, `${medalCount()}/${MT.MAPS.length * 3}`, 24, { title: true, ox: 0, color: '#ffe066' });
      void medal;
      const order = { Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3 };
      const maps = MT.MAPS.slice().sort((a, b) => order[a.difficulty] - order[b.difficulty]);
      maps.forEach((m, i) => this.card(m, W / 2 + ((i % 5) - 2) * 246, 228 + Math.floor(i / 5) * 262, i));
      MT.text(this, W / 2, 690, 'Win on Easy, Medium and Hard to earn bronze, silver and gold medals', 15, { color: '#d8ccff' });
    }
    card(m, x, y, i) {
      const c = this.add.container(x, y);
      const paths = m.paths.map((p) => new MT.Path(p));
      c.add(this.add.image(0, 0, MT.UI.panelKey(this, 232, 246, 'denim')).setScale(1 / S));
      const th = this.add.image(0, -36, MT.MapArt.thumb(this, m, paths)).setScale(208 / 510);
      c.add(th);
      const fr = this.add.graphics();
      fr.lineStyle(3, 0x2a1d14, 1);
      fr.strokeRoundedRect(-104, -109.5, 208, 147, 6);
      c.add(fr);
      // feature chips on the thumbnail
      const chips = [];
      if (m.paths.length > 1) chips.push(['2 PATHS', 0xff8a3a]);
      chips.forEach(([str, col], k) => {
        const t = MT.text(this, 0, 0, str, 11, { title: true, strokeThickness: 2, shadow: false });
        const cw = t.width + 12;
        const cx = -98 + k * 70;
        const g = this.add.graphics();
        g.fillStyle(col, 0.95);
        g.fillRoundedRect(cx, -104, cw, 18, 9);
        g.lineStyle(1.5, 0x2a1d14, 1);
        g.strokeRoundedRect(cx, -104, cw, 18, 9);
        t.setPosition(cx + cw / 2, -94.5);
        c.add([g, t]);
      });
      c.add(MT.text(this, 0, 60, m.name, 20, { title: true }));
      c.add(MT.text(this, -100, 90, m.difficulty, 14, { ox: 0, color: DIFF_COL[m.difficulty] }));
      const medals = MT.Save.medals(m.id);
      ['easy', 'medium', 'hard'].forEach((d, k) => {
        c.add(this.add.image(46 + k * 26, 88, medals[d] ? 'ic_medal' + k : 'ic_medal_empty').setScale(0.36));
      });
      c.setSize(232, 246);
      c.setInteractive({ useHandCursor: true });
      c.setAlpha(0);
      c.y += 30;
      this.tweens.add({ targets: c, alpha: 1, y, duration: 350, delay: 120 + i * 45, ease: 'Back.easeOut' });
      c.on('pointerover', () => {
        MT.Audio.play('hover');
        this.tweens.add({ targets: c, scale: 1.05, duration: 120 });
      });
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
      c.on('pointerdown', () => {
        MT.Audio.init();
        MT.Audio.play('click');
        this.pickDifficulty(m);
      });
    }
    pickDifficulty(m) {
      const c = this.add.container(0, 0).setDepth(100);
      c.add(this.add.rectangle(0, 0, W, H, 0x0a0620, 0.75).setOrigin(0).setInteractive());
      c.add(MT.UI.panel(this, 290, 34, 700, 652, 'denim'));
      c.add(MA().title(this, W / 2, 76, m.name, 38));
      c.add(MT.text(this, W / 2, 112, 'Choose your hero', 18, { color: '#e8f1ff' }));
      let hero = heroId();
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
      const styles = { easy: 'green', medium: 'yellow', hard: 'red', sandbox: 'purple' };
      const medals = MT.Save.medals(m.id);
      ['easy', 'medium', 'hard', 'sandbox'].forEach((d, i) => {
        const Df = MT.DIFFS[d];
        c.add(new MT.UI.Button(this, W / 2, 396 + i * 64, 440, 56, {
          style: styles[d], label: Df.name.toUpperCase(), size: 26, sub: Df.blurb, subSize: 13,
          onClick: () => MA().go(this, 'Game', { map: m.id, diff: d, hero }),
        }));
        if (d !== 'sandbox') c.add(this.add.image(W / 2 + 190, 396 + i * 64, medals[d] ? 'ic_medal' + i : 'ic_medal_empty').setScale(0.4));
      });
      c.add(new MT.UI.Button(this, W / 2, 650, 180, 42, { style: 'blue', label: 'BACK', size: 21, onClick: () => c.destroy() }));
      c.setAlpha(0);
      this.tweens.add({ targets: c, alpha: 1, duration: 160 });
    }
  }

  MT.BootScene = BootScene;
  MT.MenuScene = MenuScene;
  MT.MapSelectScene = MapSelectScene;
  MT.menuBubble = bubble;
})();
