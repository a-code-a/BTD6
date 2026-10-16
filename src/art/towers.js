// Tower + hero artwork. Each tower is drawn per upgrade combination (lazily)
// so the sprite visibly evolves as you buy upgrades.
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;

  const TW = 84, TH = 92; // texture box (logical px)
  const FOOT = 76; // y of the feet inside the box
  const B = { cx: 42, cy: 49, w: 30, h: 42 };

  // ---------- props ----------
  function banana(ctx, x, y, s, rot, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s, s);
    const c = col || '#ffe14a';
    ctx.beginPath();
    ctx.moveTo(-10, -3);
    ctx.quadraticCurveTo(0, 10, 10, -4);
    ctx.quadraticCurveTo(0, 3.5, -10, -3);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -4, 0, 7, [[0, D.shade(c, 0.35)], [0.6, c], [1, D.shade(c, -0.3)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(0, 4.5, 6, 0);
    ctx.stroke();
    // stem + tip
    ctx.strokeStyle = '#6b4a1f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9.5, -4);
    ctx.lineTo(12, -6.5);
    ctx.stroke();
    D.circlePath(ctx, -10, -3, 1.1);
    D.fs(ctx, '#3d2b14');
    ctx.restore();
  }

  function bananaBall(ctx, x, y, r, golden) {
    const base = golden ? '#ffc82e' : '#ffe14a';
    if (golden) {
      ctx.save();
      ctx.fillStyle = '#c98a00';
      D.starPath(ctx, x, y, 10, r * 1.35, r * 0.9);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r, [[0, '#fffbd6'], [0.35, base], [1, D.shade(base, -0.4)]]);
    ctx.fill();
    ctx.save();
    D.circlePath(ctx, x, y, r);
    ctx.clip();
    ctx.strokeStyle = D.rgba('#8a5a10', 0.55);
    ctx.lineWidth = Math.max(0.8, r * 0.09);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1);
      ctx.quadraticCurveTo(x + Math.cos(a + 0.9) * r * 0.2, y + Math.sin(a + 0.9) * r * 0.2, x + Math.cos(a + 2.2) * r * 1.1, y + Math.sin(a + 2.2) * r * 1.1);
      ctx.stroke();
    }
    ctx.restore();
    D.circlePath(ctx, x, y, r);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.ellipsePath(ctx, x - r * 0.35, y - r * 0.4, r * 0.28, r * 0.16, -0.6);
    D.fs(ctx, 'rgba(255,255,255,0.7)');
  }

  function helmet(ctx, cx, top, w, col, opts = {}) {
    // dome helmet sitting on the top of the capsule
    const r = w * 0.56;
    ctx.beginPath();
    ctx.arc(cx, top + r * 0.95, r, Math.PI * 1.02, Math.PI * 1.98);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - r, 0, cx + r, 0, [[0, D.shade(col, 0.3)], [0.5, col], [1, D.shade(col, -0.35)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.rrPath(ctx, cx - r * 1.05, top + r * 0.78, r * 2.1, r * 0.24, r * 0.1);
    D.fs(ctx, D.shade(col, -0.2), OL, 1.2);
    if (opts.camo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, top + r * 0.95, r, Math.PI * 1.02, Math.PI * 1.98);
      ctx.clip();
      const rnd = D.rng(4);
      for (let i = 0; i < 6; i++) {
        D.blobPath(ctx, cx - r + rnd() * r * 2, top + rnd() * r, r * 0.25, 6, 0.3, rnd);
        D.fs(ctx, i % 2 ? '#3f5a2a' : '#6f6a3a');
      }
      ctx.restore();
    }
    if (opts.star) {
      D.starPath(ctx, cx, top + r * 0.45, 5, r * 0.22, r * 0.1);
      D.fs(ctx, opts.star, OL, 0.8);
    }
  }

  function beanie(ctx, cx, top, w, col) {
    const r = w * 0.53;
    ctx.beginPath();
    ctx.arc(cx, top + r * 1.05, r, Math.PI * 1.05, Math.PI * 1.95);
    ctx.closePath();
    D.fs(ctx, col, OL, 1.3);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = D.shade(col, -0.25);
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 3.2, top - 4);
      ctx.lineTo(cx + i * 3.2, top + r);
      ctx.stroke();
    }
    ctx.restore();
    D.rrPath(ctx, cx - r * 1.02, top + r * 0.62, r * 2.04, r * 0.4, r * 0.18);
    D.fs(ctx, '#f4f4f4', OL, 1.2);
    D.circlePath(ctx, cx, top - r * 0.02, r * 0.3);
    D.fs(ctx, '#ffffff', OL, 1.2);
  }

  function strawHat(ctx, cx, top, w) {
    D.ellipsePath(ctx, cx, top + 5, w * 0.95, w * 0.22);
    ctx.fillStyle = D.lin(ctx, cx - w, 0, cx + w, 0, [[0, '#f6dc8e'], [1, '#c99a3e']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    D.rrPath(ctx, cx - w * 0.38, top - w * 0.2, w * 0.76, w * 0.32, w * 0.12);
    D.fs(ctx, '#e9c46a', OL, 1.2);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(cx - w * 0.38, top + w * 0.02, w * 0.76, w * 0.08);
  }

  function sandbags(ctx, cx, y) {
    const bag = (x, yy, ww) => {
      D.rrPath(ctx, x - ww / 2, yy - 5, ww, 10, 5);
      ctx.fillStyle = D.lin(ctx, 0, yy - 5, 0, yy + 5, [[0, '#d8c08a'], [1, '#9c814b']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    };
    bag(cx - 13, y, 16);
    bag(cx + 3, y, 16);
    bag(cx + 18, y + 1, 14);
    bag(cx - 5, y - 7, 16);
    bag(cx + 10, y - 7, 15);
  }

  function cape(ctx, cx, cy, w, h, col) {
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.45, cy - h * 0.12);
    ctx.quadraticCurveTo(cx - w * 1.15, cy + h * 0.3, cx - w * 0.85, cy + h * 0.62);
    ctx.lineTo(cx - w * 0.3, cy + h * 0.5);
    ctx.lineTo(cx, cy + h * 0.64);
    ctx.lineTo(cx + w * 0.3, cy + h * 0.5);
    ctx.lineTo(cx + w * 0.85, cy + h * 0.62);
    ctx.quadraticCurveTo(cx + w * 1.15, cy + h * 0.3, cx + w * 0.45, cy - h * 0.12);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - w, 0, cx + w, 0, [[0, D.shade(col, 0.2)], [0.5, col], [1, D.shade(col, -0.45)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function glowRing(ctx, cx, cy, r, col, a = 0.5) {
    ctx.fillStyle = D.rad(ctx, cx, cy, r * 0.3, cx, cy, r, [[0, D.rgba(col, a)], [1, D.rgba(col, 0)]]);
    D.circlePath(ctx, cx, cy, r);
    ctx.fill();
  }

  // ---------- generic minion tower base ----------
  function baseMinion(ctx, o) {
    D.shadow(ctx, B.cx, FOOT, 17, 5.5);
    M.draw(ctx, Object.assign({ x: B.cx, y: B.cy, w: B.w, h: B.h }, o));
  }

  // ---------- towers ----------
  const P = {};

  P.banana = function (ctx, t) {
    const [a, b, c] = t;
    const hand = { x: B.cx + 22, y: B.cy - 15 };
    const best = Math.max(a, b, c);
    const weapon = best >= 3 ? (a === best ? 'ball' : c === best ? 'crossbow' : 'triple') : 'banana';
    const o = {
      eyes: 2, hair: 'sprout', mouth: b >= 4 ? 'happy' : 'smile', seed: 11, lookX: 0.6,
      armsBack: [],
      arms: [{ x0: B.cx - 13, y0: B.cy + 2, x1: B.cx - 19, y1: B.cy + 13 }],
    };
    if (b >= 4) glowRing(ctx, B.cx, B.cy, 40, '#ff8a00', 0.45);
    if (a >= 4) glowRing(ctx, B.cx, B.cy - 10, 38, '#ffd000', 0.5);
    if (weapon === 'crossbow') {
      o.arms.push({ x0: B.cx + 12, y0: B.cy + 1, x1: B.cx + 20, y1: B.cy + 3 });
      o.arms[0] = { x0: B.cx - 13, y0: B.cy + 1, x1: B.cx + 6, y1: B.cy + 6, bend: [B.cx - 10, B.cy + 14] };
    } else if (weapon === 'ball') {
      o.arms = [
        { x0: B.cx - 13, y0: B.cy, x1: B.cx - 6, y1: B.cy - 30, bend: [B.cx - 22, B.cy - 14] },
        { x0: B.cx + 13, y0: B.cy, x1: B.cx + 6, y1: B.cy - 30, bend: [B.cx + 22, B.cy - 14] },
      ];
    } else {
      o.arms.push({ x0: B.cx + 13, y0: B.cy + 1, x1: hand.x, y1: hand.y, bend: [B.cx + 23, B.cy] });
    }
    if (c >= 2) o.after = (ctx2) => {
      // zoom lens on right goggle
      ctx2.save();
      D.rrPath(ctx2, B.cx + 3, B.cy - 13.5, 15, 7, 2);
      D.fs(ctx2, '#9aa3ad', OL, 1.1);
      D.circlePath(ctx2, B.cx + 18, B.cy - 10, 4);
      D.fs(ctx2, '#7fd7ff', OL, 1.1);
      ctx2.restore();
    };
    if (weapon === 'ball') {
      // draw ball after body so it sits over the hands
      const prevAfter = o.after;
      o.after = (ctx2, ...r) => {
        prevAfter && prevAfter(ctx2, ...r);
        bananaBall(ctx2, B.cx, B.cy - 36, a >= 4 ? 12 : 10, a >= 4);
      };
    }
    baseMinion(ctx, o);
    if (b >= 1) {
      // sweatband
      ctx.save();
      D.capsulePath(ctx, B.cx, B.cy, B.w, B.h);
      ctx.clip();
      ctx.fillStyle = b >= 4 ? '#ff7a00' : '#e53935';
      ctx.fillRect(B.cx - 20, B.cy - 22, 40, 4.5);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(B.cx - 20, B.cy - 21, 40, 1);
      ctx.restore();
    }
    if (c >= 4) {
      // sharpshooter beret
      D.ellipsePath(ctx, B.cx - 2, B.cy - 22, 15, 5, -0.15);
      D.fs(ctx, '#2e7d32', OL, 1.2);
      D.circlePath(ctx, B.cx - 2, B.cy - 27, 1.8);
      D.fs(ctx, '#2e7d32', OL, 1);
    }
    if (weapon === 'banana') {
      banana(ctx, hand.x + 2, hand.y - 4, a >= 1 ? 1.0 + a * 0.1 : 0.95, -0.9, a >= 2 ? '#ffd21f' : '#ffe14a');
    } else if (weapon === 'triple') {
      banana(ctx, hand.x - 1, hand.y - 6, 0.85, -1.4);
      banana(ctx, hand.x + 3, hand.y - 5, 0.85, -0.8);
      banana(ctx, hand.x + 5, hand.y - 1, 0.85, -0.2);
    } else if (weapon === 'crossbow') {
      const x = B.cx + 18, y = B.cy + 3;
      ctx.save();
      ctx.translate(x, y);
      D.rrPath(ctx, -10, -2.5, 24, 5, 2);
      D.fs(ctx, '#8d5a2b', OL, 1.2);
      ctx.beginPath();
      ctx.moveTo(10, -12);
      ctx.quadraticCurveTo(16, 0, 10, 12);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3.4;
      ctx.stroke();
      ctx.strokeStyle = '#5d3a1a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, -12);
      ctx.lineTo(3, 0);
      ctx.lineTo(10, 12);
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      banana(ctx, 12, -1, 0.55, 0.2, '#ffe14a');
      if (c >= 4) {
        D.rrPath(ctx, -4, -7, 10, 4, 2);
        D.fs(ctx, '#333', OL, 1);
        ctx.strokeStyle = 'rgba(255,40,40,0.8)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(6, -5);
        ctx.lineTo(26, -5);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  P.fart = function (ctx, t) {
    const [a, b, c] = t;
    if (a >= 4) glowRing(ctx, B.cx, B.cy, 40, '#9be15d', 0.55);
    if (c >= 4) glowRing(ctx, B.cx, B.cy, 40, '#ff6a00', 0.5);
    const o = {
      eyes: 1, hair: 'tuft', mouth: a >= 3 ? 'flat' : 'grin', seed: 21, w: 30, h: 46, y: B.cy - 2, lookX: 0.8,
      arms: [
        { x0: B.cx - 13, y0: B.cy + 2, x1: B.cx + 2, y1: B.cy + 10, bend: [B.cx - 12, B.cy + 14] },
        { x0: B.cx + 13, y0: B.cy + 2, x1: B.cx + 15, y1: B.cy + 6 },
      ],
    };
    if (a >= 3) {
      o.face = (ctx2, cx, cy, w, h) => {
        // gas mask
        D.rrPath(ctx2, cx - w * 0.3, cy - h * 0.04, w * 0.6, h * 0.2, 5);
        D.fs(ctx2, '#4a5a3a', OL, 1.2);
        D.circlePath(ctx2, cx, cy + h * 0.14, w * 0.16);
        D.fs(ctx2, '#2d3524', OL, 1.2);
        for (let i = -1; i <= 1; i++) {
          D.circlePath(ctx2, cx + i * 2.6, cy + h * 0.14, 0.9);
          D.fs(ctx2, '#8fa07a');
        }
      };
    }
    if (c >= 3) {
      o.after = () => {};
    }
    baseMinion(ctx, o);
    // fart gun
    const gx = B.cx + 4, gy = B.cy + 8;
    const tank = c >= 3 ? '#e65100' : a >= 4 ? '#6abf2a' : '#8bc34a';
    ctx.save();
    ctx.translate(gx, gy);
    D.rrPath(ctx, -8, -6, 20, 10, 4);
    ctx.fillStyle = D.lin(ctx, 0, -6, 0, 4, [[0, D.shade(tank, 0.35)], [1, D.shade(tank, -0.3)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    D.circlePath(ctx, -1, -6, 2.4);
    D.fs(ctx, '#b0b0b0', OL, 1);
    const bells = b >= 3 ? [[-6], [6]] : [[0]];
    bells.forEach(([dy]) => {
      // brass horn
      ctx.beginPath();
      ctx.moveTo(10, -3 + dy * 0.6);
      ctx.lineTo(22, -8 + dy);
      ctx.quadraticCurveTo(25, dy, 22, 8 + dy);
      ctx.lineTo(10, 3 + dy * 0.6);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 10, -8, 10, 8, [[0, '#ffe08a'], [0.5, '#e0a52a'], [1, '#9a6a12']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      D.ellipsePath(ctx, 22.5, dy, 2.2, 7.5);
      D.fs(ctx, '#3a2a10', OL, 1);
    });
    ctx.restore();
    // puff
    const puff = c >= 3 ? '#ff9d2e' : '#a5d86a';
    const rnd = D.rng(3);
    for (let i = 0; i < 3; i++) {
      D.blobPath(ctx, B.cx + 31 + i * 4, B.cy + 2 - i * 5, 4 - i * 0.6, 7, 0.2, rnd);
      D.fs(ctx, D.rgba(puff, 0.85), D.rgba('#2a1d14', 0.5), 0.8);
    }
    if (c >= 4) {
      helmet(ctx, B.cx, B.cy - 31, B.w, '#c62828');
    }
  };

  // ---------- Rocket Minion: bazooka on the shoulder, face free ----------
  // The launcher rests on the right shoulder and runs behind the head, so the
  // goggles stay visible; it points up and to the right, at the target.
  const ROCKET_TUBE = { x: 12, y: 55, a: -0.36, len: 58 };

  function rocketTube(ctx, dy, thick, len, col, band, o = {}) {
    ctx.save();
    ctx.translate(ROCKET_TUBE.x, ROCKET_TUBE.y + dy);
    ctx.rotate(ROCKET_TUBE.a);
    const h = thick / 2;
    // flared blast cone at the back
    ctx.beginPath();
    ctx.moveTo(4, -h);
    ctx.lineTo(-5, -h - 3.5);
    ctx.lineTo(-5, h + 3.5);
    ctx.lineTo(4, h);
    ctx.closePath();
    D.fs(ctx, D.shade(col, -0.35), OL, 1.2);
    // the tube
    D.rrPath(ctx, 2, -h, len, thick, h * 0.5);
    ctx.fillStyle = D.lin(ctx, 0, -h, 0, h, [[0, D.shade(col, 0.45)], [0.35, col], [1, D.shade(col, -0.45)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(6, -h + 1.4, len - 8, 1.6);
    // metal rings + muzzle
    [10, len - 6].forEach((x) => {
      D.rrPath(ctx, x, -h - 1, 4, thick + 2, 1.2);
      D.fs(ctx, band || '#8d9440', OL, 0.9);
    });
    if (o.stripes) {
      ctx.save();
      D.rrPath(ctx, len * 0.74, -h, 12, thick, 1);
      ctx.clip();
      for (let i = -4; i < 6; i++) {
        ctx.fillStyle = i % 2 ? '#263238' : '#ffca28';
        ctx.beginPath();
        ctx.moveTo(len * 0.74 + i * 4, -h);
        ctx.lineTo(len * 0.74 + i * 4 + 4, -h);
        ctx.lineTo(len * 0.74 + i * 4 - 2, h);
        ctx.lineTo(len * 0.74 + i * 4 - 6, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    // the warhead poking out of the front
    if (o.tip) {
      const tl = o.tipLen || thick * 0.9;
      ctx.beginPath();
      ctx.moveTo(len + 2, -h * 0.72);
      ctx.quadraticCurveTo(len + 2 + tl, -h * 0.4, len + 2 + tl * 1.15, 0);
      ctx.quadraticCurveTo(len + 2 + tl, h * 0.4, len + 2, h * 0.72);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, -h, 0, h, [[0, D.shade(o.tip, 0.45)], [0.5, o.tip], [1, D.shade(o.tip, -0.35)]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      if (o.tipBand) {
        ctx.fillStyle = o.tipBand;
        ctx.fillRect(len + 3, -h * 0.66, 2.4, h * 1.32);
      }
    }
    ctx.restore();
  }

  // point along the launcher (u: distance along it, v: sideways offset)
  function tubePoint(u, v) {
    const c = Math.cos(ROCKET_TUBE.a), s = Math.sin(ROCKET_TUBE.a);
    return [ROCKET_TUBE.x + u * c - v * s, ROCKET_TUBE.y + u * s + v * c];
  }

  P.rocket = function (ctx, t) {
    const [a, b, c] = t;
    const tech = c >= 3;
    if (a >= 4) glowRing(ctx, B.cx, B.cy - 6, 44, '#ff6d00', 0.5);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy - 6, 44, '#29b6f6', 0.5);
    else if (b >= 4) glowRing(ctx, B.cx, B.cy - 6, 44, '#ffd740', 0.45);
    // launcher colours per upgrade path
    const col = a >= 4 ? '#283593' : tech ? '#eceff1' : a >= 3 ? '#4e5b31' : '#6b7a3a';
    const band = a >= 4 ? '#ffc400' : tech ? '#29b6f6' : '#a1a85a';
    const tip = a >= 4 ? '#ffc400' : c >= 4 ? '#40c4ff' : a >= 2 ? '#e53935' : '#d84315';
    const thick = a >= 3 ? 14 : a >= 1 ? 11 : 10;
    const tipLen = a >= 3 ? 11 : 8;
    const L = ROCKET_TUBE.len;
    if (b >= 1) {
      // ammo crate with spare rockets by the feet
      const cx = 12, cy = FOOT - 9;
      D.rrPath(ctx, cx - 9, cy - 4, 18, 12, 2);
      D.fs(ctx, '#8d6e63', OL, 1.1);
      ctx.strokeStyle = 'rgba(62,39,35,0.6)';
      ctx.lineWidth = 0.9;
      ctx.strokeRect(cx - 8, cy - 1, 16, 1);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 6 + i * 6, cy - 4);
        ctx.lineTo(cx - 4.5 + i * 6, cy - 12);
        ctx.lineTo(cx - 3 + i * 6, cy - 4);
        ctx.closePath();
        D.fs(ctx, tip, OL, 0.8);
      }
    }
    // the launcher sits behind the head
    if (b >= 4) {
      // rocket pod: a box with six rockets ready to go
      ctx.save();
      ctx.translate(ROCKET_TUBE.x, ROCKET_TUBE.y - 6);
      ctx.rotate(ROCKET_TUBE.a);
      D.rrPath(ctx, 6, -13, L - 6, 26, 4);
      ctx.fillStyle = D.lin(ctx, 0, -13, 0, 13, [[0, D.shade(col, 0.4)], [0.5, col], [1, D.shade(col, -0.45)]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      // three rows of rocket noses peeking out of the front
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(L, -11 + k * 8);
        ctx.quadraticCurveTo(L + 7, -9.5 + k * 8, L + 8, -7.5 + k * 8);
        ctx.quadraticCurveTo(L + 7, -5.5 + k * 8, L, -4 + k * 8);
        ctx.closePath();
        D.fs(ctx, tip, OL, 0.9);
      }
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(18, -13, 4, 26);
      ctx.restore();
    } else if (b >= 3) {
      rocketTube(ctx, -9, 8, L - 4, col, band, { tip, tipLen: 7 });
      rocketTube(ctx, 0, 8, L, col, band, { tip, tipLen: 7 });
      rocketTube(ctx, 9, 8, L - 4, col, band, { tip, tipLen: 7 });
    } else {
      rocketTube(ctx, 0, thick, L, col, band, { tip, tipLen, stripes: a >= 1, tipBand: a >= 3 ? '#ffffff' : null });
    }
    if (b >= 2 && b < 4) {
      // auto-loader drum under the back of the launcher
      const [dx, dy] = tubePoint(6, 9);
      D.circlePath(ctx, dx, dy, 6);
      ctx.fillStyle = D.rad(ctx, dx - 2, dy - 2, 0, dx, dy, 6, [[0, '#cfd8dc'], [1, '#455a64']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      D.circlePath(ctx, dx, dy, 2);
      D.fs(ctx, '#263238');
    }
    const o = {
      eyes: 2, hair: 'bald', mouth: a >= 3 ? 'teeth' : 'grin', seed: 31, lookX: 0.8, lid: 0.12, lidDepth: 0.68,
      rim: tech ? '#80d8ff' : null,
      arms: [],
      outfit: (c2, cx, cy, w, h) => {
        // bandolier with a row of shells across the chest
        c2.strokeStyle = '#5d4037';
        c2.lineWidth = 3.6;
        c2.beginPath();
        c2.moveTo(cx - w * 0.5, cy - h * 0.02);
        c2.lineTo(cx + w * 0.5, cy + h * 0.3);
        c2.stroke();
        for (let i = 0; i < 4; i++) {
          const x = cx - w * 0.33 + i * w * 0.2, y = cy + h * 0.03 + i * h * 0.065;
          D.rrPath(c2, x - 1.4, y - 3.2, 2.8, 4, 1);
          D.fs(c2, '#ffca28', OL, 0.5);
        }
      },
    };
    // hands: right one on the grip, left one steadying the back of the tube
    const grip = tubePoint(50, 6), rear = tubePoint(8, 4);
    o.after = (c2) => {
      D.limb(c2, B.cx - 13, B.cy + 2, rear[0] + 3, rear[1] + 2, B.w * 0.14, '#ffd83a', { bend: [B.cx - 20, B.cy + 2], lw: 1.5 });
      // grip handle
      c2.save();
      c2.translate(grip[0], grip[1]);
      c2.rotate(ROCKET_TUBE.a + 0.25);
      D.rrPath(c2, -2, -1, 4, 9, 1.5);
      D.fs(c2, '#3e2723', OL, 0.9);
      c2.restore();
      D.limb(c2, B.cx + 13, B.cy + 2, grip[0] + 1, grip[1] + 7, B.w * 0.14, '#ffd83a', { bend: [B.cx + 20, B.cy + 6], lw: 1.5 });
    };
    baseMinion(ctx, o);
    // helmet sits high enough that the goggles stay visible
    helmet(ctx, B.cx, B.cy - 34, B.w, tech ? '#cfd8dc' : a >= 4 ? '#3949ab' : '#5d6b32', { camo: !tech && a < 4, star: a >= 4 ? '#ffd54f' : null });
    // chin strap
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.2;
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(B.cx + s * 14.8, B.cy - 17);
      ctx.quadraticCurveTo(B.cx + s * 14, B.cy - 7, B.cx + s * 10.5, B.cy - 4);
      ctx.stroke();
    });
    if (c >= 2) {
      // radar antenna for homing rockets
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(B.cx - 9, B.cy - 30);
      ctx.lineTo(B.cx - 13, B.cy - 41);
      ctx.stroke();
      D.circlePath(ctx, B.cx - 13, B.cy - 42, 2.2);
      D.fs(ctx, '#ff1744', OL, 0.8);
      glowRing(ctx, B.cx - 13, B.cy - 42, 5, '#ff1744', 0.6);
    }
    if (c >= 3) {
      // targeting visor (see-through, the goggles still show)
      D.rrPath(ctx, B.cx - 15, B.cy - 13.5, 30, 9, 4);
      D.fs(ctx, 'rgba(0,229,255,0.35)', 'rgba(1,87,155,0.9)', 1.1);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(B.cx + 2, B.cy - 9);
      ctx.lineTo(B.cx + 12, B.cy - 9);
      ctx.moveTo(B.cx + 7, B.cy - 12.5);
      ctx.lineTo(B.cx + 7, B.cy - 5.5);
      ctx.stroke();
    }
    if (c >= 1) {
      // laser sight on top of the launcher, with its red dot line
      const [sx, sy] = tubePoint(L - 4, -thick / 2 - 3);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ROCKET_TUBE.a);
      D.rrPath(ctx, -6, -2.6, 13, 5.2, 2);
      D.fs(ctx, '#37474f', OL, 0.9);
      D.circlePath(ctx, 7, 0, 1.8);
      D.fs(ctx, '#ff1744');
      ctx.strokeStyle = 'rgba(255,23,68,0.75)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.restore();
    }
    if (a >= 4) {
      // Moon Buster emblem on the tube
      const [mx, my] = tubePoint(50, 0);
      D.circlePath(ctx, mx, my, 4.4);
      D.fs(ctx, '#fff59d', OL, 0.8);
      D.circlePath(ctx, mx + 1.8, my - 1, 3.6);
      D.fs(ctx, col);
    }
  };

  // ---------- Freeze Ray Minion: winter gear and a Gru-style freeze ray ----------
  function freezeRay(ctx, x, y, o) {
    const big = o.big;
    ctx.save();
    ctx.translate(x, y);
    // body of the ray
    const L = o.cannon ? 22 : big ? 27 : 24;
    D.rrPath(ctx, -8, -6, L, 12, 5);
    ctx.fillStyle = D.lin(ctx, 0, -6, 0, 6, [[0, '#ffffff'], [0.5, '#cfd8dc'], [1, '#78909c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // blue stripes / coils
    for (let i = 0; i < 3; i++) {
      D.rrPath(ctx, -4 + i * 5.5, -6.5, 2.6, 13, 1);
      D.fs(ctx, o.coils ? '#00e5ff' : '#29b6f6', OL, 0.6);
      if (o.coils) glowRing(ctx, -2.7 + i * 5.5, 0, 6, '#80deea', 0.45);
    }
    // glass tank of glowing freeze liquid on top
    const tr = big ? 7.5 : 6;
    D.rrPath(ctx, 0, -6 - tr * 1.6, tr * 2, tr * 1.7, tr * 0.6);
    ctx.fillStyle = 'rgba(225,245,255,0.9)';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = D.lin(ctx, 0, -6 - tr, 0, -6, [[0, '#b3f5ff'], [1, '#0288d1']]);
    ctx.fillRect(0, -6 - tr * 1.05, tr * 2, tr * 1.2);
    D.circlePath(ctx, tr * 0.6, -6 - tr * 0.5, 1.2);
    D.fs(ctx, 'rgba(255,255,255,0.9)');
    D.circlePath(ctx, tr * 1.3, -6 - tr * 0.8, 0.9);
    D.fs(ctx, 'rgba(255,255,255,0.9)');
    ctx.restore();
    D.rrPath(ctx, 0, -6 - tr * 1.6, tr * 2, tr * 1.7, tr * 0.6);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(2, -6 - tr * 1.3);
    ctx.lineTo(2, -6 - tr * 0.5);
    ctx.stroke();
    // trigger grip
    D.rrPath(ctx, 2, 4, 5, 8, 2);
    D.fs(ctx, '#37474f', OL, 1);
    if (o.cannon) {
      // cryo cannon: a wide barrel with an ice ball (or a giant icicle) loaded
      D.rrPath(ctx, L - 10, -9, 14, 18, 4);
      ctx.fillStyle = D.lin(ctx, 0, -9, 0, 9, [[0, '#e1f5fe'], [0.5, '#4fc3f7'], [1, '#01579b']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      if (o.icicle) {
        ctx.beginPath();
        ctx.moveTo(L + 2, -6);
        ctx.lineTo(L + 13, 0);
        ctx.lineTo(L + 2, 6);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, L, -6, L, 6, [[0, '#ffffff'], [0.5, '#b3e5fc'], [1, '#0288d1']]);
        ctx.fill();
        ctx.strokeStyle = '#01579b';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      } else {
        D.circlePath(ctx, L + 6, 0, 6.4);
        ctx.fillStyle = D.rad(ctx, L + 4, -2, 0.5, L + 6, 0, 6.4, [[0, '#ffffff'], [0.5, '#b3e5fc'], [1, '#29b6f6']]);
        ctx.fill();
        ctx.strokeStyle = '#01579b';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    } else {
      // flared emitter dish with a glowing core
      const r = o.wide ? 11 : 9;
      ctx.beginPath();
      ctx.moveTo(L - 9, -4);
      ctx.lineTo(L - 1, -r);
      ctx.quadraticCurveTo(L + 3, 0, L - 1, r);
      ctx.lineTo(L - 9, 4);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, -r, 0, r, [[0, '#e1f5fe'], [0.5, '#81d4fa'], [1, '#0277bd']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      glowRing(ctx, L + 1, 0, r, '#80d8ff', 0.75);
      D.ellipsePath(ctx, L, 0, 2.6, r * 0.75);
      ctx.fillStyle = D.rad(ctx, L, 0, 0.5, L, 0, r, [[0, '#ffffff'], [1, '#00b0ff']]);
      ctx.fill();
    }
    if (o.crystals) {
      // brittle ice crystals growing on the barrel
      [[4, -7, -0.5], [12, -7, -0.2], [9, 7, 2.8]].forEach(([cx, cy, r]) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(r);
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(0, -7);
        ctx.lineTo(2, 0);
        ctx.closePath();
        D.fs(ctx, '#e1f5fe', '#0288d1', 0.8);
        ctx.restore();
      });
    }
    ctx.restore();
  }

  function snowflakeIcon(ctx, x, y, r, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(0.8, r * 0.22);
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  P.freeze = function (ctx, t) {
    const [a, b, c] = t;
    if (a >= 4) glowRing(ctx, B.cx, B.cy - 4, 46, '#b3ecff', 0.7);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy, 44, '#00e5ff', 0.5);
    else if (b >= 4) glowRing(ctx, B.cx, B.cy, 44, '#4fc3f7', 0.5);
    else if (a >= 3) glowRing(ctx, B.cx, B.cy, 42, '#b3ecff', 0.55);
    // frozen ground under the feet
    const fr = a >= 2 ? 30 : a >= 1 ? 26 : 20;
    D.ellipsePath(ctx, B.cx, FOOT, fr, fr * 0.26);
    ctx.fillStyle = D.rad(ctx, B.cx - 6, FOOT - 2, 1, B.cx, FOOT, fr, [[0, 'rgba(255,255,255,0.95)'], [0.6, 'rgba(179,229,252,0.85)'], [1, 'rgba(129,212,250,0.25)']]);
    ctx.fill();
    if (a >= 1) {
      // little ice spikes poking out of the frost
      [[-24, 0], [-16, 3], [19, 2], [26, -1]].forEach(([dx, dy], i) => {
        const x = B.cx + dx * (fr / 30), y = FOOT + dy;
        ctx.beginPath();
        ctx.moveTo(x - 2.6, y);
        ctx.lineTo(x, y - 7 - (i % 2) * 3);
        ctx.lineTo(x + 2.6, y);
        ctx.closePath();
        D.fs(ctx, '#e1f5fe', '#0288d1', 0.8);
      });
    }
    if (a >= 3) {
      // swirling arctic wind
      ctx.strokeStyle = 'rgba(225,245,254,0.9)';
      ctx.lineWidth = 1.6;
      [[-1, 18], [1, 8]].forEach(([s, yy]) => {
        ctx.beginPath();
        ctx.arc(B.cx, B.cy + yy, 30, s > 0 ? -0.6 : Math.PI - 0.2, s > 0 ? 0.4 : Math.PI + 0.9);
        ctx.stroke();
      });
    }
    if (b >= 4) {
      // ice armour on the shoulders
      [-1, 1].forEach((s) => {
        D.blobPath(ctx, B.cx + s * 15, B.cy - 2, 8, 6, 0.25, D.rng(s + 5));
        ctx.fillStyle = D.lin(ctx, B.cx + s * 15 - 8, B.cy - 10, B.cx + s * 15 + 8, B.cy + 6, [[0, '#ffffff'], [1, '#4fc3f7']]);
        ctx.fill();
        ctx.strokeStyle = '#0277bd';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      });
    }
    const hatCol = a >= 3 ? '#1565c0' : c >= 3 ? '#00838f' : '#c62828';
    const scarf = a >= 3 ? '#e3f2fd' : '#e53935';
    // scarf tail fluttering behind
    ctx.beginPath();
    ctx.moveTo(B.cx - 12, B.cy - 1);
    ctx.quadraticCurveTo(B.cx - 24, B.cy - 6, B.cx - 32, B.cy + 2);
    ctx.lineTo(B.cx - 30, B.cy + 8);
    ctx.quadraticCurveTo(B.cx - 22, B.cy + 3, B.cx - 12, B.cy + 5);
    ctx.closePath();
    D.fs(ctx, scarf, OL, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(B.cx - 31, B.cy + 2, 4, 3);
    const o = {
      eyes: 2, hair: 'bald', mouth: 'o', seed: 41, lookX: 0.7, glove: '#4fc3f7',
      rim: c >= 1 ? '#80deea' : null,
      denim: a >= 3 ? { base: '#1976d2', light: '#64b5f6', dark: '#0d47a1', stitch: '#e3f2fd' } : null,
      arms: [
        { x0: B.cx - 13, y0: B.cy + 2, x1: B.cx + 1, y1: B.cy + 10, bend: [B.cx - 12, B.cy + 15] },
        { x0: B.cx + 13, y0: B.cy + 2, x1: B.cx + 14, y1: B.cy + 8, bend: [B.cx + 17, B.cy + 4] },
      ],
      face: (c2, cx, cy, w, h) => {
        // rosy cold cheeks
        [-1, 1].forEach((s) => {
          D.ellipsePath(c2, cx + s * w * 0.3, cy + h * 0.02, 2.8, 1.6);
          D.fs(c2, 'rgba(255,110,110,0.45)');
        });
      },
    };
    if (c >= 2) {
      o.outfit = (c2, cx, cy, w, h) => {
        // belt of cryo canisters
        c2.fillStyle = '#455a64';
        c2.fillRect(cx - w, cy + h * 0.24, w * 2, h * 0.06);
        for (let i = 0; i < 3; i++) {
          D.rrPath(c2, cx - w * 0.36 + i * w * 0.28, cy + h * 0.2, w * 0.12, h * 0.13, 1.5);
          D.fs(c2, '#4fc3f7', OL, 0.6);
        }
      };
    }
    // the ray is drawn between the body and the arms
    const arms = o.arms;
    o.arms = [];
    o.after = (c2) => {
      // thick scarf wrapped round the neck
      c2.save();
      D.capsulePath(c2, B.cx, B.cy, B.w, B.h);
      c2.clip();
      c2.fillStyle = scarf;
      c2.fillRect(B.cx - 20, B.cy - 2, 40, 6);
      c2.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 5; i++) c2.fillRect(B.cx - 14 + i * 7, B.cy - 2, 2.4, 6);
      c2.restore();
      c2.strokeStyle = OL;
      c2.lineWidth = 1;
      c2.strokeRect(B.cx - 15, B.cy - 2, 30, 6);
      freezeRay(c2, B.cx + 2, B.cy + 9, {
        big: c >= 3 || a >= 2, coils: b >= 1, wide: b >= 2, crystals: b >= 3, cannon: c >= 3, icicle: c >= 4,
      });
      arms.forEach((ar) => D.limb(c2, ar.x0, ar.y0, ar.x1, ar.y1, B.w * 0.14, '#ffd83a', { bend: ar.bend, lw: 1.5, gloveColor: '#4fc3f7' }));
    };
    baseMinion(ctx, o);
    if (a >= 3) {
      // parka hood with a fur trim round the face
      ctx.save();
      ctx.beginPath();
      ctx.arc(B.cx, B.cy - 6, 19, Math.PI * 1.02, Math.PI * 1.98);
      ctx.lineCap = 'round';
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#f5f5f5';
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = OL;
      ctx.stroke();
      ctx.restore();
      const rnd = D.rng(6);
      for (let i = 0; i < 10; i++) {
        const an = Math.PI * (1.05 + i * 0.09);
        D.circlePath(ctx, B.cx + Math.cos(an) * 19, B.cy - 6 + Math.sin(an) * 19, 2.6 + rnd());
        D.fs(ctx, '#ffffff');
      }
    }
    // trapper hat: knitted crown, fluffy brim and ear flaps
    const top = B.cy - 23;
    [-1, 1].forEach((s) => {
      D.rrPath(ctx, B.cx + s * 15.5 - 3.5, top + 4, 7, 15, 3.5);
      D.fs(ctx, '#fafafa', OL, 1);
    });
    ctx.beginPath();
    ctx.arc(B.cx, top + 4, 15.5, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, B.cx - 16, 0, B.cx + 16, 0, [[0, D.shade(hatCol, 0.3)], [0.5, hatCol], [1, D.shade(hatCol, -0.35)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    snowflakeIcon(ctx, B.cx - 6, top - 3, 3, 'rgba(255,255,255,0.9)');
    snowflakeIcon(ctx, B.cx + 6, top - 4, 3, 'rgba(255,255,255,0.9)');
    ctx.restore();
    D.rrPath(ctx, B.cx - 16.5, top + 1, 33, 7, 3.5);
    D.fs(ctx, '#fafafa', OL, 1.1);
    D.circlePath(ctx, B.cx, top - 12, 4.6);
    D.fs(ctx, '#ffffff', OL, 1.1);
    // cold breath
    const rnd = D.rng(4);
    for (let i = 0; i < 3; i++) {
      D.blobPath(ctx, B.cx + 15 + i * 4, B.cy - 2 - i * 3, 2.6 - i * 0.4, 6, 0.3, rnd);
      D.fs(ctx, 'rgba(255,255,255,0.85)', 'rgba(120,144,156,0.6)', 0.6);
    }
    if (a >= 4) {
      // a little snow cloud follows it around
      const crnd = D.rng(12);
      for (let i = 0; i < 4; i++) {
        D.blobPath(ctx, B.cx - 12 + i * 8, 8 + (i % 2) * 2, 6, 7, 0.25, crnd);
        D.fs(ctx, '#eceff1', OL, 0.9);
      }
      [[B.cx - 10, 20], [B.cx + 2, 23], [B.cx + 13, 19]].forEach(([x, y]) => snowflakeIcon(ctx, x, y, 2.4, '#ffffff'));
    }
  };

  P.jelly = function (ctx, t) {
    const [a, b, c] = t;
    const jelly = a >= 1 ? (a >= 3 ? '#76ff03' : '#b2ff59') : '#ff4f7b';
    if (b >= 4) glowRing(ctx, B.cx, B.cy, 40, jelly, 0.45);
    const o = {
      eyes: 1, hair: 'spiky', mouth: 'smile', seed: 51, w: 31, h: 44, y: B.cy - 1, lookX: 0.8,
      arms: [
        { x0: B.cx - 13, y0: B.cy + 2, x1: B.cx + 1, y1: B.cy + 10, bend: [B.cx - 12, B.cy + 14] },
        { x0: B.cx + 13, y0: B.cy + 2, x1: B.cx + 15, y1: B.cy + 6 },
      ],
      outfit: (ctx2, cx, cy, w, h) => {
        const rnd = D.rng(9);
        for (let i = 0; i < 3; i++) {
          D.blobPath(ctx2, cx - w * 0.3 + rnd() * w * 0.6, cy + h * 0.25 + rnd() * h * 0.2, 2.4, 6, 0.4, rnd);
          D.fs(ctx2, D.rgba(jelly, 0.9));
        }
      },
    };
    if (b >= 3) {
      // backpack tank (drawn behind)
      ctx.save();
      D.rrPath(ctx, B.cx - 24, B.cy - 12, 12, 26, 5);
      ctx.fillStyle = D.lin(ctx, B.cx - 24, 0, B.cx - 12, 0, [[0, D.shade(jelly, 0.3)], [1, D.shade(jelly, -0.3)]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
    baseMinion(ctx, o);
    const gx = B.cx + 4, gy = B.cy + 8;
    const big = c >= 3;
    ctx.save();
    ctx.translate(gx, gy);
    D.rrPath(ctx, -6, -4, big ? 26 : 22, 8, 3);
    D.fs(ctx, '#5c6bc0', OL, 1.2);
    D.rrPath(ctx, big ? 14 : 12, -2.5, 10, 5, 2);
    D.fs(ctx, '#3949ab', OL, 1.1);
    // jelly tank on top
    D.ellipsePath(ctx, 4, -9, big ? 8 : 6.5, big ? 7 : 5.5);
    ctx.fillStyle = D.rad(ctx, 2, -11, 1, 4, -9, 8, [[0, '#ffffff'], [0.3, D.shade(jelly, 0.3)], [1, D.shade(jelly, -0.25)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    if (b >= 3) {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(B.cx - 16, B.cy + 6);
      ctx.quadraticCurveTo(B.cx - 4, B.cy + 26, B.cx + 6, B.cy + 12);
      ctx.stroke();
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    if (c >= 4) helmet(ctx, B.cx, B.cy - 31, B.w, '#ec407a');
  };

  P.sniper = function (ctx, t) {
    const [a, b, c] = t;
    const o = {
      eyes: 2, hair: 'bald', mouth: 'flat', seed: 61, lookX: 0.9, lid: 0.15, lidDepth: 0.75,
      rim: b >= 1 ? '#7cb342' : null,
      arms: [
        { x0: B.cx - 13, y0: B.cy + 2, x1: B.cx + 2, y1: B.cy + 3, bend: [B.cx - 12, B.cy + 12] },
        { x0: B.cx + 13, y0: B.cy + 2, x1: B.cx + 16, y1: B.cy - 1 },
      ],
    };
    const arms = o.arms;
    o.arms = [];
    o.after = (ctx2) => {
      rifle(ctx2);
      arms.forEach((ar) => D.limb(ctx2, ar.x0, ar.y0, ar.x1, ar.y1, B.w * 0.14, '#ffd83a', { bend: ar.bend, lw: 1.5 }));
    };
    function rifle(ctx2) {
      ctx2.save();
      ctx2.translate(B.cx - 8, B.cy + 2);
      ctx2.rotate(-0.16);
      const body = a >= 3 ? '#263238' : '#37474f';
      D.rrPath(ctx2, -8, -3.5, 26, 7, 2.5);
      D.fs(ctx2, '#6d4c41', OL, 1.2);
      D.rrPath(ctx2, 12, -3, a >= 2 ? 32 : 28, 5, 2);
      D.fs(ctx2, body, OL, 1.2);
      // emitter
      D.circlePath(ctx2, a >= 2 ? 44 : 40, -0.5, 2.6);
      D.fs(ctx2, '#ff1744', OL, 1);
      // scope
      D.rrPath(ctx2, 8, -9, 14, 4.5, 2);
      D.fs(ctx2, a >= 3 ? '#ffca28' : '#455a64', OL, 1);
      if (c >= 3) {
        D.rrPath(ctx2, 14, 2, 7, 8, 2);
        D.fs(ctx2, '#455a64', OL, 1);
      }
      ctx2.restore();
    }
    baseMinion(ctx, o);
    helmet(ctx, B.cx, B.cy - 31, B.w, '#7a8b45', { camo: true });
    sandbags(ctx, B.cx, FOOT - 3);
  };

  P.farm = function (ctx, t) {
    const [a, b, c] = t;
    D.shadow(ctx, 42, 70, 40, 12, 0.25);
    // soil patch
    D.rrPath(ctx, 4, 40, 76, 38, 10);
    ctx.fillStyle = D.lin(ctx, 0, 40, 0, 78, [[0, '#9b6b3d'], [1, '#6e4524']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,10,0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(10, 48 + i * 8);
      ctx.lineTo(74, 48 + i * 8);
      ctx.stroke();
    }
    // fence
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    for (let x = 6; x <= 78; x += 9) {
      D.rrPath(ctx, x - 1.6, 70, 3.2, 10, 1);
      D.fs(ctx, '#d7b27a', OL, 0.8);
    }
    D.rrPath(ctx, 4, 73, 76, 2.6, 1);
    D.fs(ctx, '#c49a5e', OL, 0.8);
    const trees = 2 + Math.min(2, a);
    const golden = b >= 3;
    const spots = [[22, 46], [62, 46], [42, 38], [10, 56]].slice(0, trees);
    spots.forEach(([x, y], i) => bananaTree(ctx, x, y, 0.85 + (i === 2 ? 0.1 : 0), golden, i));
    if (a >= 3) {
      // little barn
      ctx.save();
      ctx.translate(66, 58);
      D.rrPath(ctx, -10, -8, 20, 16, 2);
      D.fs(ctx, '#c62828', OL, 1.2);
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.lineTo(0, -17);
      ctx.lineTo(12, -8);
      ctx.closePath();
      D.fs(ctx, '#8d2a1a', OL, 1.2);
      D.rrPath(ctx, -4, -1, 8, 9, 1);
      D.fs(ctx, '#fff3e0', OL, 1);
      ctx.restore();
    }
    // farmer minion
    M.draw(ctx, {
      x: 34, y: 54, w: 18, h: 25, eyes: 2, hair: 'bald', mouth: 'smile', seed: 71, lw: 1,
      arms: [{ x0: 26, y0: 55, x1: 23, y1: 62 }, { x0: 42, y0: 55, x1: 47, y1: 50 }],
    });
    strawHat(ctx, 34, 40, 18);
    if (c >= 1) {
      // basket of bananas
      D.rrPath(ctx, 48, 60, 14, 9, 3);
      D.fs(ctx, '#a1887f', OL, 1);
      banana(ctx, 52, 60, 0.4, -0.3, golden ? '#ffc400' : '#ffe14a');
      banana(ctx, 57, 59, 0.4, 0.3, golden ? '#ffc400' : '#ffe14a');
    }
    if (c >= 3) {
      D.circlePath(ctx, 74, 32, 7);
      D.fs(ctx, '#ffd54f', OL, 1.2);
      MT.text && 0;
      ctx.fillStyle = OL;
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 74, 32.5);
    }
  };

  function bananaTree(ctx, x, y, s, golden, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // trunk
    D.rrPath(ctx, -2.5, -4, 5, 18, 2);
    D.fs(ctx, '#7c5a2e', OL, 1);
    // leaves
    const rnd = D.rng(seed + 5);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.55 + (rnd() - 0.5) * 0.2;
      ctx.save();
      ctx.translate(0, -4);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, -6, 20, 0);
      ctx.quadraticCurveTo(10, 6, 0, 0);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, -6, 0, 6, [[0, '#7ed957'], [1, '#2e8b2e']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(20,70,20,0.6)';
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.lineTo(19, 0);
      ctx.stroke();
      ctx.restore();
    }
    const col = golden ? '#ffc400' : '#ffe14a';
    for (let i = 0; i < 3; i++) banana(ctx, -2 + i * 2, 1 + i * 2.5, 0.38, 1.2, col);
    ctx.restore();
  }

  P.lab = function (ctx, t) {
    const [a, b, c] = t;
    D.shadow(ctx, 42, 74, 36, 10, 0.3);
    // platform
    D.ellipsePath(ctx, 42, 68, 34, 11);
    ctx.fillStyle = D.lin(ctx, 0, 57, 0, 79, [[0, '#b0bec5'], [1, '#546e7a']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // hazard stripe ring
    ctx.save();
    D.ellipsePath(ctx, 42, 66, 30, 8.5);
    ctx.clip();
    for (let i = -10; i < 12; i++) {
      ctx.fillStyle = i % 2 ? '#ffca28' : '#263238';
      ctx.beginPath();
      ctx.moveTo(i * 7, 56);
      ctx.lineTo(i * 7 + 7, 56);
      ctx.lineTo(i * 7 - 3, 80);
      ctx.lineTo(i * 7 - 10, 80);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    D.ellipsePath(ctx, 42, 64, 25, 6.5);
    D.fs(ctx, '#78909c', OL, 1);
    // building
    D.rrPath(ctx, 20, 36, 44, 28, 4);
    ctx.fillStyle = D.lin(ctx, 20, 0, 64, 0, [[0, '#cfd8dc'], [0.5, '#90a4ae'], [1, '#546e7a']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // dome
    ctx.beginPath();
    ctx.arc(42, 38, 19, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, 36, 26, 2, 42, 38, 20, [[0, '#ffffff'], [0.4, b >= 3 ? '#ffe082' : '#b3e5fc'], [1, b >= 3 ? '#c79100' : '#4f8fc0']]);
    ctx.fill();
    ctx.stroke();
    // door / vault
    if (b >= 3) {
      D.circlePath(ctx, 42, 52, 8);
      D.fs(ctx, '#b0bec5', OL, 1.2);
      D.circlePath(ctx, 42, 52, 5);
      D.fs(ctx, '#78909c', OL, 1);
      for (let i = 0; i < 6; i++) {
        const an = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(42, 52);
        ctx.lineTo(42 + Math.cos(an) * 5, 52 + Math.sin(an) * 5);
        ctx.strokeStyle = OL;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    } else {
      D.rrPath(ctx, 35, 46, 14, 18, 3);
      D.fs(ctx, '#37474f', OL, 1.2);
      ctx.fillStyle = '#ffd83a';
      ctx.fillRect(36.5, 54, 11, 2);
    }
    // G logo plate
    D.circlePath(ctx, 27, 46, 5);
    D.fs(ctx, '#212121', OL, 1);
    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(27, 46, 2.6, Math.PI * 0.15, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(27, 46);
    ctx.lineTo(29.5, 46);
    ctx.stroke();
    // windows
    D.circlePath(ctx, 57, 46, 3.5);
    D.fs(ctx, '#80deea', OL, 1);
    // antenna
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(42, 19);
    ctx.lineTo(42, 8);
    ctx.stroke();
    D.circlePath(ctx, 42, 7, 3);
    D.fs(ctx, '#ff1744', OL, 1);
    glowRing(ctx, 42, 7, 7, '#ff1744', 0.5);
    if (a >= 1) {
      // satellite dish
      ctx.save();
      ctx.translate(60, 30);
      ctx.rotate(-0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI);
      ctx.closePath();
      D.fs(ctx, '#eceff1', OL, 1.2);
      ctx.strokeStyle = OL;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 6);
      ctx.stroke();
      ctx.restore();
    }
    if (c >= 1) {
      // radar
      ctx.save();
      ctx.translate(24, 30);
      D.ellipsePath(ctx, 0, 0, 7, 3);
      D.fs(ctx, '#66bb6a', OL, 1.1);
      ctx.restore();
    }
    if (c >= 3) {
      // turret
      D.rrPath(ctx, 49, 24, 18, 6, 3);
      D.fs(ctx, '#455a64', OL, 1.1);
      D.circlePath(ctx, 67, 27, 2.5);
      D.fs(ctx, c >= 4 ? '#e040fb' : '#ff1744', OL, 0.8);
    }
    if (a >= 2) {
      // bubbling tube
      D.rrPath(ctx, 66, 44, 8, 18, 4);
      ctx.fillStyle = D.lin(ctx, 66, 0, 74, 0, [[0, '#b9f6ca'], [1, '#00c853']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  };

  P.super = function (ctx, t) {
    const [a, b, c] = t;
    let suit = '#1e5bd8', capeCol = '#e53935';
    if (a >= 2) { suit = '#00acc1'; capeCol = '#7e57c2'; }
    if (a >= 3) { suit = '#ffb300'; capeCol = '#fff176'; }
    if (c >= 3) { suit = '#263238'; capeCol = '#4a148c'; }
    if (a >= 3) glowRing(ctx, B.cx, B.cy - 4, 44, '#ffeb3b', 0.65);
    else if (c >= 3) glowRing(ctx, B.cx, B.cy - 4, 42, '#7c4dff', 0.45);
    D.shadow(ctx, B.cx, FOOT + 2, 13, 4, 0.22);
    const hover = -6;
    cape(ctx, B.cx, B.cy + hover, B.w, B.h, capeCol);
    const den = { base: suit, light: D.shade(suit, 0.35), dark: D.shade(suit, -0.4), stitch: '#ffd166' };
    const o = {
      x: B.cx, y: B.cy + hover, w: B.w, h: B.h,
      eyes: 2, hair: 'bald', mouth: 'grin', seed: 81, denim: den, noLogo: true,
      rim: a >= 1 ? '#ff8a80' : null,
      arms: [
        { x0: B.cx - 13, y0: B.cy + hover + 1, x1: B.cx - 20, y1: B.cy + hover - 22, bend: [B.cx - 21, B.cy + hover - 6] },
        { x0: B.cx + 13, y0: B.cy + hover + 1, x1: B.cx + 19, y1: B.cy + hover + 10 },
      ],
      outfit: (ctx2, cx, cy, w, h) => {
        // big S badge
        D.starPath(ctx2, cx, cy + h * 0.17, 5, w * 0.14, w * 0.065);
        D.fs(ctx2, a >= 3 ? '#ff6f00' : '#ffd83a', OL, 0.8);
      },
      after: (ctx2, cx, cy, w, h) => {
        if (b >= 3) {
          D.rrPath(ctx2, cx + 12, cy + 1, 10, 12, 3);
          D.fs(ctx2, '#90a4ae', OL, 1.1);
        }
      },
    };
    if (a >= 1) {
      o.lookX = 0;
    }
    M.draw(ctx, o);
  };

  // ---------- Gru (hero) ----------
  function gru(ctx, level) {
    const cx = 45;
    // stage 10: the full super-villain cape
    if (level >= 10) cape(ctx, cx, 58, 34, 62, '#1c3f7a');
    const coat = '#2b2d33';
    // legs
    for (const s of [-1, 1]) {
      D.rrPath(ctx, cx + s * 7 - 3, 80, 6, 18, 2);
      D.fs(ctx, '#1d1e22', OL, 1.2);
      D.ellipsePath(ctx, cx + s * 9, 99, 7, 3.2);
      D.fs(ctx, '#111', OL, 1.1);
    }
    // coat body
    ctx.beginPath();
    ctx.moveTo(cx - 20, 50);
    ctx.quadraticCurveTo(cx - 25, 70, cx - 18, 86);
    ctx.lineTo(cx + 18, 86);
    ctx.quadraticCurveTo(cx + 25, 70, cx + 20, 50);
    ctx.quadraticCurveTo(cx, 44, cx - 20, 50);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 25, 0, cx + 25, 0, [[0, '#4a4d57'], [0.45, coat], [1, '#121317']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + 2, 54);
    ctx.lineTo(cx + 2, 86);
    ctx.stroke();
    // left arm (down)
    D.limb(ctx, cx - 18, 54, cx - 22, 76, 7, '#2b2d33', { lw: 1.4, gloveColor: '#f1d1b0' });
    // scarf
    D.ellipsePath(ctx, cx, 48, 16, 6);
    ctx.save();
    ctx.fillStyle = '#5f6168';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#26272b';
    for (let i = -16; i < 16; i += 5) ctx.fillRect(cx + i, 40, 2.5, 16);
    ctx.restore();
    D.ellipsePath(ctx, cx, 48, 16, 6);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // scarf end
    ctx.save();
    D.rrPath(ctx, cx - 11, 50, 7, 20, 2);
    ctx.fillStyle = '#5f6168';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#26272b';
    for (let y = 50; y < 72; y += 5) ctx.fillRect(cx - 12, y, 9, 2.5);
    ctx.restore();
    D.rrPath(ctx, cx - 11, 50, 7, 20, 2);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // head
    const skin = '#f2d2b0';
    D.ellipsePath(ctx, cx - 16.5, 27, 3, 4.5);
    D.fs(ctx, '#e7bf98', OL, 1.1);
    D.ellipsePath(ctx, cx + 16.5, 27, 3, 4.5);
    D.fs(ctx, '#e7bf98', OL, 1.1);
    ctx.beginPath();
    ctx.moveTo(cx - 16, 24);
    ctx.bezierCurveTo(cx - 18, 6, cx + 18, 6, cx + 16, 24);
    ctx.bezierCurveTo(cx + 16, 38, cx + 8, 45, cx, 45);
    ctx.bezierCurveTo(cx - 8, 45, cx - 16, 38, cx - 16, 24);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, cx - 6, 14, 2, cx, 26, 22, [[0, '#fff1e2'], [0.5, skin], [1, '#d9a982']]);
    ctx.fill();
    // stubble
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(80,80,90,0.22)';
    D.ellipsePath(ctx, cx, 42, 13, 8);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(cx - 16, 24);
    ctx.bezierCurveTo(cx - 18, 6, cx + 18, 6, cx + 16, 24);
    ctx.bezierCurveTo(cx + 16, 38, cx + 8, 45, cx, 45);
    ctx.bezierCurveTo(cx - 8, 45, cx - 16, 38, cx - 16, 24);
    ctx.closePath();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // head shine
    D.ellipsePath(ctx, cx - 6, 13, 5, 2.5, -0.3);
    D.fs(ctx, 'rgba(255,255,255,0.6)');
    // eyes with heavy lids
    for (const s of [-1, 1]) {
      const ex = cx + s * 6.5, ey = 25;
      D.ellipsePath(ctx, ex, ey, 3.6, 2.8);
      D.fs(ctx, '#ffffff', OL, 0.9);
      D.circlePath(ctx, ex + 0.8, ey + 0.4, 1.5);
      D.fs(ctx, '#1a1a1a');
      ctx.save();
      D.ellipsePath(ctx, ex, ey, 3.6, 2.8);
      ctx.clip();
      ctx.fillStyle = '#e2b48c';
      ctx.fillRect(ex - 4, ey - 4, 8, 3.2);
      ctx.restore();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(ex - 3.8, ey - 0.6);
      ctx.lineTo(ex + 3.8, ey - 0.9);
      ctx.stroke();
      // bags
      ctx.strokeStyle = 'rgba(120,70,50,0.6)';
      ctx.beginPath();
      ctx.arc(ex, ey + 2.5, 3, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      // brow
      ctx.strokeStyle = '#3b2c22';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ex - 3.5 * s * -1 - (s > 0 ? 0 : 0), ey - 4.5);
      ctx.lineTo(ex + 3.5 * s, ey - 5.6 + s * 0.4);
      ctx.stroke();
    }
    // the famous nose
    ctx.beginPath();
    ctx.moveTo(cx - 3, 24);
    ctx.quadraticCurveTo(cx - 5.5, 36, cx + 1, 42);
    ctx.quadraticCurveTo(cx + 5.5, 35, cx + 3, 24);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 5, 0, cx + 5, 0, [[0, '#f8dcc0'], [1, '#d39c74']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // smirk
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - 7, 40);
    ctx.quadraticCurveTo(cx + 2, 43, cx + 8, 38.5);
    ctx.stroke();
    // right arm holding the freeze ray
    D.limb(ctx, cx + 18, 54, cx + 24, 66, 7, '#2b2d33', { lw: 1.4, gloveColor: '#f1d1b0', bend: [cx + 26, 58] });
    const big = level >= 5;
    ctx.save();
    ctx.translate(cx + 22, 64);
    D.rrPath(ctx, -4, -5, big ? 22 : 18, 10, 4);
    ctx.fillStyle = D.lin(ctx, 0, -5, 0, 5, [[0, '#e3f2fd'], [1, '#78909c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#00b0ff';
      ctx.fillRect(i * 4, -5, 2, 10);
    }
    const ex = big ? 19 : 15;
    ctx.beginPath();
    ctx.moveTo(ex, -4);
    ctx.lineTo(ex + 7, -8);
    ctx.lineTo(ex + 7, 8);
    ctx.lineTo(ex, 4);
    ctx.closePath();
    ctx.fillStyle = '#90caf9';
    ctx.fill();
    ctx.stroke();
    D.circlePath(ctx, ex + 7, 0, 3.4);
    ctx.fillStyle = D.rad(ctx, ex + 7, 0, 0.5, ex + 7, 0, 4, [[0, '#ffffff'], [1, '#00b0ff']]);
    ctx.fill();
    if (big) {
      D.rrPath(ctx, 2, -12, 10, 7, 3);
      ctx.fillStyle = D.lin(ctx, 0, -12, 0, -5, [[0, '#e1f5fe'], [1, '#4fc3f7']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      D.circlePath(ctx, 5, -10, 1.2);
      D.fs(ctx, '#ffffff');
    }
    if (level >= 10) {
      // charged coils along the barrel
      glowRing(ctx, ex + 6, 0, 6, '#80d8ff', 0.9);
      for (let i = 0; i < 3; i++) {
        D.circlePath(ctx, 1 + i * 4, 0, 1.3);
        D.fs(ctx, '#e1f5fe');
      }
    }
    ctx.restore();
  }

  // ---------- public API ----------
  MT.TowerArt = {
    TW, TH, FOOT,
    // texture key for a tower with given tiers, created lazily
    key(scene, type, tiers) {
      const t = tiers || [0, 0, 0];
      const key = `tw_${type}_${t.join('')}`;
      if (!scene.textures.exists(key)) {
        D.make(scene, key, TW, TH, (ctx) => P[type](ctx, t));
      }
      return key;
    },
    originY(type) {
      return type === 'gru' ? 102 / 110 : FOOT / TH;
    },
    props: { banana, bananaBall, helmet, beanie, cape, glowRing, bananaTree, strawHat },
    gru,
    painters: P,
  };
})();
