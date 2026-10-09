// Extra projectiles, effect sprites and ability badges for the new towers,
// heroes, super fusions and endgame monsters.
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;

  function glowDot(ctx, x, y, r, inner, outer) {
    ctx.fillStyle = D.rad(ctx, x, y, 0, x, y, r, [[0, '#ffffff'], [0.25, inner], [0.6, D.rgba(outer, 0.6)], [1, D.rgba(outer, 0)]]);
    D.circlePath(ctx, x, y, r);
    ctx.fill();
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

  function zigzag(ctx, x, y, s, fill) {
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

  function note(ctx, x, y, s, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    D.ellipsePath(ctx, -4, 6, 5, 3.8, -0.4);
    D.fs(ctx, fill, OL, 1.4);
    D.ellipsePath(ctx, 8, 3, 5, 3.8, -0.4);
    D.fs(ctx, fill, OL, 1.4);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(0.5, 5);
    ctx.lineTo(0.5, -12);
    ctx.lineTo(12.5, -15);
    ctx.lineTo(12.5, 2);
    ctx.stroke();
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function plane(ctx, x, y, s, body, prop) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // simple side-view plane pointing right, centred on (0,0)
    ctx.beginPath();
    ctx.moveTo(-26, -2);
    ctx.lineTo(-30, -14);
    ctx.lineTo(-20, -12);
    ctx.lineTo(-14, -2);
    ctx.closePath();
    D.fs(ctx, D.shade(body, -0.2), OL, 1.3);
    D.rrPath(ctx, -30, -6, 52, 13, 6.5);
    ctx.fillStyle = D.lin(ctx, 0, -6, 0, 7, [[0, D.shade(body, 0.4)], [0.5, body], [1, D.shade(body, -0.35)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.ellipsePath(ctx, -2, 4, 17, 4);
    D.fs(ctx, D.shade(body, -0.3), OL, 1.2);
    ctx.beginPath();
    ctx.arc(2, -5, 6, Math.PI, 0);
    ctx.closePath();
    D.fs(ctx, 'rgba(128,216,255,0.85)', OL, 1.1);
    if (prop) {
      D.ellipsePath(ctx, 24, 0.5, 2, 14);
      D.fs(ctx, 'rgba(230,230,230,0.7)', 'rgba(42,29,20,0.6)', 0.9);
    } else {
      ctx.beginPath();
      ctx.moveTo(22, -6);
      ctx.quadraticCurveTo(33, 0.5, 22, 7);
      ctx.closePath();
      D.fs(ctx, D.shade(body, 0.2), OL, 1.2);
      glowDot(ctx, -32, 0, 9, '#ffd54f', '#ff6d00');
    }
    ctx.restore();
  }

  function generate(scene) {
    const mk = (key, w, h, fn) => D.make(scene, key, w, h, fn);
    const props = MT.TowerArt.props;
    const img = (key) => scene.textures.get(key).getSourceImage();

    // ---------------------------------------------------------------- projectiles
    mk('p_wave', 22, 30, (ctx) => {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(2 + i * 5, 15, 11 - i * 1.5, -1.05, 1.05);
        ctx.strokeStyle = ['rgba(64,196,255,0.95)', 'rgba(255,64,129,0.9)', 'rgba(255,255,255,0.95)'][i];
        ctx.lineWidth = 3.2 - i * 0.6;
        ctx.stroke();
      }
    });
    mk('p_lipstick', 22, 10, (ctx) => {
      ctx.fillStyle = D.rad(ctx, 11, 5, 0, 11, 5, 11, [[0, 'rgba(255,128,171,0.8)'], [1, 'rgba(255,64,129,0)']]);
      D.ellipsePath(ctx, 11, 5, 11, 5);
      ctx.fill();
      D.capsulePath(ctx, 11, 5, 16, 4.4);
      ctx.save();
      ctx.translate(11, 5);
      ctx.rotate(Math.PI / 2);
      D.capsulePath(ctx, 0, 0, 4.4, 17);
      ctx.fillStyle = '#ff4081';
      ctx.fill();
      D.capsulePath(ctx, 0, 0, 1.8, 13);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    });
    mk('p_goo', 20, 20, (ctx) => {
      D.blobPath(ctx, 10, 10, 7.5, 8, 0.15, D.rng(8));
      ctx.fillStyle = D.rad(ctx, 8, 8, 1, 10, 10, 8, [[0, '#f1ffd6'], [0.4, '#9be15d'], [1, '#3b8a12']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      D.circlePath(ctx, 12, 12, 1.6);
      D.fs(ctx, 'rgba(255,255,255,0.6)');
      D.circlePath(ctx, 7.5, 7, 1.8);
      D.fs(ctx, 'rgba(255,255,255,0.85)');
    });
    mk('p_squid', 26, 18, (ctx) => {
      // tentacles trailing left
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2.6;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(12, 9 + i * 2.5);
        ctx.quadraticCurveTo(6, 9 + i * 5, 2, 9 + i * 4 + 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#f06292';
      ctx.lineWidth = 1.4;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(12, 9 + i * 2.5);
        ctx.quadraticCurveTo(6, 9 + i * 5, 2, 9 + i * 4 + 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(10, 4);
      ctx.quadraticCurveTo(26, 9, 10, 14);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 10, 4, 10, 14, [[0, '#f8bbd0'], [1, '#c2185b']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      D.circlePath(ctx, 15, 8, 1.6);
      D.fs(ctx, '#ffffff', OL, 0.5);
      D.circlePath(ctx, 15.4, 8, 0.7);
      D.fs(ctx, '#111');
    });

    mk('p_torpedo', 30, 12, (ctx) => {
      // bubbles trailing behind
      for (let i = 0; i < 3; i++) {
        D.circlePath(ctx, 2 + i * 3, 6 + (i % 2 ? 2 : -2), 1.4 + i * 0.3);
        D.fs(ctx, 'rgba(255,255,255,0.8)');
      }
      D.rrPath(ctx, 8, 3, 18, 6, 3);
      ctx.fillStyle = D.lin(ctx, 0, 3, 0, 9, [[0, '#eceff1'], [1, '#607d8b']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(25, 3);
      ctx.quadraticCurveTo(31, 6, 25, 9);
      ctx.closePath();
      D.fs(ctx, '#ffd83a', OL, 0.9);
      ctx.beginPath();
      ctx.moveTo(9, 6);
      ctx.lineTo(6, 2);
      ctx.lineTo(6, 10);
      ctx.closePath();
      D.fs(ctx, '#455a64', OL, 0.8);
    });
    const nailPile = (key, w, h, col, big) => mk(key, w, h, (ctx) => {
      D.shadow(ctx, w / 2, h - 5, w * 0.42, 3.5, 0.35);
      const rnd = D.rng(big ? 9 : 4);
      const n = big ? 7 : 6;
      for (let i = 0; i < n; i++) {
        const x = w * 0.2 + rnd() * w * 0.6, y = h * 0.45 + rnd() * h * 0.35;
        const rot = (rnd() - 0.5) * 2.2;
        const len = big ? 10 + rnd() * 5 : 7 + rnd() * 3;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        if (big) {
          ctx.beginPath();
          ctx.moveTo(-2.6, 2);
          ctx.lineTo(0, -len);
          ctx.lineTo(2.6, 2);
          ctx.closePath();
          ctx.fillStyle = D.lin(ctx, -2.6, 0, 2.6, 0, [[0, '#eceff1'], [1, '#37474f']]);
          ctx.fill();
          ctx.strokeStyle = OL;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        } else {
          ctx.strokeStyle = OL;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(0, -len);
          ctx.stroke();
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          D.ellipsePath(ctx, 0, 2, 2.3, 1);
          D.fs(ctx, col, OL, 0.6);
        }
        ctx.restore();
      }
    });
    nailPile('fx_nails', 26, 22, '#cfd8dc', false);
    nailPile('fx_nails_big', 32, 28, '#78909c', true);
    mk('fx_peel', 26, 18, (ctx) => {
      D.shadow(ctx, 13, 14, 11, 3, 0.3);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(13, 10);
        ctx.quadraticCurveTo(13 + i * 7, 4, 13 + i * 10, 12);
        ctx.strokeStyle = OL;
        ctx.lineWidth = 4.4;
        ctx.stroke();
        ctx.strokeStyle = '#ffd83a';
        ctx.lineWidth = 2.6;
        ctx.stroke();
      }
      D.circlePath(ctx, 13, 10, 2.6);
      D.fs(ctx, '#fff59d', OL, 0.8);
    });
    mk('fx_tentacle', 40, 72, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(8, 72);
      ctx.bezierCurveTo(2, 44, 30, 36, 24, 14);
      ctx.bezierCurveTo(22, 6, 12, 6, 14, 14);
      ctx.bezierCurveTo(16, 18, 20, 16, 19, 13);
      ctx.bezierCurveTo(26, 30, 14, 46, 30, 72);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 0, 40, 0, [[0, '#b39ddb'], [0.5, '#7e57c2'], [1, '#4527a0']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        D.ellipsePath(ctx, 14 + (i % 2) * 3, 62 - i * 8, 2.4, 1.8);
        D.fs(ctx, '#ede7f6', 'rgba(42,29,20,0.5)', 0.6);
      }
    });

    // ---------------------------------------------------------------- effects
    mk('fx_chunk', 14, 12, (ctx) => {
      D.blobPath(ctx, 7, 6, 4.6, 6, 0.4, D.rng(2));
      D.fs(ctx, '#ffffff', 'rgba(42,29,20,0.8)', 1);
    });
    mk('fx_note', 22, 24, (ctx) => note(ctx, 8, 13, 0.75, '#ffffff'));
    mk('fx_vignette', 256, 144, (ctx) => {
      ctx.save();
      ctx.translate(128, 72);
      ctx.scale(1, 144 / 256);
      ctx.fillStyle = D.rad(ctx, 0, 0, 70, 0, 0, 185, [[0, 'rgba(255,255,255,0)'], [0.55, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,1)']]);
      ctx.fillRect(-140, -260, 280, 520);
      ctx.restore();
    });
    mk('fx_shock', 128, 128, (ctx) => {
      ctx.fillStyle = D.rad(ctx, 64, 64, 40, 64, 64, 63, [[0, 'rgba(255,255,255,0)'], [0.7, 'rgba(255,255,255,0.55)'], [0.88, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
      D.circlePath(ctx, 64, 64, 63);
      ctx.fill();
    });
    mk('fx_swirl', 128, 128, (ctx) => {
      ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.translate(64, 64);
        ctx.rotate((k / 4) * Math.PI * 2);
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const t = i / 30;
          const a = t * 2.6, r = 10 + t * 50;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.restore();
      }
    });
    mk('fx_aura', 128, 128, (ctx) => {
      ctx.save();
      ctx.translate(64, 64);
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(-4, -18);
        ctx.lineTo(0, -62);
        ctx.lineTo(4, -18);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = D.rad(ctx, 64, 64, 0, 64, 64, 60, [[0, 'rgba(255,255,255,0.0)'], [0.45, 'rgba(255,255,255,0.45)'], [0.7, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
      D.circlePath(ctx, 64, 64, 60);
      ctx.fill();
    });
    mk('fx_halo', 120, 120, (ctx) => {
      D.circlePath(ctx, 60, 60, 52);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        D.starPath(ctx, 60 + Math.cos(a) * 52, 60 + Math.sin(a) * 52, 4, 5, 1.6, a);
        D.fs(ctx, '#ffffff');
      }
    });
    // ascension star orbiting a hero
    mk('fx_star', 32, 32, (ctx) => {
      ctx.fillStyle = D.rad(ctx, 16, 16, 0, 16, 16, 16, [[0, 'rgba(255,255,255,0.9)'], [0.4, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
      D.circlePath(ctx, 16, 16, 16);
      ctx.fill();
      D.starPath(ctx, 16, 16, 5, 9, 3.8);
      D.fs(ctx, '#ffffff');
    });
    mk('fx_pillar', 48, 320, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 320);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.3, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0.95)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(38, 0);
      ctx.lineTo(44, 320);
      ctx.lineTo(4, 320);
      ctx.closePath();
      ctx.fill();
      const g2 = ctx.createLinearGradient(0, 0, 48, 0);
      g2.addColorStop(0, 'rgba(255,255,255,0)');
      g2.addColorStop(0.5, 'rgba(255,255,255,0.9)');
      g2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(16, 20, 16, 300);
    });
    mk('fx_jet', 76, 40, (ctx) => plane(ctx, 40, 20, 1.15, '#26c6da', false));
    mk('fx_jet_gold', 76, 40, (ctx) => plane(ctx, 40, 20, 1.15, '#ffc400', false));
    mk('fx_bomber', 80, 44, (ctx) => {
      plane(ctx, 40, 22, 1.3, '#689f38', true);
      D.starPath(ctx, 26, 22, 5, 4, 1.8);
      D.fs(ctx, '#ffffff', OL, 0.6);
    });
    mk('fx_runner', 30, 38, (ctx) => {
      M.draw(ctx, {
        x: 15, y: 18, w: 15, h: 21, eyes: 2, hair: 'sprout', mouth: 'happy', seed: 141, lw: 1, lookX: -0.8,
        arms: [{ x0: 8.5, y0: 17, x1: 4, y1: 8 }, { x0: 21.5, y0: 17, x1: 26, y1: 9 }],
      });
    });
    mk('fx_cured', 28, 36, (ctx) => {
      M.draw(ctx, {
        x: 14, y: 17, w: 15, h: 20, eyes: 1, hair: 'sprout', mouth: 'happy', seed: 151, lw: 1,
        arms: [{ x0: 7.5, y0: 16, x1: 3, y1: 8 }, { x0: 20.5, y0: 16, x1: 25, y1: 8 }],
      });
      for (let i = 0; i < 3; i++) {
        D.starPath(ctx, 4 + i * 10, 3 + (i % 2) * 3, 4, 2.6, 0.9);
        D.fs(ctx, '#fff59d');
      }
    });
    mk('fx_piranha', 34, 24, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(4, 12);
      ctx.lineTo(0, 4);
      ctx.lineTo(0, 20);
      ctx.closePath();
      D.fs(ctx, '#78909c', OL, 1);
      ctx.beginPath();
      ctx.moveTo(4, 12);
      ctx.bezierCurveTo(10, 0, 26, 0, 32, 10);
      ctx.lineTo(24, 14);
      ctx.lineTo(32, 16);
      ctx.bezierCurveTo(26, 24, 10, 24, 4, 12);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 2, 0, 22, [[0, '#b0bec5'], [0.55, '#78909c'], [1, '#e53935']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(25 + i * 2.4, 12.5);
        ctx.lineTo(26.2 + i * 2.4, 15);
        ctx.lineTo(27.4 + i * 2.4, 12.8);
        ctx.fill();
      }
      D.circlePath(ctx, 24, 7.5, 2.4);
      D.fs(ctx, '#fff59d', OL, 0.7);
      D.circlePath(ctx, 24.6, 7.5, 1.1);
      D.fs(ctx, '#111');
    });
    mk('fx_pyramid', 110, 92, (ctx) => {
      D.shadow(ctx, 55, 86, 52, 6, 0.3);
      ctx.beginPath();
      ctx.moveTo(4, 84);
      ctx.lineTo(55, 6);
      ctx.lineTo(106, 84);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 4, 0, 106, 0, [[0, '#fff3c4'], [0.5, '#e8c66a'], [0.52, '#c9a24a'], [1, '#8d6e2a']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,90,30,0.5)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 7; i++) {
        const y = 6 + i * 11;
        const hw = (i * 11 * 51) / 78;
        ctx.beginPath();
        ctx.moveTo(55 - hw, y);
        ctx.lineTo(55 + hw, y);
        ctx.stroke();
      }
      // price tag: it was stolen after all
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(55, 6);
      ctx.lineTo(70, 18);
      ctx.stroke();
      D.rrPath(ctx, 66, 16, 14, 9, 2);
      D.fs(ctx, '#ffffff', OL, 1);
      ctx.fillStyle = '#e53935';
      ctx.font = 'bold 7px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('V', 73, 21);
    });
    mk('fx_nuke', 160, 190, (ctx) => {
      const rnd = D.rng(21);
      // stem
      ctx.beginPath();
      ctx.moveTo(62, 186);
      ctx.quadraticCurveTo(70, 120, 66, 84);
      ctx.lineTo(94, 84);
      ctx.quadraticCurveTo(90, 120, 98, 186);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 60, 0, 100, 0, [[0, '#c5f08a'], [0.5, '#7cc23a'], [1, '#3b7a12']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,60,10,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // ring around stem
      D.ellipsePath(ctx, 80, 128, 34, 9);
      D.fs(ctx, 'rgba(197,240,138,0.85)', 'rgba(30,60,10,0.6)', 1.5);
      // cap
      for (let i = 0; i < 16; i++) {
        const a = Math.PI * (1 + (i / 15));
        D.blobPath(ctx, 80 + Math.cos(a) * 52, 70 + Math.sin(a) * 40, 18 + rnd() * 8, 8, 0.2, rnd);
        D.fs(ctx, i % 2 ? '#9be15d' : '#c5f08a', 'rgba(30,60,10,0.55)', 1.5);
      }
      D.blobPath(ctx, 80, 66, 46, 10, 0.12, rnd);
      ctx.fillStyle = D.rad(ctx, 70, 50, 4, 80, 66, 48, [[0, '#f1ffd6'], [0.5, '#b8f07a'], [1, '#6abf2a']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,60,10,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    mk('fx_jellywave', 96, 64, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(4, 60);
      ctx.bezierCurveTo(10, 30, 40, 4, 74, 8);
      ctx.bezierCurveTo(96, 12, 94, 34, 80, 36);
      ctx.bezierCurveTo(70, 37, 68, 26, 76, 24);
      ctx.bezierCurveTo(60, 22, 56, 48, 70, 60);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 0, 0, 64, [[0, '#ffd0dc'], [0.4, '#ff4f7b'], [1, '#b0123e']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        D.circlePath(ctx, 20 + i * 10, 44 - i * 5, 2.4);
        D.fs(ctx, 'rgba(255,255,255,0.7)');
      }
    });

    // ---------------------------------------------------------------- ability badges
    const ab = (key, c1, c2, fn) => mk(key, 56, 56, (ctx) => {
      iconBadge(ctx, 56, c1, c2);
      fn(ctx);
    });
    ab('ab_zap', '#b3e5fc', '#01579b', (ctx) => zigzag(ctx, 28, 28, 1.2, '#fff59d'));
    ab('ab_zeus', '#e1bee7', '#311b92', (ctx) => {
      zigzag(ctx, 22, 28, 1.05, '#ffffff');
      zigzag(ctx, 34, 26, 1.05, '#fff176');
    });
    ab('ab_bomber', '#c5e1a5', '#33691e', (ctx) => ctx.drawImage(img('fx_bomber'), 6, 16, 44, 24));
    ab('ab_jet', '#b2ebf2', '#006064', (ctx) => ctx.drawImage(img('fx_jet'), 6, 17, 44, 23));
    ab('ab_note', '#f8bbd0', '#880e4f', (ctx) => note(ctx, 26, 30, 1.2, '#ffffff'));
    ab('ab_encore', '#fff59d', '#ff6f00', (ctx) => {
      note(ctx, 20, 30, 0.9, '#ff4081');
      note(ctx, 34, 26, 0.9, '#40c4ff');
    });
    ab('ab_lipstick', '#f8bbd0', '#ad1457', (ctx) => {
      ctx.save();
      ctx.translate(28, 29);
      ctx.rotate(-0.7);
      D.rrPath(ctx, -12, -6, 16, 12, 2);
      D.fs(ctx, '#ffd54f', OL, 1.8);
      ctx.beginPath();
      ctx.moveTo(4, -5);
      ctx.lineTo(13, -5);
      ctx.lineTo(17, 5);
      ctx.lineTo(4, 5);
      ctx.closePath();
      D.fs(ctx, '#e91e63', OL, 1.8);
      ctx.restore();
      zigzag(ctx, 41, 14, 0.45, '#ffffff');
    });
    ab('ab_fartgun', '#dcedc8', '#33691e', (ctx) => {
      const rnd = D.rng(4);
      for (let i = 0; i < 4; i++) {
        D.blobPath(ctx, 18 + i * 7, 32 - i * 5, 8 - i, 7, 0.2, rnd);
        D.fs(ctx, 'rgba(155,225,93,0.95)', OL, 1.4);
      }
    });
    ab('ab_serum', '#b2fef7', '#00796b', (ctx) => {
      ctx.save();
      ctx.translate(28, 28);
      ctx.rotate(0.6);
      D.rrPath(ctx, -5, -16, 10, 26, 3);
      D.fs(ctx, 'rgba(255,255,255,0.9)', OL, 1.8);
      D.rrPath(ctx, -4, -4, 8, 13, 2);
      D.fs(ctx, '#80ffea');
      D.rrPath(ctx, -7, -19, 14, 4, 1.5);
      D.fs(ctx, '#90a4ae', OL, 1.4);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(0, 18);
      ctx.stroke();
      ctx.restore();
    });
    ab('ab_stampede', '#fff59d', '#f9a825', (ctx) => {
      ctx.drawImage(img('fx_runner'), 2, 12, 26, 33);
      ctx.drawImage(img('fx_runner'), 16, 8, 26, 33);
      ctx.drawImage(img('fx_runner'), 28, 14, 26, 33);
    });
    ab('ab_giant', '#ffe082', '#e65100', (ctx) => {
      M.draw(ctx, { x: 28, y: 29, w: 18, h: 28, eyes: 2, hair: 'sprout', mouth: 'grin', seed: 131, lw: 1.2, arms: [{ x0: 19.5, y0: 30, x1: 13, y1: 20 }, { x0: 36.5, y0: 30, x1: 43, y1: 20 }] });
      MT.TowerArt.props.crown(ctx, 28, 12, 0.6, '#e53935');
    });
    ab('ab_piranha', '#b3e5fc', '#0d47a1', (ctx) => ctx.drawImage(img('fx_piranha'), 9, 15, 38, 27));
    ab('ab_pyramid', '#ffe0b2', '#e65100', (ctx) => ctx.drawImage(img('fx_pyramid'), 8, 10, 40, 34));
    ab('ab_apocalypse', '#fff59d', '#ff6f00', (ctx) => {
      props.bananaBall(ctx, 30, 30, 10, true);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(10, 12);
      ctx.lineTo(20, 22);
      ctx.moveTo(18, 8);
      ctx.lineTo(25, 17);
      ctx.stroke();
    });
    ab('ab_nuke', '#dcedc8', '#1b5e20', (ctx) => ctx.drawImage(img('fx_nuke'), 10, 6, 36, 43));
    ab('ab_armageddon', '#ffccbc', '#b71c1c', (ctx) => {
      [[-0.9, 16, 30], [-0.6, 28, 36], [-1.1, 30, 22]].forEach(([r, x, y]) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r);
        ctx.drawImage(img('p_missile'), -14, -6, 28, 12);
        ctx.restore();
      });
    });
    ab('ab_iceage', '#e1f5fe', '#01579b', (ctx) => {
      MT.FXArt.snowflake(ctx, 28, 28, 15, '#ffffff');
      D.circlePath(ctx, 28, 28, 6);
      D.fs(ctx, '#b3e5fc', OL, 1.4);
    });
    ab('ab_tsunami', '#f8bbd0', '#880e4f', (ctx) => ctx.drawImage(img('fx_jellywave'), 7, 12, 42, 28));
    ab('ab_orbital', '#b3e5fc', '#0d47a1', (ctx) => {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(24, 22);
      ctx.lineTo(32, 22);
      ctx.lineTo(36, 50);
      ctx.lineTo(20, 50);
      ctx.closePath();
      ctx.fill();
      D.rrPath(ctx, 18, 10, 20, 12, 3);
      D.fs(ctx, '#cfd8dc', OL, 1.6);
      D.rrPath(ctx, 6, 13, 10, 6, 1);
      D.fs(ctx, '#1a237e', OL, 1.2);
      D.rrPath(ctx, 40, 13, 10, 6, 1);
      D.fs(ctx, '#1a237e', OL, 1.2);
    });
    ab('ab_bananarain', '#fff59d', '#f57f17', (ctx) => {
      ctx.drawImage(img('fx_banana_gold'), 6, 6, 26, 23);
      ctx.drawImage(img('fx_banana_gold'), 24, 24, 26, 23);
    });
    ab('ab_overload', '#f3e5f5', '#6a1b9a', (ctx) => {
      zigzag(ctx, 28, 28, 1.15, '#ea80fc');
      D.circlePath(ctx, 28, 28, 18);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
    ab('ab_spikes', '#eceff1', '#455a64', (ctx) => ctx.drawImage(img('fx_nails'), 6, 8, 44, 37));
    ab('ab_ironrain', '#cfd8dc', '#263238', (ctx) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(12 + i * 9, 6);
        ctx.lineTo(8 + i * 9, 18);
        ctx.stroke();
      }
      ctx.drawImage(img('fx_nails_big'), 8, 14, 40, 35);
    });
    ab('ab_nukelaunch', '#dcedc8', '#33691e', (ctx) => {
      D.circlePath(ctx, 28, 28, 15);
      D.fs(ctx, '#ffeb3b', OL, 1.8);
      ctx.fillStyle = OL;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(28, 28);
        ctx.arc(28, 28, 13, (i * 2 * Math.PI) / 3 - 0.5, (i * 2 * Math.PI) / 3 + 0.5);
        ctx.closePath();
        ctx.fill();
      }
      D.circlePath(ctx, 28, 28, 3.5);
      D.fs(ctx, '#ffeb3b', OL, 1);
    });
    ab('ab_kraken', '#d1c4e9', '#311b92', (ctx) => ctx.drawImage(img('fx_tentacle'), 14, 4, 28, 50));
    ab('ab_leviathan', '#b2ebf2', '#006064', (ctx) => {
      ctx.drawImage(img('fx_tentacle'), 4, 8, 22, 40);
      ctx.drawImage(img('p_torpedo'), 22, 26, 30, 12);
      ctx.drawImage(img('p_torpedo'), 20, 36, 30, 12);
    });
    ab('ab_legend', '#fff59d', '#6a1b9a', (ctx) => {
      glowDot(ctx, 28, 31, 20, '#fff8e1', '#ffb300');
      D.starPath(ctx, 28, 32, 5, 15, 6.5);
      ctx.fillStyle = D.lin(ctx, 0, 17, 0, 47, [[0, '#fffde7'], [0.5, '#ffd54f'], [1, '#ff8f00']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      MT.TowerArt.props.crown(ctx, 28, 13, 0.75, '#e040fb');
    });
    ab('ab_supernova', '#ffffff', '#ff8f00', (ctx) => {
      glowDot(ctx, 28, 28, 22, '#fff59d', '#ff6f00');
      D.starPath(ctx, 28, 28, 12, 18, 7);
      D.fs(ctx, '#fffde7', OL, 1.4);
    });
  }

  MT.FXArt.generate2 = generate;
})();
