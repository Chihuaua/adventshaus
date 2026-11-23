export type C = CanvasRenderingContext2D;
export type Farbe = string | CanvasGradient;
export type Punkt = [number, number];
export type Zug = Punkt | [number, number, number, number] | [number, number, number, number, number, number];
export type Ansicht = "vorn" | "links" | "rechts" | "hinten";
export type Pose = "ruhe" | "gang" | "aktion" | "sitzen";
export interface Bild { ansicht: Ansicht; pose: Pose; zeit: number }
export type Zeichner = (c: C, bild: Bild) => void;
export const KREIS = Math.PI * 2;
export const korn = (i: number) => { const a = Math.sin(i * 73.325 + 31.71) * 41327.71; return a - Math.floor(a); };
export const sanft = (v: number) => { const k = Math.max(0, Math.min(1, v)); return k * k * (3 - 2 * k); };
export const misch = (a: number, b: number, v: number) => a + (b - a) * v;

export function pfad(c: C, x: number, y: number, ...z: Zug[]) {
  c.beginPath(); c.moveTo(x, y);
  for (const p of z) {
    if (p.length === 2) c.lineTo(...p);
    else if (p.length === 4) c.quadraticCurveTo(...p);
    else c.bezierCurveTo(...p);
  }
}
export function form(c: C, f: Farbe, x: number, y: number, ...z: Zug[]) {
  pfad(c, x, y, ...z); c.closePath(); c.fillStyle = f; c.fill();
}
export function faden(c: C, f: Farbe, w: number, x: number, y: number, ...z: Zug[]) {
  pfad(c, x, y, ...z); c.strokeStyle = f; c.lineWidth = w; c.stroke();
}
export function oval(c: C, f: Farbe, x: number, y: number, rx: number, ry: number, a = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, KREIS); c.fillStyle = f; c.fill();
}
export function licht(c: C, x: number, y: number, dx: number, dy: number, ...farben: string[]) {
  const g = c.createLinearGradient(x, y, x + dx, y + dy);
  farben.forEach((f, i) => g.addColorStop(i / (farben.length - 1), f)); return g;
}
export function kugel(c: C, x: number, y: number, r: number, ...farben: string[]) {
  const g = c.createRadialGradient(x - r * .31, y - r * .41, r * .075, x, y, r * 1.11);
  farben.forEach((f, i) => g.addColorStop(i / (farben.length - 1), f)); return g;
}
export function maske(c: C, innen: () => void) { c.save(); c.clip(); innen(); c.restore(); }
export function rund(c: C, f: Farbe, x: number, y: number, w: number, h: number, r: number) {
  const e = Math.min(r, w / 2, h / 2);
  form(c, f, x + e, y, [x + w - e, y], [x + w, y, x + w, y + e], [x + w, y + h - e],
    [x + w, y + h, x + w - e, y + h], [x + e, y + h], [x, y + h, x, y + h - e], [x, y + e], [x, y, x + e, y]);
}

/** Ein zusammenhaengender, verjuengter Gliedabschnitt auf seinen wirklichen Gelenkpunkten. */
export function glied(c: C, a: Punkt, b: Punkt, r: number, s: number, material: Farbe) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  if (l < .01) { oval(c, material, ...a, r, r); return; }
  const u = dx / l, v = dy / l, nx = -v, ny = u;
  form(c, material, a[0] + nx * r, a[1] + ny * r,
    [b[0] + nx * s, b[1] + ny * s],
    [b[0] + nx * s + u * s * 1.34, b[1] + ny * s + v * s * 1.34, b[0] - nx * s + u * s * 1.34, b[1] - ny * s + v * s * 1.34, b[0] - nx * s, b[1] - ny * s],
    [a[0] - nx * r, a[1] - ny * r],
    [a[0] - nx * r - u * r * 1.34, a[1] - ny * r - v * r * 1.34, a[0] + nx * r - u * r * 1.34, a[1] + ny * r - v * r * 1.34, a[0] + nx * r, a[1] + ny * r]);
}

export function naht(c: C, a: Punkt, b: Punkt, f: string, abstand = 1.25, dicke = .24) {
  const n = Math.max(1, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / abstand));
  c.beginPath();
  for (let i = 0; i < n; i++) {
    c.moveTo(misch(a[0], b[0], (i + .16) / n), misch(a[1], b[1], (i + .16) / n));
    c.lineTo(misch(a[0], b[0], (i + .72) / n), misch(a[1], b[1], (i + .72) / n));
  }
  c.strokeStyle = f; c.lineWidth = dicke; c.stroke();
}

/** Das Handziel bleibt fest; der Ellbogen folgt den Laengen von Ober- und Unterarm. */
export function ellbogen(a: Punkt, h: Punkt, oben: number, unten: number, seite: number): Punkt {
  const dx = h[0] - a[0], dy = h[1] - a[1], d = Math.max(.01, Math.hypot(dx, dy));
  const an = Math.max(-oben, Math.min(oben, (d * d + oben * oben - unten * unten) / (2 * d)));
  const quer = Math.sqrt(Math.max(0, oben * oben - an * an)) * seite;
  return [a[0] + (dx * an - dy * quer) / d, a[1] + (dy * an + dx * quer) / d];
}
export function flocke(c: C, x: number, y: number, r: number, f: string, w = .36) {
  c.save(); c.translate(x, y); c.strokeStyle = f; c.lineWidth = w;
  for (let i = 0; i < 6; i++) {
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r); c.moveTo(-r * .23, -r * .74); c.lineTo(0, -r * .52); c.lineTo(r * .23, -r * .74); c.stroke();
    c.rotate(Math.PI / 3);
  }
  c.restore();
}
export function schatten(c: C, w: number, h: number) {
  c.save(); c.scale(1, h / w); const g = c.createRadialGradient(0, 0, w * .15, 0, 0, w);
  g.addColorStop(0, "rgba(26,31,49,.24)"); g.addColorStop(.55, "rgba(40,44,58,.15)"); g.addColorStop(1, "rgba(48,48,62,0)");
  oval(c, g, 0, .2, w, w); c.restore();
}