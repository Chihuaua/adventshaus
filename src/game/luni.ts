/* =======================================================================
   LUNI — Figur im ursprünglichen LCP-1-Stil
   Schlanke Strichgliedmaßen, kleiner runder Kopf, weiche Flächen,
   keine dicken Outlines.

   Outfit: lange schwarze Haare (glatt), offene braun/beige Strickjacke
   mit langen Ärmeln und Knopfleiste, weißes T-Shirt darunter,
   schwarze Leggings, bunte Socken, schwarze Nerd-Brille.

   Maßsystem: Ursprung = Boden zwischen den Füßen, y negativ = nach oben.
   Gesamthöhe ca. 56 Einheiten  ->  Maßstab 1.0 = Spielgröße.
   ======================================================================= */

type C = CanvasRenderingContext2D;
type V = [number, number];

export const LUNI_H = 56;

export const LUNI_COLORS = {
  skin: "#f4c9a0",
  skinShade: "#e3b288",
  hair: "#191920",
  hairSheen: "#3b3b48",
  cardigan: "#b58b63",
  cardiganDark: "#95704a",
  cardiganLight: "#c9a079",
  tee: "#f6f3ea",
  teeShade: "#dcd7c9",
  leggings: "#272b34",
  leggingsLight: "#343945",
  glasses: "#15151b",
  // [Grundfarbe, Zehenkappe] – ohne Schaft werden nur zwei Töne gebraucht
  sockL: ["#ff6f61", "#ffd166"],
  sockR: ["#35d6c0", "#c3e84f"],
  blush: "rgba(255,122,122,.30)",
  mouth: "#a35f4a",
  eye: "#20343c",
};

export type LuniState =
  | "idle"
  | "walk"
  | "run"
  | "turn"
  | "act"
  | "think"
  | "cheer"
  | "wave"
  | "stretch"
  | "sit"
  | "doze"
  | "lie"
  | "danceSway"
  | "danceTwist"
  | "danceHop"
  | "danceSpin"
  | "handstand"
  | "cartwheel"
  | "flip"
  | "split"
  | "piano"
  | "sax"
  | "roll"
  | "smoke"
  | "ashtray"
  | "phone"
  | "call"
  | "standup"
  | "pack";

export type LuniExpr =
  | "happy"
  | "neutral"
  | "grin"
  | "wink"
  | "think"
  | "tired"
  | "sleep"
  | "surprised"
  | "sad"
  | "annoyed"
  | "love"
  | "focus";

export interface LuniOpts {
  /** Sekunden, treibt alle Eigenbewegungen */
  t?: number;
  face?: 1 | -1;
  state?: LuniState;
  expr?: LuniExpr;
  /** Laufphase in Radiant */
  walk?: number;
  /** 0 = Augen offen, 1 = zu */
  blink?: number;
  scale?: number;
  shadow?: boolean;
  /** 0..1 für turn / cartwheel / flip */
  phase?: number;
  /** wie weit die vordere Hand beim Greifen ausgestreckt ist */
  armReach?: number;
  /** 0..1: Husten – der Körper zuckt, die Hand fährt zum Mund */
  cough?: number;
  /** 0..1: kränkliche Grünfärbung der Haut */
  sick?: number;
}

/**
 * Hustenstoß: kurze, harte Stöße mit Ruhepausen dazwischen.
 * Liefert 0..1 (Stärke des aktuellen Stoßes).
 */
export function coughPulse(t: number): number {
  const T = ((t % 3.4) + 3.4) % 3.4;
  if (T > 1.1) return 0; // Pause zwischen den Anfällen
  // zwei schnelle Stöße hintereinander
  const a = Math.max(0, Math.sin(T * Math.PI * 3.6));
  return a * a;
}

/* --------------------------- Grundmaße -------------------------------- */

const HIP_Y = -19;
const SHOULDER_Y = -36;
const HEAD_Y = -46.5;
const HEAD_R = 9.2;
/** Länge der Rückenhaare ab Kopfmitte – Spitze endet etwas unter den Schultern. */
const HAIR_LEN = 18;

/* ------------------------------ Helfer -------------------------------- */

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

function stroke3(ctx: C, a: V, b: V, c: V, color: string, w: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.stroke();
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Zwei Hex-Farben mischen (0 = a, 1 = b) */
function mixCol(a: string, b: string, k: number): string {
  const p = Math.max(0, Math.min(1, k));
  const ca = parseInt(a.slice(1), 16);
  const cb = parseInt(b.slice(1), 16);
  const r = Math.round(((ca >> 16) & 255) + (((cb >> 16) & 255) - ((ca >> 16) & 255)) * p);
  const g = Math.round(((ca >> 8) & 255) + (((cb >> 8) & 255) - ((ca >> 8) & 255)) * p);
  const bl = Math.round((ca & 255) + ((cb & 255) - (ca & 255)) * p);
  return `rgb(${r},${g},${bl})`;
}

/**
 * Rauch-Zyklus (7 Sekunden): lange ruhen, Hand zum Mund, ziehen,
 * Hand zurück, dann einen Moment Rauch aus dem Mund pusten.
 * lift 0..1 = Hand am Mund, puff 0..1 = Ausatmen sichtbar.
 */
export function smokeCycle(t: number): { lift: number; puff: number } {
  const T = ((t % 7) + 7) % 7;
  const smooth = (k: number) => k * k * (3 - 2 * k);
  let lift = 0;
  let puff = 0;
  if (T < 3.6) lift = 0;
  else if (T < 4.2) lift = smooth((T - 3.6) / 0.6);
  else if (T < 5.1) lift = 1;
  else if (T < 5.7) lift = smooth(1 - (T - 5.1) / 0.6);
  if (T >= 5.7 && T < 7) puff = Math.sin(((T - 5.7) / 1.3) * Math.PI);
  return { lift, puff };
}

/* ------------------------------- Rig ---------------------------------- */

interface Limb {
  elbow: V;
  hand: V;
}

interface Rig {
  rootX: number;
  rootY: number;
  rootRot: number;
  pivotY: number;
  scaleX: number;
  hipY: number;
  shoulderY: number;
  headY: number;
  headTilt: number;
  armFar: Limb;
  armNear: Limb;
  legFar: Limb;
  legNear: Limb;
  hairFlow: number;
  hairUp: boolean;
  /** Faktor auf die Haarlänge – verhindert z. B. Durchdringen des Bodens */
  hairLen: number;
  /** Fuß-Winkel für die Socken */
  footFarAng: number;
  footNearAng: number;
  /** Local horizontal mirroring of each sock. */
  footFarDir: 1 | -1;
  footNearDir: 1 | -1;
  /** Socke gegenüber der Beinachse absenken (z. B. Spagat) */
  footDrop: number;
}

function baseRig(): Rig {
  return {
    rootX: 0,
    rootY: 0,
    rootRot: 0,
    pivotY: -28,
    scaleX: 1,
    hipY: HIP_Y,
    shoulderY: SHOULDER_Y,
    headY: HEAD_Y,
    headTilt: 0,
    armFar: { elbow: [-6, -29], hand: [-7.5, -22] },
    armNear: { elbow: [6, -29], hand: [7.5, -22] },
    legFar: { knee: [-3.6, -10], hand: [-4, 0] } as unknown as Limb,
    legNear: { knee: [3.6, -10], hand: [4, 0] } as unknown as Limb,
    hairFlow: 0,
    hairUp: false,
    hairLen: 1,
    footFarAng: 0,
    footNearAng: 0,
    // Zehkappe zeigt nach vorn (+x), wie die Augen
    footFarDir: 1,
    footNearDir: 1,
    footDrop: 0,
  };
}

/** Beine nutzen dieselbe Limb-Struktur: elbow = Knie, hand = Fuß. */
function leg(knee: V, foot: V): Limb {
  return { elbow: knee, hand: foot };
}

function buildRig(state: LuniState, t: number, walkP: number, phase: number, reach: number): Rig {
  const r = baseRig();
  const breathe = Math.sin(t * 2) * 0.45;

  switch (state) {
    case "idle": {
      r.rootY = breathe * 0.5;
      r.headTilt = Math.sin(t * 1.2) * 0.03;
      r.armFar = { elbow: [-6.4, -29], hand: [-7.6, -21.5 + breathe * 0.3] };
      r.armNear = { elbow: [6.4, -29], hand: [7.6, -21.5 + breathe * 0.3] };
      r.legFar = leg([-3.6, -10], [-4.2, 0]);
      r.legNear = leg([3.6, -10], [4.2, 0]);
      r.hairFlow = Math.sin(t * 1.1) * 0.5;
      break;
    }

    case "walk": {
      // Vorwärtsgehen: der Fuß verlässt den Boden, während er nach vorn schwingt.
      // Fuß-x hängt an sin(walkP), der Hub an cos(walkP) – so zeigen Schwung,
      // Oberkörper und Haar in dieselbe Richtung.
      const sw = Math.sin(walkP);
      const lift = Math.max(0, Math.cos(walkP)) * 3.4;
      const swF = -sw; // zweites Bein um eine halbe Periode versetzt
      const liftF = Math.max(0, -Math.cos(walkP)) * 3.4;
      r.rootY = -Math.abs(Math.sin(walkP)) * 1.5 + 0.7;
      r.headTilt = 0.035 + Math.sin(walkP * 2) * 0.018;
      r.legNear = leg([sw * 5.5, -10.5 - lift * 0.25], [sw * 10, -lift]);
      r.legFar = leg([swF * 5.5, -10.5 - liftF * 0.25], [swF * 10, -liftF]);
      r.armNear = { elbow: [4 - sw * 4, -29], hand: [3 - sw * 9, -22] };
      r.armFar = { elbow: [-4 + sw * 4, -29], hand: [-3 + sw * 9, -22] };
      r.hairFlow = -1.15 - sw * 0.45; // Haar weht konstant nach hinten
      r.footNearAng = sw * 0.1;
      r.footFarAng = -sw * 0.1;
      break;
    }

    case "run": {
      const sw = Math.sin(walkP);
      const lift = Math.max(0, Math.cos(walkP)) * 6;
      const swF = -sw;
      const liftF = Math.max(0, -Math.cos(walkP)) * 6;
      r.rootY = -Math.abs(Math.sin(walkP)) * 3 + 1.4;
      r.headTilt = 0.12;
      r.legNear = leg([sw * 7 + 2, -11 - lift * 0.4], [sw * 13, -lift]);
      r.legFar = leg([swF * 7 + 2, -11 - liftF * 0.4], [swF * 13, -liftF]);
      r.armNear = { elbow: [5 - sw * 3, -30], hand: [2 - sw * 10, -27] };
      r.armFar = { elbow: [-5 + sw * 3, -30], hand: [-2 + sw * 10, -27] };
      r.hairFlow = -3.2 - sw * 0.8;
      break;
    }

    case "turn": {
      // Dreh-Illusion: X-Stauchung von 1 über 0 nach -1
      r.scaleX = Math.cos(phase * Math.PI);
      r.rootY = -Math.sin(phase * Math.PI) * 1.4;
      r.hairFlow = Math.sin(phase * Math.PI) * 3.4;
      r.armFar = { elbow: [-6, -29], hand: [-6.5, -21] };
      r.armNear = { elbow: [6, -29], hand: [6.5, -21] };
      r.legFar = leg([-3.6, -10], [-4, 0]);
      r.legNear = leg([3.6, -10], [4, 0]);
      break;
    }

    case "act": {
      const p = 0.7 + Math.sin(t * 7) * 0.12;
      r.rootY = breathe * 0.4;
      r.headTilt = 0.1;
      r.armNear = { elbow: [7, -31], hand: [9 + 7 * p * reach, -30 - 2 * p] };
      r.armFar = { elbow: [-6, -29], hand: [-7, -22] };
      r.legFar = leg([-3.6, -10], [-4.6, 0]);
      r.legNear = leg([3.8, -10], [5.2, 0]);
      break;
    }

    case "think": {
      r.rootY = breathe * 0.4;
      r.headTilt = -0.12;
      r.armNear = { elbow: [8, -28], hand: [4.5, -40] };
      r.armFar = { elbow: [-6, -28], hand: [-2, -24] };
      r.legFar = leg([-3.6, -10], [-4.4, 0]);
      r.legNear = leg([3.6, -10], [4.4, 0]);
      r.hairFlow = 0.4;
      break;
    }

    case "cheer": {
      const p = Math.abs(Math.sin(t * 5));
      r.rootY = -p * 4.5;
      r.headTilt = -0.06;
      r.armNear = { elbow: [8, -40], hand: [9, -50 - p * 3] };
      r.armFar = { elbow: [-8, -40], hand: [-9, -49 - p * 3] };
      r.legFar = leg([-4, -11], [-5, -p * 2]);
      r.legNear = leg([4, -11], [5, -p * 2]);
      r.hairFlow = -1.6 - p * 1.6;
      break;
    }

    case "wave": {
      const w = Math.sin(t * 9);
      r.rootY = breathe * 0.4;
      r.headTilt = -0.04;
      r.armNear = { elbow: [8, -38], hand: [9 + w * 3.4, -48] };
      r.armFar = { elbow: [-6, -29], hand: [-7.5, -22] };
      r.legFar = leg([-3.6, -10], [-4.2, 0]);
      r.legNear = leg([3.6, -10], [4.2, 0]);
      break;
    }

    case "stretch": {
      const p = (Math.sin(t * 1.6) + 1) / 2;
      r.rootY = -p * 1.6;
      r.headTilt = -0.16 * p;
      r.armNear = { elbow: [6, -42 - p * 3], hand: [3, -52 - p * 5] };
      r.armFar = { elbow: [-6, -42 - p * 3], hand: [-3.5, -52 - p * 5] };
      r.legFar = leg([-3.6, -10], [-4.2, 0]);
      r.legNear = leg([3.6, -10], [4.2, 0]);
      r.hairFlow = -0.8 * p;
      break;
    }

    case "sit": {
      r.rootY = 9;
      r.hipY = HIP_Y;
      r.armNear = { elbow: [7, -28], hand: [9, -21] };
      r.armFar = { elbow: [-6, -28], hand: [-7, -21] };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.headTilt = 0.03;
      break;
    }

    case "piano": {
      // sitzend, beide Hände vorn auf den Tasten, Finger wippen im Wechsel
      const k = Math.sin(t * 6.5);
      r.rootY = 9;
      r.headTilt = 0.08 + Math.sin(t * 1.1) * 0.03;
      r.armNear = { elbow: [8, -27], hand: [13 + Math.max(0, k) * 1.2, -24 + k * 1.6] };
      r.armFar = { elbow: [-3, -27], hand: [11 - Math.max(0, k) * 1.2, -24 - k * 1.6] };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.hairFlow = Math.sin(t * 2) * 0.6;
      break;
    }

    case "sax": {
      // stehend, Instrument am Mund, Finger wippen auf den Klappen
      const k = Math.sin(t * 5.2);
      r.rootY = breathe * 0.35;
      r.headTilt = 0.16 + Math.sin(t * 1.3) * 0.03;
      r.armNear = { elbow: [5, -30], hand: [7.5, -33 + k * 0.8] };
      r.armFar = { elbow: [7, -26], hand: [11, -26 + k * 1.1] };
      r.legFar = leg([-3.8, -10], [-4.6, 0]);
      r.legNear = leg([3.8, -10], [4.8, 0]);
      r.hairFlow = 0.6;
      break;
    }

    case "roll": {
      // am Tisch sitzend, Zigaretten drehen: beide Hände arbeiten gegeneinander
      const p = Math.sin(t * 6.2);
      r.rootY = 9;
      r.headTilt = 0.24 + Math.sin(t * 3.1) * 0.03;
      r.armNear = { elbow: [5, -30], hand: [8.5 + p * 1.8, -28.5 + Math.abs(p) * 1.4] };
      r.armFar = { elbow: [-1, -30], hand: [5.5 - p * 1.8, -28.5 + Math.abs(p) * 1.4] };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.hairFlow = 0.4;
      break;
    }

    case "smoke": {
      // sitzend; die Zigarettenhand ruht und wandert im Zyklus zum Mund
      const { lift, puff } = smokeCycle(t);
      r.rootY = 9;
      r.headTilt = -0.04 + lift * 0.07 - puff * 0.05;
      r.armNear = { elbow: [-6, -28], hand: [-7, -21] };
      r.armFar = {
        elbow: [lerp(6.5, 5, lift), lerp(-27, -32, lift)],
        hand: [lerp(8.5, 2.4, lift), lerp(-23.5, -40.5, lift)],
      };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.hairFlow = 0.3;
      break;
    }

    case "ashtray": {
      // SITZEND am Beistelltisch: der Arm reicht daneben, ohne zu strecken.
      // `phase` 0..1 führt die Hand vom Schoß zum Tisch und zurück.
      const p = phase * phase * (3 - 2 * phase);
      r.rootY = 9;
      r.hipY = HIP_Y;
      r.headTilt = 0.05 + p * 0.16;
      r.armNear = { elbow: [-6, -28], hand: [-7, -21] };
      r.armFar = {
        elbow: [lerp(7, 10.5, p), lerp(-28, -26.5, p)],
        hand: [lerp(9, 16, p), lerp(-21, -23.5, p)],
      };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.hairFlow = 0.3 + p * 0.5;
      break;
    }

    case "phone": {
      // sitzend, Handy in der vorderen Hand, Daumen scrollt.
      // `phase` > 0 lässt den Kopf verneinend wackeln.
      const scroll = Math.sin(t * 3.6);
      r.rootY = 9;
      r.headTilt = 0.3 + Math.sin(t * 11) * 0.09 * phase;
      r.armNear = { elbow: [-3.5, -28], hand: [2.5, -30.5] };
      r.armFar = { elbow: [7.5, -28], hand: [7.5, -31.5 + scroll * 0.6] };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.hairFlow = 0.35;
      break;
    }

    case "standup": {
      // Aufstehen vom Stuhl. `phase` 0 = sitzen, 1 = stehen.
      // Alle Werte werden zwischen Sitz- und Stehpose geblendet. Die Beine
      // strecken sich, die Füße gleiten gleichmäßig auf den Boden, der
      // Oberkörper richtet sich auf und die Arme nehmen die Haltung ab.
      const p = phase * phase * (3 - 2 * phase);
      // kurzer Schwung nach vorn beim Abstoßen (nur Kopf/Oberkörper)
      const push = Math.sin(p * Math.PI);
      r.rootY = 9 * (1 - p);
      r.hipY = HIP_Y;
      r.shoulderY = SHOULDER_Y - 1.6 * (1 - p);
      r.headY = HEAD_Y - 1.2 * (1 - p);
      r.armNear = {
        elbow: [lerp(7, 6.4, p), lerp(-28, -29, p)],
        hand: [lerp(9, 7.6, p), lerp(-21, -21.5, p)],
      };
      r.armFar = { elbow: [-6, lerp(-28, -29, p)], hand: [-7.5, -21] };
      r.legFar = leg([lerp(8, -3.6, p), lerp(-19, -10, p)], [lerp(10, -4.2, p), lerp(-9.5, 0, p)]);
      r.legNear = leg([lerp(9.5, 3.6, p), lerp(-19, -10, p)], [lerp(12, 4.2, p), lerp(-9.5, 0, p)]);
      r.headTilt = lerp(0.03, 0, p) + push * 0.16;
      r.hairFlow = 0.3 + push * 0.5;
      break;
    }

    case "call": {
      // sitzend, Handy AM OHR – neben dem Kopf, nicht davor. Der Kopf hat
      // Radius 9.2 um x=0, deshalb liegt die Hand außerhalb bei x≈12.5.
      const nod = Math.sin(t * 2.3);
      r.rootY = 9;
      r.headTilt = 0.06 + nod * 0.05;
      r.armNear = { elbow: [-4, -29], hand: [-6, -22] };
      r.armFar = { elbow: [10.4, -33], hand: [15.4, -45 + nod * 0.5] };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.hairFlow = 0.35;
      break;
    }

    case "pack": {
      // am Tisch sitzend: nimmt den Stapel auf und schiebt ihn in die
      // Schachtel. `phase` 0..1 führt die Hand vom Stapel zur Schachtel.
      const p = phase * phase * (3 - 2 * phase);
      r.rootY = 9;
      r.headTilt = 0.26;
      r.armNear = { elbow: [5, -30], hand: [lerp(9.5, 15, p), lerp(-28.5, -29.5, p)] };
      r.armFar = { elbow: [0, -30], hand: [lerp(5, 11, p), -28.5] };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.hairFlow = 0.4;
      break;
    }

    case "doze": {
      const p = Math.sin(t * 1.1);
      r.rootY = 9 + p * 0.5;
      r.headTilt = 0.3 + p * 0.06;
      r.armNear = { elbow: [6, -27], hand: [7, -20] };
      r.armFar = { elbow: [-6, -27], hand: [-7, -20] };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.hairFlow = 0.8;
      break;
    }

    case "lie": {
      r.rootRot = -Math.PI / 2;
      r.pivotY = -14;
      r.rootY = 8;
      r.armNear = { elbow: [5, -26], hand: [7, -20] };
      r.armFar = { elbow: [-5, -26], hand: [-6, -20] };
      r.legFar = leg([-3, -10], [-3.4, 0]);
      r.legNear = leg([3, -10], [3.4, 0]);
      r.headTilt = 0.1;
      break;
    }

    /* ----------------------------- Tanz ----------------------------- */

    case "danceSway": {
      const s = Math.sin(t * 3.4);
      const c = Math.cos(t * 3.4);
      r.rootX = s * 2.6;
      r.rootY = -Math.abs(c) * 1.4;
      r.headTilt = s * 0.12;
      r.armNear = { elbow: [8 + s * 2, -33], hand: [7 + s * 4, -43 - c * 3] };
      r.armFar = { elbow: [-8 + s * 2, -33], hand: [-7 + s * 4, -43 + c * 3] };
      r.legFar = leg([-4 + s, -10], [-5 + s * 1.5, 0]);
      r.legNear = leg([4 + s, -10], [5 + s * 1.5, 0]);
      r.hairFlow = -s * 2.4;
      break;
    }

    case "danceTwist": {
      const s = Math.sin(t * 4.2);
      r.scaleX = 0.55 + 0.45 * Math.cos(t * 4.2);
      r.rootY = -Math.abs(s) * 1.2;
      r.hipY = HIP_Y + Math.abs(s) * 1.6;
      r.headTilt = -s * 0.1;
      r.armNear = { elbow: [8, -31], hand: [10, -37 - s * 2] };
      r.armFar = { elbow: [-8, -31], hand: [-10, -37 + s * 2] };
      r.legFar = leg([-4.5, -9.5 + Math.abs(s)], [-5, 0]);
      r.legNear = leg([4.5, -9.5 + Math.abs(s)], [5, 0]);
      r.hairFlow = s * 2.6;
      break;
    }

    case "danceHop": {
      const ph = (t * 2.6) % 1;
      const air = Math.sin(ph * Math.PI);
      r.rootY = -air * 9;
      r.headTilt = -air * 0.1;
      r.armNear = { elbow: [8, -38 - air * 3], hand: [9, -47 - air * 6] };
      r.armFar = { elbow: [-8, -38 - air * 3], hand: [-9, -47 - air * 6] };
      const tuck = air * 5;
      r.legFar = leg([-4, -11 - tuck * 0.4], [-5.5, -tuck]);
      r.legNear = leg([4, -11 - tuck * 0.4], [5.5, -tuck]);
      r.hairFlow = -air * 3.4;
      break;
    }

    case "danceSpin": {
      r.scaleX = Math.cos(t * 5.4);
      r.rootY = -Math.abs(Math.sin(t * 5.4)) * 1.2;
      r.headTilt = 0.05;
      r.armNear = { elbow: [9, -34], hand: [13, -38] };
      r.armFar = { elbow: [-9, -34], hand: [-13, -38] };
      r.legFar = leg([-4, -10], [-5, 0]);
      r.legNear = leg([3, -12], [4.5, -4]);
      r.hairFlow = 3.8;
      break;
    }

    /* --------------------------- Turnen ----------------------------- */

    case "handstand": {
      // Arme gestreckt über dem Kopf, danach Körper um die Mitte gedreht
      const wob = Math.sin(t * 3) * 0.05;
      r.rootRot = Math.PI + wob;
      r.pivotY = -28;
      r.armNear = { elbow: [4.5, -45], hand: [4, -54] };
      r.armFar = { elbow: [-4.5, -45], hand: [-4, -54] };
      r.legFar = leg([-3.4, -10], [-4.6 + Math.sin(t * 3) * 1.2, -1]);
      r.legNear = leg([3.4, -10], [4.6 + Math.cos(t * 3) * 1.2, -1]);
      r.headTilt = -0.06;
      r.hairUp = true;
      r.hairLen = 0.45; // Haare hängen fast bis zum Boden, ohne ihn zu durchdringen
      r.hairFlow = Math.sin(t * 2.4) * 1.4;
      break;
    }

    case "cartwheel": {
      const a = phase * Math.PI * 2;
      r.rootRot = a;
      r.pivotY = -28;
      r.rootY = -9;
      r.rootX = (phase - 0.5) * 54;
      // Arme und Beine gespreizt wie ein Rad
      r.armNear = { elbow: [6, -44], hand: [8, -53] };
      r.armFar = { elbow: [-6, -44], hand: [-8, -53] };
      r.legFar = leg([-6, -12], [-8.5, -1]);
      r.legNear = leg([6, -12], [8.5, -1]);
      r.hairUp = Math.cos(a) < 0;
      r.hairLen = 0.85;
      r.hairFlow = Math.sin(a) * 2.6;
      break;
    }

    case "flip": {
      const a = phase * Math.PI * 2;
      const air = Math.sin(phase * Math.PI);
      r.rootRot = -a;
      r.pivotY = -26;
      r.rootY = -air * 26;
      // eingerollt
      const tuck = 0.35 + air * 0.65;
      r.armNear = { elbow: [7, -28], hand: [5, -18 + tuck * 2] };
      r.armFar = { elbow: [-7, -28], hand: [-5, -18 + tuck * 2] };
      r.legFar = leg([-5, -13 + tuck * 3], [-3, -20 * tuck]);
      r.legNear = leg([5, -13 + tuck * 3], [3.5, -20 * tuck]);
      r.headTilt = 0.2 * tuck;
      r.hairUp = Math.cos(a) < 0;
      r.hairFlow = Math.sin(a) * 3;
      break;
    }

    case "split": {
      r.rootY = 12;
      r.hipY = HIP_Y + 1;
      r.armNear = { elbow: [8, -24], hand: [13, -16] };
      r.armFar = { elbow: [-8, -24], hand: [-13, -16] };
      r.legNear = leg([10, -15], [19, -15]);
      r.legFar = leg([-10, -15], [-19, -15]);
      r.footDrop = 3;
      r.headTilt = -0.05;
      r.footFarDir = -1;
      r.footNearDir = 1;
      break;
    }
  }
  return r;
}

/* ------------------------------ Haare --------------------------------- */

function drawHairBack(ctx: C, flow: number, up: boolean, lenK: number) {
  ctx.save();
  ctx.translate(0, HEAD_Y);
  if (up) ctx.scale(1, -1);
  // Die Masse der Rückenhaare liegt hinter dem Kopf, nicht symmetrisch um ihn.
  ctx.translate(-2.6, 0);
  const L = HAIR_LEN * lenK;
  ctx.beginPath();
  ctx.moveTo(-10.2, -2);
  ctx.arc(0, -1.2, 10.4, Math.PI, 0);
  ctx.lineTo(10.2, -2);
  ctx.quadraticCurveTo(12.8, L * 0.34, 10.8 + flow, L * 0.92);
  ctx.quadraticCurveTo(10, L + 1.4, 5.6, L);
  ctx.quadraticCurveTo(0, L + 2.2, -5.6, L);
  ctx.quadraticCurveTo(-10, L + 1.4, -10.8 + flow, L * 0.92);
  ctx.quadraticCurveTo(-12.8, L * 0.34, -10.2, -2);
  ctx.closePath();
  ctx.fillStyle = LUNI_COLORS.hair;
  ctx.fill();
  ctx.restore();
}

function drawHairFront(ctx: C, flow: number, up: boolean, lenK: number) {
  ctx.save();
  ctx.translate(0, HEAD_Y);
  if (up) ctx.scale(1, -1);

  // Pony: glatter Bogen über der Stirn, leicht seitlich gescheitelt
  ctx.beginPath();
  ctx.arc(0, -1.2, 9.5, Math.PI * 1.01, Math.PI * 1.99);
  ctx.quadraticCurveTo(7.4, -4.6, 2.6, -5.6);
  ctx.quadraticCurveTo(-3.6, -6.8, -9.3, -2.2);
  ctx.closePath();
  ctx.fillStyle = LUNI_COLORS.hair;
  ctx.fill();

  // Seitensträhnen rahmen das Gesicht (glatt, nicht spitz)
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    const sl = 12 * Math.max(0.5, lenK);
    ctx.moveTo(sgn * 8.6, -4.4);
    ctx.quadraticCurveTo(sgn * 11.4, sl * 0.39, sgn * (10.2 + flow * 0.3), sl);
    ctx.quadraticCurveTo(sgn * 8.6, sl * 1.07, sgn * 7.4, sl * 0.94);
    ctx.quadraticCurveTo(sgn * 8, sl * 0.32, sgn * 6.4, -3.4);
    ctx.closePath();
    ctx.fillStyle = LUNI_COLORS.hair;
    ctx.fill();
  }

  // dezenter Glanz
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = LUNI_COLORS.hairSheen;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -1.2, 7.2, Math.PI * 1.16, Math.PI * 1.5);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/* ------------------------------ Gesicht -------------------------------- */

function drawFace(ctx: C, expr: LuniExpr, blink: number, t: number) {
  const closed =
    blink > 0.5 || expr === "happy" || expr === "grin" || expr === "sleep" || expr === "love";
  const farX = -2.6;
  const nearX = 3.6;
  const eyeY = 0.4;

  ctx.save();
  ctx.translate(0, HEAD_Y);

  // ---- Augen ----
  ctx.fillStyle = LUNI_COLORS.eye;
  ctx.strokeStyle = LUNI_COLORS.eye;
  ctx.lineCap = "round";

  const arcUp = (x: number, w: number) => {
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(x, eyeY + 0.9, w, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  };
  const arcDown = (x: number, w: number) => {
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(x, eyeY - 1.1, w, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  };
  const dot = (x: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, eyeY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + r * 0.2, eyeY - r * 0.75, 0.55, 0.55);
    ctx.fillStyle = LUNI_COLORS.eye;
  };

  if (expr === "sleep") {
    arcDown(farX, 1.9);
    arcDown(nearX, 2.1);
  } else if (expr === "love") {
    for (const [x, s] of [
      [farX, 0.85],
      [nearX, 1],
    ] as [number, number][]) {
      ctx.save();
      ctx.translate(x, eyeY);
      ctx.scale(s, s);
      ctx.fillStyle = "#ff5d8f";
      ctx.beginPath();
      ctx.moveTo(0, 2.2);
      ctx.bezierCurveTo(-3.2, -0.2, -2, -2.6, 0, -1.1);
      ctx.bezierCurveTo(2, -2.6, 3.2, -0.2, 0, 2.2);
      ctx.fill();
      ctx.restore();
    }
  } else if (closed) {
    arcUp(farX, 1.9);
    arcUp(nearX, 2.1);
  } else if (expr === "wink") {
    dot(farX, 1.5);
    arcUp(nearX, 2.1);
  } else if (expr === "annoyed") {
    ctx.lineWidth = 1.2;
    for (const x of [farX, nearX]) {
      ctx.beginPath();
      ctx.moveTo(x - 1.8, eyeY);
      ctx.lineTo(x + 1.8, eyeY);
      ctx.stroke();
    }
  } else if (expr === "surprised") {
    for (const [x, r] of [
      [farX, 1.9],
      [nearX, 2.1],
    ] as [number, number][]) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, eyeY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = LUNI_COLORS.eye;
      ctx.beginPath();
      ctx.arc(x + 0.2, eyeY + 0.2, r * 0.52, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (expr === "tired") {
    dot(farX, 1.3);
    dot(nearX, 1.4);
    ctx.lineWidth = 1;
    for (const x of [farX, nearX]) {
      ctx.beginPath();
      ctx.moveTo(x - 2, eyeY - 2.2);
      ctx.lineTo(x + 2, eyeY - 2.6);
      ctx.stroke();
    }
  } else if (expr === "focus") {
    ctx.lineWidth = 1.3;
    for (const x of [farX, nearX]) {
      ctx.beginPath();
      ctx.moveTo(x - 1.7, eyeY - 0.3);
      ctx.lineTo(x + 1.7, eyeY - 0.3);
      ctx.stroke();
    }
    dot(nearX, 1.1);
  } else if (expr === "think") {
    dot(farX, 1.4);
    ctx.beginPath();
    ctx.arc(nearX + 0.5, eyeY - 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    dot(farX, 1.4);
    dot(nearX, 1.6);
  }

  // ---- Augenbrauen ----
  ctx.strokeStyle = LUNI_COLORS.hair;
  ctx.lineWidth = 1;
  const browY = eyeY - 4.6;
  const brow = (x: number, tilt: number, lift: number) => {
    ctx.beginPath();
    ctx.moveTo(x - 2, browY + lift + tilt);
    ctx.quadraticCurveTo(x, browY + lift - 0.9, x + 2, browY + lift - tilt);
    ctx.stroke();
  };
  if (expr === "sad") {
    brow(farX, -1, 0.6);
    brow(nearX, 1, 0.6);
  } else if (expr === "annoyed" || expr === "focus") {
    brow(farX, 1.1, 0.5);
    brow(nearX, -1.1, 0.5);
  } else if (expr === "surprised") {
    brow(farX, 0, -1.4);
    brow(nearX, 0, -1.4);
  } else if (expr === "think") {
    brow(farX, 0, 0.3);
    brow(nearX, 0.6, -1.3);
  }

  // ---- Nerd-Brille (kräftiger, eckig-gerundeter Rahmen) ----
  ctx.save();
  ctx.strokeStyle = LUNI_COLORS.glasses;
  ctx.lineWidth = 0.95;
  ctx.fillStyle = "rgba(220,245,255,.13)";
  const lw = 5.4;
  const lh = 4.8;
  for (const cx of [farX, nearX]) {
    rr(ctx, cx - lw / 2, eyeY - lh / 2, lw, lh, 1.7);
    ctx.fill();
    ctx.stroke();
  }
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  ctx.moveTo(farX + lw / 2, eyeY - 0.5);
  ctx.lineTo(nearX - lw / 2, eyeY - 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(farX - lw / 2, eyeY - 0.8);
  ctx.lineTo(-7.6, eyeY - 1.6);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(nearX - 1.6, eyeY + 1.4);
  ctx.lineTo(nearX + 0.6, eyeY - 1.4);
  ctx.stroke();
  ctx.restore();

  // ---- Wangen ----
  ctx.fillStyle = LUNI_COLORS.blush;
  ctx.beginPath();
  ctx.ellipse(nearX + 3.4, eyeY + 3.6, 2.1, 1.3, 0, 0, Math.PI * 2);
  ctx.ellipse(farX - 2.8, eyeY + 3.8, 1.7, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- Mund ----
  const mY = eyeY + 5.2;
  const mx = 0.8;
  ctx.strokeStyle = LUNI_COLORS.mouth;
  ctx.fillStyle = LUNI_COLORS.mouth;
  ctx.lineWidth = 1.05;
  switch (expr) {
    case "happy":
    case "love":
      ctx.beginPath();
      ctx.arc(mx, mY - 1.4, 2.7, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();
      break;
    case "grin":
      ctx.beginPath();
      ctx.arc(mx, mY - 1.8, 3.3, Math.PI * 0.06, Math.PI * 0.94);
      ctx.closePath();
      ctx.fill();
      break;
    case "wink":
      ctx.beginPath();
      ctx.arc(mx, mY - 1.2, 2.5, Math.PI * 0.1, Math.PI * 0.8);
      ctx.stroke();
      break;
    case "neutral":
    case "focus":
      ctx.beginPath();
      ctx.moveTo(mx - 1.4, mY - 0.4);
      ctx.lineTo(mx + 1.6, mY - 0.4);
      ctx.stroke();
      break;
    case "sleep":
    case "tired": {
      const o = expr === "sleep" ? 1 + Math.sin(t * 1.6) * 0.35 : 0.8;
      ctx.beginPath();
      ctx.ellipse(mx, mY, 1.2, o, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "surprised":
      ctx.beginPath();
      ctx.ellipse(mx, mY, 1.2, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "sad":
      ctx.beginPath();
      ctx.arc(mx, mY + 2, 2.3, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
      break;
    case "annoyed":
      ctx.beginPath();
      ctx.moveTo(mx - 2, mY);
      ctx.quadraticCurveTo(mx, mY - 1.3, mx + 2, mY + 0.2);
      ctx.stroke();
      break;
    case "think":
      ctx.beginPath();
      ctx.moveTo(mx - 1.6, mY - 0.2);
      ctx.quadraticCurveTo(mx + 0.4, mY + 0.8, mx + 2, mY - 0.9);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

/* ------------------------------- Socken -------------------------------- */

function drawSock(ctx: C, foot: V, ang: number, cols: string[], dir: 1 | -1 = 1) {
  ctx.save();
  ctx.translate(foot[0], foot[1]);
  ctx.rotate(ang);
  if (dir < 0) ctx.scale(-1, 1);
  // kein Schaft – die Socke endet am Knöchel.
  // Fuß – Sohle liegt auf y = 0
  ctx.fillStyle = cols[0];
  rr(ctx, -2.2, -3.6, 7.4, 3.6, 1.6);
  ctx.fill();
  ctx.fillStyle = cols[1];
  rr(ctx, 2.6, -3.6, 2.2, 3.6, 1);
  ctx.fill();
  ctx.restore();
}

/** Endpunkt um d zurückziehen, damit die runde Linienkappe nicht übersteht. */
function pullBack(from: V, to: V, d: number): V {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  return [to[0] - (dx / len) * d, to[1] - (dy / len) * d];
}

/* ------------------------------ Kleidung -------------------------------- */

function drawTorso(ctx: C, r: Rig) {
  const K = LUNI_COLORS;
  const topY = r.shoulderY;
  const botY = r.hipY;
  const h = botY - topY;

  // weißes T-Shirt als Basis
  ctx.fillStyle = K.tee;
  rr(ctx, -7.2, topY, 14.4, h + 1.5, 5);
  ctx.fill();
  ctx.fillStyle = K.teeShade;
  rr(ctx, -7.2, botY - 3.4, 14.4, 3.4, 2);
  ctx.fill();

  // Leggings-Bund
  ctx.fillStyle = K.leggings;
  rr(ctx, -6.8, botY - 2.4, 13.6, 4.4, 2);
  ctx.fill();

  // offene Strickjacke: zwei Vorderteile, Mitte bleibt weiß
  for (const sgn of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(sgn * 2.4, topY + 0.4);
    ctx.quadraticCurveTo(sgn * 7.6, topY - 0.4, sgn * 7.8, topY + 5);
    ctx.lineTo(sgn * 7.4, botY + 1.6);
    ctx.quadraticCurveTo(sgn * 4.6, botY + 2.4, sgn * 3.4, botY + 0.6);
    ctx.quadraticCurveTo(sgn * 2.2, topY + 8, sgn * 2.4, topY + 0.4);
    ctx.closePath();
    ctx.fillStyle = sgn > 0 ? K.cardigan : K.cardiganDark;
    ctx.fill();
  }

  // Kragen
  ctx.beginPath();
  ctx.moveTo(-4.4, topY + 0.2);
  ctx.quadraticCurveTo(0, topY + 3.4, 4.4, topY + 0.2);
  ctx.quadraticCurveTo(2.4, topY - 1.6, 0, topY - 1.2);
  ctx.quadraticCurveTo(-2.4, topY - 1.6, -4.4, topY + 0.2);
  ctx.closePath();
  ctx.fillStyle = K.cardiganLight;
  ctx.fill();

  // Knopfleiste auf dem vorderen Teil (Jacke bleibt offen)
  ctx.fillStyle = K.cardiganLight;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(3.3, topY + 5.5 + i * 4.2, 0.62, 0, Math.PI * 2);
    ctx.fill();
  }

  // Saum
  ctx.fillStyle = K.cardiganLight;
  ctx.globalAlpha = 0.55;
  rr(ctx, -7.6, botY - 0.4, 15.2, 1.2, 0.6);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* ------------------------------ Hauptroutine ---------------------------- */

/** Zeichnet Luni und liefert die Weltposition der vorderen Hand zurück. */
export function drawLuni(ctx: C, x: number, y: number, opts: LuniOpts = {}): V {
  const {
    t = 0,
    face = 1,
    state = "idle",
    expr = "happy",
    walk = 0,
    blink = 0,
    scale = 1,
    shadow = true,
    phase = 0,
    armReach = 1,
    cough = 0,
    sick = 0,
  } = opts;

  // Kränkliche Haut: je höher `sick`, desto grüner das Gesicht
  const K = sick > 0.01
    ? {
        ...LUNI_COLORS,
        skin: mixCol(LUNI_COLORS.skin, "#8fae6e", sick * 0.75),
        skinShade: mixCol(LUNI_COLORS.skinShade, "#7d9a5e", sick * 0.75),
      }
    : LUNI_COLORS;
  const r = buildRig(state, t, walk, phase, armReach);

  // Husten: Oberkörper zuckt nach vorn, Kopf senkt sich, Hand zum Mund
  if (cough > 0.01) {
    const burst = coughPulse(t) * cough;
    if (burst > 0.001) {
      r.rootY += burst * 4.2;
      r.headTilt += burst * 0.5;
      r.shoulderY += burst * 1.6;
      r.armNear = {
        elbow: [lerp(r.armNear.elbow[0], 2, burst), lerp(r.armNear.elbow[1], -34, burst)],
        hand: [lerp(r.armNear.hand[0], -1.5, burst), lerp(r.armNear.hand[1], -41, burst)],
      };
      r.hairFlow += burst * 0.6;
    }
  }

  if (shadow) {
    const airLift = Math.max(0, -r.rootY);
    ctx.save();
    ctx.globalAlpha = 0.26 * (1 - Math.min(0.6, airLift / 30));
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(
      x + r.rootX * scale * face,
      y + 1.5 * scale,
      (state === "split" ? 20 : 10) * scale * (1 - Math.min(0.35, airLift / 60)),
      3.2 * scale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * face, scale);
  ctx.translate(r.rootX, r.rootY);

  if (r.rootRot) {
    ctx.translate(0, r.pivotY);
    ctx.rotate(r.rootRot);
    ctx.translate(0, -r.pivotY);
  }
  if (r.scaleX !== 1) {
    ctx.translate(0, r.pivotY);
    ctx.scale(Math.abs(r.scaleX) < 0.06 ? 0.06 * Math.sign(r.scaleX || 1) : r.scaleX, 1);
    ctx.translate(0, -r.pivotY);
  }
  // Der Oberkörper wird nicht mehr geneigt. Der Aufbau der Figur bleibt
  // unverändert; nur der Rumpf wird zusätzlich gespiegelt (siehe unten).
  const upperLean = (fn: () => void) => fn();

  /* --- Haare hinten --- */
  upperLean(() => drawHairBack(ctx, r.hairFlow, r.hairUp, r.hairLen));

  /* --- hinteres Bein (unverdreht, steht sicher auf dem Boden) --- */
  stroke3(
    ctx,
    [-2.6, r.hipY],
    r.legFar.elbow,
    pullBack(r.legFar.elbow, r.legFar.hand, 3.1),
    K.leggings,
    5.4,
  );
  drawSock(ctx, [r.legFar.hand[0], r.legFar.hand[1] + r.footDrop], r.footFarAng, K.sockL, r.footFarDir);

  /* --- Arme: Rollen getauscht ---
     Der bisher vordere Arm (+x) liegt jetzt hinter dem Rumpf, der bisher
     hintere (−x) wird vorn gezeichnet. Jeder Arm bleibt auf seiner Seite,
     damit erhobene Arme nicht quer über den Körper greifen. */
  const armBehind = r.armNear;
  const armFront = r.armFar;

  /* --- hinterer Arm (früher der vordere) --- */
  upperLean(() =>
    stroke3(ctx, [3.4, r.shoulderY + 2], armBehind.elbow, armBehind.hand, K.cardiganDark, 4.4),
  );
  ctx.fillStyle = K.skinShade;
  ctx.beginPath();
  ctx.arc(armBehind.hand[0], armBehind.hand[1], 1.9, 0, Math.PI * 2);
  ctx.fill();

  /* --- vorderes Bein (unverdreht) --- */
  stroke3(
    ctx,
    [2.6, r.hipY],
    r.legNear.elbow,
    pullBack(r.legNear.elbow, r.legNear.hand, 3.1),
    K.leggingsLight,
    5.6,
  );
  drawSock(ctx, [r.legNear.hand[0], r.legNear.hand[1] + r.footDrop], r.footNearAng, K.sockR, r.footNearDir);

  /* --- Rumpf (an der vertikalen Achse gespiegelt) --- */
  upperLean(() => {
    ctx.save();
    ctx.scale(-1, 1);
    drawTorso(ctx, r);
    ctx.restore();
  });

  /* --- vorderer Arm (früher der hintere) --- */
  upperLean(() =>
    stroke3(ctx, [-3.4, r.shoulderY + 2], armFront.elbow, armFront.hand, K.cardigan, 4.6),
  );
  // Ärmelbündchen
  ctx.save();
  const ha = Math.atan2(
    armFront.hand[1] - armFront.elbow[1],
    armFront.hand[0] - armFront.elbow[0],
  );
  ctx.translate(armFront.hand[0], armFront.hand[1]);
  ctx.rotate(ha);
  ctx.fillStyle = K.cardiganLight;
  rr(ctx, -3.4, -2.3, 2.6, 4.6, 1.1);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = K.skin;
  ctx.beginPath();
  ctx.arc(armFront.hand[0], armFront.hand[1], 2.1, 0, Math.PI * 2);
  ctx.fill();

  /* --- Hals --- */
  upperLean(() => {
    ctx.fillStyle = K.skinShade;
    rr(ctx, -2, r.headY + 7, 4, 4.6, 1.6);
    ctx.fill();
  });

  /* --- Kopf --- */
  upperLean(() => {
  ctx.save();
  ctx.translate(0, r.headY);
  ctx.rotate(r.headTilt);
  ctx.translate(0, -r.headY);

  // Ohr hinten
  ctx.fillStyle = K.skinShade;
  ctx.beginPath();
  ctx.arc(-7.4, HEAD_Y + 1.2, 1.9, 0, Math.PI * 2);
  ctx.fill();

  // Kopf
  ctx.fillStyle = K.skin;
  ctx.beginPath();
  ctx.arc(0, HEAD_Y, HEAD_R, 0, Math.PI * 2);
  ctx.fill();

  drawHairFront(ctx, r.hairFlow, r.hairUp, r.hairLen);
  drawFace(ctx, expr, blink, t);
  ctx.restore();
  });

  ctx.restore();

  // Gegenstände hängen an der räumlich vorderen Hand – also der Hand, die
  // beim Greifen, Klavierspielen oder Sitzen tatsächlich vor dem Körper ist.
  const propHand = r.armNear.hand[0] >= r.armFar.hand[0] ? r.armNear.hand : r.armFar.hand;
  return [
    x + (r.rootX + propHand[0]) * scale * face,
    y + (r.rootY + propHand[1]) * scale,
  ];
}

/* ---------------------------- Zzz-Partikel ----------------------------- */

export function drawZzz(ctx: C, x: number, y: number, t: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.5 + i * 0.33) % 1;
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.85;
    ctx.font = `700 ${lerp(5, 11, p)}px "Silkscreen", monospace`;
    ctx.fillStyle = "#9fc6ff";
    ctx.fillText("z", p * 12, -p * 20);
  }
  ctx.restore();
}
