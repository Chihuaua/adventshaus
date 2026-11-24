/** Alle Dauern in echten Sekunden. Laufwege kommen mit Lunis normalem Gehtempo dazu. */
export const ABEND_ZIEL = (21 * 60 + 15) * 60;
export const ABEND_EINSCHLAFEN = 1.4;
export const ABEND_SPANNEN = {
  dusche: [300, 360, 480], zaehne: [60, 90, 120], haare: [60, 80, 80],
  video: [300, 480, 720], anruf: [1200, 3300, 7200],
} as const;
export type AbendWerte = Record<keyof typeof ABEND_SPANNEN, number>;
export type AbendDatum = { year: number; month: number; day: number };

export function abendTag(d: AbendDatum) { return d.year * 10000 + d.month * 100 + d.day; }
export function tagessekunde(d: { hour: number; min: number; sec?: number }) {
  return d.hour * 3600 + d.min * 60 + (d.sec ?? 0);
}

export function abendWerte(zufall: () => number): AbendWerte {
  const wert = (s: readonly [number, number, number]) => {
    const u = 2 * zufall() - 1;
    return Math.round(s[1] + u * Math.abs(u) * (u < 0 ? s[1] - s[0] : s[2] - s[1]));
  };
  return { dusche: wert(ABEND_SPANNEN.dusche), zaehne: wert(ABEND_SPANNEN.zaehne),
    haare: wert(ABEND_SPANNEN.haare), video: wert(ABEND_SPANNEN.video), anruf: wert(ABEND_SPANNEN.anruf) };
}

export const ABEND_RICHTWERTE = abendWerte(() => .5);

/** Kurze Probe über den Bett-Stein: Videos und Telefonat dauern nur Sekunden. */
export const PROBE_WERTE: AbendWerte = { dusche: 10, zaehne: 8.4, haare: 7, video: 6.8, anruf: 9 };

export const ZAHN_TAKTE = {
  zNehmen: 4, zTube: 4, zPaste: 6, zTubeZurueck: 4, zPutzen: ABEND_RICHTWERTE.zaehne,
  zGurgeln: 8, zSpucken: 2, zHahnAuf: 2, zWaschen: 6.5, zHahnZu: 2, zZurueck: 4.5,
} as const;

export function gueltigeAbendwerte(w: AbendWerte | undefined): w is AbendWerte {
  return !!w && (Object.keys(ABEND_SPANNEN) as (keyof AbendWerte)[]).every(k =>
    Number.isFinite(w[k]) && w[k] >= ABEND_SPANNEN[k][0] && w[k] <= ABEND_SPANNEN[k][2]);
}

/** Pro Berliner Kalendertag und Welt genau dieselbe Ziehung, auch nach dem Neuladen. */
export function tageswerte(tag: number, welt: string): AbendWerte {
  let saat = (Math.imul(tag, 2654435761) ^ (welt === "weihnacht" ? 0x1f738531 : 0x63baed37)) >>> 0;
  return abendWerte(() => {
    saat = (Math.imul(saat, 1664525) + 1013904223) >>> 0;
    return saat / 4294967296;
  });
}

export const ABEND_BETT = {
  umschlagen: 5.5, setzen: 4.5, fuesse: 4.5, greifen: 3.5, hinlegen: 3,
  abnehmen: 2.75, wurf: 1.25, holen: 1.5, unterschieben: 3,
} as const;

export function abendTakte(w: AbendWerte) {
  const waschen = w.dusche - 4.5;
  return {
    // Vorbereitung am Schrank und Brille ablegen: 60 s.
    openWardrobe: 2, waescheRichten: 34, undress: 8.5, wrap: 9.5, closeWardrobe: 2, glassesOff: 2.8, tossGlasses: 1.2,
    closeCurtain: 1.3, towelOff: 1.1, throwTowel: .9, waterOn: 1.2,
    nasswerden: waschen / 8, washHair: waschen / 3, washBody: waschen * 7 / 24, rinse: waschen / 4,
    waterOff: 1, takeTowel: 2, abtrocknen: 27, wrapOn: 4, openCurtain: 2, gPick: 4,
    // Von 45 % beim Öffnen bis 70 % beim Schließen: 9 s sichtbarer und hörbarer Wasserfluss.
    cOpen: 2, ...ZAHN_TAKTE, zPutzen: w.zaehne,
    bTake: 1.5, bBend: 1.5, bBrush: w.haare - 8, bUp: 1.5, bPut: 1.5, kClose: 2,
    bedOpen: 1, bedPants: 3.5, bedPajama: 4.5, bedClose: 1,
  } as const;
}

export function abendplan(tag: number, welt: string, werte = tageswerte(tag, welt)) {
  return { tag, werte, takte: abendTakte(werte) };
}
export type Abendplan = ReturnType<typeof abendplan>;

/** Kleine, weltgetrennte Momentaufnahme. Keine Browser-Timer oder Renderobjekte im Speicherstand. */
export interface AbendFortschritt {
  tag: number; werte: AbendWerte; standMs: number; phase: string; sek: number;
  outfit: "dressed" | "towel" | "none"; vorhang: number; schrank: number; spiegel: number;
  nass: number; dampf: number; wasser: boolean; tuchAufStange: boolean; haarbuerste: boolean;
  brilleAn: boolean; brilleHand: boolean; becken: boolean;
  flug: { t: number; x0: number; y0: number } | null;
}