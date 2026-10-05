// Low level Canvas2D helpers. Every texture in the game is painted with these
// at 2x density and registered as a Phaser canvas texture.
(function () {
  const S = 2; // texture supersampling factor
  const OL = '#2a1d14'; // cartoon outline ink
  const TAU = Math.PI * 2;

  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  }
  // amt > 0 lightens towards white, amt < 0 darkens towards black
  function shade(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
    return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
  }
  function mix(h1, h2, t) {
    const a = hexToRgb(h1), b = hexToRgb(h2);
    return rgbToHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  }
  function rgba(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }
  function toInt(hex) {
    return parseInt(hex.replace('#', ''), 16);
  }

  function canvas(w, h, scale = S) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * scale));
    c.height = Math.max(1, Math.ceil(h * scale));
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    return { c, ctx };
  }

  // Paint a texture once and register it under `key`.
  function make(scene, key, w, h, fn) {
    if (scene.textures.exists(key)) return key;
    const { c, ctx } = canvas(w, h);
    fn(ctx, w, h);
    scene.textures.addCanvas(key, c);
    return key;
  }

  function capsulePath(ctx, cx, cy, w, h) {
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy - h / 2 + r);
    ctx.arc(cx, cy - h / 2 + r, r, Math.PI, 0);
    ctx.lineTo(cx + w / 2, cy + h / 2 - r);
    ctx.arc(cx, cy + h / 2 - r, r, 0, Math.PI);
    ctx.closePath();
  }

  function rrPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipsePath(ctx, cx, cy, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU);
  }

  function circlePath(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.01, r), 0, TAU);
  }

  function fs(ctx, fill, stroke, lw) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw || 1.5;
      ctx.stroke();
    }
  }

  function lin(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }

  function rad(ctx, x0, y0, r0, x1, y1, r1, stops) {
    const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }

  // Soft elliptical ground shadow
  function shadow(ctx, cx, cy, rx, ry, a = 0.3) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, TAU);
    ctx.fillStyle = rad(ctx, 0, 0, 0, 0, 0, rx, [[0, `rgba(0,0,0,${a})`], [0.6, `rgba(0,0,0,${a * 0.75})`], [1, 'rgba(0,0,0,0)']]);
    ctx.fill();
    ctx.restore();
  }

  function starPath(ctx, cx, cy, n, r1, r2, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 === 0 ? r1 : r2;
      const a = rot + (i * Math.PI) / n;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // Irregular blob (used for bushes, clouds, puddles...)
  function blobPath(ctx, cx, cy, r, n, jitter, rnd) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const rr = r * (1 - jitter + rnd() * jitter * 2);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[i], p1 = pts[(i + 1) % n];
      const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.quadraticCurveTo(p0[0], p0[1], mx, my);
    }
    const p0 = pts[0], p1 = pts[1];
    ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    ctx.closePath();
  }

  // Thick limb with outline + optional glove/claw
  function limb(ctx, x0, y0, x1, y1, t, color, opts = {}) {
    const bend = opts.bend;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      if (bend) ctx.quadraticCurveTo(bend[0], bend[1], x1, y1);
      else ctx.lineTo(x1, y1);
    };
    ctx.save();
    ctx.lineCap = 'round';
    path();
    ctx.strokeStyle = OL;
    ctx.lineWidth = t + (opts.lw || 1.4) * 2;
    ctx.stroke();
    path();
    ctx.strokeStyle = color;
    ctx.lineWidth = t;
    ctx.stroke();
    if (opts.glove !== false) {
      circlePath(ctx, x1, y1, t * 0.78);
      fs(ctx, opts.gloveColor || '#1f1f1f', OL, opts.lw || 1.2);
      circlePath(ctx, x1 - t * 0.2, y1 - t * 0.25, t * 0.22);
      fs(ctx, 'rgba(255,255,255,0.35)');
    }
    ctx.restore();
  }

  MT.Draw = {
    S, OL, TAU, rng, shade, mix, rgba, toInt, canvas, make,
    capsulePath, rrPath, ellipsePath, circlePath, fs, lin, rad, shadow, starPath, blobPath, limb,
  };
})();
