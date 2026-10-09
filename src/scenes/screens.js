// Menu sub-screens: hero gallery, the almanac (towers & mutants) and settings.
(function () {
  const S = MT.Draw.S;
  const W = MT.CFG.W, H = MT.CFG.H;
  const MA = () => MT.MenuArt;
  const money = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function setup(scene, title) {
    MT.setupCamera(scene);
    scene.cameras.main.fadeIn(300, 10, 8, 30);
    MT.Audio.music('menu');
    MA().backdrop(scene, { dim: 0.5 });
    MA().header(scene, title);
  }

  // small rounded label ("BOSS", "ARMORED"...)
  function chip(scene, x, y, str, col) {
    const t = MT.text(scene, 0, 0, str, 12, { title: true, strokeThickness: 2, shadow: false });
    const w = t.width + 16;
    const g = scene.add.graphics();
    g.fillStyle(col, 1);
    g.fillRoundedRect(x, y - 11, w, 22, 11);
    g.lineStyle(2, 0x2a1d14, 1);
    g.strokeRoundedRect(x, y - 11, w, 22, 11);
    t.setPosition(x + w / 2, y);
    return { parts: [g, t], w };
  }

  // A clickable grid card holding an image (towers, mutants, heroes).
  function gridCard(scene, x, y, size, key, onClick, fitSize) {
    const c = scene.add.container(x, y);
    c.bg = scene.add.image(0, 0, MT.UI.panelKey(scene, size, size, 'card')).setScale(1 / S);
    c.im = scene.add.image(0, 0, key);
    MA().fit(c.im, fitSize || size * 0.78, fitSize || size * 0.78);
    c.add([c.bg, c.im]);
    c.setSize(size, size).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => {
      MT.Audio.play('hover');
      c.setScale(1.06);
    });
    c.on('pointerout', () => c.setScale(1));
    c.on('pointerdown', () => {
      MT.Audio.init();
      MT.Audio.play('click');
      onClick();
    });
    c.select = (on) => c.bg.setTexture(MT.UI.panelKey(scene, size, size, on ? 'yellow' : 'card'));
    return c;
  }

  // ------------------------------------------------------------------ Heroes
  class HeroesScene extends Phaser.Scene {
    constructor() {
      super('Heroes');
    }
    create() {
      setup(this, 'HEROES');
      const cur = MT.Save.settings().hero;
      this.view = MT.HEROES[cur] ? cur : 'gru';
      this.cards = MT.HERO_ORDER.map((id, i) => {
        const c = gridCard(this, W / 2 + (i - (MT.HERO_ORDER.length - 1) / 2) * 124, 132, 104, MT.TowerArt.heroKey(this, id, 10), () => this.show(id, true), 84);
        c.id = id;
        return c;
      });
      MT.UI.panel(this, 70, 196, 1140, 506, 'denim');
      this.show(this.view, false);
    }
    abilities(def) {
      // run the level perks on a scratch copy of the stats to find when each ability unlocks
      const s = JSON.parse(JSON.stringify(def.base));
      const out = [];
      def.levels.forEach((lv, i) => {
        if (!lv || !lv.fx) return;
        const had = [s.ability, s.ability2];
        try {
          lv.fx(s);
        } catch (e) {
          /* perks that touch fields the scratch copy lacks */
        }
        if (s.ability && s.ability !== had[0]) out.push({ id: s.ability, lv: i });
        if (s.ability2 && s.ability2 !== had[1]) out.push({ id: s.ability2, lv: i });
      });
      return out;
    }
    show(id, say) {
      this.view = id;
      const def = MT.HEROES[id];
      this.cards.forEach((c) => c.select(c.id === id));
      if (this.page) this.page.destroy();
      const p = (this.page = this.add.container(0, 0));
      // ---- left: portrait
      const spot = this.add.image(250, 600, 'menu_glow').setTint(0xfff3a0).setScale(1.8, 0.5).setAlpha(0.6);
      const im = this.add.image(250, 606, MT.TowerArt.heroKey(this, id, 10)).setOrigin(0.5, 0.93);
      MA().fit(im, 230, 250);
      const base = im.scale;
      im.setScale(base * 0.6);
      this.tweens.add({ targets: im, scale: base, duration: 380, ease: 'Back.easeOut' });
      p.add([spot, im]);
      p.add(MT.text(this, 250, 236, def.name.toUpperCase(), 34, { title: true, color: def.color }));
      p.add(MT.text(this, 250, 270, def.title, 17, { color: '#e8f1ff' }));
      const selected = MT.Save.settings().hero === id;
      p.add(new MT.UI.Button(this, 250, 652, 230, 52, {
        style: selected ? 'gray' : 'green', label: selected ? 'SELECTED' : 'SELECT  ' + money(def.cost), size: 22,
        onClick: () => {
          MT.Save.setSetting('hero', id);
          this.show(id, true);
        },
      }));
      // ---- middle: level perks
      p.add(MT.text(this, 452, 232, 'LEVEL PERKS', 22, { title: true, ox: 0, color: '#ffd83a' }));
      p.add(MT.text(this, 452, 258, def.desc, 13, { ox: 0, oy: 0, align: 'left', wrap: 380, color: '#cfe0ff' }));
      let y = 304;
      def.levels.forEach((lv, i) => {
        if (!lv) return;
        const ab = /ability/i.test(lv.desc);
        const g = this.add.graphics();
        g.fillStyle(ab ? 0xffc61a : 0x24497f, 1);
        g.fillCircle(466, y + 8, 12);
        g.lineStyle(2, 0x2a1d14, 1);
        g.strokeCircle(466, y + 8, 12);
        const n = MT.text(this, 466, y + 8, String(i), 13, { title: true, strokeThickness: 2, shadow: false, color: ab ? '#2a1d14' : '#ffffff', stroke: ab ? false : undefined });
        const t = MT.text(this, 488, y, lv.desc, 14, { ox: 0, oy: 0, align: 'left', wrap: 350, color: ab ? '#ffe28a' : '#ffffff', strokeThickness: 3 });
        p.add([g, n, t]);
        y += Math.max(34, t.height + 10);
      });
      // ---- right: abilities
      p.add(MT.text(this, 880, 232, 'ABILITIES', 22, { title: true, ox: 0, color: '#ffd83a' }));
      const list = this.abilities(def).concat([{ id: 'legendForm', lv: '★' + MT.LEGEND_STAR }]);
      list.forEach((a, k) => {
        const A = MT.ABILITIES[a.id];
        if (!A) return;
        const by = 256 + k * 110;
        p.add(MT.UI.panel(this, 872, by, 310, 106, 'dark'));
        const icon = this.add.image(908, by + 32, A.icon).setDisplaySize(46, 46);
        p.add(icon);
        p.add(MT.text(this, 940, by + 22, A.name, 19, { title: true, ox: 0 }));
        p.add(MT.text(this, 940, by + 45, `${typeof a.lv === 'number' ? 'Level ' + a.lv : a.lv}  ·  ${A.cd}s cooldown`, 12, { ox: 0, color: '#9fd0ff' }));
        const d = MT.text(this, 884, by + 54, A.desc, 13, { ox: 0, oy: 0, align: 'left', wrap: 290, strokeThickness: 3 });
        if (d.height > 36) d.setFontSize(11.5);
        p.add(d);
      });
      // ascension: why a hero keeps mattering after level 10
      const ay = 256 + list.length * 110;
      const partner = MT.TOWERS[def.partner];
      p.add(MT.text(this, 880, ay, 'ASCENSION ★', 18, { title: true, ox: 0, oy: 0, color: '#ffe082' }));
      p.add(MT.text(this, 880, ay + 24, `Past level 10: unlimited ★ stars (round XP or bananas). Each star adds damage, speed, range, ability power and a Command aura for nearby towers.` + (partner ? ` ${partner.name}s get double.` : ''), 12, { ox: 0, oy: 0, align: 'left', wrap: 310, color: '#e8f1ff', strokeThickness: 3 }));
      if (say) {
        const q = def.quotes[Math.floor(Math.random() * def.quotes.length)];
        p.add(MT.menuBubble(this, 300, 340, q));
        MT.Audio.say(q);
      }
    }
  }

  // ------------------------------------------------------------------ Almanac
  class AlmanacScene extends Phaser.Scene {
    constructor() {
      super('Almanac');
    }
    create() {
      setup(this, 'ALMANAC');
      this.tip = new MT.UI.Tooltip(this);
      this.tabs = [['towers', 'TOWERS', 'ic_book'], ['mutants', 'MUTANTS', 'ic_skull']].map(([id, label, icon], i) => {
        const b = new MT.UI.Button(this, W / 2 + (i ? 112 : -112), 116, 210, 48, { style: 'dark', label, icon, size: 22, onClick: () => this.tab(id) });
        b.id = id;
        return b;
      });
      this.tab('towers');
    }
    tab(id) {
      this.mode = id;
      this.tabs.forEach((b) => b.setStyle(b.id === id ? 'yellow' : 'dark'));
      if (this.grid) this.grid.forEach((c) => c.destroy());
      if (this.page) this.page.destroy();
      if (this.frame) this.frame.destroy();
      this.frame = MT.UI.panel(this, 486, 154, 762, 548, 'denim');
      if (id === 'towers') {
        this.grid = MT.TOWER_ORDER.map((t, i) => {
          const c = gridCard(this, 82 + (i % 4) * 100, 200 + Math.floor(i / 4) * 100, 92, MT.TowerArt.key(this, t, [0, 0, 0]), () => this.showTower(t), 80);
          c.id = t;
          c.add(MT.text(this, -34, -32, MT.TOWERS[t].key, 13, { title: true, color: '#ffe066' }));
          return c;
        });
        this.showTower(MT.TOWER_ORDER[0]);
      } else {
        this.grid = MT.ENEMY_ORDER.concat(MT.BOSS_ORDER).map((t, i) => {
          const c = gridCard(this, 64 + (i % 5) * 86, 190 + Math.floor(i / 5) * 86, 80, MT.EnemyArt.key(this, t, false, false, 0), () => this.showMutant(t), 64);
          c.id = t;
          return c;
        });
        this.showMutant(MT.ENEMY_ORDER[0]);
      }
    }
    newPage(id) {
      this.grid.forEach((c) => c.select(c.id === id));
      if (this.page) this.page.destroy();
      this.tip.hide();
      this.page = this.add.container(0, 0);
      return this.page;
    }
    showTower(id) {
      const def = MT.TOWERS[id];
      const p = this.newPage(id);
      const im = this.add.image(570, 250, MT.TowerArt.key(this, id, [4, 2, 0]));
      MA().fit(im, 120, 130);
      p.add(im);
      p.add(MT.text(this, 644, 196, def.name, 32, { title: true, ox: 0 }));
      p.add(MT.text(this, 644, 228, `${money(def.cost)}   ·   hotkey ${def.key}${def.waterOnly ? '   ·   water only' : ''}   ·   ${airInfo(def)}`, 15, { ox: 0, color: '#9fd0ff' }));
      p.add(MT.text(this, 644, 246, def.desc, 15, { ox: 0, oy: 0, align: 'left', wrap: 580 }));
      let y = 318;
      if (def.trait) {
        const t = MT.text(this, 516, y, '★ ' + def.trait, 14, { ox: 0, oy: 0, align: 'left', wrap: 700, color: '#ffe28a', strokeThickness: 3 });
        p.add(t);
        y += t.height + 14;
      }
      // the three upgrade paths
      (def.paths || []).forEach((path, k) => {
        const x = 516 + k * 242;
        p.add(MT.text(this, x, y, path.name, 18, { title: true, ox: 0, oy: 0, align: 'left', color: '#ffd83a' }));
        path.ups.forEach((u, n) => {
          const ry = y + 30 + n * 26;
          const row = MT.text(this, x, ry, `${n + 1}  ${u.name}`, 14, { ox: 0, oy: 0, align: 'left', strokeThickness: 3 });
          const cost = MT.text(this, x + 226, ry, money(u.cost), 13, { ox: 1, oy: 0, color: '#9be15d', strokeThickness: 3 });
          if (row.width > 160) row.setScale(160 / row.width, 1);
          row.setInteractive({ useHandCursor: true });
          row.on('pointerover', () => {
            row.setColor('#ffe066');
            this.tip.show(x, ry + 24, u.name, u.desc);
          });
          row.on('pointerout', () => {
            row.setColor('#ffffff');
            this.tip.hide();
          });
          p.add([row, cost]);
        });
      });
      y += 30 + 4 * 26 + 12;
      // fusion + ultimate
      const F = def.fusion;
      if (F) {
        const g = this.add.graphics();
        g.lineStyle(2, 0xffd166, 0.5);
        g.lineBetween(516, y - 6, 1218, y - 6);
        p.add(g);
        const fu = this.add.image(546, y + 34, MT.TowerArt.fusedKey(this, id));
        MA().fit(fu, 64, 70);
        p.add(fu);
        p.add(MT.text(this, 590, y + 6, `SUPER FUSION: ${F.name}  ·  ${money(F.cost)}`, 16, { title: true, ox: 0, oy: 0, align: 'left', color: F.color || '#ffd83a' }));
        const fd = MT.text(this, 590, y + 28, F.desc, 13, { ox: 0, oy: 0, align: 'left', wrap: 630, strokeThickness: 3 });
        p.add(fd);
        y += Math.max(78, fd.height + 40);
        const U = F.ultimate;
        if (U) {
          const ut = MT.TowerArt.ultimateKey ? MT.TowerArt.ultimateKey(this, id) : null;
          if (ut) {
            const ui = this.add.image(546, y + 30, ut);
            MA().fit(ui, 66, 70);
            p.add(ui);
          }
          p.add(MT.text(this, 590, y + 4, `ULTIMATE: ${U.name}  ·  ${U.mech}`, 16, { title: true, ox: 0, oy: 0, align: 'left', color: '#ff9cf0' }));
          p.add(MT.text(this, 590, y + 26, U.desc, 13, { ox: 0, oy: 0, align: 'left', wrap: 630, strokeThickness: 3 }));
        }
      }
    }
    showMutant(id) {
      const E = MT.ENEMIES[id];
      const p = this.newPage(id);
      const glow = this.add.image(610, 300, 'menu_glow').setTint(0xb04cff).setScale(1.6).setAlpha(0.45);
      const im = this.add.image(610, 300, MT.EnemyArt.key(this, id, false, false, 0));
      MA().fit(im, 190, 190);
      const base = im.scale;
      this.tweens.add({ targets: im, scale: { from: base * 0.6, to: base }, duration: 360, ease: 'Back.easeOut' });
      p.add([glow, im]);
      p.add(MT.text(this, 740, 200, E.name, 34, { title: true, ox: 0, color: '#d9a6ff' }));
      const hp = E.hp >= 1000 ? E.hp.toLocaleString('en-US') : E.hp;
      const lines = [
        `Health: ${hp}   ·   Speed: ${E.speed}`,
        `Total hits to clear (with children): ${E.rbe.toLocaleString('en-US')}`,
      ];
      if (E.children.length) {
        const counts = {};
        E.children.forEach((c) => (counts[c] = (counts[c] || 0) + 1));
        lines.push('Pops into: ' + Object.keys(counts).map((c) => `${counts[c]}× ${MT.ENEMIES[c].name}`).join(', '));
      } else lines.push('Pops into: nothing, it is the smallest mutant');
      p.add(MT.text(this, 740, 236, lines.join('\n'), 15, { ox: 0, oy: 0, align: 'left', lineSpacing: 6, color: '#e8f1ff', wrap: 480 }));
      // trait chips
      const tags = [];
      if (E.final) tags.push(['FINAL BOSS', 0xe2463a]);
      else if (E.boss) tags.push(['GIANT', 0x8a3fd8]);
      if (E.armored) tags.push(['ARMORED', 0x78909c]);
      if (E.alwaysCamo) tags.push(['ALWAYS CAMO', 0x43a047]);
      if (E.blink) tags.push(['BLINKS', 0x26c6da]);
      if (E.emp) tags.push(['EMP', 0x1e88e5]);
      if (E.regen) tags.push(['REGENERATES', 0xec407a]);
      if (E.noSlow) tags.push(['SLOW IMMUNE', 0xff8a3a]);
      if (E.phases) tags.push(['RAGE PHASES', 0xff5252]);
      if (E.speed >= 3) tags.push(['VERY FAST', 0xffc61a]);
      if (E.flying) tags.push(['FLYING', 0x29b6f6]);
      if (E.burrow) tags.push(['TUNNELS', 0x8d6e63]);
      if (E.shield) tags.push(['SHIELDS', 0x26c6da]);
      if (E.bossFight) tags.push(['BOSS BATTLE', 0xff5a4a]);
      let cx = 740;
      tags.forEach(([s, col]) => {
        const c = chip(this, cx, 340, s, col);
        p.add(c.parts);
        cx += c.w + 8;
      });
      p.add(MT.text(this, 516, 400, E.desc, 18, { ox: 0, oy: 0, align: 'left', wrap: 700 }));
      const tip = {
        glider: 'Tip: heroes, Laser Snipers, Tesla, Pilots and the Super Minion hit flyers. A Lab with Radar Scanner gives anti-air to every tower in its ring.',
        jetpack: 'Tip: flyers cut corners, so put anti-air near the end of their shortcut.',
        mole: 'Tip: Submarine sonar pings drag moles back up, dazed. Place fast towers where they surface.',
        shield: 'Tip: the bubble only protects others. Snipers or "Strong" targeting take out the carrier first.',
      }[id];
      if (tip) p.add(MT.text(this, 516, 452, tip, 14, { ox: 0, oy: 0, align: 'left', wrap: 700, color: '#ffe28a' }));
      // variants
      if (!E.boss) {
        p.add(MT.text(this, 516, 500, 'VARIANTS', 20, { title: true, ox: 0, color: '#ffd83a' }));
        [['NORMAL', false, false], ['CAMO', true, false], ['FORTIFIED', false, true]].forEach(([label, camo, fort], k) => {
          const x = 600 + k * 190;
          const v = this.add.image(x, 590, MT.EnemyArt.key(this, id, camo, fort, 0));
          MA().fit(v, 90, 90);
          p.add(v);
          p.add(MT.text(this, x, 660, label, 15, { title: true }));
        });
        p.add(MT.text(this, 1100, 590, 'Camo: only towers\nwith detection see it.\nFortified: double health.', 13, { color: '#cfe0ff' }));
      } else {
        p.add(MT.text(this, 516, 520, 'TIPS', 20, { title: true, ox: 0, color: '#ffd83a' }));
        const tips = {
          mega: 'Rocket Minions and Laser Snipers deal bonus damage to giants.',
          titan: 'Armored: use explosives, lasers or anything that shreds armor.',
          zeppelin: 'Releases four Titans when popped. Keep some damage near the end of the track.',
          phantom: 'Needs camo detection! Sonar from Submarines reveals it for everyone.',
          mecha: 'Its EMP shuts down towers nearby. Spread your towers out.',
          goo: 'Burst it down quickly before it heals. Jelly slow has no effect.',
          macho: 'Gets angrier at 66% and 33% health. Save your abilities for him!',
          vector: 'Boss battle: his squids ink a tower for a few seconds. Stun or freeze him to slow his attacks down.',
          bratt: 'Boss battle: gum bombs trap whole clusters of towers, so spread out. His keytar stuns towers close to him.',
          scarlet: 'Boss battle: she flies, so only anti-air hurts her. Lava lamps melt towers for a few seconds.',
        };
        p.add(MT.text(this, 516, 552, tips[id] || 'Big, tough and full of smaller mutants.', 16, { ox: 0, oy: 0, align: 'left', wrap: 700, color: '#ffe28a' }));
      }
    }
  }

  // can this tower hit flying mutants, and from which upgrade?
  function airInfo(def) {
    if (def.base.air) return 'anti-air';
    for (const path of def.paths || []) {
      const s = JSON.parse(JSON.stringify(def.base));
      for (const u of path.ups) {
        try {
          u.fx(s);
        } catch (e) {
          /* scratch copy */
        }
        if (s.air) return `anti-air: ${u.name}`;
        if (s.buff && s.buff.air) return `${u.name} gives anti-air`;
      }
    }
    return 'no anti-air';
  }

  // ------------------------------------------------------------------ Boss Battles
  class BossSelectScene extends Phaser.Scene {
    constructor() {
      super('BossSelect');
    }
    create() {
      setup(this, 'BOSS BATTLES');
      MT.text(this, W / 2, 96, 'Pick a villain, build your defense, then survive the escort waves until the boss goes down!', 16, { color: '#e8f1ff' });
      MT.BOSS_ORDER.forEach((id, i) => this.card(id, W / 2 + (i - 1) * 404, 412, i));
      const hero = MT.HEROES[MT.Save.settings().hero] || MT.HEROES.gru;
      MT.text(this, W / 2, 700, `Your hero: ${hero.name}  (change it in HEROES)`, 14, { color: '#cfe0ff' });
    }
    card(id, x, y, i) {
      const E = MT.ENEMIES[id];
      const B = MT.BossFight.BOSSES[id];
      const c = this.add.container(x, y);
      c.add(MT.UI.panel(this, -188, -280, 376, 560, 'denim'));
      const glow = this.add.image(0, -120, 'menu_glow').setTint(B.tint).setScale(2.4).setAlpha(0.5);
      this.tweens.add({ targets: glow, alpha: 0.25, duration: 1200, yoyo: true, repeat: -1 });
      const im = this.add.image(0, -112, MT.EnemyArt.key(this, id, false, false, 0));
      MA().fit(im, 230, 240);
      this.tweens.add({ targets: im, y: im.y - 8, duration: 1400 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      c.add([glow, im]);
      c.add(MA().title(this, 0, 36, E.name.toUpperCase(), 28, '#ffffff', B.color));
      c.add(MT.text(this, 0, 76, B.tag, 14, { wrap: 330, color: '#e8f1ff' }));
      const map = MT.MAPS.find((m) => m.id === B.map);
      c.add(MT.text(this, 0, 112, `Arena: ${map.name}${E.flying ? '   ·   FLYING' : ''}`, 13, { title: true, color: '#9fd0ff' }));
      const best = MT.Save.bossBest(id);
      ['normal', 'elite'].forEach((tier, k) => {
        const T = MT.BossFight.TIERS[tier];
        const bx = k ? 86 : -86;
        c.add(new MT.UI.Button(this, bx, 172, 160, 58, {
          style: k ? 'red' : 'green', label: T.name.toUpperCase(), size: 22,
          sub: `HP ${Math.round(E.hp * T.hp).toLocaleString('en-US')}`, subSize: 12,
          onClick: () => MA().go(this, 'Game', { map: B.map, diff: 'medium', hero: MT.Save.settings().hero, boss: id, tier }),
        }));
        const won = best[tier];
        c.add(MT.text(this, bx, 222, won ? `★ best ${MT.BossFight.fmtTime(won)}` : 'not beaten yet', 13, { title: !!won, color: won ? '#ffd83a' : '#9fb3d1' }));
      });
      c.add(MT.text(this, 0, 252, `Start with ${money(MT.BossFight.TIERS.normal.cash)} (Elite ${money(MT.BossFight.TIERS.elite.cash)})`, 12, { color: '#cfe0ff' }));
      c.setAlpha(0);
      c.y += 30;
      this.tweens.add({ targets: c, alpha: 1, y, duration: 380, delay: 100 + i * 90, ease: 'Back.easeOut' });
    }
  }

  // ------------------------------------------------------------------ Settings
  class SettingsScene extends Phaser.Scene {
    constructor() {
      super('Settings');
    }
    create() {
      setup(this, 'SETTINGS');
      MT.UI.panel(this, 250, 100, 780, 600, 'denim');
      const set = () => MT.Save.settings();
      const label = (y, str) => MT.text(this, 300, y, str, 24, { title: true, ox: 0 });
      // volume rows: mute toggle + slider
      const volRow = (y, str, icon, flag, vol, onRelease) => {
        label(y, str);
        const tog = new MT.UI.Button(this, 560, y, 110, 46, {
          style: set()[flag] ? 'green' : 'gray', icon, label: set()[flag] ? 'ON' : 'OFF', size: 18,
          onClick: (b) => {
            MT.Save.setSetting(flag, !set()[flag]);
            MT.Audio.init();
            MT.Audio.applySettings();
            b.setLabel(set()[flag] ? 'ON' : 'OFF').setStyle(set()[flag] ? 'green' : 'gray');
          },
        });
        void tog;
        new MT.UI.Slider(this, 790, y, 260, set()[vol] != null ? set()[vol] : 0.7, {
          onChange: (v) => {
            MT.Save.setSetting(vol, v);
            MT.Audio.init();
            MT.Audio.applySettings();
          },
          onRelease,
        });
      };
      volRow(170, 'MUSIC', 'ic_music', 'music', 'musicVol');
      volRow(244, 'SOUND FX', 'ic_sound', 'sfx', 'sfxVol', () => MT.Audio.play('pop'));
      // screen shake
      label(318, 'SCREEN SHAKE');
      const modes = [['off', 'OFF'], ['low', 'LOW'], ['on', 'FULL']];
      const shakeBtns = modes.map(([m, str], i) => {
        const b = new MT.UI.Button(this, 650 + i * 122, 318, 112, 46, {
          style: 'dark', label: str, size: 18,
          onClick: () => {
            MT.Save.setSetting('shake', m);
            paint();
            if (m !== 'off') this.cameras.main.shake(220, m === 'low' ? 0.003 : 0.008);
          },
        });
        b.mode = m;
        return b;
      });
      const paint = () => shakeBtns.forEach((b) => b.setStyle(set().shake === b.mode ? 'yellow' : 'dark'));
      paint();
      // auto start
      label(392, 'AUTO-START ROUNDS');
      new MT.UI.Button(this, 712, 392, 112, 46, {
        style: set().autoStart ? 'green' : 'gray', label: set().autoStart ? 'ON' : 'OFF', size: 18,
        onClick: (b) => {
          MT.Save.setSetting('autoStart', !set().autoStart);
          b.setLabel(set().autoStart ? 'ON' : 'OFF').setStyle(set().autoStart ? 'green' : 'gray');
        },
      });
      // progress
      label(466, 'PROGRESS');
      this.progress = MT.text(this, 300, 498, '', 15, { ox: 0, oy: 0, align: 'left', color: '#cfe0ff' });
      this.showProgress();
      new MT.UI.Button(this, 900, 476, 180, 50, { style: 'red', label: 'RESET', icon: 'ic_restart', size: 20, onClick: () => this.confirmReset() });
      // credits
      const g = this.add.graphics();
      g.lineStyle(2, 0xffd166, 0.45);
      g.lineBetween(300, 560, 980, 560);
      MT.text(this, W / 2, 616, 'Minion Tower Defense  ·  a fan-made tribute\nEvery picture is painted in code and every sound and song\nis synthesized live in your browser. No files, just bananas.', 15, { color: '#e8f1ff', lineSpacing: 4 });
    }
    showProgress() {
      const st = MT.Save.stats();
      let medals = 0;
      MT.MAPS.forEach((m) => {
        const md = MT.Save.medals(m.id);
        medals += ['easy', 'medium', 'hard'].filter((d) => md[d]).length;
      });
      this.progress.setText(`${medals}/${MT.MAPS.length * 3} medals  ·  ${st.games} games  ·  ${st.wins} wins  ·  ${st.pops.toLocaleString('en-US')} mutants popped`);
    }
    confirmReset() {
      const c = this.add.container(0, 0).setDepth(100);
      c.add(this.add.rectangle(0, 0, W, H, 0x0a0620, 0.75).setOrigin(0).setInteractive());
      c.add(MT.UI.panel(this, 400, 250, 480, 230, 'denim'));
      c.add(MA().title(this, W / 2, 294, 'RESET PROGRESS?', 32, '#ffb4a8', '#ff5a4a'));
      c.add(MT.text(this, W / 2, 344, 'All medals and stats will be lost.\nSettings stay as they are.', 16, { color: '#e8f1ff' }));
      c.add(new MT.UI.Button(this, W / 2 - 100, 424, 170, 54, {
        style: 'red', label: 'RESET', size: 22,
        onClick: () => {
          MT.Save.reset();
          this.showProgress();
          MT.Audio.play('bigpop');
          c.destroy();
        },
      }));
      c.add(new MT.UI.Button(this, W / 2 + 100, 424, 170, 54, { style: 'blue', label: 'KEEP', size: 22, onClick: () => c.destroy() }));
    }
  }

  MT.HeroesScene = HeroesScene;
  MT.AlmanacScene = AlmanacScene;
  MT.SettingsScene = SettingsScene;
  MT.BossSelectScene = BossSelectScene;
})();
