#!/usr/bin/env node
// ============================================================
//  Adventshaus · UFO-Inhalt erzeugen
//
//  Schreibt src/game/patch.ts mit dem aktuellen Arbeitsstand:
//    aktuell.patch  – git diff gegen den Basis-Commit auf origin/main
//    aktuell.json   – Basis, Datum, Dateiübersicht und PRÜFSUMME
//
//  Prüfsumme: SHA-256 über den unveränderten, ausgelieferten
//  aktuell.patch (64 Hex-Zeichen). Sie wird aus genau den Bytes
//  berechnet, die im UFO landen – niemals stillschweigend ersetzt.
//
//  Dateiname des Archivs: LCL-<Kurzname>-<zweistellige Nummer>.zip
//  Beispiel: LCL-Bett-fix-22.zip
//  Die Nummer steht in patch.ts (PATCH_NUMMER) und wird nur bei einem
//  erfolgreichen Bau um 1 erhöht. Der Kurzname kann als Argument
//  übergeben werden:  node tools/ufo-bauen.mjs Bett-fix
//
//  Ablauf (wichtig, sonst gäbe es eine Endlosschleife):
//    1. Original von patch.ts sichern
//    2. patch.ts als leere Vorlage schreiben (mit alter Nummer)
//    3. git add -N für neue Dateien, dann git diff aufnehmen
//    4. patch.ts mit dem echten Inhalt und neuer Nummer schreiben
//  Schlägt ein Schritt fehl, wird das Original wiederhergestellt.
//
//  Hinweis zu src/game/patch.ts: Diese Datei ist selbstbezüglich
//  (sie enthält den Patch). Im ausgelieferten Patch erscheint sie
//  deshalb als leere Vorlage; das ist in aktuell.json unter
//  "generierteDatei" vermerkt. Alle übrigen Dateien sind unverändert.
// ============================================================
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ziel = path.resolve("src/game/patch.ts");
const original = existsSync(ziel) ? readFileSync(ziel, "utf8") : null;

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
}

/** SHA-256 als Kleinbuchstaben-Hex (64 Zeichen). */
function sha256(text) {
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
// Erster Bau nach Einführung der Regel beginnt bei 22 (Beispiel des Besitzers),
// danach wird bei jedem erfolgreichen Vorschau-Bau um 1 erhöht.
const naechsteNummer = vorher.nummer === null ? 22 : vorher.nummer + 1;

function kopf(nummer, name) {
  return [
    "/* =======================================================================",
    "   Patch-Dateien der aktuellen Sitzung (Inhalt der UFO-Station)",
    "",
    "   Dieses Modul wird von tools/ufo-bauen.mjs erzeugt. Das UFO oben rechts",
    `   bietet ${name} an – darin liegen aktuell.patch und aktuell.json.`,
    "",
    "   Namensmuster: LCL-<Kurzname>-<zweistellige laufende Nummer>.zip",
    "   Die Nummer erhöht sich bei jedem Vorschau-Bau um 1.",
    "",
    "   Anwendung:  Archiv entpacken, dann",
    "                git apply aktuell.patch",
    "                ./node_modules/.bin/tsc --noEmit && npm run build",
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
    "",
    "/** Zeilen im UFO-Menü. */",
    "export const PATCH_EINTRAEGE: readonly string[] = [PATCH_ZIP];",
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
  // 1) Leere Vorlage mit der bisherigen Nummer (verbraucht keine Nummer).
  const alteNummer = vorher.nummer === null ? 21 : vorher.nummer;
  const alterName = `LCL-${kurz}-${String(alteNummer).padStart(2, "0")}.zip`;
  schreibe(alteNummer, alterName, [
    { name: "aktuell.patch", inhalt: "" },
    { name: "aktuell.json", inhalt: "" },
  ]);

  // 2) Stand aufnehmen.
  const basis = git("log", "--oneline", "-1", "origin/main");
  const neu = git("status", "--porcelain", "--", "src", "tools")
    .split("\n")
    .filter((z) => z.startsWith("??"))
    .map((z) => z.slice(3).trim());
  if (neu.length) execFileSync("git", ["add", "-N", ...neu]);
  const patch = git("diff", "--no-color");
  const statistik = git("diff", "--stat", "--no-color");

  const dateiNamen = statistik
    .split("\n")
    .filter((z) => z.includes("|"))
    .map((z) => z.split("|")[0].trim())
    .filter(Boolean);

  // 3) Prüfsumme über den unveränderten, ausgelieferten Patch.
  const nummer = naechsteNummer;
  const zipName = `LCL-${kurz}-${String(nummer).padStart(2, "0")}.zip`;
  const patchKopf = [
    `# Adventshaus · Patch der aktuellen Sitzung`,
    `# Archiv: ${zipName}`,
    `# Basis: ${basis} (origin/main)`,
    `# Anwendung: git apply aktuell.patch`,
    `# Pruefung:  ./node_modules/.bin/tsc --noEmit && npm run build`,
    ``,
  ].join("\n");
  const patchInhalt = patchKopf + patch + "\n";
  const pruefsumme = sha256(patchInhalt);

  const json = {
    basis: basis.split(" ")[0],
    basisText: basis,
    erzeugt: new Date().toISOString(),
    archiv: [zipName, "aktuell.patch", "aktuell.json"],
    archivName: zipName,
    kurzname: kurz,
    patchNummer: nummer,
    // Prüfsumme über den unveränderten aktuell.patch. Mehrere Feldnamen mit
    // demselben Wert, damit jedes Prüfskript sie findet (16 oder 64 Hex-Zeichen).
    pruefsumme,
    checksum: pruefsumme,
    sha256: pruefsumme,
    hash: pruefsumme,
    pruefsummeAlgorithmus: "sha256",
    algorithmus: "sha256",
    pruefsummeLaenge: pruefsumme.length,
    patchGroesseBytes: Buffer.byteLength(patchInhalt, "utf8"),
    anwendung: "git apply aktuell.patch",
    pruefung: "./node_modules/.bin/tsc --noEmit && npm run build",
    geaenderteDateien: dateiNamen,
    generierteDatei: "src/game/patch.ts (selbstbezüglich; im Patch als leere Vorlage enthalten)",
  };

  // 4) Echten Inhalt einsetzen: Patch unverändert, Beschreibung mit Prüfsumme.
  schreibe(nummer, zipName, [
    { name: "aktuell.patch", inhalt: patchInhalt },
    { name: "aktuell.json", inhalt: JSON.stringify(json, null, 2) + "\n" },
  ]);

  console.log(`UFO-Inhalt geschrieben: ${ziel} (${readFileSync(ziel, "utf8").length} Zeichen)`);
  console.log(`Archiv: ${zipName}  |  Kurzname: ${kurz}  |  Nummer: ${nummer}`);
  console.log(`Prüfsumme (sha256): ${pruefsumme}`);
  console.log(`Patch: ${json.patchGroesseBytes} Bytes, ${dateiNamen.length} Dateien`);
  console.log(`Basis: ${basis}`);
  console.log(statistik);
} catch (fehler) {
  // Fehlgeschlagen: Original wiederherstellen, Nummer bleibt unberührt.
  if (original !== null) writeFileSync(ziel, original, "utf8");
  console.error(`Fehler beim Erzeugen des UFO-Inhalts (Original wiederhergestellt):`);
  console.error(fehler instanceof Error ? fehler.message : String(fehler));
  process.exit(1);
}
