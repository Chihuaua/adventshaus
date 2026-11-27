import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const source = readFileSync("src/game/house.ts", "utf8");
const b = await build({
  stdin: { contents: source + '\nexport { drawHouse, micStand };\nexport * from "./tv";\nexport * from "./tv-sendungen";\nexport { drawSternennacht, STERNENNACHT_FARBEN, STERNENNACHT_STERNE, sternenLicht, staubImRaum } from "./sternennacht";\nexport { TVKlang } from "./audio/tvVoice";\nexport { sfx } from "./audio";\nexport * from "./audio/riroNoten";\nexport { createState as neuesGOL } from "./gol";',
    resolveDir: path.resolve("src/game"), loader: "ts" },
  bundle: true, write: false, platform: "node", format: "esm",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
let n = 0;
const test = (name, run) => { run(); n++; console.log(`OK  ${name}`); };
function canvas() {
  const ops = [], stack = [];
  let pfad = [];
  const m = { fillStyle: "#000", strokeStyle: "#000", globalAlpha: 1,
    save() { stack.push([this.fillStyle, this.strokeStyle, this.globalAlpha]); },
    restore() { [this.fillStyle, this.strokeStyle, this.globalAlpha] = stack.pop(); },
    beginPath() { pfad = []; },
    moveTo(x, y) { pfad.push([x, y]); }, lineTo(x, y) { pfad.push([x, y]); },
    quadraticCurveTo(...p) { pfad.push(p); }, bezierCurveTo(...p) { pfad.push(p); },
    roundRect(x, y, w, h) { pfad.push([x, y, w, h]); }, rect(x, y, w, h) { pfad.push([x, y, w, h]); },
    arc(x, y, r) { pfad.push([x, y, r]); }, ellipse(...p) { pfad.push(p); },
    fill() { ops.push({ art: "fill", farbe: this.fillStyle, pfad: [...pfad] }); },
    stroke() { ops.push({ art: "stroke", farbe: this.strokeStyle, pfad: [...pfad] }); },
    fillRect(x, y, w, h) { ops.push({ art: "rect", farbe: this.fillStyle, x, y, w, h }); },
    fillText(text, x, y) { ops.push({ art: "text", text, x, y, font: this.font, farbe: this.fillStyle }); },
    measureText(text) { return { width: text.length * 6 }; },
    createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
    createLinearGradient() { return { addColorStop() {} }; }, createRadialGradient() { return { addColorStop() {} }; },
  };
  return { ops, ctx: new Proxy(m, { get(o, k) { return k in o ? o[k] : () => {}; } }) };
}
function haus() {
  return Object.assign(Object.create(G.House.prototype), {
    tvZoom: "tv_e", tvManual: { tv_e: true, tv_d: true }, tvMode: "cozy", tvStand: G.neuerTVStand(),
    tvKlang: {}, tvFernHover: null, tvFernFokus: null, activity: null, cur: null, harvestClock: 5,
    golInserted: false, golState: null, harvestCrops: [0, 0, 0, 0, 0, 0], harvestSpot: 0,
    harvestFrom: 0, harvestTo: 0, harvestMoveT: 0, harvestMoving: false, harvestCoins: 0,
    elapsed: 5, rickTried: true, rickImg: null, speichern() {},
  });
}

test("Tapeten sind pro Hauswelt getrennt", () => {
  const malen = (weihnacht, gr = null) => {
    const c = canvas(); G.drawHouse(c.ctx, {}, { open: 0 }, true, gr, false, undefined, weihnacht);
    return c.ops;
  };
  const normal = malen(false), winter = malen(true);
  const wand = (ops, x, farbe) => ops.some(o => o.art === "rect" && o.x === x && o.y === 30 && o.farbe === farbe);
  assert.ok(wand(normal, 530, "#9a5750"), "normales Musikzimmer wieder rot gestreift");
  assert.ok(wand(normal, 262, "#4a4f92"), "normales Gamingzimmer bleibt violett");
  assert.ok(!wand(normal, 530, "#2c4638") && !wand(normal, 262, "#5a1a1f"));
  assert.ok(wand(winter, 530, "#2c4638"), "Weihnachts-Musikzimmer gruen");
  assert.ok(wand(winter, 262, "#5a1a1f"), "Weihnachts-Gamingzimmer in ruhigem Bordeaux");
  assert.ok(wand(malen(true, {}), 530, "#9a5750"), "Gruselhaus bleibt unveraendert");
});

test("TV-Fernbedienung: sichere, getrennte Tasten mit passenden Treffern", () => {
  for (const a of G.TV_FERN_STATIONS) {
    assert.ok(a.w >= 24 && a.h >= 24);
    assert.ok(a.x >= 96 && a.x + a.w <= 864 && a.y >= 30 && a.y + a.h <= 570);
    assert.equal(G.tvFernTreffer(a.x + a.w / 2, a.y + a.h / 2), a.id);
    for (const b of G.TV_FERN_STATIONS) if (a !== b) {
      assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
    }
  }
  assert.equal(G.tvFernTreffer(480, 240), null);
});

test("Beide TV-Vergroesserungen zeigen die Fernbedienung auch im Standby", () => {
  const h = haus();
  for (const id of ["tv_e", "tv_d"]) for (const an of [false, true]) {
    h.tvZoom = id; h.tvManual[id] = an;
    const c = canvas(); h.drawTvFullscreen(c.ctx);
    assert.ok(c.ops.some(o => o.text === "FERNBEDIENUNG"));
    for (const key of ["P -", "P +", "VOL -", "VOL +", "MUTE", "I/O"]) assert.ok(c.ops.some(o => o.text === key), key);
  }
});

test("TV: Kanaltasten schalten wirklich um, unabhaengig je Geraet", () => {
  const h = haus();
  const wzListe = G.tvKanaele("tv_e", false);
  assert.equal(wzListe[0], "musik", "das TV-Programm beginnt ohne Spiel beim Musikvideo");
  assert.ok(!wzListe.includes("garten") && !G.TV_SENDUNGEN.includes("werkstatt"), "Garten-Spiel und Werkstatt-Zeitraffer sind entfernt");
  h.tvBefehl("kanal_hoch"); assert.equal(h.tvContent("tv_e"), "sterne");
  assert.equal(h.tvContent("tv_d"), "musik", "der zweite Fernseher bleibt unabhängig beim Musikvideo");
  h.tvBefehl("kanal_hoch"); assert.equal(h.tvContent("tv_e"), "malfreude");
  for (let i = 0; i < wzListe.length - 2; i++) h.tvBefehl("kanal_hoch");
  assert.equal(h.tvContent("tv_e"), "musik", "ein voller Umlauf über alle 12 Sendungen kehrt zum Musikvideo zurück");
  h.tvBefehl("kanal_runter"); assert.equal(h.tvContent("tv_e"), "quizshow");
  h.tvZoom = "tv_d";
  const dgListe = G.tvKanaele("tv_d", false);
  for (let i = 0; i < dgListe.length - 1; i++) h.tvBefehl("kanal_hoch");
  assert.equal(h.tvContent("tv_d"), "konsole");
  h.tvBefehl("kanal_hoch"); assert.equal(h.tvContent("tv_d"), "musik", "ohne Modul kein GOL");
  h.golInserted = true; h.golState = G.neuesGOL(0);
  const cells = h.golState.cells;
  h.tvBefehl("kanal_runter"); assert.equal(h.tvContent("tv_d"), "gol");
  h.tvBefehl("kanal_hoch"); h.tvBefehl("kanal_runter");
  assert.equal(h.golState.cells, cells, "Senderwechsel setzt das laufende Spiel nicht zurueck");
  h.golBuf = { width: 0, height: 0, getContext: () => canvas().ctx }; h.golMeterT = 0;
  const c = canvas(); h.drawTvFullscreen(c.ctx);
  assert.ok(c.ops.some(o => o.text === "FERNBEDIENUNG"), "auch beim Spiel des Lebens");
  for (const o of c.ops.filter(o => o.art === "text" && o.x === 120 && o.y >= 480)) {
    assert.ok(o.x + c.ctx.measureText(o.text).width < 636 && o.y <= 566, "Regeln bleiben neben der Fernbedienung lesbar");
  }
});

test("NMS: helles Bild mit genau einer Person, ruhige Szene und sehr langsames Sternenlicht", () => {
  assert.equal(G.TV_KANAL_NAMEN.sterne, "NMS", "das helle Bild heisst NMS");
  assert.deepEqual(G.tvKanaele("tv_e", false), ["musik", "sterne", ...G.TV_SENDUNGEN]);
  assert.deepEqual(G.tvKanaele("tv_d", false), ["musik", "sterne", ...G.TV_SENDUNGEN, "konsole"]);
  assert.ok(!("sterne_hell" in G.TV_KANAL_NAMEN), "der Zweitkanal NMS 2 ist entfernt");
  assert.equal(G.leseTVStand({ tv_e: { kanal: "sterne", lautstaerke: 40 } }).tv_e.kanal, "sterne");
  assert.equal(G.leseTVStand({ tv_d: { kanal: "sterne_hell", lautstaerke: 30 } }).tv_d.kanal, "sterne",
    "wer NMS 2 eingestellt hatte, landet auf NMS");
  // Nicht wieder zu dunkel: jede Grundflaeche liegt mindestens 20 % ueber dem Messwert der hellen Vorlage.
  const lum = hex => { const n = parseInt(hex.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); };
  const vorlage = { himmelLinks: "#3d5a80", himmelRechts: "#213766", berg: "#0e1c32", boden: "#0f2238", deck: "#1e2d51" };
  for (const [name, farbe] of Object.entries(vorlage)) {
    assert.ok(lum(G.STERNENNACHT_FARBEN[name]) >= lum(farbe) * 1.2, `${name} heller als die Vorlage`);
  }
  assert.ok(G.STERNENNACHT_STERNE.length >= 220);
  assert.ok(G.STERNENNACHT_STERNE.every(s => s.r >= 1.6 && s.periode >= 28 && s.periode <= 66),
    "Sterne gross genug fuer die TV-Flaeche und langsam");
  for (const s of G.STERNENNACHT_STERNE) {
    const a = G.sternenLicht(s, 12);
    assert.ok(a > 0 && a <= 1);
    assert.ok(Math.abs(G.sternenLicht(s, 12.05) - a) < 0.02, "kein schnelles Flackern");
    assert.ok(Math.abs(G.sternenLicht(s, 12 + s.periode) - a) < 1e-10, "sanfter, reproduzierbarer Zyklus");
  }
  const sternFarbe = f => f.startsWith("rgba(226,238,255,") || f.startsWith("rgba(255,236,214,");
  const staubFarben = new Set(G.staubImRaum(0, 0, 0, 1568, 876).map(k => `rgba(${k.rgb},.95)`));
  for (const [w, h] of [[40, 26], [72, 30], [560, 364]]) {
    const a = canvas(), b = canvas();
    G.drawSternennacht(a.ctx, 0, 0, w, h, 5);
    G.drawSternennacht(b.ctx, 0, 0, w, h, 25);
    assert.ok(a.ops.length > 600, `${w}x${h}: vollstaendige Szene statt Platzhalter`);
    assert.equal(a.ops.length, b.ops.length, "keine Form kommt hinzu oder verschwindet");
    assert.ok(!a.ops.some(o => o.farbe === "rgba(0,0,0,.12)"), "keine Scanlines");
    const anders = a.ops.filter((o, i) => typeof o.farbe === "string" && o.farbe !== b.ops[i].farbe);
    assert.ok(anders.filter(o => sternFarbe(o.farbe)).length > 100, "die Sterne leuchten ueber die Zeit anders");
    assert.ok(anders.every(o => sternFarbe(o.farbe) || staubFarben.has(o.farbe)), "Landschaft und Raumfahrer bleiben unveraendert");
    const sterne = ops => ops.filter(o => typeof o.farbe === "string" && sternFarbe(o.farbe)).map(o => o.pfad);
    assert.deepEqual(sterne(a.ops), sterne(b.ops), "alle Sterne und ihre Strahlen bleiben am selben Ort");
    assert.equal(a.ops.filter(o => o.farbe === "#8fe4ff").length, 1, "genau ein Helm mit Lampe: nur eine Person im Bild");
  }
  const h = haus();
  const c = canvas(); h.drawTvProgram(c.ctx, 0, 0, 40, 26, "sterne");
  assert.ok(c.ops.length > 600 && !c.ops.some(o => o.farbe === "rgba(0,0,0,.12)"), "Haus zeigt NMS ohne Scanlines");
});

test("NMS: Die profilierte Stiefelunterseite liegt im vermessenen Ausschnitt hinter der Hose", () => {
  const c = canvas(); G.drawSternennacht(c.ctx, 0, 0, 1568, 876, 0);
  const kontur = (op, soll) => {
    if (op.art !== "fill" || op.pfad.length < 10) return false;
    const coords = op.pfad.flat(), x = coords.filter((_, i) => i % 2 === 0), y = coords.filter((_, i) => i % 2 !== 0);
    return [Math.min(...x), Math.min(...y), Math.max(...x), Math.max(...y)].every((v, i) => Math.abs(v - soll[i]) <= 5);
  };
  const sohle = c.ops.findIndex(op => kontur(op, [847, 756, 1019, 833]));
  const hose = c.ops.findIndex(op => kontur(op, [880, 590, 1266, 826]));
  assert.ok(sohle >= 0 && hose > sohle, "die Hose ueberdeckt den Stiefelschaft, nicht umgekehrt");
  const rippen = c.ops.slice(sohle + 1, hose).filter(op => op.art === "stroke" && op.pfad.length === 2 &&
    op.pfad[0][1] >= 759 && op.pfad[0][1] <= 812 && op.pfad[1].at(-2) - op.pfad[0][0] > 40);
  assert.ok(rippen.length >= 6, "quer verlaufende Profilrippen unter Ballen und Ferse");
});

test("NMS: Senderkennung steht an der Stelle von CH1 in dessen Schrift", () => {
  const h = haus();
  for (const [x, y, w, hoehe] of [[445, 395, 40, 26], [410, 137, 54, 34], [0, 0, 40, 26], [0, 0, 72, 30]]) {
    const kennung = (modus, name) => {
      const c = canvas(); h.drawTvProgram(c.ctx, x, y, w, hoehe, modus);
      const texte = c.ops.filter(o => o.art === "text");
      if (modus === "sterne") assert.deepEqual(texte.map(o => o.text), ["NMS"]);
      return texte.find(o => o.text === name);
    };
    const alt = kennung("musik", "CH1"), nms = kennung("sterne", "NMS");
    assert.ok(alt && nms);
    assert.deepEqual(nms, { ...alt, text: "NMS" });
    assert.equal(nms.x, x + 2); assert.equal(nms.y, y + 5);
    assert.equal(nms.font, '700 4px "Silkscreen", monospace');
  }
});

test("NMS: Acht eigene Flugbahnen, sanfte Tiefenwechsel und unsichtbarer Randumlauf", () => {
  for (const [w, h] of [[1568, 876], [960, 720], [720, 300]]) {
    const s = Math.min(w / 1568, h / 876);
    const links = (1568 - w / s) / 2, rechts = links + w / s;
    const oben = (876 - h / s) / 2, unten = oben + h / s;
    const innen = ({ x, y }) => x >= links && x <= rechts && y >= oben && y <= unten;
    const bild = t => G.staubImRaum(t, links, oben, w / s, h / s);
    const nachId = t => bild(t).sort((a, b) => a.id - b.id);
    const rein = new Set(), raus = new Set();
    let a = nachId(0);
    assert.equal(a.length, 8);
    const klein = a.map(k => k.r), gross = [...klein];
    const c = canvas(); G.drawSternennacht(c.ctx, 0, 0, w, h, 21);
    const kerne = c.ops.filter(o => o.art === "fill" && o.pfad[0]?.length === 3 &&
      typeof o.farbe === "string" && o.farbe.endsWith(",.95)"));
    assert.deepEqual(kerne.map(o => o.pfad[0]), bild(21).map(k => [k.x, k.y, k.r]), "Kerne in echter Tiefenreihenfolge gezeichnet");
    assert.ok(bild(21).some(k => k.vorn) && bild(21).some(k => !k.vorn));
    const phasen = a.map((k, i) => [21, 65].map(t => (nachId(t)[i].r / k.r).toFixed(3)).join("/"));
    assert.equal(new Set(phasen).size, a.length, "kein gemeinsames Aufpumpen aller Partikel");
    for (let t = 2; t <= 900; t += 2) {
      const b = nachId(t);
      assert.equal(b.length, a.length);
      for (let i = 0; i < a.length; i++) {
        const { x: ax, y: ay } = a[i], { x: bx, y: by, r } = b[i];
        klein[i] = Math.min(klein[i], r); gross[i] = Math.max(gross[i], r);
        assert.ok(Math.abs(r - a[i].r) < 0.09, "Tiefe aendert sich langsam");
        if (!innen(a[i]) && innen(b[i])) rein.add(i);
        if (innen(a[i]) && !innen(b[i])) raus.add(i);
        const saum = Math.max(a[i].lichtsaum, b[i].lichtsaum);
        if (Math.abs(bx - ax) > w / s / 2) {
          assert.ok(Math.min(ax, bx) < links - saum && Math.max(ax, bx) > rechts + saum, "Lichtsaum beim Seitenwechsel ausserhalb");
        } else if (Math.abs(by - ay) > h / s / 2) {
          assert.ok(Math.min(ay, by) < oben - saum && Math.max(ay, by) > unten + saum, "kein Sprung am oberen/unteren Rand");
        } else {
          const weg = Math.hypot(bx - ax, by - ay);
          assert.ok(weg > 2 && weg < 12, "stetiger langsamer Durchzug, auch auf den schraegen Bahnen");
        }
      }
      a = b;
    }
    assert.equal(rein.size, 8); assert.equal(raus.size, 8);
    assert.ok(klein.every((r, i) => gross[i] > 1.2 * r && gross[i] < 1.45 * r), "jedes Korn wird behutsam groesser und kleiner");
    assert.deepEqual(a, nachId(900), "Position und Tiefe sind unabhaengig von der Bildrate");
  }
});

test("TV: Lautstaerke bleibt zwischen 0 und 100, Power und Maus funktionieren", () => {
  const h = haus();
  for (let i = 0; i < 20; i++) h.tvBefehl("leiser");
  assert.equal(h.tvDaten.tv_e.lautstaerke, 0);
  assert.equal(h.tvDaten.tv_d.lautstaerke, 50);
  for (let i = 0; i < 20; i++) h.tvBefehl("lauter");
  assert.equal(h.tvDaten.tv_e.lautstaerke, 100);
  h.tvBefehl("power"); assert.equal(h.tvContent("tv_e"), "off");
  const next = G.TV_FERN_STATIONS.find(s => s.id === "kanal_hoch");
  h.onTvFullscreenClick(next.x + 10, next.y + 10);
  assert.equal(h.tvContent("tv_e"), "sterne", "Kanaltaste schaltet TV wieder ein");
  h.openTvZoom("tv_d"); h.openTvZoom("tv_e");
  assert.equal(h.tvDaten.tv_e.lautstaerke, 100, "beim Schliessen/Oeffnen bleibt der Pegel");
});

test("TV-Speicher: getrennte Werte, alte Staende und ungueltige Daten", () => {
  const leer = G.neuerTVStand(); assert.notEqual(leer.tv_e, leer.tv_d);
  assert.equal(leer.tv_e.stumm, null, "Standard je Kanal: NMS & CH1 mit Ton, Sendungen stumm");
  assert.equal(G.tvStandardStumm("sterne"), false);
  assert.equal(G.tvStandardStumm("musik"), false);
  assert.equal(G.tvStandardStumm("malfreude"), true);
  const geladen = G.leseTVStand({ tv_e: { kanal: "musik", lautstaerke: 170 }, tv_d: { kanal: "falsch", lautstaerke: -20 } });
  assert.deepEqual(geladen, { tv_e: { kanal: "musik", lautstaerke: 100, stumm: null }, tv_d: { kanal: null, lautstaerke: 0, stumm: null } });
  assert.equal(G.leseTVStand({ tv_e: { kanal: "garten" } }).tv_e.kanal, "musik", "alter Garten-Kanal wird zum Musikvideo");
  assert.equal(G.leseTVStand({ tv_e: { stumm: false } }).tv_e.stumm, false, "freigegebener Ton bleibt gespeichert");
  assert.deepEqual(G.leseTVStand(null), leer);
  assert.deepEqual(G.leseTVStand({ tv_e: { lautstaerke: NaN } }), leer);
  assert.deepEqual(G.leseTVStand(JSON.parse(JSON.stringify(geladen))), geladen);
});

test("Musikvideo: waagerechte Scanlines liegen hinter dem Saenger", () => {
  const h = haus();
  for (const mode of ["musik", "cozy"]) {
    h.harvestClock = 35;
    const c = canvas(); h.drawTvProgram(c.ctx, 0, 0, 40, 26, mode);
    const streifen = c.ops.map((o, i) => o.farbe === "rgba(0,0,0,.12)" ? i : -1).filter(i => i >= 0);
    const figur = c.ops.findIndex(o => o.farbe === "#23232e");
    assert.ok(streifen.length >= 8 && figur >= 0);
    assert.ok(Math.max(...streifen) < figur, "kein Streifen mehr vor Figur oder Gesicht");
  }
});

test("Mikrofon vor Luni und langsames Wiegen ohne verlangsamten Gesang", () => {
  assert.ok(source.indexOf("this.drawLuniLayered(ctx);") < source.indexOf("micStand(ctx, MIC_STAND_X, FD)"));
  assert.ok(source.indexOf("drawKerzenlicht(ctx,") < source.indexOf("micStand(ctx, MIC_STAND_X, FD)"));
  assert.ok(source.includes("gesangsBewegung = mt / 4;"));
  assert.ok(source.includes("singOpen = froschMundOffen(mt);"), "Mund bleibt mit dem unverlangsamten Lied synchron");
});

test("TV-Audio: eigener Gain, wirkliche Stummschaltung und sauberes Beenden", () => {
  const gains = [], quellen = [];
  const ctx = { currentTime: 1,
    createGain() {
      const g = { gain: { value: 0, setTargetAtTime(v) { this.value = v; }, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
      gains.push(g); return g;
    },
    createOscillator() { const o = { frequency: { value: 0 }, connect() {}, disconnect() {}, start() {}, stop() { this.beendet = true; } }; quellen.push(o); return o; },
  };
  const master = { unveraendert: true };
  const klang = new G.TVKlang(ctx, master);
  try {
    klang.setze("musik", 50, 1);
    assert.equal(gains[0].gain.value, 0.15);
    assert.ok(quellen.length > 0);
    klang.setze("musik", 0, 1);
    assert.equal(gains[0].gain.value, 0);
    assert.deepEqual(master, { unveraendert: true });
    klang.setze(null, 0, 1);
    assert.ok(quellen.every(o => o.beendet));
  } finally { klang.dispose(); }
});

test("Musikvideo: riro.mid mit allen 297 MIDI-Noten, Akkorden und Wiederholung verknüpft", () => {
  assert.equal(G.RIRO_TICKS_PRO_SEKUNDE, 1920);
  assert.equal(G.RIRO_ENDE_TICK, 32947);
  assert.equal(G.RIRO_NOTEN.length, 297);
  assert.deepEqual(G.RIRO_NOTEN.slice(0, 4).map(n => n[2]), [56, 58, 61, 58], "Auftakt aus riro.mid");
  const akkord = G.RIRO_NOTEN.filter(n => n[0] === 998).map(n => n[2]);
  assert.deepEqual(akkord, [54, 61, 65, 70], "vierstimmiger Refrain-Akkord bei Tick 998");

  const gespielte = [], timer = new Set();
  const setzeTimer = globalThis.setInterval, loescheTimer = globalThis.clearInterval;
  globalThis.setInterval = f => { timer.add(f); return f; };
  globalThis.clearInterval = f => timer.delete(f);
  const ctx = {
    currentTime: 0,
    createGain() { return { gain: { value: 0, setTargetAtTime(v) { this.value = v; }, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; },
    createOscillator() {
      const o = { frequency: { value: 0 }, connect() {}, disconnect() {}, start(w) { this.wann = w; gespielte.push(this); }, stop(e) { this.ende = e; } };
      return o;
    },
  };
  const wz = new G.TVKlang(ctx, {}), dg = new G.TVKlang(ctx, {});
  try {
    wz.setze("musik", 60, 0);
    const erste = gespielte.length;
    assert.ok(erste >= 2, "sofortiger Einsatz der ersten Töne");
    dg.setze("musik", 30, 0);
    assert.equal(timer.size, 1, "gemeinsame Sendung für beide Fernseher");
    assert.equal(gespielte.length, erste, "kein doppelter Start");
    const runde = G.RIRO_ENDE_TICK / G.RIRO_TICKS_PRO_SEKUNDE + 0.08;
    for (let ms = 35; ms <= (runde + 0.3) * 1000; ms += 35) {
      ctx.currentTime = ms / 1000;
      for (const f of timer) f();
    }
    assert.ok(gespielte.length > G.RIRO_NOTEN.length, "vollständiger Durchlauf aller 297 Noten plus nahtlose Wiederholung");
    wz.pause(); dg.pause();
    assert.equal(timer.size, 0, "bei Pause kein laufender Timer");
  } finally {
    wz.dispose(); dg.dispose();
    globalThis.setInterval = setzeTimer; globalThis.clearInterval = loescheTimer;
  }
});

test("12 TV-Sendungen: jede Sendung entwickelt sich über 5 Minuten und lässt sich schalten", () => {
  assert.equal(G.TV_SENDUNGEN.length, 12);
  assert.equal(G.SENDUNG_DAUER, 300);
  for (const id of G.TV_SENDUNGEN) {
    assert.ok(G.TV_KANAL_NAMEN[id], `Name für ${id}`);
    assert.equal(G.leseTVStand({ tv_e: { kanal: id, lautstaerke: 45 } }).tv_e.kanal, id, `${id} speicherbar`);
    const a = canvas(), b = canvas(), e = canvas(), klein = canvas();
    G.drawTvSendung(a.ctx, 0, 0, 560, 364, id, 8, 20000);
    G.drawTvSendung(b.ctx, 0, 0, 560, 364, id, 150, 20000);
    G.drawTvSendung(e.ctx, 0, 0, 560, 364, id, 285, 20000);
    G.drawTvSendung(klein.ctx, 0, 0, 40, 26, id, 90, 20000);
    assert.ok(a.ops.length > 10 && b.ops.length > 10 && e.ops.length > 10, `${id}: zeichnet in allen Akten`);
    assert.ok(klein.ops.length > 8, `${id}: zeichnet auch im kleinen Wohnzimmer-TV`);
    assert.notDeepEqual(a.ops, b.ops, `${id}: verändert sich bis zur Mitte`);
    assert.notDeepEqual(b.ops, e.ops, `${id}: verändert sich bis zum Finale`);
    assert.ok(a.ops.every(o => typeof o.farbe !== "string" || !o.farbe.includes("NaN")), `${id}: keine fehlerhaften Farben`);
    assert.ok(b.ops.every(o => typeof o.farbe !== "string" || !o.farbe.includes("NaN")), `${id}: keine fehlerhaften Farben (Mitte)`);
    assert.ok(e.ops.every(o => typeof o.farbe !== "string" || !o.farbe.includes("NaN")), `${id}: keine fehlerhaften Farben (Finale)`);
  }
});

test("TV-Ton: Sendungen starten stumm, MUTE gibt den Ton frei und stummt wieder", () => {
  const h = haus();
  // Der echte TVKlang misst den Pegel an seinem Ausgangs-Gain (kein AudioContext in Node nötig).
  const gains = [];
  const ctx = {
    currentTime: 0,
    createGain() {
      const g = { gain: { value: 0, setTargetAtTime(v) { this.value = v; }, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
      gains.push(g); return g;
    },
    createOscillator() { return { frequency: { value: 0 }, connect() {}, disconnect() {}, start() {}, stop() {} }; },
  };
  const pegelJetzt = () => { h.updateTVAudio(); return Math.round(gains[0].gain.value * 1000) / 1000; };
  h.tvKlang = { tv_e: new G.TVKlang(ctx, {}), tv_d: new G.TVKlang(ctx, {}) };
  const vorher = G.sfx.peekSharedAudio;
  G.sfx.peekSharedAudio = () => ({ ctx, master: {} });
  const vorherDoc = globalThis.document;
  globalThis.document = { visibilityState: "visible" };
  try {
    h.tvDaten.tv_e.kanal = "malfreude";
    assert.equal(pegelJetzt(), 0, "Sendung ist standardmäßig stumm");
    h.tvBefehl("stumm");
    assert.equal(h.tvDaten.tv_e.stumm, false);
    assert.ok(pegelJetzt() > 0, "MUTE gibt auch der Sendung den Ton frei");
    h.tvBefehl("stumm");
    assert.equal(pegelJetzt(), 0, "MUTE stummt die Sendung wieder");
    // NMS und CH1 sind von Haus aus hörbar (kein Standard-Mute).
    assert.equal(G.tvStandardStumm("sterne"), false, "NMS hat standardmäßig Ton");
    assert.equal(G.tvStandardStumm("musik"), false, "CH1 hat standardmäßig Ton");
    assert.equal(G.tvStandardStumm("malfreude"), true, "Sendungen sind standardmäßig stumm");
    h.tvDaten.tv_e.stumm = null;
    h.tvDaten.tv_e.kanal = "quizshow";
    assert.equal(pegelJetzt(), 0, "andere Sendungen bleiben standardmäßig stumm");
    assert.ok(gains.every(g => Number.isFinite(g.gain.value)), "nur endliche Pegel");
  } finally {
    h.tvKlang.tv_e.dispose(); h.tvKlang.tv_d.dispose();
    G.sfx.peekSharedAudio = vorher;
    globalThis.document = vorherDoc;
  }
  const c = canvas();
  G.drawFernbedienung(c.ctx, "musik", 50, true, null, null, true);
  assert.ok(c.ops.some(o => o.text === "STUMM"), "Fernbedienung zeigt STUMM");
  const c2 = canvas();
  G.drawFernbedienung(c2.ctx, "musik", 50, true, null, null, false);
  assert.ok(c2.ops.some(o => o.text === "50%"), "Fernbedienung zeigt Pegel, wenn Ton an");
});

test("Frog News: der Moderator bewegt den Mund (Silben, Pausen, Blinzeln)", () => {
  const mund = t => {
    const c = canvas(); G.drawTvSendung(c.ctx, 0, 0, 560, 364, "froschnews", t, 20000);
    // Rachenfarbe des geöffneten Mundes
    return c.ops.filter(o => o.farbe === "#3a1418").length;
  };
  const werte = [], formen = new Set();
  for (let t = 1; t < 12; t += 0.1) {
    const c = canvas(); G.drawTvSendung(c.ctx, 0, 0, 560, 364, "froschnews", t, 20000);
    const rachen = c.ops.find(o => o.farbe === "#3a1418");
    werte.push(rachen ? 1 : 0);
    if (rachen) {
      const ys = rachen.pfad.filter(p => Array.isArray(p) && p.length === 7).map(p => p[3]);
      formen.add(ys.map(v => Math.round(v * 10)).join("/"));
    }
  }
  assert.ok(werte.some(v => v > 0), "Mund öffnet sich beim Sprechen");
  assert.ok(formen.size >= 8, "der Mund nimmt viele verschiedene Öffnungen an (Silben statt Standbild)");
  const laecheln = canvas(); G.drawTvSendung(laecheln.ctx, 0, 0, 560, 364, "froschnews", 4.7, 20000);
  assert.ok(!laecheln.ops.some(o => o.farbe === "#3a1418"), "in der Sprechpause liegt wieder das Lächeln an");
  void mund;
});

test("Täglicher TV-Plan: NMS überproportional, CH1 höchstens drei Schleifen, jeden Tag anders", () => {
  assert.ok(G.TV_CH1_SCHLEIFE > 10);
  const pläne = [];
  for (const tag of [20000, 20001, 20002, 20003, 20004, 20005, 20006]) {
    const plan = G.tvTagesplan(tag, 13);
    assert.ok(plan.length >= 10, "genug Blöcke für einen Fernsehabend");
    assert.equal(plan[0].kanal, "musik", "sie schaltet mit CH1 ein");
    assert.ok(plan[0].dauer <= 3 * G.TV_CH1_SCHLEIFE + 0.01, "CH1 höchstens drei Schleifen");
    for (const b of plan) {
      assert.ok(G.tvKanaele("tv_e", false).includes(b.kanal), `${b.kanal} ist ein gültiger Sender`);
      assert.ok(b.dauer > 0);
    }
    const nms = plan.filter(b => b.kanal === "sterne").length / plan.length;
    assert.ok(nms >= 0.15, `NMS kommt oft genug (${(nms * 100).toFixed(0)} %)`);
    pläne.push(plan.map(b => `${b.kanal}:${Math.round(b.dauer)}`).join("|"));
  }
  assert.equal(new Set(pläne).size, pläne.length, "jeder Tag ergibt eine andere Routine");
  assert.deepEqual(G.tvTagesplan(20000, 13), G.tvTagesplan(20000, 13), "am selben Tag reproduzierbar");
  const viele = Array.from({ length: 60 }, (_, i) => G.tvTagesplan(21000 + i, 13));
  assert.ok(viele.some(p => p.slice(1).some(b => b.dauer < 70)), "manche Tage zappt sie viel");
  assert.ok(viele.some(p => p.slice(1).some(b => b.dauer > 150)), "an anderen Tagen schaut sie Sendungen fast ganz");
});

test("Lunis TV-Routine: sie zappt selbst, CH1 endet nach drei Schleifen, NMS zum Essen", () => {
  const h = haus();
  h.clock = { year: 2026, month: 12, day: 12, hour: 12, min: 20 };
  h.welt = "adventshaus";
  h.activity = { id: "sofa", label: "Sofa", floor: 1, x: 372, face: 1, state: "sit", expr: "happy", hits: [], screen: "tv_e" };
  h.cur = null; h.tvManual.tv_e = null; h.tvDaten.tv_e.kanal = "musik";
  // CH1 läuft höchstens drei Schleifen, dann schaltet die Routine weiter.
  const start = h.tvDaten.tv_e.kanal;
  for (let i = 0; i < 1200 && h.tvDaten.tv_e.kanal === start; i++) h.updateTvRoutine(0.1);
  assert.notEqual(h.tvDaten.tv_e.kanal, "musik", "nach drei CH1-Schleifen wird umgeschaltet");
  assert.ok(!h.tvManual.tv_e, "die Routine bleibt automatisch (kein Spieler-Eingriff)");
  // Zum Essen schaltet sie bevorzugt NMS ein.
  h.tagEssen = true;
  let aufNms = false;
  for (let i = 0; i < 3000; i++) { h.updateTvRoutine(0.1); if (h.tvDaten.tv_e.kanal === "sterne") { aufNms = true; break; } }
  assert.ok(aufNms, "beim Essen ist NMS dran");
  // Ein Spieler-Klick beendet die Automatik, der Kanal bleibt, wie der Spieler ihn will.
  h.tvManual.tv_e = true; h.tvDaten.tv_e.kanal = "quizshow";
  h.updateTvRoutine(1);
  assert.equal(h.tvDaten.tv_e.kanal, "quizshow", "Spielerwahl wird nicht überschrieben");
});

console.log(`\n${n} TV- und Hauswelt-Tests bestanden.`);