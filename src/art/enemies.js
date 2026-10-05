// Evil purple minion artwork (+ camo / fortified / damage variants).
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;

  // art specs per enemy type: body size, colours and a painter tweak
  const SPEC = {
    pip: { w: 21, h: 27, skin: '#b98ae0', eyes: 1, mouth: 'teeth', hairLen: 0.6 },
    grumble: { w: 23, h: 30, skin: '#9b59d0', eyes: 2, mouth: 'teeth', hairLen: 0.8 },
    chomper: { w: 26, h: 33, skin: '#7d32b5', eyes: 1, mouth: 'roar', hairLen: 0.9, armsUp: true },
    dasher: { w: 23, h: 30, skin: '#ad2fa0', eyes: 2, mouth: 'teeth', hairLen: 0.9, shoes: '#e53935' },
    zoomer: { w: 23, h: 29, skin: '#d23fa8', eyes: 1, mouth: 'roar', hairLen: 1.3, skates: true },
    rascal: { w: 27, h: 34, skin: '#4d2273', eyes: 2, mouth: 'teeth', hairLen: 1, mask: true },
    jailbird: { w: 29, h: 37, skin: '#7b3fa0', eyes: 1, mouth: 'roar', hairLen: 1, stripes: true, armsUp: true },
    hulk: { w: 34, h: 40, skin: '#6c2a96', eyes: 1, mouth: 'roar', hairLen: 1.1, hulk: true },
    brute: { w: 34, h: 42, skin: '#7b2fb0', eyes: 2, mouth: 'teeth', hairLen: 1.1, barrel: true, armsUp: true },
    tincan: { w: 29, h: 37, skin: '#8a3fb8', eyes: 2, mouth: 'teeth', hairLen: 0.7, knight: true },
    mega: { w: 70, h: 90, skin: '#7a2fae', eyes: 2, mouth: 'roar', hairLen: 1.2, armsUp: true, boss: true },
    titan: { w: 90, h: 110, skin: '#5b1a70', eyes: 1, mouth: 'roar', hairLen: 1.3, armsUp: true, boss: true, titan: true },
    zeppelin: { blimp: true },
  };

  function texSize(sp) {
    if (sp.blimp) return { tw: 250, th: 150, foot: 140 };
    const tw = Math.ceil(sp.w * 2.7 + 10);
    const th = Math.ceil(sp.h * 1.95 + 12);
    return { tw, th, foot: th - 4 };
  }

  function camoOverlay(ctx, tw, th, rnd) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const cols = ['#4b5d2c', '#7a6c3c', '#2f3b22', '#5f7a3a'];
    for (let i = 0; i < 34; i++) {
      D.blobPath(ctx, rnd() * tw, rnd() * th, 3 + rnd() * tw * 0.07, 7, 0.35, rnd);
      ctx.fillStyle = D.rgba(cols[i % cols.length], 0.72);
      ctx.fill();
    }
    ctx.restore();
  }

  function rivet(ctx, x, y, r) {
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.3, y - r * 0.3, 0, x, y, r, [[0, '#ffffff'], [0.5, '#b0b6bd'], [1, '#5c636b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  function metalPlate(ctx, x, y, w, h, gold) {
    D.rrPath(ctx, x, y, w, h, Math.min(w, h) * 0.25);
    ctx.fillStyle = D.lin(ctx, x, y, x + w, y + h, gold ? [[0, '#fff3b0'], [0.5, '#d4a52a'], [1, '#8a6410']] : [[0, '#eef1f4'], [0.5, '#9aa4ae'], [1, '#56606a']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    const r = Math.max(0.9, Math.min(w, h) * 0.09);
    rivet(ctx, x + r * 2, y + r * 2, r);
    rivet(ctx, x + w - r * 2, y + r * 2, r);
    rivet(ctx, x + r * 2, y + h - r * 2, r);
    rivet(ctx, x + w - r * 2, y + h - r * 2, r);
  }

  function drawPurple(ctx, sp, o) {
    const { tw, foot } = o;
    const w = sp.w, h = sp.h;
    const cx = tw / 2;
    const cy = foot - h * 0.69;
    const rnd = D.rng(o.seed);
    D.shadow(ctx, cx, foot - 1, w * 0.62, w * 0.18, 0.32);

    const mo = {
      x: cx, y: cy, w, h, skin: sp.skin, eyes: sp.eyes, eyeStyle: 'crazy', hair: 'wild', hairLen: sp.hairLen,
      hairSpikes: sp.boss ? 17 : 12, mouth: sp.mouth, seed: o.seed, rand: rnd, shoes: sp.shoes, stripes: sp.stripes,
      lw: sp.boss ? 2.2 : undefined, pupil: sp.boss ? 0.16 : 0.14, hairColor: sp.titan ? '#2a0a12' : '#1b0d22',
      denim: sp.titan ? { base: '#3b3f4a', light: '#6b7280', dark: '#22252c', stitch: '#ff5252' } : undefined,
      logoColor: '#5b1d7a',
    };
    const arm = w * 0.15;
    if (sp.armsUp || sp.boss) {
      mo.armsBack = [];
      mo.arms = [
        { x0: cx - w * 0.44, y0: cy + h * 0.02, x1: cx - w * 0.82, y1: cy - h * 0.34, bend: [cx - w * 0.8, cy + h * 0.02], t: 0.15 },
        { x0: cx + w * 0.44, y0: cy + h * 0.02, x1: cx + w * 0.82, y1: cy - h * 0.3, bend: [cx + w * 0.8, cy + h * 0.06], t: 0.15 },
      ];
    } else {
      mo.arms = [
        { x0: cx - w * 0.44, y0: cy + h * 0.04, x1: cx - w * 0.72, y1: cy + h * 0.22, t: 0.15 },
        { x0: cx + w * 0.44, y0: cy + h * 0.04, x1: cx + w * 0.78, y1: cy - h * 0.12, t: 0.15 },
      ];
    }
    if (sp.hulk) {
      mo.overalls = false;
      mo.outfit = (c2, x, y, ww, hh) => {
        // ripped red tank top + belt
        c2.fillStyle = '#c62828';
        c2.fillRect(x - ww, y + hh * 0.06, ww * 2, hh * 0.3);
        c2.fillStyle = '#7f1d1d';
        c2.fillRect(x - ww, y + hh * 0.33, ww * 2, hh * 0.06);
        c2.fillStyle = '#3e2a1e';
        c2.fillRect(x - ww, y + hh * 0.38, ww * 2, hh * 0.3);
      };
      mo.arms = [
        { x0: cx - w * 0.42, y0: cy + h * 0.02, x1: cx - w * 0.8, y1: cy - h * 0.25, bend: [cx - w * 0.9, cy + h * 0.05], t: 0.24 },
        { x0: cx + w * 0.42, y0: cy + h * 0.02, x1: cx + w * 0.8, y1: cy - h * 0.25, bend: [cx + w * 0.9, cy + h * 0.05], t: 0.24 },
      ];
      mo.lid = 0.35;
      mo.lidDepth = 0.7;
    }
    if (sp.mask) {
      mo.strapColor = '#b71c1c';
      mo.rim = '#424242';
    }
    if (sp.knight) {
      mo.after = (c2, x, y, ww, hh) => knightHelmet(c2, x, y, ww, hh, o.fort);
    }
    if (sp.titan) {
      mo.rim = '#8d1c1c';
      const prev = mo.after;
      mo.after = (c2, x, y, ww, hh) => {
        prev && prev(c2, x, y, ww, hh);
        // shoulder pads + horned helmet
        metalPlate(c2, x - ww * 0.75, y - hh * 0.08, ww * 0.38, hh * 0.16, false);
        metalPlate(c2, x + ww * 0.37, y - hh * 0.08, ww * 0.38, hh * 0.16, false);
        for (const s of [-1, 1]) {
          c2.beginPath();
          c2.moveTo(x + s * ww * 0.28, y - hh * 0.42);
          c2.quadraticCurveTo(x + s * ww * 0.6, y - hh * 0.55, x + s * ww * 0.55, y - hh * 0.78);
          c2.quadraticCurveTo(x + s * ww * 0.45, y - hh * 0.55, x + s * ww * 0.16, y - hh * 0.46);
          c2.closePath();
          D.fs(c2, '#eadfcf', OL, 1.6);
        }
      };
    }
    if (sp.skates) {
      const prevA = mo.after;
      mo.after = (c2, x, y, ww, hh) => {
        prevA && prevA(c2, x, y, ww, hh);
        for (const s of [-1, 1]) {
          const lx = x + s * ww * 0.24;
          const ly = y + hh * 0.5 + hh * 0.12;
          D.rrPath(c2, lx - ww * 0.18, ly - hh * 0.05, ww * 0.36, hh * 0.08, 2);
          D.fs(c2, '#29b6f6', OL, 0.9);
          D.circlePath(c2, lx - ww * 0.1, ly + hh * 0.05, hh * 0.035);
          D.fs(c2, '#ffeb3b', OL, 0.7);
          D.circlePath(c2, lx + ww * 0.1, ly + hh * 0.05, hh * 0.035);
          D.fs(c2, '#ffeb3b', OL, 0.7);
        }
      };
    }

    if (sp.barrel) {
      // the barrel is drawn in front of the body
      const prevB = mo.after;
      mo.legs = false;
      mo.after = (c2, x, y, ww, hh) => {
        prevB && prevB(c2, x, y, ww, hh);
        barrel(c2, x, y + hh * 0.22, ww * 1.12, hh * 0.62, o.damage || 0, o.fort, rnd);
      };
    }
    M.draw(ctx, mo);

    if (sp.mask) {
      // bandit bandana knot
      ctx.save();
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath();
      const ky = cy - h * 0.19;
      ctx.moveTo(cx + w * 0.5, ky);
      ctx.lineTo(cx + w * 0.78, ky - h * 0.1);
      ctx.lineTo(cx + w * 0.74, ky + h * 0.08);
      ctx.closePath();
      D.fs(ctx, '#b71c1c', OL, 1);
      ctx.restore();
    }

    if (sp.boss) bossDamage(ctx, cx, cy, w, h, o.damage || 0, rnd);
    if (o.fort && sp.boss) {
      metalPlate(ctx, cx - w * 0.36, cy + h * 0.1, w * 0.72, h * 0.22, false);
      metalPlate(ctx, cx - w * 0.3, cy - h * 0.48, w * 0.6, h * 0.1, false);
    }
    if (o.fort && sp.hulk) {
      metalPlate(ctx, cx - w * 0.32, cy + h * 0.08, w * 0.64, h * 0.2, false);
    }
  }

  function knightHelmet(ctx, x, y, w, h, fort) {
    const top = y - h / 2;
    ctx.save();
    // bucket helmet covering the head top
    ctx.beginPath();
    ctx.moveTo(x - w * 0.53, y - h * 0.02);
    ctx.lineTo(x - w * 0.53, top + w * 0.35);
    ctx.quadraticCurveTo(x - w * 0.5, top - w * 0.08, x, top - w * 0.1);
    ctx.quadraticCurveTo(x + w * 0.5, top - w * 0.08, x + w * 0.53, top + w * 0.35);
    ctx.lineTo(x + w * 0.53, y - h * 0.02);
    ctx.closePath();
    const gold = !!fort;
    ctx.fillStyle = D.lin(ctx, x - w / 2, 0, x + w / 2, 0, gold ? [[0, '#fff3b0'], [0.45, '#d4a52a'], [1, '#7a560c']] : [[0, '#f1f4f7'], [0.45, '#a3adb7'], [1, '#4f5963']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // visor slit with glowing eyes
    const ey = y - h * 0.19;
    D.rrPath(ctx, x - w * 0.4, ey - h * 0.04, w * 0.8, h * 0.08, 2);
    D.fs(ctx, '#151515', OL, 0.9);
    D.circlePath(ctx, x - w * 0.18, ey, h * 0.025);
    D.fs(ctx, '#ff3d3d');
    D.circlePath(ctx, x + w * 0.18, ey, h * 0.025);
    D.fs(ctx, '#ff3d3d');
    // breathing holes / ridge
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top - w * 0.08);
    ctx.lineTo(x, ey - h * 0.05);
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      D.circlePath(ctx, x + i * w * 0.08, y - h * 0.07, 0.8);
      D.fs(ctx, '#222');
    }
    // plume
    ctx.beginPath();
    ctx.moveTo(x, top - w * 0.1);
    ctx.quadraticCurveTo(x + w * 0.35, top - w * 0.55, x + w * 0.62, top - w * 0.2);
    ctx.quadraticCurveTo(x + w * 0.3, top - w * 0.3, x, top - w * 0.1);
    D.fs(ctx, '#e53935', OL, 1);
    ctx.restore();
    // chest plate
    const px = x - w * 0.3, py = y + h * 0.05;
    D.rrPath(ctx, px, py, w * 0.6, h * 0.22, 4);
    ctx.fillStyle = D.lin(ctx, px, 0, px + w * 0.6, 0, gold ? [[0, '#fff3b0'], [1, '#8a6410']] : [[0, '#e7ebef'], [1, '#5d6771']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    rivet(ctx, px + 2.5, py + 2.5, 1.1);
    rivet(ctx, px + w * 0.6 - 2.5, py + 2.5, 1.1);
  }

  function barrel(ctx, x, y, w, h, dmg, fort, rnd) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.46, y - h / 2);
    ctx.quadraticCurveTo(x - w * 0.6, y, x - w * 0.46, y + h / 2);
    ctx.lineTo(x + w * 0.46, y + h / 2);
    ctx.quadraticCurveTo(x + w * 0.6, y, x + w * 0.46, y - h / 2);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#c98b4f'], [0.4, '#a5682f'], [1, '#5e3712']]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(60,30,8,0.55)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * w * 0.13, y - h / 2);
      ctx.quadraticCurveTo(x + i * w * 0.17, y, x + i * w * 0.13, y + h / 2);
      ctx.stroke();
    }
    const bandCol = fort ? '#9aa4ae' : '#4a4f55';
    const bh = fort ? h * 0.16 : h * 0.1;
    [y - h * 0.32, y + h * 0.26].forEach((by) => {
      ctx.fillStyle = bandCol;
      ctx.fillRect(x - w, by - bh / 2, w * 2, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x - w, by - bh / 2, w * 2, bh * 0.3);
      if (fort) for (let i = -3; i <= 3; i++) rivet(ctx, x + i * w * 0.14, by, Math.max(0.9, bh * 0.22));
    });
    // cracks from damage
    if (dmg > 0) {
      ctx.strokeStyle = '#2a1206';
      ctx.lineWidth = 1.1;
      const n = dmg * 2;
      for (let i = 0; i < n; i++) {
        let px = x - w * 0.35 + rnd() * w * 0.7, py = y - h * 0.4 + rnd() * h * 0.8;
        ctx.beginPath();
        ctx.moveTo(px, py);
        for (let k = 0; k < 3; k++) {
          px += (rnd() - 0.5) * w * 0.3;
          py += rnd() * h * 0.2;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      if (dmg >= 3) {
        // missing chunk
        D.blobPath(ctx, x + w * 0.2, y - h * 0.1, w * 0.12, 6, 0.4, rnd);
        D.fs(ctx, '#3b1f0b');
      }
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.46, y - h / 2);
    ctx.quadraticCurveTo(x - w * 0.6, y, x - w * 0.46, y + h / 2);
    ctx.lineTo(x + w * 0.46, y + h / 2);
    ctx.quadraticCurveTo(x + w * 0.6, y, x + w * 0.46, y - h / 2);
    ctx.closePath();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.ellipsePath(ctx, x, y - h / 2, w * 0.46, h * 0.08);
    D.fs(ctx, '#3b220c', OL, 1.2);
    ctx.restore();
  }

  function bossDamage(ctx, cx, cy, w, h, dmg, rnd) {
    if (dmg <= 0) return;
    // bruises
    for (let i = 0; i < dmg; i++) {
      const x = cx - w * 0.3 + rnd() * w * 0.6, y = cy - h * 0.05 + rnd() * h * 0.3;
      D.ellipsePath(ctx, x, y, w * 0.07, w * 0.05, rnd());
      D.fs(ctx, 'rgba(40,0,60,0.45)');
    }
    // band-aids
    for (let i = 0; i < Math.min(dmg, 3); i++) {
      ctx.save();
      ctx.translate(cx - w * 0.25 + i * w * 0.22, cy - h * 0.32 + (i % 2) * h * 0.06 + h * 0.18 * (i === 2 ? 1 : 0));
      ctx.rotate((i - 1) * 0.6);
      D.rrPath(ctx, -w * 0.11, -w * 0.035, w * 0.22, w * 0.07, w * 0.03);
      D.fs(ctx, '#f6c79a', OL, 1);
      D.rrPath(ctx, -w * 0.035, -w * 0.035, w * 0.07, w * 0.07, 1);
      D.fs(ctx, '#e8b07e');
      ctx.restore();
    }
    if (dmg >= 4) {
      // torn overall patch
      D.rrPath(ctx, cx + w * 0.08, cy + h * 0.28, w * 0.18, h * 0.12, 2);
      D.fs(ctx, '#c49a6c', OL, 1.1);
    }
  }

  function drawBlimp(ctx, o) {
    const { tw, foot } = o;
    const cx = tw / 2, cy = 66;
    const rnd = D.rng(o.seed);
    const dmg = o.damage || 0;
    D.shadow(ctx, cx, foot - 2, 100, 10, 0.25);
    // tail fins
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy + s * 10);
      ctx.lineTo(cx - 112, cy + s * 46);
      ctx.lineTo(cx - 118, cy + s * 16);
      ctx.lineTo(cx - 95, cy + s * 4);
      ctx.closePath();
      D.fs(ctx, '#5a1a7a', OL, 2);
    }
    // envelope
    D.ellipsePath(ctx, cx, cy, 108, 46);
    ctx.fillStyle = D.lin(ctx, 0, cy - 46, 0, cy + 46, [[0, '#d39af0'], [0.35, '#9b4fd0'], [1, '#4a1468']]);
    ctx.fill();
    ctx.save();
    D.ellipsePath(ctx, cx, cy, 108, 46);
    ctx.clip();
    ctx.strokeStyle = 'rgba(40,0,60,0.35)';
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 110, Math.abs(i) * 15 + 1, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // band with label
    ctx.fillStyle = '#ffd83a';
    ctx.fillRect(cx - 20, cy - 60, 40, 120);
    ctx.fillStyle = '#2a1d14';
    ctx.font = 'bold 20px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('PX-41', 0, 1);
    ctx.restore();
    if (o.fort) {
      for (let i = -2; i <= 2; i++) if (i !== 0) metalPlate(ctx, cx + i * 38 - 14, cy - 30, 28, 22, false);
    }
    // damage holes / patches
    for (let i = 0; i < dmg * 2; i++) {
      const x = cx - 80 + rnd() * 160, y = cy - 30 + rnd() * 60;
      D.rrPath(ctx, x - 7, y - 5, 14, 10, 2);
      D.fs(ctx, '#c49a6c', OL, 1.2);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 5);
      ctx.lineTo(x - 4, y + 5);
      ctx.moveTo(x + 4, y - 5);
      ctx.lineTo(x + 4, y + 5);
      ctx.stroke();
    }
    ctx.restore();
    D.ellipsePath(ctx, cx, cy, 108, 46);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    D.ellipsePath(ctx, cx - 30, cy - 26, 40, 9, -0.1);
    D.fs(ctx, 'rgba(255,255,255,0.35)');
    // nose cone
    D.circlePath(ctx, cx + 106, cy, 7);
    D.fs(ctx, '#ffd83a', OL, 2);
    // gondola with evil minions
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 40);
    ctx.lineTo(cx - 30, cy + 54);
    ctx.moveTo(cx + 24, cy + 40);
    ctx.lineTo(cx + 30, cy + 54);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      M.draw(ctx, {
        x: cx - 22 + i * 22, y: cy + 56, w: 14, h: 18, skin: ['#8a3fb8', '#ad2fa0', '#6c2a96'][i], eyes: 1 + (i % 2),
        eyeStyle: 'crazy', hair: 'wild', mouth: 'teeth', seed: 50 + i, legs: false, overalls: false, lw: 1,
        arms: [{ x0: cx - 22 + i * 22 + 6, y0: cy + 56, x1: cx - 22 + i * 22 + 11, y1: cy + 46, t: 0.16 }],
      });
    }
    D.rrPath(ctx, cx - 40, cy + 56, 80, 22, 6);
    ctx.fillStyle = D.lin(ctx, 0, cy + 56, 0, cy + 78, [[0, '#6d4c41'], [1, '#3e2723']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      D.circlePath(ctx, cx - 27 + i * 18, cy + 67, 3.5);
      D.fs(ctx, '#ffe082', OL, 1);
    }
    // propeller
    ctx.save();
    ctx.translate(cx - 44, cy + 67);
    D.rrPath(ctx, -10, -2, 10, 4, 2);
    D.fs(ctx, '#9e9e9e', OL, 1);
    D.ellipsePath(ctx, -11, 0, 2.5, 12);
    D.fs(ctx, 'rgba(200,200,200,0.8)', OL, 1);
    ctx.restore();
  }

  MT.EnemyArt = {
    SPEC,
    texSize,
    key(scene, type, camo, fort, damage) {
      const sp = SPEC[type];
      const key = `en_${type}${camo ? '_c' : ''}${fort ? '_f' : ''}_${damage || 0}`;
      if (scene.textures.exists(key)) return key;
      const { tw, th, foot } = texSize(sp);
      const seed = type.length * 97 + type.charCodeAt(0);
      D.make(scene, key, tw, th, (ctx) => {
        const o = { tw, th, foot, seed, fort, damage };
        if (camo) {
          const { c, ctx: c2 } = D.canvas(tw, th);
          if (sp.blimp) drawBlimp(c2, o);
          else drawPurple(c2, sp, o);
          camoOverlay(c2, tw, th, D.rng(seed + 3));
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(c, 0, 0);
          ctx.restore();
        } else if (sp.blimp) drawBlimp(ctx, o);
        else drawPurple(ctx, sp, o);
      });
      return key;
    },
    origin(type) {
      const { th, foot } = texSize(SPEC[type]);
      return foot / th;
    },
  };
})();
