// Ultimate forms and Omega Mech parts for the five newer minions: the Shadow
// Dojo, the Banana Castle, the Great Cauldron, Bee-Do HQ and Dracula's Castle.
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;
  const TAU = Math.PI * 2;
  const TA = MT.TowerArt;
  const P = TA.props;
  const GA = MT.GiantArt;
  const { CX, GY, UW } = GA.box;
  const { stars, miniMinion, steel } = GA.helpers;
  const GOLD_SKIN = { base: '#ffcf33', light: '#fff3a0', dark: '#c48a00', hi: '#fffbe0' };

  function roof(ctx, cx, y, w, h, col) {
    // curved pagoda roof with upturned tips
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 - 8, y - 4);
    ctx.quadraticCurveTo(cx - w / 2, y + 2, cx - w / 2 + 6, y);
    ctx.lineTo(cx - w * 0.22, y - h);
    ctx.lineTo(cx + w * 0.22, y - h);
    ctx.lineTo(cx + w / 2 - 6, y);
    ctx.quadraticCurveTo(cx + w / 2, y + 2, cx + w / 2 + 8, y - 4);
    ctx.lineTo(cx + w / 2 + 2, y + 4);
    ctx.lineTo(cx - w / 2 - 2, y + 4);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, y - h, 0, y + 4, [[0, D.shade(col, 0.3)], [1, D.shade(col, -0.35)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function bricks(ctx, x, y, w, h, col) {
    D.rrPath(ctx, x, y, w, h, 3);
    ctx.fillStyle = D.lin(ctx, x, 0, x + w, 0, [[0, D.shade(col, 0.25)], [0.5, col], [1, D.shade(col, -0.35)]]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = D.rgba('#000000', 0.18);
    ctx.lineWidth = 0.9;
    for (let yy = y + 7, row = 0; yy < y + h; yy += 7, row++) {
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
      ctx.stroke();
      for (let xx = x + (row % 2 ? 6 : 0); xx < x + w; xx += 12) {
        ctx.beginPath();
        ctx.moveTo(xx, yy - 7);
        ctx.lineTo(xx, yy);
        ctx.stroke();
      }
    }
    ctx.restore();
    D.rrPath(ctx, x, y, w, h, 3);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function battlements(ctx, x, y, w, col) {
    const n = Math.max(2, Math.round(w / 9));
    const cw = w / (n * 2 - 1);
    for (let i = 0; i < n; i++) {
      D.rrPath(ctx, x + i * cw * 2, y - 6, cw, 7, 1);
      D.fs(ctx, col, OL, 1.1);
    }
  }

  function bananaFlag(ctx, x, y, col) {
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 24);
    ctx.quadraticCurveTo(x + 9, y - 27, x + 16, y - 22);
    ctx.lineTo(x + 16, y - 13);
    ctx.quadraticCurveTo(x + 9, y - 17, x + 1, y - 14);
    ctx.closePath();
    D.fs(ctx, col, OL, 1);
    P.banana(ctx, x + 9, y - 19, 0.45, -0.2, '#ffe14a');
  }

  // ================================================================ Ultimates
  const ULT = GA.ULT;

  // Shadow Dojo: a pagoda temple and a giant golden ninja master
  ULT.ninja = (ctx) => {
    stars(ctx, 8, 41, UW, 120);
    P.glowRing(ctx, CX, 52, 70, '#b39ddb', 0.35);
    D.circlePath(ctx, CX, 46, 38);
    ctx.fillStyle = D.rad(ctx, CX - 10, 36, 2, CX, 46, 38, [[0, '#fff8e1'], [1, '#ffcc80']]);
    ctx.fill();
    // pagoda
    D.rrPath(ctx, CX - 26, 92, 52, 56, 2);
    D.fs(ctx, '#5d4037', OL, 1.4);
    D.rrPath(ctx, CX - 18, 60, 36, 34, 2);
    D.fs(ctx, '#6d4c41', OL, 1.3);
    D.rrPath(ctx, CX - 12, 36, 24, 26, 2);
    D.fs(ctx, '#795548', OL, 1.2);
    roof(ctx, CX, 96, 84, 14, '#c62828');
    roof(ctx, CX, 64, 64, 12, '#c62828');
    roof(ctx, CX, 38, 46, 11, '#c62828');
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(CX, 27);
    ctx.lineTo(CX, 12);
    ctx.stroke();
    D.circlePath(ctx, CX, 12, 3);
    D.fs(ctx, '#ffc400', OL, 1);
    // cherry blossom branch
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 30);
    ctx.quadraticCurveTo(26, 34, 40, 20);
    ctx.stroke();
    const rnd = D.rng(13);
    for (let i = 0; i < 14; i++) {
      D.circlePath(ctx, 6 + rnd() * 40, 16 + rnd() * 22, 2.4 + rnd() * 1.6);
      D.fs(ctx, '#f8bbd0', 'rgba(173,20,87,0.6)', 0.6);
    }
    // stone platform
    D.ellipsePath(ctx, CX, 158, 66, 13);
    ctx.fillStyle = D.lin(ctx, 0, 145, 0, 171, [[0, '#cfd8dc'], [1, '#607d8b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // the master: a huge golden ninja with flowing headband
    const mx = CX, my = 118;
    [[0, 0], [1, 6]].forEach(([k, dy]) => {
      ctx.beginPath();
      ctx.moveTo(mx - 18, my - 14);
      ctx.quadraticCurveTo(mx - 40, my - 22 + dy + k * 3, mx - 54, my - 10 + dy);
      ctx.lineTo(mx - 52, my - 5 + dy);
      ctx.quadraticCurveTo(mx - 38, my - 14 + dy, mx - 18, my - 9);
      ctx.closePath();
      D.fs(ctx, '#ffc400', OL, 1.1);
    });
    M.draw(ctx, {
      x: mx, y: my, w: 40, h: 54, skin: GOLD_SKIN, eyes: 2, hair: 'bald', mouth: 'none', seed: 221, lookX: 0.85, lid: 0.3, lidDepth: 0.72,
      denim: { base: '#2b2d42', light: '#4a4e69', dark: '#14151f', stitch: '#ffc400' }, noLogo: true, strapColor: '#ffc400', rim: '#ffd740', lw: 1.8,
      arms: [{ x0: mx - 17, y0: my + 2, x1: mx - 24, y1: my + 15, bend: [mx - 28, my + 6] }],
      outfit: (c2, cx, cy, w, h) => {
        c2.fillStyle = '#ffc400';
        c2.fillRect(cx - w, cy + h * 0.19, w * 2, h * 0.07);
      },
      face: (c2, cx, cy, w, h) => {
        c2.save();
        D.capsulePath(c2, cx, cy, w, h);
        c2.clip();
        c2.fillStyle = '#1f2030';
        c2.fillRect(cx - w, cy - h * 0.065, w * 2, h * 0.15);
        c2.restore();
      },
    });
    D.limb(ctx, mx + 17, my + 2, mx + 33, my - 18, 6, GOLD_SKIN.base, { bend: [mx + 32, my + 4], lw: 1.8 });
    P.glowRing(ctx, mx + 38, my - 22, 22, '#b388ff', 0.6);
    P.shuriken(ctx, mx + 38, my - 22, 15, 0.3, true);
    // petals drifting
    for (let i = 0; i < 8; i++) {
      D.ellipsePath(ctx, 10 + rnd() * 140, 70 + rnd() * 80, 2.4, 1.4, rnd() * 3);
      D.fs(ctx, '#f8bbd0', 'rgba(173,20,87,0.5)', 0.5);
    }
  };

  // Banana Castle: a royal castle with a trebuchet on top and the minion king
  ULT.catapult = (ctx) => {
    D.shadow(ctx, CX, GY, 72, 10, 0.35);
    const stone = '#b0a89e';
    // towers
    [[8, 46], [UW - 46, 46]].forEach(([x, top]) => {
      bricks(ctx, x, top, 38, GY - top - 4, stone);
      battlements(ctx, x - 2, top, 42, D.shade(stone, -0.1));
      D.rrPath(ctx, x + 14, top + 22, 10, 16, 5);
      D.fs(ctx, '#3e2723', OL, 1);
      bananaFlag(ctx, x + 19, top - 6, '#5e35b1');
    });
    // central wall with the gate
    bricks(ctx, 40, 82, 80, GY - 86, D.shade(stone, 0.06));
    battlements(ctx, 40, 82, 80, stone);
    ctx.beginPath();
    ctx.moveTo(CX - 18, GY - 4);
    ctx.lineTo(CX - 18, 128);
    ctx.arc(CX, 128, 18, Math.PI, 0);
    ctx.lineTo(CX + 18, GY - 4);
    ctx.closePath();
    D.fs(ctx, '#4e342e', OL, 1.4);
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.4;
    for (let x = CX - 12; x <= CX + 12; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 116);
      ctx.lineTo(x, GY - 4);
      ctx.stroke();
    }
    // the trebuchet on the wall
    P.woodBeam(ctx, CX - 22, 80, CX, 30, 4.5);
    P.woodBeam(ctx, CX + 22, 80, CX, 30, 4.5);
    P.woodBeam(ctx, CX - 6, 56, CX + 30, 6, 4);
    P.woodBeam(ctx, CX - 6, 56, CX - 18, 70, 4);
    D.rrPath(ctx, CX - 26, 66, 16, 13, 2);
    D.fs(ctx, '#616161', OL, 1.2);
    D.circlePath(ctx, CX, 30, 3.4);
    D.fs(ctx, '#90a4ae', OL, 1);
    P.flames(ctx, CX + 32, 8, 0.7, false);
    P.colossal(ctx, CX + 32, 4, 8);
    // the minion king waves from the wall
    miniMinion(ctx, CX + 34, 70, 18, 24, { hair: 'bald', mouth: 'happy', legs: false, lookX: 0.6,
      denim: { base: '#7e57c2', light: '#b39ddb', dark: '#4527a0', stitch: '#ffd54f' },
      arms: [{ x0: CX + 26, y0: 70, x1: CX + 21, y1: 62 }, { x0: CX + 42, y0: 70, x1: CX + 48, y1: 60 }] });
    P.crown(ctx, CX + 34, 56, 0.55, '#e53935');
    // banners on the wall
    [CX - 30, CX + 30].forEach((x) => {
      D.rrPath(ctx, x - 6, 90, 12, 20, 1);
      D.fs(ctx, '#5e35b1', OL, 1);
      P.banana(ctx, x, 99, 0.5, 1.2, '#ffe14a');
    });
  };

  // Great Cauldron: a house-sized cauldron, bubbling acid, an alchemist on top
  ULT.potion = (ctx) => {
    D.shadow(ctx, CX, GY, 66, 10, 0.35);
    // fire and logs underneath
    P.flames(ctx, CX - 26, 158, 1.4, false);
    P.flames(ctx, CX + 26, 158, 1.4, false);
    P.flames(ctx, CX, 160, 1.6, false);
    [[-34, 0.15], [34, -0.15]].forEach(([dx, r]) => {
      ctx.save();
      ctx.translate(CX + dx * 0.6, 162);
      ctx.rotate(r);
      D.rrPath(ctx, -26, -4, 52, 8, 4);
      D.fs(ctx, '#6d4c41', OL, 1.2);
      ctx.restore();
    });
    // steam cloud
    const rnd = D.rng(17);
    for (let i = 0; i < 6; i++) {
      D.blobPath(ctx, CX - 34 + i * 14, 34 - (i % 2) * 8, 13 + rnd() * 4, 8, 0.2, rnd);
      D.fs(ctx, 'rgba(178,255,89,0.55)', 'rgba(51,105,30,0.5)', 1);
    }
    // the cauldron
    D.ellipsePath(ctx, CX, 112, 62, 44);
    ctx.fillStyle = D.lin(ctx, CX - 62, 0, CX + 62, 0, [[0, '#757575'], [0.4, '#2e2e2e'], [1, '#0d0d0d']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    D.ellipsePath(ctx, CX - 22, 96, 12, 22, 0.3);
    D.fs(ctx, 'rgba(255,255,255,0.12)');
    // rim + brew
    D.ellipsePath(ctx, CX, 74, 60, 13);
    D.fs(ctx, '#212121', OL, 1.8);
    D.ellipsePath(ctx, CX, 74, 53, 9.5);
    ctx.fillStyle = D.rad(ctx, CX - 10, 70, 2, CX, 74, 53, [[0, '#f4ff81'], [0.35, '#76ff03'], [1, '#2e7d32']]);
    ctx.fill();
    P.glowRing(ctx, CX, 72, 60, '#76ff03', 0.4);
    [[-30, 64, 6], [-8, 56, 9], [16, 60, 7], [34, 66, 5], [4, 44, 5], [-20, 40, 4]].forEach(([dx, y, r]) => {
      D.circlePath(ctx, CX + dx, y, r);
      D.fs(ctx, 'rgba(204,255,144,0.92)', '#33691e', 1);
    });
    // runes on the pot
    ctx.strokeStyle = 'rgba(118,255,3,0.8)';
    ctx.lineWidth = 2;
    [[-30, 110], [0, 120], [30, 110]].forEach(([dx, y]) => {
      ctx.beginPath();
      ctx.moveTo(CX + dx - 5, y - 5);
      ctx.lineTo(CX + dx + 5, y + 5);
      ctx.moveTo(CX + dx + 5, y - 5);
      ctx.lineTo(CX + dx - 5, y + 5);
      ctx.moveTo(CX + dx, y - 7);
      ctx.lineTo(CX + dx, y + 7);
      ctx.stroke();
    });
    // the alchemist stirring with a huge paddle
    P.woodBeam(ctx, CX + 6, 76, CX + 38, 22, 5);
    miniMinion(ctx, CX + 44, 52, 22, 30, {
      hair: 'wild', hairColor: '#eceff1', hairSpikes: 11, hairLen: 0.55, mouth: 'grin', legs: false, lookX: -0.4, rim: '#c9a227',
      outfit: (c2, cx, cy, w, h) => {
        c2.fillStyle = '#f5f5f5';
        c2.fillRect(cx - w, cy + h * 0.02, w * 0.75, h * 0.6);
        c2.fillRect(cx + w * 0.25, cy + h * 0.02, w * 0.75, h * 0.6);
      },
      arms: [{ x0: CX + 34, y0: 54, x1: CX + 33, y1: 36 }, { x0: CX + 54, y0: 54, x1: CX + 39, y1: 28, bend: [CX + 52, 40] }],
    });
    P.flask(ctx, CX - 46, 50, 1.5, '#ffc400', { glow: true, rot: -0.4 });
  };

  // Bee-Do HQ: the fire station, its truck and a water cannon on the roof
  ULT.fireman = (ctx) => {
    D.shadow(ctx, CX, GY, 74, 10, 0.35);
    // watch tower with the bell and the siren
    bricks(ctx, 8, 40, 34, GY - 44, '#c62828');
    roof(ctx, 25, 42, 40, 12, '#37474f');
    D.rrPath(ctx, 17, 46, 16, 14, 3);
    D.fs(ctx, '#263238', OL, 1);
    D.circlePath(ctx, 25, 54, 5);
    D.fs(ctx, '#ffc400', OL, 1);
    P.glowRing(ctx, 18, 24, 14, '#ff1744', 0.7);
    P.glowRing(ctx, 32, 24, 14, '#2979ff', 0.7);
    D.rrPath(ctx, 12, 24, 26, 6, 2);
    D.fs(ctx, '#455a64', OL, 1);
    ctx.beginPath();
    ctx.arc(19, 24, 4.5, Math.PI, 0);
    ctx.closePath();
    D.fs(ctx, '#ff1744', OL, 1);
    ctx.beginPath();
    ctx.arc(31, 24, 4.5, Math.PI, 0);
    ctx.closePath();
    D.fs(ctx, '#2979ff', OL, 1);
    // the station
    bricks(ctx, 38, 70, 116, GY - 74, '#d32f2f');
    D.rrPath(ctx, 34, 64, 124, 10, 3);
    D.fs(ctx, '#eceff1', OL, 1.4);
    // (no lettering: the station turns round to face its target)
    [56, 136].forEach((x) => {
      D.circlePath(ctx, x, 69, 3.4);
      D.fs(ctx, '#d32f2f', OL, 0.8);
    });
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#d32f2f' : '#ffd54f';
      ctx.fillRect(66 + i * 7.5, 67, 7.5, 4);
    }
    // the fire brigade emblem above the garage
    ctx.save();
    ctx.translate(96, 86);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-4, -9);
      ctx.lineTo(4, -9);
      ctx.closePath();
      D.fs(ctx, '#ffc400', OL, 0.9);
    }
    D.circlePath(ctx, 0, 0, 3.6);
    D.fs(ctx, '#d32f2f', OL, 0.9);
    ctx.restore();
    // open garage with the truck nosing out (facing right)
    D.rrPath(ctx, 52, 96, 90, GY - 100, 4);
    D.fs(ctx, '#263238', OL, 1.4);
    D.rrPath(ctx, 70, 112, 74, 40, 6);
    ctx.fillStyle = D.lin(ctx, 0, 112, 0, 152, [[0, '#ff6f60'], [0.5, '#d32f2f'], [1, '#8e1c16']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.rrPath(ctx, 118, 116, 20, 14, 3);
    D.fs(ctx, '#b3e5fc', OL, 1.1);
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(70, 134, 74, 3);
    D.rrPath(ctx, 138, 138, 10, 8, 2);
    D.fs(ctx, '#cfd8dc', OL, 1);
    P.wheel(ctx, 88, 154, 9);
    P.wheel(ctx, 128, 154, 9);
    // the big water cannon on the roof and its operator
    ctx.save();
    ctx.translate(112, 52);
    ctx.rotate(-0.12);
    D.rrPath(ctx, -14, -8, 44, 16, 6);
    ctx.fillStyle = D.lin(ctx, 0, -8, 0, 8, [[0, '#b3e5fc'], [0.5, '#0288d1'], [1, '#01579b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    [-4, 10].forEach((x) => {
      D.rrPath(ctx, x, -10, 4, 20, 1.5);
      D.fs(ctx, '#ffc400', OL, 1);
    });
    D.ellipsePath(ctx, 30, 0, 3.4, 9);
    D.fs(ctx, '#ffc400', OL, 1.2);
    P.waterDrops(ctx, 36, 0, 3, 7, 1.4);
    ctx.restore();
    miniMinion(ctx, 88, 50, 20, 26, { hair: 'bald', mouth: 'o', legs: false, lookX: 0.8,
      denim: { base: '#d9a441', light: '#f3cc7a', dark: '#8d6420', stitch: '#fff59d' },
      arms: [{ x0: 80, y0: 52, x1: 100, y1: 54 }, { x0: 96, y0: 52, x1: 104, y1: 50 }] });
    P.fireHelmet(ctx, 88, 30, 20, '#d32f2f', {});
  };

  // Dracula's Castle: a gothic castle under a blood moon, bats everywhere
  ULT.vampire = (ctx) => {
    P.glowRing(ctx, CX, 52, 76, '#ff1744', 0.4);
    D.circlePath(ctx, CX, 50, 42);
    ctx.fillStyle = D.rad(ctx, CX - 12, 38, 3, CX, 50, 42, [[0, '#ff8a80'], [0.55, '#d32f2f'], [1, '#7f0000']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.shadow(ctx, CX, GY, 70, 10, 0.4);
    const wall = '#4a3b5c';
    // spires
    [[14, 70, 24], [UW - 38, 70, 24], [CX - 15, 40, 30]].forEach(([x, top, w]) => {
      bricks(ctx, x, top, w, GY - top - 4, wall);
      ctx.beginPath();
      ctx.moveTo(x - 4, top + 2);
      ctx.lineTo(x + w / 2, top - 30);
      ctx.lineTo(x + w + 4, top + 2);
      ctx.closePath();
      D.fs(ctx, '#2a1f38', OL, 1.4);
      D.rrPath(ctx, x + w / 2 - 3, top + 12, 6, 10, 3);
      D.fs(ctx, '#ffeb3b', OL, 0.9);
    });
    bricks(ctx, 30, 104, 100, GY - 108, D.shade(wall, 0.08));
    battlements(ctx, 30, 104, 100, wall);
    ctx.beginPath();
    ctx.moveTo(CX - 14, GY - 4);
    ctx.lineTo(CX - 14, 140);
    ctx.arc(CX, 140, 14, Math.PI, 0);
    ctx.lineTo(CX + 14, GY - 4);
    ctx.closePath();
    D.fs(ctx, '#1a0f24', OL, 1.4);
    // the count on the front balcony, cape spread wide
    const vx = CX, vy = 92;
    ctx.beginPath();
    ctx.moveTo(vx, vy - 8);
    ctx.lineTo(vx - 36, vy - 16);
    ctx.lineTo(vx - 30, vy + 4);
    ctx.lineTo(vx - 22, vy + 16);
    ctx.lineTo(vx + 22, vy + 16);
    ctx.lineTo(vx + 30, vy + 4);
    ctx.lineTo(vx + 36, vy - 16);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, vy - 16, 0, vy + 16, [[0, '#d50000'], [1, '#4a0000']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    M.draw(ctx, {
      x: vx, y: vy, w: 26, h: 34, skin: { base: '#f0dc72', light: '#fff4b0', dark: '#bfa441', hi: '#fffde7' },
      eyes: 2, hair: 'bald', mouth: 'teeth', seed: 231, lid: 0.25, lidDepth: 0.72, rim: '#b71c1c', legs: false, lw: 1.3,
      denim: { base: '#1c1c28', light: '#3a3a52', dark: '#0d0d14', stitch: '#b71c1c' }, noLogo: true,
      outfit: (c2, cx, cy, w, h) => {
        c2.fillStyle = '#1a1a1a';
        c2.beginPath();
        c2.moveTo(cx - w, cy - h * 0.62);
        c2.lineTo(cx + w, cy - h * 0.62);
        c2.lineTo(cx + w, cy - h * 0.31);
        c2.quadraticCurveTo(cx + w * 0.3, cy - h * 0.36, cx, cy - h * 0.27);
        c2.quadraticCurveTo(cx - w * 0.3, cy - h * 0.36, cx - w, cy - h * 0.31);
        c2.closePath();
        c2.fill();
      },
      arms: [{ x0: vx - 12, y0: vy, x1: vx - 24, y1: vy - 10 }, { x0: vx + 12, y0: vy, x1: vx + 24, y1: vy - 10 }],
    });
    D.rrPath(ctx, vx - 26, vy + 14, 52, 6, 2);
    D.fs(ctx, '#2a1f38', OL, 1.2);
    // the bats
    [[22, 30, 1.1, -0.3], [138, 24, 1, 0.3], [40, 60, 0.8, 0.2], [124, 62, 0.85, -0.2], [CX, 14, 0.9, 0], [8, 92, 0.7, -0.1], [152, 96, 0.7, 0.1]]
      .forEach(([x, y, s, r]) => P.bat(ctx, x, y, s, r));
  };

  // ================================================================ Omega Mech modules
  const MODS = GA.MODS;
  MODS.ninja = {
    arm(ctx) {
      D.rrPath(ctx, 0, -7, 30, 14, 5);
      D.fs(ctx, '#2b2d42', OL, 1.4);
      ctx.fillStyle = '#e53935';
      ctx.fillRect(8, -7, 4, 14);
      P.glowRing(ctx, 40, 0, 14, '#b388ff', 0.6);
      P.shuriken(ctx, 40, 0, 11, 0.4, true);
    },
    back(ctx) {
      [-1, 1].forEach((s) => {
        ctx.save();
        ctx.rotate(s * 0.45);
        D.rrPath(ctx, -3, -72, 6, 58, 2);
        ctx.fillStyle = D.lin(ctx, -3, 0, 3, 0, [[0, '#ffffff'], [1, '#90a4ae']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        D.rrPath(ctx, -7, -16, 14, 4, 1.5);
        D.fs(ctx, '#ffc400', OL, 1);
        D.rrPath(ctx, -3, -12, 6, 16, 2);
        D.fs(ctx, '#e53935', OL, 1);
        ctx.restore();
      });
      P.shuriken(ctx, 0, -46, 16, 0, false);
    },
  };
  MODS.catapult = {
    arm(ctx) {
      P.woodBeam(ctx, 0, 0, 34, -8, 7);
      ctx.save();
      ctx.translate(36, -9);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI);
      ctx.closePath();
      D.fs(ctx, '#7b4a28', OL, 1.2);
      ctx.restore();
      P.colossal(ctx, 36, -16, 9);
    },
    back(ctx) {
      P.woodBeam(ctx, -30, 0, 0, -62, 6);
      P.woodBeam(ctx, 30, 0, 0, -62, 6);
      P.woodBeam(ctx, -14, -36, 40, -84, 5);
      D.circlePath(ctx, 0, -62, 4);
      D.fs(ctx, '#90a4ae', OL, 1);
      P.flames(ctx, 42, -88, 0.8, false);
      P.colossal(ctx, 42, -92, 9);
    },
  };
  MODS.potion = {
    arm(ctx) {
      D.rrPath(ctx, 0, -6, 28, 12, 4);
      ctx.fillStyle = steel(ctx, 0, 28);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(26, -6);
      ctx.lineTo(34, -11);
      ctx.lineTo(34, 11);
      ctx.lineTo(26, 6);
      ctx.closePath();
      D.fs(ctx, '#78909c', OL, 1.2);
      P.flask(ctx, 42, 0, 1.4, '#76ff03', { glow: true, rot: Math.PI / 2 });
    },
    back(ctx) {
      P.cauldron(ctx, 0, -30, 2.6, '#76ff03');
      ctx.strokeStyle = OL;
      ctx.lineWidth = 4;
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(s * 20, -40);
        ctx.quadraticCurveTo(s * 34, -60, s * 30, -80);
        ctx.stroke();
      });
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 2.2;
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(s * 20, -40);
        ctx.quadraticCurveTo(s * 34, -60, s * 30, -80);
        ctx.stroke();
      });
      const rnd = D.rng(6);
      for (let i = 0; i < 3; i++) {
        D.blobPath(ctx, -12 + i * 12, -72 - (i % 2) * 6, 7, 7, 0.2, rnd);
        D.fs(ctx, 'rgba(178,255,89,0.7)', 'rgba(51,105,30,0.5)', 0.8);
      }
    },
  };
  MODS.fireman = {
    arm(ctx) {
      D.rrPath(ctx, 0, -8, 34, 16, 6);
      ctx.fillStyle = D.lin(ctx, 0, -8, 0, 8, [[0, '#b3e5fc'], [0.5, '#0288d1'], [1, '#01579b']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      [6, 18].forEach((x) => {
        D.rrPath(ctx, x, -10, 4, 20, 1.5);
        D.fs(ctx, '#ffc400', OL, 1);
      });
      D.ellipsePath(ctx, 34, 0, 3.4, 10);
      D.fs(ctx, '#ffc400', OL, 1.2);
      P.waterDrops(ctx, 40, 0, 2, 6, 1.1);
    },
    back(ctx) {
      D.rrPath(ctx, -24, -72, 48, 70, 14);
      ctx.fillStyle = D.lin(ctx, -24, 0, 24, 0, [[0, '#ff8a80'], [0.5, '#d32f2f'], [1, '#7f1d1d']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(-24, -40, 48, 4);
      [[-9, '#ff1744'], [9, '#2979ff']].forEach(([x, c]) => {
        P.glowRing(ctx, x, -76, 12, c, 0.8);
        ctx.beginPath();
        ctx.arc(x, -74, 6, Math.PI, 0);
        ctx.closePath();
        D.fs(ctx, c, OL, 1.2);
      });
      D.rrPath(ctx, -18, -76, 36, 4, 1.5);
      D.fs(ctx, '#455a64', OL, 1);
    },
  };
  MODS.vampire = {
    arm(ctx) {
      D.rrPath(ctx, 0, -8, 34, 16, 6);
      ctx.fillStyle = D.lin(ctx, 0, -8, 0, 8, [[0, '#5e35b1'], [1, '#1a0f3a']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(6, s * 8);
        ctx.lineTo(16, s * 18);
        ctx.lineTo(22, s * 8);
        ctx.closePath();
        D.fs(ctx, '#311b92', OL, 1);
      });
      P.glowRing(ctx, 36, 0, 12, '#ff1744', 0.85);
      D.ellipsePath(ctx, 34, 0, 3.4, 8);
      D.fs(ctx, '#ff1744', OL, 1);
      P.bat(ctx, 26, -16, 0.6, 0.3);
    },
    back(ctx) {
      P.glowRing(ctx, 0, -50, 40, '#ff1744', 0.4);
      D.circlePath(ctx, 0, -50, 20);
      ctx.fillStyle = D.rad(ctx, -6, -56, 2, 0, -50, 20, [[0, '#ff8a80'], [1, '#b71c1c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      [-1, 1].forEach((s) => {
        ctx.save();
        ctx.scale(s, 1);
        ctx.beginPath();
        ctx.moveTo(8, -20);
        ctx.quadraticCurveTo(30, -70, 66, -64);
        ctx.lineTo(58, -48);
        ctx.quadraticCurveTo(56, -36, 62, -24);
        ctx.quadraticCurveTo(48, -30, 44, -18);
        ctx.quadraticCurveTo(32, -26, 26, -10);
        ctx.quadraticCurveTo(18, -20, 8, -6);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, 0, -70, 0, -6, [[0, '#5e35b1'], [1, '#1a0f3a']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      });
    },
  };
})();
