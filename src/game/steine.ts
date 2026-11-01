/* =======================================================================
   WECHSELSTEINE

   Drei Steine, drei Hauswelten – jeder Stein sieht anders aus:
     Wachstein   (Sonne, warmes Grün)       -> normales Haus
     Traumstein  (Mondsichel, kühles Blau)  -> Traumhaus
     Horrorstein (Totenkopf, Schwarz/Glut)  -> Gruselhaus

   In jeder Welt stehen die zwei Steine der jeweils anderen Welten. Sie sind
   halb in die Erde links neben dem Keller eingelassen, sichtbare und
   ausreichend große Ziele (kein verstecktes Pixelportal).
   ======================================================================= */

import type { WeltId } from "./welten";

type C = CanvasRenderingContext2D;
type Rect4 = [number, number, number, number];

export type SteinArt = "wach" | "traum" | "horror";

/** Platz A: der ursprüngliche Steinplatz (unverändert). */
export const STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 278,
  y: 536,
  hit: [254, 506, 48, 58],
};

/** Platz B: direkt daneben, ebenfalls in der Erde. */
export const STEIN_B: { x: number; y: number; hit: Rect4 } = {
  x: 222,
  y: 540,
  hit: [198, 510, 48, 58],
};

const ZIEL_ART: Record<WeltId, SteinArt> = {
  normal: "wach",
  traum: "traum",
  gruesel: "horror",
};

export const STEIN_NAMEN: Record<SteinArt, string> = {
  wach: "Wachstein",
  traum: "Traumstein",
  horror: "Horrorstein",
};

export interface SteinSlot {
  art: SteinArt;
  /** Hauswelt, zu der dieser Stein führt */
  ziel: WeltId;
  x: number;
  y: number;
  hit: Rect4;
  label: string;
}

/**
 * Die Steine einer Welt: alle Welten außer der eigenen, in fester Reihenfolge
 * (normal, traum, gruesel). Der erste belegt den alten Platz A, der zweite B.
 * So bleibt der Traumstein im normalen Haus und der Wachstein im Traumhaus
 * genau dort, wo sie schon immer standen.
 */
export function steinSlots(welt: WeltId): SteinSlot[] {
  const reihenfolge: WeltId[] = ["normal", "traum", "gruesel"];
  const plaetze = [STEIN, STEIN_B];
  return reihenfolge
    .filter((w) => w !== welt)
    .map((ziel, i) => ({
      art: ZIEL_ART[ziel],
      ziel,
      x: plaetze[i].x,
      y: plaetze[i].y,
      hit: plaetze[i].hit,
      label: STEIN_NAMEN[ZIEL_ART[ziel]],
    }));
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
};

/** Halb eingegrabener Stein; Symbol und Farbe zeigen eindeutig, wohin er führt. */
export function drawStein(c: C, kind: SteinArt, t = 0, px: number = STEIN.x, py: number = STEIN.y) {
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
  if (kind === "traum") {
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
