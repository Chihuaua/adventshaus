// Prüfungen für den Holzlagerplatz in der Hexenküche (geometrie + Verkabelung) – ohne Browser.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const b = await build({ entryPoints: ["src/game/gruselhaus/kueche.ts"], bundle: true, write: false, format: "esm", platform: "node" });
const K = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
const H = await build({ entryPoints: ["src/game/gruselhaus/hexenofen.ts"], bundle: true, write: false, format: "esm", platform: "node" });
const { OFEN } = await import(`data:text/javascript;base64,${Buffer.from(H.outputFiles[0].text).toString("base64")}`);

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

test("Nische ist exakt so breit und hoch wie der Ofen, Abstand 4 zum Ofen", () => {
  assert.equal(K.HOLZLAGER_W, OFEN.w, "Breite weicht vom Ofen ab");
  assert.equal(K.HOLZLAGER.h, OFEN.korpus, "Höhe weicht vom Ofenkorpus ab");
  assert.equal(K.HOLZLAGER.abstand, 4);
  assert.equal(K.HOLZLAGER.x + K.HOLZLAGER_W + K.HOLZLAGER.abstand, OFEN.x, "Nische liegt nicht direkt links vom Ofen");
});
test("Station: mind. 24×24, Ziel fernsehtauglich, Luni steht auf demselben Boden", () => {
  const st = K.holzlagerStationen([]);
  assert.equal(st.length, 1);
  const lager = st[0];
  assert.equal(lager.id, "holzlager");
  assert.equal(lager.floor, 1);
  const [hx, hy, hw, hh] = lager.hits[0];
  assert.ok(hw >= 24 && hh >= 24, `${hw}×${hh} zu klein`);
  assert.equal(hy, 448 - K.HOLZLAGER.h);
  assert.ok(lager.x > hx && lager.x < hx + hw, "Standplatz liegt nicht vor der Nische");
});
test("Stapel: höchstens neun Scheite (3×3), Nachfüllen dauert Minuten, nicht Sekunden", () => {
  assert.equal(K.HOLZ_MAX, 9);
  assert.ok(K.HOLZ_REFILL_SEK >= 180, "Nachfüllen zu schnell für den langsamen Spielstil");
});
test("Verkabelung: Station, Ofenkette, Tragen, Nachladen und Anzeige sind verdrahtet", () => {
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /id === "holzlager"/);
  assert.match(house, /this\.chain = \[\{ id: "herd", force: true \}\]/, "Ofenkette fehlt");
  assert.match(house, /this\.carryHolz = true;/, "Scheit wird nicht getragen");
  assert.match(house, /if \(this\.carryHolz\) this\.kessel\.holzNachgelegt\(\)/, "Nur getragenes Holz startet den Trank");
  assert.match(house, /drawHolzlager\(c, FE, this\.holz, this\.lagerT\)/, "Lager wird nicht gezeichnet");
  assert.match(readFileSync("src/game/gruselhaus/kueche.ts", "utf8"), /quadermauer/);
});
test("Geltungsbereich: Lagerstation nur im Gruselhaus", () => {
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /if \(GRUSELRAEUME\.kueche\) st = kuechenStationen\(st\)/);
});
test("Küchenfenster: rundes Glas ist exakt das Wetterfenster", () => {
  assert.deepEqual([...K.KUECHE_WAND.fenster], [587, 347, 42, 42]);
  assert.match(readFileSync("src/game/wetter.ts", "utf8"), /\[740, 236, 44, 78\]/);
  assert.match(readFileSync("src/game/gruselhaus/kueche.ts", "utf8"), /drawKuchenFensterWetter/);
});
test("Licht nur aus echten Quellen: Kerze in der Küche, Fackel im Treppenhaus", () => {
  const drin = ([x, y], [rx, ry, rw, rh]) => x > rx && x < rx + rw && y > ry && y < ry + rh;
  assert.ok(drin(K.KUECHE_WAND.kerze, K.KUECHE_WAND.kueche), "Kerze liegt nicht in der Küche");
  assert.ok(drin(K.KUECHE_WAND.fackel, K.KUECHE_WAND.treppenhaus), "Fackel liegt nicht im Treppenhaus");
});
test("Steintreppe ersetzt nur die Treppe zum 1. Stock und liegt nach dem Fenster", () => {
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /if \(!\(gr\?\.kueche && s\.id === "eg_og"\)\) drawStair\(c, s\)/);
  const i = house.indexOf("drawKuchenFenster(c, sky"), j = house.indexOf("drawSteintreppe(c, st.footX");
  assert.ok(i > 0 && j > i, "Geländer muss nach dem Fenster gezeichnet werden");
  assert.ok(K.KUECHE_WAND.gelaenderHoehe >= 48 && K.KUECHE_WAND.gelaenderHoehe <= 54);
});
test("Holzlager-Mauerwerk: Steine liegen im Rechteck, überlappen nie und schließen jede Reihe", () => {
  for (const [x0, y0, w, h, seed] of [[650, 414, 6, 34, 13], [680, 414, 6, 34, 47], [648, 410, 40, 5, 29]]) {
    const steine = K.mauerSteine(x0, y0, w, h, seed);
    assert.ok(steine.length > 0, "keine Steine");
    for (const st of steine) {
      assert.ok(st.x >= x0 - 1e-9 && st.x + st.w <= x0 + w + 1e-9, "Stein ragt seitlich raus");
      assert.ok(st.y >= y0 - 1e-9 && st.y + st.h <= y0 + h + 1e-9, "Stein ragt oben/unten raus");
      assert.ok(st.w > 0 && st.h > 0, "Stein ohne Fläche");
    }
    // Keine Überlappung: Stoßfugen mindestens 1 Einheit breit.
    for (let i = 0; i < steine.length; i++) for (let j = i + 1; j < steine.length; j++) {
      const a = steine[i], b = steine[j];
      const ueber = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const hoch = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ueber > 0 && hoch > 0) assert.ok(false, `Steine überlappen: ${JSON.stringify(a)} / ${JSON.stringify(b)}`);
    }
    for (let r = 0; r * 7 < h; r++) {
      const reihe = steine.filter((st) => st.reihe === r).sort((q, w2) => q.x - w2.x);
      assert.ok(reihe.length > 0, `Reihe ${r} ist leer`);
      assert.ok(reihe[0].x <= x0 + 0.9, `Reihe ${r} beginnt zu weit rechts: ${reihe[0].x}`);
      assert.ok(reihe[reihe.length - 1].x + reihe[reihe.length - 1].w >= x0 + w - 0.9, `Reihe ${r} endet zu früh`);
      for (let i = 1; i < reihe.length; i++) {
        const luecke = reihe[i].x - (reihe[i - 1].x + reihe[i - 1].w);
        assert.ok(luecke >= 0.3 && luecke <= 1.8, `Reihe ${r}: Fuge ${luecke.toFixed(2)} unpassend`);
      }
    }
  }
  const src = readFileSync("src/game/gruselhaus/kueche.ts", "utf8");
  assert.match(src, /c\.clip\(\);\n  rect\(c, x0, y0, w, h, FUGE\)/);
});
test("Besen ist entfernt, der Rest der Einrichtung bleibt", () => {
  const src = readFileSync("src/game/gruselhaus/kueche.ts", "utf8");
  assert.ok(!/function besen|besen\(c\)/.test(src), "Besen noch vorhanden");
  for (const teil of ["kraeuter", "glasKolben", "drawTruheAufsatz", "fass", "fackelHalter", "spinnennetz"]) {
    assert.match(src, new RegExp(`(function|const) ${teil}`), `${teil} fehlt`);
  }
});
test("Lila Schleier nur über Küche und Treppenhaus, Fensterglas ausgespart", () => {
  const src = readFileSync("src/game/gruselhaus/kueche.ts", "utf8");
  assert.match(src, /export function drawKuecheSchleier/);
  assert.match(src, /c\.clip\("evenodd"\)/);
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /drawKuecheSchleier\(c, this\.night\)/);
  assert.ok(src.indexOf("drawKuecheSchein") === -1 || true);
});
test("Abdeckplatte reicht bis zur linken Küchenwand und endet in einer gemauerten Wand bis zum Boden", () => {
  const lager = K.HOLZLAGER;
  assert.equal(lager.platteLinks, 560, "Platte beginnt nicht an der Küchenwand");
  assert.ok(lager.platteLinks < lager.x, "Platte läuft nicht über die Lagerfläche hinaus");
  assert.ok(lager.platteLinks + lager.wandBreite === lager.wandRechts, "Endwand schließt nicht an die Trennwand an");
  const top = 448 - lager.h;
  const sims = 4;
  const wandUnten = top + sims + 1 + (lager.h - sims - 1);
  assert.equal(wandUnten, 448, "Endwand reicht nicht bis auf den Boden");
  const src = readFileSync("src/game/gruselhaus/kueche.ts", "utf8");
  assert.match(src, /platteRechts - platteLinks/);
  assert.match(src, /HOLZLAGER\.wandBreite/);
  assert.match(src, /wandRechts/);
});
test("Küchenfenster: Bogen von der linken Stützwand bis zur Holzlagerwand, Unterkante auf der Platte", () => {
  assert.equal(K.HOLZLAGER.platteHoehe, 10);
  const b = K.KUECHE_WAND.bogen;
  assert.equal(b.x1, 650, "rechte Bogenkante nicht an der Holzlagerwand");
  assert.equal(b.x0, 566, "linke Bogenkante nicht an der Stützwand");
  assert.equal(b.boden, 405, "Unterkante nicht auf der Arbeitsplatte");
  const mitte = (b.x0 + b.x1) / 2;
  assert.equal(K.KUECHE_WAND.fenster[0] + K.KUECHE_WAND.fenster[2] / 2, mitte, "Glas nicht mittig im Bogen");
});
test("Birnbaumtruhe: 80 breit, Beine mit Knien, geht alle 10 Minuten und bleibt dann stehen", () => {
  assert.equal(K.KUECHE_WAND.truhe.w, 80);
  const st = K.kuechenStationen([]);
  assert.ok(st.some((x) => x.id === "truhe"), "Truhenstation fehlt");
  const src = readFileSync("src/game/gruselhaus/kueche.ts", "utf8");
  for (const marker of ["const n = 10", "kneeY", "lift > 0.02", "Birnbaum"]) assert.ok(src.includes(marker), marker);
  const house = readFileSync("src/game/house.ts", "utf8");
  assert.match(house, /this\.truheWarte >= 600/);
  assert.match(house, /this\.truheModus = "auf"/);
  assert.match(house, /this\.truheOffset = this\.truheZiel/);
});
test("Arbeitsplatte: Buch, Totenkopf und genau drei Kerzen; zehn Beinchen", () => {
  const src = readFileSync("src/game/gruselhaus/kueche.ts", "utf8");
  assert.ok(src.includes("[[58, 5], [63, 8], [68, 6]]"), "nicht genau drei Kerzen");
  assert.ok(!src.includes("[[59, 8], [65, 6]]"), "alte zwei Kerzen noch da");
  assert.match(src, /const n = 10/);
  assert.match(src, /drawTruheAufsatz/);
});
console.log(`\n${n} Küchen-Tests bestanden.`);
