/* =======================================================================
   LUNIS HAUS — Querschnitt in vier Ebenen (Little-Computer-People-Stil)

   Dachgeschoss : Gaming-Zimmer | Musikzimmer (Klavier, Plattenspieler, Gitarre)
   1. Stock     : Schlafzimmer | Badezimmer
   Erdgeschoss  : Flur (Haustür) | Wohnzimmer | Küche
   Keller       : Krempelraum (1/3 der Breite) -> Raucherraum -> Garten

   Keine Punkte, kein Lebensbalken, keine Klick-Effekte: Ein Klick auf ein
   Objekt schickt Luni einfach hin. Die Uhr zeigt echte MEZ-Zeit, der
   Himmel hinter den Fenstern folgt der Tageszeit.
   ======================================================================= */

import { coughPulse, drawLuni, drawZzz, LUNI_COLORS, SITZ_HUB, SITZ_MUND, smokeCycle, type LuniExpr, type LuniState } from "./luni";
import {
  ADVENT_NACH_DATUM, ADVENT_TAGE, ADVENT_WAND, adventFrei, adventHinweis, adventMischung,
  adventOeffnen, adventRahmen, adventSternVerdient, adventTuer, adventTuerBei, adventTueren, adventWand,
  ladeAdvent, RAHMEN, adventGruss, adventSchmuck, adventSchmuckGlanz, adventsSonntage, type AdventStand,
} from "./advent";
import { HundeWelt, type HundId } from "./hunde";
import { HandyAblauf, HANDY_TASCHE_SICHTBAR } from "./handy";
import {
  GOL_BTN,
  GOL_RULES,
  GOL_SIZES,
  GOL_SPEEDS,
  GOL_VIEW_H,
  GOL_VIEW_W,
  GOL_X,
  GOL_Y,
  advance,
  countPopulation,
  createState,
  drawGolControls,
  drawGridCoarse,
  drawSpeedMeter,
  golCtrlAt,
  golView,
  paintCells,
  randomize,
  resize,
  toggleCellAt,
  type GOLState,
} from "./gol";
import {
  FLAUSCHI_KNOEPE,
  FLAUSCHI_ZURUECK,
  drawFlauschiAlbum,
  drawFlauschiGeschenke,
  drawFlauschiHud,
  drawFlauschiHuelle,
  drawFlauschiKnoepfe,
  drawFlauschiSzene,
  drawFlauschiZonen,
  flauschiAktion,
  flauschiAuspacken,
  flauschiBeruehren,
  flauschiKlang,
  flauschiKnopfBei,
  flauschiPakete,
  flauschiKraulenHalten,
  flauschiTick,
  flauschiVersprochen,
  flauschiZoneBei,
  flauschiZonen,
  leseFlauschiStand,
  neuerFlauschiStand,
  type FlauschiAktion,
  type FlauschiZielId,
  type FlauschiBeruehrung,
  type FlauschiStand,
} from "./flauschi";

import { sfx } from "./audio";
import { SaxophonMusic } from "./audio/saxophonVoice";
import { SAX_DURATION_SECONDS } from "./audio/saxophonNotes";
import { PlattenMusic, plattenBassPulse } from "./audio/plattenVoice";
import { KlavierMusik, klavierHaendeAt } from "./audio/klavierVoice";
import { TVKlang } from "./audio/tvVoice";
import {
  drawFernbedienung, leseTVStand, neuerTVStand, tvFernTreffer, tvKanaele, tvNaechsterKanal, TV_FERN_STATIONS,
  type TVBefehl, type TVId, type TVInhalt, type TVKanal, type TVStand,
} from "./tv";
import { PLATTEN_DURATION_SECONDS } from "./audio/plattenNotes";
import { FroschMusic, froschMundOffen } from "./audio/froschVoice";
import { FROSCH_DURATION_SECONDS } from "./audio/froschNotes";
import { VAMPIR_OUTFITS, naechstesOutfit } from "./gruselhaus/vampir";
import {
  KesselAblauf, OFEN, ZAUBER_ZEIT, drawKessel, drawKesselGedanke, drawKesselSchimmer, drawOfen,
  drawZauberBlitz, kesselLoeffelSpitze,
} from "./gruselhaus/hexenofen";
import {
  HOLZ_MAX, HOLZ_REFILL_SEK, drawEisenBruestung, drawHexenkuecheRaum, drawHolzlager, drawKuecheFlammen,
  drawFensterGlanz, drawFensterMaske, drawKuchenFenster, drawKuchenFensterWetter, drawKuecheSchein, drawKuecheSchleier, drawSteintreppe, drawTruhe, drawTruheAufsatz, kuechenStationen, kuecheLichtpools,
} from "./gruselhaus/kueche";
import { drawWetter, ladeWetter, tickWetter, waehleJahreszeit, waehleWetter, schalteZusatz, echtwetter, type WetterState } from "./wetter";
import { drawWetterStation, wetterStationHit, wetterStationLayout, type WetterBefehl, type WetterTreffer } from "./wetterstation";
import { drawStein, steinAn, steinSlots, type SteinSlot } from "./steine";
import { ladeSnapshot, speichereSnapshot, type HausSnapshot, type WeltId } from "./welten";
import { GRUSELRAEUME, RaumstationFx, type GruselRaeume } from "./gruselhaus";
import {
  RS,
  drawMetalFloor,
  drawMetalWall,
  drawRaumstationMoebel,
  drawSpaceWindow,
  drawSteelBeam,
} from "./gruselhaus/raumstation";
import { clipMusikzimmer, drawMusikzimmerEffects, drawMusikzimmer, drawMusiktuer, musikzimmerStationen, vorhangGriff, MUSIKZIMMER } from "./gruselhaus/musikzimmer";
import { klavierHaende, MusikzimmerAblauf } from "./gruselhaus/musikzimmer-ablauf";
import { drawPixelText } from "./pixel";
import { drawUfo, drawWeihnachtsschlitten, ufoTreffer, ufoZeileBei } from "./ufo";
import { fensterReif, rundReif } from "./reif";
import { fensterKranz, rundFensterKranz } from "./fensterkranz";
import { adventWandWeihnacht } from "./advent-wand";
import {
  WEIHNACHTS_FARBEN, WEIHNACHTS_ORTE, WEIHNACHTSBAUM_X, ZIMMER_TAPETEN,
  esstischAdventskranz, festzweig, goldstangeMitSamt, kellerWinterdeko,
  ruhigeWeihnachtswand, samtvorhangPfade, weihnachtsAbendlicht, weihnachtsBettgestell,
  weihnachtsKerzenflammen, weihnachtsLichtfleck, weihnachtsWandkranz, weihnachtsstrumpf,
  winterBadAblage, winterSteppdecke, wohnzimmerBuch, wohnzimmerWeihnachtsbaum,
  type ZimmerTapete,
} from "./weihnachtshaus";
export { ZIMMER_TAPETEN, type ZimmerTapete } from "./weihnachtshaus";
import { PATCH_EINTRAEGE, PATCH_ZIP } from "./patch";
import {
  BIO_BAD, badezimmerStationen, drawBioBadAfter, drawBioBadBefore,
  drawBioBadStatic, drawBioBadWall, drawHazmatVlies, drawLabBrush, drawLabLockerOpen,
  type BioBadFx,
} from "./gruselhaus/badezimmer";
import {
  BRILLEN_ZIELE,
  SARG,
  SCHLAFZIMMER,
  brilleErreichbar,
  brillenZiel,
  deckelGriff,
  deckelSchlaufe,
  drawBurgWand,
  drawGothicWardrobeOpen,
  drawSargDeckel,
  drawSargFront,
  drawSargInnen,
  drawSchlafzimmerEffects,
  drawTrittschemel,
  drawVampirSchlafzimmer,
  leuchterPunkt,
  schlafzimmerStationen,
  type BrillenZiel,
} from "./gruselhaus/schlafzimmer";
import {
  SHOWER_X,
  curtainRect,
  drawCurtain,
  drawShowerWater,
  drawSteam,
  drawTowelOnRod,
  drawTubFront,
  drawWardrobeOpen,
  showerStatic,
} from "./shower";

type C = CanvasRenderingContext2D;
type Pt = [number, number];
type Rect4 = [number, number, number, number];

export const W = 960;
export const H = 600;

/** Innenkanten des Hauses */
export const HL = 110;
export const HR = 830;

/** Bodenlinien: Keller, Erdgeschoss, 1. Stock, Dachgeschoss */
export const FLOOR_Y = [572, 448, 324, 200] as const;
export const FLOOR_NAME = ["Keller", "Erdgeschoss", "1. Stock", "Dachgeschoss"] as const;

const SLAB = 12;
const CEL_X0 = 350; // Keller: linke Innenkante (links davon ist Erdreich)
/** Grau der Kellerwand, die ans Erdreich grenzt */
const CELLAR_WALL = "#4b4a48";
/** So viele gestopfte Zigaretten liegen höchstens auf dem Tisch */
const PILE_MAX = 9;
/** So viele passen in die Schachtel */
const PACK_MAX = 23;
/** Sitzplatz, Beistelltisch und Gegenstände der Raucherecke */
const ASH_STAND_X = 684;
const SIDE_X = ASH_STAND_X + 24;
const SIDE_TOP = FLOOR_Y[0] - 30;
const ASH_X = SIDE_X - 9;
const BUCKET_X = SIDE_X;
const FEUERZEUG_TISCH: Pt = [SIDE_X - 15, SIDE_TOP - 1.4];
const FEUERZEUG_LIEGEND = -Math.PI / 2;
const FEUERZEUG_TISCH_CHANCE = 0.15;
const ZUENDEN = {
  holen: -1.08, tischGriff: -0.68, eingesteckt: -0.16,
  mund: 0.56, tasche: 0.99, flamme: 1.58, glimmt: 1.83,
  flammeAus: 2.06, ablage: 2.67, mundGriff: 3.09, ende: 3.56,
} as const;
/** Gesundheitstee: Kanne auf der Küchenzeile, Tasse rechts daneben */
const TEA_X = 642;
const TEE_TASSE_X = 653;
const TEA_Y = FLOOR_Y[1] - 40;
const TEE_POSE_X = 620;
const TEE_STAND_KANNE = TEA_X - 14;
const TEE_STAND_TASSE = TEE_TASSE_X - 11;
const KANNENGRIFF: Pt = [-10, -6];
const TASSENGRIFF: Pt = [4.1, -2.8]; // Griff an der Henkelseite, weg vom Hals
const AUSGUSS: Pt = [12, -10];
const TEE_SCHLUCK = { start: 5.2, dauer: 0.86, anzahl: 3 } as const;
const TEE_TRINKEN_ENDE = TEE_SCHLUCK.start + TEE_SCHLUCK.dauer * TEE_SCHLUCK.anzahl;
const TEE_ABGESETZT = TEE_TRINKEN_ENDE + 0.5;
const TEA_DAUER = TEE_ABGESETZT + 0.3;
const DG_X0 = 262; // Dachgeschoss-Boden beginnt hier, links davon Treppenhaus
const OG_X1 = 694; // 1.-Stock-Boden endet hier, rechts davon Treppenhaus

/* --------------------- Osterei: Datenkoffer (Keller) ------------------- */
// Steht auf den Kartons mitten im Krempelraum; Bodenlinie der Kartons ist 548.
const KOFFER_X = 444;
const KOFFER_Y = 522;
const KOFFER_W = 34;
const KOFFER_H = 26;
const LUNI_SCALE = 1.08;
const BETT_STAND_X = 337;
/** Adventskalender: Zurück-Knopf im Vollbild (Fernseh-tauglich, ≥ 24 hoch). */
const ADVENT_ZURUECK = { x: 836, y: 30, w: 100, h: 28 };
/** Große TV-Ansicht: Zurück- und Power-Knöpfe (alle ≥ 24×24, im sicheren Bereich). */
const TV_BACK_E = { x: 390, y: 516, w: 180, h: 34 } as const;
const TV_PWR_E = { x: 755, y: 372, w: 56, h: 36 } as const;
const TV_BACK_D = { x: 390, y: 420, w: 180, h: 34 } as const;
const TV_PWR_D = { x: 782, y: 350, w: 56, h: 26 } as const;
const SPEED = 80;

/** „Paulchen“: das bisher einzige Saxophonstück. Weitere Lieder später ergänzen. */
const SAX_SONG_PAULCHEN = { id: "paulchen", duration: SAX_DURATION_SECONDS } as const;
/** Referenzgröße: exakt die Größe, in der Luni das Saxophon spielt.
 *  Auf Lunis Größe abgestimmt (Schallloch bis Knie): dieselbe Größe am
 *  Stativ und in der Hand – das Instrument wächst beim Anheben nicht. */
const SAX_SCALE = 0.68 * LUNI_SCALE;
/** Mundstück-Anker, wenn das Instrument auf dem Stativ steht. Das größere
 *  Instrument steht etwas höher, damit die untere Hand es am Stativ noch
 *  erreicht (Armlänge). */
const SAX_STAND_X = 618;
/** Mikrofonstaender und Gesangsplatz; Saxophon links der Mitte des freien Abstands. */
const MIC_STAND_X = 652;
const SAX_STAND_Y = FLOOR_Y[3] - 40;
/** Mundstück sitzt so viele Einheiten vor der Körpermitte am Mund. */
const SAX_MOUTH_DX = 1.2;
/** Griffpunkte in LOKALEN Saxophon-Koordinaten (Ursprung = Mundstück-Anker).
 *  Sie liegen auf der Klappenspalte, die saxophone() zeichnet – die Hände
 *  sitzen damit immer exakt am gezeichneten Instrument. Die untere Hand
 *  liegt weiter oben (y 26 statt 31), damit sie das größere Instrument
 *  mit natürlicher Armlänge erreicht. */
const SAX_GRIP_UP: Pt = [11.4, 16];
const SAX_GRIP_LOW: Pt = [10.7, 26];
/** Hinstrecken, Anheben, Abstellen – jeweils in Sekunden. */
const SAX_REACH = 0.9;
const SAX_LIFT = 1.0;
const SAX_LOWER = 1.0;
/** Planungsvorlauf auf der Audio-Zeitachse – keine Stille in der Melodie */
const SAX_LEAD = 0.06;

/** begehbarer Bereich je Ebene (x von, x bis) */
const RANGE: [number, number][] = [
  [362, 818],
  [122, 818],
  [122, OG_X1],
  [DG_X0 + 2, 818],
];

/* ------------------------------ Hilfsfunktionen ----------------------- */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const weich = (v: number) => {
  const p = clamp(v, 0, 1);
  return p * p * (3 - 2 * p);
};
const punktMischen = (a: Pt, b: Pt, p: number): Pt => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const drehen = ([x, y]: Pt, winkel: number): Pt => [x * Math.cos(winkel) - y * Math.sin(winkel), x * Math.sin(winkel) + y * Math.cos(winkel)];

function teeStandX(t: number) {
  // Neben Kanne und Tasse treten, zum Einschenken wieder etwas nach links.
  if (t < 0.4) return lerp(TEE_POSE_X, TEE_STAND_TASSE, weich(t / 0.32));
  if (t < 0.83) return lerp(TEE_STAND_TASSE, TEE_STAND_KANNE, weich((t - 0.4) / 0.43));
  if (t < 1.29) return TEE_STAND_KANNE;
  if (t < 1.62) return lerp(TEE_STAND_KANNE, TEE_POSE_X, weich((t - 1.29) / 0.33));
  if (t < 3.8) return TEE_POSE_X;
  if (t < 4.22) return lerp(TEE_POSE_X, TEE_STAND_KANNE, weich((t - 3.8) / 0.42));
  if (t < TEE_TRINKEN_ENDE) return TEE_STAND_KANNE;
  if (t < TEE_ABGESETZT) return lerp(TEE_STAND_KANNE, TEE_STAND_TASSE, weich((t - TEE_TRINKEN_ENDE) / (TEE_ABGESETZT - TEE_TRINKEN_ENDE)));
  return lerp(TEE_STAND_TASSE, TEE_POSE_X, weich((t - TEE_ABGESETZT) / (TEA_DAUER - TEE_ABGESETZT)));
}

function teeSchluck(t: number) {
  const fortschritt = clamp((t - TEE_SCHLUCK.start) / TEE_SCHLUCK.dauer, 0, TEE_SCHLUCK.anzahl);
  const schlucke = Math.floor(fortschritt);
  const takt = fortschritt - schlucke;
  // Tasse nach jedem Schluck sichtbar etwas senken. Der Tee wirkt nur am Mund.
  const hub = weich(takt / 0.25) * (1 - weich((takt - 0.64) / 0.26));
  const getrunken = (schlucke + weich((takt - 0.25) / 0.39)) / TEE_SCHLUCK.anzahl;
  return { hub, getrunken };
}

function teeFuellstand(t: number, getrunken: number) {
  return t < 3.8 ? clamp((t - 1.6) / 2.2, 0, 1) : 1 - getrunken;
}

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = clamp(t, 0, 1);
  return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(
    lerp(A[2], B[2], k),
  )})`;
}

function rrPath(c: C, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.lineTo(x + w - rad, y);
  c.quadraticCurveTo(x + w, y, x + w, y + rad);
  c.lineTo(x + w, y + h - rad);
  c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  c.lineTo(x + rad, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - rad);
  c.lineTo(x, y + rad);
  c.quadraticCurveTo(x, y, x + rad, y);
  c.closePath();
}
const rect = (c: C, x: number, y: number, w: number, h: number, f: string) => {
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
};
const rrect = (c: C, x: number, y: number, w: number, h: number, r: number, f: string) => {
  rrPath(c, x, y, w, h, r);
  c.fillStyle = f;
  c.fill();
};
const disc = (c: C, x: number, y: number, r: number, f: string) => {
  c.fillStyle = f;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
};
const poly = (c: C, pts: Pt[], f: string) => {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = f;
  c.fill();
};
const line = (c: C, x1: number, y1: number, x2: number, y2: number, col: string, w = 1) => {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
};

/** Dachgeschoss: Höhe der Innendecke an der Stelle x */
const atticCeil = (x: number) => 130 - 0.25 * (x < 470 ? x - 110 : 830 - x);
/** Oberkante des Daches an der Stelle x */
const roofTop = (x: number) => 22 + 0.25 * Math.abs(x - 470);

/* ------------------------------ Uhrzeit (MEZ) ------------------------- */

export interface Clock {
  hour: number;
  min: number;
  day: number;
  month: number;
  year: number;
}

export function berlinNow(): Clock {
  try {
    const parts = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date());
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return { hour: g("hour") % 24, min: g("minute"), day: g("day"), month: g("month"), year: g("year") };
  } catch {
    const d = new Date();
    return { hour: d.getHours(), min: d.getMinutes(), day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }
}

/* ------------------------------ Himmel -------------------------------- */

interface SkyKey {
  h: number;
  top: string;
  bot: string;
  n: number;
}
const SKY_KEYS: SkyKey[] = [
  { h: 0, top: "#080d26", bot: "#17204a", n: 1 },
  { h: 5, top: "#0f1740", bot: "#27315f", n: 0.9 },
  { h: 6.8, top: "#3b4f86", bot: "#e79a6c", n: 0.45 },
  { h: 8.5, top: "#5b9bd6", bot: "#cfe6f5", n: 0.06 },
  { h: 12, top: "#4a9be0", bot: "#d7edf9", n: 0 },
  { h: 15.5, top: "#5a95d0", bot: "#ecd9b4", n: 0.04 },
  { h: 17.2, top: "#5f6aa8", bot: "#f0a874", n: 0.28 },
  { h: 18.6, top: "#2b3560", bot: "#c4687c", n: 0.62 },
  { h: 20.5, top: "#0f1a3e", bot: "#2a3560", n: 0.92 },
  { h: 24, top: "#080d26", bot: "#17204a", n: 1 },
];

function skyAt(hour: number): { top: string; bot: string; night: number } {
  let i = 0;
  while (i < SKY_KEYS.length - 2 && hour > SKY_KEYS[i + 1].h) i++;
  const a = SKY_KEYS[i];
  const b = SKY_KEYS[i + 1];
  const k = clamp((hour - a.h) / (b.h - a.h), 0, 1);
  const s = k * k * (3 - 2 * k);
  return { top: mix(a.top, b.top, s), bot: mix(a.bot, b.bot, s), night: lerp(a.n, b.n, s) };
}

const MOUNTAINS: Pt[] = [
  [0, 430], [50, 372], [100, 404], [180, 326], [250, 392], [330, 350], [420, 410],
  [520, 336], [600, 396], [700, 352], [780, 404], [860, 330], [960, 388], [960, 462], [0, 462],
];

/** Zeichnet Himmel, Gestirne, Berge und Wald. Liefert die Nachtstärke 0..1. */
function drawSkyLayer(c: C, hour: number): number {
  const k = skyAt(hour);
  const g = c.createLinearGradient(0, 0, 0, 470);
  g.addColorStop(0, k.top);
  g.addColorStop(1, k.bot);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  if (k.night > 0.3) {
    c.fillStyle = "#ffffff";
    const a = clamp((k.night - 0.3) / 0.6, 0, 1);
    for (let i = 0; i < 110; i++) {
      c.globalAlpha = a * (0.4 + hash(i + 9) * 0.6);
      const s = 0.8 + hash(i + 3) * 1.4;
      c.fillRect(hash(i) * W, hash(i + 50) * 330, s, s);
    }
    c.globalAlpha = 1;
  }

  if (hour >= 5.5 && hour <= 18.5) {
    const u = clamp((hour - 6) / 12, 0, 1);
    const sx = 100 + u * 760;
    const sy = 390 - Math.sin(u * Math.PI) * 280;
    const gl = c.createRadialGradient(sx, sy, 4, sx, sy, 90);
    gl.addColorStop(0, "rgba(255,244,200,.85)");
    gl.addColorStop(1, "rgba(255,244,200,0)");
    c.fillStyle = gl;
    c.beginPath();
    c.arc(sx, sy, 90, 0, Math.PI * 2);
    c.fill();
    disc(c, sx, sy, 17, "#fff4cc");
  }
  if (k.night > 0.4) {
    const u = clamp(((hour + 6) % 24) / 12, 0, 1);
    const mx = 100 + u * 760;
    const my = 390 - Math.sin(u * Math.PI) * 260;
    c.globalAlpha = clamp((k.night - 0.4) / 0.4, 0, 1);
    disc(c, mx, my, 16, "#f1f5ff");
    disc(c, mx - 6, my - 3, 14, k.top);
    c.globalAlpha = 1;
  }

  const n = k.night;
  const mg = c.createLinearGradient(0, 310, 0, 440);
  mg.addColorStop(0, mix("#f4f8ff", "#3a4a7a", n));
  mg.addColorStop(0.45, mix("#a9bcd8", "#1d2850", n));
  mg.addColorStop(1, mix("#6f86a8", "#121a38", n));
  c.beginPath();
  c.moveTo(MOUNTAINS[0][0], MOUNTAINS[0][1]);
  for (let i = 1; i < MOUNTAINS.length; i++) c.lineTo(MOUNTAINS[i][0], MOUNTAINS[i][1]);
  c.closePath();
  c.fillStyle = mg;
  c.fill();

  const pine = mix("#2c4a4c", "#0b1428", n);
  const snow = mix("#e8f0f6", "#34406a", n);
  for (let i = 0; i < 48; i++) {
    const x = i * 21 - 6;
    const h = 34 + hash(i) * 22;
    poly(c, [[x, 464], [x + 10, 464 - h], [x + 20, 464]], pine);
    poly(c, [[x + 5, 464 - h * 0.62], [x + 10, 464 - h], [x + 15, 464 - h * 0.62]], snow);
  }
  rect(c, 0, 458, W, 142, mix("#dfe9f2", "#2a3558", n));
  return n;
}

/* ------------------------------ Stationen ------------------------------ */

type Prop = "cup" | "pad" | "book" | "pan";

export interface Station {
  id: string;
  label: string;
  floor: number;
  x: number;
  face: 1 | -1;
  state: LuniState;
  expr: LuniExpr;
  yOff?: number;
  prop?: Prop;
  hits: Rect4[];
  screen?: "tv_e" | "tv_d";
  zzz?: boolean;
  blanket?: boolean;
}

type LuniCommand = string | Station;

const [FK, FE, FO, FD] = FLOOR_Y;
/** Kesselstation nur für das Gruselhaus; das normale Haus behält "Herd". */
function baseKessel(): Station {
  return { id: "kessel", label: "Hexenkessel", floor: 1, x: 702, face: 1, state: "act", expr: "focus", hits: [[690, 380, 36, 26], [699, 356, 26, 24]] };
}

export const STATIONS: Station[] = [
  /* ---- Erdgeschoss ---- */
  { id: "haustuer", label: "Haustür", floor: 1, x: 161, face: -1, state: "think", expr: "think", hits: [[131, 362, 60, 86]] },
  { id: "garderobe", label: "Garderobe", floor: 1, x: 220, face: 1, state: "act", expr: "neutral", hits: [[196, 372, 48, 76]] },
  { id: "buecher", label: "Bücherregal", floor: 1, x: 278, face: 1, state: "act", expr: "happy", prop: "book", hits: [[258, 356, 40, 92]] },
  {
    // Hängt im Wohnzimmer über dem Fernseher (TV-Mitte x=465) und ist daran ausgerichtet.
    id: "adventskalender", label: "Adventskalender", floor: 1, x: 465, face: 1, state: "idle", expr: "happy",
    hits: [[438, 336, 54, 56]],
  },
  { id: "odin", label: "Odin", floor: 1, x: 314, face: 1, state: "pet", expr: "happy", hits: [[317, 418, 38, 31]] },
  { id: "apollo", label: "Apollo", floor: 1, x: 442, face: 1, state: "pet", expr: "happy", hits: [[445, 418, 38, 31]] },
  {
    id: "sofa", label: "Sofa & Fernseher", floor: 1, x: 372, face: 1, state: "sit", expr: "happy", yOff: -16, screen: "tv_e",
    hits: [[306, 402, 96, 46], [438, 392, 54, 56]],
  },
  { id: "kellertuer", label: "Kellertür", floor: 0, x: 413, face: 1, state: "idle", expr: "neutral", hits: [[496, 366, 54, 82]] },
  { id: "kuehlschrank", label: "Kühlschrank", floor: 1, x: 593, face: 1, state: "act", expr: "happy", hits: [[574, 370, 38, 78]] },
  { id: "kaffee", label: "Kaffeemaschine", floor: 1, x: 674, face: 1, state: "act", expr: "happy", prop: "cup", hits: [[662, 386, 26, 26]] },
  {
    id: "tee", label: "Gesundheitstee", floor: 1, x: TEE_POSE_X, face: 1, state: "idle", expr: "happy",
    hits: [[628, 380, 30, 30]],
  },
  {
    id: "herd", label: "Herd", floor: 1, x: 708, face: 1, state: "act", expr: "focus",
    hits: [[690, 406, 36, 42]],
  },
  { id: "esstisch", label: "Esstisch", floor: 1, x: 741, face: 1, state: "sit", expr: "happy", yOff: -12, prop: "cup", hits: [[730, 408, 86, 40]] },
  {
    id: "tabak", label: "Zigaretten stopfen", floor: 1, x: 741, face: 1, state: "roll", expr: "happy",
    yOff: -12, hits: [[750, 394, 26, 24]],
  },
  /* ---- 1. Stock ---- */
  { id: "bett", label: "Bett", floor: 2, x: 345, face: 1, state: "lie", expr: "sleep", yOff: -20, zzz: true, blanket: true, hits: [[282, 272, 114, 52]] },
  { id: "nachttisch", label: "Nachttisch", floor: 2, x: 409, face: -1, state: "act", expr: "neutral", hits: [[396, 284, 28, 40]] },
  { id: "kleiderschrank", label: "Kleiderschrank", floor: 2, x: 458, face: 1, state: "act", expr: "think", hits: [[434, 240, 48, 84]] },
  { id: "brille", label: "Brille", floor: 2, x: 632, face: 1, state: "act", expr: "happy", hits: [[631, 272, 26, 24]] },
  { id: "spiegelschrank", label: "Spiegelschrank", floor: 2, x: 636, face: 1, state: "act", expr: "happy", hits: [[633, 242, 34, 34]] },
  { id: "buerste", label: "Haarbürste", floor: 2, x: 636, face: 1, state: "act", expr: "happy", hits: [[635, 252, 30, 24]] },
  { id: "dusche", label: "Dusche", floor: 2, x: 521, face: 1, state: "act", expr: "happy", hits: [[500, 234, 44, 90]] },
  /* ---- Dachgeschoss ---- */
  {
    id: "gaming", label: "Gaming-Ecke", floor: 3, x: 338, face: 1, state: "sit", expr: "focus", yOff: -8, prop: "pad", screen: "tv_d",
    hits: [[294, 170, 60, 30], [404, 134, 66, 66]],
  },
  {
    id: "saxophon", label: "Saxophon", floor: 3, x: SAX_STAND_X + 1, face: -1, state: "sax", expr: "happy",
    hits: [[SAX_STAND_X - 8, 134, 28, 66]],
  },
  {
    id: "mikrofon", label: "Mikrofon", floor: 3, x: MIC_STAND_X - 10, face: 1, state: "idle", expr: "happy",
    hits: [[MIC_STAND_X - 12, 144, 24, 56]],
  },
  {
    id: "klavier", label: "Klavier", floor: 3, x: 567, face: 1, state: "piano", expr: "happy", yOff: 0,
    // Korpus und Klaviaturkasten beide exakt 545–589 (Mitte 567), Hocker zentriert 554–580.
    hits: [[545, 142, 46, 58], [543, 164, 48, 24], [552, 176, 30, 26]],
  },
  {
    id: "kerzen", label: "Kerzen", floor: 3, x: 567, face: 1, state: "reachUp", expr: "focus",
    hits: [[550, 112, 38, 26]],
  },
  { id: "spielregal", label: "Spieleregal", floor: 3, x: 504, face: 1, state: "act", expr: "think", hits: [[486, 126, 38, 74]] },
  {
    id: "gol_game", label: "Spiel des Lebens", floor: 3, x: 490, face: 1, state: "act", expr: "focus",
    // Oberste Regalebene, innerhalb des Schranks – nicht im Laufweg davor.
    hits: [[486, 126, 38, 24]],
  },
  {
    // Teleflauschi „Flauschi“: das Spielmodul liegt eine Brettreihe tiefer.
    id: "flauschi_modul", label: "Teleflauschi", floor: 3, x: 502, face: 1, state: "act", expr: "focus",
    hits: [[486, 164, 38, 24]],
  },
  {
    id: "platten", label: "Plattenspieler", floor: 3, x: 696, face: 1, state: "danceSway", expr: "happy",
    hits: [[698, 166, 52, 34], [678, 164, 16, 36], [754, 164, 16, 36], [776, 154, 30, 46]],
  },
  { id: "gitarre", label: "Gitarre", floor: 3, x: 800, face: 1, state: "act", expr: "happy", hits: [[806, 148, 24, 52]] },
  /* ---- Keller ---- */
  {
    id: "zimmertuer", label: "Schleusentür", floor: 0, x: 618, face: -1, state: "idle",
    expr: "neutral", hits: [[582, 486, 22, 88]],
  },
  { id: "krempel", label: "Krempel-Regale", floor: 0, x: 384, face: -1, state: "think", expr: "think", hits: [[354, 466, 56, 106], [528, 480, 60, 92]] },
  { id: "xmaskiste", label: "Weihnachtskiste", floor: 0, x: 548, face: 1, state: "act", expr: "happy", hits: [[526, 540, 44, 32]] },
  {
    // Osterei: der Datenkoffer steht auf den Kartons im Krempelraum.
    id: "datenkoffer", label: "Datenkoffer", floor: 0, x: 461, face: 1, state: "act", expr: "think",
    hits: [[440, 516, 40, 34]],
  },
  { id: "leinen", label: "Jacken & Hundeleinen", floor: 0, x: 640, face: 1, state: "act", expr: "neutral", hits: [[604, 486, 66, 58]] },
  {
    id: "raucherstuhl", label: "Stuhl", floor: 0, x: ASH_STAND_X, face: 1, state: "sit", expr: "happy",
    yOff: -10, hits: [[ASH_STAND_X - 14, 526, 25, 46]],
  },
  {
    id: "aschenbecher", label: "Aschenbecher", floor: 0, x: ASH_X, face: 1, state: "idle",
    expr: "neutral", hits: [[ASH_X - 11, SIDE_TOP - 20, 24, 24]],
  },
  {
    id: "eimer", label: "Eimer", floor: 0, x: BUCKET_X - 17, face: 1, state: "idle",
    expr: "neutral", hits: [[BUCKET_X - 12, FLOOR_Y[0] - 24, 24, 24]],
  },
  {
    id: "aussentuer", label: "Tür zum Garten", floor: 0, x: 818, face: 1, state: "idle", expr: "neutral",
    hits: [[824, 476, 26, 100]],
  },
  { id: "kellertreppe", label: "Kellertreppe", floor: 1, x: 523, face: 1, state: "idle", expr: "neutral", hits: [[440, 470, 70, 102]] },
];

/* -------------------------------- Treppen ------------------------------ */

export interface Stair {
  id: string;
  lower: number;
  upper: number;
  footX: number;
  topX: number;
  /** true: die Treppe verschwindet hinter der Decke und endet an einer Tür */
  warp: boolean;
}

export const STAIRS: Stair[] = [
  { id: "keller", lower: 0, upper: 1, footX: 413, topX: 523, warp: true },
  { id: "eg_og", lower: 1, upper: 2, footX: 818, topX: OG_X1, warp: false },
  { id: "og_dg", lower: 2, upper: 3, footX: 136, topX: DG_X0 + 2, warp: false },
];

function stairPos(s: Stair, t: number): Pt {
  return [
    lerp(s.footX, s.topX, t),
    lerp(FLOOR_Y[s.lower], FLOOR_Y[s.upper], t),
  ];
}

/* ------------------------------ Lichtquellen --------------------------- */

const LAMPS: { x: number; y: number; r: number; kueche?: boolean }[] = [
  { x: 170, y: 372, r: 100 },
  { x: 302, y: 372, r: 118 },
  { x: 650, y: 360, r: 125 },
  { x: 340, y: 236, r: 110 },
  { x: 409, y: 292, r: 80 },
  { x: 590, y: 222, r: 96 },
  { x: 430, y: 150, r: 135 },
  { x: 700, y: 150, r: 125 },
  { x: 470, y: 484, r: 115 },
  { x: 700, y: 484, r: 115, kueche: true },
];

/* ========================================================================
   STATISCHE SZENE
   ======================================================================== */

function wallBand(c: C, x0: number, x1: number, yTop: number, yBot: number, wall: string, wain: string, wainH: number) {
  rect(c, x0, yTop, x1 - x0, yBot - yTop, wall);
  c.globalAlpha = 0.06;
  for (let x = x0 + 8; x < x1; x += 22) rect(c, x, yTop, 9, yBot - yTop, "#ffffff");
  c.globalAlpha = 1;
  rect(c, x0, yBot - wainH, x1 - x0, wainH, wain);
  rect(c, x0, yBot - wainH, x1 - x0, 2, "rgba(255,255,255,.2)");
  rect(c, x0, yBot - 5, x1 - x0, 5, "rgba(0,0,0,.22)");
}

type Pattern = "wood" | "tile" | "none";
function slab(c: C, x0: number, x1: number, F: number, segs: [number, number, string, Pattern][], body = "#3a2e28") {
  rect(c, x0, F + 6, x1 - x0, SLAB - 6, body);
  for (const [a, b, col, pat] of segs) {
    rect(c, a, F, b - a, 6, col);
    rect(c, a, F, b - a, 1.6, "rgba(255,255,255,.24)");
    if (pat === "wood") for (let x = a + 13; x < b; x += 26) rect(c, x, F, 1, 6, "rgba(60,30,15,.35)");
    if (pat === "tile") for (let x = a + 14; x < b; x += 14) rect(c, x, F, 1, 6, "rgba(0,0,0,.16)");
  }
  rect(c, x0, F + SLAB - 2, x1 - x0, 2, "rgba(0,0,0,.3)");
}

function windowRect(
  c: C,
  sky: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  opt: { mull?: number; curtain?: string; kranz?: boolean } = {},
) {
  rect(c, x - 3, y - 3, w + 6, h + 6, "#efe6d2");
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.drawImage(sky, 0, 0, W, H);
  c.globalAlpha = 0.12;
  poly(c, [[x + w * 0.1, y + h], [x + w * 0.5, y], [x + w * 0.72, y], [x + w * 0.32, y + h]], "#ffffff");
  c.globalAlpha = 1;
  // Eisblumen: Von den Scheibenrändern wächst leichter Reif nach innen.
  fensterReif(c, x, y, w, h, x * 7 + y);
  c.restore();
  const m = opt.mull ?? 2;
  for (let i = 1; i < m; i++) line(c, x + (w / m) * i, y, x + (w / m) * i, y + h, "#efe6d2", 2.2);
  if (h > 30) line(c, x, y + h * 0.5, x + w, y + h * 0.5, "#efe6d2", 2.2);
  rect(c, x - 6, y + h + 3, w + 12, 4, "#d9cfb8");
  rect(c, x - 6, y + h + 7, w + 12, 2, "rgba(0,0,0,.25)");
  if (opt.kranz) goldstangeMitSamt(c, x, y, w, h);
  else if (opt.curtain) {
    rrect(c, x - 5, y - 4, w * 0.24, h + 8, 3, opt.curtain);
    rrect(c, x + w - w * 0.24 + 5, y - 4, w * 0.24, h + 8, 3, opt.curtain);
    rect(c, x - 7, y - 6, w + 14, 2.4, "#3a2e28");
  }
  // Weihnachtshaus: Tannenzweig-Kranz im Stil des geschmückten Adventskalenders.
  if (opt.kranz) fensterKranz(c, x, y, w, h);
}

function roundWindow(c: C, sky: HTMLCanvasElement, cx: number, cy: number, r: number, kranz = false) {
  disc(c, cx, cy, r + 3, "#efe6d2");
  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.clip();
  c.drawImage(sky, 0, 0, W, H);
  rundReif(c, cx, cy, r, cx);
  c.restore();
  line(c, cx - r, cy, cx + r, cy, "#efe6d2", 2);
  line(c, cx, cy - r, cx, cy + r, "#efe6d2", 2);
  if (kranz) {
    goldstangeMitSamt(c, cx - r + 1, cy - r + 1.8, 2 * r - 2, 2 * r - 1.8);
    rundFensterKranz(c, cx, cy, r);
  }
}

function picture(c: C, x: number, y: number, w: number, h: number, col: string) {
  rect(c, x, y, w, h, "#efe6d2");
  rect(c, x + 3, y + 3, w - 6, h - 6, col);
  poly(c, [[x + 3, y + h - 3], [x + w * 0.5, y + h * 0.42], [x + w - 3, y + h - 3]], "rgba(0,0,0,.22)");
  c.strokeStyle = "#8a6a3c";
  c.lineWidth = 2;
  c.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function ceilingLamp(c: C, x: number, y0: number, len: number, col = "#e9d9a8") {
  line(c, x, y0, x, y0 + len, "#2a2420", 1.4);
  poly(c, [[x - 11, y0 + len + 9], [x + 11, y0 + len + 9], [x + 6, y0 + len], [x - 6, y0 + len]], col);
  disc(c, x, y0 + len + 10, 3.4, "#fff3c4");
}

/** Höhe der kleinen Brüstungen an den Treppenaustritten: Die Streben sind halb so hoch wie früher. */
export const BRUESTUNG_HOEHE = 13;

function railing(c: C, x: number, F: number, w: number) {
  line(c, x, F - BRUESTUNG_HOEHE, x + w, F - BRUESTUNG_HOEHE, "#2a2420", 3);
  for (let px = x; px <= x + w + 0.1; px += w / 2) line(c, px, F - BRUESTUNG_HOEHE, px, F, "#2a2420", 2);
}

/* --- Treppen --- */

/** Höhe der Treppengeländer über den Stufen: Die Streben sind um die Hälfte gekürzt, der Handlauf folgt. */
export const GELAENDER_HOEHE = 27;

function drawStair(c: C, s: Stair) {
  const fy = FLOOR_Y[s.lower];
  const ty = FLOOR_Y[s.upper];
  const fx = s.footX;
  const tx = s.topX;
  const N = 11;
  c.save();
  if (s.warp) {
    c.beginPath();
    c.rect(CEL_X0, ty + SLAB, HR - CEL_X0, fy - ty - SLAB);
    c.clip();
  }
  poly(c, [[fx, fy + 4], [tx, ty + 4], [tx, ty + 15], [fx, fy + 15]], "#5a3c26");
  for (let i = 0; i < N; i++) {
    const xa = fx + ((tx - fx) * i) / N;
    const xb = fx + ((tx - fx) * (i + 1)) / N;
    const y = fy + ((ty - fy) * (i + 0.5)) / N;
    const x0 = Math.min(xa, xb) - 1.5;
    const w = Math.abs(xb - xa) + 3;
    rect(c, x0, y, w, 5, "#a46c3f");
    rect(c, x0, y, w, 1.6, "rgba(255,230,190,.35)");
    rect(c, x0, y + 5, w, 1.5, "rgba(0,0,0,.28)");
  }
  line(c, fx, fy - GELAENDER_HOEHE, tx, ty - GELAENDER_HOEHE, "#2a2420", 3.4);
  line(c, fx, fy - GELAENDER_HOEHE - 2, tx, ty - GELAENDER_HOEHE - 2, "rgba(255,255,255,.14)", 1.2);
  for (let i = 0; i <= N; i += 2) {
    const px = fx + ((tx - fx) * i) / N;
    const py = fy + ((ty - fy) * i) / N;
    line(c, px, py - GELAENDER_HOEHE, px, py, "#2a2420", 2);
  }
  c.restore();
}

/* --- Möbel: Erdgeschoss --- */

function haustuer(c: C, sky: HTMLCanvasElement, x: number, F: number, kranz = false) {
  rect(c, x - 4, F - 86, 60, 86, "#ddd3bc");
  rect(c, x, F - 82, 52, 82, "#6e4a2f");
  rect(c, x + 5, F - 38, 42, 32, "#5a3b25");
  rect(c, x + 5, F - 76, 42, 32, "#5a3b25");
  c.save();
  c.beginPath();
  c.rect(x + 10, F - 72, 32, 24);
  c.clip();
  c.drawImage(sky, 0, 0, W, H);
  fensterReif(c, x + 10, F - 72, 32, 24, 3);
  c.restore();
  line(c, x + 26, F - 72, x + 26, F - 48, "#6e4a2f", 2);
  disc(c, x + 44, F - 40, 2.4, "#e6c36a");
  rrect(c, x + 2, F - 3, 48, 3, 1.5, "#9c4a3a");
  if (kranz) {
    goldstangeMitSamt(c, x + 10, F - 72, 32, 24);
    fensterKranz(c, x + 10, F - 72, 32, 24);
  }
}

function garderobe(c: C, x: number, F: number, weihnacht = false) {
  const farben = weihnacht ? WEIHNACHTS_FARBEN.moebel.garderobe : ["#c9453a", "#e2b24a", "#2f4a6b"];
  rect(c, x, F - 74, 44, 5, "#6b4a2a");
  for (let i = 0; i < 4; i++) disc(c, x + 6 + i * 11, F - 70, 1.8, "#d9c38a");
  rrect(c, x + 3, F - 68, 12, 32, 4, farben[0]);
  rrect(c, x + 17, F - 68, 12, 28, 4, farben[1]);
  rrect(c, x + 31, F - 68, 12, 34, 4, farben[2]);
  rect(c, x + 2, F - 9, 40, 2.5, "#5a4630");
  rrect(c, x + 4, F - 14, 10, 5, 2, "#202833");
  rrect(c, x + 18, F - 14, 10, 5, 2, "#a6483c");
  rrect(c, x + 31, F - 14, 10, 5, 2, "#e8e2d2");
}

const BOOK_COLS = ["#c9453a", "#e2b24a", "#2f8f83", "#3f6fb0", "#8fb23a", "#8a63c9", "#d9577f", "#e6dfcf"];
function bookshelf(
  c: C,
  x: number,
  F: number,
  w: number,
  h: number,
  rows: number,
  seed: number,
  games = false,
  /** Reservierte Fächer der Reihe nach – für die Spielmodule im Regal. */
  gap?: readonly { row: number; index: number; item?: (c: C, x: number, y: number, w: number, h: number) => void }[],
  farben: readonly string[] = BOOK_COLS,
) {
  rect(c, x, F - h, w, h, "#6f4f2c");
  rect(c, x + 3, F - h + 3, w - 6, h - 6, "#35261a");
  const rh = (h - 6) / rows;
  for (let r = 0; r < rows; r++) {
    const base = F - h + 3 + rh * (r + 1);
    let bx = x + 4;
    let i = 0;
    while (bx < x + w - 6) {
      const bw0 = games ? 6 + ((i + r + seed) % 3) : 3 + ((i * 7 + r * 3 + seed) % 4);
      const bw = Math.min(bw0, x + w - 4 - bx);
      const bh = rh - 5 - ((i * 5 + r + seed) % (games ? 3 : 6));
      const fach = gap?.find((g) => g.row === r && g.index === i);
      const reserved = !!fach;
      if (reserved && fach) {
        if (fach.item) fach.item(c, bx, base - bh, bw, bh);
      } else {
        rect(c, bx, base - bh, bw, bh, farben[(i * 3 + r * 5 + seed) % farben.length]);
      }
      bx += bw + 0.8;
      i++;
    }
    rect(c, x + 3, base, w - 6, 2, "#6f4f2c");
  }
}

/** Luni auf dem vorhandenen Kissen: dieselbe Figur wie beim Gehen und Sitzen. */
function drawBedScene(
  c: C,
  x: number,
  y: number,
  t: number,
  pj: { top: string; bottom: string } | null,
  o: { pull: number; grab: number; turn: number; hair: number },
  sarg = false,
  outfit: "dressed" | "towel" | "none" = "dressed",
  glasses = false,
  weihnacht = false,
) {
  const zug = clamp(o.pull, 0, 1);
  const links = lerp(338, 320, zug);
  const oben = sarg ? FLOOR_Y[2] - 36 - 12 * zug : lerp(288, 281, zug);
  clipBedCover(c, links, oben);
  drawLuni(c, x, y, {
    t, state: "lie", expr: "sleep", blink: 1, scale: LUNI_SCALE,
    shadow: false, glasses, outfit, pajama: pj, hairAside: o.hair, bedCover: true,
  });
  // Hände zuerst: die Decke verdeckt sie, sobald sie darunter liegen.
  // Nur die greifenden Finger und die Hand auf dem Kissen bleiben sichtbar.
  if (o.grab > 0.01) {
    const edge = lerp(338, 320, clamp(o.pull, 0, 1));
    const turn = clamp(o.turn, 0, 1);
    c.save();
    c.globalAlpha *= clamp(o.grab, 0, 1);
    c.fillStyle = LUNI_COLORS.skin;
    c.beginPath();
    c.ellipse(lerp(edge + 2, 313, turn), lerp(FLOOR_Y[2] - 34 - 12 * clamp(o.pull, 0, 1), FLOOR_Y[2] - 30, turn), 3.2, 1.8, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(lerp(edge + 7, 348, turn), FLOOR_Y[2] - 36 - 12 * clamp(o.pull, 0, 1) + lerp(-0.6, 3, turn), 3, 1.7, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  c.restore();
  drawBlanket(c, t, o.pull, sarg, weihnacht);
}

/**
 * Alles, was beim Liegen über die Deckenoberkante hinausragt (Arm, Hand,
 * Socke), wird aus der Figur ausgespart. Die Decke selbst wird erst danach
 * gezeichnet und behält damit ihre organische, wellige Kante unverändert.
 * Der Kopf bleibt links der Nahkante sichtbar.
 */
function clipBedCover(c: C, links: number, oben: number) {
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  // Rechts der Nahkante und oberhalb des Stoffes: Loch in der Zeichenfläche.
  c.rect(links + 3, 0, 386 - links - 3, Math.max(0, oben + 2.5));
  c.clip("evenodd");
}

/** Dasselbe Stoffstück für leere Decke, Zuschieben und Zudecken. Der Stoff wird
 * nicht verschoben, sondern zusammengeschoben: die nahe Kante hebt sich und
 * rollt sich auf (`gather`), während das Fußende auf der Matratze bleibt. */
function drawBedCloth(
  c: C, links: number, oben: number, falten: number, t: number,
  rechts = 386, unten = FLOOR_Y[2] - 16, gather = 0, welle = 0,
  weihnacht = false,
) {
  const w = rechts - links, h = unten - oben;
  const g = clamp(gather, 0, 1);
  const hub = g * 9;
  const naheOben = oben - hub * 0.4;
  const naheUnten = unten - hub * 0.95;
  const wellen = falten * 3.6 + g * 2.2;
  // Laufende Kräuselung der Oberkante: sie wandert zur Nahkante (Richtung Kopf)
  // und klingt zum Fußende hin ab. Ohne Bewegung (welle = 0) bleibt die Linie
  // unverändert – das Aufdecken sieht dadurch genau wie bisher aus.
  const rip = (x: number) => welle * Math.sin((x - links) * 0.2 + t * 7) * clamp((rechts - x) / 24, 0, 1);
  const ry = (x: number, y: number) => y + rip(x);
  c.save();
  c.beginPath();
  c.moveTo(links + 4, ry(links + 4, naheOben + wellen));
  // Oberkante: an der Nahkante hochgezogen, am Fußende flach aufliegend
  c.bezierCurveTo(
    links + w * 0.16, ry(links + w * 0.16, naheOben + wellen),
    links + w * 0.2, ry(links + w * 0.2, oben + wellen * 0.4),
    links + w * 0.3, ry(links + w * 0.3, oben + wellen * 0.5),
  );
  c.bezierCurveTo(
    links + w * 0.44, ry(links + w * 0.44, oben + wellen * 1.2),
    links + w * 0.5, ry(links + w * 0.5, oben + wellen * 0.2),
    links + w * 0.62, ry(links + w * 0.62, oben + wellen * 0.4),
  );
  c.bezierCurveTo(
    links + w * 0.76, ry(links + w * 0.76, oben + wellen),
    rechts - 7, ry(rechts - 7, oben + wellen * 0.5),
    rechts - 4, ry(rechts - 4, oben + 1),
  );
  c.quadraticCurveTo(rechts, ry(rechts, oben + 1), rechts, ry(rechts, oben + 6));
  c.lineTo(rechts, unten - 4);
  c.quadraticCurveTo(rechts, unten, rechts - 4, unten);
  // Unterkante: am Fußende flach, zur Nahkante angehoben (Stoff hängt durch)
  c.bezierCurveTo(links + w * 0.7, unten - 1, links + w * 0.6, unten - hub * 0.3, links + w * 0.48, unten - hub * 0.45);
  c.bezierCurveTo(links + w * 0.34, unten - hub * 0.75, links + w * 0.2, naheUnten + (unten - naheUnten) * 0.3, links + 4, naheUnten);
  c.quadraticCurveTo(links, naheUnten - 2, links, naheUnten - 7);
  c.lineTo(links, naheOben + 7);
  c.quadraticCurveTo(links, naheOben, links + 4, naheOben);
  if (weihnacht) winterSteppdecke(c, links, oben, w, h, g);
  else {
    c.fillStyle = "#3f7f8c";
    c.fill();
  }

  // Aufgerollte Nahkante: der Stoff stapelt sich, statt als Platte zu wandern
  if (g > 0.03) {
    c.save();
    c.globalAlpha = 0.9 * g;
    c.fillStyle = weihnacht ? WEIHNACHTS_FARBEN.decke.licht : "#5da0a8";
    c.beginPath();
    c.ellipse(links + 3.4, (naheOben + naheUnten) / 2, 3.4 + g * 1.6, (naheUnten - naheOben) / 2 - 1.5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(255,255,255,.32)";
    c.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const yy = (naheOben + naheUnten) / 2 + (i - 1) * (naheUnten - naheOben) * 0.28;
      c.beginPath();
      c.moveTo(links + 1.4, yy);
      c.lineTo(links + 5.6, yy + 0.6);
      c.stroke();
    }
    c.restore();
  }

  c.lineCap = "round";
  c.lineWidth = 1.7;
  c.strokeStyle = weihnacht ? WEIHNACHTS_FARBEN.creme : "#5da0a8";
  c.beginPath();
  c.moveTo(links + 3, ry(links + 3, naheOben + 2.6));
  c.bezierCurveTo(
    links + w * 0.2, ry(links + w * 0.2, oben + 1),
    links + w * 0.34, ry(links + w * 0.34, oben + 5 + wellen),
    links + w * 0.52, ry(links + w * 0.52, oben + 2.4),
  );
  c.bezierCurveTo(
    links + w * 0.7, ry(links + w * 0.7, oben + 1),
    rechts - 9, ry(rechts - 9, oben + 5 + falten),
    rechts - 3, ry(rechts - 3, oben + 2.6),
  );
  c.stroke();
  c.lineWidth = 0.9;
  c.strokeStyle = "rgba(255,255,255,.25)";
  c.beginPath();
  c.moveTo(links + 4, (naheOben + naheUnten) / 2 + h * 0.1);
  c.bezierCurveTo(links + w * 0.3, oben + h * 0.4, links + w * 0.6, oben + h * 0.6, rechts - 4, oben + h * 0.45);
  c.stroke();
  // Falten: laufen zur Nahkante zusammen, je mehr Stoff zusammengezogen ist
  const faltenKraft = Math.max(falten, g);
  if (faltenKraft > 0.01) {
    c.globalAlpha = faltenKraft * 0.55;
    c.strokeStyle = weihnacht ? WEIHNACHTS_FARBEN.decke.falte : "#275d68";
    c.lineWidth = 1;
    const stauch = 1 - 0.4 * g;
    for (let i = 0; i < 3; i++) {
      const x = links + 5 + i * (w - 10) / 3 * stauch;
      const bewegung = Math.sin(t * 1.6 + i) * 0.5 * faltenKraft;
      c.beginPath();
      c.moveTo(x, oben + 5 + (i % 2) * 2);
      c.bezierCurveTo(x - 4 + bewegung, oben + h * 0.35, x + 4, unten - hub * 0.5, lerp(x, links + 5, g) - 1, unten - hub * 0.55);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  c.restore();
}

/** Eine einzige Decke auf der Matratze. Im normalen Haus hat sie beim Liegen
 *  dieselbe Dicke wie beim Zudecken (Oberkante 281, Unterkante 308). */
function drawBlanket(c: C, t: number, pull = 1, sarg = false, weihnacht = false) {
  const p = clamp(pull, 0, 1);
  const x = lerp(338, 320, p);
  if (!sarg) {
    const y = lerp(288, 281, p) + Math.sin(t * 1.1) * 0.15;
    drawBedCloth(c, x, y, 0, t, 386, FLOOR_Y[2] - 16, 0, 0, weihnacht);
    return;
  }
  const y = FLOOR_Y[2] - 36 - 12 * p + Math.sin(t * 1.1) * 0.15;
  const w = 386 - x;
  rrect(c, x, y, w, FLOOR_Y[2] - 16 - y, 6, "#580f1a");
  rrect(c, x + 2, y + 1.2, w - 4, 3, 1.5, "#8c1b29");
  rect(c, x + 4, y + 8, w - 8, 1.6, "#c9a46a");
  rect(c, x + 4, y + 15, w - 8, 1.2, "#a58350");
}

type BedEntryPhase = "umschlagen" | "setzen" | "fuesse" | "greifen" | "toss" | "hinlegen";

/** Lage des Stoffes je Phase. `falten` = sichtbare Falten, `gather` = wie viel
 *  Stoff an der Nahkante zusammengerollt ist, `welle` = laufende Kräuselung
 *  (nur beim Zudecken). Das Fußende bleibt stets auf dem Bett; jede Phase
 *  endet dort, wo die nächste beginnt. */
function bedBlanketPose(phase: BedEntryPhase, p: number) {
  const e = sanft(clamp(p, 0, 1));
  if (phase === "umschlagen") return { links: lerp(328, 350, e), oben: lerp(288, 284.5, e), falten: e, gather: lerp(0.15, 0.35, e), welle: 0 };
  if (phase === "greifen") return { links: lerp(350, 334, e), oben: lerp(284.5, 281, e), falten: lerp(0.35, 1, e), gather: lerp(0.35, 1, e), welle: 0 };
  if (phase === "toss") return { links: 334, oben: 281, falten: 1, gather: 1, welle: 0 };
  if (phase === "hinlegen") {
    // Zudecken: der Stoff wird vom Fußende über den Körper gezogen. Die Dicke
    // bleibt konstant; nur die Nahkante wandert und rollt sich ab. Die Kräuselung
    // läuft mit, solange sich der Stoff bewegt, und ist an beiden Enden null.
    return { links: lerp(334, 320, e), oben: 281, falten: lerp(1, 0, e), gather: 1 - e, welle: Math.sin(Math.PI * clamp(p, 0, 1)) * 1.3 };
  }
  return { links: 350, oben: 284.5, falten: 1, gather: 0.35, welle: 0 };
}

/** Greifpunkt der schiebenden Hand folgt derrollenden Stoffkante. */
function bedBlanketPushHand(p: number): Pt {
  const pose = bedBlanketPose("umschlagen", p);
  return [lerp(BETT_STAND_X + 8, 349.7, sanft(p)), pose.oben + 4];
}

function drawBedEntryBlanket(c: C, t: number, phase: BedEntryPhase, p: number, weihnacht = false) {
  const pose = bedBlanketPose(phase, p);
  drawBedCloth(c, pose.links, pose.oben, pose.falten, t, 386, FLOOR_Y[2] - 16, pose.gather, pose.welle, weihnacht);
}

/** Schlaf-Zzz: steigen in kleinen Gruppen auf (Pixelschrift, keine Webschrift). */
const zRnd = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
function drawSleepZ(c: C, x: number, y: number, t: number) {
  c.save();
  const cycle = Math.floor(t / 6);
  for (let n = cycle - 1; n <= cycle + 1; n++) {
    const start = n * 6 + zRnd(n * 17 + 4) * 2.2;
    const life = 2.4 + zRnd(n * 13 + 7) * 1.5;
    const age = t - start;
    if (age < 0 || age > life) continue;
    const count = 3 + Math.floor(zRnd(n * 11 + 2) * 3);
    for (let k = 0; k < count; k++) {
      const q = (age - k * 0.12) / life;
      if (q < 0 || q > 1) continue;
      const size = (2.2 + q * 10.5) / 7;
      const bx = x + q * (10 + zRnd(n + k * 5) * 13) + Math.sin(q * 3 + k) * 1.4;
      const by = y - q * (22 + zRnd(n * 3 + k) * 26) + k * 3;
      c.globalAlpha = Math.sin(q * Math.PI) * 0.82;
      drawPixelText(c, k < 2 ? "z" : "Z", bx, by, size, "#eaf6ff", 0);
    }
  }
  c.globalAlpha = 1;
  c.restore();
}

/** Spielmodul in der Größe eines anderen Spieleschachtes. */
function golCartridge(c: C, x: number, y: number, w: number, h: number) {
  rrect(c, x, y, w, h, 0.6, "#1b2422");
  rect(c, x + 0.6, y + 0.6, Math.max(1, w - 1.2), Math.max(1.4, h * 0.5), "#143028");
  c.fillStyle = "#3ddc84";
  const s = Math.max(0.7, Math.min(1.2, w / 6));
  c.fillRect(x + 1.1, y + 1.1, s, s);
  c.fillRect(x + 1.1 + s * 1.7, y + 1.1 + s * 1.4, s, s);
  c.fillRect(x + 1.1, y + 1.1 + s * 2.5, s, s);
}

function sofa(c: C, x: number, F: number, weihnacht = false) {
  const farben = weihnacht ? WEIHNACHTS_FARBEN.moebel.sofa
    : { kasten: "#3f7f8c", lehne: "#59a3ac", sitz: "#6bb4bb", arm: "#2f6470", kissen: "#e2b24a" };
  rrect(c, x, F - 26, 90, 26, 7, farben.kasten);
  rrect(c, x + 6, F - 46, 78, 24, 8, farben.lehne);
  rrect(c, x + 8, F - 30, 36, 14, 5, farben.sitz);
  rrect(c, x + 46, F - 30, 36, 14, 5, farben.sitz);
  rrect(c, x - 6, F - 36, 14, 36, 6, farben.arm);
  rrect(c, x + 82, F - 36, 14, 36, 6, farben.arm);
  rrect(c, x + 12, F - 44, 16, 14, 5, farben.kissen);
  if (weihnacht) {
    rrect(c, x + 68, F - 43, 13.5, 12, 3.8, WEIHNACHTS_FARBEN.leinen);
    line(c, x + 10, F - 19, x + 42, F - 19, "rgba(90,61,44,.27)", 0.8);
    line(c, x + 48, F - 19, x + 80, F - 19, "rgba(90,61,44,.27)", 0.8);
  }
}

function floorLamp(c: C, x: number, F: number) {
  line(c, x, F, x, F - 76, "#20343c", 3);
  rrect(c, x - 10, F - 3, 20, 3, 1.5, "#16282f");
  poly(c, [[x - 12, F - 74], [x + 12, F - 74], [x + 8, F - 90], [x - 8, F - 90]], "#e8dcc4");
}

function tvSet(c: C, x: number, F: number, weihnacht = false) {
  rrect(c, x, F - 20, 54, 20, 3, weihnacht ? WEIHNACHTS_FARBEN.holz : "#8a6a3c");
  rect(c, x + 3, F - 14, 22, 1.4, "rgba(0,0,0,.3)");
  rect(c, x + 29, F - 14, 22, 1.4, "rgba(0,0,0,.3)");
  rrect(c, x + 4, F - 56, 46, 36, 4, "#1d242a");
  rect(c, x + 7, F - 53, 40, 26, "#0b1217");
  rect(c, x + 22, F - 22, 10, 3, "#1d242a");
}

/** Bad im 1. Stock: je 18 Einheiten Luft zwischen Dusche, Tür und Waschbecken. */
const WC_DOOR_X = 568;
const SINK_X = 632;
/** Oberkante des Spiegelschranks */
const CAB_TOP = FLOOR_Y[2] - 82;
/** Hier landet die Brille im Becken */
const SINK_DROP: Pt = [SINK_X + 11, FLOOR_Y[2] - 37.5];

/** Brille als Gegenstand: im Flug drehend, im Becken flach liegend. */
function glassesObj(c: C, x: number, y: number, rot: number, flat = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1.08, 1.08 * flat);
  c.strokeStyle = "#15151b";
  c.fillStyle = "rgba(220,245,255,.35)";
  c.lineWidth = 0.95;
  for (const cx of [-3.1, 3.1]) {
    rrPath(c, cx - 2.7, -2.4, 5.4, 4.8, 1.7);
    c.fill();
    c.stroke();
  }
  c.beginPath();
  c.moveTo(-0.4, -0.5);
  c.lineTo(0.4, -0.5);
  c.moveTo(-5.8, -0.8);
  c.lineTo(-7.6, -1.4);
  c.moveTo(5.8, -0.8);
  c.lineTo(7.6, -1.4);
  c.stroke();
  c.restore();
}

/** WC-Tür im Bad: braunes Türblatt wie die übrigen Türen, mit Zarge. */
function wcTuer(c: C, x: number, F: number) {
  rect(c, x - 4, F - 84, 50, 84, "#d9cfb8");
  rect(c, x, F - 80, 42, 80, "#5a3b2a");
  rect(c, x + 5, F - 74, 32, 28, "#4a3022");
  rect(c, x + 5, F - 40, 32, 32, "#4a3022");
  rect(c, x, F - 80, 42, 1.4, "rgba(255,255,255,.12)");
  disc(c, x + 35, F - 40, 2.2, "#e6c36a");
  rect(c, x + 32, F - 41, 5, 1.6, "#c9a14a");
  // kleines WC-Schild
  rrect(c, x + 15, F - 72, 12, 7, 1.5, "#efe6d2");
  c.fillStyle = "#5a3b2a";
  c.font = '700 5px "Silkscreen", monospace';
  c.textAlign = "center";
  c.fillText("WC", x + 21, F - 66.8);
  c.textAlign = "left";
}

/** Waschbecken auf einer Säule, darüber ein Spiegelschrank. */
function waschbeckenMitSpiegel(c: C, x: number, F: number) {
  // Säule und Becken
  rrect(c, x + 13, F - 30, 10, 30, 2, "#e6eeec");
  rect(c, x + 13, F - 30, 2, 30, "rgba(255,255,255,.5)");
  rrect(c, x, F - 38, 36, 9, 4, "#f4f8f6");
  rect(c, x + 4, F - 37, 28, 2.4, "#cfdcda");
  // Armatur
  rect(c, x + 16.5, F - 45, 3, 8, "#b9c6c9");
  rect(c, x + 16.5, F - 45, 9, 2.4, "#b9c6c9");
  disc(c, x + 13, F - 40, 1.6, "#cfd8da");
  // Seife und Fläschchen am Beckenrand
  rrect(c, x + 26, F - 41, 6, 3, 1.2, "#e9c46a");
  rrect(c, x + 4, F - 44, 3, 6, 1, "#7ec4dc");
  // Spiegelschrank (geschlossen; offen zeichnet ihn drawCabinetOpen)
  const top = CAB_TOP;
  rrect(c, x + 1, top, 34, 34, 2, "#e8eeec");
  rect(c, x + 3, top + 2, 14.6, 30, "#bcd9dc");
  rect(c, x + 18.4, top + 2, 14.6, 30, "#b3d2d6");
  c.globalAlpha = 0.45;
  poly(c, [[x + 5, top + 30], [x + 11, top + 3], [x + 14, top + 3], [x + 8, top + 30]], "#ffffff");
  poly(c, [[x + 21, top + 28], [x + 26, top + 3], [x + 28, top + 3], [x + 23, top + 28]], "#ffffff");
  c.globalAlpha = 1;
  rect(c, x + 17.6, top + 2, 0.8, 30, "#9fb2b6");
  rect(c, x + 15, top + 16, 1.2, 5, "#8fa6b2");
  rect(c, x + 19.8, top + 16, 1.2, 5, "#8fa6b2");
}

/** Haarbürste: Griff nach oben (−y), Kopf unten, Borsten auf der +x-Seite. */
function brushObj(c: C, x: number, y: number, rot: number, face: 1 | -1 = 1) {
  c.save();
  c.translate(x, y);
  c.scale(face, 1);
  c.rotate(rot);
  rrect(c, -1.1, -9, 2.2, 9.5, 1, "#8a5a34");
  rrect(c, -2.4, 0, 4.4, 7.4, 1.6, "#c96f4a");
  c.fillStyle = "#2a2420";
  for (let i = 0; i < 5; i++) c.fillRect(2, 0.8 + i * 1.4, 1.6, 0.7);
  c.restore();
}

/** Offener Spiegelschrank: Innenraum mit Becher und Bürste, Türen nach außen. */
function drawCabinetOpen(c: C, open: number, brushInside: boolean) {
  if (open <= 0.01) return;
  const x = SINK_X;
  const top = CAB_TOP;
  const e = open * open * (3 - 2 * open);
  rect(c, x + 3, top + 2, 30, 30, "#dfe9e7");
  rect(c, x + 3, top + 2, 30, 1.5, "rgba(0,0,0,.12)");
  rect(c, x + 3, top + 15, 30, 1.6, "#c9d6d4");
  // oberes Fach: Zahnputzbecher, Creme
  rrect(c, x + 6, top + 7, 5, 8, 1, "#7ec4dc");
  rect(c, x + 7, top + 4, 1, 4, "#f2f7f4");
  rect(c, x + 9, top + 3.6, 1, 4.4, "#ff9fb0");
  rrect(c, x + 22, top + 10, 7, 5, 1.5, "#f2f7f4");
  // unteres Fach: die Bürste
  if (brushInside) brushObj(c, x + 15, top + 29.5, -Math.PI / 2);
  // Türen klappen nach außen und werden schmaler
  const dw = 14.6 - 11.4 * e;
  rect(c, x + 3 - dw * e, top + 2, dw, 30, "#bcd9dc");
  rect(c, x + 33 - dw * (1 - e), top + 2, dw, 30, "#b3d2d6");
  c.fillStyle = "rgba(255,255,255,.35)";
  c.fillRect(x + 3 - dw * e, top + 2, 1, 30);
  c.fillRect(x + 33 - dw * (1 - e) + dw - 1, top + 2, 1, 30);
}

function kellerTuer(c: C, x: number, F: number) {
  rect(c, x - 4, F - 86, 54, 86, "#d9cfb8");
  rect(c, x, F - 82, 46, 82, "#5a3b2a");
  rect(c, x + 5, F - 76, 36, 30, "#4a3022");
  rect(c, x + 5, F - 40, 36, 32, "#4a3022");
  disc(c, x + 38, F - 40, 2.2, "#e6c36a");
}

function fridge(c: C, x: number, F: number, weihnacht = false) {
  rrect(c, x, F - 78, 38, 78, 4, weihnacht ? WEIHNACHTS_FARBEN.moebel.kueche.kuehlschrank : "#e6ecec");
  rect(c, x, F - 50, 38, 3, "#c3d0cf");
  rect(c, x + 5, F - 70, 3, 14, "#93a5a4");
  rect(c, x + 5, F - 44, 3, 12, "#93a5a4");
  rect(c, x + 16, F - 68, 8, 8, weihnacht ? WEIHNACHTS_FARBEN.rot : "#ff6f61");
  rect(c, x + 26, F - 62, 8, 10, weihnacht ? WEIHNACHTS_FARBEN.gold : "#ffd166");
}

function kitchenCounter(c: C, x: number, F: number, w: number, weihnacht = false) {
  rect(c, x, F - 36, w, 36, weihnacht ? WEIHNACHTS_FARBEN.moebel.kueche.front : "#3f5a6b");
  for (const dx of [0, w * 0.34, w * 0.67, w - 1.5]) rect(c, x + dx, F - 36, 1.5, 36, "rgba(0,0,0,.28)");
  rect(c, x - 1, F - 40, w + 2, 4, weihnacht ? WEIHNACHTS_FARBEN.moebel.kueche.platte : "#efe8d8");
  rrect(c, x + 6, F - 41, 24, 4, 2, "#aeb8bb");
  line(c, x + 22, F - 41, x + 22, F - 52, "#8fa6b2", 2);
  line(c, x + 22, F - 52, x + 28, F - 52, "#8fa6b2", 2);
  // Kaffeemaschine
  rrect(c, x + 50, F - 58, 17, 18, 3, "#2a2f35");
  rect(c, x + 53, F - 46, 11, 6, "#4a2a1a");
  disc(c, x + 62, F - 54, 1.4, "#ff9f43");
  rrect(c, x + 45, F - 46, 5, 6, 1.2, "#f6f3ea");
}

function stove(c: C, x: number, F: number) {
  rect(c, x, F - 38, 36, 38, "#d9dddd");
  rect(c, x, F - 41, 36, 3, "#2a2a2a");
  disc(c, x + 10, F - 42, 3.6, "#555b60");
  disc(c, x + 26, F - 42, 3.6, "#555b60");
  rect(c, x + 4, F - 26, 28, 18, "#2a2f35");
  rect(c, x + 6, F - 24, 24, 12, "#47505a");
  for (let i = 0; i < 3; i++) disc(c, x + 8 + i * 10, F - 33, 1.5, "#8f989d");
  poly(c, [[x + 1, F - 80], [x + 35, F - 80], [x + 30, F - 94], [x + 6, F - 94]], "#cfd5d5");
  rect(c, x + 15, F - 112, 6, 18, "#aab2b4");
}

/** Tabakdose auf dem Küchentisch */
function tobaccoTin(c: C, x: number, F: number) {
  // Unterkante sitzt exakt auf der Tischplatte (Oberkante F-36)
  const base = F - 36;
  c.fillStyle = "#c9453a";
  c.beginPath();
  c.ellipse(x, base - 7, 8.5, 3, 0, 0, Math.PI * 2);
  c.fill();
  rect(c, x - 8.5, base - 8, 17, 8, "#a63a30");
  c.fillStyle = "#e2b24a";
  c.beginPath();
  c.ellipse(x, base - 7.5, 8.5, 3, 0, 0, Math.PI * 2);
  c.fill();
  rect(c, x - 6, base - 10, 12, 1.4, "#f2e0b4");
}

/** Zigarettenschachtel auf dem Küchentisch; `n` = Inhalt */
function cigCase(c: C, x: number, F: number, n: number, open = false) {
  // Unterkante = Tischplatte (F-36)
  const y = F - 36;
  rrect(c, x - 5, y - 8, 10, 8, 1.4, "#2f4a6b");
  rect(c, x - 5, y - 8, 10, 2.2, "#3f6090");
  rect(c, x - 3.4, y - 6.2, 6.8, 1.1, "#e8e2d2");
  if (open) {
    // Deckel aufgeklappt, Zigaretten schauen heraus
    poly(c, [[x - 5, y - 8], [x + 5, y - 8], [x + 4, y - 12], [x - 4, y - 12]], "#3f6090");
    for (let i = 0; i < 3; i++) rect(c, x - 3 + i * 2.4, y - 10.5, 1.6, 3, "#f6f3ea");
  }
  const dots = Math.min(3, Math.ceil((n / PACK_MAX) * 3));
  for (let i = 0; i < dots; i++) disc(c, x - 2.6 + i * 2.6, y - 2.6, 0.7, "#e2b24a");
}

/** Kleiner Beistelltisch neben dem Raucherstuhl (höher für Eimer darunter) */
function sideTable(c: C, x: number, F: number) {
  const y = F - 30;
  rrect(c, x - 20, y, 40, 5, 2, "#8a5a34");
  rect(c, x - 16, y + 5, 4, F - y - 5, "#6f4a2a");
  rect(c, x + 12, y + 5, 4, F - y - 5, "#6f4a2a");
}

/** Ascheneimer unter dem Beistelltisch */
function ashBucket(c: C, x: number, F: number, butts: number) {
  poly(c, [[x - 6.5, F - 15], [x + 6.5, F - 15], [x + 4.8, F], [x - 4.8, F]], "#59626a");
  poly(c, [[x - 6.5, F - 15], [x - 2, F - 15], [x - 1.5, F], [x - 4.8, F]], "rgba(255,255,255,.1)");
  rect(c, x - 7, F - 16, 14, 1.8, "#7f8a93");
  c.fillStyle = "#2b3036";
  c.beginPath();
  c.ellipse(x, F - 14.5, 5.4, 1.2, 0, 0, Math.PI * 2);
  c.fill();
  if (butts > 0) {
    // Asche und Stummel im Eimer
    c.fillStyle = "#8a857e";
    c.beginPath();
    c.ellipse(x, F - 14.2, 4.4, 0.9, 0, 0, Math.PI * 2);
    c.fill();
    const n = Math.min(butts, 4);
    for (let i = 0; i < n; i++) {
      rect(c, x - 3 + i * 1.8, F - 15.2, 2.2, 1.2, "#e5decb");
    }
  }
  c.strokeStyle = "#434a52";
  c.lineWidth = 0.9;
  c.beginPath();
  c.arc(x, F - 14.5, 5.5, Math.PI * 0.1, Math.PI * 0.9);
  c.stroke();
}

/** Teekanne; Ursprung ist die Bodenmitte, `tilt` kippt sie zum Einschenken. */
function teaKettle(c: C, x: number, y: number, tilt = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  rrect(c, -7, -11, 14, 11, 4, "#5ea88a");
  rect(c, -5, -13, 10, 3, "#4a8d73");
  disc(c, 0, -14.5, 1.6, "#e2b24a");
  // Ausguss und Henkel
  poly(c, [[6, -8], [12, -11], [12, -9], [7, -5]], "#5ea88a");
  c.strokeStyle = "#4a8d73";
  c.lineWidth = 1.8;
  c.beginPath();
  c.arc(-8, -6, 3.4, Math.PI * 0.5, Math.PI * 1.5);
  c.stroke();
  c.restore();
}

/** Teetasse mit Füllstand; Ursprung ist die Bodenmitte. */
function teaCup(c: C, x: number, y: number, fill: number, tilt = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  rrect(c, -3, -5, 6, 5, 1.2, "#f6f3ea");
  const h = clamp(fill, 0, 1) * 3.4;
  if (h > 0.12) {
    rect(c, -2.2, -0.9 - h, 4.4, h, "#9ec98a");
    rect(c, -2.2, -0.9 - h, 4.4, 0.5, "#b9dca6");
  }
  c.strokeStyle = "#f6f3ea";
  c.lineWidth = 0.9;
  c.beginPath();
  c.arc(-3.4, -2.8, 1.6, Math.PI - 1.2, Math.PI + 1.2);
  c.stroke();
  c.restore();
}

/** Teekanne mit Tasse auf der Küchenzeile – der Gesundheitstee */
function teaPot(c: C, kanne = true, tasse = true, fill = 0) {
  if (kanne) teaKettle(c, TEA_X, TEA_Y);
  if (tasse) teaCup(c, TEE_TASSE_X, TEA_Y, fill);
}

/** Gedrehte Zigaretten, die sich neben der Dose stapeln */
function cigPile(c: C, x: number, F: number, n: number) {
  const total = Math.min(n, 9);
  for (let i = 0; i < total; i++) {
    const col = i % 3;
    const row = (i / 3) | 0;
    const px = x + col * 2.4 - 3;
    const py = F - 38 - row * 2.4;
    rect(c, px - 5, py, 10, 1.9, "#f6f3ea");
    rect(c, px + 2.2, py, 2.8, 1.9, "#e2b24a");
  }
}

/** Küchentisch: Platte, auf der Luni stopft. Oberkante = F-36. */
function kitchenTable(c: C, x: number, F: number, w: number, weihnacht = false) {
  const top = F - 36;
  rrect(c, x, top, w, 5, 2, weihnacht ? WEIHNACHTS_FARBEN.moebel.kueche.tisch : "#a67c52");
  rect(c, x + 4, top + 5, 4, F - top - 5, "#6f4a2a");
  rect(c, x + w - 8, top + 5, 4, F - top - 5, "#6f4a2a");
  rect(c, x + 4, top + 18, w - 8, 3, "#7a5a34");
}

function chair(c: C, x: number, F: number, backLeft: boolean) {
  rect(c, x, F - 22, 18, 4, "#8a5a34");
  rect(c, x + 2, F - 18, 2.5, 18, "#6f4a2a");
  rect(c, x + 13.5, F - 18, 2.5, 18, "#6f4a2a");
  rect(c, backLeft ? x : x + 14, F - 42, 4, 22, "#8a5a34");
}

/* --- Möbel: 1. Stock --- */

function bed(c: C, x: number, F: number, belegt = false, weihnacht = false) {
  if (weihnacht) weihnachtsBettgestell(c, x, F);
  else {
    rrect(c, x, F - 52, 8, 52, 3, "#6f4a2a");
    rrect(c, x + 104, F - 34, 8, 34, 3, "#6f4a2a");
    rect(c, x + 6, F - 18, 100, 12, "#8a5a34");
    rrect(c, x + 8, F - 30, 98, 14, 5, "#f2efe6");
    rrect(c, x + 12, F - 38, 30, 12, 6, "#ffffff");
  }
  if (!belegt) {
    drawBedCloth(c, x + 46, F - 36, 0, 0, x + 104, F - 16, 0, 0, weihnacht);
    if (weihnacht) weihnachtsstrumpf(c, x + 108, F - 26, 0.83);
  }
}

/** Vorderkante des Bettes, vor der Luni sichtbar bleibt. */
function drawBedFront(c: C, x: number, F: number, weihnacht = false) {
  rect(c, x + 6, F - 16, 100, 10, weihnacht ? WEIHNACHTS_FARBEN.holz : "#8a5a34");
  rrect(c, x + 104, F - 34, 8, 34, 3, weihnacht ? WEIHNACHTS_FARBEN.holztief : "#6f4a2a");
  if (weihnacht) weihnachtsstrumpf(c, x + 108, F - 26, 0.83);
}

function nightstand(c: C, x: number, F: number, weihnacht = false) {
  rect(c, x, F - 26, 26, 26, weihnacht ? WEIHNACHTS_FARBEN.holz : "#8a6a3c");
  rect(c, x + 3, F - 22, 20, 8, weihnacht ? WEIHNACHTS_FARBEN.holztief : "#7a5a30");
  disc(c, x + 13, F - 18, 1.4, "#e6c36a");
  rect(c, x + 12, F - 36, 2.5, 10, "#20343c");
  poly(c, [[x + 4, F - 36], [x + 22, F - 36], [x + 18, F - 50], [x + 8, F - 50]], "#f2d9a0");
}

function wardrobe(c: C, x: number, F: number, weihnacht = false) {
  rrect(c, x, F - 84, 48, 84, 3, weihnacht ? WEIHNACHTS_FARBEN.holzlicht : "#9b7447");
  rect(c, x + 23, F - 80, 2, 76, "rgba(0,0,0,.3)");
  const tuer = weihnacht ? WEIHNACHTS_FARBEN.holz : "#8a6a3c";
  rect(c, x + 3, F - 80, 18, 76, tuer);
  rect(c, x + 27, F - 80, 18, 76, tuer);
  disc(c, x + 20, F - 42, 1.6, "#e6c36a");
  disc(c, x + 28, F - 42, 1.6, "#e6c36a");
}


/* --- Möbel: Dachgeschoss --- */

function beanbag(c: C, x: number, F: number, weihnacht = false) {
  c.beginPath();
  c.moveTo(x, F);
  c.quadraticCurveTo(x - 2, F - 20, x + 18, F - 24);
  c.quadraticCurveTo(x + 30, F - 28, x + 40, F - 20);
  c.quadraticCurveTo(x + 58, F - 12, x + 56, F);
  c.closePath();
  c.fillStyle = weihnacht ? WEIHNACHTS_FARBEN.moebel.gaming.sitzsack : "#ff6f61";
  c.fill();
  c.globalAlpha = weihnacht ? 0.58 : 0.25;
  c.beginPath();
  c.ellipse(x + 26, F - 17, 14, 4, -0.2, 0, Math.PI * 2);
  c.fillStyle = weihnacht ? WEIHNACHTS_FARBEN.moebel.gaming.sitzsacklicht : "#ffffff";
  c.fill();
  c.globalAlpha = 1;
}

/**
 * Altes aufrechtes Klavier im Musikzimmer des NORMALEN Hauses.
 *
 * Aufbau (Bühnenkoordinaten, F = Bodenlinie 200):
 *   Korpus      545–589 (unverändert)
 *   Klaviatur   Kasten 545–589, Tasten 550–584 auf y=168.
 *               Kasten und sichtbare Tasten haben beide die Mitte x=567.
 *   Hocker      604–630, Sitzfläche 178–184
 *   Sitzplatz   x=617, Blick nach links.
 *
 * Korpus und Klaviaturkasten sind beide 44 Einheiten breit. Der Deckel
 * steht unverändert beidseitig 2 Einheiten über. Höhe, Hocker und
 * Sitzplatz bleiben unverändert.
 */
function piano(c: C, x: number, F: number) {
  // Korpus und Deckel
  rrect(c, x, F - 56, 44, 56, 3, "#63483a");
  rect(c, x - 2, F - 58, 48, 4, "#775645");
  rect(c, x - 2, F - 58, 48, 1.3, "rgba(255,255,255,.20)");

  // Notenpult mit aufgelegtem Notenblatt, mittig auf dem 44 Einheiten breiten Korpus (Mitte x+22)
  rrect(c, x + 9, F - 47, 26, 15, 2, "#4b3628");
  c.fillStyle = "#efe6cf";
  c.fillRect(x + 11, F - 45, 22, 11);
  c.strokeStyle = "rgba(80,58,34,.45)";
  c.lineWidth = 0.35;
  for (let i = 0; i < 4; i++) line(c, x + 12, F - 43 + i * 2.2, x + 32, F - 43 + i * 2.2, "rgba(80,58,34,.45)", 0.35);

  /* ---- Klaviatur: dieselbe linke Kante wie der Korpus ---- */
  const kx = x;
  const ky = 168;
  const kw = 42;
  const kh = 7;
  // Klaviaturkasten, an den Korpus angesetzt
  rect(c, kx, ky - 2, kw + 2, kh + 5, "#4d382b");
  rect(c, kx, ky - 2, kw + 2, 1, "rgba(255,255,255,.22)");
  // Die Tastenfläche sitzt exakt mittig vor dem 44 Einheiten breiten Korpus.
  const tw = 34;
  const tx = kx + (kw + 2 - tw) / 2;
  rect(c, tx, ky, tw, kh, "#f5f2ea");
  const wn = 14;
  const ww = tw / wn;
  for (let i = 1; i < wn; i++) rect(c, tx + i * ww, ky, 0.5, kh, "rgba(70,48,30,.55)");
  // schwarze Tasten im Oktavmuster
  for (let i = 0; i < wn - 1; i++) {
    const p7 = i % 7;
    if (p7 === 2 || p7 === 6) continue;
    rect(c, tx + (i + 1) * ww - 0.7, ky, 1.4, kh * 0.6, "#141110");
  }
  // vordere Leiste und Wangen links/rechts
  rect(c, tx - 2, ky + kh, tw + 4, 2.6, "#7a5a48");
  rect(c, tx - 2, ky + kh, tw + 4, 0.8, "rgba(255,255,255,.18)");
  rect(c, tx - 2.4, ky - 2, 2.4, kh + 5, "#5a4133");
  rect(c, tx + tw, ky - 2, 2.4, kh + 5, "#5a4133");
  c.fillStyle = "#d9a83c";
  c.fillRect(kx + 0.6, ky + kh + 0.7, 1.3, 1.1);
  c.fillRect(kx + kw + 2 - 0.6 - 1.3, ky + kh + 0.7, 1.3, 1.1);

  // Pedale unter dem Korpus
  line(c, x + 16, F - 6, x + 16, F - 1, "#b8963f", 1.1);
  line(c, x + 22, F - 6, x + 22, F - 1, "#b8963f", 1.1);

  // Beine
  rect(c, x + 4, F - 4, 3, 4, "#1a1410");
  rect(c, x + 37, F - 4, 3, 4, "#1a1410");
}

/**
 * Klavierhocker: Sitzfläche mittig unter Lunis Sitzplatz (x=617),
 * vier schmale, leicht nach außen gestellte Beine.
 */
/**
 * Höhe der Sitzfläche des Klavierschemels (Oberkante über dem Boden). In der
 * Sitzpose liegt Lunis Hüfte 10 über dem Boden; sie sitzt also auf der Fläche.
 */
export const SCHEMEL_HOEHE = 9;
/** Dicke der Sitzfläche. */
const SCHEMEL_DICKE = 4.5;
/** Der Schemel ist 18 breit; links bündig bei x=558 liegt er mittig vor dem Klavier (Mitte 567). */
export const SCHEMEL_X = 558;

/** Klavier-Ausklang in Sekunden: Klang wird leiser, dann Nachklang, Aufstehen, Drehen, Verbeugung. */
const KLAVIER_AUSKLINGEN = 4;
const KLAVIER_NACHKLANG = 1.2;
const KLAVIER_AUFSTEHEN = 0.9;
const KLAVIER_DREHEN = 0.6;
const KLAVIER_VERBEUGUNG = 1.8;

/** Niedriger Klavierschemel, auf dem Luni beim Spielen wirklich sitzt. */
function pianoStool(c: C, x: number, F: number) {
  const oben = F - SCHEMEL_HOEHE; // Oberkante der Sitzfläche = Sitzhöhe
  rrect(c, x, oben, 18, SCHEMEL_DICKE, 2, "#6b3f2a");
  rect(c, x + 1.5, oben + 1, 15, 1, "rgba(217,168,60,.55)");
  const beine = oben + SCHEMEL_DICKE - 0.5;
  line(c, x + 2.5, beine, x + 1.5, F, "#4a2a1c", 1.5);
  line(c, x + 15.5, beine, x + 16.5, F, "#4a2a1c", 1.5);
  line(c, x + 6.5, beine, x + 6, F, "#4a2a1c", 1.1);
  line(c, x + 11.5, beine, x + 12, F, "#4a2a1c", 1.1);
}

/** Lage der drei Kerzen auf dem Klavierdeckel (relativ zur Klaviermitte). */
const KLAVIER_KERZEN = [-11, 0, 11] as const;

/**
 * Kleiner Weihnachtsbogen aus Tannengrün auf dem Klavierdeckel, mit drei
 * Kerzen. `t` treibt das ruhige Flackern (kein Blinken), `stark` 0..1 dämpft
 * es beim Ausklingen. Reine Canvas-Primitive, keine Bild- oder Fontdatei.
 */
export function pianoBogen(c: C, x: number, F: number, t: number, stark = 1, an = true) {
  const mx = x + 22; // Mitte des 44 breiten Korpus
  const y0 = F - 58; // Oberkante des Deckels
  c.save();
  // sanfter Bogen aus zwei gebogenen Zweigen
  for (const sgn of [-1, 1] as const) {
    c.strokeStyle = "#2f6b3c";
    c.lineWidth = 3.2;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(mx + sgn * 17, y0 - 0.5);
    c.quadraticCurveTo(mx + sgn * 14, y0 - 9, mx + sgn * 4, y0 - 11.5);
    c.stroke();
    // Nadeln als kleine dunkle Striche entlang des Zweigs
    c.strokeStyle = "#1f5230";
    c.lineWidth = 0.9;
    for (let i = 0; i < 7; i++) {
      const q = i / 6;
      const bx = (1 - q) * (1 - q) * (mx + sgn * 17) + 2 * (1 - q) * q * (mx + sgn * 14) + q * q * (mx + sgn * 4);
      const by = (1 - q) * (1 - q) * (y0 - 0.5) + 2 * (1 - q) * q * (y0 - 9) + q * q * (y0 - 11.5);
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + sgn * 0.6, by + 2.4);
      c.stroke();
    }
  }
  // kleine rote Beeren und ein Goldband in der Mitte
  c.fillStyle = "#c9302f";
  for (const [bx, by] of [[-12, -6.5], [-7, -9.6], [7, -9.6], [12, -6.5], [0, -12.4]] as const) {
    c.beginPath();
    c.arc(mx + bx, y0 + by, 1.1, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = "#e8c46a";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(mx - 15, y0 - 3.2);
  c.quadraticCurveTo(mx, y0 - 7.5, mx + 15, y0 - 3.2);
  c.stroke();

  // drei Kerzen auf kleinen Haltern
  KLAVIER_KERZEN.forEach((dx, i) => {
    const kx = mx + dx;
    const ky = y0 - (i === 1 ? 13 : 10.5);
    c.fillStyle = "#d9a441";
    c.fillRect(kx - 2.2, ky + 5.6, 4.4, 1.2);
    c.fillStyle = "#f4ecd8";
    c.fillRect(kx - 1.5, ky, 3, 6);
    c.fillStyle = "rgba(120,90,50,.25)";
    c.fillRect(kx + 0.7, ky, 0.8, 6);
    // Docht
    c.strokeStyle = "#2a211c";
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(kx, ky);
    c.lineTo(kx, ky - 1.2);
    c.stroke();
    if (!an) return; // ausgeschaltet: nur der Docht, keine Flamme
    // Flamme: ruhig atmend, sie wird beim Ausklingen kleiner und kühler
    const fl = 0.78 + 0.22 * Math.sin(t * 5.1 + i * 2.1) * Math.sin(t * 3.3 + i);
    const h = (3.4 + 0.9 * fl) * (0.35 + 0.65 * stark);
    const w = 1.5 * (0.5 + 0.5 * stark);
    const g = c.createLinearGradient(kx, ky - 1.2 - h, kx, ky - 1.2);
    g.addColorStop(0, `rgba(255,236,160,${0.95 * stark + 0.05})`);
    g.addColorStop(0.55, `rgba(255,178,64,${0.95 * stark + 0.05})`);
    g.addColorStop(1, `rgba(255,120,40,${0.6 * stark})`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(kx, ky - 1.2 - h);
    c.quadraticCurveTo(kx + w, ky - 1.2 - h * 0.45, kx, ky - 1.1);
    c.quadraticCurveTo(kx - w, ky - 1.2 - h * 0.45, kx, ky - 1.2 - h);
    c.closePath();
    c.fill();
  });
  c.restore();
}

/** Farbe des Kerzenlichts auf Luni (Silhouette, additiv). */
const KERZEN_LICHT = "#ffb864";
/** Das Kerzenlicht reicht nur bis zur Ellenbogenhöhe (28 über dem Boden), nicht tiefer. */
const KERZEN_REICHWEITE = 28;

/**
 * Schein der drei Kerzen auf Flammen, Klavierfront und Wand. Dieser Teil wird
 * VOR Luni gezeichnet, damit das warme Licht nicht als Schleier über ihrem
 * Kopf liegt. Es reicht nur bis zur Ellenbogenhöhe.
 */
function kerzenSchein(c: C, x: number, F: number, stark: number) {
  if (stark <= 0.01) return;
  const mx = x + 22;
  const y0 = F - 58;
  const grenze = F - KERZEN_REICHWEITE;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, grenze);
  c.clip();
  c.globalCompositeOperation = "lighter";
  // warmer Schein um die Flammen
  for (const dx of KLAVIER_KERZEN) {
    const cx = mx + dx;
    const cy = y0 - 16;
    const g = c.createRadialGradient(cx, cy, 1, cx, cy, 30);
    g.addColorStop(0, `rgba(255,200,120,${0.22 * stark})`);
    g.addColorStop(1, "rgba(255,170,80,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, 30, 0, Math.PI * 2);
    c.fill();
  }
  // Klavierfront: warmer Verlauf von oben, nur bis zur Ellenbogenhöhe
  const front = c.createLinearGradient(0, y0, 0, grenze);
  front.addColorStop(0, `rgba(255,190,110,${0.26 * stark})`);
  front.addColorStop(1, "rgba(255,170,80,0)");
  c.fillStyle = front;
  c.fillRect(545, y0, 44, grenze - y0);
  c.restore();
}

/**
 * Kerzenlicht der drei Kerzen. Es erhellt die Klavierfront und hebt Luni (wenn
 * `da`) mit einer warmen Silhouette vom dunklen Klavier ab. Alles wird unterhalb
 * der Ellenbogenhöhe abgeschnitten, damit das Licht nicht bis zum Boden geht.
 */
function drawKerzenlicht(
  c: C,
  stark: number,
  puffer: HTMLCanvasElement,
  luni: () => void,
  da: boolean,
) {
  if (stark <= 0.01) return;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, FD - KERZEN_REICHWEITE);
  c.clip();
  if (da) {
    // Luni als warme Silhouette: Form in den Puffer, mit Licht füllen, additiv darüber.
    // Derselbe Pixelmassstab wie das Bild; sonst erscheint eine Miniatur im Himmel.
    if (puffer.width !== c.canvas.width || puffer.height !== c.canvas.height) {
      puffer.width = c.canvas.width;
      puffer.height = c.canvas.height;
    }
    const pw = puffer.width;
    const ph = puffer.height;
    const k = pw / W;
    const bc = puffer.getContext("2d");
    if (bc) {
      bc.setTransform(1, 0, 0, 1, 0, 0);
      bc.globalCompositeOperation = "source-over";
      bc.clearRect(0, 0, pw, ph);
      bc.setTransform(k, 0, 0, k, 0, 0);
      luni();
      // Randlicht: die Form in Gerätepixeln versetzt nachzeichnen (wirkt als Kontur)
      const v = Math.max(1, Math.round(0.5 * k)); // nur eine halbe Einheit: eine feine Kontur
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 0.5 * stark;
      for (const [dx, dy] of [[v, 0], [-v, 0], [0, -v], [0, v]] as const) c.drawImage(puffer, dx, dy);
      c.restore();
      // Form mit Kerzenlicht füllen; nur ein Hauch auf der Fläche, Farben bleiben erkennbar
      bc.setTransform(1, 0, 0, 1, 0, 0);
      bc.globalCompositeOperation = "source-in";
      bc.fillStyle = KERZEN_LICHT;
      bc.fillRect(0, 0, pw, ph);
      bc.globalCompositeOperation = "source-over";
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      // Nur ein Hauch auf der Fläche: die schwarzen Haare bleiben schwarz.
      c.globalAlpha = 0.05 * stark;
      c.drawImage(puffer, 0, 0);
      c.restore();
    }
  }
  c.restore();
}

function lowboardTV(c: C, x: number, F: number, weihnacht = false) {
  rrect(c, x, F - 22, 66, 22, 3, weihnacht ? WEIHNACHTS_FARBEN.moebel.gaming.fernsehtisch : "#2a2a38");
  rect(c, x + 4, F - 16, 26, 1.4, "rgba(255,255,255,.12)");
  rrect(c, x + 3, F - 66, 60, 44, 3, "#15171c");
  rect(c, x + 6, F - 63, 54, 34, "#0a0d12");
  rect(c, x + 38, F - 20, 20, 4, weihnacht ? WEIHNACHTS_FARBEN.moebel.gaming.fach : "#3b3f4a");
  disc(c, x + 56, F - 18, 1, "#35d6c0");
}



interface RecordPlayerOpts {
  power?: boolean;
  spin?: number;
  armLift?: number;
  armTurn?: number;
}

const PLATTEN_SCHALTER: Pt = [704.5, 174];
/** Standplatz links neben der Anlage (aus stepAside). */
const PLATTEN_STAND_X = 668;

/** Eine Station der Tanz-Tour während des Liedes. */
interface TanzSegment {
  floor: number;
  x: number;
  stil: LuniState;
  /** Sekunden, die sie am Ziel weitertanzt. */
  dauer: number;
  /** Tempo auf dem Weg dorthin (Bühneneinheiten/Sekunde, kein Rennen). */
  tempo: number;
}

/** Tanz-Tour: einmal durchs ganze Haus und wieder zurück zur Anlage. In jedem
 *  Raum tanzt Luni auf der Stelle etwas anderes; dazwischen geht sie nie
 *  einfach, sondern tanzt die Schritte (Schritt-Tanz: ein Schritt je Schlag,
 *  Kopf nickt, Finger zeigt zur Decke). Im Schlafzimmer gleitet sie ein Stück
 *  im Moonwalk, im Wohnzimmer rutscht sie auf beiden Knien herein (Torjubel).
 *  `tempo` gilt nur für Moonwalk und Rutscher – alle anderen Wege laufen im
 *  Schritt-Tanz mit TANZ_SCHRITT_TEMPO. */
const PLATTEN_TOUR: readonly TanzSegment[] = [
  // Dachgeschoss: an der Anlage, dann Richtung Gaming-Ecke
  { floor: 3, x: 668, stil: "danceArmsUp", dauer: 3, tempo: 39 },
  { floor: 3, x: 560, stil: "danceClap", dauer: 3, tempo: 39 },
  { floor: 3, x: 420, stil: "danceFortnite", dauer: 4, tempo: 39 },
  // 1. Stock: Twist vor dem Bett, Moonwalk durchs Schlafzimmer, Armwelle am Bad
  { floor: 2, x: 300, stil: "danceTwist", dauer: 3, tempo: 39 },
  { floor: 2, x: 400, stil: "danceMoonwalk", dauer: 0, tempo: 13 },
  { floor: 2, x: 540, stil: "danceWave", dauer: 4, tempo: 39 },
  // Erdgeschoss: Roboter in der Küche, dann auf den Knien ins Wohnzimmer
  { floor: 1, x: 640, stil: "danceRobot", dauer: 3, tempo: 39 },
  { floor: 1, x: 500, stil: "danceSchritt", dauer: 0, tempo: 39 },
  { floor: 1, x: 395, stil: "danceSlide", dauer: 3, tempo: 45 },
  { floor: 1, x: 330, stil: "danceDisco", dauer: 4, tempo: 39 },
  // Rückweg: in jedem Stockwerk noch ein anderer Tanz
  { floor: 1, x: 600, stil: "danceStep", dauer: 3, tempo: 39 },
  { floor: 2, x: 560, stil: "danceHeadnod", dauer: 2, tempo: 39 },
  { floor: 2, x: 330, stil: "danceHeart", dauer: 3, tempo: 39 },
  { floor: 3, x: 420, stil: "danceTap", dauer: 2, tempo: 39 },
  { floor: 3, x: 668, stil: "danceArmUp", dauer: 2, tempo: 39 },
];

/** Tänze, die selbst Weg zurücklegen (alle anderen stehen auf der Stelle). */
const TANZ_REISE: readonly LuniState[] = ["danceSchritt", "danceMoonwalk", "danceSlide"];

/** Tempo des Schritt-Tanzes: ein Schritt je Schlag deckt genau diese Strecke,
 *  damit die Füße nicht über den Boden rutschen. */
const TANZ_SCHRITT_TEMPO = 39;

/** Zurück an der Anlage wechselt sie bis zum Liedende durch diese Tänze. */
const TANZ_ROTATION: readonly LuniState[] = [
  "danceArmsUp", "danceClap", "danceHeadnod", "danceFortnite", "danceTap", "danceDisco",
  "danceTwist", "danceRobot", "danceWave", "danceHeart", "danceStep", "danceArmUp",
];

/** Reserve in Sekunden: reicht die Restzeit des Liedes nur noch für den Weg zur
 *  Anlage plus diese Reserve, bricht sie die Tour ab und tanzt direkt zurück –
 *  so hebt der Tonarm pünktlich. Normal endet die Tour vorher an der Anlage. */
const PLATTEN_RUECKKEHR_RESERVE = 4;

function recordPlayer(c: C, x: number, F: number, opts: RecordPlayerOpts = {}) {
  const { power = false, spin = 0, armLift = 0, armTurn = 0 } = opts;
  // Holzschrank mit zwei Türen
  rrect(c, x, F - 24, 52, 24, 3, "#8a5a34");
  rect(c, x + 4, F - 20, 20, 12, "#7a4a28");
  rect(c, x + 28, F - 20, 20, 12, "#7a4a28");
  // Plattenspieler-Gehäuse
  rrect(c, x + 3, F - 31, 46, 8, 2, "#1d1d22");
  // Netzschalter und Status-LED links vorn am Gehäuse
  rect(c, x + 4.5, F - 26.5, 4, 2.2, power ? "#5b6d72" : "#3a4246");
  if (power) {
    c.save();
    c.globalAlpha = 0.35;
    disc(c, x + 6.5, F - 29, 3.2, "#35d6c0");
    c.restore();
  }
  disc(c, x + 6.5, F - 29, 1.15, power ? "#35d6c0" : "#4a2424");

  // Schallplatte (leicht perspektivische Ellipse, dreht sich sichtbar)
  const cx = x + 22;
  const cy = F - 27;
  c.beginPath();
  c.ellipse(cx, cy, 14, 3, 0, 0, Math.PI * 2);
  c.fillStyle = "#0a0a0d";
  c.fill();
  // Feine Rillen + umlaufender Lichtreflex
  c.strokeStyle = "rgba(180,205,215,.16)";
  c.lineWidth = 0.65;
  c.beginPath();
  c.ellipse(cx, cy, 10.2, 2.15, 0, 0, Math.PI * 2);
  c.stroke();
  for (const ang of [spin, spin + Math.PI]) {
    c.strokeStyle = "rgba(220,240,248,.34)";
    c.lineWidth = 0.9;
    c.beginPath();
    c.ellipse(cx, cy, 11.4, 2.4, 0, ang - 0.32, ang + 0.32);
    c.stroke();
  }
  // Rotes Etikett in der Mitte mit mitdrehendem Punkt
  c.beginPath();
  c.ellipse(cx, cy, 4.2, 1.25, 0, 0, Math.PI * 2);
  c.fillStyle = "#c9453a";
  c.fill();
  disc(c, cx + Math.cos(spin) * 2.5, cy + Math.sin(spin) * 0.72, 0.78, "#f7efe2");
  disc(c, cx, cy, 0.68, "#dfe6e8");

  // Tonarm-Ruheposten rechts neben der Platte
  rect(c, x + 40.3, F - 27, 1.4, 3, "#4c5458");
  // Tonarm-Lager (Pivot)
  const px = x + 43;
  const py = F - 30;
  disc(c, px, py, 2.1, "#7f8b8e");
  disc(c, px, py, 1, "#c3d0cf");

  // Tonarm-Spitze: Ruheposition (armTurn=0) über dem Posten (x+41),
  // Spielposition (armTurn=1..1.45) über den Plattenrillen (x+31.5..x+27).
  const turn = clamp(armTurn, 0, 1.6);
  const lift = clamp(armLift, 0, 1);
  const tipX = turn <= 1 ? lerp(x + 41, x + 31.5, turn) : lerp(x + 31.5, x + 27, (turn - 1) / 0.45);
  const baseTipY = lerp(F - 27.1, F - 27.4, clamp(turn, 0, 1));
  const tipY = baseTipY - lift * 6.0;

  // Schatten des angehobenen Tonarms
  if (lift > 0.05) {
    c.save();
    c.globalAlpha = 0.35 * lift;
    line(c, px, py + 1.5, tipX, baseTipY + 0.5, "#05090d", 1.2);
    c.restore();
  }
  // Gegengewicht hinter dem Lager
  const cwX = px + (px - tipX) * 0.22;
  const cwY = py - (tipY - py) * 0.22;
  line(c, cwX, cwY, tipX, tipY, "#c3d0cf", 1.5);
  disc(c, cwX, cwY, 1.4, "#6f7b7e");
  // Tonabnehmerkopf und Nadel
  rrect(c, tipX - 1.5, tipY - 0.8, 3, 1.8, 0.6, "#2a2f35");
  line(c, tipX, tipY + 0.9, tipX, tipY + 1.8, "#e6eef0", 0.65);
}

function speaker(c: C, x: number, F: number, pulse = 0) {
  const p = clamp(pulse, 0, 1);
  const bounce = p * 0.45;
  rrect(c, x - p * 0.35, F - 36 - bounce, 16 + p * 0.7, 36 + bounce, 3, "#2a2420");
  // Oberer Tieftöner: Membran und Staubschutzkappe pulsieren zum Bass
  const uy = F - 26 - bounce * 0.7;
  disc(c, x + 8, uy, 4.6 + p * 1.35, "#16130f");
  if (p > 0.04) {
    c.save();
    c.strokeStyle = `rgba(115,175,185,${p * 0.55})`;
    c.lineWidth = 0.9;
    c.beginPath();
    c.arc(x + 8, uy, 4.7 + p * 1.45, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  disc(c, x + 8, uy, 2 + p * 0.75, mix("#4a4036", "#9a8a76", p * 0.7));
  // Unterer Tieftöner
  const ly = F - 10 - bounce * 0.4;
  disc(c, x + 8, ly, 3 + p * 0.9, "#16130f");
  disc(c, x + 8, ly, 1.2 + p * 0.45, mix("#302923", "#736455", p * 0.65));
  // Schallbögen bei kräftigem Bassimpuls
  if (p > 0.32) {
    const a = (p - 0.32) * 0.8;
    c.save();
    c.strokeStyle = `rgba(238,247,242,${a})`;
    c.lineWidth = 0.9;
    c.beginPath();
    c.arc(x + 8, uy, 9.5 + p * 2.5, -Math.PI * 0.78, -Math.PI * 0.22);
    c.stroke();
    c.restore();
  }
}

function recordShelf(c: C, x: number, F: number) {
  rect(c, x, F - 46, 30, 46, "#7a5a34");
  rect(c, x + 2, F - 44, 26, 42, "#35261a");
  for (let r = 0; r < 3; r++) {
    const base = F - 44 + 14 * (r + 1);
    for (let i = 0; i < 8; i++) rect(c, x + 3 + i * 3.1, base - 12, 2.6, 12, BOOK_COLS[(i + r * 3) % BOOK_COLS.length]);
    rect(c, x + 2, base, 26, 1.6, "#7a5a34");
  }
}

function guitar(c: C, x: number, F: number) {
  line(c, x, F - 8, x - 8, F, "#3a2e28", 2);
  line(c, x, F - 8, x + 8, F, "#3a2e28", 2);
  rect(c, x - 1.5, F - 50, 3, 30, "#5a3b25");
  rrect(c, x - 3, F - 56, 6, 8, 2, "#2a1f1b");
  disc(c, x, F - 14, 9, "#c9843c");
  disc(c, x, F - 27, 6.5, "#c9843c");
  disc(c, x, F - 18, 2.6, "#2a1f1b");
  rect(c, x - 5, F - 8, 10, 1.6, "#8a5a24");
  // Saiten: vom Steg über das Schallloch bis zum Kopf – drei helle Linien,
  // die sich vom Steg (breit) zum Hals (schmal) verjüngen.
  for (const [sx, nx] of [[-2, -0.8], [0, 0], [2, 0.8]] as const) {
    line(c, x + sx, F - 8, x + nx, F - 52, "#e8dcc4", 0.55);
  }
}

/* --- Möbel: Keller --- */

function shelving(c: C, x: number, F: number, w: number, h: number, seed: number, weihnacht = false) {
  const farben = weihnacht ? WEIHNACHTS_FARBEN.moebel.kellerregal : ["#b9915a", "#6f9a6a", "#c9453a", "#8a7a62"];
  rect(c, x, F - h, 3, h, "#5b6064");
  rect(c, x + w - 3, F - h, 3, h, "#5b6064");
  const rows = 4;
  const rh = h / rows;
  for (let r = 0; r < rows; r++) {
    const y = F - h + rh * (r + 1);
    let bx = x + 5;
    let i = 0;
    while (bx < x + w - 8) {
      const kind = (i + r + seed) % 4;
      const bw = 7 + ((i * 5 + seed) % 9);
      const bh = 8 + ((i * 3 + r) % 10);
      const cw = Math.min(bw, x + w - 6 - bx);
      if (kind === 1) rrect(c, bx, y - 13, Math.min(8, cw), 11, 2, farben[kind]);
      else if (kind === 2) rect(c, bx, y - 11, Math.min(9, cw), 9, farben[kind]);
      else rect(c, bx, y - 2 - bh, cw, bh, farben[kind]);
      bx += cw + 2;
      i++;
    }
    rect(c, x, y - 2, w, 2.4, "#8a9096");
  }
}

function cardboard(c: C, x: number, F: number, w: number, h: number) {
  rect(c, x, F - h, w, h, "#b9915a");
  rect(c, x, F - h, w, 2, "rgba(255,255,255,.22)");
  rect(c, x + w / 2 - 1, F - h, 2, h, "rgba(0,0,0,.18)");
  rect(c, x, F - 3, w, 3, "rgba(0,0,0,.18)");
}

function xmasBox(c: C, x: number, F: number) {
  cardboard(c, x, F, 44, 30);
  rect(c, x + 8, F - 22, 28, 12, "#f6f3ea");
  c.fillStyle = "#c9453a";
  c.font = '700 8px "Silkscreen", monospace';
  c.textAlign = "center";
  c.fillText("XMAS", x + 22, F - 13);
  c.textAlign = "left";
  disc(c, x + 4, F - 26, 2, "#c9453a");
}

/**
 * Osterei: der Datenkoffer steht auf den Kartons im Krempelraum. Korpus,
 * Riemen, Schnalle, Griff und die Disketten daneben stehen immer da; Deckel,
 * Antenne, LED und die Signalbögen erscheinen mit der Öffnung
 * (`deckel` und `antenne` von 0 bis 1).
 */
function drawDatenKoffer(
  c: C,
  deckel: number,
  antenne: number,
  phase: "oeffnen" | "offen" | "schliessen" | null,
  t: number,
) {
  const x = KOFFER_X, y = KOFFER_Y, w = KOFFER_W, h = KOFFER_H;

  // Schlagschatten auf den Kartons
  c.globalAlpha = 0.22;
  rrect(c, x + 2, y + h - 2, w, 4, 2, "#17110c");
  c.globalAlpha = 1;

  // Zwei Disketten lehnen links daneben – sie bleiben immer liegen.
  for (let i = 0; i < 2; i++) {
    c.save();
    c.translate(x - 7 - i * 2, y + h - 9 - i * 3);
    c.rotate(-0.12 - i * 0.06);
    rect(c, -4, -5, 8, 10, "#33312e");
    rect(c, -4, -5, 3, 10, "#c2c2c2");
    rect(c, -4, 3, 8, 2, "#8d8d8d");
    c.restore();
  }

  // Korpus
  rrect(c, x, y, w, h, 3, "#7a5230");
  rect(c, x, y + h - 4, w, 4, "#65412a");
  rect(c, x + 1, y + 1, w - 2, 2, "rgba(255,255,255,.10)");
  // Riemen und Schnalle
  rect(c, x + 5, y, 3, h, "#4a2f1a");
  rect(c, x + w - 8, y, 3, h, "#4a2f1a");
  rect(c, x + w / 2 - 2.5, y + 3, 5, 6, "#c9a94a");
  rect(c, x + w / 2 - 1, y + 4.5, 2, 3, "#7a6420");
  // Tragegriff
  rrect(c, x + w / 2 - 5, y - 3.5, 10, 4, 2, "#4a2f1a");

  // Deckel klappt nach hinten auf
  if (deckel > 0.02) {
    c.save();
    c.translate(x + 2, y + 4);
    c.rotate(-deckel * 1.05);
    rrect(c, -2, -6, w - 1, 8, 3, "#8a5f38");
    rect(c, -2, -6, w - 1, 2, "#6b4526");
    c.restore();
    c.globalAlpha = deckel * 0.5;
    rect(c, x + 2, y + 2, w - 4, 3, "#3a2413");
    c.globalAlpha = 1;
  }

  // Antenne mit Alu-Bällchen
  if (antenne > 0.02) {
    const ax = x + w - 6, ay = y + 2;
    const tx = ax + 15 * antenne, ty = ay - 20 * antenne;
    line(c, ax, ay, tx, ty, "#9a9a9a", 1.1);
    disc(c, tx, ty, 2.1, "#cfcfcf");
    disc(c, tx - 0.6, ty - 0.6, 0.7, "#f2f2f2");
  }

  // Im offenen Zustand: blinkende LED und zwei wandernde Signalbögen
  if (phase === "offen") {
    disc(c, x + 3.5, y + h - 7, 1.7, (t * 1.6) % 1 < 0.5 ? "#5ce08a" : "#2a6a44");
    const bx = x + w - 6 + 15, by = y + 2 - 20;
    for (let i = 0; i < 2; i++) {
      const p = ((t * 1.1) + i * 0.35) % 1;
      c.globalAlpha = (1 - p) * 0.8;
      c.strokeStyle = "#9fd8e8";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(bx, by, 3 + i * 3 + p * 3, -Math.PI * 0.85, -Math.PI * 0.35);
      c.stroke();
      c.globalAlpha = 1;
    }
  }
}

function bulb(c: C, x: number, y0: number, len: number) {
  line(c, x, y0, x, y0 + len, "#1c1a18", 1.2);
  rect(c, x - 2.4, y0 + len, 4.8, 4, "#3a3632");
  disc(c, x, y0 + len + 7, 4.4, "#ffe9a8");
}

function smokerChair(c: C, x: number, F: number) {
  rect(c, x, F - 20, 26, 4, "#8a5a34");
  rect(c, x + 2, F - 16, 3, 16, "#6f4a2a");
  rect(c, x + 21, F - 16, 3, 16, "#6f4a2a");
  rect(c, x, F - 46, 4, 28, "#8a5a34");
}

function coatBoard(c: C, x: number, F: number) {
  rect(c, x, F - 84, 66, 6, "#5a4630");
  for (let i = 0; i < 5; i++) disc(c, x + 7 + i * 12.4, F - 80, 1.8, "#d9c38a");
  rrect(c, x + 3, F - 78, 13, 40, 4, "#5a6b3c");
  rrect(c, x + 19, F - 78, 13, 34, 4, "#2f4a6b");
  rrect(c, x + 35, F - 78, 13, 38, 4, "#a6483c");
  // Hundeleinen
  c.lineWidth = 2;
  c.strokeStyle = "#c9453a";
  c.beginPath();
  c.moveTo(x + 52, F - 79);
  c.quadraticCurveTo(x + 50, F - 46, x + 55, F - 46);
  c.stroke();
  c.strokeStyle = "#3f6fb0";
  c.beginPath();
  c.moveTo(x + 60, F - 79);
  c.quadraticCurveTo(x + 62, F - 42, x + 57, F - 42);
  c.stroke();
}

/** Offene alte Kellertuer: Die Abstellkammer liegt hinter der Rueckwand. */
function abstellkammer(c: C, x: number, F: number) {
  const y = F - 82, w = 57;
  rect(c, x - 3, y - 3, w + 7, 85, "#51453a");
  c.save();
  c.beginPath();
  c.rect(x, y, w, 82);
  c.clip();
  const dunkel = c.createLinearGradient(x, y, x + w, F);
  dunkel.addColorStop(0, "#242822");
  dunkel.addColorStop(1, "#48473e");
  c.fillStyle = dunkel;
  c.fillRect(x, y, w, 82);
  poly(c, [[x, F], [x + 11, F - 21], [x + 43, F - 21], [x + w, F]], "#50483b");
  line(c, x + 11, F - 21, x + 11, y + 3, "#33352c", 1);
  line(c, x + 11, F - 21, x + 43, F - 21, "#34352d", 1.2);
  // Schief gestapelte Kartons, Bretter und ein eingerollter Schlauch.
  shelving(c, x + 14, F - 20, 28, 47, 2);
  c.save();
  c.globalAlpha = 0.42;
  rect(c, x + 14, y + 15, 28, 47, "#252621");
  c.restore();
  line(c, x + 14, F - 10, x + 4, F - 43, "#7b644a", 3);
  line(c, x + 16, F - 12, x + 9, F - 47, "#514438", 2);
  cardboard(c, x + 13, F - 8, 17, 13);
  c.save();
  c.translate(x + 20, F - 22);
  c.rotate(-0.17);
  cardboard(c, -7, 0, 13, 9);
  c.restore();
  rrect(c, x + 29, F - 17, 17, 12, 2, "#454b46");
  rect(c, x + 28, F - 17, 19, 2, "#615d51");
  line(c, x + 38, F - 19, x + 46, F - 39, "#89735a", 1.6);
  c.strokeStyle = "#92907a";
  c.lineWidth = 1.1;
  for (const r of [3.4, 5.1, 6.8]) {
    c.beginPath();
    c.ellipse(x + 36, F - 7, r, r * 0.49, -0.19, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
  // Balken, Scharniere und abgenutztes Blatt stehen vor dem dunklen Raum.
  rect(c, x - 3, y - 3, 4, 82, "#796955");
  rect(c, x - 3, y - 3, w + 7, 4, "#857463");
  rect(c, x - 1, F - 2, w + 3, 2, "#746555");
  poly(c, [[x + w - 2, y + 1], [x + w + 18, y - 5], [x + w + 18, F - 0.5], [x + w - 2, F - 4]], "#655044");
  poly(c, [[x + w + 1, y + 8], [x + w + 15, y + 4], [x + w + 15, F - 11], [x + w + 1, F - 14]], "#524337");
  for (const dx of [3, 7, 12]) {
    line(c, x + w + dx, y + 9 - dx * 0.24, x + w + dx, F - 14 + dx * 0.22, "#76604b", 0.65);
  }
  for (const dy of [13, 63]) rect(c, x + w - 3, y + dy, 5, 3, "#33332e");
  rect(c, x + w + 11, y + 38, 3, 8, "#393832");
  disc(c, x + w + 12.5, y + 41, 1.8, "#a39571");
}

/**
 * Gartentür in der rechten Kellerwand – aus dem Querschnitt nur von der
 * Seite zu sehen. Zu: schmale Türblattkante in der Wandflucht. Offen:
 * die graue Laibung; das Blatt schwingt nach innen in den Keller.
 */
function sideDoor(c: C, x: number, y: number, h: number, open: number) {
  // Right side wall is 12 screen units thick; the visible door edge matches it.
  const w = 12;
  // Öffnung in der Wand
  rect(c, x, y, w, h, "#0d181e");
  rect(c, x, y, 1.4, h, "rgba(255,255,255,.12)");
  rect(c, x + w - 1.4, y, 1.4, h, "rgba(0,0,0,.35)");

  if (open < 0.05) {
    // zu: das Blatt liegt in der Wandflucht, man sieht nur seine Kante
    rect(c, x + 1.4, y + 1, w - 2.8, h - 2, "#7a4a2a");
    rect(c, x + 1.4, y + 1, w - 2.8, 2.4, "rgba(255,255,255,.16)");
    rect(c, x + w - 3, y + 1, 1.6, h - 2, "#5a3520");
    // Inside-facing knob: the room is on the left side of this wall.
    disc(c, x + 2, y + h * 0.52, 1.4, "#e6c36a");
  } else {
    // offen: in der Laibung steht dasselbe Grau wie an der linken
    // Kellerwand, die ans Erdreich grenzt – kein Farbverlauf.
    rect(c, x + 1.4, y + 1, w - 2.8, h - 2, CELLAR_WALL);
    rect(c, x + 1.4, y + 1, 1.2, h - 2, "rgba(0,0,0,.22)");

    // Türblatt schwingt NACH INNEN: Angel an der Innenkante der Wand (x).
    // Geschlossen liegt es in der Wandflucht (nur Kante sichtbar), beim
    // Öffnen dreht es sich in den Raum und wird von vorn sichtbar.
    const ang = open * (Math.PI / 2) * 0.92;
    const face = Math.sin(ang) * 44; // sichtbare Blattbreite in den Raum hinein
    const edge = Math.max(2, Math.cos(ang) * (w - 2.8)); // Kantenstärke
    const lx = x - face;
    // Blattfläche (Innenseite zum Betrachter)
    rect(c, lx, y + 1, face, h - 2, "#8a5634");
    if (face > 14) {
      rect(c, lx + face * 0.16, y + 9, face * 0.68, h * 0.3, "#7a4a2a");
      rect(c, lx + face * 0.16, y + h * 0.48, face * 0.68, h * 0.38, "#7a4a2a");
      // Knauf auf der Innenseite, an der freien Kante
      disc(c, lx + 4, y + h * 0.52, 1.8, "#e6c36a");
    }
    // Schattenkante an der Angel und Licht auf der freien Kante
    rect(c, x - Math.min(2.5, face), y + 1, Math.min(2.5, face), h - 2, "rgba(0,0,0,.28)");
    rect(c, lx, y + 1, Math.min(1.6, face), h - 2, "rgba(255,255,255,.18)");
    // Stirnseite des Blatts (Dicke), wird beim Öffnen schmaler
    rect(c, lx - edge * 0.3, y + 1, edge * 0.3, h - 2, "#5a3520");
  }
  // Schwelle: geschlossen bündig im Wandgrau, offen etwas heller, weil
  // die Laibung sichtbar wird – ohne harten hellen Streifen.
  rect(c, x - 1.5, y + h, w + 4, 3, mix(CELLAR_WALL, "#9a9792", open));
  rect(c, x - 1.5, y + h, w + 4, 1, "rgba(0,0,0,.25)");
}

/* --- Außenbereich --- */

function fir(c: C, x: number, base: number, h: number, lights = false) {
  rect(c, x - 3, base - 10, 6, 10, "#4a3426");
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const y1 = base - 8 - t0 * h * 0.62;
    const wT = h * 0.3 * (1 - t0 * 0.62);
    poly(c, [[x - wT, y1], [x + wT, y1], [x, y1 - h * 0.34]], "#2b5b4c");
    poly(c, [[x - wT * 0.5, y1 - h * 0.17], [x + wT * 0.5, y1 - h * 0.17], [x, y1 - h * 0.34]], "#eef4fa");
    if (lights) {
      const cols = ["#ff6f61", "#ffd166", "#35d6c0", "#63b3ff"];
      disc(c, x - wT * 0.5, y1 - 3, 1.7, cols[i % 4]);
      disc(c, x + wT * 0.4, y1 - 5, 1.7, cols[(i + 2) % 4]);
    }
  }
}

function snowman(c: C, x: number, F: number) {
  disc(c, x, F - 10, 11, "#f4f8fc");
  disc(c, x, F - 25, 8, "#f4f8fc");
  disc(c, x, F - 37, 6, "#f4f8fc");
  rect(c, x - 5, F - 47, 10, 5, "#2a2f35");
  rect(c, x - 7, F - 43, 14, 2, "#2a2f35");
  poly(c, [[x, F - 38], [x + 8, F - 36], [x, F - 35]], "#ff8c42");
  disc(c, x - 2, F - 39, 0.9, "#1a1a1a");
  disc(c, x + 2, F - 39, 0.9, "#1a1a1a");
  rect(c, x - 6, F - 32, 12, 3, "#c9453a");
  disc(c, x, F - 25, 1, "#2a2f35");
  disc(c, x, F - 19, 1, "#2a2f35");
}

function mailbox(c: C, x: number, y: number) {
  rect(c, x - 1.5, y - 26, 3, 26, "#5a4630");
  rrect(c, x - 9, y - 40, 18, 14, 3, "#e2b24a");
  rect(c, x + 8, y - 38, 2, 10, "#c9453a");
  rect(c, x - 9, y - 42, 18, 3, "#eef4fa");
}

/**
 * Saxophon. Der Anker ist die Spitze des Mundstücks, damit das Instrument
 * sowohl auf dem Stativ als auch am Mund positioniert werden kann.
 */
function saxophone(c: C, ax: number, ay: number, s = 1, dir: 1 | -1 = 1) {
  c.save();
  c.translate(ax, ay);
  // dir spiegelt das Instrument um den Mundstück-Anker. Das Mundstück bleibt
  // exakt am Ankerpunkt; der Korpus zeigt in Blickrichtung der Figur.
  c.scale(s * dir, s);

  // Korpus: Hals -> Rohr -> U-Bogen -> Becherrohr (eine durchgehende Linie)
  c.strokeStyle = "#d9a83c";
  c.lineWidth = 5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(5, 2);
  c.quadraticCurveTo(12, 4, 12, 12);
  c.lineTo(10.5, 32);
  c.quadraticCurveTo(10.5, 42, 19, 42);
  c.quadraticCurveTo(26.5, 42, 26, 32);
  c.lineTo(25, 22);
  c.stroke();

  // Becher öffnet sich nach oben
  c.fillStyle = "#d9a83c";
  c.beginPath();
  c.moveTo(21.4, 23);
  c.quadraticCurveTo(20, 16, 18.4, 12.5);
  c.lineTo(31.6, 12.5);
  c.quadraticCurveTo(30, 16, 28.6, 23);
  c.closePath();
  c.fill();
  c.fillStyle = "#8a6420";
  c.beginPath();
  c.ellipse(25, 12.5, 6.6, 2.3, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#b8872e";
  c.beginPath();
  c.ellipse(25, 12.5, 4.4, 1.4, 0, 0, Math.PI * 2);
  c.fill();

  // Lichtkante auf dem Rohr
  c.strokeStyle = "rgba(255,236,170,.55)";
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(10.6, 10);
  c.lineTo(9.2, 30);
  c.stroke();

  // Klappen als Perlmutt-Punkte
  c.fillStyle = "#f7ecc9";
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.arc(11.6 - i * 0.35, 13 + i * 5.4, 1.5, 0, Math.PI * 2);
    c.fill();
  }

  // Mundstück
  c.fillStyle = "#23201c";
  c.beginPath();
  c.moveTo(0, -1);
  c.lineTo(7, 0.4);
  c.lineTo(7, 4.2);
  c.lineTo(0, 3);
  c.closePath();
  c.fill();
  c.restore();
}

/** Stativ im Wohnzimmer – das Instrument selbst liegt in Lunis Händen. */
function saxStand(c: C, x: number, F: number) {
  line(c, x, F, x, F - 30, "#2a2420", 2.2);
  line(c, x - 8, F - 1, x + 8, F - 1, "#2a2420", 2.2);
  line(c, x - 6, F - 14, x + 6, F - 14, "#2a2420", 1.8);
}

/** Mikrofonstaender: Stange, Fuss und Mikrofonkopf am Gesangsplatz. */
function micStand(c: C, x: number, F: number) {
  // Kurz: Der Mikrofonkopf liegt knapp unter Lunis Mund (etwa F - 27 bis F - 18),
  // damit er ihr Gesicht und den Mund frei lässt.
  line(c, x, F, x, F - 18, "#2a2420", 2);
  line(c, x - 7, F - 1, x + 7, F - 1, "#2a2420", 2.2);
  rrect(c, x - 2.6, F - 27, 5.2, 9, 2.4, "#3a3430");
  rect(c, x - 2.6, F - 25, 5.2, 1, "rgba(255,255,255,.22)");
}

/** Zigarette in der Hand, mit glimmender Spitze */
function cigarette(c: C, x: number, y: number, face: 1 | -1, burn: number, frac = 1, winkel = -0.42) {
  c.save();
  c.translate(x, y);
  c.scale(face, 1);
  c.rotate(winkel);
  // Filter fest am Mundende (5.8..8.8), Papier brennt langsam von der Spitze zurück.
  const rest = clamp(frac, 0, 1);
  const len = 2.0 + 5.0 * rest;
  const tip = 5.8 - len;
  const unlitFresh = burn <= 0.02 && rest >= 0.99;
  const ash = unlitFresh ? 0 : (1 - rest) * 2.4;
  rect(c, tip, -1, len, 2, "#f6f3ea");
  rect(c, 5.8, -1, 3, 2, "#e2b24a");
  if (ash > 0.15) {
    rect(c, tip - ash, -0.9, ash + 0.3, 1.8, "#9c958c");
    rect(c, tip - ash, -0.9, ash + 0.3, 0.6, "#b6afa5");
  }
  if (!unlitFresh) {
    c.fillStyle = burn > 0.02 ? "#ff8c42" : "#9c958c";
    c.beginPath();
    c.arc(tip, 0, 1.15, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

const KIPPE_WINKEL = -0.12;
const KIPPE_GRIFF: Pt = [3.4, 0.7];
const KIPPE_FILTERENDE = 8.8;
const FLAMMEN_HOEHE = 6.4;

function kippeAmFilter(c: C, [x, y]: Pt, face: 1 | -1, burn: number, frac: number) {
  cigarette(c, x + face * KIPPE_FILTERENDE * Math.cos(KIPPE_WINKEL),
    y - KIPPE_FILTERENDE * Math.sin(KIPPE_WINKEL), face === 1 ? -1 : 1, burn, frac, KIPPE_WINKEL);
}

type HandyPose = NonNullable<HandyAblauf["pose"]>;

function handyGriff(p: HandyPose): Pt {
  const fortschritt = clamp((p.oben - HANDY_TASCHE_SICHTBAR) / (1 - HANDY_TASCHE_SICHTBAR), 0, 1);
  const tipp = p.modus === "write" && p.benutzt ? Math.pow(Math.max(0, Math.sin(p.zeit * 16)), 3) * 0.55 : 0;
  const scroll = p.modus === "scroll" && p.benutzt ? Math.pow(Math.max(0, Math.sin(p.zeit * 3.7)), 2) * 0.85 : 0;
  const bild: Pt = [lerp(11, 12.8, p.quer), lerp(-28, -32, p.quer) + tipp - scroll];
  const schoss: Pt = [9, -21], tasche: Pt = [4.8, -19], ohr: Pt = [8.8, -40.1];
  return p.sichtbar ? punktMischen(tasche, punktMischen(bild, ohr, p.ohr), weich(fortschritt))
    : punktMischen(schoss, tasche, weich(p.oben / HANDY_TASCHE_SICHTBAR));
}

function drawHandy(c: C, [x, y]: Pt, face: 1 | -1, p: HandyPose, t: number) {
  if (!p.sichtbar) return;
  const griff: Pt = [lerp(1.9, -1.4, p.ohr), -0.5];
  const winkel = -0.23 - p.quer * 1.31 + p.ohr * 0.49;
  const fortschritt = clamp((p.oben - HANDY_TASCHE_SICHTBAR) / 0.24, 0, 1);
  c.save();
  c.translate(x, y);
  c.scale(face, 1);
  c.rotate(winkel);
  c.translate(-griff[0], -griff[1]);
  // An der Hosentasche wird das Geraet vom Stoff verdeckt.
  c.beginPath();
  c.rect(-7, -9, 14, 14 * fortschritt);
  c.clip();
  const breit = lerp(6.5, 4.4, p.ohr);
  rrect(c, -breit / 2, -7.1, breit, 11, 1.2, "#1b1e26");
  if (p.ohr > 0.5) {
    rect(c, -1.3, -6.15, 2.6, 1.15, "#424b56");
    disc(c, -0.65, -5.6, 0.47, "#8a9f9f");
  } else {
    rect(c, -2.45, -6.25, 4.9, 8.6, "#a0d8fa");
    if (p.modus === "write") {
      rect(c, -2.4, -1.3, 4.8, 3.65, "#5c85a0");
      for (let i = 0; i < 9; i++) rect(c, -2 + (i % 3) * 1.35, -0.9 + Math.floor(i / 3) * 0.95, 0.9, 0.6, "#bbdef1");
      rect(c, -1.75, -4.9, 1 + (Math.floor(p.zeit * 5) % 4) * 0.8, 1.1, "#eff8ff");
    } else if (p.modus === "video") {
      const versatz = (p.zeit * 1.75) % 4.5;
      rect(c, -2.45, -5.75, 4.9, 7.4, "#536c89");
      rect(c, -2.45, -5.1 + versatz, 4.9, 2, "#e8ac8b");
      poly(c, [[-0.9, -2.9], [1.05, -2], [-0.9, -1.05]], "#eef6ff");
    } else {
      for (let i = 0; i < 3; i++) {
        const ly = -5.9 + ((p.zeit * 2.9 + i * 2.6) % 7.75);
        rect(c, -1.85, ly, 3.7, 0.54, "#507e9b");
      }
    }
  }
  c.restore();
  if (p.benutzt && (p.modus === "write" || p.modus === "scroll")) {
    const taste = p.modus === "write" ? Math.sin(t * 16) : Math.sin(t * 3.7);
    disc(c, x + face * (-0.9 - Math.max(0, taste) * 1.1), y - 0.4, 0.85, LUNI_COLORS.skinShade);
  }
}

function feuerzeug(c: C, [x, y]: Pt, winkel: number, flamme = false, t = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(winkel);
  rrect(c, -1.4, -3.6, 2.8, 4.4, 0.7, "#d94a38");
  rect(c, -1.2, -4.7, 2.4, 1.2, "#c6cfd6");
  if (flamme) {
    const flackern = Math.sin(t * 26) * 0.35;
    c.fillStyle = "#ff9628";
    c.beginPath();
    c.ellipse(0, -FLAMMEN_HOEHE, 1.2 + flackern * 0.2, 2.1 + flackern * 0.3, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff199";
    c.beginPath();
    c.ellipse(0, -5.9, 0.6, 1.1, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function zuendPose(x: number, y: number, face: 1 | -1, t: number, aufTisch: boolean) {
  const schoss: Pt = [8.5, -23.5];
  const tasche: Pt = [-1.5, -19];
  const [mx, my] = SITZ_MUND;
  const mundGriff: Pt = [mx + KIPPE_GRIFF[0] / LUNI_SCALE, my + KIPPE_GRIFF[1] / LUNI_SCALE];
  const tisch: Pt = [(FEUERZEUG_TISCH[0] - x) / (face * LUNI_SCALE), (FEUERZEUG_TISCH[1] - y) / LUNI_SCALE - SITZ_HUB];
  const laenge = KIPPE_FILTERENDE + 1.2; // Filter bis zur Spitze der unbenutzten Zigarette
  const flammenGriff: Pt = [mx + laenge * Math.cos(KIPPE_WINKEL) / LUNI_SCALE,
    my + (FLAMMEN_HOEHE - laenge * Math.sin(KIPPE_WINKEL)) / LUNI_SCALE];
  const bewegung = (a: Pt, b: Pt, anfang: number, ende: number): Pt => {
    const p = weich((t - anfang) / (ende - anfang));
    return [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
  };
  let rechts: Pt;
  let winkel = 0;
  if (t < ZUENDEN.tischGriff) {
    rechts = bewegung(schoss, tisch, ZUENDEN.holen, ZUENDEN.tischGriff);
  } else if (t < ZUENDEN.eingesteckt) {
    rechts = bewegung(tisch, tasche, ZUENDEN.tischGriff, ZUENDEN.eingesteckt);
    winkel = FEUERZEUG_LIEGEND * (1 - weich((t - ZUENDEN.tischGriff) / 0.34));
  } else if (t < 0) {
    rechts = bewegung(tasche, schoss, ZUENDEN.eingesteckt, 0);
  } else if (t < ZUENDEN.mund) {
    rechts = bewegung(schoss, mundGriff, 0, ZUENDEN.mund);
  } else if (t < ZUENDEN.tasche) {
    rechts = bewegung(mundGriff, tasche, ZUENDEN.mund, ZUENDEN.tasche);
  } else if (t < ZUENDEN.flamme) {
    rechts = bewegung(tasche, flammenGriff, ZUENDEN.tasche, ZUENDEN.flamme);
  } else if (t < ZUENDEN.flammeAus) {
    rechts = flammenGriff;
  } else if (t < ZUENDEN.ablage) {
    rechts = bewegung(flammenGriff, aufTisch ? tisch : tasche, ZUENDEN.flammeAus, ZUENDEN.ablage);
    if (aufTisch) winkel = FEUERZEUG_LIEGEND * weich((t - ZUENDEN.flammeAus) / (ZUENDEN.ablage - ZUENDEN.flammeAus));
  } else if (t < ZUENDEN.mundGriff) {
    rechts = bewegung(aufTisch ? tisch : tasche, mundGriff, ZUENDEN.ablage, ZUENDEN.mundGriff);
  } else {
    rechts = bewegung(mundGriff, schoss, ZUENDEN.mundGriff, ZUENDEN.ende);
  }
  return {
    rechts,
    mund: [x + mx * face * LUNI_SCALE, y + (my + SITZ_HUB) * LUNI_SCALE] as Pt,
    kippeImMund: t >= ZUENDEN.mund && t < ZUENDEN.mundGriff,
    feuerzeugInHand: (t >= ZUENDEN.tischGriff && t < ZUENDEN.eingesteckt) || (t >= ZUENDEN.tasche && t < ZUENDEN.ablage),
    flamme: t >= ZUENDEN.flamme && t < ZUENDEN.flammeAus,
    winkel,
  };
}

/** Draußen rechts: Garten mit Weg zur Kellertür */
function gardenOutside(c: C, deko = true) {
  // Hinterschneidung: das Erdreich hinter dem Haus
  rect(c, HR + 12, FK + 14, W - HR - 12, H - FK - 14, "#3a2c22");
  // Gartenfläche auf Kellerhöhe
  rect(c, HR + 12, FK, 118, 14, "#eef4fa");
  rect(c, HR + 12, FK, 118, 2.4, "#ffffff");
  rect(c, HR + 12, FK + 14, 118, H - FK - 14, "#4a382c");
  // Hang
  poly(c, [[HR + 16, 506], [W, 498], [W, FK], [HR + 16, FK]], "#e4edf5");
  // Weg von der Tür in den Garten
  poly(c, [[HR + 16, FK - 2], [HR + 16, FK + 12], [W - 30, FK + 16], [W - 30, FK - 2]], "#d9e2ea");
  // Zaun
  for (let x = HR + 24; x < W - 6; x += 13) {
    rect(c, x, FK - 22, 6, 22, "#e9e2d0");
    rect(c, x - 0.5, FK - 24, 7, 3, "#ffffff");
  }
  rect(c, HR + 20, FK - 17, 104, 2, "#d9cfb8");
  fir(c, W - 22, FK, 118, deko);
  if (deko) snowman(c, HR + 62, FK);
}

function drawExterior(c: C, deko = true) {
  // links: Vorgarten auf Erdgeschoss-Höhe über dem Erdreich
  rect(c, 0, FE + 12, CEL_X0, H - FE - 12, "#4a382c");
  for (let i = 0; i < 34; i++) {
    const sx = hash(i + 200) * (CEL_X0 - 6);
    const sy = FE + 20 + hash(i + 300) * (H - FE - 26);
    rect(c, sx, sy, 3 + hash(i + 400) * 5, 2 + hash(i + 500) * 3, hash(i) > 0.5 ? "#5d493a" : "#3a2c22");
  }
  rect(c, 0, FE, 100, 12, "#eef4fa");
  rect(c, 0, FE, 100, 2.4, "#ffffff");
  fir(c, 20, FE, 110, deko);
  mailbox(c, 68, FE);
  gardenOutside(c, deko);
}

function drawRoof(c: C) {
  poly(c, [[690, 8], [720, 8], [720, roofTop(720) + 4], [690, roofTop(690) + 4]], "#8a4a3a");
  for (let y = 16; y <= roofTop(690); y += 8) rect(c, 690, y, 30, 1, "rgba(0,0,0,.25)");
  rect(c, 686, 4, 38, 8, "#eef4fa");
  // Dachbalken als schräges Sparrenband – innen bleibt die Dachschräge frei,
  // und außen überlappt das Dach sauber die linke und rechte Seitenwand.
  poly(
    c,
    [
      [86, 128],
      [86, roofTop(86)],
      [470, 22],
      [854, roofTop(854)],
      [854, 128],
      [HR, 128],
      [HR, atticCeil(HR)],
      [470, atticCeil(470)],
      [HL, atticCeil(HL)],
      [HL, 128],
    ],
    "#2b3a48",
  );
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    line(c, 90 + t * 380, roofTop(90 + t * 380) + 9, 98 + t * 380, roofTop(98 + t * 380) + 9, "rgba(255,255,255,.07)", 1);
  }
  schneedecke(c);
  // Traufschatten nur an den beiden Seitenwänden (98..110 und 830..842)
  rect(c, 98, 128, HL - 98, 3, "rgba(0,0,0,.25)");
  rect(c, HR, 128, 842 - HR, 3, "rgba(0,0,0,.25)");
}

/** Untere Kante der Schneeauflage (V-Form: Traufe links und rechts, First in der Mitte). */
function dachKante(x: number): number {
  return 128 - (1 - Math.abs(x - 470) / 386) * 100;
}

/** Breite, ruhige Schneepolster statt einer geraden, duennen Dachkante. */
function schneeProfil(x: number): { oben: number; unten: number } {
  const first = 22 + 0.25 * Math.sqrt((x - 470) ** 2 + 14 ** 2);
  const polster = 13 + 3 * Math.sin(x / 27) + 1.5 * Math.sin(x / 11 + 0.7);
  return {
    oben: first - polster,
    unten: dachKante(x) + 1.2 + 1.25 * Math.sin(x / 11) + 0.65 * Math.sin(x / 5 + 2),
  };
}

/** Glatte Kurve durch die Stuetzpunkte, ohne Zacken oder rueckwaerts laufende Segmente. */
function schneeKurve(c: C, punkte: Pt[]) {
  for (let i = 0; i < punkte.length - 1; i++) {
    const a = punkte[Math.max(0, i - 1)], b = punkte[i];
    const d = punkte[i + 1], e = punkte[Math.min(punkte.length - 1, i + 2)];
    c.bezierCurveTo(
      b[0] + (d[0] - a[0]) / 6, b[1] + (d[1] - a[1]) / 6,
      d[0] - (e[0] - b[0]) / 6, d[1] - (e[1] - b[1]) / 6,
      d[0], d[1],
    );
  }
}

/** Flauschige Schneedecke mit runden Polstern, blauen Unterschatten und Eiszapfen. */
export function schneedecke(c: C) {
  const rand = (i: number) => hash(i * 13 + 7);
  const oben: Pt[] = [], unten: Pt[] = [];
  for (let x = 84; x <= 852; x += 8) {
    const p = schneeProfil(x);
    oben.push([x, p.oben]);
    unten.push([x, p.unten]);
  }
  oben.push([856, schneeProfil(856).oben]);
  unten.push([856, schneeProfil(856).unten]);
  const ende = oben.length - 1;
  c.save();
  c.beginPath();
  c.moveTo(...oben[0]);
  schneeKurve(c, oben);
  c.quadraticCurveTo(861, (oben[ende][1] + unten[ende][1]) / 2, ...unten[ende]);
  schneeKurve(c, [...unten].reverse());
  c.quadraticCurveTo(79, (oben[0][1] + unten[0][1]) / 2, ...oben[0]);
  c.closePath();
  const g = c.createLinearGradient(0, 6, 0, 140);
  g.addColorStop(0, "#fffefa");
  g.addColorStop(0.55, "#f2f7fb");
  g.addColorStop(1, "#dce8f1");
  c.fillStyle = g;
  c.fill();
  // Lichtsaum und blauer Unterschatten bleiben innerhalb der Schneeflaeche.
  c.save();
  c.clip();
  c.strokeStyle = "rgba(146,173,196,.28)";
  c.lineWidth = 4.5;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(...unten[0]);
  schneeKurve(c, unten);
  c.stroke();
  const licht: Pt[] = oben.map(([x, y]) => [x, y + 1.8]);
  c.strokeStyle = "rgba(255,255,255,.72)";
  c.lineWidth = 3.4;
  c.beginPath();
  c.moveTo(...licht[0]);
  schneeKurve(c, licht);
  c.stroke();
  c.restore();
  // Eiszapfen: verschiedene Dicke und Länge, von der Schneekante nach unten
  for (let x = 90; x < 852; x += 6 + Math.round(rand(x) * 5)) {
    const r = rand(x * 2 + 1);
    if (r < 0.34) continue;
    const breite = 1.1 + r * 2.2;
    const laenge = 2.5 + rand(x * 5 + 3) * 13;
    const y0 = schneeProfil(x).unten - 0.5;
    const g2 = c.createLinearGradient(x - breite, y0, x + breite, y0 + laenge);
    g2.addColorStop(0, "#f2f9fe");
    g2.addColorStop(0.5, "#d5e7f4");
    g2.addColorStop(1, "#a9c6dc");
    c.fillStyle = g2;
    c.beginPath();
    c.moveTo(x - breite / 2, y0);
    c.lineTo(x + breite / 2, y0);
    c.quadraticCurveTo(x + breite * 0.22, y0 + laenge * 0.55, x, y0 + laenge);
    c.quadraticCurveTo(x - breite * 0.22, y0 + laenge * 0.55, x - breite / 2, y0);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(255,255,255,.75)";
    c.lineWidth = 0.45;
    c.beginPath();
    c.moveTo(x - breite * 0.22, y0 + 0.6);
    c.quadraticCurveTo(x - breite * 0.1, y0 + laenge * 0.5, x - 0.15, y0 + laenge * 0.85);
    c.stroke();
    if (rand(x * 11) > 0.62) {
      c.fillStyle = "rgba(214,236,250,.9)";
      c.beginPath();
      c.arc(x, y0 + laenge + 1.1, 0.75, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

/** Weihnachtstapeten als reine Canvas-Zeichnung; das Musikzimmer bleibt unveraendert. */
export function weihnachtsTapete(c: C, x0: number, x1: number, yTop: number, yBot: number, zimmer: ZimmerTapete = "musik") {
  if (zimmer !== "musik") {
    ruhigeWeihnachtswand(c, x0, yTop, x1 - x0, yBot - yTop, zimmer);
    return;
  }
  const { grund, bord } = ZIMMER_TAPETEN.musik;
  rect(c, x0, yTop, x1 - x0, yBot - yTop, grund);
  c.globalAlpha = 0.05;
  for (let x = x0 + 8; x < x1; x += 22) rect(c, x, yTop, 9, yBot - yTop, "#ffffff");
  c.globalAlpha = 1;
  const bordure = 26;
  // Das Muster bleibt über der Bordüre und innerhalb der Wand.
  c.save();
  c.beginPath();
  c.rect(x0, yTop + 3, x1 - x0, yBot - bordure - yTop - 3);
  c.clip();
  musikzimmerTapetenMuster(c, x0, x1, yTop, yBot, bordure);
  c.restore();
  rect(c, x0, yTop, x1 - x0, 2.4, "rgba(240,203,112,.45)");
  rect(c, x0, yBot - bordure, x1 - x0, bordure, bord);
  rect(c, x0, yBot - bordure, x1 - x0, 1.4, "rgba(240,203,112,.45)");
  for (let x = x0 + 10; x < x1 - 6; x += 22) {
    c.fillStyle = "rgba(240,203,112,.35)";
    c.beginPath();
    c.arc(x, yBot - bordure / 2, 1.1, 0, Math.PI * 2);
    c.fill();
  }
}

// Rautenmuster mit Taennchen: das bestehende Muster des Musikzimmers.
function musikzimmerTapetenMuster(c: C, x0: number, x1: number, yTop: number, yBot: number, bordure: number) {
  const creme = "rgba(240,232,205,.28)";
  const gold = "rgba(240,203,112,.5)";
  const breite = 28, hoehe = 32;
  let reihe = 0;
  for (let y = yTop + 12; y < yBot - bordure; y += hoehe, reihe++) {
    const versatz = (reihe % 2) * (breite / 2);
    for (let x = x0 + 10 + versatz; x < x1 - 6; x += breite) {
      c.strokeStyle = creme;
      c.lineWidth = 0.55;
      c.beginPath();
      c.moveTo(x, y - hoehe * 0.4);
      c.lineTo(x + breite * 0.4, y);
      c.lineTo(x, y + hoehe * 0.4);
      c.lineTo(x - breite * 0.4, y);
      c.closePath();
      c.stroke();
      c.fillStyle = "rgba(238,230,203,.34)";
      const tx = x, ty = y + 3.4;
      c.beginPath();
      c.moveTo(tx, ty - 5.2);
      c.lineTo(tx - 2.5, ty - 1.2);
      c.lineTo(tx + 2.5, ty - 1.2);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(tx, ty - 2.6);
      c.lineTo(tx - 3.4, ty + 1.6);
      c.lineTo(tx + 3.4, ty + 1.6);
      c.closePath();
      c.fill();
      c.fillStyle = gold;
      c.beginPath();
      c.arc(tx, ty - 5.6, 0.75, 0, Math.PI * 2);
      c.fill();
    }
  }
}

function partition(c: C, x: number, ceilY: number, F: number) {
  rect(c, x - 4, ceilY, 8, F - 80 - ceilY, "#4a3d36");
  rect(c, x - 4, ceilY, 1.6, F - 80 - ceilY, "rgba(255,255,255,.18)");
  rect(c, x - 4, F - 82, 8, 2, "rgba(0,0,0,.28)");
}

/**
 * Tür zwischen Krempelraum und Rauchzimmer. Sie hängt an der linken Angel
 * und schwingt nach rechts in den Rauchraum auf. `open` 0..1.
 */
function cellarDoor(c: C, x: number, topY: number, h: number, open: number) {
  const closedW = 9;
  const openW = 34;
  // Durchgang / Laibung
  rect(c, x - closedW / 2, topY, closedW, h, "#0d1418");
  // Rahmen in gedämpftem Holzton – fügt sich in die Wand ein, statt
  // als cremeweißer Streifen herauszustechen.
  rect(c, x - 8, topY - 5, 16, 5, "#6f5c49");
  rect(c, x - 8, topY - 5, 16, 1.2, "rgba(255,255,255,.12)");
  rect(c, x - 8, topY, 2.4, h, "#5e4e3f");
  rect(c, x - 8, topY, 1, h, "rgba(255,255,255,.10)");
  rect(c, x + 5.6, topY, 2.4, h, "#5e4e3f");
  rect(c, x + 7, topY, 1, h, "rgba(0,0,0,.30)");
  const hingeX = x - closedW / 2;
  // Das Blatt: geschlossen liegt es in der Wand, offen steht es im Raum
  const w = lerp(closedW, openW, Math.sin((open * Math.PI) / 2));
  if (open < 0.02) {
    rect(c, hingeX, topY + 1, closedW, h - 2, "#7a4a2a");
    rect(c, hingeX, topY + 1, closedW, 1.6, "rgba(255,255,255,.2)");
    rect(c, hingeX + closedW - 2, topY + 1, 1.4, h - 2, "#5a3520");
    disc(c, hingeX + closedW - 3, topY + h * 0.52, 1.3, "#e6c36a");
  } else {
    // offen: Blatt ragt nach rechts, mit Füllungen und Knauf
    rect(c, hingeX, topY + 1, w, h - 2, "#8a5634");
    rect(c, hingeX, topY + 1, Math.max(1.4, w * 0.05), h - 2, "#5a3520");
    if (w > 18) {
      rect(c, hingeX + w * 0.16, topY + 9, w * 0.66, h * 0.3, "#7a4a2a");
      rect(c, hingeX + w * 0.16, topY + h * 0.5, w * 0.66, h * 0.36, "#7a4a2a");
      disc(c, hingeX + w - 5, topY + h * 0.52, 1.6, "#e6c36a");
    }
    // Schattenwurf im Durchgang
    c.fillStyle = "rgba(0,0,0,.3)";
    c.fillRect(hingeX, topY + 1, 3, h - 2);
  }
  // Schwelle im Holzton des Kellerbodens
  rect(c, x - 9, topY + h, 18, 3, "#5d4a38");
  rect(c, x - 9, topY + h, 18, 1, "rgba(0,0,0,.3)");
}



const TILE = 14;
const TILE_A = "#4aa273";
const TILE_B = "#43a06f";
const TILE_GROUT = "#2a5c44";
const hashTile = (r: number, q: number) => {
  const v = Math.sin(r * 127.1 + q * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Fliesen nach Vorlage: gleichmäßige grüne Quadrate mit dunkler Fuge. */
function bathTiles(c: C, x0: number, x1: number, yTop: number, yBot: number, weihnacht = false) {
  const fugen = weihnacht ? ZIMMER_TAPETEN.badezimmer.bord : TILE_GROUT;
  const { helleFliese, dunkleFliese } = WEIHNACHTS_FARBEN.moebel.bad;
  const inset = weihnacht ? 0.48 : 1;
  rect(c, x0, yTop, x1 - x0, yBot - yTop, fugen);
  const cols = Math.ceil((x1 - x0) / TILE);
  const rows = Math.ceil((yBot - yTop) / TILE);
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const tx = x0 + q * TILE + inset;
      const ty = yTop + r * TILE + inset;
      const tw = Math.min(TILE - 2 * inset, x1 - inset - tx);
      const th = Math.min(TILE - 2 * inset, yBot - inset - ty);
      if (tw <= 0 || th <= 0) continue;
      const hell = hashTile(r, q) > 0.5;
      rect(c, tx, ty, tw, th, weihnacht ? (hell ? helleFliese : dunkleFliese) : (hell ? TILE_A : TILE_B));
      rect(c, tx, ty, tw, 1, weihnacht ? "rgba(230,215,189,.07)" : "rgba(255,255,255,.14)");
    }
  }
  rect(c, x0, yBot - 3, x1 - x0, 3, fugen);
}

/**
 * Flache Deckenlampe. Sie ist eine halbe Schale, die genau an der Deckenkante
 * ansetzt und niemals in die Deckengrafik hineinreicht.
 */
function bathCeilingLamp(c: C, x: number, ceilY: number, floorY: number, x0: number, x1: number) {
  // warmes, breit gestreutes Licht nach unten
  c.save();
  c.beginPath();
  c.rect(x0, ceilY, x1 - x0, floorY - ceilY);
  c.clip();
  const g = c.createRadialGradient(x, ceilY + 2, 2, x, ceilY + 34, 104);
  g.addColorStop(0, "rgba(255, 214, 148, 0.46)");
  g.addColorStop(0.32, "rgba(255, 196, 122, 0.15)");
  g.addColorStop(1, "rgba(255, 186, 112, 0)");
  c.fillStyle = g;
  c.fillRect(x0, ceilY, x1 - x0, floorY - ceilY);
  c.restore();
  // Montageplatte liegt auf der Decke
  rect(c, x - 6, ceilY, 12, 1.4, "#c9a97a");
  // flache, runde Schale: untere Halb-Ellipse
  c.fillStyle = "#e2c79a";
  c.beginPath();
  c.ellipse(x, ceilY + 1.4, 11.5, 4.6, 0, 0, Math.PI);
  c.closePath();
  c.fill();
  rect(c, x - 11.5, ceilY + 1.4, 23, 1.1, "rgba(255,255,255,.22)");
  // Leuchtrand, ebenfalls flach
  c.fillStyle = "#fff1d2";
  c.beginPath();
  c.ellipse(x, ceilY + 2.4, 9.2, 2.9, 0, 0, Math.PI);
  c.closePath();
  c.fill();
}

/**
 * Zeichnet den Hexenofen, aber ohne das frueher rechts aufsteigende Rohr.
 * Der Rohrcode bleibt in hexenofen.ts erhalten; ausgespart werden nur die
 * Rohrflaeche und ihre Beschlaege. Die Deckplatte wird danach exakt in ihrer
 * bisherigen Form ergaenzt, damit der Ofen keine Luecke bekommt.
 */
function hexenofenOhneRohr(c: C, zeichne: (cc: C) => void) {
  const F = FE;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.rect(OFEN.rohrX - 18, F - OFEN.korpus - 36, 24, 36.5);
  c.clip("evenodd");
  zeichne(c);
  c.restore();
  // Dieselbe native Rundung wie in hexenofen.ts, damit die Deckplatte
  // ausserhalb der Rohrstelle pixelgleich bleibt.
  c.fillStyle = "#48535a";
  c.beginPath();
  c.roundRect(OFEN.x - 1.8, F - OFEN.korpus - 3.4, OFEN.w + 3.6, 3.8, 1.2);
  c.fill();
  rect(c, OFEN.x - 1.2, F - OFEN.korpus - 3.4, OFEN.w + 2.4, .9, "#94a2a7");
}

function drawHouse(
  c: C,
  sky: HTMLCanvasElement,
  door: { open: number },
  golOnShelf: boolean,
  /** Gruselhaus: welche Räume umgestaltet sind (null = normales Haus) */
  gr: GruselRaeume | null = null,
  bettBelegt = false,
  /** Gesundheitstee: was Luni gerade in der Hand hält, fehlt auf der Zeile */
  tee: { kanne: boolean; tasse: boolean; fill: number } = { kanne: true, tasse: true, fill: 0 },
  weihnacht = false,
  /** Teleflauschi-Modul liegt im Regal (nur das Weihnachtshaus). */
  flauschiOnShelf = false,
  /** false = das normale Haus ohne Weihnachtsdeko: keine Weihnachtskiste, draußen keine Lichter und kein Schneemann. */
  weihnachtsdeko = true,
) {
  const festlich = weihnacht && !gr;
  const farben = WEIHNACHTS_FARBEN.moebel;
  drawExterior(c, weihnachtsdeko);

  /* ---- Wände ---- */
  // Dachgeschoss (innerhalb der Dachschräge)
  c.save();
  c.beginPath();
  c.moveTo(HL, FO);
  c.lineTo(HL, atticCeil(HL));
  c.lineTo(270, atticCeil(270));
  c.lineTo(270, FO);
  c.closePath();
  c.clip();
  if (weihnacht && !gr) weihnachtsTapete(c, HL, 270, 30, FO, "gamingRand");
  else wallBand(c, HL, 270, 30, FO, "#8a8fb3", "#7075a0", 26);
  c.restore();

  c.save();
  c.beginPath();
  c.moveTo(DG_X0, FD);
  c.lineTo(DG_X0, atticCeil(DG_X0));
  c.lineTo(470, atticCeil(470));
  c.lineTo(HR, atticCeil(HR));
  c.lineTo(HR, FD);
  c.closePath();
  c.clip();
  if (gr?.raumstation) drawMetalWall(c, DG_X0, 530, 30, FD, atticCeil);
  else if (weihnacht && !gr) weihnachtsTapete(c, DG_X0, 530, 30, FD, "gaming");
  else wallBand(c, DG_X0, 530, 30, FD, "#4a4f92", "#383d7c", 30);
  if (weihnacht && !gr) weihnachtsTapete(c, 530, HR, 30, FD, "musik");
  else wallBand(c, 530, HR, 30, FD, "#9a5750", "#7e433e", 30);
  c.restore();

  // 1. Stock
  if (gr?.schlafzimmer) {
    drawBurgWand(c, 270, 490, FD + SLAB, FO);
  } else if (festlich) weihnachtsTapete(c, 270, 490, FD + SLAB, FO, "schlafzimmer");
  else wallBand(c, 270, 490, FD + SLAB, FO, "#b9808f", "#9c6676", 30);
  if (gr?.badezimmer) drawBioBadWall(c);
  else bathTiles(c, 490, OG_X1, FD + SLAB, FO, festlich);
  // Treppenhaus rechts (über EG und 1. Stock)
  if (weihnacht && !gr) weihnachtsTapete(c, OG_X1, HR, FD + SLAB, FE, "treppenhaus");
  else wallBand(c, OG_X1, HR, FD + SLAB, FE, "#cdb78f", "#b79f74", 30);
  // Erdgeschoss
  if (weihnacht && !gr) weihnachtsTapete(c, HL, 250, FO + SLAB, FE, "flur");
  else wallBand(c, HL, 250, FO + SLAB, FE, "#7d93a3", "#5f7584", 30);
  if (weihnacht && !gr) weihnachtsTapete(c, 250, 560, FO + SLAB, FE, "wohnzimmer");
  else wallBand(c, 250, 560, FO + SLAB, FE, "#6f9a93", "#55807a", 30);
  if (weihnacht && !gr) weihnachtsTapete(c, 560, OG_X1, FO + SLAB, FE, "kueche");
  else wallBand(c, 560, OG_X1, FO + SLAB, FE, "#dcbc70", "#c9a458", 34);
  // Keller
  if (festlich) weihnachtsTapete(c, CEL_X0, HR, FE + SLAB, FK, "keller");
  else {
    wallBand(c, CEL_X0, 590, FE + SLAB, FK, "#6f746f", "#5a5f5a", 26);
    wallBand(c, 590, HR, FE + SLAB, FK, "#6f746f", "#5a5f5a", 26);
  }

  /* ---- Böden ---- */
  const WOOD = "#a06f45";
  slab(c, CEL_X0, HR, FK, [[CEL_X0, 590, festlich ? farben.boeden.keller : "#8a8d88", "none"],
    [590, HR, festlich ? farben.boeden.rauchraum : "#777a74", "none"]], "#2a2522");
  slab(c, 98, HR, FE, [[98, 560, festlich ? farben.boeden.holz : WOOD, "wood"],
    [560, HR, festlich ? farben.boeden.fliesen : "#e8e2d2", "tile"]]);
  slab(c, 98, OG_X1 + 2, FO, [[98, 490, festlich ? farben.boeden.holz : "#a87a52", "wood"],
    [490, OG_X1 + 2, gr?.badezimmer ? "#536260" : festlich ? farben.bad.boden : "#4d9a66", "tile"]]);
  slab(c, DG_X0, HR, FD, [[DG_X0, 530, gr?.raumstation ? "#5a5a6a" : festlich ? farben.boeden.gaming : "#3e3b52", "none"],
    [530, HR, WOOD, "wood"]]);
  if (gr?.raumstation) drawMetalFloor(c, DG_X0, 530, FD);
  // Hexenküche und rechtes Treppenhaus: Bruchstein, Pflaster, Einrichtung.
  if (gr?.kueche) drawHexenkuecheRaum(c);

  /* ---- Außenwände (hinter dem Dachüberstand) ---- */
  rect(c, 98, 118, 12, FE + SLAB - 118, "#4a3a33");
  rect(c, 98, 118, 2, FE + SLAB - 118, "rgba(255,255,255,.14)");
  rect(c, HR, 118, 12, FK + 14 - 118, "#4a3a33");
  rect(c, HR + 10, 118, 2, FK + 14 - 118, "rgba(255,255,255,.1)");
  // Dach liegt vor der linken und rechten Seitenwand
  drawRoof(c);
  // Türöffnung in der Keller-Außenwand (sonst massiv)

  rect(c, CEL_X0 - 12, FE + SLAB, 12, FK + 14 - FE - SLAB, CELLAR_WALL);

  /* ---- Trennwände ---- */
  partition(c, 250, FO + SLAB, FE);
  partition(c, 560, FO + SLAB, FE);
  partition(c, 270, FD + SLAB, FO);
  partition(c, 490, FD + SLAB, FO);
  partition(c, 530, atticCeil(530), FD);
  partition(c, 590, FE + SLAB, FK);

  // Das hohe Fenster im rechten Treppenhaus kommt vor die Treppe: Ihr Geländer
  // läuft davor, nicht dahinter.
  if (!gr?.kueche) windowRect(c, sky, 740, 236, 44, 78, { mull: 2, kranz: weihnacht && !gr });

  /* ---- Treppen ---- */
  // Im Gruselhaus kommt die Treppe zum 1. Stock als Steintreppe erst nach
  // dem Fenster – so liegt ihr Geländer davor statt dahinter.
  for (const s of STAIRS) if (!(gr?.kueche && s.id === "eg_og")) drawStair(c, s);
  railing(c, DG_X0 - 14, FD, 12);
  if (gr?.kueche) drawEisenBruestung(c, OG_X1 - 12, FO, 12);
  else railing(c, OG_X1 - 12, FO, 12);

  /* ---- Dachbalken (nur Gruselhaus-Raumstation) ---- */
  if (gr?.raumstation) {
    drawSteelBeam(c, 278, 530, 88, 6);
  }

  /* ---- Fenster ---- */
  windowRect(c, sky, 330, 358, 64, 38, { curtain: "#c9453a", kranz: weihnacht && !gr });
  if (!gr?.kueche) windowRect(c, sky, 624, 364, 50, 36, { kranz: weihnacht && !gr });
  if (gr?.kueche) {
    drawKuchenFenster(c, sky);
    const st = STAIRS.find((x) => x.id === "eg_og");
    if (st) drawSteintreppe(c, st.footX, FLOOR_Y[st.lower], st.topX, FLOOR_Y[st.upper]);
  }
  if (!gr?.schlafzimmer) {
    windowRect(c, sky, 334, 244, 62, 46, { curtain: "#7a3f55", kranz: weihnacht && !gr });
  }
  if (gr?.raumstation) drawSpaceWindow(c, RS.fenster.x, RS.fenster.y, RS.fenster.r);
  else windowRect(c, sky, 330, 98, 56, 44, { mull: 2, kranz: weihnacht && !gr });
  roundWindow(c, sky, 590, 104, 20, weihnacht && !gr);

  /* ---- Erdgeschoss ---- */
  if (festlich) weihnachtsLichtfleck(c, [HL, FO + SLAB, 250 - HL, FE - FO - SLAB], 163, FE - 2, 71, 45, 0.19);
  haustuer(c, sky, 135, FE, festlich);
  if (festlich) weihnachtsWandkranz(c, 161, FE - 28, 7.3, true);
  garderobe(c, 198, FE, festlich);
  ceilingLamp(c, 170, FO + SLAB, 14);
  if (!festlich) bookshelf(c, 258, FE, 32, 92, 5, 2);
  c.beginPath();
  c.ellipse(388, FE + 3, 112, 6, 0, 0, Math.PI * 2);
  c.fillStyle = festlich ? farben.teppich[0] : "#b0524a";
  c.fill();
  c.beginPath();
  c.ellipse(388, FE + 3, 78, 4, 0, 0, Math.PI * 2);
  c.fillStyle = festlich ? farben.teppich[2] : "#d9a86a";
  c.fill();
  sofa(c, WEIHNACHTS_ORTE.sofa, FE, festlich);
  if (festlich) {
    const links = WEIHNACHTS_ORTE.wohnzimmerLinks;
    const wand = [links, FO + SLAB, 560 - links, FE + 5 - FO - SLAB] as const;
    weihnachtsLichtfleck(c, wand, WEIHNACHTSBAUM_X, FE - 45, 70, 71, 0.25);
    weihnachtsLichtfleck(c, wand, WEIHNACHTSBAUM_X + 3, FE - 1, 58, 12, 0.37);
    wohnzimmerWeihnachtsbaum(c, FE);
    wohnzimmerBuch(c, WEIHNACHTS_ORTE.buch, FE - 35.4);
  } else floorLamp(c, 302, FE);
  tvSet(c, 438, FE, festlich);
  kellerTuer(c, 500, FE);
  // Gruselhaus: Küche ist leer geräumt. Wand, Boden und Fenster bleiben;
  // die Stationen bleiben unsichtbar funktionsfähig, bis das Zimmer neu kommt.
  if (gr?.kueche) {
    // Hexenküche: die Küche ist ausgeräumt, nur der gusseiserne Ofen und der
    // Hexenkessel stehen am Platz des alten Backofens. Feuer läuft dynamisch.
    hexenofenOhneRohr(c, (c) => drawOfen(c, FE, 0, 0));
    drawKessel(c, FE, 0);
  } else {
    fridge(c, 574, FE, festlich);
    kitchenCounter(c, 614, FE, 76, festlich);
    if (festlich) festzweig(c, 619, FE - 40.9, 9.3);
    teaPot(c, tee.kanne, tee.tasse, tee.fill);
    stove(c, 690, FE);
    ceilingLamp(c, 650, FO + SLAB, 14);
    kitchenTable(c, 724, FE, 74, festlich);
    tobaccoTin(c, 766, FE);
    chair(c, 732, FE, true);
    chair(c, 796, FE, false);
    if (festlich) esstischAdventskranz(c, FE);
  }

  /* ---- 1. Stock ---- */
  rrect(c, 236, FO - 18, 16, 18, 3, festlich ? WEIHNACHTS_FARBEN.rosa : "#c96f4a");
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.5;
    line(c, 244, FO - 18, 244 + Math.cos(a) * 18, FO - 18 + Math.sin(a) * 26, festlich ? WEIHNACHTS_FARBEN.blatt : "#3f8f5f", 3);
    const blatt = festlich ? (i % 2 ? WEIHNACHTS_FARBEN.nadel : WEIHNACHTS_FARBEN.blattlicht) : (i % 2 ? "#54b071" : "#3f8f5f");
    disc(c, 244 + Math.cos(a) * 18, FO - 18 + Math.sin(a) * 26, 4, blatt);
  }
  if (gr?.schlafzimmer) {
    drawVampirSchlafzimmer(c, FO);
  } else {
    c.beginPath();
    c.ellipse(340, FO + 3, 90, 5, 0, 0, Math.PI * 2);
    c.fillStyle = festlich ? farben.teppich[1] : "#8a4f63";
    c.fill();
    if (festlich) weihnachtsWandkranz(c, 302, FO - 77, 8.6);
    bed(c, 282, FO, bettBelegt, festlich);
    nightstand(c, 396, FO, festlich);
    wardrobe(c, 434, FO, festlich);
    ceilingLamp(c, 340, FD + SLAB, 14, "#f2d9a0");
  }
  if (gr?.badezimmer) drawBioBadStatic(c);
  else {
    showerStatic(c, FO);
    wcTuer(c, WC_DOOR_X, FO);
    waschbeckenMitSpiegel(c, SINK_X, FO);
    bathCeilingLamp(c, 590, FD + SLAB, FO, 490, OG_X1);
    if (festlich) winterBadAblage(c, FO);
  }

  /* ---- Dachgeschoss ---- */
  if (gr?.raumstation) {
    // Horror-Raumstation: Sessel, Terminal, Lagerregal und alle Details
    drawRaumstationMoebel(c, atticCeil, golOnShelf ? (cc, bx, by, bw, bh) => golCartridge(cc, bx, by, bw, bh) : undefined);
  } else {
    beanbag(c, 296, FD, festlich);
    lowboardTV(c, 404, FD, festlich);
    bookshelf(c, 486, FD, 38, 74, 4, 5, true, [
      {
        row: 0,
        index: 1,
        item: golOnShelf ? (cc, bx, by, bw, bh) => golCartridge(cc, bx, by, bw, bh) : undefined,
      },
      {
        // Zweite Brettreihe: die Hülle des Teleflauschis, sobald der Nikolaus es brachte.
        row: 2,
        index: 1,
        item: flauschiOnShelf ? (cc, bx, by, bw, bh) => drawFlauschiHuelle(cc, bx, by, bw, bh, 0) : undefined,
      },
    ], festlich ? farben.buecher : BOOK_COLS);
    picture(c, 276, 108, 22, 30, festlich ? farben.gaming.bild : "#35d6c0");
  }
  // Das normale Klavier mit zentriertem Hocker davor (Mitte x = 567); das Musikzimmer zeichnet sein eigenes.
  if (!gr) {
    piano(c, 545, FD);
    pianoStool(c, SCHEMEL_X, FD);
  }
  saxStand(c, SAX_STAND_X, FD);
  // Lautsprecher und Plattenspieler werden dynamisch über draw() gezeichnet,
  // damit sich Platte, Tonarm und Tieftöner bewegen, ohne das Hintergrundbild
  // in jedem Frame neu aufbauen zu müssen.
  recordShelf(c, 776, FD);
  guitar(c, 818, FD);
  if (!gr?.raumstation) ceilingLamp(c, 430, atticCeil(430) + 2, 36, "#f2d9a0");
  ceilingLamp(c, 700, atticCeil(700) + 2, 30, "#f2d9a0");

  /* ---- Keller ---- */
  shelving(c, 354, FK, 56, 104, 1, festlich);
  shelving(c, 528, FK, 60, 92, 3, festlich);
  cardboard(c, 446, FK, 30, 24);
  cardboard(c, 478, FK, 24, 18);
  cardboard(c, 452, FK - 24, 22, 16);
  if (weihnachtsdeko) xmasBox(c, 526, FK);
  bulb(c, 470, FE + SLAB, 14);
  coatBoard(c, 604, FK);
  if (festlich) kellerWinterdeko(c, FK);
  abstellkammer(c, SIDE_X + 26, FK);
  smokerChair(c, ASH_STAND_X - 12, FK);
  sideTable(c, SIDE_X, FK);
  sideDoor(c, HR - 1, FK - 88, 88, door.open);
  bulb(c, 700, FE + SLAB, 14);
}

/* ========================================================================
   LAUFENDES SPIEL
   ======================================================================== */

type Step = { k: "walk"; x: number } | { k: "stair"; s: Stair; dir: 1 | -1 };

/** Ablauf beim Duschen und beim Anziehen danach, in dieser Reihenfolge. */
const SH_SEQ = [
  "toWardrobe", "openWardrobe", "undress", "wrap", "closeWardrobe",
  "toSink", "glassesOff", "tossGlasses", "toShower", "closeCurtain", "towelOff", "throwTowel", "waterOn",
  "washHair", "washBody", "rinse", "waterOff", "takeTowel", "wrapOn",
  "openCurtain", "stepOut",
] as const;
/** Gruselhaus: vorhandenes Umziehen/Brille/Waschen, aber Kapsel statt Vorhang. */
const DEKON_SEQ = [
  "toWardrobe", "openWardrobe", "undress", "wrap", "closeWardrobe",
  "toSink", "glassesOff", "tossGlasses", "toPanel", "pressPanel", "capsuleOpen",
  "towelOff", "throwTowel", "toShower", "turnFront", "capsuleClose",
  "waterOn", "washHair", "washBody", "rinse", "waterOff",
  "capsuleExitOpen", "stepOut", "takeTowel", "wrapOn", "capsuleExitClose",
] as const;
const DRESS_SEQ = ["dToWardrobe", "dOpen", "dDress", "dClose"] as const;
const GLASS_SEQ = ["gToSink", "gPick"] as const;
const CAB_OPEN_SEQ = ["cToCab", "cOpen"] as const;
const CAB_CLOSE_SEQ = ["kToCab", "kClose"] as const;
const BRUSH_SEQ = ["bToCab", "bTake", "bStep", "bBend", "bBrush", "bUp", "bReturn", "bPut"] as const;
const BED_SEQ = ["bToWardrobe", "bedOpen", "bedTop", "bedBottom", "bedPants", "bedPajama", "bedCape", "bedClose", "bedSit", "bedToss"] as const;
const ALL_SEQS: readonly (readonly string[])[] = [
  SH_SEQ, DRESS_SEQ, GLASS_SEQ, CAB_OPEN_SEQ, CAB_CLOSE_SEQ, BRUSH_SEQ, BED_SEQ,
];
/** Gruselhaus, Raum 03: Ablauf am und im Sarg. */
type SargPhase =
  | "zumSarg" | "deckelAuf" | "aufHocker" | "einsteigen" | "hinsetzen" | "brilleAb" | "werfen" | "deckelZu"
  | "aufwachen" | "aufstehen" | "aussteigen" | "abHocker" | "deckelSchliessen" | "zurBrille" | "brilleAuf" | "brilleWeg";
const SARG_DUR: Record<SargPhase, number> = {
  zumSarg: 0, deckelAuf: 1.8, aufHocker: 1.0, einsteigen: 1.2, hinsetzen: 1.4, brilleAb: 1.3, werfen: 1.3,
  deckelZu: 2.8, aufwachen: 2.0, aufstehen: 1.2, aussteigen: 1.2, abHocker: 0.9, deckelSchliessen: 1.8,
  zurBrille: 0, brilleAuf: 2.3, brilleWeg: 1.4,
};
/** Nach dem Aufwachen: Befehle werden gemerkt und danach ausgeführt. */
const SARG_WACH: SargPhase[] = ["aufwachen", "aufstehen", "aussteigen", "abHocker", "deckelSchliessen", "zurBrille", "brilleAuf", "brilleWeg"];
const sanft = (v: number) => {
  const k = v < 0 ? 0 : v > 1 ? 1 : v;
  return k * k * (3 - 2 * k);
};
interface SargPose {
  x: number; y: number; state: LuniState; expr: LuniExpr; face: 1 | -1; back: boolean; phase: number;
  walk?: number; hand?: Pt | null; hand2?: Pt | null; backReach?: boolean; lean?: number; umhang?: number; shake?: number;
}
type ShPhase =
  | (typeof SH_SEQ)[number]
  | (typeof DEKON_SEQ)[number]
  | (typeof DRESS_SEQ)[number]
  | (typeof GLASS_SEQ)[number]
  | (typeof CAB_OPEN_SEQ)[number]
  | (typeof CAB_CLOSE_SEQ)[number]
  | (typeof BRUSH_SEQ)[number]
  | (typeof BED_SEQ)[number];
/** Flugdauer der Brille in Sekunden */
const GLASSES_FLIGHT = 1.35;
/** Dauer in Sekunden; Laufschritte haben keine Dauer, sie enden mit der Ankunft. */
const SH_DUR: Partial<Record<ShPhase, number>> = {
  glassesOff: 1.3, tossGlasses: 0.9,
  openWardrobe: 0.7, undress: 1.6, wrap: 1.5, closeWardrobe: 0.6,
  pressPanel: 0.8, capsuleOpen: 1.1, turnFront: 0.8, capsuleClose: 1.1,
  capsuleExitOpen: 1.1, capsuleExitClose: 1.1,
  closeCurtain: 1.3, towelOff: 1.1, throwTowel: 0.9, waterOn: 0.8,
  washHair: 3.4, washBody: 3.4, rinse: 2.8, waterOff: 0.8,
  takeTowel: 0.9, wrapOn: 1.5, openCurtain: 1.3,
  dOpen: 0.7, dDress: 1.8, dClose: 0.6,
  gPick: 2.3, cOpen: 1.2, kClose: 1.2,
  bTake: 1.1, bBend: 1.4, bBrush: 7, bUp: 1.3, bPut: 1.1,
  bedOpen: 0.7, bedTop: 1.1, bedBottom: 1.3, bedPants: 1.2, bedPajama: 2.2, bedCape: 1.9, bedClose: 0.6, bedToss: 1.3,
};
/** Hinter dem Vorhang: nicht unterbrechbar */
const SH_LOCKED: ShPhase[] = [
  "glassesOff", "tossGlasses", "openWardrobe", "undress", "wrap", "closeWardrobe", "closeCurtain", "towelOff", "throwTowel",
  "waterOn", "washHair", "washBody", "rinse", "waterOff", "takeTowel", "wrapOn", "openCurtain",
  "dOpen", "dDress", "dClose",
  "gPick", "cOpen", "kClose",
  "bTake", "bStep", "bBend", "bBrush", "bUp", "bReturn", "bPut",
  "bedOpen", "bedTop", "bedBottom", "bedPants", "bedPajama", "bedCape", "bedClose", "bedSit", "bedToss",
  "pressPanel", "capsuleOpen", "turnFront", "capsuleClose", "capsuleExitOpen", "capsuleExitClose",
];
/** In diesen Schritten steht Luni in der Wanne, also hinter dem Vorhang. */
const SH_INSIDE: ShPhase[] = [
  "closeCurtain", "towelOff", "throwTowel", "waterOn", "washHair", "washBody",
  "rinse", "waterOff", "takeTowel", "wrapOn", "openCurtain",
];
const SH_STAND: Record<string, { x: number; face: 1 | -1 }> = {
  toWardrobe: { x: 458, face: 1 },
  dToWardrobe: { x: 458, face: 1 },
  toSink: { x: 602, face: 1 },
  toShower: { x: SHOWER_X + 21, face: 1 },
  stepOut: { x: 574, face: 1 },
  gToSink: { x: 632, face: 1 },
  cToCab: { x: 636, face: 1 },
  kToCab: { x: 636, face: 1 },
  bToCab: { x: 636, face: 1 },
  // ein Stück zurück, damit der Kopf beim Vorbeugen vor dem Becken hängt
  bStep: { x: 598, face: 1 },
  bReturn: { x: 636, face: 1 },
  bToWardrobe: { x: 458, face: 1 },
  bedSit: { x: 330, face: 1 },
};
const DEKON_STAND: Record<string, { x: number; face: 1 | -1 }> = {
  toPanel: { x: BIO_BAD.panel.stand, face: -1 },
  toShower: { x: BIO_BAD.kapsel.x + BIO_BAD.kapsel.w / 2, face: 1 },
  stepOut: { x: BIO_BAD.panel.stand, face: 1 },
  cToCab: { x: BIO_BAD.spind.stand, face: 1 },
  kToCab: { x: BIO_BAD.spind.stand, face: 1 },
  bToCab: { x: BIO_BAD.spind.stand, face: 1 },
  bStep: { x: 609, face: 1 },
  bReturn: { x: BIO_BAD.spind.stand, face: 1 },
};
interface Active {
  step: Step;
  t: number;
  phase: "climb" | "enter" | "exit";
  timer: number;
}

export interface HouseOptions {
  /** feste Uhrzeit (nur für Tests) */
  clock?: Clock;
  /** sichtbarer Traumstein wechselt in die leere Traumhausansicht (alt) */
  onTraumhaus?: () => void;
  /** Welche Hauswelt dieses Haus zeigt: normal, Gruselhaus oder Weihnachtshaus */
  welt?: "normal" | "gruesel" | "weihnacht" | "traum";
  /** Ein Klick auf einen Wechselstein: Ziel-Hauswelt */
  onWelt?: (ziel: WeltId) => void;
  /**
   * Osterei „Datenkoffer“: Luni hat den Koffer geöffnet – die Oberfläche
   * soll den Stand-Übertragungsdialog zeigen. Reines Signal nach draußen,
   * das Spiel selbst kennt keinen DOM-Code.
   */
  onUpdate?: () => void;
  /**
   * UFO oben rechts: eine Zeile im Menü wurde gewählt. Das Haus kennt weder
   * Dateien noch DOM – das Herunterladen passiert in der GUI-Schicht.
   */
  onUfo?: (datei: string) => void;
}

function drawProp(c: C, kind: Prop, x: number, y: number, face: 1 | -1) {
  c.save();
  c.translate(x, y);
  c.scale(face, 1);
  switch (kind) {
    case "cup":
      rrect(c, -2.6, -4.5, 5.2, 5.6, 1.2, "#f6f3ea");
      c.strokeStyle = "#f6f3ea";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(2.8, -1.8, 1.7, -1.2, 1.2);
      c.stroke();
      rect(c, -2.2, -3.9, 4.4, 1.3, "#6b3f2a");
      break;
    case "pad":
      rrect(c, -4.5, -2.6, 9, 5, 2, "#23262e");
      disc(c, -2.2, 0, 1, "#9aa3b8");
      disc(c, 2.4, -0.8, 0.9, "#ff6f61");
      disc(c, 3.6, 0.6, 0.9, "#35d6c0");
      break;
    case "book":
      rect(c, -4, -6, 8, 10, "#c9453a");
      rect(c, -3, -5, 6.4, 8.4, "#f6f3ea");
      rect(c, -4, -6, 1.6, 10, "#8f2f27");
      break;
    case "pan":
      disc(c, 2, -1, 4.2, "#2a2f35");
      disc(c, 2, -1, 3, "#4a4f56");
      rect(c, -6, -1.6, 5, 2, "#5a4630");
      break;
  }
  c.restore();
}

/**
 * Optional: das echte GIF als Base64-Data-URI hier einfügen, z. B.
 * RICK_GIF_DATA = "data:image/gif;base64,R0lGODlh...".
 * Solange der String leer ist, läuft die eingebaute Mini-Version.
 */
const RICK_GIF_DATA = "";

/** Wohnzimmer-TV: 30 s Harvest-Spiel, 30 s Musikvideo, jeweils mit Umschalt-Statik. */
const TV_CYCLE = 60;
const TV_RICK_AT = 30;
const TV_STATIC_LEN = 0.6;

export class House {
  private canvas: HTMLCanvasElement;
  private ctx: C;
  private bg = document.createElement("canvas");
  private sky = document.createElement("canvas");
  private mul = document.createElement("canvas");
  private add = document.createElement("canvas");
  private bgc: C;
  private skyc: C;
  private mulc: C;
  private addc: C;

  private raf = 0;
  private last = 0;
  private elapsed = 0;
  private scale = 1;
  private dpr = 1;
  private ro: ResizeObserver | null = null;
  private destroyed = false;
  private dirty = true;
  /** zuletzt gezeichneter WC-Zustand (für das Neuzeichnen der statischen Ebene) */
  private wcOpenFinal = 0;
  /** zuletzt gerenderter Türzustand (statische Ebene muss neu) */
  private gardenRendered = -1;
  private bettRendered = false;
  private night = 0;

  private fixedClock: Clock | null;
  private clock: Clock;
  private clockT = 0;
  private bucket = -1;

  // Luni
  private lx = 380;
  private lf = 1;
  private lface: 1 | -1 = 1;
  private walkP = 0;
  private stepAcc = 0;
  private alpha = 1;
  private path: Step[] = [];
  private cur: Active | null = null;
  private target: Station | null = null;
  private activity: Station | null = null;
  private pending: Station | null = null;
  private blinkT = 2;
  private blink = 0;
  private doorOpen = 0;
  private doorWant = false;
  private hover: Station | null = null;
  private stationFokus: Station | null = null;

  /* ------------------------------ Hauswelt ------------------------------- */
  private welt: "normal" | "gruesel" | "weihnacht" | "traum" = "normal";
  /** Normales Haus, Weihnachtshaus und das Haus ohne Weihnachtsdeko teilen 1:1 dieselbe Hauslogik. */
  private get istNormalHaus(): boolean {
    return this.welt === "normal" || this.welt === "weihnacht" || this.welt === "traum";
  }

  /** Das Haus über den Traumstein ist das normale Haus ohne Weihnachtsdeko. */
  private get weihnachtsdeko(): boolean {
    return this.welt !== "traum";
  }
  private onWelt: ((ziel: WeltId) => void) | null = null;
  private steine: SteinSlot[] = [];
  private steinStationen: Station[] = [];
  private saveT = 0;
  /** Gruselhaus, Raum 01: seltene Effekte (Notfallschalter, Funken) */
  private raumFx = new RaumstationFx();
  private stations: Station[] = STATIONS;
  private musikzimmer: MusikzimmerAblauf | null = null;
  private pianoSeat = 0;
  private pianoRise = 0;
  private pianoRiseFrom = 0;
  private pianoAfter: LuniCommand | null = null;
  private pianoEscape = false;
  private pianoEscapeMoving = false;
  private pianoRefusal = 0;

  // Raucherecke
  private gardenDoor = 0; // 0 = zu, 1 = offen
  private gardenWant = 0;
  /** gewünschter Türzustand; wird erst beim Ankommen an der Tür umgesetzt */
  private gardenTarget: 0 | 1 | null = null;
  /** Zigarette liegt auf dem Rand des Aschenbechers (brennend oder ausgegangen) */
  private cigButt = false;
  /** Ausgedrückte Stummel im Aschenbecher (kleiner Haufen) */
  private ashButts = 0;
  /** Geleerte Stummel im Ascheneimer */
  private bucketButts = 0;
  /** Armbewegung zum Aschenbecher: "put" legt ab, "take" nimmt auf, "quench" drückt aus */
  private ashMove: "put" | "take" | "quench" | null = null;
  /** kurzer Rauchstoß beim Ausdrücken im Aschenbecher (Sekunden) */
  private quenchPuff = 0;
  /** Gesamtbrenndauer der aktuellen Zigarette, für die sichtbare Asche */
  private burnTotal = 0;
  /** Negative Zeit: das Feuerzeug vor dem Anzünden vom Tisch einstecken. */
  private lightT: number | null = null;
  private lightAufTisch = false;
  private lightAblegen = false;
  private lightNext: LuniCommand | null = null;
  /** Aschenbecher-Leeren-Animation am Eimer (Sekunden) */
  private emptyT = 0;
  private ashT = 0;
  /** nach dem Ablegen auszuführender Befehl */
  private ashNext: LuniCommand | null = null;
  /** Beim Handygebrauch bleibt sie nach dem Griff am Aschenbecher sitzen. */
  private ashAmStuhl = false;
  /** Der Aschenbecher wird sitzend am Stuhl bedient (true) oder stehend davor (false). */
  private ashSitzend = false;
  /** true = sie ist zum Rauchen hier (über den Aschenbecher bestellt) */
  private smokeRequested = false;
  /** wie lange sie schon gemütlich auf dem Stuhl sitzt */
  private sitIdleT = 0;
  /** Aufsteh-Animation läuft (vom Stuhl) */
  private standing = false;
  private standT = 0;
  /** Befehl, der nach dem Aufstehen ausgeführt wird */
  private standNext: LuniCommand | null = null;
  /** sie läuft noch zum Tischchen, bevor die Armbewegung startet */
  private ashWalking = false;
  /** sie hat eine brennende Zigarette in der Hand (auch unterwegs) */
  private holding = false;

  // Tür zwischen Krempelraum und Rauchzimmer
  private cellarDoorV = 0;
  private cellarDoorWant = 0;
  /** Rauch, der durch die offene Tür in den Krempelraum zieht (0..1) */
  private smokeSpill = 0;
  /** kurzer, kräftiger Rauchstoß beim Öffnen der vollen Tür (Sekunden) */
  private smokeGust = 0;
  private gustMax = 2.8;
  /** zuletzt gesehener Türzustand für den Stoß-Auslöser */
  private prevCellarDoor = 0;
  /** kurzer, kräftiger Abzug durch die Gartentür beim Öffnen (Sekunden) */
  private ventGust = 0;
  private ventMax = 2.4;
  /** zuletzt gesehener Gartentür-Zustand für den Abzugs-Auslöser */
  private prevGardenDoor = 0;

  // Rauchvergiftung
  /** 0 = fit, 1 = kräftig angeschlagen (Husten, grünes Gesicht) */
  private sick = 0;
  private teaT = 0;
  /** Tee-Ablauf: was gerade gezeichnet statt statisch gemalt wird */
  private teaKanneWeg = false;
  private teaTasseWeg = false;
  private teaFuellung = 0;

  private handy: HandyAblauf | null = null;
  private handyDanach: LuniCommand | null = null;
  /** Zeit seit dem Anzünden oder Wiederaufnehmen; treibt den Rauchzyklus. */
  private smokeIdleT = 0;

  // Zigarettenschachtel
  /** Zigaretten in der Schachtel (max. 23) */
  private pack = 0;
  /** Einpack-Animation am Küchentisch */
  private packMove = false;
  private packT = 0;
  /** am Tisch eine einzelne Zigarette mitnehmen statt stopfen */
  private takeMove = false;
  private takeT = 0;
  private tabakMode: "roll" | "take" = "roll";
  private wcOpen = 0; // 0 = WC-Tür zu, 1 = offen
  private wcWant = 0;
  private wcT = 0;
  private wcInside = false; // Luni ist hinter der WC-Tür
  private tvMode: "cozy" | "console" | "gol" = "cozy";
  private golState: GOLState | null = null;
  /** Zweiter Rasterpuffer, damit die Folgegeneration nichts überschreibt. */
  private golTimer = 0;
  /** Zwischenpuffer der Vergrößerung, wird nur bei neuer Generation neu gemalt. */
  private golBuf = document.createElement("canvas");
  private golImg: ImageData | null = null;
  private golEdits = 0;
  private golBufKey = "";
  /** Pegel nach +/−: 1 = sichtbar, blendet aus */
  private golMeterT = 0;
  private golMeterKind: "speed" | "size" = "speed";
  /** Modul liegt noch auf der obersten Regalebene (statische Schicht, hinter Luni). */
  private golOnShelf = true;
  /** Modul steckt in der Konsole unter dem Fernseher. */
  private golInserted = false;
  /** greifen, zum Fernseher tragen, einlegen, hinsetzen, oder Vergrößern */
  private golPhase: "reach" | "carry" | "insert" | "watch" | "rise" | "toButton" | "press" | "back" | null = null;
  private golAnimT = 0;
  /** Welcher Fernseher groß dargestellt wird (null = normale Hausansicht). */
  private tvZoom: "tv_e" | "tv_d" | null = null;
  /** Manuelles Ein-/Ausschalten am großen TV (null = folgt Lunis Nutzung). */
  private tvManual: Record<"tv_e" | "tv_d", boolean | null> = { tv_e: null, tv_d: null };
  private tvStand: TVStand | null = null;
  private tvKlang: Partial<Record<TVId, TVKlang>> = {};
  private tvFernHover: TVBefehl | null = null;
  private tvFernFokus: TVBefehl | null = null;
  private get tvDaten(): TVStand { return this.tvStand ??= neuerTVStand(); }
  private get golFullscreen() {
    return this.tvZoom === "tv_d" && this.tvContent("tv_d") === "gol";
  }

  /* ---- Teleflauschi „Flauschi“ (nur das Weihnachtshaus) ---- */
  private flauschiState: FlauschiStand | null = null;
  /** Modul liegt noch im Regal. */
  private flauschiOnShelf = true;
  /** Modul steckt in der Konsole unter dem Fernseher. */
  private flauschiInserted = false;
  /** greifen, zum Fernseher tragen, einlegen, dabeisitzen */
  private flauschiPhase: "reach" | "carry" | "insert" | "watch" | null = null;
  private flauschiAnimT = 0;
  private flauschiFokus: FlauschiAktion = "fuettern";
  private flauschiHover: FlauschiAktion | null = null;
  private flauschiZurueckFokus = false;
  /** Flauschi selbst als Ziel: Kopf (streicheln) oder Bauch (kitzeln). */
  private flauschiZoneFokus: FlauschiZielId | null = null;
  private flauschiZoneHover: FlauschiZielId | null = null;
  /** Der Zeiger wird auf Flauschis Kopf gedrückt gehalten (langes Kraulen). */
  private flauschiHaelt = false;

  private get flauschiWelt(): boolean {
    return this.welt === "weihnacht";
  }
  private get flauschiAktiv(): boolean {
    return this.flauschiWelt && this.flauschiInserted;
  }
  /** Offene Türchen dieser Hauswelt (Eigen-Schlüssel, siehe welten.ts). */
  private flauschiOffen(): number[] {
    this.adventStandPruefen();
    return this.adventStand.offen;
  }
  /** Ab Türchen 6 liegt das Modul überhaupt erst im Regal. */
  private get flauschiModulSichtbar(): boolean {
    return this.flauschiWelt && this.flauschiOnShelf && flauschiVersprochen(this.flauschiOffen());
  }
  private get flauschiFullscreen(): boolean {
    return this.tvZoom === "tv_d" && this.tvContent("tv_d") === "flauschi";
  }

  // Adventskalender (Zielbild aus dem Spielkonzept; Prototyp: alle Türchen frei)
  private adventFullscreen = false;
  /** 0 = an der Wand, 1 = voll herangezoomt */
  private adventZoomT = 0;
  private adventSchliessen = false;
  /** Eigene Uhr für Funkeln, Lichterkette und Schnee im Overlay. */
  private adventT = 0;
  private adventFokus = 0;
  private adventHover = -1;
  /** Öffnungsanimation je Türchen-Index (0..1). */
  private adventAnims = new Map<number, number>();
  private adventStand: AdventStand = { jahr: 0, offen: [], reihenfolge: [] };
  private adventTuerenCache: ReturnType<typeof adventTueren> | null = null;
  private adventWarteT = 0;
  /** Kurzer Goldstern-Moment, wenn die geheime Reihenfolge gelingt. */
  private adventSternT = 0;
  /** Weihnachtshaus: der feste Schmuck rund um den Kalender, einmal je Türchenstand gezeichnet. */
  private adventSchmuckPuffer = Object.assign(document.createElement("canvas"), { width: W, height: H });
  private adventSchmuckKey = "";
  /** Goldener Schimmer für das Stück, das gerade neu dazugekommen ist (Sekunden übrig). */
  private adventGlanzT = 0;
  /** Der Weihnachtsgruß beim 24. Türchen steht, bis er weggeklickt wird. */
  private adventGruss = false;

  // Lunis zwei Hunde: Odin (schmaler Fang, helles Braun) & Apollo (breiter Kopf, gestromt)
  private hunde = new HundeWelt();
  private petHund: HundId | null = null;
  private petT = 0;
  /** Zuruf an der Gartentür: Luni ruft den Hund herein und streichelt ihn danach. */
  private rufHund: HundId | null = null;
  private rufT = 0;

  /* --- Datenkoffer (Osterei): Deckel, Antenne und der Update-Hinweis --- */
  private kofferPhase: "oeffnen" | "offen" | "schliessen" | null = null;
  private kofferT = 0;
  /** Deckelöffnung 0..1 und Antennenauszug 0..1 */
  private kofferDeckel = 0;
  private kofferAntenne = 0;
  /** Der Update-Dialog wurde für diesen Öffnungsvorgang schon gemeldet. */
  private kofferGemeldet = false;
  private onUpdate: (() => void) | null = null;
  private onUfo: ((datei: string) => void) | null = null;
  /** UFO-Menü oben rechts offen (Patch-Dateien) */
  private ufoOffen = false;
  /** im Menü berührte Zeile (nur Zeiger) */
  private ufoZeile = -1;
  /** Zeiger liegt auf dem UFO (nur minimaler Hover-Effekt) */
  private ufoHover = false;

  // Bett-Routine und Traum
  private bedPhase: "toss" | null = null;
  private pyjama: { top: string; bottom: string } | null = null;
  private bedEinstieg: "anfahrt" | "umschlagen" | "setzen" | "fuesse" | "greifen" | "toss" | null = null;
  private bedEinstiegT = 0;
  private bedBrilleBehalten = false;
  private bedKleidungAn: "dressed" | "towel" | "none" = "dressed";
  private bedPyjama: { top: string; bottom: string } | null = null;
  /** 0 = zu Hause, 1 = oben am Himmel */
  private tossUp = 0;
  private tossLand = 1;
  private tossLanded = false;
  private asleep = false;
  private sleepT = 0;
  private revealT = 0;
  private bedTimePending = false;
  private sleepRest = 0;
  private bedSitHair = 0;
  /** Schlafablauf: greifen -> ziehen -> drehen -> Haare legen -> schlafen */
  private sleepPhase: "grab" | "pull" | "turn" | "settle" | null = null;
  private sleepPhaseT = 0;
  /** kurze Aufwachpose nach „Aufwachen“ */
  private wakeT = 0;
  /** Befehl, der erst nach der sichtbaren Aufwachpose gestartet wird */
  private wakeNext: LuniCommand | null = null;
  /* Gruselhaus, Raum 03: Sarg, Outfits, Brille, Kronleuchter */
  /** Sargdeckel: 0 = zu, 1 = senkrecht offen. */
  private sargDeckel = 0;
  private sargPhase: SargPhase | null = null;
  private sargT = 0;
  private sargTon = false;
  /** Luni ist im Sarg: Vorderwand und (fast geschlossener) Deckel liegen vor ihr. */
  private imSarg = false;
  /** Befehl, der sie geweckt hat; läuft nach dem Aussteigen. */
  private nachAufwachen: LuniCommand | null = null;
  /** Vampir-Outfit: getragen, zuletzt gewählt, für heute Nacht gewählt. */
  private vampirStil: number | null = null;
  private vampirLetzt = -1;
  private vampirNeu: number | null = null;
  /** Wo die Brille gelandet ist (bis sie wieder aufgesetzt wird). */
  private brillenZielName: BrillenZiel | null = null;
  private brilleAmLeuchter = false;
  /** Kronleuchter pendelt gedämpft nach (Winkel, Winkelgeschwindigkeit). */
  private leuchterW = 0;
  private leuchterV = 0;
  private fledermausBlink = 0;
  /** Hinlegen nach dem Brillenwurf */
  private lieDown = false;
  private lieT = 0;

  // Duschen: Kleidung, Ablauf, Vorhang, Wasser, Dampf
  private outfit: "dressed" | "towel" | "none" = "dressed";

  // „Paulchen“: Saxophon nehmen, spielen, zurückstellen
  private saxPhase: "reach" | "lift" | "play" | "lower" | null = null;
  private saxT = 0;
  private saxMusic: SaxophonMusic | null = null;
  private saxReady = false;
  private saxPreparing = false;
  private saxStarted = false;
  private saxPausedAt: number | null = null;

  // Plattenspieler: einschalten, Tonarm heben/schwenken/absenken, gtlg02.mid
  private plattenPhase:
    | "switchOn"
    | "stepAside"
    | "armLift"
    | "armTurn"
    | "armLower"
    | "play"
    | "armEndLift"
    | "armEndTurn"
    | "armEndLower"
    | null = null;
  private plattenT = 0;
  private plattenPower = false;
  private plattenSpin = 0;
  private plattenArmLift = 0;
  private plattenArmTurn = 0;
  private plattenEndFrom = 1;
  private plattenBass = 0;
  private plattenMusic: PlattenMusic | null = null;
  /** Klavierlied („ssm“): Luni spielt es, solange sie am Klavier sitzt. */
  private klavierMusik: KlavierMusik | null = null;
  private klavierSitzt = false;
  private klavierSpielt = false;
  private klavierFertig = false;
  private klavierPausiert: number | null = null;
  private klavierVorbereitung: Promise<void> | null = null;
  /** Nach dem Lied: 0 = spielt noch, dann Ausklingen, Aufstehen, Blick zum Spieler, Verbeugung, Ende. */
  private klavierOutro: "klang" | "aufstehen" | "drehen" | "verbeugung" | null = null;
  private klavierOutroT = 0;
  /** Kerzen auf dem Klavier: brennen dauerhaft; Luni schaltet sie an der Station um. */
  private kerzenAn = true;
  private kerzenLauft = false;
  private kerzenGeschaltet = false;
  private kerzenT = 0;
  private plattenReady = false;
  private plattenPreparing = false;
  private plattenStarted = false;
  private plattenPausedAt: number | null = null;

  // Gesang „Frosch am Strand“: an der Gitarre stehen, animal-crossing-mässig
  // singen, Mund passend bewegen, danach aufräumen
  private singPhase: "sing" | null = null;
  private singT = 0;
  private singMusic: FroschMusic | null = null;
  private singReady = false;
  private singPreparing = false;
  private singStarted = false;
  private singPausedAt: number | null = null;

  // Tanz-Tour während des Liedes
  private danceSeg = 0;
  private danceT = 0;
  private danceStil: LuniState = "danceSway";
  private danceRueck = false;
  private danceTreppe = false;
  private danceTreppeT = 0;
  private danceTreppeStair: Stair | null = null;
  private danceTreppeDir: 1 | -1 = 1;
  private danceBlendFrom: LuniState | null = null;
  private danceBlendT = 0;
  private wet = 0;
  private shPhase: ShPhase | null = null;
  private shT = 0;
  private curtain = 0;
  private water = false;
  private steam = 0;
  private towelOnRod = false;
  /** Gruselhaus: getrennte, zeitgesteuerte Dekon-Kapsel und WC-Spülung. */
  private bioDoor = 0;
  private bioInside = false;
  private bioMist = 0;
  private bioFlash = 0;
  private bioFlashed = false;
  private bioPanelPress = 0;
  private bioWcGlow = 0;
  private bioWcTime = 0;
  private bioWcTriggered = false;
  private wardrobeOpen = 0;
  /** Brille: auf der Nase, in der Hand, im Flug oder im Waschbecken */
  private glassesOn = true;
  private glassesInHand = false;
  /** Abgelegte Brille: fester Weltpunkt, unabhängig von Luni und Schlafpose. */
  private glassesRest: { x: number; y: number; rot: number; scale: number } | null = null;
  private glassesFly: { t: number; x0: number; y0: number } | null = null;
  private glassesInSink = false;
  /** Spiegelschrank 0 = zu, 1 = offen; Bürste im Schrank oder in der Hand */
  private cabinetOpen = 0;
  private brushInCab = true;
  private brushInHand = false;
  private luniBuf = document.createElement("canvas");
  private silBuf = document.createElement("canvas");
  /** zuletzt gezeichnete vordere Hand, für das getragene Modul */
  private hand: Pt = [0, 0];
  private rickImg: HTMLImageElement | null = null;
  private rickTried = false;
  // Harvest save state. Crop growth is advanced only while the farmer tends
  // the corresponding plot; mature crops wait for her next visit to be picked.
  private harvestClock = 0;
  private harvestCrops = Array.from({ length: 6 }, () => 0);
  private harvestSpot = 0;
  private harvestFrom = 0;
  private harvestTo = 1;
  private harvestMoveT = 0;
  private harvestMoving = false;
  private harvestWorkT = 0;
  private harvestRipeT = 0;
  private harvestCoins = 0;
  private smoke = 0; // Rauch in der Raucherecke, 0 = klar, 1 = undurchsichtig
  private cigs = 0; // gedrehte Zigaretten auf dem Küchentisch
  private rollT = 0;
  /** Restbrennzeit der aktuellen Zigarette in Sekunden (3,5–5 Minuten) */
  private burnLeft = 0;
  private doorT = 0;
  /** Einmal pro Tuerszene schalten (Schleusentuer, Verbindungstuer). */
  private doorActed = false;
  /** Beim Klick gemerktes Ziel der Tuer (0 = schliessen, 1 = oeffnen). */
  private doorIntent: { id: string; want: 0 | 1 } | null = null;
  /** Blaue Verbindungstuer Gaming-Ecke <-> Musikzimmer (nur Gruselhaus). */
  private musikDoor = 0;
  private musikDoorWant = 0;
  /** Samtvorhaenge im Musikzimmer: 0 offen .. 1 geschlossen (links, rechts). */
  private vorhang: [number, number] = [1, 1];
  private vorhangWant: [0 | 1, 0 | 1] = [1, 1];
  /** Hand am Griff: Weltpunkt, zu dem Luni gerade greift (Tuer, Vorhang). */
  private doorHand: Pt | null = null;
  /** Greifzeit vor einer Durchgangstuer im Weg; -1 = nicht aktiv */
  private doorHandT = -1;
  private doorHandOpen: (() => void) | null = null;
  /** ausstehende Befehle nach der aktuellen Aktion.
   *  force = Rückkehr ohne Prüfung, sonst Spielerbefehl mit Prüfung. */
  private chain: { id: string; force: boolean }[] = [];
  /** Zwischenbilder fuer Flaechen, in denen kein Wetter erscheinen soll. */
  private trockenPuffer = Array.from({ length: 6 }, () => document.createElement("canvas"));
  /** Wetter in beiden Häusern: Echtwetter gespeichert, Testwetter flüchtig. */
  private wetter: WetterState = ladeWetter();
  private wetterAdd: "plus" | "minus" | null = null;
  private wetterOffen = false;
  private wetterHover: WetterTreffer | null = null;
  private wetterT = 0;
  /** Ofentür im Gruselhaus: 0 zu, 1 offen. */
  private ofenOffen = 0;
  /** Ziel der Feuertür und kurze Handanimation am Ofen. */
  private ofenZiel = 0;
  private ofenT = 0;
  /** Beim aktuellen Ofenklick wurde schon Holz nachgelegt (einmal je Klick). */
  private ofenHolz = false;
  /** Hexenkessel: Trank, Überkochen, Löffel – der Ablauf liegt in hexenofen.ts. */
  private kessel = new KesselAblauf();
  /** Holzlager neben dem Ofen: Bestand (0..HOLZ_MAX), Nachfülldauer, Trägt sie ein Scheit? */
  private holz = HOLZ_MAX;
  private holzT = 0;
  /** Oberstes Scheit wackelt kurz, wenn sie den Stapel richtet. */
  private lagerT = 0;
  /** Luni trägt ein Scheit vom Lager zum Ofen. */
  private carryHolz = false;
  /** Birnbaumtruhe: steht alle 10 Minuten auf, geht zur Seite und bleibt dort. */
  private truheModus: "steht" | "auf" | "geht" | "setzt" = "steht";
  private truheT = 0;
  private truheOffset = 0;
  private truheZiel = 0;
  private truheRichtung: 1 | -1 = 1;
  private truheWarte = 600;
  private truheLift = 0;
  private truheGeh = 0;
  /** Kessel-Zauber: Luni zaubert von überall, ohne zum Kessel zu laufen. */
  private zauber: { t: number; treffer: boolean; halteBis: number; ende: number | null } | null = null;
  private zauberWunsch = false;
  /** zuletzt gezeichnete Hände und Kopfposition (für Blitze und Denkblase) */
  private luniHaende: { front: Pt; rear: Pt } | null = null;
  private luniKopf: { x: number; y: number; face: 1 | -1; sichtbar: boolean } | null = null;

  constructor(canvas: HTMLCanvasElement, opts: HouseOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.bgc = this.ctx2(this.bg);
    this.skyc = this.ctx2(this.sky);
    this.mulc = this.ctx2(this.mul);
    this.addc = this.ctx2(this.add);
    this.fixedClock = opts.clock ?? null;
    this.welt = opts.welt ?? "normal";
    if (this.welt === "gruesel") {
      let st = STATIONS;
      if (GRUSELRAEUME.musikzimmer) st = musikzimmerStationen(st);
      if (GRUSELRAEUME.schlafzimmer) st = schlafzimmerStationen(st);
      if (GRUSELRAEUME.badezimmer) st = badezimmerStationen(st);
      // Ofen heißt im Gruselhaus Ofen; der Kessel ist eine eigene Station.
      st = st
        .filter((x) => x.id !== "kessel" && x.id !== "kerzen" && x.id !== "mikrofon")
        .map((x) => (x.id === "herd" ? { ...x, label: "Ofen" } : x));
      st = [...st, baseKessel()];
      if (GRUSELRAEUME.kueche) st = kuechenStationen(st);
      this.stations = st.filter((x) => x.id !== "odin" && x.id !== "apollo");
      if (GRUSELRAEUME.musikzimmer) this.musikzimmer = new MusikzimmerAblauf();
    } else {
      // Eigene Kopien der Hunde-Stationen, damit bewegte Trefferflächen STATIONS nie verändern.
      this.stations = STATIONS.map((s) => (s.id === "odin" || s.id === "apollo" ? { ...s, hits: [...s.hits] } : s));
      if (this.welt === "weihnacht") {
        const buch = WEIHNACHTS_ORTE.buch;
        this.stations = this.stations.map((s) => s.id === "buecher"
          ? { ...s, label: "Buch", x: buch + 12, face: -1, hits: [[buch - 12, FE - 45, 24, 24]] } : s);
      }
      // Ohne Weihnachtsdeko gibt es keinen Kalender, keine Klavierkerzen und keine Weihnachtskiste.
      if (!this.weihnachtsdeko) {
        this.stations = this.stations.filter((x) => x.id !== "adventskalender" && x.id !== "kerzen" && x.id !== "xmaskiste");
      }
    }
    const alt = opts.onTraumhaus;
    this.onWelt = opts.onWelt ?? (alt ? (z) => { if (z === "traum") alt(); } : null);
    this.onUpdate = opts.onUpdate ?? null;
    this.onUfo = opts.onUfo ?? null;
    this.steine = steinSlots(this.welt);
    this.steinStationen = this.steine.map((sl) => ({
      id: `stein_${sl.art}`,
      label: sl.label,
      floor: 0,
      x: sl.x,
      face: 1,
      state: "idle",
      expr: "neutral",
      hits: [sl.hit],
    }));
    // Jede Hauswelt stellt ausschließlich ihren eigenen Zustand wieder her.
    this.wiederherstellen(ladeSnapshot(this.welt));
    this.clock = this.fixedClock ?? berlinNow();
    this.resize();
  }

  private ctx2(cv: HTMLCanvasElement): C {
    const c = cv.getContext("2d");
    if (!c) throw new Error("2d context unavailable");
    return c;
  }

  /* ------------------------------ Lebenszyklus --------------------------- */

  mount() {
    this.canvas.tabIndex = 0;
    this.ro = new ResizeObserver(() => this.resize());
    if (this.canvas.parentElement) this.ro.observe(this.canvas.parentElement);
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("pagehide", this.onPageHide);
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerleave", this.onLeave);
    this.canvas.addEventListener("pointerup", this.onUp);
    this.canvas.addEventListener("pointercancel", this.onUp);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.speichern();
    window.removeEventListener("pagehide", this.onPageHide);
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.stopSax();
    this.saxMusic?.dispose();
    this.saxMusic = null;
    this.saxReady = false;
    this.stopSing();
    this.singMusic?.dispose();
    this.singMusic = null;
    this.singReady = false;
    this.stopPlatten();
    this.plattenMusic?.dispose();
    this.klavierMusik?.dispose();
    this.klavierMusik = null;
    this.tvKlang.tv_e?.dispose();
    this.tvKlang.tv_d?.dispose();
    this.plattenMusic = null;
    this.plattenReady = false;
    this.musikzimmer?.destroy();
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onUp);
  }

  resize = () => {
    const parent = this.canvas.parentElement;
    const cw = parent ? parent.clientWidth : window.innerWidth;
    const ch = parent ? parent.clientHeight : window.innerHeight;
    if (!cw || !ch) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, cw < 700 ? 1.6 : 2);
    this.scale = Math.min(cw / W, ch / H);
    const px = Math.max(1, Math.round(W * this.scale * this.dpr));
    const py = Math.max(1, Math.round(H * this.scale * this.dpr));
    let changed = false;
    if (this.canvas.width !== px || this.canvas.height !== py) {
      this.canvas.width = px;
      this.canvas.height = py;
      changed = true;
    }
    this.canvas.style.width = `${Math.round(W * this.scale)}px`;
    this.canvas.style.height = `${Math.round(H * this.scale)}px`;
    // Zwischenflächen (bg/sky/mul/add) unabhängig vom Haupt-Canvas prüfen.
    // Wird ein zweites House auf demselben Canvas erzeugt (React StrictMode
    // im Dev-Modus baut Komponenten doppelt auf), hat das Haupt-Canvas schon
    // die richtige Größe, die neuen Zwischenflächen aber noch 300x150 –
    // das Haus würde dann als Briefmarke gemalt und auf Vollbild gestreckt.
    for (const cv of [this.bg, this.sky, this.mul, this.add]) {
      if (cv.width !== px || cv.height !== py) {
        cv.width = px;
        cv.height = py;
        changed = true;
      }
    }
    if (changed) this.dirty = true;
  };

  /** Testzugriff: feste Uhrzeit setzen */
  setClock(c: Clock) {
    this.fixedClock = c;
    this.clock = c;
    this.dirty = true;
  }

  /* ------------------------------ Eingabe -------------------------------- */

  private toWorld(e: PointerEvent): Pt {
    const r = this.canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }

  /* ----------------------- Speichern je Hauswelt ------------------------ */

  private schnappschuss(): HausSnapshot {
    return {
      v: 1,
      gespeichert: Date.now(),
      lx: this.lx,
      lf: this.lf,
      lface: this.lface,
      sick: this.sick,
      pack: this.pack,
      cigs: this.cigs,
      cigButt: this.cigButt,
      pyjama: this.pyjama,
      // Ohne Brille im Waschbecken trägt Luni sie (sonst ginge sie verloren).
      glassesOn: this.glassesOn || !this.glassesInSink,
      glassesInSink: this.glassesInSink && !this.glassesOn,
      brushInCab: this.brushInCab,
      gardenDoor: this.gardenDoor >= 0.5 ? 1 : 0,
      cellarDoorV: this.cellarDoorV >= 0.5 ? 1 : 0,
      golOnShelf: this.golOnShelf,
      golInserted: this.golInserted,
      smoke: this.smoke,
      vampir: this.vampirStil,
      vampirLetzt: this.vampirLetzt,
      burnLeft: this.burnLeft,
      burnTotal: this.burnTotal,
      ashButts: this.ashButts,
      bucketButts: this.bucketButts,
      lighterOnTable: this.lightAufTisch,
      kerzenAn: this.kerzenAn,
      tv: this.tvDaten,
      flauschi: this.flauschiState,
      flauschiEingelegt: this.flauschiInserted,
      flauschiOnShelf: this.flauschiOnShelf,
      hunde: this.istNormalHaus ? this.hunde.snapshot() : undefined,
    };
  }

  /** Speichert unter dem Schlüssel DIESER Hauswelt – nie unter einem fremden. */
  speichern() {
    speichereSnapshot(this.welt, this.schnappschuss());
  }

  private wiederherstellen(s: HausSnapshot | null) {
    if (!s) return;
    const lf = clamp(Math.round(s.lf), 0, 3);
    const [a, b] = RANGE[lf];
    this.lf = lf;
    this.lx = clamp(s.lx, a, b);
    this.lface = s.lface === -1 ? -1 : 1;
    this.sick = clamp(s.sick, 0, 1);
    this.pack = clamp(Math.round(s.pack), 0, PACK_MAX);
    this.cigs = clamp(Math.round(s.cigs), 0, PILE_MAX);
    this.cigButt = !!s.cigButt;
    this.pyjama = s.pyjama ?? null;
    this.glassesOn = s.glassesOn;
    this.glassesInSink = s.glassesInSink;
    this.brushInCab = s.brushInCab;
    this.gardenDoor = s.gardenDoor;
    this.gardenWant = s.gardenDoor;
    this.cellarDoorV = s.cellarDoorV;
    this.cellarDoorWant = s.cellarDoorV;
    // Das Spielmodul darf nie verloren gehen: weder im Regal noch in der Konsole
    // heißt, sie trug es gerade – dann liegt es wieder im Regal.
    this.golInserted = s.golInserted;
    this.golOnShelf = s.golOnShelf || !s.golInserted;
    if (this.golInserted) {
      this.tvMode = "gol";
      if (!this.golState) this.golState = createState();
    }
    // Teleflauschi: der Zustand wandert mit, das Modul nie verloren.
    this.flauschiState = leseFlauschiStand(s.flauschi) ?? (this.flauschiWelt ? neuerFlauschiStand() : null);
    this.flauschiInserted = !!s.flauschiEingelegt && this.flauschiWelt;
    this.flauschiOnShelf = s.flauschiOnShelf !== false || !this.flauschiInserted;
    if (this.flauschiInserted && this.flauschiState) {
      this.tvDaten.tv_d.kanal = "flauschi";
      this.tvManual.tv_d = true;
      flauschiTick(this.flauschiState, Date.now());
    }
    this.smoke = clamp(s.smoke, 0, 1);
    this.burnLeft = typeof s.burnLeft === "number" ? Math.max(0, s.burnLeft) : 0;
    this.burnTotal = typeof s.burnTotal === "number" ? Math.max(0, s.burnTotal) : (this.burnLeft > 0 ? Math.max(this.burnLeft, 240) : 0);
    this.ashButts = typeof s.ashButts === "number" ? Math.max(0, Math.round(s.ashButts)) : 0;
    this.bucketButts = typeof s.bucketButts === "number" ? Math.max(0, Math.round(s.bucketButts)) : 0;
    this.lightAufTisch = s.lighterOnTable === true;
    this.kerzenAn = s.kerzenAn !== false;
    this.tvStand = leseTVStand(s.tv);
    if (this.istNormalHaus && s.hunde) this.hunde.wiederherstellen(s.hunde);
    const vi = s.vampir;
    this.vampirStil = typeof vi === "number" && vi >= 0 && vi < VAMPIR_OUTFITS.length ? vi : null;
    this.vampirLetzt = typeof s.vampirLetzt === "number" ? s.vampirLetzt : -1;
    this.dirty = true;
  }

  /** Wechselstein unter dem Zeiger (nur die Steine der eigenen Welt). */
  private steinUnter(x: number, y: number): Station | null {
    const sl = steinAn(this.steine, x, y);
    return sl ? this.steinStationen[this.steine.indexOf(sl)] : null;
  }

  private steinWechsel(st: Station) {
    const sl = this.steine[this.steinStationen.indexOf(st)];
    if (!sl) return;
    sfx.ui();
    this.speichern();
    this.onWelt?.(sl.ziel);
  }

  private pick(x: number, y: number): Station | null {
    let best: Station | null = null;
    let bestArea = Infinity;
    for (const st of this.stations) {
      // Leeres Fach: das Modul ist schon heruntergenommen.
      if (st.id === "gol_game" && !this.golOnShelf) continue;
      // Das Teleflauschi-Modul ist nur im Weihnachtshaus und nur im Regal da.
      if (st.id === "flauschi_modul" && !this.flauschiModulSichtbar) continue;
      // Instrumente sind im Musikzimmer des Gruselhauses entfernt (nur dort).
      if (this.musikzimmer && (st.id === "saxophon" || st.id === "platten" || st.id === "gitarre")) continue;
      // Brille und Bürste sind nur Ziele, wenn sie wirklich da liegen.
      if (st.id === "brille" && !this.glassesInSink) continue;
      if (st.id === "buerste" && !(this.cabinetOpen > 0.9 && this.brushInCab)) continue;
      for (const [rx, ry, rw, rh] of st.hits) {
        if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh && rw * rh < bestArea) {
          best = st;
          bestArea = rw * rh;
        }
      }
    }
    return best;
  }

  /** Freie Klicks auf die Bodenlinie der Etage projizieren, nie ins Freie. */
  private walkTargetAt(x: number, y: number): Station | null {
    for (let floor = 0; floor < FLOOR_Y.length; floor++) {
      const left = floor === 0 ? CEL_X0 : floor === 3 ? DG_X0 : HL;
      const right = floor === 2 ? OG_X1 : HR;
      const top = floor === 3 ? atticCeil(x) : FLOOR_Y[floor + 1] + SLAB;
      if (x >= left && x <= right && y >= top && y <= FLOOR_Y[floor] + 6) {
        return {
          id: "laufziel", label: "", floor,
          x: clamp(x, RANGE[floor][0], RANGE[floor][1]),
          face: x < this.lx ? -1 : 1,
          state: "idle", expr: "happy", hits: [],
        };
      }
    }
    return null;
  }

  private onDown = (e: PointerEvent) => {
    this.stationFokus = null;
    sfx.ensure();
    const [x, y] = this.toWorld(e);
    // UFO oben rechts: Overlay mit den Patch-Dateien der aktuellen Sitzung
    if (this.ufoOffen) {
      const z = ufoZeileBei(x, y, PATCH_EINTRAEGE.length);
      if (z >= 0) {
        this.ufoOffen = false;
        sfx.ui();
        this.onUfo?.(PATCH_EINTRAEGE[z]);
        return;
      }
      this.ufoOffen = false;
      this.dirty = false;
      if (!ufoTreffer(x, y)) return;
      sfx.ui();
      return;
    }
    if (ufoTreffer(x, y)) {
      // Ein Klick aufs UFO bzw. den Weihnachtsmann lädt direkt das Archiv mit
      // allen Patch-Dateien herunter; es gibt kein Menü und keine Einzeldateien mehr.
      this.onUfo?.(PATCH_ZIP);
      sfx.ui();
      return;
    }
    // Wetterstation: reine GUI, klickbar ohne Lunis Weg (auch im normalen Haus).
    const wt = wetterStationHit(wetterStationLayout(this.wetter, this.wetterAdd, this.wetterOffen, this.istNormalHaus), x, y);
    if (wt?.befehl) {
      this.wetterBefehl(wt.befehl);
      sfx.ui();
      return;
    }
    if (this.tvZoom) {
      this.onTvFullscreenClick(x, y);
      return;
    }
    if (this.adventFullscreen) {
      this.adventKlick(x, y);
      return;
    }
    // Klick auf eines der beiden TV-Geräte öffnet immer die große TV-Darstellung.
    if (this.hitAtticTv(x, y)) {
      this.openTvZoom("tv_d");
      return;
    }
    if (this.hitLivingTv(x, y)) {
      this.openTvZoom("tv_e");
      return;
    }
    // Ausnahme von der Ankunftslogik: Die Wechselsteine sind ein GUI fuer den
    // Spieler und schalten sofort um – in allen Hauswelten, ohne Lunis Weg.
    const stein = this.steinUnter(x, y);
    if (stein) {
      this.steinWechsel(stein);
      return;
    }
    const st = this.pick(x, y);
    if (st) {
      // Über command() laufen, damit Tür-, Rauch- und WC-Logik greifen
      this.command(st.id);
      this.hover = st;
      return;
    }
    const target = this.walkTargetAt(x, y);
    if (target) this.command(target);
    this.hover = null;
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    this.stationFokus = null;
    const [x, y] = this.toWorld(e);
    if (this.adventFullscreen) {
      this.hover = null;
      if (this.adventZoomT >= 0.9) {
        this.adventHover = adventTuerBei(this.adventTuerLayout(), x, y);
        if (this.adventHover >= 0) this.adventFokus = this.adventHover;
        const b = ADVENT_ZURUECK;
        const aufKnopf = x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
        this.canvas.style.cursor = this.adventHover >= 0 || aufKnopf ? "pointer" : "default";
      }
      return;
    }
    if (this.tvZoom) {
      this.hover = null;
      this.ufoHover = false;
      const inBox = (b: { x: number; y: number; w: number; h: number }) =>
        x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
      const back = this.tvZoom === "tv_e" ? TV_BACK_E
        : (this.golFullscreen ? GOL_BTN : this.flauschiFullscreen ? FLAUSCHI_ZURUECK : TV_BACK_D);
      const pwr = this.tvZoom === "tv_e" ? TV_PWR_E : TV_PWR_D;
      const onCtrl = this.golFullscreen && !!golCtrlAt(x, y);
      const kn = this.flauschiFullscreen ? flauschiKnopfBei(x, y) : null;
      this.flauschiHover = kn?.id ?? null;
      // Flauschi selbst ist anklickbar: oben streicheln, unten kitzeln.
      const zone = this.flauschiFullscreen && !kn ? flauschiZoneBei(x, y, this.flauschiOffen(), this.flauschiState ?? undefined) : null;
      this.flauschiZoneHover = zone?.id ?? null;
      const v = this.golFullscreen && this.golState ? golView(this.golState) : null;
      const onGrid = !!v && x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h;
      this.tvFernHover = tvFernTreffer(x, y);
      this.canvas.style.cursor = this.tvFernHover || inBox(back) || inBox(pwr) || onCtrl || onGrid || kn || zone ? "pointer" : "default";
      return;
    }
    this.ufoZeile = this.ufoOffen ? ufoZeileBei(x, y, PATCH_EINTRAEGE.length) : -1;
    this.ufoHover = ufoTreffer(x, y);
    const ufoAktiv = this.ufoHover || this.ufoZeile >= 0;
    if (ufoAktiv) {
      this.hover = null;
      this.wetterHover = null;
      this.canvas.style.cursor = "pointer";
      return;
    }
    this.hover = this.steinUnter(x, y) ?? this.pick(x, y);
    this.wetterHover = wetterStationHit(wetterStationLayout(this.wetter, this.wetterAdd, this.wetterOffen, this.istNormalHaus), x, y);
    const onTv = this.hitAtticTv(x, y) || this.hitLivingTv(x, y);
    this.canvas.style.cursor = this.wetterHover || this.hover || onTv
      ? "pointer" : this.walkTargetAt(x, y) ? "crosshair" : "default";
  };

  /** Loslassen beendet das lange Kraulen. */
  private onUp = () => {
    this.flauschiHaelt = false;
  };

  private onLeave = () => {
    this.hover = null;
    this.tvFernHover = null;
    this.flauschiHover = null;
    this.flauschiZoneHover = null;
    this.flauschiHaelt = false;
    this.wetterHover = null;
    this.ufoHover = false;
    this.canvas.style.cursor = "default";
  };

  /**
   * Befehl an Luni. Mit Zigarette in der Hand darf sie den Raum verlassen;
   * nur wer aktiv raucht und die Gartentür öffnen will, legt vorher ab.
   * Die Schleusentür bedient sie mit Zigarette in der Hand.
   */
  command(request: LuniCommand) {
    const id = typeof request === "string" ? request : request.id;
    const find = (k: string) => this.stations.find((s) => s.id === k) ?? null;
    if (id === "mikrofon" && !this.istNormalHaus) return;
    if (id === "laufziel" && (this.bedPhase || this.sleepPhase)) return;
    if (id === "adventskalender" && (!this.istNormalHaus || !this.weihnachtsdeko)) return;
    if ((id === "odin" || id === "apollo") && !this.istNormalHaus) return;
    // Laufendes Streicheln oder Hunde-Zuruf sauber beenden, wenn etwas anderes gewünscht ist
    if (this.petHund && id !== this.petHund) {
      this.hunde.beendeStreicheln(this.petHund);
      this.petHund = null;
      this.petT = 0;
    }
    if (this.rufHund && id !== this.rufHund && id !== "hund_ruf") {
      this.rufHund = null;
      this.rufT = 0;
    }
    if (this.handy) {
      if (id === "raucherstuhl") return;
      this.handyDanach = request;
      this.handy.vorBefehlEinstecken();
      return;
    }
    if (this.lightT !== null) {
      if (id !== "aschenbecher") this.lightNext = request;
      return;
    }
    // Jeder andere Befehl beendet einen laufenden oder wartenden Zauber.
    if (id !== "kessel") {
      this.zauberWunsch = false;
      this.zauberBeenden();
    }
    // Datenkoffer (Osterei): jeder andere Wunsch lässt den Deckel zufallen.
    if (id !== "datenkoffer" && (this.kofferPhase === "offen" || this.kofferPhase === "oeffnen")) {
      this.kofferPhase = "schliessen";
      this.kofferT = 0;
    }
    if (this.musikzimmer) {
      this.musikzimmer.unlock();
      if (id === "klavier") {
        if (this.musikzimmer.occupied) { this.pianoRefusal = .9; return; }
        if (this.activity?.id === "klavier" && this.pianoRise === 0) return;
        this.musikzimmer.requestPiano();
      }
      if (this.pianoRise > 0) { this.pianoAfter = request; return; }
      if (this.activity?.id === "klavier" && id !== "klavier") {
        this.leaveMusicPiano(false, request);
        return;
      }
      this.pianoEscape = false;
      this.pianoEscapeMoving = false;
      if (["saxophon", "platten", "mikrofon"].includes(id)) this.musikzimmer.otherMusicRequested();
    }

    // Läuft „Paulchen“, beendet jede andere Anweisung die Musik sofort.
    if (this.saxPhase) {
      if (id === "saxophon") return;
      this.stopSax();
    }
    // Läuft der Plattenspieler, beendet jede andere Anweisung die Wiedergabe sauber.
    if (this.plattenPhase) {
      if (id === "platten") return;
      this.stopPlatten();
    }
    // Sie singt gerade: jede andere Anweisung beendet den Gesang sauber.
    if (this.singPhase) {
      if (id === "mikrofon") return;
      this.stopSing();
    }
    // Schon beim Klick die Tonpuffer berechnen: dann ist die Musik am Mund bereit.
    if (id === "saxophon") this.prepareSax();
    if (id === "platten") this.preparePlatten();
    if (id === "mikrofon") this.prepareSing();

    // Duschen: hinter dem Vorhang wird nichts unterbrochen. Auf dem Weg
    // dorthin bricht ein anderer Wunsch den Ablauf ab.
    if (this.shPhase && (SH_LOCKED.includes(this.shPhase) ||
      (this.gruselBad && this.shPhase === "toShower"))) return;
    if (this.shPhase) this.cancelShower();
    if (this.bedEinstieg && id !== "bett") {
      this.bedEinstieg = null;
      this.bedEinstiegT = 0;
      this.bedPhase = null;
    }
    if (id === "dusche") {
      if (this.gruselBad && this.asleep) {
        this.sargAufwachen(request);
        return;
      }
      if (this.asleep) {
        // Im normalen Haus erst sichtbar aufstehen, dann beginnt die Folge –
        // sonst liefen Umziehen und Duschen „hinter ihrem Rücken“ durch.
        this.aufwachen();
        this.wakeNext = request;
        return;
      }
      this.chain = [];
      this.smokeRequested = false;
      this.startSh(this.outfit === "towel" ? "toSink" : "toWardrobe");
      return;
    }
    // Gruselhaus, Raum 03: der Ablauf am Sarg ist nicht unterbrechbar. Nur auf
    // dem Weg zum Sarg bricht ein anderer Wunsch ab; nach dem Aufwachen wird
    // der zuletzt gewünschte Befehl gemerkt und danach ausgeführt.
    if (this.sargPhase) {
      if (this.sargPhase === "zumSarg" && id !== "bett") this.sargAbbrechen();
      else {
        if (this.sargWacht() && id !== "bett") this.nachAufwachen = request;
        return;
      }
    }
    // Schläft sie, ändert ein Klick aufs Bett bzw. den Sarg nichts.
    if (id === "bett" && this.asleep) return;
    if (this.asleep) {
      // Jede andere Aktion weckt sie.
      if (this.gruselSarg) {
        this.sargAufwachen(request);
        return;
      }
      this.aufwachen();
    }
    if (this.lieDown && id !== "bett") {
      this.lieDown = false;
    }
    if (id === "bett" && this.gruselSarg) {
      // Gruselhaus: ein Klick auf den Sarg startet die Schlafroutine immer.
      this.chain = [];
      this.startBedRoutine();
      return;
    }
    if (id === "bett") {
      // Spielerwunsch: zu jeder Tageszeit, ohne Umziehen, in der aktuellen Kleidung.
      this.startBedEinstieg();
      return;
    }
    if (id === "brille" && this.glassesInSink) {
      this.chain = [];
      this.startSh("gToSink");
      return;
    }
    if (id === "buerste" && this.brushInCab && this.cabinetOpen > 0.9) {
      this.chain = [];
      this.startSh("bToCab");
      return;
    }
    if (id === "spiegelschrank") {
      this.chain = [];
      this.startSh(this.cabinetOpen > 0.5 ? "kToCab" : "cToCab");
      return;
    }
    if (id === "kleiderschrank" && this.outfit !== "dressed") {
      this.chain = [];
      this.startSh("dToWardrobe");
      return;
    }

    // Einsetzen zu Ende bringen; ein anderer Wunsch bricht das Holen ab
    // und legt das Modul zurück ins Regal, falls es noch nicht steckt.
    if (this.golPhase === "insert" || this.golPhase === "press") return;
    if ((this.golPhase === "reach" || this.golPhase === "carry") && id !== "gol_game") this.cancelGolFetch();
    // Dasselbe für das Teleflauschi-Modul: ein anderer Wunsch bricht das Holen ab.
    if (this.flauschiPhase === "insert") return;
    if ((this.flauschiPhase === "reach" || this.flauschiPhase === "carry") && id !== "flauschi_modul") this.cancelFlauschiFetch();
    if (this.flauschiPhase === "watch" && id !== "flauschi_modul") {
      this.flauschiPhase = null;
      this.flauschiAnimT = 0;
    }
    if (
      (this.golPhase === "rise" || this.golPhase === "toButton" || this.golPhase === "back" || this.golPhase === "watch") &&
      id !== "gol_game"
    ) {
      this.golPhase = null;
      this.golAnimT = 0;
    }

    // Sitzt sie gemütlich auf dem Stuhl, steht sie erst sichtbar auf,
    // bevor der Befehl ausgeführt wird. (Klick auf denselben Stuhl ändert
    // nichts – sie bleibt sitzen.)
    if (this.standing) {
      this.standNext = request;
      return;
    }
    if (
      this.activity?.id === "raucherstuhl" &&
      id !== "raucherstuhl" &&
      !this.standing &&
      !this.ashMove
    ) {
      this.standing = true;
      this.standT = 0;
      this.standNext = request;
      return;
    }

    // Läuft gerade die Armbewegung zum Aschenbecher, wird der neue Befehl
    // danach ausgeführt – sonst würde die Hand mitten in der Luft abbrechen.
    if (this.ashMove) {
      if (id === "aussentuer") this.gardenTarget = this.gardenWant > 0.5 ? 0 : 1;
      if (this.ashMove === "put" || this.ashMove === "quench") {
        this.ashNext = request;
        return;
      }
      if (id === "raucherstuhl") return; // bereits auf dem Weg dorthin
      if (this.ashWalking) {
        // Sie war erst auf dem Weg zum Tisch, hat also noch nichts in der
        // Hand – direkt umdrehen, ohne leere Ablege-Geste.
        this.ashMove = null;
        this.ashWalking = false;
        this.ashT = 0;
        this.ashNext = null;
        // weiter unten normalen Befehl ausführen
      } else {
        // Mitten in der Greif-Bewegung: fertig greifen, gleich wieder
        // ablegen, dann den neuen Befehl ausführen.
        this.ashNext = request;
        return;
      }
    }

    if (this.emptyT > 0 && id !== "eimer") {
      this.emptyT = 0;
    }

    // Liegt eine Zigarette (brennend ODER ausgegangen) auf dem Rand des
    // Aschenbechers und Luni verlässt den Raucherraum, drückt sie sie erst aus.
    // Bloßes Öffnen einer Tür zählt nicht als Verlassen.
    if (
      this.cigButt && !this.smoking && !this.ashMove &&
      id !== "aschenbecher" && id !== "raucherstuhl" && id !== "eimer" &&
      this.verlaesstRaucherraum(request)
    ) {
      this.smokeRequested = false;
      this.chain = [];
      this.ashNext = request;
      this.startAsh("quench");
      return;
    }

    // Ascheneimer: erst Zigarette auf dem Rand / in der Hand ausdrücken, dann leeren.
    if (id === "eimer") {
      if (this.activity?.id === "eimer" && this.emptyT > 0) return;
      this.chain = [];
      this.smokeRequested = false;
      if (this.cigButt || this.smoking || this.holding) {
        this.ashNext = "eimer";
        this.startAsh("quench");
        return;
      }
      const st = find("eimer");
      if (st) this.goTo(st);
      return;
    }

    // Gartentür: jederzeit bedienbar, auch mitten in einer anderen Aktion.
    // Wer aktiv raucht, legt die Zigarette erst sichtbar in den Aschenbecher.
    // Wer sie nur in der Hand trägt, nimmt sie mit hinaus.
    if (id === "aussentuer") {
      this.gardenTarget = this.gardenWant > 0.5 ? 0 : 1;
      this.chain = [];
      this.smokeRequested = false;
      if (this.smoking) {
        this.putCigarette("aussentuer");
        return;
      }
      const gst = find("aussentuer");
      if (gst) this.goTo(this.gardenWant > 0.5 ? { ...gst, x: 800 } : gst);
      return;
    }

    // Mit Zigarette in der Hand darf sie den Raum verlassen – kein
    // automatisches Ablegen bei anderen Anweisungen.

    if (id === "zimmertuer") {
      // Luni geht erst zur Tuer; das Oeffnen/Schliessen folgt bei Ankunft.
      this.chain = [];
      this.smokeRequested = false;
      this.doorIntent = { id: "zimmertuer", want: this.cellarDoorV > 0.5 ? 0 : 1 };
      this.goTo(this.doorStand());
      return;
    }

    // Truhe: Sie steht selbst auf und geht ein Stück – Luni bleibt, wo sie ist.
    if (id === "truhe" && this.welt === "gruesel" && GRUSELRAEUME.kueche) {
      if (this.truheModus === "steht") {
        this.truheZiel = this.truheOffset < 8 ? 16 : 0;
        this.truheRichtung = this.truheZiel > this.truheOffset ? 1 : -1;
        this.truheModus = "auf"; this.truheT = 0; this.truheWarte = 0;
      }
      return;
    }

    // Holzlager: Luni geht hin und richtet den Stapel. Hängt ein Ofenbefehl
    // in der Kette, holt sie dort ein Scheit und trägt es zum Ofen.
    if (id === "holzlager" && this.welt === "gruesel" && GRUSELRAEUME.kueche) {
      this.chain = [];
      this.smokeRequested = false;
      const st = find("holzlager");
      if (st) this.pending = st;
      return;
    }

    // Hexenkessel: Luni zaubert von überall – sie muss nicht in die Nähe.
    if (id === "kessel") {
      this.chain = [];
      this.smokeRequested = false;
      if (this.welt === "gruesel" && GRUSELRAEUME.kueche) this.zauberAnfordern();
      return;
    }
    // Ofen: Luni geht hin und öffnet oder schließt die Feuertür. Ist Holz im
    // Lager und kocht nichts, holt sie erst sichtbar ein Scheit ab (Kette).
    if (id === "herd" && this.gruselBad) {
      this.chain = [];
      this.smokeRequested = false;
      this.ofenZiel = this.ofenOffen > .5 ? 0 : 1;
      this.ofenT = 0;
      this.ofenHolz = false;
      const lagerBereit = this.welt === "gruesel" && GRUSELRAEUME.kueche
        && this.holz > 0 && this.kessel.phase === "ruhig";
      if (lagerBereit) {
        this.chain = [{ id: "herd", force: true }];
        const kl = find("holzlager");
        if (kl) { this.pending = kl; return; }
      }
      const st = find("herd");
      if (st) this.pending = st;
      return;
    }

    if (id === "musiktuer") {
      const links = this.lf === 3 ? this.lx < 528 : true;
      this.doorIntent = { id: "musiktuer", want: this.musikDoor > 0.5 ? 0 : 1 };
      this.chain = [];
      this.smokeRequested = false;
      this.goTo({
        id: "musiktuer",
        label: "Verbindungstür",
        floor: 3,
        x: links ? (this.musikDoor > 0.5 ? 538 : 512) : 548,
        face: links ? 1 : -1,
        state: "idle",
        expr: "neutral",
        hits: [],
      });
      return;
    }

    if (id === "wctuer") {
      // Tür auf, hinein, Tür zu – oder wieder heraus
      this.wcTarget = this.wcInside ? 0 : 1;
      this.smokeRequested = false;
      const st = find("wctuer");
      if (st) this.pending = st;
      return;
    }
    if (id === "bio_wc" && this.gruselBad) {
      this.chain = [];
      this.smokeRequested = false;
      const wc = find(id);
      if (wc) this.pending = wc;
      return;
    }

    // ---- Stuhl: nur sitzen und Handy ----
    if (id === "raucherstuhl") {
      const seat = find("raucherstuhl");
      // Sie raucht gerade? Zigarette erst weglegen, dann gemütlich sitzen.
      if (this.smoking || this.holding) {
        this.smokeRequested = false;
        this.ashNext = "raucherstuhl";
        this.startAsh("put");
        return;
      }
      this.smokeRequested = false;
      this.sitIdleT = 0;
      this.chain = [];
      this.pending = seat;
      return;
    }

    // ---- Aschenbecher: jetzt wird geraucht ----
    if (id === "aschenbecher") {
      this.smokeRequested = true;
      if (this.holding || this.smoking) {
        // Sie hat schon eine in der Hand (stehend oder sitzend): in den
        // Aschenbecher legen – danach setzt sie sich hin.
        this.smokeRequested = false;
        this.ashNext = "raucherstuhl";
        this.startAsh("put");
        return;
      }
      // 1. Liegt noch eine brennende Zigarette auf dem Rand, nimmt sie diese.
      if (this.cigButt && this.burnLeft > 0) {
        this.startAsh("take");
        return;
      }
      // Ausgegangene Zigarette auf dem Rand: erst ausdrücken (Haufen wächst), dann neu rauchen.
      if (this.cigButt) {
        this.ashNext = "aschenbecher";
        this.startAsh("quench");
        return;
      }
      if (this.pack <= 0 && this.cigs <= 0) {
        // gar nichts da: erst stopfen gehen
        this.tabakMode = "roll";
        this.chain = [{ id: "aschenbecher", force: false }];
        const tin = find("tabak");
        if (tin) this.pending = tin;
        return;
      }
      if (this.pack <= 0 && this.cigs > 0) {
        // Schachtel leer, aber auf dem Küchentisch liegen welche: eine
        // mitnehmen, danach noch im Keller am Tischchen abholen (force=false).
        this.tabakMode = "take";
        this.chain = [{ id: "aschenbecher", force: false }];
        const tin = find("tabak");
        if (tin) this.pending = tin;
        return;
      }
      if (this.pack > 0) {
        // Erst am Stuhl nimmt sie sich eine neue Zigarette.
        const seat = find("raucherstuhl");
        if (seat) this.pending = seat;
        return;
      }
      // Nur noch lose Zigaretten am Tisch: eine nehmen (Animation)
      this.tabakMode = "take";
      this.chain = [{ id: "aschenbecher", force: false }];
      const tin = find("tabak");
      if (tin) this.pending = tin;
      return;
    }

    // ---- Odin & Apollo: im Garten zurückrufen, im Haus hingehen und streicheln ----
    if ((id === "odin" || id === "apollo") && this.istNormalHaus) {
      this.chain = [];
      this.smokeRequested = false;
      if (this.hunde.istImGarten(id)) {
        this.rufHund = id;
        this.rufT = 0;
        this.pending = {
          id: "hund_ruf", label: "", floor: 0, x: 804, face: 1,
          state: "wave", expr: "happy", hits: [],
        };
        return;
      }
      const h = this.hunde.get(id);
      this.hunde.erwarteStreicheln(id, this.lx);
      this.petHund = id;
      this.petT = 0;
      const [minX, maxX] = RANGE[h.floor];
      const linksPlatz = h.x - 27 >= minX + 4;
      const standX = clamp(linksPlatz ? h.x - 27 : h.x + 27, minX, maxX);
      const blick: 1 | -1 = standX <= h.x ? 1 : -1;
      const st = find(id);
      if (st) {
        st.floor = h.floor;
        st.x = standX;
        st.face = blick;
        this.pending = st;
      }
      return;
    }

    // Wer von Hand zum Stopfen geschickt wird, stopft auch (statt mitzunehmen)
    if (id === "tabak") this.tabakMode = "roll";


    // Spiel des Lebens: aus dem Regal holen, zur Konsole tragen, einstecken.
    if (id === "gol_game") {
      if (this.golPhase || !this.golOnShelf) return;
      this.smokeRequested = false;
      this.golPhase = "reach";
      this.golAnimT = 0;
      this.goTo("gol_game");
      return;
    }

    // Teleflauschi: aus dem Regal holen, zur Konsole tragen, einstecken.
    if (id === "flauschi_modul") {
      if (this.flauschiPhase || !this.flauschiModulSichtbar) return;
      this.smokeRequested = false;
      this.flauschiPhase = "reach";
      this.flauschiAnimT = 0;
      this.goTo("flauschi_modul");
      return;
    }

    // Datenkoffer (Osterei): Luni geht hin, öffnet den Koffer, und die
    // Oberfläche zeigt den Stand-Übertragungsdialog. Ein zweiter Klick auf
    // den Koffer lässt den Deckel wieder zufallen.
    if (id === "datenkoffer") {
      if (this.kofferPhase === "schliessen") return;
      if (this.kofferPhase === "offen") {
        this.kofferPhase = "schliessen";
        this.kofferT = 0;
        return;
      }
      this.smokeRequested = false;
      const kf = find("datenkoffer");
      if (kf) this.pending = kf;
      return;
    }

    // Neutrale Ziele beenden einen offenen Rauchwunsch, damit sie später
    // nicht überraschend von selbst zu rauchen beginnt.
    this.smokeRequested = false;
    const st = typeof request === "string" ? find(id) : request;
    if (st) {
      if (id === "gol_tv" && !this.flauschiPhase) {
        this.golPhase = "toButton";
        this.golAnimT = 0;
      }
      if (id === "laufziel") {
        this.chain = [];
        this.packMove = false;
        this.takeMove = false;
        this.doorIntent = null;
        if (this.doorHandT < 0) this.doorHand = null;
      }
      if (this.musikzimmer && id === "klavier") this.chain = [];
      this.pending = st;
    }
  }

  /**
   * Luni öffnet die Schleusentür immer von der Seite, auf der sie steht:
   * links davon (Krempelraum) oder rechts (Rauchzimmer).
   */
  private doorStand(): Station {
    const st = STATIONS.find((s) => s.id === "zimmertuer");
    const left = this.lf === 0 ? this.lx < 590 : true;
    const schliessen = this.cellarDoorV > 0.5;
    // Das Blatt schwingt nach rechts: Zum Schliessen von links steht sie im Durchgang.
    return {
      ...(st as Station),
      x: left ? (schliessen ? 600 : 574) : 610,
      face: left ? 1 : -1,
    };
  }

  /** Brenndauer einer frischen Zigarette: 3,5 bis 5 Minuten */
  private newBurn() {
    return 210 + Math.random() * 90;
  }

  /** Frische Zigarette: Gesamtbrenndauer merken, damit die Asche wachsen kann. */
  private freshBurn() {
    this.burnTotal = this.newBurn();
    return this.burnTotal;
  }

  private neueZigarette() {
    this.pack -= 1;
    this.holding = true;
    this.burnLeft = 0;
    this.burnTotal = 0;
  }

  private updateAnzuenden(vorher: number, dt: number) {
    const t = vorher + dt;
    this.lightT = t;
    if (vorher < ZUENDEN.tischGriff && t >= ZUENDEN.tischGriff) this.lightAufTisch = false;
    if (vorher < 0 && t >= 0) this.neueZigarette();
    if (vorher < ZUENDEN.glimmt && t >= ZUENDEN.glimmt) {
      this.burnLeft = this.freshBurn();
      this.lightAblegen = Math.random() < FEUERZEUG_TISCH_CHANCE;
      sfx.ui();
    }
    if (vorher < ZUENDEN.ablage && t >= ZUENDEN.ablage) this.lightAufTisch = this.lightAblegen;
    if (t >= ZUENDEN.ende) {
      this.lightT = null;
      this.smoking = true;
      this.smokeIdleT = 0;
      this.sitIdleT = Math.min(0, this.sitIdleT);
      const next = this.lightNext;
      this.lightNext = null;
      if (next) this.command(next);
    }
  }

  /** 1 = frisch angezündet, 0 = abgebrannt. */
  private burnFrac() {
    if (this.burnLeft > 0 && this.burnTotal <= 0) this.burnTotal = Math.max(this.burnLeft, 240);
    return this.burnTotal > 0 ? clamp(this.burnLeft / this.burnTotal, 0, 1) : 0;
  }

  /** Befehl ohne Prüfung (Kette) */
  private assign(id: string) {
    const st = this.stations.find((s) => s.id === id);
    if (st) this.pending = st;
  }

  /** Nur Weg setzen, ohne Prüfungen (für Ketten und erzwungene Schritte) */
  private goTo(id: string | Station) {
    const st = typeof id === "string" ? this.stations.find((s) => s.id === id) : id;
    if (!st) return;
    this.target = st;
    this.activity = null;
    this.cur = null;
    this.path = [];
    this.doorHand = null;
    this.doorHandT = -1;
    this.doorHandOpen = null;
    this.buildPath(st.floor, st.x);
  }

  /**
   * Zigarette sichtbar ablegen: Der Arm fährt zum Aschenbecher, erst danach
   * geht Luni weiter. `next` wird nach der Bewegung ausgeführt.
   */
  private putCigarette(next: LuniCommand | null) {
    this.ashNext = next;
    this.startAsh("put");
  }

  /** Dauer der Armbewegung; Ausdrücken braucht etwas mehr Zeit. */
  private ashDur() {
    return this.ashMove === "quench" ? 1.7 : 0.95;
  }

  /** 0..1: wie weit der Arm am Aschenbecher ist (Griff, Druck, Ablage). */
  private ashReichweite(): number {
    const p = clamp(this.ashT / this.ashDur(), 0, 1);
    if (this.ashMove === "quench") return weich(p / 0.45) * (1 - weich((p - 0.78) / 0.22));
    const wechsel = this.ashMove === "take" ? 0.25 : 0.8;
    return p < wechsel ? weich(p / wechsel) : 1 - weich((p - wechsel) / (1 - wechsel));
  }

  /** Verlässt Luni mit diesem Befehl wirklich den Raucherraum? */
  private verlaesstRaucherraum(request: LuniCommand): boolean {
    if (this.lf !== 0 || this.lx < 590) return false;
    const id = typeof request === "string" ? request : request.id;
    // Türen öffnen/schließen heißt nicht, den Raum zu verlassen.
    if (id === "zimmertuer" || id === "aussentuer") return false;
    const st = typeof request === "string" ? this.stations.find((s) => s.id === request) : request;
    return !!st && (st.floor !== 0 || st.x < 590);
  }

  private startAsh(kind: "put" | "take" | "quench", amStuhl = false) {
    // Sitzt sie schon am Stuhl, bleibt die Haltung sitzend; sonst greift sie stehend.
    this.ashSitzend = amStuhl || (this.activity?.id === "raucherstuhl" && !this.standing);
    this.ashMove = kind;
    this.ashAmStuhl = amStuhl;
    this.ashT = 0;
    this.smoking = false;
    if (amStuhl) {
      this.ashWalking = false;
      return;
    }
    this.pending = null;
    this.activity = null;
    this.target = null;
    if (this.lf !== 0 || Math.abs(this.lx - ASH_STAND_X) > 3) {
      // Erst sichtbar zum Stuhl laufen. Die Sitz-/Greifpose beginnt erst
      // nach der Ankunft; dadurch gibt es weder Teleport noch Doppel-Luni.
      this.ashWalking = true;
      this.cur = null;
      this.buildPath(0, ASH_STAND_X);
    } else {
      // Sie sitzt bereits am Stuhl; der Beistelltisch ist in Armreichweite.
      this.ashWalking = false;
    }
  }

  private wcTarget: 0 | 1 | null = null;
  private smoking = false;

  /** Testzugriffe */
  getSmoke() {
    return this.smoke;
  }
  getGardenDoor() {
    return this.gardenDoor;
  }
  getCigs() {
    return this.cigs;
  }
  getCigButt() {
    return this.cigButt;
  }
  getSmoking() {
    return this.smoking;
  }
  getWcOpen() {
    return this.wcOpen;
  }
  getWcInside() {
    return this.wcInside;
  }
  /** Snapshot for diagnostics/tests: per-field growth and current visitor. */
  getHarvestState() {
    return {
      crops: [...this.harvestCrops],
      spot: this.harvestSpot,
      moving: this.harvestMoving,
      coins: this.harvestCoins,
      clock: this.harvestClock,
    };
  }
  /** Zigaretten setzen (Tests) */
  setCigs(n: number) {
    this.cigs = n;
  }
  /** Inhalt der Zigarettenschachtel */
  getPack() {
    return this.pack;
  }
  setPack(n: number) {
    this.pack = n;
  }
  /** Hat sie das Handy sichtbar in der Hand? */
  getOnPhone() {
    return this.handy?.pose?.sichtbar === true;
  }
  getPhoneMode() {
    return this.handy?.pose?.modus ?? "scroll";
  }
  /** Zuletzt gezeichnete Pose (für Diagnose/Tests) */
  lastPose = "";
  /** 0 = fit, 1 = stark angeschlagen */
  getSick() {
    return this.sick;
  }
  setSick(v: number) {
    this.sick = clamp(v, 0, 1);
  }
  /** Öffnungswinkel der Zimmertür im Keller (0..1) */
  getCellarDoor() {
    return this.cellarDoorV;
  }
  /** Rauchmenge, die in den Krempelraum gezogen ist */
  getSmokeSpill() {
    return this.smokeSpill;
  }
  /** läuft gerade ein Rauchstoß? */
  getSmokeGust() {
    return this.smokeGust;
  }
  getVentGust() {
    return this.ventGust;
  }
  /** Restbrennzeit der aktuellen Zigarette in Sekunden */
  getBurnLeft() {
    return this.burnLeft;
  }
  setBurnLeft(v: number) {
    this.burnLeft = Math.max(0, v);
  }
  /** Wie lange eine frische Zigarette brennt (Sekunden) */
  freshBurnTime() {
    return this.newBurn();
  }
  /** Hat sie gerade eine Zigarette in der Hand? */
  getHolding() {
    return this.holding;
  }
  /** Rauch erzwingen (Tests) */
  setSmoke(v: number) {
    this.smoke = clamp(v, 0, 1);
  }

  /* ------------------------------ Hauptschleife -------------------------- */

  private frame = (ts: number) => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
    const roomDt = Math.max(0, (ts - this.last) / 1000);
    const dt = Math.min(0.05, roomDt);
    this.last = ts;
    this.update(dt, roomDt, true);
    this.draw();
  };

  /** Für Tests: einen Schritt simulieren, ohne zu zeichnen */
  step(dt: number) {
    this.update(dt);
  }

  private update(dt: number, roomDt = dt, live = false) {
    this.elapsed += dt;
    this.updateTVAudio();
    this.updateHarvest(dt);
    if (this.welt === "gruesel" && GRUSELRAEUME.kueche) {
      this.kessel.update(dt);
      this.updateZauber(dt);
      // lagerT ist während der Lageraktivität der Fortschritt, danach Wackeln.
      if (this.lagerT > 0 && this.activity?.id !== "holzlager") this.lagerT = Math.max(0, this.lagerT - dt);
      // Birnbaumtruhe: alle zehn Minuten aufstehen, ein Stück gehen, dort
      // bleiben und beim nächsten Mal zurück. Beine erst beim Aufstehen sichtbar.
      if (this.truheModus === "steht") {
        this.truheWarte += dt;
        if (this.truheWarte >= 600) {
          this.truheZiel = this.truheOffset < 8 ? 16 : 0;
          this.truheRichtung = this.truheZiel > this.truheOffset ? 1 : -1;
          this.truheModus = "auf"; this.truheT = 0; this.truheWarte = 0;
        }
      } else if (this.truheModus === "auf") {
        this.truheT += dt;
        this.truheLift = Math.min(1, this.truheT / 1.8);
        if (this.truheT >= 2.0) { this.truheModus = "geht"; this.truheT = 0; }
      } else if (this.truheModus === "geht") {
        this.truheT += dt;
        const d = this.truheZiel - this.truheOffset;
        const step = 6 * dt;
        if (Math.abs(d) <= step) { this.truheOffset = this.truheZiel; this.truheModus = "setzt"; this.truheT = 0; }
        else this.truheOffset += Math.sign(d) * step;
        this.truheLift = 1;
        this.truheGeh = this.truheT;
      } else {
        this.truheT += dt;
        this.truheLift = Math.max(0, 1 - this.truheT / 1.6);
        if (this.truheT >= 1.8) { this.truheLift = 0; this.truheModus = "steht"; this.truheT = 0; this.truheGeh = 0; }
      }
      // Der Stapel füllt sich in Echtzeit langsam wieder – ganz ohne Klick.
      if (this.holz < HOLZ_MAX) {
        this.holzT += dt;
        if (this.holzT >= HOLZ_REFILL_SEK) { this.holzT = 0; this.holz++; }
      }
    }
    this.wetterT += dt;
    if (this.wetterT >= 1) {
      this.wetterT = 0;
      this.wetter = tickWetter(this.wetter);
    }
    if (this.gruselBad) {
      this.bioFlash = Math.max(0, this.bioFlash - dt / .28);
      this.bioPanelPress = Math.max(0, this.bioPanelPress - dt * 2.5);
      this.bioWcGlow = Math.max(0, this.bioWcGlow - dt / 1.5);
      const mistOn = this.bioInside && this.bioDoor < .1 && this.water;
      this.bioMist += ((mistOn ? 1 : 0) - this.bioMist) * (1 - Math.exp(-(mistOn ? 3.5 : 1.1) * dt));
    }

    this.clockT += dt;
    if (this.clockT > 1 || this.bucket < 0) {
      this.clockT = 0;
      this.clock = this.fixedClock ?? berlinNow();
      const b = Math.floor((this.clock.hour * 60 + this.clock.min) / 5);
      if (b !== this.bucket) {
        this.bucket = b;
        this.dirty = true;
      }
    }

    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blinkT = 2 + Math.random() * 3.5;
      this.blink = 0.14;
    }
    this.blink = Math.max(0, this.blink - dt);

    this.wcOpen += (this.wcWant - this.wcOpen) * (1 - Math.exp(-8 * dt));
    if (Math.abs(this.wcOpen - this.wcOpenFinal) > 0.01) {
      this.wcOpenFinal = this.wcOpen;
      this.dirty = true;
    }
    this.doorOpen += ((this.doorWant ? 1 : 0) - this.doorOpen) * (1 - Math.exp(-9 * dt));
    this.musikDoor += (this.musikDoorWant - this.musikDoor) * (1 - Math.exp(-9 * dt));
    for (const i of [0, 1] as const) this.vorhang[i] += (this.vorhangWant[i] - this.vorhang[i]) * (1 - Math.exp(-5 * dt));
    const gd = Math.round(this.gardenDoor * 40) / 40;
    if (gd !== this.gardenRendered) {
      this.gardenRendered = gd;
      this.dirty = true;
    }
    // gleichmäßige, gut sichtbare Drehung (~1,2 s für den ganzen Weg)
    const doorStep = dt / 1.2;
    const doorDiff = this.gardenWant - this.gardenDoor;
    this.gardenDoor += Math.abs(doorDiff) <= doorStep ? doorDiff : Math.sign(doorDiff) * doorStep;
    if (!this.updateMusikzimmer(dt, roomDt, live)) this.updateLuni(dt);
    this.updateActions(dt);
  }

  private leaveMusicPiano(frightened: boolean, next: LuniCommand | null = null) {
    this.musikzimmer?.stopLuni();
    this.pianoRise = .42;
    this.pianoRiseFrom = this.pianoSeat;
    this.pianoAfter = next;
    this.pianoEscape = frightened;
    this.pianoEscapeMoving = false;
    this.activity = null;
    this.target = null;
    this.pending = null;
    this.path = [];
    this.cur = null;
  }

  /** Nur das Musikzimmer steuert diese Reaktion; andere Routinen bleiben frei. */
  private updateMusikzimmer(dt: number, roomDt: number, live: boolean): boolean {
    const music = this.musikzimmer;
    if (!music) return false;
    music.setPaused(document.visibilityState === "hidden");
    this.pianoRefusal = Math.max(0, this.pianoRefusal - dt);
    const musical = (s: Station | null) => !!s && ["saxophon", "platten", "mikrofon"].includes(s.id);
    const approachingPiano = this.pending?.id === "klavier" || (this.target?.id === "klavier" && this.activity?.id !== "klavier");
    const busy = musical(this.activity) || musical(this.target) || musical(this.pending) || !!this.saxPhase || !!this.plattenPhase || this.asleep || approachingPiano;
    const appearing = music.update(roomDt, busy, live);
    if (appearing && this.activity?.id === "klavier") this.leaveMusicPiano(true);
    if (this.pianoRise > 0) {
      this.pianoRise = Math.max(0, this.pianoRise - dt);
      this.pianoSeat = this.pianoRiseFrom * this.pianoRise / .42;
      if (this.pianoRise === 0 && this.pianoAfter) {
        const next = this.pianoAfter;
        this.pianoAfter = null;
        this.command(next);
      }
      return true;
    }
    if (this.pianoEscape && this.lf === 3 && !this.pending && !this.target) {
      if (!music.active) { this.pianoEscape = false; this.pianoEscapeMoving = false; return false; }
      const distance = 33 + 36 * Math.min(1, music.alpha / .95);
      const goal = MUSIKZIMMER.klavier.sitz + distance;
      const speed = music.age < 2 ? 30 : 9;
      const move = Math.min(Math.max(0, goal - this.lx), speed * dt);
      this.lx += move;
      this.lface = -1;
      this.pianoEscapeMoving = move > .001;
      if (move) this.advanceWalk(move);
      return true;
    }
    if (this.activity?.id === "klavier") this.pianoSeat = Math.min(1, this.pianoSeat + dt / .45);
    else if (music.luniPlaying) music.stopLuni();
    return false;
  }

  /* ---------------------------- Kessel-Zauber ---------------------------- */

  /** Klick auf den Kessel: Luni zaubert dort, wo sie gerade steht. */
  private zauberAnfordern() {
    const z = this.zauber;
    if (z && z.ende === null) {
      // Sie zaubert schon: der Zauber hält länger, der Löffel rührt weiter.
      if (z.treffer) {
        z.halteBis = Math.max(z.halteBis, z.t + ZAUBER_ZEIT.halten);
        this.kessel.ruehren();
      }
      return;
    }
    this.zauberWunsch = true;
    this.pending = null;
    this.target = null;
    this.activity = null;
    this.path = [];
  }

  private zauberBeenden() {
    const z = this.zauber;
    if (z && z.ende === null) z.ende = z.t;
  }

  /** 0..1: wie weit die Arme ausgestreckt sind. */
  private zauberStaerke(): number {
    const z = this.zauber;
    if (!z) return 0;
    const ab = z.ende === null ? 1 : Math.max(0, 1 - (z.t - z.ende) / ZAUBER_ZEIT.senken);
    const e = (k: number) => k * k * (3 - 2 * k);
    return e(Math.min(1, z.t / ZAUBER_ZEIT.arme)) * e(ab);
  }

  /** 0..1: wie weit die Blitze schon gewachsen sind (1 = am Löffel). */
  private blitzLaenge(): number {
    const z = this.zauber;
    if (!z) return 0;
    const ab = z.ende === null ? 1 : Math.max(0, 1 - (z.t - z.ende) / ZAUBER_ZEIT.senken);
    return clamp((z.t - ZAUBER_ZEIT.arme) / ZAUBER_ZEIT.blitz, 0, 1) * ab;
  }

  private updateZauber(dt: number) {
    const schlaeft = this.asleep || !!this.sleepPhase || this.lieDown || !!this.sargPhase || this.wcInside;
    if (this.zauberWunsch && !this.zauber) {
      if (schlaeft) {
        this.zauberWunsch = false;
      } else if (!this.cur || this.cur.step.k === "walk") {
        // Ein Laufschritt endet sofort; auf einer Treppe wartet sie bis zum Ende.
        this.zauberWunsch = false;
        this.pending = null;
        this.target = null;
        this.activity = null;
        this.path = [];
        this.cur = null;
        this.doorHand = null;
        this.doorHandT = -1;
        this.doorHandOpen = null;
        this.doorIntent = null;
        this.handy = null;
        this.handyDanach = null;
        this.packMove = false;
        this.takeMove = false;
        const kx: number = OFEN.kessel.x;
        this.lface = this.lx < kx - 1 ? 1 : this.lx > kx + 1 ? -1 : this.lface;
        this.zauber = { t: 0, treffer: false, halteBis: 0, ende: null };
      }
      return;
    }
    const z = this.zauber;
    if (!z) return;
    z.t += dt;
    if (z.ende === null && schlaeft) z.ende = z.t;
    if (!z.treffer && z.t >= ZAUBER_ZEIT.arme + ZAUBER_ZEIT.blitz) {
      z.treffer = true;
      z.halteBis = z.t + ZAUBER_ZEIT.halten;
      this.kessel.ruehren();
    }
    if (z.treffer && z.ende === null && z.t >= z.halteBis) z.ende = z.t;
    if (z.ende !== null && z.t >= z.ende + ZAUBER_ZEIT.senken) this.zauber = null;
  }

  private updateHarvest(dt: number) {
    this.harvestClock += dt;

    if (this.harvestMoving) {
      this.harvestMoveT += dt / 1.8;
      if (this.harvestMoveT >= 1) {
        this.harvestSpot = this.harvestTo;
        this.harvestMoving = false;
        this.harvestMoveT = 0;
        this.harvestWorkT = 0;
        this.harvestRipeT = 0;
      }
      return;
    }

    // Only the field Luni is standing at changes while she tends it.
    const growth = this.harvestCrops[this.harvestSpot];
    if (growth < 1) {
      this.harvestCrops[this.harvestSpot] = Math.min(1, growth + dt * 0.035);
      this.harvestRipeT = 0;
    } else {
      this.harvestRipeT += dt;
      if (this.harvestRipeT >= 2.8) {
        this.harvestCrops[this.harvestSpot] = 0;
        this.harvestCoins += 5;
        this.harvestRipeT = 0;
      }
    }

    this.harvestWorkT += dt;
    if (this.harvestWorkT >= 8) {
      this.harvestFrom = this.harvestSpot;
      this.harvestTo = (this.harvestSpot + 1) % this.harvestCrops.length;
      this.harvestMoving = true;
      this.harvestMoveT = 0;
    }
  }

  /** Raucherecke, Zigaretten drehen, Tür aufmachen, Befehlskette */
  private updateActions(dt: number) {
    const act = this.activity;

    // Odin & Apollo leben ununterbrochen im normalen Haus – unabhängig von Lunis Aktion.
    if (this.istNormalHaus) {
      const hour = this.clock.hour + this.clock.min / 60;
      const schlecht = ["regen", "sturm", "gewitter", "schnee", "hagel"].includes(this.wetter.art);
      this.hunde.update(dt, {
        hour,
        luniFloor: this.lf,
        luniX: this.lx,
        luniSchlaeft: this.asleep || !!this.sleepPhase || this.lieDown,
        gardenDoor: this.gardenDoor,
        gardenWant: this.gardenWant,
        cellarDoor: this.cellarDoorV,
        smoke: this.smoke,
        schlechtesWetter: schlecht,
        onWuff: (tief) => sfx.wuff(tief),
      });
      for (const hid of ["odin", "apollo"] as const) {
        const st = this.stations.find((s) => s.id === hid);
        if (st) st.hits = [this.hunde.hitBox(hid)];
      }
    }
    // Andere direkte Wege (z. B. zum Fernseher) können den Stuhl verlassen.
    if (this.lightT !== null && act?.id !== "raucherstuhl") {
      this.lightT = null;
      this.lightNext = null;
      if (this.holding && this.burnLeft <= 0) {
        this.holding = false;
        this.pack = Math.min(PACK_MAX, this.pack + 1);
      }
    }
    if (act?.id !== "raucherstuhl") {
      this.handy = null;
      this.handyDanach = null;
      this.sitIdleT = 0;
    }

    // --- Datenkoffer (Osterei): Deckel auf, Antenne aus, dann melden ---
    if (this.kofferPhase) {
      this.kofferT += dt;
      if (this.kofferPhase === "oeffnen") {
        const t = Math.min(1, this.kofferT / 0.8);
        this.kofferDeckel = t * t * (3 - 2 * t);
        this.kofferAntenne = Math.max(0, Math.min(1, (this.kofferT - 0.2) / 0.6));
        if (t >= 1) {
          this.kofferPhase = "offen";
          this.kofferT = 0;
          if (!this.kofferGemeldet) {
            this.kofferGemeldet = true;
            this.onUpdate?.();
          }
        }
      } else if (this.kofferPhase === "schliessen") {
        const t = Math.min(1, this.kofferT / 0.5);
        const e = t * t * (3 - 2 * t);
        this.kofferDeckel = 1 - e;
        this.kofferAntenne = Math.max(0, 1 - e);
        if (t >= 1) {
          this.kofferPhase = null;
          this.kofferT = 0;
          this.kofferGemeldet = false;
        }
      }
    }

    // Gartentür frisch geöffnet und Rauch im Keller -> Abzugsstoß nach
    // draußen: Die Schwaden ziehen sichtbar durch den Türspalt in den Garten.
    if (
      this.prevGardenDoor < 0.4 &&
      this.gardenDoor >= 0.4 &&
      this.smoke + this.smokeSpill > 0.4 &&
      this.ventGust <= 0
    ) {
      this.ventGust = this.ventMax;
    }
    this.prevGardenDoor = this.gardenDoor;
    if (this.ventGust > 0) this.ventGust = Math.max(0, this.ventGust - dt);

    // Rauch: füllt den Raum langsam, aber stetig. Die Zigarette qualmt auch
    // im Aschenbecher weiter – nur langsamer. Offene Außentür lüftet.
    const glowing = (this.holding || this.cigButt) && this.burnLeft > 0;
    if (this.gardenDoor > 0.5) {
      this.smoke = clamp(this.smoke - dt * 0.4, 0, 1);
    } else if (glowing) {
      // Kräftig genug, um sichtbar zu füllen: ununterbrochenes Rauchen
      // braucht rund 45 Sekunden bis zur vollen Dichte (mit Pausen länger);
      // die abgelegte Zigarette qualmt mit gut der Hälfte weiter und füllt
      // den Raum in etwa 77 Sekunden, solange sie glüht.
      this.smoke = clamp(this.smoke + dt * (this.smoking ? 0.022 : 0.013), 0, 1);
    } else {
      this.smoke = clamp(this.smoke - dt * 0.02, 0, 1);
    }

    if (this.quenchPuff > 0) this.quenchPuff = Math.max(0, this.quenchPuff - dt);

    // --- Zigarette brennt ab (auch im Aschenbecher) ---
    if ((this.holding || this.cigButt) && this.burnLeft > 0) {
      this.burnLeft = Math.max(0, this.burnLeft - dt);
      if (this.burnLeft === 0 && this.holding && !this.ashMove) {
        // fertig geraucht: den Stummel im Aschenbecher ausdrücken
        this.smoking = false;
        this.startAsh("quench", act?.id === "raucherstuhl" && this.handy !== null);
      }
    }

    // --- Schleusentür: beide Räume gleichen ihre Dichte an ---
    const doorAjar = this.cellarDoorV;
    if (doorAjar > 0.2) {
      // Symmetrischer Austausch: dieselbe Menge verlässt einen Raum und
      // kommt im anderen an. Dadurch kann der linke Raum den rechten nicht
      // mehr überholen; beide nähern sich derselben Dichte.
      const diff = this.smoke - this.smokeSpill;
      const exchange = diff * 0.16 * doorAjar * dt;
      this.smoke = clamp(this.smoke - exchange, 0, 1);
      this.smokeSpill = clamp(this.smokeSpill + exchange, 0, 1);
      // Ohne aktive Rauchquelle verflüchtigt sich der Dunst in beiden
      // verbundenen Räumen gleich schnell. So bleibt links nichts länger
      // stehen, während rechts bereits klar wird.
      if (!glowing) this.smokeSpill = clamp(this.smokeSpill - dt * 0.02, 0, 1);
    } else if (doorAjar < 0.12) {
      // Tür zu: der Rauch im Krempelraum verzieht sich langsam
      this.smokeSpill = clamp(this.smokeSpill - dt * 0.035, 0, 1);
    }
    // Offene Außentür zieht auch den Rauch aus dem Nebenraum ab
    if (this.gardenDoor > 0.5) this.smokeSpill = clamp(this.smokeSpill - dt * 0.25, 0, 1);

    // Voller Raum + Tür öffnet sich -> kräftiger Rauchstoß nach draußen
    if (this.prevCellarDoor < 0.4 && doorAjar >= 0.4 && this.smoke > 0.7 && this.smokeGust <= 0) {
      this.smokeGust = this.gustMax;
      // der erste Schwung verlässt den Raum sofort sichtbar
      const firstPuff = Math.min(this.smoke, 0.06);
      this.smoke = clamp(this.smoke - firstPuff, 0, 1);
      this.smokeSpill = clamp(this.smokeSpill + firstPuff, 0, 1);
    }
    this.prevCellarDoor = doorAjar;
    if (this.smokeGust > 0) {
      this.smokeGust = Math.max(0, this.smokeGust - dt);
      // Während des Stoßes fliegt dieselbe Menge in den Nebenraum.
      const gustMoved = Math.min(this.smoke, dt * 0.05);
      this.smoke = clamp(this.smoke - gustMoved, 0, 1);
      this.smokeSpill = clamp(this.smokeSpill + gustMoved, 0, 1);
    }

    // Rauchvergiftung: im verqualmten Keller wird ihr übel. Frische Luft
    // durch die offene Tür und ein Gesundheitstee bringen sie wieder hoch.
    // Im Krempelraum zählt der Rauch, der dorthin gezogen ist.
    const exposure = this.lf === 0 ? (this.lx > 590 ? this.smoke : this.smokeSpill) : 0;
    if (this.lf === 0 && exposure > 0.5) {
      this.sick = clamp(this.sick + dt * 0.075 * (exposure - 0.5) * 2, 0, 1);
    } else if (this.lf === 0 && this.gardenDoor > 0.5) {
      this.sick = clamp(this.sick - dt * 0.03, 0, 1);
    } else if (act?.id !== "tee") {
      this.sick = clamp(this.sick - dt * 0.01, 0, 1);
    }

    // Walk-First: Verbrennungs-WC erst am Hebel auslösen, nie aus der Ferne.
    if (this.gruselBad && act?.id === "bio_wc") {
      this.bioWcTime += dt;
      this.doorHand = this.bioWcTime < 1.2 ? [BIO_BAD.wc.hebel[0], BIO_BAD.wc.hebel[1]] : null;
      if (!this.bioWcTriggered && this.bioWcTime >= .45) {
        this.bioWcTriggered = true;
        this.bioWcGlow = 1;
        sfx.ui();
      }
      if (this.bioWcTime >= 2) {
        this.doorHand = null;
        this.finishActivity();
      }
      return;
    }

    // Holzlager: Sie richtet kurz. Hängt ein Ofenbefehl in der Kette,
    // nimmt sie ein Scheit mit und trägt es weiter zum Ofen.
    if (act?.id === "holzlager") {
      this.lagerT += dt;
      if (this.lagerT >= 1.1) {
        this.lagerT = 0;
        if (this.chain.some((step) => step.id === "herd") && this.holz > 0) {
          this.holz--;
          this.carryHolz = true;
        }
        sfx.ui();
        // Fortschritt abgeschlossen: kurzes Wackeln des obersten Scheit.
        this.lagerT = 0.6;
        this.finishActivity();
      }
      return;
    }

    // Ofen: Feuertür sichtbar öffnen oder schließen, dann fertig.
    if (this.gruselBad && act?.id === "herd") {
      this.ofenT += dt;
      this.ofenOffen += (this.ofenZiel - this.ofenOffen) * (1 - Math.exp(-7 * dt));
      // Frisches Holz im Ofen: heute genügt dafür der Ofenklick. Später ruft
      // das echte Nachlegen (nach dem Herunterbrennen) dieselbe Methode auf.
      if (!this.ofenHolz && this.ofenT >= 0.5) {
        this.ofenHolz = true;
        // Nur getragenes Holz lässt den Trank steigen. Ein Klick ohne Holz
        // oder bei laufendem Trank startet kein Überkochen.
        if (this.carryHolz) this.kessel.holzNachgelegt();
      }
      if (this.carryHolz && this.ofenT >= 0.9) this.carryHolz = false;
      if (this.ofenT >= 1.4) {
        this.ofenOffen = this.ofenZiel;
        this.finishActivity();
      }
      return;
    }

    // Gesundheitstee in der Küche: Kanne holen, einschenken, trinken.
    if (act?.id !== "tee" && this.teaT > 0) {
      // Abgebrochen: Kanne und Tasse stehen sofort wieder auf der Zeile.
      this.teaT = 0;
      this.teaSetzeZeile(false, false, 0);
    }
    if (act?.id === "tee") {
      const vorher = teeSchluck(this.teaT).getrunken;
      this.teaT += dt;
      const t = this.teaT;
      const teeX = teeStandX(t);
      this.walkP += Math.abs(teeX - this.lx) * 0.31;
      this.lx = teeX;
      const getrunken = teeSchluck(t).getrunken;
      this.teaSetzeZeile(t >= 1.1 && t < 4.4, t >= 0.4 && t < TEE_ABGESETZT, teeFuellstand(t, getrunken));
      if (getrunken > vorher) this.sick = clamp(this.sick - 1.1 * (getrunken - vorher), 0, 1);
      if (t >= TEA_DAUER) {
        this.teaT = 0;
        this.teaSetzeZeile(false, false, 0);
        this.finishActivity();
      }
      return;
    }

    // Aschenbecher in den Eimer unter dem Tisch leeren
    if (act?.id !== "eimer" && this.emptyT > 0) this.emptyT = 0;
    if (act?.id === "eimer") {
      const before = this.emptyT;
      this.emptyT += dt;
      if (before < 1.25 && this.emptyT >= 1.25) {
        if (this.ashButts > 0) {
          this.bucketButts += this.ashButts;
          this.ashButts = 0;
        }
        sfx.ui();
      }
      if (this.emptyT >= 2.6) {
        this.emptyT = 0;
        this.finishActivity();
      }
      return;
    }

    // Tür zum Rauchzimmer: weich auf- und zuschwingen
    // Die Schleusentür bleibt in ihrem Zustand, bis der Spieler sie bedient.
    this.cellarDoorV += (this.cellarDoorWant - this.cellarDoorV) * (1 - Math.exp(-9 * dt));

    this.handy?.tick(dt);
    // Armbewegung zum Aschenbecher (ablegen / aufnehmen)
    if (this.ashMove) {
      // erst zum Tischchen laufen, dann erst die Armbewegung
      if (this.ashWalking) {
        if (!this.cur && this.path.length === 0) {
          this.ashWalking = false;
          this.ashT = 0;
          this.lface = 1;
        }
        return;
      }
      const DUR = this.ashDur();
      this.ashT += dt;

      // Ausdrücken: vom Rand nehmen (falls dort) und fest in den Aschenbecher drücken.
      if (this.ashMove === "quench") {
        if (this.ashT >= DUR * 0.45 && this.cigButt) {
          this.cigButt = false;
          this.holding = true;
        }
        if (this.ashT >= DUR * 0.78 && this.holding) {
          const warAn = this.burnLeft > 0;
          this.holding = false;
          this.cigButt = false;
          this.burnLeft = 0;
          this.burnTotal = 0;
          this.smoking = false;
          this.ashButts += 1;
          if (warAn) this.quenchPuff = 1.1;
          sfx.ui();
        }
        if (this.ashT >= DUR) {
          this.ashMove = null;
          this.ashT = 0;
          if (this.ashAmStuhl) {
            this.ashAmStuhl = false;
            return;
          }
          this.activity = null;
          this.target = null;
          const next = this.ashNext;
          this.ashNext = null;
          if (next) this.command(next);
        }
        return;
      }

      if (this.ashMove === "put") {
        // Stummel erscheint, wenn die Hand den Becher erreicht
        if (this.ashT >= DUR * 0.8) {
          this.cigButt = true;
          this.holding = false;
        }
        if (this.ashT >= DUR) {
          this.ashMove = null;
          this.ashT = 0;
          if (this.ashAmStuhl) {
            this.ashAmStuhl = false;
            return;
          }
          this.activity = null;
          this.target = null;
          const next = this.ashNext;
          this.ashNext = null;
          if (next) this.command(next);
        }
      } else {
        // aufnehmen: Stummel verschwindet, sobald die Hand zugreift
        if (this.ashT >= DUR * 0.25 && this.cigButt) {
          this.cigButt = false;
          this.holding = true;
        }
        if (this.ashT >= DUR) {
          this.ashMove = null;
          this.ashT = 0;
          if (this.ashAmStuhl) {
            this.ashAmStuhl = false;
            if (this.holding && this.burnLeft <= 0) this.startAsh("quench", true);
            else this.smokeIdleT = 0;
            return;
          }
          // zurück auf den Stuhl zum Weiterrauchen
          this.smokeRequested = true;
          const next = this.ashNext;
          this.ashNext = null;
          if (this.holding && this.burnLeft <= 0) {
            this.ashNext = next ?? "aschenbecher";
            this.startAsh("quench");
            return;
          }
          if (next && next !== "raucherstuhl") {
            // Während des Aufnehmens kam ein anderer Befehl: gleich wieder
            // ablegen und dann dorthin.
            if (this.holding) this.putCigarette(next);
            else this.command(next);
            return;
          }
          // Sie sitzt bereits am Stuhl: Aktivität direkt setzen. Kein neuer
          // Mini-Weg zum selben x, sonst startet für einen Frame die Laufpose
          // und die Beine bewegen sich unnötig.
          const seat = STATIONS.find((s) => s.id === "raucherstuhl");
          if (seat) {
            const alreadySeated =
              this.lf === seat.floor && Math.abs(this.lx - seat.x) <= 3;
            if (alreadySeated) {
              this.activity = seat;
              this.target = seat;
              this.pending = null;
              this.cur = null;
              this.path = [];
              this.lface = seat.face;
            } else {
              this.pending = seat;
            }
          }
        }
      }
      return;
    }

    if (act?.id === "wctuer") {
      this.wcT += dt;
      if (this.wcT >= 0.45 && this.wcTarget !== null) {
        this.wcWant = this.wcTarget;
        if (this.wcTarget === 1) this.wcInside = true;
        this.wcTarget = null;
        sfx.ui();
      }
      if (this.wcInside) {
        if (this.wcT >= 5.5) {
          this.wcWant = 0;
          this.wcInside = false;
        }
        if (this.wcT >= 7.2) this.finishActivity();
        return;
      }
      if (this.wcT >= 2.2) this.finishActivity();
      return;
    }

    if (act?.id === "zimmertuer" || act?.id === "musiktuer") {
      this.doorT += dt;
      // Die Hand liegt am Knauf und folgt ihm, waehrend das Blatt schwingt.
      this.doorHand = this.doorT < 1.3 ? (act.id === "zimmertuer" ? this.cellarKnob() : this.musikKnob()) : null;
      if (this.doorT >= 0.5 && !this.doorActed) {
        this.doorActed = true;
        const ziel = this.doorIntent?.id === act.id ? this.doorIntent.want : null;
        if (act.id === "zimmertuer") this.cellarDoorWant = ziel ?? (this.cellarDoorWant > 0.5 ? 0 : 1);
        else this.musikDoorWant = ziel ?? (this.musikDoorWant > 0.5 ? 0 : 1);
        this.doorIntent = null;
        sfx.ui();
      }
      if (this.doorT >= 1.6) {
        this.doorHand = null;
        this.finishActivity();
      }
      return;
    }

    // Vorhaenge im Musikzimmer: hingehen, greifen, ziehen (auf/zu).
    if (act?.id === "vorhang_links" || act?.id === "vorhang_rechts") {
      const i: 0 | 1 = act.id === "vorhang_links" ? 0 : 1;
      this.doorT += dt;
      this.doorHand = this.doorT < 1.3 ? vorhangGriff(i, this.vorhang[i]) : null;
      if (this.doorT >= 0.5 && !this.doorActed) {
        this.doorActed = true;
        this.vorhangWant[i] = this.vorhangWant[i] ? 0 : 1;
        sfx.ui();
      }
      if (this.doorT >= 1.6) {
        this.doorHand = null;
        this.finishActivity();
      }
      return;
    }

    if (act?.id === "aussentuer") {
      this.doorT += dt;
      // Hand am Knauf; erst der Griff bewegt das Blatt
      this.doorHand = this.doorT < 1.3 ? this.gardenKnob() : null;
      if (this.doorT >= 0.5 && this.gardenTarget !== null) {
        this.gardenWant = this.gardenTarget;
        this.gardenTarget = null;
        sfx.ui();
      }
      if (this.doorT >= 1.6) {
        this.doorHand = null;
        this.finishActivity();
      }
      return;
    }

    this.adventAktualisieren(dt);
    if (act?.id !== "adventskalender") this.adventWarteT = 0;
    if (act?.id === "adventskalender") {
      // Der Kalender hängt im normalen Haus und im Weihnachtshaus an der Wohnzimmerwand.
      if (!this.istNormalHaus) {
        this.finishActivity();
        return;
      }
      this.adventWarteT += dt;
      if (this.adventWarteT >= 0.45 && !this.adventFullscreen && !this.adventSchliessen) this.adventAuf();
      return;
    }

    // Odin & Apollo: Streicheln & Zuruf bei Ankunft
    if (this.istNormalHaus) {
      if (act?.id === "hund_ruf" && this.rufHund) {
        const vorher = this.rufT;
        this.rufT += dt;
        if (this.gardenWant < 0.5) this.gardenWant = 1;
        if (vorher < 0.35 && this.rufT >= 0.35 && this.gardenDoor > 0.55) {
          sfx.ui();
          this.hunde.rufeZurueck(this.rufHund);
        } else if (this.rufT >= 0.35 && this.gardenDoor > 0.55 && this.hunde.istImGarten(this.rufHund)) {
          this.hunde.rufeZurueck(this.rufHund);
        }
        const gerufener = this.hunde.get(this.rufHund);
        const drinnen = !this.hunde.istImGarten(this.rufHund) && gerufener.schritte.length === 0;
        if (drinnen && this.rufT >= 1.0) {
          const ziel = this.rufHund;
          this.rufHund = null;
          this.rufT = 0;
          this.activity = null;
          this.target = null;
          this.command(ziel);
        } else if (this.rufT >= 10) {
          this.rufHund = null;
          this.rufT = 0;
          this.finishActivity();
        }
        return;
      }
      if ((act?.id === "odin" || act?.id === "apollo") && this.petHund === act.id) {
        const vorher = this.petT;
        this.petT += dt;
        if (vorher === 0) {
          this.hunde.starteStreicheln(act.id, this.lx, (tief) => sfx.wuff(tief));
        }
        if (this.petT >= 3.8) {
          this.hunde.beendeStreicheln(act.id);
          this.petHund = null;
          this.petT = 0;
          this.finishActivity();
        }
        return;
      }
    }

    if (act?.id === "kerzen") {
      // Luni streckt sich zu den Kerzen, schaltet sie um und tritt zurück.
      if (!this.kerzenLauft) {
        this.kerzenLauft = true;
        this.kerzenT = 0;
        this.kerzenGeschaltet = false;
      }
      this.kerzenT += dt;
      if (!this.kerzenGeschaltet && this.kerzenT >= 0.9) {
        this.kerzenGeschaltet = true;
        this.kerzenAn = !this.kerzenAn;
        sfx.ui();
      }
      if (this.kerzenT >= 1.8) {
        this.kerzenLauft = false;
        this.kerzenT = 0;
        this.finishActivity();
      }
      return;
    }
    if (act?.id === "tabak") {
      // Eine einzelne Zigarette vom Tisch mitnehmen (Schachtel ist leer)
      if (this.takeMove) {
        const before = this.takeT;
        this.takeT += dt;
        // genau einmal auslösen, wenn die Hand den Stapel erreicht
        if (before < 0.5 && this.takeT >= 0.5 && this.cigs > 0) {
          this.cigs -= 1;
          this.pack += 1; // wandert in die Schachtel/Hand
        }
        if (this.takeT >= 0.9) {
          this.takeMove = false;
          this.takeT = 0;
          this.tabakMode = "roll";
          sfx.ui();
          this.finishActivity();
        }
        return;
      }
      if (this.tabakMode === "take") {
        this.takeMove = true;
        this.takeT = 0;
        return;
      }

      // Stapel voll: Zigaretten in die Schachtel packen
      if (this.packMove) {
        const before = this.packT;
        this.packT += dt;
        // genau einmal umfüllen, sobald die Hand die Schachtel erreicht
        if (before < 0.55 && this.packT >= 0.55 && this.cigs > 0 && this.pack < PACK_MAX) {
          const moved = Math.min(this.cigs, PACK_MAX - this.pack);
          this.pack += moved;
          this.cigs -= moved;
          sfx.ui();
        }
        if (this.packT >= 1.1) {
          this.packMove = false;
          this.packT = 0;
          if (this.pack >= PACK_MAX) this.finishActivity(); // Schachtel voll
        }
        return;
      }

      this.rollT += dt;
      if (this.rollT >= 1.35) {
        this.rollT -= 1.35;
        if (this.chain.length && this.pack <= 0 && this.cigs <= 0 && this.smokeRequested) {
          // Nur eine Zigarette für sich selbst stopfen: sie wandert direkt in
          // die Hand und geht mit nach unten – nichts bleibt auf dem Küchentisch liegen.
          this.pack = 1;
          sfx.ui();
          this.finishActivity();
          return;
        }
        this.cigs = Math.min(PILE_MAX, this.cigs + 1 + ((Math.random() * 3) | 0));
        sfx.ui();
        // Stapel voll und noch Platz in der Schachtel -> einpacken
        if (this.cigs >= PILE_MAX && this.pack < PACK_MAX) {
          this.packMove = true;
          this.packT = 0;
          return;
        }
        // Nach der ersten Runde weiterdrehen, außer es wartet ein Befehl
        if (this.chain.length) this.finishActivity();
      }
      return;
    }

    // ---- Aufstehen vom Stuhl (Animation) ----
    if (this.standing) {
      this.standT += dt / 0.5;
      if (this.standT >= 1) {
        this.standing = false;
        this.standT = 1;
        this.activity = null;
        this.target = null;
        const next = this.standNext;
        this.standNext = null;
        if (next) this.command(next);
      }
      return;
    }

    if (act?.id === "raucherstuhl") {
      this.updateRaucherstuhl(dt);
      return;
    }
    this.smoking = false;
    this.smokeIdleT = 0;

    // Kette abarbeiten, sobald Luni wirklich bereit ist. `this.target` darf
    // nicht gesetzt sein – sonst würde der nächste Befehl die gerade
    // anlaufende Aktion überschreiben und sich endlos wiederholen.
    if (
      this.chain.length &&
      !this.activity &&
      !this.pending &&
      !this.target &&
      !this.cur &&
      this.path.length === 0
    ) {
      this.runChain();
    }

    this.updateGolCarry(dt);
    this.updateFlauschiCarry(dt);
    this.updateFlauschi(dt);
    this.updateShower(dt);
    this.updateBedEinstieg(dt);
    this.updateBedToss(dt);
    this.updateBedState(dt);
    this.updateWake(dt);
    this.updateSarg(dt);
    this.updateSax(dt);
    this.updateSing(dt);
    this.updatePlatten(dt);
    this.updateKlavier(dt);
    if (this.welt === "gruesel") this.raumFx.update(dt);
    // Alle paar Sekunden sichern, damit ein Absturz nichts kostet.
    this.saveT += dt;
    if (this.saveT >= 4) {
      this.saveT = 0;
      this.speichern();
    }
    if (this.golInserted && this.golState?.running) this.updateGOL(dt);
  }

  private updateRaucherstuhl(dt: number) {
    if (this.lightT !== null) {
      this.updateAnzuenden(this.lightT, dt);
      return;
    }

    const hand = this.handy;
    if (hand?.fertig) {
      this.handy = null;
      const next = this.handyDanach;
      this.handyDanach = null;
      this.sitIdleT = -6;
      if (next) this.command(next);
      return;
    }

    if (hand) {
      this.smoking = this.smokeRequested && this.holding && this.burnLeft > 0;
      if (this.smoking) this.smokeIdleT += dt;
      if (hand.kippeAblegen && this.smoking && smokeCycle(this.smokeIdleT).lift < 0.1) {
        hand.kippeAbgelegt(7 + 18 * Math.random());
        this.startAsh("put", true);
      } else if (hand.kippeNehmen) {
        hand.kippeGenommen();
        if (this.smokeRequested && this.cigButt && this.burnLeft > 0) this.startAsh("take", true);
      }
      return;
    }

    this.sitIdleT += dt;
    if (this.smokeRequested) {
      // Eine noch glimmende Zigarette wird weitergeraucht, eine kalte erst ausgedrueckt.
      if (!this.holding && this.cigButt) {
        if (this.burnLeft > 0) this.startAsh("take", true);
        else this.startAsh("quench", true);
        return;
      }
      if (!this.holding) {
        if (this.pack > 0) {
          this.smoking = false;
          this.lightT = this.lightAufTisch ? ZUENDEN.holen : 0;
          if (this.lightT === 0) this.neueZigarette();
        } else if (this.cigs > 0) {
          this.chain = [{ id: "aschenbecher", force: false }];
          this.tabakMode = "take";
          this.assign("tabak");
        } else {
          this.finishActivity();
        }
        return;
      }
      this.smoking = this.burnLeft > 0;
      this.smokeIdleT += dt;
    } else {
      this.smoking = false;
      this.smokeIdleT = 0;
    }

    if (this.sitIdleT >= (this.smokeRequested ? 20 : 1.2)) {
      this.sitIdleT = 0;
      this.handy = new HandyAblauf();
    }
  }

  /** Aktuelle Aktion beenden und den nächsten Befehl der Kette starten */
  private finishActivity() {
    this.activity = null;
    this.kerzenLauft = false;
    this.target = null;
    this.smokeRequested = false;
    this.handy = null;
    this.handyDanach = null;
    this.sitIdleT = 0;
    this.rollT = 0;
    this.doorT = 0;
    this.wcT = 0;
    this.runChain();
  }

  /** Nächsten Kettenschritt starten */
  private runChain() {
    const next = this.chain.shift();
    if (!next) return;
    if (next.force) this.assign(next.id);
    else this.command(next.id);
  }

  /* ------------------------------ Wegfindung ----------------------------- */

  private buildPath(tf: number, tx: number) {
    const path: Step[] = [];
    let f = this.lf;
    while (f !== tf) {
      const up = tf > f;
      const s = STAIRS[up ? f : f - 1];
      if (up) {
        path.push({ k: "walk", x: s.footX });
        path.push({ k: "stair", s, dir: 1 });
        f += 1;
      } else {
        path.push({ k: "walk", x: s.topX });
        path.push({ k: "stair", s, dir: -1 });
        f -= 1;
      }
    }
    path.push({ k: "walk", x: clamp(tx, RANGE[tf][0], RANGE[tf][1]) });
    this.path = path;
  }

  private beginStep(step: Step) {
    if (step.k === "walk" || step.dir === 1) this.cur = { step, t: 0, phase: "climb", timer: 0 };
    else this.cur = step.s.warp ? { step, t: 1, phase: "enter", timer: 0 } : { step, t: 1, phase: "climb", timer: 0 };
  }

  private advanceWalk(dist: number) {
    const d = dist * 0.15;
    this.walkP += d;
    this.stepAcc += d;
    if (this.stepAcc >= Math.PI) {
      this.stepAcc -= Math.PI;
      sfx.step(this.lf === 0 ? 0.8 : this.lf === 1 ? 1 : 1.2);
    }
  }

  /** Knauf der Schleusentuer in Weltkoordinaten – folgt dem Blatt beim Oeffnen. */
  private cellarKnob(): Pt {
    const hingeX = 590 - 4.5;
    const w = lerp(9, 34, Math.sin((this.cellarDoorV * Math.PI) / 2));
    return [hingeX + w - (this.cellarDoorV < 0.02 ? 3 : 5), FK - 80 + 80 * 0.52];
  }
  /** Knauf der blauen Verbindungstuer (gleiche Geometrie wie die Schleusentuer). */
  private musikKnob(): Pt {
    const t = MUSIKZIMMER.tuer;
    const hingeX = t.x - 4.5;
    const w = lerp(9, 34, Math.sin((this.musikDoor * Math.PI) / 2));
    return [hingeX + w - (this.musikDoor < 0.02 ? 3 : 5), t.y + t.h * 0.52];
  }
  /** Knauf der Gartentuer: zu = Kante in der Wand, offen = Blattkante im Raum. */
  private gardenKnob(): Pt {
    const ang = this.gardenDoor * (Math.PI / 2) * 0.92;
    const face = Math.sin(ang) * 44;
    return [HR - 1 + 2 - face, FK - 88 + 88 * 0.52];
  }

  /** Geschlossene Durchgangstuer, die dem aktuellen Gehschritt im Weg liegt. */
  private barrierAhead(tx: number): { x: number; knob: () => Pt; openDoor: () => void } | null {
    // Schleusentuer im Keller
    if (this.lf === 0 && (this.lx < 590) !== (tx < 590) && this.cellarDoorV < 0.55) {
      return {
        x: 590,
        knob: () => this.cellarKnob(),
        openDoor: () => {
          if (this.cellarDoorWant < 0.5) {
            this.cellarDoorWant = 1;
            sfx.ui();
          }
        },
      };
    }
    // Blaue Verbindungstuer im Musikzimmer (nur Gruselhaus)
    if (this.musikzimmer && this.lf === 3 && (this.lx < 528) !== (tx < 528) && this.musikDoor < 0.55) {
      return {
        x: 528,
        knob: () => this.musikKnob(),
        openDoor: () => {
          if (this.musikDoorWant < 0.5) {
            this.musikDoorWant = 1;
            sfx.ui();
          }
        },
      };
    }
    return null;
  }

  private updateLuni(dt: number) {
    if (this.pending && (!this.cur || this.cur.step.k === "walk")) {
      const st = this.pending;
      this.pending = null;
      this.target = st;
      this.activity = null;
      this.cur = null;
      this.buildPath(st.floor, st.x);
    }
    if (!this.cur && this.path.length) {
      const next = this.path.shift();
      if (next) this.beginStep(next);
    }
    const a = this.cur;
    if (!a) {
      if (this.target && !this.activity) {
        if (this.target.id === "laufziel") {
          this.target = null;
          return;
        }
        this.activity = this.target;
        this.lface = this.target.face;
        if (this.activity.screen) this.tvManual[this.activity.screen] = null;
        if (this.gruselBad && this.target.id === "bio_wc") {
          this.bioWcTime = 0;
          this.bioWcTriggered = false;
        }
        if (["zimmertuer", "musiktuer", "vorhang_links", "vorhang_rechts"].includes(this.activity.id)) {
          this.doorT = 0;
          this.doorActed = false;
        }
        // Datenkoffer (Osterei): bei Ankunft klappt der Deckel auf.
        if (this.activity.id === "datenkoffer" && !this.kofferPhase) {
          this.kofferPhase = "oeffnen";
          this.kofferT = 0;
        }
        if (this.target.id === "klavier" && this.musikzimmer) {
          if (!this.musikzimmer.startLuni()) {
            this.pianoRefusal = .9;
            this.activity = null;
            this.target = null;
          } else this.pianoSeat = 0;
          return;
        }
        // Am Saxophon angekommen: erst prüfen, ob der Greifpunkt überhaupt in
        // Reichweite liegt. Sonst geht sie näher heran, statt den Arm zu strecken.
        if (this.target.id === "saxophon" && !this.saxPhase) {
          const need = this.saxApproachX();
          if (need !== null && Math.abs(this.lx - need) > 0.8) {
            this.activity = null;
            // Den Saxophon-Auftrag behalten. Nach dem Nachrücken fällt
            // updateLuni erneut in diesen Ankunftsfall und startet das Greifen.
            this.buildPath(3, need);
          } else {
            this.lx = need ?? this.lx;
            this.startSax();
          }
        }
        if (this.target.id === "platten" && !this.plattenPhase) {
          this.startPlatten();
        }
        // Erst am Mikrofon singen, nicht schon auf dem Weg dorthin.
        if (this.target.id === "mikrofon" && !this.singPhase) this.startSing();
      }
      return;
    }

    if (a.step.k === "walk") {
      const dx = a.step.x - this.lx;
      // Luni greift noch zum Knauf: Hand bleibt am Griff, bis die Bewegung fertig ist.
      if (this.doorHandT >= 0) {
        this.doorHandT += dt;
        if (this.doorHandT >= 0.45) this.doorHandOpen?.();
        if (this.doorHandT >= 1.0) {
          this.doorHandT = -1;
          this.doorHand = null;
          this.doorHandOpen = null;
        }
        return;
      }
      // Geschlossene Tuer im Weg: davor stehen bleiben; nichts oeffnet sich von allein.
      const barrier = this.barrierAhead(a.step.x);
      if (barrier) {
        const dir = Math.sign(dx);
        const haltepunkt = barrier.x - dir * 14;
        // Nur in Gehrichtung bis zum Haltepunkt laufen. Steht sie bereits
        // naeher an der Tuer (z. B. nach dem Schliessen aus dem Durchgang),
        // greift sie von dort – sie darf nie durch das geschlossene Blatt.
        const rest = (haltepunkt - this.lx) * dir;
        if (rest > 0.8) {
          const schritt = Math.min(rest, SPEED * dt);
          this.lx += dir * schritt;
          this.lface = dir > 0 ? 1 : -1;
          this.advanceWalk(schritt);
          return;
        }
        // Angekommen: Hand zum Knauf, der Griff oeffnet die Tuer.
        this.lface = dir > 0 ? 1 : -1;
        this.doorHand = barrier.knob();
        this.doorHandT = 0;
        this.doorHandOpen = barrier.openDoor;
        return;
      }
      const move = SPEED * dt;
      const prevX = this.lx;
      if (Math.abs(dx) <= move) {
        this.lx = a.step.x;
        this.cur = null;
      } else {
        this.lx += Math.sign(dx) * move;
        this.lface = dx > 0 ? 1 : -1;
        this.advanceWalk(move);
      }
      void prevX;
      return;
    }

    // Treppe
    const s = a.step.s;
    const dir = a.step.dir;
    const len = Math.hypot(s.topX - s.footX, FLOOR_Y[s.upper] - FLOOR_Y[s.lower]);

    if (a.phase === "enter") {
      // Luni greift zum Knauf, öffnet die Kellertür und geht hinein
      a.timer += dt;
      if (a.timer < 0.35) {
        this.doorHand = [544 - this.doorOpen * 36, FE - 44];
        return;
      }
      this.doorHand = a.timer < 0.9 ? [544 - this.doorOpen * 36, FE - 44] : null;
      this.doorWant = true;
      this.alpha = 1 - clamp((a.timer - 0.35) / 0.35, 0, 1);
      if (a.timer >= 1.1) {
        a.phase = "climb";
        a.t = 1;
        this.alpha = 1;
        this.doorWant = false;
        this.lf = s.lower;
        this.lx = s.topX;
      }
      return;
    }
    if (a.phase === "exit") {
      // oben angekommen: Tür öffnet sich, Luni tritt heraus
      a.timer += dt;
      this.alpha = clamp((a.timer - 0.9) / 0.4, 0, 1);
      if (a.timer >= 1.6) {
        this.doorWant = false;
        this.alpha = 1;
        this.cur = null;
      }
      return;
    }

    const v = SPEED * 0.85 * dt;
    a.t += (dir * v) / len;
    this.lface = (s.topX - s.footX) * dir > 0 ? 1 : -1;
    this.advanceWalk(v);

    if (dir === 1 && a.t >= 1) {
      this.lf = s.upper;
      this.lx = s.topX;
      if (s.warp) {
        a.phase = "exit";
        a.timer = 0;
        this.alpha = 0;
        this.doorWant = true;
      } else {
        this.cur = null;
      }
    } else if (dir === -1 && a.t <= 0) {
      this.lf = s.lower;
      this.lx = s.footX;
      this.cur = null;
    }
  }

  /* ------------------------------ Zustand für Tests ---------------------- */

  getState() {
    return {
      floor: this.lf,
      x: this.lx,
      moving: !!this.cur || this.path.length > 0 || this.pianoRise > 0 || this.pianoEscapeMoving,
      activity: this.activity?.id ?? null,
      night: this.night,
      musikzimmer: this.musikzimmer?.getState() ?? null,
      pianoSeat: this.pianoSeat,
      pianoRise: this.pianoRise,
      pianoEscape: this.pianoEscape,
      pianoRefusal: this.pianoRefusal,
      wetter: { ...this.wetter, zusatz: [...this.wetter.zusatz] },
      badezimmer: this.gruselBad ? {
        phase: this.shPhase, kapsel: this.bioDoor, drinnen: this.bioInside,
        nebel: this.bioMist, blitz: this.bioFlash, wc: this.bioWcGlow,
        buersteImSpind: this.brushInCab,
      } : null,
    };
  }

  private get gruselBad() {
    return this.welt === "gruesel" && GRUSELRAEUME.badezimmer;
  }

  private bioFx(): BioBadFx {
    return { door: this.bioDoor, inside: this.bioInside, mist: this.bioMist,
      flash: this.bioFlash, flush: this.bioWcGlow, panelPress: this.bioPanelPress,
      towel: this.towelOnRod, time: this.elapsed };
  }

  /* ------------------------------ Zeichnen ------------------------------- */

  private renderStatic() {
    const s = this.scale * this.dpr;
    const hour = this.clock.hour + this.clock.min / 60;
    const weihnacht = this.welt === "weihnacht";

    this.skyc.setTransform(s, 0, 0, s, 0, 0);
    this.skyc.clearRect(0, 0, W, H);
    this.night = drawSkyLayer(this.skyc, hour);

    this.bgc.setTransform(s, 0, 0, s, 0, 0);
    this.bgc.clearRect(0, 0, W, H);
    this.bgc.drawImage(this.sky, 0, 0, W, H);
    drawHouse(
      this.bgc,
      this.sky,
      { open: this.gardenDoor },
      this.golOnShelf,
      this.welt === "gruesel" ? GRUSELRAEUME : null,
      this.bettRendered,
      { kanne: !this.teaKanneWeg, tasse: !this.teaTasseWeg, fill: this.teaFuellung },
      weihnacht,
      this.flauschiModulSichtbar,
      this.weihnachtsdeko,
    );
    // Raum 02 wird als eigene Canvas-Szene über die frühere Musikzimmerfläche
    // gemalt. Der Bereich beginnt hinter der Trennwand; kein Nachbarraum ändert sich.
    if (this.welt === "gruesel" && GRUSELRAEUME.musikzimmer) {
      drawMusikzimmer(this.bgc, atticCeil);
    }
    // Wechselsteine: jede Welt zeigt die Steine der anderen Welten.
    for (const sl of this.steine) drawStein(this.bgc, sl.art, 0, sl.x, sl.y);

    // Licht: Multiplikationsebene (Dunkelheit) + additive Wärme
    const night = this.night;
    const m = this.mulc;
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-over";
    m.fillStyle = mix("#ffffff", "#566596", clamp(night, 0, 1) * 0.92);
    m.fillRect(0, 0, this.mul.width, this.mul.height);
    const a = this.addc;
    a.setTransform(1, 0, 0, 1, 0, 0);
    a.clearRect(0, 0, this.add.width, this.add.height);
    m.setTransform(s, 0, 0, s, 0, 0);
    a.setTransform(s, 0, 0, s, 0, 0);
    m.globalCompositeOperation = "lighter";
    a.globalCompositeOperation = "lighter";
    const str = clamp((night - 0.12) / 0.5, 0, 1);
    if (str > 0) {
      for (const l of LAMPS) {
        if (weihnacht && l.x === 302 && l.y === 372) continue; // Die Stehlampe ist dem Baum gewichen.
        // Im Gruselhaus ist die Kuechenzeile entfernt; dort gibt es an
        // dieser Stelle auch keine Lampe. Das normale Haus bleibt unberuehrt.
        if (this.welt === "gruesel" && GRUSELRAEUME.kueche && l.x === 650 && l.y === 360) continue;
        // Mit kueche: die zweite Kellerlampe leuchtet die Gruselhaus-Küche
        // nicht durch die Decke.»
        if (this.welt === "gruesel" && GRUSELRAEUME.kueche && l.kueche === true) continue;
        const musikLampe = l.x === 700 && l.y === 150;
        const lampenStaerke = str * (weihnacht && !musikLampe ? 0.67 : 1);
        const r1 = l.r * 0.78;
        const g1 = m.createRadialGradient(l.x, l.y, 4, l.x, l.y, r1);
        g1.addColorStop(0, `rgba(255,255,255,${0.9 * lampenStaerke})`);
        g1.addColorStop(0.45, `rgba(255,255,255,${0.3 * lampenStaerke})`);
        g1.addColorStop(1, "rgba(255,255,255,0)");
        m.fillStyle = g1;
        m.beginPath();
        m.arc(l.x, l.y, r1, 0, Math.PI * 2);
        m.fill();
        const g2 = a.createRadialGradient(l.x, l.y, 4, l.x, l.y, r1);
        g2.addColorStop(0, `rgba(255,190,110,${0.26 * lampenStaerke})`);
        g2.addColorStop(1, "rgba(255,190,110,0)");
        a.fillStyle = g2;
        a.beginPath();
        a.arc(l.x, l.y, r1, 0, Math.PI * 2);
        a.fill();
      }
      if (weihnacht) this.zeichneWeihnachtsAbendlicht(m, a, str);
    }
    // Hexenküche: Kerze und Fackel sind die einzigen Lichtquellen dort.
    if (str > 0 && this.welt === "gruesel" && GRUSELRAEUME.kueche) kuecheLichtpools(m, a, str);
    m.globalCompositeOperation = "source-over";
    a.globalCompositeOperation = "source-over";
    if (this.musikzimmer) {
      // Nur das Musikzimmer behaelt sein warmes, lesbares Lampenlicht.
      m.save(); clipMusikzimmer(m, atticCeil);
      const light = m.createRadialGradient(619, 151, 8, 619, 151, 210);
      light.addColorStop(0, "#fff1d9"); light.addColorStop(1, "#b5b4aa");
      m.fillStyle = light; m.fillRect(534, 35, 296, 165); m.restore();
      a.save(); clipMusikzimmer(a, atticCeil); a.clearRect(534, 35, 296, 165); a.restore();
    }
    if (this.gruselBad) {
      // Kaltes, gedämpftes Laborlicht bleibt auf das Bad beschränkt.
      m.save(); m.beginPath(); m.rect(491, 212, 202, 112); m.clip();
      const cold = m.createRadialGradient(590, 250, 8, 590, 250, 130);
      cold.addColorStop(0, "#e3eee5"); cold.addColorStop(1, "#9daeb2");
      m.fillStyle = cold; m.fillRect(491, 212, 202, 112); m.restore();
      a.save(); a.beginPath(); a.rect(491, 212, 202, 112); a.clip();
      a.clearRect(491, 212, 202, 112); a.restore();
    }
    this.dirty = false;
  }

  private zeichneWeihnachtsAbendlicht(m: C, a: C, str: number) {
    const og = FD + SLAB;
    const eg = FO + SLAB;
    const kg = FE + SLAB;
    const wohnzimmer = [250, eg, 310, FE - eg + 5] as const;
    weihnachtsAbendlicht(m, a, wohnzimmer, WEIHNACHTSBAUM_X + 24, FE - 57, str, 0.62);
    weihnachtsLichtfleck(m, wohnzimmer, WEIHNACHTSBAUM_X, FE - 47, 74, 79, str * 0.63);
    weihnachtsLichtfleck(a, wohnzimmer, WEIHNACHTSBAUM_X, FE - 47, 65, 69, str * 0.14);
    weihnachtsLichtfleck(a, wohnzimmer, WEIHNACHTSBAUM_X, FE - 5, 60, 19, str * 0.16);
    for (const [bereich, x, y, kraft] of [
      [[HL, eg, 250 - HL, FE - eg + 3], 163, FE - 32, 0.9],
      [[560, eg, OG_X1 - 560, FE - eg + 3], 644, FE - 49, 0.87],
      [[OG_X1, og, HR - OG_X1, FE - og + 3], WEIHNACHTS_ORTE.adventskranz - 14, FE - 42, 1.04],
      [[270, og, 220, FO - og + 3], 376, FO - 46, 0.89],
      [[490, og, OG_X1 - 490, FO - og + 3], 626, FO - 44, 0.67],
      [[CEL_X0, kg, 590 - CEL_X0, FK - kg + 3], 469, FK - 55, 0.67],
      [[590, kg, HR - 590, FK - kg + 3], 700, FK - 57, 0.55],
    ] as const) weihnachtsAbendlicht(m, a, bereich, x, y, str, kraft);

    // Das Dach und der helle Bereich vor dem Haus werden nicht mitgefaerbt.
    for (const c of [m, a]) {
      c.save(); c.beginPath();
      c.moveTo(DG_X0, FD); c.lineTo(DG_X0, atticCeil(DG_X0));
      c.lineTo(470, atticCeil(470)); c.lineTo(530, atticCeil(530));
      c.lineTo(530, FD); c.closePath(); c.clip();
    }
    weihnachtsAbendlicht(m, a, [DG_X0, 40, 530 - DG_X0, FD - 40], 404, FD - 46, str, 0.81);
    m.restore(); a.restore();
  }

  /** Schimmer, Blitze und Denkblase – nach der Nachtabdunkelung, damit sie leuchten. */
  private drawKesselEffekte(c: C) {
    drawKuchenFensterWetter(c, this.wetter.art, this.elapsed);
    drawFensterGlanz(c, this.elapsed);
    // Lila Schleier zuerst, damit Kerze, Fackel und Trank darüber leuchten.
    drawKuecheSchleier(c, this.night);
    drawKuecheSchein(c, this.elapsed, this.night);
    const fx = this.kessel.zustand();
    drawKesselSchimmer(c, FE, this.elapsed, fx, this.night);
    const h = this.luniHaende;
    const laenge = this.blitzLaenge();
    if (this.zauber && h && laenge > 0.01) {
      const ziel = kesselLoeffelSpitze(FE, fx);
      drawZauberBlitz(c, h.front, ziel, laenge, this.elapsed, 1);
      drawZauberBlitz(c, h.rear, ziel, laenge, this.elapsed, 2);
    }
    const k = this.luniKopf;
    if (k && k.sichtbar && fx.gedanke > 0.01) {
      drawKesselGedanke(c, clamp(k.x, 24, W - 24), k.y - 61, k.face, this.elapsed, fx.gedanke);
    }
  }

  private drawHexenofen(c: C) {
    drawKuecheFlammen(c, this.elapsed);
    hexenofenOhneRohr(c, (c) => drawOfen(c, FE, this.elapsed, this.ofenOffen));
    if (this.ofenOffen < .98) {
      // Nur im Sichtfenster das verdeckte Feuer freilegen. Derselbe Renderer
      // liefert die Flammen; Tuerrand, Glas und Fensterkreuz bleiben erhalten.
      const dx = OFEN.x + 8, dy = FE - OFEN.korpus + 7, dw = OFEN.w - 16;
      const x = dx + 3.6, y = dy + 4.2, w = dw - 7.2, h = 13;
      c.save();
      c.beginPath();
      c.moveTo(x, y + h);
      c.lineTo(x, y + h * .4);
      c.quadraticCurveTo(x + w * .22, y + h * .05, x + w / 2, y);
      c.quadraticCurveTo(x + w * .78, y + h * .05, x + w, y + h * .4);
      c.lineTo(x + w, y + h);
      c.closePath();
      c.clip();
      drawOfen(c, FE, this.elapsed, 1);
      c.globalAlpha *= Math.min(1, (1 - this.ofenOffen) * 1.4);
      rect(c, x, y, w, h, "rgba(240,150,54,.20)");
      line(c, dx + dw / 2, dy + 4.4, dx + dw / 2, dy + 17, "rgba(115,128,132,.75)", .7);
      line(c, dx + 4, dy + 11.2, dx + dw - 4, dy + 11.2, "rgba(115,128,132,.6)", .6);
      c.restore();
    }
    drawHolzlager(c, FE, this.holz, this.lagerT);
    drawTruhe(c, FE, this.truheOffset, this.elapsed, this.truheLift, this.truheRichtung, this.truheGeh);
    drawTruheAufsatz(c, this.elapsed, 405);
    drawKessel(c, FE, this.elapsed, this.kessel.zustand());
  }

  private draw() {
    const weihnacht = this.welt === "weihnacht";
    const bettBelegt = this.welt === "normal" || this.welt === "weihnacht"
      ? (this.lf === 2 && !this.cur && !this.pending
        && this.path.length === 0 && (this.lieDown || !!this.sleepPhase || this.asleep ||
          (this.bedEinstieg !== null && this.bedEinstieg !== "anfahrt")))
      : false;
    if (bettBelegt !== this.bettRendered) {
      this.bettRendered = bettBelegt;
      this.dirty = true;
    }
    if (this.dirty) this.renderStatic();
    const ctx = this.ctx;
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.bg, 0, 0, W, H);

    // Weihnachtsbogen mit Kerzen auf dem Klavier (normales Haus & Weihnachtshaus).
    // Der Schein der Kerzen liegt VOR Luni, das Licht auf Luni kommt danach.
    this.drawKlavierBogen(ctx);
    if (this.istNormalHaus && this.welt !== "gruesel" && this.kerzenAn) {
      if (this.weihnachtsdeko) kerzenSchein(ctx, 545, FD, this.klavierOutro === "klang" ? 0.55 + 0.45 * (1 - this.klavierOutroT / KLAVIER_AUSKLINGEN) : 1);
    }

    // Wetter früh, damit Fenstermaske, Truhe und Luni danach sauber darüber liegen.
    if (this.welt === "gruesel" && GRUSELRAEUME.kueche) {
      // Der Wetterpfad zeichnet am Schornstein durch die Even-Odd-Regel zwei
      // Pixelreihen Regen auf die obere Wandkante. Diese schmale Kante wird in
      // beiden Haeusern ausgespart; im Gruselhaus zusaetzlich die drei Fenster,
      // die dort nicht mehr existieren, und die Deckenfläche oberhalb der
      // Hexenküche, wo die zweite Kellerlampe sonst durchstrahlt.
      const trockeneFlaechen: Rect4[] = [[698, 128, 26, 2]];
      if (this.welt === "gruesel") {
        trockeneFlaechen.push([624, 364, 50, 36], [334, 244, 62, 46], [330, 98, 56, 44]);
        // Kueche oberhalb der Decke der zweiten Kellerlampe bleibt frei.
        trockeneFlaechen.push([600, 330, 210, 65]);
      }
      const k = this.scale * this.dpr;
      if (this.elapsed === 2) {
        // Erste Zeichnung: trockeneFlaechen liegen noch nicht im Zwischenbild
        // (die Nachtabdunkelung über dem Ofen läuft erst danach). Dann lassen
        // wir sie einen Frame zu, damit das Zwischenbild bereit ist.
      }
      const kopien = trockeneFlaechen.map(([wx, wy, ww, wh], i) => {
        const x = Math.round(wx * k), y = Math.round(wy * k);
        const w = Math.max(1, Math.round(ww * k)), h = Math.max(1, Math.round(wh * k));
        const cv = this.trockenPuffer[i];
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
        const cc = cv.getContext("2d");
        cc?.clearRect(0, 0, w, h);
        cc?.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);
        return { cv, x, y };
      });
      drawWetter(ctx, this.wetter, this.elapsed);
      if (kopien.length) {
        const base = ctx.getTransform();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (const { cv, x, y } of kopien) ctx.drawImage(cv, x, y);
        ctx.setTransform(base);
      }
      // Nach dem Wetter: runde Fenstermaske (nur im Gruselhaus) hält Regen im Glas.
      if (this.welt === "gruesel" && GRUSELRAEUME.kueche) drawFensterMaske(ctx);
    }
    // Im normalen Haus bleibt das Fensterwetter hinter Luni.
    if (!(this.welt === "gruesel" && GRUSELRAEUME.kueche)) {
      drawWetter(ctx, this.wetter, this.elapsed, weihnacht ? samtvorhangPfade : undefined);
    }
    const adventSonntage = weihnacht ? adventsSonntage(Date.now()) : 0;
    if (weihnacht) weihnachtsKerzenflammen(ctx, FE, FO, FK, this.elapsed, adventSonntage);

    this.drawKellerDoor(ctx);
    cellarDoor(ctx, 590, FK - 80, 80, this.cellarDoorV);
    this.drawScreens(ctx);
    this.drawTvButton(ctx);
    // Eingestecktes Modul sitzt in der Konsole, Luni geht davor vorbei.
    if (this.golInserted && this.golPhase !== "insert") golCartridge(ctx, 446, 167, 6, 11);
    if (this.flauschiAktiv && this.flauschiPhase !== "insert") drawFlauschiHuelle(ctx, 456, 168, 6, 11, this.elapsed);
    if (this.welt === "gruesel") this.drawClock(ctx);
    if (this.welt === "gruesel") this.raumFx.draw(ctx, atticCeil);
    if (this.musikzimmer) {
      drawMusikzimmerEffects(ctx, this.musikzimmer, this.vorhang);
      drawMusiktuer(ctx, this.musikDoor);
    }
    if (this.welt === "gruesel" && GRUSELRAEUME.schlafzimmer) {
      drawSchlafzimmerEffects(ctx, this.elapsed, FLOOR_Y[2], { swing: this.leuchterW, blink: this.fledermausBlink });
    }
    if (this.gruselBad) drawBioBadBefore(ctx, this.bioFx());
    this.drawSax(ctx);
    this.drawStereo(ctx);
    this.drawCigPile(ctx);
    ashBucket(ctx, BUCKET_X, FK, this.bucketButts);
    if (this.istNormalHaus && this.weihnachtsdeko) {
      this.adventStandPruefen();
      if (weihnacht) {
        // Weihnachtshaus: der kleine Kalender trägt denselben Schmuck wie der große.
        adventWandWeihnacht(ctx, this.adventStand.offen, this.adventStand.jahr || new Date().getFullYear(), adventSonntage);
      } else {
        adventWand(ctx, this.adventStand.offen, this.adventStand.jahr || new Date().getFullYear());
      }
    }
    this.drawAshtrayTray(ctx);
    // Zigarette im Aschenbecher liegt AUF der Platte: Luni geht davor vorbei
    // und verdeckt sie wie jedes andere Objekt auf dem Tisch.
    this.drawAshtrayButt(ctx);
    if (this.welt === "gruesel" && GRUSELRAEUME.schlafzimmer) {
      drawGothicWardrobeOpen(ctx, 434, FLOOR_Y[2], this.wardrobeOpen, this.outfit !== "dressed" || this.towelOnRod);
    } else {
      drawWardrobeOpen(ctx, 434, FLOOR_Y[2], this.wardrobeOpen, this.outfit !== "dressed" || this.towelOnRod,
        weihnacht ? WEIHNACHTS_FARBEN.holz : undefined);
    }
    if (this.glassesInSink) glassesObj(ctx, SINK_DROP[0], SINK_DROP[1], 0.12, 0.45);
    if (this.gruselSarg) this.drawBedToss(ctx);
    if (this.gruselBad) drawLabLockerOpen(ctx, this.cabinetOpen, this.brushInCab);
    else drawCabinetOpen(ctx, this.cabinetOpen, this.brushInCab);
    // Auch der animierte Ofen steht hinter Luni, nicht vor ihrem Laufweg.
    if (this.welt === "gruesel" && GRUSELRAEUME.kueche) this.drawHexenofen(ctx);
    this.drawSargPass(ctx, false);
  // Osterei: der Datenkoffer steht hinter Luni, nicht vor ihrem Laufweg.
  this.drawKoffer(ctx);
  if (this.bettRendered) drawBedFront(ctx, 282, FO, weihnacht);
  this.drawLuniLayered(ctx);
  // Sitzt Luni im normalen Haus / Weihnachtshaus mit dem Rücken zum Spieler am Klavier,
  // steht der Hocker vor ihrem Gesäß und ihren Beinen.
  if (!this.musikzimmer && this.lf === 3 && !this.cur && this.activity?.id === "klavier"
    && (!this.klavierOutro || this.klavierOutro === "klang" || this.klavierOutro === "aufstehen")) {
    pianoStool(ctx, SCHEMEL_X, FD);
  }
    if (!this.gruselSarg) this.drawBedToss(ctx);
    // Die abgelegte Brille liegt vor Bett und Decke – sie wird nie von der
    // Bettdecke verdeckt und „klebt“ dann scheinbar an ihr.
    this.drawGlassesRest(ctx);
    // Odin & Apollo: nach den Möbeln der Ebene – sie laufen davor und dürfen
    // nicht hinter Bettpfosten, Decke oder Vorderkante verschwinden.
    if (this.istNormalHaus) this.hunde.draw(ctx);
    if (this.gruselBad) {
      drawBioBadAfter(ctx, this.bioFx(), () => drawLuni(ctx,
        BIO_BAD.kapsel.x + BIO_BAD.kapsel.w / 2, FLOOR_Y[2], {
          t: this.elapsed, scale: LUNI_SCALE, state: "idle", expr: "neutral",
          face: 1, blink: 0, glasses: this.glassesOn, shadow: false,
          outfit: this.outfit, wet: this.wet, sick: this.sick,
        }));
    }
    this.drawSargPass(ctx, true);
    this.drawGlassesMoving(ctx);
    this.drawGolInHand(ctx);
    this.drawFlauschiInHand(ctx);
    // Rauch liegt über allem – Luni sieht erst wieder etwas, wenn die Tür auf ist
    this.drawSmoke(ctx);
    // Abzug durch die Gartentür: Schwaden ziehen sichtbar nach draußen
    this.drawVentSmoke(ctx);

    // Kerzenlicht auf Luni: hält ihre Silhouette warm, damit sie sich vom Klavier abhebt.
  if (this.istNormalHaus && this.welt !== "gruesel" && this.kerzenAn && this.lf === 3 && !this.tvZoom) {
    const nah = Math.abs(this.lx - 567) < 95;
    drawKerzenlicht(ctx, 1, this.silBuf, () => {
      const sc = this.silBuf.getContext("2d");
      if (sc) this.drawLuniNow(sc);
    }, nah);
  }
  // Auch nach dem Lichtpuffer bleibt der Staender vor Luni sichtbar.
  if (this.istNormalHaus) micStand(ctx, MIC_STAND_X, FD);
  if (this.night > 0.03) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(this.mul, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(this.add, 0, 0);
      ctx.restore();
    }


    if (this.welt === "gruesel" && GRUSELRAEUME.kueche) this.drawKesselEffekte(ctx);


    drawWetterStation(ctx, this.wetter, this.wetterAdd, this.wetterHover, this.wetterOffen, this.istNormalHaus);
    if (this.welt === "weihnacht") {
      drawWeihnachtsschlitten(ctx, this.elapsed, this.ufoOffen, this.ufoOffen ? this.ufoZeile : -1, PATCH_EINTRAEGE, this.ufoHover);
    } else {
      drawUfo(ctx, this.elapsed, this.ufoOffen, this.ufoOffen ? this.ufoZeile : -1, PATCH_EINTRAEGE, this.ufoHover);
    }
    this.drawStationFokus(ctx);
    this.drawHoverLabel(ctx);
    if (this.tvZoom) this.drawTvFullscreen(ctx);
    if (this.adventFullscreen || this.adventZoomT > 0) this.drawAdventskalender(ctx);
  }

  private wetterBefehl(b: WetterBefehl) {
    switch (b.k) {
      case "toggle": this.wetterOffen = !this.wetterOffen; this.wetterAdd = null; break;
      case "season": this.wetter = waehleJahreszeit(this.wetter, b.v); break;
      case "art": this.wetter = waehleWetter(this.wetter, b.v); break;
      case "plus": this.wetterAdd = this.wetterAdd === "plus" ? null : "plus"; break;
      case "minus": this.wetterAdd = this.wetterAdd === "minus" ? null : "minus"; break;
      case "zusatz": this.wetter = schalteZusatz(this.wetter, b.v); this.wetterAdd = null; break;
      case "echt": this.wetter = echtwetter(this.wetter); this.wetterAdd = null; break;
    }
    this.wetterHover = null;
    this.last = performance.now();
  }

  private drawKellerDoor(c: C) {
    const o = this.doorOpen;
    if (o < 0.03) return;
    const x = 500;
    rect(c, x, FE - 82, 46, 82, "#0a0d12");
    rect(c, x + 14, FE - 20, 30, 2, "rgba(255,200,120,.25)");
    const dw = 46 * (1 - o * 0.86);
    poly(c, [[x, FE - 82], [x + dw, FE - 82 + o * 5], [x + dw, FE - o * 5], [x, FE]], "#5a3b2a");
    rect(c, x + dw - 2, FE - 44, 2, 5, "#e6c36a");
  }

  /* ------------------------------ Saxophon ------------------------------- */

  private get saxStand() {
    return { x: SAX_STAND_X, y: SAX_STAND_Y };
  }

  /** 0 = auf dem Stativ, 1 = am Mund. */
  /** Weltpunkt, an dem die vordere Hand das Instrument hält. */
  /** Nächste Standposition, aus der BEIDE Griffpunkte am Stativ mit natürlicher
   *  Armlänge erreichbar sind. null = sie steht schon richtig. */
  private saxApproachX(): number | null {
    const st = this.stations.find((s) => s.id === "saxophon");
    if (!st) return null;
    const reach = (8.2 + 8.4 - 0.6) * LUNI_SCALE;
    const shy = FLOOR_Y[3] + -34 * LUNI_SCALE;
    for (const local of [SAX_GRIP_UP, SAX_GRIP_LOW] as const) {
      const gx = this.saxStand.x + local[0] * SAX_SCALE * st.face;
      const gy = this.saxStand.y + local[1] * SAX_SCALE;
      // Die Schulter, die näher am Instrument liegt, bekommt das kleinere dx.
      const shx = this.lx + (local === SAX_GRIP_UP ? -3.4 : 3.4) * LUNI_SCALE * st.face;
      const dy = gy - shy;
      const dxMax = Math.sqrt(Math.max(0, reach * reach - dy * dy));
      if (Math.abs(gx - shx) <= dxMax) continue;
      const need = gx - Math.sign(gx - shx) * dxMax - (local === SAX_GRIP_UP ? -3.4 : 3.4) * LUNI_SCALE * st.face;
      return st.face === 1 ? Math.min(need, gx) : Math.max(need, gx);
    }
    return null;
  }

  /** 0 = am Stativ, 1 = in Spielposition. */
  private saxLift(): number {
    if (this.saxPhase === "lift") return clamp(this.saxT / SAX_LIFT, 0, 1);
    if (this.saxPhase === "play") return 1;
    if (this.saxPhase === "lower") return 1 - clamp(this.saxT / SAX_LOWER, 0, 1);
    return 0;
  }

  /**
   * Aktuelle Lage des Instruments: Mundstück-Anker und Richtung.
   * Die Richtung bleibt über ALLE Phasen dieselbe (Blickrichtung der Figur),
   * damit sich das Saxophon beim Anheben nicht sichtbar umdreht. Position und
   * Richtung stammen aus einer einzigen Stelle – Zeichnung und Griffpunkte
   * können dadurch nie auseinanderlaufen.
   */
  private saxPose(): { ax: number; ay: number; dir: 1 | -1; rot: number } {
    const st = this.stations.find((s) => s.id === "saxophon")!;
    const dir = st.face;
    const raw = this.saxLift();
    const e = raw * raw * (3 - 2 * raw);
    const mouthX = this.lx + SAX_MOUTH_DX * LUNI_SCALE * dir;
    const mouthY = FLOOR_Y[st.floor] - 40.5 * LUNI_SCALE;
    // Leichter Bogen beim Anheben – kein gerader Flug durch den Raum.
    const arc = Math.sin(Math.PI * raw) * 3;
    const ax0 = lerp(this.saxStand.x, mouthX, e);
    const ay0 = lerp(this.saxStand.y, mouthY, e) - arc;

    // Sobald sie es hält, folgt das Instrument ihrem Körper: Wiegen mit der
    // Musik und das Atmen des Oberkörpers. Sonst schwebt es starr daneben.
    let rot = 0;
    // Am Stativ und während des Hinstreckens liegt es ruhig – die Körper-
    // bewegung gehört erst zu Luni, sobald sie das Instrument hält.
    if (!this.saxPhase || this.saxPhase === "reach") return { ax: ax0, ay: ay0, dir, rot };
    const sway = this.saxSway();
    const breathe = Math.sin(this.elapsed * 2) * 0.45 * 0.35; // buildRig("sax")
    return {
      ax: ax0 + sway * 0.6 * LUNI_SCALE * dir,
      ay: ay0 + breathe * LUNI_SCALE,
      dir,
      rot: sway * 0.04 * dir,
    };
  }

  /** Oberkörper-Wiegen der Spielhaltung, aus derselben Musikzeit wie die Figur. */
  private saxSway(): number {
    if (this.saxPhase !== "play" || !this.saxStarted) return 0;
    return Math.sin(((this.saxMusic?.currentTime ?? 0) * Math.PI * 2) / 2); // ein Takt = 2 s
  }

  /** Fußwippen im Takt (120 BPM). */
  private saxBeat(): number {
    if (this.saxPhase !== "play" || !this.saxStarted) return 0;
    const beat = ((this.saxMusic?.currentTime ?? 0) * 2) % 1;
    return beat < 0.3 ? Math.sin((beat / 0.3) * Math.PI) : 0;
  }

  /** Griffpunkt in Weltkoordinaten – folgt dem Instrument Schritt für Schritt. */
  private saxGripAt(local: Pt): [number, number] {
    const p = this.saxPose();
    // Griffpunkt zuerst in Instrumentenrahmen, dann mit der Körperbewegung
    // drehen und verschieben – Hände und Korpus bleiben dadurch verbunden.
    const lx = local[0] * SAX_SCALE * p.dir;
    const ly = local[1] * SAX_SCALE;
    const c = Math.cos(p.rot);
    const sn = Math.sin(p.rot);
    return [p.ax + lx * c - ly * sn, p.ay + lx * sn + ly * c];
  }

  /** Instrument steht auf dem Stativ, solange es niemand hält. */
  private drawSax(c: C) {
    // Während einer Phase übernimmt drawSaxCarried den Zwischenschritt.
    if (this.saxPhase) return;
    const p = this.saxPose();
    if (!this.musikzimmer) saxophone(c, p.ax, p.ay, SAX_SCALE, p.dir);
  }

  /**
   * Instrument in Lunis Hand. Läuft als Zwischenschritt zwischen Rumpf und
   * Armen (siehe betweenBodyAndArms) – dadurch liegt es vor dem Körper und
   * hinter beiden Händen, statt sie zu verdecken. Die Neigung folgt dem
   * Wiegen des Oberkörpers.
   */
  private drawSaxCarried(c: C) {
    if (!this.saxPhase) return;
    // Der Aufruf kommt aus drawLuni, wo die FIGUREN-Transformation liegt
    // (versetzt, gespiegelt, skaliert). Zeichnet man hier mit Weltkoordinaten,
    // landet das Instrument außerhalb des Bildes – zurück auf Welt zurück.
    const s = this.scale * this.dpr;
    c.save();
    c.setTransform(s, 0, 0, s, 0, 0);
    const p = this.saxPose();
    if (p.rot) {
      c.translate(p.ax, p.ay);
      c.rotate(p.rot);
      c.translate(-p.ax, -p.ay);
    }
    if (!this.musikzimmer) saxophone(c, p.ax, p.ay, SAX_SCALE, p.dir);
    c.restore();
  }

  /** Audio freigeben und Tonpuffer vorab berechnen (mehrfach aufrufbar). */
  private prepareSax() {
    sfx.ensure();
    const shared = sfx.getSharedAudio();
    if (!shared) return;
    if (!this.saxMusic) this.saxMusic = new SaxophonMusic(shared.ctx, shared.master);
    const music = this.saxMusic;
    if (!this.saxReady && !this.saxPreparing) {
      this.saxPreparing = true;
      void music
        .prepare()
        .then(() => {
          this.saxReady = true;
        })
        .catch(() => {
          this.saxReady = false;
          music.dispose();
          if (this.saxMusic === music) this.saxMusic = null;
        })
        .finally(() => {
          this.saxPreparing = false;
        });
    }
  }

  /** Klick auf das Saxophon: erst hinstrecken, dann greifen. */
  private startSax() {
    if (this.saxPhase) return;
    this.saxPhase = "reach";
    this.saxT = 0;
    this.saxStarted = false;
    this.saxPausedAt = null;
    this.prepareSax();
  }

  /** Mundstück am Mund: Musik startet, sobald die Tonpuffer bereit sind. */
  private tryStartSaxPlayback() {
    if (this.saxStarted || !this.saxMusic || !this.saxReady || this.saxPausedAt !== null) return;
    if (this.musikzimmer?.active) return;
    const shared = sfx.getSharedAudio();
    if (!shared) return;
    try {
      this.saxMusic.playAt(shared.ctx.currentTime + SAX_LEAD, 0);
      this.saxStarted = true;
    } catch {
      // Audio noch gesperrt – im nächsten Bild erneut versuchen.
    }
  }

  private updateSax(dt: number) {
    if (!this.saxPhase) return;
    this.saxT += dt;
    // 1) Hinstrecken: das Instrument bleibt unverändert am Stativ.
    if (this.saxPhase === "reach") {
      if (this.saxT >= SAX_REACH) {
        this.saxPhase = "lift";
        this.saxT = 0;
      }
      return;
    }
    // 2) Anheben: Greifpunkt und Instrument wandern gemeinsam zum Mund.
    if (this.saxPhase === "lift") {
      if (this.saxT >= SAX_LIFT) {
        this.saxPhase = "play";
        this.saxT = 0;
        this.tryStartSaxPlayback();
      }
      return;
    }
    if (this.saxPhase === "play") {
      if (!this.saxStarted) {
        this.tryStartSaxPlayback();
        return;
      }
      if ((this.saxMusic?.currentTime ?? 0) >= SAX_SONG_PAULCHEN.duration) {
        this.saxMusic?.stop();
        this.saxPhase = "lower";
        this.saxT = 0;
        this.saxStarted = false;
      }
      return;
    }
    // 3) Abstellen: zurück zum Stativ, erst am Ziel löst sich die Hand.
    if (this.saxPhase === "lower" && this.saxT >= SAX_LOWER) {
      this.saxPhase = null;
      this.saxT = 0;
      this.saxStarted = false;
      this.activity = null;
      this.target = null;
    }
  }

  /** Musik sofort beenden (Abbruch, Aufwachen, neue Anweisung). */
  private stopSax() {
    this.saxMusic?.stop();
    this.saxPhase = null;
    this.saxT = 0;
    this.saxStarted = false;
    this.saxPausedAt = null;
  }

  /* ------------------------- Gesang „Frosch am Strand“ ------------------ */

  private prepareSing() {
    sfx.ensure();
    const shared = sfx.getSharedAudio();
    if (!shared) return;
    if (!this.singMusic) this.singMusic = new FroschMusic(shared.ctx, shared.master);
    const music = this.singMusic;
    if (!this.singReady && !this.singPreparing) {
      this.singPreparing = true;
      void music
        .prepare()
        .then(() => {
          if (!this.destroyed && this.singMusic === music) this.singReady = true;
        })
        .catch(() => {
          this.singReady = false;
          music.dispose();
          if (this.singMusic === music) this.singMusic = null;
        })
        .finally(() => {
          this.singPreparing = false;
        });
    }
  }

  /** Am Mikrofon angekommen: stehen bleiben und das vorhandene Froschlied singen. */
  private startSing() {
    if (this.singPhase || !this.istNormalHaus || this.activity?.id !== "mikrofon") return;
    this.singPhase = "sing";
    this.singT = 0;
    this.singStarted = false;
    this.singPausedAt = null;
    this.prepareSing();
  }

  private tryStartSingPlayback() {
    if (this.singStarted || !this.singMusic || !this.singReady || this.singPausedAt !== null) return;
    if (this.musikzimmer?.active) return;
    const shared = sfx.getSharedAudio();
    if (!shared) return;
    try {
      this.singMusic.playAt(shared.ctx.currentTime + 0.05, 0);
      this.singStarted = true;
    } catch {
      // Audio noch gesperrt – im nächsten Bild erneut versuchen.
    }
  }

  private updateSing(dt: number) {
    if (!this.singPhase || this.singPausedAt !== null) return;
    if (!this.singStarted) {
      this.tryStartSingPlayback();
      if (!this.singStarted) return;
    }
    this.singT += dt;
    const mt = this.singStarted ? (this.singMusic?.currentTime ?? 0) : this.singT;
    if (mt >= FROSCH_DURATION_SECONDS) {
      this.singMusic?.stop();
      this.singStarted = false;
      this.singPhase = null;
      this.singT = 0;
      this.activity = null;
      this.target = null;
    }
  }

  /** Gesang sofort beenden (Abbruch, Aufwachen, neue Anweisung). */
  private stopSing() {
    this.singMusic?.stop();
    this.singPhase = null;
    this.singT = 0;
    this.singStarted = false;
    this.singPausedAt = null;
  }

  /* ---------------------------- Plattenspieler --------------------------- */

  /** Anlage (Plattenspieler + beide Boxen) hinter Luni im Dachgeschoss. */
  private drawStereo(c: C) {
    if (this.musikzimmer) return;
    speaker(c, 678, FD, this.plattenBass);
    recordPlayer(c, 698, FD, {
      power: this.plattenPower,
      spin: this.plattenSpin,
      armLift: this.plattenArmLift,
      armTurn: this.plattenArmTurn,
    });
    speaker(c, 754, FD, this.plattenBass);
  }

  /** Klavierlied: Luni spielt es, solange sie am Klavier sitzt (normales Haus und Weihnachtshaus). */
  private updateKlavier(dt: number) {
    const sitzt = this.istNormalHaus && this.activity?.id === "klavier" && !this.cur && !this.pending
      && this.path.length === 0 && this.lf === 3;
    if (!sitzt) {
      this.stopKlavier();
      return;
    }
    this.klavierSitzt = true;
    const musik = this.klavierMusik;
    if (this.klavierSpielt && musik) {
      // Letzte Sekunden des Lieds: der Klang klingt langsam aus.
      if (!this.klavierOutro && musik.currentTime >= musik.dauer - KLAVIER_AUSKLINGEN) {
        this.klavierOutro = "klang";
        this.klavierOutroT = 0;
        musik.blendeAuf(0, KLAVIER_AUSKLINGEN);
      }
      if (this.klavierOutro && musik.currentTime >= musik.dauer) {
        musik.stop();
        this.klavierSpielt = false;
        this.klavierPausiert = null;
        this.klavierOutroT = 0;
      }
      return;
    }
    if (this.klavierOutro) {
      this.updateKlavierOutro(dt);
      return;
    }
    if (this.klavierFertig) return;
    const shared = sfx.getSharedAudio();
    if (!shared) return;
    if (!this.klavierMusik) this.klavierMusik = new KlavierMusik(shared.ctx, shared.master);
    const m = this.klavierMusik;
    if (!m.bereit) {
      if (!this.klavierVorbereitung) {
        this.klavierVorbereitung = m.prepare().catch(() => undefined).finally(() => {
          this.klavierVorbereitung = null;
        });
      }
      return;
    }
    try {
      m.start(this.klavierPausiert ?? 0);
      this.klavierSpielt = true;
      this.klavierPausiert = null;
    } catch {
      // Audio noch gesperrt – im nächsten Bild erneut versuchen.
    }
  }

  /**
   * Ausklang am Klavier: nach dem letzten Ton steht Luni auf, dreht sich zum
   * Spieler und verbeugt sich dankend. Danach ist die Aktivität beendet.
   */
  private updateKlavierOutro(dt: number) {
    this.klavierOutroT += dt;
    const ph = this.klavierOutro;
    if (ph === "klang" && this.klavierOutroT >= KLAVIER_NACHKLANG) {
      this.klavierOutro = "aufstehen";
      this.klavierOutroT = 0;
    } else if (ph === "aufstehen" && this.klavierOutroT >= KLAVIER_AUFSTEHEN) {
      this.klavierOutro = "drehen";
      this.klavierOutroT = 0;
    } else if (ph === "drehen" && this.klavierOutroT >= KLAVIER_DREHEN) {
      this.klavierOutro = "verbeugung";
      this.klavierOutroT = 0;
    } else if (ph === "verbeugung" && this.klavierOutroT >= KLAVIER_VERBEUGUNG) {
      // Verbeugung beendet: Luni steht aufrecht da und ist wieder frei.
      this.klavierOutro = null;
      this.klavierOutroT = 0;
      this.klavierFertig = true;
      this.klavierSitzt = false;
      this.finishActivity();
    }
  }

  /** Weihnachtsbogen auf dem Klavier; die Flammen brennen, solange `kerzenAn` gilt. */
  private drawKlavierBogen(c: C) {
    if (!this.istNormalHaus || this.welt === "gruesel") return;
    if (this.weihnachtsdeko) pianoBogen(c, 545, FD, this.elapsed, 1, this.kerzenAn);
  }

  private stopKlavier() {
    if (this.klavierSitzt || this.klavierSpielt) {
      this.klavierMusik?.stop();
    }
    this.klavierSitzt = false;
    this.klavierSpielt = false;
    this.klavierFertig = false;
    this.klavierPausiert = null;
    this.klavierOutro = null;
    this.klavierOutroT = 0;
  }

  private preparePlatten() {
    sfx.ensure();
    const shared = sfx.getSharedAudio();
    if (!shared) return;
    if (!this.plattenMusic) this.plattenMusic = new PlattenMusic(shared.ctx, shared.master);
    const music = this.plattenMusic;
    if (!this.plattenReady && !this.plattenPreparing) {
      this.plattenPreparing = true;
      void music
        .prepare()
        .then(() => {
          this.plattenReady = true;
        })
        .catch(() => {
          this.plattenReady = false;
          music.dispose();
          if (this.plattenMusic === music) this.plattenMusic = null;
        })
        .finally(() => {
          this.plattenPreparing = false;
        });
    }
  }

  private startPlatten() {
    if (this.plattenPhase) return;
    this.plattenPhase = "switchOn";
    this.plattenT = 0;
    this.plattenPower = false;
    this.plattenArmLift = 0;
    this.plattenArmTurn = 0;
    this.plattenEndFrom = 1;
    this.plattenBass = 0;
    this.plattenStarted = false;
    this.plattenPausedAt = null;
    this.preparePlatten();
  }

  private tryStartPlattenPlayback() {
    if (this.plattenStarted || !this.plattenMusic || !this.plattenReady || this.plattenPausedAt !== null) return;
    if (this.musikzimmer?.active) return;
    const shared = sfx.getSharedAudio();
    if (!shared) return;
    try {
      this.plattenMusic.playAt(shared.ctx.currentTime + 0.05, 0);
      this.plattenStarted = true;
    } catch {
      // Audio noch gesperrt – im nächsten Bild erneut versuchen.
    }
  }

  /**
   * Ein Tanzschritt Richtung Ziel. Auf der Etage tanzt sie sich im übergebenen
   * Tempo fort (kein Rennen), Treppen werden normal begangen. Liefert true,
   * sobald sie am Ziel steht. `rueckwaerts` dreht die Blickrichtung (Moonwalk).
   */
  private tanzSchritt(dt: number, zielFloor: number, zielX: number, tempo: number, rueckwaerts: boolean): { da: boolean; fortschritt: number } {
    if (this.danceTreppe && this.danceTreppeStair) {
      const s = this.danceTreppeStair;
      const len = Math.hypot(s.topX - s.footX, FLOOR_Y[s.upper] - FLOOR_Y[s.lower]);
      this.danceTreppeT = Math.min(1, this.danceTreppeT + (tempo * dt) / len);
      const von = this.danceTreppeDir === 1 ? s.footX : s.topX;
      const zu = this.danceTreppeDir === 1 ? s.topX : s.footX;
      this.lx = lerp(von, zu, this.danceTreppeT);
      this.lface = zu > von ? 1 : -1;
      this.advanceWalk(tempo * dt);
      if (this.danceTreppeT >= 1) {
        this.lf = this.danceTreppeDir === 1 ? s.upper : s.lower;
        this.lx = zu;
        this.danceTreppe = false;
        this.danceTreppeT = 0;
        this.danceTreppeStair = null;
      }
      return { da: false, fortschritt: 0 };
    }
    if (this.lf === zielFloor) {
      const dx = zielX - this.lx;
      if (Math.abs(dx) <= 1.5) {
        this.lx = zielX;
        return { da: true, fortschritt: 1 };
      }
      const schritt = Math.min(Math.abs(dx), tempo * dt);
      this.lx += Math.sign(dx) * schritt;
      this.lface = rueckwaerts ? (dx > 0 ? -1 : 1) : dx > 0 ? 1 : -1;
      return { da: false, fortschritt: 0 };
    }
    const hoch = zielFloor > this.lf;
    const s = STAIRS[hoch ? this.lf : this.lf - 1];
    const einstieg = hoch ? s.footX : s.topX;
    const dx = einstieg - this.lx;
    if (Math.abs(dx) <= 1.5) {
      this.lx = einstieg;
      this.danceTreppe = true;
      this.danceTreppeT = 0;
      this.danceTreppeStair = s;
      this.danceTreppeDir = hoch ? 1 : -1;
      return { da: false, fortschritt: 0 };
    }
    const schritt = Math.min(Math.abs(dx), tempo * dt);
    this.lx += Math.sign(dx) * schritt;
    this.lface = dx > 0 ? 1 : -1;
    return { da: false, fortschritt: 0 };
  }

  /** Weiche Übergänge: beim Wechsel des Tanzes blendet die alte Pose kurz in die neue. */
  private tanzStilSetzen(dt: number, stil: LuniState) {
    if (this.danceStil !== stil) {
      this.danceBlendFrom = this.danceStil;
      this.danceBlendT = 0;
      this.danceStil = stil;
    }
    if (this.danceBlendFrom) {
      this.danceBlendT += dt;
      if (this.danceBlendT >= 0.35) {
        this.danceBlendFrom = null;
        this.danceBlendT = 0;
      }
    }
  }

  /** Sekunden, die der Schritt-Tanz von hier bis zur Anlage braucht (Etagen + Treppen). */
  private tanzRueckwegSek(): number {
    let weg = 0;
    let f = this.lf;
    let x = this.lx;
    if (this.danceTreppe && this.danceTreppeStair) {
      // Auf der Treppe: vorsichtig rechnen, als stünde sie noch ganz unten.
      const s = this.danceTreppeStair;
      f = s.lower;
      x = s.footX;
    }
    while (f < 3) {
      const s = STAIRS[f];
      weg += Math.abs(s.footX - x) + Math.hypot(s.topX - s.footX, FLOOR_Y[s.upper] - FLOOR_Y[s.lower]);
      x = s.topX;
      f++;
    }
    weg += Math.abs(PLATTEN_STAND_X - x);
    return weg / TANZ_SCHRITT_TEMPO;
  }

  /** Tanz-Routine während des Liedes: an jedem Halt tanzt sie auf der Stelle,
   *  dazwischen tanzt sie die Schritte – nie in einer Standpose über den Boden.
   *  Treppen werden mitgetanzt. Wird die Zeit knapp, geht es direkt zur Anlage. */
  private tanzTour(dt: number, musikZeit: number) {
    const tourVorbei = this.danceSeg >= PLATTEN_TOUR.length - 1 && this.danceT >= PLATTEN_TOUR[this.danceSeg].dauer;
    const knapp = musikZeit + this.tanzRueckwegSek() + PLATTEN_RUECKKEHR_RESERVE >= PLATTEN_DURATION_SECONDS;
    if (!this.danceRueck && (tourVorbei || knapp)) {
      this.danceRueck = true;
      this.danceT = 0;
    }
    const rueck = this.danceRueck;
    const ziel = rueck
      ? { floor: 3, x: PLATTEN_STAND_X, stil: "danceArmsUp" as LuniState, dauer: 0, tempo: TANZ_SCHRITT_TEMPO }
      : PLATTEN_TOUR[clamp(this.danceSeg, 0, PLATTEN_TOUR.length - 1)];
    // Unterwegs: Moonwalk und Rutscher nur auf der Zieletage, sonst Schritt-Tanz.
    const aufZieletage = this.lf === ziel.floor && !this.danceTreppe;
    const reiseStil: LuniState = aufZieletage && TANZ_REISE.includes(ziel.stil) ? ziel.stil : "danceSchritt";
    const tempo = reiseStil === "danceSchritt" ? TANZ_SCHRITT_TEMPO : ziel.tempo;
    const weg = this.tanzSchritt(dt, ziel.floor, ziel.x, tempo, reiseStil === "danceMoonwalk");
    if (!weg.da) {
      this.tanzStilSetzen(dt, this.danceTreppe ? "danceSchritt" : reiseStil);
      this.danceT = 0;
      return;
    }
    if (rueck) {
      // An der Anlage: bis zum Liedende fröhlich durch die Tänze wechseln.
      this.danceT += dt;
      const rotation = TANZ_ROTATION[Math.floor(this.danceT / 4) % TANZ_ROTATION.length];
      this.tanzStilSetzen(dt, rotation);
      return;
    }
    this.danceT += dt;
    this.tanzStilSetzen(dt, ziel.stil);
    if (this.danceT >= ziel.dauer && this.danceSeg < PLATTEN_TOUR.length - 1) {
      this.danceT = 0;
      this.danceSeg++;
    }
  }

  private updatePlatten(dt: number) {
    if (!this.plattenPhase) {
      if (this.plattenBass > 0.001) this.plattenBass = Math.max(0, this.plattenBass - dt * 5);
      return;
    }
    this.plattenT += dt;
    // Solange eingeschaltet, dreht sich der Plattenteller (33⅓ U/min ≈ 3,5 rad/s).
    if (this.plattenPower) {
      this.plattenSpin = (this.plattenSpin + dt * 3.5) % (Math.PI * 2);
    }

    if (this.plattenPhase === "switchOn") {
      if (!this.plattenPower && this.plattenT >= 0.5) {
        this.plattenPower = true;
        sfx.ui();
      }
      if (this.plattenT >= 0.95) {
        this.plattenPhase = "stepAside";
        this.plattenT = 0;
      }
      return;
    }

    if (this.plattenPhase === "stepAside") {
      const p = clamp(this.plattenT / 0.65, 0, 1);
      this.lx = lerp(696, 668, sanft(p));
      if (this.plattenT >= 0.65) {
        this.lx = 668;
        this.plattenPhase = "armLift";
        this.plattenT = 0;
      }
      return;
    }

    if (this.plattenPhase === "armLift") {
      this.plattenArmLift = sanft(clamp(this.plattenT / 0.65, 0, 1));
      this.plattenArmTurn = 0;
      if (this.plattenT >= 0.65) {
        this.plattenArmLift = 1;
        this.plattenPhase = "armTurn";
        this.plattenT = 0;
      }
      return;
    }

    if (this.plattenPhase === "armTurn") {
      this.plattenArmLift = 1;
      this.plattenArmTurn = sanft(clamp(this.plattenT / 0.85, 0, 1));
      if (this.plattenT >= 0.85) {
        this.plattenArmTurn = 1;
        this.plattenPhase = "armLower";
        this.plattenT = 0;
      }
      return;
    }

    if (this.plattenPhase === "armLower") {
      this.plattenArmTurn = 1;
      this.plattenArmLift = 1 - sanft(clamp(this.plattenT / 0.65, 0, 1));
      if (this.plattenT >= 0.65) {
        this.plattenArmLift = 0;
        this.plattenPhase = "play";
        this.plattenT = 0;
        this.danceSeg = 0;
        this.danceT = 0;
        this.danceRueck = false;
        this.danceTreppe = false;
        this.danceTreppeT = 0;
        this.danceTreppeStair = null;
        this.danceBlendFrom = null;
        this.danceBlendT = 0;
        this.danceStil = PLATTEN_TOUR[0].stil;
        this.tryStartPlattenPlayback();
      }
      return;
    }

    if (this.plattenPhase === "play") {
      this.plattenArmLift = 0;
      if (!this.plattenStarted) this.tryStartPlattenPlayback();
      const mt = this.plattenStarted ? (this.plattenMusic?.currentTime ?? 0) : this.plattenT;
      const frac = clamp(mt / PLATTEN_DURATION_SECONDS, 0, 1);
      this.plattenArmTurn = 1 + frac * 0.45;
      const zielBass = plattenBassPulse(mt);
      if (zielBass >= this.plattenBass) this.plattenBass = zielBass;
      else this.plattenBass = lerp(this.plattenBass, zielBass, 1 - Math.exp(-18 * dt));
      this.tanzTour(dt, mt);

      if (mt >= PLATTEN_DURATION_SECONDS) {
        this.plattenMusic?.stop();
        this.plattenStarted = false;
        this.plattenEndFrom = this.plattenArmTurn;
        this.plattenPhase = "armEndLift";
        this.plattenT = 0;
      }
      return;
    }

    // Auslauf: Tonarm hebt ab, schwenkt zurück, senkt ab, Anlage aus.
    this.plattenBass = Math.max(0, this.plattenBass - dt * 6);
    if (this.plattenPhase === "armEndLift") {
      this.plattenArmLift = sanft(clamp(this.plattenT / 0.55, 0, 1));
      if (this.plattenT >= 0.55) {
        this.plattenArmLift = 1;
        this.plattenPhase = "armEndTurn";
        this.plattenT = 0;
      }
      return;
    }
    if (this.plattenPhase === "armEndTurn") {
      this.plattenArmLift = 1;
      this.plattenArmTurn = lerp(this.plattenEndFrom, 0, sanft(clamp(this.plattenT / 0.75, 0, 1)));
      if (this.plattenT >= 0.75) {
        this.plattenArmTurn = 0;
        this.plattenPhase = "armEndLower";
        this.plattenT = 0;
      }
      return;
    }
    if (this.plattenPhase === "armEndLower") {
      this.plattenArmTurn = 0;
      this.plattenArmLift = 1 - sanft(clamp(this.plattenT / 0.5, 0, 1));
      if (this.plattenT >= 0.5) {
        this.plattenArmLift = 0;
        this.plattenPower = false;
        this.plattenPhase = null;
        this.plattenT = 0;
        this.activity = null;
        this.target = null;
      }
    }
  }

  private stopPlatten() {
    this.plattenMusic?.stop();
    this.plattenPhase = null;
    this.plattenT = 0;
    this.plattenPower = false;
    this.plattenArmLift = 0;
    this.plattenArmTurn = 0;
    this.plattenBass = 0;
    this.plattenStarted = false;
    this.plattenPausedAt = null;
    this.danceSeg = 0;
    this.danceT = 0;
    this.danceRueck = false;
    this.danceTreppe = false;
    this.danceTreppeT = 0;
    this.danceTreppeStair = null;
    this.danceBlendFrom = null;
    this.danceBlendT = 0;
    this.danceStil = "danceSway";
  }

  /** Gedrehte Zigaretten und Schachtel auf dem Küchentisch */
  private drawCigPile(c: C) {
    // Schachtel liegt immer da; beim Einpacken ist der Deckel offen
    if (!(this.welt === "gruesel" && GRUSELRAEUME.kueche)) cigCase(c, 740, FLOOR_Y[1], this.pack, this.packMove || this.takeMove);
    if (this.packMove) {
      // Zigaretten wandern vom Stapel in die Schachtel
      const p = clamp(this.packT / 1.1, 0, 1);
      for (let i = 0; i < 3; i++) {
        const q = clamp(p * 1.3 - i * 0.12, 0, 1);
        const px = lerp(780, 742, q);
        const py = FLOOR_Y[1] - 38 - Math.sin(q * Math.PI) * 7;
        rect(c, px - 4, py, 8, 1.7, "#f6f3ea");
        rect(c, px + 1.8, py, 2.4, 1.7, "#e2b24a");
      }
    }
    if (this.takeMove) {
      // eine einzelne Zigarette wandert vom Stapel in die Hand
      const p = clamp(this.takeT / 0.9, 0, 1);
      const px = lerp(780, 752, p);
      const py = FLOOR_Y[1] - 38 - Math.sin(p * Math.PI) * 6;
      rect(c, px - 4, py, 8, 1.7, "#f6f3ea");
      rect(c, px + 1.8, py, 2.4, 1.7, "#e2b24a");
    }
    if (this.cigs <= 0) return;
    cigPile(c, 782, FLOOR_Y[1], this.cigs);
    // Die gerade gestopfte Zigarette wird in drawLuniNow an der Hand
    // gezeichnet – nicht als frei schwebender Streifen vor ihr.
  }

  /** Aschenbecher auf dem Tisch im Raucherraum; ein weggelegter Stummel glimmt weiter. */
  /** Aschenbecher und Handy auf dem Tischchen (Hintergrund) */
  /** Aschenbecher mit optionaler Kippung und kleinem Kippenhaufen. */
  private drawAshtrayAt(c: C, x: number, y: number, tilt: number, butts: number) {
    c.save();
    c.translate(x, y);
    c.rotate(tilt);
    c.fillStyle = "#51585c";
    c.beginPath();
    c.ellipse(0, 0, 7, 2.6, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#aeb7b9";
    c.beginPath();
    c.ellipse(0, -0.5, 5.2, 1.35, 0, 0, Math.PI * 2);
    c.fill();
    if (butts > 0) {
      // Kleiner Aschehaufen + ausgedrückte Stummel in der Mulde
      const n = Math.min(butts, 8);
      c.fillStyle = "rgba(116,112,106,.85)";
      c.beginPath();
      c.ellipse(0, -0.7, Math.min(4.6, 1.8 + n * 0.4), Math.min(1.6, 0.7 + n * 0.14), 0, 0, Math.PI * 2);
      c.fill();
      for (let i = 0; i < n; i++) {
        c.save();
        c.translate(((i * 1.7) % 5.4) - 2.7, -0.9 - (i % 3) * 0.45);
        c.rotate(((i % 5) - 2) * 0.34);
        rect(c, -1.6, -0.55, 2.2, 1.1, "#dfd8c5");
        rect(c, 0.6, -0.55, 1.1, 1.1, "#d9a44a");
        c.restore();
      }
    }
    c.restore();
  }

  private drawAshtrayTray(c: C) {
    // Solange sie den Aschenbecher in den Eimer kippt, hält sie ihn in der Hand.
    const inHand = this.activity?.id === "eimer" && this.emptyT >= 0.55 && this.emptyT < 2.0;
    if (!inHand) {
      this.drawAshtrayAt(c, ASH_X, SIDE_TOP - 2, 0, this.ashButts);
    }
    if (this.lightAufTisch) feuerzeug(c, FEUERZEUG_TISCH, FEUERZEUG_LIEGEND);
  }

  /**
   * Die Zigarette im Aschenbecher – immer im Vordergrund, damit sie auch im
   * verqualmten Raum zu sehen ist.
   */
  /**
   * Hält die statische Küchenzeile und die Tee-Handlung auseinander:
   * was Luni in der Hand hat, darf nicht gleichzeitig auf der Zeile stehen.
   */
  private teaSetzeZeile(kanneWeg: boolean, tasseWeg: boolean, fuellung: number) {
    const f = Math.round(clamp(fuellung, 0, 1) * 8) / 8;
    if (kanneWeg !== this.teaKanneWeg || tasseWeg !== this.teaTasseWeg || f !== this.teaFuellung) {
      this.teaKanneWeg = kanneWeg;
      this.teaTasseWeg = tasseWeg;
      this.teaFuellung = f;
      this.dirty = true;
    }
  }

  /**
   * Gesundheitstee mit beiden Händen:
   * Links nimmt die Tasse, rechts die Kanne, gießt ein, stellt die Kanne
   * zurück, dann hebt links zum Trinken (3 Schlucke) und setzt wieder ab.
   */
  private teeZiele(x: number, y: number): {
    rechts: Pt;
    links: Pt;
    kanneTilt: number;
    tasseTilt: number;
    giesst: boolean;
    fuellung: number;
  } {
    const t = this.teaT;
    const ruhR: Pt = [x - 7.6 * LUNI_SCALE, y - 21.5 * LUNI_SCALE];
    const ruhL: Pt = [x + 7.6 * LUNI_SCALE, y - 21.5 * LUNI_SCALE];
    const tasseZeile: Pt = [TEE_TASSE_X, TEA_Y];
    const tasseTief: Pt = [x + 16, y - 20];
    const tasseBereit: Pt = [x + 7, y - 31];
    const tasseMund: Pt = [x + 3.8, y - 39.6];
    const kanneZeile: Pt = [TEA_X, TEA_Y];
    const kanneFrei: Pt = [TEA_X - 1, TEA_Y - 2];
    const kanneGiess: Pt = [x + 1, y - 28.5];
    const schluck = teeSchluck(t);
    const griff = ([bx, by]: Pt, delta: Pt, winkel = 0): Pt => {
      const [dx, dy] = drehen(delta, winkel);
      return [bx + dx, by + dy];
    };
    const bewegung = (a: Pt, b: Pt, start: number, ende: number) => punktMischen(a, b, weich((t - start) / (ende - start)));

    let tasseTilt = 0;
    let links: Pt;
    if (t < 0.4) {
      links = bewegung(ruhL, griff(tasseZeile, TASSENGRIFF), 0, 0.4);
    } else if (t < 0.9) {
      links = griff(bewegung(tasseZeile, tasseTief, 0.4, 0.9), TASSENGRIFF);
    } else if (t < 4.6) {
      links = griff(tasseTief, TASSENGRIFF);
    } else if (t < TEE_SCHLUCK.start) {
      links = griff(bewegung(tasseTief, tasseBereit, 4.6, TEE_SCHLUCK.start), TASSENGRIFF);
    } else if (t < TEE_TRINKEN_ENDE) {
      tasseTilt = -0.55 * schluck.hub;
      links = griff(punktMischen(tasseBereit, tasseMund, schluck.hub), TASSENGRIFF, tasseTilt);
    } else if (t < TEE_ABGESETZT) {
      links = griff(bewegung(tasseBereit, tasseZeile, TEE_TRINKEN_ENDE, TEE_ABGESETZT), TASSENGRIFF);
    } else {
      links = bewegung(griff(tasseZeile, TASSENGRIFF), ruhL, TEE_ABGESETZT, TEA_DAUER);
    }

    // Am Henkel greifen, kurz von der Platte abheben und vor der Brust senken.
    let rechts: Pt = ruhR;
    let kanneTilt = 0;
    if (t >= 0.8 && t < 1.1) {
      rechts = bewegung(ruhR, griff(kanneZeile, KANNENGRIFF), 0.8, 1.1);
    } else if (t >= 1.1 && t < 1.6) {
      kanneTilt = 0.72 * weich((t - 1.26) / 0.34);
      const boden = t < 1.26 ? bewegung(kanneZeile, kanneFrei, 1.1, 1.26) : bewegung(kanneFrei, kanneGiess, 1.26, 1.6);
      rechts = griff(boden, KANNENGRIFF, kanneTilt);
    } else if (t >= 1.6 && t < 3.8) {
      kanneTilt = 0.72;
      rechts = griff(kanneGiess, KANNENGRIFF, kanneTilt);
    } else if (t >= 3.8 && t < 4.4) {
      kanneTilt = 0.72 * (1 - weich((t - 3.8) / 0.42));
      const boden = t < 4.22 ? bewegung(kanneGiess, kanneFrei, 3.8, 4.22) : bewegung(kanneFrei, kanneZeile, 4.22, 4.4);
      rechts = griff(boden, KANNENGRIFF, kanneTilt);
    } else if (t >= 4.4 && t < 4.9) {
      rechts = bewegung(griff(kanneZeile, KANNENGRIFF), ruhR, 4.4, 4.9);
    }

    const giesst = t >= 1.6 && t < 3.8;
    const fuellung = teeFuellstand(t, schluck.getrunken);
    return { rechts, links, kanneTilt, tasseTilt, giesst, fuellung };
  }

  private drawTee(c: C, z: ReturnType<House["teeZiele"]>, frontHand: Pt, rearHand: Pt) {
    const t = this.teaT;
    const [cupX, cupY] = drehen(TASSENGRIFF, z.tasseTilt);
    const cx = rearHand[0] - cupX;
    const cy = rearHand[1] - cupY;

    if (t >= 0.4 && t < TEE_ABGESETZT) {
      teaCup(c, cx, cy, z.fuellung, z.tasseTilt);
    }
    if (t >= 1.1 && t < 4.4) {
      const [griffX, griffY] = drehen(KANNENGRIFF, z.kanneTilt);
      const kx = frontHand[0] - griffX;
      const ky = frontHand[1] - griffY;
      teaKettle(c, kx, ky, z.kanneTilt);
      if (z.giesst) {
        const [ausgussX, ausgussY] = drehen(AUSGUSS, z.kanneTilt);
        const sx = kx + ausgussX;
        const sy = ky + ausgussY;
        c.strokeStyle = "rgba(158,201,138,.85)";
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(sx, sy);
        c.quadraticCurveTo(sx + 1.2, (sy + cy - 5) / 2, cx, cy - 5);
        c.stroke();
        const pl = 0.5 + Math.sin(this.elapsed * 18) * 0.5;
        disc(c, cx + Math.sin(this.elapsed * 9) * 1.2, cy - 5.4, 0.5 + pl * 0.4, "rgba(185,220,166,.8)");
      }
    }
    if (z.fuellung > 0.15 && t >= 0.4 && t < TEE_ABGESETZT) {
      for (let i = 0; i < 3; i++) {
        const p = (this.elapsed * 0.35 + i * 0.33) % 1;
        const a = (1 - p) * 0.3 * z.fuellung;
        const dx = cx + Math.sin(this.elapsed * 1.1 + i * 2) * (1 + p * 2);
        const dy = cy - 6 - p * 12;
        c.strokeStyle = `rgba(226,236,230,${a})`;
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(dx, dy + 3);
        c.quadraticCurveTo(dx + 1.8, dy + 1, dx - 1.2, dy - 2);
        c.stroke();
      }
    }
  }

  private drawAshtrayButt(c: C) {
    const puff = this.quenchPuff;
    if (!this.cigButt && puff <= 0) return;
    const lit = this.cigButt && this.burnLeft > 0;
    const x = ASH_X;
    const y = SIDE_TOP - 2;
    // Auf dem Rand liegende Zigarette: Filter fest rechts (+3.4..+6), brennt langsam von links ab.
    const rest = this.burnFrac();
    const paper = 2.0 + 6.4 * rest;
    const burnTip = 3.4 - paper;
    const ash = (1 - rest) * 3.8;
    if (this.cigButt) {
      c.save();
      c.translate(x - 1.5, y - 2.1);
      c.rotate(-0.16);
      // ragt rechts aus der Mulde heraus, Filter bleibt am Rand liegen
      rect(c, burnTip, -1.3, paper, 2.6, lit ? "#f6f0dc" : "#cfc8bb");
      rect(c, 3.4, -1.3, 2.6, 2.6, "#e2b24a");
      if (ash > 0.12) {
        rect(c, burnTip - ash, -1.15, ash + 0.3, 2.3, "#8e887f");
        rect(c, burnTip - ash, -1.15, ash + 0.3, 0.75, "#a9a29a");
      }
      if (lit) {
        const ember = 0.7 + Math.sin(this.elapsed * 3.2) * 0.2;
        disc(c, burnTip, 0, 1.2, `rgba(255,115,45,${ember})`);
        disc(c, burnTip - 0.4, -0.2, 0.55, `rgba(255,222,155,${ember})`);
      }
      c.restore();
    }
    // Beim Ausdrücken steigt ein letzter kräftiger Schwall auf.
    if (puff > 0) {
      const k = 1 - puff / 1.1;
      for (let i = 0; i < 5; i++) {
        const p = (k * 1.4 + i * 0.2) % 1;
        const alpha = (1 - p) * 0.42 * (puff / 1.1);
        const sx = x - 3 + Math.sin(i * 2.1 + k * 3) * (2 + p * 5);
        c.strokeStyle = `rgba(226,233,238,${alpha})`;
        c.lineWidth = 1.2 + p * 1.4;
        c.beginPath();
        c.moveTo(sx, y - 3 - p * 26 + 4);
        c.quadraticCurveTo(sx + 3, y - 3 - p * 26, sx - 2.5, y - 3 - p * 26 - 5);
        c.stroke();
      }
    }
    // Rauch aus dem Aschenbecher – nur solange die Zigarette noch brennt
    if (!lit) return;
    for (let i = 0; i < 5; i++) {
      const p = (this.elapsed * 0.13 + i * 0.27) % 1;
      const alpha = (1 - p) * 0.38;
      const sx = x - 3 + Math.sin(this.elapsed * 0.7 + i * 1.9) * (1.2 + p * 2.4);
      const sy = y - 3 - p * 26;
      c.strokeStyle = `rgba(220,228,234,${alpha})`;
      c.lineWidth = 1 + p * 0.9;
      c.beginPath();
      c.moveTo(sx, sy + 4);
      c.quadraticCurveTo(sx + 2.5, sy, sx - 2, sy - 4);
      c.stroke();
    }
  }


  /** Rauch in der Raucherecke */
  private drawSmoke(c: C) {
    // Rauch im Krempelraum (durch die offene Schleusentür) zuerst zeichnen,
    // damit der Rauch im Rauchzimmer darüber liegt.
    this.drawSpillSmoke(c);
    const s = this.smoke;
    if (s < 0.012) return;
    // nur die Raucherecke: rechts der Kellertrennwand, unter der EG-Decke
    const x0 = 594;
    const y0 = 462;
    const w = 244;
    const h = 110;
    c.save();
    c.beginPath();
    c.rect(x0, y0, w, h);
    c.clip();
    for (let i = 0; i < 11; i++) {
      const ph = (this.elapsed * 0.13 + i * 0.19) % 1;
      const cx = x0 + 26 + ((i * 61) % 184) + Math.sin(this.elapsed * 0.32 + i * 1.4) * 14;
      const cy = y0 + h * (1 - ph) + 26;
      const r = 38 + (i % 4) * 18;
      const a = s * (0.42 + 0.3 * Math.sin(this.elapsed * 0.5 + i * 1.7)) * (1 - ph * 0.3);
      if (a <= 0) continue;
      const g = c.createRadialGradient(cx, cy, 2, cx, cy, r);
      g.addColorStop(0, `rgba(214,221,228,${Math.min(0.92, a)})`);
      g.addColorStop(0.55, `rgba(206,214,222,${Math.min(0.7, a * 0.7)})`);
      g.addColorStop(1, "rgba(206,214,222,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
    }
    // Bei vollem Rauch verschwindet die Ecke komplett
    if (s > 0.72) {
      c.fillStyle = `rgba(210,217,224,${(s - 0.72) * 3.2})`;
      c.fillRect(x0, y0, w, h);
    }
    c.restore();
  }

  /**
   * Rauch, der bei offener Gartentür sichtbar nach draußen in den Garten
   * abzieht: Schwaden wandern aus dem Rauchzimmer durch den Türspalt nach
   * rechts und verwehen. Die Stärke folgt Türöffnung und Rauchmenge;
   * direkt nach dem Öffnen gibt es einen kräftigeren Stoß.
   */
  private drawVentSmoke(c: C) {
    const open = this.gardenDoor;
    if (open < 0.05) return;
    const gust = this.ventGust / this.ventMax; // 1 -> 0
    const strength = clamp(this.smoke + this.smokeSpill * 0.3, 0, 1);
    if (strength < 0.02 && gust <= 0) return;

    // Türspalt in der rechten Kellerwand; der Garten liegt rechts davon
    const dx = HR - 1; // 829
    c.save();

    // Wandernde Schwaden: entstehen drinnen, queren den Spalt, verwehen draußen
    const n = 6;
    for (let i = 0; i < n; i++) {
      const p = (this.elapsed * 0.22 + i / n) % 1;
      const cx = lerp(dx - 46, dx + 74, p) + Math.sin(this.elapsed * 1.6 + i * 2.1) * 7;
      const cy = lerp(528, 496, p) + Math.sin(i * 2.7) * 12 + Math.sin(this.elapsed + i) * 4;
      const r = 12 + p * 30 + (i % 3) * 5;
      const a = open * (strength * 0.5 + gust * 0.35) * Math.sin(p * Math.PI);
      if (a <= 0.01) continue;
      const g = c.createRadialGradient(cx, cy, 2, cx, cy, r);
      g.addColorStop(0, `rgba(216,224,230,${Math.min(0.8, a)})`);
      g.addColorStop(0.6, `rgba(208,216,224,${Math.min(0.6, a * 0.7)})`);
      g.addColorStop(1, "rgba(208,216,224,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
    }

    // Sog-Faden direkt im Türspalt, solange Tür offen und Rauch vorhanden
    const thread = open * strength * 0.3;
    if (thread > 0.01) {
      const g = c.createLinearGradient(dx - 6, 0, dx + 8, 0);
      g.addColorStop(0, "rgba(216,224,230,0)");
      g.addColorStop(1, `rgba(216,224,230,${Math.min(0.5, thread)})`);
      c.fillStyle = g;
      c.fillRect(dx - 6, 490, 20, 76);
    }
    c.restore();
  }

  /**
   * Rauch, der durch die offene Schleusentür in den Krempelraum zieht.
   * Dazu der kräftige Rauchstoß direkt beim Öffnen der vollen Tür.
   */
  private drawSpillSmoke(c: C) {
    const spill = this.smokeSpill;
    const gust = this.smokeGust / this.gustMax; // 1 -> 0
    if (spill < 0.012 && gust <= 0) return;

    const x0 = CEL_X0 + 2;
    const y0 = 462;
    const w = 590 - x0 - 2;
    const h = 110;

    c.save();
    c.beginPath();
    c.rect(x0, y0, w, h);
    c.clip();

    // Grundnebel im Krempelraum – zieht von der Tür nach links
    if (spill > 0.012) {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const ph = (this.elapsed * 0.1 + i * 0.17) % 1;
        const cx = x0 + w * (0.86 - (i / n) * 0.8) + Math.sin(this.elapsed * 0.3 + i * 1.3) * 16;
        const cy = y0 + h * (1 - ph * 0.5) + 18;
        const r = 36 + (i % 4) * 17;
        const a = spill * (0.4 + 0.28 * Math.sin(this.elapsed * 0.45 + i)) * (1 - ph * 0.35);
        if (a <= 0.004) continue;
        const g = c.createRadialGradient(cx, cy, 2, cx, cy, r);
        g.addColorStop(0, `rgba(212,220,226,${Math.min(0.9, a)})`);
        g.addColorStop(0.6, `rgba(204,213,220,${Math.min(0.68, a * 0.7)})`);
        g.addColorStop(1, "rgba(204,213,220,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.fill();
      }
      // dichter Dunst am Boden der Durchreichung
      c.fillStyle = `rgba(210,218,224,${spill * 0.16})`;
      c.fillRect(x0, y0 + h * 0.55, w, h * 0.45);
    }

    // Rauchstoß: Schwaden fliegen aus der Tür in den Krempelraum
    if (gust > 0) {
      const progress = 1 - gust; // 0 = frisch geöffnet, 1 = vorbei
      for (let i = 0; i < 9; i++) {
        const ph = clamp(progress * 1.35 - i * 0.07, 0, 1);
        if (ph <= 0) continue;
        const cx = lerp(600, x0 + 18, ph) + Math.sin(this.elapsed * 2 + i * 1.7) * 10;
        const cy = y0 + h * 0.52 + Math.sin(i * 2.3) * 22 - ph * 10;
        const r = 20 + ph * 52 + (i % 3) * 12;
        const a = gust * 0.55 * (1 - ph * 0.35);
        const g = c.createRadialGradient(cx, cy, 2, cx, cy, r);
        g.addColorStop(0, `rgba(216,224,230,${Math.min(0.85, a)})`);
        g.addColorStop(0.6, `rgba(206,215,222,${Math.min(0.6, a * 0.7)})`);
        g.addColorStop(1, "rgba(206,215,222,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.fill();
      }
    }

    // an der Tür selbst: durchgehender Rauchfaden im Durchgang
    if (this.cellarDoorV > 0.25) {
      const a = Math.max(spill, gust) * 0.3;
      if (a > 0.01) {
        const g = c.createLinearGradient(560, 0, 600, 0);
        g.addColorStop(0, "rgba(206,214,222,0)");
        g.addColorStop(1, `rgba(216,224,230,${a})`);
        c.fillStyle = g;
        c.fillRect(560, y0 + 6, 40, h - 12);
      }
    }
    c.restore();
  }

  /**
   * Eingebettetes GIF für das Musikvideo, falls in RICK_GIF_DATA hinterlegt.
   * Animierte GIFs laufen in drawImage von selbst weiter.
   */
  private rickImage(): HTMLImageElement | null {
    if (!RICK_GIF_DATA) return null;
    if (typeof Image === "undefined") return null;
    if (!this.rickTried) {
      this.rickTried = true;
      try {
        this.rickImg = new Image();
        this.rickImg.src = RICK_GIF_DATA;
      } catch {
        this.rickImg = null;
      }
    }
    const img = this.rickImg;
    if (img && img.complete && img.naturalWidth > 0) return img;
    return null;
  }

  /** Umschalt-Statik: deterministisches Rauschen, damit jeder Frame reproduzierbar ist. */
  private drawTVStatic(c: C, x: number, y: number, w: number, h: number, seed: number) {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const v = Math.floor(hash(px * 12.9898 + py * 78.233 + seed * 0.731) * 255);
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(x + px, y + py, 1, 1);
      }
    }
  }

  /**
   * Musikvideo im Wohnzimmer-TV: Sternenhimmel mit Glitzern, tanzender
   * Sänger mit Vintage-Mikro und Laufband-Refrain. Mini-Version im
   * Haus-Stil; bei hinterlegtem RICK_GIF_DATA läuft das echte GIF.
   */
  private drawRickTV(c: C, x: number, y: number, w: number, h: number, t: number) {
    const img = this.rickImage();
    if (img) {
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      return;
    }

    // Nachthimmel mit leichtem Verlauf
    const sky = c.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, "#0a0e22");
    sky.addColorStop(1, "#04060f");
    c.fillStyle = sky;
    c.fillRect(x, y, w, h);

    // funkelnde Sterne
    for (let i = 0; i < 26; i++) {
      const sx = x + hash(i * 1.37 + 4) * w;
      const sy = y + hash(i * 2.11 + 9) * (h - 7);
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.7 + i * 1.3));
      c.globalAlpha = tw;
      c.fillStyle = "#e8f2ff";
      const s = hash(i * 3.7 + 1) > 0.8 ? 1.6 : 1;
      c.fillRect(sx, sy, s, s);
    }
    c.globalAlpha = 1;

    // Lens-Flares wie im Video
    for (let i = 0; i < 3; i++) {
      const fx = x + w * (0.2 + 0.3 * i) + Math.sin(t * 0.6 + i * 2.2) * 2;
      const fy = y + h * (0.3 + 0.18 * ((i * 2 + 1) % 3));
      const fr = 4.5 + Math.sin(t * 2 + i) * 1.2;
      const fg = c.createRadialGradient(fx, fy, 0.5, fx, fy, fr);
      fg.addColorStop(0, "rgba(255,255,255,.9)");
      fg.addColorStop(0.35, "rgba(160,220,255,.35)");
      fg.addColorStop(1, "rgba(160,220,255,0)");
      c.fillStyle = fg;
      c.beginPath();
      c.arc(fx, fy, fr, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(200,235,255,.5)";
      c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(fx - fr - 1.5, fy);
      c.lineTo(fx + fr + 1.5, fy);
      c.moveTo(fx, fy - fr - 1.5);
      c.lineTo(fx, fy + fr + 1.5);
      c.stroke();
    }

    // zwei schwebende Leuchtkugeln
    disc(c, x + w * 0.12 + Math.sin(t * 0.9) * 2, y + h * 0.72, 1.8, "#ffe9a8");
    disc(c, x + w * 0.88 + Math.cos(t * 0.7) * 2, y + h * 0.24, 1.5, "#ffd166");

    // Die Roehrenstreifen gehoeren hinter den Saenger, nicht ueber sein Gesicht.
    this.drawTVScanlines(c, x, y, w, h);

    // Sänger: wiegt sich im Takt, Mikro auf Stativ davor
    const sway = Math.sin(t * 2.4) * 1.6;
    const bob = Math.abs(Math.sin(t * 4.8)) * 1.1;
    const cx = x + w * 0.5 + sway;
    const feetY = y + h - 7 - bob * 0.4;
    const headY = feetY - 13.5 - bob;
    // Beine / Schuhe
    rect(c, cx - 3.4, feetY - 4.5, 2.6, 4.5, "#14141c");
    rect(c, cx + 0.8, feetY - 4.5, 2.6, 4.5, "#14141c");
    // Sakko
    rrect(c, cx - 4.6, feetY - 12.5, 9.2, 8.6, 1.6, "#23232e");
    // Revers-Kanten
    line(c, cx - 1.2, feetY - 12.2, cx - 2.6, feetY - 5.4, "#3a3a4c", 0.9);
    line(c, cx + 1.2, feetY - 12.2, cx + 2.6, feetY - 5.4, "#3a3a4c", 0.9);
    // Hemd + Streifen
    poly(c, [[cx - 1.6, feetY - 12.2], [cx + 1.6, feetY - 12.2], [cx, feetY - 8.6]], "#f2ede2");
    for (let i = 0; i < 3; i++) {
      rect(c, cx - 1.1, feetY - 11 + i * 1.2, 2.2, 0.55, "#23232e");
    }
    // Arme: links locker, rechts gestikulierend
    const wave = Math.sin(t * 2.4 + 1.2) * 2.2;
    line(c, cx - 4.4, feetY - 11.5, cx - 6.2, feetY - 6.5, "#23232e", 1.8);
    disc(c, cx - 6.2, feetY - 6.2, 1, "#f4c9a0");
    line(c, cx + 4.4, feetY - 11.5, cx + 6 + wave * 0.4, feetY - 9 + wave, "#23232e", 1.8);
    disc(c, cx + 6 + wave * 0.4, feetY - 9 + wave, 1, "#f4c9a0");
    // Kopf mit Tolle
    disc(c, cx, headY, 3, "#f4c9a0");
    c.fillStyle = "#8a4a26";
    c.beginPath();
    c.arc(cx, headY - 1.1, 3.1, Math.PI * 1.02, Math.PI * 2.02);
    c.fill();
    c.beginPath();
    c.ellipse(cx - 0.6, headY - 3.6, 2.4, 1.5, -0.25, 0, Math.PI * 2);
    c.fill();
    // Vintage-Mikro auf Stativ
    line(c, cx + 4.6, feetY - 1, cx + 4.6, headY + 1.5, "#8a8f98", 0.9);
    disc(c, cx + 4.6, headY + 0.4, 1.7, "#c8ccd4");
    line(c, cx + 4.6, headY + 0.4, cx + 4.6, headY + 2.2, "#6a6e78", 0.7);

    // Laufband-Refrain
    const label = "♪ NEVER GONNA GIVE YOU UP • NEVER GONNA LET YOU DOWN • ";
    c.font = '700 4px "Silkscreen", monospace';
    let tw = 120;
    try {
      tw = c.measureText(label).width;
    } catch {
      /*Fallback-Breite*/
    }
    c.fillStyle = "rgba(0,0,0,.55)";
    c.fillRect(x, y + h - 6, w, 6);
    c.fillStyle = "#ffd166";
    const off = (t * 10) % tw;
    c.fillText(label, x + 2 - off, y + h - 1.8);
    c.fillText(label, x + 2 - off + tw, y + h - 1.8);
  }

  /** Welcher Inhalt aktuell auf einem der beiden TV-Geräte läuft. */
  private tvContent(which: TVId): TVInhalt {
    if (this.tvManual[which] === false) return "off";
    const gewaehlt = this.tvDaten[which].kanal;
    if (gewaehlt && ((this.activity?.screen === which && !this.cur) || this.tvManual[which] === true)) {
      return tvKanaele(which, this.golInserted, this.flauschiAktiv).includes(gewaehlt) ? gewaehlt : "garten";
    }
    if (which === "tv_d" && this.golInserted && this.tvMode === "gol" && this.golState) return "gol";
    if ((this.activity?.screen === which && !this.cur) || this.tvManual[which] === true) {
      return which === "tv_d" && this.tvMode === "console" ? "console" : "cozy";
    }
    return "off";
  }

  private tvKanal(which: TVId): TVKanal {
    const inhalt = this.tvContent(which);
    if (inhalt === "cozy") return this.harvestClock % TV_CYCLE < TV_RICK_AT ? "garten" : "musik";
    if (inhalt === "console") return "konsole";
    if (inhalt === "off") return this.tvDaten[which].kanal ?? "garten";
    return inhalt;
  }

  private tvBefehl(id: TVBefehl) {
    const which = this.tvZoom;
    if (!which) return;
    sfx.ensure();
    const daten = this.tvDaten[which];
    if (id === "power") this.toggleTvPower(which);
    else if (id === "kanal_hoch" || id === "kanal_runter") {
      daten.kanal = tvNaechsterKanal(which, this.tvKanal(which), id === "kanal_hoch" ? 1 : -1, this.golInserted, this.flauschiAktiv);
      this.tvManual[which] = true;
      if (daten.kanal === "gol" && !this.golState) this.golState = createState();
    } else daten.lautstaerke = clamp(daten.lautstaerke + (id === "lauter" ? 10 : -10), 0, 100);
    this.updateTVAudio();
    this.speichern();
    sfx.ui();
  }

  private updateTVAudio() {
    const shared = sfx.peekSharedAudio();
    if (!shared) return;
    if (document.visibilityState === "hidden") {
      this.tvKlang.tv_e?.stop(); this.tvKlang.tv_d?.stop();
      return;
    }
    for (const id of ["tv_e", "tv_d"] as const) {
      const an = this.tvContent(id) !== "off";
      if (an && !this.tvKlang[id]) this.tvKlang[id] = new TVKlang(shared.ctx, shared.master);
      this.tvKlang[id]?.setze(an ? this.tvKanal(id) : null, this.tvDaten[id].lautstaerke, this.harvestClock);
    }
  }

  private drawTVScanlines(c: C, x: number, y: number, w: number, h: number) {
    c.fillStyle = "rgba(0,0,0,.12)";
    for (let i = 0; i < h; i += 3) c.fillRect(x, y + i, w, 1);
  }

  /** Läuft auf den beiden Fernsehern im Haus (klein) und in der Vergrößerung (groß). */
  private drawScreens(c: C) {
    const mD = this.tvContent("tv_d");
    if (mD !== "off") {
      c.save();
      c.beginPath();
      c.rect(410, 137, 54, 34);
      c.clip();
      this.drawTvProgram(c, 410, 137, 54, 34, mD);
      c.restore();
    }
    const mE = this.tvContent("tv_e");
    if (mE !== "off") {
      c.save();
      c.beginPath();
      c.rect(445, 395, 40, 26);
      c.clip();
      this.drawTvProgram(c, 445, 395, 40, 26, mE);
      c.restore();
    }
  }

  /** Zeichnet das aktive TV-Bild (Harvest/Musikvideo, Konsole oder Spiel des Lebens) in den Bereich (x, y, w, h). */
  private drawTvProgram(c: C, x: number, y: number, w: number, h: number, mode: Exclude<TVInhalt, "off">) {
    const cozy = mode === "cozy" || mode === "garten" || mode === "musik";
    const t = cozy ? this.harvestClock : this.elapsed;

    if (cozy) {
      // Wohnzimmer-Kanäle: Harvest-Spiel und Musikvideo im Wechsel,
      // dazwischen kurz Umschalt-Statik wie bei einem echten Röhren-TV.
      const tt = mode === "garten" ? 1 : mode === "musik" ? TV_RICK_AT + 1 : t % TV_CYCLE;
      const inStatic = mode === "cozy" && (tt < TV_STATIC_LEN || (tt >= TV_RICK_AT && tt < TV_RICK_AT + TV_STATIC_LEN));
      if (inStatic) {
        this.drawTVStatic(c, x, y, w, h, Math.floor(t * 12));
      } else if (tt < TV_RICK_AT) {
        // ── HARVEST GAME ──────────────────────────────────────────────
        const dayLen = 240;
        const dayP = (t % dayLen) / dayLen;
        const seasons = [
          { n: "FRÜJAHR", top: "#a8dff0", grs: "#79c981", tint: 0 },
          { n: "SOMMER", top: "#7fcdef", grs: "#6bbb74", tint: 0 },
          { n: "HERBST", top: "#c9d8e4", grs: "#a8b96a", tint: 0.35 },
          { n: "WINTER", top: "#dfe9f2", grs: "#cfe0e8", tint: 0.75 },
        ];
        const season = seasons[Math.floor(dayP * 4) % 4];
        const dayT = (dayP * 4) % 1;

        // Himmel (morgens/abends wärmer)
        const warm = Math.max(0, 1 - Math.min(dayT, 1 - dayT) * 5);
        const sky = c.createLinearGradient(0, y, 0, y + h * 0.55);
        sky.addColorStop(0, mix(season.top, "#f7c98a", warm * 0.55));
        sky.addColorStop(1, mix(season.top, "#e8e2cf", warm * 0.3));
        c.fillStyle = sky;
        c.fillRect(x, y, w, h * 0.58);

        // Sonne wandert
        disc(c, x + w * (0.12 + dayT * 0.76), y + h * (0.3 - Math.sin(dayT * Math.PI) * 0.18), 2.4, "#ffe9a8");

        // Felder
        c.fillStyle = season.grs;
        c.fillRect(x, y + h * 0.5, w, h * 0.5);
        const cols = ["#7a5233", "#8a5f3b"];
        const fw = w / 3.4;
        const fh = h * 0.115;
        const crops = ["karotte", "kuerbis", "tomate", "salat"];
        const fieldPoint = (i: number): Pt => [
          x + 3 + (i % 3) * (fw + 1.5) + fw * 0.5,
          y + h * 0.5 + Math.floor(i / 3) * (fh + 2) + fh * 0.75,
        ];
        for (let i = 0; i < 6; i++) {
          const cx = x + 3 + (i % 3) * (fw + 1.5);
          const cy = y + h * 0.5 + Math.floor(i / 3) * (fh + 2) + 1.5;
          rect(c, cx, cy, fw, fh, cols[i % 2]);
          rect(c, cx, cy, fw, 1.2, "rgba(255,255,255,.12)");
          const growth = this.harvestCrops[i];
          const ripe = growth >= 0.999;
          const col = crops[i % 4];
          const tending = !this.harvestMoving && i === this.harvestSpot;
          if (tending) {
            c.strokeStyle = "rgba(255,233,168,.6)";
            c.lineWidth = 0.7;
            c.strokeRect(cx + 0.8, cy + 0.8, fw - 1.6, fh - 1.6);
          }
          for (let k = 0; k < 3; k++) {
            const px = cx + fw * (0.22 + k * 0.28);
            const py = cy + fh * 0.62;
            c.fillStyle = ripe ? "#3f8f4f" : "#6fae5a";
            c.beginPath();
            c.ellipse(px, py - fh * 0.3 * growth, fw * 0.075 * growth + 0.5, fh * 0.2 * growth + 0.4, 0, 0, Math.PI * 2);
            c.fill();
            if (growth > 0.45) {
              const fs = (fw * 0.075) * growth;
              if (col === "karotte") rect(c, px - fs * 0.35, py, fs * 0.7, fs * 1.5, "#e8722f");
              else if (col === "kuerbis") disc(c, px, py + fs * 0.5, fs * 1.1, "#e8912f");
              else if (col === "tomate") disc(c, px, py + fs * 0.4, fs * 0.85, "#d9453a");
              else disc(c, px, py + fs * 0.3, fs * 0.9, "#a8d94f");
            }
            if (ripe && tending && Math.sin(t * 1.8 + i * 2 + k) > 0.96) {
              c.fillStyle = "#ffe9a8";
              c.fillRect(px - 0.6, py - fh * 0.95, 1.2, 2.4);
            }
          }
          if (ripe) {
            c.strokeStyle = "rgba(255,233,168,.85)";
            c.lineWidth = 0.8;
            c.strokeRect(cx + 0.4, cy + 0.4, fw - 0.8, fh - 0.8);
          }
        }

        // Scheune oben rechts
        const bx = x + w * 0.72;
        const by = y + h * 0.3;
        rect(c, bx, by, w * 0.2, h * 0.2, "#c9453a");
        poly(c, [[bx - 1.2, by], [bx + w * 0.1, by - h * 0.1], [bx + w * 0.2 + 1.2, by]], "#8f2f27");
        rect(c, bx + w * 0.07, by + h * 0.06, w * 0.06, h * 0.14, "#8f2f27");

        // Bäume
        for (let i = 0; i < 3; i++) {
          const tx = x + w * (0.08 + i * 0.09);
          const ty = y + h * 0.47;
          rect(c, tx - 0.7, ty, 1.4, h * 0.06, "#6b4a2a");
          const leaf = season.n === "WINTER" ? "#e8f0f6" : season.n === "HERBST" ? "#d98f3c" : "#3f8f5f";
          disc(c, tx, ty - h * 0.03, h * 0.07, leaf);
        }

        // Bauer
        const from = fieldPoint(this.harvestMoving ? this.harvestFrom : this.harvestSpot);
        const to = fieldPoint(this.harvestMoving ? this.harvestTo : this.harvestSpot);
        const moveP = this.harvestMoving ? this.harvestMoveT * this.harvestMoveT * (3 - 2 * this.harvestMoveT) : 0;
        const tx = lerp(from[0], to[0], moveP);
        const ty = lerp(from[1], to[1], moveP);
        const bob = this.harvestMoving ? Math.abs(Math.sin(t * 1.3)) * 0.45 : Math.sin(t * 0.5) * 0.12;
        const cropReady = this.harvestCrops[this.harvestSpot] >= 1;
        const crouch = !this.harvestMoving && (cropReady || this.harvestCrops[this.harvestSpot] > 0) ? 1 : 0;
        const bodyY = bob + crouch * 1.2;
        c.fillStyle = "#33566b";
        c.fillRect(tx - 1.6, ty - 5.5 + bodyY, 3.2, 4);
        c.fillStyle = "#e8a33d";
        c.fillRect(tx - 1.9, ty - 9.5 + bodyY, 3.8, 4.2);
        disc(c, tx, ty - 11.5 + bodyY, 1.9, "#f4c9a0");
        c.fillStyle = "#4a3126";
        c.beginPath();
        c.arc(tx, ty - 12.2 + bodyY, 1.95, Math.PI * 1.02, Math.PI * 2.08);
        c.fill();
        c.fillStyle = "#b98a4a";
        c.fillRect(tx + 2.4, ty - 3.5 + bodyY, 2.6, 2.2);
        c.fillStyle = "#e8912f";
        c.fillRect(tx + 2.6, ty - 4 + bodyY, 2.2, Math.min(2, this.harvestCrops[this.harvestSpot] * 2));
        if (!this.harvestMoving && cropReady && Math.sin(t * 3) > 0.45) {
          disc(c, tx + 4, ty - 10, 1.2, "#ffe9a8");
        }

        // Wolke
        const cl = x + ((t * 2) % (w + 18)) - 9;
        c.fillStyle = "rgba(255,255,255,.92)";
        c.beginPath();
        c.ellipse(cl, y + h * 0.16, w * 0.11, h * 0.055, 0, 0, Math.PI * 2);
        c.ellipse(cl + w * 0.07, y + h * 0.17, w * 0.08, h * 0.045, 0, 0, Math.PI * 2);
        c.fill();

        // HUD: Jahreszeit + Münzen
        c.fillStyle = "rgba(12,28,34,.6)";
        c.fillRect(x + 1.5, y + 1.5, w * 0.42, h * 0.16);
        c.fillStyle = "#ffe9a8";
        c.font = '700 4px "Silkscreen", monospace';
        c.fillText(season.n, x + 3.2, y + h * 0.085);
        c.fillText(`${this.harvestCoins} G`, x + 3.2, y + h * 0.145);
        disc(c, x + w * 0.3, y + h * 0.12, 1.4, "#ffd166");
      } else {
        this.drawRickTV(c, x, y, w, h, t);
      }
      c.fillStyle = "#eef7f2";
      c.font = '700 4px "Silkscreen", monospace';
      c.fillText(tt < TV_RICK_AT ? "CH1" : "CH2", x + 2, y + 5);
      c.fillStyle = "#ff5d8f";
      c.fillText("♪", x + w - 6, y + 5);
    } else if (mode === "flauschi" && this.flauschiState) {
      // Kleine Bühne im Haus: dieselbe Szene, nur kleiner.
      drawFlauschiSzene(c, x, y, w, h, this.elapsed, this.flauschiState, this.flauschiOffen());
    } else if (mode === "gol" && this.golState) {
      drawGridCoarse(c, this.golState, x, y, w, h);
    } else {
      // Konsole im Dachgeschoss: dunkler Hintergrund, Level, Figuren
      const flick = 0.75 + Math.sin(t * 19) * 0.08;
      c.fillStyle = `rgba(38,28,74,${0.95 * flick})`;
      c.fillRect(x, y, w, h);
      for (let i = 0; i < 6; i++) disc(c, x + ((i * 29 + t * 26) % w), y + h * 0.22 + (i % 3) * h * 0.14, 0.8, "#c3d0ff");
      rect(c, x, y + h * 0.74, w, h * 0.26, "#3a2a5a");
      const px = x + w * 0.3 + Math.sin(t * 1.4) * w * 0.12;
      rect(c, px, y + h * 0.58, w * 0.08, h * 0.16, "#ffd166");
      rect(c, x + w * 0.66, y + h * 0.5, w * 0.1, h * 0.1, "#ff6f61");
      c.fillStyle = "#eef7f2";
      c.font = '700 4px "Silkscreen", monospace';
      c.fillText("LV 3", x + 2.5, y + h * 0.14);
    }
    const musikvideo = mode === "musik" || (mode === "cozy" && t % TV_CYCLE >= TV_RICK_AT);
    if (!musikvideo) this.drawTVScanlines(c, x, y, w, h);
  }

  private onKey = (e: KeyboardEvent) => {
    const ziel = e.target as HTMLElement | null;
    if (ziel !== this.canvas && ziel?.closest?.("input, textarea, select, button, a, [contenteditable='true']")) return;
    if (e.code === "KeyM") this.musikzimmer?.unlock();
    if (this.adventFullscreen) {
      // Der Weihnachtsgruß wird mit Enter, Leertaste oder Esc weggeklickt.
      if (this.adventGruss) {
        if (e.code === "Enter" || e.code === "Space" || e.code === "Escape") {
          this.adventGruss = false;
          sfx.ui();
        }
        e.preventDefault();
        return;
      }
      // Jeder Adventskalender lässt sich komplett ohne Maus bedienen.
      const spalten = 6;
      if (e.code === "Escape") this.adventZu();
      else if (e.code === "ArrowRight") this.adventFokus = (this.adventFokus + 1) % ADVENT_TAGE;
      else if (e.code === "ArrowLeft") this.adventFokus = (this.adventFokus + ADVENT_TAGE - 1) % ADVENT_TAGE;
      else if (e.code === "ArrowDown") this.adventFokus = (this.adventFokus + spalten) % ADVENT_TAGE;
      else if (e.code === "ArrowUp") this.adventFokus = (this.adventFokus + ADVENT_TAGE - spalten) % ADVENT_TAGE;
      else if (e.code === "Enter" || e.code === "Space") this.adventOeffne(this.adventFokus);
      else return;
      e.preventDefault();
      return;
    }
    if (e.code === "Escape" && this.tvZoom) {
      this.tvZoom = null;
      sfx.ui();
      e.preventDefault();
      return;
    }
    if (this.tvZoom && this.flauschiFullscreen) {
      // Durchschalten + Bestätigen: vier Pflegeknöpfe, Flauschi selbst
      // (streicheln, kitzeln) und „zurück“ – alles ohne Maus erreichbar.
      const ziele: (FlauschiAktion | FlauschiZielId | "zurueck")[] = [
        ...FLAUSCHI_KNOEPE.map(k => k.id), ...flauschiZonen(this.flauschiOffen(), this.flauschiState ?? undefined).map(zone => zone.id), "zurueck",
      ];
      const n = ziele.length;
      const i = Math.max(0, ziele.indexOf(
        this.flauschiZurueckFokus ? "zurueck" : this.flauschiZoneFokus ?? this.flauschiFokus));
      const vor = e.code === "ArrowRight" || (e.code === "Tab" && !e.shiftKey);
      const zurueckK = e.code === "ArrowLeft" || (e.code === "Tab" && e.shiftKey);
      // Hoch/Runter bleibt der Fernbedienung vorbehalten: Kanal wechseln
      // geht auch mitten im Spiel ganz ohne Maus.
      if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        const befehl: TVBefehl = e.code === "ArrowUp" ? "kanal_hoch" : "kanal_runter";
        this.tvFernFokus = befehl;
        this.tvBefehl(befehl);
      } else if (vor || zurueckK) {
        const ziel = ziele[(i + (vor ? 1 : -1) + n) % n];
        const knopf = FLAUSCHI_KNOEPE.find(k => k.id === ziel);
        this.flauschiZurueckFokus = ziel === "zurueck";
        this.flauschiZoneFokus = flauschiZonen(this.flauschiOffen(), this.flauschiState ?? undefined).find(zone => zone.id === ziel)?.id ?? null;
        if (knopf) this.flauschiFokus = knopf.id;
        sfx.ui();
      } else if (e.code === "Enter" || e.code === "Space") {
        if (e.repeat) {
          // Bestätigen gedrückt halten = langes Kraulen (wie Zeiger gedrückt halten).
          if (this.flauschiZoneFokus === "kraulen" && this.flauschiState) flauschiKraulenHalten(this.flauschiState, 0.04);
          e.preventDefault();
          return;
        }
        if (this.flauschiZurueckFokus) {
          this.tvZoom = null;
          sfx.ui();
        } else if (this.flauschiZoneFokus === "paket") this.flauschiAuspackenAusloesen();
        else if (this.flauschiZoneFokus) this.flauschiBeruehrenAusloesen(this.flauschiZoneFokus);
        else this.flauschiAktionAusloesen(this.flauschiFokus);
      } else return;
      e.preventDefault();
      return;
    }
    if (this.tvZoom) {
      const direkt: Record<string, TVBefehl> = {
        ArrowUp: "kanal_hoch", ArrowDown: "kanal_runter", ArrowLeft: "leiser", ArrowRight: "lauter",
      };
      if (direkt[e.code]) {
        this.tvFernFokus = direkt[e.code];
        this.tvBefehl(this.tvFernFokus);
      } else if (e.code === "Tab") {
        const i = TV_FERN_STATIONS.findIndex(b => b.id === this.tvFernFokus);
        const n = TV_FERN_STATIONS.length;
        const next = i < 0 ? (e.shiftKey ? n - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + n) % n;
        this.tvFernFokus = TV_FERN_STATIONS[next].id;
      } else if (e.code === "Enter" || e.code === "Space") {
        if (!e.repeat) this.tvBefehl(this.tvFernFokus ?? "power");
      } else return;
      e.preventDefault();
      return;
    }
    if (this.ufoOffen) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) {
      // Dieselben benannten Ziele wie beim Zeiger; verdeckte/entfernte Ziele auslassen.
      const ziele = [...this.steinStationen, ...this.stations].filter(st =>
        this.steinStationen.includes(st) || st.hits.some(([x, y, w, h]) => this.pick(x + w / 2, y + h / 2) === st));
      if (!ziele.length) return;
      const alt = ziele.indexOf(this.stationFokus ?? this.hover as Station);
      const zurueck = e.code === "ArrowLeft" || e.code === "ArrowUp";
      const index = alt < 0 ? (zurueck ? ziele.length - 1 : 0) : (alt + (zurueck ? -1 : 1) + ziele.length) % ziele.length;
      this.stationFokus = ziele[index];
      this.hover = this.stationFokus;
      this.canvas.focus({ preventScroll: true });
      e.preventDefault();
    } else if ((e.code === "Enter" || e.code === "Space") && this.stationFokus) {
      e.preventDefault();
      if (e.repeat) return;
      sfx.ensure();
      if (this.steinStationen.includes(this.stationFokus)) this.steinWechsel(this.stationFokus);
      else this.command(this.stationFokus.id);
    } else if (e.code === "Escape" && this.stationFokus) {
      this.stationFokus = null;
      this.hover = null;
      e.preventDefault();
    }
  };

  /** Versteckter Tab hält Traum und Saxophon an. */
  private onPageHide = () => this.speichern();

  private onVisibility = () => {
    if (this.musikzimmer) {
      this.musikzimmer.setPaused(document.visibilityState === "hidden");
      this.last = performance.now();
    }
    if (document.visibilityState === "hidden") {
      this.tvKlang.tv_e?.stop();
      this.tvKlang.tv_d?.stop();
      this.speichern();
      if (this.saxPhase === "play" && this.saxStarted && this.saxMusic) {
        this.saxPausedAt = this.saxMusic.pause();
        this.saxStarted = false;
      }
      if (this.plattenPhase === "play" && this.plattenStarted && this.plattenMusic) {
        this.plattenPausedAt = this.plattenMusic.pause();
        this.plattenStarted = false;
      }
      if (this.klavierSpielt && this.klavierMusik) {
        this.klavierPausiert = this.klavierMusik.pause();
        this.klavierSpielt = false;
      }
      if (this.singPhase === "sing" && this.singStarted && this.singMusic) {
        this.singPausedAt = this.singMusic.pause();
        this.singStarted = false;
      }
    } else {
      if (this.saxPausedAt !== null && this.saxPhase === "play" && this.saxMusic) {
        const shared = sfx.getSharedAudio();
        if (shared) {
          try {
            this.saxMusic.playAt(shared.ctx.currentTime + SAX_LEAD, this.saxPausedAt);
            this.saxStarted = true;
            this.saxPausedAt = null;
          } catch {
            // Audio noch gesperrt – bleibt pausiert, kein Neustart von vorn.
          }
        }
      }
      if (this.plattenPausedAt !== null && this.plattenPhase === "play" && this.plattenMusic) {
        const shared = sfx.getSharedAudio();
        if (shared) {
          try {
            this.plattenMusic.playAt(shared.ctx.currentTime + 0.05, this.plattenPausedAt);
            this.plattenStarted = true;
            this.plattenPausedAt = null;
          } catch {
            // Audio noch gesperrt – bleibt pausiert.
          }
        }
      }
      if (this.singPausedAt !== null && this.singPhase === "sing" && this.singMusic) {
        const shared = sfx.getSharedAudio();
        if (shared) {
          try {
            this.singMusic.playAt(shared.ctx.currentTime + 0.05, this.singPausedAt);
            this.singStarted = true;
            this.singPausedAt = null;
          } catch {
            // Audio noch gesperrt – bleibt pausiert.
          }
        }
      }
    }
  };

  /** Fernseher im Dachgeschoss (Gehäuse + Bildfläche). */
  private hitAtticTv(x: number, y: number) {
    return x >= 404 && x <= 470 && y >= 134 && y <= 200;
  }

  /** Fernseher im Erdgeschoss (Wohnzimmer-TV + Schrank). */
  private hitLivingTv(x: number, y: number) {
    return x >= 438 && x <= 492 && y >= 392 && y <= 448;
  }

  /** Große Fernseh-Ansicht sofort öffnen (unterbricht Lunis Ablauf nicht). */
  private openTvZoom(which: "tv_e" | "tv_d") {
    this.tvZoom = which;
    this.hover = null;
    this.tvFernHover = null;
    this.tvFernFokus = null;
    sfx.ui();
  }

  private toggleTvPower(which: "tv_e" | "tv_d") {
    const an = this.tvContent(which) !== "off";
    this.tvManual[which] = !an;
  }

  /** Standplatz direkt vor dem Fernseher im Zockerzimmer. */
  private golTvStand(): Station {
    return {
      id: "gol_tv",
      label: "Fernseher",
      floor: 3,
      x: 436,
      face: 1,
      state: "act",
      expr: "focus",
      hits: [],
    };
  }



  /* ------------------------------ Duschen -------------------------------- */

  private shStation(phase: ShPhase): Station {
    const st = (this.gruselBad && DEKON_STAND[phase]) || SH_STAND[phase];
    return { id: `sh_${phase}`, label: "", floor: 2, x: st.x, face: st.face, state: "idle", expr: "happy", hits: [] };
  }

  private startSh(phase: ShPhase) {
    // Ohne Brille (weder auf der Nase noch in der Hand) gibt es nichts zu werfen.
    if (!this.glassesOn && !this.glassesInHand && (phase === "toSink" || phase === "glassesOff" || phase === "tossGlasses")) {
      phase = this.gruselBad ? "toPanel" : "toShower";
    }
    // Den Umhang gibt es nur bei Gruselhaus-Outfits mit Umhang.
    if (phase === "bedCape" && !(this.gruselSarg && this.vampirNeu !== null && VAMPIR_OUTFITS[this.vampirNeu].umhang)) {
      phase = "bedClose";
    }
    this.shPhase = phase;
    this.shT = 0;
    if (phase === "pressPanel" && this.gruselBad) this.bioFlashed = false;
    if (SH_STAND[phase] || (this.gruselBad && DEKON_STAND[phase])) this.goTo(this.shStation(phase));
    if (phase === "stepOut") this.wet = 1;
  }

  private nextSh() {
    const p = this.shPhase;
    if (!p) return;
    const seq = (this.gruselBad && (DEKON_SEQ as readonly string[]).includes(p)
      ? DEKON_SEQ : ALL_SEQS.find((q) => q.includes(p)) ?? []) as readonly ShPhase[];
    const i = seq.indexOf(p);
    if (i < 0 || i === seq.length - 1) {
      this.shPhase = null;
      this.shT = 0;
      return;
    }
    this.startSh(seq[i + 1]);
  }

  /** Abbruch auf dem Weg: Schrank zu, sonst bleibt alles, wie es ist. */
  private cancelShower() {
    this.shPhase = null;
    this.shT = 0;
    this.wardrobeOpen = 0;
    if (this.gruselBad) {
      this.bioDoor = 0;
      this.bioInside = false;
      this.bioMist = 0;
      this.bioFlash = 0;
      this.doorHand = null;
    }
  }

  private updateShower(dt: number) {
    if (this.bedTimePending && this.sick < 0.35 && this.night < 0.45) this.bedTimePending = false;
    if (this.asleep) {
      this.sleepT += dt;
    }
    if (this.revealT > 0) this.revealT = Math.max(0, this.revealT - dt);
    this.updateBedRoutine(dt);
    if (this.glassesFly) {
      this.glassesFly.t += dt;
      if (this.glassesFly.t >= GLASSES_FLIGHT) {
        this.glassesFly = null;
        this.glassesInSink = true;
        sfx.ui();
      }
    }
    this.steam = this.water ? Math.min(1, this.steam + dt * 0.3) : Math.max(0, this.steam - dt * 0.12);
    if (!this.shPhase && this.wet > 0) this.wet = Math.max(0, this.wet - dt / 90);
    const ph = this.shPhase;
    if (!ph) return;
    // Bett-Phasen gehören allein updateBedRoutine, nicht zusätzlich der Dusche.
    if ((BED_SEQ as readonly string[]).includes(ph)) return;
    const dur = SH_DUR[ph];
    if (dur === undefined) {
      // Laufschritt: endet, sobald sie am Ziel steht
      const arrived = !this.cur && this.path.length === 0 && !this.pending;
      if (arrived && this.activity?.id === `sh_${ph}`) {
        if (this.gruselBad && ph === "toShower") this.bioInside = true;
        if (this.gruselBad && ph === "stepOut") this.bioInside = false;
        this.nextSh();
      }
      return;
    }
    this.shT += dt;
    const p = clamp(this.shT / dur, 0, 1);
    const e = p * p * (3 - 2 * p);
    switch (ph) {
      case "openWardrobe":
      case "dOpen":
        this.wardrobeOpen = e;
        break;
      case "closeWardrobe":
      case "dClose":
        this.wardrobeOpen = 1 - e;
        break;
      case "undress":
        // Arme oben, Oberteil ist über dem Kopf: Handtuch kommt aus dem Schrank
        if (p >= 0.5) this.outfit = "towel";
        break;
      case "dDress":
        if (p >= 0.5) this.outfit = "dressed";
        break;
      case "closeCurtain":
        this.curtain = e;
        break;
      case "openCurtain":
        this.curtain = 1 - e;
        break;
      case "pressPanel":
        if (this.gruselBad) {
          this.doorHand = p < .82 ? [BIO_BAD.panel.knopf[0], BIO_BAD.panel.knopf[1]] : null;
          if (p >= .4) this.bioPanelPress = 1;
        }
        break;
      case "capsuleOpen":
      case "capsuleExitOpen":
        this.bioDoor = e;
        break;
      case "capsuleClose":
      case "capsuleExitClose":
        this.bioDoor = 1 - e;
        break;
      case "towelOff":
        if (p >= 0.6) this.outfit = "none";
        break;
      case "throwTowel":
        if (p >= 0.55 && !this.towelOnRod) {
          this.towelOnRod = true;
          sfx.ui();
        }
        break;
      case "waterOn":
        if (p >= 0.6) this.water = true;
        if (this.gruselBad && p >= .65 && !this.bioFlashed) {
          this.bioFlashed = true;
          this.bioFlash = 1;
        }
        break;
      case "gPick":
        if (p >= 0.38 && this.glassesInSink) {
          this.glassesInSink = false;
          this.glassesInHand = true;
          sfx.ui();
        }
        if (p >= 0.84 && this.glassesInHand) {
          this.glassesInHand = false;
          this.glassesOn = true;
        }
        break;
      case "cOpen":
        this.cabinetOpen = clamp((p - 0.3) / 0.45, 0, 1);
        break;
      case "kClose":
        this.cabinetOpen = 1 - clamp((p - 0.3) / 0.45, 0, 1);
        break;
      case "bTake":
        if (p >= 0.5 && this.brushInCab) {
          this.brushInCab = false;
          this.brushInHand = true;
        }
        break;
      case "bPut":
        if (p >= 0.5 && this.brushInHand) {
          this.brushInHand = false;
          this.brushInCab = true;
        }
        break;
      case "glassesOff":
        if (p >= 0.55 && this.glassesOn) {
          this.glassesOn = false;
          this.glassesInHand = true;
        }
        break;
      case "tossGlasses":
        if (p >= 0.55 && this.glassesInHand) {
          this.glassesInHand = false;
          this.glassesFly = { t: 0, x0: this.hand[0] + 3, y0: this.hand[1] - 1 };
        }
        break;
      case "waterOff":
        if (p >= 0.4) this.water = false;
        break;
      case "takeTowel":
        if (p >= 0.45) this.towelOnRod = false;
        break;
      case "wrapOn":
        if (p >= 0.3) this.outfit = "towel";
        break;
    }
    if (p >= 1) this.nextSh();
  }

  /** Oberteil und Hose beim Umziehen getrennt; das Handtuch gehört nur zur Dusche. */
  private bedKleidung(): { oberteil: boolean; hose: boolean } | undefined {
    const ph = this.shPhase;
    if (!ph) return undefined;
    const p = clamp(this.shT / (SH_DUR[ph] ?? 1), 0, 1);
    switch (ph) {
      case "bedTop": return { oberteil: p < 0.3, hose: true };
      case "bedBottom": return { oberteil: false, hose: p < 0.55 };
      case "bedPants": return { oberteil: false, hose: p >= 0.4 };
      case "bedPajama": return { oberteil: p >= 0.75, hose: true };
      default: return undefined;
    }
  }

  /** Abendroutine: umziehen, aufs Bett setzen, vorhandene Brille werfen. */
  private updateBedRoutine(dt: number) {
    const ph = this.shPhase;
    if (!ph || !(BED_SEQ as readonly string[]).includes(ph)) return;
    const dur = SH_DUR[ph];
    if (dur === undefined) {
      const arrived = !this.cur && this.path.length === 0 && !this.pending;
      if (arrived && this.activity?.id === `sh_${ph}`) this.nextSh();
      return;
    }
    this.shT += dt;
    const p = clamp(this.shT / dur, 0, 1);
    const e = p * p * (3 - 2 * p);
    switch (ph) {
      case "bedOpen":
      case "bedClose":
        this.wardrobeOpen = ph === "bedOpen" ? e : 1 - e;
        break;
      case "bedTop":
        if (p >= 0.3) this.outfit = "none";
        break;
      case "bedBottom":
        if (p >= 0.55) this.outfit = "none";
        break;
      case "bedPants":
        if (p >= 0.4) this.outfit = "none";
        break;
      case "bedPajama":
        if (p >= 0.75 && this.outfit !== "dressed") {
          this.outfit = "dressed";
          if (this.gruselSarg && this.vampirNeu !== null) {
            const v = VAMPIR_OUTFITS[this.vampirNeu];
            this.vampirStil = this.vampirNeu;
            this.vampirLetzt = this.vampirNeu;
            this.pyjama = { top: v.top, bottom: v.bottom };
          }
        }
        break;
      case "bedCape":
        break;
      case "bedToss":
        // Ohne Brille auf der Nase oder in der Hand gibt es keinen Wurf.
        if (!this.bedPhase) {
          this.shPhase = null;
          this.shT = 0;
          if (!this.beginBedToss()) this.beginLieDown();
        }
        return;
    }
    if (p >= 1) {
      if (ph === "bedClose" && this.gruselSarg) {
        // Gruselhaus: statt aufs Bett zum Sarg.
        this.shPhase = null;
        this.shT = 0;
        this.wardrobeOpen = 0;
        this.sargStart("zumSarg");
        return;
      }
      if (ph === "bedSit") {
        this.shPhase = null;
        this.shT = 0;
        return;
      }
      this.nextSh();
    }
  }

  /** Pose, Blickrichtung und Rückenansicht für den aktuellen Duschschritt. */
  private showerPose(): { state: LuniState; face: 1 | -1; phase: number; back: boolean } | null {
    const ph = this.shPhase;
    if (!ph || SH_DUR[ph] === undefined) return null;
    const p = clamp(this.shT / (SH_DUR[ph] as number), 0, 1);
    switch (ph) {
      case "openWardrobe":
      case "closeWardrobe":
      case "dOpen":
      case "dClose":
        return { state: "act", face: 1, phase: 0, back: true };
      case "undress":
      case "dDress":
        return { state: "undress", face: 1, phase: p, back: true };
      case "wrap":
        return { state: "wrap", face: 1, phase: p, back: true };
      case "towelOff":
        return { state: "wrap", face: this.gruselBad ? -1 : 1, phase: 1 - p, back: false };
      case "throwTowel":
      case "takeTowel":
        return { state: "throw", face: this.gruselBad ? -1 : 1, phase: p, back: false };
      case "wrapOn":
        return { state: "wrap", face: this.gruselBad ? -1 : 1, phase: p, back: false };
      case "closeCurtain":
        return { state: "act", face: 1, phase: 0, back: false };
      case "openCurtain":
      case "waterOn":
      case "waterOff":
        return { state: "act", face: -1, phase: 0, back: false };
      case "pressPanel":
        return { state: "act", face: -1, phase: p, back: false };
      case "capsuleOpen":
        return { state: "idle", face: -1, phase: 0, back: false };
      case "turnFront":
      case "capsuleClose":
      case "capsuleExitOpen":
      case "capsuleExitClose":
        return { state: "idle", face: 1, phase: 0, back: false };
      case "gPick":
        return { state: "glassesOn", face: 1, phase: p, back: false };
      case "bedOpen":
      case "bedClose":
        return { state: "act", face: 1, phase: p, back: this.gruselSarg };
      case "bedCape":
        return { state: "act", face: 1, phase: 0, back: true };
      case "bedTop":
      case "bedPants":
        return { state: "undress", face: 1, phase: p, back: true };
      case "bedBottom":
        return { state: "undress", face: 1, phase: p, back: true };
      case "bedPajama":
        return { state: "undress", face: 1, phase: 1 - p, back: true };
      case "bedSit":
        return { state: "sleepBend", face: -1, phase: 1, back: false };
      case "cOpen":
      case "kClose":
      case "bTake":
      case "bPut":
        return { state: "reachUp", face: 1, phase: p, back: false };
      case "bBend":
        return { state: this.gruselBad ? "labBend" : "bend", face: 1, phase: p, back: false };
      case "bBrush":
        return { state: this.gruselBad ? "labBrush" : "brush", face: 1, phase: 1, back: false };
      case "bUp":
        return { state: this.gruselBad ? "labBend" : "bend", face: 1, phase: 1 - p, back: false };
      case "glassesOff":
        return { state: "glasses", face: 1, phase: p, back: false };
      case "tossGlasses":
        return { state: "toss", face: 1, phase: p, back: false };
      case "washHair":
        return { state: "wash", face: 1, phase: 0.5, back: false };
      case "washBody":
        return { state: "wash", face: 1, phase: 1.5, back: false };
      case "rinse":
        return { state: "wash", face: 1, phase: 2.5, back: false };
      default:
        return null;
    }
  }

  /**
   * Luni mit Duschvorhang. Was hinter dem Vorhang liegt, erscheint als graue
   * Silhouette auf dem Stoff; der Rest (z. B. die Füße darunter) normal.
   */
  /** Osterei: Datenkoffer im Keller – Deckel, Antenne, LED, Signalbögen. */
  private drawKoffer(c: C) {
    drawDatenKoffer(c, this.kofferDeckel, this.kofferAntenne, this.kofferPhase, this.elapsed);
  }

  private drawLuniLayered(c: C) {
    if (this.gruselBad) {
      // Kapsel und Sichtfenster sind getrennte Vordergrund-Ebenen.
      this.drawLuniNow(c);
      return;
    }
    const F = FLOOR_Y[2];
    const t = this.elapsed;
    if (this.water) drawShowerWater(c, F, t);
    const r = curtainRect(F, this.curtain);
    const inShower = !!this.shPhase && SH_INSIDE.includes(this.shPhase) && this.lf === 2;
    if (!inShower) {
      // Wer an der Dusche vorbeigeht, ist vor dem Vorhang.
      drawCurtain(c, F, this.curtain, t);
      this.drawLuniNow(c);
    } else if (this.curtain < 0.02) {
      // In der Wanne bei offenem Vorhang: der zusammengeschobene Stoff ist vorn.
      this.drawLuniNow(c);
      drawCurtain(c, F, this.curtain, t);
      drawTubFront(c, F);
    } else {
      const pw = this.canvas.width;
      const phh = this.canvas.height;
      for (const b of [this.luniBuf, this.silBuf]) {
        if (b.width !== pw || b.height !== phh) {
          b.width = pw;
          b.height = phh;
        }
      }
      const bc = this.luniBuf.getContext("2d");
      const sc = this.silBuf.getContext("2d");
      if (!bc || !sc) return;
      const k = this.scale * this.dpr;
      bc.setTransform(1, 0, 0, 1, 0, 0);
      bc.clearRect(0, 0, pw, phh);
      bc.setTransform(k, 0, 0, k, 0, 0);
      this.drawLuniNow(bc);
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.globalCompositeOperation = "source-over";
      sc.clearRect(0, 0, pw, phh);
      sc.drawImage(this.luniBuf, 0, 0);
      sc.globalCompositeOperation = "source-in";
      sc.fillStyle = "#59636a";
      sc.fillRect(0, 0, pw, phh);
      sc.globalCompositeOperation = "source-over";

      // Was nicht vom Vorhang bedeckt ist, normal zeichnen
      c.save();
      c.beginPath();
      c.rect(0, 0, W, H);
      c.rect(r.x, r.y, r.w, r.h);
      c.clip("evenodd");
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(this.luniBuf, 0, 0);
      c.restore();

      drawCurtain(c, F, this.curtain, t);
      if (this.water) drawShowerWater(c, F, t, 0.35);

      // Hinter dem Vorhang: grauer Schatten auf dem Stoff
      c.save();
      c.beginPath();
      c.rect(r.x, r.y, r.w, r.h);
      c.clip();
      c.globalAlpha = 0.6;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(this.silBuf, 0, 0);
      c.restore();

      // Die Wannenvorderseite verdeckt die Füße.
      drawTubFront(c, F);
    }
    drawSteam(c, F, this.steam, t);
    if (this.towelOnRod) drawTowelOnRod(c, F);
  }

  /* ------------------- Gruselhaus, Raum 03: Ablauf am Sarg ------------------- */

  private get gruselSarg() {
    return this.welt === "gruesel" && GRUSELRAEUME.schlafzimmer;
  }

  private sargWacht() {
    return this.sargPhase !== null && SARG_WACH.includes(this.sargPhase);
  }

  private sargStart(ph: SargPhase) {
    this.sargPhase = ph;
    this.sargT = 0;
    this.sargTon = false;
    const stand = (x: number, id: string): Station => ({ id, label: "", floor: 2, x, face: 1, state: "idle", expr: "neutral", hits: [] });
    if (ph === "zumSarg") this.goTo(stand(SCHLAFZIMMER.sarg.mitte, "v_sarg"));
    if (ph === "zurBrille") this.goTo(stand(this.brillenZielName === "kelch" ? 404 : 388, "v_brille"));
  }

  private sargAbbrechen() {
    this.sargPhase = null;
    this.sargT = 0;
    this.imSarg = false;
  }

  /** Ein Befehl weckt sie: Deckel aufdrücken, aufsetzen, aussteigen, Deckel schließen. */
  private sargAufwachen(request: LuniCommand) {
    this.asleep = false;
    this.sleepT = 0;
    const id = typeof request === "string" ? request : request.id;
    this.nachAufwachen = id === "bett" ? null : request;
    this.activity = null;
    this.target = null;
    this.cur = null;
    this.path = [];
    this.pending = null;
    this.chain = [];
    this.lf = 2;
    this.lx = SCHLAFZIMMER.sitzX;
    this.imSarg = true;
    this.sargStart("aufwachen");
  }

  /** Ablauf zu Ende: der Befehl, der sie geweckt hat, läuft jetzt. */
  private sargFrei() {
    this.sargPhase = null;
    this.sargT = 0;
    this.imSarg = false;
    this.lface = 1;
    const id = this.nachAufwachen;
    this.nachAufwachen = null;
    if (id) this.command(id);
  }

  /** Hüfte beim Sitzen im Sarg: Drehpunkt fürs Zurücklehnen. */
  private sargHuefte(): Pt {
    return [SCHLAFZIMMER.sitzX, FLOOR_Y[2] - 3 + (-19 + 9) * LUNI_SCALE];
  }

  private updateSarg(dt: number) {
    if (this.leuchterW !== 0 || this.leuchterV !== 0) {
      this.leuchterV += (-15.4 * this.leuchterW - 1.6 * this.leuchterV) * dt;
      this.leuchterW += this.leuchterV * dt;
      if (Math.abs(this.leuchterW) < 0.0004 && Math.abs(this.leuchterV) < 0.002) {
        this.leuchterW = 0;
        this.leuchterV = 0;
      }
    }
    if (this.fledermausBlink > 0) this.fledermausBlink = Math.max(0, this.fledermausBlink - dt);
    const ph = this.sargPhase;
    if (!ph) return;
    if (ph === "zumSarg" || ph === "zurBrille") {
      const want = ph === "zumSarg" ? "v_sarg" : "v_brille";
      if (!this.cur && this.path.length === 0 && !this.pending && this.activity?.id === want) {
        this.activity = null;
        this.target = null;
        this.sargStart(ph === "zumSarg" ? "deckelAuf" : "brilleAuf");
      }
      return;
    }
    this.sargT += dt;
    const p = clamp(this.sargT / SARG_DUR[ph], 0, 1);
    const e = sanft(p);
    switch (ph) {
      case "deckelAuf":
      case "aufwachen":
        this.sargDeckel = e;
        if (!this.sargTon && p > 0.06) {
          sfx.knarzen();
          this.sargTon = true;
        }
        break;
      case "deckelZu":
      case "deckelSchliessen":
        this.sargDeckel = 1 - e;
        if (!this.sargTon && p >= 0.97) {
          sfx.holzDumpf();
          this.sargTon = true;
        }
        break;
      case "einsteigen":
        this.imSarg = p >= 0.45;
        break;
      case "aussteigen":
        this.imSarg = p < 0.55;
        break;
      case "brilleAb":
        if (p >= 0.6 && this.glassesOn) {
          this.glassesOn = false;
          this.glassesInHand = true;
        }
        break;
      case "werfen":
        if (p >= 0.55 && this.glassesInHand && this.bedPhase !== "toss") this.beginBedToss();
        break;
      case "brilleAuf":
        if (p >= 0.32 && this.glassesRest) {
          this.glassesRest = null;
          this.brilleAmLeuchter = false;
          this.glassesInHand = true;
        }
        if (p >= 0.84 && this.glassesInHand) {
          this.glassesInHand = false;
          this.glassesOn = true;
          this.brillenZielName = null;
        }
        break;
      default:
        break;
    }
    if (p < 1) return;
    switch (ph) {
      case "deckelAuf":
        this.sargStart("aufHocker");
        break;
      case "aufHocker":
        this.sargStart("einsteigen");
        break;
      case "einsteigen":
        this.sargStart("hinsetzen");
        break;
      case "hinsetzen":
        this.sargStart(this.glassesOn ? "brilleAb" : "deckelZu");
        break;
      case "brilleAb":
        this.sargStart("werfen");
        break;
      case "werfen":
        break; // wartet auf die Landung der Brille (updateBedToss)
      case "deckelZu":
        this.sargPhase = null;
        this.asleep = true;
        this.sleepT = 0;
        break;
      case "aufwachen":
        this.sargStart("aufstehen");
        break;
      case "aufstehen":
        this.sargStart("aussteigen");
        break;
      case "aussteigen":
        this.sargStart("abHocker");
        break;
      case "abHocker":
        this.lx = SCHLAFZIMMER.sarg.mitte;
        this.sargStart("deckelSchliessen");
        break;
      case "deckelSchliessen": {
        const z = this.brillenZielName;
        if (!this.glassesOn && this.glassesRest && z && brilleErreichbar(z)) this.sargStart("zurBrille");
        else if (!this.glassesOn && this.glassesRest) this.sargStart("brilleWeg");
        else this.sargFrei();
        break;
      }
      default:
        this.sargFrei();
        break;
    }
  }

  /** Pose für den aktuellen Sarg-Schritt (oder das Umlegen des Umhangs). */
  private sargPose(): SargPose | null {
    if (!this.gruselSarg || this.lf !== 2) return null;
    const F = FLOOR_Y[2];
    const S = SCHLAFZIMMER;
    const mix = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    if (this.shPhase === "bedCape") {
      const p = clamp(this.shT / (SH_DUR.bedCape as number), 0, 1);
      const x = 458;
      if (p < 0.25) return { x, y: F, state: "act", expr: "focus", face: 1, back: true, phase: 0, umhang: 0 };
      const q = clamp((p - 0.25) / 0.5, 0, 1);
      const zu = sanft((p - 0.75) / 0.25);
      const sy = F - 36.5;
      const weit = Math.sin(Math.PI * Math.min(1, q * 1.15)) * 5;
      const l: Pt = [lerp(x - 9 - weit, x - 2.5, zu), lerp(sy - 2 - weit * 0.4, sy - 7, zu)];
      const r: Pt = [lerp(x + 9 + weit, x + 2.5, zu), lerp(sy - 2 - weit * 0.4, sy - 7, zu)];
      return { x, y: F, state: "idle", expr: "focus", face: 1, back: true, phase: 0, hand: l, hand2: r, backReach: true, umhang: sanft(q) };
    }
    const ph = this.sargPhase;
    if (!ph || ph === "zumSarg" || ph === "zurBrille") return null;
    const p = clamp(this.sargT / SARG_DUR[ph], 0, 1);
    const e = sanft(p);
    const mitte = S.sarg.mitte;
    const hx = S.hocker.x;
    const hy = F - S.hocker.hoehe;
    const innen = F - 10;
    const sitzY = F - 3;
    const sx = S.sitzX;
    const tief = 9 * LUNI_SCALE;
    const schlaufe = (lean: number): Pt => {
      const [lx, ly] = deckelSchlaufe(F, this.sargDeckel);
      const [px, py] = this.sargHuefte();
      const cs = Math.cos(lean);
      const sn = Math.sin(lean);
      return [px + (lx - px) * cs - (ly - py) * sn, py + (lx - px) * sn + (ly - py) * cs];
    };
    switch (ph) {
      case "deckelAuf":
      case "deckelSchliessen":
        return {
          x: mitte, y: F, state: "idle", expr: "focus", face: 1, back: true, phase: 0, backReach: true,
          hand: deckelGriff(F, this.sargDeckel, mitte - 7), hand2: deckelGriff(F, this.sargDeckel, mitte + 7),
        };
      case "aufHocker":
        return {
          x: lerp(mitte, hx, sanft(p / 0.55)), y: lerp(F, hy, sanft((p - 0.55) / 0.45)),
          state: p < 0.97 ? "walk" : "idle", expr: "neutral", face: 1, back: true, phase: 0, walk: p * 9,
        };
      case "einsteigen":
        return { x: hx, y: lerp(hy, innen, e) - Math.sin(Math.PI * p) * 6, state: "walk", expr: "focus", face: 1, back: true, phase: 0, walk: p * 7 };
      case "hinsetzen": {
        if (p < 0.35) {
          const q = p / 0.35;
          return { x: hx, y: innen, state: "turn", expr: "neutral", face: 1, back: q < 0.5, phase: q < 0.5 ? q : 1 - q };
        }
        const s = sanft((p - 0.35) / 0.65);
        return { x: lerp(hx, sx, s), y: lerp(innen, sitzY, s), state: "standup", expr: "happy", face: 1, back: false, phase: 1 - s };
      }
      case "brilleAb":
        return { x: sx, y: sitzY + tief, state: "glasses", expr: "neutral", face: 1, back: false, phase: p };
      case "werfen":
        return { x: sx, y: sitzY + tief, state: "toss", expr: "happy", face: 1, back: false, phase: p };
      case "deckelZu": {
        const lean = e * 1.25;
        return {
          x: sx, y: sitzY, state: "sit", expr: p > 0.55 ? "sleep" : "happy", face: 1, back: false, phase: 0,
          lean, hand2: this.sargDeckel >= 0.25 ? schlaufe(lean) : null,
        };
      }
      case "aufwachen": {
        const lean = (1 - e) * 1.25;
        return {
          x: sx, y: sitzY, state: "sit", expr: p < 0.45 ? "tired" : "neutral", face: 1, back: false, phase: 0,
          lean, hand2: this.sargDeckel >= 0.25 ? schlaufe(lean) : null,
        };
      }
      case "aufstehen": {
        if (p < 0.65) {
          const s = sanft(p / 0.65);
          return { x: sx, y: lerp(sitzY, innen, s), state: "standup", expr: "neutral", face: 1, back: false, phase: s };
        }
        const q = (p - 0.65) / 0.35;
        return { x: sx, y: innen, state: "turn", expr: "neutral", face: 1, back: q >= 0.5, phase: q < 0.5 ? q : 1 - q };
      }
      case "aussteigen":
        return { x: hx, y: lerp(innen, hy, e) - Math.sin(Math.PI * p) * 6, state: "walk", expr: "focus", face: 1, back: true, phase: 0, walk: p * 7 };
      case "abHocker":
        return {
          x: lerp(hx, mitte, sanft((p - 0.45) / 0.55)), y: lerp(hy, F, sanft(p / 0.45)),
          state: p < 0.97 ? "walk" : "idle", expr: "neutral", face: 1, back: true, phase: 0, walk: p * 9,
        };
      case "brilleAuf": {
        const z = BRILLEN_ZIELE[this.brillenZielName ?? "nachttisch"];
        const x = this.lx;
        const ruhe: Pt = [x - 8.2, F - 23.2];
        const auge: Pt = [x + 7.1, F - 49.9];
        const g: Pt = [z.x, z.y];
        const h = p < 0.3 ? mix(ruhe, g, sanft(p / 0.3)) : p < 0.4 ? g : p < 0.8 ? mix(g, auge, sanft((p - 0.4) / 0.4)) : p < 0.9 ? auge : mix(auge, ruhe, sanft((p - 0.9) / 0.1));
        return { x, y: F, state: "idle", expr: p > 0.85 ? "happy" : "focus", face: 1, back: false, phase: 0, hand: h };
      }
      case "brilleWeg":
        return { x: this.lx, y: F, state: "think", expr: "annoyed", face: 1, back: false, phase: 0, shake: Math.sin(p * 21) * Math.sin(Math.PI * p) };
      default:
        return null;
    }
  }

  /** Sarg in zwei Durchgängen: was hinter Luni liegt, und was vor ihr liegt. */
  private drawSargPass(c: C, nachLuni: boolean) {
    if (!this.gruselSarg) return;
    const F = FLOOR_Y[2];
    const o = this.sargDeckel;
    const deckelVorn = this.imSarg && o < 0.25;
    if (!nachLuni) {
      if (o > 0.02) drawSargInnen(c, F);
      if (!deckelVorn) drawSargDeckel(c, F, o);
      if (!this.imSarg) {
        drawSargFront(c, F);
        drawTrittschemel(c, F);
      }
    } else if (this.imSarg) {
      drawSargFront(c, F);
      drawTrittschemel(c, F);
      if (deckelVorn) drawSargDeckel(c, F, o);
    }
  }

  /* ------------------------------ Bett-Routine --------------------------- */

  /** Jeder Pyjama sieht anders aus: Oberteil und Hose unabhängig. */
  private makePajama() {
    const tops = ["#7fc6c2", "#6c8fd0", "#c98fb5", "#8fbf7a", "#e0b46a", "#a99bd6", "#d98f7a"];
    const bottoms = ["#3f6f8c", "#6b5a96", "#4a7a6a", "#8c5a72", "#5b6f9a", "#7a6a4a"];
    const top = tops[Math.floor(Math.random() * tops.length)];
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    this.pyjama = { top, bottom };
  }

  private startBedRoutine() {
    // Nutzeraktion Bettklick: Audio freigeben.
    sfx.ensure();
    // Eine bereits abgelegte Brille bleibt an ihrem Platz, auch beim Bettgang.
    if (!this.gruselSarg && (this.glassesOn || this.glassesInHand)) this.glassesRest = null;
    this.chain = [];
    this.smokeRequested = false;
    this.bedTimePending = false;
    if (this.gruselSarg) {
      // Jede Nacht ein anderes edles Vampir-Outfit, nie zweimal hintereinander.
      this.vampirNeu = naechstesOutfit(this.vampirLetzt);
    } else if (!this.pyjama) this.makePajama();
    this.startSh("bToWardrobe");
  }

  private beginBedToss(): boolean {
    if (!this.glassesOn && !this.glassesInHand) return false;
    // Brille vom Bett aus hochwerfen. Im normalen Haus landet sie immer auf
    // der Nachttischplatte – kein Boden, kein Bett, keine Lampe, kein Schrank.
    // Das Gruselhaus behält seine eigenen, dokumentierten Wurfregeln.
    if (this.gruselSarg) this.brillenZielName = brillenZiel();
    this.tossLand = 0;
    this.tossUp = 0;
    this.tossLanded = false;
    this.bedPhase = "toss";
    this.glassesOn = false;
    this.glassesInHand = true;
    sfx.ui();
    return true;
  }

  /** Normaler Bettgang, unabhaengig von Uhr und Kleidung. Der 3%-Wurf wird pro
   * Bettgang genau einmal entschieden und nie waehrend der Animation neu gezogen. */
  private startBedEinstieg(schonAmBett = false) {
    if (this.bedEinstieg || this.asleep) return;
    this.chain = [];
    this.smokeRequested = false;
    this.bedKleidungAn = this.outfit;
    this.bedPyjama = this.pyjama ? { ...this.pyjama } : null;
    this.bedBrilleBehalten = this.glassesOn && Math.random() < 0.03;
    this.bedEinstieg = "anfahrt";
    this.bedEinstiegT = 0;
    if (schonAmBett && this.lf === 2 && Math.abs(this.lx - BETT_STAND_X) < 1) {
      this.bedEinstieg = "umschlagen";
    } else {
      this.goTo({ id: "bett_einstieg", label: "", floor: 2, x: BETT_STAND_X,
        face: 1, state: "idle", expr: "tired", hits: [] });
    }
  }

  private updateBedEinstieg(dt: number) {
    const ph = this.bedEinstieg;
    if (!ph) return;
    if (ph === "anfahrt") {
      if (this.activity?.id === "bett_einstieg" && !this.cur && !this.path.length) {
        this.bedEinstieg = "umschlagen";
        this.bedEinstiegT = 0;
      }
      return;
    }
    if (ph === "toss") return; // updateBedToss beendet den Brillenwurf.
    const dauer = { umschlagen: 2.2, setzen: 1.2, fuesse: 1.5, greifen: 1.2 }[ph];
    this.bedEinstiegT += dt;
    if (this.bedEinstiegT < dauer) return;
    this.bedEinstiegT = 0;
    if (ph === "umschlagen") this.bedEinstieg = "setzen";
    else if (ph === "setzen") this.bedEinstieg = "fuesse";
    else if (ph === "fuesse") this.bedEinstieg = "greifen";
    else {
      this.bedEinstieg = "toss";
      if (this.bedBrilleBehalten || !this.beginBedToss()) {
        this.bedEinstieg = null;
        this.beginLieDown();
      }
    }
  }

  /** Hinlegen ist unabhängig davon, ob vorher eine Brille geworfen wurde. */
  private beginLieDown() {
    this.bedEinstieg = null;
    this.pending = null;
    this.activity = null;
    this.target = null;
    this.cur = null;
    this.path = [];
    this.lieDown = true;
    this.lieT = 0;
    this.dirty = true;
  }

  /** Landeplätze: 0 Nachttisch, 1 Gardinenstange, 2 Lampe, 3 Schrank, 4 Bett, 5 Boden */
  private tossTarget(): Pt {
    if (this.gruselSarg && this.brillenZielName) {
      const z = BRILLEN_ZIELE[this.brillenZielName];
      return [z.x, z.y];
    }
    // Alle Landeplätze liegen auf der Nachttischplatte (y = Boden - 26),
    // links neben dem Lampenstiel - nicht am Lampenschirm (Schirm y 274-288,
    // x 400-418) und nie auf dem Boden. Die alten Fallnummern bleiben als
    // Sicherheit erhalten, falls ein gespeicherter Zustand sie enthaelt.
    switch (this.tossLand) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      default:
        return [401, FLOOR_Y[2] - 27];
    }
  }

  private updateBedToss(dt: number) {
    if (this.bedPhase !== "toss") return;
    const T = 1.25;
    if (!this.tossLanded) {
      this.tossUp += dt;
      const u = clamp(this.tossUp / T, 0, 1);
      const [tx, ty] = this.tossTarget();
      if (u >= 1) {
        this.tossLanded = true;
        // Verbindung zur Hand wird genau beim Aufkommen gelöst. Ab jetzt liegt
        // die Brille als eigenes Objekt an ihrem Platz – nicht mehr am Kopf.
        this.glassesInHand = false;
        const rot = this.tossLand === 0 ? 0.1 : this.tossLand === 4 || this.tossLand === 5 ? 0.6 : 1.35;
        const sc = this.tossLand === 0 ? 0.45 : this.tossLand === 4 || this.tossLand === 5 ? 0.8 : 0.35;
        if (this.gruselSarg && this.brillenZielName) {
          const z = BRILLEN_ZIELE[this.brillenZielName];
          this.glassesRest = { x: z.x, y: z.y, rot: z.rot, scale: z.scale };
          this.brilleAmLeuchter = this.brillenZielName === "leuchter";
          if (this.brilleAmLeuchter) this.leuchterV += 0.5;
          if (this.brillenZielName === "fledermaus") this.fledermausBlink = 0.7;
        } else this.glassesRest = { x: tx, y: ty, rot, scale: sc };
        sfx.ui();
      }
      void tx;
      void ty;
      return;
    }
    if (this.tossLanded && this.bedPhase === "toss") {
      // Nach dem Landen: hinsetzen, zudecken, Hand unter das Ohr.
      this.bedPhase = null;
      if (this.gruselSarg) {
        // Gruselhaus: Deckel zuziehen und dabei zurücklehnen.
        this.sargStart("deckelZu");
        return;
      }
      this.bedEinstieg = null;
      this.beginLieDown();
    }
  }

  /** Brille im Flug vom Bett: hoher Bogen, drehend. */
  /** Abgelegte Brille bleibt exakt am Ablageort liegen. */
  private drawGlassesRest(c: C) {
    const g = this.glassesRest;
    if (!g) return;
    if (this.brilleAmLeuchter) {
      const [px, py] = leuchterPunkt(g.x, g.y, this.leuchterW);
      glassesObj(c, px, py, g.rot + this.leuchterW, g.scale);
      return;
    }
    glassesObj(c, g.x, g.y, g.rot, g.scale);
  }

  private drawBedToss(c: C) {
    if (this.bedPhase !== "toss") return;
    const T = 1.25;
    const u = this.tossLanded ? 1 : clamp(this.tossUp / T, 0, 1);
    const [x1, y1] = this.tossTarget();
    const imGrusel = this.gruselSarg;
    const x0 = imGrusel ? SCHLAFZIMMER.sitzX + 9 : 340;
    const y0 = imGrusel ? FLOOR_Y[2] - 52 : 306;
    // Hoher Bogen, aber nie durch die Zimmerdecke (Decke bei y 212).
    const hgt = imGrusel ? clamp((y0 + y1) / 2 - 216, 12, 70) : 70;
    if (u >= 1 && imGrusel) return;
    const x = lerp(x0, x1, u);
    const y = lerp(y0, y1, u) - 4 * hgt * u * (1 - u);
    if (u < 1) glassesObj(c, x, y, u * Math.PI * 5, lerp(1, 0.4, u * u));
    else if (this.tossLand === 0) glassesObj(c, x1, y1, 0.1, 0.45);
    else if (this.tossLand === 4 || this.tossLand === 5) glassesObj(c, x1, y1, 0.6, 0.8);
    else glassesObj(c, x1, y1, 1.35, 0.35);
  }

  /** Aufwachen im normalen Haus: wie bisher aufstehen, Brille wieder auf. */
  private aufwachen() {
    // Nur eine hier abgelegte Brille kommt wieder auf die Nase; das Becken bleibt unberührt.
    if (this.glassesRest && !this.glassesInSink && !this.glassesFly) {
      this.glassesOn = true;
      this.glassesRest = null;
    }
    this.asleep = false;
    this.bedEinstieg = null;
    this.sleepT = 0;
    this.bedSitHair = 0;
    this.activity = null;
    this.target = null;
    this.cur = null;
    this.path = [];
    this.pending = null;
    this.lf = 2;
    this.lx = 360;
    this.dirty = true;
    this.wakeT = 1.2;
  }

  /** Fortschritt des Zudeckens für die Zeichnung. */
  private sleepProgress(): { pull: number; grab: number; turn: number; hair: number } {
    const ease = (v: number) => {
      const k = clamp(v, 0, 1);
      return k * k * (3 - 2 * k);
    };
    const ph = this.sleepPhase;
    if (this.asleep) return { pull: 1, grab: 1, turn: 1, hair: 1 };
    if (!ph) return { pull: 0, grab: 0, turn: 0, hair: 0 };
    const p = clamp(this.sleepPhaseT / ({ grab: 0.75, pull: 1.9, turn: 1.3, settle: 1.4 } as const)[ph], 0, 1);
    switch (ph) {
      case "grab":
        return { pull: 0, grab: ease(p), turn: 0, hair: 0 };
      case "pull":
        return { pull: ease(p), grab: 1, turn: 0, hair: 0 };
      case "turn":
        return { pull: 1, grab: 1, turn: ease(p), hair: 0 };
      default:
        return { pull: 1, grab: 1, turn: 1, hair: ease(p) };
    }
  }

  private updateWake(dt: number) {
    if (this.wakeT > 0) {
      this.wakeT = Math.max(0, this.wakeT - dt);
      if (this.wakeT === 0 && this.wakeNext) {
        const next = this.wakeNext;
        this.wakeNext = null;
        this.command(next);
      }
    }
  }

  private updateBedState(dt: number) {
    if (this.sleepRest > 0) this.sleepRest = Math.max(0, this.sleepRest - dt);
    // Steht sie auf oder bricht ab, haengen die Haare wieder normal.
    if (this.bedSitHair > 0 && !this.asleep && !this.lieDown && !this.sleepPhase && !this.bedEinstieg) {
      this.bedSitHair = 0;
    }
    // Auch ein selbststaendiger Besuch am Bett durchlaeuft dieselben sichtbaren Schritte.
    if (!this.asleep && !this.bedEinstieg && !this.bedPhase && !this.lieDown &&
        !this.sleepPhase && !this.shPhase && this.activity?.id === "bett" &&
        !this.cur && this.path.length === 0) {
      this.startBedEinstieg(true);
    }
    if (this.lieDown) {
      this.lieT += dt;
      if (this.lieT >= 1.4) {
        this.lieDown = false;
        // Die Decke wurde bereits im Sitzen herangezogen; nur noch zurechtlegen.
        this.sleepPhase = "settle";
        this.sleepPhaseT = 0;
      }
      return;
    }

    // Zudecken und Zurechtlegen. Erst wenn die Decke am Kinn sitzt und sie auf
    // der Seite liegt, gilt sie als eingeschlafen.
    if (this.sleepPhase) {
      this.sleepPhaseT += dt;
      const d = { grab: 0.75, pull: 1.9, turn: 1.3, settle: 1.4 } as const;
      const order = ["grab", "pull", "turn", "settle"] as const;
      const cur = this.sleepPhase;
      if (this.sleepPhaseT >= d[cur]) {
        const i = order.indexOf(cur);
        if (i === order.length - 1) {
          this.sleepPhase = null;
          this.sleepPhaseT = 0;
          this.asleep = true;
          this.sleepT = 0;
          this.bedSitHair = 1;
        } else {
          this.sleepPhase = order[i + 1];
          this.sleepPhaseT = 0;
        }
      }
      return;
    }
    if (!this.asleep) return;
    // Beim Einschlafen zuerst die Haare neben das Ohr legen, dann still liegen.
    if (this.bedSitHair < 1) this.bedSitHair = Math.min(1, this.bedSitHair + dt * 0.8);
  }

  /** Brille in der Hand (über dem Gesicht) oder im hohen Bogen ins Becken. */
  /** Während der Bettfolge liegt die Hand unter dem Stoff: kein Gegenstand
   *  darf nachträglich über die Decke gemalt werden. */
  private handUnterDecke(): boolean {
    return this.lieDown || this.asleep || !!this.sleepPhase ||
      (!!this.bedEinstieg && this.bedEinstieg !== "anfahrt");
  }

  private drawGlassesMoving(c: C) {
    if (this.gruselBad && this.shPhase) {
      const p = clamp(this.shT / (SH_DUR[this.shPhase] ?? 1), 0, 1);
      const sx = BIO_BAD.hazmat.x;
      const sy = BIO_BAD.hazmat.y - 5;
      const [hx, hy] = this.hand;
      if (this.shPhase === "towelOff" && p >= .45) {
        drawHazmatVlies(c, hx, hy);
      } else if (this.shPhase === "throwTowel" && !this.towelOnRod) {
        const k = sanft((p - .38) / .17);
        drawHazmatVlies(c, lerp(hx, sx, k), lerp(hy, sy, k));
      } else if (this.shPhase === "takeTowel" && !this.towelOnRod) {
        const k = sanft((p - .45) / .4);
        drawHazmatVlies(c, lerp(sx, hx, k), lerp(sy, hy, k));
      } else if (this.shPhase === "wrapOn" && this.outfit !== "towel") {
        drawHazmatVlies(c, hx, hy);
      }
    }
    if (this.brushInHand && !this.handUnterDecke()) {
      const bent = this.shPhase === "bBrush" || this.shPhase === "bBend" || this.shPhase === "bUp";
      if (this.gruselBad) drawLabBrush(c, this.hand[0], this.hand[1], bent ? 0 : -0.7, this.lface);
      else brushObj(c, this.hand[0], this.hand[1], bent ? 0 : -0.7, this.lface);
    }
    // Beim Bettwurf malt drawBedToss die Brille bereits im Bogen; nicht zugleich an der Hand.
    if (!this.handUnterDecke() && this.glassesInHand && (this.gruselSarg || this.bedPhase !== "toss")) {
      const face = this.lface;
      disc(c, this.hand[0], this.hand[1], 2.2, LUNI_COLORS.skin);
      glassesObj(c, this.hand[0] + 2.6 * face, this.hand[1] - 1, -0.15 * face);
    }
    const f = this.glassesFly;
    if (f) {
      const u = clamp(f.t / GLASSES_FLIGHT, 0, 1);
      const [x1, y1] = SINK_DROP;
      // Hoher Bogen, der Scheitel bleibt unter der Decke.
      const hgt = Math.max(18, Math.min(46, (f.y0 + y1) / 2 - (FLOOR_Y[3] + SLAB + 8)));
      const x = lerp(f.x0, x1, u);
      const y = lerp(f.y0, y1, u) - 4 * hgt * u * (1 - u);
      glassesObj(c, x, y, u * Math.PI * 4, lerp(1, 0.45, u * u * u));
    }
  }

  /** Kleiner Knopf an der Fernseherblende. */
  private drawTvButton(c: C) {
    const x = 458;
    const y = 168;
    const pressed = this.golPhase === "press" && this.golAnimT > 0.25;
    disc(c, x, y, pressed ? 2.4 : 3.1, pressed ? "#ffe08a" : "#2a2e36");
    disc(c, x, y, pressed ? 1.1 : 1.5, pressed ? "#fff6d0" : "#35d6c0");
  }

  /* ------------------------ Teleflauschi: Einlegen ------------------------ */

  /** Holen abbrechen. Liegt das Modul noch nicht in der Konsole, kommt es ins Regal zurück. */
  private cancelFlauschiFetch() {
    this.flauschiPhase = null;
    this.flauschiAnimT = 0;
    if (!this.flauschiInserted && !this.flauschiOnShelf) {
      this.flauschiOnShelf = true;
      this.dirty = true;
    }
  }

  /** Greifen, zum Fernseher tragen, einlegen – danach läuft Flauschi auf dem Bild. */
  private updateFlauschiCarry(dt: number) {
    if (!this.flauschiWelt) return;
    const arrived = !this.cur && this.path.length === 0 && !this.pending;
    if (this.flauschiPhase === "reach" && arrived && this.activity?.id === "flauschi_modul") {
      this.flauschiAnimT += dt;
      if (this.flauschiAnimT >= 0.95) {
        this.flauschiOnShelf = false;
        this.dirty = true;
        sfx.ui();
        this.flauschiPhase = "carry";
        this.flauschiAnimT = 0;
        this.goTo(this.golTvStand());
      }
      return;
    }
    if (this.flauschiPhase === "carry" && arrived && this.activity?.id === "gol_tv") {
      this.flauschiPhase = "insert";
      this.flauschiAnimT = 0;
      return;
    }
    if (this.flauschiPhase === "insert") {
      this.flauschiAnimT += dt;
      if (this.flauschiAnimT >= 0.75) {
        this.flauschiInserted = true;
        this.flauschiOnShelf = false;
        if (!this.flauschiState) this.flauschiState = neuerFlauschiStand();
        this.tvDaten.tv_d.kanal = "flauschi";
        this.tvManual.tv_d = true;
        this.updateTVAudio();
        sfx.ui();
        this.speichern();
        this.flauschiPhase = "watch";
        this.flauschiAnimT = 0;
        this.goTo("gaming");
      }
      return;
    }
    if (this.flauschiPhase === "watch" && arrived && this.activity?.id === "gaming") {
      this.flauschiPhase = null;
    }
  }

  /** Echtzeit-Pflege: abwesende Stunden zählen als Schlaf, nicht als Verlust. */
  private updateFlauschi(dt: number) {
    if (!this.flauschiWelt) return;
    // Erster Besuch im Weihnachtshaus: Flauschi wird frisch angelegt,
    // damit der Speicherstand nicht mit Stunden Verzögerung startet.
    if (!this.flauschiState) this.flauschiState = neuerFlauschiStand();
    flauschiTick(this.flauschiState, Date.now());
    // Zeiger gedrückt auf dem Kopf: Flauschi wird weitergekrault und dabei schläfrig.
    if (this.flauschiHaelt) {
      if (this.flauschiFullscreen) flauschiKraulenHalten(this.flauschiState, dt);
      else this.flauschiHaelt = false;
    }
  }

  /**
   * Flauschi direkt anfassen: Kopf streicheln oder Bauch kitzeln – derselbe Weg
   * für Zeiger und Steuerkreuz. Der Fokus-Ring bleibt, wo er war: Ein Klick
   * mit dem Zeiger soll keinen Rahmen quer über Flauschis Gesicht hinterlassen.
   */
  private flauschiBeruehrenAusloesen(art: FlauschiBeruehrung) {
    if (!this.flauschiState || !this.flauschiAktiv) return;
    sfx.ensure();
    const flocks = flauschiBeruehren(this.flauschiState, art, Date.now(), this.flauschiOffen());
    // Jede Berührung und jeder Gegenstand hat sein eigenes, rein synthetisches Klangrezept.
    for (const [f, dauer, form, pegel, wann, f2] of flauschiKlang(this.flauschiState, art)) sfx.ton(f, dauer, form, pegel, wann, f2);
    if (flocks) sfx.sparkle();
    this.speichern();
  }

  /** Ein Paket auspacken: Der Gegenstand steht danach im Zimmer bereit. */
  private flauschiAuspackenAusloesen() {
    if (!this.flauschiState || !this.flauschiAktiv) return;
    const tuer = flauschiAuspacken(this.flauschiState, this.flauschiOffen());
    if (tuer === null) return;
    // War es das letzte Paket, wandert der Fokus zurück auf die Knöpfe.
    if (!flauschiPakete(this.flauschiOffen(), this.flauschiState).length) this.flauschiZoneFokus = null;
    sfx.ensure();
    sfx.wish();
    sfx.complete(5);
    this.speichern();
  }

  /** Pflegeaktion aus dem Vollbild – derselbe Weg für Zeiger und Steuerkreuz. */
  private flauschiAktionAusloesen(id: FlauschiAktion) {
    if (!this.flauschiState || !this.flauschiAktiv) return;
    this.flauschiFokus = id;
    this.flauschiZurueckFokus = false;
    this.flauschiZoneFokus = null;
    sfx.ensure();
    const flocks = flauschiAktion(this.flauschiState, id, Date.now());
    if (id === "fuettern") sfx.tick();
    else if (id === "streicheln") sfx.pet();
    else if (id === "spielen") sfx.jump();
    else sfx.pause();
    if (flocks) sfx.sparkle();
    this.speichern();
  }

  /** Modul an der Hand; beim Einlegen legt es die letzten Millimeter in die Konsole. */
  private drawFlauschiInHand(c: C) {
    if (!this.flauschiWelt || this.flauschiInserted || this.flauschiOnShelf || this.handUnterDecke()) return;
    let x = this.hand[0] - 3;
    let y = this.hand[1] - 11;
    if (this.flauschiPhase === "insert") {
      const t = clamp((this.flauschiAnimT - 0.4) / 0.32, 0, 1);
      const e = t * t * (3 - 2 * t);
      x = lerp(x, 456, e);
      y = lerp(y, 168, e);
    }
    drawFlauschiHuelle(c, x, y, 6, 11, this.elapsed);
  }

  /** Holen abbrechen. Liegt das Modul noch nicht in der Konsole, kommt es ins Regal zurück. */
  private cancelGolFetch() {
    this.golPhase = null;
    this.golAnimT = 0;
    if (!this.golInserted && !this.golOnShelf) {
      this.golOnShelf = true;
      this.dirty = true;
    }
  }

  /** Greifen, zum Fernseher gehen, einlegen, hinsetzen – und die Vergrößerung. */
  private updateGolCarry(dt: number) {
    const arrived = !this.cur && this.path.length === 0 && !this.pending;
    if (this.golPhase === "reach" && arrived && this.activity?.id === "gol_game") {
      // Das Modul bleibt im Regal, bis die Hand es wirklich erreicht hat.
      this.golAnimT += dt;
      if (this.golAnimT >= 0.95) {
        this.golOnShelf = false;
        this.dirty = true;
        sfx.ui();
        this.golPhase = "carry";
        this.golAnimT = 0;
        this.goTo(this.golTvStand());
      }
      return;
    }
    if (this.golPhase === "carry" && arrived && this.activity?.id === "gol_tv") {
      this.golPhase = "insert";
      this.golAnimT = 0;
      return;
    }
    if (this.golPhase === "insert") {
      this.golAnimT += dt;
      if (this.golAnimT >= 0.75) {
        this.golInserted = true;
        this.tvMode = "gol";
        this.tvDaten.tv_d.kanal = "gol";
        if (!this.golState) this.golState = createState();
        sfx.ui();
        this.golPhase = "watch";
        this.golAnimT = 0;
        this.goTo("gaming");
      }
      return;
    }
    if (this.golPhase === "watch" && arrived && this.activity?.id === "gaming") {
      this.golPhase = null;
      return;
    }
    if (this.golPhase === "rise") {
      this.golAnimT += dt;
      if (this.golAnimT >= 0.5) {
        this.golPhase = "toButton";
        this.golAnimT = 0;
        this.goTo(this.golTvStand());
      }
      return;
    }
    if (this.golPhase === "toButton" && arrived && this.activity?.id === "gol_tv") {
      this.golPhase = "press";
      this.golAnimT = 0;
      return;
    }
    if (this.golPhase === "press") {
      this.golAnimT += dt;
      if (this.golAnimT >= 0.7) {
        this.tvZoom = "tv_d";
        sfx.ui();
        this.golPhase = "back";
        this.golAnimT = 0;
        this.goTo("gaming");
      }
      return;
    }
    if (this.golPhase === "back" && arrived && this.activity?.id === "gaming") {
      this.golPhase = null;
    }
  }

  /**
   * Modul an der Hand. Es hängt fest an der vorderen Hand und wird nicht
   * über die Bühne geschoben; nur beim Einlegen legt es die letzten
   * Millimeter in den Steckplatz unter dem Fernseher.
   */
  private drawGolInHand(c: C) {
    if (this.golInserted || this.golOnShelf || this.handUnterDecke()) return;
    let x = this.hand[0] - 3;
    let y = this.hand[1] - 11;
    if (this.golPhase === "insert") {
      const t = clamp((this.golAnimT - 0.4) / 0.32, 0, 1);
      const e = t * t * (3 - 2 * t);
      x = lerp(x, 446, e);
      y = lerp(y, 167, e);
    }
    golCartridge(c, x, y, 6, 11);
  }

  /**
   * Vergrößerung. Ein Pixel je Zelle in einem kleinen Puffer, der ohne
   * Glättung auf die Bühne gezogen wird. Neu gemalt wird nur bei neuer
   * Generation oder neuer Zellenzahl.
   */
  /* --------------------------- Adventskalender --------------------------- */

  /** Stand zum aktuellen (Echtzeit-)Jahr laden; bei Jahreswechsel frisch. */
  private adventStandPruefen() {
    const jahr = this.clock.year || new Date().getFullYear();
    if (this.adventStand.jahr !== jahr) {
      this.adventStand = ladeAdvent(jahr, this.welt);
      this.adventTuerenCache = null;
      this.adventAnims.clear();
    }
  }

  private adventTuerLayout() {
    if (!this.adventTuerenCache) this.adventTuerenCache = adventTueren(adventMischung(this.adventStand.jahr));
    return this.adventTuerenCache;
  }

  private adventAuf() {
    this.adventStandPruefen();
    this.adventFullscreen = true;
    this.adventSchliessen = false;
    // Fokus auf das erste noch geschlossene Türchen
    const tueren = this.adventTuerLayout();
    const idx = tueren.findIndex((tue) => !this.adventStand.offen.includes(tue.tag));
    this.adventFokus = idx >= 0 ? idx : 0;
    this.adventHover = -1;
    sfx.ui();
  }

  private adventZu() {
    if (!this.adventFullscreen || this.adventSchliessen) return;
    this.adventSchliessen = true;
    sfx.ui();
  }

  /** Türchen öffnen (Maus, Touch oder Tastatur). */
  private adventOeffne(index: number) {
    const tueren = this.adventTuerLayout();
    const tue = tueren[index];
    if (!tue) return;
    this.adventFokus = index;
    if (this.adventStand.offen.includes(tue.tag)) return;
    const frei = adventFrei(tue.tag, this.clock.month, this.clock.day, ADVENT_NACH_DATUM);
    if (!frei) return; // Finalmodus: Türchen ist noch zugefroren
    if (adventOeffnen(this.adventStand, tue.tag, true, this.welt)) {
      this.adventAnims.set(index, 0.001);
      this.adventGlanzT = 1.6;
      this.dirty = true; // der kleine Kalender an der Wand zeigt das neue Türchen
      if (tue.tag === ADVENT_TAGE) this.adventGruss = true;
      if (adventSternVerdient(this.adventStand)) this.adventSternT = 4;
      sfx.ui();
    }
  }

  private adventKlick(x: number, y: number) {
    if (this.adventZoomT < 0.9) return;
    // Der Weihnachtsgruß geht mit jedem Klick weg; erst danach reagieren die Türchen wieder.
    if (this.adventGruss) {
      this.adventGruss = false;
      sfx.ui();
      return;
    }
    const b = ADVENT_ZURUECK;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      this.adventZu();
      return;
    }
    const index = adventTuerBei(this.adventTuerLayout(), x, y);
    if (index >= 0) this.adventOeffne(index);
  }

  /** Zoom, Türchen-Animationen und Goldstern weiterticken. */
  private adventAktualisieren(dt: number) {
    if (this.adventFullscreen) {
      this.adventT += dt;
      if (this.adventGlanzT > 0) this.adventGlanzT = Math.max(0, this.adventGlanzT - dt);
      if (!this.adventSchliessen && this.adventZoomT < 1) this.adventZoomT = Math.min(1, this.adventZoomT + dt / 0.5);
      for (const [i, v] of this.adventAnims) {
        if (v < 1) this.adventAnims.set(i, Math.min(1, v + dt / 0.78));
      }
      if (this.adventSternT > 0) this.adventSternT = Math.max(0, this.adventSternT - dt);
    }
    if (this.adventSchliessen) {
      this.adventZoomT = Math.max(0, this.adventZoomT - dt / 0.32);
      if (this.adventZoomT === 0) {
        this.adventFullscreen = false;
        this.adventSchliessen = false;
        // Geschlossen bleibt geschlossen: Die Wartezeit darf nicht im selben Bild erneut öffnen.
        this.adventWarteT = 0;
        this.dirty = true;
        if (this.activity?.id === "adventskalender") this.finishActivity();
      }
    }
  }

  /**
   * Schmuck rund um die Kalendertafel (Weihnachtshaus). Der feste Teil wird
   * einmal je Türchenstand in einen Puffer gezeichnet; Licht, Glanz und die
   * Ecken-Kugeln leben in jedem Bild.
   */
  private drawAdventSchmuck(c: C) {
    const anzahl = this.adventStand.offen.length;
    const sonntage = adventsSonntage(Date.now());
    const key = `${anzahl}|${sonntage}`;
    if (key !== this.adventSchmuckKey) {
      this.adventSchmuckKey = key;
      const pc = this.adventSchmuckPuffer.getContext("2d");
      if (pc) {
        pc.clearRect(0, 0, W, H);
        adventSchmuck(pc, RAHMEN, anzahl, sonntage, 0, true);
      }
    }
    c.drawImage(this.adventSchmuckPuffer, 0, 0);
    adventSchmuck(c, RAHMEN, anzahl, sonntage, this.adventT, false);
    if (this.adventGlanzT > 0 && anzahl > 0) adventSchmuckGlanz(c, RAHMEN, anzahl - 1, 1 - this.adventGlanzT / 1.6);
  }

  /** Vollbild-Ansicht: von der Wandtafel hereinzoomen, 24 Türchen, Nachthimmel. */
  private drawAdventskalender(c: C) {
    const z = this.adventZoomT;
    if (z <= 0) return;
    const weichZ = z * z * (3 - 2 * z);
    // Nur das Weihnachtshaus hat den Kalender im Weltall; das normale Haus bleibt unverändert.
    const kalenderStil = this.welt === "weihnacht" ? "weltraum" : "klassisch";
    c.fillStyle = kalenderStil === "weltraum" ? `rgba(5,9,20,${0.86 * weichZ})` : `rgba(24,10,6,${0.8 * weichZ})`;
    c.fillRect(0, 0, W, H);
    const wand = ADVENT_WAND;
    c.save();
    c.globalAlpha = weichZ;
    // Zentrum wandert beim Zoomen von der Wandtafel zur Bildschirmmitte,
    // damit der Kalender am Ende (sk = 1) die ganze Bühne füllt.
    const zx = lerp(wand.x + wand.w / 2, W / 2, weichZ);
    const zy = lerp(wand.y + wand.h / 2, H / 2, weichZ);
    const sk = 0.08 + 0.92 * weichZ;
    c.translate(zx, zy);
    c.scale(sk, sk);
    c.translate(-W / 2, -H / 2);

    adventRahmen(c, this.adventT, kalenderStil, this.adventStand.offen.length);
    const tueren = this.adventTuerLayout();
    for (let i = 0; i < tueren.length; i++) {
      const tue = tueren[i];
      const offen = this.adventStand.offen.includes(tue.tag);
      // Laufende Öffnungsanimation hat Vorrang; sonst den gespeicherten Zustand zeigen.
      const anim = this.adventAnims.has(i) ? this.adventAnims.get(i) ?? 0 : offen ? 1 : 0;
      const frei = adventFrei(tue.tag, this.clock.month, this.clock.day, ADVENT_NACH_DATUM);
      adventTuer(c, tue.r, tue.tag, { offen, anim },
        { fokus: this.adventFokus === i, hover: this.adventHover === i, gesperrt: !frei }, this.adventT, kalenderStil);
    }
    // Weihnachtshaus: der Schmuck außerhalb der Tafel wächst mit den Türchen.
    if (kalenderStil === "weltraum") this.drawAdventSchmuck(c);

    // Geheime Belohnung: alle 24 in der Reihenfolge 1–24 (Konzept 3.1)
    if (this.adventSternT > 0) {
      const k = Math.min(1, (4 - this.adventSternT) / 0.6) * Math.min(1, this.adventSternT / 0.8);
      c.save();
      // Mit dem Weihnachtsgruß rückt der Stern über die Tafel.
      c.translate(W / 2, this.adventGruss ? H / 2 - 100 : H / 2);
      c.rotate(Math.sin(this.adventT * 1.4) * 0.06);
      c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      c.fillStyle = `rgba(232,194,90,${0.95 * k})`;
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 46 : 19;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.restore();
    // Beim 24. Türchen: der Weihnachtsgruß. Er bleibt stehen, bis er weggeklickt wird.
    if (this.adventGruss) adventGruss(c, kalenderStil);
    }

    // Zurück-Knopf im warmen Holz-Gold-Stil
    rrect(c, ADVENT_ZURUECK.x, ADVENT_ZURUECK.y, ADVENT_ZURUECK.w, ADVENT_ZURUECK.h, 6, "#3c2413");
    c.strokeStyle = "#c49a35";
    c.lineWidth = 1.3;
    c.strokeRect(ADVENT_ZURUECK.x + 0.8, ADVENT_ZURUECK.y + 0.8, ADVENT_ZURUECK.w - 1.6, ADVENT_ZURUECK.h - 1.6);
    c.fillStyle = "#e8c25a";
    c.font = '700 13px "Space Grotesk", sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("zurueck", ADVENT_ZURUECK.x + ADVENT_ZURUECK.w / 2, ADVENT_ZURUECK.y + ADVENT_ZURUECK.h / 2 + 0.5);
    c.textAlign = "left";
    c.textBaseline = "alphabetic";

    adventHinweis(c, ADVENT_NACH_DATUM, this.clock.month === 12, kalenderStil);
    c.restore();
  }

  /** Zeichnet das aktive Spiel-des-Lebens-Raster in den Bereich (x, y, w, h). */
  private drawGolGridInTv(c: C, g: GOLState) {
    const view = golView(g);
    const key = `${g.generation}|${g.cols}x${g.rows}|${this.golEdits}`;
    if (key !== this.golBufKey) {
      if (this.golBuf.width !== g.cols || this.golBuf.height !== g.rows) {
        this.golBuf.width = g.cols;
        this.golBuf.height = g.rows;
        this.golImg = null;
      }
      const bc = this.golBuf.getContext("2d");
      if (bc) {
        if (!this.golImg) this.golImg = bc.createImageData(g.cols, g.rows);
        paintCells(this.golImg, g);
        bc.putImageData(this.golImg, 0, 0);
      }
      this.golBufKey = key;
    }

    c.save();
    c.imageSmoothingEnabled = false;
    c.drawImage(this.golBuf, view.x, view.y, view.w, view.h);
    c.restore();

    c.fillStyle = "rgba(6,16,24,.78)";
    c.fillRect(GOL_X + 8, GOL_Y + 8, 178, 18);
    c.fillStyle = "#f2f7f4";
    c.font = '700 10px "Silkscreen", monospace';
    c.textAlign = "left";
    c.fillText(`Gen ${g.generation}`, GOL_X + 12, GOL_Y + 20);
  }

  /**
   * Große TV-Darstellung: zeigt immer einen Fernseher (Wohnzimmer-Röhre oder
   * Dachgeschoss-Flachbildschirm) und stellt auf dessen Bildfläche das aktuell
   * laufende Bild groß dar.
   */
  private drawTvFullscreen(c: C) {
    const which = this.tvZoom;
    if (!which) return;
    rect(c, 0, 0, W, H, "rgba(4,11,16,.88)");

    const mode = this.tvContent(which);
    const an = mode !== "off";

    if (which === "tv_e") {
      // ── Erdgeschoss: Wohnzimmer-Röhrenfernseher im Holzgehäuse ──────
      // Standfüße
      poly(c, [[204, 480], [228, 480], [216, 504], [194, 504]], "#4f3a20");
      poly(c, [[732, 480], [756, 480], [766, 504], [744, 504]], "#4f3a20");
      // Holzgehäuse
      rrect(c, 116, 48, 728, 434, 18, "#8a6a3c");
      rrect(c, 120, 52, 720, 6, 3, "rgba(255,235,195,.2)");
      rrect(c, 122, 54, 716, 422, 14, "#74572e");
      // Röhren-Rahmen links
      rrect(c, 134, 66, 594, 398, 16, "#1d242a");
      rrect(c, 144, 76, 574, 378, 14, "#0b1217");

      // Bildfläche: exakt 14× der kleinen Wohnzimmer-Bildfläche (40×26 -> 560×364)
      const sx = 150, sy = 84, sw = 560, sh = 364;
      c.save();
      rrPath(c, sx, sy, sw, sh, 12);
      c.clip();
      if (mode === "off") {
        rect(c, sx, sy, sw, sh, "#0b1217");
        c.fillStyle = "rgba(185,216,205,.35)";
        c.font = '700 12px "Silkscreen", monospace';
        c.fillText("STANDBY", sx + 18, sy + 28);
      } else if (mode === "gol" && this.golState) {
        c.save();
        c.imageSmoothingEnabled = false;
        c.fillStyle = "#071016";
        c.fillRect(sx, sy, sw, sh);
        c.drawImage(this.golBuf, sx, sy, sw, sh);
        c.restore();
      } else {
        c.save();
        c.translate(sx, sy);
        c.scale(14, 14);
        this.drawTvProgram(c, 0, 0, 40, 26, mode);
        c.restore();
      }
      // Röhren-Glasglanz
      const gl = c.createLinearGradient(sx, sy, sx + sw * 0.45, sy + sh * 0.45);
      gl.addColorStop(0, "rgba(255,255,255,.10)");
      gl.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gl;
      c.fillRect(sx, sy, sw, sh);
      c.restore();

      // Bedienfeld rechts am Holzfernseher
      rrect(c, 742, 74, 84, 382, 8, "#222930");
      rrect(c, 745, 77, 78, 376, 6, "#181e24");
      // Lautsprecherschlitze
      for (let i = 0; i < 9; i++) {
        rrect(c, 754, 96 + i * 9, 60, 4, 2, "#0d1216");
      }
      // Zwei Drehregler (CH / VOL)
      for (const [ry, lbl] of [[214, "CH"], [282, "VOL"]] as const) {
        disc(c, 784, ry, 20, "#2f3840");
        disc(c, 784, ry, 15, "#151a1f");
        line(c, 784, ry, 792, ry - 10, "#d7e3de", 2.2);
        c.fillStyle = "#9db5ae";
        c.font = '700 10px "Silkscreen", monospace';
        c.textAlign = "center";
        c.fillText(lbl, 784, ry + 32);
      }
      c.textAlign = "left";
      // Status-LED
      disc(c, 784, 344, 5, an ? "#35d6c0" : "#d9453a");
      // Power-Knopf (≥ 24×24)
      rrect(c, TV_PWR_E.x, TV_PWR_E.y, TV_PWR_E.w, TV_PWR_E.h, 5, an ? "#24403e" : "#3a2224");
      c.strokeStyle = an ? "#35d6c0" : "#e26a62";
      c.lineWidth = 1.2;
      c.strokeRect(TV_PWR_E.x + 0.6, TV_PWR_E.y + 0.6, TV_PWR_E.w - 1.2, TV_PWR_E.h - 1.2);
      c.fillStyle = "#eef7f2";
      c.font = '700 11px "Silkscreen", monospace';
      c.textAlign = "center";
      c.fillText(an ? "AUS" : "EIN", TV_PWR_E.x + TV_PWR_E.w / 2, TV_PWR_E.y + 22);

      // Zurück-Knopf
      rrect(c, TV_BACK_E.x, TV_BACK_E.y, TV_BACK_E.w, TV_BACK_E.h, 5, "#0d1820");
      c.strokeStyle = "#f2f7f4";
      c.lineWidth = 1.2;
      c.strokeRect(TV_BACK_E.x + 0.6, TV_BACK_E.y + 0.6, TV_BACK_E.w - 1.2, TV_BACK_E.h - 1.2);
      c.fillStyle = "#f2f7f4";
      c.font = '700 12px "Silkscreen", monospace';
      c.fillText("zurück", TV_BACK_E.x + TV_BACK_E.w / 2, TV_BACK_E.y + 22);
      c.textAlign = "left";
      drawFernbedienung(c, this.tvKanal(which), this.tvDaten[which].lautstaerke, an, this.tvFernHover, this.tvFernFokus);
      return;
    }

    // ── Dachgeschoss: Moderner Flachbildfernseher (inkl. Standfuß) ─────
    // Standfuß unter dem Gehäuse
    rect(c, 452, 376, 56, 14, "#232732");
    rrect(c, 368, 386, 224, 10, 4, "#2c313e");
    rect(c, 372, 386, 216, 2, "rgba(255,255,255,.14)");

    // TV-Gehäuse
    rrect(c, 104, 34, 752, 344, 12, "#15171c");
    c.strokeStyle = "#2d323e";
    c.lineWidth = 1.6;
    c.strokeRect(104.8, 34.8, 750.4, 342.4);
    rect(c, 114, 46, 732, 312, "#0a0d12");

    // Bildfläche (720×300, exakt GOL_X/GOL_Y/GOL_VIEW_W/GOL_VIEW_H)
    const sx = GOL_X, sy = GOL_Y, sw = GOL_VIEW_W, sh = GOL_VIEW_H;
    c.save();
    c.beginPath();
    c.rect(sx, sy, sw, sh);
    c.clip();
    if (mode === "off") {
      rect(c, sx, sy, sw, sh, "#0a0d12");
      c.fillStyle = "rgba(185,216,205,.35)";
      c.font = '700 12px "Silkscreen", monospace';
      c.fillText("STANDBY", sx + 16, sy + 26);
    } else if (mode === "flauschi" && this.flauschiState) {
      // Vergrößerung: Flauschi groß, mit klassischem Balken-Interface unten.
      drawFlauschiSzene(c, sx, sy, sw, sh, this.elapsed, this.flauschiState, this.flauschiOffen());
      drawFlauschiHud(c, sx, sy + sh - 40, sw, this.flauschiState);
    } else if (mode === "gol" && this.golState) {
      this.drawGolGridInTv(c, this.golState);
    } else {
      c.save();
      c.translate(sx, sy);
      c.scale(10, 10);
      this.drawTvProgram(c, 0, 0, 72, 30, mode);
      c.restore();
    }
    // Dezente Glasreflexion oben links
    const gl = c.createLinearGradient(sx, sy, sx + sw * 0.35, sy + sh * 0.4);
    gl.addColorStop(0, "rgba(255,255,255,.07)");
    gl.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gl;
    c.fillRect(sx, sy, sw, sh);
    c.restore();

    c.strokeStyle = "#24333a";
    c.lineWidth = 2;
    c.strokeRect(sx - 1, sy - 1, sw + 2, sh + 2);

    // Untere TV-Leiste: Markenstrich, Status-LED und Power-Knopf
    rrect(c, 444, 362, 72, 4, 2, "#2f3542");
    disc(c, 764, 363, 4.2, an ? "#35d6c0" : "#d9453a");
    rrect(c, TV_PWR_D.x, TV_PWR_D.y, TV_PWR_D.w, TV_PWR_D.h, 4, an ? "#1b3332" : "#341e20");
    c.strokeStyle = an ? "#35d6c0" : "#e26a62";
    c.lineWidth = 1.1;
    c.strokeRect(TV_PWR_D.x + 0.6, TV_PWR_D.y + 0.6, TV_PWR_D.w - 1.2, TV_PWR_D.h - 1.2);
    c.fillStyle = "#eef7f2";
    c.font = '700 10px "Silkscreen", monospace';
    c.textAlign = "center";
    c.fillText(an ? "AUS" : "EIN", TV_PWR_D.x + TV_PWR_D.w / 2, TV_PWR_D.y + 17);
    c.textAlign = "left";

    if (mode === "flauschi" && this.flauschiState) {
      // Vier Pflegeknöpfe links, Geschenktafel darunter, „zurück“ rechts.
      // Der Ring sitzt immer nur auf einem Ziel: Knopf, Flauschi oder „zurück“.
      drawFlauschiKnoepfe(c, this.flauschiState, this.flauschiHover,
        this.flauschiZoneFokus || this.flauschiZurueckFokus ? null : this.flauschiFokus, this.flauschiZurueckFokus);
      drawFlauschiAlbum(c, 120, 354, this.flauschiState);
      drawFlauschiGeschenke(c, 120, 450, 500, 96, this.flauschiOffen());
      drawFlauschiZonen(c, this.flauschiZoneHover, this.flauschiZoneFokus);
    } else if (mode === "gol" && this.golState) {
      const g = this.golState;
      drawGolControls(c);
      const fade = clamp(this.golMeterT / 0.4, 0, 1);
      if (this.golMeterKind === "speed") drawSpeedMeter(c, g.speedIdx, GOL_SPEEDS.length, fade);
      else drawSpeedMeter(c, g.sizeIdx, GOL_SIZES.length, fade);

      c.fillStyle = "#000000";
      c.fillRect(GOL_BTN.x, GOL_BTN.y, GOL_BTN.w, GOL_BTN.h);
      c.strokeStyle = "#f2f7f4";
      c.lineWidth = 1.2;
      c.strokeRect(GOL_BTN.x + 0.6, GOL_BTN.y + 0.6, GOL_BTN.w - 1.2, GOL_BTN.h - 1.2);
      c.fillStyle = "#f2f7f4";
      c.font = '700 12px "Silkscreen", monospace';
      c.textAlign = "center";
      c.fillText("zurück", GOL_BTN.x + GOL_BTN.w / 2, GOL_BTN.y + 22);
      c.textAlign = "left";

      const ry = GOL_BTN.y + GOL_BTN.h + 24;
      c.fillStyle = "#8fa8a0";
      c.font = '700 10px "Silkscreen", monospace';
      c.fillText("REGELN", GOL_X, ry);
      c.fillStyle = "#dfe9e4";
      c.font = '600 11px "Silkscreen", monospace';
      // Die Fernbedienung bleibt rechts frei; Regeln behalten ihre Schriftgroesse.
      let regelY = ry + 18;
      for (const regel of GOL_RULES) {
        let zeile = "";
        for (const wort of regel.split(" ")) {
          const probe = zeile ? `${zeile} ${wort}` : wort;
          if (zeile && c.measureText(probe).width > 490) {
            c.fillText(zeile, GOL_X, regelY); regelY += 16;
            zeile = wort;
          } else zeile = probe;
        }
        c.fillText(zeile, GOL_X, regelY); regelY += 16;
      }
    } else {
      rrect(c, TV_BACK_D.x, TV_BACK_D.y, TV_BACK_D.w, TV_BACK_D.h, 5, "#0d1820");
      c.strokeStyle = "#f2f7f4";
      c.lineWidth = 1.2;
      c.strokeRect(TV_BACK_D.x + 0.6, TV_BACK_D.y + 0.6, TV_BACK_D.w - 1.2, TV_BACK_D.h - 1.2);
      c.fillStyle = "#f2f7f4";
      c.font = '700 12px "Silkscreen", monospace';
      c.textAlign = "center";
      c.fillText("zurück", TV_BACK_D.x + TV_BACK_D.w / 2, TV_BACK_D.y + 22);
      c.textAlign = "left";
    }
    drawFernbedienung(c, this.tvKanal(which), this.tvDaten[which].lautstaerke, an, this.tvFernHover, this.tvFernFokus);
  }

  /** Zellenzahl, Geschwindigkeit und Neustart. */
  private applyGolCtrl(id: ReturnType<typeof golCtrlAt>) {
    if (!id || !this.golState) return;
    const g = this.golState;
    if (id === "more" || id === "fewer") {
      const next = clamp(g.sizeIdx + (id === "more" ? 1 : -1), 0, GOL_SIZES.length - 1);
      resize(g, next);
      this.golMeterKind = "size";
      this.golMeterT = 1.8;
    } else if (id === "faster" || id === "slower") {
      g.speedIdx = clamp(g.speedIdx + (id === "faster" ? 1 : -1), 0, GOL_SPEEDS.length - 1);
      this.golMeterKind = "speed";
      this.golMeterT = 1.8;
    } else {
      randomize(g.cells);
      g.generation = 0;
      g.population = countPopulation(g.cells);
    }
    this.golEdits++;
    sfx.ui();
  }

  private onTvFullscreenClick(x: number, y: number) {
    const which = this.tvZoom;
    if (!which) return;
    const fern = tvFernTreffer(x, y);
    if (fern) {
      this.tvFernFokus = fern;
      this.tvBefehl(fern);
      return;
    }
    const inBox = (b: { x: number; y: number; w: number; h: number }) =>
      x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    const back = which === "tv_e" ? TV_BACK_E
      : (this.golFullscreen ? GOL_BTN : this.flauschiFullscreen ? FLAUSCHI_ZURUECK : TV_BACK_D);
    if (inBox(back)) {
      this.tvZoom = null;
      sfx.ui();
      return;
    }
    const pwr = which === "tv_e" ? TV_PWR_E : TV_PWR_D;
    if (inBox(pwr)) {
      this.toggleTvPower(which);
      sfx.ui();
      return;
    }
    if (this.flauschiFullscreen) {
      const kn = flauschiKnopfBei(x, y);
      if (kn) {
        this.flauschiAktionAusloesen(kn.id);
        return;
      }
      // Flauschi oder ein Gegenstand angeklickt – oder ein wartendes Paket.
      const zone = flauschiZoneBei(x, y, this.flauschiOffen(), this.flauschiState ?? undefined);
      if (zone) {
        if (zone.id === "paket") {
          this.flauschiAuspackenAusloesen();
          return;
        }
        this.flauschiBeruehrenAusloesen(zone.id);
        // Zeiger auf dem Kopf gedrückt halten = langes Kraulen; endet beim Loslassen.
        this.flauschiHaelt = zone.id === "kraulen";
      }
      return;
    }
    if (!this.golFullscreen || !this.golState) return;
    const ctrl = golCtrlAt(x, y);
    if (ctrl) {
      this.applyGolCtrl(ctrl);
      return;
    }
    const v = golView(this.golState);
    if (x < v.x || y < v.y || x >= v.x + v.w || y >= v.y + v.h) return;
    toggleCellAt(this.golState, Math.floor((x - v.x) / v.cell), Math.floor((y - v.y) / v.cell));
    this.golState.population = countPopulation(this.golState.cells);
    this.golEdits++;
  }

  /** Feste Taktung, unabhängig von der Bildrate; höchstens vier Schritte je Bild. */
  private updateGOL(dt: number) {
    if (this.golMeterT > 0) this.golMeterT = Math.max(0, this.golMeterT - dt);
    const g = this.golState;
    if (!g || !g.running) return;
    this.golTimer += dt;
    const interval = 1 / GOL_SPEEDS[g.speedIdx];
    let steps = 0;
    while (this.golTimer >= interval && steps < 4) {
      this.golTimer -= interval;
      advance(g);
      steps++;
    }
    if (steps) g.population = countPopulation(g.cells);
    if (this.golTimer > interval) this.golTimer = 0;
  }

  private drawClock(c: C) {
    const x = 427;
    const y = 344;
    rrect(c, x, y, 56, 28, 3, "#0b1217");
    c.strokeStyle = "#2a3a44";
    c.lineWidth = 1.4;
    c.strokeRect(x + 0.7, y + 0.7, 54.6, 26.6);
    const { hour, min, day, month } = this.clock;
    const two = (n: number) => String(n).padStart(2, "0");
    const colon = Math.floor(this.elapsed) % 2 === 0 ? ":" : " ";
    c.textAlign = "center";
    c.fillStyle = "#63b3ff";
    c.font = '700 7px "Silkscreen", monospace';
    c.fillText(`${two(day)}.${two(month)}.`, x + 28, y + 10);
    c.font = '700 13px "Silkscreen", monospace';
    c.fillText(`${two(hour)}${colon}${two(min)}`, x + 28, y + 23);
    c.textAlign = "left";
  }

  private drawLuniNow(c: C) {
    this.luniHaende = null;
    this.luniKopf = null;
    if (this.alpha <= 0.01) return;
    if (this.gruselSarg && this.asleep) {
      // Sie liegt im geschlossenen Sarg: nur die Zzz steigen aus der Deckelfuge.
      drawSleepZ(c, SCHLAFZIMMER.sitzX - 8, FLOOR_Y[2] - 36, this.sleepT);
      return;
    }
    const a = this.cur;
    let x = this.lx;
    let y: number = FLOOR_Y[this.lf];
    let state: LuniState = "idle";
    let expr: LuniExpr = "happy";
    let face = this.lface;
    let yOff = 0;
    let st: Station | null = null;
    let clip = false;
    let onStair = false;

    if (a) {
      if (a.step.k === "stair" && a.phase === "climb") {
        const p = stairPos(a.step.s, a.t);
        x = p[0];
        y = p[1];
        clip = a.step.s.warp;
        onStair = true;
        state = "walk";
      } else if (a.step.k === "walk") {
        state = "walk";
      } else {
        state = "idle";
        expr = "neutral";
      }
    } else if (this.activity) {
      st = this.activity;
      state = st.state;
      expr = st.expr;
      face = st.face;
      yOff = st.yOff ?? 0;
      // Mit Zigarette in der Hand raucht sie wirklich (erst nach dem Anzünden).
      if (st.id === "raucherstuhl" && this.lightT !== null) {
        state = "sit";
        expr = "focus";
      } else if (st.id === "raucherstuhl" && this.holding && this.burnLeft > 0) {
        state = "smoke";
        expr = "happy";
      }
    }

    // Pose-Phase für Aschenbecher und Einpacken
    let posePhase = 0;

    // Am Aschenbecher steht sie auf und tritt neben den Tisch, damit der
    // Arm kurz bleibt. WICHTIG: erst wenn sie am Tisch angekommen ist
    // (`!this.ashWalking`), sonst würde die Gehanimation übersprungen
    // und sie würde von der Tür zum Tisch springen.
    // Aufstehen: Blendung zwischen Sitz- und Stehpose, Füße bleiben am Boden
    if (this.standing) {
      const seat = STATIONS.find((s) => s.id === "raucherstuhl");
      const sp = clamp(this.standT, 0, 1);
      if (seat) {
        st = seat;
        x = seat.x;
        y = FLOOR_Y[seat.floor];
        face = seat.face;
      }
      yOff = -10 * (1 - sp);
      state = "standup";
      expr = "neutral";
      posePhase = sp;
    } else if (this.ashMove && !this.ashWalking && this.ashSitzend) {
      // Sie bleibt sitzen und greift daneben – kein Ortswechsel, kein Stretch.
      const seat = STATIONS.find((s) => s.id === "raucherstuhl");
      if (seat) {
        st = seat;
        x = seat.x;
        y = FLOOR_Y[seat.floor];
        yOff = seat.yOff ?? 0;
        face = seat.face;
      }
      expr = "neutral";
      state = "ashtray";
    } else if (this.ashMove && !this.ashWalking) {
      // Stehend am Aschenbecher: sie setzt sich nicht, nur der Arm greift.
      expr = "neutral";
      state = "idle";
    } else if (this.packMove || this.takeMove) {
      // Am Küchentisch: einpacken bzw. eine Zigarette mitnehmen
      state = "pack";
      expr = "focus";
      posePhase = this.packMove
        ? clamp(this.packT / 1.1, 0, 1)
        : clamp(this.takeT / 0.9, 0, 1);
    } else if (state === "pet" && this.petHund) {
      // Sanft in die Hocke (0..0.45 s), streicheln, weich wieder aufstehen (3.35..3.8 s)
      posePhase = Math.min(clamp(this.petT / 0.45, 0, 1), clamp((3.8 - this.petT) / 0.45, 0, 1));
    }

    let back = false;
    let hairAside = 0;
    if (this.bedEinstieg && this.bedEinstieg !== "anfahrt") {
      const ph = this.bedEinstieg;
      const d = { umschlagen: 2.2, setzen: 1.2, fuesse: 1.5, greifen: 1.2, toss: 1.25 }[ph];
      const p = clamp(this.bedEinstiegT / d, 0, 1);
      const e = sanft(p);
      const f = FLOOR_Y[2];
      const weihnacht = this.welt === "weihnacht";
      this.lastPose = ph === "umschlagen" ? "act" : "sit";
      const decke = bedBlanketPose(ph, p);
      const deckeZeichnen = () => {
        const s = this.scale * this.dpr;
        c.save();
        c.setTransform(s, 0, 0, s, 0, 0);
        drawBedEntryBlanket(c, this.elapsed, ph, p, weihnacht);
        c.restore();
      };
      if (ph === "umschlagen") {
        drawBedEntryBlanket(c, this.elapsed, ph, p, weihnacht);
        const hand = drawLuni(c, BETT_STAND_X, f, {
          t: this.elapsed, state: "idle", expr: "focus", face: 1,
          scale: LUNI_SCALE, shadow: false, glasses: this.glassesOn,
          outfit: this.bedKleidungAn, pajama: this.bedPyjama,
          bedLean: Math.sin(Math.PI * e) * 0.3,
          handTarget: bedBlanketPushHand(p),
          handElbow: 1, handKontakt: true,
        });
        this.hand[0] = hand[0]; this.hand[1] = hand[1];
      } else {
        const hand = drawLuni(c, BETT_STAND_X, f - 11, {
          t: this.elapsed, state: "sit", expr: "tired", face: 1,
          scale: LUNI_SCALE, shadow: false, glasses: this.glassesOn,
          outfit: this.bedKleidungAn, pajama: this.bedPyjama,
          bedLean: ph === "greifen" ? Math.sin(Math.PI * e) : 0,
          bedSitzen: ph === "setzen" ? p : undefined,
          handTarget: ph === "setzen" || ph === "greifen" ? [decke.links - 0.3, decke.oben + 4] : null,
          handElbow: 1, handKontakt: ph === "setzen" || ph === "greifen", betweenBodyAndArms: deckeZeichnen,
        });
        this.hand[0] = hand[0]; this.hand[1] = hand[1];
      }
      return;
    }
    if (this.wakeT > 0 && !this.asleep) {
      const p = 1 - this.wakeT / 1.2;
      x = 380;
      y = FLOOR_Y[2];
      yOff = -10 * (1 - p);
      state = "standup";
      expr = this.wakeT > 0.7 ? "sleep" : "tired";
      face = 1;
      this.lastPose = "wake";
      const wh = drawLuni(c, x, y + yOff, {
        t: this.elapsed,
        face,
        state,
        expr,
        phase: p,
        blink: this.wakeT > 0.6 ? 1 : 0,
        scale: LUNI_SCALE,
        shadow: yOff === 0,
        glasses: this.glassesOn,
        outfit: this.bedKleidungAn,
        pajama: this.bedPyjama,
      });
      this.hand[0] = wh[0];
      this.hand[1] = wh[1];
      return;
    }
    if (this.lieDown && !this.asleep) {
      // Sie legt sich hin: aus dem Sitzen in die Seitenlage, Decke folgt.
      const p = clamp(this.lieT / 1.4, 0, 1);
      const e = p * p * (3 - 2 * p);
      this.lastPose = "lie";
      // Die Figur wird vor dem Stoff gezeichnet; was über die Kante ragt,
      // verschwindet unter der Decke. Die Decke bewegt sich weiter frei.
      const decke = bedBlanketPose("hinlegen", e);
      clipBedCover(c, decke.links, decke.oben);
      // Sitzende Hüfte auf der Matratze; der Kopf landet auf dem vorhandenen Kissen.
      const wh = drawLuni(c, lerp(BETT_STAND_X, 345, e), FLOOR_Y[2] - lerp(11, 32, e), {
        t: this.elapsed,
        face: 1,
        state: "lie",
        expr: "sleep",
        phase: e,
        lieDown: e,
        // Die Strähnen werden beim Hinlegen neben das Ohr gelegt und bleiben
        // dort: dieses Umschalten läuft nur einmal, nie zurück.
        hairAside: Math.max(e, this.bedSitHair),
        bedCover: true,
        blink: 1,
        scale: LUNI_SCALE,
        shadow: false,
        glasses: this.glassesOn,
        outfit: this.bedKleidungAn,
        pajama: this.bedPyjama,
      });
      this.hand[0] = wh[0];
      this.hand[1] = wh[1];
      c.restore();
      // Einmal gelegt, bleibt der Straeh dort - auch in allen Folgeschritten.
      this.bedSitHair = Math.max(this.bedSitHair, e);
      const inSarg = this.welt === "gruesel" && GRUSELRAEUME.schlafzimmer;
      if (inSarg) drawBlanket(c, this.elapsed, e, true);
      else drawBedEntryBlanket(c, this.elapsed, "hinlegen", e, this.welt === "weihnacht");
      return;
    }
    const ruhtImBett = this.istNormalHaus && !a && this.activity?.id === "bett" && !this.bedEinstieg;
    if (this.sleepPhase || this.asleep || ruhtImBett) {
      // Kopfmitte bei x≈310, y≈286: direkt auf dem Kissen (294–324, 286–298).
      st = this.stations.find((sn) => sn.id === "bett") ?? null;
      x = 345;
      y = FLOOR_Y[2];
      yOff = -32;
      state = "lie";
      expr = "sleep";
      face = 1;
      let pr = ruhtImBett && !this.sleepPhase && !this.asleep
        ? { pull: 1, grab: 1, turn: 1, hair: 1 }
        : this.sleepProgress();
      // Normales Haus: die Decke wurde schon beim Hineinlegen hochgezogen –
      // sie darf beim Einschlafen nicht zurückfallen (das wäre ein Sprung).
      if (!this.gruselSarg) pr = { ...pr, pull: 1 };
      // Die Haare bleiben neben dem Ohr, sobald sie dort liegen. Ohne diese
      // Sperre legten grab/pull/turn sie zurueck ins Gesicht (Blitzen).
      hairAside = Math.max(pr.hair, this.bedSitHair);
      this.bedSitHair = hairAside;
      this.lastPose = "sleep";
      const inSarg = this.welt === "gruesel" && GRUSELRAEUME.schlafzimmer;
      drawBedScene(c, x, y + yOff, this.elapsed, this.gruselSarg ? this.pyjama : this.bedPyjama,
        pr, inSarg, this.gruselSarg ? "dressed" : this.bedKleidungAn, this.glassesOn, this.welt === "weihnacht");
      if (this.asleep || ruhtImBett) drawSleepZ(c, 312, y - 52, this.asleep ? this.sleepT : this.elapsed);
      return;
    }
    if (this.gruselBad && this.shPhase === "turnFront" && !a && this.lf === 2) {
      // Zwei gleich große 2D-Ansichten überblenden statt Lunis Körper zu stauchen.
      const p = sanft(clamp(this.shT / (SH_DUR.turnFront as number), 0, 1));
      c.save();
      for (const [dir, opacity] of [[-1, 1 - p], [1, p]] as const) {
        if (opacity <= 0) continue;
        c.globalAlpha = this.alpha * opacity;
        const hand = drawLuni(c, this.lx, FLOOR_Y[2], {
          t: this.elapsed, face: dir, state: "idle", expr: "neutral",
          scale: LUNI_SCALE, shadow: false, glasses: this.glassesOn,
          outfit: this.outfit, wet: this.wet, sick: this.sick,
        });
        if (dir === 1 || p === 0) { this.hand[0] = hand[0]; this.hand[1] = hand[1]; }
      }
      c.restore();
      this.lastPose = "turnFront";
      return;
    }
    const shp = this.showerPose();
    if (shp && !a) {
      state = shp.state;
      face = shp.face;
      posePhase = shp.phase;
      back = shp.back;
      expr = this.gruselBad && (state === "labBrush" || state === "labBend" || state === "act") ? "focus"
        : state === "wash" && shp.phase > 2 ? "sleep" : "happy";
    }
    if (this.golPhase === "rise") {
      const seat = STATIONS.find((stn) => stn.id === "gaming");
      if (seat) {
        x = seat.x;
        y = FLOOR_Y[seat.floor];
        face = seat.face;
      }
      const p = clamp(this.golAnimT / 0.5, 0, 1);
      yOff = -8 * (1 - p);
      state = p < 0.7 ? "sit" : "idle";
      expr = "focus";
    } else if (this.golPhase === "press") {
      state = "act";
      expr = "focus";
      face = 1;
    }

    // Saxophon: Pose je Phase. Beim Spielen wippt der rechte Fuß im Takt und
    // der Oberkörper wiegt sich mit der Musik – getrieben von der Musikzeit.
    let saxFootTap = 0;
    let saxSway = 0;
    let saxHand: [number, number] | null = null;
    let saxHand2: [number, number] | null = null;
    if (this.saxPhase === "reach") {
      // Beide Arme strecken sich zum Instrument – es bleibt am Stativ.
      state = "act";
      expr = "focus";
      posePhase = 0.35;
      const r = clamp(this.saxT / SAX_REACH, 0, 1);
      const k = r * r * (3 - 2 * r);
      const up = this.saxGripAt(SAX_GRIP_UP);
      const lo = this.saxGripAt(SAX_GRIP_LOW);
      // Ausgangsstellung der act-Pose, damit beim Phasenwechsel nichts springt.
      const pAct = 0.7 + Math.sin(this.elapsed * 7) * 0.12;
      const restF: [number, number] = [x + -7 * LUNI_SCALE * face, y + -22 * LUNI_SCALE];
      const restR: [number, number] = [x + (9 + 7 * pAct) * LUNI_SCALE * face, y + (-30 - 2 * pAct) * LUNI_SCALE];
      saxHand = [lerp(restF[0], up[0], k), lerp(restF[1], up[1], k)];
      saxHand2 = [lerp(restR[0], lo[0], k), lerp(restR[1], lo[1], k)];
    } else if (this.saxPhase === "lift" || this.saxPhase === "lower") {
      state = "sax";
      expr = "focus";
      // Beide Ziele entstehen aus der Instrumentenlage – die Hände folgen dem
      // Saxophon Schritt für Schritt, nie umgekehrt.
      saxHand = this.saxGripAt(SAX_GRIP_UP);
      saxHand2 = this.saxGripAt(SAX_GRIP_LOW);
    } else if (this.saxPhase === "play") {
      state = "sax";
      expr = "happy";
      saxFootTap = this.saxBeat();
      saxSway = this.saxSway();
      saxHand = this.saxGripAt(SAX_GRIP_UP);
      saxHand2 = this.saxGripAt(SAX_GRIP_LOW);
    }

    let pianoPose: number | undefined;
    let walkPhase = this.walkP;
    // Tanz: zurückgelegter Weg des Abschnitts (Moonwalk läuft nie auf der Stelle)
    // Gesang am Mikrofon: Mundoeffnung aus der Gesangszeit
    let singOpen = 0;
    let gesangsBewegung: number | undefined;

    // Gesang am Mikrofon: beschwingt wiegen, Mund singt passend mit.
    if (this.singPhase && this.lf === 3 && !a) {
      face = this.lface;
      state = "danceSway";
      expr = "sing";
      const mt = this.singStarted ? (this.singMusic?.currentTime ?? 0) : this.singT;
      singOpen = froschMundOffen(mt);
      // Ruhiges Wiegen ueber acht Schlaege; Mund und Lied behalten ihr echtes Tempo.
      gesangsBewegung = mt / 4;
    }

    // Plattenspieler: Anlage einschalten, dann wegtreten. Während des Liedes
    // tanzt sie beschwingt durchs ganze Haus und kehrt zur Anlage zurück.
    if (this.plattenPhase && !a) {
      expr = "happy";
      face = this.lface;
      if (this.plattenPhase === "switchOn" && this.lf === 3) {
        x = 696;
        face = 1;
        state = "act";
        expr = "focus";
        const p = clamp(this.plattenT / 0.95, 0, 1);
        const reach = p < 0.5 ? sanft(p / 0.5) : 1 - sanft((p - 0.5) / 0.5);
        const rest: Pt = [x - 7 * LUNI_SCALE, y - 22 * LUNI_SCALE];
        saxHand = [lerp(rest[0], PLATTEN_SCHALTER[0], reach), lerp(rest[1], PLATTEN_SCHALTER[1], reach)];
      } else if (this.plattenPhase === "stepAside" && this.lf === 3) {
        face = 1;
        const p = clamp(this.plattenT / 0.65, 0, 1);
        state = "walk";
        walkPhase = this.walkP + p * 7;
      } else if (this.plattenPhase === "play") {
        if (this.danceTreppe && this.danceTreppeStair) {
          // Treppe: sie tanzt die Schritte mit (Kopf nickt, Arm hoch)
          const s = this.danceTreppeStair;
          y = this.danceTreppeDir === 1
            ? lerp(FLOOR_Y[s.lower], FLOOR_Y[s.upper], this.danceTreppeT)
            : lerp(FLOOR_Y[s.upper], FLOOR_Y[s.lower], this.danceTreppeT);
          onStair = true;
          state = "danceSchritt";
        } else {
          state = this.danceStil;
          // Torjubel-Rutscher: Blick nach links (in Rutschrichtung)
          if (state === "danceSlide") face = -1;
        }
      } else if (this.plattenPhase === "armEndLift" || this.plattenPhase === "armEndTurn" || this.plattenPhase === "armEndLower") {
        state = "idle";
        expr = "neutral";
      } else {
        state = "idle";
      }
    }

    // Kerzen: Luni streckt sich auf die Zehenspitzen und schaltet sie um.
    if (this.activity?.id === "kerzen" && !a && this.kerzenLauft) {
      state = "reachUp";
      expr = "focus";
      face = 1;
      back = false;
      posePhase = clamp(this.kerzenT / 1.8, 0, 1);
      // Luni steigt auf den Klavierschemel (Sitzhöhe 9), streckt sich dort zu den
      // Kerzen und steigt danach wieder ab. Im Stand reicht die Hand nicht hinauf.
      const t = this.kerzenT;
      const glatt = (v: number) => v * v * (3 - 2 * v);
      const hoch = t < 0.4 ? glatt(t / 0.4) : t > 1.4 ? 1 - glatt((t - 1.4) / 0.4) : 1;
      // Im Höhepunkt auf den Zehenspitzen (3,5 mehr): die Hand erreicht den Kerzenhalter.
      const zehen = Math.sin(clamp(t / 1.8, 0, 1) * Math.PI) * 3.5;
      yOff = -(SCHEMEL_HOEHE + zehen) * hoch;
    }
    if (this.musikzimmer && this.lf === 3 && !a && (this.activity?.id === "klavier" || this.pianoRise > 0)) {
      pianoPose = this.pianoSeat;
      state = this.pianoRise > 0 ? "standup" : "piano";
      expr = this.pianoEscape ? "surprised" : "focus";
      back = true;
      face = 1;
      posePhase = 1 - this.pianoSeat;
      yOff = this.pianoRise > 0 ? -Math.sin(Math.PI * (1 - this.pianoRise / .42)) * 2.2 : 0;
      const p = this.pianoSeat * this.pianoSeat * (3 - 2 * this.pianoSeat);
      const hands = klavierHaende(this.musikzimmer.musicTime);
      const targets = hands.map((h, index): Pt => {
        const side = index === 0 ? -1 : 1;
        const restX = x + side * 8.6 * LUNI_SCALE;
        const restY = y + yOff + (9 * p - 17.6) * LUNI_SCALE;
        return [lerp(restX, MUSIKZIMMER.klavier.sitz + h.x, p), lerp(restY, MUSIKZIMMER.klavier.tastenY + 1 + h.press * .7, p)];
      });
      saxHand = targets[0];
      saxHand2 = targets[1];
    } else if (!this.musikzimmer && this.lf === 3 && !a && this.activity?.id === "klavier" && this.klavierOutro === "verbeugung") {
      // Nach dem Klavierlied: Luni steht vor dem Klavier, schaut zum Spieler und verbeugt sich dankend.
      state = "bow";
      expr = "happy";
      back = false;
      face = 1;
      posePhase = Math.min(1, this.klavierOutroT / KLAVIER_VERBEUGUNG);
      this.lastPose = "bow";
    } else if (!this.musikzimmer && this.lf === 3 && !a && this.activity?.id === "klavier" && (this.klavierOutro === "aufstehen" || this.klavierOutro === "drehen")) {
      // Nach dem Klavierlied: vom Schemel aufstehen und sich zum Spieler drehen.
      const p = this.klavierOutro === "aufstehen" ? Math.min(1, this.klavierOutroT / KLAVIER_AUFSTEHEN) : 1;
      const d = this.klavierOutro === "drehen" ? Math.min(1, this.klavierOutroT / KLAVIER_DREHEN) : 0;
      state = p < 1 ? "standup" : "idle";
      expr = "happy";
      back = d < 0.5;
      face = 1;
      posePhase = p;
      this.lastPose = state;
    } else if (!this.musikzimmer && this.lf === 3 && !a && this.activity?.id === "klavier") {
      // Normales Haus & Weihnachtshaus: zentriert auf dem Schemel vor dem Klavier,
      // mit dem Rücken zum Spieler und den Händen auf den Tasten (550–584, Mitte 567).
      pianoPose = 1;
      state = "piano";
      expr = "happy";
      back = true;
      face = 1;
      yOff = 0;
      // Beim Klavierlied folgen die Hände den gerade klingenden Tönen, sonst der Spielbewegung.
      const lied = this.klavierSpielt && this.klavierMusik ? klavierHaendeAt(this.klavierMusik.currentTime * 1000) : null;
      if (lied && lied.links !== null && lied.rechts !== null) {
        saxHand = [clamp(lied.links, 558, 576), 169 + lied.pressL * 0.7];
        saxHand2 = [clamp(lied.rechts, 558, 576), 169 + lied.pressR * 0.7];
      } else {
        const hands = klavierHaende(this.elapsed);
        saxHand = [567 + hands[0].x * 0.5, 169 + hands[0].press * 0.7];
        saxHand2 = [567 + hands[1].x * 0.5, 169 + hands[1].press * 0.7];
      }
    } else if (this.pianoEscape && this.lf === 3 && !a) {
      state = this.pianoEscapeMoving ? "walk" : "idle";
      expr = "surprised";
      face = -1;
      walkPhase = -this.walkP;
    }
    if (this.pianoRefusal > 0) expr = "annoyed";
    // Hand am Griff (Tuer/Vorhang): die vordere Hand faehrt per Zweigelenk-IK
    // zum Knauf; armIK kuerzt auf die feste Armlaenge – nichts streckt sich.
    if (this.doorHand && !this.saxPhase && pianoPose === undefined) {
      state = "act";
      expr = "focus";
      posePhase = 0.35;
      saxHand = this.doorHand;
    }

    // Gruselhaus, Raum 03: Posen am und im Sarg, Umhang beim Umziehen.
    let sargLean = 0;
    let sargBack = false;
    let sargShake = 0;
    let umhang = 1;
    const sp = this.sargPose();
    if (sp) {
      x = sp.x;
      y = sp.y;
      yOff = 0;
      state = sp.state;
      expr = sp.expr;
      face = sp.face;
      back = sp.back;
      posePhase = sp.phase;
      if (sp.walk !== undefined) walkPhase = sp.walk;
      saxHand = sp.hand ?? null;
      saxHand2 = sp.hand2 ?? null;
      sargLean = sp.lean ?? 0;
      sargBack = !!sp.backReach;
      sargShake = sp.shake ?? 0;
      if (sp.umhang !== undefined) umhang = sp.umhang;
      st = null;
      onStair = false;
    }
    if (this.shPhase === "bedPajama") umhang = 0;

    // Kessel-Zauber: beide Arme weit ausgestreckt, die Hände zielen über handTarget.
    // Lunis Größe und Proportionen bleiben dabei unverändert.
    const zs = this.zauberStaerke();
    if (zs > 0.001 && !this.saxPhase && !back) {
      const lokal = (lx: number, ly: number): [number, number] =>
        [x + face * LUNI_SCALE * lx, y + yOff + LUNI_SCALE * ly];
      const wob = Math.sin(this.elapsed * 9) * 0.5 * zs;
      saxHand = lokal(lerp(-7.5, -17.5, zs), lerp(-22, -42, zs) + wob);
      saxHand2 = lokal(lerp(7.5, 17.5, zs), lerp(-22, -42, zs) - wob);
      expr = this.zauber?.treffer ? "happy" : "focus";
    }
    // Überkochender Kessel: Luni verdreht in Abständen die Augen.
    let eyeRoll = 0;
    if (this.kessel.phase === "ueberlauf" && !this.zauber && !back) {
      // Solange er überkocht, schaut sie genervt; alle 7 s verdreht sie dazu die Augen.
      if (state === "idle" || state === "walk") expr = "annoyed";
      const rollen = this.kessel.t % 7;
      if (rollen < 2.2) eyeRoll = rollen / 2.2;
    }

    const handy = !a && !back && !this.standing && st?.id === "raucherstuhl" ? this.handy?.pose : null;
    if (handy?.benutzt) expr = handy.ohr > 0.8 && Math.sin(handy.zeit * 2.1) > 0.27 ? "talk" : "focus";

    c.save();
    if (clip) {
      c.beginPath();
      c.rect(CEL_X0, FE + SLAB, HR - CEL_X0, FK - FE - SLAB);
      c.clip();
    }
    if (this.imSarg) {
      // Im Sarg: alles unterhalb der Vorderkante liegt hinter der Wand.
      c.beginPath();
      c.rect(0, 0, W, FLOOR_Y[2] - SARG.rand);
      c.clip();
    }
    if (sargLean) {
      // Zurücklehnen um die Hüfte – Längen und Proportionen bleiben gleich.
      const [hx, hy] = this.sargHuefte();
      c.translate(hx, hy);
      c.rotate(-sargLean);
      c.translate(-hx, -hy);
    }
    const hiddenInWc =
      this.wcInside && st?.id === "wctuer" && this.wcOpen < 0.55;
    c.globalAlpha = hiddenInWc ? 0 : this.alpha;
    this.lastPose = state;
    const zuendZeit = !a && !this.standing && !this.ashMove && st?.id === "raucherstuhl" && state === "sit" ? this.lightT : null;
    const zuenden = zuendZeit === null ? null : zuendPose(x, y + yOff, face, zuendZeit, this.lightAblegen);
    const tee = !a && st?.id === "tee" && this.teaT > 0 ? this.teeZiele(x, y + yOff) : null;
    const hustet = this.sick > 0.3 && !zuenden && !tee && !handy;
    const teeGeht = !!tee && Math.abs(teeStandX(this.teaT + 0.01) - teeStandX(this.teaT - 0.01)) > 0.2;
    // Aschenbecher: sitzend am Stuhl oder stehend davor – der Arm greift in beiden Fällen.
    let aschgriff: Pt | null = null; // sitzend, im lokalen Koordinatensystem
    let aschziel: Pt | null = null; // stehend, in Weltkoordinaten
    if (this.ashMove && !this.ashWalking && !this.standing) {
      const p = clamp(this.ashT / this.ashDur(), 0, 1);
      const reich = this.ashReichweite();
      // Beim Ausdruecken vom Rand greifen, kurz anheben und in die Mulde druecken.
      const hub = this.ashMove === "quench" && p > 0.45 && p < 0.78 ? 3 * Math.sin((Math.PI * (p - 0.45)) / 0.33) : 0;
      if (this.ashSitzend) {
        const griff: Pt = [(ASH_X - x) / (face * LUNI_SCALE), (SIDE_TOP - 3.4 - y - yOff) / LUNI_SCALE - SITZ_HUB];
        aschgriff = punktMischen([8.5, -23.5], griff, reich);
        aschgriff[1] -= hub;
      } else {
        const ruh: Pt = [x - 7.6 * LUNI_SCALE, y - 21.5 * LUNI_SCALE];
        aschziel = punktMischen(ruh, [ASH_X, SIDE_TOP - 3.4 - hub], reich);
      }
    }
    // Rechte/linke Handziele für Gesundheitstee, Plattenspieler-Schalter und Eimer-Leeren
    let handElbow: 1 | -1 = this.saxPhase || this.plattenPhase === "switchOn" ? 1 : -1;
    let handElbow2: 1 | -1 = this.saxPhase ? -1 : 1;
    if (!a && !this.standing && !this.ashMove) {
      if (tee) {
        saxHand = tee.rechts;
        saxHand2 = tee.links;
        handElbow = 1;
        handElbow2 = 1;
      } else if (st?.id === "eimer" && this.emptyT > 0) {
        const et = this.emptyT;
        const gl = (k: number) => { const q = clamp(k, 0, 1); return q * q * (3 - 2 * q); };
        const ruh: [number, number] = [x - 7.6 * LUNI_SCALE, y - 21.5 * LUNI_SCALE];
        const tisch: [number, number] = [ASH_X - 4, SIDE_TOP - 2];
        const eimer: [number, number] = [BUCKET_X - 11, FK - 23];
        if (et < 0.6) {
          const k = gl(et / 0.6);
          saxHand = [lerp(ruh[0], tisch[0], k), lerp(ruh[1], tisch[1], k)];
        } else if (et < 1.1) {
          const k = gl((et - 0.6) / 0.5);
          saxHand = [lerp(tisch[0], eimer[0], k), lerp(tisch[1], eimer[1], k)];
        } else if (et < 1.55) {
          saxHand = eimer;
        } else if (et < 2.0) {
          const k = gl((et - 1.55) / 0.45);
          saxHand = [lerp(eimer[0], tisch[0], k), lerp(eimer[1], tisch[1], k)];
        } else {
          const k = gl((et - 2.0) / 0.6);
          saxHand = [lerp(tisch[0], ruh[0], k), lerp(tisch[1], ruh[1], k)];
        }
        handElbow = 1;
      }
    }

    if (aschziel) {
      saxHand = aschziel;
      handElbow = 1;
    }
    // Wird von drawLuni gefüllt: beide Handpositionen in Weltkoordinaten.
    const saxHands = { front: [0, 0] as [number, number], rear: [0, 0] as [number, number] };
    const kleidung = this.bedKleidung();
    const hand = drawLuni(c, x, y + yOff, {
      t: this.elapsed,
      face,
      state: teeGeht ? "walk" : state,
      expr,
      walk: walkPhase,
      phase: posePhase,
      singOpen,
      blink: this.blink > 0 ? 1 : 0,
      scale: LUNI_SCALE,
      shadow: !onStair && yOff === 0,
      // Husten setzt ab mittlerer Übelkeit ein
      cough: hustet ? clamp((this.sick - 0.3) / 0.4, 0, 1) : 0,
      sick: this.sick,
      outfit: this.outfit,
      kleidung,
      back,
      wet: this.wet,
      glasses: this.glassesOn,
      pajama: this.outfit === "dressed" || kleidung ? this.pyjama : null,
      vampir: this.outfit === "dressed" && this.vampirStil !== null ? VAMPIR_OUTFITS[this.vampirStil] : null,
      umhang,
      backReach: sargBack,
      hairAside,
      pianoSeat: pianoPose,
      headShake: sargShake ? sargShake : this.pianoRefusal > 0 ? Math.sin((.9 - this.pianoRefusal) * 21) * Math.sin(Math.PI * this.pianoRefusal / .9) : 0,
      gaze: this.pianoEscape ? 1 : 0,
      footTap: saxFootTap,
      sway: saxSway,
      handTarget: saxHand,
      handElbow,
      handTarget2: saxHand2,
      handElbow2,
      sitzgriff: zuenden?.rechts ?? aschgriff,
      sitzgriffLinks: handy ? handyGriff(handy) : null,
      handKontakt: !!this.saxPhase || !!tee || st?.id === "eimer" || !!aschziel,
      handVorRumpf: !!handy,
      armeVorne: !!tee,
      rauchzeit: this.smokeIdleT,
      handOut: saxHands,
      betweenBodyAndArms: this.saxPhase ? () => this.drawSaxCarried(c) : null,
      armsInFront: !!this.saxPhase,
      eyeRoll,
      // Musikzeit für den Plattentanz: alle Tanzposen laufen im Takt, in jedem Stockwerk
      beatT: gesangsBewegung ?? (this.plattenPhase === "play"
        ? (this.plattenStarted ? (this.plattenMusic?.currentTime ?? 0) : this.plattenT)
        : undefined),
      // Smoothe Tanzwechsel: alte Pose zublenden, neue unsichtbar ersetzen
      blendFrom: this.danceBlendFrom ?? undefined,
      blendK: this.danceBlendFrom ? Math.min(1, this.danceBlendT / 0.35) : undefined,
    });
    this.hand[0] = hand[0];
    this.hand[1] = hand[1];
    this.luniHaende = { front: [saxHands.front[0], saxHands.front[1]], rear: [saxHands.rear[0], saxHands.rear[1]] };
    this.luniKopf = { x, y: y + yOff, face, sichtbar: !hiddenInWc && this.alpha > 0.5 };
    // Hustenstöße: kleine Wolken vor dem Mund
    if (hustet) {
      const burst = coughPulse(this.elapsed) * clamp((this.sick - 0.3) / 0.4, 0, 1);
      if (burst > 0.08) {
        const mx = x + face * 4 * LUNI_SCALE;
        const my = y + yOff - 41 * LUNI_SCALE;
        for (let i = 0; i < 3; i++) {
          const sp = burst * (0.5 + i * 0.4);
          c.fillStyle = `rgba(206,216,208,${0.4 * burst})`;
          c.beginPath();
          c.arc(mx + face * (3 + sp * 9), my + i * 1.6 - 2, 1.3 + sp * 2.4, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    // Die Zigarette, die sie gerade stopft, liegt sichtbar in ihren Händen
    // (an der vorderen Hand, zwischen beiden Händen) – nicht in der Luft.
    if (this.activity?.id === "tabak" && !this.cur && !this.packMove && !this.takeMove) {
      const jiggle = Math.sin(this.rollT * 13) * 0.7;
      c.save();
      c.translate(hand[0] - 4.5, hand[1] - 0.5);
      c.rotate(-0.18 + Math.sin(this.rollT * 6.5) * 0.09);
      rect(c, 0, 0, 10.5, 2.1, "#f6f3ea");
      rect(c, 8, 0, 2.6, 2.1, "#e2b24a");
      c.fillStyle = "rgba(126,92,44,.85)";
      c.fillRect(3.5 + jiggle, 2.6, 1.3, 1.1);
      c.restore();
    }

    if (this.holding && this.ashMove && !this.ashWalking) {
      const rechts = saxHands.front;
      kippeAmFilter(c, [rechts[0] - face * KIPPE_GRIFF[0], rechts[1] - KIPPE_GRIFF[1]], face,
        this.burnLeft > 0 ? 0.6 : 0, this.burnFrac());
    } else if (this.holding && (st?.id !== "raucherstuhl" || this.standing)) {
      cigarette(c, hand[0], hand[1], face, this.burnLeft > 0 ? 0.4 : 0, this.burnFrac());
    }
    if (handy) drawHandy(c, saxHands.rear, face, handy, this.elapsed);
    if (zuenden) {
      const rechts = saxHands.front;
      if (this.holding) {
        const filter: Pt = zuenden.kippeImMund ? zuenden.mund : [rechts[0] - face * KIPPE_GRIFF[0], rechts[1] - KIPPE_GRIFF[1]];
        const glimmt = this.burnLeft > 0;
        kippeAmFilter(c, filter, face, glimmt ? 0.6 : 0, glimmt ? this.burnFrac() : 1);
      }
      if (zuenden.feuerzeugInHand) feuerzeug(c, rechts, zuenden.winkel, zuenden.flamme, this.elapsed);
    }
    if (st?.id === "eimer" && this.emptyT >= 0.55 && this.emptyT < 2.0) {
      const et = this.emptyT;
      const gl = (k: number) => { const q = clamp(k, 0, 1); return q * q * (3 - 2 * q); };
      const tilt = et < 0.75 ? 0 : et < 1.15 ? 0.9 * gl((et - 0.75) / 0.4) : et < 1.55 ? 0.9 : 0.9 * (1 - gl((et - 1.55) / 0.35));
      const inBecher = et < 1.25 ? this.ashButts : 0;
      this.drawAshtrayAt(c, saxHands.front[0], saxHands.front[1], tilt, inBecher);
      // Fallende Asche und Stummel in den Eimer
      if (et >= 0.95 && et < 1.55) {
        const k = (et - 0.95) / 0.6;
        for (let i = 0; i < 5; i++) {
          const px = lerp(saxHands.front[0] + 2, BUCKET_X + (i - 2) * 1.1, k);
          const py = lerp(saxHands.front[1] + 2, FK - 14, clamp(k * 1.15 - i * 0.08, 0, 1));
          disc(c, px, py, i % 2 ? 0.85 : 0.6, i % 2 ? "#dfd8c5" : "#8e887f");
        }
      }
    }
    if (!this.ashMove && !this.standing && state === "smoke" && this.burnLeft > 0) {
      const { lift, puff } = smokeCycle(this.smokeIdleT);
      const rechts = saxHands.front;
      kippeAmFilter(c, [rechts[0] - face * KIPPE_GRIFF[0], rechts[1] - KIPPE_GRIFF[1]], face, 0.2 + lift, this.burnFrac());
      // Rauchfahne von der Spitze (beim Ziehen glimmt sie stärker)
      for (let i = 0; i < 4; i++) {
        const ph = (this.elapsed * 0.42 + i * 0.24) % 1;
        const a = (1 - ph) * (0.42 + lift * 0.25);
        if (a <= 0) continue;
        c.fillStyle = `rgba(224,231,238,${a})`;
        c.beginPath();
        c.arc(
          rechts[0] + face * (7 + ph * 16) + Math.sin(this.elapsed * 1.6 + i) * 4,
          rechts[1] - 2 - ph * 26,
          1.6 + ph * 4.2,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      // Ausatmen: ein zarter Hauch vor dem Mund, gerade eben sichtbar
      if (puff > 0.05) {
        const mx = x + face * 2 * LUNI_SCALE;
        const my = y + yOff + (SITZ_MUND[1] + SITZ_HUB) * LUNI_SCALE;
        for (let i = 0; i < 3; i++) {
          const ph = clamp(puff * 1.1 - i * 0.22, 0, 1);
          if (ph <= 0) continue;
          c.fillStyle = `rgba(226,232,238,${0.2 * ph})`;
          c.beginPath();
          c.arc(
            mx + face * (5 + (1 - ph) * 14 + i * 3),
            my - (1 - ph) * 6 + Math.sin(this.elapsed * 2 + i * 1.7) * 1.4,
            2 + (1 - ph) * 3.4 + i,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      }
    }
    if (this.carryHolz) {
      // Das Scheit hängt am vorderen Arm – es wandert mit, bis es im Ofen liegt.
      c.save();
      c.translate(hand[0] + 2, hand[1] + 2);
      c.rotate(-0.15);
      rect(c, -1, -1.6, 9.5, 3.2, "#6f4322");
      rect(c, -1, -1.6, 9.5, 0.9, "rgba(255,220,170,.35)");
      disc(c, -1, 0, 1.8, "#c89a63");
      disc(c, -1, 0, 1.1, "#7c4a26");
      c.restore();
    }
    if (tee) this.drawTee(c, tee, saxHands.front, saxHands.rear);
    else if (st?.prop) drawProp(c, st.prop, hand[0], hand[1], face);
    if (st?.blanket) {
      const inSarg = this.welt === "gruesel" && GRUSELRAEUME.schlafzimmer;
      const bx = st.x - 8;
      rrect(c, bx, FO - 36, 392 - bx, 22, 7, inSarg ? "#580f1a" : "#3f7f8c");
      rect(c, bx + 3, FO - 30, 392 - bx - 8, 2, inSarg ? "#c9a46a" : "rgba(255,255,255,.35)");
    }
    if (st?.zzz) drawZzz(c, x - 22, y - 58, this.elapsed, 1);
    c.restore();
  }

  private drawStationFokus(c: C) {
    if (!this.stationFokus || this.tvZoom || this.adventFullscreen) return;
    c.save();
    c.strokeStyle = "#f2cf68";
    c.lineWidth = 1.6;
    for (const [x, y, w, h] of this.stationFokus.hits) {
      c.beginPath();
      c.roundRect(x - 2, y - 2, w + 4, h + 4, 5);
      c.stroke();
    }
    c.restore();
  }

  private drawHoverLabel(c: C) {
    const st = this.hover;
    if (!st) return;
    const [rx, ry, rw] = st.hits[0];
    c.save();
    c.font = '600 11px "Space Grotesk", sans-serif';
    const tw = c.measureText(st.label).width + 16;
    // Objekte am rechten Rand bekommen das Label nach links, damit es im Bild bleibt
    const centered = rx + rw / 2 - tw / 2;
    const lx = clamp(centered, 6, W - tw - 6);
    const ly = Math.max(ry - 8, 22);
    rrect(c, lx, ly - 14, tw, 20, 5, "rgba(8,20,26,.88)");
    c.fillStyle = "#eef7f2";
    c.fillText(st.label, lx + 8, ly);
    c.restore();
  }
}
