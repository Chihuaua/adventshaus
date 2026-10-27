/**
 * Persistenz im Browser (localStorage). Derzeit nur die Ton-Einstellung;
 * Spielstände (z. B. geöffnete Kalendertürchen) kommen später hier dazu.
 * Alle Zugriffe sind abgesichert: ohne localStorage (Privatmodus) läuft
 * das Spiel einfach ohne Speicherung weiter.
 */

const MUTED = "lcp1.muted.v1";

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(v: boolean) {
  try {
    localStorage.setItem(MUTED, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}
