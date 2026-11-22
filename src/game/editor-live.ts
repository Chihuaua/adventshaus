/* =======================================================================
   Übernommene Editor-Positionen im Spiel (Schlüssel/Wert)

   Liest die im Luni-Studio mit „Position übernehmen“ gesicherten Gelenk-
   Verschiebungen. Getrennt je Figur und Pose. Kein React, nur lesender
   Zugriff auf den Schlüssel/Wert-Speicher – auf der Wii später SD-Karte.
   ======================================================================= */

export type GelenkDelta = Partial<Record<string, [number, number]>>;
const SCHLUESSEL = "lcp1.studio.editor";

/** Liest den gesamten Editor-Stand (leer, wenn nichts gespeichert ist). */
export function liveStand(): Record<string, Record<string, GelenkDelta>> {
  try {
    if (typeof localStorage === "undefined") return {};
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return {};
    const p = JSON.parse(roh) as Record<string, Record<string, GelenkDelta>>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

/** Verschiebungen für genau eine Figur und Pose (oder undefined). */
export function liveDelta(figur: "luni" | "frosch", pose: string): GelenkDelta | undefined {
  const d = liveStand()[figur]?.[pose];
  return d && Object.keys(d).length ? d : undefined;
}
