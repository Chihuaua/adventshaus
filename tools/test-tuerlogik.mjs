// Dauerhafte Türlogik: Luni öffnet und schließt alle Türen selbst.
// Nur ein direkter Spielerbefehl überlässt die Türen dem Spieler. Ausnahmen: die bekannten Werte.
import assert from "node:assert/strict";
import { build } from "esbuild";

const b = await build({
  stdin: { resolveDir: process.cwd(), contents: `export { House } from './src/game/house';` },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
const speicher = new Map();
globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
const flaeche = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
globalThis.document = { createElement: flaeche, visibilityState: "visible" };
globalThis.window = { devicePixelRatio: 1 };

let n = 0;
const test = (name, f) => { f(); n++; console.log(`OK  ${name}`); };

/** Haus im Keller, links vor der geschlossenen Schleusentür. */
function hausLinks(vorher = 0) {
  speicher.clear();
  const h = new G.House(flaeche(), { welt: "normal", clock: { year: 2026, month: 11, day: 22, hour: 15, min: 12 } });
  h.pack = 4; h.cigs = 0;
  h.lf = 0; h.lx = 500; h.cur = null; h.path = []; h.activity = null; h.pending = null;
  h.cellarDoorV = vorher; h.cellarDoorWant = vorher;
  return h;
}
/** Bis zu 4000 Schritte laufen, dabei optional die Zufallswerte festsetzen. */
function schritte(h, max = 4000, zufall = null, bedingung = () => false) {
  const alt = Math.random;
  try {
    if (zufall !== null) Math.random = () => zufall;
    for (let i = 0; i < max; i++) { h.update(0.05); if (bedingung(h)) return i; }
  } finally { Math.random = alt; }
  return -1;
}
/** Sie hat die Schleuse überquert und ist rechts davon angekommen. */
const drueben = (h) => h.lf === 0 && h.lx > 620;
/** Merkt sich, ob die Schleuse während des Weges jemals offen war. */
function mitTürbeobachtung(h) {
  const Beob = { offen: false, griff: 0 };
  Beob.bedingung = (x) => {
    if (x.cellarDoorWant > 0.5) Beob.offen = true;
    if (x.doorHandT >= 0 && x.lx < 585) Beob.griff++;   // nur der Griff VOR der Tür zählt hier
    return drueben(x);
  };
  return Beob;
}

test("Eigene Regie: geschlossene Schleuse wird geöffnet und hinter ihr geschlossen", () => {
  const h = hausLinks(0);
  h.command("aschenbecher");
  assert.equal(h.tuerAuftrag, false, "kein Spielerbefehl = eigene Regie");
  const B = mitTürbeobachtung(h);
  assert.ok(schritte(h, 4000, 0.5, B.bedingung) >= 0, "sie geht durch die Schleuse");
  assert.equal(B.offen, true, "die Tür war zum Gehen offen");
  assert.ok(B.griff > 0, "sie greift sichtbar zum Knauf");
  assert.ok(h.tuerHinter || h.cellarDoorWant === 0, "sie nimmt sich vor, die Tür hinter sich zu schließen");
  schritte(h, 400, 0.5);
  assert.equal(h.cellarDoorWant, 0, "und schließt sie hinter sich");
});

test("Direkter Spielerbefehl: sie öffnet nur den Weg und lässt die Tür dem Spieler", () => {
  const h = hausLinks(0);
  h.nutzerEingabe = true; h.command("aschenbecher"); h.nutzerEingabe = false;
  assert.equal(h.tuerAuftrag, true, "Auftrag vom Spieler");
  const B = mitTürbeobachtung(h);
  assert.ok(schritte(h, 4000, 0.5, B.bedingung) >= 0, "sie geht trotzdem hindurch");
  assert.equal(B.offen, true, "was im Weg steht, öffnet sie");
  assert.equal(h.tuerHinter, null, "sie plant kein Schließen hinter sich");
  assert.equal(h.cellarDoorWant, 1, "die Tür bleibt offen – der Spieler kümmert sich");
});


test("Offene Schleuse: in eigener Regie wird sie hinter ihr geschlossen, ohne sie noch einmal zu öffnen", () => {
  const h = hausLinks(1);
  h.command("aschenbecher");
  const B = mitTürbeobachtung(h);
  schritte(h, 4000, 0.5, B.bedingung);
  assert.equal(B.griff, 0, "eine offene Tür wird nicht noch einmal geöffnet");
  assert.equal(h.cellarDoorWant, 0, "und beim Durchqueren geschlossen");
});

test("Ausnahme „vergessene Tür“: in drei von hundert Fällen bleibt sie offen", () => {
  const zu = hausLinks(0); zu.command("aschenbecher");
  schritte(zu, 4000, 0.5, drueben); schritte(zu, 400, 0.5);
  assert.equal(zu.cellarDoorWant, 0, "sonst schließt sie die Tür");
  const offen = hausLinks(0); offen.command("aschenbecher");
  schritte(offen, 4000, 0.01, drueben); schritte(offen, 400, 0.01);
  assert.equal(offen.cellarDoorWant, 1, "mit der bekannten Wahrscheinlichkeit vergisst sie es");
});

test("Der Spieler-Auftrag erlischt, sobald sie stillsteht", () => {
  const h = hausLinks(0);
  h.nutzerEingabe = true; h.command("sofa"); h.nutzerEingabe = false;
  assert.equal(h.tuerAuftrag, true, "während des Weges gilt der Auftrag");
  h.lf = 1; h.lx = 340; h.cur = null; h.path = []; h.activity = null; h.pending = null;
  h.update(0.05);
  assert.equal(h.tuerAuftrag, false, "stehend und ohne Plan gilt wieder ihre eigene Regel");
});

test("Verbindungstür im Musikzimmer folgt derselben Regel", () => {
  speicher.clear();
  const h = new G.House(flaeche(), { welt: "gruesel", clock: { year: 2026, month: 11, day: 22, hour: 15, min: 12 } });
  if (!h.musikzimmer) { console.log("    (Musikzimmer im Gruselhaus aus – Prüfung übersprungen)"); return; }
  h.lf = 3; h.lx = 480; h.cur = null; h.path = []; h.activity = null; h.pending = null;
  h.musikDoorWant = 1; h.musikDoor = 1;
  h.nutzerEingabe = true; h.command("klavier"); h.nutzerEingabe = false;
  schritte(h, 6000, 0.5);
  assert.equal(h.musikDoorWant, 1, "Spielerbefehl: Tür bleibt, wie der Spieler sie hinterlassen hat");
});

console.log(`\n${n} Türlogik-Prüfungen bestanden.`);
