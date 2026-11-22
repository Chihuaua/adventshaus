/* =======================================================================
   FENSTERKRANZ — Fenster im Stil des geschmückten Adventskalenders
   (Weihnachtshaus)

   Um jedes Fenster liegt ein Tannenzweig-Kranz wie um die große Kalender-
   tafel: Nadeln in drei Grüntönen, eine warme Lichterkette, oben ein goldener
   Stern, unten eine rote Schleife, an den Seiten Beeren und ein Glöckchen –
   und an den vier Ecken Glaskugeln, die ab dem echten Adventssonntag warm
   leuchten (1. Advent oben links, 2. oben rechts, 3. unten links, 4. unten rechts).

   Nur Canvas-Primitive, keine Bild- oder Fontdateien.
   ======================================================================= */

import { adventsSonntage, ell, kreis, poly, rand, stern, strich, type C } from "./advent-weltraum";

const GOLD = "#e8c25a";
const GOLD_TIEF = "#c49a35";
const ROT = "#c9453a";
const ROT_TIEF = "#8c2a22";

/** Wie weit die Mittellinie des Kranzes außerhalb der Scheibe liegt. */
const ABSTAND = 4.6;

/** Die vier Ecken in Kalenderreihenfolge: [x, y, leuchtet ab diesem Adventssonntag]. */
type Ecke = readonly [number, number, number];

/** Ein Nadelbüschel: fünf Nadeln fächern um die Richtung (dx, dy). */
function bueschel(c: C, x: number, y: number, dx: number, dy: number, laenge: number, dunkel: boolean, k: number): void {
  const a0 = Math.atan2(dy, dx);
  c.lineCap = "round";
  for (let n = 0; n < 5; n++) {
    const a = a0 + (n - 2) * 0.36 + (rand(x * 7 + y * 3 + n) - 0.5) * 0.2;
    const l = laenge * (0.7 + rand(x * 3 + y * 5 + n * 11) * 0.5);
    c.strokeStyle = dunkel ? "#1f4530" : n % 2 ? "#2e5c40" : "#3f7f52";
    c.lineWidth = (dunkel ? 0.78 : 0.66) * k;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
}

/** Läuft das Rechteck im Uhrzeigersinn ab und ruft `fn` an Punkten im Abstand `abstand`; `seite` 0 oben, 1 rechts, 2 unten, 3 links. */
function amRechteck(x0: number, y0: number, x1: number, y1: number, abstand: number, fn: (x: number, y: number, seite: number) => void): void {
  const ecken: readonly (readonly [number, number])[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  for (let e = 0; e < 4; e++) {
    const [ax, ay] = ecken[e];
    const [bx, by] = ecken[(e + 1) % 4];
    const laenge = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(laenge / abstand));
    for (let i = 0; i < n; i++) {
      const d = (i + 0.5) / n;
      fn(ax + (bx - ax) * d, ay + (by - ay) * d, e);
    }
  }
}

/** Warm leuchtendes Lämpchen der Lichterkette. */
function laempchen(c: C, x: number, y: number, k: number): void {
  kreis(c, x, y, 4.2 * k, "rgba(255,224,150,.16)");
  kreis(c, x, y, 2.6 * k, "rgba(255,224,150,.28)");
  kreis(c, x, y, 1.25 * k, "#ffe8b0");
  kreis(c, x - 0.3 * k, y - 0.3 * k, 0.45 * k, "#fff8dc");
}

/** Glaskugel für eine Ecke; `an` = sie leuchtet warm. */
function kugel(c: C, x: number, y: number, r: number, an: boolean): void {
  if (an) {
    kreis(c, x, y, r * 2.6, "rgba(255,190,90,.16)");
    kreis(c, x, y, r * 1.7, "rgba(255,200,110,.24)");
  }
  kreis(c, x, y, r, an ? "#f5a93f" : ROT);
  kreis(c, x - r * 0.32, y - r * 0.34, r * 0.34, an ? "#ffe9b0" : "#ea8a80");
  c.strokeStyle = "rgba(255,240,200,.55)";
  c.lineWidth = 0.45;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.stroke();
}

/** Kleine rote Schleife mit goldenem Knoten. */
function schleife(c: C, x: number, y: number, s: number): void {
  ell(c, x - s * 0.95, y, s * 0.95, s * 0.55, ROT);
  ell(c, x + s * 0.95, y, s * 0.95, s * 0.55, ROT);
  ell(c, x - s * 0.75, y, s * 0.45, s * 0.24, ROT_TIEF);
  ell(c, x + s * 0.75, y, s * 0.45, s * 0.24, ROT_TIEF);
  poly(c, [[x - 0.5, y + s * 0.3], [x - s * 1.1, y + s * 1.5], [x - s * 0.2, y + s * 1.3]], ROT);
  poly(c, [[x + 0.5, y + s * 0.3], [x + s * 1.1, y + s * 1.5], [x + s * 0.2, y + s * 1.3]], ROT);
  kreis(c, x, y, s * 0.38, ROT_TIEF);
  kreis(c, x, y, s * 0.19, GOLD);
}

/** Drei rote Beeren mit zwei Blättern. */
function beeren(c: C, x: number, y: number, s: number): void {
  ell(c, x - s * 0.9, y - s * 0.9, s * 0.9, s * 0.4, "#3f7f52");
  ell(c, x + s * 0.9, y - s * 0.9, s * 0.9, s * 0.4, "#2e5c40");
  kreis(c, x - s * 0.7, y + s * 0.2, s * 0.62, "#d9483d");
  kreis(c, x + s * 0.7, y + s * 0.2, s * 0.62, "#d9483d");
  kreis(c, x, y + s * 0.9, s * 0.62, ROT_TIEF);
  kreis(c, x - s * 0.9, y, s * 0.2, "#ffd9d2");
  kreis(c, x + 0.5 * s, y, s * 0.2, "#ffd9d2");
}

/** Kleines goldenes Glöckchen. */
function gloeckchen(c: C, x: number, y: number, s: number): void {
  strich(c, x, y - s * 2.4, x, y - s * 1.6, ROT, 0.5 * s);
  c.fillStyle = GOLD_TIEF;
  c.beginPath();
  c.moveTo(x - s * 1.25, y + s * 1);
  c.bezierCurveTo(x - s * 0.7, y + s * 0.4, x - s * 0.85, y - s * 1.45, x, y - s * 1.6);
  c.bezierCurveTo(x + s * 0.85, y - s * 1.45, x + s * 0.7, y + s * 0.4, x + s * 1.25, y + s * 1);
  c.closePath();
  c.fill();
  c.fillStyle = GOLD;
  c.beginPath();
  c.moveTo(x - s * 1.1, y + s * 0.75);
  c.bezierCurveTo(x - s * 0.6, y + s * 0.3, x - s * 0.7, y - s * 1.3, x, y - s * 1.45);
  c.bezierCurveTo(x + s * 0.4, y - s * 1.35, x + s * 0.6, y - s * 0.6, x + s * 0.55, y + s * 0.1);
  c.closePath();
  c.fill();
  kreis(c, x, y + s * 1.45, s * 0.36, GOLD_TIEF);
}

/** Goldener Stern mit hellem Kern, wie oben am großen Kalender. */
function goldstern(c: C, x: number, y: number, r: number): void {
  kreis(c, x, y, r * 2.3, "rgba(255,214,120,.2)");
  stern(c, x, y, r * 1.12, GOLD_TIEF, 5, 0.46);
  stern(c, x, y, r, GOLD, 5, 0.46);
  kreis(c, x, y, r * 0.24, "#fff8dc");
}

/** Die vier Ecken eines Rechtecks; jede leuchtet ab ihrem Adventssonntag. */
function eckenKugeln(c: C, x0: number, y0: number, x1: number, y1: number, r: number): void {
  const advent = adventsSonntage(Date.now());
  const ecken: readonly Ecke[] = [[x0, y0, 1], [x1, y0, 2], [x0, y1, 3], [x1, y1, 4]];
  for (const [x, y, sonntag] of ecken) kugel(c, x, y, r, advent >= sonntag);
}

/**
 * Tannenzweig-Kranz um eine rechteckige Scheibe (x, y, w, h). Die Maße
 * folgen der Fenstergröße: kleine Fenster bekommen einen zierlichen Kranz
 * ohne Beeren, Schleife und Glöckchen.
 */
export function fensterKranz(c: C, x: number, y: number, w: number, h: number): void {
  const k = Math.max(0.62, Math.min(1, (w + h) / 170));
  const x0 = x - ABSTAND;
  const y0 = y - ABSTAND;
  const x1 = x + w + ABSTAND;
  const y1 = y + h + ABSTAND;
  const aussen: readonly (readonly [number, number])[] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  // Weicher Schatten auf der Wand und der Zweig selbst
  c.strokeStyle = "rgba(0,0,0,.2)";
  c.lineWidth = 6.4 * k;
  c.strokeRect(x0, y0, x1 - x0, y1 - y0);
  c.strokeStyle = "#4a2f17";
  c.lineWidth = 1.1 * k;
  c.strokeRect(x0, y0, x1 - x0, y1 - y0);

  // Nadeln: nach außen dunkel und hell, dazu ein kurzer Triebe nach innen über den Rahmen
  amRechteck(x0, y0, x1, y1, 3.4 * k, (px, py, seite) => {
    const [nx, ny] = aussen[seite];
    bueschel(c, px, py, nx, ny, 4.6 * k, true, k);
    bueschel(c, px + nx * 0.5 * k, py + ny * 0.5 * k, nx, ny, 3.6 * k, false, k);
    if (rand(px * 13 + py * 7) > 0.42) bueschel(c, px, py, -nx, -ny, 1.8 * k, true, k);
  });

  // Lichterkette rund um den Kranz
  amRechteck(x0, y0, x1, y1, 14 * k, (px, py, seite) => {
    const [nx, ny] = aussen[seite];
    laempchen(c, px + nx * 1.6 * k, py + ny * 1.6 * k, k);
  });

  // Schmuckstücke wie am großen Kalender
  goldstern(c, (x0 + x1) / 2, y0 - 1.6 * k, 3.3 * k);
  if (k > 0.75 && h > 30) {
    schleife(c, (x0 + x1) / 2, y1 + 2.4 * k, 2.6 * k);
    beeren(c, x0 - 1.4 * k, (y0 + y1) / 2, 2.2 * k);
    gloeckchen(c, x1 + 1.4 * k, (y0 + y1) / 2 + 4 * k, 1.9 * k);
  }
  eckenKugeln(c, x0, y0, x1, y1, 2.7 * k);
}

/** Tannenzweig-Kranz um ein rundes Fenster mit dem Mittelpunkt (cx, cy) und dem Radius `r`. */
export function rundFensterKranz(c: C, cx: number, cy: number, r: number): void {
  const k = 0.8;
  const rr = r + ABSTAND * 0.8;
  c.strokeStyle = "rgba(0,0,0,.2)";
  c.lineWidth = 6.4 * k;
  c.beginPath();
  c.arc(cx, cy, rr, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = "#4a2f17";
  c.lineWidth = 1.1 * k;
  c.beginPath();
  c.arc(cx, cy, rr, 0, Math.PI * 2);
  c.stroke();

  const anzahl = 34;
  for (let i = 0; i < anzahl; i++) {
    const a = (i / anzahl) * Math.PI * 2;
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    const px = cx + nx * rr;
    const py = cy + ny * rr;
    bueschel(c, px, py, nx, ny, 4.4 * k, true, k);
    bueschel(c, px + nx * 0.5 * k, py + ny * 0.5 * k, nx, ny, 3.4 * k, false, k);
    if (i % 4 === 2) laempchen(c, px + nx * 2 * k, py + ny * 2 * k, k);
  }
  goldstern(c, cx, cy - rr - 1.8 * k, 3.2 * k);
  beeren(c, cx - rr * 0.72 - 1.2, cy + rr * 0.72, 2.2 * k);
  schleife(c, cx + rr * 0.72, cy + rr * 0.72 + 1.6 * k, 2.4 * k);

  // Vier Kugeln im Quadrat um das Fenster
  const advent = adventsSonntage(Date.now());
  const ecken: readonly Ecke[] = [[-0.72, -0.72, 1], [0.72, -0.72, 2], [-0.72, 0.72, 3], [0.72, 0.72, 4]];
  for (const [ex, ey, sonntag] of ecken) {
    kugel(c, cx + ex * rr * 1.42, cy + ey * rr * 1.42, 2.5 * k, advent >= sonntag);
  }
}
