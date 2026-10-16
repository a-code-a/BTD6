// Artwork for the Rubber, Magma, Medic and Rage Mutants, the Boss Battle
// version of Mutant El Macho and the cockroach villain Maxime Le Mal.
(function () {
  const D = MT.Draw;
  const OL = D.OL;
  const EA = MT.EnemyArt;
  const { metalPlate } = EA.helpers;

  const fortPlate = (c2, x, y, ww, hh, o) => {
    if (o.fort) metalPlate(c2, x - ww * 0.3, y + hh * 0.07, ww * 0.6, hh * 0.2, false);
  };

  // ---------------------------------------------------------------- Rubber Mutant
  // shiny rubber skin and a rubber-duck swim ring
  function rubberShine(c2, x, y, ww, hh) {
    D.ellipsePath(c2, x - ww * 0.22, y - hh * 0.2, ww * 0.12, hh * 0.18, 0.3);
    D.fs(c2, 'rgba(255,255,255,0.55)');
    D.ellipsePath(c2, x + ww * 0.25, y + hh * 0.12, ww * 0.06, hh * 0.1, 0.3);
    D.fs(c2, 'rgba(255,255,255,0.35)');
  }
  function swimRing(ctx, cx, cy, w, h) {
    const y = cy + h * 0.2, rx = w * 0.66, ry = h * 0.12;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI);
    ctx.strokeStyle = OL;
    ctx.lineWidth = h * 0.17;
    ctx.stroke();
    ctx.strokeStyle = '#ffd83a';
    ctx.lineWidth = h * 0.13;
    ctx.stroke();
    ctx.strokeStyle = '#ff7043';
    ctx.setLineDash([w * 0.18, w * 0.2]);
    ctx.lineWidth = h * 0.13;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = h * 0.03;
    ctx.beginPath();
    ctx.ellipse(cx, y - h * 0.03, rx, ry, 0, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.restore();
    // duck head on the front of the ring
    const dx = cx + w * 0.5, dy = y + ry * 0.4;
    D.circlePath(ctx, dx, dy - h * 0.1, w * 0.17);
    D.fs(ctx, '#ffd83a', OL, 1);
    ctx.beginPath();
    ctx.moveTo(dx + w * 0.12, dy - h * 0.12);
    ctx.lineTo(dx + w * 0.3, dy - h * 0.08);
    ctx.lineTo(dx + w * 0.12, dy - h * 0.04);
    ctx.closePath();
    D.fs(ctx, '#ff7043', OL, 0.8);
    D.circlePath(ctx, dx + w * 0.04, dy - h * 0.14, w * 0.035);
    D.fs(ctx, '#111');
  }

  // ---------------------------------------------------------------- Magma Mutant
  function heatGlow(ctx, cx, cy, w, h) {
    ctx.fillStyle = D.rad(ctx, cx, cy, w * 0.2, cx, cy, w * 1.1, [[0, 'rgba(255,145,0,0.5)'], [1, 'rgba(255,61,0,0)']]);
    D.circlePath(ctx, cx, cy, w * 1.1);
    ctx.fill();
  }
  function lavaCracks(c2, x, y, ww, hh, o, rnd) {
    c2.save();
    D.capsulePath(c2, x, y, ww, hh);
    c2.clip();
    for (let i = 0; i < 5; i++) {
      let px = x - ww * 0.4 + rnd() * ww * 0.8, py = y - hh * 0.3 + rnd() * hh * 0.6;
      c2.beginPath();
      c2.moveTo(px, py);
      for (let k = 0; k < 3; k++) {
        px += (rnd() - 0.5) * ww * 0.35;
        py += hh * 0.08 + rnd() * hh * 0.06;
        c2.lineTo(px, py);
      }
      c2.strokeStyle = 'rgba(255,214,0,0.9)';
      c2.lineWidth = 2.2;
      c2.stroke();
      c2.strokeStyle = 'rgba(255,255,255,0.7)';
      c2.lineWidth = 0.8;
      c2.stroke();
    }
    c2.restore();
    // flames instead of hair
    const top = y - hh / 2;
    for (let i = -2; i <= 2; i++) {
      const fx = x + i * ww * 0.18, fh = hh * (0.32 - Math.abs(i) * 0.05);
      c2.beginPath();
      c2.moveTo(fx - ww * 0.11, top + hh * 0.06);
      c2.quadraticCurveTo(fx - ww * 0.1, top - fh * 0.5, fx + (i % 2 ? 2 : -2), top - fh);
      c2.quadraticCurveTo(fx + ww * 0.12, top - fh * 0.4, fx + ww * 0.11, top + hh * 0.06);
      c2.closePath();
      c2.fillStyle = D.lin(c2, 0, top - fh, 0, top + hh * 0.06, [[0, '#fff59d'], [0.4, '#ffab00'], [1, '#e65100']]);
      c2.fill();
      c2.strokeStyle = 'rgba(120,30,0,0.8)';
      c2.lineWidth = 0.9;
      c2.stroke();
    }
    fortPlate(c2, x, y, ww, hh, o);
  }

  // ---------------------------------------------------------------- Medic Mutant
  function nurseCap(c2, x, y, ww, hh, o) {
    const top = y - hh / 2;
    c2.beginPath();
    c2.moveTo(x - ww * 0.4, top + hh * 0.08);
    c2.lineTo(x - ww * 0.32, top - hh * 0.16);
    c2.quadraticCurveTo(x, top - hh * 0.24, x + ww * 0.32, top - hh * 0.16);
    c2.lineTo(x + ww * 0.4, top + hh * 0.08);
    c2.quadraticCurveTo(x, top + hh * 0.02, x - ww * 0.4, top + hh * 0.08);
    c2.closePath();
    c2.fillStyle = D.lin(c2, 0, top - hh * 0.2, 0, top + hh * 0.08, [[0, '#ffffff'], [1, '#cfd8dc']]);
    c2.fill();
    c2.strokeStyle = OL;
    c2.lineWidth = 1.1;
    c2.stroke();
    // red cross
    const cy = top - hh * 0.07, s = ww * 0.09;
    c2.fillStyle = '#e53935';
    c2.fillRect(x - s * 0.5, cy - s * 1.4, s, s * 2.8);
    c2.fillRect(x - s * 1.4, cy - s * 0.5, s * 2.8, s);
    fortPlate(c2, x, y, ww, hh, o);
  }
  function medicBag(ctx, cx, cy, w, h) {
    const x = cx - w * 0.78, y = cy + h * 0.28;
    D.rrPath(ctx, x - w * 0.26, y - h * 0.1, w * 0.52, h * 0.24, 3);
    ctx.fillStyle = D.lin(ctx, 0, y - h * 0.1, 0, y + h * 0.14, [[0, '#ffffff'], [1, '#b0bec5']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y - h * 0.1, w * 0.12, Math.PI, 0);
    ctx.stroke();
    const s = w * 0.07;
    ctx.fillStyle = '#43a047';
    ctx.fillRect(x - s * 0.5, y - s * 1.3 + h * 0.02, s, s * 2.6);
    ctx.fillRect(x - s * 1.3, y - s * 0.5 + h * 0.02, s * 2.6, s);
  }

  // ---------------------------------------------------------------- Rage Mutant
  function angry(c2, x, y, ww, hh, o) {
    const top = y - hh / 2;
    // anger vein on the forehead
    const vx = x + ww * 0.24, vy = top + hh * 0.12;
    c2.strokeStyle = '#ff1744';
    c2.lineWidth = 2;
    c2.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      c2.moveTo(vx + Math.cos(a) * 1.5, vy + Math.sin(a) * 1.5);
      c2.quadraticCurveTo(vx + Math.cos(a + 0.4) * 4, vy + Math.sin(a + 0.4) * 4, vx + Math.cos(a) * 5, vy + Math.sin(a) * 5);
    }
    c2.stroke();
    // furious brows over the eye
    c2.fillStyle = '#1b0d22';
    c2.beginPath();
    c2.moveTo(x - ww * 0.36, top + hh * 0.18);
    c2.lineTo(x, top + hh * 0.3);
    c2.lineTo(x + ww * 0.36, top + hh * 0.18);
    c2.lineTo(x + ww * 0.36, top + hh * 0.24);
    c2.lineTo(x, top + hh * 0.36);
    c2.lineTo(x - ww * 0.36, top + hh * 0.24);
    c2.closePath();
    c2.fill();
    fortPlate(c2, x, y, ww, hh, o);
  }
  function steam(ctx, cx, cy, w, h) {
    for (const s of [-1, 1]) {
      const rnd = D.rng(s > 0 ? 5 : 6);
      for (let i = 0; i < 3; i++) {
        D.blobPath(ctx, cx + s * (w * 0.62 + i * 3), cy - h * (0.38 + i * 0.1), 3 - i * 0.5, 7, 0.3, rnd);
        D.fs(ctx, 'rgba(255,255,255,0.85)', 'rgba(42,29,20,0.5)', 0.7);
      }
    }
  }

  Object.assign(EA.SPEC, {
    rubber: { w: 26, h: 33, skin: '#c2185b', eyes: 2, mouth: 'teeth', hairLen: 0.6, after: rubberShine, front: swimRing },
    magma: { w: 28, h: 35, skin: '#d84315', eyes: 1, mouth: 'roar', hairLen: 0.3, armsUp: true, before: heatGlow, after: lavaCracks },
    healer: { w: 27, h: 34, skin: '#7e57c2', eyes: 2, mouth: 'teeth', hairLen: 0.4, after: nurseCap, front: medicBag },
    rage: { w: 30, h: 37, skin: '#ad1457', eyes: 1, mouth: 'roar', hairLen: 1.1, armsUp: true, after: angry, front: steam },
    // the Boss Battle El Macho is the same monster as the final boss
    elmacho: Object.assign({}, EA.SPEC.macho),
  });

  // ---------------------------------------------------------------- Maxime Le Mal
  // slim French villain with cockroach wings, antennae and the Roach Ray
  function maxime(ctx, sp, o) {
    const cx = o.tw / 2, foot = o.foot;
    const rnd = D.rng(o.seed);
    const dmg = o.damage || 0;
    D.shadow(ctx, cx, foot - 2, 38, 9, 0.35);
    // cockroach wing covers behind him
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(cx + s * 8, foot - 114);
      ctx.rotate(s * 0.42);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 44, 4, s * 50, 56, s * 26, 90);
      ctx.quadraticCurveTo(s * 8, 74, 0, 40);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 0, s * 34, 86, [[0, '#e0c19f'], [0.45, '#a1714a'], [1, '#5d3a1e']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(30,15,5,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s * 4, 8);
      ctx.quadraticCurveTo(s * 22, 30, s * 18, 74);
      ctx.stroke();
      D.ellipsePath(ctx, s * 16, 26, 4, 12, s * 0.3);
      D.fs(ctx, 'rgba(255,255,255,0.25)');
      // cracks when he is hurt
      if (dmg >= 2) {
        ctx.strokeStyle = '#1b0f08';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s * 10, 30);
        ctx.lineTo(s * 18, 42);
        ctx.lineTo(s * 12, 50);
        ctx.stroke();
      }
      ctx.restore();
    }
    // long thin legs in black trousers, pointy shoes
    for (const s of [-1, 1]) {
      D.rrPath(ctx, cx + s * 8 - 5, foot - 52, 10, 46, 4);
      ctx.fillStyle = D.lin(ctx, cx + s * 8 - 5, 0, cx + s * 8 + 5, 0, [[0, '#37474f'], [1, '#101417']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s * 8 - 6, foot - 8);
      ctx.quadraticCurveTo(cx + s * 8 + 4, foot - 12, cx + s * 8 + 16, foot - 4);
      ctx.lineTo(cx + s * 8 - 6, foot - 2);
      ctx.closePath();
      D.fs(ctx, '#111', OL, 1.2);
    }
    // back arm
    D.limb(ctx, cx - 16, foot - 100, cx - 26, foot - 60, 9, '#263238', { bend: [cx - 30, foot - 82], glove: true, gloveColor: '#1b1b1b' });
    // slim dark suit with tails
    ctx.beginPath();
    ctx.moveTo(cx - 17, foot - 110);
    ctx.quadraticCurveTo(cx - 24, foot - 80, cx - 20, foot - 48);
    ctx.lineTo(cx - 6, foot - 38);
    ctx.lineTo(cx, foot - 50);
    ctx.lineTo(cx + 6, foot - 38);
    ctx.lineTo(cx + 20, foot - 48);
    ctx.quadraticCurveTo(cx + 24, foot - 80, cx + 17, foot - 110);
    ctx.quadraticCurveTo(cx, foot - 116, cx - 17, foot - 110);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 24, 0, cx + 24, 0, [[0, '#455a64'], [0.5, '#263238'], [1, '#0d1214']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // shirt, cravat and a golden roach brooch
    ctx.beginPath();
    ctx.moveTo(cx - 7, foot - 110);
    ctx.lineTo(cx, foot - 82);
    ctx.lineTo(cx + 7, foot - 110);
    ctx.closePath();
    D.fs(ctx, '#eceff1', OL, 1.1);
    ctx.beginPath();
    ctx.moveTo(cx - 5, foot - 108);
    ctx.lineTo(cx + 5, foot - 108);
    ctx.lineTo(cx + 2, foot - 96);
    ctx.lineTo(cx - 2, foot - 96);
    ctx.closePath();
    D.fs(ctx, '#7cb342', OL, 0.9);
    ctx.save();
    ctx.translate(cx - 12, foot - 92);
    D.ellipsePath(ctx, 0, 0, 3, 4.4);
    ctx.fillStyle = D.rad(ctx, -1, -1, 0.4, 0, 0, 4.4, [[0, '#fffde7'], [1, '#c79100']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
    // high collar
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 8, foot - 112);
      ctx.lineTo(cx + s * 20, foot - 128);
      ctx.lineTo(cx + s * 16, foot - 108);
      ctx.closePath();
      D.fs(ctx, '#37474f', OL, 1.2);
    }
    // head
    const hx = cx + 3, hy = foot - 140;
    const skin = '#dfe8c8';
    ctx.beginPath();
    ctx.moveTo(hx - 15, hy - 6);
    ctx.bezierCurveTo(hx - 17, hy - 30, hx + 19, hy - 30, hx + 16, hy - 6);
    ctx.bezierCurveTo(hx + 16, hy + 14, hx + 10, hy + 26, hx + 1, hy + 28);
    ctx.bezierCurveTo(hx - 9, hy + 26, hx - 15, hy + 14, hx - 15, hy - 6);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, hx - 5, hy - 12, 2, hx, hy, 30, [[0, '#f9fbe7'], [0.6, skin], [1, '#9aae78']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // antennae
    for (const s of [-1, 1]) {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(hx + s * 5, hy - 22);
      ctx.bezierCurveTo(hx + s * 10, hy - 50, hx + s * 30, hy - 58, hx + s * 40, hy - 46);
      ctx.stroke();
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
    // slicked black hair with a widow's peak
    ctx.beginPath();
    ctx.moveTo(hx - 16, hy - 4);
    ctx.bezierCurveTo(hx - 20, hy - 34, hx + 22, hy - 36, hx + 17, hy - 4);
    ctx.quadraticCurveTo(hx + 12, hy - 18, hx + 1, hy - 10);
    ctx.quadraticCurveTo(hx - 10, hy - 18, hx - 16, hy - 4);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, hy - 34, 0, hy - 4, [[0, '#455a64'], [1, '#0d0d0d']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    D.ellipsePath(ctx, hx - 4, hy - 26, 7, 2, -0.2);
    D.fs(ctx, 'rgba(255,255,255,0.4)');
    // smug half-closed eyes
    for (const s of [-1, 1]) {
      const ex = hx + s * 7, ey = hy - 1;
      D.ellipsePath(ctx, ex, ey, 4.6, 3.4);
      D.fs(ctx, '#ffffff', OL, 1);
      D.circlePath(ctx, ex + 1.6, ey + 0.6, 1.9);
      D.fs(ctx, '#33691e');
      D.circlePath(ctx, ex + 1.8, ey + 0.6, 0.9);
      D.fs(ctx, '#111');
      ctx.save();
      D.ellipsePath(ctx, ex, ey, 4.6, 3.4);
      ctx.clip();
      ctx.fillStyle = '#b5c48f';
      ctx.fillRect(ex - 5, ey - 4, 10, 3.6);
      ctx.restore();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex - 5, ey - 4.8 + (s > 0 ? 1 : 0));
      ctx.lineTo(ex + 5, ey - 6 + (s > 0 ? 0 : 1));
      ctx.stroke();
    }
    // long nose, thin moustache and a smug smile
    ctx.beginPath();
    ctx.moveTo(hx + 1, hy);
    ctx.quadraticCurveTo(hx + 9, hy + 10, hx + 3, hy + 12);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy + 16);
    ctx.quadraticCurveTo(hx + 2, hy + 12, hx + 12, hy + 15);
    ctx.stroke();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy + 19);
    ctx.quadraticCurveTo(hx + 3, hy + 23, hx + 11, hy + 18);
    ctx.stroke();
    // front arm with the Roach Ray
    D.limb(ctx, cx + 16, foot - 102, cx + 28, foot - 82, 9, '#263238', { bend: [cx + 30, foot - 100], glove: true, gloveColor: '#1b1b1b' });
    ctx.save();
    ctx.translate(cx + 26, foot - 84);
    D.rrPath(ctx, -4, -6, 30, 12, 5);
    ctx.fillStyle = D.lin(ctx, 0, -6, 0, 6, [[0, '#cfd8dc'], [1, '#37474f']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.circlePath(ctx, 6, -9, 6);
    ctx.fillStyle = D.rad(ctx, 4, -11, 0.5, 6, -9, 6, [[0, '#f1f8e9'], [0.5, '#9ccc65'], [1, '#33691e']]);
    ctx.fill();
    ctx.stroke();
    MT.ExtraArt.roach(ctx, 6, -9, 0.22);
    D.ellipsePath(ctx, 27, 0, 3.5, 7);
    D.fs(ctx, '#76ff03', OL, 1.2);
    ctx.fillStyle = D.rad(ctx, 30, 0, 0, 30, 0, 12, [[0, 'rgba(204,255,144,0.8)'], [1, 'rgba(118,255,3,0)']]);
    D.circlePath(ctx, 30, 0, 12);
    ctx.fill();
    ctx.restore();
    // plasters and dents as he takes damage
    for (let i = 0; i < dmg; i++) {
      const x = cx - 14 + rnd() * 28, y = foot - 108 + rnd() * 50;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rnd() * 1.5 - 0.75);
      D.rrPath(ctx, -7, -2.5, 14, 5, 2);
      D.fs(ctx, '#ffe0b2', OL, 0.9);
      ctx.restore();
    }
  }

  EA.SPEC.maxime = { w: 54, h: 100, boss: true, painter: maxime };
})();
