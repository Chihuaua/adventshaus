import { klavierAnschlagGain, klavierTon } from "./klavierVoice";
import { NMS_ENDE_TICK, NMS_NOTEN, NMS_TICKS_PRO_SEKUNDE } from "./nmsNoten";
import { MUSIK_PEGEL } from "./pegel";

const AUSKLANG = 0.18;
const VORLAUF = 0.20;
const RUNDE = NMS_ENDE_TICK / NMS_TICKS_PRO_SEKUNDE + AUSKLANG;
const pufferDauer = new Map<number, number>();
for (const [, ticks, ton] of NMS_NOTEN) {
  const dauer = ticks / NMS_TICKS_PRO_SEKUNDE + AUSKLANG + 0.08;
  pufferDauer.set(ton, Math.max(dauer, pufferDauer.get(ton) ?? 0));
}

/** Eine Sendung pro Audiokontext; beide Fernseher behalten ihren eigenen Lautstärkeregler. */
export class NmsMusik {
  private static readonly sendungen = new WeakMap<AudioContext, NmsMusik>();
  private readonly ausgang: GainNode;
  private readonly empfaenger = new Set<AudioNode>();
  private readonly puffer = new Map<number, AudioBuffer>();
  private readonly stimmen = new Map<AudioBufferSourceNode, GainNode>();
  private readonly anker: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private index = 0;
  private runde = 0;

  private constructor(private readonly ctx: AudioContext, position: number) {
    this.ausgang = ctx.createGain();
    this.ausgang.gain.value = MUSIK_PEGEL.klavier;
    for (const [tick, dauer, ton] of NMS_NOTEN) {
      if (tick / NMS_TICKS_PRO_SEKUNDE > position + VORLAUF) break;
      if ((tick + dauer) / NMS_TICKS_PRO_SEKUNDE > position) this.saite(ton);
    }
    this.anker = ctx.currentTime - position + (position === 0 ? 0.05 : 0);
  }

  static empfangen(ctx: AudioContext, ziel: GainNode, position: number): NmsMusik {
    let musik = this.sendungen.get(ctx);
    if (!musik) {
      musik = new NmsMusik(ctx, position);
      this.sendungen.set(ctx, musik);
    }
    if (!musik.empfaenger.has(ziel)) {
      musik.ausgang.connect(ziel);
      musik.empfaenger.add(ziel);
    }
    if (musik.timer === null) {
      musik.planen();
      musik.timer = setInterval(musik.planen, 40);
    }
    return musik;
  }

  get position(): number { return Math.max(0, this.ctx.currentTime - this.anker) % RUNDE; }

  private saite(ton: number): AudioBuffer {
    let buf = this.puffer.get(ton);
    if (!buf) {
      buf = klavierTon(this.ctx, ton, pufferDauer.get(ton));
      this.puffer.set(ton, buf);
    }
    return buf;
  }

  private anschlag(wann: number, loslassen: number, ton: number, anschlag: number): void {
    const buf = this.saite(ton);
    const start = Math.max(wann, this.ctx.currentTime);
    if (start >= loslassen) return;
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    src.buffer = buf;
    const pegel = klavierAnschlagGain(anschlag);
    g.gain.value = pegel;
    if (start > wann) {
      // Nach einer Pause nur die noch klingende Saite einblenden, nicht neu anschlagen.
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(pegel, Math.min(loslassen, start + 0.006));
    }
    g.gain.setValueAtTime(pegel, loslassen);
    g.gain.exponentialRampToValueAtTime(0.0001, loslassen + AUSKLANG);
    src.connect(g); g.connect(this.ausgang);
    this.stimmen.set(src, g);
    src.onended = () => { src.disconnect(); g.disconnect(); this.stimmen.delete(src); };
    src.start(start, start - wann);
    src.stop(loslassen + AUSKLANG);
  }

  private planen = (): void => {
    const jetzt = this.ctx.currentTime;
    const laufendeRunde = Math.floor((jetzt - this.anker) / RUNDE);
    if (laufendeRunde > this.runde) { this.runde = laufendeRunde; this.index = 0; }
    for (;;) {
      const [tick, dauer, ton, anschlag] = NMS_NOTEN[this.index];
      const wann = this.anker + this.runde * RUNDE + tick / NMS_TICKS_PRO_SEKUNDE;
      if (wann > jetzt + VORLAUF) return;
      const ende = wann + dauer / NMS_TICKS_PRO_SEKUNDE;
      if (ende > jetzt) this.anschlag(wann, ende, ton, anschlag);
      if (++this.index === NMS_NOTEN.length) { this.index = 0; this.runde++; }
    }
  };

  trennen(ziel: GainNode): void {
    if (!this.empfaenger.delete(ziel)) return;
    this.ausgang.disconnect(ziel);
    if (this.empfaenger.size) return;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    for (const [src, gain] of this.stimmen) {
      src.onended = null;
      src.stop(); src.disconnect(); gain.disconnect();
    }
    this.stimmen.clear();
    this.puffer.clear();
    NmsMusik.sendungen.delete(this.ctx);
  }
}