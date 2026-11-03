/* Gruselhaus, Raum 05: Hexenküche – gemauerter Holzlagerplatz neben dem
   Hexenofen. Nur Canvas-Primitive, keine Assets.

   Der Lagerplatz ist eine Nische wie die Kamineinfassung aus der Vorlage
   (zwei Quaderpfeiler, Sims, Brennholz gestapelt). Er hat exakt die Breite
   und Höhe des Ofenkorpus (36 × 38) und steht mit Abstand 4 direkt daneben.
   Luni holt dort sichtbar ein Scheit, wenn ein neuer Ofendurchgang Holz
   braucht; der Bestand füllt sich langsam wieder. */
import type { Station } from "../house";
import { OFEN } from "./hexenofen";

type C = CanvasRenderingContext2D;

/** Lagerplatz: exakt so breit und so hoch wie der Ofen, Abstand 4 links. */
export const HOLZLAGER = {
  x: 650,
  h: 38,          // wie OFEN.korpus
  stand: 668,     // Luni steht mittig davor
  abstand: 4,     // Nische links: 650..686, Ofen beginnt 690
} as const;
export const HOLZLAGER_W = OFEN.w; // 36, exakt wie der Ofen
export const HOLZ_MAX = 9;         // 3 × 3 Scheite, sichtbar im Stapel
/** Alle fünf Minuten kommt ein Scheit nach – bis der Stapel wieder voll ist. */
export const HOLZ_REFILL_SEK = 300;

/** Stationen des Gruselhauses erweitern (nur Kopien/neue Einträge). */
export function holzlagerStationen(stations: readonly Station[]): Station[] {
  return [
    ...stations,
    {
      id: "holzlager",
      label: "Holzlager",
      floor: 1,
      x: HOLZLAGER.stand,
      face: 1,
      state: "act",
      expr: "happy",
      hits: [[HOLZLAGER.x, 448 - HOLZLAGER.h, HOLZLAGER_W, HOLZLAGER.h]],
    },
  ];
}

/* ------------------------------ Zeichenhilfen ---------------------------- */

const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function rect(c: C, x: number, y: number, w: number, h: number, f: string) { c.fillStyle = f; c.fillRect(x, y, w, h); }
function disc(c: C, x: number, y: number, r: number, f: string) { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }

const STEIN = ["#8f7351", "#7a6146", "#a8906b", "#6b563f", "#95785a"];
const FUGE = "#2c231b";

/** Unregelmäßige Quadermauer im versetzten Verband wie auf der Vorlage. */
function quadermauer(c: C, x0: number, y0: number, w: number, h: number, seed: number) {
  rect(c, x0, y0, w, h, FUGE);
  const rh = 7;
  const rows = Math.ceil(h / rh);
  for (let r = 0 ; r < rows; r++) {
    const y = y0 + r * rh;
    let x = x0 - (r % 2 ? 7 : 0);
    let i = 0;
    while (x < x0 + w) {
      const sw = Math.min(12 + Math.floor(hash(seed + r * 31 + i * 7) * 4), x0 + w - 1 - x);
      if (sw > 3) {
        const col = STEIN[(r * 3 + i * 5 + seed) % STEIN.length];
        rect(c, x + 0.7, y + 0.7, sw - 1.4, Math.min(rh, y0 + h - y) - 1.4, col);
        rect(c, x + 0.7, y + 0.7, sw - 1.4, 1, "rgba(255,240,214,.18)");
        rect(c, x + 0.7, y + Math.min(rh, y0 + h - y) - 1.4, sw - 1.4, 1, "rgba(0,0,0,.3)");
      }
      x += 15;
      i++;
      if (i > 8) break;
    }
  }
}

/** Ein gestapeltes Scheit, von der Stirnseite gesehen. */
function scheitEnde(c: C, x: number, y: number, wobble: number) {
  const jx = Math.sin(wobble * 9) * 0.4;
  disc(c, x + jx, y, 3.4, "#4d2e14");
  disc(c, x + jx, y, 2.8, "#7c4a26");
  disc(c, x + jx, y, 2.1, "#c89a63");
  c.save();
  c.strokeStyle = "rgba(90,55,28,.75)";
  c.lineWidth = 0.45;
  c.beginPath(); c.arc(x + jx, y, 1.5, 0.4, 4.4); c.stroke();
  c.beginPath(); c.arc(x + jx, y, 0.7, 1.6, 5.6); c.stroke();
  c.restore();
}

/**
 * Die Nische neben dem Ofen. `holz` = aktueller Bestand (0..9),
 * `wobble` > 0 wackelt das oberste Scheit kurz (Luni richtet ihn beim Ablegen).
 */
export function drawHolzlager(c: C, F: number, holz: number, wobble = 0) {
  const x0 = HOLZLAGER.x;
  const w = HOLZLAGER_W;
  const top = F - HOLZLAGER.h;        // gleiche Oberkante wie der Ofenkorpus
  const pfosten = 5, sims = 4;
  // Schatten auf dem Boden, wie unter dem Ofen
  c.save();
  c.globalAlpha = 0.35;
  c.beginPath(); c.ellipse(x0 + w / 2, F + 1, 21, 2, 0, 0, Math.PI * 2); c.fillStyle = "#0c0907"; c.fill();
  c.restore();
  // Innenraum (dunkel), auf dem die Scheite liegen
  rect(c, x0 + pfosten, top + 3, w - pfosten * 2, HOLZLAGER.h - sims - 1, "#241a12");
  rect(c, x0 + pfosten, top + 3, w - pfosten * 2, 1, "rgba(255,230,190,.08)");
  // Brennholz: von unten links gestapelt, wird von oben rechts abgenommen
  const innenX = x0 + pfosten + 1;
  const innenW = w - pfosten * 2 - 2;   // 25
  const mittel = [innenX + 5.5, innenX + innenW / 2, innenX + innenW - 5.5];
  const reiheY = [F - 7.2, F - 14.2, F - 21.2];
  for (let i = 0; i < Math.min(holz, HOLZ_MAX); i++) {
    const spalte = i % 3, reihe = (i / 3) | 0;
    const istTop = i === holz - 1;
    scheitEnde(c, mittel[spalte], reiheY[reihe], istTop ? wobble : 0);
  }
  // Pfeiler und Sims
  quadermauer(c, x0, top + sims, pfosten, HOLZLAGER.h - sims, 13);
  quadermauer(c, x0 + w - pfosten, top + sims, pfosten, HOLZLAGER.h - sims, 47);
  quadermauer(c, x0 - 2, top, w + 4, sims + 1, 29);
  // Kanten
  rect(c, x0 - 2, top, w + 4, 1, "rgba(255,240,214,.35)");
  rect(c, x0 - 2, top + sims + 1, w + 4, 1, "rgba(0,0,0,.35)");
  rect(c, x0 + pfosten, top + sims + 1, w - pfosten * 2, 1, "rgba(255,240,214,.12)");
}
