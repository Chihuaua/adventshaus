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

import { coughPulse, drawLuni, drawZzz, LUNI_COLORS, smokeCycle, type LuniExpr, type LuniState } from "./luni";
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

import { sfx } from "./audio";
import { SaxophonMusic } from "./audio/saxophonVoice";
import { SAX_DURATION_SECONDS } from "./audio/saxophonNotes";
import { Dream, drawSleepZ } from "./dream";
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
import { drawBoneSaxophone, drawOrchesterEffects, drawOrchesterRoom } from "./gruselhaus/orchester";
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
/** Standplatz vor dem Aschenbecher-Tischchen im Keller */
/** Sitzposition; der Beistelltisch steht direkt in Armreichweite daneben. */
const ASH_STAND_X = 708;
/** Beistelltisch im Keller: Plattenoberkante und die darauf liegenden Dinge */
const SIDE_TOP = 550;
const ASH_X = 726;
const PHONE_X = 742;
const DG_X0 = 262; // Dachgeschoss-Boden beginnt hier, links davon Treppenhaus
const OG_X1 = 694; // 1.-Stock-Boden endet hier, rechts davon Treppenhaus
const LUNI_SCALE = 1.08;
const SPEED = 80;

/** „Paulchen“: das bisher einzige Saxophonstück. Weitere Lieder später ergänzen. */
const SAX_SONG_PAULCHEN = { id: "paulchen", duration: SAX_DURATION_SECONDS } as const;
/** Referenzgröße: exakt die Größe, in der Luni das Saxophon spielt. */
const SAX_SCALE = 0.52 * LUNI_SCALE;
/** Mundstück-Anker, wenn das Instrument auf dem Stativ steht. */
const SAX_STAND_X = 652;
const SAX_STAND_Y = FLOOR_Y[3] - 36;
/** Mundstück sitzt so viele Einheiten vor der Körpermitte am Mund. */
const SAX_MOUTH_DX = 1.2;
/** Griffpunkte in LOKALEN Saxophon-Koordinaten (Ursprung = Mundstück-Anker).
 *  Sie liegen auf der Klappenspalte, die saxophone() zeichnet – die Hände
 *  sitzen damit immer exakt am gezeichneten Instrument. */
const SAX_GRIP_UP: Pt = [11.4, 16];
const SAX_GRIP_LOW: Pt = [10.7, 31];
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

const [FK, FE, FO, FD] = FLOOR_Y;

export const STATIONS: Station[] = [
  /* ---- Erdgeschoss ---- */
  { id: "haustuer", label: "Haustür", floor: 1, x: 161, face: -1, state: "think", expr: "think", hits: [[131, 362, 60, 86]] },
  { id: "garderobe", label: "Garderobe", floor: 1, x: 220, face: 1, state: "act", expr: "neutral", hits: [[196, 372, 48, 76]] },
  { id: "buecher", label: "Bücherregal", floor: 1, x: 278, face: 1, state: "act", expr: "happy", prop: "book", hits: [[258, 356, 40, 92]] },
  {
    id: "sofa", label: "Sofa & Fernseher", floor: 1, x: 372, face: 1, state: "sit", expr: "happy", yOff: -16, screen: "tv_e",
    hits: [[306, 402, 96, 46], [438, 392, 54, 56]],
  },
  { id: "kellertuer", label: "Kellertür", floor: 0, x: 413, face: 1, state: "idle", expr: "neutral", hits: [[496, 366, 54, 82]] },
  { id: "kuehlschrank", label: "Kühlschrank", floor: 1, x: 593, face: 1, state: "act", expr: "happy", hits: [[574, 370, 38, 78]] },
  { id: "kaffee", label: "Kaffeemaschine", floor: 1, x: 674, face: 1, state: "act", expr: "happy", prop: "cup", hits: [[662, 386, 26, 26]] },
  {
    id: "tee", label: "Gesundheitstee", floor: 1, x: 642, face: 1, state: "act", expr: "happy",
    prop: "cup", hits: [[616, 380, 32, 30]],
  },
  { id: "herd", label: "Herd", floor: 1, x: 708, face: 1, state: "act", expr: "focus", prop: "pan", hits: [[690, 350, 36, 98]] },
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
    id: "saxophon", label: "Saxophon", floor: 3, x: 653, face: -1, state: "sax", expr: "happy",
    hits: [[644, 134, 36, 66]],
  },
  {
    id: "klavier", label: "Klavier", floor: 3, x: 617, face: -1, state: "piano", expr: "happy", yOff: -10,
    // Korpus 545–589, Klaviatur 585–627, Hocker 604–630
    hits: [[545, 142, 46, 58], [583, 164, 48, 24], [602, 176, 32, 26]],
  },
  { id: "spielregal", label: "Spieleregal", floor: 3, x: 504, face: 1, state: "act", expr: "think", hits: [[486, 126, 38, 74]] },
  {
    id: "gol_game", label: "Spiel des Lebens", floor: 3, x: 490, face: 1, state: "act", expr: "focus",
    // Oberste Regalebene, innerhalb des Schranks – nicht im Laufweg davor.
    hits: [[486, 126, 38, 24]],
  },
  {
    id: "platten", label: "Plattenspieler", floor: 3, x: 724, face: 1, state: "danceSway", expr: "happy",
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
  { id: "leinen", label: "Jacken & Hundeleinen", floor: 0, x: 640, face: 1, state: "act", expr: "neutral", hits: [[604, 486, 76, 86]] },
  {
    id: "raucherstuhl", label: "Stuhl", floor: 0, x: 708, face: 1, state: "sit", expr: "happy",
    yOff: -10, hits: [[694, 536, 34, 36]],
  },
  {
    id: "aschenbecher", label: "Aschenbecher", floor: 0, x: 726, face: 1, state: "idle",
    expr: "neutral", hits: [[714, 534, 21, 24]],
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

const LAMPS: { x: number; y: number; r: number }[] = [
  { x: 170, y: 372, r: 100 },
  { x: 302, y: 372, r: 118 },
  { x: 650, y: 360, r: 125 },
  { x: 340, y: 236, r: 110 },
  { x: 409, y: 292, r: 80 },
  { x: 590, y: 222, r: 96 },
  { x: 430, y: 150, r: 135 },
  { x: 700, y: 150, r: 125 },
  { x: 470, y: 484, r: 115 },
  { x: 700, y: 484, r: 115 },
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
  opt: { mull?: number; curtain?: string } = {},
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
  c.restore();
  const m = opt.mull ?? 2;
  for (let i = 1; i < m; i++) line(c, x + (w / m) * i, y, x + (w / m) * i, y + h, "#efe6d2", 2.2);
  if (h > 30) line(c, x, y + h * 0.5, x + w, y + h * 0.5, "#efe6d2", 2.2);
  rect(c, x - 6, y + h + 3, w + 12, 4, "#d9cfb8");
  rect(c, x - 6, y + h + 7, w + 12, 2, "rgba(0,0,0,.25)");
  if (opt.curtain) {
    rrect(c, x - 5, y - 4, w * 0.24, h + 8, 3, opt.curtain);
    rrect(c, x + w - w * 0.24 + 5, y - 4, w * 0.24, h + 8, 3, opt.curtain);
    rect(c, x - 7, y - 6, w + 14, 2.4, "#3a2e28");
  }
}

function roundWindow(c: C, sky: HTMLCanvasElement, cx: number, cy: number, r: number) {
  disc(c, cx, cy, r + 3, "#efe6d2");
  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.clip();
  c.drawImage(sky, 0, 0, W, H);
  c.restore();
  line(c, cx - r, cy, cx + r, cy, "#efe6d2", 2);
  line(c, cx, cy - r, cx, cy + r, "#efe6d2", 2);
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

function railing(c: C, x: number, F: number, w: number) {
  line(c, x, F - 26, x + w, F - 26, "#2a2420", 3);
  for (let px = x; px <= x + w + 0.1; px += w / 2) line(c, px, F - 26, px, F, "#2a2420", 2);
}

/* --- Treppen --- */

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
  line(c, fx, fy - 54, tx, ty - 54, "#2a2420", 3.4);
  line(c, fx, fy - 56, tx, ty - 56, "rgba(255,255,255,.14)", 1.2);
  for (let i = 0; i <= N; i += 2) {
    const px = fx + ((tx - fx) * i) / N;
    const py = fy + ((ty - fy) * i) / N;
    line(c, px, py - 54, px, py, "#2a2420", 2);
  }
  c.restore();
}

/* --- Möbel: Erdgeschoss --- */

function haustuer(c: C, sky: HTMLCanvasElement, x: number, F: number) {
  rect(c, x - 4, F - 86, 60, 86, "#ddd3bc");
  rect(c, x, F - 82, 52, 82, "#6e4a2f");
  rect(c, x + 5, F - 38, 42, 32, "#5a3b25");
  rect(c, x + 5, F - 76, 42, 32, "#5a3b25");
  c.save();
  c.beginPath();
  c.rect(x + 10, F - 72, 32, 24);
  c.clip();
  c.drawImage(sky, 0, 0, W, H);
  c.restore();
  line(c, x + 26, F - 72, x + 26, F - 48, "#6e4a2f", 2);
  disc(c, x + 44, F - 40, 2.4, "#e6c36a");
  rrect(c, x + 2, F - 3, 48, 3, 1.5, "#9c4a3a");
}

function garderobe(c: C, x: number, F: number) {
  rect(c, x, F - 74, 44, 5, "#6b4a2a");
  for (let i = 0; i < 4; i++) disc(c, x + 6 + i * 11, F - 70, 1.8, "#d9c38a");
  rrect(c, x + 3, F - 68, 12, 32, 4, "#c9453a");
  rrect(c, x + 17, F - 68, 12, 28, 4, "#e2b24a");
  rrect(c, x + 31, F - 68, 12, 34, 4, "#2f4a6b");
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
  gap?: { row: number; index: number; item?: (c: C, x: number, y: number, w: number, h: number) => void },
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
      const reserved = gap && r === gap.row && i === gap.index;
      if (reserved) {
        if (gap.item) gap.item(c, bx, base - bh, bw, bh);
      } else {
        rect(c, bx, base - bh, bw, bh, BOOK_COLS[(i * 3 + r * 5 + seed) % BOOK_COLS.length]);
      }
      bx += bw + 0.8;
      i++;
    }
    rect(c, x + 3, base, w - 6, 2, "#6f4f2c");
  }
}

/** Schlafende Luni im Bett: Seitenlage, Decke bis zum Hals, Hand unter dem Ohr. */
/**
 * Schlafszene im Bett. Schichtung von unten nach oben:
 * Kissen -> Hand -> Haare -> Kopf/Ohr. Die Decke liegt über dem Körper,
 * wird aber von beiden Händen gehalten, bis sie am Kinn sitzt.
 */
function drawBedScene(
  c: C,
  x: number,
  y: number,
  t: number,
  pj: { top: string; bottom: string } | null,
  o: { pull: number; grab: number; turn: number; hair: number },
) {
  const breathe = Math.sin(t * 1.1) * 0.35;
  const topColor = pj ? pj.top : "#7fc6c2";
  const bottomColor = pj ? pj.bottom : "#3f6f8c";
  const turn = clamp(o.turn, 0, 1);
  const hair = clamp(o.hair, 0, 1);
  // Kinn = Unterkante des Kopfes. Die Decke endet genau dort.
  const chinY = -1;
  const edgeY = lerp(12, chinY, clamp(o.pull, 0, 1));

  c.save();
  c.translate(x, y);
  c.translate(0, 2);
  c.rotate(-0.06 * turn);
  c.translate(0, -2);

  /* 1. Kissen (unten) */
  rrect(c, -24, 6, 46, 15, 7, "#ffffff");
  rrect(c, -22, 7, 42, 5, 3, "#eef2f4");

  /* 2. Körper */
  rrect(c, -6, 0.5, 30, 13 + breathe, 6, topColor);
  rrect(c, 20, 3, 22, 11 + breathe, 5, bottomColor);

  /* 3. Decke bis zum Kinn – liegt über dem Körper */
  const by = edgeY;
  rrect(c, -1, by, 72, 30, 7, "#3f7f8c");
  rrect(c, 1, by + 1.2, 68, 4, 2, "#5da0a8");
  rect(c, 4, by + 8, 62, 1.6, "rgba(255,255,255,.30)");
  rect(c, 4, by + 16, 62, 1.2, "rgba(255,255,255,.18)");
  c.strokeStyle = "rgba(20,50,58,.30)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-1, by + 5.5);
  c.quadraticCurveTo(10, by + 3, 22, by + 6.5);
  c.stroke();

  /* 4. Hand auf dem Kissen: von der Deckenkante bis zum Kissen wandern */
  const hx = lerp(-6, -3, turn);
  const hy = lerp(by + 1.4, 4.2, turn);
  c.fillStyle = "#f4c9a0";
  c.beginPath();
  c.ellipse(hx, hy, 5.4, 2.3, -0.12, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#e3b288";
  c.lineWidth = 0.7;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(hx - 2.6 + i * 2.1, hy - 0.9);
    c.lineTo(hx - 2.0 + i * 2.1, hy + 0.9);
    c.stroke();
  }

  /* 4b. Zweite Hand: hält die Kante, ruht später auf der Decke */
  if (o.grab > 0.02) {
    const rx = lerp(9, 26, turn);
    const ry = lerp(by + 1.4, by + 8, turn);
    c.fillStyle = "#f4c9a0";
    c.beginPath();
    c.ellipse(rx, ry, 4.4, 2.2, 0.2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e3b288";
    c.lineWidth = 0.7;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(rx - 2.0 + i * 1.9, ry - 0.8);
      c.lineTo(rx - 1.5 + i * 1.9, ry + 0.9);
      c.stroke();
    }
  }

  /* 5. Haare: liegen sichtbar auf der Hand */
  c.fillStyle = "#191920";
  c.beginPath();
  if (hair < 0.55) {
    const k = hair / 0.55;
    c.ellipse(lerp(-7.5, -3, k), lerp(-4.5, 0.8, k), lerp(8.2, 8.0, k), lerp(6.0, 2.4, k), 0.1, 0, Math.PI * 2);
  } else {
    const k = (hair - 0.55) / 0.45;
    c.ellipse(-3, lerp(0.8, 0.4, k), lerp(8.0, 8.6, k), lerp(2.4, 2.6, k), 0.1, 0, Math.PI * 2);
  }
  c.fill();
  // Strähne, die über die Hand fällt
  c.strokeStyle = "#191920";
  c.lineWidth = 1.4;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-6.5, 0.6);
  c.quadraticCurveTo(-9.5, 2.6, -9.8, 5.2);
  c.stroke();

  /* 6. Kopf mit Ohr: ruht auf den Haaren */
  const headX = lerp(1.0, 0.5, turn);
  const headY = -10.2;
  c.fillStyle = "#f4c9a0";
  c.beginPath();
  c.arc(headX, headY, 9.2, 0, Math.PI * 2);
  c.fill();
  // Ohr
  c.fillStyle = "#f4c9a0";
  c.beginPath();
  c.arc(headX - 5.2, headY + 2.0, 2.5, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#e3b288";
  c.lineWidth = 0.8;
  c.beginPath();
  c.arc(headX - 5.3, headY + 2.0, 1.3, -1.1, 1.0);
  c.stroke();
  // Deckhaar: schmaler Franz am oberen Kopfrand, das Gesicht bleibt frei.
  c.strokeStyle = "#191920";
  c.lineWidth = 3.4;
  c.lineCap = "round";
  c.beginPath();
  c.arc(headX, headY, 7.9, Math.PI * 1.06, Math.PI * 1.94);
  c.stroke();
  // Seitensträhne hinter dem Ohr (links), bedeckt kein Gesicht.
  c.strokeStyle = "#191920";
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(headX - 8.2, headY - 3.4);
  c.quadraticCurveTo(headX - 10.4, headY + 1.2, headX - 8.6, headY + 5.0);
  c.stroke();

  /* 7. Gesicht */
  c.strokeStyle = "#20343c";
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(headX + 3.2, headY - 1.0);
  c.quadraticCurveTo(headX + 4.6, headY - 0.2, headX + 6.0, headY - 1.0);
  c.stroke();
  c.strokeStyle = "#a35f4a";
  c.beginPath();
  c.moveTo(headX + 3.8, headY + 4.2);
  c.lineTo(headX + 5.8, headY + 4.0);
  c.stroke();
  c.fillStyle = "rgba(255,122,122,.28)";
  c.beginPath();
  c.ellipse(headX + 6.4, headY + 2.0, 1.9, 1.2, 0, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

/** Decke bis zum Hals: der Kopf bleibt frei, der Körper ist zugedeckt. */
/** Decke während des Hinlegens: exakt dieselbe Geometrie wie in der Schlafszene,
 *  damit beim Übergang keine Kante springt. */
function drawBlanket(c: C, t: number, _lift = 1) {
  const ox = 330;
  const oy = FLOOR_Y[2] - 20;
  const breathe = Math.sin(t * 1.1) * 0.3;
  const by = 12;
  rrect(c, ox - 13, oy + by, 84, 30 + breathe, 7, "#3f7f8c");
  rrect(c, ox - 11, oy + by + 1.2, 80, 4, 2, "#5da0a8");
  rect(c, ox - 8, oy + by + 8, 74, 1.6, "rgba(255,255,255,.30)");
  rect(c, ox - 8, oy + by + 16, 74, 1.2, "rgba(255,255,255,.18)");
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

function sofa(c: C, x: number, F: number) {
  rrect(c, x, F - 26, 90, 26, 7, "#3f7f8c");
  rrect(c, x + 6, F - 46, 78, 24, 8, "#59a3ac");
  rrect(c, x + 8, F - 30, 36, 14, 5, "#6bb4bb");
  rrect(c, x + 46, F - 30, 36, 14, 5, "#6bb4bb");
  rrect(c, x - 6, F - 36, 14, 36, 6, "#2f6470");
  rrect(c, x + 82, F - 36, 14, 36, 6, "#2f6470");
  rrect(c, x + 12, F - 44, 16, 14, 5, "#e2b24a");
}

function floorLamp(c: C, x: number, F: number) {
  line(c, x, F, x, F - 76, "#20343c", 3);
  rrect(c, x - 10, F - 3, 20, 3, 1.5, "#16282f");
  poly(c, [[x - 12, F - 74], [x + 12, F - 74], [x + 8, F - 90], [x - 8, F - 90]], "#e8dcc4");
}

function tvSet(c: C, x: number, F: number) {
  rrect(c, x, F - 20, 54, 20, 3, "#8a6a3c");
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

function fridge(c: C, x: number, F: number) {
  rrect(c, x, F - 78, 38, 78, 4, "#e6ecec");
  rect(c, x, F - 50, 38, 3, "#c3d0cf");
  rect(c, x + 5, F - 70, 3, 14, "#93a5a4");
  rect(c, x + 5, F - 44, 3, 12, "#93a5a4");
  rect(c, x + 16, F - 68, 8, 8, "#ff6f61");
  rect(c, x + 26, F - 62, 8, 10, "#ffd166");
}

function kitchenCounter(c: C, x: number, F: number, w: number) {
  rect(c, x, F - 36, w, 36, "#9b7447");
  for (const dx of [0, w * 0.34, w * 0.67, w - 1.5]) rect(c, x + dx, F - 36, 1.5, 36, "rgba(0,0,0,.28)");
  rect(c, x - 1, F - 40, w + 2, 4, "#efe8d8");
  rrect(c, x + 6, F - 41, 24, 4, 2, "#aeb8bb");
  line(c, x + 22, F - 41, x + 22, F - 52, "#8fa6b2", 2);
  line(c, x + 22, F - 52, x + 28, F - 52, "#8fa6b2", 2);
  // Kaffeemaschine
  rrect(c, x + 50, F - 58, 17, 18, 3, "#2a2f35");
  rect(c, x + 53, F - 46, 11, 6, "#4a2a1a");
  disc(c, x + 62, F - 54, 1.4, "#ff9f43");
  rrect(c, x + 36, F - 46, 6, 6, 1.5, "#f6f3ea");
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

/** Kleiner Beistelltisch neben dem Raucherstuhl */
function sideTable(c: C, x: number, F: number) {
  const y = F - 22;
  rrect(c, x - 20, y, 40, 5, 2, "#8a5a34");
  rect(c, x - 16, y + 5, 4, F - y - 5, "#6f4a2a");
  rect(c, x + 12, y + 5, 4, F - y - 5, "#6f4a2a");
}

/** Teekanne mit Tasse auf der Küchenzeile – der Gesundheitstee */
function teaPot(c: C, x: number, F: number) {
  const y = F - 40;
  // Kanne
  rrect(c, x - 7, y - 11, 14, 11, 4, "#5ea88a");
  rect(c, x - 5, y - 13, 10, 3, "#4a8d73");
  disc(c, x, y - 14.5, 1.6, "#e2b24a");
  // Ausguss und Henkel
  poly(c, [[x + 6, y - 8], [x + 12, y - 11], [x + 12, y - 9], [x + 7, y - 5]], "#5ea88a");
  c.strokeStyle = "#4a8d73";
  c.lineWidth = 1.8;
  c.beginPath();
  c.arc(x - 8, y - 6, 3.4, Math.PI * 1.5, Math.PI * 0.5);
  c.stroke();
  // Tasse daneben
  rrect(c, x + 10, y - 5, 6, 5, 1.2, "#f6f3ea");
  rect(c, x + 11, y - 4, 4, 1.4, "#9ec98a");
}

/** Handy, das auf dem Tischchen liegt */
function phoneOnTable(c: C, x: number, y: number) {
  rrect(c, x - 3.4, y - 1.6, 6.8, 3.2, 1, "#23262e");
  rect(c, x - 2.6, y - 1, 5.2, 2, "#3b4350");
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
function kitchenTable(c: C, x: number, F: number, w: number) {
  const top = F - 36;
  rrect(c, x, top, w, 5, 2, "#a67c52");
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

function bed(c: C, x: number, F: number) {
  rrect(c, x, F - 52, 8, 52, 3, "#6f4a2a");
  rrect(c, x + 104, F - 34, 8, 34, 3, "#6f4a2a");
  rect(c, x + 6, F - 18, 100, 12, "#8a5a34");
  rrect(c, x + 8, F - 30, 98, 14, 5, "#f2efe6");
  rrect(c, x + 12, F - 38, 30, 12, 6, "#ffffff");
  rrect(c, x + 46, F - 36, 58, 20, 6, "#3f7f8c");
  rect(c, x + 48, F - 30, 54, 2, "rgba(255,255,255,.35)");
}

function nightstand(c: C, x: number, F: number) {
  rect(c, x, F - 26, 26, 26, "#8a6a3c");
  rect(c, x + 3, F - 22, 20, 8, "#7a5a30");
  disc(c, x + 13, F - 18, 1.4, "#e6c36a");
  rect(c, x + 12, F - 36, 2.5, 10, "#20343c");
  poly(c, [[x + 4, F - 36], [x + 22, F - 36], [x + 18, F - 50], [x + 8, F - 50]], "#f2d9a0");
}

function wardrobe(c: C, x: number, F: number) {
  rrect(c, x, F - 84, 48, 84, 3, "#9b7447");
  rect(c, x + 23, F - 80, 2, 76, "rgba(0,0,0,.3)");
  rect(c, x + 3, F - 80, 18, 76, "#8a6a3c");
  rect(c, x + 27, F - 80, 18, 76, "#8a6a3c");
  disc(c, x + 20, F - 42, 1.6, "#e6c36a");
  disc(c, x + 28, F - 42, 1.6, "#e6c36a");
}


/* --- Möbel: Dachgeschoss --- */

function beanbag(c: C, x: number, F: number) {
  c.beginPath();
  c.moveTo(x, F);
  c.quadraticCurveTo(x - 2, F - 20, x + 18, F - 24);
  c.quadraticCurveTo(x + 30, F - 28, x + 40, F - 20);
  c.quadraticCurveTo(x + 58, F - 12, x + 56, F);
  c.closePath();
  c.fillStyle = "#ff6f61";
  c.fill();
  c.globalAlpha = 0.25;
  c.beginPath();
  c.ellipse(x + 26, F - 17, 14, 4, -0.2, 0, Math.PI * 2);
  c.fillStyle = "#ffffff";
  c.fill();
  c.globalAlpha = 1;
}

/**
 * Altes aufrechtes Klavier im Musikzimmer des NORMALEN Hauses.
 *
 * Aufbau (Bühnenkoordinaten, F = Bodenlinie 200):
 *   Korpus      545–589 (unverändert)
 *   Klaviatur   585–627, angesetzt am Korpus, Tasten 587–621 auf y=168
 *   Hocker      604–630, Sitzfläche 178–184
 *   Sitzplatz   x=617, Blick nach links; Hände landen bei x≈603–605,
 *               also in der Mitte der Tasten statt am rechten Ende.
 *
 * Gegenüber dem alten Stand ist die Tastatur 20 Einheiten nach links gerückt
 * und Hocker/Sitzplatz um 16 Einheiten mitgewandert. Korpus, Notenpult und
 * Bodenlinie bleiben unverändert.
 */
function piano(c: C, x: number, F: number) {
  // Korpus und Deckel
  rrect(c, x, F - 56, 44, 56, 3, "#2a1f1b");
  rect(c, x - 2, F - 58, 48, 4, "#3a2a24");
  rect(c, x - 2, F - 58, 48, 1.3, "rgba(255,255,255,.12)");

  // Notenpult mit aufgelegtem Notenblatt
  rrect(c, x + 5, F - 47, 26, 15, 2, "#241a16");
  c.fillStyle = "#efe6cf";
  c.fillRect(x + 7, F - 45, 22, 11);
  c.strokeStyle = "rgba(80,58,34,.45)";
  c.lineWidth = 0.35;
  for (let i = 0; i < 4; i++) line(c, x + 8, F - 43 + i * 2.2, x + 28, F - 43 + i * 2.2, "rgba(80,58,34,.45)", 0.35);

  /* ---- Klaviatur: sitzt jetzt am Korpus, nicht mehr rechts daneben ---- */
  const kx = 585;
  const ky = 168;
  const kw = 42;
  const kh = 7;
  // Klaviaturkasten, an den Korpus angesetzt
  rect(c, kx, ky - 2, kw + 2, kh + 5, "#221812");
  rect(c, kx, ky - 2, kw + 2, 1, "rgba(255,255,255,.14)");
  // weiße Tasten 587–621
  const tx = 587;
  const tw = 34;
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
  rect(c, tx - 2, ky + kh, tw + 4, 2.6, "#3a2a24");
  rect(c, tx - 2, ky + kh, tw + 4, 0.8, "rgba(255,255,255,.1)");
  rect(c, kx, ky - 2, 2.4, kh + 5, "#2f221b");
  rect(c, tx + tw, ky - 2, 2.2, kh + 5, "#2f221b");
  c.fillStyle = "#d9a83c";
  c.fillRect(tx - 3.6, ky + kh + 0.7, 1.3, 1.1);
  c.fillRect(tx + tw + 2.4, ky + kh + 0.7, 1.3, 1.1);

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
function pianoStool(c: C, x: number, F: number) {
  rrect(c, x, F - 22, 26, 6, 3, "#6b3f2a");
  rect(c, x + 2, F - 17, 22, 1.1, "rgba(217,168,60,.55)");
  line(c, x + 4, F - 16, x + 2, F, "#4a2a1c", 1.6);
  line(c, x + 21, F - 16, x + 23, F, "#4a2a1c", 1.6);
  line(c, x + 6, F - 16, x + 5, F, "#4a2a1c", 1.2);
  line(c, x + 19, F - 16, x + 20, F, "#4a2a1c", 1.2);
}

function lowboardTV(c: C, x: number, F: number) {
  rrect(c, x, F - 22, 66, 22, 3, "#2a2a38");
  rect(c, x + 4, F - 16, 26, 1.4, "rgba(255,255,255,.12)");
  rrect(c, x + 3, F - 66, 60, 44, 3, "#15171c");
  rect(c, x + 6, F - 63, 54, 34, "#0a0d12");
  rect(c, x + 38, F - 20, 20, 4, "#3b3f4a");
  disc(c, x + 56, F - 18, 1, "#35d6c0");
}



function recordPlayer(c: C, x: number, F: number) {
  rrect(c, x, F - 24, 52, 24, 3, "#8a5a34");
  rect(c, x + 4, F - 20, 20, 12, "#7a4a28");
  rect(c, x + 28, F - 20, 20, 12, "#7a4a28");
  rrect(c, x + 3, F - 31, 46, 8, 2, "#1d1d22");
  c.beginPath();
  c.ellipse(x + 20, F - 27, 14, 3, 0, 0, Math.PI * 2);
  c.fillStyle = "#0a0a0d";
  c.fill();
  c.beginPath();
  c.ellipse(x + 20, F - 27, 4, 1.2, 0, 0, Math.PI * 2);
  c.fillStyle = "#c9453a";
  c.fill();
  line(c, x + 42, F - 30, x + 28, F - 27, "#c3d0cf", 1.6);
}

function speaker(c: C, x: number, F: number) {
  rrect(c, x, F - 36, 16, 36, 3, "#2a2420");
  disc(c, x + 8, F - 26, 4.6, "#16130f");
  disc(c, x + 8, F - 26, 2, "#4a4036");
  disc(c, x + 8, F - 10, 3, "#16130f");
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
}

/* --- Möbel: Keller --- */

function shelving(c: C, x: number, F: number, w: number, h: number, seed: number) {
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
      if (kind === 0) rect(c, bx, y - 2 - bh, cw, bh, "#b9915a");
      else if (kind === 1) rrect(c, bx, y - 13, Math.min(8, cw), 11, 2, "#6f9a6a");
      else if (kind === 2) rect(c, bx, y - 11, Math.min(9, cw), 9, "#c9453a");
      else rect(c, bx, y - 2 - bh, cw, bh, "#8a7a62");
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
  // Schuhe
  rrect(c, x + 4, F - 7, 12, 6, 2, "#202833");
  rrect(c, x + 19, F - 7, 12, 6, 2, "#a6483c");
  rrect(c, x + 34, F - 7, 12, 6, 2, "#e8e2d2");
}

function dogBowls(c: C, x: number, F: number) {
  rrect(c, x, F - 6, 12, 6, 2, "#c9453a");
  rrect(c, x + 14, F - 6, 12, 6, 2, "#3f6fb0");
  rect(c, x + 2, F - 7, 8, 2, "#8a5a34");
  rect(c, x + 16, F - 7, 8, 2, "#8a5a34");
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

/** Zigarette in der Hand, mit glimmender Spitze */
function cigarette(c: C, x: number, y: number, face: 1 | -1, burn: number) {
  c.save();
  c.translate(x, y);
  c.scale(face, 1);
  c.rotate(-0.42);
  rect(c, -1.2, -1, 10, 2, "#f6f3ea");
  rect(c, 5.8, -1, 3, 2, "#e2b24a");
  c.fillStyle = burn > 0.02 ? "#ff8c42" : "#c2b8a6";
  c.beginPath();
  c.arc(-1.2, 0, 1.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Draußen rechts: Garten mit Weg zur Kellertür */
function gardenOutside(c: C) {
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
  fir(c, W - 22, FK, 118, true);
  snowman(c, HR + 62, FK);
}

function drawExterior(c: C) {
  // links: Vorgarten auf Erdgeschoss-Höhe über dem Erdreich
  rect(c, 0, FE + 12, CEL_X0, H - FE - 12, "#4a382c");
  for (let i = 0; i < 34; i++) {
    const sx = hash(i + 200) * (CEL_X0 - 6);
    const sy = FE + 20 + hash(i + 300) * (H - FE - 26);
    rect(c, sx, sy, 3 + hash(i + 400) * 5, 2 + hash(i + 500) * 3, hash(i) > 0.5 ? "#5d493a" : "#3a2c22");
  }
  rect(c, 0, FE, 100, 12, "#eef4fa");
  rect(c, 0, FE, 100, 2.4, "#ffffff");
  fir(c, 20, FE, 110, true);
  mailbox(c, 68, FE);
  gardenOutside(c);
}

function drawRoof(c: C) {
  rect(c, 690, 8, 30, 92, "#8a4a3a");
  for (let y = 16; y < 100; y += 8) rect(c, 690, y, 30, 1, "rgba(0,0,0,.25)");
  rect(c, 686, 4, 38, 8, "#eef4fa");
  poly(c, [[86, 128], [86, roofTop(86)], [470, 22], [854, roofTop(854)], [854, 128]], "#2b3a48");
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    line(c, 90 + t * 380, roofTop(90 + t * 380) + 9, 98 + t * 380, roofTop(98 + t * 380) + 9, "rgba(255,255,255,.07)", 1);
  }
  poly(c, [[84, roofTop(84) + 1], [470, 19], [856, roofTop(856) + 1], [856, 128], [470, 28], [84, 128]], "#f2f7fb");
  rect(c, 98, 128, 744, 3, "rgba(0,0,0,.25)");
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
function bathTiles(c: C, x0: number, x1: number, yTop: number, yBot: number) {
  rect(c, x0, yTop, x1 - x0, yBot - yTop, TILE_GROUT);
  const cols = Math.ceil((x1 - x0) / TILE);
  const rows = Math.ceil((yBot - yTop) / TILE);
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const tx = x0 + q * TILE + 1;
      const ty = yTop + r * TILE + 1;
      const tw = Math.min(TILE - 2, x1 - 1 - tx);
      const th = Math.min(TILE - 2, yBot - 1 - ty);
      if (tw <= 0 || th <= 0) continue;
      rect(c, tx, ty, tw, th, hashTile(r, q) > 0.5 ? TILE_A : TILE_B);
      rect(c, tx, ty, tw, 1, "rgba(255,255,255,.14)");
    }
  }
  rect(c, x0, yBot - 3, x1 - x0, 3, TILE_GROUT);
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

function drawHouse(
  c: C,
  sky: HTMLCanvasElement,
  door: { open: number },
  golOnShelf: boolean,
  /** Gruselhaus: welche Räume umgestaltet sind (null = normales Haus) */
  gr: GruselRaeume | null = null,
) {
  drawExterior(c);
  drawRoof(c);

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
  wallBand(c, HL, 270, 30, FO, "#8a8fb3", "#7075a0", 26);
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
  else wallBand(c, DG_X0, 530, 30, FD, "#4a4f92", "#383d7c", 30);
  wallBand(c, 530, HR, 30, FD, "#9a5750", "#7e433e", 30);
  c.restore();

  // 1. Stock
  wallBand(c, 270, 490, FD + SLAB, FO, "#b9808f", "#9c6676", 30);
  bathTiles(c, 490, OG_X1, FD + SLAB, FO);
  // Treppenhaus rechts (über EG und 1. Stock)
  wallBand(c, OG_X1, HR, FD + SLAB, FE, "#cdb78f", "#b79f74", 30);
  // Erdgeschoss
  wallBand(c, HL, 250, FO + SLAB, FE, "#7d93a3", "#5f7584", 30);
  wallBand(c, 250, 560, FO + SLAB, FE, "#6f9a93", "#55807a", 30);
  wallBand(c, 560, OG_X1, FO + SLAB, FE, "#dcbc70", "#c9a458", 34);
  // Keller
  wallBand(c, CEL_X0, 590, FE + SLAB, FK, "#6f746f", "#5a5f5a", 26);
  wallBand(c, 590, HR, FE + SLAB, FK, "#7d8670", "#6b5236", 40);

  /* ---- Böden ---- */
  const WOOD = "#a06f45";
  slab(c, CEL_X0, HR, FK, [[CEL_X0, 590, "#8a8d88", "none"], [590, HR, "#777a74", "none"]], "#2a2522");
  slab(c, 98, HR, FE, [[98, 560, WOOD, "wood"], [560, HR, "#e8e2d2", "tile"]]);
  slab(c, 98, OG_X1 + 2, FO, [[98, 490, "#a87a52", "wood"], [490, OG_X1 + 2, "#4d9a66", "tile"]]);
  slab(c, DG_X0, HR, FD, [[DG_X0, 530, gr?.raumstation ? "#5a5a6a" : "#3e3b52", "none"], [530, HR, WOOD, "wood"]]);
  if (gr?.raumstation) drawMetalFloor(c, DG_X0, 530, FD);

  /* ---- Außenwände ---- */
  rect(c, 98, 118, 12, FE + SLAB - 118, "#4a3a33");
  rect(c, 98, 118, 2, FE + SLAB - 118, "rgba(255,255,255,.14)");
  rect(c, HR, 118, 12, FK + 14 - 118, "#4a3a33");
  rect(c, HR + 10, 118, 2, FK + 14 - 118, "rgba(255,255,255,.1)");
  // Türöffnung in der Keller-Außenwand (sonst massiv)

  rect(c, CEL_X0 - 12, FE + SLAB, 12, FK + 14 - FE - SLAB, CELLAR_WALL);

  /* ---- Trennwände ---- */
  partition(c, 250, FO + SLAB, FE);
  partition(c, 560, FO + SLAB, FE);
  partition(c, 270, FD + SLAB, FO);
  partition(c, 490, FD + SLAB, FO);
  partition(c, 530, atticCeil(530), FD);
  partition(c, 590, FE + SLAB, FK);

  /* ---- Treppen ---- */
  for (const s of STAIRS) drawStair(c, s);
  railing(c, DG_X0 - 14, FD, 12);
  railing(c, OG_X1 - 12, FO, 12);

  /* ---- Dachbalken ---- */
  if (gr?.raumstation) {
    // Raumstation: Stahlträger bis zur Trennwand, danach der alte Holzbalken
    drawSteelBeam(c, 278, 530, 88, 6);
    rect(c, 530, 88, 132, 6, "#5a3d28");
    rect(c, 530, 88, 132, 1.6, "rgba(255,255,255,.18)");
  } else {
    rect(c, 278, 88, 384, 6, "#5a3d28");
    rect(c, 278, 88, 384, 1.6, "rgba(255,255,255,.18)");
  }

  /* ---- Fenster ---- */
  windowRect(c, sky, 330, 358, 64, 38, { curtain: "#c9453a" });
  windowRect(c, sky, 624, 364, 50, 36);
  windowRect(c, sky, 740, 236, 44, 78, { mull: 2 });
  windowRect(c, sky, 334, 244, 62, 46, { curtain: "#7a3f55" });
  if (gr?.raumstation) drawSpaceWindow(c, RS.fenster.x, RS.fenster.y, RS.fenster.r);
  else windowRect(c, sky, 330, 98, 56, 44, { mull: 2 });
  roundWindow(c, sky, 590, 104, 20);
  windowRect(c, sky, 704, 472, 36, 20, { mull: 2 });

  /* ---- Erdgeschoss ---- */
  haustuer(c, sky, 135, FE);
  garderobe(c, 198, FE);
  ceilingLamp(c, 170, FO + SLAB, 14);
  bookshelf(c, 258, FE, 32, 92, 5, 2);
  c.beginPath();
  c.ellipse(388, FE + 3, 112, 6, 0, 0, Math.PI * 2);
  c.fillStyle = "#b0524a";
  c.fill();
  c.beginPath();
  c.ellipse(388, FE + 3, 78, 4, 0, 0, Math.PI * 2);
  c.fillStyle = "#d9a86a";
  c.fill();
  sofa(c, 312, FE);
  floorLamp(c, 302, FE);
  tvSet(c, 438, FE);
  kellerTuer(c, 500, FE);
  fridge(c, 574, FE);
  kitchenCounter(c, 614, FE, 76);
  teaPot(c, 630, FE);
  stove(c, 690, FE);
  ceilingLamp(c, 650, FO + SLAB, 14);
  kitchenTable(c, 724, FE, 74);
  tobaccoTin(c, 766, FE);
  chair(c, 732, FE, true);
  chair(c, 796, FE, false);

  /* ---- 1. Stock ---- */
  rrect(c, 236, FO - 18, 16, 18, 3, "#c96f4a");
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.5;
    line(c, 244, FO - 18, 244 + Math.cos(a) * 18, FO - 18 + Math.sin(a) * 26, "#3f8f5f", 3);
    disc(c, 244 + Math.cos(a) * 18, FO - 18 + Math.sin(a) * 26, 4, i % 2 ? "#54b071" : "#3f8f5f");
  }
  c.beginPath();
  c.ellipse(340, FO + 3, 90, 5, 0, 0, Math.PI * 2);
  c.fillStyle = "#8a4f63";
  c.fill();
  bed(c, 282, FO);
  nightstand(c, 396, FO);
  wardrobe(c, 434, FO);
  ceilingLamp(c, 340, FD + SLAB, 14, "#f2d9a0");
  showerStatic(c, FO);
  wcTuer(c, WC_DOOR_X, FO);
  waschbeckenMitSpiegel(c, SINK_X, FO);
  bathCeilingLamp(c, 590, FD + SLAB, FO, 490, OG_X1);

  /* ---- Dachgeschoss ---- */
  if (gr?.raumstation) {
    // Horror-Raumstation: Sessel, Terminal, Lagerregal und alle Details
    drawRaumstationMoebel(c, atticCeil, golOnShelf ? (cc, bx, by, bw, bh) => golCartridge(cc, bx, by, bw, bh) : undefined);
  } else {
    beanbag(c, 296, FD);
    lowboardTV(c, 404, FD);
    bookshelf(c, 486, FD, 38, 74, 4, 5, true, {
      row: 0,
      index: 1,
      item: golOnShelf ? (cc, bx, by, bw, bh) => golCartridge(cc, bx, by, bw, bh) : undefined,
    });
    picture(c, 412, 96, 44, 26, "#ff6f61");
    picture(c, 276, 108, 22, 30, "#35d6c0");
  }
  // Klavier nur im normalen Haus zeichnen. Im Gruselhaus ist es (Auftrag KI-A)
  // entfernt; das Horrorhaus (Traumhaus) ist eine eigene, leere Ansicht.
  if (!gr) {
    // Nur im normalen Haus (gr === null). Gruselhaus und Horrorhaus ohne Klavier.
    piano(c, 545, FD);
    pianoStool(c, 604, FD);
  }
  saxStand(c, 646, FD);
  speaker(c, 678, FD);
  recordPlayer(c, 698, FD);
  speaker(c, 754, FD);
  recordShelf(c, 776, FD);
  guitar(c, 818, FD);
  if (!gr?.raumstation) ceilingLamp(c, 430, atticCeil(430) + 2, 36, "#f2d9a0");
  ceilingLamp(c, 700, atticCeil(700) + 2, 30, "#f2d9a0");

  /* ---- Keller ---- */
  shelving(c, 354, FK, 56, 104, 1);
  shelving(c, 528, FK, 60, 92, 3);
  cardboard(c, 446, FK, 30, 24);
  cardboard(c, 478, FK, 24, 18);
  cardboard(c, 452, FK - 24, 22, 16);
  xmasBox(c, 526, FK);
  bulb(c, 470, FE + SLAB, 14);
  coatBoard(c, 604, FK);
  dogBowls(c, 668, FK);
  smokerChair(c, 696, FK);
  sideTable(c, 732, FK);
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
const DRESS_SEQ = ["dToWardrobe", "dOpen", "dDress", "dClose"] as const;
const GLASS_SEQ = ["gToSink", "gPick"] as const;
const CAB_OPEN_SEQ = ["cToCab", "cOpen"] as const;
const CAB_CLOSE_SEQ = ["kToCab", "kClose"] as const;
const BRUSH_SEQ = ["bToCab", "bTake", "bStep", "bBend", "bBrush", "bUp", "bReturn", "bPut"] as const;
const BED_SEQ = ["bToWardrobe", "bedOpen", "bedTop", "bedBottom", "bedPants", "bedPajama", "bedClose", "bedSit", "bedToss"] as const;
const ALL_SEQS: readonly (readonly string[])[] = [
  SH_SEQ, DRESS_SEQ, GLASS_SEQ, CAB_OPEN_SEQ, CAB_CLOSE_SEQ, BRUSH_SEQ, BED_SEQ,
];
type ShPhase =
  | (typeof SH_SEQ)[number]
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
  closeCurtain: 1.3, towelOff: 1.1, throwTowel: 0.9, waterOn: 0.8,
  washHair: 3.4, washBody: 3.4, rinse: 2.8, waterOff: 0.8,
  takeTowel: 0.9, wrapOn: 1.5, openCurtain: 1.3,
  dOpen: 0.7, dDress: 1.8, dClose: 0.6,
  gPick: 2.3, cOpen: 1.2, kClose: 1.2,
  bTake: 1.1, bBend: 1.4, bBrush: 7, bUp: 1.3, bPut: 1.1,
  bedOpen: 0.7, bedTop: 1.1, bedBottom: 1.3, bedPants: 1.2, bedPajama: 2.2, bedClose: 0.6, bedToss: 1.3,
};
/** Hinter dem Vorhang: nicht unterbrechbar */
const SH_LOCKED: ShPhase[] = [
  "glassesOff", "tossGlasses", "openWardrobe", "undress", "wrap", "closeWardrobe", "closeCurtain", "towelOff", "throwTowel",
  "waterOn", "washHair", "washBody", "rinse", "waterOff", "takeTowel", "wrapOn", "openCurtain",
  "dOpen", "dDress", "dClose",
  "gPick", "cOpen", "kClose",
  "bTake", "bStep", "bBend", "bBrush", "bUp", "bReturn", "bPut",
  "bedOpen", "bedTop", "bedBottom", "bedPants", "bedPajama", "bedClose", "bedSit", "bedToss",
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
  /** Welche Hauswelt dieses Haus zeigt: das normale oder das Gruselhaus */
  welt?: "normal" | "gruesel";
  /** Ein Klick auf einen Wechselstein: Ziel-Hauswelt */
  onWelt?: (ziel: WeltId) => void;
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

  /* ------------------------------ Hauswelt ------------------------------- */
  private welt: "normal" | "gruesel" = "normal";
  private onWelt: ((ziel: WeltId) => void) | null = null;
  private steine: SteinSlot[] = [];
  private steinStationen: Station[] = [];
  private saveT = 0;
  /** Gruselhaus, Raum 01: seltene Effekte (Notfallschalter, Funken) */
  private raumFx = new RaumstationFx();

  // Raucherecke
  private gardenDoor = 0; // 0 = zu, 1 = offen
  private gardenWant = 0;
  /** gewünschter Türzustand; wird erst beim Ankommen an der Tür umgesetzt */
  private gardenTarget: 0 | 1 | null = null;
  /** Zigarette liegt im Aschenbecher (nach dem Abbrechen des Rauchens) */
  private cigButt = false;
  /** Armbewegung zum Aschenbecher: "put" legt ab, "take" nimmt auf */
  private ashMove: "put" | "take" | null = null;
  /** Was bewegt wird: die Zigarette oder das Handy */
  private ashItem: "cig" | "phone" = "cig";
  /** Richtung: nehmen oder weglegen */
  private ashDir: "take" | "put" = "put";
  private ashT = 0;
  /** nach dem Ablegen auszuführender Befehl */
  private ashNext: string | null = null;
  /** nach dem Ablegen folgt die Handy-Pause statt eines Befehls */
  private ashThenPhone = false;
  /** true = sie ist zum Rauchen hier (über den Aschenbecher bestellt) */
  private smokeRequested = false;
  /** Handy-Modus beim Sitzen: scrollen oder telefonieren */
  private phoneMode: "scroll" | "call" = "scroll";
  /** wie lange sie schon gemütlich auf dem Stuhl sitzt */
  private sitIdleT = 0;
  /** Aufsteh-Animation läuft (vom Stuhl) */
  private standing = false;
  private standT = 0;
  /** Befehl, der nach dem Aufstehen ausgeführt wird */
  private standNext: string | null = null;
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

  // Handy-Pause während des Rauchens
  /** sie geht gerade zum Stuhl zurück, um dort das Handy herauszuholen */
  private phoneQueued = false;
  private onPhone = false;
  private phoneT = 0;
  private phoneReact: "look" | "laugh" | "shake" = "look";
  private phoneReactT = 0;
  /** wie lange sie schon ununterbrochen raucht (für die Pause) */
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
  private golFullscreen = false;

  // Bett-Routine und Traum
  private bedPhase: "toss" | null = null;
  private pyjama: { top: string; bottom: string } | null = null;
  /** 0 = zu Hause, 1 = oben am Himmel */
  private tossUp = 0;
  private tossLand = 1;
  private tossLanded = false;
  private asleep = false;
  private sleepT = 0;
  private dreamCool = 0;
  private revealT = 0;
  private bedTimePending = false;
  private sleepRest = 0;
  private bedSitHair = 0;
  /** Schlafablauf: greifen -> ziehen -> drehen -> Haare legen -> schlafen */
  private sleepPhase: "grab" | "pull" | "turn" | "settle" | null = null;
  private sleepPhaseT = 0;
  private dream: Dream | null = null;
  /** kurze Aufwachpose nach „Aufwachen“ */
  private wakeT = 0;
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
  private wet = 0;
  private shPhase: ShPhase | null = null;
  private shT = 0;
  private curtain = 0;
  private water = false;
  private steam = 0;
  private towelOnRod = false;
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
  /** wurde die Zigarette beim "Nehmen" aus dem Aschenbecher geholt? */
  private takeLit = false;
  private doorT = 0;
  /** ausstehende Befehle nach der aktuellen Aktion.
   *  force = Rückkehr ohne Prüfung, sonst Spielerbefehl mit Prüfung. */
  private chain: { id: string; force: boolean }[] = [];

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
    const alt = opts.onTraumhaus;
    this.onWelt = opts.onWelt ?? (alt ? (z) => { if (z === "traum") alt(); } : null);
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
    this.ro = new ResizeObserver(() => this.resize());
    if (this.canvas.parentElement) this.ro.observe(this.canvas.parentElement);
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("pagehide", this.onPageHide);
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerleave", this.onLeave);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.speichern();
    window.removeEventListener("pagehide", this.onPageHide);
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.dream?.destroy();
    this.dream = null;
    this.stopSax();
    this.saxMusic?.dispose();
    this.saxMusic = null;
    this.saxReady = false;
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
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
    this.smoke = clamp(s.smoke, 0, 1);
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
    for (const st of STATIONS) {
      // Leeres Fach: das Modul ist schon heruntergenommen.
      if (st.id === "gol_game" && !this.golOnShelf) continue;
      // Klavier existiert nur im normalen Haus (Auftrag KI-A: im Horrorhaus entfernt).
      if (st.id === "klavier" && this.welt !== "normal") continue;
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

  private onDown = (e: PointerEvent) => {
    sfx.ensure();
    const [x, y] = this.toWorld(e);
    if (this.dream) {
      this.dream.unlock();
      this.dream.onDown(x, y);
      return;
    }
    if (this.golFullscreen) {
      this.onGolFullscreenClick(x, y);
      return;
    }
    // Nur der Fernseher im Zockerzimmer, und nur wenn das Modul steckt.
    if (this.golInserted && this.hitAtticTv(x, y)) {
      this.startTvZoom();
      return;
    }
    // Wechselsteine: ein Klick genügt.
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
    }
  };

  private onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const [x, y] = this.toWorld(e);
    if (this.dream) {
      this.hover = null;
      this.canvas.style.cursor = this.dream.hover(x, y) ? "pointer" : "default";
      return;
    }
    if (this.golFullscreen) {
      this.hover = null;
      const b = GOL_BTN;
      const onBtn = x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
      const onCtrl = !!golCtrlAt(x, y);
      const v = this.golState ? golView(this.golState) : null;
      const onGrid = !!v && x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h;
      this.canvas.style.cursor = onBtn || onCtrl || onGrid ? "pointer" : "default";
      return;
    }
    this.hover = this.steinUnter(x, y) ?? this.pick(x, y);
    const onTv = this.golInserted && this.hitAtticTv(x, y);
    this.canvas.style.cursor = this.hover || onTv ? "pointer" : "default";
  };

  private onLeave = () => {
    this.hover = null;
    this.canvas.style.cursor = "default";
  };

  /**
   * Befehl an Luni. Mit Zigarette in der Hand darf sie den Raum verlassen;
   * nur wer aktiv raucht und die Gartentür öffnen will, legt vorher ab.
   * Die Schleusentür bedient sie mit Zigarette in der Hand.
   */
  command(id: string) {
    const find = (k: string) => STATIONS.find((s) => s.id === k) ?? null;

    // Läuft „Paulchen“, beendet jede andere Anweisung die Musik sofort.
    if (this.saxPhase) {
      if (id === "saxophon") return;
      this.stopSax();
    }
    // Schon beim Klick die Tonpuffer berechnen: dann ist die Musik am Mund bereit.
    if (id === "saxophon") this.prepareSax();

    // Duschen: hinter dem Vorhang wird nichts unterbrochen. Auf dem Weg
    // dorthin bricht ein anderer Wunsch den Ablauf ab.
    if (this.shPhase && SH_LOCKED.includes(this.shPhase)) return;
    if (this.shPhase) this.cancelShower();
    if (id === "dusche") {
      this.chain = [];
      this.smokeRequested = false;
      this.startSh(this.outfit === "towel" ? "toSink" : "toWardrobe");
      return;
    }
    if (id === "bett" && this.asleep && !this.dream) {
      this.replayDream();
      return;
    }
    if (this.asleep && id !== "bett") {
      // Jede andere Aktion weckt sie und gibt das Spiel frei.
      this.finishDream(true);
    }
    if (this.lieDown && id !== "bett") {
      this.lieDown = false;
    }
    if (id === "bett") {
      const hour = this.clock.hour + this.clock.min / 60;
      const nightOrSick = hour >= 20 || hour < 6 || this.sick > 0.35;
      if (nightOrSick) {
        // Abends oder krank: erst umziehen, dann ins Bett.
        this.chain = [];
        this.startBedRoutine();
        return;
      }
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
    if (
      this.activity?.id === "raucherstuhl" &&
      id !== "raucherstuhl" &&
      !this.standing &&
      !this.ashMove
    ) {
      this.standing = true;
      this.standT = 0;
      this.standNext = id;
      this.onPhone = false;
      this.phoneQueued = false;
      return;
    }

    // Läuft gerade die Armbewegung zum Aschenbecher, wird der neue Befehl
    // danach ausgeführt – sonst würde die Hand mitten in der Luft abbrechen.
    if (this.ashMove) {
      if (id === "aussentuer") this.gardenTarget = this.gardenWant > 0.5 ? 0 : 1;
      if (this.ashMove === "put") {
        // War die Ablage nur für die Handy-Pause gedacht, übernimmt jetzt
        // der neue Befehl – sie soll ja z. B. zur Tür statt ans Handy.
        this.ashThenPhone = false;
        this.ashNext = id;
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
        this.ashNext = id;
        return;
      }
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
      this.goTo("aussentuer");
      return;
    }

    // Mit Zigarette in der Hand darf sie den Raum verlassen – kein
    // automatisches Ablegen bei anderen Anweisungen.

    if (id === "zimmertuer") {
      // Wie die Gartentür: jederzeit bedienbar, bricht andere Aktionen ab.
      // Die Zigarette behält sie dabei in der Hand – auch beim Rauchen wird
      // nichts in den Aschenbecher gelegt.
      this.cellarDoorWant = this.cellarDoorWant > 0.5 ? 0 : 1;
      this.chain = [];
      this.smokeRequested = false;
      this.goTo(this.doorStand());
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

    // ---- Stuhl: nur sitzen und Handy ----
    if (id === "raucherstuhl") {
      const seat = find("raucherstuhl");
      // Sie raucht gerade? Zigarette erst weglegen, dann gemütlich sitzen.
      if (this.smoking || this.holding) {
        this.smokeRequested = false;
        this.ashThenPhone = false;
        this.ashNext = "raucherstuhl";
        this.startAsh("put");
        return;
      }
      this.smokeRequested = false;
      this.sitIdleT = 0;
      this.onPhone = false;
      this.chain = [];
      this.pending = seat;
      return;
    }

    // ---- Aschenbecher: jetzt wird geraucht ----
    if (id === "aschenbecher") {
      this.smokeRequested = true;
      // Handy wegstecken, wenn sie vom Sitzen direkt zum Rauchen wechselt
      this.onPhone = false;
      this.phoneQueued = false;
      this.phoneT = 0;
      this.phoneReactT = 0;
      if (this.holding || this.smoking) {
        // Sie hat schon eine in der Hand (stehend oder sitzend): im
        // Aschenbecher ausdrücken – danach setzt sie sich hin.
        this.smokeRequested = false;
        this.ashThenPhone = false;
        this.ashNext = "raucherstuhl";
        this.startAsh("put");
        return;
      }
      // 1. Liegt ein noch brennender Stummel im Aschenbecher, nimmt sie
      //    zuerst diesen – egal was auf dem Tisch oder in der Schachtel liegt.
      if (this.cigButt && this.burnLeft > 0) {
        this.startAsh("take");
        return;
      }
      // abgebrannter Stummel: wegwerfen
      if (this.cigButt) this.cigButt = false;
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
      // Die Zigarette liegt auf dem Tischchen direkt neben dem Stuhl –
      // sie nimmt sie einfach, ohne dorthin laufen zu müssen.
      if (this.pack > 0) {
        this.pack -= 1;
        this.holding = true;
        this.burnLeft = this.newBurn();
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

    // Neutrale Ziele beenden einen offenen Rauchwunsch, damit sie später
    // nicht überraschend von selbst zu rauchen beginnt.
    this.smokeRequested = false;
    const st = find(id);
    if (st) this.pending = st;
  }

  /**
   * Luni öffnet die Schleusentür immer von der Seite, auf der sie steht:
   * links davon (Krempelraum) oder rechts (Rauchzimmer).
   */
  private doorStand(): Station {
    const st = STATIONS.find((s) => s.id === "zimmertuer");
    const left = this.lf === 0 && this.lx < 590;
    return {
      ...(st as Station),
      x: left ? 574 : 610,
      face: left ? 1 : -1,
    };
  }

  /** Brenndauer einer frischen Zigarette: 3,5 bis 5 Minuten */
  private newBurn() {
    return 210 + Math.random() * 90;
  }

  /** Befehl ohne Prüfung (Kette) */
  private assign(id: string) {
    const st = STATIONS.find((s) => s.id === id);
    if (st) this.pending = st;
  }

  /** Nur Weg setzen, ohne Prüfungen (für Ketten und erzwungene Schritte) */
  private goTo(id: string | Station) {
    const st = typeof id === "string" ? STATIONS.find((s) => s.id === id) : id;
    if (!st) return;
    this.onPhone = false;
    this.phoneQueued = false;
    this.target = st;
    this.activity = null;
    this.cur = null;
    this.path = [];
    this.buildPath(st.floor, st.x);
  }

  /**
   * Zigarette sichtbar ablegen: Der Arm fährt zum Aschenbecher, erst danach
   * geht Luni weiter. `next` wird nach der Bewegung ausgeführt.
   */
  private putCigarette(next: string | null) {
    this.ashNext = next;
    this.startAsh("put");
  }

  /**
   * Startet eine Aschenbecher-Handlung. Luni geht zuerst sichtbar zum
   * Tischchen und führt die Armbewegung erst dort aus.
   */
  private startAsh(kind: "put" | "take", item: "cig" | "phone" = "cig") {
    if (kind === "take") this.takeLit = item === "cig" ? this.cigButt : false;
    this.ashMove = kind;
    this.ashItem = item;
    this.ashDir = kind;
    this.ashT = 0;
    this.smoking = false;
    this.onPhone = false;
    this.phoneQueued = false;
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
  /** Scrollt sie gerade am Handy? */
  getOnPhone() {
    return this.onPhone;
  }
  /** "scroll" oder "call" */
  getPhoneMode() {
    return this.phoneMode;
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
    const dt = Math.min(0.05, (ts - this.last) / 1000);
    this.last = ts;
    this.update(dt);
    this.draw();
  };

  /** Für Tests: einen Schritt simulieren, ohne zu zeichnen */
  step(dt: number) {
    this.update(dt);
  }

  private update(dt: number) {
    this.elapsed += dt;
    this.updateHarvest(dt);

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
    const gd = Math.round(this.gardenDoor * 40) / 40;
    if (gd !== this.gardenRendered) {
      this.gardenRendered = gd;
      this.dirty = true;
    }
    // gleichmäßige, gut sichtbare Drehung (~1,2 s für den ganzen Weg)
    const doorStep = dt / 1.2;
    const doorDiff = this.gardenWant - this.gardenDoor;
    this.gardenDoor += Math.abs(doorDiff) <= doorStep ? doorDiff : Math.sign(doorDiff) * doorStep;
    this.updateLuni(dt);
    this.updateActions(dt);
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
    const glowing = this.smoking || (this.cigButt && this.burnLeft > 0);
    if (this.gardenDoor > 0.5) {
      this.smoke = clamp(this.smoke - dt * 0.4, 0, 1);
    } else if (glowing) {
      // Kräftig genug, um sichtbar zu füllen: ununterbrochenes Rauchen
      // braucht rund 45 Sekunden bis zur vollen Dichte (mit Pausen länger);
      // der Aschenbecher qualmt deutlich langsamer.
      this.smoke = clamp(this.smoke + dt * (this.smoking ? 0.022 : 0.007), 0, 1);
    } else {
      this.smoke = clamp(this.smoke - dt * 0.02, 0, 1);
    }

    // --- Zigarette brennt ab (auch im Aschenbecher) ---
    if ((this.holding || this.cigButt) && this.burnLeft > 0) {
      this.burnLeft = Math.max(0, this.burnLeft - dt);
      if (this.burnLeft === 0 && this.holding && !this.ashMove) {
        // fertig geraucht: den kalten Stummel im Aschenbecher ausdrücken
        this.smoking = false;
        this.putCigarette(null);
      }
    }

    // --- Schleusentür: beide Räume gleichen ihre Dichte an ---
    const doorAjar = this.cellarDoorV;
    if (doorAjar > 0.2) {
      // Symmetrischer Austausch: dieselbe Menge verlässt einen Raum und
      // kommt im anderen an. Dadurch kann der linke Raum den rechten nicht
      // mehr überholen; beide nähern sich derselben Dichte.
      const diff = this.smoke - this.smokeSpill;
      const exchange = diff * 0.075 * doorAjar * dt;
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
    } else {
      this.sick = clamp(this.sick - dt * 0.01, 0, 1);
    }

    // Gesundheitstee in der Küche
    if (act?.id === "tee") {
      this.teaT += dt;
      this.sick = clamp(this.sick - dt * 0.22, 0, 1);
      if (this.teaT >= 7) {
        this.teaT = 0;
        this.finishActivity();
      }
      return;
    }

    // Tür zum Rauchzimmer: weich auf- und zuschwingen
    // Die Schleusentür bleibt in ihrem Zustand, bis der Spieler sie bedient.
    this.cellarDoorV += (this.cellarDoorWant - this.cellarDoorV) * (1 - Math.exp(-9 * dt));

    // WC: Tür auf, hineingehen, Tür zu, eine Weile drin bleiben
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
      const DUR = 0.95;
      this.ashT += dt;

      // Handy nehmen oder zurücklegen: nur der Arm bewegt sich
      if (this.ashItem === "phone") {
        if (this.ashT >= DUR) {
          this.ashMove = null;
          this.ashT = 0;
          if (this.ashDir === "take") {
            this.onPhone = true;
            this.phoneT = 0;
            this.phoneReact = "look";
            this.phoneReactT = 0;
          } else {
            this.onPhone = false;
          }
          // Wieder auf dem Stuhl sitzen – sonst würde der Idle-Zyklus hängen.
          const seat = STATIONS.find((s) => s.id === "raucherstuhl");
          if (seat && this.lf === seat.floor) {
            this.activity = seat;
            this.target = seat;
            this.lface = seat.face;
          } else if (seat) {
            this.pending = seat;
          }
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
          if (this.ashThenPhone) {
            // Sie geht zum Stuhl zurück und holt dort das Handy heraus
            this.ashThenPhone = false;
            this.phoneQueued = true;
            const seat = STATIONS.find((s) => s.id === "raucherstuhl");
            if (seat) this.pending = seat;
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
        if (this.ashT >= DUR * 0.25) this.cigButt = false;
        if (this.ashT >= DUR) {
          this.ashMove = null;
          this.ashT = 0;
          this.holding = true;
          if (!this.takeLit || this.burnLeft <= 0) {
            // frische Zigarette aus der Schachtel
            if (this.pack > 0) this.pack -= 1;
            this.burnLeft = this.newBurn();
          }
          this.takeLit = false;
          // zurück auf den Stuhl zum Weiterrauchen
          this.smokeRequested = true;
          const next = this.ashNext;
          this.ashNext = null;
          if (next && next !== "raucherstuhl") {
            // Während des Aufnehmens kam ein anderer Befehl: gleich wieder
            // ablegen und dann dorthin.
            this.putCigarette(next);
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

    if (act?.id === "aussentuer") {
      this.doorT += dt;
      // kurz hinstellen, dann sichtbar öffnen bzw. schließen
      if (this.doorT >= 0.5 && this.gardenTarget !== null) {
        this.gardenWant = this.gardenTarget;
        this.gardenTarget = null;
        sfx.ui();
      }
      if (this.doorT >= 1.6) this.finishActivity();
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

    // ---- Stuhl: gemütlich sitzen, Handy raus ----
    if (act?.id === "raucherstuhl" && !this.smokeRequested) {
      this.smoking = false;
      this.smokeIdleT = 0;
      if (this.phoneQueued) {
        this.phoneQueued = false;
        this.onPhone = true;
        this.phoneT = 0;
        this.phoneReact = "look";
        this.phoneReactT = 0;
      }
      // Beim Hinsetzen das Handy aus der Tasche holen
      this.sitIdleT += dt;
      // Ihr Ruheverhalten auf dem Stuhl: Handy aus der Tasche holen, benutzen,
      // wieder weglegen – in wechselnder Reihenfolge.
      if (!this.onPhone && !this.ashMove && this.sitIdleT > 0.9) {
        this.sitIdleT = 0;
        this.phoneMode = Math.random() < 0.62 ? "scroll" : "call";
        this.startAsh("take", "phone");
      }
      if (this.onPhone) {
        this.phoneT += dt;
        this.phoneReactT += dt;
        if (this.phoneReactT >= (this.phoneMode === "call" ? 3.4 : 2.6)) {
          this.phoneReactT = 0;
          const r = Math.random();
          this.phoneReact = r < 0.4 ? "laugh" : r < 0.7 ? "shake" : "look";
        }
        if (this.phoneT >= 13) {
          // Handy zurück auf den Tisch – damit schließt sich der Idle-Zyklus
          this.phoneT = 0;
          this.onPhone = false;
          if (this.smokeRequested) this.startAsh("take", "cig");
          else this.startAsh("put", "phone");
        }
      }
      return;
    }

    if (act?.id === "raucherstuhl") {
      // Am Stuhl angekommen und das Handy war angekündigt
      if (this.phoneQueued) {
        this.phoneQueued = false;
        this.onPhone = true;
        this.phoneT = 0;
        this.phoneReact = "look";
        this.phoneReactT = 0;
      }
      // Handy-Pause: Zigarette liegt im Becher, sie scrollt und reagiert
      if (this.onPhone) {
        this.smoking = false;
        this.phoneT += dt;
        this.phoneReactT += dt;
        if (this.phoneReactT >= 2.6) {
          this.phoneReactT = 0;
          const r = Math.random();
          this.phoneReact = r < 0.4 ? "laugh" : r < 0.7 ? "shake" : "look";
        }
        if (this.phoneT >= 13) {
          this.phoneT = 0;
          this.onPhone = false;
          if (this.smokeRequested) {
            // Zigarette nehmen und weiter rauchen
            this.startAsh("take", "cig");
          } else {
            // Ruhepause: Handy zurück auf den Tisch
            this.startAsh("put", "phone");
          }
        }
        return;
      }

      // Im Aschenbecher liegt eine Zigarette: ist sie noch an, wird sie
      // weiter geraucht; ist sie abgebrannt, kommt sie weg.
      if (this.cigButt && !this.holding) {
        if (this.burnLeft > 0) {
          this.startAsh("take");
          return;
        }
        this.cigButt = false; // kalter Stummel -> wegwerfen
      }
      // Keine Zigarette in der Hand: eine neue aus der Schachtel nehmen
      if (!this.holding) {
        if (this.pack > 0) {
          this.pack -= 1;
          this.holding = true;
          this.burnLeft = this.newBurn();
        } else if (this.cigs > 0) {
          // am Tisch liegt Nachschub -> den holen
          this.chain = [{ id: "aschenbecher", force: false }];
          this.tabakMode = "take";
          this.pending = STATIONS.find((s) => s.id === "tabak") ?? null;
          return;
        } else {
          this.finishActivity();
          return;
        }
      }
      this.cigButt = false;
      this.smoking = true;
      this.smokeIdleT += dt;

      // Nach einer Weile legt sie die Zigarette von selbst ab und scrollt
      if (this.smokeIdleT >= 20) {
        this.smokeIdleT = 0;
        this.ashThenPhone = true;
        this.startAsh("put");
        return;
      }

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
    this.updateShower(dt);
    this.updateBedToss(dt);
    this.updateBedState(dt);
    this.updateDream(dt);
    this.updateSax(dt);
    if (this.welt === "gruesel") this.raumFx.update(dt);
    // Alle paar Sekunden sichern, damit ein Absturz nichts kostet.
    this.saveT += dt;
    if (this.saveT >= 4) {
      this.saveT = 0;
      this.speichern();
    }
    if (this.golInserted && this.golState?.running) this.updateGOL(dt);
  }

  /** Aktuelle Aktion beenden und den nächsten Befehl der Kette starten */
  private finishActivity() {
    this.activity = null;
    this.target = null;
    this.smokeRequested = false;
    this.onPhone = false;
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

  /** Öffnet die Zimmertür, wenn Luni im Keller daran vorbeigeht. */
  private checkCellarDoor(prevX: number) {
    if (this.lf !== 0) return;
    // Bedient sie die Tür gerade selbst, darf die Automatik nicht
    // dazwischenfunken – sonst reißt sie die eben geschlossene Tür wieder auf.
    if (this.target?.id === "zimmertuer") return;
    const crossed = (prevX < 590 && this.lx >= 590) || (prevX > 590 && this.lx <= 590);
    // Sie öffnet sich beim Durchgehen – bleibt aber offen, bis man sie schließt.
    if (crossed && this.cellarDoorV < 0.6) this.cellarDoorWant = 1;
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
        this.activity = this.target;
        this.lface = this.target.face;
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
      }
      return;
    }

    if (a.step.k === "walk") {
      const dx = a.step.x - this.lx;
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
      this.checkCellarDoor(prevX);
      return;
    }

    // Treppe
    const s = a.step.s;
    const dir = a.step.dir;
    const len = Math.hypot(s.topX - s.footX, FLOOR_Y[s.upper] - FLOOR_Y[s.lower]);

    if (a.phase === "enter") {
      // Luni öffnet die Kellertür und geht hinein
      a.timer += dt;
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
      moving: !!this.cur || this.path.length > 0,
      activity: this.activity?.id ?? null,
      night: this.night,
    };
  }

  /* ------------------------------ Zeichnen ------------------------------- */

  private renderStatic() {
    const s = this.scale * this.dpr;
    const hour = this.clock.hour + this.clock.min / 60;

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
    );
    // Raum 02 wird als eigene Canvas-Szene über die frühere Musikzimmerfläche
    // gemalt. Der Bereich beginnt hinter der Trennwand; kein Nachbarraum ändert sich.
    if (this.welt === "gruesel" && GRUSELRAEUME.orchester) {
      drawOrchesterRoom(this.bgc, atticCeil);
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
        const r1 = l.r * 0.78;
        const g1 = m.createRadialGradient(l.x, l.y, 4, l.x, l.y, r1);
        g1.addColorStop(0, `rgba(255,255,255,${0.9 * str})`);
        g1.addColorStop(0.45, `rgba(255,255,255,${0.3 * str})`);
        g1.addColorStop(1, "rgba(255,255,255,0)");
        m.fillStyle = g1;
        m.beginPath();
        m.arc(l.x, l.y, r1, 0, Math.PI * 2);
        m.fill();
        const g2 = a.createRadialGradient(l.x, l.y, 4, l.x, l.y, r1);
        g2.addColorStop(0, `rgba(255,190,110,${0.26 * str})`);
        g2.addColorStop(1, "rgba(255,190,110,0)");
        a.fillStyle = g2;
        a.beginPath();
        a.arc(l.x, l.y, r1, 0, Math.PI * 2);
        a.fill();
      }
    }
    m.globalCompositeOperation = "source-over";
    a.globalCompositeOperation = "source-over";
    this.dirty = false;
  }

  private draw() {
    if (this.dirty) this.renderStatic();
    const ctx = this.ctx;
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.bg, 0, 0, W, H);

    this.drawKellerDoor(ctx);
    cellarDoor(ctx, 590, FK - 80, 80, this.cellarDoorV);
    this.drawScreens(ctx);
    this.drawTvButton(ctx);
    // Eingestecktes Modul sitzt in der Konsole, Luni geht davor vorbei.
    if (this.golInserted && this.golPhase !== "insert") golCartridge(ctx, 446, 167, 6, 11);
    this.drawClock(ctx);
    if (this.welt === "gruesel") this.raumFx.draw(ctx, atticCeil);
    this.drawSax(ctx);
    this.drawCigPile(ctx);
    this.drawAshtrayTray(ctx);
    // Zigarette im Aschenbecher liegt AUF der Platte: Luni geht davor vorbei
    // und verdeckt sie wie jedes andere Objekt auf dem Tisch.
    this.drawAshtrayButt(ctx);
    drawWardrobeOpen(ctx, 434, FLOOR_Y[2], this.wardrobeOpen, this.outfit !== "dressed" || this.towelOnRod);
    if (this.glassesInSink) glassesObj(ctx, SINK_DROP[0], SINK_DROP[1], 0.12, 0.45);
    this.drawBedToss(ctx);
    this.drawGlassesRest(ctx);
    drawCabinetOpen(ctx, this.cabinetOpen, this.brushInCab);
    this.drawLuniLayered(ctx);
    this.drawGlassesMoving(ctx);
    this.drawGolInHand(ctx);
    if (this.welt === "gruesel" && GRUSELRAEUME.orchester) {
      drawOrchesterEffects(ctx, this.elapsed, this.saxPhase === "play" && this.saxStarted, this.saxMusic?.currentTime ?? 0);
    }

    // Rauch liegt über allem – Luni sieht erst wieder etwas, wenn die Tür auf ist
    this.drawSmoke(ctx);
    // Abzug durch die Gartentür: Schwaden ziehen sichtbar nach draußen
    this.drawVentSmoke(ctx);

    if (this.night > 0.03) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(this.mul, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(this.add, 0, 0);
      ctx.restore();
    }


    this.drawHoverLabel(ctx);
    if (this.golFullscreen) this.drawGolFullscreen(ctx);
    if (this.dream) this.dream.draw(ctx, this.elapsed);
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

  /** 0 = auf dem Stativ, 1 = am Mund. */
  /** Weltpunkt, an dem die vordere Hand das Instrument hält. */
  /** Nächste Standposition, aus der BEIDE Griffpunkte am Stativ mit natürlicher
   *  Armlänge erreichbar sind. null = sie steht schon richtig. */
  private saxApproachX(): number | null {
    const st = STATIONS.find((s) => s.id === "saxophon");
    if (!st) return null;
    const reach = 8.2 + 8.4 - 0.6;
    const shy = FLOOR_Y[3] + -34 * LUNI_SCALE;
    for (const local of [SAX_GRIP_UP, SAX_GRIP_LOW] as const) {
      const gx = SAX_STAND_X + local[0] * SAX_SCALE * st.face;
      const gy = SAX_STAND_Y + local[1] * SAX_SCALE;
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
    const st = STATIONS.find((s) => s.id === "saxophon")!;
    const dir = st.face;
    const raw = this.saxLift();
    const e = raw * raw * (3 - 2 * raw);
    const mouthX = st.x + SAX_MOUTH_DX * LUNI_SCALE * dir;
    const mouthY = FLOOR_Y[st.floor] - 40.5 * LUNI_SCALE;
    // Leichter Bogen beim Anheben – kein gerader Flug durch den Raum.
    const arc = Math.sin(Math.PI * raw) * 3;
    const ax0 = lerp(SAX_STAND_X, mouthX, e);
    const ay0 = lerp(SAX_STAND_Y, mouthY, e) - arc;

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
    if (this.welt === "gruesel" && GRUSELRAEUME.orchester) {
      drawBoneSaxophone(c, p.ax, p.ay, SAX_SCALE, p.dir);
    } else {
      saxophone(c, p.ax, p.ay, SAX_SCALE, p.dir);
    }
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
    if (this.welt === "gruesel" && GRUSELRAEUME.orchester) {
      drawBoneSaxophone(c, p.ax, p.ay, SAX_SCALE, p.dir);
    } else {
      saxophone(c, p.ax, p.ay, SAX_SCALE, p.dir);
    }
    c.restore();
  }

  /** Beide Hände auf dem Klappenschacht – über dem Instrument und den Ärmeln. */
  private drawSaxHands(c: C, hands: { front: [number, number]; rear: [number, number] }) {
    if (!this.saxPhase) return;
    const rot = this.saxPose().rot;
    for (const h of [hands.front, hands.rear]) this.drawSaxHand(c, h, rot);
  }

  /** Hand am Griffpunkt: flache Hand auf dem Korpus, Finger über die Klappen. */
  private drawSaxHand(c: C, h: [number, number], rot = 0) {
    c.save();
    c.translate(h[0], h[1]);
    c.rotate(rot + 0.35);
    rrect(c, -4.4, -3.1, 8.8, 6.2, 3, LUNI_COLORS.skin);
    c.strokeStyle = LUNI_COLORS.skinShade;
    c.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-1.8 + i * 1.8, -3);
      c.lineTo(-1.3 + i * 1.8, 3);
      c.stroke();
    }
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

  /** Gedrehte Zigaretten und Schachtel auf dem Küchentisch */
  private drawCigPile(c: C) {
    // Schachtel liegt immer da; beim Einpacken ist der Deckel offen
    cigCase(c, 740, FLOOR_Y[1], this.pack, this.packMove || this.takeMove);
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
  private drawAshtrayTray(c: C) {
    // Direkt neben Lunis Hand: Aschenbecher bei 726, Handy bei 742.
    const x = ASH_X;
    const y = SIDE_TOP - 2;
    c.fillStyle = "#51585c";
    c.beginPath();
    c.ellipse(x, y, 7, 2.6, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#aeb7b9";
    c.beginPath();
    c.ellipse(x, y - 0.5, 5.2, 1.35, 0, 0, Math.PI * 2);
    c.fill();
    // Handy liegt auf dem Tischchen, solange sie nicht scrollt UND nicht
    // gerade dorthin unterwegs ist (dann trägt sie es in der Tasche).
    // Handy liegt daneben – es verschwindet, sobald sie es in die Hand nimmt
    if (!this.onPhone && !(this.ashMove && this.ashItem === "phone")) {
      phoneOnTable(c, PHONE_X, SIDE_TOP);
    }
  }

  /**
   * Die Zigarette im Aschenbecher – immer im Vordergrund, damit sie auch im
   * verqualmten Raum zu sehen ist.
   */
  private drawAshtrayButt(c: C) {
    if (!this.cigButt) return;
    const lit = this.burnLeft > 0;
    const x = ASH_X;
    const y = SIDE_TOP - 2;
    c.save();
    c.translate(x - 3.4, y - 2.1);
    c.rotate(-0.16);
    // ragt rechts aus der Mulde heraus, damit man sie gut erkennt
    rect(c, -5, -1.3, 11, 2.6, lit ? "#f6f0dc" : "#cfc8bb");
    rect(c, -5, -1.3, 2.6, 2.6, "#c9453a");
    if (lit) {
      const ember = 0.7 + Math.sin(this.elapsed * 3.2) * 0.2;
      disc(c, -4.2, 0, 1.3, `rgba(255,115,45,${ember})`);
      disc(c, -4.9, -0.2, 0.6, `rgba(255,222,155,${ember})`);
    }
    c.restore();
    // Rauch aus dem Aschenbecher – nur solange die Zigarette noch brennt
    if (!lit) return;
    for (let i = 0; i < 4; i++) {
      const p = (this.elapsed * 0.13 + i * 0.27) % 1;
      const alpha = (1 - p) * 0.3;
      const sx = x - 3 + Math.sin(this.elapsed * 0.7 + i * 1.9) * (1.2 + p * 2.4);
      const sy = y - 3 - p * 21;
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
      const n = 7;
      for (let i = 0; i < n; i++) {
        const ph = (this.elapsed * 0.1 + i * 0.17) % 1;
        const cx = x0 + w * (0.86 - (i / n) * 0.8) + Math.sin(this.elapsed * 0.3 + i * 1.3) * 16;
        const cy = y0 + h * (1 - ph * 0.5) + 18;
        const r = 34 + (i % 3) * 20;
        const a = spill * (0.3 + 0.18 * Math.sin(this.elapsed * 0.45 + i)) * (1 - ph * 0.35);
        if (a <= 0.004) continue;
        const g = c.createRadialGradient(cx, cy, 2, cx, cy, r);
        g.addColorStop(0, `rgba(212,220,226,${Math.min(0.8, a)})`);
        g.addColorStop(0.6, `rgba(204,213,220,${Math.min(0.55, a * 0.65)})`);
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

  /** Läuft auf dem Fernseher, während Luni spielt */
  private drawScreens(c: C) {
    // Eingestecktes Spiel bleibt auf dem Zockerzimmer-Fernseher, auch wenn
    // Luni woanders ist. Die Fläche liegt vor Luni im Zeichenablauf, also
    // hinter ihr, wenn sie vorbeigeht.
    if (this.golInserted && this.tvMode === "gol" && this.golState) {
      const x = 410, y = 137, w = 54, h = 34;
      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
      drawGridCoarse(c, this.golState, x, y, w, h);
      c.fillStyle = "rgba(0,0,0,.12)";
      for (let i = 0; i < h; i += 3) c.fillRect(x, y + i, w, 1);
      c.restore();
    }
    const st = this.activity;
    if (!st || !st.screen || this.cur) return;
    if (st.screen === "tv_d" && this.tvMode === "gol") return;
    const cozy = this.tvMode === "cozy";
    const r: Rect4 = st.screen === "tv_e"
      ? (cozy ? [435, 392, 44, 32] : [445, 395, 40, 26])
      : [410, 137, 54, 34];
    const [x, y, w, h] = r;
    const t = cozy ? this.harvestClock : this.elapsed;
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();

    if (cozy) {
      // Wohnzimmer-Kanäle: Harvest-Spiel und Musikvideo im Wechsel,
      // dazwischen kurz Umschalt-Statik wie bei einem echten Röhren-TV.
      const tt = t % TV_CYCLE;
      const inStatic = tt < TV_STATIC_LEN || (tt >= TV_RICK_AT && tt < TV_RICK_AT + TV_STATIC_LEN);
      if (inStatic) {
        this.drawTVStatic(c, x, y, w, h, Math.floor(t * 12));
      } else if (tt < TV_RICK_AT) {
      // ── HARVEST GAME ──────────────────────────────────────────────
      // Crops only change while the farmer is physically tending that plot.
      // A full year takes 4 minutes; visits and growth stay deliberately slow.
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
      // Ackerstreifen
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
        // Each plot keeps its own state while the farmer tends another plot.
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
          // Blattgrün
          c.fillStyle = ripe ? "#3f8f4f" : "#6fae5a";
          c.beginPath();
          c.ellipse(px, py - fh * 0.3 * growth, fw * 0.075 * growth + 0.5, fh * 0.2 * growth + 0.4, 0, 0, Math.PI * 2);
          c.fill();
          // Frucht
          if (growth > 0.45) {
            const fs = (fw * 0.075) * growth;
            if (col === "karotte") rect(c, px - fs * 0.35, py, fs * 0.7, fs * 1.5, "#e8722f");
            else if (col === "kuerbis") disc(c, px, py + fs * 0.5, fs * 1.1, "#e8912f");
            else if (col === "tomate") disc(c, px, py + fs * 0.4, fs * 0.85, "#d9453a");
            else disc(c, px, py + fs * 0.3, fs * 0.9, "#a8d94f");
          }
          // Erntefunken über reifem Feld
          if (ripe && tending && Math.sin(t * 1.8 + i * 2 + k) > 0.96) {
            c.fillStyle = "#ffe9a8";
            c.fillRect(px - 0.6, py - fh * 0.95, 1.2, 2.4);
          }
        }
        // Reif-Rahmen
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

      // Bäume (Herbst/Winter verfärbt)
      for (let i = 0; i < 3; i++) {
        const tx = x + w * (0.08 + i * 0.09);
        const ty = y + h * 0.47;
        rect(c, tx - 0.7, ty, 1.4, h * 0.06, "#6b4a2a");
        const leaf = season.n === "WINTER" ? "#e8f0f6" : season.n === "HERBST" ? "#d98f3c" : "#3f8f5f";
        disc(c, tx, ty - h * 0.03, h * 0.07, leaf);
      }

      // The farmer walks between plots, then spends time working at one plot.
      const from = fieldPoint(this.harvestMoving ? this.harvestFrom : this.harvestSpot);
      const to = fieldPoint(this.harvestMoving ? this.harvestTo : this.harvestSpot);
      const moveP = this.harvestMoving ? this.harvestMoveT * this.harvestMoveT * (3 - 2 * this.harvestMoveT) : 0;
      const tx = lerp(from[0], to[0], moveP);
      const ty = lerp(from[1], to[1], moveP);
      const bob = this.harvestMoving ? Math.abs(Math.sin(t * 1.3)) * 0.45 : Math.sin(t * 0.5) * 0.12;
      // Crouch while planting/harvesting at the current plot.
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
      // Korb, füllt sich mit Erntefortschritt
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
      const coins = this.harvestCoins;
      c.fillText(`${coins} G`, x + 3.2, y + h * 0.145);
      disc(c, x + w * 0.3, y + h * 0.12, 1.4, "#ffd166");
      } else {
        this.drawRickTV(c, x, y, w, h, t);
      }
      // Senderkennung oben links, Musiknote oben rechts
      c.fillStyle = "#eef7f2";
      c.font = '700 4px "Silkscreen", monospace';
      c.fillText(tt < TV_RICK_AT ? "CH1" : "CH2", x + 2, y + 5);
      c.fillStyle = "#ff5d8f";
      c.fillText("♪", x + w - 6, y + 5);

    } else if (this.tvMode === "gol" && this.golState) {
      drawGridCoarse(c, this.golState, x, y, w, h);
    } else {
      // Konsole im Dachgeschoss: dunkler Hintergrund, Level, Figuren
      const flick = 0.75 + Math.sin(t * 19) * 0.08;
      c.fillStyle = `rgba(38,28,74,${0.95 * flick})`;
      c.fillRect(x, y, w, h);
      for (let i = 0; i < 6; i++) disc(c, x + ((i * 29 + t * 26) % w), y + h * 0.22 + (i % 3) * h * 0.14, 0.8, "#c3d0ff");
      rect(c, x, y + h * 0.74, w, h * 0.26, "#3a2a5a");
      // kleine Spielfigur
      const px = x + w * 0.3 + Math.sin(t * 1.4) * w * 0.12;
      rect(c, px, y + h * 0.58, w * 0.08, h * 0.16, "#ffd166");
      rect(c, x + w * 0.66, y + h * 0.5, w * 0.1, h * 0.1, "#ff6f61");
      // Punkte
      c.fillStyle = "#eef7f2";
      c.font = '700 4px "Silkscreen", monospace';
      c.fillText("LV 3", x + 2.5, y + h * 0.14);
    }
    // Scanlines
    c.fillStyle = "rgba(0,0,0,.12)";
    for (let i = 0; i < h; i += 3) c.fillRect(x, y + i, w, 1);
    c.restore();
  }

  private onKey = (e: KeyboardEvent) => {
    if (this.dream) {
      if (this.dream.onKey(e.code)) {
        e.preventDefault();
        return;
      }
    }
    if (e.code === "Escape" && this.golFullscreen) this.golFullscreen = false;
  };

  /** Versteckter Tab hält Traum und Saxophon an. */
  private onPageHide = () => this.speichern();

  private onVisibility = () => {
    if (document.visibilityState === "hidden") {
      this.speichern();
      if (this.dream && !this.dream.paused) this.dream.pause();
      if (this.saxPhase === "play" && this.saxStarted && this.saxMusic) {
        this.saxPausedAt = this.saxMusic.pause();
        this.saxStarted = false;
      }
    } else if (this.saxPausedAt !== null && this.saxPhase === "play" && this.saxMusic) {
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
  };

  /** Bildfläche des Fernsehers im Zockerzimmer. */
  private hitAtticTv(x: number, y: number) {
    return x >= 410 && x <= 464 && y >= 137 && y <= 171;
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

  /** Klick auf den Fernseher: aufstehen, Knopf drücken, Bild groß, wieder setzen. */
  private startTvZoom() {
    if (
      this.golPhase === "insert" ||
      this.golPhase === "press" ||
      this.golPhase === "reach" ||
      this.golPhase === "carry" ||
      this.golPhase === "rise" ||
      this.golPhase === "toButton" ||
      this.golPhase === "back"
    ) return;
    if (this.golFullscreen) return;
    this.golAnimT = 0;
    const sitting = this.activity?.id === "gaming" && !this.cur && this.path.length === 0;
    if (sitting) {
      this.golPhase = "rise";
      return;
    }
    this.golPhase = "toButton";
    this.goTo(this.golTvStand());
  }

  /* ------------------------------ Duschen -------------------------------- */

  private shStation(phase: ShPhase): Station {
    const st = SH_STAND[phase];
    return { id: `sh_${phase}`, label: "", floor: 2, x: st.x, face: st.face, state: "idle", expr: "happy", hits: [] };
  }

  private startSh(phase: ShPhase) {
    // Ohne Brille (weder auf der Nase noch in der Hand) gibt es nichts zu werfen.
    if (!this.glassesOn && !this.glassesInHand && (phase === "toSink" || phase === "glassesOff" || phase === "tossGlasses")) {
      phase = "toShower";
    }
    this.shPhase = phase;
    this.shT = 0;
    if (SH_STAND[phase]) this.goTo(this.shStation(phase));
    if (phase === "stepOut") this.wet = 1;
  }

  private nextSh() {
    const p = this.shPhase;
    if (!p) return;
    const seq = (ALL_SEQS.find((q) => q.includes(p)) ?? []) as readonly ShPhase[];
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
  }

  private updateShower(dt: number) {
    if (this.bedTimePending && this.sick < 0.35 && this.night < 0.45) this.bedTimePending = false;
    if (this.asleep) {
      this.sleepT += dt;
      if (this.dreamCool > 0) this.dreamCool = Math.max(0, this.dreamCool - dt);
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
    const dur = SH_DUR[ph];
    if (dur === undefined) {
      // Laufschritt: endet, sobald sie am Ziel steht
      const arrived = !this.cur && this.path.length === 0 && !this.pending;
      if (arrived && this.activity?.id === `sh_${ph}`) this.nextSh();
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

  /** Abendroutine: umziehen, aufs Bett setzen, Brille werfen. */
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
        if (p >= 0.3) this.outfit = "towel";
        break;
      case "bedBottom":
        if (p >= 0.55) this.outfit = "none";
        break;
      case "bedPants":
        if (p >= 0.4) this.outfit = "towel";
        break;
      case "bedPajama":
        if (p >= 0.75) this.outfit = "dressed";
        break;
      case "bedToss":
        // Der Wurf beginnt genau einmal; danach gehört die Zeitachse dem Flug.
        if (!this.bedPhase) {
          this.beginBedToss();
          this.shPhase = null;
          this.shT = 0;
        }
        return;
    }
    if (p >= 1) {
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
        return { state: "wrap", face: 1, phase: 1 - p, back: false };
      case "throwTowel":
      case "takeTowel":
        return { state: "throw", face: 1, phase: p, back: false };
      case "wrapOn":
        return { state: "wrap", face: 1, phase: p, back: false };
      case "closeCurtain":
        return { state: "act", face: 1, phase: 0, back: false };
      case "openCurtain":
      case "waterOn":
      case "waterOff":
        return { state: "act", face: -1, phase: 0, back: false };
      case "gPick":
        return { state: "glassesOn", face: 1, phase: p, back: false };
      case "bedOpen":
      case "bedClose":
        return { state: "act", face: 1, phase: p, back: false };
      case "bedTop":
      case "bedPants":
        return { state: "undress", face: 1, phase: p, back: true };
      case "bedBottom":
        return { state: "undress", face: 1, phase: p, back: true };
      case "bedPajama":
        return { state: "wrap", face: 1, phase: p, back: true };
      case "bedSit":
        return { state: "sleepBend", face: -1, phase: 1, back: false };
      case "cOpen":
      case "kClose":
      case "bTake":
      case "bPut":
        return { state: "reachUp", face: 1, phase: p, back: false };
      case "bBend":
        return { state: "bend", face: 1, phase: p, back: false };
      case "bBrush":
        return { state: "brush", face: 1, phase: 1, back: false };
      case "bUp":
        return { state: "bend", face: 1, phase: 1 - p, back: false };
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
  private drawLuniLayered(c: C) {
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
    // Nutzeraktion Bettklick: Audio für den später automatischen Traum freigeben.
    sfx.ensure();
    this.glassesRest = null;
    this.chain = [];
    this.smokeRequested = false;
    this.bedTimePending = false;
    if (!this.pyjama) this.makePajama();
    this.startSh("bToWardrobe");
  }

  private beginBedToss() {
    // Brille vom Bett aus hochwerfen. 20 %: bleibt an Gardinenstange, Lampe
    // oder Schrank hängen; 40 %: Nachttisch; sonst: Bett oder Boden.
    const r = Math.random();
    this.tossLand = r < 0.4 ? 0 : r < 0.6 ? 1 + Math.floor(Math.random() * 3) : Math.random() < 0.5 ? 4 : 5;
    this.tossUp = 0;
    this.tossLanded = false;
    this.bedPhase = "toss";
    this.glassesOn = false;
    this.glassesInHand = true;
    sfx.ui();
  }

  /** Landeplätze: 0 Nachttisch, 1 Gardinenstange, 2 Lampe, 3 Schrank, 4 Bett, 5 Boden */
  private tossTarget(): Pt {
    switch (this.tossLand) {
      case 1:
        return [352, 226];
      case 2:
        return [348, 216];
      case 3:
        return [470, 246];
      case 4:
        return [340, 286];
      case 5:
        return [392, FLOOR_Y[2] + 2];
      default:
        return [404, FLOOR_Y[2] - 40];
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
        this.glassesRest = { x: tx, y: ty, rot, scale: sc };
        sfx.ui();
      }
      void tx;
      void ty;
      return;
    }
    if (this.tossLanded && this.bedPhase === "toss") {
      // Nach dem Landen: hinsetzen, zudecken, Hand unter das Ohr.
      this.bedPhase = null;
      this.pending = null;
      this.activity = null;
      this.target = null;
      this.cur = null;
      this.path = [];
      // Erst sichtbar hinlegen, dann schlafen.
      this.lieDown = true;
      this.lieT = 0;
      this.dirty = true;
    }
  }

  /** Brille im Flug vom Bett: hoher Bogen, drehend. */
  /** Abgelegte Brille bleibt exakt am Ablageort liegen. */
  private drawGlassesRest(c: C) {
    const g = this.glassesRest;
    if (!g) return;
    glassesObj(c, g.x, g.y, g.rot, g.scale);
  }

  private drawBedToss(c: C) {
    if (this.bedPhase !== "toss") return;
    const T = 1.25;
    const u = this.tossLanded ? 1 : clamp(this.tossUp / T, 0, 1);
    const [x1, y1] = this.tossTarget();
    const x0 = 340;
    const y0 = 306;
    const hgt = 70;
    const x = lerp(x0, x1, u);
    const y = lerp(y0, y1, u) - 4 * hgt * u * (1 - u);
    if (u < 1) glassesObj(c, x, y, u * Math.PI * 5, lerp(1, 0.4, u * u));
    else if (this.tossLand === 0) glassesObj(c, x1, y1, 0.1, 0.45);
    else if (this.tossLand === 4 || this.tossLand === 5) glassesObj(c, x1, y1, 0.6, 0.8);
    else glassesObj(c, x1, y1, 1.35, 0.35);
  }

  private startDream() {
    if (this.dream) return;
    this.dream = new Dream({
      audioOk: () => sfx.ensure(),
      // Einmal an die tatsächlich gezeichnete Schlafpose gebunden.
      sleepAnchor: () => [336, FLOOR_Y[2] - 57],
      onEnd: () => this.finishDream(false),
      onWake: () => this.finishDream(true),
    });
    sfx.ensure();
  }

  /** Traum vorbei: Luni bleibt schlafen oder wacht auf. */
  private finishDream(wake: boolean) {
    this.dream?.destroy();
    this.dream = null;
    if (wake) {
      this.glassesOn = true;
      this.glassesRest = null;
      this.asleep = false;
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
    } else {
      this.asleep = true;
      this.sleepT = 0;
      // Kein Endlos-Loop: erst eine bewusste Aktion startet den Traum erneut.
      this.sleepRest = 1e9;
    }
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

  private updateDream(dt: number) {
    if (this.wakeT > 0) this.wakeT = Math.max(0, this.wakeT - dt);
    if (!this.dream) return;
    this.dream.update(dt);
  }

  /** Optionaler Neustart: Klick auf das Bett, während sie schläft. */
  replayDream() {
    if (this.dream) return;
    this.sleepRest = 0;
    this.sleepT = 99;
    this.startDream();
  }

  /** Traum von außen starten (Tests, später ggf. Menü). */
  startDreamNow() {
    this.asleep = true;
    this.startDream();
  }

  /** Ist gerade ein Traum zu sehen? */
  get dreaming() {
    return this.dream !== null;
  }

  private updateBedState(dt: number) {
    if (this.sleepRest > 0) this.sleepRest = Math.max(0, this.sleepRest - dt);
    // Wer tagsüber ins Bett geschickt wird, schläft abends trotzdem ein:
    // das Bett ist nachts der einzige Schlafplatz.
    if (!this.asleep && this.activity?.id === "bett" && !this.bedPhase && !this.shPhase) {
      const hour = this.clock.hour + this.clock.min / 60;
      if ((hour >= 20 || hour < 6 || this.sick > 0.35) && !this.cur && this.path.length === 0) {
        this.asleep = true;
        this.sleepT = 0;
        this.outfit = "dressed";
        if (!this.pyjama) this.makePajama();
        this.glassesOn = false;
        this.dirty = true;
      }
    }
    if (this.lieDown) {
      this.lieT += dt;
      if (this.lieT >= 1.4) {
        this.lieDown = false;
        this.sleepPhase = "grab";
        this.sleepPhaseT = 0;
      }
      return;
    }

    // Zudecken und Zurechtlegen. Erst wenn die Decke am Kinn sitzt und sie auf
    // der Seite liegt, gilt sie als eingeschlafen (und der Traum darf starten).
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
    // Nach 5 Sekunden Schlaf beginnt der Traum – einmal pro Schlafphase.
    if (this.sleepT > 5 && this.sleepRest <= 0 && !this.dream && this.shPhase === null) {
      this.startDream();
    }
  }

  /** Brille in der Hand (über dem Gesicht) oder im hohen Bogen ins Becken. */
  private drawGlassesMoving(c: C) {
    if (this.brushInHand) {
      const bent = this.shPhase === "bBrush" || this.shPhase === "bBend" || this.shPhase === "bUp";
      brushObj(c, this.hand[0], this.hand[1], bent ? 0 : -0.7, this.lface);
    }
    if (this.glassesInHand) {
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
        this.golFullscreen = true;
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
    if (this.golInserted || this.golOnShelf) return;
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
  private drawGolFullscreen(c: C) {
    rect(c, 0, 0, W, H, "#061018");
    if (!this.golState) return;
    const g = this.golState;
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
    c.strokeStyle = "#24333a";
    c.lineWidth = 2;
    c.strokeRect(GOL_X - 1, GOL_Y - 1, GOL_VIEW_W + 2, GOL_VIEW_H + 2);

    c.fillStyle = "rgba(6,16,24,.78)";
    c.fillRect(GOL_X + 8, GOL_Y + 8, 178, 18);
    c.fillStyle = "#f2f7f4";
    c.font = '700 10px "Silkscreen", monospace';
    c.textAlign = "left";
    c.fillText(`Gen ${g.generation}`, GOL_X + 12, GOL_Y + 20);

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

    const ry = GOL_BTN.y + GOL_BTN.h + 30;
    c.fillStyle = "#8fa8a0";
    c.font = '700 10px "Silkscreen", monospace';
    c.fillText("REGELN", GOL_X, ry);
    c.fillStyle = "#dfe9e4";
    c.font = '600 11px "Silkscreen", monospace';
    GOL_RULES.forEach((rule, i) => c.fillText(rule, GOL_X, ry + 18 + i * 16));
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

  private onGolFullscreenClick(x: number, y: number) {
    const b = GOL_BTN;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      this.golFullscreen = false;
      return;
    }
    const ctrl = golCtrlAt(x, y);
    if (ctrl) {
      this.applyGolCtrl(ctrl);
      return;
    }
    if (!this.golState) return;
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
    if (this.alpha <= 0.01) return;
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
      // Mit Zigarette in der Hand raucht sie wirklich: Arm zum Mund,
      // Zug, Ausatmen – nicht die stille Sitzpose.
      if (st.id === "raucherstuhl" && (this.smoking || this.holding) && !this.onPhone) {
        state = "smoke";
        expr = "happy";
      }
    }

    // Pose-Phase für Aschenbecher, Handy und Einpacken
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
    } else if (this.ashMove && !this.ashWalking) {
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
      const p = clamp(this.ashT / 0.95, 0, 1);
      posePhase = this.ashMove === "put" ? p : 1 - p;
    } else if (this.onPhone && !a && !this.ashMove) {
      // Handy-Pause auf dem Stuhl – nur solange sie wirklich dort sitzt
      const seat = STATIONS.find((s) => s.id === "raucherstuhl");
      if (seat) {
        st = seat;
        x = seat.x;
        y = FLOOR_Y[seat.floor];
        yOff = seat.yOff ?? 0;
        face = seat.face;
      }
      state = this.phoneMode === "call" ? "call" : "phone";
      expr =
        this.phoneReact === "laugh" ? "grin" : this.phoneReact === "shake" ? "annoyed" : this.phoneMode === "call" ? "neutral" : "focus";
      posePhase = this.phoneReact === "shake" ? 1 : 0;
    } else if (this.packMove || this.takeMove) {
      // Am Küchentisch: einpacken bzw. eine Zigarette mitnehmen
      state = "pack";
      expr = "focus";
      posePhase = this.packMove
        ? clamp(this.packT / 1.1, 0, 1)
        : clamp(this.takeT / 0.9, 0, 1);
    }

    let back = false;
    let hairAside = 0;
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
        glasses: true,
      });
      this.hand[0] = wh[0];
      this.hand[1] = wh[1];
      return;
    }
    if (this.lieDown && !this.asleep) {
      // Sie legt sich hin: aus dem Sitzen in die Seitenlage, Decke folgt.
      const p = clamp(this.lieT / 1.4, 0, 1);
      const e = p * p * (3 - 2 * p);
      c.save();
      this.lastPose = "lie";
      const wh = drawLuni(c, 330, FLOOR_Y[2] - 10 * (1 - e), {
        t: this.elapsed,
        face: 1,
        state: "lie",
        expr: "sleep",
        phase: e,
        blink: 1,
        scale: LUNI_SCALE,
        shadow: false,
        glasses: false,
      });
      this.hand[0] = wh[0];
      this.hand[1] = wh[1];
      c.restore();
      drawBlanket(c, this.elapsed, e);
      return;
    }
    if (this.sleepPhase || this.asleep) {
      // Schlafszene: Kissen -> Hand -> Haare -> Kopf, Decke bis zum Kinn.
      st = STATIONS.find((sn) => sn.id === "bett") ?? null;
      x = 330;
      y = FLOOR_Y[2];
      yOff = -20;
      state = "lie";
      expr = "sleep";
      face = 1;
      const pr = this.sleepProgress();
      hairAside = pr.hair;
      this.lastPose = "sleep";
      drawBedScene(c, x, y + yOff, this.elapsed, this.pyjama, pr);
      if (this.asleep && !this.dream && this.sleepRest > 0) drawSleepZ(c, x + 6, y - 44, this.sleepT);
      return;
    }
    const shp = this.showerPose();
    if (shp && !a) {
      state = shp.state;
      face = shp.face;
      posePhase = shp.phase;
      back = shp.back;
      expr = state === "wash" && shp.phase > 2 ? "sleep" : "happy";
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

    c.save();
    if (clip) {
      c.beginPath();
      c.rect(CEL_X0, FE + SLAB, HR - CEL_X0, FK - FE - SLAB);
      c.clip();
    }
    const hiddenInWc =
      this.wcInside && st?.id === "wctuer" && this.wcOpen < 0.55;
    c.globalAlpha = hiddenInWc ? 0 : this.alpha;
    this.lastPose = state;
    // Wird von drawLuni gefüllt: beide Handpositionen in Weltkoordinaten.
    const saxHands = { front: [0, 0] as [number, number], rear: [0, 0] as [number, number] };
    const hand = drawLuni(c, x, y + yOff, {
      t: this.elapsed,
      face,
      state,
      expr,
      walk: this.walkP,
      phase: posePhase,
      blink: this.blink > 0 ? 1 : 0,
      scale: LUNI_SCALE,
      shadow: !onStair && yOff === 0,
      // Husten setzt ab mittlerer Übelkeit ein
      cough: this.sick > 0.3 ? clamp((this.sick - 0.3) / 0.4, 0, 1) : 0,
      sick: this.sick,
      outfit: this.outfit,
      back,
      wet: this.wet,
      glasses: this.glassesOn,
      pajama: this.outfit === "dressed" ? this.pyjama : null,
      hairAside,
      footTap: saxFootTap,
      sway: saxSway,
      handTarget: saxHand,
      handTarget2: saxHand2,
      handOut: saxHands,
      betweenBodyAndArms: this.saxPhase ? () => this.drawSaxCarried(c) : null,
      armsInFront: !!this.saxPhase,
    });
    this.hand[0] = hand[0];
    this.hand[1] = hand[1];
    // Hustenstöße: kleine Wolken vor dem Mund
    if (this.sick > 0.3) {
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
    } else if (this.ashMove && !this.ashWalking && this.ashItem === "cig") {
      const inHand = this.ashMove === "put" ? posePhase < 0.8 : posePhase < 0.75;
      if (inHand) cigarette(c, hand[0], hand[1], face, 0.6);
    } else if (this.ashMove && !this.ashWalking && this.ashItem === "phone") {
      // Handy wandert zwischen Tisch und Hand – beide Punkte bleiben sichtbar
      const t = this.ashMove === "take" ? posePhase : 1 - posePhase;
      const px = lerp(PHONE_X, hand[0], t);
      const py = lerp(SIDE_TOP, hand[1] - 1, t);
      phoneOnTable(c, px, py);
    } else if (this.holding && st?.id !== "raucherstuhl") {
      cigarette(c, hand[0], hand[1], face, 0.4);
    }
    // Beide Hände liegen auf dem Klappenschacht – sie werden über das
    // Instrument gesetzt, sonst verschwinden sie hinter dem Korpus.
    this.drawSaxHands(c, saxHands);
    if (this.onPhone && !this.standing && !this.ashMove && !a) {
      c.save();
      c.translate(hand[0], hand[1] - 1);
      if (this.phoneMode === "call") {
        // Telefon am Ohr: schmale Kante neben dem Kopf, kein Bildschirm
        c.rotate(-0.12);
        rrect(c, -2.2, -5.8, 4.4, 11.6, 1.2, "#1b1e26");
        rect(c, -1.5, -4.9, 3, 2.2, "#3b4350");
        rect(c, -1.5, 2.8, 3, 0.8, "#3b4350");
        // kleine Sprechwellen
        for (let i = 0; i < 2; i++) {
          const p = (this.elapsed * 0.9 + i * 0.5) % 1;
          c.strokeStyle = `rgba(170,205,235,${(1 - p) * 0.5})`;
          c.lineWidth = 0.8;
          c.beginPath();
          c.arc(3.6, 0, 2 + p * 6, -0.9, 0.9);
          c.stroke();
        }
      } else {
        // Scrollen: Bildschirm leuchtet, Zeilen wandern
        c.rotate(-0.3);
        rrect(c, -3.4, -5.4, 6.8, 10.8, 1.4, "#1b1e26");
        rect(c, -2.5, -4.6, 5, 9.2, "#8fcbff");
        c.fillStyle = "rgba(30,60,96,.5)";
        for (let i = 0; i < 3; i++) {
          const ly = -3.8 + ((i * 3 + this.elapsed * 4) % 8.4);
          c.fillRect(-2, ly, 4, 1);
        }
      }
      c.restore();
      const gl = c.createRadialGradient(hand[0], hand[1] - 4, 1, hand[0], hand[1] - 4, 16);
      gl.addColorStop(0, "rgba(150,205,255,.26)");
      gl.addColorStop(1, "rgba(150,205,255,0)");
      c.fillStyle = gl;
      c.beginPath();
      c.arc(hand[0], hand[1] - 4, 16, 0, Math.PI * 2);
      c.fill();
    }
    if (st?.id === "raucherstuhl" && (this.smoking || this.holding)) {
      const { lift, puff } = smokeCycle(this.elapsed);
      cigarette(c, hand[0], hand[1], face, 0.2 + lift);
      // Rauchfahne von der Spitze (beim Ziehen glimmt sie stärker)
      for (let i = 0; i < 4; i++) {
        const ph = (this.elapsed * 0.42 + i * 0.24) % 1;
        const a = (1 - ph) * (0.42 + lift * 0.25);
        if (a <= 0) continue;
        c.fillStyle = `rgba(224,231,238,${a})`;
        c.beginPath();
        c.arc(
          hand[0] + face * (10 + ph * 16) + Math.sin(this.elapsed * 1.6 + i) * 4,
          hand[1] - 2 - ph * 26,
          1.6 + ph * 4.2,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      // Ausatmen: ein zarter Hauch vor dem Mund, gerade eben sichtbar
      if (puff > 0.05) {
        const mx = x + face * 2 * LUNI_SCALE;
        const my = y + yOff - 41 * LUNI_SCALE;
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
    if (st?.prop) drawProp(c, st.prop, hand[0], hand[1], face);
    if (st?.blanket) {
      const bx = st.x - 8;
      rrect(c, bx, FO - 36, 392 - bx, 22, 7, "#3f7f8c");
      rect(c, bx + 3, FO - 30, 392 - bx - 8, 2, "rgba(255,255,255,.35)");
    }
    if (st?.zzz) drawZzz(c, x - 22, y - 58, this.elapsed, 1);
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
