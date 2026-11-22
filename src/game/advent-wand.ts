/* =======================================================================
   DER KLEINE KALENDER AN DER WAND — geschmückt wie der große
   (Weihnachtshaus)

   Die Miniatur hat dieselbe Größe und dasselbe Türchen-Layout wie der
   klassische Wandkalender (34×34, Aufhängung oben, goldene 24). Dazu trägt
   sie denselben Schmuck wie die große Tafel, nur kleinteilig: die
   Tannenzweig-Umrandung in sechs Stücken, die zwölf Schmuckstücke als kleine
   Farbpunkte an denselben Plätzen, Lichterkette, Perlschnur, Eiszapfen,
   Schneeflocken, Engel und der große Stern – und an den vier Ecken
   Glaskugeln, die ab dem echten Adventssonntag leuchten. Offene Türchen
   zeigen als dunkle Gegenstandsfächer mit Goldpunkt; die Lampen am Innenrand
   zählen die offenen Türchen mit.

   Alles handgezeichnet mit Canvas-Grundformen, keine Bild- oder Fontdateien.
   ======================================================================= */

import { ADVENT_TAGE, ADVENT_WAND, RAHMEN, adventMischung } from "./advent";
import { adventSchmuckOrt } from "./advent-schmuck";
import { GOLD, GOLD_HELL, kreis, rand, stern, strich, type C } from "./advent-weltraum";

const GOLD_TIEF = "#c49a35";
const WALNUSS = "#5a3a20";
const HOLZ = "#8a5f38";
const FILZ = "#5c1f18";

/** Farbe und Radius der zwölf Schmuckstücke für die Türchen 7–18 (Index 0–11). */
const SCHMUCK: readonly (readonly [string, number])[] = [
  [GOLD, 0.9], ["#d9483d", 0.7], ["#8a5a2e", 0.7], ["#d9b56a", 0.8], ["#ffd98a", 0.9],
  [GOLD_HELL, 0.7], ["#4c2f18", 0.8], ["#c9453a", 0.8], ["#e8c25a", 0.8], ["#c9453a", 0.8], ["#ffe2a0", 0.8], ["#f7f4ec", 0.7],
];

/** Ein Stück Tannenzweig entlang einer Kante der kleinen Tafel. */
function miniZweig(c: C, x0: number, y0: number, x1: number, y1: number, seed: number): void {
  strich(c, x0, y0, x1, y1, "#4a2f17", 0.9);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const laenge = Math.hypot(dx, dy);
  const ux = dx / laenge;
  const uy = dy / laenge;
  const nx = -uy; // nach außen (die Umrundung läuft im Uhrzeigersinn)
  const ny = ux;
  c.lineCap = "round";
  for (let d = 0; d <= laenge; d += 1.5) {
    const w = Math.sin(d * 4 + seed) * 0.3;
    const px = x0 + ux * d + nx * w;
    const py = y0 + uy * d + ny * w;
    for (let n = 0; n < 4; n++) {
      const nachAussen = n < 3;
      const a = Math.atan2(nachAussen ? ny : -ny, nachAussen ? nx : -nx)
        + (n - 1) * 0.55 + (rand(d * 17 + n + seed) - 0.5) * 0.3;
      const l = (nachAussen ? 2.3 : 0.9) * (0.7 + rand(d * 5 + n * 3) * 0.5);
      c.strokeStyle = n === 0 ? "#1f4530" : n === 1 ? "#2e5c40" : n === 2 ? "#3f7f52" : "#1f4530";
      c.lineWidth = 0.45;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
      c.stroke();
    }
  }
}

/** Läuft die kleine Umrundung im Uhrzeigersinn ab (unten links beginnend) und ruft `fn` an Punkten im Abstand `abstand`. */
function amRand(x0: number, y0: number, x1: number, y1: number, abstand: number, fn: (x: number, y: number) => void): void {
  const seiten: readonly (readonly [number, number, number, number])[] = [
    [x0, y1, x1, y1], [x1, y1, x1, y0], [x1, y0, x0, y0], [x0, y0, x0, y1],
  ];
  for (const [ax, ay, ex, ey] of seiten) {
    const laenge = Math.hypot(ex - ax, ey - ay);
    const anzahl = Math.max(1, Math.round(laenge / abstand));
    for (let i = 0; i < anzahl; i++) {
      const d = (i + 0.5) / anzahl;
      fn(ax + (ex - ax) * d, ay + (ey - ay) * d);
    }
  }
}

/** Bildet einen Punkt der großen Tafel auf die kleine Umrundung ab. */
function klein(px: number, py: number, x0: number, y0: number, x1: number, y1: number): [number, number] {
  return [
    x0 + ((px - (RAHMEN.x - 20)) / RAHMEN.w) * (x1 - x0),
    y0 + ((py - (RAHMEN.y - 20)) / RAHMEN.h) * (y1 - y0),
  ];
}

/** Glaskugel für eine Ecke; `an` = sie leuchtet warm. */
function kugel(c: C, x: number, y: number, an: boolean): void {
  if (an) kreis(c, x, y, 2.6, "rgba(255,190,90,.26)");
  kreis(c, x, y, 1.15, an ? "#f5a93f" : "#c9453a");
  kreis(c, x - 0.35, y - 0.38, 0.38, an ? "#ffe9b0" : "#ea8a80");
}

/**
 * Der kleine Kalender an der Wohnzimmerwand im Weihnachtshaus – dieselbe
 * Größe (34×34) und dasselbe Türchen-Layout wie der klassische Kalender,
 * mit dem Schmuck der großen Tafel. `offen` = offene Türchen, `sonntage`
 * = erreichte Adventssonntage (0–4).
 */
export function adventWandWeihnacht(c: C, offen: number[], jahr: number, sonntage: number): void {
  const { x, y, w, h } = ADVENT_WAND;
  const mx = x + w / 2;
  const n = Math.max(0, Math.min(ADVENT_TAGE, Math.round(offen.length)));
  const advent = Math.max(0, Math.min(4, Math.round(sonntage)));

  // Umrundung aus Tannenzweigen, knapp außerhalb des Rahmens
  const x0 = x - 3.8;
  const y0 = y - 3.8;
  const x1 = x + w + 3.8;
  const y1 = y + h + 3.8;

  // Aufhängung: vor dem 24. Türchen die klassische Schlaufe, danach der Stern
  if (n >= 24) {
    strich(c, mx, y - 8, mx, y0 - 2.2, "#8a6a25", 0.7);
    kreis(c, mx, y0 - 1.4, 2.6, "rgba(255,214,120,.3)");
    stern(c, mx, y0 - 1.4, 1.9, GOLD_TIEF, 8, 0.42, -Math.PI / 2 + Math.PI / 8);
    stern(c, mx, y0 - 1.4, 1.5, GOLD, 4, 0.4);
    kreis(c, mx, y0 - 1.4, 0.4, "#fff8dc");
  } else {
    strich(c, mx, y - 5, mx, y - 1, "#8a6a25", 1);
    kreis(c, mx, y - 6, 1.1, "#caa43f");
  }

  // Tannenzweig-Umrandung in sechs Stücken, gleiche Reihenfolge wie beim großen Kalender
  const stuecke: readonly (readonly [number, number, number, number])[] = [
    [x0, y1, mx, y1], [mx, y1, x1, y1], [x1, y1, x1, y0], [x1, y0, mx, y0], [mx, y0, x0, y0], [x0, y0, x0, y1],
  ];
  for (let i = 0; i < Math.min(n, 6); i++) {
    const [sx, sy, ex, ey] = stuecke[i];
    miniZweig(c, sx, sy, ex, ey, i * 3.1);
  }

  // Rahmen und Filz wie beim klassischen Kalender
  c.fillStyle = WALNUSS;
  c.fillRect(x - 2, y - 2, w + 4, h + 4);
  c.fillStyle = HOLZ;
  c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = FILZ;
  c.fillRect(x, y, w, h);
  c.strokeStyle = "rgba(232,194,90,.55)";
  c.lineWidth = 0.7;
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  // Goldene 24 oben, wie beim klassischen Kalender
  c.font = '700 5px "Space Grotesk", sans-serif';
  c.textAlign = "center";
  c.fillStyle = GOLD;
  c.fillText("24", mx, y + 8);
  c.textAlign = "left";

  // 24 Türchen in derselben Jahresmischung und im selben Layout wie der große Kalender
  const mischung = adventMischung(jahr);
  const zellenW = (w - 6) / 6;
  const zellenH = (h - 13) / 4;
  for (let i = 0; i < ADVENT_TAGE; i++) {
    const sp = i % 6;
    const ze = Math.floor(i / 6);
    const tx = x + 3 + sp * zellenW;
    const ty = y + 12 + ze * zellenH;
    const dw = zellenW - 1.3;
    const dh = zellenH - 1.3;
    if (offen.includes(mischung[i])) {
      // offen: dunkler Gegenstandsplatz mit Goldpunkt, wie im großen Kalender
      c.fillStyle = "#111c3a";
      c.fillRect(tx, ty, dw, dh);
      c.fillStyle = GOLD;
      c.fillRect(tx + 0.4, ty + 0.4, 0.6, 0.6);
      c.fillRect(tx + dw - 1, ty + dh - 1, 0.6, 0.6);
    } else {
      c.fillStyle = "#6b4423";
      c.fillRect(tx, ty, dw, dh);
      c.fillStyle = "rgba(240,229,205,.85)";
      c.fillRect(tx + dw / 2 - 0.45, ty + dh / 2 - 0.55, 0.9, 1.1);
    }
  }

  // Lampen am Innenrand, ringförmig wie beim großen Kalender: eine je offenem Türchen
  for (let i = 0; i < n; i++) {
    let lx: number;
    let ly: number;
    if (i < 8) {
      lx = x + ((i + 0.5) * w) / 8;
      ly = y + 2;
    } else if (i < 12) {
      lx = x + w - 2;
      ly = y + ((i - 7.5) * h) / 4;
    } else if (i < 20) {
      lx = x + ((19.5 - i) * w) / 8;
      ly = y + h - 2;
    } else {
      lx = x + 2;
      ly = y + ((23.5 - i) * h) / 4;
    }
    kreis(c, lx, ly, 0.42, "#ffe2a0");
  }

  // Zwölf Schmuckstücke als Farbpunkte dort, wo sie am großen Kalender hängen
  for (let i = 6; i < Math.min(n, 18); i++) {
    const [px, py] = adventSchmuckOrt(RAHMEN, i);
    const [qx, qy] = klein(px, py, x0, y0, x1, y1);
    const [farbe, r] = SCHMUCK[i - 6];
    if (i === 10 || i === 16) kreis(c, qx, qy, r * 2.2, "rgba(255,222,150,.3)");
    kreis(c, qx, qy, r, farbe);
    kreis(c, qx - r * 0.3, qy - r * 0.3, r * 0.3, "rgba(255,255,255,.7)");
  }

  // Der Abschluss: Lichterkette, Perlschnur, Eiszapfen, Schneeflocken, Engel
  if (n >= 19) {
    amRand(x0, y0, x1, y1, 2.6, (px, py) => {
      kreis(c, px, py, 0.9, "rgba(255,224,150,.28)");
      kreis(c, px, py, 0.38, "#ffe8b0");
    });
  }
  if (n >= 20) {
    amRand(x0, y0, x1, y1, 1.3, (px, py) => kreis(c, px, py, 0.2, GOLD_HELL));
  }
  if (n >= 21) {
    for (let i = 0; i < 6; i++) {
      const px = x0 + 2.5 + i * ((x1 - x0 - 5) / 5);
      strich(c, px, y1 + 0.4, px, y1 + 1.3 + rand(i + 5) * 1.3, "rgba(214,236,255,.9)", 0.5);
    }
  }
  if (n >= 22) {
    amRand(x0, y0, x1, y1, (2 * ((x1 - x0) + (y1 - y0))) / 6.6, (px, py) => kreis(c, px, py, 0.4, "rgba(244,249,255,.95)"));
  }
  if (n >= 23) {
    const [px, py] = adventSchmuckOrt(RAHMEN, 22);
    const [qx, qy] = klein(px, py, x0, y0, x1, y1);
    kreis(c, qx, qy - 0.6, 0.8, "#f3e7cd");
    kreis(c, qx, qy - 1.7, 0.45, "#f1c9a5");
  }

  // Vier Ecken-Kugeln: erreicht wie beim großen Kalender, leuchten ab ihrem Adventssonntag
  const ecken: readonly (readonly [number, number, number, number])[] = [
    [x0, y0, 5, 1], [x1, y0, 3, 2], [x0, y1, 1, 3], [x1, y1, 2, 4],
  ];
  for (const [ex, ey, erreicht, sonntag] of ecken) {
    if (n >= erreicht || advent >= sonntag) kugel(c, ex, ey, advent >= sonntag);
  }
}
