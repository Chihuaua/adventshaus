type Wave = "sine" | "square" | "triangle" | "sawtooth";

interface ToneOpts {
  f: number;
  f2?: number;
  dur?: number;
  type?: Wave;
  gain?: number;
  delay?: number;
  attack?: number;
}

/** Tiny WebAudio synth — all sound effects are generated, no assets. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  ensure() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.3;
        this.master.connect(this.ctx.destination);
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(v: boolean) {
    this.muted = v;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v ? 0 : 0.3, this.ctx.currentTime, 0.02);
    }
  }

  /** Gemeinsamer Audio-Master für längere Spielsequenzen. */
  getSharedAudio() {
    this.ensure();
    if (!this.ctx || !this.master) return null;
    return { ctx: this.ctx, master: this.master };
  }

  private tone({ f, f2, dur = 0.14, type = "square", gain = 0.25, delay = 0, attack = 0.006 }: ToneOpts) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f), t0);
    if (f2 && f2 !== f) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  private noise(dur = 0.14, gain = 0.2, freq = 1400, q = 1, delay = 0) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
  }

  /**
   * Weicher Schritt auf dem Boden. Der Takt kommt vom Aufrufer (jeder
   * Schritt wird dort ausgelöst), daher hier keine Echtzeit-Sperre – die
   * würde bei schnellem Simulationslauf Schritte verschlucken.
   */
  step(pitch = 1) {
    // kurzer Rauschimpuls als Trittfläche …
    this.noise(0.075, 0.19, 300 * pitch, 1.05);
    // … plus ein leiser, weicher Tiefbass als Körper
    this.tone({ f: 108 * pitch, f2: 66 * pitch, dur: 0.075, type: "sine", gain: 0.1 });
  }

  jump() {
    this.tone({ f: 300, f2: 720, dur: 0.14, type: "square", gain: 0.16 });
  }

  land() {
    this.noise(0.07, 0.09, 220, 1.1);
  }

  tick() {
    this.tone({ f: 900, dur: 0.035, type: "square", gain: 0.05 });
  }

  /** station interaction finished */
  complete(combo = 0) {
    const base = 440 * Math.pow(1.0595, Math.min(14, combo));
    this.tone({ f: base, dur: 0.09, type: "triangle", gain: 0.2 });
    this.tone({ f: base * 1.5, dur: 0.11, type: "triangle", gain: 0.16, delay: 0.07 });
    this.tone({ f: base * 2, dur: 0.16, type: "sine", gain: 0.14, delay: 0.14 });
  }

  wish() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => this.tone({ f: n, dur: 0.2, type: "triangle", gain: 0.19, delay: i * 0.07 }));
    this.noise(0.5, 0.06, 3200, 0.7, 0.1);
  }

  coin() {
    this.tone({ f: 1180, dur: 0.06, type: "square", gain: 0.14 });
    this.tone({ f: 1760, dur: 0.16, type: "square", gain: 0.11, delay: 0.06 });
  }

  sparkle() {
    this.noise(0.24, 0.1, 4200, 0.9);
    this.tone({ f: 1500, f2: 2600, dur: 0.18, type: "sine", gain: 0.08 });
  }

  pet() {
    this.tone({ f: 620, f2: 880, dur: 0.12, type: "sine", gain: 0.16 });
    this.tone({ f: 880, f2: 1180, dur: 0.14, type: "sine", gain: 0.1, delay: 0.1 });
  }

  deny() {
    this.tone({ f: 220, f2: 120, dur: 0.2, type: "sawtooth", gain: 0.14 });
  }

  hurt() {
    this.tone({ f: 320, f2: 90, dur: 0.32, type: "sawtooth", gain: 0.16 });
    this.noise(0.24, 0.12, 400, 0.8);
  }

  alarm() {
    this.tone({ f: 740, f2: 520, dur: 0.18, type: "square", gain: 0.1 });
  }

  start() {
    const notes = [392, 523, 659, 880];
    notes.forEach((n, i) => this.tone({ f: n, dur: 0.24, type: "square", gain: 0.14, delay: i * 0.09 }));
  }

  over() {
    const notes = [523, 415, 349, 262, 196];
    notes.forEach((n, i) => this.tone({ f: n, dur: 0.42, type: "triangle", gain: 0.17, delay: i * 0.16 }));
    this.noise(1.1, 0.09, 700, 0.4, 0.1);
  }

  ui() {
    this.tone({ f: 660, dur: 0.05, type: "square", gain: 0.1 });
  }

  pause() {
    this.tone({ f: 480, f2: 240, dur: 0.12, type: "square", gain: 0.11 });
  }
}

export const sfx = new Sfx();
