/* =======================================================================
   TELEFLAUSCHI · GRUNDLAGEN
   Namen, Maße, Wirkungen und Klänge für alles, was sich in Flauschis
   Weihnachtszimmer anklicken lässt: sie selbst und ihre Gegenstände.
   Reine Daten und kleine Zeichenhelfer – ohne Zustand, ohne Haus.

   Jeder Gegenstand gehört zu einem Adventstürchen. Solange
   FLAUSCHI_VORSCHAU_ALLE = true ist, steht alles schon im Zimmer (wie bei
   der Hausdeko); mit false erscheint ein Gegenstand erst, wenn sein
   Türchen geöffnet wurde.
   ======================================================================= */

import { ADVENT_NACH_DATUM } from "./advent";

export type C = CanvasRenderingContext2D;

export type FlauschiAktion = "fuettern" | "streicheln" | "spielen" | "schlafen";
/** Flauschi direkt anfassen: Kopf, Bauch, Nase, Pfote, Bommel. */
export type FlauschiAnfassen = "kraulen" | "kitzeln" | "nase" | "pfote" | "bommel";
export type FlauschiDingId =
  | "napf" | "buerste" | "ball" | "decke" | "laterne"
  | "grammophon" | "pferd" | "kranz" | "gloeckchen" | "bahn" | "schneekugel"
  | "nussknacker" | "fernseher" | "wanne" | "blech" | "baum";
/** Alles Anklickbare im Zimmer: Flauschi selbst und ihre Gegenstände. */
export type FlauschiBeruehrung = FlauschiAnfassen | FlauschiDingId;
export type FlauschiTun = FlauschiAktion | FlauschiBeruehrung | "waermen" | "auspacken";

/** Vorschau: alle Gegenstände zeigen, als wären alle Türchen schon geöffnet. */
export const FLAUSCHI_VORSCHAU_ALLE = false;

/** Ein synthetischer Ton: Frequenz, Dauer, Wellenform, Pegel, Startzeit, Zielfrequenz. */
export type FlauschiTon = readonly [f: number, dauer: number, form: "sine" | "square" | "triangle", pegel: number, wann: number, f2?: number];

export interface FlauschiWirkung {
  /** Dauer der Bewegung in Sekunden. */
  dauer: number;
  hunger?: number;
  muede?: number;
  sauber?: number;
  beschaeftigt?: number;
  /** Punkte. */
  flocken: number;
  klang: readonly FlauschiTon[];
}

export interface FlauschiDing extends FlauschiWirkung {
  id: FlauschiDingId;
  label: string;
  /** Adventstürchen, das den Gegenstand bringt. */
  tuer: number;
  /** Klickfläche im Zimmer (720×300 Einheiten, deckungsgleich mit der Vergrößerung). */
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ------------------------------ Helfer -------------------------------- */

export const TAU = Math.PI * 2;

/** Deterministisches Rauschen aus einer Zahl – für gleichmäßigen Flaum. */
export function rnd(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Weicher Übergang 0…1. */
export function weich(v: number): number {
  return v * v * (3 - 2 * v);
}

export function ell(c: C, x: number, y: number, rx: number, ry: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU);
  c.fill();
}

export function kreis(c: C, x: number, y: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.arc(x, y, Math.max(0.01, r), 0, TAU);
  c.fill();
}

export function linie(c: C, x0: number, y0: number, x1: number, y1: number, f: string, b = 1) {
  c.strokeStyle = f;
  c.lineWidth = b;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
}

/** Kleines Herz mit der Spitze nach unten; (x, y) ist die Mitte. */
export function herz(c: C, x: number, y: number, g: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(x, y + g);
  c.bezierCurveTo(x - g * 1.5, y - g * 0.1, x - g * 0.75, y - g * 1.25, x, y - g * 0.45);
  c.bezierCurveTo(x + g * 0.75, y - g * 1.25, x + g * 1.5, y - g * 0.1, x, y + g);
  c.fill();
}

/** Wo Flauschi in einer Bildfläche steht: Standpunkt und Maßstab. Zimmer und Klickziele teilen sich das. */
export function flauschiPlatz(x: number, y: number, w: number, h: number) {
  return { fx: x + w * 0.44, fy: y + h * 0.78, s: h / 170 };
}

/* ------------------------------- Klänge -------------------------------- */

/**
 * „O Tannenbaum“ (Volksweise, gemeinfrei) – die erste Zeile für das
 * Grammophon, als [Frequenz, Schläge]. Rein synthetisch, keine Audiodatei.
 */
const LIED_NOTEN: readonly (readonly [number, number])[] = [
  [261.63, 1],
  [349.23, 0.75], [349.23, 0.25], [349.23, 1.5], [392.0, 0.5],
  [440.0, 0.75], [440.0, 0.25], [440.0, 1.5], [440.0, 0.5],
  [392.0, 0.5], [440.0, 0.5], [466.16, 1], [329.63, 1],
  [392.0, 1], [349.23, 1.4],
];

export const FLAUSCHI_LIED: readonly FlauschiTon[] = (() => {
  const schlag = 0.4;
  const toene: FlauschiTon[] = [];
  let wann = 0;
  for (const [f, schlaege] of LIED_NOTEN) {
    toene.push([f, schlaege * schlag * 0.92, "triangle", 0.11, wann]);
    wann += schlaege * schlag;
  }
  return toene;
})();

/* --------------------------- Flauschi anfassen ---------------------------- */

export const FLAUSCHI_ANFASSEN: Record<FlauschiAnfassen, FlauschiWirkung> = {
  kraulen: { dauer: 2.2, beschaeftigt: 8, flocken: 2, klang: [[620, 0.12, "sine", 0.14, 0, 880], [880, 0.14, "sine", 0.09, 0.1, 1180]] },
  kitzeln: {
    dauer: 1.8, beschaeftigt: 12, muede: 3, flocken: 3,
    klang: [[784, 0.07, "triangle", 0.12, 0], [988, 0.07, "triangle", 0.12, 0.08], [784, 0.07, "triangle", 0.1, 0.16], [1175, 0.1, "triangle", 0.12, 0.24]],
  },
  nase: { dauer: 1.7, beschaeftigt: 5, flocken: 2, klang: [[900, 0.5, "sine", 0.05, 0, 1500], [1300, 0.09, "triangle", 0.1, 0.68, 420], [240, 0.12, "square", 0.05, 0.7, 110]] },
  pfote: { dauer: 1.5, beschaeftigt: 5, flocken: 2, klang: [[1100, 0.04, "square", 0.06, 0.32], [1650, 0.12, "sine", 0.07, 0.36]] },
  bommel: { dauer: 2.2, beschaeftigt: 6, flocken: 2, klang: [[300, 0.18, "sine", 0.12, 0, 620], [620, 0.2, "sine", 0.08, 0.17, 300], [300, 0.16, "sine", 0.06, 0.36, 520]] },
};

/** Leises Rascheln, wenn Flauschi im Schlaf zugedeckt wird. */
export const FLAUSCHI_DECKE_KLANG: readonly FlauschiTon[] = [[520, 0.2, "sine", 0.07, 0, 392], [392, 0.3, "sine", 0.06, 0.18, 330]];

/* ----------------------------- Gegenstände ------------------------------ */

/**
 * Die Gegenstände in Flauschis Zimmer, von links nach rechts (so wird auch
 * durchgeschaltet). Jede Klickfläche ist mindestens 24×24 groß und liegt im
 * sicheren Bildbereich über dem Balken-Interface.
 */
export const FLAUSCHI_DINGE: readonly FlauschiDing[] = [
  // Grundausstattung aus den Türchen 1–5 – an Türchen 6 kommt das Spiel selbst.
  { id: "napf", label: "Futternapf", tuer: 1, x: 420, y: 232, w: 36, h: 26, dauer: 2.6, hunger: 42, beschaeftigt: 4, flocken: 3, klang: [[523, 0.09, "triangle", 0.1, 0], [659, 0.09, "triangle", 0.1, 0.09], [784, 0.16, "triangle", 0.1, 0.18]] },
  {
    id: "buerste", label: "Bürste", tuer: 2, x: 352, y: 120, w: 26, h: 36, dauer: 2.4, sauber: 30, beschaeftigt: 12, flocken: 3,
    klang: [[700, 0.1, "sine", 0.1, 0, 990], [990, 0.12, "sine", 0.07, 0.1, 1320]],
  },
  {
    id: "ball", label: "Spielball", tuer: 3, x: 394, y: 236, w: 24, h: 24, dauer: 3.2, beschaeftigt: 26, muede: 4, flocken: 4,
    klang: [[392, 0.08, "triangle", 0.1, 0], [587, 0.08, "triangle", 0.1, 0.1], [784, 0.14, "triangle", 0.1, 0.2]],
  },
  { id: "decke", label: "Minidecke", tuer: 4, x: 150, y: 236, w: 42, h: 24, dauer: 2, beschaeftigt: 4, flocken: 2, klang: [[440, 0.25, "sine", 0.07, 0, 349], [349, 0.35, "sine", 0.06, 0.22, 294]] },
  { id: "laterne", label: "Laterne", tuer: 5, x: 300, y: 64, w: 24, h: 34, dauer: 1.6, beschaeftigt: 4, flocken: 2, klang: [[1047, 0.3, "sine", 0.06, 0], [1568, 0.4, "sine", 0.04, 0.1]] },

  { id: "grammophon", label: "Grammophon", tuer: 12, x: 22, y: 128, w: 70, h: 84, dauer: 5.4, beschaeftigt: 22, muede: 2, flocken: 4, klang: FLAUSCHI_LIED },
  {
    id: "pferd", label: "Schaukelpferd", tuer: 13, x: 98, y: 176, w: 84, h: 54, dauer: 4.4, beschaeftigt: 24, muede: 5, flocken: 4,
    klang: [[392, 0.1, "triangle", 0.1, 0], [523, 0.1, "triangle", 0.1, 0.12], [659, 0.18, "triangle", 0.1, 0.24]],
  },
  { id: "kranz", label: "Adventskranz", tuer: 17, x: 112, y: 124, w: 50, h: 36, dauer: 3.2, beschaeftigt: 8, flocken: 2, klang: [[880, 0.3, "sine", 0.07, 0], [1320, 0.45, "sine", 0.05, 0.12]] },
  {
    id: "bahn", label: "Eisenbahn", tuer: 19, x: 196, y: 232, w: 60, h: 26, dauer: 6, beschaeftigt: 30, muede: 6, flocken: 5,
    klang: [[466, 0.2, "square", 0.045, 0], [466, 0.42, "square", 0.045, 0.28], [392, 0.42, "square", 0.03, 0.28]],
  },
  {
    id: "gloeckchen", label: "Glöckchen", tuer: 15, x: 236, y: 40, w: 28, h: 44, dauer: 2.4, beschaeftigt: 5, flocken: 2,
    klang: [[1568, 0.5, "sine", 0.12, 0], [2093, 0.4, "sine", 0.05, 0], [1568, 0.5, "sine", 0.1, 0.32], [2093, 0.4, "sine", 0.04, 0.32]],
  },
  {
    id: "schneekugel", label: "Schneekugel", tuer: 8, x: 410, y: 60, w: 36, h: 42, dauer: 5, beschaeftigt: 10, muede: 8, flocken: 3,
    klang: [[1319, 0.4, "sine", 0.06, 0], [1568, 0.4, "sine", 0.05, 0.18], [2093, 0.6, "sine", 0.04, 0.36]],
  },
  {
    id: "nussknacker", label: "Nussknacker", tuer: 14, x: 456, y: 40, w: 30, h: 62, dauer: 3, hunger: 12, beschaeftigt: 6, flocken: 3,
    klang: [[190, 0.05, "square", 0.12, 1.0], [95, 0.07, "square", 0.1, 1.06], [190, 0.05, "square", 0.1, 1.5]],
  },
  { id: "fernseher", label: "Mini-Fernseher", tuer: 20, x: 498, y: 46, w: 64, h: 54, dauer: 5, beschaeftigt: 16, muede: 6, flocken: 3, klang: [[660, 0.08, "square", 0.04, 0], [880, 0.1, "square", 0.04, 0.1]] },
  {
    id: "wanne", label: "Zinkwanne", tuer: 18, x: 462, y: 204, w: 88, h: 52, dauer: 5, sauber: 45, beschaeftigt: 8, flocken: 4,
    klang: [[420, 0.1, "sine", 0.08, 0.7, 880], [520, 0.1, "sine", 0.07, 0.95, 1040], [460, 0.1, "sine", 0.07, 1.3, 940], [600, 0.1, "sine", 0.06, 1.7, 1200]],
  },
  { id: "blech", label: "Plätzchenblech", tuer: 7, x: 554, y: 204, w: 50, h: 52, dauer: 4, beschaeftigt: 12, muede: 4, flocken: 4, klang: [[1760, 0.5, "sine", 0.08, 2.3], [2217, 0.4, "sine", 0.04, 2.3]] },
  {
    id: "baum", label: "Weihnachtsbaum", tuer: 24, x: 612, y: 90, w: 88, h: 166, dauer: 3.2, beschaeftigt: 10, flocken: 3,
    klang: [[1047, 0.2, "sine", 0.07, 2.1], [1319, 0.2, "sine", 0.06, 2.22], [1568, 0.4, "sine", 0.06, 2.34]],
  },
];

/** Steht der Gegenstand schon im Zimmer? In der Vorschau immer, sonst nach seinem Türchen. */
export function flauschiDingDa(ding: FlauschiDing, offen: number[]): boolean {
  return FLAUSCHI_VORSCHAU_ALLE || offen.includes(ding.tuer);
}

export function flauschiWirkung(art: FlauschiBeruehrung): FlauschiWirkung {
  return FLAUSCHI_DINGE.find((d) => d.id === art) ?? FLAUSCHI_ANFASSEN[art as FlauschiAnfassen];
}

/** Dauer jeder Aktion oder Berührung in Sekunden (0 = läuft ohne Uhr, z. B. Schlafen). */
export function flauschiDauer(tun: FlauschiTun): number {
  if (tun === "waermen") return 1.2;
  if (tun === "auspacken") return 1;
  if (tun === "fuettern") return 2.6;
  if (tun === "streicheln") return 2.4;
  if (tun === "spielen") return 3.2;
  if (tun === "schlafen") return 0;
  return flauschiWirkung(tun).dauer;
}

/** Alle gültigen Aktionsnamen – für das sichere Lesen alter Speicherstände. */
export const FLAUSCHI_TUN: readonly FlauschiTun[] = [
  "fuettern", "streicheln", "spielen", "schlafen", "waermen", "auspacken",
  "kraulen", "kitzeln", "nase", "pfote", "bommel",
  ...FLAUSCHI_DINGE.map((d) => d.id),
];

/* ---------------------------- Echter Advent ----------------------------- */

const BERLIN_TAG = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
});

/**
 * Wie viele Kerzen am Adventskranz brennen dürfen (0–4): eine pro bereits
 * erreichtem Adventssonntag, gerechnet nach dem echten Kalender in
 * Europe/Berlin. Der 4. Advent ist der letzte Sonntag vor dem 25. Dezember.
 * Im Prototyp (alle Türchen frei) brennen immer alle vier.
 */
export function adventsKerzen(jetzt: number, nachDatum: boolean = ADVENT_NACH_DATUM): number {
  if (!nachDatum) return 4;
  const [jahr, monat, tag] = BERLIN_TAG.format(jetzt).split("-").map(Number);
  const vierter = 24 - new Date(Date.UTC(jahr, 11, 24)).getUTCDay();
  const heute = Date.UTC(jahr, monat - 1, tag);
  let kerzen = 0;
  for (let i = 0; i < 4; i++) if (heute >= Date.UTC(jahr, 11, vierter - 21 + i * 7)) kerzen++;
  return kerzen;
}
