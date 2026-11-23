import type { NikolausBild } from "./nikolaus-figur";

type Datum = { year: number; month: number; day: number };
type Phase = "ruhe" | "waldweg" | "warten" | "eintreten" | "gruss" | "austreten" | "heimweg";
export type NikolausEreignis = "anklopfen" | "eintreten" | "abschied" | "tuerFrei" | "ende";
export interface NikolausStand { v: 1; jahr: number; phase: Phase; zeit: number; tuerVorher: number | null }
export const WALDWEG_SEK = 15;
export const TUERWEG = 2.8;
const PHASEN: readonly Phase[] = ["ruhe", "waldweg", "warten", "eintreten", "gruss", "austreten", "heimweg"];
const grenze = (x: number) => Math.max(0, Math.min(1, x));
const weich = (x: number) => x * x * (3 - 2 * x);
export const istNikolaustag = (datum: Datum) => datum.month === 12 && datum.day === 6;

/** Der Wald endet im Hintergrund bei y=458, die Gartenschwelle liegt bei y=572. */
export function nikolausWaldweg(anteil: number) {
  const u = grenze(anteil), tiefe = u * (.38 + .62 * u);
  return {
    x: 907 - 48 * tiefe - 5.1 * Math.sin(tiefe * Math.PI * 2),
    y: 456.5 + 115.5 * tiefe,
    skala: .085 + .735 * tiefe,
  };
}

/** Keine eigene Uhr: Der Kalender kommt aus der Berliner Hausuhr, Zeit in Sekunden. */
export class NikolausBesuch {
  phase: Phase = "ruhe";
  zeit = 0;
  jahr = 0;
  tuerVorher: number | null = null;
  get aktiv() { return this.phase !== "ruhe"; }

  rufen(datum: Datum) {
    if (this.aktiv) return false;
    if (istNikolaustag(datum)) this.jahr = datum.year;
    this.wechsel("waldweg");
    return true;
  }

  kalender(datum: Datum) {
    return istNikolaustag(datum) && this.jahr !== datum.year && this.rufen(datum);
  }

  private wechsel(phase: Phase) { this.phase = phase; this.zeit = 0; }

  schritt(dt: number, luniDa: boolean, tuerOffen: boolean): NikolausEreignis | null {
    if (!this.aktiv || !Number.isFinite(dt) || dt <= 0) return null;
    this.zeit += dt;
    switch (this.phase) {
      case "waldweg":
        if (this.zeit >= WALDWEG_SEK) { this.wechsel("warten"); return "anklopfen"; }
        break;
      case "warten":
        if (luniDa && tuerOffen && this.zeit >= 1.2) { this.wechsel("eintreten"); return "eintreten"; }
        // Eigene Befehle haben Vorrang: Ist Luni beschaeftigt, wartet er nicht endlos.
        if (this.zeit >= 90) { this.wechsel("heimweg"); return "tuerFrei"; }
        break;
      case "eintreten":
        if (this.zeit >= TUERWEG) this.wechsel("gruss");
        break;
      case "gruss":
        if (this.zeit >= 10) { this.wechsel("austreten"); return "abschied"; }
        break;
      case "austreten":
        if (this.zeit >= TUERWEG) { this.wechsel("heimweg"); return "tuerFrei"; }
        break;
      case "heimweg":
        if (this.zeit >= WALDWEG_SEK) { this.wechsel("ruhe"); return "ende"; }
        break;
    }
    return null;
  }

  bild(): (NikolausBild & { x: number; y: number }) | null {
    if (!this.aktiv) return null;
    const zeit = this.zeit;
    if (this.phase === "waldweg" || this.phase === "heimweg") {
      const heim = this.phase === "heimweg", u = grenze(zeit / WALDWEG_SEK);
      return { ...nikolausWaldweg(heim ? 1 - u : u), zeit, ansicht: heim ? "hinten" : "vorn", pose: "gehen" };
    }
    const hinein = this.phase === "eintreten", hinaus = this.phase === "austreten";
    const p = weich(grenze(zeit / TUERWEG));
    const x = hinein ? 859 - 36 * p : hinaus ? 823 + 36 * p : this.phase === "gruss" ? 823 : 859;
    return { x, y: 572, skala: .82, zeit, ansicht: hinaus ? "rechts" : "links",
      pose: hinein || hinaus ? "gehen" : this.phase === "gruss" ? "gruessen" : "stehen" };
  }

  stand(): NikolausStand {
    return { v: 1, jahr: this.jahr, phase: this.phase, zeit: this.zeit, tuerVorher: this.tuerVorher };
  }

  laden(s: NikolausStand | null) {
    if (!s || s.v !== 1 || !Number.isInteger(s.jahr) || s.jahr < 0 || !PHASEN.includes(s.phase)
        || !Number.isFinite(s.zeit) || s.zeit < 0) return;
    this.jahr = s.jahr; this.phase = s.phase; this.zeit = Math.min(s.zeit, 90);
    this.tuerVorher = s.tuerVorher === 0 || s.tuerVorher === 1 ? s.tuerVorher : null;
  }
}

/** Zwei kleine Sohlenabdruecke je Schrittpaar. Auf dem Heimweg verweht die Spur. */
export function zeichneNikolausSpur(c: CanvasRenderingContext2D, besuch: NikolausBesuch) {
  if (!besuch.aktiv) return;
  const bis = besuch.phase === "waldweg" ? besuch.zeit / WALDWEG_SEK : 1;
  const sichtbar = besuch.phase === "heimweg" ? 1 - grenze(besuch.zeit / WALDWEG_SEK) : 1;
  c.save(); c.globalAlpha *= sichtbar * .25;
  for (let i = 1; i <= 19; i++) {
    const u = i / 20;
    if (u > bis - .025) break;
    const { x, y, skala: s } = nikolausWaldweg(u), seite = i % 2 ? 1 : -1;
    c.fillStyle = "#667d8b"; c.beginPath();
    c.ellipse(x + seite * 4.3 * s, y, 1.8 * s, 3.2 * s, .3 + seite * .13, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#f6f8eb"; c.beginPath();
    c.ellipse(x + seite * 4.3 * s - .5 * s, y + 2.9 * s, 1.1 * s, .48 * s, .1, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}