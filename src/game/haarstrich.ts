/** Alle drei Wege sind relativ zum herabhängenden Haar; Hüfte, Rücken und Füße bleiben unverändert. */
const ZUEGE = [
  { art: "Laengen", anzahl: 13, zug: 1.10, ansatz: 3, ende: 13, versatz: 0, schraeg: 0, winkel: 0 },
  { art: "Spitzen", anzahl: 19, zug: .82, ansatz: 9, ende: 15.5, versatz: -.8, schraeg: .8, winkel: -.20 },
  { art: "Seitenstraehne", anzahl: 12, zug: 1.42, ansatz: 1.8, ende: 12, versatz: -2.5, schraeg: 3.9, winkel: .28 },
] as const;
const ZYKLUS = ZUEGE.reduce((s, z) => s + z.anzahl * z.zug, 0);
const weich = (n: number) => { const p = Math.max(0, Math.min(1, n)); return p * p * (3 - 2 * p); };

export function haarstrich(sekunden: number) {
  let t = Math.max(0, sekunden) % ZYKLUS;
  let block: typeof ZUEGE[number] = ZUEGE[0];
  for (const z of ZUEGE) {
    block = z;
    if (t < z.anzahl * z.zug) break;
    t -= z.anzahl * z.zug;
  }
  const k = (t / block.zug) % 1;
  const ab = k < .72 ? weich(k / .72) : 1 - weich((k - .72) / .28);
  const abheben = k < .72 ? 0 : Math.sin(Math.PI * (k - .72) / .28) ** 2;
  const wechsel = weich(t / 1.1) * weich((block.anzahl * block.zug - t) / 1.1);
  return { art: block.art,
    laengs: 3 + wechsel * (block.ansatz - 3) + ab * (block.ende - block.ansatz),
    quer: 7.5 + wechsel * (block.versatz + block.schraeg * ab) + 2.7 * abheben,
    winkel: wechsel * block.winkel * (.45 + .55 * ab) + .09 * abheben };
}