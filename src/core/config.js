// Global namespace + constants shared by every module.
window.MT = window.MT || {};

(function () {
  const W = 1280;
  const H = 720;
  const MAP_W = 1020; // play field width; the sidebar fills the rest

  // Render resolution multiplier. The logical game is always 1280x720, but on
  // big / high-DPI screens we render the canvas at up to 2x and zoom the camera
  // so everything (text, vector art) stays crisp.
  const dpr = window.devicePixelRatio || 1;
  const fit = Math.min(window.innerWidth / W, window.innerHeight / H) * dpr;
  const RES = Math.max(1, Math.min(2, Math.round(fit * 4) / 4));

  MT.CFG = {
    W, H, MAP_W, MAP_H: H, RES,
    SIDEBAR_X: MAP_W,
    START_CASH: 650,
    CHEAT_MONEY: 1000000,
    SELL_RATE: 0.7,
    SPEED_UNIT: 42, // px per second for an enemy with speed 1
    FAST_SPEED: 3,
  };

  MT.FONT = {
    title: '"Luckiest Guy", "Arial Black", Impact, sans-serif',
    body: '"Fredoka", "Trebuchet MS", "Segoe UI", sans-serif',
  };

  MT.COL = {
    yellow: 0xffd83a,
    yellowDark: 0xe0a500,
    denim: 0x3a6fb7,
    denimDark: 0x24497f,
    denimDeep: 0x1b335c,
    ink: 0x2a1d14,
    purple: 0x8a3fb8,
    green: 0x4cc23a,
    red: 0xe2463a,
    white: 0xffffff,
  };

  MT.DIFFS = {
    easy: { id: 'easy', name: 'Easy', lives: 200, rounds: 40, price: 0.85, color: '#5fd35a', blurb: '40 rounds · 200 lives · cheaper towers' },
    medium: { id: 'medium', name: 'Medium', lives: 150, rounds: 60, price: 1.0, color: '#ffb02e', blurb: '60 rounds · 150 lives · normal prices' },
    hard: { id: 'hard', name: 'Hard', lives: 100, rounds: 80, price: 1.08, color: '#ff5a4a', blurb: '80 rounds · 100 lives · pricier towers' },
  };

  const U = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    dist2: (ax, ay, bx, by) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay),
    angle: (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax),
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    money: (v) => '$' + Math.floor(v).toLocaleString('en-US'),
    round5: (v) => Math.max(5, Math.round(v / 5) * 5),
    deepClone: (o) => JSON.parse(JSON.stringify(o)),
    hexInt: (h) => parseInt(String(h).replace('#', ''), 16),
  };
  MT.util = U;

  // Applies the zoom trick to a scene's main camera so logical coordinates
  // stay 1280x720 regardless of the backing canvas resolution.
  MT.setupCamera = function (scene) {
    const cam = scene.cameras.main;
    cam.setZoom(RES);
    cam.centerOn(W / 2, H / 2);
    return cam;
  };

  // Text helper with the chunky outlined cartoon look used across the UI.
  MT.text = function (scene, x, y, str, size, opts = {}) {
    const style = {
      fontFamily: opts.font || (opts.title ? MT.FONT.title : MT.FONT.body),
      fontSize: size + 'px',
      fontStyle: opts.bold === false ? 'normal' : opts.title ? 'normal' : '700',
      color: opts.color || '#ffffff',
      align: opts.align || 'center',
      resolution: RES,
    };
    if (opts.stroke !== false) {
      style.stroke = opts.stroke || '#2a1d14';
      style.strokeThickness = opts.strokeThickness != null ? opts.strokeThickness : Math.max(2, Math.round(size / 5));
    }
    if (opts.shadow !== false && opts.stroke !== false) {
      style.shadow = { offsetX: 0, offsetY: Math.max(1, Math.round(size / 12)), color: '#1a120c', blur: 0, stroke: true, fill: true };
    }
    if (opts.wrap) style.wordWrap = { width: opts.wrap, useAdvancedWrap: true };
    if (opts.lineSpacing) style.lineSpacing = opts.lineSpacing;
    const t = scene.add.text(x, y, str, style);
    t.setOrigin(opts.ox != null ? opts.ox : 0.5, opts.oy != null ? opts.oy : 0.5);
    return t;
  };
})();
