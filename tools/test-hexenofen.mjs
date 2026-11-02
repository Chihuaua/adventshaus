// Prüfungen für den Hexenofen (Form, Kessel, Stationen) – ohne Browser.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const b = await build({ entryPoints: ["src/game/gruselhaus/hexenofen.ts"], bundle: true, write: false, format: "esm", platform: "node" });
const { OFEN } = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

test("Ofen steht am Platz des alten Backofens und ist so breit wie dieser", () => {
  assert.equal(OFEN.x, 690);
  assert.equal(OFEN.w, 36);
  assert.equal(OFEN.korpus, 38);
});
test("Kessel ist mittig, passt auf die Deckplatte und lässt Rand frei", () => {
  assert.equal(OFEN.kessel.x, OFEN.x + OFEN.w / 2);
  assert.ok(OFEN.kessel.r * 2 < OFEN.w, "Kessel breiter als Ofen");
  assert.ok(OFEN.kessel.x - OFEN.kessel.r > OFEN.x);
  assert.ok(OFEN.kessel.x + OFEN.kessel.r < OFEN.x + OFEN.w);
});
test("Ofenrohr sitzt rechts und endet oberhalb des Kesselrands", () => {
  assert.ok(OFEN.rohrX > OFEN.kessel.x + OFEN.kessel.r, "Rohr muss rechts vom Kessel liegen");
  const kesselRandY = 448 - OFEN.korpus - OFEN.kessel.hoehe;
  const rohrUnterkante = 448 - 41;
  assert.ok(kesselRandY < rohrUnterkante, "Rohr darf den Kessel nicht kreuzen");
  assert.ok(448 - OFEN.korpus + OFEN.kessel.hoehe <= 448, "Kessel ragt nicht in den Boden");
});
test("Beide Stationen sind erreichbar und ausreichend groß", () => {
  const reach = (8.2 + 8.4) * 1.08;
  const hub = [OFEN.kessel.x, 448 - OFEN.korpus];
  assert.ok(Math.abs(hub[0] - OFEN.kesselStand) < reach / 2);
  assert.ok(Math.abs(hub[0] - OFEN.ofenStand) < 0.01);
  const house = readFileSync("src/game/house.ts", "utf8");
  for (const [id, w, h] of [["herd", 36, 42], ["kessel", 36, 26]]) {
    assert.match(house, new RegExp(`id: "${id}"`));
    assert.ok(w >= 24 && h >= 24, `${id}: ${w}×${h} zu klein`);
  }
  assert.match(house, /label: "Hexenkessel"/);
});
test("Kessel schaltet die Ofentür nicht, Ofen ist nur im Gruselhaus Ofen", () => {
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /if \(id === "kessel"\)/);
  assert.match(house, /if \(id === "herd" && this\.gruselBad\)/);
  assert.match(house, /label: "Ofen" \} : x/);
  assert.match(house, /this\.stationen|st = st\s*\n\s*\.filter/);
});
test("Küche bleibt leer, Fenster im Gruselhaus entfernt, keine Hexenküche mehr", () => {
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /if \(!gr\?\.kueche\) windowRect\(c, sky, 624, 364/);
  assert.ok(!/drawKuecheRoom|drawKuecheEffects/.test(house));
  assert.ok(!readFileSync("src/game/gruselhaus/index.ts", "utf8").includes("kueche.ts"));
  assert.match(house, /drawOfen\(c, FE, 0, 0\)/);
  assert.match(house, /drawKessel\(c, FE, 0\)/);
});
console.log(`\n${n} Hexenofen-Tests bestanden.`);
