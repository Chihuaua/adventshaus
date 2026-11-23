import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: { contents: 'export * from "./nmsNoten"; export { TVKlang } from "./tvVoice";', resolveDir: resolve("src/game/audio") },
  bundle: true, write: false, format: "esm", platform: "node",
});
const { NMS_NOTEN, NMS_ENDE_TICK, NMS_TICKS_PRO_SEKUNDE: hz, TVKlang } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
assert.equal(hz, 1920); assert.equal(NMS_ENDE_TICK, 295334); assert.equal(NMS_NOTEN.length, 1016);
assert.equal(createHash("sha256").update(JSON.stringify(NMS_NOTEN)).digest("hex"),
  "4c8cd1138fb5b58aab74ae7c3070e1996c3b508a8f13a5b43a5a16d5d0bf196d", "Originalnoten mit allen MIDI-Ticks und Anschlaegen");

const knoten = () => ({ ziele: new Set(), connect(z) { this.ziele.add(z); }, disconnect(z) { if (z) this.ziele.delete(z); else this.ziele.clear(); } });
const noten = [], saiten = [], regler = [], timer = new Set();
const ctx = {
  currentTime: 0,
  createGain() {
    const g = { ...knoten(), gain: { value: 1, setTargetAtTime(v) { this.value = v; },
      setValueAtTime(v, t) { this.halten = [v, t]; }, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } };
    regler.push(g); return g;
  },
  createBuffer(_, n, sr) {
    const daten = new Float32Array(n);
    const buf = { duration: n / sr, getChannelData() { return daten; } }; saiten.push(buf); return buf;
  },
  createBufferSource() {
    return { ...knoten(), start(t, offset) { this.startzeit = t; this.offset = offset; noten.push(this); },
      stop(t = ctx.currentTime) { this.ende = t; } };
  },
};
const setzeTimer = globalThis.setInterval, loescheTimer = globalThis.clearInterval;
globalThis.setInterval = f => { timer.add(f); return f; };
globalThis.clearInterval = f => timer.delete(f);
const schritt = t => {
  ctx.currentTime = t;
  for (const src of noten) if (src.onended && src.ende <= t) { src.onended(); src.onended = null; }
  for (const f of timer) f();
};
const gleich = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} statt ${b}`);
const wz = new TVKlang(ctx, knoten()), dg = new TVKlang(ctx, knoten());
try {
  wz.setze("sterne", 50, 73);
  const anfang = noten[0].startzeit, nachhall = 0.18;
  const runde = NMS_ENDE_TICK / hz + nachhall;
  assert.equal(noten[0].startzeit, noten[1].startzeit, "Auftaktakkord bleibt gleichzeitig");
  const erste = noten.length;
  dg.setze("sterne", 20, 150);
  assert.equal(timer.size, 1); assert.equal(noten.length, erste, "zweiter Empfaenger startet keine zweite Melodie");
  wz.setze("sterne", 0, 0);
  gleich(regler[0].gain.value, 0); gleich(regler[1].gain.value, 0.024);
  wz.setze(null, 0, 0); assert.equal(timer.size, 1, "zweiter TV spielt unabhaengig weiter");
  for (let ms = 40; ms < (anfang + runde + 0.04) * 1000; ms += 40) schritt(ms / 1000);
  const pitchPuffer = new Map();
  for (const [i, [tick, dauer, pitch]] of NMS_NOTEN.entries()) {
    const src = noten[i]; gleich(src.startzeit, anfang + tick / hz); gleich(src.offset, 0);
    gleich(src.ende, src.startzeit + dauer / hz + nachhall);
    assert.ok(src.buffer.duration >= src.ende - src.startzeit, "kein gehaltener Ton wird gekuerzt");
    if (!pitchPuffer.has(pitch)) pitchPuffer.set(pitch, src.buffer);
    else assert.equal(src.buffer, pitchPuffer.get(pitch));
  }
  gleich(noten[NMS_NOTEN.length].startzeit, anfang + runde);
  assert.equal(new Set(pitchPuffer.values()).size, 34); assert.equal(saiten.length, 34);
  console.log("OK  1.016 Anschlaege: Einsatz, Laenge, Akkorde, vollstaendiger Durchlauf und Wiederholung");

  schritt(anfang + runde + 0.2); dg.pause(); assert.equal(timer.size, 0);
  assert.ok(noten.every(src => src.ziele.size === 0), "ausgeblendeter Tab ohne klingende oder geplante Stimmen");
  const vorher = noten.length; ctx.currentTime += 35;
  dg.pause(); dg.setze("sterne", 20, 0);
  assert.ok(noten.slice(vorher).some(src => src.offset > 0.1), "Weiterhoeren in der gehaltenen Note, kein Neustart");
  dg.setze(null, 20, 0); assert.equal(timer.size, 0);
  assert.ok(noten.every(src => !src.ziele.size));
  console.log("OK  Zwei Fernseher, getrennte Lautstaerke, Standby, Pause und Aufraeumen");
} finally {
  wz.dispose(); dg.dispose(); globalThis.setInterval = setzeTimer; globalThis.clearInterval = loescheTimer;
}