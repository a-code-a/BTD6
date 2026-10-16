// Web Audio engine. Every sound effect and all music are synthesized live, so
// the game needs no audio files:
//  - effects use layered oscillators, filtered noise, FM and a minion "voice"
//    formant synth, with stereo panning and a shared reverb
//  - instruments (ukulele pluck via Karplus-Strong, drums) are pre-rendered
//    into small buffers once, then replayed cheaply
//  - the songs (songs.js) run on a look-ahead sequencer, each through its own
//    small mixer with stereo panning and reverb, and crossfade when the music
//    changes; the battle songs rotate as a playlist
(function () {
  let ctx = null, master = null, comp = null, sfxBus = null, musicBus = null, musicLP = null, musicIR = null, verbIn = null, noiseBuf = null;
  const last = {};
  const BUF = {};
  const plucks = {};
  let wantSong = null;

  // ---------------------------------------------------------------- setup
  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    comp.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.connect(comp);
    // music: volume, then a low-pass that muffles it while the game is paused
    musicBus = ctx.createGain();
    musicLP = ctx.createBiquadFilter();
    musicLP.type = 'lowpass';
    musicLP.frequency.value = 20000;
    musicLP.Q.value = 0.5;
    musicBus.connect(musicLP);
    musicLP.connect(master);
    musicIR = roomImpulse(1.7);
    // shared effects reverb; it runs through the effects volume like the dry sound
    const verb = ctx.createConvolver();
    verb.buffer = impulse(1.9, 3.2);
    verbIn = ctx.createGain();
    verbIn.gain.value = 1.4;
    verbIn.connect(verb);
    verb.connect(sfxBus);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    renderDrums();
    applySettings();
    if (wantSong) startSong(wantSong);
  }

  function settings() {
    const s = MT.Save.settings();
    return {
      sfx: s.sfx ? (s.sfxVol != null ? s.sfxVol : 0.8) : 0,
      music: s.music ? (s.musicVol != null ? s.musicVol : 0.6) : 0,
    };
  }

  function applySettings() {
    if (!ctx) return;
    const v = settings();
    sfxBus.gain.setTargetAtTime(0.8 * v.sfx, ctx.currentTime, 0.05);
    musicBus.gain.setTargetAtTime(0.5 * v.music, ctx.currentTime, 0.05);
    if (v.music > 0 && wantSong && !song) startSong(wantSong);
  }

  function impulse(sec, decay) {
    const sr = ctx.sampleRate, len = Math.floor(sr * sec);
    const b = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  // warmer reverb for the music: a short pre-delay and a tail that gets darker
  // as it fades, like a real room
  function roomImpulse(sec) {
    const sr = ctx.sampleRate, len = Math.floor(sr * sec), pre = Math.floor(sr * 0.015);
    const b = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = pre; i < len; i++) {
        const x = (i - pre) / (len - pre);
        const k = 0.75 - 0.65 * x;
        lp += k * (Math.random() * 2 - 1 - lp);
        d[i] = lp * Math.pow(1 - x, 2.8);
      }
    }
    return b;
  }

  // ---------------------------------------------------------------- routing helpers
  // connect a voice to a bus with optional stereo pan and reverb send
  function route(node, o = {}) {
    let n = node;
    if (o.pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, o.pan));
      n.connect(p);
      n = p;
    }
    n.connect(o.dest || sfxBus);
    if (o.wet) {
      const g = ctx.createGain();
      g.gain.value = o.wet;
      n.connect(g);
      g.connect(verbIn);
    }
  }

  function env(param, t, a, d, peak, sustain = 0) {
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    if (sustain) param.setValueAtTime(peak, t + a + sustain);
    param.exponentialRampToValueAtTime(0.0001, t + a + sustain + d);
  }

  // oscillator voice: frequency glide f0 -> f1, optional filter
  function tone(type, f0, f1, dur, vol, o = {}) {
    const t = ctx.currentTime + (o.when || 0);
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) {
      if (o.linear) osc.frequency.linearRampToValueAtTime(f1, t + dur);
      else osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    }
    if (o.detune) osc.detune.value = o.detune;
    if (o.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = o.vib[0];
      lg.gain.value = o.vib[1];
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.1);
    }
    const g = ctx.createGain();
    env(g.gain, t, o.attack || 0.005, dur, vol, o.sustain || 0);
    let n = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = o.filter[0];
      f.frequency.setValueAtTime(o.filter[1], t);
      if (o.filter[2]) f.frequency.exponentialRampToValueAtTime(o.filter[2], t + dur);
      f.Q.value = o.filter[3] || 1;
      osc.connect(f);
      n = f;
    }
    n.connect(g);
    route(g, o);
    osc.start(t);
    osc.stop(t + (o.attack || 0.005) + (o.sustain || 0) + dur + 0.05);
    return osc;
  }

  // filtered noise burst
  function noise(dur, vol, type, f0, f1, o = {}) {
    const t = ctx.currentTime + (o.when || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    env(g.gain, t, o.attack || 0.004, dur, vol);
    src.connect(f);
    f.connect(g);
    route(g, o);
    src.start(t, Math.random() * 0.8);
    src.stop(t + dur + 0.05);
  }

  // two-operator FM for bells and metallic zaps
  function fm(fc, ratio, index, dur, vol, o = {}) {
    const t = ctx.currentTime + (o.when || 0);
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.frequency.value = fc;
    mod.frequency.value = fc * ratio;
    mg.gain.setValueAtTime(fc * index, t);
    mg.gain.exponentialRampToValueAtTime(Math.max(1, fc * index * 0.05), t + dur);
    mod.connect(mg);
    mg.connect(car.frequency);
    env(g.gain, t, o.attack || 0.003, dur, vol);
    car.connect(g);
    route(g, o);
    car.start(t);
    mod.start(t);
    car.stop(t + dur + 0.05);
    mod.stop(t + dur + 0.05);
  }

  function playBuf(buf, t, vol, o = {}) {
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (o.rate) src.playbackRate.value = o.rate;
    const g = ctx.createGain();
    t = Math.max(ctx.currentTime, t);
    g.gain.setValueAtTime(vol, t);
    src.connect(g);
    route(g, o);
    src.start(t);
    if (o.dur) {
      // damp it early (palm-muted strings)
      g.gain.setValueAtTime(vol, t + o.dur);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur + 0.06);
      src.stop(t + o.dur + 0.08);
    }
  }

  // ---------------------------------------------------------------- pre-rendered instruments
  function makeBuf(sec, fn) {
    const sr = ctx.sampleRate, len = Math.floor(sr * sec);
    const b = ctx.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    fn(d, sr, len);
    return b;
  }

  function renderDrums() {
    BUF.kick = makeBuf(0.45, (d, sr) => {
      let ph = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const f = 48 + 120 * Math.exp(-t * 28);
        ph += (2 * Math.PI * f) / sr;
        d[i] = Math.sin(ph) * Math.exp(-t * 7) * (t < 0.002 ? t / 0.002 : 1) + (t < 0.006 ? (Math.random() - 0.5) * 0.3 : 0);
      }
    });
    BUF.snare = makeBuf(0.3, (d, sr) => {
      let prev = 0, ph = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const n = Math.random() * 2 - 1;
        const hp = n - prev;
        prev = n;
        ph += (2 * Math.PI * 185) / sr;
        d[i] = hp * 0.55 * Math.exp(-t * 16) + Math.sin(ph) * 0.45 * Math.exp(-t * 30);
      }
    });
    const hat = (len, decay) => makeBuf(len, (d, sr) => {
      let p1 = 0, p2 = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const n = Math.random() * 2 - 1;
        const hp = n - 2 * p1 + p2;
        p2 = p1;
        p1 = n;
        d[i] = hp * 0.25 * Math.exp(-t * decay);
      }
    });
    BUF.hat = hat(0.07, 70);
    BUF.ohat = hat(0.35, 11);
    BUF.clap = makeBuf(0.3, (d, sr) => {
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const burst = [0, 0.011, 0.022].some((b) => t >= b && t < b + 0.008) ? 1 : 0;
        d[i] = (Math.random() * 2 - 1) * (burst * 0.8 + 0.5 * Math.exp(-(t - 0.022) * 22) * (t > 0.022 ? 1 : 0));
      }
    });
    BUF.shaker = makeBuf(0.1, (d, sr) => {
      let p = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const n = Math.random() * 2 - 1;
        const hp = n - p;
        p = n;
        d[i] = hp * 0.22 * Math.sin(Math.PI * Math.min(1, t / 0.1));
      }
    });
    // ---- extra kit for the music: tom (pitched with the playback rate), crash, latin percussion
    BUF.tom = makeBuf(0.5, (d, sr) => {
      let ph = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        ph += (2 * Math.PI * (98 + 80 * Math.exp(-t * 16))) / sr;
        d[i] = Math.sin(ph) * 0.85 * Math.exp(-t * 7.5) + (t < 0.004 ? (Math.random() - 0.5) * 0.4 : 0);
      }
    });
    BUF.crash = makeBuf(1.8, (d, sr) => {
      // bright noise plus a few clanging square partials, like a cymbal
      const fs = [431, 687, 1009, 1497, 2213, 3313];
      let p = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const n = Math.random() * 2 - 1;
        const hp = n - p;
        p = n;
        let ring = 0;
        for (let k = 0; k < fs.length; k++) ring += Math.sin(2 * Math.PI * fs[k] * t) > 0 ? 0.025 : -0.025;
        d[i] = (hp * 0.32 + ring) * Math.exp(-t * 2.4) * Math.min(1, t / 0.002);
      }
    });
    BUF.clave = makeBuf(0.1, (d, sr) => {
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        d[i] = Math.sin(2 * Math.PI * 2450 * t) * 0.5 * Math.exp(-t * 50);
      }
    });
    BUF.cowbell = makeBuf(0.4, (d, sr) => {
      let lp = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const sq = (Math.sin(2 * Math.PI * 562 * t) > 0 ? 1 : -1) + (Math.sin(2 * Math.PI * 845 * t) > 0 ? 1 : -1);
        lp += 0.35 * (sq - lp);
        d[i] = lp * 0.16 * (Math.exp(-t * 30) * 0.6 + Math.exp(-t * 8) * 0.4);
      }
    });
    BUF.conga = makeBuf(0.4, (d, sr) => {
      let ph = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        ph += (2 * Math.PI * 330 * (1 + 0.12 * Math.exp(-t * 45))) / sr;
        d[i] = Math.sin(ph) * 0.7 * Math.exp(-t * 10) + (t < 0.008 ? (Math.random() - 0.5) * 0.3 * (1 - t / 0.008) : 0);
      }
    });
  }

  // Karplus-Strong plucked string (ukulele / guitar), cached per note
  function pluckBuf(midi, bright = 0.5) {
    const key = midi + '_' + bright;
    if (plucks[key]) return plucks[key];
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    plucks[key] = makeBuf(1.3, (d, sr) => {
      const N = Math.max(2, Math.round(sr / f));
      const ring = new Float32Array(N);
      for (let i = 0; i < N; i++) ring[i] = (Math.random() * 2 - 1) * (1 - bright * 0.5) + (i < N * bright ? 0.3 : 0);
      let idx = 0;
      const decay = 0.995;
      for (let i = 0; i < d.length; i++) {
        const a = ring[idx], b = ring[(idx + 1) % N];
        ring[idx] = (a + b) * 0.5 * decay;
        d[i] = a * (i < 60 ? i / 60 : 1) * (i > d.length - 400 ? (d.length - i) / 400 : 1);
        idx = (idx + 1) % N;
      }
    });
    return plucks[key];
  }

  // ---------------------------------------------------------------- minion voice
  const FORMANTS = { a: [850, 1250], e: [520, 2100], i: [360, 2500], o: [560, 950], u: [400, 900] };
  // syllables: [[vowel, pitch, duration], ...]
  function voice(syl, o = {}) {
    let t0 = ctx.currentTime + (o.when || 0);
    syl.forEach(([v, p, dur]) => {
      const fmts = FORMANTS[v] || FORMANTS.a;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(p, t0);
      osc.frequency.linearRampToValueAtTime(p * (o.bend || 1.06), t0 + dur);
      const vib = ctx.createOscillator(), vg = ctx.createGain();
      vib.frequency.value = 7;
      vg.gain.value = p * 0.025;
      vib.connect(vg);
      vg.connect(osc.frequency);
      const g = ctx.createGain();
      env(g.gain, t0, 0.015, dur, o.vol || 0.32);
      fmts.forEach((ff, k) => {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = ff * 1.25;
        bp.Q.value = 7;
        const bg = ctx.createGain();
        bg.gain.value = k === 0 ? 1 : 0.6;
        osc.connect(bp);
        bp.connect(bg);
        bg.connect(g);
      });
      route(g, { pan: o.pan, wet: 0.12 });
      osc.start(t0);
      vib.start(t0);
      osc.stop(t0 + dur + 0.05);
      vib.stop(t0 + dur + 0.05);
      t0 += dur * 0.92;
    });
  }

  // turn any text into minion gibberish (one syllable per vowel group)
  function say(text) {
    if (!ctx) return;
    const v = MT.Save.settings();
    if (!v.sfx) return;
    const groups = (text.toLowerCase().match(/[aeiou]+/g) || ['a']).slice(0, 6);
    const base = 470 + Math.random() * 140;
    const syl = groups.map((g, i) => [g[0], base * (1 + (i === groups.length - 1 ? 0.18 : (Math.random() - 0.3) * 0.15)), i === groups.length - 1 ? 0.2 : 0.11]);
    voice(syl, { bend: 1.08 });
  }

  // ---------------------------------------------------------------- sound effects
  const rnd = (a, b) => a + Math.random() * (b - a);
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const SOUNDS = {
    pop: (o) => {
      const f = rnd(650, 1050);
      tone('sine', f, f * 0.32, 0.075, 0.28, o);
      tone('triangle', f * 2.02, f * 0.7, 0.03, 0.06, o);
      noise(0.025, 0.07, 'highpass', 4500, 0, o);
    },
    bigpop: (o) => {
      tone('sine', 170, 38, 0.38, 0.55, Object.assign({ wet: 0.25 }, o));
      noise(0.42, 0.32, 'lowpass', 2400, 90, Object.assign({ wet: 0.3 }, o));
      noise(0.06, 0.15, 'highpass', 3000, 0, o);
      tone('square', 90, 45, 0.25, 0.08, Object.assign({ filter: ['lowpass', 400] }, o));
    },
    throw: (o) => noise(0.14, 0.2, 'bandpass', 700, 2600, Object.assign({ q: 1.3, attack: 0.03 }, o)),
    fart: (o) => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      const f0 = rnd(85, 130);
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.32);
      lfo.frequency.value = rnd(22, 34);
      lg.gain.value = 28;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      f.type = 'lowpass';
      f.frequency.value = 700;
      f.Q.value = 4;
      env(g.gain, t, 0.012, 0.32, 0.2);
      osc.connect(f);
      f.connect(g);
      route(g, o);
      osc.start(t);
      lfo.start(t);
      osc.stop(t + 0.4);
      lfo.stop(t + 0.4);
      noise(0.12, 0.05, 'bandpass', 500, 200, o);
    },
    rocket: (o) => {
      noise(0.34, 0.13, 'bandpass', 350, 2200, Object.assign({ q: 1.4 }, o));
      tone('sawtooth', 110, 260, 0.25, 0.05, Object.assign({ filter: ['lowpass', 600] }, o));
    },
    boom: (o) => {
      noise(0.6, 0.42, 'lowpass', 1800, 50, Object.assign({ wet: 0.28 }, o));
      tone('sine', 120, 32, 0.5, 0.5, o);
      noise(0.05, 0.15, 'highpass', 2500, 0, o);
    },
    freeze: (o) => {
      for (let i = 0; i < 4; i++) tone('triangle', rnd(2200, 3800), 0, 0.2, 0.05, Object.assign({ when: i * 0.025, wet: 0.4 }, o));
      noise(0.25, 0.06, 'highpass', 6000, 0, Object.assign({ wet: 0.3 }, o));
      tone('sine', 1400, 700, 0.18, 0.05, o);
    },
    laser: (o) => tone('square', rnd(1500, 1900), 260, 0.1, 0.06, Object.assign({ filter: ['lowpass', 3500, 900] }, o)),
    jelly: (o) => {
      tone('sine', 240, 560, 0.06, 0.16, o);
      tone('sine', 560, 300, 0.06, 0.1, Object.assign({ when: 0.05 }, o));
    },
    clank: (o) => {
      [1700, 2563, 3811].forEach((f, i) => tone('square', f, f * 0.98, 0.07 + i * 0.02, 0.025, Object.assign({ filter: ['bandpass', f, 0, 6] }, o)));
      noise(0.03, 0.08, 'highpass', 5000, 0, o);
    },
    coin: () => {
      tone('square', 988, 988, 0.06, 0.06, { filter: ['lowpass', 4000] });
      tone('square', 1318, 1318, 0.16, 0.06, { when: 0.06, filter: ['lowpass', 4000], wet: 0.2 });
      tone('triangle', 2637, 2637, 0.12, 0.03, { when: 0.06 });
    },
    place: () => {
      tone('sine', 190, 70, 0.14, 0.4);
      noise(0.1, 0.12, 'lowpass', 700, 200);
      tone('triangle', 1046, 1568, 0.1, 0.04, { when: 0.05, wet: 0.3 });
    },
    upgrade: () => {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, 0.14, 0.11, { when: i * 0.05, wet: 0.25 }));
      noise(0.3, 0.04, 'highpass', 6000, 0, { when: 0.1, wet: 0.3 });
    },
    sell: () => {
      tone('triangle', 1046, 523, 0.2, 0.12);
      tone('square', 784, 784, 0.08, 0.04, { when: 0.08, filter: ['lowpass', 3000] });
    },
    error: () => {
      tone('square', 180, 160, 0.09, 0.07, { filter: ['lowpass', 900] });
      tone('square', 150, 130, 0.12, 0.07, { when: 0.1, filter: ['lowpass', 900] });
    },
    leak: () => tone('sawtooth', 330, 110, 0.3, 0.08, { filter: ['lowpass', 1200, 300] }),
    roundStart: () => {
      [[392, 0], [523, 0.1], [659, 0.2], [784, 0.3]].forEach(([f, w]) => brass(f, w, 0.16, 0.11));
      SNARE(0.3);
    },
    roundEnd: () => {
      [659, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, f, 0.16, 0.11, { when: i * 0.08, wet: 0.25 }));
    },
    ability: () => {
      tone('sawtooth', 180, 1400, 0.4, 0.09, { filter: ['lowpass', 600, 5000], wet: 0.3 });
      noise(0.35, 0.09, 'bandpass', 600, 4000, { q: 2, wet: 0.3 });
    },
    click: () => tone('sine', 1100, 800, 0.035, 0.1),
    hover: () => tone('sine', 1500, 1500, 0.02, 0.025),
    victory: () => {
      const mel = [[523, 0, 0.14], [659, 0.14, 0.14], [784, 0.28, 0.14], [1046, 0.42, 0.34], [784, 0.8, 0.14], [1046, 0.94, 0.5]];
      mel.forEach(([f, w, d]) => brass(f, w, d, 0.12));
      [0, 0.42, 0.94].forEach((w) => KICK(w));
      [523, 659, 784].forEach((f) => tone('triangle', f, f, 1.2, 0.05, { when: 0.94, wet: 0.4, attack: 0.05 }));
    },
    defeat: () => {
      // the sad trombone
      [[294, 277, 0], [277, 262, 0.35], [262, 247, 0.7]].forEach(([a, b, w]) => brass(a, w, 0.3, 0.12, b));
      brass(247, 1.05, 0.9, 0.12, 196, [5, 6]);
    },
    bello: () => voice([['e', rnd(520, 580), 0.12], ['o', rnd(640, 700), 0.24]], { bend: 1.1 }),
    zap: (o) => {
      noise(0.07, 0.1, 'bandpass', 3200, 1500, Object.assign({ q: 3 }, o));
      tone('square', rnd(90, 130), 60, 0.07, 0.05, Object.assign({ filter: ['highpass', 800] }, o));
    },
    thunder: (o) => {
      noise(0.06, 0.2, 'highpass', 3000, 0, o);
      noise(0.9, 0.3, 'lowpass', 1200, 60, Object.assign({ wet: 0.4, attack: 0.02 }, o));
    },
    guitar: (o) => {
      const root = [43, 45, 48, 50][Math.floor(Math.random() * 4)];
      [0, 7, 12].forEach((iv, i) => playBuf(pluckBuf(root + iv, 0.8), ctx.currentTime + i * 0.012, 0.35, Object.assign({ wet: 0.15 }, o)));
    },
    splat: (o) => {
      noise(0.16, 0.2, 'lowpass', 1000, 180, Object.assign({ q: 3 }, o));
      tone('sine', 260, 80, 0.13, 0.18, o);
    },
    warning: () => {
      for (let i = 0; i < 2; i++) {
        tone('square', 700, 900, 0.16, 0.06, { when: i * 0.36, filter: ['lowpass', 2500] });
        tone('square', 900, 700, 0.16, 0.06, { when: i * 0.36 + 0.17, filter: ['lowpass', 2500] });
      }
    },
    roar: () => {
      const g = ctx.createGain();
      const ws = ctx.createWaveShaper();
      ws.curve = distCurve(30);
      ws.connect(g);
      g.gain.value = 0.7;
      route(g, { wet: 0.3 });
      const t = ctx.currentTime;
      const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.9);
      lfo.frequency.value = 18;
      lg.gain.value = 0.5;
      lfo.connect(lg);
      lg.connect(og.gain);
      env(og.gain, t, 0.05, 0.9, 0.18);
      osc.connect(og);
      og.connect(ws);
      osc.start(t);
      lfo.start(t);
      osc.stop(t + 1);
      lfo.stop(t + 1);
      noise(0.9, 0.2, 'lowpass', 900, 150, { wet: 0.3 });
    },
    emp: () => {
      tone('sine', 1600, 60, 0.5, 0.12, { wet: 0.3 });
      noise(0.35, 0.08, 'bandpass', 3000, 300, { q: 2 });
    },
    blink: () => {
      tone('sine', 300, 1800, 0.15, 0.08, { wet: 0.4 });
      tone('triangle', 1800, 400, 0.16, 0.05, { when: 0.12, wet: 0.4 });
    },
    stomp: () => {
      playBuf(BUF.kick, ctx.currentTime, 0.9, { rate: 0.7 });
      noise(0.22, 0.15, 'lowpass', 500, 80);
    },
    jet: () => {
      noise(1.7, 0.2, 'bandpass', 250, 2800, { q: 1.5, attack: 0.3 });
      tone('sawtooth', 90, 420, 1.5, 0.04, { filter: ['lowpass', 800], attack: 0.3 });
    },
    papoy: () => {
      // the minions sing: "pa-poy, pa-poy, pa-poy!"
      const p = 560;
      const syl = [['a', p, 0.14], ['o', p * 1.26, 0.22], ['a', p * 1.12, 0.14], ['o', p * 1.5, 0.22], ['a', p * 1.26, 0.14], ['o', p * 1.68, 0.36]];
      voice(syl, { bend: 1.03, vol: 0.3 });
    },
    nuke: () => {
      noise(1.6, 0.5, 'lowpass', 1600, 30, { wet: 0.45, attack: 0.01 });
      tone('sine', 90, 22, 1.4, 0.55);
      tone('sine', 55, 30, 1.8, 0.3, { attack: 0.1 });
    },
    laserBig: () => {
      tone('sawtooth', 220, 1700, 0.35, 0.08, { filter: ['lowpass', 1000, 6000] });
      fm(880, 1.5, 6, 0.9, 0.1, { when: 0.3, wet: 0.35 });
      noise(1.0, 0.1, 'bandpass', 2400, 500, { when: 0.3, q: 2 });
    },
    fusion: () => {
      [262, 330, 392, 523, 659, 784, 1046].forEach((f, i) => fm(f, 2, 1.5, 0.5, 0.07, { when: i * 0.11, wet: 0.45 }));
      tone('sine', 100, 900, 1.0, 0.08, { wet: 0.3 });
    },
    fusionBoom: () => {
      noise(0.9, 0.35, 'lowpass', 3000, 80, { wet: 0.45 });
      playBuf(BUF.kick, ctx.currentTime, 1);
      [523, 659, 784, 1046].forEach((f) => brass(f, 0.05, 0.6, 0.06));
    },
    fusionReady: () => [784, 988, 1175, 1568].forEach((f, i) => fm(f, 3.5, 2, 0.6, 0.06, { when: i * 0.09, wet: 0.5 })),
    chord: (o) => {
      [38, 45, 50, 57].forEach((m, i) => playBuf(pluckBuf(m, 0.95), ctx.currentTime + i * 0.015, 0.45, Object.assign({ wet: 0.25 }, o)));
      noise(0.2, 0.06, 'bandpass', 1500, 400, o);
    },
    nail: (o) => {
      fm(2400, 2.76, 3, 0.09, 0.05, o);
      noise(0.04, 0.06, 'highpass', 3000, 0, o);
    },
    sonar: () => {
      tone('sine', 1320, 1300, 0.6, 0.1, { wet: 0.7 });
      tone('sine', 1320, 1290, 0.4, 0.03, { when: 0.35, wet: 0.7 });
    },
    charge: () => {
      tone('sawtooth', 110, 1400, 0.7, 0.07, { filter: ['lowpass', 400, 4000] });
      tone('sine', 220, 2000, 0.7, 0.05);
    },
    swoosh: () => noise(0.28, 0.3, 'bandpass', 400, 3000, { q: 1, attack: 0.06 }),
    // ---- tactical mutants and boss battles
    dig: (o) => {
      noise(0.3, 0.22, 'lowpass', 900, 150, o);
      tone('triangle', 90, 50, 0.25, 0.1, o);
    },
    shield: (o) => {
      tone('sine', 300, 1200, 0.35, 0.07, Object.assign({ wet: 0.5 }, o));
      fm(1200, 1.5, 2, 0.4, 0.04, Object.assign({ when: 0.1, wet: 0.5 }, o));
    },
    shieldBreak: (o) => {
      [2400, 3100, 1900, 2700].forEach((f, i) => fm(f, 2.76, 4, 0.18, 0.05, Object.assign({ when: i * 0.03 }, o)));
      noise(0.35, 0.18, 'highpass', 4000, 1500, o);
    },
    squid: (o) => {
      tone('square', 600, 140, 0.18, 0.06, Object.assign({ filter: ['lowpass', 1800] }, o));
      noise(0.12, 0.12, 'bandpass', 600, 300, o);
    },
    gum: (o) => {
      tone('sine', 180, 700, 0.12, 0.12, o);
      noise(0.06, 0.2, 'bandpass', 2000, 0, Object.assign({ when: 0.11, q: 2 }, o));
    },
    cutin: () => {
      noise(0.3, 0.22, 'bandpass', 500, 4000, { q: 0.8, attack: 0.04 });
      [523, 659, 784, 1046].forEach((f, i) => brass(f, 0.12 + i * 0.05, 0.35, 0.045));
      playBuf(BUF.kick, ctx.currentTime + 0.12, 0.8);
    },
    ready: () => {
      fm(1568, 3.5, 2, 0.35, 0.04, { wet: 0.5 });
      fm(2093, 3.5, 2, 0.35, 0.03, { when: 0.08, wet: 0.5 });
    },
    // ---- the newer minions
    shuriken: (o) => noise(0.09, 0.14, 'bandpass', 2600, 5200, Object.assign({ q: 4, attack: 0.01 }, o)),
    catapult: (o) => {
      tone('triangle', 140, 60, 0.16, 0.18, o);
      noise(0.22, 0.16, 'bandpass', 300, 1400, Object.assign({ q: 1.2, attack: 0.05, when: 0.04 }, o));
    },
    thud: (o) => {
      playBuf(BUF.kick, ctx.currentTime, 0.6, Object.assign({ rate: 0.8 }, o));
      noise(0.18, 0.14, 'lowpass', 700, 90, o);
    },
    potion: (o) => {
      tone('sine', rnd(500, 700), 1300, 0.08, 0.07, o);
      noise(0.08, 0.05, 'bandpass', 2400, 900, Object.assign({ q: 2 }, o));
    },
    glass: (o) => {
      [3100, 4200, 5300].forEach((f, i) => fm(f * rnd(0.95, 1.05), 2.76, 2, 0.12, 0.025, Object.assign({ when: i * 0.02 }, o)));
      noise(0.14, 0.1, 'lowpass', 1200, 200, Object.assign({ q: 2, when: 0.02 }, o));
    },
    spray: (o) => noise(0.12, 0.07, 'bandpass', 1800, 900, Object.assign({ q: 0.8, attack: 0.02 }, o)),
    splash: (o) => {
      noise(0.3, 0.18, 'lowpass', 2200, 300, Object.assign({ q: 1.5, wet: 0.2 }, o));
      tone('sine', 420, 140, 0.14, 0.12, o);
    },
    bat: (o) => {
      tone('sine', rnd(3200, 3800), 2400, 0.05, 0.035, o);
      tone('sine', rnd(3600, 4200), 2800, 0.04, 0.03, Object.assign({ when: 0.06 }, o));
    },
    flash: (o) => {
      noise(0.25, 0.2, 'highpass', 2500, 800, o);
      tone('square', 1800, 2400, 0.15, 0.04, Object.assign({ filter: ['lowpass', 5000] }, o));
    },
    // the famous minion fire siren: "BEE-DO BEE-DO"
    siren: (o) => sirenCall(o, 1, 0.05),
    beedoo: (o) => sirenCall(o, 2, 0.1),
  };

  function sirenCall(o, n, v) {
    for (let i = 0; i < n; i++) {
      tone('square', 880, 880, 0.17, v, Object.assign({ when: i * 0.42, filter: ['lowpass', 2600], wet: 0.2 }, o));
      tone('square', 660, 660, 0.2, v, Object.assign({ when: i * 0.42 + 0.19, filter: ['lowpass', 2600], wet: 0.2 }, o));
      voice([['i', 620, 0.16], ['o', 470, 0.2]], { vol: 0.2 + v, bend: 1.0, when: i * 0.42 + 0.01, pan: o && o.pan });
    }
  }

  function brass(f, when, dur, vol, slideTo, vib) {
    tone('sawtooth', f, slideTo || f, dur, vol, { when, attack: 0.025, filter: ['lowpass', f * 3, f * 6, 1.5], wet: 0.2, vib, linear: true });
    tone('square', f * 0.5, (slideTo || f) * 0.5, dur, vol * 0.35, { when, attack: 0.03, filter: ['lowpass', f * 2] });
  }
  const KICK = (when) => playBuf(BUF.kick, ctx.currentTime + when, 0.8);
  const SNARE = (when) => playBuf(BUF.snare, ctx.currentTime + when, 0.4);

  function distCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      c[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return c;
  }

  const MIN_GAP = {
    pop: 0.03, bigpop: 0.08, throw: 0.05, fart: 0.12, rocket: 0.08, boom: 0.07, freeze: 0.12, laser: 0.05, jelly: 0.06, clank: 0.08,
    coin: 0.05, zap: 0.06, thunder: 0.09, guitar: 0.1, splat: 0.08, stomp: 0.15, emp: 0.3, blink: 0.2, warning: 1, roar: 0.5,
    chord: 0.15, nail: 0.07, sonar: 0.6, hover: 0.04, laserBig: 0.3, nuke: 0.5,
    dig: 0.12, shield: 0.3, shieldBreak: 0.15, squid: 0.1, gum: 0.1, cutin: 0.4, ready: 0.25,
    shuriken: 0.06, catapult: 0.1, thud: 0.08, potion: 0.08, glass: 0.07, spray: 0.09, splash: 0.08, bat: 0.08, flash: 0.12, siren: 0.6, beedoo: 0.8,
  };

  // play(name, x?) — x is a map position, used to pan the sound left/right
  function play(name, x) {
    if (!ctx || settings().sfx <= 0) return;
    const now = ctx.currentTime;
    const gap = MIN_GAP[name] || 0;
    if (last[name] && now - last[name] < gap) return;
    last[name] = now;
    const o = x != null ? { pan: (x / MT.CFG.MAP_W) * 1.4 - 0.7 } : {};
    try {
      if (SOUNDS[name]) SOUNDS[name](o);
    } catch (e) {
      // never let a sound glitch break the game; MT.DEBUG_AUDIO surfaces them
      if (MT.DEBUG_AUDIO) console.warn('sound', name, e);
    }
  }

  // ================================================================ music
  // ---- instruments: each takes a start time and the mixer bus it plays into

  function bass(m, t, dur, vol, dest, bright = 900, wave = 'sawtooth') {
    const osc = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = N(m);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(bright, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(120, bright * 0.3), t + dur);
    f.Q.value = 3;
    env(g.gain, t, 0.008, dur, vol);
    osc.connect(f);
    f.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function pad(notes, t, dur, vol, dest, cut = 1100) {
    notes.forEach((m) => {
      [-7, 7].forEach((det) => {
        const osc = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = N(m);
        osc.detune.value = det;
        f.type = 'lowpass';
        f.frequency.value = cut;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(f);
        f.connect(g);
        g.connect(dest);
        osc.start(t);
        osc.stop(t + dur + 0.05);
      });
    });
  }

  // melody voices: kazoo, whistle, square, saw (synth lead) or brass (trumpet).
  // `from` slides up or down from the previous note, like a theremin.
  function lead(m, t, dur, vol, dest, kind = 'kazoo', from) {
    const f = N(m);
    const osc = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
    osc.type = kind === 'whistle' ? 'sine' : kind === 'square' ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(from ? N(from) : f, t);
    if (from) osc.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.09, dur * 0.4));
    // vibrato fades in on longer notes
    vib.frequency.value = kind === 'whistle' ? 5.5 : kind === 'brass' ? 5.8 : 6.5;
    const depth = f * (kind === 'whistle' ? 0.012 : kind === 'saw' ? 0.006 : 0.016);
    vg.gain.setValueAtTime(depth * 0.25, t);
    vg.gain.linearRampToValueAtTime(depth, t + Math.min(0.35, dur));
    vib.connect(vg);
    vg.connect(osc.frequency);
    const atk = kind === 'brass' ? 0.04 : 0.025;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.setValueAtTime(vol, t + Math.max(atk, dur * 0.75));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.04);
    const end = t + dur + 0.1;
    let n = osc;
    if (kind === 'kazoo') {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1100;
      bp.Q.value = 1.4;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      osc.connect(bp);
      bp.connect(lp);
      n = lp;
    } else if (kind === 'square' || kind === 'saw' || kind === 'brass') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      if (kind === 'brass') {
        // the tone brightens as the player blows into the note
        lp.Q.value = 1.5;
        lp.frequency.setValueAtTime(f * 1.5, t);
        lp.frequency.exponentialRampToValueAtTime(Math.min(9000, f * 5), t + 0.07);
        lp.frequency.exponentialRampToValueAtTime(Math.min(9000, f * 3), t + Math.max(0.12, dur));
      } else lp.frequency.value = kind === 'saw' ? 2800 : 2200;
      osc.connect(lp);
      n = lp;
      if (kind === 'saw') {
        // a second, slightly detuned oscillator makes it wide and shimmery
        const o2 = ctx.createOscillator();
        o2.type = 'sawtooth';
        o2.frequency.setValueAtTime(from ? N(from) : f, t);
        if (from) o2.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.09, dur * 0.4));
        o2.detune.value = 11;
        vg.connect(o2.frequency);
        o2.connect(lp);
        o2.start(t);
        o2.stop(end);
      }
    }
    n.connect(g);
    g.connect(dest);
    osc.start(t);
    vib.start(t);
    osc.stop(end);
    vib.stop(end);
  }

  function strum(chord, t, vol, dest, bright = 0.5, down = true, dur) {
    const notes = down ? chord : chord.slice().reverse();
    notes.forEach((m, i) => playBuf(pluckBuf(m, bright), t + i * 0.014, vol, { dest, dur }));
  }

  function pluck(m, t, vol, dest, bright = 0.5, dur) {
    playBuf(pluckBuf(m, bright), t, vol, { dest, dur });
  }

  // two-operator FM bell / glockenspiel
  function bell(m, t, vol, dest, dur = 1.2) {
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.frequency.value = N(m);
    mod.frequency.value = N(m) * 3.5;
    mg.gain.setValueAtTime(N(m) * 2, t);
    mg.gain.exponentialRampToValueAtTime(N(m) * 0.1, t + dur);
    mod.connect(mg);
    mg.connect(car.frequency);
    env(g.gain, t, 0.003, dur, vol);
    car.connect(g);
    g.connect(dest);
    car.start(t);
    mod.start(t);
    car.stop(t + dur + 0.1);
    mod.stop(t + dur + 0.1);
  }

  // a few sine partials, each with its own decay (steel drum, marimba)
  function partials(m, t, vol, dest, list, bend) {
    const f = N(m);
    list.forEach(([ratio, amp, dur]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(f * ratio * (bend || 1), t);
      if (bend) o.frequency.exponentialRampToValueAtTime(f * ratio, t + 0.04);
      env(g.gain, t, 0.003, dur, vol * amp);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }
  const steel = (m, t, vol, dest, dur = 1) => partials(m, t, vol, dest, [[1, 1, dur], [2, 0.4, dur * 0.55], [3, 0.16, dur * 0.3], [4.16, 0.05, 0.1]], 1.012);
  const marimba = (m, t, vol, dest) => partials(m, t, vol, dest, [[1, 1, 0.55], [3.93, 0.22, 0.07], [9.2, 0.05, 0.02]]);

  // vibraphone: a mellow bar with a slow wobble
  function vibes(m, t, vol, dest, dur = 1) {
    const d = Math.max(0.8, dur * 1.4);
    const trem = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    trem.gain.value = 0.75;
    lfo.frequency.value = 5.2;
    lg.gain.value = 0.25;
    lfo.connect(lg);
    lg.connect(trem.gain);
    trem.connect(dest);
    partials(m, t, vol, trem, [[1, 1, d], [4, 0.12, 0.25], [10, 0.03, 0.05]]);
    lfo.start(t);
    lfo.stop(t + d + 0.1);
  }

  // electric piano (FM, ratio 1): warm, bell-like attack that mellows out
  function epiano(notes, t, dur, vol, dest) {
    notes.forEach((m) => {
      const f = N(m), d = Math.max(0.35, dur * 1.3);
      const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
      car.frequency.value = f;
      mod.frequency.value = f;
      mg.gain.setValueAtTime(f * 1.4, t);
      mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.6);
      mod.connect(mg);
      mg.connect(car.frequency);
      env(g.gain, t, 0.004, d, vol);
      car.connect(g);
      g.connect(dest);
      car.start(t);
      mod.start(t);
      car.stop(t + d + 0.05);
      mod.stop(t + d + 0.05);
    });
  }

  // plucky synth for arpeggios and ostinatos: two oscillators through a closing filter
  function synth(m, t, dur, vol, dest, cut = 2400) {
    const f = N(m);
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass';
    lp.Q.value = 4;
    lp.frequency.setValueAtTime(cut, t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(180, cut * 0.12), t + dur);
    env(g.gain, t, 0.003, dur, vol);
    lp.connect(g);
    g.connect(dest);
    [['sawtooth', 0], ['square', 7]].forEach(([type, det]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  // brass section chord stab / swell
  function horn(notes, t, dur, vol, dest) {
    notes.forEach((m) => {
      const f = N(m);
      const lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass';
      lp.Q.value = 1.2;
      lp.frequency.setValueAtTime(f * 1.5, t);
      lp.frequency.exponentialRampToValueAtTime(Math.min(9000, f * 6), t + 0.05);
      lp.frequency.exponentialRampToValueAtTime(Math.min(9000, f * 3), t + Math.max(0.1, dur));
      env(g.gain, t, 0.025, 0.12, vol, Math.max(0.01, dur - 0.1));
      lp.connect(g);
      g.connect(dest);
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.2);
      });
    });
  }

  const drum = (name, t, vol, dest, rate) => playBuf(BUF[name], t, vol, { dest, rate });

  MT.MusicKit = { N, bass, pad, lead, strum, pluck, bell, steel, marimba, vibes, epiano, synth, horn, drum };

  // ---- mixer: every song gets its own channels, reverb and fader
  // channel: [stereo pan, reverb send]; the ducked ones dip under the kick when a song pumps
  const CHANNELS = {
    drums: [0, 0.05], perc: [0.35, 0.14], bass: [0, 0], chords: [-0.3, 0.18], pad: [0, 0.32],
    arp: [-0.45, 0.26], lead: [0.12, 0.26], counter: [0.42, 0.3],
  };
  const DUCKED = { chords: 1, pad: 1, arp: 1 };

  function makeMix(S, dest) {
    const fade = ctx.createGain();
    fade.connect(dest);
    const verb = ctx.createConvolver();
    verb.buffer = musicIR;
    const wet = ctx.createGain();
    wet.gain.value = S.reverb != null ? S.reverb : 1;
    verb.connect(wet);
    wet.connect(fade);
    const duck = ctx.createGain();
    duck.connect(fade);
    const m = { fade };
    Object.keys(CHANNELS).forEach((k) => {
      const [pan, send] = CHANNELS[k];
      const g = ctx.createGain();
      g.gain.value = (S.gain || 1) * ((S.levels && S.levels[k]) || 1);
      let n = g;
      if (pan && ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        g.connect(p);
        n = p;
      }
      n.connect(DUCKED[k] ? duck : fade);
      if (send) {
        const s = ctx.createGain();
        s.gain.value = send;
        n.connect(s);
        s.connect(verb);
      }
      m[k] = g;
    });
    // sidechain-style pump: chords, pads and arpeggios dip on the kick
    m.pump = (t, depth = 0.4) => {
      duck.gain.setValueAtTime(1 - depth, t);
      duck.gain.setTargetAtTime(1, t + 0.015, 0.07);
    };
    return m;
  }

  // ---- sequencer
  // A song (MT.SONGS) is a row of 8-bar sections played in the order of its
  // `form`; its play(i, t, mix, sx) schedules the notes of one 16th-note step.
  // A playlist (the battle music) moves on to its next song after `loops` passes.
  let song = null, mix = null, group = null, nextT = 0, step = 0, timer = null;
  const LISTS = { battle: { order: ['march', 'tropical', 'funk', 'space', 'western'], idx: 0 } };
  // each map opens the battle playlist with the song that suits it best
  const THEME_SONG = { yard: 'march', city: 'march', jungle: 'tropical', beach: 'tropical', lab: 'funk', factory: 'funk', moon: 'space', snow: 'space', desert: 'western', volcano: 'western' };

  function info(S, n) {
    const per = (S.bars || 8) * 16, total = per * S.form.length;
    const s = n % total, sec = Math.floor(s / per), ss = s % per;
    return { n, pass: Math.floor(n / total), sec: S.form[sec], secIdx: sec, ss, bar: Math.floor(ss / 16), b: ss % 16 };
  }
  // swing pushes the off-beat 8ths (and optionally the odd 16ths) a little late
  const swingOf = (S, n) => (n % 4 === 2 ? S.swing || 0 : 0) + (n % 2 === 1 ? S.swing16 || 0 : 0);

  const resolve = (key) => (LISTS[key] ? LISTS[key].order[LISTS[key].idx % LISTS[key].order.length] : key);

  function startSong(key, delay = 0) {
    wantSong = key;
    if (!ctx || settings().music <= 0) return;
    if (group === key && timer) return;
    group = key;
    playTrack(resolve(key), ctx.currentTime + delay + 0.12, delay > 0 ? 0.12 : 0.4);
  }

  // fadeIn: time constant of the fade-in, or 0 to come in at full volume
  // (and let the previous song's last notes ring out instead of fading them)
  function playTrack(name, at, fadeIn) {
    const S = MT.SONGS && MT.SONGS[name];
    if (!S) return;
    const now = ctx.currentTime;
    if (mix) {
      const old = mix;
      if (fadeIn) old.fade.gain.setTargetAtTime(0.0001, now, 0.35);
      setTimeout(() => old.fade.disconnect(), 4000);
    }
    song = name;
    mix = makeMix(S, musicBus);
    if (fadeIn) {
      mix.fade.gain.setValueAtTime(0.0001, now);
      mix.fade.gain.setTargetAtTime(1, Math.max(now, at - 0.07), fadeIn);
    }
    step = 0;
    nextT = at;
    if (!timer) timer = setInterval(schedule, 30);
  }

  function schedule() {
    if (!ctx || !song) return;
    let S = MT.SONGS[song];
    while (nextT < ctx.currentTime + 0.2) {
      const total = (S.bars || 8) * 16 * S.form.length;
      if (LISTS[group] && step >= total * (S.loops || 2)) {
        // playlist: on to the next song after a short breath
        LISTS[group].idx++;
        playTrack(resolve(group), nextT + 0.45, 0);
        S = MT.SONGS[song];
        continue;
      }
      try {
        S.play(info(S, step), nextT + swingOf(S, step) * (15 / S.bpm), mix, 15 / S.bpm);
      } catch (e) {
        // keep the loop alive
        if (MT.DEBUG_AUDIO) console.warn('music', song, e);
      }
      nextT += 15 / S.bpm;
      step++;
    }
  }

  function stopMusic() {
    if (timer) clearInterval(timer);
    timer = null;
    if (mix && ctx) {
      const old = mix;
      old.fade.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
      setTimeout(() => old.fade.disconnect(), 2000);
    }
    mix = null;
    song = null;
    group = null;
  }

  // test hook: render a song offline (no speakers needed) and measure it.
  // Notes are scheduled just ahead of the render position like during real
  // playback, so the render time is a fair hint of the CPU cost.
  // `solo` keeps only one mixer channel to check the balance of the parts.
  function renderSong(name, sec = 20, solo, from = 0) {
    const S = MT.SONGS[name];
    const live = ctx;
    const off = new OfflineAudioContext(2, Math.ceil(sec * live.sampleRate), live.sampleRate);
    const errors = [];
    const sx = 15 / S.bpm;
    let m = null, n = from, t = 0.05;
    const fill = (until) => {
      ctx = off;
      try {
        if (!m) {
          m = makeMix(S, off.destination);
          if (solo) Object.keys(CHANNELS).forEach((k) => k !== solo && (m[k].gain.value = 0));
        }
        for (; t < Math.min(until, sec - 0.3); n++, t += sx) {
          try {
            S.play(info(S, n), t + swingOf(S, n) * sx, m, sx);
          } catch (e) {
            errors.push(e.message);
          }
        }
      } finally {
        ctx = live;
      }
    };
    fill(0.5);
    for (let s = 0.25; s < sec - 0.3; s += 0.25) {
      off.suspend(s).then(() => {
        fill(s + 0.5);
        off.resume();
      });
    }
    return off.startRendering().then((buf) => {
      let peak = 0, sum = 0;
      for (let c = 0; c < buf.numberOfChannels; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i++) {
          const v = Math.abs(d[i]);
          if (v > peak) peak = v;
          sum += v * v;
        }
      }
      const rms = Math.sqrt(sum / (buf.length * buf.numberOfChannels));
      return { name, solo, peak: +peak.toFixed(3), rmsDb: +(20 * Math.log10(rms + 1e-9)).toFixed(1), errors: errors.length, firstError: errors[0] };
    });
  }

  MT.Audio = {
    init,
    play,
    say,
    // pick the music: a song ('menu', 'boss', 'villain', 'victory', 'defeat'...)
    // or the 'battle' playlist; `delay` (seconds) leaves room for a jingle first
    music(name, delay) {
      wantSong = name;
      if (ctx && settings().music > 0) startSong(name, delay);
    },
    // the battle playlist starts with the song that suits this map theme
    battle(theme) {
      const L = LISTS.battle, first = THEME_SONG[theme] || 'march';
      if (group === 'battle' && timer && resolve('battle') === first) return;
      const k = L.order.indexOf(first);
      L.order = L.order.slice(k).concat(L.order.slice(0, k));
      L.idx = 0;
      if (group === 'battle') group = null;
    },
    // muffle the music, e.g. while the game is paused
    muffle(on) {
      if (!ctx) return;
      musicLP.frequency.setTargetAtTime(on ? 650 : 20000, ctx.currentTime, on ? 0.06 : 0.12);
    },
    // test hook: the live context, master bus, current song and an offline renderer
    debug: () => ({ ctx, master, song, group, names: Object.keys(SOUNDS), songs: Object.keys(MT.SONGS || {}), render: renderSong }),
    applySettings() {
      applySettings();
      if (settings().music > 0) {
        if (wantSong) startSong(wantSong);
      } else stopMusic();
    },
  };
})();
