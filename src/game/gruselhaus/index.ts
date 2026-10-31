/* =======================================================================
   GRUSELHAUS – welche Räume schon umgestaltet sind

   Das Gruselhaus beginnt als unveränderte Kopie des normalen Hauses. Jeder
   Raum bekommt ein eigenes Modul und wird hier eingeschaltet, sobald er
   beauftragt und fertig ist. Alle Räume, die hier auf false stehen, zeigen
   weiterhin das normale Haus. Das normale Haus und das Horrorhaus kennen
   dieses Modul nicht und bleiben unberührt.
   ======================================================================= */

export interface GruselRaeume {
  /** Raum 01 · Zockerzimmer -> Horror-Raumstation (Dachgeschoss links) */
  raumstation: boolean;
  /** Raum 02 · Musikzimmer -> Orchester der vergessenen Geister (Dachgeschoss rechts) */
  orchester: boolean;
}

export const GRUSELRAEUME: GruselRaeume = {
  raumstation: true,
  orchester: true,
};

export { RaumstationFx } from "./raumstation";
