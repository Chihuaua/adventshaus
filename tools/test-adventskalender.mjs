// Adventskalender-Logik: Freigabe, Jahresmischung, Türchenstand und geheime Reihenfolge.
import assert from "node:assert/strict";
import { build } from "esbuild";

// localStorage-Nachbildung, damit die Speicherung geprüft werden kann.
const speicher = new Map();
globalThis.localStorage = {
  getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: (k) => speicher.delete(k),
};

const bundle = await build({
  entryPoints: ["src/game/advent.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const A = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let bestanden = 0;
function test(name, fn) {
  fn();
  bestanden++;
  console.log("  ok " + name);
}

test("Prototyp: jedes Türchen ist frei", () => {
  for (let tag = 1; tag <= 24; tag++) {
    assert.equal(A.adventFrei(tag, 7, 15, false), true);
  }
});

test("Finalmodus: vor dem Dezember bleibt alles zu", () => {
  assert.equal(A.adventFrei(1, 11, 30, true), false);
  assert.equal(A.adventFrei(24, 11, 30, true), false);
});

test("Finalmodus: Türchen sind nachholbar, aber nicht vorziehbar", () => {
  // Am 10.12. sind die Türchen 1–10 dran, 11 noch nicht.
  for (let tag = 1; tag <= 10; tag++) assert.equal(A.adventFrei(tag, 12, 10, true), true);
  assert.equal(A.adventFrei(11, 12, 10, true), false);
  assert.equal(A.adventFrei(24, 12, 10, true), false);
  // Am 24.12. ist alles offen.
  assert.equal(A.adventFrei(24, 12, 24, true), true);
});

test("Jahresmischung: 24 eindeutige Türchen, je Jahr neu", () => {
  const m = A.adventMischung(2026);
  assert.equal(m.length, 24);
  assert.deepEqual([...m].sort((a, b) => a - b), Array.from({ length: 24 }, (_, i) => i + 1));
  assert.deepEqual(A.adventMischung(2026), m, "gleiches Jahr, gleiche Mischung");
  assert.notDeepEqual(A.adventMischung(2027), m, "neues Jahr, neue Mischung");
});

test("Türchen-Layout: 24 Klappen innerhalb der Bühne", () => {
  const tueren = A.adventTueren(A.adventMischung(2026));
  assert.equal(tueren.length, 24);
  for (const { r } of tueren) {
    assert.ok(r.x >= 90 && r.x + r.w <= 870, "x im Rahmen");
    assert.ok(r.y >= 70 && r.y + r.h <= 560, "y im Rahmen");
    assert.ok(r.w >= 24 && r.h >= 24, "Klickziel groß genug");
  }
});

test("Speichern: geöffnete Türchen überstehen einen Neustart", () => {
  speicher.clear();
  let stand = A.ladeAdvent(2026);
  assert.equal(A.adventOeffnen(stand, 3, true), true);
  assert.equal(A.adventOeffnen(stand, 3, true), false, "doppelt öffnet nicht");
  assert.equal(A.adventOeffnen(stand, 7, false), false, "zugefroren öffnet nicht");
  stand = A.ladeAdvent(2026);
  assert.deepEqual(stand.offen, [3]);
  assert.deepEqual(stand.reihenfolge, [3]);
});

test("Jahreswechsel: alter Stand zählt nicht mehr", () => {
  const stand = A.ladeAdvent(2027);
  assert.deepEqual(stand.offen, []);
  assert.equal(stand.jahr, 2027);
});

test("Offene Türchen verdecken das Nachbartürchen nicht", () => {
  // Eine aufgeklappte Tür ragt höchstens 16 Einheiten nach links (tuerFluegel).
  const tueren = A.adventTueren(A.adventMischung(2026));
  let kleinsteLuecke = Infinity;
  for (let i = 0; i < tueren.length; i++) {
    if (i % 6 === 0) continue;
    const links = tueren[i - 1].r;
    const rechts = tueren[i].r;
    kleinsteLuecke = Math.min(kleinsteLuecke, rechts.x - (links.x + links.w));
  }
  assert.ok(kleinsteLuecke > 16 + 2, `Lücke ${kleinsteLuecke.toFixed(1)} muss die offene Tür (16) plus Rand fassen`);
});

test("Geheime Belohnung: nur die Reihenfolge 1–24 zählt", () => {
  const gut = { jahr: 2026, offen: [], reihenfolge: [] };
  for (let tag = 1; tag <= 24; tag++) {
    gut.offen.push(tag);
    gut.reihenfolge.push(tag);
  }
  assert.equal(A.adventSternVerdient(gut), true);
  const falsch = { ...gut, reihenfolge: [2, 1, ...gut.reihenfolge.slice(2)] };
  assert.equal(A.adventSternVerdient(falsch), false);
  const unvollstaendig = { jahr: 2026, offen: [1, 2], reihenfolge: [1, 2] };
  assert.equal(A.adventSternVerdient(unvollstaendig), false);
});

console.log(`\n${bestanden} Adventskalender-Tests bestanden.`);
