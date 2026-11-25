/* =======================================================================
   HAUSWELTEN

   Vier unabhängige Welten, jede mit eigenem Speicherplatz:
     normal    – das ursprüngliche Haus (Wachstein führt hierher)
     traum     – das Traumhaus, die bestehende Traumhaus-Ansicht
                 (der Traumstein führt hierher)
     gruesel   – das Gruselhaus im Halloween-Stil
                 (der Horrorstein führt hierher)
     weihnacht – das Weihnachtshaus (1:1-Kopie als Ausgangspunkt fürs
                 Weihnachtsdesign; der Weihnachtsstein führt hierher)

   Der Wechsel ist ein einziger Klick: Er setzt nur den URL-Hash. Die alte
   Ansicht speichert beim Abbau ihren Zustand unter ihrem eigenen Schlüssel,
   die neue stellt ihren eigenen wieder her. Keine Welt kann eine andere
   überschreiben, weil jeder Schlüssel den Weltnamen enthält.
   ======================================================================= */

import { loadJson, saveJson } from "./storage";
import type { TVStand } from "./tv";
import type { FlauschiStand } from "./flauschi";
import type { LavaSnapshot } from "./lavalampe";
import type { AbendFortschritt } from "./abendzeiten";

export type WeltId = "normal" | "traum" | "gruesel" | "weihnacht";

export const WELTEN: readonly WeltId[] = ["normal", "traum", "gruesel", "weihnacht"] as const;

export const WELT_NAMEN: Record<WeltId, string> = {
  normal: "Normales Haus",
  traum: "Traumhaus",
  gruesel: "Gruselhaus",
  weihnacht: "Weihnachtshaus",
};

/** URL-Hash je Welt. Das normale Haus liegt bewusst auf dem leeren Hash. */
export const WELT_HASH: Record<WeltId, string> = {
  normal: "",
  traum: "#traumhaus",
  gruesel: "#gruselhaus",
  weihnacht: "#weihnachtshaus",
};

export function weltAusHash(hash: string): WeltId | null {
  if (hash === "#traumhaus") return "traum";
  if (hash === "#gruselhaus") return "gruesel";
  if (hash === "#weihnachtshaus") return "weihnacht";
  if (hash === "" || hash === "#") return "normal";
  return null;
}

/** Ein Klick: nur der Hash ändert sich, App und Ansichten reagieren darauf. */
export function wechsleWelt(ziel: WeltId) {
  if (typeof window === "undefined") return;
  window.location.hash = WELT_HASH[ziel];
}

/* ------------------------------ Speicher -------------------------------- */

/** Was von einer Hauswelt gespeichert wird (nur einfache Werte). */
export interface HausSnapshot {
  v: 1;
  gespeichert: number;
  lx: number;
  lf: number;
  lface: 1 | -1;
  sick: number;
  pack: number;
  cigs: number;
  cigButt: boolean;
  pyjama: { top: string; bottom: string } | null;
  glassesOn: boolean;
  glassesInSink: boolean;
  brushInCab: boolean;
  /** Handy unter dem Kopf: verstrichene Anrufsekunden, danach der ruhende Endzustand. */
  handyNacht?: number | "schlaf";
  abendBegonnenAm?: number;
  abendFortschritt?: AbendFortschritt;
  gardenDoor: number;
  cellarDoorV: number;
  golOnShelf: boolean;
  golInserted: boolean;
  smoke: number;
  /** Gruselhaus: getragenes und zuletzt gewähltes Vampir-Outfit (Index). */
  vampir?: number | null;
  vampirLetzt?: number;
  /** Restbrennzeit, Gesamtdauer und Kippen im Aschenbecher / Eimer. */
  burnLeft?: number;
  burnTotal?: number;
  ashButts?: number;
  bucketButts?: number;
  lighterOnTable?: boolean;
  /** Kerzen im Gaming-Fenster: brennen dauerhaft, Luni schaltet sie um. */
  kerzenAn?: boolean;
  /** 90er-Lavalampe auf dem Spieleregal: Schaltzustand, Wärme und Erkaltungsform. */
  lavalampe?: LavaSnapshot;
  /** Senderwahl und Lautstaerke je Fernseher und Hauswelt. */
  tv?: TVStand;
  /** Teleflauschi „Flauschi“ im Weihnachtshaus: Zustand, Regal, Konsole. */
  flauschi?: FlauschiStand | null;
  flauschiEingelegt?: boolean;
  flauschiOnShelf?: boolean;
  /** Tagesablauf: Weste über dem Schlafanzug, Näpfe, erledigte Termine. */
  westeAn?: boolean;
  /** Senseo: vergessene Tassen im Keller, Tassen neben der Spüle, Wasser im Tank. */
  kaffee?: { unten?: number; spuele?: number; tank?: number };
  napfFutter?: { odin?: number; apollo?: number };
  tagErledigt?: { weste?: number; essen?: number; fuettern?: number; auslass?: number; aufwachen?: number };
  einschlafSek?: number;
  /** Kalendertag (Tage seit 1970), an dem sie eingeschlafen ist. */
  einschlafTag?: number;
  /** Positionen von Odin und Apollo im normalen Haus. */
  hunde?: {
    odin?: { x: number; floor: 0 | 1 | 2; face: 1 | -1 };
    apollo?: { x: number; floor: 0 | 1 | 2; face: 1 | -1 };
  };
}

const schluessel = (welt: WeltId) => `lcp1.welt.${welt}.v1`;

export function ladeSnapshot(welt: WeltId): HausSnapshot | null {
  const s = loadJson<HausSnapshot>(schluessel(welt));
  return s && s.v === 1 ? s : null;
}

export function speichereSnapshot(welt: WeltId, snap: HausSnapshot) {
  saveJson(schluessel(welt), snap);
}

/** Das Traumhaus hat keinen Spielzustand, merkt sich aber seine Besuche. */
export interface BesuchsInfo {
  v: 1;
  besuche: number;
  zuletzt: number;
}

export function markiereBesuch(welt: WeltId): BesuchsInfo {
  const alt = loadJson<BesuchsInfo>(`lcp1.besuch.${welt}.v1`);
  const neu: BesuchsInfo = { v: 1, besuche: (alt?.besuche ?? 0) + 1, zuletzt: Date.now() };
  saveJson(`lcp1.besuch.${welt}.v1`, neu);
  return neu;
}

export function ladeBesuch(welt: WeltId): BesuchsInfo | null {
  return loadJson<BesuchsInfo>(`lcp1.besuch.${welt}.v1`);
}
