/* =======================================================================
   KAFFEE – violette Senseo, Unterschrank, Mülleimer, Kühlschrank

   Alles in Bühneneinheiten relativ zur Erdgeschoss-Bodenlinie F.
   Küchenzeile x 614–690 (Arbeitsplatte F-40), Spüle 620–644, Wasserhahn
   bei 636/642, Kühlschrank 574–612. Drei Unterschranktüren:
     links  614–640  unter der Spüle: Mülleimer
     Mitte  640–665
     rechts 665–690  alles für Kaffee und Tee
   Reine Canvas-Primitive, kein Bild, keine Schrift (Wii-tauglich).

   Zeiten nach Senseo-Bedienungsanleitung: Aufheizen ca. 90 s, Brühen
   einer Tasse 30 s. Tank 1,4 l am Küchenhahn (~6 l/min) ≈ 14 s.
   ======================================================================= */

type C = CanvasRenderingContext2D;
export type Pt = [number, number];

/** Echtzeit-Dauern (Sekunden). */
export const KAFFEE_ZEIT = {
  aufheizen: 90,
  bruehen: 30,
  fuellen: 14,
  /** eine Zigarette stopfen */
  stopfen: 40,
  /** Abstand zwischen zwei Schlucken auf dem Raucherstuhl */
  schluck: 28,
  /** Tasse kurz ausspülen */
  ausspuelen: 4,
} as const;
/** Kurze Probe: dieselben Abläufe, Wartezeiten stark verkürzt. */
export const KAFFEE_PROBE = {
  aufheizen: 5, bruehen: 4, fuellen: 3, stopfen: 3, schluck: 5, ausspuelen: 1.6,
} as const;
/** Faktor für Handgriffe in der Probe (Echtzeit = 1). */
export const PROBE_GRIFF = 0.55;
/** So oft vergisst Luni die Tasse im Keller. */
export const TASSE_VERGESSEN = 0.23;
/** Mehr Tassen stehen nie unten. */
export const MAX_TASSEN_UNTEN = 3;

/* ------------------------------ Orte ------------------------------------ */
export const SENSEO_X = 662;
/** Griffe und Ablagen in Bühnenkoordinaten (F = Bodenlinie Erdgeschoss). */
export const KORT = (F: number) => ({
  tankGriff: [664, F - 52] as Pt,
  hahn: [636, F - 51] as Pt,
  auslaufHahn: [642, F - 52] as Pt,
  tankUnterHahn: [641, F - 43] as Pt,
  schrankGriff: [667, F - 22] as Pt,
  schrankDose: [671, F - 24] as Pt,
  schrankTasse: [680, F - 23] as Pt,
  schrankKanne: [671, F - 7] as Pt,
  doseTheke: [647, F - 40] as Pt,
  hebel: [677, F - 69] as Pt,
  padSchacht: [675, F - 60] as Pt,
  knopfLinks: [671, F - 65] as Pt,
  knopfPower: [675, F - 65] as Pt,
  knopfRechts: [679, F - 65] as Pt,
  tasseAuslauf: [675, F - 43] as Pt,
  tasseTheke: [658, F - 40] as Pt,
  muellGriff: [637, F - 22] as Pt,
  muellEimer: [626, F - 14] as Pt,
  kuehlGriff: [609, F - 58] as Pt,
  milchTuer: [619, F - 49] as Pt,
  spuelAblage: [617, F - 40] as Pt,
  kanneTheke: [642, F - 40] as Pt,
});
/** Wo Luni steht: links neben dem rechten Schrank (Schritt zur Seite), vor dem Hahn usw. */
export const KSTAND = {
  maschine: 652, schrank: 650, hahn: 628, muell: 650, kuehl: 630, tisch: 741,
} as const;

/* ------------------------------ Zustand --------------------------------- */
export type Ort = "zuhause" | "hand" | "theke" | "maschine" | "keller";
export interface KaffeeStand {
  tank: "maschine" | "hand";
  tankWasser: number;          // 0..1 (1 = 1,4 l)
  deckel: number;              // 0 zu .. 1 offen
  padAlt: boolean;             // benutztes Pad liegt noch in der Maschine
  padNeu: boolean;             // frisches Pad liegt drin
  padHand: "alt" | "neu" | null;
  dose: Ort; doseOffen: boolean;
  tasse: Ort | "keine";        // die aktuelle Kaffeetasse
  tasseFuell: number;          // 0..1
  tasseMilch: boolean;
  milch: "kuehl" | "hand";
  an: boolean; heiz: number;   // 0..1 Aufheizen
  bereit: boolean;             // rote Lampe
  laeuft: boolean;             // Kaffee läuft durch
  schrank: number;             // rechte Unterschranktür 0..1
  muell: number;               // Tür unter der Spüle 0..1
  kuehl: number;               // Kühlschranktür 0..1
  hahnKueche: boolean;         // Wasser läuft in der Spüle
  kanne: "schrank" | "hand" | "theke";
  tassenUnten: number;         // vergessene Tassen im Keller (ohne die aktuelle)
  tassenSpuele: number;        // ausgespülte Tassen neben der Spüle
  tragUnten: number;           // zusätzlich eingesammelte Tassen in der Hand
}
export function neuerKaffeeStand(): KaffeeStand {
  return {
    tank: "maschine", tankWasser: 0.3, deckel: 0, padAlt: true, padNeu: false, padHand: null,
    dose: "zuhause", doseOffen: false, tasse: "keine", tasseFuell: 0, tasseMilch: false,
    milch: "kuehl", an: false, heiz: 0, bereit: false, laeuft: false,
    schrank: 0, muell: 0, kuehl: 0, hahnKueche: false, kanne: "schrank",
    tassenUnten: 0, tassenSpuele: 0, tragUnten: 0,
  };
}

/* ------------------------------ Zeichnen -------------------------------- */
const VIOLETT = "#6a3d9a", VIOLETT_HELL = "#8a5cc0", VIOLETT_DUNKEL = "#45256a";

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

/** Wassertank (auch in der Hand): (x, y) = Griff oben. */
export function drawTank(c: C, x: number, y: number, wasser: number) {
  rr(c, x - 3, y, 6, 20, 1.5, "rgba(200,225,240,.55)");
  const h = 17 * Math.max(0, Math.min(1, wasser));
  if (h > 0.3) rr(c, x - 2.4, y + 19 - h, 4.8, h, 1, "rgba(110,175,225,.75)");
  c.strokeStyle = "rgba(255,255,255,.65)"; c.lineWidth = 0.6;
  c.strokeRect(x - 3, y + 0.5, 6, 19.5);
  rr(c, x - 3.4, y - 1.2, 6.8, 2, 1, VIOLETT_DUNKEL);
  // Strich für MAX
  c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(x + 1.4, y + 3, 1.4, 0.6);
}

/** Die Senseo von vorn: Tank links, Kopf mit Deckel, drei Knöpfe, Tropfschale. */
export function drawSenseo(c: C, F: number, s: KaffeeStand, t: number) {
  const x = SENSEO_X;
  // Tank hinten links (wenn eingesetzt)
  if (s.tank === "maschine") drawTank(c, x + 2, F - 66, s.tankWasser);
  // Säule und Fuß
  rr(c, x + 15, F - 64, 10, 22, 3, VIOLETT);
  rr(c, x + 16, F - 62, 2, 18, 1, "rgba(255,255,255,.15)");
  rr(c, x + 5, F - 44, 21, 4, 1.6, VIOLETT_DUNKEL);
  rr(c, x + 7, F - 44.6, 13, 1.4, 0.6, "#2c1844");     // Tropfgitter
  // Kopf
  rr(c, x + 5, F - 68, 21, 8, 3, VIOLETT);
  rr(c, x + 6, F - 67.4, 19, 1.4, 0.7, VIOLETT_HELL);
  // Deckel mit Hebel: zu flach, offen hochgeklappt
  const a = s.deckel * 1.15;
  c.save();
  c.translate(x + 24, F - 68);
  c.rotate(-a);
  rr(c, -18, -2.6, 18, 2.8, 1.2, VIOLETT_HELL);
  rr(c, -4, -3.8, 5, 1.6, 0.8, "#d8d0e4");
  c.restore();
  if (s.deckel > 0.3) {
    // Padhalter sichtbar, mit altem oder neuem Pad
    rr(c, x + 9, F - 66.6, 13, 2, 1, "#2a1a3c");
    if (s.padAlt) kreis(c, x + 15.5, F - 66, 3.4, "#5a3a24");
    if (s.padNeu) kreis(c, x + 15.5, F - 66, 3.4, "#f1e6cf");
  }
  // Auslauf
  rr(c, x + 11, F - 60, 7, 3, 1.2, "#2a1a3c");
  // Knöpfe: links 1 Tasse, Mitte Power mit roter Lampe, rechts 2 Tassen
  kreis(c, x + 9, F - 65, 1.3, "#e9e3f0");
  kreis(c, x + 17, F - 65, 1.3, "#e9e3f0");
  kreis(c, x + 13, F - 65, 1.5, "#d9d2e2");
  const lampe = s.bereit || (s.laeuft && Math.sin(t * 6) > 0);
  kreis(c, x + 13, F - 65, 0.9, lampe ? "#ff3b30" : "#7a6a80");
  if (lampe) kreis(c, x + 13, F - 65, 2.6, "rgba(255,60,48,.25)");
  // Kaffeestrahl
  if (s.laeuft) {
    c.fillStyle = "rgba(92,52,24,.85)";
    const wackel = Math.sin(t * 23) * 0.25;
    c.fillRect(x + 13.6 + wackel, F - 57, 1.1, 12);
  }
}

/** Kaffeetasse; (x, y) = Bodenmitte. */
export function drawTasse(c: C, x: number, y: number, fuell = 0, milch = false) {
  rr(c, x - 3, y - 6, 6, 6, 1.4, "#f4efe6");
  c.strokeStyle = "#f4efe6"; c.lineWidth = 1;
  c.beginPath(); c.arc(x + 3.6, y - 3.2, 1.6, -Math.PI / 2, Math.PI / 2); c.stroke();
  if (fuell > 0.02) rr(c, x - 2.4, y - 5.6, 4.8, 1.2, 0.6, milch ? "#b98a5e" : "#4a2a14");
  c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(x - 3, y - 1, 6, 1);
}

/** Pad-Dose (rund, braun-gold); (x, y) = Bodenmitte. */
export function drawPadDose(c: C, x: number, y: number, offen = false) {
  rr(c, x - 4, y - 8, 8, 8, 1.4, "#8a5a2c");
  c.fillStyle = "#d9b25a"; c.fillRect(x - 4, y - 5.4, 8, 1.6);
  if (!offen) rr(c, x - 4.4, y - 9.2, 8.8, 1.8, 0.9, "#6e4520");
  else kreis(c, x, y - 8, 2.6, "#f1e6cf");
}

/** Ein Pad in der Hand: hell (neu) oder braun (benutzt). */
export function drawPad(c: C, x: number, y: number, alt: boolean) {
  c.beginPath(); c.ellipse(x, y, 3.2, 1.3, 0, 0, Math.PI * 2);
  c.fillStyle = alt ? "#5a3a24" : "#f1e6cf"; c.fill();
}

/** Bio-Milch im Tetra Pak; (x, y) = Bodenmitte, `winkel` zum Eingießen. */
export function drawMilch(c: C, x: number, y: number, winkel = 0) {
  c.save(); c.translate(x, y); c.rotate(winkel);
  c.fillStyle = "#f6f6f2"; c.fillRect(-2.6, -10, 5.2, 10);
  c.fillStyle = "#5aa24a"; c.fillRect(-2.6, -6.2, 5.2, 2.6);   // grünes Bio-Band
  c.fillStyle = "#3d7aa8"; c.fillRect(-2.6, -2.2, 5.2, 1.2);
  c.beginPath(); c.moveTo(-2.6, -10); c.lineTo(0, -12.4); c.lineTo(2.6, -10); c.closePath();
  c.fillStyle = "#e6e6e0"; c.fill();
  c.restore();
}

/** Teekanne klein (im Schrank / in der Hand); (x, y) = Bodenmitte. */
export function drawKanneKlein(c: C, x: number, y: number) {
  c.beginPath(); c.ellipse(x, y - 4, 4.6, 4, 0, 0, Math.PI * 2); c.fillStyle = "#e7d7b7"; c.fill();
  rr(c, x - 1.2, y - 9.4, 2.4, 1.6, 0.8, "#c9a46a");
  c.strokeStyle = "#e7d7b7"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(x + 4, y - 4); c.lineTo(x + 7, y - 7); c.stroke();
}

/** Rechter Unterschrank: offen mit Inhalt (Kaffee und Tee). */
export function drawSchrankRechts(c: C, F: number, offen: number, s: KaffeeStand) {
  if (offen < 0.02) return;
  const x0 = 666, x1 = 689, oben = F - 35;
  // Innenraum
  c.fillStyle = "#1e2a31"; c.fillRect(x0, oben, x1 - x0, 35);
  c.fillStyle = "#2a3a43"; c.fillRect(x0, F - 18, x1 - x0, 1.4);
  c.fillStyle = "#2a3a43"; c.fillRect(x0, F - 2, x1 - x0, 2);
  // oberes Fach: Pad-Dose, Tassen
  if (s.dose === "zuhause") drawPadDose(c, 671, F - 18.6);
  for (let i = 0; i < 2; i++) drawTasse(c, 680 + i * 5, F - 18.6 - (i === 1 ? 0 : 0));
  // unteres Fach: Teekanne, Teedosen, Teebeutel, Holzstäbchen im Glas
  if (s.kanne === "schrank") drawKanneKlein(c, 671, F - 2);
  rr(c, 677, F - 9, 3.4, 7, 0.8, "#4e7a5a");
  rr(c, 681, F - 8, 3.4, 6, 0.8, "#a8483e");
  rr(c, 685, F - 6, 3, 4, 0.6, "#efe3c4");                       // Teebeutel-Schachtel
  c.fillStyle = "rgba(210,230,240,.5)"; c.fillRect(685.2, F - 13, 2.6, 7);   // Glas
  c.strokeStyle = "#c79a5a"; c.lineWidth = 0.5;
  for (const dx of [0.6, 1.3, 2]) { c.beginPath(); c.moveTo(685.2 + dx, F - 6.5); c.lineTo(685.2 + dx, F - 15); c.stroke(); }
  // Tür: um die rechte Angel aufgeschwenkt, schmal und schräg vor der Seitenwand
  const b = 25 * (1 - Math.sin(offen * Math.PI / 2)) + 3;
  c.fillStyle = "#4b6878";
  c.beginPath(); c.moveTo(x1 + 1, oben); c.lineTo(x1 + 1 + b * 0.35 + 3, oben + 2); c.lineTo(x1 + 1 + b * 0.35 + 3, F - 2); c.lineTo(x1 + 1, F); c.closePath(); c.fill();
}

/** Tür unter der Spüle offen: Mülleimer sichtbar. */
export function drawMuell(c: C, F: number, offen: number) {
  if (offen < 0.02) return;
  const x0 = 615, x1 = 639, oben = F - 35;
  c.fillStyle = "#1e2a31"; c.fillRect(x0, oben, x1 - x0, 35);
  // Siphon
  c.strokeStyle = "#9aa8ae"; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(632, oben); c.lineTo(632, F - 26); c.quadraticCurveTo(632, F - 22, 628, F - 22); c.stroke();
  // Eimer
  rr(c, 620, F - 16, 12, 16, 1.6, "#5f7a6a");
  rr(c, 619.4, F - 17, 13.2, 2, 1, "#4a6255");
  // Tür um die linke Angel aufgeschwenkt
  const b = 24 * (1 - Math.sin(offen * Math.PI / 2)) + 3;
  c.fillStyle = "#4b6878";
  c.beginPath(); c.moveTo(x0 - 1, oben); c.lineTo(x0 - 1 - b * 0.35 - 3, oben + 2); c.lineTo(x0 - 1 - b * 0.35 - 3, F - 2); c.lineTo(x0 - 1, F); c.closePath(); c.fill();
}

/** Kühlschrank offen: Licht, Lebensmittel, Tür mit Bio-Milch (rechte Angel). */
export function drawKuehlOffen(c: C, F: number, offen: number, milchDa: boolean) {
  if (offen < 0.02) return;
  const x0 = 576, x1 = 610, oben = F - 76;
  // Innen hell beleuchtet
  c.fillStyle = "#f4f7ee"; c.fillRect(x0, oben, x1 - x0, 74);
  const licht = c.createRadialGradient(593, oben + 6, 1, 593, oben + 6, 40);
  licht.addColorStop(0, `rgba(255,250,214,${0.75 * offen})`); licht.addColorStop(1, "rgba(255,250,214,0)");
  c.fillStyle = licht; c.fillRect(x0, oben, x1 - x0, 74);
  c.fillStyle = "#cfd8d2";
  for (const y of [F - 58, F - 40, F - 22]) c.fillRect(x0, y, x1 - x0, 1.4);
  // oben: Butter, Käse
  rr(c, 579, F - 64, 10, 6, 1, "#f2d36a");
  c.fillStyle = "#f7c948"; c.beginPath(); c.moveTo(592, F - 58); c.lineTo(604, F - 58); c.lineTo(604, F - 64); c.closePath(); c.fill();
  // Mitte: Eier, Marmelade
  for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(581 + i * 4, F - 42.4, 1.7, 2.2, 0, 0, Math.PI * 2); c.fillStyle = "#f3e2c4"; c.fill(); }
  rr(c, 598, F - 48, 6, 8, 1.2, "#b02a3a"); rr(c, 597.6, F - 49.4, 6.8, 1.8, .8, "#d9c27a");
  // unten: Gemüse im Fach
  rr(c, 578, F - 20, 30, 16, 2, "rgba(190,215,205,.7)");
  kreis(c, 584, F - 10, 3, "#e1623a"); kreis(c, 591, F - 9, 2.6, "#6aa84f");
  c.strokeStyle = "#ef8f2f"; c.lineWidth = 2; c.beginPath(); c.moveTo(596, F - 8); c.lineTo(604, F - 14); c.stroke();
  // Tür rechts aufgeschwenkt, Innenseite mit Fach und Milch
  const b = 34 * (1 - Math.sin(offen * Math.PI / 2)) + 4;
  const dx = b * 0.35 + 8;
  c.fillStyle = "#dfe6e6";
  c.beginPath(); c.moveTo(x1 + 2, oben - 2); c.lineTo(x1 + 2 + dx, oben + 2); c.lineTo(x1 + 2 + dx, F - 4); c.lineTo(x1 + 2, F); c.closePath(); c.fill();
  c.fillStyle = "#c4cfce"; c.fillRect(x1 + 3, F - 40, dx - 1, 1.2);
  if (milchDa && offen > 0.6) drawMilch(c, x1 + 2 + dx / 2, F - 40.6);
}

/** Ausgespülte Tassen neben der Spüle: gestapelt, Öffnung nach unten. */
export function drawTassenSpuele(c: C, F: number, n: number) {
  for (let i = 0; i < Math.min(n, 3); i++) {
    const y = F - 40 - i * 5.4;
    rr(c, 614.6, y - 5.6, 5.6, 5.6, 1.2, "#f4efe6");
    c.fillStyle = "rgba(0,0,0,.1)"; c.fillRect(614.6, y - 1, 5.6, 1);
  }
}

/* ------------------------------ Klang ----------------------------------- */
/** Pumpenbrummen und Gluckern der Senseo, rein synthetisch. Eine Quelle je Hausinstanz. */
export class SenseoKlang {
  private osc: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  laufen(an: boolean, audio: { ctx: AudioContext; master: AudioNode } | null) {
    if (!audio || !an) { this.stop(); return; }
    if (this.osc) return;
    const { ctx, master } = audio;
    this.osc = ctx.createOscillator(); this.osc.type = "sawtooth"; this.osc.frequency.value = 96;
    this.filter = ctx.createBiquadFilter(); this.filter.type = "lowpass"; this.filter.frequency.value = 520; this.filter.Q.value = 3;
    this.lfo = ctx.createOscillator(); this.lfo.frequency.value = 7.5;
    this.lfoGain = ctx.createGain(); this.lfoGain.gain.value = 260;
    this.lfo.connect(this.lfoGain); this.lfoGain.connect(this.filter.frequency);
    this.gain = ctx.createGain(); this.gain.gain.value = 0;
    this.gain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.08);
    this.osc.connect(this.filter); this.filter.connect(this.gain); this.gain.connect(master);
    this.osc.start(); this.lfo.start();
  }
  stop() {
    if (!this.osc) return;
    this.osc.stop(); this.lfo?.stop();
    this.osc.disconnect(); this.lfo?.disconnect(); this.lfoGain?.disconnect(); this.filter?.disconnect(); this.gain?.disconnect();
    this.osc = null; this.lfo = null; this.lfoGain = null; this.filter = null; this.gain = null;
  }
}
