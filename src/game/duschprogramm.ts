/* =======================================================================
   DUSCHPROGRAMM – was Luni unter der Dusche gerade tut

   Statt nur unter dem Wasser zu stehen, wechselt Luni durch echte
   Bewegungen: Haare einseifen, Kopf in den Nacken und ausspülen, Wasser aus
   dem Gesicht wischen, Haare nach hinten streifen, Arme, Körper und Beine
   einseifen und alles abwaschen. Jede Duschphase (nass werden, Haare,
   Körper, Abspülen) teilt ihre Zeit auf diese Bewegungen auf; zwischen zwei
   Bewegungen gibt es einen weichen Übergang. Die Codes sind die Phasen des
   Zustands „wash“ in luni.ts.
   ======================================================================= */

export const DUSCH_CODES = {
  haare: .5, koerper: 1.5, kopfAbspuelen: 2.5, beine: 3.5, armLinks: 4.5, armRechts: 5.5,
  nacken: 6.5, gesicht: 7.5, streifen: 8.5, abspuelen: 9.5,
} as const;
export type DuschTat = keyof typeof DUSCH_CODES;
/** Bei diesen Bewegungen sind die Augen zu (Wasser im Gesicht). */
export const AUGEN_ZU: ReadonlySet<number> = new Set([
  DUSCH_CODES.kopfAbspuelen, DUSCH_CODES.nacken, DUSCH_CODES.gesicht, DUSCH_CODES.streifen, DUSCH_CODES.abspuelen,
]);

type Programm = readonly (readonly [DuschTat, number])[];
/** Bewegung und ihr Anteil an der Phase. */
const LANG: Record<string, Programm> = {
  nasswerden: [["nacken", 4], ["gesicht", 2], ["streifen", 3]],
  washHair: [["haare", 6], ["kopfAbspuelen", 2], ["gesicht", 1], ["streifen", 1.5], ["haare", 3], ["nacken", 2], ["streifen", 1]],
  washBody: [["armLinks", 2], ["armRechts", 2], ["koerper", 3], ["beine", 3]],
  rinse: [["abspuelen", 4], ["nacken", 2], ["gesicht", 1.5], ["streifen", 2]],
};
/** Kurze Probe: dieselben Bewegungen, nur weniger Wiederholungen. */
const KURZ: Record<string, Programm> = {
  nasswerden: [["nacken", 1], ["gesicht", 1]],
  washHair: [["haare", 3], ["kopfAbspuelen", 1], ["streifen", 1]],
  washBody: [["armLinks", 1], ["armRechts", 1], ["koerper", 1], ["beine", 1.2]],
  rinse: [["abspuelen", 1.5], ["gesicht", 1], ["streifen", 1]],
};
const VORHER: Record<string, string> = { washHair: "nasswerden", washBody: "washHair", rinse: "washBody" };
/** Ab dieser Phasenlänge (Sekunden) gilt das ausführliche Programm. */
const LANG_AB = 12;

export interface DuschBild { tat: DuschTat; code: number; von: number | null; k: number }

export function duschBild(phase: string, t: number, dauer: number): DuschBild | null {
  const tabelle = dauer < LANG_AB ? KURZ : LANG;
  const liste = tabelle[phase];
  if (!liste || dauer <= 0) return null;
  const summe = liste.reduce((s, [, w]) => s + w, 0);
  let rest = Math.max(0, Math.min(t, dauer)) / dauer * summe, i = 0;
  while (i < liste.length - 1 && rest >= liste[i][1]) rest -= liste[i++][1];
  const [tat, anteil] = liste[i];
  const sekunden = anteil / summe * dauer, drin = rest / summe * dauer;
  const vorgaenger = i > 0 ? liste[i - 1][0] : tabelle[VORHER[phase]]?.at(-1)?.[0] ?? null;
  const ueber = Math.min(.7, sekunden * .3);
  const k = vorgaenger && drin < ueber ? drin / ueber : 1;
  return { tat, code: DUSCH_CODES[tat], von: vorgaenger && k < 1 ? DUSCH_CODES[vorgaenger] : null, k };
}
