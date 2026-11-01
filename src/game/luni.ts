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

/** Größte natürliche Reichweite der Figur (Welt-Einheiten bei Maßstab 1).
 *  Ergibt sich aus den festen Ober-/Unterarmlängen der Zeichnung. */
export const ARM_REACH_MAX = 8.2 + 8.4;

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
  | "pack"
  | "undress"
  | "wrap"
  | "wash"
  | "throw"
  | "glasses"
  | "toss"
  | "glassesOn"
  | "reachUp"
  | "bend"
  | "brush"
  | "sleepBend";

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
  /** 0..1: rechter Fuß wippt im Takt (Saxophon) */
  footTap?: number;
  /** -1..1: Oberkörper wiegt sich mit der Musik (Saxophon) */
  sway?: number;
  /** Weltkoordinate: dorthin streckt sich die vordere Hand (Greifen). */
  handTarget?: [number, number] | null;
  /** Weltkoordinate für die zweite Hand (zweiter Griff am Instrument). */
  handTarget2?: [number, number] | null;
  /** Wird nach dem Zeichnen mit beiden Handpositionen in Weltkoordinaten gefüllt. */
  handOut?: { front: [number, number]; rear: [number, number] } | null;
  /** Wird zwischen Rumpf und Armen aufgerufen – dort hängt das Saxophon.
   *  So liegen Instrument und Oberkörper in derselben Tiefenebene. */
  betweenBodyAndArms?: (() => void) | null;
  /** Beide Arme werden NACH dem Rumpf (und nach betweenBodyAndArms) gezeichnet. */
  armsInFront?: boolean;
  /** Kleidung: angezogen, Handtuch oder (nur hinter dem Vorhang) ohne */
  outfit?: "dressed" | "towel" | "none";
  /** Rücken zum Betrachter: Haare statt Gesicht */
  back?: boolean;
  /** 0..1: nasse Haare, Tropfen */
  wet?: number;
  /** Brille auf der Nase */
  glasses?: boolean;
  /** Pyjama (statt Alltagskleidung) */
  pajama?: { top: string; bottom: string } | null;
  /** 0..1: in der Seitenlage die Haare neben das Ohr legen */
  hairAside?: number;
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
  /** Vorbeugen des Oberkörpers um die Hüfte (Radiant, positiv = nach vorn) */
  bend: number;
  /** Welche Hand Gegenstände hält */
  prop: "auto" | "near" | "far";
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (v: number) => {
  const k = clamp01(v);
  return k * k * (3 - 2 * k);
};

/** Ober- und Unterarm (Bühneneinheiten der Figur) */
const UPPER_ARM = 8.2;
const FORE_ARM = 8.4;

/**
 * Ellbogen aus Schulter und Hand bei fester Ober-/Unterarmlänge.
 * `out` wählt die Seite, zu der der Ellbogen knickt. Zu weit entfernte
 * Ziele werden auf die Armlänge gekürzt.
 */
function armIK(s: V, h: V, out: 1 | -1): Limb {
  let hx = h[0];
  let hy = h[1];
  let dx = hx - s[0];
  let dy = hy - s[1];
  let d = Math.hypot(dx, dy);
  const max = UPPER_ARM + FORE_ARM - 0.05;
  // Auch nach innen begrenzen: näher als |Oberarm - Unterarm| lässt sich das
  // Gelenk nicht falten, sonst stimmt die Unterarmlänge nicht mehr.
  const min = Math.abs(UPPER_ARM - FORE_ARM) + 0.001;
  if (d < min) {
    if (d < 0.0001) {
      hx = s[0] + min;
      hy = s[1];
    } else {
      hx = s[0] + (dx / d) * min;
      hy = s[1] + (dy / d) * min;
    }
    dx = hx - s[0];
    dy = hy - s[1];
    d = min;
  }
  if (d > max) {
    hx = s[0] + (dx / d) * max;
    hy = s[1] + (dy / d) * max;
    dx = hx - s[0];
    dy = hy - s[1];
    d = max;
  }
  const a = (UPPER_ARM * UPPER_ARM - FORE_ARM * FORE_ARM + d * d) / (2 * d);
  const k = Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - a * a));
  const ux = dx / d;
  const uy = dy / d;
  return {
    elbow: [s[0] + ux * a - uy * k * out, s[1] + uy * a + ux * k * out],
    hand: [hx, hy],
  };
}

/** Werte zwischen Stützpunkten [phase, wert] weich überblenden. */
function keys(p: number, ks: [number, V][]): V {
  if (p <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (p <= ks[i][0]) {
      const [p0, a] = ks[i - 1];
      const [p1, b] = ks[i];
      const e = ease((p - p0) / (p1 - p0));
      return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
    }
  }
  return ks[ks.length - 1][1];
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
    bend: 0,
    prop: "auto",
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

    case "glassesOn": {
      // Hand ins Becken, Brille greifen, zum Gesicht führen, aufsetzen.
      const p = clamp01(phase);
      const reach = ease(p / 0.32);
      const lift = ease((p - 0.42) / 0.36);
      const down = ease((p - 0.86) / 0.14);
      r.rootY = breathe * 0.4 + reach * (1 - lift) * 1.6;
      r.headTilt = 0.18 * reach * (1 - lift) - 0.05 * lift * (1 - down);
      r.armNear = { elbow: [4.5, -29], hand: [4.6, -21.6] };
      const hand: V = keys(p, [
        [0, [-7.6, -21.5]],
        [0.32, [10.6, -34.4]],
        [0.42, [10.6, -34.4]],
        [0.78, [6.6, -46.2]],
        [0.86, [6.6, -46.2]],
        [1, [-7.6, -21.5]],
      ]);
      r.armFar = armIK([-3.4, -34], hand, 1);
      r.legFar = leg([-3.6, -10], [-4.2, 0]);
      r.legNear = leg([3.6, -10], [4.2, 0]);
      r.prop = "far";
      break;
    }

    case "reachUp": {
      // Auf Zehenspitzen nach oben in den Spiegelschrank greifen.
      const p = clamp01(phase);
      const up = Math.sin(p * Math.PI);
      const tip = ease(p / 0.3) * (1 - ease((p - 0.75) / 0.25));
      r.rootY = breathe * 0.3 - tip * 2.4;
      r.headTilt = -0.2 * up;
      const hand: V = [lerp(7.6, 7, up), lerp(-21.5, -48, up)];
      r.armNear = armIK([3.4, -34], hand, 1);
      r.armFar = { elbow: [-6.4, -29], hand: [-7.6, -21.5] };
      r.legFar = leg([-3.6, -10], [-4.2, 0]);
      r.legNear = leg([3.6, -10], [4.2, 0]);
      r.footDrop = -tip * 2.4;
      r.prop = "near";
      break;
    }

    case "sleepBend": {
      // Auf dem Bettrand sitzen: Beine hängen vorn herunter, Oberkörper aufrecht.
      const p = clamp01(phase);
      r.rootY = breathe * 0.4 - p * 1.2;
      r.hipY = HIP_Y;
      r.armFar = { elbow: [-5.5, -28], hand: [-6.5, -19] };
      r.armNear = { elbow: [5.5, -28], hand: [6.5, -19] };
      r.legFar = leg([-3.6, -10], [-4.6, -10 + 2]);
      r.legNear = leg([3.6, -10], [4.6, -10 + 2]);
      r.headTilt = 0.12;
      break;
    }

    case "bend":
    case "brush": {
      // Tief nach vorn beugen; die Proportionen bleiben, nur die Hüfte knickt.
      const b = state === "brush" ? 1 : ease(phase);
      const th = 1.62 * b;
      r.bend = th;
      r.rootX = -3 * b;
      r.rootY = breathe * 0.3 * (1 - b) + b * 1;
      r.legFar = leg([-3.6 + 4.2 * b, -10 + 0.8 * b], [-4.2 + 3 * b, -b]);
      r.legNear = leg([3.6 + 4.2 * b, -10 + 0.8 * b], [4.2 + 3 * b, -b]);
      r.hairFlow = 0;
      // Richtung „nach unten“ im gekippten Oberkörper, und quer dazu zum Körper hin
      const D: V = [Math.sin(th), Math.cos(th)];
      const P: V = [-Math.cos(th), Math.sin(th)];
      const SF: V = [-3.4, -34];
      const SN: V = [3.4, -34];
      const hangF: V = [SF[0] + D[0] * 15, SF[1] + D[1] * 15];
      const hangN: V = [SN[0] + D[0] * 15, SN[1] + D[1] * 15];
      if (state === "brush") {
        // Bürste an den herabhängenden Haaren entlang, Strich nach unten,
        // dann leicht abgehoben zurück zum Ansatz.
        const k = (t * 0.95) % 1;
        const down = k < 0.72;
        const sPos = down ? lerp(3, 13, ease(k / 0.72)) : lerp(13, 3, ease((k - 0.72) / 0.28));
        const off = down ? 7.5 : 10.5;
        const hand: V = [D[0] * sPos + P[0] * off, HEAD_Y + D[1] * sPos + P[1] * off];
        r.armFar = armIK(SF, hand, -1);
        r.armNear = armIK(SN, hangN, 1);
        r.prop = "far";
      } else {
        r.armFar = armIK(SF, [lerp(-7.6, hangF[0], b), lerp(-21.5, hangF[1], b)], -1);
        r.armNear = armIK(SN, [lerp(7.6, hangN[0], b), lerp(-21.5, hangN[1], b)], 1);
        r.prop = "far";
      }
      break;
    }

    case "undress": {
      // Oberteil über den Kopf ziehen: Arme hoch, dann wieder herunter.
      const p = Math.sin(clamp01(phase) * Math.PI);
      r.rootY = breathe * 0.4;
      r.headTilt = 0.08 * p;
      r.armNear = { elbow: [lerp(7, 7, p), lerp(-31, -48, p)], hand: [lerp(9, 3, p), lerp(-26, -60, p)] };
      r.armFar = { elbow: [lerp(-6, -7, p), lerp(-29, -48, p)], hand: [lerp(-7, -3, p), lerp(-22, -60, p)] };
      r.legFar = leg([-3.6, -10], [-4.4, 0]);
      r.legNear = leg([3.6, -10], [4.4, 0]);
      r.hairFlow = 0.4 * p;
      break;
    }

    case "wrap": {
      // Handtuch um den Körper: Arme kommen von den Seiten zur Brust.
      const p = clamp01(phase);
      const e = p * p * (3 - 2 * p);
      r.rootY = breathe * 0.4;
      r.armNear = { elbow: [lerp(10, 7, e), lerp(-29, -27, e)], hand: [lerp(13, 2, e), lerp(-27, -30, e)] };
      r.armFar = { elbow: [lerp(-10, -6, e), lerp(-29, -27, e)], hand: [lerp(-13, -1, e), lerp(-27, -30, e)] };
      r.legFar = leg([-3.4, -10], [-4, 0]);
      r.legNear = leg([3.4, -10], [4, 0]);
      break;
    }

    case "wash": {
      // phase < 1: Haare einseifen, < 2: Körper einseifen, sonst abspülen.
      const s = Math.sin(t * 9);
      const c2 = Math.cos(t * 9);
      r.rootY = breathe * 0.4;
      r.legFar = leg([-3.4, -10], [-4, 0]);
      r.legNear = leg([3.4, -10], [4, 0]);
      if (phase < 1) {
        r.headTilt = 0.1;
        r.armNear = { elbow: [9, -48], hand: [3 + s * 2.2, -57 + c2 * 1.2] };
        r.armFar = { elbow: [-9, -48], hand: [-3 - s * 2.2, -57 - c2 * 1.2] };
        r.hairFlow = s * 0.6;
      } else if (phase < 2) {
        r.armNear = { elbow: [7, -28], hand: [2 + s * 3, -27 + c2 * 3] };
        r.armFar = { elbow: [-6, -26], hand: [-1 - c2 * 2.6, -22 + s * 2.4] };
      } else {
        r.headTilt = -0.22;
        r.armNear = { elbow: [9, -46], hand: [6 + s * 0.8, -55] };
        r.armFar = { elbow: [-9, -46], hand: [-6 - s * 0.8, -55] };
        r.hairFlow = -0.5;
      }
      break;
    }

    case "glasses": {
      // Hand zur Brille, kurz greifen, Brille nach vorn abziehen.
      const p = clamp01(phase);
      const a = clamp01(p / 0.4);
      const ea = a * a * (3 - 2 * a);
      const c = clamp01((p - 0.55) / 0.45);
      const ec = c * c * (3 - 2 * c);
      const hold = p > 0.4 && p < 0.55 ? Math.sin(t * 30) * 0.25 : 0;
      r.rootY = breathe * 0.4;
      r.headTilt = -0.06 * ea * (1 - ec);
      r.armNear = { elbow: [4.5, -29], hand: [4.6, -21.6] };
      r.armFar = {
        elbow: [lerp(lerp(-6.4, 5, ea), 6, ec), lerp(lerp(-29, -36, ea), -31, ec)],
        hand: [lerp(lerp(-7.6, 6.6, ea), 12, ec), lerp(lerp(-21.5, -46, ea), -36, ec) + hold],
      };
      r.legFar = leg([-3.6, -10], [-4.2, 0]);
      r.legNear = leg([3.6, -10], [4.2, 0]);
      break;
    }

    case "toss": {
      // Ausholen nach unten, dann Arm schwungvoll nach oben, Blick folgt.
      const p = clamp01(phase);
      const d = clamp01(p / 0.35);
      const ed = d * d * (3 - 2 * d);
      const u = clamp01((p - 0.35) / 0.25);
      const eu = u * u * (3 - 2 * u);
      const back = clamp01((p - 0.7) / 0.3);
      const eb = back * back * (3 - 2 * back);
      const hx = lerp(lerp(12, 9, ed), 8, eu);
      const hy = lerp(lerp(-36, -24, ed), -58, eu);
      const ex = lerp(lerp(6, 4, ed), 4, eu);
      const ey = lerp(lerp(-31, -30, ed), -46, eu);
      r.rootY = breathe * 0.4 + ed * (1 - eu) * 1.2 - eu * (1 - eb) * 1.4;
      r.headTilt = -0.28 * eu * (1 - eb * 0.5);
      r.armNear = { elbow: [4.5, -29], hand: [4.6, -21.6] };
      r.armFar = {
        elbow: [lerp(ex, -6.4, eb), lerp(ey, -29, eb)],
        hand: [lerp(hx, -7.6, eb), lerp(hy, -21.5, eb)],
      };
      r.legFar = leg([-3.6, -10], [-4.6, 0]);
      r.legNear = leg([3.8, -10 - eu * (1 - eb)], [5, -eu * (1 - eb) * 1.6]);
      break;
    }

    case "throw": {
      // Arm hebt etwas über Kopfhöhe nach vorn und lässt los.
      const p = Math.sin(clamp01(phase) * Math.PI);
      r.rootY = breathe * 0.4 - p * 0.8;
      r.armNear = { elbow: [lerp(7, 9, p), lerp(-31, -50, p)], hand: [lerp(9, 11, p), lerp(-28, -62, p)] };
      r.armFar = { elbow: [-6, -29], hand: [-7, -22] };
      r.legFar = leg([-3.6, -10], [-4.6, 0]);
      r.legNear = leg([3.8, -10], [5.2, -p * 1.4]);
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

function drawHairBack(ctx: C, flow: number, up: boolean, lenK: number, centered = false) {
  ctx.save();
  ctx.translate(0, HEAD_Y);
  if (up) ctx.scale(1, -1);
  if (centered) {
    // Rückansicht: Haare fallen mittig über den Rücken, Schultern bleiben frei.
    ctx.scale(0.84, 1);
  } else {
    // Die Masse der Rückenhaare liegt hinter dem Kopf, nicht symmetrisch um ihn.
    ctx.translate(-2.6, 0);
  }
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

function drawFace(ctx: C, expr: LuniExpr, blink: number, t: number, glasses = true) {
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

  if (glasses) {
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
  }

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

/**
 * Arme in der Rückansicht. Posen, die schon von vorn symmetrisch gebaut sind
 * (Ausziehen, Handtuch, Waschen, Werfen), werden übernommen; alles andere
 * hängt locker an den Seiten. Beim Greifen in den Schrank geht ein Arm nach
 * vorn – von hinten sieht man nur den angewinkelten Ellbogen.
 */
function backArms(state: LuniState, r: Rig, phase: number): { near: Limb; far: Limb; behind: boolean } {
  const sy = r.shoulderY + 2.2;
  const SR: V = [6.2, sy];
  const SL: V = [-6.2, sy];
  // Beide Arme spiegelbildlich, Ellbogen knicken immer nach außen.
  const pair = (hand: V, behind = false) => ({
    near: armIK(SR, hand, 1),
    far: armIK(SL, [-hand[0], hand[1]], -1),
    behind,
  });
  const hang: V = [8.6, sy + 16.2];
  if (state === "undress") {
    // Hände zum Saum, Oberteil über den Kopf, Arme wieder herunter
    const p = clamp01(phase);
    const h = keys(p, [
      [0, hang],
      [0.22, [7.4, r.hipY + 0.5]],
      [0.5, [3.4, sy - 16]],
      [0.62, [3.4, sy - 16]],
      [1, hang],
    ]);
    return pair(h);
  }
  if (state === "wrap") {
    // Handtuch weit gehalten, dann vor der Brust zusammengeführt
    const h = keys(clamp01(phase), [
      [0, [12.6, sy + 6]],
      [1, [2.2, sy + 4]],
    ]);
    return pair(h, phase > 0.35);
  }
  if (state === "throw") return { near: r.armNear, far: r.armFar, behind: false };
  if (state === "wash") return { near: r.armNear, far: r.armFar, behind: phase >= 1 && phase < 2 };
  if (state === "act") {
    // in den Schrank greifen: rechter Arm nach vorn, man sieht nur den Ellbogen
    return { near: armIK(SR, [4.2, sy - 3], 1), far: armIK(SL, [-hang[0], hang[1]], -1), behind: true };
  }
  return pair(hang);
}

/** Oberkörper von hinten: Strickjacke ohne Knöpfe, Handtuch oder Haut. */
function drawTorsoBack(ctx: C, r: Rig, outfit: "dressed" | "towel" | "none", K: typeof LUNI_COLORS) {
  const topY = r.shoulderY;
  const botY = r.hipY;
  if (outfit === "dressed") {
    // Leggings-Bund schaut unter dem Saum hervor
    ctx.fillStyle = K.leggings;
    rr(ctx, -6.8, botY - 1.6, 13.6, 3.6, 1.6);
    ctx.fill();
    // Rückenteil der Strickjacke, an den Schultern breiter
    ctx.fillStyle = K.cardigan;
    ctx.beginPath();
    ctx.moveTo(-7, topY + 1);
    ctx.quadraticCurveTo(-7.8, topY - 0.4, -4.6, topY - 0.6);
    ctx.lineTo(4.6, topY - 0.6);
    ctx.quadraticCurveTo(7.8, topY - 0.4, 7, topY + 1);
    ctx.lineTo(7.6, botY + 1.4);
    ctx.lineTo(-7.6, botY + 1.4);
    ctx.closePath();
    ctx.fill();
    // Rückennaht und Schulterschatten
    ctx.fillStyle = K.cardiganDark;
    ctx.fillRect(-0.4, topY + 2, 0.8, botY - topY - 1);
    ctx.globalAlpha = 0.5;
    rr(ctx, -7.6, topY + 1, 2, botY - topY, 1);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Kragen von hinten, Bündchen am Saum
    ctx.fillStyle = K.cardiganLight;
    rr(ctx, -3.6, topY - 1.4, 7.2, 2.2, 1.1);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    rr(ctx, -7.6, botY - 0.2, 15.2, 1.6, 0.8);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (outfit === "towel") {
    ctx.fillStyle = K.skin;
    rr(ctx, -6.6, topY, 13.2, 6, 3);
    ctx.fill();
    // Schulterblätter angedeutet
    ctx.fillStyle = K.skinShade;
    ctx.fillRect(-0.3, topY + 1.5, 0.6, 3);
    const tTop = topY + 3.2;
    const tBot = botY + 9;
    ctx.fillStyle = "#e2eef2";
    rr(ctx, -7.8, tTop, 15.6, tBot - tTop, 3);
    ctx.fill();
    ctx.fillStyle = "#cfe3ea";
    rr(ctx, -7.8, tBot - 3.4, 15.6, 3.4, 1.6);
    ctx.fill();
    ctx.fillStyle = "#7fb6d0";
    ctx.fillRect(-7.8, tTop + 2.2, 15.6, 1.2);
    ctx.fillRect(-7.8, tBot - 5.6, 15.6, 1.2);
  } else {
    ctx.fillStyle = K.skin;
    rr(ctx, -6.6, topY, 13.2, botY - topY + 2, 5);
    ctx.fill();
  }
}

/**
 * Haare neben das Ohr gelegt: der Pony bleibt, die Seitensträhne auf der
 * sichtbaren Seite wird zu einem weichen Büschel hinter das Ohr geschoben.
 */
function drawHairAside(ctx: C, k: number) {
  const e = k * k * (3 - 2 * k);
  ctx.save();
  ctx.translate(0, HEAD_Y);
  ctx.fillStyle = LUNI_COLORS.hair;
  // Stirnhaar
  ctx.beginPath();
  ctx.arc(0, -1.2, 9.5, Math.PI * 1.01, Math.PI * 1.99);
  ctx.quadraticCurveTo(7.4, -4.6, 2.6, -5.6);
  ctx.quadraticCurveTo(-3.6, -6.8, -9.3, -2.2);
  ctx.closePath();
  ctx.fill();
  // Strähne über dem Ohr, zur Seite gelegt
  ctx.beginPath();
  const sx = lerp(8.6, 11.2, e);
  ctx.moveTo(sx - 2.6, -4.4);
  ctx.quadraticCurveTo(sx + 1.4 * e, 2, sx - 1.2, 7 + 2 * e);
  ctx.quadraticCurveTo(sx - 4, 7.6 + 1.4 * e, sx - 4.6, 2);
  ctx.quadraticCurveTo(sx - 4.8, -1.6, sx - 2.6, -4.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Pyjama-Saum, Bündchen und Schleifen am Höschen. */
function drawPajamaDetails(ctx: C, r: Rig, top: string, bottom: string) {
  const dark = mixCol(top, "#000000", 0.22);
  const light = mixCol(top, "#ffffff", 0.2);
  // Knopfleiste und Kragen
  ctx.fillStyle = light;
  ctx.fillRect(-0.5, r.shoulderY + 1.2, 1, 10);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-2.4, r.shoulderY + 4 + i * 4, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = dark;
  rr(ctx, -4.2, r.shoulderY - 0.8, 8.4, 2.2, 1.1);
  ctx.fill();
  // Hosenbündchen
  ctx.fillStyle = mixCol(bottom, "#000000", 0.15);
  ctx.fillRect(-6.6, r.hipY - 1.2, 13.2, 1.4);
}

/** Handtuch unter den Achseln bis über die Knie, mit Saumstreifen. */
function drawTowel(ctx: C, r: Rig) {
  const top = r.shoulderY + 3.2;
  const bot = r.hipY + 9;
  // Schultern bleiben frei
  ctx.fillStyle = LUNI_COLORS.skin;
  rr(ctx, -6.2, r.shoulderY, 12.4, 5, 3);
  ctx.fill();
  ctx.fillStyle = "#eaf4f7";
  rr(ctx, -7.8, top, 15.6, bot - top, 3);
  ctx.fill();
  ctx.fillStyle = "#cfe3ea";
  rr(ctx, -7.8, bot - 3.4, 15.6, 3.4, 1.6);
  ctx.fill();
  ctx.fillStyle = "#7fb6d0";
  ctx.fillRect(-7.8, top + 2.2, 15.6, 1.2);
  ctx.fillRect(-7.8, bot - 5.6, 15.6, 1.2);
  // eingesteckter Zipfel
  ctx.fillStyle = "#d9eaef";
  ctx.beginPath();
  ctx.moveTo(-6.6, top + 0.6);
  ctx.lineTo(-2.2, top + 0.6);
  ctx.lineTo(-4.4, top + 5.4);
  ctx.closePath();
  ctx.fill();
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
    footTap = 0,
    sway = 0,
    handTarget = null,
    handTarget2 = null,
    handOut = null,
    betweenBodyAndArms = null,
    armsInFront = false,
    outfit = "dressed",
    back = false,
    wet = 0,
    glasses = true,
    pajama = null,
    hairAside = 0,
  } = opts;

  // Kränkliche Haut: je höher `sick`, desto grüner das Gesicht
  const K0 = sick > 0.01
    ? {
        ...LUNI_COLORS,
        skin: mixCol(LUNI_COLORS.skin, "#8fae6e", sick * 0.75),
        skinShade: mixCol(LUNI_COLORS.skinShade, "#7d9a5e", sick * 0.75),
      }
    : LUNI_COLORS;
  // Ohne Kleidung (Handtuch oder hinter dem Vorhang) sind Arme und Beine Haut.
  const P = pajama;
  const K = outfit === "dressed" && P
    ? {
        ...K0,
        cardigan: P.top,
        cardiganDark: mixCol(P.top, "#000000", 0.18),
        cardiganLight: mixCol(P.top, "#ffffff", 0.22),
        tee: P.top,
        teeShade: mixCol(P.top, "#000000", 0.12),
        leggings: P.bottom,
        leggingsLight: mixCol(P.bottom, "#ffffff", 0.14),
        sockL: [P.bottom, P.bottom],
        sockR: [P.bottom, P.bottom],
      }
    : outfit === "dressed"
    ? K0
    : {
        ...K0,
        leggings: K0.skinShade,
        leggingsLight: K0.skin,
        cardigan: K0.skin,
        cardiganDark: K0.skinShade,
        cardiganLight: K0.skin,
        sockL: [K0.skin, K0.skinShade],
        sockR: [K0.skin, K0.skinShade],
      };
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

  // Greifen: die vordere Hand (armFar wird vorn gezeichnet) fährt exakt zum Ziel.
  // Das ist die Verbindung zwischen Hand und Instrument – kein Springen, weil
  // das Ziel selbst stetig wandert.
  if (handTarget) {
    // Ziel in den lokalen Raum umrechnen (Spiegelung beachten) und mit der
    // vorhandenen Zweigelenk-IK anvisieren. armIK kürzt zu weite Ziele auf die
    // feste Armlänge – der Arm kann sich dadurch nicht verlängern.
    const tx = (handTarget[0] - x) / (scale * face);
    const ty = (handTarget[1] - y) / scale;
    const sh: V = [-3.4, r.shoulderY + 2];
    const limb = armIK(sh, [tx, ty], -1);
    r.armFar = { elbow: limb.elbow, hand: [limb.hand[0], limb.hand[1]] };
  }
  if (handTarget2) {
    // Zweite Hand: ebenfalls echte Zweigelenk-IK mit fester Armlänge.
    const tx = (handTarget2[0] - x) / (scale * face);
    const ty = (handTarget2[1] - y) / scale;
    const sh: V = [3.4, r.shoulderY + 2];
    const limb = armIK(sh, [tx, ty], 1);
    r.armNear = { elbow: limb.elbow, hand: limb.hand };
  }

  // Saxophon: rechter Fuß (legNear, sockR) wippt im Takt, der Oberkörper
  // wiegt sich leicht nach vorn und hinten. Beides kommt von außen (Musikzeit).
  if (state === "sax") {
    // Feste Ersatzhaltung, nur wenn keine Griffposition vorgegeben ist –
    // sonst bestimmt handTarget2 die zweite Hand.
    if (!handTarget2) {
      const sh: V = [3.4, r.shoulderY + 2];
      const limb = armIK(sh, [2.2, -25.5], 1);
      r.armNear = { elbow: limb.elbow, hand: limb.hand };
    }
    if (footTap > 0.001) {
      const lift = 3.2 * footTap;
      r.legNear = {
        elbow: r.legNear.elbow,
        hand: [r.legNear.hand[0] - lift * 0.35, r.legNear.hand[1] - lift],
      };
      r.footNearAng = -0.5 * footTap;
    }
    if (Math.abs(sway) > 0.001) {
      r.rootX += sway * 0.6;
      r.rootRot += sway * 0.04;
      r.headTilt += sway * 0.07;
      r.hairFlow += sway * 0.35;
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
  // Normalerweise steht der Oberkörper gerade. Nur beim Vorbeugen kippen
  // Rumpf, Arme, Hals und Kopf gemeinsam um die Hüfte – die Längen bleiben.
  const bent = r.bend > 0.01;
  const upperLean = (fn: () => void) => {
    if (!bent) return fn();
    ctx.save();
    ctx.translate(0, r.hipY);
    ctx.rotate(r.bend);
    ctx.translate(0, -r.hipY);
    fn();
    ctx.restore();
  };

  /* --- Haare hinten (beim Vorbeugen hängen sie am Kopf, siehe dort) --- */
  if (r.bend < 0.7) upperLean(() => drawHairBack(ctx, r.hairFlow, r.hairUp, r.hairLen));

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
  const drawBackArm = () =>
    upperLean(() => {
      stroke3(ctx, [3.4, r.shoulderY + 2], armBehind.elbow, armBehind.hand, K.cardiganDark, 4.4);
      ctx.fillStyle = K.skinShade;
      ctx.beginPath();
      ctx.arc(armBehind.hand[0], armBehind.hand[1], 1.9, 0, Math.PI * 2);
      ctx.fill();
    });
  // Beim Tragen eines Instruments liegt der Arm vor dem Korpus, nicht dahinter.
  if (!back && !armsInFront) drawBackArm();

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

  const drawFrontArm = () =>
    upperLean(() => {
      stroke3(ctx, [-3.4, r.shoulderY + 2], armFront.elbow, armFront.hand, K.cardigan, 4.6);
      // Ärmelbündchen
      ctx.save();
      const ha = Math.atan2(armFront.hand[1] - armFront.elbow[1], armFront.hand[0] - armFront.elbow[0]);
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
    });

  if (P && outfit === "dressed" && !back) drawPajamaDetails(ctx, r, P.top, P.bottom);

  if (back) {
    /* --- Rückansicht: Arme seitlich, Oberkörper von hinten --- */
    const arms = backArms(state, r, phase);
    const drawArms = () => {
      for (const [side, arm] of [[-1, arms.far], [1, arms.near]] as const) {
        stroke3(ctx, [side * 6.2, r.shoulderY + 2.2], arm.elbow, arm.hand, side < 0 ? K.cardiganDark : K.cardigan, 4.5);
        ctx.fillStyle = side < 0 ? K.skinShade : K.skin;
        ctx.beginPath();
        ctx.arc(arm.hand[0], arm.hand[1], 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    // Hände vor dem Körper (Handtuch binden, in den Schrank greifen)
    // verschwinden hinter dem Rücken.
    if (arms.behind) drawArms();
    drawTorsoBack(ctx, r, outfit, K);
    if (!arms.behind) drawArms();
    // Die langen Haare liegen über Rücken und Schultern.
    drawHairBack(ctx, r.hairFlow, r.hairUp, r.hairLen * (wet > 0.3 ? 0.94 : 1), true);
  } else {
    /* --- Rumpf (an der vertikalen Achse gespiegelt) --- */
    upperLean(() => {
      ctx.save();
      ctx.scale(-1, 1);
      if (outfit === "dressed") drawTorso(ctx, r);
      else if (outfit === "towel") drawTowel(ctx, r);
      else {
        ctx.fillStyle = K.skin;
        rr(ctx, -6.4, r.shoulderY, 12.8, r.hipY - r.shoulderY + 2, 5);
        ctx.fill();
      }
      ctx.restore();
    });

    /* --- Instrument vor dem Rumpf, Arme davor --- */
    // Ohne diese Reihenfolge verdeckt der Saxophon-Korpus beide Arme, und das
    // Instrument hängt scheinbar frei in der Luft.
    betweenBodyAndArms?.();
    if (armsInFront) drawBackArm();

    /* --- vorderer Arm (früher der hintere) --- */
    // Beim Vorbeugen erst nach dem Kopf, damit die Bürstenhand vor den Haaren liegt.
    if (!bent) drawFrontArm();
  }

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

  if (r.bend >= 0.7) {
    // Vorgebeugt: Gesicht zeigt zum Boden. Haare bedecken den Hinterkopf und
    // hängen senkrecht herunter, bis knapp über den Boden.
    drawFace(ctx, expr, blink, t, glasses);
    ctx.fillStyle = LUNI_COLORS.hair;
    ctx.beginPath();
    ctx.arc(-1.4, HEAD_Y - 1.6, HEAD_R + 0.6, 0, Math.PI * 2);
    ctx.fill();
    const headWorldY = r.rootY + r.hipY + (HEAD_Y - r.hipY) * Math.cos(r.bend);
    const L = Math.max(8, -headWorldY - 1.6);
    const sway = Math.sin(t * 1.7) * 0.5;
    ctx.save();
    ctx.translate(0, HEAD_Y);
    ctx.rotate(-(r.bend + r.headTilt));
    const w = HEAD_R + 1;
    ctx.beginPath();
    ctx.moveTo(-w, -2);
    ctx.quadraticCurveTo(-w - 0.8, L * 0.5, -w + 1.6 + sway, L);
    ctx.quadraticCurveTo(-3, L + 1.4, 0 + sway, L + 0.6);
    ctx.quadraticCurveTo(3, L + 1.4, w - 1.6 + sway, L);
    ctx.quadraticCurveTo(w + 0.8, L * 0.5, w, -2);
    ctx.closePath();
    ctx.fill();
    // Strähnen
    ctx.strokeStyle = LUNI_COLORS.hairSheen;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.8;
    ctx.lineCap = "round";
    for (const dx of [-5.6, -2, 1.8, 5.4]) {
      ctx.beginPath();
      ctx.moveTo(dx, 1);
      ctx.quadraticCurveTo(dx + sway * 0.5, L * 0.55, dx * 0.82 + sway, L - 1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  } else if (back) {
    // Hinterkopf: nur Haare, kein Gesicht
    ctx.fillStyle = LUNI_COLORS.hair;
    ctx.beginPath();
    ctx.arc(0, HEAD_Y - 0.6, HEAD_R + 0.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    if (hairAside > 0.01) drawHairAside(ctx, hairAside);
    else drawHairFront(ctx, r.hairFlow, r.hairUp, r.hairLen);
    drawFace(ctx, expr, blink, t, glasses);
  }
  if (wet > 0.02 && r.bend < 0.7) {
    // nasser Glanz und Tropfen an den Haarspitzen
    ctx.save();
    ctx.globalAlpha = 0.55 * wet;
    ctx.strokeStyle = "#7d8fa8";
    ctx.lineWidth = 0.9;
    ctx.lineCap = "round";
    for (const dx of [-5.5, -1.5, 3]) {
      ctx.beginPath();
      ctx.moveTo(dx, HEAD_Y - 8);
      ctx.quadraticCurveTo(dx + 1.2, HEAD_Y - 3, dx + 0.4, HEAD_Y + 1);
      ctx.stroke();
    }
    ctx.fillStyle = "#a8d8ea";
    ctx.globalAlpha = 0.85 * wet;
    for (let i = 0; i < 3; i++) {
      const k = ((t * 1.3 + i * 0.37) % 1 + 1) % 1;
      const dx = [-10.5, 9.8, -8][i];
      ctx.beginPath();
      ctx.arc(dx, HEAD_Y + 12 + k * 9, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
  });

  if (bent && !back) drawFrontArm();

  ctx.restore();

  // Beide Handpositionen in Weltkoordinaten zurückgeben: damit hängen
  // Griff, Instrument und Arme zusammen (das Saxophon wird danach gezeichnet
  // und würde die Hände sonst verdecken).
  if (handOut) {
    handOut.front = [
      x + (r.rootX + r.armFar.hand[0]) * scale * face,
      y + (r.rootY + r.armFar.hand[1]) * scale,
    ];
    handOut.rear = [
      x + (r.rootX + r.armNear.hand[0]) * scale * face,
      y + (r.rootY + r.armNear.hand[1]) * scale,
    ];
  }

  // Gegenstände hängen an der räumlich vorderen Hand – also der Hand, die
  // beim Greifen, Klavierspielen oder Sitzen tatsächlich vor dem Körper ist.
  let propHand: V =
    r.prop === "near"
      ? r.armNear.hand
      : r.prop === "far"
        ? r.armFar.hand
        : r.armNear.hand[0] >= r.armFar.hand[0]
          ? r.armNear.hand
          : r.armFar.hand;
  if (bent) {
    const dx = propHand[0];
    const dy = propHand[1] - r.hipY;
    const cs = Math.cos(r.bend);
    const sn = Math.sin(r.bend);
    propHand = [dx * cs - dy * sn, r.hipY + dx * sn + dy * cs];
  }
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
