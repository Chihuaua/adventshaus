/* =======================================================================
   GRUSELHAUS · RAUM 01 · HORROR-RAUMSTATION  („Die letzte Station“)
   Ehemals Zockerzimmer, Dachgeschoss links (x 262 – 530, Boden y 200).

   Alles ist mit Canvas-Primitiven gezeichnet, ohne Texturen oder Bilder.
   Materialien entstehen aus Farbe und Muster:
     Metall = graue Fläche, dunklere Linien als Plattenstöße, helle Nieten
     Rost   = orangebraune, unregelmäßig abgerundete Flecken
     Glas   = dunkle Fläche mit hellen Reflexlinien
     Kabel  = schwarze Linien mit kleinen farbigen Steckern

   Geometrie, Position und Funktion der Möbel bleiben die des Zockerzimmers:
     Sitzsack      -> Astronautensessel   (gleiche Sitzhöhe, gleicher Platz)
     Fernsehregal  -> Kontrollterminal    (Bildschirm bleibt (410,137,54,34); das
                                           Spielmodul steckt wie vorher bei (446,167),
                                           die Taste sitzt bei (458,168))
     Spieleregal   -> Lagerregal          (Modulfach bleibt (499,135), 6 x 11)
   Dadurch greifen alle Stationen, Laufwege und Animationen unverändert.

   Dieses Modul importiert nichts aus house.ts (kein Zirkelbezug); alles, was
   es vom Haus braucht, kommt als Parameter.
   ======================================================================= */

import { drawPixelText } from "../pixel";

type C = CanvasRenderingContext2D;
type Pt = [number, number];

/** Raumgrenzen und Boden – deckungsgleich mit dem Zockerzimmer. */
export const RAUM1 = { x0: 262, x1: 530, boden: 200 } as const;

/** Farbpalette laut Raumauftrag. */
const COL = {
  wand: "#4a4a5a",
  boden: "#5a5a6a",
  decke: "#3a3a4a",
  rost: "#8b4513",
  warn: "#ff6600",
  monitor: "#003300",
  monitorText: "#00ff00",
  notlicht: "#ff0000",
  notlichtAus: "#8b0000",
  fenster: "#1a2a4a",
  stern: "#ffffff",
  stahl: "#6a6a7a",
  dunkel: "#2b2b35",
} as const;

/** Positionen der Einzelteile, an einer Stelle gebündelt (auch für Tests). */
export const RS = {
  fenster: { x: 358, y: 121, r: 19 },
  schalter: { x: 370, y: 148, w: 24, h: 19 },
  kabel: { x: 392, laenge: 40 },
  lampe: { x: 430, laenge: 36 },
  terminal: { x: 404 },
  sessel: { x: 296 },
  regal: { x: 486, w: 38, h: 74 },
  schleuse: { x: 266 },
} as const;

/* ------------------------------ Hilfsfunktionen ------------------------ */

const hsh = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function rect(c: C, x: number, y: number, w: number, h: number, f: string) {
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
}

function rrect(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  const q = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + q, y);
  c.lineTo(x + w - q, y);
  c.quadraticCurveTo(x + w, y, x + w, y + q);
  c.lineTo(x + w, y + h - q);
  c.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  c.lineTo(x + q, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - q);
  c.lineTo(x, y + q);
  c.quadraticCurveTo(x, y, x + q, y);
  c.closePath();
  c.fillStyle = f;
  c.fill();
}

function disc(c: C, x: number, y: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function poly(c: C, pts: Pt[], f: string) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = f;
  c.fill();
}

function line(c: C, x1: number, y1: number, x2: number, y2: number, col: string, w = 1) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

/** Orange-dunkle Warnstreifen in einem Rechteck. */
function warnstreifen(c: C, x: number, y: number, w: number, h: number) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  rect(c, x, y, w, h, COL.dunkel);
  for (let k = -h; k < w + h; k += 8) {
    poly(c, [[x + k, y + h], [x + k + 4, y + h], [x + k + 4 + h, y], [x + k + h, y]], COL.warn);
  }
  c.restore();
}

/** Unregelmäßiger, abgerundeter Rostfleck mit kleinen Nebenflecken. */
function rostfleck(c: C, x: number, y: number, r: number, seed: number, alpha = 0.62) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = COL.rost;
  c.beginPath();
  c.ellipse(x, y, r, r * 0.72, hsh(seed) * 1.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + r * 0.7, y - r * 0.3, r * 0.5, r * 0.38, 0.4, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = alpha * 0.8;
  c.beginPath();
  c.ellipse(x - r * 0.6, y + r * 0.5, r * 0.34, r * 0.26, 0, 0, Math.PI * 2);
  c.fill();
  // dunklerer Kern
  c.globalAlpha = alpha * 0.5;
  c.fillStyle = "#5a2d0c";
  c.beginPath();
  c.ellipse(x - r * 0.1, y, r * 0.4, r * 0.28, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Fremde Schriftzeichen aus Dreiecken, Kreisen, Strichen und Kreuzen. */
function alienZeichen(c: C, x: number, y: number, w: number, h: number, seed: number, col: string) {
  c.save();
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 0.9;
  c.lineCap = "round";
  const zell = 6;
  const cols = Math.max(1, Math.floor(w / zell));
  const rows = Math.max(1, Math.floor(h / zell));
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const n = hsh(seed * 7 + r * 13 + k * 3);
      const cx = x + k * zell + zell / 2;
      const cy = y + r * zell + zell / 2;
      if (n < 0.2) continue;
      if (n < 0.4) {
        c.beginPath();
        c.moveTo(cx, cy - 2);
        c.lineTo(cx + 2, cy + 1.6);
        c.lineTo(cx - 2, cy + 1.6);
        c.closePath();
        c.stroke();
      } else if (n < 0.6) {
        c.beginPath();
        c.arc(cx, cy, 1.7, 0, Math.PI * 2);
        c.stroke();
      } else if (n < 0.78) {
        c.beginPath();
        c.moveTo(cx - 2, cy);
        c.lineTo(cx + 2, cy);
        c.stroke();
      } else {
        c.beginPath();
        c.moveTo(cx - 1.6, cy - 1.6);
        c.lineTo(cx + 1.6, cy + 1.6);
        c.moveTo(cx + 1.6, cy - 1.6);
        c.lineTo(cx - 1.6, cy + 1.6);
        c.stroke();
      }
    }
  }
  c.restore();
}

/* ====================================================================== */
/*  ARCHITEKTUR                                                           */
/* ====================================================================== */

/**
 * Metallwand mit Plattenstößen, Nieten, Rostflecken und beschädigten Stellen,
 * dazu das Deckenband mit Streben. Wird innerhalb des Dachclips gezeichnet.
 */
export function drawMetalWall(
  c: C,
  x0: number,
  x1: number,
  yTop: number,
  yBot: number,
  atticCeil: (x: number) => number,
) {
  rect(c, x0, yTop, x1 - x0, yBot - yTop, COL.wand);

  // Plattenstöße: senkrecht alle 44, waagerecht alle 38
  c.strokeStyle = "#3a3a49";
  c.lineWidth = 1.2;
  for (let x = x0 + 22; x < x1; x += 44) {
    c.beginPath();
    c.moveTo(x, yTop);
    c.lineTo(x, yBot);
    c.stroke();
  }
  for (let y = yBot - 36; y > yTop; y -= 38) {
    c.beginPath();
    c.moveTo(x0, y);
    c.lineTo(x1, y);
    c.stroke();
  }
  // Nieten an den Kreuzungen
  for (let x = x0 + 22; x < x1; x += 44) {
    for (let y = yBot - 36; y > yTop; y -= 38) {
      disc(c, x - 3, y - 3, 0.9, "#6c6c7c");
      disc(c, x + 3, y - 3, 0.9, "#6c6c7c");
    }
  }
  // helle Kante rechts von jedem Stoß (Plattenrand)
  c.strokeStyle = "rgba(255,255,255,.07)";
  for (let x = x0 + 22; x < x1; x += 44) {
    c.beginPath();
    c.moveTo(x + 1.2, yTop);
    c.lineTo(x + 1.2, yBot);
    c.stroke();
  }

  // beschädigte Stellen: dunklere Platten mit gezackter Kante
  for (const [bx, by, bw, bh] of [[432, 98, 24, 24], [296, 160, 20, 22]] as [number, number, number, number][]) {
    c.beginPath();
    c.moveTo(bx, by);
    for (let k = 1; k <= 5; k++) c.lineTo(bx + (bw * k) / 5, by + (k % 2 ? 3 : -1));
    for (let k = 1; k <= 5; k++) c.lineTo(bx + bw + (k % 2 ? 2 : -2), by + (bh * k) / 5);
    for (let k = 4; k >= 0; k--) c.lineTo(bx + (bw * k) / 5, by + bh + (k % 2 ? -3 : 2));
    for (let k = 4; k >= 1; k--) c.lineTo(bx + (k % 2 ? 2 : -2), by + (bh * k) / 5);
    c.closePath();
    c.fillStyle = "#34343f";
    c.fill();
    c.strokeStyle = "#25252e";
    c.lineWidth = 0.9;
    c.stroke();
  }

  // Rostflecken
  const rost: [number, number, number][] = [
    [276, 126, 5], [291, 152, 4], [313, 176, 4.4], [348, 142, 6], [391, 120, 4],
    [420, 154, 5], [466, 124, 6], [486, 106, 5], [512, 172, 4], [372, 184, 4],
    [446, 186, 3.6], [276, 184, 4.6],
  ];
  rost.forEach(([x, y, r], i) => rostfleck(c, x, y, r, i + 1));

  // Sockel
  rect(c, x0, yBot - 5, x1 - x0, 5, "rgba(0,0,0,.28)");

  // Decke: dunkleres Band entlang der Dachschräge
  const peak = 470;
  poly(
    c,
    [
      [x0, atticCeil(x0)],
      [peak, atticCeil(peak)],
      [x1, atticCeil(x1)],
      [x1, atticCeil(x1) + 9],
      [peak, atticCeil(peak) + 9],
      [x0, atticCeil(x0) + 9],
    ],
    COL.decke,
  );
  // Streben senkrecht zur Schräge, alle 36
  c.strokeStyle = "#31313e";
  c.lineWidth = 3;
  c.lineCap = "butt";
  for (let x = x0 + 14; x < x1; x += 36) {
    c.beginPath();
    c.moveTo(x, atticCeil(x) + 8);
    c.lineTo(x, atticCeil(x) + 17);
    c.stroke();
  }
}

/** Metallboden: Plattenfugen, dunklere beschädigte Platten, Rostpunkte. */
export function drawMetalFloor(c: C, x0: number, x1: number, F: number) {
  rect(c, x0, F, x1 - x0, 6, COL.boden);
  // Plattenfugen
  for (let x = x0 + 30; x < x1; x += 34) rect(c, x, F, 1, 6, "rgba(20,20,30,.5)");
  // waagerechte Linie als Plattenstoß
  rect(c, x0, F + 3, x1 - x0, 1, "rgba(20,20,30,.3)");
  // einzelne dunklere, „beschädigte“ Platten
  for (const [px, pw] of [[x0 + 64, 32], [x0 + 150, 28], [x0 + 216, 24]] as [number, number][]) {
    rect(c, px, F, pw, 6, "#4a4a58");
    rect(c, px, F, pw, 1, "rgba(0,0,0,.25)");
  }
  // Rostpunkte
  for (let i = 0; i < 12; i++) {
    disc(c, x0 + 8 + hsh(i + 70) * (x1 - x0 - 16), F + 1.4 + hsh(i + 90) * 3.6, 0.8 + hsh(i + 50) * 0.6, "#c8651e");
  }
  rect(c, x0, F, x1 - x0, 1.4, "rgba(255,255,255,.2)");
}

/** Stahlträger statt Holzbalken: gleicher Platz wie der alte Dachbalken. */
export function drawSteelBeam(c: C, x0: number, x1: number, y: number, h: number) {
  rect(c, x0, y, x1 - x0, h, "#44444f");
  rect(c, x0, y, x1 - x0, 1.6, "rgba(255,255,255,.2)");
  rect(c, x0, y + h - 1.2, x1 - x0, 1.2, "rgba(0,0,0,.35)");
  for (let x = x0 + 8; x < x1; x += 24) disc(c, x, y + h / 2, 0.9, "#7c7c8a");
}

/** Rundes Raumschiff-Bullauge mit Sternenhimmel und einem kleinen Gast. */
export function drawSpaceWindow(c: C, cx: number, cy: number, r: number) {
  // Rahmen
  disc(c, cx, cy, r + 5.2, "#6a6a78");
  disc(c, cx, cy, r + 2.8, "#4e4e5c");
  c.strokeStyle = "rgba(255,255,255,.22)";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(cx, cy, r + 4.4, Math.PI * 1.05, Math.PI * 1.6);
  c.stroke();
  // Glas
  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.clip();
  rect(c, cx - r, cy - r, r * 2, r * 2, COL.fenster);
  for (let i = 0; i < 22; i++) {
    const a = hsh(i + 3) * Math.PI * 2;
    const d = Math.sqrt(hsh(i + 30)) * (r - 1);
    disc(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.45 + hsh(i + 60) * 0.55, COL.stern);
  }
  // zwei hellere Sterne mit Kreuz
  for (const [dx, dy] of [[-8, -7], [9, -3]] as Pt[]) {
    line(c, cx + dx - 2, cy + dy, cx + dx + 2, cy + dy, "rgba(255,255,255,.8)", 0.6);
    line(c, cx + dx, cy + dy - 2, cx + dx, cy + dy + 2, "rgba(255,255,255,.8)", 0.6);
  }
  // kleiner grüner Alien-Schatten unten rechts
  const ax = cx + 7;
  const ay = cy + 10;
  c.fillStyle = "#0b3d1c";
  c.beginPath();
  c.ellipse(ax, ay - 3, 4.6, 5.6, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(ax - 2.6, ay - 7.6);
  c.lineTo(ax - 4.6, ay - 12);
  c.moveTo(ax + 2.6, ay - 7.6);
  c.lineTo(ax + 4.6, ay - 12);
  c.strokeStyle = "#0b3d1c";
  c.lineWidth = 1;
  c.stroke();
  disc(c, ax - 4.8, ay - 12.4, 1, "#0b3d1c");
  disc(c, ax + 4.8, ay - 12.4, 1, "#0b3d1c");
  c.restore();
  // Reflexlinien
  c.strokeStyle = "rgba(255,255,255,.45)";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(cx, cy, r - 3, Math.PI * 1.08, Math.PI * 1.5);
  c.stroke();
  c.beginPath();
  c.arc(cx, cy, r - 6, Math.PI * 1.12, Math.PI * 1.3);
  c.stroke();
  // Schrauben
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const px = cx + Math.cos(a) * (r + 4);
    const py = cy + Math.sin(a) * (r + 4);
    disc(c, px, py, 1, "#e8e8f0");
    line(c, px - 0.7, py - 0.2, px + 0.7, py + 0.2, "#6a6a78", 0.5);
  }
}

/**
 * Schleuse am Zugang von der Treppe. Das Schott ist hochgefahren und zeigt
 * seine Unterkante mit Warnstreifen, dem runden Fenster und dem Hebelgriff;
 * die Öffnung bleibt frei begehbar (nur Optik, keine neue Funktion).
 */
export function drawSchleuse(c: C, x: number, F: number) {
  const w = 26;
  const kopf = 112;
  const kopfH = 18;
  // Pfosten mit Warnstreifen
  warnstreifen(c, x, kopf, 4, F - kopf);
  warnstreifen(c, x + w - 4, kopf, 4, F - kopf);
  // Schott (hochgefahren): schwere Platte
  rrect(c, x - 1, kopf, w + 2, kopfH, 3, "#3f3f4c");
  rect(c, x - 1, kopf, w + 2, 1.6, "rgba(255,255,255,.18)");
  warnstreifen(c, x - 1, kopf + kopfH - 4, w + 2, 4);
  // rundes Fenster in der Tür
  disc(c, x + 9, kopf + 7, 4.4, "#6a6a78");
  disc(c, x + 9, kopf + 7, 3.2, "#0f1a30");
  line(c, x + 7, kopf + 5.6, x + 9, kopf + 4.4, "rgba(255,255,255,.6)", 0.7);
  // Hebelgriff
  line(c, x + 17, kopf + 7, x + 22, kopf + 3.4, "#b0b0bc", 1.6);
  disc(c, x + 22.4, kopf + 3.2, 1.5, "#d8d8e4");
  disc(c, x + 17, kopf + 7, 1.8, "#8a8a98");
  // Schwelle
  warnstreifen(c, x, F - 3, w, 3);
  // Notausgang-Schild darüber
  drawExitSign(c, x + 1, kopf - 17);
}

/** Notausgang: grüne Tafel mit laufendem Strichmännchen. */
function drawExitSign(c: C, x: number, y: number) {
  rrect(c, x, y, 24, 12, 2, "#1d8f44");
  rect(c, x + 1, y + 1, 22, 10, "#23a850");
  // Figur
  const px = x + 8;
  const py = y + 2.4;
  disc(c, px + 1.4, py + 0.8, 1.1, "#ffffff");
  line(c, px + 1, py + 2, px - 0.2, py + 5.4, "#ffffff", 1);
  line(c, px - 0.2, py + 5.4, px - 1.8, py + 7.2, "#ffffff", 1);
  line(c, px - 0.2, py + 5.4, px + 1.6, py + 7.2, "#ffffff", 1);
  line(c, px + 0.8, py + 3, px + 3.4, py + 4, "#ffffff", 1);
  line(c, px + 0.8, py + 3, px - 1.2, py + 4.4, "#ffffff", 1);
  // Pfeil
  line(c, x + 14, y + 6, x + 20, y + 6, "#ffffff", 1);
  poly(c, [[x + 20, y + 3.6], [x + 22.6, y + 6], [x + 20, y + 8.4]], "#ffffff");
}

/* ====================================================================== */
/*  MÖBEL                                                                 */
/* ====================================================================== */

/**
 * Kontrollterminal anstelle des Fernsehregals. Der Bildschirm sitzt exakt dort,
 * wo der Fernseher war, damit TV-Inhalte, Spiel-Zoom, Modulschacht und Taste
 * unverändert funktionieren.
 */
export function drawControlTerminal(c: C, x: number, F: number) {
  // schwacher grüner Schein der Bildschirme (stabil, kein Flackern)
  const g = c.createRadialGradient(x + 33, F - 46, 4, x + 33, F - 46, 54);
  g.addColorStop(0, "rgba(0,255,90,.17)");
  g.addColorStop(1, "rgba(0,255,90,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x + 33, F - 46, 54, 0, Math.PI * 2);
  c.fill();

  // Kabel zur Wand (zum Lüftungsgitter links)
  c.strokeStyle = "#111118";
  c.lineWidth = 1.6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x, F - 12);
  c.quadraticCurveTo(x - 8, F - 1.5, x - 18, F - 2);
  c.quadraticCurveTo(x - 24, F - 2, x - 28, F - 10);
  c.stroke();
  rect(c, x - 30, F - 14, 3, 4, "#2a2a30");

  // Sockel
  rrect(c, x, F - 22, 66, 22, 3, "#3a3a4a");
  rect(c, x, F - 8, 66, 2, COL.warn);
  rect(c, x + 2, F - 21, 62, 1.2, "rgba(255,255,255,.14)");
  // Tastatur: Reihe kleiner Rechtecke
  for (let i = 0; i < 9; i++) rect(c, x + 4 + i * 4.4, F - 17, 3.4, 2.6, "#7a7a8a");
  for (let i = 0; i < 8; i++) rect(c, x + 6 + i * 4.4, F - 13.4, 3.4, 2.6, "#6a6a7a");
  // Knöpfe rot/grün
  const kn: [number, number, string][] = [[x + 46, F - 15, "#d92b2b"], [x + 52, F - 15, "#2bd94a"], [x + 58, F - 15, "#d92b2b"], [x + 49, F - 11, "#2bd94a"], [x + 55, F - 11, "#e8c02b"]];
  for (const [kx, ky, kc] of kn) disc(c, kx, ky, 1.5, kc);

  // Bildschirmgehäuse: schräge Vorderseite
  poly(c, [[x - 2, F - 22], [x + 1, F - 69], [x + 65, F - 69], [x + 68, F - 22]], "#3a3a4a");
  rect(c, x + 1, F - 69, 64, 2.4, COL.warn);
  line(c, x - 2, F - 22, x + 1, F - 69, "rgba(255,102,0,.55)", 1);
  line(c, x + 68, F - 22, x + 65, F - 69, "rgba(255,102,0,.55)", 1);
  // Rahmen und Hauptbildschirm (410,137,54,34)
  rect(c, x + 4, F - 65, 58, 40, "#22222c");
  rect(c, x + 6, F - 63, 54, 34, COL.monitor);
  alienZeichen(c, x + 8, F - 61, 28, 18, 1, COL.monitorText);
  // Radar
  c.strokeStyle = COL.monitorText;
  c.lineWidth = 0.8;
  c.beginPath();
  c.arc(x + 48, F - 52, 8, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.arc(x + 48, F - 52, 4, 0, Math.PI * 2);
  c.stroke();
  line(c, x + 40, F - 52, x + 56, F - 52, COL.monitorText, 0.6);
  line(c, x + 48, F - 60, x + 48, F - 44, COL.monitorText, 0.6);
  disc(c, x + 51, F - 55, 1.2, COL.monitorText);
  alienZeichen(c, x + 8, F - 41, 40, 10, 5, COL.monitorText);
  // Bildschirm-Glanz
  rect(c, x + 6, F - 63, 54, 1, "rgba(255,255,255,.1)");

  // zwei kleine Zusatzmonitore auf dem Gehäuse
  for (const [mx, seed] of [[x + 4, 11], [x + 42, 12]] as [number, number][]) {
    rect(c, mx + 8, F - 72, 4, 4, "#2d2d38");
    rrect(c, mx, F - 82, 20, 11, 1.6, "#2d2d38");
    rect(c, mx + 1.5, F - 80.5, 17, 8, "#0c1d3a");
    alienZeichen(c, mx + 2.5, F - 79.5, 15, 6, seed, COL.monitorText);
  }
}

/** Astronautensessel statt Sitzsack: hohe Lehne, Fuß mit Rollen, Gurt. */
export function drawAstronautChair(c: C, x: number, F: number) {
  // Fuß: Dreharm mit drei Rollen
  rect(c, x + 37, F - 12, 6, 12, "#5a5a68");
  line(c, x + 26, F - 2.4, x + 54, F - 2.4, COL.stahl, 3);
  for (const rx of [x + 27, x + 40, x + 53]) {
    disc(c, rx, F - 1.2, 2.2, "#16161c");
    disc(c, rx, F - 1.2, 0.8, "#6a6a7a");
  }
  // Rückenlehne (hoch, geschwungen)
  c.beginPath();
  c.moveTo(x + 17, F - 13);
  c.quadraticCurveTo(x + 13, F - 40, x + 15, F - 61);
  c.quadraticCurveTo(x + 24, F - 67, x + 34, F - 61);
  c.quadraticCurveTo(x + 36, F - 40, x + 35, F - 18);
  c.closePath();
  c.fillStyle = COL.rost;
  c.fill();
  // Polsterung: hellere, ausgeblichene Flächen
  c.fillStyle = "#a85a1e";
  c.beginPath();
  c.ellipse(x + 25, F - 42, 5.4, 15, 0.04, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#b66a2a";
  c.beginPath();
  c.ellipse(x + 24, F - 58, 6, 3.4, 0, 0, Math.PI * 2);
  c.fill();
  // dunkle Flecken
  c.fillStyle = "rgba(60,25,5,.5)";
  c.beginPath();
  c.ellipse(x + 20, F - 30, 2.6, 4, 0.3, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + 30, F - 50, 2, 3, -0.2, 0, Math.PI * 2);
  c.fill();
  // Kopfstütze
  rrect(c, x + 12, F - 68, 26, 7, 3.4, "#6f3510");
  // Sitzfläche
  rrect(c, x + 16, F - 21, 44, 9.4, 4.4, COL.rost);
  c.fillStyle = "#a85a1e";
  c.beginPath();
  c.ellipse(x + 38, F - 17.6, 14, 2.4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(60,25,5,.5)";
  c.beginPath();
  c.ellipse(x + 50, F - 14.6, 3.2, 1.4, 0, 0, Math.PI * 2);
  c.fill();
  // Armlehne (geschwungen, dunkler)
  c.strokeStyle = "#5c2c0e";
  c.lineWidth = 4;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x + 22, F - 32);
  c.quadraticCurveTo(x + 40, F - 38, x + 54, F - 28);
  c.stroke();
  line(c, x + 54, F - 28, x + 54, F - 21, "#5c2c0e", 3);
  // Sicherheitsgurt: schwarze Linie über dem Sitz
  line(c, x + 22, F - 52, x + 50, F - 21, "#111118", 2);
  rect(c, x + 48.4, F - 23.6, 4.4, 3.4, "#b0b0bc");
}

/**
 * Lagerregal statt Spieleregal. Das Modulfach liegt wie beim alten Regal bei
 * (x+12,8, F-65), 6 x 11 – dort steckt das Spielmodul, bis Luni es holt.
 */
export function drawStorageShelf(
  c: C,
  x: number,
  F: number,
  w: number,
  h: number,
  golItem?: (c: C, x: number, y: number, w: number, h: number) => void,
) {
  const top = F - h;
  // Pfosten und Rückwand
  rect(c, x, top, 3, h, COL.stahl);
  rect(c, x + w - 3, top, 3, h, COL.stahl);
  rect(c, x + 3, top + 3, w - 6, h - 6, "#4d4d5b");
  rect(c, x, top, w, 3, "#7a7a8a");
  // Böden bei F-54, F-37, F-20, F-3
  const rh = (h - 6) / 4;
  const base = (r: number) => top + 3 + rh * (r + 1);
  for (let r = 0; r < 4; r++) {
    rect(c, x + 3, base(r), w - 6, 2, "#7e7e8e");
    rect(c, x + 3, base(r) + 2, w - 6, 0.8, "rgba(0,0,0,.3)");
  }
  // Reihe 0: kleine Kiste, Modulfach, grüne Kiste
  rect(c, x + 4, base(0) - 10, 8, 10, "#7a5230");
  line(c, x + 4, base(0) - 10, x + 12, base(0), "rgba(0,0,0,.35)", 0.7);
  rect(c, x + 12.2, base(0) - 11.4, 7.2, 11.4, "#1d1d26"); // Fach
  if (golItem) golItem(c, x + 12.8, base(0) - 11, 6, 11);
  rrect(c, x + 21, base(0) - 9, 12, 9, 1, "#2f6b3a");
  line(c, x + 23, base(0) - 7, x + 31, base(0) - 2, "#d92b2b", 1);
  line(c, x + 31, base(0) - 7, x + 23, base(0) - 2, "#d92b2b", 1);
  // Reihe 1: Astronautenhelm und Kiste mit Warnzeichen
  const hx = x + 12;
  const hy = base(1) - 7.4;
  disc(c, hx, hy, 6.4, "#ececf2");
  c.fillStyle = "rgba(0,0,0,.16)";
  c.beginPath();
  c.arc(hx + 1.4, hy + 1.4, 5.4, 0, Math.PI);
  c.fill();
  rrect(c, hx - 1, hy - 3.2, 7.4, 5.6, 2.6, "#10162a");
  line(c, hx + 1, hy - 2, hx + 4, hy - 2.4, "rgba(255,255,255,.55)", 0.8);
  rect(c, hx - 4, hy + 5.4, 8, 2, "#8a8a98");
  rect(c, x + 22, base(1) - 11, 11, 11, "#7a5230");
  poly(c, [[x + 27.5, base(1) - 9.4], [x + 31.2, base(1) - 3.2], [x + 23.8, base(1) - 3.2]], "#f2c230");
  rect(c, x + 27, base(1) - 7.6, 1, 2.6, "#1a1a1a");
  disc(c, x + 27.5, base(1) - 3.8, 0.5, "#1a1a1a");
  // Reihe 2: zwei Kabelrollen, Kiste
  for (const kx of [x + 9, x + 19]) {
    disc(c, kx, base(2) - 4.6, 4.6, "#8a8a98");
    disc(c, kx, base(2) - 4.6, 1.6, "#2a2a32");
    c.strokeStyle = "#16161c";
    c.lineWidth = 0.7;
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.arc(kx, base(2) - 4.6, 2.6 + k * 0.7, 0.3, 5.2);
      c.stroke();
    }
  }
  rect(c, x + 25, base(2) - 9, 8, 9, "#6b4a2a");
  // Reihe 3: große grüne Kiste, kleine Kiste mit Warnzeichen
  rrect(c, x + 5, base(3) - 13, 16, 13, 1, "#2f6b3a");
  line(c, x + 8, base(3) - 10.4, x + 18, base(3) - 2.6, "#d92b2b", 1.2);
  line(c, x + 18, base(3) - 10.4, x + 8, base(3) - 2.6, "#d92b2b", 1.2);
  rect(c, x + 23, base(3) - 9, 10, 9, "#7a5230");
  poly(c, [[x + 28, base(3) - 7.8], [x + 31.4, base(3) - 2.4], [x + 24.6, base(3) - 2.4]], "#f2c230");
  // Rost auf Pfosten und Böden
  rostfleck(c, x + 1.5, top + 22, 3.2, 31, 0.7);
  rostfleck(c, x + w - 1.5, top + 50, 3.4, 32, 0.7);
  rostfleck(c, x + 20, base(2) + 1, 3, 33, 0.55);

  // Alien-Ei oben auf dem Regal, in der Ecke zur Trennwand
  const ex = x + w - 11;
  const ey = top - 8.4;
  c.fillStyle = "#6fa86a";
  c.beginPath();
  c.ellipse(ex, ey, 6, 8.4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#3f7a45";
  for (const [dx, dy, r] of [[-2.4, 2, 1.8], [2.2, -1.6, 1.4], [1, 4.2, 1.2], [-1.6, -4, 1.1]] as [number, number, number][]) {
    c.beginPath();
    c.arc(ex + dx, ey + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.28)";
  c.beginPath();
  c.ellipse(ex - 2.2, ey - 3.4, 1.4, 2.6, -0.4, 0, Math.PI * 2);
  c.fill();
}

/* ====================================================================== */
/*  DETAILS                                                               */
/* ====================================================================== */

/** Hängendes, abgerissenes Kabel. Liefert die Spitze für den Funkeneffekt. */
export function drawHangingCable(c: C, x: number, y: number, laenge: number): Pt {
  rect(c, x - 2, y - 1, 5, 3, "#2a2a32");
  c.strokeStyle = "#101016";
  c.lineWidth = 1.9;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x, y + 1);
  c.quadraticCurveTo(x - 3, y + laenge * 0.5, x + 1.5, y + laenge);
  c.stroke();
  // Aderenden: rot, blau, gelb, grün
  const tipX = x + 1.5;
  const tipY = y + laenge;
  const ader: [number, string][] = [[-3.2, "#d92b2b"], [-1.1, "#2b5fd9"], [1.1, "#e8c02b"], [3.2, "#2bb04a"]];
  for (const [dx, col] of ader) {
    line(c, tipX, tipY, tipX + dx, tipY + 4, col, 0.9);
    rect(c, tipX + dx - 0.8, tipY + 4, 1.6, 2.2, col);
  }
  return [tipX, tipY + 3];
}

/** Rote Notleuchte an der Decke; im Normalzustand aus. */
export function drawEmergencyLight(c: C, x: number, y: number, an: boolean) {
  rect(c, x, y, 10, 4, an ? COL.notlicht : "#4d1620");
  rect(c, x - 1, y - 0.6, 12, 1.4, "#33333f");
  if (an) {
    const g = c.createRadialGradient(x + 5, y + 2, 1, x + 5, y + 2, 24);
    g.addColorStop(0, "rgba(255,0,0,.3)");
    g.addColorStop(1, "rgba(255,0,0,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x + 5, y + 2, 24, 0, Math.PI * 2);
    c.fill();
  }
}

/** Notfallschalter mit Beschriftung aus der Pixelschrift des Hauses. */
export function drawEmergencySwitch(c: C, x: number, y: number, w: number, h: number, hell: boolean) {
  rrect(c, x, y, w, h, 2, "#2a2a32");
  rrect(c, x + 1.5, y + 1.5, w - 3, h - 3, 1.4, hell ? COL.notlicht : COL.notlichtAus);
  drawPixelText(c, "ON", x + 3.5, y + 2.6, 1, "#ffffff", 1);
  drawPixelText(c, "OFF", x + 3.5, y + 9.8, 1, "#ffffff", 1);
}

function drawExtinguisher(c: C, x: number, y: number) {
  rrect(c, x, y + 5, 8, 26, 3, "#c92a2a");
  rect(c, x + 1, y + 14, 6, 6, "#efe6d2");
  rect(c, x + 2.4, y + 2, 3.2, 4, "#2a2a32");
  line(c, x + 2.4, y + 2.4, x + 8, y, "#2a2a32", 1.4);
  line(c, x + 7, y + 5, x + 11, y + 11, "#16161c", 1.2);
  rect(c, x - 1, y + 14, 1, 14, "#6a6a7a");
  rect(c, x + 8, y + 14, 1, 14, "#6a6a7a");
}

function drawVent(c: C, x: number, y: number, w: number, h: number) {
  rect(c, x - 1.5, y - 1.5, w + 3, h + 3, "#3a3a46");
  rect(c, x, y, w, h, "#555564");
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = "#2f2f3a";
  c.lineWidth = 1.2;
  for (let k = -h; k < w + h; k += 5) {
    c.beginPath();
    c.moveTo(x + k, y + h);
    c.lineTo(x + k + h, y);
    c.stroke();
  }
  c.restore();
  for (const [dx, dy] of [[0, 0], [w, 0], [0, h], [w, h]] as Pt[]) disc(c, x + dx, y + dy, 0.9, "#b8b8c4");
}

function drawWarningSign(c: C, x: number, y: number, w: number) {
  const h = w * 0.88;
  poly(c, [[x + w / 2, y], [x + w, y + h], [x, y + h]], "#2a2a32");
  poly(c, [[x + w / 2, y + 1.8], [x + w - 1.8, y + h - 1.2], [x + 1.8, y + h - 1.2]], "#f2c230");
  rect(c, x + w / 2 - 0.7, y + h * 0.34, 1.4, h * 0.34, "#1a1a1a");
  disc(c, x + w / 2, y + h * 0.82, 0.8, "#1a1a1a");
}

function drawNote(c: C, x: number, y: number) {
  rect(c, x, y, 13, 11, "#f2d84a");
  rect(c, x + 1, y + 10, 12, 1, "rgba(0,0,0,.18)");
  c.strokeStyle = "#1f1f1f";
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(x + 2, y + 3);
  c.lineTo(x + 5, y + 2);
  c.lineTo(x + 7, y + 3.6);
  c.lineTo(x + 11, y + 2.4);
  c.moveTo(x + 2, y + 6);
  c.lineTo(x + 6, y + 6.6);
  c.lineTo(x + 9, y + 5.4);
  c.moveTo(x + 2, y + 8.6);
  c.lineTo(x + 8, y + 8.2);
  c.stroke();
  disc(c, x + 6.5, y - 0.2, 0.9, "#c0392b");
}

/** Lose Wandplatte, leicht schief, mit sichtbaren Schrauben. */
function drawLoosePlate(c: C, x: number, y: number) {
  c.save();
  c.translate(x + 9, y + 8);
  c.rotate(-0.12);
  rect(c, -9, -8, 18, 16, "#5a5a69");
  rect(c, -9, -8, 18, 1.2, "rgba(255,255,255,.2)");
  rect(c, -9, 7, 18, 1, "rgba(0,0,0,.4)");
  rect(c, -9, -8, 1, 16, "rgba(0,0,0,.25)");
  disc(c, -6.4, -5.4, 1, "#c6c6d2");
  disc(c, 6.4, -5.4, 1, "#c6c6d2");
  disc(c, 6.4, 5.4, 1, "#c6c6d2");
  // vierte Schraube fehlt: dunkles Loch
  disc(c, -6.4, 5.4, 1, "#1c1c24");
  c.restore();
  // Spalt dahinter
  rect(c, x + 1, y + 15.4, 17, 1.6, "#1c1c24");
}

/** Silberner Getränkebeutel mit rotem Strohhalm, schwerelos schwebend. */
function drawDrinkPouch(c: C, x: number, y: number) {
  c.save();
  c.translate(x, y);
  c.rotate(0.55);
  rrect(c, -4, -6, 8, 12, 2, "#c4c8d2");
  rect(c, -4, -6, 8, 1.6, "#9ea4b2");
  rect(c, -4, 4.4, 8, 1.6, "#9ea4b2");
  rect(c, -2, -3, 4, 5, "#2b5fd9");
  line(c, 1.6, -6, 3.4, -11, "#d92b2b", 1.2);
  line(c, 3.4, -11, 5.6, -11.4, "#d92b2b", 1.2);
  c.restore();
}

/** Offener roter Werkzeugkasten mit grauen Werkzeugen darin. */
function drawToolbox(c: C, x: number, F: number) {
  rrect(c, x, F - 8, 12, 8, 1.2, "#c92a2a");
  rect(c, x + 1, F - 8, 10, 1.4, "#e04b4b");
  rect(c, x + 3, F - 10, 6, 2, "#16161c");
  rect(c, x + 1.6, F - 7, 2.2, 5, "#9aa0ac");
  rect(c, x + 5, F - 7.4, 1.6, 5.4, "#7c8290");
  line(c, x + 8, F - 6.6, x + 10, F - 3.4, "#b4bac6", 1.2);
}

/** Industrielampe mit Schutzgitter statt Schirmlampe (gleicher Aufhängepunkt). */
function drawCageLamp(c: C, x: number, y0: number, len: number) {
  line(c, x, y0, x, y0 + len, "#1d1d24", 1.4);
  rrect(c, x - 11, y0 + len, 22, 10, 3, "#4a4a58");
  rect(c, x - 11, y0 + len, 22, 1.4, "rgba(255,255,255,.18)");
  rect(c, x - 8, y0 + len + 7, 16, 3.4, "#e9f0ff");
  c.strokeStyle = "#16161c";
  c.lineWidth = 0.8;
  for (let k = -6; k <= 6; k += 4) {
    c.beginPath();
    c.moveTo(x + k, y0 + len + 6);
    c.lineTo(x + k, y0 + len + 10.6);
    c.stroke();
  }
}

/** Dünne LED-Streifen an der Decke: Hauptlicht des Raums. */
function drawLedStrips(c: C, atticCeil: (x: number) => number) {
  for (const [a, b] of [[304, 470], [470, 522]] as Pt[]) {
    c.beginPath();
    c.moveTo(a, atticCeil(a) + 4);
    c.lineTo(b, atticCeil(b) + 4);
    c.strokeStyle = "rgba(160,205,255,.28)";
    c.lineWidth = 3.4;
    c.stroke();
    c.strokeStyle = "#dff0ff";
    c.lineWidth = 1.2;
    c.stroke();
    disc(c, a, atticCeil(a) + 4, 1.4, "#8a8a98");
    disc(c, b, atticCeil(b) + 4, 1.4, "#8a8a98");
  }
}

/**
 * Alle Möbel und Details des Raums in der richtigen Reihenfolge.
 * golItem: zeichnet das Spielmodul im Fach, solange es dort liegt.
 */
export function drawRaumstationMoebel(
  c: C,
  atticCeil: (x: number) => number,
  golItem?: (c: C, x: number, y: number, w: number, h: number) => void,
) {
  const F = RAUM1.boden;
  drawLedStrips(c, atticCeil);
  drawEmergencyLight(c, 296, atticCeil(296) + 1.6, false);

  // Wand: Notiz, Warnschild, Lüftung, Feuerlöscher, Schalter, lose Platte
  drawNote(c, 294, 98);
  drawWarningSign(c, 310, 100, 16);
  drawVent(c, 372, 174, 26, 12);
  drawExtinguisher(c, 358, 152);
  drawEmergencySwitch(c, RS.schalter.x, RS.schalter.y, RS.schalter.w, RS.schalter.h, false);
  drawLoosePlate(c, 452, 102);

  drawHangingCable(c, RS.kabel.x, atticCeil(RS.kabel.x) + 1, RS.kabel.laenge);
  drawCageLamp(c, RS.lampe.x, atticCeil(RS.lampe.x) + 2, RS.lampe.laenge);

  drawControlTerminal(c, RS.terminal.x, F);
  drawAstronautChair(c, RS.sessel.x, F);
  drawStorageShelf(c, RS.regal.x, F, RS.regal.w, RS.regal.h, golItem);
  drawToolbox(c, 474, F);
  drawDrinkPouch(c, 326, 126);
  drawSchleuse(c, RS.schleuse.x, F);
}

/* ====================================================================== */
/*  LEBENDIGE EFFEKTE – selten, nie gleichzeitig                          */
/* ====================================================================== */

/** Wo die Funken entstehen: die abgerissene Kabelspitze. */
export const FUNKEN_PUNKT = (atticCeil: (x: number) => number): Pt => [
  RS.kabel.x + 1.5,
  atticCeil(RS.kabel.x) + 1 + RS.kabel.laenge + 3,
];

type Effekt = "notfall" | "funken";

/**
 * Zwei seltene Effekte: der Notfallschalter blinkt (2–3 Zyklen, höchstens alle
 * 5–10 Minuten) und das Kabel schlägt ein paar Funken (höchstens alle 2–3
 * Minuten). Es läuft immer nur ein Effekt zur selben Zeit. Die Zeit läuft in
 * Spielsekunden; ausloesen() startet einen Effekt von Hand (für Tests).
 */
export class RaumstationFx {
  private notfallIn = 300 + Math.random() * 300;
  private funkenIn = 120 + Math.random() * 60;
  private aktiv: Effekt | null = null;
  private t = 0;
  private zyklen = 3;
  private seed = 0;
  /** Zeit für einen Blinkzyklus in Sekunden */
  static readonly ZYKLUS = 0.8;
  /** Funken-Impulse und ihre Dauer */
  static readonly IMPULSE = 3;
  static readonly IMPULS_DAUER = 0.06;
  static readonly IMPULS_ABSTAND = 0.18;

  get laeuft(): Effekt | null {
    return this.aktiv;
  }

  /** Startet einen Effekt sofort; false, wenn gerade einer läuft. */
  ausloesen(art: Effekt): boolean {
    if (this.aktiv) return false;
    this.aktiv = art;
    this.t = 0;
    this.seed += 1;
    this.zyklen = 2 + Math.floor(Math.random() * 2);
    if (art === "notfall") this.notfallIn = 300 + Math.random() * 300;
    else this.funkenIn = 120 + Math.random() * 60;
    return true;
  }

  update(dt: number) {
    if (this.aktiv) {
      this.t += dt;
      const ende =
        this.aktiv === "notfall"
          ? this.zyklen * RaumstationFx.ZYKLUS
          : (RaumstationFx.IMPULSE - 1) * RaumstationFx.IMPULS_ABSTAND + RaumstationFx.IMPULS_DAUER;
      if (this.t >= ende) this.aktiv = null;
      return;
    }
    this.notfallIn -= dt;
    this.funkenIn -= dt;
    if (this.notfallIn <= 0) this.ausloesen("notfall");
    else if (this.funkenIn <= 0) this.ausloesen("funken");
  }

  /** Nur die bewegten Anteile: Blinken über dem Schalter, Funken am Kabel. */
  draw(c: C, atticCeil: (x: number) => number) {
    if (this.aktiv === "notfall") {
      const hell = this.t % RaumstationFx.ZYKLUS < RaumstationFx.ZYKLUS / 2;
      if (hell) drawEmergencySwitch(c, RS.schalter.x, RS.schalter.y, RS.schalter.w, RS.schalter.h, true);
    } else if (this.aktiv === "funken") {
      const i = Math.floor(this.t / RaumstationFx.IMPULS_ABSTAND);
      const inImpuls = this.t - i * RaumstationFx.IMPULS_ABSTAND < RaumstationFx.IMPULS_DAUER;
      if (!inImpuls) return;
      const [px, py] = FUNKEN_PUNKT(atticCeil);
      for (let k = 0; k < 6; k++) {
        const n = hsh(this.seed * 31 + i * 7 + k);
        const a = n * Math.PI * 2;
        const d = 1.5 + hsh(this.seed + i + k * 5) * 5;
        c.fillStyle = k % 2 ? "#fff6c2" : "#ffd23c";
        c.beginPath();
        c.arc(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.8 + 1, k % 3 ? 0.9 : 1.3, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}
