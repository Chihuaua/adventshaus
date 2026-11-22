/* =======================================================================
   EISBLUMEN AN DEN FENSTERN
   Von den Scheibenrändern wächst leichter Reif nach innen: ein weiches,
   kühles Band an allen vier Seiten und feine gezackte Kristallfäden. In
   jedem Haus, an jedem Fenster – nur Canvas-Grundformen, keine Dateien.
   ======================================================================= */

export type C = CanvasRenderingContext2D;

/** Deterministisches Rauschen aus einer Zahl: gleiche Zahl, gleicher Reif. */
function rand(i: number): number {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Reif auf einer rechteckigen Scheibe (x, y, w, h). Die Zeichnung bleibt
 * streng innerhalb der Scheibe; `seed` wählt das Kristallmuster.
 */
export function fensterReif(c: C, x: number, y: number, w: number, h: number, seed = 0): void {
  if (w <= 0 || h <= 0) return;
  const tiefe = Math.max(2.5, Math.min(w, h) * 0.2);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();

  // Weiches Band entlang aller vier Ränder, nach innen auslaufend
  const kanten: readonly (readonly [number, number, number, number])[] = [
    [x, y, x, y + tiefe],
    [x, y + h, x, y + h - tiefe],
    [x, y, x + tiefe, y],
    [x + w, y, x + w - tiefe, y],
  ];
  for (const [x0, y0, x1, y1] of kanten) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(226,240,255,.6)");
    g.addColorStop(0.5, "rgba(214,234,255,.22)");
    g.addColorStop(1, "rgba(214,234,255,0)");
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
  }

  // Feine Kristallfäden: wachsen von den Rändern nach innen, mit kleinen Farnen
  c.lineCap = "round";
  const anzahl = Math.min(18, Math.max(6, Math.round(((w + h) * 2) / 16)));
  for (let i = 0; i < anzahl; i++) {
    const seite = i % 4;
    const p = 0.06 + rand(i * 3 + 1 + seed * 17) * 0.88;
    const laenge = tiefe * (0.5 + rand(i * 3 + 2 + seed * 17) * 0.95);
    const seitlich = (rand(i * 3 + 3 + seed * 17) - 0.5) * 0.6;
    let sx: number;
    let sy: number;
    let dx: number;
    let dy: number;
    if (seite === 0) { sx = x + p * w; sy = y; dx = seitlich; dy = 1; }
    else if (seite === 1) { sx = x + p * w; sy = y + h; dx = seitlich; dy = -1; }
    else if (seite === 2) { sx = x; sy = y + p * h; dx = 1; dy = seitlich; }
    else { sx = x + w; sy = y + p * h; dx = -1; dy = seitlich; }
    const n = Math.hypot(dx, dy) || 1;
    dx /= n;
    dy /= n;
    c.strokeStyle = `rgba(255,255,255,${(0.34 + rand(i * 3 + 4 + seed * 17) * 0.34).toFixed(3)})`;
    c.lineWidth = 0.55;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + dx * laenge, sy + dy * laenge);
    c.stroke();
    for (const q of [0.45, 0.75]) {
      const bx = sx + dx * laenge * q;
      const by = sy + dy * laenge * q;
      const l2 = laenge * (1 - q) * 0.8;
      for (const vorzeichen of [-1, 1]) {
        c.beginPath();
        c.moveTo(bx, by);
        c.lineTo(bx + dx * l2 * 0.6 - dy * l2 * vorzeichen * 0.8, by + dy * l2 * 0.6 + dx * l2 * vorzeichen * 0.8);
        c.stroke();
      }
    }
  }
  c.restore();
}

/** Reif auf einer runden Scheibe mit dem Mittelpunkt (cx, cy) und dem Radius `r`. */
export function rundReif(c: C, cx: number, cy: number, r: number, seed = 0): void {
  if (r <= 0) return;
  const rand2 = (i: number) => rand(i * 5 + 11 + seed * 13);
  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.clip();
  const innen = Math.max(0, r - Math.max(2.5, r * 0.2));
  const g = c.createRadialGradient(cx, cy, innen, cx, cy, r);
  g.addColorStop(0, "rgba(214,234,255,0)");
  g.addColorStop(0.5, "rgba(214,234,255,.24)");
  g.addColorStop(1, "rgba(228,241,255,.6)");
  c.fillStyle = g;
  c.fillRect(cx - r, cy - r, r * 2, r * 2);
  c.lineCap = "round";
  const anzahl = 12;
  for (let i = 0; i < anzahl; i++) {
    const a = rand2(i) * Math.PI * 2;
    const laenge = Math.max(1.5, (r - innen) * (0.45 + rand2(i + 40) * 0.9));
    const sx = cx + Math.cos(a) * r;
    const sy = cy + Math.sin(a) * r;
    const dx = -Math.cos(a);
    const dy = -Math.sin(a);
    c.strokeStyle = `rgba(255,255,255,${(0.34 + rand2(i + 80) * 0.34).toFixed(3)})`;
    c.lineWidth = 0.55;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + dx * laenge, sy + dy * laenge);
    c.stroke();
    const bx = sx + dx * laenge * 0.6;
    const by = sy + dy * laenge * 0.6;
    const l2 = laenge * 0.4;
    for (const vorzeichen of [-1, 1]) {
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + dx * l2 - dy * l2 * vorzeichen, by + dy * l2 + dx * l2 * vorzeichen);
      c.stroke();
    }
  }
  c.restore();
}
