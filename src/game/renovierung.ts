/* =======================================================================
   RENOVIERUNG — TAPETENWECHSEL (Vorschläge)

   Sechs Arten, wie eine Wand von der alten zur neuen Tapete wechseln kann.
   Geändert wird ausschließlich die Wandfläche; Möbel, Boden und Decke
   bleiben, wie sie sind.

   Jede Darstellung besteht aus zwei Schichten:
     drawRenovierungWand  – die Wand selbst (liegt HINTER den Möbeln)
     drawRenovierungVorn  – Beiwerk davor (Leiter, Eimer, Sterne, Flocken)

   Der Fortschritt p läuft von 0 (alte Wand) bis 1 (neue Wand). Bei genau
   0 und genau 1 wird nur die jeweilige Wand gemalt – Anfang und Ende sind
   damit bildgleich mit den bestehenden Häusern.

   Nur Canvas-Primitive (Rechtecke, Vielecke, Ausschnitte). Kein Text,
   keine Bilder, keine Browser-Spezialitäten: alles auf der Wii nachbaubar.
   Diese Datei kennt weder das Haus noch React.
   ======================================================================= */

export type C = CanvasRenderingContext2D;
type Maler = (c: C) => void;

/** Eine Wandfläche: Rechteck, oben von der Decke (oder Dachschräge) beschnitten. */
export interface RenoWand {
  x0: number;
  x1: number;
  yTop: number;
  yBot: number;
  /** Unterkante der Decke an der Stelle x (flach oder Dachschräge). */
  decke: (x: number) => number;
  /** Optionaler Dachfirst innerhalb [x0, x1] (z. B. x = 470 im Gaming-Zimmer). */
  first?: number;
  /** Anzahl der Tapetenbahnen (Standard: RENO_BAHNEN = 10). */
  bahnen?: number;
  /** Fliesengröße in Bühneneinheiten für „fliesen“ (Standard: 14). */
  fliese?: number;
  /** Maximale Leiterhöhe für hohe Wände wie das Treppenhaus (Standard: 60). */
  leiterMax?: number;
  /** Im Haus arbeitet Luni: je Bahn erst abziehen, dann neu tapezieren. */
  handwerk?: boolean;
}

export type RenoId = "bahnen" | "abziehen" | "plane" | "sterne" | "rauten" | "nacht";
/** Alle Renovierungsarten im Haus: Tapetenwechsel und die eigene Fliesen-Methode fürs Bad. */
export type RenoMethode = RenoId | "fliesen";

/** Alle neun Räume des Hauses, jeder mit eigener Wand-Routine. */
export type RenoRaumId =
  | "musik"
  | "gaming"
  | "schlafzimmer"
  | "badezimmer"
  | "treppenhaus"
  | "flur"
  | "wohnzimmer"
  | "kueche"
  | "keller";

/** Fortschritt (0..1) je Raum – fehlt ein Raum, bleibt seine normale Wand. */
export type RenoStand = Partial<Record<RenoRaumId, number>>;

export interface RenoRaum {
  id: RenoRaumId;
  name: string;
  methode: "bahnen" | "fliesen";
  /** Grunddauer in Sekunden; mit Luni 1,4-fach fuer Abziehen und Handgriffe, ohne Anfahrtsweg. */
  dauer: number;
  /** Tapetenbahnen (nur bei methode = "bahnen"). */
  bahnen?: number;
  /** Anteil der linken Dachschrägen-Wand beim zweiteiligen Gaming-Zimmer. */
  randAnteil?: number;
  /** Kurze Beschreibung der Arbeitsweise. */
  kurz: string;
}

/** Plan für jeden Raum des Hauses (von oben nach unten: Dachgeschoss → Keller). */
export const RENO_RAEUME: readonly RenoRaum[] = [
  { id: "musik", name: "Musikzimmer", methode: "bahnen", dauer: 11, bahnen: 10, kurz: "10 Tapetenbahnen rollen von der Dachschräge ab." },
  { id: "gaming", name: "Gaming-Zimmer", methode: "bahnen", dauer: 13, bahnen: 9, randAnteil: 5 / 14, kurz: "14 Bahnen ziehen vom Treppenrand über den Dachfirst." },
  { id: "schlafzimmer", name: "Schlafzimmer", methode: "bahnen", dauer: 9.5, bahnen: 8, kurz: "8 ruhige Bahnen von links nach rechts." },
  { id: "badezimmer", name: "Badezimmer", methode: "fliesen", dauer: 13, kurz: "Fliese für Fliese von unten nach oben mit Kleber, Fliesenkreuzen und Fugenschwamm." },
  { id: "treppenhaus", name: "Treppenhaus", methode: "bahnen", dauer: 9.5, bahnen: 5, kurz: "5 hohe Bahnen über beide Stockwerke." },
  { id: "flur", name: "Flur", methode: "bahnen", dauer: 7, bahnen: 5, kurz: "5 Bahnen hinter Garderobe und Haustür." },
  { id: "wohnzimmer", name: "Wohnzimmer", methode: "bahnen", dauer: 11, bahnen: 10, kurz: "Eingang und Wohnzimmer: Luni zieht die alten Bahnen ab und tapeziert neu." },
  { id: "kueche", name: "Küche", methode: "bahnen", dauer: 7, bahnen: 5, kurz: "5 Bahnen von der Küchenzeile bis zum Esstisch." },
  { id: "keller", name: "Keller", methode: "bahnen", dauer: 14, bahnen: 14, kurz: "14 Bahnen über beide Kellerräume." },
] as const;

export function renoRaumInfo(id: RenoRaumId): RenoRaum {
  return RENO_RAEUME.find((r) => r.id === id) ?? RENO_RAEUME[0];
}

/** Teilt den Gaming-Zimmer-Fortschritt (0..1) sauber auf linken Rand (5 Bahnen) und Hauptwand (9 Bahnen). */
export function gamingTeile(p: number): { rand: number; haupt: number } {
  const k = Math.max(0, Math.min(1, p));
  if (k <= 0) return { rand: 0, haupt: 0 };
  if (k >= 1) return { rand: 1, haupt: 1 };
  const schnitt = renoRaumInfo("gaming").randAnteil ?? 5 / 14;
  return {
    rand: Math.min(1, k / schnitt),
    haupt: k <= schnitt ? 0 : Math.min(1, (k - schnitt) / (1 - schnitt)),
  };
}

/** Der Eingang wird mit dem Wohnzimmer bearbeitet, nicht durch eine zweite Luni. */
export function renoAuftragsRaeume(raum: RenoRaumId): RenoRaumId[] {
  return raum === "wohnzimmer" ? ["flur", "wohnzimmer"] : [raum];
}

/** Ab diesem Fortschritt beginnt beim Bad das Verfugen & Abwaschen mit dem Schwamm. */
export const FLIESEN_VERFUGEN_AB = 0.78;
/** So viele Fliesen weit zeigt sich der gekämmte Fliesenkleber vor den neuen Fliesen. */
const FLIESEN_VORLAUF = 5;

export interface RenoVorschlag {
  id: RenoId;
  titel: string;
  /** Ein Satz: was man sieht. */
  kurz: string;
  /** Zwei, drei Sätze: wie es abläuft. */
  text: string;
  /** Wie es im Haus in echter Zeit laufen würde. */
  echtzeit: string;
  /** Was die Wii dafür können muss. */
  wii: string;
  /** Bauaufwand: 1 klein, 2 mittel, 3 groß. */
  aufwand: 1 | 2 | 3;
  /** Sekunden für einen Durchlauf in der Vorschau. */
  dauer: number;
  empfohlen?: boolean;
}

export const RENO_VORSCHLAEGE: readonly RenoVorschlag[] = [
  {
    id: "bahnen",
    titel: "Bahn für Bahn",
    kurz: "Zehn Tapetenbahnen rollen nacheinander von der Dachschräge bis zum Boden ab.",
    text: "Wie beim echten Tapezieren: links anfangen, jede Bahn rollt nach unten ab. Frisch geklebte Bahnen sind kurz dunkler und trocknen nach. Leiter und Kleistereimer wandern mit.",
    echtzeit: "Eine Bahn pro Stunde – wer tagsüber reinschaut, sieht den Stand. Oder alle zehn in 20 Sekunden gleich nach dem Türchen.",
    wii: "Nur rechteckige Ausschnitte. Problemlos.",
    aufwand: 1,
    dauer: 11,
    empfohlen: true,
  },
  {
    id: "abziehen",
    titel: "Erst runter, dann rauf",
    kurz: "Die alte Tapete wird abgezogen, der nackte Putz bleibt stehen, dann kommt die neue.",
    text: "Zwei Arbeitsgänge. Dazwischen steht das Zimmer als Rohbau da: heller Putz mit Tapetenresten und Bleistiftmarken. Das ist die ehrlichste Renovierung – und die längste.",
    echtzeit: "Tag 1 abziehen, über Nacht steht der Rohputz, Tag 2 tapezieren.",
    wii: "Rechteckige Ausschnitte plus eine einfache Putzfläche. Gut machbar.",
    aufwand: 2,
    dauer: 15,
  },
  {
    id: "plane",
    titel: "Hinter der Plane",
    kurz: "Ein Malervlies fällt vor die Wand, dahinter beult es sich – dann fällt es, und die Wand ist neu.",
    text: "Man sieht die Arbeit nicht, nur dass gearbeitet wird: Eine Beule wandert hinter dem Tuch hin und her. Die Überraschung kommt, wenn die Plane fällt.",
    echtzeit: "Die Plane hängt einen echten Tag. Am nächsten Morgen ist sie weg.",
    wii: "Senkrechte Streifen in Grautönen. Problemlos.",
    aufwand: 1,
    dauer: 10,
  },
  {
    id: "sterne",
    titel: "Sternenwisch",
    kurz: "Ein Band aus Goldsternen zieht schräg durchs Zimmer und lässt die neue Tapete zurück.",
    text: "Kein Handwerk, sondern Weihnachtszauber. Kurz, festlich und passend zu dem Moment, in dem ein Türchen aufgeht.",
    echtzeit: "Drei bis vier Sekunden, direkt wenn das Türchen aufgeht.",
    wii: "Ein schräger Ausschnitt, ein helles Band, ein paar Sterne. Gut machbar.",
    aufwand: 2,
    dauer: 5,
  },
  {
    id: "rauten",
    titel: "Rauten rieseln",
    kurz: "Schnee fällt – wo er liegen bleibt, wächst eine Raute der neuen Tapete, von unten nach oben.",
    text: "Die Wand wächst im Raster ihres eigenen Musters zu. Unten zuerst, wie Schnee, der sich sammelt. Ruhig und verspielt.",
    echtzeit: "Über eine Stunde verteilt – oder nur, solange es draußen laut Wetterstation wirklich schneit.",
    wii: "Viele kleine Rauten-Ausschnitte. Machbar, aber die teuerste Variante.",
    aufwand: 3,
    dauer: 12,
  },
  {
    id: "nacht",
    titel: "Über Nacht",
    kurz: "Luni schläft, es wird dunkel – am Morgen ist die Wand neu.",
    text: "Die Tapete blendet sanft über, während das Zimmer im Dunkeln liegt. Niemand sieht die Arbeit, das Haus hat sich einfach verändert.",
    echtzeit: "Nachts, zwischen Einschlafen und Aufwachen.",
    wii: "Zwei Wandbilder übereinander blenden. Am einfachsten.",
    aufwand: 1,
    dauer: 8,
  },
] as const;

export function renoVorschlag(id: RenoId): RenoVorschlag {
  return RENO_VORSCHLAEGE.find((v) => v.id === id) ?? RENO_VORSCHLAEGE[0];
}

/** So viele Bahnen hat eine Wand beim Tapezieren. */
export const RENO_BAHNEN = 10;

/* ------------------------------- Helfer -------------------------------- */

const TAU = Math.PI * 2;
const klemm = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const weich = (v: number) => {
  const p = klemm(v);
  return p * p * (3 - 2 * p);
};

/** Fester Zufall 0..1 je Nummer (kein Math.random: jeder Durchlauf sieht gleich aus). */
function zufall(n: number): number {
  let h = Math.imul((n | 0) ^ 0x5bd1e995, 0x2c1b3c6d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

const bahnZahl = (w: RenoWand) => Math.max(1, Math.round(w.bahnen ?? RENO_BAHNEN));

function wandPfad(c: C, w: RenoWand) {
  c.beginPath();
  c.moveTo(w.x0, w.yBot);
  c.lineTo(w.x0, w.decke(w.x0));
  if (w.first !== undefined && w.first > w.x0 && w.first < w.x1) {
    c.lineTo(w.first, w.decke(w.first));
  }
  c.lineTo(w.x1, w.decke(w.x1));
  c.lineTo(w.x1, w.yBot);
  c.closePath();
}

/** Malt nur innerhalb eines Rechtecks. */
function teil(c: C, x: number, y: number, b: number, h: number, mal: Maler) {
  if (b <= 0 || h <= 0) return;
  c.save();
  c.beginPath();
  c.rect(x, y, b, h);
  c.clip();
  mal(c);
  c.restore();
}

function bahn(w: RenoWand, i: number) {
  const n = bahnZahl(w);
  const b = (w.x1 - w.x0) / n;
  const xa = w.x0 + i * b;
  let oben = Math.min(w.decke(xa), w.decke(xa + b));
  if (w.first !== undefined && w.first >= xa && w.first <= xa + b) {
    oben = Math.min(oben, w.decke(w.first));
  }
  return { xa, b, oben };
}

/** Gemeinsamer Takt fuer Wand, Leiter und Haende. */
export function tapezierTakt(w: RenoWand, p: number) {
  const n = bahnZahl(w);
  const z = klemm(p) * n;
  const i = Math.min(n - 1, Math.floor(z));
  const u = p >= 1 ? 1 : z - i;
  const { xa, b, oben } = bahn(w, i);
  const mitte = klemm(xa + b * 0.5 + 5, w.x0 + 14, w.x1 - 14);
  const vorher = klemm(xa - b * 0.5 + 5, w.x0 + 14, w.x1 - 14);
  const schritt = weich(u / 0.14);
  const x = i === 0 ? mitte : vorher + (mitte - vorher) * schritt;
  const hoch = weich((u - 0.14) / 0.12) * (1 - weich((u - 0.82) / 0.12));
  const hub = Math.max(0, w.yBot - w.decke(mitte) - 64);
  return {
    i, u, n, xa, b, oben, x, mitte, hub, hoch,
    y: w.yBot - hub * hoch,
    ab: weich((u - 0.26) / 0.2),
    auf: weich((u - 0.52) / 0.21),
  };
}

function handwerkBahnen(c: C, w: RenoWand, p: number, alt: Maler, neu: Maler) {
  const a = tapezierTakt(w, p);
  alt(c);
  if (a.i > 0) teil(c, w.x0, w.yTop, a.xa - w.x0, w.yBot - w.yTop, neu);
  const abKante = a.oben + (w.yBot - a.oben) * a.ab;
  if (a.ab > 0) {
    teil(c, a.xa, w.yTop, a.b, abKante - w.yTop, (cc) => putz(cc, w));
    if (a.ab < 1) {
      // Bedruckte Vorderseite klappt nach unten, helle Rueckseite rollt sich ein.
      teil(c, a.xa, abKante, a.b, 7, (cc) => { cc.translate(0, 5); alt(cc); });
      rolle(c, a.xa, abKante, a.b, "#ded0b8", "#b4a385");
    }
  }
  if (a.auf > 0) {
    const kante = a.oben + (w.yBot - a.oben) * a.auf;
    teil(c, a.xa, w.yTop, a.b, kante - w.yTop, neu);
    const feucht = 0.12 * (1 - weich((a.u - 0.73) / 0.2));
    c.fillStyle = `rgba(6,18,14,${feucht})`;
    c.fillRect(a.xa, w.yTop, a.b, kante - w.yTop);
    if (a.auf < 1) rolle(c, a.xa, kante, a.b, "#efe6d0", "#cdbf9f");
  }
}

/** Tapetenrolle an der Abrollkante. */
function rolle(c: C, x: number, y: number, b: number, hell: string, dunkel: string) {
  c.fillStyle = "rgba(0,0,0,.24)";
  c.fillRect(x, y + 3, b, 2.4);
  c.fillStyle = hell;
  c.beginPath();
  c.roundRect(x - 1, y - 3.2, b + 2, 6.4, 3.2);
  c.fill();
  c.fillStyle = dunkel;
  c.fillRect(x + 0.6, y + 0.9, b - 1.2, 1.5);
  c.fillStyle = "rgba(255,255,255,.6)";
  c.fillRect(x + 1, y - 2.3, b - 2, 1);
}

/** Neue Bahnen kleben: q = 0..1 über alle Bahnen der Wand. */
function neueBahnen(c: C, w: RenoWand, q: number, neu: Maler) {
  const n = bahnZahl(w);
  const naht = 0.2 * (1 - weich((q - 0.9) / 0.1));
  for (let i = 0; i < n; i++) {
    const lage = klemm(q * n - i);
    if (lage <= 0) continue;
    const { xa, b, oben } = bahn(w, i);
    const kante = oben + (w.yBot - oben) * weich(lage);
    teil(c, xa, w.yTop, b + 0.5, kante - w.yTop, neu);
    // Frisch geklebt ist die Bahn noch feucht und dunkler; sie trocknet nach.
    const trocken = klemm((q * n - i - 1) / 2.5);
    if (trocken < 1) {
      c.fillStyle = `rgba(6,18,14,${0.22 * (1 - trocken)})`;
      c.fillRect(xa, w.yTop, b, kante - w.yTop);
    }
    if (naht > 0.01 && i < n - 1) {
      c.fillStyle = `rgba(0,0,0,${naht})`;
      c.fillRect(xa + b - 0.4, w.yTop, 0.8, kante - w.yTop);
    }
    if (lage < 1) rolle(c, xa, kante, b, "#efe6d0", "#cdbf9f");
  }
}

/** Nackter Putz mit Tapetenresten, Kleisterspuren und Bleistiftmarken. */
function putz(c: C, w: RenoWand) {
  const breite = w.x1 - w.x0, hoehe = w.yBot - w.yTop;
  c.fillStyle = "#cbbfa9";
  c.fillRect(w.x0, w.yTop, breite, hoehe);
  for (let i = 0; i < 48; i++) {
    const x = w.x0 + zufall(i * 3 + 1) * breite;
    const y = w.yTop + zufall(i * 3 + 2) * hoehe;
    const r = 5 + zufall(i * 3 + 3) * 16;
    c.fillStyle = i % 3 === 0 ? "rgba(255,255,255,.11)" : i % 3 === 1 ? "rgba(92,74,52,.11)" : "rgba(154,87,80,.2)";
    c.beginPath();
    c.ellipse(x, y, r, r * 0.5, zufall(i + 90) * 3, 0, TAU);
    c.fill();
  }
  c.fillStyle = "rgba(255,255,255,.08)";
  for (let x = w.x0 + 5; x < w.x1; x += 17) c.fillRect(x, w.yTop, 3, hoehe);
  c.fillStyle = "rgba(60,50,40,.34)";
  for (let i = 1; i < RENO_BAHNEN; i++) {
    const { xa, oben } = bahn(w, i);
    c.fillRect(xa - 0.35, oben + 5, 0.7, 7);
  }
  c.fillStyle = "rgba(0,0,0,.14)";
  c.fillRect(w.x0, w.yBot - 4, breite, 4);
}

function stern4(c: C, x: number, y: number, r: number) {
  const k = r * 0.26;
  c.beginPath();
  c.moveTo(x, y - r);
  c.lineTo(x + k, y - k);
  c.lineTo(x + r, y);
  c.lineTo(x + k, y + k);
  c.lineTo(x, y + r);
  c.lineTo(x - k, y + k);
  c.lineTo(x - r, y);
  c.lineTo(x - k, y - k);
  c.closePath();
  c.fill();
}

/** Schräge des Sternenwischs (Versatz in x je Einheit y). */
const WISCH_SCHRAEG = 0.42;

function wischFront(w: RenoWand, p: number, y: number): number {
  const breite = w.x1 - w.x0, hoehe = w.yBot - w.yTop;
  const e = weich(p) * 0.45 + klemm(p) * 0.55;
  return w.x0 - 24 + (breite + 48 + hoehe * WISCH_SCHRAEG) * e - (y - w.yTop) * WISCH_SCHRAEG;
}

/** Phasen von „Erst runter, dann rauf“. */
const abziehPhase = (p: number) => ({ ab: klemm(p / 0.44), auf: klemm((p - 0.56) / 0.44) });

/** Phasen von „Hinter der Plane“. */
const planePhase = (p: number) => ({ fall: weich(p / 0.2), weg: weich((p - 0.74) / 0.26), arbeit: p > 0.22 && p < 0.72 });

/* ------------------------------ Die Wand ------------------------------- */

/**
 * Malt die Wand im Übergang. alt und neu malen jeweils die ganze Wand;
 * hier wird nur entschieden, wo welche zu sehen ist.
 */
/** Berechnet Raster und aktuelle Arbeitsposition fürs Fliesenlegen (Reihe für Reihe von unten nach oben). */
export function fliesenStand(w: RenoWand, p: number) {
  const tile = w.fliese ?? 14;
  const cols = Math.max(1, Math.ceil((w.x1 - w.x0) / tile));
  const rows = Math.max(1, Math.ceil((w.yBot - w.yTop) / tile));
  const gesamt = cols * rows;
  const k = klemm(p);
  if (k < FLIESEN_VERFUGEN_AB) {
    const legP = k / FLIESEN_VERFUGEN_AB;
    const pos = legP * (gesamt + FLIESEN_VORLAUF + 1.6);
    const gesetzt = Math.max(0, Math.min(gesamt, Math.floor(pos - FLIESEN_VORLAUF)));
    const aktiv = Math.min(gesamt - 1, Math.max(0, Math.floor(pos - FLIESEN_VORLAUF * 0.5)));
    const aktivRow = rows - 1 - Math.floor(aktiv / cols);
    const spalte = aktiv % cols;
    const aktivCol = w.handwerk && (rows - 1 - aktivRow) % 2 ? cols - 1 - spalte : spalte;
    return { phase: "legen" as const, tile, cols, rows, gesamt, pos, gesetzt, schwamm: 0, aktivCol, aktivRow };
  }
  const schwamm = klemm((k - FLIESEN_VERFUGEN_AB) / (1 - FLIESEN_VERFUGEN_AB));
  return { phase: "verfugen" as const, tile, cols, rows, gesamt, pos: gesamt + FLIESEN_VORLAUF + 2, gesetzt: gesamt, schwamm, aktivCol: cols - 1, aktivRow: 0 };
}

/** Koerper, Leiter und Handwerkzeug benutzen denselben erreichbaren Arbeitsort im Bad. */
export function fliesenArbeitsOrt(w: RenoWand, p: number) {
  const a = fliesenStand(w, p);
  const rest = weich((p - 0.94) / 0.06);
  const tx = a.phase === "legen" ? w.x0 + (a.aktivCol + 0.5) * a.tile
    : w.x0 + 12 + (w.x1 - w.x0 - 24) * weich(a.schwamm);
  const ty = a.phase === "legen" ? w.yTop + (a.aktivRow + 0.5) * a.tile
    : w.yTop + 14 + (w.yBot - w.yTop - 28) * a.schwamm;
  return {
    a, tx, ty,
    x: klemm(tx + 8, w.x0 + 18, w.x1 - 16) * (1 - rest) + (w.x1 - 17) * rest,
    y: klemm(ty + 49, w.yTop + 64, w.yBot) * (1 - rest) + w.yBot * rest,
  };
}

/** Diagonale Schwamm-Koordinate (0 = oben links, 1 = unten rechts). */
function fliesenDiag(x: number, y: number, w: RenoWand): number {
  const dx = Math.max(1, w.x1 - w.x0);
  const dy = Math.max(1, w.yBot - w.yTop);
  return ((x - w.x0) / dx * 0.62 + (y - w.yTop) / dy * 0.38);
}

/** Kleines weißes Fliesenkreuz (+) an den Fugenkreuzungen frisch gesetzter Fliesen. */
function fliesenKreuz(c: C, cx: number, cy: number, alpha: number) {
  if (alpha <= 0.02) return;
  c.fillStyle = `rgba(244,239,224,${alpha.toFixed(3)})`;
  c.fillRect(cx - 2.1, cy - 0.55, 4.2, 1.1);
  c.fillRect(cx - 0.55, cy - 2.1, 1.1, 4.2);
}

/** Gekämmtes graues Fliesenkleber-Bett (typische Zahnspachtel-Rillen) in einer Fliesenzelle. */
function kleberZelle(c: C, x: number, y: number, b: number, h: number, frisch: number) {
  // Warmgrauer Zement-Fliesenkleber
  c.fillStyle = "#8e9289";
  c.fillRect(x, y, b, h);
  // Waagerechte gekämmte Zahnspachtel-Rillen (heller Kamm, dunkleres Tal)
  c.fillStyle = "#a5a99f";
  for (let ry = 1.5; ry < h - 0.5; ry += 3.2) c.fillRect(x, y + ry, b, 1.1);
  c.fillStyle = "#70746c";
  for (let ry = 2.6; ry < h - 0.5; ry += 3.2) c.fillRect(x, y + ry, b, 0.9);
  // Leichter Tiefenschatten an Ober- und Seitenkante der noch stehenden alten Fliesen
  c.fillStyle = "rgba(24,30,26,.28)";
  c.fillRect(x, y, b, 1.4);
  if (frisch > 0 && frisch < 1) {
    // Kurzer heller Staubhauch beim Abschlagen der alten Fliese
    c.fillStyle = `rgba(232,228,216,${(0.32 * (1 - frisch)).toFixed(3)})`;
    c.fillRect(x + 1, y + 1, b - 2, h - 2);
  }
}

/** Fliesen-Renovierung im Bad: Reihe für Reihe von unten nach oben + Verfugen & Schwamm. */
function maleFliesenWand(c: C, w: RenoWand, p: number, _t: number, alt: Maler, neu: Maler) {
  const st = fliesenStand(w, p);
  const { tile, cols, rows, pos, phase, schwamm } = st;
  const zelle = (r: number, q: number) => {
    const x = w.x0 + q * tile;
    const y = w.yTop + r * tile;
    return { x, y, b: Math.min(tile, w.x1 - x), h: Math.min(tile, w.yBot - y) };
  };

  if (phase === "legen") {
    alt(c);
    // 1) Kleberzellen (alte Fliese schon runter, neue noch nicht angedrückt)
    const fertig: { r: number; q: number; x: number; y: number; b: number; h: number; feucht: number }[] = [];
    const setzend: { x: number; y: number; b: number; h: number; e: number }[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      for (let q = 0; q < cols; q++) {
        const reihe = rows - 1 - r;
        const idx = reihe * cols + (w.handwerk && reihe % 2 ? cols - 1 - q : q);
        if (pos < idx) continue;
        const z = zelle(r, q);
        if (z.b <= 0 || z.h <= 0) continue;
        const seit = pos - idx;
        if (seit < FLIESEN_VORLAUF) {
          kleberZelle(c, z.x, z.y, z.b, z.h, seit / 1.2);
        } else if (seit < FLIESEN_VORLAUF + 1.4) {
          // Kurz vor dem Einrasten: Kleber darunter, Fliese drückt sich sanft an.
          kleberZelle(c, z.x, z.y, z.b, z.h, 2);
          const e = weich((seit - FLIESEN_VORLAUF) / 1.4);
          setzend.push({ ...z, e });
        } else {
          const feucht = 1 - klemm((seit - FLIESEN_VORLAUF - 1.4) / 7);
          fertig.push({ r, q, ...z, feucht });
        }
      }
    }
    // 2) Alle schon sitzenden neuen Fliesen in einem einzigen Clip-Durchgang malen (Wii-freundlich).
    if (fertig.length > 0) {
      c.save();
      c.beginPath();
      for (const z of fertig) c.rect(z.x, z.y, z.b + 0.15, z.h + 0.15);
      c.clip();
      neu(c);
      c.restore();

      // Noch offene, noch nicht verfugte Fugen und feiner Keramikglanz bei frischen Fliesen.
      for (const z of fertig) {
        c.strokeStyle = "rgba(38,50,45,.34)";
        c.lineWidth = 0.9;
        c.strokeRect(z.x + 0.4, z.y + 0.4, z.b - 0.8, z.h - 0.8);
        if (z.feucht > 0.04) {
          c.fillStyle = `rgba(240,248,242,${(0.2 * z.feucht).toFixed(3)})`;
          c.fillRect(z.x + 1, z.y + 1, z.b - 2, Math.max(2, (z.h - 2) * 0.42));
        }
      }
      // Kleine weiße Fliesenkreuze an den oberen Ecken frisch gesetzter Fliesen
      for (const z of fertig) {
        if (z.q < cols - 1 && z.r > 0) fliesenKreuz(c, z.x + tile, z.y, 0.72);
      }
    }
    // 3) Die 1–2 Fliesen, die gerade angedrückt werden (zarter Einrast-Versatz)
    for (const z of setzend) {
      const versatz = (1 - z.e) * 2.4;
      c.fillStyle = `rgba(18,26,22,${(0.32 * (1 - z.e) + 0.08).toFixed(3)})`;
      c.fillRect(z.x + 1, z.y + 1 + versatz, z.b, z.h);
      c.save();
      c.beginPath();
      c.rect(z.x, z.y - versatz, z.b, z.h);
      c.clip();
      c.translate(0, -versatz);
      neu(c);
      c.restore();
      c.fillStyle = `rgba(255,252,240,${(0.28 * (1 - z.e)).toFixed(3)})`;
      c.fillRect(z.x + 1, z.y - versatz + 1, z.b - 2, 2.2);
    }
    return;
  }

  // Phase 2: Verfugen & Abwaschen – alle neuen Fliesen sitzen, der Schwamm wischt diagonal.
  neu(c);
  const front = -0.14 + schwamm * 1.32;
  const ausklang = 1 - weich((schwamm - 0.86) / 0.14);
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      const z = zelle(r, q);
      if (z.b <= 0 || z.h <= 0) continue;
      const d = fliesenDiag(z.x + z.b * 0.5, z.y + z.h * 0.5, w);
      const abstand = d - front;
      if (abstand > 0.03) {
        // Noch nicht verfugt: offene dunkle Fuge + kleines weißes Fliesenkreuz
        const s = klemm(abstand / 0.12);
        c.strokeStyle = `rgba(38,50,45,${(0.32 * s).toFixed(3)})`;
        c.lineWidth = 0.85;
        c.strokeRect(z.x + 0.4, z.y + 0.4, z.b - 0.8, z.h - 0.8);
        if (q < cols - 1 && r > 0) fliesenKreuz(c, z.x + tile, z.y, 0.72 * s);
      } else if (abstand > -0.18) {
        // Direkt im Schwammgang: feiner heller Fugenmörtel-Schleier glättet die Fugen
        const welle = Math.sin(klemm((abstand + 0.18) / 0.21) * Math.PI);
        c.fillStyle = `rgba(232,226,210,${(0.32 * welle * ausklang).toFixed(3)})`;
        c.fillRect(z.x, z.y, z.b, z.h);
        // Frische helle Fugenlinie
        c.strokeStyle = `rgba(238,233,219,${(0.45 * welle * ausklang).toFixed(3)})`;
        c.lineWidth = 1.1;
        c.strokeRect(z.x + 0.3, z.y + 0.3, z.b - 0.6, z.h - 0.6);
      } else if (abstand > -0.36 && ausklang > 0.02) {
        // Frischer, klarer Keramik-Glanz nach dem Abwischen
        const glanz = Math.sin(klemm((abstand + 0.36) / 0.18) * Math.PI) * ausklang;
        c.fillStyle = `rgba(248,252,248,${(0.18 * glanz).toFixed(3)})`;
        c.fillRect(z.x + 1, z.y + 1, z.b - 2, Math.max(2, (z.h - 2) * 0.4));
      }
    }
  }
}

/**
 * Malt die Wand im Übergang. alt und neu malen jeweils die ganze Wand;
 * hier wird nur entschieden, wo welche zu sehen ist.
 */
export function drawRenovierungWand(c: C, id: RenoMethode, p: number, t: number, w: RenoWand, alt: Maler, neu: Maler) {
  // Keine zusaetzliche Clipkante an fertigen Dachschraegen: Referenzbild bleibt pixelgleich.
  if (p <= 0) { alt(c); return; }
  if (p >= 1) { neu(c); return; }
  c.save();
  wandPfad(c, w);
  c.clip();
  if (p <= 0) alt(c);
  else if (p >= 1) neu(c);
  else if (id === "fliesen") {
    maleFliesenWand(c, w, p, t, alt, neu);
  } else if (id === "bahnen" && w.handwerk) {
    handwerkBahnen(c, w, p, alt, neu);
  } else if (id === "bahnen") {
    alt(c);
    neueBahnen(c, w, p, neu);
  } else if (id === "abziehen") {
    const { ab, auf } = abziehPhase(p);
    alt(c);
    const n = bahnZahl(w);
    for (let i = 0; i < n; i++) {
      const lage = klemm(ab * n - i);
      if (lage <= 0) continue;
      const { xa, b, oben } = bahn(w, i);
      const kante = oben + (w.yBot - oben) * weich(lage);
      teil(c, xa, w.yTop, b + 0.5, kante - w.yTop, (cc) => putz(cc, w));
      if (lage < 1) {
        // Die abgezogene Bahn hängt eingerollt herunter.
        c.fillStyle = "#d8c7ab";
        c.beginPath();
        c.moveTo(xa, kante);
        c.lineTo(xa + b, kante);
        c.lineTo(xa + b - 3, kante + 8 + Math.sin(t * 3 + i) * 1.5);
        c.lineTo(xa + 2, kante + 6);
        c.closePath();
        c.fill();
        rolle(c, xa, kante, b, "#e2d3bb", "#b39d7c");
      }
    }
    neueBahnen(c, w, auf, neu);
  } else if (id === "plane") {
    const { fall, weg, arbeit } = planePhase(p);
    (p < 0.47 ? alt : neu)(c);
    if (weg < 1) {
      for (let x = w.x0; x < w.x1; x += 4) {
        const d = w.decke(x + 2), h = w.yBot - d;
        const oben = d + h * weg * 1.03;
        const unten = Math.min(w.yBot - 1, d + h * fall + Math.sin(x * 0.19 + t * 1.3) * 1.3 - 1);
        if (unten <= oben) continue;
        const falte = Math.sin(x * 0.23 + Math.sin(t * 0.8 + x * 0.03) * 0.7);
        const hell = Math.round(222 + falte * 10);
        c.fillStyle = `rgb(${hell},${hell - 4},${hell - 15})`;
        c.fillRect(x, oben, 4.3, unten - oben);
        c.fillStyle = "rgba(0,0,0,.2)";
        c.fillRect(x, unten - 1.4, 4.3, 1.4);
      }
      if (arbeit) {
        // Jemand arbeitet dahinter: eine Beule wandert hin und her.
        const bx = w.x0 + (0.5 + 0.4 * Math.sin(t * 0.9)) * (w.x1 - w.x0);
        const by = Math.max(w.decke(bx) + 22, w.yBot - 44 + Math.sin(t * 2.3) * 9);
        c.fillStyle = "rgba(60,52,40,.16)";
        c.beginPath();
        c.ellipse(bx + 3, by + 4, 15, 20, 0, 0, TAU);
        c.fill();
        c.fillStyle = "rgba(255,255,255,.3)";
        c.beginPath();
        c.ellipse(bx, by, 12, 17, 0, 0, TAU);
        c.fill();
      }
      if (weg <= 0 && fall >= 1) {
        // Malerkrepp hält das Vlies an der Dachschräge.
        c.fillStyle = "#e6cf74";
        for (let x = w.x0 + 14; x < w.x1 - 6; x += 38) c.fillRect(x, w.decke(x) + 0.5, 9, 3);
      }
    }
  } else if (id === "sterne") {
    alt(c);
    const xo = wischFront(w, p, w.yTop), xu = wischFront(w, p, w.yBot);
    c.save();
    c.beginPath();
    c.moveTo(w.x0 - 60, w.yTop);
    c.lineTo(xo, w.yTop);
    c.lineTo(xu, w.yBot);
    c.lineTo(w.x0 - 60, w.yBot);
    c.closePath();
    c.clip();
    neu(c);
    c.restore();
    // Helles Band an der Front: in gescherten Koordinaten steht es senkrecht.
    c.save();
    c.transform(1, 0, -WISCH_SCHRAEG, 1, WISCH_SCHRAEG * w.yTop, 0);
    const band = c.createLinearGradient(xo - 20, 0, xo + 7, 0);
    band.addColorStop(0, "rgba(255,226,150,0)");
    band.addColorStop(0.72, "rgba(255,226,150,.5)");
    band.addColorStop(0.9, "rgba(255,250,228,.85)");
    band.addColorStop(1, "rgba(255,226,150,0)");
    c.fillStyle = band;
    c.fillRect(xo - 20, w.yTop, 27, w.yBot - w.yTop);
    c.restore();
  } else if (id === "rauten") {
    alt(c);
    const bw = 28, bh = 32, hoehe = w.yBot - w.yTop;
    c.save();
    c.beginPath();
    let zeile = 0;
    for (let y = w.yTop + 12; y < w.yBot + bh; y += bh, zeile++) {
      const versatz = (zeile % 2) * (bw / 2);
      let spalte = 0;
      for (let x = w.x0 + 10 + versatz - bw; x < w.x1 + bw; x += bw, spalte++) {
        // Unten zuerst, wie Schnee, der liegen bleibt.
        const wann = (1 - klemm((y - w.yTop) / hoehe)) * 0.62 + zufall(zeile * 31 + spalte) * 0.3;
        const lage = klemm((p * 1.06 - wann) / 0.14);
        if (lage <= 0) continue;
        const e = weich(lage), a = bw * 1.05 * e, b = bh * 1.05 * e;
        c.moveTo(x, y - b);
        c.lineTo(x + a, y);
        c.lineTo(x, y + b);
        c.lineTo(x - a, y);
        c.closePath();
      }
    }
    c.clip();
    neu(c);
    c.restore();
  } else {
    // Über Nacht: sanftes Überblenden.
    alt(c);
    c.globalAlpha = weich((p - 0.3) / 0.4);
    neu(c);
    c.globalAlpha = 1;
  }
  c.restore();
}

/* ----------------------------- Das Beiwerk ----------------------------- */

function leiter(c: C, x: number, boden: number, hoehe: number) {
  c.save();
  c.lineCap = "round";
  c.strokeStyle = "#7c5d31";
  c.lineWidth = 2.3;
  c.beginPath();
  c.moveTo(x - 8, boden);
  c.lineTo(x - 4, boden - hoehe);
  c.moveTo(x + 8, boden);
  c.lineTo(x + 4, boden - hoehe);
  c.stroke();
  c.strokeStyle = "#c9a468";
  c.lineWidth = 1.6;
  for (let s = 7; s < hoehe - 3; s += 9) {
    const halb = 8 - 4 * (s / hoehe);
    c.beginPath();
    c.moveTo(x - halb, boden - s);
    c.lineTo(x + halb, boden - s);
    c.stroke();
  }
  c.restore();
}

function eimer(c: C, x: number, boden: number) {
  c.fillStyle = "rgba(0,0,0,.22)";
  c.beginPath();
  c.ellipse(x, boden, 7, 1.6, 0, 0, TAU);
  c.fill();
  c.fillStyle = "#7f8f9a";
  c.beginPath();
  c.moveTo(x - 5.5, boden - 9);
  c.lineTo(x + 5.5, boden - 9);
  c.lineTo(x + 4.2, boden);
  c.lineTo(x - 4.2, boden);
  c.closePath();
  c.fill();
  c.fillStyle = "#eee6cf";
  c.fillRect(x - 5, boden - 9.8, 10, 1.9);
  c.fillStyle = "#6b4a2a";
  c.fillRect(x + 1.6, boden - 17, 1.6, 8);
  c.fillStyle = "#e9dfc6";
  c.fillRect(x + 0.4, boden - 19.5, 4, 3);
}

/** Dunkler Mörtelkübel mit grauem Fliesenkleber und schräger Zahnspachtel. */
function moertelKuebel(c: C, x: number, boden: number) {
  c.fillStyle = "rgba(0,0,0,.24)";
  c.beginPath();
  c.ellipse(x, boden, 9, 2, 0, 0, TAU);
  c.fill();
  // Schwarzer runder Mörtelkübel
  c.fillStyle = "#33393d";
  c.beginPath();
  c.moveTo(x - 7.8, boden - 10);
  c.lineTo(x + 7.8, boden - 10);
  c.lineTo(x + 6.2, boden);
  c.lineTo(x - 6.2, boden);
  c.closePath();
  c.fill();
  // Kübelrand + gehäufter grauer Fliesenkleber
  c.fillStyle = "#4c5459";
  c.fillRect(x - 8.2, boden - 11.2, 16.4, 2);
  c.fillStyle = "#9ca098";
  c.beginPath();
  c.ellipse(x, boden - 10.6, 6.4, 2.2, 0, 0, TAU);
  c.fill();
  // Zahnspachtel: gezahntes Stahlblatt + Holzgriff
  c.save();
  c.translate(x + 3.4, boden - 11);
  c.rotate(0.38);
  c.fillStyle = "#c7d0d3";
  c.fillRect(-3.4, -7.2, 6.8, 6.2);
  // Feine Zähne am rechten Rand der Kelle
  c.fillStyle = "#7a8488";
  for (let zy = -6.8; zy < -1.2; zy += 1.8) c.fillRect(2.4, zy, 1.1, 0.9);
  c.fillStyle = "#9b6d3f";
  c.beginPath();
  c.roundRect(-1.2, -13.2, 2.6, 6.6, 1.1);
  c.fill();
  c.restore();
}

/** Angelehnter Fliesenstapel (schrumpft sichtbar, je mehr Fliesen gesetzt sind). */
function fliesenStapel(c: C, x: number, boden: number, anzahl: number) {
  if (anzahl <= 0) return;
  const n = Math.min(7, anzahl);
  c.fillStyle = "rgba(0,0,0,.2)";
  c.beginPath();
  c.ellipse(x, boden, 5 + n * 0.9, 1.8, 0, 0, TAU);
  c.fill();
  for (let i = 0; i < n; i++) {
    const ox = x - (n - 1) * 0.8 + i * 1.9;
    // Heller Keramik-Scherben an der Kante
    c.fillStyle = "#dad3c2";
    c.fillRect(ox - 5, boden - 13.5, 1.2, 13.5);
    // Glasierte salbeigrüne Weihnachtsfliese
    c.fillStyle = i % 2 === 0 ? "#69867e" : "#5e7b73";
    c.fillRect(ox - 3.8, boden - 13.5, 9.2, 13.5);
    c.fillStyle = "rgba(240,248,242,.2)";
    c.fillRect(ox - 3.8, boden - 13.5, 9.2, 1.2);
  }
}

/** Flacher Fliesenschwamm zum Verfugen & Abwaschen. */
function fugenSchwamm(c: C, x: number, y: number, wisch: number) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.28 + Math.sin(wisch) * 0.14);
  // Zarter feuchter Glanz dahinter
  c.fillStyle = "rgba(238,236,226,.34)";
  c.beginPath();
  c.ellipse(-4, 2, 11, 5.5, 0, 0, TAU);
  c.fill();
  // Schatten
  c.fillStyle = "rgba(18,28,24,.24)";
  c.beginPath();
  c.roundRect(-6.4, -2.8, 13.4, 7.6, 2.2);
  c.fill();
  // Ockerfarbener Schwamm (Unterseite etwas dunkler)
  c.fillStyle = "#c49a42";
  c.beginPath();
  c.roundRect(-7, -3.4, 13.4, 7, 2.2);
  c.fill();
  c.fillStyle = "#e8c86f";
  c.beginPath();
  c.roundRect(-7, -4.4, 13.4, 5.6, 2);
  c.fill();
  // Feine Schwammporen
  c.fillStyle = "rgba(130,96,30,.32)";
  for (const [px, py] of [[-4, -2], [-0.5, -1], [2.8, -2.3], [4.2, -0.8], [-2.2, -0.5]] as const) {
    c.fillRect(px, py, 1, 1);
  }
  c.restore();
}

/** Beiwerk im Bad: Mörtelkübel, Zahnspachtel, Fliesenstapel, am Ende Wascheimer & Schwamm. */
function maleFliesenVorn(c: C, w: RenoWand, p: number, t: number) {
  const st = fliesenStand(w, p);
  const blende = klemm(p / 0.04) * klemm((1 - p) / 0.05);
  c.globalAlpha = blende;
  if (st.phase === "legen") {
    const rest = Math.max(0, Math.ceil(((st.gesamt - st.gesetzt) / st.gesamt) * 7));
    const zielX = w.x0 + (st.aktivCol + 0.5) * st.tile;
    const kx = klemm(zielX, w.x0 + 16, w.x1 - 32);
    moertelKuebel(c, kx, w.yBot);
    fliesenStapel(c, w.x1 - 15, w.yBot, rest);
    // Feine lockere Mörtel-Staubpünktchen nahe der aktiven Reihe
    const sy = w.yTop + (st.aktivRow + 0.5) * st.tile;
    c.fillStyle = "rgba(232,228,214,.62)";
    for (let i = 0; i < 4; i++) {
      const fall = ((t * 22 + i * 7.3) % 14);
      const dx = Math.sin(t * 3 + i * 2.1) * 5;
      const py = sy + fall;
      if (py < w.yBot - 2) c.fillRect(klemm(zielX + dx, w.x0 + 2, w.x1 - 2), py, 1.3, 1.3);
    }
  } else {
    // Verfugen & Abwaschen: blaugrauer Wascheimer + wandernder Fliesenschwamm
    const ex = w.x0 + 22;
    eimer(c, ex, w.yBot);
    const sx = w.x0 + 12 + (w.x1 - w.x0 - 24) * weich(st.schwamm);
    const sy = w.yTop + 14 + (w.yBot - w.yTop - 28) * st.schwamm + Math.sin(t * 7.5) * 11;
    if (!w.handwerk) fugenSchwamm(c, klemm(sx, w.x0 + 9, w.x1 - 9), klemm(sy, w.yTop + 8, w.yBot - 8), t * 6.5);
  }
}

/** Wo gerade gearbeitet wird: gleitet von Bahn zu Bahn. */
function arbeitsX(w: RenoWand, q: number): number {
  const n = bahnZahl(w);
  const b = (w.x1 - w.x0) / n;
  const lage = klemm(q, 0, 0.9999) * n;
  const i = Math.floor(lage);
  const von = w.x0 + (i + 0.5) * b;
  const nach = w.x0 + (Math.min(n - 1, i + 1) + 0.5) * b;
  return von + (nach - von) * weich((lage - i - 0.78) / 0.22);
}

/**
 * Beiwerk vor den Möbeln. sicht ist der gezeigte Bildausschnitt
 * (nur für die Nachtabdunkelung von „Über Nacht“ nötig).
 */
export function drawRenovierungVorn(
  c: C, id: RenoMethode, p: number, t: number, w: RenoWand,
  sicht: { x: number; y: number; w: number; h: number },
) {
  if (p <= 0 || p >= 1) return;
  const breite = w.x1 - w.x0, hoehe = w.yBot - w.yTop;
  c.save();
  if (id === "fliesen") {
    maleFliesenVorn(c, w, p, t);
    if (w.handwerk) {
      const ort = fliesenArbeitsOrt(w, p);
      const hub = w.yBot - ort.y;
      if (hub > 2) leiter(c, ort.x, w.yBot, hub + 8);
    }
  } else if (id === "bahnen" && w.handwerk) {
    const a = tapezierTakt(w, p);
    c.globalAlpha = klemm(a.u / 0.12) * klemm((1 - a.u) / 0.07);
    leiter(c, a.mitte, w.yBot, Math.max(18, a.hub + 8));
    eimer(c, klemm(a.mitte - 20, w.x0 + 8, w.x1 - 8), w.yBot);
  } else if (id === "bahnen" || id === "abziehen") {
    let q = p;
    if (id === "abziehen") {
      const { ab, auf } = abziehPhase(p);
      q = auf > 0 ? auf : ab;
    }
    const n = bahnZahl(w);
    // Die Leiter steht rechts neben der Bahn, an der gearbeitet wird.
    const x = klemm(arbeitsX(w, q) + breite / n * 0.95, w.x0 + 12, w.x1 - 12);
    c.globalAlpha = klemm(p / 0.04) * klemm((1 - p) / 0.04);
    const maxL = w.leiterMax ?? 60;
    leiter(c, x, w.yBot, Math.max(18, Math.min(maxL, w.yBot - w.decke(x) - 8)));
    eimer(c, klemm(x - 20, w.x0 + 8, w.x1 - 8), w.yBot);
  } else if (id === "sterne") {
    for (let k = 0; k < 13; k++) {
      const y = w.yTop + ((k + 0.5) / 13) * hoehe + Math.sin(t * 2 + k) * 3;
      const x = wischFront(w, p, y) + (zufall(k) - 0.5) * 14;
      if (x < w.x0 - 4 || x > w.x1 + 4 || y < w.decke(klemm(x, w.x0, w.x1)) - 3) continue;
      const r = (2.4 + zufall(k + 50) * 2.8) * (0.75 + 0.25 * Math.sin(t * 6 + k * 1.7));
      c.fillStyle = "rgba(255,214,120,.95)";
      stern4(c, x, y, r);
      c.fillStyle = "#fffbe8";
      stern4(c, x, y, r * 0.45);
    }
    // Funken, die hinter dem Band verglimmen.
    for (let k = 0; k < 22; k++) {
      const y = w.yTop + zufall(k + 200) * hoehe;
      const hinten = 8 + zufall(k + 300) * 70;
      const x = wischFront(w, p, y) - hinten;
      if (x < w.x0 || x > w.x1 || y < w.decke(x)) continue;
      c.globalAlpha = (1 - hinten / 80) * (0.5 + 0.5 * Math.sin(t * 7 + k));
      c.fillStyle = "#ffe6a0";
      stern4(c, x, y, 1.5);
    }
  } else if (id === "rauten") {
    const sichtbar = Math.sqrt(Math.sin(Math.PI * p)) * 0.9;
    c.fillStyle = "#ffffff";
    for (let k = 0; k < 28; k++) {
      const x = w.x0 + zufall(k) * breite + Math.sin(t * 1.1 + k) * 5;
      const y = w.yTop + ((t * 18 * (0.6 + zufall(k + 9) * 0.8) + zufall(k + 3) * hoehe) % (hoehe + 20));
      if (x < w.x0 || x > w.x1 || y < w.decke(x) + 2 || y > w.yBot - 2) continue;
      c.globalAlpha = sichtbar * (0.6 + 0.4 * zufall(k + 40));
      c.beginPath();
      c.arc(x, y, 0.9 + zufall(k + 5) * 1.1, 0, TAU);
      c.fill();
    }
  } else if (id === "nacht") {
    c.fillStyle = `rgba(7,12,38,${Math.pow(Math.sin(Math.PI * p), 0.8) * 0.64})`;
    c.fillRect(sicht.x, sicht.y, sicht.w, sicht.h);
  }
  c.restore();
}

/* ------------------------- Hilfe für die Vorschau ---------------------- */

/**
 * Vorschau-Hilfe: Gehört ein gefülltes Rechteck zur alten Wand (wallBand)?
 *   "grund"   – die Wandfläche selbst
 *   "beiwerk" – Glanzstreifen, Sockel, Sockelkante, Bodenschatten
 * Damit lässt sich die alte Wand aus dem fertigen Hausbild herauslösen,
 * ohne die Hauszeichnung zu ändern.
 */
export function altwandTeil(
  w: RenoWand, sockel: number, x: number, y: number, b: number, h: number,
): "grund" | "beiwerk" | null {
  const breite = w.x1 - w.x0, hoehe = w.yBot - w.yTop;
  if (x === w.x0 && b === breite) {
    if (y === w.yTop && h === hoehe) return "grund";
    if (y === w.yBot - sockel && (h === sockel || h === 2)) return "beiwerk";
    if (y === w.yBot - 5 && h === 5) return "beiwerk";
  }
  if (y === w.yTop && h === hoehe && b === 9 && x >= w.x0 && x < w.x1 && (x - w.x0 - 8) % 22 === 0) return "beiwerk";
  return null;
}
