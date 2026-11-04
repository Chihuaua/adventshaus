/**
 * Stand-Übertragung (Osterei „Datenkoffer“ im Keller).
 *
 * Der komplette Spielstand liegt im localStorage unter Schlüsseln mit dem
 * Präfix `lcp1.` (Ton, Welten, Wetter, Schneedecke …). Damit ein Update das
 * Haus nicht auslöscht, wird der Stand hier als einfacher Text heraus- und
 * hereingeschrieben – kein Browser-spezifisches Format, 1:1 übertragbar.
 *
 * Ablauf auf dem Handy:
 *   1. „Stand kopieren“ → Text in die Zwischenablage
 *   2. neues Spiel öffnen → „Stand einfügen“ → Text einsetzen → übernehmen
 */

const PREFIX = "lcp1.";

export interface StandUebernahme {
  ok: boolean;
  /** Anzahl der übernommenen Schlüssel */
  anzahl: number;
  fehler?: string;
}

/** Alle Speicherschlüssel des Spiels als Text (JSON) einsammeln. */
export function standExport(): string {
  const daten: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      const v = localStorage.getItem(k);
      if (v !== null) daten[k] = v;
    }
  } catch {
    /* ohne localStorage gibt es nichts zu exportieren */
  }
  return JSON.stringify({ adventshaus: 1, schluessel: daten }, null, 1);
}

/**
 * Eingefügten Text prüfen und in den Speicher übernehmen. Es werden nur
 * Schlüssel mit dem Präfix `lcp1.` geschrieben; alles andere im Text wird
 * ignoriert. Bei einem Fehler bleibt der alte Stand unberührt.
 */
export function standImport(text: string): StandUebernahme {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return { ok: false, anzahl: 0, fehler: "Das ist kein lesbarer Stand (kein gültiges Format)." };
  }
  if (!roh || typeof roh !== "object" || !("schluessel" in roh)) {
    return { ok: false, anzahl: 0, fehler: "Dieser Text gehört nicht zum Adventshaus." };
  }
  const sl = (roh as { schluessel?: unknown }).schluessel;
  if (!sl || typeof sl !== "object") {
    return { ok: false, anzahl: 0, fehler: "Der Stand enthält keine Einträge." };
  }
  const eintraege = Object.entries(sl as Record<string, unknown>)
    .filter(([k, v]) => k.startsWith(PREFIX) && typeof v === "string")
    .map(([k, v]) => [k, v as string] as const);
  if (!eintraege.length) {
    return { ok: false, anzahl: 0, fehler: "Kein passender Eintrag gefunden." };
  }
  try {
    for (const [k, v] of eintraege) localStorage.setItem(k, v);
  } catch {
    return { ok: false, anzahl: 0, fehler: "Speichern ist hier nicht möglich (Privatmodus?)." };
  }
  return { ok: true, anzahl: eintraege.length };
}
