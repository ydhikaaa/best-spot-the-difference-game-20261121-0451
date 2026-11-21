// audio.js — every sound is synthesized with WebAudio at play time; the game
// ships no audio files. A single shared context is created lazily and resumed
// on the first user gesture (browser autoplay policy). All cues are short
// oscillator envelopes, so the module is tiny and fully offline.

let ctx = null;
let muted = false;

function ensureContext() {
  if (ctx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureContext();
}

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  return muted;
}

// One enveloped tone. type/freq/duration in seconds; glideTo bends the pitch.
function tone({ freq = 440, glideTo = null, type = 'sine', at = 0, dur = 0.15, gain = 0.16 }) {
  const ac = ensureContext();
  if (!ac || muted) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo !== null) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A correct find: bright two-note chime, E6 then B6.
export function playFind() {
  tone({ freq: 1318.5, type: 'sine', dur: 0.12, gain: 0.18 });
  tone({ freq: 1975.5, type: 'sine', at: 0.07, dur: 0.2, gain: 0.16 });
}

// A wrong click: low square buzz that drops in pitch.
export function playMistake() {
  tone({ freq: 160, glideTo: 90, type: 'square', dur: 0.22, gain: 0.1 });
}

// A hint being spent: soft single blip.
export function playHint() {
  tone({ freq: 880, glideTo: 1174.7, type: 'triangle', dur: 0.16, gain: 0.14 });
}

// Scene complete: quick rising arpeggio C5 E5 G5 C6.
export function playSceneComplete() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone({ freq: f, type: 'triangle', at: i * 0.09, dur: 0.22, gain: 0.16 }),
  );
}

// Campaign won: a small fanfare, two stacked arpeggios.
export function playCampaignWin() {
  [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
    tone({ freq: f, type: 'triangle', at: i * 0.11, dur: 0.3, gain: 0.17 }),
  );
}

// Time running out on a scene: three warning ticks.
export function playTimeWarning() {
  [0, 0.18, 0.36].forEach((at) => tone({ freq: 1046.5, type: 'square', at, dur: 0.07, gain: 0.06 }));
}
