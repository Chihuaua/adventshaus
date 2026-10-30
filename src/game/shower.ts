/* =======================================================================
   BADEZIMMER: DUSCHE, VORHANG, DAMPF, SCHRANK

   Nur Zeichnen. Den Ablauf (Schrank, Handtuch, Duschen) steuert house.ts.
   Statisch (einmal in die Hintergrundebene): Wanne, Stange, Brause, Ablage.
   Dynamisch (jedes Bild): Vorhang, Wasser, Dampf, Handtuch auf der Stange,
   offene Schranktüren.
   ======================================================================= */

type C = CanvasRenderingContext2D;

/** Lage der Dusche im 1. Stock */
export const SHOWER_X = 500;
export const SHOWER_W = 46;
export const SHOWER_H = 92;
/** Faltenwurf zusammengeschoben bzw. ganz zugezogen */
const CURTAIN_OPEN_W = 8;

const rodY = (F: number) => F - SHOWER_H + 2;
/** Höhe der Wannenvorderseite */
const TUB_H = 8;

/**
 * Vorderseite der Wanne. Wird über Luni gezeichnet, solange sie in der
 * Dusche steht – dann verschwinden ihre Füße im Becken.
 */
export function drawTubFront(c: C, F: number) {
  const x = SHOWER_X;
  const w = SHOWER_W;
  c.fillStyle = "#f4f8f6";
  c.fillRect(x - 1, F - TUB_H, w + 2, TUB_H);
  c.fillStyle = "#d3e4dc";
  c.fillRect(x + 2, F - 5, w - 4, 2.2);
  c.fillStyle = "rgba(0,0,0,.14)";
  c.fillRect(x + 3, F - 2, w - 6, 1.4);
  c.fillStyle = "rgba(255,255,255,.7)";
  c.fillRect(x - 1, F - TUB_H, w + 2, 1);
}

/** Fläche, die der Vorhang gerade bedeckt (Bühneneinheiten). */
export function curtainRect(F: number, closed: number) {
  const x = SHOWER_X + 2;
  const full = SHOWER_W - 4;
  const w = CURTAIN_OPEN_W + (full - CURTAIN_OPEN_W) * closed;
  return { x, y: rodY(F) + 1, w, h: F - TUB_H - (rodY(F) + 1) };
}

/** Statischer Teil: Wanne, Stange, Brause, Armatur, Ablage. Keine Kabine. */
export function showerStatic(c: C, F: number) {
  const x = SHOWER_X;
  const w = SHOWER_W;
  const h = SHOWER_H;
  // flache weiße Wanne
  drawTubFront(c, F);

  // Duschstange senkrecht mit Brause oben rechts
  c.strokeStyle = "#b9c6c9";
  c.lineCap = "round";
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(x + w - 9, F - h + 8);
  c.lineTo(x + w - 9, F - 12);
  c.stroke();
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + w - 9, F - h + 10);
  c.lineTo(x + w - 20, F - h + 6);
  c.stroke();
  c.fillStyle = "#cfd8da";
  c.beginPath();
  c.ellipse(x + w - 22, F - h + 8, 5, 2.4, 0.35, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#8fa8ae";
  for (let i = 0; i < 4; i++) c.fillRect(x + w - 25 + i * 1.6, F - h + 9.4, 0.7, 0.7);

  // Armatur links, Ablage mit Flaschen rechts
  c.fillStyle = "#d5dee2";
  c.beginPath();
  c.arc(x + 10, F - 52, 2.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#8fb8c4";
  c.fillRect(x + 7, F - 52.5, 6, 1);
  c.fillStyle = "#c9d8d2";
  c.fillRect(x + w - 16, F - 46, 11, 1.8);
  c.fillStyle = "#7ec4dc";
  c.fillRect(x + w - 14, F - 55, 3, 9);
  c.fillStyle = "#f0e2a8";
  c.fillRect(x + w - 10, F - 53, 3, 7);
  c.fillStyle = "#e6ecee";
  c.fillRect(x + w - 14, F - 57, 3, 2);
  c.fillRect(x + w - 10, F - 55, 3, 2);

  // Vorhangstange quer über die ganze Breite
  c.strokeStyle = "#b9c6c9";
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x, rodY(F));
  c.lineTo(x + w, rodY(F));
  c.stroke();
  c.fillStyle = "#9aa8ae";
  c.fillRect(x - 1, rodY(F) - 1.6, 2, 3.2);
  c.fillRect(x + w - 1, rodY(F) - 1.6, 2, 3.2);
}

/** Wasserstrahl aus der Brause. `alpha` erlaubt einen Hauch durch den Vorhang. */
export function drawShowerWater(c: C, F: number, t: number, alpha = 1) {
  const sx = SHOWER_X + SHOWER_W - 22;
  const sy = F - SHOWER_H + 10;
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = "rgba(168,216,232,.75)";
  c.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const wob = Math.sin(t * 22 + i * 1.7) * 0.6;
    c.beginPath();
    c.moveTo(sx - 2.5 + i, sy);
    c.lineTo(sx - 9 + i * 2.6 + wob, F - 9);
    c.stroke();
  }
  c.fillStyle = "rgba(190,226,238,.85)";
  for (let i = 0; i < 6; i++) {
    const k = (t * 1.8 + i * 0.17) % 1;
    c.beginPath();
    c.arc(sx - 10 + i * 3.2, F - 10 - k * 3, 0.7, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/**
 * Duschvorhang an Ringen. `closed` 0 = links zusammengeschoben,
 * 1 = über die ganze Breite zugezogen.
 */
export function drawCurtain(c: C, F: number, closed: number, t: number) {
  const r = curtainRect(F, closed);
  const folds = Math.max(3, Math.round(r.w / 4.2));
  c.save();
  c.fillStyle = "rgba(222, 240, 236, 0.93)";
  c.beginPath();
  c.moveTo(r.x, r.y);
  c.lineTo(r.x + r.w, r.y);
  // unterer Saum leicht gewellt
  const sway = Math.sin(t * 1.3) * 0.6 * closed;
  for (let i = folds; i >= 0; i--) {
    const fx = r.x + (r.w * i) / folds;
    const fy = r.y + r.h + (i % 2 ? 1.4 : 0) + sway * (i / folds);
    c.lineTo(fx, fy);
  }
  c.closePath();
  c.fill();
  // Falten
  c.strokeStyle = "rgba(150, 190, 182, 0.55)";
  c.lineWidth = 0.8;
  for (let i = 1; i < folds; i++) {
    const fx = r.x + (r.w * i) / folds;
    c.beginPath();
    c.moveTo(fx, r.y + 1);
    c.quadraticCurveTo(fx + (i % 2 ? 0.9 : -0.9), r.y + r.h * 0.5, fx + sway * 0.4, r.y + r.h);
    c.stroke();
  }
  // dezentes Muster: zwei Streifen
  c.fillStyle = "rgba(127, 182, 208, 0.45)";
  c.fillRect(r.x, r.y + 6, r.w, 1.4);
  c.fillRect(r.x, r.y + r.h - 7, r.w, 1.4);
  // Ringe auf der Stange
  c.fillStyle = "#eef4f2";
  for (let i = 0; i <= folds; i++) {
    c.beginPath();
    c.arc(r.x + (r.w * i) / folds, r.y - 1, 1, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** Dampfschwaden in und über der Dusche. `level` 0..1 */
export function drawSteam(c: C, F: number, level: number, t: number) {
  if (level <= 0.01) return;
  c.save();
  for (let i = 0; i < 14; i++) {
    const k = (t * 0.16 + i * 0.071) % 1;
    const px = SHOWER_X + 6 + ((i * 37) % 34) + Math.sin(t * 0.8 + i) * 4;
    const py = F - 14 - k * (SHOWER_H + 26);
    const rad = 4 + k * 9;
    const a = level * 0.22 * Math.sin(k * Math.PI);
    c.fillStyle = `rgba(236, 244, 246, ${a})`;
    c.beginPath();
    c.arc(px, py, rad, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** Handtuch über der Vorhangstange, rechts. */
export function drawTowelOnRod(c: C, F: number) {
  const x = SHOWER_X + SHOWER_W - 16;
  const y = rodY(F);
  c.fillStyle = "#eaf4f7";
  c.fillRect(x, y - 1, 11, 18);
  c.fillStyle = "#d4e6ec";
  c.fillRect(x + 7, y - 1, 4, 22);
  c.fillStyle = "#7fb6d0";
  c.fillRect(x, y + 13, 11, 1.2);
  c.fillRect(x + 7, y + 17, 4, 1.2);
}

/**
 * Kleiderschrank im Schlafzimmer, Türen offen. `open` 0..1.
 * Die Türflügel drehen nach außen und werden schmaler.
 */
export function drawWardrobeOpen(c: C, x: number, F: number, open: number, towelTaken: boolean) {
  if (open <= 0.01) return;
  const e = open * open * (3 - 2 * open);
  // Innenraum
  c.fillStyle = "#3a2a1c";
  c.fillRect(x + 3, F - 80, 42, 76);
  c.fillStyle = "#6b4a2a";
  c.fillRect(x + 4, F - 70, 40, 1.4);
  c.fillRect(x + 4, F - 30, 40, 2);
  // Kleider auf Bügeln
  const cols = ["#b58b63", "#2f4a6b", "#c9453a", "#e6dfcf", "#3f8f5f"];
  for (let i = 0; i < 5; i++) {
    const hx = x + 7 + i * 7.6;
    c.strokeStyle = "#c9b38a";
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(hx + 3, F - 70);
    c.lineTo(hx + 3, F - 67);
    c.stroke();
    c.fillStyle = cols[i];
    c.fillRect(hx, F - 67, 6.4, 24 + (i % 2) * 6);
  }
  // Handtuchstapel unten
  const stack = towelTaken ? 1 : 2;
  for (let i = 0; i < stack; i++) {
    c.fillStyle = i ? "#eaf4f7" : "#cfe3ea";
    c.fillRect(x + 10, F - 36 - i * 4, 16, 4);
  }
  c.fillStyle = "#e9c46a";
  c.fillRect(x + 30, F - 36, 10, 4);
  // Türflügel, nach außen geklappt
  const dw = 18 - 13 * e;
  c.fillStyle = "#8a6a3c";
  c.fillRect(x + 3 - (18 - dw) * 0.55 * e - dw * e, F - 80, dw, 76);
  c.fillRect(x + 45 + (18 - dw) * 0.55 * e - dw * (1 - e), F - 80, dw, 76);
  c.fillStyle = "rgba(0,0,0,.22)";
  c.fillRect(x + 3 - (18 - dw) * 0.55 * e - dw * e, F - 80, 1.2, 76);
  c.fillRect(x + 45 + (18 - dw) * 0.55 * e - dw * (1 - e) + dw - 1.2, F - 80, 1.2, 76);
}
