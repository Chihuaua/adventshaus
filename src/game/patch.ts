/* =======================================================================
   Patch-Dateien der aktuellen Sitzung (Inhalt der UFO-/Schlitten-Station)

   Dieses Modul wird von tools/ufo-bauen.mjs erzeugt. Das Menü oben rechts
   bietet LCL-NMS-87.zip, die TXT-Datei und die Code-Vorschau an.
   ======================================================================= */

export interface PatchDatei {
  name: string;
  /** Klartext der Datei im Archiv. */
  inhalt: string;
}

export const PATCH_KURZ = "NMS";
export const PATCH_NUMMER = 87;
export const PATCH_ZIP =
  `LCL-${PATCH_KURZ}-${String(PATCH_NUMMER).padStart(2, "0")}.zip`;
export const PATCH_TXT =
  `LCL-${PATCH_KURZ}-${String(PATCH_NUMMER).padStart(2, "0")}.txt`;
export const PATCH_VORSCHAU = "Patch-Code anzeigen / kopieren";

/** Zeilen im UFO-/Weihnachtsschlitten-Menü. */
export const PATCH_EINTRAEGE: readonly string[] = [PATCH_ZIP, PATCH_TXT, PATCH_VORSCHAU];

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
