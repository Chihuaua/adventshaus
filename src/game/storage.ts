/**
 * Persistenz im Browser (localStorage): Ton-Einstellung und die Zustände der
 * Hauswelten (siehe welten.ts). Spielstände (z. B. geöffnete Kalendertürchen)
 * kommen später hier dazu. Einfache Schlüssel/Wert-Struktur, damit sie sich
 * 1:1 auf eine SD-Karte schreiben ließe.
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

/** Beliebigen JSON-Wert unter einem Schlüssel ablegen (abgesichert). */
export function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
