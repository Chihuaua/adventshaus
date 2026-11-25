import assert from "node:assert/strict";
import { build } from "esbuild";

// Senseo-Kaffee und Tee aus dem Schrank: Ablauf im echten Haus, kurze Probe.
const b = await build({
  stdin: { resolveDir: process.cwd(), contents: `
    export { House } from './src/game/house';
    export * from './src/game/kaffee';
    export { steinSlots } from './src/game/steine';` },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
const speicher = new Map();
globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
const flaeche = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
globalThis.document = { createElement: flaeche, visibilityState: "visible" };
globalThis.window = { devicePixelRatio: 1 };
const haus = (welt) => new G.House(flaeche(), { welt, clock: { year: 2026, month: 11, day: 22, hour: 15, min: 12 } });
let n = 0;
const test = (name, f) => { f(); n++; console.log(`OK  ${name}`); };

/** Lässt den Ablauf laufen und merkt sich die Schritte in ihrer Reihenfolge. */
function laufen(h, max = 60000) {
  const folge = [];
  for (let i = 0; i < max && h.kAblauf; i++) {
    h.update(.05);
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (w && folge.at(-1) !== w) folge.push(w);
  }
  return folge;
}

test("Zeiten aus dem Senseo-Datenblatt: 60 s Aufheizen, 30 s Brühen, Tank 1,4 l in 14 s, 2 Stopfwiederholungen", () => {
  assert.equal(G.KAFFEE_ZEIT.aufheizen, 60);
  assert.equal(G.KAFFEE_ZEIT.bruehen, 30);
  assert.equal(G.KAFFEE_ZEIT.fuellen, 14);
  assert.equal(G.KAFFEE_ZEIT.stopfen, 2.7);
  assert.equal(G.TASSE_VERGESSEN, 0.23);
  assert.equal(G.MAX_TASSEN_UNTEN, 3);
});

test("Kaffee-Stein: ohne Zigaretten erst zwei stopfen, dann zweimal Kaffee → Zigarette", () => {
  speicher.clear();
  const h = haus("normal"); h.pack = 0; h.cigs = 0;
  h.command("stein_kaffee");
  assert.ok(h.kAblauf?.probe, "Kaffee-Stein = kurze Probe");
  const folge = laufen(h);
  assert.equal(folge[0], "zumTisch");
  assert.equal(folge[1], "stopfen", "ursprüngliche Stopfanimation vor dem ersten Kaffee");
  const reihenfolge = ["tankNehmen", "hahnAuf", "fuellen", "hahnZu", "tankEinsetzen", "schrankAuf", "doseNehmen", "doseAbstellen",
    "doseAuf", "deckelAuf", "padRaus", "muellAuf", "padWeg", "muellZu", "padNehmen", "padEinlegen", "deckelZu", "doseZu",
    "doseZurueck", "tasseHolen", "tasseUnter", "power", "schrankZu", "aufheizen", "knopfLinks", "durchlaufen", "tasseRaus",
    "tasseAbstellen", "kuehlAuf", "milchNehmen", "kuehlZu", "eingiessen", "kuehlAuf2", "milchZurueck", "kuehlZu2", "tasseNehmen",
    "zumRaucherraum", "tasseKeller", "rauchen", "tassenHolen"];
  let ab = 0;
  for (const s of reihenfolge) { const i = folge.indexOf(s, ab); assert.ok(i >= 0, `Schritt fehlt oder falsch einsortiert: ${s}`); ab = i; }
  assert.equal(folge.filter((s) => s === "rauchen").length, 2, "zwei Runden");
  const k = h.kaffee;
  assert.equal(k.schrank, 0, "Schrank zu"); assert.equal(k.kuehl, 0, "Kühlschrank zu"); assert.equal(k.muell, 0, "Mülltür zu");
  assert.equal(k.milch, "kuehl"); assert.equal(k.dose, "zuhause"); assert.equal(k.tank, "maschine");
  assert.equal(h.pack, 0, "beide gestopften Zigaretten geraucht");
  assert.equal(k.hahnKueche, false);
  assert.ok(k.tassenSpuele + k.tassenUnten === 2, "beide Tassen: neben der Spüle oder unten vergessen");
});

test("Mit Zigaretten wird nicht gestopft; Klick auf die Senseo: 1–2 Schluck trinken, Gartentür auf, dann rauchen", () => {
  speicher.clear();
  const h = haus("weihnacht"); h.pack = 4; h.gardenDoor = 0; h.gardenWant = 0;
  h.command("kaffee");
  assert.ok(h.kAblauf && !h.kAblauf.probe);
  assert.ok(!h.kAblauf.schritte.some((s) => s.was === "stopfen"));
  assert.equal(h.kAblauf.schritte.filter((s) => s.was === "rauchen").length, 1);

  let fuellVorSchluck = 0, fuellNachSchluck = 1, gartenOffenVorRauch = false;
  for (let i = 0; i < 60000 && h.kAblauf; i++) {
    h.update(.05);
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (w === "tasseNehmen") fuellVorSchluck = h.kaffee.tasseFuell;
    if (w === "kurzWarten") fuellNachSchluck = h.kaffee.tasseFuell;
    if (w === "rauchen" && h.gardenWant >= 0.5) gartenOffenVorRauch = true;
  }
  assert.ok(fuellVorSchluck > 0.95 && fuellNachSchluck < fuellVorSchluck - 0.1, "1–2 Schluck Kaffee in der Küche getrunken");
  assert.ok(gartenOffenVorRauch && h.gardenDoor > 0.5, "vor dem Rauchen in der Schleuse Tür zum Garten geöffnet");

  // Station "tabak": höchstens 2 Stopfwiederholungen (statt endloser Schleife)
  speicher.clear();
  const s = haus("normal"); s.lf = 1; s.lx = 741; s.cigs = 0; s.pack = 0;
  s.command("tabak");
  let stopfSchritte = 0, warTabak = false;
  for (let i = 0; i < 400; i++) {
    s.update(.05);
    if (s.activity?.id === "tabak") { warTabak = true; stopfSchritte++; }
    else if (warTabak) break;
  }
  assert.notEqual(s.activity?.id, "tabak", "Stopf-Aktivität endet nach 2 Wiederholungen von selbst");
  assert.ok(stopfSchritte * 0.05 >= 2.6 && stopfSchritte * 0.05 <= 3.1, `genau 2 Stopfwiederholungen (${(stopfSchritte * 0.05).toFixed(2)} s)`);
});

test("Vergessene Tassen: 23 % bleiben unten, nie mehr als drei, dann nimmt sie alle mit", () => {
  const alt = Math.random;
  try {
    Math.random = () => 0.1;   // immer vergessen
    speicher.clear();
    const h = haus("normal"); h.pack = 9;
    for (let r = 0; r < 4; r++) { h.command("kaffee"); laufen(h); assert.ok(h.kaffee.tassenUnten <= 3, `Runde ${r}: höchstens drei unten`); }
    // Spätestens wenn drei unten stehen, nimmt sie alle mit hoch.
    assert.equal(h.kaffee.tassenSpuele, 3, "die drei vergessenen Tassen sind ausgespült neben der Spüle");
    assert.ok(h.kaffee.tassenUnten < 3);
  } finally { Math.random = alt; }
});

test("Gesundheitstee: Kanne aus dem rechten Unterschrank holen und danach zurückstellen", () => {
  speicher.clear();
  const h = haus("normal");
  assert.equal(h.kaffee.kanne, "schrank");
  h.command("tee");
  let warTheke = false, warTee = false;
  for (let i = 0; i < 5000; i++) {
    h.update(.05);
    if (h.kaffee.kanne === "theke") warTheke = true;
    if (h.activity?.id === "tee") warTee = true;
    if (warTee && !h.kAblauf && h.kaffee.kanne === "schrank" && h.activity?.id !== "tee") break;
  }
  assert.ok(warTheke && warTee, "Kanne stand auf der Arbeitsfläche, Tee wurde getrunken");
  assert.equal(h.kaffee.kanne, "schrank"); assert.equal(h.kaffee.schrank, 0);
});

test("Klick des Spielers bricht ab und räumt auf; Traum- und Gruselhaus ohne Senseo-Ablauf", () => {
  speicher.clear();
  const h = haus("normal"); h.pack = 3;
  h.command("kaffee");
  for (let i = 0; i < 300; i++) h.update(.05);
  h.nutzerEingabe = true; h.command("sofa"); h.nutzerEingabe = false;
  assert.ok(!h.kAblauf); assert.equal(h.kaffee.tank, "maschine"); assert.equal(h.kaffee.hahnKueche, false);
  for (const welt of ["traum", "gruesel"]) { const t = haus(welt); t.command("kaffee"); t.update(.05); assert.ok(!t.kAblauf, welt); }
});

test("Kaffee-Steine nur im normalen Haus und Weihnachtshaus", () => {
  const art = (w) => G.steinSlots(w).map((s) => s.art);
  for (const w of ["normal", "weihnacht"]) assert.ok(art(w).includes("kaffee") && art(w).includes("ezkaffee"), w);
  // Neu: alle Steine sind in allen Häusern sichtbar (Aktionen bleiben weltabhängig).
  for (const w of ["traum", "gruesel"]) assert.ok(art(w).includes("kaffee"), w);
});

test("Körperhaltung, Armrichtungen und fließende Schranktüren beim Stopfen und Kaffeekochen", () => {
  // Schrank- und Kühlschrankgriffe gleiten kontinuierlich ohne Sprung über ihren Drehkreis
  for (const fn of [G.schrankGriffPos, G.muellGriffPos, G.kuehlGriffPos]) {
    let vor = fn(448, 0);
    for (let i = 1; i <= 40; i++) {
      const p = fn(448, i / 40);
      assert.ok(Math.hypot(p[0] - vor[0], p[1] - vor[1]) < 3.2, "Türgriff gleitet ohne Sprung");
      vor = p;
    }
  }
  // Während des gesamten Ablaufs greift kein Arm in Seitenansicht durch den Rumpf nach hinten,
  // und an Spüle/Senseo-Arbeitsplatte steht Luni mit dem Rücken zum Spieler.
  speicher.clear();
  const h = haus("normal"); h.pack = 0; h.cigs = 0;
  h.command("stein_kaffee");
  const rueckenSchritte = new Set();
  for (let i = 0; i < 60000 && h.kAblauf; i++) {
    h.update(.05);
    const kp = h.kPose;
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (!kp || h.cur) continue;
    if (kp.back && w) rueckenSchritte.add(w);
    if (!kp.back && kp.face) {
      for (const ziel of [kp.hand, kp.hand2]) {
        if (!ziel) continue;
        assert.ok((ziel[0] - h.lx) * kp.face >= -0.5, `${w}: Hand (${ziel[0].toFixed(1)}) greift nicht hinter den Rücken (${h.lx}, face=${kp.face})`);
      }
      if (kp.elbow !== undefined) assert.equal(kp.elbow, 1, `${w}: natürlicher Ellbogen nach unten`);
    }
  }
  for (const s of ["fuellen", "deckelAuf", "padRaus", "padEinlegen", "power", "knopfLinks"]) {
    assert.ok(rueckenSchritte.has(s), `${s}: Rücken zum Spieler an der Arbeitsplatte`);
  }
});

console.log(`\n${n} Kaffee-Tests bestanden.`);
