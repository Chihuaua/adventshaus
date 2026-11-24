/* =======================================================================
   HAARE BÜRSTEN – Wege der Bürste am herabhängenden Haar

   Luni bürstet mal vorne, dann hinten, dann in der Mitte, und das in
   wechselndem Tempo. Hüfte, Rücken, Füße und die zweite Hand bleiben, wo
   sie sind; nur die Bürstenhand ändert Weg und Geschwindigkeit. Höchstens
   einmal pro Bürstengang bleibt die Bürste kurz im Haar hängen.

   „laengs“ läuft an den Strähnen entlang (klein = am Scheitel, groß = an den
   Spitzen), „quer“ über den Haarvorhang (klein = vorne, groß = hinten im
   Nacken). Reine Rechnung, ohne Zufall zur Laufzeit: Derselbe Bürstengang
   ergibt immer dieselben Striche.
   ======================================================================= */

export type Buerstbereich = "vorne" | "hinten" | "mitte";

const BEREICH: Record<Buerstbereich, { quer: number; ende: number; winkel: number }> = {
  vorne: { quer: 4.6, ende: 13, winkel: -.14 },
  hinten: { quer: 10.3, ende: 12, winkel: .2 },
  mitte: { quer: 7.5, ende: 13.6, winkel: 0 },
};
const ANSATZ = 3;
/** Bereich, Anzahl der Striche, Sekunden je Strich (das Tempo). */
type Abschnitt = readonly [Buerstbereich, number, number];
const LANG: readonly Abschnitt[] = [
  ["vorne", 7, 1.1], ["hinten", 6, 1.45], ["mitte", 9, .82], ["vorne", 8, .9], ["hinten", 7, 1.2], ["mitte", 6, 1.5],
];
/** Kurze Probe: einmal vorne, hinten und in der Mitte. */
const KURZ: readonly Abschnitt[] = [["vorne", 2, 1.05], ["hinten", 2, 1.15], ["mitte", 2, 1.1]];
/** So lange bleibt die Bürste hängen, bevor sie sich löst. */
export const HAENGER_SEK = .9;
const WECHSEL = .9;
const weich = (n: number) => { const p = Math.max(0, Math.min(1, n)); return p * p * (3 - 2 * p); };

/** Fester Zufall in [0, 1) aus einer Zahl. */
function zufall(n: number): number {
  let h = Math.imul(Math.floor(n) ^ 0x5bd1e995, 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 15), 0x297a2d39);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Bleibt die Bürste in diesem Gang hängen, und ab welcher Sekunde? (in sechs von zehn Gängen, etwa in der Mitte) */
export function buerstHaenger(dauer: number, saat: number): number | null {
  if (zufall(saat * 7 + 3) >= .6) return null;
  return dauer * (.35 + .3 * zufall(saat * 7 + 5));
}

export function haarstrich(sekunden: number, dauer = 60, saat = 0) {
  const folge = dauer <= 12 ? KURZ : LANG;
  const haengerAb = buerstHaenger(dauer, saat);
  let haengerFrei = haengerAb !== null;
  const t = Math.max(0, sekunden);
  let beginn = 0, vorher: Buerstbereich = folge[folge.length - 1][0];
  for (let i = 0; i < 400; i++) {
    const [bereich, anzahl, zug] = folge[i % folge.length];
    const abschnitt = beginn;
    for (let s = 0; s < anzahl; s++) {
      const haengt = haengerFrei && haengerAb !== null && beginn >= haengerAb;
      const laenge = zug + (haengt ? HAENGER_SEK : 0);
      if (t < beginn + laenge || i === 399) {
        const tau = t - beginn;
        let k: number, zupfen = 0, imHaenger = false;
        if (haengt && tau >= .3 * zug && tau < .3 * zug + HAENGER_SEK) {
          // Hängengeblieben: der Strich stockt, zwei, drei kleine Rucke lösen die Bürste.
          const h = tau - .3 * zug;
          k = .3;
          zupfen = Math.sin(2 * Math.PI * 3.4 * h) * Math.sin(Math.PI * h / HAENGER_SEK);
          imHaenger = true;
        } else k = (haengt && tau >= .3 * zug ? tau - HAENGER_SEK : tau) / zug;
        const ab = k < .66 ? weich(k / .66) : 1 - weich((k - .66) / .34);
        const abheben = k < .66 ? 0 : Math.sin(Math.PI * (k - .66) / .34) ** 2;
        const w = weich((t - abschnitt) / WECHSEL);
        const a = BEREICH[vorher], b = BEREICH[bereich];
        const quer = a.quer + (b.quer - a.quer) * w, ende = a.ende + (b.ende - a.ende) * w;
        return {
          art: bereich,
          laengs: ANSATZ + ab * (ende - ANSATZ) - .45 * zupfen,
          quer: quer + 2.7 * abheben,
          winkel: a.winkel + (b.winkel - a.winkel) * w + .09 * abheben + .12 * zupfen,
          haengt: imHaenger,
          zug,
        };
      }
      if (haengt) haengerFrei = false;
      beginn += laenge;
    }
    vorher = bereich;
  }
  return { art: "mitte" as Buerstbereich, laengs: ANSATZ, quer: BEREICH.mitte.quer, winkel: 0, haengt: false, zug: 1 };
}
