/* =======================================================================
   TRAUMHAUS

   Leere Architekturversion von Lunis Haus: gleicher Hauskörper, vier Ebenen,
   Treppen, Fenster und Wände – aber ohne Luni, Möbel, Dekoration, Rauch oder
   spielbare Stationen. Sie bleibt eine eigenständige Szene, damit das normale
   Haus unverändert bleibt und die Traumregie sie später verwenden kann.
   ======================================================================= */

import { berlinNow, FLOOR_Y, H, HR, W } from "./house";
import { drawStein, steinAn, steinSlots, type SteinSlot } from "./steine";
import type { WeltId } from "./welten";

type C = CanvasRenderingContext2D;

const SLAB = 12;

const rect = (c: C, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};

const line = (c: C, x1: number, y1: number, x2: number, y2: number, color: string, w = 1) => {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
};

function roofTop(x: number) {
  return 22 + 0.25 * Math.abs(x - 470);
}

function roundRect(c: C, x: number, y: number, w: number, h: number, r: number, color: string) {
  const q = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + q, y);
  c.lineTo(x + w - q, y);
  c.quadraticCurveTo(x + w, y, x + w, y + q);
  c.lineTo(x + w, y + h - q);
  c.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  c.lineTo(x + q, y + h);
  c.lineTo(x + q, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - q);
  c.lineTo(x, y + q);
  c.quadraticCurveTo(x, y, x + q, y);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function drawSlab(c: C, x0: number, x1: number, y: number, color: string) {
  rect(c, x0, y, x1 - x0, 6, color);
  rect(c, x0, y + 6, x1 - x0, SLAB - 6, "#3a2e28");
  rect(c, x0, y, x1 - x0, 1.4, "rgba(255,255,255,.24)");
  rect(c, x0, y + SLAB - 2, x1 - x0, 2, "rgba(0,0,0,.3)");
}

function dreamDoor(c: C, x: number, y: number, w: number, h: number, color: string) {
  roundRect(c, x - 4, y - 4, w + 8, h + 4, 2, '#4a3a33');
  roundRect(c, x, y, w, h, 1.5, color);
  rect(c, x + 4, y + 5, w - 8, h * 0.42, 'rgba(0,0,0,.20)');
  rect(c, x + 4, y + h * 0.55, w - 8, h * 0.36, 'rgba(0,0,0,.20)');
  rect(c, x + 2, y + 2, w - 4, 1.4, 'rgba(255,255,255,.14)');
  c.fillStyle = '#c7d0cd';
  c.beginPath();
  c.arc(x + w - 8, y + h * 0.55, 2, 0, Math.PI * 2);
  c.fill();
}

function dreamPanels(c: C, x: number, y: number, w: number, h: number) {
  rect(c, x, y, w, h, '#2c1d18');
  for (let px = x + 10; px < x + w - 4; px += 64) {
    roundRect(c, px, y + 7, 54, h - 24, 1.5, '#482d20');
    c.strokeStyle = 'rgba(10,7,6,.56)';
    c.lineWidth = 1.4;
    c.strokeRect(px + 1, y + 8, 52, h - 26);
    c.strokeStyle = 'rgba(225,177,126,.10)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(px + 10, y + 18);
    c.quadraticCurveTo(px + 31, y + h * 0.55, px + 16, y + h - 30);
    c.stroke();
  }
  rect(c, x, y + h - 15, w, 15, '#241712');
}

function dreamFloor(c: C, x: number, y: number, w: number, h: number, color: string) {
  rect(c, x, y, w, h, color);
  for (let row = 0; row * 14 < h; row++) {
    const yy = y + row * 14;
    rect(c, x, yy, w, 1.2, row % 2 ? 'rgba(0,0,0,.22)' : 'rgba(255,220,175,.08)');
    const shift = row % 2 ? 56 : 0;
    for (let px = x - shift; px < x + w; px += 112) rect(c, px, yy + 1, 1, Math.min(13, y + h - yy), 'rgba(0,0,0,.18)');
  }
}

function drawEmptyHouse(c: C, hour: number, t: number, steine: SteinSlot[]) {
  const night = hour < 6 || hour >= 20;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, night ? '#081127' : '#6fa8d6');
  sky.addColorStop(0.7, night ? '#18284b' : '#d7edf9');
  sky.addColorStop(0.71, night ? '#29364c' : '#819a75');
  sky.addColorStop(1, night ? '#18221e' : '#617554');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);

  // Hauskörper ohne Fenster, Möbel, Luni und Treppen.
  rect(c, 98, 118, 12, 454, '#4a3a33');
  rect(c, HR, 118, 12, 468, '#4a3a33');
  rect(c, 110, 128, 720, 444, '#d4d6d0');
  rect(c, 110, 128, 720, 4, 'rgba(255,255,255,.45)');
  c.beginPath();
  c.moveTo(86, 128);
  c.lineTo(86, roofTop(86));
  c.lineTo(470, 22);
  c.lineTo(854, roofTop(854));
  c.lineTo(854, 128);
  c.closePath();
  c.fillStyle = '#2b3a48';
  c.fill();
  line(c, 86, 128, 854, 128, 'rgba(0,0,0,.34)', 3);

  // Dachgeschoss: karger Erwachensraum in der mittleren Breite.
  rect(c, 250, 132, 560, 68, '#f0f1ed');
  rect(c, 270, 150, 520, 50, '#2c1d18');
  dreamPanels(c, 270, 150, 520, 50);
  dreamFloor(c, 250, 188, 560, 12, '#58485a');
  drawSlab(c, 250, 810, FLOOR_Y[3], '#58485a');
  dreamDoor(c, 292, 160, 52, 40, '#543625');

  // Obergeschoss: durchgehender waagerechter Flur.
  dreamPanels(c, 110, 212, 720, 112);
  dreamFloor(c, 110, 306, 720, 18, '#68252d');
  drawSlab(c, 98, HR, FLOOR_Y[2], '#6f2930');
  for (const x of [142, 248, 354, 460, 566]) dreamDoor(c, x, 238, 64, 86, '#543625');
  dreamDoor(c, 704, 222, 92, 102, '#8a6440');

  // Erdgeschoss: ein einzelner Musikraum, noch ohne Einrichtung.
  dreamPanels(c, 110, 336, 720, 112);
  dreamFloor(c, 110, 430, 720, 18, '#765035');
  drawSlab(c, 98, HR, FLOOR_Y[1], '#765035');
  dreamDoor(c, 150, 356, 76, 92, '#3e63aa');
  dreamDoor(c, 724, 356, 76, 92, '#3f8a59');

  // Keller bleibt dunkler, ohne eigene Traumhandlung.
  rect(c, 350, 460, 480, 112, '#4d504a');
  drawSlab(c, 350, HR, FLOOR_Y[0], '#666a63');
  // Wechselsteine: Wachstein (normales Haus) und Horrorstein (Gruselhaus).
  for (const sl of steine) drawStein(c, sl.art, t, sl.x, sl.y);
}

export interface TraumhausOptions {
  /** alt: Wachstein zurück ins normale Haus */
  onLunisHaus?: () => void;
  /** Ein Klick auf einen Wechselstein: Ziel-Hauswelt */
  onWelt?: (ziel: WeltId) => void;
}

export class Traumhaus {
  private canvas: HTMLCanvasElement;
  private ctx: C;
  private scale = 1;
  private dpr = 1;
  private raf = 0;
  private observer: ResizeObserver | null = null;
  private destroyed = false;
  private elapsed = 0;
  private last = 0;
  private onWelt: ((ziel: WeltId) => void) | null;
  private steine: SteinSlot[] = steinSlots("traum");
  private hover: SteinSlot | null = null;

  constructor(canvas: HTMLCanvasElement, opts: TraumhausOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    const alt = opts.onLunisHaus;
    this.onWelt = opts.onWelt ?? (alt ? (z) => { if (z === "normal") alt(); } : null);
    this.resize();
  }

  mount() {
    this.observer = new ResizeObserver(this.resize);
    if (this.canvas.parentElement) this.observer.observe(this.canvas.parentElement);
    window.addEventListener("resize", this.resize);
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerleave", this.onLeave);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
  }

  private resize = () => {
    const parent = this.canvas.parentElement;
    const cw = parent?.clientWidth ?? window.innerWidth;
    const ch = parent?.clientHeight ?? window.innerHeight;
    if (!cw || !ch) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, cw < 700 ? 1.6 : 2);
    this.scale = Math.min(cw / W, ch / H);
    this.canvas.width = Math.max(1, Math.round(W * this.scale * this.dpr));
    this.canvas.height = Math.max(1, Math.round(H * this.scale * this.dpr));
    this.canvas.style.width = `${Math.round(W * this.scale)}px`;
    this.canvas.style.height = `${Math.round(H * this.scale)}px`;
  };

  private toWorld(e: PointerEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }

  private onDown = (e: PointerEvent) => {
    const [x, y] = this.toWorld(e);
    const sl = steinAn(this.steine, x, y);
    if (sl) this.onWelt?.(sl.ziel);
  };

  private onMove = (e: PointerEvent) => {
    const [x, y] = this.toWorld(e);
    this.hover = steinAn(this.steine, x, y);
    this.canvas.style.cursor = this.hover ? "pointer" : "default";
  };

  private onLeave = () => {
    this.hover = null;
    this.canvas.style.cursor = "default";
  };

  /** Hover-Text im Canvas – genau wie im Haus: 600 11px Space Grotesk, Box 20, Radius 5, Abstand 8. */
  private zeichneLabel() {
    const sl = this.hover;
    if (!sl) return;
    const c = this.ctx;
    c.save();
    c.font = '600 11px "Space Grotesk", sans-serif';
    const tw = c.measureText(sl.label).width + 16;
    const [rx, ry, rw] = sl.hit;
    const lx = Math.min(Math.max(rx + rw / 2 - tw / 2, 6), W - tw - 6);
    const ly = Math.max(ry - 8, 22);
    roundRect(c, lx, ly - 14, tw, 20, 5, "rgba(8,20,26,.88)");
    c.fillStyle = "#eef7f2";
    c.fillText(sl.label, lx + 8, ly);
    c.restore();
  }

  private frame = (now: number) => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
    this.elapsed += Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const s = this.scale * this.dpr;
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    drawEmptyHouse(this.ctx, berlinNow().hour, this.elapsed, this.steine);
    this.zeichneLabel();
  };
}