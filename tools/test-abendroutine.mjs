import assert from "node:assert/strict";
import { build } from "esbuild";

const b = await build({ stdin: { contents: `export { House, STATIONS } from './src/game/house';
  export { steinSlots, steinAn } from './src/game/steine'; export { sfx } from './src/game/audio';
  export * from './src/game/abendroutine'; export * from './src/game/zahnpflege';
  export { WaschbeckenKlang } from './src/game/audio/waschbecken';`, resolveDir: process.cwd() },
  bundle: true, write: false, format: "esm", platform: "node" });
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
const canvas = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
globalThis.document = { createElement: canvas, visibilityState: "visible" };
globalThis.window = { devicePixelRatio: 1 };
const datum = (year, month, day, hour = 11) => ({ year, month, day, hour, min: 12 });
const haus = (welt, clock = datum(2026, 11, 22)) => new G.House(canvas(), { welt, clock });
let ton = [];
G.sfx.zahnpflege = art => ton.push(art);

for (const w of ["normal", "weihnacht", "traum", "gruesel"]) {
  const h = haus(w), slots = G.steinSlots(w), erlaubt = ["normal", "weihnacht"].includes(w);
  const bett = slots.find(s => s.aktion === "abend");
  assert.equal(!!bett, erlaubt);
  assert.equal(h.steinStationen.filter(s => s.id === "stein_bett").length, Number(erlaubt));
  if (bett) {
    const s = G.STATIONS.find(s => s.id === "stein_bett"); assert.deepEqual(s.hits, [bett.hit]);
    assert.equal(G.steinAn(slots, bett.x, bett.y - 8), bett);
    h.setClock(datum(2026, 11, 22, 23)); h.step(.04);
    assert.equal(h.abendAktiv, false, "keine automatische Startuhrzeit");
  } else {
    h.command("stein_bett"); assert.equal(h.abendAktiv, false); assert.equal(h.shPhase, null);
  }
}
console.log("OK  Bett-Stein: zwei Welten, ein Fokusziel, kein Zeitplan");

const kleid = { top: "#7fc6c2", bottom: "#4a7a6a" };
for (const [d, saison] of [[datum(2026,9,30),false],[datum(2026,10,1),true],[datum(2027,1,1),true],
  [datum(2026,4,5),true],[datum(2026,4,6),true],[datum(2026,4,7),false],
  [datum(2027,3,28),true],[datum(2027,3,29),true],[datum(2027,3,30),false],
  [datum(2024,4,1),true],[datum(2024,4,2),false],[datum(2038,4,26),true],[datum(2038,4,27),false]]) {
  assert.equal(G.flauschzeit(d), saison);
  for (const w of ["traum", "gruesel"]) assert.equal(G.pyjamaStoff(kleid,d,w), kleid);
  for (const w of ["normal", "weihnacht"]) {
    const stoff = G.pyjamaStoff(kleid,d,w); assert.equal(!!stoff.flausch, saison);
    if (saison) for (const col of [stoff.top, stoff.bottom]) assert.ok(col.slice(1).match(/../g).every(v => parseInt(v,16) >= 148));
    else assert.deepEqual([stoff.top, stoff.bottom], [kleid.top, kleid.bottom]);
  }
}
console.log("OK  Winterstoff: 1. Oktober bis Ostermontag, auch bei Monatswechsel");

function durchlauf(h, starten = true) {
  ton = [];
  if (starten) h.command("stein_bett");
  const folge = [];
  let gestartet = false, schaum = false, gewaschen = false, mitTube = false;
  for (let i = 0; i < 8000; i++) {
    h.step(.05); gestartet ||= h.abendAktiv;
    const ph = h.shPhase ?? h.bedEinstieg ?? h.bettHandy?.phase ?? (h.lieDown ? "liegen" : h.sleepPhase);
    if (ph && folge.at(-1) !== ph) folge.push(ph);
    const z = h.zahnpflegeBild();
    if (z) {
      assert.ok(h.glassesOn && !h.glassesInSink && h.cabinetOpen > .99);
      if (z.ph === "zPaste") mitTube ||= z.tubeHand && z.buersteHand && z.belag > .5;
      if (z.ph === "zPutzen") schaum ||= z.schaum > .95;
      if (z.ph === "zWaschen") gewaschen ||= z.buersteHand && z.fluss === 1 && z.belag === 0;
      if (z.ph === "zZurueck") assert.equal(z.fluss, 0);
    }
    if (ph === "bBrush") { assert.equal(h.brushInHand,true); assert.equal(h.schnappschuss().brushInCab,true); }
    if (ph === "bedPajama") {
      assert.ok(h.brushInCab && !h.brushInHand); assert.equal(h.cabinetOpen,0); assert.ok(h.glassesOn);
    }
    if (h.bettHandy && ph !== "wurf") {
      assert.ok(h.glassesOn && !h.asleep && !h.lieDown && !h.water);
      assert.equal(h.lf,2); assert.equal(h.bedKleidungAn,"dressed");
      if (ph === "anruf") assert.equal(h.bettHandy.bild().pose.ohr,1);
    }
    if (ph === "zPutzen" || ph === "video") h.command("stein_bett");
    if (gestartet && h.asleep) break;
  }
  let letzte = -1;
  for (const ph of ["waterOn","washHair","waterOff","stepOut","gPick","zNehmen","zTube","zPaste","zTubeZurueck",
    "zPutzen","zGurgeln","zSpucken","zHahnAuf","zWaschen","zHahnZu","zZurueck","bTake","bBrush","bPut","kClose",
    "bedPants","bedPajama","bedClose","umschlagen","setzen","fuesse","greifen","liegen","holen","video","ansOhr",
    "anruf","einstecken","abnehmen","wurf","settle"]) {
    const idx = folge.indexOf(ph); assert.ok(idx > letzte, `${ph}: falsche oder fehlende Phase in ${h.welt}`); letzte = idx;
    assert.equal(folge.filter(v => v === ph).length,1, "kein Doppelstart");
  }
  assert.ok(mitTube && schaum && gewaschen);
  assert.ok(ton.filter(k => k === "putzen").length >= 10 && ton.filter(k => k === "gurgeln").length >= 4);
  assert.equal(ton.filter(k => k === "spucken").length,1);
  assert.ok(h.asleep && !h.abendAktiv && !h.bettHandy && !h.glassesOn && !h.glassesInHand);
  assert.deepEqual([h.glassesRest.x, h.glassesRest.y], [401,297]); assert.equal(h.shPhase,null);
}

for (const welt of ["normal", "weihnacht"]) {
  const h = haus(welt); durchlauf(h); assert.equal(h.bedPyjama.flausch,true);
  durchlauf(h); // erneuter Steindruck aus dem Schlaf: erst aufstehen und Brille aufnehmen.
  const sommer = haus(welt,datum(2026,7,5)); sommer.outfit = "towel"; sommer.glassesOn = false; sommer.glassesInSink = true;
  durchlauf(sommer); assert.ok(!sommer.bedPyjama.flausch);
  const solo = haus(welt); solo.command("dusche");
  for (let i=0;i<6000 && solo.shPhase;i++) solo.step(.05);
  assert.ok(!solo.shPhase && !solo.abendAktiv && solo.glassesInSink); assert.equal(solo.outfit,"towel");
  solo.command("bett"); assert.ok(solo.bedEinstieg); assert.equal(solo.pyjama,null);
}
console.log("OK  Durchgaengiger Abend in beiden Welten, Wiederanlauf, Gegenstaende, Brillenwurf und Einzelklicks");

const bad = haus("normal"); bad.command("dusche");
for (let i = 0; i < 3000 && bad.shPhase !== "washHair"; i++) bad.step(.05);
assert.equal(bad.shPhase,"washHair"); bad.command("stein_bett"); assert.ok(bad.abendAktiv);
for (let i = 0; i < 7000 && !bad.asleep; i++) {
  bad.step(.05); assert.notEqual(bad.shPhase,"toWardrobe","die laufende Dusche wird nicht wiederholt");
}
assert.ok(bad.asleep && bad.glassesRest);

const haende = new G.BettHandy(); haende.tick(2); assert.equal(haende.bild().pose.quer,1);
haende.tick(8.5); assert.equal(haende.phase,"anruf"); assert.equal(haende.bild().pose.ohr,1);
haende.tick(300); assert.ok(haende.fertig); assert.ok(!haende.bild().pose.sichtbar);
console.log("OK  Keine zweite Dusche beim Start im Bad; Handy wird vor dem Brillenwurf eingesteckt");

let gestartet = 0, gestoppt = 0, getrennt = 0;
const leitung = () => ({connect(){},disconnect(){getrennt++;}});
const ctx = { currentTime: 0, sampleRate: 8000, createBuffer: (_,n) => ({getChannelData: () => new Float32Array(n)}),
  createBufferSource: () => ({...leitung(),start(){gestartet++;},stop(){gestoppt++;}}),
  createBiquadFilter: () => ({...leitung(),frequency:{},Q:{}}),
  createGain: () => ({...leitung(),gain:{setTargetAtTime(){}}}) };
const klang = new G.WaschbeckenKlang(), audio = {ctx,master:leitung()};
klang.fluss(1,null); klang.fluss(.5,audio); klang.fluss(1,audio); assert.equal(gestartet,1);
klang.fluss(0,audio); klang.stop(); assert.equal(gestoppt,1); assert.equal(getrennt,3);
klang.fluss(1,audio); klang.stop(); assert.equal(gestartet,2); assert.equal(gestoppt,2);
console.log("OK  Wassergeraeusch: genau eine Quelle, sauber beendet bei Hahn zu und Hauswechsel");