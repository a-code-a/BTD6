// Tiny WebAudio synth: every sound effect and the music loop are generated
// on the fly, so the game needs no audio files.
(function () {
  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  const last = {};
  let musicTimer = null, musicStep = 0, nextNoteTime = 0;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.connect(master);
    applySettings();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (MT.Save.settings().music) startMusic();
  }

  function applySettings() {
    if (!ctx) return;
    const s = MT.Save.settings();
    sfxBus.gain.value = s.sfx ? 0.55 : 0;
    musicBus.gain.value = s.music ? 0.22 : 0;
  }

  function env(g, t, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function tone(type, f0, f1, dur, vol, when = 0, bus = sfxBus) {
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, 0.005, dur, vol);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(dur, vol, filterType, f0, f1, when = 0) {
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    env(g, t, 0.004, dur, vol);
    src.connect(f);
    f.connect(g);
    g.connect(sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  const SOUNDS = {
    pop: () => { const f = 500 + Math.random() * 350; tone('sine', f, f * 0.4, 0.07, 0.35); noise(0.04, 0.12, 'highpass', 2000); },
    bigpop: () => { tone('sine', 260, 70, 0.25, 0.5); noise(0.18, 0.25, 'lowpass', 1800, 200); },
    throw: () => noise(0.06, 0.05, 'bandpass', 1500, 3000),
    fart: () => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(95 + Math.random() * 30, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.28);
      lfo.frequency.value = 28;
      lg.gain.value = 25;
      lfo.connect(lg);
      lg.connect(o.frequency);
      f.type = 'lowpass';
      f.frequency.value = 600;
      env(g, t, 0.01, 0.28, 0.18);
      o.connect(f);
      f.connect(g);
      g.connect(sfxBus);
      o.start(t);
      lfo.start(t);
      o.stop(t + 0.35);
      lfo.stop(t + 0.35);
    },
    rocket: () => { noise(0.25, 0.12, 'bandpass', 400, 1600); },
    boom: () => { noise(0.45, 0.4, 'lowpass', 1200, 80); tone('sine', 120, 40, 0.35, 0.4); },
    freeze: () => { tone('triangle', 1800, 2600, 0.18, 0.08); tone('sine', 2400, 1200, 0.25, 0.06, 0.03); noise(0.2, 0.06, 'highpass', 5000); },
    laser: () => tone('square', 1400, 300, 0.09, 0.07),
    jelly: () => { tone('sine', 300, 600, 0.07, 0.12); },
    clank: () => { tone('square', 1800, 1700, 0.05, 0.05); tone('triangle', 2600, 2500, 0.08, 0.04); },
    coin: () => { tone('square', 988, 988, 0.06, 0.07); tone('square', 1318, 1318, 0.12, 0.07, 0.06); },
    place: () => { tone('sine', 180, 90, 0.12, 0.35); noise(0.08, 0.12, 'lowpass', 600); },
    upgrade: () => { [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.12, 0.12, i * 0.06)); },
    sell: () => { tone('triangle', 784, 392, 0.2, 0.15); },
    error: () => { tone('square', 160, 140, 0.15, 0.08); },
    leak: () => { tone('sawtooth', 220, 110, 0.25, 0.08); },
    roundStart: () => { [392, 523, 659].forEach((f, i) => tone('triangle', f, f, 0.14, 0.13, i * 0.08)); },
    roundEnd: () => { [659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.16, 0.12, i * 0.09)); },
    ability: () => { tone('sawtooth', 200, 1200, 0.35, 0.1); noise(0.3, 0.1, 'bandpass', 800, 3000); },
    click: () => tone('sine', 900, 700, 0.04, 0.12),
    victory: () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, 0.2, 0.14, i * 0.12)); },
    defeat: () => { [392, 349, 311, 262].forEach((f, i) => tone('triangle', f, f * 0.98, 0.3, 0.14, i * 0.22)); },
    bello: () => { tone('triangle', 520, 700, 0.12, 0.12); tone('triangle', 700, 600, 0.18, 0.12, 0.12); },
    zap: () => { tone('sawtooth', 2200, 600, 0.07, 0.05); noise(0.08, 0.07, 'highpass', 4000); },
    thunder: () => { noise(0.5, 0.3, 'lowpass', 2400, 90); tone('square', 1600, 200, 0.08, 0.05); },
    guitar: () => {
      const f = [196, 247, 294, 330][Math.floor(Math.random() * 4)];
      tone('sawtooth', f, f * 0.99, 0.22, 0.06);
      tone('square', f * 2, f * 2, 0.12, 0.03, 0.01);
    },
    splat: () => { noise(0.14, 0.18, 'lowpass', 900, 200); tone('sine', 240, 90, 0.12, 0.15); },
    warning: () => { [0, 0.32].forEach((d) => { tone('square', 660, 880, 0.14, 0.08, d); tone('square', 880, 660, 0.14, 0.08, d + 0.15); }); },
    roar: () => { tone('sawtooth', 110, 55, 0.8, 0.22); noise(0.8, 0.25, 'lowpass', 700, 120); tone('square', 82, 60, 0.7, 0.1, 0.05); },
    emp: () => { tone('sine', 1200, 60, 0.5, 0.12); noise(0.35, 0.1, 'bandpass', 3000, 300); },
    blink: () => { tone('sine', 300, 1600, 0.16, 0.08); tone('triangle', 1600, 400, 0.16, 0.05, 0.12); },
    stomp: () => { tone('sine', 90, 35, 0.3, 0.4); noise(0.2, 0.18, 'lowpass', 500, 80); },
    jet: () => { noise(1.6, 0.18, 'bandpass', 300, 2500); tone('sawtooth', 120, 400, 1.4, 0.04); },
    papoy: () => { [523, 659, 784, 659, 880, 784, 659, 523].forEach((f, i) => tone('square', f, f, 0.12, 0.08, i * 0.11)); },
    nuke: () => { noise(1.4, 0.45, 'lowpass', 1500, 40); tone('sine', 80, 25, 1.2, 0.5); },
    laserBig: () => { tone('sawtooth', 300, 1800, 0.5, 0.12); tone('sine', 900, 120, 1.2, 0.14, 0.2); noise(1.1, 0.12, 'bandpass', 2000, 600); },
    fusion: () => { [262, 330, 392, 523, 659, 784].forEach((f, i) => tone('triangle', f, f * 1.01, 0.18, 0.11, i * 0.13)); tone('sine', 100, 800, 1.0, 0.1); },
    fusionBoom: () => { noise(0.8, 0.35, 'lowpass', 3000, 100); [523, 784, 1046, 1568].forEach((f, i) => tone('triangle', f, f, 0.35, 0.12, i * 0.05)); },
    fusionReady: () => { [784, 988, 1175, 1568].forEach((f, i) => tone('triangle', f, f, 0.14, 0.1, i * 0.08)); },
  };
  const MIN_GAP = { pop: 0.035, bigpop: 0.08, throw: 0.05, fart: 0.12, rocket: 0.08, boom: 0.07, freeze: 0.12, laser: 0.05, jelly: 0.06, clank: 0.08, coin: 0.05, zap: 0.06, thunder: 0.09, guitar: 0.1, splat: 0.08, stomp: 0.15, emp: 0.3, blink: 0.2, warning: 1, roar: 0.5 };

  function play(name) {
    if (!ctx || !MT.Save.settings().sfx) return;
    const now = ctx.currentTime;
    const gap = MIN_GAP[name] || 0;
    if (last[name] && now - last[name] < gap) return;
    last[name] = now;
    try {
      SOUNDS[name] && SOUNDS[name]();
    } catch (e) {
      /* ignore audio glitches */
    }
  }

  // ---------------- music: a bouncy ukulele-ish loop ----------------
  const BPM = 116;
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
  // melody per 8th note (midi, 0 = rest), 64 steps
  const MEL = [
    72, 0, 74, 76, 0, 72, 69, 0, 67, 0, 69, 72, 0, 0, 0, 0,
    72, 0, 74, 76, 0, 79, 76, 0, 74, 0, 72, 74, 0, 0, 0, 0,
    77, 0, 76, 74, 0, 72, 74, 0, 76, 0, 72, 69, 0, 67, 0, 0,
    69, 0, 72, 74, 0, 76, 74, 0, 72, 0, 0, 0, 79, 0, 72, 0,
  ];
  const CHORDS = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]];

  function schedule() {
    if (!ctx) return;
    while (nextNoteTime < ctx.currentTime + 0.25) {
      const step = musicStep % 64;
      const t = nextNoteTime - ctx.currentTime;
      const m = MEL[step];
      if (m) pluck(N(m), t, 0.22, 0.09);
      const chord = CHORDS[Math.floor(step / 16) % 4];
      if (step % 4 === 0) pluck(N(chord[0] - 12), t, 0.35, 0.16, 'triangle');
      if (step % 4 === 2) {
        chord.forEach((c) => pluck(N(c), t, 0.12, 0.035, 'square'));
      }
      if (step % 2 === 1) hat(t);
      nextNoteTime += 60 / BPM / 2;
      musicStep++;
    }
  }
  function pluck(f, when, dur, vol, type = 'triangle') {
    tone(type, f, f, dur, vol, Math.max(0, when), musicBus);
  }
  function hat(when) {
    const t = ctx.currentTime + Math.max(0, when);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    env(g, t, 0.002, 0.03, 0.05);
    src.connect(f);
    f.connect(g);
    g.connect(musicBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + 0.06);
  }
  function startMusic() {
    if (!ctx || musicTimer) return;
    nextNoteTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(schedule, 90);
  }
  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }

  MT.Audio = {
    init,
    play,
    applySettings() {
      applySettings();
      if (MT.Save.settings().music) startMusic();
      else stopMusic();
    },
  };
})();
