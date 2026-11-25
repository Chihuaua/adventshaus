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
  stdin: { resolveDir: process.cwd(), contents: `export { House, STATIONS } from './src/game/house'; export { luniRigBauen } from './src/game/luni'; export { Sfx, sfx } from './src/game/audio';` },
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

// 3) Aufwachen: 6 bis 8 Stunden nach dem Einschlafen, in der Regel 6:00–7:30; über Mitternacht gerechnet
const w = G.tageswerte(20261224, "normal");
const uhr = (s) => `${String(Math.floor(s / 3600) % 24).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}`;
for (const [e, text] of [[20 * 3600 + 720, "20:12"], [21 * 3600 + 1800, "21:30"], [22 * 3600, "22:00"], [23 * 3600 + 1800, "23:30"], [3600, "01:00"]]) {
  const wach = G.aufwachSekunde(e, w);
  assert.ok(wach >= e + 6 * 3600 && wach <= e + 8 * 3600, `${text}: ${uhr(wach)} liegt nicht 6–8 h danach`);
  assert.ok(wach > e, `${text}: aufwachen liegt in der Zukunft (kein Sofort-Aufwachen)`);
}
// Wer spät genug einschläft, wacht in der Regel zwischen 6:00 und 7:30 auf
for (const e of [22 * 3600, 23 * 3600, 23 * 3600 + 1800]) {
  const tod = G.aufwachSekunde(e, w) % 86400;
  assert.ok(tod >= 6 * 3600 && tod <= 7.5 * 3600, `Einschlafen ${uhr(e)} → ${uhr(tod)} nicht zwischen 6:00 und 7:30`);
}

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

// 6) Steine: Aufsteh und EZ-Aufsteh nur im normalen Haus und Weihnachtshaus
const normal = G.steinSlots("normal");
const traum = G.steinSlots("traum");
const namen = (slots) => slots.map((s) => s.label);
assert.ok(namen(normal).includes("Aufsteh"));
assert.ok(namen(normal).includes("EZ-Aufsteh"));
assert.ok(namen(traum).includes("Aufsteh"), "Aufsteh auch im Traumhaus sichtbar");
assert.ok(namen(traum).includes("EZ-Aufsteh"), "EZ-Aufsteh auch im Traumhaus sichtbar");
assert.equal(G.STEIN_NAMEN.aufsteh, "Aufsteh");
assert.equal(G.STEIN_NAMEN.ezaufsteh, "EZ-Aufsteh");

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

function speicherLeer() { globalThis.__speicher?.clear(); }
let haus2, tick2;
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
  globalThis.__speicher = speicher;
  haus2 = (welt, stunde, min) => new G2.House(flaeche(), { welt, clock: { year: 2026, month: 11, day: 22, hour: stunde, min, sec: 0 } });
  tick2 = (h, sek) => { for (let i = 0; i < Math.round(sek / .05); i++) { jetzt += 50; h.update(.05, .05, true); } };
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
    const liege = probe ? 2 : 5;
    tick(h, liege + .2);
    assert.ok(!h.asleep, `${art}: sie ist wach`);
    assert.ok(h.pyjama, `${art}: sie trägt den Schlafanzug`);
    // Danach holt sie die Weste aus dem Kleiderschrank (Ankunft + Zeit am Schrank)
    tick(h, probe ? 24 : 55);
    assert.ok(h.westeAn, `${art}: Weste über dem Schlafanzug`);
    // Danach steht sie am Schrank oder ist schon auf dem Weg zum Morgenkaffee (Senseo).
    assert.ok(Math.abs(h.lx - 458) < 6 || h.kAblauf, `${art}: Weste geholt, dann Morgenkaffee`);
    assert.equal(h.westeAn, true);
  }

  // Ein zweiter Stein-Klick startet die Routine neu (nie ein stummer Klick)
  speicher.clear();
  const h = haus("normal");
  steinAn(h, "aufsteh");
  tick(h, 1.5);
  steinAn(h, "ezaufsteh");               // Neustart mit Echtzeit-Liegezeit (5 s)
  tick(h, 3.6);
  assert.ok(h.asleep, "nach dem Neustart liegt sie noch (EZ: 5 s)");
  tick(h, 2);
  assert.ok(!h.asleep && h.bedWach, "danach beginnt das Aufwachen");
}
// 9) Echtes Einschlafen am Abend: sie bleibt die Nacht über im Bett und wacht am Morgen auf
{
  const RealDate = Date;
  globalThis.Date = RealDate;
  speicherLeer();
  const h = haus2("normal", 22, 0);
  h.asleep = true; h.pyjama = { top: "#7fc6c2", bottom: "#3f6f8c" }; h.lf = 2; h.lx = 337;
  h.einschlafMerken();
  const uhrStellen = (d, hh, mm) => h.setClock({ year: 2026, month: 11, day: d, hour: hh, min: mm, sec: 0 });
  for (const [d, hh, mm] of [[22, 22, 5], [22, 23, 59], [23, 2, 0], [23, 4, 30], [23, 5, 59]]) {
    uhrStellen(d, hh, mm); tick2(h, 1.2);
    assert.ok(h.asleep, `${d}.${hh}:${mm}: sie schläft noch (keine Sofort-Aufwachen-Falle)`);
  }
  uhrStellen(23, 7, 40); tick2(h, 1.2);
  assert.ok(!h.asleep, "um 7:40 ist sie spätestens wach");
  assert.equal(h.bedWach, "aufsetzen", "sie beginnt mit dem Aufsetzen");
  tick2(h, 16);
  assert.ok(!h.bedWach, "das Aufwachen ist zu Ende");
  assert.equal(h.tagWas, "weste", "danach holt sie die Weste");
}

// 10) Aufsteh greift jederzeit: auch mitten im Abend, in der Dusche und beim Kaffee; Liegezeit bleibt erhalten
{
  for (const [stunde, art] of [[20, "aufsteh"], [22, "ezaufsteh"]]) {
    speicherLeer();
    const h = haus2("normal", stunde, 12);
    h.lf = 1; h.lx = 400; h.pack = 5;
    h.command("stein_ezbett");               // Abend läuft
    tick2(h, 2);
    assert.ok(h.abendAktiv, "Abend läuft");
    h.command(`stein_${art}`);
    assert.ok(!h.abendAktiv && h.asleep && h.tagWas === "aufstehen", `${art}: Abend beendet, sie liegt im Bett`);
    tick2(h, 1.6);
    assert.ok(h.asleep, `${art}: nach 1,6 s liegt sie noch (Liegezeit bleibt erhalten)`);
    tick2(h, art === "aufsteh" ? 2 : 9);
    assert.ok(!h.asleep, `${art}: danach wacht sie auf`);
    assert.ok(h.bedWach, `${art}: das lange Aufwachen läuft`);
    tick2(h, 16);
    assert.ok(h.tagWas === "weste" || h.westeAn, `${art}: Weste folgt`);
  }
  speicherLeer();
  const k = haus2("normal", 15, 12); k.pack = 4;
  k.command("kaffee"); tick2(k, 4);
  assert.ok(k.kAblauf, "Kaffee läuft");
  k.command("stein_aufsteh");
  assert.ok(!k.kAblauf && k.asleep, "Aufsteh bricht den Kaffee ab und startet die Routine");
}
// 11) Aufwachen: genau die gewünschte Reihenfolge – aufsetzen (Decke schieben), Bettkante, gähnen/recken, erst dann aufstehen
{
  speicherLeer();
  const h = haus2("normal", 6, 30);
  h.command("stein_ezaufsteh");
  const phasen = [], dauer = {};
  let letzte = null;
  for (let i = 0; i < 2000 && (h.asleep || h.bedWach); i++) {
    tick2(h, .05);
    if (h.bedWach && h.bedWach !== letzte) { phasen.push(h.bedWach); letzte = h.bedWach; dauer[h.bedWach] = 0; }
    if (h.bedWach) dauer[h.bedWach] += .05;
  }
  assert.deepEqual(phasen, ["aufsetzen", "schieben", "umsetzen", "strecken", "aufstehen"], "Reihenfolge des Aufwachens");
  assert.ok(dauer.strecken > 3.5, "Gähnen und Recken dauern ihre Zeit");
  const gesamt = Object.values(dauer).reduce((a, b) => a + b, 0);
  assert.ok(gesamt > 9 && gesamt < 15, `Echtzeit-Aufwachen dauert ${gesamt.toFixed(1)} s – nicht unnötig lang`);
  assert.equal(h.lf, 2); assert.ok(Math.abs(h.lx - 337) < 2, "sie steht neben dem Bett");
  // Die Probe ist kürzer, zeigt aber dieselben Phasen
  speicherLeer();
  const k = haus2("normal", 6, 30);
  k.command("stein_aufsteh");
  const kurz = [];
  for (let i = 0; i < 2000 && (k.asleep || k.bedWach); i++) { tick2(k, .05); if (k.bedWach && kurz.at(-1) !== k.bedWach) kurz.push(k.bedWach); }
  assert.deepEqual(kurz, phasen, "dieselben Phasen in der Probe");
}

// 12) Der Aufsteh greift in jeder Lage – auch wenn Luni nicht im Bett ist
{
  const lagen = [
    ["im Keller beim Rauchen", (h) => { h.lf = 0; h.lx = 690; h.pack = 3; h.command("raucherstuhl"); tick2(h, 45); }],
    ["auf der Treppe", (h) => { h.lf = 1; h.lx = 200; h.command("gaming"); tick2(h, 3); }],
    ["am Sofa", (h) => { h.command("sofa"); tick2(h, 8); }],
    ["beim Gaming", (h) => { h.lf = 3; h.lx = 338; h.command("gaming"); tick2(h, 6); }],
    ["unter der Dusche", (h) => { h.lf = 2; h.lx = 450; h.command("dusche"); tick2(h, 14); }],
    ["beim Kaffee", (h) => { h.pack = 3; h.command("kaffee"); tick2(h, 6); }],
    ["vor dem großen Fernseher", (h) => { h.command("sofa"); tick2(h, 6); h.tvZoom = "tv_e"; }],
    ["mitten im Abend", (h) => { h.command("stein_ezbett"); tick2(h, 6); }],
    ["im Garten an der Tür", (h) => { h.lf = 0; h.lx = 800; h.command("aussentuer"); tick2(h, 4); }],
    ["mit Zigarette in der Hand", (h) => { h.lf = 0; h.lx = 690; h.pack = 3; h.command("raucherstuhl"); tick2(h, 20); h.command("sofa"); tick2(h, 2); }],
  ];
  for (const [name, vorbereiten] of lagen) {
    speicherLeer();
    const h = haus2("normal", 6, 30);
    try { vorbereiten(h); } catch (e) { throw new Error(`${name}: Vorbereitung scheitert: ${e.message}`); }
    h.command("stein_aufsteh");
    assert.ok(h.asleep && h.lf === 2, `${name}: sie liegt im Bett`);
    assert.ok(h.tagAktiv && h.tagWas === "aufstehen", `${name}: Routine läuft`);
    assert.ok(!h.tvZoom && !h.holding && !h.shPhase && !h.kAblauf && !h.abendAktiv, `${name}: Altes ist beendet`);
    const phasen = [];
    for (let i = 0; i < 4000 && !h.westeAn; i++) { tick2(h, .05); if (h.bedWach && phasen.at(-1) !== h.bedWach) phasen.push(h.bedWach); }
    assert.equal(phasen.join(), "aufsetzen,schieben,umsetzen,strecken,aufstehen", `${name}: volle Aufwach-Folge`);
    assert.ok(h.westeAn, `${name}: Weste angezogen`);
  }
}

// 13) Mimik: keine Station schaut ohne Anlass traurig, streng oder fragend
{
  for (const st of G2.STATIONS) assert.ok(!["think", "sad", "annoyed"].includes(st.expr), `Station ${st.id}: Miene ${st.expr} braucht einen Anlass`);
}
// 14) Nach dem Aufstehen: erst zur Brille auf dem Nachttisch, nehmen, aufsetzen – dann die Weste
{
  speicherLeer();
  const h = haus2("normal", 6, 30);
  h.command("stein_ezaufsteh");
  const folge = []; let brilleWaehrendWach = false, brilleVorWeste = null;
  for (let i = 0; i < 6000 && !h.westeAn; i++) {
    tick2(h, .05);
    if (h.bedWach && h.glassesOn) brilleWaehrendWach = true;
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (w && folge.at(-1) !== w) folge.push(w);
    if (h.tagWas === "weste" && brilleVorWeste === null) brilleVorWeste = h.glassesOn;
  }
  assert.ok(!brilleWaehrendWach, "beim Aufwachen auf dem Bett trägt sie noch keine Brille");
  assert.deepEqual(folge, ["zumKopfende", "handyNehmen", "zumNachttisch", "handyAblegen", "brilleNehmen", "brilleAufsetzen"],
    "erst Handy auf Nachttisch ablegen, dann Brille nehmen und aufsetzen");
  assert.equal(brilleVorWeste, true, "die Brille sitzt, bevor sie zur Weste geht");
  assert.equal(h.glassesRest, null, "keine Brille mehr auf dem Nachttisch");
}

// 15) Weste fließend überziehen: Rücken zum Spieler, kein Aufploppen, Schranktür gleitet sanft
{
  speicherLeer();
  const h = haus2("normal", 6, 30);
  h.westeAn = false; h.pyjama = { top: "#7fc6c2", bottom: "#3f6f8c" }; h.lf = 2; h.lx = 440;
  h.tagStart("weste", false);
  let anteilBeiAn = null, dauer = 0, vorTuer = 0;
  for (let i = 0; i < 2000 && h.tagWas === "weste"; i++) {
    tick2(h, .05);
    if (h.activity?.id === "kleiderschrank") {
      dauer += .05;
      assert.ok(Math.abs(h.wardrobeOpen - vorTuer) < 0.12, "Kleiderschranktür gleitet ohne Ruck");
      vorTuer = h.wardrobeOpen;
    }
    if (h.westeAn && anteilBeiAn === null) anteilBeiAn = h.tagT / h.tagDauer;
  }
  assert.ok(anteilBeiAn >= .75 && anteilBeiAn < .84, `Weste sitzt nahtlos nach dem fließenden Überziehen (${anteilBeiAn})`);
  assert.ok(dauer > 12 && dauer < 18, `am Schrank ${dauer.toFixed(1)} s – nicht unnötig lang`);
  assert.equal(h.wardrobeOpen, 0, "Schrank wieder zu");
}
// 16) Handy-Kette: auf dem Kissen liegen lassen, nach dem Aufstehen nehmen, vor der Weste ablegen
{
  speicherLeer();
  const h = haus2("normal", 6, 30);
  h.command("stein_ezaufsteh");
  const folge = [];
  let handyBei = [];
  let letzteOrt = null;
  for (let i = 0; i < 9000 && !(h.westeAn && !h.tagAktiv && !h.kAblauf); i++) {
    tick2(h, .05);
    if (h.handyOrt !== letzteOrt) { letzteOrt = h.handyOrt; handyBei.push(`${letzteOrt}@${h.bedWach ?? (h.kAblauf?.schritte[h.kAblauf.i]?.was ?? h.tagWas ?? "frei")}`); }
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (w && folge.at(-1) !== w) folge.push(w);
  }
  // Das Handy bleibt während des ganzen Aufwachens auf dem Kissen liegen
  assert.ok(handyBei[0].startsWith("kissen@"), "Handy liegt beim Aufwachen auf dem Kissen");
  assert.ok(handyBei.some(e => e.startsWith("kissen@aufstehen")), "auch beim Aufstehen noch auf dem Kissen");
  // Reihenfolge: Handy vom Kissen → auf Nachttisch ablegen → Brille nehmen & aufsetzen → Weste
  assert.deepEqual(folge, ["zumKopfende", "handyNehmen", "zumNachttisch", "handyAblegen", "brilleNehmen", "brilleAufsetzen"],
    `Handy-Kette: ${folge.join(", ")}`);
  assert.equal(h.handyOrt, "nachttisch", "am Ende liegt das Handy auf dem Nachttisch");
  assert.ok(h.glassesOn, "die Brille sitzt");
  assert.ok(h.westeAn, "die Weste ist an");
  // Das Handy liegt nie gleichzeitig an zwei Orten
  const orte = new Set([h.handyOrt]);
  assert.equal(orte.size, 1);
}

// 17) Sitzende Handynutzung: das Handy kommt aus der Tasche, nicht vom Nachttisch
{
  speicherLeer();
  const h = haus2("normal", 6, 30);
  h.command("stein_aufsteh");
  for (let i = 0; i < 6000 && (h.tagAktiv || h.kAblauf); i++) tick2(h, .05);
  assert.ok(h.westeAn && !h.tagAktiv && !h.kAblauf, "Morgenroutine ist abgeschlossen");
  assert.equal(h.handyOrt, "nachttisch");
  // Der automatische Morgenkaffee würde dazwischenfunken: als erledigt markieren.
  h.tagErledigt.kaffee = 20261122;
  h.lf = 0; h.lx = 690; h.pack = 3;
  h.command("raucherstuhl");
  for (let i = 0; i < 4000 && !h.handy; i++) tick2(h, .05);
  assert.ok(h.handy, "sie nutzt das Handy am Stuhl");
  assert.equal(h.handyOrt, "tasche", "das Handy ist aus der Tasche geholt");
}
// 18) Beine im Liegen vorhanden, kein Rücksprung beim Hinsetzen, Handy-Display nach 2 s aus
{
  // Beine liegen bei aufrichten=0 waagerecht auf der Matratze und gehen bei beineSenken=1 exakt in sit über
  const lieRig = G2.luniRigBauen(338.5, 299.4, { state: "sit", scale: 1.08, bettAufstehen: { aufrichten: 0, beineSenken: 0 } });
  const sitRig = G2.luniRigBauen(337, 313, { state: "sit", scale: 1.08 });
  const endRig = G2.luniRigBauen(337, 313, { state: "sit", scale: 1.08, bettAufstehen: { aufrichten: 1, beineSenken: 1 } });
  assert.ok(lieRig.legNear.hand[0] > 18 && lieRig.legFar.hand[0] > 17, "Beine liegen im Bett nach rechts ausgestreckt");
  assert.deepEqual(endRig.legNear, sitRig.legNear, "nahtloser Übergang in die Bettkanten-Sitzpose (hinteres Bein)");
  assert.deepEqual(endRig.legFar, sitRig.legFar, "nahtloser Übergang in die Bettkanten-Sitzpose (vorderes Bein)");

  speicherLeer();
  const h = haus2("normal", 6, 30);
  h.command("stein_ezaufsteh");
  let ablageBei = -1, uhr = 0, brilleVorAblage = false;
  let vorSchheben = false, zurueckGefallen = false;
  for (let i = 0; i < 6000 && !(h.glassesOn && ablageBei >= 0 && uhr - ablageBei >= 2.3); i++) {
    tick2(h, .05);
    uhr += .05;
    if (h.bedWach === "schieben") vorSchheben = true;
    if (vorSchheben && h.bedWach === "umsetzen") {
      // Beim Übergang in umsetzen bleibt der Oberkörper aufrecht (kein Zurückspringen ins Liegen).
      const r = G2.luniRigBauen(335.5, 308.8, { state: "sit", scale: 1.08, bettAufstehen: { aufrichten: 1, beineSenken: 0 } });
      if (Math.abs(r.bend) > 0.01) zurueckGefallen = true;
    }
    if (h.handyOrt === "nachttisch" && ablageBei < 0) {
      ablageBei = uhr;
      if (h.glassesOn) brilleVorAblage = true;
      assert.ok(h.handyDisplayT > 1.9 && h.handyDisplayT <= 2.0, `Display leuchtet direkt nach Ablegen (${h.handyDisplayT})`);
    }
    if (ablageBei >= 0) {
      const seit = uhr - ablageBei;
      if (seit < 1.85) assert.ok(h.handyDisplayT > 0, `nach ${seit.toFixed(2)} s ist das Display noch an`);
      if (seit > 2.1) assert.equal(h.handyDisplayT, 0, `nach ${seit.toFixed(2)} s ist das Display aus`);
    }
  }
  assert.ok(!zurueckGefallen, "kein Zurückspringen in die Liegeposition");
  assert.ok(!brilleVorAblage, "Handy wird abgelegt, bevor die Brille aufgesetzt wird");
  assert.ok(h.glassesOn, "danach sitzt die Brille");
}

// 19) Raumgebundener Rauch: nur der Raum mit Luni + brennender Zigarette füllt sich
{
  speicherLeer();
  const h = haus2("normal", 11, 30);
  h.gardenDoor = 0; h.gardenWant = 0; h.cellarDoorV = 0; h.cellarDoorWant = 0;
  h.lf = 0; h.lx = 684; h.holding = true; h.smoking = true; h.burnLeft = 180; h.burnTotal = 200;
  tick2(h, 5);
  const raucherVorher = h.getRaumRauch("raucher");
  assert.ok(raucherVorher > 0.05, "Raucherraum füllt sich, solange Luni mit brennender Zigarette dort ist");
  assert.equal(h.getRaumRauch("wohnzimmer"), 0, "Wohnzimmer bleibt rauchfrei");

  // Luni verlässt den Raucherraum mit brennender Zigarette ins Wohnzimmer
  h.smoking = false; h.lf = 1; h.lx = 380;
  tick2(h, 4);
  assert.ok(h.getRaumRauch("raucher") < raucherVorher, "Raucherraum füllt sich nach Verlassen NICHT weiter");
  const wohnVorher = h.getRaumRauch("wohnzimmer");
  assert.ok(wohnVorher > 0.03, "Wohnzimmer füllt sich, solange Luni mit brennender Zigarette dort steht");

  // Luni geht weiter in die Küche: Wohnzimmer baut sofort ab, Küche füllt sich
  h.lf = 1; h.lx = 620;
  tick2(h, 4);
  assert.ok(h.getRaumRauch("wohnzimmer") < wohnVorher, "Wohnzimmer hört nach Verlassen sofort auf sich zu füllen");
  assert.ok(h.getRaumRauch("kueche") > 0.03, "Küche füllt sich nun stattdessen");
}

// 20) Hörbare Schritte: bekleidet kräftiger, barfuß leiser – aber niemals lautlos
{
  const pegel = [];
  const testSfx = new G2.Sfx();
  testSfx.ctx = {
    currentTime: 0, sampleRate: 24000,
    createBuffer: (_, len, sr) => ({ duration: len / sr, getChannelData: () => new Float32Array(len) }),
    createBufferSource: () => ({ connect() {}, start() {} }),
    createBiquadFilter: () => ({ frequency: { value: 0 }, Q: { value: 0 }, connect() {} }),
    createOscillator: () => ({ frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }),
    createGain: () => {
      const g = { spitzen: [], gain: { value: 0, setValueAtTime(v) { if (v > 0.001) g.spitzen.push(v); }, exponentialRampToValueAtTime(v) { if (v > 0.001) g.spitzen.push(v); } }, connect() {} };
      pegel.push(g);
      return g;
    },
  };
  testSfx.master = { connect() {} };
  testSfx.step(1, false);
  const normalMax = Math.max(...pegel.flatMap(g => g.spitzen));
  pegel.length = 0;
  testSfx.step(1, true);
  const barfussMax = Math.max(...pegel.flatMap(g => g.spitzen));
  assert.ok(barfussMax >= 0.12, `Barfuß-Schritt ist hörbar und nicht lautlos (${barfussMax})`);
  assert.ok(normalMax > barfussMax * 1.35, `Bekleideter Schritt (${normalMax}) ist kräftiger als barfuß (${barfussMax})`);

  // Im Haus: barfuß im Schlafanzug ruft sfx.step(..., true), in Tageskleidung sfx.step(..., false)
  const schritte = [];
  const origStep = G2.sfx.step.bind(G2.sfx);
  G2.sfx.step = (p, b) => { schritte.push([p, b]); };
  try {
    speicherLeer();
    const h = haus2("normal", 7, 0);
    h.pyjama = { top: "#7fc6c2", bottom: "#3f6f8c" }; h.lf = 2; h.lx = 310;
    h.command("kleiderschrank");
    tick2(h, 2.5);
    assert.ok(schritte.length >= 2 && schritte.every(s => s[1] === true), "im Schlafanzug barfuß hörbare Schritte");
    schritte.length = 0;
    h.pyjama = null; h.outfit = "dressed"; h.lf = 1; h.lx = 200;
    h.command("esstisch");
    tick2(h, 3);
    assert.ok(schritte.length >= 3 && schritte.every(s => s[1] === false), "in Tageskleidung normale Schritte");
  } finally {
    G2.sfx.step = origStep;
  }
}
console.log("test-tagesroutine: 20 Gruppen in Ordnung");
