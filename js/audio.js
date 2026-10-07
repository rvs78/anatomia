/* Cor en Joc — sons sintetitzats amb Web Audio (sense fitxers) */
window.CJ = window.CJ || {};

CJ.audio = (function () {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!enabled) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }

  function tone(freq, dur, type, gain, when, slideTo) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  /* S1 («lub»): més greu i llarg. S2 («dub»): més agut i curt. */
  function lub(when) { tone(62, 0.16, 'sine', 0.55, when, 40); tone(110, 0.08, 'triangle', 0.12, when); }
  function dub(when) { tone(88, 0.11, 'sine', 0.45, when, 60); tone(150, 0.06, 'triangle', 0.1, when); }

  return {
    get enabled() { return enabled; },
    setEnabled(v) { enabled = !!v; },
    ok() { tone(660, 0.12, 'sine', 0.15); tone(990, 0.18, 'sine', 0.12, 0.09); },
    ko() { tone(220, 0.25, 'sawtooth', 0.08, 0, 140); },
    pop() { tone(520, 0.07, 'triangle', 0.1); },
    lub, dub,
    beat() { lub(0); dub(0.28); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.13, i * 0.11)); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.18)); }
  };
})();
