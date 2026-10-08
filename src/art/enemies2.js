// Artwork for the tactical mutants (Glider, Jetpack, Mole, Shield Carrier),
// the three Boss Battle villains and the boss attack effects.
(function () {
  const D = MT.Draw;
  const OL = D.OL;
  const EA = MT.EnemyArt;
  const { metalPlate, bossDamage, drawPurple } = EA.helpers;

  const fortPlate = (c2, x, y, ww, hh, o) => {
    if (o.fort) metalPlate(c2, x - ww * 0.3, y + hh * 0.07, ww * 0.6, hh * 0.2, false);
  };

  // ---------------------------------------------------------------- mutants
  function batWings(ctx, cx, cy, w, h) {
    for (const s of [-1, 1]) {
      const rx = cx + s * w * 0.3, ry = cy - h * 0.08;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(cx + s * w * 0.8, cy - h * 0.55, cx + s * w * 1.28, cy - h * 0.32);
      // scalloped trailing edge
      const tips = [[1.28, -0.32], [1.08, 0.06], [0.82, 0.02], [0.6, 0.18], [0.36, 0.1]];
      for (let i = 1; i < tips.length; i++) {
        const [ax, ay] = tips[i - 1], [bx, by] = tips[i];
        ctx.quadraticCurveTo(cx + s * w * ((ax + bx) / 2), cy + h * ((ay + by) / 2 - 0.12), cx + s * w * bx, cy + h * by);
      }
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, cx, cy - h * 0.5, cx, cy + h * 0.2, [[0, '#8e4fc4'], [1, '#3b1658']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      // wing bones
      ctx.strokeStyle = 'rgba(25,8,40,0.65)';
      ctx.lineWidth = 1;
      [[1.08, 0.06], [0.82, 0.02], [0.6, 0.18]].forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.moveTo(cx + s * w * 1.0, cy - h * 0.36);
        ctx.lineTo(cx + s * w * bx, cy + h * by);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(cx + s * w * 1.0, cy - h * 0.36);
      ctx.stroke();
    }
  }

  function jetpackBack(ctx, cx, cy, w, h) {
    for (const s of [-1, 1]) {
      const tx = cx + s * w * 0.46, ty = cy - h * 0.18;
      // flame
      const fy = ty + h * 0.58;
      ctx.beginPath();
      ctx.moveTo(tx - w * 0.11, fy);
      ctx.quadraticCurveTo(tx, fy + h * 0.75, tx + w * 0.11, fy);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, fy, 0, fy + h * 0.6, [[0, '#fff7c2'], [0.35, '#ffb02e'], [1, 'rgba(255,90,0,0)']]);
      ctx.fill();
      // tank
      D.capsulePath(ctx, tx, ty + h * 0.2, w * 0.3, h * 0.66);
      ctx.fillStyle = D.lin(ctx, tx - w * 0.15, 0, tx + w * 0.15, 0, [[0, '#ff8a65'], [0.5, '#e53935'], [1, '#8e1c1c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      D.rrPath(ctx, tx - w * 0.12, ty + h * 0.5, w * 0.24, h * 0.1, 2);
      D.fs(ctx, '#9aa4ae', OL, 1);
    }
  }

  function jetpackFront(c2, x, y, ww, hh, o) {
    // harness straps across the chest
    c2.strokeStyle = '#3e2723';
    c2.lineWidth = ww * 0.09;
    c2.beginPath();
    c2.moveTo(x - ww * 0.42, y - hh * 0.06);
    c2.lineTo(x + ww * 0.3, y + hh * 0.22);
    c2.moveTo(x + ww * 0.42, y - hh * 0.06);
    c2.lineTo(x - ww * 0.3, y + hh * 0.22);
    c2.stroke();
    D.circlePath(c2, x, y + hh * 0.1, ww * 0.09);
    D.fs(c2, '#ffd83a', OL, 1);
    fortPlate(c2, x, y, ww, hh, o);
  }

  function miningHelmet(c2, x, y, ww, hh, o) {
    const top = y - hh / 2;
    c2.beginPath();
    c2.moveTo(x - ww * 0.56, top + hh * 0.12);
    c2.quadraticCurveTo(x - ww * 0.5, top - hh * 0.16, x, top - hh * 0.17);
    c2.quadraticCurveTo(x + ww * 0.5, top - hh * 0.16, x + ww * 0.56, top + hh * 0.12);
    c2.closePath();
    c2.fillStyle = D.lin(c2, x - ww / 2, 0, x + ww / 2, 0, [[0, '#fff3a0'], [0.5, '#ffc61a'], [1, '#b8860b']]);
    c2.fill();
    c2.strokeStyle = OL;
    c2.lineWidth = 1.2;
    c2.stroke();
    D.rrPath(c2, x - ww * 0.66, top + hh * 0.09, ww * 1.32, hh * 0.06, 2);
    D.fs(c2, '#e0a800', OL, 1);
    // head lamp
    D.circlePath(c2, x, top - hh * 0.02, ww * 0.12);
    D.fs(c2, '#90a4ae', OL, 1);
    D.circlePath(c2, x, top - hh * 0.02, ww * 0.08);
    c2.fillStyle = D.rad(c2, x - 1, top - hh * 0.03, 0.5, x, top - hh * 0.02, ww * 0.08, [[0, '#ffffff'], [1, '#fff59d']]);
    c2.fill();
    // dirt smudges
    for (let i = 0; i < 3; i++) {
      D.ellipsePath(c2, x - ww * 0.3 + i * ww * 0.28, y + hh * (0.2 + (i % 2) * 0.1), ww * 0.08, hh * 0.04);
      D.fs(c2, 'rgba(90,55,25,0.45)');
    }
    fortPlate(c2, x, y, ww, hh, o);
  }

  function moleClaws(ctx, cx, cy, w, h) {
    [[cx - w * 0.72, cy + h * 0.22, -1], [cx + w * 0.78, cy - h * 0.12, 1]].forEach(([x, y, s]) => {
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(x + s * 2, y + k * 3);
        ctx.quadraticCurveTo(x + s * 8, y + k * 4 - 2, x + s * 10, y + k * 5 + 2);
        ctx.lineTo(x + s * 4, y + k * 3 + 1.5);
        ctx.closePath();
        D.fs(ctx, '#f1e4c8', OL, 0.9);
      }
    });
  }

  function shieldAntenna(c2, x, y, ww, hh, o) {
    const top = y - hh / 2;
    c2.strokeStyle = OL;
    c2.lineWidth = 2.6;
    c2.beginPath();
    c2.moveTo(x + ww * 0.1, top + hh * 0.06);
    c2.lineTo(x + ww * 0.22, top - hh * 0.38);
    c2.stroke();
    c2.strokeStyle = '#b0bec5';
    c2.lineWidth = 1.3;
    c2.stroke();
    const ox = x + ww * 0.22, oy = top - hh * 0.42;
    D.circlePath(c2, ox, oy, ww * 0.3);
    c2.fillStyle = D.rad(c2, ox, oy, 0, ox, oy, ww * 0.3, [[0, 'rgba(160,230,255,0.7)'], [1, 'rgba(110,203,255,0)']]);
    c2.fill();
    D.circlePath(c2, ox, oy, ww * 0.13);
    c2.fillStyle = D.rad(c2, ox - 1, oy - 1, 0.5, ox, oy, ww * 0.13, [[0, '#ffffff'], [0.5, '#80d8ff'], [1, '#1e88e5']]);
    c2.fill();
    c2.strokeStyle = OL;
    c2.lineWidth = 1;
    c2.stroke();
    fortPlate(c2, x, y, ww, hh, o);
  }

  function hexShield(ctx, cx, cy, w, h) {
    const x = cx + w * 0.72, y = cy + h * 0.04, r = w * 0.48;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const px = x + Math.cos(a) * r * 0.8, py = y + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - r, y - r, x + r, y + r, [[0, 'rgba(200,240,255,0.85)'], [1, 'rgba(40,140,220,0.75)']]);
    ctx.fill();
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.8;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, y + i * r * 0.4);
      ctx.lineTo(x + r * 0.5, y + i * r * 0.4);
      ctx.stroke();
    }
    D.circlePath(ctx, x, y, r * 0.18);
    D.fs(ctx, '#e1f5fe', '#0d47a1', 1);
  }

  Object.assign(EA.SPEC, {
    glider: { w: 20, h: 25, skin: '#9b4fd0', eyes: 1, mouth: 'teeth', hairLen: 0.7, armsUp: true, noShadow: true, before: batWings },
    jetpack: { w: 25, h: 32, skin: '#7b3fb0', eyes: 2, mouth: 'roar', hairLen: 0.5, noShadow: true, before: jetpackBack, after: jetpackFront },
    mole: { w: 24, h: 30, skin: '#8a4fb0', eyes: 2, mouth: 'teeth', hairLen: 0.5, after: miningHelmet, front: moleClaws },
    shield: { w: 27, h: 34, skin: '#6a3fa0', eyes: 1, mouth: 'roar', hairLen: 0.8, after: shieldAntenna, front: hexShield },
  });

  // ---------------------------------------------------------------- villains
  function eye(ctx, x, y, r, o = {}) {
    D.ellipsePath(ctx, x, y, r, r * (o.squash || 1));
    D.fs(ctx, '#ffffff', OL, 1.2);
    D.circlePath(ctx, x + (o.lx || 0) * r * 0.35, y + (o.ly || 0) * r * 0.3, r * (o.pupil || 0.45));
    D.fs(ctx, o.iris || '#3e2723');
    D.circlePath(ctx, x + (o.lx || 0) * r * 0.35 - r * 0.15, y - r * 0.15, r * 0.14);
    D.fs(ctx, '#ffffff');
    if (o.lid) {
      ctx.save();
      D.ellipsePath(ctx, x, y, r, r * (o.squash || 1));
      ctx.clip();
      ctx.fillStyle = o.lid;
      ctx.fillRect(x - r, y - r * 1.2, r * 2, r * (o.lidDepth || 0.9));
      ctx.restore();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x - r, y - r * 1.2 + r * (o.lidDepth || 0.9));
      ctx.lineTo(x + r, y - r * 1.2 + r * (o.lidDepth || 0.9));
      ctx.stroke();
    }
  }

  function leg(ctx, x, top, bot, w, col, shoe) {
    D.rrPath(ctx, x - w / 2, top, w, bot - top, w * 0.4);
    ctx.fillStyle = D.lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, D.shade(col, 0.2)], [1, D.shade(col, -0.25)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.ellipsePath(ctx, x + 3, bot + 1, w * 0.85, w * 0.42);
    D.fs(ctx, shoe, OL, 1.4);
    D.ellipsePath(ctx, x + 1, bot - 1.5, w * 0.4, w * 0.12);
    D.fs(ctx, 'rgba(255,255,255,0.45)');
  }

  function bossGeo(sp, o) {
    return { cx: o.tw / 2, foot: o.foot, rnd: D.rng(o.seed), dmg: o.damage || 0 };
  }

  // -------- Mutant Vector: orange tracksuit, bowl cut, glasses, squid launcher
  function vector(ctx, sp, o) {
    const { cx, foot, rnd, dmg } = bossGeo(sp, o);
    D.shadow(ctx, cx, foot - 2, 40, 9, 0.35);
    const suit = '#ff8a2a';
    // legs
    [-1, 1].forEach((s) => {
      leg(ctx, cx + s * 10, foot - 50, foot - 8, 14, suit, '#f5f5f5');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + s * 10 + (s > 0 ? 3 : -5), foot - 48, 2.5, 38);
    });
    // back arm
    D.limb(ctx, cx - 22, foot - 96, cx - 30, foot - 58, 10, suit, { bend: [cx - 34, foot - 80], glove: true, gloveColor: '#b07ad6' });
    // pear-shaped body
    ctx.beginPath();
    ctx.moveTo(cx - 20, foot - 108);
    ctx.quadraticCurveTo(cx - 36, foot - 70, cx - 30, foot - 46);
    ctx.quadraticCurveTo(cx, foot - 36, cx + 30, foot - 46);
    ctx.quadraticCurveTo(cx + 36, foot - 70, cx + 20, foot - 108);
    ctx.quadraticCurveTo(cx, foot - 114, cx - 20, foot - 108);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 34, 0, cx + 34, 0, [[0, '#ffb066'], [0.45, suit], [1, '#c4500e']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // zipper + collar stripes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, foot - 108);
    ctx.lineTo(cx, foot - 42);
    ctx.stroke();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    D.rrPath(ctx, cx - 16, foot - 112, 32, 7, 3);
    D.fs(ctx, '#ffffff', OL, 1.2);
    // head
    const hx = cx + 2, hy = foot - 136, R = 29;
    const skin = '#b07ad6';
    D.ellipsePath(ctx, hx, hy, R, R * 1.05);
    ctx.fillStyle = D.rad(ctx, hx - 9, hy - 10, 3, hx, hy, R * 1.1, [[0, '#dcb6f2'], [0.6, skin], [1, '#6a3a90']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // bowl haircut gone wild
    ctx.beginPath();
    ctx.moveTo(hx - R - 2, hy + 4);
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * (1 + i / 16);
      const rr = R + 4 + (i % 2 ? 6 + rnd() * 4 : 0);
      ctx.lineTo(hx + Math.cos(a) * rr, hy - 4 + Math.sin(a) * rr * 1.05);
    }
    ctx.lineTo(hx + R + 2, hy + 4);
    ctx.lineTo(hx + R - 4, hy - 8);
    ctx.lineTo(hx - R + 4, hy - 8);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, hy - R, 0, hy, [[0, '#4a2a6a'], [1, '#22102f']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // big glasses
    [-1, 1].forEach((s) => {
      const gx = hx + s * 12, gy = hy + 2;
      D.circlePath(ctx, gx, gy, 10.5);
      D.fs(ctx, '#ffffff', '#111', 3.2);
      D.circlePath(ctx, gx + 2.5, gy + 1, 2.6);
      D.fs(ctx, '#111');
      D.circlePath(ctx, gx + 1.5, gy, 0.9);
      D.fs(ctx, '#fff');
    });
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy + 1);
    ctx.lineTo(hx + 2, hy + 1);
    ctx.stroke();
    // grin with buck teeth
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy + 16);
    ctx.quadraticCurveTo(hx, hy + 28, hx + 15, hy + 14);
    ctx.quadraticCurveTo(hx, hy + 20, hx - 13, hy + 16);
    ctx.closePath();
    D.fs(ctx, '#4a1020', OL, 1.4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(hx - 4, hy + 17, 3.6, 4.5);
    ctx.fillRect(hx + 0.4, hy + 17, 3.6, 4.5);
    // squid launcher held forward
    const gx = cx + 14, gy = foot - 84;
    D.rrPath(ctx, gx, gy, 46, 18, 5);
    ctx.fillStyle = D.lin(ctx, 0, gy, 0, gy + 18, [[0, '#64b5f6'], [1, '#1565c0']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx + 44, gy - 2);
    ctx.lineTo(gx + 58, gy - 8);
    ctx.lineTo(gx + 58, gy + 26);
    ctx.lineTo(gx + 44, gy + 20);
    ctx.closePath();
    D.fs(ctx, '#ff8a2a', OL, 1.5);
    // glass tank with a squid inside
    D.rrPath(ctx, gx + 8, gy - 16, 22, 16, 5);
    D.fs(ctx, 'rgba(180,230,255,0.75)', OL, 1.4);
    D.ellipsePath(ctx, gx + 19, gy - 9, 5, 4);
    D.fs(ctx, '#f06292', OL, 0.9);
    D.rrPath(ctx, gx + 10, gy + 16, 8, 12, 2);
    D.fs(ctx, '#37474f', OL, 1.2);
    // front arm holding it
    D.limb(ctx, cx + 20, foot - 98, gx + 12, gy + 12, 10, suit, { bend: [cx + 26, foot - 76], glove: true, gloveColor: '#b07ad6' });
    bossDamage(ctx, cx, foot - 76, 52, 60, dmg, rnd);
    if (o.fort) metalPlate(ctx, cx - 16, foot - 96, 32, 16, true);
  }

  // -------- Balthazar Bratt: shoulder pads, mullet, mustache, keytar
  function bratt(ctx, sp, o) {
    const { cx, foot, rnd, dmg } = bossGeo(sp, o);
    D.shadow(ctx, cx, foot - 2, 44, 10, 0.35);
    const suit = '#8e44ad';
    [-1, 1].forEach((s) => leg(ctx, cx + s * 11, foot - 54, foot - 8, 16, suit, '#ffffff'));
    // V-shaped torso with huge shoulder pads
    ctx.beginPath();
    ctx.moveTo(cx - 36, foot - 120);
    ctx.lineTo(cx + 36, foot - 120);
    ctx.quadraticCurveTo(cx + 30, foot - 80, cx + 20, foot - 50);
    ctx.lineTo(cx - 20, foot - 50);
    ctx.quadraticCurveTo(cx - 30, foot - 80, cx - 36, foot - 120);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 36, 0, cx + 36, 0, [[0, '#b97ad8'], [0.45, suit], [1, '#4a1d6b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(cx + s * 20, foot - 124);
      ctx.quadraticCurveTo(cx + s * 50, foot - 132, cx + s * 46, foot - 108);
      ctx.lineTo(cx + s * 30, foot - 104);
      ctx.closePath();
      D.fs(ctx, '#ff4fa3', OL, 1.6);
    });
    // open collar + gold chain
    ctx.beginPath();
    ctx.moveTo(cx - 9, foot - 120);
    ctx.lineTo(cx, foot - 100);
    ctx.lineTo(cx + 9, foot - 120);
    ctx.closePath();
    D.fs(ctx, '#f2c393', OL, 1.2);
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, foot - 118, 8, 0.3, Math.PI - 0.3);
    ctx.stroke();
    // belt
    D.rrPath(ctx, cx - 21, foot - 58, 42, 7, 2);
    D.fs(ctx, '#ff4fa3', OL, 1.2);
    D.rrPath(ctx, cx - 5, foot - 59, 10, 9, 2);
    D.fs(ctx, '#e0e0e0', OL, 1);
    // head
    const hx = cx, hy = foot - 146, R = 25;
    const skin = '#f2c393';
    // mullet: long locks behind the ears falling onto the shoulder pads
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(hx + s * (R - 4), hy - 8);
      ctx.quadraticCurveTo(hx + s * (R + 9), hy + 6, hx + s * (R + 8), hy + 30);
      ctx.lineTo(hx + s * (R + 1), hy + 34);
      ctx.lineTo(hx + s * (R - 2), hy + 26);
      ctx.quadraticCurveTo(hx + s * (R - 1), hy + 10, hx + s * (R - 10), hy + 2);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, hy - 10, 0, hy + 34, [[0, '#8d6e63'], [1, '#4e342e']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    D.ellipsePath(ctx, hx, hy, R, R * 1.1);
    ctx.fillStyle = D.rad(ctx, hx - 8, hy - 12, 2, hx, hy, R * 1.15, [[0, '#ffe3c4'], [0.6, skin], [1, '#c98e5c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // shiny bald top with side tufts
    D.ellipsePath(ctx, hx - 6, hy - 18, 8, 4, -0.3);
    D.fs(ctx, 'rgba(255,255,255,0.55)');
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(hx + s * (R - 1), hy - 10);
      ctx.quadraticCurveTo(hx + s * (R + 5), hy - 2, hx + s * (R - 2), hy + 10);
      ctx.lineTo(hx + s * (R - 6), hy - 4);
      ctx.closePath();
      D.fs(ctx, '#6d4c41', OL, 1);
    });
    // smug half-lidded eyes and thick brows
    [-1, 1].forEach((s) => {
      eye(ctx, hx + s * 9, hy - 2, 6, { lx: 0.4, lid: skin, lidDepth: 1.05, iris: '#4e342e' });
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx + s * 3, hy - 10 + (s > 0 ? -2 : 0));
      ctx.lineTo(hx + s * 15, hy - 11);
      ctx.stroke();
    });
    // big mustache and a smirk
    ctx.beginPath();
    ctx.moveTo(hx, hy + 8);
    ctx.bezierCurveTo(hx - 8, hy + 5, hx - 16, hy + 10, hx - 15, hy + 17);
    ctx.bezierCurveTo(hx - 9, hy + 13, hx - 4, hy + 13, hx, hy + 12);
    ctx.bezierCurveTo(hx + 4, hy + 13, hx + 9, hy + 13, hx + 15, hy + 17);
    ctx.bezierCurveTo(hx + 16, hy + 10, hx + 8, hy + 5, hx, hy + 8);
    ctx.closePath();
    D.fs(ctx, '#5d4037', OL, 1.2);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy + 19);
    ctx.quadraticCurveTo(hx + 2, hy + 22, hx + 9, hy + 17);
    ctx.stroke();
    // bubblegum bubble
    D.circlePath(ctx, hx + 13, hy + 20, 6);
    D.fs(ctx, 'rgba(255,128,200,0.9)', OL, 1.1);
    D.circlePath(ctx, hx + 11, hy + 18, 1.6);
    D.fs(ctx, '#ffffff');
    // keytar across the body
    ctx.save();
    ctx.translate(cx + 4, foot - 82);
    ctx.rotate(-0.42);
    D.rrPath(ctx, -40, -9, 58, 20, 5);
    ctx.fillStyle = D.lin(ctx, 0, -9, 0, 11, [[0, '#ff7cc4'], [1, '#d81b60']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.rrPath(ctx, -34, -4, 40, 9, 1);
    D.fs(ctx, '#ffffff', OL, 1);
    ctx.fillStyle = '#111';
    for (let k = 0; k < 7; k++) ctx.fillRect(-31 + k * 5.4, -4, 2.2, 5);
    D.rrPath(ctx, 18, -4, 30, 7, 2);
    D.fs(ctx, '#e0e0e0', OL, 1.2);
    ctx.restore();
    // arms: one on the keys, one on the neck
    D.limb(ctx, cx - 30, foot - 112, cx - 16, foot - 72, 11, suit, { bend: [cx - 38, foot - 86], glove: true, gloveColor: skin });
    D.limb(ctx, cx + 30, foot - 112, cx + 34, foot - 98, 11, suit, { bend: [cx + 44, foot - 98], glove: true, gloveColor: skin });
    bossDamage(ctx, cx, foot - 84, 54, 60, dmg, rnd);
    if (o.fort) metalPlate(ctx, cx - 18, foot - 104, 36, 16, true);
  }

  // -------- Scarlet Overkill: red rocket dress, black bob, lava lamp
  function scarlet(ctx, sp, o) {
    const { cx, foot, rnd, dmg } = bossGeo(sp, o);
    const red = '#e53935';
    // rocket flames under the dress
    [-18, 0, 18].forEach((dx) => {
      const fx = cx + dx, fy = foot - 26;
      ctx.beginPath();
      ctx.moveTo(fx - 6, fy);
      ctx.quadraticCurveTo(fx, fy + 30, fx + 6, fy);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, fy, 0, fy + 28, [[0, '#fffbe0'], [0.35, '#ffb02e'], [1, 'rgba(255,80,0,0)']]);
      ctx.fill();
      D.rrPath(ctx, fx - 6, fy - 8, 12, 9, 2);
      D.fs(ctx, '#9aa4ae', OL, 1.2);
    });
    // bell skirt
    ctx.beginPath();
    ctx.moveTo(cx - 14, foot - 76);
    ctx.quadraticCurveTo(cx - 30, foot - 50, cx - 36, foot - 30);
    ctx.quadraticCurveTo(cx, foot - 22, cx + 36, foot - 30);
    ctx.quadraticCurveTo(cx + 30, foot - 50, cx + 14, foot - 76);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 36, 0, cx + 36, 0, [[0, '#ff7a6e'], [0.45, red], [1, '#8e1414']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80,0,0,0.4)';
    ctx.lineWidth = 1;
    [-18, -6, 6, 18].forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * 0.35, foot - 74);
      ctx.quadraticCurveTo(cx + dx * 0.9, foot - 50, cx + dx * 1.6, foot - 28);
      ctx.stroke();
    });
    // bodice
    ctx.beginPath();
    ctx.moveTo(cx - 15, foot - 104);
    ctx.quadraticCurveTo(cx - 8, foot - 98, cx, foot - 104);
    ctx.quadraticCurveTo(cx + 8, foot - 98, cx + 15, foot - 104);
    ctx.lineTo(cx + 13, foot - 74);
    ctx.lineTo(cx - 13, foot - 74);
    ctx.closePath();
    D.fs(ctx, red, OL, 1.6);
    D.rrPath(ctx, cx - 14, foot - 80, 28, 6, 2);
    D.fs(ctx, '#ffd54f', OL, 1);
    // shoulders and neck
    const skin = '#f8d5bd';
    D.ellipsePath(ctx, cx, foot - 108, 16, 7);
    D.fs(ctx, skin, OL, 1.4);
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 4, foot - 118, 8, 10);
    // arms: hand on hip, the other raising a lava lamp
    D.limb(ctx, cx - 15, foot - 106, cx - 14, foot - 78, 7, red, { bend: [cx - 30, foot - 92], glove: true, gloveColor: red });
    D.limb(ctx, cx + 15, foot - 106, cx + 30, foot - 128, 7, red, { bend: [cx + 32, foot - 106], glove: true, gloveColor: red });
    const lx = cx + 31, ly = foot - 140;
    D.rrPath(ctx, lx - 5, ly - 14, 10, 22, 5);
    ctx.fillStyle = D.lin(ctx, 0, ly - 14, 0, ly + 8, [[0, '#ffcc80'], [1, '#ff5722']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    D.circlePath(ctx, lx - 1, ly - 6, 2.4);
    D.fs(ctx, '#d50000');
    D.circlePath(ctx, lx + 1.5, ly + 1, 1.8);
    D.fs(ctx, '#d50000');
    D.rrPath(ctx, lx - 6, ly + 7, 12, 5, 2);
    D.fs(ctx, '#b0bec5', OL, 1);
    // head
    const hx = cx, hy = foot - 136, R = 20;
    // black bob behind
    ctx.beginPath();
    ctx.moveTo(hx - R - 4, hy + 14);
    ctx.quadraticCurveTo(hx - R - 8, hy - R - 6, hx, hy - R - 8);
    ctx.quadraticCurveTo(hx + R + 8, hy - R - 6, hx + R + 4, hy + 14);
    ctx.quadraticCurveTo(hx, hy + 18, hx - R - 4, hy + 14);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, hy - R, 0, hy + 16, [[0, '#3a3a46'], [1, '#0f0f14']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    D.ellipsePath(ctx, hx, hy + 2, R * 0.86, R);
    ctx.fillStyle = D.rad(ctx, hx - 6, hy - 6, 2, hx, hy, R, [[0, '#fff1e6'], [1, '#e8b89a']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // bangs
    ctx.beginPath();
    ctx.moveTo(hx - R + 1, hy - 2);
    ctx.quadraticCurveTo(hx - R + 2, hy - R - 2, hx, hy - R - 3);
    ctx.quadraticCurveTo(hx + R - 2, hy - R - 2, hx + R - 1, hy - 2);
    ctx.lineTo(hx + R - 4, hy - 7);
    ctx.quadraticCurveTo(hx, hy - 11, hx - R + 4, hy - 7);
    ctx.closePath();
    D.fs(ctx, '#1d1d26', OL, 1.2);
    // red headband
    ctx.strokeStyle = red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hx, hy + 2, R * 0.95, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    // eyes with lashes, red lips
    [-1, 1].forEach((s) => {
      eye(ctx, hx + s * 7, hy + 1, 4.6, { lx: 0.5, iris: '#2e7d32', squash: 1.1 });
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.3;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(hx + s * (5 + k * 2.5), hy - 3.6);
        ctx.lineTo(hx + s * (5 + k * 3), hy - 6.5);
        ctx.stroke();
      }
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(hx + s * 3, hy - 7);
      ctx.quadraticCurveTo(hx + s * 8, hy - 11, hx + s * 12, hy - 7);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy + 11);
    ctx.quadraticCurveTo(hx, hy + 9, hx + 6, hy + 11);
    ctx.quadraticCurveTo(hx, hy + 16, hx - 6, hy + 11);
    ctx.closePath();
    D.fs(ctx, '#d50000', OL, 1);
    D.circlePath(ctx, hx - R * 0.86, hy + 8, 2);
    D.fs(ctx, '#ffd54f', OL, 0.8);
    D.circlePath(ctx, hx + R * 0.86, hy + 8, 2);
    D.fs(ctx, '#ffd54f', OL, 0.8);
    bossDamage(ctx, cx, foot - 74, 46, 56, dmg, rnd);
    if (o.fort) metalPlate(ctx, cx - 14, foot - 96, 28, 14, true);
  }

  Object.assign(EA.SPEC, {
    vector: { w: 56, h: 100, boss: true, painter: vector },
    bratt: { w: 60, h: 106, boss: true, painter: bratt },
    scarlet: { w: 54, h: 98, boss: true, painter: scarlet },
  });

  // ---------------------------------------------------------------- effect textures
  function generate(scene) {
    const mk = (key, w, h, fn) => D.make(scene, key, w, h, fn);
    // travelling dirt mound of a digging mole
    mk('fx_mound', 60, 32, (ctx) => {
      const rnd = D.rng(31);
      D.shadow(ctx, 30, 24, 26, 6, 0.3);
      ctx.beginPath();
      ctx.moveTo(4, 26);
      ctx.quadraticCurveTo(14, 4, 30, 6);
      ctx.quadraticCurveTo(46, 4, 56, 26);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 6, 0, 26, [[0, '#a1774a'], [1, '#5d3e1e']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      for (let i = 0; i < 9; i++) {
        D.blobPath(ctx, 10 + rnd() * 40, 10 + rnd() * 14, 2 + rnd() * 2.5, 6, 0.4, rnd);
        D.fs(ctx, rnd() > 0.5 ? '#7a5230' : '#c49a6c', OL, 0.6);
      }
      // a purple hand clawing out
      D.circlePath(ctx, 34, 8, 4);
      D.fs(ctx, '#8a4fb0', OL, 1);
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(34 + k * 2.5, 5);
        ctx.lineTo(35 + k * 3.5, 0.5);
        ctx.lineTo(36 + k * 2.5, 5);
        D.fs(ctx, '#f1e4c8', OL, 0.6);
      }
    });
    // shield dome (white, tinted at runtime)
    mk('fx_bubble', 128, 128, (ctx) => {
      D.circlePath(ctx, 64, 64, 62);
      ctx.fillStyle = D.rad(ctx, 64, 64, 20, 64, 64, 62, [[0, 'rgba(255,255,255,0.04)'], [0.75, 'rgba(255,255,255,0.18)'], [0.95, 'rgba(255,255,255,0.65)'], [1, 'rgba(255,255,255,0.2)']]);
      ctx.fill();
      ctx.save();
      D.circlePath(ctx, 64, 64, 60);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.2;
      const s = 14;
      for (let row = -1; row < 11; row++) {
        for (let col = -1; col < 11; col++) {
          const x = col * s * 1.5, y = row * s * 1.73 + (col % 2 ? s * 0.86 : 0);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s;
            if (i) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(64, 64, 50, Math.PI * 1.1, Math.PI * 1.4);
      ctx.stroke();
    });
    // squid ink covering a tower
    mk('fx_inksplat', 56, 48, (ctx) => {
      const rnd = D.rng(7);
      D.blobPath(ctx, 28, 24, 20, 11, 0.35, rnd);
      ctx.fillStyle = D.rad(ctx, 24, 20, 2, 28, 24, 22, [[0, '#4a3f6b'], [1, '#1a1426']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const x = 12 + rnd() * 32;
        D.capsulePath(ctx, x, 40 + rnd() * 3, 3.5, 9 + rnd() * 5);
        D.fs(ctx, '#1f182e');
      }
      D.ellipsePath(ctx, 20, 16, 6, 3, -0.4);
      D.fs(ctx, 'rgba(255,255,255,0.35)');
      // the squid sitting on top
      D.ellipsePath(ctx, 34, 11, 7, 6);
      D.fs(ctx, '#f06292', OL, 1);
      D.circlePath(ctx, 32, 10, 1.6);
      D.fs(ctx, '#fff', OL, 0.5);
      D.circlePath(ctx, 36.5, 10, 1.6);
      D.fs(ctx, '#fff', OL, 0.5);
    });
    // a bubblegum bubble trapping a tower
    mk('fx_gumbubble', 64, 64, (ctx) => {
      D.circlePath(ctx, 32, 32, 29);
      ctx.fillStyle = D.rad(ctx, 24, 22, 3, 32, 32, 30, [[0, 'rgba(255,220,240,0.55)'], [0.7, 'rgba(255,120,200,0.5)'], [1, 'rgba(230,60,150,0.8)']]);
      ctx.fill();
      ctx.strokeStyle = '#c2185b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(32, 32, 22, Math.PI * 1.1, Math.PI * 1.45);
      ctx.stroke();
      D.circlePath(ctx, 44, 20, 3);
      D.fs(ctx, 'rgba(255,255,255,0.8)');
    });
    // molten lava dripping over a tower
    mk('fx_meltdown', 56, 48, (ctx) => {
      const rnd = D.rng(11);
      ctx.save();
      ctx.shadowColor = 'rgba(255,110,0,0.9)';
      ctx.shadowBlur = 10;
      D.blobPath(ctx, 28, 20, 18, 10, 0.3, rnd);
      ctx.fillStyle = D.rad(ctx, 26, 16, 2, 28, 20, 20, [[0, '#fff36b'], [0.45, '#ff9800'], [1, '#d84315']]);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#7a1f00';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        D.capsulePath(ctx, 14 + i * 9, 36 + (i % 2) * 3, 4, 12);
        ctx.fillStyle = D.lin(ctx, 0, 30, 0, 44, [[0, '#ff9800'], [1, '#bf360c']]);
        ctx.fill();
      }
      for (let i = 0; i < 4; i++) {
        D.circlePath(ctx, 18 + rnd() * 20, 12 + rnd() * 14, 1.5 + rnd() * 2);
        D.fs(ctx, 'rgba(90,20,0,0.6)');
      }
    });
    mk('fx_gumball', 22, 22, (ctx) => {
      D.circlePath(ctx, 11, 11, 9);
      ctx.fillStyle = D.rad(ctx, 8, 8, 1, 11, 11, 9, [[0, '#ffd1ec'], [0.6, '#ff4fa3'], [1, '#ad1457']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      D.circlePath(ctx, 8, 7, 2.2);
      D.fs(ctx, 'rgba(255,255,255,0.8)');
    });
    mk('fx_lavalamp', 20, 32, (ctx) => {
      ctx.save();
      ctx.shadowColor = 'rgba(255,90,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(7, 6);
      ctx.lineTo(13, 6);
      ctx.lineTo(16, 24);
      ctx.lineTo(4, 24);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 6, 0, 24, [[0, '#ffcc80'], [1, '#ff5722']]);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      D.circlePath(ctx, 9, 13, 2.2);
      D.fs(ctx, '#d50000');
      D.circlePath(ctx, 11.5, 19, 2.6);
      D.fs(ctx, '#d50000');
      ctx.beginPath();
      ctx.moveTo(6, 6);
      ctx.lineTo(10, 1);
      ctx.lineTo(14, 6);
      ctx.closePath();
      D.fs(ctx, '#90a4ae', OL, 1);
      D.rrPath(ctx, 3, 24, 14, 6, 2);
      D.fs(ctx, '#78909c', OL, 1);
    });
  }

  MT.EnemyArt2 = { generate };
})();
