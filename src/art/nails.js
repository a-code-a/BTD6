// Nail Minion artwork: the carpenter minion (per upgrade combination), the
// nail piles / mines / rolling spike balls it puts on the track, and a shared
// painter for good-looking nails.
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;
  const TA = MT.TowerArt;
  const P = TA.painters;
  const { glowRing, helmet } = TA.props;
  const B = { cx: 42, cy: 49, w: 30, h: 42 };
  const FOOT = 76;

  // [light, mid, dark, head] per metal
  const PAL = {
    steel: ['#f7f9fa', '#b0bec5', '#4f6470', '#d5dde2'],
    rust: ['#f0b07a', '#b5622b', '#5a2a0c', '#a65427'],
    hot: ['#fffde0', '#ff9a1f', '#c2330a', '#ff7a00'],
    chrome: ['#ffffff', '#c3d7e8', '#36536b', '#eaf4fc'],
    iron: ['#b8c4cc', '#5f707b', '#1f2a30', '#7d8c96'],
  };

  // ------------------------------------------------------------ one nail
  // Drawn lying on the ground: head at (x, y), pointing along `rot`.
  function nail(ctx, x, y, len, rot, pal, w = 1.8) {
    const c = PAL[pal] || PAL.steel;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    // soft drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.moveTo(1, 1.4 - w / 2);
    ctx.lineTo(len * 0.84 + 1, 1.4 - w / 2);
    ctx.lineTo(len + 1, 1.4);
    ctx.lineTo(len * 0.84 + 1, 1.4 + w / 2);
    ctx.lineTo(1, 1.4 + w / 2);
    ctx.closePath();
    ctx.fill();
    // shaft + point
    ctx.beginPath();
    ctx.moveTo(0, -w / 2);
    ctx.lineTo(len * 0.82, -w / 2);
    ctx.lineTo(len, 0);
    ctx.lineTo(len * 0.82, w / 2);
    ctx.lineTo(0, w / 2);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -w / 2, 0, w / 2, [[0, c[0]], [0.45, c[1]], [1, c[2]]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // grip rings near the head
    ctx.strokeStyle = D.rgba(c[2], 0.7);
    ctx.lineWidth = 0.45;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(w * (0.9 + i * 0.7), -w / 2);
      ctx.lineTo(w * (0.9 + i * 0.7), w / 2);
      ctx.stroke();
    }
    // head
    D.ellipsePath(ctx, 0, 0, w * 0.55, w * 1.35);
    ctx.fillStyle = D.lin(ctx, 0, -w * 1.4, 0, w * 1.4, [[0, c[0]], [1, c[3]]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  }

  // a nail standing on its head with the point up (the dangerous kind)
  function spike(ctx, x, y, h, pal, w = 2.4) {
    const c = PAL[pal] || PAL.steel;
    D.ellipsePath(ctx, x + 1, y + 0.6, w * 1.2, w * 0.45);
    D.fs(ctx, 'rgba(0,0,0,0.25)');
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w * 0.3, y - h * 0.8);
    ctx.lineTo(x, y - h);
    ctx.lineTo(x + w * 0.3, y - h * 0.8);
    ctx.lineTo(x + w / 2, y);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, x - w / 2, 0, x + w / 2, 0, [[0, c[0]], [0.5, c[1]], [1, c[2]]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    D.ellipsePath(ctx, x, y, w * 0.95, w * 0.38);
    D.fs(ctx, c[3], OL, 0.6);
    // glint on the tip
    D.circlePath(ctx, x - w * 0.12, y - h * 0.82, 0.55);
    D.fs(ctx, 'rgba(255,255,255,0.95)');
  }

  // a scattered heap of nails, centred on (cx, cy)
  function pile(ctx, cx, cy, rx, ry, pal, seed, opts = {}) {
    const rnd = D.rng(seed);
    const n = opts.n || 9;
    const len = opts.len || 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.9;
      const r = 0.25 + rnd() * 0.75;
      const x = cx + Math.cos(a) * rx * r * 0.7, y = cy + Math.sin(a) * ry * r * 0.7;
      nail(ctx, x - Math.cos(a) * len * 0.45, y - Math.sin(a) * len * 0.25, len * (0.8 + rnd() * 0.4), a + (rnd() - 0.5) * 1.4, pal, opts.w || 1.8);
    }
    const ups = opts.up != null ? opts.up : 3;
    for (let i = 0; i < ups; i++) {
      spike(ctx, cx + (rnd() - 0.5) * rx * 0.9, cy + (rnd() - 0.3) * ry * 0.6, (opts.upH || 7) * (0.8 + rnd() * 0.4), pal, (opts.w || 1.8) * 1.3);
    }
  }

  function glowDisc(ctx, x, y, r, col, a) {
    ctx.fillStyle = D.rad(ctx, x, y, 0, x, y, r, [[0, D.rgba(col, a)], [1, D.rgba(col, 0)]]);
    D.circlePath(ctx, x, y, r);
    ctx.fill();
  }

  function sparkle(ctx, x, y, r, col = '#ffffff') {
    D.starPath(ctx, x, y, 4, r, r * 0.28, 0);
    D.fs(ctx, col);
  }

  // iron ball covered in spikes (rolling balls, mines, crane)
  function spikeBall(ctx, x, y, r, n, col, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (opts.rot || 0);
      const bx = x + Math.cos(a) * r * 0.8, by = y + Math.sin(a) * r * 0.8;
      const tx = x + Math.cos(a) * r * 1.55, ty = y + Math.sin(a) * r * 1.55;
      const px = -Math.sin(a) * r * 0.24, py = Math.cos(a) * r * 0.24;
      ctx.beginPath();
      ctx.moveTo(bx + px, by + py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx - px, by - py);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, bx + px, by + py, bx - px, by - py, [[0, '#eef2f4'], [1, '#55636c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r, [[0, D.shade(col, 0.55)], [0.45, col], [1, D.shade(col, -0.55)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // rivets / band
    if (opts.band) {
      ctx.save();
      D.circlePath(ctx, x, y, r);
      ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x - r, y - r * 0.12, r * 2, r * 0.24);
      ctx.restore();
    }
    D.ellipsePath(ctx, x - r * 0.35, y - r * 0.42, r * 0.32, r * 0.18, -0.6);
    D.fs(ctx, 'rgba(255,255,255,0.55)');
  }

  // spiky land mine half buried in the track
  function mine(ctx, x, y, r, big) {
    D.shadow(ctx, x + 1, y + r * 0.45, r * 1.5, r * 0.5, 0.35);
    // nails strapped around it
    const n = big ? 12 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      nail(ctx, x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.45, r * (big ? 1.0 : 0.85), a, big ? 'iron' : 'steel', big ? 2 : 1.6);
    }
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.62, 0, Math.PI, 0);
    ctx.lineTo(x + r, y);
    ctx.ellipse(x, y, r, r * 0.3, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, x - r * 0.3, y - r * 0.5, 1, x, y - r * 0.1, r, [[0, '#8a959c'], [0.5, '#3c464c'], [1, '#141a1e']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // hazard band
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.3, 0, 0, Math.PI);
    ctx.lineTo(x - r, y - r * 0.16);
    ctx.ellipse(x, y - r * 0.16, r, r * 0.3, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.clip();
    for (let i = -6; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#ffca28' : '#1d1d1d';
      ctx.beginPath();
      ctx.moveTo(x + i * r * 0.22, y - r);
      ctx.lineTo(x + i * r * 0.22 + r * 0.22, y - r);
      ctx.lineTo(x + i * r * 0.22 + r * 0.02, y + r);
      ctx.lineTo(x + i * r * 0.22 - r * 0.2, y + r);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // trigger + blinking light
    D.rrPath(ctx, x - r * 0.18, y - r * 0.82, r * 0.36, r * 0.24, 1);
    D.fs(ctx, '#90a4ae', OL, 0.8);
    glowDisc(ctx, x, y - r * 0.85, r * 0.7, '#ff1744', 0.55);
    D.circlePath(ctx, x, y - r * 0.86, r * 0.16);
    D.fs(ctx, '#ff5252', OL, 0.6);
    D.ellipsePath(ctx, x - r * 0.4, y - r * 0.38, r * 0.25, r * 0.1, -0.3);
    D.fs(ctx, 'rgba(255,255,255,0.4)');
  }

  // wooden crate full of nails, seen from the front-top
  function crate(ctx, x, y, w, h, pal, metal) {
    D.shadow(ctx, x + w / 2 + 1, y + h, w * 0.6, 3, 0.3);
    const top = h * 0.32;
    // top face
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3, y - top);
    ctx.lineTo(x + w + 3, y - top);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    D.fs(ctx, metal ? '#78909c' : '#5d3b1c', OL, 1);
    // nails poking out
    const rnd = D.rng(7);
    for (let i = 0; i < 7; i++) {
      const nx = x + 3 + rnd() * (w - 4), ny = y - top * 0.3 - rnd() * top * 0.5;
      spike(ctx, nx, ny + 1, 4 + rnd() * 3, pal, 1.6);
    }
    // front face
    D.rrPath(ctx, x, y, w, h, 1.5);
    ctx.fillStyle = metal
      ? D.lin(ctx, x, 0, x + w, 0, [[0, '#eef3f7'], [0.5, '#a9bccb'], [1, '#5d7384']])
      : D.lin(ctx, x, 0, x + w, 0, [[0, '#d9a066'], [1, '#9a6431']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    if (metal) {
      ctx.fillStyle = '#1e88e5';
      ctx.fillRect(x + 1, y + h * 0.38, w - 2, h * 0.24);
      sparkle(ctx, x + w * 0.25, y + h * 0.22, 1.6);
    } else {
      ctx.strokeStyle = 'rgba(70,40,15,0.55)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + 1, y + h * 0.5);
      ctx.lineTo(x + w - 1, y + h * 0.5);
      ctx.stroke();
      // stencil
      D.rrPath(ctx, x + w * 0.2, y + h * 0.18, w * 0.6, h * 0.26, 1);
      D.fs(ctx, 'rgba(40,20,5,0.35)');
    }
  }

  function bananaPeel(ctx, x, y, s) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + i * 6 * s, y - 5 * s, x + i * 10 * s, y + 1.5 * s);
      ctx.strokeStyle = OL;
      ctx.lineWidth = 4 * s;
      ctx.stroke();
      ctx.strokeStyle = '#ffd83a';
      ctx.lineWidth = 2.4 * s;
      ctx.stroke();
    }
    D.ellipsePath(ctx, x, y - 1, 3.4 * s, 2.4 * s);
    D.fs(ctx, '#fff3b0', OL, 0.8);
  }

  // ------------------------------------------------------------ the tower
  function nailPal(t) {
    const [a, , c] = t;
    if (a >= 4) return 'iron';
    if (a >= 2) return 'hot';
    if (c >= 3) return 'chrome';
    if (a >= 1) return 'rust';
    return 'steel';
  }

  function clawHammer(ctx, x, y, rot, hot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    D.rrPath(ctx, -1.9, -2, 3.8, 21, 1.6);
    ctx.fillStyle = D.lin(ctx, -2, 0, 2, 0, [[0, '#c98a4b'], [1, '#7a4a1c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#263238';
    ctx.fillRect(-1.9, 12, 3.8, 6);
    if (hot) glowDisc(ctx, 0, -4, 11, '#ff6d00', 0.6);
    // head: flat face on one side, curved claw on the other
    ctx.beginPath();
    ctx.moveTo(-2.6, -6.5);
    ctx.lineTo(7, -6.5);
    ctx.lineTo(7, -1.5);
    ctx.lineTo(-2.6, -1.5);
    ctx.quadraticCurveTo(-7, -2, -10, 2.5);
    ctx.quadraticCurveTo(-9, -3.5, -5, -6);
    ctx.closePath();
    ctx.fillStyle = hot
      ? D.lin(ctx, 0, -6.5, 0, -1.5, [[0, '#fff3b0'], [0.5, '#ff8f00'], [1, '#bf360c']])
      : D.lin(ctx, 0, -6.5, 0, -1.5, [[0, '#eceff1'], [1, '#607d8b']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    D.rrPath(ctx, 6.5, -7.2, 2.4, 6.4, 0.8);
    D.fs(ctx, hot ? '#ffcc80' : '#cfd8dc', OL, 0.8);
    ctx.restore();
  }

  function nailGun(ctx, x, y, col) {
    ctx.save();
    ctx.translate(x, y);
    // body
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(16, -6);
    ctx.quadraticCurveTo(20, -6, 20, -2);
    ctx.lineTo(20, 1);
    ctx.lineTo(-4, 1);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, -6, 0, 1, [[0, D.shade(col, 0.35)], [1, D.shade(col, -0.3)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // grip
    D.rrPath(ctx, -2, 0, 6, 10, 2);
    D.fs(ctx, '#263238', OL, 1);
    // nail strip magazine
    D.rrPath(ctx, 6, 1, 13, 4.5, 1);
    D.fs(ctx, '#b0bec5', OL, 0.8);
    ctx.strokeStyle = 'rgba(40,50,60,0.6)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(7.5 + i * 2, 1.5);
      ctx.lineTo(7.5 + i * 2, 5);
      ctx.stroke();
    }
    // nose
    D.rrPath(ctx, 19, -4.5, 4, 4, 1);
    D.fs(ctx, '#455a64', OL, 0.8);
    ctx.restore();
  }

  P.nails = function (ctx, t) {
    const [a, b, c] = t;
    const pal = nailPal(t);
    const hot = pal === 'hot';
    // ---- aura
    if (a >= 4) glowRing(ctx, B.cx, B.cy, 42, '#ff3d00', 0.4);
    else if (b >= 4) glowRing(ctx, B.cx, B.cy, 42, '#ffab40', 0.4);
    else if (c >= 4) glowRing(ctx, B.cx, B.cy, 42, '#82b1ff', 0.5);
    else if (hot) glowRing(ctx, B.cx - 18, FOOT - 10, 20, '#ff6d00', 0.35);
    // ---- glue carpet (Perma-Nails)
    if (c >= 4) {
      D.ellipsePath(ctx, B.cx, FOOT - 1, 34, 9);
      ctx.fillStyle = D.rad(ctx, B.cx - 8, FOOT - 4, 2, B.cx, FOOT - 1, 34, [[0, 'rgba(200,190,230,0.85)'], [1, 'rgba(110,95,150,0.85)']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,45,90,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      [[B.cx - 26, FOOT - 1], [B.cx + 24, FOOT], [B.cx - 14, FOOT + 3], [B.cx + 12, FOOT + 3]].forEach(([x, y]) => spike(ctx, x, y, 6, 'chrome', 2));
    }
    // ---- things behind the minion
    if (b >= 4) {
      // little crane with a wrecking ball
      const mx = 9;
      D.rrPath(ctx, mx - 3, 8, 6, FOOT - 8, 1);
      ctx.fillStyle = D.lin(ctx, mx - 3, 0, mx + 3, 0, [[0, '#ffd54f'], [1, '#f57f17']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(42,29,20,0.6)';
      ctx.lineWidth = 0.7;
      for (let y = 12; y < FOOT - 4; y += 6) {
        ctx.beginPath();
        ctx.moveTo(mx - 3, y);
        ctx.lineTo(mx + 3, y + 5);
        ctx.stroke();
      }
      D.rrPath(ctx, mx - 3, 5, 68, 5, 1);
      ctx.fillStyle = D.lin(ctx, 0, 5, 0, 10, [[0, '#ffe082'], [1, '#f57f17']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([2, 1.2]);
      ctx.beginPath();
      ctx.moveTo(70, 10);
      ctx.lineTo(70, 21);
      ctx.stroke();
      ctx.setLineDash([]);
      spikeBall(ctx, 70, 29, 7, 10, '#455a64', { band: true });
    }
    if (b >= 1) {
      // air compressor tank on the back
      D.rrPath(ctx, B.cx - 26, B.cy - 6, 11, 24, 5);
      ctx.fillStyle = D.lin(ctx, B.cx - 26, 0, B.cx - 15, 0, [[0, '#ff8a80'], [0.5, '#e53935'], [1, '#8e1c1c']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      D.circlePath(ctx, B.cx - 20.5, B.cy - 7, 2.4);
      D.fs(ctx, '#eceff1', OL, 0.8);
    }

    // ---- the minion: one big eye, hard-hat, hi-vis vest, tool belt
    const o = {
      eyes: 1, hair: 'bald', mouth: 'flat', seed: 161, lookX: 0.5, lookY: 0.1,
      lid: a >= 4 ? 0.18 : 0, lidDepth: 0.62,
      rim: a >= 4 ? '#8d9aa3' : c >= 3 ? '#e3f2fd' : null,
      arms: [],
      outfit: (c2, cx, cy, w, h) => {
        // hi-vis vest, worn open over the overalls
        const vest = a >= 4 ? '#455a64' : c >= 3 ? '#1e88e5' : '#ff7a1a';
        for (const s of [-1, 1]) {
          const x0 = cx + s * w * 0.15, x1 = cx + s * w * 0.62;
          c2.beginPath();
          c2.moveTo(x0, cy - h * 0.1);
          c2.lineTo(x1, cy - h * 0.13);
          c2.lineTo(x1, cy + h * 0.24);
          c2.lineTo(x0 + s * w * 0.04, cy + h * 0.24);
          c2.closePath();
          c2.fillStyle = D.lin(c2, x0, 0, x1, 0, [[0, D.shade(vest, 0.2)], [1, D.shade(vest, -0.3)]]);
          c2.fill();
          c2.strokeStyle = D.shade(vest, -0.5);
          c2.lineWidth = 0.8;
          c2.stroke();
          // reflective stripes
          const lx = Math.min(x0, x1), sw = Math.abs(x1 - x0) + 2;
          [cy + h * 0.02, cy + h * 0.13].forEach((y) => {
            c2.fillStyle = '#dfe7ec';
            c2.fillRect(lx, y, sw, h * 0.05);
            c2.fillStyle = 'rgba(255,255,255,0.9)';
            c2.fillRect(lx, y, sw, h * 0.014);
          });
        }
        // tool belt with pouches
        c2.fillStyle = '#5d4037';
        c2.fillRect(cx - w, cy + h * 0.235, w * 2, h * 0.075);
        c2.fillStyle = '#c0ca33';
        c2.fillRect(cx - w * 0.07, cy + h * 0.228, w * 0.14, h * 0.09);
        D.rrPath(c2, cx - w * 0.44, cy + h * 0.28, w * 0.2, h * 0.13, 1.5);
        D.fs(c2, '#8d6e63', OL, 0.7);
        D.rrPath(c2, cx + w * 0.24, cy + h * 0.28, w * 0.2, h * 0.11, 1.5);
        D.fs(c2, '#8d6e63', OL, 0.7);
        // nails poking out of the pouch
        for (let i = 0; i < 3; i++) spike(c2, cx - w * 0.38 + i * 2.2, cy + h * 0.29, 4, pal, 1.2);
      },
      face: (c2, cx, cy, w, h) => {
        // a few nails held in the mouth, carpenter style
        const my = cy - h * 0.01;
        nail(c2, cx + w * 0.02, my + 0.6, 9, 0.35, pal, 1.3);
        nail(c2, cx + w * 0.06, my + 1.2, 8, 0.7, pal, 1.3);
      },
    };
    o.after = (c2) => {
      // ---- left hand: holds a nail ready to hammer (or a nail strip for the gun)
      const lx = B.cx - 7, ly = B.cy + 11;
      D.limb(c2, B.cx - 13, B.cy + 2, lx, ly, B.w * 0.14, '#ffd83a', { bend: [B.cx - 17, B.cy + 12], lw: 1.5 });
      if (b < 1) {
        c2.save();
        spike(c2, lx + 1, ly + 10, 13, pal, 2.2);
        c2.restore();
      }
      // ---- right hand: claw hammer raised, or the nail gun
      if (b >= 1) {
        nailGun(c2, B.cx + 13, B.cy + 6, b >= 4 ? '#ff6d00' : b >= 2 ? '#fb8c00' : '#ffa726');
        D.limb(c2, B.cx + 13, B.cy + 2, B.cx + 15, B.cy + 9, B.w * 0.14, '#ffd83a', { lw: 1.5 });
        // air hose back to the tank
        c2.strokeStyle = OL;
        c2.lineWidth = 2.6;
        c2.beginPath();
        c2.moveTo(B.cx + 14, B.cy + 16);
        c2.bezierCurveTo(B.cx + 10, B.cy + 30, B.cx - 26, B.cy + 30, B.cx - 21, B.cy + 17);
        c2.stroke();
        c2.strokeStyle = '#212121';
        c2.lineWidth = 1.5;
        c2.stroke();
      } else {
        clawHammer(c2, B.cx + 21, B.cy - 12, 0.45, hot);
        D.limb(c2, B.cx + 13, B.cy + 2, B.cx + 21, B.cy - 9, B.w * 0.14, '#ffd83a', { bend: [B.cx + 23, B.cy + 1], lw: 1.5 });
      }
      // ---- nail-bomb bandolier
      if (a >= 4) {
        c2.save();
        c2.strokeStyle = '#3e2723';
        c2.lineWidth = 3.2;
        c2.beginPath();
        c2.moveTo(B.cx - 13, B.cy - 8);
        c2.lineTo(B.cx + 12, B.cy + 12);
        c2.stroke();
        for (let i = 0; i < 4; i++) {
          const bx = B.cx - 10 + i * 6.5, by = B.cy - 5 + i * 5.2;
          D.rrPath(c2, bx - 2, by - 3.5, 4, 7, 1.2);
          D.fs(c2, '#37474f', OL, 0.7);
          c2.fillStyle = '#ff1744';
          c2.fillRect(bx - 2, by - 0.6, 4, 1.2);
        }
        c2.restore();
      }
    };
    D.shadow(ctx, B.cx, FOOT, 17, 5.5);
    M.draw(ctx, Object.assign({ x: B.cx, y: B.cy, w: B.w, h: B.h }, o));

    // ---- hard hat with headlamp
    const hat = a >= 4 ? '#607d8b' : b >= 4 ? '#ff9100' : c >= 4 ? '#b3c8dc' : c >= 3 ? '#f5f5f5' : '#ffca28';
    helmet(ctx, B.cx, B.cy - 31, B.w, hat);
    if (c >= 3 && c < 4) {
      ctx.fillStyle = '#1e88e5';
      ctx.fillRect(B.cx - 1.5, B.cy - 30, 3, 12);
    }
    if (a >= 4) {
      // iron crest of spikes
      for (let i = -2; i <= 2; i++) spike(ctx, B.cx + i * 5, B.cy - 27 - (2 - Math.abs(i)) * 1.2, 8 + (2 - Math.abs(i)) * 1.5, 'iron', 2.4);
    }
    if (a >= 2 && a < 4) {
      // welding mask flipped up on the hat
      D.rrPath(ctx, B.cx - 9, B.cy - 34, 18, 6, 2);
      D.fs(ctx, '#37474f', OL, 1);
      D.rrPath(ctx, B.cx - 5, B.cy - 33, 10, 3, 1);
      D.fs(ctx, '#80cbc4', OL, 0.6);
    }
    // headlamp (a scanner beam for Smart Spikes)
    const lampCol = c >= 2 ? '#40e0ff' : '#fff59d';
    if (c >= 2) {
      ctx.beginPath();
      ctx.moveTo(B.cx + 8, B.cy - 22);
      ctx.lineTo(B.cx + 40, B.cy - 30);
      ctx.lineTo(B.cx + 40, B.cy - 10);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, B.cx + 8, 0, B.cx + 40, 0, [[0, 'rgba(64,224,255,0.45)'], [1, 'rgba(64,224,255,0)']]);
      ctx.fill();
    }
    glowDisc(ctx, B.cx + 7, B.cy - 22, 6, lampCol, 0.55);
    D.circlePath(ctx, B.cx + 7, B.cy - 22, 2.6);
    D.fs(ctx, lampCol, OL, 0.8);

    // ---- props on the ground in front
    if (b >= 2 && b < 4) bananaPeel(ctx, B.cx + 2, FOOT + 2, 0.8);
    crate(ctx, B.cx - 34, FOOT - 9, 17, 10, pal, c >= 3);
    if (hot) {
      // glowing coals in a little brazier
      glowDisc(ctx, B.cx - 26, FOOT - 15, 11, '#ff6d00', 0.5);
    }
    if (a >= 3) {
      mine(ctx, B.cx + 27, FOOT - 3, a >= 4 ? 7 : 6, a >= 4);
    } else if (b === 3) {
      spikeBall(ctx, B.cx + 28, FOOT - 6, 6.5, 9, '#546e7a', { band: true });
    } else if (c >= 4) {
      // steel anvil
      const ax = B.cx + 27, ay = FOOT - 4;
      ctx.beginPath();
      ctx.moveTo(ax - 9, ay - 8);
      ctx.lineTo(ax + 11, ay - 8);
      ctx.quadraticCurveTo(ax + 10, ay - 4, ax + 4, ay - 4);
      ctx.lineTo(ax + 4, ay);
      ctx.lineTo(ax + 7, ay + 3);
      ctx.lineTo(ax - 6, ay + 3);
      ctx.lineTo(ax - 3, ay);
      ctx.lineTo(ax - 3, ay - 4);
      ctx.quadraticCurveTo(ax - 8, ay - 5, ax - 9, ay - 8);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, ay - 8, 0, ay + 3, [[0, '#eef4fa'], [0.4, '#9fb4c8'], [1, '#3b4f62']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      sparkle(ctx, ax - 4, ay - 9, 2.4);
      sparkle(ctx, B.cx - 30, B.cy - 18, 2);
      sparkle(ctx, B.cx + 30, B.cy - 30, 1.6);
    } else if (c >= 1) {
      // tape measure stretched out along the ground
      D.rrPath(ctx, B.cx + 18, FOOT - 6, 8, 7, 2);
      D.fs(ctx, '#ffca28', OL, 0.9);
      ctx.fillStyle = '#fff176';
      ctx.fillRect(B.cx + 26, FOOT - 3, 14, 2);
      ctx.fillStyle = OL;
      for (let i = 0; i < 4; i++) ctx.fillRect(B.cx + 27 + i * 3.5, FOOT - 3, 0.5, 1.2);
    }
  };

  // ------------------------------------------------------------ textures
  function generate(scene) {
    const mk = (key, w, h, fn) => D.make(scene, key, w, h, fn);
    const piles = [
      ['fx_nails', 'steel', 11],
      ['fx_nails_rust', 'rust', 12],
      ['fx_nails_hot', 'hot', 13],
      ['fx_nails_steel', 'chrome', 14],
    ];
    piles.forEach(([key, pal, seed]) => mk(key, 30, 26, (ctx) => {
      D.shadow(ctx, 15, 16, 12, 5, 0.3);
      if (pal === 'hot') glowDisc(ctx, 15, 14, 14, '#ff6d00', 0.55);
      if (pal === 'rust') {
        const rnd = D.rng(4);
        for (let i = 0; i < 6; i++) {
          D.circlePath(ctx, 6 + rnd() * 18, 9 + rnd() * 10, 0.8 + rnd() * 1.2);
          D.fs(ctx, 'rgba(150,70,20,0.45)');
        }
      }
      pile(ctx, 15, 14, 12, 8, pal, seed, { n: 9, len: 10, up: 3, upH: 7 });
      if (pal === 'chrome') {
        sparkle(ctx, 8, 7, 2.2);
        sparkle(ctx, 23, 12, 1.6);
      }
      if (pal === 'hot') sparkle(ctx, 20, 8, 1.8, '#fff9c4');
    }));
    // Perma-Nails: steel spikes set in a puddle of glue
    mk('fx_nails_perma', 34, 28, (ctx) => {
      D.ellipsePath(ctx, 17, 17, 15, 8);
      ctx.fillStyle = D.rad(ctx, 13, 15, 1, 17, 17, 15, [[0, 'rgba(214,204,240,0.92)'], [1, 'rgba(112,96,156,0.9)']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,45,95,0.85)';
      ctx.lineWidth = 1;
      ctx.stroke();
      D.ellipsePath(ctx, 12, 14, 4.5, 1.6, -0.2);
      D.fs(ctx, 'rgba(255,255,255,0.5)');
      pile(ctx, 17, 16, 11, 6, 'chrome', 21, { n: 6, len: 9, up: 4, upH: 8 });
      sparkle(ctx, 26, 9, 1.8);
    });
    // Nail Bomb piles: iron caltrops
    mk('fx_nails_big', 34, 30, (ctx) => {
      D.shadow(ctx, 17, 19, 14, 5, 0.35);
      pile(ctx, 17, 17, 13, 9, 'iron', 31, { n: 8, len: 12, up: 4, upH: 9, w: 2.4 });
    });
    mk('fx_mine', 30, 26, (ctx) => mine(ctx, 15, 17, 8, false));
    mk('fx_mine_big', 38, 32, (ctx) => mine(ctx, 19, 21, 10, true));
    // rolling balls
    mk('p_spikeball', 36, 36, (ctx) => spikeBall(ctx, 18, 18, 9.5, 11, '#546e7a', { band: true }));
    mk('p_wreckball', 58, 58, (ctx) => {
      glowDisc(ctx, 29, 29, 28, '#ffab40', 0.3);
      spikeBall(ctx, 29, 29, 16, 14, '#37474f', { band: true });
      // chain eye on top
      ctx.strokeStyle = OL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(29, 11, 3.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });
    // a single flying nail (Nail Bomb shrapnel), pointing right
    mk('p_nail', 20, 8, (ctx) => nail(ctx, 3, 4, 15, 0, 'iron', 2));
  }

  TA.props.nail = nail;
  TA.props.nailSpike = spike;
  TA.props.nailPile = pile;
  TA.props.spikeBall = spikeBall;
  MT.NailArt = { generate, nail, spike, pile, spikeBall, mine, crate, PAL };
})();
