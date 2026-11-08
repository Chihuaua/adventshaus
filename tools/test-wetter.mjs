// Prüfungen für Wettersimulation und Wetterstation (ohne Browser).
import assert from "node:assert/strict";
import { build } from "esbuild";

async function lade(datei) {
  const b = await build({ entryPoints: [datei], bundle: true, write: false, format: "esm", platform: "node" });
  return import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
}
const W = await lade("src/game/wetter.ts");
const S = await lade("src/game/wetterstation.ts");
let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };
function zufall(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

test("Jahreszeit folgt dem Systemdatum", () => {
  const f = (m) => W.jahreszeitFuer(new Date(2026, m, 15));
  assert.deepEqual([0,1,11].map(f), ["winter","winter","winter"]);
  assert.deepEqual([2,3,4].map(f), ["fruehling","fruehling","fruehling"]);
  assert.deepEqual([5,6,7].map(f), ["sommer","sommer","sommer"]);
  assert.deepEqual([8,9,10].map(f), ["herbst","herbst","herbst"]);
});

test("Gewichtetes Wetter liefert nur gültige Lagen, passend zur Jahreszeit", () => {
  const r = zufall(7);
  const gesehen = { winter: new Set(), sommer: new Set() };
  for (let i = 0; i < 4000; i++) {
    const a = W.wetterGewichtet("winter", r);
    const b = W.wetterGewichtet("sommer", r);
    assert.ok(W.WETTERARTEN.includes(a)); assert.ok(W.WETTERARTEN.includes(b));
    gesehen.winter.add(a); gesehen.sommer.add(b);
  }
  assert.ok(gesehen.winter.has("schnee"));
  assert.equal(gesehen.sommer.has("schnee"), false, "im Sommer kein Schnee");
});

test("Zusätze: höchstens drei, umschaltbar, Testwetter markiert", () => {
  let w = { season: "herbst", art: "regen", zusatz: [], test: false, until: 0, snow: 0, updated: 0 };
  for (const z of ["blitze", "wind", "nebel", "frost"]) w = W.schalteZusatz(w, z);
  assert.equal(w.zusatz.length, 3);
  assert.equal(w.test, true);
  assert.ok(!w.zusatz.includes("frost"), "vierter Zusatz wird nicht aufgenommen");
  w = W.schalteZusatz(w, "wind");
  assert.ok(!w.zusatz.includes("wind"), "zweiter Druck entfernt");
  assert.ok(w.zusatz.every((x) => W.ZUSAETZE.includes(x)));
});

test("Testwetter ist flüchtig, Echtwetter schaltet zurück", () => {
  const test = W.waehleWetter({ season: "winter", art: "sonne", zusatz: [], test: false, until: 0, snow: .3, updated: 0 }, "schnee");
  assert.equal(test.test, true); assert.equal(test.art, "schnee");
  assert.ok(test.snow >= .6, "Testschnee sofort sichtbar");
  const echt = W.echtwetter(test);
  assert.equal(echt.test, false); assert.equal(echt.zusatz.length, 0);
  assert.ok(W.WETTERARTEN.includes(echt.art));
});

test("Echtwetter: Schnee wächst bei Schneefall und taut bei Sonne", () => {
  const base = { season: "winter", art: "schnee", zusatz: [], test: false, until: 1e15, snow: 0, updated: 0 };
  const schnee = W.tickWetter({ ...base }, 3 * 3600e3);
  assert.ok(schnee.snow > 0);
  const sonne = W.tickWetter({ ...base, art: "sonne", snow: .5, updated: 0 }, 3 * 3600e3);
  assert.ok(sonne.snow < .5);
});

test("Echtwetter wechselt erst nach Ablauf der Lage, nicht jede Sekunde", () => {
  let w = W.waehleWetter({ season: "herbst", art: "regen", zusatz: [], test: false, until: 0, snow: 0, updated: 0 }, "nebel");
  const echt = W.echtwetter(w);
  echt.until = Date.now() + 3 * 3600e3;
  const a = W.tickWetter({ ...echt }, Date.now() + 1000);
  assert.equal(a.art, echt.art);
  const b = W.tickWetter({ ...echt }, Date.now() + 4 * 3600e3);
  assert.notEqual(b.until, echt.until);
});

test("Wetterstation: alle Knöpfe in der Erdfläche, mindestens 24×24", () => {
  const w = { season: "herbst", art: "regen", zusatz: [], test: false, until: 0, snow: 0, updated: 0 };
  const hits = S.wetterStationLayout(w, null);
  assert.equal(hits.filter(h => h.befehl?.k === "season").length, 4);
  assert.equal(hits.filter(h => h.befehl?.k === "art").length, 8);
  assert.equal(hits.filter(h => h.befehl?.k === "echt").length, 1);
  assert.equal(hits.filter(h => h.befehl?.k === "plus").length, 1);
  assert.equal(hits.filter(h => h.befehl?.k === "minus").length, 1);
  for (const h of hits) {
    assert.ok(h.w >= 24 && h.h >= 24, `${h.label}: ${h.w}×${h.h}`);
    assert.ok(h.x >= 0 && h.x + h.w <= 370, h.label);
    assert.ok(h.y >= 440 && h.y + h.h <= 600, h.label);
    assert.ok(h.label.length > 0);
  }
  const add = S.wetterStationLayout(w, "plus");
  assert.equal(add.filter(h => h.befehl?.k === "zusatz").length, 5);
  for (const h of add) assert.ok(h.w >= 24 && h.h >= 24);
});

test("Wetterstation: eingeklappt nur Schalter, ohne verdeckte Wechselsteine", () => {
  const w = { season: "herbst", art: "regen", zusatz: [], test: false, until: 0, snow: 0, updated: 0 };
  const offen = S.wetterStationLayout(w, null, true);
  const zu = S.wetterStationLayout(w, null, false);
  assert.equal(zu.length, 1);
  assert.equal(zu[0].befehl?.k, "toggle");
  assert.equal(offen.filter(h => h.befehl?.k === "toggle").length, 1);
  assert.equal(S.wetterStationHit(zu, 10, 458), null);
  assert.equal(S.wetterStationHit(zu, 222, 540), null);
  assert.equal(S.wetterStationHit(zu, 278, 536), null);
  assert.equal(S.wetterStationHit(zu, zu[0].x + 10, zu[0].y + 10)?.befehl?.k, "toggle");
  assert.equal(S.wetterStationLayout(w, null, true, false).some(h => h.befehl?.k === "toggle"), false);
});

test("Wetterstation: Treffer landen auf dem richtigen Befehl", () => {
  const w = { season: "herbst", art: "regen", zusatz: [], test: false, until: 0, snow: 0, updated: 0 };
  const hits = S.wetterStationLayout(w, null);
  const find = (k, v) => hits.find(h => h.befehl?.k === k && (v === undefined || h.befehl.v === v));
  for (const key of ["sonne","bewoelkt","regen","schnee","hagel","nebel","sturm","gewitter"]) {
    const h = find("art", key);
    assert.equal(S.wetterStationHit(hits, h.x + 2, h.y + 2)?.befehl?.v, key);
  }
  const plus = find("plus"); const minus = find("minus");
  assert.equal(S.wetterStationHit(hits, plus.x + 1, plus.y + 1)?.befehl?.k, "plus");
  assert.equal(S.wetterStationHit(hits, minus.x + 1, minus.y + 1)?.befehl?.k, "minus");
  assert.equal(S.wetterStationHit(hits, 950, 10), null);
});

test("Wetterstation in beiden Häusern, Küche leer, Stationen erhalten", async () => {
  const { readFileSync } = await import("node:fs");
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /drawWetterStation\(ctx, this\.wetter/);
  assert.ok(!/drawKuecheRoom|drawKuecheEffects/.test(house), "Hexenküche ist entfernt");
  assert.match(house, /if \(!gr\?\.kueche\)/);
  assert.match(house, /drawWetter\(ctx, this\.wetter, this\.elapsed\)/);
  assert.match(readFileSync("src/game/wetter.ts", "utf8"), /aussenPfad/);
});

console.log(`\n${n} Wetter-Tests bestanden.`);
