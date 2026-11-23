// Fuenf eigene Zeichnungen: Ansichten, Bewegungen, Anatomie, Routen und saubere Canvas-Zustaende.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { build } from "esbuild";

const paket = await build({ stdin: { resolveDir: process.cwd(), contents: `
  export * from './src/game/atelier/figuren'; export { hundeLauf } from './src/game/atelier/hundefell';
  export { ellbogen } from './src/game/atelier/stift'; export * from './src/game/atelier/prospekt';` },
  bundle: true, write: false, platform: "node", format: "esm", metafile: true });
const G = await import(`data:text/javascript;base64,${Buffer.from(paket.outputFiles[0].text).toString("base64")}`);
assert(!Object.keys(paket.metafile.inputs).some(p => /lieferfrosch|postfrosch|methan|hunde\.ts|nikolaus-figur|luni\.ts/i.test(p)), "Keine alte Figur dient als Zeichenvorlage");

function probe() {
  const protokoll = [], stapel = [];
  let matrix = [1, 0, 0, 1, 0, 0], anzahl = 0;
  const mal = ([a,b,c,d,e,f]) => { const [A,B,C,D,E,F] = matrix; matrix = [A*a+C*b,B*a+D*b,A*c+C*d,B*c+D*d,A*e+C*f+E,B*e+D*f+F]; };
  const gradient = (...p) => { assert(p.every(Number.isFinite)); return { addColorStop(v, farbe) { assert(v>=0 && v<=1 && typeof farbe==="string"); } }; };
  const basis = { globalAlpha: 1, fillStyle: "#000", strokeStyle: "#000", lineWidth: 1,
    save() { stapel.push({ matrix: [...matrix], globalAlpha: c.globalAlpha, fillStyle: c.fillStyle, strokeStyle: c.strokeStyle, lineWidth: c.lineWidth }); },
    restore() { assert(stapel.length > 0); const {matrix:m,...stil} = stapel.pop(); matrix = m; Object.assign(c, stil); },
    translate(x,y) { mal([1,0,0,1,x,y]); }, scale(x,y) { mal([x,0,0,y,0,0]); },
    rotate(a) { mal([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]); },
    createLinearGradient: gradient, createRadialGradient(...p) { assert(p[2]>=0 && p[5]>=0); return gradient(...p); } };
  const c = new Proxy(basis, { get(o,k) { return k in o ? o[k] : (...p) => {
    assert(matrix.every(Number.isFinite)); for (const z of p) if (typeof z==="number") assert(Number.isFinite(z), `Endliche Koordinate in ${String(k)}`);
    if (k==="ellipse") assert(p[2]>0 && p[3]>0); if (k==="arc") assert(p[2]>=0);
    if (k==="fill" || k==="stroke" || k==="fillRect") anzahl++;
    protokoll.push([k,...p,...matrix.map(n=>Math.round(n*1000)/1000),typeof c.fillStyle==="string"?c.fillStyle:"Verlauf",c.lineWidth]);
  }; } });
  return { c, fertig() { assert.equal(stapel.length,0); assert.deepEqual(matrix,[1,0,0,1,0,0]); assert(anzahl>0);
    return createHash("sha256").update(JSON.stringify(protokoll)).digest("hex"); } };
}

const alle = new Set(), ansichten = ["vorn", "links", "rechts", "hinten"];
assert.deepEqual(G.REIHENFOLGE,["briefkurier","weihnachtsmann","schneemann","odin","apollo"]);
for (const id of ["gruppe",...G.REIHENFOLGE]) assert.equal(G.atelierAusHash(G.STUDIO_HASH(id)),id);
for (const hash of ["", "#studio", "#studio-frosch", "#studio-odin", "#studio-apollo", "#weihnachtshaus", "#studio-atelier-falsch"]) assert.equal(G.atelierAusHash(hash),null);
for (const id of G.REIHENFOLGE) {
  const f=G.FIGUREN[id]; assert(f.hoehe>0 && f.breite>0 && f.kopfBreite>0); assert(f.kopf[1]<0 && -f.kopf[1]<f.hoehe);
  assert.equal(new Set(f.posen.map(p=>p[0])).size,f.posen.length);
  for (const ansicht of ansichten) for (const [pose] of f.posen) {
    const bild={ ansicht,pose,zeit:1.81 },a=probe(),b=probe(),sp=probe();
    f.zeichnen(a.c,bild); f.zeichnen(b.c,bild); f.zeichnen(sp.c,{...bild,zeit:2.48});
    const hash=a.fertig(); assert.equal(b.fertig(),hash,"Standbild flackert nicht"); assert.notEqual(sp.fertig(),hash,`Eigene Bewegung: ${id} ${pose} ${ansicht}`);
    alle.add(hash);
  }
}
assert.equal(alle.size,68,"Alle 68 Kombinationen sind unterschiedlich gezeichnet");

for (const id of ["odin","apollo"]) for (const pose of ["ruhe","gang","aktion","sitzen"]) {
  for (let i=0;i<90;i++) for (const hinten of [true,false]) for (const fern of [true,false]) {
    const b=G.hundeLauf(id,hinten,fern,{zeit:i*.073,pose,ansicht:"rechts"});
    const [a,e,s,p]=[b.wurzel,b.gelenk,b.sprunggelenk,b.pfote];
    assert([a,e,s,p].flat().every(Number.isFinite)); assert(p[1]<=0 && s[1]<p[1] && a[1]<s[1]);
    const seite=(e[0]-a[0])*(s[1]-a[1])-(e[1]-a[1])*(s[0]-a[0]);
    assert(Math.abs(seite) > 0.01 && (hinten ? seite <= 1e-7 : seite <= 1e-7), "Sprunggelenk und Ellenbogen knicken anatomisch");
    assert(Math.hypot(e[0]-a[0],e[1]-a[1])<14.4 && Math.hypot(s[0]-e[0],s[1]-e[1])<17.8,"Keine gedehnten Gliedmassen");
  }
}
for (const seite of [-1,1]) {
  const a=[0,0], h=[7.4,3.7], e=G.ellbogen(a,h,8.77,9.31,seite);
  assert(Math.abs(Math.hypot(e[0],e[1])-8.77)<1e-9); assert(Math.abs(Math.hypot(h[0]-e[0],h[1]-e[1])-9.31)<1e-9);
}
for (const [w,h] of [[320,410],[960,460],[1140,460]]) {
  const a=probe(),b=probe();G.nachtAmKanal(a.c,w,h,w<600);G.nachtAmKanal(b.c,w,h,w<600);assert.equal(a.fertig(),b.fertig());
}
console.log("OK  Figurenatelier: fünf eigenständige Modelle, 20 Ansichten, 68 Ansicht-/Posenkombinationen, Gelenke, Routen und speicherfreie Zeichnung.");