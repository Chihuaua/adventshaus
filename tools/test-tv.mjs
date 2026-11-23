import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const source = readFileSync("src/game/house.ts", "utf8");
const b = await build({
  stdin: { contents: source + '\nexport { drawHouse, micStand };\nexport * from "./tv";\nexport { drawSternennacht, STERNENNACHT_STERNE, sternenLicht } from "./sternennacht";\nexport { TVKlang } from "./audio/tvVoice";\nexport { createState as neuesGOL } from "./gol";',
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
    fillText(text, x, y) { ops.push({ art: "text", text, x, y }); },
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

test("Sternennacht: ruhiges Bild in mehreren TV-Formaten und sehr langsames Sternenlicht", () => {
  assert.ok(G.STERNENNACHT_STERNE.length >= 160);
  assert.ok(G.STERNENNACHT_STERNE.every(s => s.periode >= 28 && s.periode <= 66));
  assert.deepEqual(G.tvKanaele("tv_e", false), ["garten", "musik", "sterne"]);
  assert.equal(G.TV_KANAL_NAMEN.sterne, "NMS", "die Szene erscheint auf Kanal NMS");
  assert.ok(G.tvKanaele("tv_d", false).includes("sterne"));
  const gespeichert = G.leseTVStand({ tv_e: { kanal: "sterne", lautstaerke: 40 } });
  assert.equal(gespeichert.tv_e.kanal, "sterne", "der neue Kanal bleibt im Speicherstand erhalten");
  for (const s of G.STERNENNACHT_STERNE) {
    const a = G.sternenLicht(s, 12);
    assert.ok(a > 0 && a <= 1);
    assert.ok(Math.abs(G.sternenLicht(s, 12.05) - a) < 0.02, "kein schnelles Flackern");
    assert.ok(Math.abs(G.sternenLicht(s, 12 + s.periode) - a) < 1e-10, "sanfter, reproduzierbarer Zyklus");
  }
  for (const [w, h] of [[160, 90], [120, 90], [216, 90]]) {
    const c = canvas();
    G.drawSternennacht(c.ctx, 0, 0, w, h, 12);
    assert.ok(c.ops.length > 450, `${w}x${h}: vollständige Szene statt Platzhalter`);
    assert.ok(!c.ops.some(o => o.farbe === "rgba(0,0,0,.12)"), "keine Scanlines über dem ruhigen Bild");
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