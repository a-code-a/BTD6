// Persistent progress (medals per map/difficulty), settings, the meta
// progression (Gru Coins, lab research, powers, unlocked heroes, achievements)
// and saved games that can be continued later.
(function () {
  const KEY = 'minion-td-save-v1';
  const RUNS_KEY = 'minion-td-runs-v1';
  const MAX_RUNS = 6;
  // every player starts with enough Gru Coins for the first new hero
  const WELCOME_COINS = 200;
  let data = null;
  let runs = null;

  function freshMeta() {
    return { coins: 0, earned: 0, research: {}, powers: {}, heroes: {}, ach: {}, counters: {} };
  }

  function load() {
    if (data) return data;
    data = { settings: { sfx: true, music: true, sfxVol: 0.8, musicVol: 0.6, autoStart: false, shake: 'low', hero: 'gru' }, medals: {}, bosses: {}, stats: { pops: 0, games: 0, wins: 0, best: 0 }, meta: null };
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        data.settings = Object.assign(data.settings, parsed.settings || {});
        data.medals = parsed.medals || {};
        data.bosses = parsed.bosses || {};
        data.stats = Object.assign(data.stats, parsed.stats || {});
        if (parsed.meta) data.meta = Object.assign(freshMeta(), parsed.meta);
      }
    } catch (e) {
      /* storage unavailable: play without saving */
    }
    if (!data.meta) {
      // first start with the progression system: a welcome gift, plus coins
      // for everything that was already won before it existed
      data.meta = freshMeta();
      let medals = 0, bosses = 0;
      Object.values(data.medals).forEach((m) => (medals += Object.values(m).filter(Boolean).length));
      Object.values(data.bosses).forEach((b) => (bosses += Object.keys(b).length));
      const gift = WELCOME_COINS + medals * 30 + bosses * 50;
      data.meta.coins = gift;
      data.meta.welcome = gift;
      persist();
    }
    return data;
  }

  function persist() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function loadRuns() {
    if (runs) return runs;
    runs = {};
    try {
      const raw = window.localStorage.getItem(RUNS_KEY);
      if (raw) runs = JSON.parse(raw) || {};
    } catch (e) {
      runs = {};
    }
    return runs;
  }

  function persistRuns() {
    try {
      window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
    } catch (e) {
      /* ignore */
    }
  }

  const meta = () => load().meta;

  MT.Save = {
    settings() {
      return load().settings;
    },
    setSetting(k, v) {
      load().settings[k] = v;
      persist();
    },
    medals(mapId) {
      return load().medals[mapId] || {};
    },
    // returns true when this medal is new
    award(mapId, diff) {
      const m = (load().medals[mapId] = load().medals[mapId] || {});
      const fresh = !m[diff];
      m[diff] = true;
      persist();
      return fresh;
    },
    medalCount() {
      let n = 0;
      Object.values(load().medals).forEach((m) => (n += ['easy', 'medium', 'hard'].filter((d) => m[d]).length));
      return n;
    },
    addStats(pops, round, won) {
      const s = load().stats;
      s.pops += pops;
      s.games += 1;
      if (won) s.wins += 1;
      if (round) s.best = Math.max(s.best || 0, round);
      persist();
    },
    // pops are banked every round, so leaving a game never loses them
    bankPops(n, round) {
      const s = load().stats;
      s.pops += n;
      if (round) s.best = Math.max(s.best || 0, round);
      persist();
    },
    // wipe medals, stats, the meta progression and saved games (settings stay)
    reset() {
      const d = load();
      d.medals = {};
      d.bosses = {};
      d.stats = { pops: 0, games: 0, wins: 0, best: 0 };
      d.meta = freshMeta();
      d.meta.coins = WELCOME_COINS;
      if (!MT.HEROES[d.settings.hero] || (MT.HERO_UNLOCK && MT.HERO_UNLOCK[d.settings.hero])) d.settings.hero = 'gru';
      persist();
      runs = {};
      persistRuns();
    },
    stats() {
      return load().stats;
    },
    // boss battles: best time in seconds per boss and tier ('normal' / 'elite')
    bossBest(id) {
      return load().bosses[id] || {};
    },
    // returns true the first time this boss + tier is beaten
    bossWin(id, tier, sec) {
      const b = (load().bosses[id] = load().bosses[id] || {});
      const fresh = !b[tier];
      if (!b[tier] || sec < b[tier]) b[tier] = Math.round(sec);
      persist();
      return fresh;
    },

    // ---------------------------------------------------------------- Gru Coins
    coins() {
      return meta().coins;
    },
    addCoins(n) {
      if (!n) return;
      const m = meta();
      m.coins += n;
      m.earned = (m.earned || 0) + n;
      persist();
    },
    spendCoins(n) {
      const m = meta();
      if (m.coins < n) return false;
      m.coins -= n;
      persist();
      return true;
    },
    // the one-off welcome gift is shown once in the main menu
    takeWelcome() {
      const m = meta();
      const v = m.welcome || 0;
      if (v) {
        m.welcome = 0;
        persist();
      }
      return v;
    },

    // ---------------------------------------------------------------- research
    research(id) {
      return meta().research[id] || 0;
    },
    researchAll() {
      return meta().research;
    },
    setResearch(id, lvl) {
      meta().research[id] = lvl;
      persist();
    },

    // ---------------------------------------------------------------- powers
    powerCount(id) {
      return meta().powers[id] || 0;
    },
    addPower(id, n) {
      const p = meta().powers;
      p[id] = Math.max(0, (p[id] || 0) + n);
      persist();
    },

    // ---------------------------------------------------------------- heroes
    heroUnlocked(id) {
      return !(MT.HERO_UNLOCK && MT.HERO_UNLOCK[id]) || !!meta().heroes[id];
    },
    unlockHero(id) {
      meta().heroes[id] = true;
      persist();
    },

    // ---------------------------------------------------------------- achievements
    achieved(id) {
      return !!meta().ach[id];
    },
    setAchieved(id) {
      meta().ach[id] = Date.now();
      persist();
    },
    achievedCount() {
      return Object.keys(meta().ach).length;
    },
    counter(k) {
      return meta().counters[k] || 0;
    },
    bump(k, n = 1) {
      const c = meta().counters;
      c[k] = (c[k] || 0) + n;
      persist();
      return c[k];
    },
    setMax(k, v) {
      const c = meta().counters;
      if (v > (c[k] || 0)) {
        c[k] = v;
        persist();
      }
      return c[k] || 0;
    },
    // small sets of ids (heroes won with, interactive maps beaten...)
    flagSet(k) {
      return meta().counters[k] && typeof meta().counters[k] === 'object' ? meta().counters[k] : {};
    },
    addFlag(k, id) {
      const c = meta().counters;
      if (!c[k] || typeof c[k] !== 'object') c[k] = {};
      if (c[k][id]) return false;
      c[k][id] = true;
      persist();
      return true;
    },

    // ---------------------------------------------------------------- saved games
    // one slot per map + difficulty, the newest few are kept
    runKey(mapId, diff) {
      return mapId + '|' + diff;
    },
    getRun(key) {
      return loadRuns()[key] || null;
    },
    putRun(key, run) {
      const r = loadRuns();
      run.savedAt = Date.now();
      r[key] = run;
      const keys = Object.keys(r).sort((a, b) => r[b].savedAt - r[a].savedAt);
      keys.slice(MAX_RUNS).forEach((k) => delete r[k]);
      persistRuns();
    },
    clearRun(key) {
      const r = loadRuns();
      if (!r[key]) return;
      delete r[key];
      persistRuns();
    },
    latestRun() {
      const r = loadRuns();
      let best = null;
      Object.keys(r).forEach((k) => {
        if (!best || r[k].savedAt > best.savedAt) best = r[k];
      });
      return best;
    },
  };
})();
