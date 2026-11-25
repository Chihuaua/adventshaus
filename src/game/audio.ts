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
        this.master.gain.value = this.muted ? 0 : 0.3;
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
    return this.peekSharedAudio();
  }

  /** Vorhandene Freigabe nutzen, ohne Audio ausserhalb einer Nutzergeste zu starten. */
  peekSharedAudio() {
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
   * Hörbarer Schritt auf dem Boden. `barfuss = true` erzeugt ein leiseres,
   * weiches Haut-Tappen auf dem Boden (hörbar, nie lautlos); bekleidet klingt
   * ein warmer, deutlicher Tritt auf den Dielen/Fliesen.
   */
  step(pitch = 1, barfuss = false) {
    if (barfuss) {
      this.noise(0.045, 0.24, 980 * pitch, 0.95);
      this.tone({ f: 205 * pitch, f2: 110 * pitch, dur: 0.052, type: "triangle", gain: 0.13, attack: 0.005 });
      return;
    }
    this.noise(0.055, 0.38, 760 * pitch, 0.85);
    this.tone({ f: 260 * pitch, f2: 125 * pitch, dur: 0.068, type: "triangle", gain: 0.24, attack: 0.004 });
  }

  /**
   * Ein einzelner synthetischer Ton als Baustein für Klangrezepte
   * (z. B. die Gegenstände im Teleflauschi). Keine Audiodatei.
   */
  ton(f: number, dauer: number, form: Wave = "sine", pegel = 0.1, wann = 0, f2?: number) {
    this.tone({ f, f2, dur: dauer, type: form, gain: pegel, delay: wann });
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

  /** Sargdeckel geht auf: tiefes, kurzes Holzknarzen. */
  knarzen() {
    this.tone({ f: 92, f2: 61, dur: 0.55, type: "sawtooth", gain: 0.05, attack: 0.04 });
    this.tone({ f: 141, f2: 98, dur: 0.42, type: "triangle", gain: 0.04, delay: 0.12, attack: 0.05 });
    this.noise(0.5, 0.05, 420, 2.2, 0.03);
  }

  /** Sargdeckel fällt zu: dumpfes Holz. */
  holzDumpf() {
    this.tone({ f: 74, f2: 41, dur: 0.32, type: "sine", gain: 0.22 });
    this.noise(0.16, 0.12, 260, 0.9);
  }

  /** Sanftes, freundliches Hundebellen (Odin heller, Apollo etwas tiefer). */
  wuff(tief = false) {
    const f0 = tief ? 175 : 245;
    const f1 = tief ? 105 : 150;
    this.tone({ f: f0, f2: f1, dur: 0.14, type: "triangle", gain: 0.08, attack: 0.01 });
    this.noise(0.08, 0.035, tief ? 420 : 620, 1.8);
  }

  ui() {
    this.tone({ f: 660, dur: 0.05, type: "square", gain: 0.1 });
  }

  zahnpflege(art: "putzen" | "gurgeln" | "spucken", rueckstrich = false) {
    if (art === "putzen") this.noise(.105, .14, rueckstrich ? 2380 : 3300, .85);
    else if (art === "gurgeln") {
      this.tone({ f: 143, f2: 98, dur: .16, gain: .15, type: "triangle", attack: .025 });
      this.noise(.12, .13, 510, 2.3);
      this.tone({ f: 308, f2: 435, dur: .08, gain: .08, type: "sine", delay: .055 });
    } else {
      this.noise(.085, .22, 1580, .9); this.noise(.13, .16, 2750, 1.2, .11);
      this.tone({ f: 470, f2: 190, dur: .07, gain: .09, delay: .12, type: "sine" });
    }
  }

  /** Türklingel: klassisches zweitöniges Ding-Dong (E5, dann C5, mit Oberton). */
  dingDong() {
    this.tone({ f: 659, dur: 1.3, type: "sine", gain: 0.2, attack: 0.004 });
    this.tone({ f: 1318, dur: 0.55, type: "sine", gain: 0.045, attack: 0.004 });
    this.tone({ f: 523, dur: 1.7, type: "sine", gain: 0.2, attack: 0.004, delay: 0.6 });
    this.tone({ f: 1046, dur: 0.6, type: "sine", gain: 0.045, attack: 0.004, delay: 0.6 });
  }

  /** Ein Klopfen an der Holztür (Fingerknöchel). */
  klopfen() {
    this.tone({ f: 190, f2: 120, dur: 0.09, type: "sine", gain: 0.24, attack: 0.002 });
    this.noise(0.05, 0.12, 900, 1.4);
  }

  /** Knie stößt an den Glastisch: dumpfer Stoß und kurzes Glasklirren. */
  glasStoss() {
    this.tone({ f: 140, f2: 80, dur: 0.14, type: "sine", gain: 0.16 });
    this.tone({ f: 2350, dur: 0.22, type: "sine", gain: 0.035, delay: 0.02 });
    this.tone({ f: 3120, dur: 0.16, type: "sine", gain: 0.02, delay: 0.03 });
  }

  /** Autotür fällt ins Schloss: dumpfer Schlag mit kurzem Blechklang. */
  autotuer() {
    this.tone({ f: 118, f2: 64, dur: 0.2, type: "sine", gain: 0.2 });
    this.noise(0.09, 0.09, 520, 1.1);
  }

  /** Schiebetür des Postwagens: Rollgeräusch und Einrasten am Ende. */
  schiebetuer(auf = true) {
    this.noise(0.62, 0.05, auf ? 760 : 640, 1.6);
    this.tone({ f: 96, f2: 58, dur: 0.18, type: "sine", gain: 0.16, delay: 0.58 });
    this.noise(0.07, 0.09, 320, 1, 0.58);
  }

  private motorKnoten: { osc: OscillatorNode; osc2: OscillatorNode; g: GainNode } | null = null;

  /** Motor des Postwagens als leises, tiefes Brummen (an/aus). */
  motor(an: boolean) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const jetzt = ctx.currentTime;
    if (an && !this.motorKnoten) {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 46;
      osc2.type = "square";
      osc2.frequency.value = 92.5;
      filter.type = "lowpass";
      filter.frequency.value = 260;
      g.gain.setValueAtTime(0.0001, jetzt);
      g.gain.exponentialRampToValueAtTime(0.05, jetzt + 0.4);
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(g);
      g.connect(master);
      osc.start(jetzt);
      osc2.start(jetzt);
      this.motorKnoten = { osc, osc2, g };
    } else if (!an && this.motorKnoten) {
      const { osc, osc2, g } = this.motorKnoten;
      g.gain.setTargetAtTime(0.0001, jetzt, 0.15);
      osc.stop(jetzt + 0.8);
      osc2.stop(jetzt + 0.8);
      this.motorKnoten = null;
    }
  }

  pause() {
    this.tone({ f: 480, f2: 240, dur: 0.12, type: "square", gain: 0.11 });
  }
}

export const sfx = new Sfx();
