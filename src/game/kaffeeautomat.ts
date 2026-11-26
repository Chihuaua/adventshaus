/* =======================================================================
   ALTER KAFFEEAUTOMAT – das Gerät im Adventshaus vor der Senseo (Türchen 3)

   Ein klappriger Automat aus den 80ern auf der Küchenzeile, dort wo später
   die Senseo steht (x 664–682, Arbeitsplatte F-40). Bedienung: Luni stellt
   die Tasse in die Nische, drückt den roten Knopf, der Automat heizt mit
   seltsamen Geräuschen auf, lässt dann sichtbar erst Kaffee und danach
   Milch in die Tasse laufen und vibriert dabei (Comic-Vibrationslinien).

   Reine Canvas-Primitive und WebAudio-Synthese, keine Dateien (Wii-tauglich).
   ======================================================================= */

type C = CanvasRenderingContext2D;
type Pt = [number, number];

/** Echtzeit-Dauern in Sekunden. */
export const AUTOMAT_ZEIT = {
  heizen: 18,
  kaffee: 9,
  milch: 4,
} as const;
/** Kurze Probe über den Kaffee-Stein (lang genug für Stopfen am Tisch, Warten und Vibrieren). */
export const AUTOMAT_PROBE = {
  heizen: 6,
  kaffee: 5.5,
  milch: 2.5,
} as const;

/** Linke Kante des Gehäuses. */
export const AUTOMAT_X = 664;

/** Griffpunkte in Bühnenkoordinaten (F = Bodenlinie Erdgeschoss). */
export const AORT = (F: number) => ({
  /** Roter Startknopf vorn am Kopf. */
  knopf: [AUTOMAT_X + 4.5, F - 57.5] as Pt,
  /** Bodenmitte der Tasse in der Nische. */
  tasse: [AUTOMAT_X + 9, F - 41.2] as Pt,
  /** Kaffee- und Milchauslauf (Unterkante des Kopfes). */
  auslaufKaffee: [AUTOMAT_X + 7.6, F - 51.5] as Pt,
  auslaufMilch: [AUTOMAT_X + 10.6, F - 51.5] as Pt,
});

export type AutomatPhase = "aus" | "heizen" | "kaffee" | "milch" | "fertig";
export interface AutomatStand {
  phase: AutomatPhase;
  /** Fortschritt der laufenden Phase 0..1. */
  p: number;
}
export function neuerAutomatStand(): AutomatStand {
  return { phase: "aus", p: 0 };
}

/** Vibriert der Automat gerade? (beim Auslaufen von Kaffee und Milch) */
export function automatVibriert(s: AutomatStand): boolean {
  return s.phase === "kaffee" || s.phase === "milch";
}

/**
 * Schreitet den Automaten um dt voran. Gibt true zurück, wenn in diesem
 * Schritt die Tasse voll wurde (Phase „fertig“ erreicht).
 */
export function automatTakt(s: AutomatStand, dt: number, probe: boolean): boolean {
  if (s.phase === "aus" || s.phase === "fertig") return false;
  const z = probe ? AUTOMAT_PROBE : AUTOMAT_ZEIT;
  s.p = Math.min(1, s.p + dt / z[s.phase]);
  if (s.p < 1) return false;
  s.p = 0;
  if (s.phase === "heizen") s.phase = "kaffee";
  else if (s.phase === "kaffee") s.phase = "milch";
  else { s.phase = "fertig"; return true; }
  return false;
}

/** Füllstand der Tasse (0..1), ob Milch drin ist und fließender Milchanteil (0..1). */
export function automatTasse(s: AutomatStand): { fuell: number; milch: boolean; milchAnteil: number } {
  if (s.phase === "kaffee") return { fuell: 0.76 * s.p, milch: false, milchAnteil: 0 };
  if (s.phase === "milch") return { fuell: 0.76 + 0.24 * s.p, milch: s.p > 0.15, milchAnteil: s.p };
  if (s.phase === "fertig") return { fuell: 1, milch: true, milchAnteil: 1 };
  return { fuell: 0, milch: false, milchAnteil: 0 };
}

function mischFarbe(a: [number, number, number], b: [number, number, number], k: number): string {
  const q = Math.max(0, Math.min(1, k));
  const r = Math.round(a[0] + (b[0] - a[0]) * q);
  const g = Math.round(a[1] + (b[1] - a[1]) * q);
  const bl = Math.round(a[2] + (b[2] - a[2]) * q);
  return `rgb(${r},${g},${bl})`;
}

function rr(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  const q = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + q, y); c.lineTo(x + w - q, y); c.quadraticCurveTo(x + w, y, x + w, y + q);
  c.lineTo(x + w, y + h - q); c.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  c.lineTo(x + q, y + h); c.quadraticCurveTo(x, y + h, x, y + h - q);
  c.lineTo(x, y + q); c.quadraticCurveTo(x, y, x + q, y); c.closePath();
  c.fillStyle = f; c.fill();
}
function kreis(c: C, x: number, y: number, r: number, f: string) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = f; c.fill();
}

/** Tasse mit sichtbarem Füllstand (Glas-Tasse des Automaten); (x, y) = Bodenmitte. */
export function drawAutomatTasse(c: C, x: number, y: number, fuell = 0, milch: boolean | number = false) {
  const m = typeof milch === "number" ? Math.max(0, Math.min(1, milch)) : milch ? 1 : 0;
  rr(c, x - 3.2, y - 6.4, 6.4, 6.4, 1.4, "#f4efe6");
  const h = 5.0 * Math.max(0, Math.min(1, fuell));
  if (h > 0.2) {
    // Kaffee hellt sich beim Einlaufen der Milch fließend auf.
    const farbe = mischFarbe([74, 42, 20], [185, 138, 94], m);
    rr(c, x - 2.4, y - 0.8 - h, 4.8, h, 0.5, farbe);
    if (m > 0.05) {
      // Sichtbare weiße Milch-/Schaumkrone oben auf dem Kaffee.
      const schaumH = Math.min(h * 0.45, 0.7 + 1.1 * m);
      rr(c, x - 2.4, y - 0.8 - h, 4.8, schaumH, 0.5, "#fbf7ee");
    } else {
      // Warmer Crema-Rand auf dem dunklen Kaffee.
      rr(c, x - 2.3, y - 0.8 - h, 4.6, Math.min(h, 0.65), 0.3, "#9b6432");
    }
  }
  c.strokeStyle = "#f4efe6"; c.lineWidth = 1;
  c.beginPath(); c.arc(x + 3.7, y - 3.4, 1.6, -Math.PI / 2, Math.PI / 2); c.stroke();
  c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(x - 3.2, y - 1, 6.4, 1);
}

/** Comic-Vibrationslinien links und rechts des Gehäuses. */
function vibrationslinien(c: C, x0: number, x1: number, yMitte: number, t: number) {
  c.save();
  c.strokeStyle = "rgba(240,246,250,.85)";
  c.lineWidth = 1;
  c.lineCap = "round";
  for (let i = -1; i <= 1; i++) {
    // Linien blinken wechselweise – wie gezeichnetes Zittern.
    if (Math.sin(t * 28 + i * 2.1) < -0.2) continue;
    const y = yMitte + i * 4.2;
    c.beginPath(); c.moveTo(x0 - 2.2, y - i * 0.8); c.lineTo(x0 - 5.2, y - i * 1.6); c.stroke();
    c.beginPath(); c.moveTo(x1 + 2.2, y - i * 0.8); c.lineTo(x1 + 5.2, y - i * 1.6); c.stroke();
  }
  c.restore();
}

/** Der alte Kaffeeautomat auf der Arbeitsplatte; `tasse` = steht eine Tasse in der Nische. */
export function drawAutomat(
  c: C,
  F: number,
  s: AutomatStand,
  t: number,
  tasse: { da: boolean; fuell: number; milch: boolean | number },
) {
  const x = AUTOMAT_X, O = AORT(F);
  const vib = automatVibriert(s);
  const dx = vib ? Math.sin(t * 46) * 0.55 : 0;
  const dy = vib ? Math.cos(t * 61) * 0.3 : 0;
  c.save();
  c.translate(dx, dy);
  // Fußplatte und Rückwand der Nische (leicht beleuchtet beim Einlaufen, damit Kaffee- und Milchstrahl klar abstechen)
  rr(c, x - 0.5, F - 42, 19, 2.4, 0.8, "#1f2429");
  rr(c, x + 1, F - 52, 16, 10.5, 1, "#3a4048");
  rr(c, x + 1.6, F - 51.5, 14.8, 9.6, 0.8, s.phase === "kaffee" ? "#6d747b" : s.phase === "milch" ? "#454c56" : "#4b525b");
  // Kopf mit Lüftungsschlitzen, altes Beige mit braunem Band
  rr(c, x, F - 63, 18, 11.5, 2.4, "#d9cfb6");
  rr(c, x, F - 56.2, 18, 2.2, 0.6, "#6b4a2e");
  rr(c, x + 1, F - 62.3, 16, 1.4, 0.5, "#efe8d6");
  for (let i = 0; i < 4; i++) rr(c, x + 11 + i * 1.6, F - 61.2, 0.7, 3.2, 0.3, "#9b8f74");
  // Roter Startknopf (links) und Kontrolllampe (rechts)
  kreis(c, O.knopf[0], O.knopf[1], 2, "#8a1f1f");
  kreis(c, O.knopf[0], O.knopf[1] - 0.2, 1.5, s.phase === "heizen" ? "#c8352c" : "#e04a3c");
  const heizt = s.phase === "heizen";
  const lampe = heizt ? Math.sin(t * 9) > 0 : s.phase === "kaffee" || s.phase === "milch";
  const lampCol = heizt ? "#ffb02e" : s.phase === "milch" ? "#e8f6ff" : "#ff3b30";
  kreis(c, x + 13, F - 54.4, 1.1, lampe ? lampCol : "#5a5248");
  if (lampe) {
    const glow = heizt ? "rgba(255,176,46,.28)" : s.phase === "milch" ? "rgba(232,246,255,.35)" : "rgba(255,60,48,.26)";
    kreis(c, x + 13, F - 54.4, 2.3, glow);
  }
  // Zwei Ausläufe
  rr(c, O.auslaufKaffee[0] - 1.2, F - 52.2, 2.4, 1.6, 0.5, "#23282d");
  rr(c, O.auslaufMilch[0] - 1.2, F - 52.2, 2.4, 1.6, 0.5, "#23282d");
  // Dampf beim Heizen oder Einlaufen
  if (heizt || vib) {
    const n = heizt ? 3 : 2;
    const bx = s.phase === "milch" ? O.auslaufMilch[0] : s.phase === "kaffee" ? O.auslaufKaffee[0] : x + 12.5;
    const by = heizt ? F - 63.5 : O.tasse[1] - 6.8;
    for (let i = 0; i < n; i++) {
      const u = ((t * (heizt ? 0.7 : 0.95) + i / n) % 1);
      const a = (s.phase === "milch" ? 0.55 : 0.4) * (1 - u);
      kreis(c, bx + Math.sin(u * 6 + i) * 1.2, by - u * (heizt ? 7 : 5.5), 1.3 * (1 - u) + 0.35, `rgba(245,248,252,${a})`);
    }
  }
  // Tasse in der Nische
  if (tasse.da) drawAutomatTasse(c, O.tasse[0], O.tasse[1], tasse.fuell, tasse.milch);
  // Strahlen: erst kräftiger Kaffee mit Glanzkern & Spritzern, dann weiße Milch mit Schaumkrone
  const oben = F - 50.6;
  const bis = O.tasse[1] - 5.4;
  if (s.phase === "kaffee") {
    const w = Math.sin(t * 23) * 0.25;
    const sx = O.auslaufKaffee[0] + w;
    c.fillStyle = "#4d270e";
    c.fillRect(sx - 0.85, oben, 1.7, bis - oben);
    c.fillStyle = "#b0743b";
    c.fillRect(sx - 0.25, oben, 0.55, bis - oben);
    // Kleine Tropfen beim Auftreffen
    const hupf = Math.abs(Math.sin(t * 27));
    kreis(c, sx - 1.1, bis - 0.4 - hupf * 1.1, 0.45, "#7c4720");
    kreis(c, sx + 1.0, bis - 0.2 - (1 - hupf) * 0.9, 0.4, "#b0743b");
  }
  if (s.phase === "milch") {
    const w = Math.sin(t * 19) * 0.25;
    const sx = O.auslaufMilch[0] + w;
    c.fillStyle = "#fffdf7";
    c.fillRect(sx - 0.9, oben, 1.8, bis - oben);
    c.fillStyle = "rgba(255,255,255,.95)";
    c.fillRect(sx - 0.35, oben, 0.7, bis - oben);
    // Schäumende Milchbläschen am Tassenrand
    const hupf = Math.abs(Math.sin(t * 24));
    kreis(c, sx - 1.2, bis - 0.5 - hupf * 1.2, 0.55, "#ffffff");
    kreis(c, sx + 1.1, bis - 0.4 - (1 - hupf) * 1.1, 0.5, "#f7f3e8");
  }
  c.restore();
  if (vib) vibrationslinien(c, x, x + 18, F - 52, t);
}

/* ------------------------------ Klang ----------------------------------- */
export type AutomatKlangModus = "heizen" | "kaffee" | "milch";

/**
 * Drei klar unterscheidbare synthetische Geräusche des alten Automaten:
 *   - "heizen": quietschendes Pfeifen mit Sprüngen + tiefes Kesselgrummeln
 *   - "kaffee": tiefes, ratternd-pumpendes Brummen beim Kaffeelaufen
 *   - "milch":  helles Aufschäum-/Dampfzischen (Bandpass-Rauschen) + leichtes Blubbern
 * Rein prozedural (WebAudio), keine Audiodateien.
 */
export class AutomatKlang {
  private modus: AutomatKlangModus | null = null;
  private osc: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private rausch: AudioBufferSourceNode | null = null;
  private rauschFilter: BiquadFilterNode | null = null;
  private rauschGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private naechsterSprung = 0;
  private saat = 7;

  private zufall() {
    this.saat = (Math.imul(this.saat, 1664525) + 1013904223) >>> 0;
    return this.saat / 4294967296;
  }

  laufen(modus: AutomatKlangModus | null, audio: { ctx: AudioContext; master: AudioNode } | null) {
    if (!audio || !modus) { this.stop(); return; }
    if (this.osc && this.modus !== modus) this.stop();
    const { ctx, master } = audio;
    if (!this.osc) {
      this.modus = modus;
      this.gain = ctx.createGain(); this.gain.gain.value = 0;
      this.filter = ctx.createBiquadFilter(); this.filter.type = "lowpass";
      this.osc = ctx.createOscillator();
      this.osc2 = ctx.createOscillator();
      this.lfo = ctx.createOscillator();
      this.lfoGain = ctx.createGain();
      if (modus === "heizen") {
        // Pfeifen und Knacken: Dreieck mit Pitch-Sprüngen, dazu ein tiefes Grummeln.
        this.osc.type = "triangle"; this.osc.frequency.value = 420;
        this.osc2.type = "sawtooth"; this.osc2.frequency.value = 48;
        this.filter.frequency.value = 1400; this.filter.Q.value = 2;
        this.lfo.frequency.value = 11; this.lfoGain.gain.value = 35;
        this.lfo.connect(this.lfoGain); this.lfoGain.connect(this.osc.frequency);
        this.gain.gain.setTargetAtTime(0.035, ctx.currentTime, 0.1);
      } else if (modus === "kaffee") {
        // Kaffee-Einlauf: tiefes Pumpen-Rattern und sattes Brummen.
        this.osc.type = "square"; this.osc.frequency.value = 56;
        this.osc2.type = "sawtooth"; this.osc2.frequency.value = 124;
        this.filter.frequency.value = 540; this.filter.Q.value = 4.2;
        this.lfo.type = "square"; this.lfo.frequency.value = 15; this.lfoGain.gain.value = 0.028;
        this.lfo.connect(this.lfoGain); this.lfoGain.connect(this.gain.gain);
        this.gain.gain.setTargetAtTime(0.042, ctx.currentTime, 0.08);
      } else {
        // Milch-Einlauf: helles Aufschäum-/Dampfzischen + höheres, leichteres Blubbern/Surren.
        this.osc.type = "triangle"; this.osc.frequency.value = 235;
        this.osc2.type = "sine"; this.osc2.frequency.value = 352;
        this.filter.frequency.value = 1100; this.filter.Q.value = 1.6;
        this.lfo.type = "sine"; this.lfo.frequency.value = 8.5; this.lfoGain.gain.value = 28;
        this.lfo.connect(this.lfoGain); this.lfoGain.connect(this.osc.frequency);
        this.gain.gain.setTargetAtTime(0.022, ctx.currentTime, 0.08);

        // Gefiltertes Rauschen als klar hörbares Milchdüsen-Zischen.
        const len = Math.max(1, Math.floor(ctx.sampleRate * 1.2));
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = this.zufall() * 2 - 1;
        this.rausch = ctx.createBufferSource();
        this.rausch.buffer = buf;
        this.rausch.loop = true;
        this.rauschFilter = ctx.createBiquadFilter();
        this.rauschFilter.type = "bandpass";
        this.rauschFilter.frequency.value = 2150;
        this.rauschFilter.Q.value = 1.8;
        this.rauschGain = ctx.createGain();
        this.rauschGain.gain.value = 0;
        this.rauschGain.gain.setTargetAtTime(0.048, ctx.currentTime, 0.08);
        this.rausch.connect(this.rauschFilter);
        this.rauschFilter.connect(this.rauschGain);
        this.rauschGain.connect(master);
        this.rausch.start();
      }
      this.osc.connect(this.filter); this.osc2.connect(this.filter);
      this.filter.connect(this.gain); this.gain.connect(master);
      this.osc.start(); this.osc2.start(); this.lfo.start();
      this.naechsterSprung = ctx.currentTime + 0.3;
    }
    if (modus === "heizen" && this.osc && ctx.currentTime >= this.naechsterSprung) {
      // Alle 0,2–0,6 s ein neuer, schräger Ton.
      const f = 260 + this.zufall() * 900;
      this.osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.03);
      this.naechsterSprung = ctx.currentTime + 0.2 + this.zufall() * 0.4;
    } else if (modus === "milch" && this.rauschFilter && ctx.currentTime >= this.naechsterSprung) {
      // Sanftes Blubbern/Aufschäumen im Zisch-Spektrum.
      const f = 1750 + this.zufall() * 850;
      this.rauschFilter.frequency.setTargetAtTime(f, ctx.currentTime, 0.07);
      this.naechsterSprung = ctx.currentTime + 0.14 + this.zufall() * 0.16;
    }
  }

  stop() {
    if (!this.osc) return;
    this.osc.stop(); this.osc2?.stop(); this.lfo?.stop(); this.rausch?.stop();
    this.osc.disconnect(); this.osc2?.disconnect(); this.lfo?.disconnect(); this.lfoGain?.disconnect();
    this.rausch?.disconnect(); this.rauschFilter?.disconnect(); this.rauschGain?.disconnect();
    this.filter?.disconnect(); this.gain?.disconnect();
    this.osc = null; this.osc2 = null; this.lfo = null; this.lfoGain = null;
    this.rausch = null; this.rauschFilter = null; this.rauschGain = null;
    this.filter = null; this.gain = null;
    this.modus = null;
  }
}
