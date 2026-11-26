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

test("Zeiten aus dem Senseo-Datenblatt: 60 s Aufheizen, 30 s Brühen, Tank 1,4 l in 14 s, 2 Stopfwiederholungen × 1,8 s", () => {
  assert.equal(G.KAFFEE_ZEIT.aufheizen, 60);
  assert.equal(G.KAFFEE_ZEIT.bruehen, 30);
  assert.equal(G.KAFFEE_ZEIT.fuellen, 14);
  assert.equal(G.KAFFEE_ZEIT.stopfen, 3.6);
  assert.equal(G.TASSE_VERGESSEN, 0.23);
  assert.equal(G.MAX_TASSEN_UNTEN, 3);
});

test("Kaffee-Stein: ohne Zigaretten stopft sie zwei, während die Senseo beim ersten Kaffee aufheizt; dazwischen Pause am Fenster", () => {
  speicher.clear();
  const h = haus("normal"); h.pack = 0; h.cigs = 0;
  h.command("stein_kaffee");
  assert.ok(h.kAblauf?.probe, "Kaffee-Stein = kurze Probe");
  const folge = laufen(h);
  const iStopfen = folge.indexOf("stopfen");
  assert.equal(folge.filter((x) => x === "stopfen").length, 1, "einmal stopfen (zwei Zigaretten)");
  // Senseo-Reihenfolge: einschalten → stopfen → zurück zur Maschine → Vibration (Schritte der Senseo bleiben unverändert)
  assert.ok(folge.indexOf("power") < iStopfen && iStopfen < folge.indexOf("knopfLinks"),
    "gestopft wird direkt nach dem Einschalten, bevor sie zur Maschine geht");
  assert.equal(folge[iStopfen - 1], "zumTisch");
  assert.ok(folge.indexOf("power") < folge.indexOf("zumTisch"), "erst einschalten, dann an den Tisch");
  // Alter Automat (nur Adventshaus): Reihenfolge und Blickrichtung am Automaten sowie Gartentür von Hand
  {
    speicher.clear();
    const autoH = haus("adventshaus");
    autoH.command("stein_ezkaffee");
    assert.equal(autoH.lx, G.KSTAND.maschine, "Automat-Teststein: Luni beginnt direkt an der Maschine");
    assert.equal(autoH.lf, 1, "Automat-Teststein: Luni beginnt im Erdgeschoss an der Maschine");
    const autoFolge = [];
    const mimik = {};
    let automatischGeoeffnet = false;
    let vonHandGeoeffnet = false;
    let gardenOffenBeimRauchen = false;
    let warGartentuerAuf = false;
    for (let i = 0; i < 60000 && autoH.kAblauf; i++) {
      const w = autoH.kAblauf?.schritte[autoH.kAblauf.i]?.was;
      if (w && autoFolge.at(-1) !== w) autoFolge.push(w);
      const geradeHandgriff = w === "gartentuerAuf" || autoH.doorHand;
      const bereitsDurchHandOffen = warGartentuerAuf;
      if (autoH.gardenDoor > 0.05 && !geradeHandgriff && !bereitsDurchHandOffen) automatischGeoeffnet = true;
      if (w === "gartentuerAuf") { vonHandGeoeffnet = true; warGartentuerAuf = true; }
      if (w === "tasseKeller" && autoH.gardenDoor > 0.95) gardenOffenBeimRauchen = true;
      if (w && autoH.kPose && ["schrittZurueck1", "schrittZurueck2", "blickZurMaschine", "zuschauen", "angeekelt", "traurig", "durchatmen", "kameraSchulterzucken"].includes(w)) {
        const bisher = mimik[w] ?? { exprs: new Set(), lidMin: 1, lidMax: 0, state: null, frontal: false };
        if (autoH.kPose.expr) bisher.exprs.add(autoH.kPose.expr);
        if (typeof autoH.kPose.lid === "number") {
          bisher.lidMin = Math.min(bisher.lidMin, autoH.kPose.lid);
          bisher.lidMax = Math.max(bisher.lidMax, autoH.kPose.lid);
        }
        bisher.state = autoH.kPose.state ?? bisher.state;
        bisher.frontal = bisher.frontal || !!autoH.kPose.frontal;
        mimik[w] = bisher;
      }
      autoH.update(.05);
    }
    const ik = autoFolge.indexOf("knopf");
    assert.equal(autoFolge[ik + 1], "zumTisch", "Automat: nach Startknopf an den Tisch");
    assert.equal(autoFolge[ik + 2], "stopfen", "Automat: am Tisch stopfen (3,6 s)");
    assert.ok(autoFolge.includes("aufVibrationWarten") && autoFolge.includes("schrittZurueck1") && autoFolge.includes("schrittZurueck2"), "Automat: wartet links neben Maschine und macht zwei Schritte zurück");
    assert.ok(!autoFolge.includes("zoegernderAnsatz") && !autoFolge.includes("vibrierZurueck"), "Automat: langsamer Schritt nach vorn wurde gestrichen");
    assert.ok(mimik.schrittZurueck1?.exprs.has("surprised") && mimik.schrittZurueck2?.exprs.has("surprised"), "Automat: große Augen beim Vibrieren");
    assert.equal(mimik.schrittZurueck1?.lidMin, 0, "Automat: Lider beim Start noch offen");
    assert.ok(mimik.zuschauen?.lidMax > 0.08 && mimik.zuschauen?.lidMax <= 0.15, "Automat: Lider kneifen bei Milch nur leicht zu, viel Auge bleibt sichtbar");
    const kostReihe = ["schluck", "angeekelt", "durchatmen", "schluck2", "traurig", "kameraSchulterzucken", "zumGartentuer"];
    let abKost = 0;
    for (const s of kostReihe) { const i = autoFolge.indexOf(s, abKost); assert.ok(i >= 0, `Automat-Verkostung fehlt oder falsch: ${s}`); abKost = i + 1; }
    assert.ok(mimik.angeekelt?.exprs.has("ekel") && mimik.traurig?.exprs.has("sad"), "Automat: angeekelt mit normalen Brauen, traurig erst nach dem zweiten Schluck");
    assert.equal(mimik.kameraSchulterzucken?.state, "shrug", "Automat: Schulterzucken nach dem zweiten Schluck");
    assert.ok(mimik.kameraSchulterzucken?.frontal, "Automat: Blick zur Kamera beim Schulterzucken");
    assert.ok(autoFolge.includes("gartentuerAuf"), "Automat: Gartentür wird von Hand geöffnet");
    assert.ok(!automatischGeoeffnet, "Automat: Gartentür öffnet sich nie von allein");
    assert.ok(vonHandGeoeffnet, "Automat: Handgriff gartentuerAuf wurde ausgeführt");
    assert.ok(gardenOffenBeimRauchen, "Automat: Gartentür ist für das Rauchen offen");
  }
  // Zwischen den Kaffees: am Küchenstuhl sitzen und hinausschauen, dann wieder aufstehen.
  const iPause = folge.indexOf("pauseFenster");
  assert.ok(iPause > folge.indexOf("rauchen") && iPause < folge.lastIndexOf("power"), "Pause liegt zwischen den beiden Kaffees");
  assert.deepEqual(folge.slice(iPause - 1, iPause + 2), ["zumPausenstuhl", "pauseFenster", "pauseAufstehen"]);
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
  const zufall = Math.random; Math.random = () => 0.4;   // feste Zufallswerte: Schluckzahl und Türregeln bleiben reproduzierbar
  for (let i = 0; i < 60000 && h.kAblauf; i++) {
    h.update(.05);
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (w === "tasseNehmen") fuellVorSchluck = h.kaffee.tasseFuell;
    if (w === "kurzWarten") fuellNachSchluck = h.kaffee.tasseFuell;
    if (w === "rauchen" && h.gardenWant >= 0.5) gartenOffenVorRauch = true;
  }
  Math.random = zufall;
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

test("Morgenroutine: offene Schleusentür wird nicht noch einmal geöffnet; nach der zweiten Tasse Hunde rein, alle Türen zu", () => {
  const alt = Math.random;
  const draussen = (h) => ["odin", "apollo"].filter((id) => h.hunde.istImGarten(id));
  const hundeRaus = (h) => { for (const [id, x] of [["odin", 880], ["apollo", 905]]) { const d = h.hunde.get(id); d.floor = 0; d.x = x; d.schritte = []; d.gartenPause = 0; d.gerufen = false; d.gartenZeit = 0; } };
  const faelle = [
    // [Name, Schleuse zu Beginn offen, Gartentür vor der letzten Rauchpause offen, Hunde dann draußen]
    ["Schleuse offen, Garten offen, beide Hunde draußen", true, true, true],
    ["Garten zu, beide Hunde warten draußen", false, false, true],
    ["alles zu, die Schleusentür würde sonst vergessen", false, false, false],
  ];
  for (const [name, schleuse, garten, hunde] of faelle) {
    speicher.clear();
    // Hunde-Welt mit festem Zufall bauen, damit der 20-%-Ausreißer diesen
    // Tür-/Hunde-Test nicht zufällig stört (er hat einen eigenen Test).
    Math.random = () => 0.5;
    const h = haus("normal"); h.pack = 4; h.gardenDoor = 0; h.gardenWant = 0;
    h.cellarDoorV = schleuse ? 1 : 0; h.cellarDoorWant = schleuse ? 1 : 0;
    h.command("stein_kaffee");
    let griffBeiOffenerTuer = 0, rufen = false, gartenZu = false, rauchen = 0, letzter = "";
    try {
      for (let i = 0; i < 90000 && h.kAblauf; i++) {
        Math.random = () => (h.tuerHinter ? 0.01 : 0.5);   // „Tür hinter sich schließen vergessen“ erzwingen
        h.update(.05);
        const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
        if (w !== letzter) {
          letzter = w;
          // Beginn der letzten Rauchpause: Türen und Hunde wie im Fall vorgegeben (unabhängig vom Zufallswetter).
          if (w === "rauchen" && ++rauchen === 2) {
            h.gardenDoor = garten ? 1 : 0; h.gardenWant = garten ? 1 : 0;
            if (hunde) hundeRaus(h);
          }
        }
        if (schleuse && w === "zumRaucherraum" && h.doorHandT >= 0) griffBeiOffenerTuer++;
        if (w === "hundeRufen") rufen = true;
        if (w === "gartentuerZu") gartenZu = true;
      }
      for (let i = 0; i < 100; i++) { Math.random = () => (h.tuerHinter ? 0.01 : 0.5); h.update(.05); }
    } finally { Math.random = alt; }
    assert.equal(rauchen, 2, `${name}: zwei Rauchpausen`);
    assert.equal(griffBeiOffenerTuer, 0, `${name}: offene Schleusentür wird nicht noch einmal geöffnet`);
    assert.equal(draussen(h).length, 0, `${name}: beide Hunde sind wieder im Haus`);
    assert.ok(h.gardenWant < .5 && h.gardenDoor < .5, `${name}: Gartentür ist zu`);
    assert.ok(h.cellarDoorWant < .5, `${name}: Schleusentür ist zu`);
    assert.equal(h.lf, 1, `${name}: danach ist sie oben in der Küche`);
    if (hunde) assert.ok(rufen, `${name}: sie ruft die Hunde herein`);
    if (garten) assert.ok(gartenZu, `${name}: sie schließt die Gartentür`);
  }
});

test("Klick auf die Senseo (nur eine Tasse): kein Hunde-Zuruf, keine neuen Schritte", () => {
  speicher.clear();
  const h = haus("normal"); h.pack = 4;
  h.command("kaffee");
  assert.ok(!h.kAblauf.schritte.some((s) => ["hundeRufen", "gartentuerZu", "tuerFuerHunde", "schleuseMerken"].includes(s.was)));
});

console.log(`\n${n} Kaffee-Tests bestanden.`);
