// Prüft die Morgenkette: Sitzt sie auf der Matratze (nicht auf der Bettkante)
// und zeigen beim Weste-Anziehen beide Ellenbogen nach außen statt in die Rückenmitte.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

const b = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
      export { drawLuni, LUNI_COLORS } from './src/game/luni';
      export { House } from './src/game/house';`,
  },
  bundle: true, write: false, format: "esm", platform: "node",
});
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);

/** Zeichenfläche, die jede Dreipunkt-Linie (Schulter → Ellenbogen → Hand) mit Farbe aufzeichnet. */
function aufnahme() {
  const zuege = [];
  let pfad = null;
  const ziel = { fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1, font: "", textAlign: "", lineCap: "", lineJoin: "" };
  return new Proxy(ziel, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === "measureText") return () => ({ width: 10 });
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} });
      if (k === "beginPath") return () => { pfad = []; };
      if (k === "moveTo" || k === "lineTo") return (x, y) => { pfad?.push([x, y]); };
      if (k === "stroke") return () => { if (pfad?.length === 3) zuege.push({ farbe: String(o.strokeStyle), punkte: pfad }); pfad = null; };
      if (k === "arme") return zuege;
      if (k === "setTransform" || k === "save" || k === "restore" || k === "clip" || k === "fill") return () => {};
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}

/** Die beiden Arm-Linien der Rückenansicht (Kardigan links/rechts). */
function rueckenArme(westeAnteil) {
  const c = aufnahme();
  G.drawLuni(c, 0, 0, { t: 0.3, scale: 1, face: 1, back: true, state: "undress", westeAnziehen: westeAnteil, shadow: false });
  // Die Arme der Rückenansicht beginnen exakt an den Schulterpunkten ±6,2.
  return c.arme.filter((z) => Math.abs(Math.abs(z.punkte[0][0]) - 6.2) < 0.01);
}

let n = 0;
const test = (name, f) => { f(); n++; console.log(`OK  ${name}`); };

test("Weste von hinten: die Ellenbogen bleiben auf ihrer eigenen Seite", () => {
  for (const anteil of [0.1, 0.26, 0.4, 0.58, 0.7]) {
    const arme = rueckenArme(anteil);
    assert.equal(arme.length, 2, `zwei Arme gezeichnet bei Anteil ${anteil}`);
    for (const arm of arme) {
      const [schulter, ellenbogen] = arm.punkte;
      const seite = Math.sign(schulter[0]);
      assert.ok(seite * ellenbogen[0] >= 0, `Ellenbogen überkreuzt die Wirbelsäule (Anteil ${anteil}: ${ellenbogen[0].toFixed(1)})`);
    }
  }
});

test("Weste von hinten: in der Mitte greifen die Ellenbogen nicht in die Rückenmitte", () => {
  const SCHULTER_X = 6.2;
  for (const anteil of [0.26, 0.5, 0.58, 0.7]) {
    const arme = rueckenArme(anteil).slice().sort((a, b) => Math.sign(a.punkte[0][0]) - Math.sign(b.punkte[0][0]));
    const [links, rechts] = arme.map((z) => z.punkte[1][0]);
    assert.ok(rechts >= SCHULTER_X, `rechter Ellenbogen bei ${rechts.toFixed(1)} – muss außerhalb der Schulter liegen`);
    assert.ok(links <= -SCHULTER_X, `linker Ellenbogen bei ${links.toFixed(1)} – muss außerhalb der Schulter liegen`);
    assert.ok(rechts - links > 12, `Ellenbogen stehen nur ${Math.abs(rechts - links).toFixed(1)} auseinander`);
  }
});

test("Socken anziehen: sie sitzt auf der Matratze, nicht auf der Bettkante", () => {
  const quelltext = readFileSync("src/game/house.ts", "utf8");
  const start = quelltext.indexOf("private drawSockenBett");
  assert.ok(start > 0, "Zeichenfunktion für das Sitzen gefunden");
  const block = quelltext.slice(start, start + 2600);
  assert.ok(/sitzX = BETT_STAND_X \+ \d+/.test(block), "Sitzpunkt rückt auf die Matratze");
  assert.ok(/sitzY = f - \d+/.test(block), "Sitzhöhe folgt der Matratzenoberfläche");
  assert.ok(!/f - 11/.test(block), "die alte Bettkanten-Höhe ist nicht mehr im Einsatz");
  const tiefe = Number(block.match(/sitzY = f - (\d+)/)[1]);
  assert.ok(tiefe >= 16, `Sitzhöhe ${tiefe} Einheiten über dem Fußboden – sie muss auf der Matratze (Deckenfläche) sitzen`);
  const breite = Number(block.match(/sitzX = BETT_STAND_X \+ (\d+)/)[1]);
  assert.ok(breite >= 8, `Sitzpunkt ${breite} Einheiten ins Bett hinein`);
});

test("Matratzenoberfläche und Sitzhöhe passen zusammen", () => {
  const quelltext = readFileSync("src/game/house.ts", "utf8");
  const boden = Number(quelltext.match(/export const FLOOR_Y = \[\d+, \d+, (\d+), \d+\]/)[1]);
  const start = quelltext.indexOf("private drawSockenBett");
  const tiefe = Number(quelltext.slice(start, start + 2600).match(/sitzY = f - (\d+)/)[1]);
  const sitzY = boden - tiefe;
  // Der Stoff liegt zwischen 288 (ferne Kante) und 308 (nahe Kante); die Hüfte
  // muss in diesem Band sitzen, sonst sitzt sie wieder davor.
  assert.ok(sitzY >= 286 && sitzY <= 302, `Sitzhöhe ${sitzY} liegt nicht auf der Matratze (286..302)`);
});

test("Weste: Arme bewegen sich ruhig ohne Dreh-Sprung und bleiben dauerhaft verdeckt hinter Rumpf/Haar", () => {
  let vorher = null;
  for (let i = 0; i <= 40; i++) {
    const anteil = i / 40;
    const reihenfolge = [];
    let pfad = null;
    const ziel = { fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1, font: "", textAlign: "", lineCap: "", lineJoin: "" };
    const c = new Proxy(ziel, {
      get(o, k) {
        if (k in o) return o[k];
        if (k === "measureText") return () => ({ width: 10 });
        if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} });
        if (k === "beginPath") return () => { pfad = []; };
        if (k === "moveTo" || k === "lineTo") return (x, y) => { pfad?.push([x, y]); };
        if (k === "stroke") return () => {
          if (pfad?.length === 3 && Math.abs(Math.abs(pfad[0][0]) - 6.2) < 0.01) {
            reihenfolge.push({ art: "arm", punkte: pfad });
          }
          pfad = null;
        };
        if (k === "fill") return () => {
          if (String(o.fillStyle) === G.LUNI_COLORS.hair) reihenfolge.push({ art: "haar" });
        };
        return () => {};
      },
      set(o, k, v) { o[k] = v; return true; },
    });
    const state = anteil <= 0.01 || anteil >= 0.99 ? "act" : "undress";
    G.drawLuni(c, 0, 0, { t: 0.3, scale: 1, face: 1, back: true, state, schrankRuecken: true, westeAnziehen: anteil, shadow: false });
    const ersterHaar = reihenfolge.findIndex((r) => r.art === "haar");
    const letzterArm = reihenfolge.map((r, idx) => (r.art === "arm" ? idx : -1)).reduce((a, b) => Math.max(a, b), -1);
    assert.ok(letzterArm >= 0 && ersterHaar > letzterArm, `Arme müssen vor den Haaren (= dahinter verdeckt) gezeichnet werden (Anteil ${anteil})`);
    const rechts = reihenfolge.find((r) => r.art === "arm" && r.punkte[0][0] > 0)?.punkte[1];
    assert.ok(rechts, "rechter Ellenbogen vorhanden");
    if (vorher) {
      const sprung = Math.hypot(rechts[0] - vorher[0], rechts[1] - vorher[1]);
      assert.ok(sprung < 1.2, `zu großer Ellenbogen-Sprung ${sprung.toFixed(2)} bei Anteil ${anteil}`);
    }
    vorher = rechts;
  }
});

test("Morgenkette am Schrank: Schrank bleibt nach der Weste offen und schließt erst nach dem Socken-Nehmen", () => {
  const speicher = new Map();
  globalThis.localStorage = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
  const flaeche = () => ({ width: 960, height: 600, parentElement: { clientWidth: 960, clientHeight: 600 }, style: {}, getContext: () => ({}) });
  globalThis.document = { createElement: flaeche, visibilityState: "visible" };
  globalThis.window = { devicePixelRatio: 1 };
  const h = new G.House(flaeche(), { welt: "normal", clock: { year: 2026, month: 11, day: 22, hour: 15, min: 12 } });
  h.command("stein_aufsteh");
  let westeFertigOffen = null;
  let minOffenZwischenWesteUndSocken = 1;
  for (let i = 0; i < 40000; i++) {
    const vorherWeste = h.westeAn;
    h.update(0.05);
    if (!vorherWeste && h.westeAn && westeFertigOffen === null) {
      westeFertigOffen = h.wardrobeOpen;
    }
    if (h.westeAn && !h.sockenInHand && h.wardrobeOpen < minOffenZwischenWesteUndSocken) {
      minOffenZwischenWesteUndSocken = h.wardrobeOpen;
    }
    if (h.sockenInHand) break;
  }
  assert.ok(westeFertigOffen > 0.95, `Schrank ist beim Anziehen der Weste offen (${westeFertigOffen})`);
  assert.ok(minOffenZwischenWesteUndSocken > 0.95, `Schrank darf zwischen Weste und Socken-Nehmen nicht schließen (min=${minOffenZwischenWesteUndSocken})`);
});

console.log(`\nWeste- und Sitz-Prüfungen bestanden (${n})`);
