// Begleitung ohne eigene Uhr: Kalender, Stein, Speichern und alle Uebergaenge mit dem Nikolaus.
import assert from "node:assert/strict";
import { build } from "esbuild";

const paket = await build({ stdin: { resolveDir: process.cwd(), contents: `
  export * from './src/game/ruprecht-begleitung'; export * from './src/game/ruprecht-figur';
  export * from './src/game/nikolaus-besuch'; export { steinSlots } from './src/game/steine';` },
  bundle: true, write: false, platform: "node", format: "esm" });
const G = await import(`data:text/javascript;base64,${Buffer.from(paket.outputFiles[0].text).toString("base64")}`);
const datum = { year: 2026, month: 12, day: 6 };
const gast = new G.NikolausBesuch();
assert.equal(G.ruprechtBegleitung(gast), null);
assert.equal(gast.kalender({ ...datum, day: 5 }), false);
assert(gast.kalender(datum));
gast.schritt(G.HALBER_SCHRITT - .01, false, false);
assert(gast.bild()); assert.equal(G.ruprechtBegleitung(gast), null, "Nikolaus tritt zuerst aus dem Wald");
gast.schritt(.02, false, false);
const erster = G.ruprechtBegleitung(gast); assert(erster.x > 900 && erster.skala * G.RUPRECHT_HOEHE < 9);
let vorher = erster, stufen = 0;
const phasen = new Set(), ereignisse = [];
while (gast.aktiv && stufen++ < 4500) {
  const da = gast.phase !== "warten" || gast.zeit > 3;
  const ev = gast.schritt(.025, da, da); if (ev) ereignisse.push(ev);
  const bild = G.ruprechtBegleitung(gast);
  if (!bild) break;
  assert(Math.hypot(bild.x - vorher.x, bild.y - vorher.y) < 1.3, `Kein Sprung an der Phase ${gast.phase}`);
  assert(Math.abs(bild.skala - vorher.skala) < .01);
  if (gast.phase === "waldweg") {
    assert(bild.skala >= vorher.skala && bild.y >= vorher.y, "Langsam aus der Tiefe herankommen");
    assert(bild.y < gast.bild().y && bild.x > gast.bild().x, "Ein halber Schritt hinter Nikolaus");
  }
  if (gast.phase === "heimweg") assert.equal(bild.ansicht, "hinten");
  if (gast.phase === "gruss" && gast.zeit >= G.HALBER_SCHRITT) {
    assert(bild.x < 864 && bild.x > gast.bild().x + 24, "Zwei verschiedene, beschnittsichere Standplaetze");
    assert.equal(bild.pose, "gruessen");
  }
  if (!phasen.has(gast.phase)) {
    const kopie = new G.NikolausBesuch(); kopie.laden(JSON.parse(JSON.stringify(gast.stand())));
    assert.deepEqual(G.ruprechtBegleitung(kopie), bild, `Gleiche Position nach dem Laden: ${gast.phase}`);
    const stand = gast.stand(); assert.equal(gast.rufen(datum), false); assert.deepEqual(gast.stand(), stand);
    phasen.add(gast.phase);
  }
  vorher = bild;
}
assert.equal(gast.aktiv, false); assert.equal(G.ruprechtBegleitung(gast), null);
assert.deepEqual([...phasen], ["waldweg", "warten", "eintreten", "gruss", "austreten", "heimweg"]);
assert.deepEqual(ereignisse, ["anklopfen", "eintreten", "abschied", "tuerFrei", "ende"], "Nur ein Klopfen und ein Besuch");
assert.equal(gast.kalender(datum), false);
assert(gast.rufen({ ...datum, month: 7 }), "Manuell ruft derselbe Stein beide Gaeste");
gast.schritt(G.WALDWEG_SEK, false, false); gast.schritt(89, false, false);
const wartet = G.ruprechtBegleitung(gast); assert.equal(wartet.pose, "stehen");
gast.schritt(1.1, false, false); assert.equal(gast.phase, "heimweg");
let zurueck = G.ruprechtBegleitung(gast); assert(Math.hypot(zurueck.x - wartet.x, zurueck.y - wartet.y) < .01);
gast.schritt(G.WALDWEG_SEK, false, false); assert.equal(G.ruprechtBegleitung(gast), null);
for (const w of ["normal", "traum", "gruesel", "weihnacht"]) {
  const slots = G.steinSlots(w);
  assert.equal(slots.filter(s => s.aktion === "nikolaus").length, 1, `${w}: Nikolaus sichtbar`);
  assert(!slots.some(s => s.art === "ruprecht"), "Kein zweiter Stein und kein weiterer Fokusplatz");
}

function aufzeichnung() {
  let stapel = 0; const linien = [];
  const kontext = new Proxy({ globalAlpha: 1, save() { stapel++; }, restore() { assert(--stapel >= 0); },
    createLinearGradient() { return { addColorStop() {} }; } }, {
    get(obj, k) { return k in obj ? obj[k] : (...zahlen) => {
      for (const n of zahlen) if (typeof n === "number") assert(Number.isFinite(n));
      if (k === "ellipse") assert(zahlen[2] > 0 && zahlen[3] > 0);
      linien.push([k, ...zahlen]);
    }; },
  });
  return { kontext, ende() { assert.equal(stapel, 0); return JSON.stringify(linien); } };
}
const varianten = new Set();
for (const ansicht of ["vorn", "links", "rechts", "hinten"]) {
  for (const pose of ["stehen", "gehen", "gruessen"]) {
    const a = aufzeichnung(); G.zeichneRuprecht(a.kontext, 0, 0, { ansicht, pose, zeit: 1.3, skala: 1 });
    const bild = a.ende(); varianten.add(bild);
    const b = aufzeichnung(); G.zeichneRuprecht(b.kontext, 0, 0, { ansicht, pose, zeit: 1.3, skala: 1 });
    assert.equal(b.ende(), bild, "Keine flackernden oder zufaelligen Zeichendetails");
  }
}
assert.equal(varianten.size, 12, "Vier eigene Ansichten mit Gehen, Stehen und Gruss");
for (const phase of ["ruhe", "waldweg", "gruss", "heimweg"]) {
  const a = aufzeichnung(); G.zeichneRuprechtSpur(a.kontext, { phase, zeit: 6 });
  assert.equal(a.ende() === "[]", phase === "ruhe", "Keine Spuren nach Ende des Besuchs");
}
console.log("OK  Knecht Ruprecht: Begleitung, Perspektive, Jahresbesuch, Rufstein, Speicher, Heimweg, Spuren und 12 Figurenvarianten.");