/* =======================================================================
   URSPRUNGSFIGUR — die originale LCP-1-Figur aus dem ersten Spiel
   1:1 aus engine.ts drawChar() extrahiert, nur von der Spiellogik gelöst.

   Merkmale: kleiner runder Kopf (r 9.4), kurze braune Haare, oranges
   Shirt als abgerundetes Rechteck, blaue Strichbeine, dunkle Schuhe.
   Arme sind Striche in Shirtfarbe mit Hautpunkt als Hand.

   Maßsystem: Ursprung = Boden, y negativ nach oben. Höhe ca. 56 Einheiten.
   ======================================================================= */

type C = CanvasRenderingContext2D;

export const ORIG_H = 56;

export const ORIG_COLORS = {
  skin: "#f4c9a0",
  hair: "#4a3126",
  shirt: "#e8a33d",
  shirtDark: "#c9862c",
  pants: "#33566b",
  shoe: "#20343c",
  eye: "#20343c",
  mouth: "#a35f4a",
};

export type OrigState = "idle" | "walk" | "air" | "act" | "cheer" | "sit" | "lie" | "down";

export interface OrigOpts {
  t?: number;
  face?: 1 | -1;
  state?: OrigState;
  /** Laufphase 0..1 (wie c.walk im Original) */
  walk?: number;
  /** 0..1, wie stark gelaufen wird */
  walkAmt?: number;
  /** vertikale Geschwindigkeit, steuert Squash in der Luft */
  vy?: number;
  blink?: boolean;
  /** fröhlicher Mund (im Spiel an Vitalität gekoppelt) */
  happy?: boolean;
  /** trauriger Mund */
  sad?: boolean;
  scale?: number;
  shadow?: boolean;
  /** 0..1 Übergang in Sitz-/Liegepose */
  poseT?: number;
  /** Fortschritt der Umfall-Animation */
  downT?: number;
}

function rr(ctx: C, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export function drawOriginal(ctx: C, x: number, y: number, opts: OrigOpts = {}) {
  const {
    t = 0,
    face = 1,
    state = "idle",
    walk = 0,
    walkAmt = 1,
    vy = 0,
    blink = false,
    happy = true,
    sad = false,
    scale = 1,
    shadow = true,
    poseT = 0,
    downT = 0,
  } = opts;

  const K = ORIG_COLORS;

  if (shadow) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(x, y + 2 * scale, 14 * scale, 4.4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const bob = state === "walk" ? Math.abs(Math.sin(walk * Math.PI)) * 2.4 : Math.sin(t * 2.2) * 0.9;
  let squashX = 1;
  let squashY = 1;
  if (state === "air") {
    squashY = vy < 0 ? 1.1 : 1.04;
    squashX = vy < 0 ? 0.92 : 0.98;
  }
  if (state === "cheer") {
    const p = clamp(t % 0.42 / 0.42, 0, 1);
    squashY = 1 + Math.sin(p * Math.PI) * 0.14;
    squashX = 1 - Math.sin(p * Math.PI) * 0.1;
  }
  ctx.scale(face * squashX, squashY);
  if (state === "down") {
    const fall = clamp(downT / 0.45, 0, 1);
    ctx.rotate(-1.42 * fall * fall);
    ctx.translate(0, -3 * fall);
  }

  const lie = state === "lie";
  const sit = state === "sit" ? Math.max(0.2, poseT || 1) : 0;

  if (lie) {
    // Im Bett: Kopf schaut aus der Decke
    ctx.save();
    ctx.translate(-6, -30);
    ctx.fillStyle = K.skin;
    ctx.beginPath();
    ctx.arc(24, 4, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = K.hair;
    ctx.beginPath();
    ctx.arc(24, 2, 9.6, Math.PI * 1.05, Math.PI * 2.1);
    ctx.fill();
    ctx.fillStyle = K.eye;
    const bl = Math.sin(t * 1.4) > 0.9;
    if (bl) ctx.fillRect(27, 4, 4, 1.2);
    else {
      ctx.beginPath();
      ctx.arc(28.5, 4.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  const legPhase = walk * Math.PI * 2;
  const legSwing = state === "walk" ? 0.62 * walkAmt + 0.1 : state === "air" ? 0.3 : 0.06;
  const armSwing = state === "walk" ? 0.55 * walkAmt + 0.08 : 0.05;
  const yOff = -bob;

  // Beine
  ctx.strokeStyle = K.pants;
  ctx.lineWidth = 6.2;
  ctx.lineCap = "round";
  for (let i = 0; i < 2; i++) {
    const ph = legPhase + (i === 0 ? 0 : Math.PI);
    const sw = Math.sin(ph) * legSwing;
    const lift = Math.max(0, Math.cos(ph)) * (state === "walk" ? 4 : 0);
    ctx.beginPath();
    if (sit > 0) {
      ctx.moveTo(0, -20 + yOff);
      ctx.lineTo(6 + sit * 4, -14 + yOff + sit * 6);
      ctx.lineTo(12 + sit * 4, -2 + sit * 2);
    } else {
      ctx.moveTo(0, -20 + yOff);
      ctx.lineTo(sw * 11, -10 + yOff - lift * 0.4);
      ctx.lineTo(sw * 15, -lift);
    }
    ctx.stroke();
    ctx.fillStyle = K.shoe;
    if (sit > 0) ctx.fillRect(9 + sit * 4, -4 + sit * 2, 10, 4);
    else ctx.fillRect(sw * 15 - 4, -3 - lift, 11, 4);
  }

  // Rumpf
  ctx.fillStyle = K.shirt;
  rr(ctx, -8, -38 + yOff, 16, 20, 6);
  ctx.fill();
  ctx.fillStyle = K.shirtDark;
  rr(ctx, -8, -24 + yOff, 16, 6, 3);
  ctx.fill();

  // hinterer Arm
  ctx.strokeStyle = K.shirt;
  ctx.lineWidth = 5;
  const bph = legPhase + Math.PI;
  ctx.beginPath();
  ctx.moveTo(-1, -34 + yOff);
  ctx.lineTo(Math.sin(bph) * armSwing * 12 - 3, -26 + yOff);
  ctx.stroke();

  // vorderer Arm
  ctx.strokeStyle = K.shirt;
  ctx.beginPath();
  ctx.moveTo(1, -34 + yOff);
  if (state === "act") {
    const reach = 0.6 + Math.sin(t * 9) * 0.18;
    ctx.lineTo(10 * reach + 4, -30 + yOff + Math.sin(t * 7) * 2);
    ctx.lineTo(16 * reach + 4, -34 + yOff);
  } else if (state === "cheer") {
    ctx.lineTo(7, -44 + yOff);
    ctx.lineTo(9, -52 + yOff);
  } else {
    ctx.lineTo(Math.sin(legPhase) * armSwing * 12 + 3, -26 + yOff);
  }
  ctx.stroke();
  ctx.fillStyle = K.skin;
  if (state === "act") {
    ctx.beginPath();
    ctx.arc(16 * (0.6 + Math.sin(t * 9) * 0.18) + 4, -34 + yOff, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (state === "cheer") {
    ctx.beginPath();
    ctx.arc(9, -53 + yOff, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Kopf
  const headY = -46 + yOff + (state === "walk" ? Math.sin(legPhase * 2) * 0.7 : 0);
  const tilt = state === "act" ? 0.12 : state === "idle" ? Math.sin(t * 1.4) * 0.05 : 0;
  ctx.save();
  ctx.translate(1, headY);
  ctx.rotate(tilt);
  ctx.fillStyle = K.skin;
  ctx.beginPath();
  ctx.arc(0, 0, 9.4, 0, Math.PI * 2);
  ctx.fill();
  // Haare
  ctx.fillStyle = K.hair;
  ctx.beginPath();
  ctx.arc(0, -1, 9.6, Math.PI * 1.02, Math.PI * 2.08);
  ctx.fill();
  ctx.fillRect(-9.4, -4, 4, 6);
  // Ohr
  ctx.fillStyle = K.skin;
  ctx.beginPath();
  ctx.arc(-7, 1, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Augen
  ctx.fillStyle = K.eye;
  if (blink) {
    ctx.fillRect(2, 0.5, 4.4, 1.4);
    ctx.fillRect(-4.4, 0.5, 3.4, 1.4);
  } else {
    const ex = state === "cheer" ? 0.4 : 0;
    ctx.beginPath();
    ctx.arc(3.4 + ex, 0.6, 1.7, 0, Math.PI * 2);
    ctx.arc(-2.4 + ex, 0.6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(3.9 + ex, 0, 0.9, 0.9);
  }
  // Wange + Mund
  ctx.fillStyle = "rgba(255,120,120,.35)";
  ctx.beginPath();
  ctx.arc(5.4, 3.6, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = K.mouth;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  const happyMouth = state === "cheer" || state === "act" || happy;
  if (sad || state === "down") {
    ctx.arc(2.4, 6.6, 2.4, Math.PI * 1.15, Math.PI * 1.85);
  } else if (happyMouth) {
    ctx.arc(2.4, 3.6, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.moveTo(1, 5);
    ctx.lineTo(4.4, 5);
  }
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}
