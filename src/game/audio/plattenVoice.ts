/* =======================================================================
   Plattenspieler-Synthese für gtlg02.mid

   Erzeugt sämtliche Stimmen (Akustikgitarre, Bass, Flöte, E-Gitarre,
   Schlagzeug) rein prozedural in WebAudio und schließt sich an den
   vorhandenen Master-Gain an. Es werden nur die 41 vorkommenden
   (Instrument, Tonhöhe)-Paare einmalig gerendert (< 50 ms).

   Zusätzlich liefert `plattenBassPulse(zeit)` den exakten Bass-/Kick-Impuls
   (0..1) für die pulsierenden Lautsprecherboxen im Dachgeschoss.
   ======================================================================= */

import {
  PLATTEN_DURATION_SECONDS,
  PLATTEN_NOTES,
  PLATTEN_TICKS_PER_SECOND,
} from "./plattenNotes";

/** Auszug der Bass- und Kickdrum-Einsätze für synchrones Boxen-Pulsieren. */
const BASS_EVENTS: readonly { t: number; kick: boolean }[] = (() => {
  const list: { t: number; kick: boolean }[] = [];
  for (const [tick, , pitch, inst] of PLATTEN_NOTES) {
    if (inst === 1 || (inst === 4 && pitch === 36)) {
      list.push({ t: tick / PLATTEN_TICKS_PER_SECOND, kick: inst === 4 });
    }
  }
  return list;
})();

/**
 * Impulsstärke (0..1) der Lautsprecherboxen zur aktuellen Wiedergabezeit.
 * Reagiert direkt auf Kickdrum (scharfer Punch) und Basslauf (warmer Schub).
 */
export function plattenBassPulse(time: number): number {
  if (time < 0 || time > PLATTEN_DURATION_SECONDS + 0.5 || BASS_EVENTS.length === 0) return 0;
  // Binäre Suche bis zum letzten Ereignis <= time
  let lo = 0;
  let hi = BASS_EVENTS.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (BASS_EVENTS[mid].t <= time) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (idx < 0) return 0;
  // Die letzten paar Ereignisse berücksichtigen (z. B. Kick und Bass kurz hintereinander)
  let kickEnv = 0;
  let bassEnv = 0;
  for (let i = idx; i >= 0 && i >= idx - 4; i--) {
    const dt = time - BASS_EVENTS[i].t;
    if (dt > 0.65) break;
    if (BASS_EVENTS[i].kick) {
      kickEnv = Math.max(kickEnv, Math.exp(-dt * 13.5));
    } else {
      bassEnv = Math.max(bassEnv, Math.exp(-dt * 6.5));
    }
  }
  return Math.min(1, kickEnv * 0.85 + bassEnv * 0.52);
}

function midiHz(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

/** Deterministische Akustikgitarre (Karplus-Strong-Zupfklang mit Holzkörper). */
function renderAcoustic(ctx: BaseAudioContext, pitch: number, dur = 1.65): AudioBuffer {
  const sr = ctx.sampleRate;
  const count = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(1, count, sr);
  const out = buf.getChannelData(0);
  const f = midiHz(pitch);
  const period = Math.max(2, Math.round(sr / f));
  const ring = new Float32Array(period);
  let seed = (pitch * 73856093 + 19349663) >>> 0;
  let low = 0;
  // Gedämpftes Anzupfen als Startanregung
  for (let i = 0; i < period; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = seed / 2147483648 - 1;
    low += 0.36 * (white - low);
    ring[i] = low * 0.9;
  }
  let idx = 0;
  let prev = 0;
  const damp = 0.994 - Math.min(0.012, (f / 1400) * 0.008);
  for (let i = 0; i < count; i++) {
    const cur = ring[idx];
    const next = 0.5 * (cur + prev) * damp;
    prev = cur;
    ring[idx] = next;
    idx = (idx + 1) % period;
    const t = i / sr;
    const body = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9) * 0.22;
    out[i] = (cur * 0.85 + body) * (1 - Math.exp(-t / 0.004));
  }
  return buf;
}

/** Warmer, druckvoller E-Bass. */
function renderBass(ctx: BaseAudioContext, pitch: number, dur = 3.25): AudioBuffer {
  const sr = ctx.sampleRate;
  const count = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(1, count, sr);
  const out = buf.getChannelData(0);
  const f = midiHz(pitch);
  const w = 2 * Math.PI * f;
  for (let i = 0; i < count; i++) {
    const t = i / sr;
    const att = 1 - Math.exp(-t / 0.007);
    const dec = Math.exp(-t * 1.15);
    const bright = Math.exp(-t * 6.5);
    const s =
      Math.sin(w * t) * 0.72 +
      Math.sin(2 * w * t) * (0.28 + 0.24 * bright) +
      Math.sin(3 * w * t) * (0.12 * bright) +
      Math.sin(4 * w * t) * (0.05 * bright);
    out[i] = Math.tanh(s * 1.15) * att * dec * 0.85;
  }
  return buf;
}

/** Luftige Flöte mit weichem Einsatz und leichtem Vibrato. */
function renderFlute(ctx: BaseAudioContext, pitch: number, dur = 2.0): AudioBuffer {
  const sr = ctx.sampleRate;
  const count = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(1, count, sr);
  const out = buf.getChannelData(0);
  const f = midiHz(pitch);
  let phase = 0;
  let seed = (pitch * 83492791 + 9187) >>> 0;
  let lp = 0;
  let hp = 0;
  for (let i = 0; i < count; i++) {
    const t = i / sr;
    const att = 1 - Math.exp(-t / 0.048);
    const vibAmt = Math.min(1, Math.max(0, (t - 0.14) / 0.22));
    const cents = 12 * vibAmt * Math.sin(2 * Math.PI * 5.1 * t);
    phase += (2 * Math.PI * f * Math.pow(2, cents / 1200)) / sr;
    if (phase > Math.PI * 2) phase -= Math.PI * 2;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = seed / 2147483648 - 1;
    lp += 0.25 * (white - lp);
    hp = white - lp;
    const breath = hp * (0.06 + 0.1 * Math.exp(-t / 0.08));
    const tone = Math.sin(phase) * 0.82 + Math.sin(phase * 2) * 0.18 + Math.sin(phase * 3) * 0.04;
    out[i] = (tone + breath) * att * 0.72;
  }
  return buf;
}

/** Singende Solo-Gitarre mit warmer Sättigung. */
function renderDistGuitar(ctx: BaseAudioContext, pitch: number, dur = 2.6): AudioBuffer {
  const sr = ctx.sampleRate;
  const count = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(1, count, sr);
  const out = buf.getChannelData(0);
  const f = midiHz(pitch);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < count; i++) {
    const t = i / sr;
    const att = 1 - Math.exp(-t / 0.012);
    const vib = Math.min(1, Math.max(0, (t - 0.18) / 0.2)) * 16 * Math.sin(2 * Math.PI * 5.4 * t);
    phase += (2 * Math.PI * f * Math.pow(2, vib / 1200)) / sr;
    if (phase > Math.PI * 2) phase -= Math.PI * 2;
    const raw =
      Math.sin(phase) * 0.65 +
      Math.sin(phase * 2) * 0.35 +
      Math.sin(phase * 3) * 0.22 +
      Math.sin(phase * 4) * 0.12;
    const driven = Math.tanh(raw * 2.4 + 0.15 * raw * raw);
    lp += 0.22 * (driven - lp);
    out[i] = lp * att * Math.exp(-t * 0.35) * 0.78;
  }
  return buf;
}

/** Schlagzeug: Bassdrum (36), geschlossene Hi-Hat (42) und Pedal-Hi-Hat (44). */
function renderDrum(ctx: BaseAudioContext, pitch: number): AudioBuffer {
  const sr = ctx.sampleRate;
  if (pitch === 36) {
    const dur = 0.26;
    const count = Math.ceil(dur * sr);
    const buf = ctx.createBuffer(1, count, sr);
    const out = buf.getChannelData(0);
    let phase = 0;
    let seed = 13579;
    for (let i = 0; i < count; i++) {
      const t = i / sr;
      const freq = 44 + 98 * Math.exp(-t / 0.028);
      phase += (2 * Math.PI * freq) / sr;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const click = (seed / 2147483648 - 1) * Math.exp(-t / 0.008) * 0.32;
      const body = Math.sin(phase) * Math.exp(-t / 0.085);
      out[i] = Math.tanh((body + click) * 1.25) * 0.9;
    }
    return buf;
  }
  const dur = pitch === 44 ? 0.075 : 0.055;
  const count = Math.ceil(dur * sr);
  const buf = ctx.createBuffer(1, count, sr);
  const out = buf.getChannelData(0);
  let seed = pitch * 9973 + 54321;
  let prev = 0;
  for (let i = 0; i < count; i++) {
    const t = i / sr;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = seed / 2147483648 - 1;
    // Einfaches Hochpass-Verhalten durch Differenz
    const hp = white - prev * 0.78;
    prev = white;
    const metal = Math.sin(2 * Math.PI * 5240 * t) * 0.25 + Math.sin(2 * Math.PI * 7620 * t) * 0.2;
    const env = Math.exp(-t / (pitch === 44 ? 0.022 : 0.015));
    out[i] = (hp * 0.55 + metal) * env * 0.6;
  }
  return buf;
}

type Voice = { source: AudioBufferSourceNode; nodes: AudioNode[] };

import { MUSIK_PEGEL } from "./pegel";

const INST_GAIN: readonly number[] = [0.11, 0.36, 0.19, 0.23, 0.36];

/**
 * Plattenspieler-Wiedergabe von gtlg02.mid an vorhandenem AudioContext & Master.
 */
export class PlattenMusic {
  private readonly output: GainNode;
  private readonly warmth: BiquadFilterNode;
  private cache = new Map<string, AudioBuffer>();
  private preparation: Promise<void> | null = null;
  private active = new Set<Voice>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private anchor = 0;
  private cursor = 0;
  private playing = false;
  private position = 0;
  private disposed = false;
  public readonly duration = PLATTEN_DURATION_SECONDS;

  constructor(private readonly ctx: AudioContext, master: AudioNode) {
    this.output = ctx.createGain();
    this.output.gain.value = MUSIK_PEGEL.platten;
    this.warmth = ctx.createBiquadFilter();
    this.warmth.type = "lowpass";
    this.warmth.frequency.value = 6800;
    this.warmth.Q.value = 0.5;
    this.output.connect(this.warmth);
    this.warmth.connect(master);
  }

  public get isReady(): boolean {
    return this.cache.size > 0;
  }

  public prepare(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("PlattenMusic bereits freigegeben"));
    if (this.preparation) return this.preparation;
    this.preparation = (async () => {
      const unique = new Map<string, [number, number]>();
      for (const [, , pitch, inst] of PLATTEN_NOTES) {
        const key = `${inst}:${pitch}`;
        if (!unique.has(key)) unique.set(key, [inst, pitch]);
      }
      let count = 0;
      for (const [key, [inst, pitch]] of unique) {
        if (this.disposed) throw new Error("Vorbereitung abgebrochen");
        let buf: AudioBuffer;
        if (inst === 0) buf = renderAcoustic(this.ctx, pitch);
        else if (inst === 1) buf = renderBass(this.ctx, pitch);
        else if (inst === 2) buf = renderFlute(this.ctx, pitch);
        else if (inst === 3) buf = renderDistGuitar(this.ctx, pitch);
        else buf = renderDrum(this.ctx, pitch);
        this.cache.set(key, buf);
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
    if (this.disposed) throw new Error("PlattenMusic bereits freigegeben");
    if (!this.isReady) throw new Error("Zuerst await music.prepare()");
    if (this.ctx.state !== "running") throw new Error("Vorher AudioContext per Nutzergeste starten");
    this.stop();
    this.position = Math.max(0, Math.min(this.duration, offsetSeconds));
    if (this.position >= this.duration) return;
    this.anchor = audioTime - this.position;
    this.cursor = 0;
    while (this.cursor < PLATTEN_NOTES.length) {
      const [tick, dur] = PLATTEN_NOTES[this.cursor];
      if ((tick + dur) / PLATTEN_TICKS_PER_SECOND > this.position) break;
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
    this.warmth.disconnect();
    this.cache.clear();
    this.preparation = null;
  }

  private schedule(): void {
    if (!this.playing) return;
    const now = this.ctx.currentTime;
    const horizon = now + 0.14;
    while (this.cursor < PLATTEN_NOTES.length) {
      const [tick, ticks, pitch, inst] = PLATTEN_NOTES[this.cursor];
      const when = this.anchor + tick / PLATTEN_TICKS_PER_SECOND;
      if (when > horizon) break;
      this.cursor++;

      const dur = ticks / PLATTEN_TICKS_PER_SECOND;
      const buf = this.cache.get(`${inst}:${pitch}`);
      if (!buf) continue;
      const playEnd = inst === 4 ? when + buf.duration : Math.min(when + dur + 0.04, when + buf.duration);
      if (playEnd <= now) continue;

      const source = this.ctx.createBufferSource();
      source.buffer = buf;
      const gain = this.ctx.createGain();
      const level = INST_GAIN[inst] * (inst === 4 && pitch !== 36 ? 0.42 : 1);
      if (inst === 4) {
        gain.gain.setValueAtTime(level, Math.max(now, when));
      } else {
        const relStart = Math.max(now, when + Math.max(0.01, dur - 0.015));
        gain.gain.setValueAtTime(level, Math.max(now, when));
        gain.gain.setValueAtTime(level, relStart);
        gain.gain.linearRampToValueAtTime(0.0001, playEnd);
      }

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
      source.stop(playEnd + 0.01);
    }
    if (now >= this.anchor + this.duration) {
      this.stop();
      this.position = this.duration;
    }
  }
}
