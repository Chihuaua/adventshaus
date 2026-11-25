/* =======================================================================
   ADVENTSHAUS — AUSBAULOGIK

   Das Adventshaus ist ein Klon des Traumhauses: ein normales, kuscheliges
   Haus ohne Weihnachtsdeko. Es ist die Zielwelt des Projekts (alle anderen
   Häuser sind Entwicklungshäuser).

   Der Ausbau passiert Stück für Stück über den Adventskalender:
   Jedes geöffnete Türchen (1–24) schaltet genau eine Stufe frei. Eine Stufe
   ist ein Deko-Stück, ein Gegenstand, ein Bewohner, ein Ablauf oder ein
   Ereignis. Vor Türchen 1 ist das Haus leer und still, nach Türchen 24
   steht es in voller Pracht — und ist dann die optimierte Fassung des
   Weihnachtshauses.

   Grundsätze (KI-START):
     • Echtzeit: Türchen folgen dem echten Datum (Europe/Berlin),
       sie sind nachholbar, aber nie vorziehbar.
     • Zuschauen statt gewinnen: keine Punkte, keine Balken. Der Ausbau
       wird nur sichtbar, nie bewertet.
     • Reine Schlüssel/Wert-Speicherung, keine Browser-Spezialitäten:
       diese Datei rechnet nur mit Zahlen und Listen.

   Entwicklungs-Schalter: AUSBAU_VORSCHAU_TUERCHEN gilt zusätzlich zu den
   echt geöffneten Türchen (0 = aus). Für die Abnahme im Browser kann die
   Stufe auch über den Hash gesetzt werden: "#adventshaus/12".
   ======================================================================= */

/** Weltkennung des Adventshauses (URL-Hash "#adventshaus"). */
export const ADVENTSHAUS_HASH = "#adventshaus";

/** Zusätzliche Türchen für Vorschau/Abnahme. 0 = echter Stand. */
export const AUSBAU_VORSCHAU_TUERCHEN = 0;

/** So viele Türchen hat der Advent. */
export const AUSBAU_TUERCHEN = 24;

export type AusbauArt = "deko" | "gegenstand" | "bewohner" | "ablauf" | "ereignis";

export interface AusbauStufe {
  /** Türchen 1–24, das diese Stufe freischaltet. */
  tuer: number;
  /** Schaltername für das Haus (siehe hat() in house.ts); fehlt = reine Deko. */
  schalter?: string;
  titel: string;
  art: AusbauArt;
  ort: string;
  /** Ein Satz dazu, was sich im Haus ändert. */
  text: string;
}

/**
 * Der Ausbauplan: 24 Stufen in fester Reihenfolge. Die Deko-Stücke stammen
 * aus deko.ts (ein Stück pro Türchen), die Schalter verdrahtet house.ts.
 */
export const AUSBAU_STUFEN: readonly AusbauStufe[] = [
  { tuer: 1, schalter: "deko", titel: "Türkranz", art: "deko", ort: "Haustür", text: "Der Ausbau beginnt: Von jetzt an bleibt jedes neue Stück im Haus." },
  { tuer: 2, schalter: "hunde", titel: "Odin und Apollo", art: "bewohner", ort: "Flur und Garten", text: "Die Hunde ziehen ein, laufen mit und lassen sich rufen." },
  { tuer: 3, schalter: "weihnachtsdeko", titel: "Kaffeeküche", art: "gegenstand", ort: "Küche", text: "Senseo, Tassen und der Kranz auf dem Couchtisch sind da." },
  { tuer: 4, schalter: "abend", titel: "Abendroutine", art: "ablauf", ort: "Schlafzimmer und Bad", text: "Luni geht abends zu Bett und steht morgens wieder auf." },
  { tuer: 5, schalter: "post", titel: "Postfrosch", art: "ereignis", ort: "Haustür", text: "Der Lieferfrosch klingelt und bringt Pakete ins Haus." },
  { tuer: 6, schalter: "nikolaus", titel: "Nikolaus", art: "ereignis", ort: "Haustür", text: "Am 6. Dezember klopft der Nikolaus mit Ruprecht." },
  { tuer: 7, schalter: "kerzen", titel: "Klavierkerzen", art: "gegenstand", ort: "Musikzimmer", text: "Zwei Kerzen am Klavier, Luni schaltet sie um." },
  { tuer: 8, schalter: "adventskranz", titel: "Adventskranz", art: "deko", ort: "Esstisch", text: "Vier Kerzen, eine pro Adventssonntag." },
  { tuer: 9, schalter: "xmaskiste", titel: "Weihnachtskiste", art: "gegenstand", ort: "Keller", text: "Die Kiste lässt sich öffnen; darin liegt der Schmuck." },
  { tuer: 10, schalter: "flauschi", titel: "Teleflauschi", art: "gegenstand", ort: "Wohnzimmer", text: "Flauschi zieht auf dem Regal ein und will gekrault werden." },
  { tuer: 11, schalter: "kaffee", titel: "Morgenkaffee", art: "ablauf", ort: "Küche", text: "Zwei Tassen am Morgen, danach die Zigarette auf dem Balkon." },
  { tuer: 12, schalter: "lavalampe", titel: "Lavalampe", art: "gegenstand", ort: "Spieleregal", text: "Die 90er-Lampe wärmt sich auf und wirft Blasen." },
  { tuer: 13, schalter: "froschblase", titel: "Frosch-Denkblase", art: "ereignis", ort: "Garten", text: "Der Lieferfrosch denkt sichtbar mit, ehe er klingelt." },
  { tuer: 14, schalter: "wetter", titel: "Wetterstation", art: "gegenstand", ort: "Garten", text: "Schnee, Regen und Frost richten sich nach der echten Lage." },
  { tuer: 15, schalter: "sternennacht", titel: "Herrnhuter Stern", art: "deko", ort: "Flur", text: "Der Stern hängt in der Flurmitte und leuchtet warm." },
  { tuer: 16, schalter: "festlich", titel: "Festliche Fassung", art: "deko", ort: "ganzes Haus", text: "Kalender im Weltraum, Schlitten statt UFO, warme Bettdecke." },
  { tuer: 17, titel: "Bett-Set", art: "deko", ort: "Schlafzimmer", text: "Neue Decke und Kissen in Rot und Creme." },
  { tuer: 18, titel: "Schwibbogen", art: "deko", ort: "Schlafzimmerfenster", text: "Der Bogen stellt sich ins Fenster und brennt jeden Abend." },
  { tuer: 19, titel: "Bad-Set", art: "deko", ort: "Badezimmer", text: "Handtücher, Seife und ein kleiner Kranz am Spiegel." },
  { tuer: 20, titel: "Regal-Lichterkette", art: "deko", ort: "Gaming-Zimmer", text: "Eine Kette umrahmt das Spieleregal." },
  { tuer: 21, titel: "Klavier-Goldgirlande", art: "deko", ort: "Musikzimmer", text: "Gold am Klavier, passend zu den Kerzen." },
  { tuer: 22, titel: "Dachrinnen-Lichterkette", art: "deko", ort: "Haus außen", text: "Das ganze Haus bekommt einen lichten Rand." },
  { tuer: 23, titel: "Holzkrippe", art: "deko", ort: "Wohnzimmerecke", text: "Die Krippe steht in der Ecke, das Kind leuchtet." },
  { tuer: 24, schalter: "baum", titel: "Weihnachtsbaum", art: "ereignis", ort: "Wohnzimmer", text: "Das Finale: Der Baum steht und das Haus ist fertig ausgebaut." },
] as const;

/* ------------------------------ Rechnung ------------------------------- */

function tuerchen(offen: readonly number[], vorschau: number): number[] {
  const menge = new Set<number>();
  for (const t of offen) if (Number.isInteger(t) && t >= 1 && t <= AUSBAU_TUERCHEN) menge.add(t);
  const v = Math.max(0, Math.min(AUSBAU_TUERCHEN, Math.floor(vorschau)));
  for (let t = 1; t <= v; t++) menge.add(t);
  return [...menge].sort((a, b) => a - b);
}

/** Höchste freigeschaltete Stufe (0 = leeres Haus). */
export function ausbauStufe(offen: readonly number[], vorschau = AUSBAU_VORSCHAU_TUERCHEN): number {
  return tuerchen(offen, vorschau).reduce((h, t) => (t > h ? t : h), 0);
}

/** Alle Schalter, die das Haus schon freigeschaltet hat. */
export function ausbauSchalter(offen: readonly number[], vorschau = AUSBAU_VORSCHAU_TUERCHEN): Set<string> {
  const stufe = ausbauStufe(offen, vorschau);
  const set = new Set<string>();
  for (const s of AUSBAU_STUFEN) if (s.schalter && s.tuer <= stufe) set.add(s.schalter);
  return set;
}

/** Ist dieser Schalter im Adventshaus schon frei? */
export function schalterFrei(set: ReadonlySet<string>, schalter: string): boolean {
  return set.has(schalter);
}

/** Sichtbarkeitsmaske für deko.ts: Index 0 = Türchen 1. */
export function dekoMaske(offen: readonly number[], vorschau = AUSBAU_VORSCHAU_TUERCHEN): boolean[] {
  const t = tuerchen(offen, vorschau);
  return Array.from({ length: AUSBAU_TUERCHEN }, (_, i) => t.includes(i + 1));
}

/** Wie viele Deko-Stücke stehen schon im Haus? */
export function dekoAnzahl(offen: readonly number[], vorschau = AUSBAU_VORSCHAU_TUERCHEN): number {
  return dekoMaske(offen, vorschau).filter(Boolean).length;
}

/** Die nächste Stufe, die noch fehlt (null = Haus ist fertig). */
export function naechsteStufe(offen: readonly number[], vorschau = AUSBAU_VORSCHAU_TUERCHEN): AusbauStufe | null {
  const stufe = ausbauStufe(offen, vorschau);
  return AUSBAU_STUFEN.find((s) => s.tuer === stufe + 1) ?? null;
}

/** Stufe zu einem Türchen (null, wenn es keine gibt). */
export function stufeZu(tuer: number): AusbauStufe | null {
  return AUSBAU_STUFEN.find((s) => s.tuer === tuer) ?? null;
}

/** Kurze Meldung für die Bühne, wenn ein Türchen ein neues Stück bringt. */
export function ausbauMeldung(tuer: number): string | null {
  const s = stufeZu(tuer);
  return s ? `Neu im Haus: ${s.titel}` : null;
}

/* --------------------------- Datum und Hash ---------------------------- */

/**
 * Türchen im Adventshaus: nur im Dezember und nie vor seinem Tag.
 * Nachholen ist erlaubt (alle vergangenen Tage bleiben offen).
 */
export function tuerchenFrei(tag: number, monat: number, tagImMonat: number): boolean {
  if (monat !== 12) return false;
  return tag >= 1 && tag <= AUSBAU_TUERCHEN && tag <= tagImMonat;
}

/** "#adventshaus" oder "#adventshaus/12" → Vorschau-Stufe (null = echter Stand). */
export function ausbauVorschauAusHash(hash: string): number | null {
  const m = /^#adventshaus(?:\/(\d{1,2}))?$/.exec(hash || "");
  if (!m) return null;
  if (!m[1]) return null;
  return Math.max(0, Math.min(AUSBAU_TUERCHEN, Number(m[1])));
}

/** Gehört dieser Hash zum Adventshaus? */
export function istAdventshausHash(hash: string): boolean {
  return /^#adventshaus(?:\/\d{1,2})?$/.test(hash || "");
}