import { sfx } from "./audio";

/* =======================================================================
   LCP-1 LIFE UNIT — engine
   A tiny human lives in a cross-section dollhouse. You steer them, keep
   their needs up, grant their wishes and rack up LIFE POINTS.
   ======================================================================= */

export const W = 960;
export const H = 600;

const STEP = 1 / 60;
const GROUND_Y = 520;
const UPPER_Y = 320;
const CEIL_Y = 122;
const ROOF_Y = 92;
const WALL_L = 40;
const WALL_R = 920;
const UPPER_END = 626; // upper floor slab ends here (stairs take over)
const CHAR_HW = 11;
const GRAV = 2150;
const JUMP_V = 655;
const MOVE_SPEED = 245;
const STEP_UP = 32;
const DROP_ASSIST = 27;
const DAY_LEN = 42;

export type Phase = "attract" | "playing" | "paused" | "dying" | "over";
export type NeedKey = "hunger" | "energy" | "hygiene" | "fun" | "social";
export type IconKey = "food" | "sleep" | "clean" | "fun" | "social" | "heart" | "book" | "coin" | "star" | "spark" | "mess";

export interface NeedMeta {
  key: NeedKey;
  label: string;
  short: string;
  color: string;
  icon: IconKey;
}

export const NEEDS: NeedMeta[] = [
  { key: "hunger", label: "HUNGER", short: "FOOD", color: "#ffb648", icon: "food" },
  { key: "energy", label: "ENERGY", short: "REST", color: "#63b3ff", icon: "sleep" },
  { key: "hygiene", label: "HYGIENE", short: "CLEAN", color: "#35d6c0", icon: "clean" },
  { key: "fun", label: "FUN", short: "PLAY", color: "#ff6f61", icon: "fun" },
  { key: "social", label: "SOCIAL", short: "TALK", color: "#c3e84f", icon: "social" },
];

export interface HudState {
  score: number;
  combo: number;
  mult: number;
  comboT: number;
  needs: { key: NeedKey; v: number }[];
  vitality: number;
  day: number;
  tod: number;
  todLabel: string;
  wish: { icon: IconKey; label: string; t: number; max: number } | null;
  buff: { icon: IconKey; label: string; t: number; max: number } | null;
  prompt: { label: string; icon: IconKey } | null;
  progress: number;
  hint: string | null;
  wishes: number;
  mess: number;
}

export interface RunSummary {
  score: number;
  day: number;
  wishes: number;
  time: number;
  best: number;
}

/* ------------------------------- helpers ------------------------------ */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[(Math.random() * arr.length) | 0];
const sign = (v: number) => (v < 0 ? -1 : v > 0 ? 1 : 0);

function hexRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  const n = parseInt(s.length === 3 ? s.replace(/(.)/g, "$1$1") : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = clamp(t, 0, 1);
  return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(
    lerp(A[2], B[2], k),
  )})`;
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

/* ------------------------------- world data --------------------------- */

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Kind = "tv" | "book" | "cat" | "fridge" | "phone" | "bed" | "shower" | "desk";

interface Station {
  id: Kind;
  kind: Kind;
  label: string;
  icon: IconKey;
  x: number;
  floorY: number;
  need: NeedKey | null;
  amount: number;
  duration: number;
  base: number;
  cooldown: number;
  cd: number;
  progress: number;
  color: string;
  pose: "stand" | "sit" | "lie";
  wishable: boolean;
}

function makeStations(): Station[] {
  const s = (
    id: Kind,
    label: string,
    icon: IconKey,
    x: number,
    floorY: number,
    need: NeedKey | null,
    amount: number,
    duration: number,
    base: number,
    color: string,
    pose: Station["pose"] = "stand",
    cooldown = 0.4,
    wishable = false,
  ): Station => ({
    id,
    kind: id,
    label,
    icon,
    x,
    floorY,
    need,
    amount,
    duration,
    base,
    cooldown,
    cd: 0,
    progress: 0,
    color,
    pose,
    wishable,
  });
  return [
    s("tv", "WATCH TV", "fun", 172, GROUND_Y, "fun", 40, 1.0, 34, "#ff6f61", "sit", 0.4, true),
    s("book", "READ", "book", 452, GROUND_Y, null, 0, 1.15, 58, "#c3a2ff"),
    s("cat", "PET CAT", "heart", 552, GROUND_Y, null, 0, 0.85, 32, "#ff5d8f", "stand", 4.2),
    s("fridge", "EAT", "food", 820, GROUND_Y, "hunger", 44, 0.95, 34, "#ffb648", "stand", 0.4, true),
    s("phone", "CALL FRIEND", "social", 596, UPPER_Y, "social", 42, 1.0, 34, "#c3e84f", "stand", 0.4, true),
    s("bed", "NAP", "sleep", 132, UPPER_Y, "energy", 46, 1.45, 36, "#63b3ff", "lie", 0.4, true),
    s("shower", "SHOWER", "clean", 306, UPPER_Y, "hygiene", 44, 1.1, 34, "#35d6c0", "stand", 0.4, true),
    s("desk", "WORK", "coin", 486, UPPER_Y, null, 0, 1.3, 96, "#ffd166", "stand", 2.2),
  ];
}

interface Mess {
  x: number;
  y: number;
  t: number;
  life: number;
  kind: number;
  progress: number;
  wob: number;
}

type Shape =
  | "dot"
  | "sq"
  | "star"
  | "heart"
  | "ring"
  | "zzz"
  | "note"
  | "bubble"
  | "crumb"
  | "coin"
  | "shard"
  | "fly"
  | "spark";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  shape: Shape;
  g: number;
  rot: number;
  vr: number;
  drag: number;
}

interface FloatText {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  color: string;
  size: number;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  r1: number;
  life: number;
  max: number;
  color: string;
  w: number;
}

interface Char {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  groundY: number;
  face: number;
  walk: number;
  state: "idle" | "walk" | "air" | "act" | "cheer" | "down";
  stateT: number;
  blink: number;
  blinkT: number;
  poseT: number;
  prop: IconKey | null;
  hurtT: number;
  coyote: number;
  jumpBuf: number;
  stuck: number;
  stepSfx: number;
}

interface Wish {
  st: Station;
  t: number;
  max: number;
}

interface AutoTarget {
  x: number;
  y: number;
  st: Station | Mess | null;
}

const skyStops = [
  { t: 0.0, top: "#2c3f6d", bot: "#e79a6c", sun: "#ffd9a0", night: 0.55 },
  { t: 0.14, top: "#4b88c9", bot: "#c7e2f4", sun: "#fff3c4", night: 0.08 },
  { t: 0.38, top: "#3d8fd6", bot: "#d7edf9", sun: "#ffffff", night: 0 },
  { t: 0.58, top: "#4a6ea8", bot: "#f2b173", sun: "#ffd08a", night: 0.05 },
  { t: 0.7, top: "#2b3560", bot: "#d1695f", sun: "#ff9d6e", night: 0.42 },
  { t: 0.82, top: "#141f45", bot: "#3b3f6d", sun: "#cfd8ff", night: 0.82 },
  { t: 0.94, top: "#080e22", bot: "#16213d", sun: "#e8f0ff", night: 1 },
  { t: 1.0, top: "#2c3f6d", bot: "#e79a6c", sun: "#ffd9a0", night: 0.55 },
];

function skyAt(tod: number) {
  const t = ((tod % 1) + 1) % 1;
  let i = 0;
  while (i < skyStops.length - 2 && t > skyStops[i + 1].t) i++;
  const a = skyStops[i];
  const b = skyStops[i + 1];
  const k = clamp((t - a.t) / (b.t - a.t || 1), 0, 1);
  const smooth = k * k * (3 - 2 * k);
  return {
    top: mix(a.top, b.top, smooth),
    bot: mix(a.bot, b.bot, smooth),
    sun: mix(a.sun, b.sun, smooth),
    night: lerp(a.night, b.night, smooth),
  };
}

function todLabel(tod: number) {
  if (tod < 0.1) return "DAWN";
  if (tod < 0.3) return "MORNING";
  if (tod < 0.5) return "AFTERNOON";
  if (tod < 0.66) return "GOLDEN";
  if (tod < 0.8) return "DUSK";
  return "NIGHT";
}

/* --------------------------------- icons ------------------------------- */

export function drawIcon(
  ctx: CanvasRenderingContext2D,
  key: IconKey,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  switch (key) {
    case "food": {
      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.quadraticCurveTo(-9, 9, 0, 9);
      ctx.quadraticCurveTo(9, 9, 9, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-10, -3, 20, 4);
      ctx.beginPath();
      ctx.arc(0, -7, 9, Math.PI, 0);
      ctx.fill();
      break;
    }
    case "sleep": {
      ctx.beginPath();
      ctx.arc(0, 0, 9, Math.PI * 0.42, Math.PI * 1.72);
      ctx.arc(-3.4, 0, 6.4, Math.PI * 1.72, Math.PI * 0.42, true);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "clean": {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.bezierCurveTo(7, -2, 9, 2, 9, 5);
      ctx.arc(0, 5, 9, 0, Math.PI);
      ctx.bezierCurveTo(-9, 2, -7, -2, 0, -10);
      ctx.fill();
      break;
    }
    case "fun": {
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(9, -4);
      ctx.lineTo(7, 8);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(-4, -12);
      ctx.lineTo(-8, -8);
      ctx.moveTo(5, -12);
      ctx.lineTo(9, -4);
      ctx.stroke();
      break;
    }
    case "social": {
      rr(ctx, -10, -8, 20, 14, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, 6);
      ctx.lineTo(-1, 11);
      ctx.lineTo(2, 6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "heart": {
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.bezierCurveTo(-13, 0, -8, -10, 0, -4);
      ctx.bezierCurveTo(8, -10, 13, 0, 0, 9);
      ctx.fill();
      break;
    }
    case "book": {
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-10, 8);
      ctx.lineTo(0, 5);
      ctx.lineTo(10, 8);
      ctx.lineTo(10, -8);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "coin": {
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.35)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "star": {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 10 : 4.4;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "spark": {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.quadraticCurveTo(1.6, -1.6, 11, 0);
      ctx.quadraticCurveTo(1.6, 1.6, 0, 11);
      ctx.quadraticCurveTo(-1.6, 1.6, -11, 0);
      ctx.quadraticCurveTo(-1.6, -1.6, 0, -11);
      ctx.fill();
      break;
    }
    case "mess": {
      ctx.beginPath();
      ctx.ellipse(0, 4, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-4, -3, 3, 0, Math.PI * 2);
      ctx.arc(4, -5, 2.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

/* --------------------------------- game -------------------------------- */

export interface GameCallbacks {
  onHud: (h: HudState) => void;
  onPhase: (p: Phase) => void;
  onOver: (s: RunSummary) => void;
  onNeedPause: () => void;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: GameCallbacks;
  private sky = document.createElement("canvas");
  private skyCtx: CanvasRenderingContext2D;
  private scanPattern: CanvasPattern | null = null;
  private vignette: CanvasGradient | null = null;

  private raf = 0;
  private last = 0;
  private acc = 0;
  private hudAcc = 0;
  private skyAcc = 999;
  private scale = 1;
  private dpr = 1;
  private ro: ResizeObserver | null = null;
  private destroyed = false;

  phase: Phase = "attract";
  private elapsed = 0;
  private runTime = 0;
  private freeze = 0;

  // sim state
  private score = 0;
  private best = 0;
  private combo = 0;
  private comboT = 0;
  private vitality = 100;
  private needs: Record<NeedKey, number> = { hunger: 78, energy: 82, hygiene: 80, fun: 74, social: 70 };
  private day = 1;
  private dayT = 0;
  private tod = 0.16;
  private scoreT = 0;
  private wishesDone = 0;
  private wish: Wish | null = null;
  private wishIn = 2.4;
  private buffT = 0;
  private buffMax = 12;
  private messes: Mess[] = [];
  private messT = 12;
  private hintT = 14;
  private deathT = 0;
  private alarms = 0;

  // fx
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private rings: Ring[] = [];
  private shake = 0;
  private shakeX = 0;
  private shakeY = 0;
  private flashA = 0;
  private flashC = "#ffffff";
  private motes: { x: number; y: number; vx: number; vy: number; s: number; p: number }[] = [];
  private clouds: { x: number; y: number; s: number; v: number }[] = [];
  private stars: { x: number; y: number; s: number; p: number }[] = [];

  // input
  private keys = { left: false, right: false, interact: false };
  private autoTarget: AutoTarget | null = null;
  private autoInteract = false;
  private aiThink = 0;
  private aiTarget: Station | null = null;

  private char: Char = {
    x: 490,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    grounded: true,
    groundY: GROUND_Y,
    face: 1,
    walk: 0,
    state: "idle",
    stateT: 0,
    blink: 0,
    blinkT: 2,
    poseT: 0,
    prop: null,
    hurtT: 0,
    coyote: 0,
    jumpBuf: 0,
    stuck: 0,
    stepSfx: 0,
  };

  private platforms: Platform[] = [];
  private stations: Station[] = makeStations();
  private activeSt: Station | null = null;
  private activeMess: Mess | null = null;
  private interacting = false;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.cb = cb;
    this.sky.width = W;
    this.sky.height = H;
    const sc = this.sky.getContext("2d");
    if (!sc) throw new Error("2d context unavailable");
    this.skyCtx = sc;
    for (let i = 0; i < 74; i++) {
      this.stars.push({ x: rnd(0, W), y: rnd(0, 400), s: rnd(0.6, 1.9), p: rnd(0, 6.28) });
    }
    for (let i = 0; i < 6; i++) {
      this.clouds.push({ x: rnd(-100, W + 100), y: rnd(60, 260), s: rnd(0.6, 1.5), v: rnd(4, 13) });
    }
    for (let i = 0; i < 34; i++) {
      this.motes.push({ x: rnd(WALL_L, WALL_R), y: rnd(CEIL_Y, GROUND_Y), vx: rnd(-5, 5), vy: rnd(-7, -1), s: rnd(0.7, 2), p: rnd(0, 6.28) });
    }
    this.buildPlatforms();
    this.resize();
  }

  /* ------------------------------ lifecycle ---------------------------- */

  mount() {
    this.ro = new ResizeObserver(() => this.resize());
    if (this.canvas.parentElement) this.ro.observe(this.canvas.parentElement);
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.canvas.addEventListener("pointerdown", this.onPointer);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    this.emitHud();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.canvas.removeEventListener("pointerdown", this.onPointer);
  }

  private onVisibility = () => {
    if (document.hidden && this.phase === "playing") {
      this.phase = "paused";
      this.cb.onPhase("paused");
      this.cb.onNeedPause();
    }
  };

  resize = () => {
    const parent = this.canvas.parentElement;
    const cw = parent ? parent.clientWidth : window.innerWidth;
    const ch = parent ? parent.clientHeight : window.innerHeight;
    if (!cw || !ch) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, cw < 700 ? 1.6 : 2);
    this.scale = Math.min(cw / W, ch / H);
    const px = Math.max(1, Math.round(W * this.scale * this.dpr));
    const py = Math.max(1, Math.round(H * this.scale * this.dpr));
    if (this.canvas.width !== px || this.canvas.height !== py) {
      this.canvas.width = px;
      this.canvas.height = py;
      this.canvas.style.width = `${Math.round(W * this.scale)}px`;
      this.canvas.style.height = `${Math.round(H * this.scale)}px`;
      this.vignette = null;
      this.scanPattern = null;
    }
  };

  private buildPlatforms() {
    const p: Platform[] = [];
    p.push({ x: WALL_L, y: GROUND_Y, w: WALL_R - WALL_L, h: 44 });
    p.push({ x: WALL_L, y: UPPER_Y, w: UPPER_END - WALL_L, h: 26 });
    // open-riser staircase, ascending leftward from x=780 to x=600
    const n = 8;
    for (let i = 0; i < n; i++) {
      // treads ascend leftward; the first rise is deliberately taller than the
      // step-up tolerance so walking *under* the stairs never auto-climbs them
      const x = 754 - i * 22;
      const y = 480 - (i * 160) / (n - 1);
      p.push({ x, y, w: 26, h: 9 });
    }
    this.platforms = p;
  }

  /* -------------------------------- api -------------------------------- */

  setKey(k: "left" | "right" | "interact", v: boolean) {
    if (this.keys[k] !== v && v) sfx.ensure();
    this.keys[k] = v;
    if (v && (k === "left" || k === "right")) {
      this.goTarget(null);
      this.autoInteract = false;
    }
    if (v && k === "interact") this.autoInteract = false;
  }

  pressJump() {
    sfx.ensure();
    this.char.jumpBuf = 0.13;
    this.goTarget(null);
    this.autoInteract = false;
  }

  startRun() {
    sfx.ensure();
    this.score = 0;
    this.combo = 0;
    this.comboT = 0;
    this.vitality = 100;
    this.needs = { hunger: 80, energy: 86, hygiene: 82, fun: 74, social: 70 };
    this.day = 1;
    this.dayT = 0;
    this.runTime = 0;
    this.wishesDone = 0;
    this.buffT = 0;
    this.messes = [];
    this.messT = 13;
    this.hintT = 14;
    this.particles.length = 0;
    this.texts.length = 0;
    this.rings.length = 0;
    this.shake = 0;
    this.flashA = 0;
    this.deathT = 0;
    this.stations.forEach((s) => {
      s.cd = 0;
      s.progress = 0;
    });
    this.char.x = 490;
    this.char.y = GROUND_Y;
    this.char.vx = 0;
    this.char.vy = 0;
    this.char.state = "idle";
    this.char.face = -1;
    this.char.prop = null;
    this.char.poseT = 0;
    this.goTarget(null);
    this.autoInteract = false;
    this.aiTarget = null;
    // instant hook: first wish appears immediately and points at the fridge
    const first = this.stations.find((s) => s.id === "fridge")!;
    this.wish = { st: first, t: 20, max: 20 };
    this.wishIn = 0;
    this.phase = "playing";
    this.cb.onPhase("playing");
    this.popText(this.char.x, this.char.y - 96, "GOOD MORNING!", "#ffd166", 20);
    this.ringFx(this.char.x, this.char.y - 30, 8, 120, "#35d6c0", 5, 0.5);
    sfx.start();
    this.emitHud();
  }

  setPaused(v: boolean) {
    if (v && this.phase === "playing") {
      this.phase = "paused";
      this.keys.left = this.keys.right = this.keys.interact = false;
      this.cb.onPhase("paused");
      sfx.pause();
    } else if (!v && this.phase === "paused") {
      this.phase = "playing";
      this.last = performance.now();
      this.acc = 0;
      this.cb.onPhase("playing");
      sfx.ui();
    }
  }

  toAttract() {
    this.phase = "attract";
    this.day = 1;
    this.dayT = 0;
    this.score = 0;
    this.combo = 0;
    this.vitality = 100;
    this.buffT = 0;
    this.char.state = "idle";
    this.char.stateT = 0;
    this.char.prop = null;
    this.char.poseT = 0;
    this.needs = { hunger: 78, energy: 82, hygiene: 80, fun: 74, social: 70 };
    this.aiThink = 0;
    this.aiTarget = null;
    this.goTarget(null);
    this.stations.forEach((s) => (s.progress = 0));
    this.messes = [];
    this.particles.length = 0;
    this.texts.length = 0;
    this.wish = null;
    this.cb.onPhase("attract");
  }

  setBest(b: number) {
    this.best = b;
  }

  /* -------------------------------- loop ------------------------------- */

  private frame = (ts: number) => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dtReal = Math.min(0.05, (ts - this.last) / 1000);
    this.last = ts;
    const running = this.phase !== "paused" && this.phase !== "over";
    if (running) {
      const speed = this.phase === "dying" ? 0.4 : 1;
      this.acc += dtReal * speed;
      let steps = 0;
      while (this.acc >= STEP && steps < 5) {
        if (this.freeze > 0) this.freeze -= STEP;
        else this.update(STEP);
        this.acc -= STEP;
        steps++;
      }
      if (steps >= 5) this.acc = 0;
    } else {
      this.acc = 0;
      this.elapsed += dtReal;
      if (this.phase === "over") {
        this.decayFx(dtReal); // death shards keep falling behind the results card
      } else {
        // paused: freeze the world, let the shake settle
        this.shake *= Math.exp(-8.5 * dtReal);
        this.shakeX = rnd(-this.shake, this.shake);
        this.shakeY = rnd(-this.shake, this.shake) * 0.7;
        this.flashA = Math.max(0, this.flashA - dtReal * 2.6);
      }
    }
    this.draw(dtReal);
    this.hudAcc += dtReal;
    if (this.hudAcc >= 0.06) {
      this.hudAcc = 0;
      this.emitHud();
    }
  };

  private update(dt: number) {
    this.elapsed += dt;
    if (this.phase === "playing" || this.phase === "dying") this.runTime += dt;

    // time of day
    if (this.phase === "playing") {
      this.dayT += dt;
      if (this.dayT >= DAY_LEN) {
        this.dayT -= DAY_LEN;
        this.day++;
        const bonus = 60 * this.day;
        this.score += bonus;
        this.popText(this.char.x, this.char.y - 110, `DAY ${this.day}  +${bonus}`, "#ffd166", 22);
        this.ringFx(this.char.x, this.char.y - 40, 10, 190, "#ffb648", 6, 0.7);
        this.flash("#ffe6b0", 0.22);
        this.addShake(5);
        sfx.wish();
      }
      const totalT = this.dayT + (this.day - 1) * DAY_LEN;
      this.tod = (0.1 + totalT / (DAY_LEN * 2)) % 1;
      this.updateNeeds(dt);
      this.updateWish(dt);
      this.updateMessSpawns(dt);
      this.scoreT += dt;
      if (this.scoreT >= 1) {
        this.scoreT -= 1;
        this.score += 1 + Math.floor(this.day / 2);
      }
      if (this.hintT > 0) this.hintT -= dt;
      if (this.buffT > 0) this.buffT -= dt;
    } else if (this.phase === "attract") {
      this.tod = (this.elapsed * 0.018 + 0.2) % 1;
      this.updateAI(dt);
    } else if (this.phase === "dying") {
      this.deathT += dt;
      if (Math.random() < 0.55) {
        this.spawn({
          x: this.char.x + rnd(-24, 24),
          y: this.char.y - rnd(0, 60),
          vx: rnd(-90, 90),
          vy: rnd(-160, 40),
          life: rnd(0.4, 1),
          size: rnd(2, 5),
          color: pick(["#8fa6b2", "#35d6c0", "#ffb648", "#ff5d8f"]),
          shape: "shard",
          g: 420,
        });
      }
      if (this.deathT > 1.7) {
        this.phase = "over";
        this.cb.onPhase("over");
        this.cb.onOver({
          score: Math.floor(this.score),
          day: this.day,
          wishes: this.wishesDone,
          time: this.runTime,
          best: this.best,
        });
      }
    }

    this.comboT = Math.max(0, this.comboT - dt);
    if (this.comboT === 0 && this.combo > 0) {
      if (this.combo >= 3) this.popText(this.char.x, this.char.y - 90, "COMBO LOST", "#8fa6b2", 14);
      this.combo = 0;
    }

    this.updateChar(dt);
    this.updateInteract(dt);
    this.updateStations(dt);
    this.decayFx(dt);
    this.skyAcc += dt;
  }

  private decayFx(dt: number) {
    this.shake *= Math.exp(-8.5 * dt);
    if (this.shake < 0.05) this.shake = 0;
    const m = this.shake;
    this.shakeX = rnd(-m, m);
    this.shakeY = rnd(-m, m) * 0.7;
    this.flashA = Math.max(0, this.flashA - dt * 2.6);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.vx *= 1 - p.drag * dt;
      p.vy *= 1 - p.drag * dt * 0.5;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.shape === "fly") {
        p.x += Math.sin(p.life * 22) * 24 * dt;
        p.y += Math.cos(p.life * 17) * 18 * dt;
      }
      if (p.shape === "bubble") p.x += Math.sin(p.life * 9 + p.rot) * 12 * dt;
      const floor = p.y > 500 && p.x < UPPER_END ? GROUND_Y : p.y > 300 && p.x < UPPER_END ? UPPER_Y : GROUND_Y;
      if (p.g > 0 && p.y > floor && p.vy > 0) {
        p.y = floor;
        p.vy *= -0.34;
        p.vx *= 0.72;
        if (Math.abs(p.vy) < 24) p.vy = 0;
      }
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= 1 - 1.6 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      r.r = lerp(r.r, r.r1, 1 - Math.exp(-9 * dt));
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    for (const c of this.clouds) {
      c.x += c.v * dt;
      if (c.x > W + 160) c.x = -160;
    }
    for (const mo of this.motes) {
      mo.p += dt;
      mo.x += (mo.vx + Math.sin(mo.p * 0.7) * 6) * dt;
      mo.y += mo.vy * dt;
      if (mo.y < CEIL_Y + 6) {
        mo.y = GROUND_Y - 4;
        mo.x = rnd(WALL_L, WALL_R);
      }
      if (mo.x < WALL_L) mo.x = WALL_R;
      if (mo.x > WALL_R) mo.x = WALL_L;
    }
  }

  /* --------------------------------- sim ------------------------------- */

  private needFloor = new Set<NeedKey>();

  private updateNeeds(dt: number) {
    const ramp = 1 + (this.day - 1) * 0.12 + Math.min(0.45, this.runTime / 420);
    const rate: Record<NeedKey, number> = { hunger: 0.86, energy: 0.66, hygiene: 0.56, fun: 1.02, social: 0.74 };
    let empty = 0;
    (Object.keys(this.needs) as NeedKey[]).forEach((k) => {
      this.needs[k] = clamp(this.needs[k] - rate[k] * ramp * dt, 0, 100);
      if (this.needs[k] <= 0) empty++;
      const wasZero = this.needFloor.has(k);
      if (this.needs[k] <= 0 && !wasZero) {
        this.needFloor.add(k);
        this.hurt(6, `${NEEDS.find((n) => n.key === k)!.label} EMPTY!`);
      } else if (this.needs[k] > 4 && wasZero) {
        this.needFloor.delete(k);
      }
    });

    if (empty > 0) {
      this.vitality = clamp(this.vitality - Math.min(9, 3.2 * empty) * dt, 0, 100);
      this.alarms += dt;
      if (this.alarms > 1.4) {
        this.alarms = 0;
        sfx.alarm();
      }
      if (Math.random() < dt * 3) {
        this.spawn({
          x: this.char.x + rnd(-10, 10),
          y: this.char.y - 60,
          vx: rnd(-14, 14),
          vy: rnd(-24, -6),
          life: 1.1,
          size: rnd(2, 4),
          color: "#ff5d8f",
          shape: "dot",
          g: -12,
        });
      }
      if (this.vitality <= 0 && this.phase === "playing") this.die();
    } else {
      this.alarms = 0;
      const allGood = NEEDS.every((n) => this.needs[n.key] >= 55);
      if (allGood) this.vitality = clamp(this.vitality + 2.2 * dt, 0, 100);
      else if (NEEDS.every((n) => this.needs[n.key] >= 28))
        this.vitality = clamp(this.vitality + 0.9 * dt, 0, 100);
    }

    // ambience from low needs
    if (this.needs.hygiene < 26 && Math.random() < dt * 2.4) {
      this.spawn({
        x: this.char.x + rnd(-8, 8),
        y: this.char.y - rnd(40, 58),
        vx: rnd(-8, 8),
        vy: rnd(-26, -12),
        life: 1.3,
        size: rnd(2, 3.6),
        color: "#8bbd6a",
        shape: "bubble",
        g: -8,
      });
    }
    if (this.needs.energy < 24 && Math.random() < dt * 1.5) {
      this.spawn({
        x: this.char.x + this.char.face * 12,
        y: this.char.y - 58,
        vx: this.char.face * 12,
        vy: -26,
        life: 1.6,
        size: rnd(7, 11),
        color: "#9fc6ff",
        shape: "zzz",
        g: -6,
      });
    }
    if (this.needs.hunger < 22 && Math.random() < dt * 3) {
      this.spawn({
        x: this.char.x + rnd(-6, 6),
        y: this.char.y - 26,
        vx: rnd(-20, 20),
        vy: rnd(-30, -10),
        life: 0.6,
        size: rnd(1.6, 3),
        color: "#ffb648",
        shape: "dot",
        g: 60,
      });
    }
  }

  private hurt(shakeAmt: number, label?: string) {
    this.char.hurtT = 0.5;
    this.addShake(shakeAmt);
    this.flash("#ff5d8f", 0.24);
    this.freeze = Math.max(this.freeze, 0.05);
    if (label) this.popText(this.char.x, this.char.y - 92, label, "#ff5d8f", 16);
    for (let i = 0; i < 12; i++) {
      this.spawn({
        x: this.char.x,
        y: this.char.y - 34,
        vx: rnd(-150, 150),
        vy: rnd(-190, -20),
        life: rnd(0.35, 0.8),
        size: rnd(2, 4),
        color: pick(["#ff5d8f", "#ff8fa8", "#ffd7e2"]),
        shape: "dot",
        g: 520,
      });
    }
    sfx.hurt();
  }

  private die() {
    this.phase = "dying";
    this.deathT = 0;
    this.char.state = "down";
    this.char.stateT = 0;
    this.keys.left = this.keys.right = this.keys.interact = false;
    this.goTarget(null);
    this.addShake(24);
    this.flash("#ffffff", 0.7);
    this.freeze = 0.16;
    this.ringFx(this.char.x, this.char.y - 34, 6, 340, "#ff5d8f", 8, 0.9);
    for (let i = 0; i < 46; i++) {
      this.spawn({
        x: this.char.x + rnd(-12, 12),
        y: this.char.y - rnd(6, 56),
        vx: rnd(-260, 260),
        vy: rnd(-360, 60),
        life: rnd(0.6, 1.5),
        size: rnd(2, 6),
        color: pick(["#ff5d8f", "#ffb648", "#35d6c0", "#eef7f2", "#63b3ff"]),
        shape: "shard",
        g: 620,
      });
    }
    sfx.over();
    this.cb.onPhase("dying");
  }

  private updateWish(dt: number) {
    if (!this.wish) {
      this.wishIn -= dt;
      if (this.wishIn <= 0) this.newWish();
      return;
    }
    this.wish.t -= dt;
    if (this.wish.t <= 0) {
      this.popText(this.char.x, this.char.y - 96, "WISH FADED…", "#8fa6b2", 15);
      this.combo = 0;
      this.comboT = 0;
      this.vitality = clamp(this.vitality - 3, 0, 100);
      this.addShake(3);
      sfx.deny();
      this.wish = null;
      this.wishIn = 1.6;
    }
  }

  private newWish() {
    const pool = this.stations.filter((s) => s.wishable);
    let st: Station;
    if (Math.random() < 0.62) {
      st = pool.reduce((a, b) =>
        (a.need ? this.needs[a.need] : 100) <= (b.need ? this.needs[b.need] : 100) ? a : b,
      );
    } else st = pick(pool);
    const max = clamp(19 - this.day * 0.7, 9.5, 19);
    this.wish = { st, t: max, max };
    const lines: Record<string, string> = {
      fridge: "I'M STARVING!",
      bed: "SO SLEEPY…",
      shower: "I NEED A SHOWER",
      tv: "BORING! TV?",
      phone: "LONELY…",
    };
    this.popText(this.char.x, this.char.y - 100, lines[st.id] ?? "…", st.color, 15);
    this.ringFx(st.x, st.floorY - 46, 4, 62, st.color, 3, 0.5);
    sfx.tick();
  }

  private updateMessSpawns(dt: number) {
    this.messT -= dt;
    if (this.messT <= 0) {
      this.messT = clamp(19 - this.day * 0.9, 7.5, 19) * rnd(0.75, 1.3);
      if (this.messes.length < 3) this.spawnMess();
    }
    for (let i = this.messes.length - 1; i >= 0; i--) {
      const m = this.messes[i];
      m.t += dt;
      m.wob += dt;
      if (m.t > m.life) {
        this.messes.splice(i, 1);
        this.needs.hygiene = clamp(this.needs.hygiene - 11, 0, 100);
        this.vitality = clamp(this.vitality - 3, 0, 100);
        this.popText(m.x, m.y - 40, "FILTH!", "#8bbd6a", 15);
        this.addShake(4);
        for (let k = 0; k < 10; k++) {
          this.spawn({
            x: m.x + rnd(-14, 14),
            y: m.y - rnd(0, 20),
            vx: rnd(-40, 40),
            vy: rnd(-70, -10),
            life: rnd(0.7, 1.4),
            size: rnd(2, 4),
            color: pick(["#8bbd6a", "#6d9455", "#b7cf9a"]),
            shape: "fly",
            g: -6,
          });
        }
        sfx.deny();
      }
    }
  }

  private spawnMess() {
    const upper = Math.random() < 0.45;
    const y = upper ? UPPER_Y : GROUND_Y;
    let x = 0;
    for (let tries = 0; tries < 12; tries++) {
      x = upper ? rnd(80, 580) : rnd(90, 890);
      if (this.stations.every((s) => s.floorY !== y || Math.abs(s.x - x) > 62)) break;
    }
    if (Math.abs(this.char.x - x) < 70 && this.char.groundY === y) x = clamp(x + 130, 90, 890);
    this.messes.push({ x, y, t: 0, life: 22, kind: (Math.random() * 3) | 0, progress: 0, wob: 0 });
    this.popText(x, y - 46, "MESS!", "#8bbd6a", 14);
    this.ringFx(x, y - 8, 3, 46, "#8bbd6a", 3, 0.45);
    sfx.tick();
  }

  /* ------------------------------- character --------------------------- */

  private mult() {
    const m = 1 + Math.min(3, Math.floor(this.combo / 3) * 0.5);
    return this.buffT > 0 ? m * 2 : m;
  }

  private updateChar(dt: number) {
    const c = this.char;
    const dead = this.phase === "dying" || this.phase === "over";
    let dir = 0;
    if (!dead) {
      if (this.keys.left) dir -= 1;
      if (this.keys.right) dir += 1;
      if (dir === 0 && this.autoTarget) dir = this.autoDir();
    }
    const busy = this.interacting && !dead;
    if (busy) dir = 0;

    const energyF = 0.62 + 0.38 * clamp(this.needs.energy / 100, 0, 1);
    const moodF = this.vitality < 30 ? 0.78 : 1;
    const spd = dead ? 0 : MOVE_SPEED * energyF * moodF;
    const target = dir * spd;
    const accel = c.grounded ? 2600 : 1500;
    c.vx += clamp(target - c.vx, -accel * dt, accel * dt);
    if (dir === 0 && c.grounded) c.vx *= Math.exp(-16 * dt);
    if (Math.abs(c.vx) < 3 && dir === 0) c.vx = 0;
    if (dir !== 0) c.face = dir;

    c.x = clamp(c.x + c.vx * dt, WALL_L + CHAR_HW + 4, WALL_R - CHAR_HW - 2);

    // hop onto the first tread when routing upstairs (tap-to-walk / attract AI)
    if (!dead && c.grounded && dir < 0 && c.groundY > 500 && c.x > 742 && c.x < 812 && this.wantsUp()) {
      c.jumpBuf = Math.max(c.jumpBuf, 0.08);
    }

    // step-up: the staircase behaves like a ramp once you are on it
    if (!dead && c.grounded && Math.abs(c.vx) > 4) {
      let stepTo: Platform | null = null;
      for (const p of this.platforms) {
        if (c.x + CHAR_HW < p.x || c.x - CHAR_HW > p.x + p.w) continue;
        const rise = c.y - p.y;
        if (rise > 0.5 && rise <= STEP_UP) {
          if (!stepTo || p.y > stepTo.y) stepTo = p;
        }
      }
      if (stepTo) {
        c.y = stepTo.y;
        c.vy = 0;
      }
    }

    // vertical
    const prevY = c.y;
    c.vy += GRAV * dt;
    if (c.vy > 1150) c.vy = 1150;
    c.y += c.vy * dt;

    let landed: Platform | null = null;
    for (const p of this.platforms) {
      if (c.x + CHAR_HW < p.x || c.x - CHAR_HW > p.x + p.w) continue;
      if (c.vy >= 0 && prevY <= p.y + 0.6 && c.y >= p.y) {
        if (!landed || p.y < landed.y) landed = p;
      }
    }
    if (landed) {
      const wasAir = !c.grounded;
      const impact = c.vy;
      c.y = landed.y;
      c.vy = 0;
      c.grounded = true;
      c.coyote = 0.09;
      if (wasAir) this.landFx(impact);
    } else {
      c.grounded = false;
      c.coyote = Math.max(0, c.coyote - dt);
      // step-up while walking (staircase ramp)
      if (Math.abs(c.vx) > 4 && c.vy >= 0) {
        let best: Platform | null = null;
        for (const p of this.platforms) {
          if (c.x + CHAR_HW < p.x || c.x - CHAR_HW > p.x + p.w) continue;
          const rise = c.y - p.y;
          if (rise > 0.5 && rise <= STEP_UP) {
            if (!best || p.y > best.y) best = p;
          }
        }
        if (best) {
          c.y = best.y;
          c.vy = 0;
          c.grounded = true;
          c.coyote = 0.09;
        }
      }
      // drop assist so descending stairs stays smooth
      if (!c.grounded && c.vy >= 0 && c.vy < 260) {
        for (const p of this.platforms) {
          if (c.x + CHAR_HW < p.x || c.x - CHAR_HW > p.x + p.w) continue;
          const d = p.y - c.y;
          if (d > -1 && d <= DROP_ASSIST) {
            c.y = p.y;
            c.vy = 0;
            c.grounded = true;
            c.coyote = 0.09;
            break;
          }
        }
      }
    }
    if (c.grounded) c.groundY = c.y;

    // jump
    c.jumpBuf = Math.max(0, c.jumpBuf - dt);
    if (!dead && c.jumpBuf > 0 && (c.grounded || c.coyote > 0)) {
      c.vy = -JUMP_V;
      c.grounded = false;
      c.coyote = 0;
      c.jumpBuf = 0;
      c.vx = c.vx === 0 ? c.face * 40 : c.vx;
      sfx.jump();
      for (let i = 0; i < 9; i++) {
        this.spawn({
          x: c.x + rnd(-9, 9),
          y: c.y - 2,
          vx: rnd(-90, 90),
          vy: rnd(-40, 20),
          life: rnd(0.2, 0.45),
          size: rnd(1.6, 3.4),
          color: "rgba(220,240,235,.75)",
          shape: "dot",
          g: 120,
        });
      }
    }
    if (!dead && !this.keys.interact && c.vy < -180 && this.jumpHeld === false) c.vy *= 0.94;

    // footsteps
    if (c.grounded && Math.abs(c.vx) > 30) {
      c.stepSfx += Math.abs(c.vx) * dt;
      if (c.stepSfx > 46) {
        c.stepSfx = 0;
        sfx.step(c.groundY === UPPER_Y ? 1.25 : 1);
        if (Math.random() < 0.5)
          this.spawn({
            x: c.x - c.face * 6,
            y: c.y - 1,
            vx: -c.face * rnd(10, 40),
            vy: rnd(-24, -6),
            life: 0.34,
            size: rnd(1.2, 2.6),
            color: "rgba(200,220,215,.4)",
            shape: "dot",
            g: 90,
          });
      }
    }

    // state
    c.stateT += dt;
    if (dead) c.state = "down";
    else if (busy) c.state = "act";
    else if (c.stateT < 0.42 && c.state === "cheer") c.state = "cheer";
    else if (!c.grounded) c.state = "air";
    else if (Math.abs(c.vx) > 24) c.state = "walk";
    else c.state = "idle";

    c.walk += (c.grounded ? Math.abs(c.vx) * dt * 0.055 : 6 * dt);
    c.blinkT -= dt;
    if (c.blinkT <= 0) {
      c.blinkT = rnd(1.6, 5);
      c.blink = 0.13;
    }
    c.blink = Math.max(0, c.blink - dt);
    c.hurtT = Math.max(0, c.hurtT - dt);

    const wantPose = c.state === "act" && this.activeSt ? this.activeSt.pose : "stand";
    c.poseT = clamp(c.poseT + (wantPose === "stand" ? -dt * 6 : dt * 6), 0, 1);
  }

  private jumpHeld = true;
  setJumpHeld(v: boolean) {
    this.jumpHeld = v;
  }

  private landFx(vy: number) {
    const c = this.char;
    const impact = clamp(Math.abs(vy) / 700, 0, 1);
    if (impact > 0.28) {
      this.addShake(impact * 4);
      sfx.land();
    }
    for (let i = 0; i < 6 + impact * 8; i++) {
      this.spawn({
        x: c.x + rnd(-10, 10),
        y: c.y - 1,
        vx: rnd(-110, 110),
        vy: rnd(-50, -6),
        life: rnd(0.18, 0.4),
        size: rnd(1.4, 3),
        color: "rgba(214,232,226,.6)",
        shape: "dot",
        g: 190,
      });
    }
  }

  /** set an auto-walk destination (tap / click / attract-mode brain) */
  private goTarget(t: AutoTarget | null) {
    this.autoTarget = t;
    if (!t) {
      this.path.length = 0;
      this.pathI = 0;
      return;
    }
    const c = this.char;
    const fromY = c.groundY;
    const pts: { x: number; y: number }[] = [];
    if (t.y < fromY - 24) {
      if (fromY > 500) pts.push({ x: 772, y: GROUND_Y });
      pts.push({ x: 606, y: UPPER_Y });
    } else if (t.y > fromY + 24) {
      if (fromY < 344) pts.push({ x: 642, y: UPPER_Y });
      pts.push({ x: 812, y: GROUND_Y });
    }
    pts.push({ x: t.x, y: t.y });
    this.path = pts;
    this.pathI = 0;
  }

  private path: { x: number; y: number }[] = [];
  private pathI = 0;

  private autoDir(): number {
    const c = this.char;
    if (this.pathI >= this.path.length) return 0;
    const wp = this.path[this.pathI];
    const reached = Math.abs(c.x - wp.x) < 15 && Math.abs(c.groundY - wp.y) < 36;
    if (reached) {
      this.pathI++;
      if (this.pathI >= this.path.length) return 0;
    }
    const w = this.path[Math.min(this.pathI, this.path.length - 1)];
    if (Math.abs(w.x - c.x) < 8) return 0;
    return sign(w.x - c.x);
  }

  /** true while the current route waypoint is on the upper floor */
  private wantsUp(): boolean {
    const wp = this.path[this.pathI];
    return !!this.autoTarget && !!wp && wp.y < 500;
  }

  private autoArrived(): boolean {
    return !!this.autoTarget && this.pathI >= this.path.length;
  }

  /** attract-mode brain: the little person lives their own life */
  private updateAI(dt: number) {
    this.aiThink -= dt;
    const c = this.char;
    // keep the demo healthy and interactions always available
    (Object.keys(this.needs) as NeedKey[]).forEach((k) => {
      this.needs[k] = clamp(this.needs[k], 48, 82);
    });
    this.vitality = clamp(this.vitality + 20 * dt, 0, 100);
    this.score = 0;
    this.combo = 0;
    if (!this.autoTarget && this.aiThink <= 0) {
      this.aiThink = rnd(1.4, 3.6);
      const st = this.aiTarget ?? pick(this.stations);
      this.aiTarget = null;
      this.goTarget({ x: st.x, y: st.floorY, st });
      this.autoInteract = true;
    }
    if (c.state === "act" && Math.random() < dt * 0.4) this.aiThink = Math.min(this.aiThink, 0.6);
    if (!this.autoTarget) return;
    if (this.autoArrived()) {
      if (this.autoInteract) return;
      this.goTarget(null);
    }
    if (Math.random() < dt * 0.2 && c.grounded) c.jumpBuf = 0.05;
  }

  /* ------------------------------ interaction -------------------------- */

  private nearestInteractable(): { st: Station | null; mess: Mess | null } {
    const c = this.char;
    let st: Station | null = null;
    let sd = 1e9;
    for (const s of this.stations) {
      if (Math.abs(s.floorY - c.groundY) > 30) continue;
      const d = Math.abs(s.x - c.x);
      if (d < 48 && d < sd) {
        sd = d;
        st = s;
      }
    }
    let mess: Mess | null = null;
    let md = 1e9;
    for (const m of this.messes) {
      if (Math.abs(m.y - c.groundY) > 30) continue;
      const d = Math.abs(m.x - c.x);
      if (d < 44 && d < md) {
        md = d;
        mess = m;
      }
    }
    if (mess && md < sd) st = null;
    else mess = null;
    return { st, mess };
  }

  private canUse(st: Station): boolean {
    if (st.cd > 0) return false;
    if (st.id === "desk" && this.needs.energy < 18) return false;
    if (st.need && this.needs[st.need] >= 99.5 && !this.wishMatch(st)) return false;
    return true;
  }

  private wishMatch(st: Station) {
    return this.wish && this.wish.st.id === st.id;
  }

  private updateInteract(dt: number) {
    const c = this.char;
    const { st, mess } = this.nearestInteractable();
    this.activeSt = st;
    this.activeMess = mess;
    const dead = this.phase === "dying" || this.phase === "over";
    const nearTarget: Station | Mess | null = st ?? mess;
    // auto-interact only fires on the thing the player actually pointed at
    const autoHold = this.autoInteract && !!this.autoTarget && this.autoTarget.st === nearTarget;
    const wantHold = (this.keys.interact || autoHold) && !dead;

    // auto-target arrival check
    if (this.autoTarget && this.autoArrived()) {
      if (!this.autoTarget.st) {
        this.goTarget(null);
        this.autoInteract = false;
      } else {
        c.vx *= 0.3; // brake into the interaction spot
      }
    }
    const target: Station | Mess | null = st ?? mess;
    if (!target || !wantHold || c.state === "down") {
      this.interacting = false;
      c.prop = null;
      if (st) st.progress = Math.max(0, st.progress - dt * 1.8);
      if (mess) mess.progress = Math.max(0, mess.progress - dt * 1.8);
      if (this.autoInteract && this.autoTarget && !target && this.autoArrived()) {
        // walked all the way to something we cannot use right now
        this.autoInteract = false;
        this.goTarget(null);
        if (this.phase === "playing") sfx.deny();
      }
      return;
    }

    this.interacting = true;
    if (st) {
      if (!this.canUse(st)) {
        if (this.keys.interact && Math.random() < dt * 4) {
          sfx.deny();
          this.popText(
            c.x,
            c.y - 92,
            st.id === "desk" ? "TOO TIRED!" : st.need && this.needs[st.need] >= 99.5 ? "ALL FULL" : "NOT READY",
            "#8fa6b2",
            14,
          );
        }
        this.autoInteract = false;
        this.goTarget(null);
        st.progress = Math.max(0, st.progress - dt * 2);
        return;
      }
      st.progress += dt / st.duration;
      c.state = "act";
      c.stateT = 0;
      c.prop = st.icon;
      this.actParticles(st, dt);
      if (Math.random() < dt * 6) sfx.tick();
      if (st.progress >= 1) this.completeStation(st);
    } else if (mess) {
      mess.progress += dt / 0.55;
      c.state = "act";
      c.prop = "spark";
      if (Math.random() < dt * 12)
        this.spawn({
          x: mess.x + rnd(-16, 16),
          y: mess.y - rnd(2, 26),
          vx: rnd(-40, 40),
          vy: rnd(-90, -20),
          life: rnd(0.3, 0.6),
          size: rnd(1.6, 3.4),
          color: pick(["#eef7f2", "#35d6c0", "#c3e84f"]),
          shape: "spark" as Shape,
          g: 120,
        });
      if (mess.progress >= 1) this.cleanMess(mess);
    }
  }

  private actParticles(st: Station, dt: number) {
    const px = st.x;
    const py = st.floorY;
    switch (st.id) {
      case "fridge":
        if (Math.random() < dt * 16)
          this.spawn({
            x: px + rnd(-8, 8),
            y: py - 46,
            vx: rnd(-70, 70),
            vy: rnd(-140, -40),
            life: rnd(0.3, 0.7),
            size: rnd(2, 4),
            color: pick(["#ffb648", "#ff6f61", "#c3e84f", "#f2e6cf"]),
            shape: "crumb",
            g: 620,
          });
        break;
      case "shower":
        for (let i = 0; i < 2; i++)
          if (Math.random() < dt * 46)
            this.spawn({
              x: px + rnd(-20, 20),
              y: py - 96,
              vx: rnd(-16, 16),
              vy: rnd(60, 190),
              life: rnd(0.3, 0.6),
              size: rnd(1.2, 2.6),
              color: "rgba(160,235,255,.9)",
              shape: "dot",
              g: 320,
            });
        if (Math.random() < dt * 9)
          this.spawn({
            x: px + rnd(-22, 22),
            y: py - rnd(30, 90),
            vx: rnd(-14, 14),
            vy: rnd(-42, -18),
            life: rnd(0.7, 1.4),
            size: rnd(3, 7),
            color: "rgba(220,250,255,.55)",
            shape: "bubble",
            g: -14,
          });
        break;
      case "bed":
        if (Math.random() < dt * 2.4)
          this.spawn({
            x: px + rnd(6, 20),
            y: py - 44,
            vx: rnd(6, 22),
            vy: rnd(-34, -18),
            life: rnd(1.1, 1.8),
            size: rnd(8, 13),
            color: "#bfe0ff",
            shape: "zzz",
            g: -8,
          });
        break;
      case "tv":
        if (Math.random() < dt * 14)
          this.spawn({
            x: px + rnd(-16, 16),
            y: py - rnd(30, 60),
            vx: rnd(-30, 30),
            vy: rnd(-90, -30),
            life: rnd(0.5, 1),
            size: rnd(4, 8),
            color: pick(["#ff6f61", "#ffd166", "#63b3ff", "#c3e84f"]),
            shape: "note",
            g: -22,
          });
        break;
      case "phone":
        if (Math.random() < dt * 8)
          this.spawn({
            x: px + rnd(-6, 6),
            y: py - 62,
            vx: rnd(-24, 24),
            vy: rnd(-70, -30),
            life: rnd(0.5, 1),
            size: rnd(4, 8),
            color: pick(["#c3e84f", "#eef7f2"]),
            shape: "heart",
            g: -20,
          });
        break;
      case "book":
        if (Math.random() < dt * 12)
          this.spawn({
            x: px + rnd(-10, 10),
            y: py - 56,
            vx: rnd(-30, 30),
            vy: rnd(-80, -20),
            life: rnd(0.5, 1.1),
            size: rnd(4, 8),
            color: pick(["#c3a2ff", "#ffd166", "#eef7f2"]),
            shape: "star",
            g: -18,
          });
        break;
      case "desk":
        if (Math.random() < dt * 10)
          this.spawn({
            x: px + rnd(-12, 12),
            y: py - 48,
            vx: rnd(-40, 40),
            vy: rnd(-120, -40),
            life: rnd(0.4, 0.9),
            size: rnd(4, 7),
            color: "#ffd166",
            shape: "coin",
            g: 420,
          });
        break;
      case "cat":
        if (Math.random() < dt * 12)
          this.spawn({
            x: px + rnd(-14, 14),
            y: py - 26,
            vx: rnd(-30, 30),
            vy: rnd(-80, -30),
            life: rnd(0.6, 1.2),
            size: rnd(5, 9),
            color: pick(["#ff5d8f", "#ffa8c4"]),
            shape: "heart",
            g: -24,
          });
        break;
    }
  }

  private completeStation(st: Station) {
    const c = this.char;
    st.progress = 0;
    st.cd = st.cooldown;
    const wishHit = !!this.wishMatch(st);
    const mult = this.mult();
    let gained = st.base;
    if (wishHit) gained += 130;
    gained = Math.round(gained * mult);
    this.score += gained;
    this.combo++;
    this.comboT = 6.5;
    this.vitality = clamp(this.vitality + (wishHit ? 6 : 1.2), 0, 100);

    if (st.need) this.needs[st.need] = clamp(this.needs[st.need] + st.amount, 0, 100);

    const px = st.x;
    const py = st.floorY - 44;
    this.popText(px, py - 22, `+${gained}`, wishHit ? "#ffd166" : st.color, wishHit ? 30 : 22);
    if (mult > 1) this.popText(px, py - 50, `x${mult.toFixed(1)} COMBO ${this.combo}`, "#35d6c0", 15);
    if (wishHit) {
      this.popText(px, py - 76, "WISH GRANTED!", "#ff5d8f", 20);
      this.wishesDone++;
      this.wish = null;
      this.wishIn = rnd(1.4, 2.6);
      sfx.wish();
      this.ringFx(px, py, 8, 240, "#ffd166", 7, 0.7);
      this.confetti(px, py - 10, 40);
      this.flash("#ffe6b0", 0.3);
      this.addShake(11);
      this.freeze = 0.07;
    } else {
      sfx.complete(this.combo);
      this.addShake(5.5);
      this.ringFx(px, py, 5, 108, st.color, 4, 0.42);
      this.flash(st.color, 0.12);
    }

    switch (st.id) {
      case "fridge":
        this.burst(px, py, 22, ["#ffb648", "#ff6f61", "#c3e84f", "#f2e6cf"], "crumb", 200, 520);
        this.popText(px, py - 4, "YUM!", "#ffb648", 18);
        break;
      case "shower":
        this.burst(px, py - 20, 26, ["#a0ebff", "#eef7f2", "#35d6c0"], "bubble", 130, -18);
        this.popText(px, py - 4, "SPOTLESS!", "#35d6c0", 18);
        break;
      case "bed":
        this.burst(px, py - 10, 14, ["#bfe0ff", "#63b3ff", "#eef7f2"], "zzz", 70, -26);
        this.popText(px, py - 4, "REFRESHED", "#63b3ff", 18);
        break;
      case "tv":
        this.confetti(px, py - 6, 26);
        this.popText(px, py - 4, "HAHA!", "#ff6f61", 18);
        break;
      case "phone":
        this.burst(px, py - 12, 20, ["#c3e84f", "#ff5d8f", "#eef7f2"], "heart", 130, -28);
        this.popText(px, py - 4, "CATCHING UP", "#c3e84f", 16);
        break;
      case "book":
        this.buffT = this.buffMax;
        this.burst(px, py - 14, 24, ["#c3a2ff", "#ffd166", "#eef7f2"], "star", 150, -20);
        this.popText(px, py - 4, "INSPIRED! 2x", "#c3a2ff", 19);
        this.flash("#c3a2ff", 0.16);
        break;
      case "desk": {
        this.needs.energy = clamp(this.needs.energy - 13, 0, 100);
        this.needs.hunger = clamp(this.needs.hunger - 8, 0, 100);
        this.burst(px, py - 8, 22, ["#ffd166", "#ffe9a8", "#ffffff"], "coin", 190, 460);
        this.popText(px, py - 4, "PAID!", "#ffd166", 18);
        sfx.coin();
        break;
      }
      case "cat":
        this.vitality = clamp(this.vitality + 14, 0, 100);
        this.needs.fun = clamp(this.needs.fun + 12, 0, 100);
        this.burst(px, py + 6, 18, ["#ff5d8f", "#ffa8c4", "#ffd166"], "heart", 120, -34);
        this.popText(px, py - 4, "PURRR +HP", "#ff5d8f", 18);
        sfx.pet();
        break;
    }

    c.state = "cheer";
    c.stateT = 0;
    c.prop = null;
    if (c.grounded) c.vy = -250;
    if (this.autoInteract) {
      this.autoInteract = false;
      this.goTarget(null);
      this.aiTarget = null;
      if (this.phase === "attract") this.aiThink = rnd(0.7, 2);
    }
  }

  private cleanMess(m: Mess) {
    const gained = Math.round(48 * this.mult());
    this.score += gained;
    this.combo++;
    this.comboT = 6.5;
    this.messes.splice(this.messes.indexOf(m), 1);
    this.needs.hygiene = clamp(this.needs.hygiene + 5, 0, 100);
    this.vitality = clamp(this.vitality + 1.5, 0, 100);
    this.popText(m.x, m.y - 34, `+${gained} TIDY!`, "#35d6c0", 18);
    this.burst(m.x, m.y - 8, 24, ["#eef7f2", "#35d6c0", "#c3e84f"], "spark" as Shape, 170, -10);
    this.ringFx(m.x, m.y - 8, 4, 90, "#35d6c0", 4, 0.4);
    this.addShake(4);
    sfx.sparkle();
    if (this.autoInteract) {
      this.autoInteract = false;
      this.goTarget(null);
    }
  }

  private updateStations(dt: number) {
    for (const s of this.stations) {
      if (s.cd > 0) s.cd = Math.max(0, s.cd - dt);
      if (s !== this.activeSt && s.progress > 0 && s.cd <= 0) s.progress = Math.max(0, s.progress - dt * 1.6);
    }
  }

  /* --------------------------------- fx -------------------------------- */

  private addShake(m: number) {
    this.shake = Math.min(30, this.shake + m);
  }

  private flash(color: string, a: number) {
    this.flashC = color;
    this.flashA = Math.max(this.flashA, a);
  }

  private popText(x: number, y: number, text: string, color: string, size: number) {
    if (this.texts.length > 26) this.texts.shift();
    this.texts.push({ x, y, vy: -46, life: 1.15, max: 1.15, text, color, size });
  }

  private ringFx(x: number, y: number, r: number, r1: number, color: string, w: number, life: number) {
    if (this.rings.length > 20) this.rings.shift();
    this.rings.push({ x, y, r, r1, life, max: life, color, w });
  }

  private spawn(p: Partial<Particle> & { x: number; y: number }) {
    if (this.particles.length > 460) this.particles.shift();
    this.particles.push({
      x: p.x,
      y: p.y,
      vx: p.vx ?? 0,
      vy: p.vy ?? 0,
      life: p.life ?? 0.6,
      max: p.life ?? 0.6,
      size: p.size ?? 3,
      color: p.color ?? "#ffffff",
      shape: p.shape ?? "dot",
      g: p.g ?? 500,
      rot: p.rot ?? 0,
      vr: p.vr ?? rnd(-6, 6),
      drag: p.drag ?? 0.6,
    });
  }

  private burst(x: number, y: number, n: number, colors: string[], shape: Shape, speed: number, g: number) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2);
      const s = speed * rnd(0.25, 1);
      this.spawn({
        x: x + rnd(-6, 6),
        y: y + rnd(-6, 6),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - speed * 0.25,
        life: rnd(0.45, 1.1),
        size: rnd(2.4, 6),
        color: pick(colors),
        shape,
        g,
      });
    }
  }

  private confetti(x: number, y: number, n: number) {
    const colors = ["#ff6f61", "#ffb648", "#c3e84f", "#35d6c0", "#63b3ff", "#ff5d8f", "#eef7f2"];
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI, 0);
      const s = rnd(90, 330);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rnd(0.7, 1.5),
        size: rnd(3, 6.5),
        color: pick(colors),
        shape: Math.random() < 0.5 ? "sq" : "star",
        g: 620,
        drag: 0.4,
      });
    }
  }

  /* ------------------------------ pointer ------------------------------ */

  private toWorld(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * W,
      y: ((clientY - r.top) / r.height) * H,
    };
  }

  private onPointer = (e: PointerEvent) => {
    sfx.ensure();
    if (this.phase !== "playing" && this.phase !== "attract") return;
    e.preventDefault();
    const p = this.toWorld(e.clientX, e.clientY);
    if (this.phase === "attract") return;
    let bestSt: Station | null = null;
    let bd = 1e9;
    for (const s of this.stations) {
      const d = Math.hypot(p.x - s.x, p.y - (s.floorY - 46));
      if (d < 74 && d < bd) {
        bd = d;
        bestSt = s;
      }
    }
    let bestMess: Mess | null = null;
    let bmd = 1e9;
    for (const m of this.messes) {
      const d = Math.hypot(p.x - m.x, p.y - (m.y - 12));
      if (d < 56 && d < bmd) {
        bmd = d;
        bestMess = m;
      }
    }
    if (bestSt && bd < bmd) {
      this.goTarget({ x: bestSt.x, y: bestSt.floorY, st: bestSt });
      this.autoInteract = true;
      this.ringFx(bestSt.x, bestSt.floorY - 46, 4, 54, bestSt.color, 3, 0.4);
    } else if (bestMess) {
      this.goTarget({ x: bestMess.x, y: bestMess.y, st: bestMess });
      this.autoInteract = true;
      this.ringFx(bestMess.x, bestMess.y - 10, 4, 44, "#35d6c0", 3, 0.4);
    } else {
      const x = clamp(p.x, WALL_L + 20, WALL_R - 14);
      const floorY = x <= UPPER_END && p.y < 430 ? UPPER_Y : GROUND_Y;
      this.goTarget({ x, y: floorY, st: null });
      this.autoInteract = false;
      this.ringFx(x, floorY - 4, 3, 30, "#7fd8c8", 2, 0.35);
    }
    sfx.ui();
  };

  /* --------------------------------- hud ------------------------------- */

  private emitHud() {
    const st = this.activeSt;
    const prompt = st
      ? { label: st.label, icon: st.icon }
      : this.activeMess
        ? { label: "CLEAN UP", icon: "mess" as IconKey }
        : null;
    const h: HudState = {
      score: Math.floor(this.score),
      combo: this.combo,
      mult: this.mult(),
      comboT: this.comboT / 6.5,
      needs: NEEDS.map((n) => ({ key: n.key, v: this.needs[n.key] })),
      vitality: this.vitality,
      day: this.day,
      tod: this.tod,
      todLabel: todLabel(this.tod),
      wish: this.wish
        ? { icon: this.wish.st.icon, label: this.wish.st.label, t: this.wish.t, max: this.wish.max }
        : null,
      buff: this.buffT > 0 ? { icon: "book", label: "INSPIRED 2×", t: this.buffT, max: this.buffMax } : null,
      prompt,
      progress: st ? st.progress : this.activeMess ? this.activeMess.progress : 0,
      hint: this.phase === "playing" && this.hintT > 0 ? this.currentHint() : null,
      wishes: this.wishesDone,
      mess: this.messes.length,
    };
    this.cb.onHud(h);
  }

  private currentHint(): string {
    if (this.hintT > 10.5) return "MOVE ← →  ·  HOP ↑  ·  HOLD E TO USE";
    if (this.hintT > 7) return "GRANT WISHES FOR BIG BONUSES";
    if (this.hintT > 3.5) return "STAIRS: HOP ON, THEN HOLD ← TO CLIMB";
    return "TAP / CLICK THE HOUSE TO AUTO-WALK";
  }

  /* ================================= DRAW ============================== */

  private draw(dt: number) {
    const ctx = this.ctx;
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = true;

    if (this.skyAcc > 0.12 || !this.skyReady) {
      this.skyAcc = 0;
      this.drawSkyCache();
      this.skyReady = true;
    }

    ctx.fillStyle = "#07121a";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    this.drawShell();
    this.drawDecorBack();
    this.drawStairs();
    this.drawStations();
    this.drawMesses();
    this.drawCat(dt);
    this.drawChar();
    this.drawParticles();
    this.drawRings();
    this.drawTexts();
    this.drawNight();
    this.drawWorldUi();

    ctx.restore();

    this.drawPostFx(dt);
  }

  private skyReady = false;

  private drawSkyCache() {
    const c = this.skyCtx;
    const k = skyAt(this.tod);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, k.top);
    g.addColorStop(1, k.bot);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // stars
    if (k.night > 0.25) {
      const a = clamp((k.night - 0.25) / 0.6, 0, 1);
      for (const st of this.stars) {
        const tw = 0.55 + 0.45 * Math.sin(this.elapsed * 2 + st.p);
        c.globalAlpha = a * tw;
        c.fillStyle = "#ffffff";
        c.fillRect(st.x, st.y, st.s, st.s);
      }
      c.globalAlpha = 1;
    }

    // sun / moon
    const dayT = clamp((this.tod - 0.04) / 0.72, -0.2, 1.2);
    const sx = 90 + dayT * 780;
    const sy = 470 - Math.sin(clamp(dayT, 0, 1) * Math.PI) * 330;
    if (dayT > -0.05 && dayT < 1.05) {
      const gg = c.createRadialGradient(sx, sy, 4, sx, sy, 90);
      gg.addColorStop(0, k.sun);
      gg.addColorStop(0.18, k.sun);
      gg.addColorStop(1, "rgba(255,255,255,0)");
      c.globalAlpha = 0.85;
      c.fillStyle = gg;
      c.beginPath();
      c.arc(sx, sy, 90, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = k.sun;
      c.beginPath();
      c.arc(sx, sy, 17, 0, Math.PI * 2);
      c.fill();
    } else {
      const nt = clamp((this.tod - 0.76) / 0.24, 0, 1);
      const mx = 120 + nt * 700;
      const my = 300 - Math.sin(nt * Math.PI) * 190;
      c.globalAlpha = clamp(k.night, 0, 1);
      c.fillStyle = "#eef4ff";
      c.beginPath();
      c.arc(mx, my, 15, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = k.top;
      c.beginPath();
      c.arc(mx - 6, my - 4, 13, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }

    // distant hills
    c.fillStyle = mix("#3d6b6a", "#0b1526", k.night);
    c.beginPath();
    c.moveTo(0, 470);
    for (let x = 0; x <= W; x += 40) {
      c.lineTo(x, 470 - 26 - Math.sin(x * 0.008) * 20 - Math.cos(x * 0.021) * 10);
    }
    c.lineTo(W, H);
    c.lineTo(0, H);
    c.closePath();
    c.fill();

    // city
    c.fillStyle = mix("#28414f", "#070f1e", k.night);
    let x = 0;
    let i = 0;
    while (x < W) {
      const bw = 26 + ((i * 37) % 46);
      const bh = 40 + ((i * 53) % 96);
      c.fillRect(x, 500 - bh, bw, bh + 40);
      if (k.night > 0.35) {
        c.fillStyle = `rgba(255,205,120,${clamp((k.night - 0.3) * 1.2, 0, 0.85)})`;
        for (let wy = 500 - bh + 10; wy < 492; wy += 16) {
          for (let wx = x + 6; wx < x + bw - 8; wx += 12) {
            if (((wx * 7 + wy * 13 + i * 5) % 11) < 4) c.fillRect(wx, wy, 4, 6);
          }
        }
        c.fillStyle = mix("#28414f", "#070f1e", k.night);
      }
      x += bw + 8;
      i++;
    }
    // ground haze
    const hg = c.createLinearGradient(0, 440, 0, 540);
    hg.addColorStop(0, "rgba(255,255,255,0)");
    hg.addColorStop(1, mix("rgba(255,255,255,0)", "#0a1424", k.night * 0.9));
    c.fillStyle = hg;
    c.fillRect(0, 440, W, 100);
  }

  private windowPane(x: number, y: number, w: number, h: number, skyOffset: number, mullions = 2) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(this.sky, 0, skyOffset);
    // drifting clouds
    const k = skyAt(this.tod);
    ctx.globalAlpha = clamp(1 - k.night * 0.75, 0.14, 0.95);
    for (const c of this.clouds) {
      const cx = ((c.x + skyOffset * 0.2) % (W + 320)) - 160;
      const cy = c.y - skyOffset;
      if (cy < y - 60 || cy > y + h + 60) continue;
      ctx.fillStyle = mix("#ffffff", "#5c6b96", k.night);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 34 * c.s, 13 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 22 * c.s, cy + 4 * c.s, 22 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 24 * c.s, cy + 5 * c.s, 18 * c.s, 8 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // glass sheen
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h);
    ctx.lineTo(x + w * 0.55, y);
    ctx.lineTo(x + w * 0.78, y);
    ctx.lineTo(x + w * 0.33, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // frame
    ctx.strokeStyle = "#16262c";
    ctx.lineWidth = 7;
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    ctx.strokeStyle = "#f2e6cf";
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    ctx.lineWidth = 2.4;
    for (let i = 1; i < mullions; i++) {
      const mx = x + (w / mullions) * i;
      ctx.beginPath();
      ctx.moveTo(mx, y + 4);
      ctx.lineTo(mx, y + h - 4);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.52);
    ctx.lineTo(x + w - 4, y + h * 0.52);
    ctx.stroke();
    // sill
    ctx.fillStyle = "#e8dcc4";
    ctx.fillRect(x - 8, y + h, w + 16, 7);
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.fillRect(x - 8, y + h + 7, w + 16, 3);
  }

  private drawShell() {
    const ctx = this.ctx;
    const k = skyAt(this.tod);

    // exterior backdrop (roof + outside wall)
    ctx.fillStyle = mix("#123039", "#0a1a24", k.night);
    ctx.fillRect(0, 0, W, H);

    // roof
    ctx.fillStyle = "#1b2f38";
    ctx.beginPath();
    ctx.moveTo(10, CEIL_Y + 8);
    ctx.lineTo(W / 2, ROOF_Y - 34);
    ctx.lineTo(W - 10, CEIL_Y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#26414c";
    ctx.fillRect(6, CEIL_Y - 2, W - 12, 16);
    ctx.fillStyle = "rgba(255,255,255,.07)";
    ctx.fillRect(6, CEIL_Y - 2, W - 12, 4);

    // interior back wall (upper)
    const wallU = ctx.createLinearGradient(0, CEIL_Y, 0, UPPER_Y);
    wallU.addColorStop(0, "#2c4d59");
    wallU.addColorStop(1, "#24424e");
    ctx.fillStyle = wallU;
    ctx.fillRect(WALL_L, CEIL_Y + 14, UPPER_END - WALL_L, UPPER_Y - CEIL_Y - 14);

    // interior back wall (ground) — spans full width, taller on the right
    const wallG = ctx.createLinearGradient(0, UPPER_Y, 0, GROUND_Y);
    wallG.addColorStop(0, "#2b4a56");
    wallG.addColorStop(1, "#213c47");
    ctx.fillStyle = wallG;
    ctx.fillRect(WALL_L, UPPER_Y + 22, WALL_R - WALL_L, GROUND_Y - UPPER_Y - 22);
    // double-height right hall wall
    ctx.fillStyle = "#27454f";
    ctx.fillRect(UPPER_END, CEIL_Y + 14, WALL_R - UPPER_END, GROUND_Y - CEIL_Y - 14);

    // wallpaper stripes
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#dff5ee";
    for (let x = WALL_L; x < WALL_R; x += 34) {
      ctx.fillRect(x, CEIL_Y + 14, 12, GROUND_Y - CEIL_Y - 14);
    }
    ctx.restore();

    // wainscot / dado rail
    ctx.fillStyle = "#1d3742";
    ctx.fillRect(WALL_L, UPPER_Y - 34, UPPER_END - WALL_L, 8);
    ctx.fillRect(WALL_L, GROUND_Y - 40, WALL_R - WALL_L, 8);
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fillRect(WALL_L, UPPER_Y - 34, UPPER_END - WALL_L, 2);
    ctx.fillRect(WALL_L, GROUND_Y - 40, WALL_R - WALL_L, 2);

    // upper floor slab (from below) + floor surfaces
    ctx.fillStyle = "#16282f";
    ctx.fillRect(WALL_L, UPPER_Y, UPPER_END - WALL_L, 24);
    ctx.fillStyle = "#0f1f26";
    ctx.fillRect(WALL_L, UPPER_Y + 24, UPPER_END - WALL_L, 6);

    // wooden floor: upper
    this.drawFloorSurface(WALL_L, UPPER_Y, UPPER_END - WALL_L, 10);
    // wooden floor: ground
    this.drawFloorSurface(WALL_L, GROUND_Y, WALL_R - WALL_L, 14);

    // foundation
    ctx.fillStyle = "#0c1a20";
    ctx.fillRect(WALL_L - 8, GROUND_Y + 40, WALL_R - WALL_L + 16, H - GROUND_Y - 40);
    ctx.fillStyle = "#132a32";
    ctx.fillRect(WALL_L - 8, GROUND_Y + 40, WALL_R - WALL_L + 16, 6);

    // side walls
    ctx.fillStyle = "#16282f";
    ctx.fillRect(WALL_L - 14, CEIL_Y - 2, 14, GROUND_Y - CEIL_Y + 46);
    ctx.fillRect(WALL_R, CEIL_Y - 2, 14, GROUND_Y - CEIL_Y + 46);
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fillRect(WALL_L - 14, CEIL_Y - 2, 3, GROUND_Y - CEIL_Y + 46);
    ctx.fillRect(WALL_R + 11, CEIL_Y - 2, 3, GROUND_Y - CEIL_Y + 46);
  }

  private drawFloorSurface(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#9a6540");
    g.addColorStop(1, "#7c4e2f");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,225,190,.18)";
    ctx.fillRect(x, y, w, 2);
    ctx.strokeStyle = "rgba(60,30,15,.35)";
    ctx.lineWidth = 1;
    for (let px = x + 24; px < x + w; px += 46) {
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + h);
      ctx.stroke();
    }
    ctx.fillStyle = "#5d3a23";
    ctx.fillRect(x, y + h, w, 4);
  }

  private drawDecorBack() {
    const ctx = this.ctx;
    const t = this.elapsed;

    // ---- windows ----
    this.windowPane(250, 344, 156, 112, -30, 2); // living room
    this.windowPane(694, 150, 128, 250, -190, 2); // stairwell tall window
    this.windowPane(856, 296, 60, 98, -60, 1); // kitchen
    this.windowPane(60, 162, 118, 112, -150, 2); // bedroom

    // sunbeam through the tall window (day only)
    const k = skyAt(this.tod);
    if (k.night < 0.4) {
      ctx.save();
      ctx.globalAlpha = (0.4 - k.night) * 0.42;
      const bg = ctx.createLinearGradient(700, 150, 560, 520);
      bg.addColorStop(0, "#fff2c8");
      bg.addColorStop(1, "rgba(255,242,200,0)");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(694, 150);
      ctx.lineTo(822, 150);
      ctx.lineTo(700, GROUND_Y);
      ctx.lineTo(520, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // dust motes
    ctx.save();
    for (const m of this.motes) {
      ctx.globalAlpha = 0.16 + 0.16 * Math.sin(m.p * 2);
      ctx.fillStyle = k.night > 0.5 ? "#9fd8ff" : "#fff3cf";
      ctx.fillRect(m.x, m.y, m.s, m.s);
    }
    ctx.restore();

    // ---- living room rug ----
    ctx.fillStyle = "#b8494a";
    ctx.beginPath();
    ctx.ellipse(230, GROUND_Y + 6, 190, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d76a5f";
    ctx.beginPath();
    ctx.ellipse(230, GROUND_Y + 4, 152, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0d9a8";
    ctx.beginPath();
    ctx.ellipse(230, GROUND_Y + 4, 96, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- bedroom rug ----
    ctx.fillStyle = "#3f7f8c";
    ctx.beginPath();
    ctx.ellipse(200, UPPER_Y + 5, 140, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#59a3ac";
    ctx.beginPath();
    ctx.ellipse(200, UPPER_Y + 4, 104, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- wall clock (real sim time) ----
    const cx = 560;
    const cy = UPPER_Y - 74;
    ctx.fillStyle = "#f2e6cf";
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1b2f38";
    ctx.lineWidth = 3;
    ctx.stroke();
    const hrs = (this.tod * 24) % 12;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos((hrs / 12) * Math.PI * 2 - Math.PI / 2) * 10, cy + Math.sin((hrs / 12) * Math.PI * 2 - Math.PI / 2) * 10);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    const mins = (this.tod * 24 * 60) % 60;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos((mins / 60) * Math.PI * 2 - Math.PI / 2) * 15, cy + Math.sin((mins / 60) * Math.PI * 2 - Math.PI / 2) * 15);
    ctx.stroke();

    // ---- framed pictures ----
    const frames: [number, number, number, number, string][] = [
      [470, UPPER_Y - 96, 42, 34, "#ffb648"],
      [524, UPPER_Y - 88, 30, 26, "#35d6c0"],
      [232, UPPER_Y - 100, 38, 30, "#ff6f61"],
      [620, GROUND_Y - 150, 44, 36, "#c3e84f"],
    ];
    for (const [fx, fy, fw, fh, col] of frames) {
      ctx.fillStyle = "#e8dcc4";
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = col;
      ctx.fillRect(fx + 5, fy + 5, fw - 10, fh - 10);
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.beginPath();
      ctx.moveTo(fx + 5, fy + fh - 5);
      ctx.lineTo(fx + fw * 0.5, fy + fh * 0.42);
      ctx.lineTo(fx + fw - 5, fy + fh - 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#8a6a3c";
      ctx.lineWidth = 3;
      ctx.strokeRect(fx + 1.5, fy + 1.5, fw - 3, fh - 3);
    }

    // ---- potted plant (sways) ----
    const px = 76;
    const py = GROUND_Y;
    const sway = Math.sin(t * 1.3) * 3;
    ctx.strokeStyle = "#3f8f5f";
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.42;
      ctx.beginPath();
      ctx.moveTo(px, py - 26);
      ctx.quadraticCurveTo(px + Math.cos(a) * 26 + sway, py - 66, px + Math.cos(a) * 40 + sway * 1.6, py - 84 - Math.abs(i - 2) * -8);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? "#54b071" : "#3f8f5f";
      ctx.beginPath();
      ctx.ellipse(px + Math.cos(a) * 40 + sway * 1.6, py - 86 + Math.abs(i - 2) * 8, 11, 6, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#c96f4a";
    ctx.beginPath();
    ctx.moveTo(px - 18, py - 26);
    ctx.lineTo(px + 18, py - 26);
    ctx.lineTo(px + 13, py);
    ctx.lineTo(px - 13, py);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e08a5f";
    ctx.fillRect(px - 20, py - 30, 40, 7);

    // ---- floor lamp (living room) ----
    const lx = 606;
    ctx.strokeStyle = "#20343c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lx, GROUND_Y);
    ctx.lineTo(lx, GROUND_Y - 118);
    ctx.stroke();
    ctx.fillStyle = "#16282f";
    ctx.beginPath();
    ctx.ellipse(lx, GROUND_Y - 2, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const flick = 0.9 + Math.sin(t * 11) * 0.04 + Math.sin(t * 3.1) * 0.06;
    ctx.fillStyle = k.night > 0.3 ? `rgba(255,196,110,${0.95 * flick})` : "#e8dcc4";
    ctx.beginPath();
    ctx.moveTo(lx - 20, GROUND_Y - 118);
    ctx.lineTo(lx + 20, GROUND_Y - 118);
    ctx.lineTo(lx + 14, GROUND_Y - 148);
    ctx.lineTo(lx - 14, GROUND_Y - 148);
    ctx.closePath();
    ctx.fill();

    // ---- boxes under the stairs ----
    ctx.fillStyle = "#8a6a3c";
    ctx.fillRect(640, GROUND_Y - 26, 34, 26);
    ctx.fillStyle = "#a37f4a";
    ctx.fillRect(640, GROUND_Y - 26, 34, 5);
    ctx.fillStyle = "#7a5c33";
    ctx.fillRect(676, GROUND_Y - 20, 26, 20);

    // ---- ceiling lamps ----
    this.ceilingLamp(214, CEIL_Y + 14, 92, k.night);
    this.ceilingLamp(836, CEIL_Y + 14, 300, k.night);
  }

  private ceilingLamp(x: number, yTop: number, len: number, night: number) {
    const ctx = this.ctx;
    ctx.strokeStyle = "#1b2f38";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, yTop);
    ctx.lineTo(x, yTop + len);
    ctx.stroke();
    const on = night > 0.28;
    ctx.fillStyle = on ? "#ffd98a" : "#cbbfa6";
    ctx.beginPath();
    ctx.moveTo(x - 17, yTop + len + 16);
    ctx.lineTo(x + 17, yTop + len + 16);
    ctx.lineTo(x + 10, yTop + len);
    ctx.lineTo(x - 10, yTop + len);
    ctx.closePath();
    ctx.fill();
    if (on) {
      ctx.fillStyle = "rgba(255,214,140,.9)";
      ctx.beginPath();
      ctx.arc(x, yTop + len + 18, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawStairs() {
    const ctx = this.ctx;
    const treads = this.platforms.slice(2);
    // stringer
    ctx.strokeStyle = "#5d3a23";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(790, GROUND_Y + 2);
    ctx.lineTo(598, UPPER_Y - 4);
    ctx.stroke();
    ctx.strokeStyle = "#8a5a36";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(790, GROUND_Y - 1);
    ctx.lineTo(598, UPPER_Y - 7);
    ctx.stroke();
    for (const p of treads) {
      ctx.fillStyle = "#a06a3f";
      ctx.fillRect(p.x - 3, p.y, p.w + 6, p.h);
      ctx.fillStyle = "rgba(255,225,190,.28)";
      ctx.fillRect(p.x - 3, p.y, p.w + 6, 2);
      ctx.fillStyle = "rgba(0,0,0,.28)";
      ctx.fillRect(p.x - 3, p.y + p.h - 2, p.w + 6, 2);
    }
    // handrail
    ctx.strokeStyle = "#20343c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(792, GROUND_Y - 62);
    ctx.lineTo(614, UPPER_Y - 62);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.14)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(792, GROUND_Y - 64);
    ctx.lineTo(614, UPPER_Y - 64);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const x = 770 - i * 40;
      const y = lerp(GROUND_Y - 62, UPPER_Y - 62, (770 - x) / 160);
      const fy = lerp(GROUND_Y, UPPER_Y, (770 - x) / 160);
      ctx.strokeStyle = "#20343c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, fy - 4);
      ctx.stroke();
    }
  }

  private drawStations() {
    for (const s of this.stations) this.drawStation(s);
  }

  private drawStation(s: Station) {
    const ctx = this.ctx;
    const x = s.x;
    const y = s.floorY;
    const k = skyAt(this.tod);
    const t = this.elapsed;
    const isActive = this.activeSt === s && this.phase !== "over";
    const prog = s.progress;

    ctx.save();
    if (isActive) {
      ctx.translate(0, -Math.sin(t * 9) * 1.2);
    }

    switch (s.kind) {
      case "tv": {
        // sofa
        ctx.fillStyle = "#3f7f8c";
        rr(ctx, x - 44, y - 30, 88, 30, 8);
        ctx.fill();
        ctx.fillStyle = "#59a3ac";
        rr(ctx, x - 40, y - 44, 34, 22, 7);
        ctx.fill();
        rr(ctx, x + 4, y - 44, 34, 22, 7);
        ctx.fill();
        ctx.fillStyle = "#2f6470";
        rr(ctx, x - 50, y - 40, 12, 40, 5);
        ctx.fill();
        rr(ctx, x + 38, y - 40, 12, 40, 5);
        ctx.fill();
        // cabinet + CRT television
        const tx = x + 74;
        ctx.fillStyle = "#8a6a3c";
        ctx.fillRect(tx - 28, y - 26, 56, 26);
        ctx.fillStyle = "#6f5530";
        ctx.fillRect(tx - 28, y - 26, 56, 4);
        ctx.fillStyle = "#20343c";
        rr(ctx, tx - 26, y - 70, 52, 46, 6);
        ctx.fill();
        const flick = 0.72 + Math.sin(t * 23) * 0.1 + Math.sin(t * 7.3) * 0.12;
        const on = isActive || k.night > 0.2;
        ctx.save();
        rr(ctx, tx - 21, y - 65, 42, 36, 4);
        ctx.clip();
        if (on) {
          ctx.fillStyle = `rgba(120,215,255,${0.85 * flick})`;
          ctx.fillRect(tx - 21, y - 65, 42, 36);
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.14 * flick})`;
            ctx.fillRect(tx - 21, y - 65 + ((i * 9 + t * 40) % 40), 42, 3);
          }
          ctx.fillStyle = "#ff6f61";
          ctx.beginPath();
          ctx.arc(tx - 4 + Math.sin(t * 3) * 10, y - 46 + Math.cos(t * 2.3) * 6, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffd166";
          ctx.beginPath();
          ctx.arc(tx + 8 + Math.cos(t * 2.1) * 9, y - 52 + Math.sin(t * 3.1) * 5, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#132229";
          ctx.fillRect(tx - 21, y - 65, 42, 36);
        }
        ctx.restore();
        ctx.fillStyle = "#c96f4a";
        ctx.fillRect(tx + 16, y - 62, 5, 9);
        break;
      }
      case "book": {
        ctx.fillStyle = "#6f5530";
        ctx.fillRect(x - 34, y - 132, 68, 132);
        ctx.fillStyle = "#8a6a3c";
        ctx.fillRect(x - 30, y - 128, 60, 124);
        const cols = ["#ff6f61", "#ffb648", "#35d6c0", "#63b3ff", "#c3e84f", "#c3a2ff", "#ff5d8f"];
        for (let shelf = 0; shelf < 4; shelf++) {
          const sy = y - 122 + shelf * 31;
          ctx.fillStyle = "#5d4526";
          ctx.fillRect(x - 30, sy + 24, 60, 5);
          for (let b = 0; b < 7; b++) {
            const bw = 5 + ((b * 7 + shelf * 3) % 4);
            const bh = 17 + ((b * 5 + shelf * 7) % 7);
            ctx.fillStyle = cols[(b + shelf * 2) % cols.length];
            const bx = x - 28 + b * 8.2;
            ctx.fillRect(bx, sy + 24 - bh, bw, bh);
          }
        }
        break;
      }
      case "cat": {
        ctx.fillStyle = "#b8494a";
        ctx.beginPath();
        ctx.ellipse(x, y - 8, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d76a5f";
        ctx.beginPath();
        ctx.ellipse(x, y - 11, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "fridge": {
        // counter (kept clear of the bottom tread)
        ctx.fillStyle = "#8a6a3c";
        ctx.fillRect(x - 40, y - 40, 58, 40);
        ctx.fillStyle = "#e8dcc4";
        ctx.fillRect(x - 44, y - 47, 66, 8);
        ctx.fillStyle = "#20343c";
        ctx.fillRect(x - 32, y - 32, 12, 5);
        ctx.fillRect(x - 8, y - 32, 12, 5);
        // kettle on the counter
        ctx.fillStyle = "#c96f4a";
        rr(ctx, x - 26, y - 60, 18, 14, 4);
        ctx.fill();
        ctx.fillRect(x - 20, y - 65, 6, 5);
        if (k.night < 0.4 && Math.sin(t * 2.2) > 0.6) {
          ctx.fillStyle = "rgba(230,245,250,.35)";
          ctx.beginPath();
          ctx.arc(x - 17, y - 70 - ((t * 14) % 12), 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // fridge body
        ctx.fillStyle = "#dfe7e6";
        rr(ctx, x + 8, y - 112, 62, 112, 5);
        ctx.fill();
        ctx.fillStyle = "#c3d0cf";
        ctx.fillRect(x + 8, y - 70, 62, 4);
        ctx.fillStyle = "#93a5a4";
        ctx.fillRect(x + 15, y - 96, 4, 18);
        ctx.fillRect(x + 15, y - 62, 4, 16);
        // magnets + shopping list
        ctx.fillStyle = "#ff6f61";
        ctx.fillRect(x + 34, y - 100, 9, 9);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(x + 50, y - 92, 12, 14);
        ctx.fillStyle = "rgba(32,52,60,.5)";
        ctx.fillRect(x + 52, y - 89, 8, 1.6);
        ctx.fillRect(x + 52, y - 85, 6, 1.6);
        ctx.fillStyle = "#35d6c0";
        ctx.beginPath();
        ctx.arc(x + 38, y - 82, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "phone": {
        // wall-mounted phone + side table
        ctx.fillStyle = "#8a6a3c";
        ctx.fillRect(x - 20, y - 34, 40, 34);
        ctx.fillStyle = "#a37f4a";
        ctx.fillRect(x - 24, y - 40, 48, 8);
        ctx.fillStyle = "#20343c";
        rr(ctx, x - 14, y - 104, 30, 40, 4);
        ctx.fill();
        ctx.fillStyle = "#c3e84f";
        rr(ctx, x - 10, y - 100, 22, 16, 3);
        ctx.fill();
        ctx.fillStyle = "#0f1f26";
        for (let i = 0; i < 9; i++) ctx.fillRect(x - 7 + (i % 3) * 6, y - 80 + ((i / 3) | 0) * 5, 3, 3);
        const ring = isActive ? Math.sin(t * 26) * 3 : 0;
        ctx.fillStyle = "#eef7f2";
        ctx.beginPath();
        ctx.arc(x + 22 + ring, y - 112, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "bed": {
        ctx.fillStyle = "#6f5530";
        ctx.fillRect(x - 52, y - 12, 108, 12);
        ctx.fillStyle = "#8a6a3c";
        ctx.fillRect(x - 56, y - 52, 10, 52);
        ctx.fillRect(x + 50, y - 30, 10, 30);
        ctx.fillStyle = "#e8dcc4";
        rr(ctx, x - 50, y - 32, 102, 22, 5);
        ctx.fill();
        ctx.fillStyle = "#3f7f8c";
        rr(ctx, x - 50, y - 26, 66, 18, 5);
        ctx.fill();
        ctx.fillStyle = "#59a3ac";
        rr(ctx, x - 50, y - 26, 66, 6, 3);
        ctx.fill();
        ctx.fillStyle = "#f6f1e4";
        rr(ctx, x - 46, y - 42, 30, 14, 6);
        ctx.fill();
        break;
      }
      case "shower": {
        // tiled stall
        ctx.fillStyle = "#cfe4e6";
        ctx.fillRect(x - 40, y - 118, 82, 118);
        ctx.strokeStyle = "rgba(60,110,120,.35)";
        ctx.lineWidth = 1;
        for (let ty = y - 118; ty < y; ty += 15) {
          ctx.beginPath();
          ctx.moveTo(x - 40, ty);
          ctx.lineTo(x + 42, ty);
          ctx.stroke();
        }
        for (let tx = x - 40; tx < x + 42; tx += 16) {
          ctx.beginPath();
          ctx.moveTo(tx, y - 118);
          ctx.lineTo(tx, y);
          ctx.stroke();
        }
        ctx.fillStyle = "#9fb6b8";
        ctx.fillRect(x - 40, y - 6, 82, 6);
        // shower head
        ctx.strokeStyle = "#8fa6b2";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 30, y - 118);
        ctx.lineTo(x + 30, y - 96);
        ctx.lineTo(x + 14, y - 92);
        ctx.stroke();
        ctx.fillStyle = "#c3d0cf";
        ctx.beginPath();
        ctx.arc(x + 12, y - 90, 7, 0, Math.PI * 2);
        ctx.fill();
        if (prog > 0.02) {
          ctx.strokeStyle = "rgba(160,235,255,.75)";
          ctx.lineWidth = 1.6;
          for (let i = 0; i < 8; i++) {
            const wx = x + 6 + i * 2.6;
            const off = ((t * 260 + i * 30) % 90);
            ctx.beginPath();
            ctx.moveTo(wx, y - 86 + off);
            ctx.lineTo(wx - 1, y - 78 + off);
            ctx.stroke();
          }
        }
        break;
      }
      case "desk": {
        ctx.fillStyle = "#8a6a3c";
        ctx.fillRect(x - 44, y - 40, 88, 8);
        ctx.fillRect(x - 40, y - 32, 7, 32);
        ctx.fillRect(x + 33, y - 32, 7, 32);
        // retro computer
        ctx.fillStyle = "#dfe7e6";
        rr(ctx, x - 26, y - 78, 52, 38, 4);
        ctx.fill();
        const glow = 0.75 + Math.sin(t * 5) * 0.12;
        ctx.fillStyle = `rgba(53,214,192,${glow})`;
        rr(ctx, x - 20, y - 72, 32, 24, 3);
        ctx.fill();
        ctx.fillStyle = "rgba(10,30,30,.75)";
        for (let i = 0; i < 3; i++) {
          const lw = 8 + ((i * 11 + ((t * 6) | 0)) % 18);
          ctx.fillRect(x - 17, y - 68 + i * 7, lw, 2);
        }
        ctx.fillStyle = "#c3d0cf";
        ctx.fillRect(x + 14, y - 66, 8, 12);
        ctx.fillStyle = "#b6c4c3";
        ctx.fillRect(x - 18, y - 38, 40, 6);
        // chair
        ctx.fillStyle = "#20343c";
        ctx.fillRect(x - 62, y - 30, 8, 30);
        ctx.fillRect(x - 70, y - 34, 26, 7);
        break;
      }
    }

    // progress ring
    if (prog > 0.001) {
      const rx = x;
      const ry = y - (s.kind === "book" ? 152 : s.kind === "fridge" ? 126 : 96);
      ctx.save();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(8,20,26,.6)";
      ctx.beginPath();
      ctx.arc(rx, ry, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = s.color;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(rx, ry, 17, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 12);
      drawIcon(ctx, s.icon, rx, ry, 15, "#ffffff");
      ctx.restore();
    } else if (isActive && s.cd <= 0) {
      const ry = y - (s.kind === "book" ? 152 : s.kind === "fridge" ? 126 : 96);
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 6);
      drawIcon(ctx, s.icon, x, ry, 17, s.color);
      ctx.restore();
    }
    ctx.restore();
  }

  private drawMesses() {
    const ctx = this.ctx;
    for (const m of this.messes) {
      const urgent = m.t > m.life * 0.66;
      const pulse = urgent ? 0.5 + 0.5 * Math.sin(this.elapsed * 12) : 0;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.fillStyle = urgent ? `rgba(255,93,143,${0.2 + pulse * 0.3})` : "rgba(139,189,106,.18)";
      ctx.beginPath();
      ctx.ellipse(0, -6, 30 + pulse * 5, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = m.kind === 0 ? "#7f9c5c" : m.kind === 1 ? "#8a6a3c" : "#6d8f9c";
      ctx.beginPath();
      ctx.ellipse(0, -3, 17, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-9, -6, 8, 4, 0.3, 0, Math.PI * 2);
      ctx.ellipse(9, -5, 7, 3.6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.beginPath();
      ctx.ellipse(-4, -6, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      if (m.progress > 0.01) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(8,20,26,.6)";
        ctx.beginPath();
        ctx.arc(0, -30, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#35d6c0";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, -30, 13, -Math.PI / 2, -Math.PI / 2 + m.progress * Math.PI * 2);
        ctx.stroke();
      }
      if (Math.random() < 0.03) {
        this.spawn({
          x: m.x + rnd(-12, 12),
          y: m.y - 8,
          vx: rnd(-10, 10),
          vy: rnd(-30, -12),
          life: 0.9,
          size: 2.4,
          color: "#8bbd6a",
          shape: "fly",
          g: -4,
        });
      }
      ctx.restore();
    }
  }

  private drawCat(dt: number) {
    const ctx = this.ctx;
    const st = this.stations.find((s) => s.id === "cat")!;
    const t = this.elapsed;
    const x = st.x;
    const y = st.floorY - 12;
    const sleeping = st.progress < 0.02 && Math.sin(t * 0.32) > -0.2;
    const happy = st.progress > 0.02;
    ctx.save();
    ctx.translate(x, y);
    // tail
    ctx.strokeStyle = "#e0913f";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(13, -6);
    ctx.quadraticCurveTo(28, -10 + Math.sin(t * (happy ? 14 : 2.4)) * (happy ? 9 : 4), 26, -22 + Math.sin(t * 3) * 2);
    ctx.stroke();
    // body
    ctx.fillStyle = "#f0a94f";
    ctx.beginPath();
    ctx.ellipse(0, -8, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f7c274";
    ctx.beginPath();
    ctx.ellipse(-2, -4, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // head
    const hy = sleeping ? -14 : -20 + Math.sin(t * 2) * 0.8;
    ctx.fillStyle = "#f0a94f";
    ctx.beginPath();
    ctx.arc(-13, hy, 10, 0, Math.PI * 2);
    ctx.fill();
    // ears
    ctx.beginPath();
    ctx.moveTo(-20, hy - 6);
    ctx.lineTo(-22, hy - 15);
    ctx.lineTo(-14, hy - 9);
    ctx.closePath();
    ctx.moveTo(-8, hy - 8);
    ctx.lineTo(-4, hy - 15);
    ctx.lineTo(-3, hy - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff9eb5";
    ctx.beginPath();
    ctx.moveTo(-19, hy - 8);
    ctx.lineTo(-20, hy - 12);
    ctx.lineTo(-16, hy - 9);
    ctx.closePath();
    ctx.fill();
    // face
    const blink = Math.sin(t * 1.7) > 0.985;
    ctx.fillStyle = "#20343c";
    if (sleeping || blink) {
      ctx.fillRect(-18, hy - 1, 4, 1.4);
      ctx.fillRect(-11, hy - 1, 4, 1.4);
    } else {
      ctx.beginPath();
      ctx.arc(-16.5, hy - 1, 1.7, 0, Math.PI * 2);
      ctx.arc(-9.5, hy - 1, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ff9eb5";
    ctx.beginPath();
    ctx.arc(-13, hy + 3, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = 0.8;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(-13 + i * 4, hy + 3);
      ctx.lineTo(-13 + i * 12, hy + 1 + i * 0);
      ctx.moveTo(-13 + i * 4, hy + 4.4);
      ctx.lineTo(-13 + i * 12, hy + 6);
      ctx.stroke();
    }
    ctx.restore();
    if (sleeping && Math.random() < dt * 1.2) {
      this.spawn({
        x: x - 20,
        y: y - 26,
        vx: -12,
        vy: -22,
        life: 1.5,
        size: 7,
        color: "#bfe0ff",
        shape: "zzz",
        g: -6,
      });
    }
    if (happy && Math.random() < dt * 8) {
      this.spawn({
        x: x + rnd(-16, 10),
        y: y - 24,
        vx: rnd(-20, 20),
        vy: rnd(-60, -25),
        life: 0.9,
        size: rnd(4, 7),
        color: "#ff5d8f",
        shape: "heart",
        g: -20,
      });
    }
  }

  private drawChar() {
    const ctx = this.ctx;
    const c = this.char;
    const t = this.elapsed;
    const skin = "#f4c9a0";
    const hair = "#4a3126";
    const shirt = "#e8a33d";
    const shirtDark = "#c9862c";
    const pants = "#33566b";
    const shoe = "#20343c";

    // shadow
    const airT = clamp((GROUND_Y - c.y) / 200, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.3 * (1 - airT * 0.6);
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(c.x, c.groundY + 2, 14 * (1 - airT * 0.35), 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const hurt = c.hurtT > 0 && Math.sin(t * 60) > 0;
    ctx.save();
    ctx.translate(c.x, c.y);

    const walkAmt = c.state === "walk" ? Math.min(1, Math.abs(c.vx) / MOVE_SPEED) : 0;
    const bob = c.state === "walk" ? Math.abs(Math.sin(c.walk * Math.PI)) * 2.4 : Math.sin(t * 2.2) * 0.9;
    let squashX = 1;
    let squashY = 1;
    if (c.state === "air") {
      squashY = c.vy < 0 ? 1.1 : 1.04;
      squashX = c.vy < 0 ? 0.92 : 0.98;
    }
    if (c.state === "cheer") {
      const p = clamp(c.stateT / 0.42, 0, 1);
      squashY = 1 + Math.sin(p * Math.PI) * 0.14;
      squashX = 1 - Math.sin(p * Math.PI) * 0.1;
    }
    ctx.scale(c.face * squashX, squashY);
    if (c.state === "down") {
      const fall = clamp(c.stateT / 0.45, 0, 1);
      ctx.rotate(-1.42 * fall * fall);
      ctx.translate(0, -3 * fall);
      ctx.globalAlpha = this.phase === "dying" ? clamp(1.15 - (this.deathT - 0.85) / 0.75, 0, 1) : 0;
    }

    const lie = c.poseT > 0.5 && this.activeSt?.pose === "lie" ? 1 : 0;
    const sit = c.poseT > 0.2 && this.activeSt?.pose === "sit" ? c.poseT : 0;

    if (lie) {
      // sleeping on the bed: blanket lump + head
      ctx.save();
      ctx.translate(-6, -30);
      ctx.fillStyle = "#f4c9a0";
      ctx.beginPath();
      ctx.arc(24, 4, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(24, 2, 9.6, Math.PI * 1.05, Math.PI * 2.1);
      ctx.fill();
      ctx.fillStyle = "#20343c";
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

    const legPhase = c.walk * Math.PI * 2;
    const legSwing = c.state === "walk" ? 0.62 * walkAmt + 0.1 : c.state === "air" ? 0.3 : 0.06;
    const armSwing = c.state === "walk" ? 0.55 * walkAmt + 0.08 : 0.05;
    const yOff = -bob;

    // legs
    ctx.strokeStyle = pants;
    ctx.lineWidth = 6.2;
    ctx.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      const ph = legPhase + (i === 0 ? 0 : Math.PI);
      const sw = Math.sin(ph) * legSwing;
      const lift = Math.max(0, Math.cos(ph)) * (c.state === "walk" ? 4 : 0);
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
      // shoe
      ctx.fillStyle = shoe;
      if (sit > 0) ctx.fillRect(9 + sit * 4, -4 + sit * 2, 10, 4);
      else ctx.fillRect(sw * 15 - 4, -3 - lift, 11, 4);
    }

    // torso
    ctx.fillStyle = hurt ? "#ff8fa8" : shirt;
    rr(ctx, -8, -38 + yOff, 16, 20, 6);
    ctx.fill();
    ctx.fillStyle = hurt ? "#ff6f8c" : shirtDark;
    rr(ctx, -8, -24 + yOff, 16, 6, 3);
    ctx.fill();

    // back arm
    ctx.strokeStyle = hurt ? "#ff8fa8" : shirt;
    ctx.lineWidth = 5;
    const bph = legPhase + Math.PI;
    ctx.beginPath();
    ctx.moveTo(-1, -34 + yOff);
    ctx.lineTo(Math.sin(bph) * armSwing * 12 - 3, -26 + yOff);
    ctx.stroke();

    // front arm (reaches out while acting)
    ctx.strokeStyle = hurt ? "#ff8fa8" : shirt;
    ctx.beginPath();
    ctx.moveTo(1, -34 + yOff);
    if (c.state === "act") {
      const reach = 0.6 + Math.sin(t * 9) * 0.18;
      ctx.lineTo(10 * reach + 4, -30 + yOff + Math.sin(t * 7) * 2);
      ctx.lineTo(16 * reach + 4, -34 + yOff);
    } else if (c.state === "cheer") {
      ctx.lineTo(7, -44 + yOff);
      ctx.lineTo(9, -52 + yOff);
    } else {
      ctx.lineTo(Math.sin(legPhase) * armSwing * 12 + 3, -26 + yOff);
    }
    ctx.stroke();
    ctx.fillStyle = skin;
    if (c.state === "act") {
      ctx.beginPath();
      ctx.arc(16 * (0.6 + Math.sin(t * 9) * 0.18) + 4, -34 + yOff, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.state === "cheer") {
      ctx.beginPath();
      ctx.arc(9, -53 + yOff, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // head
    const headY = -46 + yOff + (c.state === "walk" ? Math.sin(legPhase * 2) * 0.7 : 0);
    const tilt = c.state === "act" ? 0.12 : c.state === "idle" ? Math.sin(t * 1.4) * 0.05 : 0;
    ctx.save();
    ctx.translate(1, headY);
    ctx.rotate(tilt);
    ctx.fillStyle = hurt ? "#ffd0d8" : skin;
    ctx.beginPath();
    ctx.arc(0, 0, 9.4, 0, Math.PI * 2);
    ctx.fill();
    // hair
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -1, 9.6, Math.PI * 1.02, Math.PI * 2.08);
    ctx.fill();
    ctx.fillRect(-9.4, -4, 4, 6);
    // ear
    ctx.fillStyle = hurt ? "#ffd0d8" : skin;
    ctx.beginPath();
    ctx.arc(-7, 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    const tired = this.needs.energy < 26;
    const blink = c.blink > 0 || tired;
    ctx.fillStyle = "#20343c";
    if (blink) {
      ctx.fillRect(2, 0.5, 4.4, 1.4);
      ctx.fillRect(-4.4, 0.5, 3.4, 1.4);
    } else {
      const ex = c.state === "cheer" ? 0.4 : 0;
      ctx.beginPath();
      ctx.arc(3.4 + ex, 0.6, 1.7, 0, Math.PI * 2);
      ctx.arc(-2.4 + ex, 0.6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(3.9 + ex, 0, 0.9, 0.9);
    }
    // cheeks + mouth
    ctx.fillStyle = "rgba(255,120,120,.35)";
    ctx.beginPath();
    ctx.arc(5.4, 3.6, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a35f4a";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    const happyMouth = c.state === "cheer" || c.state === "act" || this.vitality > 62;
    if (this.vitality < 26 || c.state === "down") {
      ctx.arc(2.4, 6.6, 2.4, Math.PI * 1.15, Math.PI * 1.85);
    } else if (happyMouth) {
      ctx.arc(2.4, 3.6, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
    } else {
      ctx.moveTo(1, 5);
      ctx.lineTo(4.4, 5);
    }
    ctx.stroke();
    ctx.restore();

    // prop in hand
    if (c.state === "act" && c.prop) {
      drawIcon(ctx, c.prop, 20, -36 + yOff, 15, "#ffffff");
    }

    ctx.restore();

    // status auras (drawn unscaled, in world space)
    if (this.phase === "playing") {
      if (this.vitality < 30) {
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 9);
        ctx.strokeStyle = "#ff5d8f";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y - 30, 30 + Math.sin(t * 9) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (this.needs.fun < 22 || this.needs.social < 22) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#6b7f8c";
        const cx2 = c.x + 4;
        const cy2 = c.y - 74 + Math.sin(t * 2) * 2;
        ctx.beginPath();
        ctx.ellipse(cx2, cy2, 16, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(cx2 - 9, cy2 + 3, 9, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(cx2 + 9, cy2 + 3, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(120,160,190,.7)";
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) {
          const ly = cy2 + 10 + ((t * 26 + i * 12) % 26);
          ctx.beginPath();
          ctx.moveTo(cx2 - 8 + i * 8, ly);
          ctx.lineTo(cx2 - 10 + i * 8, ly + 5);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (this.buffT > 0) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 3; i++) {
          const a = t * 2 + (i * Math.PI * 2) / 3;
          drawIcon(ctx, "spark", c.x + Math.cos(a) * 24, c.y - 34 + Math.sin(a) * 12, 9, "#c3a2ff");
        }
        ctx.restore();
      }
    }
  }

  private drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = p.shape === "bubble" || p.shape === "zzz" ? a * 0.85 : a;
      ctx.fillStyle = p.color;
      switch (p.shape) {
        case "dot":
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2);
          ctx.fill();
          break;
        case "sq":
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
          break;
        case "crumb":
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;
        case "shard":
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;
        case "star":
          drawIcon(ctx, "star", p.x, p.y, p.size * 2.2, p.color);
          break;
        case "spark":
          drawIcon(ctx, "spark", p.x, p.y, p.size * 2.4, p.color);
          break;
        case "heart":
          drawIcon(ctx, "heart", p.x, p.y, p.size * 2.2, p.color);
          break;
        case "coin":
          ctx.save();
          ctx.translate(p.x, p.y);
          const sq = Math.abs(Math.cos(p.rot * 1.6));
          ctx.scale(0.35 + sq * 0.65, 1);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(140,90,10,.5)";
          ctx.fillRect(-0.8, -p.size * 0.55, 1.6, p.size * 1.1);
          ctx.restore();
          break;
        case "zzz":
          ctx.save();
          ctx.font = `700 ${p.size * 1.7}px "Silkscreen", monospace`;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = a * 0.8;
          ctx.fillText("z", p.x, p.y);
          ctx.restore();
          break;
        case "note":
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(p.rot) * 0.3);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.55, p.size * 0.42, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(p.size * 0.42, -p.size * 1.3, p.size * 0.18, p.size * 1.3);
          ctx.restore();
          break;
        case "bubble":
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + a * 0.5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,.35)";
          ctx.fillRect(p.x - p.size * 0.3, p.y - p.size * 0.5, p.size * 0.3, p.size * 0.3);
          break;
        case "fly":
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.globalAlpha = a * 0.35;
          ctx.fillRect(p.x - 2, p.y - 2, p.size + 4, p.size + 4);
          break;
        case "ring":
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.6 - a), 0, Math.PI * 2);
          ctx.stroke();
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawRings() {
    const ctx = this.ctx;
    for (const r of this.rings) {
      const a = clamp(r.life / r.max, 0, 1);
      ctx.globalAlpha = a * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.w * a;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawTexts() {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    for (const t of this.texts) {
      const a = clamp(t.life / t.max, 0, 1);
      const pop = 1 + (1 - a) * 0.06 + Math.sin((1 - a) * 9) * 0.04;
      ctx.save();
      ctx.globalAlpha = a > 0.75 ? (1 - a) * 4 : Math.min(1, a * 1.6);
      ctx.translate(t.x, t.y);
      ctx.scale(pop, pop);
      ctx.font = `700 ${t.size}px "Silkscreen", monospace`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(5,15,19,.85)";
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  private drawNight() {
    const k = skyAt(this.tod);
    const ctx = this.ctx;
    if (k.night > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = mix("#ffffff", "#61759f", k.night * 0.52);
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (k.night > 0.12) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const lamps: [number, number, number, string][] = [
        [214, CEIL_Y + 106, 150, "rgba(255,205,130,"],
        [836, GROUND_Y - 190, 190, "rgba(255,205,130,"],
        [606, GROUND_Y - 130, 120, "rgba(255,190,110,"],
      ];
      const f = clamp((k.night - 0.12) / 0.5, 0, 1) * (0.9 + Math.sin(this.elapsed * 7.3) * 0.04);
      for (const [lx, ly, r, col] of lamps) {
        const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, r);
        g.addColorStop(0, `${col}${0.5 * f})`);
        g.addColorStop(0.4, `${col}${0.16 * f})`);
        g.addColorStop(1, `${col}0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(lx, ly, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // TV glow
      const tv = this.stations.find((s) => s.id === "tv")!;
      const tg = ctx.createRadialGradient(tv.x + 74, tv.floorY - 48, 4, tv.x + 74, tv.floorY - 48, 130);
      const fl = 0.3 + Math.sin(this.elapsed * 17) * 0.08;
      tg.addColorStop(0, `rgba(120,215,255,${fl})`);
      tg.addColorStop(1, "rgba(120,215,255,0)");
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(tv.x + 74, tv.floorY - 48, 130, 0, Math.PI * 2);
      ctx.fill();
      // readability halo around the little person (drawn after the night multiply)
      if (this.phase !== "over") {
        const c = this.char;
        const ha = clamp((k.night - 0.15) / 0.6, 0, 1) * 0.34;
        const halo = ctx.createRadialGradient(c.x, c.y - 30, 2, c.x, c.y - 30, 58);
        halo.addColorStop(0, `rgba(255,216,156,${ha})`);
        halo.addColorStop(0.55, `rgba(255,206,140,${ha * 0.42})`);
        halo.addColorStop(1, "rgba(255,206,140,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(c.x, c.y - 30, 58, 0, Math.PI * 2);
        ctx.fill();
      }
      // monitor glow
      const desk = this.stations.find((s) => s.id === "desk")!;
      const dg = ctx.createRadialGradient(desk.x, desk.floorY - 56, 3, desk.x, desk.floorY - 56, 90);
      dg.addColorStop(0, `rgba(53,214,192,${0.24 + Math.sin(this.elapsed * 4) * 0.06})`);
      dg.addColorStop(1, "rgba(53,214,192,0)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(desk.x, desk.floorY - 56, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawWorldUi() {
    const ctx = this.ctx;
    const c = this.char;
    const t = this.elapsed;
    if (this.phase === "over") return;

    // destination marker
    if (this.autoTarget && this.phase === "playing") {
      const a = this.autoTarget;
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 8);
      ctx.strokeStyle = a.st ? "#ffd166" : "#7fd8c8";
      ctx.lineWidth = 2.4;
      const y = a.y - 3 - ((t * 26) % 12);
      ctx.beginPath();
      ctx.moveTo(a.x - 8, y - 8);
      ctx.lineTo(a.x, y);
      ctx.lineTo(a.x + 8, y - 8);
      ctx.stroke();
      ctx.restore();
    }

    // wish marker above the target station
    if (this.wish && this.phase === "playing") {
      const s = this.wish.st;
      const my = s.floorY - (s.kind === "fridge" ? 150 : s.kind === "book" ? 172 : 124) - Math.sin(t * 3.4) * 5;
      ctx.save();
      ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 6);
      drawIcon(ctx, "star", s.x, my, 15, "#ffd166");
      ctx.strokeStyle = "rgba(255,209,102,.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, my, 15 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // thought bubble
    if (this.wish && (this.phase === "playing" || this.phase === "dying")) {
      const s = this.wish.st;
      const bx = c.x + c.face * 22;
      const by = c.y - 86;
      const wBubble = 52;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#0b1a20";
      ctx.beginPath();
      ctx.arc(bx - c.face * 12, by + 22, 3.4, 0, Math.PI * 2);
      ctx.arc(bx - c.face * 7, by + 15, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#eef7f2";
      rr(ctx, bx - wBubble / 2, by - 16, wBubble, 32, 11);
      ctx.fill();
      ctx.strokeStyle = "#0b1a20";
      ctx.lineWidth = 2;
      ctx.stroke();
      drawIcon(ctx, s.icon, bx - 10, by, 19, s.color);
      // countdown arc
      const frac = clamp(this.wish.t / this.wish.max, 0, 1);
      ctx.lineWidth = 3;
      ctx.strokeStyle = frac < 0.3 ? "#ff5d8f" : "#20343c";
      ctx.beginPath();
      ctx.arc(bx + 13, by, 8, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // interaction prompt
    const st = this.activeSt;
    if (st && this.phase === "playing" && st.progress < 0.02) {
      const usable = this.canUse(st);
      const label = usable ? st.label : st.cd > 0 ? "…" : st.id === "desk" ? "TOO TIRED" : "FULL";
      const py = st.floorY - (st.kind === "book" ? 176 : st.kind === "fridge" ? 148 : 118);
      ctx.save();
      ctx.font = `700 12px "Silkscreen", monospace`;
      const tw = ctx.measureText(label).width + 30;
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 7);
      ctx.fillStyle = "rgba(8,20,26,.88)";
      rr(ctx, st.x - tw / 2, py - 13, tw, 22, 6);
      ctx.fill();
      ctx.strokeStyle = usable ? st.color : "#6b7f8c";
      ctx.lineWidth = 2;
      ctx.stroke();
      drawIcon(ctx, st.icon, st.x - tw / 2 + 13, py - 2, 13, usable ? st.color : "#6b7f8c");
      ctx.fillStyle = usable ? "#eef7f2" : "#8fa6b2";
      ctx.textAlign = "left";
      ctx.fillText(label, st.x - tw / 2 + 23, py + 2);
      ctx.restore();
    }
  }

  private drawPostFx(dt: number) {
    const ctx = this.ctx;
    // flash
    if (this.flashA > 0.002) {
      ctx.save();
      ctx.globalAlpha = clamp(this.flashA, 0, 1);
      ctx.fillStyle = this.flashC;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // low-vitality alarm edges
    if (this.phase === "playing" && this.vitality < 32) {
      const p = 0.35 + 0.35 * Math.sin(this.elapsed * 7);
      const a = clamp((32 - this.vitality) / 32, 0, 1) * p;
      if (!this.dangerGrad) {
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.78);
        g.addColorStop(0, "rgba(255,60,110,0)");
        g.addColorStop(1, "rgba(255,60,110,1)");
        this.dangerGrad = g;
      }
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = this.dangerGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else this.dangerGrad = null;

    // death static
    if (this.phase === "dying" || this.phase === "over") {
      ctx.save();
      const amt = this.phase === "dying" ? 0.5 : 0.14;
      for (let i = 0; i < 190; i++) {
        ctx.fillStyle = `rgba(${Math.random() < 0.5 ? "230,245,240" : "20,40,48"},${rnd(0.05, amt)})`;
        const bw = rnd(2, 26);
        ctx.fillRect(rnd(0, W), rnd(0, H), bw, rnd(1, 3));
      }
      ctx.restore();
    }

    // scanlines
    if (!this.scanPattern) {
      const pc = document.createElement("canvas");
      pc.width = 3;
      pc.height = 3;
      const p = pc.getContext("2d");
      if (p) {
        p.fillStyle = "rgba(0,0,0,0.16)";
        p.fillRect(0, 2, 3, 1);
        this.scanPattern = ctx.createPattern(pc, "repeat");
      }
    }
    if (this.scanPattern) {
      ctx.save();
      ctx.fillStyle = this.scanPattern;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // vignette
    if (!this.vignette) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.44, W / 2, H / 2, H * 0.98);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.55, "rgba(0,0,0,0.16)");
      g.addColorStop(1, "rgba(0,0,0,0.44)");
      this.vignette = g;
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, W, H);

    // slow rolling bright band (CRT life)
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = "#bffbe9";
    const by = ((this.elapsed * 46) % (H + 160)) - 80;
    ctx.fillRect(0, by, W, 46);
    ctx.restore();
    void dt;
  }

  private dangerGrad: CanvasGradient | null = null;
}
