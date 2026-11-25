// Prüfungen für die Tapetenwechsel-Vorschläge (ohne Browser).
import assert from "node:assert/strict";
import { build } from "esbuild";

async function lade(datei) {
  const b = await build({ entryPoints: [datei], bundle: true, write: false, format: "esm", platform: "node" });
  return import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
}
const R = await lade("src/game/renovierung.ts");
const G = await lade("src/game/house.ts");
const S = await lade("src/game/steine.ts");
const L = await lade("src/game/renovierung-luni.ts");
const M = await lade("src/game/muell.ts");

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`OK  ${name}`); };

/** Musikzimmerwand, wie die Vorschau sie verwendet. */
const WAND = { x0: 530, x1: G.HR, yTop: 30, yBot: G.FLOOR_Y[3], decke: G.dachschraege };
const SICHT = { x: 512, y: 44, w: 336, h: 168 };

/** Zeichenfläche, die alles mitmacht und Rechtecke, Sichern und Ausschnitte zählt. */
function flaeche() {
  const allzweck = new Proxy(function () {}, {
    get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : allzweck),
    apply: () => allzweck,
  });
  const merk = { rechtecke: [], sichern: 0, zurueck: 0, tiefste: 0 };
  const werte = { globalAlpha: 1, lineWidth: 1, fillStyle: "#000", strokeStyle: "#000", font: "", canvas: { width: 960, height: 600 } };
  const c = new Proxy(werte, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === "save") return () => { merk.sichern++; };
      if (k === "restore") return () => { merk.zurueck++; merk.tiefste = Math.min(merk.tiefste, merk.sichern - merk.zurueck); };
      if (k === "fillRect") return (x, y, b, h) => { merk.rechtecke.push([x, y, b, h]); };
      if (k === "measureText") return () => ({ width: 12 });
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} });
      return () => allzweck;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  return { c, merk };
}

function spielHaus(floor = 3, x = 550) {
  const speicher = new Map();
  const canvas = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => flaeche().c });
  globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
  globalThis.document = { createElement: canvas, visibilityState: "visible" };
  globalThis.window = { devicePixelRatio: 1 };
  const h = new G.House(canvas(), { welt: "adventshaus", clock: { year: 2026, month: 11, day: 25, hour: 10, min: 0 } });
  h.lf = floor; h.lx = x;
  return h;
}

test("Sechs Vorschläge mit Titel, Ablauf, Echtzeit und Wii-Einschätzung", () => {
  assert.equal(R.RENO_VORSCHLAEGE.length, 6);
  assert.equal(new Set(R.RENO_VORSCHLAEGE.map((v) => v.id)).size, 6);
  for (const v of R.RENO_VORSCHLAEGE) {
    assert.ok(v.titel.length > 3 && v.kurz.length > 20 && v.text.length > 40, v.id);
    assert.ok(v.echtzeit.length > 15 && v.wii.length > 10, v.id);
    assert.ok([1, 2, 3].includes(v.aufwand) && v.dauer >= 3 && v.dauer <= 20, v.id);
    assert.equal(R.renoVorschlag(v.id), v);
  }
  assert.equal(R.RENO_VORSCHLAEGE.filter((v) => v.empfohlen).length, 1, "genau eine Empfehlung");
});

test("Anfang und Ende sind bildgleich mit alter und neuer Wand", () => {
  for (const v of R.RENO_VORSCHLAEGE) {
    for (const [p, erwartet] of [[0, "alt"], [1, "neu"]]) {
      const { c, merk } = flaeche();
      const ruf = [];
      R.drawRenovierungWand(c, v.id, p, 2.5, WAND, () => ruf.push("alt"), () => ruf.push("neu"));
      assert.deepEqual(ruf, [erwartet], `${v.id} bei p=${p}`);
      assert.equal(merk.rechtecke.length, 0, `${v.id}: bei p=${p} wird nichts dazugemalt`);
      const vorn = flaeche();
      R.drawRenovierungVorn(vorn.c, v.id, p, 2.5, WAND, SICHT);
      assert.equal(vorn.merk.sichern + vorn.merk.rechtecke.length, 0, `${v.id}: kein Beiwerk bei p=${p}`);
    }
  }
});

test("Unterwegs: beide Wände sind beteiligt, nichts wirft, Ausschnitte bleiben nicht hängen", () => {
  for (const v of R.RENO_VORSCHLAEGE) {
    let alt = 0, neu = 0;
    for (let i = 1; i < 40; i++) {
      for (const t of [0, 3.7]) {
        const { c, merk } = flaeche();
        R.drawRenovierungWand(c, v.id, i / 40, t, WAND, () => alt++, () => neu++);
        R.drawRenovierungVorn(c, v.id, i / 40, t, WAND, SICHT);
        assert.equal(merk.sichern, merk.zurueck, `${v.id} p=${i / 40}: save/restore ungleich`);
        assert.equal(merk.tiefste, 0, `${v.id}: restore ohne save`);
      }
    }
    assert.ok(alt > 0 && neu > 0, `${v.id}: alt ${alt}, neu ${neu}`);
  }
});

test("Bahn für Bahn: genau zehn Bahnen, von links nach rechts, nie über die Wand hinaus", () => {
  assert.equal(R.RENO_BAHNEN, 10);
  const zaehle = (p) => {
    let neu = 0;
    const { c } = flaeche();
    R.drawRenovierungWand(c, "bahnen", p, 0, WAND, () => {}, () => neu++);
    return neu;
  };
  assert.equal(zaehle(0.05), 1);
  assert.equal(zaehle(0.55), 6);
  assert.equal(zaehle(0.999), 10);
  let vorher = 0;
  for (let i = 1; i < 100; i++) {
    const jetzt = zaehle(i / 100);
    assert.ok(jetzt >= vorher, "Bahnen verschwinden nicht wieder");
    vorher = jetzt;
  }
});

test("Erst runter, dann rauf: zuerst nur Putz, dazwischen Rohbau, dann die neue Tapete", () => {
  const neuBei = (p) => {
    let neu = 0;
    const { c } = flaeche();
    R.drawRenovierungWand(c, "abziehen", p, 0, WAND, () => {}, () => neu++);
    return neu;
  };
  assert.equal(neuBei(0.2), 0, "beim Abziehen ist noch keine neue Tapete da");
  assert.equal(neuBei(0.5), 0, "Rohbau-Pause");
  assert.ok(neuBei(0.8) > 0);
});

test("Die Vorschau findet die alte Wand in der echten Hauszeichnung", () => {
  const { c, merk } = flaeche();
  G.zeichneHaus(c, { width: 960, height: 600 }, { open: 0 }, true, null, false, undefined, false, false, true);
  const art = merk.rechtecke.map(([x, y, b, h]) => R.altwandTeil(WAND, 30, x, y, b, h));
  assert.equal(art.filter((a) => a === "grund").length, 1, "Wandfläche genau einmal");
  // 14 Glanzstreifen + Sockel + Sockelkante + Bodenschatten
  assert.equal(art.filter((a) => a === "beiwerk").length, 17, "Beiwerk der alten Wand");
  // Reihenfolge wie in wallBand: erst die Fläche, dann ihr Beiwerk am Stück.
  const erste = art.indexOf("grund");
  assert.deepEqual(art.slice(erste, erste + 18), ["grund", ...Array(17).fill("beiwerk")]);
  // Die Nachbarwand (Gaming-Zimmer) wird nicht angefasst.
  assert.equal(R.altwandTeil(WAND, 30, 262, 30, 268, 170), null);
  assert.equal(R.altwandTeil(WAND, 30, 270, 30, 9, 170), null);
});

test("Im Weihnachtshaus gibt es die alte Wand nicht – dort malt weihnachtsTapete", () => {
  const { c, merk } = flaeche();
  G.zeichneHaus(c, { width: 960, height: 600 }, { open: 0 }, true, null, false, undefined, true, false, true);
  const art = merk.rechtecke.map(([x, y, b, h]) => R.altwandTeil(WAND, 30, x, y, b, h));
  // Sockel (30 hoch) und Bodenschatten der alten Wand fehlen dort.
  assert.equal(merk.rechtecke.some(([x, y, b, h]) => x === 530 && y === 170 && b === 300 && h === 30), false);
  assert.equal(merk.rechtecke.some(([x, y, b, h]) => x === 530 && y === 195 && b === 300 && h === 5), false);
});

test("Raumplan: alle 9 Räume, 8× Tapetenbahnen + eigene Fliesen-Methode fürs Bad", () => {
  assert.equal(R.RENO_RAEUME.length, 9);
  const bad = R.renoRaumInfo("badezimmer");
  assert.equal(bad.methode, "fliesen", "Bad nutzt die eigene Fliesen-Methode");
  for (const r of R.RENO_RAEUME) {
    assert.equal(r.methode, r.id === "badezimmer" ? "fliesen" : "bahnen", r.id);
    assert.ok(r.dauer >= 6 && r.dauer <= 26, `${r.id}: angenehme Dauer`);
    if (r.methode === "bahnen") assert.ok(r.bahnen >= 5 && r.bahnen <= 14, `${r.id}: Bahnzahl`);
  }
  // Gaming-Zimmer teilt sauber in linken Rand (5 Bahnen) und Hauptwand über Dachfirst (9 Bahnen).
  assert.deepEqual(R.gamingTeile(0), { rand: 0, haupt: 0 });
  assert.deepEqual(R.gamingTeile(1), { rand: 1, haupt: 1 });
  const frueh = R.gamingTeile(0.2);
  assert.ok(frueh.rand > 0 && frueh.rand < 1 && frueh.haupt === 0);
  const spaet = R.gamingTeile(0.7);
  assert.ok(spaet.rand === 1 && spaet.haupt > 0 && spaet.haupt < 1);
  // Dachfirst-Clipping erreicht den Giebel (y = 40 bei x = 470).
  const gWand = { x0: 262, x1: 530, yTop: 30, yBot: 200, decke: G.dachschraege, first: 470, bahnen: 9 };
  let minY = Infinity;
  const { c } = flaeche();
  c.lineTo = (_x, y) => { if (y < minY) minY = y; };
  R.drawRenovierungWand(c, "bahnen", 0.5, 0, gWand, () => {}, () => {});
  assert.equal(minY, G.dachschraege(470), "Gaming-Wand reicht sauber bis zum Dachfirst");
});

test("Bad-Fliesen-Methode: Reihe für Reihe von unten nach oben, Kleber, Fliesenkreuze, Verfugen", () => {
  const BAD = { x0: 490, x1: 694, yTop: 212, yBot: 324, decke: () => 212, fliese: 14 };
  const BAD_SICHT = { x: 490, y: 212, w: 204, h: 112 };
  // p = 0 und p = 1 sind exakt bildgleich mit alten bzw. neuen Fliesen (ohne Zusatz oder Beiwerk).
  for (const [p, erwartet] of [[0, "alt"], [1, "neu"]]) {
    const { c, merk } = flaeche();
    const ruf = [];
    R.drawRenovierungWand(c, "fliesen", p, 1.2, BAD, () => ruf.push("alt"), () => ruf.push("neu"));
    assert.deepEqual(ruf, [erwartet], `fliesen p=${p}`);
    assert.equal(merk.rechtecke.length, 0, `kein Zusatz bei p=${p}`);
    const v = flaeche();
    R.drawRenovierungVorn(v.c, "fliesen", p, 1.2, BAD, BAD_SICHT);
    assert.equal(v.merk.sichern + v.merk.rechtecke.length, 0, `kein Beiwerk bei p=${p}`);
  }
  // 15 × 8 = 120 Fliesen, beginnt unten (Reihe 7) und steigt monoton bis oben (Reihe 0).
  const s0 = R.fliesenStand(BAD, 0.02);
  const sM = R.fliesenStand(BAD, 0.4);
  const sO = R.fliesenStand(BAD, 0.74);
  const sF = R.fliesenStand(BAD, 0.88);
  assert.equal(s0.cols, 15);
  assert.equal(s0.rows, 8);
  assert.equal(s0.gesamt, 120);
  assert.equal(s0.phase, "legen");
  assert.equal(s0.aktivRow, 7, "beginnt ganz unten an der Fußleiste");
  assert.ok(sM.gesetzt > s0.gesetzt && sO.gesetzt > sM.gesetzt, "Fliesenanzahl wächst monoton");
  assert.ok(sO.aktivRow < sM.aktivRow && sM.aktivRow < s0.aktivRow, "arbeitet Reihe für Reihe nach oben");
  assert.equal(sF.phase, "verfugen", "nach dem Setzen folgt Verfugen mit Schwamm");
  assert.equal(sF.gesetzt, 120);
  assert.ok(sF.schwamm > 0 && sF.schwamm < 1);
  // Alle Zwischenbilder: save/restore ausgeglichen, alte und neue Fliesen beteiligt, Beiwerk in beiden Phasen.
  let alt = 0, neu = 0;
  for (let i = 1; i < 40; i++) {
    const p = i / 40;
    const { c, merk } = flaeche();
    R.drawRenovierungWand(c, "fliesen", p, i * 0.3, BAD, () => alt++, () => neu++);
    R.drawRenovierungVorn(c, "fliesen", p, i * 0.3, BAD, BAD_SICHT);
    assert.equal(merk.sichern, merk.zurueck, `fliesen p=${p}: save/restore`);
    assert.equal(merk.tiefste, 0);
  }
  assert.ok(alt > 0 && neu > 0, `fliesen: alt=${alt}, neu=${neu}`);
});

test("Kiesteil links: 9 überlappungsfreie Raum-Steine (≥ 24×24), einer für jeden Raum", () => {
  assert.equal(S.KIES_PLAETZE.length, 12, "10 Kiesplätze (9 Räume + Kranz)");
  assert.equal(S.RAUM_STEINE.length, 9, "alle 9 Räume haben einen Stein");
  assert.equal(S.MUSIKZIMMER_STEIN, S.KIES_PLAETZE[0], "Musikzimmer auf Platz 1");
  assert.equal(S.STEIN_NAMEN.musikzimmer, "Musikzimmer");
  assert.equal(S.STEIN_NAMEN.badezimmer, "Badezimmer");
  // Jeder Raum aus RENO_RAEUME hat genau einen passenden Stein.
  assert.deepEqual(
    S.RAUM_STEINE.map((r) => r.raum).sort(),
    R.RENO_RAEUME.map((r) => r.id).sort(),
  );
  for (let i = 0; i < S.KIES_PLAETZE.length; i++) {
    const [x, y, w, h] = S.KIES_PLAETZE[i].hit;
    assert.ok(w >= 24 && h >= 24, `Kiesplatz ${i + 1} zu klein (${w}×${h})`);
    assert.ok(x >= 2 && x + w <= 94 && y >= 460 && y + h <= 570, `Kiesplatz ${i + 1} außerhalb des linken Kiesteils`);
    for (let j = i + 1; j < S.KIES_PLAETZE.length; j++) {
      const [bx, by, bw, bh] = S.KIES_PLAETZE[j].hit;
      assert.ok(x + w <= bx || bx + bw <= x || y + h <= by || by + bh <= y, `Kiesplatz ${i + 1} und ${j + 1} überlappen`);
    }
  }
  // Keiner der 9 Kiesplätze berührt irgendeinen bestehenden Stein.
  for (const welt of ["normal", "adventshaus", "weihnacht", "traum", "gruesel"]) {
    const andere = S.steinSlots(welt).filter((s) => !s.kies);
    for (const pl of S.KIES_PLAETZE) {
      const [x, y, w, h] = pl.hit;
      for (const a of andere) {
        const [bx, by, bw, bh] = a.hit;
        assert.ok(x + w <= bx || bx + bw <= x || y + h <= by || by + bh <= y, `Kiesplatz überlappt ${a.label} in ${welt}`);
      }
    }
  }
  // Alle 9 Steine liegen im normalen Haus und Adventshaus, keiner im Gruselhaus.
  assert.equal(S.steinSlots("normal").filter((s) => s.kies).length, 12);
  assert.equal(S.steinSlots("adventshaus").filter((s) => s.kies).length, 12);
  assert.equal(S.steinSlots("gruesel").filter((s) => s.kies).length, 12);
  // Kiesfeld und alle 9 Steinsymbole malen fehlerfrei mit ausgeglichenem save/restore.
  const { c, merk } = flaeche();
  S.drawKiesFeld(c);
  for (const r of S.RAUM_STEINE) {
    const pl = S.KIES_PLAETZE[r.platz];
    S.drawStein(c, r.art, 0.5, pl.x, pl.y);
  }
  assert.equal(merk.sichern, merk.zurueck);
  assert.equal(merk.tiefste, 0);
});

test("Alle 9 Räume im Haus: jeder wechselt nur seine eigene Wand, eine Luni arbeitet nacheinander", () => {
  // Alte Sockelmaße je Tapetenraum (bei x, y, b, h)
  const tapeten = [
    ["musik", [530, 170, 300, 30], [530, 174, 300, 26]],
    ["gaming", [262, 170, 268, 30], [262, 177, 268, 23]],
    ["schlafzimmer", [270, 294, 220, 30], [270, 301, 220, 23]],
    ["treppenhaus", [694, 418, 136, 30], [694, 425, 136, 23]],
    ["flur", [110, 418, 140, 30], [110, 425, 140, 23]],
    ["wohnzimmer", [250, 418, 310, 30], [250, 425, 310, 23]],
    ["kueche", [560, 414, 134, 34], [560, 425, 134, 23]],
    ["keller", [350, 546, 240, 26], [350, 556, 480, 16]],
  ];
  const hat = (r, [ax, ay, ab, ah]) => r.some(([x, y, b, h]) => x === ax && y === ay && b === ab && h === ah);
  for (const [id, alt, neu] of tapeten) {
    const f = flaeche();
    G.zeichneHaus(f.c, { width: 960, height: 600 }, { open: 0 }, true, null, false, undefined, false, false, true, { [id]: 1 });
    assert.equal(hat(f.merk.rechtecke, alt), false, `${id}: alte Wand weg`);
    assert.equal(hat(f.merk.rechtecke, neu), true, `${id}: neue Weihnachtstapete da`);
    // Mindestens ein anderer Raum bleibt sicher unverändert.
    const nachbar = id === "musik" ? tapeten[1] : tapeten[0];
    assert.equal(hat(f.merk.rechtecke, nachbar[1]), true, `${id}: Nachbar ${nachbar[0]} unverändert`);
  }
  // Gaming nimmt auch die linke Dachschrägen-Wand (HL..270) mit.
  const fg = flaeche();
  G.zeichneHaus(fg.c, { width: 960, height: 600 }, { open: 0 }, true, null, false, undefined, false, false, true, { gaming: 1 });
  assert.equal(hat(fg.merk.rechtecke, [110, 298, 160, 26]), false, "gamingRand: alte Wand weg");
  assert.equal(hat(fg.merk.rechtecke, [110, 301, 160, 23]), true, "gamingRand: neue Wand da");

  // Badezimmer wechselt von alten (#4aa273) zu weihnachtlichen Fliesen (#69867e), ohne Nachbarn zu berühren.
  const farben = (stand) => {
    const set = new Set();
    const { c } = flaeche();
    const orig = c.fillRect;
    let cur = "";
    const p = new Proxy(c, {
      set(t, k, v) { if (k === "fillStyle" && typeof v === "string") cur = v; t[k] = v; return true; },
      get(t, k) {
        if (k === "fillRect") return (x, y, b, h) => { if (x >= 490 && x < 694 && y >= 212 && y < 324) set.add(cur); return orig(x, y, b, h); };
        return t[k];
      },
    });
    G.zeichneHaus(p, { width: 960, height: 600 }, { open: 0 }, true, null, false, undefined, false, false, true, stand);
    return set;
  };
  const badAlt = farben(null);
  assert.ok(badAlt.has("#4aa273") && !badAlt.has("#69867e"), "vorher alte Fliesen");
  const badMitte = farben({ badezimmer: 0.4 });
  assert.ok(badMitte.has("#4aa273") && badMitte.has("#8e9289") && badMitte.has("#69867e"), "unterwegs: alt + Kleber + neu");
  const badNeu = farben({ badezimmer: 1 });
  assert.ok(!badNeu.has("#4aa273") && badNeu.has("#69867e"), "nachher nur neue Badfliesen");

  // Echte Wege und eine einzige Arbeiterin statt drei gleichzeitig laufender Figuren.
  const h = spielHaus();
  h.raumRenoStart("musik");
  h.raumRenoStart("badezimmer");
  h.raumRenoStart("keller");
  assert.equal(h.raumRenoAktiv.size, 3);
  const besucht = [];
  for (let i = 0; i < 24000 && (h.raumRenoAktiv.size || h.muellArbeit); i++) {
    const vorher = { ...h.raumReno };
    h.step(0.04);
    const geaendert = Object.keys(h.raumReno).filter((r) => h.raumReno[r] !== vorher[r]);
    assert.ok(geaendert.length <= 1, "niemals zwei Arbeitsstellen gleichzeitig");
    if (h.renoArbeit && h.renoPose && besucht.at(-1) !== h.renoArbeit.raum) {
      besucht.push(h.renoArbeit.raum);
      const v = flaeche();
      h.drawRaumDreck(v.c);
      h.drawRaumRenoVorn(v.c);
      h.drawLuniNow(v.c);
      assert.equal(v.merk.sichern, v.merk.zurueck);
    }
  }
  assert.deepEqual(besucht, ["musik", "badezimmer", "keller"]);
  assert.equal(h.raumRenoAktiv.size, 0, "alle drei sauber abgeschlossen");
  assert.equal(h.raumReno.musik, 1);
  assert.equal(h.raumReno.badezimmer, 1);
  assert.equal(h.raumReno.keller, 1);
});

test("Wohnzimmer renoviert auch den Eingang, ohne weitere Steine zu verschieben", () => {
  assert.deepEqual(R.renoAuftragsRaeume("wohnzimmer"), ["flur", "wohnzimmer"]);
  const h = spielHaus(1, 180);
  h.command("stein_wohnzimmer");
  h.command("stein_wohnzimmer");
  assert.deepEqual([...h.raumRenoAktiv], ["flur", "wohnzimmer"], "wiederholter Klick erzeugt keine doppelten Auftraege");
  for (let i = 0; i < 16000 && (h.raumRenoAktiv.size || h.muellArbeit); i++) h.step(0.04);
  assert.equal(h.raumReno.flur, 1);
  assert.equal(h.raumReno.wohnzimmer, 1);
  assert.equal(h.raumReno.kueche, undefined, "Kueche bleibt unberuehrt");
  assert.equal(h.renoPose, null, "nach der Arbeit wieder normale Luni");
  assert.equal(h.muellSaecke, 2, "25.11.2026 ist Mittwoch: Flur- und Wohnzimmersack lagern im Keller");
});

test("Tapete: Durchgang 1 (Reste bleiben) -> Durchgang 2 (Reste mit Leiter) -> Durchgang 3 (Tapezieren)", () => {
  const w = G.RENO_WAENDE.musik;
  const reste = R.tapetenReste(w);
  assert.ok(reste.length >= 3 && reste.length <= 6, "mehrere typische Tapetenreste");
  // Sortiert von rechts nach links (nahtlos nach Durchgang 1)
  for (let i = 1; i < reste.length; i++) assert.ok(reste[i].x < reste[i - 1].x);
  // Reste liegen auf unterschiedlichen Höhen innerhalb der Wand
  assert.ok(new Set(reste.map((r) => Math.round(r.y / 25))).size >= 2);

  assert.equal(R.tapezierTakt(w, 0.18).phase, "abziehen");
  assert.equal(R.tapezierTakt(w, 0.45).phase, "reste");
  assert.equal(R.tapezierTakt(w, 0.57).phase, "rohbau");
  assert.equal(R.tapezierTakt(w, 0.78).phase, "tapezieren");

  // Während Durchgang 1, 2 und Rohbau wird noch keine neue Tapete geklebt
  for (const p of [0.15, 0.35, 0.45, 0.57, R.TAPETE_NEU_AB]) {
    let neu = 0;
    const { c } = flaeche();
    R.drawRenovierungWand(c, "bahnen", p, 0, w, () => {}, () => neu++);
    assert.equal(neu, 0, `p=${p}: noch keine neue Tapete`);
  }
  // Am Ende von Durchgang 1 sind alle berechneten Tapetenreste noch da (alt wird für die Fetzen gemalt)
  let altAmEnde1 = 0;
  const fR = flaeche();
  R.drawRenovierungWand(fR.c, "bahnen", R.TAPETE_ABZIEHEN_BIS - 1e-4, 0, w, () => altAmEnde1++, () => {});
  assert.ok(altAmEnde1 >= reste.length, "typische Reste der alten Tapete bleiben bis Durchgang 2 sichtbar");
  // Im Rohbau zwischen Durchgang 2 und 3 ist kein alter Rest mehr da
  let altRohbau = 0;
  const fRoh = flaeche();
  R.drawRenovierungWand(fRoh.c, "bahnen", 0.575, 0, w, () => altRohbau++, () => {});
  assert.equal(altRohbau, 0, "nach Durchgang 2 ist die Wand komplett frei von alter Tapete");
});

test("Durchgang 2 & 3: Luni bewegt die Leiter, klettert auf Rest-Höhe, klettert beim Tapezieren hoch & runter", () => {
  const w = G.RENO_WAENDE.musik;
  const n = w.bahnen;
  const pAb = (u) => (u * R.TAPETE_ABZIEHEN_BIS) / n;
  // Durchgang 1: Luni steigt mit dem Spachtel und der gelösten Tapete nach unten
  assert.ok(R.tapezierTakt(w, pAb(0.35)).y < w.yBot - 20);
  assert.ok(R.tapezierTakt(w, pAb(0.9)).y > w.yBot - 15);
  assert.equal(L.renovierungsPose(w, pAb(0.5), 0).werkzeug, "spachtel");

  // Durchgang 2: Reste auf Höhe entfernen
  const rTakt = (j, u) => R.tapezierTakt(w, R.TAPETE_ABZIEHEN_BIS + ((j + u) / R.tapetenReste(w).length) * (R.TAPETE_RESTE_BIS - R.TAPETE_ABZIEHEN_BIS));
  assert.equal(rTakt(0, 0.1).schritt, "bewegen");
  assert.equal(rTakt(0, 0.1).y, w.yBot, "Leiter wird am Boden bewegt");
  assert.equal(rTakt(0, 0.3).schritt, "hoch");
  assert.equal(rTakt(0, 0.55).schritt, "kratzen");
  assert.equal(rTakt(0, 0.9).schritt, "runter");
  const restPose = L.renovierungsPose(w, R.TAPETE_ABZIEHEN_BIS + (0.55 / R.tapetenReste(w).length) * (R.TAPETE_RESTE_BIS - R.TAPETE_ABZIEHEN_BIS), 0);
  assert.equal(restPose.werkzeug, "spachtel");

  // Durchgang 3: exakt "Leiter bewegen -> hochklettern -> Tapete rollt runter -> runterklettern" je Bahn
  const pNeu = (i, u) => R.TAPETE_NEU_AB + ((i + u) / n) * (1 - R.TAPETE_NEU_AB);
  const sBew = R.tapezierTakt(w, pNeu(1, 0.1));
  const sHoch = R.tapezierTakt(w, pNeu(1, 0.33));
  const sAbroll = R.tapezierTakt(w, pNeu(1, 0.58));
  const sRunter = R.tapezierTakt(w, pNeu(1, 0.9));
  assert.equal(sBew.schritt, "bewegen");
  assert.equal(sBew.y, w.yBot);
  assert.equal(sBew.auf, 0, "beim Leiterbewegen rollt noch keine neue Bahn");
  assert.equal(sHoch.schritt, "hoch");
  assert.ok(sHoch.y < w.yBot && sHoch.auf === 0, "klettert erst hoch, ehe die Tapete rollt");
  assert.equal(sAbroll.schritt, "abrollen");
  assert.ok(sAbroll.y < w.yBot - 20 && sAbroll.auf > 0 && sAbroll.auf < 1, "Tapete rollt ab, während Luni oben steht");
  assert.equal(sRunter.schritt, "runter");
  assert.equal(sRunter.auf, 1, "erst wenn die Bahn klebt, klettert sie herunter");
  assert.ok(sRunter.y > sAbroll.y, "bewegt sich nach unten");
  assert.ok(Math.abs(R.tapezierTakt(w, 0.999999).y - w.yBot) < 0.01 && R.tapezierTakt(w, 1).y === w.yBot, "nach letzter Bahn wieder am Boden");

  // Kein Positionssprung über den gesamten Durchlauf (im echten 60-Hz-Schritt des Hauses)
  const N = Math.round(R.renoRaumInfo("musik").dauer * 1.4 * 60);
  let vor = L.renovierungsPose(w, 0, 0);
  for (let k = 1; k <= N; k++) {
    const p = k / N;
    const jetzt = L.renovierungsPose(w, p, k / 60);
    assert.ok(Math.hypot(jetzt.x - vor.x, jetzt.y - vor.y) < 10.5, `Sprung bei p=${p}`);
    vor = jetzt;
  }
});

test("Mehr Dreck am Boden: sammelt sich, bleibt nach dem Tapezieren liegen bis Luni fegt", () => {
  const w = G.RENO_WAENDE.musik;
  assert.equal(R.tapetenDreckMenge(w, 0), 0, "vorher sauber");
  let vor = 0;
  for (let p = 0.05; p <= R.TAPETE_RESTE_BIS; p += 0.05) {
    const jetzt = R.tapetenDreckMenge(w, p);
    assert.ok(jetzt >= vor, `p=${p}: Dreck wächst`);
    vor = jetzt;
  }
  assert.ok(vor >= 100, `deutlich mehr Dreck als vorher (${vor} Stücke)`);
  assert.equal(R.tapetenDreckMenge(w, 0.8), vor, "bleibt während Tapezieren liegen");
  assert.equal(R.tapetenDreckMenge(w, 0.99), vor, "verschwindet nicht von selbst");

  // Im echten Haus: nach Ende des Tapezierens liegt der Dreck voll da und wird von Luni zusammengekehrt
  const h = spielHaus(3, 550);
  h.command("stein_musikzimmer");
  let gesehenDreckVoll = false, gesehenFegen = false;
  for (let i = 0; i < 12000 && (h.raumRenoAktiv.size || h.muellArbeit || h.renoFegenPause); i++) {
    h.step(0.04);
    if ((h.raumReno.musik ?? 0) >= 1 && (h.raumDreck.musik ?? 0) > 0.5) gesehenDreckVoll = true;
    if (h.renoFegenPause) {
      gesehenFegen = true;
      assert.ok(["feger", null].includes(h.renoPose?.werkzeug));
    }
  }
  assert.ok(gesehenDreckVoll || gesehenFegen, "Dreck wird vor dem Tapezieren weggefegt");
  assert.ok(gesehenFegen, "Luni fegt die Reste am Boden selbst zusammen");
  assert.equal(h.raumDreck.musik, 0, "nach dem Fegen ist der Boden sauber");
  assert.equal(h.muellSaecke, 1, "gesammelter Sack lagert unten im Keller (Mittwoch)");
});

test("Müllsäcke im Keller & Dienstags-Mülltonne vor dem Haus", () => {
  // Kalenderprüfung (Europe/Berlin-Datum)
  assert.equal(M.istMuellTag({ year: 2026, month: 11, day: 24 }), true, "24.11.2026 ist Dienstag");
  assert.equal(M.istMuellTag({ year: 2026, month: 11, day: 25 }), false, "25.11.2026 ist Mittwoch");
  assert.equal(M.istMuellTag({ year: 2026, month: 12, day: 1 }), true, "01.12.2026 ist Dienstag");
  assert.ok(M.MUELLTONNE.x + M.MUELLTONNE.w * 0.5 <= 98 && M.MUELLTONNE.x - M.MUELLTONNE.w * 0.5 >= 78, "Tonne passt zwischen Briefkasten und Wand");

  // Zeichnung Tonne, Kellersäcke und offene Haustür
  const fT = flaeche();
  M.drawMuellTonne(fT.c, 0.6, 2, true);
  M.drawKellerMuellsaecke(fT.c, 5, 572);
  M.drawMuellHaustuer(fT.c, { width: 960, height: 600 }, 0.8, true);
  assert.equal(fT.merk.sichern, fT.merk.zurueck);

  // 1) Nicht-Dienstag (Mittwoch): Säcke sammeln sich im Keller und bleiben im Snapshot gespeichert
  const speicher = new Map();
  const canvas = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => flaeche().c });
  globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
  globalThis.document = { createElement: canvas, visibilityState: "visible" };
  globalThis.window = { devicePixelRatio: 1 };

  const mittwoch = { year: 2026, month: 11, day: 25, hour: 11, min: 0 };
  const hMi = new G.House(canvas(), { welt: "adventshaus", clock: mittwoch });
  hMi.lf = 1; hMi.lx = 180;
  hMi.command("stein_flur");
  for (let i = 0; i < 6000 && (hMi.raumRenoAktiv.size || hMi.muellArbeit); i++) hMi.step(0.04);
  assert.equal(hMi.muellSaecke, 1, "Mittwochs landet der Sack unten im Keller");
  assert.equal(hMi.tonneVoll, 0);
  hMi.speichern();

  // 2) Am nächsten Dienstag: Haus lädt gespeicherten Sack und Luni bringt ihn automatisch in die Tonne vor dem Haus
  const dienstag = { year: 2026, month: 12, day: 1, hour: 11, min: 0 };
  const hDi = new G.House(canvas(), { welt: "adventshaus", clock: dienstag });
  assert.equal(hDi.muellSaecke, 1, "Kellersack wurde aus Snapshot geladen");
  let tuerGeoeffnet = false;
  for (let i = 0; i < 6000 && (hDi.muellSaecke > 0 || hDi.muellArbeit); i++) {
    hDi.step(0.04);
    if (hDi.muellTuerOffen > 0.5) tuerGeoeffnet = true;
  }
  assert.ok(tuerGeoeffnet, "Luni hat Dienstags die Haustür für die Tonne geöffnet");
  assert.equal(hDi.muellSaecke, 0, "Keller am Dienstag geleert");
  assert.equal(hDi.tonneVoll, 1, "Sack ist in der Dienstags-Mülltonne");

  // 3) Direkte Renovierung am Dienstag: Sack geht ohne Kellerlagerung sofort vor die Tür
  hDi.command("stein_flur");
  for (let i = 0; i < 6000 && (hDi.raumRenoAktiv.size || hDi.muellArbeit); i++) hDi.step(0.04);
  assert.ok(hDi.muellSaecke <= 1, "höchstens ein Sack wartet auf die Tonne");
  assert.ok(hDi.tonneVoll + hDi.muellSaecke >= 2, "zweiter Sack ist entsorgt oder wartet auf Dienstagsabholung");
});

test("Bad bleibt unberührt: eigene Fliesen-Methode fix, kein Dreck, keine Kellersäcke", () => {
  const bad = G.RENO_WAENDE.badezimmer;
  assert.equal(R.renoRaumInfo("badezimmer").methode, "fliesen");
  assert.equal(bad.handwerk, true, "Luni arbeitet weiterhin auch im Bad");
  for (const p of [0.1, 0.35, 0.8]) {
    const st = R.fliesenStand(bad, p);
    assert.equal(st.phase, p < R.FLIESEN_VERFUGEN_AB ? "legen" : "verfugen");
  }
  const h = spielHaus(2, 520);
  h.command("stein_badezimmer");
  for (let i = 0; i < 6000 && (h.raumRenoAktiv.size || h.muellArbeit); i++) h.step(0.04);
  assert.equal(h.raumReno.badezimmer, 1);
  assert.equal(h.muellSaecke, 0, "Badfliesen erzeugen keinen Tapeten-Müllsack");
  assert.equal(h.raumDreck.badezimmer ?? 0, 0);
});

test("Alle Raum-Steine erreichen mit Luni ihr fertiges Referenzbild", () => {
  for (const raum of R.RENO_RAEUME) {
    const w = G.RENO_WAENDE[raum.id];
    const floor = G.FLOOR_Y.indexOf(w.yBot);
    const h = spielHaus(floor, w.x0 + 24);
    h.command(`stein_${raum.id === "musik" ? "musikzimmer" : raum.id}`);
    for (let i = 0; i < 16000 && (h.raumRenoAktiv.size || h.muellArbeit); i++) h.step(0.04);
    assert.equal(h.raumRenoAktiv.size, 0, `${raum.id}: Auftrag beendet`);
    assert.equal(h.raumReno[raum.id], 1, `${raum.id}: Wand vollstaendig fertig`);
    assert.equal(h.renoPose, null, `${raum.id}: keine zweite Figur bleibt zurueck`);
  }
});

test("Referenztreue: alle Farben, Muster und Zeichenschritte entsprechen exakt den Weihnachtswaenden", () => {
  const spur = (festlich, stand) => {
    const schritte = [];
    const werte = { globalAlpha: 1, canvas: { width: 960, height: 600 } };
    let nr = 0;
    const c = new Proxy(werte, {
      get(t, k) {
        if (k in t) return t[k];
        return (...args) => {
          schritte.push([k, ...args]);
          if (k === "createLinearGradient" || k === "createRadialGradient") {
            const id = ++nr;
            return { id, addColorStop: (...a) => schritte.push(["farbstopp", id, ...a]) };
          }
        };
      },
      set(t, k, v) { t[k] = v; schritte.push(["setzen", k, typeof v === "object" ? v.id : v]); return true; },
    });
    G.zeichneHausWaende(c, festlich, stand);
    return schritte;
  };
  const alle = Object.fromEntries(R.RENO_RAEUME.map((r) => [r.id, 1]));
  const leer = Object.fromEntries(R.RENO_RAEUME.map((r) => [r.id, 0]));
  assert.deepEqual(spur(false, alle), spur(true, null), "fertige Renovierung ist unveraenderte Weihnachtsreferenz");
  assert.deepEqual(spur(false, leer), spur(false, null), "vorher unveraenderte Normalreferenz");
});

test("Luni verlaesst die Leiter vor einer anderen Anweisung und kann aus dem Bett zur Arbeit gehen", () => {
  const h = spielHaus();
  h.command("stein_musikzimmer");
  for (let i = 0; i < 2000 && !h.renoPose?.werkzeug; i++) h.step(0.01);
  assert.ok(h.renoPose, "Luni arbeitet auf der Leiter");
  h.nutzerEingabe = true;
  h.command("sofa");
  h.nutzerEingabe = false;
  assert.equal(h.renoDanach, "sofa");
  for (let i = 0; i < 3000 && h.raumRenoAktiv.size; i++) h.step(0.01);
  assert.equal(h.renoPose, null);
  assert.equal(h.raumRenoAktiv.size, 0);
  assert.equal(h.renoDanach, null);
  const schlaeft = spielHaus(2, 345);
  schlaeft.asleep = true;
  schlaeft.command("stein_musikzimmer");
  for (let i = 0; i < 16000 && (schlaeft.raumRenoAktiv.size || schlaeft.muellArbeit); i++) schlaeft.step(0.04);
  assert.equal(schlaeft.raumReno.musik, 1, "nach sichtbarem Aufwachen und Treppenweg renoviert");
});

console.log(`\n${n} Prüfungen bestanden`);
