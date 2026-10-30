/* =======================================================================
   CONWAYS SPIEL DES LEBENS

   Feste Ränder: Positionen außerhalb gelten als tot. Die Folgegeneration
   wird in einen zweiten Puffer geschrieben, das Ausgangsraster bleibt
   während der Nachbarzählung unangetastet.

   Die Zellen liegen in einem flachen Byte-Feld (eine Zelle = ein Byte).
   „Gröber“ und „feiner“ ändern die Anzahl der Zellen; das vorhandene
   Muster bleibt dabei mittig erhalten.
   ======================================================================= */

type C = CanvasRenderingContext2D;

/** Ausschnitt der Vergrößerung auf der 960×600-Bühne. */
export const GOL_X = 120;
export const GOL_Y = 30;
export const GOL_VIEW_W = 720;
export const GOL_VIEW_H = 300;

/** Bühneneinheiten je Zelle, von grob nach fein. */
export const GOL_SIZES = [12, 10, 8, 6, 5, 4, 3, 2.5, 2] as const;
export const GOL_SIZE_DEFAULT = 6; // 3 Einheiten -> 240 × 100

/** Generationen pro Sekunde, von langsam nach schnell. */
export const GOL_SPEEDS = [1, 2, 3, 5, 8, 12, 18, 25, 35, 45, 60] as const;
export const GOL_SPEED_DEFAULT = 5; // 12 / s

const CTRL_W = 44;
const CTRL_H = 34;
const CTRL_GAP = 8;
const CTRL_Y = GOL_Y + GOL_VIEW_H + 18;

export type GOLCtrlId = "fewer" | "more" | "slower" | "faster" | "reset";

export interface GOLCtrl {
  id: GOLCtrlId;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Fünf unbeschriftete Symbole, von links nach rechts. */
export const GOL_CTRLS: GOLCtrl[] = (["fewer", "more", "slower", "faster", "reset"] as GOLCtrlId[]).map(
  (id, i) => ({ id, x: GOL_X + i * (CTRL_W + CTRL_GAP), y: CTRL_Y, w: CTRL_W, h: CTRL_H }),
);

export const GOL_BTN = { x: GOL_X + GOL_VIEW_W - 180, y: CTRL_Y, w: 180, h: CTRL_H } as const;

/** Platz für den Pegel zwischen den Symbolen und „zurück“. */
const METER_X = GOL_X + 5 * (CTRL_W + CTRL_GAP) + 14;
const METER_W = GOL_BTN.x - 16 - METER_X;

/** Die drei Regeln, unter dem Raster in der Vergrößerung. */
export const GOL_RULES = [
  "1. Eine tote Zelle mit genau drei lebenden Nachbarn wird lebendig.",
  "2. Eine lebende Zelle mit zwei oder drei Nachbarn bleibt lebendig.",
  "3. Eine lebende Zelle mit weniger oder mehr als drei Nachbarn stirbt.",
];

export interface GOLState {
  cols: number;
  rows: number;
  /** 1 = lebt, 0 = tot; Index y * cols + x */
  cells: Uint8Array;
  /** zweiter Puffer für die Folgegeneration */
  spare: Uint8Array;
  generation: number;
  population: number;
  running: boolean;
  sizeIdx: number;
  speedIdx: number;
}

export function gridDims(sizeIdx: number): { cols: number; rows: number; cell: number } {
  const cell = GOL_SIZES[sizeIdx];
  return { cols: Math.floor(GOL_VIEW_W / cell), rows: Math.floor(GOL_VIEW_H / cell), cell };
}

export function countPopulation(cells: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < cells.length; i++) n += cells[i];
  return n;
}

/** Etwa ein Viertel der Zellen lebt. */
export function randomize(cells: Uint8Array): void {
  for (let i = 0; i < cells.length; i++) cells[i] = Math.random() < 0.25 ? 1 : 0;
}

export function createState(sizeIdx = GOL_SIZE_DEFAULT): GOLState {
  const { cols, rows } = gridDims(sizeIdx);
  const cells = new Uint8Array(cols * rows);
  randomize(cells);
  return {
    cols,
    rows,
    cells,
    spare: new Uint8Array(cols * rows),
    generation: 0,
    population: countPopulation(cells),
    running: true,
    sizeIdx,
    speedIdx: GOL_SPEED_DEFAULT,
  };
}

/**
 * Neue Zellenzahl. Das alte Muster wird mittig übernommen; neu hinzukommende
 * Flächen werden zufällig belegt, damit dort nicht nur Leere steht.
 */
export function resize(g: GOLState, sizeIdx: number): void {
  const { cols, rows } = gridDims(sizeIdx);
  if (cols === g.cols && rows === g.rows) return;
  const next = new Uint8Array(cols * rows);
  randomize(next);
  const ox = Math.floor((cols - g.cols) / 2);
  const oy = Math.floor((rows - g.rows) / 2);
  for (let y = 0; y < rows; y++) {
    const sy = y - oy;
    if (sy < 0 || sy >= g.rows) continue;
    for (let x = 0; x < cols; x++) {
      const sx = x - ox;
      if (sx < 0 || sx >= g.cols) continue;
      next[y * cols + x] = g.cells[sy * g.cols + sx];
    }
  }
  g.cols = cols;
  g.rows = rows;
  g.cells = next;
  g.spare = new Uint8Array(cols * rows);
  g.sizeIdx = sizeIdx;
  g.population = countPopulation(next);
}

/** Schreibt die Folgegeneration nach `dst`. `src` wird nicht verändert. */
export function stepInto(src: Uint8Array, dst: Uint8Array, cols: number, rows: number): void {
  for (let y = 0; y < rows; y++) {
    const up = y > 0 ? (y - 1) * cols : -1;
    const mid = y * cols;
    const dn = y < rows - 1 ? (y + 1) * cols : -1;
    for (let x = 0; x < cols; x++) {
      const l = x > 0;
      const r = x < cols - 1;
      let n = 0;
      if (up >= 0) {
        if (l) n += src[up + x - 1];
        n += src[up + x];
        if (r) n += src[up + x + 1];
      }
      if (l) n += src[mid + x - 1];
      if (r) n += src[mid + x + 1];
      if (dn >= 0) {
        if (l) n += src[dn + x - 1];
        n += src[dn + x];
        if (r) n += src[dn + x + 1];
      }
      dst[mid + x] = src[mid + x] ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
    }
  }
}

/** Eine Generation weiter, die beiden Puffer tauschen die Rollen. */
export function advance(g: GOLState): void {
  stepInto(g.cells, g.spare, g.cols, g.rows);
  const t = g.cells;
  g.cells = g.spare;
  g.spare = t;
  g.generation++;
}

export function toggleCellAt(g: GOLState, x: number, y: number): void {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return;
  const i = y * g.cols + x;
  g.cells[i] = g.cells[i] ? 0 : 1;
}

/** Wo das Raster auf der Bühne liegt (mittig im Ausschnitt). */
export function golView(g: GOLState): { x: number; y: number; w: number; h: number; cell: number } {
  const cell = GOL_SIZES[g.sizeIdx];
  const w = g.cols * cell;
  const h = g.rows * cell;
  return { x: GOL_X + (GOL_VIEW_W - w) / 2, y: GOL_Y + (GOL_VIEW_H - h) / 2, w, h, cell };
}

/**
 * Malt das Raster mit einem Pixel je Zelle in `img`. Auf der Bühne wird es
 * ohne Glättung hochskaliert – jede Zelle wird ein scharfes weißes Quadrat.
 */
export function paintCells(img: ImageData, g: GOLState): void {
  const d = img.data;
  for (let i = 0, p = 0; i < g.cells.length; i++, p += 4) {
    if (g.cells[i]) {
      d[p] = 242;
      d[p + 1] = 247;
      d[p + 2] = 244;
    } else {
      d[p] = 7;
      d[p + 1] = 16;
      d[p + 2] = 22;
    }
    d[p + 3] = 255;
  }
}

/** Grobe Vorschau für den kleinen Fernseher: Blöcke nach Dichte. */
export function drawGridCoarse(c: C, g: GOLState, x: number, y: number, w: number, h: number, bxN = 27, byN = 17): void {
  c.fillStyle = "#071016";
  c.fillRect(x, y, w, h);
  const bw = w / bxN;
  const bh = h / byN;
  for (let by = 0; by < byN; by++) {
    const r0 = Math.floor((by * g.rows) / byN);
    const r1 = Math.max(r0 + 1, Math.floor(((by + 1) * g.rows) / byN));
    for (let bx = 0; bx < bxN; bx++) {
      const c0 = Math.floor((bx * g.cols) / bxN);
      const c1 = Math.max(c0 + 1, Math.floor(((bx + 1) * g.cols) / bxN));
      let n = 0;
      let live = 0;
      for (let r = r0; r < r1 && r < g.rows; r++) {
        for (let q = c0; q < c1 && q < g.cols; q++) {
          n++;
          live += g.cells[r * g.cols + q];
        }
      }
      const dd = n ? live / n : 0;
      if (dd > 0.06) {
        c.fillStyle = `rgba(242,247,244,${0.26 + dd * 0.74})`;
        c.fillRect(x + bx * bw, y + by * bh, bw + 0.2, bh + 0.2);
      }
    }
  }
}

/** Fünf unbeschriftete Symbole, weiß auf schwarz. */
export function drawGolControls(c: C): void {
  const ink = "#f2f7f4";
  for (const b of GOL_CTRLS) {
    c.fillStyle = "#000000";
    c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = ink;
    c.lineWidth = 1.2;
    c.strokeRect(b.x + 0.6, b.y + 0.6, b.w - 1.2, b.h - 1.2);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    c.fillStyle = ink;
    c.strokeStyle = ink;
    c.lineCap = "round";
    c.lineJoin = "round";
    if (b.id === "fewer") {
      // wenige große Quadrate: weniger Zellen
      const s = 6;
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        c.fillRect(cx + dx * 5.5 - s / 2, cy + dy * 5.5 - s / 2, s, s);
      }
    } else if (b.id === "more") {
      // viele kleine Quadrate: mehr Zellen
      const s = 2.6;
      for (let r = -1.5; r <= 1.5; r++) {
        for (let q = -1.5; q <= 1.5; q++) c.fillRect(cx + q * 4.6 - s / 2, cy + r * 4.6 - s / 2, s, s);
      }
    } else if (b.id === "faster" || b.id === "slower") {
      const dir = b.id === "faster" ? 1 : -1;
      c.lineWidth = 2.2;
      for (const off of [-4, 4]) {
        const px = cx + off * dir;
        c.beginPath();
        c.moveTo(px - 3.4 * dir, cy - 6);
        c.lineTo(px + 3.4 * dir, cy);
        c.lineTo(px - 3.4 * dir, cy + 6);
        c.stroke();
      }
    } else {
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(cx, cy, 7.5, -Math.PI * 0.35, Math.PI * 1.15);
      c.stroke();
      const ax = cx + 7.5 * Math.cos(-Math.PI * 0.35);
      const ay = cy + 7.5 * Math.sin(-Math.PI * 0.35);
      c.beginPath();
      c.moveTo(ax + 5, ay - 1);
      c.lineTo(ax - 2.5, ay - 3);
      c.lineTo(ax + 1, ay + 5.5);
      c.closePath();
      c.fill();
    }
  }
}

/**
 * Pegel aus gleich hohen senkrechten Strichen (kein Keil): gefüllt bis zur
 * aktuellen Stufe. `alpha` blendet ihn nach dem Drücken wieder aus.
 */
export function drawSpeedMeter(c: C, level: number, steps: number, alpha: number): void {
  if (alpha <= 0.01) return;
  const gap = 4;
  const bw = Math.min(8, (METER_W - gap * (steps - 1)) / steps);
  const total = steps * bw + (steps - 1) * gap;
  const x0 = METER_X + (METER_W - total) / 2;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = "#000000";
  c.fillRect(x0 - 8, CTRL_Y, total + 16, CTRL_H);
  for (let i = 0; i < steps; i++) {
    const x = x0 + i * (bw + gap);
    if (i <= level) {
      c.fillStyle = "#f2f7f4";
      c.fillRect(x, CTRL_Y + 7, bw, CTRL_H - 14);
    } else {
      c.strokeStyle = "rgba(242,247,244,.45)";
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, CTRL_Y + 7.5, bw - 1, CTRL_H - 15);
    }
  }
  c.restore();
}

export function golCtrlAt(x: number, y: number): GOLCtrlId | null {
  for (const b of GOL_CTRLS) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
  }
  return null;
}
