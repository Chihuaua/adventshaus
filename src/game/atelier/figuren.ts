import { zeichneBriefkurier } from "./briefkurier";
import { zeichneNeonweihnachtsmann } from "./neonweihnachtsmann";
import { zeichneFrostschneemann } from "./frostschneemann";
import { zeichneAtelierHund } from "./hundefell";
import type { Pose, Punkt, Zeichner } from "./stift";

export type FigurId = "briefkurier" | "weihnachtsmann" | "schneemann" | "odin" | "apollo";
export type Auswahl = FigurId | "gruppe";
export interface Entwurf {
  name: string; beschreibung: string; hoehe: number; breite: number;
  kopf: Punkt; kopfBreite: number; posen: [Pose, string][]; zeichnen: Zeichner;
}
export const FIGUREN: Record<FigurId, Entwurf> = {
  briefkurier: {
    name: "Postboten-Frosch", beschreibung: "Ein menschlicher Kurier mit froschartigen Gesichtszügen, Cargohose und geschnürten Arbeitsstiefeln.",
    hoehe: 86, breite: 51, kopf: [0, -65.8], kopfBreite: 37,
    posen: [["ruhe", "Stehen"], ["gang", "Gehen"], ["aktion", "Brief überreichen"]], zeichnen: zeichneBriefkurier,
  },
  weihnachtsmann: {
    name: "Weihnachtsmann", beschreibung: "Der Weihnachtsmann der Neonstadt trägt eine Leselinse, einen gegliederten Kupferarm und Geschenke auf dem Rücken.",
    hoehe: 99, breite: 65, kopf: [-2, -69], kopfBreite: 51,
    posen: [["ruhe", "Stehen"], ["gang", "Gehen"], ["aktion", "Winken"]], zeichnen: zeichneNeonweihnachtsmann,
  },
  schneemann: {
    name: "Schneemann", beschreibung: "Drei Schneekugeln auf Kufen, ein geflickter Lichtschal und ein kupfernes Kühlregister für die Nacht in der Stadt.",
    hoehe: 94, breite: 66, kopf: [0, -66.5], kopfBreite: 49,
    posen: [["ruhe", "Stehen"], ["gang", "Gleiten"], ["aktion", "Winken"]], zeichnen: zeichneFrostschneemann,
  },
  odin: {
    name: "Odin", beschreibung: "Derselbe kräftige Staffordshire-Körper wie bei Apollo, mit etwas schmalerem Kopf und Fang und warm schimmerndem schwarzem Fell.",
    hoehe: 32, breite: 48, kopf: [13.6, -24.2], kopfBreite: 14,
    posen: [["ruhe", "Stehen"], ["gang", "Traben"], ["aktion", "Wittern"], ["sitzen", "Sitzen"]],
    zeichnen: (c, bild) => zeichneAtelierHund(c, "odin", bild),
  },
  apollo: {
    name: "Apollo", beschreibung: "Breite Staffordshire-Brust und kräftige Läufe. Wie im Haus: schwarzer Kopf und Fang, weißes Brustfeld und braun gestromte schwarze Pfoten.",
    hoehe: 32, breite: 48, kopf: [13.8, -24.2], kopfBreite: 15,
    posen: [["ruhe", "Stehen"], ["gang", "Gehen"], ["aktion", "Aufhorchen"], ["sitzen", "Sitzen"]],
    zeichnen: (c, bild) => zeichneAtelierHund(c, "apollo", bild),
  },
};
export const REIHENFOLGE: readonly FigurId[] = ["briefkurier", "weihnachtsmann", "schneemann", "odin", "apollo"];
export const STUDIO_HASH = (id: Auswahl) => id === "gruppe" ? "#studio-figurenatelier" : `#studio-atelier-${id}`;
export function atelierAusHash(hash: string): Auswahl | null {
  if (hash === STUDIO_HASH("gruppe")) return "gruppe";
  return REIHENFOLGE.find(id => STUDIO_HASH(id) === hash) ?? null;
}