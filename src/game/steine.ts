/* =======================================================================
   WECHSELSTEINE

   Vier Steine, vier Hauswelten – jeder Stein sieht anders aus:
     Wachstein       (Sonne, warmes Grün)         -> normales Haus
     Traumstein      (Mondsichel, kühles Blau)    -> Traumhaus
     Horrorstein     (Totenkopf, Schwarz/Glut)    -> Gruselhaus
     Weihnachtsstein (Tannenbaum/Stern, Rot/Gold) -> Weihnachtshaus

   In jeder Welt stehen die drei Steine der jeweils anderen Welten. Sie sind
   halb in die Erde links neben dem Keller eingelassen, sichtbare und
   ausreichend große Ziele (kein verstecktes Pixelportal).
   ======================================================================= */

import type { WeltId } from "./welten";
import type { RenoRaumId } from "./renovierung";
import { TV_SENDUNGEN, TV_SENDUNG_NAMEN, type TVSendungId } from "./tv-sendungen";

type C = CanvasRenderingContext2D;
type Rect4 = [number, number, number, number];

/** Die neun Raum-Steine im linken Kiesteil (Dachgeschoss bis Keller). */
export type RaumSteinArt =
  | "musikzimmer"
  | "gaming"
  | "schlafzimmer"
  | "badezimmer"
  | "treppenhaus"
  | "flur"
  | "wohnzimmer"
  | "kueche"
  | "keller";

/** Die 12 TV-Sendungs-Steine (Kontrollknöpfe unter den Welten & Kochsteinen). */
export type TvSteinArt = `tv_${TVSendungId}`;

export type SteinArt =
  | "wach" | "traum" | "horror" | "weihnacht" | "advent"
  | "bote" | "kranz" | "nikolaus" | "bett" | "ezbett" | "aufsteh" | "ezaufsteh" | "kaffee" | "ezkaffee"
  | "morgenroutine" | "zaehne" | "pfannengericht" | "topfgericht" | "fertigpizza"
  | TvSteinArt
  | RaumSteinArt;

/** Erdreich-Platz für Welt- & Routinensteine: 24 × 24, Mittelpunkt = x+12 / yTop+12. */
const erd = (x: number, yTop: number): { x: number; y: number; hit: Rect4 } =>
  ({ x: x + 12, y: yTop + 12, hit: [x, yTop, 24, 24] });

/** Kompakter Kontroll-Platz für TV- & Spielesteine: 20 × 20, klares Symbol & Hovertext. */
const erdKlein = (x: number, yTop: number): { x: number; y: number; hit: Rect4 } =>
  ({ x: x + 10, y: yTop + 10, hit: [x, yTop, 20, 20] });

/* ---- Gruppe 1: Routinen (dicht in einer Reihe unter der Erde) ---- */
/** Acht Routinensteine nebeneinander: Bett, EZ-Bett, Aufsteh, EZ-Aufsteh, Kaffee, EZ-Kaffee, Morgenroutine, Zähne. */
export const ROUTINEN_PLAETZE: readonly { x: number; y: number; hit: Rect4 }[] =
  [98, 124, 150, 176, 202, 228, 254, 280].map((x) => erd(x, 460));

/* ---- Gruppe 2: Weltsteine (eine Reihe darunter, nach Welt sortiert) ---- */
/** Wach, Traum, Horror, Weihnacht, Advent – jeweils eigener, fester Platz. */
export const WELT_PLAETZE: readonly { x: number; y: number; hit: Rect4 }[] =
  [98, 124, 150, 176, 202].map((x) => erd(x, 486));

/** Kompatibilität: Weltsteine an ihren festen Plätzen. */
export const STEIN = WELT_PLAETZE[0];
export const STEIN_B = WELT_PLAETZE[1];
export const STEIN_C = WELT_PLAETZE[2];
export const ADVENT_STEIN = WELT_PLAETZE[4];

/** Bett-Reihe (Routinen). */
export const BETT_STEIN = ROUTINEN_PLAETZE[0];
export const EZ_BETT_STEIN = ROUTINEN_PLAETZE[1];
export const AUFSTEH_STEIN = ROUTINEN_PLAETZE[2];
export const EZ_AUFSTEH_STEIN = ROUTINEN_PLAETZE[3];
export const KAFFEE_STEIN = ROUTINEN_PLAETZE[4];
export const EZ_KAFFEE_STEIN = ROUTINEN_PLAETZE[5];
/** Der Morgenroutine-Stein: die ganze beschriebene Kette am Stück. */
export const MORGENROUTINE_STEIN = ROUTINEN_PLAETZE[6];
/** Zahnputz-Stein: die Zahn-Pflege allein, direkt im Bad. */
export const ZAHN_STEIN = ROUTINEN_PLAETZE[7];

/** Mittagsküche: drei Kochsteine in der zweiten Reihe, rechts neben den Weltsteinen. */
export const KOCH_PLAETZE: readonly { x: number; y: number; hit: Rect4 }[] =
  [228, 254, 280].map((x) => erd(x, 486));
export const PFANNE_STEIN = KOCH_PLAETZE[0];
export const TOPF_STEIN = KOCH_PLAETZE[1];
export const PIZZA_STEIN = KOCH_PLAETZE[2];

/** Gruppe 3: 12 TV-Sendungen unter den Welt- und Kochsteinen (20×20, 2 Reihen, Platz für Spiele darunter). */
export const TV_PLAETZE: readonly { x: number; y: number; hit: Rect4 }[] = [
  ...Array.from({ length: 9 }, (_, i) => erdKlein(98 + i * 23, 514)),
  ...Array.from({ length: 3 }, (_, i) => erdKlein(98 + i * 23, 537)),
];

export const TV_STEINE: readonly { art: TvSteinArt; tv: TVSendungId; label: string; platz: number }[] =
  TV_SENDUNGEN.map((tv, platz) => ({
    art: `tv_${tv}` as TvSteinArt,
    tv,
    label: `TV: ${TV_SENDUNG_NAMEN[tv]}`,
    platz,
  }));

/**
 * Linker Kiesteil (x 5..92, y 463..568): sauber im 3×3-Raster aufgeteilt
 * (9 Plätze, jeweils 27 × 33, fernsehtauglich ≥ 24 × 24, 3 px Luft dazwischen,
 * 4 px Luft bis zum Nikolausstein bei x = 96). Ein Platz für jeden Raum des Hauses.
 */
export const KIES_PLAETZE: readonly { x: number; y: number; hit: Rect4 }[] = [
  // Reihe 1 (oben): Ereignisse – Kranz, Post, Nikolaus
  { x: 18, y: 472, hit: [5, 460, 26, 24] },
  { x: 47, y: 472, hit: [34, 460, 26, 24] },
  { x: 76, y: 472, hit: [63, 460, 26, 24] },
  // Reihe 2: Dachgeschoss & Schlafzimmer
  { x: 18, y: 498, hit: [5, 486, 26, 24] },
  { x: 47, y: 498, hit: [34, 486, 26, 24] },
  { x: 76, y: 498, hit: [63, 486, 26, 24] },
  // Reihe 3: Bad, Treppenhaus, Flur
  { x: 18, y: 524, hit: [5, 512, 26, 24] },
  { x: 47, y: 524, hit: [34, 512, 26, 24] },
  { x: 76, y: 524, hit: [63, 512, 26, 24] },
  // Reihe 4 (unten): Wohnzimmer, Küche, Keller
  { x: 18, y: 550, hit: [5, 538, 26, 24] },
  { x: 47, y: 550, hit: [34, 538, 26, 24] },
  { x: 76, y: 550, hit: [63, 538, 26, 24] },
] as const;

/** Ereignisgruppe oben im Kies: Kranz, Post, Nikolaus. */
export const KRANZ_STEIN = KIES_PLAETZE[0];
export const STEIN_D = KIES_PLAETZE[1];
export const NIKOLAUS_STEIN = KIES_PLAETZE[2];

/** Feste Zuordnung der 9 Kiesplätze zu allen Räumen des Hauses. */
export const RAUM_STEINE: readonly { art: RaumSteinArt; raum: RenoRaumId; label: string; platz: number }[] = [
  { art: "musikzimmer", raum: "musik", label: "Musikzimmer", platz: 3 },
  { art: "gaming", raum: "gaming", label: "Gaming", platz: 4 },
  { art: "schlafzimmer", raum: "schlafzimmer", label: "Schlafzimmer", platz: 5 },
  { art: "badezimmer", raum: "badezimmer", label: "Badezimmer", platz: 6 },
  { art: "treppenhaus", raum: "treppenhaus", label: "Treppenhaus", platz: 7 },
  { art: "flur", raum: "flur", label: "Flur", platz: 8 },
  { art: "wohnzimmer", raum: "wohnzimmer", label: "Wohnzimmer", platz: 9 },
  { art: "kueche", raum: "kueche", label: "Küche", platz: 10 },
  { art: "keller", raum: "keller", label: "Keller", platz: 11 },
] as const;

/** Musikzimmer-Stein (Platz 1 links im Kiesteil): startet den Tapetenwechsel „Bahn für Bahn“. */
export const MUSIKZIMMER_STEIN: { x: number; y: number; hit: Rect4 } = KIES_PLAETZE[0];

const ZIEL_ART: Record<WeltId, SteinArt> = {
  normal: "wach",
  traum: "traum",
  gruesel: "horror",
  weihnacht: "weihnacht",
  adventshaus: "advent",
};

export const STEIN_NAMEN: Record<SteinArt, string> = {
  wach: "Wach",
  traum: "Traum",
  horror: "Horror",
  weihnacht: "Weihnacht",
  advent: "Advent",
  bote: "Post",
  kranz: "Kranz",
  nikolaus: "Nikolaus",
  bett: "Bett",
  ezbett: "EZ-Bett",
  aufsteh: "Aufsteh",
  kaffee: "Kaffee",
  ezkaffee: "EZ-Kaffee",
  ezaufsteh: "EZ-Aufsteh",
  morgenroutine: "Morgenroutine",
  zaehne: "Zähne putzen",
  pfannengericht: "Pfannengericht",
  topfgericht: "Kochtopf & Pfanne",
  fertigpizza: "Fertigpizza",
  tv_malfreude: "TV: Malfreude",
  tv_zugfahrt: "TV: Zugfahrt",
  tv_tiefsee: "TV: Tiefsee",
  tv_domino: "TV: Domino",
  tv_wald: "TV: Natur-Doku",
  tv_krimi: "TV: Nachtzug-Krimi",
  tv_expedition: "TV: Weltraum-Reise",
  tv_theater: "TV: Puppentheater",
  tv_kochshow: "TV: Kochshow",
  tv_froschnews: "TV: Frosch-News",
  tv_rennen: "TV: Retro-Rennen",
  tv_quizshow: "TV: Bilderrätsel",
  musikzimmer: "Musikzimmer",
  gaming: "Gaming",
  schlafzimmer: "Schlafzimmer",
  badezimmer: "Badezimmer",
  treppenhaus: "Treppenhaus",
  flur: "Flur",
  wohnzimmer: "Wohnzimmer",
  kueche: "Küche",
  keller: "Keller",
};

export interface SteinSlot {
  art: SteinArt;
  /** Hauswelt, zu der dieser Stein führt */
  ziel: WeltId;
  x: number;
  y: number;
  hit: Rect4;
  label: string;
  /** Rufsteine lösen statt eines Weltwechsels eine Aktion oder Raum-Renovierung aus. */
  aktion?: "post" | "kranz" | "nikolaus" | "abend" | "abendEZ" | "aufsteh" | "aufstehEZ" | "kaffee" | "kaffeeEZ" | "morgen" | "zaehne" | "kochPfanne" | "kochTopf" | "kochPizza" | TvSteinArt | RaumSteinArt;
  /** Zugehöriger Raum für die Renovierungssteine im linken Kiesteil. */
  raum?: RenoRaumId;
  /** Zugehörige TV-Sendung für die TV-Kontrollsteine. */
  tv?: TVSendungId;
  /** Liegt auf dem 9-Platz-Kiesteil links (x 2..94, y 460..570). */
  kies?: boolean;
}

/**
 * Die Steine einer Welt: alle Welten außer der eigenen, in fester Reihenfolge
 * (normal, traum, gruesel, weihnacht). Der erste belegt Platz A, der zweite B,
 * der dritte C. So bleiben Traumstein, Wachstein und Horrorstein an ihren
 * gewohnten Plätzen.
 */
export function steinSlots(welt: WeltId): SteinSlot[] {
  const weltIndex: Record<string, number> = { normal: 0, traum: 1, gruesel: 2, weihnacht: 3 };
  const basis: WeltId[] = welt === "adventshaus"
    ? ["normal", "traum", "weihnacht"]
    : ["normal", "traum", "gruesel", "weihnacht"];
  const wechsel = basis
    .filter((ziel) => ziel !== welt)
    .map((ziel): SteinSlot => {
      const p = WELT_PLAETZE[weltIndex[ziel]];
      return { ...p, art: ZIEL_ART[ziel], ziel, label: STEIN_NAMEN[ZIEL_ART[ziel]] };
    });
  const advent: SteinSlot[] = welt === "adventshaus" ? [] : [{
    ...ADVENT_STEIN, art: "advent", ziel: "adventshaus", label: STEIN_NAMEN.advent,
  }];
  // Ereignisse: dicht beieinander oben im Kiesteil
  const ereignisse: SteinSlot[] = [
    { ...KRANZ_STEIN, art: "kranz", ziel: welt, label: STEIN_NAMEN.kranz, aktion: "kranz", kies: true },
    { ...STEIN_D, art: "bote", ziel: welt, label: STEIN_NAMEN.bote, aktion: "post", kies: true },
    { ...NIKOLAUS_STEIN, art: "nikolaus", ziel: welt, label: STEIN_NAMEN.nikolaus, aktion: "nikolaus", kies: true },
  ];
  // Routinen: sechs Steine in einer Reihe im Erdreich
  const routine: SteinSlot[] = [
    { ...BETT_STEIN, art: "bett", ziel: welt, label: STEIN_NAMEN.bett, aktion: "abend" },
    { ...EZ_BETT_STEIN, art: "ezbett", ziel: welt, label: STEIN_NAMEN.ezbett, aktion: "abendEZ" },
    { ...AUFSTEH_STEIN, art: "aufsteh", ziel: welt, label: STEIN_NAMEN.aufsteh, aktion: "aufsteh" },
    { ...EZ_AUFSTEH_STEIN, art: "ezaufsteh", ziel: welt, label: STEIN_NAMEN.ezaufsteh, aktion: "aufstehEZ" },
    { ...KAFFEE_STEIN, art: "kaffee", ziel: welt, label: STEIN_NAMEN.kaffee, aktion: "kaffee" },
    { ...EZ_KAFFEE_STEIN, art: "ezkaffee", ziel: welt, label: STEIN_NAMEN.ezkaffee, aktion: "kaffeeEZ" },
    // Ganze Morgenroutine: Aufwachen, Handy und Brille, Weste, Socken, zwei Kaffees, Zähne.
    { ...MORGENROUTINE_STEIN, art: "morgenroutine", ziel: welt, label: STEIN_NAMEN.morgenroutine, aktion: "morgen" },
    // Zahn-Pflege allein: startet direkt im Bad, ohne den ganzen Morgen vorher.
    { ...ZAHN_STEIN, art: "zaehne", ziel: welt, label: STEIN_NAMEN.zaehne, aktion: "zaehne" },
    // Mittagsküche: je ein Startknopf für Pfannengericht, Kochtopf & Pfanne und Fertigpizza
    { ...PFANNE_STEIN, art: "pfannengericht", ziel: welt, label: STEIN_NAMEN.pfannengericht, aktion: "kochPfanne" },
    { ...TOPF_STEIN, art: "topfgericht", ziel: welt, label: STEIN_NAMEN.topfgericht, aktion: "kochTopf" },
    { ...PIZZA_STEIN, art: "fertigpizza", ziel: welt, label: STEIN_NAMEN.fertigpizza, aktion: "kochPizza" },
  ];
  // TV-Sendungs-Steine: 13 kompakte Kontrollknöpfe unter den Welten & Kochsteinen
  const tvSteine: SteinSlot[] = TV_STEINE.map((t): SteinSlot => ({
    ...TV_PLAETZE[t.platz], art: t.art, ziel: welt, label: t.label,
    aktion: t.art, tv: t.tv,
  }));
  // Raumsteine: neun Stück im Raster links
  const raeume: SteinSlot[] = RAUM_STEINE.map((r): SteinSlot => ({
    ...KIES_PLAETZE[r.platz], art: r.art, ziel: welt, label: r.label,
    aktion: r.art, raum: r.raum, kies: true,
  }));
  return [...wechsel, ...advent, ...ereignisse, ...routine, ...tvSteine, ...raeume];
}

export function steinAn(slots: SteinSlot[], x: number, y: number): SteinSlot | null {
  for (const s of slots) {
    const [hx, hy, hw, hh] = s.hit;
    if (x >= hx && x <= hx + hw && y >= hy && y <= hy + hh) return s;
  }
  return null;
}

function poly(c: C, pts: [number, number][], color: string) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

const FARBEN: Record<SteinArt, { main: string; edge: string; glow: string }> = {
  traum: { main: "#4e5b88", edge: "#a7b5ef", glow: "rgba(153,181,255,.2)" },
  wach: { main: "#758b60", edge: "#e6d58a", glow: "rgba(255,224,139,.18)" },
  horror: { main: "#2b1a26", edge: "#ff6a3c", glow: "rgba(255,98,52,.26)" },
  weihnacht: { main: "#7a242c", edge: "#f5d36c", glow: "rgba(255,210,110,.26)" },
  kranz: { main: "#24402f", edge: "#f4d489", glow: "rgba(244,212,137,.26)" },
  advent: { main: "#2f5a3d", edge: "#ffd98a", glow: "rgba(255,217,138,.28)" },
  bote: { main: "#2c5674", edge: "#9fe0a8", glow: "rgba(150,230,170,.22)" },
  nikolaus: { main: "#805046", edge: "#f3d59a", glow: "rgba(244,202,125,.28)" },
  bett: { main: "#51465f", edge: "#dccde7", glow: "rgba(198,177,222,.18)" },
  ezbett: { main: "#33405f", edge: "#f0d68e", glow: "rgba(240,214,142,.2)" },
  aufsteh: { main: "#6b5a49", edge: "#ffe6a8", glow: "rgba(255,230,168,.2)" },
  morgenroutine: { main: "#2f6b70", edge: "#ffd98a", glow: "rgba(255,217,138,.22)" },
  zaehne: { main: "#2f5f9e", edge: "#e8f4ff", glow: "rgba(140,190,255,.26)" },
  pfannengericht: { main: "#5a4a38", edge: "#ffd98a", glow: "rgba(255,200,120,.22)" },
  topfgericht: { main: "#38546a", edge: "#cfe8f6", glow: "rgba(160,210,240,.22)" },
  fertigpizza: { main: "#7a3a2a", edge: "#ffd070", glow: "rgba(255,170,80,.24)" },
  kaffee: { main: "#5a3d6e", edge: "#e8d2ff", glow: "rgba(214,180,255,.2)" },
  ezkaffee: { main: "#3e2a4e", edge: "#ffd98a", glow: "rgba(255,217,138,.22)" },
  ezaufsteh: { main: "#4a4034", edge: "#ffd089", glow: "rgba(255,208,137,.22)" },
  tv_malfreude: { main: "#4c3b5c", edge: "#ffd68a", glow: "rgba(255,214,138,.2)" },
  tv_zugfahrt: { main: "#2e4d63", edge: "#c8e6f5", glow: "rgba(160,215,245,.2)" },
  tv_tiefsee: { main: "#194a66", edge: "#7ee8ff", glow: "rgba(110,225,255,.22)" },
  tv_domino: { main: "#3f3b54", edge: "#f4d86c", glow: "rgba(244,216,108,.2)" },
  tv_wald: { main: "#265239", edge: "#b9e8a8", glow: "rgba(155,225,140,.2)" },
  tv_krimi: { main: "#4a3d2f", edge: "#eadcb8", glow: "rgba(234,220,184,.2)" },
  tv_expedition: { main: "#282856", edge: "#88ecff", glow: "rgba(136,236,255,.22)" },
  tv_theater: { main: "#782430", edge: "#ffd578", glow: "rgba(255,213,120,.22)" },
  tv_kochshow: { main: "#305868", edge: "#ff9b70", glow: "rgba(255,155,112,.2)" },
  tv_froschnews: { main: "#1f4a7a", edge: "#8ee68a", glow: "rgba(142,230,138,.22)" },
  tv_rennen: { main: "#6b282c", edge: "#ffe070", glow: "rgba(255,224,112,.22)" },
  tv_quizshow: { main: "#3b286b", edge: "#ffd966", glow: "rgba(255,217,102,.22)" },
  musikzimmer: { main: "#2c4638", edge: "#f0cb70", glow: "rgba(240,203,112,.22)" },
  gaming: { main: "#6b363c", edge: "#f2cf84", glow: "rgba(242,207,132,.2)" },
  schlafzimmer: { main: "#4c6266", edge: "#e8d7a6", glow: "rgba(232,215,166,.2)" },
  badezimmer: { main: "#54746c", edge: "#d8eee4", glow: "rgba(194,234,218,.24)" },
  treppenhaus: { main: "#8b755d", edge: "#f4ddaa", glow: "rgba(244,221,170,.2)" },
  flur: { main: "#7d4541", edge: "#f2d396", glow: "rgba(242,211,150,.2)" },
  wohnzimmer: { main: "#4a634e", edge: "#f0d490", glow: "rgba(240,212,144,.2)" },
  kueche: { main: "#967d57", edge: "#faecc8", glow: "rgba(250,236,200,.2)" },
  keller: { main: "#5d5a52", edge: "#dfd6be", glow: "rgba(223,214,190,.18)" },
};

const RAUM_STEIN_SET = new Set<SteinArt>(RAUM_STEINE.map((r) => r.art));
const TV_STEIN_SET = new Set<SteinArt>(TV_STEINE.map((t) => t.art));

/**
 * Linkes Kiesfeld (x 2..94, y 460..571) mit 9 sauber eingeteilten Plätzen
 * (3 Spalten × 3 Reihen) – ein Raumstein für jedes Zimmer im Haus.
 */
export function drawKiesFeld(c: C) {
  c.save();
  // Leicht abgesetztes Kiesbett über dem dunkleren Erdreich
  c.fillStyle = "#5a4d42";
  c.beginPath();
  c.roundRect(2, 460, 92, 111, 6);
  c.fill();
  c.strokeStyle = "rgba(182,168,150,.2)";
  c.lineWidth = 1;
  c.stroke();

  // Feine Kieselkörnung (feste Positionen, kein Flackern)
  for (let i = 0; i < 42; i++) {
    const px = 5 + ((i * 29 + 7) % 86);
    const py = 463 + ((i * 37 + 11) % 105);
    const rx = 1 + (i % 3) * 0.5;
    const ry = 0.75 + ((i + 1) % 2) * 0.4;
    c.fillStyle = i % 3 === 0 ? "#7a6c5e" : i % 3 === 1 ? "#493d33" : "#6c5f52";
    c.beginPath();
    c.ellipse(px, py, rx, ry, (i % 5) * 0.4, 0, Math.PI * 2);
    c.fill();
  }

  // Die 9 flachen Kiesmulden im 3×3-Raster
  for (const pl of KIES_PLAETZE) {
    c.fillStyle = "rgba(38,30,24,.38)";
    c.beginPath();
    c.roundRect(pl.x - 13, pl.y - 14.5, 26, 29, 7);
    c.fill();
    c.strokeStyle = "rgba(196,184,166,.2)";
    c.lineWidth = 0.8;
    c.stroke();
  }
  c.restore();
}

/** Klares kleines Raum-Symbol mittig auf einem Kieselstein. */
function drawRaumSymbol(c: C, kind: RaumSteinArt, x: number, y: number) {
  const hell = "#f9e9bd";
  c.fillStyle = hell;
  c.strokeStyle = hell;
  c.lineCap = "round";
  c.lineJoin = "round";
  if (kind === "musikzimmer") {
    // Doppelachtelnote (♫)
    c.beginPath();
    c.ellipse(x - 4, y + 4.2, 2.5, 1.8, -0.28, 0, Math.PI * 2);
    c.ellipse(x + 3.6, y + 2.5, 2.5, 1.8, -0.28, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x - 1.9, y + 3.6); c.lineTo(x - 1.9, y - 5.2);
    c.moveTo(x + 5.7, y + 1.9); c.lineTo(x + 5.7, y - 6.8);
    c.stroke();
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(x - 1.9, y - 5); c.lineTo(x + 5.7, y - 6.7); c.stroke();
  } else if (kind === "gaming") {
    // Kleines Gamepad (Kreuz links, zwei Knöpfe rechts)
    c.beginPath();
    c.roundRect(x - 8, y - 4.4, 16, 9, 3.8);
    c.fill();
    c.fillStyle = "#4d2329";
    c.fillRect(x - 5.6, y - 0.8, 4.4, 1.6);
    c.fillRect(x - 4.2, y - 2.2, 1.6, 4.4);
    c.fillStyle = "#e8705c";
    c.beginPath(); c.arc(x + 2.8, y + 0.9, 1.25, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#53b888";
    c.beginPath(); c.arc(x + 5.2, y - 1.2, 1.25, 0, Math.PI * 2); c.fill();
  } else if (kind === "schlafzimmer") {
    // Mondsichel + kleiner Stern
    c.beginPath(); c.arc(x - 1, y, 5.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = FARBEN.schlafzimmer.main;
    c.beginPath(); c.arc(x + 2, y - 1.4, 4.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = hell;
    c.fillRect(x + 3.4, y - 5.4, 1.8, 1.8);
  } else if (kind === "badezimmer") {
    // 2×2-Fliesenraster mit klarer heller Fuge & Keramikglanz (Fliesen-Methode!)
    const f = 5.4, l = 1.6;
    const x0 = x - f - l / 2, y0 = y - f - l / 2;
    c.fillStyle = "#eef6f2";
    c.fillRect(x0 - 0.9, y0 - 0.9, f * 2 + l + 1.8, f * 2 + l + 1.8);
    for (let r = 0; r < 2; r++) {
      for (let q = 0; q < 2; q++) {
        const fx = x0 + q * (f + l), fy = y0 + r * (f + l);
        c.fillStyle = (r + q) % 2 === 0 ? "#85b5a8" : "#67968a";
        c.fillRect(fx, fy, f, f);
        c.fillStyle = "rgba(255,255,255,.5)";
        c.fillRect(fx + 0.7, fy + 0.7, f - 1.4, 1.1);
      }
    }
  } else if (kind === "treppenhaus") {
    // Vier steigende Treppenstufen
    c.beginPath();
    c.moveTo(x - 7, y + 6);
    c.lineTo(x - 7, y + 3); c.lineTo(x - 3.5, y + 3);
    c.lineTo(x - 3.5, y); c.lineTo(x, y);
    c.lineTo(x, y - 3); c.lineTo(x + 3.5, y - 3);
    c.lineTo(x + 3.5, y - 6); c.lineTo(x + 7, y - 6);
    c.lineTo(x + 7, y + 6);
    c.closePath();
    c.fill();
  } else if (kind === "flur") {
    // Kleine Haustür mit rundem Türknauf
    c.beginPath();
    c.roundRect(x - 5, y - 7, 10, 14, [3, 3, 0, 0]);
    c.fill();
    c.fillStyle = FARBEN.flur.main;
    c.fillRect(x - 3.2, y - 4.8, 6.4, 4.2);
    c.fillStyle = "#d99e44";
    c.beginPath(); c.arc(x + 2.4, y + 1.8, 1.1, 0, Math.PI * 2); c.fill();
  } else if (kind === "wohnzimmer") {
    // Kleines gemütliches Sofa
    c.beginPath(); c.roundRect(x - 6.5, y - 4.2, 13, 6.2, 2); c.fill();
    c.fillStyle = "#e8cfa0";
    c.fillRect(x - 8, y - 1, 2.4, 5.2);
    c.fillRect(x + 5.6, y - 1, 2.4, 5.2);
    c.fillStyle = hell;
    c.fillRect(x - 6, y + 0.4, 12, 3.8);
    c.fillRect(x - 6.6, y + 4.2, 1.5, 1.8);
    c.fillRect(x + 5.1, y + 4.2, 1.5, 1.8);
  } else if (kind === "kueche") {
    // Dampfende Kaffeetasse
    c.beginPath(); c.roundRect(x - 5.2, y - 1.2, 8.6, 7.2, [0, 0, 2.5, 2.5]); c.fill();
    c.lineWidth = 1.4;
    c.beginPath(); c.arc(x + 3.6, y + 2, 2.2, -Math.PI / 2, Math.PI / 2); c.stroke();
    c.lineWidth = 1.1;
    for (const dx of [-2.4, 0.6]) {
      c.beginPath();
      c.moveTo(x + dx, y - 2.8);
      c.quadraticCurveTo(x + dx + 1.3, y - 4.8, x + dx - 0.3, y - 6.6);
      c.stroke();
    }
  } else {
    // Keller: drei Reihen versetzter Mauersteine
    const h = 3.2, b = 6.2;
    c.fillRect(x - 6.8, y - 5.4, b, h); c.fillRect(x + 0.6, y - 5.4, b, h);
    c.fillRect(x - 3.4, y - 1.2, b + 0.6, h);
    c.fillRect(x - 6.8, y + 3, b, h); c.fillRect(x + 0.6, y + 3, b, h);
  }
}

/** Kompakter Kieselstein für das linke 9-Platz-Kiesfeld (ein Stein pro Raum). */
function drawRaumStein(c: C, kind: RaumSteinArt, x: number, y: number, t: number) {
  const { main, edge, glow } = FARBEN[kind];
  const pulse = 0.78 + Math.sin(t * 1.7) * 0.08;
  c.save();
  const g = c.createRadialGradient(x, y, 1, x, y, 17);
  g.addColorStop(0, glow);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, 17, 0, Math.PI * 2);
  c.fill();

  // Sanfter Schatten
  c.fillStyle = "rgba(10,12,16,.36)";
  c.beginPath();
  c.ellipse(x, y + 12, 11.4, 2.8, 0, 0, Math.PI * 2);
  c.fill();

  // Abgerundeter Kieselstein in der neuen Weihnachtsfarbe des Raums
  c.fillStyle = main;
  c.beginPath();
  c.roundRect(x - 12, y - 13, 24, 26, 7);
  c.fill();

  // Zarte Innen-Raute beim Musikzimmer, feiner Glanz oben für alle anderen
  if (kind === "musikzimmer") {
    c.strokeStyle = "rgba(240,232,205,.2)";
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x - 7.5, y); c.lineTo(x, y - 8);
    c.lineTo(x + 7.5, y); c.lineTo(x, y + 8);
    c.closePath();
    c.stroke();
  } else {
    c.fillStyle = "rgba(255,250,235,.09)";
    c.beginPath();
    c.roundRect(x - 9.5, y - 11, 19, 6, 3);
    c.fill();
  }

  // Warmer Rand
  c.strokeStyle = edge;
  c.globalAlpha = pulse;
  c.lineWidth = 1.25;
  c.beginPath();
  c.roundRect(x - 12, y - 13, 24, 26, 7);
  c.stroke();
  c.globalAlpha = 1;

  drawRaumSymbol(c, kind, x, y);
  c.restore();
}

/** Klare, kleine Symbole für die 12 TV-Sendungs-Steine (kompakte 20×20-Kiesel). */
function drawTvSymbol(c: C, kind: TvSteinArt, x: number, y: number) {
  c.lineCap = "round";
  c.lineJoin = "round";
  if (kind === "tv_malfreude") {
    // Farbpalette + 3 Farbtupfer
    c.fillStyle = "#d9ad74";
    c.beginPath(); c.ellipse(x, y + 0.5, 6.2, 4.6, -0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e85d50"; c.beginPath(); c.arc(x - 2.6, y - 1.2, 1.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffd65c"; c.beginPath(); c.arc(x + 0.8, y - 1.8, 1.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#4fa8e8"; c.beginPath(); c.arc(x + 3.2, y + 0.4, 1.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#4c3b5c"; c.beginPath(); c.arc(x - 2.2, y + 2, 1.2, 0, Math.PI * 2); c.fill();
  } else if (kind === "tv_zugfahrt") {
    // Lokfront mit zwei Scheinwerfern
    c.fillStyle = "#dce9f2"; c.beginPath(); c.roundRect(x - 5, y - 5.2, 10, 9.2, 2.2); c.fill();
    c.fillStyle = "#2b4d63"; c.fillRect(x - 3.6, y - 3.8, 7.2, 3.6);
    c.fillStyle = "#ffe078";
    c.beginPath(); c.arc(x - 2.6, y + 1.8, 1.2, 0, Math.PI * 2); c.arc(x + 2.6, y + 1.8, 1.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#c8e6f5"; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(x - 4.8, y + 5.6); c.lineTo(x - 2.4, y + 4); c.moveTo(x + 4.8, y + 5.6); c.lineTo(x + 2.4, y + 4); c.stroke();
  } else if (kind === "tv_tiefsee") {
    // Gelbes U-Boot
    c.fillStyle = "#f4c83b";
    c.fillRect(x - 1.5, y - 5.2, 3.4, 3);
    c.beginPath(); c.ellipse(x, y + 0.4, 6.2, 3.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#8ef0ff";
    c.beginPath(); c.arc(x - 2, y + 0.4, 1.3, 0, Math.PI * 2); c.arc(x + 2.2, y + 0.4, 1.3, 0, Math.PI * 2); c.fill();
  } else if (kind === "tv_domino") {
    // Zwei kippende Dominosteine
    c.fillStyle = "#f4d86c"; c.fillRect(x - 5.2, y - 5, 4, 10);
    c.save(); c.translate(x + 1.6, y + 5); c.rotate(0.38);
    c.fillStyle = "#ff7f6e"; c.fillRect(-2, -10, 4, 10);
    c.restore();
    c.fillStyle = "#3f3b54";
    c.beginPath(); c.arc(x - 3.2, y - 2.5, 0.9, 0, Math.PI * 2); c.arc(x - 3.2, y + 2.5, 0.9, 0, Math.PI * 2); c.fill();
  } else if (kind === "tv_wald") {
    // Tanne + kleine Sonne
    c.fillStyle = "#ffe680"; c.beginPath(); c.arc(x + 4.2, y - 4, 2, 0, Math.PI * 2); c.fill();
    poly(c, [[x - 1, y - 6], [x - 5.6, y + 3.4], [x + 3.6, y + 3.4]], "#64c472");
    c.fillStyle = "#6e4828"; c.fillRect(x - 2, y + 3.4, 2, 2.8);
  } else if (kind === "tv_krimi") {
    // Detektiv-Lupe
    c.strokeStyle = "#f2e2b4"; c.lineWidth = 1.6;
    c.beginPath(); c.arc(x - 1.2, y - 1.2, 4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(x + 1.8, y + 1.8); c.lineTo(x + 5.6, y + 5.6); c.stroke();
  } else if (kind === "tv_expedition") {
    // Ringplanet
    c.fillStyle = "#a87be8"; c.beginPath(); c.arc(x, y, 4.1, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#88ecff"; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(x, y, 6.8, 2.1, -0.35, 0, Math.PI * 2); c.stroke();
  } else if (kind === "tv_theater") {
    // Theatermaske / roter Vorhang mit Stern
    c.fillStyle = "#ffd578";
    c.beginPath(); c.roundRect(x - 5, y - 4.8, 10, 9.2, [2, 2, 4.5, 4.5]); c.fill();
    c.fillStyle = "#782430";
    c.beginPath(); c.arc(x - 2, y - 1, 1.1, 0, Math.PI * 2); c.arc(x + 2, y - 1, 1.1, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#782430"; c.lineWidth = 1.1;
    c.beginPath(); c.arc(x, y + 0.6, 2.4, 0.15, Math.PI - 0.15); c.stroke();
  } else if (kind === "tv_kochshow") {
    // Hohe weiße Kochmütze
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(x - 3, y - 2.2, 2.6, 0, Math.PI * 2);
    c.arc(x, y - 3.6, 2.8, 0, Math.PI * 2);
    c.arc(x + 3, y - 2.2, 2.6, 0, Math.PI * 2);
    c.fill();
    c.fillRect(x - 4.2, y - 0.8, 8.4, 5);
    c.fillStyle = "#e0584e"; c.fillRect(x - 4.2, y + 2.8, 8.4, 1.5);
  } else if (kind === "tv_froschnews") {
    // Kleiner Nachrichtenfrosch mit roter Krawatte
    c.fillStyle = "#5ec464";
    c.beginPath(); c.ellipse(x, y + 0.8, 5.2, 3.8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffffff";
    c.beginPath(); c.arc(x - 2.5, y - 2.6, 1.9, 0, Math.PI * 2); c.arc(x + 2.5, y - 2.6, 1.9, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#111";
    c.beginPath(); c.arc(x - 2.5, y - 2.6, 0.9, 0, Math.PI * 2); c.arc(x + 2.5, y - 2.6, 0.9, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e0463c"; c.fillRect(x - 1, y + 4.2, 2, 2.4);
  } else if (kind === "tv_rennen") {
    // Zielflagge (Schachbrett)
    for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) {
      c.fillStyle = (r + q) % 2 === 0 ? "#ffffff" : "#1c1f24";
      c.fillRect(x - 5 + q * 2.6, y - 4.2 + r * 2.6, 2.6, 2.6);
    }
    c.fillStyle = "#ffe070"; c.fillRect(x - 6, y - 4.6, 1.2, 10.6);
  } else {
    // Bilderrätsel: goldener Fragezeichen-Bogen
    c.strokeStyle = "#ffd966"; c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y - 2.2, 3.1, Math.PI * 0.95, Math.PI * 0.2);
    c.lineTo(x, y + 2.2);
    c.stroke();
    c.fillStyle = "#ffd966"; c.beginPath(); c.arc(x, y + 4.8, 1.15, 0, Math.PI * 2); c.fill();
  }
}

/** Kompakter 20×20-Kieselstein für die 12 TV-Sendungs-Kontrollknöpfe. */
function drawTvStein(c: C, kind: TvSteinArt, t: number, px: number, py: number) {
  const { main, edge, glow } = FARBEN[kind];
  const pulse = 0.8 + Math.sin(t * 1.7) * 0.08;
  c.save();
  const g = c.createRadialGradient(px, py, 1, px, py, 13);
  g.addColorStop(0, glow);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath(); c.arc(px, py, 13, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(10,12,16,.34)";
  c.beginPath(); c.ellipse(px, py + 9.2, 8.8, 2.1, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = main;
  c.beginPath(); c.roundRect(px - 9.5, py - 9.5, 19, 19, 5); c.fill();
  c.fillStyle = "rgba(255,250,235,.09)";
  c.beginPath(); c.roundRect(px - 7.5, py - 8, 15, 4.5, 2.2); c.fill();
  c.strokeStyle = edge;
  c.globalAlpha = pulse;
  c.lineWidth = 1.1;
  c.beginPath(); c.roundRect(px - 9.5, py - 9.5, 19, 19, 5); c.stroke();
  c.globalAlpha = 1;
  drawTvSymbol(c, kind, px, py);
  c.restore();
}

/** Halb eingegrabener Stein; Symbol und Farbe zeigen eindeutig, wohin er führt. */
export function drawStein(c: C, kind: SteinArt, t = 0, px: number = STEIN.x, py: number = STEIN.y) {
  if (RAUM_STEIN_SET.has(kind)) {
    drawSteinKern(c, kind, t, px, py);
    return;
  }
  if (TV_STEIN_SET.has(kind)) {
    drawTvStein(c, kind as TvSteinArt, t, px, py);
    return;
  }
  // Alle Orts- und Rufsteine: flacher Kiesel in einheitlicher Form (23 x 23, Radius 6, passend für 24×24-Plätze).
  const { main, edge, glow } = FARBEN[kind];
  const pulse = 0.78 + Math.sin(t * 1.7) * 0.08;
  c.save();
  // weicher Schein
  const g = c.createRadialGradient(px, py, 1, px, py, 15);
  g.addColorStop(0, glow);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(px, py, 15, 0, Math.PI * 2);
  c.fill();
  // Bodenschatten
  c.fillStyle = "rgba(10,12,16,.36)";
  c.beginPath();
  c.ellipse(px, py + 10.6, 10.6, 2.5, 0, 0, Math.PI * 2);
  c.fill();
  // Kieselkorpus
  c.fillStyle = main;
  c.beginPath();
  c.roundRect(px - 11.5, py - 11.5, 23, 23, 6);
  c.fill();
  // Symbol des Steins, auf dieselbe Symbolgröße wie im Kiesteil gebracht
  c.save();
  c.beginPath();
  c.roundRect(px - 11.5, py - 11.5, 23, 23, 6);
  c.clip();
  c.translate(px, py);
  c.scale(0.58, 0.58);
  c.translate(-px, -py);
  drawSteinKern(c, kind, t, px, py);
  c.restore();
  // zarter Glanz oben + warmer Rand
  c.fillStyle = "rgba(255,250,235,.09)";
  c.beginPath();
  c.roundRect(px - 9, py - 10, 18, 5.2, 2.5);
  c.fill();
  c.strokeStyle = edge;
  c.globalAlpha = pulse;
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(px - 11.5, py - 11.5, 23, 23, 6);
  c.stroke();
  c.restore();
}

function drawSteinKern(c: C, kind: SteinArt, t = 0, px: number = STEIN.x, py: number = STEIN.y) {
  if (RAUM_STEIN_SET.has(kind)) {
    drawRaumStein(c, kind as RaumSteinArt, px, py, t);
    return;
  }
  const x = px;
  const y = py;
  const { main, edge, glow } = FARBEN[kind];
  const pulse = 0.76 + Math.sin(t * 1.7) * 0.08;

  c.save();
  const g = c.createRadialGradient(x, y - 12, 2, x, y - 12, 34);
  g.addColorStop(0, glow);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y - 12, 34, 0, Math.PI * 2);
  c.fill();
  // Erdreich vor dem unteren Rand macht den Stein sichtbar halb vergraben.
  poly(c, [[x - 18, y + 13], [x - 14, y - 11], [x - 5, y - 25], [x + 10, y - 23], [x + 19, y - 7], [x + 16, y + 13]], main);
  c.strokeStyle = edge;
  c.globalAlpha = pulse;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x - 14, y - 10);
  c.quadraticCurveTo(x - 4, y - 28, x + 10, y - 22);
  c.quadraticCurveTo(x + 19, y - 7, x + 16, y + 8);
  c.stroke();
  c.globalAlpha = 1;
  c.strokeStyle = "rgba(12,16,25,.45)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 4, y - 20);
  c.lineTo(x - 1, y + 8);
  c.moveTo(x + 10, y - 17);
  c.lineTo(x + 4, y + 10);
  c.stroke();
  c.fillStyle = edge;
  if (kind === "kranz") {
    // Adventskranz: dunkelgrüner Ring, vier Kerzen, die erste brennt.
    c.strokeStyle = "#2e5c40"; c.lineWidth = 3.2;
    c.beginPath(); c.ellipse(x, y + 1, 9, 3.6, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "#3f7f52"; c.lineWidth = 1.3;
    c.beginPath(); c.ellipse(x, y, 9, 3.6, 0, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const kx = x + Math.cos(a) * 7, ky = y + Math.sin(a) * 2.6 - 8;
      c.fillStyle = "#f6ecd2"; c.fillRect(kx - 0.9, ky, 1.8, 7);
      if (i === 0) {
        c.fillStyle = "#ffcf6a";
        c.beginPath(); c.ellipse(kx, ky - 2.2, 1.2, 2.2, 0, 0, Math.PI * 2); c.fill();
      } else {
        c.fillStyle = "#b9a98a"; c.fillRect(kx - 0.8, ky - 2, 1.6, 1.6);
      }
    }
    c.fillStyle = "#c9453a";
    for (let i = 0; i < 3; i++) c.fillRect(x - 6 + i * 5, y + 2 + (i % 2) * 1.5, 1.5, 1.5);
  } else if (kind === "advent") {
    // Adventsstein: brennende Kerze auf einem kleinen Tannenkranz, darüber ein Stern.
    c.fillStyle = "#2e5c40";
    c.beginPath(); c.ellipse(x, y + 2, 8.2, 2.9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3f7f52";
    c.beginPath(); c.ellipse(x - 1.5, y + 1.2, 4.6, 1.8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#f6ecd2";
    c.fillRect(x - 2.3, y - 13.5, 4.6, 15);
    c.fillStyle = "#d8c7a2";
    c.fillRect(x + 0.9, y - 13.5, 1.4, 15);
    const fl = 0.88 + Math.sin(t * 5.3) * 0.12;
    c.fillStyle = "#ffcf6a";
    c.beginPath();
    c.moveTo(x, y - 13.5 - 8.4 * fl);
    c.quadraticCurveTo(x + 2.6, y - 16.5, x, y - 13.6);
    c.quadraticCurveTo(x - 2.6, y - 16.5, x, y - 13.5 - 8.4 * fl);
    c.fill();
    c.fillStyle = "#fff3cf";
    c.beginPath(); c.ellipse(x, y - 16.4, 0.9, 2.1 * fl, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#f5d36c";
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 4.4 : 1.8;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const sx = x + 9 + Math.cos(a) * r;
      const sy = y - 21 + Math.sin(a) * r;
      if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
    }
    c.closePath();
    c.fill();
  } else if (kind === "bett" || kind === "ezbett") {
    if (kind === "ezbett") {
      // Kleines Bett mit einer Uhr darüber: der Abend in echter Zeit.
      c.fillStyle = "#fbf1d6"; c.beginPath(); c.arc(x + 6, y - 18, 4.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#7a5b2a"; c.lineWidth = .9; c.lineCap = "round"; c.stroke();
      c.beginPath(); c.moveTo(x + 6, y - 18); c.lineTo(x + 6, y - 20.8); c.moveTo(x + 6, y - 18); c.lineTo(x + 8, y - 17); c.stroke();
    }
    c.fillStyle = "#f2ddc8";
    c.fillRect(x - 11, y - 15, 2.5, 17); c.fillRect(x + 9, y - 9, 2, 11);
    c.fillRect(x - 10, y - 4, 20, 2.2);
    c.beginPath(); c.roundRect(x - 8, y - 11, 6, 4.5, 1.8); c.fill();
    c.fillStyle = "#acc8d3";
    c.beginPath(); c.roundRect(x - 2.5, y - 11.5, 12, 7.3, 2); c.fill();
    c.fillStyle = "#eae2ef"; c.fillRect(x, y - 11, 1.3, 5.5);
  } else if (kind === "kaffee" || kind === "ezkaffee") {
    // Kleine violette Senseo mit dampfender Tasse.
    if (kind === "ezkaffee") {
      c.fillStyle = "#fbf1d6"; c.beginPath(); c.arc(x + 6.4, y - 19, 4.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#7a5b2a"; c.lineWidth = .9; c.lineCap = "round"; c.stroke();
      c.beginPath(); c.moveTo(x + 6.4, y - 19); c.lineTo(x + 6.4, y - 21.8); c.moveTo(x + 6.4, y - 19); c.lineTo(x + 8.4, y - 18); c.stroke();
    }
    c.fillStyle = "#8a5cc0";
    c.fillRect(x - 9, y - 14, 10, 3); c.fillRect(x - 3, y - 14, 4, 12); c.fillRect(x - 9, y - 3, 10, 2);
    c.fillStyle = "#f4efe6"; c.fillRect(x - 8, y - 8, 4, 5);
    c.strokeStyle = edge; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x - 6.5, y - 9.5); c.quadraticCurveTo(x - 5, y - 12, x - 6.5, y - 13.5); c.stroke();
  } else if (kind === "aufsteh" || kind === "ezaufsteh") {
    // Aufwachpfeil über einem kleinen Bett: sie steht auf und nimmt die Weste.
    if (kind === "ezaufsteh") {
      c.fillStyle = "#fbf1d6"; c.beginPath(); c.arc(x + 6.4, y - 19, 4.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#7a5b2a"; c.lineWidth = .9; c.lineCap = "round"; c.stroke();
      c.beginPath(); c.moveTo(x + 6.4, y - 19); c.lineTo(x + 6.4, y - 21.8); c.moveTo(x + 6.4, y - 19); c.lineTo(x + 8.4, y - 18); c.stroke();
    }
    c.fillStyle = "#f2ddc8";
    c.fillRect(x - 11, y - 15, 2.5, 15); c.fillRect(x + 9, y - 9, 2, 9);
    c.fillRect(x - 10, y - 4, 20, 2.2);
    c.fillStyle = "#acc8d3";
    c.beginPath(); c.roundRect(x - 8, y - 10.5, 15, 5.5, 2); c.fill();
    c.strokeStyle = edge; c.lineWidth = 1.4; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - 1, y - 21); c.lineTo(x + 5, y - 21); c.stroke();
    c.beginPath(); c.moveTo(x + 2.4, y - 24); c.lineTo(x + 5.2, y - 21); c.lineTo(x + 2.4, y - 18); c.stroke();
  } else if (kind === "nikolaus") {
    // Kleine Emaille-Mitra mit Perlenrand und der goldenen Schnecke seines Stabs.
    poly(c, [[x - 9, y - 10], [x - 3, y - 19], [x + 3.8, y - 10.5], [x + 3, y - 2.1], [x - 8.1, y - 2.2]], "#efcc82");
    poly(c, [[x - 7.7, y - 9.7], [x - 3, y - 16.9], [x + 2.6, y - 10], [x + 1.9, y - 5.4], [x - 7.2, y - 5.5]], "#a93849");
    c.strokeStyle = "#fff0bf"; c.lineWidth = 1.15; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - 2.9, y - 13.6); c.lineTo(x - 2.9, y - 6.3);
    c.moveTo(x - 5.2, y - 10.7); c.lineTo(x - .3, y - 10.7); c.stroke();
    c.strokeStyle = "#f0cb81"; c.lineWidth = 1.35;
    c.beginPath(); c.moveTo(x + 6.1, y + .5); c.lineTo(x + 7.3, y - 12.3);
    c.bezierCurveTo(x + 7.3, y - 17.5, x + 13.4, y - 16.3, x + 12, y - 12.5);
    c.quadraticCurveTo(x + 10.2, y - 9.8, x + 9.4, y - 12.5); c.stroke();
    for (const dx of [-6.2, -3, .5]) {
      c.fillStyle = "#fff3ce"; c.beginPath(); c.arc(x + dx, y - 3.8, .65, 0, Math.PI * 2); c.fill();
    }
  } else if (kind === "bote") {
    // Briefumschlag mit Klappe und grünem Froschsiegel (Frog Company)
    c.fillStyle = "#eef3e6";
    c.fillRect(x - 6.5, y - 13.5, 13, 8.6);
    c.strokeStyle = "rgba(20,40,55,.7)";
    c.lineWidth = 0.9;
    c.strokeRect(x - 6.5, y - 13.5, 13, 8.6);
    c.beginPath();
    c.moveTo(x - 6.5, y - 13.5);
    c.lineTo(x, y - 8.4);
    c.lineTo(x + 6.5, y - 13.5);
    c.stroke();
    c.fillStyle = "#4f9a52";
    c.beginPath();
    c.arc(x, y - 8.6, 2.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#eef3e6";
    c.beginPath();
    c.arc(x - 0.8, y - 9.3, 0.55, 0, Math.PI * 2);
    c.arc(x + 0.8, y - 9.3, 0.55, 0, Math.PI * 2);
    c.fill();
  } else if (kind === "traum") {
    // liegende Mondsichel
    c.beginPath();
    c.arc(x - 2, y - 8, 5.5, 0.5, Math.PI * 1.6);
    c.arc(x + 1.5, y - 9.5, 4.8, Math.PI * 1.55, 0.45, true);
    c.fill();
  } else if (kind === "wach") {
    // aufrechte kleine Sonne
    c.beginPath();
    c.arc(x, y - 9, 4.2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = edge;
    c.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * 6.2, y - 9 + Math.sin(a) * 6.2);
      c.lineTo(x + Math.cos(a) * 8.8, y - 9 + Math.sin(a) * 8.8);
      c.stroke();
    }
  } else if (kind === "weihnacht") {
    // geschmückter Tannenbaum mit goldenem Stern auf der Spitze
    c.fillStyle = "#5a3822";
    c.fillRect(x - 1.4, y - 4.2, 2.8, 3.6);
    poly(c, [[x, y - 16.5], [x - 5.2, y - 10.6], [x + 5.2, y - 10.6]], "#2f7d47");
    poly(c, [[x, y - 12.8], [x - 6.6, y - 6.8], [x + 6.6, y - 6.8]], "#276c3d");
    poly(c, [[x, y - 9.2], [x - 7.8, y - 3.6], [x + 7.8, y - 3.6]], "#215c34");
    // kleiner Goldstern an der Spitze
    c.fillStyle = edge;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? 2.5 : 1.05;
      const sx = x + Math.cos(a) * r;
      const sy = y - 17.6 + Math.sin(a) * r;
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    }
    c.closePath();
    c.fill();
    // kleine Christbaumkugeln
    for (const [bx, by, col] of [
      [x - 2.6, y - 8.4, "#ff5b52"],
      [x + 2.8, y - 6.2, "#f5d36c"],
      [x - 3.6, y - 4.8, "#f5d36c"],
      [x + 1.4, y - 11.2, "#ff5b52"],
    ] as const) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(bx, by, 1.05, 0, Math.PI * 2);
      c.fill();
    }
  } else if (kind === "pfannengericht") {
    // Pfanne von der Seite mit Spiegelei
    c.fillStyle = "#6a4a2c"; c.fillRect(x + 7, y - 9, 10, 2.4);
    c.fillStyle = "#2a2f35"; c.beginPath(); c.ellipse(x, y - 8, 9.4, 3.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#14171b"; c.beginPath(); c.ellipse(x, y - 8.4, 8, 2.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#faf9f2"; c.beginPath(); c.ellipse(x - 0.4, y - 8.5, 5.2, 1.9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#f4b52a"; c.beginPath(); c.arc(x - 0.4, y - 8.9, 1.7, 0, Math.PI * 2); c.fill();
  } else if (kind === "topfgericht") {
    // Kochtopf mit Dampf
    c.fillStyle = "#9aa3a8"; c.fillRect(x - 7.5, y - 12, 15, 11);
    c.fillStyle = "#c4cacb"; c.fillRect(x - 8.6, y - 14.4, 17.2, 2.6);
    c.fillStyle = "#6b7479"; c.fillRect(x - 11, y - 9, 3.6, 1.8); c.fillRect(x + 7.4, y - 9, 3.6, 1.8);
    c.strokeStyle = "rgba(240,248,252,.85)"; c.lineWidth = 1.1; c.lineCap = "round";
    for (const dx of [-3, 2]) {
      c.beginPath(); c.moveTo(x + dx, y - 16.4); c.quadraticCurveTo(x + dx + 2, y - 19, x + dx - 0.6, y - 21.6); c.stroke();
    }
  } else if (kind === "fertigpizza") {
    // Pizza mit Salami und herausgeschnittenem Stück
    c.fillStyle = "#b57b32"; c.beginPath(); c.arc(x, y - 8, 9.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e4a93e"; c.beginPath(); c.arc(x, y - 8, 7.8, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#b8322a";
    for (const [dx, dy] of [[-3.4, -3.2], [3, -4.4], [-1, 2.6], [4, 2]] as const) { c.beginPath(); c.arc(x + dx, y - 8 + dy, 1.5, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = "rgba(120,70,20,.7)"; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + 7.8, y - 8); c.moveTo(x, y - 8); c.lineTo(x + 4, y - 14.8); c.stroke();
  } else if (kind === "zaehne") {
    // Zahn mit zwei Wurzeln – die Zahn-Pflege am Morgen.
    c.fillStyle = "#f4f8fb";
    c.beginPath();
    c.moveTo(x - 5.4, y - 5.4);
    c.quadraticCurveTo(x, y - 9.6, x + 5.4, y - 5.4);
    c.quadraticCurveTo(x + 6.6, y + 0.6, x + 4.2, y + 6.4);
    c.lineTo(x + 2.2, y + 6.4);
    c.quadraticCurveTo(x + 1.1, y + 1.6, x, y + 1.6);
    c.quadraticCurveTo(x - 1.1, y + 1.6, x - 2.2, y + 6.4);
    c.lineTo(x - 4.2, y + 6.4);
    c.quadraticCurveTo(x - 6.6, y + 0.6, x - 5.4, y - 5.4);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(40,70,110,.55)";
    c.lineWidth = 0.7;
    c.stroke();
  } else if (kind === "morgenroutine") {
    // Aufgehende Sonne über dem Horizont: der Morgen des ganzen Hauses.
    c.fillStyle = edge;
    c.beginPath();
    c.arc(x, y - 4, 6.2, Math.PI, 0);
    c.fill();
    c.strokeStyle = edge;
    c.lineWidth = 1.1;
    c.lineCap = "round";
    for (let i = 0; i <= 4; i++) {
      const a = Math.PI + (i / 4) * Math.PI;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * 8, y - 4 + Math.sin(a) * 8);
      c.lineTo(x + Math.cos(a) * 10.6, y - 4 + Math.sin(a) * 10.6);
      c.stroke();
    }
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x - 11, y + 3.6);
    c.lineTo(x + 11, y + 3.6);
    c.stroke();
  } else {
    // Totenkopf mit Glutaugen
    c.fillStyle = "#e8e0cc";
    c.beginPath();
    c.arc(x, y - 11, 5.6, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(x - 3.4, y - 7);
    c.lineTo(x + 3.4, y - 7);
    c.lineTo(x + 2.8, y - 2.6);
    c.lineTo(x - 2.8, y - 2.6);
    c.closePath();
    c.fill();
    c.fillStyle = "#1a0f16";
    c.beginPath();
    c.arc(x - 2.1, y - 11.2, 1.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(x + 2.1, y - 11.2, 1.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(x, y - 9.4);
    c.lineTo(x - 0.9, y - 7.4);
    c.lineTo(x + 0.9, y - 7.4);
    c.closePath();
    c.fill();
    c.strokeStyle = "#1a0f16";
    c.lineWidth = 0.6;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(x + i * 1.5, y - 6.4);
      c.lineTo(x + i * 1.5, y - 3.2);
      c.stroke();
    }
    // Glut in den Augenhöhlen, atmet leise
    c.fillStyle = `rgba(255,106,60,${0.35 + 0.25 * Math.sin(t * 2.4)})`;
    c.beginPath();
    c.arc(x - 2.1, y - 11.2, 0.8, 0, Math.PI * 2);
    c.arc(x + 2.1, y - 11.2, 0.8, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** Alt, nur für Aufrufer von früher: Treffer auf Platz A. */
export function trifftStein(x: number, y: number) {
  const [hx, hy, hw, hh] = STEIN.hit;
  return x >= hx && x <= hx + hw && y >= hy && y <= hy + hh;
}
