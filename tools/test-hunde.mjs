// Prüfungen für Odin (schmaler Fang, schwarz-braun gestromt) und Apollo (breiter Kopf, schwarz-weiß).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/game/hunde.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const H = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let bestanden = 0;
function test(name, fn) {
  fn();
  bestanden++;
  console.log("  ok " + name);
}

/** Zeichnungs-Aufzeichner mit echter 2D-Matrix und Farbliste. */
function aufzeichner() {
  const farben = new Set();
  const striche = new Set();
  let aufrufe = 0;
  let m = [1, 0, 0, 1, 0, 0];
  const stapel = [];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const pkt = (x, y) => {
    const wx = m[0] * x + m[2] * y + m[4];
    const wy = m[1] * x + m[3] * y + m[5];
    x0 = Math.min(x0, wx); y0 = Math.min(y0, wy);
    x1 = Math.max(x1, wx); y1 = Math.max(y1, wy);
  };
  const ziel = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "round",
    lineJoin: "round",
    globalAlpha: 1,
    save() { stapel.push([...m]); },
    restore() { m = stapel.pop() || m; },
    translate(x, y) { m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; },
    scale(sx, sy) { m[0] *= sx; m[1] *= sx; m[2] *= sy; m[3] *= sy; },
    rotate(a) {
      const [t0, t1, t2, t3] = m, c = Math.cos(a), s = Math.sin(a);
      m[0] = t0 * c + t2 * s; m[1] = t1 * c + t3 * s;
      m[2] = t2 * c - t0 * s; m[3] = t3 * c - t1 * s;
    },
    beginPath() {},
    closePath() {},
    clip() {},
    setLineDash() {},
    moveTo(x, y) { pkt(x, y); },
    lineTo(x, y) { pkt(x, y); },
    quadraticCurveTo(cx, cy, x, y) { pkt(cx, cy); pkt(x, y); },
    arc(x, y, r) { pkt(x - r, y - r); pkt(x + r, y + r); },
    ellipse(x, y, rx, ry) { pkt(x - rx, y - ry); pkt(x + rx, y + ry); },
    fillRect(x, y, w, h) { pkt(x, y); pkt(x + w, y + h); farben.add(ziel.fillStyle); aufrufe++; },
    fill() { farben.add(ziel.fillStyle); aufrufe++; },
    stroke() { striche.add(ziel.strokeStyle); aufrufe++; },
  };
  return {
    c: ziel,
    farben,
    striche,
    get aufrufe() { return aufrufe; },
    box: () => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }),
  };
}

const POSEN = ["stand", "walk", "trot", "sniff", "sit", "lie", "sleep", "stretch", "wag", "petted", "bark"];

test("Odin und Apollo: beide komplett schwarz, Apollo mit weißer Collie-Zeichnung", () => {
  assert.equal(H.HUNDE_INFO.odin.fang, "schmal");
  assert.equal(H.HUNDE_INFO.odin.grundfarbe, "schwarz");
  assert.equal(H.HUNDE_INFO.odin.fell, "schwarz");
  assert.equal(H.HUNDE_INFO.apollo.fang, "breit");
  assert.equal(H.HUNDE_INFO.apollo.grundfarbe, "schwarz");
  assert.equal(H.HUNDE_INFO.apollo.fell, "schwarz-weiss");
  for (const f of [H.ODIN_FARBEN.fell, H.APOLLO_FARBEN.fell]) {
    const rgb = [1, 3, 5].map((i) => parseInt(f.slice(i, i + 2), 16));
    assert.ok(rgb.every((v) => v < 65), `${f} bleibt schwarz, nicht braun`);
  }

  const o = aufzeichner();
  H.drawOdin(o.c, 200, 448, { pose: "stand", face: 1, t: 1.0 });
  assert.ok(o.farben.has(H.ODIN_FARBEN.fell), "Odin hat schwarze Grundfärbung");
  assert.ok(!o.farben.has(H.APOLLO_FARBEN.weiss), "Odin hat keine weißen Border-Collie-Flecken");
  assert.ok(!o.farben.has("#9d724a"), "Odin trägt noch keine braune Stromung");

  const a = aufzeichner();
  H.drawApollo(a.c, 300, 448, { pose: "stand", face: 1, t: 1.0 });
  assert.ok(a.farben.has(H.APOLLO_FARBEN.fell), "Apollo hat schwarze Grundfärbung");
  assert.ok(a.farben.has(H.APOLLO_FARBEN.weiss), "weiße Blesse und Lefzen");
  assert.ok(a.farben.has(H.APOLLO_FARBEN.brust), "weißer Brustkragen");
  assert.ok(!a.farben.has("#9d724a"), "Apollo hat keine braune Stromung");
});

test("Alle 11 Posen zeichnen beide Hunde sauber und maßstabsgerecht", () => {
  for (const id of ["odin", "apollo"]) {
    for (const pose of POSEN) {
      const rec = aufzeichner();
      H.drawHund(rec.c, id, 400, 448, { pose, face: 1, t: 1.2, gang: 0.8 });
      const b = rec.box();
      assert.ok(rec.aufrufe > 12, `${id}/${pose} malt sichtbar`);
      assert.ok(b.w > 24 && b.w < 60, `${id}/${pose} Breite plausibel (${b.w.toFixed(1)})`);
      assert.ok(b.h > 14 && b.h < 45, `${id}/${pose} Höhe plausibel (${b.h.toFixed(1)})`);
    }
  }
});

test("Startplätze im 4:3-Sicherheitsbereich und fernsehtaugliche Klickziele (≥ 24×24)", () => {
  const w = new H.HundeWelt(() => 0.5);
  for (const id of ["odin", "apollo"]) {
    const h = w.get(id);
    assert.ok(h.x >= 96 && h.x <= 864, `${id} im 4:3-Bereich`);
    const [, , bw, bh] = w.hitBox(id);
    assert.ok(bw >= 24 && bh >= 24, `${id} Klickziel ≥ 24×24`);
  }
});

test("Gartenauslauf bei offener Gartentür und wetterabhängige Rückkehr + Zuruf", () => {
  const basisEnv = {
    hour: 14, luniFloor: 0, luniX: 700, luniSchlaeft: false,
    gardenDoor: 1, gardenWant: 1, cellarDoor: 1, smoke: 0, schlechtesWetter: true,
  };
  const w = new H.HundeWelt(() => 0.4);
  // Hunde laufen bei offener Keller- und Gartentür selbstständig in den Garten
  for (let i = 0; i < 400; i++) w.update(0.1, basisEnv);
  assert.equal(w.istImGarten("odin"), true, "Odin läuft in den Garten");
  assert.equal(w.istImGarten("apollo"), true, "Apollo läuft in den Garten");

  // Bei schlechtem Wetter kehren sie innerhalb von 2 Minuten von selbst zurück
  for (let i = 0; i < 1200; i++) w.update(0.1, basisEnv);
  assert.equal(w.istImGarten("odin"), false, "Odin kommt bei Regen/Schnee zurück");
  assert.equal(w.istImGarten("apollo"), false, "Apollo kommt bei Regen/Schnee zurück");

  // Bei gutem Wetter bleiben sie länger draußen, kommen aber auf Zuruf sofort heim
  const w2 = new H.HundeWelt(() => 0.5);
  const schoen = { ...basisEnv, schlechtesWetter: false };
  for (let i = 0; i < 400; i++) w2.update(0.1, schoen);
  assert.equal(w2.istImGarten("apollo"), true);
  w2.rufeZurueck("apollo");
  for (let i = 0; i < 80; i++) w2.update(0.1, schoen);
  assert.equal(w2.istImGarten("apollo"), false, "Apollo kommt auf Zuruf herein");
});

test("Streicheln, Nachtruhe und SD-taugliche Speicherung", () => {
  const w = new H.HundeWelt(() => 0.3);
  let gebellt = null;
  w.erwarteStreicheln("apollo", 420);
  assert.equal(w.get("apollo").pose, "wag");
  assert.equal(w.get("apollo").face, -1);
  w.starteStreicheln("apollo", 420, (tief) => { gebellt = tief; });
  assert.equal(w.get("apollo").pose, "petted");
  assert.equal(gebellt, true, "Apollo bellt tiefer");
  w.beendeStreicheln("apollo");
  assert.equal(w.get("apollo").pose, "sit");

  // Snapshot speichern & wiederherstellen
  const snap = w.snapshot();
  const wNeu = new H.HundeWelt(() => 0.3);
  wNeu.wiederherstellen(snap);
  assert.equal(wNeu.get("odin").x, snap.odin.x);
  assert.equal(wNeu.get("apollo").floor, snap.apollo.floor);

  // Plattformregel: keine Browser-Spezialitäten in hunde.ts
  const quelltext = readFileSync("src/game/hunde.ts", "utf8");
  for (const verboten of ["window", "document", "localStorage", "fetch(", "roundRect"]) {
    assert.equal(quelltext.includes(verboten), false, `verboten in hunde.ts: ${verboten}`);
  }
});

console.log(`\n${bestanden} Hunde-Tests bestanden.`);
