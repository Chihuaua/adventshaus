/* =======================================================================
   ADVENTSKALENDER IM WEIHNACHTSHAUS – DER SCHMUCK, DER MIT DEN TÜRCHEN WÄCHST
   Rund um die Kalendertafel liegt eine Tannenzweig-Umrandung. Sie kommt
   Stück für Stück mit den geöffneten Türchen dazu und wird nach und nach
   geschmückt:

     Türchen 1-6    die sechs Stücke der Umrandung (im Uhrzeigersinn, ab unten links)
     Türchen 7-18   zwölf Schmuckstücke, eines je Türchen
     Türchen 19-24  der Abschluss: Lichterkette, Perlschnur, Eiszapfen,
                    Schneeflocken, Engel und der große Stern

   An den vier Ecken hängt je eine Glaskugel. Sie leuchtet ab dem echten
   Adventssonntag (Europe/Berlin): am 4. Advent leuchten alle vier.

   Alles handgezeichnet mit Canvas-Grundformen, keine Bild- oder Fontdateien.
   ======================================================================= */

import {
  GOLD, GOLD_HELL, GOLD_TIEF, ROT, ROT_TIEF, TAU, ell, flocke, funke, kanten, kreis, note, poly, rand, rund, strich,
  stern, type C, type Rect,
} from "./advent-weltraum";

type Pt = readonly [number, number];
type Linie = readonly [number, number, number, number];
type Kanten = ReturnType<typeof kanten>;

/** Die 24 Stücke der Reihe nach: Stück k liegt da, sobald k+1 Türchen offen sind. */
export const ADVENT_SCHMUCK: readonly string[] = [
  "Tannenzweig unten links", "Tannenzweig unten rechts", "Tannenzweig rechts",
  "Tannenzweig oben rechts", "Tannenzweig oben links", "Tannenzweig links",
  "Goldstern", "Rote Beeren", "Zimtstangen", "Strohstern", "Kleine Laterne", "Goldene Noten",
  "Tannenzapfen", "Mini-Nussknacker", "Glöckchen", "Rote Schleife", "Kleine Kerze", "Zuckerstange",
  "Lichterkette", "Perlschnur", "Eiszapfen", "Schneeflocken", "Goldener Engel", "Großer Stern",
];

/* ------------------------------ Geometrie ------------------------------ */

/** Die sechs Stücke der Umrandung, im Uhrzeigersinn ab unten links: Außenkante des Holzrahmens. */
function zweig(o: Kanten, i: number): Linie {
  const liste: readonly Linie[] = [
    [o.x0, o.y1, o.mx, o.y1], [o.mx, o.y1, o.x1, o.y1], [o.x1, o.y1, o.x1, o.y0],
    [o.x1, o.y0, o.mx, o.y0], [o.mx, o.y0, o.x0, o.y0], [o.x0, o.y0, o.x0, o.y1],
  ];
  return liste[((i % 6) + 6) % 6];
}

/** Zwölf Plätze für Schmuckstücke, gleichmäßig verteilt; oben und unten mit Abstand zur Tafel. */
function ornamentPlatz(o: Kanten, j: number): Pt {
  const breite = o.x1 - o.x0;
  const hoehe = o.y1 - o.y0;
  const liste: readonly Pt[] = [
    [o.x0 + breite * 0.136, o.y1 + 12], [o.x0 + breite * 0.406, o.y1 + 12],
    [o.x0 + breite * 0.676, o.y1 + 12], [o.x0 + breite * 0.947, o.y1 + 12],
    [o.x1 - 2, o.y1 - hoehe * 0.35], [o.x1 - 2, o.y1 - hoehe * 0.784],
    [o.x1 - breite * 0.136, o.y0 - 8], [o.x1 - breite * 0.406, o.y0 - 8],
    [o.x1 - breite * 0.676, o.y0 - 8], [o.x1 - breite * 0.947, o.y0 - 8],
    [o.x0 + 2, o.y0 + hoehe * 0.35], [o.x0 + 2, o.y0 + hoehe * 0.784],
  ];
  return liste[((j % 12) + 12) % 12];
}

/** Welcher Platz jedes Schmuckstücks (Index 0-11) bekommt: hohe Stücke an die Seiten. */
const ORNAMENT_PLATZ: readonly number[] = [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11];

/** Die vier Ecken: [x, y, Zweig erreicht die Ecke ab so vielen Türchen, leuchtet ab diesem Adventssonntag]. */
function eckenListe(o: Kanten): readonly (readonly [number, number, number, number])[] {
  return [
    [o.x0 + 1, o.y0 + 1, 5, 1], [o.x1 - 1, o.y0 + 1, 3, 2], [o.x0 + 1, o.y1 - 1, 1, 3], [o.x1 - 1, o.y1 - 1, 2, 4],
  ];
}

/** Wie weit Nadeln nach außen ragen dürfen: an den Seiten ist weniger Platz (4:3-Bereich). */
function aussenPlatz(ux: number): number {
  return Math.abs(ux) < 0.5 ? 5.2 : 10.5;
}

/** Wo das Stück `index` (0-23) liegt. */
export function adventSchmuckOrt(r: Rect, index: number): [number, number] {
  const o = kanten(r);
  const i = Math.max(0, Math.min(23, Math.round(index)));
  if (i < 6) {
    const [x0, y0, x1, y1] = zweig(o, i);
    return [(x0 + x1) / 2, (y0 + y1) / 2];
  }
  if (i < 18) {
    const [x, y] = ornamentPlatz(o, ORNAMENT_PLATZ[i - 6]);
    return [x, y];
  }
  const beside: [number, number][] = [
    [o.mx, o.y1 + 6], [o.mx, o.y1], [o.mx, o.y1 + 10], [o.mx, o.y1],
    [o.x0 + (o.mx - o.x0) * 0.44, o.y0 - 10], [o.mx, o.y0 - 6],
  ];
  return beside[i - 18];
}

/** Weicher Lichtschein aus fünf durchscheinenden Ringen – günstig genug für jedes Bild. */
function schein(c: C, x: number, y: number, r: number, alpha: number, farbe = "255,222,150"): void {
  const stufen = [1, 0.8, 0.6, 0.42, 0.26];
  const anteile = [0.12, 0.14, 0.18, 0.24, 0.42];
  for (let i = 0; i < stufen.length; i++) {
    kreis(c, x, y, r * stufen[i], `rgba(${farbe},${(alpha * anteile[i]).toFixed(3)})`);
  }
}

/* --------------------------- Tannenzweige ------------------------------ */

function zapfen(c: C, x: number, y: number, s: number): void {
  ell(c, x, y, 2.6 * s, 3.6 * s, "#4c2f18");
  c.strokeStyle = "#8a5a2e";
  c.lineWidth = 0.7;
  for (let reihe = 0; reihe < 3; reihe++) {
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      c.arc(x + (k ? 1.1 : -1.1) * s, y + (reihe - 1) * 1.8 * s, 1.1 * s, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
    }
  }
  kreis(c, x - 0.9 * s, y - 2.6 * s, 0.7 * s, "#b8b09a");
}

/**
 * Ein Stück Tannenzweig entlang einer Rahmenkante: brauner Ast, Nadeln in
 * drei Grüntönen in zwei Lagen, helle Nadelspitzen und zwei Zapfen.
 */
function tannZweig(c: C, x0: number, y0: number, x1: number, y1: number, seed: number): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const laenge = Math.hypot(dx, dy);
  const ux = dx / laenge;
  const uy = dy / laenge;
  const nx = -uy; // nach außen: die Umrundung läuft im Uhrzeigersinn
  const ny = ux;
  const aussen = aussenPlatz(ux);
  c.lineCap = "round";

  // Weicher Schatten auf dem Holz, dann der Ast mit hellem Schein
  c.strokeStyle = "rgba(0,0,0,.3)";
  c.lineWidth = 10;
  c.beginPath();
  c.moveTo(x0 + nx * 1.2, y0 + ny * 1.2);
  c.lineTo(x1 + nx * 1.2, y1 + ny * 1.2);
  c.stroke();
  strich(c, x0, y0, x1, y1, "#4a2f17", 2.4);
  strich(c, x0 + nx * 0.6, y0 + ny * 0.6, x1 + nx * 0.6, y1 + ny * 0.6, "rgba(170,118,66,.7)", 0.8);

  const n = Math.max(2, Math.round(laenge / 6.4));
  for (let durchgang = 0; durchgang < 2; durchgang++) {
    for (let i = 0; i <= n; i++) {
      const s = (i / n) * laenge;
      const wobble = Math.sin((s / laenge) * 9 + seed) * 1.5 + (durchgang === 0 ? -1.2 : 0.6);
      const bx = x0 + ux * s + nx * wobble;
      const by = y0 + uy * s + ny * wobble;
      for (let seite = -1; seite <= 1; seite += 2) {
        for (let k = 0; k < 5; k++) {
          const z = rand(i * 11 + k * 5 + seed * 37 + (seite > 0 ? 61 : 0) + durchgang * 7);
          const neig = -0.62 + (k / 4) * 1.24 + (z - 0.5) * 0.18;
          const basis = (seite > 0 ? aussen : aussen + 3.5) * (0.72 + z * 0.42) * (durchgang === 0 ? 0.86 : 1);
          const cs = Math.cos(neig);
          const sn = Math.sin(neig);
          const rx = nx * seite * cs + ux * sn;
          const ry = ny * seite * cs + uy * sn;
          const ex = bx + rx * basis + ux * 1.4;
          const ey = by + ry * basis + uy * 1.4;
          c.strokeStyle = durchgang === 0 ? "#1f4530" : k % 2 ? "#2e5c40" : "#3f7f52";
          c.lineWidth = durchgang === 0 ? 1.25 : 1.1;
          c.beginPath();
          c.moveTo(bx, by);
          c.quadraticCurveTo(bx + rx * basis * 0.5 + ux * 0.8, by + ry * basis * 0.5 + uy * 0.8, ex, ey);
          c.stroke();
          if (durchgang === 1 && k === 2) {
            c.strokeStyle = "rgba(150,205,160,.8)";
            c.lineWidth = 0.9;
            c.beginPath();
            c.moveTo(bx + rx * basis * 0.66, by + ry * basis * 0.66);
            c.lineTo(ex, ey);
            c.stroke();
          }
        }
      }
    }
  }
  for (const anteil of [0.27, 0.71]) {
    zapfen(c, x0 + ux * laenge * anteil + nx * (aussen * 0.55 + 1), y0 + uy * laenge * anteil + ny * (aussen * 0.55 + 1), 1.15);
  }
}

/** Läuft die ganze Umrundung ab und ruft `fn` an Punkten im Abstand `abstand`: mit Außenrichtung und Platz nach außen. */
function laufe(o: Kanten, abstand: number, fn: (x: number, y: number, nx: number, ny: number, aussen: number, i: number) => void): void {
  let i = 0;
  for (let s = 0; s < 6; s++) {
    const [x0, y0, x1, y1] = zweig(o, s);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const laenge = Math.hypot(dx, dy);
    const ux = dx / laenge;
    const uy = dy / laenge;
    const n = Math.max(1, Math.round(laenge / abstand));
    for (let k = 0; k < n; k++) {
      const d = ((k + 0.5) / n) * laenge;
      fn(x0 + ux * d, y0 + uy * d, -uy, ux, aussenPlatz(ux), i++);
    }
  }
}

/* ---------------------------- Schmuckstücke ---------------------------- */

/** Die zwölf Schmuckstücke für die Türchen 7-18; Licht (Laterne, Kerze) kommt im lebendigen Teil dazu. */
function ornament(c: C, art: number, x: number, y: number): void {
  switch (art) {
    case 0: // Goldstern
      strich(c, x, y - 10, x, y - 6.2, GOLD_TIEF, 0.8);
      stern(c, x, y, 6.4, GOLD_TIEF, 5, 0.47);
      stern(c, x, y, 5.5, GOLD, 5, 0.47);
      kreis(c, x - 1.2, y - 1.5, 1.1, GOLD_HELL);
      break;
    case 1: // Rote Beeren
      ell(c, x - 3.4, y - 3.6, 3.4, 1.5, "#3f7f52");
      ell(c, x + 3.4, y - 3.6, 3.4, 1.5, "#2e5c40");
      kreis(c, x - 2.8, y + 0.8, 2.6, "#d9483d");
      kreis(c, x + 2.8, y + 0.8, 2.6, "#d9483d");
      kreis(c, x, y + 3.6, 2.6, ROT_TIEF);
      kreis(c, x - 3.6, y - 0.1, 0.8, "#ffd9d2");
      kreis(c, x + 2, y - 0.1, 0.8, "#ffd9d2");
      break;
    case 2: // Zimtstangen, gekreuzt und verschnürt
      c.save();
      c.translate(x, y);
      for (const winkel of [-0.6, 0.6]) {
        c.save();
        c.rotate(winkel);
        rund(c, -1.5, -6.5, 3, 13, 1.3, "#8a5a2e");
        c.fillStyle = "#5a3a1e";
        c.fillRect(-1.5, -6.5, 3, 1.3);
        c.fillRect(-1.5, 5.2, 3, 1.3);
        strich(c, -0.3, -4.8, -0.3, 4.8, "rgba(60,36,16,.5)", 0.5);
        c.restore();
      }
      strich(c, -3.2, 0, 3.2, 0, "#3f7f52", 1.1);
      kreis(c, 3.7, -0.9, 0.9, "#3f7f52");
      c.restore();
      break;
    case 3: // Strohstern
      c.save();
      c.translate(x, y);
      c.lineCap = "round";
      c.strokeStyle = "#d9b56a";
      c.lineWidth = 1.25;
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        c.beginPath();
        c.moveTo(Math.cos(a) * -6.6, Math.sin(a) * -6.6);
        c.lineTo(Math.cos(a) * 6.6, Math.sin(a) * 6.6);
        c.stroke();
      }
      c.strokeStyle = "#f0d89a";
      c.lineWidth = 0.7;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + Math.PI / 6;
        c.beginPath();
        c.moveTo(Math.cos(a) * 1.6, Math.sin(a) * 1.6);
        c.lineTo(Math.cos(a + 0.9) * 3.6, Math.sin(a + 0.9) * 3.6);
        c.stroke();
      }
      c.restore();
      break;
    case 4: // Kleine Laterne – das Licht lebt in jedem Bild
      strich(c, x, y - 7.4, x, y - 9.4, "#2b3a33", 1);
      rund(c, x - 4, y - 6.6, 8, 2.1, 0.8, "#2b3a33");
      rund(c, x - 3.3, y - 4.6, 6.6, 8.4, 1, "#ffd98a");
      c.fillStyle = "#2b3a33";
      c.fillRect(x - 0.5, y - 4.6, 1, 8.4);
      c.fillRect(x - 3.3, y - 1.1, 6.6, 0.9);
      rund(c, x - 4, y + 3.6, 8, 1.7, 0.6, "#2b3a33");
      kreis(c, x, y + 1.8, 1.5, "#fff3c8");
      break;
    case 5: // Goldene Noten
      note(c, x - 3, y + 4, 1, GOLD_TIEF);
      note(c, x + 4.5, y + 1, 0.8, GOLD_HELL);
      break;
    case 6: // Tannenzapfen mit Goldkante
      c.strokeStyle = GOLD;
      c.lineWidth = 0.6;
      c.beginPath();
      c.ellipse(x, y + 0.6, 3.6, 5.4, 0, 0, TAU);
      c.stroke();
      zapfen(c, x, y + 0.6, 1.4);
      break;
    case 7: // Mini-Nussknacker
      rund(c, x - 2.3, y + 3, 1.9, 4.8, 0.4, "#22242e");
      rund(c, x + 0.4, y + 3, 1.9, 4.8, 0.4, "#22242e");
      rund(c, x - 3.6, y - 3.6, 7.2, 7.2, 1, ROT);
      c.fillStyle = "#22242e";
      c.fillRect(x - 3.6, y + 0.3, 7.2, 1);
      kreis(c, x, y + 0.8, 0.7, GOLD);
      rund(c, x - 2.7, y - 7.8, 5.4, 4.6, 1, "#f1c9a5");
      rund(c, x - 3.3, y - 11.2, 6.6, 3.9, 0.8, "#22242e");
      c.fillStyle = GOLD;
      c.fillRect(x - 3.3, y - 8, 6.6, 0.9);
      kreis(c, x - 1, y - 6, 0.5, "#22242e");
      kreis(c, x + 1, y - 6, 0.5, "#22242e");
      break;
    case 8: // Glöckchen
      strich(c, x, y - 9, x, y - 6.6, ROT, 1.2);
      c.fillStyle = GOLD_TIEF;
      c.beginPath();
      c.moveTo(x - 4.8, y + 3.8);
      c.bezierCurveTo(x - 2.7, y + 1.7, x - 3.3, y - 5.6, x, y - 6.2);
      c.bezierCurveTo(x + 3.3, y - 5.6, x + 2.7, y + 1.7, x + 4.8, y + 3.8);
      c.closePath();
      c.fill();
      c.fillStyle = GOLD;
      c.beginPath();
      c.moveTo(x - 4.2, y + 2.9);
      c.bezierCurveTo(x - 2.3, y + 1.2, x - 2.8, y - 5, x, y - 5.6);
      c.bezierCurveTo(x + 1.4, y - 5.3, x + 2.3, y - 2.2, x + 2.2, y + 0.4);
      c.closePath();
      c.fill();
      rund(c, x - 5.1, y + 3.3, 10.2, 1.5, 0.7, GOLD_TIEF);
      kreis(c, x, y + 5.6, 1.3, GOLD_TIEF);
      ell(c, x - 1.8, y - 1.4, 0.8, 2.2, "rgba(255,255,255,.65)");
      break;
    case 9: // Rote Schleife
      ell(c, x - 3.7, y - 0.6, 4.1, 2.6, ROT);
      ell(c, x + 3.7, y - 0.6, 4.1, 2.6, ROT);
      ell(c, x - 2.9, y - 0.5, 1.9, 1.1, ROT_TIEF);
      ell(c, x + 2.9, y - 0.5, 1.9, 1.1, ROT_TIEF);
      poly(c, [[x - 1.2, y + 1.4], [x - 3.6, y + 6.6], [x - 1, y + 5.8]], ROT);
      poly(c, [[x + 1.2, y + 1.4], [x + 3.6, y + 6.6], [x + 1, y + 5.8]], ROT);
      kreis(c, x, y + 0.2, 1.5, ROT_TIEF);
      kreis(c, x, y + 0.2, 0.7, GOLD);
      break;
    case 10: // Kleine Kerze – die Flamme lebt in jedem Bild
      rund(c, x - 4.6, y + 4.6, 9.2, 1.8, 0.8, GOLD_TIEF);
      rund(c, x - 1.9, y - 4.8, 3.8, 9.6, 0.8, "#f3efe6");
      strich(c, x - 0.8, y - 4.1, x - 0.8, y + 3.6, "rgba(0,0,0,.08)", 0.9);
      strich(c, x, y - 5.2, x, y - 6.2, "#3a2a1c", 0.7);
      break;
    default: // Zuckerstange
      c.save();
      c.translate(x, y + 1);
      c.rotate(0.3);
      c.lineCap = "round";
      const stange = () => {
        c.beginPath();
        c.moveTo(0, 9);
        c.lineTo(0, -2);
        c.arc(-2.9, -2, 2.9, 0, Math.PI, true);
        c.lineTo(-5.8, 0.6);
      };
      stange();
      c.strokeStyle = "#f7f4ec";
      c.lineWidth = 3.1;
      c.stroke();
      stange();
      c.setLineDash([1.4, 2.5]);
      c.strokeStyle = ROT;
      c.lineWidth = 2.9;
      c.stroke();
      c.setLineDash([]);
      c.restore();
      break;
  }
}

/** Goldener Engel mit Heiligenschein. */
function engel(c: C, x: number, y: number): void {
  ell(c, x - 5.2, y - 1.2, 4.8, 2.3, "rgba(243,231,205,.95)");
  ell(c, x + 5.2, y - 1.2, 4.8, 2.3, "rgba(243,231,205,.95)");
  poly(c, [[x - 3.3, y + 7.5], [x + 3.3, y + 7.5], [x + 2.5, y - 2], [x - 2.5, y - 2]], GOLD);
  poly(c, [[x - 1.2, y + 7.5], [x + 1.2, y + 7.5], [x + 0.9, y - 2], [x - 0.9, y - 2]], GOLD_HELL);
  kreis(c, x, y - 4.4, 2.5, "#f1c9a5");
  c.strokeStyle = GOLD_HELL;
  c.lineWidth = 0.9;
  c.beginPath();
  c.ellipse(x, y - 7.6, 2.7, 0.9, 0, 0, TAU);
  c.stroke();
}

/** Glaskugel für eine Rahmenecke; `an` = sie leuchtet warm. */
function kugel(c: C, x: number, y: number, an: boolean, t: number, phase: number): void {
  if (an) {
    schein(c, x, y, 25, 0.36 + 0.06 * Math.sin(t * 1.1 + phase), "255,190,90");
  }
  strich(c, x, y - 10.6, x, y - 7.6, GOLD_TIEF, 1.2);
  rund(c, x - 1.7, y - 9, 3.4, 2.3, 0.5, GOLD);
  const g = c.createRadialGradient(x - 2.3, y - 2.5, 0.8, x, y, 7);
  if (an) {
    g.addColorStop(0, "#fff0b8");
    g.addColorStop(0.45, "#ffb648");
    g.addColorStop(1, "#b45a1c");
  } else {
    g.addColorStop(0, "#e86a5e");
    g.addColorStop(0.5, "#b03a30");
    g.addColorStop(1, "#6e1f18");
  }
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, 7, 0, TAU);
  c.fill();
  c.strokeStyle = "rgba(255,240,200,.5)";
  c.lineWidth = 0.6;
  c.stroke();
  kreis(c, x - 2.3, y - 2.5, 1.35, "rgba(255,255,255,.78)");
}

/** Der große Stern oben in der Mitte: das letzte Stück. */
function grosserStern(c: C, x: number, y: number, t: number): void {
  const puls = 0.5 + 0.08 * Math.sin(t * 1.3);
  schein(c, x, y, 34, puls, "255,214,120");
  stern(c, x, y, 13, GOLD_TIEF, 8, 0.42, -Math.PI / 2 + Math.PI / 8);
  stern(c, x, y, 11.2, GOLD, 4, 0.4);
  stern(c, x, y, 5.6, GOLD_HELL, 4, 0.45, 0);
  kreis(c, x, y, 1.9, "#fff8dc");
  funke(c, x - 18, y - 7, 3, "rgba(255,246,214,.9)");
  funke(c, x + 17, y + 6, 2.4, "rgba(255,246,214,.85)");
}

/* -------------------------------- Zeichnen ----------------------------- */

/**
 * Der ganze Schmuck rund um die Tafel für `anzahl` offene Türchen.
 * `fest` = wahr: alles Feste (Zweige, Schmuckstücke, Zapfen, Draht, Perlen,
 * Eiszapfen, Engel) – wird einmal in einen Puffer gezeichnet.
 * `fest` = falsch: das lebende Licht jedes Bildes (Laterne, Kerze, Lichterkette,
 * die vier Ecken-Kugeln und der große Stern).
 */
export function adventSchmuck(c: C, r: Rect, anzahl: number, sonntage: number, t: number, fest: boolean): void {
  const o = kanten(r);
  const n = Math.max(0, Math.min(24, Math.round(anzahl)));
  const advent = Math.max(0, Math.min(4, Math.round(sonntage)));
  if (fest) {
    for (let i = 0; i < Math.min(n, 6); i++) {
      const [x0, y0, x1, y1] = zweig(o, i);
      tannZweig(c, x0, y0, x1, y1, i * 3.1);
    }
    for (let i = 6; i < Math.min(n, 18); i++) {
      const art = i - 6;
      const [x, y] = ornamentPlatz(o, ORNAMENT_PLATZ[art]);
      // Der weite Lichtschein von Laterne und Kerze ist fest; die Flamme selbst lebt in jedem Bild.
      if (art === 4) schein(c, x, y, 17, 0.42);
      if (art === 10) schein(c, x, y - 8, 15, 0.44, "255,214,120");
      ornament(c, art, x, y);
    }
    if (n >= 19) {
      // Draht der Lichterkette, ein Stück außerhalb des Zweigs
      c.strokeStyle = "rgba(22,17,10,.85)";
      c.lineWidth = 0.9;
      c.beginPath();
      for (let s = 0; s < 6; s++) {
        const [x0, y0, x1, y1] = zweig(o, s);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const laenge = Math.hypot(dx, dy);
        const ux = dx / laenge;
        const uy = dy / laenge;
        const ab = aussenPlatz(ux) - 2.2;
        for (let d = 0; d <= laenge; d += 10) {
          const w = Math.sin((d + s * 31) / 17) * 1.5;
          const x = x0 + ux * d - uy * (ab + w);
          const y = y0 + uy * d + ux * (ab + w);
          if (d === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
      }
      c.stroke();
      laufe(o, 68, (x, y, nx, ny, aussen) => schein(c, x + nx * (aussen - 2.2), y + ny * (aussen - 2.2), 7.5, 0.34, "255,224,150"));
    }
    if (n >= 20) {
      laufe(o, 9, (x, y, nx, ny) => {
        const bx = x - nx * 2.2;
        const by = y - ny * 2.2;
        kreis(c, bx, by, 1.2, GOLD_TIEF);
        kreis(c, bx - 0.3, by - 0.3, 0.7, GOLD_HELL);
      });
    }
    if (n >= 21) {
      // Eiszapfen unter der Unterkante
      const breite = o.x1 - o.x0;
      for (let i = 0; i < 12; i++) {
        const x = o.x0 + breite * (0.045 + i * 0.0828);
        const laenge = 6 + rand(i + 5) * 9;
        const g = c.createLinearGradient(0, o.y1 + 3, 0, o.y1 + 3 + laenge);
        g.addColorStop(0, "rgba(214,236,255,.92)");
        g.addColorStop(1, "rgba(150,198,240,.22)");
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(x - 1.7, o.y1 + 3);
        c.lineTo(x + 1.7, o.y1 + 3);
        c.lineTo(x + 0.5, o.y1 + 3 + laenge);
        c.lineTo(x - 0.5, o.y1 + 2.6 + laenge);
        c.closePath();
        c.fill();
        strich(c, x - 0.5, o.y1 + 4.4, x - 0.2, o.y1 + 2.6 + laenge * 0.7, "rgba(255,255,255,.7)", 0.5);
      }
    }
    if (n >= 22) {
      laufe(o, 244, (x, y, nx, ny, aussen, i) => {
        const ab = i % 2 ? aussen - 3.5 : -(aussen + 6.5);
        flocke(c, x + nx * ab, y + ny * ab, 3.6);
      });
    }
    if (n >= 23) engel(c, o.x0 + (o.mx - o.x0) * 0.44, o.y0 - 10);
    return;
  }

  // Lebendes Licht: nur die kleinen Kerne und Flammen, damit jedes Bild günstig bleibt.
  if (n >= 11) {
    const [x, y] = ornamentPlatz(o, ORNAMENT_PLATZ[4]);
    kreis(c, x, y + 1.8, 1.5 + 0.2 * Math.sin(t * 7.3), "#fff3c8");
  }
  if (n >= 17) {
    const [x, y] = ornamentPlatz(o, ORNAMENT_PLATZ[10]);
    const fl = 1 + Math.sin(t * 8.6) * 0.12;
    ell(c, x, y - 8, 1.4, 3 * fl, "#ffd98a");
    ell(c, x, y - 7.4, 0.7, 1.5 * fl, "#fff6d6");
  }
  if (n >= 19) {
    laufe(o, 68, (x, y, nx, ny, aussen, i) => {
      kreis(c, x + nx * (aussen - 2.2), y + ny * (aussen - 2.2), 1.8, `rgba(255,232,176,${(0.82 + 0.18 * Math.sin(t * 1.6 + i * 1.3)).toFixed(3)})`);
    });
  }
  eckenListe(o).forEach(([x, y, erreicht, sonntag], i) => {
    if (n >= erreicht || advent >= sonntag) kugel(c, x, y, advent >= sonntag, t, i * 1.7);
  });
  if (n >= 24) grosserStern(c, o.mx, o.y0 - 6, t);
}

/** Goldener Schimmer für das Stück, das gerade neu dazugekommen ist (`k` läuft 0 → 1). */
export function adventSchmuckGlanz(c: C, r: Rect, index: number, k: number): void {
  const [x, y] = adventSchmuckOrt(r, index);
  const verlauf = Math.max(0, Math.min(1, k));
  const radius = 10 + verlauf * 40;
  schein(c, x, y, radius, 0.7 * (1 - verlauf), "255,244,210");
  c.strokeStyle = `rgba(255,240,200,${(0.6 * (1 - verlauf)).toFixed(3)})`;
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(x, y, 8 + verlauf * 34, 0, TAU);
  c.stroke();
}
