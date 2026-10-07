// Artwork for the giant fusion tiers:
//  - 14 Ultimate forms, each a brand-new design (not a scaled-up super tower)
//  - the Omega Mech, assembled from three modules: the selected super tower
//    powers its back, the other two become its left and right arm weapons
//  - effect sprites used by their special attacks
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;
  const TAU = Math.PI * 2;
  const TA = MT.TowerArt;
  const P = TA.props;

  const GOLD_SKIN = { base: '#ffcf33', light: '#fff3a0', dark: '#c48a00', hi: '#fffbe0' };
  const steel = (ctx, x0, x1) => D.lin(ctx, x0, 0, x1, 0, [[0, '#eceff1'], [0.4, '#b0bec5'], [1, '#455a64']]);

  function blob(ctx, x, y, r, fill, stroke, rnd, lw = 1.4) {
    D.blobPath(ctx, x, y, r, 9, 0.16, rnd);
    D.fs(ctx, fill, stroke, lw);
  }

  function zig(ctx, pts, col, w) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = D.rgba(col, 0.35);
    ctx.lineWidth = w * 3;
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, w * 0.4);
    ctx.stroke();
  }

  function tentacle(ctx, pts, w, col) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    ctx.strokeStyle = OL;
    ctx.lineWidth = w + 3;
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.restore();
  }

  function stars(ctx, n, seed, w, h) {
    const rnd = D.rng(seed);
    for (let i = 0; i < n; i++) {
      D.starPath(ctx, rnd() * w, rnd() * h * 0.7, 4, 2 + rnd() * 2.4, 0.8);
      D.fs(ctx, 'rgba(255,255,255,0.9)');
    }
  }

  function miniMinion(ctx, x, y, w, h, o = {}) {
    M.draw(ctx, Object.assign({ x, y, w, h, eyes: 2, hair: 'sprout', mouth: 'happy', seed: Math.round(x * 7 + y), lw: Math.max(0.9, w * 0.05) }, o));
  }

  // ================================================================ Ultimate designs
  const UW = 160, UH = 180, CX = 80, CY = 96, GY = 166;
  const ULT = {};

  // Banana Singularity: a golden black hole with a cosmic minion
  ULT.banana = (ctx) => {
    P.glowRing(ctx, CX, 72, 84, '#ffd740', 0.3);
    ctx.save();
    ctx.translate(CX, 72);
    ctx.scale(1, 0.62);
    D.circlePath(ctx, 0, 0, 68);
    ctx.fillStyle = D.rad(ctx, 0, 0, 4, 0, 0, 68, [[0, '#000000'], [0.25, '#1a0633'], [0.55, '#5e2d00'], [0.8, 'rgba(255,193,7,0.55)'], [1, 'rgba(255,215,64,0)']]);
    ctx.fill();
    for (let k = 0; k < 5; k++) {
      ctx.save();
      ctx.rotate((k / 5) * TAU);
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const tt = i / 30, a = tt * 3.2, r = 10 + tt * 58;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255,224,130,0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    D.ellipsePath(ctx, CX, 72, 15, 10);
    D.fs(ctx, '#000000', '#ffd740', 2.2);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + 0.4;
      P.banana(ctx, CX + Math.cos(a) * 70, 72 + Math.sin(a) * 26, 0.85, a + 1.6, '#ffc400');
    }
    // energy tail instead of legs
    ctx.beginPath();
    ctx.moveTo(CX - 12, 136);
    ctx.quadraticCurveTo(CX - 4, 170, CX + 4, 160);
    ctx.quadraticCurveTo(CX + 10, 150, CX + 12, 136);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, 136, 0, 166, [[0, 'rgba(255,215,64,0.95)'], [1, 'rgba(255,215,64,0)']]);
    ctx.fill();
    P.cape(ctx, CX, 118, 30, 42, '#4a148c');
    M.draw(ctx, {
      x: CX, y: 118, w: 30, h: 42, skin: GOLD_SKIN, eyes: 2, hair: 'sprout', mouth: 'grin', seed: 201, rim: '#ffd740', legs: false,
      denim: { base: '#311b92', light: '#7c4dff', dark: '#1a0b52', stitch: '#ffd740' },
      arms: [{ x0: CX - 13, y0: 116, x1: CX - 19, y1: 98, bend: [CX - 24, 112] }, { x0: CX + 13, y0: 116, x1: CX + 19, y1: 98, bend: [CX + 24, 112] }],
    });
    P.banana(ctx, CX, 93, 2.0, 0, '#ffc400');
    D.shadow(ctx, CX, GY, 30, 6, 0.22);
  };

  // Fart Hurricane: a giant stink tornado with a gas-masked rider
  ULT.fart = (ctx) => {
    D.shadow(ctx, CX, GY, 36, 7, 0.3);
    for (let i = 0; i < 10; i++) {
      const tt = i / 9;
      const y = 160 - tt * 116;
      const rx = 9 + Math.pow(tt, 1.6) * 60;
      const ry = 4 + tt * 9;
      const xo = Math.sin(tt * 6) * 7;
      D.ellipsePath(ctx, CX + xo, y, rx, ry);
      ctx.fillStyle = i % 2 ? 'rgba(155,225,93,0.95)' : 'rgba(118,190,52,0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,90,10,0.85)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(CX + xo, y, rx * 0.8, ry * 0.6, 0, 0.2, 1.7);
      ctx.stroke();
    }
    // stuff caught in the wind
    P.banana(ctx, CX - 60, 66, 0.9, 0.8, '#ffe14a');
    D.rrPath(ctx, CX + 48, 92, 13, 16, 3);
    D.fs(ctx, '#8d5524', OL, 1.1);
    ctx.fillStyle = '#4a4f55';
    ctx.fillRect(CX + 48, 96, 13, 2);
    ctx.fillRect(CX + 48, 103, 13, 2);
    M.draw(ctx, { x: CX + 56, y: 50, w: 12, h: 15, skin: '#b98ae0', eyes: 1, eyeStyle: 'crazy', hair: 'wild', mouth: 'teeth', seed: 5, lw: 0.9, legs: false, overalls: false, arms: [] });
    // gas-masked rider on top
    M.draw(ctx, {
      x: CX, y: 28, w: 24, h: 30, eyes: 1, hair: 'tuft', mouth: 'flat', seed: 21, lw: 1.1, legs: false,
      face: (c2, cx, cy, w, h) => {
        D.rrPath(c2, cx - w * 0.3, cy - h * 0.04, w * 0.6, h * 0.2, 4);
        D.fs(c2, '#4a5a3a', OL, 1);
        D.circlePath(c2, cx, cy + h * 0.14, w * 0.15);
        D.fs(c2, '#2d3524', OL, 1);
      },
      arms: [{ x0: CX - 10, y0: 30, x1: CX - 18, y1: 18 }, { x0: CX + 10, y0: 30, x1: CX + 20, y1: 24 }],
    });
    ctx.save();
    ctx.translate(CX + 22, 22);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(12, -8);
    ctx.lineTo(12, 8);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -8, 0, 8, [[0, '#ffe08a'], [1, '#9a6a12']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  // Doomsday Armada: a missile tank
  ULT.rocket = (ctx) => {
    P.glowRing(ctx, CX, 100, 78, '#ff5722', 0.22);
    D.shadow(ctx, CX, GY + 2, 72, 9, 0.35);
    D.rrPath(ctx, 8, 134, 144, 30, 15);
    D.fs(ctx, '#263238', OL, 2);
    for (let i = 0; i < 6; i++) {
      D.circlePath(ctx, 24 + i * 22.4, 149, 9);
      D.fs(ctx, '#607d8b', OL, 1.4);
      D.circlePath(ctx, 24 + i * 22.4, 149, 3);
      D.fs(ctx, '#37474f');
    }
    ctx.fillStyle = '#455a64';
    for (let x = 14; x < 148; x += 8) ctx.fillRect(x, 132, 4, 3);
    ctx.beginPath();
    ctx.moveTo(14, 137);
    ctx.lineTo(24, 108);
    ctx.lineTo(140, 108);
    ctx.lineTo(152, 137);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, 108, 0, 137, [[0, '#9aae5a'], [0.5, '#6b7a3a'], [1, '#3f4f1c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    D.starPath(ctx, 40, 122, 5, 7, 3);
    D.fs(ctx, '#ffffff', OL, 0.8);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#ffc61a' : '#263238';
      ctx.fillRect(70 + i * 8, 126, 8, 5);
    }
    D.rrPath(ctx, 44, 80, 74, 32, 10);
    ctx.fillStyle = D.lin(ctx, 0, 80, 0, 112, [[0, '#a5b86a'], [1, '#4e5b2a']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    // the missile battery
    ctx.save();
    ctx.translate(92, 84);
    ctx.rotate(-0.5);
    for (let r = 0; r < 3; r++) {
      const y = -17 + r * 12;
      D.rrPath(ctx, -6, y, 46, 11, 4);
      ctx.fillStyle = D.lin(ctx, 0, y, 0, y + 11, [[0, '#eceff1'], [1, '#78909c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, y + 1);
      ctx.quadraticCurveTo(50, y + 5.5, 40, y + 10);
      ctx.closePath();
      D.fs(ctx, '#e53935', OL, 1);
    }
    ctx.restore();
    // commander in the hatch
    M.draw(ctx, { x: 62, y: 68, w: 20, h: 26, eyes: 2, hair: 'bald', mouth: 'grin', seed: 31, lw: 1, legs: false, arms: [{ x0: 54, y0: 70, x1: 49, y1: 58 }] });
    P.helmet(ctx, 62, 49, 20, '#5d6b32', { star: '#ffd54f' });
    D.ellipsePath(ctx, 62, 82, 13, 4);
    D.fs(ctx, '#3f4f1c', OL, 1.2);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(112, 82);
    ctx.lineTo(112, 44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(112, 44);
    ctx.lineTo(128, 48);
    ctx.lineTo(112, 54);
    ctx.closePath();
    D.fs(ctx, '#e53935', OL, 0.8);
  };

  // Eternal Winter: a faceted ice giant
  ULT.freeze = (ctx) => {
    P.glowRing(ctx, CX, 90, 82, '#b3e5fc', 0.45);
    D.ellipsePath(ctx, CX, GY - 2, 64, 10);
    D.fs(ctx, 'rgba(225,245,255,0.85)');
    const ice = (pts, light) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      const xs = pts.map((p) => p[0]);
      ctx.fillStyle = D.lin(ctx, Math.min(...xs), 0, Math.max(...xs), 0, [[0, '#ffffff'], [0.5, light ? '#b3e5fc' : '#81d4fa'], [1, '#0288d1']]);
      ctx.fill();
      ctx.strokeStyle = '#01579b';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    };
    ice([[52, 126], [72, 126], [74, 162], [46, 162]]);
    ice([[88, 126], [108, 126], [114, 162], [86, 162]]);
    // raised arms with ice fists
    ice([[36, 72], [50, 64], [34, 32], [20, 38]]);
    ice([[124, 72], [110, 64], [126, 32], [140, 38]]);
    ice([[16, 40], [24, 20], [42, 26], [38, 42]], true);
    ice([[144, 40], [136, 20], [118, 26], [122, 42]], true);
    // body
    ice([[44, 58], [80, 42], [116, 58], [122, 104], [102, 132], [58, 132], [38, 104]], true);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(80, 42);
    ctx.lineTo(70, 92);
    ctx.lineTo(58, 132);
    ctx.moveTo(70, 92);
    ctx.lineTo(122, 104);
    ctx.moveTo(70, 92);
    ctx.lineTo(38, 104);
    ctx.stroke();
    // head + glowing eyes
    ice([[60, 48], [66, 20], [94, 20], [100, 48], [80, 56]], true);
    [-1, 1].forEach((s) => {
      P.glowRing(ctx, 80 + s * 9, 34, 10, '#18ffff', 0.8);
      D.circlePath(ctx, 80 + s * 9, 34, 4);
      D.fs(ctx, '#ffffff', '#00b8d4', 1.2);
    });
    // icicle crown + shoulder spikes
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(80 + i * 6 - 3, 21);
      ctx.lineTo(80 + i * 6, 6 - (i === 0 ? 6 : 0));
      ctx.lineTo(80 + i * 6 + 3, 21);
      ctx.closePath();
      D.fs(ctx, '#e1f5fe', '#0277bd', 1);
    }
    [[44, 58, -0.6], [116, 58, 0.6]].forEach(([x, y, r]) => {
      for (let k = 0; k < 3; k++) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r + (k - 1) * 0.35);
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(0, -18 + k * 3);
        ctx.lineTo(3, 0);
        ctx.closePath();
        D.fs(ctx, '#e1f5fe', '#0277bd', 1);
        ctx.restore();
      }
    });
    [[18, 80], [142, 92], [30, 140], [132, 140]].forEach(([x, y]) => MT.FXArt.snowflake(ctx, x, y, 5, '#ffffff'));
  };

  // Jelly Abyss: a giant jellyfish with a minion floating inside
  ULT.jelly = (ctx) => {
    P.glowRing(ctx, CX, 78, 84, '#ff80ab', 0.35);
    D.shadow(ctx, CX, GY, 42, 7, 0.25);
    for (let i = 0; i < 8; i++) {
      const x0 = CX - 44 + i * 12.5;
      ctx.beginPath();
      ctx.moveTo(x0, 100);
      ctx.bezierCurveTo(x0 + 14 * Math.sin(i * 1.7), 124, x0 - 12 * Math.cos(i * 1.3), 142, x0 + 6 * Math.sin(i * 2), 168);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 6 - (i % 2);
      ctx.stroke();
      ctx.strokeStyle = i % 2 ? '#f48fb1' : '#ec407a';
      ctx.lineWidth = 4 - (i % 2);
      ctx.stroke();
    }
    M.draw(ctx, {
      x: CX, y: 72, w: 26, h: 34, eyes: 1, hair: 'spiky', mouth: 'happy', seed: 51, lw: 1, legs: false,
      arms: [{ x0: CX - 11, y0: 74, x1: CX - 18, y1: 64 }, { x0: CX + 11, y0: 74, x1: CX + 18, y1: 64 }],
    });
    const bell = () => {
      ctx.beginPath();
      ctx.moveTo(CX - 60, 100);
      ctx.bezierCurveTo(CX - 66, 26, CX + 66, 26, CX + 60, 100);
      for (let i = 0; i < 8; i++) {
        const x1 = CX + 60 - (i + 1) * 15;
        ctx.quadraticCurveTo(x1 + 7.5, 113, x1, 100);
      }
      ctx.closePath();
    };
    bell();
    ctx.fillStyle = D.rad(ctx, CX - 20, 50, 4, CX, 70, 72, [[0, 'rgba(255,224,236,0.6)'], [0.6, 'rgba(255,105,160,0.45)'], [1, 'rgba(194,24,91,0.65)']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    const rnd = D.rng(8);
    for (let i = 0; i < 8; i++) {
      D.circlePath(ctx, CX - 40 + rnd() * 80, 50 + rnd() * 40, 2 + rnd() * 3);
      D.fs(ctx, 'rgba(255,255,255,0.45)');
    }
    D.ellipsePath(ctx, CX - 26, 48, 14, 6, -0.5);
    D.fs(ctx, 'rgba(255,255,255,0.55)');
    for (let i = 0; i < 5; i++) {
      D.circlePath(ctx, 18 + i * 30, 28 + (i % 2) * 14, 3);
      D.fs(ctx, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.7)', 1);
    }
  };

  // Orbital Fortress: a bunker with a railgun and a sky uplink
  ULT.sniper = (ctx) => {
    ctx.fillStyle = D.lin(ctx, 0, 0, 0, 64, [[0, 'rgba(128,216,255,0)'], [1, 'rgba(128,216,255,0.7)']]);
    ctx.fillRect(30, 0, 12, 64);
    D.shadow(ctx, CX, GY, 72, 9, 0.35);
    // radar mast
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, 110);
    ctx.lineTo(36, 66);
    ctx.stroke();
    ctx.save();
    ctx.translate(36, 64);
    ctx.rotate(-0.4);
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI);
    ctx.closePath();
    D.fs(ctx, '#eceff1', OL, 1.4);
    ctx.restore();
    // bunker dome
    const dome = () => {
      ctx.beginPath();
      ctx.moveTo(12, 158);
      ctx.bezierCurveTo(12, 92, 148, 92, 148, 158);
      ctx.closePath();
    };
    dome();
    ctx.fillStyle = D.lin(ctx, 12, 0, 148, 0, [[0, '#cfd8dc'], [0.5, '#90a4ae'], [1, '#455a64']]);
    ctx.fill();
    ctx.save();
    dome();
    ctx.clip();
    const rnd = D.rng(66);
    for (let i = 0; i < 10; i++) {
      D.blobPath(ctx, 14 + rnd() * 130, 100 + rnd() * 56, 7 + rnd() * 6, 7, 0.3, rnd);
      D.fs(ctx, i % 2 ? 'rgba(85,107,47,0.55)' : 'rgba(107,99,62,0.5)');
    }
    ctx.restore();
    dome();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    // window slit with the operator
    D.rrPath(ctx, 50, 120, 60, 16, 4);
    D.fs(ctx, '#1b1b1b', OL, 1.4);
    [70, 82].forEach((x) => {
      D.circlePath(ctx, x, 128, 4.4);
      D.fs(ctx, '#cfd5dc', OL, 0.8);
      D.circlePath(ctx, x + 1, 128, 1.8);
      D.fs(ctx, '#3a2414');
    });
    // sandbags
    for (let i = 0; i < 9; i++) {
      D.rrPath(ctx, 8 + i * 16.5, 152, 17, 10, 5);
      D.fs(ctx, '#c9b27e', OL, 1);
    }
    // the railgun
    D.circlePath(ctx, 86, 100, 14);
    ctx.fillStyle = steel(ctx, 72, 100);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.save();
    ctx.translate(86, 96);
    ctx.rotate(-0.38);
    ctx.fillStyle = D.lin(ctx, 0, -6, 0, 6, [[0, 'rgba(128,216,255,0.2)'], [0.5, 'rgba(178,235,255,0.95)'], [1, 'rgba(128,216,255,0.2)']]);
    ctx.fillRect(4, -4, 60, 8);
    [-10, 5].forEach((y) => {
      D.rrPath(ctx, 0, y, 66, 5, 2);
      D.fs(ctx, '#37474f', OL, 1.2);
    });
    for (let i = 0; i < 5; i++) {
      D.ellipsePath(ctx, 12 + i * 11, 0, 3, 11);
      D.fs(ctx, 'rgba(0,229,255,0.6)', '#00838f', 1.2);
    }
    P.glowRing(ctx, 70, 0, 12, '#80d8ff', 0.9);
    ctx.restore();
  };

  // Storm Titan: a thundercloud giant
  ULT.tesla = (ctx) => {
    ctx.strokeStyle = 'rgba(144,202,249,0.75)';
    ctx.lineWidth = 1.4;
    const rr = D.rng(9);
    for (let i = 0; i < 16; i++) {
      const x = 30 + rr() * 100, y = 104 + rr() * 40;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 12);
      ctx.stroke();
    }
    D.ellipsePath(ctx, CX, GY - 2, 54, 8);
    D.fs(ctx, 'rgba(120,144,156,0.45)');
    zig(ctx, [[52, 100], [46, 122], [56, 128], [42, 164]], '#fff176', 2.4);
    zig(ctx, [[110, 100], [118, 124], [108, 130], [122, 164]], '#fff176', 2.4);
    const rnd = D.rng(13);
    // cloud arms holding bolts
    [[24, 74], [136, 74]].forEach(([x, y]) => {
      for (let k = 0; k < 3; k++) blob(ctx, x + (k - 1) * 6, y + k * 4 - 4, 13 - k * 2, '#5c6b8a', OL, rnd);
    });
    P.boltIcon(ctx, 12, 50, 2.4, '#fff176');
    P.boltIcon(ctx, 148, 50, 2.4, '#fff176');
    // the big cloud
    const pos = [[80, 46, 30], [52, 60, 26], [108, 60, 26], [36, 82, 20], [124, 82, 20], [64, 92, 24], [96, 92, 24], [80, 74, 32]];
    pos.forEach(([x, y, r]) => blob(ctx, x, y, r, '#5c6b8a', OL, rnd, 1.6));
    pos.slice(0, 3).forEach(([x, y, r]) => blob(ctx, x - 4, y - 6, r * 0.6, 'rgba(143,163,199,0.9)', null, rnd));
    // face
    [-1, 1].forEach((s) => {
      P.glowRing(ctx, 80 + s * 16, 70, 14, '#fff59d', 0.9);
      D.circlePath(ctx, 80 + s * 16, 70, 7);
      D.fs(ctx, '#fffde7', OL, 1.4);
      D.circlePath(ctx, 80 + s * 16 + 1, 71, 2.6);
      D.fs(ctx, '#1a1a1a');
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80 + s * 26, 58);
      ctx.lineTo(80 + s * 8, 64);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(64, 88);
    for (let i = 1; i <= 8; i++) ctx.lineTo(64 + i * 4, 88 + (i % 2 ? 5 : 0));
    ctx.strokeStyle = '#fff59d';
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = -2; i <= 2; i++) P.boltIcon(ctx, 80 + i * 12, 16 + Math.abs(i) * 4, 0.9, '#fff176');
  };

  // Sky Carrier: a flying aircraft carrier
  ULT.pilot = (ctx) => {
    D.shadow(ctx, CX, GY + 4, 58, 7, 0.25);
    [36, 80, 124].forEach((x) => {
      P.glowRing(ctx, x, 148, 14, '#ff9100', 0.85);
      ctx.beginPath();
      ctx.moveTo(x - 6, 138);
      ctx.lineTo(x, 160);
      ctx.lineTo(x + 6, 138);
      ctx.closePath();
      D.fs(ctx, '#ffe082');
      D.rrPath(ctx, x - 9, 128, 18, 11, 3);
      D.fs(ctx, '#455a64', OL, 1.2);
    });
    ctx.beginPath();
    ctx.moveTo(6, 104);
    ctx.lineTo(158, 100);
    ctx.lineTo(140, 132);
    ctx.lineTo(18, 132);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, 100, 0, 132, [[0, '#b0bec5'], [1, '#455a64']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      D.circlePath(ctx, 26 + i * 13, 117, 2.4);
      D.fs(ctx, '#ffe082', OL, 0.6);
    }
    D.rrPath(ctx, 4, 94, 154, 11, 3);
    D.fs(ctx, '#37474f', OL, 1.6);
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#ffd83a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(10, 99.5);
    ctx.lineTo(150, 99.5);
    ctx.stroke();
    ctx.restore();
    // island tower
    D.rrPath(ctx, 104, 56, 26, 40, 4);
    ctx.fillStyle = steel(ctx, 104, 130);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    [110, 122].forEach((x) => {
      D.rrPath(ctx, x - 4, 64, 8, 8, 2);
      D.fs(ctx, '#80deea', OL, 0.8);
      D.circlePath(ctx, x, 68, 1.6);
      D.fs(ctx, '#3a2414');
    });
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(117, 56);
    ctx.lineTo(117, 36);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(117, 37);
    ctx.lineTo(132, 41);
    ctx.lineTo(117, 46);
    ctx.closePath();
    D.fs(ctx, '#ffc400', OL, 0.8);
    // planes parked on deck
    [[8, 70, [2, 0, 0]], [52, 72, [0, 4, 0]]].forEach(([x, y, t]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(0.62, 0.62);
      TA.drawPlane(ctx, t, false);
      ctx.restore();
    });
    // deck crew waving flags
    miniMinion(ctx, 92, 86, 10, 13, { mouth: 'grin', arms: [{ x0: 87, y0: 86, x1: 83, y1: 79 }] });
    D.rrPath(ctx, 80, 74, 5, 4, 1);
    D.fs(ctx, '#ff6d00', OL, 0.6);
  };

  // Minionstock Festival: the whole band on a big stage
  ULT.rockstar = (ctx) => {
    D.shadow(ctx, CX, GY + 2, 76, 9, 0.35);
    D.rrPath(ctx, 14, 34, 132, 102, 6);
    ctx.fillStyle = D.lin(ctx, 0, 34, 0, 136, [[0, '#4a148c'], [1, '#12001f']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    const beams = [['#ff4081', 30], ['#40c4ff', 62], ['#ffd83a', 98], ['#69f0ae', 130]];
    beams.forEach(([c, x]) => {
      ctx.beginPath();
      ctx.moveTo(x - 3, 32);
      ctx.lineTo(x - 22, 140);
      ctx.lineTo(x + 22, 140);
      ctx.lineTo(x + 3, 32);
      ctx.closePath();
      ctx.fillStyle = D.rgba(c, 0.18);
      ctx.fill();
    });
    D.rrPath(ctx, 8, 24, 144, 10, 2);
    D.fs(ctx, '#90a4ae', OL, 1.4);
    ctx.strokeStyle = 'rgba(42,29,20,0.6)';
    ctx.lineWidth = 1;
    for (let x = 12; x < 150; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 24);
      ctx.lineTo(x + 10, 34);
      ctx.stroke();
    }
    beams.forEach(([c, x]) => {
      D.circlePath(ctx, x, 36, 4.2);
      D.fs(ctx, c, OL, 1);
    });
    // banner
    D.rrPath(ctx, 40, 6, 80, 15, 4);
    D.fs(ctx, '#ffd83a', OL, 1.4);
    ctx.fillStyle = OL;
    ctx.font = 'bold 9px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MINIONSTOCK', 80, 14);
    P.ampBox(ctx, 2, 70, 24, 72);
    P.ampBox(ctx, 134, 70, 24, 72);
    // floor
    D.rrPath(ctx, 6, 138, 148, 24, 3);
    ctx.fillStyle = D.lin(ctx, 0, 138, 0, 162, [[0, '#a1887f'], [1, '#4e342e']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      D.circlePath(ctx, 18 + i * 18, 156, 2);
      D.fs(ctx, beams[i % 4][0]);
    }
    // the band: drummer, guitarist, singer
    miniMinion(ctx, 80, 96, 18, 24, { eyes: 1, hair: 'spiky', mouth: 'grin', legs: false, arms: [{ x0: 72, y0: 98, x1: 66, y1: 108 }, { x0: 88, y0: 98, x1: 94, y1: 108 }] });
    D.circlePath(ctx, 80, 122, 15);
    D.fs(ctx, '#ffffff', OL, 1.6);
    D.circlePath(ctx, 80, 122, 11);
    D.fs(ctx, '#e53935');
    [[62, 108], [98, 108]].forEach(([x, y]) => {
      D.ellipsePath(ctx, x, y, 9, 2.4);
      D.fs(ctx, '#ffd54f', OL, 1);
    });
    miniMinion(ctx, 42, 112, 22, 30, { hair: 'spiky', mouth: 'o', arms: [] });
    P.guitar(ctx, 40, 122, -0.4, true);
    miniMinion(ctx, 118, 112, 22, 30, { eyes: 1, hair: 'tuft', mouth: 'happy', arms: [{ x0: 128, y0: 112, x1: 132, y1: 98, bend: [136, 108] }] });
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(134, 136);
    ctx.lineTo(134, 96);
    ctx.stroke();
    D.circlePath(ctx, 133, 95, 3.4);
    D.fs(ctx, '#424242', OL, 1);
  };

  // Spike Colossus: an iron golem bristling with nails
  ULT.nails = (ctx) => {
    P.glowRing(ctx, CX, 96, 76, '#ff6d00', 0.25);
    D.shadow(ctx, CX, GY, 54, 9, 0.38);
    // nails sticking out of the body
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      P.nailIcon(ctx, 80 + Math.cos(a) * 50, 100 + Math.sin(a) * 40, 14, a + Math.PI / 2, '#90a4ae');
    }
    [[46, 128], [90, 128]].forEach(([x, y]) => {
      D.rrPath(ctx, x, y, 24, 32, 4);
      ctx.fillStyle = steel(ctx, x, x + 24);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      D.rrPath(ctx, x - 6, y + 28, 36, 10, 4);
      D.fs(ctx, '#37474f', OL, 1.4);
    });
    // left arm with spiked fist
    D.rrPath(ctx, 18, 72, 18, 46, 6);
    ctx.fillStyle = steel(ctx, 18, 36);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.stroke();
    for (let i = 0; i < 6; i++) P.nailIcon(ctx, 27, 128, 9, (i / 6) * TAU, '#cfd8dc');
    D.circlePath(ctx, 27, 128, 11);
    D.fs(ctx, '#546e7a', OL, 1.6);
    // body
    D.rrPath(ctx, 36, 64, 88, 70, 12);
    ctx.fillStyle = steel(ctx, 36, 124);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    [[44, 72], [116, 72], [44, 126], [116, 126]].forEach(([x, y]) => {
      D.circlePath(ctx, x, y, 2.4);
      D.fs(ctx, '#eceff1', OL, 0.6);
    });
    D.rrPath(ctx, 60, 92, 40, 24, 4);
    D.fs(ctx, '#1b1b1b', OL, 1.4);
    P.glowRing(ctx, 80, 104, 22, '#ff6d00', 0.75);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#ffab40' : '#ff6d00';
      ctx.fillRect(64 + i * 7, 95, 4, 18);
    }
    // right arm with a giant hammer
    D.rrPath(ctx, 124, 72, 16, 30, 6);
    ctx.fillStyle = steel(ctx, 124, 140);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.save();
    ctx.translate(132, 80);
    ctx.rotate(0.1);
    D.rrPath(ctx, -3, -52, 6, 54, 2);
    D.fs(ctx, '#8d5524', OL, 1.4);
    D.rrPath(ctx, -18, -70, 36, 20, 4);
    ctx.fillStyle = steel(ctx, -18, 18);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
    // head
    D.rrPath(ctx, 58, 34, 44, 32, 8);
    ctx.fillStyle = steel(ctx, 58, 102);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    P.glowRing(ctx, 80, 50, 18, '#ff9100', 0.7);
    D.rrPath(ctx, 64, 46, 32, 7, 3);
    D.fs(ctx, '#ffab40', OL, 1.2);
    P.helmet(ctx, 80, 18, 44, '#ffca28');
  };

  // Kraken King: a crowned kraken rising from the water
  ULT.sub = (ctx) => {
    D.ellipsePath(ctx, CX, 152, 76, 17);
    ctx.fillStyle = D.rad(ctx, CX, 150, 4, CX, 152, 76, [[0, '#4fc3f7'], [1, '#01579b']]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // back tentacles
    tentacle(ctx, [[30, 150], [4, 110], [22, 80], [36, 60], [26, 46]], 10, '#7e57c2');
    tentacle(ctx, [[130, 150], [158, 110], [140, 76], [128, 56], [140, 40]], 10, '#7e57c2');
    // the mantle
    ctx.beginPath();
    ctx.moveTo(34, 150);
    ctx.bezierCurveTo(26, 40, 134, 40, 126, 150);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 34, 0, 126, 0, [[0, '#b39ddb'], [0.45, '#7e57c2'], [1, '#4527a0']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    const rnd = D.rng(17);
    for (let i = 0; i < 7; i++) {
      D.circlePath(ctx, 50 + rnd() * 60, 70 + rnd() * 40, 2 + rnd() * 3);
      D.fs(ctx, 'rgba(209,196,233,0.8)');
    }
    // eyes
    [-1, 1].forEach((s) => {
      D.ellipsePath(ctx, 80 + s * 17, 104, 11, 9);
      D.fs(ctx, '#ffeb3b', OL, 1.6);
      D.rrPath(ctx, 80 + s * 17 - 7, 102, 14, 4, 2);
      D.fs(ctx, '#1a1a1a');
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(80 + s * 29, 92);
      ctx.lineTo(80 + s * 7, 97);
      ctx.stroke();
    });
    P.crown(ctx, 80, 50, 1.6, '#26c6da');
    // front tentacles: one holds a yellow submarine, one a trident
    tentacle(ctx, [[52, 150], [30, 132], [26, 104], [24, 88], [36, 82]], 9, '#9575cd');
    ctx.save();
    ctx.translate(30, 74);
    D.ellipsePath(ctx, 0, 0, 17, 7);
    D.fs(ctx, '#ffd83a', OL, 1.4);
    D.rrPath(ctx, -5, -12, 9, 7, 2);
    D.fs(ctx, '#ffd83a', OL, 1.2);
    [-7, 0, 7].forEach((x) => {
      D.circlePath(ctx, x, 0, 2);
      D.fs(ctx, '#4fc3f7', OL, 0.6);
    });
    ctx.restore();
    tentacle(ctx, [[108, 150], [132, 132], [134, 104], [136, 86], [126, 80]], 9, '#9575cd');
    ctx.strokeStyle = OL;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(130, 120);
    ctx.lineTo(140, 20);
    ctx.stroke();
    ctx.strokeStyle = '#ffc400';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(130, 24);
    ctx.lineTo(132, 12);
    ctx.moveTo(140, 20);
    ctx.lineTo(141, 6);
    ctx.moveTo(150, 26);
    ctx.lineTo(150, 14);
    ctx.moveTo(130, 26);
    ctx.quadraticCurveTo(140, 32, 150, 28);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.strokeStyle = '#ffc400';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  };

  // Banana Planet: a tiny ringed banana world with its own farmers
  ULT.farm = (ctx) => {
    stars(ctx, 10, 12, UW, UH);
    D.shadow(ctx, CX, GY, 48, 7, 0.25);
    const ring = (front) => {
      ctx.save();
      ctx.translate(CX, 100);
      ctx.rotate(-0.22);
      ctx.beginPath();
      ctx.ellipse(0, 0, 76, 18, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 9;
      ctx.stroke();
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,248,200,0.8)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    };
    ring(false);
    D.circlePath(ctx, CX, 100, 48);
    ctx.fillStyle = D.rad(ctx, CX - 16, 82, 4, CX, 100, 50, [[0, '#fff9c4'], [0.5, '#fbc02d'], [1, '#8d6e00']]);
    ctx.fill();
    ctx.save();
    D.circlePath(ctx, CX, 100, 48);
    ctx.clip();
    ctx.strokeStyle = 'rgba(120,80,0,0.35)';
    ctx.lineWidth = 5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(CX, 100 + i * 14, 52, 6, 0.1, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    D.circlePath(ctx, CX, 100, 48);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    P.bananaTree(ctx, 58, 56, 0.95, false, 1);
    P.bananaTree(ctx, 104, 56, 0.95, true, 2);
    miniMinion(ctx, CX, 48, 14, 18, { arms: [{ x0: 74, y0: 48, x1: 70, y1: 54 }, { x0: 86, y0: 48, x1: 91, y1: 42 }] });
    P.strawHat(ctx, CX, 38, 14);
    D.rrPath(ctx, 112, 112, 16, 12, 2);
    D.fs(ctx, '#c62828', OL, 1);
    ctx.beginPath();
    ctx.moveTo(110, 112);
    ctx.lineTo(120, 104);
    ctx.lineTo(130, 112);
    ctx.closePath();
    D.fs(ctx, '#8d2a1a', OL, 1);
    ring(true);
  };

  // Nefario's Moon Base
  ULT.lab = (ctx) => {
    stars(ctx, 12, 21, UW, UH);
    D.circlePath(ctx, 24, 24, 15);
    ctx.fillStyle = D.rad(ctx, 20, 20, 1, 24, 24, 15, [[0, '#81d4fa'], [1, '#0277bd']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    const rnd = D.rng(4);
    for (let i = 0; i < 3; i++) {
      D.blobPath(ctx, 18 + rnd() * 12, 18 + rnd() * 12, 4, 6, 0.4, rnd);
      D.fs(ctx, '#66bb6a');
    }
    D.ellipsePath(ctx, CX, 152, 78, 20);
    ctx.fillStyle = D.lin(ctx, 0, 132, 0, 172, [[0, '#e0e0e0'], [1, '#757575']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    [[34, 150, 9], [118, 156, 7], [70, 162, 5]].forEach(([x, y, r]) => {
      D.ellipsePath(ctx, x, y, r, r * 0.4);
      D.fs(ctx, 'rgba(90,90,90,0.5)');
    });
    // rocket on its pad
    ctx.save();
    ctx.translate(24, 96);
    D.rrPath(ctx, -6, 0, 12, 40, 5);
    D.fs(ctx, '#ffffff', OL, 1.4);
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.quadraticCurveTo(0, -14, 6, 4);
    ctx.closePath();
    D.fs(ctx, '#e53935', OL, 1.2);
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(s * 6, 28);
      ctx.lineTo(s * 13, 42);
      ctx.lineTo(s * 6, 40);
      ctx.closePath();
      D.fs(ctx, '#e53935', OL, 1);
    });
    D.circlePath(ctx, 0, 14, 3);
    D.fs(ctx, '#80deea', OL, 0.8);
    ctx.restore();
    // laser cannon tower
    D.rrPath(ctx, 118, 64, 18, 80, 3);
    ctx.fillStyle = steel(ctx, 118, 136);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.save();
    ctx.translate(127, 62);
    ctx.rotate(-0.9);
    D.rrPath(ctx, -6, -8, 40, 16, 6);
    D.fs(ctx, '#5e35b1', OL, 1.6);
    P.energyBall(ctx, 38, 0, 5, '#e040fb');
    ctx.restore();
    // glass habitat with a scientist inside
    miniMinion(ctx, 76, 122, 20, 26, { eyes: 2, hair: 'flat', mouth: 'o', rim: '#9e9e9e', arms: [{ x0: 85, y0: 122, x1: 90, y1: 116 }] });
    ctx.beginPath();
    ctx.arc(76, 140, 40, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(178,235,242,0.35)';
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(42,29,20,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(76, 140, 40, 40 - i * 10, 0, Math.PI, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(76, 100);
    ctx.lineTo(76, 86);
    ctx.stroke();
    D.circlePath(ctx, 76, 85, 3);
    D.fs(ctx, '#ff1744', OL, 1);
    D.ellipsePath(ctx, 60, 112, 8, 4, -0.6);
    D.fs(ctx, 'rgba(255,255,255,0.6)');
  };

  // Banana Multiverse: a cosmic super minion with portals to other universes
  ULT.super = (ctx) => {
    D.circlePath(ctx, CX, 84, 76);
    ctx.fillStyle = D.rad(ctx, CX, 84, 6, CX, 84, 76, [[0, '#311b92'], [0.7, 'rgba(49,27,146,0.5)'], [1, 'rgba(49,27,146,0)']]);
    ctx.fill();
    stars(ctx, 14, 33, UW, UH);
    const portal = (x, y, c, skin) => {
      D.ellipsePath(ctx, x, y, 22, 28);
      ctx.fillStyle = D.rad(ctx, x, y, 2, x, y, 28, [[0, '#ffffff'], [0.35, c], [1, D.shade(c, -0.6)]]);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      miniMinion(ctx, x, y + 2, 14, 19, { skin, eyes: 2, hair: 'bald', mouth: 'grin', noLogo: true, legs: false,
        denim: { base: D.shade(c, -0.3), light: c, dark: D.shade(c, -0.6), stitch: '#ffffff' }, arms: [] });
    };
    portal(26, 66, '#00e5ff', '#80deea');
    portal(80, 30, '#e040fb', '#ce93d8');
    portal(134, 66, '#76ff03', '#ccff90');
    // the main super minion
    P.cape(ctx, CX, 112, 30, 44, '#fff176');
    P.glowRing(ctx, CX, 110, 34, '#fff59d', 0.6);
    M.draw(ctx, {
      x: CX, y: 112, w: 30, h: 42, eyes: 2, hair: 'bald', mouth: 'grin', seed: 81, noLogo: true, rim: '#ffd740',
      denim: { base: '#ffb300', light: '#fff176', dark: '#e65100', stitch: '#ffffff' },
      outfit: (c2, cx, cy, w, h) => {
        D.starPath(c2, cx, cy + h * 0.17, 5, w * 0.15, w * 0.07);
        D.fs(c2, '#e53935', OL, 0.8);
      },
      arms: [{ x0: CX - 13, y0: 110, x1: CX - 20, y1: 88, bend: [CX - 22, 104] }, { x0: CX + 13, y0: 110, x1: CX + 22, y1: 122 }],
    });
    for (let i = 0; i < 4; i++) {
      D.starPath(ctx, CX - 30 + i * 20, 152 + (i % 2) * 6, 4, 4, 1.2);
      D.fs(ctx, '#fff59d');
    }
    D.shadow(ctx, CX, GY, 30, 6, 0.22);
  };

  // ================================================================ Omega Mech modules
  // arm(): drawn at the hand, weapon pointing to +x (mirrored for the left arm)
  // back(): drawn at the top of the back, pointing upwards
  const MODS = {
    banana: {
      arm(ctx) {
        D.rrPath(ctx, 0, -8, 40, 16, 6);
        ctx.fillStyle = D.lin(ctx, 0, -8, 0, 8, [[0, '#fff59d'], [0.5, '#ffd83a'], [1, '#c79100']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        D.ellipsePath(ctx, 40, 0, 4, 9);
        D.fs(ctx, '#6b4a1f', OL, 1.4);
        for (let i = 0; i < 3; i++) P.banana(ctx, 10 + i * 6, -12, 0.8, -1.2 + i * 0.3, '#ffe14a');
      },
      back(ctx) {
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i - 2) * 0.4;
          ctx.save();
          ctx.rotate(a + Math.PI / 2);
          P.banana(ctx, 0, -40, 2.6, Math.PI / 2 - 0.15, '#ffc400');
          ctx.restore();
        }
        P.bananaBall(ctx, 0, -62, 12, true);
      },
    },
    fart: {
      arm(ctx) {
        D.rrPath(ctx, 0, -8, 24, 16, 6);
        D.fs(ctx, '#7cb342', OL, 1.4);
        ctx.beginPath();
        ctx.moveTo(22, -5);
        ctx.lineTo(42, -13);
        ctx.quadraticCurveTo(47, 0, 42, 13);
        ctx.lineTo(22, 5);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, 0, -13, 0, 13, [[0, '#ffe08a'], [0.5, '#e0a52a'], [1, '#9a6a12']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        D.ellipsePath(ctx, 43, 0, 3, 12);
        D.fs(ctx, '#3a2a10', OL, 1);
      },
      back(ctx) {
        [-18, 18].forEach((x) => {
          D.rrPath(ctx, x - 11, -60, 22, 58, 11);
          ctx.fillStyle = D.lin(ctx, x - 11, 0, x + 11, 0, [[0, '#c5f08a'], [1, '#558b2f']]);
          ctx.fill();
          ctx.strokeStyle = OL;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          D.circlePath(ctx, x, -60, 4);
          D.fs(ctx, '#b0b0b0', OL, 1);
        });
        const rnd = D.rng(2);
        for (let i = 0; i < 4; i++) {
          D.blobPath(ctx, -16 + i * 11, -74 - (i % 2) * 6, 7, 7, 0.2, rnd);
          D.fs(ctx, 'rgba(155,225,93,0.9)', 'rgba(42,29,20,0.5)', 1);
        }
      },
    },
    rocket: {
      arm(ctx) {
        for (let i = 0; i < 3; i++) {
          const y = -15 + i * 10;
          D.rrPath(ctx, 0, y, 40, 9, 4);
          D.fs(ctx, '#6b7a3a', OL, 1.2);
          ctx.beginPath();
          ctx.moveTo(40, y + 1);
          ctx.quadraticCurveTo(48, y + 4.5, 40, y + 8);
          ctx.closePath();
          D.fs(ctx, '#e53935', OL, 1);
        }
      },
      back(ctx) {
        D.rrPath(ctx, -40, -18, 80, 18, 4);
        D.fs(ctx, '#4e5b31', OL, 1.6);
        [-30, -10, 10, 30].forEach((x) => {
          D.rrPath(ctx, x - 6, -66, 12, 52, 5);
          ctx.fillStyle = D.lin(ctx, x - 6, 0, x + 6, 0, [[0, '#ffffff'], [1, '#90a4ae']]);
          ctx.fill();
          ctx.strokeStyle = OL;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - 6, -62);
          ctx.quadraticCurveTo(x, -80, x + 6, -62);
          ctx.closePath();
          D.fs(ctx, '#e53935', OL, 1);
        });
      },
    },
    freeze: {
      arm(ctx) {
        D.rrPath(ctx, 0, -7, 32, 14, 5);
        ctx.fillStyle = D.lin(ctx, 0, -7, 0, 7, [[0, '#ffffff'], [1, '#90a4ae']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = '#29b6f6';
          ctx.fillRect(6 + i * 7, -7, 3, 14);
        }
        P.glowRing(ctx, 38, 0, 12, '#80d8ff', 0.9);
        D.starPath(ctx, 38, 0, 6, 8, 3.4);
        D.fs(ctx, '#e1f5fe', '#0288d1', 1.2);
      },
      back(ctx) {
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.32;
          const len = 40 + (i % 2 ? 0 : 22);
          ctx.save();
          ctx.rotate(a + Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(0, -len);
          ctx.lineTo(6, 0);
          ctx.closePath();
          ctx.fillStyle = D.lin(ctx, 0, -len, 0, 0, [[0, '#ffffff'], [1, '#4fc3f7']]);
          ctx.fill();
          ctx.strokeStyle = '#0277bd';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      },
    },
    jelly: {
      arm(ctx) {
        D.rrPath(ctx, 0, -6, 38, 12, 4);
        D.fs(ctx, '#5c6bc0', OL, 1.4);
        D.rrPath(ctx, 34, -4, 10, 8, 2);
        D.fs(ctx, '#3949ab', OL, 1.2);
        D.ellipsePath(ctx, 14, -12, 9, 8);
        ctx.fillStyle = D.rad(ctx, 12, -14, 1, 14, -12, 9, [[0, '#ffffff'], [0.3, '#ff8fb1'], [1, '#c2185b']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      },
      back(ctx) {
        D.ellipsePath(ctx, 0, -40, 32, 30);
        ctx.fillStyle = D.rad(ctx, -8, -50, 2, 0, -40, 32, [[0, '#ffe0ec'], [0.5, 'rgba(255,79,123,0.85)'], [1, '#b0123e']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        D.ellipsePath(ctx, -12, -54, 9, 4, -0.5);
        D.fs(ctx, 'rgba(255,255,255,0.6)');
        [-24, 24].forEach((x) => tentacle(ctx, [[x * 0.6, -14], [x * 1.4, -6], [x * 1.6, 8]], 5, '#ec407a'));
      },
    },
    sniper: {
      arm(ctx) {
        D.rrPath(ctx, 0, -5, 56, 10, 3);
        D.fs(ctx, '#263238', OL, 1.4);
        D.rrPath(ctx, 10, -14, 22, 7, 3);
        D.fs(ctx, '#455a64', OL, 1.2);
        D.circlePath(ctx, 31, -10.5, 3);
        D.fs(ctx, '#80deea', OL, 0.8);
        D.circlePath(ctx, 57, 0, 3.2);
        D.fs(ctx, '#ff1744', OL, 1);
      },
      back(ctx) {
        ctx.strokeStyle = OL;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -50);
        ctx.stroke();
        ctx.save();
        ctx.translate(0, -56);
        ctx.rotate(-0.4);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, -24, 0, 24, 0, [[0, '#ffffff'], [1, '#90a4ae']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, 16);
        ctx.stroke();
        D.circlePath(ctx, 0, 1, 3.4);
        D.fs(ctx, '#40c4ff', OL, 1);
        ctx.restore();
        [-1, 1].forEach((s) => {
          D.rrPath(ctx, s * 18 - (s < 0 ? 22 : 0), -30, 22, 12, 2);
          D.fs(ctx, '#1a237e', OL, 1.2);
        });
      },
    },
    tesla: {
      arm(ctx) {
        D.rrPath(ctx, 0, -5, 32, 10, 4);
        ctx.fillStyle = steel(ctx, 0, 32);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          D.ellipsePath(ctx, 6 + i * 6, 0, 2, 8);
          D.fs(ctx, '#d9822b', OL, 0.8);
        }
        P.energyBall(ctx, 38, 0, 6, '#b388ff');
      },
      back(ctx) {
        [-24, 24].forEach((x) => {
          D.rrPath(ctx, x - 3, -60, 6, 60, 2);
          D.fs(ctx, '#8d5524', OL, 1.2);
          for (let i = 0; i < 5; i++) {
            D.ellipsePath(ctx, x, -10 - i * 11, 8 - i * 0.6, 2.4);
            D.fs(ctx, '#d9822b', OL, 0.8);
          }
          P.energyBall(ctx, x, -64, 6, '#b388ff');
        });
        zig(ctx, [[-24, -64], [-12, -72], [-2, -60], [10, -72], [24, -64]], '#d1b3ff', 1.8);
      },
    },
    pilot: {
      arm(ctx) {
        D.rrPath(ctx, 0, -4, 42, 8, 3);
        D.fs(ctx, '#546e7a', OL, 1.4);
        ctx.save();
        ctx.translate(4, -26);
        ctx.scale(0.55, 0.55);
        TA.drawPlane(ctx, [2, 0, 0], true);
        ctx.restore();
      },
      back(ctx) {
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 6, -20);
          ctx.lineTo(s * 62, -54);
          ctx.lineTo(s * 58, -38);
          ctx.lineTo(s * 8, -6);
          ctx.closePath();
          ctx.fillStyle = D.lin(ctx, 0, -54, 0, -6, [[0, '#fff59d'], [1, '#ffb300']]);
          ctx.fill();
          ctx.strokeStyle = OL;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          D.rrPath(ctx, s * 34 - 7, -44, 14, 22, 5);
          D.fs(ctx, '#78909c', OL, 1.2);
          P.glowRing(ctx, s * 34, -16, 10, '#ff9100', 0.9);
        });
        D.starPath(ctx, 0, -26, 5, 9, 4);
        D.fs(ctx, '#e53935', OL, 1);
      },
    },
    rockstar: {
      arm(ctx) {
        P.guitar(ctx, 14, 0, -0.25, false);
      },
      back(ctx) {
        P.ampBox(ctx, -30, -70, 26, 64);
        P.ampBox(ctx, 4, -70, 26, 64);
        [[-20, -76, '#ff4081'], [20, -76, '#40c4ff']].forEach(([x, y, c]) => {
          P.glowRing(ctx, x, y, 10, c, 0.8);
          D.circlePath(ctx, x, y, 4);
          D.fs(ctx, c, OL, 1);
        });
      },
    },
    nails: {
      arm(ctx) {
        D.rrPath(ctx, 0, -7, 36, 14, 4);
        D.fs(ctx, '#ff6d00', OL, 1.4);
        D.rrPath(ctx, 8, 5, 10, 12, 3);
        D.fs(ctx, '#37474f', OL, 1.2);
        D.rrPath(ctx, 34, -3, 10, 6, 2);
        D.fs(ctx, '#b0bec5', OL, 1);
      },
      back(ctx) {
        ctx.beginPath();
        ctx.moveTo(-30, -48);
        ctx.lineTo(30, -48);
        ctx.lineTo(22, -4);
        ctx.lineTo(-22, -4);
        ctx.closePath();
        ctx.fillStyle = steel(ctx, -30, 30);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        for (let i = 0; i < 9; i++) P.nailIcon(ctx, -24 + i * 6, -48, 12 + (i % 2) * 4, (i - 4) * 0.12, '#cfd8dc');
        const rnd = D.rng(6);
        for (let i = 0; i < 3; i++) {
          D.blobPath(ctx, 34 + i * 3, -60 - i * 9, 5 + i, 7, 0.2, rnd);
          D.fs(ctx, 'rgba(200,200,200,0.85)', 'rgba(42,29,20,0.4)', 0.8);
        }
      },
    },
    sub: {
      arm(ctx) {
        [-11, 3].forEach((y) => {
          D.rrPath(ctx, 0, y, 38, 10, 5);
          D.fs(ctx, '#ffd83a', OL, 1.4);
          ctx.beginPath();
          ctx.moveTo(38, y + 1);
          ctx.quadraticCurveTo(46, y + 5, 38, y + 9);
          ctx.closePath();
          D.fs(ctx, '#78909c', OL, 1);
        });
      },
      back(ctx) {
        D.ellipsePath(ctx, 0, -26, 40, 18);
        ctx.fillStyle = D.lin(ctx, 0, -44, 0, -8, [[0, '#fff59d'], [1, '#c79100']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        [-16, 0, 16].forEach((x) => {
          D.circlePath(ctx, x, -26, 5);
          D.fs(ctx, '#4fc3f7', OL, 1);
        });
        ctx.strokeStyle = OL;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, -42);
        ctx.lineTo(8, -74);
        ctx.lineTo(18, -74);
        ctx.stroke();
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        D.ellipsePath(ctx, -42, -26, 3, 12);
        D.fs(ctx, 'rgba(200,200,200,0.85)', OL, 1);
      },
    },
    farm: {
      arm(ctx) {
        D.rrPath(ctx, 0, -4, 28, 8, 3);
        D.fs(ctx, '#8d6e63', OL, 1.4);
        [-1, 0, 1].forEach((k) => {
          ctx.strokeStyle = OL;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(28, 0);
          ctx.quadraticCurveTo(36, k * 10, 42, k * 6);
          ctx.stroke();
        });
        for (let i = 0; i < 3; i++) P.banana(ctx, 38, -4 + i * 4, 0.7, 0.4, '#ffc400');
      },
      back(ctx) {
        P.bananaTree(ctx, -18, -30, 1.4, true, 3);
        P.bananaTree(ctx, 20, -32, 1.4, false, 4);
        D.rrPath(ctx, -10, -16, 20, 14, 2);
        D.fs(ctx, '#c62828', OL, 1.2);
      },
    },
    lab: {
      arm(ctx) {
        D.rrPath(ctx, 0, -8, 38, 16, 6);
        ctx.fillStyle = steel(ctx, 0, 38);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        D.rrPath(ctx, 8, -8, 6, 16, 2);
        D.fs(ctx, '#5e35b1');
        P.energyBall(ctx, 42, 0, 6, '#e040fb');
      },
      back(ctx) {
        ctx.beginPath();
        ctx.arc(0, -10, 32, Math.PI, 0);
        ctx.closePath();
        ctx.fillStyle = D.rad(ctx, -10, -30, 2, 0, -10, 32, [[0, '#ffffff'], [0.5, '#b3e5fc'], [1, '#4f8fc0']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(0, -64);
        ctx.stroke();
        D.circlePath(ctx, 0, -66, 4);
        D.fs(ctx, '#ff1744', OL, 1);
        P.glowRing(ctx, 0, -66, 10, '#ff1744', 0.6);
        ctx.save();
        ctx.translate(26, -40);
        ctx.rotate(-0.6);
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI);
        ctx.closePath();
        D.fs(ctx, '#eceff1', OL, 1.2);
        ctx.restore();
      },
    },
    super: {
      arm(ctx) {
        D.rrPath(ctx, 0, -6, 18, 12, 4);
        D.fs(ctx, '#ffd83a', OL, 1.4);
        D.circlePath(ctx, 28, 0, 13);
        ctx.fillStyle = D.rad(ctx, 24, -4, 1, 28, 0, 13, [[0, '#ff8a80'], [1, '#b71c1c']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        D.starPath(ctx, 28, 0, 5, 6, 2.6);
        D.fs(ctx, '#ffd83a', OL, 0.8);
      },
      back(ctx) {
        ctx.beginPath();
        ctx.moveTo(-26, -2);
        ctx.quadraticCurveTo(-60, -40, -44, -76);
        ctx.lineTo(0, -60);
        ctx.lineTo(44, -76);
        ctx.quadraticCurveTo(60, -40, 26, -2);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, -50, 0, 50, 0, [[0, '#ef9a9a'], [0.5, '#e53935'], [1, '#7f0000']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        D.starPath(ctx, 0, -40, 5, 13, 6);
        D.fs(ctx, '#ffd83a', OL, 1.2);
      },
    },
  };

  // ================================================================ Omega Mech chassis
  const OW = 240, OH = 228, OX = 120, OY = 132;
  // the mech is drawn big and shown at 80% so it still fits on the map
  const OMEGA_SCALE = 0.8;
  // where each part fires from, relative to the tower position (back, left arm, right arm)
  const SLOTS = [{ ox: 0, oy: -104 }, { ox: -104, oy: -24 }, { ox: 104, oy: -24 }].map((s) => ({ ox: s.ox * OMEGA_SCALE, oy: s.oy * OMEGA_SCALE }));

  function drawOmegaMech(ctx, types) {
    const cols = types.map((t) => MT.TOWERS[t].fusion.color);
    cols.forEach((c, i) => P.glowRing(ctx, OX + (i === 0 ? 0 : i === 1 ? -60 : 60), OY - (i === 0 ? 60 : 24), 66, c, 0.25));
    D.shadow(ctx, OX, OY + 90, 76, 10, 0.42);
    // back module
    ctx.save();
    ctx.translate(OX, OY - 44);
    MODS[types[0]].back(ctx);
    ctx.restore();
    // legs
    [-1, 1].forEach((s) => {
      const x = OX + s * 24;
      D.rrPath(ctx, x - 12, OY + 26, 24, 36, 6);
      ctx.fillStyle = steel(ctx, x - 12, x + 12);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      D.circlePath(ctx, x, OY + 62, 9);
      D.fs(ctx, D.shade(cols[0], -0.2), OL, 1.6);
      D.rrPath(ctx, x - 11 + s * 2, OY + 62, 22, 22, 5);
      ctx.fillStyle = steel(ctx, x - 11, x + 11);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.stroke();
      D.rrPath(ctx, x - 20 + s * 4, OY + 80, 40, 13, 6);
      D.fs(ctx, '#37474f', OL, 1.6);
    });
    // arms with their weapon modules
    [-1, 1].forEach((s) => {
      const sx = OX + s * 46, sy = OY - 30;
      const ex = OX + s * 62, ey = OY;
      const hx = OX + s * 66, hy = OY - 24;
      D.limb(ctx, sx, sy, ex, ey, 16, '#90a4ae', { lw: 1.8, glove: false });
      D.limb(ctx, ex, ey, hx, hy, 13, '#b0bec5', { lw: 1.8, glove: false });
      D.circlePath(ctx, ex, ey, 7);
      D.fs(ctx, '#546e7a', OL, 1.4);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(s, 1);
      MODS[types[s < 0 ? 1 : 2]].arm(ctx);
      ctx.restore();
      D.circlePath(ctx, hx, hy, 8);
      D.fs(ctx, '#37474f', OL, 1.4);
    });
    // torso
    D.rrPath(ctx, OX - 46, OY - 52, 92, 88, 22);
    ctx.fillStyle = D.lin(ctx, OX - 46, 0, OX + 46, 0, [[0, '#ffffff'], [0.45, '#ffe082'], [1, '#b37400']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.save();
    D.rrPath(ctx, OX - 46, OY - 52, 92, 88, 22);
    ctx.clip();
    cols.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(OX - 46, OY + 10 + i * 7, 92, 4);
    });
    ctx.restore();
    // chest core with the omega sign
    P.glowRing(ctx, OX, OY - 14, 26, '#ffffff', 0.8);
    D.circlePath(ctx, OX, OY - 14, 15);
    ctx.fillStyle = D.rad(ctx, OX - 4, OY - 18, 1, OX, OY - 14, 15, [[0, '#ffffff'], [0.6, '#b388ff'], [1, '#4527a0']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Ω', OX, OY - 13);
    // shoulder pads in the arm parts' colours
    [-1, 1].forEach((s) => {
      D.circlePath(ctx, OX + s * 46, OY - 34, 15);
      ctx.fillStyle = D.rad(ctx, OX + s * 46 - 4, OY - 38, 1, OX + s * 46, OY - 34, 15, [[0, '#ffffff'], [0.5, cols[s < 0 ? 1 : 2]], [1, D.shade(cols[s < 0 ? 1 : 2], -0.5)]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    });
    // glass head with the pilot minion
    ctx.save();
    ctx.beginPath();
    ctx.arc(OX, OY - 50, 26, Math.PI, 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(178,235,242,0.4)';
    ctx.fillRect(OX - 26, OY - 76, 52, 26);
    miniMinion(ctx, OX, OY - 58, 22, 28, { hair: 'sprout', mouth: 'grin', legs: false, arms: [] });
    ctx.restore();
    ctx.beginPath();
    ctx.arc(OX, OY - 50, 26, Math.PI, 0);
    ctx.closePath();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(OX, OY - 50, 20, Math.PI * 1.15, Math.PI * 1.45);
    ctx.stroke();
    D.rrPath(ctx, OX - 30, OY - 54, 60, 7, 3);
    D.fs(ctx, cols[0], OL, 1.4);
  }

  // ================================================================ effect sprites
  function generate(scene) {
    const mk = (key, w, h, fn) => D.make(scene, key, w, h, fn);
    mk('fx_vortex', 128, 128, (ctx) => {
      D.circlePath(ctx, 64, 64, 62);
      ctx.fillStyle = D.rad(ctx, 64, 64, 4, 64, 64, 62, [[0, '#000000'], [0.3, '#1a0633'], [0.6, 'rgba(120,60,0,0.85)'], [0.85, 'rgba(255,193,7,0.5)'], [1, 'rgba(255,215,64,0)']]);
      ctx.fill();
      ctx.save();
      ctx.translate(64, 64);
      for (let k = 0; k < 6; k++) {
        ctx.rotate(TAU / 6);
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const tt = i / 26, a = tt * 3, r = 8 + tt * 52;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255,224,130,0.85)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
      D.circlePath(ctx, 64, 64, 10);
      D.fs(ctx, '#000000', '#ffd740', 2);
    });
    mk('fx_tornado', 70, 104, (ctx) => {
      for (let i = 0; i < 8; i++) {
        const tt = i / 7;
        const y = 98 - tt * 86;
        D.ellipsePath(ctx, 35 + Math.sin(tt * 5) * 4, y, 6 + tt * tt * 26, 3 + tt * 5);
        ctx.fillStyle = i % 2 ? 'rgba(155,225,93,0.9)' : 'rgba(118,190,52,0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(40,90,10,0.8)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    });
    mk('fx_icicle', 20, 64, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(2, 4);
      ctx.lineTo(18, 4);
      ctx.lineTo(10, 63);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 2, 0, 18, 0, [[0, '#ffffff'], [0.5, '#b3e5fc'], [1, '#0288d1']]);
      ctx.fill();
      ctx.strokeStyle = '#01579b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(7, 8);
      ctx.lineTo(10, 46);
      ctx.stroke();
    });
    mk('fx_puddle', 96, 96, (ctx) => {
      D.blobPath(ctx, 48, 48, 44, 11, 0.12, D.rng(3));
      ctx.fillStyle = D.rad(ctx, 40, 40, 4, 48, 48, 46, [[0, 'rgba(255,255,255,0.95)'], [0.6, 'rgba(235,235,235,0.85)'], [1, 'rgba(180,180,180,0.85)']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,80,80,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      const rnd = D.rng(5);
      for (let i = 0; i < 6; i++) {
        D.circlePath(ctx, 24 + rnd() * 48, 24 + rnd() * 48, 3 + rnd() * 4);
        D.fs(ctx, 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.9)', 1);
      }
    });
    mk('fx_moon_banana', 34, 30, (ctx) => {
      P.glowRing(ctx, 17, 15, 16, '#fff59d', 0.6);
      P.banana(ctx, 17, 16, 1.4, -0.3, '#ffd740');
      D.circlePath(ctx, 14, 15, 1.6);
      D.fs(ctx, '#3a2414');
      D.circlePath(ctx, 19, 14, 1.6);
      D.fs(ctx, '#3a2414');
    });
    mk('fx_clone', 30, 38, (ctx) => {
      M.draw(ctx, {
        x: 15, y: 19, w: 15, h: 21, eyes: 1, hair: 'bald', mouth: 'grin', seed: 171, lw: 1, lookX: -0.8,
        denim: { base: '#607d8b', light: '#90a4ae', dark: '#37474f', stitch: '#ffd83a' },
        arms: [{ x0: 8.5, y0: 19, x1: 4, y1: 23 }, { x0: 21.5, y0: 19, x1: 26, y1: 15 }],
      });
      P.helmet(ctx, 15, 4, 15, '#78909c');
      D.rrPath(ctx, 24, 12, 6, 4, 1);
      D.fs(ctx, '#e040fb', OL, 0.6);
    });
  }

  TA.ULT_OY = CY / UH;
  TA.OMEGA_OY = OY / OH;
  TA.OMEGA_SLOTS = SLOTS;
  TA.OMEGA_SCALE = OMEGA_SCALE;
  TA.ultimateKey = function (scene, type) {
    const key = `tw_ult2_${type}`;
    if (!scene.textures.exists(key)) D.make(scene, key, UW, UH, (ctx) => ULT[type](ctx));
    return key;
  };
  TA.omegaKey = function (scene, types) {
    const key = `tw_omech_${types.join('_')}`;
    if (!scene.textures.exists(key)) D.make(scene, key, OW, OH, (ctx) => drawOmegaMech(ctx, types));
    return key;
  };
  MT.GiantArt = { generate, ULT, MODS, drawOmegaMech };
})();
