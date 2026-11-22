// Tests für die 90er-Jahre-Lavalampe im Gaming-Zimmer: Form, Thermik, Aufwärmen, Abkühlen & Erkaltungsformen.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const b = await build({
  stdin: {
    contents:
      readFileSync("src/game/lavalampe.ts", "utf8") +
      '\nimport { STATIONS } from "./house";\nexport { STATIONS };\n',
    resolveDir: path.resolve("src/game"),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const L = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);

function recCanvas() {
  const fills = [];
  const grads = [];
  const ziel = { fillStyle: "", strokeStyle: "", lineWidth: 1, lineCap: "butt", globalAlpha: 1 };
  const c = new Proxy(ziel, {
    get(o, k) {
      if (k === "fills") return fills;
      if (k === "grads") return grads;
      if (k in o) return o[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") {
        return () => {
          const stops = [];
          grads.push(stops);
          return { addColorStop(pos, col) { stops.push([pos, col]); } };
        };
      }
      if (k === "fill") return () => { fills.push(ziel.fillStyle); };
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; },
  });
  return c;
}

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

test("Station Lavalampe auf dem Spieleregal: fernsehtauglich (>= 24×24), kein Konflikt mit Modulen", () => {
  const st = L.STATIONS.find((s) => s.id === "lavalampe");
  assert.ok(st, "Station lavalampe vorhanden");
  assert.equal(st.floor, 3);
  const [x, y, w, h] = st.hits[0];
  assert.ok(w >= 24 && h >= 24, `Trefferfläche ${w}×${h} >= 24×24`);
  assert.ok(x >= 96 && x + w <= 864 && y >= 30 && y + h <= 570, "innerhalb des sicheren 4:3-Bereichs");
  const gol = L.STATIONS.find((s) => s.id === "gol_game").hits[0];
  assert.ok(y + h <= gol[1], "überlappt nicht mit dem Spiel-des-Lebens-Fach darunter");
});

test("Aufwärmdauer & Verhalten mit zunehmender Wärme: erst Bodenwachs, dann träger Haupttropfen, dann volle Konvektion", () => {
  const s = L.erstelleLavaLampe(true, 0, 42);
  assert.equal(s.waerme, 0);

  // Nach 10 s: noch in der frühen Anwärmphase, alle Tropfen ruhen noch unten
  L.updateLavaLampe(s, 10);
  assert.ok(s.waerme > 0.15 && s.waerme < 0.3, `Wärme nach 10s: ${s.waerme}`);
  assert.ok(s.tropfen.every((tr) => tr.y < 0.1), "in früher Anwärmphase löst sich noch kein Tropfen");

  // Nach insgesamt 26 s (mittlere Wärme ~0.54): der Haupttropfen erwärmt sich und steigt zuerst auf, kleine bleiben noch unten
  L.updateLavaLampe(s, 16);
  assert.ok(s.waerme > 0.5 && s.waerme < 0.6);
  assert.ok(s.tropfen[0].temp > s.tropfen[4].temp, "Haupttropfen wird vor den kleinen Satelliten warm");

  // Nach vollem Aufheizen (> LAVA_WARM_DAUER) und Konvektionslauf: volle Wärme 1, mehrere Tropfen in Bewegung
  L.updateLavaLampe(s, 45);
  assert.equal(s.waerme, 1, "volle Betriebswärme erreicht");
  const abgehoben = s.tropfen.filter((tr) => tr.y > 0.12).length;
  assert.ok(abgehoben >= 2, `bei voller Wärme sind mehrere Tropfen unterwegs (${abgehoben})`);
});

test("Ausschalten, Abkühldauer & zufällige typische Erkaltungsformen", () => {
  const s = L.erstelleLavaLampe(true, 1, 100);
  L.updateLavaLampe(s, 20);
  const gesehen = new Set();

  for (let runde = 0; runde < 8; runde++) {
    s.an = true;
    s.waerme = 1;
    L.schalteLavaLampe(s, (runde * 0.19 + 0.07) % 1);
    assert.equal(s.an, false, "ausgeschaltet");
    gesehen.add(s.form);
  }
  assert.ok(gesehen.size >= 3, `verschiedene typische Erkaltungsformen über Zyklen (${[...gesehen].join(", ")})`);

  // Abkühlverlauf prüfen: braucht LAVA_KALT_DAUER, Tropfen sinken zum Boden zurück
  L.updateLavaLampe(s, 25);
  assert.ok(s.waerme > 0.45 && s.waerme < 0.65, "kühlt allmählich ab, nicht schlagartig");
  L.updateLavaLampe(s, 45);
  assert.equal(s.waerme, 0, "nach KALT_DAUER vollständig erkaltet");
  assert.ok(s.tropfen.every((tr) => tr.y < 0.15), "alle Tropfen sind beim Erkalten abgesunken");
});

test("Zeichnung: 90er-Doppelkegelform und blaues Wachs in allen fünf Erkaltungsformen & im Betrieb", () => {
  for (const form of L.ERKALTUNGS_FORMEN) {
    const kalt = L.erstelleLavaLampe(false, 0, 300);
    kalt.form = form;
    kalt.kopfStueckY = form === "schwebend" ? 0.9 : 0;
    const c1 = recCanvas();
    L.drawLavaLampe(c1, 505, 126, kalt);
    assert.ok(c1.fills.length >= 4, `Form ${form} zeichnet Sockel, Flüssigkeit und erstarrtes Wachs`);
  }

  const warm = L.erstelleLavaLampe(true, 0.95, 777);
  L.updateLavaLampe(warm, 15);
  const c2 = recCanvas();
  L.drawLavaLampe(c2, 505, 126, warm);
  const alleFarben = c2.grads.flat().map(([, col]) => col).join(" ");
  assert.ok(alleFarben.includes("#3584f7") && alleFarben.includes("#1f5ad6"), "blaues Wachs im beleuchteten Zustand");
});

console.log(`\n${n} Lavalampe-Tests bestanden.`);
