/* =======================================================================
   Teleflauschi „Flauschi“ – Prüfung
   Zeichnen ohne Fehler, Wii-taugliche Knöpfe, Echtzeit-Pflege ohne Sterben,
   Türchen-Geschenke ohne Hinweis auf das Spiel vor Nikolaus.
   ======================================================================= */
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const b = await build({
  stdin: {
    contents: 'export * from "./flauschi";\nexport * from "./tv";',
    resolveDir: path.resolve("src/game"),
    loader: "ts",
  },
  bundle: true, write: false, platform: "node", format: "esm",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
let n = 0;
const test = (name, run) => { run(); n++; console.log(`OK  ${name}`); };

function canvas() {
  const ops = [], stack = [];
  let pfad = [];
  const m = {
    fillStyle: "#000", strokeStyle: "#000", globalAlpha: 1, lineWidth: 1, lineCap: "butt",
    font: "", textAlign: "left", textBaseline: "alphabetic",
    save() { stack.push([this.fillStyle, this.strokeStyle, this.globalAlpha]); },
    restore() { const s = stack.pop(); if (s) [this.fillStyle, this.strokeStyle, this.globalAlpha] = s; },
    beginPath() { pfad = []; },
    moveTo(x, y) { pfad.push([x, y]); },
    lineTo(x, y) { pfad.push([x, y]); },
    quadraticCurveTo(...p) { pfad.push(p); },
    bezierCurveTo(...p) { pfad.push(p); },
    closePath() { pfad.push(["zu"]); },
    roundRect(x, y, w, h) { pfad.push([x, y, w, h]); },
    rect(x, y, w, h) { pfad.push([x, y, w, h]); },
    arc(x, y, r) { pfad.push([x, y, r]); },
    ellipse(...p) { pfad.push(p); },
    fill() { ops.push({ art: "fill", farbe: this.fillStyle, pfad: [...pfad] }); },
    stroke() { ops.push({ art: "stroke", farbe: this.strokeStyle, pfad: [...pfad] }); },
    fillRect(x, y, w, h) { ops.push({ art: "rect", farbe: this.fillStyle, x, y, w, h }); },
    fillText(text, x, y) { ops.push({ art: "text", text, x, y }); },
    measureText(text) { return { width: text.length * 6 }; },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  return { ops, ctx: new Proxy(m, { get(o, k) { return k in o ? o[k] : () => {}; } }) };
}

const offen = (bis) => Array.from({ length: bis }, (_, i) => i + 1);
const zustand = (frei = {}) => Object.assign(G.neuerFlauschiStand(), { phase: 3, ausgepackt: offen(24) }, frei);

test("Szene, Balken, Knöpfe und Hülle malen ohne Fehler", () => {
  const faelle = [
    zustand(),
    zustand({ schlaf: true }),
    zustand({ aktion: "fuettern", aktionT: 2 }),
    zustand({ aktion: "streicheln", aktionT: 2, funken: 3 }),
    zustand({ aktion: "spielen", aktionT: 2 }),
    zustand({ zucker: 4, punkte: 42, hunger: 11 }),
  ];
  for (const z of faelle) {
    for (const [w, h] of [[720, 300], [54, 34], [40, 26]]) {
      const c = canvas();
      G.drawFlauschiSzene(c.ctx, 0, 0, w, h, 3.2, z, offen(24));
      assert.ok(c.ops.length > 40, "die Szene malt wirklich");
    }
    const c = canvas();
    G.drawFlauschi(c.ctx, 100, 200, 1.8, 4.5, z);
    assert.ok(c.ops.length > 20, "Flauschi malt");
    G.drawFlauschiHud(c.ctx, 0, 0, 720, z);
    G.drawFlauschiKnoepfe(c.ctx, z, "fuettern", "spielen", false);
    G.drawFlauschiGeschenke(c.ctx, 0, 0, 500, 96, offen(24));
    G.drawFlauschiHuelle(c.ctx, 10, 10, 6, 11, 2);
  }
  const c = canvas();
  G.drawFlauschiHud(c.ctx, 0, 0, 720, zustand());
  for (const marke of ["HUNGER", "MÜDIGKEIT", "SAUBERKEIT", "BESCHÄFTIGT", "FLOCKEN"]) {
    assert.ok(c.ops.some(o => o.art === "text" && o.text === marke), `Balken ${marke}`);
  }
});

test("Pflegeknöpfe sind Wii-tauglich, getrennt und im sicheren Bereich", () => {
  assert.equal(G.FLAUSCHI_KNOEPE.length, 4);
  for (const k of G.FLAUSCHI_KNOEPE) {
    assert.ok(k.w >= 24 && k.h >= 24, `${k.id} zu klein`);
    assert.ok(k.x >= 96 && k.x + k.w <= 864 && k.y >= 30 && k.y + k.h <= 570, `${k.id} außerhalb`);
    assert.equal(G.flauschiKnopfBei(k.x + k.w / 2, k.y + k.h / 2).id, k.id);
    for (const anderes of G.FLAUSCHI_KNOEPE) if (anderes !== k) {
      assert.ok(k.x + k.w <= anderes.x || anderes.x + anderes.w <= k.x || k.y + k.h <= anderes.y || anderes.y + anderes.h <= k.y);
    }
  }
  assert.equal(G.flauschiKnopfBei(900, 60), null);
  const b = G.FLAUSCHI_ZURUECK;
  assert.ok(b.w >= 24 && b.h >= 24 && b.x >= 96 && b.x + b.w <= 864 && b.y + b.h <= 570);
});

test("Echtzeit-Pflege: Bedürfnisse sinken, Flauschi schläft ein, aber nie stirbt", () => {
  const z = G.neuerFlauschiStand();
  const t0 = Date.UTC(2026, 5, 1, 10);
  z.letzte = t0;
  const start = { ...z };
  G.flauschiTick(z, t0 + 60 * 60 * 1000);        // eine Stunde weg
  assert.ok(z.hunger < start.hunger, "Hunger sinkt in Echtzeit");
  assert.ok(z.beschaeftigt < start.beschaeftigt, "Langeweile wächst");
  assert.ok(z.muede > start.muede, "Müdigkeit steigt im Wachzustand");
  assert.equal(z.schlaf, false, "nach einer Stunde schläft sie noch nicht");

  G.flauschiTick(z, t0 + 40 * 60 * 60 * 1000);   // zwei Tage nicht hingeschaut
  assert.ok(z.hunger === 0 || z.hunger <= 12, "Hunger ist leer");
  assert.equal(z.schlaf, true, "Flauschi schläft einfach, sie stirbt nicht");
  assert.equal(typeof z.punkte, "number", "kein Game Over, der Stand bleibt erhalten");
  assert.equal(z.aktion, null, "kein Verlust, nur Schlaf");

  G.flauschiTick(z, t0 + 44 * 60 * 60 * 1000);   // weiter geschlafen
  assert.equal(z.muede, 0, "Schlaf baut die Müdigkeit bis null ab");
});

test("Vier Aktionen heben die Bedürtnisse und geben Flocken", () => {
  const z = G.neuerFlauschiStand();
  z.phase = 3;
  z.hunger = 10; z.sauber = 10; z.beschaeftigt = 10; z.schlaf = true;
  const t = Date.now();
  assert.ok(G.flauschiAktion(z, "fuettern", t) > 0);
  assert.ok(z.hunger > 40, "Plätzchen sättigt");
  assert.equal(z.schlaf, false, "Flauschi wacht auf, wenn man sie füttert");
  const sauberVorher = z.sauber;
  G.flauschiAktion(z, "streicheln", t);
  assert.ok(z.sauber > sauberVorher + 20, "Bürsten putzt");
  assert.ok(z.funken > 0, "Fusselkugel wird statisch aufgeladen");
  const muedeVorher = z.muede;
  G.flauschiAktion(z, "spielen", t);
  assert.ok(z.muede > muedeVorher, "Spielen macht müder");
  assert.ok(z.punkte >= 15, "Flocken sammeln sich");
  G.flauschiAktion(z, "schlafen", Date.now());
  assert.equal(z.schlaf, true, "Schlafen schaltet um");
});

test("Müdigkeit beginnt bei null und löst erst bei 100 Prozent Schlaf aus", () => {
  const z = G.neuerFlauschiStand();
  const t0 = Date.UTC(2026, 5, 1, 10);
  z.letzte = t0;
  assert.equal(z.muede, 0, "ein neues Flauschi ist ausgeruht");
  G.flauschiTick(z, t0);
  assert.equal(z.schlaf, false, "null Müdigkeit ist kein Schlafgrund");
  z.muede = 99.9;
  G.flauschiTick(z, t0);
  assert.equal(z.schlaf, false, "unter 100 noch wach, solange die übrigen Bedürfnisse erfüllt sind");
  G.flauschiTick(z, t0 + 60_000);
  assert.equal(z.muede, 100, "Müdigkeit erreicht höchstens 100");
  assert.equal(z.schlaf, true, "bei voller Müdigkeit schläft Flauschi ein");
});

test("Schlaf senkt Müdigkeit, ohne unter null zu fallen", () => {
  const t0 = Date.UTC(2026, 5, 1, 10);
  const z = zustand({ letzte: t0, muede: 75, schlaf: true });
  G.flauschiTick(z, t0 + 3_600_000);
  assert.equal(z.muede, 25, "eine Stunde Schlaf erholt um 50 Prozentpunkte");
  G.flauschiTick(z, t0 + 2 * 3_600_000);
  assert.equal(z.muede, 0);
  assert.equal(z.schlaf, true, "Flauschi darf ausgeruht weiterschlafen");
});

test("Spielen bis 100 Prozent lässt Flauschi einschlafen, ohne Punkteverlust", () => {
  const t0 = Date.UTC(2026, 5, 1, 10);
  const z = zustand({ letzte: t0, muede: 95, punkte: 20 });
  assert.equal(G.flauschiAktion(z, "spielen", t0), 6);
  assert.equal(z.muede, 100);
  assert.equal(z.schlaf, true);
  assert.equal(z.punkte, 26, "die letzte Spielaktion zählt weiterhin");
});

test("Alte Energiewerte werden genau einmal in Müdigkeit umgerechnet", () => {
  const alt = { ...G.neuerFlauschiStand(), muede: 86, punkte: 42, schlaf: true };
  delete alt.muedeVersion;
  const neu = G.leseFlauschiStand(alt);
  assert.equal(neu.muede, 14, "86 Energie entspricht 14 Müdigkeit");
  assert.equal(neu.muedeVersion, 2);
  assert.equal(neu.punkte, 42);
  assert.equal(neu.schlaf, true);
  assert.equal(neu.letzte, alt.letzte);
  assert.equal(alt.muede, 86, "der gelesene Altstand wird nicht verändert");
  assert.deepEqual(G.leseFlauschiStand(JSON.parse(JSON.stringify(neu))), neu,
    "erneutes Laden dreht den Wert nicht noch einmal um");
  for (const [energie, muede] of [[100, 0], [0, 100], [120, 0], [-5, 100]]) {
    assert.equal(G.leseFlauschiStand({ ...alt, muede: energie }).muede, muede);
  }
  for (const muede of [undefined, null, NaN, Infinity, "86"]) {
    assert.equal(G.leseFlauschiStand({ muede }).muede, 0, "ungültiger Altwert wird ausgeruht ersetzt");
  }
});

test("Müdigkeitsbalken zeigt null, halbe und volle Füllung mit Prozentangabe", () => {
  for (const wert of [0, 50, 99.9, 100]) {
    const c = canvas();
    G.drawFlauschiHud(c.ctx, 120, 312, 720, zustand({ muede: wert }));
    assert.ok(c.ops.some(o => o.art === "text" && o.text === `${Math.floor(wert)}%`));
    const fuellung = c.ops.filter(o => o.art === "fill" && o.farbe === "#7aa2e8");
    if (wert === 0) assert.equal(fuellung.length, 0, "ausgeruht ist der Balken leer");
    else assert.ok(Math.abs(fuellung[0].pfad[0][2] - 128 * wert / 100) < 0.001);
  }
});

test("Müdigkeit verwendet Berlin unabhängig von der Gerätezeitzone", () => {
  const tz = process.env.TZ;
  try {
    for (const zone of ["UTC", "Pacific/Honolulu", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      for (const [stundeUTC, erwartung] of [[11, 100 / 9], [22, 25]]) {
        const t0 = Date.UTC(2026, 0, 10, stundeUTC);
        const z = zustand({ letzte: t0 });
        G.flauschiTick(z, t0 + 3_600_000);
        assert.ok(Math.abs(z.muede - erwartung) < 0.0001, `${zone}: Berliner Tag-/Nachtrate`);
      }
    }
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});

test("Türchen 6 bringt Flauschi, davor bleiben die Geschenke ohne Spielhinweis", () => {
  assert.equal(G.flauschiVersprochen([1, 2, 3, 4, 5], true), false, "ohne Nikolaus kein Modul");
  assert.equal(G.flauschiVersprochen([6], true), true);
  assert.equal(G.flauschiVersprochen([], false), true, "Prototyp: alle Türchen frei, Modul ist da");
  const ersteFuenf = G.FLAUSCHI_GESCHENKE.filter(g => g.tuer <= 5);
  assert.equal(ersteFuenf.length, 5);
  for (const g of ersteFuenf) {
    assert.ok(g.name.length > 3 && g.funktion.length > 3, `Türchen ${g.tuer} hat Name und Funktion`);
    const text = `${g.name} ${g.funktion}`.toLowerCase();
    assert.ok(!text.includes("flocke") && !text.includes("teleflauschi") && !text.includes("tamagotchi"),
      `Türchen ${g.tuer} verrät das Spiel nicht`);
  }
  const nikolaus = G.FLAUSCHI_GESCHENKE.find(g => g.tuer === 6);
  assert.ok(nikolaus.name.includes("Nikolaus") && nikolaus.funktion.includes("Ei"));
  assert.equal(G.flauschiGeschenke([6, 7]).length, 2, "nur offene Türchen zählen");
});

test("Der Programmplatz erscheint nur mit eingestecktem Modul", () => {
  assert.deepEqual(G.tvKanaele("tv_d", false), ["garten", "musik", "konsole"]);
  assert.deepEqual(G.tvKanaele("tv_d", true), ["garten", "musik", "konsole", "gol"]);
  assert.ok(G.tvKanaele("tv_d", false, true).includes("flauschi"));
  assert.ok(!G.tvKanaele("tv_e", false, true).includes("flauschi"), "Wohnzimmer-TV bleibt ohne");
  assert.equal(G.tvNaechsterKanal("tv_d", "konsole", 1, false, true), "flauschi");
  assert.equal(G.TV_KANAL_NAMEN.flauschi, "Teleflauschi");
});

test("Flauschi ist leicht violett, der Baum unten breit und die Wand ohne Streifen", () => {
  const f = canvas();
  G.drawFlauschi(f.ctx, 100, 200, 1.8, 4.5, zustand());
  const farben = new Set(f.ops.map(o => o.farbe));
  assert.ok(farben.has("#cbb6f1") && farben.has("#8a6cc6"), "violettes Fell in mehreren Lagen");
  assert.ok(farben.has("#b03a30") && farben.has("#f7f4ec"), "rote Mütze mit weißem Rand setzt sich ab");
  assert.ok(f.ops.filter(o => o.art === "stroke").length > 70, "feine Härchen ringsum");

  const c = canvas();
  G.drawFlauschiSzene(c.ctx, 0, 0, 720, 300, 3.2, zustand(), offen(24));
  assert.ok(!c.ops.some(o => o.farbe === "rgba(255,255,255,.045)"), "keine weißen Wandstreifen mehr");
  const breite = (farbe) => {
    const dreieck = c.ops.find(o => o.art === "fill" && o.farbe === farbe);
    assert.ok(dreieck, `Baumstufe ${farbe} wird gemalt`);
    return dreieck.pfad[1][0] - dreieck.pfad[0][0];
  };
  assert.ok(breite("#1f4a33") > breite("#256044"), "Baum unten breiter als in der Mitte");
  assert.ok(breite("#256044") > breite("#2e7a52"), "Baum oben schmaler als in der Mitte");
});

test("Weihnachtsmütze: ein roter Kegel mit einem Zipfel, durchgehender Fellrand, eine Bommel", () => {
  for (const z of [zustand(), zustand({ schlaf: true })]) {
    const c = canvas();
    G.drawFlauschi(c.ctx, 100, 200, 1.8, 4.5, z);
    const rot = c.ops.filter(o => o.art === "fill" && o.farbe === "#b03a30");
    assert.equal(rot.length, 1, "die Mütze ist genau eine rote Fläche");
    assert.ok(!c.ops.some(o => o.farbe === "rgba(232,194,90,.75)"), "kein Goldstreifen mehr");
    // Fellrand: zehn gleich große Kreise in gleichmäßigem Abstand = ein Band, keine drei Büschel.
    const weiss = c.ops.filter(o => o.art === "fill" && o.farbe === "#f7f4ec" && o.pfad.length === 1);
    const rand = weiss.slice(0, 10).map(o => o.pfad[0]);
    assert.equal(rand.length, 10);
    assert.ok(rand.every(p => Math.abs(p[2] - rand[0][2]) < 1e-9), "alle Randkreise gleich groß");
    const schritte = rand.slice(1).map((p, i) => p[0] - rand[i][0]);
    assert.ok(schritte.every(d => Math.abs(d - schritte[0]) < 1e-9 && d < rand[0][2] * 2),
      "gleichmäßig und überlappend");
    // Der Kegel endet in einem einzigen Zipfel rechts außen, dort sitzt die Bommel.
    const kegel = rot[0].pfad;
    const zipfel = kegel[2];
    assert.ok(zipfel[4] > rand[9][0], "der Zipfel fällt seitlich über den Rand hinaus");
    assert.ok(weiss.length >= 19, "Rand (10) und Bommel (9) in Weiß");
  }
});

const frei = (a, b) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
const T0 = Date.UTC(2026, 5, 1, 10);

test("Flauschi ist anklickbar: fünf Stellen an ihr selbst, groß genug und im sicheren Bereich", () => {
  const eigene = G.FLAUSCHI_ZONEN.slice(0, 5);
  assert.deepEqual(eigene.map(z => z.id), ["kraulen", "kitzeln", "nase", "pfote", "bommel"]);
  assert.deepEqual(eigene.map(z => z.label),
    ["Flauschi streicheln", "Flauschi kitzeln", "Nase stupsen", "Pfötchen geben", "Bommel anstupsen"]);
  for (const z of G.FLAUSCHI_ZONEN) {
    assert.ok(z.w >= 24 && z.h >= 24, `${z.id} zu klein`);
    assert.ok(z.x >= 96 && z.x + z.w <= 864 && z.y >= 30 && z.y + z.h <= 570, `${z.id} außerhalb`);
    assert.ok(z.y + z.h <= 52 + 300 - 40, `${z.id} liegt über dem Balken-Interface`);
    for (const k of G.FLAUSCHI_KNOEPE) assert.ok(frei(z, k), "kein Knopf verdeckt");
  }
  const [kopf, bauch, nase, pfote, bommel] = eigene;
  assert.equal(kopf.y + kopf.h, bauch.y, "Kopf und Bauch grenzen lückenlos aneinander");
  // Bei Überlappung gewinnt die kleinere Fläche: Nase und Pfoten liegen auf Kopf/Bauch.
  assert.equal(G.flauschiZoneBei(nase.x + nase.w / 2, nase.y + nase.h / 2).id, "nase");
  assert.equal(G.flauschiZoneBei(pfote.x + 4, pfote.y + pfote.h - 3).id, "pfote");
  assert.equal(G.flauschiZoneBei(bommel.x + bommel.w / 2, bommel.y + bommel.h / 2).id, "bommel");
  assert.equal(G.flauschiZoneBei(kopf.x + 6, kopf.y + 20).id, "kraulen");
  assert.equal(G.flauschiZoneBei(kopf.x + 4, bauch.y + 4).id, "kitzeln");
  assert.equal(G.flauschiZoneBei(kopf.x - 3, kopf.y + 5), null);
  assert.equal(G.flauschiZoneBei(700, 190), null, "leere Wand");
});

test("Sechzehn Gegenstände: Grundausstattung 1–5, Rest nach Nikolaus, überschneidungsfrei", () => {
  assert.equal(G.FLAUSCHI_DINGE.length, 16);
  assert.deepEqual(G.FLAUSCHI_DINGE.slice(0, 5).map(d => d.tuer), [1, 2, 3, 4, 5], "Grundausstattung in den Türchen 1–5");
  assert.ok(G.FLAUSCHI_DINGE.slice(5).every(d => d.tuer > 6), "die übrigen kommen nach dem Spiel");
  const zonen = G.FLAUSCHI_ZONEN.slice(5);
  assert.deepEqual(zonen.map(z => z.id), G.FLAUSCHI_DINGE.map(d => d.id));
  const bereit = zustand();
  for (const d of G.FLAUSCHI_DINGE) {
    assert.ok(d.label.length > 3 && d.dauer > 1 && d.klang.length > 0, `${d.id} hat Namen, Dauer und Klang`);
    assert.ok(G.FLAUSCHI_GESCHENKE.some(g => g.tuer === d.tuer), `${d.id} gehört zu Türchen ${d.tuer}`);
    assert.equal(G.flauschiZoneBei(120 + d.x + d.w / 2, 52 + d.y + d.h / 2, offen(24), bereit).id, d.id);
  }
  assert.equal(new Set(G.FLAUSCHI_DINGE.map(d => d.tuer)).size, 16, "jedes Türchen bringt genau einen Gegenstand");
  for (const a of zonen) for (const b of zonen) if (a !== b) assert.ok(frei(a, b), `${a.id} / ${b.id} überlappen`);
  const blech = G.FLAUSCHI_DINGE.find(d => d.id === "blech");
  assert.equal(G.FLAUSCHI_VORSCHAU_ALLE, false, "keine Vorschau: Gegenstände kommen nur über Türchen");
  assert.equal(G.flauschiDingDa(blech, []), false, "ohne Türchen ist nichts da");
  assert.equal(G.flauschiDingDa(blech, [blech.tuer]), true);
  assert.equal(G.FLAUSCHI_LIED.length, 15, "erste Zeile von O Tannenbaum");
  assert.ok(!JSON.stringify(G.FLAUSCHI_GESCHENKE).toLowerCase().includes("kamin"), "kein Kamin");
});

test("Streicheln und Kitzeln: Wirkung, keine Klick-Schleife, sanft im Schlaf", () => {
  const z = zustand({ letzte: T0, beschaeftigt: 50, muede: 10 });
  assert.equal(G.flauschiBeruehren(z, "kraulen", T0), 2);
  assert.equal(z.aktion, "kraulen");
  assert.equal(z.beschaeftigt, 58);
  assert.equal(z.punkte, 2);
  assert.equal(G.flauschiBeruehren(z, "kraulen", T0 + 500), 0, "Weiterkraulen gibt keine Flocken");
  assert.ok(z.aktionT > 2, "die Bewegung wird nur verlängert");
  G.flauschiTick(z, T0 + 4000);
  assert.equal(z.aktion, null, "nach dem Ausklingen ist Flauschi wieder ruhig");
  assert.equal(G.flauschiBeruehren(z, "kraulen", T0 + 4000), 2, "danach zählt es wieder");
  const muedeVorher = z.muede;
  assert.equal(G.flauschiBeruehren(z, "kitzeln", T0 + 4000), 3);
  assert.ok(Math.abs(z.muede - (muedeVorher + 3)) < 1e-9, "Kichern macht ein wenig müde");
  for (const art of ["nase", "pfote", "bommel"]) {
    const n = zustand({ letzte: T0, beschaeftigt: 50 });
    assert.equal(G.flauschiBeruehren(n, art, T0), 2, `${art} gibt Flocken`);
    assert.equal(n.aktion, art);
    assert.ok(n.beschaeftigt > 50);
    assert.ok(G.flauschiKlang(n, art).length > 0, `${art} hat einen Klang`);
  }
  const fast = zustand({ letzte: T0, muede: 98 });
  G.flauschiBeruehren(fast, "kitzeln", T0);
  assert.equal(fast.schlaf, true, "bei 100 Prozent schläft sie ein – nie mehr als das");
  assert.equal(G.leseFlauschiStand({ ...z, aktion: "bahn" }).aktion, "bahn", "Speicherstand kennt Berührungen und Gegenstände");
  assert.equal(G.leseFlauschiStand({ ...z, aktion: "unsinn" }).aktion, null);
});

test("Gegenstände wirken auf die Bedürfnisse – ohne Klick-Schleife", () => {
  const frisch = () => zustand({ letzte: T0, hunger: 50, muede: 10, sauber: 40, beschaeftigt: 30 });
  let z = frisch();
  assert.equal(G.flauschiBeruehren(z, "wanne", T0, offen(24)), 4);
  assert.equal(z.sauber, 85, "Schaumbad macht sauber");
  assert.equal(z.aktion, "wanne");
  assert.equal(G.flauschiBeruehren(z, "wanne", T0 + 300, offen(24)), 0, "noch einmal klicken gibt nichts extra");
  z = frisch(); G.flauschiBeruehren(z, "grammophon", T0, offen(24));
  assert.equal(z.beschaeftigt, 52); assert.equal(z.muede, 12);
  assert.equal(G.flauschiKlang(z, "grammophon"), G.FLAUSCHI_LIED, "das Grammophon spielt das Lied");
  z = frisch(); G.flauschiBeruehren(z, "nussknacker", T0, offen(24)); assert.equal(z.hunger, 62);
  z = frisch(); G.flauschiBeruehren(z, "bahn", T0, offen(24)); assert.equal(z.beschaeftigt, 60);
  z = frisch(); G.flauschiBeruehren(z, "pferd", T0, offen(24)); assert.equal(z.beschaeftigt, 54);
  z = frisch(); G.flauschiBeruehren(z, "schneekugel", T0, offen(24)); assert.equal(z.muede, 18, "Schneegestöber macht schläfrig");
  z = frisch(); G.flauschiBeruehren(z, "fernseher", T0, offen(24)); assert.equal(z.beschaeftigt, 46);

  // Blech: backen füllt den Vorrat, ein frisches Plätzchen sättigt mehr.
  z = frisch(); assert.equal(G.flauschiBeruehren(z, "blech", T0, offen(24)), 4);
  assert.equal(z.vorrat, 3);
  G.flauschiAktion(z, "fuettern", T0);
  assert.equal(z.vorrat, 2); assert.equal(z.hunger, 98);
  const ohne = frisch(); G.flauschiAktion(ohne, "fuettern", T0);
  assert.equal(ohne.hunger, 88, "ohne Vorrat bleibt es beim gewohnten Plätzchen");
  z.vorrat = 5; z.aktion = null; z.aktionT = 0; G.flauschiBeruehren(z, "blech", T0, offen(24));
  assert.equal(z.vorrat, 6, "höchstens sechs Plätzchen auf dem Blech");

  // Baum: eine Kugel pro Klick, höchstens so viele wie Türchen.
  z = frisch(); assert.equal(G.flauschiBeruehren(z, "baum", T0, offen(24)), 3);
  assert.equal(z.kugeln, 1);
  const voll = G.flauschiKugelMax(offen(24));
  z.kugeln = voll; z.aktion = null; z.aktionT = 0;
  assert.equal(G.flauschiBeruehren(z, "baum", T0, offen(24)), 0, "voller Baum: nur bewundern");
  assert.equal(z.kugeln, voll);
  assert.ok(G.flauschiKugelMax(offen(24)) === 24 && voll <= 24);

  // Kranz: an und wieder aus.
  z = frisch(); assert.equal(G.flauschiBeruehren(z, "kranz", T0, offen(24)), 2);
  assert.equal(z.kerzen, true);
  z.aktion = null; z.aktionT = 0;
  assert.equal(G.flauschiBeruehren(z, "kranz", T0, offen(24)), 0);
  assert.equal(z.kerzen, false);
});

test("Schlafende Flauschi: zudecken statt wecken, Glöckchen weckt sanft, Gegenstände warten", () => {
  const s = zustand({ letzte: T0, schlaf: true, muede: 60, punkte: 5 });
  assert.equal(G.flauschiBeruehren(s, "kraulen", T0), 0);
  assert.equal(s.schlaf, true, "Kopf antippen weckt nie");
  assert.equal(s.decke, true, "sondern deckt sie zu");
  assert.equal(s.punkte, 5);
  assert.ok(G.flauschiKlang(s, "kraulen").length > 0);
  G.flauschiTick(s, T0 + 1_800_000);
  assert.ok(Math.abs(s.muede - 22.5) < 1e-6, "zugedeckt ruht sie anderthalbmal so schnell");
  const ohneDecke = zustand({ letzte: T0, schlaf: true, muede: 60 });
  G.flauschiTick(ohneDecke, T0 + 1_800_000);
  assert.ok(Math.abs(ohneDecke.muede - 35) < 1e-6);

  assert.equal(G.flauschiBeruehren(s, "grammophon", T0 + 1_800_000, offen(24)), 0);
  assert.notEqual(s.aktion, "grammophon", "Gegenstände warten, bis sie wach ist");
  assert.equal(s.schlaf, true);
  assert.deepEqual(G.flauschiKlang(s, "grammophon"), []);
  G.flauschiBeruehren(s, "kranz", T0 + 1_800_000, offen(24));
  assert.equal(s.kerzen, true, "der Kranz geht auch neben der Schlafenden an");
  assert.equal(s.schlaf, true);

  assert.equal(G.flauschiBeruehren(s, "gloeckchen", T0 + 1_800_000, offen(24)), 2);
  assert.equal(s.schlaf, false, "das Glöckchen weckt sanft");
  G.flauschiTick(s, T0 + 1_800_000);
  assert.equal(s.decke, false, "wach liegt die Decke nicht mehr auf");

  const muede = zustand({ letzte: T0, schlaf: true, muede: 100, punkte: 9 });
  assert.equal(G.flauschiBeruehren(muede, "gloeckchen", T0, offen(24)), 0);
  assert.equal(muede.schlaf, true, "todmüde bleibt sie liegen");
  assert.equal(G.flauschiBeruehren(muede, "kitzeln", T0), 0);
  assert.equal(muede.schlaf, true);
  assert.equal(muede.punkte, 9);
  const wecken = zustand({ letzte: T0, schlaf: true, muede: 40 });
  assert.equal(G.flauschiBeruehren(wecken, "kitzeln", T0), 3);
  assert.equal(wecken.schlaf, false, "Kitzeln weckt eine ausgeruhte Flauschi");
});

test("Gedrückt halten: langes Kraulen macht Flauschi schläfrig", () => {
  const z = zustand({ letzte: T0, muede: 20, beschaeftigt: 30 });
  G.flauschiKraulenHalten(z, 1);
  assert.equal(z.muede, 20, "ohne laufendes Kraulen passiert nichts");
  G.flauschiBeruehren(z, "kraulen", T0);
  for (let i = 0; i < 100; i++) { z.aktionT = Math.max(0, z.aktionT - 0.1); G.flauschiKraulenHalten(z, 0.1); }
  assert.ok(Math.abs(z.muede - 45) < 1e-6, "zehn Sekunden kraulen: 20 -> 45 Prozent");
  assert.ok(z.aktion === "kraulen" && z.aktionT > 0.5, "die Bewegung läuft weiter");
  for (let i = 0; i < 300; i++) G.flauschiKraulenHalten(z, 0.1);
  assert.equal(z.muede, 100);
  assert.equal(z.schlaf, true, "sie schläft unter der Hand ein");
});

test("Adventskranz zählt die echten Adventssonntage in Berlin", () => {
  // 2026: Heiligabend ist ein Donnerstag -> 4. Advent 20.12., 1. Advent 29.11.
  const tag = (m, d) => Date.UTC(2026, m - 1, d, 12);
  assert.equal(G.adventsKerzen(tag(11, 28), true), 0);
  assert.equal(G.adventsKerzen(tag(11, 29), true), 1);
  assert.equal(G.adventsKerzen(tag(12, 5), true), 1);
  assert.equal(G.adventsKerzen(tag(12, 6), true), 2);
  assert.equal(G.adventsKerzen(tag(12, 13), true), 3);
  assert.equal(G.adventsKerzen(tag(12, 20), true), 4);
  assert.equal(G.adventsKerzen(tag(12, 31), true), 4);
  assert.equal(G.adventsKerzen(tag(6, 1), true), 0, "im Sommer brennt nichts");
  assert.equal(G.adventsKerzen(tag(6, 1), false), 4, "Prototyp: alle vier");
  // 2023: Heiligabend ist ein Sonntag und zugleich der 4. Advent.
  assert.equal(G.adventsKerzen(Date.UTC(2023, 11, 23, 12), true), 3);
  assert.equal(G.adventsKerzen(Date.UTC(2023, 11, 24, 12), true), 4);
  // 28.11.2026 23:30 UTC ist in Berlin schon der 29.11. – der erste Advent.
  assert.equal(G.adventsKerzen(Date.UTC(2026, 10, 28, 23, 30), true), 1);
});

test("Alles malt ohne Fehler – groß und winzig, wach und schlafend; Schilder statt Rahmen", () => {
  for (const { id } of G.FLAUSCHI_ZONEN) for (const schlaf of [false, true]) for (const teil of [0.05, 0.5, 0.95]) {
    const z = zustand({ aktion: id, aktionT: G.flauschiDauer(id) * (1 - teil), schlaf, decke: schlaf, kugeln: 7, vorrat: 4, kerzen: true });
    for (const [w, h] of [[720, 300], [54, 34]]) {
      const c = canvas();
      G.drawFlauschiSzene(c.ctx, 0, 0, w, h, 2.7, z, offen(24));
      assert.ok(c.ops.length > 300, `${id} malt`);
    }
  }
  const herzen = canvas();
  G.drawFlauschi(herzen.ctx, 100, 200, 1.8, 4.5, zustand({ aktion: "kraulen", aktionT: 1.4 }));
  assert.ok(herzen.ops.some(o => o.farbe === "#f08a9c"), "Herzchen beim Kraulen");
  const decke = canvas();
  G.drawFlauschi(decke.ctx, 100, 200, 1.8, 4.5, zustand({ schlaf: true, decke: true }));
  assert.ok(decke.ops.some(o => o.farbe === "#2f6b4a"), "Minidecke im Schlaf");

  const c = canvas();
  G.drawFlauschiZonen(c.ctx, null, null);
  assert.equal(c.ops.length, 0, "ohne Zeiger und Fokus bleibt alles frei");
  G.drawFlauschiZonen(c.ctx, "kitzeln", "grammophon");
  assert.ok(!c.ops.some(o => o.art === "stroke"), "kein Rahmen: die Klickflächen bleiben unsichtbar");
  for (const text of ["Flauschi kitzeln", "Grammophon"]) {
    assert.ok(c.ops.some(o => o.art === "text" && o.text === text), `Schild „${text}“`);
  }
  const schild = c.ops.filter(o => o.art === "fill" && o.farbe === "rgba(8,20,26,.88)");
  assert.ok(schild.length === 2 && schild.every(o => o.pfad[0][3] === 20), "Schildhöhe exakt 20");
  const eins = canvas();
  G.drawFlauschiZonen(eins.ctx, "nase", "kraulen");
  assert.equal(eins.ops.filter(o => o.art === "text").length, 1, "an Flauschi selbst zeigt nur ein Schild");
});

test("Wachstum: aus dem Ei schlüpft Flauschi, Zuwendung lässt sie wachsen – ohne Zeitdruck", () => {
  const z = G.neuerFlauschiStand();
  assert.equal(z.phase, 0, "alles beginnt mit dem Ei");
  assert.equal(G.flauschiAktion(z, "fuettern", T0), 1, "im Ei zählt Wärme statt Futter");
  assert.equal(z.aktion, "waermen");
  assert.equal(z.wachstum, 1);
  z.aktion = null; z.aktionT = 0;
  G.flauschiBeruehren(z, "kraulen", T0);
  assert.equal(z.wachstum, 2);
  z.aktion = null; z.aktionT = 0;
  assert.equal(G.flauschiBeruehren(z, "grammophon", T0, offen(24)), 0, "Gegenstände warten bis nach dem Schlüpfen");
  G.flauschiAktion(z, "spielen", T0);
  assert.equal(z.phase, 1, "nach drei Wärmungen schlüpft sie");
  assert.ok(z.sticker.includes("schluepfen"));
  // Wachstum verfällt nie: Auch nach Tagen bleibt die Phase gleich.
  G.flauschiTick(z, T0 + 5 * 24 * 3_600_000);
  assert.equal(z.phase, 1, "kein Zeitdruck, kein Rückschritt");
  z.wachstum = 21; z.aktion = null; z.aktionT = 0;
  G.flauschiAktion(z, "spielen", T0 + 5 * 24 * 3_600_000);
  assert.equal(z.phase, 3, "mit 22 Zuwendungen ist sie erwachsen");
  assert.ok(z.sticker.includes("erwachsen"));
  assert.deepEqual(G.FLAUSCHI_SCHWELLEN, [3, 10, 22]);
});

test("Pakete: Türchen-Geschenke liegen im Zimmer und werden angeklickt ausgepackt", () => {
  const z = zustand({ ausgepackt: [] });
  assert.deepEqual(G.flauschiPakete([3, 1, 7, 6, 2], z), [1, 2, 3, 7], "Türchen 6 ist das Spiel selbst, kein Paket");
  assert.equal(G.flauschiBeruehren(z, "napf", T0, [1]), 0, "im Paket ist der Napf noch nicht nutzbar");
  assert.equal(G.flauschiAuspacken(z, [1]), 1);
  assert.ok(z.ausgepackt.includes(1));
  assert.equal(z.punkte, 3, "Auspacken gibt Flocken");
  assert.ok(z.sticker.includes("paket"));
  assert.equal(G.flauschiAuspacken(z, []), null, "ohne offenes Türchen kein Paket");
  const hungerVorher = z.hunger;
  assert.ok(G.flauschiBeruehren(z, "napf", T0, [1]) > 0, "ausgepackt lässt sich der Napf nutzen");
  assert.ok(z.hunger > hungerVorher);
  // Zonen folgen dem Stand: Paket zuerst, Gegenstände erst nach dem Auspacken.
  const leer = zustand({ ausgepackt: [] });
  assert.equal(G.flauschiZonen([1], leer)[0].id, "paket");
  assert.ok(!G.flauschiZonen([1], leer).some(zone => zone.id === "napf"));
  assert.ok(G.flauschiZonen(offen(24), zustand()).some(zone => zone.id === "napf"));
  assert.ok(!G.flauschiZonen(offen(24), zustand()).some(zone => zone.id === "paket"), "alles ausgepackt: kein Paket mehr");
});

test("Grundausstattung wirkt: Napf, Bürste, Ball, Decke und Laterne", () => {
  const z = zustand({ hunger: 40, sauber: 40, beschaeftigt: 30 });
  G.flauschiBeruehren(z, "napf", T0, offen(24));
  assert.ok(z.hunger >= 82, "Futternapf sättigt");
  G.flauschiBeruehren(z, "buerste", T0, offen(24));
  assert.ok(z.sauber >= 70 && z.funken > 0, "Bürste putzt und lädt statisch auf");
  const b = z.beschaeftigt;
  G.flauschiBeruehren(z, "ball", T0, offen(24));
  assert.ok(z.beschaeftigt > b, "Spielball beschäftigt");
  const wach = zustand();
  G.flauschiBeruehren(wach, "decke", T0, offen(24));
  assert.equal(wach.schlaf, true, "Minidecke kuschelt sie in den Schlaf");
  assert.equal(wach.decke, true);
  const l = zustand();
  G.flauschiBeruehren(l, "laterne", T0, offen(24));
  assert.equal(l.laterne, true);
  l.aktion = null; l.aktionT = 0;
  G.flauschiBeruehren(l, "laterne", T0, offen(24));
  assert.equal(l.laterne, false, "noch einmal klicken macht sie aus");
});

test("Stickeralbum: jeder Sticker nur einmal, alte Spielstände bleiben erwachsen", () => {
  assert.equal(G.FLAUSCHI_STICKER.length, 10);
  const z = zustand({ sticker: [] });
  assert.equal(G.stickerGeben(z, "baden"), true);
  assert.equal(G.stickerGeben(z, "baden"), false, "kein Sticker doppelt");
  const c = canvas();
  G.drawFlauschiAlbum(c.ctx, 120, 354, z);
  assert.ok(c.ops.some(o => o.art === "text" && o.text === "STICKERALBUM"));
  const alt = G.leseFlauschiStand({ letzte: T0, hunger: 50, muede: 30, muedeVersion: 2, punkte: 40 });
  assert.equal(alt.phase, 3, "Spielstand von vor der Demo: Flauschi bleibt erwachsen");
  assert.equal(alt.wachstum, 25);
  assert.equal(alt.ausgepackt.length, 16, "ihre Gegenstände stehen weiter im Zimmer");
  assert.deepEqual(alt.sticker, []);
  const neu = G.leseFlauschiStand({ phase: 1, wachstum: 5, ausgepackt: [1, 7], sticker: ["paket"] });
  assert.equal(neu.phase, 1);
  assert.deepEqual(neu.ausgepackt, [1, 7]);
});

test("Ei, Baby und Kind malen; Überraschungen von allein laufen fehlerfrei", () => {
  for (const phase of [0, 1, 2, 3]) {
    const c = canvas();
    G.drawFlauschi(c.ctx, 100, 200, 1.8, 4.5, zustand({ phase, wachstum: phase === 0 ? 2 : 25 }));
    assert.ok(c.ops.length > 8, `Phase ${phase} malt`);
  }
  // Drei Stunden Leerlauf am Stück: Jede Überraschung (Rolle, Gähnen, Hopsen,
  // Umsehen, Niesen, Verstecken) muss ohne Fehler durchlaufen.
  for (let t = 0; t < 3 * 3600; t += 0.7) {
    const c = canvas();
    G.drawFlauschi(c.ctx, 100, 200, 1.8, t, zustand());
    assert.ok(c.ops.length > 5);
  }
  const szene = canvas();
  G.drawFlauschiSzene(szene.ctx, 0, 0, 720, 300, 3.1, zustand({ phase: 0, ausgepackt: [] }), [1, 2, 3, 6]);
  assert.ok(szene.ops.length > 100, "leeres Zimmer mit Nest, Ei und Paketen malt");
  const offenSzene = canvas();
  G.drawFlauschiSzene(offenSzene.ctx, 0, 0, 720, 300, 3.1, zustand({ aktion: "auspacken", aktionT: 0.5, ausgepackt: [1] }), [1, 2]);
  assert.ok(offenSzene.ops.length > 100, "Auspacken malt");
});

console.log(`\n${n} Teleflauschi-Tests bestanden.`);
