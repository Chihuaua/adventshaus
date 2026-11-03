// Prüfungen für den Holzlagerplatz in der Hexenküche (geometrie + Verkabelung) – ohne Browser.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const b = await build({ entryPoints: ["src/game/gruselhaus/kueche.ts"], bundle: true, write: false, format: "esm", platform: "node" });
const K = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
const H = await build({ entryPoints: ["src/game/gruselhaus/hexenofen.ts"], bundle: true, write: false, format: "esm", platform: "node" });
const { OFEN } = await import(`data:text/javascript;base64,${Buffer.from(H.outputFiles[0].text).toString("base64")}`);

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

test("Nische ist exakt so breit und hoch wie der Ofen, Abstand 4 zum Ofen", () => {
  assert.equal(K.HOLZLAGER_W, OFEN.w, "Breite weicht vom Ofen ab");
  assert.equal(K.HOLZLAGER.h, OFEN.korpus, "Höhe weicht vom Ofenkorpus ab");
  assert.equal(K.HOLZLAGER.abstand, 4);
  assert.equal(K.HOLZLAGER.x + K.HOLZLAGER_W + K.HOLZLAGER.abstand, OFEN.x, "Nische liegt nicht direkt links vom Ofen");
});
test("Station: mind. 24×24, Ziel fernsehtauglich, Luni steht auf demselben Boden", () => {
  const st = K.holzlagerStationen([]);
  assert.equal(st.length, 1);
  const lager = st[0];
  assert.equal(lager.id, "holzlager");
  assert.equal(lager.floor, 1);
  const [hx, hy, hw, hh] = lager.hits[0];
  assert.ok(hw >= 24 && hh >= 24, `${hw}×${hh} zu klein`);
  assert.equal(hy, 448 - K.HOLZLAGER.h);
  assert.ok(lager.x > hx && lager.x < hx + hw, "Standplatz liegt nicht vor der Nische");
});
test("Stapel: höchstens neun Scheite (3×3), Nachfüllen dauert Minuten, nicht Sekunden", () => {
  assert.equal(K.HOLZ_MAX, 9);
  assert.ok(K.HOLZ_REFILL_SEK >= 180, "Nachfüllen zu schnell für den langsamen Spielstil");
});
test("Verkabelung: Station, Ofenkette, Tragen, Nachladen und Anzeige sind verdrahtet", () => {
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /id === "holzlager"/);
  assert.match(house, /this\.chain = \[\{ id: "herd", force: true \}\]/, "Ofenkette fehlt");
  assert.match(house, /this\.carryHolz = true;/, "Scheit wird nicht getragen");
  assert.match(house, /if \(this\.carryHolz\) this\.kessel\.holzNachgelegt\(\)/, "Nur getragenes Holz startet den Trank");
  assert.match(house, /drawHolzlager\(c, FE, this\.holz, this\.lagerT\)/, "Lager wird nicht gezeichnet");
  assert.match(readFileSync("src/game/gruselhaus/kueche.ts", "utf8"), /quadermauer/);
});
test("Geltungsbereich: Lagerstation nur im Gruselhaus", () => {
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /if \(GRUSELRAEUME\.kueche\) st = holzlagerStationen\(st\)/);
});
console.log(`\n${n} Küchen-Tests bestanden.`);
