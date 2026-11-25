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
  cardigan: "#dcc9a5",
  cardiganDark: "#c4ad84",
  cardiganLight: "#eee3cc",
  /** Holzfäller-Karo auf der hellen Weste: leicht dunklere Linien */
  karo: "rgba(128,88,52,.30)",
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
  | "danceDisco"
  | "danceMoonwalk"
  | "danceGlide"
  | "danceStep"
  | "danceSlide"
  | "danceHeadnod"
  | "danceTap"
  | "danceArmUp"
  | "danceArmsUp"
  | "danceFortnite"
  | "danceSchritt"
  | "danceClap"
  | "danceRobot"
  | "danceWave"
  | "danceHeart"
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
  | "bow"
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
  | "labBend"
  | "labBrush"
  | "sleepBend"
  | "pet";

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
  | "talk"
  | "sing"
  | "focus"
  /** Gähnen: Augen zu, weit offener Mund. */
  | "yawn";

/** Ein Studiopinsel bemalt vorhandene Schnittteile. Gelenke und Zeichenreihenfolge bleiben bei Luni. */
export interface LuniZeichenpinsel {
  haar(c: C, teil: "fall" | "pony" | "seite" | "scheitel", laenge: number, fluss: number, seite: number): void;
  gewebe(c: C, teil: "shirt" | "shirtsaum" | "taillenbund" | "kragen" | "jacke" | "ruecken", oben: number, unten: number, seite: number): void;
  glied(c: C, a: V, gelenk: V, ende: V, breite: number, farbe: string, bein: boolean): void;
  socke(c: C, farben: string[]): void;
  knopf(c: C, x: number, y: number): void;
  bund(c: C, breite: number): void;
  hand(c: C, seite: number, spitzen: number[], geste: Geste, handruecken: boolean): void;
  hautton(c: C, y: number, r: number, haut: string, schatten: string): CanvasGradient;
  gesicht(c: C, expr: LuniExpr, blink: number, t: number, brille: boolean, blick: number, flau: number, gesang: number): void;
}

/** Die aktive Originalkontur ist die Maske, nicht ein nachgeschaetztes Rechteck. */
function imSchnitt(c: C, zeichnen: () => void) {
  c.save(); c.clip(); zeichnen(); c.restore();
}

export interface LuniOpts {
  /** Sekunden, treibt alle Eigenbewegungen */
  t?: number;
  /** Musiksekunden des Liedes (falls übergeben und Tanz): die Tanzposen
   *  richten sich rhythmisch an der Musik aus (120 BPM, 1 Takt = 0.5 s).
   *  Ohne Musikzeit laufen die Posen wie gehabt auf der globalen Uhr. */
  beatT?: number;
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
  /** Ellbogenrichtung der vorderen Hand (Standard -1; 1 knickt nach unten). */
  handElbow?: 1 | -1;
  /** Weltkoordinate für die zweite Hand (zweiter Griff am Instrument). */
  handTarget2?: [number, number] | null;
  /** Ellbogenrichtung der hinteren Hand (Standard 1). */
  handElbow2?: 1 | -1;
  /** Greifpunkt der rechten Hand beim Sitzen, im lokalen Koordinatensystem. */
  sitzgriff?: V | null;
  /** Die linke Hand kann unabhaengig davon das Handy halten. */
  sitzgriffLinks?: V | null;
  /** Kontaktpunkte bleiben trotz Atembewegung an derselben Weltposition. */
  handKontakt?: boolean;
  /** Hintere Hand sichtbar vor dem Rumpf, ohne die Schulter zu verlagern. */
  handVorRumpf?: boolean;
  /** Beide Arme vor dem Rumpf zeichnen (z. B. Tasse und Kanne beim Tee). */
  armeVorne?: boolean;
  rauchzeit?: number;
  /** Wird nach dem Zeichnen mit beiden Handpositionen in Weltkoordinaten gefüllt. */
  handOut?: { front: [number, number]; rear: [number, number] } | null;
  /** Wird zwischen Rumpf und Armen aufgerufen – dort hängt das Saxophon.
   *  So liegen Instrument und Oberkörper in derselben Tiefenebene. */
  betweenBodyAndArms?: (() => void) | null;
  /** Beide Arme werden NACH dem Rumpf (und nach betweenBodyAndArms) gezeichnet. */
  armsInFront?: boolean;
  /** Kleidung: angezogen, Handtuch oder (nur hinter dem Vorhang) ohne */
  outfit?: "dressed" | "towel" | "none";
  /** Beim Umziehen Oberteil und Hose getrennt zeigen, ohne Handtuch-Platzhalter. */
  kleidung?: { oberteil: boolean; hose: boolean; handtuch?: boolean };
  /** Beim Umziehen vor dem Schrank verdeckt der Rücken die davor greifenden Arme. */
  schrankRuecken?: boolean;
  /** Beide Augen und Schulterseiten zeigen beim Putzen zur Betrachterin. */
  zahnfrontal?: boolean;
  mundSchaum?: number;
  /** Nur bei der langen Abendpflege: Zeit für Längen, Spitzen und Seitensträhne. */
  buerstenzeit?: number;
  /** Länge des Bürstgangs und seine Saat (Hänger höchstens einmal je Gang). */
  buerstendauer?: number;
  buerstensaat?: number;
  /** Weicher Übergang von dieser Phase desselben Zustands (z. B. zwischen Duschbewegungen). */
  blendPhase?: number;
  /** Rücken zum Betrachter: Haare statt Gesicht */
  back?: boolean;
  /** 0..1: nasse Haare, Tropfen */
  wet?: number;
  /** Brille auf der Nase */
  glasses?: boolean;
  /** Pyjama (statt Alltagskleidung) */
  pajama?: { top: string; bottom: string; flausch?: boolean } | null;
  /** Weste aus dem Kleiderschrank über dem Schlafanzug. */
  weste?: boolean;
  /** Fließendes Überziehen der Weste (0 = noch nur Schlafanzug .. 1 = Weste ganz angezogen). */
  westeAnziehen?: number;
  /** 0..1: in der Seitenlage die Haare neben das Ohr legen */
  hairAside?: number;
  /** Nur Bett: 0 = sitzend, 1 = liegend; ohne Vorgabe unveränderte Liegepose. */
  lieDown?: number;
  /** Nur Bett: leichte Vorbeuge beim Greifen nach der Decke. */
  bedLean?: number;
  /** Sitzend recken und strecken: beide Arme hoch, Kopf leicht in den Nacken (0..1). */
  reck?: number;
  /** Nur Bett: Übergang vom Stehen zum Sitzen auf der Matratze. */
  bedSitzen?: number;
  /** Aufwachen im Bett: aufrichten 0..1 (Liegen -> Langsitz), beineSenken 0..1 (Matratze -> Bettkante). */
  bettAufstehen?: { aufrichten: number; beineSenken: number };
  /** Nur Bett: Arme und Beine liegen unter der Decke und werden nicht gezeichnet. */
  bedCover?: boolean;
  /** Reflektiertes Licht des aktuellen Videobilds, nur auf der Gesichtshaut. */
  displaylicht?: { rgb: string; staerke: number } | null;
  /** Nur Gesang (expr "sing"): Mundöffnung 0..1 aus der Gesangszeit. */
  singOpen?: number;
  /** Nur Musikzimmer: frontaler Hocker, 0 = stehen, 1 = sitzen. */
  pianoSeat?: number;
  /** Verneinende Kopfbewegung, ohne die laufende Koerperpose zu ersetzen. */
  headShake?: number;
  /** Blick im Figurenraum; die Spiegelung folgt weiterhin face. */
  gaze?: number;
  /** 0..1: Fortschritt einer Augenroll-Bewegung (genervter Blick); 0 = aus. */
  eyeRoll?: number;
  /** Edles Vampir-Outfit (Gruselhaus): Zierdetails über der Kleidung. */
  vampir?: VampirStil | null;
  /** 0..1: wie weit der Umhang umgelegt ist (1 = liegt auf den Schultern). */
  umhang?: number;
  /** Rückenansicht mit gezielt greifenden Händen (Sargdeckel, Umhang). */
  backReach?: boolean;
  /** Vor der neuen Pose zu zeigende alte Tanzpose (smoother Übergang). */
  blendFrom?: LuniState;
  /** 0..1: wie weit der Übergang zur neuen Pose schon geglättet ist. */
  blendK?: number;
  /** Studio-Editor: Verschiebung (Delta) je Gelenk nach dem Rig-Bau – Figurenraum. */
  edit?: Partial<Record<"head" | "handFar" | "handNear" | "elbowFar" | "elbowNear" | "footFar" | "footNear" | "kneeFar" | "kneeNear", [number, number]>>;
}

/** Vampir-Outfit: Farben und Zierdetails. Proportionen bleiben unverändert. */
export interface VampirStil {
  name: string;
  top: string;
  bottom: string;
  trim?: string;
  kragen?: string;
  kropfband?: { band: string; stein: string };
  spitze?: string;
  korsett?: { farbe: string; schnur: string };
  jabot?: string;
  glanz?: boolean;
  umhang?: { aussen: string; futter: string };
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
const MUND_X = 0.8;
const MUND_Y = 0.4 + 5.2;
const SITZ_NEIGUNG = 0.03;
export const SITZ_HUB = 9;
/** Ansatz am geschlossenen Mund der Sitzpose, noch ohne Sitzhub. */
export const SITZ_MUND: readonly [number, number] = [
  (MUND_X + 0.8) * Math.cos(SITZ_NEIGUNG) - (MUND_Y - 0.4) * Math.sin(SITZ_NEIGUNG),
  HEAD_Y + (MUND_X + 0.8) * Math.sin(SITZ_NEIGUNG) + (MUND_Y - 0.4) * Math.cos(SITZ_NEIGUNG),
];
/** Länge der Rückenhaare ab Kopfmitte – Spitze endet etwas unter den Schultern. */
import { tanzParamsFor } from "./tanz";
import { haarstrich } from "./haarstrich";
import { liveDelta } from "./editor-live";

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

function stroke3(ctx: C, a: V, b: V, c: V, color: string, w: number, pinsel?: LuniZeichenpinsel, bein = false) {
  if (pinsel) { pinsel.glied(ctx, a, b, c, w, color, bein); return; }
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
  /** Studio-Editor: seitlicher Kopfversatz (Figurenraum). */
  headX: number;
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
  /** Nur Gruselbad: zusätzlicher Nackenbogen, ohne Kopf oder Rumpf zu skalieren. */
  neckBend: number;
  spineCurve: number;
  /** Welche Hand Gegenstände hält */
  prop: "auto" | "near" | "far";
  /** Zeigt der Finger hoch: die höhere Hand streckt den Zeigefinger. */
  fingerUp: boolean;
  /** Halbe Schulterbreite, an der die Arme ansetzen. Tanzposen nutzen die
   *  äußere Schulterecke des Rumpfs statt der Brustmitte. */
  schulterX: number;
  /** Tanz: dieser Arm liegt hinter dem Rumpf (z. B. beim Floss). */
  armNearHinten: boolean;
  armFarHinten: boolean;
  /** Handhaltung je Arm. */
  handNear: Geste;
  handFar: Geste;
}

/** Handhaltung: offene Hand, Faust oder ausgestreckter Zeigefinger. */
type Geste = "offen" | "faust" | "zeig";

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

/** Schultergelenk der Alltagsposen (halbe Breite) und der Tanzposen – die Bewegung rechnet von hier. */
const SCHULTER_X = 3.4;
/**
 * Halbbreite des Ärmelansatzes der Alltagsposen: Der Ärmel beginnt an der
 * Schulter (4,4 vom Körpermittelpunkt), nicht schon am Kragen. Die Griff- und
 * Mundpositionen der Hände bleiben unverändert, sie rechnen weiter mit SCHULTER_X.
 */
const SCHULTER_ANSATZ = 4.4;
const TANZ_SCHULTER = 5.6;
const GRAD = Math.PI / 180;
const ZWEI_PI = Math.PI * 2;

/** Punkt `nach` so verschieben, dass er genau `len` von `von` entfernt liegt. */
function aufLaenge(von: V, nach: V, len: number): V {
  const dx = nach[0] - von[0];
  const dy = nach[1] - von[1];
  const d = Math.hypot(dx, dy) || 1;
  return [von[0] + (dx / d) * len, von[1] + (dy / d) * len];
}

/**
 * Arm aus zwei Gelenkwinkeln (Grad) – Ober- und Unterarm behalten immer ihre
 * feste Länge. 0 = hängt senkrecht, 90 = waagrecht nach außen, 180 = senkrecht
 * nach oben, über 180 (oder negativ) = zur Körpermitte hin.
 */
function armWinkel(side: 1 | -1, schulter: V, ober: number, unter: number): Limb {
  const a1 = ober * GRAD;
  const a2 = unter * GRAD;
  const ex = schulter[0] + side * Math.sin(a1) * UPPER_ARM;
  const ey = schulter[1] + Math.cos(a1) * UPPER_ARM;
  return {
    elbow: [ex, ey],
    hand: [ex + side * Math.sin(a2) * FORE_ARM, ey + Math.cos(a2) * FORE_ARM],
  };
}

/** Zwei Rig-Posen weich ineinander überblenden (smoothe Tanzwechsel). */
function mergeRig(a: Rig, b: Rig, k: number): Rig {
  const ln = (u: number, v: number) => lerp(u, v, k);
  const limb = (a: Limb, b: Limb): Limb => ({
    elbow: [ln(a.elbow[0], b.elbow[0]), ln(a.elbow[1], b.elbow[1])],
    hand: [ln(a.hand[0], b.hand[0]), ln(a.hand[1], b.hand[1])],
  });
  const pick = <T,>(x: T, y: T): T => (k < 0.5 ? x : y);
  const schulterX = ln(a.schulterX, b.schulterX);
  const shoulderY = ln(a.shoulderY, b.shoulderY);
  // Zwischen zwei Tanzposen bleiben Ober- und Unterarm gleich lang: die
  // überblendeten Richtungen werden wieder auf die festen Längen gebracht.
  const tanz = a.schulterX > SCHULTER_X + 0.5 && b.schulterX > SCHULTER_X + 0.5;
  const arm = (side: 1 | -1, x: Limb, y: Limb): Limb => {
    const l = limb(x, y);
    if (!tanz) return l;
    const sch: V = [side * schulterX, shoulderY + 2];
    const e = aufLaenge(sch, l.elbow, UPPER_ARM);
    const h = aufLaenge(e, [e[0] + l.hand[0] - l.elbow[0], e[1] + l.hand[1] - l.elbow[1]], FORE_ARM);
    return { elbow: e, hand: h };
  };
  return {
    schulterX,
    armNearHinten: pick(a.armNearHinten, b.armNearHinten),
    armFarHinten: pick(a.armFarHinten, b.armFarHinten),
    handNear: pick(a.handNear, b.handNear),
    handFar: pick(a.handFar, b.handFar),
    rootX: ln(a.rootX, b.rootX),
    rootY: ln(a.rootY, b.rootY),
    rootRot: ln(a.rootRot, b.rootRot),
    pivotY: ln(a.pivotY, b.pivotY),
    scaleX: ln(a.scaleX, b.scaleX),
    hipY: ln(a.hipY, b.hipY),
    shoulderY,
    headY: ln(a.headY, b.headY),
    headTilt: ln(a.headTilt, b.headTilt),
    headX: ln(a.headX, b.headX),
    armFar: arm(-1, a.armFar, b.armFar),
    armNear: arm(1, a.armNear, b.armNear),
    legFar: limb(a.legFar, b.legFar),
    legNear: limb(a.legNear, b.legNear),
    hairFlow: ln(a.hairFlow, b.hairFlow),
    hairUp: pick(a.hairUp, b.hairUp),
    hairLen: ln(a.hairLen, b.hairLen),
    footFarAng: ln(a.footFarAng, b.footFarAng),
    footNearAng: ln(a.footNearAng, b.footNearAng),
    footFarDir: pick(a.footFarDir, b.footFarDir),
    footNearDir: pick(a.footNearDir, b.footNearDir),
    footDrop: ln(a.footDrop, b.footDrop),
    bend: ln(a.bend, b.bend),
    neckBend: ln(a.neckBend, b.neckBend),
    spineCurve: ln(a.spineCurve, b.spineCurve),
    prop: pick(a.prop, b.prop),
    fingerUp: pick(a.fingerUp, b.fingerUp),
  };
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
    headX: 0,
    // Arme hängen nah am Körper und kaum gespreizt (früher Ellbogen ±6, Hand ±7,5).
    armFar: { elbow: [-5.8, -29], hand: [-7, -22] },
    armNear: { elbow: [5.8, -29], hand: [7, -22] },
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
    neckBend: 0,
    spineCurve: 0,
    prop: "auto",
    fingerUp: false,
    schulterX: SCHULTER_X,
    armNearHinten: false,
    armFarHinten: false,
    handNear: "offen",
    handFar: "offen",
  };
}

/** Beine nutzen dieselbe Limb-Struktur: elbow = Knie, hand = Fuß. */
function leg(knee: V, foot: V): Limb {
  return { elbow: knee, hand: foot };
}

/* Gang: Länge von Ober- und Unterschenkel (Bühneneinheiten). */
const GANG_OBERSCHENKEL = 9.1;
const GANG_UNTERSCHENKEL = 10.1;

/**
 * Knie im Gang. Das Knie zeigt immer nach vorn (+x), wie bei einem echten Bein; der Fuß
 * bleibt auf seiner Bahn. Lässt sich der Fuß mit den Längen nicht erreichen, wird das Bein
 * gerade gestreckt und beide Teile werden im gleichen Maß länger.
 */
function gangKnie(huefte: V, fuss: V): V {
  const dx = fuss[0] - huefte[0];
  const dy = fuss[1] - huefte[1];
  const d = Math.hypot(dx, dy);
  const ux = dx / d;
  const uy = dy / d;
  const l1 = GANG_OBERSCHENKEL;
  const l2 = GANG_UNTERSCHENKEL;
  if (d >= l1 + l2) {
    const k = d / (l1 + l2);
    return [huefte[0] + ux * l1 * k, huefte[1] + uy * l1 * k];
  }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // Senkrechte zur Verbindung von Hüfte und Fuß, die nach vorn (+x) zeigt.
  let px = -uy;
  let py = ux;
  if (px < 0) {
    px = -px;
    py = -py;
  }
  return [huefte[0] + ux * a + px * h, huefte[1] + uy * a + py * h];
}

/**
 * Knie mit wählbarer Seite: q = 1 knickt nach vorn (+x) wie gangKnie, q = -1 zur
 * anderen Seite; Werte dazwischen blenden weich über (für das Hüftpendeln).
 */
function knieSeite(huefte: V, fuss: V, q: number): V {
  const dx = fuss[0] - huefte[0];
  const dy = fuss[1] - huefte[1];
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const l1 = GANG_OBERSCHENKEL;
  const l2 = GANG_UNTERSCHENKEL;
  if (d >= l1 + l2) {
    const k = d / (l1 + l2);
    return [huefte[0] + ux * l1 * k, huefte[1] + uy * l1 * k];
  }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let px = -uy;
  let py = ux;
  if (px < 0) {
    px = -px;
    py = -py;
  }
  const k = Math.max(-1, Math.min(1, q));
  return [huefte[0] + ux * a + px * h * k, huefte[1] + uy * a + py * h * k];
}

function buildRig(state: LuniState, t: number, walkP: number, phase: number, reach: number, beatT?: number, buerstenzeit?: number,
  buerstendauer?: number, buerstensaat?: number): Rig {
  const r = baseRig();
  const breathe = Math.sin(t * 2) * 0.45;
  // Tanz-Uhr: Musikzeit, falls übergeben (dann läuft der Tanz im Takt zur
  // Musik), sonst die globale Stoppuhr – wie gehabt.
  const bt = beatT ?? t;
  /** Schläge seit Liedbeginn (120 BPM: zwei Schläge je Sekunde). */
  const takt = bt * 2;
  /** Phase 0..1 innerhalb von `n` Schlägen. */
  const taktPhase = (n: number) => {
    const q = takt / n;
    return q - Math.floor(q);
  };
  /** Beide Arme über Gelenkwinkel setzen – sie sitzen außen an der Schulter. */
  const tanzArme = (nahOber: number, nahUnter: number, fernOber: number, fernUnter: number) => {
    r.schulterX = TANZ_SCHULTER;
    const sy = r.shoulderY + 2;
    r.armNear = armWinkel(1, [TANZ_SCHULTER, sy], nahOber, nahUnter);
    r.armFar = armWinkel(-1, [-TANZ_SCHULTER, sy], fernOber, fernUnter);
  };
  /** Beide Füße stehen fest am Boden (Weltposition), auch wenn die Hüfte pendelt. */
  const stand = (nahX = 4.6, fernX = -4.6, knie = 1) => {
    const nf: V = [nahX - r.rootX, -r.rootY];
    const ff: V = [fernX - r.rootX, -r.rootY];
    r.legNear = leg(knieSeite([2.6, r.hipY], nf, knie), nf);
    r.legFar = leg(knieSeite([-2.6, r.hipY], ff, knie), ff);
  };

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
      // Knie zeigen immer nach vorn (gangKnie); die Füße folgen ihrer Bahn wie bisher.
      r.legNear = leg(gangKnie([2.6, r.hipY], [sw * 10, -lift]), [sw * 10, -lift]);
      r.legFar = leg(gangKnie([-2.6, r.hipY], [swF * 10, -liftF]), [swF * 10, -liftF]);
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
    case "brush":
    case "labBend":
    case "labBrush": {
      // Tief nach vorn beugen; die Proportionen bleiben, nur die Hüfte knickt.
      const lab = state === "labBend" || state === "labBrush";
      const b = state === "brush" || state === "labBrush" ? 1 : ease(phase);
      const th = (lab ? 1.36 : 1.62) * b;
      r.bend = th;
      if (lab) {
        r.neckBend = .52 * b;
        r.spineCurve = b;
      }
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
      if (state === "brush" || state === "labBrush") {
        // Bürste an den herabhängenden Haaren entlang, Strich nach unten,
        // dann leicht abgehoben zurück zum Ansatz.
        const k = (t * 0.95) % 1;
        const down = k < 0.72;
        const top = lab ? 1 : 3;
        const tip = lab ? 8 : 13;
        const zug = !lab && buerstenzeit !== undefined ? haarstrich(buerstenzeit, buerstendauer, buerstensaat) : null;
        const sPos = zug?.laengs ?? (down ? lerp(top, tip, ease(k / 0.72)) : lerp(tip, top, ease((k - 0.72) / 0.28)));
        const off = zug?.quer ?? (lab ? (down ? 3.5 : 5) : (down ? 7.5 : 10.5));
        const neckX = lab ? (SHOULDER_Y - HEAD_Y) * Math.sin(r.neckBend) : 0;
        const neckY = lab ? SHOULDER_Y + (HEAD_Y - SHOULDER_Y) * Math.cos(r.neckBend) : HEAD_Y;
        const hand: V = [neckX + D[0] * sPos + P[0] * off, neckY + D[1] * sPos + P[1] * off];
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
      // Duschbewegungen (Codes aus duschprogramm.ts). Ganzzahliger Teil = Bewegung,
      // Nachkommaanteil = Fortschritt im Baustein. Jede Bewegung macht genau drei
      // Striche; dann folgt eine andere Bewegung (nie mehr als 3–4 Wiederholungen).
      const code = Math.floor(phase);
      const p = clamp01(phase - code);
      const w = Math.sin(p * Math.PI * 2 * 3);      // drei Striche
      const w2 = Math.cos(p * Math.PI * 2 * 3);
      const auf = (a: number, b: number) => { const k = clamp01((p - a) / (b - a)); return k * k * (3 - 2 * k); };
      // Hin- und Rückweg eines Griffs (0 → 1 → 0), Mitte bei p = .5
      const griff = p < 0.5 ? auf(0.05, 0.45) : 1 - auf(0.55, 0.95);
      r.rootY = breathe * 0.4;
      r.legFar = leg([-3.4, -10], [-4, 0]);
      r.legNear = leg([3.4, -10], [4, 0]);
      const ruhe = (): void => {
        r.armNear = { elbow: [7.5, -27], hand: [9, -22 + breathe * 0.4] };
        r.armFar = { elbow: [-7.5, -27], hand: [-9, -22 + breathe * 0.4] };
      };
      if (code === 0) {
        // Haare oben einschäumen: beide Hände kreisen auf dem Scheitel.
        r.headTilt = 0.1;
        r.armNear = { elbow: [9, -48], hand: [3 + w * 2.4, -57 + w2 * 1.2] };
        r.armFar = { elbow: [-9, -48], hand: [-3 - w * 2.4, -57 - w2 * 1.2] };
        r.hairFlow = w * 0.6;
      } else if (code === 19) {
        // Haare hinten: Ellbogen hoch, die Finger arbeiten am Hinterkopf.
        r.headTilt = 0.22;
        r.armNear = { elbow: [8, -51], hand: [-3.5 + w * 1.6, -53 + w2 * 1.4] };
        r.armFar = { elbow: [-7, -51], hand: [-5.5 - w * 1.6, -52 - w2 * 1.4] };
        r.hairFlow = -0.2 + w * 0.3;
      } else if (code === 20) {
        // Haare seitlich: beide Hände an den Schläfen, abwechselnd auf und ab.
        r.headTilt = 0.04;
        r.armNear = { elbow: [10, -45], hand: [6.5, -54 + w * 2] };
        r.armFar = { elbow: [-9, -45], hand: [-5.5, -54 - w * 2] };
        r.hairFlow = w * 0.4;
      } else if (code === 1) {
        // Körper einseifen: kreisende Hände auf Bauch und Brust.
        r.armNear = { elbow: [7, -28], hand: [2 + w * 3, -27 + w2 * 3] };
        r.armFar = { elbow: [-6, -26], hand: [-1 - w2 * 2.6, -22 + w * 2.4] };
      } else if (code === 2) {
        // Haare ausspülen: Kopf zurück, die Hände streichen den Schaum heraus.
        r.headTilt = -0.24;
        r.armNear = { elbow: [9, -46], hand: [5 + w * 1.6, -55 + w2] };
        r.armFar = { elbow: [-9, -46], hand: [-5 - w * 1.6, -55 - w2] };
        r.hairFlow = -0.5;
      } else if (code === 3) {
        // Vorgebeugt die Unterschenkel: vorher einen kleinen Schritt zurück,
        // damit der Kopf in der Dusche bleibt und nicht am Vorhang herausschaut.
        const b = 0.5 * auf(0, 0.18) * (1 - auf(0.86, 1));
        r.bend = b;
        r.rootX = -7 * auf(0, 0.14) * (1 - auf(0.9, 1));
        const D: V = [Math.sin(b), Math.cos(b)];
        const reiben = w * 1.8;
        r.armNear = armIK([3.4, -34], [3.4 + D[0] * (16 + reiben), -34 + D[1] * (16 + reiben)], 1);
        r.armFar = armIK([-3.4, -34], [-1 + D[0] * (16 - reiben), -34 + D[1] * (16 - reiben)], -1);
        r.hairFlow = 0.3;
      } else if (code === 13 || code === 18) {
        // Knie anheben und das Bein einseifen; der Oberkörper neigt sich nur wenig.
        const hub = auf(0, 0.18) * (1 - auf(0.84, 1));
        r.bend = 0.18 * hub;
        if (code === 13) r.legNear = leg([3.4 + 4 * hub, -10 - 6 * hub], [4 + 2 * hub, -7 * hub]);
        else r.legFar = leg([-3.4 + 7 * hub, -10 - 6 * hub], [-4 + 5 * hub, -7 * hub]);
        const kx = code === 13 ? 7 : 4.5;
        const ky = -13 - 4 * hub;
        r.armNear = { elbow: [8, -24], hand: [kx + 1 + w * 1.4, ky + w2 * 2.4] };
        r.armFar = { elbow: [-2, -24], hand: [kx - 1.5 - w * 1.4, ky - 1 - w2 * 2.4] };
        r.hairFlow = 0.2;
      } else if (code === 4 || code === 5) {
        // Einen Arm nach vorn gestreckt einseifen, die andere Hand reibt an ihm entlang.
        const lang = { elbow: [8.5, -30] as V, hand: [15, -27] as V };
        const k = 0.5 + 0.5 * w;
        const reibend = { elbow: [2.5, -26] as V, hand: [7 + 6.5 * k, -29.5 + 1.8 * k + w2 * 0.4] as V };
        if (code === 4) { r.armFar = lang; r.armNear = reibend; } else { r.armNear = lang; r.armFar = { elbow: [0, -25], hand: [6.5 + 6.5 * k, -29 + 1.8 * k] }; }
        r.headTilt = 0.12;
      } else if (code === 16 || code === 17) {
        // Einen Arm hochgestreckt einseifen: die andere Hand fährt von der Hand bis zur Achsel.
        const hoch = { elbow: [5, -49] as V, hand: [6, -62] as V };
        const k = 0.5 + 0.5 * w;
        const reibend = { elbow: [8, -38] as V, hand: [5.5 + 0.5 * k, -46 - 13 * k] as V };
        if (code === 16) { r.armFar = hoch; r.armNear = reibend; } else { r.armNear = hoch; r.armFar = { elbow: [2, -38], hand: [5 + 0.5 * k, -45 - 13 * k] }; }
        r.headTilt = -0.1;
      } else if (code === 6) {
        // Kopf in den Nacken, das Wasser läuft übers Gesicht.
        r.headTilt = -0.42;
        r.hairFlow = -0.75;
        ruhe();
      } else if (code === 7) {
        // Wasser aus dem Gesicht wischen: von der Stirn bis zum Kinn, dreimal.
        const k = (p * 3) % 1;
        const ab = k < 0.62 ? k / 0.62 : 1 - (k - 0.62) / 0.38;
        const weg = k < 0.62 ? 0 : Math.sin(Math.PI * (k - 0.62) / 0.38) * 2.2;
        const y = -55 + 13 * ab * ab * (3 - 2 * ab);
        r.headTilt = -0.1;
        r.armNear = { elbow: [10, -40], hand: [6.5 + weg, y] };
        r.armFar = { elbow: [-2, -40], hand: [4.5 + weg, y + 0.6] };
      } else if (code === 8) {
        // Haare nach hinten streifen: von der Stirn über den Kopf bis in den Nacken, dreimal.
        const k = (p * 3) % 1;
        const vor = k < 0.68 ? k / 0.68 : 1 - (k - 0.68) / 0.32;
        const e = vor * vor * (3 - 2 * vor);
        const ueber = k < 0.68 ? 0 : Math.sin(Math.PI * (k - 0.68) / 0.32) * 2.5;
        r.headTilt = -0.24;
        r.hairFlow = -0.4 - 0.4 * e;
        r.armNear = { elbow: [9, -50], hand: [5.5 - 11.5 * e, -56 - 2.5 * Math.sin(Math.PI * e) - ueber] };
        r.armFar = { elbow: [-6, -50], hand: [3.5 - 10.5 * e, -55 - 2.5 * Math.sin(Math.PI * e) - ueber] };
      } else if (code === 15) {
        // Arme hoch unter dem Strahl, das Wasser läuft über die Arme.
        r.headTilt = -0.2;
        r.hairFlow = -0.45;
        r.armNear = { elbow: [8, -52], hand: [4 + w * 1.2, -65 + w2 * 0.6] };
        r.armFar = { elbow: [-6, -52], hand: [-2 - w * 1.2, -65 - w2 * 0.6] };
      } else if (code === 10 || code === 12) {
        // Flasche von der Ablage neben der Dusche holen bzw. zurückstellen:
        // einen kleinen Schritt zur Ablage, Arm am Vorhang vorbei nach außen.
        r.rootX = 9 * griff;
        const ziel: V = [21, -51];
        const nah: V = [8, -34];
        const h: V = [lerp(nah[0], ziel[0], griff), lerp(nah[1], ziel[1], griff)];
        r.armFar = { elbow: [lerp(3, 12, griff), lerp(-30, -44, griff)], hand: h };
        r.armNear = { elbow: [7.5, -27], hand: [9, -23] };
        r.headTilt = 0.08 - 0.1 * griff;
      } else if (code === 11) {
        // Shampoo bzw. Duschgel auf die Hand geben: Flasche schräg über der hohlen Hand.
        const druck = Math.max(0, w) * 0.8;
        r.armFar = { elbow: [3, -36], hand: [9, -37 - druck] };
        r.armNear = { elbow: [8, -26], hand: [9.5, -31] };
        r.headTilt = 0.22;
      } else if (code === 14) {
        // Wasserhahn: die vordere Hand greift nach hinten zur Armatur und dreht.
        r.rootX = -3 * griff;
        r.armNear = { elbow: [lerp(7.5, 1, griff), lerp(-27, -40, griff)], hand: [lerp(9, -10, griff), lerp(-22, -47, griff) + (p > 0.4 && p < 0.6 ? w * 0.4 : 0)] };
        r.armFar = { elbow: [-7.5, -27], hand: [-9, -22] };
        r.headTilt = 0.05;
      } else {
        // Körper abspülen: die Hände streichen abwechselnd von den Schultern zur Hüfte.
        const a = (p * 3) % 1, b2 = (p * 3 + 0.5) % 1;
        r.headTilt = 0.14;
        r.armNear = { elbow: [8, -27], hand: [6.5, -31 + 13 * a] };
        r.armFar = { elbow: [-6, -26], hand: [3.5, -31 + 13 * b2] };
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
      r.rootY = SITZ_HUB;
      r.hipY = HIP_Y;
      r.armNear = { elbow: [7, -28], hand: [9, -21] };
      r.armFar = { elbow: [-6, -28], hand: [-7, -21] };
      r.legFar = leg([8, -19], [10, -9.5]);
      r.legNear = leg([9.5, -19], [12, -9.5]);
      r.headTilt = SITZ_NEIGUNG;
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

    case "bow": {
      // Dankende Verbeugung zum Spieler (von vorn). Schultern und Kopf sinken um
      // GENAU denselben Betrag, so bleibt der Kopf auf dem Hals. Die Arme hängen an
      // den Schultern; Ober- und Unterarm behalten ihre Längen (aufLaenge).
      // `phase` 0 = aufrecht, 0.5 = tiefster Punkt, 1 = wieder aufrecht.
      const k = Math.sin(phase * Math.PI);
      const tief = ease(k);
      const D = 8 * tief; // Absenkung von Schultern und Kopf (gleich viel)
      r.rootY = 2.4 * tief; // die Knie geben nach
      r.hipY = HIP_Y + 0.9 * tief;
      r.shoulderY = SHOULDER_Y + D;
      r.headY = HEAD_Y + D;
      r.neckBend = 0.14 * tief;
      r.headTilt = 0.06 + 0.16 * tief;
      r.hairFlow = -1.2 * tief;
      const sy = r.shoulderY + 2;
      const nahS: V = [r.schulterX, sy];
      const fernS: V = [-r.schulterX, sy];
      // Ziele: hängend an der Seite (phase 0) bzw. vor der Brust gefaltet (phase 0.5)
      const nahE = aufLaenge(nahS, [lerp(6.4, nahS[0] + 3, tief), lerp(-29, sy + 9, tief)], UPPER_ARM);
      const nahH = aufLaenge(nahE, [lerp(7.6, 1.4, tief), lerp(-21.5, sy + 12, tief)], FORE_ARM);
      const fernE = aufLaenge(fernS, [lerp(-6.4, fernS[0] - 3, tief), lerp(-29, sy + 9, tief)], UPPER_ARM);
      const fernH = aufLaenge(fernE, [lerp(-7.6, -1.4, tief), lerp(-21.5, sy + 12, tief)], FORE_ARM);
      r.armNear = { elbow: nahE, hand: nahH };
      r.armFar = { elbow: fernE, hand: fernH };
      // Füße bleiben am Boden, Knie leicht gebeugt
      r.legNear = leg(gangKnie([2.6, r.hipY], [4.4, -r.rootY]), [4.4, -r.rootY]);
      r.legFar = leg(gangKnie([-2.6, r.hipY], [-4.4, -r.rootY]), [-4.4, -r.rootY]);
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
      // SITZEND am Beistelltisch: die linke Hand ruht auf dem Schoß, die rechte
      // greift mit natürlicher Ellbogenbeuge nach vorn zum Aschenbecher.
      const p = phase * phase * (3 - 2 * phase);
      r.rootY = 9;
      r.hipY = HIP_Y;
      r.headTilt = 0.05 + p * 0.16;
      r.armNear = { elbow: [6.5, -28], hand: [8.5, -21] };
      r.armFar = armIK(
        [-3.4, r.shoulderY + 2],
        [lerp(-6, 15, p), lerp(-21, -30, p)],
        1,
      );
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

    case "pet": {
      // Sanft in die Hocke gehen und Odin oder Apollo über den Kopf streicheln.
      // `phase` 0..1 blendet weich zwischen Stehen und Hocken; Füße bleiben am Boden.
      const p = ease(clamp01(phase));
      const strich = Math.sin(t * 4.6) * p;
      const senk = 10.5 * p;
      r.rootY = senk;
      r.headTilt = 0.24 * p;
      r.armNear = { elbow: [lerp(6.4, 5.2, p), -29], hand: [lerp(7.6, 6.2, p), -21] };
      r.armFar = armIK(
        [-3.4, r.shoulderY + 2],
        [lerp(-7.2, 12.4 + strich * 1.5, p), lerp(-21.5, -40.8 + Math.abs(strich) * 0.5, p)],
        1,
      );
      r.legFar = leg([lerp(-3.6, 5.5, p), lerp(-10, -16.5, p)], [lerp(-4.2, -1.5, p), -senk]);
      r.legNear = leg([lerp(3.6, 7.6, p), lerp(-10, -16.2, p)], [lerp(4.2, 2.2, p), -senk]);
      r.hairFlow = 0.35 * p;
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
    // Alle Tanzposen setzen die Arme über Gelenkwinkel (tanzArme): Ober- und
    // Unterarm behalten ihre Länge und sitzen außen an der Schulter. Wer auf
    // der Stelle tanzt, steht mit festen Füßen (stand) – nur die Hüfte pendelt.

    case "danceSway": {
      // Wiegen: das Gewicht pendelt von Bein zu Bein, die Füße bleiben stehen.
      // Die Hände schwingen locker vor der Brust mit.
      const cfg = tanzParamsFor("danceSway");
      const s = Math.sin(Math.PI * takt);
      const c = Math.cos(Math.PI * takt);
      r.rootX = s * 2.2 * cfg.sway;
      r.rootY = 0.4 + s * s * 1.0 * cfg.bounce;
      r.headTilt = s * 0.1 * cfg.nod;
      r.hairFlow = -s * 2.0;
      const schwung = (11 * s + 4 * c) * cfg.armUp;
      tanzArme(22 - 4 * s, 236 + schwung, 22 + 4 * s, 236 - schwung);
      stand();
      break;
    }

    case "danceTwist": {
      // Twist: die Füße bleiben am Boden, Hüfte und Knie schwingen gemeinsam
      // zur Seite, die angewinkelten Arme gehen mit Fäusten dagegen.
      const cfg = tanzParamsFor("danceTwist");
      const s = Math.sin(Math.PI * takt);
      r.rootX = s * 2.2 * cfg.sway;
      r.rootY = 0.3 + s * s * 1.6 * cfg.bounce;
      r.headTilt = -s * 0.08 * cfg.nod;
      r.hairFlow = -s * 2.2;
      const dreh = s * cfg.armUp;
      tanzArme(30 - 9 * dreh, 292 - 24 * dreh, 30 + 9 * dreh, 292 + 24 * dreh);
      r.handNear = "faust";
      r.handFar = "faust";
      stand(4.6, -4.6, s * 2.5);
      break;
    }

    case "danceDisco": {
      // Saturday Night Fever: ein Arm zeigt schräg nach oben, die andere Hand
      // stützt sich in die Hüfte. Drei Schläge halten, auf dem vierten wechseln.
      const cfg = tanzParamsFor("danceDisco");
      const ab = 0.5 + 0.5 * Math.cos(ZWEI_PI * taktPhase(1));
      const p8 = taktPhase(8) * 8;
      const k = p8 < 3 ? 0 : p8 < 4 ? ease(p8 - 3) : p8 < 7 ? 1 : 1 - ease(p8 - 7);
      r.rootX = (1 - 2 * k) * 1.3 * cfg.sway;
      r.rootY = 0.4 + ab * 1.3 * cfg.bounce;
      r.headTilt = ((2 * k - 1) * 0.07 - ab * 0.04) * cfg.nod;
      r.hairFlow = (1 - 2 * k) * 1.4;
      const hochO = 150 - ab * 5 * cfg.armUp;
      const hochU = 166 - ab * 7 * cfg.armUp;
      // Der Arm senkt sich in einem weiten Bogen nach außen bis in die Hüfte.
      tanzArme(lerp(40, hochO, k), lerp(-28, hochU, k), lerp(hochO, 40, k), lerp(hochU, -28, k));
      r.handNear = k > 0.6 ? "zeig" : "offen";
      r.handFar = k < 0.4 ? "zeig" : "offen";
      stand();
      break;
    }

    case "danceMoonwalk": {
      // Moonwalk: jeder Fuß bleibt auf seiner Seite – die Socken wechseln nie.
      // Ein Fuß steht auf der Zehe fest am Boden, während der andere flach und
      // weich nach hinten gleitet; dann wechseln sie. Ein Zyklus = 2 Schläge.
      const cfg = tanzParamsFor("danceMoonwalk");
      const c = taktPhase(2);
      const nahStuetzt = c < 0.5;
      const h = nahStuetzt ? c * 2 : (c - 0.5) * 2;
      const W = 2.8 * Math.min(1.2, cfg.legs);
      // Stützfuß: gleichmäßig nach vorn (= steht am Boden, der Körper zieht weg).
      const vor = lerp(-W, W, h);
      // Gleitfuß: weich anfahren, weich ankommen.
      const zurueck = lerp(W, -W, ease(h));
      // Ferse hebt weich ab und setzt weich wieder auf.
      const heb = ease(Math.min(1, h / 0.25, (1 - h) / 0.25)) * 0.5;
      const nx = 4.6 + (nahStuetzt ? vor : zurueck);
      const fx = -4.6 + (nahStuetzt ? zurueck : vor);
      const nAng = nahStuetzt ? heb : 0;
      const fAng = nahStuetzt ? 0 : heb;
      const weite = (nx - fx - 2 * (4.6 - W)) / (4 * W);
      r.rootY = 0.8 + weite * weite * 0.7;
      // Die Zehenspitze bleibt am Boden, wenn die Ferse hochkommt.
      const nf: V = [nx + 5.2 * (1 - Math.cos(nAng)), -5.2 * Math.sin(nAng) - r.rootY];
      const ff: V = [fx + 5.2 * (1 - Math.cos(fAng)), -5.2 * Math.sin(fAng) - r.rootY];
      r.legNear = leg(gangKnie([2.6, r.hipY], nf), nf);
      r.legFar = leg(gangKnie([-2.6, r.hipY], ff), ff);
      r.footNearAng = nAng;
      r.footFarAng = fAng;
      // Arme hängen locker und pendeln ruhig mit.
      const sw = Math.sin(ZWEI_PI * c) * cfg.armUp;
      tanzArme(9 + 4 * sw, -5 + 7 * sw, 9 - 4 * sw, -5 - 7 * sw);
      r.headTilt = (0.1 + Math.sin(ZWEI_PI * c) * 0.02) * cfg.nod;
      r.hairFlow = 1.1 * cfg.sway;
      break;
    }

    case "danceStep": {
      // Step-Touch über 4 Schläge: Gewicht nach rechts, der linke Fuß tippt
      // daneben auf – dann Gewicht nach links und der rechte Fuß tippt auf.
      const cfg = tanzParamsFor("danceStep");
      const p = taktPhase(4) * 4;
      const rechts = p < 2;
      const q = rechts ? p : p - 2;
      // Gewicht wandert in der ersten halben Zählzeit auf das Standbein.
      const verl = ease(Math.min(1, q / 0.5));
      const gewicht = (rechts ? 1 : -1) * (2 * verl - 1);
      const ab = 0.5 + 0.5 * Math.cos(ZWEI_PI * taktPhase(1));
      r.rootX = gewicht * 2.4 * cfg.sway;
      r.rootY = 0.8 + ab * 0.8 * cfg.bounce;
      r.headTilt = gewicht * 0.06 * cfg.nod;
      r.hairFlow = -gewicht * 1.6;
      // Spielbein: heran (0.5–1), auf der Zehe tippen (1–1.5), zurück (1.5–2).
      const heran = q < 0.5 ? 0 : q < 1 ? ease((q - 0.5) / 0.5) : q < 1.5 ? 1 : 1 - ease((q - 1.5) / 0.5);
      const flug = q > 0.5 && q < 1 ? Math.sin(((q - 0.5) / 0.5) * Math.PI) : q > 1.5 ? Math.sin(((q - 1.5) / 0.5) * Math.PI) : 0;
      const tipp = q >= 1 && q <= 1.5 ? 0.38 * Math.sin(((q - 1) / 0.5) * Math.PI * 0.5 + Math.PI * 0.25) : 0;
      const hub = flug * 1.8 * Math.min(1.3, cfg.legs);
      const nahFrei = !rechts;
      // Der freie Fuß setzt dicht neben dem Standfuß auf, ohne ihn zu überdecken.
      const nx = nahFrei ? lerp(5.6, 2.2, heran) : 5.6;
      const fx = nahFrei ? -5.6 : lerp(-5.6, -2.2, heran);
      const nAng = nahFrei ? tipp : 0;
      const fAng = nahFrei ? 0 : tipp;
      const nf: V = [nx - r.rootX, -(nahFrei ? hub : 0) - 5.2 * Math.sin(nAng) - r.rootY];
      const ff: V = [fx - r.rootX, -(nahFrei ? 0 : hub) - 5.2 * Math.sin(fAng) - r.rootY];
      r.legNear = leg(gangKnie([2.6, r.hipY], nf), nf);
      r.legFar = leg(gangKnie([-2.6, r.hipY], ff), ff);
      r.footNearAng = nAng;
      r.footFarAng = fAng;
      const g = gewicht * cfg.armUp;
      tanzArme(14 - 5 * g, -4 - 9 * g, 14 + 5 * g, -4 + 9 * g);
      break;
    }

    case "danceGlide": {
      // Wippende, langsame Tanzschritte mit locker angewinkelten Armen.
      const cfg = tanzParamsFor("danceGlide");
      const wippe = Math.sin(taktPhase(1) * Math.PI);
      const seite = Math.sin(Math.PI * takt * 0.25);
      r.rootX = seite * 1.8 * cfg.sway;
      r.rootY = 0.6 + wippe * 1.5 * cfg.bounce;
      r.headTilt = (seite * 0.1 + wippe * 0.04) * cfg.nod;
      const vorn: V = [4.6 + wippe * 1.4, -r.rootY];
      const hinten: V = [-4.6 - wippe * 1.2, -r.rootY];
      r.legNear = leg(gangKnie([2.6, r.hipY], vorn), vorn);
      r.legFar = leg(gangKnie([-2.6, r.hipY], hinten), hinten);
      const bob = Math.sin(ZWEI_PI * taktPhase(1)) * cfg.armUp;
      tanzArme(20 + seite * 3, -20 + bob * 6, 20 - seite * 3, -20 - bob * 6);
      r.hairFlow = -seite * 1.6;
      break;
    }

    case "danceSlide": {
      // Torjubel: nach kurzem Anlauf rutscht sie AUF BEIDEN KNIEN ins
      // Wohnzimmer – Knie auf dem Boden, Unterschenkel schleifen hinten,
      // Oberkörper aufrecht und leicht zurückgelehnt, beide Arme im weiten V
      // nach oben, die Fäuste pumpen im Takt.
      const cfg = tanzParamsFor("danceSlide");
      const pump = Math.sin(ZWEI_PI * taktPhase(1)) * cfg.bounce;
      const fedder = Math.sin(ZWEI_PI * taktPhase(0.5)) * 0.35 * cfg.bounce;
      r.rootY = 8 + fedder;
      r.rootRot = -0.12;
      r.pivotY = r.hipY;
      r.headTilt = (-0.1 + pump * 0.03) * cfg.nod;
      const a = pump * cfg.armUp;
      tanzArme(128 + a * 5, 152 + a * 9, 124 - a * 5, 150 - a * 9);
      r.handNear = "faust";
      r.handFar = "faust";
      // Beide Knie tragen auf dem Boden, die Schienbeine schleifen hinterher
      r.legNear = leg([7.5, -8], [-4.5, -8.4]);
      r.legFar = leg([5.5, -8], [-7, -8.4]);
      r.footNearDir = -1;
      r.footNearAng = -0.4;
      r.footFarDir = -1;
      r.footFarAng = -0.4;
      r.hairFlow = -2.8 * cfg.sway;
      break;
    }

    case "danceHeadnod": {
      // Kopfnicken: der Kopf nickt genau auf den Schlag nach vorn, die Knie
      // federn mit, die Arme hängen locker. Beide Füße bleiben stehen.
      const cfg = tanzParamsFor("danceHeadnod");
      const ab = 0.5 + 0.5 * Math.cos(ZWEI_PI * taktPhase(1));
      const lang = Math.sin(Math.PI * takt * 0.5);
      r.rootX = lang * 1.0 * cfg.sway;
      r.rootY = 0.4 + ab * 1.3 * cfg.bounce;
      r.headTilt = (0.02 + ab * 0.2) * cfg.nod;
      r.hairFlow = lang * 0.6 - ab * 1.4;
      const mit = ab * cfg.armUp;
      tanzArme(11 + mit * 3, -8 + mit * 6, 11 + mit * 3, -8 + mit * 6);
      stand();
      break;
    }

    case "danceTap": {
      // Fuß tippt: die Hände locker in den Hüften, das Gewicht auf dem hinteren
      // Bein. Der vordere Fuß steht mit der Ferse fest am Boden – nur die Zehen
      // heben langsam an und tippen genau auf den Schlag wieder auf.
      const cfg = tanzParamsFor("danceTap");
      const f = taktPhase(1);
      const zehe = (f < 0.72 ? ease(f / 0.72) : 1 - ease((f - 0.72) / 0.28)) * Math.min(1.3, cfg.legs);
      const ab = 0.5 + 0.5 * Math.cos(ZWEI_PI * f);
      r.rootX = -0.9;
      r.rootY = 0.5 + ab * 0.5 * cfg.bounce;
      r.headTilt = (0.03 + ab * 0.07) * cfg.nod;
      r.hairFlow = 0.4 - ab * 0.6;
      tanzArme(42, -30 + ab * 2 * cfg.armUp, 42, -30 + ab * 2 * cfg.armUp);
      const ang = -0.3 * zehe;
      // Die Ferse ist der Drehpunkt: sie bleibt auf dem Boden.
      const nf: V = [6.4 - r.rootX, -2.2 * Math.sin(-ang) - r.rootY];
      const ff: V = [-4.4 - r.rootX, -r.rootY];
      r.legNear = leg(gangKnie([2.6, r.hipY], nf), nf);
      r.legFar = leg(gangKnie([-2.6, r.hipY], ff), ff);
      r.footNearAng = ang;
      break;
    }

    case "danceArmUp": {
      // Ein Arm hoch: die Faust pumpt im Takt nach oben, der andere Arm hängt
      // locker. Die Knie federn auf den Schlag.
      const cfg = tanzParamsFor("danceArmUp");
      const ab = 0.5 + 0.5 * Math.cos(ZWEI_PI * taktPhase(1));
      const lang = Math.sin(Math.PI * takt * 0.5);
      r.rootX = lang * 1.4 * cfg.sway;
      r.rootY = 0.4 + ab * 1.3 * cfg.bounce;
      r.headTilt = (-0.04 + lang * 0.06) * cfg.nod;
      r.hairFlow = -lang * 1.5;
      const a = ab * cfg.armUp;
      tanzArme(152 - a * 42, 172 + a * 13, 13 + ab * 3, -8 + ab * 5);
      r.handNear = "faust";
      stand();
      break;
    }

    case "danceArmsUp": {
      // Beide Arme hoch: im weiten V über den Schultern, sie winken gemeinsam
      // von Seite zu Seite wie auf einem Konzert.
      const cfg = tanzParamsFor("danceArmsUp");
      const s = Math.sin(Math.PI * takt);
      const ab = 0.5 + 0.5 * Math.cos(ZWEI_PI * taktPhase(1));
      r.rootX = s * 1.6 * cfg.sway;
      r.rootY = 0.4 + ab * 1.2 * cfg.bounce;
      r.headTilt = s * 0.06 * cfg.nod;
      r.hairFlow = -s * 1.8;
      const w = s * Math.min(1.1, cfg.armUp);
      tanzArme(144 - 8 * w, 162 - 10 * w, 144 + 8 * w, 162 + 10 * w);
      stand();
      break;
    }

    case "danceFortnite": {
      // Der Floss (Fortnite): beide Arme schwingen gestreckt mit Fäusten von
      // einer Seite zur anderen, die Hüfte geht jeweils dagegen. Der Arm, der
      // den Körper kreuzt, läuft abwechselnd VOR und HINTER dem Körper durch –
      // vorn, hinten, hinten, vorn. Ein Schwung je Schlag.
      const cfg = tanzParamsFor("danceFortnite");
      const i = Math.floor(takt);
      const f = takt - i;
      const zu = ((i % 2) + 2) % 2 === 0 ? -1 : 1;
      const s = lerp(-zu, zu, ease(Math.min(1, f / 0.62)));
      const hinten = (n: number) => {
        const m = ((n % 4) + 4) % 4;
        return m === 1 || m === 2;
      };
      // Nach links kreuzt der nahe Arm (+x), nach rechts der ferne (−x). Der
      // andere kommt gerade von seinem letzten Schwung zurück: er behält dessen
      // Ebene, bis er den Körper wieder frei hat.
      const naherKreuzt = zu < 0;
      const schwingt = f < 0.62;
      r.armNearHinten = naherKreuzt ? hinten(i) : hinten(i - 1) && schwingt;
      r.armFarHinten = naherKreuzt ? hinten(i - 1) && schwingt : hinten(i);
      r.rootX = -s * 2.4 * cfg.sway;
      r.rootY = 0.5 + (1 - s * s) * 0.9 * cfg.bounce;
      r.headTilt = -s * 0.05 * cfg.nod;
      r.hairFlow = s * 1.6;
      // +35° nach außen auf der eigenen Seite, −50° quer über den Körper.
      const nah = s * 42.5 - Math.abs(s) * 7.5;
      const fern = -s * 42.5 - Math.abs(s) * 7.5;
      tanzArme(nah, nah, fern, fern);
      r.handNear = "faust";
      r.handFar = "faust";
      stand();
      break;
    }

    case "danceSchritt": {
      // Schritt-Tanz: ein Schritt je Schlag, der Kopf nickt mit, ein Arm wippt
      // gestreckt nach oben und zeigt mit dem Finger zur Decke, der andere
      // schwingt locker mit. Mit Musikzeit fallen die Schritte genau auf den Takt.
      const cfg = tanzParamsFor("danceSchritt");
      const ab = 0.5 + 0.5 * Math.cos(ZWEI_PI * taktPhase(1));
      const gang = beatT !== undefined ? Math.PI * (takt + 0.5) : walkP;
      const sw = Math.sin(gang);
      const lift = Math.max(0, Math.cos(gang)) * 2.6 * cfg.legs;
      const liftF = Math.max(0, -Math.cos(gang)) * 2.6 * cfg.legs;
      r.rootY = 0.5 + ab * 1.1 * cfg.bounce;
      r.headTilt = (0.03 + ab * 0.17) * cfg.nod;
      r.hairFlow = -1.2 - ab * 0.8;
      const a = ab * cfg.armUp;
      tanzArme(150 - a * 20, 170 + a * 6, 11 + 4 * sw, -6 + 7 * sw);
      r.fingerUp = cfg.finger;
      const weite = 7.5 * Math.min(1.2, cfg.legs);
      const nearFoot: V = [sw * weite, -lift - r.rootY];
      const farFoot: V = [-sw * weite, -liftF - r.rootY];
      r.legNear = leg(gangKnie([2.6, r.hipY], nearFoot), nearFoot);
      r.legFar = leg(gangKnie([-2.6, r.hipY], farFoot), farFoot);
      break;
    }

    case "danceClap": {
      // Klatschen: Oberarme und Unterarme schwingen gemeinsam auf und treffen
      // sich genau auf den Schlag wieder vor der Brust. Die Knie federn mit.
      const cfg = tanzParamsFor("danceClap");
      const f = taktPhase(1);
      const auf = Math.pow(Math.sin(Math.PI * Math.pow(f, 0.8)), 1.2) * Math.min(1.2, cfg.armUp);
      const ab = 0.5 + 0.5 * Math.cos(ZWEI_PI * f);
      const lang = Math.sin(Math.PI * takt * 0.5);
      r.rootX = lang * 1.2 * cfg.sway;
      r.rootY = 0.4 + ab * 1.2 * cfg.bounce;
      r.headTilt = (0.02 + ab * 0.1) * cfg.nod;
      r.hairFlow = -lang * 1.2 - ab * 0.5;
      tanzArme(22 + 14 * auf, 234 - 20 * auf, 22 + 14 * auf, 234 - 20 * auf);
      stand();
      break;
    }

    case "danceRobot": {
      // Roboter: Oberarme waagrecht, Unterarme im rechten Winkel – einer zeigt
      // nach oben, einer nach unten. Auf jeden Schlag rucken sie hart in die
      // Gegenstellung und rasten ein. Normale Armlänge, nur die Gelenke drehen.
      const cfg = tanzParamsFor("danceRobot");
      const p = taktPhase(2) * 2;
      const teil = Math.floor(p);
      const f = p - teil;
      const ruck = Math.min(1, f / 0.2);
      const k = teil === 0 ? ruck : 1 - ruck;
      const rast = f > 0.2 && f < 0.34 ? Math.sin(((f - 0.2) / 0.14) * Math.PI) : 0;
      r.rootX = (k - 0.5) * 1.6 * cfg.sway;
      r.rootY = 0.3 + rast * 0.5 * cfg.bounce;
      r.headTilt = (k - 0.5) * 0.2 * cfg.nod;
      r.hairFlow = 0;
      const hub = 86 * Math.min(1.04, cfg.armUp);
      tanzArme(84, 90 + hub * (1 - 2 * k) + rast * 4, 84, 90 - hub * (1 - 2 * k) - rast * 4);
      stand();
      break;
    }

    case "danceWave": {
      // Armwelle: eine echte Welle läuft von der einen Hand durch Unterarm,
      // Oberarm und Schultern bis in die andere Hand. Jedes Armglied hebt und
      // senkt sich nacheinander – die Längen bleiben, nur die Gelenke drehen.
      const cfg = tanzParamsFor("danceWave");
      const ph = Math.PI * takt;
      const kappa = 0.95;
      const G = 30 * Math.min(1.3, cfg.armUp);
      // Kette: ferne Hand (0) – Ellbogen (1) – Schulter (2) | Schulter (2.6) –
      // Ellbogen (3.6) – nahe Hand (4.6). Die Neigung folgt der Steigung der Welle.
      const steig = (xi: number) => Math.cos(ph - kappa * xi);
      const mitte = Math.sin(ph - kappa * 2.3);
      r.rootX = mitte * 0.8 * cfg.sway;
      r.rootY = 0.6 - mitte * 0.7 * cfg.bounce;
      r.headTilt = -Math.cos(ph - kappa * 2.3) * 0.07 * cfg.nod;
      r.hairFlow = mitte * 1.0;
      tanzArme(86 - G * 0.8 * steig(3.1), 90 - G * steig(4.1), 86 + G * 0.8 * steig(1.5), 90 + G * steig(0.5));
      stand();
      break;
    }

    case "danceHeart": {
      // Herz: beide Hände liegen übereinander auf dem Herzen. Sie wiegt sich
      // verträumt, der Kopf neigt sich mit, und die Hände heben sich im
      // Herzschlag (bu-bumm) zweimal kurz von der Brust.
      const cfg = tanzParamsFor("danceHeart");
      const lang = Math.sin(Math.PI * takt * 0.5);
      const f = taktPhase(2);
      const bumm = (x: number) => (x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0);
      const puls = (bumm(f / 0.2) + 0.7 * bumm((f - 0.26) / 0.2)) * cfg.armUp;
      r.rootX = lang * 1.8 * cfg.sway;
      r.rootY = 0.5 + (1 - lang * lang) * 0.5 * cfg.bounce;
      r.headTilt = lang * 0.13 * cfg.nod;
      r.hairFlow = -lang * 1.8;
      tanzArme(24 + puls * 3, 248 - puls * 4.5, 24 + puls * 3, 256 - puls * 4.5);
      stand();
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

function drawHairBack(ctx: C, flow: number, up: boolean, lenK: number, centered = false, pinsel?: LuniZeichenpinsel) {
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
  if (pinsel) imSchnitt(ctx, () => {
    if (centered) ctx.scale(1 / .84, 1);
    else ctx.translate(2.6, 0);
    pinsel.haar(ctx, "fall", L, flow, centered ? 0 : -1);
  });
  ctx.restore();
}

function drawHairFront(ctx: C, flow: number, up: boolean, lenK: number, pinsel?: LuniZeichenpinsel) {
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
  if (pinsel) imSchnitt(ctx, () => pinsel.haar(ctx, "pony", HAIR_LEN * lenK, flow, 0));

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
    if (pinsel) imSchnitt(ctx, () => pinsel.haar(ctx, "seite", sl, flow, sgn));
  }

  // dezenter Glanz
  if (pinsel) { ctx.restore(); return; }
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

/**
 * Augenrollen: weiße Augen, die Pupillen wandern links -> oben -> rechts und
 * zurück zur Mitte. `p` 0..1 ist der Fortschritt. Gezeichnet im Kopfraum
 * direkt nach drawFace, damit Pose, Neigung und Brille unverändert mitgehen.
 */
function drawEyeRoll(ctx: C, p: number) {
  const farX = -2.6, nearX = 3.6, eyeY = 0.4;
  const k = Math.max(0, Math.min(1, p));
  let ox: number;
  let oy: number;
  if (k < 0.12) {
    ox = (-0.9 * k) / 0.12;
    oy = 0;
  } else if (k < 0.72) {
    const a = Math.PI + ((k - 0.12) / 0.6) * Math.PI;
    ox = Math.cos(a) * 0.9;
    oy = Math.sin(a) * 0.8;
  } else {
    ox = 0.9 * (1 - (k - 0.72) / 0.28);
    oy = 0;
  }
  ctx.save();
  ctx.translate(0, HEAD_Y);
  for (const [x, r] of [[farX, 1.9], [nearX, 2.1]] as const) {
    ctx.fillStyle = "#f7f5ef";
    ctx.beginPath();
    ctx.ellipse(x, eyeY, r, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = LUNI_COLORS.eye;
    ctx.beginPath();
    ctx.arc(x + ox, eyeY + oy, 0.95, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------ Gesicht -------------------------------- */

function drawFace(ctx: C, expr: LuniExpr, blink: number, t: number, glasses = true, gaze = 0, queasy = 0, singOpen = 0, pinsel?: LuniZeichenpinsel, frontal = false) {
  if (pinsel) {
    ctx.save(); ctx.translate(0, HEAD_Y);
    pinsel.gesicht(ctx, expr, blink, t, glasses, gaze, queasy, singOpen);
    ctx.restore(); return;
  }
  // Krank (grünes Gesicht): kein fröhliches Augenkneifen mehr.
  const closed =
    blink > 0.5 || expr === "sleep" ||
    (queasy < 0.5 && (expr === "happy" || expr === "grin" || expr === "love"));
  const farX = frontal ? -3.25 : -2.6;
  const nearX = frontal ? 3.25 : 3.6;
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

  if (expr === "sleep" || expr === "yawn") {
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
  } else if (frontal) {
    for (const x of [farX, nearX]) {
      ctx.fillStyle = "#faf6ec"; ctx.beginPath(); ctx.ellipse(x, eyeY, 1.88, 1.55, 0, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = LUNI_COLORS.eye; dot(x, 1.1);
    }
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
      ctx.arc(x + 0.2 + Math.max(-1, Math.min(1, gaze)) * .6, eyeY + 0.2, r * 0.52, 0, Math.PI * 2);
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
    if (frontal) { ctx.moveTo(nearX + lw / 2, eyeY - .8); ctx.lineTo(7.6, eyeY - 1.6); }
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
  // Die vordere Wange liegt innerhalb des Gesichtskreises (Radius HEAD_R).
  ctx.ellipse(nearX + 2.2, eyeY + 3.6, 1.9, 1.25, 0, 0, Math.PI * 2);
  ctx.ellipse(farX - 2.8, eyeY + 3.8, 1.7, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- Mund ----
  const mY = MUND_Y;
  const mx = MUND_X;
  ctx.strokeStyle = LUNI_COLORS.mouth;
  ctx.fillStyle = LUNI_COLORS.mouth;
  ctx.lineWidth = 1.05;
  // Krank darf sie nicht lächeln: aus jedem Lächeln wird ein flauer Mund.
  if (queasy >= 0.5 && (expr === "happy" || expr === "grin" || expr === "love" || expr === "wink")) {
    ctx.beginPath();
    ctx.moveTo(mx - 2.6, mY + 0.5);
    ctx.quadraticCurveTo(mx - 1.3, mY - 0.8, mx, mY + 0.2);
    ctx.quadraticCurveTo(mx + 1.3, mY + 1.2, mx + 2.6, mY - 0.2);
    ctx.stroke();
  } else switch (expr) {
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
    case "talk":
      ctx.beginPath();
      ctx.ellipse(mx, mY - 0.25, 1.35, 0.52 + Math.abs(Math.sin(t * 7)) * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "yawn":
      // Weit aufgerissen, ein Stück nach unten gezogen.
      ctx.beginPath();
      ctx.ellipse(mx, mY + 0.5, 1.7, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "sing": {
      // Mitsingen: bei geschlossenem Mund (Pausen und zwischen den Noten) ein
      // geschlossenes Lächeln, bei aktivem Ton öffnet sich der Mund passend.
      const o = clamp01(singOpen);
      if (o < 0.08) {
        ctx.beginPath();
        ctx.arc(mx, mY - 1.4, 2.4, Math.PI * 0.14, Math.PI * 0.86);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(mx, mY - 0.25, 0.95 + o * 1.1, 0.28 + o * 1.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
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

function drawSock(ctx: C, foot: V, ang: number, cols: string[], dir: 1 | -1 = 1, pinsel?: LuniZeichenpinsel) {
  ctx.save();
  ctx.translate(foot[0], foot[1]);
  ctx.rotate(ang);
  if (dir < 0) ctx.scale(-1, 1);
  // kein Schaft – die Socke endet am Knöchel.
  // Fuß – Sohle liegt auf y = 0
  ctx.fillStyle = cols[0];
  rr(ctx, -2.2, -3.6, 7.4, 3.6, 1.6);
  ctx.fill();
  if (pinsel) {
    imSchnitt(ctx, () => pinsel.socke(ctx, cols));
    ctx.restore(); return;
  }
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

/**
 * Hand entlang des Unterarms: gewölbte Handfläche (am Handgelenk schmal, an den
 * Knöcheln breit), vier unterschiedlich lange Finger mit runden Kuppen und ein
 * Daumen, der am Handballen ansetzt und schräg nach vorn zeigt.
 * `daumen` (-1..1): auf welcher Seite der Daumen sitzt und wie weit er absteht.
 * `geste`: offene Hand, Faust oder ausgestreckter Zeigefinger.
 */
function drawHand(ctx: C, elbow: V, hand: V, skin: string, shade: string, daumen = 1, geste: Geste = "offen", pinsel?: LuniZeichenpinsel, handruecken = false) {
  const s = daumen >= 0 ? 1 : -1;
  const ab = Math.min(1, Math.abs(daumen));
  ctx.save();
  ctx.translate(hand[0], hand[1]);
  ctx.rotate(Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Handfläche
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-1.9, -1.15);
  ctx.quadraticCurveTo(-0.3, -1.8, 1.05, -1.55);
  ctx.quadraticCurveTo(1.5, 0, 1.05, 1.55);
  ctx.quadraticCurveTo(-0.3, 1.8, -1.9, 1.15);
  ctx.quadraticCurveTo(-2.25, 0, -1.9, -1.15);
  ctx.closePath();
  ctx.fill();
  // Finger, vom Daumen aus gezählt: Zeige-, Mittel-, Ring- und kleiner Finger
  const lage = [1.14, 0.39, -0.37, -1.12];
  const offen = [2.1, 2.45, 2.2, 1.7];
  const spitzen: number[] = [];
  ctx.strokeStyle = skin;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    const gestreckt = geste === "offen" || (geste === "zeig" && i === 0);
    const len = !gestreckt ? 0.55 : geste === "zeig" ? 2.7 : offen[i];
    const y0 = s * lage[i];
    ctx.beginPath();
    ctx.moveTo(0.75, y0);
    ctx.lineTo(0.95 + len, geste === "offen" ? y0 * 1.1 : y0);
    ctx.stroke();
    spitzen.push(0.95 + len);
  }
  // Daumen
  ctx.lineWidth = 1.05;
  ctx.beginPath();
  if (geste === "offen") {
    ctx.moveTo(-1.0, s * 0.95);
    ctx.quadraticCurveTo(-0.55, s * (1.35 + 0.85 * ab), 0.6, s * (1.3 + 1.1 * ab));
  } else {
    // Faust und Zeigen: der Daumen liegt quer über den eingerollten Fingern
    ctx.moveTo(-0.9, s * 1.05);
    ctx.quadraticCurveTo(0.5, s * 1.75, 1.5, s * 0.75);
  }
  ctx.stroke();
  // Feine Fugen zwischen den Fingern und am Daumenansatz
  ctx.strokeStyle = shade;
  ctx.lineWidth = 0.26;
  for (let i = 0; i < 3; i++) {
    const y = (s * (lage[i] + lage[i + 1])) / 2;
    const ende = Math.max(1.25, Math.min(spitzen[i], spitzen[i + 1]) - 0.35);
    ctx.beginPath();
    ctx.moveTo(1.05, y);
    ctx.lineTo(ende, y * 1.05);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-0.55, s * 1.05);
  ctx.lineTo(0.25, s * 1.3);
  ctx.stroke();
  pinsel?.hand(ctx, s, spitzen, geste, handruecken);
  ctx.restore();
}

/* ------------------------------ Kleidung -------------------------------- */

/** Gruselbad: sanfter Rückenbogen bei unveränderter Schulter-, Hüft- und Kopfgröße. */
function drawLabTorso(ctx: C, r: Rig, outfit: "dressed" | "towel" | "none", K: typeof LUNI_COLORS) {
  const top = r.shoulderY;
  const bot = r.hipY;
  const curve = r.spineCurve * 3;
  if (outfit === "towel") {
    ctx.fillStyle = K.skin;
    rr(ctx, -6.2, top, 12.4, 5, 3);
    ctx.fill();
  }
  ctx.fillStyle = outfit === "none" ? K.skin : outfit === "towel" ? "#e2eef2" : K.cardigan;
  ctx.beginPath();
  ctx.moveTo(-7, top + 1);
  ctx.bezierCurveTo(-8 - curve * .3, top + 6, -6 + curve, bot - 5, -6.8, bot + 1);
  ctx.quadraticCurveTo(0, bot + 2.2, 6.8, bot + 1);
  ctx.bezierCurveTo(6 + curve, bot - 5, 8 + curve * .3, top + 6, 7, top + 1);
  ctx.quadraticCurveTo(0, top - 1, -7, top + 1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = outfit === "towel" ? "#aac9d2" : K.cardiganDark;
  ctx.lineWidth = .8;
  ctx.beginPath();
  ctx.moveTo(-5.7, top + 2.5);
  ctx.bezierCurveTo(-6 + curve, top + 9, -3 + curve, bot - 4, -4.4, bot);
  ctx.stroke();
  if (outfit === "towel") {
    ctx.fillStyle = "#7fb6d0";
    ctx.fillRect(-6.4, top + 6, 12.8, 1.1);
    ctx.fillRect(-6.4, bot - .5, 12.8, 1.1);
  }
}

/** Pfad eines Vorderteils der offenen Jacke (ohne beginPath; links oder rechts der weißen Mitte). */
function vorderteilPfad(ctx: C, sgn: -1 | 1, topY: number, botY: number) {
  ctx.moveTo(sgn * 2.4, topY + 0.4);
  ctx.quadraticCurveTo(sgn * 7.6, topY - 0.4, sgn * 7.8, topY + 5);
  ctx.lineTo(sgn * 7.4, botY + 1.6);
  ctx.quadraticCurveTo(sgn * 4.6, botY + 2.4, sgn * 3.4, botY + 0.6);
  ctx.quadraticCurveTo(sgn * 2.2, topY + 8, sgn * 2.4, topY + 0.4);
  ctx.closePath();
}

/** Holzfäller-Karo: breite Streifen und feine Zwischenlinien, leicht dunkler als die Weste. */
function karoRaster(ctx: C, x0: number, x1: number, y0: number, y1: number) {
  ctx.save();
  ctx.strokeStyle = LUNI_COLORS.karo;
  const lagen = [
    { abstand: 6.5, breite: 1.2, deckkraft: 1, versatz: 0 },
    { abstand: 6.5, breite: 0.5, deckkraft: 0.7, versatz: 3.25 },
  ];
  for (const { abstand, breite, deckkraft, versatz } of lagen) {
    ctx.lineWidth = breite;
    ctx.globalAlpha = deckkraft;
    for (let x = x0 + versatz; x <= x1; x += abstand) {
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
    }
    for (let y = y0 + versatz; y <= y1; y += abstand) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Holzfäller-Karo auf dem Ärmel: Querstriche im Abstand und eine Mittellinie. */
function armKaro(ctx: C, pts: V[]) {
  ctx.save();
  ctx.strokeStyle = LUNI_COLORS.karo;
  ctx.lineCap = "butt";
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 0.01) continue;
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    const nx = -uy * 2;
    const ny = ux * 2;
    ctx.lineWidth = 0.55;
    for (let s = 1.2; s < len; s += 3.25) {
      const px = ax + ux * s;
      const py = ay + uy * s;
      ctx.beginPath();
      ctx.moveTo(px + nx, py + ny);
      ctx.lineTo(px - nx, py - ny);
      ctx.stroke();
    }
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTorso(ctx: C, r: Rig, K = LUNI_COLORS, pinsel?: LuniZeichenpinsel) {
  const topY = r.shoulderY;
  const botY = r.hipY;
  const h = botY - topY;

  // weißes T-Shirt als Basis
  ctx.fillStyle = K.tee;
  rr(ctx, -7.2, topY, 14.4, h + 1.5, 5);
  ctx.fill();
  if (pinsel) imSchnitt(ctx, () => pinsel.gewebe(ctx, "shirt", topY, botY, 0));
  ctx.fillStyle = K.teeShade;
  rr(ctx, -7.2, botY - 3.4, 14.4, 3.4, 2);
  ctx.fill();
  if (pinsel) imSchnitt(ctx, () => pinsel.gewebe(ctx, "shirtsaum", topY, botY, 0));

  // Leggings-Bund
  ctx.fillStyle = K.leggings;
  rr(ctx, -6.8, botY - 2.4, 13.6, 4.4, 2);
  ctx.fill();
  if (pinsel) imSchnitt(ctx, () => pinsel.gewebe(ctx, "taillenbund", topY, botY, 0));

  // offene Strickjacke: zwei Vorderteile, Mitte bleibt weiß
  for (const sgn of [-1, 1] as const) {
    ctx.beginPath();
    vorderteilPfad(ctx, sgn, topY, botY);
    ctx.fillStyle = sgn > 0 ? K.cardigan : K.cardiganDark;
    ctx.fill();
    if (pinsel) imSchnitt(ctx, () => pinsel.gewebe(ctx, "jacke", topY, botY, sgn));
  }
  // Holzfäller-Karo nur auf der hellen Standardweste, nicht im Pyjama- oder Vampir-Look
  if (!pinsel && K.cardigan === LUNI_COLORS.cardigan) {
    ctx.save();
    ctx.beginPath();
    vorderteilPfad(ctx, -1, topY, botY);
    vorderteilPfad(ctx, 1, topY, botY);
    ctx.clip();
    karoRaster(ctx, -8, 8, topY - 1, botY + 3);
    ctx.restore();
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
  if (pinsel) imSchnitt(ctx, () => pinsel.gewebe(ctx, "kragen", topY, botY, 0));

  // Knopfleiste auf dem vorderen Teil (Jacke bleibt offen)
  ctx.fillStyle = K.cardiganLight;
  for (let i = 0; i < 3; i++) {
    if (pinsel) { pinsel.knopf(ctx, 3.3, topY + 5.5 + i * 4.2); continue; }
    ctx.beginPath();
    ctx.arc(3.3, topY + 5.5 + i * 4.2, 0.62, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heller Saumstreifen nur bei Sonder-Outfits (Pyjama, Vampir); die Standardweste hat keinen Streifen.
  if (K.cardigan !== LUNI_COLORS.cardigan) {
    ctx.fillStyle = K.cardiganLight;
    ctx.globalAlpha = 0.55;
    rr(ctx, -7.6, botY - 0.4, 15.2, 1.2, 0.6);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
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
function drawTorsoBack(ctx: C, r: Rig, outfit: "dressed" | "towel" | "none", K: typeof LUNI_COLORS, pinsel?: LuniZeichenpinsel) {
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
    if (pinsel) imSchnitt(ctx, () => pinsel.gewebe(ctx, "ruecken", topY, botY, 0));
    // Rückennaht und Schulterschatten
    ctx.fillStyle = K.cardiganDark;
    ctx.fillRect(-0.4, topY + 2, 0.8, botY - topY - 1);
    ctx.globalAlpha = 0.5;
    rr(ctx, -7.6, topY + 1, 2, botY - topY, 1);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Kragen von hinten
    ctx.fillStyle = K.cardiganLight;
    rr(ctx, -3.6, topY - 1.4, 7.2, 2.2, 1.1);
    ctx.fill();
    if (K.cardigan !== LUNI_COLORS.cardigan) {
      // Bündchen am Saum nur bei Sonder-Outfits; die Standardweste hat keinen hellen Streifen.
      ctx.globalAlpha = 0.6;
      rr(ctx, -7.6, botY - 0.2, 15.2, 1.6, 0.8);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
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

function flauschBund(c: C, gelenk: V, ende: V, farbe: string, breite: number) {
  c.save(); c.translate(...ende); c.rotate(Math.atan2(ende[1] - gelenk[1], ende[0] - gelenk[0]));
  c.fillStyle = mixCol(farbe, "#fff7ef", .38);
  rr(c, -2.6, -breite / 2, 3.1, breite, 1.15); c.fill();
  for (let i = 0; i < 4; i++) {
    c.beginPath(); c.arc(.15, (i - 1.5) * (breite - 1.6) / 3, .83, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

function flauschJacke(c: C, r: Rig, farbe: string, hinten: boolean) {
  const oben = r.shoulderY, unten = r.hipY + 1.5;
  c.save(); c.fillStyle = farbe;
  rr(c, -7.6, oben, 15.2, unten - oben, 3.2); c.fill();
  c.fillStyle = mixCol(farbe, "#fff6eb", .46);
  for (let i = 0; i < 9; i++) {
    c.beginPath(); c.ellipse(-6.5 + i * 1.62, unten - .8, 1.25, 1.4, .2, 0, Math.PI * 2); c.fill();
  }
  rr(c, -4.6, oben - 1.3, 9.2, 3.4, 1.5); c.fill();
  c.lineCap = "round"; c.lineWidth = .7;
  for (let i = 0; i < 22; i++) {
    const x = -6.4 + ((i * 7.1) % 12.7), y = oben + 3.3 + ((i * 3.7) % (unten - oben - 5.8));
    c.strokeStyle = i % 3 ? "rgba(255,253,246,.38)" : "rgba(93,72,99,.13)";
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + .5, y + .7, x + 1.05, y - .15); c.stroke();
  }
  if (!hinten) {
    c.fillStyle = mixCol(farbe, "#896f8a", .42);
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-1.1, oben + 4 + i * 4.1, .63, 0, Math.PI * 2); c.fill(); }
  }
  c.restore();
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

/* ------------------------------ Vampir-Outfits -------------------------- */

/** Oberteil von vorn: Samt mit Lichtverlauf, Mieder, Borten, Spitze, Jabot, Kragen. */
function drawVampirTorso(ctx: C, r: Rig, v: VampirStil) {
  const topY = r.shoulderY;
  const botY = r.hipY;
  const h = botY - topY;
  const g = ctx.createLinearGradient(-7, topY, 7, botY);
  g.addColorStop(0, mixCol(v.top, "#ffffff", 0.14));
  g.addColorStop(0.5, v.top);
  g.addColorStop(1, mixCol(v.top, "#000000", 0.32));
  ctx.fillStyle = g;
  rr(ctx, -7.4, topY - 0.3, 14.8, h + 2, 5);
  ctx.fill();
  if (v.glanz) {
    ctx.fillStyle = "rgba(255,255,255,.2)";
    rr(ctx, -5, topY + 2.6, 1.8, h - 4.5, 0.9);
    ctx.fill();
  }
  if (v.korsett) {
    ctx.fillStyle = v.korsett.farbe;
    ctx.beginPath();
    ctx.moveTo(-5.6, topY + 6.4);
    ctx.lineTo(5.6, topY + 6.4);
    ctx.lineTo(4.9, botY + 0.6);
    ctx.lineTo(0, botY + 2.2);
    ctx.lineTo(-4.9, botY + 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = v.korsett.schnur;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const y = topY + 8 + i * 2.5;
      ctx.beginPath();
      ctx.moveTo(-1.5, y);
      ctx.lineTo(1.5, y + 1.6);
      ctx.moveTo(1.5, y);
      ctx.lineTo(-1.5, y + 1.6);
      ctx.stroke();
    }
    ctx.fillStyle = v.korsett.schnur;
    for (let i = 0; i < 5; i++) {
      for (const sx of [-1.7, 1.7]) {
        ctx.beginPath();
        ctx.arc(sx, topY + 8 + i * 2.5, 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (v.trim) {
    ctx.strokeStyle = v.trim;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-7, botY + 1.1);
    ctx.lineTo(7, botY + 1.1);
    ctx.moveTo(-2.6, topY + 1.4);
    ctx.lineTo(-2.2, botY + 1);
    ctx.moveTo(2.6, topY + 1.4);
    ctx.lineTo(2.2, botY + 1);
    ctx.stroke();
  }
  if (v.spitze) {
    ctx.fillStyle = v.spitze;
    for (let x = -7.2; x < 7; x += 1.8) {
      ctx.beginPath();
      ctx.arc(x + 0.9, botY + 1.5, 0.9, 0, Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 0.7;
    for (let x = -4; x <= 4; x += 2) {
      ctx.beginPath();
      ctx.arc(x, topY + 1.6, 0.7, 0, Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (v.jabot) {
    ctx.fillStyle = v.jabot;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(0, topY + 2.6 + i * 2.2, 2.4 - i * 0.45, 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(110,104,96,.55)";
    ctx.lineWidth = 0.3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, topY + 3 + i * 2.2, 1.6 - i * 0.3, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }
  if (v.kragen) {
    ctx.fillStyle = v.kragen;
    ctx.beginPath();
    ctx.moveTo(-4.8, topY + 0.6);
    ctx.lineTo(-5.8, topY - 4.4);
    ctx.quadraticCurveTo(0, topY - 2.4, 5.8, topY - 4.4);
    ctx.lineTo(4.8, topY + 0.6);
    ctx.quadraticCurveTo(0, topY + 2.2, -4.8, topY + 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(-0.3, topY - 3, 0.6, 3.4);
  }
}

/** Oberteil von hinten: Schnürung, Borte, Spitze, Stehkragen. */
function drawVampirRuecken(ctx: C, r: Rig, v: VampirStil) {
  const topY = r.shoulderY;
  const botY = r.hipY;
  ctx.fillStyle = "rgba(255,255,255,.07)";
  rr(ctx, -6.6, topY + 1, 4.6, botY - topY - 1, 2);
  ctx.fill();
  if (v.korsett) {
    ctx.fillStyle = v.korsett.farbe;
    rr(ctx, -4.6, topY + 6, 9.2, botY - topY - 5, 1.6);
    ctx.fill();
    ctx.strokeStyle = v.korsett.schnur;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = topY + 7 + i * 2.4;
      ctx.beginPath();
      ctx.moveTo(-1.4, y);
      ctx.lineTo(1.4, y + 1.5);
      ctx.moveTo(1.4, y);
      ctx.lineTo(-1.4, y + 1.5);
      ctx.stroke();
    }
  }
  if (v.trim) {
    ctx.fillStyle = v.trim;
    ctx.fillRect(-7.4, botY + 0.6, 14.8, 0.8);
  }
  if (v.spitze) {
    ctx.fillStyle = v.spitze;
    for (let x = -7.4; x < 7.2; x += 1.8) {
      ctx.beginPath();
      ctx.arc(x + 0.9, botY + 1.6, 0.9, 0, Math.PI);
      ctx.fill();
    }
  }
  if (v.kragen) {
    ctx.fillStyle = v.kragen;
    ctx.beginPath();
    ctx.moveTo(-4.6, topY + 0.8);
    ctx.lineTo(-5.4, topY - 4);
    ctx.quadraticCurveTo(0, topY - 5.4, 5.4, topY - 4);
    ctx.lineTo(4.6, topY + 0.8);
    ctx.closePath();
    ctx.fill();
  }
}

/** Umhang seitlich: hängt von den Schultern hinter dem Rücken, Futter an der Kante. */
function drawUmhangSeite(ctx: C, r: Rig, u: { aussen: string; futter: string }, s: number) {
  const top = r.shoulderY - 0.8;
  const hem = lerp(r.hipY, -5.5, clamp01(s));
  ctx.fillStyle = u.futter;
  ctx.beginPath();
  ctx.moveTo(2.6, top);
  ctx.lineTo(-6.6, top + 0.5);
  ctx.lineTo(-10.8, hem + 0.7);
  ctx.lineTo(-1.6, hem + 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = u.aussen;
  ctx.beginPath();
  ctx.moveTo(1.7, top - 0.2);
  ctx.lineTo(-6.8, top + 0.2);
  ctx.lineTo(-10.2, hem);
  ctx.lineTo(-1.2, hem);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = mixCol(u.aussen, "#ffffff", 0.12);
  ctx.lineWidth = 0.5;
  for (const k of [0.3, 0.62]) {
    ctx.beginPath();
    ctx.moveTo(lerp(1.4, -6.6, k), top + 1);
    ctx.lineTo(lerp(-1.4, -10, k), hem - 0.6);
    ctx.stroke();
  }
}

/** Umhang von hinten; s < 1 = er schwingt von rechts über den Rücken, Futter sichtbar. */
function drawUmhangRuecken(ctx: C, r: Rig, u: { aussen: string; futter: string }, s: number) {
  const k = clamp01(s);
  const top = r.shoulderY - 0.6;
  const hem = -5.5;
  const sx = lerp(5.6, -7.8, k);
  const hx = lerp(8, -10.8, k);
  if (k < 0.98) {
    ctx.fillStyle = u.futter;
    ctx.beginPath();
    ctx.moveTo(sx, top);
    ctx.lineTo(sx + 2.6 * (1 - k) + 0.6, top + 0.8);
    ctx.lineTo(hx + 4 * (1 - k) + 0.8, hem + 0.8);
    ctx.lineTo(hx, hem + 0.8);
    ctx.closePath();
    ctx.fill();
  }
  const lead = k < 0.98 ? 1 - k : 0;
  ctx.fillStyle = u.aussen;
  ctx.beginPath();
  ctx.moveTo(sx + 1.6 * lead, top);
  ctx.lineTo(7.8, top);
  ctx.lineTo(10.8, hem);
  ctx.lineTo(hx + 3.2 * lead, hem);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = mixCol(u.aussen, "#000000", 0.35);
  ctx.lineWidth = 0.6;
  for (const f of [0.25, 0.5, 0.75]) {
    const fx = lerp(sx, 7.8, f);
    ctx.beginPath();
    ctx.moveTo(fx, top + 1.5);
    ctx.lineTo(lerp(hx, 10.8, f), hem - 0.5);
    ctx.stroke();
  }
  if (k >= 0.98) {
    ctx.fillStyle = u.futter;
    ctx.fillRect(-10.8, hem - 0.2, 21.6, 0.8);
  }
}

/* ------------------------------ Hauptroutine ---------------------------- */

/** Zeichnet Luni und liefert die Weltposition der vorderen Hand zurück. */

/** Baut das Rig (Gelenke) für die Zeichenoptionen, ohne zu zeichnen. Der Editor
    nutzt dieselbe Berechnung wie renderFig. */
export function luniRigBauen(x: number, y: number, opts: LuniOpts = {}): Rig {
  const scale = opts.scale ?? 1;
  const {
    t = 0,
    face = 1,
    beatT,
    state = "idle",
    walk = 0,
    phase = 0,
    armReach = 1,
    handTarget = null,
    handElbow = -1,
    handTarget2 = null,
    handElbow2 = 1,
    sitzgriff = null,
    sitzgriffLinks = null,
    handKontakt = false,
    pianoSeat,
    lieDown,
    bedSitzen,
    bedLean = 0,
    reck = 0,
    cough = 0,
    sway = 0,
    footTap = 0,
    rauchzeit,
    backReach = false,
    blendFrom,
    blendK,
  } = opts;
  // Smoothe Übergänge zwischen Tanzposen: alte und neue Pose werden weich
  // ineinander überblendet (keine harten Posewechsel).
  const tzeit = state === "smoke" ? rauchzeit ?? t : t;
  let r: Rig;
  if (blendFrom && blendK !== undefined && blendK > 0 && blendK < 1) {
    const alt = buildRig(blendFrom, tzeit, walk, phase, armReach, beatT);
    const neu = buildRig(state, tzeit, walk, phase, armReach, beatT);
    r = mergeRig(alt, neu, ease(blendK));
  } else if (opts.blendPhase !== undefined && blendK !== undefined && blendK < 1) {
    // Beginn eines Übergangs: zuerst ganz die alte Haltung, dann weich zur neuen.
    const alt = buildRig(state, tzeit, walk, opts.blendPhase, armReach, beatT);
    r = blendK <= 0 ? alt : mergeRig(alt, buildRig(state, tzeit, walk, phase, armReach, beatT), ease(blendK));
  } else {
    r = buildRig(state, tzeit, walk, phase, armReach, beatT, opts.buerstenzeit, opts.buerstendauer, opts.buerstensaat);
  }
  if (bedLean > 0) r.bend = Math.max(r.bend, clamp01(bedLean) * 0.28);
  if (reck > 0) {
    // Arme in einem weiten V über den Kopf (wie die Streck-Haltung im Stehen), Kopf zurück.
    const k = clamp01(reck);
    const zu = (a: { elbow: V; hand: V }, e: V, h: V) => ({
      elbow: [lerp(a.elbow[0], e[0], k), lerp(a.elbow[1], e[1], k)] as V,
      hand: [lerp(a.hand[0], h[0], k), lerp(a.hand[1], h[1], k)] as V,
    });
    r.armNear = zu(r.armNear, [10, -45], [5.5, -63]);
    r.armFar = zu(r.armFar, [-9, -45], [-6, -62]);
    r.headTilt = lerp(r.headTilt, -0.2, k);
    r.hairFlow = lerp(r.hairFlow ?? 0, -0.5, k);
  }
  const bettSitzEnde = state === "sit" && bedSitzen !== undefined ? buildRig("sit", t, walk, phase, armReach) : null;
  if (bettSitzEnde && bedSitzen !== undefined) {
    const p = ease(bedSitzen);
    const stand = buildRig("idle", t, walk, phase, armReach);
    r.rootY = lerp(stand.rootY + 11 / scale, bettSitzEnde.rootY, p);
    r.headTilt = lerp(stand.headTilt, bettSitzEnde.headTilt, p);
    for (const key of ["armFar", "armNear", "legFar", "legNear"] as const) {
      const a = stand[key], b = bettSitzEnde[key];
      r[key] = {
        elbow: [lerp(a.elbow[0], b.elbow[0], p), lerp(a.elbow[1], b.elbow[1], p)],
        hand: [lerp(a.hand[0], b.hand[0], p), lerp(a.hand[1], b.hand[1], p)],
      };
    }
  }
  if (opts.bettAufstehen) {
    const a = clamp01(opts.bettAufstehen.aufrichten);
    const b = clamp01(opts.bettAufstehen.beineSenken);
    const sit = buildRig("sit", t, walk, 1, armReach);
    r.rootRot = 0;
    r.rootY = SITZ_HUB;
    r.hipY = sit.hipY;
    // Oberkörper dreht sich um die Hüfte aus der Waagerechten (-90°) in den aufrechten Sitz (0°).
    r.bend = (-Math.PI / 2) * (1 - a) + r.bend;
    r.headTilt = lerp(0.1, sit.headTilt, a);
    // Im Liegen liegen beide Arme flach entlang des Rumpfs tief unter der Decke.
    r.armNear = {
      elbow: [lerp(-2.2, sit.armNear.elbow[0], a), lerp(-27, sit.armNear.elbow[1], a)],
      hand: [lerp(-2.4, sit.armNear.hand[0], a), lerp(-20.5, sit.armNear.hand[1], a)],
    };
    r.armFar = {
      elbow: [lerp(-3.8, sit.armFar.elbow[0], a), lerp(-27, sit.armFar.elbow[1], a)],
      hand: [lerp(-4.2, sit.armFar.hand[0], a), lerp(-20.5, sit.armFar.hand[1], a)],
    };
    // Beine liegen zuerst satt auf der Matratze ausgestreckt und schwingen beim Umsetzen vor die Bettkante.
    const bogen = Math.sin(Math.PI * b);
    const kFarY = lerp(-14.2, -15.8, a), fFarY = lerp(-13.6, -15.2, a);
    const kNearY = lerp(-15.0, -16.6, a), fNearY = lerp(-14.4, -16.0, a);
    r.legFar = {
      elbow: [lerp(8.4, sit.legFar.elbow[0], b) - 0.8 * bogen, lerp(kFarY, sit.legFar.elbow[1], b) - 1.6 * bogen],
      hand: [lerp(19.0, sit.legFar.hand[0], b), lerp(fFarY, sit.legFar.hand[1], b) - 1.2 * bogen],
    };
    r.legNear = {
      elbow: [lerp(11.8, sit.legNear.elbow[0], b) - 0.8 * bogen, lerp(kNearY, sit.legNear.elbow[1], b) - 1.6 * bogen],
      hand: [lerp(21.4, sit.legNear.hand[0], b), lerp(fNearY, sit.legNear.hand[1], b) - 1.0 * bogen],
    };
    r.footFarAng = -Math.PI * 0.36 * (1 - b);
    r.footNearAng = -Math.PI * 0.36 * (1 - b);
  }
  if (state === "lie" && lieDown !== undefined) {
    const p = clamp01(lieDown);
    const sit = buildRig("sit", t, walk, 1, armReach);
    r.rootRot *= p;
    r.rootY = lerp(sit.rootY, r.rootY, p);
    r.headTilt = lerp(sit.headTilt, r.headTilt, p);
    for (const key of ["armFar", "armNear", "legFar", "legNear"] as const) {
      const a = sit[key], b = r[key];
      r[key] = {
        elbow: [lerp(a.elbow[0], b.elbow[0], p), lerp(a.elbow[1], b.elbow[1], p)],
        hand: [lerp(a.hand[0], b.hand[0], p), lerp(a.hand[1], b.hand[1], p)],
      };
    }
  }
  if (pianoSeat !== undefined) {
    const p = ease(pianoSeat);
    r.rootY = 9 * p;
    r.legFar = leg([lerp(-3.6, -8, p), lerp(-10, -19, p)], [lerp(-4.2, -10, p), -9.5 * p]);
    r.legNear = leg([lerp(3.6, 9.5, p), lerp(-10, -19, p)], [lerp(4.2, 12, p), -9.5 * p]);
    r.headTilt *= 1 - p;
    r.footFarDir = -1;
    r.footNearDir = 1;
  }

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

  // Kontaktziele werden in den gedrehten Figurenraum zurückgerechnet, damit
  // die Hand auch beim Wiegen oder Vorbeugen am Gegenstand bleibt.
  const backIK = pianoSeat !== undefined || backReach;
  const armZiel = (ziel: V): V => {
    let tx = (ziel[0] - x) / (scale * face);
    let ty = (ziel[1] - y) / scale;
    if (backIK || handKontakt) {
      tx -= r.rootX;
      ty -= r.rootY;
    }
    if (handKontakt && r.rootRot) {
      const dx = tx, dy = ty - r.pivotY;
      tx = dx * Math.cos(r.rootRot) + dy * Math.sin(r.rootRot);
      ty = r.pivotY - dx * Math.sin(r.rootRot) + dy * Math.cos(r.rootRot);
    }
    if (handKontakt && r.bend) {
      const dx = tx, dy = ty - r.hipY;
      tx = dx * Math.cos(r.bend) + dy * Math.sin(r.bend);
      ty = r.hipY - dx * Math.sin(r.bend) + dy * Math.cos(r.bend);
    }
    return [tx, ty];
  };
  if (handTarget) {
    const sh: V = backIK ? [-6.2, r.shoulderY + 2.2] : [-3.4, r.shoulderY + 2];
    r.armFar = armIK(sh, armZiel(handTarget), handElbow);
  }
  if (handTarget2) {
    const sh: V = backIK ? [6.2, r.shoulderY + 2.2] : [3.4, r.shoulderY + 2];
    r.armNear = armIK(sh, armZiel(handTarget2), handElbow2);
  }
  if (bettSitzEnde && bedSitzen !== undefined && handTarget) {
    const p = ease(bedSitzen), a = r.armFar, b = bettSitzEnde.armFar;
    r.armFar = {
      elbow: [lerp(a.elbow[0], b.elbow[0], p), lerp(a.elbow[1], b.elbow[1], p)],
      hand: [lerp(a.hand[0], b.hand[0], p), lerp(a.hand[1], b.hand[1], p)],
    };
  }
  const sitzPose = state === "sit" || state === "smoke" || state === "ashtray";
  if (sitzgriff && sitzPose) r.armFar = armIK([-3.4, r.shoulderY + 2], sitzgriff, 1);
  if (sitzgriffLinks && sitzPose) r.armNear = armIK([3.4, r.shoulderY + 2], sitzgriffLinks, 1);
  // Studio-Editor: Gelenke nachträglich verschieben (kein Einfluss auf den Rig-Aufbau).
  // Ohne explizites edit gelten die im Studio übernommenen Positionen aus dem Spielspeicher.
  const editorEdit = opts.edit ?? liveDelta("luni", state);
  if (editorEdit) {
    const e = editorEdit;
    const sh = (p: [number, number], d?: [number, number]): [number, number] => (d ? [p[0] + d[0], p[1] + d[1]] : p);
    r.armFar = { elbow: sh(r.armFar.elbow, e.elbowFar), hand: sh(r.armFar.hand, e.handFar) };
    r.armNear = { elbow: sh(r.armNear.elbow, e.elbowNear), hand: sh(r.armNear.hand, e.handNear) };
    r.legFar = { elbow: sh(r.legFar.elbow, e.kneeFar), hand: sh(r.legFar.hand, e.footFar) };
    r.legNear = { elbow: sh(r.legNear.elbow, e.kneeNear), hand: sh(r.legNear.hand, e.footNear) };
    if (e.head) {
      r.headY += e.head[1];
      r.headX += e.head[0];
    }
  }

  return r;
}

/** Gelenkpunkte (Figurenraum, Boden = 0) für den Studio-Editor. Nutzt dieselbe
    Rig-Berechnung wie das Zeichnen; Hand- und Fußziele werden ohne Kontakt gerechnet. */
export function luniPunkte(state: LuniState, t: number, walk = 0, phase = 0): Record<string, [number, number]> {
  const r = luniRigBauen(0, 0, { state, t, walk, phase, edit: {} });
  return {
    head: [r.headX, r.headY],
    handFar: r.armFar.hand,
    handNear: r.armNear.hand,
    elbowFar: r.armFar.elbow,
    elbowNear: r.armNear.elbow,
    footFar: r.legFar.hand,
    footNear: r.legNear.hand,
    kneeFar: r.legFar.elbow,
    kneeNear: r.legNear.elbow,
  };
}

function renderFig(ctx: C, x: number, y: number, opts: LuniOpts = {}, pinsel?: LuniZeichenpinsel): V {
  const {
    t = 0,
    face = 1,
    state = "idle",
    expr = "happy",
    blink = 0,
    scale = 1,
    shadow = true,
    phase = 0,
    sick = 0,
    handKontakt = false,
    handVorRumpf = false,
    armeVorne = false,
    handOut = null,
    betweenBodyAndArms = null,
    armsInFront = false,
    outfit = "dressed",
    kleidung,
    back = false,
    wet = 0,
    glasses = true,
    pajama = null,
    weste = false,
    hairAside = 0,
    bedCover = false,
    singOpen = 0,
    pianoSeat,
    headShake = 0,
    gaze = 0,
    eyeRoll = 0,
    vampir = null,
    umhang = 1,
    reck = 0,
  } = opts;

  // Kränkliche Haut: je höher `sick`, desto grüner das Gesicht
  const K0 = sick > 0.01
    ? {
        ...LUNI_COLORS,
        skin: mixCol(LUNI_COLORS.skin, "#8fae6e", sick * 0.75),
        skinShade: mixCol(LUNI_COLORS.skinShade, "#7d9a5e", sick * 0.75),
      }
    : LUNI_COLORS;
  const P = pajama;
  const bekleidet = P
    ? {
        ...K0,
        cardigan: P.top,
        cardiganDark: mixCol(P.top, "#000000", 0.18),
        cardiganLight: mixCol(P.top, "#ffffff", 0.22),
        tee: P.top,
        teeShade: mixCol(P.top, "#000000", 0.12),
        leggings: P.bottom,
        leggingsLight: mixCol(P.bottom, "#ffffff", 0.14),
        // Im Schlafanzug ist sie barfuß (Schlappen kommen später); Vampir-Outfits behalten ihre Farbe.
        sockL: vampir ? [P.bottom, P.bottom] : [K0.skin, K0.skin],
        sockR: vampir ? [P.bottom, P.bottom] : [K0.skin, K0.skin],
      }
    : K0;
  const haut = {
    ...K0,
    leggings: K0.skinShade,
    leggingsLight: K0.skin,
    cardigan: K0.skin,
    cardiganDark: K0.skinShade,
    cardiganLight: K0.skin,
    sockL: [K0.skin, K0.skinShade],
    sockR: [K0.skin, K0.skinShade],
  };
  const KP = kleidung
    ? {
        ...K0,
        cardigan: kleidung.oberteil ? bekleidet.cardigan : haut.cardigan,
        cardiganDark: kleidung.oberteil ? bekleidet.cardiganDark : haut.cardiganDark,
        cardiganLight: kleidung.oberteil ? bekleidet.cardiganLight : haut.cardiganLight,
        tee: bekleidet.tee,
        teeShade: bekleidet.teeShade,
        leggings: kleidung.hose ? bekleidet.leggings : haut.leggings,
        leggingsLight: kleidung.hose ? bekleidet.leggingsLight : haut.leggingsLight,
        sockL: kleidung.hose ? bekleidet.sockL : haut.sockL,
        sockR: kleidung.hose ? bekleidet.sockR : haut.sockR,
      }
    : outfit === "dressed" ? bekleidet : haut;
  // Weste über dem Schlafanzug: oben trägt sie die helle Standardweste mit
  // Holzfäller-Karo, Hose und Socken bleiben der Schlafanzug. Ohne Schlafanzug
  // gibt es keine Weste darüber – dann ist die Kleidung schon die Tageskleidung.
  const westeAnteil = opts.westeAnziehen !== undefined ? clamp01(opts.westeAnziehen) : (weste ? 1 : 0);
  const westeOben = westeAnteil >= 0.999 && !!P && !kleidung?.handtuch && !vampir;
  const westeGleit = westeAnteil > 0.001 && westeAnteil < 0.999 && !!P && !kleidung?.handtuch && !vampir;
  const KWeste = { ...KP, cardigan: K0.cardigan, cardiganDark: K0.cardiganDark, cardiganLight: K0.cardiganLight };
  const KW = westeOben ? KWeste : KP;
  const oberteil = kleidung ? (kleidung.handtuch ? "towel" : kleidung.oberteil ? "dressed" : "none") : outfit;
  const plueschHose = P?.flausch && (kleidung ? kleidung.hose : outfit === "dressed");
  const K = vampir && oberteil === "dressed"
    ? { ...KW, cardiganLight: vampir.spitze ?? vampir.trim ?? KW.cardiganLight }
    : KW;
  const r = luniRigBauen(x, y, opts);
  const backIK = opts.pianoSeat !== undefined || opts.backReach === true;
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
    if (Math.abs(r.bend) <= 0.01) return fn();
    ctx.save();
    ctx.translate(0, r.hipY);
    ctx.rotate(r.bend);
    ctx.translate(0, -r.hipY);
    fn();
    ctx.restore();
  };

  if (vampir?.umhang && !back && oberteil === "dressed" && umhang > 0.01) {
    const u = vampir.umhang;
    upperLean(() => drawUmhangSeite(ctx, r, u, umhang));
  }

  const klavierHaareVorn = back && (state === "piano" || pianoSeat !== undefined);
  const schrank = back && opts.schrankRuecken === true;
  const westeArme = () => {
    const sy = r.shoulderY + 2.2, SR: V = [6.2, sy], SL: V = [-6.2, sy];
    const h = keys(westeAnteil, [
      [0, [4.6, sy - 2]],
      [0.26, [11.0, sy + 4.5]],
      [0.58, [10.6, sy + 11.4]],
      [0.82, [7.8, r.hipY + 0.6]],
      [1, [8.6, sy + 16.2]],
    ]);
    return { near: armIK(SR, h, 1), far: armIK(SL, [-h[0], h[1]], -1), behind: true };
  };
  const rueckenarme = !back ? null
    : backIK ? { near: r.armNear, far: r.armFar, behind: false }
    : opts.westeAnziehen !== undefined && state !== "act" ? westeArme()
    : backArms(state, r, phase);
  const armeVonHinten = () => {
    if (!rueckenarme || bedCover) return;
    const wk = ease(westeAnteil);
    for (const [side, arm] of [[-1, rueckenarme.far], [1, rueckenarme.near]] as const) {
      const sh: V = [side * 6.2, r.shoulderY + 2.2];
      stroke3(ctx, sh, arm.elbow, arm.hand, side < 0 ? K.cardiganDark : K.cardigan, 4.5, pinsel);
      if (P?.flausch && oberteil === "dressed" && !westeOben && wk < 0.85) {
        flauschBund(ctx, arm.elbow, pullBack(arm.elbow, arm.hand, 1.5), P.top, 4.9);
      }
      if (westeGleit && wk > 0.02) {
        // Ärmel der Weste gleitet fließend von der Schulter über den Ellbogen bis zum Handgelenk
        const wFarbe = side < 0 ? KWeste.cardiganDark : KWeste.cardigan;
        const ePkt: V = wk < 0.5
          ? [lerp(sh[0], arm.elbow[0], wk * 2), lerp(sh[1], arm.elbow[1], wk * 2)]
          : arm.elbow;
        const hZiel = pullBack(arm.elbow, arm.hand, 1.2);
        const hPkt: V = wk < 0.5
          ? ePkt
          : [lerp(arm.elbow[0], hZiel[0], (wk - 0.5) * 2), lerp(arm.elbow[1], hZiel[1], (wk - 0.5) * 2)];
        stroke3(ctx, sh, ePkt, hPkt, wFarbe, 4.7, pinsel);
      }
      drawHand(ctx, arm.elbow, arm.hand, K.skin, K.skinShade, -side, "offen", pinsel, true);
    }
  };
  // Der breite Haarfall reicht über die schmalere mittlere Strähne hinaus.
  // Beim Griff in den Schrank müssen auch diese Haare, Hose und Handtuch vor beiden Armen liegen.
  if (schrank) armeVonHinten();
  /* --- Haare hinten (beim Vorbeugen hängen sie am Kopf, siehe dort) --- */
  if (r.bend < 0.7 && !klavierHaareVorn) upperLean(() => drawHairBack(ctx, opts.buerstenzeit !== undefined ? r.hairFlow : r.hairFlow * (1 - 0.72 * clamp01((r.bend - 0.22) / 0.5)), r.hairUp, (opts.buerstenzeit !== undefined ? 1 : 1 - 0.55 * clamp01((r.bend - 0.22) / 0.5)) * r.hairLen, opts.zahnfrontal === true, pinsel));

  /* Beine tauschen: das helle Bein steht jetzt hinten, das dunkle vorn. Jedes Bein behält
     Gelenk, Gangphase, Socke und Farbe; nur die Zeichenreihenfolge ändert sich. */
  const beinHell = {
    hip: [2.6, r.hipY] as V,
    leg: r.legNear,
    ang: r.footNearAng,
    dir: r.footNearDir,
    sock: K.sockR,
    farbe: K.leggingsLight,
  };
  const beinDunkel = {
    hip: [-2.6, r.hipY] as V,
    leg: r.legFar,
    ang: r.footFarAng,
    dir: r.footFarDir,
    sock: K.sockL,
    farbe: K.leggings,
  };

  /* --- hinteres Bein (das helle, unverdreht, steht sicher auf dem Boden) --- */
  if (!bedCover) {
    stroke3(
      ctx,
      beinHell.hip,
      beinHell.leg.elbow,
      pullBack(beinHell.leg.elbow, beinHell.leg.hand, 3.1),
      beinHell.farbe,
      plueschHose ? 6.4 : 5.4,
      pinsel, true,
    );
    drawSock(ctx, [beinHell.leg.hand[0], beinHell.leg.hand[1] + r.footDrop], beinHell.ang, beinHell.sock, beinHell.dir, pinsel);
  }

  /* --- Arme: Rollen getauscht ---
     Der bisher vordere Arm (+x) liegt jetzt hinter dem Rumpf, der bisher
     hintere (−x) wird vorn gezeichnet. Jeder Arm bleibt auf seiner Seite,
     damit erhobene Arme nicht quer über den Körper greifen. */
  const armBehind = r.armNear;
  const armFront = r.armFar;
  const tanzt = state.startsWith("dance");
  /** Beim Tanzen zeigt der Daumen nach oben und leicht zur Körpermitte –
   *  an beiden Händen spiegelbildlich. In den Alltagsposen zeigen die
   *  Handflächen nach außen (zur Betrachterin): Beide Daumen zeigen zur
   *  Körpermitte, spiegelbildlich. */
  const daumenSeite = (side: 1 | -1, arm: Limb): number => {
    if (!tanzt) return side;
    const a = Math.atan2(arm.hand[1] - arm.elbow[1], arm.hand[0] - arm.elbow[0]);
    const d = (-Math.sin(a) * -side * 0.35 - Math.cos(a)) / Math.hypot(0.35, 1);
    return Math.max(-1, Math.min(1, d * 5));
  };
  const naheHandHoeher = armBehind.hand[1] < armFront.hand[1];
  const gesteNah: Geste = r.fingerUp && naheHandHoeher ? "zeig" : r.handNear;
  const gesteFern: Geste = r.fingerUp && !naheHandHoeher ? "zeig" : r.handFar;
  // Alltagsposen: Ärmelansatz an der Schulter; Tanzposen behalten ihre äußere Schulterecke.
  const ansatzX = r.schulterX > SCHULTER_X + 0.5 ? r.schulterX : SCHULTER_ANSATZ;
  const SCHULTER_HINTEN: V = [ansatzX, r.shoulderY + 2];

  /* --- hinterer Arm (früher der vordere) --- */
  const drawBackArm = (nurHand = false) =>
    upperLean(() => {
      if (!nurHand) {
        const wrist = pullBack(armBehind.elbow, armBehind.hand, 1.5);
        stroke3(ctx, SCHULTER_HINTEN, armBehind.elbow, wrist, K.cardiganDark, 4.4, pinsel);
        if (P?.flausch && oberteil === "dressed" && !westeOben) flauschBund(ctx, armBehind.elbow, wrist, P.top, 4.8);
        if (!pinsel && state !== "sax" && K.cardigan === LUNI_COLORS.cardigan) armKaro(ctx, [SCHULTER_HINTEN, armBehind.elbow, wrist]);
        if (tanzt) {
          // Beim Tanzen sind beide Arme ganz zu sehen: auch dieser bekommt sein Bündchen.
          ctx.save();
          ctx.translate(wrist[0], wrist[1]);
          ctx.rotate(Math.atan2(armBehind.hand[1] - armBehind.elbow[1], armBehind.hand[0] - armBehind.elbow[0]));
          ctx.fillStyle = mixCol(K.cardiganLight, K.cardiganDark, 0.35);
          rr(ctx, -1.5, -2.2, 1.8, 4.4, 0.8);
          ctx.fill();
          if (pinsel) imSchnitt(ctx, () => pinsel.bund(ctx, 4.4));
          ctx.restore();
        }
      }
      drawHand(ctx, armBehind.elbow, armBehind.hand, K.skin, K.skinShade, daumenSeite(1, armBehind), gesteNah, pinsel);
    });
  // Beim Tragen eines Instruments und beim Tanzen liegt der Arm vor dem Korpus,
  // nicht dahinter – Arme und Hände verschwinden so nie hinter dem Körper.
  if (!bedCover && !back && !armsInFront && !armeVorne && !tanzt) drawBackArm();

  /* --- vorderes Bein (das dunkle, unverdreht) --- */
  if (!bedCover) {
    stroke3(
      ctx,
      beinDunkel.hip,
      beinDunkel.leg.elbow,
      pullBack(beinDunkel.leg.elbow, beinDunkel.leg.hand, 3.1),
      beinDunkel.farbe,
      plueschHose ? 6.6 : 5.6,
      pinsel, true,
    );
    drawSock(ctx, [beinDunkel.leg.hand[0], beinDunkel.leg.hand[1] + r.footDrop], beinDunkel.ang, beinDunkel.sock, beinDunkel.dir, pinsel);
  }

  // Zeichnung und Armbewegung beginnen am selben Schultergelenk.
  const SCHULTER_VORN: V = [-ansatzX, r.shoulderY + 2];
  const drawFrontArm = () =>
    upperLean(() => {
      const wrist = pullBack(armFront.elbow, armFront.hand, 1.5);
      stroke3(ctx, SCHULTER_VORN, armFront.elbow, wrist, K.cardigan, 4.6, pinsel);
      if (!pinsel && state !== "sax" && K.cardigan === LUNI_COLORS.cardigan) armKaro(ctx, [SCHULTER_VORN, armFront.elbow, wrist]);
      // Ärmelbündchen
      ctx.save();
      const ha = Math.atan2(armFront.hand[1] - armFront.elbow[1], armFront.hand[0] - armFront.elbow[0]);
      ctx.translate(wrist[0], wrist[1]);
      ctx.rotate(ha);
      ctx.fillStyle = K.cardiganLight;
      rr(ctx, -1.5, -2.3, 1.8, 4.6, 0.8);
      ctx.fill();
      if (pinsel) imSchnitt(ctx, () => pinsel.bund(ctx, 4.6));
      ctx.restore();
      if (P?.flausch && oberteil === "dressed" && !westeOben) flauschBund(ctx, armFront.elbow, wrist, P.top, 5);
      drawHand(ctx, armFront.elbow, armFront.hand, K.skin, K.skinShade, daumenSeite(-1, armFront), gesteFern, pinsel);
    });

  if (P && oberteil === "dressed" && !back && !vampir && !westeOben) upperLean(() => drawPajamaDetails(ctx, r, P.top, P.bottom));

  if (back) {
    /* --- Rückansicht: Arme seitlich, Oberkörper von hinten --- */
    const verdeckt = rueckenarme?.behind && state !== "undress" && state !== "wrap";
    if (!schrank && verdeckt) armeVonHinten();
    drawTorsoBack(ctx, r, oberteil, K, pinsel);
    if (P?.flausch && oberteil === "dressed" && !westeOben) flauschJacke(ctx, r, P.top, true);
    if (westeGleit && oberteil === "dressed") {
      // Die Weste gleitet beim Überziehen fließend von den Schultern bis zum Saum hinab.
      const wk = ease(westeAnteil);
      const saum = lerp(r.shoulderY - 0.6, r.hipY + 2.2, wk);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-9, r.shoulderY - 3);
      ctx.lineTo(9, r.shoulderY - 3);
      ctx.lineTo(9, saum);
      ctx.quadraticCurveTo(0, saum + 1.4 * Math.sin(Math.PI * wk), -9, saum);
      ctx.closePath();
      ctx.clip();
      drawTorsoBack(ctx, r, "dressed", KWeste, pinsel);
      ctx.restore();
    }
    if (kleidung?.hose && !kleidung.oberteil && !kleidung.handtuch) {
      ctx.fillStyle = K.leggings;
      rr(ctx, -6.8, r.hipY - 1.6, 13.6, 3.6, 1.6);
      ctx.fill();
    }
    if (vampir && oberteil === "dressed") drawVampirRuecken(ctx, r, vampir);
    if (!schrank && !verdeckt) armeVonHinten();
    if (vampir?.umhang && oberteil === "dressed" && umhang > 0.01) drawUmhangRuecken(ctx, r, vampir.umhang, umhang);
    // Die langen Haare liegen über Rücken und Schultern.
    if (!klavierHaareVorn) drawHairBack(ctx, opts.buerstenzeit !== undefined ? r.hairFlow : r.hairFlow * (1 - 0.72 * clamp01((r.bend - 0.22) / 0.5)), r.hairUp, (opts.buerstenzeit !== undefined ? 1 : 1 - 0.55 * clamp01((r.bend - 0.22) / 0.5)) * r.hairLen * (wet > 0.3 ? 0.94 : 1), true, pinsel);
  } else {
    // Tanz: ein Arm, der hinter dem Körper durchschwingt (Floss), wird vor dem
    // Rumpf gezeichnet und dadurch von ihm verdeckt.
    if (tanzt && !bedCover && !bent) {
      if (r.armNearHinten) drawBackArm();
      if (r.armFarHinten) drawFrontArm();
    }
    /* --- Rumpf (an der vertikalen Achse gespiegelt) --- */
    upperLean(() => {
      ctx.save();
      ctx.scale(-1, 1);
      if (r.spineCurve > 0.01) drawLabTorso(ctx, r, oberteil, K);
      else if (oberteil === "dressed") {
        if (P?.flausch && !westeOben) flauschJacke(ctx, r, P.top, false);
        else drawTorso(ctx, r, kleidung || westeOben || P?.flausch === false || (P && state === "lie") ? K : LUNI_COLORS, pinsel);
        if (westeGleit) {
          const wk = ease(westeAnteil);
          const saum = lerp(r.shoulderY - 0.6, r.hipY + 2.4, wk);
          ctx.save();
          ctx.beginPath();
          ctx.rect(-9, r.shoulderY - 3, 18, Math.max(0, saum - (r.shoulderY - 3)));
          ctx.clip();
          drawTorso(ctx, r, KWeste, pinsel);
          ctx.restore();
        }
        if (vampir) drawVampirTorso(ctx, r, vampir);
      }
      else if (oberteil === "towel") drawTowel(ctx, r);
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
    // Beim Tanzen kommen beide Arme erst ganz zum Schluss (vor die Haare) –
    // sonst verschwinden sie hinter dem Körper.
    if (!bedCover && (armsInFront || armeVorne)) drawBackArm();
    else if (!bedCover && handVorRumpf) drawBackArm(true);

    /* --- vorderer Arm (früher der hintere) --- */
    // Beim Vorbeugen erst nach dem Kopf, damit die Bürstenhand vor den Haaren liegt.
    if (!bedCover && !bent && !tanzt) drawFrontArm();
  }

  /* --- Hals: in der Rückansicht vollständig von den Haaren verdeckt --- */
  upperLean(() => {
    if (back) return;
    if (r.neckBend) {
      ctx.save(); ctx.translate(0, r.shoulderY); ctx.rotate(r.neckBend); ctx.translate(0, -r.shoulderY);
    }
    ctx.fillStyle = K.skinShade;
    rr(ctx, -2, r.headY + 7, 4, 4.6, 1.6);
    ctx.fill();
    if (vampir?.kropfband && oberteil === "dressed") {
      ctx.fillStyle = vampir.kropfband.band;
      rr(ctx, -2.2, r.headY + 9.2, 4.4, 1.3, 0.6);
      ctx.fill();
      if (!back) {
        ctx.fillStyle = vampir.kropfband.stein;
        ctx.beginPath();
        ctx.arc(1.1, r.headY + 10.4, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (r.neckBend) ctx.restore();
  });

  /* --- Kopf --- */
  upperLean(() => {
  ctx.save();
  // Ein gemeinsamer Fadenlauf auf Hinterkopf und Rueckenhaar verhindert eine sichtbare Kreisnaht.
  const haarraum = pinsel && back ? ctx.getTransform() : null;
  if (r.neckBend) {
    ctx.translate(0, r.shoulderY); ctx.rotate(r.neckBend); ctx.translate(0, -r.shoulderY);
  }
  if (headShake) ctx.translate(headShake * 1.8, 0);
  // Der Kopf folgt dem Hals: Versatz gegenüber der Grundlage (nur Verbeugung/Aufstehen)
  ctx.translate(r.headX, r.headY - HEAD_Y);
  ctx.translate(0, r.headY);
  ctx.rotate(r.headTilt + headShake * .12);
  ctx.translate(0, -r.headY);

  // Ohr und Gesichtshaut liegen nur in der Vorder-/Seitenansicht vor den Haaren.
  if (!back) {
    ctx.fillStyle = K.skinShade;
    ctx.beginPath();
    ctx.arc(-7.4, HEAD_Y + 1.2, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pinsel ? pinsel.hautton(ctx, HEAD_Y, HEAD_R, K.skin, K.skinShade) : K.skin;
    ctx.beginPath();
    ctx.arc(0, HEAD_Y, HEAD_R, 0, Math.PI * 2);
    ctx.fill();
    if (state === "lie" && opts.displaylicht && opts.displaylicht.staerke > 0) {
      // Genau den Hautpfad erneut füllen. Haare, Augen und Bett werden nicht mitbelichtet.
      const { rgb, staerke } = opts.displaylicht;
      const licht = ctx.createLinearGradient(4, HEAD_Y + 8, -4, HEAD_Y - 7);
      licht.addColorStop(0, `rgba(${rgb},${staerke})`);
      licht.addColorStop(.6, `rgba(${rgb},${staerke * .48})`);
      licht.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = licht; ctx.fill();
    }
  }

  if (back) {
    ctx.fillStyle = LUNI_COLORS.hair;
    ctx.beginPath();
    ctx.arc(0, HEAD_Y - 0.6, HEAD_R + 0.8, 0, Math.PI * 2);
    if (!pinsel) ctx.fill();
    if (pinsel) imSchnitt(ctx, () => {
      if (haarraum) ctx.setTransform(haarraum);
      ctx.translate(0, HEAD_Y); pinsel.haar(ctx, "scheitel", HAIR_LEN * r.hairLen, r.hairFlow, 0);
    });
  } else if (r.bend >= 0.7) {
    // Vorgebeugt: Gesicht zeigt zum Boden. Nur beim Haarebürsten fällt der
    // lange Haarfall bis zum Boden; sonst bleibt er kurz und verdeckt das
    // Gesicht nicht. Beim kurzen Fall werden die Haare ZUERST gezeichnet,
    // danach das Gesicht – so hängt nichts davor.
    const bürstet = opts.buerstenzeit !== undefined;
    const neckX = (r.shoulderY - HEAD_Y) * Math.sin(r.neckBend);
    const neckY = r.shoulderY + (HEAD_Y - r.shoulderY) * Math.cos(r.neckBend);
    const headWorldY = r.rootY + r.hipY +
      neckX * Math.sin(r.bend) + (neckY - r.hipY) * Math.cos(r.bend);
    const frei = Math.max(6, -headWorldY - 1.6);
    const L = bürstet ? Math.max(8, frei) : Math.min(13, frei);
    const sway = state === "labBrush" ? Math.sin(t * .95 * Math.PI * 2) * 1.2
      : Math.sin(t * 1.7) * 0.5;
    const haare = () => {
      ctx.fillStyle = LUNI_COLORS.hair;
      ctx.beginPath();
      ctx.arc(-1.4, HEAD_Y - 1.6, HEAD_R + 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(0, HEAD_Y);
      ctx.rotate(-(r.bend + r.neckBend + r.headTilt));
      const w = HEAD_R + 1;
      ctx.beginPath();
      ctx.moveTo(-w, -2);
      ctx.quadraticCurveTo(-w - 0.8, L * 0.5, -w + 1.6 + sway, L);
      ctx.quadraticCurveTo(-3, L + 1.4, 0 + sway, L + 0.6);
      ctx.quadraticCurveTo(3, L + 1.4, w - 1.6 + sway, L);
      ctx.quadraticCurveTo(w + 0.8, L * 0.5, w, -2);
      ctx.closePath();
      ctx.fill();
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
    };
    if (bürstet) {
      drawFace(ctx, expr, blink, t, glasses, gaze, sick > 0.28 ? 1 : 0, singOpen, pinsel);
      haare();
    } else {
      // Kurzer Bob: Haare hinter den Kopf, dann Kopfhaut und Gesicht davor.
      haare();
      ctx.fillStyle = LUNI_COLORS.skin;
      ctx.beginPath();
      ctx.arc(0, HEAD_Y - 0.4, HEAD_R - 0.2, 0, Math.PI * 2);
      ctx.fill();
      drawFace(ctx, expr, blink, t, glasses, gaze, sick > 0.28 ? 1 : 0, singOpen, pinsel);
    }
  } else {
    // Haare neben das Ohr: weich überblenden statt umzuschalten. Ein hartes
    // Umschalten würde die Seitensträhnen für einen Moment verschwinden lassen
    // und als Blitzen des Kopfes sichtbar sein.
    const k = clamp01(hairAside);
    if (k < 0.005) {
      drawHairFront(ctx, opts.buerstenzeit !== undefined ? r.hairFlow : r.hairFlow * (1 - 0.72 * clamp01((r.bend - 0.22) / 0.5)), r.hairUp, (opts.buerstenzeit !== undefined ? 1 : 1 - 0.55 * clamp01((r.bend - 0.22) / 0.5)) * r.hairLen, pinsel);
    } else if (k > 0.995) {
      drawHairAside(ctx, k);
    } else {
      ctx.save();
      ctx.globalAlpha *= 1 - k;
      drawHairFront(ctx, opts.buerstenzeit !== undefined ? r.hairFlow : r.hairFlow * (1 - 0.72 * clamp01((r.bend - 0.22) / 0.5)), r.hairUp, (opts.buerstenzeit !== undefined ? 1 : 1 - 0.55 * clamp01((r.bend - 0.22) / 0.5)) * r.hairLen, pinsel);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= k;
      drawHairAside(ctx, k);
      ctx.restore();
    }
    drawFace(ctx, eyeRoll > 0.01 ? "annoyed" : expr, blink, t, glasses, gaze, sick > 0.28 ? 1 : 0, singOpen, pinsel, opts.zahnfrontal);
    if (opts.mundSchaum) {
      ctx.save(); ctx.globalAlpha *= opts.mundSchaum;
      ctx.fillStyle = "#abcfc9"; ctx.beginPath();
      ctx.ellipse(MUND_X, HEAD_Y + MUND_Y + 1.1, 4.8, 2.05, -.06, 0, 2 * Math.PI); ctx.fill();
      for (const [dx, dy, rad] of [[-3.65, .45, 1.6], [-2.0, -.15, 1.45], [-.5, .4, 1.8], [1.25, .05, 1.65], [3.3, .55, 1.55], [-1.5, 1.85, 1.25], [.8, 2.65, .9]]) {
        ctx.fillStyle = dy > 1 ? "#e0efe9" : "#fffef5"; ctx.beginPath();
        ctx.arc(MUND_X + dx, HEAD_Y + MUND_Y + dy, rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    if (eyeRoll > 0.01) drawEyeRoll(ctx, eyeRoll);
  }
  // Beim Recken und Strecken ragen die Arme über den Kopf: sie liegen vor den
  // langen Haaren, sonst verschwinden sie hinter dem Haarfall.
  if (reck > 0.02 && !bedCover && !back && !bent) { drawBackArm(); drawFrontArm(); }

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

  if (!bedCover && bent && !back) drawFrontArm();

  // Beim Tanzen liegen die Arme ganz vorn – auch vor Haaren und Kopf, damit
  // sie nie hinter dem Körper verschwinden (außer sie sollen es, siehe oben).
  if (!bedCover && !back && !bent && tanzt) {
    if (!r.armNearHinten) drawBackArm();
    if (!r.armFarHinten) drawFrontArm();
  }

  // Am Klavier kommt der ganze Haarumriss zuletzt, auch die linke Seitenstraehne.
  // So kann die Schulter nicht durch den zuvor hinten gezeichneten Haarteil treten.
  if (klavierHaareVorn) upperLean(() => {
    ctx.save();
    if (r.neckBend) {
      ctx.translate(0, r.shoulderY); ctx.rotate(r.neckBend); ctx.translate(0, -r.shoulderY);
    }
    ctx.translate(headShake * 1.8 + r.headX, r.headY - HEAD_Y);
    ctx.translate(0, r.headY);
    ctx.rotate(r.headTilt + headShake * 0.12);
    ctx.translate(0, -r.headY);
    drawHairBack(ctx, r.hairFlow, r.hairUp, r.hairLen, false, pinsel);
    drawHairBack(ctx, opts.buerstenzeit !== undefined ? r.hairFlow : r.hairFlow * (1 - 0.72 * clamp01((r.bend - 0.22) / 0.5)), r.hairUp, (opts.buerstenzeit !== undefined ? 1 : 1 - 0.55 * clamp01((r.bend - 0.22) / 0.5)) * r.hairLen * (wet > 0.3 ? 0.94 : 1), true, pinsel);
    ctx.restore();
  });

  ctx.restore();

  // Beide Handpositionen in Weltkoordinaten zurückgeben: damit hängen
  // Griff, Instrument und Arme zusammen (das Saxophon wird danach gezeichnet
  // und würde die Hände sonst verdecken).
  if (handOut) {
    const weltHand = (hand: V): V => {
      let [hx, hy] = hand;
      if (handKontakt && r.bend) {
        const dx = hx, dy = hy - r.hipY;
        hx = dx * Math.cos(r.bend) - dy * Math.sin(r.bend);
        hy = r.hipY + dx * Math.sin(r.bend) + dy * Math.cos(r.bend);
      }
      if (handKontakt && r.rootRot) {
        const dx = hx, dy = hy - r.pivotY;
        hx = dx * Math.cos(r.rootRot) - dy * Math.sin(r.rootRot);
        hy = r.pivotY + dx * Math.sin(r.rootRot) + dy * Math.cos(r.rootRot);
      }
      return [x + (r.rootX + hx) * scale * face, y + (r.rootY + hy) * scale];
    };
    handOut.front = weltHand(r.armFar.hand);
    handOut.rear = weltHand(r.armNear.hand);
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
  if (Math.abs(r.bend) > 0.01) {
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

/* -------------------------- Drehung: entfernt -------------------------- */

/** Zeichnet die Figur (kein 2D-Rotate mehr; die Rotationsansicht ist entfernt). */
export function drawLuni(ctx: C, x: number, y: number, opts: LuniOpts = {}, pinsel?: LuniZeichenpinsel): V {
  return renderFig(ctx, x, y, opts, pinsel);
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
