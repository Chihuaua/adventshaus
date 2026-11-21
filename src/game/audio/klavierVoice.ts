/* =======================================================================
   Klavierklang für das Klavierlied „ssm“.

   Rein prozedural (WebAudio, keine Audiodatei): jeder Ton ist eine
   additive Synthese mit
     - Obertönen, die leicht inharmonisch sind (wie eine echte Saite),
     - zwei gegeneinander verstimmten Saiten (warmer, voller Klang),
     - je Oberton eigener Abklingzeit (hohe Töne klingen schneller aus),
     - kurzem Hammerklick am Anschlag.
   Lautstärke je Anschlag (Velocity) über die Verstärkung des Tons.
   ======================================================================= */

import { KLAVIER_DAUER_MS, KLAVIER_NOTES } from "./klavierNotes";
import { MUSIK_PEGEL } from "./pegel";

/** Abtastrate der Töne (genügt für Klavier, spart Speicher). */
const SAMPLERATE = 22050;
/** Länge eines Tons in Sekunden (Abklingen der tiefen Töne ist darin enthalten). */
const TON_LAENGE_S = 2.8;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Ein Klavierton der MIDI-Tonhöhe `pitch` als Audiopuffer. */
export function klavierTon(ctx: BaseAudioContext, pitch: number): AudioBuffer {
  const n = Math.round(TON_LAENGE_S * SAMPLERATE);
  const buf = ctx.createBuffer(1, n, SAMPLERATE);
  const out = buf.getChannelData(0);

  const f0 = 440 * Math.pow(2, (pitch - 69) / 12);
  // Tiefe Saiten: stärker inharmonisch und länger klingend.
  const tief = clamp01((60 - pitch) / 36);
  const B = 0.0002 + 0.0012 * tief;
  const tau0 = 0.9 + 2.2 * clamp01((100 - pitch) / 80);
  // Ab etwa C3 zwei Saiten, leicht gegeneinander verstimmt.
  // Die zweite Saite ist nur leise und leicht verstimmt: ein feiner Schimmer, kein Wabern.
  const saiten = pitch >= 48
    ? [{ verst: 1, amp: 0.7 }, { verst: 1.001, amp: 0.18 }]
    : [{ verst: 1, amp: 1 }];

  for (const saite of saiten) {
    for (let k = 1; k <= 14; k++) {
      const freq = k * f0 * Math.sqrt(1 + B * k * k) * saite.verst;
      if (freq > 9000) break;
      const amp = saite.amp / Math.pow(k, 1.1);
      const tauK = tau0 / (1 + 0.45 * (k - 1));
      const w = (2 * Math.PI * freq) / SAMPLERATE;
      const cw = Math.cos(w);
      const sw = Math.sin(w);
      const d = Math.exp(-1 / (SAMPLERATE * tauK));
      // Sinus per Drehung fortschreiben (schneller als sin() je Abtastwert).
      let c = 1;
      let s = 0;
      let e = amp;
      for (let i = 0; i < n; i++) {
        out[i] += e * s;
        const c2 = c * cw - s * sw;
        s = s * cw + c * sw;
        c = c2;
        e *= d;
      }
    }
  }

  // Hammerklick: kurzes, gefiltertes Rauschen am Anschlag.
  let seed = ((pitch + 1) * 2654435761) >>> 0 || 1;
  let lp = 0;
  let h = 1;
  const hd = Math.exp(-1 / (SAMPLERATE * 0.0025));
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const r = seed / 2147483648 - 1;
    lp += 0.35 * (r - lp);
    out[i] += 0.22 * h * lp;
    h *= hd;
  }

  // Weicher Anschlag und sauberes Ende ohne Knacken.
  const anschlag = Math.round(0.002 * SAMPLERATE);
  for (let i = 0; i < anschlag && i < n; i++) out[i] *= i / anschlag;
  const aus = Math.round(0.08 * SAMPLERATE);
  for (let i = 0; i < aus; i++) out[n - 1 - i] *= i / aus;

  // Jeder Ton auf dieselbe Spitzenlautstärke; die Anschlagstärke kommt später dazu.
  let spitze = 0;
  for (let i = 0; i < n; i++) spitze = Math.max(spitze, Math.abs(out[i]));
  if (spitze > 0) for (let i = 0; i < n; i++) out[i] *= 0.6 / spitze;
  return buf;
}

/** Lautstärke eines Anschlags (Velocity 0–127), sanft gekrümmt. */
export function klavierAnschlagGain(velocity: number): number {
  return 0.25 + 0.75 * Math.pow(clamp01(velocity / 127), 1.3);
}

/**
 * Abspielen des Liedes an einem AudioContext. Die Töne werden vorab erzeugt
 * und dann im Takt der Noten eingeplant. Pausieren und Weiterspielen sind
 * über die Musikzeit möglich.
 */
export class KlavierMusik {
  private readonly output: GainNode;
  private readonly puffer = new Map<number, AudioBuffer>();
  private aktiv = new Set<AudioBufferSourceNode>();
  private anker = 0;
  private laeuftJetzt = false;
  private position = 0;
  private disposed = false;
  private fertig = false;
  public readonly dauer = KLAVIER_DAUER_MS / 1000;

  constructor(private readonly ctx: AudioContext, master: AudioNode) {
    this.output = ctx.createGain();
    this.output.gain.value = MUSIK_PEGEL.klavier;
    this.output.connect(master);
  }

  /** true, sobald alle Töne des Liedes vorbereitet sind. */
  get bereit(): boolean {
    return this.fertig;
  }

  get laeuft(): boolean {
    return this.laeuftJetzt;
  }

  /**
   * Lautstärke in `sekunden` auf `ziel` fahren (0..1). Der Klang klingt damit
   * langsam aus, statt mit dem letzten Ton abzuschneiden.
   */
  blendeAuf(ziel: number, sekunden: number): void {
    const g = this.output.gain;
    const jetzt = this.ctx.currentTime;
    g.cancelScheduledValues(jetzt);
    g.setValueAtTime(g.value, jetzt);
    g.linearRampToValueAtTime(MUSIK_PEGEL.klavier * Math.max(0, Math.min(1, ziel)), jetzt + Math.max(0.01, sekunden));
  }

  /** Aktuelle Musikzeit in Sekunden (0 bis Liedlänge). */
  get currentTime(): number {
    if (!this.laeuftJetzt) return this.position;
    return Math.min(this.dauer, Math.max(0, this.ctx.currentTime - this.anker));
  }

  /** Erzeugt alle benötigten Töne; zwischen den Tönen gibt es eine Pause, damit der Rahmen weiterläuft. */
  async prepare(): Promise<void> {
    const tonhoehen = [...new Set(KLAVIER_NOTES.map((n) => n[2]))];
    for (const p of tonhoehen) {
      if (this.disposed) throw new Error("Klavier freigegeben");
      if (!this.puffer.has(p)) this.puffer.set(p, klavierTon(this.ctx, p));
      await new Promise((r) => setTimeout(r, 0));
    }
    this.fertig = true;
  }

  /** Spielt das Lied von `offset` Sekunden an, beginnend jetzt. */
  start(offset = 0): void {
    if (this.disposed || !this.fertig) return;
    this.stop();
    const start = Math.min(Math.max(0, offset), this.dauer);
    this.anker = this.ctx.currentTime + 0.05 - start;
    this.output.gain.cancelScheduledValues(this.ctx.currentTime);
    this.output.gain.setValueAtTime(MUSIK_PEGEL.klavier, this.ctx.currentTime);
    for (const [startMs, , pitch, vel] of KLAVIER_NOTES) {
      const t = startMs / 1000;
      if (t < start - 0.001) continue;
      const buf = this.puffer.get(pitch);
      if (!buf) continue;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = klavierAnschlagGain(vel);
      src.connect(g);
      g.connect(this.output);
      src.start(this.anker + t);
      this.aktiv.add(src);
      src.onended = () => this.aktiv.delete(src);
    }
    this.laeuftJetzt = true;
    this.position = start;
  }

  /** Hält an und gibt die Musikzeit zurück, von der aus später weitergespielt werden kann. */
  pause(): number {
    const t = this.currentTime;
    this.stop();
    this.position = t;
    return t;
  }

  stop(): void {
    for (const src of this.aktiv) {
      try {
        src.stop();
      } catch {
        // schon beendet
      }
      src.disconnect();
    }
    this.aktiv.clear();
    this.laeuftJetzt = false;
  }

  dispose(): void {
    this.stop();
    this.disposed = true;
    this.output.disconnect();
    this.puffer.clear();
  }
}

/** Wo die Hände zur Musikzeit `tMs` liegen: X der tiefsten und höchsten gerade klingenden Taste. */
export interface KlavierHaende {
  /** Linke Hand (tiefster Ton), X in Bühnenkoordinaten, null = kein Ton. */
  links: number | null;
  /** Rechte Hand (höchster Ton), X in Bühnenkoordinaten, null = kein Ton. */
  rechts: number | null;
  /** 0..1: wie stark die Taste gerade angeschlagen ist (1 = eben angeschlagen). */
  pressL: number;
  pressR: number;
}

/** Taste zu Bühnen-X: die Tonhöhen 24–84 liegen über die sichtbare Klaviatur verteilt. */
function tasteX(pitch: number): number {
  const p = Math.min(84, Math.max(24, pitch));
  return 556 + ((p - 24) / 60) * 22;
}

export function klavierHaendeAt(tMs: number): KlavierHaende {
  let tief: [number, number, number] | null = null; // [start, pitch, ...]
  let hoch: [number, number, number] | null = null;
  for (const [startMs, dauerMs, pitch] of KLAVIER_NOTES) {
    if (startMs > tMs) break;
    if (tMs >= startMs + dauerMs) continue;
    if (!tief || pitch < tief[1]) tief = [startMs, pitch, dauerMs];
    if (!hoch || pitch > hoch[1]) hoch = [startMs, pitch, dauerMs];
  }
  const press = (start: number) => Math.exp(-(tMs - start) / 150);
  return {
    links: tief ? tasteX(tief[1]) : null,
    rechts: hoch ? tasteX(hoch[1]) : null,
    pressL: tief ? press(tief[0]) : 0,
    pressR: hoch ? press(hoch[0]) : 0,
  };
}
