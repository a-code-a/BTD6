// Main menu artwork: the sunset backdrop (moon, Gru's house, El Macho's
// volcano), the goggle logo, drifting clouds, sparkles and menu icons.
// Also hosts small helpers shared by every menu screen.
(function () {
  const D = MT.Draw;
  const OL = D.OL;
  const W = MT.CFG.W, H = MT.CFG.H;
  const LW = 820, LH = 290; // logo texture size

  // ---------------------------------------------------------------- backdrop
  function ridge(ctx, pts, fill) {
    ctx.beginPath();
    ctx.moveTo(-10, H + 10);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(W + 10, H + 10);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function wave(y0, amp, f, ph, step = 8) {
    const pts = [];
    for (let x = -10; x <= W + 10; x += step) pts.push([x, y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.7 + ph * 1.9) * amp * 0.35]);
    return pts;
  }

  function paintBackdrop(ctx) {
    const rnd = D.rng(4242);
    // sky
    ctx.fillStyle = D.lin(ctx, 0, 0, 0, H, [[0, '#120d3a'], [0.32, '#3b1f6e'], [0.55, '#8a3a8c'], [0.7, '#e2577a'], [0.8, '#ff9a5c'], [0.9, '#ffc677']]);
    ctx.fillRect(0, 0, W, H);
    // stars, fading towards the horizon
    for (let i = 0; i < 320; i++) {
      const y = Math.pow(rnd(), 1.7) * H * 0.62, x = rnd() * W;
      D.circlePath(ctx, x, y, 0.5 + rnd() * 1.1);
      D.fs(ctx, `rgba(255,255,255,${(0.25 + rnd() * 0.7) * (1 - y / (H * 0.62))})`);
    }
    // the moon (Gru still wants it)
    const mx = 1118, my = 118, mr = 62;
    D.circlePath(ctx, mx, my, mr * 2.8);
    ctx.fillStyle = D.rad(ctx, mx, my, mr * 0.8, mx, my, mr * 2.8, [[0, 'rgba(255,240,200,0.35)'], [1, 'rgba(255,240,200,0)']]);
    ctx.fill();
    D.circlePath(ctx, mx, my, mr);
    ctx.fillStyle = D.rad(ctx, mx - mr * 0.35, my - mr * 0.35, 4, mx, my, mr, [[0, '#fffdf0'], [0.6, '#f6e7b8'], [1, '#d8c286']]);
    ctx.fill();
    [[-18, -14, 12], [20, 10, 16], [-10, 26, 8], [26, -24, 7], [-32, 8, 6], [4, -34, 5]].forEach(([cx, cy, r]) => {
      D.circlePath(ctx, mx + cx, my + cy, r);
      D.fs(ctx, 'rgba(170,150,100,0.35)');
      ctx.beginPath();
      ctx.arc(mx + cx, my + cy, r, 0.2, 2.2);
      ctx.strokeStyle = 'rgba(255,255,240,0.5)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    // far mountains
    const far = [];
    let y = 470;
    for (let x = -10; x <= W + 10; x += 40) {
      y = 430 + rnd() * 70;
      far.push([x, y]);
    }
    ridge(ctx, far, D.lin(ctx, 0, 420, 0, 560, [[0, '#b9578f'], [1, '#d9708a']]));
    // El Macho's volcano (right)
    const vx = 1060;
    ctx.beginPath();
    ctx.moveTo(840, 600);
    ctx.quadraticCurveTo(960, 470, 1018, 352);
    ctx.lineTo(1100, 350);
    ctx.quadraticCurveTo(1170, 470, 1300, 590);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, 350, 0, 600, [[0, '#5a2a5e'], [1, '#7c3b70']]);
    ctx.fill();
    // lava streaks
    ctx.lineCap = 'round';
    [[1030, 360, 990, 470, 4], [1062, 356, 1070, 450, 3], [1088, 360, 1130, 480, 3.5]].forEach(([x0, y0, x1, y1, w]) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2 + 8, (y0 + y1) / 2, x1, y1);
      ctx.strokeStyle = 'rgba(255,120,40,0.4)';
      ctx.lineWidth = w * 2.6;
      ctx.stroke();
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = w;
      ctx.stroke();
    });
    D.ellipsePath(ctx, vx, 352, 42, 8);
    ctx.fillStyle = D.rad(ctx, vx, 352, 2, vx, 352, 42, [[0, '#fff3a0'], [0.5, '#ff8a2a'], [1, '#c2361a']]);
    ctx.fill();
    // purple PX-41 smoke plume
    for (let i = 0; i < 7; i++) {
      const sx = vx - 14 - i * 12 + Math.sin(i) * 10, sy = 334 - i * 19, sr = 16 + i * 5;
      D.circlePath(ctx, sx, sy, sr);
      D.fs(ctx, `rgba(${120 + i * 6},${60 + i * 4},${150 + i * 5},${0.5 - i * 0.06})`);
    }
    // mid hills
    ridge(ctx, wave(540, 18, 0.006, 1.2), D.lin(ctx, 0, 500, 0, 650, [[0, '#6b3576'], [1, '#4a2560']]));
    // Gru's house on the hill (left)
    const house = D.canvas(240, 200);
    MT.MapArt.DEC.house(house.ctx, { x: 120, y: 168 });
    house.ctx.globalCompositeOperation = 'source-atop';
    house.ctx.fillStyle = 'rgba(70,30,90,0.35)';
    house.ctx.fillRect(0, 0, 240, 200);
    const hx = 232, hy = 566, hs = 0.95;
    ctx.drawImage(house.c, hx - 120 * hs, hy - 168 * hs, 240 * hs, 200 * hs);
    // window glow
    [[-40, -36], [40, -36], [0, -100]].forEach(([wx, wy]) => {
      const gx = hx + wx * hs, gy = hy + wy * hs;
      D.circlePath(ctx, gx, gy, 22);
      ctx.fillStyle = D.rad(ctx, gx, gy, 2, gx, gy, 22, [[0, 'rgba(255,220,120,0.45)'], [1, 'rgba(255,220,120,0)']]);
      ctx.fill();
    });
    // near hills
    ridge(ctx, wave(585, 12, 0.009, 3.1), D.lin(ctx, 0, 560, 0, 680, [[0, '#3f2257'], [1, '#2a173f']]));
    // foreground meadow
    const ground = () => {
      ctx.beginPath();
      ctx.moveTo(-10, 628);
      ctx.bezierCurveTo(300, 588, 900, 592, W + 10, 630);
      ctx.lineTo(W + 10, H + 10);
      ctx.lineTo(-10, H + 10);
      ctx.closePath();
    };
    ground();
    ctx.fillStyle = D.lin(ctx, 0, 590, 0, H, [[0, '#62b047'], [1, '#2b6a2a']]);
    ctx.fill();
    ground();
    ctx.fillStyle = D.lin(ctx, 700, 0, W, 0, [[0, 'rgba(80,25,110,0)'], [1, 'rgba(80,25,110,0.6)']]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, 628);
    ctx.bezierCurveTo(300, 588, 900, 592, W + 10, 630);
    ctx.strokeStyle = D.lin(ctx, 0, 0, W, 0, [[0, '#b4f08a'], [0.55, '#b4f08a'], [1, '#c99bff']]);
    ctx.lineWidth = 3;
    ctx.stroke();
    // grass blades along the hill line
    const edgeY = (x) => {
      // sample the bezier: x is close enough to linear in t here
      const t = (x + 10) / (W + 20);
      const u = 1 - t;
      return u * u * u * 628 + 3 * u * u * t * 588 + 3 * u * t * t * 592 + t * t * t * 630;
    };
    for (let x = 0; x < W; x += 5) {
      const ey = edgeY(x) + 2, evil = x > 900;
      ctx.strokeStyle = evil ? (rnd() > 0.5 ? '#5a3a7a' : '#7b55a0') : (rnd() > 0.5 ? '#3f8a30' : '#7ccc5a');
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, ey);
      ctx.lineTo(x + (rnd() - 0.5) * 4, ey - 4 - rnd() * 6);
      ctx.stroke();
    }
    for (let i = 0; i < 900; i++) {
      const x = rnd() * W, yy = edgeY(x) + 8 + rnd() * (H - edgeY(x));
      ctx.strokeStyle = x > 900 ? 'rgba(150,110,190,0.35)' : rnd() > 0.5 ? 'rgba(30,80,20,0.4)' : 'rgba(170,230,110,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + (rnd() - 0.5) * 3, yy - 3 - rnd() * 4);
      ctx.stroke();
    }
    // flowers on Gru's side, goo bubbles on the villains' side
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 700, yy = edgeY(x) + 14 + rnd() * 90;
      MT.MapArt.DEC.flowers(ctx, { x, y: yy }, rnd);
    }
    for (let i = 0; i < 9; i++) {
      const x = 960 + rnd() * 300, yy = edgeY(x) + 24 + rnd() * 70, r = 6 + rnd() * 10;
      D.ellipsePath(ctx, x, yy, r * 1.6, r * 0.6);
      ctx.fillStyle = D.rad(ctx, x - r * 0.4, yy - r * 0.2, 1, x, yy, r * 1.6, [[0, '#e1b8ff'], [1, '#7b2fb0']]);
      ctx.fill();
      D.circlePath(ctx, x + r * 0.4, yy - r * 0.3, r * 0.25);
      D.fs(ctx, 'rgba(255,255,255,0.5)');
    }
    // vignette
    ctx.fillStyle = D.rad(ctx, W / 2, H * 0.45, H * 0.45, W / 2, H * 0.45, W * 0.72, [[0, 'rgba(10,5,30,0)'], [1, 'rgba(10,5,30,0.55)']]);
    ctx.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------- logo
  function paintLogo(ctx) {
    const cx = LW / 2;
    const font = '138px "Luckiest Guy", "Arial Black", Impact, sans-serif';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const word = 'MINION';
    const gap = 6;
    const widths = word.split('').map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (word.length - 1);
    const base = 158, strapY = 104;
    const rot = [-0.07, 0.05, -0.03, 0.06, 0, -0.06];
    const dy = [2, -6, 4, -4, 0, 6];
    let x = cx - total / 2;
    const L = word.split('').map((c, i) => {
      const o = { c, x: x + widths[i] / 2, w: widths[i], r: rot[i], dy: dy[i] };
      x += widths[i] + gap;
      return o;
    });
    // goggle strap behind the letters
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(30, strapY - 13);
    ctx.quadraticCurveTo(cx, strapY - 22, LW - 30, strapY - 13);
    ctx.lineTo(LW - 30, strapY + 13);
    ctx.quadraticCurveTo(cx, strapY + 4, 30, strapY + 13);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, strapY - 16, 0, strapY + 14, [[0, '#3b3b3b'], [0.5, '#1d1d1d'], [1, '#0d0d0d']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    const isO = (l) => l.c === 'O';
    // pass 1: 3D extrusion
    L.forEach((l) => {
      if (isO(l)) return;
      ctx.save();
      ctx.translate(l.x, base + l.dy);
      ctx.rotate(l.r);
      ctx.lineJoin = 'round';
      ctx.lineWidth = 16;
      ctx.strokeStyle = OL;
      ctx.strokeText(l.c, 0, 12);
      for (let k = 12; k >= 1; k--) {
        ctx.fillStyle = k > 9 ? '#6e3600' : '#b06200';
        ctx.fillText(l.c, 0, k);
      }
      ctx.restore();
    });
    // pass 2: faces
    L.forEach((l) => {
      if (isO(l)) return;
      ctx.save();
      ctx.translate(l.x, base + l.dy);
      ctx.rotate(l.r);
      ctx.lineJoin = 'round';
      ctx.lineWidth = 11;
      ctx.strokeStyle = OL;
      ctx.strokeText(l.c, 0, 0);
      ctx.fillStyle = D.lin(ctx, 0, -104, 0, 0, [[0, '#fff8b0'], [0.45, '#ffd61f'], [1, '#ff9800']]);
      ctx.fillText(l.c, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-l.w, -120, l.w * 2, 52);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.fillText(l.c, 0, 0);
      ctx.restore();
      ctx.restore();
    });
    // the O is a minion goggle
    const g = L.find(isO);
    const gx = g.x, gy = strapY + 2, gr = Math.max(54, g.w * 0.56);
    D.circlePath(ctx, gx + 3, gy + 7, gr);
    D.fs(ctx, 'rgba(0,0,0,0.35)');
    D.circlePath(ctx, gx, gy, gr);
    ctx.fillStyle = D.lin(ctx, gx - gr, gy - gr, gx + gr, gy + gr, [[0, '#ffffff'], [0.35, '#c9ced4'], [1, '#5d636b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 4;
    ctx.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.3;
      D.circlePath(ctx, gx + Math.cos(a) * gr * 0.88, gy + Math.sin(a) * gr * 0.88, 3);
      D.fs(ctx, '#e8eaed', OL, 1);
    }
    D.circlePath(ctx, gx, gy, gr * 0.76);
    D.fs(ctx, '#3d4249', OL, 2.5);
    D.circlePath(ctx, gx, gy, gr * 0.68);
    ctx.fillStyle = D.rad(ctx, gx - 8, gy - 8, 4, gx, gy, gr * 0.68, [[0, '#ffffff'], [1, '#e3e6ea']]);
    ctx.fill();
    const ix = gx + gr * 0.14, iy = gy + gr * 0.06;
    D.circlePath(ctx, ix, iy, gr * 0.32);
    ctx.fillStyle = D.rad(ctx, ix - 4, iy - 4, 2, ix, iy, gr * 0.32, [[0, '#c98a4a'], [0.6, '#7b4a1e'], [1, '#4a2a0e']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    D.circlePath(ctx, ix, iy, gr * 0.15);
    D.fs(ctx, '#140c06');
    D.circlePath(ctx, ix - gr * 0.12, iy - gr * 0.12, gr * 0.08);
    D.fs(ctx, '#ffffff');
    // glass reflection
    ctx.beginPath();
    ctx.arc(gx, gy, gr * 0.58, Math.PI * 1.08, Math.PI * 1.45);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // ---- ribbon banner
    const sub = 'TOWER DEFENSE';
    ctx.font = '44px "Luckiest Guy", "Arial Black", Impact, sans-serif';
    const sp = 3;
    const cw = sub.split('').map((c) => ctx.measureText(c).width);
    const tw = cw.reduce((a, b) => a + b, 0) + sp * (sub.length - 1);
    const x0 = cx - tw / 2 - 46, x1 = cx + tw / 2 + 46, half = (x1 - x0) / 2;
    const by = (xx) => 226 - 12 * (1 - Math.pow((xx - cx) / half, 2));
    const slope = (xx) => (24 * (xx - cx)) / (half * half);
    const bh = 30;
    // tails
    [[-1, x0], [1, x1]].forEach(([s, ex]) => {
      const tx = ex + s * 58, ty = by(ex) + 16;
      ctx.beginPath();
      ctx.moveTo(ex - s * 14, ty - bh + 4);
      ctx.lineTo(tx, ty - bh + 4);
      ctx.lineTo(tx - s * 18, ty);
      ctx.lineTo(tx, ty + bh - 4);
      ctx.lineTo(ex - s * 14, ty + bh - 4);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, ty - bh, 0, ty + bh, [[0, '#3566b0'], [1, '#1d3f78']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.stroke();
      // fold
      ctx.beginPath();
      ctx.moveTo(ex, by(ex) + bh);
      ctx.lineTo(ex - s * 14, ty + bh - 4);
      ctx.lineTo(ex - s * 14, by(ex) + bh - 6);
      ctx.closePath();
      D.fs(ctx, '#132a52', OL, 2);
    });
    // band
    const band = () => {
      ctx.beginPath();
      for (let xx = x0; xx <= x1 + 0.1; xx += 6) {
        if (xx === x0) ctx.moveTo(xx, by(xx) - bh);
        else ctx.lineTo(xx, by(xx) - bh);
      }
      for (let xx = x1; xx >= x0 - 0.1; xx -= 6) ctx.lineTo(xx, by(xx) + bh);
      ctx.closePath();
    };
    band();
    ctx.fillStyle = D.lin(ctx, 0, 190, 0, 260, [[0, '#5b95e0'], [0.5, '#3a74c4'], [1, '#2a5799']]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = x0 - 80; i < x1; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i, 170);
      ctx.lineTo(i + 80, 270);
      ctx.stroke();
    }
    ctx.restore();
    band();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    // stitching
    ctx.save();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = 'rgba(255,209,102,0.9)';
    ctx.lineWidth = 2;
    [-bh + 7, bh - 7].forEach((o) => {
      ctx.beginPath();
      for (let xx = x0 + 8; xx <= x1 - 8; xx += 6) {
        if (xx === x0 + 8) ctx.moveTo(xx, by(xx) + o);
        else ctx.lineTo(xx, by(xx) + o);
      }
      ctx.stroke();
    });
    ctx.restore();
    // letters following the curve
    let lx = cx - tw / 2;
    sub.split('').forEach((c, i) => {
      const mx = lx + cw[i] / 2;
      lx += cw[i] + sp;
      if (c === ' ') return;
      ctx.save();
      ctx.translate(mx, by(mx) + 16);
      ctx.rotate(Math.atan(slope(mx)));
      ctx.lineJoin = 'round';
      ctx.lineWidth = 8;
      ctx.strokeStyle = OL;
      ctx.strokeText(c, 0, 3);
      ctx.strokeText(c, 0, 0);
      ctx.fillStyle = D.lin(ctx, 0, -34, 0, 0, [[0, '#ffffff'], [1, '#cfe6ff']]);
      ctx.fillText(c, 0, 0);
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- small art
  function cloud(ctx, w, h, seed) {
    const rnd = D.rng(seed);
    const blobs = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      blobs.push([w * 0.15 + t * w * 0.7, h * 0.62 - Math.sin(t * Math.PI) * h * 0.22 + (rnd() - 0.5) * 6, h * (0.2 + Math.sin(t * Math.PI) * 0.2 + rnd() * 0.06)]);
    }
    const shape = () => {
      ctx.beginPath();
      blobs.forEach(([x, y, r]) => {
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      });
      ctx.rect(w * 0.15, h * 0.62, w * 0.7, h * 0.14);
    };
    shape();
    ctx.fillStyle = D.lin(ctx, 0, h * 0.2, 0, h * 0.8, [[0, '#ffd1e0'], [0.5, '#e98fb6'], [1, '#9a4f8f']]);
    ctx.fill();
  }

  function generate(scene) {
    D.make(scene, 'menu_bg', W, H, paintBackdrop);
    D.make(scene, 'menu_logo', LW, LH, paintLogo);
    [0, 1, 2].forEach((i) => D.make(scene, 'menu_cloud' + i, 260, 90, (ctx) => cloud(ctx, 260, 90, 31 + i * 17)));
    D.make(scene, 'menu_glow', 128, 128, (ctx) => {
      D.circlePath(ctx, 64, 64, 64);
      ctx.fillStyle = D.rad(ctx, 64, 64, 0, 64, 64, 64, [[0, 'rgba(255,255,255,0.9)'], [0.4, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
      ctx.fill();
    });
    D.make(scene, 'menu_star', 24, 24, (ctx) => {
      D.circlePath(ctx, 12, 12, 8);
      ctx.fillStyle = D.rad(ctx, 12, 12, 0, 12, 12, 8, [[0, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]);
      ctx.fill();
      D.starPath(ctx, 12, 12, 4, 11, 2.2);
      D.fs(ctx, '#ffffff');
    });
    D.make(scene, 'menu_streak', 160, 10, (ctx) => {
      ctx.fillStyle = D.lin(ctx, 0, 0, 160, 0, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,250,220,0.95)']]);
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(156, 2.5);
      ctx.lineTo(156, 7.5);
      ctx.closePath();
      ctx.fill();
      D.circlePath(ctx, 155, 5, 3.5);
      D.fs(ctx, '#ffffff');
    });
    // ---- icons (32x32)
    const ic = (key, fn) => D.make(scene, key, 32, 32, fn);
    ic('ic_hero', (ctx) => {
      ctx.fillStyle = '#1b1b1b';
      ctx.fillRect(1, 13, 30, 6);
      D.circlePath(ctx, 16, 16, 11);
      ctx.fillStyle = D.lin(ctx, 5, 5, 27, 27, [[0, '#ffffff'], [1, '#7d848c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 2;
      ctx.stroke();
      D.circlePath(ctx, 16, 16, 7.5);
      D.fs(ctx, '#ffffff', OL, 1.4);
      D.circlePath(ctx, 17, 17, 3.6);
      D.fs(ctx, '#7b4a1e');
      D.circlePath(ctx, 17, 17, 1.7);
      D.fs(ctx, '#111');
    });
    ic('ic_book', (ctx) => {
      D.rrPath(ctx, 5, 4, 22, 25, 2);
      D.fs(ctx, '#f5f0e1', OL, 1.8);
      D.rrPath(ctx, 4, 3, 21, 25, 2);
      ctx.fillStyle = D.lin(ctx, 4, 0, 25, 0, [[0, '#8a3fd8'], [1, '#55208f']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#ffd83a';
      ctx.fillRect(7, 3, 2.5, 25);
      MT.TowerArt.props.banana(ctx, 17, 15, 0.75, 0.5, '#ffe14a');
    });
    ic('ic_help', (ctx) => {
      D.circlePath(ctx, 16, 16, 13);
      D.fs(ctx, '#ffffff', OL, 2);
      ctx.fillStyle = '#3a7fe0';
      ctx.font = '22px "Luckiest Guy", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 16, 18);
    });
    ic('ic_trophy', (ctx) => {
      ctx.beginPath();
      ctx.moveTo(8, 5);
      ctx.lineTo(24, 5);
      ctx.quadraticCurveTo(24, 19, 16, 20);
      ctx.quadraticCurveTo(8, 19, 8, 5);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 8, 0, 24, 0, [[0, '#fff2a8'], [1, '#d99a00']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(7, 10, 4, Math.PI * 0.5, Math.PI * 1.5);
      ctx.moveTo(25, 6);
      ctx.arc(25, 10, 4, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      D.rrPath(ctx, 13, 20, 6, 5, 1);
      D.fs(ctx, '#d99a00', OL, 1.4);
      D.rrPath(ctx, 9, 25, 14, 4, 1);
      D.fs(ctx, '#8d6e63', OL, 1.4);
    });
    ic('ic_arrow', (ctx) => {
      ctx.beginPath();
      ctx.moveTo(9, 5);
      ctx.lineTo(25, 16);
      ctx.lineTo(9, 27);
      ctx.closePath();
      D.fs(ctx, '#ffffff', OL, 2.4);
    });
    ic('ic_skull', (ctx) => {
      D.circlePath(ctx, 16, 14, 11);
      D.fs(ctx, '#a35bdc', OL, 2);
      D.rrPath(ctx, 10, 20, 12, 8, 2);
      D.fs(ctx, '#a35bdc', OL, 2);
      D.circlePath(ctx, 12, 14, 3.2);
      D.fs(ctx, '#fff', OL, 1);
      D.circlePath(ctx, 20, 14, 3.2);
      D.fs(ctx, '#fff', OL, 1);
      ctx.fillStyle = '#fff';
      ctx.fillRect(12.5, 22, 2, 4);
      ctx.fillRect(17.5, 22, 2, 4);
    });
  }

  // ---------------------------------------------------------------- shared scene helpers
  // Paints the animated sunset backdrop into a menu scene.
  function backdrop(scene, o = {}) {
    scene.add.image(W / 2, H / 2, 'menu_bg').setScale(1 / D.S);
    const rnd = D.rng(Math.floor(Math.random() * 1e6));
    for (let i = 0; i < 16; i++) {
      const s = scene.add.image(rnd() * W, 10 + Math.pow(rnd(), 1.5) * 280, 'menu_star').setScale((0.4 + rnd() * 0.35) / D.S).setAlpha(0.2);
      scene.tweens.add({ targets: s, alpha: { from: 0.15, to: 0.95 }, scale: s.scale * 1.3, duration: 700 + rnd() * 1400, yoyo: true, repeat: -1, delay: rnd() * 2000, ease: 'Sine.easeInOut' });
    }
    const clouds = [];
    for (let i = 0; i < 5; i++) {
      const c = scene.add.image(rnd() * (W + 300) - 150, 200 + rnd() * 200, 'menu_cloud' + (i % 3));
      c.setScale((0.45 + rnd() * 0.4) / D.S).setAlpha(0.5 + rnd() * 0.3);
      c.v = 6 + rnd() * 10;
      clouds.push(c);
    }
    const tick = (t, dt) => {
      clouds.forEach((c) => {
        c.x += (c.v * dt) / 1000;
        if (c.x > W + 160) c.x = -160;
      });
    };
    scene.events.on('update', tick);
    scene.events.once('shutdown', () => scene.events.off('update', tick));
    // the occasional shooting star
    scene.time.addEvent({
      delay: 3800,
      loop: true,
      callback: () => {
        if (Math.random() < 0.35) return;
        const x = 200 + Math.random() * 800, y = 20 + Math.random() * 120;
        const st = scene.add.image(x, y, 'menu_streak').setScale(0.5).setAngle(150 + Math.random() * 20).setAlpha(0);
        if (o.dim) st.setDepth(-1);
        const a = Phaser.Math.DegToRad(st.angle);
        scene.tweens.add({ targets: st, x: x + Math.cos(a) * 260, y: y + Math.sin(a) * 260, alpha: { from: 1, to: 0 }, duration: 700, onComplete: () => st.destroy() });
      },
    });
    if (o.dim) scene.add.rectangle(0, 0, W, H, 0x0a0620, o.dim).setOrigin(0);
  }

  // Scale an image so it fits inside w x h (logical px), keeping its aspect.
  function fit(img, w, h) {
    const k = Math.min(w / img.width, h / img.height);
    img.setScale(k);
    return img;
  }

  function title(scene, x, y, str, size, c1 = '#fff27a', c2 = '#ffb800') {
    const t = MT.text(scene, x, y, str, size, { title: true, strokeThickness: Math.round(size / 6) });
    const grd = t.context.createLinearGradient(0, 0, 0, t.height);
    grd.addColorStop(0.15, c1);
    grd.addColorStop(0.85, c2);
    t.setFill(grd);
    return t;
  }

  // Fade to another scene.
  function go(scene, key, data) {
    MT.Audio.init();
    if (scene._leaving) return;
    scene._leaving = true;
    scene.cameras.main.fadeOut(240, 10, 8, 30);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
  }

  // Standard sub-screen header: title + back button.
  function header(scene, str, back = 'Menu') {
    title(scene, W / 2, 50, str, 50);
    new MT.UI.Button(scene, 84, 48, 128, 50, { style: 'red', icon: 'ic_home', label: 'BACK', size: 20, onClick: () => go(scene, back) });
    scene.input.keyboard.on('keydown-ESC', () => go(scene, back));
  }

  function bob(scene, obj, amp = 6, dur = 700, delay = 0) {
    scene.tweens.add({ targets: obj, y: obj.y - amp, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay });
  }

  MT.MenuArt = { generate, backdrop, fit, title, go, header, bob };
})();
