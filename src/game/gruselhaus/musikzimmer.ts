import type { Station } from "../house";
import { klavierHaende, type MusikzimmerAblauf } from "./musikzimmer-ablauf";

type C = CanvasRenderingContext2D;
type Pt = [number, number];

export const MUSIKZIMMER = {
  links: 534,
  rechts: 830,
  boden: 200,
  // Symmetrische Achse durch das Klavier; die Verbindungstuere liegt in der Trennwand.
  klavier: {
    x: 601,
    y: 112,
    w: 84,
    sitz: 643,
    tastenX: 608,
    tastenY: 166,
    tastenW: 70,
  },
  // Blaue Verbindungstuere: exakt die Geometrie der Schleusentuere.
  tuer: { x: 528, y: 120, w: 16, h: 80, spur: 528 },
  /** Gemeinsame Oberkante: Tuerrahmen, Vorhangstangen, Wandlampen. */
  alignTop: 115,
  /** Zwei Samtvorhaenge, symmetrisch zum Klavier (Mitte 643 +- 80). */
  vorhaenge: [
    { x: 541, w: 44, stand: 563 },
    { x: 701, w: 44, stand: 723 },
  ],
  lampen: [595, 691],
} as const;

/** Stationen des Gruselhauses: nur Kopien aendern, nie die gemeinsame Liste. */
export function musikzimmerStationen(stations: readonly Station[]): Station[] {
  const changes: Record<string, Partial<Station>> = {
    klavier: {
      x: MUSIKZIMMER.klavier.sitz,
      face: 1,
      yOff: 0,
      hits: [
        [601, 112, 84, 88],
        [626, 176, 34, 24],
      ],
    },
  };
  return [
    ...stations.map((st) => (changes[st.id] ? { ...st, ...changes[st.id] } : st)),
    {
      id: "musiktuer",
      label: "Verbindungstür",
      floor: 3,
      x: MUSIKZIMMER.tuer.spur,
      face: -1,
      state: "idle",
      expr: "neutral",
      hits: [[MUSIKZIMMER.tuer.x - 12, MUSIKZIMMER.tuer.y - 6, 40, MUSIKZIMMER.tuer.h + 6]],
    },
    ...MUSIKZIMMER.vorhaenge.map((v, i): Station => ({
      id: i === 0 ? "vorhang_links" : "vorhang_rechts",
      label: i === 0 ? "Vorhang links" : "Vorhang rechts",
      floor: 3,
      x: v.stand,
      face: 1,
      state: "act",
      expr: "focus",
      hits: [[v.x - 2, MUSIKZIMMER.alignTop - 4, v.w + 4, 62]],
    })),
  ];
}

/** Griffpunkt, zu dem Luni greift, wenn sie einen Vorhang zieht (Weltkoordinaten). */
export function vorhangGriff(i: 0 | 1, geschlossen: number): [number, number] {
  const v = MUSIKZIMMER.vorhaenge[i];
  const halbe = 7 + (22 - 7) * geschlossen;
  return [v.x + halbe, MUSIKZIMMER.alignTop + 31];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const COL = {
  wood: "#493326",
  seam: "#291D19",
  light: "#765039",
  shadow: "#201714",
  piano: "#38251D",
  recess: "#211713",
  gold: "#a58350",
  goldLight: "#d4b47a",
};

function rect(c: C, x: number, y: number, w: number, h: number, f: string) {
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
}
function line(c: C, x: number, y: number, xx: number, yy: number, f: string, width = 1) {
  c.strokeStyle = f;
  c.lineWidth = width;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.stroke();
}
function poly(c: C, points: Pt[], f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fill();
}
function disc(c: C, x: number, y: number, r: number, f: string) {
  ellipse(c, x, y, r, r, f);
}
function ellipse(c: C, x: number, y: number, rx: number, ry: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
function round(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function grain(c: C, x: number, y: number, w: number, h: number, seed = 0) {
  c.strokeStyle = "rgba(24,14,9,.26)";
  c.lineWidth = 0.6;
  c.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const xx = x + w * (0.18 + i * 0.27);
    const yy = y + 6 + ((seed * 7 + i * 13) % Math.max(8, h - 18));
    c.beginPath();
    c.moveTo(xx, yy);
    c.bezierCurveTo(xx - 2, yy + 5, xx + 2.6, yy + 12, xx + 0.5, Math.min(y + h - 2, yy + 23));
    c.stroke();
  }
}

export function clipMusikzimmer(c: C, atticCeil: (x: number) => number) {
  c.beginPath();
  c.moveTo(534, 200);
  c.lineTo(534, atticCeil(534));
  c.lineTo(830, atticCeil(830));
  c.lineTo(830, 200);
  c.closePath();
  c.clip();
}

/* ---------------------------------- Tueren --------------------------------- */

function drawRueckwandTuer(c: C) {
  // Rechte gruene Tuer an der Hinterwand: Standardbreite 46, Hoehe angepasst.
  const x = 771;
  const w = 46;
  const top = MUSIKZIMMER.alignTop + 4;
  const bottom = 185;
  rect(c, x - 4, top - 4, w + 8, bottom - top + 4, "#352820");
  rect(c, x - 3, top - 3, w + 6, 2, "#75553a");
  rect(c, x - 2, top - 1, w + 4, bottom - top + 1, "#1b1a15");
  rect(c, x, top, w, bottom - top, "#526442");
  for (const [y, h] of [
    [top + 8, 28],
    [top + 43, bottom - top - 51],
  ]) {
    rect(c, x + 5, y, w - 10, h, "#35452F");
    rect(c, x + 7, y + 2, w - 14, h - 4, "#526442");
    line(c, x + 6, y + h, x + w - 6, y + h, "#79866a", 0.7);
  }
  round(c, x + 6, top + 40, 2.8, 8, 1, "#262822");
  ellipse(c, x + 7, top + 43, 2, 1.7, "#101a17");
  ellipse(c, x + 6.5, top + 42.4, 0.6, 0.4, "#8a8d72");
  for (let i = 0; i < 5; i++) {
    line(c, x + 5 + ((i * 9) % (w - 8)), top + 12 + i * 11, x + 6 + ((i * 9) % (w - 8)), top + 17 + i * 11, "rgba(180,169,127,.2)", 0.6);
  }
  rect(c, x - 3, 185, w + 6, 1.2, "rgba(0,0,0,.45)");
}

/**
 * Blaue Verbindungstuere zwischen Gaming-Ecke und Musikzimmer.
 * Aufbau, Rahmen, Blattbreiten, Knauf und Schwelle sind Zeile fuer Zeile die
 * der Schleusentuere aus house.ts; einziger Unterschied ist der blaue Anstrich.
 * `open` 0..1 wird wie dort weich aufgeschwungen.
 */
export function drawMusiktuer(c: C, open: number) {
  const x = MUSIKZIMMER.tuer.x;
  const topY = MUSIKZIMMER.tuer.y;
  const h = MUSIKZIMMER.tuer.h;
  const closedW = 9;
  const openW = 34;
  // Durchgang / Laibung
  rect(c, x - closedW / 2, topY, closedW, h, "#0d1418");
  // Rahmen in gedaempftem Holzton – wie die Schleusentuere
  rect(c, x - 8, topY - 5, 16, 5, "#6f5c49");
  rect(c, x - 8, topY - 5, 16, 1.2, "rgba(255,255,255,.12)");
  rect(c, x - 8, topY, 2.4, h, "#5e4e3f");
  rect(c, x - 8, topY, 1, h, "rgba(255,255,255,.10)");
  rect(c, x + 5.6, topY, 2.4, h, "#5e4e3f");
  rect(c, x + 7, topY, 1, h, "rgba(0,0,0,.30)");
  const hingeX = x - closedW / 2;
  // Das Blatt: geschlossen in der Wand, offen steht es im Musikzimmer. Nur die Farbe ist blau.
  const w = lerp(closedW, openW, Math.sin((open * Math.PI) / 2));
  if (open < 0.02) {
    rect(c, hingeX, topY + 1, closedW, h - 2, "#285B65");
    rect(c, hingeX, topY + 1, closedW, 1.6, "rgba(255,255,255,.22)");
    rect(c, hingeX + closedW - 2, topY + 1, 1.4, h - 2, "#183D46");
    disc(c, hingeX + closedW - 3, topY + h * 0.52, 1.3, "#e6c36a");
  } else {
    // offen: Blatt ragt nach rechts, mit Fuellungen und Knauf
    rect(c, hingeX, topY + 1, w, h - 2, "#2f6570");
    rect(c, hingeX, topY + 1, Math.max(1.4, w * 0.05), h - 2, "#183D46");
    if (w > 18) {
      rect(c, hingeX + w * 0.16, topY + 9, w * 0.66, h * 0.3, "#285B65");
      rect(c, hingeX + w * 0.16, topY + h * 0.5, w * 0.66, h * 0.36, "#285B65");
      disc(c, hingeX + w - 5, topY + h * 0.52, 1.6, "#e6c36a");
    }
    // Schattenwurf im Durchgang
    c.fillStyle = "rgba(0,0,0,.3)";
    c.fillRect(hingeX, topY + 1, 3, h - 2);
  }
  // Schwelle im Holzton
  rect(c, x - 9, topY + h, 18, 3, "#5d4a38");
  rect(c, x - 9, topY + h, 18, 1, "rgba(0,0,0,.3)");
}

/* --------------------------------- Klavier --------------------------------- */

function drawKeys(c: C, time: number) {
  const p = MUSIKZIMMER.klavier;
  const fingers = time < 0 ? [] : klavierHaende(time);
  const width = p.tastenW / 24;
  for (let i = 0; i < 24; i++) {
    const x = p.tastenX + i * width;
    const pressed = fingers.some((h) => Math.abs(p.sitz + h.x - (x + width / 2)) < width / 2 && h.press > 0.25);
    rect(c, x + 0.16, p.tastenY + (pressed ? 0.8 : 0), width - 0.3, 6.5 - (pressed ? 0.8 : 0), pressed ? "#ad9e7e" : i % 5 ? "#D6C9AB" : "#c9ba99");
    rect(c, x + 0.16, p.tastenY + 6.5, width - 0.3, 0.8, "#928161");
  }
  for (let i = 0; i < 23; i++) {
    if ([2, 6].includes(i % 7)) continue;
    const x = p.tastenX + (i + 1) * width - 0.8;
    rect(c, x, p.tastenY - 0.9, 1.65, 4.7, "#171412");
    rect(c, x + 0.2, p.tastenY - 0.9, 0.6, 3, "#41382c");
  }
}

function drawPiano(c: C) {
  const p = MUSIKZIMMER.klavier;
  const { x, y, w } = p;
  ellipse(c, p.sitz, 198, 49, 2, "rgba(16,10,7,.42)");
  rect(c, x + 2, y + 4, w - 4, 81, COL.piano);
  const finish = c.createLinearGradient(x, y, x + w, y + 65);
  finish.addColorStop(0, "#765038");
  finish.addColorStop(0.36, "#483024");
  finish.addColorStop(0.7, "#67452f");
  finish.addColorStop(1, "#38251D");
  c.fillStyle = finish;
  c.fillRect(x + 4, y + 7, w - 8, 42);
  rect(c, x - 1, y, w + 2, 4, "#2c2018");
  rect(c, x - 1, y, w + 2, 0.9, "#94704b");
  rect(c, x, y + 5, w, 2, "#845b3d");
  for (const xx of [x + 6, x + 45]) {
    rect(c, xx, y + 11, 31, 28, COL.recess);
    rect(c, xx + 1.3, y + 12.2, 28.4, 25.5, "#5b3b29");
    grain(c, xx + 2, y + 12, 28, 25, xx);
    c.strokeStyle = "#a47b48";
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(xx + 4, y + 19);
    c.quadraticCurveTo(xx + 15, y + 29, xx + 27, y + 19);
    c.stroke();
    for (let i = 0; i < 4; i++) line(c, xx + 7 + i * 5, y + 20, xx + 9 + i * 4, y + 26, "#9a7148", 0.6);
  }
  rect(c, x + 3, y + 43, w - 6, 4, "#211713");
  rect(c, x + 3, y + 43, w - 6, 0.9, "#997044");
  const mx = x + w / 2 - 15;
  poly(c, [[mx - 4, 158], [mx, 143], [mx + 26, 143], [mx + 30, 158]], "#281b14");
  for (let i = 0; i < 6; i++) line(c, mx + 2 + i * 4, 146, mx + i * 5, 155, "#70513a", 0.8);
  rect(c, mx - 6, 158, 39, 2, "#8b6341");
  rect(c, x - 2, 163, w + 4, 11, "#211713");
  drawKeys(c, -1);
  rect(c, x - 2, 174, w + 4, 3, "#6c4930");
  line(c, x - 2, 174, x + w + 2, 174, "#9b7650", 0.8);
  rect(c, x + 9, 180, w - 18, 13, "#251b15");
  rect(c, x + 11, 181, w - 22, 10, "#493124");
  for (const xx of [x + 2, x + w - 7]) {
    rect(c, xx, y + 7, 5, 82, "#38251D");
    rect(c, xx + 1, y + 8, 1, 76, "#815a3b");
    round(c, xx - 1, 192, 7, 7, 1, "#291d17");
  }
  for (const xx of [p.sitz - 6, p.sitz, p.sitz + 6]) {
    line(c, xx, 188, xx - 1.2, 196, "#8b7447", 1.1);
    ellipse(c, xx - 1.5, 196.4, 2, 0.9, "#b79a60");
  }
  for (const [xx, yy, length] of [
    [x + 11, y + 5, 8],
    [x + w - 19, y + 47, 6],
    [x + 11, y + 70, 3],
    [x + 56, y + 17, 4],
  ])
    line(c, xx, yy, xx + length, yy + 0.6, "rgba(194,159,110,.28)", 0.5);
}

function drawStool(c: C) {
  const x = MUSIKZIMMER.klavier.sitz;
  ellipse(c, x, 199, 18, 1.2, "rgba(12,9,8,.45)");
  for (const dx of [-11, -8, 8, 11]) line(c, x + dx, 190, x + dx + Math.sign(dx), 199.5, dx % 2 ? "#3b2a1f" : "#221a15", 2.3);
  line(c, x - 10, 196, x + 10, 196, "#443122", 1);
  round(c, x - 14, 188.5, 28, 4, 1.2, "#30231c");
  rect(c, x - 13, 188.5, 26, 0.8, "#8a6a49");
  line(c, x - 12, 189.4, x - 7, 189.1, "#aa8760", 0.5);
}

/* ------------------------- Vorhang und Lampe (Paare) ------------------------ */

/**
 * Schwerer dunkelroter Samtvorhang an der Stange (alignTop). `v` 0 = offen
 * (seitlich gerafft), 1 = geschlossen (breite Flaeche). Etwas laenger als
 * zuvor, mit Lichtverlauf im Stoff, Goldsaum, Fransen und Quaste.
 * Dahinter liegt nur die Holzvertaefelung – kein Fenster.
 */
const STANGE_KUERZUNG = 4;

function drawVorhang(c: C, i: 0 | 1, x0: number, w: number, v: number) {
  const y = MUSIKZIMMER.alignTop;
  const halbe = 7 + (22 - 7) * v;
  const laenge = 50 + 8 * v;
  // Stange: zur Klavierseite hin um STANGE_KUERZUNG kuerzer
  const sx0 = i === 0 ? x0 - 3 : x0 - 3 + STANGE_KUERZUNG;
  const sx1 = i === 0 ? x0 + w + 3 - STANGE_KUERZUNG : x0 + w + 3;
  line(c, sx0, y, sx1, y, "#3a2a1f", 1.6);
  disc(c, i === 0 ? sx0 : sx1, y, 1.6, "#a58350");
  for (const side of [0, 1] as const) {
    const xs = side === 0 ? x0 : x0 + w - halbe;
    const xe = xs + halbe;
    const fy = y + laenge;
    // Samtflaeche mit Lichtverlauf
    const tuch = c.createLinearGradient(xs, 0, xe, 0);
    tuch.addColorStop(0, "#3f1017");
    tuch.addColorStop(0.4, "#6e1c28");
    tuch.addColorStop(0.62, "#8a2a36");
    tuch.addColorStop(1, "#4a1520");
    c.fillStyle = tuch;
    c.beginPath();
    c.moveTo(xs, y + 1);
    c.lineTo(xe, y + 1);
    c.lineTo(xe + (side === 0 ? -1 : 1) * (1 - v) * 1.5, y + laenge * 0.55);
    c.lineTo(xe + (side === 0 ? 1 : -1) * 1.2, fy);
    c.lineTo(xs + (side === 0 ? -1 : 1) * 1.2, fy);
    c.lineTo(xs, y + laenge * 0.5);
    c.closePath();
    c.fill();
    // Falten
    const n = Math.max(2, Math.round(halbe / (2.6 + 2.2 * v)));
    for (let k = 1; k < n; k++) {
      const fx = xs + (halbe * k) / n;
      line(c, fx, y + 2, fx + (k % 2 ? 0.8 : -0.6), fy - 2, k % 2 ? "#2a0a10" : "#9a3a46", 0.9);
    }
    // feine Glanzlinie im Stoff
    line(c, xs + halbe * 0.3, y + 3, xs + halbe * 0.3 + 0.6, fy - 4, "rgba(255,170,170,.14)", 1);
    // Goldsaum mit Fransen und Quaste
    line(c, xs, fy, xe, fy, "#a58350", 1);
    for (let fx = xs + 1; fx < xe; fx += 2) line(c, fx, fy + 0.5, fx, fy + 2.4, "#c9a46a", 0.5);
    disc(c, (xs + xe) / 2, fy + 3, 1.3, "#a58350");
    // Ringe an der Stange
    for (let k = 0; k <= n; k++) disc(c, xs + (halbe * k) / n, y, 0.9, "#c9a46a");
    // Raffhalter (Goldkordel) nur im offenen Zustand
    if (v < 0.35) {
      const ty = y + laenge * 0.62;
      const a2 = 1 - v / 0.35;
      line(c, xs - 1, ty, xe + 1, ty, "#c9a46a", 1.4 * a2);
      disc(c, side === 0 ? xs - 1 : xe + 1, ty, 1.3 * a2, "#a58350");
    }
  }
}

/** Beide Vorhaenge im aktuellen Zustand (0 offen .. 1 geschlossen). */
export function drawVorhaenge(c: C, zustand: readonly [number, number]) {
  MUSIKZIMMER.vorhaenge.forEach((v, i) => drawVorhang(c, i === 0 ? 0 : 1, v.x, v.w, zustand[i]));
}

function drawLamp(c: C, x: number, y: number, size: number) {
  line(c, x, y - 5, x, y + 1, "#272521", 1);
  const glow = c.createRadialGradient(x, y + 8, 1, x, y + 8, size * 4);
  glow.addColorStop(0, "rgba(255,210,128,.24)");
  glow.addColorStop(1, "rgba(255,210,128,0)");
  c.fillStyle = glow;
  c.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
  c.beginPath();
  c.moveTo(x - size / 2, y);
  c.bezierCurveTo(x - size, y + size, x - size * 0.45, y + size * 1.5, x, y + size * 1.5);
  c.bezierCurveTo(x + size * 0.45, y + size * 1.5, x + size, y + size, x + size / 2, y);
  c.closePath();
  c.fillStyle = "rgba(233,202,135,.8)";
  c.fill();
  c.strokeStyle = "#a48a58";
  c.lineWidth = 0.7;
  c.stroke();
  ellipse(c, x, y, size * 0.52, 1.4, "#b29763");
  ellipse(c, x, y + size * 0.95, size * 0.28, 1, "rgba(86,76,47,.4)");
  poly(c, [[x - 1.8, y + size], [x - 4, y + size - 2], [x - 3.8, y + size + 1]], "rgba(86,76,47,.4)");
  line(c, x - size * 0.37, y + 3, x - size * 0.38, y + 6, "#fff0be", 0.8);
}

/* --------------------------------- Geist ----------------------------------- */

function drawGhost(c: C, alpha: number, time: number) {
  if (alpha <= 0) return;
  const x = MUSIKZIMMER.klavier.sitz;
  const hands = klavierHaende(time);
  c.save();
  c.globalAlpha *= alpha;
  ellipse(c, x - 4, 198, 3.1, 1.8, "#171719");
  ellipse(c, x + 4, 198, 3.1, 1.8, "#171719");
  const skirt = new Path2D();
  skirt.moveTo(x - 8, 175);
  skirt.bezierCurveTo(x - 11, 180, x - 13, 187, x - 17, 192);
  skirt.lineTo(x - 12, 194);
  skirt.lineTo(x - 9, 192);
  skirt.lineTo(x - 6, 196);
  skirt.lineTo(x - 3, 193);
  skirt.lineTo(x + 2, 195);
  skirt.lineTo(x + 5, 192);
  skirt.lineTo(x + 10, 195);
  skirt.lineTo(x + 15, 191);
  skirt.bezierCurveTo(x + 12, 183, x + 11, 179, x + 8, 175);
  skirt.closePath();
  c.fillStyle = "#986879";
  c.fill(skirt);
  for (const dx of [-10, -5, 2, 7, 11]) line(c, x + dx * 0.5, 178, x + dx, 191 + (dx % 3), "#684556", 1.2);
  line(c, x - 7, 184, x - 10, 190, "#B98C9A", 0.8);
  ellipse(c, x + 9, 187, 1.3, 1.8, "#382d31");
  ellipse(c, x - 9, 192, 1, 0.7, "#382d31");
  const sway = Math.sin(time * 0.9) * 0.45;
  const shoulderY = 164;
  for (const [i, side] of [
    [0, -1],
    [1, 1],
  ] as const) {
    const sx = x + side * 7 + sway;
    const hx = x + hands[i].x;
    const hy = 167 + hands[i].press * 0.7;
    const dx = hx - sx;
    const dy = hy - shoulderY;
    const d = Math.max(0.21, Math.min(16.5, Math.hypot(dx, dy)));
    const along = (8.2 ** 2 - 8.4 ** 2 + d ** 2) / (2 * d);
    const height = Math.sqrt(Math.max(0, 8.2 ** 2 - along ** 2));
    const ex = sx + (dx / d) * along + (side * dy * height) / d;
    const ey = shoulderY + (dy / d) * along - (side * dx * height) / d;
    line(c, sx, shoulderY, ex, ey, "#986879", 4);
    line(c, ex, ey, hx, hy, "#baa7a5", 2.8);
    ellipse(c, hx, hy, 2.1, 1.1, "#d0bdb7");
  }
  round(c, x - 7 + sway, 157, 14, 23, 5, "#986879");
  const hair = new Path2D();
  hair.moveTo(x - 8 + sway, 151);
  hair.bezierCurveTo(x - 9 + sway, 138, x + 8 + sway, 137, x + 8 + sway, 150);
  hair.bezierCurveTo(x + 9 + sway, 163, x + 9, 178, x + 7, 187);
  hair.lineTo(x + 4, 183);
  hair.lineTo(x + 1, 188);
  hair.lineTo(x - 2, 185);
  hair.lineTo(x - 5, 188);
  hair.bezierCurveTo(x - 10, 174, x - 9 + sway, 160, x - 8 + sway, 151);
  c.fillStyle = "#101015";
  c.fill(hair);
  c.strokeStyle = "rgba(183,172,184,.15)";
  c.lineWidth = 0.7;
  c.stroke(hair);
  for (const dx of [-5.2, -2.3, 1.6, 4.8]) {
    c.strokeStyle = "#292632";
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(x + dx + sway, 146);
    c.bezierCurveTo(x + dx - 1, 161, x + dx + 2, 174, x + dx, 183);
    c.stroke();
  }
  c.restore();
}

export function drawMusikzimmerEffects(c: C, sequence?: MusikzimmerAblauf, vorhaenge: readonly [number, number] = [1, 1]) {
  c.save();
  c.beginPath();
  c.rect(534, 82, 296, 118);
  c.clip();
  drawVorhaenge(c, vorhaenge);
  if (sequence?.ghostMusic || sequence?.luniPlaying) drawKeys(c, sequence.musicTime);
  if (sequence) drawGhost(c, sequence.alpha, sequence.musicTime);
  c.restore();
}

/* ------------------------------ Gesamter Raum ------------------------------ */

/** Raum 02: ausschliesslich die vorhandenen Grenzen des Musikzimmers. */
export function drawMusikzimmer(c: C, atticCeil: (x: number) => number) {
  c.save();
  clipMusikzimmer(c, atticCeil);
  rect(c, 534, 35, 296, 165, COL.wood);
  let i = 0;
  for (let x = 534; x < 830; ) {
    const w = [16, 13, 19, 15, 21, 17][i % 6];
    const top = atticCeil(x);
    rect(c, x + 1, top, w - 1, 190 - top, ["#493326", "#573b29", "#65432e", "#503626", "#765039", "#593d2b"][i % 6]);
    line(c, x, top, x, 190, "#291D19", 1.1);
    line(c, x + 1.6, top, x + 1.6, 190, "rgba(187,141,91,.18)", 0.6);
    grain(c, x, top + 5, w, 181 - top, i);
    if (i % 4 === 0) {
      line(c, x + w - 4, top + 25, x + w - 5, top + 37, "#291D19", 0.7);
      line(c, x + w - 5, top + 37, x + w - 3, top + 44, "#291D19", 0.5);
    }
    for (const yy of [top + 12, 180]) ellipse(c, x + 3, yy, 0.5, 0.5, "#201714");
    x += w;
    i++;
  }
  rect(c, 534, 182, 296, 3, "#291D19");
  rect(c, 534, 185, 296, 15, "#654D3B");
  const sitz = MUSIKZIMMER.klavier.sitz;
  for (let x = 520; x < 850; x += 25) {
    const lean = (x - sitz) * 0.035;
    poly(c, [[x, 185], [x + 24, 185], [x + 24 + lean, 200], [x + lean, 200]], x % 50 ? "#6e523d" : "#654D3B");
    line(c, x, 185, x + lean, 200, "#39291F", 0.7);
    line(c, x + 4, 193, x + 16 + lean, 196, "#8A6C53", 0.6);
  }
  for (const yy of [190, 198]) line(c, 534, yy, 830, yy, "rgba(57,41,31,.65)", 0.6);
  const warm = c.createRadialGradient(sitz, 108, 2, sitz, 126, 110);
  warm.addColorStop(0, "rgba(255,196,107,.3)");
  warm.addColorStop(0.45, "rgba(216,144,62,.13)");
  warm.addColorStop(1, "rgba(83,48,27,0)");
  c.fillStyle = warm;
  c.fillRect(534, 55, 296, 145);
  const shade = c.createLinearGradient(534, 0, 830, 0);
  shade.addColorStop(0, "rgba(15,14,12,.26)");
  shade.addColorStop(0.24, "rgba(15,14,12,0)");
  shade.addColorStop(0.62, "rgba(15,14,12,.08)");
  shade.addColorStop(1, "rgba(15,14,12,.25)");
  c.fillStyle = shade;
  c.fillRect(534, 55, 296, 145);
  // Symmetrisch: Verbindungstuer - Vorhang - Lampe - Klavier - Lampe - Vorhang - Tuer
  // Vorhaenge sind schaltbar und werden in drawMusikzimmerEffects gezeichnet.
  for (const lx of MUSIKZIMMER.lampen) drawLamp(c, lx, MUSIKZIMMER.alignTop, 9);
  drawPiano(c);
  drawStool(c);
  drawRueckwandTuer(c);
  // Wenige feine Spinnweben, nicht hinter dem Klavier.
  for (const [x, y, dir] of [
    [537, 70, 1],
    [826, 116, -1],
  ]) {
    for (let j = 0; j < 4; j++) line(c, x, y, x + dir * (18 - j * 5), y + 4 + j * 4, "rgba(203,194,165,.16)", 0.5);
    for (let k = 1; k < 4; k++) {
      c.strokeStyle = "rgba(203,194,165,.15)";
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(x + dir * k * 4, y + 1);
      c.quadraticCurveTo(x + dir * k * 3, y + k * 4, x, y + k * 5);
      c.stroke();
    }
  }
  line(c, 534, atticCeil(534) + 4, 830, atticCeil(830) + 4, "#30241a", 5);
  line(c, 534, atticCeil(534) + 2, 830, atticCeil(830) + 2, "#80613f", 0.8);
  c.restore();
  rect(c, 534, 200, 296, 6, "#654D3B");
  line(c, 534, 200.5, 830, 200.5, "#8A6C53", 0.8);
  for (let x = 550; x < 830; x += 25) rect(c, x, 201, 0.7, 5, "#39291F");
  rect(c, 534, 206, 296, 6, "#34272a");
}
