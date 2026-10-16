// Interactive map themes: Super Silly Fun Land, Vector's Fortress, the AVL
// Undersea Base and the Bank of Evil. Registers grounds, tracks, water and
// scenery into art/maps.js, plus the textures of the clickable map features
// (rollercoaster, drawbridges, shark, recall tube, lasers, loan desk...).
(function () {
  const D = MT.Draw;
  const OL = D.OL;
  const TAU = Math.PI * 2;
  const W = MT.CFG.MAP_W, H = MT.CFG.MAP_H;
  const A = MT.MapArt;
  const { THEMES, DEC, WATER, SCATTER_R, NON_BLOCKING } = A;
  const { poly, strokePoly, walk, speckle } = A.helpers;
  const TP = () => MT.TowerArt.props;

  Object.assign(SCATTER_R, { fairlight: 10, kelp: 18, coral: 16, seastone: 14, plantpot: 16, moneybag: 13 });

  function offsetPts(pts, off) {
    return pts.map((q, i) => {
      const n = pts[Math.min(i + 1, pts.length - 1)], pr = pts[Math.max(i - 1, 0)];
      const a = Math.atan2(n.y - pr.y, n.x - pr.x) + Math.PI / 2;
      return { x: q.x + Math.cos(a) * off, y: q.y + Math.sin(a) * off };
    });
  }
  const pass = (ctx, paths, w, style, dy) => paths.forEach((p) => strokePoly(ctx, p.pts, w, style, dy));
  const loopPts = (loop) => new MT.Path(loop.concat([loop[0]])).pts;

  function minionHead(ctx, x, y, r, rot) {
    // a minion seen from above: yellow head, goggle strap, one or two goggles
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    D.circlePath(ctx, 0, 0, r);
    ctx.fillStyle = D.rad(ctx, -r * 0.3, -r * 0.3, 0, 0, 0, r, [[0, '#fff07c'], [1, '#d8a200']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(r * 0.15, -r, r * 0.3, r * 2);
    D.circlePath(ctx, r * 0.55, -r * 0.42, r * 0.36);
    D.fs(ctx, '#cfd5dc', OL, 0.7);
    D.circlePath(ctx, r * 0.55, r * 0.42, r * 0.36);
    D.fs(ctx, '#cfd5dc', OL, 0.7);
    ctx.restore();
  }

  // ================================================================ THEMES
  THEMES.funpark = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.lin(ctx, 0, 0, W, H, [[0, '#8fdc5a'], [1, '#5fb83a']]);
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, rnd, 700, ['#4f9a2c', '#a8e870', '#73c447'], 2, 6, 0.32);
      // round paved plazas
      [[150, 420, 92], [840, 330, 104], [160, 610, 66], [540, 380, 120]].forEach(([x, y, r]) => {
        D.circlePath(ctx, x, y, r);
        ctx.fillStyle = D.rad(ctx, x, y, r * 0.2, x, y, r, [[0, '#fff4dc'], [1, '#efd9ae']]);
        ctx.fill();
        ctx.strokeStyle = '#c9a76a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.save();
        D.circlePath(ctx, x, y, r - 2);
        ctx.clip();
        ctx.strokeStyle = 'rgba(190,150,90,0.35)';
        ctx.lineWidth = 1;
        for (let k = 1; k < 6; k++) {
          D.circlePath(ctx, x, y, (r * k) / 6);
          ctx.stroke();
        }
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * TAU;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
          ctx.stroke();
        }
        ctx.restore();
      });
      // confetti on the grass
      const cols = ['#ff5f8f', '#40c4ff', '#ffd83a', '#b388ff', '#69f0ae', '#ff8a65'];
      for (let i = 0; i < 420; i++) {
        ctx.save();
        ctx.translate(rnd() * W, rnd() * H);
        ctx.rotate(rnd() * 3);
        ctx.fillStyle = D.rgba(cols[i % cols.length], 0.8);
        ctx.fillRect(-1.8, -1, 3.6, 2);
        ctx.restore();
      }
    },
    // the "midway": a red-brick promenade with cream edging
    path(ctx, paths, pw, rnd) {
      pass(ctx, paths, pw + 18, 'rgba(0,0,0,0.16)', 3);
      pass(ctx, paths, pw + 12, '#a0522d');
      pass(ctx, paths, pw + 8, '#fff3d6');
      pass(ctx, paths, pw, '#d9644a');
      paths.forEach((p) => {
        let k = 0;
        walk(p.pts, 8, (x, y, a) => {
          k++;
          const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
          ctx.strokeStyle = 'rgba(120,40,20,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - nx * pw / 2, y - ny * pw / 2);
          ctx.lineTo(x + nx * pw / 2, y + ny * pw / 2);
          ctx.stroke();
          // staggered brick joints
          const o = k % 2 ? -pw / 4 : pw / 4;
          ctx.beginPath();
          ctx.moveTo(x + nx * o, y + ny * o);
          ctx.lineTo(x + nx * o - Math.cos(a) * 8, y + ny * o - Math.sin(a) * 8);
          ctx.stroke();
          if (rnd() < 0.25) {
            D.ellipsePath(ctx, x + nx * (rnd() - 0.5) * pw * 0.8, y + ny * (rnd() - 0.5) * pw * 0.8, 3, 2, a);
            D.fs(ctx, 'rgba(255,200,170,0.35)');
          }
        });
        [-1, 1].forEach((s) => strokePoly(ctx, offsetPts(p.pts, s * (pw / 2 + 4)), 1.2, 'rgba(160,82,45,0.6)'));
        // little painted stars down the middle
        walk(p.pts, 70, (x, y) => {
          D.starPath(ctx, x, y, 5, 5, 2.2, rnd() * 3);
          D.fs(ctx, 'rgba(255,216,58,0.75)');
        });
      });
    },
  };

  THEMES.fortress = {
    ground(ctx, rnd) {
      // sandy island with tide pools, a sea glint around the edges
      ctx.fillStyle = D.lin(ctx, 0, 0, W, H, [[0, '#ead39b'], [1, '#d4b675']]);
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, rnd, 600, ['#c9a560', '#fff0c8', '#b89255'], 2, 5, 0.4);
      for (let i = 0; i < 30; i++) {
        D.blobPath(ctx, rnd() * W, rnd() * H, 10 + rnd() * 26, 8, 0.3, rnd);
        D.fs(ctx, 'rgba(120,150,90,0.18)');
      }
      // trimmed lawn on the fortress side of the island
      D.circlePath(ctx, 520, 360, 200);
      ctx.fillStyle = D.rad(ctx, 520, 360, 120, 520, 360, 200, [[0, 'rgba(126,200,80,0.55)'], [1, 'rgba(126,200,80,0)']]);
      ctx.fill();
    },
    // Vector's white concrete road with orange stripes
    path(ctx, paths, pw, rnd) {
      pass(ctx, paths, pw + 16, 'rgba(60,40,10,0.22)', 3);
      pass(ctx, paths, pw + 8, '#ff7a1a');
      pass(ctx, paths, pw + 2, '#f5f5f5');
      pass(ctx, paths, pw - 6, '#e7e9ec');
      paths.forEach((p) => {
        let k = 0;
        walk(p.pts, 30, (x, y, a) => {
          k++;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          ctx.fillStyle = k % 2 ? 'rgba(255,122,26,0.85)' : 'rgba(255,255,255,0)';
          ctx.fillRect(-7, -2, 14, 4);
          ctx.restore();
        });
        walk(p.pts, 9, (x, y, a) => {
          if (rnd() < 0.3) {
            const o = (rnd() - 0.5) * pw * 0.7;
            D.circlePath(ctx, x + Math.cos(a + 1.57) * o, y + Math.sin(a + 1.57) * o, 0.8 + rnd());
            D.fs(ctx, 'rgba(140,140,150,0.45)');
          }
        });
      });
    },
  };

  THEMES.undersea = {
    ground(ctx, rnd) {
      ctx.fillStyle = D.lin(ctx, 0, 0, 0, H, [[0, '#1e88a8'], [0.55, '#14708f'], [1, '#0d4f6b']]);
      ctx.fillRect(0, 0, W, H);
      // sandy sea floor patches
      for (let i = 0; i < 26; i++) {
        D.blobPath(ctx, rnd() * W, rnd() * H, 40 + rnd() * 70, 10, 0.25, rnd);
        D.fs(ctx, 'rgba(230,205,150,0.2)');
      }
      speckle(ctx, rnd, 500, ['#0b5a74', '#2aa3c4', '#e6cf96'], 2, 5, 0.35);
      // light caustics from the surface
      ctx.strokeStyle = 'rgba(180,240,255,0.16)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 90; i++) {
        const x = rnd() * W, y = rnd() * H, r = 14 + rnd() * 22;
        ctx.beginPath();
        ctx.moveTo(x - r, y);
        ctx.bezierCurveTo(x - r * 0.4, y - r * 0.6, x + r * 0.4, y + r * 0.6, x + r, y);
        ctx.stroke();
      }
      // drifting bubbles
      for (let i = 0; i < 70; i++) {
        D.circlePath(ctx, rnd() * W, rnd() * H, 1.5 + rnd() * 3);
        D.fs(ctx, 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.55)', 0.8);
      }
    },
    // glass tunnel with steel ribs
    path(ctx, paths, pw, rnd) {
      pass(ctx, paths, pw + 18, 'rgba(0,20,40,0.35)', 4);
      pass(ctx, paths, pw + 10, '#37474f');
      pass(ctx, paths, pw + 4, '#90a4ae');
      pass(ctx, paths, pw, '#b3e5fc');
      pass(ctx, paths, pw - 8, '#81d4fa');
      paths.forEach((p) => {
        strokePoly(ctx, offsetPts(p.pts, -pw * 0.28), 3, 'rgba(255,255,255,0.75)');
        strokePoly(ctx, offsetPts(p.pts, pw * 0.3), 2, 'rgba(1,87,155,0.35)');
        // floor grating down the middle
        strokePoly(ctx, p.pts, pw * 0.42, 'rgba(84,110,122,0.45)');
        walk(p.pts, 6, (x, y, a) => {
          const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
          ctx.strokeStyle = 'rgba(38,50,56,0.35)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x - nx * pw * 0.2, y - ny * pw * 0.2);
          ctx.lineTo(x + nx * pw * 0.2, y + ny * pw * 0.2);
          ctx.stroke();
        });
        walk(p.pts, 34, (x, y, a) => {
          const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2), h = pw / 2 + 4;
          ctx.lineCap = 'round';
          ctx.strokeStyle = OL;
          ctx.lineWidth = 5.4;
          ctx.beginPath();
          ctx.moveTo(x - nx * h, y - ny * h);
          ctx.lineTo(x + nx * h, y + ny * h);
          ctx.stroke();
          ctx.strokeStyle = '#78909c';
          ctx.lineWidth = 3.4;
          ctx.stroke();
          [-1, 1].forEach((s) => {
            D.circlePath(ctx, x + nx * h * s, y + ny * h * s, 2.4);
            D.fs(ctx, '#cfd8dc', OL, 0.8);
          });
        });
      });
    },
  };

  THEMES.bank = {
    ground(ctx, rnd) {
      // polished marble tiles with veins
      const T = 60;
      for (let y = 0; y < H; y += T) {
        for (let x = 0; x < W; x += T) {
          const dark = ((x + y) / T) % 2;
          ctx.fillStyle = D.lin(ctx, x, y, x + T, y + T, dark ? [[0, '#e3dfd6'], [1, '#cfc9bd']] : [[0, '#faf8f3'], [1, '#e9e5dc']]);
          ctx.fillRect(x, y, T, T);
          ctx.strokeStyle = dark ? 'rgba(120,110,95,0.25)' : 'rgba(150,140,125,0.22)';
          ctx.lineWidth = 0.9;
          for (let v = 0; v < 2; v++) {
            let vx = x + rnd() * T, vy = y;
            ctx.beginPath();
            ctx.moveTo(vx, vy);
            for (let s = 0; s < 6; s++) {
              vx += (rnd() - 0.5) * 16;
              vy += T / 6;
              ctx.lineTo(vx, vy);
            }
            ctx.stroke();
          }
        }
      }
      ctx.strokeStyle = 'rgba(176,150,90,0.5)';
      ctx.lineWidth = 1.4;
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
      // gold border round the hall
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, W - 12, H - 12);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.strokeRect(3, 3, W - 6, H - 6);
      ctx.strokeRect(9, 9, W - 18, H - 18);
    },
    // red carpet with gold trim and velvet rope stanchions
    path(ctx, paths, pw, rnd) {
      pass(ctx, paths, pw + 16, 'rgba(60,30,20,0.22)', 3);
      pass(ctx, paths, pw + 8, '#c9a227');
      pass(ctx, paths, pw + 4, '#8e1c1c');
      pass(ctx, paths, pw, '#c62828');
      paths.forEach((p) => {
        [-1, 1].forEach((s) => strokePoly(ctx, offsetPts(p.pts, s * (pw / 2 - 5)), 1.6, 'rgba(255,215,64,0.8)'));
        // woven pattern
        walk(p.pts, 12, (x, y, a) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          ctx.strokeStyle = 'rgba(120,0,0,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-4, -pw * 0.28);
          ctx.lineTo(0, -pw * 0.18);
          ctx.lineTo(4, -pw * 0.28);
          ctx.moveTo(-4, pw * 0.28);
          ctx.lineTo(0, pw * 0.18);
          ctx.lineTo(4, pw * 0.28);
          ctx.stroke();
          ctx.restore();
        });
        // brass stanchions with velvet ropes on both sides
        [-1, 1].forEach((s) => {
          const posts = [];
          walk(p.pts, 52, (x, y, a) => posts.push({ x: x + Math.cos(a + 1.57) * s * (pw / 2 + 9), y: y + Math.sin(a + 1.57) * s * (pw / 2 + 9) }));
          ctx.lineCap = 'round';
          for (let i = 1; i < posts.length; i++) {
            const a = posts[i - 1], b = posts[i];
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + 5;
            ctx.strokeStyle = OL;
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y - 4);
            ctx.quadraticCurveTo(mx, my, b.x, b.y - 4);
            ctx.stroke();
            ctx.strokeStyle = '#b71c1c';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          posts.forEach((q) => {
            D.circlePath(ctx, q.x, q.y + 1, 3.6);
            D.fs(ctx, 'rgba(0,0,0,0.25)');
            D.circlePath(ctx, q.x, q.y - 3, 2.8);
            ctx.fillStyle = D.rad(ctx, q.x - 1, q.y - 4, 0, q.x, q.y - 3, 3, [[0, '#fff8c4'], [1, '#c9a227']]);
            ctx.fill();
            ctx.strokeStyle = OL;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          });
        });
      });
    },
  };

  // ================================================================ WATER
  // a ring of water around Vector's fortress
  WATER.moat = (ctx, wa, rnd) => {
    const ring = (r0, r1, fill) => {
      ctx.beginPath();
      ctx.arc(wa.x, wa.y, r1, 0, TAU);
      ctx.arc(wa.x, wa.y, r0, 0, TAU, true);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };
    const hw = wa.width / 2;
    ring(wa.r - hw - 7, wa.r + hw + 7, '#9e9e9e');
    ring(wa.r - hw - 3, wa.r + hw + 3, '#cfd8dc');
    ring(wa.r - hw, wa.r + hw, D.rad(ctx, wa.x, wa.y, wa.r - hw, wa.x, wa.y, wa.r + hw, [[0, '#1565c0'], [0.5, '#2f8fd8'], [1, '#1565c0']]));
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    [wa.r - hw - 7, wa.r + hw + 7].forEach((r) => {
      D.circlePath(ctx, wa.x, wa.y, r);
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 14; i++) {
      const a = rnd() * TAU, r = wa.r + (rnd() - 0.5) * wa.width * 0.6;
      ctx.beginPath();
      ctx.arc(wa.x + Math.cos(a) * r, wa.y + Math.sin(a) * r, 5, Math.PI * 1.1, Math.PI * 1.8);
      ctx.stroke();
    }
  };

  // ================================================================ DECOR: fun park
  DEC.coasterrails = (ctx, d) => {
    const pts = loopPts(d.loop);
    // support posts + their shadows
    walk(pts, 40, (x, y) => {
      D.circlePath(ctx, x + 6, y + 8, 6);
      D.fs(ctx, 'rgba(0,0,0,0.18)');
    });
    strokePoly(ctx, pts, 26, 'rgba(0,0,0,0.18)', 6);
    // sleepers
    walk(pts, 8, (x, y, a) => {
      const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 4.4;
      ctx.beginPath();
      ctx.moveTo(x - nx * 11, y - ny * 11);
      ctx.lineTo(x + nx * 11, y + ny * 11);
      ctx.stroke();
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 2.6;
      ctx.stroke();
    });
    [-7, 7].forEach((o) => {
      const r = offsetPts(pts, o);
      strokePoly(ctx, r, 5, OL);
      strokePoly(ctx, r, 3, '#e53935');
      strokePoly(ctx, r, 1, 'rgba(255,255,255,0.7)');
    });
  };

  DEC.coasterstation = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 6, y + 26, 40, 10, 0.3);
    D.rrPath(ctx, x - 30, y - 18, 60, 40, 4);
    ctx.fillStyle = D.lin(ctx, x - 30, 0, x + 30, 0, [[0, '#7e57c2'], [1, '#4527a0']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // striped awning roof
    ctx.save();
    D.rrPath(ctx, x - 34, y - 34, 68, 22, 5);
    ctx.clip();
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#e53935';
      ctx.fillRect(x - 34 + i * 8, y - 34, 8, 22);
    }
    ctx.restore();
    D.rrPath(ctx, x - 34, y - 34, 68, 22, 5);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // sign
    D.rrPath(ctx, x - 29, y - 6, 58, 14, 3);
    D.fs(ctx, '#ffd83a', OL, 1.2);
    ctx.fillStyle = '#4527a0';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPACE KILLER', x, y + 1.5);
  };

  DEC.ferrisbase = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 10, y + 74, 70, 16, 0.3);
    // A-frame legs
    [-1, 1].forEach((s) => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = OL;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s * 40, y + 78);
      ctx.stroke();
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 5.4;
      ctx.stroke();
    });
    D.rrPath(ctx, x - 52, y + 74, 104, 12, 3);
    D.fs(ctx, '#607d8b', OL, 1.4);
    D.rrPath(ctx, x - 16, y + 62, 32, 16, 3);
    D.fs(ctx, '#e53935', OL, 1.2);
  };

  DEC.carouselbase = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 6, y + 10, d.r + 6, (d.r + 6) * 0.75, 0.3);
    D.circlePath(ctx, x, y, d.r);
    ctx.fillStyle = D.rad(ctx, x, y, 4, x, y, d.r, [[0, '#ffe082'], [1, '#ffb300']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  };

  DEC.prizebooth = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 6, y + 28, 46, 10, 0.3);
    D.rrPath(ctx, x - 40, y - 20, 80, 44, 4);
    D.fs(ctx, '#f8bbd0', OL, 1.5);
    D.rrPath(ctx, x - 44, y - 34, 88, 18, 4);
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 11; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ec407a';
      ctx.fillRect(x - 44 + i * 8, y - 34, 8, 18);
    }
    ctx.restore();
    D.rrPath(ctx, x - 44, y - 34, 88, 18, 4);
    ctx.strokeStyle = OL;
    ctx.stroke();
    // the fluffy unicorn prize ("IT'S SO FLUFFY!")
    const ux = x - 12, uy = y + 2;
    D.ellipsePath(ctx, ux, uy + 4, 11, 8);
    D.fs(ctx, '#ffffff', OL, 1.1);
    D.circlePath(ctx, ux + 9, uy - 4, 6);
    D.fs(ctx, '#ffffff', OL, 1.1);
    ctx.beginPath();
    ctx.moveTo(ux + 10, uy - 9);
    ctx.lineTo(ux + 14, uy - 18);
    ctx.lineTo(ux + 13, uy - 8);
    ctx.closePath();
    D.fs(ctx, '#ffd54f', OL, 0.9);
    D.circlePath(ctx, ux + 11, uy - 5, 1);
    D.fs(ctx, '#222');
    D.blobPath(ctx, ux - 9, uy, 4, 6, 0.4, D.rng(3));
    D.fs(ctx, '#f48fb1');
    // a row of toy targets
    for (let i = 0; i < 3; i++) {
      D.circlePath(ctx, x + 12 + i * 9, y - 4, 3.6);
      D.fs(ctx, i % 2 ? '#40c4ff' : '#ffd83a', OL, 0.8);
    }
  };

  DEC.cottoncandy = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 4, y + 18, 24, 7, 0.3);
    D.rrPath(ctx, x - 18, y - 6, 36, 22, 4);
    D.fs(ctx, '#4fc3f7', OL, 1.3);
    [[-8, -12, '#f8bbd0'], [6, -14, '#e1bee7'], [0, -20, '#b3e5fc']].forEach(([dx, dy, c]) => {
      D.blobPath(ctx, x + dx, y + dy, 8, 9, 0.2, D.rng(dx + 50));
      D.fs(ctx, c, OL, 1);
    });
  };

  DEC.ticketbooth = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 4, y + 22, 26, 8, 0.3);
    D.rrPath(ctx, x - 20, y - 14, 40, 34, 4);
    D.fs(ctx, '#ff7043', OL, 1.3);
    D.rrPath(ctx, x - 13, y - 6, 26, 14, 2);
    D.fs(ctx, '#b3e5fc', OL, 1);
    ctx.beginPath();
    ctx.moveTo(x - 24, y - 14);
    ctx.lineTo(x, y - 30);
    ctx.lineTo(x + 24, y - 14);
    ctx.closePath();
    D.fs(ctx, '#ffd83a', OL, 1.3);
    D.starPath(ctx, x, y - 21, 5, 4, 1.8);
    D.fs(ctx, '#e53935');
  };

  DEC.balloons = (ctx, d) => {
    const x = d.x, y = d.y;
    const cols = ['#e53935', '#40c4ff', '#ffd83a', '#ab47bc', '#66bb6a'];
    ctx.strokeStyle = 'rgba(60,40,30,0.7)';
    ctx.lineWidth = 0.8;
    cols.forEach((c, i) => {
      const a = -Math.PI / 2 + (i - 2) * 0.5;
      const bx = x + Math.cos(a) * 16, by = y + 6 + Math.sin(a) * 16;
      ctx.beginPath();
      ctx.moveTo(x, y + 10);
      ctx.lineTo(bx, by + 6);
      ctx.stroke();
      D.ellipsePath(ctx, bx, by, 6, 7.4);
      ctx.fillStyle = D.rad(ctx, bx - 2, by - 2, 0, bx, by, 7, [[0, '#ffffff'], [0.3, c], [1, D.shade(c, -0.3)]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(60,40,30,0.7)';
      ctx.lineWidth = 0.8;
    });
    D.rrPath(ctx, x - 5, y + 8, 10, 7, 2);
    D.fs(ctx, '#8d6e63', OL, 0.9);
  };

  DEC.popcorn = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 3, y + 14, 18, 6, 0.3);
    D.rrPath(ctx, x - 12, y - 8, 24, 20, 3);
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#e53935';
      ctx.fillRect(x - 12 + i * 6, y - 8, 6, 20);
    }
    ctx.restore();
    D.rrPath(ctx, x - 12, y - 8, 24, 20, 3);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      D.circlePath(ctx, x - 9 + i * 3, y - 10 - (i % 2) * 3, 3);
      D.fs(ctx, '#fff8e1', OL, 0.6);
    }
  };

  // string-light posts along the walkways
  DEC.fairlight = (ctx, d, rnd) => {
    const x = d.x, y = d.y;
    const col = ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae', '#e040fb'][Math.floor(rnd() * 5)];
    D.shadow(ctx, x + 6, y + 6, 10, 3, 0.3);
    D.circlePath(ctx, x, y + 4, 3.5);
    D.fs(ctx, '#455a64', OL, 1);
    // candy-striped pole
    D.rrPath(ctx, x - 1.8, y - 24, 3.6, 28, 1.5);
    ctx.save();
    ctx.clip();
    for (let k = 0; k < 8; k++) {
      ctx.fillStyle = k % 2 ? '#ffffff' : '#e53935';
      ctx.fillRect(x - 3, y - 24 + k * 3.6, 6, 3.6);
    }
    ctx.restore();
    D.rrPath(ctx, x - 1.8, y - 24, 3.6, 28, 1.5);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    TP().glowRing(ctx, x, y - 28, 12, col, 0.6);
    D.circlePath(ctx, x, y - 28, 4.4);
    ctx.fillStyle = D.rad(ctx, x - 1.4, y - 29.5, 0, x, y - 28, 4.4, [[0, '#ffffff'], [0.5, col], [1, D.shade(col, -0.3)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // ================================================================ DECOR: Vector's fortress
  DEC.vectorfortress = (ctx, d) => {
    const x = d.x, y = d.y;
    D.circlePath(ctx, x, y, 92);
    ctx.fillStyle = D.rad(ctx, x, y, 10, x, y, 92, [[0, '#8bc34a'], [1, '#689f38']]);
    ctx.fill();
    D.shadow(ctx, x + 12, y + 50, 74, 18, 0.35);
    // the pyramid-shaped lair, orange and white, seen from above at an angle
    const base = 68, top = 112;
    ctx.beginPath();
    ctx.moveTo(x - base, y + 46);
    ctx.lineTo(x, y - top + 40);
    ctx.lineTo(x + base, y + 46);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - base, 0, x + base, 0, [[0, '#ffffff'], [0.48, '#eceff1'], [0.52, '#b0bec5'], [1, '#90a4ae']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 4; i++) {
      const yy = y - 40 + i * 24;
      ctx.fillStyle = i % 2 ? 'rgba(255,122,26,0.95)' : 'rgba(255,152,0,0)';
      ctx.fillRect(x - base, yy, base * 2, 9);
    }
    ctx.restore();
    // big V emblem
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 2);
    ctx.lineTo(x, y + 26);
    ctx.lineTo(x + 16, y - 2);
    ctx.lineTo(x + 9, y - 2);
    ctx.lineTo(x, y + 14);
    ctx.lineTo(x - 9, y - 2);
    ctx.closePath();
    D.fs(ctx, '#ff6d00', OL, 1.4);
    // door
    D.rrPath(ctx, x - 10, y + 30, 20, 16, 4);
    D.fs(ctx, '#37474f', OL, 1.2);
    // shark tank glass on the side
    D.rrPath(ctx, x + 26, y + 14, 26, 22, 4);
    D.fs(ctx, 'rgba(79,195,247,0.85)', OL, 1.2);
    ctx.beginPath();
    ctx.moveTo(x + 34, y + 30);
    ctx.lineTo(x + 39, y + 20);
    ctx.lineTo(x + 43, y + 30);
    ctx.closePath();
    D.fs(ctx, '#546e7a', OL, 0.8);
  };

  DEC.squidlauncher = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 4, y + 16, 26, 8, 0.3);
    D.rrPath(ctx, x - 16, y + 2, 32, 14, 3);
    D.fs(ctx, '#ff7a1a', OL, 1.3);
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.rotate(-0.6);
    D.rrPath(ctx, -4, -6, 30, 12, 5);
    D.fs(ctx, '#eceff1', OL, 1.3);
    D.ellipsePath(ctx, 26, 0, 3, 6);
    D.fs(ctx, '#263238', OL, 1);
    ctx.restore();
  };

  DEC.pyramidstatue = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 6, y + 22, 34, 9, 0.3);
    ctx.beginPath();
    ctx.moveTo(x - 30, y + 20);
    ctx.lineTo(x, y - 28);
    ctx.lineTo(x + 30, y + 20);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - 30, 0, x + 30, 0, [[0, '#ffe082'], [0.5, '#ffca28'], [1, '#c79100']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.circlePath(ctx, x, y + 2, 5);
    D.fs(ctx, '#ff6d00', OL, 1);
  };

  // ================================================================ DECOR: undersea
  DEC.avldome = (ctx, d) => {
    const x = d.x, y = d.y, r = d.r;
    D.shadow(ctx, x + 8, y + r * 0.55, r * 1.05, r * 0.4, 0.35);
    D.ellipsePath(ctx, x, y + r * 0.45, r, r * 0.3);
    D.fs(ctx, '#546e7a', OL, 1.6);
    ctx.beginPath();
    ctx.arc(x, y + r * 0.45, r * 0.92, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, x - r * 0.35, y - r * 0.2, 2, x, y + r * 0.2, r, [[0, 'rgba(255,255,255,0.85)'], [0.4, 'rgba(178,235,242,0.65)'], [1, 'rgba(38,166,154,0.7)']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(55,71,79,0.7)';
    ctx.lineWidth = 1.4;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.45, r * 0.92 * (i / 4), r * 0.92, 0, Math.PI, 0);
      ctx.stroke();
    }
    // AVL logo
    if (!d.small) {
      D.circlePath(ctx, x, y + r * 0.1, r * 0.24);
      D.fs(ctx, '#0d47a1', OL, 1.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(r * 0.2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AVL', x, y + r * 0.11);
    } else {
      // a minion agent waving inside
      D.circlePath(ctx, x, y + r * 0.2, r * 0.22);
      D.fs(ctx, '#ffd83a', OL, 1);
      D.circlePath(ctx, x, y + r * 0.14, r * 0.09);
      D.fs(ctx, '#ffffff', OL, 0.7);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.45, r * 0.75, Math.PI * 1.15, Math.PI * 1.4);
    ctx.stroke();
  };

  DEC.kelp = (ctx, d, rnd) => {
    const x = d.x, y = d.y;
    for (let i = 0; i < 4; i++) {
      const bx = x + (i - 1.5) * 6, len = 26 + rnd() * 16;
      ctx.beginPath();
      ctx.moveTo(bx, y + 10);
      ctx.bezierCurveTo(bx - 8, y - len * 0.3, bx + 8, y - len * 0.6, bx + (rnd() - 0.5) * 8, y - len);
      ctx.lineCap = 'round';
      ctx.strokeStyle = OL;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.strokeStyle = i % 2 ? '#2e7d32' : '#558b2f';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  };

  DEC.coral = (ctx, d, rnd) => {
    const x = d.x, y = d.y;
    const col = ['#ff7043', '#ec407a', '#ab47bc', '#ffb74d'][Math.floor(rnd() * 4)];
    const branch = (bx, by, a, len, w, depth) => {
      const x2 = bx + Math.cos(a) * len, y2 = by + Math.sin(a) * len;
      ctx.lineCap = 'round';
      ctx.strokeStyle = OL;
      ctx.lineWidth = w + 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.stroke();
      if (depth > 0) {
        branch(x2, y2, a - 0.55, len * 0.72, w * 0.75, depth - 1);
        branch(x2, y2, a + 0.5, len * 0.7, w * 0.75, depth - 1);
      }
    };
    branch(x, y + 10, -Math.PI / 2, 12, 5, 2);
  };

  DEC.seastone = (ctx, d, rnd) => DEC.rock(ctx, Object.assign({}, d, { pal: ['#5d7d8a', '#8fb3bf', '#34505c'] }), rnd);

  DEC.treasure = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 4, y + 14, 22, 6, 0.3);
    D.rrPath(ctx, x - 16, y - 4, 32, 18, 3);
    D.fs(ctx, '#8d5524', OL, 1.3);
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 4);
    ctx.quadraticCurveTo(x, y - 18, x + 16, y - 4);
    ctx.closePath();
    D.fs(ctx, '#a0662f', OL, 1.3);
    for (let i = 0; i < 5; i++) {
      D.circlePath(ctx, x - 9 + i * 4.5, y - 6 - (i % 2) * 2, 2.6);
      D.fs(ctx, '#ffd740', OL, 0.6);
    }
    D.rrPath(ctx, x - 3, y - 2, 6, 6, 1);
    D.fs(ctx, '#ffc400', OL, 0.8);
  };

  DEC.anchor = (ctx, d) => {
    const x = d.x, y = d.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.4);
    ctx.strokeStyle = OL;
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 16);
    ctx.moveTo(-14, 6);
    ctx.quadraticCurveTo(0, 26, 14, 6);
    ctx.moveTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.stroke();
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 3.6;
    ctx.stroke();
    D.circlePath(ctx, 0, -21, 4);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3.6;
    ctx.stroke();
    ctx.restore();
  };

  DEC.clam = (ctx, d) => {
    const x = d.x, y = d.y;
    ctx.beginPath();
    ctx.arc(x, y, 14, Math.PI, 0);
    ctx.closePath();
    D.fs(ctx, '#f8bbd0', OL, 1.3);
    ctx.strokeStyle = 'rgba(173,20,87,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(Math.PI + (i * Math.PI) / 5) * 14, y + Math.sin(Math.PI + (i * Math.PI) / 5) * 14);
      ctx.stroke();
    }
    D.circlePath(ctx, x, y + 2, 4);
    ctx.fillStyle = D.rad(ctx, x - 1, y + 1, 0, x, y + 2, 4, [[0, '#ffffff'], [1, '#b0bec5']]);
    ctx.fill();
  };

  // ================================================================ DECOR: Bank of Evil
  DEC.vault = (ctx, d) => {
    const x = d.x, y = d.y, r = d.r;
    // gold spilling out of the open vault
    for (let i = 0; i < 9; i++) {
      D.rrPath(ctx, x - 40 + (i % 3) * 14, y + 26 + Math.floor(i / 3) * 6, 14, 6, 1.5);
      D.fs(ctx, '#ffc400', OL, 0.8);
    }
    D.circlePath(ctx, x, y, r + 8);
    ctx.fillStyle = D.lin(ctx, x - r, 0, x + r, 0, [[0, '#cfd8dc'], [1, '#546e7a']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 2;
    ctx.stroke();
    D.circlePath(ctx, x, y, r - 4);
    ctx.fillStyle = D.rad(ctx, x, y, 4, x, y, r, [[0, '#2b1d0e'], [1, '#0d0a06']]);
    ctx.fill();
    // stacks of gold inside
    for (let i = 0; i < 6; i++) {
      D.rrPath(ctx, x - 26 + (i % 3) * 18, y - 14 + Math.floor(i / 3) * 16, 16, 9, 2);
      D.fs(ctx, '#ffd740', OL, 0.8);
    }
    // the huge round door swung open to the side
    ctx.save();
    ctx.translate(x - r - 2, y + 4);
    ctx.scale(0.42, 1);
    D.circlePath(ctx, 0, 0, r);
    ctx.fillStyle = D.lin(ctx, -r, 0, r, 0, [[0, '#eceff1'], [1, '#78909c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3;
    ctx.stroke();
    D.circlePath(ctx, 0, 0, r * 0.4);
    D.fs(ctx, '#b0bec5', OL, 2);
    ctx.restore();
  };

  DEC.bankdesk = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 6, y + 26, 46, 10, 0.3);
    D.rrPath(ctx, x - 42, y - 6, 84, 30, 4);
    ctx.fillStyle = D.lin(ctx, 0, y - 6, 0, y + 24, [[0, '#8d6e63'], [1, '#4e342e']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(x - 42, y + 2, 84, 3);
    // the banker (a balding Mr. Perkins type) behind the desk
    D.ellipsePath(ctx, x + 18, y - 16, 12, 13);
    ctx.fillStyle = D.rad(ctx, x + 15, y - 20, 1, x + 18, y - 16, 13, [[0, '#ffe3cc'], [1, '#e2a07a']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    D.rrPath(ctx, x + 8, y - 6, 20, 8, 3);
    D.fs(ctx, '#263238', OL, 1);
    D.circlePath(ctx, x + 14, y - 17, 1.3);
    D.fs(ctx, '#222');
    D.circlePath(ctx, x + 22, y - 17, 1.3);
    D.fs(ctx, '#222');
    // papers and a pen
    D.rrPath(ctx, x - 32, y - 2, 20, 12, 1);
    D.fs(ctx, '#ffffff', OL, 0.8);
    D.rrPath(ctx, x - 28, y - 4, 20, 12, 1);
    D.fs(ctx, '#fafafa', OL, 0.8);
  };

  DEC.column = (ctx, d) => {
    const x = d.x, y = d.y, r = d.r;
    D.shadow(ctx, x + 8, y + 8, r * 1.3, r * 0.9, 0.3);
    D.rrPath(ctx, x - r - 4, y - r - 4, (r + 4) * 2, (r + 4) * 2, 3);
    D.fs(ctx, '#d7ccc8', OL, 1.4);
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.3, y - r * 0.3, 1, x, y, r, [[0, '#ffffff'], [0.6, '#eeeeee'], [1, '#bdbdbd']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,110,100,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55);
      ctx.lineTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95);
      ctx.stroke();
    }
    D.circlePath(ctx, x, y, r * 0.5);
    D.fs(ctx, '#fafafa', 'rgba(120,110,100,0.5)', 1);
  };

  DEC.goldstack = (ctx, d) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 4, y + 14, 28, 8, 0.3);
    const rows = [[3, 10], [2, 2], [1, -6]];
    rows.forEach(([n, yy]) => {
      for (let i = 0; i < n; i++) {
        const bx = x - n * 8 + i * 16 + 8;
        ctx.beginPath();
        ctx.moveTo(bx - 8, y + yy + 4);
        ctx.lineTo(bx - 6, y + yy - 3);
        ctx.lineTo(bx + 6, y + yy - 3);
        ctx.lineTo(bx + 8, y + yy + 4);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, 0, y + yy - 3, 0, y + yy + 4, [[0, '#fff59d'], [1, '#c79100']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  };

  function bag(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.quadraticCurveTo(-13, 2, -9, 9);
    ctx.lineTo(9, 9);
    ctx.quadraticCurveTo(13, 2, 5, -8);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, -10, 0, 10, 0, [[0, '#d7ccc8'], [1, '#8d6e63']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    D.rrPath(ctx, -6, -11, 12, 4, 2);
    D.fs(ctx, '#6d4c41', OL, 0.9);
    ctx.fillStyle = '#2e7d32';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 2);
    ctx.restore();
  }
  DEC.moneybags = (ctx, d) => {
    D.shadow(ctx, d.x + 4, d.y + 12, 24, 7, 0.3);
    bag(ctx, d.x - 9, d.y + 2, 1.1);
    bag(ctx, d.x + 9, d.y + 3, 1);
    bag(ctx, d.x, d.y - 6, 1.05);
  };
  DEC.moneybag = (ctx, d) => {
    D.shadow(ctx, d.x + 3, d.y + 10, 12, 5, 0.3);
    bag(ctx, d.x, d.y, 1);
  };

  DEC.plantpot = (ctx, d, rnd) => {
    const x = d.x, y = d.y;
    D.shadow(ctx, x + 3, y + 8, 16, 7, 0.3);
    D.circlePath(ctx, x, y, 11);
    D.fs(ctx, '#bcaaa4', OL, 1.2);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + rnd();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(8, -5, 17, 0);
      ctx.quadraticCurveTo(8, 5, 0, 0);
      D.fs(ctx, i % 2 ? '#2e7d32' : '#66bb6a', OL, 0.6);
      ctx.restore();
    }
  };

  DEC.banksign = (ctx, d) => {
    const x = d.x, y = d.y;
    D.rrPath(ctx, x - 150, y - 18, 300, 36, 6);
    ctx.fillStyle = D.lin(ctx, 0, y - 18, 0, y + 18, [[0, '#37474f'], [1, '#1c262b']]);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffd740';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BANK OF EVIL', x, y - 3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'italic 8px Georgia, serif';
    ctx.fillText('(formerly Lehman Brothers)', x, y + 11);
  };

  // ================================================================ feature textures
  // made on demand when a map with features starts
  function fxTextures(scene) {
    const mk = (key, w, h, fn) => D.make(scene, key, w, h, fn);
    // big red launch button for the coaster
    mk('mf_launch', 50, 58, (ctx) => {
      D.shadow(ctx, 26, 52, 18, 5, 0.35);
      D.rrPath(ctx, 19, 24, 12, 28, 3);
      D.fs(ctx, '#ffd83a', OL, 1.4);
      D.ellipsePath(ctx, 25, 26, 17, 9);
      D.fs(ctx, '#455a64', OL, 1.4);
      D.ellipsePath(ctx, 25, 20, 14, 10);
      ctx.fillStyle = D.rad(ctx, 21, 16, 1, 25, 20, 14, [[0, '#ff8a80'], [0.5, '#e53935'], [1, '#8e1c16']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GO!', 25, 19);
    });
    // a coaster car seen from above, pointing along +x, two minions riding
    mk('mf_coaster', 40, 28, (ctx) => {
      D.rrPath(ctx, 3, 4, 34, 20, 7);
      ctx.fillStyle = D.lin(ctx, 0, 4, 0, 24, [[0, '#ff8a80'], [0.5, '#e53935'], [1, '#8e1c16']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#ffd83a';
      ctx.fillRect(3, 12.5, 34, 3);
      minionHead(ctx, 13, 14, 5.4, 0);
      minionHead(ctx, 26, 14, 5.4, 0);
      // arms up in the air
      [[13, 6], [13, 22], [26, 6], [26, 22]].forEach(([x, y]) => {
        D.circlePath(ctx, x - 2, y, 1.8);
        D.fs(ctx, '#ffd83a', OL, 0.7);
      });
    });
    mk('mf_ferris', 176, 176, (ctx) => {
      const x = 88, y = 88, r = 70;
      ctx.strokeStyle = OL;
      ctx.lineWidth = 6;
      D.circlePath(ctx, x, y, r);
      ctx.stroke();
      ctx.strokeStyle = '#eceff1';
      ctx.lineWidth = 3.6;
      ctx.stroke();
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ctx.strokeStyle = OL;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.stroke();
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      const cols = ['#e53935', '#ffd83a', '#40c4ff', '#ab47bc', '#66bb6a', '#ff7043'];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        const gx = x + Math.cos(a) * r, gy = y + Math.sin(a) * r;
        D.rrPath(ctx, gx - 8, gy - 6, 16, 12, 4);
        D.fs(ctx, cols[i % cols.length], OL, 1.2);
        minionHead(ctx, gx, gy, 3.6, a);
      }
      D.circlePath(ctx, x, y, 12);
      D.fs(ctx, '#e53935', OL, 1.6);
      D.starPath(ctx, x, y, 5, 8, 3.4);
      D.fs(ctx, '#ffd83a', OL, 0.9);
    });
    mk('mf_carousel', 120, 120, (ctx) => {
      const x = 60, y = 60, r = 54;
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * TAU, a1 = ((i + 1) / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, r, a0, a1);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? '#ffffff' : '#e53935';
        ctx.fill();
      }
      D.circlePath(ctx, x, y, r);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = ((i + 0.5) / 12) * TAU;
        D.circlePath(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 3.4);
        D.fs(ctx, '#ffd83a', OL, 0.8);
      }
      D.circlePath(ctx, x, y, 9);
      D.fs(ctx, '#ffd83a', OL, 1.4);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x + 12, y - 14);
      ctx.lineTo(x, y - 10);
      ctx.closePath();
      D.fs(ctx, '#40c4ff', OL, 1);
    });
    // drawbridge: lowered deck (road continues) and raised (water + deck standing up)
    mk('mf_bridge_down', 70, 60, (ctx) => {
      D.rrPath(ctx, 5, 10, 60, 40, 3);
      ctx.fillStyle = D.lin(ctx, 0, 10, 0, 50, [[0, '#a1887f'], [1, '#6d4c41']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(62,39,35,0.6)';
      ctx.lineWidth = 1.2;
      for (let x = 11; x < 64; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 11);
        ctx.lineTo(x, 49);
        ctx.stroke();
      }
      [10, 50].forEach((y) => {
        D.rrPath(ctx, 3, y - 3, 64, 5, 2);
        D.fs(ctx, '#455a64', OL, 1.1);
      });
      [6, 64].forEach((x) => [7, 53].forEach((y) => {
        D.circlePath(ctx, x, y, 3);
        D.fs(ctx, '#90a4ae', OL, 0.8);
      }));
    });
    mk('mf_bridge_up', 70, 76, (ctx) => {
      // open water where the deck was
      D.rrPath(ctx, 6, 26, 58, 40, 3);
      ctx.fillStyle = D.lin(ctx, 0, 26, 0, 66, [[0, '#2f7fae'], [1, '#45a6db']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(16 + i * 13, 40 + (i % 2) * 12, 5, Math.PI * 1.1, Math.PI * 1.8);
        ctx.stroke();
      }
      // the deck, raised up and seen edge-on
      D.rrPath(ctx, 4, 6, 62, 22, 3);
      ctx.fillStyle = D.lin(ctx, 0, 6, 0, 28, [[0, '#8d6e63'], [1, '#5d4037']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(62,39,35,0.6)';
      ctx.lineWidth = 1.1;
      for (let x = 10; x < 64; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 7);
        ctx.lineTo(x, 27);
        ctx.stroke();
      }
      // warning stripes
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? '#ffd83a' : '#263238';
        ctx.fillRect(6 + i * 7.3, 22, 7.3, 4);
      }
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 22, 58, 4);
      // chains
      [10, 60].forEach((x) => {
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([2, 1.5]);
        ctx.beginPath();
        ctx.moveTo(x, 8);
        ctx.lineTo(x, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });
    ['mf_lever_0', 'mf_lever_1'].forEach((key, k) => mk(key, 54, 60, (ctx) => {
      D.shadow(ctx, 28, 54, 20, 5, 0.35);
      D.rrPath(ctx, 10, 30, 34, 24, 4);
      ctx.fillStyle = D.lin(ctx, 10, 0, 44, 0, [[0, '#ffab40'], [1, '#e65100']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#263238';
      ctx.fillRect(14, 40, 26, 4);
      // the handle leans towards the open route (up = north, down = south)
      const tip = k ? [36, 52] : [36, 6];
      ctx.lineCap = 'round';
      ctx.strokeStyle = OL;
      ctx.lineWidth = 5.4;
      ctx.beginPath();
      ctx.moveTo(27, 40);
      ctx.lineTo(tip[0], tip[1] - (k ? 18 : 0));
      ctx.stroke();
      ctx.strokeStyle = '#b0bec5';
      ctx.lineWidth = 3.2;
      ctx.stroke();
      D.circlePath(ctx, tip[0], tip[1] - (k ? 18 : 0), 6);
      D.fs(ctx, '#e53935', OL, 1.3);
      // arrow sign
      ctx.beginPath();
      if (k) {
        ctx.moveTo(10, 14);
        ctx.lineTo(20, 14);
        ctx.lineTo(15, 22);
      } else {
        ctx.moveTo(10, 22);
        ctx.lineTo(20, 22);
        ctx.lineTo(15, 14);
      }
      ctx.closePath();
      D.fs(ctx, '#69f0ae', OL, 1);
    }));
    mk('mf_shark', 96, 56, (ctx) => {
      // leaping shark, side view, nose to the right
      ctx.beginPath();
      ctx.moveTo(6, 30);
      ctx.lineTo(0, 16);
      ctx.lineTo(14, 26);
      ctx.quadraticCurveTo(40, 10, 70, 16);
      ctx.lineTo(56, 2);
      ctx.lineTo(78, 18);
      ctx.quadraticCurveTo(94, 24, 92, 32);
      ctx.quadraticCurveTo(70, 46, 30, 40);
      ctx.lineTo(14, 36);
      ctx.lineTo(0, 46);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 10, 0, 46, [[0, '#78909c'], [0.6, '#b0bec5'], [1, '#eceff1']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      // open jaws
      ctx.beginPath();
      ctx.moveTo(92, 32);
      ctx.lineTo(70, 33);
      ctx.lineTo(88, 38);
      ctx.closePath();
      D.fs(ctx, '#b71c1c', OL, 1);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(73 + i * 4.5, 32.6);
        ctx.lineTo(75 + i * 4.5, 35.5);
        ctx.lineTo(77 + i * 4.5, 32.4);
        ctx.fill();
      }
      D.circlePath(ctx, 80, 24, 2.4);
      D.fs(ctx, '#111');
      D.circlePath(ctx, 80.6, 23.4, 0.8);
      D.fs(ctx, '#fff');
      ctx.strokeStyle = 'rgba(55,71,79,0.7)';
      ctx.lineWidth = 1.2;
      [62, 66, 70].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 24);
        ctx.lineTo(x - 2, 32);
        ctx.stroke();
      });
    });
    mk('mf_fin', 30, 22, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(6, 18);
      ctx.quadraticCurveTo(12, 6, 22, 2);
      ctx.quadraticCurveTo(18, 10, 22, 18);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 6, 0, 22, 0, [[0, '#90a4ae'], [1, '#455a64']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(1, 19);
      ctx.quadraticCurveTo(14, 15, 29, 19);
      ctx.stroke();
    });
    mk('mf_feed', 48, 48, (ctx) => {
      D.circlePath(ctx, 24, 24, 20);
      ctx.fillStyle = D.rad(ctx, 18, 16, 2, 24, 24, 20, [[0, '#b3e5fc'], [1, '#0277bd']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.stroke();
      // a fish treat
      ctx.save();
      ctx.translate(24, 25);
      ctx.beginPath();
      ctx.ellipse(-2, 0, 9, 5.4, 0, 0, TAU);
      ctx.moveTo(6, 0);
      ctx.lineTo(13, -6);
      ctx.lineTo(13, 6);
      ctx.closePath();
      D.fs(ctx, '#ff8a65', OL, 1.2);
      D.circlePath(ctx, -6, -1, 1.3);
      D.fs(ctx, '#222');
      ctx.restore();
    });
    // AVL recall tube: a glass ring with a hatch around the track
    ['mf_tube', 'mf_tube_on'].forEach((key, k) => mk(key, 84, 84, (ctx) => {
      const x = 42, y = 42;
      if (k) TP().glowRing(ctx, x, y, 42, '#18ffff', 0.6);
      ctx.lineWidth = 9;
      D.circlePath(ctx, x, y, 33);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 11;
      ctx.stroke();
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 8;
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        D.circlePath(ctx, x + Math.cos(a) * 33, y + Math.sin(a) * 33, 2.2);
        D.fs(ctx, k ? '#18ffff' : '#cfd8dc', OL, 0.7);
      }
      if (k) {
        // swirling suction
        ctx.strokeStyle = 'rgba(128,222,234,0.85)';
        ctx.lineWidth = 2.4;
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          for (let i = 0; i <= 20; i++) {
            const t = i / 20, a = j * 2.1 + t * 4, r = 4 + t * 24;
            const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
            if (i) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
          }
          ctx.stroke();
        }
      }
      D.rrPath(ctx, x - 9, 2, 18, 10, 3);
      D.fs(ctx, k ? '#00e5ff' : '#455a64', OL, 1.2);
    }));
    mk('mf_vent', 44, 32, (ctx) => {
      D.blobPath(ctx, 22, 18, 17, 9, 0.18, D.rng(5));
      ctx.fillStyle = D.lin(ctx, 4, 0, 40, 0, [[0, '#8fb3bf'], [1, '#34505c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      D.ellipsePath(ctx, 22, 16, 8, 4.6);
      D.fs(ctx, '#0d2a33', OL, 1.2);
      D.circlePath(ctx, 18, 14, 1.6);
      D.fs(ctx, 'rgba(255,255,255,0.7)');
    });
    mk('mf_bubble', 14, 14, (ctx) => {
      D.circlePath(ctx, 7, 7, 5.5);
      D.fs(ctx, 'rgba(225,245,254,0.35)', 'rgba(255,255,255,0.95)', 1.2);
      D.circlePath(ctx, 5.4, 5.2, 1.4);
      D.fs(ctx, 'rgba(255,255,255,0.9)');
    });
    // Bank security panel and the laser gate posts
    mk('mf_panel', 50, 56, (ctx) => {
      D.shadow(ctx, 26, 52, 18, 5, 0.35);
      D.rrPath(ctx, 7, 6, 36, 44, 5);
      ctx.fillStyle = D.lin(ctx, 7, 0, 43, 0, [[0, '#90a4ae'], [1, '#455a64']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      D.rrPath(ctx, 12, 11, 26, 14, 2);
      D.fs(ctx, '#102027', OL, 1);
      ctx.strokeStyle = '#ff5252';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(14, 18);
      ctx.lineTo(19, 18);
      ctx.lineTo(21, 14);
      ctx.lineTo(24, 22);
      ctx.lineTo(27, 18);
      ctx.lineTo(36, 18);
      ctx.stroke();
      D.circlePath(ctx, 25, 37, 8);
      ctx.fillStyle = D.rad(ctx, 23, 35, 1, 25, 37, 8, [[0, '#ff8a80'], [1, '#b71c1c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });
    mk('mf_laserpost', 16, 22, (ctx) => {
      D.rrPath(ctx, 3, 4, 10, 16, 3);
      D.fs(ctx, '#37474f', OL, 1.2);
      D.circlePath(ctx, 8, 8, 3);
      D.fs(ctx, '#ff1744', OL, 0.8);
    });
    // "LOANS" sign that hangs over the banker's desk
    mk('mf_loan', 76, 40, (ctx) => {
      D.rrPath(ctx, 4, 6, 68, 28, 6);
      ctx.fillStyle = D.lin(ctx, 0, 6, 0, 34, [[0, '#66bb6a'], [1, '#1b5e20']]);
      ctx.fill();
      ctx.strokeStyle = '#ffd740';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$ LOANS $', 38, 21);
    });
  }

  A.fxTextures = fxTextures;
  A.helpers.minionHead = minionHead;
})();
