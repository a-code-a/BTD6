// Textures for the new systems: Gru Coins and lab icons, powers, the regrow
// badge, new projectiles, the new heroes' ability badges and helpers, and the
// boss attack overlays (Pollito pecking, cockroaches).
(function () {
  const D = MT.Draw;
  const OL = D.OL;

  function iconBadge(ctx, s, c1, c2) {
    D.circlePath(ctx, s / 2, s / 2, s / 2 - 2);
    ctx.fillStyle = D.rad(ctx, s * 0.38, s * 0.3, 2, s / 2, s / 2, s / 2, [[0, c1], [1, c2]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    D.ellipsePath(ctx, s * 0.4, s * 0.25, s * 0.22, s * 0.1, -0.3);
    D.fs(ctx, 'rgba(255,255,255,0.35)');
  }

  // square-ish badge for powers, so they read differently from abilities
  function powerBadge(ctx, s, c1, c2) {
    D.rrPath(ctx, 3, 3, s - 6, s - 6, 12);
    ctx.fillStyle = D.lin(ctx, 0, 0, 0, s, [[0, c1], [1, c2]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    D.rrPath(ctx, 7, 6, s - 14, s * 0.32, 8);
    D.fs(ctx, 'rgba(255,255,255,0.28)');
  }

  function goldCoin(ctx, x, y, r, mark) {
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.4, y - r * 0.4, 1, x, y, r, [[0, '#fffbe0'], [0.45, '#ffd740'], [1, '#b8860b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = Math.max(1, r * 0.13);
    ctx.stroke();
    D.circlePath(ctx, x, y, r * 0.74);
    ctx.strokeStyle = 'rgba(140,90,0,0.65)';
    ctx.lineWidth = Math.max(0.8, r * 0.08);
    ctx.stroke();
    if (mark) {
      ctx.fillStyle = '#8a5a00';
      ctx.font = `bold ${Math.round(r * 1.15)}px "Arial Black", Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mark, x + 0.3, y + r * 0.08);
      ctx.fillStyle = '#fff3b0';
      ctx.fillText(mark, x - 0.5, y - r * 0.02);
    }
    D.ellipsePath(ctx, x - r * 0.35, y - r * 0.45, r * 0.32, r * 0.14, -0.5);
    D.fs(ctx, 'rgba(255,255,255,0.7)');
  }

  function peel(ctx, x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    // three floppy peel flaps around the stem
    [-1.1, 0, 1.1].forEach((a) => {
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.quadraticCurveTo(-6, 9, 0, 14);
      ctx.quadraticCurveTo(6, 9, 3, 0);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, -6, 0, 6, 0, [[0, '#fff59d'], [0.5, '#ffd83a'], [1, '#c79100']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      D.ellipsePath(ctx, 0, 11, 1.8, 2.4);
      D.fs(ctx, 'rgba(110,70,20,0.55)');
      ctx.restore();
    });
    D.rrPath(ctx, -2, -5, 4, 6, 1.5);
    D.fs(ctx, '#8d6e63', OL, 0.8);
    ctx.restore();
  }

  function snowflake(ctx, x, y, r, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = r * 0.16;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.stroke();
      const bx = x + Math.cos(a) * r * 0.6, by = y + Math.sin(a) * r * 0.6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a + 0.7) * r * 0.3, by + Math.sin(a + 0.7) * r * 0.3);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a - 0.7) * r * 0.3, by + Math.sin(a - 0.7) * r * 0.3);
      ctx.stroke();
    }
  }

  function heart(ctx, x, y, s, c1, c2) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.6, y - s * 0.1, x - s * 0.35, y - s * 0.6, x, y - s * 0.25);
    ctx.bezierCurveTo(x + s * 0.35, y - s * 0.6, x + s * 0.6, y - s * 0.1, x, y + s * 0.35);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, x - s * 0.2, y - s * 0.2, 1, x, y, s * 0.6, [[0, c1], [1, c2]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = Math.max(1, s * 0.06);
    ctx.stroke();
    D.ellipsePath(ctx, x - s * 0.22, y - s * 0.2, s * 0.1, s * 0.06, -0.6);
    D.fs(ctx, 'rgba(255,255,255,0.7)');
  }

  function zap(ctx, x, y, s, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(3, -14);
    ctx.lineTo(-7, 2);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 15);
    ctx.lineTo(9, -3);
    ctx.lineTo(2, -3);
    ctx.closePath();
    D.fs(ctx, fill, OL, 1.8);
    ctx.restore();
  }

  // golden supercar, facing right
  function goldCar(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    D.shadow(ctx, 0, 14, 34, 5, 0.35);
    ctx.beginPath();
    ctx.moveTo(-36, 8);
    ctx.lineTo(-34, -2);
    ctx.quadraticCurveTo(-22, -6, -12, -6);
    ctx.quadraticCurveTo(-4, -17, 10, -16);
    ctx.quadraticCurveTo(22, -14, 28, -6);
    ctx.quadraticCurveTo(38, -4, 38, 4);
    ctx.lineTo(36, 9);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -17, 0, 10, [[0, '#fffbe0'], [0.4, '#ffd740'], [1, '#a77700']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // windows
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.quadraticCurveTo(-2, -14, 8, -14);
    ctx.lineTo(9, -6);
    ctx.closePath();
    D.fs(ctx, '#80deea', OL, 1);
    ctx.beginPath();
    ctx.moveTo(12, -6);
    ctx.lineTo(11, -13.5);
    ctx.quadraticCurveTo(20, -12, 24, -6);
    ctx.closePath();
    D.fs(ctx, '#80deea', OL, 1);
    // Dru driving (blond hair) + flag
    D.circlePath(ctx, 2, -10, 3.2);
    D.fs(ctx, '#f2d2b0', OL, 0.7);
    D.ellipsePath(ctx, 1.5, -13, 4, 1.8);
    D.fs(ctx, '#ffd54f', OL, 0.6);
    // spoiler, stripe, lights
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-33, -8);
    ctx.lineTo(-31, -3);
    ctx.stroke();
    D.rrPath(ctx, -38, -10, 9, 3, 1);
    D.fs(ctx, '#a77700', OL, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-30, 0, 62, 2);
    D.ellipsePath(ctx, 35, 1, 2.2, 1.6);
    D.fs(ctx, '#fffde7', OL, 0.7);
    // wheels
    [-21, 22].forEach((wx) => {
      D.circlePath(ctx, wx, 9, 7);
      D.fs(ctx, '#212121', OL, 1.2);
      D.circlePath(ctx, wx, 9, 3.4);
      ctx.fillStyle = D.rad(ctx, wx - 1, 8, 0.5, wx, 9, 3.4, [[0, '#fffde7'], [1, '#c79100']]);
      ctx.fill();
    });
    ctx.restore();
  }

  // giant rainbow unicorn, galloping to the right
  function unicorn(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    D.shadow(ctx, 0, 24, 30, 5, 0.3);
    const white = (x0, y0, x1, y1) => D.lin(ctx, x0, y0, x1, y1, [[0, '#ffffff'], [1, '#e1d5f5']]);
    // back legs
    [[-16, 0.3], [-6, -0.3], [12, 0.25], [20, -0.35]].forEach(([lx, a]) => {
      ctx.save();
      ctx.translate(lx, 8);
      ctx.rotate(a);
      D.rrPath(ctx, -2.6, 0, 5.2, 15, 2.4);
      ctx.fillStyle = white(0, 0, 0, 15);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      D.rrPath(ctx, -3, 13, 6, 3.6, 1.5);
      D.fs(ctx, '#ffd740', OL, 0.8);
      ctx.restore();
    });
    // rainbow tail
    ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#b388ff'].forEach((c, i) => {
      ctx.beginPath();
      ctx.moveTo(-24, -2 + i * 1.2);
      ctx.quadraticCurveTo(-40, -6 + i * 3, -36, 12 + i * 2.2);
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    // body
    D.ellipsePath(ctx, 0, 2, 26, 12);
    ctx.fillStyle = white(0, -10, 0, 14);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // neck + head
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.quadraticCurveTo(22, -20, 28, -24);
    ctx.quadraticCurveTo(40, -24, 42, -16);
    ctx.quadraticCurveTo(40, -12, 32, -13);
    ctx.quadraticCurveTo(28, -2, 22, 6);
    ctx.closePath();
    ctx.fillStyle = white(20, -24, 30, 6);
    ctx.fill();
    ctx.stroke();
    // mane
    ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#b388ff'].forEach((c, i) => {
      D.ellipsePath(ctx, 21 - i * 2.2, -20 + i * 4.2, 4.4, 2.6, -0.9);
      D.fs(ctx, c, OL, 0.7);
    });
    // horn
    ctx.beginPath();
    ctx.moveTo(30, -24);
    ctx.lineTo(37, -40);
    ctx.lineTo(34, -23);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 30, -24, 37, -40, [[0, '#ffb300'], [1, '#fffde7']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    // eye + nostril + blush
    D.circlePath(ctx, 34, -19, 1.6);
    D.fs(ctx, '#311b92');
    D.circlePath(ctx, 34.4, -19.6, 0.6);
    D.fs(ctx, '#fff');
    D.ellipsePath(ctx, 31, -15, 2, 1.2);
    D.fs(ctx, 'rgba(255,128,171,0.6)');
    ctx.restore();
  }

  // a shark with a rocket strapped to it, nose to the right
  function sharkRocket(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // flame
    ctx.beginPath();
    ctx.moveTo(-30, -4);
    ctx.quadraticCurveTo(-46, 0, -30, 4);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, -46, 0, -30, 0, [[0, 'rgba(255,90,0,0)'], [0.5, '#ffb02e'], [1, '#fff7c2']]);
    ctx.fill();
    // shark body
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(-12, -13, 14, -10);
    ctx.quadraticCurveTo(30, -7, 36, 0);
    ctx.quadraticCurveTo(28, 9, 10, 9);
    ctx.quadraticCurveTo(-12, 10, -26, 0);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -12, 0, 10, [[0, '#90a4ae'], [0.55, '#607d8b'], [1, '#eceff1']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // fins + tail
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(6, -22);
    ctx.lineTo(12, -10);
    ctx.closePath();
    D.fs(ctx, '#607d8b', OL, 1.1);
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(-34, -10);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-34, 10);
    ctx.closePath();
    D.fs(ctx, '#607d8b', OL, 1.1);
    // teeth
    ctx.beginPath();
    ctx.moveTo(20, 3);
    ctx.lineTo(34, 2);
    ctx.lineTo(26, 6);
    ctx.closePath();
    D.fs(ctx, '#ffffff', OL, 0.8);
    D.circlePath(ctx, 26, -3, 1.4);
    D.fs(ctx, '#111');
    // the rocket strapped under it
    D.rrPath(ctx, -26, 5, 34, 8, 4);
    ctx.fillStyle = D.lin(ctx, 0, 5, 0, 13, [[0, '#ff8a65'], [1, '#c62828']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.4;
    [-14, 0].forEach((bx) => {
      ctx.beginPath();
      ctx.moveTo(bx, -8);
      ctx.lineTo(bx, 12);
      ctx.stroke();
    });
    ctx.restore();
  }

  // a big brown cockroach (Roach Ray overlay)
  function roach(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    // legs
    for (const sd of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(sd * 6, i * 5);
        ctx.quadraticCurveTo(sd * 13, i * 5 - 3, sd * 15, i * 7 + 4);
        ctx.stroke();
      }
    }
    // body
    D.ellipsePath(ctx, 0, 2, 8.5, 12);
    ctx.fillStyle = D.rad(ctx, -3, -3, 1, 0, 2, 13, [[0, '#a1887f'], [0.6, '#6d4c41'], [1, '#3e2723']]);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 13);
    ctx.strokeStyle = 'rgba(30,15,5,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // head + antennae
    D.ellipsePath(ctx, 0, -11, 5, 3.6);
    D.fs(ctx, '#4e342e', OL, 1);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sd * 2, -13);
      ctx.quadraticCurveTo(sd * 8, -24, sd * 14, -22);
      ctx.stroke();
    }
    D.ellipsePath(ctx, -3, -2, 2.4, 5, 0.2);
    D.fs(ctx, 'rgba(255,255,255,0.35)');
    ctx.restore();
  }

  function generate(scene) {
    const mk = (key, w, h, fn) => D.make(scene, key, w, h, fn);
    const ic = (key, fn) => mk(key, 32, 32, fn);
    const ab = (key, c1, c2, fn) => mk(key, 56, 56, (ctx) => {
      iconBadge(ctx, 56, c1, c2);
      fn(ctx);
    });
    const pw = (key, c1, c2, fn) => mk(key, 56, 56, (ctx) => {
      powerBadge(ctx, 56, c1, c2);
      fn(ctx);
    });

    // ---------------------------------------------------------------- UI icons
    ic('ic_grucoin', (ctx) => goldCoin(ctx, 16, 16, 13.5, 'G'));
    ic('ic_flask', (ctx) => {
      ctx.beginPath();
      ctx.moveTo(12, 4);
      ctx.lineTo(12, 13);
      ctx.lineTo(4, 26);
      ctx.quadraticCurveTo(3, 29, 7, 29);
      ctx.lineTo(25, 29);
      ctx.quadraticCurveTo(29, 29, 28, 26);
      ctx.lineTo(20, 13);
      ctx.lineTo(20, 4);
      ctx.closePath();
      D.fs(ctx, 'rgba(225,245,254,0.9)', OL, 1.8);
      ctx.beginPath();
      ctx.moveTo(8.5, 20);
      ctx.lineTo(23.5, 20);
      ctx.lineTo(27, 26.5);
      ctx.quadraticCurveTo(27, 27.5, 25, 27.5);
      ctx.lineTo(7, 27.5);
      ctx.quadraticCurveTo(5, 27.5, 5, 26.5);
      ctx.closePath();
      D.fs(ctx, '#76ff03');
      D.rrPath(ctx, 10, 2, 12, 4, 1.5);
      D.fs(ctx, '#8d6e63', OL, 1.2);
      D.circlePath(ctx, 13, 23, 1.6);
      D.fs(ctx, '#e8ffd6');
      D.circlePath(ctx, 19, 24.5, 1.1);
      D.fs(ctx, '#e8ffd6');
    });
    ic('ic_power', (ctx) => {
      D.rrPath(ctx, 3, 3, 26, 26, 7);
      ctx.fillStyle = D.lin(ctx, 0, 3, 0, 29, [[0, '#fff176'], [1, '#ff8f00']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      zap(ctx, 16, 16, 0.75, '#ffffff');
    });
    ic('ic_continue', (ctx) => {
      // a save disk with a play arrow
      D.rrPath(ctx, 4, 4, 24, 24, 4);
      D.fs(ctx, '#3a7fe0', OL, 1.8);
      D.rrPath(ctx, 9, 4, 14, 8, 1.5);
      D.fs(ctx, '#e3f2fd', OL, 1.2);
      ctx.beginPath();
      ctx.moveTo(12, 15);
      ctx.lineTo(22, 20.5);
      ctx.lineTo(12, 26);
      ctx.closePath();
      D.fs(ctx, '#ffd83a', OL, 1.2);
    });

    // ---------------------------------------------------------------- mutant extras
    // regrow badge: a green heart with a curling sprout
    mk('fx_regrow', 26, 26, (ctx) => {
      heart(ctx, 13, 15, 20, '#ccff90', '#33a12a');
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(13, 9);
      ctx.quadraticCurveTo(13, 3, 18, 2);
      ctx.stroke();
      ctx.strokeStyle = '#76ff03';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      D.ellipsePath(ctx, 18.5, 3, 3.4, 1.8, -0.4);
      D.fs(ctx, '#64dd17', OL, 0.8);
      // a little circular arrow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(13, 15, 4.2, -0.4, Math.PI * 1.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(15.8, 11.4);
      ctx.lineTo(17.6, 14.8);
      ctx.lineTo(14.2, 14.6);
      ctx.closePath();
      D.fs(ctx, '#ffffff');
    });

    // ---------------------------------------------------------------- projectiles
    mk('p_goldcoin', 18, 18, (ctx) => goldCoin(ctx, 9, 9, 7.5, '$'));
    mk('p_rainbow', 22, 22, (ctx) => {
      const cols = ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#b388ff'];
      ctx.fillStyle = D.rad(ctx, 11, 11, 1, 11, 11, 11, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,156,230,0)']]);
      D.circlePath(ctx, 11, 11, 11);
      ctx.fill();
      D.starPath(ctx, 11, 11, 5, 9, 4.2);
      const g = ctx.createLinearGradient(3, 3, 19, 19);
      cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      D.circlePath(ctx, 9.5, 9, 1.6);
      D.fs(ctx, 'rgba(255,255,255,0.9)');
    });
    mk('fx_roachegg', 28, 18, (ctx) => {
      D.ellipsePath(ctx, 14, 9, 12, 6.5);
      ctx.fillStyle = D.lin(ctx, 0, 2, 0, 16, [[0, '#bcaaa4'], [0.5, '#795548'], [1, '#4e342e']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(40,20,10,0.6)';
      ctx.lineWidth = 0.8;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(14 + i * 4, 3);
        ctx.lineTo(14 + i * 4, 15);
        ctx.stroke();
      }
    });

    // ---------------------------------------------------------------- power traps on the map
    mk('fx_peelpile', 44, 32, (ctx) => {
      D.shadow(ctx, 22, 24, 18, 5, 0.3);
      peel(ctx, 14, 20, 0.9, -0.5);
      peel(ctx, 30, 21, 0.85, 0.6);
      peel(ctx, 22, 13, 1, 0.1);
    });
    mk('fx_sprinkler', 40, 40, (ctx) => {
      D.shadow(ctx, 20, 32, 12, 4, 0.3);
      // water arcs
      ctx.strokeStyle = 'rgba(129,212,250,0.85)';
      ctx.lineWidth = 1.6;
      [[-1, 0.9], [1, 0.9], [-1, 0.5], [1, 0.5]].forEach(([s, k]) => {
        ctx.beginPath();
        ctx.moveTo(20, 16);
        ctx.quadraticCurveTo(20 + s * 12 * k, 2, 20 + s * 17 * k, 18);
        ctx.stroke();
      });
      D.rrPath(ctx, 15, 18, 10, 14, 3);
      ctx.fillStyle = D.lin(ctx, 15, 0, 25, 0, [[0, '#b2ebf2'], [1, '#00838f']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      D.ellipsePath(ctx, 20, 17, 7, 3);
      D.fs(ctx, '#4dd0e1', OL, 1.1);
      D.circlePath(ctx, 20, 14, 2.4);
      D.fs(ctx, '#e0f7fa', OL, 0.8);
    });

    // ---------------------------------------------------------------- hero ability helpers
    mk('fx_goldcar', 84, 44, (ctx) => goldCar(ctx, 42, 26, 1));
    mk('fx_unicorn', 96, 84, (ctx) => unicorn(ctx, 46, 50, 1));
    mk('fx_chicken', 36, 32, (ctx) => MT.HeroArt.chicken(ctx, 16, 19, 1.2));
    mk('fx_sharkrocket', 84, 40, (ctx) => sharkRocket(ctx, 44, 18, 1));

    // ---------------------------------------------------------------- boss attack overlays
    mk('fx_feathers', 56, 48, (ctx) => {
      const rnd = D.rng(12);
      for (let i = 0; i < 7; i++) {
        const x = 8 + rnd() * 40, y = 10 + rnd() * 30;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rnd() * 6);
        D.ellipsePath(ctx, 0, 0, 7, 2.6);
        D.fs(ctx, '#ffffff', OL, 0.8);
        ctx.strokeStyle = 'rgba(120,100,80,0.6)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
        ctx.restore();
      }
      MT.HeroArt.chicken(ctx, 26, 22, 1.25);
    });
    mk('fx_roach', 56, 48, (ctx) => {
      ctx.fillStyle = D.rad(ctx, 28, 26, 4, 28, 26, 24, [[0, 'rgba(204,255,144,0.55)'], [1, 'rgba(156,204,101,0)']]);
      D.circlePath(ctx, 28, 26, 24);
      ctx.fill();
      roach(ctx, 28, 28, 1.35);
    });

    // ---------------------------------------------------------------- ability badges
    ab('ab_fortune', '#fff59d', '#c79100', (ctx) => {
      [[18, 38], [28, 40], [38, 37], [23, 30], [33, 31], [28, 22]].forEach(([x, y]) => goldCoin(ctx, x, y, 7, '$'));
    });
    ab('ab_car', '#fff8e1', '#ff8f00', (ctx) => goldCar(ctx, 28, 30, 0.6));
    ab('ab_fluffy', '#fce4ec', '#ec407a', (ctx) => MT.HeroArt.unicornPlush(ctx, 25, 32, 1.45, 1));
    ab('ab_unicorn', '#e1f5fe', '#7e57c2', (ctx) => unicorn(ctx, 26, 32, 0.52));
    ab('ab_pollito', '#ffebee', '#c62828', (ctx) => MT.HeroArt.chicken(ctx, 26, 31, 1.55));
    ab('ab_shark', '#b3e5fc', '#01579b', (ctx) => {
      ctx.save();
      ctx.translate(28, 28);
      ctx.rotate(-0.5);
      sharkRocket(ctx, 0, 0, 0.62);
      ctx.restore();
    });

    // ---------------------------------------------------------------- power badges
    pw('pw_peel', '#fff9c4', '#f9a825', (ctx) => {
      peel(ctx, 21, 34, 1.1, -0.4);
      peel(ctx, 35, 32, 1.05, 0.5);
    });
    pw('pw_camo', '#b2ebf2', '#00838f', (ctx) => {
      ctx.drawImage(scene.textures.get('fx_sprinkler').getSourceImage(), 8, 8, 40, 40);
    });
    pw('pw_freeze', '#e1f5fe', '#0277bd', (ctx) => {
      D.circlePath(ctx, 28, 30, 13);
      ctx.fillStyle = D.rad(ctx, 24, 26, 1, 28, 30, 13, [[0, '#ffffff'], [1, '#4fc3f7']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      D.rrPath(ctx, 24, 13, 8, 6, 2);
      D.fs(ctx, '#78909c', OL, 1.2);
      snowflake(ctx, 28, 30, 8, '#ffffff');
    });
    pw('pw_cash', '#dcedc8', '#2e7d32', (ctx) => {
      ctx.drawImage(scene.textures.get('fx_crate').getSourceImage(), 14, 8, 28, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Arial Black", Arial';
      ctx.textAlign = 'center';
      ctx.fillText('$', 42, 48);
    });
    pw('pw_boost', '#fff59d', '#ef6c00', (ctx) => {
      zap(ctx, 22, 28, 1.05, '#ffffff');
      zap(ctx, 36, 30, 0.8, '#fff176');
    });
    pw('pw_lives', '#fce4ec', '#c2185b', (ctx) => {
      heart(ctx, 28, 30, 28, '#ff8a8a', '#c62828');
      MT.TowerArt.props.banana(ctx, 34, 36, 0.9, -0.4, '#ffe14a');
    });
  }

  MT.FXArt.generate4 = generate;
  MT.ExtraArt = { goldCoin, roach, unicorn, goldCar, peel };
})();
