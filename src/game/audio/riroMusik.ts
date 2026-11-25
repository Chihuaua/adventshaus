import { RIRO_ENDE_TICK, RIRO_NOTEN, RIRO_TICKS_PRO_SEKUNDE } from "./riroNoten";

const AUSKLANG = 0.08;
const VORLAUF = 0.20;
const RUNDE = RIRO_ENDE_TICK / RIRO_TICKS_PRO_SEKUNDE + AUSKLANG;

/** Pro Starttick: Anzahl gleichzeitiger Töne und höchste Stimme (Melodieführung). */
const GRUPPEN = (() => {
  const m = new Map<number, { anzahl: number; oben: number }>();
  for (const [tick, , ton] of RIRO_NOTEN) {
    const g = m.get(tick);
    if (!g) m.set(tick, { anzahl: 1, oben: ton });
    else { g.anzahl++; if (ton > g.oben) g.oben = ton; }
  }
  return m;
})();

/** Eine Sendung pro Audiokontext für das Musikvideo (riro.mid); jeder TV regelt seine Lautstärke selbst. */
export class RiroMusik {
  private static readonly sendungen = new WeakMap<AudioContext, RiroMusik>();
  private readonly ausgang: GainNode;
  private readonly filter: BiquadFilterNode | null;
  private readonly empfaenger = new Set<AudioNode>();
  private readonly stimmen = new Map<OscillatorNode, AudioNode[]>();
  private readonly anker: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private index = 0;
  private runde = 0;

  private constructor(private readonly ctx: AudioContext, position: number) {
    this.ausgang = ctx.createGain();
    this.ausgang.gain.value = 0.85;
    if (typeof ctx.createBiquadFilter === "function") {
      this.filter = ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 2100;
      this.filter.Q.value = 0.7;
      this.filter.connect(this.ausgang);
    } else {
      this.filter = null;
    }
    const pos = Math.max(0, position) % RUNDE;
    this.anker = ctx.currentTime - pos + (pos === 0 ? 0.02 : 0);
    while (
      this.index < RIRO_NOTEN.length &&
      (RIRO_NOTEN[this.index][0] + RIRO_NOTEN[this.index][1]) / RIRO_TICKS_PRO_SEKUNDE <= pos
    ) {
      this.index++;
    }
    if (this.index >= RIRO_NOTEN.length) {
      this.index = 0;
      this.runde = 1;
    }
  }

  static empfangen(ctx: AudioContext, ziel: GainNode, position: number): RiroMusik {
    let musik = this.sendungen.get(ctx);
    if (!musik) {
      musik = new RiroMusik(ctx, position);
      this.sendungen.set(ctx, musik);
    }
    if (!musik.empfaenger.has(ziel)) {
      musik.ausgang.connect(ziel);
      musik.empfaenger.add(ziel);
    }
    if (musik.timer === null) {
      musik.planen();
      musik.timer = setInterval(musik.planen, 35);
    }
    return musik;
  }

  get position(): number {
    return Math.max(0, this.ctx.currentTime - this.anker) % RUNDE;
  }

  private anschlag(wann: number, loslassen: number, tick: number, ton: number, anschlag: number): void {
    const start = Math.max(wann, this.ctx.currentTime);
    if (start >= loslassen) return;
    const gruppe = GRUPPEN.get(tick) ?? { anzahl: 1, oben: ton };
    const faktor = (anschlag / 100) * (gruppe.anzahl === 1 ? 0.25 : ton === gruppe.oben ? 0.165 : 0.115 / Math.sqrt(gruppe.anzahl));
    const freq = 440 * Math.pow(2, (ton - 69) / 12);
    const senke = this.filter ?? this.ausgang;

    // Hauptstimme (warmes Dreieck) + bei echtem Biquad-Filter dezente 80er-Synth-Oberstimme
    const schichten: readonly [OscillatorType, number, number][] = this.filter
      ? [["triangle", 1, 0.72], ["sawtooth", 1.0022, 0.34]]
      : [["triangle", 1, 1]];

    for (const [typ, verstimmt, anteil] of schichten) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = typ;
      osc.frequency.value = freq * verstimmt;
      const pegel = Math.max(0.001, faktor * anteil);
      const ein = Math.min(loslassen, start + 0.012);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(pegel, ein);
      gain.gain.setValueAtTime(pegel * 0.86, loslassen);
      gain.gain.exponentialRampToValueAtTime(0.0001, loslassen + AUSKLANG);
      osc.connect(gain);
      gain.connect(senke);
      this.stimmen.set(osc, [gain]);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        this.stimmen.delete(osc);
      };
      osc.start(start);
      osc.stop(loslassen + AUSKLANG + 0.02);
    }
  }

  private planen = (): void => {
    const jetzt = this.ctx.currentTime;
    const laufendeRunde = Math.max(0, Math.floor((jetzt - this.anker) / RUNDE));
    if (laufendeRunde > this.runde) {
      this.runde = laufendeRunde;
      this.index = 0;
    }
    for (;;) {
      const [tick, dauer, ton, anschlag] = RIRO_NOTEN[this.index];
      const wann = this.anker + this.runde * RUNDE + tick / RIRO_TICKS_PRO_SEKUNDE;
      if (wann > jetzt + VORLAUF) return;
      const ende = wann + dauer / RIRO_TICKS_PRO_SEKUNDE;
      if (ende > jetzt) this.anschlag(wann, ende, tick, ton, anschlag);
      if (++this.index === RIRO_NOTEN.length) {
        this.index = 0;
        this.runde++;
      }
    }
  };

  trennen(ziel: GainNode): void {
    if (!this.empfaenger.delete(ziel)) return;
    this.ausgang.disconnect(ziel);
    if (this.empfaenger.size) return;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    for (const [osc, knoten] of this.stimmen) {
      osc.onended = null;
      try { osc.stop(); } catch { /* Bereits beendet. */ }
      osc.disconnect();
      for (const k of knoten) k.disconnect();
    }
    this.stimmen.clear();
    this.filter?.disconnect();
    RiroMusik.sendungen.delete(this.ctx);
  }
}
