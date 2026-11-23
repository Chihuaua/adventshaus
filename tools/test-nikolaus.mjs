// Kalender, Rufstein, Besuch und dieselbe Zeichnung in allen vier Ansichten.
import assert from "node:assert/strict";
import { build } from "esbuild";

const bundle = await build({
  stdin: { contents: `export * from './src/game/nikolaus-besuch'; export * from './src/game/nikolaus-figur';
    export { STATIONS, berlinNow } from './src/game/house'; export { steinSlots, steinAn } from './src/game/steine';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: "node", format: "esm",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const tag = (day, month = 12, year = 2026) => ({ year, month, day });
const nachHause = (b, luni = true, tuer = true) => {
  const ereignisse = [];
  for (let i = 0; i < 5000 && b.aktiv; i++) {
    const ev = b.schritt(.05, luni, tuer); if (ev) ereignisse.push(ev);
  }
  assert.equal(b.aktiv, false, "Der Besuch endet auch ohne Luni"); return ereignisse;
};

const OriginalDatum = Date;
try {
  for (const [iso, erwartet] of [["2026-12-05T22:59:59Z", false], ["2026-12-05T23:00:00Z", true],
    ["2026-12-06T22:59:59Z", true], ["2026-12-06T23:00:00Z", false]]) {
    globalThis.Date = class extends OriginalDatum { constructor(...a) { super(...(a.length ? a : [iso])); } };
    assert.equal(G.istNikolaustag(G.berlinNow()), erwartet, `Berliner Mitternacht: ${iso}`);
  }
} finally { globalThis.Date = OriginalDatum; }

const n = new G.NikolausBesuch();
assert.equal(n.kalender(tag(5)), false);
assert.equal(n.kalender(tag(6, 11)), false);
assert.equal(n.rufen(tag(4)), true, "Rufstein ausserhalb des Nikolaustags");
assert.equal(n.jahr, 0, "Ein Ruf verbraucht keinen kuenftigen Kalenderbesuch");
n.schritt(2.15, false, false);
const unterwegs = n.stand();
assert.equal(n.rufen(tag(4)), false, "Doppelklick startet den Weg nicht neu");
assert.deepEqual(n.stand(), unterwegs);
const geladen = new G.NikolausBesuch(); geladen.laden(JSON.parse(JSON.stringify(unterwegs)));
assert.deepEqual(geladen.bild(), n.bild(), "Fortsetzung an genau derselben Stelle");
assert.deepEqual(nachHause(n), ["anklopfen", "eintreten", "abschied", "tuerFrei", "ende"]);
assert.equal(n.kalender(tag(6)), true);
assert.equal(n.jahr, 2026);
assert.equal(n.kalender(tag(6)), false);
nachHause(n);
const spaeter = new G.NikolausBesuch(); spaeter.laden(n.stand());
assert.equal(spaeter.kalender(tag(6)), false, "Neuladen am selben Tag: kein Doppelbesuch");
assert.equal(spaeter.kalender(tag(7)), false);
assert.equal(spaeter.kalender(tag(6, 12, 2027)), true, "Im Folgejahr kommt er wieder");
assert.deepEqual(nachHause(spaeter, false, false), ["anklopfen", "tuerFrei", "ende"]);
assert.equal(spaeter.rufen(tag(6, 12, 2027)), true, "Bewusstes erneutes Rufen bleibt moeglich");
assert.equal(spaeter.kalender(tag(6, 12, 2027)), false);
for (const roh of [null, {}, { ...unterwegs, phase: "falsch" }, { ...unterwegs, zeit: NaN }]) {
  const neu = new G.NikolausBesuch(); neu.laden(roh); assert(!neu.aktiv);
}

let letztes = G.nikolausWaldweg(0);
assert(letztes.x > 864 && letztes.y < 459 && letztes.skala * G.NIKOLAUS_HOEHE < 9, "Winzig am rechten Waldrand");
for (let i = 1; i <= 150; i++) {
  const bild = G.nikolausWaldweg(i / 150);
  assert(bild.skala > letztes.skala && bild.y > letztes.y, "Stetige Perspektive ohne Groessensprung");
  assert(Math.abs(bild.x - letztes.x) < 2, "Zusammenhaengender Weg"); letztes = bild;
}
assert(letztes.x <= 864 && letztes.y === 572 && letztes.skala * G.NIKOLAUS_HOEHE > 75, "An der Gartentuer in Lunis Massstab");
const gast = new G.NikolausBesuch(); gast.rufen(tag(3));
gast.schritt(G.WALDWEG_SEK, false, false); assert.equal(gast.phase, "warten");
gast.schritt(5, true, false); assert.equal(gast.phase, "warten", "Nicht durch geschlossene Tueren gehen");
gast.schritt(1, true, true); assert.equal(gast.phase, "eintreten");
gast.schritt(3, true, true); assert.equal(gast.bild().pose, "gruessen");
assert(gast.bild().x < 830, "Begruessung im sichtbaren Haus");
gast.schritt(10, true, true); gast.schritt(3, true, true); assert.equal(gast.bild().ansicht, "hinten");

const station = G.STATIONS.find(s => s.id === "stein_nikolaus");
assert.equal(station.label, "Nikolausstein");
for (const welt of ["normal", "weihnacht", "traum", "gruesel"]) {
  const slots = G.steinSlots(welt), stein = slots.find(s => s.aktion === "nikolaus");
  assert.equal(Boolean(stein), welt === "normal" || welt === "weihnacht");
  if (!stein) continue;
  assert.deepEqual(stein.hit, station.hits[0]);
  const [x, y, w, h] = stein.hit;
  assert(x >= 96 && x + w <= 864 && y >= 30 && y + h <= 570 && w >= 24 && h >= 24);
  assert.equal(G.steinAn(slots, x + w / 2, y + h / 2), stein);
  assert.equal(slots.filter(s => !s.aktion).length, 3);
  for (const anderer of slots.filter(s => s !== stein)) {
    const [a, b, c, d] = anderer.hit; assert(!(x < a + c && x + w > a && y < b + d && y + h > b));
  }
}

const bilder = new Set();
for (const ansicht of ["vorn", "links", "rechts", "hinten"]) {
  for (const pose of ["stehen", "gehen", "gruessen"]) {
    let tiefe = 0; const striche = [];
    const c = new Proxy({ save() { tiefe++; }, restore() { assert(--tiefe >= 0); },
      createLinearGradient() { return { addColorStop() {} }; } }, {
      get(o, k) { return k in o ? o[k] : (...args) => {
        for (const a of args) if (typeof a === "number") assert(Number.isFinite(a));
        striche.push([k, ...args]);
      }; },
    });
    G.zeichneNikolaus(c, 0, 0, { ansicht, pose, zeit: 1.6, skala: 1 });
    assert.equal(tiefe, 0, "Kein Zeichenzustand bleibt auf der Hausbuehne zurueck");
    bilder.add(JSON.stringify(striche));
  }
}
assert.equal(bilder.size, 12, "Vier unterscheidbare Ansichten mit je drei Posen");
console.log("OK  Nikolaus: Berliner Datum, Ruf, Jahreswechsel, Speicher, Waldweg, Begegnung, Steine und 12 Figurenvarianten.");