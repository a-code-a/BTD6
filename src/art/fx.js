// Projectiles, effects and UI icons.
(function () {
  const D = MT.Draw;
  const OL = D.OL;

  function glowDot(ctx, x, y, r, inner, outer) {
    ctx.fillStyle = D.rad(ctx, x, y, 0, x, y, r, [[0, '#ffffff'], [0.25, inner], [0.6, D.rgba(outer, 0.6)], [1, D.rgba(outer, 0)]]);
    D.circlePath(ctx, x, y, r);
    ctx.fill();
  }

  function bolt(ctx, w, h, core, glow) {
    const cy = h / 2;
    ctx.fillStyle = D.rad(ctx, w / 2, cy, 0, w / 2, cy, w / 2, [[0, D.rgba(glow, 0.7)], [1, D.rgba(glow, 0)]]);
    D.ellipsePath(ctx, w / 2, cy, w / 2, h / 2);
    ctx.fill();
    D.capsulePath(ctx, w / 2, cy, h * 0.45, w * 0.8);
    ctx.save();
    ctx.translate(w / 2, cy);
    ctx.rotate(Math.PI / 2);
    D.capsulePath(ctx, 0, 0, h * 0.42, w * 0.8);
    ctx.fillStyle = core;
    ctx.fill();
    D.capsulePath(ctx, 0, 0, h * 0.18, w * 0.65);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

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

  function bananaCoin(ctx, x, y, r) {
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.4, y - r * 0.4, 1, x, y, r, [[0, '#fff6b0'], [0.5, '#ffcf2e'], [1, '#c78a00']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.circlePath(ctx, x, y, r * 0.75);
    ctx.strokeStyle = 'rgba(150,95,0,0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    MT.TowerArt.props.banana(ctx, x + 0.5, y + 1.5, r * 0.06, -0.3, '#ffe14a');
  }

  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.6, y - s * 0.1, x - s * 0.35, y - s * 0.6, x, y - s * 0.25);
    ctx.bezierCurveTo(x + s * 0.35, y - s * 0.6, x + s * 0.6, y - s * 0.1, x, y + s * 0.35);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, x - s * 0.2, y - s * 0.2, 1, x, y, s * 0.6, [[0, '#ff8a8a'], [1, '#c62828']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    D.ellipsePath(ctx, x - s * 0.22, y - s * 0.22, s * 0.1, s * 0.06, -0.6);
    D.fs(ctx, 'rgba(255,255,255,0.7)');
  }

  function snowflake(ctx, x, y, r, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1, r * 0.18);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      const mx = x + Math.cos(a) * r * 0.6, my = y + Math.sin(a) * r * 0.6;
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(a + 0.8) * r * 0.3, my + Math.sin(a + 0.8) * r * 0.3);
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(a - 0.8) * r * 0.3, my + Math.sin(a - 0.8) * r * 0.3);
      ctx.stroke();
    }
  }

  function generate(scene) {
    const mk = (key, w, h, fn) => D.make(scene, key, w, h, fn);
    const props = MT.TowerArt.props;

    // ---------------- projectiles (all point to the right) ----------------
    mk('p_banana', 26, 16, (ctx) => props.banana(ctx, 13, 9, 1.0, 0));
    mk('p_boulder', 32, 32, (ctx) => props.bananaBall(ctx, 16, 16, 13, false));
    mk('p_jugg', 44, 44, (ctx) => props.bananaBall(ctx, 22, 22, 14, true));
    mk('p_bolt', 30, 10, (ctx) => {
      ctx.fillStyle = '#7b4f24';
      ctx.fillRect(4, 4, 18, 2.4);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(4, 4, 18, 2.4);
      props.banana(ctx, 23, 5.5, 0.45, 0.25, '#ffe14a');
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.moveTo(2, 1);
      ctx.lineTo(8, 5);
      ctx.lineTo(2, 9);
      ctx.closePath();
      ctx.fill();
    });
    mk('p_gas', 26, 26, (ctx) => {
      const rnd = D.rng(5);
      for (let i = 0; i < 5; i++) {
        D.blobPath(ctx, 9 + rnd() * 8, 9 + rnd() * 8, 5 + rnd() * 3, 7, 0.2, rnd);
        ctx.fillStyle = i % 2 ? 'rgba(170,220,90,0.85)' : 'rgba(120,190,60,0.85)';
        ctx.fill();
      }
      D.blobPath(ctx, 13, 13, 10, 9, 0.15, rnd);
      ctx.strokeStyle = 'rgba(60,100,20,0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      D.circlePath(ctx, 10, 10, 2.5);
      D.fs(ctx, 'rgba(255,255,255,0.5)');
    });
    mk('p_fire', 26, 26, (ctx) => {
      glowDot(ctx, 13, 13, 12, '#ffd54f', '#ff5722');
      ctx.beginPath();
      ctx.moveTo(13, 4);
      ctx.quadraticCurveTo(20, 12, 15, 21);
      ctx.quadraticCurveTo(13, 23, 10, 21);
      ctx.quadraticCurveTo(6, 13, 13, 4);
      D.fs(ctx, 'rgba(255,240,180,0.9)');
    });
    mk('p_rocket', 30, 14, (ctx) => {
      // fins
      ctx.beginPath();
      ctx.moveTo(4, 7);
      ctx.lineTo(1, 1);
      ctx.lineTo(9, 5);
      ctx.moveTo(4, 7);
      ctx.lineTo(1, 13);
      ctx.lineTo(9, 9);
      D.fs(ctx, '#c62828', OL, 1);
      D.rrPath(ctx, 4, 3.5, 18, 7, 3);
      ctx.fillStyle = D.lin(ctx, 0, 3.5, 0, 10.5, [[0, '#f5f5f5'], [1, '#90a4ae']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(21, 3.5);
      ctx.quadraticCurveTo(29, 7, 21, 10.5);
      ctx.closePath();
      D.fs(ctx, '#e53935', OL, 1);
    });
    mk('p_minibomb', 14, 14, (ctx) => {
      D.circlePath(ctx, 7, 8, 4.5);
      ctx.fillStyle = D.rad(ctx, 5.5, 6.5, 0.5, 7, 8, 5, [[0, '#888'], [1, '#111']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.strokeStyle = '#ffb300';
      ctx.beginPath();
      ctx.moveTo(9, 4.5);
      ctx.lineTo(11, 2);
      ctx.stroke();
    });
    mk('p_jelly', 18, 18, (ctx) => {
      D.blobPath(ctx, 9, 9, 6.5, 8, 0.12, D.rng(3));
      ctx.fillStyle = D.rad(ctx, 7, 7, 1, 9, 9, 7, [[0, '#ffd0dc'], [0.4, '#ff4f7b'], [1, '#b0123e']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      D.circlePath(ctx, 7, 6.5, 1.6);
      D.fs(ctx, 'rgba(255,255,255,0.85)');
    });
    mk('p_jelly_acid', 18, 18, (ctx) => {
      D.blobPath(ctx, 9, 9, 6.5, 8, 0.12, D.rng(3));
      ctx.fillStyle = D.rad(ctx, 7, 7, 1, 9, 9, 7, [[0, '#f4ffd0'], [0.4, '#9be15d'], [1, '#3b8a12']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      D.circlePath(ctx, 7, 6.5, 1.6);
      D.fs(ctx, 'rgba(255,255,255,0.85)');
    });
    mk('p_ice', 20, 20, (ctx) => {
      glowDot(ctx, 10, 10, 10, '#b3ecff', '#29b6f6');
      D.starPath(ctx, 10, 10, 6, 6.5, 3);
      D.fs(ctx, '#e1f5fe', '#0288d1', 1);
    });
    mk('p_dart', 22, 8, (ctx) => bolt(ctx, 22, 8, '#ffd83a', '#ffb300'));
    mk('p_laser', 26, 8, (ctx) => bolt(ctx, 26, 8, '#ff1744', '#ff5252'));
    mk('p_plasma', 24, 14, (ctx) => bolt(ctx, 24, 14, '#18ffff', '#00b8d4'));
    mk('p_sun', 30, 30, (ctx) => {
      glowDot(ctx, 15, 15, 15, '#fff59d', '#ffab00');
      D.starPath(ctx, 15, 15, 10, 9, 6);
      D.fs(ctx, 'rgba(255,248,200,0.9)');
    });
    mk('p_freezebolt', 24, 14, (ctx) => {
      bolt(ctx, 24, 14, '#40c4ff', '#80d8ff');
      snowflake(ctx, 17, 7, 3.4, '#ffffff');
    });
    mk('p_shrapnel', 8, 8, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(1, 4);
      ctx.lineTo(6, 1);
      ctx.lineTo(7, 6);
      ctx.closePath();
      D.fs(ctx, '#b0bec5', OL, 0.7);
    });
    mk('p_missile', 48, 20, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(6, 10);
      ctx.lineTo(1, 1);
      ctx.lineTo(14, 7);
      ctx.moveTo(6, 10);
      ctx.lineTo(1, 19);
      ctx.lineTo(14, 13);
      D.fs(ctx, '#ffd83a', OL, 1.2);
      D.rrPath(ctx, 6, 5, 32, 10, 4);
      ctx.fillStyle = D.lin(ctx, 0, 5, 0, 15, [[0, '#ffffff'], [1, '#78909c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = '#1b1b1b';
      ctx.fillRect(18, 5, 4, 10);
      ctx.beginPath();
      ctx.moveTo(37, 5);
      ctx.quadraticCurveTo(48, 10, 37, 15);
      ctx.closePath();
      D.fs(ctx, '#e53935', OL, 1.2);
    });

    // ---------------- effects ----------------
    mk('fx_pop', 44, 44, (ctx) => {
      D.starPath(ctx, 22, 22, 9, 20, 10, 0.2);
      D.fs(ctx, '#ffffff', '#6a1b9a', 2.4);
      D.starPath(ctx, 22, 22, 9, 12, 6, 0.4);
      D.fs(ctx, '#f3e5f5');
    });
    mk('fx_puff', 32, 32, (ctx) => {
      ctx.fillStyle = D.rad(ctx, 16, 16, 0, 16, 16, 16, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]);
      D.circlePath(ctx, 16, 16, 16);
      ctx.fill();
    });
    mk('fx_spark', 14, 14, (ctx) => {
      D.starPath(ctx, 7, 7, 4, 6.5, 2);
      D.fs(ctx, '#ffffff');
    });
    mk('fx_boom', 100, 100, (ctx) => {
      D.starPath(ctx, 50, 50, 12, 48, 30, 0.1);
      D.fs(ctx, '#ff6d00', OL, 2.5);
      D.starPath(ctx, 50, 50, 10, 36, 22, 0.4);
      D.fs(ctx, '#ffab00');
      D.starPath(ctx, 50, 50, 8, 22, 14, 0.1);
      D.fs(ctx, '#fff176');
      D.circlePath(ctx, 50, 50, 9);
      D.fs(ctx, '#ffffff');
    });
    mk('fx_ring', 128, 128, (ctx) => {
      D.circlePath(ctx, 64, 64, 58);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.stroke();
      D.circlePath(ctx, 64, 64, 58);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 14;
      ctx.stroke();
    });
    mk('fx_disc', 128, 128, (ctx) => {
      ctx.fillStyle = D.rad(ctx, 64, 64, 0, 64, 64, 64, [[0, 'rgba(255,255,255,0.15)'], [0.75, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
      D.circlePath(ctx, 64, 64, 64);
      ctx.fill();
    });
    mk('fx_snow', 18, 18, (ctx) => snowflake(ctx, 9, 9, 7.5, '#ffffff'));
    mk('fx_ice', 44, 50, (ctx) => {
      D.rrPath(ctx, 3, 3, 38, 44, 8);
      ctx.fillStyle = D.lin(ctx, 0, 0, 44, 50, [[0, 'rgba(225,245,255,0.75)'], [1, 'rgba(100,190,240,0.6)']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(9, 12);
      ctx.lineTo(18, 7);
      ctx.moveTo(9, 20);
      ctx.lineTo(24, 10);
      ctx.stroke();
    });
    const jellyOverlay = (key, c1, c2) => mk(key, 44, 24, (ctx) => {
      const rnd = D.rng(11);
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.quadraticCurveTo(22, -2, 40, 6);
      ctx.lineTo(40, 10);
      for (let x = 40; x > 4; x -= 6) {
        const dl = 4 + rnd() * 10;
        ctx.quadraticCurveTo(x - 1, 10 + dl, x - 3, 10 + dl);
        ctx.quadraticCurveTo(x - 5, 10 + dl, x - 6, 10);
      }
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 0, 0, 24, [[0, D.rgba(c1, 0.92)], [1, D.rgba(c2, 0.85)]]);
      ctx.fill();
      ctx.strokeStyle = D.rgba(c2, 1);
      ctx.lineWidth = 1;
      ctx.stroke();
      D.ellipsePath(ctx, 14, 6, 6, 1.8);
      D.fs(ctx, 'rgba(255,255,255,0.6)');
    });
    jellyOverlay('fx_jelly', '#ff7b9c', '#c2185b');
    jellyOverlay('fx_jelly_acid', '#c6ff7a', '#4caf50');
    mk('fx_banana', 34, 30, (ctx) => {
      glowDot(ctx, 17, 15, 15, '#fff59d', '#ffeb3b');
      props.banana(ctx, 12, 13, 0.75, -0.5, '#ffe14a');
      props.banana(ctx, 18, 15, 0.75, -0.1, '#ffe14a');
      props.banana(ctx, 23, 18, 0.75, 0.3, '#ffe14a');
    });
    mk('fx_banana_gold', 34, 30, (ctx) => {
      glowDot(ctx, 17, 15, 15, '#ffe082', '#ffa000');
      props.banana(ctx, 12, 13, 0.75, -0.5, '#ffc400');
      props.banana(ctx, 18, 15, 0.75, -0.1, '#ffc400');
      props.banana(ctx, 23, 18, 0.75, 0.3, '#ffc400');
    });
    mk('fx_crate', 52, 64, (ctx) => {
      ctx.beginPath();
      ctx.arc(26, 22, 22, Math.PI, 0);
      ctx.quadraticCurveTo(26, 14, 4, 22);
      D.fs(ctx, '#e53935', OL, 1.4);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(6, 22);
      ctx.lineTo(18, 44);
      ctx.moveTo(46, 22);
      ctx.lineTo(34, 44);
      ctx.moveTo(26, 18);
      ctx.lineTo(26, 44);
      ctx.stroke();
      D.rrPath(ctx, 14, 42, 24, 20, 2);
      D.fs(ctx, '#a1887f', OL, 1.4);
      ctx.fillStyle = '#2e7d32';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 26, 52.5);
    });
    mk('fx_moon', 90, 90, (ctx) => {
      glowDot(ctx, 45, 45, 45, '#ffffff', '#b3e5fc');
      D.circlePath(ctx, 45, 45, 32);
      ctx.fillStyle = D.rad(ctx, 36, 36, 2, 45, 45, 32, [[0, '#ffffff'], [1, '#9e9e9e']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.stroke();
      [[35, 35, 7], [55, 50, 9], [42, 60, 5], [58, 32, 4]].forEach(([x, y, r]) => {
        D.circlePath(ctx, x, y, r);
        D.fs(ctx, 'rgba(90,90,90,0.4)');
      });
    });
    mk('fx_shadow', 64, 24, (ctx) => D.shadow(ctx, 32, 12, 30, 10, 0.5));

    // ---------------- UI icons ----------------
    mk('ic_heart', 32, 32, (ctx) => heart(ctx, 16, 17, 26));
    mk('ic_coin', 32, 32, (ctx) => bananaCoin(ctx, 16, 16, 13));
    mk('ic_play', 32, 32, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(10, 6);
      ctx.lineTo(26, 16);
      ctx.lineTo(10, 26);
      ctx.closePath();
      D.fs(ctx, '#ffffff', OL, 2.4);
    });
    mk('ic_ff', 32, 32, (ctx) => {
      [3, 15].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 7);
        ctx.lineTo(x + 13, 16);
        ctx.lineTo(x, 25);
        ctx.closePath();
        D.fs(ctx, '#ffffff', OL, 2.2);
      });
    });
    mk('ic_pause', 32, 32, (ctx) => {
      D.rrPath(ctx, 8, 6, 6, 20, 2);
      D.fs(ctx, '#fff', OL, 2);
      D.rrPath(ctx, 18, 6, 6, 20, 2);
      D.fs(ctx, '#fff', OL, 2);
    });
    mk('ic_gear', 32, 32, (ctx) => {
      D.starPath(ctx, 16, 16, 8, 13, 10, 0);
      D.fs(ctx, '#ffffff', OL, 2);
      D.circlePath(ctx, 16, 16, 4.5);
      D.fs(ctx, '#7f8c99', OL, 1.6);
    });
    mk('ic_close', 32, 32, (ctx) => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = OL;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(9, 9);
      ctx.lineTo(23, 23);
      ctx.moveTo(23, 9);
      ctx.lineTo(9, 23);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.stroke();
    });
    mk('ic_camo', 32, 32, (ctx) => {
      D.ellipsePath(ctx, 16, 16, 13, 8);
      D.fs(ctx, '#ffffff', OL, 1.8);
      D.circlePath(ctx, 16, 16, 6);
      D.fs(ctx, '#4b5d2c', OL, 1.2);
      D.circlePath(ctx, 16, 16, 2.6);
      D.fs(ctx, '#111');
    });
    mk('ic_lock', 32, 32, (ctx) => {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(16, 13, 6, Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = '#b0bec5';
      ctx.lineWidth = 3;
      ctx.stroke();
      D.rrPath(ctx, 7, 13, 18, 14, 3);
      D.fs(ctx, '#ffca28', OL, 1.8);
    });
    mk('ic_sound', 32, 32, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(5, 12);
      ctx.lineTo(11, 12);
      ctx.lineTo(18, 6);
      ctx.lineTo(18, 26);
      ctx.lineTo(11, 20);
      ctx.lineTo(5, 20);
      ctx.closePath();
      D.fs(ctx, '#fff', OL, 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(18, 16, 6, -0.8, 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(18, 16, 10, -0.8, 0.8);
      ctx.stroke();
    });
    mk('ic_music', 32, 32, (ctx) => {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(12, 23);
      ctx.lineTo(12, 7);
      ctx.lineTo(25, 4);
      ctx.lineTo(25, 20);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      D.ellipsePath(ctx, 9, 24, 4.5, 3.5, -0.3);
      D.fs(ctx, '#fff', OL, 1.8);
      D.ellipsePath(ctx, 22, 21, 4.5, 3.5, -0.3);
      D.fs(ctx, '#fff', OL, 1.8);
    });
    mk('ic_home', 32, 32, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(4, 16);
      ctx.lineTo(16, 5);
      ctx.lineTo(28, 16);
      ctx.lineTo(24, 16);
      ctx.lineTo(24, 27);
      ctx.lineTo(8, 27);
      ctx.lineTo(8, 16);
      ctx.closePath();
      D.fs(ctx, '#fff', OL, 2.2);
      D.rrPath(ctx, 13, 18, 6, 9, 1);
      D.fs(ctx, '#7f8c99');
    });
    mk('ic_restart', 32, 32, (ctx) => {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(16, 17, 9, -2.4, 2.2);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.lineTo(13, 6);
      ctx.lineTo(7, 14);
      ctx.closePath();
      D.fs(ctx, '#fff', OL, 1.6);
    });
    mk('ic_target', 32, 32, (ctx) => {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      D.circlePath(ctx, 16, 16, 10);
      ctx.stroke();
      D.circlePath(ctx, 16, 16, 4);
      ctx.fillStyle = '#ff5252';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(16, 9);
      ctx.moveTo(16, 23);
      ctx.lineTo(16, 30);
      ctx.moveTo(2, 16);
      ctx.lineTo(9, 16);
      ctx.moveTo(23, 16);
      ctx.lineTo(30, 16);
      ctx.stroke();
    });
    ['#cd7f32', '#c0c0c0', '#ffd700', '#7c4dff'].forEach((c, i) => {
      mk('ic_medal' + i, 32, 36, (ctx) => {
        ctx.fillStyle = '#1e88e5';
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(16, 14);
        ctx.lineTo(23, 0);
        ctx.closePath();
        ctx.fill();
        D.circlePath(ctx, 16, 22, 11);
        ctx.fillStyle = D.rad(ctx, 12, 18, 1, 16, 22, 11, [[0, '#ffffff'], [0.4, c], [1, D.shade(c, -0.45)]]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        D.starPath(ctx, 16, 22, 5, 6, 2.6);
        D.fs(ctx, D.shade(c, 0.4));
      });
    });
    mk('ic_medal_empty', 32, 36, (ctx) => {
      D.circlePath(ctx, 16, 22, 11);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // ---------------- ability badges ----------------
    const ab = (key, c1, c2, fn) => mk(key, 56, 56, (ctx) => {
      iconBadge(ctx, 56, c1, c2);
      fn(ctx);
    });
    ab('ab_banana', '#fff176', '#f9a825', (ctx) => {
      props.banana(ctx, 24, 26, 1.1, -0.6);
      props.banana(ctx, 32, 32, 1.1, -0.2);
    });
    ab('ab_missile', '#ff8a65', '#bf360c', (ctx) => {
      ctx.save();
      ctx.translate(28, 28);
      ctx.rotate(-0.7);
      ctx.drawImage(scene.textures.get('p_missile').getSourceImage(), -22, -9, 44, 18);
      ctx.restore();
    });
    ab('ab_snow', '#e1f5fe', '#0288d1', (ctx) => snowflake(ctx, 28, 28, 15, '#ffffff'));
    ab('ab_jelly', '#ff8fb1', '#ad1457', (ctx) => {
      ctx.drawImage(scene.textures.get('p_jelly').getSourceImage(), 12, 12, 32, 32);
    });
    ab('ab_crate', '#a5d6a7', '#2e7d32', (ctx) => {
      ctx.drawImage(scene.textures.get('fx_crate').getSourceImage(), 15, 8, 26, 32 * 1.25);
    });
    ab('ab_bolt', '#fff59d', '#ff6f00', (ctx) => {
      ctx.beginPath();
      ctx.moveTo(31, 8);
      ctx.lineTo(18, 31);
      ctx.lineTo(27, 31);
      ctx.lineTo(23, 48);
      ctx.lineTo(39, 23);
      ctx.lineTo(30, 23);
      ctx.closePath();
      D.fs(ctx, '#ffffff', OL, 2);
    });
    ab('ab_dark', '#b388ff', '#1a0033', (ctx) => {
      D.circlePath(ctx, 28, 28, 13);
      ctx.fillStyle = D.rad(ctx, 28, 28, 2, 28, 28, 14, [[0, '#000000'], [0.7, '#311b92'], [1, '#b388ff']]);
      ctx.fill();
    });
    ab('ab_shrink', '#b3e5fc', '#01579b', (ctx) => {
      ctx.save();
      ctx.translate(28, 28);
      ctx.rotate(-0.5);
      D.rrPath(ctx, -15, -6, 22, 12, 4);
      D.fs(ctx, '#eceff1', OL, 1.8);
      ctx.beginPath();
      ctx.moveTo(7, -4);
      ctx.lineTo(17, -10);
      ctx.lineTo(17, 10);
      ctx.lineTo(7, 4);
      ctx.closePath();
      D.fs(ctx, '#ff5252', OL, 1.8);
      ctx.restore();
    });
    ab('ab_moon', '#cfd8dc', '#263238', (ctx) => {
      ctx.drawImage(scene.textures.get('fx_moon').getSourceImage(), 6, 6, 44, 44);
    });
  }

  MT.FXArt = { generate, bananaCoin, heart, snowflake };
})();
