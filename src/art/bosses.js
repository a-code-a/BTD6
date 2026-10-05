// Endgame monster artwork: Phantom Mutant, Mecha Mutant, Goo Behemoth and the
// final boss, Mutant El Macho. Registered as custom painters in EnemyArt.SPEC.
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;
  const EA = MT.EnemyArt;
  const { metalPlate, rivet, bossDamage } = EA.helpers;
  const glowRing = MT.TowerArt.props.glowRing;

  const geo = (sp, o) => ({ cx: o.tw / 2, cy: o.foot - sp.h * 0.69, w: sp.w, h: sp.h, foot: o.foot, rnd: D.rng(o.seed), dmg: o.damage || 0 });

  function crazyEye(ctx, x, y, r, rnd, rim, look = 0.5) {
    M.goggle(ctx, x, y, r, { lw: Math.max(1.4, r * 0.12), style: 'crazy', rand: rnd, lookX: look, pupil: 0.16, rim });
  }

  function cracks(ctx, x, y, w, h, n, rnd, col = '#1a0d24') {
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.3;
    for (let i = 0; i < n; i++) {
      let px = x + rnd() * w, py = y + rnd() * h;
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (let k = 0; k < 4; k++) {
        px += (rnd() - 0.5) * w * 0.25;
        py += (rnd() - 0.3) * h * 0.2;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- Phantom
  function phantom(ctx, sp, o) {
    const { cx, cy, w, h, rnd, dmg } = geo(sp, o);
    glowRing(ctx, cx, cy, w * 1.05, '#b388ff', 0.45);
    const top = cy - h / 2;
    const bot = cy + h * 0.55;
    // wispy hair
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (1.05 + (i / 14) * 0.9);
      const rr = i % 2 ? w * (0.62 + rnd() * 0.3) : w * 0.42;
      const x = cx + Math.cos(a) * rr, y = top + w * 0.48 + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    D.fs(ctx, 'rgba(225,215,255,0.9)', OL, 1.6);
    // ghost body with a tattered, trailing tail
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, top + w / 2);
      ctx.arc(cx, top + w / 2, w / 2, Math.PI, 0);
      ctx.quadraticCurveTo(cx + w * 0.56, cy + h * 0.2, cx + w * 0.4, bot - 6);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const x0 = cx + w * 0.4 - (i + 1) * ((w * 1.2) / n);
        const tipX = x0 + (w * 0.6) / n - w * 0.18;
        ctx.quadraticCurveTo(tipX + w * 0.12, bot + 12 + (i % 2) * 8, tipX - w * 0.05, bot + 4 + (i % 2) * 10);
        ctx.quadraticCurveTo(x0 + w * 0.05, bot - 2, x0, bot - 6 - (i === n - 1 ? 4 : 0));
      }
      ctx.quadraticCurveTo(cx - w * 0.6, cy + h * 0.15, cx - w / 2, top + w / 2);
      ctx.closePath();
    };
    body();
    ctx.fillStyle = D.lin(ctx, 0, top, 0, bot + 14, [[0, 'rgba(206,190,255,0.96)'], [0.5, 'rgba(126,87,194,0.92)'], [1, 'rgba(69,39,160,0.55)']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    body();
    ctx.clip();
    // spectral swirls
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(cx - w * 0.1 + i * 6, cy + h * 0.15 + i * 5, w * (0.18 + i * 0.06), 0.4, 2.6);
      ctx.stroke();
    }
    // tears in the ectoplasm as it takes damage
    for (let i = 0; i < dmg * 2; i++) {
      const x = cx - w * 0.35 + rnd() * w * 0.7, y = cy - h * 0.05 + rnd() * h * 0.45;
      D.ellipsePath(ctx, x, y, 2.5 + rnd() * 3, 6 + rnd() * 5, rnd());
      D.fs(ctx, 'rgba(20,0,40,0.55)');
    }
    ctx.restore();
    // reaching arms
    [-1, 1].forEach((s) => {
      D.limb(ctx, cx + s * w * 0.42, cy + h * 0.02, cx + s * w * 0.86, cy - h * 0.12, w * 0.13, '#9575cd', { bend: [cx + s * w * 0.8, cy + h * 0.16], lw: 1.8, glove: false });
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(cx + s * w * 0.86, cy - h * 0.12);
        ctx.lineTo(cx + s * (w * 0.96 + Math.abs(k) * 2), cy - h * 0.16 + k * 5);
        ctx.strokeStyle = OL;
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.strokeStyle = '#ede7f6';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    });
    // giant single eye + hollow mouth
    ctx.fillStyle = '#262626';
    ctx.fillRect(cx - w / 2, cy - h * 0.25, w, h * 0.09);
    crazyEye(ctx, cx, cy - h * 0.21, w * 0.27, rnd, '#9575cd', 0.4);
    D.ellipsePath(ctx, cx, cy + h * 0.1, w * 0.17, h * 0.12);
    ctx.fillStyle = D.rad(ctx, cx, cy + h * 0.1, 0, cx, cy + h * 0.1, w * 0.2, [[0, '#000000'], [1, '#2a0845']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#f3e5f5';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * w * 0.08 - 3, cy + h * 0.0);
      ctx.lineTo(cx + i * w * 0.08 + 3, cy + h * 0.0);
      ctx.lineTo(cx + i * w * 0.08, cy + h * 0.07);
      ctx.closePath();
      ctx.fill();
    }
    // shackle on one wrist
    D.rrPath(ctx, cx + w * 0.74, cy - h * 0.1, 9, 6, 2);
    D.fs(ctx, '#9e9e9e', OL, 1);
    if (o.fort) {
      metalPlate(ctx, cx - w * 0.3, cy + h * 0.2, w * 0.6, h * 0.14, false);
      metalPlate(ctx, cx - w * 0.28, top + 2, w * 0.56, h * 0.09, false);
    }
  }

  // ---------------------------------------------------------------- Mecha
  function mecha(ctx, sp, o) {
    const { cx, cy, w, h, rnd, dmg, foot } = geo(sp, o);
    D.shadow(ctx, cx, foot - 2, w * 0.62, w * 0.16, 0.36);
    const steel = (x0, x1) => D.lin(ctx, x0, 0, x1, 0, [[0, '#eceff1'], [0.35, '#b0bec5'], [1, '#37474f']]);
    const trim = o.fort ? '#d4a52a' : '#7b1fa2';
    // legs
    [-1, 1].forEach((s) => {
      const lx = cx + s * w * 0.22;
      D.rrPath(ctx, lx - w * 0.1, cy + h * 0.22, w * 0.2, h * 0.3, 5);
      ctx.fillStyle = steel(lx - w * 0.1, lx + w * 0.1);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      D.circlePath(ctx, lx, cy + h * 0.36, w * 0.07);
      D.fs(ctx, '#546e7a', OL, 1.4);
      D.rrPath(ctx, lx - w * 0.17 + s * 3, foot - 16, w * 0.34, 13, 5);
      ctx.fillStyle = D.lin(ctx, 0, foot - 16, 0, foot - 3, [[0, '#78909c'], [1, '#263238']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.stroke();
    });
    // back arm (behind torso)
    D.limb(ctx, cx - w * 0.42, cy - h * 0.16, cx - w * 0.68, cy + h * 0.18, w * 0.14, '#78909c', { bend: [cx - w * 0.7, cy - h * 0.08], lw: 1.8, glove: false });
    // claw
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.68, cy + h * 0.18);
      ctx.quadraticCurveTo(cx - w * 0.75 + k * 6, cy + h * 0.26, cx - w * 0.68 + k * 9, cy + h * 0.3);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // EMP coil on the back
    D.rrPath(ctx, cx - w * 0.62, cy - h * 0.48, w * 0.16, h * 0.34, 4);
    D.fs(ctx, '#455a64', OL, 1.5);
    for (let i = 0; i < 4; i++) {
      D.ellipsePath(ctx, cx - w * 0.54, cy - h * 0.44 + i * h * 0.075, w * 0.1, 2.6);
      D.fs(ctx, '#d9822b', OL, 0.9);
    }
    MT.TowerArt.props.energyBall(ctx, cx - w * 0.54, cy - h * 0.52, 5, '#40c4ff');
    // torso
    const tx = cx - w * 0.48, ty = cy - h * 0.32, tw2 = w * 0.96, th2 = h * 0.6;
    D.rrPath(ctx, tx, ty, tw2, th2, 14);
    ctx.fillStyle = steel(tx, tx + tw2);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.save();
    D.rrPath(ctx, tx, ty, tw2, th2, 14);
    ctx.clip();
    // hazard band
    for (let i = -8; i < 14; i++) {
      ctx.fillStyle = i % 2 ? '#ffc61a' : '#263238';
      ctx.beginPath();
      ctx.moveTo(tx + i * 9, cy + h * 0.16);
      ctx.lineTo(tx + i * 9 + 9, cy + h * 0.16);
      ctx.lineTo(tx + i * 9 + 3, cy + h * 0.24);
      ctx.lineTo(tx + i * 9 - 6, cy + h * 0.24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = trim;
    ctx.fillRect(tx, ty + 8, tw2, 5);
    // panel seams
    ctx.strokeStyle = 'rgba(30,40,50,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, ty + 14);
    ctx.lineTo(cx, cy + h * 0.16);
    ctx.moveTo(tx, cy - h * 0.04);
    ctx.lineTo(tx + tw2, cy - h * 0.04);
    ctx.stroke();
    // damage: cracks, holes and scorch marks
    if (dmg > 0) {
      cracks(ctx, tx + 6, ty + 10, tw2 - 12, th2 - 20, dmg * 2, rnd);
      for (let i = 0; i < dmg; i++) {
        D.blobPath(ctx, tx + 12 + rnd() * (tw2 - 24), ty + 16 + rnd() * (th2 - 32), 5 + rnd() * 4, 7, 0.4, rnd);
        D.fs(ctx, 'rgba(20,20,20,0.5)');
      }
    }
    if (dmg >= 3) {
      D.rrPath(ctx, cx + w * 0.05, cy - h * 0.02, w * 0.22, h * 0.14, 3);
      D.fs(ctx, '#111');
      ctx.strokeStyle = '#ff5252';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.08, cy + h * 0.02);
      ctx.quadraticCurveTo(cx + w * 0.16, cy + h * 0.14, cx + w * 0.24, cy + h * 0.04);
      ctx.stroke();
      ctx.strokeStyle = '#40c4ff';
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.1, cy);
      ctx.quadraticCurveTo(cx + w * 0.2, cy + h * 0.12, cx + w * 0.25, cy + h * 0.1);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < 4; i++) rivet(ctx, tx + 8 + (i % 2) * (tw2 - 16), ty + 8 + Math.floor(i / 2) * (th2 - 16), 2.2);
    // visor with glowing eyes (front = right)
    D.rrPath(ctx, cx + w * 0.02, cy - h * 0.24, w * 0.4, h * 0.09, 4);
    D.fs(ctx, '#1a1a1a', OL, 1.4);
    [0.12, 0.3].forEach((f) => {
      glowRing(ctx, cx + w * f, cy - h * 0.195, 7, '#ff1744', 0.8);
      D.circlePath(ctx, cx + w * f, cy - h * 0.195, 2.8);
      D.fs(ctx, '#ff5252');
    });
    // vent grill
    for (let i = 0; i < 4; i++) {
      D.rrPath(ctx, cx - w * 0.36, cy - h * 0.02 + i * 5, w * 0.24, 2.4, 1);
      D.fs(ctx, '#263238');
    }
    // glass cockpit with the purple pilot
    const domeY = ty + 2;
    const dr = w * 0.27;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, domeY, dr, Math.PI, 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(128,216,255,0.35)';
    ctx.fillRect(cx - dr, domeY - dr, dr * 2, dr);
    M.draw(ctx, { x: cx, y: domeY - dr * 0.25, w: dr * 0.9, h: dr * 1.2, skin: '#8a3fb8', eyes: 1, eyeStyle: 'crazy', hair: 'wild', hairLen: 0.6, mouth: 'teeth', seed: 77, legs: false, overalls: false, lw: 1.2, arms: [] });
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, domeY, dr, Math.PI, 0);
    ctx.closePath();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, domeY, dr * 0.75, Math.PI * 1.15, Math.PI * 1.45);
    ctx.stroke();
    D.rrPath(ctx, cx - dr - 3, domeY - 3, dr * 2 + 6, 7, 3);
    D.fs(ctx, trim, OL, 1.4);
    // antenna
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + dr * 0.6, domeY - dr * 0.8);
    ctx.lineTo(cx + dr * 0.9, domeY - dr * 1.6);
    ctx.stroke();
    D.circlePath(ctx, cx + dr * 0.9, domeY - dr * 1.6, 3);
    D.fs(ctx, '#ff1744', OL, 1);
    // front cannon arm
    const sx = cx + w * 0.44, sy = cy - h * 0.14;
    D.circlePath(ctx, sx, sy, w * 0.12);
    ctx.fillStyle = steel(sx - w * 0.12, sx + w * 0.12);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    D.rrPath(ctx, sx, sy - w * 0.09, w * 0.5, w * 0.18, w * 0.08);
    ctx.fillStyle = D.lin(ctx, 0, sy - w * 0.09, 0, sy + w * 0.09, [[0, '#cfd8dc'], [1, '#37474f']]);
    ctx.fill();
    ctx.stroke();
    D.rrPath(ctx, sx + w * 0.44, sy - w * 0.12, w * 0.12, w * 0.24, 3);
    D.fs(ctx, '#263238', OL, 1.6);
    D.ellipsePath(ctx, sx + w * 0.56, sy, 3, w * 0.08);
    D.fs(ctx, '#ff6d00');
    ctx.fillStyle = trim;
    ctx.fillRect(sx + w * 0.12, sy - w * 0.09, 4, w * 0.18);
    if (dmg >= 2) {
      // sparks
      for (let i = 0; i < dmg; i++) {
        D.starPath(ctx, cx - w * 0.3 + rnd() * w * 0.6, cy - h * 0.3 + rnd() * h * 0.4, 4, 5, 1.5);
        D.fs(ctx, '#ffeb3b');
      }
    }
    if (o.fort) {
      metalPlate(ctx, cx - w * 0.45, cy - h * 0.38, w * 0.3, h * 0.12, true);
      metalPlate(ctx, cx + w * 0.15, cy - h * 0.38, w * 0.3, h * 0.12, true);
    }
  }

  // ---------------------------------------------------------------- Goo Behemoth
  function goo(ctx, sp, o) {
    const { cx, cy, w, h, rnd, dmg, foot } = geo(sp, o);
    D.shadow(ctx, cx, foot - 3, w * 0.7, w * 0.14, 0.32);
    const top = cy - h * 0.62;
    const base = foot - 6;
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.66, base);
      ctx.bezierCurveTo(cx - w * 0.74, cy - h * 0.1, cx - w * 0.42, top, cx, top);
      ctx.bezierCurveTo(cx + w * 0.42, top, cx + w * 0.74, cy - h * 0.1, cx + w * 0.66, base);
      // puddle edge
      for (let i = 0; i < 6; i++) {
        const x1 = cx + w * 0.66 - (i + 1) * ((w * 1.32) / 6);
        ctx.quadraticCurveTo(x1 + (w * 0.11), base + 6 + (i % 2) * 3, x1, base);
      }
      ctx.closePath();
    };
    shape();
    ctx.fillStyle = D.rad(ctx, cx - w * 0.2, top + h * 0.25, 4, cx, cy, w * 0.8, [[0, 'rgba(234,190,255,0.97)'], [0.45, 'rgba(171,71,188,0.95)'], [1, 'rgba(94,25,120,0.95)']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.save();
    shape();
    ctx.clip();
    // swallowed junk
    MT.TowerArt.props.banana(ctx, cx + w * 0.32, cy + h * 0.25, 1.3, 0.6, '#d4e157');
    ctx.save();
    ctx.globalAlpha = 0.7;
    D.rrPath(ctx, cx - w * 0.45, cy + h * 0.2, w * 0.2, 5, 2.5);
    D.fs(ctx, '#f5f5f5', OL, 1);
    ctx.restore();
    // bubbles
    for (let i = 0; i < 14; i++) {
      const r = 2 + rnd() * 6;
      D.circlePath(ctx, cx - w * 0.55 + rnd() * w * 1.1, cy - h * 0.2 + rnd() * h * 0.7, r);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // wounds
    for (let i = 0; i < dmg * 2; i++) {
      D.blobPath(ctx, cx - w * 0.45 + rnd() * w * 0.9, cy - h * 0.15 + rnd() * h * 0.6, 4 + rnd() * 5, 7, 0.4, rnd);
      D.fs(ctx, 'rgba(60,10,80,0.55)');
    }
    ctx.restore();
    // sheen
    D.ellipsePath(ctx, cx - w * 0.28, top + h * 0.22, w * 0.16, h * 0.07, -0.5);
    D.fs(ctx, 'rgba(255,255,255,0.55)');
    // drips
    for (let i = 0; i < 5; i++) {
      const x = cx - w * 0.55 + i * w * 0.27 + rnd() * 6;
      const y = cy - h * 0.05 + rnd() * h * 0.25;
      ctx.beginPath();
      ctx.moveTo(x - 3, y);
      ctx.quadraticCurveTo(x, y + 14 + rnd() * 8, x + 3, y);
      ctx.closePath();
      D.fs(ctx, 'rgba(206,147,216,0.95)', 'rgba(42,29,20,0.6)', 1);
    }
    // face: two crazy goggles and a gooey grin
    ctx.fillStyle = '#262626';
    ctx.fillRect(cx - w * 0.4, cy - h * 0.38, w * 0.8, h * 0.08);
    crazyEye(ctx, cx - w * 0.15, cy - h * 0.34, w * 0.12, rnd, '#ce93d8', 0.3);
    crazyEye(ctx, cx + w * 0.15, cy - h * 0.34, w * 0.13, rnd, '#ce93d8', 0.9);
    const my = cy - h * 0.08;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.26, my);
    ctx.quadraticCurveTo(cx, my - h * 0.06, cx + w * 0.26, my);
    ctx.quadraticCurveTo(cx + w * 0.1, my + h * 0.3, cx - w * 0.04, my + h * 0.22);
    ctx.quadraticCurveTo(cx - w * 0.2, my + h * 0.2, cx - w * 0.26, my);
    ctx.closePath();
    D.fs(ctx, '#2a0636', OL, 1.8);
    ctx.fillStyle = '#fffbea';
    for (let i = 0; i < 6; i++) {
      const tx = cx - w * 0.22 + i * w * 0.088;
      ctx.beginPath();
      ctx.moveTo(tx - 3.5, my - 1);
      ctx.lineTo(tx + 3.5, my - 1);
      ctx.lineTo(tx, my + 7 + (i % 2) * 3);
      ctx.closePath();
      ctx.fill();
    }
    D.ellipsePath(ctx, cx + w * 0.02, my + h * 0.16, w * 0.08, h * 0.05);
    D.fs(ctx, '#8bc34a');
    if (o.fort) {
      metalPlate(ctx, cx - w * 0.3, top + 6, w * 0.6, h * 0.1, false);
      metalPlate(ctx, cx - w * 0.5, cy + h * 0.15, w * 0.22, h * 0.14, false);
      metalPlate(ctx, cx + w * 0.28, cy + h * 0.15, w * 0.22, h * 0.14, false);
    }
  }

  // ---------------------------------------------------------------- Mutant El Macho
  function furPath(ctx, pts, rnd, amp) {
    // jagged furry outline through a list of points
    ctx.beginPath();
    pts.forEach((p, i) => {
      const n = pts[(i + 1) % pts.length];
      if (i === 0) ctx.moveTo(p[0], p[1]);
      const steps = Math.max(2, Math.round(Math.hypot(n[0] - p[0], n[1] - p[1]) / 9));
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const x = p[0] + (n[0] - p[0]) * t, y = p[1] + (n[1] - p[1]) * t;
        const nx = -(n[1] - p[1]), ny = n[0] - p[0];
        const l = Math.hypot(nx, ny) || 1;
        const j = k === steps ? 0 : amp * (0.5 + rnd() * 0.8);
        ctx.lineTo(x + (nx / l) * j, y + (ny / l) * j);
      }
    });
    ctx.closePath();
  }

  function macho(ctx, sp, o) {
    const { cx, cy, w, h, rnd, dmg, foot } = geo(sp, o);
    D.shadow(ctx, cx, foot - 3, w * 0.6, w * 0.15, 0.38);
    glowRing(ctx, cx, cy - h * 0.1, w * 0.95, '#ff1744', 0.25);
    const fur = '#8e24aa', furD = '#4a148c', furL = '#ce93d8';
    // legs + boots
    [-1, 1].forEach((s) => {
      const lx = cx + s * w * 0.2;
      furPath(ctx, [[lx - w * 0.12, cy + h * 0.2], [lx + w * 0.12, cy + h * 0.2], [lx + w * 0.11, foot - 18], [lx - w * 0.11, foot - 18]], rnd, 2.5);
      D.fs(ctx, fur, OL, 2);
      D.rrPath(ctx, lx - w * 0.14 + s * 4, foot - 22, w * 0.28, 18, 7);
      ctx.fillStyle = D.lin(ctx, 0, foot - 22, 0, foot - 4, [[0, '#424242'], [1, '#111']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#ffc400';
      ctx.fillRect(lx - w * 0.14 + s * 4, foot - 20, w * 0.28, 3);
    });
    // luchador shorts
    D.rrPath(ctx, cx - w * 0.38, cy + h * 0.12, w * 0.76, h * 0.2, 8);
    ctx.fillStyle = D.lin(ctx, 0, cy + h * 0.12, 0, cy + h * 0.32, [[0, '#ff5252'], [1, '#b71c1c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    // huge arms flexing upwards (behind torso edges)
    [-1, 1].forEach((s) => {
      const shX = cx + s * w * 0.42, shY = cy - h * 0.24;
      const elX = cx + s * w * 0.78, elY = cy - h * 0.12;
      const fX = cx + s * w * 0.72, fY = cy - h * 0.5;
      D.limb(ctx, shX, shY, elX, elY, w * 0.2, fur, { lw: 2, glove: false });
      D.limb(ctx, elX, elY, fX, fY, w * 0.17, fur, { lw: 2, glove: false });
      // bicep highlight
      D.ellipsePath(ctx, (shX + elX) / 2, (shY + elY) / 2 - 4, w * 0.08, w * 0.04, s * 0.3);
      D.fs(ctx, D.rgba(furL, 0.5));
      // fist
      D.circlePath(ctx, fX, fY, w * 0.11);
      ctx.fillStyle = D.rad(ctx, fX - 4, fY - 4, 1, fX, fY, w * 0.11, [[0, furL], [0.5, fur], [1, furD]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.arc(fX + k * w * 0.05, fY - w * 0.08, w * 0.03, Math.PI, 0);
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      // wristband
      D.rrPath(ctx, fX - w * 0.09, fY + w * 0.07, w * 0.18, w * 0.06, 2);
      D.fs(ctx, '#ffc400', OL, 1.2);
    });
    // torso (furry barrel chest)
    const tPts = [
      [cx - w * 0.5, cy - h * 0.3], [cx - w * 0.2, cy - h * 0.36], [cx + w * 0.2, cy - h * 0.36], [cx + w * 0.5, cy - h * 0.3],
      [cx + w * 0.46, cy - h * 0.02], [cx + w * 0.36, cy + h * 0.18], [cx - w * 0.36, cy + h * 0.18], [cx - w * 0.46, cy - h * 0.02],
    ];
    furPath(ctx, tPts, rnd, 3.5);
    ctx.fillStyle = D.lin(ctx, cx - w * 0.5, 0, cx + w * 0.5, 0, [[0, furL], [0.35, fur], [1, furD]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    // pecs & abs
    ctx.strokeStyle = D.rgba(furD, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.3, cy - h * 0.1);
    ctx.quadraticCurveTo(cx - w * 0.15, cy - h * 0.02, cx, cy - h * 0.1);
    ctx.quadraticCurveTo(cx + w * 0.15, cy - h * 0.02, cx + w * 0.3, cy - h * 0.1);
    ctx.moveTo(cx, cy - h * 0.06);
    ctx.lineTo(cx, cy + h * 0.12);
    for (let i = 0; i < 2; i++) {
      ctx.moveTo(cx - w * 0.1, cy + h * (0.0 + i * 0.06));
      ctx.lineTo(cx + w * 0.1, cy + h * (0.0 + i * 0.06));
    }
    ctx.stroke();
    // chest fur tuft
    ctx.strokeStyle = D.rgba('#1a0a24', 0.6);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      const x = cx - w * 0.12 + rnd() * w * 0.24, y = cy - h * 0.2 + rnd() * h * 0.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 3, y + 4, x + 1, y + 8);
      ctx.stroke();
    }
    // gold belt
    D.rrPath(ctx, cx - w * 0.4, cy + h * 0.1, w * 0.8, h * 0.07, 4);
    ctx.fillStyle = D.lin(ctx, 0, cy + h * 0.1, 0, cy + h * 0.17, [[0, '#fff3b0'], [0.5, '#ffc400'], [1, '#8a6410']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    D.ellipsePath(ctx, cx, cy + h * 0.135, w * 0.11, h * 0.06);
    D.fs(ctx, '#ffd54f', OL, 1.6);
    D.starPath(ctx, cx, cy + h * 0.135, 5, w * 0.05, w * 0.022);
    D.fs(ctx, '#e53935', OL, 0.8);
    // gold chain with medallion
    ctx.strokeStyle = '#ffc400';
    ctx.lineWidth = 3;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.2, cy - h * 0.33);
    ctx.quadraticCurveTo(cx, cy - h * 0.08, cx + w * 0.2, cy - h * 0.33);
    ctx.stroke();
    ctx.setLineDash([]);
    D.circlePath(ctx, cx, cy - h * 0.15, w * 0.065);
    ctx.fillStyle = D.rad(ctx, cx - 3, cy - h * 0.17, 1, cx, cy - h * 0.15, w * 0.07, [[0, '#fffde7'], [0.5, '#ffc400'], [1, '#8a6410']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = OL;
    ctx.font = 'bold 11px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', cx, cy - h * 0.148);
    // head
    const hy = cy - h * 0.46, hw = w * 0.36;
    // pompadour hair (behind + on top)
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.62, hy + hw * 0.1);
    ctx.bezierCurveTo(cx - hw * 0.9, hy - hw * 1.1, cx + hw * 0.4, hy - hw * 1.5, cx + hw * 1.15, hy - hw * 0.9);
    ctx.bezierCurveTo(cx + hw * 0.8, hy - hw * 0.75, cx + hw * 0.9, hy - hw * 0.5, cx + hw * 0.62, hy + hw * 0.1);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, hy - hw * 1.4, 0, hy, [[0, '#37474f'], [0.4, '#1a1a1a'], [1, '#000000']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(144,164,174,0.6)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.4 + i * 6, hy - hw * 0.2);
      ctx.quadraticCurveTo(cx + i * 4, hy - hw * (1.0 + i * 0.1), cx + hw * (0.7 + i * 0.1), hy - hw * 0.85);
      ctx.stroke();
    }
    // furry face
    furPath(ctx, [[cx - hw * 0.62, hy - hw * 0.25], [cx + hw * 0.62, hy - hw * 0.25], [cx + hw * 0.66, hy + hw * 0.5], [cx, hy + hw * 0.92], [cx - hw * 0.66, hy + hw * 0.5]], rnd, 2.6);
    ctx.fillStyle = D.rad(ctx, cx - hw * 0.2, hy, 2, cx, hy + hw * 0.2, hw, [[0, furL], [0.55, fur], [1, furD]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    // angry brows + eyes
    [-1, 1].forEach((s) => {
      const ex = cx + s * hw * 0.3, ey = hy + hw * 0.08;
      D.ellipsePath(ctx, ex, ey, hw * 0.17, hw * 0.13);
      D.fs(ctx, '#fff59d', OL, 1.4);
      D.circlePath(ctx, ex + hw * 0.04, ey + 1, hw * 0.07);
      D.fs(ctx, '#d50000');
      D.circlePath(ctx, ex + hw * 0.04, ey + 1, hw * 0.03);
      D.fs(ctx, '#111');
      ctx.beginPath();
      ctx.moveTo(ex - s * hw * 0.22, ey - hw * 0.22);
      ctx.lineTo(ex + s * hw * 0.2, ey - hw * 0.08);
      ctx.lineTo(ex + s * hw * 0.2, ey - hw * 0.15);
      ctx.lineTo(ex - s * hw * 0.22, ey - hw * 0.3);
      ctx.closePath();
      D.fs(ctx, '#111', OL, 1);
    });
    // nose
    D.ellipsePath(ctx, cx, hy + hw * 0.3, hw * 0.12, hw * 0.09);
    D.fs(ctx, furD, OL, 1.2);
    // roaring mouth with fangs
    const my = hy + hw * 0.52;
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.34, my);
    ctx.quadraticCurveTo(cx, my - hw * 0.08, cx + hw * 0.34, my);
    ctx.quadraticCurveTo(cx, my + hw * 0.42, cx - hw * 0.34, my);
    ctx.closePath();
    D.fs(ctx, '#3b0d17', OL, 1.6);
    ctx.fillStyle = '#fffbea';
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(cx + s * hw * 0.24, my - 1);
      ctx.lineTo(cx + s * hw * 0.14, my - 1);
      ctx.lineTo(cx + s * hw * 0.19, my + hw * 0.2);
      ctx.closePath();
      ctx.fill();
    });
    // handlebar mustache
    ctx.beginPath();
    ctx.moveTo(cx, my - hw * 0.08);
    ctx.bezierCurveTo(cx - hw * 0.3, my - hw * 0.2, cx - hw * 0.55, my - hw * 0.05, cx - hw * 0.62, my - hw * 0.25);
    ctx.bezierCurveTo(cx - hw * 0.6, my + hw * 0.05, cx - hw * 0.25, my + hw * 0.02, cx, my - hw * 0.02);
    ctx.bezierCurveTo(cx + hw * 0.25, my + hw * 0.02, cx + hw * 0.6, my + hw * 0.05, cx + hw * 0.62, my - hw * 0.25);
    ctx.bezierCurveTo(cx + hw * 0.55, my - hw * 0.05, cx + hw * 0.3, my - hw * 0.2, cx, my - hw * 0.08);
    ctx.closePath();
    D.fs(ctx, '#111', OL, 1.2);
    // damage (bruises, band-aids, torn fur)
    bossDamage(ctx, cx, cy, w * 0.9, h * 0.8, dmg, rnd);
    if (dmg >= 2) cracks(ctx, cx - w * 0.4, cy - h * 0.3, w * 0.8, h * 0.4, dmg, rnd, 'rgba(20,0,30,0.7)');
    if (o.fort) {
      metalPlate(ctx, cx - w * 0.55, cy - h * 0.36, w * 0.24, h * 0.12, true);
      metalPlate(ctx, cx + w * 0.31, cy - h * 0.36, w * 0.24, h * 0.12, true);
    }
  }

  Object.assign(EA.SPEC, {
    phantom: { w: 64, h: 80, boss: true, ghost: true, painter: phantom },
    mecha: { w: 80, h: 96, boss: true, painter: mecha },
    goo: { w: 96, h: 76, boss: true, painter: goo },
    macho: { w: 120, h: 132, boss: true, painter: macho },
  });
})();
