import type { TVKanal } from "../tv";
import { NmsMusik } from "./nmsMusik";

/** Eigener, leiser TV-Tonkanal. Die TV-Lautstaerke beeinflusst keine Instrumente. */
export class TVKlang {
  private output: GainNode;
  private stimmen = new Map<OscillatorNode, GainNode>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private programm: TVKanal | null = null;
  private schritt = 0;
  private anker = 0;
  private lautstaerke = -1;
  private nms: NmsMusik | null = null;
  private pausenPosition = 0;

  constructor(private ctx: AudioContext, master: AudioNode) {
    this.output = ctx.createGain();
    this.output.gain.value = 0;
    this.output.connect(master);
  }

  setze(programm: TVKanal | null, lautstaerke: number, zeit: number) {
    if (lautstaerke !== this.lautstaerke) {
      this.lautstaerke = lautstaerke;
      this.output.gain.setTargetAtTime(Math.pow(Math.max(0, Math.min(100, lautstaerke)) / 100, 2) * 0.6, this.ctx.currentTime, 0.025);
    }
    const einstieg = this.pausenPosition;
    this.pausenPosition = 0;
    if (programm === this.programm) return;
    this.stop();
    this.programm = programm;
    if (!programm) return;
    if (programm === "sterne") {
      this.nms = NmsMusik.empfangen(this.ctx, this.output, einstieg);
      return;
    }
    this.anker = this.ctx.currentTime - zeit;
    this.schritt = Math.ceil(zeit / 0.25);
    this.planen();
    this.timer = setInterval(() => this.planen(), 25);
  }

  private ton(pitch: number, when: number, dauer: number, pegel: number, art: OscillatorType) {
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = art;
    osc.frequency.value = 440 * Math.pow(2, (pitch - 69) / 12);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(pegel, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dauer);
    osc.connect(gain); gain.connect(this.output);
    this.stimmen.set(osc, gain);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); this.stimmen.delete(osc); };
    osc.start(when); osc.stop(when + dauer + 0.02);
  }

  private planen() {
    if (!this.programm) return;
    const now = this.ctx.currentTime;
    if (this.anker + this.schritt * 0.25 < now - 0.1) this.schritt = Math.ceil((now - this.anker) / 0.25);
    while (this.anker + this.schritt * 0.25 <= now + 0.12) {
      const i = this.schritt++, when = Math.max(now, this.anker + i * 0.25);
      if (this.lautstaerke <= 0) continue;
      if (this.programm === "musik") {
        const melodie = [64, 67, 69, 67, 64, 62, 60, 62, 65, 69, 72, 69, 67, 64, 62, 67];
        this.ton(melodie[i % melodie.length], when, 0.22, 0.21, "triangle");
        if (i % 2 === 0) this.ton([48, 53, 55, 48][Math.floor(i / 8) % 4], when, 0.32, 0.24, "sine");
      } else if (this.programm === "garten" && i % 2 === 0) {
        this.ton([72, 76, 79, 76, 74, 72, 67, 71][Math.floor(i / 2) % 8], when, 0.42, 0.16, "triangle");
      } else if (this.programm === "konsole" && i % 2 === 0) {
        this.ton([60, 67, 72, 67][Math.floor(i / 2) % 4], when, 0.12, 0.05, "square");
      } else if (this.programm === "gol" && i % 4 === 0) {
        this.ton([72, 76, 79, 83][Math.floor(i / 4) % 4], when, 0.6, 0.09, "sine");
      }
    }
  }

  pause() {
    if (!this.programm) return;
    const position = this.nms?.position ?? 0;
    this.stop();
    this.pausenPosition = position;
  }

  stop() {
    this.nms?.trennen(this.output);
    this.nms = null; this.pausenPosition = 0;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null; this.programm = null;
    for (const [osc, gain] of this.stimmen) {
      try { osc.stop(); } catch { /* Bereits beendet. */ }
      osc.disconnect(); gain.disconnect();
    }
    this.stimmen.clear();
  }

  dispose() { this.stop(); this.output.disconnect(); }
}