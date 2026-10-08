// Persistent progress (medals per map/difficulty) and settings.
(function () {
  const KEY = 'minion-td-save-v1';
  let data = null;

  function load() {
    if (data) return data;
    data = { settings: { sfx: true, music: true, sfxVol: 0.8, musicVol: 0.6, autoStart: false, shake: 'low', hero: 'gru' }, medals: {}, bosses: {}, stats: { pops: 0, games: 0, wins: 0, best: 0 } };
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        data.settings = Object.assign(data.settings, parsed.settings || {});
        data.medals = parsed.medals || {};
        data.bosses = parsed.bosses || {};
        data.stats = Object.assign(data.stats, parsed.stats || {});
      }
    } catch (e) {
      /* storage unavailable: play without saving */
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
    award(mapId, diff) {
      const m = (load().medals[mapId] = load().medals[mapId] || {});
      m[diff] = true;
      persist();
    },
    addStats(pops, round, won) {
      const s = load().stats;
      s.pops += pops;
      s.games += 1;
      if (won) s.wins += 1;
      if (round) s.best = Math.max(s.best || 0, round);
      persist();
    },
    // wipe medals and stats (settings stay)
    reset() {
      const d = load();
      d.medals = {};
      d.bosses = {};
      d.stats = { pops: 0, games: 0, wins: 0, best: 0 };
      persist();
    },
    stats() {
      return load().stats;
    },
    // boss battles: best time in seconds per boss and tier ('normal' / 'elite')
    bossBest(id) {
      return load().bosses[id] || {};
    },
    bossWin(id, tier, sec) {
      const b = (load().bosses[id] = load().bosses[id] || {});
      if (!b[tier] || sec < b[tier]) b[tier] = Math.round(sec);
      persist();
    },
  };
})();
