// Prüfungen für den Ausbau des Adventshauses (ohne Browser).
import assert from "node:assert/strict";
import { build } from "esbuild";

async function lade(datei) {
  const b = await build({ entryPoints: [datei], bundle: true, write: false, format: "esm", platform: "node" });
  return import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
}
const A = await lade("src/game/adventshaus-ausbau.ts");
const D = await lade("src/game/deko.ts");
const S = await lade("src/game/steine.ts");

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

const alle = Array.from({ length: 24 }, (_, i) => i + 1);

test("Ausbauplan hat 24 lückenlose Stufen mit Titel, Ort und Satz", () => {
  assert.equal(A.AUSBAU_STUFEN.length, 24);
  A.AUSBAU_STUFEN.forEach((s, i) => {
    assert.equal(s.tuer, i + 1);
    assert.ok(s.titel.length > 2, `Stufe ${s.tuer} ohne Titel`);
    assert.ok(s.ort.length > 2, `Stufe ${s.tuer} ohne Ort`);
    assert.ok(s.text.length > 12, `Stufe ${s.tuer} ohne Satz`);
    assert.ok(["deko", "gegenstand", "bewohner", "ablauf", "ereignis"].includes(s.art));
  });
});

test("Leeres Haus: kein Schalter, kein Deko-Stück", () => {
  assert.equal(A.ausbauStufe([], 0), 0);
  assert.equal(A.ausbauSchalter([], 0).size, 0);
  assert.equal(A.dekoAnzahl([], 0), 0);
  assert.equal(A.dekoMaske([], 0).length, 24);
  assert.equal(A.naechsteStufe([], 0).tuer, 1);
});

test("Türchen schalten genau ihre Stufe frei – auch rückwirkend", () => {
  assert.equal(A.ausbauStufe([1], 0), 1);
  assert.ok(A.ausbauSchalter([1], 0).has("deko"));
  assert.ok(!A.ausbauSchalter([1], 0).has("post"));
  const fuenf = A.ausbauSchalter([1, 2, 3, 4, 5], 0);
  for (const s of ["deko", "weihnachtsdeko", "abend", "post"]) assert.ok(fuenf.has(s), s);
  assert.ok(!fuenf.has("hunde"), "Hunde sind vom Kalender entkoppelt");
  assert.equal(A.stufeZu(2)?.titel, "Fußmatte", "Türchen 2 ist jetzt die Fußmatte");
  assert.ok(!fuenf.has("flauschi"));
  // Nachgeholte Türchen zählen genauso, die Reihenfolge ist egal.
  assert.deepEqual([...A.ausbauSchalter([5, 3, 1], 0)].sort(), [...A.ausbauSchalter([1, 3, 5], 0)].sort());
});

test("Volles Haus: alle Schalter da, keine Stufe fehlt mehr", () => {
  const voll = A.ausbauSchalter(alle, 0);
  for (const s of ["deko", "weihnachtsdeko", "abend", "post", "nikolaus", "kerzen",
    "xmaskiste", "flauschi", "kaffee", "lavalampe", "froschblase", "wetter", "festlich", "baum"]) {
    assert.ok(voll.has(s), s);
  }
  assert.equal(A.ausbauStufe(alle, 0), 24);
  assert.equal(A.dekoAnzahl(alle, 0), 24);
  assert.equal(A.naechsteStufe(alle, 0), null);
});

test("Deko-Maske passt Stück für Stück zu den Türchen (Index 0 = Türchen 1)", () => {
  const m = A.dekoMaske([1, 4, 24], 0);
  assert.equal(m.length, 24);
  assert.equal(m[0], true);
  assert.equal(m[3], true);
  assert.equal(m[23], true);
  assert.equal(m[1], false);
  assert.equal(A.dekoAnzahl([1, 4, 24], 0), 3);
  assert.equal(D.DEKO_STUECKE.length, 24);
});

test("Türchen folgen dem echten Datum: nachholbar, nie vorziehbar", () => {
  assert.equal(A.tuerchenFrei(3, 12, 5), true, // 3. Dezember am 5. Dezember: nachholbar
    "vergangene Türchen bleiben offen");
  assert.equal(A.tuerchenFrei(5, 12, 5), true);
  assert.equal(A.tuerchenFrei(6, 12, 5), false, "morgen ist heute nicht");
  assert.equal(A.tuerchenFrei(1, 11, 28), false, "im November bleibt der Kalender zu");
  assert.equal(A.tuerchenFrei(1, 1, 6), false, "im Januar auch");
  assert.equal(A.tuerchenFrei(0, 12, 24), false);
  assert.equal(A.tuerchenFrei(25, 12, 24), false);
});

test("Vorschau-Stufe aus dem Hash, ohne den Speicher anzufassen", () => {
  assert.equal(A.ausbauVorschauAusHash("#adventshaus"), null);
  assert.equal(A.ausbauVorschauAusHash("#adventshaus/12"), 12);
  assert.equal(A.ausbauVorschauAusHash("#adventshaus/0"), 0);
  assert.equal(A.ausbauVorschauAusHash("#adventshaus/99"), 24);
  assert.equal(A.ausbauVorschauAusHash("#traumhaus"), null);
  assert.equal(A.istAdventshausHash("#adventshaus"), true);
  assert.equal(A.istAdventshausHash("#adventshaus/7"), true);
  assert.equal(A.istAdventshausHash("#weihnachtshaus"), false);
  // Vorschau wirkt wie geöffnete Türchen, echt gespeichert wird nichts.
  assert.equal(A.ausbauStufe([], 12), 12);
  assert.ok(A.ausbauSchalter([], 12).has("lavalampe"));
  assert.ok(!A.ausbauSchalter([], 12).has("festlich"));
});

test("Meldung nach einem Türchen nennt das neue Stück", () => {
  assert.match(A.ausbauMeldung(10), /Teleflauschi/);
  assert.match(A.ausbauMeldung(24), /Weihnachtsbaum/);
  assert.equal(A.ausbauMeldung(99), null);
});

test("Advent führt ins Adventshaus, ohne andere Steine zu versetzen", () => {
  const traum = S.steinSlots("traum");
  const advent = traum.find((s) => s.ziel === "adventshaus");
  assert.ok(advent, "Advent fehlt im Traumhaus");
  assert.equal(advent.art, "advent");
  assert.equal(advent.label, "Advent");
  // Eigener Platz am rechten Rand des Erdreichs, vor der Kellerwand
  assert.equal(advent.x, S.ADVENT_STEIN.x);
  assert.equal(S.ADVENT_STEIN.hit[0] + S.ADVENT_STEIN.hit[2] <= 354, true, "Stein bleibt im Erdreich");
  assert.ok(advent.hit[2] >= 24 && advent.hit[3] >= 24, "Klickziel zu klein");
  // Wachstein, Horrorstein und Weihnacht bleiben an ihren Plätzen.
  const festeWelt = traum.filter((s) => !s.aktion && s.ziel !== "adventshaus").map((s) => s.x);
  assert.deepEqual(festeWelt, [S.STEIN.x, S.STEIN_C.x, S.WELT_PLAETZE[3].x], "feste Plätze nach Welt");
  const grusel = S.steinSlots("gruesel");
  assert.ok(grusel.some((s) => s.ziel === "adventshaus"));
  // Im Adventshaus stehen drei Wechselsteine zurück in die Entwicklungshäuser.
  const zurueck = S.steinSlots("adventshaus");
  const wechsel = zurueck.filter((s) => !s.aktion);
  assert.equal(wechsel.length, 3);
  assert.deepEqual(wechsel.map((s) => s.ziel).sort(), ["normal", "traum", "weihnacht"]);
  assert.deepEqual(wechsel.map((s) => s.x), [S.WELT_PLAETZE[0].x, S.WELT_PLAETZE[1].x, S.WELT_PLAETZE[3].x]);
  // Kein Wechselstein führt aus dem Adventshaus auf sich selbst.
  assert.ok(!wechsel.some((s) => s.ziel === "adventshaus"));
  // Die Rufsteine für Abend, Aufsteh, Kaffee, Post und Nikolaus sind mit dabei;
  // wann sie nutzbar sind, entscheidet der Ausbau im Haus.
  for (const aktion of ["post", "nikolaus", "abend", "abendEZ", "aufsteh", "aufstehEZ", "kaffee", "kaffeeEZ"]) {
    assert.ok(zurueck.some((s) => s.aktion === aktion), `Rufstein ${aktion} fehlt`);
  }
});

test("Weihnachtshaus und normales Haus behalten ihre Steine unverändert", () => {
  const normal = S.steinSlots("normal");
  const an = normal.filter((s) => s.ziel === "adventshaus");
  assert.equal(an.length, 1, "Advent fehlt im normalen Haus");
  assert.equal(an[0].x, S.ADVENT_STEIN.x);
  assert.deepEqual(normal.slice(0, 3).map((s) => s.ziel), ["traum", "gruesel", "weihnacht"]);
  const weihnacht = S.steinSlots("weihnacht");
  assert.deepEqual(weihnacht.slice(0, 3).map((s) => s.ziel), ["normal", "traum", "gruesel"]);
  assert.ok(weihnacht.some((s) => s.aktion === "post"), "Post fehlt im Weihnachtshaus");
});

test("Die Deko malt im Adventshaus Stück für Stück mehr (ohne Fehler)", () => {
  const zaehle = () => {
    let n = 0;
    const ziel = {};
    return new Proxy(ziel, {
      get(t, k) {
        if (k === "canvas") return { width: 960, height: 600 };
        if (k === "measureText") return () => ({ width: 12 });
        if (k === "createRadialGradient" || k === "createLinearGradient") return () => ({ addColorStop() {} });
        if (k === "fill" || k === "stroke" || k === "fillRect" || k === "fillText") return () => { n++; };
        if (k in t) return t[k];
        return () => {};
      },
      set(t, k, v) { t[k] = v; return true; },
    });
  };
  const male = (offen) => {
    const alt = console.log; let n = 0;
    const c = zaehle();
    const maske = A.dekoMaske(offen, 0);
    D.drawDeko(c, maske, 3.5);
    D.drawDekoLicht(c, maske, 3.5);
    console.log = alt;
    return c;
  };
  // Jede Stufe zeichnet mehr als die vorige; nichts wirft einen Fehler.
  const vorher = [];
  for (const offen of [[], [1], [1, 2], alle.slice(0, 12), alle]) {
    const c = male(offen);
    vorher.push(c);
  }
  assert.equal(vorher.length, 5);
  const mengen = [[], [1], [1, 2], alle.slice(0, 12), alle].map((offen) => {
    let n = 0;
    const c = new Proxy({}, {
      get(t, k) {
        if (k === "canvas") return { width: 960, height: 600 };
        if (k === "measureText") return () => ({ width: 12 });
        if (k === "createRadialGradient" || k === "createLinearGradient") return () => ({ addColorStop() {} });
        if (k === "fill" || k === "stroke" || k === "fillRect") return () => { n++; };
        if (k in t) return t[k];
        return () => {};
      },
      set(t, k, v) { t[k] = v; return true; },
    });
    const maske = A.dekoMaske(offen, 0);
    D.drawDeko(c, maske, 3.5);
    D.drawDekoLicht(c, maske, 3.5);
    return n;
  });
  assert.equal(mengen[0], 0, "leeres Haus zeichnet keine Deko");
  for (let i = 1; i < mengen.length; i++) assert.ok(mengen[i] > mengen[i - 1], `Stufe ${i} zeichnet nicht mehr`);
});

console.log(`\n${n} Prüfungen bestanden`);