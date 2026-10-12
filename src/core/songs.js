// The soundtrack. Every song is written as note and drum patterns here and
// played live by the synth instruments in audio.js (MT.MusicKit).
//
// A song is a row of 8-bar sections played in the order of its `form`, e.g.
// A A B A. Its play(i, t, mix, sx) runs once per 16th note:
//   i    { n, pass, sec, secIdx, ss, bar, b }: pass = how many times the whole
//        song has played, sec = section name, ss = 16th inside the section,
//        bar = bar inside the section, b = 16th inside the bar (0..15)
//   t    start time of the step (already swung)
//   mix  the song's mixer channels: drums, perc, bass, chords, pad, arp, lead,
//        counter, plus pump(t, depth) to duck chords and pads under the kick
//   sx   length of one 16th note in seconds
// Optional song settings: swing / swing16 (how late the off-beats come, in
// 16ths), loops (passes before the playlist moves on), reverb and gain.
//
// The battle songs (march, tropical, funk, space, western) rotate as a
// playlist during a game; each map starts with the one that suits it.
(function () {
  const K = MT.MusicKit;

  // ------------------------------------------------------------- notation
  const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function note(tok) {
    const m = /^([a-g])([#b]?)(\d)$/.exec(tok);
    if (!m) throw new Error('bad note "' + tok + '"');
    return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }

  // Melody: one token per 8th note. "e5" plays a note (c4 = middle C), "-" holds
  // the previous note, "." is a rest and "|" a bar line.
  // Returns { 16th step inside the section: [midi, length in 16ths] }.
  function seq(str, bars = 8) {
    const out = {};
    let s = 0, last = -1, bar = 0;
    str.trim().split(/\s+/).forEach((tok) => {
      if (tok === '|') {
        if (s !== ++bar * 16) console.warn('songs.js: bar', bar, 'has the wrong length in', str);
        s = bar * 16;
        return;
      }
      if (tok === '-') {
        if (last >= 0) out[last][1] += 2;
      } else if (tok === '.') last = -1;
      else {
        out[s] = [note(tok), 2];
        last = s;
      }
      s += 2;
    });
    if (s !== bars * 16) console.warn('songs.js: melody is', s / 16, 'bars long instead of', bars, str);
    return out;
  }

  // the original 16th-note melodies: rows of MIDI numbers, 0 = nothing; each
  // note lasts until the next one (at most 4 16ths)
  function grid(rows) {
    const out = {};
    rows.forEach((row, bar) => row.forEach((m, k) => {
      if (!m) return;
      let len = 1;
      while (k + len < 16 && !row[k + len] && len < 4) len++;
      out[bar * 16 + k] = [m, len];
    }));
    return out;
  }

  // drum pattern: one character per 16th, X = accent, x = normal, o = ghost note
  const VEL = { X: 1, x: 0.7, o: 0.32 };
  const pat = (str) => str.replace(/[\s|]/g, '').split('').map((c) => VEL[c] || 0);
  const hit = (p, i) => p[i.ss % p.length];

  // chords by name: "C", "Am", "G7", "Fmaj7", "Em7", "Bb", "F#m7b5"...
  const ROOTS = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], 6: [0, 4, 7, 9],
    sus4: [0, 5, 7], dim: [0, 3, 6], m7b5: [0, 3, 6, 10], add9: [0, 4, 7, 14],
  };
  const parsed = {};
  function chord(name) {
    if (!parsed[name]) {
      const m = /^([A-G][#b]?)(.*)$/.exec(name);
      if (!m || ROOTS[m[1]] == null || !QUAL[m[2]]) throw new Error('bad chord "' + name + '"');
      parsed[name] = { pc: ROOTS[m[1]], iv: QUAL[m[2]] };
    }
    return parsed[name];
  }
  const wrap = (pc, lo) => lo + ((((pc - lo) % 12) + 12) % 12);
  // close voicing with every note in [lo, lo + 12); `top` doubles the lowest note an octave up
  function voice(name, lo = 60, top = false) {
    const notes = [...new Set(chord(name).iv.map((i) => wrap(chord(name).pc + i, lo)))].sort((a, b) => a - b);
    if (top) notes.push(notes[0] + 12);
    return notes;
  }
  const root = (name, lo = 33) => wrap(chord(name).pc, lo);
  // the chord's 3rd, 5th and 7th as intervals (a triad's "7th" is the octave)
  const third = (name) => chord(name).iv[1];
  const seventh = (name) => (chord(name).iv[3] && chord(name).iv[3] < 12 ? chord(name).iv[3] : 12);
  // progressions hold one chord per bar, or [a, b] for two half bars
  const chordAt = (prog, bar, b) => {
    const c = prog[bar % prog.length];
    return Array.isArray(c) ? c[b < 8 ? 0 : 1] : c;
  };

  // note from a section melody on this step: fn(midi, lengthIn16ths)
  function melody(mel, i, fn) {
    const n = mel[i.ss];
    if (n) fn(n[0], n[1]);
  }
  // the melody note sounding before this one (for theremin-style slides)
  function prevNote(mel, i) {
    for (let s = i.ss - 1; s >= 0; s--) if (mel[s]) return mel[s][0];
    return null;
  }

  // walking bass: root, 3rd, 5th, then a half step into the next chord
  function walk(prog, nextProg, i) {
    const beat = i.b >> 2, c = chordAt(prog, i.bar, i.b), r = root(c, 36);
    const split = Array.isArray(prog[i.bar % prog.length]);
    if (beat === 0 || (split && beat === 2)) return r;
    if (beat === 3) {
      const nr = root(i.bar === 7 ? chordAt(nextProg, 0, 0) : chordAt(prog, i.bar + 1, 0), 36);
      return nr + (nr > r ? -1 : 1);
    }
    return r + (beat === 1 && !split ? third(c) : 7);
  }

  // crash cymbal at the top of every section except the very first
  function crash(i, t, B, vol = 0.22) {
    if (i.ss === 0 && (i.secIdx > 0 || i.pass > 0)) K.drum('crash', t, vol, B.drums);
  }

  // the section after this one in the song's form
  const nextSec = (song, i) => song.form[(i.secIdx + 1) % song.form.length];

  const SONGS = (MT.SONGS = {});

  // =================================================================== menu
  // Banana Lounge: swung ukulele, upright bass, finger snaps and a whistled
  // tune; the bridge turns jazzy with electric piano, walking bass and vibes.
  {
    const SEC = {
      A: {
        prog: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'],
        mel: seq(`e5 - g5 e5 d5 c5 - - | c5 d5 e5 - a4 - - . | f5 - e5 d5 c5 d5 - . | d5 c5 b4 - g4 - - . |
                  e5 g5 c6 - b5 a5 g5 . | a5 - g5 e5 c5 - - . | d5 f5 a5 - g5 f5 e5 d5 | c5 - d5 - b4 - - .`),
      },
      B: {
        prog: ['Fmaj7', 'Em7', 'Dm7', 'G7', 'Fmaj7', 'Em7', 'A7', ['Dm7', 'G7']],
        mel: seq(`. a4 c5 e5 a5 - - - | g5 - - e5 d5 - b4 - | . d5 f5 a5 c6 - - - | b5 - a5 - g5 - f5 - |
                  e5 - - f5 a5 - c6 - | b5 - - g5 e5 - - - | c#6 - - a5 g5 - e5 - | f5 - a5 - g5 - - -`),
      },
    };
    const snap = pat('....x.......x...'), shaker = pat('o.x.o.x.o.x.o.x.'), ride = pat('x...x.x.x...x.x.');
    const song = (SONGS.menu = {
      bpm: 96,
      swing: 0.5,
      gain: 1.3,
      form: ['A', 'A', 'B', 'A'],
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b);
        // drums: soft kick, finger snaps on 2 and 4, shaker (a ride cymbal in the bridge)
        if (b === 0) K.drum('kick', t, 0.22, B.drums);
        if (b === 10) K.drum('kick', t, 0.1, B.drums);
        if (hit(snap, i)) K.drum('clap', t, 0.13, B.perc, 1.6);
        if (i.sec === 'B') {
          if (hit(ride, i)) K.drum('ohat', t, 0.16 * hit(ride, i), B.drums, 1.5);
        } else if (hit(shaker, i)) K.drum('shaker', t, 0.4 * hit(shaker, i), B.perc);
        if (i.sec === 'A') {
          // ukulele: down, up, down, up
          if (b === 0 || b === 6 || b === 8 || b === 14) K.strum(voice(c, 60, true), t, b === 0 ? 0.3 : 0.2, B.chords, 0.45, b === 0 || b === 8);
          // two-beat bass with a little step into every other bar
          if (b === 0) K.bass(root(c), t, sx * 7, 0.36, B.bass, 500, 'triangle');
          if (b === 8) K.bass(root(c) + 7, t, sx * 5, 0.3, B.bass, 500, 'triangle');
          if (b === 14 && i.bar % 2 === 1) {
            const nr = root(i.bar === 7 ? chordAt(SEC[nextSec(song, i)].prog, 0, 0) : chordAt(S.prog, i.bar + 1, 0));
            K.bass(nr - 1, t, sx * 2, 0.26, B.bass, 500, 'triangle');
          }
          // a little bell sparkle on the chord's top note
          if (b === 12 && i.bar % 2 === 1) K.bell(voice(c, 72)[2] + 12, t, 0.035, B.counter);
        } else {
          // bridge: electric piano in a Charleston rhythm and a walking bass
          if (b === 0) K.epiano(voice(c, 57), t, sx * 3, 0.16, B.chords);
          if (b === 6) K.epiano(voice(c, 57), t, sx * 2, 0.12, B.chords);
          if (b % 4 === 0) K.bass(walk(S.prog, SEC[nextSec(song, i)].prog, i), t, sx * 3.6, 0.34, B.bass, 600, 'triangle');
        }
        // the tune: whistled, on vibes in the bridge and the second time round
        melody(S.mel, i, (m, len) => {
          if (i.sec === 'B' || (i.pass % 2 === 1 && i.secIdx === 1)) K.vibes(m, t, 0.22, B.counter, len * sx);
          else K.lead(m, t, len * sx * 0.92, 0.11, B.lead, 'whistle');
        });
      },
    });
  }

  // ================================================================= march
  // Backyard Brigade: the bouncy battle march. Drums, polka bass, ska ukulele
  // and the kazoo tune; the B part brings in the brass band.
  {
    const SEC = {
      A: {
        prog: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'],
        mel: grid([
          [72, 0, 72, 74, 77, 0, 77, 0, 76, 0, 74, 0, 72, 0, 0, 0], [74, 0, 74, 77, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 0, 0],
          [70, 0, 74, 0, 77, 0, 82, 0, 81, 0, 79, 0, 77, 0, 74, 0], [76, 0, 0, 0, 79, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0],
          [72, 0, 72, 74, 77, 0, 77, 0, 81, 0, 79, 0, 77, 0, 0, 0], [74, 0, 77, 0, 81, 0, 84, 0, 86, 0, 84, 0, 81, 0, 0, 0],
          [82, 0, 81, 0, 79, 0, 77, 0, 79, 0, 81, 0, 82, 0, 0, 0], [84, 0, 0, 0, 79, 0, 76, 0, 77, 0, 0, 0, 0, 0, 0, 0],
        ]),
      },
      B: {
        prog: ['Dm', 'Am', 'Bb', 'F', 'Gm', 'C', 'Bb', 'C7'],
        mel: seq(`a5 - - g5 f5 - d5 - | e5 - - d5 c5 - a4 - | d5 - f5 - bb5 - a5 g5 | a5 - - - f5 - . . |
                  g5 - bb5 - d6 - c6 bb5 | c6 - - bb5 a5 - g5 - | f5 - g5 - a5 - bb5 - | c6 - - - - - . .`),
      },
    };
    const kick = pat('X.......X.x.....'), snare = pat('....X.......X..o'), hat = pat('x.X.x.X.x.X.x.X.');
    const kickB = pat('X...X...X...X...'), snareB = pat('....X..o.o..X.oo');
    SONGS.march = {
      bpm: 126,
      form: ['A', 'A', 'B', 'A'],
      loops: 2,
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b), r = root(c), inB = i.sec === 'B';
        const k = hit(inB ? kickB : kick, i), s = hit(inB ? snareB : snare, i);
        if (k) K.drum('kick', t, 0.72 * k, B.drums);
        if (s) K.drum('snare', t, 0.42 * s, B.drums);
        if (hit(hat, i)) K.drum('hat', t, 0.42 * hit(hat, i), B.drums);
        crash(i, t, B);
        // snare roll into the next section
        if (i.bar === 7 && b >= 12) K.drum('snare', t, 0.16 + (b - 12) * 0.08, B.drums);
        // ska upstrokes on the off-beats
        if (b % 4 === 2) K.strum(voice(c, 60, true), t, 0.22, B.chords, 0.7, false);
        if (inB) {
          // oom-pah bass and brass chords on the beat
          if (b % 4 === 0) K.bass(b % 8 === 0 ? r : r + 7, t, sx * 3, 0.3, B.bass, 1000);
          if (b === 0 || b === 8) K.horn(voice(c, 55), t, sx * 1.5, 0.022, B.chords);
        } else {
          const bl = [r, 0, r + 12, 0, r + 7, 0, r + 12, 0, r, 0, r + 12, 0, r + 7, 0, r + 10, 0][b];
          if (bl) K.bass(bl, t, sx * 1.7, 0.3, B.bass, 1100);
          // brass hits at the end of each phrase
          if (i.bar % 4 === 3 && (b === 10 || b === 12)) K.horn(voice(c, 60), t, sx * (b === 12 ? 3 : 1), 0.03, B.counter);
        }
        melody(S.mel, i, (m, len) => {
          if (inB) {
            K.horn([m], t, len * sx * 0.9, 0.045, B.lead);
            K.bell(m + 12, t, 0.025, B.counter, 0.6);
          } else if (i.secIdx === 1 && i.bar < 4) {
            // second time: the brass takes the first half of the tune
            K.horn([m, m - 12], t, len * sx * 0.85, 0.035, B.lead);
          } else {
            K.lead(m, t, len * sx * 1.05, 0.1, B.lead, 'kazoo');
            if (i.pass % 2 === 1) K.bell(m + 12, t, 0.022, B.counter, 0.5);
          }
        });
      },
    };
  }

  // ============================================================== tropical
  // Banana Island: calypso for the jungle and the beach. Steel drum, marimba,
  // congas, clave and a bouncing bass.
  {
    const SEC = {
      A: {
        prog: ['G', 'C', 'D', 'G', 'Em', 'C', 'D7', 'G'],
        mel: seq(`d5 g5 - b5 - a5 g5 - | e5 g5 - c6 - b5 a5 - | f#5 - a5 - d6 - c6 a5 | b5 - - g5 - - . . |
                  e5 g5 - b5 - a5 g5 - | e5 - g5 - c6 - e6 - | d6 - c6 - a5 - f#5 - | g5 - - - . . . .`),
      },
      B: {
        prog: ['C', 'D', 'Bm', 'Em', 'Am', 'D', 'G', 'D7'],
        mel: seq(`c6 b5 c6 - g5 - . . | a5 g5 a5 - f#5 - . . | b5 a5 b5 - f#5 - d5 - | e5 - - - . . . . |
                  c6 b5 a5 - e5 - a5 - | f#5 - a5 - d6 - c6 - | b5 - g5 - d5 - g5 - | a5 - - - f#5 - . .`),
      },
    };
    const kick = pat('X.....x.X.....x.'), rim = pat('....x..o....x..o'), shaker = pat('xoxoxoxoxoxoxoxo');
    const clave = pat('X.....X.....X.......X...X.......'), congaHi = pat('..Xo......Xo....'), congaLo = pat('......X.......X.');
    const cowbell = pat('x...x...x...x...');
    SONGS.tropical = {
      bpm: 112,
      form: ['A', 'A', 'B', 'A'],
      loops: 2,
      gain: 1.3,
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b), r = root(c, 36), inB = i.sec === 'B';
        if (hit(kick, i)) K.drum('kick', t, 0.6 * hit(kick, i), B.drums);
        if (hit(rim, i)) K.drum('clave', t, 0.32 * hit(rim, i), B.drums, 0.62);
        if (hit(shaker, i)) K.drum('shaker', t, 0.3 * hit(shaker, i), B.perc);
        if (hit(clave, i)) K.drum('clave', t, 0.3, B.perc);
        if (hit(congaHi, i)) K.drum('conga', t, 0.42 * hit(congaHi, i), B.perc, 1.3);
        if (hit(congaLo, i)) K.drum('conga', t, 0.45, B.perc, 0.9);
        if (inB && hit(cowbell, i)) K.drum('cowbell', t, 0.22, B.perc);
        crash(i, t, B, 0.16);
        // timbale-style tom run into the next section
        if (i.bar === 7 && b >= 12) K.drum('tom', t, 0.4, B.drums, 2.1 - (b - 12) * 0.25);
        // calypso bass: 1, the "and" of 2, 3 and a bounce on 4
        const bl = { 0: r, 6: r + 7, 8: r, 12: r + 12, 14: r + 7 }[b];
        if (bl != null) K.bass(bl, t, sx * (b === 12 ? 1.5 : 2.6), 0.32, B.bass, 750, 'triangle');
        // off-beat strums
        if (b % 4 === 2) K.strum(voice(c, 60, true), t, 0.16, B.chords, 0.6, b % 8 === 2);
        // marimba keeps rolling chord tones under the tune
        if (!inB && b % 4 === 0) K.marimba(voice(c, 55)[(b >> 2) % 3], t, 0.13, B.counter);
        melody(S.mel, i, (m) => {
          if (i.pass % 2 === 1 && i.secIdx === 1) K.marimba(m, t, 0.24, B.lead);
          else K.steel(m, t, 0.18, B.lead);
          if (inB) K.marimba(m - 12, t, 0.15, B.counter);
        });
      },
    };
  }

  // ================================================================== funk
  // Lab Rat Funk: for the lab and the factory. Slap bass, electric piano
  // stabs, funky guitar, a horn section and a wide synth lead.
  {
    const SEC = {
      A: {
        prog: ['Em7', 'A7', 'Em7', 'A7', 'Cmaj7', 'B7', 'Em7', 'A7'],
        mel: seq(`e5 - g5 e5 - . b4 d5 | e5 - - . c#5 - a4 - | g5 - a5 g5 - e5 d5 e5 | . . c#5 - e5 - g5 - |
                  b5 - - g5 - e5 - . | f#5 - - d#5 - b4 a4 - | e5 - g5 - b5 - d6 - | c#6 - b5 - a5 - g5 -`),
      },
      B: {
        prog: ['Cmaj7', 'D', 'Bm7', 'Em7', 'Cmaj7', 'D', 'B7', 'B7'],
        mel: seq(`g5 - - - e5 - g5 - | f#5 - - - d5 - a5 - | f#5 - d5 - b4 - d5 - | e5 - - - - - . . |
                  e6 - d6 - b5 - g5 - | a5 - - f#5 - d5 - . | d#6 - - b5 - f#5 - a5 | b5 - - - . . . .`),
      },
    };
    const kick = pat('X..x....X.x...x.'), snare = pat('....X..o.o..X..o'), hat = pat('XoxoXoxoXoxoXoxo');
    const keys = pat('..x..x....x..x..'), chank = pat('....x.......x...');
    // slap bass line: R = root, O = octave, 5 = fifth, 7 = the chord's seventh
    const BASS = 'R..O..RR7.O.5.7.';
    SONGS.funk = {
      bpm: 108,
      swing16: 0.14,
      form: ['A', 'A', 'B', 'A'],
      loops: 2,
      gain: 1.3,
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b), r = root(c, 28), inB = i.sec === 'B';
        // the bridge strips the drums down for four bars, then builds back up
        const thin = inB && i.bar < 4;
        if (hit(kick, i) && (!thin || b % 8 === 0)) K.drum('kick', t, 0.75 * hit(kick, i), B.drums);
        if (hit(snare, i)) K.drum(thin ? 'clap' : 'snare', t, (thin ? 0.32 : 0.45) * hit(snare, i), B.drums);
        if (hit(hat, i)) K.drum('hat', t, 0.36 * hit(hat, i), B.drums);
        if (b === 14 && i.bar % 4 === 3) K.drum('ohat', t, 0.22, B.drums);
        crash(i, t, B, 0.18);
        if (i.bar === 7 && b >= 8) K.drum(b % 2 ? 'snare' : 'tom', t, 0.14 + (b - 8) * 0.04, B.drums, b % 2 ? 1 : 1.7 - (b - 8) * 0.08);
        // slap bass
        const tok = BASS[b];
        if (tok !== '.') {
          const m = r + { R: 0, O: 12, 5: 7, 7: seventh(c) }[tok];
          K.bass(m, t, sx * (tok === 'O' ? 0.9 : 1.6), tok === 'O' ? 0.26 : 0.32, B.bass, tok === 'O' ? 2600 : 1500);
        }
        // electric piano stabs and a muted guitar "chank" on the backbeat
        if (hit(keys, i)) K.epiano(voice(c, 59), t, sx * 1.2, 0.09, B.chords);
        if (hit(chank, i)) K.strum(voice(c, 64), t, 0.1, B.counter, 0.95, true, 0.07);
        // horn hits at the end of the phrase
        if (!inB && i.bar % 4 === 3 && (b === 10 || b === 12)) K.horn(voice(c, 62), t, sx * (b === 12 ? 3 : 1), 0.03, B.counter);
        melody(S.mel, i, (m, len) => {
          if (inB) {
            K.horn([m, m - 12], t, len * sx * 0.9, 0.055, B.lead);
          } else {
            // and the minions take over the tune on the second time round
            K.lead(m, t, len * sx * 0.9, i.pass % 2 === 1 && i.secIdx === 1 ? 0.085 : 0.06, B.lead, i.pass % 2 === 1 && i.secIdx === 1 ? 'kazoo' : 'saw');
          }
        });
      },
    };
  }

  // ================================================================= space
  // Moonwalk: dreamy synth-pop for the moon and the arctic. Bubbling
  // arpeggios, a pumping pad, off-beat bass and a sliding theremin tune.
  {
    const SEC = {
      A: {
        prog: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'E'],
        mel: seq(`a5 - - - - - e5 - | f5 - - - c6 - - - | e5 - - - g5 - c6 - | b5 - - - - - d5 - |
                  c6 - - - b5 - a5 - | a5 - - - f5 - - - | g5 - - - e5 - c5 - | g#5 - - - - - b5 -`),
      },
      B: {
        prog: ['Dm', 'Am', 'Dm', 'E', 'F', 'G', 'Am', 'E'],
        mel: seq(`d6 - c6 - a5 - f5 - | e5 - - - a5 - c6 - | d6 - e6 - f6 - e6 d6 | e6 - - - b5 - g#5 - |
                  a5 - c6 - f6 - c6 - | b5 - d6 - g6 - d6 - | c6 - - - a5 - e5 - | g#5 - - - - - - -`),
      },
    };
    const kick = pat('X...X...X...X...'), clap = pat('....X.......X...'), hat = pat('..x...x...x...x.'), tick = pat('o.o.o.o.o.o.o.o.');
    const ARP = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1];
    SONGS.space = {
      bpm: 118,
      form: ['A', 'A', 'B', 'A'],
      loops: 2,
      reverb: 1.3,
      gain: 1.3,
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b), r = root(c, 33), inB = i.sec === 'B';
        const intro = i.pass === 0 && i.secIdx === 0 && i.bar < 2;
        if (!intro && hit(kick, i)) {
          K.drum('kick', t, 0.62, B.drums);
          B.pump(t, 0.5);
        }
        if (!intro && hit(clap, i)) K.drum('clap', t, 0.3, B.drums);
        if (hit(hat, i)) K.drum('hat', t, 0.3, B.drums);
        if (hit(tick, i)) K.drum('shaker', t, 0.22, B.perc);
        crash(i, t, B, 0.15);
        if (inB && i.bar === 7 && b >= 8) K.drum('clap', t, 0.1 + (b - 8) * 0.04, B.drums);
        // arpeggio over two octaves of the chord, its filter slowly opening and closing
        const v = voice(c, 57), notes = v.concat(v.map((m) => m + 12));
        const cut = 1300 + 1500 * (0.5 + 0.5 * Math.sin((i.n / 128) * Math.PI));
        K.synth(notes[ARP[b] % notes.length], t, sx * 1.6, 0.08, B.arp, cut);
        // pad + off-beat bass
        if (b === 0) K.pad(voice(c, 60), t, sx * 16, 0.035, B.pad, 1500);
        if (b % 4 === 2) K.bass(r + (b === 14 ? 12 : 0), t, sx * 1.8, 0.3, B.bass, 800);
        // the tune: a theremin in the A part, bells in the B part
        melody(S.mel, i, (m, len) => {
          if (inB) {
            K.bell(m, t, 0.06, B.lead, 1.4);
            K.lead(m - 12, t, len * sx, 0.035, B.counter, 'whistle');
          } else K.lead(m, t, len * sx, 0.1, B.lead, 'whistle', prevNote(S.mel, i));
        });
        // twinkle every other bar
        if (b === 14 && i.bar % 2 === 1) K.bell(voice(c, 72)[1] + 12, t, 0.03, B.counter, 1.6);
      },
    };
  }

  // =============================================================== western
  // Banana Gulch: a spaghetti western for the desert and the volcano.
  // Galloping guitar, big reverb, a lonely whistle and a mariachi trumpet.
  {
    const SEC = {
      A: {
        prog: ['Am', 'Am', 'G', 'G', 'F', 'F', 'E', 'E'],
        mel: seq(`a4 - - e5 - - a5 - | g5 - - e5 - - - - | d5 - - g5 - - b5 - | a5 - - - g5 - - - |
                  f5 - - a5 - - c6 - | a5 - - g5 - - f5 - | e5 - - g#5 - - b5 - | e5 - - - - - . .`),
      },
      B: {
        prog: ['Dm', 'Am', 'Dm', 'E', 'Dm', 'Am', 'F', 'E'],
        mel: seq(`f5 - - - e5 - d5 - | e5 - - - - - . . | a5 - - - g5 - f5 - | g#5 - - - - - . . |
                  d6 - - - c6 - a5 - | c6 - - - b5 - a5 - | a5 - - g5 - - f5 - | e5 - - - - - - -`),
      },
    };
    const gallop = pat('X.xxx.xxX.xxx.xx'), kick = pat('X.......X.......'), rim = pat('....x.......x...');
    SONGS.western = {
      bpm: 128,
      form: ['A', 'A', 'B', 'A'],
      loops: 2,
      reverb: 1.4,
      gain: 1.5,
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b), inB = i.sec === 'B';
        if (hit(kick, i)) K.drum('kick', t, 0.55, B.drums);
        if (hit(rim, i)) K.drum('clave', t, 0.28, B.drums, 0.55);
        crash(i, t, B, 0.2);
        // tom gallop into the next section
        if (i.bar === 7 && hit(gallop, i)) K.drum('tom', t, 0.35 * hit(gallop, i), B.drums, b < 8 ? 1.3 : 0.95);
        // palm-muted galloping guitar: root on the beat, fifth on the off-beats
        const g = hit(gallop, i);
        if (g) K.pluck(root(c, 45) + (b % 8 >= 4 ? 7 : 0), t, 0.3 * g, B.chords, 0.35, sx * 0.9);
        // big open strum on every new chord and a two-beat bass
        if (b === 0 && (i.bar % 2 === 0 || c !== chordAt(S.prog, i.bar - 1, 0))) K.strum(voice(c, 52, true), t, 0.2, B.counter, 0.85);
        if (b % 8 === 0) K.bass(root(c, 33) + (b === 8 ? 7 : 0), t, sx * 6, 0.32, B.bass, 600, 'triangle');
        // castanet clicks in the B part
        if (inB && (b === 6 || b === 7 || b === 14)) K.drum('clave', t, 0.18, B.perc, 1.25);
        melody(S.mel, i, (m, len) => {
          if (inB) K.lead(m, t, len * sx * 0.95, 0.075, B.lead, 'brass');
          else if (i.pass % 2 === 1 && i.secIdx === 1) K.pluck(m - 12, t, 0.42, B.lead, 0.95);
          else K.lead(m, t, len * sx * 0.95, 0.11, B.lead, 'whistle');
        });
      },
    };
  }

  // ================================================================== boss
  // Giant Alert: the tense D minor track while a big endgame giant is on the
  // field. Four-on-the-floor, driving bass, stabs; the B part adds a horn
  // section and a choir pad.
  {
    const MOT = [
      [74, 0, 0, 73, 74, 0, 77, 0, 76, 0, 74, 0, 73, 0, 0, 0], [74, 0, 0, 73, 74, 0, 81, 0, 79, 0, 77, 0, 76, 0, 0, 0],
      [77, 0, 0, 76, 77, 0, 82, 0, 81, 0, 79, 0, 77, 0, 0, 0], [76, 0, 0, 0, 73, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0],
    ];
    const SEC = {
      A: { prog: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'Bb', 'A'], mel: grid(MOT.concat(MOT)) },
      B: {
        prog: ['Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'],
        mel: seq(`d6 - - - c6 - bb5 - | a5 - bb5 - g5 - - - | f5 - - - a5 - d6 - | c#6 - - - d6 - - - |
                  bb5 - - - a5 - f5 - | g5 - - - e5 - c5 - | a5 - - - c#6 - e6 - | e6 - - - - - . .`),
      },
    };
    SONGS.boss = {
      bpm: 150,
      form: ['A', 'A', 'B', 'A'],
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b), r = root(c, 38), inB = i.sec === 'B';
        if (b % 4 === 0) {
          K.drum('kick', t, 0.85, B.drums);
          B.pump(t, 0.45);
        }
        if (b === 4 || b === 12) K.drum('clap', t, 0.4, B.drums);
        K.drum('hat', t, b % 2 ? 0.18 : 0.3, B.drums);
        crash(i, t, B, 0.24);
        if (i.bar === 7 && b >= 8) K.drum('tom', t, 0.3 + (b - 8) * 0.03, B.drums, 1.6 - (b - 8) * 0.1);
        if (b % 2 === 0) K.bass(b % 4 === 0 ? r : r + 12, t, sx * 1.8, 0.32, B.bass, 1500);
        if (inB) {
          if (b === 0) K.pad(voice(c, 57), t, sx * 16, 0.03, B.pad, 900);
          if (b === 0 || b === 6 || b === 12) K.horn(voice(c, 57), t, sx * (b === 12 ? 3 : 1.5), 0.024, B.chords);
        } else {
          if (b === 2 || b === 10) K.pad(voice(c, 62), t, sx * 1.5, 0.03, B.pad);
          if (b === 0 && i.bar === 0) K.pad([50, 57, 62], t, sx * 16, 0.035, B.pad);
          // second time: a pulsing synth ostinato underneath
          if (i.secIdx === 1) K.synth(voice(c, 50)[[0, 2, 1, 2][b % 4]] + (b % 8 >= 4 ? 12 : 0), t, sx * 1.4, 0.035, B.arp, 1800);
        }
        melody(S.mel, i, (m, len) => {
          if (inB) K.horn([m, m - 12], t, len * sx * 0.9, 0.04, B.lead);
          else if (i.bar >= 2 || i.secIdx > 0) K.lead(m, t, len * sx * 1.1, 0.06, B.lead, i.secIdx === 3 ? 'saw' : 'square');
        });
      },
    };
  }

  // =============================================================== villain
  // Villain Showdown: the boss battles. C minor, half-time drums, timpani,
  // a pulsing string ostinato, a choir and a heroic-evil horn theme.
  {
    const SEC = {
      A: {
        prog: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Fm', 'G'],
        mel: seq(`c5 - - - eb5 - g5 - | ab5 - - - g5 - eb5 - | f5 - - - ab5 - c6 - | b5 - - - - - . . |
                  c6 - - - g5 - eb5 - | c6 - - - ab5 - eb5 - | f5 - ab5 - c6 - ab5 - | g5 - - - b4 - d5 -`),
      },
      B: {
        prog: ['Ab', 'Bb', 'Gm', 'Cm', 'Ab', 'Bb', 'G', 'G'],
        mel: seq(`eb6 - - - c6 - ab5 - | d6 - - - bb5 - f5 - | g5 - bb5 - d6 - - - | c6 - - - - - . . |
                  eb6 - - - d6 - c6 - | d6 - - - f6 - d6 - | b5 - - - d6 - - - | g5 - - - - - . .`),
      },
    };
    const kick = pat('X.....x...x.....'), snare = pat('........X.......'), hat = pat('x.x.x.x.x.x.x.x.');
    SONGS.villain = {
      bpm: 140,
      form: ['A', 'A', 'B', 'A'],
      gain: 1.1,
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b), inB = i.sec === 'B';
        if (hit(kick, i)) {
          K.drum('kick', t, 0.8 * hit(kick, i), B.drums);
          B.pump(t, 0.35);
        }
        if (hit(snare, i)) K.drum('snare', t, 0.5, B.drums);
        if (hit(hat, i)) K.drum('hat', t, 0.24, B.drums);
        crash(i, t, B, 0.24);
        // timpani on the downbeat and a roll at the end of each phrase
        if (b === 0) K.drum('tom', t, 0.55, B.perc, 0.55);
        if (i.bar % 4 === 3 && b >= 8) K.drum('tom', t, 0.18 + (b - 8) * 0.04, B.perc, 0.6);
        // string ostinato
        const v = voice(c, 48);
        K.synth([v[0], v[2], v[1], v[2]][b % 4] + (b % 8 >= 4 ? 12 : 0), t, sx * 1.3, 0.07, B.arp, 1700);
        if (b === 0) {
          K.bass(root(c, 31), t, sx * 7, 0.34, B.bass, 450);
          K.pad(voice(c, 55), t, sx * 16, 0.026, B.pad, 900);
        }
        if (b === 8) K.bass(root(c, 31), t, sx * 6, 0.3, B.bass, 450);
        melody(S.mel, i, (m, len) => {
          K.horn([m, m - 12], t, len * sx * 0.92, inB ? 0.055 : 0.05, B.lead);
          if (inB) K.lead(m, t, len * sx * 0.9, 0.03, B.counter, 'square');
        });
      },
    };
  }

  // =============================================================== victory
  // Banana Party: after a win. Four-on-the-floor, claps, ukulele, kazoo, then
  // the brass band and a glockenspiel.
  {
    const SEC = {
      A: {
        prog: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'],
        mel: seq(`c5 - e5 - g5 - c6 - | b5 - - g5 - - d5 - | c6 - - a5 - - e5 - | f5 - a5 - c6 - a5 - |
                  g5 - - e5 - - c5 - | d5 - g5 - b5 - d6 - | c6 - a5 - f5 - a5 - | g5 - - - d5 - g5 -`),
      },
    };
    SEC.B = SEC.A;
    const strum = pat('x.x.oxox x.x.oxox');
    SONGS.victory = {
      bpm: 128,
      form: ['A', 'B'],
      play(i, t, B, sx) {
        const S = SEC[i.sec], b = i.b, c = chordAt(S.prog, i.bar, i.b), r = root(c, 36), inB = i.sec === 'B';
        if (b % 4 === 0) {
          K.drum('kick', t, 0.7, B.drums);
          B.pump(t, 0.3);
        }
        if (b === 4 || b === 12) {
          K.drum('clap', t, 0.38, B.drums);
          K.drum('snare', t, 0.2, B.drums);
        }
        if (b % 4 === 2) K.drum('ohat', t, 0.2, B.drums);
        else K.drum('hat', t, 0.18, B.drums);
        crash(i, t, B, 0.2);
        if (i.bar === 7 && b >= 12) K.drum('snare', t, 0.2 + (b - 12) * 0.08, B.drums);
        if (hit(strum, i)) K.strum(voice(c, 60, true), t, 0.09 * hit(strum, i) + 0.03, B.chords, 0.7, b % 4 === 0);
        if (b % 2 === 0) K.bass(b % 4 === 0 ? r : r + 12, t, sx * 1.6, 0.3, B.bass, 1300);
        melody(S.mel, i, (m, len) => {
          if (inB) {
            K.horn([m, m - 12], t, len * sx * 0.9, 0.04, B.lead);
            K.bell(m + 12, t, 0.03, B.counter, 0.6);
          } else K.lead(m, t, len * sx, 0.12, B.lead, 'kazoo');
        });
      },
    };
  }

  // ================================================================ defeat
  // Sad Banana: after a loss. A slow, gentle A minor tune on a fingerpicked
  // ukulele, a soft pad and a whistle (vibes the second time).
  {
    const S = {
      prog: ['Am', 'F', 'C', 'E', 'Am', 'Dm', 'E', 'Am'],
      mel: seq(`a4 - c5 - e5 - - - | f5 - e5 - c5 - - - | e5 - d5 - c5 - g4 - | b4 - - - g#4 - - - |
                c5 - - - e5 - a5 - | f5 - - - e5 - d5 - | b4 - - - d5 - g#4 - | a4 - - - - - - -`),
    };
    const PICK = [0, 1, 2, 3, 2, 1, 2, 3];
    SONGS.defeat = {
      bpm: 76,
      form: ['A'],
      gain: 1.6,
      play(i, t, B, sx) {
        const b = i.b, c = chordAt(S.prog, i.bar, i.b);
        if (b % 2 === 0) {
          const v = voice(c, 57, true), k = PICK[b >> 1];
          K.pluck(k === 0 ? root(c, 45) : v[k - 1], t, k === 0 ? 0.34 : 0.22, B.chords, 0.3);
        }
        if (b === 0) {
          K.pad(voice(c, 57), t, sx * 16, 0.016, B.pad, 900);
          K.bass(root(c, 33), t, sx * 12, 0.22, B.bass, 350, 'triangle');
        }
        melody(S.mel, i, (m, len) => {
          if (i.pass % 2 === 1) K.vibes(m, t, 0.18, B.lead, len * sx);
          else K.lead(m, t, len * sx * 0.95, 0.085, B.lead, 'whistle');
        });
      },
    };
  }
})();
