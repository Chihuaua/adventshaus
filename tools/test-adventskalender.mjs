// Adventskalender-Logik: Freigabe, Jahresmischung, Türchenstand und geheime Reihenfolge.
import assert from "node:assert/strict";
import { build } from "esbuild";

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

console.log(`\n${bestanden} Adventskalender-Tests bestanden.`);
