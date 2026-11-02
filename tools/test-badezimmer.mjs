import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/game/gruselhaus/badezimmer.ts"], bundle: true,
  write: false, format: "esm", platform: "node",
});
const { BIO_BAD, badezimmerStationen } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
let checked = 0;
function test(name, run) { run(); checked++; console.log(`OK  ${name}`); }

test("Kapsel, Fenster, Panel und WC bleiben in Raum 04", () => {
  assert.ok(BIO_BAD.links > 490 && BIO_BAD.rechts < 694);
  for (const {x,y,w,h} of [BIO_BAD.kapsel, BIO_BAD.wc, BIO_BAD.spind, BIO_BAD.crt]) {
    assert.ok(x >= BIO_BAD.links && x + w <= BIO_BAD.rechts, `${x}+${w}`);
    assert.ok(y >= BIO_BAD.decke && y + h <= BIO_BAD.boden, `${y}+${h}`);
  }
  assert.ok(BIO_BAD.panel.x + BIO_BAD.panel.w < BIO_BAD.wc.x);
});

test("Sichtfenster liegt auf Lunis Augenhöhe, ohne ihre Größe zu ändern", () => {
  const eye = 324 + (-46.5 + .4) * 1.08;
  assert.ok(Math.abs(eye - BIO_BAD.kapsel.augeY) < 1);
});

test("Knöpfe sind aus Lunis unveränderter Armlänge erreichbar", () => {
  const reach = (8.2 + 8.4) * 1.08;
  const handDist = (stand, target) => Math.hypot(
    target[0] - (stand + 3.4 * 1.08), target[1] - (324 - 34 * 1.08),
  );
  assert.ok(handDist(BIO_BAD.panel.stand, BIO_BAD.panel.knopf) < reach);
  assert.ok(handDist(BIO_BAD.wc.stand, BIO_BAD.wc.hebel) < reach);
});

test("Nur Gruselhaus-Stationskopien ändern sich, große Klickziele bleiben", () => {
  const stations = ["dusche", "spiegelschrank", "buerste", "brille", "kaffee"].map(id => ({
    id, label: id, floor: 2, x: 100, hits: [[10,10,24,24]],
  }));
  const before = JSON.stringify(stations);
  const result = badezimmerStationen(stations);
  assert.equal(JSON.stringify(stations), before);
  assert.equal(result.length, stations.length + 1);
  assert.equal(result.find(s=>s.id==="kaffee"), stations[4]);
  assert.equal(result.find(s=>s.id==="dusche")?.label, "Dekon-Kapsel");
  assert.equal(result.find(s=>s.id==="bio_wc")?.label, "Verbrennungs-WC");
  for (const station of result) for (const [,,w,h] of station.hits) {
    assert.ok(w >= 24 && h >= 24, `${station.id}: ${w}x${h}`);
  }
});

test("Dekon-Routine behält Umziehen, Brille und Waschen in richtiger Folge", () => {
  const source = readFileSync("src/game/house.ts", "utf8");
  const match = source.match(/const DEKON_SEQ = \[([\s\S]*?)\] as const;/);
  assert.ok(match);
  const phases = [...match[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
  const order = ["toWardrobe","undress","wrap","glassesOff","toPanel","pressPanel",
    "capsuleOpen","towelOff","toShower","turnFront","capsuleClose","waterOn",
    "washHair","rinse","waterOff","capsuleExitOpen","stepOut","takeTowel",
    "wrapOn","capsuleExitClose"];
  let last = -1;
  for (const phase of order) {
    const index = phases.indexOf(phase);
    assert.ok(index > last, `${phase} steht nicht nach ${phases[last] ?? "Start"}`);
    last = index;
  }
});

console.log(`\n${checked} Badezimmer-Tests bestanden.`);