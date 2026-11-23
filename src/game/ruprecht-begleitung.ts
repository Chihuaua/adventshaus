import { nikolausWaldweg, TUERWEG, WALDWEG_SEK, type NikolausBesuch } from "./nikolaus-besuch";
import type { NikolausBild } from "./nikolaus-figur";

type Besuchszeit = Pick<NikolausBesuch, "phase" | "zeit">;
type Ortsbild = NikolausBild & { x: number; y: number };
export const HALBER_SCHRITT = .56;
const grenze = (k: number) => Math.max(0, Math.min(1, k));

function ruprechtsWeg(u: number) {
  const p = nikolausWaldweg(u);
  return { x: p.x + 34 * p.skala, y: p.y - 1.65 * p.skala, skala: p.skala };
}

/** Keine zweite Uhr und kein eigener Spielstand: Auch nach dem Laden bleiben beide beisammen. */
export function ruprechtBegleitung({ phase, zeit }: Besuchszeit): Ortsbild | null {
  if (phase === "ruhe") return null;
  const weg = (u: number, heim: boolean, t: number): Ortsbild => ({
    ...ruprechtsWeg(grenze(u)), zeit: t, ansicht: heim ? "hinten" : "vorn", pose: "gehen",
  });
  const vorTuer = ruprechtsWeg(1), stufe = (t: number, hinaus: boolean): Ortsbild => {
    const k = grenze(t / TUERWEG), weich = k * k * (3 - 2 * k);
    return { ...vorTuer, x: vorTuer.x - 36 * (hinaus ? 1 - weich : weich),
      y: vorTuer.y + .8 * (hinaus ? 1 - weich : weich),
      zeit: Math.max(0, t), ansicht: hinaus ? "rechts" : "links", pose: t > 0 ? "gehen" : "stehen" };
  };
  if (phase === "waldweg") {
    if (zeit < HALBER_SCHRITT) return null;
    return weg((zeit - HALBER_SCHRITT) / WALDWEG_SEK, false, zeit - HALBER_SCHRITT);
  }
  if (phase === "warten") {
    if (zeit < HALBER_SCHRITT) return weg(1 - (HALBER_SCHRITT - zeit) / WALDWEG_SEK, false, WALDWEG_SEK + zeit - HALBER_SCHRITT);
    return { ...vorTuer, zeit, ansicht: "links", pose: "stehen" };
  }
  if (phase === "eintreten") return stufe(zeit - HALBER_SCHRITT, false);
  if (phase === "gruss") {
    if (zeit < HALBER_SCHRITT) return stufe(TUERWEG + zeit - HALBER_SCHRITT, false);
    return { ...stufe(TUERWEG, false), zeit: zeit - HALBER_SCHRITT, pose: "gruessen" };
  }
  if (phase === "austreten") {
    // An der Schwelle wartet er auf Nikolaus und geht dann neben ihm zurueck.
    return stufe(zeit, true);
  }
  const u = 1 - grenze((zeit - HALBER_SCHRITT) / (WALDWEG_SEK - HALBER_SCHRITT));
  return { ...weg(u, true, Math.max(0, zeit - HALBER_SCHRITT)), pose: zeit < HALBER_SCHRITT ? "stehen" : "gehen" };
}

/** Seine breiteren Sohlen und die kleinen Einstiche des Wanderstabs liegen in einer eigenen Spur. */
export function zeichneRuprechtSpur(c: CanvasRenderingContext2D, { phase, zeit }: Besuchszeit) {
  if (phase === "ruhe") return;
  const bis = phase === "waldweg" ? grenze((zeit - HALBER_SCHRITT) / WALDWEG_SEK) : 1;
  const staerke = phase === "heimweg" ? 1 - grenze(zeit / WALDWEG_SEK) : 1;
  c.save(); c.globalAlpha *= .22 * staerke;
  for (let i = 1; i < 19; i++) {
    const u = i / 19;
    if (u >= bis - .022) break;
    const { x, y, skala: s } = ruprechtsWeg(u), d = i % 2 ? 1 : -1;
    c.fillStyle = "#697e85"; c.beginPath();
    c.ellipse(x + d * 4.95 * s, y, 2.12 * s, 3.12 * s, .31 + d * .17, 0, 2 * Math.PI); c.fill();
    if (d > 0) { c.beginPath(); c.ellipse(x - 16.7 * s, y - .5 * s, .99 * s, .7 * s, 0, 0, 2 * Math.PI); c.fill(); }
  }
  c.restore();
}