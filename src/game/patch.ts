/* =======================================================================
   Patch-Dateien der aktuellen Sitzung (Inhalt der UFO-Station)

   Dieses Modul wird von tools/ufo-bauen.mjs erzeugt. Das UFO oben rechts
   bietet LCL-Tanz-Arme-30.zip an – darin liegen aktuell.patch und aktuell.json.

   Namensmuster: LCL-<Kurzname>-<zweistellige laufende Nummer>.zip
   Die Nummer erhöht sich bei jedem Vorschau-Bau um 1.

   Anwendung:  Archiv entpacken, dann
                git apply aktuell.patch
                ./node_modules/.bin/tsc --noEmit && npm run build
   ======================================================================= */

export interface PatchDatei {
  name: string;
  /** Klartext der Datei im Archiv. */
  inhalt: string;
}

export const PATCH_KURZ = "Tanz-Arme";
export const PATCH_NUMMER = 30;
export const PATCH_ZIP =
  `LCL-${PATCH_KURZ}-${String(PATCH_NUMMER).padStart(2, "0")}.zip`;

/** Zeilen im UFO-Menü. */
export const PATCH_EINTRAEGE: readonly string[] = [PATCH_ZIP];

export const PATCH_DATEIEN: readonly PatchDatei[] = [
  {
    name: "aktuell.patch",
    inhalt: "",
  },
  {
    name: "aktuell.json",
    inhalt: "",
  },
];
