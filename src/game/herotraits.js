// Hero signature traits (the `trait` of every hero in data/heroes*.js): the
// part of a hero that asks the player for a decision, so each one plays
// differently instead of being just another shooter.
//  - Gru       Master Plan: one global plan for the map (switching mid-round has a cooldown)
//  - Lucy      Agent Mark: hit mutants take more damage from everything; free MOVE (Grapple)
//  - Nefario   Gadgets: goo traps the player drops on the track
//  - Kevin     Teamwork: faster for every DIFFERENT tower kind around him
//  - Vector    Reverse!: every few squids shove mutants back along the track
//  - Dru       Investor: interest on the bananas you saved
//  - Agnes     Best Friend: one chosen tower that grows stronger every round
//  - El Macho  Roadblock: holds mutants in place while his Guard lasts
(function () {
  const U = MT.util;
  const S = MT.Draw.S;

  const pct = (v) => Math.round(v * 100) + '%';
  const PLANS = {
    heist: { name: 'HEIST', color: '#ffd83a', base: 0.1, cap: 0.6, desc: (v) => `+${pct(v)} bananas from every pop` },
    assault: { name: 'ASSAULT', color: '#ff8a65', base: 0.06, cap: 0.35, desc: (v) => `every tower attacks ${pct(v)} faster` },
    lockdown: { name: 'LOCKDOWN', color: '#80d8ff', base: 0.08, cap: 0.35, desc: (v) => `mutants walk ${pct(v)} slower (giants ${pct(v / 2)})` },
    moonshot: { name: 'MOON SHOT', color: '#ce93d8', base: 0.3, cap: 1, desc: (v) => `abilities recharge ${pct(v)} faster` },
  };
  const PLAN_CD = 20; // seconds before Gru can change plans again in the middle of a round

  const traitOf = (t) => (t && t.hero && t.def.trait ? t.def.trait.id : null);
  const stars = (t) => (t && t.stars) || 0;

  // ------------------------------------------------------------------ numbers
  function planValue(t, id) {
    const P = PLANS[id];
    return Math.min(P.cap, P.base * (t.stats.planMul || 1) * (1 + 0.1 * stars(t)));
  }

  function teamRate(t) {
    const tw = t.stats && t.stats.teamwork;
    if (!tw || !t.team) return 0;
    return Math.min(0.5, t.team * tw.per * (1 + 0.05 * stars(t)));
  }

  function markAmp(m, t) {
    return Math.min(0.75, m.amp + 0.02 * stars(t));
  }

  function interestNow(g, t) {
    const i = t.stats.interest;
    const cap = i.cap + 300 * stars(t);
    return Math.floor(Math.min(cap, Math.max(0, g.money) * i.pct));
  }

  function guardMax(t) {
    return t.stats.block.guard + 0.25 * stars(t);
  }

  function holdMax(t) {
    return t.stats.block.hold + Math.floor(stars(t) / 2);
  }

  function gadgetMax(t) {
    return t.stats.gadgets.n + (stars(t) >= MT.LEGEND_STAR ? 1 : 0);
  }

  // ------------------------------------------------------------------ buffs (called from recalcBuffs)
  function refresh(g) {
    const h = g.towers.find((t) => t.hero && !t.dead) || null;
    g.traitHero = h;
    const plan = { heist: 0, assault: 0, lockdown: 0, moonshot: 0 };
    const id = traitOf(h);
    if (id === 'plan') {
      if (!h.plan || !h.stats.plans.includes(h.plan)) h.plan = h.stats.plans[0];
      plan[h.plan] = planValue(h, h.plan);
    } else if (id === 'team') {
      // different tower kinds inside Kevin's ring (ten Banana Throwers are one kind)
      const r = h.stats.buffRange;
      const kinds = new Set();
      for (const t of g.towers) if (!t.hero && !t.dead && U.dist(t.x, t.y, h.x, h.y) <= r) kinds.add(t.type);
      const n = Math.min(8, kinds.size);
      if (h.team != null && n > h.team) g.fx.floatText(h.x, h.y - 70, `TEAM ×${n}!`, '#ffd83a', 18);
      h.team = n;
    } else if (id === 'friend' && h.friend && !g.towers.includes(h.friend)) {
      // the friend was sold or fused away
      h.friend = null;
      h.hearts = 0;
    }
    g.plan = plan;
  }

  // extra Command a support hero hands out (Kevin's Teamwork)
  function buffExtra(s) {
    if (traitOf(s) !== 'team') return null;
    return { rate: teamRate(s), pierce: s.team >= 4 && s.stats.teamwork.pierce ? 1 : 0 };
  }

  // what Agnes gives her Best Friend
  function friendBuff(g, t) {
    const h = g.traitHero;
    if (!h || h.friend !== t || traitOf(h) !== 'friend') return null;
    const f = h.stats.friend;
    const n = Math.min(h.hearts || 0, f.hearts);
    const k = 1 + 0.05 * stars(h);
    return { rate: (f.rate + 0.05 * n) * k, range: f.range, pierce: f.pierce, dmg: f.dmg * n * k, camo: f.camo };
  }

  // ------------------------------------------------------------------ hits (called from applyHit)
  function mark(g, e, m, t) {
    const amp = markAmp(m, t);
    e.markAmp = e.markT > 0 ? Math.max(e.markAmp, amp) : amp;
    e.markT = Math.max(e.markT, m.dur);
    if (m.decamo && e.camo && !e.def.alwaysCamo) {
      e.camo = false;
      e.sprite.setTexture(e.texKey()).setAlpha(1);
      g.fx.sparkle(e.x, e.y - e.radius, 0xff4fa3);
    }
  }

  function reverse(g, e, rv, t) {
    const push = rv.push + 5 * stars(t);
    let n = 0;
    for (const o of g.enemiesInRange(e.x, e.y, rv.r, true)) {
      if (o.reversed >= rv.max) continue;
      const k = o.def.final || o.def.bossFight ? rv.giants * 0.3 : o.boss ? rv.giants : 1;
      if (k <= 0) continue;
      o.dist = Math.max(0, o.dist - push * k);
      o.reversed++;
      n++;
      if (n <= 6) g.fx.glowTrail(o.x, o.y - 6, 0xff8a3a);
    }
    if (!n) return;
    g.fx.ring(e.x, e.y, rv.r, 0xff8a3a, { dur: 380, force: true });
    if (t && g.stat.time - (t.revFx || -9) > 1.6) {
      t.revFx = g.stat.time;
      g.fx.floatText(e.x, e.y - 34, 'REVERSE!', '#ff8a3a', 16);
    }
  }

  // ------------------------------------------------------------------ per step
  // before the mutants move: El Macho grabs the ones that reach him
  function preStep(g, dt) {
    const h = g.traitHero;
    if (traitOf(h) !== 'block') return;
    const b = h.stats.block;
    const max = guardMax(h);
    if (h.guard == null) h.guard = max;
    const r = h.stats.range;
    const inReach = (e) => U.dist2(h.x, h.y, e.x, e.y) <= (r + e.radius * 0.5) ** 2;
    // wrestled giants walk slower (level 8)
    if (b.giants && !(h.disabled > 0)) {
      for (const e of g.queryEnemies(h.x, h.y, r + 60)) {
        if (!e.dead && e.boss && !e.flying && inReach(e)) e.auraMul = Math.min(e.auraMul, e.def.final || e.def.bossFight ? 0.8 : b.giants);
      }
    }
    if (h.tired && h.guard >= max * 0.6) h.tired = false;
    const old = h.holding || [];
    const can = !h.tired && !(h.disabled > 0);
    // keep holding the same mutants while they are alive and in reach
    const keep = can ? old.filter((e) => !e.dead && !e.burrowed && inReach(e)) : [];
    for (const e of old) if (!keep.includes(e)) e.held = false;
    if (can && keep.length < holdMax(h)) {
      const cands = [];
      for (const e of g.queryEnemies(h.x, h.y, r + 40)) {
        if (e.dead || e.held || e.flying || e.burrowed || e.boss || (e.camo && !h.stats.camo) || !inReach(e)) continue;
        cands.push(e);
      }
      cands.sort((a, c) => c.dist - a.dist);
      for (let i = 0; i < cands.length && keep.length < holdMax(h); i++) {
        cands[i].held = true;
        keep.push(cands[i]);
      }
      if (!old.length && keep.length && g.stat.time - (h.holdFx || -9) > 5) {
        h.holdFx = g.stat.time;
        g.fx.speech(h.x, h.y - 74, U.pick(['¡ALTO!', 'Nobody passes!', 'Olé!']));
      }
    }
    h.holding = keep;
    if (keep.length) {
      h.guard -= dt;
      if (h.guard <= 0) {
        h.guard = 0;
        h.tired = true;
        for (const e of keep) e.held = false;
        h.holding = [];
        g.fx.floatText(h.x, h.y - 64, 'PHEW!', '#ffab91', 16);
      }
    } else h.guard = Math.min(max, h.guard + dt * 0.75);
  }

  // after the towers acted: gadgets, cooldowns
  function step(g, dt) {
    const h = g.traitHero;
    if (!h) return;
    if (h.grappleCd > 0) h.grappleCd -= dt;
    if (h.planCd > 0) h.planCd -= dt;
    if (!h.gadgets || !h.gadgets.length) return;
    const gs = h.stats.gadgets;
    for (const gd of h.gadgets) {
      gd.tick -= dt;
      const hitNow = gd.tick <= 0;
      if (hitNow) gd.tick = 0.5;
      for (const e of g.queryEnemies(gd.x, gd.y, gs.r + 40)) {
        if (e.dead || e.flying || e.burrowed || U.dist2(gd.x, gd.y, e.x, e.y) > (gs.r + e.radius * 0.5) ** 2) continue;
        e.auraMul = Math.min(e.auraMul, e.boss ? Math.max(gs.slow, 0.85) : gs.slow);
        if (!hitNow) continue;
        if (gs.decamo && e.camo && !e.def.alwaysCamo) {
          e.camo = false;
          e.sprite.setTexture(e.texKey()).setAlpha(1);
          g.fx.sparkle(e.x, e.y - e.radius, 0x9be15d);
        }
        if (gs.dmg) g.applyHit(e, { dmg: gs.dmg, type: 'normal', ground: true }, h);
      }
    }
  }

  // once per round (or boss wave), from flatIncome: interest and hearts. Returns extra income.
  function roundEnd(g) {
    const h = g.traitHero;
    const id = traitOf(h);
    if (id === 'friend' && h.friend && (h.hearts || 0) < h.stats.friend.hearts) {
      h.hearts = (h.hearts || 0) + 1;
      g.fx.floatText(h.friend.x, h.friend.y - 60, '♥ +1', '#ff9ce6', 18);
      g.recalcBuffs();
    }
    if (id !== 'invest') return 0;
    const v = interestNow(g, h);
    if (v > 0) {
      h.earned += v;
      g.fx.floatText(h.x, h.y - 74, `+${U.money(v)} interest`, '#ffd740', 18);
    }
    return v;
  }

  // ------------------------------------------------------------------ player actions
  function setPlan(g, h, id) {
    if (id === h.plan) return;
    if (h.planCd > 0) {
      MT.Audio.play('error');
      g.hud.toast(`Gru needs ${Math.ceil(h.planCd)}s before the next plan`, 1400);
      return;
    }
    h.plan = id;
    // free between rounds, a cooldown in the middle of one
    h.planCd = g.roundActive ? PLAN_CD : 0;
    g.recalcBuffs();
    const P = PLANS[id];
    g.fx.ring(h.x, h.y, 90, U.hexInt(P.color), { dur: 500, force: true });
    g.fx.floatText(h.x, h.y - 80, `PLAN: ${P.name}!`, P.color, 22);
    g.fx.speech(h.x, h.y - 70, 'Lightbulb!');
    MT.Audio.play('upgrade');
    g.markDirty();
    if (g.selected === h) g.hud.showTower(h);
  }

  // Nefario's gadget / Agnes' friend: the next map click picks the spot or tower
  function startPick(g, h, kind) {
    g.cancelPlacing();
    g.cancelMove();
    g.cancelSpecial();
    g.heroPick = { t: h, kind };
    g.hud.toast(kind === 'gadget' ? 'Click the track to drop a goo gadget  ·  Esc to cancel' : "Click the tower that should be Agnes' Best Friend  ·  Esc to cancel", 2400);
    MT.Audio.play('click');
  }

  function canFriend(t) {
    return t && !t.hero && !t.component && t.stats.attack !== 'none';
  }

  function pick(g, x, y) {
    const pk = g.heroPick;
    if (!pk) return;
    const h = pk.t;
    if (!g.towers.includes(h)) {
      g.heroPick = null;
      return;
    }
    if (pk.kind === 'gadget') {
      const at = MT.Powers.trackSpot(g, x, y);
      if (!at) {
        MT.Audio.play('error');
        g.hud.toast('Gadgets go on the track!', 1200);
        return;
      }
      placeGadget(g, h, at.x, at.y);
      MT.Audio.play('place');
      g.fx.goo.explode(8, at.x, at.y);
      g.fx.speech(h.x, h.y - 70, U.pick(['I have a new gadget!', 'Ha ha! Goo!', 'Sticky!']));
    } else {
      const t = g.towerAt(x, y);
      if (!canFriend(t)) {
        MT.Audio.play('error');
        g.hud.toast('Pick one of your attacking towers', 1200);
        return;
      }
      if (h.friend !== t) {
        h.friend = t;
        h.hearts = 0;
        g.recalcBuffs();
      }
      g.fx.ring(t.x, t.y, 50, 0xff9ce6, { dur: 500, force: true });
      g.fx.floatText(t.x, t.y - 60, 'BEST FRIEND!', '#ff9ce6', 18);
      g.fx.speech(h.x, h.y - 66, U.pick(["It's so fluffy!", 'You are my best friend!']));
      MT.Audio.play('upgrade');
    }
    g.heroPick = null;
    g.markDirty();
    if (g.selected === h) g.hud.showTower(h);
  }

  // Nefario's goo trap: a bright green puddle with a little blinking gadget in the middle
  function gadgetTex(g) {
    const D = MT.Draw;
    return D.make(g, 'fx_gadget', 96, 64, (ctx) => {
      ctx.save();
      ctx.translate(48, 34);
      ctx.scale(1, 0.62);
      D.blobPath(ctx, 0, 0, 44, 12, 0.14, D.rng(7));
      ctx.restore();
      ctx.fillStyle = D.rad(ctx, 42, 28, 4, 48, 34, 46, [[0, 'rgba(200,255,140,0.95)'], [0.65, 'rgba(124,205,62,0.92)'], [1, 'rgba(66,138,28,0.92)']]);
      ctx.fill();
      ctx.strokeStyle = '#2f6b14';
      ctx.lineWidth = 2;
      ctx.stroke();
      const rnd = D.rng(11);
      for (let i = 0; i < 7; i++) {
        D.circlePath(ctx, 16 + rnd() * 64, 20 + rnd() * 26, 2 + rnd() * 3);
        D.fs(ctx, 'rgba(235,255,210,0.7)', 'rgba(47,107,20,0.6)', 1);
      }
      // the gadget: a little box with an antenna and a red light
      D.rrPath(ctx, 39, 26, 18, 13, 3);
      D.fs(ctx, '#aeb8c4', D.OL, 1.5);
      ctx.strokeStyle = D.OL;
      ctx.beginPath();
      ctx.moveTo(52, 26);
      ctx.lineTo(55, 15);
      ctx.stroke();
      D.circlePath(ctx, 55, 14, 2.6);
      D.fs(ctx, '#ff5252', D.OL, 1);
      D.circlePath(ctx, 45, 32, 2.4);
      D.fs(ctx, '#9be15d', D.OL, 1);
    });
  }

  function placeGadget(g, h, x, y) {
    h.gadgets = h.gadgets || [];
    // one more than he has: the oldest one moves
    while (h.gadgets.length >= gadgetMax(h)) {
      const old = h.gadgets.shift();
      old.sprite.destroy();
    }
    const r = h.stats.gadgets.r;
    const sprite = g.add.image(x, y, gadgetTex(g)).setDepth(984).setScale((r * 2.2) / 96 / S);
    h.gadgets.push({ x, y, sprite, tick: 0, fxT: 0 });
  }

  // ------------------------------------------------------------------ visuals
  // after the boss bars: marks, guard bar, labels, gadgets, the friend's heart
  function render(g, gfx, dt, time) {
    // Lucy's marks: a pink crosshair on every marked mutant
    let shown = 0;
    for (const e of g.enemies) {
      if (e.dead || !(e.markT > 0) || shown++ > 40) continue;
      const r = e.radius + 5, a = time * 0.004;
      gfx.lineStyle(2, 0xff4fa3, Math.min(1, e.markT * 2));
      gfx.strokeCircle(e.x, e.y, r);
      for (let i = 0; i < 4; i++) {
        const k = a + (i * Math.PI) / 2;
        gfx.lineBetween(e.x + Math.cos(k) * (r - 3), e.y + Math.sin(k) * (r - 3), e.x + Math.cos(k) * (r + 5), e.y + Math.sin(k) * (r + 5));
      }
    }
    const h = g.traitHero;
    const id = traitOf(h);
    if (!id) return;
    if (id === 'block') {
      // Guard bar under El Macho's feet (speech bubbles sit above his head)
      const w = 44, x = h.x - w / 2, y = h.y + 26;
      const f = U.clamp(h.guard / guardMax(h), 0, 1);
      gfx.fillStyle(0x1a1a1a, 0.8);
      gfx.fillRoundedRect(x - 2, y - 2, w + 4, 9, 4);
      gfx.fillStyle(h.tired ? 0xff6b6b : h.holding && h.holding.length ? 0xffc61a : 0x7be35a, 1);
      gfx.fillRoundedRect(x, y, Math.max(2, w * f), 5, 2.5);
      for (const e of h.holding || []) {
        gfx.lineStyle(2, 0xff5252, 0.7);
        gfx.strokeCircle(e.x, e.y, e.radius + 3);
      }
    }
    // small label over Gru (his plan) and Kevin (team size)
    const label = id === 'plan' ? PLANS[h.plan] && PLANS[h.plan].name : id === 'team' ? `TEAM ×${h.team || 0}` : null;
    if (label) {
      if (!h.traitLabel) h.traitLabel = MT.text(g, h.x, h.y - 78, '', 11, { title: true, strokeThickness: 3 }).setDepth(5001);
      const col = id === 'plan' ? PLANS[h.plan].color : '#ffd83a';
      if (h.traitLabel.text !== label) h.traitLabel.setText(label).setColor(col);
      h.traitLabel.setPosition(h.x, h.y - 78 - (h.giant > 0 ? 40 : 0));
    }
    if (id === 'gadgets') {
      for (const gd of h.gadgets || []) {
        gd.fxT -= dt;
        if (gd.fxT <= 0) {
          gd.fxT = 0.3;
          g.fx.goo.explode(1, gd.x + U.rand(-24, 24), gd.y + U.rand(-12, 12));
        }
        gd.sprite.setAlpha(0.9 + Math.sin(time * 0.004 + gd.x) * 0.1);
      }
    }
    if (id === 'friend') {
      const f = h.friend;
      if (f && !h.friendIcon) {
        h.friendIcon = g.add.image(0, 0, 'ic_heart').setDisplaySize(22, 22).setDepth(5001);
        h.friendText = MT.text(g, 0, 0, '', 11, { title: true, color: '#ff9ce6', strokeThickness: 3 }).setDepth(5001);
      }
      if (h.friendIcon) {
        h.friendIcon.setVisible(!!f);
        h.friendText.setVisible(!!f);
        if (f) {
          const bob = Math.sin(time * 0.005) * 3;
          h.friendIcon.setPosition(f.x, f.y - 62 + bob);
          const t = `×${h.hearts || 0}`;
          if (h.friendText.text !== t) h.friendText.setText(t);
          h.friendText.setPosition(f.x + 18, f.y - 60 + bob);
        }
      }
    }
  }

  // previews in the range layer: choosing a gadget spot / a friend, and the selected hero
  function preview(g, rg, time) {
    const pk = g.heroPick;
    const x = g.pointer.x, y = g.pointer.y;
    if (pk && x < MT.CFG.MAP_W) {
      if (pk.kind === 'gadget') {
        const at = MT.Powers.trackSpot(g, x, y);
        const r = pk.t.stats.gadgets.r;
        rg.fillStyle(at ? 0x9be15d : 0xff3030, 0.3);
        rg.fillCircle(at ? at.x : x, at ? at.y : y, r);
        g.drawCrosshair(rg, at ? at.x : x, at ? at.y : y, time, at ? 0x9be15d : 0xff3030);
        if (pk.t.gadgets && pk.t.gadgets.length >= gadgetMax(pk.t)) {
          // this one moves
          const old = pk.t.gadgets[0];
          rg.lineStyle(2, 0xff3030, 0.6);
          rg.strokeCircle(old.x, old.y, r);
        }
      } else {
        const t = g.towerAt(x, y);
        const ok = canFriend(t);
        if (t) {
          rg.lineStyle(3, ok ? 0xff9ce6 : 0xff3030, 0.8);
          rg.strokeCircle(t.x, t.y - 8, 32);
        }
        rg.lineStyle(2, 0xff9ce6, 0.5);
        rg.lineBetween(pk.t.x, pk.t.y - 20, t ? t.x : x, t ? t.y - 8 : y);
      }
      return true;
    }
    return false;
  }

  function selectedExtras(g, rg, h, time) {
    const id = traitOf(h);
    const pulse = 0.5 + Math.sin(time * 0.01) * 0.25;
    if (id === 'gadgets') {
      for (const gd of h.gadgets || []) {
        rg.lineStyle(2, 0x9be15d, pulse);
        rg.strokeCircle(gd.x, gd.y, h.stats.gadgets.r);
      }
    } else if (id === 'friend' && h.friend) {
      rg.lineStyle(2, 0xff9ce6, pulse);
      rg.lineBetween(h.x, h.y - 20, h.friend.x, h.friend.y - 8);
      rg.strokeCircle(h.friend.x, h.friend.y - 8, 32);
    } else if (id === 'team') {
      // one ring per tower kind that counts for the team
      const seen = new Set();
      for (const t of g.towers) {
        if (t.hero || seen.has(t.type) || U.dist(t.x, t.y, h.x, h.y) > h.stats.buffRange) continue;
        seen.add(t.type);
        rg.lineStyle(2, 0xffd83a, pulse);
        rg.strokeCircle(t.x, t.y - 8, 26);
      }
    }
  }

  // ------------------------------------------------------------------ HUD text
  // short live status next to the trait name in the upgrade panel
  function status(g, h) {
    switch (traitOf(h)) {
      case 'plan': return PLANS[h.plan] ? PLANS[h.plan].name : '';
      case 'agent': return `+${pct(markAmp(h.stats.proj.mark, h))} dmg\n` + (h.grappleCd > 0 ? `grapple ${Math.ceil(h.grappleCd)}s` : 'grapple ready');
      case 'gadgets': return `${(h.gadgets || []).length}/${gadgetMax(h)}`;
      case 'team': return `×${h.team || 0} kinds\n+${pct(teamRate(h))} speed`;
      case 'reverse': {
        const ev = h.stats.reverse.every;
        const left = ev - (h.shots % ev);
        return left === 1 ? 'next shot!' : `in ${left} shots`;
      }
      case 'invest': return `+${U.money(interestNow(g, h))}\nnext round`;
      case 'friend': return h.friend ? `♥ ${h.hearts || 0}/${h.stats.friend.hearts}` : 'no friend';
      case 'block': return h.tired ? 'catching breath' : `guard ${h.guard != null ? h.guard.toFixed(1) : guardMax(h).toFixed(1)}s\nholds ${holdMax(h)}`;
    }
    return '';
  }

  // full explanation with the current numbers (hover on the trait name)
  function tooltip(g, h) {
    const T = h.def.trait;
    const s = h.stats;
    let now = '';
    switch (T.id) {
      case 'plan':
        now = s.plans.map((id) => `${id === h.plan ? '▶ ' : '   '}${PLANS[id].name}: ${PLANS[id].desc(planValue(h, id))}`).join('\n');
        if (h.planCd > 0) now += `\nNext change in ${Math.ceil(h.planCd)}s`;
        break;
      case 'agent': now = `Marks: +${pct(markAmp(s.proj.mark, h))} damage taken for ${s.proj.mark.dur}s` + (s.proj.mark.decamo ? ', Camo washed off' : '') + `\nGrapple cooldown: ${s.grapple}s`; break;
      case 'gadgets': now = `Gadgets: ${(h.gadgets || []).length}/${gadgetMax(h)}  ·  slow ${pct(1 - s.gadgets.slow)}` + (s.gadgets.dmg ? `  ·  ${s.gadgets.dmg} damage` : '') + (s.gadgets.decamo ? '  ·  washes Camo' : ''); break;
      case 'team': now = `Now: ${h.team || 0} kinds → +${pct(teamRate(h))} attack speed` + (s.teamwork.pierce ? (h.team >= 4 ? ', +1 pierce' : ' (4 kinds: +1 pierce)') : ''); break;
      case 'reverse': now = `Every ${s.reverse.every} squids  ·  shoves ${s.reverse.push + 5 * stars(h)} px` + (s.reverse.giants ? `  ·  giants ${pct(s.reverse.giants)}` : ''); break;
      case 'invest': now = `${pct(s.interest.pct)} of your bananas, max ${U.money(s.interest.cap + 300 * stars(h))}\nNext payout: ${U.money(interestNow(g, h))}`; break;
      case 'friend': {
        const fb = h.friend ? friendBuff(g, h.friend) : null;
        now = h.friend ? `${h.friend.name}: ♥ ${h.hearts || 0}/${s.friend.hearts}  ·  +${pct(fb.rate)} speed` + (fb.dmg ? `, +${pct(fb.dmg)} damage` : '') : 'No friend yet: click FRIEND.';
        break;
      }
      case 'block': now = `Holds ${holdMax(h)} mutants  ·  Guard ${guardMax(h).toFixed(1)}s` + (s.block.giants ? `  ·  giants ${pct(1 - s.block.giants)} slower` : ''); break;
    }
    return T.desc + (now ? '\n' + now : '');
  }

  // ------------------------------------------------------------------ save / load / cleanup
  function save(t) {
    switch (traitOf(t)) {
      case 'plan': return { plan: t.plan };
      case 'gadgets': return { gadgets: (t.gadgets || []).map((gd) => [Math.round(gd.x), Math.round(gd.y)]) };
      case 'friend': return t.friend ? { friend: [Math.round(t.friend.x), Math.round(t.friend.y)], hearts: t.hearts || 0 } : null;
    }
    return null;
  }

  function load(g, t, o) {
    if (!o) return;
    if (o.plan) t.plan = o.plan;
    if (o.gadgets) o.gadgets.forEach(([x, y]) => placeGadget(g, t, x, y));
    if (o.friend) {
      t.pendingFriend = o.friend;
      t.hearts = o.hearts || 0;
    }
  }

  // after every tower of a saved game is back: find Agnes' friend again
  function afterLoad(g) {
    for (const h of g.towers) {
      if (!h.pendingFriend) continue;
      const [x, y] = h.pendingFriend;
      h.friend = g.towers.find((t) => t !== h && Math.abs(t.x - x) < 2 && Math.abs(t.y - y) < 2) || null;
      if (!h.friend) h.hearts = 0;
      h.pendingFriend = null;
    }
  }

  function onRemove(g, t) {
    (t.gadgets || []).forEach((gd) => gd.sprite.destroy());
    t.gadgets = [];
    (t.holding || []).forEach((e) => (e.held = false));
    t.holding = [];
    if (t.traitLabel) t.traitLabel.destroy();
    if (t.friendIcon) t.friendIcon.destroy();
    if (t.friendText) t.friendText.destroy();
    t.traitLabel = t.friendIcon = t.friendText = null;
    if (g.heroPick && g.heroPick.t === t) g.heroPick = null;
  }

  MT.HeroTraits = {
    PLANS, planValue, teamRate, interestNow,
    refresh, buffExtra, friendBuff, mark, reverse, preStep, step, roundEnd,
    setPlan, startPick, pick, render, preview, selectedExtras, status, tooltip,
    save, load, afterLoad, onRemove, traitOf,
  };
})();
