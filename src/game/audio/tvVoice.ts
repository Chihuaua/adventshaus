import type { TVKanal } from "../tv";
import { NmsMusik } from "./nmsMusik";
import { RiroMusik } from "./riroMusik";

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
  private riro: RiroMusik | null = null;
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
    if (programm === "musik") {
      this.riro = RiroMusik.empfangen(this.ctx, this.output, einstieg);
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
      if (this.programm === "konsole" && i % 2 === 0) {
        this.ton([60, 67, 72, 67][Math.floor(i / 2) % 4], when, 0.12, 0.05, "square");
      } else if (this.programm === "gol" && i % 4 === 0) {
        this.ton([72, 76, 79, 83][Math.floor(i / 4) % 4], when, 0.6, 0.09, "sine");
      } else if (this.programm === "malfreude" && i % 4 === 0) {
        this.ton([60, 64, 67, 71, 69, 67, 64, 62][Math.floor(i / 4) % 8], when, 0.72, 0.08, "sine");
      } else if (this.programm === "zugfahrt") {
        // Sanfter Schienentakt (tock-tock … tock-tock)
        if (i % 4 === 0 || i % 4 === 1) this.ton(i % 4 === 0 ? 45 : 43, when, 0.08, 0.06, "triangle");
      } else if (this.programm === "tiefsee" && i % 6 === 0) {
        this.ton([55, 62, 60, 50, 57, 64][Math.floor(i / 6) % 6], when, 0.9, 0.07, "sine");
      } else if (this.programm === "domino" && i % 2 === 0) {
        this.ton([74, 76, 78, 81, 79, 76, 74, 71][Math.floor(i / 2) % 8], when, 0.14, 0.08, "triangle");
      } else if (this.programm === "wald" && i % 6 === 0) {
        this.ton([76, 79, 83, 81, 79, 74][Math.floor(i / 6) % 6], when, 0.55, 0.06, "sine");
      } else if (this.programm === "krimi" && i % 2 === 0) {
        // Stummfilm-Klavier im Ragtime-Takt
        this.ton([60, 63, 67, 70, 67, 63, 62, 65][Math.floor(i / 2) % 8], when, 0.24, 0.09, "triangle");
      } else if (this.programm === "expedition" && i % 4 === 0) {
        this.ton([58, 65, 70, 74, 70, 65][Math.floor(i / 4) % 6], when, 0.78, 0.07, "sine");
      } else if (this.programm === "theater" && i % 3 === 0) {
        // Spieluhr-Walzer
        this.ton([72, 76, 79, 74, 77, 81][Math.floor(i / 3) % 6], when, 0.36, 0.08, "triangle");
      } else if (this.programm === "kochshow" && i % 2 === 0) {
        this.ton([67, 71, 74, 76, 74, 71][Math.floor(i / 2) % 6], when, 0.18, 0.08, "triangle");
      } else if (this.programm === "froschnews" && i % 4 === 0) {
        // Nachrichten-Impuls
        this.ton([67, 72, 72, 74][Math.floor(i / 4) % 4], when, 0.22, 0.08, "square");
      } else if (this.programm === "rennen") {
        // Flotter Retro-Renn-Beat
        this.ton([52, 55, 59, 64, 59, 55, 57, 60][i % 8], when, 0.16, 0.06, "sawtooth");
      } else if (this.programm === "quizshow" && i % 2 === 0) {
        this.ton([64, 67, 72, 76, 72, 67][Math.floor(i / 2) % 6], when, 0.28, 0.08, "triangle");
      }
    }
  }

  pause() {
    if (!this.programm) return;
    const position = this.nms?.position ?? this.riro?.position ?? 0;
    this.stop();
    this.pausenPosition = position;
  }

  stop() {
    this.nms?.trennen(this.output);
    this.riro?.trennen(this.output);
    this.nms = null; this.riro = null; this.pausenPosition = 0;
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