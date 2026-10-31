/* =======================================================================
   GRUSELHAUS · RAUM 02 · DAS ORCHESTER DER VERGESSENEN GEISTER

   Dachgeschoss rechts (Musikzimmer). Das bestehende Haus zeichnet weiterhin
   den Grundriss und verwaltet alle Stationen. Diese Datei malt danach nur
   innerhalb x=534..830 den neuen Raum und ersetzt dort die alten Möbel.
   Alle Klickziele, Laufwege, Instrument-Anker und Objektgrößen bleiben in
   house.ts unverändert.

   Kein Filter, keine Texturen, keine externen Assets. Musikzimmer-Farben,
   Holzvertäfelung, Vorhänge, Türen, Lampen und Möbel werden direkt mit
   Canvas-Primitiven gezeichnet. Das vorhandene Saxophon bleibt an seinen
   etablierten Mund-/Handankern; nur sein Aussehen wechselt im Gruselhaus.
   ======================================================================= */

type C = CanvasRenderingContext2D;
type Pt = [number, number];

const X0 = 534; // hinter der vorhandenen Trennwand bei x=530
const X1 = 830;
const FD = 200;

const COL = {
  wood: "#49342f",
  recess: "#30232b",
  rail: "#735044",
  gold: "#c69a49",
  goldLight: "#e5c77e",
  wine: "#772d48",
  purple: "#63376f",
  lamp: "#f6d780",
  lampGlow: "#ffe7a0",
  blue: "#315c9a",
  blueTrim: "#c5d5eb",
  green: "#39754b",
  greenTrim: "#d3ab58",
  bone: "#e7d9bc",
  boneShade: "#b6a88d",
  dark: "#39313d",
  black: "#17131b",
  burgundy: "#421f34",
  plum: "#39263f",
  velvet: "#5a2948",
  brass: "#bd8e3c",
} as const;

function rect(c: C, x: number, y: number, w: number, h: number, f: string) {
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
}

function rrPath(c: C, x: number, y: number, w: number, h: number, r: number) {
  const q = Math.min(r, w / 2, h / 2);
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
}

function rr(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  rrPath(c, x, y, w, h, r);
  c.fillStyle = f;
  c.fill();
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

function poly(c: C, pts: Pt[], color: string) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function filigree(c: C, cx: number, y: number, w: number, h: number, color: string = COL.gold) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = 0.85;
  c.beginPath();
  c.moveTo(cx - w / 2, y + h);
  c.quadraticCurveTo(cx - w / 2, y, cx, y + h * 0.4);
  c.quadraticCurveTo(cx + w / 2, y, cx + w / 2, y + h);
  c.moveTo(cx - w * 0.34, y + h * 0.72);
  c.quadraticCurveTo(cx, y + h * 0.28, cx + w * 0.34, y + h * 0.72);
  c.stroke();
  disc(c, cx, y + h * 0.45, 1.1, color);
  c.restore();
}

/* ------------------------------- Wall ---------------------------------- */

function drawCurtains(c: C, x: number, y: number, w: number, h: number, color: string) {
  // Center seam, deep folds, gold tiebacks; no window/glass is drawn beneath.
  const half = w / 2;
  for (const side of [-1, 1]) {
    const sx = side < 0 ? x : x + half;
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(sx, y);
    c.quadraticCurveTo(sx + half * 0.55, y + 2, sx + half * 0.48, y + h * 0.52);
    c.lineTo(sx + half * 0.68, y + h * 0.85);
    c.lineTo(sx + half * 0.56, y + h);
    c.lineTo(sx + half * 0.36, y + h * 0.9);
    c.lineTo(sx + half * 0.18, y + h);
    c.lineTo(sx + half * 0.05, y + h * 0.72);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(229,199,126,.32)";
    c.lineWidth = 0.8;
    for (let i = 1; i <= 3; i++) {
      const fx = sx + half * (0.16 + i * 0.15);
      c.beginPath();
      c.moveTo(fx, y + 4);
      c.quadraticCurveTo(fx + side * 2, y + h * 0.4, fx, y + h * 0.82);
      c.stroke();
    }
  }
  // Tie-backs
  for (const bx of [x + 4, x + w - 4]) {
    line(c, bx - 2.8, y + h * 0.57, bx + 2.8, y + h * 0.57, COL.goldLight, 1.1);
    disc(c, bx, y + h * 0.57, 1.5, COL.gold);
  }
  // A few frayed tassels, not a moving effect.
  for (let i = 0; i < 4; i++) line(c, x + 4 + i * 2.4, y + h - 1, x + 3 + i * 2.5, y + h + 2, "#c9a46a", 0.55);
}

function drawMysteryDoor(c: C, x: number, y: number, w: number, h: number, kind: "blue" | "green") {
  const body = kind === "blue" ? COL.blue : COL.green;
  const trim = kind === "blue" ? COL.blueTrim : COL.greenTrim;
  // Carved jamb and closed leaf
  rr(c, x - 3, y - 3, w + 6, h + 4, 2, "#30232b");
  c.strokeStyle = trim;
  c.lineWidth = 1.1;
  rrPath(c, x - 1, y - 1, w + 2, h + 1, 1.8);
  c.stroke();
  rr(c, x, y, w, h, 1.3, body);
  c.strokeStyle = trim;
  c.lineWidth = 0.8;
  rrPath(c, x + 3, y + 4, w - 6, h - 8, 1);
  c.stroke();
  // Two inset panels
  for (const yy of [y + 8, y + h * 0.5]) {
    rr(c, x + 6, yy, w - 12, h * 0.35 - 3, 1.5, kind === "blue" ? "#294d80" : "#2f6140");
  }
  // Music scrollwork / bat engraving
  if (kind === "blue") {
    filigree(c, x + w / 2, y + 11, w * 0.5, h * 0.42, trim);
    disc(c, x + w / 2, y + h * 0.71, 2.3, trim); // keyhole accent
  } else {
    c.fillStyle = trim;
    c.beginPath();
    c.moveTo(x + w / 2, y + 15);
    c.quadraticCurveTo(x + w * 0.28, y + 9, x + w * 0.2, y + 17);
    c.quadraticCurveTo(x + w * 0.38, y + 18, x + w / 2, y + 21);
    c.quadraticCurveTo(x + w * 0.62, y + 18, x + w * 0.8, y + 17);
    c.quadraticCurveTo(x + w * 0.72, y + 9, x + w / 2, y + 15);
    c.fill();
    disc(c, x + w / 2, y + h * 0.72, 2.2, trim);
  }
  // Decorative handle, no hit target or door logic
  line(c, x + w - 7, y + h * 0.56, x + w - 4.2, y + h * 0.56, trim, 1.3);
  disc(c, x + w - 4, y + h * 0.56, 1, trim);
}

function drawFishLamp(c: C, x: number, y: number, w: number, dir: 1 | -1) {
  // Stable, warm light: no flicker and no timing-dependent brightness.
  const g = c.createRadialGradient(x, y + 9, 1, x, y + 9, 29);
  g.addColorStop(0, "rgba(255,231,160,.2)");
  g.addColorStop(1, "rgba(255,231,160,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y + 9, 29, 0, Math.PI * 2);
  c.fill();
  // Ornate dark-metal wall arm
  line(c, x, y - 2, x, y + 2, COL.dark, 2);
  line(c, x - dir * 2, y + 1, x + dir * 3, y + 4, COL.gold, 1.2);
  // Round fish-glass bowl
  c.fillStyle = "rgba(246,215,128,.72)";
  c.beginPath();
  c.moveTo(x - w / 2, y + 4);
  c.quadraticCurveTo(x - w / 2 - 1, y + 17, x, y + 21);
  c.quadraticCurveTo(x + w / 2 + 1, y + 17, x + w / 2, y + 4);
  c.quadraticCurveTo(x, y + 8, x - w / 2, y + 4);
  c.closePath();
  c.fill();
  c.strokeStyle = COL.gold;
  c.lineWidth = 1.2;
  c.stroke();
  line(c, x - w / 2, y + 5, x + w / 2, y + 5, COL.goldLight, 1);
  // Tiny ghost fish resting in the bowl
  drawFish(c, x - dir * 1.5, y + 13, 0.55, 0.18);
  // Glass highlights
  line(c, x - w * 0.25, y + 8, x - w * 0.31, y + 13, "rgba(255,255,255,.75)", 0.8);
  line(c, x + w * 0.29, y + 9, x + w * 0.25, y + 12, "rgba(255,255,255,.5)", 0.6);
}

function drawFish(c: C, x: number, y: number, s: number, alpha: number) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = "#f3eee3";
  c.beginPath();
  c.ellipse(0, 0, 4.7, 2.3, 0, 0, Math.PI * 2);
  c.fill();
  poly(c, [[-4, 0], [-7, -2.8], [-6.6, 0], [-7, 2.8]], "#f3eee3");
  disc(c, 2.2, -0.4, 0.55, COL.dark);
  line(c, -0.6, -1.7, 0.3, 1.7, "rgba(92,75,86,.65)", 0.55);
  c.restore();
}

function drawComposerPortrait(c: C, cx: number, cy: number, r: number) {
  disc(c, cx, cy, r + 2, COL.gold);
  disc(c, cx, cy, r, "#2d202f");
  disc(c, cx, cy, r - 2, "#513247");
  // pale bust, high collar and swept hair
  c.fillStyle = COL.bone;
  c.beginPath();
  c.arc(cx, cy - 2, 5.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = COL.dark;
  c.beginPath();
  c.arc(cx, cy - 4, 5.6, Math.PI, Math.PI * 2);
  c.fill();
  c.fillRect(cx - 5, cy - 4, 2.2, 7);
  c.fillRect(cx + 2.8, cy - 4, 2.2, 6);
  poly(c, [[cx - 8, cy + 7], [cx - 5, cy + 2], [cx, cy + 5], [cx + 5, cy + 2], [cx + 8, cy + 7]], COL.boneShade);
  poly(c, [[cx - 5, cy + 3], [cx, cy + 6], [cx + 5, cy + 3], [cx + 3, cy + 10], [cx - 3, cy + 10]], COL.burgundy);
  disc(c, cx - 1.8, cy - 2.2, 0.6, COL.dark);
  disc(c, cx + 1.8, cy - 2.2, 0.6, COL.dark);
  // ornamental frame
  c.strokeStyle = COL.goldLight;
  c.lineWidth = 0.55;
  c.beginPath();
  c.arc(cx, cy, r + 0.8, 0, Math.PI * 2);
  c.stroke();
}

function drawCarvedNotes(c: C, x: number, y: number) {
  c.strokeStyle = "rgba(229,199,126,.65)";
  c.lineWidth = 0.7;
  for (let i = 0; i < 3; i++) {
    const xx = x + i * 8;
    line(c, xx, y + 2, xx, y + 10, COL.gold, 0.7);
    disc(c, xx - 1.7, y + 10, 1.8, COL.goldLight);
    if (i === 0) line(c, xx, y + 2, xx + 8, y - 0.4, COL.gold, 0.8);
  }
}

/* --------------------------------- Teppich -------------------------------- */

function drawMusicRug(c: C, x: number, y: number, w: number, h: number) {
  rr(c, x, y, w, h, 2, COL.velvet);
  c.strokeStyle = COL.gold;
  c.lineWidth = 0.7;
  rrPath(c, x + 2, y + 0.8, w - 4, h - 1.6, 1.3);
  c.stroke();
  c.fillStyle = "rgba(198,154,73,.75)";
  for (let i = 0; i < 8; i++) {
    const xx = x + 8 + i * ((w - 16) / 7);
    c.beginPath();
    c.arc(xx, y + h / 2, 0.65, 0, Math.PI * 2);
    c.fill();
  }
  // two tiny dancing skeleton silhouettes
  for (const xx of [x + w * 0.38, x + w * 0.65]) {
    disc(c, xx, y + 1.9, 1, COL.bone);
    line(c, xx, y + 2.8, xx + 0.3, y + 4.1, COL.bone, 0.65);
    line(c, xx + 0.3, y + 3.2, xx - 1.4, y + 2.7, COL.bone, 0.6);
    line(c, xx + 0.3, y + 3.2, xx + 1.6, y + 2.4, COL.bone, 0.6);
    line(c, xx + 0.3, y + 4.1, xx - 1, y + 5.1, COL.bone, 0.6);
    line(c, xx + 0.3, y + 4.1, xx + 1.6, y + 5, COL.bone, 0.6);
  }
}



/* --------------------------- Bone Saxophone ---------------------------- */

/**
 * Knochensaxophon mit den gleichen lokalen Abmessungen und demselben
 * Mundstück-Anker wie house.ts:saxophone(). `dir` dreht nur die Richtung;
 * die Referenzgröße und alle Haus-IK-Griffpunkte bleiben gleich.
 */
export function drawBoneSaxophone(c: C, ax: number, ay: number, scale: number, dir: 1 | -1) {
  c.save();
  c.translate(ax, ay);
  c.scale(scale * dir, scale);
  // Mouthpiece at local origin, matching the existing anchor.
  poly(c, [[0, -1], [7, 0.4], [7, 4.2], [0, 3]], COL.boneShade);
  poly(c, [[0.7, -0.4], [6.2, 0.7], [6.2, 3.4], [0.7, 2.5]], COL.bone);
  // Neck and body: smooth curved bone shaft, same silhouette/length as original.
  c.strokeStyle = COL.boneShade;
  c.lineWidth = 5.2;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(5, 2);
  c.quadraticCurveTo(12, 4, 12, 12);
  c.lineTo(10.5, 32);
  c.quadraticCurveTo(10.5, 42, 19, 42);
  c.quadraticCurveTo(26.5, 42, 26, 32);
  c.lineTo(25, 22);
  c.stroke();
  c.strokeStyle = COL.bone;
  c.lineWidth = 3.7;
  c.beginPath();
  c.moveTo(5, 2);
  c.quadraticCurveTo(12, 4, 12, 12);
  c.lineTo(10.5, 32);
  c.quadraticCurveTo(10.5, 42, 19, 42);
  c.quadraticCurveTo(26.5, 42, 26, 32);
  c.lineTo(25, 22);
  c.stroke();
  // bone-joint rings along the shaft (vertebra-like, but still sax-sized)
  for (const [x, y] of [[11.8, 14], [11.5, 19], [11.2, 24], [10.9, 29], [13.2, 38], [18.8, 41]] as Pt[]) {
    c.fillStyle = COL.boneShade;
    c.beginPath();
    c.ellipse(x, y, 2.6, 1.15, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = COL.bone;
    c.beginPath();
    c.ellipse(x, y - 0.3, 1.8, 0.58, 0, 0, Math.PI * 2);
    c.fill();
  }
  // Bell as an open, stylised skull mouth; its rim occupies the original bell bounds.
  c.fillStyle = COL.boneShade;
  c.beginPath();
  c.moveTo(21.4, 23);
  c.quadraticCurveTo(20, 16, 18.4, 12.5);
  c.lineTo(31.6, 12.5);
  c.quadraticCurveTo(30, 16, 28.6, 23);
  c.closePath();
  c.fill();
  c.fillStyle = COL.bone;
  c.beginPath();
  c.ellipse(25, 12.5, 6.1, 2.1, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = COL.dark;
  c.beginPath();
  c.ellipse(25, 12.7, 4.8, 1.5, 0, 0, Math.PI * 2);
  c.fill();
  // five small ivory teeth along the open bell
  for (let i = 0; i < 5; i++) poly(c, [[21.5 + i * 1.75, 11.5], [22.2 + i * 1.75, 11.5], [21.9 + i * 1.75, 12.8]], COL.bone);
  // Klappen in dunkelviolett, with bone hinges
  for (let i = 0; i < 4; i++) {
    const ky = 13 + i * 5.4;
    line(c, 8.6, ky, 13.8, ky, COL.dark, 1.15);
    disc(c, 11.6 - i * 0.35, ky, 1.5, COL.bone);
    disc(c, 11.6 - i * 0.35, ky, 0.65, COL.dark);
  }
  // small violet inlay, not a size-changing ornament
  disc(c, 14.8, 31.5, 1.25, "#9863CA");
  c.strokeStyle = "rgba(255,255,255,.42)";
  c.lineWidth = 0.7;
  line(c, 9.2, 10, 8.4, 28, "rgba(255,255,255,.42)", 0.7);
  c.restore();
}

/* --------------------- Gramophone and its companions ------------------- */

/** Stativ am bestehenden Instrumentenplatz; Mundstückanker bleibt (652,164). */
function drawBoneSaxStand(c: C, x: number, F: number) {
  const stemX = x + 6;
  line(c, stemX, F, stemX, F - 30, COL.dark, 2.1);
  line(c, stemX - 8, F - 1, stemX + 8, F - 1, COL.dark, 2.1);
  line(c, stemX - 6, F - 14, stemX + 6, F - 14, COL.gold, 1.2);
  // Two small padded rests hold the lower tube without changing its location.
  line(c, stemX - 4, F - 28, stemX + 3, F - 28, COL.boneShade, 1.5);
  line(c, stemX - 2, F - 25, stemX + 5, F - 25, COL.boneShade, 1.5);
  disc(c, stemX - 4, F - 28, 1.1, COL.bone);
  disc(c, stemX + 3, F - 28, 1.1, COL.bone);
}


function drawGhostGramophone(c: C, x: number, F: number) {
  // Small dark-purple case in the existing 52x31 record-player footprint.
  rr(c, x, F - 25, 52, 25, 3, COL.plum);
  c.strokeStyle = COL.gold;
  c.lineWidth = 0.9;
  rrPath(c, x + 1, F - 24, 50, 23, 2.6);
  c.stroke();
  rect(c, x + 3, F - 6, 46, 2, COL.dark);
  // turntable and record
  disc(c, x + 17, F - 16, 8.3, "#201a25");
  disc(c, x + 17, F - 16, 6.4, "#5b3458");
  disc(c, x + 17, F - 16, 1.5, COL.gold);
  disc(c, x + 17, F - 16, 0.55, COL.dark);
  // flower-shaped horn, not a plain trumpet cone
  line(c, x + 17, F - 20, x + 28, F - 31, COL.gold, 1.8);
  const hx = x + 29, hy = F - 33;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    c.fillStyle = i % 2 ? COL.goldLight : COL.gold;
    c.beginPath();
    c.ellipse(hx + Math.cos(a) * 4.1, hy + Math.sin(a) * 3.4, 3.6, 2.3, a, 0, Math.PI * 2);
    c.fill();
  }
  disc(c, hx, hy, 2.2, COL.dark);
  disc(c, hx - 0.8, hy - 0.4, 0.55, COL.bone);
  disc(c, hx + 0.8, hy - 0.4, 0.55, COL.bone);
  // tone arm and skull knob
  line(c, x + 43, F - 20, x + 40, F - 27, COL.boneShade, 1.2);
  line(c, x + 40, F - 27, x + 27, F - 25, COL.boneShade, 1.0);
  disc(c, x + 42, F - 21, 1.5, COL.gold);
  // buttons
  disc(c, x + 45, F - 12, 1.4, COL.greenTrim);
  disc(c, x + 49, F - 12, 1.2, COL.burgundy);
}

function drawSkullSpeaker(c: C, x: number, F: number, s: number) {
  const top = F - 33 * s;
  // small carved skull cabinet, keeping the speakers' old locations
  rr(c, x, top, 18 * s, 33 * s, 4 * s, COL.burgundy);
  c.strokeStyle = COL.gold;
  c.lineWidth = 0.8;
  rrPath(c, x + 0.7, top + 0.7, 16.6 * s, 31.6 * s, 3.5 * s);
  c.stroke();
  // eyes and speaker-grille mouth
  disc(c, x + 5.4 * s, top + 9 * s, 2.2 * s, COL.dark);
  disc(c, x + 12.6 * s, top + 9 * s, 2.2 * s, COL.dark);
  disc(c, x + 5.4 * s, top + 9 * s, 0.7 * s, COL.goldLight);
  disc(c, x + 12.6 * s, top + 9 * s, 0.7 * s, COL.goldLight);
  rr(c, x + 4.2 * s, top + 14 * s, 9.6 * s, 11 * s, 3 * s, "#1d1722");
  c.strokeStyle = "rgba(229,199,126,.55)";
  c.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) line(c, x + 5.2 * s, top + (16 + i * 2) * s, x + 12.8 * s, top + (16 + i * 2) * s, COL.gold, 0.55);
  line(c, x + 4 * s, F - 1, x + 14 * s, F - 1, COL.dark, 1.7);
}

function drawRecordCabinet(c: C, x: number, F: number) {
  rr(c, x, F - 29, 52, 29, 3, COL.plum);
  c.strokeStyle = COL.gold;
  c.lineWidth = 0.8;
  rrPath(c, x + 1, F - 28, 50, 26, 2.5);
  c.stroke();
  rect(c, x + 3, F - 18, 46, 1.5, COL.gold);
  // visible record spines in the upper shelf
  const colors = [COL.wine, COL.purple, "#463f62", "#70533d", "#365047"];
  for (let i = 0; i < 8; i++) {
    const xx = x + 4 + i * 5.4;
    rect(c, xx, F - 27, 4.4, 8, colors[i % colors.length]);
    rect(c, xx + 1.5, F - 25.5, 0.8, 4, "rgba(229,199,126,.6)");
  }
  // a little half-open lid
  line(c, x + 2, F - 29, x + 11, F - 35, COL.gold, 1.1);
  line(c, x + 11, F - 35, x + 42, F - 35, COL.gold, 1.1);
  line(c, x + 42, F - 35, x + 50, F - 29, COL.gold, 1.1);
  // carved eye in the center panel
  disc(c, x + 26, F - 10, 2.2, COL.boneShade);
  disc(c, x + 26, F - 10, 1, COL.dark);
  disc(c, x + 26.3, F - 10.2, 0.45, COL.goldLight);
}

function drawBoneGuitar(c: C, x: number, F: number) {
  // Same small wall-stand footprint as the old guitar at x≈818.
  c.save();
  c.translate(x + 7, F - 24);
  c.rotate(-0.12);
  // coffin-shaped hollow body
  poly(c, [[0, 6], [-5, 1], [-4, -7], [0, -10], [4, -7], [5, 1]], COL.boneShade);
  poly(c, [[0, 5], [-3.7, 0.6], [-3, -6], [0, -8], [3, -6], [3.7, 0.6]], COL.bone);
  disc(c, 0, -1.5, 1.7, COL.dark);
  // narrow spine neck and head
  rect(c, -1.4, -25, 2.8, 16, COL.boneShade);
  rect(c, -0.7, -24, 1.1, 13, COL.bone);
  for (let i = 0; i < 4; i++) {
    line(c, -2.8, -22 + i * 3.4, 2.8, -22 + i * 3.4, COL.dark, 0.7);
    disc(c, -3.1, -22 + i * 3.4, 0.8, COL.bone);
    disc(c, 3.1, -22 + i * 3.4, 0.8, COL.bone);
  }
  // violet strings
  for (let i = -1; i <= 1; i++) line(c, i * 0.9, -24, i * 0.6, 5, "#9863ca", 0.35);
  // bone tuning pegs
  for (const [dx, dy] of [[-3, -23], [3, -20], [-3, -17], [3, -14]] as Pt[]) {
    line(c, dx > 0 ? 1.2 : -1.2, dy, dx, dy, COL.boneShade, 1.1);
    disc(c, dx, dy, 1, COL.bone);
  }
  disc(c, 0, -27, 2.5, COL.bone);
  disc(c, -0.9, -27.3, 0.45, COL.dark);
  disc(c, 0.9, -27.3, 0.45, COL.dark);
  c.restore();
}

/** Small notes only during the saxophone's own phrase; no extra timer. */
export function drawOrchesterEffects(c: C, roomTime: number, saxPlaying: boolean, saxTime: number) {
  if (saxPlaying) {
    // One soft pair every nineteen seconds, each note rises for 1.4 s.
    const p = saxTime % 19;
    if (p < 1.4) {
      const u = p / 1.4;
      c.save();
      c.globalAlpha = (1 - u) * 0.62;
      drawNoteGlyph(c, 626 - u * 5, 162 - u * 18, 1.1 + 0.1 * u, COL.goldLight);
      if (p > 0.45) drawNoteGlyph(c, 638 + u * 3, 167 - u * 14, 0.85, "rgba(229,199,126,.8)");
      c.restore();
    }
    return; // music-note event has priority; no fish swim at the same time
  }
  // Fish rest almost always. Once per 75 s, one drifts slowly inside a bowl.
  const cycle = (roomTime + 37) % 75;
  if (cycle < 5) {
    const u = cycle / 5;
    const x = 635 + Math.sin(u * Math.PI) * 4 - u * 3;
    drawFish(c, x, 150 + Math.sin(u * Math.PI * 2) * 1.2, 0.7, 0.52);
  }
}

function drawNoteGlyph(c: C, x: number, y: number, s: number, color: string) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(-1.8, 0, 2.2, 1.5, -0.35, 0, Math.PI * 2);
  c.fill();
  line(c, 0, -0.1, 0, -9, color, 1.1);
  line(c, 0, -9, 4.4, -7, color, 1.1);
  c.restore();
}

/* ====================================================================== */
/*  COMPLETE ROOM OVERLAY                                                 */
/* ====================================================================== */

/**
 * Draws only the music room (x=534..830). It is called after the standard
 * house background and deliberately uses the raw context, so the global
 * Gruselhaus color treatment cannot override this room's agreed palette.
 */
export function drawOrchesterRoom(c: C, atticCeil: (x: number) => number) {
  c.save();
  c.beginPath();
  c.moveTo(X0, FD);
  for (let x = X0; x <= X1; x += 8) c.lineTo(x, atticCeil(x));
  c.lineTo(X1, FD);
  c.closePath();
  c.clip();

  // warm dark wall; wooden, inset, curved panels
  rect(c, X0, 35, X1 - X0, FD - 35, COL.wood);
  for (let x = X0 + 1; x < X1; x += 29) {
    const w = Math.min(29, X1 - x);
    const top = Math.max(atticCeil(x + w / 2) + 12, 63);
    const bottom = 184;
    rect(c, x, top, w, bottom - top, COL.rail);
    rr(c, x + 2, top + 2, w - 4, bottom - top - 4, 3, COL.recess);
    c.strokeStyle = "rgba(198,154,73,.58)";
    c.lineWidth = 0.75;
    c.beginPath();
    c.moveTo(x + 4, bottom - 4);
    c.lineTo(x + 4, top + 8);
    c.quadraticCurveTo(x + w / 2, top + 1, x + w - 4, top + 8);
    c.lineTo(x + w - 4, bottom - 4);
    c.stroke();
    // restrained grain lines
    c.strokeStyle = "rgba(229,199,126,.13)";
    c.beginPath();
    c.moveTo(x + w * 0.34, top + 15);
    c.quadraticCurveTo(x + w * 0.6, top + 28, x + w * 0.4, Math.min(top + 48, bottom - 9));
    c.stroke();
  }
  // dado / lower wainscoting
  rect(c, X0, 170, X1 - X0, 15, COL.burgundy);
  rect(c, X0, 170, X1 - X0, 1.5, COL.gold);
  rect(c, X0, 184, X1 - X0, 2, COL.gold);
  for (const x of [580, 638, 706, 756, 812]) filigree(c, x, 146, 13, 18, "rgba(198,154,73,.6)");

  // beams follow the roof slope; not a global ceiling change
  c.strokeStyle = "#30232b";
  c.lineWidth = 4.6;
  c.beginPath();
  c.moveTo(534, atticCeil(534) + 6);
  c.lineTo(650, atticCeil(650) + 6);
  c.lineTo(830, atticCeil(830) + 6);
  c.stroke();
  c.strokeStyle = "rgba(229,199,126,.45)";
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(534, atticCeil(534) + 4);
  c.lineTo(650, atticCeil(650) + 4);
  c.lineTo(830, atticCeil(830) + 4);
  c.stroke();

  // no visible window: curtain covers original round window at (590,104)
  drawCurtains(c, 573, 80, 38, 51, COL.wine);
  drawComposerPortrait(c, 681, 101, 10.5);
  drawFishLamp(c, 633, 138, 10.5, 1);
  drawFishLamp(c, 737, 151, 9.2, -1);
  // Decorative, closed doors: neither has a hitbox or passage function.
  drawMysteryDoor(c, 537, FD - 74, 36, 74, "blue"); // Unterkante exakt auf dem Boden
  drawMysteryDoor(c, 783, 120, 41, 63, "green");
  drawCarvedNotes(c, 700, 132);

  c.restore();

  // Matching floor slab thickness; the lower dark slab remains the original.
  rect(c, X0, FD, X1 - X0, 6, "#624335");
  rect(c, X0, FD, X1 - X0, 1.3, "rgba(255,255,255,.18)");
  for (let x = X0 + 16; x < X1; x += 28) rect(c, x, FD, 0.8, 6, "rgba(30,17,20,.42)");
  rect(c, X0, FD + 6, X1 - X0, 6, "#34272a");
  drawMusicRug(c, 571, FD - 5, 92, 5);

  // Redrawn in the same furniture footprints; station hitboxes remain untouched.
  drawBoneSaxStand(c, 646, FD);
  drawSkullSpeaker(c, 678, FD, 0.84);
  drawGhostGramophone(c, 698, FD);
  drawSkullSpeaker(c, 754, FD, 0.84);
  drawRecordCabinet(c, 776, FD);
  drawBoneGuitar(c, 818, FD);
}