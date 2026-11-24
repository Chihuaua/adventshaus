import type { WeltId } from "./welten";
import { ABEND_BETT, ABEND_EINSCHLAFEN, ABEND_RICHTWERTE, type AbendWerte } from "./abendzeiten";

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

const FILMRUNDE = 6.8;
export const BETT_HANDY = [
  ["abnehmen", ABEND_BETT.abnehmen], ["wurf", 0], ["holen", ABEND_BETT.holen], ["video", ABEND_RICHTWERTE.video],
  ["unterschieben", ABEND_BETT.unterschieben], ["anruf", ABEND_RICHTWERTE.anruf],
] as const;
type Pt = [number, number];
const weich = (p: number) => { const k = Math.max(0, Math.min(1, p)); return k * k * (3 - 2 * k); };
const zwischen = (a: Pt, b: Pt, p: number): Pt => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
export const ABEND_WURFHAND: Pt = [315, 280.8];
const RUHE: Pt = [325.5, 288.8], NASE: Pt = [310.8, 284.9];
const UNTER_DECKE: Pt = [332.7, 294.5], VIDEO: Pt = [326.8, 276.1];
const KISSEN: Pt = [303.8, 295.85];

// Schnittzeit und Lichtfarbe der vier kleinen Einstellungen. Displaykante und Wange lesen dasselbe Bild.
const FILM = [
  { ab: 0, rgb: [139, 198, 236] }, { ab: 1.7, rgb: [255, 193, 139] },
  { ab: 3.35, rgb: [147, 220, 188] }, { ab: 5.1, rgb: [194, 173, 231] },
] as const;

export function videobild(t: number, dauer = ABEND_RICHTWERTE.video) {
  const filmzeit = t % FILMRUNDE;
  let schnitt = 0;
  while (schnitt + 1 < FILM.length && filmzeit >= FILM[schnitt + 1].ab) schnitt++;
  const szene = FILM[schnitt], vorher = FILM[schnitt === 0 ? (t < FILMRUNDE ? 0 : FILM.length - 1) : schnitt - 1], zeit = filmzeit - szene.ab;
  const uebergang = weich(zeit / .14);
  const rgb = szene.rgb.map((v, i) => Math.round(vorher.rgb[i] + (v - vorher.rgb[i]) * uebergang)).join(",");
  const bewegung = .5 + .32 * Math.sin(t * 3.7) + .18 * Math.sin(t * 5.4);
  const pegel = weich(t / .23) * weich((dauer - t) / .30) * (.68 + .28 * bewegung);
  return { schnitt, rgb, zeit, pegel, staerke: .25 * pegel };
}

type Film = ReturnType<typeof videobild>;
const winkel = (flach: number) => -.21 + (-Math.PI / 2 + .05) * flach;
function griff(ort: Pt, flach: number): Pt {
  const a = winkel(flach);
  return [ort[0] + 1.55 * Math.cos(a) - 3.1 * Math.sin(a), ort[1] + 1.55 * Math.sin(a) + 3.1 * Math.cos(a)];
}

/** Geräteposition und Videolicht folgen derselben realen Phasenzeit. */
export class BettHandy {
  private index = 0;
  private zeit = 0;
  constructor(private readonly werte: AbendWerte = ABEND_RICHTWERTE) {}
  get fertig() { return this.index === BETT_HANDY.length; }
  get phase() { return this.fertig ? "fertig" : BETT_HANDY[this.index][0]; }
  get anrufzeit(): number | null { return this.phase === "anruf" ? this.zeit : null; }
  get sekunden() { return this.zeit; }
  private get dauer() {
    // Die letzte Ruhepose gehört bereits zur gewählten Gesprächsdauer.
    return this.phase === "video" ? this.werte.video : this.phase === "anruf" ? this.werte.anruf - ABEND_EINSCHLAFEN : BETT_HANDY[this.index]?.[1] ?? 0;
  }
  get rest() { return Math.max(0, this.dauer - this.zeit); }
  get abgelegt() { return this.phase === "anruf" || this.fertig || (this.phase === "unterschieben" && this.zeit >= ABEND_BETT.unterschieben - 1.05); }
  static fortsetzen(phase: string, sekunden: number, werte: AbendWerte) {
    const handy = new BettHandy(werte);
    handy.index = Math.max(0, BETT_HANDY.findIndex(([ph]) => ph === phase));
    handy.zeit = Math.max(0, phase === "wurf" ? Math.min(ABEND_BETT.wurf, sekunden) : Math.min(sekunden, handy.dauer));
    return handy;
  }
  static amKissen(sekunden: number, werte = ABEND_RICHTWERTE) { return this.fortsetzen("anruf", sekunden, werte); }
  tick(dt: number) {
    if (this.fertig) return;
    this.zeit += dt;
    // Nicht nach einer zweiten Uhr starten: erst der tatsächliche Aufprall gibt das Handy frei.
    while (!this.fertig && this.phase !== "wurf" && this.zeit >= this.dauer) {
      this.zeit -= this.dauer; this.index++;
    }
  }
  brilleAbgelegt() {
    if (this.phase === "wurf") { this.index++; this.zeit = 0; }
  }
  bild() {
    const ph = this.phase, p = Math.min(1, this.zeit / (this.dauer || 1));
    const e = weich(p);
    let hand = RUHE, geraet = UNTER_DECKE, arm = 1, flach = 0, sichtbar = false;
    let film: Film | null = null;
    switch (ph) {
      case "abnehmen":
        arm = weich(p / .25);
        hand = p < .55 ? zwischen(RUHE, NASE, weich(p / .55)) : zwischen(NASE, ABEND_WURFHAND, weich((p - .55) / .45));
        break;
      case "wurf":
        arm = 1 - weich(this.zeit / .85);
        hand = zwischen(ABEND_WURFHAND, RUHE, weich(this.zeit / .8)); break;
      case "holen":
        geraet = zwischen(UNTER_DECKE, VIDEO, e); sichtbar = true; hand = griff(geraet, 0); break;
      case "video":
        geraet = VIDEO; sichtbar = true; hand = griff(geraet, 0); film = videobild(this.zeit, this.werte.video); break;
      case "unterschieben":
        // Zuerst das Handgelenk flach drehen, dann die Kante unter den ruhenden Kopf schieben.
        const schub = Math.min(1, this.zeit / (ABEND_BETT.unterschieben - 1.05));
        flach = weich(schub / .48); sichtbar = true;
        geraet = zwischen(VIDEO, KISSEN, weich((schub - .19) / .81));
        geraet[1] = VIDEO[1] + (KISSEN[1] - VIDEO[1]) * flach;
        hand = zwischen(griff(geraet, flach), [326, KISSEN[1]], weich(1 - this.rest / 1.05)); break;
      case "anruf": case "fertig":
        geraet = KISSEN; flach = 1; sichtbar = true;
        hand = [326, KISSEN[1]]; arm = 0; break;
    }
    const muede = ph === "anruf" ? weich(1 - this.rest / 45) : 0;
    return { ph, t: this.zeit, p, hand, arm, geraet, sichtbar, flach, film, abgelegt: this.abgelegt,
      nimmtBrille: ph === "abnehmen" && p >= .55,
      spricht: ph === "anruf" && this.rest > 2 && Math.sin(this.zeit * 2.15 + .3) > -.15 + muede * 1.05 };
  }
}

export type BettBild = ReturnType<BettHandy["bild"]>;

/** Von außen sind Rücken und schmaler Glasrand zu sehen; die leuchtende Seite zeigt nach links zu Luni. */
function telefon(c: CanvasRenderingContext2D, ort: Pt, flach: number, film: Film | null) {
  c.save(); c.translate(...ort); c.rotate(winkel(flach));
  const w = 3.95 - 2.22 * flach;
  c.fillStyle = "#19222d"; c.beginPath(); c.roundRect(-w / 2, -5.65, w, 11.3, .7); c.fill();
  c.strokeStyle = "#82929a"; c.lineWidth = .43; c.lineCap = "round";
  c.beginPath(); c.moveTo(w / 2 - .48, -4.8); c.lineTo(w / 2 - .48, 4.65); c.stroke();
  if (flach < 1) {
    c.fillStyle = "#354650"; c.beginPath(); c.roundRect(-w / 2 + .16, -4.93, 1.35 * (1 - flach), 9.53, .4); c.fill();
    if (film) {
      c.save(); c.clip(); c.globalAlpha *= film.pegel;
      c.fillStyle = `rgb(${film.rgb})`; c.fillRect(-w / 2, -5, 1.8, 10);
      // Hellere und dunklere Silhouetten ziehen über denselben laufenden Farbschnitt.
      c.fillStyle = "rgba(255,249,227,.65)"; c.fillRect(-w / 2, -3.4 + film.schnitt * 1.1 + Math.sin(film.zeit * 2.3), 1.8, 1.3);
      c.fillStyle = "rgba(23,44,68,.35)"; c.fillRect(-w / 2, 1.5 + Math.sin(film.zeit * 1.85), 1.8, 3);
      c.restore();
    }
    c.fillStyle = "#64747f"; c.fillRect(w / 2 - 1.1, -4.35, .58, 1.25);
  }
  c.restore();
}

export function handyAufDemKissen(c: CanvasRenderingContext2D) { telefon(c, KISSEN, 1, null); }

export function bettHandgriff(c: CanvasRenderingContext2D, b: BettBild, stoff: string, haut: string) {
  if (!b.sichtbar) return;
  c.save(); c.lineCap = "round";
  if (b.arm) {
    // Der Ärmel reicht durchgehend vom verdeckten Schulteransatz bis zum Handgelenk.
    const wurzel: Pt = [318.9, 289.1];
    const laenge = Math.hypot(b.hand[0] - wurzel[0], b.hand[1] - wurzel[1]);
    const handgelenk = zwischen(b.hand, wurzel, Math.min(1, 2.85 / Math.max(.01, laenge)));
    c.strokeStyle = stoff; c.lineCap = "butt"; c.lineWidth = 3.8; c.beginPath(); c.moveTo(...wurzel); c.lineTo(...handgelenk); c.stroke();
    c.lineCap = "round";
    c.strokeStyle = haut; c.lineWidth = 2.85; c.beginPath(); c.moveTo(...handgelenk); c.lineTo(...b.hand); c.stroke();
  }
  if (!b.abgelegt) telefon(c, b.geraet, b.flach, b.film);
  if (b.arm) {
    c.fillStyle = haut; c.beginPath(); c.ellipse(...b.hand, 2.1, 1.55, -.19, 0, 2 * Math.PI); c.fill();
    c.strokeStyle = haut; c.lineWidth = 1.25; c.beginPath(); c.moveTo(b.hand[0] + .55, b.hand[1]);
    c.quadraticCurveTo(b.hand[0] - .5, b.hand[1] - 2, b.hand[0] - 1.9, b.hand[1] - 1.7); c.stroke();
  }
  c.restore();
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