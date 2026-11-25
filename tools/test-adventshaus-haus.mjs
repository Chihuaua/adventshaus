// Laufzeitprüfungen am Haus selbst: Was ist im Adventshaus wann nutzbar?
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const source = readFileSync("src/game/house.ts", "utf8");
const bundle = await build({
  stdin: { contents: source, resolveDir: path.resolve("src/game"), loader: "ts" },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const A = await (async () => {
  const b = await build({ entryPoints: ["src/game/adventshaus-ausbau.ts"], bundle: true, write: false, format: "esm", platform: "node" });
  return import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
})();

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

/** Haus ohne Browser: nur die Felder, die der Ausbau wirklich anfasst. */
function haus(welt, schalter = []) {
  const h = Object.create(G.House.prototype);
  h.welt = welt;
  h.ausbauSet = new Set(schalter);
  h.dekoMaske = A.dekoMaske([], schalter.length ? 24 : 0);
  h.steine = [];
  h.steinStationen = [];
  h.ausbauMeldung = null;
  h.ausbauMeldungT = 0;
  h.ausbauVorschau = null;
  h.adventStand = { jahr: 2026, offen: [], reihenfolge: [] };
  h.dirty = false;
  return h;
}

const alle = ["deko", "hunde", "weihnachtsdeko", "abend", "post", "nikolaus", "kerzen", "adventskranz",
  "xmaskiste", "flauschi", "kaffee", "lavalampe", "froschblase", "wetter", "sternennacht", "festlich", "baum"];

/** Zeichenfläche, die nur mitzählt. */
function canvas() {
  const ruf = [];
  const c = {
    fillStyle: "#000", strokeStyle: "#000", globalAlpha: 1, font: "", textAlign: "left", textBaseline: "top", lineWidth: 1,
    save() { ruf.push("save"); }, restore() { ruf.push("restore"); },
    beginPath() {}, closePath() {}, fill() { ruf.push("fill"); }, stroke() { ruf.push("stroke"); },
    roundRect(x, y, w, h) { ruf.push(`roundRect:${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)}`); },
    fillText(t, x, y) { ruf.push(`text:${t}@${Math.round(x)},${Math.round(y)}`); },
    measureText(t) { return { width: t.length * 6 }; },
  };
  return { c, ruf };
}

test("Andere Häuser bleiben unberührt: alles ist nutzbar", () => {
  for (const welt of ["normal", "weihnacht", "gruesel", "traum"]) {
    const h = haus(welt);
    for (const id of ["kerzen", "lavalampe", "xmaskiste", "odin", "apollo", "adventskalender", "bett"]) {
      assert.equal(h.stationFrei(id), true, `${welt}/${id}`);
    }
    assert.equal(h.hat("post"), true);
    assert.equal(h.festlich, welt === "weihnacht");
  }
});

test("Leeres Adventshaus: nur der Kalender und das Haus selbst sind Ziele", () => {
  const h = haus("adventshaus");
  assert.equal(h.stationFrei("adventskalender"), true);
  assert.equal(h.stationFrei("bett"), true);
  assert.equal(h.stationFrei("kerzen"), false);
  assert.equal(h.stationFrei("lavalampe"), false);
  assert.equal(h.stationFrei("xmaskiste"), false);
  assert.equal(h.stationFrei("odin"), false);
  assert.equal(h.stationFrei("apollo"), false);
  assert.equal(h.weihnachtsdeko, false, "Kaffeeküche kommt erst mit Türchen 3");
  assert.equal(h.festlich, false);
  assert.equal(h.abendHaus, false);
  assert.equal(h.wetterSichtbar, false);
});

test("Stufe für Stufe: jede Türöffnung schaltet genau ihr Stück frei", () => {
  const stufen = [
    ["kerzen", "kerzen", "stationFrei"],
    ["lavalampe", "lavalampe", "stationFrei"],
    ["xmaskiste", "xmaskiste", "stationFrei"],
    ["odin", "hunde", "stationFrei"],
  ];
  for (const [id, schalter] of stufen) {
    assert.equal(haus("adventshaus", []).stationFrei(id), false, id);
    assert.equal(haus("adventshaus", [schalter]).stationFrei(id), true, id);
  }
  assert.equal(haus("adventshaus", ["weihnachtsdeko"]).weihnachtsdeko, true);
  assert.equal(haus("adventshaus", ["abend"]).abendHaus, true);
  assert.equal(haus("adventshaus", ["wetter"]).wetterSichtbar, true);
  assert.equal(haus("adventshaus", ["festlich"]).festlich, true);
  assert.equal(haus("adventshaus", alle).festlich, true);
});

test("Rufsteine erscheinen mit ihrer Ausbaustufe (9 Raum-Steine im Kiesteil immer frei)", () => {
  const raumAktionen = ["musikzimmer", "gaming", "schlafzimmer", "badezimmer", "treppenhaus", "flur", "wohnzimmer", "kueche", "keller"];
  const leer = haus("adventshaus");
  leer.steineSetzen();
  assert.equal(leer.steine.length, 21, "3 Wechselsteine plus alle Funktions- und Raumsteine");
  assert.equal(leer.steinStationen.length, 21);
  assert.deepEqual(leer.steine.filter((s) => !s.aktion).map((s) => s.ziel).sort(), ["normal", "traum", "weihnacht"]);
  for (const r of raumAktionen) assert.ok(leer.steine.some((s) => s.aktion === r), `Raumstein ${r} fehlt`);

  // Alle Steine sind sichtbar – der Ausbau regelt nur, was nutzbar ist.
  const mitPost = haus("adventshaus", ["post"]);
  mitPost.steineSetzen();
  assert.ok(mitPost.steine.some((s) => s.aktion === "post"));
  assert.ok(mitPost.steine.some((s) => s.aktion === "abend"), "auch ohne Ausbaustufe sichtbar");

  const voll = haus("adventshaus", alle);
  voll.steineSetzen();
  assert.equal(voll.steine.length, 21);
  assert.equal(voll.steinStationen.length, 21);
  for (const aktion of ["post", "nikolaus", "abend", "abendEZ", "aufsteh", "aufstehEZ", "kaffee", "kaffeeEZ", ...raumAktionen]) {
    assert.ok(voll.steine.some((s) => s.aktion === aktion), aktion);
  }
  // Klickziele bleiben fernsehtauglich (mindestens 24 × 24).
  for (const s of voll.steine) assert.ok(s.hit[2] >= 24 && s.hit[3] >= 24, s.label);
});

test("Meldung nach einem Türchen: erst still, dann eine Box mit Text", () => {
  const h = haus("adventshaus", alle);
  const still = canvas();
  h.drawAusbauMeldung(still.c);
  assert.equal(still.ruf.length, 0, "ohne Meldung wird nichts gemalt");

  h.ausbauNachTuerchen(10);
  assert.equal(h.ausbauMeldung, "Neu im Haus: Teleflauschi");
  assert.ok(h.ausbauMeldungT > 0);
  const { c, ruf } = canvas();
  h.drawAusbauMeldung(c);
  const box = ruf.find((r) => r.startsWith("roundRect:"));
  assert.ok(box, "Box fehlt");
  assert.ok(ruf.some((r) => r.startsWith("text:Neu im Haus: Teleflauschi@")), ruf.join(" | "));
  assert.ok(box.endsWith(",20"), "Boxhöhe 20 wie bei den Hovertexten");
  // Mittig auf der 960er-Buehne, innerhalb des fernsehsicheren Bereichs.
  const [, bx, , bw] = box.split(/[:,]/).map(Number);
  assert.ok(Math.abs(bx + bw / 2 - 480) <= 1, "Meldung ist nicht mittig");
  assert.ok(bx >= 96 && bx + bw <= 864, "Meldung liegt im 4:3-Beschnitt");
  assert.equal(c.font, '600 11px "Space Grotesk", sans-serif');
});

test("In anderen Welten malt die Ausbau-Meldung nichts", () => {
  const h = haus("weihnacht");
  h.ausbauMeldung = "Neu im Haus: Unsinn";
  h.ausbauMeldungT = 4;
  const { c, ruf } = canvas();
  h.drawAusbauMeldung(c);
  assert.equal(ruf.length, 0);
});

console.log(`\n${n} Prüfungen bestanden`);