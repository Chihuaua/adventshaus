/* =======================================================================
   METHAN FROG — Frog Company Lieferservice

   Humanoides Frosch-Maskottchen in Dienstuniform, bringt später die Post.
   FRONTANSICHT: Er steht der Haustür gegenüber und kommt auf den Betrachter
   zu. Ankerpunkte wie Luni (Hüfte -19, Schulter -36, Kopf -46.5); die Geh-
   Animation übernimmt Lunis Sinusgang (Hub, Körper, Kopf, Arme) ohne
   seitlichen Schritt. Füße nebeneinander, keine Tasche.
   Reine Canvas-2D-Primitive, keine externen Assets, keine Browser-APIs.
   ======================================================================= */

import { liveDelta } from "./editor-live";

type C = CanvasRenderingContext2D;
type V = [number, number];

/* ---------- Maße (an Luni ausgerichtet, minimal kräftiger) ---------- */
export const METHAN_MASSE = {
  hoehe: 56,
  huefte: -19,
  schulter: -36,
  kopf: -47.5,
  kopfR: 8.7,
  oberarm: 8.2,
  unterarm: 8.4,
  oberschenkel: 9.1,
  unterschenkel: 10.1,
} as const;

const HIP_Y = METHAN_MASSE.huefte;
const SHOULDER_Y = METHAN_MASSE.schulter;
const HEAD_Y = METHAN_MASSE.kopf;
const HEAD_R = METHAN_MASSE.kopfR;
const UPPER_ARM = METHAN_MASSE.oberarm;
const FORE_ARM = METHAN_MASSE.unterarm;
/** Schulter- und Hüftansatz links/rechts der Körpermitte – wie bei Luni. */
const HUEFTE_X = 2.6;

export type Gelenk =
  | "handFar"
  | "handNear"
  | "elbowFar"
  | "elbowNear"
  | "footFar"
  | "footNear"
  | "kneeFar"
  | "kneeNear"
  | "head";

/** Verschiebungen (Delta) je Gelenk, die der Editor „übernimmt“. */
export type FroschEditor = Partial<Record<Gelenk, V>>;

export type MethanPose =
  | "stand"
  | "walk"
  | "run"
  | "walkCarry"
  | "wave"
  | "carry"
  | "handover"
  | "knock"
  | "salute"
  | "consult"
  | "sit";

export type MethanExpr = "neutral" | "friendly" | "grin" | "surprised" | "tired";

/** Handhaltung: locker hängend, offen, Faust oder greifend. */
export type MethanHand = "offen" | "faust" | "halten" | "locker" | "flach";

export const METHAN_FARBEN = {
  haut: "#66a95c",
  hautHell: "#8cc47a",
  hautLicht: "#a8d493",
  hautDunkel: "#48814a",
  hautTief: "#3a6a3f",
  bauch: "#cfe0a2",
  bauchHell: "#e6efc8",
  bauchTief: "#b7cd8c",
  mund: "#2f4f35",
  mundInnen: "#5c3630",
  zunge: "#c1706b",
  augeWeiss: "#f7f4e8",
  pupille: "#16201f",
  iris: "#7a8f3e",
  uniform: "#24518c",
  uniformHell: "#3871b8",
  uniformDunkel: "#16365f",
  uniformTief: "#102844",
  naht: "rgba(255,255,255,.16)",
  knopf: "#e8b93f",
  knopfGlanz: "#ffe08a",
  schuh: "#2f2a24",
  schuhHell: "#4b443b",
  sohle: "#716759",
  muetze: "#24518c",
  muetzeHell: "#3871b8",
  muetzeSchirm: "#152f52",
  abzeichen: "#e8b93f",
  abzeichenRot: "#b8492f",
  tasche: "#b9905a",
  tascheDunkel: "#8f6c3d",
  tascheLicht: "#d3ae79",
  schnalle: "#e8b93f",
  paket: "#c59a66",
  paketHell: "#d8b17e",
  paketDunkel: "#9d7946",
  klebeband: "#ecdfc2",
  aufkleber: "#f4efe2",
  aufkleberDruck: "#3a4048",
  namensschild: "#f4efe2",
  namensschrift: "#2a3440",
  stiefelBand: "#c9b48f",
  kontur: "#24402a",
  tee: "#e8e6d4",
  teeShade: "#cfcbb6",
} as const;

const K = METHAN_FARBEN;
/* ------------------------------ Primitive ------------------------------ */

function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y);
  c.lineTo(x + w - k, y);
  c.quadraticCurveTo(x + w, y, x + w, y + k);
  c.lineTo(x + w, y + h - k);
  c.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  c.lineTo(x + k, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - k);
  c.lineTo(x, y + k);
  c.quadraticCurveTo(x, y, x + k, y);
  c.closePath();
}

function disc(c: C, x: number, y: number, r: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function ell(c: C, x: number, y: number, rx: number, ry: number, fill: string, rot = 0) {
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fill();
}

function line(c: C, a: V, b: V, color: string, w: number) {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(a[0], a[1]);
  c.lineTo(b[0], b[1]);
  c.stroke();
}

function limb(c: C, a: V, b: V, color: string, w: number) {
  line(c, a, b, color, w);
}

/* -------------------------------- Rig ---------------------------------- */

export interface MethanRig {
  rootX: number;
  rootY: number;
  hipY: number;
  shoulderY: number;
  headY: number;
  headX: number;
  headTilt: number;
  armFar: { elbow: V; hand: V };
  armNear: { elbow: V; hand: V };
  legFar: { elbow: V; hand: V };
  legNear: { elbow: V; hand: V };
  footFarAng: number;
  footNearAng: number;
  handFar: MethanHand;
  handNear: MethanHand;
  paket: boolean;
  gaze: number;
  /** Armschwung in die Tiefe: -1 nach hinten … +1 nach vorn (aus Sicht der Vorderansicht). */
  tiefeFar: number;
  tiefeNear: number;
  /** Nahe Hand wird vor dem Kopf gezeichnet (z. B. Mütze tippen). */
  armNearVorKopf: boolean;
}

/* ------------------------------ IK ------------------------------------ */

/** Zwei Hex-Farben mischen (k = 0 → a, k = 1 → b). */
function mixHex(a: string, b: string, k: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k);
  const g = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k);
  const bl = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
  return `rgb(${r},${g},${bl})`;
}

/** Wiederholbarer Zufall 0…1 – für kleine, feste Unregelmäßigkeiten der Handzeichnung. */
function pseudo(n: number): number {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function ik(s: V, ziel: V, out: 1 | -1, l1: number, l2: number): { elbow: V; hand: V } {
  let hx = ziel[0];
  let hy = ziel[1];
  let dx = hx - s[0];
  let dy = hy - s[1];
  let d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.05;
  const min = Math.abs(l1 - l2) + 0.001;
  if (d < min) {
    if (d < 0.0001) { hx = s[0] + min; hy = s[1]; } else { hx = s[0] + (dx / d) * min; hy = s[1] + (dy / d) * min; }
    dx = hx - s[0]; dy = hy - s[1]; d = min;
  }
  if (d > max) { hx = s[0] + (dx / d) * max; hy = s[1] + (dy / d) * max; dx = hx - s[0]; dy = hy - s[1]; d = max; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const k = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / d;
  const uy = dy / d;
  return { elbow: [s[0] + ux * a - uy * k * out, s[1] + uy * a + ux * k * out], hand: [hx, hy] };
}

function richtung(von: V, nach: V, d: number): V {
  const dx = nach[0] - von[0];
  const dy = nach[1] - von[1];
  const l = Math.hypot(dx, dy) || 1;
  return [nach[0] - (dx / l) * d, nach[1] - (dy / l) * d];
}

export function methanArmIK(schulter: V, hand: V, out: 1 | -1): { elbow: V; hand: V } {
  return ik(schulter, hand, out, UPPER_ARM, FORE_ARM);
}

/* -------------------------------- Rig ---------------------------------- */

function baseRig(): MethanRig {
  return {
    rootX: 0, rootY: 0, hipY: HIP_Y, shoulderY: SHOULDER_Y, headY: HEAD_Y, headX: 0, headTilt: 0,
    armFar: { elbow: [-6.4, -29], hand: [-7.6, -22] },
    armNear: { elbow: [6.4, -29], hand: [7.6, -22] },
    legFar: { elbow: [-3.6, -10], hand: [-4.6, 0] },
    legNear: { elbow: [3.6, -10], hand: [4.6, 0] },
    footFarAng: 0, footNearAng: 0, handFar: "offen", handNear: "offen", paket: false, gaze: 0,
    tiefeFar: 0, tiefeNear: 0, armNearVorKopf: false,
  };
}

/* ------------------------------ Posen ---------------------------------- */

/** Gang in Front- und Rückansicht. Alle Kurven sind glatt (Sinus bzw. Sinus²), der
    Standfuß bleibt am Boden stehen (Weltposition fest), der Schwungfuß hebt sich
    sanft. Die Arme pendeln gegengleich in die Tiefe (vor/zurück), nicht seitlich. */
function gang(r: MethanRig, th: number, modus: "walk" | "walkCarry" | "run") {
  const lauf = modus === "run";
  const s = Math.sin(th);
  const hubN = Math.max(0, s);
  const hubF = Math.max(0, -s);
  const hub = lauf ? 5.2 : 3.2;
  const liftN = hubN * hubN * hub;
  const liftF = hubF * hubF * hub;
  // Körper: glattes Auf und Ab – am tiefsten, wenn beide Füße am Boden stehen
  r.rootY = (lauf ? 1.6 : 1.3) - (lauf ? 1.3 : 1.0) * s * s;
  // Kein seitliches Pendeln, keine Kopfdrehung, kein Kopfwackeln.
  r.rootX = 0;
  r.headTilt = 0;
  const fy = (lift: number) => -r.rootY - lift;
  const fxN = 4.6 - r.rootX;
  const fxF = -4.6 - r.rootX;
  const knie = (hx: number, fx: number, fyy: number, lift: number, seite: number): V => [
    (hx + fx) / 2 + seite * 0.45,
    -19 + (fyy + 19) * 0.5 - lift * 0.45,
  ];
  r.legNear = { elbow: knie(2.6, fxN, fy(liftN), liftN, 1), hand: [fxN, fy(liftN)] };
  r.legFar = { elbow: knie(-2.6, fxF, fy(liftF), liftF, -1), hand: [fxF, fy(liftF)] };
  r.footNearAng = 0;
  r.footFarAng = 0;
  if (modus === "walkCarry") return;
  // Arme ohne Paket: Pendeln vor/zurück, gegengleich zu den Beinen
  const A = lauf ? 0.85 : 0.5;
  const c0 = Math.cos(th);
  const arm = (seite: 1 | -1, phi: number) => {
    const beta = (lauf ? 1.0 : 0.3) + (lauf ? 0.4 : 0.22) * (0.5 + (0.5 * phi) / A);
    const ey = SHOULDER_Y + 1.2 + 7.4 * Math.cos(phi);
    const hy = ey + 6.0 * Math.cos(phi + beta);
    return { elbow: [seite * 7.8, ey] as V, hand: [seite * 8.2, hy] as V };
  };
  r.armNear = arm(1, A * c0);
  r.armFar = arm(-1, -A * c0);
  r.tiefeNear = c0;
  r.tiefeFar = -c0;
  r.handNear = "locker";
  r.handFar = "locker";
}

export function methanRig(pose: MethanPose, t: number, walkP: number, expr: MethanExpr): MethanRig {
  const r = baseRig();
  const atem = Math.sin(t * 2) * 0.45;
  const SH_F: V = [-6.15, r.shoulderY + 2.3];
  const SH_N: V = [6.15, r.shoulderY + 2.3];
  /** Paket vor dem Bauch halten: Hände an den Seitenkanten. */
  /** Paket auf flachen Händen tragen: die Hände liegen unter der Unterkante. */
  const tragen = (y: number, x: number) => {
    r.armFar = methanArmIK(SH_F, [-x, y], 1);
    r.armNear = methanArmIK(SH_N, [x, y], -1);
    r.handFar = "flach";
    r.handNear = "flach";
    r.paket = true;
  };
  switch (pose) {
    case "walk":
      gang(r, walkP, "walk");
      break;
    case "run":
      gang(r, walkP, "run");
      break;
    case "walkCarry":
      gang(r, walkP, "walkCarry");
      tragen(-18.4, 4.6);
      break;
    case "wave": {
      const w = Math.sin(t * 7);
      r.armNear = methanArmIK(SH_N, [11.0 + w * 1.0, -45 + w * 2.2], 1);
      r.handNear = "offen";
      r.headTilt = -0.05;
      break;
    }
    case "carry":
      tragen(-18.4, 4.6);
      break;
    case "handover":
      // Übergabe: etwas angehoben und nach vorn gereicht – Hände etwas breiter,
      // Arme kommen dem Betrachter näher (größer, heller).
      tragen(-21.6, 6.0);
      r.tiefeFar = 0.6;
      r.tiefeNear = 0.6;
      r.headTilt = 0.04;
      break;
    case "knock": {
      const k = Math.sin(t * 5.5);
      r.armNear = methanArmIK(SH_N, [9.2 + k * 1.0, -31 + k * 0.7], 1);
      r.handNear = "faust";
      r.headTilt = 0.03;
      break;
    }
    case "salute":
      r.armNear = methanArmIK(SH_N, [8.4, -52], 1);
      r.handNear = "offen";
      r.headTilt = -0.06;
      r.armNearVorKopf = true;
      break;
    case "consult":
      r.armNear = methanArmIK(SH_N, [2.4, -29], 1);
      r.armFar = methanArmIK(SH_F, [-4.2, -27], -1);
      r.handNear = "halten";
      r.handFar = "halten";
      r.headTilt = 0.14;
      break;
    case "sit":
      r.rootY = 8;
      r.legFar = { elbow: [-4.6, -8], hand: [-5.2, 0] };
      r.legNear = { elbow: [4.6, -8], hand: [5.2, 0] };
      r.armFar = methanArmIK([-5.9, SHOULDER_Y + 10], [-7.4, -13], -1);
      r.armNear = methanArmIK([5.9, SHOULDER_Y + 10], [7.4, -13], 1);
      r.handFar = "locker";
      r.handNear = "locker";
      break;
    default:
      r.rootY = atem * 0.5;
      r.headTilt = Math.sin(t * 1.2) * 0.03;
      // entspannt: Ellbogen weich gebeugt, Handgelenk leicht nach vorn
      r.armFar = { elbow: [-7.3, -28.4], hand: [-6.9, -21.2 + atem * 0.3] };
      r.armNear = { elbow: [7.3, -28.4], hand: [6.9, -21.2 + atem * 0.3] };
      r.handFar = "locker";
      r.handNear = "locker";
      r.tiefeFar = 0.3;
      r.tiefeNear = 0.4;
      r.legFar = { elbow: [-3.6, -10], hand: [-4.6, 0] };
      r.legNear = { elbow: [3.6, -10], hand: [4.6, 0] };
  }
  if (expr === "tired") r.headTilt += 0.06;
  if (expr === "surprised") r.headTilt -= 0.04;
  return r;
}

/* ------------------------------ Gelenke -------------------------------- */

export function methanPunkte(pose: MethanPose, t: number, walkP: number, expr: MethanExpr, edit?: FroschEditor): Record<Gelenk, V> {
  const r = methanRig(pose, t, walkP, expr);
  const w = (p: V, d?: V): V => [p[0] + (d?.[0] ?? 0), p[1] + (d?.[1] ?? 0)];
  return {
    handFar: w(r.armFar.hand, edit?.handFar), handNear: w(r.armNear.hand, edit?.handNear),
    elbowFar: w(r.armFar.elbow, edit?.elbowFar), elbowNear: w(r.armNear.elbow, edit?.elbowNear),
    footFar: w(r.legFar.hand, edit?.footFar), footNear: w(r.legNear.hand, edit?.footNear),
    kneeFar: w(r.legFar.elbow, edit?.kneeFar), kneeNear: w(r.legNear.elbow, edit?.kneeNear),
    head: w([r.headX, r.headY], edit?.head),
  };
}

/* ------------------------------ Hand ---------------------------------- */

function drawHandVorn(c: C, hand: V, seite: 1 | -1, haltung: MethanHand) {
  c.save();
  c.translate(hand[0], hand[1]);
  c.lineCap = "round"; c.lineJoin = "round";
  c.fillStyle = K.hautHell;
  c.beginPath();
  c.moveTo(-2.0, -1.4);
  c.quadraticCurveTo(-2.6, 0.2, -1.8, 1.6);
  c.quadraticCurveTo(-0.2, 2.2, 1.6, 1.6);
  c.quadraticCurveTo(2.5, 0.4, 1.8, -1.2);
  c.quadraticCurveTo(0.6, -2.0, -2.0, -1.4);
  c.closePath(); c.fill();
  c.strokeStyle = K.hautTief; c.lineWidth = 0.32; c.stroke();
  const fingerX = [-1.4, -0.5, 0.4, 1.3];
  const fingerL = haltung === "offen" ? [2.6, 3.0, 2.8, 2.2] : haltung === "locker" ? [2.0, 2.3, 2.1, 1.7] : [1.0, 1.1, 1.0, 0.8];
  const kruemm = haltung === "locker" ? 0.35 : haltung === "offen" ? 0.1 : 0;
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = K.hautHell;
    c.lineWidth = haltung === "offen" || haltung === "locker" ? 0.95 : 1.05;
    c.beginPath();
    c.moveTo(fingerX[i], 1.2);
    c.quadraticCurveTo(fingerX[i] + seite * kruemm, 1.2 + fingerL[i] * 0.6, fingerX[i] + seite * (0.05 + kruemm * 0.5), 1.2 + fingerL[i]);
    c.stroke();
    if (haltung === "offen" || haltung === "locker") disc(c, fingerX[i] + seite * (0.05 + kruemm * 0.5), 1.4 + fingerL[i], 0.3, "rgba(255,255,255,.22)");
  }
  c.strokeStyle = K.hautHell; c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(seite > 0 ? -1.8 : 1.8, 0.2);
  c.quadraticCurveTo(seite > 0 ? -3.0 : 3.0, 0.9, seite > 0 ? -3.4 : 3.4, 2.0);
  c.stroke();
  disc(c, seite > 0 ? -3.4 : 3.4, 2.2, 0.55, K.hautHell);
  c.restore();
}

/** Locker hängende Hand beim Gehen: Die Handfläche zeigt zum Oberschenkel. Von vorn
    sieht man die Daumenseite (Daumen vorn, Finger leicht eingerollt), von hinten die
    Kleinfingerseite mit den Knöcheln. */
/** Locker hängende Hand beim Gehen. +x zeigt vom Körper weg; die Handfläche
    liegt am Oberschenkel, man sieht also den Handrücken mit vier Fingern und
    dem Daumen an der Außenseite. */
/** Locker hängende Hand (Handrücken zum Betrachter): vier klar getrennte,
    leicht gebogene Finger mit Nägeln, Faltenspalten an den Handwurzeln,
    getrennter Daumen. Hautfarbe wie im Gesicht (K.haut), nur hell beschienen. */
/** Hängende Hand mit der Innenfläche zum Körper: Daumen zeigt zur Mitte,
    Finger hängen nach unten und sind leicht gebogen. Die Konturen sind in
    dunklem Grün gezogen (keine schwarzen Linien), damit die Finger sichtbar
    bleiben und natürlich wirken. */
function drawHandLocker(c: C, hand: V, elbow: V, seite: 1 | -1, rueck: boolean) {
  c.save();
  c.translate(hand[0], hand[1]);
  // Handachse: vom Ellbogen zur Hand, "unten" = Fingerrichtung
  c.rotate(Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]) - Math.PI / 2);
  // +x zeigt nach außen (vom Körper weg); die Innenfläche liegt zum Körper
  c.scale(seite * 1.25, 1.25);
  c.lineCap = "round";
  c.lineJoin = "round";
  const haut = rueck ? K.hautDunkel : K.haut;
  const hell = rueck ? K.haut : K.hautHell;
  const linie = K.hautTief;
  // Vier Finger: getrennte Umrisse, innen heller, Spitzen leicht gebogen
  const finger = [
    { x: -1.52, len: 2.15, kurve: -0.34, breite: 0.4 },
    { x: -0.5, len: 2.62, kurve: -0.4, breite: 0.42 },
    { x: 0.52, len: 2.45, kurve: -0.36, breite: 0.4 },
    { x: 1.5, len: 1.9, kurve: -0.28, breite: 0.38 },
  ];
  for (const fg of finger) {
    const x = fg.x;
    const y0 = 0.55;
    const spitzeX = x + fg.kurve;
    const spitzeY = y0 + fg.len;
    // Grundglied: vom Handrücken bis zum Mittelglied
    const b = fg.breite;
    c.beginPath();
    c.moveTo(x - b, y0 - 0.45);
    c.quadraticCurveTo(x - b - 0.06, y0 + fg.len * 0.5, spitzeX - b * 0.82, spitzeY - 0.28);
    c.quadraticCurveTo(spitzeX, spitzeY + 0.26, spitzeX + b * 0.82, spitzeY - 0.32);
    c.quadraticCurveTo(x + b + 0.04, y0 + fg.len * 0.45, x + b, y0 - 0.45);
    c.closePath();
    c.fillStyle = haut;
    c.fill();
    c.strokeStyle = linie;
    c.lineWidth = 0.22;
    c.stroke();
    // helleres Innenlicht auf dem Finger
    c.save();
    c.clip();
    c.fillStyle = "rgba(255,255,255,.14)";
    c.beginPath();
    c.ellipse(x + 0.02, y0 + fg.len * 0.55, 0.26, fg.len * 0.4, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // Nagel
    c.fillStyle = "rgba(246,240,224,.55)";
    c.beginPath();
    c.ellipse(spitzeX - 0.04, spitzeY - 0.3, 0.16, 0.2, 0.35, 0, Math.PI * 2);
    c.fill();
    // Mittelglied-Falte in Grün
    c.strokeStyle = "rgba(58,106,63,.55)";
    c.lineWidth = 0.15;
    c.beginPath();
    c.moveTo(x - 0.26, y0 + fg.len * 0.5);
    c.quadraticCurveTo(x, y0 + fg.len * 0.6, x + 0.28, y0 + fg.len * 0.48);
    c.stroke();
  }
  // Handfläche (Innenseite zum Körper): schmaler und höher, damit die Finger
  // daneben frei sichtbar bleiben
  c.beginPath();
  c.moveTo(-1.42, -1.75);
  c.lineTo(1.42, -1.75);
  c.quadraticCurveTo(1.62, -0.6, 1.42, 0.1);
  c.quadraticCurveTo(1.2, 0.42, 0.85, 0.34);
  c.quadraticCurveTo(0.3, 0.5, -0.3, 0.36);
  c.quadraticCurveTo(-0.95, 0.46, -1.45, 0.12);
  c.quadraticCurveTo(-1.66, -0.6, -1.42, -1.75);
  c.closePath();
  c.fillStyle = hell;
  c.fill();
  c.strokeStyle = linie;
  c.lineWidth = 0.3;
  c.stroke();
  c.strokeStyle = linie;
  c.lineWidth = 0.3;
  c.stroke();
  // weiche Wölbung der Handfläche (Licht zur Mitte, Schatten zum Körper)
  c.save();
  c.clip();
  c.fillStyle = "rgba(255,255,255,.18)";
  c.beginPath();
  c.ellipse(0.05, -0.75, 0.95, 0.62, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(52,96,58,.2)";
  c.beginPath();
  c.ellipse(-1.05, -0.4, 0.5, 0.9, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Faltenspalten an den Handwurzeln (grün)
  c.strokeStyle = "rgba(52,96,58,.6)";
  c.lineWidth = 0.16;
  for (const wx of [-0.78, -0.06, 0.66]) {
    c.beginPath();
    c.moveTo(wx - 0.18, 0.2);
    c.quadraticCurveTo(wx, 0.4, wx + 0.2, 0.22);
    c.stroke();
  }
  // Daumen: zeigt zur Körpermitte, liegt auf der Handfläche
  c.beginPath();
  c.moveTo(-1.05, -1.35);
  c.quadraticCurveTo(-1.72, -0.6, -1.78, 0.35);
  c.quadraticCurveTo(-1.8, 1.1, -1.42, 1.25);
  c.quadraticCurveTo(-1.12, 1.34, -1.2, 0.85);
  c.quadraticCurveTo(-1.28, 0.0, -1.06, -0.7);
  c.quadraticCurveTo(-0.92, -1.12, -0.72, -1.5);
  c.closePath();
  c.fillStyle = hell;
  c.fill();
  c.strokeStyle = linie;
  c.lineWidth = 0.24;
  c.stroke();
  // Daumen-Nagel
  c.fillStyle = "rgba(246,240,224,.55)";
  c.beginPath();
  c.ellipse(-1.54, 0.78, 0.16, 0.19, -0.4, 0, Math.PI * 2);
  c.fill();
  // Grundglied-Falte des Daumens
  c.strokeStyle = "rgba(52,96,58,.55)";
  c.lineWidth = 0.15;
  c.beginPath();
  c.moveTo(-1.28, 0.28);
  c.quadraticCurveTo(-1.5, 0.42, -1.72, 0.24);
  c.stroke();
  c.restore();
}

/** Flache Hand, die das Paket von unten trägt: Die Finger legen sich über die
    Unterkante des Pakets, die Handfläche trägt es. */
/** Handfläche, die das Paket von unten trägt (vor dem Paket gezeichnet). */
function drawHandFlach(c: C, hand: V, seite: 1 | -1) {
  c.save();
  c.translate(hand[0], hand[1]);
  c.scale(seite, 1);
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-2.2, -1.15);
  c.quadraticCurveTo(-2.5, 0.55, -1.9, 1.5);
  c.quadraticCurveTo(0, 2.15, 1.9, 1.5);
  c.quadraticCurveTo(2.5, 0.55, 2.2, -1.15);
  c.closePath();
  c.fillStyle = K.haut;
  c.fill();
  c.strokeStyle = K.hautTief;
  c.lineWidth = 0.3;
  c.stroke();
  // Handballen-Wölbung
  c.fillStyle = "rgba(255,255,255,.12)";
  c.beginPath();
  c.ellipse(-0.5, 0.4, 1.2, 0.7, -0.15, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Finger, die das Paket halten (nach dem Paket gezeichnet): vier Fingerspitzen
    über der Vorderkante mit Druckmulden im Papier, Daumen greift über die Seite. */
function drawFingerGriff(c: C, hand: V, seite: 1 | -1) {
  c.save();
  c.translate(hand[0], hand[1]);
  c.scale(seite, 1);
  c.lineCap = "round";
  c.lineJoin = "round";
  const kante = -1.35; // Oberkante der Hand ≈ Unterkante Paket
  // Druckmulden im Papier direkt über den Spitzen
  c.fillStyle = "rgba(90,10,18,.3)";
  for (let i = 0; i < 4; i++) {
    const fx = -1.72 + i * 1.15;
    c.beginPath();
    c.ellipse(fx, kante - 0.62, 0.55, 0.3, 0, 0, Math.PI * 2);
    c.fill();
  }
  // vier Fingerspitzen über der Kante
  for (let i = 0; i < 4; i++) {
    const fx = -1.72 + i * 1.15;
    c.beginPath();
    rr(c, fx - 0.42, kante - 0.55, 0.84, 1.75, 0.42);
    c.fillStyle = i === 3 ? K.hautHell : K.haut;
    c.fill();
    c.strokeStyle = K.hautTief;
    c.lineWidth = 0.22;
    c.stroke();
    // Nagel
    c.fillStyle = "rgba(246,240,224,.5)";
    c.beginPath();
    c.ellipse(fx, kante + 0.72, 0.2, 0.16, 0, 0, Math.PI * 2);
    c.fill();
    // Endglied-Falte
    c.strokeStyle = "rgba(30,60,35,.3)";
    c.lineWidth = 0.13;
    c.beginPath();
    c.moveTo(fx - 0.3, kante - 0.14);
    c.quadraticCurveTo(fx, kante + 0.02, fx + 0.3, kante - 0.14);
    c.stroke();
  }
  // Daumen: greift von der Seite unter die Unterkante – er bleibt unter der Kante
  c.beginPath();
  c.moveTo(2.05, -1.0);
  c.quadraticCurveTo(2.85, -0.8, 2.72, -0.05);
  c.quadraticCurveTo(2.56, 0.62, 1.95, 0.55);
  c.quadraticCurveTo(2.22, -0.2, 1.85, -0.55);
  c.closePath();
  c.fillStyle = K.hautHell;
  c.fill();
  c.strokeStyle = K.hautTief;
  c.lineWidth = 0.22;
  c.stroke();
  c.fillStyle = "rgba(246,240,224,.5)";
  c.beginPath();
  c.ellipse(2.42, 0.16, 0.17, 0.2, -0.3, 0, Math.PI * 2);
  c.fill();
  // Daumendruck an der Unterkante
  c.fillStyle = "rgba(90,10,18,.25)";
  c.beginPath();
  c.ellipse(2.3, -1.42, 0.34, 0.14, 0.25, 0, Math.PI * 2);
  c.fill();
  c.restore();
}


/* ----------------------------- Stiefel --------------------------------- */

function drawBootVorn(c: C, fuss: V, ang: number, vorne: boolean) {
  c.save();
  c.translate(fuss[0], fuss[1]); c.rotate(ang);
  const leder = vorne ? K.schuh : K.schuhHell;
  c.fillStyle = leder;
  c.beginPath();
  c.moveTo(-3.0, -3.1);
  c.quadraticCurveTo(-3.2, -0.4, -2.6, 0);
  c.quadraticCurveTo(0, 0.5, 3.0, 0);
  c.quadraticCurveTo(3.3, -0.4, 3.0, -3.1);
  c.closePath(); c.fill();
  c.fillStyle = leder; rr(c, -2.6, -6.2, 5.2, 3.5, 1.1); c.fill();
  c.fillStyle = vorne ? "#3b352d" : "#5a5148"; rr(c, -2.6, -6.2, 5.2, 0.9, 0.45); c.fill();
  c.fillStyle = K.sohle; rr(c, -3.3, -0.6, 6.7, 0.8, 0.38); c.fill();
  c.fillStyle = "rgba(0,0,0,.2)"; rr(c, -3.3, -0.6, 6.7, 0.28, 0.14); c.fill();
  c.fillStyle = K.knopf; rr(c, -0.6, -4.9, 1.2, 0.8, 0.22); c.fill();
  c.fillStyle = K.knopfGlanz; rr(c, -0.5, -4.75, 0.8, 0.24, 0.1); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.4;
  c.beginPath();
  c.moveTo(-3.0, -3.1);
  c.quadraticCurveTo(-3.2, -0.4, -2.6, 0);
  c.quadraticCurveTo(0, 0.5, 3.0, 0);
  c.quadraticCurveTo(3.3, -0.4, 3.0, -3.1);
  c.stroke();
  c.restore();
}

function drawBootHinten(c: C, fuss: V, ang: number, vorne: boolean) {
  c.save();
  c.translate(fuss[0], fuss[1]); c.rotate(ang);
  const leder = vorne ? K.schuhHell : K.schuh;
  c.fillStyle = leder; rr(c, -2.6, -6.2, 5.2, 3.8, 1.1); c.fill();
  c.fillStyle = vorne ? "#5a5148" : "#3b352d"; rr(c, -2.2, -1.4, 4.4, 1.6, 0.8); c.fill();
  c.fillStyle = K.sohle; rr(c, -3.2, -0.5, 6.4, 0.7, 0.3); c.fill();
  c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 0.4;
  c.beginPath(); c.moveTo(0, -5.8); c.lineTo(0, -1.6); c.stroke();
  c.restore();
}

/* ------------------------------ Rumpf ---------------------------------- */

function drawTorsoVorn(c: C, r: MethanRig) {
  const topY = r.shoulderY;
  const botY = r.hipY;
  // T-Shirt (Schultern bis Hüfte), Halsausschnitt gibt den Hals frei
  hemdPfad(c, r, false);
  c.fillStyle = K.tee; c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.35; c.stroke();
  // Hose (Latzhose, Beinansatz)
  c.fillStyle = K.uniform;
  c.beginPath();
  c.moveTo(-6.8, botY - 3.4);
  c.lineTo(-7.0, botY + 1.8);
  c.quadraticCurveTo(0, botY + 2.8, 7.0, botY + 1.8);
  c.lineTo(6.8, botY - 3.4);
  c.quadraticCurveTo(0, botY - 4.6, -6.8, botY - 3.4);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.38; c.stroke();
  c.fillStyle = K.uniformDunkel; rr(c, -6.9, botY, 13.8, 2.2, 1.0); c.fill();
  c.strokeStyle = K.naht; c.lineWidth = 0.4; c.setLineDash([1.6, 1.4]);
  c.beginPath(); c.moveTo(-6.2, botY + 1.0); c.lineTo(6.2, botY + 1.0); c.stroke(); c.setLineDash([]);
  // Latz (Brustteil)
  c.fillStyle = K.uniform;
  c.beginPath();
  c.moveTo(-4.6, topY + 2.4);
  c.quadraticCurveTo(-4.8, topY + 9.0, -4.4, botY - 2.6);
  c.lineTo(4.4, botY - 2.6);
  c.quadraticCurveTo(4.8, topY + 9.0, 4.6, topY + 2.4);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.38; c.stroke();
  c.fillStyle = K.uniformHell; rr(c, -4.0, topY + 3.0, 8.0, 1.4, 0.7); c.fill();
  c.strokeStyle = K.naht; c.lineWidth = 0.42; c.setLineDash([1.6, 1.4]);
  c.beginPath(); c.moveTo(-3.9, topY + 5.0); c.lineTo(-3.9, botY - 3.2); c.moveTo(3.9, topY + 5.0); c.lineTo(3.9, botY - 3.2); c.stroke(); c.setLineDash([]);
  // Latztasche mit Stift
  c.fillStyle = K.uniformHell; rr(c, -2.4, topY + 7.6, 4.8, 3.6, 0.7); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.35; c.stroke();
  c.strokeStyle = K.uniformDunkel; c.lineWidth = 0.4; c.strokeRect(-2.2, topY + 7.8, 4.4, 0.7);
  c.fillStyle = K.knopf; c.fillRect(1.0, topY + 6.4, 0.5, 2.4);
  // Namensschild
  c.fillStyle = K.namensschild; rr(c, -3.8, topY + 4.0, 3.4, 2.0, 0.4); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.28; c.stroke();
  c.fillStyle = K.namensschrift; c.fillRect(-3.5, topY + 4.75, 2.7, 0.42);
  c.fillStyle = K.uniform; c.fillRect(-3.5, topY + 5.4, 1.6, 0.3);
  // Träger, Knöpfe, Schulterklappen
  for (const sx of [-1, 1]) {
    c.strokeStyle = K.uniformDunkel; c.lineWidth = 2.0; c.lineCap = "round";
    c.beginPath(); c.moveTo(sx * 5.3, topY + 0.5); c.lineTo(sx * 3.4, topY + 3.2); c.stroke();
    c.strokeStyle = K.naht; c.lineWidth = 0.4;
    c.beginPath(); c.moveTo(sx * 5.2, topY + 0.8); c.lineTo(sx * 3.5, topY + 3.1); c.stroke();
    disc(c, sx * 2.9, topY + 3.4, 0.8, K.knopf);
    disc(c, sx * 2.9 - 0.22, topY + 3.2, 0.3, K.knopfGlanz);
    c.fillStyle = K.uniformDunkel;
    c.beginPath();
    c.moveTo(sx * 5.2, topY - 0.2); c.lineTo(sx * 7.4, topY + 0.2); c.lineTo(sx * 7.2, topY + 2.4); c.lineTo(sx * 4.8, topY + 2.0);
    c.closePath(); c.fill();
    c.strokeStyle = K.kontur; c.lineWidth = 0.32; c.stroke();
  }
  // Hosentaschen
  for (const sx of [-1, 1]) {
    c.fillStyle = K.uniformHell;
    c.beginPath();
    c.moveTo(sx * 4.4 - 1.4, botY - 2.6); c.lineTo(sx * 4.4 + 1.4, botY - 2.6); c.lineTo(sx * 4.4 + 1.2, botY + 0.4); c.lineTo(sx * 4.4 - 1.2, botY + 0.4);
    c.closePath(); c.fill();
    c.strokeStyle = K.kontur; c.lineWidth = 0.32; c.stroke();
    c.strokeStyle = K.uniformDunkel; c.lineWidth = 0.45;
    c.beginPath(); c.moveTo(sx * 4.4 - 1.2, botY - 2.4); c.lineTo(sx * 4.4 + 1.2, botY - 2.4); c.stroke();
  }
}

function drawTorsoHinten(c: C, r: MethanRig) {
  const topY = r.shoulderY;
  const botY = r.hipY;
  hemdPfad(c, r, true);
  c.fillStyle = K.tee; c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.35; c.stroke();
  // Hose
  c.fillStyle = K.uniform;
  c.beginPath();
  c.moveTo(-6.8, botY - 3.4);
  c.lineTo(-7.0, botY + 1.8);
  c.quadraticCurveTo(0, botY + 2.8, 7.0, botY + 1.8);
  c.lineTo(6.8, botY - 3.4);
  c.quadraticCurveTo(0, botY - 4.6, -6.8, botY - 3.4);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.38; c.stroke();
  c.fillStyle = K.uniformDunkel; rr(c, -6.9, botY, 13.8, 2.2, 1.0); c.fill();
  // Latz-Rücken
  c.fillStyle = K.uniform;
  c.beginPath();
  c.moveTo(-4.8, topY + 2.0);
  c.quadraticCurveTo(-5.0, botY - 2, -4.4, botY - 2.6);
  c.lineTo(4.4, botY - 2.6);
  c.quadraticCurveTo(5.0, botY - 2, 4.8, topY + 2.0);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.36; c.stroke();
  c.fillStyle = K.uniformHell; rr(c, -4.2, topY + 2.6, 8.4, 1.3, 0.7); c.fill();
  // Gekreuzte Träger
  for (const sx of [-1, 1]) {
    c.strokeStyle = K.uniformDunkel; c.lineWidth = 2.0; c.lineCap = "round";
    c.beginPath(); c.moveTo(sx * 5.3, topY + 0.6); c.quadraticCurveTo(sx * 3.2, topY + 3.0, -sx * 4.4, botY - 2.4); c.stroke();
    disc(c, -sx * 4.4, botY - 2.0, 0.8, K.knopf);
  }
  // Rückentaschen
  for (const sx of [-1, 1]) {
    c.fillStyle = K.uniformHell; rr(c, sx * 4.2 - 1.5, botY - 2.4, 3.0, 3.0, 0.7); c.fill();
    c.strokeStyle = K.kontur; c.lineWidth = 0.32; c.stroke();
    c.strokeStyle = K.uniformDunkel; c.lineWidth = 0.45;
    c.beginPath(); c.moveTo(sx * 4.2 - 1.3, botY - 2.2); c.lineTo(sx * 4.2 + 1.3, botY - 2.2); c.stroke();
  }
}

/* ------------------------------ Kopf ---------------------------------- */

function drawKopfVorn(c: C, kopf: V, tilt: number, expr: MethanExpr, blink: boolean, gaze: number) {
  c.save();
  c.translate(kopf[0], kopf[1]); c.rotate(tilt);
  const R = HEAD_R;
  const ex = R * 0.48;
  const ey = -R * 0.02;
  const augenR = R * 0.4;
  c.fillStyle = K.haut;
  c.beginPath();
  c.moveTo(-R * 1.12, 0);
  c.quadraticCurveTo(-R * 1.1, -R * 0.88, -R * 0.4, -R * 0.92);
  c.quadraticCurveTo(0, -R * 0.96, R * 0.4, -R * 0.92);
  c.quadraticCurveTo(R * 1.1, -R * 0.88, R * 1.12, 0);
  c.quadraticCurveTo(R * 1.1, R * 0.88, R * 0.4, R * 0.9);
  c.quadraticCurveTo(0, R * 0.94, -R * 0.4, R * 0.9);
  c.quadraticCurveTo(-R * 1.1, R * 0.88, -R * 1.12, 0);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.42; c.stroke();
  ell(c, -R * 0.24, -R * 0.44, R * 0.66, R * 0.26, K.hautHell);
  c.fillStyle = "rgba(46,86,50,.22)";
  c.beginPath(); c.ellipse(0, R * 0.46, R * 0.88, R * 0.42, 0, 0, Math.PI); c.fill();
  ell(c, -R * 0.72, R * 0.38, R * 0.2, R * 0.13, "rgba(214,120,110,.22)");
  ell(c, R * 0.72, R * 0.38, R * 0.2, R * 0.13, "rgba(214,120,110,.22)");
  disc(c, -ex, ey, augenR + 0.55, K.haut);
  disc(c, ex, ey, augenR + 0.55, K.haut);
  c.strokeStyle = K.kontur; c.lineWidth = 0.36;
  c.beginPath(); c.arc(-ex, ey, augenR + 0.55, 0, Math.PI * 2); c.arc(ex, ey, augenR + 0.55, 0, Math.PI * 2); c.stroke();
  for (const sx of [-1, 1]) {
    const ax = sx * ex;
    disc(c, ax, ey, augenR, K.augeWeiss);
    const px = ax + gaze * R * 0.14;
    disc(c, px, ey + 0.1, augenR * 0.56, K.iris);
    disc(c, px, ey + 0.1, augenR * 0.34, K.pupille);
    disc(c, px + augenR * 0.16, ey - augenR * 0.22, augenR * 0.13, "rgba(255,255,255,.95)");
    disc(c, px - augenR * 0.2, ey + augenR * 0.22, augenR * 0.07, "rgba(255,255,255,.45)");
    c.strokeStyle = K.hautDunkel; c.lineWidth = 0.55;
    c.beginPath(); c.arc(ax, ey, augenR + 0.2, Math.PI * 1.12, Math.PI * 1.88); c.stroke();
    if (blink || expr === "tired") {
      c.fillStyle = K.haut;
      c.beginPath(); c.ellipse(ax, ey - 0.1, augenR + 0.25, augenR * 0.98, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = K.kontur; c.lineWidth = 0.9;
      c.beginPath(); c.arc(ax, ey - augenR * 0.5, augenR * 0.95, Math.PI * 0.18, Math.PI * 0.82); c.stroke();
    }
  }
  disc(c, -R * 0.15, R * 0.26, R * 0.05, K.hautTief);
  disc(c, R * 0.15, R * 0.26, R * 0.05, K.hautTief);
  const my = R * 0.48;
  c.strokeStyle = K.mund; c.lineWidth = 1.0; c.lineCap = "round";
  if (expr === "grin" || expr === "surprised") {
    c.fillStyle = K.mundInnen;
    c.beginPath();
    c.moveTo(-R * 0.46, my - R * 0.06);
    c.quadraticCurveTo(0, my + R * 0.04, R * 0.48, my - R * 0.06);
    c.quadraticCurveTo(R * 0.22, my + R * (expr === "surprised" ? 0.6 : 0.44), 0, my + R * 0.4);
    c.quadraticCurveTo(-R * 0.26, my + R * (expr === "surprised" ? 0.56 : 0.4), -R * 0.46, my - R * 0.06);
    c.closePath(); c.fill();
    c.strokeStyle = K.kontur; c.lineWidth = 0.4; c.stroke();
    ell(c, 0, my + R * 0.38, R * 0.22, R * 0.1, K.zunge);
  } else {
    c.beginPath();
    c.moveTo(-R * 0.64, my); c.quadraticCurveTo(0, my + R * 0.28, R * 0.64, my); c.stroke();
  }
  const mz = -R * 0.58;
  c.fillStyle = K.muetze;
  c.beginPath();
  c.moveTo(-R * 1.0, mz);
  c.quadraticCurveTo(-R * 0.8, -R * 1.44, 0, -R * 1.48);
  c.quadraticCurveTo(R * 0.8, -R * 1.44, R * 1.0, mz);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.4; c.stroke();
  c.fillStyle = K.muetzeHell;
  c.beginPath();
  c.moveTo(-R * 0.5, mz - R * 0.26);
  c.quadraticCurveTo(-R * 0.2, -R * 1.3, R * 0.3, -R * 1.16);
  c.quadraticCurveTo(-R * 0.1, -R * 1.04, -R * 0.36, mz - R * 0.16);
  c.closePath(); c.fill();
  c.strokeStyle = K.naht; c.lineWidth = 0.35; c.setLineDash([1.2, 1.1]);
  c.beginPath(); c.moveTo(-R * 0.4, mz - R * 0.4); c.quadraticCurveTo(0, -R * 1.22, R * 0.4, mz - R * 0.4); c.stroke(); c.setLineDash([]);
  c.fillStyle = K.muetzeSchirm; rr(c, -R * 1.01, mz - R * 0.04, R * 2.02, R * 0.26, R * 0.1); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.36; c.stroke();
  disc(c, 0, mz - R * 0.48, R * 0.16, K.abzeichen);
  disc(c, 0, mz - R * 0.48, R * 0.09, K.abzeichenRot);
  c.strokeStyle = K.knopfGlanz; c.lineWidth = 0.3;
  c.beginPath(); c.arc(0, mz - R * 0.48, R * 0.2, 0, Math.PI * 2); c.stroke();
  c.fillStyle = K.muetzeSchirm;
  c.beginPath();
  c.moveTo(-R * 0.94, mz + R * 0.04);
  c.quadraticCurveTo(0, mz + R * 0.42, R * 0.94, mz + R * 0.04);
  c.quadraticCurveTo(0, mz + R * 0.6, -R * 0.94, mz + R * 0.04);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.4; c.stroke();
  c.strokeStyle = "rgba(255,255,255,.16)"; c.lineWidth = 0.45;
  c.beginPath(); c.moveTo(-R * 0.6, mz + R * 0.18); c.quadraticCurveTo(0, mz + R * 0.4, R * 0.6, mz + R * 0.18); c.stroke();
  c.restore();
}

function drawKopfHinten(c: C, kopf: V, tilt: number) {
  c.save();
  c.translate(kopf[0], kopf[1]); c.rotate(tilt);
  const R = HEAD_R;
  c.fillStyle = K.hautDunkel;
  c.beginPath();
  c.moveTo(-R * 1.1, 0);
  c.quadraticCurveTo(-R * 1.08, -R * 0.86, -R * 0.4, -R * 0.9);
  c.quadraticCurveTo(0, -R * 0.94, R * 0.4, -R * 0.9);
  c.quadraticCurveTo(R * 1.08, -R * 0.86, R * 1.1, 0);
  c.quadraticCurveTo(R * 1.08, R * 0.86, R * 0.4, R * 0.9);
  c.quadraticCurveTo(0, R * 0.92, -R * 0.4, R * 0.9);
  c.quadraticCurveTo(-R * 1.08, R * 0.86, -R * 1.1, 0);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.42; c.stroke();
  ell(c, -R * 0.2, -R * 0.5, R * 0.6, R * 0.24, "rgba(255,255,255,.12)");
  disc(c, -R * 0.98, R * 0.05, R * 0.16, K.hautTief);
  disc(c, R * 0.98, R * 0.05, R * 0.16, K.hautTief);
  const mz = -R * 0.58;
  c.fillStyle = K.muetze;
  c.beginPath();
  c.moveTo(-R * 1.0, mz);
  c.quadraticCurveTo(-R * 0.8, -R * 1.44, 0, -R * 1.48);
  c.quadraticCurveTo(R * 0.8, -R * 1.44, R * 1.0, mz);
  c.closePath(); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.4; c.stroke();
  c.fillStyle = K.muetzeHell;
  c.beginPath();
  c.moveTo(-R * 0.5, mz - R * 0.26);
  c.quadraticCurveTo(-R * 0.2, -R * 1.3, R * 0.3, -R * 1.16);
  c.quadraticCurveTo(-R * 0.1, -R * 1.04, -R * 0.36, mz - R * 0.16);
  c.closePath(); c.fill();
  c.fillStyle = K.muetzeSchirm; rr(c, -R * 1.0, mz - R * 0.02, R * 2.0, R * 0.24, R * 0.1); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.36; c.stroke();
  // Verstellband im Nacken mit Schnalle und Löchern
  c.fillStyle = K.muetzeHell; rr(c, -R * 0.42, mz + R * 0.3, R * 0.84, R * 0.2, R * 0.06); c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.3; c.stroke();
  for (let i = 0; i < 4; i++) disc(c, -R * 0.26 + i * R * 0.17, mz + R * 0.4, R * 0.028, K.muetzeSchirm);
  c.fillStyle = K.knopf; rr(c, R * 0.3, mz + R * 0.27, R * 0.16, R * 0.26, R * 0.04); c.fill();
  // Kleine Schattierung am Hinterkopf
  c.fillStyle = "rgba(0,0,0,.14)";
  c.beginPath(); c.ellipse(0, R * 0.55, R * 0.8, R * 0.3, 0, 0, Math.PI); c.fill();
  c.restore();
}

/* ------------------------------ Paket ---------------------------------- */

/** weicher Schatten des Pakets auf den tragenden Händen */
function drawPaketSchattenVorlage(c: C, mitte: V) {
  c.fillStyle = "rgba(10,25,35,.22)";
  c.beginPath();
  c.ellipse(mitte[0], mitte[1] + 5.4, 5.6, 1.2, 0, 0, Math.PI * 2);
  c.fill();
}

function drawPaket(c: C, mitte: V, sk = 1) {
  const [mx, my] = mitte;
  const W = 12.4;
  const H = 9.6;
  const x0 = -W / 2;
  const y0 = -H / 2;
  c.save();
  c.translate(mx, my);
  c.scale(sk, sk);
  // Schlagschatten
  c.fillStyle = "rgba(0,0,0,.22)";
  rr(c, x0 + 0.5, y0 + 0.7, W, H, 1.0); c.fill();
  // Geschenkpapier
  c.fillStyle = G.rot;
  rr(c, x0, y0, W, H, 0.9); c.fill();
  c.save();
  rr(c, x0, y0, W, H, 0.9); c.clip();
  c.fillStyle = "rgba(255,255,255,.09)"; c.fillRect(x0, y0, W * 0.42, H);
  c.fillStyle = "rgba(70,0,10,.18)"; c.fillRect(x0 + W * 0.8, y0, W * 0.2, H);
  // feiner Seidenglanz (schräg)
  c.fillStyle = "rgba(255,255,255,.06)";
  c.beginPath(); c.moveTo(x0 + 1.0, y0); c.lineTo(x0 + 3.6, y0); c.lineTo(x0 + 0.6, y0 + H); c.lineTo(x0 - 2.0, y0 + H); c.closePath(); c.fill();
  // Tannenmuster mit kleinen Schneepunkten, jede Tanne leicht anders
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 5; i++) {
      const n = j * 7 + i;
      const px = x0 + 0.3 + i * 3.0 + (j % 2 ? 1.5 : 0) + (pseudo(n) - 0.5) * 0.24;
      const py = y0 + 1.75 + j * 2.2 + (pseudo(n + 40) - 0.5) * 0.2;
      tanne(c, px, py, 0.95, (pseudo(n + 90) - 0.5) * 0.18);
      disc(c, px + 1.5, py - 1.0, 0.17, "rgba(246,239,220,.9)");
    }
  }
  // Papiernaht unten (überlappender Streifen) und Falzkante oben
  c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(x0, y0 + H - 1.1, W, 1.1);
  c.strokeStyle = "rgba(70,0,10,.4)"; c.lineWidth = 0.3;
  c.beginPath(); c.moveTo(x0, y0 + H - 1.1); c.lineTo(x0 + W, y0 + H - 1.1); c.stroke();
  c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 0.35;
  c.beginPath(); c.moveTo(x0 + 0.3, y0 + 0.35); c.lineTo(x0 + W - 0.3, y0 + 0.35); c.stroke();
  c.restore();
  c.strokeStyle = G.rotTief; c.lineWidth = 0.42;
  rr(c, x0, y0, W, H, 0.9); c.stroke();
  // Klebestreifen an der linken oberen Ecke
  c.save();
  c.translate(x0 + 1.5, y0 + 0.5); c.rotate(-0.6);
  c.fillStyle = "rgba(255,255,255,.34)"; c.fillRect(-1.2, -0.5, 2.4, 1.0);
  c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 0.15;
  c.beginPath(); c.moveTo(-1.2, -0.5); c.lineTo(1.2, -0.5); c.moveTo(-1.2, 0.5); c.lineTo(1.2, 0.5); c.stroke();
  c.restore();

  // Weißes Satinband (Kreuz), Schleife in der Mitte
  const cy = -0.5;
  c.fillStyle = G.band; c.fillRect(x0, cy - 0.9, W, 1.8);
  c.fillStyle = G.bandSchatten; c.fillRect(x0, cy + 0.45, W, 0.45);
  c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(x0, cy - 0.75, W, 0.3);
  c.strokeStyle = "rgba(120,110,95,.55)"; c.lineWidth = 0.22;
  c.beginPath(); c.moveTo(x0, cy - 0.9); c.lineTo(x0 + W, cy - 0.9); c.moveTo(x0, cy + 0.9); c.lineTo(x0 + W, cy + 0.9); c.stroke();
  c.fillStyle = G.band; c.fillRect(-1.1, y0, 2.2, H);
  c.fillStyle = G.bandSchatten; c.fillRect(0.55, y0, 0.55, H);
  c.fillStyle = "rgba(255,255,255,.9)"; c.fillRect(-0.95, y0, 0.3, H);
  c.strokeStyle = "rgba(120,110,95,.55)"; c.lineWidth = 0.22;
  c.beginPath(); c.moveTo(-1.1, y0); c.lineTo(-1.1, y0 + H); c.moveTo(1.1, y0); c.lineTo(1.1, y0 + H); c.stroke();

  // Schnur und Anhänger
  c.strokeStyle = G.schnur; c.lineWidth = 0.22; c.lineCap = "round";
  c.beginPath(); c.moveTo(0.8, cy + 0.5); c.quadraticCurveTo(1.7, 2.5, 2.85, 1.85); c.stroke();
  c.save();
  c.translate(3.5, 2.3); c.rotate(0.2); c.scale(0.9, 0.9);
  c.fillStyle = G.creme;
  c.beginPath();
  c.moveTo(-1.3, -0.5); c.lineTo(-0.8, -0.9); c.lineTo(1.3, -0.9); c.lineTo(1.3, 0.9); c.lineTo(-1.3, 0.9);
  c.closePath(); c.fill();
  c.strokeStyle = "#8a6a4a"; c.lineWidth = 0.22; c.stroke();
  disc(c, -0.85, -0.4, 0.24, "#8a6a4a");
  disc(c, -0.85, -0.4, 0.13, G.rotDunkel);
  tanne(c, 0.5, 0.65, 0.36, 0);
  c.fillStyle = "#9b8a70"; c.fillRect(-0.45, -0.45, 1.3, 0.14); c.fillRect(-0.45, -0.18, 0.9, 0.12);
  c.restore();

  // Schleifenenden (Schwalbenschwanz)
  for (const sx of [-1, 1]) {
    c.fillStyle = G.band;
    c.beginPath();
    c.moveTo(sx * 0.2, cy + 0.4);
    c.lineTo(sx * 2.4, cy + 4.2);
    c.lineTo(sx * 1.75, cy + 3.6);
    c.lineTo(sx * 1.1, cy + 4.4);
    c.lineTo(0, cy + 0.7);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(120,110,95,.55)"; c.lineWidth = 0.22; c.stroke();
    c.strokeStyle = G.bandFalte; c.lineWidth = 0.18;
    c.beginPath(); c.moveTo(sx * 0.9, cy + 1.0); c.lineTo(sx * 1.45, cy + 3.3); c.stroke();
  }
  // Schleifenschlaufen
  for (const sx of [-1, 1]) {
    c.fillStyle = G.band;
    c.beginPath();
    c.moveTo(sx * 0.4, cy);
    c.quadraticCurveTo(sx * 2.3, cy - 3.9, sx * 4.0, cy - 1.7);
    c.quadraticCurveTo(sx * 4.5, cy + 0.4, sx * 2.7, cy + 0.8);
    c.quadraticCurveTo(sx * 1.2, cy + 0.9, sx * 0.4, cy);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(120,110,95,.6)"; c.lineWidth = 0.24; c.stroke();
    c.fillStyle = G.bandSchatten;
    c.beginPath();
    c.moveTo(sx * 0.9, cy - 0.1);
    c.quadraticCurveTo(sx * 2.3, cy - 2.3, sx * 3.4, cy - 1.2);
    c.quadraticCurveTo(sx * 3.5, cy, sx * 2.5, cy + 0.15);
    c.quadraticCurveTo(sx * 1.6, cy + 0.2, sx * 0.9, cy - 0.1);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 0.32;
    c.beginPath(); c.moveTo(sx * 1.0, cy - 1.2); c.quadraticCurveTo(sx * 2.1, cy - 2.15, sx * 3.3, cy - 1.75); c.stroke();
  }
  // Knoten
  ell(c, 0, cy, 0.95, 0.8, G.band);
  ell(c, 0.25, cy + 0.2, 0.55, 0.45, G.bandSchatten);
  c.strokeStyle = "rgba(120,110,95,.6)"; c.lineWidth = 0.22;
  c.beginPath(); c.ellipse(0, cy, 0.95, 0.8, 0, 0, Math.PI * 2); c.stroke();
  disc(c, -0.3, cy - 0.3, 0.2, "rgba(255,255,255,.95)");
  // Stechpalmenzweig am Knoten
  stechpalmenblatt(c, 0.3, cy + 0.6, 0.45, 0.9);
  stechpalmenblatt(c, 0.3, cy + 0.6, 2.4, 0.8);
  for (const [bx, by] of [[0.15, 0.5], [0.68, 0.4], [0.4, 1.0]] as const) {
    disc(c, bx, cy + by, 0.38, G.beere);
    disc(c, bx - 0.12, cy + by - 0.14, 0.11, "rgba(255,255,255,.8)");
  }
  c.restore();
}

/* ------------------------------- Figur --------------------------------- */


/* ------------------------------- Figur --------------------------------- */

/** Farben des Geschenkpakets: rotes Papier, grünes Tannenmuster, weißes Satinband. */
const G = {
  rot: "#b3262e", rotDunkel: "#8a1a22", rotTief: "#5b0f16",
  gruen: "#2f7d4a", gruenHell: "#58a96a", gruenDunkel: "#1d5733",
  creme: "#f6efdc", band: "#f8f5ee", bandSchatten: "#d8d2c3", bandFalte: "#b9b2a0",
  beere: "#c4262e", stamm: "#5a2a1c", schnur: "#9b3a34",
} as const;

/** Kleine Tanne fürs Papiermuster; Fuß bei (x, y). */
function tanne(c: C, x: number, y: number, sk: number, rot: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = G.stamm;
  c.fillRect(-0.14 * sk, 0, 0.28 * sk, 0.3 * sk);
  c.fillStyle = G.gruen;
  c.beginPath();
  c.moveTo(0, -1.7 * sk);
  c.lineTo(0.42 * sk, -1.0 * sk); c.lineTo(0.24 * sk, -1.0 * sk);
  c.lineTo(0.62 * sk, -0.45 * sk); c.lineTo(0.36 * sk, -0.45 * sk);
  c.lineTo(0.84 * sk, 0.05 * sk); c.lineTo(-0.84 * sk, 0.05 * sk);
  c.lineTo(-0.36 * sk, -0.45 * sk); c.lineTo(-0.62 * sk, -0.45 * sk);
  c.lineTo(-0.24 * sk, -1.0 * sk); c.lineTo(-0.42 * sk, -1.0 * sk);
  c.closePath(); c.fill();
  c.strokeStyle = G.gruenHell; c.lineWidth = 0.14 * sk; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-0.12 * sk, -1.35 * sk); c.lineTo(-0.3 * sk, -1.05 * sk);
  c.moveTo(-0.3 * sk, -0.8 * sk); c.lineTo(-0.52 * sk, -0.5 * sk);
  c.moveTo(-0.5 * sk, -0.25 * sk); c.lineTo(-0.74 * sk, 0);
  c.stroke();
  disc(c, 0, -1.72 * sk, 0.13 * sk, G.creme);
  c.restore();
}

/** Stechpalmenblatt mit gezacktem Rand und Mittelrippe. */
function stechpalmenblatt(c: C, x: number, y: number, rot: number, sk: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(sk, sk);
  c.fillStyle = G.gruenDunkel;
  c.beginPath();
  c.moveTo(0, 0); c.lineTo(0.5, -0.55); c.lineTo(0.8, -0.25); c.lineTo(1.2, -0.6); c.lineTo(1.5, -0.2); c.lineTo(2.1, 0);
  c.lineTo(1.5, 0.2); c.lineTo(1.2, 0.6); c.lineTo(0.8, 0.25); c.lineTo(0.5, 0.55);
  c.closePath(); c.fill();
  c.strokeStyle = G.gruenHell; c.lineWidth = 0.1;
  c.beginPath(); c.moveTo(0.1, 0); c.lineTo(1.9, 0); c.stroke();
  c.restore();
}

/** Hemd-Umriss (auch als Maske für Arme, die vor dem Rumpf schwingen). */
function hemdPfad(c: C, r: MethanRig, rueck: boolean) {
  const topY = r.shoulderY;
  const botY = r.hipY;
  const tief = rueck ? 2.4 : 5.2;
  c.beginPath();
  c.moveTo(-5.0, topY - 0.8);
  c.quadraticCurveTo(0, topY + tief, 5.0, topY - 0.8);
  c.quadraticCurveTo(7.0, topY - 0.4, 7.2, topY + 2.4);
  c.quadraticCurveTo(7.6, botY - 4, 5.8, botY - 2);
  c.lineTo(-5.8, botY - 2);
  c.quadraticCurveTo(-7.6, botY - 4, -7.2, topY + 2.4);
  c.quadraticCurveTo(-7.0, topY - 0.4, -5.0, topY - 0.8);
  c.closePath();
}

/** Hals: liegt HINTER dem Hemdkragen und unter dem Kopf. */
function drawHals(c: C, r: MethanRig, kopf: V, rueck: boolean) {
  const R = HEAD_R;
  const x0 = kopf[0] + Math.sin(r.headTilt) * R * 0.5;
  const y0 = kopf[1] + R * 0.4;
  const y1 = r.shoulderY + 4.2;
  const ym = (y0 + y1) / 2;
  c.beginPath();
  c.moveTo(x0 - 2.5, y0);
  c.lineTo(x0 + 2.5, y0);
  c.quadraticCurveTo(3.1, ym, 3.3, y1);
  c.lineTo(-3.3, y1);
  c.quadraticCurveTo(-3.1, ym, x0 - 2.5, y0);
  c.closePath();
  c.fillStyle = rueck ? K.hautTief : K.hautDunkel;
  c.fill();
  c.strokeStyle = K.kontur; c.lineWidth = 0.35; c.stroke();
  // Schatten unter dem Kinn
  c.fillStyle = "rgba(0,0,0,.16)";
  c.fillRect(x0 - 2.6, y0 + 2.5, 5.2, 3.0);
  if (!rueck) { c.fillStyle = "rgba(255,255,255,.10)"; rr(c, -2.2, y0 + 5.5, 1.3, y1 - y0 - 6, 0.6); c.fill(); }
}

/** Arm mit Ärmel, Saum, Unterarm und Hand. `tiefe` > 0: schwingt zum Betrachter der Vorderansicht. */
function drawArm(c: C, S: V, A: { elbow: V; hand: V }, farbe: string, seite: 1 | -1, rueck: boolean, haltung: MethanHand, tiefe: number, mitHand = true) {
  const z = rueck ? -tiefe : tiefe;
  const sk = 1 + 0.05 * z;
  const dunkel = 0.18 * Math.min(1, Math.max(0, -z));
  const f = dunkel > 0.002 ? mixHex(farbe, "#000000", dunkel) : farbe;
  const haut = rueck ? K.hautDunkel : K.haut;
  const hautT = dunkel > 0.002 ? mixHex(haut, "#000000", dunkel) : haut;
  // Schulter: weiche Ärmelkappe, tritt direkt unter dem Pelzkragen aus
  c.fillStyle = f;
  c.beginPath();
  c.ellipse(S[0], S[1] + 0.1, 2.5 * sk, 2.1 * sk, seite * -0.28, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = K.kontur;
  c.lineWidth = 0.3;
  c.beginPath();
  c.ellipse(S[0], S[1] + 0.1, 2.5 * sk, 2.1 * sk, seite * -0.28,
    seite > 0 ? -0.55 : Math.PI * 0.52, seite > 0 ? Math.PI * 0.52 : Math.PI * 1.52);
  c.stroke();
  // Schulterfaltenwurf: zwei kurze Züge am Kappenrand
  c.strokeStyle = "rgba(14,52,28,.28)";
  c.lineWidth = 0.4;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(S[0] + seite * 0.4, S[1] + 1.3);
  c.quadraticCurveTo(S[0] + seite * 1.5, S[1] + 1.9, S[0] + seite * 2.3, S[1] + 1.2);
  c.moveTo(S[0] - seite * 0.1, S[1] + 1.9);
  c.quadraticCurveTo(S[0] + seite * 0.9, S[1] + 2.5, S[0] + seite * 1.7, S[1] + 2.1);
  c.stroke();
  // Oberarm
  limb(c, [S[0], S[1] + 1.2], A.elbow, f, 3.9 * sk);
  const saum = richtung(A.elbow, A.hand, 1.9);
  limb(c, A.elbow, saum, f, 3.7 * sk);
  // Handgelenk: die Haut beginnt direkt am Ärmelsaum, das Handgelenk ist sichtbar
  limb(c, saum, A.hand, hautT, (rueck ? 2.9 : 3.0) * sk);
  c.strokeStyle = "rgba(52,96,58,.5)";
  c.lineWidth = 0.28;
  const wr = Math.atan2(A.hand[1] - saum[1], A.hand[0] - saum[0]) + Math.PI / 2;
  c.beginPath();
  c.moveTo(saum[0] + Math.cos(wr) * 1.4 * sk, saum[1] + Math.sin(wr) * 1.4 * sk);
  c.quadraticCurveTo(
    saum[0] - (A.hand[0] - saum[0]) * 0.16,
    saum[1] - (A.hand[1] - saum[1]) * 0.16,
    saum[0] - Math.cos(wr) * 1.4 * sk,
    saum[1] - Math.sin(wr) * 1.4 * sk,
  );
  c.stroke();
  // Ärmelsaum: kleine Stulpe
  const saumR = Math.atan2(A.hand[1] - A.elbow[1], A.hand[0] - A.elbow[0]) + Math.PI / 2;
  c.beginPath();
  c.moveTo(saum[0] + Math.cos(saumR) * 1.9 * sk, saum[1] + Math.sin(saumR) * 1.9 * sk);
  c.quadraticCurveTo(saum[0] - (A.hand[0] - saum[0]) * 0.12, saum[1] - (A.hand[1] - saum[1]) * 0.12, saum[0] - Math.cos(saumR) * 1.9 * sk, saum[1] - Math.sin(saumR) * 1.9 * sk);
  c.strokeStyle = mixHex(f, "#000000", 0.4);
  c.lineWidth = 0.5;
  c.stroke();
  // Ellenbeuge: Gelenkscheibe + Beugefalten
  disc(c, A.elbow[0], A.elbow[1], 1.95 * sk, f);
  c.strokeStyle = "rgba(14,52,28,.34)";
  c.lineWidth = 0.32;
  c.beginPath();
  c.arc(A.elbow[0], A.elbow[1], 1.3 * sk, Math.PI * 0.15, Math.PI * 0.75);
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,.12)";
  c.lineWidth = 0.3;
  c.beginPath();
  c.moveTo(A.elbow[0] - seite * 1.5, A.elbow[1] - 1.1);
  c.quadraticCurveTo(A.elbow[0] - seite * 0.3, A.elbow[1] - 1.7, A.elbow[0] + seite * 1.0, A.elbow[1] - 1.25);
  c.stroke();
  c.save();
  c.translate(A.hand[0], A.hand[1]);
  c.scale(sk, sk);
  c.translate(-A.hand[0], -A.hand[1]);
  if (!mitHand) {
    // Finger werden zusammen mit dem Paket gezeichnet
  } else if (haltung === "locker" || haltung === "halten") drawHandLocker(c, A.hand, A.elbow, seite, rueck);
  else if (haltung === "flach") {
    if (rueck) drawHandLocker(c, A.hand, A.elbow, seite, true);
    else drawHandFlach(c, A.hand, seite);
  } else if (rueck) drawHandLocker(c, A.hand, A.elbow, seite, true);
  else drawHandVorn(c, A.hand, seite, haltung);
  c.restore();
}

export interface FroschOpts {
  t?: number; face?: 1 | -1; pose?: MethanPose; expr?: MethanExpr; walk?: number;
  blink?: number; scale?: number; shadow?: boolean; gaze?: number; edit?: FroschEditor; rueck?: boolean;
}

/** Weißer Pelzkragen: flauschiger Halbmond um den Hals. Wird ganz zuletzt
    gezeichnet und liegt dadurch über Schultern und oberen Armen. */
function drawKragen(c: C, r: MethanRig) {
  const topY = r.shoulderY;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-7.6, topY + 0.6);
  c.quadraticCurveTo(-6.8, topY - 1.9, -5.1, topY - 2.0);
  c.quadraticCurveTo(-2.4, topY + 1.8, 0, topY + 3.6);
  c.quadraticCurveTo(2.4, topY + 1.8, 5.1, topY - 2.0);
  c.quadraticCurveTo(6.8, topY - 1.9, 7.6, topY + 0.6);
  c.quadraticCurveTo(6.1, topY + 1.7, 5.4, topY + 0.9);
  c.quadraticCurveTo(2.4, topY + 4.3, 0, topY + 5.9);
  c.quadraticCurveTo(-2.4, topY + 4.3, -5.4, topY + 0.9);
  c.quadraticCurveTo(-6.1, topY + 1.7, -7.6, topY + 0.6);
  c.closePath();
  c.fillStyle = K.tee;
  c.fill();
  c.strokeStyle = K.teeShade;
  c.lineWidth = 0.4;
  c.stroke();
  // Flauschstruktur: kurze weiche Striche am Rand
  c.strokeStyle = "rgba(150,145,125,.45)";
  c.lineWidth = 0.26;
  for (let i = 0; i < 11; i++) {
    const fx = -5.9 + i * 1.18;
    const fy = topY + 1.7 + 2.4 * (1 - Math.abs(i - 5) / 5.2);
    c.beginPath();
    c.moveTo(fx, fy - 0.55);
    c.quadraticCurveTo(fx + 0.34, fy - 0.18, fx + 0.08, fy + 0.38);
    c.stroke();
  }
  // weiche Schattenkante, damit der Kragen auf den Schultern liegt
  c.fillStyle = "rgba(40,60,45,.16)";
  c.beginPath();
  c.ellipse(0, topY + 4.6, 4.6, 1.5, 0, 0, Math.PI);
  c.fill();
}

export function drawMethanFrog(c: C, x: number, y: number, opts: FroschOpts = {}) {
  const {
    t = 0, pose = "stand", expr = "friendly", walk = 0, blink = 0, scale = 1,
    shadow = true, gaze = 0, edit, rueck = false,
  } = opts;
  // Rückansicht: ohne Paket
  const posEff: MethanPose = rueck && pose === "walkCarry" ? "walk" : pose;
  const r = methanRig(posEff, t, walk, expr);
  r.gaze = gaze;
  const live = (edit ?? liveDelta("frosch", posEff) ?? {}) as FroschEditor;
  const d = (p: V, key: Gelenk): V => { const e = live[key]; return e ? [p[0] + e[0], p[1] + e[1]] : p; };
  const A_F = { elbow: d(r.armFar.elbow, "elbowFar"), hand: d(r.armFar.hand, "handFar") };
  const A_N = { elbow: d(r.armNear.elbow, "elbowNear"), hand: d(r.armNear.hand, "handNear") };
  const L_F = { elbow: d(r.legFar.elbow, "kneeFar"), hand: d(r.legFar.hand, "footFar") };
  const L_N = { elbow: d(r.legNear.elbow, "kneeNear"), hand: d(r.legNear.hand, "footNear") };
  const kopfX = (live.head?.[0] ?? 0) + r.headX;
  const kopfY = r.headY + (live.head?.[1] ?? 0);
  const SH_F: V = [-6.15, r.shoulderY + 2.3];
  const SH_N: V = [6.15, r.shoulderY + 2.3];
  const H_F: V = [-HUEFTE_X, r.hipY];
  const H_N: V = [HUEFTE_X, r.hipY];
  const zeigePaket = r.paket && !rueck;

  if (shadow) {
    c.save(); c.globalAlpha = 0.26; c.fillStyle = "#000000";
    c.beginPath(); c.ellipse(x, y + 1.5 * scale, 10.5 * scale, 3.2 * scale, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
  c.save();
  c.translate(x, y); c.scale(scale, scale); c.translate(r.rootX, r.rootY);

  // 1) Beine und Stiefel (unter der Hose)
  limb(c, H_F, L_F.elbow, K.uniformDunkel, 5.0);
  limb(c, L_F.elbow, [L_F.hand[0], L_F.hand[1] - 3.4], K.uniformDunkel, 4.8);
  limb(c, H_N, L_N.elbow, K.uniform, 5.2);
  limb(c, L_N.elbow, [L_N.hand[0], L_N.hand[1] - 3.4], K.uniform, 5.0);
  for (const [kn, hell] of [[L_F.elbow, false], [L_N.elbow, true]] as const) {
    c.strokeStyle = hell ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.10)"; c.lineWidth = 0.5; c.lineCap = "round";
    c.beginPath(); c.moveTo(kn[0] - 1.7, kn[1] + 0.3); c.quadraticCurveTo(kn[0], kn[1] - 0.4, kn[0] + 1.7, kn[1] + 0.3); c.stroke();
  }
  if (rueck) {
    drawBootHinten(c, L_F.hand, r.footFarAng, false);
    drawBootHinten(c, L_N.hand, r.footNearAng, true);
  } else {
    drawBootVorn(c, L_F.hand, r.footFarAng, false);
    drawBootVorn(c, L_N.hand, r.footNearAng, true);
  }

  // 2) Hals (hinter Kragen und Rumpf)
  drawHals(c, r, [kopfX, kopfY], rueck);

  // 3) Rumpf
  if (rueck) drawTorsoHinten(c, r); else drawTorsoVorn(c, r);

  // 4) Arme: feste Ebene vor dem Rumpf – kein Umschalten, kein Ausschneiden.
  //    Liegt ein Paket auf flachen Händen, werden die Hände danach gezeichnet.
  const armen = [
    { A: A_F, S: SH_F, farbe: K.uniformDunkel, seite: -1 as const, haltung: r.handFar, tiefe: r.tiefeFar, nachKopf: false },
    { A: A_N, S: SH_N, farbe: K.uniform, seite: 1 as const, haltung: r.handNear, tiefe: r.tiefeNear, nachKopf: r.armNearVorKopf },
  ];
  for (const a of armen) if (!a.nachKopf) drawArm(c, a.S, a.A, a.farbe, a.seite, rueck, a.haltung, a.tiefe, !zeigePaket);

  // 5) Paket: die Flächen tragen es von unten, die Finger greifen darüber –
  //    Fingerspitzen drücken kleine Mulden ins Papier
  if (zeigePaket) {
    const mx = (A_F.hand[0] + A_N.hand[0]) / 2;
    const my = (A_F.hand[1] + A_N.hand[1]) / 2;
    const sk = r.tiefeNear > 0.3 || r.tiefeFar > 0.3 ? 1.06 : 1;
    drawPaketSchattenVorlage(c, [mx, my - 5.8]);
    drawPaket(c, [mx, my - 5.8], sk);
    drawFingerGriff(c, A_F.hand, -1);
    drawFingerGriff(c, A_N.hand, 1);
  }

  // 6) Kopf (eine Hand an der Mütze liegt davor)
  if (rueck) drawKopfHinten(c, [kopfX, kopfY], r.headTilt);
  else drawKopfVorn(c, [kopfX, kopfY], r.headTilt, expr, blink > 0, r.gaze);
  for (const a of armen) if (a.nachKopf) drawArm(c, a.S, a.A, a.farbe, a.seite, rueck, a.haltung, a.tiefe, true);

  // 7) Kragen: oberste Ebene – liegt über Schultern und den oberen Armen
  drawKragen(c, r);

  c.restore();
}


/* ------------------------------- Info ---------------------------------- */

export const METHAN_INFO = {
  name: "Methan Frog",
  firma: "Frog Company Lieferservice",
  dienst: "Post- und Paketzusteller",
  groesse: "56 Einheiten (wie Luni)",
  uniform: "Blaue Latzhose, Mütze mit Schirm, gelbe Knöpfe, Namensschild",
  besonderheiten: "Front- und Rückansicht, Kulleraugen, breiter Froschmund, Paket",
} as const;
