// Geometrieprüfungen für normales Bett, Klaviatur und Lunis Rückansicht.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const source = readFileSync("src/game/house.ts", "utf8");
const bundle = await build({
  stdin: {
    contents: source + '\nexport { piano, bed, drawBedScene, drawBlanket, drawBedFront, sfx };\nexport { drawLuni } from "./luni";',
    resolveDir: path.resolve("src/game"), loader: "ts",
  },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

// Canvas-Aufzeichnung mit denselben affinen Transformationen wie Canvas 2D.
function canvas() {
  let matrix = [1, 0, 0, 1, 0, 0], points = [];
  const stack = [], shapes = [], arcs = [];
  const point = (x, y) => [matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]];
  const multiply = ([a, b, c, d, e, f]) => {
    const [A, B, C, D, E, F] = matrix;
    matrix = [A*a+C*b, B*a+D*b, A*c+C*d, B*c+D*d, A*e+C*f+E, B*e+D*f+F];
  };
  const record = (pts, extra = {}) => {
    if (!pts.length) return;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    shapes.push({ color: ctx.fillStyle, left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys), ...extra });
  };
  const gradient = () => ({ addColorStop() {} });
  const methods = {
    fillStyle: "#000", strokeStyle: "#000", globalAlpha: 1,
    save() { stack.push({ matrix: [...matrix], fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha }); },
    restore() { const s = stack.pop(); matrix = s.matrix; ctx.fillStyle = s.fillStyle; ctx.globalAlpha = s.globalAlpha; },
    translate(x, y) { multiply([1, 0, 0, 1, x, y]); },
    rotate(a) { multiply([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); },
    scale(x, y) { multiply([x, 0, 0, y, 0, 0]); },
    beginPath() { points = []; }, closePath() {},
    moveTo(x, y) { points.push(point(x, y)); }, lineTo(x, y) { points.push(point(x, y)); },
    quadraticCurveTo(x1, y1, x2, y2) { points.push(point(x1, y1), point(x2, y2)); },
    bezierCurveTo(x1, y1, x2, y2, x3, y3) { points.push(point(x1, y1), point(x2, y2), point(x3, y3)); },
    rect(x, y, w, h) { points.push(point(x, y), point(x+w, y), point(x+w, y+h), point(x, y+h)); },
    roundRect(x, y, w, h) { methods.rect(x, y, w, h); },
    fillRect(x, y, w, h) { record([point(x, y), point(x+w, y), point(x+w, y+h), point(x, y+h)], { kind: "rect" }); },
    arc(x, y, r) {
      const p = point(x, y); arcs.push({ x: p[0], y: p[1], r, color: ctx.fillStyle });
      points.push(point(x-r, y-r), point(x+r, y+r));
    },
    ellipse(x, y, rx, ry) { points.push(point(x-rx, y-ry), point(x+rx, y+ry)); },
    fill() { record(points, { kind: "path" }); },
    stroke() { record(points, { kind: "stroke", color: ctx.strokeStyle }); },
    createLinearGradient: gradient, createRadialGradient: gradient,
    measureText(text) { return { width: text.length * 6 }; },
  };
  const ctx = new Proxy(methods, { get(o, key) { return key in o ? o[key] : () => {}; } });
  return { ctx, shapes, arcs };
}
let n = 0;
const test = (name, run) => { run(); n++; console.log(`OK  ${name}`); };
const near = (a, b) => assert.ok(Math.abs(a-b) < 1e-7, `${a} statt ${b}`);
const head = c => c.arcs.find(a => a.r === 9.2 && a.color === "#f4c9a0");

test("Klaviaturkasten und Korpus: exakt dieselben Kanten 545–589", () => {
  const c = canvas(); G.piano(c.ctx, 545, 200);
  const body = c.shapes.find(s => s.color === "#2a1f1b");
  const keys = c.shapes.find(s => s.color === "#221812");
  near(body.left, 545); near(body.right, 589);
  near(keys.left, body.left); near(keys.right, body.right);
  near(keys.top, 166);
  const white = c.shapes.find(s => s.color === "#f5f2ea");
  near(white.left, 550); near(white.top, 168);
  const middle = (body.left + body.right) / 2;
  near((white.left + white.right) / 2, middle);
  const cheeks = c.shapes.filter(s => s.color === "#2f221b");
  near((cheeks[0].left + cheeks[1].right) / 2, middle);
  const details = c.shapes.filter(s => s.color === "#d9a83c");
  near((details[0].left + details[1].right) / 2, middle);
  for (const detail of details) assert.ok(detail.left >= body.left && detail.right <= body.right);
});

test("Leeres Bett unverändert, belegt keine zweite statische Decke", () => {
  const empty = canvas(), occupied = canvas();
  G.bed(empty.ctx, 282, 324); G.bed(occupied.ctx, 282, 324, true);
  const quilt = empty.shapes.find(s => s.color === "#3f7f8c");
  assert.deepEqual([quilt.left, quilt.top, quilt.right, quilt.bottom], [328, 288, 386, 308]);
  assert.equal(occupied.shapes.some(s => s.color === "#3f7f8c"), false);
  assert.deepEqual(empty.shapes.filter(s => s.color === "#ffffff"), occupied.shapes.filter(s => s.color === "#ffffff"));
});

test("Bewegte Decke bleibt über der Matratze und vor dem Fußpfosten", () => {
  for (let i = 0; i <= 100; i++) {
    const c = canvas(); G.drawBlanket(c.ctx, i, i/100);
    const quilt = c.shapes.find(s => s.color === "#3f7f8c");
    assert.ok(quilt.left >= 320 && quilt.left <= 338);
    near(quilt.right, 386); near(quilt.bottom, 308);
    assert.ok(quilt.top >= 275.8 && quilt.top <= 288.2);
  }
});

test("Schlafende Luni: originale Kopfgröße, Kopf auf dem vorhandenen Kissen", () => {
  const c = canvas();
  G.drawBedScene(c.ctx, 345, 292, 0, { top: "#7fc6c2", bottom: "#3f6f8c" }, { pull: 1, grab: 1, turn: 1, hair: 1 });
  const h = head(c); assert.ok(h);
  near(h.x, 309.9); near(h.y, 285.52);
  assert.ok(h.x >= 294 && h.x <= 324);
  assert.ok(h.y + 9.2 * 1.08 >= 286 && h.y + 9.2 * 1.08 <= 298);
});

test("Hinlegen: kontinuierlich vom Sitzen bis zum identischen Schlafanker", () => {
  let previous;
  for (let i = 0; i <= 1000; i++) {
    const p = i/1000, c = canvas();
    G.drawLuni(c.ctx, 330 + 15*p, 316 - 24*p, { state: "lie", lieDown: p, scale: 1.08, shadow: false });
    const h = head(c); assert.ok(h);
    assert.ok(h.x > 295 && h.x < 335 && h.y > 245 && h.y < 287);
    if (previous) assert.ok(Math.hypot(h.x-previous.x, h.y-previous.y) < .2, `Sprung bei ${p}`);
    previous = h;
  }
  near(previous.x, 309.9); near(previous.y, 285.52);
});

test("Rückansicht malt weder Gesichtshaut noch Hals über die Haare", () => {
  for (const state of ["idle", "undress", "wrap", "act"]) {
    const c = canvas();
    G.drawLuni(c.ctx, 0, 0, { state, back: true, phase: .5, shadow: false });
    assert.equal(head(c), undefined);
    assert.equal(c.shapes.some(s => s.color === "#e3b288" && s.left === -2 && s.right === 2 && s.bottom < -34), false);
  }
});

test("Bettrahmen wird nur bei belegtem normalem Bett vor Luni gezeichnet", () => {
  assert.match(source, /const bettBelegt = this\.welt === "normal"/);
  assert.ok(source.indexOf("if (this.bettRendered) drawBedFront(ctx, 282, FO)") > source.indexOf("this.drawLuniLayered(ctx)"));
});
test("Hände liegen hinter der Decke, nicht als Hautfläche auf dem Stoff", () => {
  for (const turn of [0, .5, 1]) {
    const c = canvas();
    G.drawBedScene(c.ctx, 345, 292, 0, null, { pull: 1, grab: 1, turn, hair: turn });
    const quilt = c.shapes.findIndex(s => s.color === "#3f7f8c");
    assert.ok(quilt >= 0);
    assert.equal(c.shapes.slice(quilt + 1).some(s => s.color === "#f4c9a0" || s.color === "#e3b288"), false);
  }
});

test("Umziehen: Oberteil und Hose getrennt, keine Handtuchzeichnung", () => {
  const pajama = { top: "#62a59b", bottom: "#5968a1" };
  for (const kleidung of [
    { oberteil: true, hose: true }, { oberteil: false, hose: true },
    { oberteil: false, hose: false },
  ]) {
    const c = canvas();
    G.drawLuni(c.ctx, 0, 0, { back: true, state: "undress", phase: .6, outfit: "none", kleidung, pajama, shadow: false });
    assert.equal(c.shapes.some(s => ["#e2eef2", "#cfe3ea", "#7fb6d0"].includes(s.color)), false);
    assert.equal(c.shapes.some(s => s.color === pajama.top), kleidung.oberteil);
    assert.equal(c.shapes.some(s => s.color === pajama.bottom), kleidung.hose);
  }
  const towel = canvas(); G.drawLuni(towel.ctx, 0, 0, { back: true, outfit: "towel", shadow: false });
  assert.ok(towel.shapes.some(s => s.color === "#e2eef2"), "Duschhandtuch bleibt erhalten");
});

function haus(fields = {}) {
  return Object.assign(Object.create(G.House.prototype), {
    welt: "normal", shPhase: null, shT: 0, bedPhase: null,
    glassesOn: false, glassesInHand: false, glassesInSink: false, glassesFly: null,
    glassesRest: null, outfit: "dressed", ...fields,
  });
}
G.sfx.ui = () => {};
G.sfx.ensure = () => {};

test("Bettkleidung verwendet kein Handtuch als Zwischenzustand", () => {
  for (const [shPhase, shT, expected] of [
    ["bedTop", .6, { oberteil: false, hose: true }],
    ["bedBottom", 1, { oberteil: false, hose: false }],
    ["bedPants", .8, { oberteil: false, hose: true }],
    ["bedPajama", 1, { oberteil: false, hose: true }],
    ["bedPajama", 1.8, { oberteil: true, hose: true }],
  ]) {
    const h = haus({ shPhase, shT }); h.updateBedRoutine(0);
    assert.notEqual(h.outfit, "towel", shPhase);
    assert.deepEqual(h.bedKleidung(), expected, shPhase);
  }
});

test("Bettphasen laufen nicht zusätzlich ein zweites Mal durch die Dusche", () => {
  const h = haus({ shPhase: "bedTop", shT: .1, steam: 0, wet: 0, water: false });
  h.updateShower(.1); near(h.shT, .2);
});

test("Ohne Brille: Wurf überspringen, abgelegte Brille nicht verschieben", () => {
  for (const place of ["becken", "ablage", "unterwegs", "keine"]) {
    const rest = { x: 404, y: 284, rot: .1, scale: .45 };
    const h = haus({ shPhase: "bedToss", glassesInSink: place === "becken", glassesRest: place === "ablage" ? rest : null, glassesFly: place === "unterwegs" ? { t: .3 } : null });
    const fly = h.glassesFly;
    h.updateBedRoutine(.05);
    assert.equal(h.bedPhase, null, place);
    assert.equal(h.lieDown, true, place);
    assert.equal(h.glassesInHand, false, place);
    assert.equal(h.glassesInSink, place === "becken", place);
    assert.equal(h.glassesRest, place === "ablage" ? rest : null, place);
    assert.equal(h.glassesFly, fly, place);
  }
});

test("Nur Brille auf der Nase oder in der Hand darf geworfen werden", () => {
  for (const [glassesOn, glassesInHand] of [[true, false], [false, true]]) {
    const h = haus({ shPhase: "bedToss", glassesOn, glassesInHand });
    h.updateBedRoutine(.05);
    assert.equal(h.bedPhase, "toss");
    assert.equal(h.glassesOn, false);
    assert.equal(h.glassesInHand, true);
    assert.notEqual(h.lieDown, true);
  }
});

test("Schon abgelegte Brille bleibt beim Beginn des Bettgangs und Aufwachen liegen", () => {
  const rest = { x: 404, y: 284, rot: .1, scale: .45 };
  const h = haus({ glassesRest: rest }); h.startSh = () => {};
  h.startBedRoutine(); assert.equal(h.glassesRest, rest);
  const sink = haus({ glassesInSink: true }); sink.aufwachen();
  assert.equal(sink.glassesOn, false); assert.equal(sink.glassesInSink, true);
});

console.log(`\n${n} Hausgrafik-Tests bestanden.`);
