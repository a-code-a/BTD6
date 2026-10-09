// Hero artwork. Every hero is painted in a 96x110 box: body centre around
// y=64, feet at y=102, facing right with the weapon on the right side.
(function () {
  const D = MT.Draw;
  const M = MT.Minion;
  const OL = D.OL;
  const TA = MT.TowerArt;
  const { glowRing, crown, cape } = TA.props;
  const SKIN = '#f6d2b4';

  function face(ctx, cx, cy, rx, ry, skin) {
    D.ellipsePath(ctx, cx, cy, rx, ry);
    ctx.fillStyle = D.rad(ctx, cx - rx * 0.4, cy - ry * 0.4, 1, cx, cy, Math.max(rx, ry) * 1.1, [[0, '#fff3e6'], [0.55, skin], [1, D.shade(skin, -0.18)]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function eye(ctx, x, y, rx, ry, iris, lash) {
    D.ellipsePath(ctx, x, y, rx, ry);
    D.fs(ctx, '#ffffff', OL, 0.9);
    D.circlePath(ctx, x + rx * 0.25, y + 0.3, ry * 0.62);
    D.fs(ctx, iris);
    D.circlePath(ctx, x + rx * 0.3, y + 0.3, ry * 0.32);
    D.fs(ctx, '#111');
    D.circlePath(ctx, x + rx * 0.05, y - ry * 0.3, ry * 0.2);
    D.fs(ctx, '#fff');
    if (lash) {
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x - rx, y - ry * 0.3);
      ctx.quadraticCurveTo(x, y - ry * 1.5, x + rx * 1.1, y - ry * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + rx * 0.9, y - ry * 0.6);
      ctx.lineTo(x + rx * 1.5, y - ry * 1.2);
      ctx.stroke();
    }
  }

  function boots(ctx, cx, top, col, legCol, gap = 5) {
    for (const s of [-1, 1]) {
      D.rrPath(ctx, cx + s * gap - 2.4, top, 4.8, 92 - top, 2);
      D.fs(ctx, legCol, OL, 1.1);
      D.rrPath(ctx, cx + s * gap - 3.2, 90, 6.8, 10, 2.5);
      D.fs(ctx, col, OL, 1.1);
      D.ellipsePath(ctx, cx + s * gap + 2.4, 100, 5, 2.4);
      D.fs(ctx, col, OL, 1.1);
    }
  }

  // twin tanks strapped to the back (AVL jetpack / Vector's squid tanks)
  function jetpack(ctx, cx, metal, accent, squids) {
    for (const s of [-1, 1]) {
      const x = cx + s * 15;
      // nozzle flame
      if (!squids) {
        ctx.beginPath();
        ctx.moveTo(x - 3.5, 78);
        ctx.quadraticCurveTo(x, 96, x + 3.5, 78);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, 0, 76, 0, 94, [[0, '#ffffff'], [0.35, '#fff176'], [1, 'rgba(255,112,67,0)']]);
        ctx.fill();
      }
      D.rrPath(ctx, x - 5.5, 42, 11, 34, 5);
      ctx.fillStyle = squids
        ? D.lin(ctx, x - 5, 0, x + 5, 0, [[0, 'rgba(225,245,254,0.95)'], [0.5, 'rgba(129,212,250,0.85)'], [1, 'rgba(79,195,247,0.95)']])
        : D.lin(ctx, x - 5, 0, x + 5, 0, [[0, '#ffffff'], [0.45, metal], [1, D.shade(metal, -0.4)]]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      if (squids) {
        D.ellipsePath(ctx, x, 56, 3.2, 4.2);
        D.fs(ctx, '#f06292', OL, 0.7);
        for (let i = -1; i <= 1; i++) {
          ctx.strokeStyle = '#ec407a';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x + i * 1.6, 60);
          ctx.quadraticCurveTo(x + i * 3, 64, x + i * 1.5, 67);
          ctx.stroke();
        }
      }
      // caps + accent band
      D.rrPath(ctx, x - 6.5, 40, 13, 5, 2);
      D.fs(ctx, D.shade(metal, -0.25), OL, 1);
      D.rrPath(ctx, x - 6, 72, 12, 5, 2);
      D.fs(ctx, D.shade(metal, -0.35), OL, 1);
      ctx.fillStyle = accent;
      ctx.fillRect(x - 5, 50, 10, 3);
    }
  }

  // Nefario's goo reactor: a bubbling glass tank on his back
  function gooTank(ctx, cx) {
    const x = cx - 15;
    D.rrPath(ctx, x - 9, 34, 18, 40, 7);
    ctx.fillStyle = D.lin(ctx, x - 9, 0, x + 9, 0, [[0, 'rgba(241,255,214,0.95)'], [0.4, '#9be15d'], [1, '#3b8a12']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    const rnd = D.rng(21);
    for (let i = 0; i < 5; i++) {
      D.circlePath(ctx, x - 5 + rnd() * 10, 42 + rnd() * 26, 1 + rnd() * 1.6);
      D.fs(ctx, 'rgba(255,255,255,0.75)');
    }
    D.rrPath(ctx, x - 10, 31, 20, 6, 2.5);
    D.fs(ctx, '#8d6e63', OL, 1.1);
    D.rrPath(ctx, x - 10, 71, 20, 6, 2.5);
    D.fs(ctx, '#8d6e63', OL, 1.1);
    // pressure dial
    D.circlePath(ctx, x, 27, 4);
    D.fs(ctx, '#eceff1', OL, 1);
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 27);
    ctx.lineTo(x + 2.4, 25);
    ctx.stroke();
  }

  // ---------------------------------------------------------------- render pipeline
  // Every hero is painted on its own layer, then wrapped in a dark silhouette
  // outline with a soft rim light so it reads clearly against busy maps.
  // Ascension tiers add a golden look: tier 1 (★5) and tier 2 (★10).
  const LOOK = {
    gru: { color: '#7fdbff', head: [45, 7] },
    lucy: { color: '#4dd0e1', head: [46, 11] },
    nefario: { color: '#9be15d', head: [47, 15] },
    kevin: { color: '#ffd83a', head: [44, 16] },
    vector: { color: '#ff8a3a', head: [46, 14] },
  };
  const GOLD = '#ffd54f';

  function layer() {
    return D.canvas(96, 110);
  }
  // draw a raw (supersampled) canvas onto a scaled context
  function blit(ctx, c, dx = 0, dy = 0, op, alpha) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (op) ctx.globalCompositeOperation = op;
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.drawImage(c, dx, dy);
    ctx.restore();
  }
  // solid-colour copy of a layer's silhouette, optionally grown outwards
  function silhouette(src, col, grow, dx = 0, dy = 0) {
    const L = layer();
    const n = grow ? 12 : 1;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * D.TAU;
      blit(L.ctx, src, dx + (grow ? Math.cos(a) * grow : 0), dy + (grow ? Math.sin(a) * grow : 0));
    }
    L.ctx.save();
    L.ctx.setTransform(1, 0, 0, 1, 0, 0);
    L.ctx.globalCompositeOperation = 'source-in';
    L.ctx.fillStyle = col;
    L.ctx.fillRect(0, 0, L.c.width, L.c.height);
    L.ctx.restore();
    return L.c;
  }
  // the bright edge on the lit (upper-left) side of a layer
  function rim(src, col, off) {
    const L = layer();
    blit(L.ctx, src);
    blit(L.ctx, src, off, off, 'destination-out');
    L.ctx.save();
    L.ctx.setTransform(1, 0, 0, 1, 0, 0);
    L.ctx.globalCompositeOperation = 'source-in';
    L.ctx.fillStyle = col;
    L.ctx.fillRect(0, 0, L.c.width, L.c.height);
    L.ctx.restore();
    return L.c;
  }

  // hero-coloured ground badge so heroes stand out from the towers
  function emblem(ctx, col, stage, tier) {
    const cx = 45, cy = 101;
    D.shadow(ctx, cx, cy, 24, 7, 0.35);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.3);
    const R = 25;
    ctx.fillStyle = D.rad(ctx, 0, 0, 0, 0, 0, R, [[0, D.rgba(col, 0.05)], [0.7, D.rgba(col, 0.32)], [1, D.rgba(col, 0.05)]]);
    D.circlePath(ctx, 0, 0, R);
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = tier ? GOLD : D.rgba(col, 0.85);
    D.circlePath(ctx, 0, 0, R - 1.5);
    ctx.stroke();
    if (stage >= 5) {
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = D.rgba(tier ? '#fff8e1' : col, 0.6);
      D.circlePath(ctx, 0, 0, R - 6);
      ctx.stroke();
    }
    if (stage >= 10) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * D.TAU + Math.PI / 4;
        D.starPath(ctx, Math.cos(a) * (R - 1.5), Math.sin(a) * (R - 1.5), 4, 4.5, 1.6);
        D.fs(ctx, tier ? '#fffde7' : D.shade(col, 0.5));
      }
    }
    ctx.restore();
  }

  // ascended: flickering energy behind the hero; legendary adds light wings
  function backAura(ctx, col, tier) {
    const cx = 45;
    if (tier >= 2) {
      // feathered wings of light, longest feathers on top
      for (const s of [-1, 1]) {
        for (let f = 4; f >= 0; f--) {
          const len = 40 - f * 4.5;
          ctx.save();
          ctx.translate(cx + s * 7, 54);
          ctx.scale(s, 1);
          ctx.rotate(-0.95 + f * 0.3);
          ctx.beginPath();
          ctx.moveTo(0, -2.5);
          ctx.quadraticCurveTo(len * 0.55, -7, len, -1.5);
          ctx.quadraticCurveTo(len * 0.6, 4, 0, 2.5);
          ctx.closePath();
          ctx.fillStyle = D.lin(ctx, 0, 0, len, 0, [[0, D.rgba(GOLD, 0.95)], [0.55, 'rgba(255,253,231,0.95)'], [1, D.rgba(col, 0.55)]]);
          ctx.fill();
          ctx.strokeStyle = 'rgba(160,100,0,0.7)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    // tongues of light rising behind the body
    const rnd = D.rng(77);
    for (let i = 0; i < 9; i++) {
      const x = cx - 22 + i * 5.5 + (rnd() - 0.5) * 3;
      const top = 22 + Math.abs(i - 4) * 5 + rnd() * 6;
      ctx.beginPath();
      ctx.moveTo(x - 5, 96);
      ctx.quadraticCurveTo(x - 4, (top + 96) / 2, x, top);
      ctx.quadraticCurveTo(x + 4, (top + 96) / 2, x + 5, 96);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, top, 0, 96, [[0, D.rgba(GOLD, 0)], [0.4, D.rgba(i % 2 ? col : GOLD, 0.45)], [1, D.rgba('#ffffff', 0.15)]]);
      ctx.fill();
    }
  }

  function paintHero(ctx, id, stage, tier) {
    const look = LOOK[id];
    const col = look.color;
    emblem(ctx, col, stage, tier);
    if (stage >= 10) TA.props.glowRing(ctx, 45, 58, 48, tier ? GOLD : col, tier ? 0.55 : 0.4);
    if (tier) backAura(ctx, col, tier);
    // character layer
    const body = layer();
    MT.HeroArt[id](body.ctx, stage);
    // dark outer outline, then the character, then a soft rim light
    blit(ctx, silhouette(body.c, OL, 1.7));
    if (tier) blit(ctx, silhouette(body.c, GOLD, 3.2), 0, 0, 'destination-over', 0.9);
    blit(ctx, body.c);
    blit(ctx, rim(body.c, tier ? '#fff3c4' : '#ffffff', 2.2), 0, 0, null, tier ? 0.55 : 0.4);
    blit(ctx, rim(body.c, '#1a1030', -2.6), 0, 0, null, 0.16);
    // a floating halo of stars over the head for ascended heroes
    if (tier) {
      const [hx, hy] = look.head;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(1, 0.32);
      D.circlePath(ctx, 0, 0, 11);
      ctx.strokeStyle = 'rgba(122,82,0,0.8)';
      ctx.lineWidth = 4.4;
      ctx.stroke();
      ctx.strokeStyle = tier >= 2 ? '#fffde7' : GOLD;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
      const n = tier >= 2 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 1.1 + (i / (n - 1)) * Math.PI * 0.8;
        D.starPath(ctx, hx + Math.cos(a) * 11, hy + Math.sin(a) * 3.5, 5, tier >= 2 ? 3.2 : 2.7, 1.3);
        D.fs(ctx, '#fffde7', '#b37400', 0.7);
      }
    }
  }

  // ---------------------------------------------------------------- Lucy Wilde
  function lucy(ctx, stage) {
    const cx = 45;
    if (stage >= 10) jetpack(ctx, cx, '#eceff1', '#26c6da');
    const hair = '#e64a19';
    // hair (back)
    ctx.beginPath();
    ctx.moveTo(cx - 15, 40);
    ctx.bezierCurveTo(cx - 22, 18, cx - 8, 8, cx + 2, 10);
    ctx.bezierCurveTo(cx + 18, 10, cx + 22, 24, cx + 16, 42);
    ctx.quadraticCurveTo(cx + 20, 47, cx + 14, 48);
    ctx.lineTo(cx - 13, 48);
    ctx.quadraticCurveTo(cx - 20, 46, cx - 15, 40);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 20, 0, cx + 20, 0, [[0, '#ff8a65'], [0.5, hair], [1, '#a1300c']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    boots(ctx, cx, 80, '#1b1b1b', '#455a64');
    // coat
    ctx.beginPath();
    ctx.moveTo(cx - 11, 48);
    ctx.quadraticCurveTo(cx - 14, 68, cx - 18, 87);
    ctx.lineTo(cx + 18, 87);
    ctx.quadraticCurveTo(cx + 14, 68, cx + 11, 48);
    ctx.quadraticCurveTo(cx, 44, cx - 11, 48);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 18, 0, cx + 18, 0, [[0, '#80deea'], [0.45, '#26c6da'], [1, '#00838f']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,70,80,0.7)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx + 1, 52);
    ctx.lineTo(cx + 2, 87);
    ctx.stroke();
    // belt
    D.rrPath(ctx, cx - 13, 64, 26, 4.5, 2);
    D.fs(ctx, '#006064', OL, 1);
    D.rrPath(ctx, cx - 2, 63.5, 6, 5.5, 1);
    D.fs(ctx, '#ffd54f', OL, 0.8);
    // collar
    ctx.beginPath();
    ctx.moveTo(cx - 9, 47);
    ctx.lineTo(cx - 2, 56);
    ctx.lineTo(cx - 1, 47);
    ctx.closePath();
    D.fs(ctx, '#e0f7fa', OL, 1);
    ctx.beginPath();
    ctx.moveTo(cx + 9, 47);
    ctx.lineTo(cx + 3, 56);
    ctx.lineTo(cx + 1, 47);
    ctx.closePath();
    D.fs(ctx, '#e0f7fa', OL, 1);
    if (stage >= 5) {
      D.starPath(ctx, cx - 7, 60, 5, 3.4, 1.5);
      D.fs(ctx, '#ffd54f', OL, 0.7);
    }
    D.limb(ctx, cx - 10, 51, cx - 15, 72, 5.5, '#26c6da', { lw: 1.3, gloveColor: SKIN });
    // neck + head
    D.rrPath(ctx, cx - 3, 40, 6, 8, 2);
    D.fs(ctx, SKIN, OL, 1);
    face(ctx, cx + 1, 30, 10.5, 12.5, SKIN);
    // bangs
    ctx.beginPath();
    ctx.moveTo(cx - 11, 30);
    ctx.bezierCurveTo(cx - 12, 14, cx + 12, 10, cx + 13, 26);
    ctx.quadraticCurveTo(cx + 6, 20, cx + 1, 23);
    ctx.quadraticCurveTo(cx - 5, 19, cx - 11, 30);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, 12, 0, 30, [[0, '#ff8a65'], [1, hair]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    eye(ctx, cx - 3.5, 30, 3, 3.4, '#26a69a', true);
    eye(ctx, cx + 5.5, 30, 3, 3.4, '#26a69a', true);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 2, 33);
    ctx.quadraticCurveTo(cx + 3.5, 36, cx + 2, 36.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 3, 38.5);
    ctx.quadraticCurveTo(cx + 2, 42, cx + 7, 38);
    ctx.quadraticCurveTo(cx + 2, 39.6, cx - 3, 38.5);
    D.fs(ctx, '#e53935', OL, 0.8);
    D.ellipsePath(ctx, cx - 6, 35, 2, 1.2);
    D.fs(ctx, 'rgba(255,120,120,0.35)');
    if (stage >= 10) {
      // sunglasses pushed up into the hair
      D.rrPath(ctx, cx - 9, 15, 8, 4, 2);
      D.fs(ctx, '#212121', OL, 0.8);
      D.rrPath(ctx, cx + 2, 15, 8, 4, 2);
      D.fs(ctx, '#212121', OL, 0.8);
    }
    // arm + lipstick taser
    D.limb(ctx, cx + 10, 51, cx + 22, 61, 5.5, '#26c6da', { lw: 1.3, gloveColor: SKIN, bend: [cx + 20, 51] });
    ctx.save();
    ctx.translate(cx + 22, 61);
    D.rrPath(ctx, -2, -3.4, 12, 6.8, 1.6);
    ctx.fillStyle = D.lin(ctx, 0, -3, 0, 3, [[0, '#fff59d'], [1, '#c79100']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -2.8);
    ctx.lineTo(17, -2.8);
    ctx.lineTo(20, 2.8);
    ctx.lineTo(10, 2.8);
    ctx.closePath();
    D.fs(ctx, '#e91e63', OL, 1);
    if (stage >= 5) {
      glowRing(ctx, 20, 0, 8, '#ff80ab', 0.8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(21, -1);
      ctx.lineTo(25, -4);
      ctx.lineTo(24, 0);
      ctx.lineTo(28, -2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- Dr. Nefario
  function nefario(ctx, stage) {
    const cx = 44;
    if (stage >= 10) gooTank(ctx, cx);
    boots(ctx, cx, 84, '#3e2723', '#455a64', 6);
    // lab coat, a bit hunched
    ctx.beginPath();
    ctx.moveTo(cx - 12, 46);
    ctx.quadraticCurveTo(cx - 18, 70, cx - 18, 92);
    ctx.lineTo(cx + 16, 92);
    ctx.quadraticCurveTo(cx + 18, 68, cx + 14, 46);
    ctx.quadraticCurveTo(cx + 2, 40, cx - 12, 46);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 18, 0, cx + 18, 0, [[0, '#ffffff'], [0.5, '#eceff1'], [1, '#b0bec5']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // shirt + lapels
    ctx.beginPath();
    ctx.moveTo(cx - 5, 46);
    ctx.lineTo(cx + 1, 62);
    ctx.lineTo(cx + 7, 46);
    ctx.closePath();
    D.fs(ctx, '#8d6e63', OL, 1);
    ctx.strokeStyle = 'rgba(80,90,100,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 1, 62);
    ctx.lineTo(cx + 1, 92);
    ctx.stroke();
    // pocket with pens
    D.rrPath(ctx, cx - 12, 58, 8, 8, 1.5);
    D.fs(ctx, '#e0e0e0', OL, 0.8);
    ['#e53935', '#1e88e5'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(cx - 11 + i * 3, 55, 1.6, 5);
    });
    if (stage >= 5) {
      // hearing-aid gadget belt
      D.rrPath(ctx, cx - 15, 70, 30, 5, 2);
      D.fs(ctx, '#5d4037', OL, 1);
      [cx - 9, cx - 2, cx + 6].forEach((x, i) => {
        D.rrPath(ctx, x - 2, 69, 4, 7, 1);
        D.fs(ctx, ['#69f0ae', '#ffd740', '#ff5252'][i], OL, 0.7);
      });
    }
    D.limb(ctx, cx - 11, 50, cx - 16, 72, 6, '#eceff1', { lw: 1.3, gloveColor: '#212121' });
    // head (big, old, bald)
    face(ctx, cx + 3, 30, 12, 13, '#f1cfae');
    // white hair tufts
    [-1, 1].forEach((s) => {
      const rnd = D.rng(s > 0 ? 3 : 4);
      for (let i = 0; i < 3; i++) {
        D.blobPath(ctx, cx + 3 + s * (12 + i * 1.2), 25 + i * 4, 3.4, 6, 0.3, rnd);
        D.fs(ctx, '#f5f5f5', OL, 0.8);
      }
    });
    ctx.strokeStyle = 'rgba(120,80,60,0.45)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 3, 20 + i * 2.2);
      ctx.quadraticCurveTo(cx + 3, 19 + i * 2.2, cx + 9, 20 + i * 2.2);
      ctx.stroke();
    }
    // huge goggles
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx - 9, 28, 24, 3);
    [cx - 2, cx + 9].forEach((x) => {
      D.circlePath(ctx, x, 30, 5.6);
      ctx.fillStyle = D.rad(ctx, x - 2, 28, 0, x, 30, 6, [[0, '#ffffff'], [0.5, '#cfd8dc'], [1, '#607d8b']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      D.circlePath(ctx, x, 30, 4.2);
      D.fs(ctx, '#e3f2fd');
      D.circlePath(ctx, x + 1, 30.4, 2.1);
      D.fs(ctx, '#4e342e');
      D.circlePath(ctx, x + 0.4, 29.6, 0.8);
      D.fs(ctx, '#fff');
    });
    // nose + mouth
    ctx.beginPath();
    ctx.moveTo(cx + 3, 33);
    ctx.quadraticCurveTo(cx + 10, 38, cx + 4, 40);
    ctx.closePath();
    D.fs(ctx, '#e8b48f', OL, 1);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 2, 41);
    ctx.quadraticCurveTo(cx + 3, 43, cx + 8, 41);
    ctx.stroke();
    // the FART gun (blunderbuss)
    D.limb(ctx, cx + 12, 50, cx + 18, 62, 6, '#eceff1', { lw: 1.3, gloveColor: '#212121', bend: [cx + 19, 52] });
    const big = stage >= 5;
    ctx.save();
    ctx.translate(cx + 14, 63);
    D.rrPath(ctx, -4, -4, big ? 26 : 22, 8, 3);
    ctx.fillStyle = D.lin(ctx, 0, -4, 0, 4, [[0, '#a1887f'], [1, '#4e342e']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const ex = big ? 22 : 18;
    ctx.beginPath();
    ctx.moveTo(ex, -4);
    ctx.lineTo(ex + 9, -9);
    ctx.lineTo(ex + 9, 9);
    ctx.lineTo(ex, 4);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, ex, -9, ex, 9, [[0, '#ffe082'], [0.5, '#c79100'], [1, '#7a5200']]);
    ctx.fill();
    ctx.stroke();
    D.ellipsePath(ctx, ex + 9, 0, 2.2, 8.5);
    D.fs(ctx, '#3a2a10', OL, 1);
    // gas tank
    D.ellipsePath(ctx, 6, -8, big ? 7 : 6, big ? 5.5 : 4.6);
    ctx.fillStyle = D.rad(ctx, 4, -10, 0, 6, -8, 7, [[0, '#f1ffd6'], [0.4, '#9be15d'], [1, '#3b8a12']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    if (stage >= 10) {
      const rnd = D.rng(9);
      for (let i = 0; i < 3; i++) {
        D.blobPath(ctx, cx + 48 + i * 4, 58 - i * 6, 3.6 - i * 0.6, 7, 0.2, rnd);
        D.fs(ctx, 'rgba(165,216,106,0.9)', 'rgba(42,29,20,0.5)', 0.8);
      }
    }
  }

  // ---------------------------------------------------------------- Kevin
  function kevin(ctx, stage) {
    const cx = 44, cy = 64, w = 32, h = 58;
    if (stage >= 10) cape(ctx, cx, cy, w, h * 0.9, '#c62828');
    const o = {
      x: cx, y: cy, w, h, eyes: 2, hair: 'sprout', mouth: 'happy', seed: 131, lookX: 0.6,
      arms: [{ x0: cx - 15, y0: cy + 3, x1: cx - 20, y1: cy + 17 }],
    };
    if (stage >= 5) {
      o.outfit = (c2, x, y, ww, hh) => {
        D.starPath(c2, x, y + hh * 0.13, 5, ww * 0.12, ww * 0.055);
        D.fs(c2, '#ffd83a', OL, 0.8);
      };
    }
    o.after = (c2) => {
      // banana blaster
      c2.save();
      c2.translate(cx + 2, cy + 4);
      D.rrPath(c2, -6, -6, 36, 12, 5);
      c2.fillStyle = D.lin(c2, 0, -6, 0, 6, [[0, '#fff59d'], [0.5, '#ffd83a'], [1, '#c79100']]);
      c2.fill();
      c2.strokeStyle = OL;
      c2.lineWidth = 1.3;
      c2.stroke();
      c2.strokeStyle = 'rgba(122,82,0,0.55)';
      c2.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        c2.beginPath();
        c2.moveTo(4 + i * 8, -6);
        c2.lineTo(4 + i * 8, 6);
        c2.stroke();
      }
      D.ellipsePath(c2, 31, 0, 3, 7.5);
      D.fs(c2, '#6b4a1f', OL, 1.1);
      D.rrPath(c2, 4, 5, 6, 8, 2);
      D.fs(c2, '#5d4037', OL, 1);
      c2.restore();
      D.limb(c2, cx + 15, cy + 3, cx + 12, cy + 9, w * 0.14, '#ffd83a', { bend: [cx + 18, cy + 9], lw: 1.5 });
    };
    M.draw(ctx, o);
    if (stage >= 5 && stage < 10) {
      // red bandana
      ctx.save();
      D.capsulePath(ctx, cx, cy, w, h);
      ctx.clip();
      ctx.fillStyle = '#e53935';
      ctx.fillRect(cx - w, cy - h * 0.38, w * 2, 4);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, cy - h * 0.36);
      ctx.lineTo(cx - w / 2 - 7, cy - h * 0.42);
      ctx.lineTo(cx - w / 2 - 5, cy - h * 0.3);
      ctx.closePath();
      D.fs(ctx, '#e53935', OL, 0.9);
    }
    if (stage >= 10) crown(ctx, cx, cy - h / 2 - 5, 1, '#e53935');
  }

  // ---------------------------------------------------------------- Vector
  function vector(ctx, stage) {
    const cx = 45;
    if (stage >= 10) jetpack(ctx, cx, '#b0bec5', '#ff7a1a', true);
    const suit = '#ff7a1a';
    // legs: track pants + sneakers
    for (const s of [-1, 1]) {
      D.rrPath(ctx, cx + s * 6 - 3.6, 80, 7.2, 16, 3);
      D.fs(ctx, suit, OL, 1.1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + s * 6 + (s > 0 ? 1.8 : -3), 81, 1.3, 14);
      D.ellipsePath(ctx, cx + s * 6 + 2, 99, 6, 3);
      D.fs(ctx, '#ffffff', OL, 1.1);
      ctx.fillStyle = '#ff7a1a';
      ctx.fillRect(cx + s * 6 - 2, 98, 6, 1.2);
    }
    // track jacket (pear shaped)
    ctx.beginPath();
    ctx.moveTo(cx - 10, 46);
    ctx.quadraticCurveTo(cx - 19, 68, cx - 15, 84);
    ctx.lineTo(cx + 15, 84);
    ctx.quadraticCurveTo(cx + 19, 68, cx + 10, 46);
    ctx.quadraticCurveTo(cx, 42, cx - 10, 46);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 19, 0, cx + 19, 0, [[0, '#ffb07a'], [0.45, suit], [1, '#b84a00']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, 46);
    ctx.lineTo(cx, 84);
    ctx.stroke();
    D.rrPath(ctx, cx - 15, 80, 30, 4, 2);
    D.fs(ctx, '#e65100', OL, 1);
    if (stage >= 5) {
      // piranha badge
      D.ellipsePath(ctx, cx - 7, 58, 4, 2.6);
      D.fs(ctx, '#78909c', OL, 0.8);
      ctx.beginPath();
      ctx.moveTo(cx - 11, 58);
      ctx.lineTo(cx - 14, 55.5);
      ctx.lineTo(cx - 14, 60.5);
      ctx.closePath();
      D.fs(ctx, '#78909c', OL, 0.8);
    }
    D.limb(ctx, cx - 10, 50, cx - 16, 70, 6, suit, { lw: 1.3, gloveColor: '#fbe3cf' });
    // head: pale with bowl cut and square glasses
    D.rrPath(ctx, cx - 3, 39, 6, 8, 2);
    D.fs(ctx, '#fbe3cf', OL, 1);
    face(ctx, cx + 1, 29, 11, 12.5, '#fbe3cf');
    ctx.beginPath();
    ctx.moveTo(cx - 11, 30);
    ctx.bezierCurveTo(cx - 13, 10, cx + 15, 10, cx + 13, 30);
    ctx.lineTo(cx + 12, 25);
    ctx.lineTo(cx - 10, 25);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, 14, 0, 30, [[0, '#8d6e63'], [1, '#4e342e']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // glasses
    [cx - 4, cx + 6].forEach((x) => {
      D.rrPath(ctx, x - 4, 27, 8, 6, 1.2);
      D.fs(ctx, 'rgba(255,255,255,0.85)', '#111', 1.8);
      D.circlePath(ctx, x + 1, 30, 1.3);
      D.fs(ctx, '#111');
    });
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 29.5);
    ctx.lineTo(cx + 2, 29.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 3, 33);
    ctx.lineTo(cx + 6, 36);
    ctx.lineTo(cx + 2, 36.5);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 2, 39);
    ctx.quadraticCurveTo(cx + 3, 41.5, cx + 7, 38.5);
    ctx.stroke();
    // squid launcher
    D.limb(ctx, cx + 10, 50, cx + 18, 62, 6, suit, { lw: 1.3, gloveColor: '#fbe3cf', bend: [cx + 19, 51] });
    ctx.save();
    ctx.translate(cx + 14, 62);
    D.rrPath(ctx, -6, -5, 34, 10, 4);
    ctx.fillStyle = D.lin(ctx, 0, -5, 0, 5, [[0, '#b0bec5'], [1, '#455a64']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    D.ellipsePath(ctx, 28, 0, 3, 6);
    D.fs(ctx, '#263238', OL, 1);
    // glass tank with a squid
    D.circlePath(ctx, 7, -8, stage >= 5 ? 7.5 : 6.5);
    D.fs(ctx, 'rgba(178,235,242,0.75)', OL, 1.1);
    D.ellipsePath(ctx, 7, -9, 3, 3.6);
    D.fs(ctx, '#f06292', OL, 0.7);
    D.circlePath(ctx, 8, -9.5, 0.9);
    D.fs(ctx, '#111');
    ctx.restore();
  }

  MT.HeroArt = {
    gru: (ctx, stage) => TA.gru(ctx, stage),
    lucy,
    nefario,
    kevin,
    vector,
  };
  MT.HeroArt.paint = paintHero;
  // top of the head relative to the sprite origin (y = 64 in the texture)
  MT.HeroArt.headY = (id) => (LOOK[id] ? LOOK[id].head[1] : 10) - 64;

  // art stage from the level (1 / 5 / 10) and ascension tier from the stars
  TA.heroStage = (level) => (level >= 10 ? 10 : level >= 5 ? 5 : 1);
  TA.heroTier = (stars) => (stars >= 10 ? 2 : stars >= 5 ? 1 : 0);
  TA.heroKey = function (scene, id, level, stars) {
    const stage = TA.heroStage(level);
    const tier = TA.heroTier(stars || 0);
    const key = `hero_${id}_${stage}${tier ? '_a' + tier : ''}`;
    if (!scene.textures.exists(key)) D.make(scene, key, 96, 110, (ctx) => paintHero(ctx, id, stage, tier));
    return key;
  };
})();
