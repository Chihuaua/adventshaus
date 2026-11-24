import assert from "node:assert/strict";
import { build } from "esbuild";

// Tagesablauf, Aufsteh-Routine und Hundenäpfe: Reine Rechnung, kein Canvas nötig.
const b = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
  export { tageswerte, aufwachSekunde, TAGES_ZEITEN, TAGES_DAUERN, TAGES_PROBE, NAPF_ORTE } from './src/game/tagesroutine';
  export { steinSlots, STEIN_NAMEN } from './src/game/steine';`,
  },
  bundle: true, write: false, format: "esm", platform: "node",
});
const b2 = await build({
  stdin: { resolveDir: process.cwd(), contents: `export { House } from './src/game/house';` },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G2 = await import(`data:text/javascript;base64,${Buffer.from(b2.outputFiles[0].text).toString("base64")}`);
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);

// 1) Termine je Kalendertag fest und weltengetrennt
assert.deepEqual(G.tageswerte(20261224, "normal"), G.tageswerte(20261224, "normal"));
assert.notDeepEqual(G.tageswerte(20261224, "normal"), G.tageswerte(20261225, "normal"));
assert.notDeepEqual(G.tageswerte(20261224, "normal"), G.tageswerte(20261224, "weihnacht"));

// 2) Mittagessen liegt zwischen 12 und 13 Uhr, Auslass um 18:30
for (const tag of [20261201, 20261224, 20270106]) {
  const w = G.tageswerte(tag, "normal");
  assert.ok(w.essenSek >= G.TAGES_ZEITEN.essen[0] && w.essenSek < G.TAGES_ZEITEN.essen[1], `Essen außerhalb des Fensters: ${w.essenSek}`);
  assert.ok(w.auslassSek >= G.TAGES_ZEITEN.auslass && w.auslassSek < G.TAGES_ZEITEN.auslass + 300, `Auslass außerhalb: ${w.auslassSek}`);
  assert.ok(w.schlafStunden >= 6 && w.schlafStunden <= 8, `Schlafstunden: ${w.schlafStunden}`);
  assert.ok(w.rauchAbstand >= 2100 && w.rauchAbstand <= 3900, `Rauchabstand: ${w.rauchAbstand}`);
}

// 3) Aufwachen: 6 bis 8 Stunden nach dem Einschlafen, nie vor 6:00
const w = G.tageswerte(20261224, "normal");
const frueh = G.aufwachSekunde(22 * 3600, w); // um 22 Uhr eingeschlafen
assert.ok(frueh >= 6 * 3600, `zu früh wach: ${frueh}`);
assert.ok(frueh <= 30 * 3600, `zu spät wach: ${frueh}`);
const Nacht = G.aufwachSekunde(23 * 3600 + 1800, w);
assert.ok(Nacht >= 5 * 3600 + 1800 && Nacht <= 7 * 3600 + 1800, `Wachzeit ungewöhnlich: ${Nacht}`);
// Wer erst nach Mitternacht einschläft, ruht trotzdem sechs bis acht Stunden
const nachMitternacht = G.aufwachSekunde(2 * 3600, w);
assert.ok(nachMitternacht >= 8 * 3600 && nachMitternacht <= 10 * 3600, `Nach Mitternacht: ${nachMitternacht}`);

// 4) Echtzeit-Dauern gegen die Probe: alles erheblich kürzer
assert.ok(G.TAGES_PROBE.weste < G.TAGES_DAUERN.weste);
assert.ok(G.TAGES_PROBE.essen < G.TAGES_DAUERN.essen);
assert.ok(G.TAGES_PROBE.fuettern < G.TAGES_DAUERN.fuettern);
assert.ok(G.TAGES_PROBE.auslass < G.TAGES_DAUERN.auslass);

// 5) Näpfe: zwei Hunde, je Futter und Wasser, Wasser bleibt voll
assert.deepEqual(Object.keys(G.NAPF_ORTE).sort(), ["apollo", "odin"]);
for (const id of ["odin", "apollo"]) {
  const ort = G.NAPF_ORTE[id];
  assert.ok(ort.wasserX > ort.futterX, "Wasser steht vor dem Futter");
  assert.ok(ort.futterX > 560 && ort.futterX < 700, "Napf steht in der Küche");
}

// 6) Steine: Aufsteh-Stein und EZ-Aufsteh-Stein nur im normalen Haus und Weihnachtshaus
const normal = G.steinSlots("normal");
const traum = G.steinSlots("traum");
const namen = (slots) => slots.map((s) => s.label);
assert.ok(namen(normal).includes("Aufsteh-Stein"));
assert.ok(namen(normal).includes("EZ-Aufsteh-Stein"));
assert.ok(!namen(traum).includes("Aufsteh-Stein"));
assert.ok(!namen(traum).includes("EZ-Aufsteh-Stein"));
assert.equal(G.STEIN_NAMEN.aufsteh, "Aufsteh-Stein");
assert.equal(G.STEIN_NAMEN.ezaufsteh, "EZ-Aufsteh-Stein");

// 7) Steinflächen überschneiden sich nicht und bleiben im sicheren Bildbereich
const boxen = normal.map((s) => s.hit);
for (let i = 0; i < boxen.length; i++) {
  const [x, y, w, h] = boxen[i];
  assert.ok(w >= 24 && h >= 24, `Klickziel zu klein: ${normal[i].label}`);
  for (let j = i + 1; j < boxen.length; j++) {
    const [x2, y2, w2, h2] = boxen[j];
    const getrennt = x + w <= x2 || x2 + w2 <= x || y + h <= y2 || y2 + h2 <= y;
    assert.ok(getrennt, `${normal[i].label} und ${normal[j].label} überlappen sich`);
  }
}

// 8) Aufsteh-Routine über den Stein: kurze Probe und Echtzeit
{
  const RealDate = Date;
  let jetzt = Date.parse("2026-12-09T06:10:00Z");
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [jetzt])); }
    static now() { return jetzt; }
  };
  const speicher = new Map();
  globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
  const flaeche = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
  globalThis.document = { createElement: flaeche, visibilityState: "visible" };
  globalThis.window = { devicePixelRatio: 1 };
  const haus = (welt) => new G2.House(flaeche(), { welt });
  const tick = (h, sek) => {
    for (let i = 0; i < Math.round(sek / .05); i++) { jetzt += 50; h.update(.05, .05, true); }
  };

  const steinAn = (h, art) => {
    const slots = G.steinSlots("normal");
    const sl = slots.find((q) => q.art === art);
    assert.ok(sl, `Stein ${art} vorhanden`);
    h.command(`stein_${art}`);
  };

  for (const [art, probe] of [["aufsteh", true], ["ezaufsteh", false]]) {
    speicher.clear();
    const h = haus("normal");
    steinAn(h, art);
    assert.ok(h.asleep, `${art}: sie liegt vorher im Bett`);
    assert.equal(h.lf, 2, `${art}: im Schlafzimmer`);
    // Aufwachen nach der Liegezeit (Probe 3 s, Echtzeit 10 s)
    const liege = probe ? 3 : 10;
    tick(h, liege + .2);
    assert.ok(!h.asleep, `${art}: sie ist wach`);
    assert.ok(h.pyjama, `${art}: sie trägt den Schlafanzug`);
    // Danach holt sie die Weste aus dem Kleiderschrank (Ankunft + Zeit am Schrank)
    tick(h, probe ? 12 : 45);
    assert.ok(h.westeAn, `${art}: Weste über dem Schlafanzug`);
    // Danach steht sie am Schrank oder ist schon auf dem Weg zum Morgenkaffee (Senseo).
    assert.ok(Math.abs(h.lx - 458) < 6 || h.kAblauf, `${art}: Weste geholt, dann Morgenkaffee`);
    assert.equal(h.westeAn, true);
  }

  // Ein zweiter Stein-Klick während der laufenden Routine ändert nichts daran
  speicher.clear();
  const h = haus("normal");
  steinAn(h, "aufsteh");
  steinAn(h, "ezaufsteh"); // läuft schon: der Klick wird ignoriert
  tick(h, 12);
  assert.ok(!h.asleep, "zweiter Klick hat nichts umgeworfen");
  assert.ok(h.westeAn, "die kurze Probe ist zu Ende gegangen");
  assert.ok(Math.abs(h.lx - 458) < 6 || h.kAblauf, "sie steht am Kleiderschrank oder geht zum Morgenkaffee");
}
console.log("test-tagesroutine: 8 Gruppen in Ordnung");
