#!/usr/bin/env node
// ============================================================
//  Adventshaus · UFO-/Schlitten-Inhalt erzeugen
//
//  Schreibt src/game/patch.ts sowie aktuell.patch.txt (ungetrackt):
//    aktuell.patch  – vollständiger Patch gegen origin/main
//                     (erste Zeile beginnt mit "diff --git")
//    aktuell.json   – {"datei":"aktuell.patch","sha256":"…","titel":"…","basis":"…"}
//                     sha256 = erste 16 Hex-Zeichen von SHA-256(aktuell.patch)
//                     basis  = 7-stelliger Kurz-Hash von origin/main
// ============================================================
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ziel = path.resolve("src/game/patch.ts");
const txtZiel = path.resolve("aktuell.patch.txt");
const original = existsSync(ziel) ? readFileSync(ziel, "utf8") : null;

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
}

/** SHA-256 als Kleinbuchstaben-Hex (64 Zeichen). */
function sha256Voll(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Kurzname und laufende Nummer aus dem letzten Stand lesen. */
function letzterStand(text) {
  if (!text) return { kurz: null, nummer: null };
  const k = text.match(/export const PATCH_KURZ = "([^"]*)"/);
  const n = text.match(/export const PATCH_NUMMER = (\d+)/);
  return { kurz: k ? k[1] : null, nummer: n ? Number(n[1]) : null };
}

const vorher = letzterStand(original);
const kurz = (process.argv[2] || vorher.kurz || "fix")
  .replace(/[^A-Za-z0-9-]/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "") || "fix";
const naechsteNummer = vorher.nummer === null ? 22 : vorher.nummer + 1;

function kopf(nummer, name) {
  return [
    "/* =======================================================================",
    "   Patch-Dateien der aktuellen Sitzung (Inhalt der UFO-/Schlitten-Station)",
    "",
    "   Dieses Modul wird von tools/ufo-bauen.mjs erzeugt. Das Menü oben rechts",
    `   bietet ${name}, die TXT-Datei und die Code-Vorschau an.`,
    "   ======================================================================= */",
    "",
    "export interface PatchDatei {",
    "  name: string;",
    "  /** Klartext der Datei im Archiv. */",
    "  inhalt: string;",
    "}",
    "",
    `export const PATCH_KURZ = ${JSON.stringify(kurz)};`,
    `export const PATCH_NUMMER = ${nummer};`,
    "export const PATCH_ZIP =",
    '  `LCL-${PATCH_KURZ}-${String(PATCH_NUMMER).padStart(2, "0")}.zip`;',
    "export const PATCH_TXT =",
    '  `LCL-${PATCH_KURZ}-${String(PATCH_NUMMER).padStart(2, "0")}.txt`;',
    'export const PATCH_VORSCHAU = "Patch-Code anzeigen / kopieren";',
    "",
    "/** Zeilen im UFO-/Weihnachtsschlitten-Menü. */",
    "export const PATCH_EINTRAEGE: readonly string[] = [PATCH_ZIP, PATCH_TXT, PATCH_VORSCHAU];",
    "",
  ].join("\n");
}

function schreibe(nummer, name, dateien) {
  const blocke = dateien
    .map((d) => "  {\n    name: " + JSON.stringify(d.name) + ",\n    inhalt: " + JSON.stringify(d.inhalt) + ",\n  },")
    .join("\n");
  writeFileSync(ziel, kopf(nummer, name) + "\nexport const PATCH_DATEIEN: readonly PatchDatei[] = [\n" + blocke + "\n];\n", "utf8");
}

try {
  const nummer = naechsteNummer;
  const titel = `LCL-${kurz}-${String(nummer).padStart(2, "0")}`;
  const zipName = `${titel}.zip`;

  // 1) Leere Vorlage mit Ziel-Struktur schreiben, damit der Diff selbst kompilierbar ist.
  schreibe(nummer, zipName, [
    { name: "aktuell.patch", inhalt: "" },
    { name: "aktuell.json", inhalt: "" },
  ]);

  // 2) Stand gegen origin/main aufnehmen.
  const basisVoll = git("rev-parse", "origin/main");
  const basis = basisVoll.slice(0, 7);
  const basisZeile = git("log", "--oneline", "-1", "origin/main");
  const neu = git("status", "--porcelain", "--", "src", "tools")
    .split("\n")
    .filter((z) => z.startsWith("??"))
    .map((z) => z.slice(3).trim());
  if (neu.length) execFileSync("git", ["add", "-N", ...neu]);

  // Diff direkt gegen origin/main, erste Zeile beginnt exakt mit "diff --git"
  const patch = git("diff", "--no-color", "origin/main");
  const statistik = git("diff", "--stat", "--no-color", "origin/main");

  const patchInhalt = patch ? patch + "\n" : "";
  if (patchInhalt && !patchInhalt.startsWith("diff --git ")) {
    throw new Error("aktuell.patch beginnt nicht mit 'diff --git '");
  }

  // 3) Prüfsumme: erste 16 Hex-Zeichen der SHA-256-Prüfsumme des Patch-Textes.
  const shaVoll = sha256Voll(patchInhalt);
  const sha16 = shaVoll.slice(0, 16);

  const json = {
    datei: "aktuell.patch",
    sha256: sha16,
    titel,
    basis,
  };
  const jsonInhalt = JSON.stringify(json) + "\n";

  // 4) Echten Inhalt in src/game/patch.ts und ungetrackte TXT-Datei schreiben.
  schreibe(nummer, zipName, [
    { name: "aktuell.patch", inhalt: patchInhalt },
    { name: "aktuell.json", inhalt: jsonInhalt },
  ]);
  writeFileSync(txtZiel, patchInhalt, "utf8");

  console.log(`UFO-Inhalt geschrieben: ${ziel}`);
  console.log(`TXT-Datei geschrieben:  ${txtZiel}`);
  console.log(`Archiv: ${zipName}  |  Titel: ${titel}  |  Basis: ${basis} (${basisZeile})`);
  console.log(`sha256 (16 Hex): ${sha16}  (voll: ${shaVoll})`);
  console.log(`aktuell.json:    ${jsonInhalt.trim()}`);
  console.log(`Patch-Größe:     ${Buffer.byteLength(patchInhalt, "utf8")} Bytes`);
  console.log(statistik);
} catch (fehler) {
  if (original !== null) writeFileSync(ziel, original, "utf8");
  console.error("Fehler beim Erzeugen des UFO-Inhalts (Original wiederhergestellt):");
  console.error(fehler instanceof Error ? fehler.message : String(fehler));
  process.exit(1);
}
