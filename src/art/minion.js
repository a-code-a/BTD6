// The core character painter: draws a minion (yellow hero or purple mutant)
// front-facing, fully parametrised so towers and enemies can share it.
(function () {
  const D = MT.Draw;
  const OL = D.OL;

  const SKINS = {
    yellow: { base: '#ffd83a', light: '#fff07c', dark: '#dc9f00', hi: '#fffbe0' },
    purple: { base: '#8a3fb8', light: '#b56ce2', dark: '#4f1b74', hi: '#e2b8ff' },
  };
  const DENIM = { base: '#3d74bd', light: '#649be0', dark: '#234a82', stitch: '#ffd166' };

  function purpleSkin(hex) {
    return { base: hex, light: D.shade(hex, 0.32), dark: D.shade(hex, -0.42), hi: D.shade(hex, 0.7) };
  }

  function goggle(ctx, x, y, r, o) {
    const lw = o.lw;
    // metal rim
    D.circlePath(ctx, x, y, r);
    ctx.fillStyle = D.rad(ctx, x - r * 0.45, y - r * 0.45, r * 0.05, x, y, r, [
      [0, '#ffffff'], [0.4, o.rim || '#cfd5dc'], [1, D.shade(o.rim || '#cfd5dc', -0.45)],
    ]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = lw;
    ctx.stroke();
    // inner dark ring
    D.circlePath(ctx, x, y, r * 0.77);
    D.fs(ctx, '#3a3f47');
    // eyeball
    const white = o.style === 'crazy' ? '#fff4c2' : '#ffffff';
    D.circlePath(ctx, x, y, r * 0.66);
    ctx.fillStyle = D.rad(ctx, x - r * 0.15, y - r * 0.2, r * 0.1, x, y, r * 0.66, [[0, white], [0.75, white], [1, D.shade(white, -0.2)]]);
    ctx.fill();

    const lx = (o.lookX || 0) * r * 0.24;
    const ly = (o.lookY || 0) * r * 0.24;
    if (o.style === 'crazy') {
      ctx.save();
      D.circlePath(ctx, x, y, r * 0.66);
      ctx.clip();
      ctx.strokeStyle = 'rgba(214,40,40,0.75)';
      ctx.lineWidth = Math.max(0.5, r * 0.06);
      for (let i = 0; i < 5; i++) {
        const a = o.rand() * D.TAU;
        const sx = x + Math.cos(a) * r * 0.68, sy = y + Math.sin(a) * r * 0.68;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * r * 0.45, y + Math.sin(a + 0.4) * r * 0.45, x + Math.cos(a) * r * 0.32, y + Math.sin(a) * r * 0.32);
        ctx.stroke();
      }
      ctx.restore();
      D.circlePath(ctx, x + lx, y + ly, r * (o.pupil || 0.14));
      D.fs(ctx, '#111');
    } else {
      D.circlePath(ctx, x + lx, y + ly, r * 0.34);
      ctx.fillStyle = D.rad(ctx, x + lx, y + ly, r * 0.05, x + lx, y + ly, r * 0.34, [[0, o.iris2 || '#b07a3c'], [1, o.iris || '#5b3418']]);
      ctx.fill();
      D.circlePath(ctx, x + lx, y + ly, r * 0.17);
      D.fs(ctx, '#111');
    }
    D.circlePath(ctx, x + lx - r * 0.13, y + ly - r * 0.15, r * 0.09);
    D.fs(ctx, '#fff');

    if (o.lid) {
      // half-closed eyelid (angry / sleepy)
      ctx.save();
      D.circlePath(ctx, x, y, r * 0.67);
      ctx.clip();
      ctx.translate(x, y);
      ctx.rotate(o.lid * (o.side || 1));
      ctx.fillStyle = o.lidColor;
      ctx.fillRect(-r, -r, r * 2, r * (o.lidDepth || 0.85));
      ctx.strokeStyle = OL;
      ctx.lineWidth = lw * 0.9;
      ctx.beginPath();
      ctx.moveTo(-r, -r + r * (o.lidDepth || 0.85));
      ctx.lineTo(r, -r + r * (o.lidDepth || 0.85));
      ctx.stroke();
      ctx.restore();
    }
    // glass glare
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = Math.max(0.6, r * 0.09);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.52, Math.PI * 1.08, Math.PI * 1.42);
    ctx.stroke();
  }

  function mouth(ctx, o, cx, my, w) {
    const lw = o.lw;
    const mw = w * (o.mouthW || 0.36);
    const kind = o.mouth || 'smile';
    ctx.save();
    if (kind === 'smile' || kind === 'happy') {
      const mh = w * (kind === 'happy' ? 0.26 : 0.18);
      ctx.beginPath();
      ctx.moveTo(cx - mw / 2, my);
      ctx.quadraticCurveTo(cx, my + mh * 1.6, cx + mw / 2, my);
      ctx.quadraticCurveTo(cx, my + mh * 0.25, cx - mw / 2, my);
      ctx.closePath();
      D.fs(ctx, '#5a1d12');
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - mw / 2, my - 2, mw, mh * 0.42 + 1.5);
      D.ellipsePath(ctx, cx, my + mh * 1.05, mw * 0.28, mh * 0.45);
      D.fs(ctx, '#ff7b8a');
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(cx - mw / 2, my);
      ctx.quadraticCurveTo(cx, my + mh * 1.6, cx + mw / 2, my);
      ctx.quadraticCurveTo(cx, my + mh * 0.25, cx - mw / 2, my);
      ctx.closePath();
      ctx.strokeStyle = OL;
      ctx.lineWidth = lw * 0.85;
      ctx.stroke();
    } else if (kind === 'grin') {
      ctx.beginPath();
      ctx.moveTo(cx - mw / 2, my);
      ctx.quadraticCurveTo(cx, my + w * 0.14, cx + mw / 2, my - w * 0.02);
      ctx.strokeStyle = OL;
      ctx.lineWidth = lw;
      ctx.stroke();
    } else if (kind === 'o') {
      D.ellipsePath(ctx, cx, my + w * 0.04, mw * 0.22, w * 0.09);
      D.fs(ctx, '#5a1d12', OL, lw * 0.85);
    } else if (kind === 'flat') {
      ctx.beginPath();
      ctx.moveTo(cx - mw * 0.35, my + w * 0.03);
      ctx.lineTo(cx + mw * 0.35, my + w * 0.02);
      ctx.strokeStyle = OL;
      ctx.lineWidth = lw;
      ctx.stroke();
    } else if (kind === 'teeth' || kind === 'roar') {
      // evil wide mouth with jagged teeth
      const mh = w * (kind === 'roar' ? 0.34 : 0.22);
      const top = my - w * 0.02;
      const shape = () => {
        ctx.beginPath();
        ctx.moveTo(cx - mw / 2, top);
        ctx.quadraticCurveTo(cx, top - w * 0.05, cx + mw / 2, top);
        ctx.quadraticCurveTo(cx + mw * 0.3, top + mh * 1.2, cx, top + mh * 1.1);
        ctx.quadraticCurveTo(cx - mw * 0.3, top + mh * 1.2, cx - mw / 2, top);
        ctx.closePath();
      };
      shape();
      D.fs(ctx, '#3b0d17');
      ctx.save();
      shape();
      ctx.clip();
      D.ellipsePath(ctx, cx, top + mh * 1.0, mw * 0.25, mh * 0.35);
      D.fs(ctx, '#d4475f');
      ctx.fillStyle = '#fffbea';
      const n = 5;
      for (let i = 0; i < n; i++) {
        const tx = cx - mw / 2 + (i + 0.5) * (mw / n);
        const th = mh * (0.38 + o.rand() * 0.3);
        ctx.beginPath();
        ctx.moveTo(tx - mw / n / 2, top - 3);
        ctx.lineTo(tx + mw / n / 2, top - 3);
        ctx.lineTo(tx + (o.rand() - 0.5) * 2, top + th);
        ctx.closePath();
        ctx.fill();
      }
      for (let i = 0; i < n - 1; i++) {
        const tx = cx - mw * 0.36 + (i + 0.5) * (mw * 0.72 / (n - 1));
        const th = mh * (0.3 + o.rand() * 0.25);
        ctx.beginPath();
        ctx.moveTo(tx - mw / n / 2.4, top + mh * 1.25);
        ctx.lineTo(tx + mw / n / 2.4, top + mh * 1.25);
        ctx.lineTo(tx, top + mh * 1.25 - th);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      shape();
      ctx.strokeStyle = OL;
      ctx.lineWidth = lw * 0.9;
      ctx.stroke();
    }
    ctx.restore();
  }

  function hairBack(ctx, o, cx, top, w, h) {
    if (o.hair !== 'wild') return;
    const r = w / 2;
    const hcx = cx, hcy = top + r;
    const n = o.hairSpikes || 13;
    const len = o.hairLen || 1.0;
    ctx.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const t = i / (n * 2);
      const a = Math.PI * (1.02 + 0.96 * t);
      const out = i % 2 === 1;
      const rr = out ? r * (1.28 + o.rand() * 0.42 * len) * (0.8 + 0.25 * Math.sin(t * Math.PI)) + r * 0.18 * len : r * 0.82;
      const x = hcx + Math.cos(a) * rr + (out ? (o.rand() - 0.5) * r * 0.25 : 0);
      const y = hcy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(hcx + r * 0.8, hcy + r * 0.3);
    ctx.lineTo(hcx - r * 0.8, hcy + r * 0.3);
    ctx.closePath();
    D.fs(ctx, o.hairColor || '#1b0d22', OL, o.lw);
  }

  function hairFront(ctx, o, cx, top, w, h) {
    ctx.save();
    ctx.strokeStyle = o.hairColor || '#1a1a1a';
    if (o.hair === 'sprout') {
      ctx.lineWidth = Math.max(0.8, w * 0.035);
      for (let i = -3; i <= 3; i++) {
        const sx = cx + i * w * 0.035;
        ctx.beginPath();
        ctx.moveTo(sx, top + 1.5);
        ctx.quadraticCurveTo(cx + i * w * 0.08, top - h * 0.1, cx + i * w * 0.14 + (o.rand() - 0.5) * 2, top - h * (0.13 + o.rand() * 0.06));
        ctx.stroke();
      }
    } else if (o.hair === 'tuft') {
      ctx.lineWidth = Math.max(0.8, w * 0.04);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 2, top + 1.5);
        ctx.bezierCurveTo(cx + i * 5, top - h * 0.12, cx + i * 9 + 5, top - h * 0.12, cx + i * 7 + 3, top - h * 0.04);
        ctx.stroke();
      }
    } else if (o.hair === 'spiky') {
      ctx.lineWidth = Math.max(1, w * 0.05);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * w * 0.07, top + 2);
        ctx.lineTo(cx + i * w * 0.13, top - h * 0.12);
        ctx.stroke();
      }
    } else if (o.hair === 'flat') {
      D.ellipsePath(ctx, cx, top + h * 0.03, w * 0.32, h * 0.05);
      D.fs(ctx, o.hairColor || '#1a1a1a');
    }
    ctx.restore();
  }

  function overalls(ctx, o, cx, cy, w, h) {
    const den = o.denim || DENIM;
    const lw = o.lw;
    const bibTop = cy + h * 0.07;
    const waist = cy + h * 0.23;
    const grad = D.lin(ctx, cx - w / 2, 0, cx + w / 2, 0, [[0, den.light], [0.45, den.base], [1, den.dark]]);
    // straps
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = den.base;
    ctx.lineWidth = w * 0.085;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * w * 0.22, bibTop + 2);
      ctx.lineTo(cx + s * w * 0.56, cy - h * 0.03);
      ctx.stroke();
    }
    ctx.restore();
    if (o.stripes) {
      // prison stripes overalls
      ctx.fillStyle = '#f4f1ea';
      ctx.fillRect(cx - w, waist, w * 2, h);
      D.rrPath(ctx, cx - w * 0.28, bibTop, w * 0.56, waist - bibTop + 2, w * 0.06);
      ctx.fill();
      const stripes = () => {
        ctx.fillStyle = '#26232b';
        for (let y = bibTop + h * 0.03; y < cy + h; y += h * 0.075) ctx.fillRect(cx - w, y, w * 2, h * 0.038);
      };
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - w, waist, w * 2, h);
      ctx.clip();
      stripes();
      ctx.restore();
      ctx.save();
      D.rrPath(ctx, cx - w * 0.28, bibTop, w * 0.56, waist - bibTop + 2, w * 0.06);
      ctx.clip();
      stripes();
      ctx.restore();
      return;
    }
    ctx.fillStyle = grad;
    ctx.fillRect(cx - w, waist, w * 2, h);
    D.rrPath(ctx, cx - w * 0.28, bibTop, w * 0.56, waist - bibTop + 2, w * 0.06);
    ctx.fill();
    // seams
    ctx.strokeStyle = den.dark;
    ctx.lineWidth = lw * 0.7;
    D.rrPath(ctx, cx - w * 0.28, bibTop, w * 0.56, waist - bibTop + 2, w * 0.06);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w, waist);
    ctx.lineTo(cx + w, waist);
    ctx.stroke();
    // stitching
    ctx.save();
    ctx.setLineDash([Math.max(0.8, w * 0.04), Math.max(0.8, w * 0.04)]);
    ctx.strokeStyle = D.rgba(den.stitch, 0.85);
    ctx.lineWidth = Math.max(0.4, lw * 0.4);
    D.rrPath(ctx, cx - w * 0.24, bibTop + w * 0.04, w * 0.48, waist - bibTop - w * 0.02, w * 0.04);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - w, waist + w * 0.05);
    ctx.lineTo(cx + w, waist + w * 0.05);
    ctx.stroke();
    ctx.restore();
    // pocket + logo
    if (!o.noLogo) {
      const pw = w * 0.22, ph = h * 0.075;
      D.rrPath(ctx, cx - pw / 2, bibTop + h * 0.035, pw, ph, 2);
      D.fs(ctx, den.base, den.dark, lw * 0.5);
      D.circlePath(ctx, cx, bibTop + h * 0.035 + ph * 0.5, ph * 0.38);
      D.fs(ctx, o.logoColor || '#1b1b1b');
      ctx.strokeStyle = '#d8d8d8';
      ctx.lineWidth = Math.max(0.5, ph * 0.12);
      ctx.beginPath();
      ctx.arc(cx, bibTop + h * 0.035 + ph * 0.5, ph * 0.2, Math.PI * 0.2, Math.PI * 1.75);
      ctx.stroke();
    }
    // buttons
    for (const s of [-1, 1]) {
      D.circlePath(ctx, cx + s * w * 0.21, bibTop + w * 0.06, w * 0.045);
      D.fs(ctx, '#202020', null);
      D.circlePath(ctx, cx + s * w * 0.21 - 0.4, bibTop + w * 0.06 - 0.4, w * 0.018);
      D.fs(ctx, 'rgba(255,255,255,0.6)');
    }
  }

  function legs(ctx, o, cx, bot, w, h) {
    const den = o.denim || DENIM;
    const legTop = bot - h * 0.07;
    for (const s of [-1, 1]) {
      const lx = cx + s * w * 0.2;
      D.rrPath(ctx, lx - w * 0.11, legTop, w * 0.22, h * 0.13, w * 0.05);
      D.fs(ctx, o.stripes ? '#e9e5dc' : den.dark, OL, o.lw * 0.9);
      const shoeCol = o.shoes || '#1d1d1d';
      D.ellipsePath(ctx, lx + s * w * 0.04, legTop + h * 0.135, w * 0.16, h * 0.058);
      D.fs(ctx, shoeCol, OL, o.lw * 0.9);
      D.ellipsePath(ctx, lx + s * w * 0.02, legTop + h * 0.115, w * 0.07, h * 0.02);
      D.fs(ctx, 'rgba(255,255,255,0.3)');
    }
  }

  /**
   * Draw a minion. o: { x, y, w, h, skin, eyes(1|2), eyeStyle, look, mouth,
   *   hair, overalls, legs, arms:[{x0,y0,x1,y1,bend}], seed, ... }
   * (x, y) is the centre of the capsule body.
   */
  function minion(ctx, o) {
    const cx = o.x, cy = o.y, w = o.w, h = o.h;
    const skin = typeof o.skin === 'string' ? (SKINS[o.skin] || purpleSkin(o.skin)) : o.skin || SKINS.yellow;
    o.lw = o.lw || Math.max(1.1, w * 0.05);
    o.rand = o.rand || D.rng(o.seed || 7);
    const top = cy - h / 2, bot = cy + h / 2;

    hairBack(ctx, o, cx, top, w, h);
    if (o.legs !== false) legs(ctx, o, cx, bot, w, h);
    (o.armsBack || []).forEach((a) => D.limb(ctx, a.x0, a.y0, a.x1, a.y1, w * (a.t || 0.14), skin.base, { bend: a.bend, lw: o.lw, glove: a.glove, gloveColor: o.glove }));

    // body
    D.capsulePath(ctx, cx, cy, w, h);
    ctx.fillStyle = D.lin(ctx, cx - w / 2, 0, cx + w / 2, 0, [[0, skin.light], [0.42, skin.base], [1, skin.dark]]);
    ctx.fill();
    ctx.save();
    D.capsulePath(ctx, cx, cy, w, h);
    ctx.clip();
    ctx.fillStyle = D.rad(ctx, cx - w * 0.2, top + h * 0.2, 0, cx - w * 0.2, top + h * 0.2, w * 0.55, [[0, D.rgba(skin.hi, 0.75)], [1, D.rgba(skin.hi, 0)]]);
    ctx.fillRect(cx - w, top, w * 2, h);
    if (o.belly) o.belly(ctx, cx, cy, w, h);
    if (o.overalls !== false) overalls(ctx, o, cx, cy, w, h);
    if (o.outfit) o.outfit(ctx, cx, cy, w, h, skin);
    // goggle strap
    const eyeY = cy - h * (o.eyeY || 0.19);
    if (o.strap !== false) {
      ctx.fillStyle = o.strapColor || '#262626';
      ctx.fillRect(cx - w, eyeY - h * 0.05, w * 2, h * 0.1);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(cx - w, eyeY - h * 0.05, w * 2, h * 0.025);
    }
    // volume shading on the right edge
    ctx.fillStyle = D.lin(ctx, cx + w * 0.05, 0, cx + w / 2, 0, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(40,10,0,0.18)']]);
    ctx.fillRect(cx - w, top, w * 2, h);
    ctx.restore();
    D.capsulePath(ctx, cx, cy, w, h);
    ctx.strokeStyle = OL;
    ctx.lineWidth = o.lw;
    ctx.stroke();

    // eyes
    const eo = {
      lw: o.lw, style: o.eyeStyle, rand: o.rand, lookX: o.lookX, lookY: o.lookY, lid: o.lid,
      lidColor: skin.base, lidDepth: o.lidDepth, rim: o.rim, pupil: o.pupil,
    };
    if ((o.eyes || 2) === 1) {
      goggle(ctx, cx, eyeY, w * 0.29, eo);
    } else {
      goggle(ctx, cx - w * 0.21, eyeY, w * 0.215, Object.assign({}, eo, { side: 1 }));
      goggle(ctx, cx + w * 0.21, eyeY, w * 0.215, Object.assign({}, eo, { side: -1, lookX: (o.lookX || 0) + (o.eyeStyle === 'crazy' ? 0.9 : 0) }));
    }
    if (o.face) o.face(ctx, cx, cy, w, h, skin);
    mouth(ctx, o, cx, cy + h * (o.mouthY != null ? o.mouthY : -0.01), w);
    hairFront(ctx, o, cx, top, w, h);
    (o.arms || []).forEach((a) => D.limb(ctx, a.x0, a.y0, a.x1, a.y1, w * (a.t || 0.14), skin.base, { bend: a.bend, lw: o.lw, glove: a.glove, gloveColor: o.glove }));
    if (o.after) o.after(ctx, cx, cy, w, h, skin);
  }

  MT.Minion = { draw: minion, SKINS, DENIM, purpleSkin, goggle };
})();
