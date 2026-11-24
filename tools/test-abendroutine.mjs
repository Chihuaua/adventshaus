import assert from "node:assert/strict";
import { build } from "esbuild";

const b = await build({ stdin: { contents: `export { House, STATIONS } from './src/game/house';
  export { steinSlots, steinAn } from './src/game/steine'; export { sfx } from './src/game/audio';
  export * from './src/game/abendroutine'; export * from './src/game/zahnpflege';
  export * from './src/game/abendzeiten'; export { haarstrich } from './src/game/haarstrich';
  export { luniRigBauen } from './src/game/luni';
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
    h.setClock(datum(2026, 11, 22, 18)); h.step(.04);
    assert.equal(h.abendAktiv, false, "vor dem berechneten Abendbeginn nicht starten");
  } else {
    h.command("stein_bett"); assert.equal(h.abendAktiv, false); assert.equal(h.shPhase, null);
  }
}
console.log("OK  Bett-Stein: zwei Welten, ein Fokusziel, kein verfrühter Beginn");

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

for (let t = 0; t < G.ZAHN_TAKTE.zPutzen; t += .025) {
  const z = G.zahnbild("zPutzen", t, 632, 324);
  const r = G.luniRigBauen(636, 324, { state: "idle", t, face: 1, scale: 1.08, handKontakt: true,
    handTarget: z.r, handElbow: z.ellbogen });
  const e = r.armFar.elbow, h = r.armFar.hand;
  assert.ok(z.frontal && e[0] < 0 && e[1] > -34 && e[1] > h[1] + 1, "Putzen: Ellbogen aussen, unter Schulter und Hand");
  assert.ok(Math.abs(Math.hypot(e[0] + 3.4, e[1] + 34) - 8.2) < 1e-6);
  assert.ok(Math.abs(Math.hypot(e[0] - h[0], e[1] - h[1]) - 8.4) < 1e-6);
  if (z.p > .25 && z.p < .86) {
    const cs = Math.cos(z.winkel), sn = Math.sin(z.winkel);
    assert.ok(Math.hypot(z.r[0] + cs * 7.5 + sn * 2.4 - 636.86,
      z.r[1] + sn * 7.5 - cs * 2.4 - 279.9) < 1.5, "die Borsten bleiben an der Zahnreihe");
  }
}
console.log("OK  Putzarm: korrekte Beugung, unveraenderte Armlaenge, Borsten am Mund");

// In langen Abschnitten nur die Testuhr weitersetzen; alle Objektübergaben laufen regulär.
function testSchritt(h) {
  if (h.abendAktiv && h.shPhase && h.shT > 5 && (h.shDauer(h.shPhase) ?? 0) - h.shT > 4)
    return h.shDauer(h.shPhase) - h.shT - 1;
  if (["video", "anruf"].includes(h.bettHandy?.phase) && h.bettHandy.sekunden > 2 && h.bettHandy.rest > 4)
    return h.bettHandy.rest - 1;
  return .05;
}
function durchlauf(h, starten = true) {
  ton = [];
  if (starten) h.command("stein_bett");
  const folge = [];
  let gestartet = false, schaum = false, gewaschen = false, mitTube = false, gesprochen = false;
  for (let i = 0; i < 8000; i++) {
    h.step(testSchritt(h)); gestartet ||= h.abendAktiv;
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
    if (h.bettHandy) {
      const bild = h.bettHandy.bild();
      assert.ok(!h.asleep && !h.lieDown && !h.water);
      assert.equal(h.lf,2); assert.equal(h.bedKleidungAn,"dressed");
      if (ph === "abnehmen" || ph === "wurf") assert.equal(bild.sichtbar, false, "kein Handy vor der Brillenablage");
      else { assert.ok(!h.glassesOn && !h.glassesInHand); assert.deepEqual([h.glassesRest.x,h.glassesRest.y],[401,297]); }
      if (ph === "video") assert.ok(bild.film && bild.arm === 1 && !bild.abgelegt && !h.handyAmKissen);
      if (ph === "anruf") {
        assert.ok(bild.abgelegt && h.handyAmKissen && bild.flach === 1 && bild.film === null);
        gesprochen ||= bild.spricht;
      }
    }
    if (ph === "zPutzen" || ph === "video") h.command("stein_bett");
    if (gestartet && h.asleep) break;
  }
  let letzte = -1;
  for (const ph of ["waterOn","washHair","waterOff","stepOut","gPick","zNehmen","zTube","zPaste","zTubeZurueck",
    "zPutzen","zGurgeln","zSpucken","zHahnAuf","zWaschen","zHahnZu","zZurueck","bTake","bBrush","bPut","kClose",
    "bedPants","bedPajama","bedClose","umschlagen","setzen","fuesse","greifen","liegen","abnehmen","wurf","holen","video",
    "unterschieben","anruf","settle"]) {
    const idx = folge.indexOf(ph); assert.ok(idx > letzte, `${ph}: falsche oder fehlende Phase in ${h.welt}`); letzte = idx;
    assert.equal(folge.filter(v => v === ph).length,1, "kein Doppelstart");
  }
  assert.ok(mitTube && schaum && gewaschen && gesprochen);
  assert.ok(ton.filter(k => k === "putzen").length >= 10 && ton.filter(k => k === "gurgeln").length >= 4);
  assert.equal(ton.filter(k => k === "spucken").length,1);
  assert.ok(h.asleep && !h.abendAktiv && !h.bettHandy && !h.glassesOn && !h.glassesInHand);
  assert.deepEqual([h.glassesRest.x, h.glassesRest.y], [401,297]); assert.equal(h.shPhase,null);
  assert.ok(h.handyAmKissen); assert.equal(h.schnappschuss().handyNacht, "schlaf");
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
  bad.step(testSchritt(bad)); assert.notEqual(bad.shPhase,"toWardrobe","die laufende Dusche wird nicht wiederholt");
}
assert.ok(bad.asleep && bad.glassesRest);

const haende = new G.BettHandy(); haende.tick(9); assert.equal(haende.phase,"wurf");
haende.tick(300); assert.ok(!haende.bild().sichtbar); haende.brilleAbgelegt();
const start = haende.bild(), bahn = [];
while (haende.phase === "holen") { bahn.push(haende.bild()); haende.tick(.025); }
const halt = haende.bild(), dx = halt.hand[0] - start.hand[0], dy = halt.hand[1] - start.hand[1];
assert.equal(halt.ph,"video");
for (const b of bahn) {
  assert.ok(Math.abs((b.hand[0] - start.hand[0]) * dy - (b.hand[1] - start.hand[1]) * dx) < 1e-8, "gerader Auszug");
  assert.ok(b.hand.every((v, i) => Math.abs((v - b.geraet[i]) - (halt.hand[i] - halt.geraet[i])) < 1e-8), "kein loser Griff");
}
const schnitte = new Set();
while (haende.phase === "video") {
  const b = haende.bild(); assert.ok(b.sichtbar && b.arm === 1 && b.film);
  assert.deepEqual(b.geraet,halt.geraet); assert.deepEqual(b.hand,halt.hand);
  schnitte.add(b.film.schnitt); assert.ok(b.film.staerke >= 0 && b.film.staerke < .25);
  haende.tick(.025);
}
assert.equal(schnitte.size,4); assert.equal(haende.phase,"unterschieben");
let vorherigesLicht = [0, 0, 0];
for (let i = 0; i <= G.ABEND_RICHTWERTE.video * 60; i++) {
  const f = G.videobild(i / 60), licht = f.rgb.split(",").map(v => Number(v) * f.staerke);
  assert.equal(f.staerke, .25 * f.pegel, "Glas und Gesicht folgen demselben Videosignal");
  assert.ok(licht.every((v, k) => Math.abs(v - vorherigesLicht[k]) < 7), "keine grellen Blitze, auch nicht am Schnitt");
  vorherigesLicht = licht;
}
assert.deepEqual(vorherigesLicht, [0,0,0], "beim Wegschieben ist das Displaylicht aus");
while (haende.phase === "unterschieben") { assert.equal(haende.bild().film,null); haende.tick(.025); }
const abgelegt = haende.bild(); assert.ok(abgelegt.ph === "anruf" && abgelegt.abgelegt && abgelegt.flach === 1);
while (!haende.fertig) {
  const b = haende.bild(); assert.deepEqual(b.geraet,abgelegt.geraet); assert.equal(b.film,null);
  if (b.t >= 1.05) assert.equal(b.arm,0,"die leere Hand ist wieder unter der Decke");
  haende.tick(.05);
}
assert.ok(haende.bild().sichtbar && haende.bild().abgelegt); assert.deepEqual(haende.bild().geraet,abgelegt.geraet);
for (const w of ["normal","weihnacht"]) {
  const schlaf = haus(w); schlaf.wiederherstellen(bad.schnappschuss());
  assert.ok(schlaf.asleep && schlaf.handyAmKissen && schlaf.glassesRest && !schlaf.glassesOn);
  schlaf.step(2); assert.ok(schlaf.handyAmKissen);
  const gespraech = haus(w); gespraech.wiederherstellen({ ...bad.schnappschuss(), handyNacht: 3.25 });
  assert.equal(gespraech.bettHandy.anrufzeit,3.25); assert.ok(gespraech.abendAktiv && gespraech.handyAmKissen);
  assert.deepEqual(gespraech.bettHandy.bild().geraet, abgelegt.geraet);
  for (let i=0;i<200&&!gespraech.asleep;i++) gespraech.step(testSchritt(gespraech));
  assert.ok(gespraech.asleep && !gespraech.bettHandy && gespraech.handyAmKissen);
}
for (const w of ["traum", "gruesel"]) {
  const h = haus(w); h.wiederherstellen(bad.schnappschuss());
  assert.ok(!h.handyAmKissen && !h.asleep && !h.bettHandy, "kein Kissen-Handy in anderen Welten");
}
console.log("OK  Gerader Griff, synchrones Videolicht und ein ruhendes Telefon beim Anruf, im Schlaf und nach Neuladen");

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

// Frühere Tischpakete und die echte Übergabe bleiben erhalten, ohne den Couchtisch erneut zu belegen.
const speicher = new Map([["lcp1.welt.normal.tischpaket", "true"]]);
globalThis.localStorage = { getItem: k => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
const empfang = haus("normal"); assert.equal(empfang.ungeoeffnetePost,1); assert.equal(haus("weihnacht").ungeoeffnetePost,0);
empfang.goTo = () => assert.fail("Kein Paket-Laufziel und kein vorweggenommener Auspackort");
empfang.post.start();
for (let i = 0; i < 5000 && empfang.post.aktiv; i++) {
  if (empfang.post.anDerTuer) empfang.activity = empfang.stations.find(s => s.id === "haustuer");
  empfang.updatePost(.05);
}
assert.ok(!empfang.post.aktiv && !empfang.luniTraegtPaket && !empfang.activity);
assert.equal(haus("normal").ungeoeffnetePost,2, "neue Lieferung und altes Paket sind auch nach Neuladen da");
empfang.post.start();
for (let i = 0; i < 6000 && empfang.post.aktiv; i++) empfang.updatePost(.05);
assert.ok(empfang.post.paketVorTuer); assert.equal(haus("normal").ungeoeffnetePost,2);
empfang.activity = empfang.stations.find(s => s.id === "haustuer");
for (let i = 0; i < 180; i++) empfang.updatePost(.05);
assert.equal(haus("normal").ungeoeffnetePost,3); assert.ok(!empfang.post.paketVorTuer && !empfang.luniTraegtPaket);
console.log("OK  Postpaket: Übergabe, spätere Abholung, Altstand und getrennte Hauswelten ohne Paket auf dem Tisch");