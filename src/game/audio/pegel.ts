/**
 * Abgleich der vollstaendigen Stuecke mit dem unveraenderten Klavier.
 * Gemessen hinter Synthese, Filtern und gemeinsamem Master: gewichteter
 * Aktivpegel in 400-ms-Fenstern. Klangfarbe und Anschlag bleiben unveraendert.
 */
export const MUSIK_PEGEL = {
  klavier: 0.7,
  saxophon: 4.738,
  gesang: 1.354,
  platten: 2.007,
} as const;