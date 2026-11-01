/* =======================================================================
   GRUSELHAUS · VAMPIR-OUTFITS DER KÖNIGIN

   Jede Nacht im Gruselhaus zieht Luni ein anderes edles Outfit an, nie
   zweimal hintereinander. Die Zeichnung (Samt, Mieder, Borten, Spitze,
   Jabot, Kragen, Umhang) erledigt luni.ts; hier stehen nur Farben und
   Details. Lunis Proportionen bleiben dabei unverändert.
   ======================================================================= */

import type { VampirStil } from "../luni";

export const VAMPIR_OUTFITS: readonly VampirStil[] = [
  {
    name: "Blutroter Samt",
    top: "#7c1022",
    bottom: "#2a0a12",
    spitze: "#0d0b10",
    korsett: { farbe: "#b9bdc9", schnur: "#eef1f6" },
  },
  { name: "Nachtschwarzer Samt", top: "#16131d", bottom: "#0e0c13", trim: "#c4c8d4" },
  {
    name: "Tiefer Violetter Samt",
    top: "#3d1a57",
    bottom: "#231130",
    umhang: { aussen: "#2e1342", futter: "#9a1a2c" },
  },
  {
    name: "Mitternacht",
    top: "#141218",
    bottom: "#0d0c11",
    kragen: "#a3162a",
    kropfband: { band: "#0b0a0e", stein: "#d11a3a" },
  },
  { name: "Blutmond", top: "#6c0d1c", bottom: "#1c070c", spitze: "#0d0b10", glanz: true },
  { name: "Gräfin", top: "#4b2468", bottom: "#141118", korsett: { farbe: "#3a1b52", schnur: "#d8dce6" } },
  {
    name: "Nachtschatten",
    top: "#121016",
    bottom: "#0b0a0e",
    umhang: { aussen: "#0f0d13", futter: "#8f1527" },
  },
  { name: "Silberfrost", top: "#3a3e46", bottom: "#24272d", jabot: "#ece8df", trim: "#b8bcc8", glanz: true },
];

/** Nächstes Outfit: zufällig, aber nie dasselbe wie in der letzten Nacht. */
export function naechstesOutfit(letztes: number, zufall: () => number = Math.random): number {
  const n = VAMPIR_OUTFITS.length;
  if (letztes < 0 || letztes >= n) return Math.min(n - 1, Math.floor(zufall() * n));
  let i = Math.min(n - 2, Math.floor(zufall() * (n - 1)));
  if (i >= letztes) i += 1;
  return i;
}
