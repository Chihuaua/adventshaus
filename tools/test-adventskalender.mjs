// Adventskalender-Logik: Freigabe, Jahresmischung, Türchenstand und geheime Reihenfolge.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import path from "node:path";

// localStorage-Nachbildung, damit die Speicherung geprüft werden kann.
const speicher = new Map();
globalThis.localStorage = {
  getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: (k) => speicher.delete(k),
};

const bundle = await build({
  entryPoints: ["src/game/advent.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const A = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

const dekoBundle = await build({
  entryPoints: ["src/game/deko.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const D = await import(
  `data:text/javascript;base64,${Buffer.from(dekoBundle.outputFiles[0].text).toString("base64")}`
);

// Minimaler Canvas-Stumpf: zählt Aufrufe, malt nichts.
function stumpfCanvas() {
  const gradient = { addColorStop() {} };
  const ziel = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    globalAlpha: 1,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  };
  let aufrufe = 0;
  const c = new Proxy(ziel, {
    get(o, k) {
      if (k === "__aufrufe") return aufrufe;
      if (k in o) return o[k];
      return (...a) => {
        aufrufe++;
        void a;
      };
    },
    set(o, k, v) {
      o[k] = v;
      return true;
    },
  });
  return c;
}

let bestanden = 0;
function test(name, fn) {
  fn();
  bestanden++;
  console.log("  ok " + name);
}

test("Prototyp: jedes Türchen ist frei", () => {
  for (let tag = 1; tag <= 24; tag++) {
    assert.equal(A.adventFrei(tag, 7, 15, false), true);
  }
});

test("Finalmodus: vor dem Dezember bleibt alles zu", () => {
  assert.equal(A.adventFrei(1, 11, 30, true), false);
  assert.equal(A.adventFrei(24, 11, 30, true), false);
});

test("Finalmodus: Türchen sind nachholbar, aber nicht vorziehbar", () => {
  // Am 10.12. sind die Türchen 1–10 dran, 11 noch nicht.
  for (let tag = 1; tag <= 10; tag++) assert.equal(A.adventFrei(tag, 12, 10, true), true);
  assert.equal(A.adventFrei(11, 12, 10, true), false);
  assert.equal(A.adventFrei(24, 12, 10, true), false);
  // Am 24.12. ist alles offen.
  assert.equal(A.adventFrei(24, 12, 24, true), true);
});

test("Jahresmischung: 24 eindeutige Türchen, je Jahr neu", () => {
  const m = A.adventMischung(2026);
  assert.equal(m.length, 24);
  assert.deepEqual([...m].sort((a, b) => a - b), Array.from({ length: 24 }, (_, i) => i + 1));
  assert.deepEqual(A.adventMischung(2026), m, "gleiches Jahr, gleiche Mischung");
  assert.notDeepEqual(A.adventMischung(2027), m, "neues Jahr, neue Mischung");
});

test("Türchen-Layout: 24 Klappen innerhalb der Bühne", () => {
  const tueren = A.adventTueren(A.adventMischung(2026));
  assert.equal(tueren.length, 24);
  for (const { r } of tueren) {
    assert.ok(r.x >= 90 && r.x + r.w <= 870, "x im Rahmen");
    assert.ok(r.y >= 70 && r.y + r.h <= 560, "y im Rahmen");
    assert.ok(r.w >= 24 && r.h >= 24, "Klickziel groß genug");
  }
});

test("Speichern: geöffnete Türchen überstehen einen Neustart", () => {
  speicher.clear();
  let stand = A.ladeAdvent(2026);
  assert.equal(A.adventOeffnen(stand, 3, true), true);
  assert.equal(A.adventOeffnen(stand, 3, true), false, "doppelt öffnet nicht");
  assert.equal(A.adventOeffnen(stand, 7, false), false, "zugefroren öffnet nicht");
  stand = A.ladeAdvent(2026);
  assert.deepEqual(stand.offen, [3]);
  assert.deepEqual(stand.reihenfolge, [3]);
});

test("Jahreswechsel: alter Stand zählt nicht mehr", () => {
  const stand = A.ladeAdvent(2027);
  assert.deepEqual(stand.offen, []);
  assert.equal(stand.jahr, 2027);
});

test("Türanimation: erst ab 90° links sichtbar, offene Tür schlank ohne Nachbarn zu verdecken", () => {
  const tueren = A.adventTueren(A.adventMischung(2026));
  const w = tueren[0].r.w;
  // In den ersten zwei Dritteln schwingt nur die Vorderseite nach vorn (links 0 Überstand).
  for (const auf of [0, 0.15, 0.35, 0.55, 0.65]) {
    assert.equal(A.adventTuerUeberstand(w, auf), 0, `bei auf=${auf} darf links noch kein Block erscheinen`);
  }
  // Offen (~96°): schlanker Überstand mit reichlich Luft zum linken Nachbarn in allen Jahren.
  const offenUeber = A.adventTuerUeberstand(w, 1);
  const maxFeder = A.adventTuerUeberstand(w, 0.84);
  assert.ok(offenUeber > 8 && offenUeber < 14, `offene Tür schlank und erkennbar (${offenUeber.toFixed(1)})`);
  for (let jahr = 2024; jahr <= 2040; jahr++) {
    const t = A.adventTueren(A.adventMischung(jahr));
    for (let i = 0; i < t.length; i++) {
      if (i % 6 === 0) continue;
      const luecke = t[i].r.x - (t[i - 1].r.x + t[i - 1].r.w);
      assert.ok(luecke > offenUeber + 6, `Jahr ${jahr}: Lücke ${luecke.toFixed(1)} > offene Tür ${offenUeber.toFixed(1)} + 6`);
      assert.ok(luecke > maxFeder + 2, `Jahr ${jahr}: auch beim Ausfedern frei`);
    }
  }
});

test("Geheime Belohnung: nur die Reihenfolge 1–24 zählt", () => {
  const gut = { jahr: 2026, offen: [], reihenfolge: [] };
  for (let tag = 1; tag <= 24; tag++) {
    gut.offen.push(tag);
    gut.reihenfolge.push(tag);
  }
  assert.equal(A.adventSternVerdient(gut), true);
  const falsch = { ...gut, reihenfolge: [2, 1, ...gut.reihenfolge.slice(2)] };
  assert.equal(A.adventSternVerdient(falsch), false);
  const unvollstaendig = { jahr: 2026, offen: [1, 2], reihenfolge: [1, 2] };
  assert.equal(A.adventSternVerdient(unvollstaendig), false);
});

test("Deko: 24 Stücke, Tür 1–24 genau einmal, keine Namensdopplung", () => {
  assert.equal(D.DEKO_STUECKE.length, 24);
  const tueren = D.DEKO_STUECKE.map((s) => s.tuer).sort((a, b) => a - b);
  assert.deepEqual(tueren, Array.from({ length: 24 }, (_, i) => i + 1));
  const namen = D.DEKO_STUECKE.map((s) => s.name);
  assert.equal(new Set(namen).size, 24, "jedes Stück ein Unikat");
});

test("Deko: alle Stücke liegen auf der 960×600-Bühne", () => {
  for (const s of D.DEKO_STUECKE) {
    const b = s.box;
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 960 && b.y + b.h <= 600, `${s.name} außerhalb`);
  }
});

test("Deko: Sichtbarkeit folgt den Türchen, Vorschau zeigt alles", () => {
  assert.equal(D.DEKO_VORSCHAU_ALLE, true, "Vollausbau wie bei allen offenen Türchen");
  assert.deepEqual(D.dekoSichtbar([]), new Array(24).fill(true));
});

test("Deko: Zeichnen läuft ohne Fehler, malt auch wirklich", () => {
  const c = stumpfCanvas();
  const alle = new Array(24).fill(true);
  const keine = new Array(24).fill(false);
  D.drawDeko(c, alle, 1.5);
  const mitDeko = c.__aufrufe;
  assert.ok(mitDeko > 200, `erwartet viele Zeichenaufrufe, waren ${mitDeko}`);
  D.drawDekoLicht(c, alle, 1.5);
  assert.ok(c.__aufrufe > mitDeko, "Lichtschein malt zusätzlich");
  const c2 = stumpfCanvas();
  D.drawDeko(c2, keine, 1.5);
  D.drawDekoLicht(c2, keine, 1.5);
  assert.equal(c2.__aufrufe, 0, "ohne Sichtbarkeit kein einziger Aufruf");
});

test("Deko: jedes Stück malt nur innerhalb seiner Box", () => {
  // Stumpf mit echter 2D-Transformation (für den gedrehten Stern).
  function vermesser() {
    const grad = { addColorStop() {} };
    let m = [1, 0, 0, 1, 0, 0];
    const stapel = [];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const pk = (x, y) => {
      if (!isFinite(x) || !isFinite(y)) return;
      const wx = m[0] * x + m[2] * y + m[4], wy = m[1] * x + m[3] * y + m[5];
      x0 = Math.min(x0, wx); y0 = Math.min(y0, wy);
      x1 = Math.max(x1, wx); y1 = Math.max(y1, wy);
    };
    const kr = (x, y, r) => { pk(x - r, y - r); pk(x + r, y + r); };
    const o = {
      fillStyle: "", strokeStyle: "", lineWidth: 1, lineCap: "butt", globalAlpha: 1,
      createLinearGradient: () => grad, createRadialGradient: () => grad,
      save() { stapel.push([...m]); },
      restore() { m = stapel.pop() || m; },
      translate(x, y) { m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; },
      rotate(a) {
        const [t0, t1, t2, t3] = m, c = Math.cos(a), s = Math.sin(a);
        m[0] = t0 * c + t2 * s; m[1] = t1 * c + t3 * s;
        m[2] = t2 * c - t0 * s; m[3] = t3 * c - t1 * s;
      },
      fillRect: (x, y, w, h) => { pk(x, y); pk(x + w, y + h); },
      rect: (x, y, w, h) => { pk(x, y); pk(x + w, y + h); },
      strokeRect: (x, y, w, h) => { pk(x, y); pk(x + w, y + h); },
      arc: (x, y, r) => kr(x, y, r),
      ellipse: (x, y, rx, ry) => { pk(x - rx, y - ry); pk(x + rx, y + ry); },
      moveTo: (x, y) => pk(x, y),
      lineTo: (x, y) => pk(x, y),
      quadraticCurveTo: (x1, y1, x2, y2) => { pk(x1, y1); pk(x2, y2); },
      bezierCurveTo: (x1, y1, x2, y2, x3, y3) => { pk(x1, y1); pk(x2, y2); pk(x3, y3); },
    };
    const c = new Proxy(o, {
      get(t, k) { if (k in t) return t[k]; return () => {}; },
      set(t, k, v) { t[k] = v; return true; },
    });
    return { c, box: () => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }) };
  }
  for (const zeit of [0.7, 1.5]) {
    for (let i = 0; i < 24; i++) {
      const maske = new Array(24).fill(false);
      maske[i] = true;
      const deko = D.DEKO_STUECKE[i];
      const b = deko.box;
      const v1 = vermesser();
      D.drawDeko(v1.c, maske, zeit);
      const k = v1.box();
      assert.ok(
        k.x >= b.x - 2 && k.y >= b.y - 2 && k.x + k.w <= b.x + b.w + 2 && k.y + k.h <= b.y + b.h + 2,
        `${deko.name}: Körper ${JSON.stringify(k)} passt nicht in ${JSON.stringify(b)}`,
      );
      const v2 = vermesser();
      D.drawDekoLicht(v2.c, maske, zeit);
      const g = v2.box();
      const hatLicht = [4, 5, 7, 8, 12, 15, 16, 18, 20, 22, 23, 24].includes(deko.tuer);
      if (!hatLicht) {
        assert.ok(g.w < 0, `${deko.name} sollte keinen Lichtschein haben`);
      } else {
        assert.ok(
          g.x >= b.x - 18 && g.y >= b.y - 18 && g.x + g.w <= b.x + b.w + 18 && g.y + g.h <= b.y + b.h + 18,
          `${deko.name}: Lichtschein läuft zu weit aus`,
        );
      }
    }
  }
});

// --- Schließen des großen Kalenders (house.ts) ---------------------------
const hausBundle = await build({
  stdin: {
    contents: readFileSync("src/game/house.ts", "utf8"),
    resolveDir: path.resolve("src/game"),
    loader: "ts",
  },
  bundle: true, write: false, platform: "node", format: "esm",
});
const Hs = await import(`data:text/javascript;base64,${Buffer.from(hausBundle.outputFiles[0].text).toString("base64")}`);

test("Schließen bleibt zu: nach der Schließ-Animation öffnet der Kalender nicht im selben Bild wieder", () => {
  const h = Object.assign(Object.create(Hs.House.prototype), {
    adventFullscreen: true, adventSchliessen: true, adventZoomT: 0.01, adventWarteT: 2.5, adventT: 1,
    adventAnims: new Map(), adventSternT: 0,
    activity: { id: "adventskalender" },
    finishActivity() { this.activity = null; },
  });
  h.adventAktualisieren(0.05);
  assert.equal(h.adventZoomT, 0);
  assert.equal(h.adventFullscreen, false, "Kalender ist zu");
  assert.equal(h.adventSchliessen, false);
  assert.equal(h.adventWarteT, 0, "die alte Wartezeit darf nicht erneut öffnen");
  assert.equal(h.activity, null, "Luni ist vom Kalender weg");
  // Dieselbe Bildlogik wie im Haus: die Aktivität vom Bildanfang steht noch in der Hand.
  const act = { id: "adventskalender" };
  let wiederOffen = false;
  h.adventAuf = () => { wiederOffen = true; };
  const wartend = h.adventWarteT + 0.016;
  if (act.id === "adventskalender" && wartend >= 0.45 && !h.adventFullscreen && !h.adventSchliessen) h.adventAuf();
  assert.equal(wiederOffen, false);
});

test("Weihnachtshaus: Weltall-Himmel, Rahmenzier und 24 Lampen malen ohne Fehler", () => {
  const c = stumpfCanvas();
  A.adventRahmen(c, 3, "weltraum", 7);
  assert.ok(c.__aufrufe > 400, "der Weltall-Stil malt wirklich");
  const lampen = A.adventLampen(A.RAHMEN);
  assert.equal(lampen.length, 24, "eine Lampe je Türchen");
  assert.equal(new Set(lampen.map((p) => p.map(Math.round).join("|"))).size, 24, "kein Lampenplatz doppelt");
  for (const [x, y] of lampen) {
    assert.ok(x >= A.RAHMEN.x && x <= A.RAHMEN.x + A.RAHMEN.w && y >= A.RAHMEN.y && y <= A.RAHMEN.y + A.RAHMEN.h, "am Innenrand der Tafel");
  }
  // Ringförmig im Uhrzeigersinn: oben von links, rechts nach unten, unten nach links, links nach oben.
  assert.ok(lampen[0][0] < lampen[7][0] && lampen[0][1] === lampen[7][1], "obere Reihe von links nach rechts");
  assert.ok(lampen[8][0] === lampen[11][0] && lampen[8][1] < lampen[11][1], "rechte Seite von oben nach unten");
  assert.ok(lampen[12][0] > lampen[19][0], "untere Reihe von rechts nach links");
  assert.ok(lampen[20][0] === lampen[23][0] && lampen[20][1] > lampen[23][1], "linke Seite von unten nach oben");
});

test("Adventssonntage zählt das echte Kalender in Berlin", () => {
  const tag = (m, d) => Date.UTC(2026, m - 1, d, 12);
  assert.equal(A.adventsSonntage(tag(11, 28)), 0);
  assert.equal(A.adventsSonntage(tag(11, 29)), 1);
  assert.equal(A.adventsSonntage(tag(12, 5)), 1);
  assert.equal(A.adventsSonntage(tag(12, 6)), 2);
  assert.equal(A.adventsSonntage(tag(12, 13)), 3);
  assert.equal(A.adventsSonntage(tag(12, 19)), 3);
  assert.equal(A.adventsSonntage(tag(12, 20)), 4);
  assert.equal(A.adventsSonntage(tag(12, 24)), 4);
  assert.equal(A.adventsSonntage(tag(6, 1)), 0, "im Sommer ist kein Advent");
  // 2023: Heiligabend ist Sonntag und zugleich der 4. Advent.
  assert.equal(A.adventsSonntage(Date.UTC(2023, 11, 23, 12)), 3);
  assert.equal(A.adventsSonntage(Date.UTC(2023, 11, 24, 12)), 4);
  // 28.11.2026 23:30 UTC ist in Berlin schon der 29.11.
  assert.equal(A.adventsSonntage(Date.UTC(2026, 10, 28, 23, 30)), 1);
});

test("Schmuck: 24 Stücke, mit jedem Türchen genau eines mehr, alles im sicheren Bildbereich", () => {
  assert.equal(A.ADVENT_SCHMUCK.length, 24);
  assert.equal(new Set(A.ADVENT_SCHMUCK).size, 24, "kein Stück doppelt");
  const orte = A.ADVENT_SCHMUCK.map((_, i) => A.adventSchmuckOrt(A.RAHMEN, i));
  assert.ok(orte.every(([x, y]) => x >= 96 && x <= 864 && y >= 30 && y <= 570), "innerhalb des 4:3-Bereichs");
  assert.equal(new Set(orte.slice(6, 18).map((p) => p.map(Math.round).join("|"))).size, 12, "zwölf verschiedene Schmuckplätze");
  // Hohe Stücke (Laterne, Nussknacker, Zuckerstange) stehen an den Seiten, nicht unter dem Titelschild.
  for (const i of [10, 13, 17]) {
    const [x] = A.adventSchmuckOrt(A.RAHMEN, i);
    assert.ok(Math.abs(x - A.RAHMEN.x) < 30 || Math.abs(x - A.RAHMEN.x - A.RAHMEN.w) < 30, `${A.ADVENT_SCHMUCK[i]} steht an einer Seite`);
  }
});

test("Schmuck malt ohne Fehler: jeder Stand von 0 bis 24, fest und lebendig, jedes Stück kommt wirklich dazu", () => {
  let vorher = -1;
  for (let n = 0; n <= 24; n++) {
    const fest = stumpfCanvas();
    const lebendig = stumpfCanvas();
    // Advent fest auf 0 halten, sonst ändern die Ecken-Kugeln die Zählung.
    A.adventSchmuck(fest, A.RAHMEN, n, 0, 3, true);
    A.adventSchmuck(lebendig, A.RAHMEN, n, 0, 3, false);
    const gesamt = fest.__aufrufe + lebendig.__aufrufe;
    assert.ok(gesamt > vorher, `Stück ${n} fehlt`);
    vorher = gesamt;
    A.adventSchmuckGlanz(stumpfCanvas(), A.RAHMEN, Math.max(0, n - 1), 0.5);
  }
});

test("Ecken-Kugeln: am 4. Advent leuchten alle vier, auch ohne ein einziges Türchen", () => {
  const ohne = stumpfCanvas();
  A.adventSchmuck(ohne, A.RAHMEN, 0, 0, 3, false);
  assert.equal(ohne.__aufrufe, 0, "vor dem 1. Advent und ohne Zweig ist keine Kugel da");
  const advent = stumpfCanvas();
  A.adventSchmuck(advent, A.RAHMEN, 0, 4, 3, false);
  assert.ok(advent.__aufrufe > 60, "vier leuchtende Kugeln werden gezeichnet");
  const zahlen = [0, 1, 2, 3, 4].map((a) => {
    const c = stumpfCanvas();
    A.adventSchmuck(c, A.RAHMEN, 0, a, 3, false);
    return c.__aufrufe;
  });
  const schritte = zahlen.slice(1).map((z, i) => z - zahlen[i]);
  assert.ok(schritte.every((d) => d === schritte[0] && d > 0), "je Adventssonntag kommt genau eine Kugel dazu");
});

test("Türchen-Bilder im Weltall-Stil: alle 24 malen ohne Fehler, der klassische Stil bleibt bei seinen Motiven", () => {
  const klappe = { x: 142, y: 118, w: 87, h: 77 };
  const ruhe = { fokus: false, hover: false, gesperrt: false };
  for (let tag = 1; tag <= 24; tag++) {
    const b = stumpfCanvas();
    A.adventBildSpiel(b, tag, 10, 10, 83, 73, 2);
    assert.ok(b.__aufrufe > 90, `Türchen ${tag} malt wirklich`);
    for (const stil of ["weltraum", "klassisch"]) {
      const c = stumpfCanvas();
      A.adventTuer(c, klappe, tag, { offen: true, anim: 1 }, ruhe, 2, stil);
      assert.ok(c.__aufrufe > 100, `Klappe ${tag} im Stil ${stil}`);
    }
  }
  const klassisch = stumpfCanvas();
  const weltraum = stumpfCanvas();
  A.adventTuer(klassisch, klappe, 5, { offen: true, anim: 1 }, ruhe, 2);
  A.adventTuer(weltraum, klappe, 5, { offen: true, anim: 1 }, ruhe, 2, "weltraum");
  assert.notEqual(klassisch.__aufrufe, weltraum.__aufrufe, "ohne Stilangabe bleibt der klassische Kalender");
  // Geschlossene Klappe: kein Bild, egal welcher Stil.
  const zu = stumpfCanvas();
  A.adventTuer(zu, klappe, 5, { offen: false, anim: 0 }, ruhe, 2, "weltraum");
  assert.ok(zu.__aufrufe < klassisch.__aufrufe);
});

console.log(`\n${bestanden} Adventskalender-Tests bestanden.`);
