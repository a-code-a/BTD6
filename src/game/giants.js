// The giant fusion tiers. Every Ultimate form has its own extra attack on top
// of its boosted super-tower attack, and the Omega Mech fires the Omega Beam,
// which mixes the powers of its three parts. All of it runs on simulation time,
// so it pauses and fast-forwards with the game.
(function () {
  const U = MT.util;
  const S = MT.Draw.S;
  const W = MT.CFG.MAP_W, H = MT.CFG.H;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- helpers
  // per-tower repeating timer; returns true when it fires
  function every(t, key, period, dt) {
    const u = t.ux || (t.ux = {});
    if (u[key] == null) u[key] = period * 0.3;
    u[key] -= dt;
    if (u[key] > 0) return false;
    u[key] = Math.max(u[key] + period, period * 0.25);
    return true;
  }
  function retry(t, key, s) {
    t.ux[key] = s;
  }
  const near = (g, t, r) => g.enemiesInRange(t.x, t.y, r, true);
  const strongest = (list) => {
    let best = null;
    for (const e of list) if (!best || e.def.rbe > best.def.rbe || (e.def.rbe === best.def.rbe && e.remaining < best.remaining)) best = e;
    return best;
  };
  const leader = (list) => {
    let best = null;
    for (const e of list) if (!best || e.remaining < best.remaining) best = e;
    return best;
  };
  const spawn = (g, o) => {
    if (g.giantObjs.length > 400) return null;
    g.giantObjs.push(o);
    return o;
  };

  // all enemies within `width` of the segment from (x, y) along angle `a`
  function enemiesOnLine(g, x, y, a, len, width) {
    const dx = Math.cos(a), dy = Math.sin(a);
    const out = [];
    for (const e of g.enemies) {
      if (e.dead) continue;
      const rx = e.x - x, ry = e.y - y;
      const along = rx * dx + ry * dy;
      if (along < 0 || along > len) continue;
      if (Math.abs(rx * dy - ry * dx) <= width + e.radius * 0.5) out.push([along, e]);
    }
    out.sort((p, q) => p[0] - q[0]);
    return out.map((p) => p[1]);
  }

  function addTrap(g, t, x, y, p) {
    const sprite = g.add.image(x, y - 120, p.tex).setScale((p.scale || 1) / S).setDepth(980).setRotation(U.rand(-0.4, 0.4));
    const tr = { x, y, p, pierce: p.pierce, max: p.pierce, life: p.life || 12, tower: t, hit: new Set(), sprite };
    g.tweens.add({ targets: sprite, y, duration: 180, ease: 'Quad.easeIn' });
    g.traps.push(tr);
  }

  // ---------------------------------------------------------------- Ultimate attacks
  const ULT = {
    // Gravity Well: a golden black hole that holds and crushes mutants
    banana(g, t, dt) {
      if (!every(t, 'well', 4, dt)) return;
      const e = strongest(near(g, t, t.stats.range));
      if (!e) return retry(t, 'well', 0.4);
      const d = e.dist + 40;
      const q = e.path.at(d);
      spawn(g, { kind: 'vortex', x: q.x, y: q.y, path: e.path, d, r: 74, life: 2.8, max: 2.8, tick: 0, tower: t });
      MT.Audio.play('blink');
    },
    // Roaming Tornado: rolls backwards down the track, blowing mutants back
    fart(g, t, dt) {
      if (!every(t, 'nado', 4.5, dt)) return;
      const e = leader(near(g, t, t.stats.range + 40));
      if (!e) return retry(t, 'nado', 0.4);
      spawn(g, { kind: 'tornado', path: e.path, dist: e.dist + 60, end: e.dist - 700, speed: 300, hit: new Set(), tower: t, ph: 0 });
      MT.Audio.play('fart');
    },
    // Artillery Barrage: 8 shells arc onto the strongest mutant
    rocket(g, t, dt) {
      if (!every(t, 'arty', 2.2, dt)) return;
      const e = strongest(near(g, t, t.stats.range * 1.4));
      if (!e) return retry(t, 'arty', 0.3);
      const p = { tex: 'p_rocket', type: 'explosive', shred: 3, explode: { r: 56, dmg: 14, pierce: 40 }, moabDmg: 90 };
      for (let i = 0; i < 8; i++) {
        const lead = e.path.at(e.dist + e.speedNow() * 0.8 + U.rand(-50, 50));
        spawn(g, { kind: 'shell', sx: t.x + U.rand(-20, 20), sy: t.y - 40, tx: lead.x + U.rand(-14, 14), ty: lead.y + U.rand(-10, 10), age: 0, dur: 0.75, delay: i * 0.07, arc: 150, p, tower: t, tex: 'p_missile', scale: 0.6 });
      }
      MT.Audio.play('rocket');
    },
    // Hailstorm: huge icicles crash onto mutants in range
    freeze(g, t, dt) {
      if (!every(t, 'hail', 0.3, dt)) return;
      const list = near(g, t, t.stats.range);
      if (!list.length) return;
      const e = U.pick(list);
      spawn(g, { kind: 'icicle', e, x: e.x, y: e.y, age: 0, dur: 0.35, tower: t });
    },
    // Acid Pools: jelly puddles on the track
    jelly(g, t, dt) {
      if (!every(t, 'pool', 1.0, dt)) return;
      const list = near(g, t, t.stats.range);
      if (!list.length) return retry(t, 'pool', 0.2);
      const e = U.pick(list);
      const q = e.path.at(e.dist + 30);
      spawn(g, { kind: 'puddle', x: q.x, y: q.y, r: 42, life: 6, max: 6, tick: 0, tower: t, rot: Math.random() * TAU });
      MT.Audio.play('splat');
    },
    // Railgun: one shot through the whole map
    sniper(g, t, dt) {
      if (!every(t, 'rail', 0.9, dt)) return;
      const e = g.strongestBoss() || leader(g.enemies.filter((x) => !x.dead));
      if (!e) return retry(t, 'rail', 0.2);
      const sx = t.x + 64, sy = t.y - 24; // the railgun muzzle
      const a = Math.atan2(e.y - sy, e.x - sx);
      const hits = enemiesOnLine(g, sx, sy, a, 1500, 18).slice(0, 60);
      hits.forEach((h) => g.applyHit(h, { dmg: 50, moabDmg: 260, shred: 3, type: 'energy' }, t));
      const ex = sx + Math.cos(a) * 1500, ey = sy + Math.sin(a) * 1500;
      g.fx.beam(sx, sy, ex, ey, 0x40c4ff, 9, 0.28);
      g.fx.beam(sx, sy, ex, ey, 0xffffff, 3, 0.2);
      hits.slice(0, 12).forEach((h) => g.fx.sparks.explode(3, h.x, h.y));
      g.fx.muzzle(sx, sy, 0x80d8ff);
      MT.Audio.play('laser');
      MT.Audio.play('zap');
    },
    // Living Storm: lightning keeps striking from the sky
    tesla(g, t, dt) {
      if (!every(t, 'bolt', 0.11, dt)) return;
      const list = near(g, t, t.stats.range);
      if (!list.length) return;
      const e = U.pick(list);
      g.fx.lightning(e.x + U.rand(-50, 50), -20, e.x, e.y - 6, 0xd1b3ff, 2.6, 0.18);
      g.applyHit(e, { dmg: 10, moabDmg: 40, stun: { dur: 0.2 }, type: 'energy' }, t);
      g.fx.sparks.explode(2, e.x, e.y);
      MT.Audio.play('thunder');
    },
    // Strafing Runs: bombers carpet-bomb the track around the carrier
    pilot(g, t, dt) {
      if (!every(t, 'strafe', 5, dt)) return;
      const r = t.stats.range + t.stats.orbit;
      const pts = g.trackPoints({ x: t.x, y: t.y, stats: { range: r } }).filter((_, i) => i % 4 === 0);
      if (!pts.length || !near(g, t, r).length) return retry(t, 'strafe', 0.5);
      const p = { tex: 'p_rocket', type: 'explosive', explode: { r: 52, dmg: 12, pierce: 30 }, moabDmg: 160 };
      pts.slice(0, 18).forEach((q, i) => spawn(g, { kind: 'shell', sx: q.x, sy: q.y - 70, tx: q.x, ty: q.y, age: 0, dur: 0.25, delay: i * 0.06, arc: 0, p, tower: t, tex: 'p_minibomb', scale: 1.4 }));
      const jet = g.add.image(pts[0].x - 60, pts[0].y - 80, 'fx_bomber').setScale(1 / S).setDepth(6600);
      const last = pts[Math.min(17, pts.length - 1)];
      jet.rotation = Math.atan2(last.y - pts[0].y, last.x - pts[0].x);
      jet.setFlipY(Math.cos(jet.rotation) < 0);
      g.tweens.add({ targets: jet, x: last.x + 60, y: last.y - 80, duration: 1300, onComplete: () => jet.destroy() });
      MT.Audio.play('jet');
    },
    // Bass Drop: every beat hits everything in range, every 4th beat is a DROP
    rockstar(g, t, dt) {
      if (!every(t, 'beat', 0.55, dt)) return;
      const u = t.ux;
      u.beats = (u.beats || 0) + 1;
      const drop = u.beats % 4 === 0;
      const list = near(g, t, t.stats.range);
      if (!list.length) return;
      const p = drop
        ? { dmg: 30, moabDmg: 70, knock: 18, stun: { dur: 0.8, moab: true }, type: 'normal' }
        : { dmg: 6, moabDmg: 20, type: 'normal' };
      list.slice(0, 120).forEach((e) => g.applyHit(e, p, t));
      g.fx.ring(t.x, t.y, t.stats.range, drop ? 0xff4081 : 0x40c4ff, { disc: drop, dur: drop ? 500 : 300 });
      if (drop) {
        g.fx.notes.explode(8, t.x, t.y - 40);
        g.fx.screenFlash(U.pick([0xff4081, 0x40c4ff, 0xffd83a, 0x7be35a]), 0.1, 260);
        MT.Audio.play('chord');
      }
    },
    // Spike Wall & Slam
    nails(g, t, dt) {
      if (every(t, 'wall', 3, dt)) {
        const e = leader(near(g, t, t.stats.range));
        if (e) {
          const p = Object.assign({}, t.stats.proj, { pierce: t.stats.proj.pierce * 2, life: 10 });
          for (let i = 0; i < 8; i++) {
            const q = e.path.at(e.dist + 30 + i * 12);
            if (U.dist2(q.x, q.y, t.x, t.y) <= (t.stats.range + 30) ** 2) addTrap(g, t, q.x, q.y, p);
          }
          MT.Audio.play('nail');
        } else retry(t, 'wall', 0.4);
      }
      if (every(t, 'slam', 5, dt) && near(g, t, t.stats.range).length) {
        const sp = { tex: 'p_shrapnel', speed: 520, dmg: 6, pierce: 5, type: 'sharp', armored: true, r: 7, scale: 2.2 };
        for (let i = 0; i < 18; i++) g.addProjectile(new MT.Projectile(g, t, t.x, t.y, (i / 18) * TAU, sp, { range: t.stats.range }));
        g.fx.shockwave(t.x, t.y + 10, 120, 0x90a4ae, 400);
        g.fx.dust.explode(12, t.x, t.y + 20);
        MT.Audio.play('stomp');
      }
    },
    // Tentacle Grab
    sub(g, t, dt) {
      if (!every(t, 'grab', 1.3, dt)) return;
      const held = new Set(g.giantObjs.filter((o) => o.kind === 'tentacle').map((o) => o.e));
      const e = strongest(near(g, t, t.stats.range).filter((x) => !held.has(x)));
      if (!e) return retry(t, 'grab', 0.3);
      if (e.boss) e.tryStun(1.2);
      else e.stun = Math.max(e.stun, 1.6);
      spawn(g, { kind: 'tentacle', e, life: 1.6, dps: e.boss ? 320 : 30, tower: t, age: 0 });
      g.fx.splat(e.x, e.y, 26, 0x7e57c2);
    },
    // Banana Moons: three moons orbit and bonk mutants (+ interest at round end)
    farm(g, t, dt) {
      const u = t.ux || (t.ux = {});
      u.moonA = (u.moonA || 0) + dt * 1.6;
      u.mcd = u.mcd || new Map();
      for (let i = 0; i < 3; i++) {
        const a = u.moonA + (i * TAU) / 3;
        const mx = t.x + Math.cos(a) * 80, my = t.y - 10 + Math.sin(a) * 44;
        for (const e of g.queryEnemies(mx, my, 50)) {
          if (e.dead || U.dist2(mx, my, e.x, e.y) > (20 + e.radius * 0.5) ** 2) continue;
          if ((u.mcd.get(e.id) || 0) > g.roundTime) continue;
          u.mcd.set(e.id, g.roundTime + 0.6);
          g.applyHit(e, { dmg: 8, moabDmg: 40, knock: 3, type: 'normal' }, t);
          g.fx.sparks.explode(2, e.x, e.y);
        }
      }
      if (u.mcd.size > 500) u.mcd.clear();
    },
    // Clone Troopers
    lab(g, t, dt) {
      if (!every(t, 'clones', 3, dt)) return;
      const e = leader(near(g, t, t.stats.range));
      if (!e) return retry(t, 'clones', 0.4);
      for (let i = 0; i < 4; i++) {
        const start = e.dist + 90 + i * 22;
        spawn(g, { kind: 'clone', path: e.path, dist: start, end: start - 650, speed: 170, hit: new Set(), pierce: 12, tower: t, ph: Math.random() * 6 });
      }
      MT.Audio.play('bello');
    },
    // Portal Strikes: portals open next to mutants anywhere on the map
    super(g, t, dt) {
      if (!every(t, 'portal', 0.14, dt)) return;
      const list = g.enemies.filter((e) => !e.dead);
      if (!list.length) return;
      const e = Math.random() < 0.5 ? strongest(list) : U.pick(list);
      const a = Math.random() * TAU;
      const px = U.clamp(e.x + Math.cos(a) * 85, 10, W - 10), py = U.clamp(e.y + Math.sin(a) * 85, 10, H - 10);
      const p = Object.assign({}, t.stats.proj, { homing: true });
      const ang = Math.atan2(e.y - py, e.x - px);
      for (let k = 0; k < 2; k++) g.addProjectile(new MT.Projectile(g, t, px, py, ang + (k - 0.5) * 0.12, p, { range: 220, target: e }));
      g.fx.ring(px, py, 26, 0xb388ff, { dur: 260 });
      g.fx.sparkle(px, py, 0xfff176);
    },
  };

  // ---------------------------------------------------------------- Omega Beam
  // what each part adds to the beam
  const ELEMENT = {
    banana: (p) => { p.dmg *= 1.5; p.moabDmg *= 1.5; },
    fart: (p) => { p.dot = { dmg: 6, every: 0.5, dur: 4 }; },
    rocket: (p, o) => { p.shred = 4; o.blasts = true; },
    freeze: (p) => { p.freeze = { dur: 1.5, moab: 0.5 }; p.brittle = true; },
    jelly: (p) => { p.slow = { mul: 0.4, dur: 4, moab: true }; },
    sniper: (p) => { p.moabDmg *= 2; },
    tesla: (p, o) => { p.stun = { dur: 0.6, moab: true }; o.arcs = true; },
    pilot: (p, o) => { o.bombs = true; },
    rockstar: (p) => { p.knock = 15; },
    nails: (p, o) => { o.traps = true; },
    sub: (p, o) => { o.decamo = true; },
    farm: (p, o) => { o.cash = 3; },
    lab: (p, o) => { o.overdrive = true; },
    super: (p, o) => { o.width += 14; p.dmg *= 1.3; p.moabDmg *= 1.3; },
  };

  function omegaUpdate(g, t, dt) {
    const u = t.ux || (t.ux = {});
    if (u.charge > 0) {
      u.charge -= dt;
      if (u.charge <= 0) fireBeam(g, t);
      return;
    }
    if (!every(t, 'beam', 5, dt)) return;
    const list = near(g, t, t.stats.range * 1.6);
    const e = strongest(list);
    if (!e) return retry(t, 'beam', 0.4);
    u.target = e;
    u.charge = 0.7;
    MT.Audio.play('charge');
  }

  function fireBeam(g, t) {
    const u = t.ux;
    let e = u.target && !u.target.dead ? u.target : strongest(near(g, t, t.stats.range * 1.6));
    if (!e) return;
    const cx = t.x, cy = t.y - 11; // the chest core
    const a = Math.atan2(e.y - cy, e.x - cx);
    const p = { dmg: 40, moabDmg: 240, type: 'energy' };
    const o = { width: 22 };
    const types = t.subs.map((s) => s.type);
    types.forEach((ty) => ELEMENT[ty] && ELEMENT[ty](p, o));
    p.dmg = Math.round(p.dmg);
    p.moabDmg = Math.round(p.moabDmg);
    const len = 1500;
    const hits = enemiesOnLine(g, cx, cy, a, len, o.width).slice(0, 90);
    hits.forEach((h) => {
      if (o.decamo && h.camo) {
        h.camo = false;
        h.sprite.setTexture(h.texKey()).setAlpha(1);
      }
      g.applyHit(h, p, t);
      if (o.arcs && Math.random() < 0.4) g.fx.lightning(h.x, h.y, h.x + U.rand(-40, 40), h.y + U.rand(-40, 40), 0xd1b3ff, 2, 0.2);
    });
    if (o.cash) g.money += o.cash * hits.length;
    const far = Math.min(len, 900);
    const along = (d) => ({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d });
    if (o.blasts) for (let d = 120; d < far; d += 120) {
      const q = along(d);
      if (q.x > 0 && q.x < W && q.y > 0 && q.y < H) g.explode(q.x, q.y, { tex: 'p_rocket', type: 'explosive', shred: 3, explode: { r: 50, dmg: 10, pierce: 30 }, moabDmg: 100 }, t);
    }
    if (o.bombs) for (let i = 1; i <= 4; i++) {
      const q = along(i * 160);
      if (q.x > 0 && q.x < W && q.y > 0 && q.y < H) spawn(g, { kind: 'shell', sx: q.x, sy: q.y - 80, tx: q.x, ty: q.y, age: 0, dur: 0.3, delay: i * 0.08, arc: 0, p: { tex: 'p_rocket', type: 'explosive', explode: { r: 60, dmg: 14, pierce: 40 }, moabDmg: 200 }, tower: t, tex: 'p_minibomb', scale: 1.6 });
    }
    if (o.traps) {
      const nailP = { tex: 'fx_nails_big', dmg: 6, pierce: 25, type: 'sharp', armored: true, r: 14, life: 10, moabDmg: 20 };
      for (let i = 1; i <= 6; i++) {
        const q = along(i * 100);
        if (q.x > 0 && q.x < W && q.y > 0 && q.y < H) addTrap(g, t, q.x, q.y, nailP);
      }
    }
    if (o.overdrive) g.timed.push({ type: 'overdrive', t: 3, x: t.x, y: t.y, r: 280 });
    // the beam: one stripe per part colour around a white core
    const cols = t.subs.map((s) => U.hexInt(s.def.fusion.color));
    const ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len;
    const nx = -Math.sin(a), ny = Math.cos(a);
    cols.forEach((c, i) => {
      const off = (i - 1) * (o.width * 0.35);
      g.fx.beam(cx + nx * off, cy + ny * off, ex + nx * off, ey + ny * off, c, o.width * 0.45, 0.4);
    });
    g.fx.beam(cx, cy, ex, ey, 0xffffff, o.width * 0.3, 0.32);
    g.fx.shockwave(cx, cy, 90, 0xffffff, 350);
    hits.slice(0, 20).forEach((h) => g.fx.sparks.explode(2, h.x, h.y));
    g.shake(0.1);
    MT.Audio.play('laserBig');
  }

  // ---------------------------------------------------------------- objects
  function step(g, dt) {
    const L = g.giantObjs;
    for (let i = L.length - 1; i >= 0; i--) {
      const o = L[i];
      if (STEP[o.kind](g, o, dt) === false) {
        if (o.sprite) o.sprite.destroy();
        L.splice(i, 1);
      }
    }
  }

  const STEP = {
    vortex(g, o, dt) {
      o.life -= dt;
      o.tick -= dt;
      const doHit = o.tick <= 0;
      if (doHit) o.tick = 0.25;
      let n = 0;
      for (const e of g.queryEnemies(o.x, o.y, o.r + 40)) {
        if (e.dead || U.dist2(o.x, o.y, e.x, e.y) > (o.r + e.radius * 0.5) ** 2) continue;
        if (e.boss) e.auraMul = Math.min(e.auraMul, 0.4);
        else {
          e.stun = Math.max(e.stun, 0.12);
          if (e.path === o.path) e.dist += (o.d - e.dist) * Math.min(1, dt * 3);
        }
        if (doHit && n++ < 40) g.applyHit(e, { dmg: 3, moabDmg: 40, type: 'energy' }, o.tower);
      }
      return o.life > 0;
    },
    tornado(g, o, dt) {
      o.dist -= o.speed * dt;
      const p = o.path.at(o.dist);
      o.x = p.x;
      o.y = p.y;
      for (const e of g.queryEnemies(p.x, p.y, 50)) {
        if (e.dead || o.hit.has(e.id) || e.path !== o.path || U.dist2(p.x, p.y, e.x, e.y) > (32 + e.radius * 0.5) ** 2) continue;
        o.hit.add(e.id);
        if (e.boss) {
          g.applyHit(e, { dmg: 0, moabDmg: 150, type: 'normal' }, o.tower);
          e.dist = Math.max(0, e.dist - 25);
        } else {
          const kids = g.applyHit(e, { dmg: 6, knock: 20, dot: { dmg: 2, every: 0.5, dur: 3 }, type: 'normal' }, o.tower);
          if (kids) kids.forEach((k) => o.hit.add(k.id));
        }
      }
      return o.dist > Math.max(o.end, -20);
    },
    shell(g, o, dt) {
      if (o.delay > 0) {
        o.delay -= dt;
        return true;
      }
      o.age += dt;
      if (o.age >= o.dur) {
        g.explode(o.tx, o.ty, o.p, o.tower);
        return false;
      }
      return true;
    },
    icicle(g, o, dt) {
      o.age += dt;
      if (!o.e.dead) {
        o.x = o.e.x;
        o.y = o.e.y;
      }
      if (o.age < o.dur) return true;
      const p = { tex: 'p_ice', type: 'cold', armored: true, freeze: { dur: 1.2, moab: 0.35 }, brittle: true, explode: { r: 34, dmg: 5, pierce: 10 } };
      if (!o.e.dead) g.applyHit(o.e, { dmg: 16, moabDmg: 70, type: 'cold', armored: true, freeze: { dur: 1.2, moab: 0.35 } }, o.tower);
      g.explode(o.x, o.y, p, o.tower);
      return false;
    },
    puddle(g, o, dt) {
      o.life -= dt;
      o.tick -= dt;
      if (o.tick <= 0) {
        o.tick = 0.4;
        let n = 0;
        for (const e of g.queryEnemies(o.x, o.y, o.r + 40)) {
          if (n >= 25) break;
          if (e.dead || U.dist2(o.x, o.y, e.x, e.y) > (o.r + e.radius * 0.4) ** 2) continue;
          g.applyHit(e, { dmg: 4, moabDmg: 25, slow: { mul: 0.35, dur: 1.2, moab: true }, type: 'normal' }, o.tower);
          n++;
        }
      }
      return o.life > 0;
    },
    tentacle(g, o, dt) {
      o.life -= dt;
      o.age += dt;
      if (o.e.dead) return false;
      g.damageEnemy(o.e, o.dps * dt, o.tower);
      return o.life > 0 && !o.e.dead;
    },
    clone(g, o, dt) {
      o.dist -= o.speed * dt;
      const p = o.path.at(o.dist);
      o.x = p.x;
      o.y = p.y;
      for (const e of g.queryEnemies(p.x, p.y, 40)) {
        if (o.pierce <= 0) break;
        if (e.dead || o.hit.has(e.id) || U.dist2(p.x, p.y, e.x, e.y) > (e.radius + 12) ** 2) continue;
        o.hit.add(e.id);
        const kids = g.applyHit(e, { dmg: 12, moabDmg: 80, knock: 8, type: 'normal' }, o.tower);
        if (kids) kids.forEach((k) => o.hit.add(k.id));
        o.pierce--;
      }
      if (o.pierce <= 0 || o.dist < o.end || o.dist < -20) {
        g.fx.dust.explode(3, p.x, p.y);
        return false;
      }
      return true;
    },
  };

  // per-frame visuals of the objects
  function render(g, dt, time) {
    for (const o of g.giantObjs) {
      switch (o.kind) {
        case 'vortex': {
          if (!o.sprite) o.sprite = g.add.image(o.x, o.y, 'fx_vortex').setDepth(1990).setBlendMode(Phaser.BlendModes.NORMAL);
          const k = Math.min(1, (o.max - o.life) * 4, o.life * 3);
          o.sprite.setScale((k * o.r * 2.2) / 128).setRotation(o.sprite.rotation - dt * 6).setAlpha(0.9 * k);
          if (Math.random() < dt * 20) {
            const a = Math.random() * TAU;
            g.fx.sparkle(o.x + Math.cos(a) * o.r, o.y + Math.sin(a) * o.r * 0.6, 0xffd740);
          }
          break;
        }
        case 'tornado': {
          if (o.x == null) break;
          if (!o.sprite) o.sprite = g.add.image(o.x, o.y, 'fx_tornado').setOrigin(0.5, 0.95).setScale(1 / S);
          o.ph += dt * 20;
          o.sprite.setPosition(o.x + Math.sin(o.ph) * 3, o.y + 8).setDepth(1000 + o.y + 30);
          o.sprite.scaleX = (1 + Math.sin(o.ph * 0.7) * 0.08) / S;
          if (Math.random() < dt * 14) g.fx.gas.explode(1, o.x + U.rand(-24, 24), o.y + U.rand(-50, 0));
          break;
        }
        case 'shell': {
          if (o.delay > 0) break;
          if (!o.sprite) o.sprite = g.add.image(o.sx, o.sy, o.tex).setScale((o.scale || 1) / S).setDepth(6400);
          const k = Math.min(1, o.age / o.dur);
          const x = U.lerp(o.sx, o.tx, k), y = U.lerp(o.sy, o.ty, k) - Math.sin(k * Math.PI) * o.arc;
          if (o.arc) o.sprite.rotation = Math.atan2(y - o.sprite.y, x - o.sprite.x);
          o.sprite.setPosition(x, y);
          if (o.arc && Math.random() < 0.5) g.fx.trail.explode(1, x, y);
          break;
        }
        case 'icicle': {
          if (!o.sprite) o.sprite = g.add.image(o.x, o.y - 180, 'fx_icicle').setOrigin(0.5, 1).setScale(1 / S).setDepth(6300);
          const k = Math.min(1, o.age / o.dur);
          o.sprite.setPosition(o.x, o.y - 180 * (1 - k * k));
          break;
        }
        case 'puddle': {
          if (!o.sprite) o.sprite = g.add.image(o.x, o.y, 'fx_puddle').setDepth(985).setRotation(o.rot).setTint(0xff6fa0);
          const k = Math.min(1, (o.max - o.life) * 5, o.life);
          o.sprite.setScale((k * o.r * 2.2) / 96, (k * o.r * 1.5) / 96).setAlpha(0.85 * k);
          if (Math.random() < dt * 4) g.fx.goo.explode(1, o.x + U.rand(-o.r, o.r) * 0.7, o.y + U.rand(-o.r, o.r) * 0.4);
          break;
        }
        case 'tentacle': {
          if (o.e.dead) break;
          if (!o.sprite) o.sprite = g.add.image(o.e.x, o.e.y + 10, 'fx_tentacle').setOrigin(0.5, 1);
          const k = Math.min(1, o.age * 6, o.life * 5);
          const sc = (o.e.boss ? 1.3 : 0.85) * k;
          o.sprite.setPosition(o.e.x, o.e.y + 10).setScale(sc / S).setDepth(1000 + o.e.y + 1);
          o.sprite.rotation = Math.sin(time * 0.012 + o.life * 3) * 0.2;
          break;
        }
        case 'clone': {
          if (o.x == null) break;
          if (!o.sprite) o.sprite = g.add.image(o.x, o.y, 'fx_clone').setScale(1 / S);
          o.ph += dt * 16;
          const a = o.path.angleAt(Math.max(0, Math.min(o.path.length, o.dist)));
          o.sprite.setPosition(o.x, o.y - Math.abs(Math.sin(o.ph)) * 5 - 6).setFlipX(Math.cos(a) > 0).setDepth(1000 + o.y);
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------- tower hooks
  function update(g, t, dt) {
    const fn = ULT[t.type];
    if (fn) fn(g, t, dt);
  }

  // extra visuals that belong to the tower itself
  function renderTower(g, t, dt, time) {
    const u = t.ux || (t.ux = {});
    if (t.ultimate && t.type === 'farm') {
      if (!u.moons) u.moons = [0, 1, 2].map(() => g.add.image(t.x, t.y, 'fx_moon_banana').setScale(1 / S));
      u.moons.forEach((m, i) => {
        const a = (u.moonA || 0) + (i * TAU) / 3;
        const y = t.y - 10 + Math.sin(a) * 44;
        m.setPosition(t.x + Math.cos(a) * 80, y - 16).setRotation(a * 0.5).setDepth(1000 + y + 20);
      });
    }
    if (t.omega && u.charge > 0) {
      // the core glows up before the beam fires
      if (Math.random() < 0.8) g.fx.sparkle(t.x + U.rand(-14, 14), t.y - 11 + U.rand(-12, 12), U.pick(t.subs.map((s) => U.hexInt(s.def.fusion.color))));
    }
  }

  function cleanup(t) {
    if (t.ux && t.ux.moons) t.ux.moons.forEach((m) => m.destroy());
    if (t.ux) t.ux.moons = null;
  }

  // Banana Planet pays interest when a round ends
  function roundEnd(g) {
    let extra = 0;
    for (const t of g.units()) {
      if (t.ultimate && t.type === 'farm') extra += Math.min(20000, Math.floor(g.money * 0.03));
    }
    return extra;
  }

  MT.Giants = { update, omegaUpdate, step, render, renderTower, cleanup, roundEnd, ULT, ELEMENT };
})();
