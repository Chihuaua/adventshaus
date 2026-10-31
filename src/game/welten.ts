/* =======================================================================
   HAUSWELTEN

   Drei unabhängige Welten, jede mit eigenem Speicherplatz:
     normal  – das ursprüngliche Haus (Wachstein führt hierher)
     traum   – das Horrorhaus, die bestehende Traumhaus-Ansicht
               (der Traumstein führt hierher)
     gruesel – das Gruselhaus im Halloween-Stil
               (der Horrorstein führt hierher)

   Der Wechsel ist ein einziger Klick: Er setzt nur den URL-Hash. Die alte
   Ansicht speichert beim Abbau ihren Zustand unter ihrem eigenen Schlüssel,
   die neue stellt ihren eigenen wieder her. Keine Welt kann eine andere
   überschreiben, weil jeder Schlüssel den Weltnamen enthält.
   ======================================================================= */

import { loadJson, saveJson } from "./storage";

export type WeltId = "normal" | "traum" | "gruesel";

export const WELTEN: readonly WeltId[] = ["normal", "traum", "gruesel"] as const;

export const WELT_NAMEN: Record<WeltId, string> = {
  normal: "Normales Haus",
  traum: "Horrorhaus",
  gruesel: "Gruselhaus",
};

/** URL-Hash je Welt. Das normale Haus liegt bewusst auf dem leeren Hash. */
export const WELT_HASH: Record<WeltId, string> = {
  normal: "",
  traum: "#traumhaus",
  gruesel: "#gruselhaus",
};

export function weltAusHash(hash: string): WeltId | null {
  if (hash === "#traumhaus") return "traum";
  if (hash === "#gruselhaus") return "gruesel";
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
  gardenDoor: number;
  cellarDoorV: number;
  golOnShelf: boolean;
  golInserted: boolean;
  smoke: number;
}

const schluessel = (welt: WeltId) => `lcp1.welt.${welt}.v1`;

export function ladeSnapshot(welt: WeltId): HausSnapshot | null {
  const s = loadJson<HausSnapshot>(schluessel(welt));
  return s && s.v === 1 ? s : null;
}

export function speichereSnapshot(welt: WeltId, snap: HausSnapshot) {
  saveJson(schluessel(welt), snap);
}

/** Das Horrorhaus hat keinen Spielzustand, merkt sich aber seine Besuche. */
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
