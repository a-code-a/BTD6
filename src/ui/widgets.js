// UI building blocks drawn in the "overalls" style: denim panels with yellow
// stitching and chunky cartoon buttons.
(function () {
  const D = MT.Draw;
  const OL = D.OL;

  const BTN = {
    green: ['#7be35a', '#3fae2a', '#24751a'],
    yellow: ['#ffe680', '#ffc61a', '#c98d00'],
    red: ['#ff8a7a', '#e2463a', '#9b2219'],
    blue: ['#7fb6ff', '#3a7fe0', '#1f4c94'],
    purple: ['#c89bff', '#8a3fd8', '#55208f'],
    gray: ['#c9cfd6', '#8c96a1', '#59616b'],
    dark: ['#4a5566', '#2c3440', '#161b22'],
    teal: ['#8ef0e6', '#1fb5a8', '#0d7068'],
    orange: ['#ffc48a', '#ff8a2a', '#b85a0d'],
  };

  // chunky 3D cartoon button: drop shadow, deep lip, glossy bevelled face and
  // (for icon + label buttons) a recessed socket the icon sits in
  function btnKey(scene, w, h, style, socket) {
    const key = `btn_${style}_${w}x${h}${socket ? '_s' : ''}`;
    D.make(scene, key, w, h + 7, (ctx) => {
      const c = BTN[style] || BTN.green;
      const r = Math.min(15, h / 2.3);
      // soft drop shadow
      D.rrPath(ctx, 3, 8, w - 6, h - 2, r);
      D.fs(ctx, 'rgba(0,0,0,0.28)');
      // lip
      D.rrPath(ctx, 1.5, 5.5, w - 3, h - 1.5, r);
      ctx.fillStyle = D.lin(ctx, 0, h - 8, 0, h + 4, [[0, c[2]], [1, D.shade(c[2], -0.35)]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // face
      D.rrPath(ctx, 1.5, 1.5, w - 3, h - 3, r);
      ctx.fillStyle = D.lin(ctx, 0, 0, 0, h, [[0, c[0]], [0.5, c[1]], [1, D.shade(c[1], -0.12)]]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      // bottom inner shade
      ctx.fillStyle = D.lin(ctx, 0, h * 0.55, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.16)']]);
      ctx.fillRect(0, 0, w, h);
      // recessed icon socket
      if (socket) {
        const sx = h * 0.55, sy = h / 2, sr = h * 0.36;
        D.circlePath(ctx, sx, sy + 1, sr);
        D.fs(ctx, 'rgba(255,255,255,0.35)');
        D.circlePath(ctx, sx, sy, sr);
        ctx.fillStyle = D.rad(ctx, sx, sy - sr * 0.3, sr * 0.1, sx, sy, sr, [[0, 'rgba(0,0,0,0.12)'], [1, 'rgba(0,0,0,0.32)']]);
        ctx.fill();
      }
      ctx.restore();
      // bevel highlight around the top edge
      D.rrPath(ctx, 4, 4, w - 8, h - 8, Math.max(2, r - 2.5));
      ctx.strokeStyle = D.lin(ctx, 0, 4, 0, h - 4, [[0, 'rgba(255,255,255,0.7)'], [0.45, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']]);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // outline
      D.rrPath(ctx, 1.5, 1.5, w - 3, h - 3, r);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // gloss
      D.rrPath(ctx, 6, 4.5, w - 12, h * 0.38, r * 0.7);
      ctx.fillStyle = D.lin(ctx, 0, 4.5, 0, 4.5 + h * 0.38, [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0.08)']]);
      ctx.fill();
      // a little sparkle on bigger buttons
      if (w >= 90 && h >= 40) {
        D.starPath(ctx, 12 + r * 0.4, 9, 4, 4.5, 1.2);
        D.fs(ctx, 'rgba(255,255,255,0.9)');
      }
    });
    return key;
  }

  // flat white face shape used as an additive hover glow
  function btnGlowKey(scene, w, h) {
    const key = `btnglow_${w}x${h}`;
    D.make(scene, key, w, h + 7, (ctx) => {
      const r = Math.min(15, h / 2.3);
      D.rrPath(ctx, 2, 2, w - 4, h - 4, r);
      D.fs(ctx, '#ffffff');
    });
    return key;
  }

  function panelKey(scene, w, h, style) {
    const key = `panel_${style}_${w}x${h}`;
    D.make(scene, key, w, h, (ctx) => {
      const r = style === 'card' ? 10 : 16;
      D.rrPath(ctx, 2, 2, w - 4, h - 4, r);
      if (style === 'denim' || style === 'card') {
        const c = style === 'card' ? ['#5689cf', '#3b6db3'] : ['#3c6fb6', '#244a83'];
        ctx.fillStyle = D.lin(ctx, 0, 0, 0, h, [[0, c[0]], [1, c[1]]]);
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = -h; i < w; i += 4) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + h, h);
          ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 3;
        D.rrPath(ctx, 2, 2, w - 4, h - 4, r);
        ctx.stroke();
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(255,209,102,0.85)';
        ctx.lineWidth = 1.6;
        D.rrPath(ctx, 8, 8, w - 16, h - 16, Math.max(4, r - 6));
        ctx.stroke();
        ctx.restore();
      } else if (style === 'yellow') {
        ctx.fillStyle = D.lin(ctx, 0, 0, 0, h, [[0, '#ffe680'], [1, '#ffc61a']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (style === 'dark') {
        ctx.fillStyle = 'rgba(16,22,36,0.82)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (style === 'cream') {
        ctx.fillStyle = D.lin(ctx, 0, 0, 0, h, [[0, '#fff8e6'], [1, '#f1dfb5']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
    return key;
  }

  function panel(scene, x, y, w, h, style = 'denim') {
    return scene.add.image(x, y, panelKey(scene, w, h, style)).setOrigin(0).setScale(1 / D.S);
  }

  class Button extends Phaser.GameObjects.Container {
    constructor(scene, x, y, w, h, opts = {}) {
      super(scene, x, y);
      this.opts = opts;
      this.w = w;
      this.h = h;
      this.style = opts.style || 'green';
      this.enabled = true;
      this.socket = !!(opts.icon && opts.label);
      this.bg = scene.add.image(0, 3.5, btnKey(scene, w, h, this.style, this.socket)).setScale(1 / D.S);
      this.glow = scene.add.image(0, 3.5, btnGlowKey(scene, w, h)).setScale(1 / D.S).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      this.add([this.bg, this.glow]);
      if (opts.icon) {
        const ix = opts.label ? -w / 2 + h * 0.55 : 0;
        this.icon = scene.add.image(ix, 0, opts.icon).setScale((opts.iconScale || h * 0.62 / 32) / D.S * 2 / 2);
        this.icon.setDisplaySize(h * (opts.iconSize || 0.62), h * (opts.iconSize || 0.62));
        this.add(this.icon);
      }
      if (opts.label != null) {
        const lx = opts.icon ? h * 0.3 : 0;
        this.label = MT.text(scene, lx, opts.sub != null ? -h * 0.15 : 0, opts.label, opts.size || Math.round(h * 0.42), { title: opts.title !== false, color: opts.color || '#ffffff' });
        this.add(this.label);
      }
      if (opts.sub != null) {
        this.sub = MT.text(scene, opts.icon ? h * 0.3 : 0, h * 0.26, opts.sub, opts.subSize || Math.round(h * 0.26), { color: opts.subColor || '#ffffff' });
        this.add(this.sub);
      }
      this.setSize(w, h);
      this.setInteractive({ useHandCursor: true });
      // the face (and everything on it) sinks into the lip while pressed
      this.faceParts = [this.label, this.icon, this.sub].filter(Boolean).map((o) => [o, o.y]);
      const press = (down) => {
        const dy = down ? 2.5 : 0;
        this.bg.y = 3.5 + dy;
        this.glow.y = 3.5 + dy;
        this.faceParts.forEach(([o, y]) => (o.y = y + dy));
      };
      this.on('pointerover', () => {
        if (!this.enabled) return;
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({ targets: this, scale: 1.05, duration: 90, ease: 'Quad.easeOut' });
        this.glow.setAlpha(0.16);
        MT.Audio.play('hover');
        opts.onHover && opts.onHover(true);
      });
      this.on('pointerout', () => {
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 90, ease: 'Quad.easeOut' });
        this.glow.setAlpha(0);
        press(false);
        opts.onHover && opts.onHover(false);
      });
      this.on('pointerdown', () => {
        if (!this.enabled) return;
        press(true);
        this.glow.setAlpha(0.06);
      });
      this.on('pointerup', () => {
        press(false);
        if (this.enabled) this.glow.setAlpha(0.16);
        if (!this.enabled) {
          MT.Audio.play('error');
          opts.onDisabledClick && opts.onDisabledClick();
          return;
        }
        MT.Audio.play('click');
        opts.onClick && opts.onClick(this);
      });
      scene.add.existing(this);
    }
    setEnabled(b) {
      this.enabled = b;
      this.bg.setTint(b ? 0xffffff : 0x8a8a8a);
      if (this.label) this.label.setAlpha(b ? 1 : 0.7);
      return this;
    }
    setStyle(style) {
      if (style === this.style) return this;
      this.style = style;
      this.bg.setTexture(btnKey(this.scene, this.w, this.h, style, this.socket));
      return this;
    }
    setLabel(t) {
      if (this.label) this.label.setText(t);
      return this;
    }
    setSub(t) {
      if (this.sub) this.sub.setText(t);
      return this;
    }
  }

  // Horizontal volume-style slider (0..1). Drag the banana coin or click the bar.
  class Slider extends Phaser.GameObjects.Container {
    constructor(scene, x, y, w, value, opts = {}) {
      super(scene, x, y);
      this.w = w;
      this.value = Phaser.Math.Clamp(value, 0, 1);
      this.opts = opts;
      this.g = scene.add.graphics();
      this.knob = scene.add.image(0, 0, 'ic_coin').setDisplaySize(34, 34);
      this.add([this.g, this.knob]);
      if (opts.pct !== false) {
        this.pct = MT.text(scene, w / 2 + 30, 0, '', 18, { title: true, ox: 0 });
        this.add(this.pct);
      }
      this.setSize(w + 36, 44);
      this.setInteractive({ useHandCursor: true });
      const fromPointer = (p) => {
        const wp = scene.cameras.main.getWorldPoint(p.x, p.y);
        const local = this.getWorldTransformMatrix().applyInverse(wp.x, wp.y);
        this.set((local.x + w / 2) / w, true);
      };
      this.on('pointerdown', (p) => {
        this.dragging = true;
        fromPointer(p);
      });
      const move = (p) => {
        if (this.dragging && p.isDown) fromPointer(p);
      };
      const up = () => {
        if (!this.dragging) return;
        this.dragging = false;
        opts.onRelease && opts.onRelease(this.value);
      };
      scene.input.on('pointermove', move);
      scene.input.on('pointerup', up);
      this.once('destroy', () => {
        scene.input.off('pointermove', move);
        scene.input.off('pointerup', up);
      });
      this.draw();
      scene.add.existing(this);
    }
    set(v, fire) {
      v = Phaser.Math.Clamp(Math.round(v * 20) / 20, 0, 1);
      const changed = v !== this.value;
      this.value = v;
      this.draw();
      if (fire && changed) this.opts.onChange && this.opts.onChange(v);
      return this;
    }
    draw() {
      const w = this.w, g = this.g;
      g.clear();
      g.fillStyle(0x0d1428, 0.9);
      g.fillRoundedRect(-w / 2, -8, w, 16, 8);
      if (this.value > 0) {
        g.fillStyle(0xffc61a, 1);
        g.fillRoundedRect(-w / 2, -8, Math.max(16, w * this.value), 16, 8);
        g.fillStyle(0xffffff, 0.35);
        g.fillRoundedRect(-w / 2 + 4, -6, Math.max(8, w * this.value - 8), 5, 3);
      }
      g.lineStyle(2.5, 0x2a1d14, 1);
      g.strokeRoundedRect(-w / 2, -8, w, 16, 8);
      this.knob.x = -w / 2 + w * this.value;
      if (this.pct) this.pct.setText(Math.round(this.value * 100) + '%');
    }
  }

  // Simple floating tooltip
  class Tooltip {
    constructor(scene) {
      this.scene = scene;
      this.c = scene.add.container(0, 0).setDepth(20000).setVisible(false);
      this.bg = scene.add.graphics();
      this.title = MT.text(scene, 12, 10, '', 16, { title: true, ox: 0, oy: 0, color: '#ffd83a' });
      this.body = MT.text(scene, 12, 34, '', 13, { ox: 0, oy: 0, wrap: 236, strokeThickness: 3 });
      this.c.add([this.bg, this.title, this.body]);
    }
    show(x, y, title, body) {
      this.title.setText(title);
      this.body.setText(body || '');
      const w = 260;
      const h = 44 + (body ? this.body.height : 0);
      this.bg.clear();
      this.bg.fillStyle(0x101624, 0.94);
      this.bg.fillRoundedRect(0, 0, w, h, 10);
      this.bg.lineStyle(2, 0xffd166, 0.9);
      this.bg.strokeRoundedRect(0, 0, w, h, 10);
      const px = Phaser.Math.Clamp(x, 6, MT.CFG.W - w - 6);
      const py = Phaser.Math.Clamp(y, 6, MT.CFG.H - h - 6);
      this.c.setPosition(px, py).setVisible(true);
    }
    hide() {
      this.c.setVisible(false);
    }
  }

  MT.UI = { btnKey, panelKey, panel, Button, Slider, Tooltip, BTN };
})();
