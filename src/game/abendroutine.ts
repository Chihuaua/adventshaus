import type { WeltId } from "./welten";

export const abendWelt = (welt: WeltId) => welt === "normal" || welt === "weihnacht";
export type Schlafanzug = { top: string; bottom: string; flausch?: boolean };
type Datum = { year: number; month: number; day: number };

/** Gregorianischer Ostersonntag; der Winterstoff bleibt bis einschließlich Ostermontag. */
export function flauschzeit(d: Datum): boolean {
  if (d.month >= 10 || d.month < 3) return true;
  if (d.month > 4) return false;
  const y = d.year, a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30;
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - c % 4) % 7;
  const p = h + l - 7 * Math.floor((a + 11 * h + 22 * l) / 451) + 114;
  return Date.UTC(y, d.month - 1, d.day) <= Date.UTC(y, Math.floor(p / 31) - 1, p % 31 + 2);
}

const pastel = (farbe: string) => "#" + [1, 3, 5].map((k, i) =>
  Math.round(parseInt(farbe.slice(k, k + 2), 16) * .43 + [255, 245, 240][i] * .57).toString(16).padStart(2, "0")).join("");

/** Die gespeicherten Grundfarben bleiben für die warme Jahreszeit erhalten. */
export function pyjamaStoff(p: Schlafanzug | null, datum: Datum, welt: WeltId): Schlafanzug | null {
  if (!p || !abendWelt(welt)) return p;
  if (!flauschzeit(datum)) return { ...p, flausch: false };
  return { top: pastel(p.top), bottom: pastel(p.bottom), flausch: true };
}

export const BETT_HANDY = [
  ["holen", 1.1], ["video", 6.8], ["ansOhr", 1.15], ["anruf", 6.2], ["einstecken", 1.2], ["abnehmen", 1.1],
] as const;
type Pt = [number, number];
const weich = (p: number) => { const k = Math.max(0, Math.min(1, p)); return k * k * (3 - 2 * k); };
const zwischen = (a: Pt, b: Pt, p: number): Pt => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];

/** Reine Animationszeiten der Vorschau, keine Uhrzeit und kein Tagesplan. */
export class BettHandy {
  private index = 0;
  private zeit = 0;
  get fertig() { return this.index === BETT_HANDY.length; }
  get phase() { return this.fertig ? "wurf" : BETT_HANDY[this.index][0]; }
  tick(dt: number) {
    this.zeit += dt;
    while (!this.fertig && this.zeit >= BETT_HANDY[this.index][1]) {
      this.zeit -= BETT_HANDY[this.index++][1];
    }
  }
  bild() {
    const ph = this.phase, p = weich(this.zeit / (BETT_HANDY[this.index]?.[1] ?? 1));
    const oben = ph === "holen" ? p : ph === "einstecken" ? 1 - p : ph === "abnehmen" || ph === "wurf" ? 0 : 1;
    const ohr = ph === "ansOhr" ? p : ph === "anruf" || ph === "einstecken" ? 1 : 0;
    const tasche: Pt = [325, 288], bild: Pt = [322.5, 269.5], amOhr: Pt = [315.5, 294.8];
    const hand = ph === "abnehmen" || ph === "wurf" ? zwischen(tasche, [311, 282], ph === "wurf" ? 1 : p)
      : zwischen(tasche, zwischen(bild, amOhr, ohr), oben);
    return { hand, pose: { modus: (ohr > .5 ? "call" : "video") as "call" | "video", zeit: this.zeit,
      benutzt: ph === "video" || ph === "anruf", oben, ohr, quer: oben * (1 - ohr), sichtbar: oben > .16 },
      spricht: ph === "anruf" && Math.sin(this.zeit * 2.2) > -.1 };
  }
}

export function bettArm(c: CanvasRenderingContext2D, hand: Pt, stoff: string, haut: string) {
  const sx = 324, sy = 286.5, dx = hand[0] - sx, dy = hand[1] - sy;
  const dist = Math.max(.01, Math.hypot(dx, dy)), knick = Math.sqrt(Math.max(0, 9 * 9 - dist * dist / 4));
  const ex = sx + dx / 2 - dy / dist * knick, ey = sy + dy / 2 + dx / dist * knick;
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = stoff; c.lineWidth = 4.2;
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(...hand); c.stroke();
  c.fillStyle = haut; c.beginPath(); c.ellipse(...hand, 2.1, 1.65, -.2, 0, 2 * Math.PI); c.fill();
  c.restore();
}