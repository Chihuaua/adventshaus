/* =======================================================================
   ADVENTSKALENDER — Zielbild aus dem Spielkonzept (Abschnitt 3.1)

   Handgearbeiteter, warm-weihnachtlicher Holzkalender: 24 Klappen mit
   goldenen Zahlen, pro Jahr neu gemischt. Aufklappen und offen stehen.
   Prototyp: jedes Türchen lässt sich öffnen (ADVENT_NACH_DATUM = false).
   Final gilt die Echtzeit-Regel aus KI-START Grundsatz 2:
   Türchen sind nachholbar, aber nicht vorziehbar — dafür einfach
   ADVENT_NACH_DATUM auf true setzen.
   ======================================================================= */

import { loadJson, saveJson } from "./storage";

export type C = CanvasRenderingContext2D;
type Pt = [number, number];
type Rect = { x: number; y: number; w: number; h: number };

/** Bühnengröße (fest, siehe KI-START: 960×600-Bühne). */
const W = 960;
const H = 600;

export const ADVENT_TAGE = 24;

/** false = Prototyp (alle Türchen offen), true = Finalfassung (Datum entscheidet). */
export const ADVENT_NACH_DATUM = false;

const SCHLUESSEL = "lcp1.advent.v1";

/* ------------------------------ Datum --------------------------------- */

/**
 * Darf das Türchen `tag` jetzt geöffnet werden?
 * Final: im Dezember ab dem eigenen Tag, davor nie (nicht vorziehbar),
 * verpasste Tage bleiben im Dezember nachholbar.
 */
export function adventFrei(
  tag: number,
  monat: number,
  tagDesMonats: number,
  nachDatum: boolean = ADVENT_NACH_DATUM,
): boolean {
  if (!nachDatum) return true;
  if (monat !== 12) return false;
  return tag <= tagDesMonats;
}

/* ----------------------------- Mischung -------------------------------- */

/** Deterministischer Mischer: pro Jahr eine neue, feste Anordnung (Konzept 3.1). */
export function adventMischung(jahr: number): number[] {
  const tage = Array.from({ length: ADVENT_TAGE }, (_, i) => i + 1);
  let seed = (jahr * 2654435761) >>> 0;
  const zufall = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = tage.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [tage[i], tage[j]] = [tage[j], tage[i]];
  }
  return tage;
}

/* ------------------------------ Zustand -------------------------------- */

export interface AdventStand {
  jahr: number;
  /** Geöffnete Türchen (Tageszahlen 1–24), nachholbar über den Dezember. */
  offen: number[];
  /** Letzte Öffnungsreihenfolge — Basis für die geheime Belohnung (Konzept 3.1). */
  reihenfolge: number[];
}

function leer(jahr: number): AdventStand {
  return { jahr, offen: [], reihenfolge: [] };
}

export function ladeAdvent(jahr: number): AdventStand {
  const s = loadJson<AdventStand>(SCHLUESSEL);
  if (!s || s.jahr !== jahr) return leer(jahr);
  return {
    jahr,
    offen: Array.isArray(s.offen) ? s.offen.filter((t) => t >= 1 && t <= 24) : [],
    reihenfolge: Array.isArray(s.reihenfolge) ? s.reihenfolge.filter((t) => t >= 1 && t <= 24) : [],
  };
}

export function speichereAdvent(stand: AdventStand) {
  saveJson(SCHLUESSEL, stand);
}

/** Geheime Belohnung: alle 24 Türchen exakt in der Reihenfolge 1–24 (Konzept 3.1). */
export function adventSternVerdient(stand: AdventStand): boolean {
  return (
    stand.reihenfolge.length >= ADVENT_TAGE &&
    stand.reihenfolge.slice(0, ADVENT_TAGE).every((tag, i) => tag === i + 1)
  );
}

/**
 * Türchen öffnen. Liefert true, wenn es neu geöffnet wurde.
 * `frei` entscheidet, ob das Türchen gerade dran ist (Datum oder Prototyp).
 */
export function adventOeffnen(stand: AdventStand, tag: number, frei: boolean): boolean {
  if (!frei || stand.offen.includes(tag)) return false;
  stand.offen.push(tag);
  stand.reihenfolge.push(tag);
  speichereAdvent(stand);
  return true;
}

/* ------------------------------ Layout --------------------------------- */

const RAHMEN = { x: 124, y: 100, w: 712, h: 428 };
const SPALTE = 6;
const ZEILE = 4;
const LUFT_X = 18;
const LUFT_Y = 18;

function wackeln(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

/** 24 Türchen als Bühnen-Rechtecke; Index = Kalenderplatz, Wert = Tageszahl. */
export function adventTueren(mischung: number[]): { tag: number; r: Rect }[] {
  const zellenW = (RAHMEN.w - LUFT_X * 2) / SPALTE;
  const zellenH = (RAHMEN.h - LUFT_Y * 2) / ZEILE;
  const w = zellenW - 26;
  const h = zellenH - 22;
  return mischung.map((tag, i) => {
    const spalte = i % SPALTE;
    const zeile = Math.floor(i / SPALTE);
    return {
      tag,
      r: {
        x: RAHMEN.x + LUFT_X + spalte * zellenW + (zellenW - w) / 2 + wackeln(tag * 1.7) * 3.5,
        y: RAHMEN.y + LUFT_Y + zeile * zellenH + (zellenH - h) / 2 + wackeln(tag * 2.3 + 9) * 3,
        w,
        h,
      },
    };
  });
}

/** Welches Türchen liegt unter dem Zeiger? */
export function adventTuerBei(tueren: { tag: number; r: Rect }[], x: number, y: number): number {
  for (let i = 0; i < tueren.length; i++) {
    const r = tueren[i].r;
    if (x >= r.x - 4 && x <= r.x + r.w + 4 && y >= r.y - 4 && y <= r.y + r.h + 4) return i;
  }
  return -1;
}

/* ------------------------------ Farben -------------------------------- */

const WALNUSS = "#5a3a20";
const HOLZ = "#8a5f38";
const HOLZ_DUNKEL = "#6b4423";
const HOLZ_TIEF = "#4c2f18";
const GOLD = "#e8c25a";
const GOLD_HELL = "#f7dfa0";
const GOLD_TIEF = "#c49a35";
const ROT = "#b03a30";
const ROT_TIEF = "#8c2a22";
const TANNEN = "#2e5c40";
const TANNEN_HELL = "#3f7f52";
const CREME = "#f3e7cd";
const FILZ = "#5c1f18";

/* --------------------------- Zeichen-Helfer ---------------------------- */

function kreis(c: C, x: number, y: number, r: number, farbe: string) {
  c.fillStyle = farbe;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function strich(c: C, x0: number, y0: number, x1: number, y1: number, farbe: string, breite = 1) {
  c.strokeStyle = farbe;
  c.lineWidth = breite;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
}

function dreieck(c: C, p: Pt[], farbe: string) {
  c.fillStyle = farbe;
  c.beginPath();
  c.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
  c.closePath();
  c.fill();
}

function balken(c: C, x: number, y: number, w: number, h: number, farbe: string, radius = 0) {
  c.fillStyle = farbe;
  if (radius > 0) {
    const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
    c.fill();
  } else {
    c.fillRect(x, y, w, h);
  }
}

/** Eleganter Goldtext (Space Grotesk) mit Verlauf und weichem Schatten. */
function goldText(c: C, text: string, x: number, y: number, groesse: number) {
  c.font = `700 ${groesse}px "Space Grotesk", sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "rgba(52,24,8,.55)";
  c.fillText(text, x + 1.4, y + 1.8);
  const g = c.createLinearGradient(0, y - groesse / 2, 0, y + groesse / 2);
  g.addColorStop(0, GOLD_HELL);
  g.addColorStop(0.5, GOLD);
  g.addColorStop(1, GOLD_TIEF);
  c.fillStyle = g;
  c.fillText(text, x, y);
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
}

/** Goldene Türchen-Zahl mit Verlauf, feiner Kontur und Tiefen-Schatten. */
function goldZahl(c: C, text: string, x: number, y: number, groesse: number, alpha = 1) {
  if (alpha <= 0.02) return;
  c.save();
  c.globalAlpha = alpha;
  c.font = `700 ${groesse}px "Space Grotesk", sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "rgba(64,34,10,.6)";
  c.fillText(text, x + 1, y + 1.4);
  const g = c.createLinearGradient(0, y - groesse / 2, 0, y + groesse / 2);
  g.addColorStop(0, "#fbe7ae");
  g.addColorStop(0.55, "#e8c25a");
  g.addColorStop(1, "#b98a2e");
  c.fillStyle = g;
  c.fillText(text, x, y);
  c.lineWidth = 0.6;
  c.strokeStyle = "rgba(255,238,180,.5)";
  c.strokeText(text, x, y);
  c.restore();
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
}

/** Feine, vertikale Holzmaserung. */
function holzMaser(c: C, x: number, y: number, w: number, h: number, farbe: string, alpha = 0.18) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = farbe;
  c.globalAlpha = alpha;
  c.lineWidth = 0.8;
  const n = Math.max(3, Math.round(w / 16));
  for (let i = 0; i < n; i++) {
    const gx = x + (w * (i + 0.5)) / n + Math.sin(i * 2.3) * 2;
    c.beginPath();
    c.moveTo(gx, y);
    c.bezierCurveTo(gx + 2, y + h * 0.3, gx - 2, y + h * 0.65, gx + 1, y + h);
    c.stroke();
  }
  c.restore();
}

/** Kleine goldene Eck-Rosette. */
function rosette(c: C, x: number, y: number, r: number) {
  kreis(c, x, y, r, GOLD_TIEF);
  kreis(c, x, y, r * 0.66, GOLD);
  kreis(c, x, y, r * 0.3, GOLD_HELL);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    strich(c, x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, GOLD_TIEF, 1);
  }
}

/** Ein Tannen-Büschel für die Girlande. */
function tannBueschel(c: C, x: number, y: number, winkel: number, laenge: number, dunkel: boolean) {
  c.save();
  c.translate(x, y);
  c.rotate(winkel);
  c.strokeStyle = dunkel ? TANNEN : TANNEN_HELL;
  c.lineWidth = 1.5;
  c.lineCap = "round";
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(laenge * 0.5, i * 1.5, laenge, i * 2.4);
    c.stroke();
  }
  c.restore();
}

/** Üppige Tannengirlande mit Beeren, Kugeln und warmen Lichtern. */
function girlande(c: C, x0: number, x1: number, y: number, t: number) {
  const sag = 22;
  c.strokeStyle = "rgba(58,34,16,.9)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x0, y);
  c.quadraticCurveTo((x0 + x1) / 2, y + sag, x1, y);
  c.stroke();
  const teile = 26;
  const schritt = (x1 - x0) / teile;
  for (let i = 0; i <= teile; i++) {
    const px = x0 + i * schritt;
    const tt = i / teile;
    const py = y + (1 - Math.pow(2 * tt - 1, 2)) * sag;
    const abw = i % 2 ? 1 : -1;
    tannBueschel(c, px, py, abw * 0.9 + Math.sin(i * 1.7) * 0.2, 9, i % 3 === 0);
    tannBueschel(c, px, py, abw * -0.5, 7, i % 2 === 0);
  }
  for (let i = 2; i <= teile - 2; i += 3) {
    const tt = i / teile;
    const px = x0 + i * schritt;
    const py = y + (1 - Math.pow(2 * tt - 1, 2)) * sag + 3;
    if (i % 6 === 2) {
      kreis(c, px - 2, py, 1.6, "#c0392e");
      kreis(c, px + 2, py, 1.6, "#c0392e");
      kreis(c, px, py + 2, 1.6, ROT_TIEF);
    } else if (i % 6 === 5) {
      kreis(c, px, py + 2, 2.6, GOLD_TIEF);
      kreis(c, px - 0.8, py + 1.2, 1, GOLD_HELL);
      strich(c, px, py - 1, px, py - 3.4, "#8a6a25", 1);
    } else {
      const an = Math.sin(t * 2.4 + i * 1.1) > -0.3;
      if (an) {
        const gl = c.createRadialGradient(px, py + 1, 0.5, px, py + 1, 5.5);
        gl.addColorStop(0, "rgba(255,214,120,.9)");
        gl.addColorStop(1, "rgba(255,214,120,0)");
        c.fillStyle = gl;
        c.beginPath();
        c.arc(px, py + 1, 5.5, 0, Math.PI * 2);
        c.fill();
      }
      kreis(c, px, py + 1, 1.7, an ? "#ffd98a" : "#7a5a30");
    }
  }
}

/** Rote Schleife mit goldenem Knoten. */
function schleife(c: C, x: number, y: number, s: number) {
  c.fillStyle = ROT;
  c.beginPath();
  c.ellipse(x - s * 0.9, y, s * 0.95, s * 0.55, -0.35, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + s * 0.9, y, s * 0.95, s * 0.55, 0.35, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = ROT_TIEF;
  c.beginPath();
  c.ellipse(x - s * 0.7, y, s * 0.5, s * 0.28, -0.35, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + s * 0.7, y, s * 0.5, s * 0.28, 0.35, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = ROT;
  c.beginPath();
  c.moveTo(x - 2, y + s * 0.3);
  c.lineTo(x - 7, y + s * 1.5);
  c.lineTo(x - 2, y + s * 1.4);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(x + 2, y + s * 0.3);
  c.lineTo(x + 7, y + s * 1.5);
  c.lineTo(x + 2, y + s * 1.4);
  c.closePath();
  c.fill();
  kreis(c, x, y, s * 0.4, ROT_TIEF);
  kreis(c, x, y, s * 0.2, GOLD);
}

/** Sanft fallender, warmweißer Schnee. */
function sanfterSchnee(c: C, t: number) {
  for (let i = 0; i < 34; i++) {
    const geschw = 9 + (i % 5) * 4;
    const sx = ((i * 97.3 + Math.sin(t * 0.5 + i) * 22 + t * geschw * 0.5) % (W + 40) + W + 40) % (W + 40) - 20;
    const sy = ((i * 53.7 + t * geschw) % (H + 30) + H + 30) % (H + 30) - 15;
    const r = i % 4 === 0 ? 1.7 : i % 2 ? 0.9 : 1.2;
    c.fillStyle = `rgba(255,248,238,${0.22 + (i % 3) * 0.09})`;
    c.beginPath();
    c.arc(sx, sy, r, 0, Math.PI * 2);
    c.fill();
  }
}

/** Zartes, helles Ornamentmuster auf dem Hintergrund. */
function ornamentMuster(c: C) {
  c.save();
  c.globalAlpha = 0.045;
  c.strokeStyle = "#ffd9a0";
  c.lineWidth = 1;
  for (let x = 48; x < W; x += 68) {
    for (let y = 48; y < H; y += 68) {
      c.beginPath();
      c.moveTo(x, y - 10);
      c.quadraticCurveTo(x + 10, y, x, y + 10);
      c.quadraticCurveTo(x - 10, y, x, y - 10);
      c.stroke();
      c.beginPath();
      c.arc(x, y, 3, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.restore();
}

/* ------------------------- Türchen-Innenraum --------------------------- */

/** Warmer, goldener Innenraum hinter der Klappe (Kerzenschein). */
function tuerchenGrund(c: C, x: number, y: number, w: number, h: number) {
  const g = c.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "#4a1a12");
  g.addColorStop(0.6, "#5e2415");
  g.addColorStop(1, "#6e2f18");
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  const gl = c.createRadialGradient(x + w / 2, y + h * 0.42, 2, x + w / 2, y + h * 0.42, w * 0.78);
  gl.addColorStop(0, "rgba(255,196,110,.34)");
  gl.addColorStop(1, "rgba(255,196,110,0)");
  c.fillStyle = gl;
  c.fillRect(x, y, w, h);
  c.save();
  c.globalAlpha = 0.06;
  c.fillStyle = "#ffd98a";
  for (let i = 0; i < 3; i++) {
    const a = -0.55 + i * 0.55;
    c.beginPath();
    c.moveTo(x + w / 2, y + h * 0.42);
    c.lineTo(x + w / 2 + Math.cos(a) * w, y + h * 0.42 + Math.sin(a) * h);
    c.lineTo(x + w / 2 + Math.cos(a + 0.18) * w, y + h * 0.42 + Math.sin(a + 0.18) * h);
    c.closePath();
    c.fill();
  }
  c.restore();
  const v = c.createRadialGradient(x + w / 2, y + h / 2, w * 0.3, x + w / 2, y + h / 2, w * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(30,10,6,.42)");
  c.fillStyle = v;
  c.fillRect(x, y, w, h);
}

/* ------------------------------ Motive --------------------------------- */

/**
 * 24 handgezeichnete, warm-weihnachtliche Motive — eines pro Türchen.
 * `t` treibt dezente Bewegung (Flackern, Rieseln, Drehen).
 */
export function adventBild(c: C, tag: number, x: number, y: number, w: number, h: number, t: number) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  tuerchenGrund(c, x, y, w, h);
  const cx = x + w / 2;
  const boden = y + h - 7;
  const flackern = 0.75 + Math.sin(t * 7 + tag) * 0.25;
  switch (((tag - 1) % 24) + 1) {
    case 1: // Stern
      dreieck(c, [[cx, y + 12], [cx - 5, y + 26], [cx + 5, y + 26]], GOLD);
      dreieck(c, [[cx, y + 30], [cx - 5, y + 16], [cx + 5, y + 16]], GOLD);
      kreis(c, cx, y + 21, 2.2, "#fff1c4");
      break;
    case 2: // Kerze
      balken(c, cx - 4, boden - 20, 8, 20, CREME, 2);
      strich(c, cx, boden - 20, cx, boden - 24, "#8a6a3a", 1.4);
      c.fillStyle = `rgba(255,176,64,${flackern})`;
      c.beginPath();
      c.ellipse(cx, boden - 27, 2.6, 4.4, 0, 0, Math.PI * 2);
      c.fill();
      kreis(c, cx, boden - 26, 1.2, "#fff199");
      break;
    case 3: // Schneemann
      kreis(c, cx, boden - 7, 8, "#f2f5f8");
      kreis(c, cx, boden - 19, 5.6, "#f2f5f8");
      kreis(c, cx - 1.8, boden - 20, 0.8, "#23232e");
      kreis(c, cx + 1.8, boden - 20, 0.8, "#23232e");
      dreieck(c, [[cx, boden - 18.6], [cx + 6, boden - 17.4], [cx, boden - 16.2]], "#e07b39");
      strich(c, cx - 5.4, boden - 17, cx - 11, boden - 21, "#5c4128", 1.3);
      strich(c, cx + 5.4, boden - 17, cx + 11, boden - 21, "#5c4128", 1.3);
      break;
    case 4: // Tannenbaum
      dreieck(c, [[cx, y + 10], [cx - 11, boden - 8], [cx + 11, boden - 8]], "#3f7f52");
      dreieck(c, [[cx, y + 16], [cx - 8, boden - 14], [cx + 8, boden - 14]], "#54a06a");
      balken(c, cx - 2.4, boden - 8, 4.8, 8, "#5c4128");
      kreis(c, cx, y + 9, 1.8, GOLD);
      break;
    case 5: // Geschenk
      balken(c, cx - 10, boden - 16, 20, 16, "#c9453a", 2);
      balken(c, cx - 1.8, boden - 16, 3.6, 16, GOLD);
      balken(c, cx - 11, boden - 20, 22, 5, "#a83a30", 2);
      kreis(c, cx - 3.4, boden - 22, 2.6, GOLD);
      kreis(c, cx + 3.4, boden - 22, 2.6, GOLD);
      break;
    case 6: // Nikolausstiefel
      c.fillStyle = "#c9453a";
      c.beginPath();
      c.moveTo(cx - 6, y + 12);
      c.lineTo(cx + 6, y + 12);
      c.lineTo(cx + 6, boden - 12);
      c.lineTo(cx + 12, boden - 12);
      c.quadraticCurveTo(cx + 13, boden - 4, cx + 6, boden - 4);
      c.lineTo(cx - 6, boden - 4);
      c.closePath();
      c.fill();
      balken(c, cx - 7, y + 10, 14, 5, CREME, 2);
      break;
    case 7: // Glocke
      c.fillStyle = GOLD;
      c.beginPath();
      c.moveTo(cx - 9, boden - 8);
      c.quadraticCurveTo(cx - 9, y + 12, cx, y + 11);
      c.quadraticCurveTo(cx + 9, y + 12, cx + 9, boden - 8);
      c.closePath();
      c.fill();
      balken(c, cx - 10.5, boden - 9, 21, 3, "#caa43f", 1.5);
      kreis(c, cx, boden - 4, 2.4, "#8a6a25");
      break;
    case 8: // Schneeflocke
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + t * 0.12;
        strich(c, cx, y + h / 2, cx + Math.cos(a) * 13, y + h / 2 + Math.sin(a) * 13, "#e8f1fa", 1.4);
        strich(c, cx + Math.cos(a) * 8, y + h / 2 + Math.sin(a) * 8, cx + Math.cos(a + 0.5) * 11, y + h / 2 + Math.sin(a + 0.5) * 11, "#e8f1fa", 1);
      }
      break;
    case 9: // Lebkuchenmann
      kreis(c, cx, y + 16, 5.4, "#b9803f");
      balken(c, cx - 6.5, y + 21, 13, 4.6, "#b9803f", 2.3);
      balken(c, cx - 4.6, y + 24, 9.2, 9, "#b9803f", 3);
      strich(c, cx - 2.4, boden - 1, cx - 2.4, boden - 8, "#b9803f", 4);
      strich(c, cx + 2.4, boden - 1, cx + 2.4, boden - 8, "#b9803f", 4);
      kreis(c, cx - 1.8, y + 15, 0.8, "#3d2413");
      kreis(c, cx + 1.8, y + 15, 0.8, "#3d2413");
      kreis(c, cx, y + 26, 0.9, "#c9453a");
      kreis(c, cx, y + 29.4, 0.9, "#c9453a");
      break;
    case 10: // Zuckerstange
      c.strokeStyle = CREME;
      c.lineWidth = 5;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(cx + 3, boden - 2);
      c.lineTo(cx + 3, y + 17);
      c.arc(cx - 2.5, y + 17, 5.5, 0, Math.PI, true);
      c.stroke();
      c.strokeStyle = "#c9453a";
      c.lineWidth = 1.7;
      c.setLineDash([3.4, 3.4]);
      c.beginPath();
      c.moveTo(cx + 3, boden - 2);
      c.lineTo(cx + 3, y + 17);
      c.arc(cx - 2.5, y + 17, 5.5, 0, Math.PI, true);
      c.stroke();
      c.setLineDash([]);
      break;
    case 11: // Schlitten
      balken(c, cx - 12, boden - 12, 24, 4, "#a83a30", 2);
      strich(c, cx - 12, boden - 2, cx + 14, boden - 2, GOLD, 1.8);
      strich(c, cx - 8, boden - 8, cx - 8, boden - 2, "#5c4128", 1.6);
      strich(c, cx + 8, boden - 8, cx + 8, boden - 2, "#5c4128", 1.6);
      c.beginPath();
      c.arc(cx + 14, boden - 5, 3, -Math.PI / 2, Math.PI / 2);
      c.strokeStyle = GOLD;
      c.lineWidth = 1.8;
      c.stroke();
      break;
    case 12: // Vögelchen am Futterhaus
      balken(c, cx - 1.6, boden - 14, 3.2, 14, "#5c4128");
      balken(c, cx - 12, boden - 17, 24, 3.2, "#7a5a3c", 1.4);
      dreieck(c, [[cx - 13, boden - 17], [cx, boden - 26], [cx + 13, boden - 17]], "#a83a30");
      kreis(c, cx - 5, boden - 20.5, 3, "#3f6fb0");
      kreis(c, cx - 7.6, boden - 21.4, 1.7, "#3f6fb0");
      dreieck(c, [[cx - 9.4, boden - 21.6], [cx - 12.4, boden - 20.9], [cx - 9.4, boden - 20.3]], GOLD);
      kreis(c, cx - 8.1, boden - 21.8, 0.5, "#101018");
      break;
    case 13: // Warme Laterne
      strich(c, cx, y + 8, cx, y + 13, "#8a6a25", 1.6);
      c.beginPath();
      c.arc(cx, y + 14, 2.4, Math.PI, 0);
      c.strokeStyle = "#8a6a25";
      c.lineWidth = 1.6;
      c.stroke();
      balken(c, cx - 6, y + 15, 12, 3, "#3a2a18", 1);
      balken(c, cx - 5, y + 18, 10, 14, `rgba(255,196,90,${0.55 * flackern + 0.3})`, 2);
      c.strokeStyle = "#3a2a18";
      c.lineWidth = 1.4;
      c.strokeRect(cx - 5, y + 18, 10, 14);
      strich(c, cx, y + 18, cx, y + 32, "#3a2a18", 1);
      balken(c, cx - 6, y + 32, 12, 3, "#3a2a18", 1);
      kreis(c, cx, y + 25, 1.6, "#fff1b0");
      const gl = c.createRadialGradient(cx, y + 25, 1, cx, y + 25, 12);
      gl.addColorStop(0, `rgba(255,206,110,${0.5 * flackern})`);
      gl.addColorStop(1, "rgba(255,206,110,0)");
      c.fillStyle = gl;
      c.beginPath();
      c.arc(cx, y + 25, 12, 0, Math.PI * 2);
      c.fill();
      break;
    case 14: // Rentier
      kreis(c, cx, boden - 12, 6.4, "#8a5a34");
      strich(c, cx - 3, boden - 18, cx - 7, boden - 27, "#5c4128", 1.6);
      strich(c, cx - 7, boden - 27, cx - 10, boden - 29, "#5c4128", 1.4);
      strich(c, cx - 7, boden - 27, cx - 5, boden - 31, "#5c4128", 1.4);
      strich(c, cx + 3, boden - 18, cx + 7, boden - 27, "#5c4128", 1.6);
      strich(c, cx + 7, boden - 27, cx + 10, boden - 29, "#5c4128", 1.4);
      strich(c, cx + 7, boden - 27, cx + 5, boden - 31, "#5c4128", 1.4);
      kreis(c, cx - 2, boden - 13.4, 0.8, "#20202a");
      kreis(c, cx + 2, boden - 13.4, 0.8, "#20202a");
      kreis(c, cx, boden - 10.6, 1.7, "#c9453a");
      break;
    case 15: // Engel
      dreieck(c, [[cx, y + 16], [cx - 9, boden - 4], [cx + 9, boden - 4]], "#efe6d4");
      kreis(c, cx, y + 13, 4.4, "#f4c9a0");
      c.strokeStyle = GOLD;
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(cx, y + 7.4, 3.6, 1.2, 0, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "rgba(240,232,214,.85)";
      c.beginPath();
      c.ellipse(cx - 7, y + 20, 4.5, 2.2, 0.7, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(cx + 7, y + 20, 4.5, 2.2, -0.7, 0, Math.PI * 2);
      c.fill();
      break;
    case 16: // Schneekugel
      kreis(c, cx, y + 22, 11, "rgba(220,235,245,.35)");
      c.strokeStyle = "rgba(240,248,255,.8)";
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(cx, y + 22, 11, 0, Math.PI * 2);
      c.stroke();
      dreieck(c, [[cx, y + 15], [cx - 5.5, y + 27], [cx + 5.5, y + 27]], "#3f7f52");
      balken(c, cx - 8, boden - 8, 16, 5, "#7a5a3c", 2);
      for (let i = 0; i < 4; i++) {
        const p = (t * 0.35 + i * 0.25) % 1;
        kreis(c, cx - 6 + i * 4, y + 14 + p * 14, 0.8, "rgba(255,255,255,.9)");
      }
      break;
    case 17: // Häuschen im Schnee
      balken(c, cx - 10, boden - 14, 20, 14, "#8a6a4a");
      dreieck(c, [[cx - 13, boden - 14], [cx, boden - 27], [cx + 13, boden - 14]], "#c9453a");
      balken(c, cx - 2.6, boden - 9, 5.2, 9, "#5c4128");
      kreis(c, cx + 5.6, boden - 9, 1.9, `rgba(255,214,120,${flackern})`);
      c.fillStyle = "#f2f5f8";
      c.beginPath();
      c.moveTo(cx - 13, boden - 14);
      c.lineTo(cx, boden - 27);
      c.lineTo(cx + 13, boden - 14);
      c.lineTo(cx + 10, boden - 14);
      c.lineTo(cx, boden - 24);
      c.lineTo(cx - 10, boden - 14);
      c.closePath();
      c.fill();
      break;
    case 18: // Teetasse
      balken(c, cx - 7, boden - 12, 14, 12, "#5ea88a", 2);
      c.strokeStyle = "#5ea88a";
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(cx + 8, boden - 7, 3.4, -1.2, 1.2);
      c.stroke();
      for (let i = 0; i < 2; i++) {
        const p = (t * 0.5 + i * 0.5) % 1;
        c.strokeStyle = `rgba(238,244,240,${(1 - p) * 0.7})`;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(cx - 2 + i * 4, boden - 14);
        c.quadraticCurveTo(cx - 0.5 + i * 4, boden - 19 - p * 5, cx - 3 + i * 4, boden - 24 - p * 5);
        c.stroke();
      }
      break;
    case 19: // Plätzchen
      kreis(c, cx, boden - 9, 9.5, "#c99a5b");
      for (const [dx, dy] of [[-3.6, -3], [3.2, -4], [0, 1], [-4.4, 3], [4.2, 2.6], [0.4, -6.6]] as Pt[]) {
        kreis(c, cx + dx, boden - 9 + dy, 1.1, "#4a2f1a");
      }
      break;
    case 20: // Kranz
      c.strokeStyle = "#3f7f52";
      c.lineWidth = 5.4;
      c.beginPath();
      c.arc(cx, y + h / 2, 10.5, 0, Math.PI * 2);
      c.stroke();
      kreis(c, cx - 8, y + h / 2 - 7, 1.6, "#c9453a");
      kreis(c, cx + 9, y + h / 2 + 3, 1.6, "#c9453a");
      kreis(c, cx - 2, y + h / 2 + 10, 1.6, "#c9453a");
      dreieck(c, [[cx, y + h / 2 - 13], [cx - 5, y + h / 2 - 18], [cx - 4, y + h / 2 - 11]], "#c9453a");
      dreieck(c, [[cx, y + h / 2 - 13], [cx + 5, y + h / 2 - 18], [cx + 4, y + h / 2 - 11]], "#c9453a");
      kreis(c, cx, y + h / 2 - 13, 1.8, "#a83a30");
      break;
    case 21: // Eiszapfen-Fenster
      balken(c, cx - 11, y + 10, 22, 26, "#3a2a1a", 2);
      c.strokeStyle = "#8a6a4a";
      c.lineWidth = 2.4;
      c.strokeRect(cx - 11, y + 10, 22, 26);
      strich(c, cx, y + 10, cx, y + 36, "#8a6a4a", 1.6);
      strich(c, cx - 11, y + 23, cx + 11, y + 23, "#8a6a4a", 1.6);
      for (let i = 0; i < 4; i++) {
        dreieck(c, [[cx - 9 + i * 6, y + 10], [cx - 7.4 + i * 6, y + 10], [cx - 8.2 + i * 6, y + 17 + (i % 2) * 4]], "#dcebf7");
      }
      kreis(c, cx + 5, y + 16, 2.6, "#f4ead0");
      break;
    case 22: // Weihnachtsmann-Mütze
      c.fillStyle = "#c9453a";
      c.beginPath();
      c.moveTo(cx - 11, boden - 8);
      c.quadraticCurveTo(cx - 4, y + 10, cx + 6, y + 14);
      c.quadraticCurveTo(cx + 11, y + 17, cx + 9, y + 23);
      c.lineTo(cx + 11, boden - 8);
      c.closePath();
      c.fill();
      balken(c, cx - 13, boden - 10, 26, 5, CREME, 2.5);
      kreis(c, cx + 8.4, y + 21.6, 3.4, CREME);
      break;
    case 23: // Schlittschuhe
      balken(c, cx - 9, boden - 16, 9, 12, "#3f6fb0", 2);
      strich(c, cx - 9, boden - 13, cx - 4, boden - 13, CREME, 1);
      strich(c, cx - 9, boden - 9, cx - 4, boden - 9, CREME, 1);
      c.strokeStyle = "#c9ccd4";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(cx - 12, boden - 1);
      c.lineTo(cx + 6, boden - 1);
      c.arc(cx + 6, boden - 4, 3, Math.PI / 2, -Math.PI / 2, true);
      c.stroke();
      strich(c, cx - 8, boden - 4, cx - 8, boden - 1, "#c9ccd4", 1.6);
      strich(c, cx + 1, boden - 4, cx + 1, boden - 1, "#c9ccd4", 1.6);
      break;
    default: { // 24: Lebkuchenhaus mit warm erleuchtetem Fenster
      balken(c, cx - 12, boden - 13, 24, 13, "#a56a33", 1);
      dreieck(c, [[cx - 14, boden - 13], [cx, boden - 26], [cx + 14, boden - 13]], "#8a5427");
      // Zuckerguss-Kanten
      c.strokeStyle = CREME;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(cx - 14, boden - 13);
      c.lineTo(cx, boden - 26);
      c.lineTo(cx + 14, boden - 13);
      c.stroke();
      for (let i = 0; i < 5; i++) kreis(c, cx - 10 + i * 5, boden - 13, 1, CREME);
      // Tür und warmes Fenster
      balken(c, cx - 3, boden - 8, 6, 8, "#6b3f1e", 2);
      kreis(c, cx + 7, boden - 8, 2.4, `rgba(255,214,120,${flackern})`);
      c.strokeStyle = "#6b3f1e";
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(cx + 7, boden - 8, 2.4, 0, Math.PI * 2);
      c.stroke();
      kreis(c, cx, boden - 21, 1.4, "#c9453a");
      break;
    }
  }
  c.restore();
}

/* ------------------------------ Türchen -------------------------------- */

/** Vordere Holzklappe mit Maserung, Paneel, goldenen Scharnieren und Zahl. */
function tuerKlappe(c: C, x: number, y: number, wK: number, h: number, tag: number, zahlAlpha: number) {
  c.save();
  c.beginPath();
  c.rect(x, y, wK, h);
  c.clip();
  balken(c, x, y, wK, h, HOLZ, 3);
  holzMaser(c, x, y, wK, h, "#5a3a1e", 0.2);
  balken(c, x, y, wK, 3, "rgba(255,230,180,.25)");
  balken(c, x, y + h - 3, wK, 3, "rgba(40,20,8,.3)");
  // eingelassenes Paneel
  const px = x + wK * 0.16, pw = wK * 0.68, py = y + h * 0.14, ph = h * 0.72;
  c.fillStyle = "rgba(60,34,16,.16)";
  c.fillRect(px + 1.4, py + 1.4, pw - 2.8, ph - 2.8);
  c.strokeStyle = "rgba(45,25,10,.55)";
  c.lineWidth = 1.4;
  c.strokeRect(px, py, pw, ph);
  c.strokeStyle = "rgba(255,225,170,.18)";
  c.lineWidth = 1;
  c.strokeRect(px + 1.4, py + 1.4, pw - 2.8, ph - 2.8);
  // feine Gold-Ecken im Paneel
  c.strokeStyle = `rgba(232,194,90,${0.5 * Math.max(zahlAlpha, 0.4)})`;
  c.lineWidth = 1;
  const e = 5;
  for (const [ex, ey, dx, dy] of [[px + 3, py + 3, 1, 1], [px + pw - 3, py + 3, -1, 1], [px + 3, py + ph - 3, 1, -1], [px + pw - 3, py + ph - 3, -1, -1]] as [number, number, number, number][]) {
    c.beginPath();
    c.moveTo(ex + dx * e, ey);
    c.lineTo(ex, ey);
    c.lineTo(ex, ey + dy * e);
    c.stroke();
  }
  // Scharniere links
  c.fillStyle = GOLD_TIEF;
  c.fillRect(x + 1, y + h * 0.2, 3, 7);
  c.fillRect(x + 1, y + h * 0.72, 3, 7);
  c.fillStyle = GOLD_HELL;
  c.fillRect(x + 1.4, y + h * 0.2 + 0.8, 1.2, 5.4);
  c.fillRect(x + 1.4, y + h * 0.72 + 0.8, 1.2, 5.4);
  // Griff rechts
  kreis(c, x + wK - 6, y + h / 2, 2, GOLD_TIEF);
  kreis(c, x + wK - 6.6, y + h / 2 - 0.6, 0.8, GOLD_HELL);
  // Zahl + Gold-Rauten
  const zs = Math.min(24, wK * 0.3);
  goldZahl(c, String(tag), x + wK / 2, y + h / 2, zs, zahlAlpha);
  if (zahlAlpha > 0.4) {
    c.fillStyle = `rgba(232,194,90,${zahlAlpha * 0.9})`;
    const dy = h * 0.21;
    for (const oy of [-dy, dy]) {
      c.save();
      c.translate(x + wK / 2, y + h / 2 + oy);
      c.rotate(Math.PI / 4);
      c.fillRect(-2.2, -2.2, 4.4, 4.4);
      c.restore();
    }
  }
  c.restore();
  c.strokeStyle = HOLZ_TIEF;
  c.lineWidth = 1.4;
  c.strokeRect(x + 0.7, y + 0.7, wK - 1.4, h - 1.4);
}

/**
 * Eine einzige Klappe am linken Scharnier. Beim Öffnen schwenkt die freie
 * Kante nach links aus der Wand; die Vorderseite wird perspektivisch schmaler
 * und verschwindet, die helle Rückseite tritt links hervor. Bei 90° steht
 * die Tür als schmales Blatt in der Lücke zwischen den Türchen – sie
 * verdeckt das Nachbartürchen nicht.
 */
function tuerFluegel(c: C, x: number, y: number, w: number, h: number, tag: number, auf: number) {
  const winkel = (auf * Math.PI) / 2;
  const cosK = Math.cos(winkel);
  const sinK = Math.sin(winkel);
  // Vorderseite: schrumpft nach rechts hin zum Scharnier
  const vorne = w * cosK;
  // Rückseite: ragt nach links, perspektivisch begrenzt auf die Lücke (~16)
  const hinten = Math.min(16, w * sinK * 0.36);

  // Schatten der Tür auf dem Filz links neben dem Fach
  if (hinten > 0.6) {
    c.fillStyle = `rgba(20,6,4,${0.38 * auf})`;
    c.fillRect(x - hinten - 1.5, y + 2.5, hinten + 2.5, h);
  }

  if (vorne > 0.8) {
    // Vorderseite mit Holz, Paneel und goldener Zahl
    tuerKlappe(c, x, y, vorne, h, tag, Math.max(0, (cosK - 0.25) / 0.75));
  }

  if (hinten > 0.8) {
    // Rückseite im Licht: helles Holz, Querlatten, Beschlag
    const g = c.createLinearGradient(x - hinten, y, x, y);
    g.addColorStop(0, "#c29a66");
    g.addColorStop(0.6, "#a87b4d");
    g.addColorStop(1, "#8c6239");
    c.fillStyle = g;
    c.fillRect(x - hinten, y, hinten, h);
    holzMaser(c, x - hinten, y, hinten, h, "#5a3a1e", 0.16);
    c.fillStyle = "rgba(255,236,190,.4)";
    c.fillRect(x - hinten, y, 1.4, h);
    c.strokeStyle = "rgba(84,50,24,.5)";
    c.lineWidth = 1;
    for (const f of [0.22, 0.66]) {
      c.beginPath();
      c.moveTo(x - hinten + 1, y + h * f);
      c.lineTo(x - 1, y + h * f);
      c.stroke();
    }
    c.strokeStyle = HOLZ_TIEF;
    c.lineWidth = 1;
    c.strokeRect(x - hinten + 0.5, y + 0.5, hinten - 1, h - 1);
  }

  // Scharnier links bleibt immer sichtbar
  c.fillStyle = GOLD_TIEF;
  c.fillRect(x - 1, y + h * 0.2, 3, 7);
  c.fillRect(x - 1, y + h * 0.72, 3, 7);
  c.fillStyle = GOLD_HELL;
  c.fillRect(x - 0.4, y + h * 0.2 + 0.8, 1.2, 5.4);
  c.fillRect(x - 0.4, y + h * 0.72 + 0.8, 1.2, 5.4);
}

/**
 * Ein einzelnes Türchen: goldbezifferte Holzklappe, die nach außen (links)
 * aufklappt und bei 90° offen stehen bleibt. `stand.anim` läuft 0 (zu) → 1 (offen).
 */
export function adventTuer(
  c: C,
  r: Rect,
  tag: number,
  stand: { offen: boolean; anim: number },
  zustand: { fokus: boolean; hover: boolean; gesperrt: boolean },
  t: number,
) {
  const { x, y, w, h } = r;
  const auf = Math.max(0, Math.min(1, stand.anim));

  // Motiv wird sichtbar, sobald die Tür aufgeht
  if (auf > 0.01) {
    adventBild(c, tag, x + 2, y + 2, w - 4, h - 4, t);
    // Schatten der aufgeklappten Tür fällt von links auf das Motiv
    const sch = c.createLinearGradient(x, y, x + w * 0.55, y);
    sch.addColorStop(0, `rgba(25,9,5,${0.5 * (1 - auf * 0.6)})`);
    sch.addColorStop(1, "rgba(25,9,5,0)");
    c.fillStyle = sch;
    c.fillRect(x + 2, y + 2, w - 4, h - 4);
  } else {
    balken(c, x + 1, y + 1, w - 2, h - 2, "#2b1109", 2);
  }

  // Vertiefte Öffnung
  c.strokeStyle = "rgba(30,12,8,.9)";
  c.lineWidth = 2;
  c.strokeRect(x + 1, y + 1, w - 2, h - 2);

  // Die eine Klappe: schwenkt nach links auf und bleibt dort stehen
  tuerFluegel(c, x, y, w, h, tag, auf);

  if (zustand.gesperrt && auf < 0.01) {
    c.fillStyle = "rgba(200,222,240,.14)";
    c.fillRect(x, y, w, h);
    strich(c, x + 6, y + h - 8, x + 12, y + h - 14, "rgba(235,245,252,.6)", 1.1);
  }

  if (zustand.fokus || zustand.hover) {
    c.strokeStyle = zustand.fokus ? "#ffd166" : "rgba(255,209,102,.55)";
    c.lineWidth = zustand.fokus ? 2.2 : 1.4;
    c.strokeRect(x - 3.5, y - 3.5, w + 7, h + 7);
    if (zustand.fokus) {
      c.strokeStyle = "rgba(255,209,102,.3)";
      c.lineWidth = 1;
      c.strokeRect(x - 6, y - 6, w + 12, h + 12);
    }
  }
}

/* --------------------------- Die große Tafel --------------------------- */

/** Warme, reich verzierte Kalender-Tafel: Holzrahmen, Girlande, Schnee. */
export function adventRahmen(c: C, t: number) {
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#3d1715");
  bg.addColorStop(0.5, "#341210");
  bg.addColorStop(1, "#2a0e0c");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  ornamentMuster(c);
  const glow = c.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 540);
  glow.addColorStop(0, "rgba(255,170,80,.10)");
  glow.addColorStop(1, "rgba(255,170,80,0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, W, H);

  const fx = RAHMEN.x, fy = RAHMEN.y, fw = RAHMEN.w, fh = RAHMEN.h;

  // Schatten und gestaffelter Holzrahmen
  balken(c, fx - 24, fy - 18, fw + 48, fh + 44, "rgba(0,0,0,.35)", 14);
  balken(c, fx - 20, fy - 20, fw + 40, fh + 40, WALNUSS, 12);
  holzMaser(c, fx - 20, fy - 20, fw + 40, fh + 40, "#3a2410", 0.25);
  c.strokeStyle = GOLD_TIEF;
  c.lineWidth = 1.6;
  c.strokeRect(fx - 15.5, fy - 15.5, fw + 31, fh + 31);
  balken(c, fx - 12, fy - 12, fw + 24, fh + 24, HOLZ, 9);
  holzMaser(c, fx - 12, fy - 12, fw + 24, fh + 24, "#5a3a1e", 0.22);
  c.strokeStyle = "rgba(255,225,170,.22)";
  c.lineWidth = 1;
  c.strokeRect(fx - 11, fy - 11, fw + 22, fh + 22);
  // Filz-Innenfläche
  balken(c, fx, fy, fw, fh, FILZ, 5);
  const filz = c.createRadialGradient(fx + fw / 2, fy + fh / 2, 40, fx + fw / 2, fy + fh / 2, fw * 0.62);
  filz.addColorStop(0, "rgba(255,150,80,.06)");
  filz.addColorStop(1, "rgba(20,6,4,.35)");
  c.fillStyle = filz;
  c.fillRect(fx, fy, fw, fh);
  // Goldperlen am Innenrand
  c.fillStyle = GOLD_TIEF;
  const perl = 22;
  for (let px = fx + perl; px < fx + fw - perl / 2; px += perl) {
    kreis(c, px, fy + 4, 1.5, GOLD_TIEF);
    kreis(c, px, fy + fh - 4, 1.5, GOLD_TIEF);
  }
  for (let py = fy + perl; py < fy + fh - perl / 2; py += perl) {
    kreis(c, fx + 4, py, 1.5, GOLD_TIEF);
    kreis(c, fx + fw - 4, py, 1.5, GOLD_TIEF);
  }
  // Eck-Rosetten
  rosette(c, fx - 20, fy - 20, 7);
  rosette(c, fx + fw + 20, fy - 20, 7);
  rosette(c, fx - 20, fy + fh + 20, 7);
  rosette(c, fx + fw + 20, fy + fh + 20, 7);

  // Titel-Plakette
  balken(c, W / 2 - 185, 18, 370, 44, "rgba(28,11,7,.6)", 8);
  c.strokeStyle = "rgba(232,194,90,.4)";
  c.lineWidth = 1.2;
  c.strokeRect(W / 2 - 185, 18, 370, 44);
  goldText(c, "ADVENTSKALENDER", W / 2, 36, 23);
  c.font = '600 9px "Space Grotesk", sans-serif';
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "rgba(240,220,180,.7)";
  c.fillText("24 TUERCHEN · LUNIS HAUS", W / 2, 53);
  c.textAlign = "left";
  c.textBaseline = "alphabetic";

  // Tannengirlande über dem oberen Rahmen, Schleife in der Mitte
  girlande(c, fx - 26, fx + fw + 26, fy - 18, t);
  schleife(c, W / 2, fy - 20, 9);

  // Tannenzweige in den unteren Ecken
  for (const sx of [fx - 6, fx + fw + 6]) {
    const dir = sx < W / 2 ? 1 : -1;
    tannBueschel(c, sx, fy + fh + 12, dir * 2.4, 13, true);
    tannBueschel(c, sx, fy + fh + 14, dir * 2.9, 11, false);
    kreis(c, sx + dir * 4, fy + fh + 12, 2, "#c0392e");
    kreis(c, sx + dir * 7, fy + fh + 15, 1.7, ROT_TIEF);
  }

  sanfterSchnee(c, t);
}

/** Hinweiszeile unten: Bedienung ohne Maus (Plattformregel). */
export function adventHinweis(c: C, nachDatum: boolean, dezember: boolean) {
  const text = nachDatum && !dezember
    ? "AB DEM 1. DEZEMBER GEHT ES LOS"
    : "PFEILTASTEN · ENTER OEFFNET · ESC ZURUECK";
  c.fillStyle = "rgba(26,10,7,.82)";
  c.fillRect(0, H - 26, W, 26);
  c.strokeStyle = "rgba(232,194,90,.25)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, H - 26);
  c.lineTo(W, H - 26);
  c.stroke();
  c.font = '600 10px "Space Grotesk", sans-serif';
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = "rgba(240,220,180,.8)";
  c.fillText(text, W / 2, H - 13);
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
}

/* ------------------------- Kleiner Wandkalender ------------------------ */

/** Hängt im Wohnzimmer über dem Fernseher, auf dessen Mitte ausgerichtet. */
export const ADVENT_WAND = { x: 448, y: 346, w: 34, h: 34 };

/** Der kleine Kalender an der Wohnzimmerwand (24 Pünktchen-Türchen). */
export function adventWand(c: C, offen: number[], jahr: number = new Date().getFullYear()) {
  const { x, y, w, h } = ADVENT_WAND;
  // Aufhängung: kurz, damit der Kalender Abstand zur Decke hält
  strich(c, x + w / 2, y - 5, x + w / 2, y - 1, "#8a6a25", 1);
  kreis(c, x + w / 2, y - 6, 1.1, "#caa43f");
  // Rahmen und Filz
  balken(c, x - 2, y - 2, w + 4, h + 4, WALNUSS, 2);
  balken(c, x - 1, y - 1, w + 2, h + 2, HOLZ, 1.5);
  balken(c, x, y, w, h, FILZ, 1);
  c.strokeStyle = "rgba(232,194,90,.55)";
  c.lineWidth = 0.7;
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // 24 Türchen in derselben Anordnung wie im großen Kalender (Jahresmischung)
  const mischung = adventMischung(jahr);
  const zellenW = (w - 6) / 6;
  const zellenH = (h - 13) / 4;
  for (let i = 0; i < ADVENT_TAGE; i++) {
    const sp = i % 6;
    const ze = Math.floor(i / 6);
    const tx = x + 3 + sp * zellenW;
    const ty = y + 12 + ze * zellenH;
    const cw = zellenW - 1.3;
    const ch = zellenH - 1.3;
    const offenHier = offen.includes(mischung[i]);
    if (offenHier) {
      // Goldenes Motiv-Feld: genau an der Stelle des geöffneten Türchens
      c.fillStyle = "rgba(255,205,112,.85)";
      c.fillRect(tx, ty, cw, ch);
      c.fillStyle = "#7c3b18";
      c.fillRect(tx, ty, Math.max(1.3, cw * 0.2), ch);
    } else {
      c.fillStyle = HOLZ_DUNKEL;
      c.fillRect(tx, ty, cw, ch);
      c.fillStyle = "rgba(240,229,205,.85)";
      c.fillRect(tx + cw / 2 - 0.4, ty + ch / 2 - 0.5, 0.9, 1.1);
    }
  }
  // Schleife und goldene 24
  c.fillStyle = ROT;
  c.beginPath();
  c.ellipse(x + w / 2 - 2.8, y + 0.5, 2.8, 1.4, -0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + w / 2 + 2.8, y + 0.5, 2.8, 1.4, 0.4, 0, Math.PI * 2);
  c.fill();
  kreis(c, x + w / 2, y + 0.5, 1.1, ROT_TIEF);
  goldZahl(c, "24", x + w / 2, y + 7.2, 6, 1);
}
