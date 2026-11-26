// Morgenroutine: Brillenwurf in den Spiegelschrank und die Gartentür-Regel beim Rauchen.
import assert from "node:assert/strict";
import { build } from "esbuild";

const b = await build({
  stdin: { resolveDir: process.cwd(), contents: `export { House } from './src/game/house';` },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
const speicher = new Map();
globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
const flaeche = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
globalThis.document = { createElement: flaeche, visibilityState: "visible" };
globalThis.window = { devicePixelRatio: 1 };
let n = 0;
const test = (name, f) => { f(); n++; console.log(`OK  ${name}`); };
const hausLinks = () => {
  speicher.clear();
  const h = new G.House(flaeche(), { welt: "normal", clock: { year: 2026, month: 11, day: 22, hour: 15, min: 12 } });
  h.pack = 4; h.cigs = 0;
  h.lf = 0; h.lx = 500; h.cur = null; h.path = []; h.activity = null; h.pending = null;
  h.cellarDoorV = 1; h.cellarDoorWant = 1;
  return h;
};
const schritte = (h, max, zufall, bedingung = () => false) => {
  const alt = Math.random;
  try {
    Math.random = () => zufall;
    for (let i = 0; i < max; i++) { h.update(0.05); if (bedingung(h)) return i; }
  } finally { Math.random = alt; }
  return -1;
};

/** Lässt die ganze Morgenkette laufen und liefert die gesammelten Schritte. */
function morgenkette(zufall) {
  speicher.clear();
  const h = new G.House(flaeche(), { welt: "normal", clock: { year: 2026, month: 11, day: 22, hour: 15, min: 12 } });
  h.pack = 4; h.cigs = 0;
  const folge = [];
  const alt = Math.random;
  try {
    Math.random = () => zufall;
    h.command("stein_aufsteh");
    let letzter = "", fertig = false;
    for (let i = 0; i < 90000; i++) {
      h.update(0.05);
      const w = h.kAblauf?.schritte[h.kAblauf.i]?.was ?? "";
      if (w !== letzter) { letzter = w; if (w && folge.at(-1) !== w) folge.push(w); }
      if (w === "spiegelZu") fertig = true;
      if (fertig && !h.kAblauf && i > 400) break;
    }
  } finally { Math.random = alt; }
  return { h, folge };
}

test("Der Wurf hat vier Landeplätze – der Zufall entscheidet", () => {
  const erwartung = [
    [0.0, "schrank"], [0.3, "becken"], [0.6, "rand"], [0.9, "obenauf"],
  ];
  for (const [zufall, ziel] of erwartung) {
    const { h, folge } = morgenkette(zufall);
    for (const s of ["brilleAb", "spiegelAuf", "rueckenZumSchrank", "schritt1ZurDusche", "schritt1Halten",
      "schritt2ZurDusche", "schritt2Halten", "schritt3ZurDusche", "schritt3Halten", "brilleWerfen", "wurfLandet", "spiegelZu"]) {
      assert.ok(folge.includes(s), `${ziel}: Schritt ${s} fehlt`);
    }
    assert.equal(h.glassesOn, false, `${ziel}: die Brille ist aus`);
    assert.equal(h.glassesInHand, false, `${ziel}: nichts mehr in der Hand`);
    if (ziel === "schrank") { assert.equal(h.glassesInCab, true, "im Schrank"); assert.equal(h.glassesInSink, false); }
    if (ziel === "becken") { assert.equal(h.glassesInSink, true, "im Waschbecken"); assert.equal(h.glassesInCab, false); }
    if (ziel === "rand") {
      assert.ok(h.glassesRest && Math.abs(h.glassesRest.y - (324 - 42.5)) < 1.2, "auf dem Rand");
      assert.ok(h.glassesRest.x > 640, "am Becken, nicht im Raum");
    }
    if (ziel === "obenauf") {
      assert.ok(h.glassesRest && h.glassesRest.y < 300 && h.glassesRest.x > 630 && h.glassesRest.x < 680, "oben auf dem Spiegelschrank");
    }
    assert.equal(h.cabinetOpen, 0, `${ziel}: der Schrank wird wieder geschlossen`);
  }
});

test("Drei langsame Schritte: sie geht vom Becken weg zur Dusche und wartet an jedem Schritt", () => {
  const { h, folge } = morgenkette(0.3);
  const ab = folge.indexOf("rueckenZumSchrank");
  const wege = ["schritt1ZurDusche", "schritt2ZurDusche", "schritt3ZurDusche"];
  let vorher = ab;
  for (const s of wege) {
    const i = folge.indexOf(s, vorher + 1);
    assert.ok(i > vorher, `${s}: falsche Reihenfolge`);
    assert.ok(folge[i + 1].endsWith("Halten"), `${s}: danach folgt das Halten`);
    vorher = i;
  }
  assert.ok(h.lx < 632 - 20, `sie steht links vom Becken in Richtung Dusche (x = ${Math.round(h.lx)})`);
});

test("Eigene Regie: zum Rauchen in der Schleuse macht sie die Gartentür auf", () => {
  const h = hausLinks();
  h.lf = 1; h.lx = 640;
  assert.equal(h.gardenWant, 0, "zu Beginn zu");
  h.command("aschenbecher");
  assert.equal(h.tuerAuftrag, false, "kein Spielerbefehl");
  const i = schritte(h, 4000, 0.5, (x) => x.gardenWant > 0.5);
  assert.ok(i >= 0, "sie öffnet die Gartentür, bevor sie raucht");
});

test("Direkter Spielerbefehl: die Gartentür bleibt zu, darum kümmert er sich", () => {
  const h = hausLinks();
  h.lf = 1; h.lx = 640;
  h.nutzerEingabe = true; h.command("aschenbecher"); h.nutzerEingabe = false;
  assert.equal(h.tuerAuftrag, true);
  schritte(h, 1200, 0.5);
  assert.equal(h.gardenWant, 0, "sie lässt die Tür für den Spieler offen");
});

test("Der Wurf wird gespeichert; ältere Stände ohne Angabe kennen keine Brille im Schrank", () => {
  const { h } = morgenkette(0.0);
  assert.equal(h.glassesInCab, true);
  h.speichern();
  const schluessel = [...speicher.keys()].find((k) => k.startsWith("lcp1.welt.normal"));
  assert.ok(schluessel, "Stand gespeichert");
  assert.equal(new G.House(flaeche(), { welt: "normal" }).glassesInCab, true, "bleibt liegen");
  const stand = JSON.parse(speicher.get(schluessel)); delete stand.glassesInCab; speicher.set(schluessel, JSON.stringify(stand));
  assert.equal(new G.House(flaeche(), { welt: "normal" }).glassesInCab, false, "alter Stand: keine Brille im Schrank");
});

console.log(`\n${n} Brillenwurf-Prüfungen bestanden.`);
