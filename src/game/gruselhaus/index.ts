/* =======================================================================
   GRUSELHAUS – welche Räume schon umgestaltet sind

   Das Gruselhaus beginnt als unveränderte Kopie des normalen Hauses. Jeder
   Raum bekommt ein eigenes Modul und wird hier eingeschaltet, sobald er
   beauftragt und fertig ist. Alle Räume, die hier auf false stehen, zeigen
   weiterhin das normale Haus. Das normale Haus und das Traumhaus kennen
   dieses Modul nicht und bleiben unberührt.
   ======================================================================= */

export interface GruselRaeume {
  /** Raum 01 · Zockerzimmer -> Horror-Raumstation (Dachgeschoss links) */
  raumstation: boolean;
  /** Raum 02 · Musikzimmer (Dachgeschoss rechts) */
  musikzimmer: boolean;
  /** Raum 03 · Schlafzimmer -> Schlafstätte der Vampirkönigin (1. Stock links) */
  schlafzimmer: boolean;
}

export const GRUSELRAEUME: GruselRaeume = {
  raumstation: true,
  musikzimmer: true,
  schlafzimmer: true,
};

export { RaumstationFx } from "./raumstation";
