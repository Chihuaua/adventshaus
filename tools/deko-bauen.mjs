#!/usr/bin/env node
/* ============================================================
   Luni-Mon-Studio · Weihnachtsdeko für den Katalog bereitstellen

   Erzeugt src/studio/deko.js aus src/game/deko.ts.
   Das Studio läuft als eigenständiges Dokument in einem Rahmen und
   kann deshalb kein TypeScript laden. Dieses Werkzeug lässt den
   TypeScript-Übersetzer nur die Typangaben entfernen; der Zeichencode
   der Deko bleibt unverändert. deko.ts selbst wird nicht angefasst.

   Aufruf:   node tools/deko-bauen.mjs            (schreibt die Datei)
             node tools/deko-bauen.mjs --pruefen  (Exit 1, wenn veraltet)

   Nach JEDER Änderung an src/game/deko.ts neu ausführen.
   ============================================================ */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const quelle = join(wurzel, "src/game/deko.ts");
const ziel = join(wurzel, "src/studio/deko.js");

const quelltext = readFileSync(quelle, "utf8");

/** Prüfsumme (FNV-1a, 32 Bit). MonsStudio.tsx rechnet dieselbe über deko.ts und warnt bei Abweichung. */
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
if (/^\s*(export|import)\b/m.test(js)) throw new Error("deko.ts: unerwartetes export/import übrig");
if (js.toLowerCase().includes("</script")) throw new Error('deko.ts: "</script" würde das Studio-Dokument zerreißen');

const text =
  "/* ERZEUGT aus src/game/deko.ts mit tools/deko-bauen.mjs – nicht von Hand ändern. */\n" +
  `/* quelle-pruefsumme: ${pruefsumme(quelltext)} */\n` +
  "(function(){\n" +
  js +
  "\nwindow.Deko={DEKO_STUECKE:DEKO_STUECKE,drawDekoStueck:drawDekoStueck};\n})();\n";

if (process.argv.includes("--pruefen")) {
  const aktuell = existsSync(ziel) ? readFileSync(ziel, "utf8") : "";
  if (aktuell === text) {
    console.log("deko.js ist aktuell.");
  } else {
    console.log("VERALTET: src/studio/deko.js passt nicht zu src/game/deko.ts.");
    console.log("Beheben mit: node tools/deko-bauen.mjs");
    process.exit(1);
  }
} else {
  writeFileSync(ziel, text, "utf8");
  console.log(`deko.js geschrieben: ${Buffer.byteLength(text)} Bytes`);
}
