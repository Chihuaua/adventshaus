/* =======================================================================
   POSTFROSCH-ZUSTELLROUTINE (ausgelöst durch den Poststein)

   Ablauf:
     1. Methan Frog fährt mit dem Postwagen von links ins Bild und parkt vor
        dem Tannenbaum im Vorgarten.
     2. Er steigt aus, geht zur Schiebetür, öffnet sie – die leere Ladefläche
        mit einem einzigen Paket wird sichtbar – und nimmt das Paket.
     3. Er geht nach rechts hinter das Haus; durch das Türfenster sieht man
        ihn an der Haustür stehen.
     4. Er klingelt (Ding-Dong, Comic-Sprechblase synchron dazu), höchstens
        dreimal im Abstand von 32 Sekunden; nach dem dritten Klingeln wartet
        er noch 23 Sekunden.
     5. Geht Luni zur Tür, öffnet sie und nimmt das Paket an. Sonst legt er
        es vor die Tür (man sieht durchs Fenster nur, wie der Kopf kurz nach
        unten geht) und geht.
     6. Zurück am Wagen schließt er die Schiebetür, steigt ein und fährt nach
        rechts hinter das Haus und dann rechts entlang der weißen Wegkante aus
        dem Bild.

   Die Seitenansichten des Froschs folgen später; bis dahin werden Front- und
   Rückansicht verwendet. Reine Canvas-2D-Primitive, Klänge synthetisch.
   ======================================================================= */

import { sfx } from "./audio";
import { drawGeschenkPaket, drawMethanFrog, type MethanPose } from "./lieferfrosch";

type C = CanvasRenderingContext2D;

/* ------------------------------ Szene ---------------------------------- */

/** Böden (wie FLOOR_Y im Haus): Erdgeschoss und Keller. */
const FE = 448;
const FK = 572;
const W = 960;
/** Außenkanten des Hauses: links bis 98 ist Vorgarten, rechts ab 842 Garten. */
const WAND_L = 98;
const WAND_R = 842;
/** Figurengröße wie Luni. */
const SKALA = 1.08;

/** Haustür (haustuer() bei x = 135): Türblatt und Türfenster. */
export const POST_TUER = { x: 135, y: FE - 82, w: 52, h: 82 } as const;
export const POST_FENSTER = { x: 145, y: FE - 72, w: 32, h: 24 } as const;
const TUER_MITTE = POST_TUER.x + POST_TUER.w / 2;

/** Postwagen: Länge, Parkposition (Heck), Boden links und rechts. */
const WAGEN_L = 94;
/** Heck ragt etwas aus dem Bild, damit vor dem Wagen Platz zum Herumgehen bleibt. */
const PARK_X = -14;
const BODEN_L = FE + 4;
const BODEN_R = FK + 11;
/** Frosch läuft vor dem Wagen (näher am Betrachter). */
const FROSCH_Y = FE + 9;
/** Halteplätze des Froschs am Wagen. */
const AN_FAHRERTUER = PARK_X + 74;
/** Frosch steht rechts neben dem Türgriff; mit der Hand am Griff geht er mit der Tür mit. */
const GRIFF_ZU = PARK_X + 53;
const GRIFF_AUF = PARK_X + 29;
const GRIFF_ABSTAND = 7;
const AN_SCHIEBETUER = GRIFF_ZU + GRIFF_ABSTAND;
const AN_SCHIEBETUER_OFFEN = GRIFF_AUF + GRIFF_ABSTAND;
/** Paket mitten im Laderaum */
const AM_PAKET = PARK_X + 45;
/** Vor der Motorhaube: hier kommt er von der Fahrerseite nach vorn. */
const AN_FRONT = PARK_X + 102;
/** Gehgeschwindigkeit (Einheiten pro Sekunde). */
const TEMPO = 18;

/** Nach dem dritten Klingeln: kurze Pause, dann dreimal klopfen. */
const PAUSE_VOR_KLOPFEN = 3;
const KLOPF_ZEITEN = [0.3, 0.85, 1.4] as const;
const KLOPF_DAUER = 2.2;
/** Blinzeln: 5 s nach dem Klingeln zweimal kurz. */
const BLINZELN = [[5.0, 5.12], [5.3, 5.42]] as const;
/** Klingeln: höchstens drei Mal, Abstand 32 s, danach noch 23 s Wartezeit. */
const KLINGEL_ABSTAND = 32;
const LETZTE_WARTEZEIT = 23;
const KLINGEL_DAUER = 1.6;
const DING_BEI = 0.35;

type Phase =
  | "anfahrt"
  | "aussteigen"
  | "umFront"
  | "zurSchiebetuer"
  | "schiebetuerAuf"
  | "paketNehmen"
  | "zumHaus"
  | "klingeln"
  | "warten"
  | "klopfen"
  | "tuerAuf"
  | "uebergabe"
  | "gruss"
  | "tuerZu"
  | "ablegen"
  | "zurueck"
  | "schiebetuerZu"
  | "zurFahrertuer"
  | "hintenRum"
  | "einsteigen"
  | "abfahrt"
  | "hinterHaus"
  | "rechtsRaus";

type Abholung = "auf" | "nehmen" | "zu";

/** Ereignisse für das Haus (Speichern, Luni freigeben). */
export interface PostEreignisse {
  paketAbgelegt?: boolean;
  paketWeg?: boolean;
  luniFrei?: boolean;
}

export interface PostZeichnung {
  sky: CanvasImageSource;
  elapsed: number;
  festlich: boolean;
}

const sanft = (v: number) => {
  const k = Math.min(1, Math.max(0, v));
  return k * k * (3 - 2 * k);
};

/* ----------------------------- Ablauf ---------------------------------- */

export class Postfrosch {
  phase: Phase | null = null;
  /** liegt ein Paket vor der Haustür (gespeichert vom Haus) */
  paketVorTuer = false;

  private pt = 0;
  private walk = 0;
  private fx = 0;
  private wagenX = -140;
  private rad = 0;
  private schiebe = 0;
  private fahrerTuer = 0;
  private tuer = 0;
  private paketImWagen = true;
  private paketBeiFrosch = false;
  private klingelZahl = 0;
  private dingGespielt = false;
  private blaseT = -1;
  private klopfT = -1;
  private geklopft = false;
  private nachKlingeln = false;
  private motorAn = false;
  private abholung: Abholung | null = null;
  private abT = 0;
  private auspuff: { x: number; y: number; t: number }[] = [];

  get aktiv() {
    return this.phase !== null;
  }

  /** Steht der Frosch klingelnd vor der Tür? (Luni kann dann öffnen) */
  get anDerTuer() {
    return this.phase === "klingeln" || this.phase === "warten" || this.phase === "klopfen";
  }

  /** Ist die Haustür gerade ein sinnvolles Ziel für Luni? */
  get tuerZiel() {
    if (this.anDerTuer) return true;
    return this.paketVorTuer && !this.abholung && !this.froschHinterHaus();
  }

  /** Beschriftung der vorhandenen Haustür-Station während der Zustellung. */
  get tuerLabel() {
    if (this.anDerTuer) return "Haustür öffnen";
    if (this.paketVorTuer) return "Paket holen";
    return "Haustür";
  }

  /** Wird das Türfenster gerade übermalt (für Fensterkranz im Weihnachtshaus)? */
  get fensterBelegt() {
    return this.tuer < 0.001 && this.froschImFenster();
  }

  start() {
    if (this.aktiv) return;
    this.phase = "anfahrt";
    this.pt = 0;
    this.walk = 0;
    this.wagenX = -WAGEN_L - 40;
    this.schiebe = 0;
    this.fahrerTuer = 0;
    this.tuer = 0;
    this.paketImWagen = true;
    this.paketBeiFrosch = false;
    this.klingelZahl = 0;
    this.blaseT = -1;
    this.klopfT = -1;
    this.geklopft = false;
    this.auspuff = [];
    this.motor(true);
  }

  private motor(an: boolean) {
    if (an === this.motorAn) return;
    this.motorAn = an;
    sfx.motor(an);
  }

  private wechsel(p: Phase | null) {
    this.phase = p;
    this.pt = 0;
    this.dingGespielt = false;
  }

  /** Geht der Frosch gerade hinter dem Haus entlang (zwischen Wand und Tür)? */
  private froschHinterHaus() {
    return this.phase === "zumHaus" || this.phase === "zurueck" || this.anDerTuer
      || this.phase === "ablegen" || this.phase === "tuerAuf" || this.phase === "uebergabe"
      || this.phase === "gruss" || this.phase === "tuerZu";
  }

  private froschImFenster() {
    if (!this.froschHinterHaus()) return false;
    return this.fx > POST_FENSTER.x - 14 && this.fx < POST_FENSTER.x + POST_FENSTER.w + 14;
  }

  /** Gehen von a nach b mit fester Geschwindigkeit; true, wenn angekommen. */
  private gehe(ziel: number, dt: number) {
    const d = ziel - this.fx;
    const schritt = TEMPO * dt;
    this.walk += dt * 5;
    if (Math.abs(d) <= schritt) {
      this.fx = ziel;
      return true;
    }
    this.fx += Math.sign(d) * schritt;
    return false;
  }

  update(dt: number, luniAnTuer: boolean): PostEreignisse {
    const ev: PostEreignisse = {};
    if (this.blaseT >= 0) {
      this.blaseT += dt;
      if (this.blaseT > 2.6) this.blaseT = -1;
    }
    if (this.klopfT >= 0) {
      this.klopfT += dt;
      if (this.klopfT > 3.4) this.klopfT = -1;
    }
    for (const p of this.auspuff) p.t += dt;
    this.auspuff = this.auspuff.filter((p) => p.t < 1.6);

    // Abholung ohne Frosch: Luni öffnet, nimmt das Paket, schließt.
    if (!this.phase || this.phase === "rechtsRaus" || this.phase === "abfahrt" || this.phase === "hinterHaus"
      || this.phase === "einsteigen" || this.phase === "zurFahrertuer" || this.phase === "schiebetuerZu") {
      this.updateAbholung(dt, luniAnTuer, ev);
    }
    if (!this.phase) return ev;
    this.pt += dt;
    const p = this.phase;

    switch (p) {
      case "anfahrt": {
        const k = sanft(this.pt / 4.2);
        const alt = this.wagenX;
        this.wagenX = -WAGEN_L - 40 + (PARK_X + WAGEN_L + 40) * (1 - (1 - k) * (1 - k));
        this.rad += (this.wagenX - alt) / 7;
        this.qualm(dt);
        if (this.pt >= 4.2) {
          this.wagenX = PARK_X;
          this.motor(false);
          sfx.autotuer();
          this.wechsel("aussteigen");
        }
        break;
      }
      case "aussteigen":
        // Fahrerseite liegt hinter dem Wagen: man hört die Tür, sieht die Mütze über dem Dach
        this.fx = AN_FAHRERTUER;
        if (this.pt >= 1.0) {
          sfx.autotuer();
          this.wechsel("umFront");
        }
        break;
      case "umFront":
        // hinter dem Wagen nach vorn und um die Motorhaube herum
        if (this.gehe(AN_FRONT, dt)) this.wechsel("zurSchiebetuer");
        break;
      case "zurSchiebetuer":
        if (this.gehe(AN_SCHIEBETUER, dt)) {
          sfx.schiebetuer(true);
          this.wechsel("schiebetuerAuf");
        }
        break;
      case "schiebetuerAuf": {
        // Griff fassen (0,3 s), dann mit der Tür zur Seite gehen
        const k = sanft((this.pt - 0.3) / 1.2);
        if (this.pt > 0.3) this.walk += dt * 5;
        this.schiebe = k;
        this.fx = AN_SCHIEBETUER + (AN_SCHIEBETUER_OFFEN - AN_SCHIEBETUER) * k;
        if (this.pt >= 1.6) this.wechsel("paketNehmen");
        break;
      }
      case "paketNehmen":
        if (this.pt < 0.8) this.gehe(AM_PAKET, dt);
        if (this.pt > 1.0 && this.paketImWagen) {
          this.paketImWagen = false;
          this.paketBeiFrosch = true;
        }
        if (this.pt >= 1.6) this.wechsel("zumHaus");
        break;
      case "zumHaus":
        if (this.gehe(TUER_MITTE, dt)) this.wechsel("klingeln");
        break;
      case "klingeln":
        if (luniAnTuer) {
          this.wechsel("tuerAuf");
          break;
        }
        if (!this.dingGespielt && this.pt >= DING_BEI) {
          this.dingGespielt = true;
          this.klingelZahl++;
          this.blaseT = 0;
          sfx.dingDong();
        }
        if (this.pt >= KLINGEL_DAUER) {
          this.wechsel("warten");
          this.nachKlingeln = true;
        }
        break;
      case "warten": {
        if (luniAnTuer) {
          this.wechsel("tuerAuf");
          break;
        }
        if (this.klingelZahl >= 3 && !this.geklopft) {
          if (this.pt >= PAUSE_VOR_KLOPFEN) this.wechsel("klopfen");
          break;
        }
        const warte = this.klingelZahl >= 3 ? LETZTE_WARTEZEIT : KLINGEL_ABSTAND - KLINGEL_DAUER;
        if (this.pt >= warte) this.wechsel(this.klingelZahl >= 3 ? "ablegen" : "klingeln");
        break;
      }
      case "klopfen":
        if (luniAnTuer) {
          this.wechsel("tuerAuf");
          break;
        }
        if (this.pt - dt < KLOPF_ZEITEN[0] && this.pt >= KLOPF_ZEITEN[0]) this.klopfT = 0;
        for (const kz of KLOPF_ZEITEN) if (this.pt - dt < kz && this.pt >= kz) sfx.klopfen();
        if (this.pt >= KLOPF_DAUER) {
          this.geklopft = true;
          this.wechsel("warten");
          this.nachKlingeln = false;
        }
        break;
      case "tuerAuf":
        this.tuer = sanft(this.pt / 0.9);
        if (this.pt >= 0.95) this.wechsel("uebergabe");
        break;
      case "uebergabe":
        if (this.pt > 1.5 && this.paketBeiFrosch) {
          this.paketBeiFrosch = false;
          ev.paketWeg = true;
        }
        if (this.pt >= 2.4) this.wechsel("gruss");
        break;
      case "gruss":
        if (this.pt >= 1.3) this.wechsel("tuerZu");
        break;
      case "tuerZu":
        this.tuer = 1 - sanft(this.pt / 0.9);
        if (this.pt >= 0.95) {
          this.tuer = 0;
          sfx.holzDumpf();
          ev.luniFrei = true;
          this.wechsel("zurueck");
        }
        break;
      case "ablegen":
        if (this.pt > 1.0 && this.paketBeiFrosch) {
          this.paketBeiFrosch = false;
          this.paketVorTuer = true;
          ev.paketAbgelegt = true;
        }
        if (this.pt >= 2.2) this.wechsel("zurueck");
        break;
      case "zurueck":
        if (this.gehe(AN_SCHIEBETUER_OFFEN, dt)) {
          sfx.schiebetuer(false);
          this.wechsel("schiebetuerZu");
        }
        break;
      case "schiebetuerZu": {
        // Griff fassen, dann mit der Tür zurück, bis sie geschlossen ist
        const k = sanft((this.pt - 0.3) / 1.2);
        if (this.pt > 0.3) this.walk += dt * 5;
        this.schiebe = 1 - k;
        this.fx = AN_SCHIEBETUER_OFFEN + (AN_SCHIEBETUER - AN_SCHIEBETUER_OFFEN) * k;
        if (this.pt >= 1.6) {
          this.schiebe = 0;
          this.wechsel("zurFahrertuer");
        }
        break;
      }
      case "zurFahrertuer":
        // vorne um die Motorhaube herum zur Fahrerseite
        if (this.gehe(AN_FRONT, dt)) this.wechsel("hintenRum");
        break;
      case "hintenRum":
        if (this.gehe(AN_FAHRERTUER, dt)) this.wechsel("einsteigen");
        break;
      case "einsteigen":
        // steigt auf der Fahrerseite (hinter dem Wagen) ein
        if (this.pt >= 0.9 && this.pt - dt < 0.9) sfx.autotuer();
        if (this.pt >= 1.3) {
          this.motor(true);
          this.wechsel("abfahrt");
        }
        break;
      case "abfahrt": {
        const k = this.pt / 3.2;
        const alt = this.wagenX;
        this.wagenX = PARK_X + 130 * k * k;
        this.rad += (this.wagenX - alt) / 7;
        this.qualm(dt);
        if (this.pt >= 3.2) this.wechsel("hinterHaus");
        break;
      }
      case "hinterHaus":
        if (this.pt >= 2.2) {
          this.wagenX = WAND_R - WAGEN_L;
          this.wechsel("rechtsRaus");
        }
        break;
      case "rechtsRaus": {
        const alt = this.wagenX;
        this.wagenX = WAND_R - WAGEN_L + (W + 30 - (WAND_R - WAGEN_L)) * (this.pt / 4.2);
        this.rad += (this.wagenX - alt) / 7;
        this.qualm(dt);
        if (this.pt >= 4.2) {
          this.motor(false);
          this.wechsel(null);
        }
        break;
      }
    }
    return ev;
  }

  private updateAbholung(dt: number, luniAnTuer: boolean, ev: PostEreignisse) {
    if (!this.abholung) {
      if (luniAnTuer && this.paketVorTuer) {
        this.abholung = "auf";
        this.abT = 0;
      }
      return;
    }
    this.abT += dt;
    if (this.abholung === "auf") {
      this.tuer = sanft(this.abT / 0.8);
      if (this.abT >= 0.85) {
        this.abholung = "nehmen";
        this.abT = 0;
      }
    } else if (this.abholung === "nehmen") {
      if (this.abT >= 1.0 && this.paketVorTuer) {
        this.paketVorTuer = false;
        ev.paketWeg = true;
      }
      if (this.abT >= 1.6) {
        this.abholung = "zu";
        this.abT = 0;
      }
    } else {
      this.tuer = 1 - sanft(this.abT / 0.8);
      if (this.abT >= 0.85) {
        this.tuer = 0;
        this.abholung = null;
        sfx.holzDumpf();
        ev.luniFrei = true;
      }
    }
  }

  /** Auspuffwölkchen hinter dem fahrenden Wagen. */
  private qualm(dt: number) {
    if (Math.random() < dt * 9) {
      const rechts = this.phase === "rechtsRaus";
      this.auspuff.push({ x: this.wagenX - 2, y: (rechts ? BODEN_R : BODEN_L) - 8, t: 0 });
    }
  }

  /* ----------------------------- Zeichnen ------------------------------ */

  /** Szene vor der Lichtschicht: Wagen, Frosch, offene Haustür, Fensterblick. */
  draw(c: C, z: PostZeichnung) {
    if (!this.phase && !this.abholung && !this.paketVorTuer) return;
    const p = this.phase;

    // 1) Vorgarten links (bis zur Hauswand): Wagen und Frosch
    const wagenLinks = p !== null && p !== "hinterHaus" && p !== "rechtsRaus";
    if (wagenLinks || (p && (this.froschDraussen() || this.froschHinterWagen()))) {
      c.save();
      c.beginPath();
      c.rect(0, 0, WAND_L, 600);
      c.clip();
      for (const q of this.auspuff) if (q.y < FK) zeichneQualm(c, q.x, q.y, q.t);
      if (this.froschHinterWagen()) this.zeichneFroschHinterWagen(c, z.elapsed);
      if (wagenLinks) this.zeichneWagen(c, this.wagenX, BODEN_L, z);
      if (this.froschDraussen()) this.zeichneFroschDraussen(c, z.elapsed);
      c.restore();
    }

    // 4) Garten rechts: Wagen fährt entlang der Wegkante aus dem Bild
    if (p === "rechtsRaus") {
      c.save();
      c.beginPath();
      c.rect(WAND_R, 0, W - WAND_R, 600);
      c.clip();
      for (const q of this.auspuff) if (q.y > FK) zeichneQualm(c, q.x, q.y, q.t);
      this.zeichneWagen(c, this.wagenX, BODEN_R, z);
      c.restore();
    }
  }

  /** Haustür und Türfenster (wird vor Luni gezeichnet, damit sie davor steht). */
  drawTuer(c: C, z: PostZeichnung) {
    if (!this.phase && !this.abholung) return;
    const p = this.phase;
    // 2) Haustür offen: Blick nach draußen, Frosch im Türrahmen, Paket auf der Schwelle
    if (this.tuer > 0.001) {
      const { x, y, w, h } = POST_TUER;
      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
      c.drawImage(z.sky, 0, 0, W, 600);
      // verschneiter Boden hinter dem Haus
      c.fillStyle = "#e8eff6";
      c.fillRect(x, FE - 8, w, 8);
      c.fillStyle = "#ffffff";
      c.fillRect(x, FE - 8, w, 1.6);
      if (this.paketVorTuer) drawGeschenkPaket(c, [TUER_MITTE + 6, FE - 6], 0.62);
      if (this.froschHinterHaus() && p && p !== "zurueck") {
        this.zeichneFroschAnTuer(c, z.elapsed);
      }
      // Türblatt schwenkt nach innen auf (schmaler, mit Schattenkante)
      const blatt = w * (1 - 0.8 * this.tuer);
      c.fillStyle = "#6e4a2f";
      c.fillRect(x, y, blatt, h);
      c.fillStyle = "#5a3b25";
      c.fillRect(x + blatt * 0.1, y + 6, blatt * 0.8, 32);
      c.fillRect(x + blatt * 0.1, y + 44, blatt * 0.8, 32);
      c.fillStyle = "rgba(0,0,0,.3)";
      c.fillRect(x + blatt - 1.6, y, 1.6, h);
      c.restore();
    } else if (this.froschImFenster()) {
      // 3) Tür zu: Frosch nur durch das Türfenster sichtbar
      const { x, y, w, h } = POST_FENSTER;
      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
      this.zeichneFroschAnTuer(c, z.elapsed);
      // leichte Glasspiegelung und Sprosse
      c.fillStyle = "rgba(225,238,248,.16)";
      c.fillRect(x, y, w, h);
      c.globalAlpha = 0.12;
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.moveTo(x + w * 0.1, y + h);
      c.lineTo(x + w * 0.5, y);
      c.lineTo(x + w * 0.72, y);
      c.lineTo(x + w * 0.32, y + h);
      c.closePath();
      c.fill();
      c.globalAlpha = 1;
      c.restore();
      c.strokeStyle = "#6e4a2f";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(TUER_MITTE, y);
      c.lineTo(TUER_MITTE, y + h);
      c.stroke();
    }
  }

  /** Nach der Lichtschicht: Klingel-Sprechblase und Scheinwerferlicht. */
  drawOverlay(c: C, night: number) {
    if (this.blaseT >= 0) zeichneDingDong(c, this.blaseT);
    if (this.klopfT >= 0) zeichneKlopfen(c, this.klopfT);
    const p = this.phase;
    if (night > 0.25 && this.motorAn && p && p !== "hinterHaus") {
      const rechts = p === "rechtsRaus";
      const fx = this.wagenX + WAGEN_L;
      const fy = (rechts ? BODEN_R : BODEN_L) - 25;
      c.save();
      c.beginPath();
      if (rechts) c.rect(WAND_R, 0, W - WAND_R, 600);
      else c.rect(0, 0, WAND_L, 600);
      c.clip();
      c.globalCompositeOperation = "lighter";
      const g = c.createRadialGradient(fx, fy, 1, fx + 26, fy + 6, 46);
      g.addColorStop(0, `rgba(255,236,180,${0.55 * Math.min(1, night)})`);
      g.addColorStop(1, "rgba(255,236,180,0)");
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(fx, fy - 3);
      c.lineTo(fx + 60, fy - 14);
      c.lineTo(fx + 60, fy + 22);
      c.closePath();
      c.fill();
      c.restore();
    }
  }

  /** Auf der Fahrerseite (hinter dem Wagen): nur die Mütze ragt über das Dach. */
  private froschHinterWagen() {
    const p = this.phase;
    if (p === "aussteigen") return this.pt > 0.3;
    if (p === "einsteigen") return this.pt < 0.8;
    return p === "umFront" || p === "hintenRum";
  }

  private zeichneFroschHinterWagen(c: C, elapsed: number) {
    const p = this.phase;
    let alpha = 1;
    if (p === "aussteigen") alpha = sanft((this.pt - 0.3) / 0.4);
    else if (p === "einsteigen") alpha = 1 - sanft((this.pt - 0.4) / 0.4);
    const geht = p === "umFront" || p === "hintenRum";
    c.save();
    c.globalAlpha = alpha;
    drawMethanFrog(c, this.fx, FE + 1, {
      t: elapsed, pose: geht ? "walk" : "stand", rueck: p === "umFront", walk: this.walk,
      scale: SKALA, expr: "friendly", shadow: false,
    });
    c.restore();
  }

  private froschDraussen() {
    const p = this.phase;
    if (!p) return false;
    if (["zurSchiebetuer", "schiebetuerAuf", "paketNehmen", "schiebetuerZu", "zurFahrertuer"].includes(p)) return true;
    if (p === "zumHaus" || p === "zurueck") return this.fx < WAND_L + 20;
    return false;
  }

  private zeichneFroschDraussen(c: C, elapsed: number) {
    const p = this.phase;
    let pose: MethanPose = "stand";
    let alpha = 1;
    if (p === "zurSchiebetuer" || p === "zurFahrertuer") pose = "walk";
    else if (p === "zumHaus") pose = "walkCarry";
    else if (p === "zurueck") pose = "walk";
    else if (p === "paketNehmen") pose = this.paketBeiFrosch ? "carry" : this.pt < 0.8 ? "walk" : "stand";
    // Hand am Türgriff der Schiebetür (linke Hand nach oben zum Griff)
    const amGriff = (p === "schiebetuerAuf" || p === "schiebetuerZu") ? Math.min(1, this.pt / 0.3) : 0;
    if (amGriff > 0) pose = this.pt > 0.3 && this.pt < 1.5 ? "walk" : "stand";
    const edit = amGriff > 0 ? {
      handFar: [1.5 * amGriff, -11.5 * amGriff] as [number, number],
      elbowFar: [-1.0 * amGriff, -5.5 * amGriff] as [number, number],
    } : undefined;
    c.save();
    c.globalAlpha = alpha;
    drawMethanFrog(c, this.fx, FROSCH_Y, { t: elapsed, pose, walk: this.walk, scale: SKALA, expr: "friendly", edit });
    c.restore();
  }

  /** Frosch an der Haustür (draußen hinter dem Haus, Blick zur Tür = Frontansicht). */
  private zeichneFroschAnTuer(c: C, elapsed: number) {
    const p = this.phase;
    let pose: MethanPose = this.paketBeiFrosch ? "carry" : "stand";
    let rueck = false;
    let sink = 0;
    if (p === "zumHaus") pose = "walkCarry";
    else if (p === "zurueck") {
      pose = "walk";
      rueck = true;
    } else if (p === "klingeln" || p === "klopfen") pose = "knock";
    else if (p === "uebergabe") pose = this.paketBeiFrosch ? "handover" : "stand";
    else if (p === "gruss") pose = "salute";
    else if (p === "tuerZu") {
      pose = "walk";
      rueck = true;
    } else if (p === "ablegen") {
      // Paket abstellen: kurz in die Knie – durchs Fenster sieht man nur den Kopf sinken
      sink = 10 * Math.sin(Math.min(1, this.pt / 2.0) * Math.PI);
    }
    // 5 s nach dem Klingeln zweimal kurz blinzeln
    const blink = p === "warten" && this.nachKlingeln && BLINZELN.some(([a, b]) => this.pt >= a && this.pt < b) ? 1 : 0;
    // In der offenen Tür steht er etwas seitlich, damit Luni ihn nicht ganz verdeckt
    const x = this.fx + 10 * this.tuer;
    drawMethanFrog(c, x, FE + sink, {
      t: elapsed, pose, rueck, walk: this.walk, scale: SKALA, expr: "friendly", blink,
    });
  }

  private zeichneWagen(c: C, x0: number, g: number, z: PostZeichnung) {
    zeichnePostwagen(c, x0, g, {
      schiebe: this.schiebe,
      fahrerTuer: this.fahrerTuer,
      rad: this.rad,
      festlich: z.festlich,
      t: z.elapsed,
      paketImWagen: this.paketImWagen,
      fahrerSichtbar: this.phase === "anfahrt" || this.phase === "abfahrt" || this.phase === "rechtsRaus"
        || (this.phase === "aussteigen" && this.pt < 0.4) || (this.phase === "einsteigen" && this.pt > 0.9),
    });
  }
}

/* ---------------------------- Postwagen -------------------------------- */

export interface WagenOpts {
  /** Schiebetür: 0 = zu, 1 = offen */
  schiebe: number;
  /** Fahrertür: 0 = zu, 1 = offen */
  fahrerTuer: number;
  /** Raddrehung (Radiant) */
  rad: number;
  festlich: boolean;
  t: number;
  paketImWagen: boolean;
  fahrerSichtbar: boolean;
}

const WG = {
  blau: "#24518c",
  blauHell: "#3a74b9",
  blauDunkel: "#173a66",
  streifen: "#4f9a52",
  streifenHell: "#79c06e",
  kontur: "#14263c",
  glas: "#9fc3dc",
  glasDunkel: "#5f8aa8",
  reifen: "#1d1f22",
  felge: "#c9ced3",
  felgeDunkel: "#8c949b",
  stossfaenger: "#3a3f45",
  innen: "#2d3036",
  innenBoden: "#4c4f55",
  schein: "#fff3c4",
  ruecklicht: "#c6332d",
  blinker: "#f0a030",
} as const;

/** Postwagen in der Seitenansicht (Front rechts). x0 = Heck, g = Boden. */
export function zeichnePostwagen(c: C, x0: number, g: number, o: WagenOpts) {
  const L = WAGEN_L;
  c.save();
  c.lineJoin = "round";
  c.lineCap = "round";
  // Schatten
  c.fillStyle = "rgba(0,0,0,.25)";
  c.beginPath();
  c.ellipse(x0 + L / 2, g + 1, L * 0.52, 3.2, 0, 0, Math.PI * 2);
  c.fill();

  // Karosserie
  const dach = g - 57;
  const unten = g - 11;
  const umriss = () => {
    c.beginPath();
    c.moveTo(x0 + 1, unten);
    c.lineTo(x0, dach + 4);
    c.quadraticCurveTo(x0, dach, x0 + 4, dach);
    c.lineTo(x0 + 70, dach);
    c.quadraticCurveTo(x0 + 75, dach, x0 + 77, dach + 3);
    c.lineTo(x0 + 89, g - 33);
    c.quadraticCurveTo(x0 + 91, g - 31, x0 + 93, g - 30);
    c.quadraticCurveTo(x0 + 95, g - 29, x0 + 95, g - 26);
    c.lineTo(x0 + 95, unten);
    c.closePath();
  };
  umriss();
  const kg = c.createLinearGradient(0, dach, 0, unten);
  kg.addColorStop(0, WG.blauHell);
  kg.addColorStop(0.45, WG.blau);
  kg.addColorStop(1, WG.blauDunkel);
  c.fillStyle = kg;
  c.fill();
  c.strokeStyle = WG.kontur;
  c.lineWidth = 0.8;
  c.stroke();

  // Lichtkante am Dach, Regenrinne
  c.strokeStyle = "rgba(255,255,255,.35)";
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(x0 + 3, dach + 1.4);
  c.lineTo(x0 + 70, dach + 1.4);
  c.stroke();
  c.strokeStyle = "rgba(10,25,45,.45)";
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(x0 + 2, dach + 5);
  c.lineTo(x0 + 72, dach + 5);
  c.stroke();

  // Dachreling
  c.strokeStyle = "#5e6872";
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(x0 + 8, dach - 1.6);
  c.lineTo(x0 + 64, dach - 1.6);
  c.stroke();
  for (const rx of [x0 + 10, x0 + 36, x0 + 62]) {
    c.beginPath();
    c.moveTo(rx, dach - 1.6);
    c.lineTo(rx, dach);
    c.stroke();
  }

  // Seitenstreifen mit Schriftzug (Frog Company)
  const sy = g - 31;
  c.save();
  umriss();
  c.clip();
  c.fillStyle = WG.streifen;
  c.fillRect(x0, sy - 6, L + 2, 12);
  c.fillStyle = WG.streifenHell;
  c.fillRect(x0, sy - 6, L + 2, 1.3);
  c.restore();

  // Schiebetür-Öffnung und Innenraum
  const tx = x0 + 30;
  const tw = 27;
  const ty = dach + 7;
  const th = unten - 1 - ty;
  const offenX = tx - o.schiebe * 24;
  if (o.schiebe > 0.01) {
    c.save();
    c.beginPath();
    c.rect(tx, ty, tw, th);
    c.clip();
    const ig = c.createLinearGradient(tx, ty, tx, ty + th);
    ig.addColorStop(0, "#1f2227");
    ig.addColorStop(1, WG.innen);
    c.fillStyle = ig;
    c.fillRect(tx, ty, tw, th);
    // Rückwand mit Sicken, leeres Regal, Ladeboden
    c.strokeStyle = "rgba(255,255,255,.07)";
    c.lineWidth = 0.6;
    for (let i = 1; i < 5; i++) {
      c.beginPath();
      c.moveTo(tx + i * (tw / 5), ty + 2);
      c.lineTo(tx + i * (tw / 5), ty + th - 6);
      c.stroke();
    }
    c.fillStyle = "#3d4148";
    c.fillRect(tx + 1, ty + 12, tw - 2, 1.4);
    c.fillStyle = "rgba(0,0,0,.35)";
    c.fillRect(tx + 1, ty + 13.4, tw - 2, 1.2);
    c.fillStyle = WG.innenBoden;
    c.fillRect(tx, ty + th - 5, tw, 5);
    c.fillStyle = "rgba(255,255,255,.12)";
    c.fillRect(tx, ty + th - 5, tw, 0.8);
    // Zurrschiene am Boden
    c.fillStyle = "#6a6f76";
    for (let i = 0; i < 6; i++) c.fillRect(tx + 2 + i * 4.4, ty + th - 2.6, 2.4, 0.9);
    // Deckenlampe (nicht sichtbar): weicher Lichtkegel von oben auf die Ladefläche
    const lx = tx + tw / 2 + 1;
    const kegel = c.createLinearGradient(0, ty, 0, ty + th);
    kegel.addColorStop(0, "rgba(255,238,200,.16)");
    kegel.addColorStop(1, "rgba(255,238,200,.04)");
    c.fillStyle = kegel;
    c.beginPath();
    c.moveTo(lx - 2.5, ty);
    c.lineTo(lx + 2.5, ty);
    c.lineTo(lx + 12, ty + th - 4);
    c.lineTo(lx - 12, ty + th - 4);
    c.closePath();
    c.fill();
    const fleck = c.createRadialGradient(lx, ty + th - 4, 0.5, lx, ty + th - 4, 11);
    fleck.addColorStop(0, "rgba(255,236,196,.34)");
    fleck.addColorStop(1, "rgba(255,236,196,0)");
    c.fillStyle = fleck;
    c.beginPath();
    c.ellipse(lx, ty + th - 4, 11, 3.2, 0, 0, Math.PI * 2);
    c.fill();
    if (o.paketImWagen) {
      drawGeschenkPaket(c, [lx, ty + th - 8.4], 0.62);
      // Lichtkante von oben auf dem Paket
      c.fillStyle = "rgba(255,240,205,.18)";
      c.fillRect(lx - 3.8, ty + th - 11.4, 7.6, 1.4);
    }
    // Ränder bleiben im Dunkeln (Vignette)
    const rand = c.createLinearGradient(tx, 0, tx + tw, 0);
    rand.addColorStop(0, "rgba(0,0,0,.35)");
    rand.addColorStop(0.3, "rgba(0,0,0,0)");
    rand.addColorStop(0.7, "rgba(0,0,0,0)");
    rand.addColorStop(1, "rgba(0,0,0,.35)");
    c.fillStyle = rand;
    c.fillRect(tx, ty, tw, th);
    c.restore();
  }

  // Schiebetür (gleitet nach hinten über das Heckteil)
  c.save();
  c.beginPath();
  c.rect(offenX, ty, tw, th);
  const dg = c.createLinearGradient(0, ty, 0, ty + th);
  dg.addColorStop(0, WG.blauHell);
  dg.addColorStop(0.5, WG.blau);
  dg.addColorStop(1, WG.blauDunkel);
  c.fillStyle = dg;
  c.fill();
  c.strokeStyle = WG.kontur;
  c.lineWidth = 0.7;
  c.stroke();
  c.clip();
  c.fillStyle = WG.streifen;
  c.fillRect(offenX, sy - 6, tw, 12);
  c.fillStyle = WG.streifenHell;
  c.fillRect(offenX, sy - 6, tw, 1.3);
  c.restore();
  // Griff der Schiebetür
  c.fillStyle = "#2a2f36";
  c.fillRect(offenX + tw - 6, ty + 18, 4, 1.6);
  // Laufschiene
  c.strokeStyle = "rgba(10,25,45,.6)";
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(x0 + 6, sy - 9);
  c.lineTo(x0 + 58, sy - 9);
  c.stroke();

  // Schriftzug über Heckteil und Schiebetür (bewegt sich mit der Tür mit)
  schrift(c, "FROG", x0 + 2.2, sy - 5, 10, "#f4f1e6", 1.15, 4.5);
  if (o.fahrerTuer < 0.3) schrift(c, "CO", x0 + 63, sy - 5, 10, "#f4f1e6", 1.15, 4.5);

  // Firmenlogo: Froschkopf mit Paket (Heckteil, über dem Streifen)
  zeichneLogo(c, x0 + 15, dach + 12.5);

  // Fahrerkabine: Tür, Fenster, Spiegel
  const kx = x0 + 60;
  if (o.fahrerTuer > 0.01) {
    // offene Tür: dunkle Öffnung, Tür schwenkt nach vorn auf (schmaler)
    c.fillStyle = "#16181c";
    c.beginPath();
    c.moveTo(kx, unten - 1);
    c.lineTo(kx, dach + 6);
    c.lineTo(x0 + 75, dach + 6);
    c.lineTo(x0 + 86, g - 33);
    c.lineTo(x0 + 86, unten - 1);
    c.closePath();
    c.fill();
  }
  const tuerB = 26 * (1 - 0.7 * o.fahrerTuer);
  c.save();
  c.beginPath();
  c.moveTo(kx + 26 - tuerB, unten - 1);
  c.lineTo(kx + 26 - tuerB, dach + 6);
  c.lineTo(x0 + 75, dach + 6);
  c.lineTo(x0 + 86, g - 33);
  c.lineTo(x0 + 86, unten - 1);
  c.closePath();
  c.strokeStyle = WG.kontur;
  c.lineWidth = 0.7;
  c.stroke();
  c.restore();
  // Kabinenfenster
  const fenster = () => {
    c.beginPath();
    c.moveTo(kx + 3, g - 37);
    c.lineTo(kx + 3, dach + 9);
    c.lineTo(x0 + 74, dach + 9);
    c.lineTo(x0 + 84, g - 37);
    c.closePath();
  };
  if (o.fahrerTuer < 0.5) {
    fenster();
    const fg = c.createLinearGradient(kx, dach + 9, kx + 20, g - 37);
    fg.addColorStop(0, WG.glas);
    fg.addColorStop(1, WG.glasDunkel);
    c.fillStyle = fg;
    c.fill();
    if (o.fahrerSichtbar) {
      // Methan Frog am Steuer (Kopf und Mütze sichtbar)
      c.save();
      fenster();
      c.clip();
      drawMethanFrog(c, x0 + 73, g - 2, { t: o.t, pose: "sit", scale: 0.86, expr: "friendly", shadow: false });
      c.restore();
    }
    c.save();
    fenster();
    c.clip();
    c.globalAlpha = 0.28;
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(kx + 6, g - 37);
    c.lineTo(kx + 12, dach + 9);
    c.lineTo(kx + 16, dach + 9);
    c.lineTo(kx + 10, g - 37);
    c.closePath();
    c.fill();
    c.restore();
    fenster();
    c.strokeStyle = WG.kontur;
    c.lineWidth = 0.7;
    c.stroke();
  }
  // Türgriff und Außenspiegel
  c.fillStyle = "#2a2f36";
  c.fillRect(kx + 5, g - 32, 3.6, 1.4);
  c.fillStyle = WG.blauDunkel;
  c.beginPath();
  c.ellipse(x0 + 85, g - 37, 2.2, 3.2, 0.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = WG.kontur;
  c.lineWidth = 0.5;
  c.stroke();

  // Front: Scheinwerfer, Blinker, Kühlergrill
  c.fillStyle = WG.schein;
  c.beginPath();
  c.ellipse(x0 + 93.4, g - 26, 1.5, 2.6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = WG.blinker;
  c.fillRect(x0 + 89, g - 24.5, 2.6, 1.6);
  c.strokeStyle = "rgba(10,25,45,.5)";
  c.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(x0 + 92.4, g - 21.5 + i * 2);
    c.lineTo(x0 + 95, g - 21.5 + i * 2);
    c.stroke();
  }
  // Heck: Rücklicht
  c.fillStyle = WG.ruecklicht;
  rundRect(c, x0 + 0.4, g - 42, 2.2, 10, 0.8);
  c.fill();
  c.fillStyle = "rgba(255,255,255,.35)";
  c.fillRect(x0 + 0.9, g - 41, 0.7, 4);

  // Stoßfänger, Trittbrett, Tankdeckel, Auspuff
  c.fillStyle = WG.stossfaenger;
  rundRect(c, x0 - 1.2, unten - 1, 7, 4, 1.2);
  c.fill();
  rundRect(c, x0 + 89, unten - 1, 7.4, 4, 1.2);
  c.fill();
  c.fillStyle = "#2b3036";
  c.fillRect(x0 + 26, unten, 34, 2);
  c.strokeStyle = "rgba(10,25,45,.55)";
  c.lineWidth = 0.6;
  c.beginPath();
  c.arc(x0 + 23, g - 22, 1.8, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = "#4a4f55";
  c.fillRect(x0 - 2.6, g - 9.5, 4, 1.4);

  // Radkästen und Räder
  for (const rx of [x0 + 17, x0 + 77]) {
    c.fillStyle = "#0d1015";
    c.beginPath();
    c.arc(rx, g - 7, 9.2, Math.PI, 0);
    c.lineTo(rx + 9.2, unten + 1);
    c.lineTo(rx - 9.2, unten + 1);
    c.closePath();
    c.fill();
    zeichneRad(c, rx, g - 7, o.rad);
  }

  // Weihnachtsdeko: Lichterkette an der Dachkante und Kranz an der Front
  if (o.festlich) {
    c.fillStyle = "#f4f8fc";
    c.beginPath();
    c.moveTo(x0 + 2, dach);
    c.quadraticCurveTo(x0 + 20, dach - 4.5, x0 + 38, dach - 1);
    c.quadraticCurveTo(x0 + 56, dach - 4.2, x0 + 72, dach - 0.4);
    c.lineTo(x0 + 72, dach + 1.2);
    c.lineTo(x0 + 2, dach + 1.2);
    c.closePath();
    c.fill();
    c.strokeStyle = "#2b3a2b";
    c.lineWidth = 0.45;
    c.beginPath();
    for (let i = 0; i <= 12; i++) {
      const lx = x0 + 3 + i * 5.6;
      const ly = dach + 3.4 + (i % 2) * 1.2;
      if (i === 0) c.moveTo(lx, ly);
      else c.lineTo(lx, ly);
    }
    c.stroke();
    const farben = ["#ff5a4f", "#ffd25a", "#5fd27a", "#5ab4ff"];
    for (let i = 0; i <= 12; i++) {
      const an = Math.sin(o.t * 3 + i * 1.7) > -0.3;
      c.fillStyle = farben[i % 4];
      c.globalAlpha = an ? 1 : 0.35;
      c.beginPath();
      c.arc(x0 + 3 + i * 5.6, dach + 4.6 + (i % 2) * 1.2, 0.95, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    zeichneKranz(c, x0 + 91.6, g - 18.6, o.t);
  }
  c.restore();
}

function zeichneRad(c: C, x: number, y: number, rot: number) {
  c.fillStyle = WG.reifen;
  c.beginPath();
  c.arc(x, y, 7, 0, Math.PI * 2);
  c.fill();
  // Profil
  c.strokeStyle = "rgba(255,255,255,.12)";
  c.lineWidth = 0.7;
  for (let i = 0; i < 12; i++) {
    const a = rot + (i * Math.PI) / 6;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * 5.6, y + Math.sin(a) * 5.6);
    c.lineTo(x + Math.cos(a) * 6.8, y + Math.sin(a) * 6.8);
    c.stroke();
  }
  c.fillStyle = WG.felge;
  c.beginPath();
  c.arc(x, y, 4.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = WG.felgeDunkel;
  c.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * Math.PI * 2) / 5;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * 1.2, y + Math.sin(a) * 1.2);
    c.lineTo(x + Math.cos(a) * 3.8, y + Math.sin(a) * 3.8);
    c.stroke();
  }
  c.fillStyle = WG.felgeDunkel;
  c.beginPath();
  c.arc(x, y, 1.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,.5)";
  c.beginPath();
  c.arc(x - 1.4, y - 1.6, 0.8, 0, Math.PI * 2);
  c.fill();
}

/** Firmenlogo: runder Froschkopf mit Dienstmütze und kleinem Paket. */
function zeichneLogo(c: C, x: number, y: number) {
  c.fillStyle = "#f4f1e6";
  c.beginPath();
  c.arc(x, y, 7.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = WG.blauDunkel;
  c.lineWidth = 0.8;
  c.stroke();
  // Froschkopf
  c.fillStyle = "#5aa557";
  c.beginPath();
  c.ellipse(x - 0.8, y + 1, 4.2, 3.4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(x - 2.4, y - 0.6, 1.2, 0, Math.PI * 2);
  c.arc(x + 0.8, y - 0.6, 1.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#16201f";
  c.beginPath();
  c.arc(x - 2.2, y - 0.5, 0.55, 0, Math.PI * 2);
  c.arc(x + 1.0, y - 0.5, 0.55, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#2f4f35";
  c.lineWidth = 0.5;
  c.beginPath();
  c.arc(x - 0.8, y + 1.4, 1.8, 0.2, Math.PI - 0.2);
  c.stroke();
  // Mütze
  c.fillStyle = WG.blau;
  c.beginPath();
  c.ellipse(x - 0.8, y - 2.2, 3.4, 1.6, 0, Math.PI, 0);
  c.fill();
  c.fillRect(x - 4.2, y - 2.3, 6.8, 0.9);
  // Paket
  c.fillStyle = "#b3262e";
  c.fillRect(x + 2.6, y + 1.2, 3.2, 2.6);
  c.fillStyle = "#f8f5ee";
  c.fillRect(x + 3.9, y + 1.2, 0.6, 2.6);
  c.fillRect(x + 2.6, y + 2.2, 3.2, 0.6);
}

/** Kleiner Tannenkranz mit roter Schleife und Beeren. */
function zeichneKranz(c: C, x: number, y: number, t: number) {
  c.strokeStyle = "#1f5a33";
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(x, y, 3.2, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = "#3f8f52";
  c.lineWidth = 0.7;
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2);
    c.lineTo(x + Math.cos(a + 0.4) * 4.2, y + Math.sin(a + 0.4) * 4.2);
    c.stroke();
  }
  for (const [bx, by] of [[1.8, -2.4], [-2.6, 1.2], [2.2, 2.0]] as const) {
    c.fillStyle = "#d22b31";
    c.beginPath();
    c.arc(x + bx, y + by, 0.65, 0, Math.PI * 2);
    c.fill();
  }
  const wehen = Math.sin(t * 2) * 0.3;
  c.fillStyle = "#c4262e";
  c.beginPath();
  c.moveTo(x, y + 3);
  c.lineTo(x - 1.6 + wehen, y + 6);
  c.lineTo(x - 0.4, y + 3.6);
  c.lineTo(x + 0.4, y + 3.6);
  c.lineTo(x + 1.6 + wehen, y + 6);
  c.closePath();
  c.fill();
}

function zeichneQualm(c: C, x: number, y: number, t: number) {
  const a = Math.max(0, 0.35 * (1 - t / 1.6));
  c.fillStyle = `rgba(210,215,222,${a})`;
  c.beginPath();
  c.arc(x - t * 10, y - t * 6, 2 + t * 3.5, 0, Math.PI * 2);
  c.fill();
}

function rundRect(c: C, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y);
  c.lineTo(x + w - k, y);
  c.quadraticCurveTo(x + w, y, x + w, y + k);
  c.lineTo(x + w, y + h - k);
  c.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  c.lineTo(x + k, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - k);
  c.lineTo(x, y + k);
  c.quadraticCurveTo(x, y, x + k, y);
  c.closePath();
}

/* ----------------------- Strichschrift (ohne Font) ---------------------- */

/** Buchstaben als Linienzüge in einem 4 × 6 Raster (keine Web-Fonts). */
const GLYPHEN: Record<string, number[][]> = {
  D: [[0, 0, 0, 6, 2.4, 6, 4, 4.6, 4, 1.4, 2.4, 0, 0, 0]],
  I: [[0.6, 0, 3.4, 0], [2, 0, 2, 6], [0.6, 6, 3.4, 6]],
  N: [[0, 6, 0, 0, 4, 6, 4, 0]],
  G: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3.4, 2.2, 3.4]],
  O: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0]],
  F: [[4, 0, 0, 0, 0, 6], [0, 2.8, 3, 2.8]],
  R: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3], [2, 3, 4, 6]],
  C: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5]],
  "!": [[2, 0, 2, 4.2], [2, 5.6, 2, 6]],
  K: [[0, 0, 0, 6], [4, 0, 0, 3.4, 4, 6]],
  L: [[0, 0, 0, 6, 4, 6]],
  P: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3]],
};

/** Text aus Linienzügen zeichnen; Höhe in Einheiten (mindestens 10 für Lesbarkeit). */
function schrift(c: C, text: string, x: number, y: number, hoehe: number, farbe: string, breite: number, vorschub = 5.4) {
  const s = hoehe / 6;
  c.save();
  c.strokeStyle = farbe;
  c.lineWidth = breite;
  c.lineCap = "round";
  c.lineJoin = "round";
  let cx = x;
  for (const ch of text) {
    const g = GLYPHEN[ch];
    if (g) {
      for (const zug of g) {
        c.beginPath();
        for (let i = 0; i < zug.length; i += 2) {
          const px = cx + zug[i] * s;
          const py = y + zug[i + 1] * s;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.stroke();
      }
    }
    cx += vorschub * s;
  }
  c.restore();
}

/* ------------------------ Ding-Dong-Sprechblase ------------------------ */

/** Ding-Dong als Comic-Schrift ohne Blase und ohne Umriss: „DING“ ploppt zum ersten
    Ton auf, „DONG!“ zum zweiten; beide pulsieren mit dem Nachklang und verblassen. */
function zeichneDingDong(c: C, t: number) {
  const wort = (text: string, start: number, x: number, y: number, farbe: string) => {
    const u = t - start;
    if (u < 0) return;
    // Aufploppen mit Überschwingen, danach Pulsieren im Takt des Nachklangs
    const pop = u < 0.18 ? 0.4 + 0.9 * Math.sin((u / 0.18) * Math.PI * 0.5) : 1 + 0.3 * Math.max(0, 1 - (u - 0.18) / 0.12);
    const puls = 1 + 0.07 * Math.sin(u * 14) * Math.exp(-u * 1.6);
    const raus = t > 2.1 ? 1 - Math.min(1, (t - 2.1) / 0.5) : 1;
    const sk = Math.min(pop, 1.3) * puls;
    c.save();
    c.globalAlpha = raus;
    c.translate(x, y);
    c.scale(sk, sk);
    c.rotate(-0.08);
    schrift(c, text, -text.length * 3.6, -6, 12, farbe, 2.6, 4.9);
    c.restore();
  };
  wort("DING", 0, 214, 346, "#ffd75a");
  wort("DONG!", 0.6, 236, 361, "#ffe58f");
}

/** „KLOPF KLOPF KLOPF“ ohne Blase und Umriss: jedes Wort ploppt synchron zum Klopfen auf. */
function zeichneKlopfen(c: C, t: number) {
  const orte: [number, number, number][] = [[206, 344, -0.12], [230, 356, 0.06], [212, 369, -0.04]];
  KLOPF_ZEITEN.forEach((kz, i) => {
    const u = t - (kz - KLOPF_ZEITEN[0]);
    if (u < 0) return;
    const pop = u < 0.14 ? 0.4 + 0.9 * Math.sin((u / 0.14) * Math.PI * 0.5) : 1 + 0.25 * Math.max(0, 1 - (u - 0.14) / 0.1);
    const puls = 1 + 0.06 * Math.sin(u * 16) * Math.exp(-u * 2);
    const raus = t > 2.6 ? 1 - Math.min(1, (t - 2.6) / 0.6) : 1;
    const [x, y, rot] = orte[i];
    c.save();
    c.globalAlpha = raus;
    c.translate(x, y);
    c.scale(Math.min(pop, 1.25) * puls, Math.min(pop, 1.25) * puls);
    c.rotate(rot);
    schrift(c, "KLOPF", -12, -6, 11, "#f2c27a", 2.4, 4.9);
    c.restore();
  });
}
