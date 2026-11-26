// Tests für Lunis geringelte Socken: Aussehen, Barfuß-Zustand, Speichern und die Morgenroutine am Bett.
import assert from "node:assert/strict";
import { build } from "esbuild";

const b = await build({
  stdin: { resolveDir: process.cwd(), contents: `
    export { House } from './src/game/house';
    export { drawLuni, LUNI_COLORS } from './src/game/luni';
    export { zeichneLuniFein } from './src/game/luni-fein';
    export { zahnbild, ZAHN_MORGEN } from './src/game/zahnpflege';` },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
const speicher = new Map();
globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
const flaeche = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
globalThis.document = { createElement: flaeche, visibilityState: "visible" };
globalThis.window = { devicePixelRatio: 1 };
const haus = () => new G.House(flaeche(), { welt: "normal", clock: { year: 2026, month: 11, day: 22, hour: 15, min: 12 } });
let n = 0;
const test = (name, f) => { f(); n++; console.log(`OK  ${name}`); };

/** Zeichenfläche, die nur mitschreibt, mit welchen Farben Rechtecke gefüllt werden. */
function aufnahme() {
  const fuellungen = [];
  const ziel = { fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1, font: "", textAlign: "", lineCap: "", lineJoin: "" };
  return new Proxy(ziel, {
    get(o, k) {
      if (k === "fuellungen") return fuellungen;
      if (k in o) return o[k];
      if (k === "measureText") return () => ({ width: 10 });
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} });
      if (k === "fillRect") return () => fuellungen.push(String(o.fillStyle));
      if (k === "fill") return () => fuellungen.push(String(o.fillStyle));
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}
const SCHWARZ = "#25222b", WEISS = "#f4f1ea", LILA = "#7b4fb0";
const ringe = (opts, fein = false) => {
  const c = aufnahme();
  (fein ? G.zeichneLuniFein : G.drawLuni)(c, 60, 120, { t: 0.3, scale: 2, shadow: false, face: 1, state: "idle", ...opts });
  return c.fuellungen.filter((f) => f === SCHWARZ).length;
};
const schlafanzug = { top: "#6c8fd0", bottom: "#3f6f8c", flausch: false };

test("Die Standard-Socken sind fein geringelt in Lila, Weiß und Schwarz (drei Farben je Paar)", () => {
  for (const s of [G.LUNI_COLORS.sockL, G.LUNI_COLORS.sockR]) {
    assert.equal(s.length, 3);
    assert.ok(s[0].startsWith("#7") && s[1] === WEISS && s[2] === SCHWARZ, `Lila, Weiß, Schwarz: ${s}`);
  }
  assert.notEqual(G.LUNI_COLORS.sockL[0], G.LUNI_COLORS.sockR[0], "beide Füße bleiben für die Zeichentests unterscheidbar");
});

test("Socken ohne Angabe wie bisher: Alltag trägt sie, der Schlafanzug ist barfuß", () => {
  assert.ok(ringe({}) > 0, "Alltagskleidung: Socken sichtbar");
  assert.equal(ringe({ pajama: schlafanzug }), 0, "Schlafanzug ohne Angabe: barfuß");
});

test("socken: true/false und je Fuß schalten die Socken, auch im Schlafanzug und im Fein-Studio", () => {
  for (const fein of [false, true]) {
    const beide = ringe({ pajama: schlafanzug, socken: true }, fein);
    assert.ok(beide > 0, `Schlafanzug + Socken: Ringe sichtbar (fein=${fein})`);
    assert.equal(ringe({ pajama: schlafanzug, socken: false }, fein), 0, `barfuß (fein=${fein})`);
    assert.equal(ringe({ pajama: schlafanzug, socken: [true, false] }, fein) * 2, beide, `nur ein Fuß trägt eine Socke (fein=${fein})`);
    assert.equal(ringe({ pajama: schlafanzug, socken: [false, true] }, fein) * 2, beide, `der andere Fuß allein (fein=${fein})`);
    assert.equal(ringe({ socken: false }, fein), 0, `Alltagskleidung barfuß (fein=${fein})`);
  }
  assert.equal(ringe({ outfit: "towel", socken: true }), 0, "im Handtuch sind die Socken aus");
});

test("Morgens: erst Weste, dann Socken aus dem Schrank, auf die Bettkante, anziehen, aufstehen", () => {
  speicher.clear();
  const h = haus();
  assert.equal(h.sockenAn, true, "neues Haus: Socken an");
  h.command("stein_aufsteh");
  assert.equal(h.sockenAn, false, "im Schlafanzug barfuß");
  const bett = [], schritte = [];
  let westeVorSocken = null, handVorBett = false, schrankOffen = 0;
  for (let i = 0; i < 40000; i++) {
    h.update(0.05);
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (w && schritte.at(-1) !== w) schritte.push(w);
    if (w === "sockenNehmen" && westeVorSocken === null) westeVorSocken = h.westeAn;
    if (h.sockenInHand && !h.sockenBett) handVorBett = true;
    if (h.wardrobeOpen > 0.9) schrankOffen++;
    if (h.sockenBett && bett.at(-1) !== h.sockenBett) bett.push(h.sockenBett);
    if (h.sockenAn && !h.kAblauf && !h.sockenBett) break;
  }
  assert.equal(westeVorSocken, true, "die Weste ist vorher angezogen");
  assert.deepEqual(bett, ["setzen", "anziehen", "aufstehen"]);
  assert.deepEqual(schritte.filter((s) => s.startsWith("socken") || s.endsWith("Socken")),
    ["zumSchrankSocken", "sockenNehmen", "zumBettSocken", "sockenSetzen", "sockenAnziehen", "sockenAufstehen"]);
  assert.ok(handVorBett, "mit den Socken in der Hand zum Bett");
  assert.ok(schrankOffen > 0 && h.wardrobeOpen === 0, "Schrank war offen und ist wieder zu");
  assert.equal(h.sockenAn, true, "danach trägt sie die Socken");
  assert.equal(h.sockenInHand, false);
});

test("Abends: mit dem Umziehen (Handtuch) sind die Socken aus und bleiben es bis zum nächsten Morgen", () => {
  speicher.clear();
  const h = haus();
  h.outfit = "towel"; h.update(0.05);
  assert.equal(h.sockenAn, false);
  h.outfit = "dressed";   // Schlafanzug an: weiter barfuß
  for (let i = 0; i < 200; i++) h.update(0.05);
  assert.equal(h.sockenAn, false, "im Schlafanzug bleibt sie barfuß");
});

test("Socken-Zustand wird gespeichert; ältere Stände ohne Angabe gelten als angezogen", () => {
  speicher.clear();
  const h = haus(); h.sockenAn = false; h.speichern();
  const schluessel = [...speicher.keys()].find((k) => k.startsWith("lcp1.welt.normal"));
  assert.ok(schluessel, "Stand gespeichert");
  assert.equal(haus().sockenAn, false, "barfuß bleibt barfuß");
  const stand = JSON.parse(speicher.get(schluessel)); delete stand.sockenAn; speicher.set(schluessel, JSON.stringify(stand));
  assert.equal(haus().sockenAn, true, "ohne Angabe: Socken an");
});

test("Klick des Spielers bricht das Socken-Anziehen ab: Schrank zu, nichts in der Hand; später macht sie weiter", () => {
  speicher.clear();
  const h = haus();
  h.command("stein_aufsteh");
  for (let i = 0; i < 40000 && !(h.kAblauf?.schritte[h.kAblauf.i]?.was === "sockenNehmen" && h.wardrobeOpen > 0.9); i++) h.update(0.05);
  assert.ok(h.wardrobeOpen > 0.9, "Schrank steht offen");
  h.nutzerEingabe = true; h.command("sofa"); h.nutzerEingabe = false;
  assert.equal(h.sockenLauf, false); assert.equal(h.sockenBett, null);
  assert.equal(h.sockenInHand, false); assert.equal(h.wardrobeOpen, 0);
  assert.equal(h.sockenAn, false, "noch barfuß");
  assert.equal(h.morgenKette, null, "die Kette vom Stein ist verworfen");
  let fertig = false;
  for (let i = 0; i < 60000; i++) { h.update(0.05); if (h.sockenAn && !h.kAblauf) { fertig = true; break; } }
  assert.ok(fertig, "nach dem Sofa holt sie die Socken nach");
});

test("Socke wird über den Fuß gezogen: Zahl 0..1 je Fuß – erst die Ringe von den Zehen her, zuletzt das Bündchen", () => {
  const BUENDCHEN = "#f1ece6";
  const zaehle = (socken, farbe) => { const c = aufnahme(); G.drawLuni(c, 60, 120, { t: 0.3, scale: 2, shadow: false, face: 1, state: "idle", pajama: schlafanzug, socken }); return c.fuellungen.filter((f) => f === farbe).length; };
  assert.equal(zaehle([0, 0], SCHWARZ), 0, "0: nackter Fuß");
  assert.ok(zaehle([0.5, 0], SCHWARZ) > 0, "halb: Ringe sichtbar");
  assert.equal(zaehle([0.5, 0], BUENDCHEN), 0, "halb: das Bündchen fehlt noch");
  assert.ok(zaehle([0.85, 0], BUENDCHEN) > 0, "fast fertig: das Bündchen rutscht über den Knöchel");
  assert.equal(zaehle([1, 1], SCHWARZ), zaehle(true, SCHWARZ), "1 entspricht true");
  assert.equal(zaehle([0.5, 0.5], SCHWARZ), 2 * zaehle([0.5, 0], SCHWARZ), "beide Füße einzeln gesteuert");
});

test("Aufsteh-Stein: Kette vom Aufwachen bis zu den zwei Kaffees – Socken, Handy holen, Stopfen beim Kochen, Pause", () => {
  speicher.clear();
  const h = haus(); h.pack = 0; h.cigs = 0;
  h.command("stein_aufsteh");
  const folge = [];
  const zufall2 = Math.random; Math.random = () => 0.5;
  for (let i = 0; i < 60000; i++) {
    h.update(0.05);
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (w && folge.at(-1) !== w) folge.push(w);
    if (i > 400 && !h.kAblauf && !h.tagAktiv && !h.bedWach) break;
  }
  Math.random = zufall2;
  const pos = (x, ab = 0) => folge.indexOf(x, ab);
  const reihe = ["brilleAufsetzen", "zumSchrankSocken", "sockenAnziehen", "sockenAufstehen", "zumNachttischHandy", "handyHolen", "tankNehmen",
    "power", "zumTisch", "stopfen", "aufheizen", "knopfLinks", "vibrierZurueck1", "vibrierVor", "rauchen", "nebenSpuele",
    "zumPausenstuhl", "pauseFenster", "pauseAufstehen", "aufheizen", "rauchen"];
  let ab = 0;
  for (const x of reihe) { const i = pos(x, ab); assert.ok(i >= 0, `Schritt fehlt oder falsch einsortiert: ${x}\n${folge.join(", ")}`); ab = i + 1; }
  assert.equal(folge.filter((x) => x === "rauchen").length, 2, "zwei Kaffees mit Rauchen in der Schleuse");
  assert.equal(folge.filter((x) => x === "stopfen").length, 1, "die beiden Zigaretten werden einmal gestopft");
  assert.equal(h.handyOrt, "tasche", "das Handy steckt in der Tasche");
  assert.equal(h.sockenAn, true);
  assert.equal(h.tagErledigt.kaffee !== undefined, true, "der Morgenkaffee gilt als erledigt");
});

test("Aufsteh-Stein mit vollem Vorrat: kein Stopfen, aber Handy holen und Pause sind dabei", () => {
  speicher.clear();
  const h = haus(); h.pack = 4;
  h.command("stein_aufsteh");
  const folge = [];
  for (let i = 0; i < 60000; i++) {
    h.update(0.05);
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
    if (w && folge.at(-1) !== w) folge.push(w);
    if (i > 400 && !h.kAblauf && !h.tagAktiv && !h.bedWach) break;
  }
  assert.ok(!folge.includes("stopfen"), "Vorrat da: nicht stopfen");
  assert.ok(folge.includes("handyHolen") && folge.includes("pauseFenster"));
  assert.equal(h.kaffee.tassenSpuele + h.kaffee.tassenUnten, 2, "beide Tassen gehören dazu");
});

test("Schaum beim Putzen ist um ein Drittel reduziert", () => {
  const voll = G.zahnbild("zGurgeln", G.ZAHN_TAKTE ? 8 : 8, 632, 324, 8).schaum;
  assert.ok(Math.abs(voll - 2 / 3) < 1e-6, `Gurgel-Schaum = 2/3 (ist ${voll.toFixed(3)})`);
  const putz = G.zahnbild("zPutzen", 12, 632, 324, 40).schaum;
  assert.ok(putz > 0 && putz <= 2 / 3 + 1e-6, `Putz-Schaum bleibt unter 2/3 (ist ${putz.toFixed(3)})`);
});

test("Morgens nach den Tassen: Bad-Reihenfolge – Kamera, dann Rücken, Wasser aus der Hand, Mundwasser, Gurgeln, ausspucken", () => {
  speicher.clear();
  const h = haus(); h.pack = 0; h.cigs = 0;
  h.command("stein_aufsteh");
  const reihe = [], ruecken = {};
  let letzter = "", fertig = false;
  for (let i = 0; i < 60000; i++) {
    h.update(0.05);
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was ?? "";
    if (w !== letzter) {
      letzter = w;
      if (/^zahn:|zumBadZaehne|nebenSpuele/.test(w)) reihe.push(w);
      if (w === "zahnFertig") fertig = true;
    }
    const zb = h.zahnMorgen ? h.zahnpflegeBild?.() ?? null : null;
    if (h.zahnMorgen) ruecken[h.zahnMorgen.ph] = !!zb?.ruecken;
  }
  assert.ok(fertig, "der Zahn-Ablauf läuft zu Ende");
  const netto = reihe.filter((x) => x !== "zumBadZaehne");
  assert.ok(netto.indexOf("nebenSpuele") < netto.indexOf("zahn:zNehmen"), "erst die Tassen versorgen, dann ins Bad");
  const erwartet = ["zahn:zNehmen", "zahn:zPaste", "zahn:zPutzen", "zahn:zSpucken", "zahn:zHandWasser",
    "zahn:zMundNehmen", "zahn:zMundSpuelen", "zahn:zMundSpucken", "zahn:zZurueck"];
  let ab = 0;
  for (const x of erwartet) { const i = netto.indexOf(x, ab); assert.ok(i >= 0, `Schritt fehlt oder falsch einsortiert: ${x}\n${netto.join(", ")}`); ab = i + 1; }
  assert.equal(ruecken.zNehmen, false, "am Anfang schaut sie in die Kamera");
  assert.equal(ruecken.zPutzen, false, "beim Putzen noch vorn");
  for (const ph of ["zSpucken", "zHandWasser", "zMundSpuelen", "zMundSpucken"]) assert.equal(ruecken[ph], true, `${ph}: Rücken zum Spieler`);
  assert.equal(h.cabinetOpen, 0, "der Spiegelschrank ist am Ende wieder zu");
});

test("Zigaretten für den Morgenkaffee: beim Gang in die Schleuse hat sie zwei – auch mit leerem Vorrat", () => {
  for (const anfang of [0, 1, 5]) {
    speicher.clear();
    const h = haus(); h.pack = anfang; h.cigs = 0;
    h.command("stein_aufsteh");
    let beimRunter = null;
    const zufall3 = Math.random; Math.random = () => 0.5;
    for (let i = 0; i < 60000; i++) {
      h.update(0.05);
      const w = h.kAblauf?.schritte[h.kAblauf.i]?.was;
      if (beimRunter === null && (w === "zumRaucherraum" || w === "rauch")) beimRunter = h.pack + h.cigs;
      if (beimRunter !== null && !h.kAblauf && i > 400) break;
    }
    Math.random = zufall3;
    assert.ok(beimRunter >= 2, `Start ${anfang}: mindestens zwei Zigaretten beim Runtergehen (waren ${beimRunter})`);
  }
});

test("Adventshaus mit dem alten Automaten: zwei Tassen und danach die Zahn-Pflege", () => {
  speicher.clear();
  const h = new G.House(flaeche(), { welt: "adventshaus", clock: { year: 2026, month: 11, day: 22, hour: 15, min: 12 } });
  h.pack = 0; h.cigs = 0;
  h.command("stein_aufsteh");
  const reihe = [];
  let letzter = "", fertig = false;
  const zufall = Math.random; Math.random = () => 0.5;   // feste Zufallswerte: Tür- und Tassenregeln bleiben reproduzierbar
  for (let i = 0; i < 60000; i++) {
    h.update(0.05);
    const w = h.kAblauf?.schritte[h.kAblauf.i]?.was ?? "";
    if (w !== letzter) { letzter = w; if (/^zahn:/.test(w)) reihe.push(w); if (w === "zahnFertig") fertig = true; }
    if (fertig && !h.kAblauf && i > 400) break;
  }
  Math.random = zufall;
  assert.ok(fertig, "auch am Automaten putzt sie sich morgens die Zähne");
  assert.ok(reihe.includes("zahn:zMundSpuelen") && reihe.includes("zahn:zHandWasser"), reihe.join(", "));
});

console.log(`\n${n} Socken-Tests bestanden.`);
