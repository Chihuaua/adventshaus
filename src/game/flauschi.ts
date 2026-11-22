/* =======================================================================
   TELEFLAUSCHI · „FLOCKE“
   Ein Videospiel in einer Hülle für die Konsole unter dem Fernseher im
   Gaming-Zimmer. Flauschi ist eine Fellkugel mit Pfoten und einer viel zu
   großen Weihnachtsmütze.

   Alles handgezeichnet mit Canvas-Primitive, keine Bild-, Font- oder
   Audiodateien (KI-START Grundsatz 4). Der Zustand wird als Schlüssel/Wert
   gespeichert und läuft in Echtzeit (Grundsatz 2): Flauschi stirbt nie, sie
   schläft einfach ein und ist beim nächsten Blick gemütlich ausgeruht.

   Vier Pflegeaktionen, sechs sichtbare Animationen:
     atmen · füttern (Plätzchen + Puderzuckernase) · streicheln/bürsten
     (plustert auf, wird statisch aufgeladen) · spielen (Schneekugel,
     Rutscher, Lachen) · schlafen (Mütze über die Augen, Schnarchmelodie)
     sowie zwei weihnachtliche Unsinn-Einschübe: Niesen (die Schleife vom
     Paket fliegt weg) und Verstecken im Geschenkpapier.
   ======================================================================= */

import { ADVENT_NACH_DATUM } from "./advent";
import { GOL_VIEW_H, GOL_VIEW_W, GOL_X, GOL_Y } from "./gol";
import {
  FLAUSCHI_ANFASSEN, FLAUSCHI_DECKE_KLANG, FLAUSCHI_DINGE, FLAUSCHI_TUN, FLAUSCHI_VORSCHAU_ALLE,
  ell, flauschiDingDa, flauschiPlatz, flauschiWirkung, herz, kreis, linie,
  type FlauschiAktion, type FlauschiAnfassen, type FlauschiBeruehrung, type FlauschiTon, type FlauschiTun,
} from "./flauschi-dinge";

export type C = CanvasRenderingContext2D;

// Die Bausteine des Teleflauschis: Grunddaten, Figur und Zimmer.
export {
  FLAUSCHI_DINGE, FLAUSCHI_LIED, FLAUSCHI_VORSCHAU_ALLE, adventsKerzen, flauschiDauer, flauschiDingDa,
} from "./flauschi-dinge";
export type {
  FlauschiAktion, FlauschiAnfassen, FlauschiBeruehrung, FlauschiDing, FlauschiDingId, FlauschiTon, FlauschiTun,
} from "./flauschi-dinge";
export { drawFlauschi } from "./flauschi-figur";
export { drawFlauschiSzene } from "./flauschi-zimmer";

/* ------------------------------ Helfer -------------------------------- */

const TAU = Math.PI * 2;

function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}

/* ------------------------------ Zustand -------------------------------- */

export interface FlauschiStand {
  /** Wann zuletzt gepflegt wurde (Millisekunden seit 1970). */
  letzte: number;
  /** Bedürfnisse 0–100: 100 = ganz erfüllt. */
  hunger: number;
  /** Müdigkeit: 0 = ausgeruht, 100 = einschlafen. */
  muede: number;
  /** Version 2 unterscheidet Müdigkeit vom früher gespeicherten Energiewert. */
  muedeVersion: 2;
  sauber: number;
  beschaeftigt: number;
  /** Punkte: gesammelte Flocken. */
  punkte: number;
  /** Flauschi schläft (geplant oder weil die Pflege liegen blieb). Sie stirbt nie. */
  schlaf: boolean;
  /** Laufende Aktion oder Berührung und ihre Restlaufzeit in Sekunden. */
  aktion: FlauschiTun | null;
  aktionT: number;
  /** Puderzuckernase nach dem Knabbern (Sekunden). */
  zucker: number;
  /** Statisch aufgeladene Fusselkugel nach dem Bürsten (Sekunden). */
  funken: number;
  /** Kugeln, die Flauschi schon an den Baum gehängt hat (eine pro Türchen). */
  kugeln: number;
  /** Frisch gebackene Plätzchen auf dem Blech (0–6). */
  vorrat: number;
  /** Wachstumsphase: 0 = Ei, 1 = Baby, 2 = Kind, 3 = Erwachsen. */
  phase: number;
  /** Wachstumspunkte aus Zuwendung – ganz ohne Zeitdruck, sie verfallen nie. */
  wachstum: number;
  /** Türchen, deren Geschenk schon ausgepackt im Zimmer steht. */
  ausgepackt: number[];
  /** Verdiente Sticker fürs Album (Ids aus FLAUSCHI_STICKER). */
  sticker: string[];
  /** Die Laterne leuchtet. */
  laterne: boolean;
  /** Die Kerzen am Adventskranz brennen. */
  kerzen: boolean;
  /** Im Schlaf zugedeckt – hält bis zum Aufwachen und lässt sie schneller ausruhen. */
  decke: boolean;
}

export function neuerFlauschiStand(): FlauschiStand {
  return {
    letzte: Date.now(),
    hunger: 78,
    muede: 0,
    muedeVersion: 2,
    sauber: 92,
    beschaeftigt: 70,
    punkte: 0,
    schlaf: false,
    aktion: null,
    aktionT: 0,
    zucker: 0,
    funken: 0,
    kugeln: 0,
    vorrat: 0,
    kerzen: false,
    decke: false,
    phase: 0,
    wachstum: 0,
    ausgepackt: [],
    sticker: [],
    laterne: false,
  };
}

/** Speicherstände aus alten Versionen bleiben gültig, Bruchstücke nicht. */
export function leseFlauschiStand(roh: unknown): FlauschiStand | null {
  if (!roh || typeof roh !== "object") return null;
  const s = roh as Partial<FlauschiStand>;
  const z = neuerFlauschiStand();
  const wert = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? clamp(v, 0, 100) : d);
  z.letzte = typeof s.letzte === "number" && Number.isFinite(s.letzte) ? s.letzte : Date.now();
  z.hunger = wert(s.hunger, z.hunger);
  // Alte Speicherstände enthalten noch Energie. Nur beim ersten Laden umrechnen.
  z.muede = s.muedeVersion === 2 ? wert(s.muede, 0) : 100 - wert(s.muede, 100);
  z.sauber = wert(s.sauber, z.sauber);
  z.beschaeftigt = wert(s.beschaeftigt, z.beschaeftigt);
  z.punkte = typeof s.punkte === "number" && Number.isFinite(s.punkte) ? Math.max(0, Math.round(s.punkte)) : 0;
  z.schlaf = s.schlaf === true;
  z.aktion = typeof s.aktion === "string" && (FLAUSCHI_TUN as readonly string[]).includes(s.aktion)
    ? (s.aktion as FlauschiTun) : null;
  z.aktionT = typeof s.aktionT === "number" && Number.isFinite(s.aktionT) ? Math.max(0, s.aktionT) : 0;
  z.zucker = typeof s.zucker === "number" && Number.isFinite(s.zucker) ? Math.max(0, s.zucker) : 0;
  z.funken = typeof s.funken === "number" && Number.isFinite(s.funken) ? Math.max(0, s.funken) : 0;
  z.kugeln = typeof s.kugeln === "number" && Number.isFinite(s.kugeln) ? clamp(Math.round(s.kugeln), 0, 24) : 0;
  z.vorrat = typeof s.vorrat === "number" && Number.isFinite(s.vorrat) ? clamp(Math.round(s.vorrat), 0, 6) : 0;
  z.kerzen = s.kerzen === true;
  z.decke = s.decke === true && z.schlaf;
  // Spielstände von vor der Wachstums-Demo: Flauschi ist schon erwachsen und
  // ihre Gegenstände stehen ausgepackt im Zimmer – nichts geht verloren.
  const altStand = typeof (s as { phase?: unknown }).phase !== "number";
  z.phase = altStand ? 3 : clamp(Math.round(s.phase as number), 0, 3);
  z.wachstum = typeof s.wachstum === "number" && Number.isFinite(s.wachstum)
    ? clamp(Math.round(s.wachstum), 0, 999) : z.phase === 3 ? 25 : 0;
  z.ausgepackt = Array.isArray(s.ausgepackt)
    ? [...new Set(s.ausgepackt.filter((t) => typeof t === "number" && t >= 1 && t <= 24))]
    : altStand ? FLAUSCHI_DINGE.map((d) => d.tuer) : [];
  z.sticker = Array.isArray(s.sticker)
    ? s.sticker.filter((id): id is string => typeof id === "string" && FLAUSCHI_STICKER.some((st) => st.id === id)) : [];
  z.laterne = s.laterne === true;
  return z;
}

/* ------------------------- Wachstum und Sticker -------------------------- */

/** Wachstumspunkte je Phase: Ei → Baby → Kind → Erwachsen. */
export const FLAUSCHI_SCHWELLEN: readonly number[] = [3, 10, 22];

/** Sticker, die es für besondere Momente gibt. */
export const FLAUSCHI_STICKER: readonly { id: string; label: string }[] = [
  { id: "paket", label: "Erstes Paket" },
  { id: "schluepfen", label: "Geschlüpft" },
  { id: "baden", label: "Erstes Bad" },
  { id: "tanzen", label: "Erster Tanz" },
  { id: "reiten", label: "Erster Ritt" },
  { id: "zug", label: "Erste Zugfahrt" },
  { id: "kugel", label: "Erste Kugel" },
  { id: "nase", label: "Hatschi" },
  { id: "pfote", label: "Pfötchen" },
  { id: "erwachsen", label: "Erwachsen" },
];

/** Sticker vergeben (nur einmal). Gibt true zurück, wenn er neu ist. */
export function stickerGeben(z: FlauschiStand, id: string): boolean {
  if (z.sticker.includes(id)) return false;
  z.sticker.push(id);
  return true;
}

/** Phase aus den Wachstumspunkten ableiten – sie kann nur steigen, nie fallen. */
export function phasePruefen(z: FlauschiStand): void {
  let ziel = 0;
  while (ziel < 3 && z.wachstum >= FLAUSCHI_SCHWELLEN[ziel]) ziel++;
  if (ziel <= z.phase) return;
  if (z.phase === 0) stickerGeben(z, "schluepfen");
  if (ziel === 3) stickerGeben(z, "erwachsen");
  z.phase = ziel;
  z.schlaf = false;
}

/* ------------------------------ Echtzeit ------------------------------- */

const BERLIN_STUNDE = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin", hour: "2-digit", hourCycle: "h23",
});

/**
 * Müdigkeit steigt wach bis 100 und sinkt im Schlaf bis null.
 * Die Tag-/Nachtrate richtet sich nach Europe/Berlin, nicht nach dem Gerät.
 * Die übrigen Bedürfnisse behalten ihre bisherige Schlafschwelle von 12.
 * Flauschi kann weiterhin nur einschlafen, niemals sterben.
 */
export function flauschiTick(z: FlauschiStand, jetzt: number): void {
  const vorher = z.letzte;
  if (!Number.isFinite(vorher) || vorher <= 0) z.letzte = jetzt;
  const stunden = Math.max(0, (jetzt - z.letzte) / 3_600_000);
  z.letzte = jetzt;
  if (stunden > 0) {
    z.hunger = clamp(z.hunger - stunden * (100 / 4), 0, 100);
    z.beschaeftigt = clamp(z.beschaeftigt - stunden * (100 / 3), 0, 100);
    z.sauber = clamp(z.sauber - stunden * (100 / 6), 0, 100);
    const stunde = Number(BERLIN_STUNDE.formatToParts(jetzt).find(p => p.type === "hour")?.value);
    const nacht = stunde >= 22 || stunde < 6;
    // Zugedeckt ruht sich Flauschi anderthalbmal so schnell aus.
    z.muede = clamp(z.muede + stunden * (z.schlaf ? (z.decke ? -75 : -50) : 100 / (nacht ? 4 : 9)), 0, 100);
  }
  const sek = Math.min(60, Math.max(0, (jetzt - vorher) / 1000));
  if (z.aktionT > 0) {
    z.aktionT = Math.max(0, z.aktionT - sek);
    if (z.aktionT === 0 && z.aktion !== "schlafen") z.aktion = null;
  }
  if (z.zucker > 0) z.zucker = Math.max(0, z.zucker - sek);
  if (z.funken > 0) z.funken = Math.max(0, z.funken - sek);
  if (!z.schlaf && (z.hunger <= 12 || z.muede >= 100 || z.sauber <= 12 || z.beschaeftigt <= 12)) z.schlaf = true;
  if (!z.schlaf) z.decke = false;
}

/** Pflegeaktion. Gibt die dazu verdienten Flocken zurück. */
export function flauschiAktion(z: FlauschiStand, id: FlauschiAktion, jetzt: number): number {
  flauschiTick(z, jetzt);
  // Im Ei zählt nur Wärme: Jeder Knopf wärmt es, bis Flauschi schlüpft.
  if (z.phase === 0) {
    const laeuft = z.aktion === "waermen" && z.aktionT > 0;
    z.aktion = "waermen";
    z.aktionT = 1.2;
    if (laeuft) return 0;
    z.wachstum += 1;
    phasePruefen(z);
    return 1;
  }
  let flocks = 0;
  if (id === "schlafen") {
    z.schlaf = !z.schlaf;
    z.aktion = z.schlaf ? "schlafen" : null;
    z.aktionT = z.schlaf ? 0 : 0;
    if (z.schlaf) z.aktion = "schlafen";
    return 0;
  }
  if (z.schlaf) z.schlaf = false;
  if (id === "fuettern") {
    // Liegt ein frisch gebackenes Plätzchen auf dem Blech, schmeckt es besonders gut.
    const frisch = z.vorrat > 0 ? 10 : 0;
    if (frisch) z.vorrat -= 1;
    z.hunger = clamp(z.hunger + 38 + frisch, 0, 100);
    z.beschaeftigt = clamp(z.beschaeftigt + 6, 0, 100);
    z.zucker = 7;
    z.aktion = "fuettern";
    z.aktionT = 2.6;
    flocks = 5;
  } else if (id === "streicheln") {
    z.sauber = clamp(z.sauber + 34, 0, 100);
    z.beschaeftigt = clamp(z.beschaeftigt + 14, 0, 100);
    z.funken = 5;
    z.aktion = "streicheln";
    z.aktionT = 2.4;
    flocks = 4;
  } else if (id === "spielen") {
    z.beschaeftigt = clamp(z.beschaeftigt + 34, 0, 100);
    z.muede = clamp(z.muede + 9, 0, 100);
    z.hunger = clamp(z.hunger - 3, 0, 100);
    z.aktion = "spielen";
    z.aktionT = 3.2;
    flocks = 6;
  }
  if (flocks && !z.schlaf) {
    z.punkte += flocks;
    z.wachstum += 1;
    phasePruefen(z);
  }
  if (z.muede >= 100) z.schlaf = true;
  return flocks;
}

/* --------------------------- Flauschi anfassen ---------------------------- */

/** Wie viele Kugeln an den Baum passen: eine pro geöffnetem Türchen (höchstens 24). */
export function flauschiKugelMax(offen: number[]): number {
  return FLAUSCHI_VORSCHAU_ALLE ? 24 : Math.min(24, offen.length);
}

/**
 * Flauschi oder einen ihrer Gegenstände anklicken. Gibt die dafür verdienten
 * Flocken zurück. Wer weiterklickt, verlängert nur die Bewegung – Flocken
 * gibt es erst wieder, wenn sie ausgeklungen ist (keine Klick-Schleife).
 *
 * Im Schlaf: Den Kopf antippen deckt sie zu, statt sie zu wecken. Kitzeln
 * und das Glöckchen wecken sie – außer sie ist völlig müde. Alle anderen
 * Gegenstände warten, bis Flauschi wieder wach ist; nur der Adventskranz
 * lässt sich auch neben der Schlafenden an- und ausmachen.
 */
export function flauschiBeruehren(z: FlauschiStand, art: FlauschiBeruehrung, jetzt: number, offen: number[] = []): number {
  flauschiTick(z, jetzt);
  const ding = FLAUSCHI_DINGE.find((d) => d.id === art);
  // Ein Gegenstand zählt erst, wenn sein Türchen offen UND das Paket ausgepackt ist.
  if (ding && (!flauschiDingDa(ding, offen) || !z.ausgepackt.includes(ding.tuer))) return 0;
  // Im Ei wärmt jede Berührung – Gegenstände warten bis nach dem Schlüpfen.
  if (z.phase === 0) {
    if (ding) return 0;
    const laeuftEi = z.aktion === "waermen" && z.aktionT > 0;
    z.aktion = "waermen";
    z.aktionT = 1.2;
    if (laeuftEi) return 0;
    z.wachstum += 1;
    phasePruefen(z);
    return 1;
  }
  const laeuft = z.aktion === art && z.aktionT > 0;
  if ((art === "kitzeln" || art === "gloeckchen") && z.schlaf && z.muede < 100) z.schlaf = false;
  if (z.schlaf) {
    if (art === "kraulen" || art === "decke") z.decke = true;
    if (art === "kranz" && !laeuft) z.kerzen = !z.kerzen;
    if (ding && art !== "kranz" && art !== "gloeckchen" && art !== "decke") return 0;
  }
  const w = flauschiWirkung(art);
  z.aktion = art;
  z.aktionT = w.dauer;
  if (laeuft || z.schlaf) return 0;

  let flocken = w.flocken;
  if (art === "decke") {
    // Minidecke anklicken: einkuscheln und einschlafen – oder im Schlaf zudecken.
    if (z.schlaf) flocken = 0;
    else { z.schlaf = true; z.decke = true; }
  } else if (art === "laterne") {
    z.laterne = !z.laterne;
    if (!z.laterne) flocken = 0; // Ausmachen gibt keine Flocken.
  } else if (art === "buerste") {
    z.funken = 5;
  } else if (art === "kranz") {
    z.kerzen = !z.kerzen;
    if (!z.kerzen) flocken = 0; // Auspusten gibt keine Flocken.
  } else if (art === "blech") {
    z.vorrat = Math.min(6, z.vorrat + 3);
  } else if (art === "baum") {
    if (z.kugeln < flauschiKugelMax(offen)) z.kugeln += 1;
    else flocken = 0; // Der Baum ist voll: Sie bewundert ihn nur.
  }
  z.hunger = clamp(z.hunger + (w.hunger ?? 0), 0, 100);
  z.muede = clamp(z.muede + (w.muede ?? 0), 0, 100);
  z.sauber = clamp(z.sauber + (w.sauber ?? 0), 0, 100);
  z.beschaeftigt = clamp(z.beschaeftigt + (w.beschaeftigt ?? 0), 0, 100);
  z.punkte += flocken;
  z.wachstum += 1;
  phasePruefen(z);
  // Sticker für besondere Momente (jede Sorte nur einmal).
  const moment: Partial<Record<FlauschiBeruehrung, string>> = {
    wanne: "baden", grammophon: "tanzen", pferd: "reiten", bahn: "zug", nase: "nase", pfote: "pfote",
  };
  if (moment[art]) stickerGeben(z, moment[art] as string);
  if (art === "baum" && flocken > 0) stickerGeben(z, "kugel");
  if (z.muede >= 100) z.schlaf = true;
  return flocken;
}

/** Pakete, die schon im Zimmer liegen: geöffnete Türchen, noch nicht ausgepackt (Türchen 6 ist das Spiel selbst). */
export function flauschiPakete(offen: number[], z: FlauschiStand): number[] {
  return offen.filter((t) => t !== 6 && !z.ausgepackt.includes(t)).sort((a, b) => a - b);
}

/**
 * Das älteste Paket auspacken: Der Gegenstand steht danach im Zimmer und
 * lässt sich nutzen. Gibt die Türchenzahl zurück (null = kein Paket da).
 */
export function flauschiAuspacken(z: FlauschiStand, offen: number[]): number | null {
  const pakete = flauschiPakete(offen, z);
  if (!pakete.length) return null;
  const tuer = pakete[0];
  z.ausgepackt.push(tuer);
  z.aktion = "auspacken";
  z.aktionT = 1;
  z.punkte += 3;
  // Wachstum gibt es erst nach dem Schlüpfen – im Ei zählt nur Wärme.
  if (z.phase > 0) {
    z.wachstum += 1;
    phasePruefen(z);
  }
  stickerGeben(z, "paket");
  return tuer;
}

/**
 * Gedrückt halten: langes Kraulen. Flauschi schnurrt weiter und wird dabei
 * langsam schläfrig – bei 100 Prozent Müdigkeit schläft sie unter der Hand ein.
 */
export function flauschiKraulenHalten(z: FlauschiStand, sekunden: number): void {
  if (z.aktion !== "kraulen" || sekunden <= 0) return;
  if (z.aktionT < 0.7) z.aktionT = FLAUSCHI_ANFASSEN.kraulen.dauer;
  if (z.schlaf) return;
  z.beschaeftigt = clamp(z.beschaeftigt + sekunden * 2, 0, 100);
  z.muede = clamp(z.muede + sekunden * 2.5, 0, 100);
  if (z.muede >= 100) z.schlaf = true;
}

/** Klangrezept zur letzten Berührung – leer, wenn nichts geschah (Gegenstand neben der Schlafenden). */
export function flauschiKlang(z: FlauschiStand, art: FlauschiBeruehrung): readonly FlauschiTon[] {
  if (z.aktion !== art) return [];
  if (z.schlaf && art === "kraulen") return FLAUSCHI_DECKE_KLANG;
  return flauschiWirkung(art).klang;
}

const ANFASS_NAMEN: Record<FlauschiAnfassen, string> = {
  kraulen: "Flauschi streicheln",
  kitzeln: "Flauschi kitzeln",
  nase: "Nase stupsen",
  pfote: "Pfötchen geben",
  bommel: "Bommel anstupsen",
};

/** Alles Anklickbare in der Vergrößerung: Flauschi, ihre Gegenstände – und ein wartendes Paket. */
export type FlauschiZielId = FlauschiBeruehrung | "paket";

export interface FlauschiZone {
  id: FlauschiZielId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Alle benannten Ziele in der Vergrößerung, in der Reihenfolge des
 * Durchschaltens: erst fünf Stellen an Flauschi selbst (Kopf, Bauch, Nase,
 * Pfoten, Bommel), dann ihre Gegenstände von links nach rechts.
 * Die Klickflächen sind unsichtbar, mindestens 24×24 groß und liegen im
 * sicheren Bildbereich über dem Balken-Interface.
 */
export const FLAUSCHI_ZONEN: readonly FlauschiZone[] = (() => {
  const { fx, fy, s } = flauschiPlatz(GOL_X, GOL_Y, GOL_VIEW_W, GOL_VIEW_H);
  const k = 26 * s;
  const an = (id: FlauschiAnfassen, x0: number, y0: number, x1: number, y1: number): FlauschiZone => {
    const x = Math.round(fx + x0 * k);
    const y = Math.round(fy + y0 * k);
    return { id, label: ANFASS_NAMEN[id], x, y, w: Math.round(fx + x1 * k) - x, h: Math.round(fy + y1 * k) - y };
  };
  return [
    an("kraulen", -1.15, -2.85, 1.15, -0.86),
    an("kitzeln", -1.15, -0.86, 1.15, 0.1),
    an("nase", -0.31, -1.02, 0.31, -0.48),
    an("pfote", -0.68, -0.4, 0.68, 0.14),
    an("bommel", 1.15, -1.76, 1.9, -0.52),
    ...FLAUSCHI_DINGE.map((d): FlauschiZone => ({ id: d.id, label: d.label, x: GOL_X + d.x, y: GOL_Y + d.y, w: d.w, h: d.h })),
  ];
})();

/** Lieferplatz der Pakete links im Zimmer (Bühnenkoordinaten wie alle Zonen). */
export const FLAUSCHI_PAKET_ZONE: FlauschiZone = {
  id: "paket", label: "Geschenk auspacken", x: 136, y: 284, w: 54, h: 28,
};

/**
 * Die Ziele, die es gerade gibt: Flauschi immer, ein Paket wenn eines wartet,
 * Gegenstände erst, wenn ihr Türchen offen und das Paket ausgepackt ist.
 */
export function flauschiZonen(offen: number[] = [], z?: FlauschiStand): FlauschiZone[] {
  const zonen = FLAUSCHI_ZONEN.filter((zone) => {
    const ding = FLAUSCHI_DINGE.find((d) => d.id === zone.id);
    return !ding || (flauschiDingDa(ding, offen) && !!z && z.ausgepackt.includes(ding.tuer));
  });
  return z && flauschiPakete(offen, z).length ? [FLAUSCHI_PAKET_ZONE, ...zonen] : zonen;
}

/** Trifft der Zeiger ein Ziel? Bei Überlappung gewinnt die kleinste Fläche (Nase vor Bauch). */
export function flauschiZoneBei(x: number, y: number, offen: number[] = [], z?: FlauschiStand): FlauschiZone | null {
  let beste: FlauschiZone | null = null;
  for (const zone of flauschiZonen(offen, z)) {
    if (x < zone.x || x >= zone.x + zone.w || y < zone.y || y >= zone.y + zone.h) continue;
    if (!beste || zone.w * zone.h < beste.w * beste.h) beste = zone;
  }
  return beste;
}

/**
 * Namensschild für das Ziel unter dem Zeiger bzw. im Fokus. Kein Rahmen:
 * die Klickflächen selbst bleiben unsichtbar. Das Schild nutzt exakt den
 * Hovertext-Stil der Bühne (600 11px Space Grotesk, Text #eef7f2, Grund
 * rgba(8,20,26,.88), Höhe 20, Radius 5, Innenabstand 8) und erscheint beim
 * Zeigen UND beim Durchschalten – so ist ohne Maus immer klar, was gewählt ist.
 */
export function drawFlauschiZonen(c: C, hover: FlauschiZielId | null, fokus: FlauschiZielId | null) {
  const kopf = FLAUSCHI_ZONEN[0];
  const anFlauschi = (id: FlauschiZielId | null) => !!id && id in ANFASS_NAMEN;
  const beide = !!hover && !!fokus && hover !== fokus;
  for (const id of beide ? [fokus, hover] : [hover ?? fokus]) {
    if (!id) continue;
    // Zwei Schilder an derselben Stelle über der Mütze: Der Zeiger hat Vorrang.
    if (beide && id === fokus && anFlauschi(fokus) && anFlauschi(hover)) continue;
    const zone = FLAUSCHI_ZONEN.find((z) => z.id === id) ?? (id === "paket" ? FLAUSCHI_PAKET_ZONE : undefined);
    if (!zone) continue;
    const anker = anFlauschi(id) ? kopf : zone;
    c.font = '600 11px "Space Grotesk", sans-serif';
    c.textAlign = "left";
    const tw = c.measureText(zone.label).width + 16;
    const lx = Math.min(Math.max(anker.x + anker.w / 2 - tw / 2, GOL_X + 4), GOL_X + GOL_VIEW_W - tw - 4);
    const ly = Math.max(anker.y - 8, GOL_Y + 18);
    c.fillStyle = "rgba(8,20,26,.88)";
    c.beginPath();
    c.roundRect(lx, ly - 14, tw, 20, 5);
    c.fill();
    c.fillStyle = "#eef7f2";
    c.fillText(zone.label, lx + 8, ly);
  }
}

/* ---------------------------- Türchen-Geschenke ------------------------- */

export interface FlauschiGeschenk {
  tuer: number;
  name: string;
  funktion: string;
}

/**
 * Jedes Türchen legt zusätzlich zu der Hausdeko auch einen Gegenstand für
 * Flauschi ins Paket. Die fünf vor Nikolaus lesen sich als ganz gewöhnliche
 * Kalendergeschenke – sie verraten noch nicht, wofür sie bestimmt sind.
 * Türchen 1–5: Grundausstattung, Türchen 6: der Nikolaus bringt das Spiel mit dem Ei.
 */
export const FLAUSCHI_GESCHENKE: readonly FlauschiGeschenk[] = [
  { tuer: 1, name: "Futternapf", funktion: "steht für die Mahlzeiten bereit" },
  { tuer: 2, name: "Bürste", funktion: "macht das Fell fein und flauschig" },
  { tuer: 3, name: "Spielball", funktion: "rollt davon, sobald man ihn loslässt" },
  { tuer: 4, name: "Minidecke", funktion: "zum Einkuscheln und Zudecken" },
  { tuer: 5, name: "Laterne", funktion: "macht ein warmes, kleines Licht" },
  { tuer: 6, name: "Nikolaus bringt das Teleflauschi", funktion: "ein Ei, aus dem Flauschi schlüpft" },
  { tuer: 7, name: "Plätzchenblech", funktion: "darauf backt Flauschi ihren Vorrat" },
  { tuer: 8, name: "Schneekugel", funktion: "schütteln – dann schneit es im Zimmer" },
  { tuer: 9, name: "Geschenkpapier", funktion: "darin versteckt sie sich" },
  { tuer: 10, name: "Paketschleife", funktion: "verliert sie beim Niesen" },
  { tuer: 11, name: "Wollschal", funktion: "hält den Hals warm" },
  { tuer: 12, name: "Grammophon", funktion: "spielt ein Weihnachtslied, Flauschi tanzt" },
  { tuer: 13, name: "Schaukelpferd", funktion: "darauf reitet sie durchs Zimmer" },
  { tuer: 14, name: "Nussknacker", funktion: "knackt ihr eine Nuss" },
  { tuer: 15, name: "Glöckchen", funktion: "weckt sie sanft" },
  { tuer: 16, name: "Puderzucker-Dose", funktion: "streut feinen Zucker über die Plätzchen" },
  { tuer: 17, name: "Adventskranz", funktion: "seine Kerzen folgen dem echten Advent" },
  { tuer: 18, name: "Zinkwanne", funktion: "für ein Schaumbad" },
  { tuer: 19, name: "Kleine Eisenbahn", funktion: "fährt im Kreis um Flauschi herum" },
  { tuer: 20, name: "Mini-Fernseher", funktion: "ein Fernseher im Fernseher" },
  { tuer: 21, name: "Sternschnuppen-Faden", funktion: "zieht sie hinter sich her" },
  { tuer: 22, name: "Schneestern", funktion: "glitzert am Fenster" },
  { tuer: 23, name: "Silberkugel", funktion: "spiegelt das ganze Zimmer" },
  { tuer: 24, name: "Der große Baum", funktion: "jede Kugel daran hängt Flauschi selbst auf" },
];

/**
 * Ab Türchen 6 – dem Nikolaus – liegt das Modul überhaupt erst im Regal.
 * Im Prototyp (`ADVENT_NACH_DATUM = false`, alle Türchen frei) ist es sofort
 * da, damit die Vorschau etwas zeigt; die Endfassung zählt die Tage.
 */
export function flauschiVersprochen(offen: number[], nachDatum: boolean = ADVENT_NACH_DATUM): boolean {
  if (!nachDatum) return true;
  return offen.includes(6);
}

/** Geschenke, deren Türchen bereits offen ist, der Reihe nach. */
export function flauschiGeschenke(offen: number[]): FlauschiGeschenk[] {
  return FLAUSCHI_GESCHENKE.filter((g) => offen.includes(g.tuer));
}

/* ------------------------------ Knöpfe --------------------------------- */

export interface FlauschiKnopf {
  id: FlauschiAktion;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const KN_X = 120;
const KN_Y = 404;
const KN_W = 70;
const KN_H = 34;
const KN_S = 8;

/** Vier Pflegeknöpfe unter der Bildfläche – Wii-tauglich (≥ 24×24). */
export const FLAUSCHI_KNOEPE: readonly FlauschiKnopf[] = (
  [
    ["fuettern", "füttern"],
    ["streicheln", "bürsten"],
    ["spielen", "spielen"],
    ["schlafen", "schlafen"],
  ] as const
).map(([id, label], i) => ({ id, label, x: KN_X + i * (KN_W + KN_S), y: KN_Y, w: KN_W, h: KN_H }));

/** „zurück“ rechts, exakt auf Höhe der Knöpfe (GOL-Button-Maße). */
export const FLAUSCHI_ZURUECK = { x: 660, y: 404, w: 180, h: 34 } as const;

export function flauschiKnopfBei(x: number, y: number): FlauschiKnopf | null {
  for (const k of FLAUSCHI_KNOEPE) if (x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) return k;
  return null;
}

export function flauschiZurueckBei(x: number, y: number): boolean {
  return x >= FLAUSCHI_ZURUECK.x && x <= FLAUSCHI_ZURUECK.x + FLAUSCHI_ZURUECK.w &&
    y >= FLAUSCHI_ZURUECK.y && y <= FLAUSCHI_ZURUECK.y + FLAUSCHI_ZURUECK.h;
}

/* --------------------------------- HUD ---------------------------------- */

function balken(c: C, x: number, y: number, w: number, wert: number, marke: string, wertText: string, farbe: string) {
  c.font = '700 10px "Silkscreen", monospace';
  c.textAlign = "left";
  c.fillStyle = "#8fa8a0";
  c.fillText(marke, x, y);
  c.textAlign = "right";
  c.fillStyle = "#eef7f2";
  c.fillText(wertText, x + w, y);
  c.textAlign = "left";
  const bx = x;
  const by = y + 5;
  const bh = 9;
  c.fillStyle = "rgba(255,255,255,.13)";
  c.beginPath();
  c.roundRect(bx, by, w, bh, 3);
  c.fill();
  const f = Math.max(0, Math.min(1, wert / 100));
  if (f > 0.005) {
    c.fillStyle = farbe;
    c.beginPath();
    c.roundRect(bx, by, Math.max(4, w * f), bh, 3);
    c.fill();
  }
  c.strokeStyle = "rgba(255,255,255,.22)";
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(bx + 0.5, by + 0.5, w - 1, bh - 1, 3);
  c.stroke();
}

/** Klassisches Interface unter dem Bild: vier Balken und die Flocken. */
export function drawFlauschiHud(c: C, x: number, y: number, w: number, z: FlauschiStand) {
  const h = 40;
  c.fillStyle = "rgba(8,20,26,.9)";
  c.fillRect(x, y, w, h);
  c.fillStyle = "rgba(232,194,90,.5)";
  c.fillRect(x, y, w, 1);

  const gruppen: Array<[string, number, string, string]> = [
    ["HUNGER", z.hunger, "#e8b76c", `${Math.round(z.hunger)}%`],
    ["MÜDIGKEIT", z.muede, "#7aa2e8", `${Math.floor(z.muede)}%`],
    ["SAUBERKEIT", z.sauber, "#6fd3c0", `${Math.round(z.sauber)}%`],
    ["BESCHÄFTIGT", z.beschaeftigt, "#e88aa0", `${Math.round(z.beschaeftigt)}%`],
  ];
  const gw = 128;
  gruppen.forEach(([marke, wert, farbe, text], i) => {
    balken(c, x + 12 + i * (gw + 4), y + 15, gw, wert, marke, text, farbe);
  });

  // Flocken (Punkte)
  const px = x + 12 + 4 * (gw + 4);
  c.font = '700 10px "Silkscreen", monospace';
  c.fillStyle = "#8fa8a0";
  c.fillText("FLOCKEN", px, y + 15);
  c.fillStyle = "#e8c25a";
  c.font = '700 13px "Silkscreen", monospace';
  c.fillText(`${z.punkte}`, px, y + 31);

  // Wachstumsstufe: Ei, Baby, Kind oder Erwachsen.
  const sx = px + 100;
  c.font = '700 10px "Silkscreen", monospace';
  c.fillStyle = "#8fa8a0";
  c.fillText("STUFE", sx, y + 15);
  c.fillStyle = "#cbb6f1";
  c.font = '700 11px "Silkscreen", monospace';
  c.fillText(["EI", "BABY", "KIND", "ERWACHSEN"][clamp(Math.round(z.phase), 0, 3)], sx, y + 31);
}

/* ------------------------------ Knöpfe zeichnen ------------------------- */

/** Die vier Pflegeknöpfe und „zurück“ unter der Bildfläche. */
export function drawFlauschiKnoepfe(
  c: C,
  z: FlauschiStand,
  hover: FlauschiAktion | null,
  fokus: FlauschiAktion | null,
  zurueckFokus: boolean,
) {
  for (const k of FLAUSCHI_KNOEPE) {
    const aktiv = k.id === hover || k.id === fokus;
    const an = k.id === "schlafen" && z.schlaf;
    c.fillStyle = "#070d12";
    c.beginPath();
    c.roundRect(k.x, k.y + 1, k.w, k.h, 5);
    c.fill();
    c.fillStyle = aktiv ? "#3e5b61" : an ? "#334a63" : "#24333d";
    c.beginPath();
    c.roundRect(k.x, k.y, k.w, k.h - 1, 5);
    c.fill();
    if (k.id === fokus) {
      c.strokeStyle = "#f2cf68";
      c.lineWidth = 1.6;
      c.beginPath();
      c.roundRect(k.x - 2, k.y - 2, k.w + 4, k.h + 4, 6);
      c.stroke();
    }
    c.font = '700 10px "Silkscreen", monospace';
    c.fillStyle = "#eef7f2";
    c.textAlign = "center";
    c.fillText(k.label, k.x + k.w / 2, k.y + 21);
    c.textAlign = "left";
  }

  const b = FLAUSCHI_ZURUECK;
  c.fillStyle = "#0d1820";
  c.beginPath();
  c.roundRect(b.x, b.y, b.w, b.h, 5);
  c.fill();
  c.strokeStyle = "#f2f7f4";
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(b.x + 0.6, b.y + 0.6, b.w - 1.2, b.h - 1.2, 5);
  c.stroke();
  if (zurueckFokus) {
    c.strokeStyle = "#f2cf68";
    c.lineWidth = 1.6;
    c.beginPath();
    c.roundRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4, 6);
    c.stroke();
  }
  c.font = '700 12px "Silkscreen", monospace';
  c.fillStyle = "#f2f7f4";
  c.textAlign = "center";
  c.fillText("zurück", b.x + b.w / 2, b.y + 22);
  c.textAlign = "left";
}

/* ---------------------------- Geschenktafel ----------------------------- */

/**
 * Was aus den offenen Türchen für Flauschi kam: Name und Funktion, der Reihe
 * nach. Die fünf vor Nikolaus bleiben ohne Hinweis auf das Spiel – man
 * erfährt erst mit Türchen 6, wofür sie gut sind.
 */
export function drawFlauschiGeschenke(c: C, x: number, y: number, w: number, h: number, offen: number[]) {
  const liste = flauschiGeschenke(offen);
  c.fillStyle = "rgba(8,20,26,.9)";
  c.beginPath();
  c.roundRect(x, y, w, h, 8);
  c.fill();
  c.strokeStyle = "rgba(232,194,90,.55)";
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2, 8);
  c.stroke();

  c.font = '700 10px "Silkscreen", monospace';
  c.fillStyle = "#8fa8a0";
  c.fillText("GESCHENKE AUS DEN TÜRCHEN", x + 12, y + 17);

  const zeilen = Math.max(1, Math.floor((h - 26) / 13));
  const start = Math.max(0, liste.length - zeilen);
  const sichtbar = liste.slice(start);
  if (!sichtbar.length) {
    c.font = '600 11px "Space Grotesk", sans-serif';
    c.fillStyle = "#8fa8a0";
    c.fillText("Türchen öffnen – dann liegt hier ein Geschenk an.", x + 12, y + 36);
    return;
  }
  sichtbar.forEach((g, i) => {
    const zy = y + 33 + i * 13;
    c.font = '700 10px "Silkscreen", monospace';
    c.fillStyle = "#e8c25a";
    const nr = `${g.tuer}`.padStart(2, "0");
    c.fillText(nr, x + 12, zy);
    c.fillStyle = "#eef7f2";
    c.font = '600 11px "Space Grotesk", sans-serif';
    const text = `${g.name} – ${g.funktion}`;
    const platz = w - 44;
    let zeile = text;
    while (c.measureText(zeile).width > platz && zeile.length > 4) zeile = zeile.slice(0, -1);
    if (zeile !== text) zeile = `${zeile.slice(0, -1)}…`;
    c.fillText(zeile, x + 34, zy);
  });
  if (start > 0) {
    c.font = '700 10px "Silkscreen", monospace';
    c.fillStyle = "#8fa8a0";
    c.textAlign = "right";
    c.fillText(`+${start} FRÜHER`, x + w - 12, y + 17);
    c.textAlign = "left";
  }
}

/* ----------------------------- Stickeralbum ----------------------------- */

function stickerZeichen(c: C, id: string, x: number, y: number, r: number, an: boolean) {
  const f = an ? "#2a2440" : "rgba(238,247,242,.28)";
  const akzent = an ? "#e8c25a" : "rgba(238,247,242,.28)";
  if (id === "paket") {
    c.fillStyle = an ? "#c9453a" : f;
    c.fillRect(x - r * 0.6, y - r * 0.35, r * 1.2, r * 0.85);
    c.fillRect(x - r * 0.08, y - r * 0.35, r * 0.16, r * 0.85);
    kreis(c, x - r * 0.25, y - r * 0.55, r * 0.2, akzent);
    kreis(c, x + r * 0.25, y - r * 0.55, r * 0.2, akzent);
  } else if (id === "schluepfen") {
    ell(c, x, y + r * 0.1, r * 0.55, r * 0.68, an ? "#f7f1e3" : f);
    c.strokeStyle = f;
    c.lineWidth = Math.max(0.6, r * 0.09);
    c.beginPath();
    c.moveTo(x - r * 0.4, y - r * 0.12);
    c.lineTo(x - r * 0.14, y + r * 0.05);
    c.lineTo(x + r * 0.1, y - r * 0.14);
    c.lineTo(x + r * 0.38, y + r * 0.02);
    c.stroke();
  } else if (id === "baden") {
    c.fillStyle = an ? "#9fd3ee" : f;
    c.beginPath();
    c.moveTo(x, y - r * 0.7);
    c.bezierCurveTo(x + r * 0.55, y, x + r * 0.42, y + r * 0.62, x, y + r * 0.62);
    c.bezierCurveTo(x - r * 0.42, y + r * 0.62, x - r * 0.55, y, x, y - r * 0.7);
    c.fill();
  } else if (id === "tanzen") {
    ell(c, x - r * 0.15, y + r * 0.35, r * 0.3, r * 0.22, an ? "#ffe9a8" : f);
    linie(c, x + r * 0.12, y + r * 0.35, x + r * 0.12, y - r * 0.55, an ? "#ffe9a8" : f, Math.max(0.6, r * 0.1));
    linie(c, x + r * 0.12, y - r * 0.55, x + r * 0.5, y - r * 0.35, an ? "#ffe9a8" : f, Math.max(0.6, r * 0.1));
  } else if (id === "reiten") {
    c.strokeStyle = an ? "#d9a066" : f;
    c.lineWidth = Math.max(0.7, r * 0.16);
    c.beginPath();
    c.arc(x, y - r * 0.05, r * 0.48, Math.PI * 0.05, Math.PI * 0.95);
    c.stroke();
    linie(c, x - r * 0.48, y - r * 0.1, x - r * 0.48, y + r * 0.55, an ? "#d9a066" : f, Math.max(0.7, r * 0.14));
    linie(c, x + r * 0.48, y - r * 0.1, x + r * 0.48, y + r * 0.55, an ? "#d9a066" : f, Math.max(0.7, r * 0.14));
  } else if (id === "zug") {
    c.fillStyle = an ? "#c9453a" : f;
    c.fillRect(x - r * 0.62, y - r * 0.42, r * 1.24, r * 0.62);
    c.fillRect(x - r * 0.62, y - r * 0.62, r * 0.45, r * 0.25);
    kreis(c, x - r * 0.35, y + r * 0.38, r * 0.16, f === "#2a2440" ? "#eef7f2" : f);
    kreis(c, x + r * 0.35, y + r * 0.38, r * 0.16, f === "#2a2440" ? "#eef7f2" : f);
  } else if (id === "kugel") {
    kreis(c, x, y + r * 0.08, r * 0.5, an ? "#c9453a" : f);
    c.fillStyle = akzent;
    c.fillRect(x - r * 0.12, y - r * 0.62, r * 0.24, r * 0.2);
    kreis(c, x - r * 0.16, y - r * 0.12, r * 0.1, "rgba(255,255,255,.75)");
  } else if (id === "nase") {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI + 0.4;
      linie(c, x - Math.cos(a) * r * 0.55, y - Math.sin(a) * r * 0.55, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, akzent, Math.max(0.6, r * 0.09));
    }
    kreis(c, x, y, r * 0.14, akzent);
  } else if (id === "pfote") {
    ell(c, x, y + r * 0.22, r * 0.42, r * 0.34, an ? "#f2b3c6" : f);
    for (let i = -1.5; i <= 1.5; i++) kreis(c, x + i * r * 0.28, y - r * 0.28 - Math.abs(i) * -r * 0.06, r * 0.13, an ? "#f2b3c6" : f);
  } else {
    // Erwachsen: goldener Stern
    c.fillStyle = akzent;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr2 = i % 2 === 0 ? r * 0.68 : r * 0.3;
      if (i === 0) c.moveTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
      else c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
    }
    c.closePath();
    c.fill();
  }
  void herz;
}

/** Das Stickeralbum als schmale Leiste unter dem Fernsehbild: verdiente Sticker in Farbe, offene als Silhouette. */
export function drawFlauschiAlbum(c: C, x: number, y: number, z: FlauschiStand) {
  c.font = '700 9px "Silkscreen", monospace';
  c.fillStyle = "#8fa8a0";
  c.fillText("STICKERALBUM", x + 2, y + 9);
  FLAUSCHI_STICKER.forEach((st, i) => {
    const cx = x + 16 + i * 30;
    const cy = y + 28;
    const hat = z.sticker.includes(st.id);
    kreis(c, cx, cy, 12, hat ? "#e8c25a" : "rgba(255,255,255,.07)");
    if (hat) kreis(c, cx, cy, 10.5, "#f3e7cd");
    stickerZeichen(c, st.id, cx, cy, 10, hat);
  });
}

/* ------------------------------ Die Hülle ------------------------------- */

/**
 * Das Spielmodul: Hülle mit Flauschi-Bild, Steckkante unten. Wird klein im
 * Regal, in der Hand und in der Konsole gezeichnet – die Kontur muss auch
 * bei sechs Einheiten lesbar bleiben.
 */
export function drawFlauschiHuelle(c: C, x: number, y: number, w: number, h: number, t: number) {
  const s = w / 10;
  c.save();
  c.translate(x, y);
  c.fillStyle = "#12303a";
  c.beginPath();
  c.roundRect(0, 0, w, h, Math.max(0.6, 1.4 * s));
  c.fill();
  c.fillStyle = "#0d2329";
  c.beginPath();
  c.roundRect(s * 0.8, h - s * 2.6, w - s * 1.6, s * 2.4, Math.max(0.4, s * 0.6));
  c.fill();
  // Bildfeld
  c.fillStyle = "#1c4a3a";
  c.beginPath();
  c.roundRect(s, s * 0.9, w - s * 2, h - s * 4.4, Math.max(0.4, s * 0.8));
  c.fill();
  // Flauschi als winzige Fellkugel mit Mütze
  const cx = w / 2;
  const cy = h * 0.5;
  const r = Math.max(1, Math.min(w, h) * 0.22);
  c.fillStyle = "#cbb6f1";
  c.beginPath();
  c.arc(cx, cy, r, 0, TAU);
  c.fill();
  c.fillStyle = "#b03a30";
  c.beginPath();
  c.moveTo(cx - r, cy - r * 0.35);
  c.quadraticCurveTo(cx, cy - r * 2.1, cx + r * 1.3, cy - r * 0.9);
  c.quadraticCurveTo(cx + r * 0.5, cy - r * 1.5, cx + r, cy - r * 0.35);
  c.closePath();
  c.fill();
  c.fillStyle = "#f7f4ec";
  c.beginPath();
  c.arc(cx + r * 1.3, cy - r * 0.7, r * 0.4, 0, TAU);
  c.fill();
  c.fillStyle = "#24303c";
  c.beginPath();
  c.arc(cx - r * 0.35, cy - r * 0.1, Math.max(0.4, r * 0.22), 0, TAU);
  c.arc(cx + r * 0.35, cy - r * 0.1, Math.max(0.4, r * 0.22), 0, TAU);
  c.fill();
  // Titelstreifen
  c.fillStyle = `rgba(232,194,90,${0.55 + Math.sin(t * 2) * 0.2})`;
  c.fillRect(s, h - s * 3.6, w - s * 2, Math.max(0.5, s * 0.8));
  c.restore();
}
