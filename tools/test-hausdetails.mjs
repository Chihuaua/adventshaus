// Hausdetails: kurze Streben, angepasster Handlauf, Treppenfenster hinter dem Geländer, Eisblumen.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const b = await build({
  stdin: {
    contents: readFileSync("src/game/house.ts", "utf8")
      + "\nexport { railing, drawStair, windowRect, roundWindow, haustuer, drawHouse, drawBedCloth, drawBedEntryBlanket };\nexport { fensterReif, rundReif } from \"./reif\";\nexport { WEIHNACHTSBAUM_X, WEIHNACHTS_ORTE, WEIHNACHTS_FARBEN, weihnachtsKerzenflammen } from \"./weihnachtshaus\";\n",
    resolveDir: path.resolve("src/game"), loader: "ts",
  },
  bundle: true, write: false, platform: "node", format: "esm",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);

// Zeichnet nichts auf, hält jede Figur mit Koordinaten fest.
function canvas() {
  const ops = [];
  let pfad = [];
  const ziel = { fillStyle: "", strokeStyle: "", lineWidth: 1, lineCap: "butt", globalAlpha: 1 };
  const c = new Proxy(ziel, {
    get(o, k) {
      if (k === "ops") return ops;
      if (k in o) return o[k];
      if (k === "createLinearGradient") return (x0, y0, x1, y1) => {
        const stops = [];
        ops.push({ art: "linear", x0, y0, x1, y1, stops });
        return { addColorStop(_, farbe) { stops.push(farbe); } };
      };
      if (k === "createRadialGradient") return (x0, y0, r0, x1, y1, r1) => { ops.push({ art: "radial", x0, y0, r0, x1, y1, r1 }); return { addColorStop() {} }; };
      if (k === "translate") return (x, y) => { ops.push({ art: "translate", x, y }); };
      if (k === "beginPath") return () => { pfad = []; };
      if (k === "moveTo") return (x, y) => { pfad = [[x, y]]; };
      if (k === "lineTo") return (x, y) => { pfad.push([x, y]); };
      if (k === "fillRect") return (x, y, w, h) => { ops.push({ art: "rect", x, y, w, h, farbe: ziel.fillStyle }); };
      if (k === "fillText") return (t2) => { ops.push({ art: "text", t: t2 }); };
      if (k === "rect") return (x, y, w, h) => { ops.push({ art: "pfadrect", x, y, w, h }); };
      if (k === "clip") return () => { ops.push({ art: "clip" }); };
      if (k === "stroke") return () => { if (pfad.length) ops.push({ art: "strich", von: pfad[0], bis: pfad[pfad.length - 1], farbe: ziel.strokeStyle, breite: ziel.lineWidth }); };
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; },
  });
  return c;
}
let n = 0;
const test = (name, run) => { run(); n++; console.log(`OK  ${name}`); };

test("Kleine Brüstungen: Streben halb so hoch (13), Handlauf sitzt oben auf", () => {
  assert.equal(G.BRUESTUNG_HOEHE, 13);
  const c = canvas();
  G.railing(c, 100, 500, 40);
  const striche = c.ops.filter((o) => o.art === "strich");
  const handlauf = striche.find((o) => o.von[1] === 487 && o.bis[1] === 487);
  assert.ok(handlauf && handlauf.von[0] === 100 && handlauf.bis[0] === 140, "Handlauf liegt 13 über dem Boden");
  for (const s of striche.filter((o) => o !== handlauf)) {
    assert.equal(s.von[0], s.bis[0], "Strebe steht senkrecht");
    assert.ok(Math.abs(Math.abs(s.bis[1] - s.von[1]) - 13) < 1e-9, "Strebe ist 13 hoch");
    assert.ok(s.bis[1] === 500, "Strebe steht auf dem Boden");
  }
});

test("Treppen: alle Streben 27 hoch, Handlauf parallel zu den Stufen", () => {
  assert.equal(G.GELAENDER_HOEHE, 27);
  for (const s of G.STAIRS) {
    const c = canvas();
    G.drawStair(c, s);
    const striche = c.ops.filter((o) => o.art === "strich");
    for (const st of striche.filter((o) => o.von[0] === o.bis[0])) {
      assert.ok(Math.abs(Math.abs(st.bis[1] - st.von[1]) - 27) < 0.01, `Strebe an Treppe ${s.id} ist 27 hoch`);
    }
    const handlauf = striche.find((o) => o.breite === 3.4);
    assert.ok(handlauf, "Handlauf vorhanden");
    assert.ok(Math.abs(handlauf.von[1] - (G.FLOOR_Y[s.lower] - 27)) < 1e-9, "Handlauf liegt 27 über den Stufen");
    assert.ok(Math.abs(handlauf.von[0] - s.footX) < 1e-9 && Math.abs(handlauf.bis[0] - s.topX) < 1e-9, "Handlauf läuft von unten nach oben");
  }
});

test("Fenster im rechten Treppenhaus wird vor der Treppe gezeichnet: Das Geländer liegt davor", () => {
  const c = canvas();
  G.drawHouse(c, {}, { open: 0 }, true, null, false);
  const fenster = c.ops.findIndex((o) => o.art === "rect" && o.x === 737 && o.y === 233 && o.w === 50 && o.h === 84);
  assert.ok(fenster >= 0, "das hohe Fenster wird gezeichnet");
  const treppe = c.ops.findIndex((o, i) => i > 0 && o.art === "strich" && o.breite === 3.4 && o.farbe === "#2a2420");
  assert.ok(treppe >= 0, "die Treppengeländer werden gezeichnet");
  assert.ok(fenster < treppe, "erst das Fenster, dann das Geländer");
});

test("Eisblumen: Reif an allen Fenstern, an den Rändern beginnend und nach innen gerichtet", () => {
  const c = canvas();
  G.windowRect(c, {}, 330, 358, 64, 38);
  const laengs = c.ops.filter((o) => o.art === "linear");
  assert.equal(laengs.length, 4, "vier Reifbänder, eines je Scheibenrand");
  for (const g of laengs) {
    const laenge = Math.hypot(g.x1 - g.x0, g.y1 - g.y0);
    assert.ok(laenge >= 2.5 && laenge <= 38 * 0.2 + 1e-9, "etwas Reif, nicht die ganze Scheibe");
    assert.ok(g.x0 === 330 || g.x0 === 394 || g.y0 === 358 || g.y0 === 396, "beginnt am Rand");
  }
  const rund = canvas();
  G.roundWindow(rund, {}, 590, 104, 20);
  const rg = rund.ops.find((o) => o.art === "radial");
  assert.ok(rg && rg.r1 === 20 && rg.r0 >= 15 && rg.r0 < 20, "rundes Fenster: Reifring am Rand");
  const tuer = canvas();
  G.haustuer(tuer, {}, 135, 572);
  assert.equal(tuer.ops.filter((o) => o.art === "linear").length, 4, "auch das Fenster in der Haustür");
});

test("Eisblumen bleiben immer auf der Scheibe: Die Zeichnung wird auf die Scheibe begrenzt", () => {
  for (const [w, h] of [[64, 38], [44, 78], [32, 24], [20, 90], [90, 20]]) {
    const c = canvas();
    G.fensterReif(c, 10, 20, w, h, 5);
    assert.deepEqual(c.ops.slice(0, 2), [{ art: "pfadrect", x: 10, y: 20, w, h }, { art: "clip" }], "zuerst wird auf die Scheibe begrenzt");
    for (const o of c.ops) if (o.art === "rect") assert.ok(o.x >= 10 && o.x + o.w <= 10 + w && o.y >= 20 && o.y + o.h <= 20 + h);
    assert.ok(c.ops.filter((o) => o.art === "strich").length >= 18, "Kristallfäden werden gezeichnet");
  }
  const c = canvas();
  G.rundReif(c, 100, 100, 20, 2);
  assert.equal(c.ops[0]?.art, "clip", "rundes Fenster: Begrenzung auf den Kreis");
  for (const o of c.ops) if (o.art === "rect") assert.ok(o.x >= 80 && o.x + o.w <= 120 && o.y >= 80 && o.y + o.h <= 120);
  assert.ok(c.ops.filter((o) => o.art === "strich").length >= 36, "Kristallfäden am runden Fenster");
});

test("Haus ohne Weihnachtsdeko: keine Weihnachtskiste, Fenster und Treppen bleiben", () => {
  const mit = canvas();
  G.drawHouse(mit, {}, { open: 0 }, true, null, false);
  const ohne = canvas();
  G.drawHouse(ohne, {}, { open: 0 }, true, null, false, undefined, false, false, false);
  assert.ok(mit.ops.some((o) => o.art === "text" && o.t === "XMAS"), "im normalen Haus steht die Weihnachtskiste");
  assert.ok(!ohne.ops.some((o) => o.art === "text" && o.t === "XMAS"), "ohne Deko gibt es keine Weihnachtskiste");
  assert.ok(ohne.ops.some((o) => o.art === "rect" && o.x === 737 && o.y === 233), "die Fenster bleiben");
  assert.ok(ohne.ops.some((o) => o.art === "strich" && o.breite === 3.4), "die Treppen bleiben");
});

test("Welten: Das Haus über den Traumstein rechnet wie das normale Haus, nur ohne Weihnachtsdeko", () => {
  const eigenschaft = (welt) => {
    const h = Object.assign(Object.create(G.House.prototype), { welt });
    return { normal: h.istNormalHaus, deko: h.weihnachtsdeko };
  };
  assert.deepEqual(eigenschaft("traum"), { normal: true, deko: false });
  assert.deepEqual(eigenschaft("normal"), { normal: true, deko: true });
  assert.deepEqual(eigenschaft("weihnacht"), { normal: true, deko: true });
  assert.deepEqual(eigenschaft("gruesel"), { normal: false, deko: true });
});

test("Weihnachtshaus: abgestimmte Wandfarben und weiche Badfliesen bleiben auf die Weihnachtswelt beschränkt", () => {
  const winter = canvas();
  G.drawHouse(winter, {}, { open: 0 }, true, null, false, undefined, true);
  const normal = canvas();
  G.drawHouse(normal, {}, { open: 0 }, true, null, false);
  const grusel = canvas();
  G.drawHouse(grusel, {}, { open: 0 }, true, {}, false, undefined, true);
  for (const [name, { grund, bord }] of Object.entries(G.ZIMMER_TAPETEN)) {
    const farbe = name === "badezimmer" ? bord : grund;
    assert.ok(winter.ops.some((o) => o.art === "rect" && o.farbe === farbe), `${name} hat eine Weihnachtstapete`);
    assert.ok(!normal.ops.some((o) => o.art === "rect" && o.farbe === farbe), `${name} im normalen Haus unverändert`);
    assert.ok(!grusel.ops.some((o) => o.art === "rect" && o.farbe === farbe), `${name} im Gruselhaus unverändert`);
  }
  const bad = G.WEIHNACHTS_FARBEN.moebel.bad;
  assert.ok(winter.ops.some((o) => o.art === "rect" && o.farbe === bad.helleFliese && o.w > 12 && o.h > 12));
  assert.ok(winter.ops.some((o) => o.art === "rect" && o.farbe === bad.dunkleFliese && o.w > 12 && o.h > 12));
  assert.ok(grusel.ops.some((o) => o.art === "rect" && o.farbe === "#9a5750"), "das Gruselhaus behält seine Wände");
});

test("Weihnachtshaus: Tannenzweig-Kranz um die Fenster, in den anderen Häusern ohne", () => {
  const mit = canvas();
  G.windowRect(mit, {}, 330, 358, 64, 38, { kranz: true });
  const ohne = canvas();
  G.windowRect(ohne, {}, 330, 358, 64, 38, {});
  assert.ok(mit.ops.length > ohne.ops.length + 150, "der Kranz bringt Nadeln, Lichter, Stern, Schleife, Beeren, Glöckchen und Kugeln");
  assert.ok(mit.ops.some((o) => o.art === "linear"), "die Eisblumen bleiben");
  for (const o of mit.ops) {
    if (o.art === "rect") assert.ok(o.x >= 330 - 10 && o.x + o.w <= 394 + 10.01, "nichts ragt weit in die Wand");
  }
  const rund = canvas();
  G.roundWindow(rund, {}, 590, 104, 20, true);
  const rundOhne = canvas();
  G.roundWindow(rundOhne, {}, 590, 104, 20);
  assert.ok(rund.ops.length > rundOhne.ops.length + 100, "auch das runde Fenster trägt einen Kranz");
  const tuer = canvas();
  G.haustuer(tuer, {}, 135, 572, true);
  const tuerOhne = canvas();
  G.haustuer(tuerOhne, {}, 135, 572);
  assert.ok(tuer.ops.length > tuerOhne.ops.length + 100, "auch die Scheibe der Haustür");
});

test("Gamingzimmer und Treppenhaus: kein sich wiederholendes Streifen- oder Motivmuster", () => {
  for (const zimmer of ["gaming", "gamingRand", "treppenhaus", "schlafzimmer", "wohnzimmer"]) {
    assert.equal(G.ZIMMER_TAPETEN[zimmer].muster, "ruhig");
    const c = canvas();
    G.weihnachtsTapete(c, 100, 260, 60, 190, zimmer);
    assert.ok(!c.ops.some((o) => o.art === "rect" && o.h > 30 && o.w < 30), `${zimmer}: keine durchlaufenden Streifen`);
  }
  assert.equal(G.ZIMMER_TAPETEN.musik.muster, "raute");
  assert.equal(G.ZIMMER_TAPETEN.musik.grund, "#2c4638");
});

test("Der Baum ersetzt Regal und Lampe nur im Weihnachtshaus", () => {
  const winter = canvas();
  const normal = canvas();
  G.drawHouse(winter, {}, { open: 0 }, true, null, false, undefined, true);
  G.drawHouse(normal, {}, { open: 0 }, true, null, false);
  const y = G.FLOOR_Y[1];
  const { wohnzimmerLinks, sofa } = G.WEIHNACHTS_ORTE;
  assert.equal(G.WEIHNACHTSBAUM_X, (wohnzimmerLinks + sofa - 6) / 2);
  assert.ok(winter.ops.some((o) => o.art === "translate" && o.x === G.WEIHNACHTSBAUM_X && o.y === y));
  const regal = (o) => o.art === "rect" && o.x === 258 && o.y === y - 92 && o.w === 32 && o.h === 92;
  const lampe = (o) => o.art === "strich" && o.von[0] === 302 && o.von[1] === y && o.bis[0] === 302 && o.bis[1] === y - 76;
  for (const moebel of [regal, lampe]) {
    assert.ok(normal.ops.some(moebel));
    assert.ok(!winter.ops.some(moebel));
  }
});

test("Die rote Steppdecke und Fellkante bleiben auch beim Auf- und Zudecken erhalten", () => {
  const farbe = G.WEIHNACHTS_FARBEN.decke.flaeche;
  const gefuellt = (c) => c.ops.some((o) => o.art === "linear" && o.stops.includes(farbe));
  for (const phase of ["umschlagen", "setzen", "fuesse", "greifen", "toss", "hinlegen"]) {
    for (const p of [0, 0.5, 1]) {
      const c = canvas();
      G.drawBedEntryBlanket(c, 1, phase, p, true);
      assert.ok(gefuellt(c), `${phase} bei ${p}: Winterstoff`);
      assert.ok(c.ops.some((o) => o.art === "strich" && o.farbe === G.WEIHNACHTS_FARBEN.creme), "helle Kante");
    }
  }
  const c = canvas();
  G.drawBedCloth(c, 320, 281, 0, 1);
  assert.ok(!gefuellt(c), "Standarddecke bleibt unverändert");
});

test("Adventskranz: pro erreichtem Sonntag genau eine zusätzliche Flamme", () => {
  for (let tag = 0; tag <= 4; tag++) {
    const c = canvas();
    G.weihnachtsKerzenflammen(c, 448, 324, 572, 2, tag);
    assert.equal(c.ops.filter((o) => o.art === "radial").length, 2 + tag, "Bad und Keller plus Adventskerzen");
  }
});

console.log(`\n${n} Hausdetails-Tests bestanden.`);
