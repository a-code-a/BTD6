// Artwork for the newer towers (Tesla, Pilot, Rock Star), the pilot's planes
// and the Super Fusion versions of every tower.
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;
  const TA = MT.TowerArt;
  const P = TA.painters;
  const { glowRing, banana } = TA.props;
  const B = { cx: 42, cy: 49, w: 30, h: 42 };
  const FOOT = 76;

  function baseMinion(ctx, o) {
    D.shadow(ctx, B.cx, FOOT, 17, 5.5);
    M.draw(ctx, Object.assign({ x: B.cx, y: B.cy, w: B.w, h: B.h }, o));
  }

  function bolt(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(1, -6);
    ctx.lineTo(-3, 1);
    ctx.lineTo(0, 1);
    ctx.lineTo(-1.5, 6);
    ctx.lineTo(3.5, -1.5);
    ctx.lineTo(0.5, -1.5);
    ctx.closePath();
    D.fs(ctx, col || '#ffeb3b', OL, 0.8);
    ctx.restore();
  }

  function energyBall(ctx, x, y, r, col) {
    glowRing(ctx, x, y, r * 2.6, col, 0.6);
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.3, y - r * 0.3, 0, x, y, r, [[0, '#ffffff'], [0.45, col], [1, D.shade(col, -0.4)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    // little sparks
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + 0.4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2);
      ctx.lineTo(x + Math.cos(a + 0.3) * r * 1.8, y + Math.sin(a + 0.3) * r * 1.8);
      ctx.lineTo(x + Math.cos(a - 0.1) * r * 2.3, y + Math.sin(a - 0.1) * r * 2.3);
      ctx.stroke();
    }
  }

  // copper tesla coil standing on a little helmet
  function headCoil(ctx, x, baseY, topY, rings, ballR, ballCol) {
    ctx.beginPath();
    ctx.arc(x, baseY + 3, 10, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - 10, 0, x + 10, 0, [[0, '#cfd8dc'], [0.5, '#90a4ae'], [1, '#455a64']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    D.rrPath(ctx, x - 2.4, topY + 3, 4.8, baseY - topY - 2, 2);
    D.fs(ctx, '#8d5524', OL, 1);
    for (let i = 0; i < rings; i++) {
      const y = baseY - 3 - (i * (baseY - 6 - (topY + 5))) / Math.max(1, rings - 1);
      D.ellipsePath(ctx, x, y, 6.6 - i * 0.55, 1.9);
      ctx.fillStyle = D.lin(ctx, x - 7, 0, x + 7, 0, [[0, '#ffcc80'], [0.5, '#d9822b'], [1, '#8d4a12']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    energyBall(ctx, x, topY + 1, ballR, ballCol);
  }

  // ---------------------------------------------------------------- Tesla
  P.tesla = function (ctx, t) {
    const [a, b, c] = t;
    if (a >= 4) glowRing(ctx, B.cx, B.cy - 8, 44, '#b388ff', 0.55);
    else if (b >= 4) glowRing(ctx, B.cx, B.cy - 6, 42, '#18ffff', 0.45);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy - 6, 42, '#ffd740', 0.45);
    const ballCol = c >= 3 ? '#ea80fc' : a >= 4 ? '#d1c4ff' : '#80d8ff';
    if (b >= 1) {
      // battery backpack
      D.rrPath(ctx, B.cx - 26, B.cy - 9, 12, 26, 3);
      ctx.fillStyle = D.lin(ctx, B.cx - 26, 0, B.cx - 14, 0, [[0, '#ffe082'], [1, '#e65100']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      bolt(ctx, B.cx - 20, B.cy + 3, 0.9, '#fffde7');
    }
    if (c >= 1) {
      // coiled cable from backpack to wand
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(B.cx - 20, B.cy + 16);
      ctx.bezierCurveTo(B.cx - 18, B.cy + 30, B.cx + 6, B.cy + 30, B.cx + 4, B.cy + 12);
      ctx.stroke();
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    const o = {
      eyes: 2, hair: 'spiky', mouth: 'grin', seed: 91, lookX: 0.7,
      rim: c >= 2 ? '#69f0ae' : b >= 4 ? '#ff5252' : null,
      arms: [],
    };
    const arms = [
      { x0: B.cx - 13, y0: B.cy + 2, x1: B.cx - 1, y1: B.cy + 9, bend: [B.cx - 14, B.cy + 13] },
      { x0: B.cx + 13, y0: B.cy + 2, x1: B.cx + 17, y1: B.cy - 1, bend: [B.cx + 21, B.cy + 6] },
    ];
    o.after = (c2) => {
      // zapper wand
      c2.save();
      c2.translate(B.cx + 2, B.cy + 7);
      c2.rotate(-0.42);
      D.rrPath(c2, -4, -2.6, 30, 5.2, 2.4);
      c2.fillStyle = D.lin(c2, 0, -3, 0, 3, [[0, '#eceff1'], [1, '#607d8b']]);
      c2.fill();
      c2.strokeStyle = OL;
      c2.lineWidth = 1.1;
      c2.stroke();
      for (let i = 0; i < 3; i++) {
        c2.fillStyle = '#d9822b';
        c2.fillRect(8 + i * 5, -2.6, 2.2, 5.2);
      }
      energyBall(c2, 28, 0, b >= 2 ? 3.6 : 3, ballCol);
      c2.restore();
      arms.forEach((ar) => D.limb(c2, ar.x0, ar.y0, ar.x1, ar.y1, B.w * 0.14, '#ffd83a', { bend: ar.bend, lw: 1.5 }));
    };
    baseMinion(ctx, o);
    const rings = 3 + Math.min(2, a) + (c >= 4 ? 2 : 0);
    headCoil(ctx, B.cx, B.cy - 21, c >= 4 ? 8 : 12, rings, 3.4 + (a >= 2 ? 0.8 : 0) + (c >= 4 ? 1.4 : 0), ballCol);
    if (a >= 3) {
      // shoulder coils
      [-1, 1].forEach((s) => {
        const x = B.cx + s * 17, y = B.cy - 8;
        D.rrPath(ctx, x - 1.6, y - 10, 3.2, 10, 1.4);
        D.fs(ctx, '#8d5524', OL, 0.9);
        energyBall(ctx, x, y - 11, 2.4, ballCol);
      });
    }
    if (b >= 3) {
      bolt(ctx, B.cx + 22, B.cy - 22, 1.1, '#ffeb3b');
      bolt(ctx, B.cx - 23, B.cy - 18, 0.9, '#ffeb3b');
    }
    if (a >= 4) {
      // storm cloud crown
      const rnd = D.rng(12);
      for (let i = 0; i < 4; i++) {
        D.blobPath(ctx, B.cx - 12 + i * 8, 7 + (i % 2) * 2, 5.5, 7, 0.25, rnd);
        D.fs(ctx, '#5e6b8c', OL, 0.9);
      }
      bolt(ctx, B.cx - 6, 16, 0.8, '#fff176');
      bolt(ctx, B.cx + 9, 15, 0.8, '#fff176');
    }
  };

  // ---------------------------------------------------------------- Pilot (ground crew)
  P.pilot = function (ctx, t) {
    const [a, b, c] = t;
    D.shadow(ctx, 42, 72, 40, 11, 0.25);
    // landing pad
    D.ellipsePath(ctx, 42, 68, 37, 12.5);
    ctx.fillStyle = D.lin(ctx, 0, 56, 0, 80, [[0, '#90a4ae'], [1, '#455a64']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.save();
    ctx.setLineDash([4, 3]);
    D.ellipsePath(ctx, 42, 67, 29, 9);
    ctx.strokeStyle = '#ffd83a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2;
      D.circlePath(ctx, 42 + Math.cos(an) * 33, 68 + Math.sin(an) * 10.5, 1.4);
      D.fs(ctx, i % 2 ? '#ff5252' : '#69f0ae', OL, 0.6);
    }
    // windsock
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(10, 72);
    ctx.lineTo(10, 30);
    ctx.stroke();
    ctx.strokeStyle = '#cfd8dc';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.save();
    ctx.translate(10, 32);
    ctx.rotate(0.12);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6, -4 + i * 0.6);
      ctx.lineTo(i * 6 + 6, -3.4 + i * 0.6);
      ctx.lineTo(i * 6 + 6, 3.4 - i * 0.6);
      ctx.lineTo(i * 6, 4 - i * 0.6);
      ctx.closePath();
      D.fs(ctx, i % 2 ? '#ffffff' : '#ff6d00', OL, 0.8);
    }
    ctx.restore();
    if (c >= 1) {
      // radar dish
      ctx.save();
      ctx.translate(74, 40);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 22);
      ctx.stroke();
      ctx.rotate(-0.6);
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI);
      ctx.closePath();
      D.fs(ctx, '#eceff1', OL, 1.1);
      ctx.restore();
    }
    if (a >= 3 || c >= 4) {
      // crate of rockets / bombs
      D.rrPath(ctx, 60, 60, 18, 12, 2);
      D.fs(ctx, '#8d6e63', OL, 1.1);
      for (let i = 0; i < 3; i++) {
        D.ellipsePath(ctx, 64 + i * 5, 58, 2.2, 4);
        D.fs(ctx, c >= 4 ? '#37474f' : '#e53935', OL, 0.8);
      }
    }
    if (b >= 2) {
      // fuel barrel
      D.rrPath(ctx, 18, 56, 10, 14, 3);
      D.fs(ctx, '#2e7d32', OL, 1);
      ctx.fillStyle = '#c8e6c9';
      ctx.fillRect(18, 61, 10, 2);
    }
    // marshaller minion with ear defenders and batons
    const mx = 44, my = 50;
    M.draw(ctx, {
      x: mx, y: my, w: 22, h: 30, eyes: 2, hair: 'bald', mouth: 'happy', seed: 101, lookX: 0.3, lw: 1.1,
      arms: [{ x0: mx - 9, y0: my + 1, x1: mx - 16, y1: my - 12, bend: [mx - 17, my - 1] }, { x0: mx + 9, y0: my + 1, x1: mx + 16, y1: my - 12, bend: [mx + 17, my - 1] }],
      outfit: (c2, cx, cy, w, h) => {
        c2.fillStyle = '#ff9100';
        c2.fillRect(cx - w, cy + h * 0.05, w * 2, h * 0.16);
        c2.fillStyle = 'rgba(255,255,255,0.8)';
        c2.fillRect(cx - w, cy + h * 0.1, w * 2, h * 0.04);
      },
    });
    [-1, 1].forEach((s) => {
      // batons
      ctx.save();
      ctx.translate(mx + s * 16, my - 13);
      ctx.rotate(s * 0.35);
      D.rrPath(ctx, -1.8, -11, 3.6, 12, 1.6);
      ctx.fillStyle = D.lin(ctx, 0, -11, 0, 1, [[0, '#ffe0b2'], [1, '#ff6d00']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();
      // ear defenders
      D.ellipsePath(ctx, mx + s * 11.5, my - 6, 2.8, 4.2);
      D.fs(ctx, '#d32f2f', OL, 1);
    });
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(mx, my - 8, 11.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  };

  // ---------------------------------------------------------------- planes
  function drawPlane(ctx, t, fused) {
    const [a, b, c] = t;
    if (fused) {
      // golden jet fighter
      const body = '#ffc400';
      glowRing(ctx, 14, 22, 12, '#ff6d00', 0.8);
      ctx.beginPath();
      ctx.moveTo(4, 22);
      ctx.lineTo(10, 18);
      ctx.lineTo(10, 26);
      ctx.closePath();
      D.fs(ctx, '#fff59d');
      ctx.beginPath();
      ctx.moveTo(12, 19);
      ctx.lineTo(8, 6);
      ctx.lineTo(18, 9);
      ctx.lineTo(24, 19);
      ctx.closePath();
      D.fs(ctx, D.shade(body, -0.25), OL, 1.1);
      ctx.beginPath();
      ctx.moveTo(10, 18);
      ctx.quadraticCurveTo(36, 13, 58, 22);
      ctx.quadraticCurveTo(36, 30, 10, 27);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 14, 0, 30, [[0, '#fff8e1'], [0.45, body], [1, '#b37400']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(22, 25);
      ctx.lineTo(38, 25);
      ctx.lineTo(24, 35);
      ctx.lineTo(16, 35);
      ctx.closePath();
      D.fs(ctx, D.shade(body, -0.3), OL, 1.1);
      ctx.beginPath();
      ctx.moveTo(34, 17);
      ctx.quadraticCurveTo(40, 11, 47, 18);
      ctx.closePath();
      D.fs(ctx, 'rgba(128,216,255,0.9)', OL, 1);
      D.circlePath(ctx, 39, 16, 2.6);
      D.fs(ctx, '#ffd83a', OL, 0.7);
      D.starPath(ctx, 26, 21, 5, 3.2, 1.4);
      D.fs(ctx, '#e53935', OL, 0.6);
      D.rrPath(ctx, 26, 29, 14, 3, 1.4);
      D.fs(ctx, '#37474f', OL, 0.7);
      return;
    }
    const body = a >= 4 ? '#78909c' : b >= 4 ? '#1e88e5' : '#e53935';
    // tail fin
    ctx.beginPath();
    ctx.moveTo(9, 20);
    ctx.lineTo(5, 7);
    ctx.lineTo(15, 9);
    ctx.lineTo(19, 20);
    ctx.closePath();
    D.fs(ctx, D.shade(body, -0.2), OL, 1.1);
    // fuselage
    D.rrPath(ctx, 6, 16, 44, 13, 6.5);
    ctx.fillStyle = D.lin(ctx, 0, 16, 0, 29, [[0, D.shade(body, 0.4)], [0.5, body], [1, D.shade(body, -0.35)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    if (c >= 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(14, 21, 22, 2);
    }
    if (b >= 4) {
      D.starPath(ctx, 16, 22.5, 5, 3.4, 1.5);
      D.fs(ctx, '#ffffff', OL, 0.6);
    }
    // wing
    D.ellipsePath(ctx, 30, 26, 14, 3.6);
    D.fs(ctx, D.shade(body, -0.3), OL, 1.1);
    if (a >= 1) {
      for (const dx of a >= 4 ? [22, 27, 33, 38] : [26, 34]) {
        D.rrPath(ctx, dx, 28.5, 7, 2, 1);
        D.fs(ctx, '#263238', OL, 0.6);
      }
    }
    if (a >= 3) {
      D.rrPath(ctx, 24, 31, 13, 4, 2);
      D.fs(ctx, '#eceff1', OL, 0.8);
      ctx.beginPath();
      ctx.moveTo(37, 31);
      ctx.lineTo(40, 33);
      ctx.lineTo(37, 35);
      ctx.closePath();
      D.fs(ctx, '#e53935', OL, 0.6);
    }
    // pilot head
    ctx.beginPath();
    ctx.arc(30, 17, 6.2, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 24, 0, 36, 0, [[0, '#fff07c'], [1, '#dc9f00']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(24, 12.5, 12, 2);
    D.circlePath(ctx, 32.5, 13.5, 2.5);
    D.fs(ctx, '#cfd5dc', OL, 0.7);
    D.circlePath(ctx, 33, 13.6, 1.1);
    D.fs(ctx, '#3a2414');
    // scarf
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(25, 16);
    ctx.quadraticCurveTo(18, 13, 14, 15);
    ctx.stroke();
    // nose + propeller
    D.ellipsePath(ctx, 50, 22.5, 3.6, 6);
    D.fs(ctx, '#ffd83a', OL, 1);
    D.ellipsePath(ctx, 54, 22.5, 1.8, 13);
    D.fs(ctx, 'rgba(230,230,230,0.7)', 'rgba(42,29,20,0.6)', 0.8);
  }

  // ---------------------------------------------------------------- Rock Star
  function ampBox(ctx, x, y, w, h) {
    D.rrPath(ctx, x, y, w, h, 2.5);
    ctx.fillStyle = D.lin(ctx, x, 0, x + w, 0, [[0, '#424242'], [1, '#151515']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const n = h > 26 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const cy = y + (h / n) * (i + 0.5);
      D.circlePath(ctx, x + w / 2, cy, Math.min(w, h / n) * 0.36);
      ctx.fillStyle = D.rad(ctx, x + w / 2, cy, 0, x + w / 2, cy, w * 0.4, [[0, '#9e9e9e'], [0.4, '#2b2b2b'], [1, '#111']]);
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd83a';
    ctx.fillRect(x + 2, y + 2, w - 4, 1.4);
  }

  function guitar(ctx, x, y, rot, flame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    // neck
    D.rrPath(ctx, 6, -2, 30, 4, 1.5);
    D.fs(ctx, '#6d4c41', OL, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(10 + i * 6, -2);
      ctx.lineTo(10 + i * 6, 2);
      ctx.stroke();
    }
    // headstock
    D.rrPath(ctx, 35, -3.2, 7, 6.4, 2);
    D.fs(ctx, '#3e2723', OL, 1);
    // banana body
    ctx.beginPath();
    ctx.moveTo(-14, -5);
    ctx.quadraticCurveTo(-4, -12, 9, -6);
    ctx.quadraticCurveTo(13, 0, 9, 6);
    ctx.quadraticCurveTo(-4, 13, -14, 6);
    ctx.quadraticCurveTo(-18, 0, -14, -5);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -10, 0, 10, [[0, '#fff59d'], [0.5, flame ? '#ff7043' : '#ffd83a'], [1, flame ? '#bf360c' : '#e0a500']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    D.circlePath(ctx, -3, 0, 3);
    D.fs(ctx, '#3e2723', OL, 0.8);
    D.rrPath(ctx, -12, -3, 3, 6, 1);
    D.fs(ctx, '#212121');
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 0.45;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-10, i * 1.1);
      ctx.lineTo(37, i * 1.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  P.rockstar = function (ctx, t) {
    const [a, b, c] = t;
    if (a >= 4) glowRing(ctx, B.cx, B.cy, 44, '#ff1744', 0.45);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy, 44, '#e040fb', 0.45);
    else if (b >= 4) glowRing(ctx, B.cx, B.cy, 42, '#40c4ff', 0.4);
    if (a >= 3) {
      ampBox(ctx, 4, 30, 18, 42);
      ampBox(ctx, 62, 40, 18, 32);
    } else if (a >= 1) ampBox(ctx, 6, 50, 16, 22);
    if (b >= 3) {
      // the drummer
      D.ellipsePath(ctx, 70, 66, 9, 3.4);
      D.fs(ctx, '#e53935', OL, 1);
      D.rrPath(ctx, 61, 58, 18, 8, 2);
      D.fs(ctx, '#eceff1', OL, 1);
      M.draw(ctx, { x: 70, y: 46, w: 14, h: 18, eyes: 1, hair: 'sprout', mouth: 'happy', seed: 121, lw: 0.9, legs: false,
        arms: [{ x0: 64, y0: 47, x1: 62, y1: 55 }, { x0: 76, y0: 47, x1: 78, y1: 55 }] });
    }
    if (c >= 3) {
      // disco ball
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(68, 0);
      ctx.lineTo(68, 9);
      ctx.stroke();
      glowRing(ctx, 68, 15, 14, '#e1bee7', 0.6);
      D.circlePath(ctx, 68, 15, 6);
      ctx.fillStyle = D.rad(ctx, 66, 13, 0, 68, 15, 6, [[0, '#ffffff'], [1, '#90a4ae']]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(60,60,80,0.5)';
      ctx.lineWidth = 0.5;
      for (let i = -6; i <= 6; i += 2) {
        ctx.beginPath();
        ctx.moveTo(62, 15 + i);
        ctx.lineTo(74, 15 + i);
        ctx.moveTo(68 + i, 9);
        ctx.lineTo(68 + i, 21);
        ctx.stroke();
      }
      ctx.restore();
      D.circlePath(ctx, 68, 15, 6);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    if (c >= 4) {
      // groovy afro
      const rnd = D.rng(33);
      for (let i = 0; i < 9; i++) {
        const an = Math.PI * (1.05 + (i / 8) * 0.9);
        D.circlePath(ctx, B.cx + Math.cos(an) * 15, B.cy - 16 + Math.sin(an) * 13, 7 + rnd() * 2);
        D.fs(ctx, '#3e2723', OL, 1);
      }
    }
    const o = {
      eyes: 2, hair: c >= 4 ? 'bald' : 'spiky', mouth: a >= 3 ? 'o' : 'grin', seed: 111, lookX: 0.6,
      rim: c >= 2 ? '#ff4081' : null,
      arms: [],
      outfit: (c2, cx, cy, w, h) => {
        // leather vest over the overalls
        c2.fillStyle = '#212121';
        c2.beginPath();
        c2.moveTo(cx - w, cy - h * 0.05);
        c2.lineTo(cx - w * 0.18, cy + h * 0.07);
        c2.lineTo(cx - w * 0.3, cy + h * 0.32);
        c2.lineTo(cx - w, cy + h * 0.32);
        c2.closePath();
        c2.fill();
        c2.beginPath();
        c2.moveTo(cx + w, cy - h * 0.05);
        c2.lineTo(cx + w * 0.18, cy + h * 0.07);
        c2.lineTo(cx + w * 0.3, cy + h * 0.32);
        c2.lineTo(cx + w, cy + h * 0.32);
        c2.closePath();
        c2.fill();
        c2.fillStyle = '#e0e0e0';
        for (let i = 0; i < 3; i++) {
          D.circlePath(c2, cx - w * 0.36, cy + h * (0.06 + i * 0.08), 0.7);
          c2.fill();
          D.circlePath(c2, cx + w * 0.36, cy + h * (0.06 + i * 0.08), 0.7);
          c2.fill();
        }
      },
    };
    o.after = (c2) => {
      guitar(c2, B.cx - 2, B.cy + 10, -0.42, a >= 4);
      D.limb(c2, B.cx - 13, B.cy + 2, B.cx - 3, B.cy + 9, B.w * 0.14, '#ffd83a', { bend: [B.cx - 12, B.cy + 14], lw: 1.5 });
      D.limb(c2, B.cx + 13, B.cy + 2, B.cx + 22, B.cy - 3, B.w * 0.14, '#ffd83a', { bend: [B.cx + 19, B.cy + 6], lw: 1.5 });
    };
    baseMinion(ctx, o);
    if (c >= 1) {
      // headband
      ctx.save();
      D.capsulePath(ctx, B.cx, B.cy, B.w, B.h);
      ctx.clip();
      ctx.fillStyle = c >= 2 ? '#ff4081' : '#e53935';
      ctx.fillRect(B.cx - 20, B.cy - 19, 40, 3.6);
      ctx.restore();
    }
    if (b >= 1) {
      // music notes
      ctx.fillStyle = OL;
      [[B.cx + 24, B.cy - 26], [B.cx + 31, B.cy - 18]].forEach(([x, y], i) => {
        D.ellipsePath(ctx, x, y, 2.4, 1.8, -0.4);
        D.fs(ctx, i ? '#40c4ff' : '#ff4081', OL, 0.8);
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, y);
        ctx.lineTo(x + 2, y - 8);
        ctx.lineTo(x + 5, y - 6);
        ctx.stroke();
      });
    }
  };

  // ---------------------------------------------------------------- Nail Minion
  function nailIcon(ctx, x, y, len, rot, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    D.ellipsePath(ctx, 0, -len, 2.4, 1);
    D.fs(ctx, col, OL, 0.7);
    ctx.restore();
  }

  // (the Nail Minion tower itself is painted in nails.js)

  // ---------------------------------------------------------------- Submarine
  P.sub = function (ctx, t) {
    const [a, b, c] = t;
    const hy = 54;
    if (a >= 4) glowRing(ctx, 42, hy - 6, 44, '#76ff03', 0.4);
    else if (c >= 4) glowRing(ctx, 42, hy - 6, 44, '#b388ff', 0.45);
    else if (b >= 4) glowRing(ctx, 42, hy - 6, 42, '#40c4ff', 0.4);
    // ripples
    D.ellipsePath(ctx, 42, hy + 10, 40, 11);
    D.fs(ctx, 'rgba(64,170,220,0.45)', 'rgba(255,255,255,0.65)', 1.2);
    const yel = '#ffd83a';
    // conning tower
    D.rrPath(ctx, 32, hy - 26, 20, 18, 4);
    ctx.fillStyle = D.lin(ctx, 32, 0, 52, 0, [[0, '#fff07c'], [0.5, yel], [1, '#c79100']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // periscope
    const top = c >= 1 ? hy - 44 : hy - 36;
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(40, hy - 26);
    ctx.lineTo(40, top);
    ctx.lineTo(47, top);
    ctx.stroke();
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 2;
    ctx.stroke();
    D.rrPath(ctx, 46, top - 2.6, 4, 5.2, 1);
    D.fs(ctx, '#80deea', OL, 0.8);
    if (b >= 4) {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(35, hy - 26);
      ctx.lineTo(35, hy - 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(35, hy - 40);
      ctx.lineTo(28, hy - 37);
      ctx.lineTo(35, hy - 34);
      ctx.closePath();
      D.fs(ctx, '#e53935', OL, 0.8);
    }
    if (a >= 4) {
      // radiation sign
      D.circlePath(ctx, 42, hy - 17, 4.5);
      D.fs(ctx, '#ffeb3b', OL, 0.8);
      ctx.fillStyle = OL;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(42, hy - 17);
        ctx.arc(42, hy - 17, 4, (i * 2 * Math.PI) / 3 - 0.5, (i * 2 * Math.PI) / 3 + 0.5);
        ctx.closePath();
        ctx.fill();
      }
    }
    // hull
    D.ellipsePath(ctx, 42, hy, 32, 13);
    ctx.fillStyle = D.lin(ctx, 0, hy - 13, 0, hy + 13, [[0, '#fff59d'], [0.45, yel], [1, '#b37400']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // propeller
    D.ellipsePath(ctx, 8, hy, 3, 10);
    D.fs(ctx, 'rgba(200,200,200,0.85)', OL, 1);
    D.circlePath(ctx, 10, hy, 2.2);
    D.fs(ctx, '#78909c', OL, 0.8);
    // portholes with a minion peeking out
    [26, 42, 58].forEach((x, i) => {
      D.circlePath(ctx, x, hy - 2, 4.6);
      D.fs(ctx, '#b0bec5', OL, 1.1);
      D.circlePath(ctx, x, hy - 2, 3.3);
      if (i === 1) {
        D.fs(ctx, '#ffd83a');
        D.circlePath(ctx, x + 0.5, hy - 2.5, 1.7);
        D.fs(ctx, '#ffffff', OL, 0.5);
        D.circlePath(ctx, x + 1, hy - 2.5, 0.7);
        D.fs(ctx, '#3a2414');
      } else D.fs(ctx, '#4fc3f7');
    });
    // torpedo tubes
    if (a >= 1) {
      D.circlePath(ctx, 71, hy - 3, 2);
      D.fs(ctx, '#263238', OL, 0.7);
      D.circlePath(ctx, 71, hy + 4, 2);
      D.fs(ctx, '#263238', OL, 0.7);
    }
    if (a >= 3) {
      // missile hatch on deck
      D.rrPath(ctx, 54, hy - 18, 10, 7, 2);
      D.fs(ctx, '#546e7a', OL, 1);
      ctx.beginPath();
      ctx.moveTo(55.5, hy - 18);
      ctx.lineTo(59, hy - 25);
      ctx.lineTo(62.5, hy - 18);
      ctx.closePath();
      D.fs(ctx, '#e53935', OL, 0.8);
    }
    if (b >= 3) {
      [20, 30].forEach((x) => {
        D.rrPath(ctx, x - 5, hy - 14, 10, 4, 2);
        D.fs(ctx, '#78909c', OL, 0.8);
      });
    }
    if (c >= 2) {
      // sonar dome on the nose
      ctx.beginPath();
      ctx.arc(64, hy - 10, 5, Math.PI, 0);
      ctx.closePath();
      D.fs(ctx, '#4dd0e1', OL, 1);
      ctx.strokeStyle = 'rgba(128,222,234,0.8)';
      ctx.lineWidth = 1.2;
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(64, hy - 10, 5 + i * 4, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    }
    if (c >= 3) {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(70 - i, hy - 6 + i * 4);
        ctx.lineTo(77 - i, hy - 4 + i * 4);
        ctx.lineTo(70 - i, hy - 2 + i * 4);
        ctx.closePath();
        D.fs(ctx, '#ffffff', OL, 0.6);
      }
    }
    if (c >= 4) {
      // a friendly kraken tentacle hugging the hull
      ctx.beginPath();
      ctx.moveTo(14, hy + 12);
      ctx.bezierCurveTo(10, hy - 14, 34, hy - 18, 36, hy - 4);
      ctx.bezierCurveTo(36, hy + 4, 28, hy + 2, 28, hy - 4);
      ctx.bezierCurveTo(28, hy - 10, 18, hy - 8, 20, hy + 12);
      ctx.closePath();
      D.fs(ctx, '#7e57c2', OL, 1.2);
      for (let i = 0; i < 3; i++) {
        D.circlePath(ctx, 17 + i * 5, hy - 7 + (i === 1 ? -3 : 0), 1.3);
        D.fs(ctx, '#d1c4e9');
      }
    }
    // water in front of the lower hull
    ctx.save();
    D.ellipsePath(ctx, 42, hy + 10, 40, 11);
    ctx.clip();
    ctx.fillStyle = 'rgba(41,128,185,0.55)';
    ctx.fillRect(0, hy + 5, 84, 20);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = 8; x <= 76; x += 8) {
      ctx.moveTo(x, hy + 6);
      ctx.quadraticCurveTo(x + 2, hy + 3.5, x + 4, hy + 6);
    }
    ctx.stroke();
  };

  // ---------------------------------------------------------------- Super Fusion art
  const FW = 120, FH = 132, FCX = 60, FCY = 66, FK = 1.2;
  const FUSED_LOOK = {
    banana: [4, 2, 0], fart: [4, 2, 0], rocket: [4, 2, 0], freeze: [4, 2, 0], jelly: [2, 4, 0], sniper: [4, 2, 0],
    tesla: [4, 2, 0], pilot: [2, 4, 0], rockstar: [4, 2, 0], farm: [4, 2, 0], lab: [2, 0, 4], super: [4, 2, 0],
    nails: [4, 2, 0], sub: [2, 0, 4],
  };

  function crown(ctx, x, y, s, gem) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-11, 5);
    ctx.lineTo(-12, -5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(0, -9);
    ctx.lineTo(6, 0);
    ctx.lineTo(12, -5);
    ctx.lineTo(11, 5);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -9, 0, 5, [[0, '#fff8c4'], [0.5, '#ffc400'], [1, '#b37400']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    [[-12, -5], [0, -9], [12, -5]].forEach(([gx, gy]) => {
      D.circlePath(ctx, gx, gy, 1.8);
      D.fs(ctx, '#fffde7', OL, 0.6);
    });
    D.circlePath(ctx, 0, 1.5, 2.4);
    D.fs(ctx, gem, OL, 0.7);
    ctx.restore();
  }

  function sunburst(ctx, x, y, r, col, n) {
    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < n; i++) {
      ctx.rotate((Math.PI * 2) / n);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.3);
      ctx.lineTo(-r * 0.09, -r);
      ctx.lineTo(r * 0.09, -r);
      ctx.closePath();
      ctx.fillStyle = D.rgba(col, 0.35);
      ctx.fill();
    }
    ctx.restore();
  }

  function pedestal(ctx, col) {
    D.shadow(ctx, FCX, 112, 46, 12, 0.32);
    D.ellipsePath(ctx, FCX, 108, 44, 13);
    ctx.fillStyle = D.lin(ctx, 0, 95, 0, 121, [[0, '#fff3c4'], [0.4, '#e0a800'], [1, '#7a5200']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.ellipsePath(ctx, FCX, 105, 36, 9);
    ctx.fillStyle = D.rad(ctx, FCX, 105, 2, FCX, 105, 36, [[0, D.rgba(col, 0.95)], [1, D.rgba(D.shade(col, -0.4), 0.95)]]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // runes
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2;
      const x = FCX + Math.cos(an) * 30, y = 105 + Math.sin(an) * 7.4;
      ctx.beginPath();
      ctx.moveTo(x - 1.6, y - 1.2);
      ctx.lineTo(x + 1.6, y + 1.2);
      ctx.moveTo(x + 1.6, y - 1.2);
      ctx.lineTo(x - 1.6, y + 1.2);
      ctx.stroke();
    }
  }

  // decorations behind the scaled tower art
  const BACK = {
    banana(ctx, col) {
      sunburst(ctx, FCX, 44, 56, col, 14);
      for (let i = 0; i < 6; i++) {
        const an = -Math.PI / 2 + (i - 2.5) * 0.5;
        banana(ctx, FCX + Math.cos(an) * 44, 52 + Math.sin(an) * 34, 1.1, an + 1.5, '#ffc400');
      }
    },
    fart(ctx) {
      const rnd = D.rng(7);
      for (let i = 0; i < 9; i++) {
        const an = (i / 9) * Math.PI * 2;
        D.blobPath(ctx, FCX + Math.cos(an) * 40, 64 + Math.sin(an) * 34, 11 + rnd() * 5, 8, 0.2, rnd);
        D.fs(ctx, i % 2 ? 'rgba(155,225,93,0.85)' : 'rgba(106,191,42,0.85)', 'rgba(40,80,10,0.6)', 1);
      }
    },
    rocket(ctx) {
      [-1, 1].forEach((s) => {
        ctx.save();
        ctx.translate(FCX + s * 34, 46);
        ctx.rotate(s * 0.25 - Math.PI / 2);
        D.rrPath(ctx, -14, -6, 34, 12, 5);
        ctx.fillStyle = D.lin(ctx, 0, -6, 0, 6, [[0, '#eceff1'], [1, '#607d8b']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20, -5);
        ctx.quadraticCurveTo(30, 0, 20, 5);
        ctx.closePath();
        D.fs(ctx, '#ff3d00', OL, 1);
        ctx.fillStyle = '#ffd83a';
        ctx.fillRect(-6, -6, 3, 12);
        ctx.restore();
      });
    },
    freeze(ctx) {
      for (let i = 0; i < 9; i++) {
        const an = -Math.PI / 2 + (i - 4) * 0.36;
        const len = 30 + (i % 2 ? 10 : 22);
        ctx.save();
        ctx.translate(FCX + Math.cos(an) * 26, 62 + Math.sin(an) * 26);
        ctx.rotate(an + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(0, -len);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, 0, -len, 0, 0, [[0, '#ffffff'], [1, '#4fc3f7']]);
        ctx.fill();
        ctx.strokeStyle = '#0277bd';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    },
    jelly(ctx) {
      for (let i = 0; i < 6; i++) {
        const s = i < 3 ? -1 : 1;
        const k = i % 3;
        const x0 = FCX + s * (14 + k * 8), y0 = 104;
        ctx.beginPath();
        ctx.moveTo(x0 - 4, y0);
        ctx.bezierCurveTo(x0 + s * (18 + k * 6), y0 - 30, x0 - s * 6, y0 - 54 - k * 8, x0 + s * (16 + k * 4), y0 - 74 + k * 10);
        ctx.bezierCurveTo(x0 + s * 4, y0 - 52, x0 + s * (26 + k * 6), y0 - 28, x0 + 4, y0);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, 0, y0 - 74, 0, y0, [[0, '#ff8fb1'], [1, '#c2185b']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        for (let j = 0; j < 3; j++) {
          D.circlePath(ctx, x0 + s * (8 + j * 2), y0 - 16 - j * 16, 1.8);
          D.fs(ctx, '#ffd0dc');
        }
      }
    },
    sniper(ctx) {
      ctx.save();
      ctx.translate(FCX + 30, 26);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6, 40);
      ctx.stroke();
      ctx.rotate(-0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, -15, 0, 15, 0, [[0, '#ffffff'], [1, '#90a4ae']]);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 12);
      ctx.stroke();
      D.circlePath(ctx, 0, 1, 2.4);
      D.fs(ctx, '#40c4ff', OL, 0.8);
      ctx.restore();
      // solar panels
      [-1, 1].forEach((s) => {
        D.rrPath(ctx, FCX - 50 + (s > 0 ? 0 : 0), 30 + (s > 0 ? 16 : 0), 22, 10, 1.5);
        D.fs(ctx, '#1a237e', OL, 1);
        ctx.strokeStyle = 'rgba(128,216,255,0.6)';
        ctx.lineWidth = 0.6;
        for (let k = 1; k < 4; k++) {
          ctx.beginPath();
          ctx.moveTo(FCX - 50 + k * 5.5, 30 + (s > 0 ? 16 : 0));
          ctx.lineTo(FCX - 50 + k * 5.5, 40 + (s > 0 ? 16 : 0));
          ctx.stroke();
        }
      });
    },
    tesla(ctx) {
      [-1, 1].forEach((s) => {
        const x = FCX + s * 38;
        D.rrPath(ctx, x - 3, 30, 6, 74, 2);
        D.fs(ctx, '#8d5524', OL, 1.1);
        for (let i = 0; i < 6; i++) {
          D.ellipsePath(ctx, x, 92 - i * 10, 7 - i * 0.4, 2);
          D.fs(ctx, '#d9822b', OL, 0.8);
        }
        energyBall(ctx, x, 26, 5, '#b388ff');
      });
      ctx.strokeStyle = 'rgba(209,179,255,0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(FCX - 38, 26);
      for (let i = 1; i < 8; i++) ctx.lineTo(FCX - 38 + i * 9.5, 18 + (i % 2 ? -6 : 4));
      ctx.lineTo(FCX + 38, 26);
      ctx.stroke();
    },
    pilot(ctx) {
      // hangar flag
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(FCX + 40, 104);
      ctx.lineTo(FCX + 40, 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(FCX + 41, 31);
      ctx.quadraticCurveTo(FCX + 52, 28, FCX + 58, 34);
      ctx.lineTo(FCX + 58, 46);
      ctx.quadraticCurveTo(FCX + 52, 41, FCX + 41, 44);
      ctx.closePath();
      D.fs(ctx, '#ffc400', OL, 1);
      D.starPath(ctx, FCX + 49, 38, 5, 3.6, 1.6);
      D.fs(ctx, '#e53935');
    },
    rockstar(ctx) {
      ampBox(ctx, 2, 30, 22, 74);
      ampBox(ctx, FW - 24, 30, 22, 74);
      // stage lights
      [[20, 20, '#ff4081'], [FW - 20, 20, '#40c4ff'], [FCX, 10, '#ffd83a']].forEach(([x, y, col]) => {
        glowRing(ctx, x, y, 16, col, 0.6);
        D.circlePath(ctx, x, y, 4);
        D.fs(ctx, col, OL, 1);
      });
    },
    farm(ctx, col) {
      sunburst(ctx, FCX, 40, 62, col, 16);
    },
    lab(ctx) {
      // doom tower
      D.rrPath(ctx, FCX - 12, 6, 24, 90, 4);
      ctx.fillStyle = D.lin(ctx, FCX - 12, 0, FCX + 12, 0, [[0, '#7e57c2'], [0.5, '#4527a0'], [1, '#1a0f3a']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        D.rrPath(ctx, FCX - 5, 16 + i * 16, 10, 7, 2);
        D.fs(ctx, '#ea80fc', OL, 0.8);
      }
      energyBall(ctx, FCX, 4, 6, '#e040fb');
    },
    nails(ctx) {
      // fan of giant iron spikes
      for (let i = 0; i < 9; i++) {
        const an = -Math.PI / 2 + (i - 4) * 0.32;
        ctx.save();
        ctx.translate(FCX + Math.cos(an) * 20, 70 + Math.sin(an) * 20);
        ctx.rotate(an + Math.PI / 2);
        const len = 34 + (i % 2 ? 0 : 14);
        ctx.beginPath();
        ctx.moveTo(-3.5, 0);
        ctx.lineTo(0, -len);
        ctx.lineTo(3.5, 0);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, -3, 0, 3, 0, [[0, '#eceff1'], [1, '#455a64']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1;
        ctx.stroke();
        D.ellipsePath(ctx, 0, 0, 6, 2.4);
        D.fs(ctx, '#78909c', OL, 0.8);
        ctx.restore();
      }
    },
    sub(ctx) {
      // a towering wave behind the sub
      ctx.beginPath();
      ctx.moveTo(6, 100);
      ctx.bezierCurveTo(4, 50, 40, 12, 80, 16);
      ctx.bezierCurveTo(112, 20, 116, 48, 98, 52);
      ctx.bezierCurveTo(86, 54, 84, 40, 94, 38);
      ctx.bezierCurveTo(70, 34, 60, 70, 84, 100);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 14, 0, 100, [[0, '#e0f7fa'], [0.4, '#4dd0e1'], [1, '#00838f']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        D.circlePath(ctx, 20 + i * 12, 70 - i * 8, 2.2);
        D.fs(ctx, 'rgba(255,255,255,0.7)');
      }
    },
    super(ctx, col) {
      sunburst(ctx, FCX, 50, 60, '#fff176', 18);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,241,118,0.8)';
      ctx.lineWidth = 2.2;
      D.ellipsePath(ctx, FCX, 54, 50, 16, -0.25);
      ctx.stroke();
      ctx.restore();
      const rnd = D.rng(5);
      for (let i = 0; i < 10; i++) {
        D.starPath(ctx, 8 + rnd() * (FW - 16), 6 + rnd() * 70, 4, 3 + rnd() * 2, 1);
        D.fs(ctx, '#ffffff');
      }
    },
  };

  // decorations in front of the scaled tower art
  const FRONT = {
    banana() {},
    fart(ctx) { crown(ctx, FCX, 34, 1.05, '#76d13a'); },
    rocket(ctx) {
      D.starPath(ctx, FCX, 38, 5, 6, 2.6);
      D.fs(ctx, '#ffd54f', OL, 1);
    },
    freeze(ctx) { crown(ctx, FCX, 33, 1.05, '#4fc3f7'); },
    jelly(ctx) { crown(ctx, FCX, 34, 1.05, '#ec407a'); },
    sniper(ctx) {
      ctx.strokeStyle = 'rgba(64,196,255,0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(FCX + 30, 66);
      ctx.lineTo(FW, 60);
      ctx.stroke();
    },
    tesla() {},
    pilot() {},
    rockstar(ctx) { crown(ctx, FCX, 33, 1.05, '#ff4081'); },
    nails() {},
    sub() {},
    farm(ctx) {
      // the farmer gets a crown, and a golden banana statue stands in front
      crown(ctx, 50, 33, 0.65, '#ffca28');
      const x = FCX + 30, y = 98;
      D.rrPath(ctx, x - 9, y - 8, 18, 10, 2);
      ctx.fillStyle = D.lin(ctx, 0, y - 8, 0, y + 2, [[0, '#fff3c4'], [1, '#a66a00']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      glowRing(ctx, x, y - 22, 18, '#fff176', 0.6);
      banana(ctx, x, y - 20, 1.9, -1.2, '#ffc400');
    },
    lab() {},
    super(ctx) { crown(ctx, FCX, 32, 1.1, '#e53935'); },
  };

  function drawFused(ctx, type) {
    const f = MT.TOWERS[type].fusion;
    const col = f.color;
    glowRing(ctx, FCX, FCY - 4, 60, col, 0.35);
    pedestal(ctx, col);
    if (BACK[type]) BACK[type](ctx, col);
    // the tower's own art at its strongest, scaled up and glazed
    const look = FUSED_LOOK[type] || [4, 2, 0];
    const { c, ctx: c2 } = D.canvas(84, 92);
    P[type](c2, look);
    c2.save();
    c2.setTransform(1, 0, 0, 1, 0, 0);
    c2.globalCompositeOperation = 'source-atop';
    const g = c2.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, D.rgba('#ffffff', 0.22));
    g.addColorStop(0.5, D.rgba(col, 0.18));
    g.addColorStop(1, D.rgba(D.shade(col, -0.3), 0.32));
    c2.fillStyle = g;
    c2.fillRect(0, 0, c.width, c.height);
    c2.restore();
    const cy0 = type === 'farm' || type === 'lab' ? 58 : 49;
    ctx.drawImage(c, FCX - 42 * FK, FCY - cy0 * FK, 84 * FK, 92 * FK);
    if (FRONT[type]) FRONT[type](ctx, col);
  }

  TA.FUSED_OY = FCY / FH;
  TA.fusedKey = function (scene, type) {
    const key = `tw_fused_${type}`;
    if (!scene.textures.exists(key)) D.make(scene, key, FW, FH, (ctx) => drawFused(ctx, type));
    return key;
  };
  TA.planeKey = function (scene, tiers, fused) {
    const t = tiers || [0, 0, 0];
    const key = fused ? 'pl_fused' : `pl_${t.join('')}`;
    if (!scene.textures.exists(key)) D.make(scene, key, 60, 40, (ctx) => drawPlane(ctx, t, fused));
    return key;
  };
  TA.props.energyBall = energyBall;
  TA.props.boltIcon = bolt;
  TA.props.guitar = guitar;
  TA.props.crown = crown;
  TA.props.ampBox = ampBox;
  TA.props.nailIcon = nailIcon;
  TA.props.sunburst = sunburst;
  TA.drawPlane = drawPlane;
})();
