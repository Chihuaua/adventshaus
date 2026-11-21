/* =======================================================================
   Saubere MIDI-Wiedergabe von „Frosch am Strand“ (frosch am strand.mid)

   Spielt die 53 Noten aus FROSCH_NOTES exakt in Tonhöhe und Dauer rein
   prozedural über WebAudio (warmer, sauberer Klang ohne Verstimmung oder
   Aliasing). Jede (Tonhöhe, Dauer)-Kombination wird exakt für ihre echte
   MIDI-Dauer gerendert, sodass keine Note abgeschnitten oder verschmiert wird.

   `froschMundOffen(zeit)` liefert die Mundöffnung (0..1) passend zu jeder
   einzelnen Note – zwischen den Noten und in Pausen schließt sich der Mund,
   damit er sich zur Musik bewegt und nie dauerhaft offen steht.
   ======================================================================= */

import {
  FROSCH_DURATION_SECONDS,
  FROSCH_NOTES,
  FROSCH_TICKS_PER_SECOND,
} from "./froschNotes";

/** Notenfenster in Sekunden direkt aus der MIDI-Referenz. */
const NOTEN: readonly { t: number; dur: number; ende: number; pitch: number }[] = FROSCH_NOTES.map(
  ([tick, durTicks, pitch]) => {
    const t = tick / FROSCH_TICKS_PER_SECOND;
    const dur = durTicks / FROSCH_TICKS_PER_SECOND;
    return { t, dur, ende: t + dur, pitch };
  },
);

/**
 * Mundöffnung (0..1) passend zur MIDI-Melodie:
 * - öffnet am Beginn jeder Note,
 * - schließt vor dem Übergang zur nächsten Note (auch bei nahtlosen MIDI-Noten),
 * - bleibt in Pausen sowie vor/nach dem Lied bei 0 (geschlossen),
 * - bewegt sich auf langen Tönen sanft mit, statt starr offen zu stehen.
 */
export function froschMundOffen(time: number): number {
  if (time < 0 || time >= FROSCH_DURATION_SECONDS || NOTEN.length === 0) return 0;
  let lo = 0;
  let hi = NOTEN.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (NOTEN[mid].t <= time) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (idx < 0) return 0;
  const n = NOTEN[idx];
  if (time >= n.ende) return 0;

  const u = time - n.t;
  // Kurze Schließphase am Ende jeder Note, damit der Mund bei jeder neuen
  // Note sichtbar neu ansetzt und nie dauerhaft offen bleibt.
  const schliessPause = Math.min(0.08, n.dur * 0.28);
  const aktiv = n.dur - schliessPause;
  if (aktiv <= 0.02 || u >= aktiv) return 0;

  const auf = Math.min(0.045, aktiv * 0.28);
  const zu = Math.min(0.085, aktiv * 0.36);
  let env = 1;
  if (u < auf) {
    const k = u / auf;
    env = k * k * (3 - 2 * k);
  } else if (u > aktiv - zu) {
    const k = Math.max(0, (aktiv - u) / zu);
    env = k * k * (3 - 2 * k);
  }

  // Bei langen Tönen leichtes Mitschwingen statt starrer Öffnung
  const atem = n.dur > 0.55 ? 0.68 + 0.32 * Math.cos((u - auf) * Math.PI * 3.0) : 1;
  // Höhere Töne öffnen den Mund etwas weiter als tiefe
  const lage = 0.78 + 0.22 * Math.max(0, Math.min(1, (n.pitch - 45) / 19));
  return Math.max(0, Math.min(1, env * atem * lage));
}

function midiHz(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

/** Saubere, warme Oberton-Anteile (1f..5f): klar auf kleinen Lautsprechern, kein Kratzen. */
const OBERTON_GEWICHTE: readonly number[] = [1.0, 0.42, 0.18, 0.08, 0.03];

/**
 * Rendert genau eine saubere MIDI-Note in exakter Tonhöhe und Dauer.
 * Korrekte harmonische Synthese (k * phase, kein Aliasing, keine Verstimmung)
 * mit weichem Ein- und Ausblenden für klare Artikulation zwischen Folgenoten.
 */
export function renderSilbe(
  ctx: BaseAudioContext,
  pitch: number,
  _silbe: number,
  durTicks: number,
): AudioBuffer {
  const sr = ctx.sampleRate;
  const f = midiHz(pitch);
  const dur = Math.max(0.04, durTicks / FROSCH_TICKS_PER_SECOND);
  const count = Math.max(1, Math.ceil(dur * sr));
  const buf = ctx.createBuffer(1, count, sr);
  const out = buf.getChannelData(0);

  // Nur Obertöne unterhalb der Nyquist-Grenze berücksichtigen
  const gewichte: number[] = [];
  let summe = 0;
  for (let k = 1; k <= OBERTON_GEWICHTE.length; k++) {
    if (k * f >= sr * 0.44) break;
    gewichte.push(OBERTON_GEWICHTE[k - 1]);
    summe += OBERTON_GEWICHTE[k - 1];
  }
  const norm = 0.62 / Math.max(0.1, summe);

  // Kurze Trennung am Ende der Note, damit gleiche Töne hintereinander klar klingen
  const trenn = Math.min(0.012, dur * 0.08);
  const klangEnde = Math.max(0.025, dur - trenn);
  const att = Math.min(0.018, klangEnde * 0.25);
  const rel = Math.min(0.035, klangEnde * 0.35);
  const w = (2 * Math.PI * f) / sr;

  for (let i = 0; i < count; i++) {
    const t = i / sr;
    if (t >= klangEnde) {
      out[i] = 0;
      continue;
    }
    let env = 1;
    if (t < att) {
      const k = t / att;
      env = k * k * (3 - 2 * k);
    } else if (t > klangEnde - rel) {
      const k = (klangEnde - t) / rel;
      env = k * k * (3 - 2 * k);
    }
    // Sanfter natürlicher Abfall auf langen Tönen, ohne je abzubrechen
    const halt = 0.78 + 0.22 * Math.exp(-t * 1.1);
    const ph = w * i;
    let ton = 0;
    for (let k = 0; k < gewichte.length; k++) {
      ton += gewichte[k] * Math.sin((k + 1) * ph);
    }
    out[i] = ton * norm * env * halt;
  }
  return buf;
}

type Voice = { source: AudioBufferSourceNode; nodes: AudioNode[] };

import { MUSIK_PEGEL } from "./pegel";

/** Saubere MIDI-Wiedergabe von „Frosch am Strand“ am gemeinsamen Audio-Master. */
export class FroschMusic {
  private readonly output: GainNode;
  private cache = new Map<string, AudioBuffer>();
  private preparation: Promise<void> | null = null;
  private active = new Set<Voice>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private anchor = 0;
  private cursor = 0;
  private playing = false;
  private position = 0;
  private disposed = false;
  public readonly duration = FROSCH_DURATION_SECONDS;

  constructor(private readonly ctx: AudioContext, master: AudioNode) {
    this.output = ctx.createGain();
    this.output.gain.value = MUSIK_PEGEL.gesang;
    this.output.connect(master);
  }

  public get isReady(): boolean {
    return this.cache.size > 0;
  }

  public prepare(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("FroschMusic bereits freigegeben"));
    if (this.preparation) return this.preparation;
    this.preparation = (async () => {
      let count = 0;
      for (let i = 0; i < FROSCH_NOTES.length; i++) {
        if (this.disposed) throw new Error("Vorbereitung abgebrochen");
        const [, durTicks, pitch] = FROSCH_NOTES[i];
        // Nach Tonhöhe UND exakter Dauer cachen, damit keine Note verkürzt oder überdehnt wird.
        const key = `${pitch}:${durTicks}`;
        if (!this.cache.has(key)) {
          this.cache.set(key, renderSilbe(this.ctx, pitch, i, durTicks));
        }
        count++;
        if (count % 8 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    })().catch((err) => {
      this.preparation = null;
      throw err;
    });
    return this.preparation;
  }

  public playAt(audioTime: number, offsetSeconds = 0): void {
    if (this.disposed) return;
    if (!this.isReady) throw new Error("Zuerst await music.prepare()");
    if (this.ctx.state !== "running") throw new Error("Vorher AudioContext per Nutzergeste starten");
    this.stop();
    this.position = Math.max(0, Math.min(this.duration, offsetSeconds));
    if (this.position >= this.duration) return;
    this.anchor = audioTime - this.position;
    this.cursor = 0;
    while (this.cursor < FROSCH_NOTES.length) {
      const [tick, dur] = FROSCH_NOTES[this.cursor];
      if ((tick + dur) / FROSCH_TICKS_PER_SECOND > this.position) break;
      this.cursor++;
    }
    this.playing = true;
    this.schedule();
    if (this.playing) this.timer = setInterval(() => this.schedule(), 25);
  }

  public get currentTime(): number {
    return this.playing
      ? Math.min(this.duration, Math.max(this.position, this.ctx.currentTime - this.anchor))
      : this.position;
  }

  public pause(): number {
    const pos = this.currentTime;
    this.stop();
    this.position = pos;
    return pos;
  }

  public stop(): void {
    this.playing = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const voice of this.active) {
      try {
        voice.source.stop();
      } catch {
        /* bereits beendet */
      }
      for (const node of voice.nodes) node.disconnect();
    }
    this.active.clear();
    this.position = 0;
  }

  public dispose(): void {
    this.disposed = true;
    this.stop();
    this.output.disconnect();
    this.cache.clear();
    this.preparation = null;
  }

  private schedule(): void {
    if (!this.playing) return;
    const now = this.ctx.currentTime;
    const horizon = now + 0.14;
    while (this.cursor < FROSCH_NOTES.length) {
      const [tick, durTicks, pitch] = FROSCH_NOTES[this.cursor];
      const when = this.anchor + tick / FROSCH_TICKS_PER_SECOND;
      if (when > horizon) break;
      this.cursor++;
      const buf = this.cache.get(`${pitch}:${durTicks}`);
      if (!buf) continue;
      const playEnd = when + durTicks / FROSCH_TICKS_PER_SECOND;
      if (playEnd <= now) continue;
      const source = this.ctx.createBufferSource();
      source.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.9, Math.max(now, when));
      source.connect(gain);
      gain.connect(this.output);
      const voice: Voice = { source, nodes: [source, gain] };
      this.active.add(voice);
      source.onended = () => {
        for (const node of voice.nodes) node.disconnect();
        this.active.delete(voice);
      };
      const actualStart = Math.max(now, when);
      source.start(actualStart, Math.max(0, actualStart - when));
      source.stop(playEnd + 0.005);
    }
    if (now >= this.anchor + this.duration) {
      this.stop();
      this.position = this.duration;
    }
  }
}
