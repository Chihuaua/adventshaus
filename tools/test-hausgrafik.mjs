// Geometrieprüfungen für normales Bett, Klaviatur und Lunis Rückansicht.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const source = readFileSync("src/game/house.ts", "utf8");
const bundle = await build({
  stdin: {
    contents: source + '\nexport { piano, bed, drawBedScene, drawBlanket, drawBedFront, drawBedEntryBlanket, bedBlanketPose, bedBlanketPushHand, recordPlayer, speaker, PLATTEN_TOUR, SAX_GRIP_UP, SAX_GRIP_LOW, sfx };\nexport { drawLuni } from "./luni";\nexport { drawUfo, ufoTreffer, ufoZeileBei, UFO_MENUE } from "./ufo";\nexport { PATCH_DATEIEN, PATCH_EINTRAEGE, PATCH_ZIP, PATCH_KURZ, PATCH_NUMMER } from "./patch";\nexport { zipErzeugen } from "./zip";\nexport { PLATTEN_NOTES, PLATTEN_DURATION_SECONDS, PLATTEN_TICKS_PER_SECOND } from "./audio/plattenNotes";\nexport { plattenBassPulse } from "./audio/plattenVoice";\nexport { FROSCH_NOTES, FROSCH_DURATION_SECONDS, FROSCH_TICKS_PER_SECOND } from "./audio/froschNotes";\nexport { froschMundOffen, renderSilbe } from "./audio/froschVoice";',
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
    shapes.push({ color: ctx.fillStyle, left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys), points: pts.map(p => [...p]), ...extra });
  };
  const gradient = () => ({ addColorStop() {} });
  const methods = {
    fillStyle: "#000", strokeStyle: "#000", globalAlpha: 1,
    save() { stack.push({ matrix: [...matrix], fillStyle: ctx.fillStyle, globalAlpha: ctx.globalAlpha }); },
    restore() { const s = stack.pop(); matrix = s.matrix; ctx.fillStyle = s.fillStyle; ctx.globalAlpha = s.globalAlpha; },
    translate(x, y) { multiply([1, 0, 0, 1, x, y]); },
    rotate(a) { multiply([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); },
    scale(x, y) { multiply([x, 0, 0, y, 0, 0]); },
    setTransform(a, b, c, d, e, f) { matrix = [a, b, c, d, e, f]; },
    beginPath() { points = []; }, closePath() {},
    moveTo(x, y) { points.push(point(x, y)); }, lineTo(x, y) { points.push(point(x, y)); },
    quadraticCurveTo(x1, y1, x2, y2) { points.push(point(x1, y1), point(x2, y2)); },
    bezierCurveTo(x1, y1, x2, y2, x3, y3) { points.push(point(x1, y1), point(x2, y2), point(x3, y3)); },
    rect(x, y, w, h) { points = [point(x, y), point(x+w, y), point(x+w, y+h), point(x, y+h)]; },
    roundRect(x, y, w, h) { methods.rect(x, y, w, h); },
    fillRect(x, y, w, h) { record([point(x, y), point(x+w, y), point(x+w, y+h), point(x, y+h)], { kind: "rect" }); },
    arc(x, y, r) {
      const p = point(x, y); arcs.push({ x: p[0], y: p[1], r, color: ctx.fillStyle });
      points.push(point(x-r, y-r), point(x+r, y+r));
    },
    ellipse(x, y, rx, ry) {
      this._last = "ellipse";
      const p1 = point(x-rx, y-ry), p2 = point(x+rx, y+ry);
      points.push(p1, p2);
      record([p1, p2], { kind: "ellipse" });
    },
    fill() { record(points, { kind: "path" }); },
    stroke() { record(points, { kind: "stroke", color: ctx.strokeStyle }); },
    createLinearGradient: gradient, createRadialGradient: gradient,
    measureText(text) { return { width: text.length * 6 }; },
  };
  const texte = [];
  methods.fillText = (inhalt, x, y) => { texte.push({ inhalt, x, y, farbe: ctx.fillStyle, font: ctx.font }); };
  const ctx = new Proxy(methods, { get(o, key) { return key in o ? o[key] : () => {}; } });
  return { ctx, shapes, arcs, texte };
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

test("Bettrahmen liegt bei belegtem normalem Bett hinter Luni", () => {
  assert.match(source, /const bettBelegt = this\.welt === "normal"/);
  assert.ok(source.indexOf("if (this.bettRendered) drawBedFront(ctx, 282, FO)") < source.indexOf("this.drawLuniLayered(ctx)"));
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

test("Zugezogene Decke sammelt sich an der Nahkante, statt als Platte zu wandern", () => {
  // Beim Zusammenschieben wächst die Ansammlung; die Nahkante hebt sich vom
  // Matratzenrand ab, das Fußende bleibt liegen.
  const stoff = (phase, p) => {
    const c = canvas(); G.drawBedEntryBlanket(c.ctx, p, phase, p);
    const s = c.shapes.find(q => q.color === "#3f7f8c");
    return { links: s.left, rechts: s.right, unten: s.bottom };
  };
  const start = stoff("greifen", 0), ende = stoff("greifen", 1);
  near(start.rechts, ende.rechts); near(start.unten, ende.unten);
  assert.ok(ende.links < start.links, "Nahkante wandert zu Luni");
  const rolle = c => c.shapes.find(s => s.color === "#5da0a8" && s.kind === "ellipse");
  const anfang = canvas(); G.drawBedEntryBlanket(anfang.ctx, 0, "greifen", 0);
  const spaeter = canvas(); G.drawBedEntryBlanket(spaeter.ctx, 1, "greifen", 1);
  const r0 = rolle(anfang), r1 = rolle(spaeter);
  assert.ok(r0 && r1, "Rollkante sichtbar");
  assert.ok(r1.right - r1.left > r0.right - r0.left, "Stoff rollt sich sichtbar auf");
  assert.ok(r1.bottom < 308, "Rollkante hebt sich von der Matratze ab");
  // Am Ende des Hinlegens liegt sie flatt wie die Schlafdecke – kein Sprung.
  const schlaf = canvas(); G.drawBlanket(schlaf.ctx, 0, 1);
  const zulegt = canvas(); G.drawBedEntryBlanket(zulegt.ctx, 1, "hinlegen", 1);
  const a = schlaf.shapes.find(s => s.color === "#3f7f8c"), b = zulegt.shapes.find(s => s.color === "#3f7f8c");
  near(a.left, b.left); near(a.top, b.top); near(a.right, b.right); near(a.bottom, b.bottom);
});

test("Decke faltet sich auf dem Bett und springt zwischen den Phasen nicht", () => {
  let letzteKante = 328;
  let letzteHand = 345;
  for (let i = 0; i <= 100; i++) {
    const p = i / 100, pose = G.bedBlanketPose("umschlagen", p);
    assert.ok(pose.links >= letzteKante && pose.links <= 350);
    letzteKante = pose.links;
    const hand = G.bedBlanketPushHand(p);
    assert.ok(hand[0] >= letzteHand && hand[0] >= pose.links - 0.3 && hand[0] <= 386);
    near(hand[1], pose.oben + 4);
    letzteHand = hand[0];
    const c = canvas(); G.drawBedEntryBlanket(c.ctx, p, "umschlagen", p);
    const stoff = c.shapes.find(s => s.color === "#3f7f8c");
    near(stoff.left, pose.links); near(stoff.right, 386); near(stoff.bottom, 308);
  }
  for (const [a, b] of [["umschlagen", "setzen"], ["setzen", "fuesse"], ["greifen", "toss"], ["toss", "hinlegen"]]) {
    assert.deepEqual(G.bedBlanketPose(a, 1), G.bedBlanketPose(b, 0), `${a} -> ${b}`);
  }
  // „fuesse“ schiebt nur die Füße unter die Decke – der Stoff bleibt, wo er war.
  const vor = G.bedBlanketPose("setzen", 1), nach = G.bedBlanketPose("fuesse", 1);
  for (const k of ["links", "oben", "falten", "gather"]) near(vor[k], nach[k]);
  const ende = G.bedBlanketPose("hinlegen", 1);
  near(ende.links, 320); near(ende.oben, 281); near(ende.falten, 0); near(ende.gather, 0); near(ende.welle, 0);
});

test("Beim Deckenschieben bleiben beide Füße am selben Ort", () => {
  const h = haus({
    alpha: 1, lf: 2, lx: 337, lface: 1, cur: null, pending: null, path: [], activity: null,
    bedEinstieg: "umschlagen", bedEinstiegT: 0, bedKleidungAn: "dressed", bedPyjama: null,
    elapsed: 0, scale: 1, dpr: 1, hand: [0, 0],
  });
  let erste;
  for (let i = 0; i <= 20; i++) {
    h.bedEinstiegT = 2.2 * i / 20;
    const c = canvas(); h.drawLuniNow(c.ctx);
    const socken = c.shapes.filter(s => s.color === "#ff6f61" || s.color === "#35d6c0")
      .map(({ left, right, top, bottom }) => [left, right, top, bottom]);
    assert.equal(socken.length, 2);
    if (!erste) erste = socken;
    else assert.deepEqual(socken, erste);
  }
});

test("Setzen und Hinlegen beginnen ohne Sprung von der vorherigen Pose", () => {
  const zeichne = (y, opts) => {
    const c = canvas();
    G.drawLuni(c.ctx, 337, y, { t: 0, scale: 1.08, shadow: false, ...opts });
    return {
      kopf: head(c),
      socken: c.shapes.filter(s => s.color === "#ff6f61" || s.color === "#35d6c0")
        .map(({ left, right, top, bottom }) => [left, right, top, bottom]),
    };
  };
  const griff = { handTarget: [349.7, 288.5], handElbow: 1, handKontakt: true };
  const stand = zeichne(324, { state: "idle", ...griff });
  const setzenStart = zeichne(313, { state: "sit", bedSitzen: 0, ...griff });
  const sitzen = zeichne(313, { state: "sit" });
  const setzenEnde = zeichne(313, { state: "sit", bedSitzen: 1, ...griff });
  const hinlegenStart = zeichne(313, { state: "lie", lieDown: 0 });
  for (const [a, b] of [[stand, setzenStart], [sitzen, setzenEnde], [sitzen, hinlegenStart]]) {
    near(a.kopf.x, b.kopf.x); near(a.kopf.y, b.kopf.y);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) near(a.socken[i][j], b.socken[i][j]);
  }
});

test("Hände haben je vier Finger und einen Daumen", () => {
  const c = canvas();
  G.drawLuni(c.ctx, 0, 0, { state: "idle", shadow: false, t: 0 });
  const striche = farbe => c.shapes.filter(s => s.kind === "stroke" && s.color === farbe).length;
  assert.equal(striche("#f4c9a0"), 5);
  assert.ok(striche("#e3b288") >= 5);
});

test("Saxophonhände bleiben beim Anheben, Spielen und Abstellen an den Griffen", () => {
  const h = haus({ stations: G.STATIONS, lx: 653, saxStarted: true, saxMusic: { currentTime: 0 }, elapsed: 0 });
  for (const phase of ["reach", "lift", "play", "lower"]) {
    h.saxPhase = phase;
    for (let i = 0; i <= 20; i++) {
      h.saxT = i / 20;
      h.saxMusic.currentTime = i / 10;
      const oben = h.saxGripAt(G.SAX_GRIP_UP), unten = h.saxGripAt(G.SAX_GRIP_LOW);
      const haende = { front: [0, 0], rear: [0, 0] }, c = canvas();
      G.drawLuni(c.ctx, h.lx, 200, {
        state: phase === "reach" ? "act" : "sax", t: 0, scale: 1.08, face: -1, shadow: false,
        handTarget: oben, handTarget2: unten, handElbow: 1, handElbow2: -1,
        handKontakt: true, sway: h.saxSway(), handOut: haende,
      });
      near(haende.front[0], oben[0]); near(haende.front[1], oben[1]);
      near(haende.rear[0], unten[0]); near(haende.rear[1], unten[1]);
    }
  }
});

test("Saxophonärmel beginnt am Schultergelenk; das Instrument behält seine Größe", () => {
  const h = haus({ stations: G.STATIONS, lx: 653, saxPhase: "play", saxT: 0, saxStarted: true,
    saxMusic: { currentTime: 0 }, elapsed: 0, scale: 1, dpr: 1 });
  const c = canvas();
  G.drawLuni(c.ctx, h.lx, 200, { state: "sax", t: 0, scale: 1.08, face: -1, shadow: false,
    handTarget: h.saxGripAt(G.SAX_GRIP_UP), handTarget2: h.saxGripAt(G.SAX_GRIP_LOW),
    handElbow: 1, handElbow2: -1, handKontakt: true });
  const arm = c.shapes.find(s => s.kind === "stroke" && s.color === "#dcc9a5" && s.points.length === 3);
  assert.ok(arm); near(arm.points[0][0], 653 + 3.4 * 1.08); near(arm.points[0][1], 200 - 34 * 1.08);
  const getragen = canvas(); h.drawSaxCarried(getragen.ctx);
  h.saxPhase = null;
  const abgestellt = canvas(); h.drawSax(abgestellt.ctx);
  const form = c => c.shapes.find(s => s.kind === "stroke" && s.color === "#d9a83c");
  const a = form(getragen), b = form(abgestellt);
  assert.ok(a && b); near(a.right - a.left, b.right - b.left); near(a.bottom - a.top, b.bottom - b.top);
});

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

test("UFO: Trefferfläche im sicheren Bereich, Zeilen mindestens 24 hoch", () => {
  const box = { x: 736, y: 32, w: 122, h: 58 };
  assert.equal(G.ufoTreffer(794, 62), true);
  assert.equal(G.ufoTreffer(700, 400), false);
  assert.ok(box.x >= 96 && box.x + box.w <= 864, "4:3-Beschnitt rechts");
  assert.ok(box.y >= 32, "Overscan oben");
  assert.ok(G.UFO_MENUE.hoehe >= 24, "Zeile fernsehtauglich");
  assert.equal(G.ufoZeileBei(G.UFO_MENUE.x + 10, G.UFO_MENUE.y + 5, 1), 0);
  assert.equal(G.ufoZeileBei(G.UFO_MENUE.x + 10, G.UFO_MENUE.y + 45, 1), -1);
});

test("UFO bietet genau ein Archiv mit aktuell.patch und aktuell.json", () => {
  assert.deepEqual(G.PATCH_EINTRAEGE, [G.PATCH_ZIP]);
  assert.ok(typeof G.PATCH_KURZ === "string" && G.PATCH_KURZ.length > 0, "Kurzname");
  assert.ok(Number.isInteger(G.PATCH_NUMMER) && G.PATCH_NUMMER > 0, "laufende Nummer");
  const erwartet = `LCL-${G.PATCH_KURZ}-${String(G.PATCH_NUMMER).padStart(2, "0")}.zip`;
  assert.equal(G.PATCH_ZIP, erwartet, "Namensmuster LCL-<Kurzname>-<Nummer>.zip");
  assert.match(G.PATCH_ZIP, /^LCL-[A-Za-z0-9-]+-\d{2}\.zip$/);
  assert.deepEqual(G.PATCH_DATEIEN.map(d => d.name), ["aktuell.patch", "aktuell.json"]);
  // Ohne laufende Sitzung ist das Archiv leer (Stand auf main); mit Sitzung
  // muessen Patch und Beschreibung echten Inhalt haben.
  if (!G.PATCH_DATEIEN.some(d => d.inhalt)) return;
  const patch = G.PATCH_DATEIEN.find(d => d.name === "aktuell.patch");
  assert.ok(patch.inhalt.includes("diff --git"), "aktuell.patch ist ein Patch");
  assert.ok(patch.inhalt.includes("+++ "), "aktuell.patch hat einen Anwendkopf");
  const meta = JSON.parse(G.PATCH_DATEIEN.find(d => d.name === "aktuell.json").inhalt);
  assert.ok(meta.basis && meta.basis.length >= 7, "Basis-Commit angegeben");
  assert.deepEqual(meta.archiv.slice(1), ["aktuell.patch", "aktuell.json"]);
  assert.equal(meta.archiv[0], G.PATCH_ZIP, "Archivname in der Beschreibung");
  assert.equal(meta.patchNummer, G.PATCH_NUMMER);
  assert.ok(Array.isArray(meta.geaenderteDateien) && meta.geaenderteDateien.length > 0);
  assert.ok(meta.anwendung.includes("git apply"));
});

test("ZIP-Archiv ist strukturell gültig und enthält beide Dateien unbeschädigt", () => {
  const probe = [
    { name: "aktuell.patch", inhalt: "diff --git a/beispiel b/beispiel\n--- a/beispiel\n+++ b/beispiel\n" },
    { name: "aktuell.json", inhalt: "{\n  \"basis\": \"12766e9\",\n  \"archiv\": [\"aktuell.patch\", \"aktuell.json\"]\n}\n" },
  ];
  const staemme = G.PATCH_DATEIEN.some(d => d.inhalt) ? [probe, G.PATCH_DATEIEN] : [probe];
  pruefeArchiv(staemme[0]);
  if (staemme.length > 1) pruefeArchiv(staemme[1]);
});

function pruefeArchiv(dateien) {
  const bytes = G.zipErzeugen(dateien, Date.UTC(2026, 11, 24, 10, 30, 0));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (p, n) => Buffer.from(bytes.buffer, bytes.byteOffset + p, n).toString("utf8");
  const crcTabelle = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  const crc = (p, n) => { let c = 0xffffffff; for (let i = 0; i < n; i++) c = crcTabelle[(c ^ bytes[p + i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  // Endfeld von hinten suchen
  let ende = -1;
  for (let i = bytes.length - 22; i >= 0; i--) if (view.getUint32(i, true) === 0x06054b50) { ende = i; break; }
  assert.ok(ende > 0, "Endfeld vorhanden");
  const anzahl = view.getUint16(ende + 10, true);
  assert.equal(anzahl, 2, "zwei Eintraege");
  let p = view.getUint32(ende + 16, true);
  const namen = [];
  for (let i = 0; i < anzahl; i++) {
    assert.equal(view.getUint32(p, true), 0x02014b50, "Zentralverzeichnis-Signatur");
    const namenLaenge = view.getUint16(p + 28, true);
    const groesse = view.getUint32(p + 24, true);
    const lokal = view.getUint32(p + 42, true);
    const name = text(p + 46, namenLaenge);
    namen.push(name);
    assert.equal(view.getUint32(lokal, true), 0x04034b50, "lokale Signatur");
    assert.equal(view.getUint16(lokal + 8, true), 0, "Methode 0 = gespeichert");
    assert.equal(view.getUint32(lokal + 18, true), groesse, "Groesse stimmt");
    const daten = text(lokal + 30 + namenLaenge, groesse);
    assert.equal(daten, dateien[i].inhalt, `Inhalt von ${name} unbeschädigt`);
    assert.equal(crc(lokal + 30 + namenLaenge, groesse), view.getUint32(lokal + 14, true), `CRC32 von ${name}`);
    p += 46 + namenLaenge;
  }
  assert.deepEqual(namen, ["aktuell.patch", "aktuell.json"]);
  assert.equal(view.getUint32(ende + 12, true) + view.getUint32(ende + 16, true), ende, "Groesse des Verzeichnisses");
}

test("UFO: Dreiecksform mit konstantem rotem Licht (ohne Blinken) und offenem Menü", () => {
  const c = canvas();
  G.drawUfo(c.ctx, 0, false, -1, [G.PATCH_ZIP]);
  const rumpf = c.shapes.filter(s => s.color === "#23303b");
  assert.ok(rumpf.length > 0 && Math.max(...rumpf.map(r => r.right - r.left)) >= 80, "Dreiecksrumpf");
  // Konstanter roter Schein + Positionslichter über die Zeit (kein Blinken)
  const rote = (zeit, hov = false) => {
    const k = canvas();
    G.drawUfo(k.ctx, zeit, false, -1, [G.PATCH_ZIP], hov);
    return k.arcs.filter(a => ["#d92b28", "#e22e2a", "#ff4038", "#ff463e"].includes(a.color)).length;
  };
  const r0 = rote(0);
  assert.equal(r0, 4, "Kernlicht + 3 Ecklichter");
  for (const z of [0.25, 0.7, 1.3, 2.8, 5.1]) assert.equal(rote(z), r0, `kein Blinken bei t=${z}`);
  assert.equal(rote(0, true), r0, "minimaler Hover ändert keine Lichtzahl");
  const offen = canvas();
  G.drawUfo(offen.ctx, 0, true, 0, [G.PATCH_ZIP]);
  const panel = offen.shapes.find(s => s.color === "rgba(8,20,26,.88)");
  assert.ok(panel, "Menüfläche");
  assert.ok(panel.left >= 96 && panel.right <= 864, "Menü im 4:3-Beschnitt");
  assert.equal(offen.shapes.some(s => s.kind === "stroke" && (s.color === "#eef7f2" || s.color === "#8ff2dc")), true, "Zeilenbeschriftung");
  assert.ok(offen.texte.some(t => t.inhalt === G.PATCH_ZIP), "Archivname steht im Menü");
  const zeile = offen.texte.find(t => t.inhalt === G.PATCH_ZIP);
  assert.ok(zeile.font.includes("11px") && zeile.font.includes("Space Grotesk"), "Schrift wie im Hovertext");
  assert.ok(zeile.x >= 96 && zeile.x <= 864, "Text im 4:3-Beschnitt");
  assert.ok(["#eef7f2", "#8ff2dc"].includes(zeile.farbe), "Textfarbe");
});

test("Haare beim Hinlegen weich überblendet, nicht hart umgeschaltet", () => {
  const zaehle = k => {
    const c = canvas();
    G.drawLuni(c.ctx, 0, 0, { state: "idle", shadow: false, t: 0, hairAside: k });
    return c.shapes.filter(s => s.color === "#191920").length;
  };
  const offen = zaehle(0), seitlich = zaehle(1), mitte = zaehle(0.5);
  assert.ok(mitte > offen && mitte > seitlich, `Mitte ${mitte}, offen ${offen}, seitlich ${seitlich}`);
});

test("Haare bleiben neben dem Ohr liegen und springen nicht zurück", () => {
  const h = haus({
    welt: "normal", alpha: 1, lf: 2, lx: 337, lface: 1, cur: null, pending: null, path: [],
    activity: null, target: null, asleep: false, sleepPhase: null, sleepPhaseT: 0, lieDown: false,
    lieT: 0, bedEinstieg: null, bedPhase: null, wakeT: 0, wakeNext: null, shPhase: null,
    glassesOn: false, glassesInSink: false, glassesRest: null, glassesInHand: false, glassesFly: null,
    outfit: "dressed", pyjama: null, bedKleidungAn: "dressed", bedPyjama: null, elapsed: 2,
    hand: [0, 0], stations: G.STATIONS, bedSitHair: 0, walkP: 0, blink: 0, scale: 1, dpr: 1,
    sleepRest: 0, sleepT: 0, luniHaende: null, luniKopf: null,
  });
  const verlauf = [];
  h.lieDown = true;
  for (let i = 0; i <= 28; i++) {
    h.lieT = i * 0.05;
    const c = canvas(); h.drawLuniNow(c.ctx);
    verlauf.push(h.bedSitHair);
  }
  const hoechstNachHinlegen = Math.max(...verlauf);
  assert.ok(hoechstNachHinlegen > 0.9, "Strähne ist gelegen");
  h.lieDown = false; h.sleepPhase = "grab"; h.sleepPhaseT = 0;
  for (let i = 0; i < 240; i++) {
    h.updateBedState(0.05);
    const c = canvas(); h.drawLuniNow(c.ctx);
    verlauf.push(h.bedSitHair);
    if (h.asleep) break;
  }
  for (let i = 1; i < verlauf.length; i++) {
    assert.ok(verlauf[i] >= verlauf[i - 1] - 1e-9, `Sprung bei ${i}: ${verlauf[i - 1]} -> ${verlauf[i]}`);
  }
  assert.equal(h.asleep, true, "schläft ein");
  assert.equal(verlauf[verlauf.length - 1], 1);
  assert.ok(verlauf.slice(29).every(v => v >= hoechstNachHinlegen - 1e-9), "grab/pull/turn legen nichts zurück");
  // Aufstehen gibt die Haare frei
  h.asleep = false; h.sleepPhase = null; h.lieDown = false;
  h.updateBedState(0.05);
  assert.equal(h.bedSitHair, 0);
});

test("Zudecken: Stoff behält Dicke und Fußende, nur die Nahkante wandert", () => {
  let vorher = null;
  for (let i = 0; i <= 40; i++) {
    const p = i / 40, c = canvas();
    G.drawBedEntryBlanket(c.ctx, 0.3, "hinlegen", p);
    const stoff = c.shapes.find(q => q.color === "#3f7f8c");
    near(stoff.right, 386);
    near(stoff.bottom, 308);
    // Die aufgerollte Nahkante steht bis ca. 4 Einheiten höher; der Körper bleibt bei 281.
    if (p >= 0.25) assert.ok(Math.abs(stoff.top - 281) <= 4, `Oberkante ${stoff.top.toFixed(2)} bei p=${p}`);
    if (vorher) assert.ok(stoff.left <= vorher.left + 1e-9, `Nahkante läuft zurück bei p=${p}`);
    vorher = stoff;
  }
});

test("Zudecken schließt nahtlos an das Hochziehen an (gleiches Bild am Übergang)", () => {
  const a = canvas(); G.drawBedEntryBlanket(a.ctx, 0.5, "toss", 1);
  const b = canvas(); G.drawBedEntryBlanket(b.ctx, 0.5, "hinlegen", 0);
  const sa = a.shapes.find(q => q.color === "#3f7f8c"), sb = b.shapes.find(q => q.color === "#3f7f8c");
  for (const k of ["left", "right", "top", "bottom"]) near(sa[k], sb[k]);
  const ta = a.shapes.filter(q => q.color === "#5da0a8").length, tb = b.shapes.filter(q => q.color === "#5da0a8").length;
  assert.equal(ta, tb, "gleiche Zierlinien am Übergang");
});

test("Kräuselung läuft nur beim Zudecken und ist an beiden Enden null", () => {
  assert.equal(G.bedBlanketPose("hinlegen", 0).welle, 0);
  assert.ok(Math.abs(G.bedBlanketPose("hinlegen", 1).welle) < 1e-9);
  assert.ok(G.bedBlanketPose("hinlegen", 0.5).welle > 1);
  for (const phase of ["umschlagen", "greifen", "toss"]) {
    for (const p of [0, 0.5, 1]) assert.equal(G.bedBlanketPose(phase, p).welle, 0, `${phase} ${p}`);
  }
});

test("Aufdecken bleibt unverändert: ohne Kräuselung dieselbe Oberkante wie zuvor", () => {
  const c = canvas(); G.drawBedEntryBlanket(c.ctx, 0.9, "greifen", 0.5);
  const s = c.shapes.find(q => q.color === "#3f7f8c");
  assert.ok(s.top > 280 && s.top < 286, `Oberkante ${s.top}`);
});

test("Zudecken: Figur wird vor dem Stoff beschnitten, Decke bleibt frei", () => {
  const src = readFileSync("src/game/house.ts", "utf8");
  const clip = src.indexOf("function clipBedCover(");
  const szene = src.indexOf("function drawBedScene(");
  const hinlegen = src.indexOf("if (this.lieDown && !this.asleep)");
  assert.ok(clip > 0 && szene > 0 && hinlegen > 0);
  const szeneEnde = src.indexOf("function drawBedCloth(", szene);
  const szeneText = src.slice(szene, szeneEnde);
  assert.ok(szeneText.indexOf("clipBedCover(") < szeneText.indexOf("drawLuni("), "Clip vor der Figur");
  assert.ok(szeneText.lastIndexOf("c.restore()") < szeneText.lastIndexOf("drawBlanket("), "Decke nach dem Clip");
  const hinText = src.slice(hinlegen, src.indexOf("const ruhtImBett", hinlegen));
  assert.ok(hinText.includes("clipBedCover("), "Hinlegen nutzt dieselbe Abdeckung");
  assert.ok(hinText.indexOf("drawBedEntryBlanket(") > hinText.indexOf("c.restore()"), "Stoff zuletzt");
  assert.ok(src.includes('c.clip("evenodd")'), "Kopf bleibt ausgespart");
});

test("Unter der Decke wird kein Handobjekt nachträglich über den Stoff gezeichnet", () => {
  const h = haus({ lieDown: true, glassesInHand: true, brushInHand: true,
    hand: [360, 290], lface: 1, shPhase: null, glassesFly: null,
    golInserted: false, golOnShelf: false });
  const c = canvas();
  h.drawGlassesMoving(c.ctx);
  h.drawGolInHand(c.ctx);
  assert.equal(c.shapes.some(z => z.color === "#f4c9a0"), false, "keine Hautfläche an der Hand");
  assert.equal(c.shapes.length, 0, "kein Handgegenstand");
  // Außerhalb des Bettes bleiben die Objekte erhalten.
  h.lieDown = false;
  const d = canvas();
  h.drawGlassesMoving(d.ctx);
  h.drawGolInHand(d.ctx);
  assert.ok(d.shapes.length > 0, "Geh-/Stehphase unverändert");
});

test("Im Bett bleiben nur Kopf, Hals und Schulter; Arme und Socken fehlen", () => {
  const ohne = canvas(), mit = canvas();
  const opts = { state: "lie", t: 0, scale: 1.08, shadow: false, glasses: true };
  G.drawLuni(ohne.ctx, 345, 292, opts);
  G.drawLuni(mit.ctx, 345, 292, { ...opts, bedCover: true });
  const socken = c => c.shapes.filter(z => ["#ff6f61", "#35d6c0", "#ffd166", "#c3e84f"].includes(z.color)).length;
  assert.ok(socken(ohne) > 0, "normalerweise Socken sichtbar");
  assert.equal(socken(mit), 0, "unter der Decke keine Socken");
  const hand = c => c.shapes.filter(z => z.kind === "stroke" && ["#f4c9a0", "#e3b288"].includes(z.color)).length;
  assert.ok(hand(ohne) >= 8, "normalerweise Finger sichtbar");
  assert.equal(hand(mit), 0, "unter der Decke keine Finger");
  assert.ok(mit.shapes.length < ohne.shapes.length, "Figur schlanker");
  // Kopf bleibt erhalten
  assert.ok(head(ohne) && head(mit), "Kopf bleibt in beiden Fällen");
  near(head(mit).x, head(ohne).x); near(head(mit).y, head(ohne).y);
});

test("Beide Bett-Zeichnungen setzen bedCover; die Decke behält ihre eigene Form", () => {
  const src = readFileSync("src/game/house.ts", "utf8");
  assert.ok(src.includes("hairAside: o.hair, bedCover: true"), "Schlafszene");
  assert.ok(src.includes("bedCover: true,"), "Hinlegen");
  const luni = readFileSync("src/game/luni.ts", "utf8");
  assert.ok(luni.includes("bedCover = false"), "Vorgabe aus");
  assert.ok((luni.match(/!bedCover/g) || []).length >= 7, "Gliedmaßen konsequent aus");
  // Organische Bewegung bleibt: Kräuselung und Rollen sind weiter aktiv.
  assert.ok(src.includes("const rip = (x: number)"), "wellige Oberkante");
  assert.ok(src.includes("g * 9"), "Rollkante hebt sich");
});

test("Umziehen: ganze Arme vor dem Rumpf, keine Oberarme auf dem Rücken", () => {
  const src = readFileSync("src/game/luni.ts", "utf8");
  assert.ok(src.includes("const armeVorn = state === \"undress\" || state === \"wrap\""));
  assert.ok(src.includes("if (!bedCover && (!arms.behind || armeVorn)) drawArms(false);"));
  assert.equal(src.includes("drawArms(oberteilArbeit)"), false, "Aufteilung entfernt");
  const c = canvas();
  G.drawLuni(c.ctx, 0, 0, { state: "undress", phase: 0.5, back: true, shadow: false, t: 0 });
  const arme = c.shapes.filter(z => z.kind === "stroke" &&
    ["#dcc9a5", "#c4ad84"].includes(z.color));
  const ganz = arme.filter(z => z.points && z.points.length >= 3);
  const halb = arme.filter(z => z.points && z.points.length === 2);
  assert.ok(ganz.length >= 2, "zwei ganze Arme sichtbar");
  assert.equal(halb.length, 0, "keine abgetrennten Oberarme");
});

test("Brillenwurf: immer Nachttisch, nie Boden", () => {
  const src = readFileSync("src/game/house.ts", "utf8");
  const anfang = src.indexOf("private beginBedToss()");
  const text = src.slice(anfang, anfang + 700);
  assert.ok(text.includes("this.tossLand = 0"), "Landeplatz fest auf Nachttisch");
  assert.equal(text.includes("r < 0.4"), false, "keine Zufallsverteilung mehr");
  const h = haus({ glassesOn: true, glassesInHand: false,
    tossLand: 5, tossUp: 0, tossLanded: false, bedPhase: null });
  h.beginBedToss();
  assert.equal(h.tossLand, 0);
  for (const land of [0, 1, 2, 3, 4, 5]) {
    h.tossLand = land;
    const [x, y] = h.tossTarget();
    assert.ok(y <= 324 - 26 + 1, `Landeplatz ${land} liegt nicht auf dem Boden (y=${y})`);
    assert.ok(x > 380 && x < 420, `Landeplatz ${land} am Nachttisch (x=${x})`);
  }
});

test("UFO-Generator erhöht die Nummer nur bei Erfolg und benennt das Archiv nach Muster", () => {
  const gen = readFileSync("tools/ufo-bauen.mjs", "utf8");
  assert.ok(gen.includes("naechsteNummer = vorher.nummer === null ? 22 : vorher.nummer + 1"), "Zähler wird erhöht");
  assert.ok(gen.includes("padStart(2, \"0\")"), "zweistellig");
  assert.ok(gen.includes("const zipName = `LCL-${kurz}-${String(nummer).padStart(2, \"0\")}.zip`"), "Namensmuster");
  assert.ok(gen.includes("export const PATCH_NUMMER"), "Nummer im Modul");
  assert.ok(gen.includes("createHash"), "Prüfsumme wird berechnet");
  assert.ok(gen.includes("writeFileSync(ziel, original"), "Original wird bei Fehlern wiederhergestellt");
});

test("TV-Geräte: beide Fernseher öffnen die große Fernseh-Ansicht unabhängig von GOL", () => {
  const h = haus({
    stations: G.STATIONS, golInserted: false, golOnShelf: true, golState: null,
    tvMode: "cozy", tvZoom: null, tvManual: { tv_e: null, tv_d: null },
    activity: null, cur: null, path: [], pending: null, target: null,
    harvestClock: 5, harvestCrops: [0.3, 0.5, 0.8, 1, 0, 0.2], harvestSpot: 0,
    harvestFrom: 0, harvestTo: 1, harvestMoveT: 0, harvestMoving: false, harvestCoins: 15,
    elapsed: 5,
  });
  assert.equal(h.hitLivingTv(460, 410), true, "Wohnzimmer-TV getroffen");
  assert.equal(h.hitLivingTv(340, 420), false, "Sofa bleibt Station");
  assert.equal(h.hitAtticTv(436, 155), true, "Dachgeschoss-TV getroffen");
  assert.equal(h.hitAtticTv(320, 185), false, "Sitzsack bleibt Station");

  h.openTvZoom("tv_e");
  assert.equal(h.tvZoom, "tv_e");
  const ce = canvas(); h.drawTvFullscreen(ce.ctx);
  assert.ok(ce.shapes.some(z => z.color === "#8a6a3c"), "Wohnzimmer-Holzfernseher sichtbar");
  assert.ok(ce.texte.some(t => t.inhalt === "zurück"), "Zurück-Knopf sichtbar");
  assert.ok(ce.texte.some(t => t.inhalt === "STANDBY"), "Aus-Zustand ohne Luni sichtbar");

  // Einschalten über den Power-Knopf zeigt das TV-Programm (Harvest CH1)
  h.onTvFullscreenClick(780, 390);
  const ceAn = canvas(); h.drawTvFullscreen(ceAn.ctx);
  assert.ok(ceAn.texte.some(t => t.inhalt === "CH1"), "laufendes TV-Programm groß im Fernseher");

  // Klick auf Dachgeschoss-TV zeigt modernen Fernseher
  h.openTvZoom("tv_d");
  assert.equal(h.tvZoom, "tv_d");
  h.tvManual.tv_d = true;
  const cd = canvas(); h.drawTvFullscreen(cd.ctx);
  assert.ok(cd.shapes.some(z => z.color === "#15171c"), "Dachgeschoss-Fernsehergehäuse sichtbar");
  assert.ok(cd.texte.some(t => t.inhalt === "CH1" || t.inhalt === "CH2"), "Programm auf Dachgeschoss-TV");

  // Zurück schließt die Ansicht
  h.onTvFullscreenClick(460, 435);
  assert.equal(h.tvZoom, null);
});

test("TV-Geräte: großer Fernseher bleibt im Wii-4:3- und Overscan-Bereich", () => {
  const src = readFileSync("src/game/house.ts", "utf8");
  const tvStart = src.indexOf("private drawTvFullscreen(");
  const tvText = src.slice(tvStart, src.indexOf("private applyGolCtrl(", tvStart));
  assert.ok(tvText.includes("rrect(c, 116, 48, 728, 434"), "Wohnzimmer-TV innerhalb 96..864");
  assert.ok(tvText.includes("rrect(c, 104, 34, 752, 344"), "Dachgeschoss-TV innerhalb 96..864");
  assert.ok(src.includes("TV_BACK_E") && src.includes("TV_BACK_D"), "Zurück-Tasten definiert");
});

test("Plattenspieler: gtlg02.mid-Noten, alle Instrumente und Bassimpuls vorhanden", () => {
  assert.equal(G.PLATTEN_NOTES.length, 3186);
  assert.equal(G.PLATTEN_TICKS_PER_SECOND, 1920);
  assert.ok(G.PLATTEN_DURATION_SECONDS > 140 && G.PLATTEN_DURATION_SECONDS < 143);
  const insts = new Set(G.PLATTEN_NOTES.map(n => n[3]));
  for (const i of [0, 1, 2, 3, 4]) assert.ok(insts.has(i), `Instrument ${i}`);
  assert.equal(G.plattenBassPulse(0.5), 0, "vor dem ersten Basston ruhig");
  assert.ok(G.plattenBassPulse(1.8) > 0.45, "Bass-Einsatz bei 1.79s");
  assert.ok(G.plattenBassPulse(4.94) > 0.85, "Kick+Bass-Schlag bei 4.93s");
  assert.ok(G.plattenBassPulse(4.94) > G.plattenBassPulse(5.25), "klingt nach Schlag ab");
});

test("Plattenspieler-Grafik: Platte dreht sichtbar, Tonarm hebt/dreht/senkt sich, Boxen pulsieren", () => {
  const c0 = canvas(); G.recordPlayer(c0.ctx, 698, 200, { power: false, spin: 0, armLift: 0, armTurn: 0 });
  const c1 = canvas(); G.recordPlayer(c1.ctx, 698, 200, { power: true, spin: 1.5, armLift: 1, armTurn: 1 });
  const punkt = c => c.arcs.find(a => a.color === "#f7efe2");
  assert.ok(punkt(c0) && punkt(c1), "mitdrehender Punkt auf rotem Etikett");
  assert.notEqual(punkt(c0).x.toFixed(2), punkt(c1).x.toFixed(2), "Etikettpunkt dreht sich");
  assert.ok(c1.arcs.some(a => a.color === "#35d6c0"), "LED leuchtet grün bei power=true");
  const arm = c => c.shapes.find(s => s.kind === "stroke" && s.color === "#c3d0cf");
  assert.ok(arm(c1).left < arm(c0).left - 5, "Tonarm schwenkt zur Platte");
  assert.ok(arm(c1).top < arm(c0).top - 2, "Tonarm hebt sich sichtbar");

  const b0 = canvas(); G.speaker(b0.ctx, 678, 200, 0);
  const b1 = canvas(); G.speaker(b1.ctx, 678, 200, 0.9);
  const woofer = c => Math.max(...c.arcs.filter(a => a.color === "#16130f").map(a => a.r));
  assert.ok(woofer(b1) > woofer(b0) + 0.8, "Boxenmembran pulsiert nach außen");
});

test("Plattenspieler-Ablauf: Einschalten -> Wegtreten -> Heben -> Drehen -> Senken -> Abspielen -> Auslauf", () => {
  const h = haus({
    stations: G.STATIONS, lf: 3, lx: 696, lface: 1,
    plattenPhase: null, plattenT: 0, plattenPower: false, plattenSpin: 0,
    plattenArmLift: 0, plattenArmTurn: 0, plattenEndFrom: 1, plattenBass: 0,
    plattenMusic: null, plattenReady: false, plattenPreparing: false,
    plattenStarted: false, plattenPausedAt: null, musikzimmer: null,
    danceSeg: 0, danceT: 0, danceStil: "danceSway", danceRueck: false,
    danceTreppe: false, danceTreppeT: 0, danceTreppeStair: null, danceTreppeDir: 1,
    activity: G.STATIONS.find(s => s.id === "platten"), target: null, cur: null, path: [],
  });
  h.preparePlatten = () => {};
  h.startPlatten();
  assert.equal(h.plattenPhase, "switchOn");
  const phasen = [h.plattenPhase];
  for (let i = 0; i < 120; i++) {
    h.updatePlatten(0.05);
    if (h.plattenPhase !== phasen[phasen.length - 1]) phasen.push(h.plattenPhase);
    if (h.plattenPhase === "play") break;
  }
  assert.deepEqual(phasen, ["switchOn", "stepAside", "armLift", "armTurn", "armLower", "play"]);
  assert.equal(h.plattenPower, true, "Anlage eingeschaltet");
  assert.equal(h.lx, 668, "Luni steht frei links der Anlage");
  assert.equal(h.plattenArmLift, 0, "Nadel liegt auf der Platte");
  assert.ok(h.plattenArmTurn >= 1, "Tonarm über der Platte");

  // Während des Spielens dreht sich die Platte und die Boxen pulsieren zum Bass
  const spinVorher = h.plattenSpin;
  h.plattenT = 4.94;
  h.updatePlatten(0.02);
  assert.notEqual(h.plattenSpin, spinVorher, "Platte dreht sich weiter");
  assert.ok(h.plattenBass > 0.7, `Bassimpuls bei 4.94s: ${h.plattenBass}`);

  // Auslauf zum Ende des Liedes
  h.plattenT = G.PLATTEN_DURATION_SECONDS;
  h.updatePlatten(0.02);
  const auslauf = [h.plattenPhase];
  for (let i = 0; i < 80; i++) {
    h.updatePlatten(0.05);
    if (h.plattenPhase !== auslauf[auslauf.length - 1]) auslauf.push(h.plattenPhase);
    if (!h.plattenPhase) break;
  }
  assert.deepEqual(auslauf, ["armEndLift", "armEndTurn", "armEndLower", null]);
  assert.equal(h.plattenPower, false, "Anlage am Ende ausgeschaltet");
  assert.equal(h.plattenArmTurn, 0, "Tonarm zurück auf Ruheposten");
});

test("UFO: Prüfsumme in aktuell.json stimmt mit dem unveränderten Patch überein", () => {
  if (!G.PATCH_DATEIEN.some(d => d.inhalt)) return;
  const patch = G.PATCH_DATEIEN.find(d => d.name === "aktuell.patch").inhalt;
  const meta = JSON.parse(G.PATCH_DATEIEN.find(d => d.name === "aktuell.json").inhalt);
  const hash = createHash("sha256").update(patch, "utf8").digest("hex");
  // Alle üblichen Feldnamen führen denselben Wert, damit jedes Prüfskript sie findet.
  for (const feld of ["pruefsumme", "checksum", "sha256", "hash"]) {
    assert.match(String(meta[feld]), /^[0-9a-f]{64}$/, `${feld}: 64 Hex-Zeichen`);
    assert.equal(meta[feld], hash, `${feld} ist sha256(aktuell.patch)`);
  }
  assert.equal(meta.pruefsummeAlgorithmus, "sha256");
  assert.equal(meta.algorithmus, "sha256");
  assert.equal(meta.pruefsummeLaenge, 64);
  assert.equal(meta.patchGroesseBytes, Buffer.byteLength(patch, "utf8"), "Größe in Bytes");
});

test("Tanzposen: Ellenbogen außen, kein Hüpfen und keine Drehungen", () => {
  const quelle = readFileSync("src/game/luni.ts", "utf8");
  assert.ok(!quelle.includes('"danceHop"'), "Hüpfen entfernt");
  assert.ok(!quelle.includes('"danceSpin"'), "Drehen entfernt");
  const posen = ["danceSway", "danceTwist", "danceDisco", "danceMoonwalk", "danceGlide", "danceSlide"];
  for (const p of posen) assert.ok(quelle.includes(`case "${p}"`), p);
  for (const p of posen) {
    const c = canvas();
    G.drawLuni(c.ctx, 0, 0, { state: p, t: 0.7, face: 1, shadow: false, scale: 1 });
    const arme = c.shapes.filter(z => z.kind === "stroke" &&
      ["#dcc9a5", "#c4ad84"].includes(z.color) && z.points && z.points.length >= 3);
    assert.ok(arme.length >= 2, `${p}: zwei ganze Arme`);
    for (const arm of arme) {
      const schulter = arm.points[0];
      const ellbogen = arm.points[1];
      assert.ok(
        Math.abs(ellbogen[0]) >= Math.abs(schulter[0]) - 0.4,
        `${p}: Ellenbogen liegt außen (${ellbogen[0].toFixed(1)} bei Schulter ${schulter[0].toFixed(1)})`,
      );
    }
    // Arme und Hände liegen VOR dem Rumpf: sie werden nach dem Torso gezeichnet
    const torsoIdx = c.shapes.findIndex(z => z.color === "#dcc9a5" && z.kind !== "stroke");
    const armIdx = c.shapes.findIndex(z => z.kind === "stroke" && ["#dcc9a5", "#c4ad84"].includes(z.color));
    assert.ok(torsoIdx >= 0 && armIdx > torsoIdx, `${p}: Arme liegen vor dem Körper`);
  }
});

test("Moonwalk: keine Socken-Wechsel, Füße bleiben auf ihrer Seite", () => {
  const fussPos = t => {
    const c = canvas();
    G.drawLuni(c.ctx, 0, 0, { state: "danceMoonwalk", t, face: 1, shadow: false, scale: 1 });
    const rot = c.shapes.filter(z => z.color === "#ff6f61").map(z => (z.left + z.right) / 2);
    const tuerkis = c.shapes.filter(z => z.color === "#35d6c0").map(z => (z.left + z.right) / 2);
    return { rot, tuerkis };
  };
  // Über einen vollen Zyklus: die türkise Socke bleibt vorn, die rote hinten
  for (const t of [0, 0.13, 0.26, 0.4, 0.53, 0.66, 0.8, 0.95]) {
    const f = fussPos(t);
    assert.equal(f.rot.length, 1, "eine rote Socke");
    assert.equal(f.tuerkis.length, 1, "eine türkise Socke");
    assert.ok(f.tuerkis[0] > f.rot[0] + 2, `Socken wechseln nicht die Seite (t=${t})`);
  }
  // Die Pose bewegt sich über die Zeit (Gleiten), steht also nie still
  const a = fussPos(0.1), b = fussPos(0.35);
  assert.ok(Math.abs(a.tuerkis[0] - b.tuerkis[0]) > 0.5, "Füße gleiten");
  // Tour: Moonwalk-Segmente sind reine Bewegungssegmente (nie auf der Stelle)
  const tour = readFileSync("src/game/house.ts", "utf8");
  const segs = [...tour.matchAll(/\{ floor: \d, x: \d+, stil: "danceMoonwalk", dauer: (\d+), tempo: \d+ \}/g)];
  assert.ok(segs.length >= 2, "Moonwalk in der Tour");
  for (const mSeg of segs) assert.equal(mSeg[1], "0", "Moonwalk-Segment gleitet durch (dauer 0)");
});

test("Torjubel: Anlauf mit Blick nach links, dann Rutscher auf beiden Knien ins Wohnzimmer", () => {
  const quelle = readFileSync("src/game/house.ts", "utf8");
  const tour = quelle.slice(quelle.indexOf("PLATTEN_TOUR"), quelle.indexOf("PLATTEN_RUECKKEHR"));
  // Anlauf: schnelles Lauf-Segment direkt vor dem Rutscher
  const segs = [...tour.matchAll(/\{ floor: (\d), x: (\d+), stil: "([a-zA-Z]+)", dauer: (\d+), tempo: (\d+) \}/g)]
    .map(mm => ({ floor: +mm[1], x: +mm[2], stil: mm[3], dauer: +mm[4], tempo: +mm[5] }));
  const rutsch = segs.findIndex(z => z.stil === "danceSlide");
  assert.ok(rutsch >= 1, "Rutscher in der Tour");
  const anlauf = segs[rutsch - 1];
  assert.equal(anlauf.stil, "run", "direkt davor: Anlauf");
  assert.ok(anlauf.tempo >= 95, "Anlauf ist schneller");
  assert.ok(anlauf.x > segs[rutsch].x, "Anlauf läuft nach links");
  assert.equal(segs[rutsch].floor, 1, "Rutscher im Erdgeschoss (Wohnzimmer)");
  assert.ok(quelle.includes('if (state === "danceSlide") face = -1;'), "Blick beim Rutschen nach links");
  // Pose: beide Knie auf dem Boden (Welt y ≈ 0), Füße schleifen hinten
  const pose = readFileSync("src/game/luni.ts", "utf8");
  const abschnitt = pose.slice(pose.indexOf('case "danceSlide"'), pose.indexOf('case "handstand"'));
  assert.ok(abschnitt.includes("Torjubel"), "Kommentar: Torjubel");
  assert.ok(abschnitt.includes("r.rootY = 8"), "Hüfte auf Knieshöhe");
  assert.ok(abschnitt.includes("r.footNearDir = -1;") && abschnitt.includes("r.footFarDir = -1;"), "Füße zeigen nach hinten");
  const c = canvas();
  G.drawLuni(c.ctx, 0, 0, { state: "danceSlide", t: 0.5, face: -1, shadow: false, scale: 1 });
  const socken = c.shapes.filter(z => ["#ff6f61", "#35d6c0"].includes(z.color)).map(z => z.bottom);
  assert.equal(socken.length, 2, "beide Füße sichtbar");
  // Fußpunkte bei y≈0; die Sockenform selbst darf durch die Drehung etwas reichen
  assert.ok(socken.every(v => v > -2 && v < 4), `Knie/Füße am Boden: ${socken.map(v => v.toFixed(1))}`);
});

/** Aktuelles Tour-Segment (auch beim Rückweg, das dann danceGlide ist). */
const PLATTEN_SEG = h => (h.danceRueck
  ? { floor: 3, x: 668, stil: "danceGlide", dauer: 0, tempo: 34 }
  : G.PLATTEN_TOUR[Math.min(h.danceSeg, G.PLATTEN_TOUR.length - 1)]);

test("Tanzen: Arme und Hände liegen vor Körper und Haaren", () => {
  for (const p of ["danceSway", "danceDisco", "danceStep", "danceKick", "danceSlide"]) {
    const c = canvas();
    G.drawLuni(c.ctx, 0, 0, { state: p, t: 0.9, face: 1, shadow: false, scale: 1 });
    const arme = c.shapes.filter(z => z.kind === "stroke" && ["#dcc9a5", "#c4ad84"].includes(z.color));
    const haare = c.shapes.filter(z => z.color === "#191920");
    assert.ok(arme.length >= 2 && haare.length >= 2, `${p}: Arme und Haare gezeichnet`);
    const letzterArm = c.shapes.lastIndexOf(arme[arme.length - 1]);
    const letztesHaar = c.shapes.lastIndexOf(haare[haare.length - 1]);
    assert.ok(letzterArm > letztesHaar, `${p}: Arme kommen nach den Haaren (liegen vorn)`);
  }
});

test("Tanz-Tour: beschwingt durchs Haus, Knie-Rutscher ins Wohnzimmer, Rückkehr zur Anlage", () => {
  const h = haus({
    stations: G.STATIONS, lf: 3, lx: 668, lface: 1,
    plattenPhase: "play", plattenT: 0, plattenPower: true, plattenSpin: 0,
    plattenArmLift: 0, plattenArmTurn: 1, plattenEndFrom: 1, plattenBass: 0,
    plattenMusic: null, plattenReady: false, plattenPreparing: false,
    plattenStarted: false, plattenPausedAt: null, musikzimmer: null,
    danceSeg: 0, danceT: 0, danceStil: "danceSway", danceRueck: false,
    danceTreppe: false, danceTreppeT: 0, danceTreppeStair: null, danceTreppeDir: 1,
    activity: null, target: null, cur: null, path: [],
  });
  // Musikzeit simulieren (echte Zeitachse), damit die Tour bis zum Ende läuft
  let zeit = 0;
  const etagen = [];
  let rutscher = false;
  let moonwalk = false;
  let gleiten = false;
  let treppenTanz = false;
  let anlauf = false;
  const neueMoves = new Set();
  let maxFeder = 0;
  for (let i = 0; i < 6000; i++) {
    zeit += 0.05;
    h.plattenStarted = true;
    h.plattenMusic = { currentTime: zeit, stop() {} };
    h.updatePlatten(0.05);
    if (h.plattenPhase !== "play") break;
    if (!etagen.includes(h.lf)) etagen.push(h.lf);
    // Der Rutscher läuft als aktuelles Segment im Wohnzimmer (EG)
    if (h.lf === 1 && PLATTEN_SEG(h).stil === "danceSlide") rutscher = true;
    if (h.danceStil === "danceMoonwalk") moonwalk = true;
    if (h.danceStil === "danceGlide" && h.danceTreppe) treppenTanz = true;
    if (h.danceStil === "danceGlide") gleiten = true;
    if (h.danceStil === "run") anlauf = true;
    if (h.danceStil === "danceStep" || h.danceStil === "danceKick") neueMoves.add(h.danceStil);
    if (h.plattenBass > maxFeder) maxFeder = h.plattenBass;
  }
  assert.deepEqual(etagen, [3, 2, 1], "alle drei Etagen besucht");
  assert.ok(rutscher, "Knie-Rutscher im Wohnzimmer (danceSlide)");
  assert.ok(moonwalk, "Moonwalk dabei");
  assert.ok(gleiten, "gleitende Tanzschritte statt Stillstand");
  assert.ok(treppenTanz, "Treppen werden mitgetanzt");
  assert.ok(anlauf, "Anlauf (run) vor dem Rutscher");
  assert.ok(neueMoves.has("danceStep") && neueMoves.has("danceKick"), "neue Tanz-Moves dabei");
  assert.ok(maxFeder > 0.6, "Boxen pulsieren zum Bass");
  assert.ok(h.danceRueck, "Rückweg zur Anlage eingeleitet");
  assert.equal(h.lf, 3, "zurück im Dachgeschoss");
  assert.ok(Math.abs(h.lx - 668) < 3, `zurück an der Anlage (x=${h.lx.toFixed(1)})`);
});

test("Froschlied: 53 Noten aus der MIDI, einstimmig, Mund passend zum Ton", () => {
  assert.equal(G.FROSCH_NOTES.length, 53);
  assert.equal(G.FROSCH_TICKS_PER_SECOND, 1920);
  assert.ok(Math.abs(G.FROSCH_DURATION_SECONDS - 30.85) < 0.01);
  assert.deepEqual(G.FROSCH_NOTES[0].slice(0, 2), [0, 422]);
  for (const n of G.FROSCH_NOTES) assert.equal(n[3], 100, "einheitlicher Anschlag");
  for (let i = 1; i < G.FROSCH_NOTES.length; i++) {
    const vor = G.FROSCH_NOTES[i - 1];
    assert.ok(G.FROSCH_NOTES[i][0] >= vor[0] + vor[1], `Note ${i} überlappt nicht`);
  }
  assert.equal(G.froschMundOffen(-0.1), 0, "vor dem ersten Ton geschlossen");
  assert.ok(G.froschMundOffen(0.08) > 0.5, "zur ersten Note offen");
  // Zwischen aufeinanderfolgenden nahtlosen Noten schließt sich der Mund sichtbar
  assert.equal(G.froschMundOffen(0.20), 0, "schließt am Ende der ersten Note vor dem Übergang");
  assert.ok(G.froschMundOffen(0.35) > 0.5, "öffnet wieder zur zweiten Note");
  assert.equal(G.froschMundOffen(6.7), 0, "in der Pause geschlossen");
  assert.equal(G.froschMundOffen(99), 0, "nach dem Lied geschlossen");
  // Über das gesamte Lied bewegt sich der Mund: viele geschlossene UND offene Momente
  let offenZahl = 0, zuZahl = 0;
  for (let t = 0; t < G.FROSCH_DURATION_SECONDS; t += 0.04) {
    const o = G.froschMundOffen(t);
    if (o > 0.45) offenZahl++;
    if (o < 0.08) zuZahl++;
  }
  assert.ok(offenZahl > 100 && zuZahl > 100, `Mund bewegt sich (${offenZahl} offen, ${zuZahl} zu)`);
  const c0 = canvas();
  G.drawLuni(c0.ctx, 0, 0, { state: "danceSway", expr: "sing", singOpen: 0, t: 0, shadow: false });
  const c1 = canvas();
  G.drawLuni(c1.ctx, 0, 0, { state: "danceSway", expr: "sing", singOpen: 1, t: 0, shadow: false });
  const mund0 = c0.shapes.find(z => z.color === "#a35f4a");
  const mund1 = c1.shapes.find(z => z.color === "#a35f4a");
  assert.ok(mund0 && mund1, "singender Mund gezeichnet");
  assert.equal(mund0.kind, "stroke", "bei singOpen=0 geschlossener Strich");
  assert.equal(mund1.kind, "ellipse", "bei singOpen=1 offenes Oval");
});

test("Gesang an der Gitarre: hingehen, singen, Mund bewegt sich, danach aufräumen", () => {
  const h = haus({
    stations: G.STATIONS, lf: 3, lx: 800, lface: 1,
    singPhase: null, singT: 0, singMusic: null, singReady: false, singPreparing: false,
    singStarted: false, singPausedAt: null, musikzimmer: null,
    activity: G.STATIONS.find(z => z.id === "gitarre"), target: null, cur: null, path: [],
  });
  h.prepareSing = () => {};
  h.startSing();
  assert.equal(h.singPhase, "sing");
  for (let i = 0; i < 10; i++) h.updateSing(0.05);
  assert.equal(h.singPhase, "sing", "Lied läuft noch");
  h.singT = G.FROSCH_DURATION_SECONDS;
  h.updateSing(0.02);
  assert.equal(h.singPhase, null, "nach dem Lied ist Ruhe");
  assert.equal(h.activity, null);
  assert.equal(h.target, null);
});

test("Frosch-Töne: exakte MIDI-Tonhöhen, saubere Dauer, kein Clipping", () => {
  const quelle = readFileSync("src/game/audio/froschVoice.ts", "utf8");
  assert.ok(quelle.includes("`${pitch}:${durTicks}`"), "Cache unterscheidet nach Tonhöhe und Dauer");
  const sr = 24000;
  const fakeCtx = {
    sampleRate: sr,
    createBuffer: (ch, n) => {
      const daten = new Float32Array(n);
      return { length: n, duration: n / sr, getChannelData: () => daten };
    },
  };
  const f0 = (daten, start) => {
    const seg = daten.slice(start, start + 1024);
    let bestLag = 0, bestVal = -Infinity;
    const minLag = Math.floor(sr / 450), maxLag = Math.floor(sr / 90);
    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i + lag < seg.length; i++) sum += seg[i] * seg[i + lag];
      if (sum > bestVal) { bestVal = sum; bestLag = lag; }
    }
    return sr / bestLag;
  };
  for (const [pitch, erwartetHz] of [[57, 220], [60, 261.63], [64, 329.63]]) {
    const buf = G.renderSilbe(fakeCtx, pitch, 0, 1920);
    const d = buf.getChannelData(0);
    const gemessen = f0(d, Math.floor(0.25 * sr));
    assert.ok(Math.abs(gemessen - erwartetHz) / erwartetHz < 0.015, `MIDI ${pitch}: ${gemessen.toFixed(1)} statt ${erwartetHz} Hz`);
    let maxAbs = 0;
    for (let i = 0; i < d.length; i++) maxAbs = Math.max(maxAbs, Math.abs(d[i]));
    assert.ok(maxAbs > 0.25 && maxAbs <= 0.9, `sauberer Pegel ohne Clipping (${maxAbs.toFixed(2)})`);
  }
  // Kurze und lange Note auf demselben Ton behalten ihre exakte MIDI-Dauer
  const kurz = G.renderSilbe(fakeCtx, 60, 0, 557);
  const lang = G.renderSilbe(fakeCtx, 60, 0, 3264);
  assert.ok(Math.abs(kurz.duration - 557 / 1920) < 0.01, "kurze Note 0.29s");
  assert.ok(Math.abs(lang.duration - 3264 / 1920) < 0.01, "lange Note 1.70s");
});

console.log(`\n${n} Hausgrafik-Tests bestanden.`);
