// Die Feinzeichnung darf Stoffe aendern, aber keine Gelenke, Griffpunkte oder Socken vertauschen.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const quelltext = readFileSync("src/game/luni-fein.ts", "utf8");
const paket = await build({ stdin: { contents: quelltext + '\nexport { PINSEL, drawLuni, K }; export { luniRigBauen, LUNI_H } from "./luni";',
  resolveDir: path.resolve("src/game"), loader: "ts" }, bundle: true, write: false, format: "esm", platform: "node" });
const G = await import(`data:text/javascript;base64,${Buffer.from(paket.outputFiles[0].text).toString("base64")}`);
assert.equal(G.LUNI_H, 56);

function zeichenprobe() {
  let maske = 0, farbwechsel = 0;
  const stapel = [], teile = [], gelenke = [], socken = [], haende = [];
  const grund = { globalAlpha: 1, save() { stapel.push(maske); }, restore() { assert(stapel.length); maske = stapel.pop(); },
    clip() { maske++; }, getTransform() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; },
    createLinearGradient(...p) { assert(p.every(Number.isFinite)); farbwechsel++; return { addColorStop(v) { assert(v >= 0 && v <= 1); } }; },
    createRadialGradient(...p) { return this.createLinearGradient(...p); } };
  const c = new Proxy(grund, { get(o, k) { return k in o ? o[k] : (...p) => {
    for (const n of p) if (typeof n === "number") assert(Number.isFinite(n), `Endliche Koordinate in ${String(k)}`);
    if (k === "arc") assert(p[2] >= 0); if (k === "ellipse") assert(p[2] >= 0 && p[3] >= 0);
  }; } });
  const pinsel = Object.fromEntries(Object.entries(G.PINSEL).map(([k, fn]) => [k, (ctx, ...p) => {
    if (["haar", "gewebe", "socke", "bund"].includes(k)) assert(maske > 0, `${k} bleibt innerhalb der Originalkontur`);
    if (k === "glied") gelenke.push(structuredClone(p));
    if (k === "socke") socken.push(p[0]);
    if (k === "hand") haende.push(structuredClone(p));
    teile.push(k === "gewebe" ? `stoff:${p[0]}` : k);
    return fn(ctx, ...p);
  }]));
  return { c, pinsel, teile, gelenke, socken, haende, fertig() {
    assert.equal(stapel.length, 0); assert.equal(maske, 0); assert(farbwechsel > 5);
  } };
}

let varianten = 0;
for (const state of ["idle", "walk", "wave", "sit", "act", "stretch", "think"]) {
  for (const face of [-1, 1]) for (const back of [false, true]) for (const t of [.17, 1.31, 2.14]) {
    const opts = { state, face, back, backReach: back && state !== "idle", expr: state === "think" ? "think" : "neutral",
      t, walk: t * 7.2, phase: t % 1, scale: 3.7, shadow: false, edit: {} };
    const s = zeichenprobe(), rig = G.luniRigBauen(34, 88, opts), rigVorher = structuredClone(rig);
    const alt = { front: [0, 0], rear: [0, 0] }, neu = structuredClone(alt);
    const griffAlt = G.drawLuni(s.c, 34, 88, { ...opts, handOut: alt });
    const griffFein = G.drawLuni(s.c, 34, 88, { ...opts, handOut: neu }, s.pinsel);
    assert.deepEqual(griffFein, griffAlt); assert.deepEqual(neu, alt, "Beide Handziele bleiben exakt auf der Vorlage");
    assert.deepEqual(G.luniRigBauen(34, 88, opts), rigVorher);
    const beine = s.gelenke.filter(g => g[5]), arme = s.gelenke.filter(g => !g[5]);
    assert.equal(beine.length, 2); assert.equal(arme.length, 2); assert.equal(s.haende.length, 2);
    for (const [i, bein] of beine.entries()) {
      assert.deepEqual(bein[0], [i ? -2.6 : 2.6, rig.hipY], "Hose beginnt an der zugehoerigen Huefte");
      assert.deepEqual(bein[1], (i ? rig.legFar : rig.legNear).elbow, "Stofffalte sitzt auf dem wirklichen Knie");
      assert.equal(bein[3], i ? 5.6 : 5.4, "Keine vergroesserte Beinsilhouette");
    }
    assert.deepEqual(s.socken, [G.K.sockR, G.K.sockL], "Jeder Fuss behaelt seine zweifarbige Socke");
    for (const [seite, finger, , ruecken] of s.haende) {
      assert([-1, 1].includes(seite)); assert.equal(finger.length, 4, "Vier Finger neben dem Daumen");
      assert.equal(ruecken, back, "Nageldetails nicht auf die Handinnenflaeche zeichnen");
    }
    assert.equal(s.haende[0][0], -s.haende[1][0], "Spiegelbildliche Daumen, keine zwei gleichen Haende");
    if (back) {
      assert(!s.teile.includes("gesicht")); assert(!s.teile.includes("knopf"));
      assert(s.teile.includes("stoff:ruecken")); assert(!s.teile.includes("stoff:shirt"));
    } else {
      assert.equal(s.teile.filter(k => k === "knopf").length, 3);
      assert.equal(s.teile.filter(k => k === "gesicht").length, 1);
      assert.deepEqual(arme[0][0], [4.4, rig.shoulderY + 2]); assert.deepEqual(arme[0][1], rig.armNear.elbow);
      assert.deepEqual(arme[1][0], [-4.4, rig.shoulderY + 2]); assert.deepEqual(arme[1][1], rig.armFar.elbow);
      assert(s.teile.indexOf("glied") < s.teile.indexOf("stoff:shirt"));
      assert(s.teile.lastIndexOf("glied") > s.teile.lastIndexOf("stoff:jacke"), "Vorderer Arm liegt vor der Jacke");
    }
    s.fertig(); varianten++;
  }
}
for (const expr of ["happy", "neutral", "wink", "think", "grin", "sing", "tired", "sleep", "surprised", "sad", "annoyed", "love", "talk", "focus"]) {
  const s = zeichenprobe(); G.zeichneLuniFein(s.c, 0, 0, { expr, t: .7, singOpen: .55 }); s.fertig();
}
assert(!readFileSync("src/game/house.ts", "utf8").includes("luni-fein"), "Nur im Studio, nicht im Haus");
console.log(`OK  Luni-Feinzeichnung: ${varianten} Pose-/Blickproben, 14 Mimiken, unveraenderte Gelenke und Griffpunkte, korrekte Ebenen und Konturmasken.`);