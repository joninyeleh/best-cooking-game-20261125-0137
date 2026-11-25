// audio.js — every sound in Sizzle & Serve is synthesized live with WebAudio.
// No audio files are shipped: the sizzle, chops, dings and the little
// kitchen tune are all built from oscillators and filtered noise.

const SoundEngine = {
  ctx: null,
  muted: false,
  musicTimer: null,
  musicStep: 0,

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  tone(freq, dur, type, vol, when) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  noise(dur, vol, filterFreq) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 3000;
    const gain = this.ctx.createGain();
    gain.gain.value = vol || 0.15;
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  },

  pickup() { this.tone(520, 0.07, 'triangle', 0.08); },
  drop() { this.tone(340, 0.08, 'triangle', 0.08); },
  chop() { this.noise(0.09, 0.25, 1800); this.tone(180, 0.06, 'square', 0.06); },
  sizzle() { this.noise(0.5, 0.10, 5200); },
  ready() { this.tone(880, 0.12, 'sine', 0.12); this.tone(1318, 0.16, 'sine', 0.10, 0.09); },
  serve() { this.tone(659, 0.10, 'sine', 0.12); this.tone(880, 0.10, 'sine', 0.12, 0.08); this.tone(1046, 0.18, 'sine', 0.12, 0.16); },
  coin() { this.tone(1567, 0.09, 'square', 0.05); this.tone(2093, 0.14, 'square', 0.05, 0.07); },
  error() { this.tone(160, 0.18, 'sawtooth', 0.09); },
  burnt() { this.noise(0.25, 0.18, 900); this.tone(110, 0.3, 'sawtooth', 0.08); },
  tick() { this.tone(980, 0.05, 'sine', 0.07); },
  start() {
    this.tone(523, 0.12, 'triangle', 0.12);
    this.tone(659, 0.12, 'triangle', 0.12, 0.1);
    this.tone(784, 0.2, 'triangle', 0.12, 0.2);
  },
  gameOver() {
    this.tone(392, 0.2, 'triangle', 0.12);
    this.tone(330, 0.2, 'triangle', 0.12, 0.18);
    this.tone(262, 0.35, 'triangle', 0.12, 0.36);
  },

  // A cheerful 8-step loop: soft bass notes with a plucked melody on top.
  // Quiet by design; the mute button stops it outright.
  startMusic() {
    if (this.musicTimer || !this.ensure()) return;
    const bass = [130.8, 0, 98, 0, 110, 0, 146.8, 0];
    const melody = [523.25, 587.33, 659.25, 0, 587.33, 523.25, 440, 0];
    this.musicTimer = setInterval(() => {
      if (this.muted) return;
      const i = this.musicStep % 8;
      if (bass[i]) this.tone(bass[i], 0.22, 'triangle', 0.05);
      if (melody[i]) this.tone(melody[i], 0.16, 'sine', 0.045);
      this.musicStep += 1;
    }, 240);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  },
};
