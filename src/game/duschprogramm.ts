/* =======================================================================
   DUSCHPROGRAMM – was Luni unter der Dusche gerade tut

   Von oben nach unten, wie man wirklich duscht:
     nass werden  → Kopf in den Nacken, Wasser aus dem Gesicht, Haare
                    nach hinten streifen, dann das Wasser abdrehen.
     Haare        → Shampoo von der Ablage greifen, auf die Hand geben,
                    Flasche zurückstellen, Haare einschäumen (vorne,
                    hinten, seitlich), Wasser an, ausspülen, Wasser aus.
     Körper       → Duschgel holen, auftragen, zurückstellen, Arme
                    (mal nach vorn, mal nach oben), Körper, Knie anheben
                    und Beine einseifen, vorgebeugt die Unterschenkel.
     Abspülen     → Wasser an, Arme hoch, Körper und Beine abspülen,
                    Kopf in den Nacken, Gesicht, Haare streifen.

   Jede Bewegung ist ein Baustein mit eigener natürlichen Länge und genau
   drei Strichen. Längere Echtzeit-Duschen bekommen weitere Durchgänge mit
   wechselnden Varianten, nie dieselbe Bewegung zweimal hintereinander.
   Der Code einer Bewegung ist ganzzahlig, der Nachkommaanteil ist der
   Fortschritt (0..1) innerhalb des Bausteins.
   ======================================================================= */

export const DUSCH_CODES = {
  haare: 0, koerper: 1, kopfAbspuelen: 2, beine: 3, armLinks: 4, armRechts: 5,
  nacken: 6, gesicht: 7, streifen: 8, abspuelen: 9,
  greifen: 10, auftragen: 11, abstellen: 12, knieNah: 13, hahn: 14, armeHoch: 15,
  armLinksHoch: 16, armRechtsHoch: 17, knieFern: 18, haareHinten: 19, haareSeiten: 20,
} as const;
export type DuschTat = keyof typeof DUSCH_CODES;

/** Beschriftungen für das Studio (jede Bewegung einzeln abspielbar). */
export const DUSCH_TATEN: readonly { tat: DuschTat; label: string }[] = [
  { tat: "nacken", label: "Kopf in den Nacken" },
  { tat: "gesicht", label: "Wasser aus dem Gesicht" },
  { tat: "streifen", label: "Haare nach hinten" },
  { tat: "hahn", label: "Wasser auf/zu" },
  { tat: "greifen", label: "Flasche greifen" },
  { tat: "auftragen", label: "Auf die Hand geben" },
  { tat: "abstellen", label: "Flasche zurück" },
  { tat: "haare", label: "Haare oben" },
  { tat: "haareHinten", label: "Haare hinten" },
  { tat: "haareSeiten", label: "Haare seitlich" },
  { tat: "kopfAbspuelen", label: "Haare ausspülen" },
  { tat: "armLinks", label: "Arm links vorn" },
  { tat: "armRechts", label: "Arm rechts vorn" },
  { tat: "armLinksHoch", label: "Arm links hoch" },
  { tat: "armRechtsHoch", label: "Arm rechts hoch" },
  { tat: "koerper", label: "Körper einseifen" },
  { tat: "knieNah", label: "Knie heben (vorn)" },
  { tat: "knieFern", label: "Knie heben (hinten)" },
  { tat: "beine", label: "Vorgebeugt: Beine" },
  { tat: "armeHoch", label: "Arme hoch abspülen" },
  { tat: "abspuelen", label: "Körper abspülen" },
];

/** Bei diesen Bewegungen sind die Augen zu (Wasser oder Schaum im Gesicht). */
export const AUGEN_ZU: ReadonlySet<number> = new Set([
  DUSCH_CODES.kopfAbspuelen, DUSCH_CODES.nacken, DUSCH_CODES.gesicht, DUSCH_CODES.streifen,
  DUSCH_CODES.abspuelen, DUSCH_CODES.armeHoch,
]);
/** Augen zu für einen Phasenwert mit Fortschritt (Code + 0..1). */
export const augenZu = (phase: number) => AUGEN_ZU.has(Math.floor(phase));

/** Baustein: Bewegung und natürliche Länge in Sekunden. */
type Baustein = readonly [DuschTat, number];
interface Folge {
  /** Wasser beim Betreten der Phase. */
  wasser: boolean;
  /** Welche Flasche in dieser Phase geholt wird. */
  flasche: "shampoo" | "gel" | null;
  vor: readonly Baustein[];
  /** Durchgänge im Wechsel; der erste gehört immer dazu. */
  kern: readonly (readonly Baustein[])[];
  nach: readonly Baustein[];
}

const FOLGEN: Record<string, Folge> = {
  nasswerden: {
    wasser: true, flasche: null,
    vor: [["nacken", 3.2], ["gesicht", 2.6], ["streifen", 2.6]],
    kern: [[], [["armeHoch", 3.2], ["nacken", 3], ["gesicht", 2.6], ["streifen", 2.6]]],
    nach: [["hahn", 1.6]],
  },
  washHair: {
    wasser: false, flasche: "shampoo",
    vor: [["greifen", 2.2], ["auftragen", 2.2], ["abstellen", 2.2]],
    kern: [
      [["haare", 3.8], ["haareHinten", 3.8], ["haareSeiten", 3.4]],
      [["haareHinten", 3.6], ["haare", 3.6], ["gesicht", 2.4], ["haareSeiten", 3.4]],
    ],
    nach: [["hahn", 1.6], ["kopfAbspuelen", 3.6], ["streifen", 2.6], ["gesicht", 2.4], ["hahn", 1.6]],
  },
  washBody: {
    wasser: false, flasche: "gel",
    vor: [["greifen", 2.2], ["auftragen", 2.2], ["abstellen", 2.2]],
    kern: [
      [["armLinks", 3.2], ["armRechts", 3.2], ["koerper", 3.6], ["knieNah", 3.6], ["knieFern", 3.6]],
      [["armLinksHoch", 3.2], ["armRechtsHoch", 3.2], ["koerper", 3.4], ["beine", 3.8]],
    ],
    nach: [],
  },
  rinse: {
    wasser: false, flasche: null,
    vor: [["hahn", 1.6]],
    kern: [
      [["armeHoch", 3.2], ["abspuelen", 3.6], ["beine", 3.6]],
      [["nacken", 3], ["abspuelen", 3.4], ["armeHoch", 3], ["beine", 3.4]],
    ],
    nach: [["nacken", 3], ["gesicht", 2.6], ["streifen", 2.6]],
  },
};

/** Kurze Probe: ein Durchgang, etwas zügiger als natürlich. */
const PROBE_TEMPO = 0.7;
const summe = (l: readonly Baustein[]) => l.reduce((s, [, d]) => s + d, 0);

/** Länge der kurzen Probe je Phase (ein Durchgang, Probe-Tempo). */
export function duschProbeDauer(phase: string): number | undefined {
  const f = FOLGEN[phase];
  if (!f) return undefined;
  return Math.round(summe([...f.vor, ...f.kern[0], ...f.nach]) * PROBE_TEMPO * 10) / 10;
}

/** Ablauf einer Phase für die gewünschte Gesamtdauer (Cache je Phase und Dauer). */
const ablaufCache = new Map<string, { liste: Baustein[]; faktor: number }>();
function ablauf(phase: string, dauer: number) {
  const schluessel = `${phase}|${dauer.toFixed(3)}`;
  const da = ablaufCache.get(schluessel);
  if (da) return da;
  const f = FOLGEN[phase];
  const liste: Baustein[] = [...f.vor, ...f.kern[0]];
  let i = 1;
  // Weitere Durchgänge, solange die Echtzeit-Dusche es hergibt.
  while (f.kern.length > 1 && summe([...liste, ...f.nach]) + summe(f.kern[i % f.kern.length]) * 0.5 < dauer && i < 400) {
    liste.push(...f.kern[i % f.kern.length]);
    i++;
  }
  liste.push(...f.nach);
  const erg = { liste, faktor: dauer / summe(liste) };
  if (ablaufCache.size > 64) ablaufCache.clear();
  ablaufCache.set(schluessel, erg);
  return erg;
}

export interface DuschBild {
  tat: DuschTat;
  /** Code + Fortschritt 0..1 innerhalb des Bausteins. */
  code: number;
  /** Vorherige Haltung (Ende des letzten Bausteins) für den weichen Übergang. */
  von: number | null;
  k: number;
  /** Läuft das Wasser gerade? */
  wasser: boolean;
  /** Flasche dieser Phase und ob Luni sie gerade in der Hand hält. */
  flasche: "shampoo" | "gel" | null;
  flascheInHand: boolean;
}

/** Ende der vorigen Phase, damit der Übergang zwischen zwei Phasen weich bleibt. */
const VORHER: Record<string, string> = { washHair: "nasswerden", washBody: "washHair", rinse: "washBody" };

export function duschBild(phase: string, t: number, dauer: number): DuschBild | null {
  const f = FOLGEN[phase];
  if (!f || dauer <= 0) return null;
  const { liste, faktor } = ablauf(phase, dauer);
  let rest = Math.max(0, Math.min(t, dauer - 1e-6)) / faktor;
  let wasser = f.wasser, i = 0;
  while (i < liste.length - 1 && rest >= liste[i][1]) {
    if (liste[i][0] === "hahn") wasser = !wasser;
    rest -= liste[i++][1];
  }
  const [tat, natuerlich] = liste[i];
  const p = Math.min(0.999, rest / natuerlich);
  if (tat === "hahn" && p >= 0.5) wasser = !wasser;
  // Übergang: das Ende des vorigen Bausteins blendet weich in den neuen über.
  const vorgaenger = i > 0 ? liste[i - 1][0] : (() => {
    const v = VORHER[phase] ? FOLGEN[VORHER[phase]] : null;
    return v ? (v.nach.at(-1) ?? v.kern[0].at(-1) ?? v.vor.at(-1))?.[0] ?? null : null;
  })();
  const sekunden = natuerlich * faktor, drin = rest * faktor;
  // Weiter Weg (z. B. vom Knie über den Kopf): etwas längerer, ruhiger Übergang.
  const ueber = Math.min(1.1, sekunden * 0.34);
  const k = vorgaenger && drin < ueber ? drin / ueber : 1;
  const inHand = f.flasche !== null && (
    (tat === "greifen" && p >= 0.5) || tat === "auftragen" || (tat === "abstellen" && p < 0.5));
  return {
    tat,
    code: DUSCH_CODES[tat] + p,
    von: vorgaenger && k < 1 ? DUSCH_CODES[vorgaenger] + 0.999 : null,
    k,
    wasser,
    flasche: f.flasche,
    flascheInHand: inHand,
  };
}

/** Steht die Flasche gerade auf der Ablage? (nicht in der Hand während dieser Phase) */
export function flascheAufAblage(phase: string | null, bild: DuschBild | null, welche: "shampoo" | "gel"): boolean {
  if (!phase || !bild) return true;
  return !(bild.flasche === welche && bild.flascheInHand);
}
