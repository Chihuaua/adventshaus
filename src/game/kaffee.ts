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

/** Echtzeit-Dauern (Sekunden).
 *  Senseo Original Datenblatt: Aufheizen kalt ~60 s (warm ~30 s), Brühzeit 1 Tasse = 30 s.
 */
export const KAFFEE_ZEIT = {
  aufheizen: 60,
  bruehen: 30,
  fuellen: 14,
  /** genau 2 Stopfwiederholungen (2 × 1,35 s) */
  stopfen: 2.7,
  /** Abstand zwischen zwei Schlucken auf dem Raucherstuhl */
  schluck: 28,
  /** Tasse kurz ausspülen */
  ausspuelen: 4,
} as const;
/** Kurze Probe: dieselben Abläufe, Wartezeiten stark verkürzt. */
export const KAFFEE_PROBE = {
  aufheizen: 5, bruehen: 4, fuellen: 3, stopfen: 2.7, schluck: 5, ausspuelen: 1.6,
} as const;
/** Faktor für Handgriffe in der Probe (Echtzeit = 1). */
export const PROBE_GRIFF = 0.55;
/** So oft vergisst Luni die Tasse im Keller. */
export const TASSE_VERGESSEN = 0.23;
/** Mehr Tassen stehen nie unten. */
export const MAX_TASSEN_UNTEN = 3;

/* ------------------------------ Orte ------------------------------------ */
export const SENSEO_X = 663;
/** Griffe und Ablagen in Bühnenkoordinaten (F = Bodenlinie Erdgeschoss). */
export const KORT = (F: number) => ({
  tankGriff: [665, F - 51] as Pt,
  hahn: [635, F - 50] as Pt,
  auslaufHahn: [642, F - 52] as Pt,
  tankUnterHahn: [643, F - 44] as Pt,
  schrankGriff: [668, F - 22] as Pt,
  schrankDose: [671, F - 24] as Pt,
  schrankTasse: [679, F - 23] as Pt,
  schrankKanne: [671, F - 9] as Pt,
  doseTheke: [651, F - 40] as Pt,
  hebel: [676, F - 59] as Pt,
  padSchacht: [675.5, F - 56] as Pt,
  knopfLinks: [672, F - 55.5] as Pt,
  knopfPower: [675.5, F - 55.5] as Pt,
  knopfRechts: [679, F - 55.5] as Pt,
  tasseAuslauf: [675.5, F - 42.5] as Pt,
  tasseTheke: [652, F - 40] as Pt,
  muellGriff: [637, F - 22] as Pt,
  muellEimer: [627, F - 16] as Pt,
  kuehlGriff: [579, F - 58] as Pt,
  milchTuer: [620, F - 45] as Pt,
  spuelAblage: [617, F - 40] as Pt,
  kanneTheke: [642, F - 40] as Pt,
});
/** Wo Luni steht: an der Arbeitsplatte (Rücken zum Spieler) bzw. seitlich vor den Türen. */
export const KSTAND = {
  maschine: 663, maschineSeite: 654, schrank: 650, hahn: 629, muell: 645, kuehl: 631, tisch: 741,
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
  rr(c, x - 3, y, 6, 15, 1.4, "rgba(200,225,240,.58)");
  const h = 12.6 * Math.max(0, Math.min(1, wasser));
  if (h > 0.3) rr(c, x - 2.4, y + 14.2 - h, 4.8, h, 0.9, "rgba(105,175,228,.78)");
  c.strokeStyle = "rgba(255,255,255,.68)"; c.lineWidth = 0.6;
  c.strokeRect(x - 3, y + 0.4, 6, 14.4);
  rr(c, x - 3.3, y - 1.1, 6.6, 1.8, 0.9, VIOLETT_DUNKEL);
  c.fillStyle = "rgba(255,255,255,.75)"; c.fillRect(x + 1.3, y + 2.4, 1.4, 0.55);
}

/** Die Senseo auf Brusthöhe: Tank links, geschwungene violette Säule, drei Knöpfe, Tropfschale. */
export function drawSenseo(c: C, F: number, s: KaffeeStand, t: number) {
  const x = SENSEO_X;
  // Tank hinten links (wenn eingesetzt)
  if (s.tank === "maschine") drawTank(c, x + 2, F - 57, s.tankWasser);
  // Geschwungene Säule und Fußplatte
  rr(c, x + 15, F - 56, 9.5, 14, 2.8, VIOLETT);
  rr(c, x + 16, F - 54.5, 1.8, 11, 0.9, "rgba(255,255,255,.16)");
  rr(c, x + 5, F - 43.4, 20, 3.4, 1.5, VIOLETT_DUNKEL);
  rr(c, x + 7.2, F - 43.9, 12.2, 1.3, 0.6, "#9aa4b0");     // Metall-Tropfgitter
  // Brühkopf
  rr(c, x + 5.5, F - 58.6, 19.5, 6.4, 2.6, VIOLETT);
  rr(c, x + 6.5, F - 58.0, 17.5, 1.2, 0.6, VIOLETT_HELL);
  // Deckel mit Verschlussbügel: geschlossen flach, offen hochgeklappt
  const a = s.deckel * 1.12;
  c.save();
  c.translate(x + 23.5, F - 58.4);
  c.rotate(-a);
  rr(c, -17, -2.3, 17, 2.5, 1.1, VIOLETT_HELL);
  rr(c, -12, -3.4, 5, 1.4, 0.7, "#d8d0e4");
  c.restore();
  if (s.deckel > 0.3) {
    // Padhalter sichtbar, mit altem oder neuem Pad
    rr(c, x + 8.5, F - 57.6, 12, 1.8, 0.9, "#2a1a3c");
    if (s.padAlt) { c.beginPath(); c.ellipse(x + 12.5, F - 57.2, 3.2, 1.2, 0, 0, Math.PI * 2); c.fillStyle = "#5a3a24"; c.fill(); }
    if (s.padNeu) { c.beginPath(); c.ellipse(x + 12.5, F - 57.2, 3.2, 1.2, 0, 0, Math.PI * 2); c.fillStyle = "#f1e6cf"; c.fill(); }
  }
  // Doppel-Auslauf
  rr(c, x + 9.5, F - 52.4, 6, 2.2, 0.9, "#2a1a3c");
  // Drei Knöpfe vorn am Brühkopf: links 1 Tasse, Mitte Power + rote Lampe, rechts 2 Tassen
  kreis(c, x + 9, F - 55.5, 1.25, "#e9e3f0");
  kreis(c, x + 16, F - 55.5, 1.25, "#e9e3f0");
  kreis(c, x + 12.5, F - 55.5, 1.45, "#d9d2e2");
  const lampe = s.bereit || ((s.an || s.laeuft) && Math.sin(t * 6) > 0);
  kreis(c, x + 12.5, F - 55.5, 0.88, s.bereit ? "#ff3b30" : lampe ? "#ff6254" : "#7a6a80");
  if (lampe) kreis(c, x + 12.5, F - 55.5, 2.5, "rgba(255,60,48,.26)");
  // Kaffeestrahl
  if (s.laeuft) {
    c.fillStyle = "rgba(92,52,24,.88)";
    const wackel = Math.sin(t * 23) * 0.2;
    c.fillRect(x + 11.6 + wackel, F - 50.2, 0.85, 7.2);
    c.fillRect(x + 12.9 - wackel, F - 50.2, 0.85, 7.2);
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

const weichTuer = (v: number) => {
  const q = Math.max(0, Math.min(1, v));
  return q * q * (3 - 2 * q);
};

/** Griffposition auf dem realen Drehkreis der rechten Unterschranktür (Angel rechts bei 688.5). */
export function schrankGriffPos(F: number, offen: number): Pt {
  const ang = weichTuer(offen) * 1.98;
  return [688.5 - 20.5 * Math.cos(ang), F - 22 + Math.sin(ang) * 1.4];
}

/** Griffposition auf dem realen Drehkreis der Spülentür (Angel links bei 615.5). */
export function muellGriffPos(F: number, offen: number): Pt {
  const ang = weichTuer(offen) * 1.98;
  return [615.5 + 21.5 * Math.cos(ang), F - 22 + Math.sin(ang) * 1.4];
}

/** Griffposition auf dem realen Drehkreis der Kühlschranktür (Angel rechts bei 612). */
export function kuehlGriffPos(F: number, offen: number): Pt {
  const ang = weichTuer(offen) * 2.02;
  return [612 - 33 * Math.cos(ang), F - 58 + Math.sin(ang) * 1.6];
}

/** Dreht ein Schranktürblatt kontinuierlich um seine Angel (ohne Sprung von 0° über 90° bis ~114°). */
function drehTuerBlatt(
  c: C, angelX: number, oben: number, unten: number, breite: number,
  offen: number, rechtsAngel: boolean, aussenFarbe: string, innenFarbe: string,
) {
  const e = weichTuer(offen);
  const ang = e * 1.98;
  const cosA = Math.cos(ang), sinA = Math.sin(ang);
  const vorz = rechtsAngel ? -1 : 1;
  const freiX = angelX + vorz * breite * cosA;
  const persp = sinA * 2.1;
  const kante = sinA * 2.0 * (rechtsAngel ? 1 : -1);
  const zeigtInnen = cosA < 0;
  // Stirnkante des Türblatts während der Drehung zum Betrachter
  c.fillStyle = "rgba(24,34,40,.42)";
  c.beginPath();
  c.moveTo(freiX, oben + persp);
  c.lineTo(freiX + kante, oben + persp + 0.3);
  c.lineTo(freiX + kante, unten + persp - 0.3);
  c.lineTo(freiX, unten + persp);
  c.closePath(); c.fill();
  // Hauptfläche des Türblatts (außen bis 90°, danach helle Innenseite)
  c.fillStyle = zeigtInnen ? innenFarbe : aussenFarbe;
  c.beginPath();
  c.moveTo(angelX, oben);
  c.lineTo(freiX, oben + persp);
  c.lineTo(freiX, unten + persp);
  c.lineTo(angelX, unten);
  c.closePath(); c.fill();
  // Dezente Licht-/Schattenkante und Griffknopf
  c.strokeStyle = zeigtInnen ? "rgba(60,74,80,.28)" : "rgba(255,255,255,.16)";
  c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(freiX, oben + persp); c.lineTo(freiX, unten + persp); c.stroke();
  if (!zeigtInnen && Math.abs(cosA) > 0.14) {
    const gx = angelX + vorz * (breite - 3.2) * cosA;
    const gy = oben + 13 + persp * 0.85;
    kreis(c, gx, gy, Math.max(0.7, 1.25 * Math.abs(cosA)), "#cfd8dc");
  }
}

/** Rechter Unterschrank: offen mit weißem Innenraum und Inhalt (Kaffee und Tee). */
export function drawSchrankRechts(c: C, F: number, offen: number, s: KaffeeStand, festlich = false) {
  if (offen <= 0.004) return;
  const e = weichTuer(offen);
  const x0 = 666, x1 = 688.8, oben = F - 35;
  c.save();
  // Innenraum weiß, damit der Inhalt klar erkennbar ist
  c.fillStyle = "#f7f9f7"; c.fillRect(x0, oben, x1 - x0, 35);
  c.fillStyle = "#d8dee0"; c.fillRect(x0, F - 18, x1 - x0, 1.4);   // Fachboden
  c.fillStyle = "#c9d2d4"; c.fillRect(x0, F - 2, x1 - x0, 2);      // unterer Rand
  c.fillStyle = "#e3e9e9"; c.fillRect(x0, oben, x1 - x0, 2);       // obere Kante
  c.fillStyle = "rgba(60,72,78,.18)"; c.fillRect(x0, oben, 1.8, 35); c.fillRect(x1 - 1.8, oben, 1.8, 35);
  // oberes Fach: Pad-Dose, Tassen
  if (s.dose === "zuhause") drawPadDose(c, 671, F - 18.6);
  for (let i = 0; i < 2; i++) drawTasse(c, 680 + i * 5, F - 18.6);
  // unteres Fach: Teekanne, Teedosen, Teebeutel, Holzstäbchen im Glas
  if (s.kanne === "schrank") drawKanneKlein(c, 671, F - 2);
  rr(c, 677, F - 9, 3.4, 7, 0.8, "#4e7a5a");
  rr(c, 681, F - 8, 3.4, 6, 0.8, "#a8483e");
  rr(c, 685, F - 6, 3, 4, 0.6, "#efe3c4");                       // Teebeutel-Schachtel
  c.fillStyle = "rgba(180,210,225,.65)"; c.fillRect(685.2, F - 13, 2.6, 7);   // Glas
  c.strokeStyle = "#b88644"; c.lineWidth = 0.6;
  for (const dx of [0.6, 1.3, 2]) { c.beginPath(); c.moveTo(685.2 + dx, F - 6.5); c.lineTo(685.2 + dx, F - 15); c.stroke(); }
  // Sanfter Innenschatten, der beim Öffnen verschwindet
  if (e < 0.98) {
    c.fillStyle = `rgba(18,28,34,${0.42 * (1 - e)})`;
    c.fillRect(x0, oben, x1 - x0, 35);
  }
  c.restore();
  const aussen = festlich ? "#62726b" : "#3f5a6b";
  const innen = festlich ? "#d8dfd9" : "#dce5e8";
  drehTuerBlatt(c, x1, F - 36, F, x1 - x0, offen, true, aussen, innen);
}

/** Tür unter der Spüle offen: weißer Innenraum, Siphon und Mülleimer sichtbar. */
export function drawMuell(c: C, F: number, offen: number, festlich = false) {
  if (offen <= 0.004) return;
  const e = weichTuer(offen);
  const x0 = 615.2, x1 = 639.6, oben = F - 35;
  c.save();
  c.fillStyle = "#f7f9f7"; c.fillRect(x0, oben, x1 - x0, 35);
  c.fillStyle = "#c9d2d4"; c.fillRect(x0, F - 2, x1 - x0, 2);
  c.fillStyle = "#e3e9e9"; c.fillRect(x0, oben, x1 - x0, 2);
  c.fillStyle = "rgba(60,72,78,.18)"; c.fillRect(x0, oben, 1.8, 35); c.fillRect(x1 - 1.8, oben, 1.8, 35);
  // Siphon
  c.strokeStyle = "#8d9ca3"; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(632, oben); c.lineTo(632, F - 26); c.quadraticCurveTo(632, F - 22, 628, F - 22); c.stroke();
  // Eimer deutlich abgesetzt vor dem weißen Schrankboden
  rr(c, 620, F - 16, 12, 15.5, 1.6, "#4d6b5a");
  rr(c, 619.4, F - 17.2, 13.2, 2.2, 1, "#395244");
  if (e < 0.98) {
    c.fillStyle = `rgba(18,28,34,${0.42 * (1 - e)})`;
    c.fillRect(x0, oben, x1 - x0, 35);
  }
  c.restore();
  const aussen = festlich ? "#62726b" : "#3f5a6b";
  const innen = festlich ? "#d8dfd9" : "#dce5e8";
  drehTuerBlatt(c, x0, F - 36, F, x1 - x0, offen, false, aussen, innen);
}

/** Kühlschrank offen: Licht, Lebensmittel, fließend schwingende Tür mit Bio-Milch (rechte Angel). */
export function drawKuehlOffen(c: C, F: number, offen: number, milchDa: boolean, festlich = false) {
  if (offen <= 0.004) return;
  const e = weichTuer(offen);
  const x0 = 576, x1 = 610, oben = F - 76;
  // Innen weiß beleuchtet
  c.fillStyle = "#fbfdf8"; c.fillRect(x0, oben, x1 - x0, 74);
  const licht = c.createRadialGradient(593, oben + 8, 1, 593, oben + 14, 44);
  licht.addColorStop(0, `rgba(255,250,214,${0.82 * e})`); licht.addColorStop(1, "rgba(255,250,214,0)");
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
  if (e < 0.98) {
    c.fillStyle = `rgba(22,32,36,${0.38 * (1 - e)})`;
    c.fillRect(x0, oben, x1 - x0, 74);
  }
  // Türblatt schwingt kontinuierlich um die rechte Angel (x = 612) von 0° bis ~116°
  const angelX = 612, breite = 38;
  const ang = e * 2.02;
  const cosA = Math.cos(ang), sinA = Math.sin(ang);
  const freiX = angelX - breite * cosA;
  const persp = sinA * 2.4;
  const zeigtInnen = cosA < 0;
  const aussen = festlich ? "#e4d8c4" : "#e6ecec";
  // Stirnkante
  c.fillStyle = "#aeb8b8";
  c.beginPath();
  c.moveTo(freiX, F - 78 + persp);
  c.lineTo(freiX + sinA * 2.4, F - 78 + persp + 0.3);
  c.lineTo(freiX + sinA * 2.4, F + persp - 0.3);
  c.lineTo(freiX, F + persp);
  c.closePath(); c.fill();
  // Türfläche
  c.fillStyle = zeigtInnen ? "#eef3f2" : aussen;
  c.beginPath();
  c.moveTo(angelX, F - 78);
  c.lineTo(freiX, F - 78 + persp);
  c.lineTo(freiX, F + persp);
  c.lineTo(angelX, F);
  c.closePath(); c.fill();
  if (!zeigtInnen) {
    // Außenseite mit Gefrierfuge und Griffen verkürzt sich perspektivisch beim Aufschwingen
    c.fillStyle = "#c3d0cf";
    c.beginPath();
    c.moveTo(angelX, F - 50); c.lineTo(freiX, F - 50 + persp);
    c.lineTo(freiX, F - 47 + persp); c.lineTo(angelX, F - 47);
    c.closePath(); c.fill();
    if (cosA > 0.12) {
      const hx = angelX - 33 * cosA, hw = Math.max(0.9, 3 * cosA);
      c.fillStyle = "#93a5a4";
      c.fillRect(hx, F - 70 + persp * 0.86, hw, 14);
      c.fillRect(hx, F - 44 + persp * 0.86, hw, 12);
    }
  } else {
    // Innenseite mit Dichtung, Türfach und Bio-Milch
    const dx = freiX - angelX;
    c.strokeStyle = "#cfd8d7"; c.lineWidth = 0.9;
    c.strokeRect(angelX + 0.8, F - 76, Math.max(1, dx - 1.6), 73);
    if (dx > 5) {
      if (milchDa) {
        c.save();
        c.translate(angelX + dx * 0.52, F - 40.6 + persp * 0.5);
        c.scale(Math.min(1, dx / 13), 1);
        drawMilch(c, 0, 0);
        c.restore();
      }
      c.fillStyle = "rgba(185,208,214,.82)";
      c.fillRect(angelX + 1.2, F - 41.5 + persp * 0.5, dx - 2.2, 2.2);
    }
  }
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
