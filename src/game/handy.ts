export type HandyModus = "scroll" | "write" | "video" | "call";

interface HandyHaltung {
  oben: number;
  ohr: number;
  quer: number;
}

type Abschnitt = {
  art: "holen" | "nutzen" | "einstecken" | "pause";
  modus: HandyModus;
  dauer: number;
  von: HandyHaltung;
  bis: HandyHaltung;
};

const TASCHENWEG = 0.85;
export const HANDY_TASCHE_SICHTBAR = 0.16;
const TASCHENHALTUNG: HandyHaltung = { oben: 0, ohr: 0, quer: 0 };
const haltung = (modus: HandyModus): HandyHaltung => ({ oben: 1, ohr: Number(modus === "call"), quer: Number(modus === "video") });
const weich = (p: number) => { const k = Math.max(0, Math.min(1, p)); return k * k * (3 - 2 * k); };

/** Eine Sitzung: Netz/Schreiben/Video, Telefonat, kurz zurueck ins Netz. */
export class HandyAblauf {
  private abschnitte: Abschnitt[] = [];
  private index = 0;
  private t = 0;
  private nutzung = 0;
  private zeit = 0;
  private rauchPauseBei: number | null;
  private rauchPauseBis: number | null = null;

  constructor(zufall = Math.random) {
    const gesamt = 176 + 8 * zufall();
    // Vor dem Telefonat steckt sie das Handy seltener ein als danach.
    const vorAnruf = zufall() < 0.22 ? 2.2 + 2 * zufall() : 0;
    const nachAnruf = zufall() < 0.62 ? 2.5 + 2.5 * zufall() : 0;
    const pausen = [vorAnruf, nachAnruf].reduce((summe, pause) => summe + (pause ? pause + 2 * TASCHENWEG : 0), 0);
    const aktiv = gesamt - pausen - 2 * TASCHENWEG;
    const nutzen = (modus: HandyModus, anteil: number) => {
      const davor = this.abschnitte[this.abschnitte.length - 1];
      this.abschnitte.push({ art: "nutzen", modus, dauer: aktiv * anteil, von: davor.bis, bis: haltung(modus) });
    };
    const holen = (modus: HandyModus) => this.abschnitte.push({ art: "holen", modus, dauer: TASCHENWEG, von: TASCHENHALTUNG, bis: haltung(modus) });
    const einstecken = (modus: HandyModus) => this.abschnitte.push({ art: "einstecken", modus, dauer: TASCHENWEG, von: haltung(modus), bis: TASCHENHALTUNG });
    const grenze = (pause: number, von: HandyModus, zu: HandyModus) => {
      if (!pause) return;
      einstecken(von);
      this.abschnitte.push({ art: "pause", modus: von, dauer: pause, von: TASCHENHALTUNG, bis: TASCHENHALTUNG });
      holen(zu);
    };
    holen("scroll");
    nutzen("scroll", 0.16);
    nutzen("write", 0.13);
    nutzen("video", 0.22);
    grenze(vorAnruf, "video", "call");
    nutzen("call", 0.32);
    grenze(nachAnruf, "call", "scroll");
    nutzen("scroll", 0.17);
    einstecken("scroll");
    this.rauchPauseBei = zufall() < 0.68 ? 18 + (aktiv - 46) * zufall() : null;
  }

  get fertig() { return this.index >= this.abschnitte.length; }

  get pose() {
    const a = this.abschnitte[this.index];
    if (!a || a.art === "pause") return null;
    const p = weich(this.t / (a.art === "nutzen" ? 0.8 : a.dauer));
    const misch = (von: number, bis: number) => von + (bis - von) * p;
    const oben = misch(a.von.oben, a.bis.oben);
    return { modus: a.modus, zeit: this.t, benutzt: a.art === "nutzen", oben,
      sichtbar: oben > HANDY_TASCHE_SICHTBAR, ohr: misch(a.von.ohr, a.bis.ohr), quer: misch(a.von.quer, a.bis.quer) };
  }

  private get hatZeitFuerAschgriff() {
    const a = this.abschnitte[this.index];
    return a?.art === "nutzen" && a.dauer - this.t > 1.15;
  }

  get kippeAblegen() {
    return this.rauchPauseBei !== null && this.nutzung >= this.rauchPauseBei && this.hatZeitFuerAschgriff;
  }

  get kippeNehmen() {
    return this.rauchPauseBis !== null && this.zeit >= this.rauchPauseBis && this.hatZeitFuerAschgriff;
  }

  kippeAbgelegt(dauer: number) {
    this.rauchPauseBei = null;
    this.rauchPauseBis = this.zeit + dauer;
  }

  kippeGenommen() { this.rauchPauseBis = null; }

  vorBefehlEinstecken() {
    const pose = this.pose;
    if (!pose) {
      this.index = this.abschnitte.length;
    } else if (this.abschnitte[this.index].art === "einstecken") {
      this.abschnitte.length = this.index + 1;
    } else {
      this.abschnitte = [{ art: "einstecken", modus: pose.modus, dauer: TASCHENWEG * pose.oben, von: pose, bis: TASCHENHALTUNG }];
      this.index = 0;
      this.t = 0;
    }
  }

  tick(dt: number) {
    this.zeit += dt;
    while (dt > 0 && !this.fertig) {
      const a = this.abschnitte[this.index];
      const schritt = Math.min(dt, a.dauer - this.t);
      if (a.art === "nutzen") this.nutzung += schritt;
      dt -= schritt;
      this.t += schritt;
      if (this.t >= a.dauer) { this.index++; this.t = 0; }
    }
  }
}