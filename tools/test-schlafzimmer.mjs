// Prüfungen für Raum 03 (Gruselhaus): Outfitwechsel, Brillenwurf, Sargdeckel.
import assert from "node:assert/strict";
import { build } from "esbuild";

async function lade(datei) {
  const b = await build({ entryPoints: [datei], bundle: true, write: false, format: "esm", platform: "node" });
  return import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
}
const V = await lade("src/game/gruselhaus/vampir.ts");
const S = await lade("src/game/gruselhaus/schlafzimmer.ts");
let ok = 0;
const test = (name, fn) => { fn(); ok++; console.log(`OK  ${name}`); };
function zufall(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

test("Outfit: acht Varianten, nie zweimal hintereinander, alle kommen vor", () => {
  assert.equal(V.VAMPIR_OUTFITS.length, 8);
  const r = zufall(7);
  let letztes = -1;
  const gesehen = new Set();
  for (let i = 0; i < 2000; i++) {
    const n = V.naechstesOutfit(letztes, r);
    assert.ok(n >= 0 && n < 8);
    assert.notEqual(n, letztes);
    gesehen.add(n);
    letztes = n;
  }
  assert.equal(gesehen.size, 8);
});
test("Brillenwurf: 60 % Nachttisch, 20 % Kronleuchter, 20 % Fledermaus/Kelch/Schrank", () => {
  const r = zufall(42);
  const z = { nachttisch: 0, leuchter: 0, fledermaus: 0, kelch: 0, schrank: 0 };
  const N = 30000;
  for (let i = 0; i < N; i++) z[S.brillenZiel(r)]++;
  const q = (k) => z[k] / N;
  assert.ok(Math.abs(q("nachttisch") - 0.6) < 0.015, JSON.stringify(z));
  assert.ok(Math.abs(q("leuchter") - 0.2) < 0.012, JSON.stringify(z));
  for (const k of ["fledermaus", "kelch", "schrank"]) assert.ok(Math.abs(q(k) - 0.2 / 3) < 0.01, JSON.stringify(z));
});
test("Brille: nur Nachttisch und Kelch sind im Stehen erreichbar", () => {
  assert.equal(S.brilleErreichbar("nachttisch"), true);
  assert.equal(S.brilleErreichbar("kelch"), true);
  for (const k of ["leuchter", "fledermaus", "schrank"]) assert.equal(S.brilleErreichbar(k), false);
});
test("Brillenziele liegen unterhalb der Zimmerdecke und im Raum", () => {
  for (const [k, p] of Object.entries(S.BRILLEN_ZIELE)) {
    assert.ok(p.y > S.SCHLAFZIMMER.decke && p.y < S.SCHLAFZIMMER.boden, k);
    assert.ok(p.x > S.SCHLAFZIMMER.x0 && p.x < S.SCHLAFZIMMER.x1, k);
  }
});
test("Sargdeckel: Griffkante steigt stetig, offen in Armreichweite (fest 16,6 x 1,08)", () => {
  const F = 324;
  let vorher = Infinity;
  for (let i = 0; i <= 100; i++) {
    const [, y] = S.deckelGriff(F, i / 100, 328);
    assert.ok(y <= vorher + 1e-9, `o=${i / 100}`);
    vorher = y;
  }
  const schulter = F - 33.8 * 1.08;
  const reichweite = 16.6 * 1.08;
  for (const o of [0, 0.5, 1]) {
    const [, y] = S.deckelGriff(F, o, 328);
    assert.ok(Math.abs(y - schulter) <= reichweite + 0.01, `o=${o} y=${y}`);
  }
  assert.ok(S.deckelProj(0) > 0 && S.deckelProj(1) < 0);
});
console.log(`\n${ok} Schlafzimmer-Tests bestanden.`);
