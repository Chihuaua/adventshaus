/* =======================================================================
   TAGESROUTINE – was Luni über den Tag von selbst tut

   Alles läuft nach echter Berliner Uhr: Mittagessen vor dem Fernseher
   zwischen 12 und 13 Uhr, um 17 Uhr eine Futterpause für die Hunde und
   danach Videospiel bis 18 Uhr, um 18:30 der Hundeauslass (zugleich
   Rauchpause). Aufgewacht wird sechs bis acht Stunden nach dem
   Einschla­fen, in der Regel zwischen 6:00 und 7:30 – danach holt sie die
   Weste aus dem Kleiderschrank und zieht sie über den Schlafanzug.

   Die Werte je Tag stehen hier fest (kein Zufall zur Laufzeit), damit
   derselbe Kalendertag nach dem Neuladen denselben Ablauf ergibt.
   ======================================================================= */

type C = CanvasRenderingContext2D;
export type HundId = "odin" | "apollo";

/** Uhrfenster in Tagessekunden. */
export const TAGES_ZEITEN = {
  /** Mittagessen vor dem Fernseher, Beginn zufällig im Fenster. */
  essen: [12 * 3600, 13 * 3600] as const,
  /** Futterpause: Videospiel unterbrechen und die Hunde füttern. */
  fuettern: 17 * 3600,
  /** Danach spielt sie bis hier weiter. */
  spielenBis: 18 * 3600,
  /** Hundeauslass, zugleich Rauchpause. */
  auslass: (18 * 60 + 30) * 60,
  /** Frühester und spätester regulärer Aufwachtermin. */
  aufwach: [6 * 3600, (7 * 60 + 30) * 60] as const,
  /** Spätester Termin für die morgendliche Weste. */
  westeBis: 11 * 3600,
  /** Ab dieser Sekunde gehören die Termine des Abends dazu. */
  abendAb: 19 * 3600,
} as const;

/** Dauern in echten Sekunden (Echtzeit) bzw. Sekundenbruchteile für die Probe. */
export const TAGES_DAUERN = {
  /** Am Schrank: Tür auf, Weste heraus, überziehen, Tür zu. */
  weste: 26,
  /** Essen vor dem Fernseher. */
  essen: 21 * 60,
  /** Näpfe füllen (Futter und Wasser je Hund). */
  fuettern: 30,
  /** Auslass im Garten, zugleich gerauchte Zigarette. */
  auslass: 4 * 60,
} as const;

/** Kurze Probe über den Tag-Stein: alles in wenigen Sekunden. */
export const TAGES_PROBE = {
  weste: 6, essen: 12, fuettern: 8, auslass: 10,
} as const;

export interface Tageswerte {
  /** Tagessekunde des Mittagessens. */
  essenSek: number;
  /** Tagessekunde des Hundeauslasses. */
  auslassSek: number;
  /** Stunden Ruhe, 6 bis 8. */
  schlafStunden: number;
  /** Aufwachtermin in der Spanne 6:00–7:30 (0..1). */
  aufwachAnteil: number;
  /** Zwischen zwei Rauchpausen vergeht mindestens diese Zeit (Sekunden). */
  rauchAbstand: number;
}

/** Pro Berliner Kalendertag und Welt dieselbe Rechnung. */
export function tageswerte(tag: number, welt: string): Tageswerte {
  let saat = (Math.imul(tag, 2246822519) ^ (welt === "weihnacht" ? 0x9e3779b1 : 0x85ebca6b)) >>> 0;
  const w = () => {
    saat = (Math.imul(saat, 1664525) + 1013904223) >>> 0;
    return saat / 4294967296;
  };
  const spanne = TAGES_ZEITEN.essen[1] - TAGES_ZEITEN.essen[0];
  return {
    essenSek: TAGES_ZEITEN.essen[0] + Math.round(w() * spanne),
    auslassSek: TAGES_ZEITEN.auslass + Math.round(w() * 240),
    schlafStunden: 6 + Math.round(w() * 2),
    aufwachAnteil: w(),
    rauchAbstand: 2100 + Math.round(w() * 1800),
  };
}

/**
 * Aufwachtermin: sechs bis acht Stunden nach dem Einschlafen, aber nie vor
 * 6:00 und in der Regel nicht nach 7:30. Wer erst nach Mitternacht
 * einschläft, ruht trotzdem die vollen sechs bis acht Stunden.
 */
export function aufwachSekunde(einschlafSek: number, w: Tageswerte): number {
  const regel = TAGES_ZEITEN.aufwach[0] + Math.round(w.aufwachAnteil * (TAGES_ZEITEN.aufwach[1] - TAGES_ZEITEN.aufwach[0]));
  const pause = einschlafSek + w.schlafStunden * 3600;
  return Math.max(regel, pause) % 86400;
}

/* ------------------------------ Hundenäpfe ------------------------------ */

/** Näpfe in der Küche, am Boden unter der Arbeitszeile. */
export const NAPF_ORTE: Record<HundId, { futterX: number; wasserX: number; y: number }> = {
  odin: { futterX: 622, wasserX: 644, y: 446 },
  apollo: { futterX: 662, wasserX: 684, y: 446 },
};

/** So viel Futter steht noch im Napf (0 = leer, 1 = voll). */
export type NapfStand = Record<HundId, number>;

const NAPF_RAND = "#b9bec4";
const NAPF_INNEN = "#8d939a";
const FUTTER = "#7a5230";
const FUTTER_DUNKEL = "#5d3c21";
const WASSER = "#7fb6c9";

/** Ein Napf von schräg oben: ovaler Rand, elliptische Öffnung, Füllung. */
export function drawNapf(c: C, x: number, y: number, wasser: boolean, fuellung: number) {
  const rx = 9, ry = 3.4;
  // Untere Schale
  c.beginPath();
  c.ellipse(x, y + 1.4, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = NAPF_INNEN;
  c.fill();
  // Öffnung
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = wasser ? WASSER : NAPF_INNEN;
  c.fill();
  if (!wasser && fuellung > 0.02) {
    // Futterhaufen wächst von der Mitte nach außen
    const r = rx * 0.86 * fuellung;
    c.beginPath();
    c.ellipse(x, y, Math.max(1, r), Math.max(0.6, ry * 0.86 * fuellung), 0, 0, Math.PI * 2);
    c.fillStyle = FUTTER;
    c.fill();
    c.beginPath();
    c.ellipse(x, y - 0.6, Math.max(0.6, r * 0.6), Math.max(0.35, ry * 0.5 * fuellung), 0, 0, Math.PI * 2);
    c.fillStyle = FUTTER_DUNKEL;
    c.fill();
  }
  // Rand oben und unten
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, Math.PI, Math.PI * 2);
  c.strokeStyle = NAPF_RAND;
  c.lineWidth = 1.5;
  c.stroke();
  c.beginPath();
  c.ellipse(x, y + 1.4, rx, ry, 0, 0, Math.PI);
  c.strokeStyle = "#7f858b";
  c.lineWidth = 1.2;
  c.stroke();
}

/** Beide Näpfe eines Hundes: Futter hinten, Wasser davor. */
export function drawNapfPaar(c: C, id: HundId, futter: number) {
  const ort = NAPF_ORTE[id];
  drawNapf(c, ort.futterX, ort.y, false, futter);
  // Wasser bleibt immer voll
  drawNapf(c, ort.wasserX, ort.y + 2.6, true, 1);
}

/** Teller auf dem Couchtisch, solange Luni vor dem Fernseher isst. */
export function drawEssTeller(c: C, x: number, y: number, rest: number) {
  c.beginPath();
  c.ellipse(x, y, 11, 3.6, 0, 0, Math.PI * 2);
  c.fillStyle = "#e9e4d6";
  c.fill();
  c.beginPath();
  c.ellipse(x, y, 7.6, 2.3, 0, 0, Math.PI * 2);
  c.fillStyle = "#d9d2c0";
  c.fill();
  if (rest > 0.03) {
    const r = 6.4 * rest;
    c.beginPath();
    c.ellipse(x, y - 0.4, Math.max(0.8, r), Math.max(0.4, 2 * rest), 0, 0, Math.PI * 2);
    c.fillStyle = "#c98f4e";
    c.fill();
    c.beginPath();
    c.ellipse(x + 2, y - 0.8, Math.max(0.4, r * 0.34), Math.max(0.3, rest), 0, 0, Math.PI * 2);
    c.fillStyle = "#a86b32";
    c.fill();
  }
}
