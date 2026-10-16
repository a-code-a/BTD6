// Artwork for the five newer minions (Ninja, Catapult, Alchemist, Fireman,
// Vampire): every tower sprite evolves with its upgrades and faces right with
// its weapon in front, like the rest. Also: a right-facing Super Minion pose,
// the projectiles, effect sprites and ability badges these towers use.
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;
  const TAU = Math.PI * 2;
  const TA = MT.TowerArt;
  const P = TA.painters;
  const { glowRing, helmet, banana, crown } = TA.props;
  const B = { cx: 42, cy: 49, w: 30, h: 42 };
  const FOOT = 76;
  const YEL = '#ffd83a';

  function baseMinion(ctx, o) {
    D.shadow(ctx, B.cx, FOOT, 17, 5.5);
    M.draw(ctx, Object.assign({ x: B.cx, y: B.cy, w: B.w, h: B.h }, o));
  }
  const arm = (ctx, x0, y0, x1, y1, bend, col, t) => D.limb(ctx, x0, y0, x1, y1, t || B.w * 0.14, col || YEL, { bend, lw: 1.5 });

  // ================================================================ props
  function shuriken(ctx, x, y, r, rot, gold) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    D.starPath(ctx, 0, 0, 4, r, r * 0.34, -Math.PI / 2);
    ctx.fillStyle = gold
      ? D.lin(ctx, -r, -r, r, r, [[0, '#fff8c4'], [0.5, '#ffc400'], [1, '#a66a00']])
      : D.lin(ctx, -r, -r, r, r, [[0, '#ffffff'], [0.5, '#b0bec5'], [1, '#4f5f68']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = Math.max(0.8, r * 0.13);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = Math.max(0.5, r * 0.07);
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
      ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
      ctx.stroke();
    }
    D.circlePath(ctx, 0, 0, r * 0.24);
    D.fs(ctx, gold ? '#fff59d' : YEL, OL, Math.max(0.6, r * 0.08));
    ctx.restore();
  }

  // cartoon bat seen from the front: wings spread, little fangs
  function bat(ctx, x, y, s, rot, o = {}) {
    const body = o.body || '#3b2a4f';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.scale(s, s);
    const wing = [[1.5, -3], [6, -8], [11, -8.5], [15, -5], [13, -2], [13.5, 2.5], [10, 0.5], [8.5, 4], [5.5, 1.5], [3, 4]];
    ctx.beginPath();
    ctx.moveTo(0, -3);
    wing.forEach(([px, py]) => ctx.lineTo(px, py));
    ctx.lineTo(0, 5);
    for (let i = wing.length - 1; i >= 0; i--) ctx.lineTo(-wing[i][0], wing[i][1]);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -9, 0, 5, [[0, D.shade(body, 0.35)], [1, D.shade(body, -0.35)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // wing bones
    ctx.strokeStyle = D.rgba('#000000', 0.35);
    ctx.lineWidth = 0.7;
    [-1, 1].forEach((k) => {
      [[11, -8.5], [13.5, 2.5], [8.5, 4]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(k * 2, -2);
        ctx.lineTo(k * px * 0.85, py * 0.85);
        ctx.stroke();
      });
    });
    // body + ears
    ctx.beginPath();
    ctx.moveTo(-3, -4);
    ctx.lineTo(-3.4, -8.5);
    ctx.lineTo(-1, -5.5);
    ctx.lineTo(1, -5.5);
    ctx.lineTo(3.4, -8.5);
    ctx.lineTo(3, -4);
    ctx.closePath();
    D.fs(ctx, body, OL, 0.9);
    D.ellipsePath(ctx, 0, 0, 3.6, 4.6);
    D.fs(ctx, D.shade(body, 0.12), OL, 1);
    [-1.4, 1.4].forEach((ex) => {
      D.circlePath(ctx, ex, -1.2, 0.95);
      D.fs(ctx, o.eye || '#ff1744');
    });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-1, 1.6);
    ctx.lineTo(-0.5, 3);
    ctx.lineTo(0, 1.6);
    ctx.moveTo(0, 1.6);
    ctx.lineTo(0.5, 3);
    ctx.lineTo(1, 1.6);
    ctx.fill();
    ctx.restore();
  }

  // round-bottom potion flask
  function flask(ctx, x, y, s, liquid, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.rot || 0);
    ctx.scale(s, s);
    if (o.glow) glowRing(ctx, 0, 2, 13, liquid, 0.75);
    D.rrPath(ctx, -2.2, -9, 4.4, 7, 1);
    D.fs(ctx, 'rgba(225,245,255,0.92)', OL, 0.9);
    D.circlePath(ctx, 0, 2, 6);
    ctx.fillStyle = 'rgba(225,245,255,0.88)';
    ctx.fill();
    ctx.save();
    D.circlePath(ctx, 0, 2, 6);
    ctx.clip();
    ctx.fillStyle = D.lin(ctx, 0, -1, 0, 8, [[0, D.shade(liquid, 0.4)], [1, D.shade(liquid, -0.3)]]);
    ctx.fillRect(-7, -0.5, 14, 10);
    D.circlePath(ctx, -2, 3, 1.1);
    D.fs(ctx, 'rgba(255,255,255,0.75)');
    D.circlePath(ctx, 2, 5, 0.7);
    D.fs(ctx, 'rgba(255,255,255,0.75)');
    ctx.restore();
    D.circlePath(ctx, 0, 2, 6);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, 2, 4.2, Math.PI * 1.1, Math.PI * 1.45);
    ctx.stroke();
    D.rrPath(ctx, -2.7, -11.5, 5.4, 3, 1);
    D.fs(ctx, '#a1887f', OL, 0.8);
    ctx.restore();
  }

  function vial(ctx, x, y, col) {
    D.rrPath(ctx, x - 1.6, y - 4, 3.2, 7, 1.5);
    ctx.fillStyle = D.lin(ctx, x - 2, 0, x + 2, 0, [[0, D.shade(col, 0.4)], [1, D.shade(col, -0.3)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    D.rrPath(ctx, x - 1.8, y - 5.4, 3.6, 1.8, 0.6);
    D.fs(ctx, '#8d6e63', OL, 0.5);
  }

  function cauldron(ctx, x, y, s, brew) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    D.ellipsePath(ctx, 0, 1, 10, 8.5);
    ctx.fillStyle = D.lin(ctx, -10, 0, 10, 0, [[0, '#616161'], [0.45, '#2e2e2e'], [1, '#111111']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    D.ellipsePath(ctx, 0, -5, 9.5, 3);
    D.fs(ctx, '#212121', OL, 1.1);
    D.ellipsePath(ctx, 0, -5, 8, 2.2);
    ctx.fillStyle = D.rad(ctx, -2, -6, 0, 0, -5, 8, [[0, '#ffffff'], [0.3, D.shade(brew, 0.3)], [1, brew]]);
    ctx.fill();
    [[-3, -8, 2], [2, -10, 1.5], [4.5, -7.5, 1.2]].forEach(([bx, by, br]) => {
      D.circlePath(ctx, bx, by, br);
      D.fs(ctx, D.rgba(D.shade(brew, 0.25), 0.9), OL, 0.6);
    });
    [-7, 7].forEach((lx) => {
      D.rrPath(ctx, lx - 1.2, 7, 2.4, 3, 0.8);
      D.fs(ctx, '#212121', OL, 0.7);
    });
    ctx.restore();
  }

  function wheel(ctx, x, y, r) {
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.3, y - r * 0.3, 0, x, y, r, [[0, '#bc8a5f'], [1, '#6d4325']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = '#4e2e16';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85);
      ctx.lineTo(x - Math.cos(a) * r * 0.85, y - Math.sin(a) * r * 0.85);
      ctx.stroke();
    }
    D.circlePath(ctx, x, y, r * 0.28);
    D.fs(ctx, '#90a4ae', OL, 0.8);
  }

  function woodBeam(ctx, x0, y0, x1, y1, w) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = OL;
    ctx.lineWidth = w + 2.4;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = '#9c6b3f';
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,190,0.45)';
    ctx.lineWidth = w * 0.3;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - w * 0.2);
    ctx.lineTo(x1, y1 - w * 0.2);
    ctx.stroke();
    ctx.restore();
  }

  // the things a catapult can throw
  function rock(ctx, x, y, r, seed) {
    D.blobPath(ctx, x, y, r, 9, 0.12, D.rng(seed || 3));
    ctx.fillStyle = D.rad(ctx, x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1, [[0, '#d7d2cc'], [0.5, '#9e968e'], [1, '#5d554f']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,50,40,0.5)';
    ctx.lineWidth = Math.max(0.6, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y - r * 0.1);
    ctx.lineTo(x + r * 0.05, y + r * 0.2);
    ctx.lineTo(x + r * 0.4, y + r * 0.05);
    ctx.stroke();
  }
  function melon(ctx, x, y, r) {
    D.ellipsePath(ctx, x, y, r * 1.15, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.4, y - r * 0.4, 0, x, y, r * 1.2, [[0, '#a5d66b'], [1, '#2e7d32']]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = r * 0.22;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * r * 0.45, y - r);
      ctx.quadraticCurveTo(x + i * r * 0.6, y, x + i * r * 0.45, y + r);
      ctx.stroke();
    }
    ctx.restore();
    D.ellipsePath(ctx, x, y, r * 1.15, r);
    ctx.strokeStyle = OL;
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.stroke();
    D.ellipsePath(ctx, x - r * 0.4, y - r * 0.45, r * 0.3, r * 0.15, -0.4);
    D.fs(ctx, 'rgba(255,255,255,0.5)');
  }
  function ironBall(ctx, x, y, r) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a - 0.22) * r * 0.9, y + Math.sin(a - 0.22) * r * 0.9);
      ctx.lineTo(x + Math.cos(a) * r * 1.45, y + Math.sin(a) * r * 1.45);
      ctx.lineTo(x + Math.cos(a + 0.22) * r * 0.9, y + Math.sin(a + 0.22) * r * 0.9);
      ctx.closePath();
      D.fs(ctx, '#b0bec5', OL, Math.max(0.7, r * 0.08));
    }
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.4, y - r * 0.4, 0, x, y, r, [[0, '#cfd8dc'], [0.5, '#546e7a'], [1, '#1c262b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.stroke();
  }
  function colossal(ctx, x, y, r) {
    rock(ctx, x, y, r, 11);
    ctx.save();
    D.blobPath(ctx, x, y, r, 9, 0.12, D.rng(11));
    ctx.clip();
    ctx.strokeStyle = '#ffc400';
    ctx.lineWidth = r * 0.18;
    ctx.beginPath();
    ctx.moveTo(x - r, y + r * 0.1);
    ctx.quadraticCurveTo(x, y + r * 0.45, x + r, y + r * 0.1);
    ctx.stroke();
    ctx.strokeStyle = OL;
    ctx.lineWidth = r * 0.05;
    ctx.stroke();
    D.blobPath(ctx, x + r * 0.3, y - r * 0.55, r * 0.35, 7, 0.3, D.rng(4));
    D.fs(ctx, 'rgba(104,159,56,0.85)');
    ctx.restore();
  }
  function flames(ctx, x, y, s, green) {
    const c1 = green ? '#ccff90' : '#fff59d', c2 = green ? '#76ff03' : '#ff9100', c3 = green ? '#1b5e20' : '#d84315';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    glowRing(ctx, 0, -4, 12, c2, 0.6);
    [[-4, 0, 7, 0.9], [4, 1, 6, 0.8], [0, -1, 10, 1]].forEach(([fx, fy, h, k]) => {
      ctx.beginPath();
      ctx.moveTo(fx - 3.5 * k, fy);
      ctx.quadraticCurveTo(fx - 4 * k, fy - h * 0.6, fx, fy - h);
      ctx.quadraticCurveTo(fx + 4 * k, fy - h * 0.6, fx + 3.5 * k, fy);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, fy - h, 0, fy, [[0, c1], [0.5, c2], [1, c3]]);
      ctx.fill();
      ctx.strokeStyle = D.rgba(OL, 0.7);
      ctx.lineWidth = 0.7;
      ctx.stroke();
    });
    ctx.restore();
  }
  function firePot(ctx, x, y, s, green) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    flames(ctx, 0, -5, 0.9, green);
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.quadraticCurveTo(-9, 2, -5, 6);
    ctx.lineTo(5, 6);
    ctx.quadraticCurveTo(9, 2, 6, -5);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, -8, 0, 8, 0, [[0, '#ffab91'], [0.5, '#d84315'], [1, '#7f2a0d']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    D.ellipsePath(ctx, 0, -5, 6.5, 2);
    D.fs(ctx, '#5d2a12', OL, 0.9);
    ctx.strokeStyle = '#ffcc80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6.5, 0);
    ctx.lineTo(6.5, 0);
    ctx.stroke();
    ctx.restore();
  }

  function fireHelmet(ctx, cx, top, w, col, o = {}) {
    const r = w * 0.56;
    const base = top + r * 0.95;
    // the long back brim points away from where the minion is facing
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.6, base + r * 0.32);
    ctx.quadraticCurveTo(cx - r * 1.25, base - r * 0.12, cx - r * 0.8, base - r * 0.1);
    ctx.lineTo(cx + r * 0.9, base - r * 0.1);
    ctx.quadraticCurveTo(cx + r * 1.22, base - r * 0.05, cx + r * 1.18, base + r * 0.1);
    ctx.lineTo(cx - r * 1.4, base + r * 0.4);
    ctx.closePath();
    D.fs(ctx, D.shade(col, -0.28), OL, 1.2);
    ctx.beginPath();
    ctx.arc(cx, base - r * 0.05, r * 0.92, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - r, 0, cx + r, 0, [[0, D.shade(col, 0.4)], [0.5, col], [1, D.shade(col, -0.35)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // comb ridge
    ctx.strokeStyle = D.shade(col, -0.45);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, base - r * 0.05, r * 0.92, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();
    // front shield badge
    const bx = cx, by = base - r * 0.48;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.34, by - r * 0.28);
    ctx.lineTo(bx + r * 0.34, by - r * 0.28);
    ctx.lineTo(bx + r * 0.3, by + r * 0.12);
    ctx.lineTo(bx, by + r * 0.36);
    ctx.lineTo(bx - r * 0.3, by + r * 0.12);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, by - r * 0.3, 0, by + r * 0.36, [[0, '#fff8c4'], [0.5, '#ffc400'], [1, '#a66a00']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    D.starPath(ctx, bx, by, 5, r * 0.15, r * 0.07);
    D.fs(ctx, '#e53935');
    if (o.siren) {
      // rotating light on top: red / blue
      const sy = base - r * 1.05;
      glowRing(ctx, cx, sy - 1, o.siren > 1 ? 13 : 9, '#ff1744', 0.55);
      D.rrPath(ctx, cx - 4.4, sy - 1, 8.8, 2.6, 1);
      D.fs(ctx, '#455a64', OL, 0.8);
      ctx.beginPath();
      ctx.arc(cx - 2, sy - 1, 2.4, Math.PI, 0);
      ctx.closePath();
      D.fs(ctx, '#ff1744', OL, 0.8);
      ctx.beginPath();
      ctx.arc(cx + 2.2, sy - 1, 2.4, Math.PI, 0);
      ctx.closePath();
      D.fs(ctx, '#2979ff', OL, 0.8);
    }
  }

  function hydrant(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    D.rrPath(ctx, -5, -12, 10, 16, 2);
    ctx.fillStyle = D.lin(ctx, -5, 0, 5, 0, [[0, '#ff8a80'], [0.5, '#e53935'], [1, '#8e1c16']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -12, 5, Math.PI, 0);
    ctx.closePath();
    D.fs(ctx, '#e53935', OL, 1);
    D.rrPath(ctx, -7, -8, 14, 4, 1.5);
    D.fs(ctx, '#c62828', OL, 1);
    D.rrPath(ctx, -6.5, 3, 13, 3, 1);
    D.fs(ctx, '#b71c1c', OL, 1);
    D.circlePath(ctx, 0, -17.5, 1.6);
    D.fs(ctx, '#ffd54f', OL, 0.7);
    ctx.restore();
  }

  function waterDrops(ctx, x, y, n, len, s = 1) {
    for (let i = 0; i < n; i++) {
      const dx = x + i * len, dy = y + Math.sin(i * 1.7) * 2.5 * s;
      ctx.beginPath();
      ctx.moveTo(dx + 4 * s, dy);
      ctx.quadraticCurveTo(dx, dy - 2.4 * s, dx - 2.2 * s, dy);
      ctx.quadraticCurveTo(dx, dy + 2.4 * s, dx + 4 * s, dy);
      ctx.closePath();
      D.fs(ctx, 'rgba(129,212,250,0.95)', 'rgba(1,87,155,0.8)', 0.7);
    }
  }

  function tombstone(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x - 6, y - 9);
    ctx.arc(x, y - 9, 6, Math.PI, 0);
    ctx.lineTo(x + 6, y);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - 6, 0, x + 6, 0, [[0, '#cfd8dc'], [1, '#607d8b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y - 5);
    ctx.moveTo(x - 2.5, y - 10);
    ctx.lineTo(x + 2.5, y - 10);
    ctx.stroke();
  }

  // a tinted, see-through copy of a minion (ninja shadow clones)
  function ghostMinion(ctx, o, tint, alpha) {
    const { c, ctx: c2 } = D.canvas(84, 92);
    M.draw(c2, Object.assign({ x: B.cx, y: B.cy, w: B.w, h: B.h }, o));
    c2.save();
    c2.setTransform(1, 0, 0, 1, 0, 0);
    c2.globalCompositeOperation = 'source-atop';
    c2.fillStyle = tint;
    c2.fillRect(0, 0, c.width, c.height);
    c2.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(c, (o.dx || 0), (o.dy || 0), 84, 92);
    ctx.restore();
  }

  // ================================================================ Ninja
  P.ninja = function (ctx, t) {
    const [a, b, c] = t;
    const gold = a >= 4;
    const band = gold ? '#ffc400' : c >= 4 ? '#ff1744' : '#e53935';
    if (a >= 4) glowRing(ctx, B.cx, B.cy, 42, '#ffd740', 0.5);
    else if (b >= 4) glowRing(ctx, B.cx, B.cy, 42, '#7c4dff', 0.45);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy, 42, '#ff5252', 0.45);
    const gi = { base: '#2b2d42', light: '#4a4e69', dark: '#14151f', stitch: band };
    const o = {
      eyes: 2, hair: 'bald', mouth: 'none', seed: 171, lookX: 0.85, lid: 0.3, lidDepth: 0.72,
      denim: gi, noLogo: true, strapColor: band, rim: a >= 4 ? '#ffd740' : c >= 4 ? '#ff8a80' : null,
      arms: [],
      outfit: (c2, cx, cy, w, h) => {
        // obi belt
        c2.fillStyle = band;
        c2.fillRect(cx - w, cy + h * 0.19, w * 2, h * 0.07);
        c2.fillStyle = 'rgba(255,255,255,0.35)';
        c2.fillRect(cx - w, cy + h * 0.19, w * 2, h * 0.018);
        // crossed collar
        c2.strokeStyle = '#eceff1';
        c2.lineWidth = 1.4;
        c2.beginPath();
        c2.moveTo(cx - w * 0.3, cy + h * 0.06);
        c2.lineTo(cx + w * 0.05, cy + h * 0.2);
        c2.moveTo(cx + w * 0.3, cy + h * 0.06);
        c2.lineTo(cx - w * 0.05, cy + h * 0.2);
        c2.stroke();
        if (b >= 2) {
          // full hood over the top of the head
          c2.fillStyle = '#1f2030';
          c2.fillRect(cx - w, cy - h * 0.6, w * 2, h * 0.34);
        }
      },
      face: (c2, cx, cy, w, h) => {
        // the face mask covers mouth and nose
        c2.save();
        D.capsulePath(c2, cx, cy, w, h);
        c2.clip();
        c2.fillStyle = '#1f2030';
        c2.fillRect(cx - w, cy - h * 0.065, w * 2, h * 0.15);
        c2.strokeStyle = 'rgba(255,255,255,0.18)';
        c2.lineWidth = 0.8;
        c2.beginPath();
        c2.moveTo(cx - w * 0.3, cy + h * 0.02);
        c2.quadraticCurveTo(cx, cy + h * 0.05, cx + w * 0.3, cy + h * 0.02);
        c2.stroke();
        c2.restore();
      },
    };
    if (b >= 4) {
      // two shadow clones step out behind the master
      ghostMinion(ctx, Object.assign({}, o, { dx: -13, dy: -3, arms: [], outfit: null, face: null }), 'rgba(49,27,146,0.9)', 0.45);
      ghostMinion(ctx, Object.assign({}, o, { dx: 13, dy: -3, arms: [], outfit: null, face: null }), 'rgba(49,27,146,0.9)', 0.45);
    }
    // headband tails fluttering behind (to the left)
    const tl = c >= 1 ? 22 : 15;
    [[-1, 0], [1, 5]].forEach(([k, dy]) => {
      ctx.beginPath();
      ctx.moveTo(B.cx - 13, B.cy - 9);
      ctx.quadraticCurveTo(B.cx - 13 - tl * 0.5, B.cy - 13 + dy + k * 2, B.cx - 13 - tl, B.cy - 8 + dy);
      ctx.lineTo(B.cx - 13 - tl + 1.5, B.cy - 5 + dy);
      ctx.quadraticCurveTo(B.cx - 13 - tl * 0.5, B.cy - 9 + dy + k * 2, B.cx - 13, B.cy - 6);
      ctx.closePath();
      D.fs(ctx, band, OL, 1);
    });
    if (a >= 3) {
      // katana on the back
      ctx.save();
      ctx.translate(B.cx - 4, B.cy - 6);
      ctx.rotate(-0.85);
      D.rrPath(ctx, -20, -2.2, 30, 4.4, 2);
      D.fs(ctx, '#3e2723', OL, 1);
      D.rrPath(ctx, 10, -3.5, 2.2, 7, 0.8);
      D.fs(ctx, gold ? '#ffc400' : '#b0bec5', OL, 0.8);
      D.rrPath(ctx, 12, -1.6, 9, 3.2, 1.2);
      D.fs(ctx, '#e53935', OL, 0.8);
      ctx.restore();
    }
    o.after = (c2) => {
      // right arm thrusts forward with a shuriken, left fist tucked in
      arm(c2, B.cx - 13, B.cy + 2, B.cx - 18, B.cy + 11, [B.cx - 21, B.cy + 4]);
      arm(c2, B.cx + 13, B.cy + 2, B.cx + 22, B.cy - 4, [B.cx + 21, B.cy + 5]);
      if (a >= 2) {
        shuriken(c2, B.cx + 22, B.cy - 13, gold ? 6 : 5.2, 0.3, gold);
        shuriken(c2, B.cx + 28, B.cy - 7, gold ? 6 : 5.2, -0.2, gold);
      } else shuriken(c2, B.cx + 25, B.cy - 9, a >= 1 ? 6.2 : 5.4, 0.25, false);
      if (b >= 3) {
        // flash bomb in the left hand
        D.circlePath(c2, B.cx - 21, B.cy + 14, 4.4);
        c2.fillStyle = D.rad(c2, B.cx - 22.5, B.cy + 12.5, 0, B.cx - 21, B.cy + 14, 4.4, [[0, '#ffffff'], [1, '#78909c']]);
        c2.fill();
        c2.strokeStyle = OL;
        c2.lineWidth = 1;
        c2.stroke();
        c2.strokeStyle = '#6d4c41';
        c2.beginPath();
        c2.moveTo(B.cx - 21, B.cy + 9.6);
        c2.quadraticCurveTo(B.cx - 19, B.cy + 6, B.cx - 22, B.cy + 4.5);
        c2.stroke();
        D.starPath(c2, B.cx - 22, B.cy + 4.2, 5, 2.4, 1);
        D.fs(c2, '#fff176');
      }
      if (c >= 2) {
        // caltrop pouch on the belt
        D.rrPath(c2, B.cx + 6, B.cy + 9, 7, 7, 2);
        D.fs(c2, '#6d4c41', OL, 0.9);
        D.starPath(c2, B.cx + 9.5, B.cy + 9, 4, 2.2, 0.8);
        D.fs(c2, '#b0bec5', OL, 0.5);
      }
      if (c >= 3) {
        // sticky bombs on the belt
        const n = c >= 4 ? 4 : 1;
        for (let i = 0; i < n; i++) {
          const bx = B.cx - 10 + i * 5.5, by = c >= 4 ? B.cy + 1 - i * 2.2 : B.cy + 12;
          D.circlePath(c2, bx, by, 2.8);
          D.fs(c2, '#d32f2f', OL, 0.8);
          D.circlePath(c2, bx + 0.6, by - 0.8, 0.9);
          D.fs(c2, '#fff59d');
        }
        if (c >= 4) {
          // bandolier strap across the chest
          c2.strokeStyle = '#4e342e';
          c2.lineWidth = 1.6;
          c2.beginPath();
          c2.moveTo(B.cx - 13, B.cy + 6);
          c2.lineTo(B.cx + 11, B.cy - 6);
          c2.stroke();
        }
      }
    };
    baseMinion(ctx, o);
    if (b >= 1) {
      // smoke at the feet
      const rnd = D.rng(8);
      for (let i = 0; i < 4; i++) {
        D.blobPath(ctx, B.cx - 18 + i * 5, FOOT - 2 - (i % 2) * 3, 4.5 - (i % 2), 7, 0.25, rnd);
        D.fs(ctx, 'rgba(176,190,197,0.85)', 'rgba(42,29,20,0.4)', 0.8);
      }
    }
    if (a >= 4) {
      // golden shurikens orbiting the grandmaster
      [[B.cx - 24, B.cy - 22], [B.cx + 2, B.cy - 34], [B.cx - 27, B.cy + 2]].forEach(([x, y], i) => shuriken(ctx, x, y, 4, i, true));
    }
  };

  // ================================================================ Catapult
  P.catapult = function (ctx, t) {
    const [a, b, c] = t;
    if (a >= 4) glowRing(ctx, 40, 44, 44, '#ffd740', 0.45);
    else if (c >= 4) glowRing(ctx, 40, 44, 44, '#ff6d00', 0.5);
    else if (b >= 4) glowRing(ctx, 40, 44, 44, '#7c4dff', 0.4);
    D.shadow(ctx, 40, 75, 38, 7, 0.3);
    if (b >= 4) {
      // royal banner at the back
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 70);
      ctx.lineTo(6, 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(7, 15);
      ctx.lineTo(20, 15);
      ctx.lineTo(20, 33);
      ctx.lineTo(13.5, 29);
      ctx.lineTo(7, 33);
      ctx.closePath();
      D.fs(ctx, '#5e35b1', OL, 1);
      crown(ctx, 13.5, 22, 0.32, '#e53935');
    }
    if (c >= 3) {
      // the spotter's flag (lets it target Camo)
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(79, 74);
      ctx.lineTo(79, 46);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(79, 47);
      ctx.lineTo(70, 50);
      ctx.lineTo(79, 54);
      ctx.closePath();
      D.fs(ctx, '#76ff03', OL, 0.8);
    }
    // ---- the catapult
    const px = 34, py = 51; // arm pivot
    const tip = c >= 1 ? [9, 21] : [12, 25]; // bucket, pulled back and loaded
    // rear A-frame
    ctx.beginPath();
    ctx.moveTo(24, 64);
    ctx.lineTo(px, py - 3);
    ctx.lineTo(44, 64);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 24, 0, 44, 0, [[0, '#a87850'], [1, '#6d4325']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // front stop post with a padded top (the arm slams into it)
    D.rrPath(ctx, 48, 33, 5, 31, 1.5);
    D.fs(ctx, '#8d5a34', OL, 1.2);
    D.rrPath(ctx, 45, 29, 11, 6, 2.5);
    D.fs(ctx, '#c62828', OL, 1.1);
    // base beam on wheels
    D.rrPath(ctx, 8, 60, 52, 7, 2.5);
    ctx.fillStyle = D.lin(ctx, 0, 60, 0, 67, [[0, '#c08a5c'], [1, '#6d4325']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    if (a >= 4) {
      ctx.fillStyle = '#90a4ae';
      [14, 30, 46].forEach((x) => ctx.fillRect(x, 60.5, 3, 6));
    }
    // the throwing arm(s)
    const arms = b >= 2 ? [[0, 0], [6, 3]] : [[0, 0]];
    arms.forEach(([ox, oy], k) => {
      woodBeam(ctx, px + ox, py + oy, tip[0] + ox, tip[1] + oy, 4.6);
      woodBeam(ctx, px + ox, py + oy, px + ox + 7, py + oy + 6, 4.6);
      // bucket
      ctx.save();
      ctx.translate(tip[0] + ox, tip[1] + oy);
      ctx.rotate(Math.atan2(py - tip[1], px - tip[0]) + Math.PI / 2);
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI);
      ctx.closePath();
      D.fs(ctx, '#7b4a28', OL, 1.1);
      ctx.restore();
      // ammo
      const ax = tip[0] + ox - 1, ay = tip[1] + oy - 6;
      if (a >= 4) colossal(ctx, ax, ay - 2, 9.5);
      else if (a >= 3) ironBall(ctx, ax, ay, 6.5);
      else if (c >= 2) firePot(ctx, ax, ay + 1, 0.9, c >= 3);
      else if (a >= 2) melon(ctx, ax, ay, 6.5);
      else rock(ctx, ax, ay, a >= 1 ? 7.5 : 6.5, 5 + k);
    });
    // axle
    D.circlePath(ctx, px, py, 3);
    D.fs(ctx, '#90a4ae', OL, 1);
    if (b >= 1) {
      // winch gear
      ctx.save();
      ctx.translate(18, 57);
      D.starPath(ctx, 0, 0, 8, 6, 4.4);
      D.fs(ctx, '#b0bec5', OL, 1);
      D.circlePath(ctx, 0, 0, 2);
      D.fs(ctx, '#546e7a', OL, 0.8);
      ctx.restore();
    }
    if (b >= 3) {
      // spring coil to snap the arm faster
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const x = 38 + i * 0.75, y = 58 + Math.sin(i * 1.6) * 2.5;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    wheel(ctx, 18, 70, 7.5);
    wheel(ctx, 50, 70, 7.5);
    if (c >= 4) {
      // dragon head carved on the front
      ctx.save();
      ctx.translate(60, 61);
      ctx.beginPath();
      ctx.moveTo(-2, -4);
      ctx.quadraticCurveTo(6, -9, 11, -4);
      ctx.lineTo(8, -1);
      ctx.lineTo(11, 2);
      ctx.quadraticCurveTo(4, 5, -2, 3);
      ctx.closePath();
      D.fs(ctx, '#2e7d32', OL, 1);
      D.circlePath(ctx, 5, -4.5, 1.2);
      D.fs(ctx, '#ffeb3b');
      ctx.restore();
      flames(ctx, 74, 61, 0.55, false);
    }
    // ---- the knight minion stands in front, sword pointing at the target
    const mx = 64, my = 52, mw = 19, mh = 27;
    M.draw(ctx, {
      x: mx, y: my, w: mw, h: mh, eyes: 2, hair: 'bald', mouth: 'grin', seed: 181, lookX: 0.8, lw: 1.1,
      denim: { base: '#8d6e63', light: '#bcaaa4', dark: '#5d4037', stitch: '#ffd54f' }, noLogo: true,
      outfit: (c2, cx, cy, w, h) => {
        // chainmail tabard
        c2.fillStyle = b >= 4 ? '#5e35b1' : '#c62828';
        c2.fillRect(cx - w * 0.3, cy + h * 0.05, w * 0.6, h * 0.5);
        D.starPath(c2, cx, cy + h * 0.2, 5, w * 0.12, w * 0.05);
        D.fs(c2, '#ffd54f');
      },
      arms: [{ x0: mx - 8.5, y0: my + 1, x1: mx - 12, y1: my + 8, t: 0.15 }],
    });
    helmet(ctx, mx, my - mh / 2 - 7, mw, a >= 4 ? '#ffd54f' : '#b0bec5');
    // plume flowing backwards
    ctx.beginPath();
    ctx.moveTo(mx + 1, my - mh / 2 - 6);
    ctx.quadraticCurveTo(mx - 6, my - mh / 2 - 15, mx - 13, my - mh / 2 - 8);
    ctx.quadraticCurveTo(mx - 6, my - mh / 2 - 10, mx - 1, my - mh / 2 - 4);
    ctx.closePath();
    D.fs(ctx, b >= 4 ? '#7c4dff' : '#e53935', OL, 0.9);
    if (b >= 4) crown(ctx, mx + 1, my - mh / 2 - 9, 0.38, '#e53935');
    // sword arm
    ctx.save();
    ctx.translate(mx + 12, my - 6);
    ctx.rotate(0.35);
    D.rrPath(ctx, -1.3, -16, 2.6, 15, 1);
    ctx.fillStyle = D.lin(ctx, -1.3, 0, 1.3, 0, [[0, '#ffffff'], [1, '#90a4ae']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    D.rrPath(ctx, -4, -1.5, 8, 2.4, 1);
    D.fs(ctx, '#ffc400', OL, 0.8);
    ctx.restore();
    D.limb(ctx, mx + 8.5, my + 1, mx + 12, my - 5, mw * 0.15, YEL, { bend: [mx + 13, my + 3], lw: 1.1 });
  };

  // ================================================================ Alchemist
  P.potion = function (ctx, t) {
    const [a, b, c] = t;
    const liquid = c >= 2 ? '#ffc400' : a >= 4 ? '#76ff03' : a >= 1 ? '#64dd17' : '#7cb342';
    if (a >= 4) glowRing(ctx, B.cx, B.cy, 42, '#76ff03', 0.5);
    else if (b >= 4) glowRing(ctx, B.cx, B.cy, 42, '#e040fb', 0.45);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy, 42, '#ffd740', 0.55);
    if (b >= 3) {
      // potion rack on the back
      D.rrPath(ctx, B.cx - 26, B.cy - 14, 13, 30, 3);
      D.fs(ctx, '#8d6e63', OL, 1.1);
      ['#ff5252', '#40c4ff', '#ffd740'].forEach((col, i) => vial(ctx, B.cx - 19.5, B.cy - 8 + i * 9, col));
    }
    if (b >= 4) cauldron(ctx, 13, 66, 1.05, '#e040fb');
    else if (b >= 2) cauldron(ctx, 14, 68, 0.8, '#ff5252');
    const coat = '#f5f5f5';
    const o = {
      eyes: 2, hair: 'wild', hairColor: '#eceff1', hairSpikes: 11, hairLen: 0.55, mouth: 'grin', seed: 191, lookX: 0.75,
      rim: c >= 1 ? '#ffc400' : '#c9a227', strapColor: '#6d4c41',
      denim: { base: '#5c6bc0', light: '#8e99f3', dark: '#26418f', stitch: '#ffd54f' },
      arms: [],
      outfit: (c2, cx, cy, w, h) => {
        // white lab coat over the overalls, with a few stains
        c2.fillStyle = coat;
        c2.beginPath();
        c2.moveTo(cx - w, cy - h * 0.04);
        c2.lineTo(cx - w * 0.16, cy + h * 0.06);
        c2.lineTo(cx - w * 0.24, cy + h * 0.5);
        c2.lineTo(cx - w, cy + h * 0.5);
        c2.closePath();
        c2.fill();
        c2.beginPath();
        c2.moveTo(cx + w, cy - h * 0.04);
        c2.lineTo(cx + w * 0.16, cy + h * 0.06);
        c2.lineTo(cx + w * 0.24, cy + h * 0.5);
        c2.lineTo(cx + w, cy + h * 0.5);
        c2.closePath();
        c2.fill();
        c2.strokeStyle = '#b0bec5';
        c2.lineWidth = 0.8;
        c2.beginPath();
        c2.moveTo(cx - w * 0.16, cy + h * 0.06);
        c2.lineTo(cx - w * 0.24, cy + h * 0.5);
        c2.moveTo(cx + w * 0.16, cy + h * 0.06);
        c2.lineTo(cx + w * 0.24, cy + h * 0.5);
        c2.stroke();
        D.blobPath(c2, cx - w * 0.34, cy + h * 0.32, 1.8, 6, 0.4, D.rng(5));
        D.fs(c2, D.rgba(liquid, 0.85));
        D.blobPath(c2, cx + w * 0.38, cy + h * 0.2, 1.3, 6, 0.4, D.rng(7));
        D.fs(c2, D.rgba('#ff5252', 0.7));
        // belt of vials
        c2.fillStyle = '#6d4c41';
        c2.fillRect(cx - w, cy + h * 0.24, w * 2, h * 0.05);
      },
    };
    o.after = (c2) => {
      ['#ff5252', '#40c4ff', liquid].forEach((col, i) => vial(c2, B.cx - 8 + i * 8, B.cy + 13, col));
      // left hand: a red brew, or resting on the coat
      if (b >= 1) {
        arm(c2, B.cx - 13, B.cy + 2, B.cx - 19, B.cy + 9, [B.cx - 21, B.cy + 2]);
        flask(c2, B.cx - 20, B.cy + 4, 0.55, '#ff1744', { rot: -0.3 });
      } else arm(c2, B.cx - 13, B.cy + 2, B.cx - 16, B.cy + 11, [B.cx - 19, B.cy + 6]);
      // right hand raised, about to throw a flask
      arm(c2, B.cx + 13, B.cy + 2, B.cx + 18, B.cy - 11, [B.cx + 22, B.cy - 1]);
      flask(c2, B.cx + 20, B.cy - 18, a >= 2 ? 0.95 : 0.8, liquid, { glow: a >= 3 || c >= 2, rot: 0.25 });
    };
    baseMinion(ctx, o);
    if (a >= 3) {
      // bubbling acid on the ground
      D.ellipsePath(ctx, B.cx + 22, FOOT - 1, 10, 3);
      D.fs(ctx, D.rgba(liquid, 0.8), D.rgba('#1b5e20', 0.6), 0.8);
      D.circlePath(ctx, B.cx + 20, FOOT - 3, 1.3);
      D.fs(ctx, D.rgba('#ccff90', 0.9));
    }
    if (c >= 3) {
      // a little pile of gold
      [[B.cx + 18, FOOT - 1], [B.cx + 24, FOOT - 2], [B.cx + 21, FOOT - 5]].forEach(([x, y]) => {
        D.ellipsePath(ctx, x, y, 3.4, 1.6);
        D.fs(ctx, '#ffc400', OL, 0.7);
      });
    }
    if (c >= 4) {
      // the Philosopher's Banana floats above its head
      glowRing(ctx, B.cx, 8, 14, '#fff59d', 0.8);
      banana(ctx, B.cx, 10, 1.05, -0.2, '#ffc400');
      D.starPath(ctx, B.cx + 9, 3, 4, 3.2, 1);
      D.fs(ctx, '#ffffff');
    }
  };

  // ================================================================ Fireman
  P.fireman = function (ctx, t) {
    const [a, b, c] = t;
    if (a >= 4) glowRing(ctx, B.cx, B.cy, 44, '#40c4ff', 0.5);
    else if (b >= 4) glowRing(ctx, B.cx, B.cy, 44, '#ff1744', 0.45);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy, 44, '#00e5ff', 0.45);
    if (b >= 3) {
      // the fire truck parked behind
      const tx = 2, ty = 36;
      D.rrPath(ctx, tx, ty + 6, 60, 24, 4);
      ctx.fillStyle = D.lin(ctx, 0, ty + 6, 0, ty + 30, [[0, '#ff6f60'], [0.5, '#d32f2f'], [1, '#8e1c16']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      // ladder on the roof
      D.rrPath(ctx, tx + 4, ty + 1, 46, 5, 1);
      D.fs(ctx, '#cfd8dc', OL, 1);
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(tx + 8 + i * 5.5, ty + 1.5);
        ctx.lineTo(tx + 8 + i * 5.5, ty + 5.5);
        ctx.stroke();
      }
      // gold stripe + windows
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(tx + 1, ty + 19, 58, 2);
      D.rrPath(ctx, tx + 4, ty + 9, 9, 7, 1.5);
      D.fs(ctx, '#b3e5fc', OL, 0.9);
      // siren bar
      const big = b >= 4;
      glowRing(ctx, tx + 10, ty - 1, big ? 12 : 8, '#ff1744', 0.6);
      glowRing(ctx, tx + 20, ty - 1, big ? 12 : 8, '#2979ff', 0.6);
      D.rrPath(ctx, tx + 6, ty - 3, 18, 4, 1.5);
      D.fs(ctx, '#455a64', OL, 0.8);
      D.circlePath(ctx, tx + 10, ty - 2, 2.2);
      D.fs(ctx, '#ff1744', OL, 0.7);
      D.circlePath(ctx, tx + 20, ty - 2, 2.2);
      D.fs(ctx, '#2979ff', OL, 0.7);
      wheel(ctx, tx + 10, ty + 30, 5.5);
      wheel(ctx, tx + 48, ty + 30, 5.5);
    }
    if (c >= 1 && b < 3) hydrant(ctx, 13, FOOT - 2, 0.95);
    if (c >= 3) {
      // puddles on the ground
      D.ellipsePath(ctx, B.cx + 20, FOOT, 12, 3.2);
      D.fs(ctx, 'rgba(79,195,247,0.7)', 'rgba(1,87,155,0.6)', 0.8);
      D.ellipsePath(ctx, B.cx - 12, FOOT + 2, 8, 2.4);
      D.fs(ctx, 'rgba(79,195,247,0.6)', 'rgba(1,87,155,0.5)', 0.7);
    }
    if (c >= 4) {
      // a swirl of riptide water around the feet
      ctx.strokeStyle = 'rgba(0,229,255,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(B.cx, FOOT - 2, 24, 6, 0, Math.PI * 0.1, Math.PI * 1.7);
      ctx.stroke();
    }
    // the hose, from the hydrant / truck to the nozzle
    ctx.save();
    ctx.lineCap = 'round';
    // from the truck, the hydrant, or trailing off behind the minion
    const hs = b >= 3 ? [36, 60] : c >= 1 ? [14, FOOT - 12] : [2, FOOT - 3];
    const hose = () => {
      ctx.beginPath();
      ctx.moveTo(hs[0], hs[1]);
      ctx.bezierCurveTo(B.cx - 6, FOOT + 4, B.cx + 18, FOOT, B.cx + 8, B.cy + 9);
    };
    hose();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 5.4;
    ctx.stroke();
    hose();
    ctx.strokeStyle = '#e8d3a8';
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.restore();
    const coat = { base: '#d9a441', light: '#f3cc7a', dark: '#8d6420', stitch: '#fff59d' };
    const o = {
      eyes: 2, hair: 'bald', mouth: b >= 1 ? 'o' : 'grin', seed: 201, lookX: 0.8, denim: coat, noLogo: true,
      rim: c >= 2 ? '#00e5ff' : null,
      arms: [],
      outfit: (c2, cx, cy, w, h) => {
        // reflective stripes on the coat
        [0.17, 0.33].forEach((k) => {
          c2.fillStyle = '#fff59d';
          c2.fillRect(cx - w, cy + h * k, w * 2, h * 0.055);
          c2.fillStyle = '#cfd8dc';
          c2.fillRect(cx - w, cy + h * k + h * 0.012, w * 2, h * 0.03);
        });
      },
    };
    o.after = (c2) => {
      // both hands on the nozzle, pointing it at the mutants
      const nx = B.cx + 6, ny = B.cy + 6;
      c2.save();
      c2.translate(nx, ny);
      if (a >= 3) {
        // water cannon
        const L = a >= 4 ? 30 : 25, R = a >= 4 ? 7 : 5.5;
        D.rrPath(c2, -4, -R, L, R * 2, R * 0.6);
        c2.fillStyle = D.lin(c2, 0, -R, 0, R, [[0, '#b3e5fc'], [0.5, '#0288d1'], [1, '#01579b']]);
        c2.fill();
        c2.strokeStyle = OL;
        c2.lineWidth = 1.3;
        c2.stroke();
        [4, 12].forEach((x) => {
          D.rrPath(c2, x, -R - 1, 3, R * 2 + 2, 1);
          D.fs(c2, '#ffc400', OL, 0.8);
        });
        D.ellipsePath(c2, L - 4, 0, 2.4, R + 1);
        D.fs(c2, '#ffc400', OL, 1);
        if (a >= 4) {
          // wave crest emblem
          c2.strokeStyle = '#ffffff';
          c2.lineWidth = 1.2;
          c2.beginPath();
          c2.moveTo(2, 2);
          c2.quadraticCurveTo(7, -4, 11, 1);
          c2.quadraticCurveTo(8, 0, 9, 3);
          c2.stroke();
        }
        waterDrops(c2, L + 1, 0, 3, 6, 1.2);
      } else {
        // brass hose nozzle
        D.rrPath(c2, -3, -3, 9, 6, 2);
        D.fs(c2, '#37474f', OL, 1.1);
        c2.beginPath();
        c2.moveTo(5, -3.4);
        c2.lineTo(a >= 1 ? 22 : 19, -1.8);
        c2.lineTo(a >= 1 ? 22 : 19, 1.8);
        c2.lineTo(5, 3.4);
        c2.closePath();
        c2.fillStyle = D.lin(c2, 0, -3, 0, 3, [[0, '#fff3c4'], [0.5, '#e0a52a'], [1, '#8a5a00']]);
        c2.fill();
        c2.strokeStyle = OL;
        c2.lineWidth = 1.1;
        c2.stroke();
        if (a >= 2) {
          D.circlePath(c2, 9, -5.5, 2.6);
          D.fs(c2, '#ffffff', OL, 0.8);
          c2.strokeStyle = '#d32f2f';
          c2.lineWidth = 0.8;
          c2.beginPath();
          c2.moveTo(9, -5.5);
          c2.lineTo(10.5, -7);
          c2.stroke();
        }
        waterDrops(c2, a >= 1 ? 25 : 22, 0, 3, 5.5, 1);
      }
      c2.restore();
      arm(c2, B.cx - 13, B.cy + 2, B.cx + 3, B.cy + 9, [B.cx - 12, B.cy + 15]);
      arm(c2, B.cx + 13, B.cy + 2, B.cx + 14, B.cy + 6, [B.cx + 17, B.cy + 3]);
    };
    baseMinion(ctx, o);
    fireHelmet(ctx, B.cx, B.cy - 31, B.w, '#d32f2f', { siren: b >= 1 ? (b >= 2 ? 2 : 1) : 0 });
    if (c >= 2) {
      // visor up on the helmet
      D.rrPath(ctx, B.cx - 9, B.cy - 22, 18, 3.4, 1.5);
      D.fs(ctx, 'rgba(178,235,242,0.85)', OL, 0.8);
    }
  };

  // ================================================================ Vampire
  P.vampire = function (ctx, t) {
    const [a, b, c] = t;
    if (b >= 4) {
      // a blood moon rises behind the count
      glowRing(ctx, B.cx + 4, B.cy - 18, 40, '#ff1744', 0.5);
      D.circlePath(ctx, B.cx + 6, B.cy - 22, 17);
      ctx.fillStyle = D.rad(ctx, B.cx + 1, B.cy - 27, 2, B.cx + 6, B.cy - 22, 17, [[0, '#ff8a80'], [0.6, '#e53935'], [1, '#7f0000']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (a >= 4) glowRing(ctx, B.cx, B.cy, 44, '#7c4dff', 0.5);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy, 44, '#4a148c', 0.5);
    const lining = '#c62828';
    if (a >= 4) {
      // the cape turns into huge bat wings
      [-1, 1].forEach((s) => {
        ctx.save();
        ctx.translate(B.cx + s * 8, B.cy - 8);
        ctx.scale(s, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(14, -18, 34, -16);
        ctx.lineTo(30, -8);
        ctx.quadraticCurveTo(29, -1, 33, 6);
        ctx.quadraticCurveTo(25, 2, 22, 9);
        ctx.quadraticCurveTo(15, 4, 10, 12);
        ctx.quadraticCurveTo(6, 6, 0, 10);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, 0, -16, 0, 12, [[0, '#5e35b1'], [1, '#1a0f3a']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      });
    }
    // cape with its high collar behind the body
    ctx.beginPath();
    ctx.moveTo(B.cx - 14, B.cy - 6);
    ctx.lineTo(B.cx - 21, B.cy - 22);
    ctx.lineTo(B.cx - 9, B.cy - 13);
    ctx.lineTo(B.cx + 9, B.cy - 13);
    ctx.lineTo(B.cx + 21, B.cy - 22);
    ctx.lineTo(B.cx + 14, B.cy - 6);
    ctx.quadraticCurveTo(B.cx + 22, B.cy + 12, B.cx + 18, FOOT - 3);
    ctx.lineTo(B.cx - 22, FOOT - 1);
    ctx.quadraticCurveTo(B.cx - 26, B.cy + 12, B.cx - 14, B.cy - 6);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, B.cx - 24, 0, B.cx + 22, 0, [[0, '#3a3a52'], [0.5, '#1c1c28'], [1, '#0d0d14']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // red lining inside the collar
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(B.cx + s * 13, B.cy - 8);
      ctx.lineTo(B.cx + s * 19, B.cy - 19);
      ctx.lineTo(B.cx + s * 10, B.cy - 13);
      ctx.closePath();
      D.fs(ctx, lining, OL, 0.8);
    });
    if (c >= 3) tombstone(ctx, 11, FOOT);
    const pale = { base: '#f0dc72', light: '#fff4b0', dark: '#bfa441', hi: '#fffde7' };
    const redEyes = b >= 3;
    const o = {
      skin: pale, eyes: 2, hair: 'bald', mouth: 'none', seed: 211, lookX: 0.8, lid: 0.22, lidDepth: 0.72,
      rim: redEyes ? '#b71c1c' : c >= 1 ? '#9575cd' : '#90a4ae',
      denim: { base: '#1c1c28', light: '#3a3a52', dark: '#0d0d14', stitch: '#b71c1c' }, noLogo: true,
      arms: [],
      outfit: (c2, cx, cy, w, h) => {
        // slicked back hair with a widow's peak
        c2.fillStyle = '#1a1a1a';
        c2.beginPath();
        c2.moveTo(cx - w, cy - h * 0.62);
        c2.lineTo(cx + w, cy - h * 0.62);
        c2.lineTo(cx + w, cy - h * 0.31);
        c2.quadraticCurveTo(cx + w * 0.3, cy - h * 0.36, cx, cy - h * 0.27);
        c2.quadraticCurveTo(cx - w * 0.3, cy - h * 0.36, cx - w, cy - h * 0.31);
        c2.closePath();
        c2.fill();
        c2.strokeStyle = 'rgba(255,255,255,0.25)';
        c2.lineWidth = 0.8;
        c2.beginPath();
        c2.moveTo(cx - w * 0.3, cy - h * 0.44);
        c2.quadraticCurveTo(cx, cy - h * 0.5, cx + w * 0.3, cy - h * 0.42);
        c2.stroke();
        // red waistcoat + white shirt
        c2.fillStyle = '#b71c1c';
        c2.fillRect(cx - w * 0.22, cy + h * 0.06, w * 0.44, h * 0.3);
        c2.fillStyle = '#fafafa';
        c2.beginPath();
        c2.moveTo(cx - w * 0.12, cy + h * 0.06);
        c2.lineTo(cx + w * 0.12, cy + h * 0.06);
        c2.lineTo(cx, cy + h * 0.22);
        c2.closePath();
        c2.fill();
      },
      face: (c2, cx, cy, w, h) => {
        // sly smile with two little fangs
        const my = cy + h * 0.03;
        c2.strokeStyle = OL;
        c2.lineWidth = 1.2;
        c2.beginPath();
        c2.moveTo(cx - w * 0.17, my - 0.5);
        c2.quadraticCurveTo(cx, my + h * 0.06, cx + w * 0.17, my - 1.5);
        c2.stroke();
        const fang = b >= 1 ? 3.6 : 2.6;
        [-1, 1].forEach((s) => {
          c2.beginPath();
          c2.moveTo(cx + s * w * 0.06 - 1.2, my + 0.9);
          c2.lineTo(cx + s * w * 0.06 + 1.2, my + 1);
          c2.lineTo(cx + s * w * 0.06, my + 1 + fang);
          c2.closePath();
          D.fs(c2, '#ffffff', OL, 0.6);
        });
      },
    };
    o.after = (c2) => {
      // bow tie
      [-1, 1].forEach((s) => {
        c2.beginPath();
        c2.moveTo(B.cx, B.cy + 3);
        c2.lineTo(B.cx + s * 4.5, B.cy + 0.6);
        c2.lineTo(B.cx + s * 4.5, B.cy + 5.4);
        c2.closePath();
        D.fs(c2, '#d50000', OL, 0.7);
      });
      D.circlePath(c2, B.cx, B.cy + 3, 1.3);
      D.fs(c2, '#d50000', OL, 0.6);
      if (b >= 4) {
        // the Dracula medallion
        D.circlePath(c2, B.cx, B.cy + 12, 3.2);
        D.fs(c2, '#ffc400', OL, 0.8);
        D.circlePath(c2, B.cx, B.cy + 12, 1.4);
        D.fs(c2, '#d50000');
      }
      // left hand holds the cape (or a goblet)
      arm(c2, B.cx - 13, B.cy + 2, B.cx - 19, B.cy + 11, [B.cx - 21, B.cy + 4]);
      if (b >= 2) {
        const gx = B.cx - 20, gy = B.cy + 4;
        c2.beginPath();
        c2.moveTo(gx - 4, gy - 4);
        c2.lineTo(gx + 4, gy - 4);
        c2.quadraticCurveTo(gx + 4, gy + 2, gx, gy + 2);
        c2.quadraticCurveTo(gx - 4, gy + 2, gx - 4, gy - 4);
        c2.closePath();
        D.fs(c2, '#ffc400', OL, 0.9);
        D.ellipsePath(c2, gx, gy - 4, 4, 1.3);
        D.fs(c2, '#b71c1c', OL, 0.6);
        D.rrPath(c2, gx - 0.8, gy + 2, 1.6, 4, 0.5);
        D.fs(c2, '#ffc400', OL, 0.6);
      }
      // right hand reaches out and releases the bats
      arm(c2, B.cx + 13, B.cy + 2, B.cx + 22, B.cy - 3, [B.cx + 21, B.cy + 6]);
      if (c >= 2) {
        c2.strokeStyle = 'rgba(179,136,255,0.85)';
        c2.lineWidth = 1.3;
        for (let i = 1; i <= 3; i++) {
          c2.beginPath();
          c2.arc(B.cx + 6, B.cy - 14, 6 + i * 4, -0.9, -0.1);
          c2.stroke();
        }
      }
    };
    baseMinion(ctx, o);
    // the bats flying out of its hand
    const big = c >= 4 ? 1.25 : 1;
    const spots = [[B.cx + 29, B.cy - 12, 0.62], [B.cx + 24, B.cy - 27, 0.5], [B.cx + 34, B.cy + 2, 0.5], [B.cx + 10, B.cy - 33, 0.45], [B.cx + 33, B.cy - 30, 0.42], [B.cx - 2, B.cy - 37, 0.4]];
    const n = a >= 3 ? 6 : a >= 2 ? 3 : a >= 1 ? 2 : 1;
    spots.slice(0, n).forEach(([x, y, s], i) => bat(ctx, Math.min(x, 84 - 9 * s * big), y, s * big, (i % 2 ? -0.25 : 0.2), { body: c >= 4 ? '#4a148c' : '#3b2a4f' }));
  };

  // ================================================================ Super Minion (now facing its target)
  // flies with the cape streaming back, punches forward and fires its laser eyes ahead
  function streamingCape(ctx, cx, cy, w, h, col) {
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.42, cy - h * 0.14);
    ctx.quadraticCurveTo(cx - w * 0.2, cy - h * 0.22, cx - w * 1.35, cy + h * 0.05);
    ctx.lineTo(cx - w * 1.05, cy + h * 0.18);
    ctx.lineTo(cx - w * 1.4, cy + h * 0.33);
    ctx.lineTo(cx - w * 0.95, cy + h * 0.4);
    ctx.lineTo(cx - w * 1.15, cy + h * 0.58);
    ctx.quadraticCurveTo(cx - w * 0.3, cy + h * 0.6, cx + w * 0.3, cy + h * 0.42);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - w * 1.4, 0, cx + w * 0.5, 0, [[0, D.shade(col, -0.45)], [0.6, col], [1, D.shade(col, 0.2)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

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
    const cy = B.cy + hover;
    streamingCape(ctx, B.cx, cy, B.w, B.h, capeCol);
    // speed lines behind
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.2;
    [[cy - 4, 10], [cy + 6, 14], [cy + 15, 8]].forEach(([y, l]) => {
      ctx.beginPath();
      ctx.moveTo(4, y);
      ctx.lineTo(4 + l, y);
      ctx.stroke();
    });
    const den = { base: suit, light: D.shade(suit, 0.35), dark: D.shade(suit, -0.4), stitch: '#ffd166' };
    const fist = { x: B.cx + 25, y: cy - 6 };
    M.draw(ctx, {
      x: B.cx, y: cy, w: B.w, h: B.h,
      eyes: 2, hair: 'bald', mouth: 'grin', seed: 81, denim: den, noLogo: true, lookX: 0.9, lid: 0.12, lidDepth: 0.7,
      rim: a >= 1 ? '#ff8a80' : null,
      // back arm tucked in at the side, front arm punching at the target
      arms: [{ x0: B.cx - 13, y0: cy + 1, x1: B.cx - 17, y1: cy + 11, bend: [B.cx - 20, cy + 5] }],
      outfit: (ctx2, cx2, cy2, w, h) => {
        D.starPath(ctx2, cx2, cy2 + h * 0.17, 5, w * 0.14, w * 0.065);
        D.fs(ctx2, a >= 3 ? '#ff6f00' : '#ffd83a', OL, 0.8);
      },
    });
    // the punching arm
    D.limb(ctx, B.cx + 13, cy + 1, fist.x, fist.y, B.w * 0.15, '#ffd83a', { bend: [B.cx + 20, cy + 3], lw: 1.5 });
    if (b >= 3) {
      // robot gauntlet on the punching fist
      D.rrPath(ctx, fist.x - 6, fist.y - 6, 11, 12, 3);
      ctx.fillStyle = D.lin(ctx, fist.x - 6, 0, fist.x + 5, 0, [[0, '#eceff1'], [1, '#78909c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      D.circlePath(ctx, fist.x + 5, fist.y, 1.8);
      D.fs(ctx, '#40c4ff', OL, 0.6);
    }
    if (a >= 1) {
      // laser eyes glowing forward
      const ey = cy - B.h * 0.19;
      [B.cx - 6.3, B.cx + 6.3].forEach((ex) => {
        ctx.strokeStyle = 'rgba(255,82,82,0.55)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(ex + 3, ey);
        ctx.lineTo(ex + 14, ey - 1);
        ctx.stroke();
      });
      glowRing(ctx, B.cx + 12, cy - B.h * 0.19, 8, a >= 3 ? '#ffeb3b' : '#ff5252', 0.7);
    }
  };

  // ================================================================ fused looks
  Object.assign(TA.FUSED_LOOK, { ninja: [4, 2, 0], catapult: [4, 2, 0], potion: [2, 0, 4], fireman: [2, 4, 0], vampire: [4, 2, 0] });
  const { FW, FCX } = TA.FUSED_BOX;
  Object.assign(TA.FUSED_BACK, {
    ninja(ctx, col) {
      TA.props.sunburst(ctx, FCX, 50, 60, col, 12);
      // a torii gate frames the shogun
      D.rrPath(ctx, 10, 18, FW - 20, 7, 2);
      D.fs(ctx, '#d32f2f', OL, 1.4);
      D.rrPath(ctx, 16, 30, FW - 32, 5, 1.5);
      D.fs(ctx, '#b71c1c', OL, 1.2);
      [22, FW - 28].forEach((x) => {
        D.rrPath(ctx, x, 22, 6, 84, 1.5);
        D.fs(ctx, '#c62828', OL, 1.2);
      });
    },
    catapult(ctx) {
      // a trebuchet frame towers behind
      woodBeam(ctx, 18, 104, 44, 14, 5);
      woodBeam(ctx, 102, 104, 76, 14, 5);
      woodBeam(ctx, 40, 18, 80, 18, 5);
      flames(ctx, 22, 30, 1.2, false);
      flames(ctx, FW - 22, 30, 1.2, false);
    },
    potion(ctx) {
      for (let i = 0; i < 7; i++) {
        const an = -Math.PI / 2 + (i - 3) * 0.42;
        const cols = ['#76ff03', '#ff5252', '#40c4ff', '#ffd740', '#e040fb', '#76ff03', '#ff5252'];
        flask(ctx, FCX + Math.cos(an) * 46, 62 + Math.sin(an) * 40, 1.2, cols[i], { glow: true, rot: an + Math.PI / 2 });
      }
    },
    fireman(ctx) {
      // a ladder climbing up behind, water arcing over
      ctx.save();
      ctx.translate(FCX + 30, 104);
      ctx.rotate(-0.35);
      D.rrPath(ctx, -6, -96, 12, 96, 2);
      D.fs(ctx, 'rgba(0,0,0,0)', OL, 1.4);
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 2.4;
      [-5, 5].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, -96);
        ctx.stroke();
      });
      for (let y = -8; y > -94; y -= 10) {
        ctx.beginPath();
        ctx.moveTo(-5, y);
        ctx.lineTo(5, y);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(79,195,247,0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 70);
      ctx.quadraticCurveTo(FCX - 10, -10, FW - 10, 40);
      ctx.stroke();
    },
    vampire(ctx) {
      glowRing(ctx, FCX, 40, 50, '#ff1744', 0.45);
      D.circlePath(ctx, FCX, 36, 30);
      ctx.fillStyle = D.rad(ctx, FCX - 8, 28, 2, FCX, 36, 30, [[0, '#ff8a80'], [0.6, '#d32f2f'], [1, '#7f0000']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      [[18, 30, 0.9], [FW - 18, 24, 0.8], [26, 70, 0.7], [FW - 24, 66, 0.75]].forEach(([x, y, s], i) => bat(ctx, x, y, s, i % 2 ? 0.3 : -0.3));
    },
  });
  Object.assign(TA.FUSED_FRONT, {
    ninja(ctx) { crown(ctx, FCX - 6, 35, 0.9, '#7c4dff'); },
    catapult(ctx) { crown(ctx, FCX + 28, 40, 0.75, '#ff7043'); },
    potion(ctx) { crown(ctx, FCX, 30, 1.0, '#00e676'); },
    fireman(ctx) {},
    vampire(ctx) { crown(ctx, FCX, 34, 1.0, '#d50000'); },
  });

  // ================================================================ textures
  function generate(scene) {
    const mk = (key, w, h, fn) => D.make(scene, key, w, h, fn);
    const img = (key) => scene.textures.get(key).getSourceImage();

    // ---- projectiles (they point along +x, the direction they fly)
    mk('p_shuriken', 20, 20, (ctx) => shuriken(ctx, 10, 10, 8.5, 0, false));
    mk('p_shuriken_gold', 24, 24, (ctx) => {
      glowRing(ctx, 12, 12, 12, '#ffd740', 0.6);
      shuriken(ctx, 12, 12, 9.5, 0, true);
    });
    mk('p_flashbomb', 18, 18, (ctx) => {
      D.circlePath(ctx, 9, 10, 6);
      ctx.fillStyle = D.rad(ctx, 7, 8, 0, 9, 10, 6, [[0, '#ffffff'], [1, '#78909c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      D.starPath(ctx, 12, 4, 5, 3.4, 1.4);
      D.fs(ctx, '#fff176', OL, 0.6);
    });
    mk('p_stickybomb', 18, 18, (ctx) => {
      D.circlePath(ctx, 9, 9, 6);
      ctx.fillStyle = D.rad(ctx, 7, 7, 0, 9, 9, 6, [[0, '#ff8a80'], [1, '#b71c1c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      D.blobPath(ctx, 9, 14, 3, 6, 0.4, D.rng(3));
      D.fs(ctx, 'rgba(118,255,3,0.85)');
      glowRing(ctx, 9, 6, 5, '#ffeb3b', 0.9);
      D.circlePath(ctx, 9, 6, 1.6);
      D.fs(ctx, '#fff59d');
    });
    mk('p_rock', 24, 24, (ctx) => rock(ctx, 12, 12, 9, 5));
    mk('p_melon', 26, 22, (ctx) => melon(ctx, 13, 11, 8.5));
    mk('p_ironball', 30, 30, (ctx) => ironBall(ctx, 15, 15, 8.5));
    mk('p_colossal', 36, 36, (ctx) => colossal(ctx, 18, 18, 14));
    mk('p_firepot', 26, 30, (ctx) => firePot(ctx, 13, 19, 1.1, false));
    mk('p_greekfire', 26, 30, (ctx) => firePot(ctx, 13, 19, 1.1, true));
    mk('p_meteor', 44, 44, (ctx) => {
      // trail goes up-right: it falls down-left out of the sky
      ctx.save();
      ctx.translate(22, 22);
      ctx.rotate(-0.8);
      ctx.beginPath();
      ctx.moveTo(-8, -9);
      ctx.quadraticCurveTo(14, -6, 22, 0);
      ctx.quadraticCurveTo(14, 6, -8, 9);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, -8, 0, 22, 0, [[0, 'rgba(255,145,0,0.95)'], [0.6, 'rgba(255,235,59,0.6)'], [1, 'rgba(255,235,59,0)']]);
      ctx.fill();
      ctx.restore();
      rock(ctx, 19, 25, 10, 9);
      glowRing(ctx, 19, 25, 14, '#ff6d00', 0.5);
    });
    mk('p_potion', 20, 24, (ctx) => flask(ctx, 10, 13, 1.05, '#76ff03'));
    mk('p_potion_gold', 20, 24, (ctx) => flask(ctx, 10, 13, 1.05, '#ffc400', { glow: true }));
    mk('p_potion_big', 28, 32, (ctx) => flask(ctx, 14, 18, 1.45, '#00e676', { glow: true }));
    mk('p_brew', 18, 22, (ctx) => flask(ctx, 9, 12, 0.95, '#ff1744', { glow: true }));
    mk('p_water', 22, 12, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(20, 6);
      ctx.quadraticCurveTo(9, 1, 4, 3);
      ctx.quadraticCurveTo(1, 6, 4, 9);
      ctx.quadraticCurveTo(9, 11, 20, 6);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 1, 0, 11, [[0, '#e1f5fe'], [0.5, '#4fc3f7'], [1, '#0277bd']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(1,87,155,0.9)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      D.ellipsePath(ctx, 7, 4.8, 2, 1, -0.2);
      D.fs(ctx, 'rgba(255,255,255,0.9)');
    });
    mk('p_waterball', 26, 26, (ctx) => {
      glowRing(ctx, 13, 13, 13, '#4fc3f7', 0.5);
      D.circlePath(ctx, 13, 13, 9);
      ctx.fillStyle = D.rad(ctx, 10, 10, 1, 13, 13, 9, [[0, '#ffffff'], [0.35, '#81d4fa'], [1, '#0277bd']]);
      ctx.fill();
      ctx.strokeStyle = '#01579b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(13, 13, 6, Math.PI * 1.1, Math.PI * 1.5);
      ctx.stroke();
    });
    // bats fly head first: the drawing is turned so the head points along +x
    mk('p_bat', 22, 34, (ctx) => bat(ctx, 11, 17, 1.05, Math.PI / 2));
    mk('p_bat_big', 28, 44, (ctx) => {
      glowRing(ctx, 14, 22, 14, '#ff1744', 0.35);
      bat(ctx, 14, 22, 1.4, Math.PI / 2, { body: '#4a148c' });
    });

    // ---- effect sprites
    // soaked mutants drip water (the blue cousin of the jelly overlay)
    mk('fx_wet', 44, 24, (ctx) => {
      const rnd = D.rng(11);
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.quadraticCurveTo(22, -2, 40, 6);
      ctx.lineTo(40, 9);
      for (let x = 40; x > 4; x -= 6) {
        const dl = 3 + rnd() * 9;
        ctx.quadraticCurveTo(x - 1, 9 + dl, x - 3, 9 + dl);
        ctx.quadraticCurveTo(x - 5, 9 + dl, x - 6, 9);
      }
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 0, 0, 24, [[0, 'rgba(179,229,252,0.85)'], [1, 'rgba(2,136,209,0.75)']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(1,87,155,0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
      D.ellipsePath(ctx, 14, 5, 6, 1.6, -0.1);
      D.fs(ctx, 'rgba(255,255,255,0.75)');
    });
    mk('fx_caltrops', 24, 16, (ctx) => {
      [[6, 10], [13, 7], [18, 11], [11, 12]].forEach(([x, y], i) => {
        D.starPath(ctx, x, y, 4, 4, 1.2, i * 0.4);
        ctx.fillStyle = D.lin(ctx, x - 4, y - 4, x + 4, y + 4, [[0, '#eceff1'], [1, '#546e7a']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
    });
    mk('fx_bigshuriken', 70, 70, (ctx) => {
      glowRing(ctx, 35, 35, 35, '#b388ff', 0.45);
      shuriken(ctx, 35, 35, 30, 0, false);
      ctx.strokeStyle = 'rgba(179,136,255,0.9)';
      ctx.lineWidth = 2;
      D.circlePath(ctx, 35, 35, 16);
      ctx.stroke();
    });
    mk('fx_geyser', 44, 96, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(10, 96);
      ctx.bezierCurveTo(14, 60, 6, 40, 12, 22);
      ctx.quadraticCurveTo(22, 2, 32, 22);
      ctx.bezierCurveTo(38, 40, 30, 60, 34, 96);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 0, 0, 96, [[0, 'rgba(204,255,144,0.95)'], [0.5, 'rgba(118,255,3,0.9)'], [1, 'rgba(27,94,32,0.85)']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(27,94,32,0.9)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      [[8, 16, 4], [36, 12, 3.5], [22, 6, 3], [4, 34, 3], [40, 30, 2.6]].forEach(([x, y, r]) => {
        D.circlePath(ctx, x, y, r);
        D.fs(ctx, 'rgba(178,255,89,0.95)', 'rgba(27,94,32,0.8)', 1);
      });
    });
    mk('fx_floodwave', 100, 70, (ctx) => {
      // a curling wave rolling to the right
      ctx.beginPath();
      ctx.moveTo(2, 66);
      ctx.bezierCurveTo(6, 30, 40, 4, 76, 10);
      ctx.bezierCurveTo(98, 14, 98, 38, 84, 40);
      ctx.bezierCurveTo(74, 41, 72, 30, 80, 28);
      ctx.bezierCurveTo(60, 24, 50, 46, 70, 66);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 8, 0, 66, [[0, '#e1f5fe'], [0.35, '#4fc3f7'], [1, '#01579b']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 50);
      ctx.bezierCurveTo(22, 30, 44, 16, 70, 16);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        D.circlePath(ctx, 74 + (i % 3) * 7, 8 + Math.floor(i / 3) * 6, 2.4);
        D.fs(ctx, 'rgba(255,255,255,0.9)');
      }
    });
    mk('fx_bloodmoon', 150, 150, (ctx) => {
      glowRing(ctx, 75, 75, 75, '#ff1744', 0.55);
      D.circlePath(ctx, 75, 75, 50);
      ctx.fillStyle = D.rad(ctx, 62, 60, 4, 75, 75, 50, [[0, '#ff8a80'], [0.55, '#d32f2f'], [1, '#7f0000']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.stroke();
      [[60, 62, 9], [88, 84, 12], [70, 98, 6], [94, 58, 5]].forEach(([x, y, r]) => {
        D.circlePath(ctx, x, y, r);
        D.fs(ctx, 'rgba(127,0,0,0.45)');
      });
      [[30, 30, 1.2, -0.3], [124, 40, 1, 0.3], [116, 120, 1.1, 0.2]].forEach(([x, y, s, r]) => bat(ctx, x, y, s, r));
    });

    // ---- ability badges
    const ab = (key, c1, c2, fn) => mk(key, 56, 56, (ctx) => {
      D.circlePath(ctx, 28, 28, 26);
      ctx.fillStyle = D.rad(ctx, 21, 17, 2, 28, 28, 28, [[0, c1], [1, c2]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      D.ellipsePath(ctx, 22, 14, 12, 5.6, -0.3);
      D.fs(ctx, 'rgba(255,255,255,0.35)');
      fn(ctx);
    });
    ab('ab_shadow', '#d1c4e9', '#311b92', (ctx) => {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, 40);
      ctx.lineTo(42, 14);
      ctx.stroke();
      shuriken(ctx, 32, 34, 9, 0.3, false);
    });
    ab('ab_cuts', '#ede7f6', '#4527a0', (ctx) => {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.6;
      [[10, 36, 40, 10], [14, 46, 46, 18], [18, 26, 44, 40]].forEach(([x0, y0, x1, y1]) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });
      shuriken(ctx, 28, 28, 8, 0, true);
    });
    ab('ab_meteor', '#ffe0b2', '#bf360c', (ctx) => ctx.drawImage(img('p_meteor'), 6, 6, 44, 44));
    ab('ab_golden', '#fff8e1', '#ff8f00', (ctx) => {
      glowRing(ctx, 28, 28, 20, '#fff59d', 0.8);
      banana(ctx, 28, 30, 1.6, -0.3, '#ffc400');
      D.starPath(ctx, 40, 14, 4, 5, 1.6);
      D.fs(ctx, '#ffffff');
    });
    ab('ab_potionrain', '#ccff90', '#1b5e20', (ctx) => {
      flask(ctx, 18, 22, 1.2, '#76ff03', { rot: -0.4 });
      flask(ctx, 36, 32, 1.2, '#ffc400', { rot: 0.4 });
    });
    ab('ab_siren', '#ffcdd2', '#b71c1c', (ctx) => {
      glowRing(ctx, 20, 26, 14, '#ff1744', 0.8);
      glowRing(ctx, 36, 26, 14, '#2979ff', 0.8);
      D.rrPath(ctx, 12, 28, 32, 9, 3);
      D.fs(ctx, '#455a64', OL, 1.4);
      ctx.beginPath();
      ctx.arc(21, 28, 7, Math.PI, 0);
      ctx.closePath();
      D.fs(ctx, '#ff1744', OL, 1.4);
      ctx.beginPath();
      ctx.arc(35, 28, 7, Math.PI, 0);
      ctx.closePath();
      D.fs(ctx, '#2979ff', OL, 1.4);
    });
    ab('ab_bats', '#d1c4e9', '#1a0033', (ctx) => {
      bat(ctx, 28, 30, 1.5, 0);
      bat(ctx, 14, 16, 0.7, -0.3);
      bat(ctx, 42, 15, 0.7, 0.3);
    });
    ab('ab_bloodmoon', '#ffcdd2', '#4a0000', (ctx) => ctx.drawImage(img('fx_bloodmoon'), 0, 0, 56, 56));
  }

  MT.FXArt.generate3 = generate;
  TA.props.shuriken = shuriken;
  TA.props.bat = bat;
  TA.props.flask = flask;
  TA.props.cauldron = cauldron;
  TA.props.wheel = wheel;
  TA.props.woodBeam = woodBeam;
  TA.props.rock = rock;
  TA.props.colossal = colossal;
  TA.props.flames = flames;
  TA.props.firePot = firePot;
  TA.props.fireHelmet = fireHelmet;
  TA.props.hydrant = hydrant;
  TA.props.waterDrops = waterDrops;
  TA.props.tombstone = tombstone;
})();
