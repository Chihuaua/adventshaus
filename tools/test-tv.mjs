import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const source = readFileSync("src/game/house.ts", "utf8");
const b = await build({
  stdin: { contents: source + '\nexport { drawHouse, micStand };\nexport * from "./tv";\nexport { drawSternennacht, STERNENNACHT_FARBEN, STERNENNACHT_STERNE, sternenLicht, staubImRaum } from "./sternennacht";\nexport { TVKlang } from "./audio/tvVoice";\nexport { createState as neuesGOL } from "./gol";',
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
    for (const key of ["P -", "P +", "VOL -", "VOL +", "I/O"]) assert.ok(c.ops.some(o => o.text === key), key);
  }
});

test("TV: Kanaltasten schalten wirklich um, unabhaengig je Geraet", () => {
  const h = haus();
  h.tvBefehl("kanal_hoch"); assert.equal(h.tvContent("tv_e"), "musik");
  assert.equal(h.tvContent("tv_d"), "cozy");
  h.tvBefehl("kanal_hoch"); assert.equal(h.tvContent("tv_e"), "sterne");
  h.tvBefehl("kanal_hoch"); assert.equal(h.tvContent("tv_e"), "garten");
  h.tvBefehl("kanal_runter"); assert.equal(h.tvContent("tv_e"), "sterne");
  h.tvZoom = "tv_d";
  h.tvBefehl("kanal_hoch"); h.tvBefehl("kanal_hoch"); h.tvBefehl("kanal_hoch");
  assert.equal(h.tvContent("tv_d"), "konsole");
  h.tvBefehl("kanal_hoch"); assert.equal(h.tvContent("tv_d"), "garten", "ohne Modul kein GOL");
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
  assert.deepEqual(G.tvKanaele("tv_e", false), ["garten", "musik", "sterne"]);
  assert.deepEqual(G.tvKanaele("tv_d", false), ["garten", "musik", "sterne", "konsole"]);
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
    const alt = kennung("garten", "CH1"), nms = kennung("sterne", "NMS");
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
  assert.equal(h.tvContent("tv_e"), "musik", "Kanaltaste schaltet TV wieder ein");
  h.openTvZoom("tv_d"); h.openTvZoom("tv_e");
  assert.equal(h.tvDaten.tv_e.lautstaerke, 100, "beim Schliessen/Oeffnen bleibt der Pegel");
});

test("TV-Speicher: getrennte Werte, alte Staende und ungueltige Daten", () => {
  const leer = G.neuerTVStand(); assert.notEqual(leer.tv_e, leer.tv_d);
  const geladen = G.leseTVStand({ tv_e: { kanal: "musik", lautstaerke: 170 }, tv_d: { kanal: "falsch", lautstaerke: -20 } });
  assert.deepEqual(geladen, { tv_e: { kanal: "musik", lautstaerke: 100 }, tv_d: { kanal: null, lautstaerke: 0 } });
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

console.log(`\n${n} TV- und Hauswelt-Tests bestanden.`);