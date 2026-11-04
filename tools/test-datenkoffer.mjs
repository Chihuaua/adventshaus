// Prüfungen für das Osterei „Datenkoffer“ (ohne Browser).
import assert from "node:assert/strict";
import { build } from "esbuild";

// Minimale Browser-Attrappen, damit house.ts im Node geladen werden kann.
const speicher = new Map();
globalThis.localStorage = {
  get length() { return speicher.size; },
  key: (i) => [...speicher.keys()][i] ?? null,
  getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: (k) => speicher.delete(k),
};
globalThis.document = { createElement: () => ({ getContext: () => null, style: {} }), fonts: {} };
globalThis.window = globalThis;
globalThis.navigator = { userAgent: "node" };

async function lade(datei) {
  const b = await build({ entryPoints: [datei], bundle: true, write: false, format: "esm", platform: "node" });
  return import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
}
const H = await lade("src/game/house.ts");
const T = await lade("src/game/stand-transfer.ts");

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

const KF = H.STATIONS.find((s) => s.id === "datenkoffer");

test("Datenkoffer ist eine Station im Keller (Krempelraum)", () => {
  assert.ok(KF, "Station „datenkoffer“ fehlt in STATIONS");
  assert.equal(KF.floor, 0);
  assert.equal(KF.state, "act");
});

test("Trefferfläche ist groß genug (mindestens 24×24)", () => {
  assert.ok(KF.hits.length >= 1);
  for (const [, , w, h] of KF.hits) {
    assert.ok(w >= 24 && h >= 24, `Trefferfläche ${w}×${h} ist zu klein`);
  }
});

test("Bei Überlappung gewinnt die kleinere Fläche – der Kopf bleibt klickbar", () => {
  // pick() wählt die kleinere Trefferfläche. Der Koffer liegt im Bereich der
  // großzügigen Kellertreppen-Fläche; deshalb muss seine Fläche strikt
  // kleiner sein, damit Klicks auf ihn auch ihn treffen.
  const Andere = H.STATIONS.filter((s) => s.id !== "datenkoffer");
  for (const [ax, ay, aw, ah] of KF.hits) {
    const mein = aw * ah;
    for (const st of Andere) {
      for (const [bx, by, bw, bh] of st.hits) {
        const überlappt = ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
        if (!überlappt) continue;
        assert.ok(mein < bw * bh,
          `Überlappung mit „${st.id}“: ${mein} ist nicht kleiner als ${bw * bh} – Klicks würden verloren gehen`);
      }
    }
  }
});

test("Die Kellertreppe bleibt trotzdem erreichbar", () => {
  // pick() wie im Spiel: kleinste Trefferfläche unter dem Punkt gewinnt.
  const pick = (x, y) => {
    let best = null, area = Infinity;
    for (const st of H.STATIONS) {
      if (st.id === "gol_game") continue;
      for (const [rx, ry, rw, rh] of st.hits) {
        if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh && rw * rh < area) {
          best = st; area = rw * rh;
        }
      }
    }
    return best?.id ?? null;
  };
  // Mitten auf dem Koffer → Koffer
  assert.equal(pick(460, 534), "datenkoffer");
  // Oberhalb/rechts daneben → weiterhin die Kellertreppe
  assert.equal(pick(495, 500), "kellertreppe");
  assert.equal(pick(460, 480), "kellertreppe");
});

test("Koffer steht auf den Kartons (Bodenberührung, nicht im Laufweg)", () => {
  // Kartons im Krempelraum: Oberkante 548 (cardboard(c, 446, FK, 30, 24)).
  const [, , , h] = KF.hits[0];
  assert.ok(h <= 40, "Koffer ragt zu weit nach oben");
});

test("Stand-Export/Import läuft rund (alle lcp1.-Schlüssel)", () => {
  speicher.clear();
  speicher.set("lcp1.muted.v1", "1");
  speicher.set("lcp1.welt.normal.v1", '{"a":1}');
  speicher.set("lcp1.wetter.v1", '{"lage":"schnee"}');
  speicher.set("fremd.darf.nicht.mit", "x");
  const text = T.standExport();
  assert.ok(text.includes("lcp1.muted.v1"));
  assert.ok(!text.includes("fremd.darf.nicht.mit"), "fremde Schlüssel dürfen nicht mitwandern");

  speicher.clear();
  const r = T.standImport(text);
  assert.equal(r.ok, true);
  assert.equal(r.anzahl, 3);
  assert.equal(speicher.get("lcp1.muted.v1"), "1");
  assert.equal(speicher.get("lcp1.wetter.v1"), '{"lage":"schnee"}');
  assert.equal(speicher.has("fremd.darf.nicht.mit"), false);
});

test("Unlesbarer Text wird abgelehnt, der alte Stand bleibt", () => {
  speicher.clear();
  speicher.set("lcp1.muted.v1", "0");
  const r = T.standImport("kein json {");
  assert.equal(r.ok, false);
  assert.ok(r.fehler);
  assert.equal(speicher.get("lcp1.muted.v1"), "0");
});

console.log(`\n${n} Datenkoffer-Tests bestanden.`);
