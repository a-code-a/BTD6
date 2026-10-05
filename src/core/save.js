// Persistent progress (medals per map/difficulty) and settings.
(function () {
  const KEY = 'minion-td-save-v1';
  let data = null;

  function load() {
    if (data) return data;
    data = { settings: { sfx: true, music: true, autoStart: false, shake: 'low', hero: 'gru' }, medals: {}, stats: { pops: 0, games: 0 } };
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        data.settings = Object.assign(data.settings, parsed.settings || {});
        data.medals = parsed.medals || {};
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
    addStats(pops) {
      const s = load().stats;
      s.pops += pops;
      s.games += 1;
      persist();
    },
    stats() {
      return load().stats;
    },
  };
})();
