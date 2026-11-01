import assert from "node:assert/strict";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/game/gruselhaus/musikzimmer-ablauf.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const { MusikzimmerAblauf, KLAVIER_ZEITEN, klavierHaende } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`OK  ${name}`);
}
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test("Luni darf in der Ruhephase spielen; erneut starten setzt die Musik nicht zurueck", () => {
  const s = new MusikzimmerAblauf(() => 0);
  assert.equal(s.startLuni(), true);
  s.update(12, false);
  s.startLuni();
  close(s.musicTime, 12);
  assert.equal(s.alpha, 0);
});
test("Aufspringen 2 s und Musik 1 s vor dem Einblenden", () => {
  const s = new MusikzimmerAblauf(() => 0);
  s.startLuni();
  assert.equal(s.update(KLAVIER_ZEITEN.ruheMin - 1, false), false);
  assert.equal(s.update(1, false), true);
  assert.equal(s.luniPlaying, false);
  const state = s.getState();
  close(state.fadeInStart - state.start, 2);
  close(state.fadeInStart - state.musicStart, 1);
  assert.equal(s.ghostMusic, false);
  assert.equal(s.alpha, 0);
  s.update(1, false);
  assert.equal(s.ghostMusic, true);
  assert.equal(s.alpha, 0);
  s.update(1, false);
  assert.equal(s.alpha, 0);
  s.update(0.01, false);
  assert.ok(s.alpha > 0 && s.alpha < 0.001);
});
test("Weiche Alpha-Uebergaenge, Musik bis zur vollstaendigen Unsichtbarkeit", () => {
  const s = new MusikzimmerAblauf(() => 0);
  s.update(KLAVIER_ZEITEN.ruheMin, false);
  s.update(2, false);
  let previous = 0;
  for (let i = 0; i < 240; i++) {
    s.update(1 / 60, false);
    assert.ok(s.alpha + 1e-8 >= previous);
    assert.ok(s.alpha - previous < 0.01);
    assert.equal(s.ghostMusic, true);
    previous = s.alpha;
  }
  close(s.alpha, 0.95);
  assert.equal(s.startLuni(), false);
  s.update(20, false);
  for (let i = 0; i < 239; i++) {
    s.update(1 / 60, false);
    assert.ok(s.alpha <= previous + 1e-8);
    assert.equal(s.ghostMusic, true);
    previous = s.alpha;
  }
  s.update(0.02, false);
  assert.equal(s.alpha, 0);
  assert.equal(s.ghostMusic, false);
  assert.equal(s.startLuni(), true);
});
test("Andere Musik verhindert eine neue Erscheinung", () => {
  const s = new MusikzimmerAblauf(() => 0);
  s.update(KLAVIER_ZEITEN.ruheMax * 3, true);
  assert.equal(s.active, false);
  assert.equal(s.update(0.1, false), true);
});
test("Musikwunsch waehrend einer Erscheinung blendet ohne Alpha-Sprung aus", () => {
  const s = new MusikzimmerAblauf(() => 0);
  s.update(KLAVIER_ZEITEN.ruheMin, false);
  s.update(4, false);
  const alpha = s.alpha;
  s.otherMusicRequested();
  close(s.alpha, alpha);
  s.update(2, true);
  assert.ok(s.alpha < alpha && s.alpha > 0);
  assert.equal(s.ghostMusic, true);
  s.update(2, true);
  assert.equal(s.alpha, 0);
  assert.equal(s.active, false);
});
test("Klavierauftrag im unsichtbaren Vorlauf bleibt erlaubt", () => {
  const s = new MusikzimmerAblauf(() => 0);
  s.update(KLAVIER_ZEITEN.ruheMin, false);
  s.update(1.5, false);
  assert.equal(s.requestPiano(), true);
  assert.equal(s.active, false);
  assert.equal(s.startLuni(), true);
  assert.ok(s.getState().next >= KLAVIER_ZEITEN.ruheMin * 2 + 1.5);
});
test("Tabpause friert Alpha und Musikzeit gemeinsam ein", () => {
  const s = new MusikzimmerAblauf(() => 0);
  s.update(KLAVIER_ZEITEN.ruheMin, false);
  s.update(3, false);
  const before = s.getState();
  s.setPaused(true);
  s.update(100, false);
  close(s.alpha, before.alpha);
  close(s.getState().time, before.time);
  s.setPaused(false);
  s.update(0.5, false);
  assert.ok(s.alpha > before.alpha);
});
test("Ruhezeiten sind lang und werden pro Zyklus neu bestimmt", () => {
  let random = 0;
  const s = new MusikzimmerAblauf(() => (random++ % 3) / 3);
  s.update(KLAVIER_ZEITEN.ruheMin, false);
  s.update(50, false);
  const gap = s.getState().next - s.getState().time;
  assert.ok(gap >= KLAVIER_ZEITEN.ruheMin && gap <= KLAVIER_ZEITEN.ruheMax);
  assert.notEqual(gap, KLAVIER_ZEITEN.ruheMin);
  assert.equal(s.active, false);
});
test("Zeitsteuerung liefert bei 30/60/144 Hz gleiche Alpha-Werte", () => {
  const values = [30, 60, 144].map((fps) => {
    const s = new MusikzimmerAblauf(() => 0);
    s.update(KLAVIER_ZEITEN.ruheMin, false);
    for (let i = 0; i < 4 * fps; i++) s.update(1 / fps, false);
    return s.alpha;
  });
  close(values[0], values[1]);
  close(values[1], values[2]);
});
test("Haende bewegen sich stetig, auch an der Phrasengrenze", () => {
  let previous = klavierHaende(0);
  for (let i = 1; i < 4000; i++) {
    const current = klavierHaende(i / 100);
    for (let h = 0; h < 2; h++) {
      assert.ok(Number.isFinite(current[h].x));
      assert.ok(Math.abs(current[h].x - previous[h].x) < 0.5);
    }
    previous = current;
  }
});
console.log(`\n${passed} Musikzimmer-Tests bestanden.`);
