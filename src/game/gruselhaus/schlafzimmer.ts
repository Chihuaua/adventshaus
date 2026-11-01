/* =======================================================================
   GRUSELHAUS · RAUM 03 · SCHLAFSTÄTTE DER VAMPIRKÖNIGIN
   Ehemals Schlafzimmer, 1. Stock links (x 270 – 490, Boden y 324, Decke y 212).

   Statisch (Hintergrund): gotische Burgmauer mit Spitzbogennische, gotischer
   Nachttisch mit Zinnteller, Kerze und Silberkelch, gotischer Kleiderschrank.

   Dynamisch (jedes Bild, damit Luni dazwischen liegen kann):
     - Körperform-Sarg: Innenpolster, Deckel (0 = zu, 1 = senkrecht offen),
       Vorderwand; geschlossen mit silberweißem Totenkopf im Schulterbereich.
     - Gotischer Trittschemel mit gebogenen Beinen und violettem Kissen.
     - Kerzenkronleuchter (pendelt nach, wenn die Brille darauf landet).
     - Flammen, schlafende Fledermaus (blinzelt kurz).

   Die Stations-IDs ("bett", "nachttisch", "kleiderschrank") bleiben gleich.
   ======================================================================= */

import type { Station } from "../house";

type C = CanvasRenderingContext2D;
type Pt = [number, number];

export const SCHLAFZIMMER = {
  x0: 270,
  x1: 490,
  boden: 324,
  decke: 212,
  sarg: { x: 282, w: 106, mitte: 335, kopf: 285, schulter: 315, fuss: 385 },
  hocker: { x: 326, hoehe: 9 },
  sitzX: 326,
  nachttisch: { x: 396, w: 26, h: 26 },
  schrank: { x: 434, w: 48, h: 84 },
  leuchter: { x: 340, y: 212, ring: 26 },
  fledermaus: { x: 278, y: 213 },
} as const;

/** Sargmaße über dem Boden F (Bühneneinheiten). */
export const SARG = { rand: 20, scharnier: 29, tiefe: 25, dicke: 5, k: 0.36 } as const;

/** Relative Sargtiefe entlang der Länge: Kopf schmal, Schulter breit, Fuß schmal. */
function tiefeBei(x: number): number {
  const s = SCHLAFZIMMER.sarg;
  if (x <= s.schulter) return 0.72 + (0.28 * (x - s.kopf)) / (s.schulter - s.kopf);
  return 1 - (0.38 * (x - s.schulter)) / (s.fuss - s.schulter);
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Projizierte Deckeltiefe: positiv = Außenseite sichtbar, negativ = Innenseite. */
export function deckelProj(o: number): number {
  const phi = (clamp01(o) * Math.PI) / 2;
  return SARG.tiefe * (SARG.k * Math.cos(phi) - Math.sin(phi));
}

/** Vorderkante des Deckels bei x (dort greifen Lunis Hände). */
export function deckelGriff(F: number, o: number, x: number): Pt {
  const proj = deckelProj(o) * tiefeBei(x);
  const yh = F - SARG.scharnier;
  const phi = (clamp01(o) * Math.PI) / 2;
  return [x, proj >= 0 ? yh + proj : yh + proj - SARG.dicke * Math.cos(phi) * 0.5];
}

/** Silberne Zugschlaufe innen am Deckel (Lunis linke Hand). */
export function deckelSchlaufe(F: number, o: number): Pt {
  const x = 330;
  return [x, F - SARG.scharnier + deckelProj(o) * 0.55 * tiefeBei(x)];
}

/* ------------------------------- Hilfsfunktionen --------------------------- */

function rect(c: C, x: number, y: number, w: number, h: number, f: string) {
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
}
function line(c: C, x1: number, y1: number, x2: number, y2: number, color: string, width = 1) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}
function disc(c: C, x: number, y: number, r: number, color: string) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
function ellipse(c: C, x: number, y: number, rx: number, ry: number, color: string) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
function poly(c: C, pts: Pt[], color: string) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
function round(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}

const COL = {
  stein: "#2c2a34",
  steinHell: "#363340",
  steinDunkel: "#22202a",
  fuge: "#17151e",
  holz: "#121117",
  holzLicht: "#24202f",
  kante: "#2c2938",
  violett: "#4a2066",
  violettHell: "#6e3a92",
  violettDunkel: "#2a1040",
  silber: "#b4b8c6",
  silberHell: "#e2e6f2",
  silberDunkel: "#606474",
  knochen: "#eef0f5",
  knochenSchatten: "#9ea4b2",
  kerze: "#eae4d6",
  wachs: "#d5cfbf",
  flamme: "#ff9922",
  flammeKern: "#fff8e6",
  zinn: "#868a96",
  zinnDunkel: "#545762",
} as const;

/* --------------------------- 1. Gotische Burgwand -------------------------- */

/** Massive Schlossmauer aus Quadersteinen mit Spitzbogennische; kein Fenster. */
export function drawBurgWand(c: C, x0: number, x1: number, yTop: number, yBot: number) {
  rect(c, x0, yTop, x1 - x0, yBot - yTop, COL.stein);
  const hoehe = 14;
  const muster = [
    [32, 28, 36, 30, 34, 26, 34],
    [26, 34, 30, 32, 28, 36, 34],
    [34, 30, 26, 36, 32, 28, 34],
    [30, 36, 34, 26, 32, 30, 32],
  ];
  const farben = [COL.stein, COL.steinHell, COL.steinDunkel, "#292731", "#33303d", "#2e2b37"];
  for (let r = 0; r * hoehe < yBot - yTop; r++) {
    const y = yTop + r * hoehe;
    let x = x0;
    let i = 0;
    while (x < x1) {
      const bw = Math.min(muster[r % 4][i % 7], x1 - x);
      rect(c, x + 0.5, y + 0.5, bw - 1, hoehe - 1, farben[(r * 3 + i * 7) % farben.length]);
      line(c, x + 1, y + 1, x + bw - 2, y + 1, "rgba(255,255,255,.05)", 0.8);
      line(c, x, y + hoehe - 0.5, x + bw, y + hoehe - 0.5, COL.fuge, 1);
      line(c, x + bw - 0.5, y, x + bw - 0.5, y + hoehe, COL.fuge, 1);
      if ((r + i * 3) % 7 === 0 && bw > 20) {
        c.strokeStyle = "rgba(10,8,16,.45)";
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(x + bw * 0.4, y + 2);
        c.lineTo(x + bw * 0.45, y + 6);
        c.lineTo(x + bw * 0.38, y + 11);
        c.stroke();
      }
      x += bw;
      i++;
    }
  }
  // Spitzbogennische hinter dem Sarg (Relief mit Maßwerk)
  const cx = SCHLAFZIMMER.sarg.mitte;
  const top = yTop + 16;
  const bot = yBot - 28;
  const hw = 52;
  c.save();
  c.beginPath();
  c.moveTo(cx - hw, bot);
  c.lineTo(cx - hw, top + 34);
  c.quadraticCurveTo(cx - hw * 0.7, top + 10, cx, top);
  c.quadraticCurveTo(cx + hw * 0.7, top + 10, cx + hw, top + 34);
  c.lineTo(cx + hw, bot);
  c.closePath();
  c.fillStyle = "#16141e";
  c.fill();
  c.strokeStyle = "#3e3a4a";
  c.lineWidth = 2.2;
  c.stroke();
  c.strokeStyle = "#100e16";
  c.lineWidth = 1;
  c.stroke();
  c.strokeStyle = "#353140";
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(cx, top + 22, 8, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.arc(cx - 12, top + 30, 6, Math.PI, 0);
  c.arc(cx + 12, top + 30, 6, Math.PI, 0);
  c.stroke();
  c.restore();
}

/* ---------------------------- 2. Der Körperform-Sarg ----------------------- */

const SX = SCHLAFZIMMER.sarg;

/** Innenraum: violettes, gestepptes Polster und Kissen (nur bei offenem Deckel). */
export function drawSargInnen(c: C, F: number) {
  const yh = F - SARG.scharnier;
  const yr = F - SARG.rand;
  const g = c.createLinearGradient(0, yh, 0, yr);
  g.addColorStop(0, COL.violettDunkel);
  g.addColorStop(1, COL.violett);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(SX.kopf + 2, yh);
  c.lineTo(SX.fuss - 2, yh);
  c.lineTo(SX.fuss - 2, yr);
  c.lineTo(SX.kopf + 2, yr);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(150,90,190,.45)";
  c.lineWidth = 0.7;
  for (let x = SX.kopf + 8; x < SX.fuss - 6; x += 9) {
    line(c, x, yh + 1, x + 4.5, yr - 1, "rgba(150,90,190,.45)", 0.7);
    line(c, x + 4.5, yh + 1, x, yr - 1, "rgba(150,90,190,.45)", 0.7);
    disc(c, x + 2.25, (yh + yr) / 2, 0.6, COL.silberHell);
  }
  // Samtkissen am Kopfende
  round(c, SX.kopf + 4, yr - 6, 26, 7, 3.5, COL.violettHell);
  line(c, SX.kopf + 7, yr - 1.5, SX.kopf + 27, yr - 1.5, COL.silber, 0.7);
  disc(c, SX.kopf + 17, yr - 3.4, 0.9, COL.silberHell);
}

/** Silberweißer Totenkopf (Relief auf dem Deckel), f = vertikale Verkürzung. */
function drawTotenkopf(c: C, x: number, y: number, f: number) {
  c.save();
  c.translate(x, y);
  c.scale(1, f);
  ellipse(c, 0, -1, 3.6, 3.3, COL.knochenSchatten);
  ellipse(c, -0.2, -1.3, 3.3, 3, COL.knochen);
  round(c, -2.1, 1.4, 4.2, 2.6, 1, COL.knochen);
  ellipse(c, -1.3, -0.9, 1.05, 1.2, "#1a1820");
  ellipse(c, 1.3, -0.9, 1.05, 1.2, "#1a1820");
  poly(c, [[0, 0.5], [-0.6, 1.6], [0.6, 1.6]], "#1a1820");
  for (const dx of [-1.2, 0, 1.2]) line(c, dx, 2.4, dx, 3.8, "#5e6270", 0.35);
  line(c, -2.6, -3.2, -1.4, -4, "rgba(255,255,255,.7)", 0.5);
  c.restore();
}

/**
 * Deckel bei Öffnung o (0 = zu, 1 = senkrecht offen). Scharnier an der langen
 * Wandseite. Außen: schwarzer Lack, gewölbt, Silberkante, Totenkopf.
 * Innen: violettes Polster mit silberner Zugschlaufe.
 */
export function drawSargDeckel(c: C, F: number, o: number) {
  const yh = F - SARG.scharnier;
  const phi = (clamp01(o) * Math.PI) / 2;
  const proj = deckelProj(o);
  const xs = [SX.x + 0.5, SX.kopf, SX.schulter, SX.fuss, SX.x + SX.w - 0.5];
  const vorn = (x: number, base: number) => base + proj * tiefeBei(Math.min(SX.fuss, Math.max(SX.kopf, x)));
  if (proj > 0.2) {
    const yb = yh - SARG.dicke;
    // Oberseite (gewölbt)
    const g = c.createLinearGradient(0, yb, 0, yb + proj);
    g.addColorStop(0, "#2a2734");
    g.addColorStop(0.45, "#16141c");
    g.addColorStop(1, "#0d0c11");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(xs[1], yb);
    c.lineTo(xs[3], yb);
    for (let i = 4; i >= 0; i--) c.lineTo(xs[i], vorn(xs[i], yb));
    c.closePath();
    c.fill();
    line(c, xs[1] + 2, yb + 0.6, xs[3] - 2, yb + 0.6, "rgba(255,255,255,.18)", 0.8);
    // Deckelstärke (Band zur Vorderseite)
    c.fillStyle = COL.holz;
    c.beginPath();
    for (let i = 0; i < 5; i++) c.lineTo(xs[i], vorn(xs[i], yb));
    for (let i = 4; i >= 0; i--) c.lineTo(xs[i], vorn(xs[i], yh));
    c.closePath();
    c.fill();
    // Silberkante
    c.strokeStyle = COL.silberDunkel;
    c.lineWidth = 0.9;
    c.beginPath();
    for (let i = 0; i < 5; i++) c.lineTo(xs[i], vorn(xs[i], yb));
    c.stroke();
    // Totenkopf im Schulterbereich
    const f = clamp01(proj / (SARG.tiefe * SARG.k));
    if (f > 0.25) drawTotenkopf(c, SX.schulter + 3, yb + proj * 0.5, f);
  } else {
    // Innenseite: violettes Polster
    c.fillStyle = COL.violett;
    c.beginPath();
    c.moveTo(xs[1], yh);
    c.lineTo(xs[3], yh);
    for (let i = 4; i >= 0; i--) c.lineTo(xs[i], vorn(xs[i], yh));
    c.closePath();
    c.fill();
    const tief = -proj;
    if (tief > 3) {
      c.strokeStyle = "rgba(150,90,190,.5)";
      c.lineWidth = 0.6;
      const yTop = yh + proj;
      for (let x = SX.kopf + 8; x < SX.fuss - 6; x += 9) {
        line(c, x, yh - 1, x + 4.5, yTop + 2, "rgba(150,90,190,.5)", 0.6);
        line(c, x + 4.5, yh - 1, x, yTop + 2, "rgba(150,90,190,.5)", 0.6);
        disc(c, x + 2.25, (yh + yTop) / 2, 0.55, COL.silberHell);
      }
      const [lx, ly] = deckelSchlaufe(F, o);
      c.strokeStyle = COL.silber;
      c.lineWidth = 0.9;
      c.beginPath();
      c.arc(lx, ly, 2, 0, Math.PI);
      c.stroke();
    }
    // Deckelkante (Stärke)
    const band = SARG.dicke * Math.cos(phi) + 0.8;
    c.fillStyle = COL.holz;
    c.beginPath();
    for (let i = 0; i < 5; i++) c.lineTo(xs[i], vorn(xs[i], yh) - band);
    for (let i = 4; i >= 0; i--) c.lineTo(xs[i], vorn(xs[i], yh));
    c.closePath();
    c.fill();
    c.strokeStyle = COL.silberDunkel;
    c.lineWidth = 0.7;
    c.beginPath();
    for (let i = 0; i < 5; i++) c.lineTo(xs[i], vorn(xs[i], yh) - band);
    c.stroke();
  }
}

/** Vorderwand mit Silberbeschlägen, Griffen, Sockel und Füßen. */
export function drawSargFront(c: C, F: number) {
  ellipse(c, SX.mitte, F + 1, 56, 2.4, "rgba(10,6,8,.45)");
  const yr = F - SARG.rand;
  const yb = F - 4;
  poly(c, [[SX.x + 1, yr], [SX.schulter, yr], [SX.schulter, yb], [SX.x + 4, yb]], "#1b1924");
  poly(c, [[SX.schulter, yr], [SX.x + SX.w - 1, yr], [SX.x + SX.w - 4, yb], [SX.schulter, yb]], COL.holz);
  line(c, SX.schulter, yr + 1, SX.schulter, yb, "rgba(255,255,255,.1)", 0.7);
  line(c, SX.x + 1, yr, SX.x + SX.w - 1, yr, COL.silber, 1);
  line(c, SX.x + 4, yb, SX.x + SX.w - 4, yb, COL.silberDunkel, 1);
  for (const bx of [SX.x + 2.5, SX.schulter, SX.x + SX.w - 2.5]) {
    poly(c, [[bx - 2, yr + 0.5], [bx + 2, yr + 0.5], [bx + 1.2, yr + 6], [bx, yr + 7.5], [bx - 1.2, yr + 6]], COL.silber);
    disc(c, bx, yr + 2.4, 0.7, COL.silberHell);
  }
  for (const gx of [SX.x + 22, SX.x + 74]) {
    round(c, gx - 4, yr + 6, 8, 3, 1, COL.silberDunkel);
    c.strokeStyle = COL.silber;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(gx - 3, yr + 8.6);
    c.quadraticCurveTo(gx, yr + 13, gx + 3, yr + 8.6);
    c.stroke();
  }
  rect(c, SX.x + 6, yb, SX.w - 12, 3, "#0e0d12");
  for (const fx of [SX.x + 9, SX.schulter, SX.x + SX.w - 14]) {
    poly(c, [[fx - 3, F], [fx + 3, F], [fx + 1.8, F - 3], [fx - 1.8, F - 3]], COL.silberDunkel);
    disc(c, fx, F - 1, 1.2, COL.silber);
  }
}

/** Gotischer Trittschemel: gebogene Beine, edles violettes Kissen. */
export function drawTrittschemel(c: C, F: number) {
  const x = SCHLAFZIMMER.hocker.x;
  const top = F - SCHLAFZIMMER.hocker.hoehe;
  ellipse(c, x, F + 0.8, 13, 1.2, "rgba(10,6,8,.45)");
  for (const s of [-1, 1]) {
    c.strokeStyle = "#1d1a24";
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(x + s * 8, top + 3);
    c.bezierCurveTo(x + s * 11, top + 5, x + s * 7.5, F - 2.5, x + s * 11.5, F - 0.6);
    c.stroke();
    disc(c, x + s * 11.5, F - 0.8, 1, COL.silberDunkel);
  }
  rect(c, x - 10, top + 2.5, 20, 2.6, "#221e2a");
  c.fillStyle = "#0e0d12";
  c.beginPath();
  c.moveTo(x - 3, top + 5.1);
  c.quadraticCurveTo(x, top + 3, x + 3, top + 5.1);
  c.closePath();
  c.fill();
  round(c, x - 11.5, top - 1.5, 23, 4.4, 2.2, COL.violett);
  round(c, x - 10, top - 1.1, 13, 1.4, 0.7, "rgba(255,255,255,.18)");
  line(c, x - 11, top + 2.8, x + 11, top + 2.8, COL.silber, 0.6);
  disc(c, x, top + 0.6, 0.8, COL.silberHell);
}

/* ------------------- 3. Kerzenkronleuchter, Flammen, Fledermaus -------------- */

/** Punkt am Kronleuchter, wenn er um den Deckenhaken pendelt. */
export function leuchterPunkt(x: number, y: number, swing: number): Pt {
  const hx = SCHLAFZIMMER.leuchter.x;
  const hy = SCHLAFZIMMER.leuchter.y;
  const dx = x - hx;
  const dy = y - hy;
  const cs = Math.cos(swing);
  const sn = Math.sin(swing);
  return [hx + dx * cs - dy * sn, hy + dx * sn + dy * cs];
}

function drawFlamme(c: C, x: number, y: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  disc(c, 0, -2, 4.5, "rgba(255,160,50,.18)");
  c.fillStyle = COL.flamme;
  c.beginPath();
  c.moveTo(0, -6);
  c.quadraticCurveTo(2.2, -3, 1.8, -0.5);
  c.quadraticCurveTo(1.2, 1.2, 0, 1.2);
  c.quadraticCurveTo(-1.2, 1.2, -1.8, -0.5);
  c.quadraticCurveTo(-2.2, -3, 0, -6);
  c.closePath();
  c.fill();
  c.fillStyle = COL.flammeKern;
  c.beginPath();
  c.moveTo(0, -4);
  c.quadraticCurveTo(1.1, -2, 0.9, -0.3);
  c.quadraticCurveTo(0.6, 0.6, 0, 0.6);
  c.quadraticCurveTo(-0.6, 0.6, -0.9, -0.3);
  c.quadraticCurveTo(-1.1, -2, 0, -4);
  c.closePath();
  c.fill();
  c.restore();
}

/** Geschmiedeter Radleuchter an Ketten mit fünf brennenden Kerzen. */
function drawKronleuchter(c: C, time: number, swing: number) {
  const x = SCHLAFZIMMER.leuchter.x;
  const yTop = SCHLAFZIMMER.leuchter.y;
  const ringY = yTop + SCHLAFZIMMER.leuchter.ring;
  const w = 44;
  c.save();
  c.translate(x, yTop);
  c.rotate(swing);
  c.translate(-x, -yTop);
  disc(c, x, yTop + 1, 2, "#18161e");
  disc(c, x, yTop + 1, 1, COL.silberDunkel);
  line(c, x, yTop + 2, x - w * 0.35, ringY, "#24222c", 1.2);
  line(c, x, yTop + 2, x + w * 0.35, ringY, "#24222c", 1.2);
  for (let k = 1; k <= 3; k++) {
    disc(c, lerp(x, x - w * 0.35, k / 4), yTop + 2 + (k / 4) * (ringY - yTop - 2), 0.8, COL.silberDunkel);
    disc(c, lerp(x, x + w * 0.35, k / 4), yTop + 2 + (k / 4) * (ringY - yTop - 2), 0.8, COL.silberDunkel);
  }
  line(c, x - w / 2, ringY, x + w / 2, ringY, "#1e1c26", 2.2);
  line(c, x - w / 2 + 1, ringY - 0.5, x + w / 2 - 1, ringY - 0.5, COL.silberDunkel, 0.7);
  c.strokeStyle = "#1e1c26";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - w * 0.35, ringY + 1);
  c.quadraticCurveTo(x, ringY + 8, x + w * 0.35, ringY + 1);
  c.stroke();
  poly(c, [[x - 1.5, ringY + 4], [x + 1.5, ringY + 4], [x, ringY + 9]], "#1e1c26");
  disc(c, x, ringY + 9, 1, COL.silberDunkel);
  [-18, -9, 0, 9, 18].forEach((dx, i) => {
    const kx = x + dx;
    line(c, kx - 3, ringY, kx + 3, ringY, "#1e1c26", 1.4);
    poly(c, [[kx - 2, ringY], [kx + 2, ringY], [kx + 1, ringY + 2], [kx - 1, ringY + 2]], COL.silberDunkel);
    const kh = 8 + (i % 2) * 2;
    rect(c, kx - 1.2, ringY - kh, 2.4, kh, COL.kerze);
    line(c, kx - 1.2, ringY - kh, kx - 1.2, ringY, COL.wachs, 0.6);
    line(c, kx, ringY - kh, kx, ringY - kh - 2, "#18161c", 0.8);
    const fl = Math.sin(time * 5 + i * 1.7) * 0.4;
    drawFlamme(c, kx + fl * 0.3, ringY - kh - 2, 1.1 + fl * 0.1);
  });
  c.restore();
}

/** Schlafende Fledermaus an der Decke; blinzelt kurz (rote Augen), wenn blink > 0. */
function drawFledermaus(c: C, blink: number) {
  const { x, y } = SCHLAFZIMMER.fledermaus;
  line(c, x - 1, y, x - 1, y + 2, "#4a4654", 0.8);
  line(c, x + 1, y, x + 1, y + 2, "#4a4654", 0.8);
  c.fillStyle = "#16141c";
  c.beginPath();
  c.moveTo(x - 3, y + 2);
  c.lineTo(x + 3, y + 2);
  c.quadraticCurveTo(x + 4, y + 9, x, y + 12);
  c.quadraticCurveTo(x - 4, y + 9, x - 3, y + 2);
  c.closePath();
  c.fill();
  line(c, x - 2, y + 3, x - 0.5, y + 10, "#282532", 0.6);
  line(c, x + 2, y + 3, x + 0.5, y + 10, "#282532", 0.6);
  poly(c, [[x - 2.5, y + 11], [x - 1, y + 13.5], [x - 0.5, y + 11]], "#16141c");
  poly(c, [[x + 2.5, y + 11], [x + 1, y + 13.5], [x + 0.5, y + 11]], "#16141c");
  if (blink > 0.15 && blink < 0.55) {
    disc(c, x - 1.1, y + 9.3, 0.55, "#e0303c");
    disc(c, x + 1.1, y + 9.3, 0.55, "#e0303c");
  }
}

/* -------------------- 4. Gotischer Nachttisch & Kerze --------------------- */

const NT = SCHLAFZIMMER.nachttisch;
const KERZE: Pt = [405.5, 297];

function drawNachttisch(c: C, F: number) {
  const x = NT.x;
  const w = NT.w;
  const topY = F - NT.h;
  rect(c, x - 1, topY, w + 2, 3, COL.holz);
  line(c, x - 1, topY, x + w + 1, topY, COL.silber, 0.8);
  rect(c, x + 1, topY + 3, w - 2, 9, "#1c1922");
  rect(c, x + 3, topY + 4, w - 6, 7, "#24202c");
  c.strokeStyle = COL.kante;
  c.lineWidth = 0.6;
  c.strokeRect(x + 3, topY + 4, w - 6, 7);
  disc(c, x + w / 2, topY + 7.5, 0.9, COL.silberHell);
  c.strokeStyle = COL.silber;
  c.lineWidth = 0.8;
  c.beginPath();
  c.arc(x + w / 2, topY + 8.5, 1.5, 0, Math.PI);
  c.stroke();
  rect(c, x + 2, topY + 12, 3, NT.h - 12, "#181620");
  rect(c, x + w - 5, topY + 12, 3, NT.h - 12, "#181620");
  c.strokeStyle = "#2e2a38";
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(x + 5, F);
  c.lineTo(x + 5, topY + 18);
  c.quadraticCurveTo(x + w / 2, topY + 13, x + w - 5, topY + 18);
  c.lineTo(x + w - 5, F);
  c.stroke();
  // Zinnteller mit gebogenem Daumengriff und Wachskerze
  const tx = x + 10;
  ellipse(c, tx, topY, 7.5, 1.8, COL.zinn);
  ellipse(c, tx, topY - 0.4, 6.2, 1.2, COL.zinnDunkel);
  c.strokeStyle = COL.zinn;
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(tx + 6, topY - 0.5);
  c.quadraticCurveTo(tx + 11, topY - 4, tx + 9, topY - 7);
  c.quadraticCurveTo(tx + 7.5, topY - 4, tx + 5, topY - 1);
  c.stroke();
  rect(c, KERZE[0] - 1.5, topY - 12, 3, 11, COL.kerze);
  line(c, KERZE[0] + 1.5, topY - 10, KERZE[0] + 1.5, topY - 4, COL.wachs, 0.8);
  line(c, KERZE[0] - 1.5, topY - 8, KERZE[0] - 1.5, topY - 2, COL.wachs, 0.8);
  line(c, KERZE[0], topY - 12, KERZE[0], topY - 14, "#18161c", 0.9);
  // Kleiner Silberkelch mit rotem Trank
  const kx = x + 21;
  ellipse(c, kx, topY, 2.4, 0.8, COL.silberDunkel);
  line(c, kx, topY, kx, topY - 4, COL.silber, 1.1);
  c.fillStyle = COL.silber;
  c.beginPath();
  c.moveTo(kx - 2.5, topY - 8);
  c.lineTo(kx + 2.5, topY - 8);
  c.quadraticCurveTo(kx + 2.5, topY - 4, kx, topY - 4);
  c.quadraticCurveTo(kx - 2.5, topY - 4, kx - 2.5, topY - 8);
  c.closePath();
  c.fill();
  ellipse(c, kx, topY - 8, 2.2, 0.7, "#880e18");
}

/* ----------------------- 5. Gotischer Kleiderschrank ---------------------- */

function drawSchrank(c: C, F: number) {
  const x = SCHLAFZIMMER.schrank.x;
  const w = SCHLAFZIMMER.schrank.w;
  const h = SCHLAFZIMMER.schrank.h;
  const topY = F - h;
  rect(c, x - 1, F - 4, w + 2, 4, "#16141c");
  line(c, x - 1, F - 4, x + w + 1, F - 4, COL.silberDunkel, 0.8);
  rect(c, x, topY + 8, w, h - 12, "#1c1922");
  rect(c, x - 2, topY + 6, w + 4, 3, "#282432");
  line(c, x - 2, topY + 6, x + w + 2, topY + 6, COL.silberDunkel, 1);
  for (const px of [x + 2, x + w / 2, x + w - 2]) {
    poly(c, [[px - 2, topY + 6], [px + 2, topY + 6], [px, topY]], "#282432");
    disc(c, px, topY, 0.9, COL.silber);
  }
  const dw = (w - 6) / 2;
  for (let d = 0; d < 2; d++) {
    const dx = x + 2 + d * (dw + 2);
    rect(c, dx, topY + 11, dw, h - 17, "#221e2a");
    c.fillStyle = "#15131b";
    c.beginPath();
    c.moveTo(dx + 2, topY + h - 8);
    c.lineTo(dx + 2, topY + 24);
    c.quadraticCurveTo(dx + dw / 2, topY + 14, dx + dw - 2, topY + 24);
    c.lineTo(dx + dw - 2, topY + h - 8);
    c.closePath();
    c.fill();
    c.strokeStyle = "#322d3d";
    c.lineWidth = 0.8;
    c.stroke();
    disc(c, dx + dw / 2, topY + 22, 2.5, "#221e2a");
    disc(c, dx + dw / 2, topY + 22, 1.2, "#15131b");
    for (const sy of [topY + 28, topY + 54, topY + 74]) {
      const hx = d === 0 ? dx + 1 : dx + dw - 1;
      const dir = d === 0 ? 1 : -1;
      line(c, hx, sy, hx + dir * 14, sy, COL.silberDunkel, 1.4);
      line(c, hx, sy - 0.3, hx + dir * 13, sy - 0.3, COL.silber, 0.7);
      disc(c, hx + dir * 14, sy, 1.2, COL.silber);
    }
    const kx = d === 0 ? dx + dw - 2.5 : dx + 2.5;
    disc(c, kx, topY + 46, 1.2, COL.silber);
  }
  line(c, x + w / 2, topY + 9, x + w / 2, F - 4, "#100e14", 1.2);
}

/** Geöffneter gotischer Schrank: Samtrücken, Gewänder, Tücher, Türflügel. */
export function drawGothicWardrobeOpen(c: C, x: number, F: number, open: number, towelTaken: boolean) {
  if (open <= 0.01) return;
  const e = open * open * (3 - 2 * open);
  const w = SCHLAFZIMMER.schrank.w;
  const h = SCHLAFZIMMER.schrank.h;
  const topY = F - h;
  rect(c, x + 2, topY + 10, w - 4, h - 15, "#141118");
  rect(c, x + 3, topY + 11, w - 6, h - 17, "#22080e");
  line(c, x + 3, topY + 22, x + w - 3, topY + 22, COL.silber, 1.4);
  const farben = ["#121016", "#5a0e19", "#1b2238", "#381024", "#241f30"];
  for (let i = 0; i < 5; i++) {
    const kx = x + 6 + i * 7.6;
    line(c, kx + 3, topY + 22, kx + 3, topY + 25, COL.silberDunkel, 0.8);
    rect(c, kx, topY + 25, 6.4, 28 + (i % 2) * 6, farben[i]);
    line(c, kx, topY + 26, kx + 6.4, topY + 26, COL.silber, 0.6);
  }
  const stack = towelTaken ? 1 : 2;
  for (let i = 0; i < stack; i++) {
    rect(c, x + 8, F - 14 - i * 4, 16, 3.5, i ? "#302636" : "#4a1220");
    line(c, x + 8, F - 14 - i * 4, x + 24, F - 14 - i * 4, COL.silber, 0.6);
  }
  round(c, x + 28, F - 15, 12, 5, 1, COL.silberDunkel);
  const dw = 20 - 15 * e;
  rect(c, x + 2 - (20 - dw) * 0.55 * e - dw * e, topY + 11, dw, h - 17, "#1c1922");
  rect(c, x + w - 2 + (20 - dw) * 0.55 * e - dw * (1 - e), topY + 11, dw, h - 17, "#1c1922");
}

/* --------------------------- Komposition und Effekte ------------------------ */

/** Statische Möbel (Hintergrund). Sarg, Leuchter und Fledermaus sind dynamisch. */
export function drawVampirSchlafzimmer(c: C, F: number) {
  drawNachttisch(c, F);
  drawSchrank(c, F);
}

/** Jedes Bild: Kronleuchter (pendelnd), Kerzenflamme, Fledermaus. */
export function drawSchlafzimmerEffects(c: C, time: number, F: number, fx: { swing: number; blink: number }) {
  drawKronleuchter(c, time, fx.swing);
  const fl = Math.sin(time * 6.3) * 0.4;
  drawFlamme(c, KERZE[0] + fl * 0.25, F - NT.h - 14, 1.05 + fl * 0.1);
  drawFledermaus(c, fx.blink);
}

/* ------------------------------- Brillenwurf -------------------------------- */

export const BRILLEN_ZIELE = {
  nachttisch: { x: 399.5, y: 296.5, rot: 0.12, scale: 0.45 },
  leuchter: { x: 344.5, y: 237, rot: 0.05, scale: 0.4 },
  fledermaus: { x: 281.5, y: 219, rot: 1.45, scale: 0.35 },
  kelch: { x: 417, y: 290, rot: 0.55, scale: 0.35 },
  schrank: { x: 458, y: 244, rot: 1.45, scale: 0.35 },
} as const;
export type BrillenZiel = keyof typeof BRILLEN_ZIELE;

/** 60 % Nachttisch, 20 % Kronleuchter, 20 % zufällig Fledermaus, Kelch oder Schrankspitze. */
export function brillenZiel(zufall: () => number = Math.random): BrillenZiel {
  const a = zufall();
  if (a < 0.6) return "nachttisch";
  if (a < 0.8) return "leuchter";
  const b = zufall();
  return b < 1 / 3 ? "fledermaus" : b < 2 / 3 ? "kelch" : "schrank";
}

/** Nachttisch und Kelch erreicht Luni im Stehen; Leuchter, Fledermaus, Schrankspitze nicht. */
export function brilleErreichbar(z: BrillenZiel): boolean {
  return z === "nachttisch" || z === "kelch";
}

/* --------------------------------- Stationen -------------------------------- */

/** Gleiche IDs wie im Haus, damit alle Abläufe nahtlos weiterlaufen. */
export function schlafzimmerStationen(stations: readonly Station[]): Station[] {
  const changes: Record<string, Partial<Station>> = {
    bett: { label: "Sarg", hits: [[SX.x, 268, SX.w + 2, 56]] },
    nachttisch: { hits: [[NT.x - 2, 280, NT.w + 4, 44]] },
    kleiderschrank: { hits: [[SCHLAFZIMMER.schrank.x - 2, 236, SCHLAFZIMMER.schrank.w + 4, 90]] },
  };
  return stations.map((st) => (changes[st.id] ? { ...st, ...changes[st.id] } : st));
}
