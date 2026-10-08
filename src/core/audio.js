// Web Audio engine. Every sound effect and all music are synthesized live, so
// the game needs no audio files:
//  - effects use layered oscillators, filtered noise, FM and a minion "voice"
//    formant synth, with stereo panning and a shared reverb
//  - instruments (ukulele pluck via Karplus-Strong, drums) are pre-rendered
//    into small buffers once, then replayed cheaply
//  - three songs (menu, battle, boss) run on a look-ahead sequencer and
//    crossfade when the music changes
(function () {
  let ctx = null, master = null, comp = null, sfxBus = null, musicBus = null, verbIn = null, noiseBuf = null;
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
    musicBus = ctx.createGain();
    musicBus.connect(master);
    // shared reverb
    const verb = ctx.createConvolver();
    verb.buffer = impulse(1.9, 3.2);
    verbIn = ctx.createGain();
    verbIn.gain.value = 0.9;
    verbIn.connect(verb);
    verb.connect(master);
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
    musicBus.gain.setTargetAtTime(0.42 * v.music, ctx.currentTime, 0.05);
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
    g.gain.value = vol;
    src.connect(g);
    route(g, o);
    src.start(Math.max(ctx.currentTime, t));
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
  };

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
  // Each song is a function of the 16th-note step that schedules its notes.
  let song = null, songGain = null, nextT = 0, step = 0, timer = null;

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

  function pad(notes, t, dur, vol, dest) {
    notes.forEach((m) => {
      [-7, 7].forEach((det) => {
        const osc = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = N(m);
        osc.detune.value = det;
        f.type = 'lowpass';
        f.frequency.value = 1100;
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

  // kazoo / whistle lead
  function lead(m, t, dur, vol, dest, kind = 'kazoo') {
    const osc = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
    osc.type = kind === 'whistle' ? 'sine' : kind === 'square' ? 'square' : 'sawtooth';
    osc.frequency.value = N(m);
    vib.frequency.value = kind === 'whistle' ? 5.5 : 6.5;
    vg.gain.value = N(m) * (kind === 'whistle' ? 0.012 : 0.018);
    vib.connect(vg);
    vg.connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
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
    } else if (kind === 'square') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      osc.connect(lp);
      n = lp;
    }
    n.connect(g);
    g.connect(dest);
    const send = ctx.createGain();
    send.gain.value = 0.25;
    g.connect(send);
    send.connect(verbIn);
    osc.start(t);
    vib.start(t);
    osc.stop(t + dur + 0.05);
    vib.stop(t + dur + 0.05);
  }

  function strum(chord, t, vol, dest, bright = 0.5, down = true) {
    const notes = down ? chord : chord.slice().reverse();
    notes.forEach((m, i) => playBuf(pluckBuf(m, bright), t + i * 0.014, vol, { dest }));
  }

  function bell(m, t, vol, dest) {
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.frequency.value = N(m);
    mod.frequency.value = N(m) * 3.5;
    mg.gain.setValueAtTime(N(m) * 2, t);
    mg.gain.exponentialRampToValueAtTime(N(m) * 0.1, t + 1.2);
    mod.connect(mg);
    mg.connect(car.frequency);
    env(g.gain, t, 0.003, 1.2, vol);
    car.connect(g);
    g.connect(dest);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    g.connect(send);
    send.connect(verbIn);
    car.start(t);
    mod.start(t);
    car.stop(t + 1.3);
    mod.stop(t + 1.3);
  }

  // chord shapes (MIDI) for the ukulele
  const CH = {
    C: [60, 64, 67, 72], Am: [57, 60, 64, 69], F: [57, 60, 65, 69], G: [55, 59, 62, 67], Dm: [57, 62, 65, 69],
    Bb: [58, 62, 65, 70], Em: [55, 59, 64, 67], Gm: [55, 58, 62, 67], A: [57, 61, 64, 69], D: [57, 62, 66, 69],
  };
  const ROOT = { C: 36, Am: 33, F: 41, G: 43, Dm: 38, Bb: 34, Em: 40, Gm: 43, A: 45, D: 38 };

  const SONGS = {
    // relaxed lounge with ukulele, upright bass, shaker and a whistled tune
    menu: {
      bpm: 96,
      len: 128,
      play(s, t, dest, sx) {
        const bar = Math.floor(s / 16) % 8, b = s % 16;
        const prog = ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'];
        const c = prog[bar];
        if (b === 0 || b === 6 || b === 8 || b === 14) strum(CH[c], t, b === 0 ? 0.32 : 0.22, dest, 0.45, b !== 6 && b !== 14);
        if (b === 0) bass(ROOT[c], t, 0.6, 0.38, dest, 500, 'triangle');
        if (b === 8) bass(ROOT[c] + 7, t, 0.5, 0.3, dest, 500, 'triangle');
        if (b % 4 === 2) playBuf(BUF.shaker, t, 0.35, { dest });
        if (b === 4 || b === 12) playBuf(BUF.kick, t, 0.12, { dest });
        const MEL = [
          [76, 0, 0, 0, 79, 0, 76, 0, 74, 0, 72, 0, 0, 0, 0, 0], [72, 0, 74, 0, 76, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0],
          [77, 0, 0, 0, 76, 0, 74, 0, 72, 0, 74, 0, 0, 0, 0, 0], [74, 0, 72, 0, 71, 0, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0],
          [76, 0, 79, 0, 84, 0, 0, 0, 83, 0, 81, 0, 79, 0, 0, 0], [81, 0, 0, 0, 79, 0, 76, 0, 72, 0, 0, 0, 0, 0, 0, 0],
          [74, 0, 77, 0, 81, 0, 0, 0, 79, 0, 77, 0, 76, 0, 74, 0], [72, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0, 0, 0, 0, 0],
        ];
        const m = MEL[bar][b];
        if (m) lead(m, t, sx * 1.6, 0.11, dest, 'whistle');
        if (b === 0 && bar % 2 === 1) bell(84 + (bar % 4), t + sx * 12, 0.04, dest);
      },
    },
    // bouncy battle march: drums, bass, ska ukulele and a kazoo melody
    game: {
      bpm: 126,
      len: 128,
      play(s, t, dest, sx) {
        const bar = Math.floor(s / 16) % 8, b = s % 16;
        const prog = ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'];
        const c = prog[bar];
        if (b === 0 || b === 8) playBuf(BUF.kick, t, 0.75, { dest });
        if (b === 10 && bar % 2) playBuf(BUF.kick, t, 0.5, { dest });
        if (b === 4 || b === 12) playBuf(BUF.snare, t, 0.45, { dest });
        if (b % 2 === 0) playBuf(BUF.hat, t, b % 4 === 2 ? 0.5 : 0.3, { dest });
        if (b === 14 && bar === 7) playBuf(BUF.ohat, t, 0.4, { dest });
        if (b % 4 === 2) strum(CH[c], t, 0.24, dest, 0.7, true);
        const r = ROOT[c];
        const bl = [r, 0, r + 12, 0, r + 7, 0, r + 12, 0, r, 0, r + 12, 0, r + 7, 0, r + 10, 0][b];
        if (bl) bass(bl, t, sx * 1.7, 0.3, dest, 1100);
        const MEL = [
          [72, 0, 72, 74, 77, 0, 77, 0, 76, 0, 74, 0, 72, 0, 0, 0], [74, 0, 74, 77, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 0, 0],
          [70, 0, 74, 0, 77, 0, 82, 0, 81, 0, 79, 0, 77, 0, 74, 0], [76, 0, 0, 0, 79, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0],
          [72, 0, 72, 74, 77, 0, 77, 0, 81, 0, 79, 0, 77, 0, 0, 0], [74, 0, 77, 0, 81, 0, 84, 0, 86, 0, 84, 0, 81, 0, 0, 0],
          [82, 0, 81, 0, 79, 0, 77, 0, 79, 0, 81, 0, 82, 0, 0, 0], [84, 0, 0, 0, 79, 0, 76, 0, 77, 0, 0, 0, 0, 0, 0, 0],
        ];
        const m = MEL[bar][b];
        if (m && (Math.floor(s / 128) % 2 === 0 || bar >= 4)) lead(m, t, sx * 1.7, 0.09, dest, 'kazoo');
      },
    },
    // tense boss track in D minor: four-on-the-floor, driving bass, stabs
    boss: {
      bpm: 150,
      len: 128,
      play(s, t, dest, sx) {
        const bar = Math.floor(s / 16) % 8, b = s % 16;
        const prog = ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'Bb', 'A'];
        const c = prog[bar];
        if (b % 4 === 0) playBuf(BUF.kick, t, 0.85, { dest });
        if (b === 4 || b === 12) playBuf(BUF.clap, t, 0.4, { dest });
        playBuf(BUF.hat, t, b % 2 ? 0.18 : 0.3, { dest });
        const r = ROOT[c] - 12 + 12;
        if (b % 2 === 0) bass(b % 4 === 0 ? r : r + 12, t, sx * 1.8, 0.32, dest, 1500);
        if (b === 2 || b === 10) pad(CH[c].map((m) => m + 12), t, sx * 1.5, 0.03, dest);
        const MOT = [
          [74, 0, 0, 73, 74, 0, 77, 0, 76, 0, 74, 0, 73, 0, 0, 0], [74, 0, 0, 73, 74, 0, 81, 0, 79, 0, 77, 0, 76, 0, 0, 0],
          [77, 0, 0, 76, 77, 0, 82, 0, 81, 0, 79, 0, 77, 0, 0, 0], [76, 0, 0, 0, 73, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0],
        ];
        const m = MOT[bar % 4][b];
        if (m && bar >= 2) lead(m, t, sx * 1.6, 0.06, dest, 'square');
        if (b === 0 && bar === 0) pad([50, 57, 62], t, sx * 16, 0.035, dest);
      },
    },
  };

  function startSong(name) {
    wantSong = name;
    if (!ctx || settings().music <= 0) return;
    if (song === name && timer) return;
    const now = ctx.currentTime;
    if (songGain) {
      const old = songGain;
      old.gain.setTargetAtTime(0.0001, now, 0.35);
      setTimeout(() => old.disconnect(), 2500);
    }
    song = name;
    songGain = ctx.createGain();
    songGain.gain.setValueAtTime(0.0001, now);
    songGain.gain.setTargetAtTime(1, now + 0.05, 0.4);
    songGain.connect(musicBus);
    step = 0;
    nextT = now + 0.12;
    if (!timer) timer = setInterval(schedule, 30);
  }

  function schedule() {
    if (!ctx || !song) return;
    const S = SONGS[song];
    const sx = 60 / S.bpm / 4;
    while (nextT < ctx.currentTime + 0.18) {
      try {
        S.play(step % S.len, nextT, songGain, sx);
      } catch (e) {
        // keep the loop alive
        if (MT.DEBUG_AUDIO) console.warn('music', song, e);
      }
      nextT += sx;
      step++;
    }
  }

  function stopMusic() {
    if (timer) clearInterval(timer);
    timer = null;
    if (songGain && ctx) songGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
    song = null;
  }

  MT.Audio = {
    init,
    play,
    say,
    // pick the music track: 'menu', 'game' or 'boss'
    music(name) {
      wantSong = name;
      if (ctx && settings().music > 0) startSong(name);
    },
    // test hook: the live context, master bus and current song
    debug: () => ({ ctx, master, song, names: Object.keys(SOUNDS) }),
    applySettings() {
      applySettings();
      if (settings().music > 0) {
        if (wantSong) startSong(wantSong);
      } else stopMusic();
    },
  };
})();
