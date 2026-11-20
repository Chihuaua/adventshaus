#!/usr/bin/env node
/* ============================================================
   Luni-Mon-Studio · Mons des Spiels bereitstellen

   Erzeugt src/studio/spiel-mons.js aus src/game/mons.ts.
   Das Studio läuft als eigenständiges Dokument in einem Rahmen und
   kann deshalb kein TypeScript laden. Dieses Werkzeug lässt den
   TypeScript-Übersetzer nur die Typangaben entfernen; der Zeichencode
   der Maler bleibt unverändert. mons.ts selbst wird nicht angefasst.

   Aufruf:   node tools/spiel-mons-bauen.mjs            (schreibt die Datei)
             node tools/spiel-mons-bauen.mjs --pruefen  (Exit 1, wenn veraltet)

   Nach JEDER Änderung an src/game/mons.ts neu ausführen.
   ============================================================ */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const quelle = join(wurzel, "src/game/mons.ts");
const ziel = join(wurzel, "src/studio/spiel-mons.js");

const quelltext = readFileSync(quelle, "utf8");

/** Prüfsumme (FNV-1a, 32 Bit). MonsStudio.tsx rechnet dieselbe über mons.ts und warnt bei Abweichung. */
function pruefsumme(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

let js = ts.transpileModule(quelltext, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;

// Das Studio lädt die Datei als klassisches Skript: "export" entfällt.
js = js.replace(/^export (const|function) /gm, "$1 ");
if (/^\s*(export|import)\b/m.test(js)) throw new Error("mons.ts: unerwartetes export/import übrig");
if (js.toLowerCase().includes("</script")) throw new Error('mons.ts: "</script" würde das Studio-Dokument zerreißen');

const text =
  "/* ERZEUGT aus src/game/mons.ts mit tools/spiel-mons-bauen.mjs – nicht von Hand ändern. */\n" +
  `/* quelle-pruefsumme: ${pruefsumme(quelltext)} */\n` +
  "(function(){\n" +
  js +
  "\nwindow.SpielMons={LUNI_MONS:LUNI_MONS,drawLuniMon:drawLuniMon};\n})();\n";

if (process.argv.includes("--pruefen")) {
  const aktuell = existsSync(ziel) ? readFileSync(ziel, "utf8") : "";
  if (aktuell === text) {
    console.log("spiel-mons.js ist aktuell.");
  } else {
    console.log("VERALTET: src/studio/spiel-mons.js passt nicht zu src/game/mons.ts.");
    console.log("Beheben mit: node tools/spiel-mons-bauen.mjs");
    process.exit(1);
  }
} else {
  writeFileSync(ziel, text, "utf8");
  console.log(`spiel-mons.js geschrieben: ${Buffer.byteLength(text)} Bytes`);
}
