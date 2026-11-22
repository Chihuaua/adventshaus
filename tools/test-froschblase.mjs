// Tests für die Comic-Denkblase beim Froschlied („Frosch auf Seerosenblatt im Teich“).
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const b = await build({
  entryPoints: [path.resolve("src/game/froschblase.ts")],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const F = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);

function recCanvas() {
  const fills = [];
  const arcs = [];
  const ellipses = [];
  const ziel = { fillStyle: "", strokeStyle: "", lineWidth: 1, lineCap: "butt", globalAlpha: 1 };
  const c = new Proxy(ziel, {
    get(o, k) {
      if (k === "fills") return fills;
      if (k === "arcs") return arcs;
      if (k === "ellipses") return ellipses;
      if (k in o) return o[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") {
        return () => ({ addColorStop() {} });
      }
      if (k === "arc") return (x, y, r) => { arcs.push({ x, y, r, fill: ziel.fillStyle }); };
      if (k === "ellipse") return (x, y, rx, ry) => { ellipses.push({ x, y, rx, ry, fill: ziel.fillStyle }); };
      if (k === "fill") return () => { fills.push(ziel.fillStyle); };
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; },
  });
  return c;
}

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

const DAUER = 30.85;

test("Stufenweiser Aufbau aus dem Nichts: erst Blase 1, dann Blase 2, dann Blase 3, dann die Denkblase", () => {
  const s0 = F.froschBlasenStufen(0, DAUER);
  assert.equal(s0.b1 + s0.b2 + s0.b3 + s0.wolke, 0, "zu Liedbeginn (0 s) noch komplett unsichtbar");

  // t = 0.65 s: erste kleine Blase wächst, die anderen sind noch 0
  const s1 = F.froschBlasenStufen(0.65, DAUER);
  assert.ok(s1.b1 > 0.5, "erste kleine Blase wächst aus dem Nichts");
  assert.equal(s1.b2, 0, "zweite Blase wartet noch");
  assert.equal(s1.b3, 0, "dritte Blase wartet noch");
  assert.equal(s1.wolke, 0, "Hauptblase wartet noch");

  // t = 1.25 s: zweite Blase wächst nach, dritte & Hauptblase noch 0
  const s2 = F.froschBlasenStufen(1.25, DAUER);
  assert.equal(s2.b1, 1, "erste Blase voll da");
  assert.ok(s2.b2 > 0.5, "zweite Blase wächst");
  assert.equal(s2.b3, 0, "dritte Blase wartet noch");
  assert.equal(s2.wolke, 0, "Hauptblase wartet noch");

  // t = 1.85 s: dritte Blase wächst nach, Hauptblase noch 0
  const s3 = F.froschBlasenStufen(1.85, DAUER);
  assert.equal(s3.b2, 1);
  assert.ok(s3.b3 > 0.5, "dritte Blase wächst");
  assert.equal(s3.wolke, 0, "Hauptblase wartet bis nach der dritten Blase");

  // t = 3.2 s: alle drei Vorblasen + Haupt-Denkblase voll aufgebaut
  const s4 = F.froschBlasenStufen(3.2, DAUER);
  assert.equal(s4.b1, 1);
  assert.equal(s4.b2, 1);
  assert.equal(s4.b3, 1);
  assert.equal(s4.wolke, 1);
  assert.equal(s4.deckkraft, 1);
});

test("Langsames Auflösen kurz vor Liedende, am Ende vollständig verschwunden", () => {
  const mitte = F.froschBlasenStufen(15, DAUER);
  const vorEnde = F.froschBlasenStufen(DAUER - 1.6, DAUER);
  const fastEnde = F.froschBlasenStufen(DAUER - 0.4, DAUER);
  const ende = F.froschBlasenStufen(DAUER, DAUER);

  assert.equal(mitte.deckkraft, 1, "mitten im Lied voll sichtbar");
  assert.ok(vorEnde.deckkraft > 0.2 && vorEnde.deckkraft < 0.8, `löst sich kurz vor Ende langsam auf (${vorEnde.deckkraft})`);
  assert.ok(fastEnde.deckkraft > 0 && fastEnde.deckkraft < vorEnde.deckkraft, "nimmt kontinuierlich weiter ab");
  assert.equal(ende.b1 + ende.b2 + ende.b3 + ende.wolke + ende.deckkraft, 0, "am Liedende restlos weg");
});

test("Zeichnung: Vorbläschen werden größer, Teich + Seerosenblatt + Frosch werden gezeichnet", () => {
  const c = recCanvas();
  F.drawFroschDenkblase(c, 642, 139, 10, DAUER, 4.2, -1);
  // Drei Vorbläschen mit Papierfüllung (#faf8f0) in streng aufsteigendem Radius
  const vor = c.arcs.filter((a) => a.fill === "#faf8f0" && a.r < 5);
  assert.equal(vor.length, 3, "genau drei Vorbläschen");
  assert.ok(vor[0].r < vor[1].r && vor[1].r < vor[2].r, `Vorbläschen werden nacheinander größer (${vor.map((v) => v.r).join(" < ")})`);
  assert.ok(c.fills.includes("#4ea058"), "Seerosenblatt gezeichnet");
  assert.ok(c.fills.includes("#56b357"), "grüner Frosch gezeichnet");
  assert.ok(c.fills.includes("#d9edb2"), "helle Froschkehle gezeichnet");
});

console.log(`\n${n} Frosch-Denkblasen-Tests bestanden.`);
