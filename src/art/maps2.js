// Extra map themes: Banana Beach, Pyramid Desert, Arctic Base, Villain-Con City
// and the Minion Factory. Registers grounds, tracks, water and scenery painters
// into the tables exported by art/maps.js.
(function () {
  const D = MT.Draw;
  const OL = D.OL;
  const W = MT.CFG.MAP_W, H = MT.CFG.MAP_H;
  const A = MT.MapArt;
  const { THEMES, DEC, WATER, SCATTER_R, NON_BLOCKING } = A;
  const { poly, strokePoly, walk, speckle } = A.helpers;
  const TP = () => MT.TowerArt.props;

  Object.assign(SCATTER_R, { shell: 8, starfish: 9, beachrock: 13, cactus: 16, desertrock: 14, pine: 22, icecrystal: 13, snowrock: 14, lamp: 10, planter: 16, barrel: 14, toolbox: 13 });
  Object.assign(NON_BLOCKING, { shell: 1, starfish: 1 });

  // polyline shifted sideways by `off` px (for lane lines, ruts, rails)
  function offsetPts(pts, off) {
    return pts.map((q, i) => {
      const n = pts[Math.min(i + 1, pts.length - 1)], pr = pts[Math.max(i - 1, 0)];
      const a = Math.atan2(n.y - pr.y, n.x - pr.x) + Math.PI / 2;
      return { x: q.x + Math.cos(a) * off, y: q.y + Math.sin(a) * off };
    });
  }
  function shadowPass(ctx, paths, w, style, dy) {
    paths.forEach((p) => strokePoly(ctx, p.pts, w, style, dy));
  }
  // simple 3/4 view cylinder (towers, barrels, pillars)
  function cylinder(ctx, x, y, w, h, side, top, lw = 1.3) {
    const ry = w * 0.28;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h);
    ctx.lineTo(x - w / 2, y);
    ctx.ellipse(x, y, w / 2, ry, 0, Math.PI, 0, true);
    ctx.lineTo(x + w / 2, y - h);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, D.shade(side, 0.15)], [0.5, side], [1, D.shade(side, -0.3)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = lw;
    ctx.stroke();
    D.ellipsePath(ctx, x, y - h, w / 2, ry);
    D.fs(ctx, top, OL, lw);
  }

  // ================================================================ THEMES
  THEMES.beach = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.lin(ctx, 0, 0, 0, H, [[0, '#f7e3a8'], [0.75, '#efd18c'], [1, '#d9b26c']]);
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, rnd, 700, ['#e2c27d', '#fff1c8', '#d4a964'], 2, 6, 0.4);
      // wind ripples in the sand
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 160; i++) {
        const x = rnd() * W, y = rnd() * H, l = 16 + rnd() * 26;
        ctx.strokeStyle = 'rgba(190,140,70,0.22)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + l / 2, y - 4, x + l, y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,250,225,0.35)';
        ctx.beginPath();
        ctx.moveTo(x, y + 1.6);
        ctx.quadraticCurveTo(x + l / 2, y - 2.4, x + l, y + 1.6);
        ctx.stroke();
      }
      for (let i = 0; i < 260; i++) {
        D.circlePath(ctx, rnd() * W, rnd() * H, 0.8 + rnd() * 1.2);
        D.fs(ctx, rnd() > 0.5 ? 'rgba(140,110,80,0.45)' : 'rgba(255,255,255,0.6)');
      }
    },
    // wooden boardwalk
    path(ctx, paths, pw, rnd) {
      shadowPass(ctx, paths, pw + 16, 'rgba(90,60,20,0.22)', 4);
      shadowPass(ctx, paths, pw + 8, '#5d4027');
      const cols = ['#c89a62', '#b98a54', '#d4a970', '#c08f58'];
      paths.forEach((p) => {
        walk(p.pts, 6, (x, y, a) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
          ctx.fillRect(-2.6, -pw / 2, 5.2, pw);
          ctx.fillStyle = 'rgba(70,40,15,0.35)';
          ctx.fillRect(2.1, -pw / 2, 0.9, pw);
          ctx.fillStyle = 'rgba(60,40,20,0.55)';
          ctx.fillRect(-0.8, -pw / 2 + 3, 1.4, 1.4);
          ctx.fillRect(-0.8, pw / 2 - 4.4, 1.4, 1.4);
          ctx.restore();
        });
      });
      paths.forEach((p) => {
        [-1, 1].forEach((s) => strokePoly(ctx, offsetPts(p.pts, s * (pw / 2 + 1)), 3, '#4a301a'));
        walk(p.pts, 54, (x, y, a) => {
          [-1, 1].forEach((s) => {
            const px = x + Math.cos(a + Math.PI / 2) * s * (pw / 2 + 2), py = y + Math.sin(a + Math.PI / 2) * s * (pw / 2 + 2);
            D.circlePath(ctx, px, py, 3.6);
            D.fs(ctx, '#7a5634', OL, 1);
          });
        });
        // sand blown onto the planks
        walk(p.pts, 26, (x, y) => {
          if (rnd() < 0.5) {
            D.blobPath(ctx, x + (rnd() - 0.5) * pw * 0.7, y + (rnd() - 0.5) * pw * 0.7, 3 + rnd() * 4, 6, 0.4, rnd);
            D.fs(ctx, 'rgba(240,215,150,0.75)');
          }
        });
      });
    },
  };

  THEMES.desert = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.lin(ctx, 0, 0, W, H, [[0, '#f0c27a'], [1, '#d39650']]);
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, rnd, 90, ['#e8b064', '#c98a46'], 30, 70, 0.22);
      // dune ripples
      for (let i = 0; i < 70; i++) {
        const x0 = rnd() * W - 60, y0 = rnd() * H, len = 80 + rnd() * 160, amp = 3 + rnd() * 4, ph = rnd() * 6;
        for (const [dy, col, lw] of [[0, 'rgba(160,90,35,0.2)', 2], [2.2, 'rgba(255,236,190,0.32)', 1.4]]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.beginPath();
          for (let k = 0; k <= 24; k++) {
            const x = x0 + (k / 24) * len, y = y0 + dy + Math.sin(ph + k * 0.45) * amp;
            if (k) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
      }
      speckle(ctx, rnd, 500, ['#b97a3c', '#ffe0a8', '#e0a35a'], 1.5, 4, 0.45);
    },
    // old sandstone road
    path(ctx, paths, pw, rnd) {
      shadowPass(ctx, paths, pw + 14, 'rgba(110,60,20,0.25)', 3);
      shadowPass(ctx, paths, pw + 8, '#8f6634');
      shadowPass(ctx, paths, pw, '#dcc08a');
      paths.forEach((p) => {
        strokePoly(ctx, p.pts, 1.2, 'rgba(120,80,35,0.55)');
        let k = 0;
        walk(p.pts, 14, (x, y, a) => {
          k++;
          const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
          const s0 = k % 2 ? 0 : -pw / 2 + 1, s1 = k % 2 ? pw / 2 - 1 : 0;
          ctx.strokeStyle = 'rgba(120,80,35,0.55)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + nx * s0, y + ny * s0);
          ctx.lineTo(x + nx * s1, y + ny * s1);
          ctx.stroke();
          // weathered block shading
          if (rnd() < 0.35) {
            const o = (rnd() - 0.5) * pw * 0.6;
            D.ellipsePath(ctx, x + nx * o, y + ny * o, 4 + rnd() * 3, 2.5, a);
            D.fs(ctx, rnd() > 0.5 ? 'rgba(255,240,200,0.35)' : 'rgba(150,100,50,0.25)');
          }
        });
        walk(p.pts, 34, (x, y, a) => {
          if (rnd() < 0.55) {
            const s = rnd() > 0.5 ? 1 : -1;
            const o = s * pw * (0.3 + rnd() * 0.2);
            D.blobPath(ctx, x + Math.cos(a + Math.PI / 2) * o, y + Math.sin(a + Math.PI / 2) * o, 5 + rnd() * 6, 7, 0.35, rnd);
            D.fs(ctx, 'rgba(236,190,118,0.85)');
          }
        });
      });
    },
  };

  THEMES.snow = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.lin(ctx, 0, 0, W, H, [[0, '#f6fafe'], [1, '#d8e5f1']]);
      ctx.fillRect(0, 0, W, H);
      // soft drifts
      for (let i = 0; i < 46; i++) {
        const x = rnd() * W, y = rnd() * H, r = 30 + rnd() * 60;
        D.ellipsePath(ctx, x, y + r * 0.18, r, r * 0.42, 0);
        D.fs(ctx, 'rgba(120,150,195,0.10)');
        D.ellipsePath(ctx, x - r * 0.1, y, r * 0.9, r * 0.36, 0);
        D.fs(ctx, 'rgba(255,255,255,0.55)');
      }
      speckle(ctx, rnd, 400, ['#c7d7e8', '#ffffff', '#b3c7dd'], 2, 5, 0.45);
      // sparkles
      for (let i = 0; i < 220; i++) {
        const x = rnd() * W, y = rnd() * H, s = 1 + rnd() * 1.6;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.lineTo(x + s, y);
        ctx.moveTo(x, y - s);
        ctx.lineTo(x, y + s);
        ctx.stroke();
      }
    },
    // trodden snow trail with sled tracks
    path(ctx, paths, pw, rnd) {
      shadowPass(ctx, paths, pw + 14, 'rgba(70,100,150,0.18)', 3);
      shadowPass(ctx, paths, pw + 6, '#aabfd2');
      shadowPass(ctx, paths, pw, '#e1ebf3');
      shadowPass(ctx, paths, pw * 0.5, 'rgba(255,255,255,0.55)');
      paths.forEach((p) => {
        [-1, 1].forEach((s) => strokePoly(ctx, offsetPts(p.pts, s * pw * 0.22), 2.4, 'rgba(110,140,175,0.45)'));
        let side = 1;
        walk(p.pts, 11, (x, y, a) => {
          side = -side;
          const o = side * 5 + (rnd() - 0.5) * 3;
          D.ellipsePath(ctx, x + Math.cos(a + Math.PI / 2) * o, y + Math.sin(a + Math.PI / 2) * o, 3, 1.8, a);
          D.fs(ctx, 'rgba(130,160,200,0.4)');
        });
      });
    },
  };

  THEMES.city = {
    ground(ctx, rnd) {
      ctx.fillStyle = '#b8bcc5';
      ctx.fillRect(0, 0, W, H);
      const T = 40;
      for (let y = 0; y < H; y += T) {
        for (let x = 0; x < W; x += T) {
          const v = (rnd() - 0.5) * 0.08;
          ctx.fillStyle = D.shade('#c3c7cf', v);
          ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
        }
      }
      ctx.strokeStyle = 'rgba(80,85,95,0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += T) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += T) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      speckle(ctx, rnd, 70, ['#8d929c', '#6e737c'], 6, 18, 0.16);
      // cracks
      for (let i = 0; i < 24; i++) {
        let x = rnd() * W, y = rnd() * H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += (rnd() - 0.5) * 18;
          y += (rnd() - 0.5) * 18;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(60,64,72,0.35)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
      // chewing gum & manholes
      for (let i = 0; i < 40; i++) {
        D.circlePath(ctx, rnd() * W, rnd() * H, 1.4 + rnd());
        D.fs(ctx, 'rgba(70,74,82,0.35)');
      }
      for (let i = 0; i < 6; i++) {
        const x = 30 + rnd() * (W - 60), y = 30 + rnd() * (H - 60);
        D.circlePath(ctx, x, y, 10);
        D.fs(ctx, '#6c717b', OL, 1);
        ctx.strokeStyle = 'rgba(30,30,35,0.5)';
        ctx.lineWidth = 1;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(x - 7, y + k * 3);
          ctx.lineTo(x + 7, y + k * 3);
          ctx.stroke();
        }
      }
    },
    // asphalt street with curbs and lane markings
    path(ctx, paths, pw, rnd) {
      shadowPass(ctx, paths, pw + 16, 'rgba(0,0,0,0.25)', 3);
      shadowPass(ctx, paths, pw + 12, '#e4e6ea');
      shadowPass(ctx, paths, pw + 5, '#70747c');
      shadowPass(ctx, paths, pw, '#3b3e45');
      paths.forEach((p) => {
        walk(p.pts, 5, (x, y) => {
          if (rnd() < 0.7) {
            D.circlePath(ctx, x + (rnd() - 0.5) * pw * 0.9, y + (rnd() - 0.5) * pw * 0.9, 0.6 + rnd() * 1.2);
            D.fs(ctx, rnd() > 0.5 ? 'rgba(120,124,132,0.6)' : 'rgba(20,22,26,0.6)');
          }
        });
        [-1, 1].forEach((s) => strokePoly(ctx, offsetPts(p.pts, s * (pw / 2 - 4)), 1.6, 'rgba(255,255,255,0.75)'));
        ctx.save();
        ctx.setLineDash([14, 12]);
        poly(ctx, p.pts);
        ctx.strokeStyle = '#ffd83a';
        ctx.lineWidth = 2.6;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
        // oil stains
        walk(p.pts, 90, (x, y) => {
          D.blobPath(ctx, x + (rnd() - 0.5) * pw * 0.5, y + (rnd() - 0.5) * pw * 0.5, 4 + rnd() * 4, 7, 0.3, rnd);
          D.fs(ctx, 'rgba(10,10,14,0.35)');
        });
      });
    },
  };

  THEMES.factory = {
    ground(ctx, rnd) {
      ctx.fillStyle = '#7d838c';
      ctx.fillRect(0, 0, W, H);
      const T = 120;
      for (let y = 0; y < H; y += T) {
        for (let x = 0; x < W; x += T) {
          const v = (rnd() - 0.5) * 0.08;
          ctx.fillStyle = D.lin(ctx, x, y, x + T, y + T, [[0, D.shade('#8f969f', v)], [1, D.shade('#7a8089', v)]]);
          ctx.fillRect(x + 1.5, y + 1.5, T - 3, T - 3);
          if (rnd() < 0.3) {
            // diamond plate panel
            ctx.save();
            ctx.beginPath();
            ctx.rect(x + 4, y + 4, T - 8, T - 8);
            ctx.clip();
            ctx.fillStyle = 'rgba(160,168,178,0.5)';
            ctx.fillRect(x + 4, y + 4, T - 8, T - 8);
            for (let yy = y + 4; yy < y + T; yy += 10) {
              for (let xx = x + 4 + ((yy / 10) % 2) * 5; xx < x + T; xx += 10) {
                ctx.save();
                ctx.translate(xx, yy);
                ctx.rotate(((xx + yy) / 10) % 2 ? 0.7 : -0.7);
                ctx.fillStyle = 'rgba(220,226,232,0.6)';
                ctx.fillRect(-3, -0.8, 6, 1.6);
                ctx.restore();
              }
            }
            ctx.restore();
          }
          [[x + 8, y + 8], [x + T - 8, y + 8], [x + 8, y + T - 8], [x + T - 8, y + T - 8]].forEach(([bx, by]) => {
            D.circlePath(ctx, bx, by, 2);
            D.fs(ctx, '#a9b0b9', 'rgba(0,0,0,0.4)', 0.6);
          });
        }
      }
      // oil stains
      for (let i = 0; i < 26; i++) {
        D.blobPath(ctx, rnd() * W, rnd() * H, 6 + rnd() * 16, 9, 0.35, rnd);
        D.fs(ctx, 'rgba(25,25,30,0.18)');
      }
      // yellow safety lines
      ctx.strokeStyle = 'rgba(255,201,40,0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 10]);
      ctx.strokeRect(10, 10, W - 20, H - 20);
      ctx.setLineDash([]);
    },
    // conveyor belt the enemies ride on
    path(ctx, paths, pw, rnd) {
      shadowPass(ctx, paths, pw + 18, 'rgba(0,0,0,0.3)', 4);
      shadowPass(ctx, paths, pw + 12, '#3a3f46');
      shadowPass(ctx, paths, pw + 8, '#a6aeb8');
      shadowPass(ctx, paths, pw + 1, '#4a5058');
      shadowPass(ctx, paths, pw - 4, '#26292e');
      paths.forEach((p) => {
        walk(p.pts, 7, (x, y, a) => {
          const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2), h = pw / 2 - 3;
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = 'rgba(0,0,0,0.55)';
          ctx.beginPath();
          ctx.moveTo(x - nx * h, y - ny * h);
          ctx.lineTo(x + nx * h, y + ny * h);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.beginPath();
          ctx.moveTo(x - nx * h + Math.cos(a) * 1.5, y - ny * h + Math.sin(a) * 1.5);
          ctx.lineTo(x + nx * h + Math.cos(a) * 1.5, y + ny * h + Math.sin(a) * 1.5);
          ctx.stroke();
        });
        walk(p.pts, 46, (x, y, a) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(-6, -11);
          ctx.lineTo(5, 0);
          ctx.lineTo(-6, 11);
          ctx.strokeStyle = 'rgba(255,201,40,0.6)';
          ctx.lineWidth = 4;
          ctx.lineJoin = 'miter';
          ctx.stroke();
          ctx.restore();
        });
        walk(p.pts, 20, (x, y, a) => {
          [-1, 1].forEach((s) => {
            const o = s * (pw / 2 + 2);
            D.circlePath(ctx, x + Math.cos(a + Math.PI / 2) * o, y + Math.sin(a + Math.PI / 2) * o, 2.2);
            D.fs(ctx, '#dfe5ea', 'rgba(0,0,0,0.5)', 0.7);
          });
        });
      });
    },
  };

  // ================================================================ WATER
  WATER.sea = (ctx, wa, rnd) => {
    const pts = MT.Path.smooth(wa.pts, 6).map(([x, y]) => ({ x, y }));
    const top = -wa.width / 2;
    const band = (off, fill, wob = 0, ph = 0) => {
      ctx.beginPath();
      pts.forEach((p, i) => {
        const y = p.y + off + Math.sin(p.x * 0.05 + ph) * wob;
        if (i) ctx.lineTo(p.x, y);
        else ctx.moveTo(p.x, y);
      });
      ctx.lineTo(W + 60, H + 80);
      ctx.lineTo(-60, H + 80);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };
    band(top - 26, 'rgba(170,125,60,0.28)', 3, 1);
    band(top - 12, 'rgba(150,105,50,0.25)', 3, 2);
    // scalloped foam line
    walk(pts, 9, (x, y) => {
      D.circlePath(ctx, x, y + top + 1 + Math.sin(x * 0.05) * 3, 6 + rnd() * 3);
      D.fs(ctx, 'rgba(255,255,255,0.9)');
    });
    band(top + 3, D.lin(ctx, 0, pts[0].y + top, 0, H, [[0, '#7fe3ea'], [1, '#4cc6dc']]), 3);
    band(top + 26, '#33afd0', 4, 1.5);
    band(top + 58, '#1f8bbd', 5, 3);
    // wave crests and sparkles
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 40; i++) {
      const x = rnd() * W, p = pts.reduce((b, q) => (Math.abs(q.x - x) < Math.abs(b.x - x) ? q : b));
      const y = p.y + top + 16 + rnd() * (wa.width - 8);
      if (y > H) continue;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(x, y, 6 + rnd() * 5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    // a lost pool float
    const fx = 160 + rnd() * (W - 320), fp = pts.reduce((b, q) => (Math.abs(q.x - fx) < Math.abs(b.x - fx) ? q : b));
    const fy = fp.y + 6;
    D.shadow(ctx, fx + 3, fy + 4, 15, 6, 0.25);
    D.circlePath(ctx, fx, fy, 12);
    ctx.save();
    ctx.clip();
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.arc(fx, fy, 14, (k / 8) * 6.28, ((k + 1) / 8) * 6.28);
      ctx.closePath();
      ctx.fillStyle = k % 2 ? '#ffffff' : '#ff5252';
      ctx.fill();
    }
    ctx.restore();
    D.circlePath(ctx, fx, fy, 12);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    D.circlePath(ctx, fx, fy, 5.5);
    D.fs(ctx, '#33afd0', OL, 1.2);
  };

  WATER.icelake = (ctx, wa, rnd) => {
    const seed = Math.floor(wa.x * 11 + wa.y * 3);
    D.blobPath(ctx, wa.x, wa.y + 4, wa.r + 14, 11, 0.1, D.rng(seed));
    D.fs(ctx, 'rgba(110,140,190,0.25)');
    D.blobPath(ctx, wa.x, wa.y, wa.r + 12, 11, 0.1, D.rng(seed));
    ctx.fillStyle = D.lin(ctx, 0, wa.y - wa.r, 0, wa.y + wa.r, [[0, '#ffffff'], [1, '#d6e6f4']]);
    ctx.fill();
    // ice shelf
    D.blobPath(ctx, wa.x, wa.y, wa.r + 3, 11, 0.12, D.rng(seed + 1));
    D.fs(ctx, '#cdeefa', '#8cc3dd', 1.4);
    // open water
    D.blobPath(ctx, wa.x, wa.y, wa.r - 6, 10, 0.12, D.rng(seed + 2));
    ctx.fillStyle = D.rad(ctx, wa.x - wa.r * 0.3, wa.y - wa.r * 0.3, 2, wa.x, wa.y, wa.r, [[0, '#6fcbea'], [0.6, '#2f8fbf'], [1, '#1b5f8f']]);
    ctx.fill();
    ctx.strokeStyle = '#2a6f99';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // floating floes
    for (let i = 0; i < 5; i++) {
      const a = rnd() * 6.28, rr = wa.r * (0.35 + rnd() * 0.4);
      const x = wa.x + Math.cos(a) * rr, y = wa.y + Math.sin(a) * rr;
      D.blobPath(ctx, x, y + 1.5, 4 + rnd() * 5, 5, 0.35, D.rng(seed + 10 + i));
      D.fs(ctx, 'rgba(20,60,100,0.35)');
      D.blobPath(ctx, x, y, 4 + rnd() * 5, 5, 0.35, D.rng(seed + 10 + i));
      D.fs(ctx, '#f4fbff', '#9fd0ea', 1);
    }
    // cracks in the shelf
    ctx.strokeStyle = 'rgba(120,180,215,0.8)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 7; i++) {
      const a = rnd() * 6.28;
      let x = wa.x + Math.cos(a) * (wa.r - 4), y = wa.y + Math.sin(a) * (wa.r - 4);
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 2; k++) {
        x += Math.cos(a) * 5 + (rnd() - 0.5) * 5;
        y += Math.sin(a) * 5 + (rnd() - 0.5) * 5;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    D.ellipsePath(ctx, wa.x - wa.r * 0.3, wa.y - wa.r * 0.35, wa.r * 0.25, wa.r * 0.08, -0.4);
    D.fs(ctx, 'rgba(255,255,255,0.45)');
  };

  WATER.fountain = (ctx, wa, rnd) => {
    const { x, y, r } = wa;
    D.shadow(ctx, x + 4, y + 8, r + 14, (r + 14) * 0.8, 0.3);
    D.circlePath(ctx, x, y, r + 9);
    ctx.fillStyle = D.lin(ctx, x - r, y - r, x + r, y + r, [[0, '#e3e5ea'], [1, '#9599a3']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // rim stones
    ctx.strokeStyle = 'rgba(70,74,84,0.45)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 6.28;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a) * (r + 9), y + Math.sin(a) * (r + 9));
      ctx.stroke();
    }
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.3, y - r * 0.3, 2, x, y, r, [[0, '#a9ecff'], [0.6, '#4fb6e4'], [1, '#2d86bb']]);
    ctx.fill();
    ctx.strokeStyle = '#25597a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // wishing coins
    for (let i = 0; i < 8; i++) {
      const a = rnd() * 6.28, rr = r * (0.35 + rnd() * 0.5);
      D.ellipsePath(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.2, 1.6, rnd());
      D.fs(ctx, 'rgba(255,214,64,0.8)');
    }
    // ripples
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.3;
    [0.45, 0.68, 0.88].forEach((f, i) => {
      ctx.beginPath();
      ctx.arc(x, y, r * f, 0.2 + i, 1.6 + i);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r * f, 3.4 + i, 4.6 + i);
      ctx.stroke();
    });
    // pedestal with a golden banana statue
    D.circlePath(ctx, x, y, r * 0.24);
    D.fs(ctx, '#c9ccd3', OL, 1.4);
    TP().banana(ctx, x, y - 3, 0.9, -0.5, '#ffca28');
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * 6.28;
      D.circlePath(ctx, x + Math.cos(a) * r * 0.38, y + Math.sin(a) * r * 0.38, 1.4);
      D.fs(ctx, 'rgba(255,255,255,0.85)');
    }
  };

  // ================================================================ DECOR
  // ---- beach
  DEC.umbrella = (ctx, d, rnd) => {
    const r = (d.r || 24) * (d.s || 1);
    const pal = [['#ff5252', '#ffffff'], ['#1e88e5', '#ffd83a'], ['#43a047', '#ffffff'], ['#ab47bc', '#ffd83a']][Math.floor(rnd() * 4)];
    // towel peeking out underneath
    ctx.save();
    ctx.translate(d.x + r * 0.5, d.y + r * 0.55);
    ctx.rotate(0.3);
    D.rrPath(ctx, -r * 0.45, -r * 0.8, r * 0.9, r * 1.4, 2);
    D.fs(ctx, pal[1] === '#ffffff' ? '#ffd83a' : '#ffffff', OL, 1);
    ctx.restore();
    D.shadow(ctx, d.x + r * 0.45, d.y + r * 0.5, r * 1.05, r * 0.8, 0.35);
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.arc(d.x, d.y, r, (k / 8) * 6.28, ((k + 1) / 8) * 6.28);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, d.x - r, d.y - r, d.x + r, d.y + r, [[0, D.shade(pal[k % 2], 0.15)], [1, D.shade(pal[k % 2], -0.15)]]);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + Math.cos((k / 8) * 6.28) * r, d.y + Math.sin((k / 8) * 6.28) * r);
      ctx.stroke();
    }
    D.circlePath(ctx, d.x, d.y, r);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.circlePath(ctx, d.x, d.y, 2.6);
    D.fs(ctx, '#795548', OL, 1);
  };

  DEC.sandcastle = (ctx, d) => {
    const x = d.x, y = d.y, sand = '#e0bd76', top = '#f2d596';
    D.shadow(ctx, x + 6, y + 16, 38, 12, 0.3);
    D.blobPath(ctx, x, y + 8, 30, 9, 0.12, D.rng(77));
    D.fs(ctx, '#d7b06a', OL, 1.2);
    cylinder(ctx, x - 16, y - 2, 13, 18, sand, top);
    cylinder(ctx, x + 16, y - 2, 13, 18, sand, top);
    // keep
    ctx.beginPath();
    ctx.rect(x - 12, y - 22, 24, 26);
    ctx.fillStyle = D.lin(ctx, x - 12, 0, x + 12, 0, [[0, '#f0cf8c'], [1, '#c79a52']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = top;
      ctx.fillRect(x - 12 + i * 7, y - 26, 4, 4);
      ctx.strokeRect(x - 12 + i * 7, y - 26, 4, 4);
    }
    ctx.beginPath();
    ctx.arc(x, y + 4, 5, Math.PI, 0);
    ctx.lineTo(x + 5, y + 4);
    ctx.closePath();
    D.fs(ctx, '#6d4c2f');
    cylinder(ctx, x - 20, y + 12, 12, 14, sand, top);
    cylinder(ctx, x + 20, y + 12, 12, 14, sand, top);
    // banana flag
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y - 26);
    ctx.lineTo(x, y - 44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 44);
    ctx.lineTo(x + 13, y - 40);
    ctx.lineTo(x, y - 36);
    ctx.closePath();
    D.fs(ctx, '#ffd83a', OL, 1);
    // bucket + spade
    D.rrPath(ctx, x + 26, y - 18, 10, 11, 2);
    D.fs(ctx, '#e53935', OL, 1.1);
    D.ellipsePath(ctx, x + 31, y - 18, 5.5, 2);
    D.fs(ctx, '#ff8a80', OL, 0.9);
  };

  DEC.lifeguard = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 16, y + 18, 34, 10, 0.3);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3.4;
    [[-14, 20], [14, 20], [-10, 12], [10, 12]].forEach(([lx, ly]) => {
      ctx.beginPath();
      ctx.moveTo(x + lx * 0.7, y - 10);
      ctx.lineTo(x + lx, y + ly);
      ctx.stroke();
    });
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = 2;
    [[-14, 20], [14, 20], [-10, 12], [10, 12]].forEach(([lx, ly]) => {
      ctx.beginPath();
      ctx.moveTo(x + lx * 0.7, y - 10);
      ctx.lineTo(x + lx, y + ly);
      ctx.stroke();
    });
    // ladder rungs
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 2 + i * 6);
      ctx.lineTo(x + 6, y - 2 + i * 6);
      ctx.stroke();
    }
    D.rrPath(ctx, x - 16, y - 16, 32, 8, 2);
    D.fs(ctx, '#ffffff', OL, 1.4);
    // chair
    D.rrPath(ctx, x - 12, y - 38, 24, 22, 3);
    ctx.fillStyle = D.lin(ctx, x - 12, 0, x + 12, 0, [[0, '#ff6f60'], [1, '#c62828']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2.5, y - 34, 5, 14);
    ctx.fillRect(x - 7, y - 29.5, 14, 5);
    // life ring
    D.circlePath(ctx, x + 19, y - 4, 7);
    D.fs(ctx, '#ff5252', OL, 1.1);
    D.circlePath(ctx, x + 19, y - 4, 3);
    D.fs(ctx, '#e8c983', OL, 0.9);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 19, y - 4, 5, -0.4, 0.4);
    ctx.moveTo(x + 19 + Math.cos(2.7) * 5, y - 4 + Math.sin(2.7) * 5);
    ctx.arc(x + 19, y - 4, 5, 2.7, 3.5);
    ctx.stroke();
  };

  DEC.towel = (ctx, d, rnd) => {
    const r = d.r || 22;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate((rnd() - 0.5) * 0.8);
    D.rrPath(ctx, -r * 0.55 + 2, -r + 3, r * 1.1, r * 2, 3);
    D.fs(ctx, 'rgba(120,80,30,0.2)');
    D.rrPath(ctx, -r * 0.55, -r, r * 1.1, r * 2, 3);
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#1e88e5' : '#ffd83a';
      ctx.fillRect(-r, -r + i * (r / 4), r * 2, r / 4);
    }
    ctx.restore();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // sunglasses + a banana snack
    ctx.fillStyle = '#1b1b1b';
    D.circlePath(ctx, -4, -r * 0.45, 3.4);
    ctx.fill();
    D.circlePath(ctx, 4, -r * 0.45, 3.4);
    ctx.fill();
    ctx.fillRect(-1, -r * 0.45 - 0.7, 2, 1.4);
    TP().banana(ctx, 2, r * 0.35, 0.55, 0.6, '#ffe14a');
    ctx.restore();
  };

  DEC.shell = (ctx, d, rnd) => {
    const s = (d.s || 1) * 6;
    const col = ['#ffccbc', '#f8bbd0', '#fff3e0', '#ffe0b2'][Math.floor(rnd() * 4)];
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate((rnd() - 0.5) * 1.5);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.8);
    ctx.arc(0, 0, s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.closePath();
    D.fs(ctx, col, '#8d6e63', 0.9);
    ctx.strokeStyle = 'rgba(141,110,99,0.7)';
    ctx.lineWidth = 0.7;
    for (let k = 1; k < 5; k++) {
      const a = Math.PI * (1.1 + k * 0.16);
      ctx.beginPath();
      ctx.moveTo(0, s * 0.8);
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.stroke();
    }
    ctx.restore();
  };

  DEC.starfish = (ctx, d, rnd) => {
    const s = (d.s || 1) * 7.5;
    const rot = rnd() * 6.28;
    D.starPath(ctx, d.x + 1, d.y + 1.5, 5, s, s * 0.42, rot);
    D.fs(ctx, 'rgba(120,70,20,0.25)');
    D.starPath(ctx, d.x, d.y, 5, s, s * 0.42, rot);
    ctx.fillStyle = D.rad(ctx, d.x, d.y, 0, d.x, d.y, s, [[0, '#ffb74d'], [1, '#f4511e']]);
    ctx.fill();
    ctx.strokeStyle = '#8d3a12';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    for (let k = 0; k < 5; k++) {
      const a = rot + (k / 5) * 6.28;
      D.circlePath(ctx, d.x + Math.cos(a) * s * 0.5, d.y + Math.sin(a) * s * 0.5, 0.8);
      D.fs(ctx, '#ffe0b2');
    }
  };

  DEC.beachrock = (ctx, d, rnd) => DEC.rock(ctx, Object.assign({}, d, { pal: ['#a1887f', '#cbb7ab', '#6d5a50'] }), rnd);

  // ---- desert
  DEC.pyramid = (ctx, d) => {
    const x = d.x, y = d.y, r = d.r;
    const L = { x: x - r, y: y + r * 0.42 }, F = { x: x + r * 0.12, y: y + r * 0.66 }, R = { x: x + r, y: y + r * 0.34 }, T = { x, y: y - r * 0.82 };
    D.shadow(ctx, x + r * 0.55, y + r * 0.45, r * 1.25, r * 0.4, 0.35);
    const face = (a, b, cols) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(T.x, T.y);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, a.x, a.y, T.x, T.y, cols);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // stone courses
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(110,70,30,0.35)';
      ctx.lineWidth = 1;
      for (let k = 1; k < 9; k++) {
        const t = k / 9;
        ctx.beginPath();
        ctx.moveTo(a.x + (T.x - a.x) * t, a.y + (T.y - a.y) * t);
        ctx.lineTo(b.x + (T.x - b.x) * t, b.y + (T.y - b.y) * t);
        ctx.stroke();
      }
      ctx.restore();
    };
    face(L, F, [[0, '#c98d45'], [1, '#e2ac62']]);
    face(F, R, [[0, '#f6d38f'], [1, '#ffe9b8']]);
    // golden cap
    const cap = 0.18;
    ctx.beginPath();
    ctx.moveTo(T.x + (L.x - T.x) * cap, T.y + (L.y - T.y) * cap);
    ctx.lineTo(T.x + (F.x - T.x) * cap, T.y + (F.y - T.y) * cap);
    ctx.lineTo(T.x + (R.x - T.x) * cap, T.y + (R.y - T.y) * cap);
    ctx.lineTo(T.x, T.y);
    ctx.closePath();
    D.fs(ctx, '#ffd54f', OL, 1.3);
    // door with a banana glyph
    const dx = x + r * 0.3, dy = y + r * 0.44;
    ctx.beginPath();
    ctx.moveTo(dx - r * 0.09, dy + r * 0.08);
    ctx.lineTo(dx - r * 0.09, dy - r * 0.1);
    ctx.lineTo(dx, dy - r * 0.18);
    ctx.lineTo(dx + r * 0.09, dy - r * 0.12);
    ctx.lineTo(dx + r * 0.09, dy + r * 0.03);
    ctx.closePath();
    D.fs(ctx, '#3e2a16', OL, 1.1);
    TP().banana(ctx, x + r * 0.55, y + r * 0.08, r * 0.012, -0.3, '#a56a28');
  };

  DEC.bones = (ctx, d) => {
    const x = d.x, y = d.y, bone = '#efe6d2';
    D.shadow(ctx, x + 3, y + 6, 26, 8, 0.22);
    ctx.strokeStyle = OL;
    ctx.lineCap = 'round';
    const line = (pts, w) => {
      for (const [lw, col] of [[w + 2, OL], [w, bone]]) {
        ctx.lineWidth = lw;
        ctx.strokeStyle = col;
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
      }
    };
    line([[x - 18, y + 2], [x - 4, y - 2], [x + 10, y], [x + 22, y + 4]], 3);
    for (let i = 0; i < 4; i++) {
      const rx = x - 10 + i * 6;
      line([[rx, y - 1], [rx - 3, y - 9 + i], [rx + 1, y - 13 + i]], 2);
      line([[rx, y - 1], [rx - 3, y + 7 - i], [rx + 1, y + 11 - i]], 2);
    }
    D.ellipsePath(ctx, x - 22, y + 2, 7, 5.5, -0.2);
    D.fs(ctx, bone, OL, 1.3);
    D.circlePath(ctx, x - 24, y + 1, 1.8);
    D.fs(ctx, OL);
    D.circlePath(ctx, x - 20, y, 1.8);
    D.fs(ctx, OL);
  };

  DEC.cactus = (ctx, d, rnd) => {
    const s = (d.s || 1) * ((d.r || 16) / 16);
    const x = d.x, y = d.y + 8 * s;
    D.shadow(ctx, x + 10 * s, y + 2, 16 * s, 5 * s, 0.3);
    const g = (x0, w) => D.lin(ctx, x0 - w / 2, 0, x0 + w / 2, 0, [[0, '#7cc576'], [0.5, '#43a047'], [1, '#2e7031']]);
    const arm = (dir, h0, len) => {
      ctx.beginPath();
      ctx.moveTo(x + dir * 4 * s, y - h0 * s);
      ctx.lineTo(x + dir * 12 * s, y - h0 * s);
      ctx.lineTo(x + dir * 12 * s, y - (h0 + len) * s);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 8 * s;
      ctx.strokeStyle = OL;
      ctx.stroke();
      ctx.lineWidth = 6 * s;
      ctx.strokeStyle = '#4caf50';
      ctx.stroke();
    };
    const lh = 12 + rnd() * 6;
    arm(-1, lh, 10);
    if (rnd() > 0.3) arm(1, lh + 6, 9);
    D.capsulePath(ctx, x, y - 17 * s, 11 * s, 34 * s);
    ctx.fillStyle = g(x, 11 * s);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20,70,25,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 1.8 * s, y - 30 * s);
    ctx.lineTo(x - 1.8 * s, y - 2);
    ctx.moveTo(x + 1.8 * s, y - 30 * s);
    ctx.lineTo(x + 1.8 * s, y - 2);
    ctx.stroke();
    if (rnd() > 0.4) {
      D.starPath(ctx, x, y - 34 * s, 5, 3.4 * s, 1.6 * s);
      D.fs(ctx, '#ff6f91', OL, 0.8);
    }
  };

  DEC.desertrock = (ctx, d, rnd) => DEC.rock(ctx, Object.assign({}, d, { pal: ['#c48a52', '#e7b884', '#8a5a30'] }), rnd);

  // ---- arctic
  DEC.igloo = (ctx, d) => {
    const x = d.x, y = d.y, r = d.r;
    D.shadow(ctx, x + r * 0.3, y + r * 0.42, r * 1.15, r * 0.4, 0.3);
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.35, r, r * 0.32, 0, 0, Math.PI);
    ctx.ellipse(x, y + r * 0.35, r, r * 1.05, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, x - r * 0.35, y - r * 0.3, 2, x, y, r * 1.2, [[0, '#ffffff'], [0.7, '#dbeaf6'], [1, '#a9c4dc']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(110,145,180,0.55)';
    ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
      const yy = y + r * 0.35 - r * 1.05 * Math.sin((k / 5) * Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(x - r, yy);
      ctx.lineTo(x + r, yy);
      ctx.stroke();
      const n = 6 - k;
      for (let j = 0; j <= n; j++) {
        const jx = x - r + ((j + (k % 2) * 0.5) / n) * 2 * r;
        ctx.beginPath();
        ctx.moveTo(jx, yy);
        ctx.lineTo(jx, yy + r * 0.2);
        ctx.stroke();
      }
    }
    ctx.restore();
    // entrance tunnel
    ctx.beginPath();
    ctx.moveTo(x - r * 0.38, y + r * 0.62);
    ctx.lineTo(x - r * 0.38, y + r * 0.2);
    ctx.arc(x, y + r * 0.2, r * 0.38, Math.PI, 0);
    ctx.lineTo(x + r * 0.38, y + r * 0.62);
    ctx.closePath();
    D.fs(ctx, '#eef5fb', OL, 1.5);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.22, y + r * 0.62);
    ctx.lineTo(x - r * 0.22, y + r * 0.32);
    ctx.arc(x, y + r * 0.32, r * 0.22, Math.PI, 0);
    ctx.lineTo(x + r * 0.22, y + r * 0.62);
    ctx.closePath();
    D.fs(ctx, '#23303d');
  };

  DEC.snowman = (ctx, d) => {
    const x = d.x, y = d.y + 10;
    D.shadow(ctx, x + 6, y + 8, 18, 6, 0.28);
    [[0, 12], [-15, 9], [-27, 7]].forEach(([dy, r]) => {
      D.circlePath(ctx, x, y + dy, r);
      ctx.fillStyle = D.rad(ctx, x - r * 0.35, y + dy - r * 0.35, 1, x, y + dy, r, [[0, '#ffffff'], [1, '#c8d8e8']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
    });
    // minion goggle
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(x - 7, y - 29, 14, 2.4);
    D.circlePath(ctx, x, y - 28, 4.4);
    D.fs(ctx, '#9e9e9e', OL, 1);
    D.circlePath(ctx, x, y - 28, 2.8);
    D.fs(ctx, '#fff');
    D.circlePath(ctx, x + 0.6, y - 28, 1.3);
    D.fs(ctx, '#5d4037');
    // carrot
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 24.5);
    ctx.lineTo(x + 9, y - 23);
    ctx.lineTo(x + 1, y - 22);
    ctx.closePath();
    D.fs(ctx, '#ff8f00', OL, 0.8);
    // buttons + stick arms
    [-17, -12].forEach((by) => {
      D.circlePath(ctx, x, y + by, 1.3);
      D.fs(ctx, '#263238');
    });
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 15);
    ctx.lineTo(x - 18, y - 21);
    ctx.moveTo(x - 14, y - 19);
    ctx.lineTo(x - 16, y - 24);
    ctx.moveTo(x + 8, y - 15);
    ctx.lineTo(x + 18, y - 20);
    ctx.stroke();
    // beanie
    ctx.beginPath();
    ctx.arc(x, y - 31, 6.5, Math.PI, 0);
    ctx.closePath();
    D.fs(ctx, '#e53935', OL, 1);
    D.circlePath(ctx, x, y - 38, 2.2);
    D.fs(ctx, '#fff', OL, 0.8);
  };

  DEC.radar = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 10, y + 22, 36, 10, 0.32);
    D.rrPath(ctx, x - 24, y - 4, 48, 26, 3);
    ctx.fillStyle = D.lin(ctx, x - 24, 0, x + 24, 0, [[0, '#cfd8dc'], [1, '#78909c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    D.rrPath(ctx, x - 24, y - 8, 48, 6, 2);
    D.fs(ctx, '#f5f5f5', OL, 1.2);
    for (let i = 0; i < 3; i++) {
      D.rrPath(ctx, x - 18 + i * 13, y + 4, 8, 7, 1);
      D.fs(ctx, '#80deea', OL, 0.9);
    }
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y - 18);
    ctx.stroke();
    D.ellipsePath(ctx, x - 2, y - 26, 22, 12, -0.5);
    ctx.fillStyle = D.lin(ctx, x - 22, 0, x + 22, 0, [[0, '#ffffff'], [1, '#90a4ae']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    D.ellipsePath(ctx, x - 2, y - 26, 13, 6.5, -0.5);
    ctx.strokeStyle = 'rgba(70,90,110,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 26);
    ctx.lineTo(x + 6, y - 38);
    ctx.stroke();
    D.circlePath(ctx, x + 6, y - 38, 2.6);
    D.fs(ctx, '#ff1744', OL, 0.9);
  };

  DEC.pine = (ctx, d, rnd) => {
    const r = (d.r || 22) * (d.s || 1);
    D.shadow(ctx, d.x + r * 0.35, d.y + r * 0.35, r * 1.05, r * 0.65, 0.3);
    const rot = rnd() * 6.28;
    [[1, '#1f5e3a'], [0.74, '#2e7d4f'], [0.48, '#3f9a62']].forEach(([f, col], i) => {
      D.starPath(ctx, d.x, d.y - i * 2, 8, r * f, r * f * 0.66, rot + i * 0.4);
      D.fs(ctx, col, OL, i ? 0.9 : 1.4);
      // snow on the tips
      for (let k = 0; k < 8; k++) {
        const a = rot + i * 0.4 + (k / 8) * 6.28 - Math.PI / 2;
        D.circlePath(ctx, d.x + Math.cos(a) * r * f * 0.78, d.y - i * 2 + Math.sin(a) * r * f * 0.78, 1.8 + f * 1.6);
        D.fs(ctx, 'rgba(255,255,255,0.9)');
      }
    });
    D.circlePath(ctx, d.x, d.y - 6, r * 0.14);
    D.fs(ctx, '#ffffff');
  };

  DEC.icecrystal = (ctx, d, rnd) => {
    const s = (d.s || 1);
    D.shadow(ctx, d.x + 4, d.y + 6, 14 * s, 5 * s, 0.25);
    D.circlePath(ctx, d.x, d.y - 6, 16 * s);
    ctx.fillStyle = D.rad(ctx, d.x, d.y - 6, 0, d.x, d.y - 6, 16 * s, [[0, 'rgba(160,240,255,0.45)'], [1, 'rgba(160,240,255,0)']]);
    ctx.fill();
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.3 + (rnd() - 0.5) * 0.15;
      const len = (20 + rnd() * 12) * s, w = (4 + rnd() * 2) * s;
      ctx.save();
      ctx.translate(d.x + (i - (n - 1) / 2) * 3 * s, d.y + 4);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-w, -len * 0.2);
      ctx.lineTo(-w * 0.7, -len * 0.85);
      ctx.lineTo(0, -len);
      ctx.lineTo(w * 0.7, -len * 0.85);
      ctx.lineTo(w, -len * 0.2);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, -w, 0, w, 0, [[0, '#e0fbff'], [0.5, '#7fdcf5'], [1, '#3aa8d8']]);
      ctx.fill();
      ctx.strokeStyle = '#1d6d93';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -len * 0.2);
      ctx.lineTo(-w * 0.25, -len * 0.8);
      ctx.stroke();
      ctx.restore();
    }
  };

  DEC.snowrock = (ctx, d, rnd) => {
    DEC.rock(ctx, Object.assign({}, d, { pal: ['#8d97a3', '#b8c2cc', '#5f6973'] }), rnd);
    const r = (d.r || 14) * (d.s || 1);
    D.blobPath(ctx, d.x - r * 0.1, d.y - r * 0.35, r * 0.62, 7, 0.25, rnd);
    D.fs(ctx, '#ffffff', 'rgba(110,140,175,0.6)', 0.9);
  };

  // ---- city
  DEC.building = (ctx, d, rnd) => {
    const w = d.w || 100, h = d.h || 100, col = d.col || '#7e57c2';
    const x0 = d.x - w / 2, y0 = d.y - h / 2, fh = Math.min(26, h * 0.24);
    D.shadow(ctx, d.x + 12, d.y + h * 0.42, w * 0.72, 16, 0.35);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x0 + 8, y0 + 8, w, h);
    // facade
    ctx.fillStyle = D.lin(ctx, 0, y0 + h - fh, 0, y0 + h, [[0, D.shade(col, -0.1)], [1, D.shade(col, -0.35)]]);
    ctx.fillRect(x0, y0 + h - fh, w, fh);
    const cols = Math.max(2, Math.floor((w - 8) / 14));
    for (let i = 0; i < cols; i++) {
      const wx = x0 + 6 + i * ((w - 12) / cols);
      ctx.fillStyle = rnd() > 0.4 ? '#ffe082' : '#263b54';
      ctx.fillRect(wx + 1, y0 + h - fh + 5, (w - 12) / cols - 4, fh - 10);
    }
    if (w >= 80) {
      D.rrPath(ctx, d.x - 8, y0 + h - fh + 4, 16, fh - 4, 2);
      D.fs(ctx, '#3e2723');
    }
    // roof
    ctx.fillStyle = D.lin(ctx, x0, y0, x0 + w, y0 + h, [[0, '#6f7480'], [1, '#4f5460']]);
    ctx.fillRect(x0, y0, w, h - fh);
    ctx.strokeStyle = D.shade(col, -0.2);
    ctx.lineWidth = 5;
    ctx.strokeRect(x0 + 2.5, y0 + 2.5, w - 5, h - fh - 5);
    ctx.strokeStyle = D.shade(col, 0.25);
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 5, y0 + 5, w - 10, h - fh - 10);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x0, y0, w, h);
    ctx.beginPath();
    ctx.moveTo(x0, y0 + h - fh);
    ctx.lineTo(x0 + w, y0 + h - fh);
    ctx.stroke();
    // rooftop clutter
    const rw = w - 16, rh = h - fh - 16, rx = x0 + 8, ry = y0 + 8;
    const kind = Math.floor(rnd() * 3);
    if (w >= 90 && kind === 0) {
      // helipad
      const cx = rx + rw * 0.6, cy = ry + rh / 2, cr = Math.min(rw, rh) * 0.36;
      D.circlePath(ctx, cx, cy, cr);
      D.fs(ctx, '#3c4049', '#ffd83a', 2);
      ctx.fillStyle = '#ffd83a';
      ctx.font = `bold ${Math.round(cr * 1.1)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', cx, cy + 1);
    } else if (w >= 90 && kind === 1) {
      // water tower
      const cx = rx + rw * 0.65, cy = ry + rh * 0.5;
      D.circlePath(ctx, cx + 3, cy + 4, 14);
      D.fs(ctx, 'rgba(0,0,0,0.25)');
      D.circlePath(ctx, cx, cy, 14);
      ctx.fillStyle = D.lin(ctx, cx - 14, 0, cx + 14, 0, [[0, '#a1887f'], [1, '#5d4037']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy);
      ctx.lineTo(cx, cy - 10);
      ctx.lineTo(cx + 14, cy);
      ctx.strokeStyle = 'rgba(40,20,10,0.5)';
      ctx.stroke();
    } else {
      // skylight
      D.rrPath(ctx, rx + rw * 0.45, ry + rh * 0.2, rw * 0.4, rh * 0.5, 2);
      D.fs(ctx, '#81d4fa', OL, 1.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx + rw * 0.5, ry + rh * 0.6);
      ctx.lineTo(rx + rw * 0.6, ry + rh * 0.25);
      ctx.stroke();
    }
    // AC units
    const n = 1 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
      const ax = rx + 4 + i * 22, ay = ry + rh - 18;
      if (ax + 18 > rx + rw * 0.45 && w >= 90) break;
      D.rrPath(ctx, ax, ay, 18, 16, 2);
      D.fs(ctx, '#cfd8dc', OL, 1);
      D.circlePath(ctx, ax + 9, ay + 8, 5.5);
      D.fs(ctx, '#546e7a', OL, 0.8);
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax + 5, ay + 8);
      ctx.lineTo(ax + 13, ay + 8);
      ctx.moveTo(ax + 9, ay + 4);
      ctx.lineTo(ax + 9, ay + 12);
      ctx.stroke();
    }
    if (w < 90) {
      // antenna with a red light
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.x, ry + 10);
      ctx.lineTo(d.x, ry + 30);
      ctx.stroke();
      D.circlePath(ctx, d.x, ry + 10, 3);
      D.fs(ctx, '#ff1744', OL, 0.8);
    }
  };

  DEC.billboard = (ctx, d) => {
    const x = d.x, y = d.y, w = 84, h = 46;
    D.shadow(ctx, x + 10, y + 34, 46, 8, 0.3);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 4;
    [-24, 24].forEach((px) => {
      ctx.beginPath();
      ctx.moveTo(x + px, y + 2);
      ctx.lineTo(x + px, y + 32);
      ctx.stroke();
    });
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2.4;
    [-24, 24].forEach((px) => {
      ctx.beginPath();
      ctx.moveTo(x + px, y + 2);
      ctx.lineTo(x + px, y + 32);
      ctx.stroke();
    });
    D.rrPath(ctx, x - w / 2 - 3, y - h + 2, w + 6, h + 6, 3);
    D.fs(ctx, '#455a64', OL, 1.6);
    D.rrPath(ctx, x - w / 2, y - h + 5, w, h, 2);
    ctx.fillStyle = D.lin(ctx, 0, y - h, 0, y + 5, [[0, '#7b1fa2'], [1, '#311b92']]);
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      D.starPath(ctx, x - w / 2 + 6 + ((i * 37) % (w - 12)), y - h + 9 + ((i * 23) % (h - 10)), 5, 2.2, 1);
      D.fs(ctx, 'rgba(255,235,59,0.75)');
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px Arial Black, Arial';
    ctx.lineWidth = 3;
    ctx.strokeStyle = OL;
    ctx.strokeText('VILLAIN-CON', x, y - h + 20);
    ctx.fillStyle = '#ffd83a';
    ctx.fillText('VILLAIN-CON', x, y - h + 20);
    ctx.font = 'bold 8px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('THIS WEEKEND ONLY!', x, y - h + 36);
    // spotlights
    [-20, 20].forEach((px) => {
      D.rrPath(ctx, x + px - 4, y + 4, 8, 5, 1);
      D.fs(ctx, '#263238', OL, 0.8);
    });
  };

  DEC.car = (ctx, d, rnd) => {
    const col = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa'][Math.floor(rnd() * 5)];
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(-0.25 + rnd() * 0.5);
    D.rrPath(ctx, -18 + 3, -10 + 4, 36, 20, 6);
    D.fs(ctx, 'rgba(0,0,0,0.3)');
    [[-11, -10], [9, -10], [-11, 8], [9, 8]].forEach(([wx, wy]) => {
      ctx.fillStyle = '#1b1b1b';
      ctx.fillRect(wx, wy - 1, 7, 4);
    });
    D.rrPath(ctx, -18, -10, 36, 20, 6);
    ctx.fillStyle = D.lin(ctx, 0, -10, 0, 10, [[0, D.shade(col, 0.25)], [1, D.shade(col, -0.25)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.rrPath(ctx, -8, -7.5, 16, 15, 3);
    D.fs(ctx, D.shade(col, -0.1), OL, 1);
    ctx.fillStyle = '#90caf9';
    ctx.fillRect(4.5, -6.5, 3.5, 13);
    ctx.fillRect(-9, -6.5, 2.5, 13);
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(16, -8, 2, 4);
    ctx.fillRect(16, 4, 2, 4);
    ctx.fillStyle = '#ff5252';
    ctx.fillRect(-18, -8, 1.6, 4);
    ctx.fillRect(-18, 4, 1.6, 4);
    ctx.restore();
  };

  DEC.lamp = (ctx, d) => {
    const x = d.x, y = d.y;
    D.circlePath(ctx, x + 10, y - 2, 14);
    ctx.fillStyle = D.rad(ctx, x + 10, y - 2, 0, x + 10, y - 2, 14, [[0, 'rgba(255,240,150,0.45)'], [1, 'rgba(255,240,150,0)']]);
    ctx.fill();
    D.shadow(ctx, x + 6, y + 6, 10, 3, 0.3);
    D.circlePath(ctx, x, y + 4, 3.5);
    D.fs(ctx, '#37474f', OL, 1);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x, y - 22);
    ctx.quadraticCurveTo(x, y - 27, x + 6, y - 27);
    ctx.stroke();
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.rrPath(ctx, x + 4, y - 29, 10, 5, 2);
    D.fs(ctx, '#37474f', OL, 1);
    D.ellipsePath(ctx, x + 9, y - 23.5, 4, 1.8);
    D.fs(ctx, '#fff59d');
  };

  DEC.planter = (ctx, d, rnd) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 4, y + 10, 16, 6, 0.3);
    D.rrPath(ctx, x - 13, y - 10, 26, 22, 3);
    ctx.fillStyle = D.lin(ctx, x - 13, 0, x + 13, 0, [[0, '#d7ccc8'], [1, '#8d6e63']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    D.rrPath(ctx, x - 10, y - 8, 20, 6, 2);
    D.fs(ctx, '#5d4037');
    DEC.bush(ctx, { x, y: y - 10, r: 11 }, rnd);
  };

  // ---- factory
  DEC.machine = (ctx, d, rnd) => {
    const x = d.x, y = d.y, r = d.r;
    const w = r * 1.8, h = r * 1.3;
    D.shadow(ctx, x + 10, y + h * 0.5, w * 0.62, 14, 0.4);
    // pipes into the floor
    ctx.lineCap = 'butt';
    for (const [px, col] of [[-w * 0.38, '#ff7043'], [w * 0.38, '#29b6f6']]) {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(x + px, y - h * 0.2);
      ctx.lineTo(x + px * 1.25, y - h * 0.2);
      ctx.lineTo(x + px * 1.25, y + h * 0.48);
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.lineWidth = 6;
      ctx.stroke();
    }
    ctx.lineCap = 'round';
    D.rrPath(ctx, x - w / 2, y - h / 2, w, h, 6);
    ctx.fillStyle = D.lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, '#b0bec5'], [0.5, '#90a4ae'], [1, '#546e7a']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // hazard stripe base
    ctx.save();
    D.rrPath(ctx, x - w / 2, y + h / 2 - 9, w, 9, 3);
    ctx.clip();
    for (let i = -2; i < w / 8 + 2; i++) {
      ctx.fillStyle = i % 2 ? '#ffc928' : '#22262b';
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + i * 8, y + h / 2);
      ctx.lineTo(x - w / 2 + i * 8 + 8, y + h / 2);
      ctx.lineTo(x - w / 2 + i * 8 + 17, y + h / 2 - 9);
      ctx.lineTo(x - w / 2 + i * 8 + 9, y + h / 2 - 9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // gauges
    [-0.25, 0.05].forEach((f, i) => {
      const gx = x + w * f, gy = y - h * 0.12;
      D.circlePath(ctx, gx, gy, 7.5);
      D.fs(ctx, '#fafafa', OL, 1.3);
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      const a = -2.4 + rnd() * 2 + i;
      ctx.lineTo(gx + Math.cos(a) * 5.5, gy + Math.sin(a) * 5.5);
      ctx.stroke();
    });
    // banana output hatch + blinking lights
    D.rrPath(ctx, x + w * 0.18, y - h * 0.28, w * 0.22, h * 0.36, 3);
    D.fs(ctx, '#263238', OL, 1.2);
    TP().banana(ctx, x + w * 0.29, y - h * 0.1, 0.55, 0.4, '#ffe14a');
    ['#76ff03', '#ffea00', '#ff1744'].forEach((c, i) => {
      D.circlePath(ctx, x - w * 0.38 + i * 7, y + h * 0.18, 2.4);
      D.fs(ctx, c, OL, 0.8);
    });
    // smokestack
    cylinder(ctx, x - w * 0.3, y - h * 0.42, 14, 18, '#78909c', '#37474f', 1.4);
    D.ellipsePath(ctx, x - w * 0.3, y - h * 0.42 - 18, 4.5, 1.6);
    D.fs(ctx, '#111');
  };

  DEC.bananacrates = (ctx, d) => {
    const x = d.x, y = d.y;
    DEC.crate(ctx, { x: x - 16, y: y + 8 });
    DEC.crate(ctx, { x: x + 16, y: y + 8 });
    DEC.crate(ctx, { x, y: y - 14 });
  };

  DEC.gear = (ctx, d, rnd) => {
    const x = d.x, y = d.y, r = d.r * 0.92;
    D.shadow(ctx, x + 6, y + 8, r * 1.05, r * 0.85, 0.35);
    const teeth = 12, rot = rnd();
    ctx.beginPath();
    for (let i = 0; i < teeth * 4; i++) {
      const a = rot + (i / (teeth * 4)) * 6.283;
      const rr = i % 4 < 2 ? r : r * 0.82;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - r, y - r, x + r, y + r, [[0, '#ffe082'], [0.5, '#c9a227'], [1, '#7a5c12']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = rot + (i / 5) * 6.283;
      D.circlePath(ctx, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.14);
      D.fs(ctx, '#6d757f', OL, 1.2);
    }
    D.circlePath(ctx, x, y, r * 0.24);
    D.fs(ctx, '#90a4ae', OL, 1.4);
    D.circlePath(ctx, x, y, r * 0.09);
    D.fs(ctx, '#263238');
  };

  DEC.barrel = (ctx, d, rnd) => {
    const x = d.x, y = d.y, col = rnd() > 0.5 ? '#1e88e5' : '#ffb300';
    D.shadow(ctx, x + 3, y + 10, 15, 6, 0.4);
    D.circlePath(ctx, x, y, 13);
    ctx.fillStyle = D.rad(ctx, x - 4, y - 4, 1, x, y, 13, [[0, D.shade(col, 0.4)], [1, D.shade(col, -0.35)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    D.circlePath(ctx, x, y, 9.5);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    D.circlePath(ctx, x + 4, y - 3, 2);
    D.fs(ctx, '#37474f', OL, 0.7);
    TP().banana(ctx, x - 2, y + 2, 0.5, 0.3, col === '#ffb300' ? '#5d4037' : '#ffe14a');
  };

  DEC.toolbox = (ctx, d, rnd) => {
    const x = d.x, y = d.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd() - 0.5) * 0.8);
    D.rrPath(ctx, -12 + 2, -7 + 3, 24, 14, 2);
    D.fs(ctx, 'rgba(0,0,0,0.3)');
    D.rrPath(ctx, -12, -7, 24, 14, 2);
    ctx.fillStyle = D.lin(ctx, 0, -7, 0, 7, [[0, '#ef5350'], [1, '#b71c1c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.moveTo(-12, -1);
    ctx.lineTo(12, -1);
    ctx.stroke();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-5, -7);
    ctx.lineTo(-5, -10);
    ctx.lineTo(5, -10);
    ctx.lineTo(5, -7);
    ctx.stroke();
    // wrench lying next to it
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(15, 3);
    ctx.lineTo(24, 10);
    ctx.stroke();
    D.circlePath(ctx, 14, 2, 3);
    D.fs(ctx, '#b0bec5', OL, 0.8);
    ctx.restore();
  };
})();
