// Map painter: ground, track, water/lava and scenery for every theme.
(function () {
  const D = MT.Draw;
  const OL = D.OL;
  const W = MT.CFG.MAP_W, H = MT.CFG.MAP_H;
  const TP = () => MT.TowerArt.props;

  // ---------------------------------------------------------------- layout
  const NON_BLOCKING = { flowers: 1, fern: 1, vent: 1 };
  const SCATTER_R = { tree: 34, bush: 16, rock: 13, flowers: 14, bananatree: 28, palm: 26, fern: 14, labcrate: 18, pxbarrel: 14, crater: 30, moonrock: 13, bigrock: 26 };

  function waterDist(wa, x, y) {
    if (wa.type === 'river' || wa.type === 'sea') {
      if (!wa._pts) wa._pts = MT.Path.smooth(wa.pts, 6);
      let best = Infinity;
      for (const p of wa._pts) best = Math.min(best, Math.hypot(p[0] - x, p[1] - y));
      return best - wa.width / 2;
    }
    return Math.hypot(wa.x - x, wa.y - y) - wa.r;
  }

  function layout(map, paths) {
    if (map._layout) return map._layout;
    const rnd = D.rng(map.seed * 7 + 1);
    const decor = map.decor.map((d) => Object.assign({}, d));
    const water = map.water || [];
    const pathClear = (x, y, r) => paths.every((p) => p.distTo(x, y) > map.pathWidth / 2 + r + 6);
    const sc = map.scatter || {};
    Object.keys(sc).forEach((type) => {
      const r = SCATTER_R[type] || 16;
      let placed = 0, tries = 0;
      while (placed < sc[type] && tries < 400) {
        tries++;
        const x = 24 + rnd() * (W - 48), y = 24 + rnd() * (H - 48);
        if (!pathClear(x, y, r)) continue;
        if (water.some((wa) => waterDist(wa, x, y) < r + 6)) continue;
        if (decor.some((d) => Math.hypot(d.x - x, d.y - y) < (d.r || 10) + r + 6)) continue;
        if (decor.some((d) => d.block && d.block.some(([bx, by, br]) => Math.hypot(bx - x, by - y) < br + r))) continue;
        decor.push({ type, x, y, r, s: 0.85 + rnd() * 0.3, seed: Math.floor(rnd() * 1e6) });
        placed++;
      }
    });
    const blockers = [];
    decor.forEach((d) => {
      if (NON_BLOCKING[d.type]) return;
      if (d.block) d.block.forEach(([x, y, r]) => blockers.push({ x, y, r }));
      else if (d.r) blockers.push({ x: d.x, y: d.y, r: d.r });
    });
    // everything a submarine can float on: water, lava, goo and decorative ponds
    const pools = water.concat(decor.filter((d) => d.type === 'pond').map((d) => ({ type: 'pond', x: d.x, y: d.y, r: d.r })));
    map._layout = { decor, blockers, water, pools };
    return map._layout;
  }

  // ---------------------------------------------------------------- helpers
  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  }
  function strokePoly(ctx, pts, width, style, dy = 0) {
    ctx.save();
    ctx.translate(0, dy);
    poly(ctx, pts);
    ctx.lineWidth = width;
    ctx.strokeStyle = style;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    ctx.stroke();
    ctx.restore();
  }
  // walk along points every `spacing` px, giving position + direction
  function walk(pts, spacing, fn) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      acc += len;
      while (acc >= spacing) {
        acc -= spacing;
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        fn(b.x, b.y, ang);
      }
    }
  }
  function speckle(ctx, rnd, n, colors, rMin, rMax, alpha) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = D.rgba(colors[i % colors.length], alpha);
      D.ellipsePath(ctx, rnd() * W, rnd() * H, rMin + rnd() * (rMax - rMin), (rMin + rnd() * (rMax - rMin)) * 0.7, rnd() * 3);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------- themes
  const THEMES = {};

  THEMES.yard = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.lin(ctx, 0, 0, W, H, [[0, '#86c94f'], [1, '#5aa335']]);
      ctx.fillRect(0, 0, W, H);
      // mowing stripes
      ctx.save();
      ctx.rotate(-0.35);
      for (let i = -20; i < 40; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,40,0,0.04)';
        ctx.fillRect(i * 46, -400, 46, 2000);
      }
      ctx.restore();
      speckle(ctx, rnd, 900, ['#4f8f2c', '#9bd866', '#6db544'], 2, 6, 0.35);
      // grass blades
      ctx.lineWidth = 1;
      for (let i = 0; i < 2600; i++) {
        const x = rnd() * W, y = rnd() * H;
        ctx.strokeStyle = rnd() > 0.5 ? 'rgba(40,100,20,0.35)' : 'rgba(170,230,110,0.35)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rnd() - 0.5) * 3, y - 3 - rnd() * 3);
        ctx.stroke();
      }
    },
    path(ctx, paths, pw, rnd) {
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 16, 'rgba(0,0,0,0.16)', 3));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 8, '#8b6a42'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw, '#d9bb8b'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw * 0.55, 'rgba(255,240,210,0.25)'));
      paths.forEach((p) => {
        let side = 1;
        walk(p.pts, 15, (x, y, a) => {
          side = -side;
          const off = side * pw * 0.2;
          const sx = x + Math.cos(a + Math.PI / 2) * off, sy = y + Math.sin(a + Math.PI / 2) * off;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(a + (rnd() - 0.5) * 0.5);
          const sw = 12 + rnd() * 5, sh = 10 + rnd() * 4;
          D.rrPath(ctx, -sw / 2, -sh / 2 + 1.5, sw, sh, 4);
          D.fs(ctx, 'rgba(90,70,40,0.35)');
          D.rrPath(ctx, -sw / 2, -sh / 2, sw, sh, 4);
          ctx.fillStyle = D.lin(ctx, 0, -sh / 2, 0, sh / 2, [[0, '#e9e3d6'], [1, '#b8ad9a']]);
          ctx.fill();
          ctx.strokeStyle = 'rgba(80,60,40,0.55)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        });
      });
    },
  };

  THEMES.jungle = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.lin(ctx, 0, 0, W, H, [[0, '#4f9a3a'], [1, '#2f7a2c']]);
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, rnd, 120, ['#7a6234', '#5d8f30'], 20, 50, 0.18);
      // leaf litter
      for (let i = 0; i < 1400; i++) {
        const x = rnd() * W, y = rnd() * H, a = rnd() * 6.28, l = 4 + rnd() * 6;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(l / 2, -l * 0.35, l, 0);
        ctx.quadraticCurveTo(l / 2, l * 0.35, 0, 0);
        ctx.fillStyle = ['rgba(30,90,30,0.45)', 'rgba(120,190,70,0.4)', 'rgba(70,130,40,0.45)'][i % 3];
        ctx.fill();
        ctx.restore();
      }
    },
    path(ctx, paths, pw, rnd) {
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 14, 'rgba(0,0,0,0.22)', 3));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 8, '#6b4626'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw, '#b0804c'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw * 0.5, 'rgba(230,190,130,0.25)'));
      paths.forEach((p) => {
        // ruts
        [-1, 1].forEach((s) => {
          const pts = p.pts.map((q, i) => {
            const n = p.pts[Math.min(i + 1, p.pts.length - 1)], pr = p.pts[Math.max(i - 1, 0)];
            const a = Math.atan2(n.y - pr.y, n.x - pr.x) + Math.PI / 2;
            return { x: q.x + Math.cos(a) * pw * 0.24 * s, y: q.y + Math.sin(a) * pw * 0.24 * s };
          });
          strokePoly(ctx, pts, 3, 'rgba(90,55,25,0.35)');
        });
        walk(p.pts, 9, (x, y) => {
          if (rnd() < 0.5) {
            D.ellipsePath(ctx, x + (rnd() - 0.5) * pw * 0.8, y + (rnd() - 0.5) * pw * 0.8, 1.5 + rnd() * 2, 1 + rnd() * 1.5, rnd() * 3);
            D.fs(ctx, rnd() > 0.5 ? 'rgba(120,90,60,0.8)' : 'rgba(210,180,140,0.7)');
          }
        });
      });
    },
  };

  THEMES.lab = {
    ground(ctx, rnd) {
      ctx.fillStyle = '#4b535e';
      ctx.fillRect(0, 0, W, H);
      const T = 60;
      for (let y = 0; y < H; y += T) {
        for (let x = 0; x < W; x += T) {
          const v = rnd() * 0.06;
          D.rrPath(ctx, x + 2, y + 2, T - 4, T - 4, 6);
          ctx.fillStyle = D.lin(ctx, x, y, x + T, y + T, [[0, D.shade('#6b7480', v)], [1, D.shade('#565e69', -v)]]);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();
          // tread pattern on some tiles
          if ((x / T + y / T) % 3 === 0) {
            ctx.strokeStyle = 'rgba(30,35,40,0.25)';
            ctx.lineWidth = 2;
            for (let k = 0; k < 4; k++) {
              ctx.beginPath();
              ctx.moveTo(x + 12 + k * 11, y + 14);
              ctx.lineTo(x + 18 + k * 11, y + 20);
              ctx.moveTo(x + 12 + k * 11, y + 40);
              ctx.lineTo(x + 18 + k * 11, y + 46);
              ctx.stroke();
            }
          }
          [[x + 7, y + 7], [x + T - 7, y + 7], [x + 7, y + T - 7], [x + T - 7, y + T - 7]].forEach(([rx, ry]) => {
            D.circlePath(ctx, rx, ry, 1.6);
            D.fs(ctx, '#8c96a2');
          });
        }
      }
      speckle(ctx, rnd, 60, ['#2d3238', '#384049'], 10, 30, 0.18);
      // hazard border
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(14, 14, W - 28, H - 28);
      ctx.clip('evenodd');
      for (let i = -40; i < 120; i++) {
        ctx.fillStyle = i % 2 ? '#ffc928' : '#22262b';
        ctx.beginPath();
        ctx.moveTo(i * 16, 0);
        ctx.lineTo(i * 16 + 16, 0);
        ctx.lineTo(i * 16 - 704, H + 20);
        ctx.lineTo(i * 16 - 720, H + 20);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },
    path(ctx, paths, pw, rnd) {
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 18, 'rgba(0,0,0,0.3)', 4));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 12, '#1d2026'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 8, '#a7b0bb'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 2, '#2a2e35'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw - 2, '#3a3f47'));
      paths.forEach((p) => {
        walk(p.pts, 9, (x, y, a) => {
          const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
          ctx.strokeStyle = 'rgba(15,17,20,0.55)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x - nx * (pw / 2 - 2), y - ny * (pw / 2 - 2));
          ctx.lineTo(x + nx * (pw / 2 - 2), y + ny * (pw / 2 - 2));
          ctx.stroke();
        });
        walk(p.pts, 70, (x, y, a) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(-6, -10);
          ctx.lineTo(4, 0);
          ctx.lineTo(-6, 10);
          ctx.strokeStyle = 'rgba(255,201,40,0.55)';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        });
      });
    },
  };

  THEMES.moon = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.rad(ctx, W * 0.4, H * 0.3, 50, W / 2, H / 2, W * 0.75, [[0, '#c3c4ca'], [1, '#8d8f98']]);
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, rnd, 500, ['#a5a7ae', '#7c7e86', '#d4d5da'], 3, 12, 0.35);
      for (let i = 0; i < 140; i++) {
        const x = rnd() * W, y = rnd() * H, r = 2 + rnd() * 6;
        miniCrater(ctx, x, y, r);
      }
      // star dust
      for (let i = 0; i < 300; i++) {
        D.circlePath(ctx, rnd() * W, rnd() * H, 0.6);
        D.fs(ctx, 'rgba(255,255,255,0.5)');
      }
    },
    path(ctx, paths, pw, rnd) {
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 12, 'rgba(60,60,70,0.25)', 3));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 6, '#a2a3ab'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw, '#d9dae0'));
      paths.forEach((p) => {
        walk(p.pts, 7, (x, y, a) => {
          [-1, 1].forEach((s) => {
            const nx = Math.cos(a + Math.PI / 2) * pw * 0.26 * s, ny = Math.sin(a + Math.PI / 2) * pw * 0.26 * s;
            ctx.save();
            ctx.translate(x + nx, y + ny);
            ctx.rotate(a);
            ctx.fillStyle = 'rgba(120,120,130,0.45)';
            ctx.fillRect(-1.2, -4, 2.4, 8);
            ctx.restore();
          });
        });
      });
    },
  };

  THEMES.volcano = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.lin(ctx, 0, 0, W, H, [[0, '#4a3a36'], [1, '#2b2220']]);
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, rnd, 400, ['#5c4a44', '#3a2d2a', '#6b5650'], 4, 16, 0.4);
      // glowing cracks
      for (let i = 0; i < 26; i++) {
        let x = rnd() * W, y = rnd() * H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          x += (rnd() - 0.5) * 40;
          y += (rnd() - 0.5) * 40;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255,110,20,0.25)';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,180,60,0.7)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    },
    path(ctx, paths, pw, rnd) {
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 16, 'rgba(255,90,0,0.18)'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw + 8, '#1e1513'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw, '#857164'));
      paths.forEach((p) => strokePoly(ctx, p.pts, pw * 0.5, 'rgba(200,180,160,0.18)'));
      paths.forEach((p) => {
        walk(p.pts, 10, (x, y) => {
          if (rnd() < 0.6) {
            D.blobPath(ctx, x + (rnd() - 0.5) * pw * 0.8, y + (rnd() - 0.5) * pw * 0.8, 1.5 + rnd() * 2.5, 5, 0.3, rnd);
            D.fs(ctx, rnd() > 0.5 ? 'rgba(60,45,40,0.7)' : 'rgba(170,150,135,0.7)');
          }
        });
      });
    },
  };

  function miniCrater(ctx, x, y, r) {
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.3, y - r * 0.3, 0, x, y, r, [[0, 'rgba(80,80,90,0.45)'], [1, 'rgba(80,80,90,0.1)']]);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI * 0.1, Math.PI * 0.9);
    ctx.strokeStyle = 'rgba(240,240,245,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ---------------------------------------------------------------- water / lava
  // extra water painters registered by other files (sea, ice lake, fountain...)
  const WATER = {};
  function paintWater(ctx, wa, rnd) {
    if (WATER[wa.type]) return WATER[wa.type](ctx, wa, rnd);
    if (wa.type === 'goo') {
      // bubbling pool of purple PX-41 goo
      const r2 = D.rng(wa.seed * 17);
      D.blobPath(ctx, wa.x, wa.y, wa.r + 8, 11, 0.12, r2);
      D.fs(ctx, '#4a4f5a', OL, 2);
      const r3 = D.rng(wa.seed * 17);
      D.blobPath(ctx, wa.x, wa.y, wa.r, 11, 0.12, r3);
      ctx.fillStyle = D.rad(ctx, wa.x - wa.r * 0.3, wa.y - wa.r * 0.3, 2, wa.x, wa.y, wa.r, [[0, '#e1b8ff'], [0.45, '#a34fd6'], [1, '#5e1f8a']]);
      ctx.fill();
      ctx.strokeStyle = '#3b1059';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 9; i++) {
        const bx = wa.x + (rnd() - 0.5) * wa.r * 1.4, by = wa.y + (rnd() - 0.5) * wa.r * 1.4, br = 2 + rnd() * 5;
        D.circlePath(ctx, bx, by, br);
        D.fs(ctx, 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.55)', 1);
      }
      ctx.restore();
      D.ellipsePath(ctx, wa.x - wa.r * 0.35, wa.y - wa.r * 0.4, wa.r * 0.28, wa.r * 0.1, -0.4);
      D.fs(ctx, 'rgba(255,255,255,0.35)');
      return;
    }
    if (wa.type === 'lava') {
      const r2 = D.rng(wa.seed * 31);
      ctx.save();
      ctx.shadowColor = 'rgba(255,100,0,0.8)';
      ctx.shadowBlur = 24;
      D.blobPath(ctx, wa.x, wa.y, wa.r + 8, 12, 0.18, r2);
      D.fs(ctx, '#2a1a14');
      ctx.restore();
      const r3 = D.rng(wa.seed * 31);
      D.blobPath(ctx, wa.x, wa.y, wa.r, 12, 0.18, r3);
      ctx.fillStyle = D.rad(ctx, wa.x, wa.y, wa.r * 0.1, wa.x, wa.y, wa.r, [[0, '#fff36b'], [0.35, '#ffb02e'], [0.75, '#ff6a00'], [1, '#d63a00']]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 14; i++) {
        D.blobPath(ctx, wa.x + (rnd() - 0.5) * wa.r * 1.6, wa.y + (rnd() - 0.5) * wa.r * 1.6, 6 + rnd() * wa.r * 0.18, 7, 0.4, rnd);
        D.fs(ctx, 'rgba(70,25,10,0.75)', 'rgba(255,220,120,0.6)', 1);
      }
      ctx.restore();
      return;
    }
    if (wa.type === 'river') {
      const pts = MT.Path.smooth(wa.pts, 6).map(([x, y]) => ({ x, y }));
      strokePoly(ctx, pts, wa.width + 14, '#c9b27e');
      strokePoly(ctx, pts, wa.width + 4, '#2f7fae');
      strokePoly(ctx, pts, wa.width - 4, '#45a6db');
      strokePoly(ctx, pts, wa.width * 0.4, 'rgba(160,225,255,0.35)');
      walk(pts, 26, (x, y, a) => {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a + 1.57) * (rnd() - 0.5) * wa.width * 0.5, y, 5, Math.PI * 1.1, Math.PI * 1.7);
        ctx.stroke();
      });
      return;
    }
    // pond
    const r2 = D.rng(Math.floor(wa.x * 13 + wa.y));
    D.blobPath(ctx, wa.x, wa.y, wa.r + 9, 10, 0.08, r2);
    D.fs(ctx, '#c9b27e');
    const r3 = D.rng(Math.floor(wa.x * 13 + wa.y));
    D.blobPath(ctx, wa.x, wa.y, wa.r, 10, 0.08, r3);
    ctx.fillStyle = D.rad(ctx, wa.x - wa.r * 0.3, wa.y - wa.r * 0.3, 2, wa.x, wa.y, wa.r, [[0, '#7fd0f5'], [0.6, '#3f9fd6'], [1, '#2b77a8']]);
    ctx.fill();
    ctx.strokeStyle = '#2a5f80';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(wa.x + (rnd() - 0.5) * wa.r, wa.y + (rnd() - 0.5) * wa.r, 4 + rnd() * 6, Math.PI * 1.1, Math.PI * 1.8);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const lx = wa.x + (rnd() - 0.5) * wa.r * 1.1, ly = wa.y + (rnd() - 0.5) * wa.r * 1.1;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.arc(lx, ly, 6, 0.4, Math.PI * 2);
      ctx.closePath();
      D.fs(ctx, '#5cb85c', '#2e6b2e', 1);
    }
  }

  // ---------------------------------------------------------------- decor
  const DEC = {};

  DEC.tree = (ctx, d, rnd) => {
    const r = (d.r || 34) * (d.s || 1);
    D.shadow(ctx, d.x + r * 0.25, d.y + r * 0.35, r * 1.05, r * 0.7, 0.35);
    const greens = ['#2f7d32', '#3f9a3a', '#57b347', '#7ccc5a'];
    D.blobPath(ctx, d.x, d.y, r, 11, 0.12, rnd);
    D.fs(ctx, greens[0], OL, 1.6);
    for (let i = 0; i < 6; i++) {
      const a = rnd() * 6.28, rr = rnd() * r * 0.45;
      D.blobPath(ctx, d.x + Math.cos(a) * rr - r * 0.08, d.y + Math.sin(a) * rr - r * 0.1, r * (0.35 + rnd() * 0.2), 8, 0.2, rnd);
      D.fs(ctx, greens[1 + (i % 2)]);
    }
    D.blobPath(ctx, d.x - r * 0.25, d.y - r * 0.3, r * 0.32, 8, 0.2, rnd);
    D.fs(ctx, greens[3]);
    for (let i = 0; i < 5; i++) {
      D.circlePath(ctx, d.x + (rnd() - 0.5) * r * 1.2, d.y + (rnd() - 0.5) * r * 1.2, 2.2);
      D.fs(ctx, rnd() > 0.5 ? '#e53935' : '#ffd83a');
    }
  };

  DEC.deadtree = (ctx, d) => {
    D.shadow(ctx, d.x + 8, d.y + 26, 28, 9, 0.3);
    ctx.strokeStyle = OL;
    ctx.lineCap = 'round';
    const branch = (x, y, a, len, w, depth) => {
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      ctx.lineWidth = w + 2;
      ctx.strokeStyle = OL;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.lineWidth = w;
      ctx.strokeStyle = '#3a2f2a';
      ctx.stroke();
      if (depth > 0) {
        branch(x2, y2, a - 0.5, len * 0.7, w * 0.65, depth - 1);
        branch(x2, y2, a + 0.45, len * 0.65, w * 0.65, depth - 1);
      }
    };
    branch(d.x, d.y + 26, -Math.PI / 2, 22, 7, 3);
  };

  DEC.bush = (ctx, d, rnd) => {
    const r = (d.r || 16) * (d.s || 1);
    D.shadow(ctx, d.x + 3, d.y + r * 0.5, r * 1.1, r * 0.55, 0.3);
    D.blobPath(ctx, d.x, d.y, r, 9, 0.18, rnd);
    D.fs(ctx, '#3d8f34', OL, 1.4);
    D.blobPath(ctx, d.x - r * 0.25, d.y - r * 0.25, r * 0.55, 7, 0.2, rnd);
    D.fs(ctx, '#62b552');
    for (let i = 0; i < 4; i++) {
      D.circlePath(ctx, d.x + (rnd() - 0.5) * r * 1.2, d.y + (rnd() - 0.5) * r * 1.1, 1.8);
      D.fs(ctx, ['#ff80ab', '#fff', '#ffd83a'][i % 3]);
    }
  };

  DEC.rock = (ctx, d, rnd) => {
    const r = (d.r || 13) * (d.s || 1);
    const pal = d.pal || ['#9e9e9e', '#cfcfcf', '#6d6d6d'];
    D.shadow(ctx, d.x + 3, d.y + r * 0.5, r * 1.1, r * 0.5, 0.3);
    D.blobPath(ctx, d.x, d.y, r, 7, 0.25, rnd);
    ctx.fillStyle = D.lin(ctx, d.x - r, d.y - r, d.x + r, d.y + r, [[0, pal[1]], [0.5, pal[0]], [1, pal[2]]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    D.ellipsePath(ctx, d.x - r * 0.3, d.y - r * 0.35, r * 0.3, r * 0.15, -0.5);
    D.fs(ctx, 'rgba(255,255,255,0.35)');
  };
  DEC.bigrock = (ctx, d, rnd) => DEC.rock(ctx, Object.assign({}, d, { pal: ['#5a4a44', '#7d6a62', '#2e2522'] }), rnd);
  DEC.moonrock = (ctx, d, rnd) => DEC.rock(ctx, Object.assign({}, d, { pal: ['#9a9ba3', '#d0d1d6', '#62646c'] }), rnd);

  DEC.flowers = (ctx, d, rnd) => {
    const cols = ['#ff5f8f', '#ffffff', '#ffd83a', '#b388ff', '#ff8a65'];
    for (let i = 0; i < 5; i++) {
      const x = d.x + (rnd() - 0.5) * 22, y = d.y + (rnd() - 0.5) * 16;
      const c = cols[Math.floor(rnd() * cols.length)];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * 6.28;
        D.circlePath(ctx, x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.8);
        D.fs(ctx, c);
      }
      D.circlePath(ctx, x, y, 1.3);
      D.fs(ctx, '#ffb300');
    }
  };

  DEC.flowerbed = (ctx, d, rnd) => {
    D.ellipsePath(ctx, d.x, d.y, 46, 22);
    D.fs(ctx, '#7a5230', OL, 1.4);
    for (let i = 0; i < 6; i++) DEC.flowers(ctx, { x: d.x - 30 + i * 12, y: d.y + (i % 2 ? 6 : -6) }, rnd);
  };

  DEC.pond = (ctx, d, rnd) => paintWater(ctx, { type: 'pond', x: d.x, y: d.y, r: d.r }, rnd);

  DEC.doghouse = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 4, y + 26, 32, 10, 0.35);
    D.rrPath(ctx, x - 24, y - 6, 48, 30, 3);
    ctx.fillStyle = D.lin(ctx, x - 24, 0, x + 24, 0, [[0, '#6b6f78'], [1, '#3a3d44']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 30, y - 4);
    ctx.lineTo(x, y - 30);
    ctx.lineTo(x + 30, y - 4);
    ctx.closePath();
    D.fs(ctx, '#24262b', OL, 1.5);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 10 - 3, y - 14 + Math.abs(i) * 4);
      ctx.lineTo(x + i * 10, y - 22 + Math.abs(i) * 4);
      ctx.lineTo(x + i * 10 + 3, y - 14 + Math.abs(i) * 4);
      D.fs(ctx, '#9e9e9e', OL, 1);
    }
    ctx.beginPath();
    ctx.arc(x, y + 14, 9, Math.PI, 0);
    ctx.lineTo(x + 9, y + 24);
    ctx.lineTo(x - 9, y + 24);
    ctx.closePath();
    D.fs(ctx, '#111');
    // Kyle peeking
    D.circlePath(ctx, x - 3, y + 16, 1.6);
    D.fs(ctx, '#ffeb3b');
    D.circlePath(ctx, x + 3, y + 16, 1.6);
    D.fs(ctx, '#ffeb3b');
  };

  DEC.house = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 10, y + 20, 110, 26, 0.4);
    // dead lawn patch
    D.ellipsePath(ctx, x, y + 14, 120, 34);
    D.fs(ctx, 'rgba(110,95,60,0.55)');
    // main body
    D.rrPath(ctx, x - 70, y - 70, 140, 88, 3);
    ctx.fillStyle = D.lin(ctx, x - 70, 0, x + 70, 0, [[0, '#4d5059'], [0.5, '#3a3c44'], [1, '#26272c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    // brick lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let yy = y - 62; yy < y + 16; yy += 8) {
      ctx.beginPath();
      ctx.moveTo(x - 68, yy);
      ctx.lineTo(x + 68, yy);
      ctx.stroke();
    }
    // steep roof
    ctx.beginPath();
    ctx.moveTo(x - 82, y - 66);
    ctx.lineTo(x - 20, y - 132);
    ctx.lineTo(x, y - 150);
    ctx.lineTo(x + 20, y - 132);
    ctx.lineTo(x + 82, y - 66);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - 80, 0, x + 80, 0, [[0, '#2a2b31'], [1, '#121216']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    // roof shingles
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 82 + i * 12, y - 66 - i * 11);
      ctx.lineTo(x + 82 - i * 12, y - 66 - i * 11);
      ctx.stroke();
    }
    // chimney
    D.rrPath(ctx, x + 36, y - 124, 14, 34, 2);
    D.fs(ctx, '#3a3c44', OL, 1.5);
    // round windows
    [[x - 40, y - 36], [x + 40, y - 36], [x, y - 100]].forEach(([wx, wy], i) => {
      D.circlePath(ctx, wx, wy, i === 2 ? 11 : 13);
      D.fs(ctx, '#9e9e9e', OL, 1.6);
      D.circlePath(ctx, wx, wy, i === 2 ? 8 : 9.5);
      ctx.fillStyle = D.rad(ctx, wx - 3, wy - 3, 1, wx, wy, 10, [[0, '#fff8c4'], [1, '#ffcf40']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wx - 9, wy);
      ctx.lineTo(wx + 9, wy);
      ctx.moveTo(wx, wy - 9);
      ctx.lineTo(wx, wy + 9);
      ctx.stroke();
    });
    // door
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 18);
    ctx.lineTo(x - 14, y - 8);
    ctx.arc(x, y - 8, 14, Math.PI, 0);
    ctx.lineTo(x + 14, y + 18);
    ctx.closePath();
    D.fs(ctx, '#1a1a1d', OL, 1.6);
    D.circlePath(ctx, x + 8, y + 4, 1.8);
    D.fs(ctx, '#bdbdbd');
    // G logo above door
    D.circlePath(ctx, x, y - 32, 9);
    D.fs(ctx, '#e0e0e0', OL, 1.4);
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y - 32, 4.6, Math.PI * 0.15, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 32);
    ctx.lineTo(x + 4.5, y - 32);
    ctx.stroke();
    // steps
    D.rrPath(ctx, x - 20, y + 18, 40, 7, 2);
    D.fs(ctx, '#6d6f78', OL, 1.2);
  };

  DEC.bananatree = (ctx, d, rnd) => {
    const r = (d.r || 28) * (d.s || 1);
    D.shadow(ctx, d.x + 6, d.y + 8, r * 1.15, r * 0.75, 0.32);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + rnd() * 0.3;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.5, -r * 0.32, r * 1.05, 0);
      ctx.quadraticCurveTo(r * 0.5, r * 0.32, 0, 0);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, -r * 0.3, 0, r * 0.3, [[0, '#8fe06a'], [1, '#2f8a2f']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(20,80,20,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) TP().banana(ctx, d.x - 4 + (i % 2) * 7, d.y - 4 + Math.floor(i / 2) * 6, 0.45, 1.3 + i * 0.3, '#ffe14a');
  };

  DEC.palm = (ctx, d, rnd) => {
    const r = (d.r || 26) * (d.s || 1);
    D.shadow(ctx, d.x + 6, d.y + 8, r * 1.1, r * 0.7, 0.3);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 6.28 + rnd() * 0.3;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(a);
      ctx.strokeStyle = '#1f6b2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.5, -r * 0.18, r, 0);
      ctx.stroke();
      ctx.strokeStyle = '#4caf50';
      for (let k = 2; k < 9; k++) {
        const t = k / 10;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(r * t, -r * 0.18 * Math.sin(t * Math.PI));
        ctx.lineTo(r * t + 4, -r * 0.18 * Math.sin(t * Math.PI) - 6);
        ctx.moveTo(r * t, -r * 0.18 * Math.sin(t * Math.PI));
        ctx.lineTo(r * t + 4, -r * 0.18 * Math.sin(t * Math.PI) + 6);
        ctx.stroke();
      }
      ctx.restore();
    }
    D.circlePath(ctx, d.x, d.y, 5);
    D.fs(ctx, '#795548', OL, 1);
  };

  DEC.fern = (ctx, d, rnd) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.28 + rnd();
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(6, -4, 13, 0);
      ctx.quadraticCurveTo(6, 4, 0, 0);
      D.fs(ctx, i % 2 ? '#2e7d32' : '#66bb6a');
      ctx.restore();
    }
  };

  DEC.crate = (ctx, d) => {
    const s = 30;
    D.shadow(ctx, d.x + 4, d.y + 14, 20, 7, 0.35);
    D.rrPath(ctx, d.x - s / 2, d.y - s / 2, s, s, 2);
    ctx.fillStyle = D.lin(ctx, d.x - s / 2, d.y - s / 2, d.x + s / 2, d.y + s / 2, [[0, '#d7a86e'], [1, '#9c6b35']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80,45,15,0.7)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(d.x - s / 2 + 2, d.y - s / 2 + 2);
    ctx.lineTo(d.x + s / 2 - 2, d.y + s / 2 - 2);
    ctx.stroke();
    D.rrPath(ctx, d.x - 9, d.y - 4, 18, 8, 1);
    D.fs(ctx, '#ffd83a');
    ctx.fillStyle = '#5a3b12';
    ctx.font = 'bold 5px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BANANA', d.x, d.y + 0.3);
  };

  DEC.hut = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 8, y + 18, 54, 16, 0.35);
    D.rrPath(ctx, x - 34, y - 14, 68, 36, 4);
    D.fs(ctx, '#a1724a', OL, 1.6);
    ctx.strokeStyle = 'rgba(60,35,15,0.5)';
    for (let i = -30; i < 34; i += 8) {
      ctx.beginPath();
      ctx.moveTo(x + i, y - 12);
      ctx.lineTo(x + i, y + 20);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - 48, y - 10);
    ctx.lineTo(x, y - 50);
    ctx.lineTo(x + 48, y - 10);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, y - 50, 0, y - 10, [[0, '#e9c46a'], [1, '#b8862b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,80,20,0.55)';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 44 + i * 9.5, y - 11);
      ctx.lineTo(x - 2 + i * 0.4, y - 46);
      ctx.stroke();
    }
    D.rrPath(ctx, x - 9, y + 2, 18, 20, 3);
    D.fs(ctx, '#3e2723', OL, 1.2);
  };

  DEC.tank = (ctx, d, rnd) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 6, y + 30, 38, 12, 0.4);
    D.rrPath(ctx, x - 26, y - 34, 52, 64, 22);
    ctx.fillStyle = D.lin(ctx, x - 26, 0, x + 26, 0, [[0, 'rgba(210,255,220,0.9)'], [0.4, 'rgba(120,230,140,0.9)'], [1, 'rgba(30,140,60,0.95)']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      D.circlePath(ctx, x - 14 + rnd() * 28, y - 24 + rnd() * 46, 1.5 + rnd() * 3);
      D.fs(ctx, 'rgba(255,255,255,0.55)');
    }
    D.rrPath(ctx, x - 20, y - 26, 6, 44, 3);
    D.fs(ctx, 'rgba(255,255,255,0.35)');
    D.rrPath(ctx, x - 30, y - 40, 60, 10, 4);
    D.fs(ctx, '#8d99a6', OL, 1.4);
    D.rrPath(ctx, x - 30, y + 26, 60, 10, 4);
    D.fs(ctx, '#6c7783', OL, 1.4);
  };

  DEC.console = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 4, y + 26, 44, 10, 0.4);
    D.rrPath(ctx, x - 40, y - 26, 80, 50, 6);
    ctx.fillStyle = D.lin(ctx, 0, y - 26, 0, y + 24, [[0, '#7f8c99'], [1, '#3f4954']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.rrPath(ctx, x - 32, y - 20, 64, 26, 4);
    ctx.fillStyle = D.lin(ctx, 0, y - 20, 0, y + 6, [[0, '#0b3b2e'], [1, '#062018']]);
    ctx.fill();
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const xx = x - 30 + i * 2;
      const yy = y - 7 + Math.sin(i * 0.7) * 6 * Math.sin(i * 0.13);
      if (i) ctx.lineTo(xx, yy);
      else ctx.moveTo(xx, yy);
    }
    ctx.stroke();
    const cols = ['#ff1744', '#ffea00', '#00e5ff', '#76ff03', '#ff9100'];
    for (let i = 0; i < 8; i++) {
      D.circlePath(ctx, x - 30 + i * 8.5, y + 15, 2.6);
      D.fs(ctx, cols[i % cols.length], OL, 0.8);
    }
  };

  DEC.pxbarrel = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 3, y + 10, 15, 6, 0.4);
    D.circlePath(ctx, x, y, 13);
    ctx.fillStyle = D.rad(ctx, x - 4, y - 4, 1, x, y, 13, [[0, '#d39af0'], [1, '#5e1d82']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    D.circlePath(ctx, x, y, 9);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // hazard trefoil
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * 6.28 - 1.57;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, 6.5, a - 0.45, a + 0.45);
      ctx.closePath();
      D.fs(ctx, '#ffd83a');
    }
    D.circlePath(ctx, x, y, 1.8);
    D.fs(ctx, '#ffd83a');
  };

  DEC.labcrate = (ctx, d) => {
    const s = 32;
    D.shadow(ctx, d.x + 4, d.y + 14, 22, 7, 0.4);
    D.rrPath(ctx, d.x - s / 2, d.y - s / 2, s, s, 3);
    ctx.fillStyle = D.lin(ctx, d.x - s / 2, 0, d.x + s / 2, 0, [[0, '#b0bec5'], [1, '#607d8b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    D.rrPath(ctx, d.x - s / 2 + 4, d.y - s / 2 + 4, s - 8, s - 8, 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.stroke();
    D.circlePath(ctx, d.x, d.y, 6);
    D.fs(ctx, '#212121');
    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 3.2, Math.PI * 0.15, Math.PI * 1.8);
    ctx.stroke();
  };

  DEC.vent = (ctx, d) => {
    D.rrPath(ctx, d.x - 18, d.y - 12, 36, 24, 4);
    D.fs(ctx, '#2b2f36', OL, 1.4);
    ctx.strokeStyle = '#59616b';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(d.x - 14, d.y + i * 4.5);
      ctx.lineTo(d.x + 14, d.y + i * 4.5);
      ctx.stroke();
    }
  };

  DEC.crater = (ctx, d) => {
    const r = (d.r || 30) * (d.s || 1);
    D.circlePath(ctx, d.x, d.y, r + 4);
    D.fs(ctx, 'rgba(225,226,232,0.6)');
    D.circlePath(ctx, d.x, d.y, r);
    ctx.fillStyle = D.rad(ctx, d.x + r * 0.25, d.y + r * 0.25, r * 0.1, d.x, d.y, r, [[0, '#9fa1a9'], [0.7, '#7a7c85'], [1, '#55575f']]);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(d.x, d.y, r, Math.PI * 1.0, Math.PI * 1.75);
    ctx.strokeStyle = 'rgba(40,40,48,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(d.x, d.y, r, Math.PI * 0.05, Math.PI * 0.75);
    ctx.strokeStyle = 'rgba(245,245,250,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  DEC.flag = (ctx, d) => {
    D.shadow(ctx, d.x + 10, d.y + 2, 14, 4, 0.3);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x, d.y - 44);
    ctx.stroke();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.rrPath(ctx, d.x, d.y - 44, 30, 18, 2);
    D.fs(ctx, '#ffd83a', OL, 1.4);
    D.circlePath(ctx, d.x + 15, d.y - 35, 5.5);
    D.fs(ctx, '#1b1b1b');
    ctx.strokeStyle = '#ffd83a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(d.x + 15, d.y - 35, 2.8, Math.PI * 0.15, Math.PI * 1.8);
    ctx.stroke();
  };

  DEC.dish = (ctx, d) => {
    D.shadow(ctx, d.x + 6, d.y + 16, 26, 8, 0.35);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y + 14);
    ctx.lineTo(d.x, d.y - 4);
    ctx.stroke();
    D.ellipsePath(ctx, d.x, d.y - 10, 24, 14, -0.4);
    ctx.fillStyle = D.lin(ctx, d.x - 24, 0, d.x + 24, 0, [[0, '#ffffff'], [1, '#90a4ae']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    D.circlePath(ctx, d.x + 2, d.y - 11, 3);
    D.fs(ctx, '#ff5252', OL, 1);
  };

  DEC.rocket = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 8, y + 26, 54, 14, 0.4);
    // fins
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + s * 18, y - 10);
      ctx.lineTo(x + s * 42, y + 20);
      ctx.lineTo(x + s * 18, y + 18);
      ctx.closePath();
      D.fs(ctx, '#d32f2f', OL, 1.8);
    }
    // body
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 20);
    ctx.lineTo(x - 20, y - 70);
    ctx.quadraticCurveTo(x - 18, y - 118, x, y - 140);
    ctx.quadraticCurveTo(x + 18, y - 118, x + 20, y - 70);
    ctx.lineTo(x + 20, y + 20);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - 20, 0, x + 20, 0, [[0, '#ffffff'], [0.5, '#cfd8dc'], [1, '#78909c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(x - 30, y - 150, 60, 34);
    ctx.fillStyle = '#ffd83a';
    ctx.fillRect(x - 30, y - 12, 60, 8);
    ctx.restore();
    D.circlePath(ctx, x, y - 70, 10);
    D.fs(ctx, '#90a4ae', OL, 1.6);
    D.circlePath(ctx, x, y - 70, 7);
    ctx.fillStyle = D.rad(ctx, x - 2, y - 72, 1, x, y - 70, 7, [[0, '#e1f5fe'], [1, '#4fc3f7']]);
    ctx.fill();
    // a minion waving from the porthole
    D.circlePath(ctx, x - 1, y - 69, 3.2);
    D.fs(ctx, '#ffd83a');
    D.circlePath(ctx, x - 1, y - 70, 1.4);
    D.fs(ctx, '#fff', OL, 0.6);
    // nozzle
    D.rrPath(ctx, x - 14, y + 18, 28, 10, 3);
    D.fs(ctx, '#455a64', OL, 1.6);
    // middle fin
    D.rrPath(ctx, x - 3, y - 20, 6, 42, 2);
    D.fs(ctx, '#b71c1c', OL, 1.4);
  };

  DEC.skullrock = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 8, y + 30, 50, 12, 0.4);
    ctx.beginPath();
    ctx.moveTo(x - 40, y + 30);
    ctx.quadraticCurveTo(x - 46, y - 20, x, y - 40);
    ctx.quadraticCurveTo(x + 46, y - 20, x + 40, y + 30);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - 40, 0, x + 40, 0, [[0, '#7d6a62'], [1, '#2e2522']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    // eye sockets glowing
    [[-14, -8], [14, -8]].forEach(([ex, ey]) => {
      D.ellipsePath(ctx, x + ex, y + ey, 9, 8);
      D.fs(ctx, '#140c0a');
      D.circlePath(ctx, x + ex, y + ey, 3);
      ctx.fillStyle = '#ff7b00';
      ctx.fill();
    });
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 6);
    ctx.lineTo(x, y + 1);
    ctx.lineTo(x + 3, y + 6);
    ctx.closePath();
    D.fs(ctx, '#140c0a');
    // mouth / cave entrance
    D.rrPath(ctx, x - 18, y + 12, 36, 18, 6);
    D.fs(ctx, '#140c0a');
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#d7ccc8';
      ctx.fillRect(x - 16 + i * 7, y + 12, 4, 5);
    }
  };

  // ---------------------------------------------------------------- public
  function paint(ctx, map, paths) {
    const th = THEMES[map.theme];
    const L = layout(map, paths);
    const rnd = D.rng(map.seed);
    th.ground(ctx, rnd);
    L.water.forEach((wa) => paintWater(ctx, wa, rnd));
    th.path(ctx, paths, map.pathWidth, rnd);
    L.decor
      .filter((d) => !d.top)
      .sort((a, b) => (a.type === 'flowers' || a.type === 'fern' ? -1 : 0) - (b.type === 'flowers' || b.type === 'fern' ? -1 : 0) || a.y - b.y)
      .forEach((d) => {
        const r2 = D.rng(d.seed || Math.floor(d.x * 7 + d.y * 13));
        DEC[d.type](ctx, d, r2);
      });
  }

  MT.MapArt = {
    layout,
    paint,
    texture(scene, map, paths) {
      const key = 'map_' + map.id;
      if (!scene.textures.exists(key)) D.make(scene, key, W, H, (ctx) => paint(ctx, map, paths));
      return key;
    },
    // decor that must render above enemies (e.g. the moon rocket)
    overlays(scene, map, paths) {
      const L = layout(map, paths);
      return L.decor.filter((d) => d.top).map((d, i) => {
        const key = `mapov_${map.id}_${i}`;
        if (!scene.textures.exists(key)) {
          D.make(scene, key, 160, 200, (ctx) => {
            ctx.translate(80 - d.x, 170 - d.y);
            DEC[d.type](ctx, d, D.rng(9));
          });
        }
        return { key, x: d.x, y: d.y, ox: 0.5, oy: 170 / 200 };
      });
    },
    thumb(scene, map, paths) {
      const key = 'thumb_' + map.id;
      if (!scene.textures.exists(key)) {
        const scale = 0.5;
        const { c, ctx } = D.canvas(W, H, scale);
        paint(ctx, map, paths);
        layout(map, paths).decor.filter((d) => d.top).forEach((d) => DEC[d.type](ctx, d, D.rng(9)));
        scene.textures.addCanvas(key, c);
      }
      return key;
    },
    waterDist,
    // extension points for maps2.js
    THEMES, DEC, WATER, SCATTER_R, NON_BLOCKING,
    helpers: { poly, strokePoly, walk, speckle },
  };
})();
