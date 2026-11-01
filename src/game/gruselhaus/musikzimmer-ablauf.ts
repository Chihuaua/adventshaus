import { sfx } from "../audio";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const k = clamp(v);
  return k * k * (3 - 2 * k);
};

export const KLAVIER_ZEITEN = {
  vorlauf: 2,
  musikVorlauf: 1,
  einblenden: 4,
  ausblenden: 4,
  ruheMin: 480,
  ruheMax: 1200,
} as const;

// Eigene Phrase, keine Vorlage: Zeit, MIDI-Ton, Hand, Anschlag.
export const KLAVIER_NOTEN: readonly (readonly [
  number,
  number,
  0 | 1,
  number,
])[] = [
  [0, 50, 0, 0.52],
  [0.12, 69, 1, 0.65],
  [1.15, 65, 1, 0.48],
  [2.35, 62, 1, 0.5],
  [3.4, 45, 0, 0.45],
  [3.6, 64, 1, 0.52],
  [4.9, 66, 1, 0.37],
  [6.1, 58, 0, 0.4],
  [6.35, 67, 1, 0.54],
  [7.55, 65, 1, 0.46],
  [8.8, 48, 0, 0.48],
  [9.05, 64, 1, 0.55],
  [10.3, 61, 1, 0.38],
  [11.65, 46, 0, 0.44],
  [11.85, 62, 1, 0.55],
  [13.15, 69, 1, 0.43],
  [14.5, 45, 0, 0.4],
  [14.7, 68, 1, 0.35],
  [15.9, 62, 1, 0.46],
  [17.0, 57, 0, 0.3],
];
export const KLAVIER_PHRASE = 18.6;

/** Dieselben Noten treiben Finger und Tasten; keine zweite Animationsuhr. */
export function klavierHaende(time: number) {
  const t = ((time % KLAVIER_PHRASE) + KLAVIER_PHRASE) % KLAVIER_PHRASE;
  return ([0, 1] as const).map((hand) => {
    const notes = KLAVIER_NOTEN.filter((n) => n[2] === hand);
    let previous = notes[notes.length - 1];
    let next = notes[0];
    let at = previous[0] - KLAVIER_PHRASE;
    let nextAt = next[0];
    for (let i = 0; i < notes.length; i++) {
      if (notes[i][0] <= t) {
        previous = notes[i];
        at = previous[0];
        next = notes[(i + 1) % notes.length];
        nextAt = next[0] + (i === notes.length - 1 ? KLAVIER_PHRASE : 0);
      }
    }
    const travel = smooth((t - (nextAt - 0.42)) / 0.42);
    const midi = previous[1] + (next[1] - previous[1]) * travel;
    return {
      x: (hand === 0 ? -13 : 13) + (midi - (hand === 0 ? 50 : 65)) * 0.4,
      press: Math.exp(-Math.max(0, t - at) * 8),
      midi: previous[1],
    };
  });
}

type AudioShared = NonNullable<ReturnType<typeof sfx.getSharedAudio>>;
type Stimme = { oscillators: OscillatorNode[]; nodes: AudioNode[] };

/** Kleiner Klavier-Synth am vorhandenen Audio-Master, ohne eigenen Context. */
class KlavierKlang {
  readonly output: GainNode;
  private voices = new Set<Stimme>();
  private anchor = 0;
  private cursor = 0;
  private end = Infinity;
  private running = false;
  private saved: { offset: number; remaining: number } | null = null;

  constructor(readonly shared: AudioShared) {
    this.output = shared.ctx.createGain();
    this.output.connect(shared.master);
  }

  start(
    lead = 0,
    duration = Infinity,
    offset = 0,
    at = this.shared.ctx.currentTime,
  ) {
    this.stop();
    this.anchor = at + lead - offset;
    this.end = at + lead + duration;
    this.cursor = Math.max(
      0,
      Math.floor(offset / KLAVIER_PHRASE) * KLAVIER_NOTEN.length,
    );
    this.running = true;
    this.output.gain.cancelScheduledValues(this.shared.ctx.currentTime);
    this.output.gain.setValueAtTime(0.7, this.shared.ctx.currentTime);
    this.schedule();
  }

  finishAfter(seconds: number, at = this.shared.ctx.currentTime) {
    this.end = Math.min(this.end, at + seconds);
    this.schedule();
  }

  schedule() {
    if (!this.running) return;
    const ctx = this.shared.ctx;
    const now = ctx.currentTime;
    if (now >= this.end) {
      this.stop();
      return;
    }
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(0.7, now);
    if (Number.isFinite(this.end)) {
      this.output.gain.setValueAtTime(0.7, Math.max(now, this.end - 0.035));
      this.output.gain.linearRampToValueAtTime(0, this.end);
    }
    while (true) {
      const n = KLAVIER_NOTEN[this.cursor % KLAVIER_NOTEN.length];
      const when =
        this.anchor +
        Math.floor(this.cursor / KLAVIER_NOTEN.length) * KLAVIER_PHRASE +
        n[0];
      if (when > now + 1.25 || when >= this.end) break;
      this.cursor++;
      const until = Math.min(when + 2.4, this.end);
      if (when < now - 0.06 || until <= now + 0.01) continue;
      const start = Math.max(now, when);
      const voice: Stimme = { oscillators: [], nodes: [] };
      for (const [harmonic, volume, decay] of [
        [1, 1, 2.4],
        [2.003, 0.3, 1.2],
        [3.012, 0.12, 0.65],
        [4.025, 0.045, 0.3],
      ]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const stop = Math.min(until, start + decay);
        osc.type = "sine";
        osc.frequency.value = 440 * 2 ** ((n[1] - 69) / 12) * harmonic;
        gain.gain.setValueAtTime(0.00001, start);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.00002, n[3] * volume * 0.19),
          start + 0.006,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.00001,
          Math.max(start + 0.012, stop),
        );
        osc.connect(gain);
        gain.connect(this.output);
        voice.oscillators.push(osc);
        voice.nodes.push(osc, gain);
        osc.start(start);
        osc.stop(Math.max(start + 0.015, stop));
      }
      this.voices.add(voice);
      voice.oscillators[0].onended = () => {
        for (const node of voice.nodes) node.disconnect();
        this.voices.delete(voice);
      };
    }
  }

  pause() {
    if (!this.running) return;
    const now = this.shared.ctx.currentTime;
    this.saved = { offset: now - this.anchor, remaining: this.end - now };
    this.stop();
  }

  resume() {
    const saved = this.saved;
    this.saved = null;
    if (saved)
      this.start(
        Math.max(0, -saved.offset),
        saved.remaining - Math.max(0, -saved.offset),
        Math.max(0, saved.offset),
      );
  }

  stop() {
    this.running = false;
    this.output.gain.cancelScheduledValues(this.shared.ctx.currentTime);
    this.output.gain.setValueAtTime(0, this.shared.ctx.currentTime);
    for (const voice of this.voices) {
      for (const osc of voice.oscillators) {
        osc.onended = null;
        try {
          osc.stop();
        } catch {
          /* bereits beendet */
        }
      }
      for (const node of voice.nodes) node.disconnect();
    }
    this.voices.clear();
  }

  destroy() {
    this.saved = null;
    this.stop();
    this.output.disconnect();
  }
}

type Erscheinung = { start: number; fade: number; end: number; from: number };

/** Eine Instanz pro Gruselhaus. Der Geist bleibt am Sitz, nur Alpha wechselt. */
export class MusikzimmerAblauf {
  private time = 0;
  private next: number;
  private apparition: Erscheinung | null = null;
  private luniAt: number | null = null;
  private sound: KlavierKlang | null = null;
  private audioLast: number | null = null;
  private paused = false;

  constructor(private readonly random: () => number = Math.random) {
    this.next = this.wait();
  }

  private wait() {
    return (
      KLAVIER_ZEITEN.ruheMin +
      this.random() * (KLAVIER_ZEITEN.ruheMax - KLAVIER_ZEITEN.ruheMin)
    );
  }

  unlock() {
    if (this.sound) return;
    const shared = sfx.getSharedAudio();
    if (shared) {
      this.sound = new KlavierKlang(shared);
      this.audioLast = shared.ctx.currentTime;
    }
  }

  get alpha() {
    const a = this.apparition;
    if (!a) return 0;
    if (this.time >= a.fade)
      return (
        0.95 *
        a.from *
        (1 - smooth((this.time - a.fade) / KLAVIER_ZEITEN.ausblenden))
      );
    return (
      0.95 *
      smooth(
        (this.time - a.start - KLAVIER_ZEITEN.vorlauf) /
          KLAVIER_ZEITEN.einblenden,
      )
    );
  }

  get age() {
    return this.apparition ? this.time - this.apparition.start : -1;
  }
  get ghostMusic() {
    return (
      !!this.apparition &&
      this.age >= KLAVIER_ZEITEN.musikVorlauf &&
      this.time < this.apparition.end
    );
  }
  get occupied() {
    return this.alpha > 0;
  }
  get active() {
    return this.apparition !== null;
  }
  get luniPlaying() {
    return this.luniAt !== null;
  }
  get musicTime() {
    return this.luniAt !== null
      ? this.time - this.luniAt
      : Math.max(0, this.age - 1);
  }

  /** Live folgt der Ablauf der Audio-Uhr; step(dt) bleibt deterministisch testbar. */
  update(dt: number, otherMusic: boolean, live = false): boolean {
    if (this.paused) return false;
    if (live && !this.sound) {
      const shared = sfx.peekSharedAudio();
      if (shared?.ctx.state === "running") {
        this.sound = new KlavierKlang(shared);
        this.audioLast = shared.ctx.currentTime;
      }
    }
    if (live && this.sound) {
      const now = this.sound.shared.ctx.currentTime;
      dt = this.audioLast === null ? 0 : Math.max(0, now - this.audioLast);
      this.audioLast = now;
    }
    this.time += Math.max(0, dt);
    if (this.apparition && this.time >= this.apparition.end) {
      this.sound?.stop();
      this.apparition = null;
      this.next = this.time + this.wait();
    }
    if (this.apparition && otherMusic) this.otherMusicRequested();
    let started = false;
    const ready = !live || this.sound?.shared.ctx.state === "running";
    if (!this.apparition && this.time >= this.next && !otherMusic && ready) {
      const fade = this.time + 2 + 4 + 20 + this.random() * 10;
      this.apparition = { start: this.time, fade, end: fade + 4, from: 1 };
      this.luniAt = null;
      this.sound?.start(
        1,
        fade + 4 - this.time - 1,
        0,
        live ? this.audioLast! : undefined,
      );
      started = true;
    }
    this.sound?.schedule();
    return started;
  }

  /** Ein neuer Klavierwunsch ist bei Alpha 0 erlaubt, auch im stillen Vorlauf. */
  requestPiano() {
    if (this.occupied) return false;
    if (this.apparition) {
      this.apparition = null;
      this.sound?.stop();
      this.next = this.time + this.wait();
    }
    return true;
  }

  startLuni() {
    if (!this.requestPiano()) return false;
    if (this.luniAt !== null) return true;
    this.luniAt = this.time;
    this.sound?.start();
    return true;
  }

  stopLuni() {
    if (this.luniAt === null) return;
    this.luniAt = null;
    this.sound?.stop();
  }

  otherMusicRequested() {
    const a = this.apparition;
    if (!a || this.time >= a.fade) return;
    const alpha = this.alpha;
    if (alpha === 0) {
      this.requestPiano();
      return;
    }
    a.from = alpha / 0.95;
    a.fade = this.time;
    a.end = this.time + KLAVIER_ZEITEN.ausblenden;
    this.sound?.finishAfter(
      KLAVIER_ZEITEN.ausblenden,
      this.audioLast ?? undefined,
    );
  }

  setPaused(value: boolean) {
    if (value === this.paused) return;
    this.paused = value;
    if (value) {
      this.sound?.pause();
      this.audioLast = null;
    } else {
      this.sound?.resume();
      this.audioLast = this.sound?.shared.ctx.currentTime ?? null;
    }
  }

  getState() {
    const a = this.apparition;
    return {
      time: this.time,
      next: this.next,
      alpha: this.alpha,
      phase: !a
        ? "ruhe"
        : this.age < 1
          ? "vorwarnung"
          : this.age < 2
            ? "musik"
            : this.time >= a.fade
              ? "ausblenden"
              : this.age < 6
                ? "einblenden"
                : "sichtbar",
      start: a?.start ?? null,
      musicStart: a ? a.start + 1 : null,
      fadeInStart: a ? a.start + 2 : null,
      end: a?.end ?? null,
      ghostMusic: this.ghostMusic,
      luniPlaying: this.luniPlaying,
      paused: this.paused,
    };
  }

  destroy() {
    this.sound?.destroy();
    this.sound = null;
    this.apparition = null;
    this.luniAt = null;
  }
}
