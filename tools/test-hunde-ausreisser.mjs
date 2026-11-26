// Prüfungen: Hunde laufen zu 20 % aus dem Bild, Luni merkt es, ruft sie,
// weist zur Schleusentür, die Hunde kommen schuldbewusst zurück und legen
// sich im Wohnzimmer ab. Nicht an die Morgenroutine gebunden.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

async function ladeEinstieg(datei) {
  const b = await build({ entryPoints: [datei], bundle: true, write: false, format: "esm", platform: "node" });
  return import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
}
const H = await ladeEinstieg("src/game/hunde.ts");
const source = readFileSync("src/game/house.ts", "utf8");
const bundle = await build({
  stdin: { contents: source, resolveDir: path.resolve("src/game"), loader: "ts" },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

/** Umgebung für die Hunde-Welt. */
function umgebung(extra = {}) {
  return {
    hour: 15, luniFloor: 0, luniX: 740, luniSchlaeft: false,
    gardenDoor: 1, gardenWant: 1, cellarDoor: 1, smoke: 0, schlechtesWetter: false,
    ...extra,
  };
}

test("Hund im Garten läuft bei 20 % einmal aus dem Bild – bei 90 % nicht", () => {
  for (const [zufall, erwartet] of [[0.1, true], [0.9, false]]) {
    const welt = new H.HundeWelt(() => zufall);
    const odin = welt.get("odin");
    odin.floor = 0; odin.x = 880; odin.schritte = []; odin.pose = "stand"; odin.gartenZeit = 40;
    for (let i = 0; i < 400 && !odin.weggelaufen; i++) welt.update(0.05, umgebung());
    assert.equal(odin.weggelaufen, erwartet, `Zufall ${zufall}`);
  }
});

test("Rückruf: Hunde kommen schuldbewusst und legen sich im Wohnzimmer ab", () => {
  const welt = new H.HundeWelt(() => 0.1);
  const odin = welt.get("odin");
  odin.floor = 0; odin.x = 890; odin.schritte = []; odin.gartenZeit = 40;
  for (let i = 0; i < 400 && !odin.weggelaufen; i++) welt.update(0.05, umgebung());
  assert.ok(odin.weggelaufen, "Odin ist aus dem Bild");
  assert.equal(welt.weggelaufen().length, 1);

  welt.zurueckInsWohnzimmer(welt.weggelaufen());
  let schuldigGesehen = false;
  for (let i = 0; i < 2000; i++) {
    welt.update(0.05, umgebung());
    if (odin.schuldig) schuldigGesehen = true;
    if (odin.floor === 1 && odin.pose === "lie") break;
  }
  assert.ok(schuldigGesehen, "Hund lief mit gesenktem Kopf und eingezogener Rute");
  assert.equal(odin.weggelaufen, false);
  assert.equal(odin.floor, 1, "Hund ist im Wohnzimmer (1. Stock)");
  assert.ok(odin.x >= 280 && odin.x <= 470, `Hund liegt im Wohnzimmer (x=${odin.x})`);
  assert.equal(odin.pose, "lie", "Hund liegt");
});

test("20 % beim Rauchen: ein Hund draußen läuft weg, Luni steht auf, ruft und weist zur Schleuse", () => {
  const speicher = new Map();
  globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
  const flaeche = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
  globalThis.document = { createElement: flaeche, visibilityState: "visible" };
  globalThis.window = { devicePixelRatio: 1 };

  const alt = Math.random;
  Math.random = () => 0.1;
  try {
    const haus = new G.House(flaeche(), { welt: "adventshaus", clock: { year: 2026, month: 11, day: 22, hour: 15, min: 0 } });
    // Luni raucht im Keller, ein Hund ist draußen.
    haus.lf = 0; haus.lx = 740;
    haus.activity = { id: "raucherstuhl", label: "Raucherstuhl", floor: 0, x: 740, face: 1, state: "sit", expr: "focus", hits: [] };
    haus.holding = true;
    const odin = haus.hunde.get("odin");
    odin.floor = 0; odin.x = 890; odin.schritte = []; odin.gartenZeit = 40; odin.pose = "stand"; odin.gartenZeit = 0;
    haus.gardenDoor = 1; haus.gardenWant = 1;

    const schritte = [];
    let warWeg = false;
    let schuldig = false;
    let liegt = false;
    for (let i = 0; i < 24000; i++) {
      haus.update(0.05);
      if (haus.hunde.weggelaufen().length) warWeg = true;
      const w = haus.kAblauf?.schritte[haus.kAblauf.i]?.was;
      if (w && schritte.at(-1) !== w) schritte.push(w);
      if (odin.schuldig) schuldig = true;
      if (odin.floor === 1 && odin.pose === "lie") liegt = true;
      if (liegt && !haus.kAblauf) break;
    }
    assert.ok(warWeg, "Beim Rauchen lief ein Hund weg");
    assert.ok(schritte.includes("zuDenHundenStehen"), `Luni stand auf (${schritte.join("→")})`);
    assert.ok(schritte.includes("hundeRufenRuf"), "Luni rief die Hunde");
    assert.ok(schritte.includes("schleuseEinweisen"), "Luni zeigte zur Schleusentür");
    assert.ok(schuldig, "Hund kam schuldbewusst zurück");
    assert.ok(liegt, "Hund legte sich im Wohnzimmer hin");
  } finally {
    Math.random = alt;
  }
});

test("Nicht an die Morgenroutine gebunden: funktioniert zu jeder Tageszeit", () => {
  const speicher = new Map();
  globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
  const flaeche = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
  globalThis.document = { createElement: flaeche, visibilityState: "visible" };
  globalThis.window = { devicePixelRatio: 1 };

  const alt = Math.random;
  Math.random = () => 0.05;
  try {
    const haus = new G.House(flaeche(), { welt: "adventshaus", clock: { year: 2026, month: 11, day: 22, hour: 19, min: 30 } });
    haus.lf = 0; haus.lx = 740;
    haus.activity = { id: "raucherstuhl", label: "Raucherstuhl", floor: 0, x: 740, face: 1, state: "sit", expr: "focus", hits: [] };
    haus.holding = true;
    const apollo = haus.hunde.get("apollo");
    apollo.floor = 0; apollo.x = 900; apollo.schritte = []; apollo.pose = "stand"; apollo.gartenZeit = 40;
    haus.gardenDoor = 1; haus.gardenWant = 1;
    let gerufen = false;
    for (let i = 0; i < 24000; i++) {
      haus.update(0.05);
      const w = haus.kAblauf?.schritte[haus.kAblauf.i]?.was;
      if (w === "hundeRufenRuf") { gerufen = true; break; }
    }
    assert.ok(gerufen, "Auch am Abend (19:30) läuft der Rufablauf");
  } finally {
    Math.random = alt;
  }
});

console.log(`\n${n} Hunde-Ausreißer-Prüfungen bestanden`);
