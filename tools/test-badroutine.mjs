import assert from "node:assert/strict";
import { build } from "esbuild";

const b = await build({ stdin: { contents: `export { House } from './src/game/house';
  export * from './src/game/zahnpflege'; export * from './src/game/duschprogramm';
  export * from './src/game/abendzeiten'; export { DuschKlang } from './src/game/audio/dusche';
  export { luniRigBauen } from './src/game/luni'; export { sfx } from './src/game/audio';`, resolveDir: process.cwd() },
  bundle: true, write: false, format: "esm", platform: "node" });
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
let n = 0;
const test = (name, run) => { run(); n++; console.log(`OK  ${name}`); };
const X = 632, F = 324, SKALA = 1.08, ARM = (8.2 + 8.4) * SKALA;
const STAND = { becken: X + G.ZAHN_STAND.becken, schrank: X + G.ZAHN_STAND.schrank };
const amBecken = ["zPutzen", "zGurgeln", "zSpucken", "zHahnAuf", "zWaschen", "zHahnZu"];

test("Zähne: jede Hand erreicht ihr Ziel, ohne quer über den Körper zu greifen", () => {
  for (const [takte, name] of [[G.ZAHN_TAKTE, "Echtzeit"], [G.ZAHN_PROBE, "Probe"]]) {
    for (const ph of Object.keys(takte)) {
      const lx = amBecken.includes(ph) ? STAND.becken : STAND.schrank;
      for (let t = 0; t <= takte[ph]; t += takte[ph] / 120) {
        const z = G.zahnbild(ph, t, X, F, takte[ph]);
        const nah = [lx + 3.4 * SKALA, F - 34 * SKALA], fern = [lx - 3.4 * SKALA, F - 34 * SKALA];
        const zielNah = z.buersteNah ? z.r : z.l, zielFern = z.buersteNah ? z.l : z.r;
        assert.ok(Math.hypot(zielNah[0] - nah[0], zielNah[1] - nah[1]) <= ARM + .6, `${name} ${ph}: vordere Hand erreicht ihr Ziel`);
        assert.ok(Math.hypot(zielFern[0] - fern[0], zielFern[1] - fern[1]) <= ARM + .6, `${name} ${ph}: hintere Hand erreicht ihr Ziel`);
        assert.ok(zielNah[0] >= fern[0], `${name} ${ph}: die vordere Hand greift nie über die andere Schulter hinaus`);
        if (z.frontal) assert.ok(zielFern[0] <= nah[0], `${name} ${ph}: frontal kreuzt die hintere Hand nicht vor dem Körper`);
        if (amBecken.includes(ph)) assert.ok(z.buersteNah, `${name} ${ph}: am Becken ist die Bürste in der vorderen Hand`);
        assert.equal(z.frontal, ph === "zPutzen" || ph === "zGurgeln", "Arme nur in der Frontalansicht vor dem Körper");
      }
    }
  }
  const voll = G.zahnbild("zWaschen", 3.2, X, F, G.ZAHN_TAKTE.zWaschen);
  assert.ok(voll.r[0] > STAND.becken + 8, "Auswaschen mit der Hand auf der Beckenseite unter dem Strahl");
});

test("Zähne putzen: links und rechts, kreisen, hinten, zwischendurch ausspucken und weiter", () => {
  const d = G.ZAHN_TAKTE.zPutzen;
  const quer = [], spucken = [];
  let striche = 0, vorher = G.zahnbild("zPutzen", 0, X, F, d), spuckTon = 0, gelehnt = 0, tropfen = 0;
  for (let t = .02; t < d; t += .02) {
    const z = G.zahnbild("zPutzen", t, X, F, d);
    if (z.putzt && z.strich !== vorher.strich) striche++;
    if (z.spuckt !== vorher.spuckt) spuckTon++;
    if (z.neigung > .5) gelehnt += .02;
    if (z.tropfen !== null) tropfen++;
    if (t > 1.2 && t < 8.6) quer.push(z.r);
    vorher = z;
  }
  const xs = quer.map((p) => p[0]), ys = quer.map((p) => p[1]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 4 * (Math.max(...ys) - Math.min(...ys)), "die Hand bewegt sich links-rechts, nicht hoch-runter");
  assert.ok(striche > 150, "durchgehendes Putzgeräusch im Takt der Striche");
  assert.ok(spuckTon >= 2, "zwischendurch ausspucken, auch in einem langen Putzgang mehrmals");
  assert.ok(gelehnt > 3 && tropfen > 50, "beim Zwischenspucken beugt sie sich über das Becken, es tropft");
  const kurz = G.ZAHN_PROBE.zPutzen; let kurzSpucken = 0, alt = G.zahnbild("zPutzen", 0, X, F, kurz);
  for (let t = .02; t < kurz; t += .02) { const z = G.zahnbild("zPutzen", t, X, F, kurz); if (z.spuckt !== alt.spuckt) kurzSpucken++; alt = z; }
  assert.equal(kurzSpucken, 1, "auch in der kurzen Probe einmal zwischendurch");
  // Kreisen: die Hand umrundet einen Punkt
  const kreis = [...Array(60).keys()].map((i) => G.zahnbild("zPutzen", 9.8 + i * .06, X, F, d).r);
  const bx = kreis.map((p) => p[0]), by = kreis.map((p) => p[1]);
  assert.ok(Math.max(...by) - Math.min(...by) > 1.1 && Math.max(...bx) - Math.min(...bx) > 1.5, "beim Kreisen bewegt sich die Hand rund");
});

test("Duschen: zehn verschiedene Bewegungen, keine bleibt allein", () => {
  const w = G.ABEND_RICHTWERTE, takte = G.abendTakte(w), gesehen = new Set();
  for (const ph of ["nasswerden", "washHair", "washBody", "rinse"]) {
    for (let t = 0; t < takte[ph]; t += .5) gesehen.add(G.duschBild(ph, t, takte[ph]).tat);
  }
  assert.deepEqual([...gesehen].sort(), Object.keys(G.DUSCH_CODES).sort(), "alle Bewegungen kommen vor");
  const kurz = new Set();
  for (const [ph, d] of [["nasswerden", 1.2], ["washHair", 3.4], ["washBody", 3.4], ["rinse", 2.8]])
    for (let t = 0; t < d; t += .05) kurz.add(G.duschBild(ph, t, d).tat);
  for (const tat of ["haare", "nacken", "gesicht", "streifen", "armLinks", "armRechts", "koerper", "beine", "abspuelen"])
    assert.ok(kurz.has(tat), `auch in der kurzen Probe: ${tat}`);
});

test("Duschen: jede Bewegung hat eine eigene Haltung und geht weich in die nächste über", () => {
  const haende = new Set();
  for (const code of Object.values(G.DUSCH_CODES)) {
    const r = G.luniRigBauen(0, 0, { state: "wash", phase: code, t: 1.3 });
    haende.add([...r.armNear.hand, ...r.armFar.hand].map((v) => v.toFixed(1)).join());
  }
  assert.equal(haende.size, 10, "zehn verschiedene Handhaltungen");
  const d = G.abendTakte(G.ABEND_RICHTWERTE).washBody;
  let vorher = null;
  for (let t = 0; t < d; t += 1 / 60) {
    const bild = G.duschBild("washBody", t, d);
    const r = G.luniRigBauen(0, 0, { state: "wash", phase: bild.code, t, blendPhase: bild.von ?? undefined, blendK: bild.von === null ? undefined : bild.k });
    const h = r.armNear.hand;
    if (vorher) assert.ok(Math.hypot(h[0] - vorher[0], h[1] - vorher[1]) < 1.6, "kein Sprung beim Wechsel der Bewegung");
    vorher = h;
  }
});

test("Duschgeräusch: genau eine Quelle, hörbar während das Wasser läuft, sauber beendet", () => {
  let gestartet = 0, gestoppt = 0, getrennt = 0, ziel = 0;
  const leitung = () => ({ connect() {}, disconnect() { getrennt++; } });
  const ctx = { currentTime: 0, sampleRate: 8000, createBuffer: (_, len) => ({ getChannelData: () => new Float32Array(len) }),
    createBufferSource: () => ({ ...leitung(), start() { gestartet++; }, stop() { gestoppt++; } }),
    createBiquadFilter: () => ({ ...leitung(), frequency: {}, Q: {} }),
    createGain: () => ({ ...leitung(), gain: { value: 0, setTargetAtTime(v) { ziel = v; } } }) };
  const klang = new G.DuschKlang(), audio = { ctx, master: leitung() };
  klang.fluss(1, audio); klang.fluss(1, audio);
  assert.equal(gestartet, 1); assert.ok(ziel > .05, "deutlich hörbar");
  klang.fluss(0, audio); assert.equal(gestoppt, 1);
  klang.fluss(1, null); klang.stop(); assert.equal(gestoppt, 1, "ohne Ton kein zweiter Start");
});

const canvas = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
globalThis.document = { createElement: canvas, visibilityState: "visible" };
globalThis.window = { devicePixelRatio: 1 };
const haus = (welt) => new G.House(canvas(), { welt, clock: { year: 2026, month: 11, day: 22, hour: 11, min: 12 } });

test("Bett-Stein = kurze Probe, EZ-Bett-Stein = voller Echtzeitablauf", () => {
  for (const welt of ["normal", "weihnacht"]) {
    const probe = haus(welt); probe.command("stein_bett");
    assert.ok(probe.abendAktiv && probe.abendProbe, `${welt}: Bett-Stein startet die Probe`);
    assert.equal(probe.shDauer("washHair"), 3.4); assert.equal(probe.shDauer("zPutzen"), G.ZAHN_PROBE.zPutzen);
    assert.equal(probe.bettTakte().umschlagen, 2.2);
    assert.equal(probe.abendMerken(), undefined, "eine Probe wird nicht als Abend gespeichert");
    const echt = haus(welt); echt.command("stein_ezbett");
    assert.ok(echt.abendAktiv && !echt.abendProbe, `${welt}: EZ-Bett-Stein startet in Echtzeit`);
    assert.equal(echt.shDauer("washHair"), echt.abendPlan.takte.washHair);
    assert.ok(echt.shDauer("zPutzen") >= 60 && echt.shDauer("bBrush") >= 52 && echt.shDauer("bBrush") <= 72);
    assert.ok(echt.abendMerken(), "ein Echtzeitabend wird gespeichert und nach dem Laden fortgesetzt");
  }
  const grusel = haus("gruesel"); grusel.command("stein_ezbett"); assert.ok(!grusel.abendAktiv, "nicht im Gruselhaus");
});

test("Haare bürsten in Echtzeit 60–80 s, einschließlich Zurücklegen und Schließen", () => {
  assert.deepEqual([...G.ABEND_SPANNEN.haare], [60, 80, 80]);
  for (const w of [G.abendWerte(() => 0), G.abendWerte(() => 1)]) {
    const t = G.abendTakte(w);
    assert.equal(t.bTake + t.bBend + t.bBrush + t.bUp + t.bPut + t.kClose, w.haare);
  }
});

console.log(`\n${n} Bad-Tests bestanden.`);
