import assert from "node:assert/strict";
import { build } from "esbuild";

const b = await build({ stdin: { resolveDir: process.cwd(), contents: `
  export { House, berlinNow } from './src/game/house'; export * from './src/game/abendzeiten';
  export { BettHandy, videobild } from './src/game/abendroutine'; export { zahnbild } from './src/game/zahnpflege';
  export { haarstrich, buerstHaenger } from './src/game/haarstrich'; export { luniRigBauen } from './src/game/luni';` },
  bundle: true, write: false, format: "esm", platform: "node" });
const G = await import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`);
const min = G.abendWerte(() => 0), mitte = G.abendWerte(() => .5), max = G.abendWerte(() => 1);
assert.deepEqual(min, { dusche:300, zaehne:60, haare:60, video:300, anruf:1200 });
assert.deepEqual(mitte, { dusche:360, zaehne:90, haare:80, video:480, anruf:3300 });
assert.deepEqual(max, { dusche:480, zaehne:120, haare:80, video:720, anruf:7200 });
assert.deepEqual(G.tageswerte(20261209,"normal"),G.tageswerte(20261209,"normal"));
assert.notDeepEqual(G.tageswerte(20261209,"normal"),G.tageswerte(20261210,"normal"));
assert.notDeepEqual(G.tageswerte(20261209,"normal"),G.tageswerte(20261209,"weihnacht"));
assert.ok(!G.gueltigeAbendwerte({...mitte, anruf:7201}));
const nah = (a,b,eps=.00001) => assert.ok(Math.abs(a-b)<=eps,`${a} statt ${b} (Toleranz ${eps})`);
for (const w of [min,mitte,max]) {
  const d = G.abendTakte(w), sum = keys => keys.split(" ").reduce((v,k) => v+d[k],0);
  for (const [phasen,sek] of [
    ["openWardrobe waescheRichten undress wrap closeWardrobe glassesOff tossGlasses",60],
    ["closeCurtain towelOff throwTowel waterOn nasswerden washHair washBody rinse",w.dusche],
    ["waterOff takeTowel abtrocknen wrapOn openCurtain gPick",40],
    ["cOpen zNehmen zTube zPaste zTubeZurueck",20],["zPutzen",w.zaehne],["zGurgeln zSpucken",10],
    ["zHahnAuf zWaschen zHahnZu zZurueck",15],["bTake bBend bBrush bUp bPut kClose",w.haare],
    ["bedOpen bedPants bedPajama bedClose",10],
  ]) nah(sum(phasen),sek);
  let wasser = 0;
  for (const ph of ["zHahnAuf","zWaschen","zHahnZu","zZurueck"]) for(let t=.005;t<d[ph];t+=.01)
    if(G.zahnbild(ph,t,632,324,d[ph]).fluss>0) wasser += .01;
  nah(wasser,9,.015);
  const bett = G.ABEND_BETT;
  nah(bett.umschlagen+bett.setzen+bett.fuesse+bett.greifen+bett.hinlegen+bett.abnehmen+bett.wurf,25);
  nah(bett.holen,1.5); nah(bett.unterschieben,3);
  const h = new G.BettHandy(w); h.tick(bett.abnehmen); assert.equal(h.phase,"wurf"); h.brilleAbgelegt();
  h.tick(1.499);assert.equal(h.phase,"holen");h.tick(.002);assert.equal(h.phase,"video");
  h.tick(w.video-.003);assert.equal(h.phase,"video");h.tick(.003);assert.equal(h.phase,"unterschieben");
  h.tick(2.1); assert.ok(h.abgelegt && h.bild().arm); h.tick(.9);
  assert.ok(h.phase==="anruf" && h.bild().arm===0); h.tick(w.anruf-G.ABEND_EINSCHLAFEN-.01); assert.equal(h.phase,"anruf");
  h.tick(.02);assert.ok(h.fertig && h.bild().abgelegt);
  assert.ok(G.videobild(w.video-5,w.video).staerke>.12); nah(G.videobild(w.video,w.video).staerke,0);
}
console.log("OK  Alle Gruppenbudgets, 9 s Wasser, 1,5 s Handgriff, 3 s Ablegen/Rueckzug und 20/55/120 min Telefonat");

const arten = new Map(); let vorher = null, haenger = 0, imHaenger = false, tempi = new Set();
const saatMit = [...Array(40).keys()].find(s => G.buerstHaenger(72, s) !== null);
for(let i=0;i<72*60;i++) {
  const t=i/60,weg=G.haarstrich(t,72,saatMit),opts={state:"brush",face:1,t,scale:1.08};
  const alt=G.luniRigBauen(598,324,opts), neu=G.luniRigBauen(598,324,{...opts,buerstenzeit:t,buerstendauer:72,buerstensaat:saatMit});
  for(const k of ["rootX","rootY","rootRot","bend","hipY","headY","headTilt","legNear","legFar","armNear"])
    assert.deepEqual(neu[k],alt[k],`${k}: nur die Buerstenhand wechselt ihren Weg`);
  const h=neu.armFar.hand; if(vorher) assert.ok(Math.hypot(h[0]-vorher[0],h[1]-vorher[1])<1.15,"kein Sprung bei Strich- oder Bereichswechsel");
  vorher=h; if(!arten.has(weg.art)) arten.set(weg.art,[]); arten.get(weg.art).push(weg.quer);
  if (weg.haengt && !imHaenger) haenger++; imHaenger = weg.haengt; tempi.add(weg.zug);
}
assert.deepEqual([...arten.keys()],["vorne","hinten","mitte"],"erst vorne, dann hinten, dann in der Mitte");
const mittel = a => a.reduce((s,v)=>s+v,0)/a.length;
assert.ok(mittel(arten.get("vorne")) < mittel(arten.get("mitte")) - 1.5 && mittel(arten.get("mitte")) < mittel(arten.get("hinten")) - 1.5);
assert.ok(tempi.size >= 4, "verschiedene Geschwindigkeiten");
assert.equal(haenger, 1, "genau einmal haengen bleiben");
const saatOhne = [...Array(40).keys()].find(s => G.buerstHaenger(72, s) === null);
assert.ok([...Array(72*10).keys()].every(i => !G.haarstrich(i/10,72,saatOhne).haengt), "in manchen Gaengen bleibt sie gar nicht haengen");
const anteil = [...Array(200).keys()].filter(s => G.buerstHaenger(60, s) !== null).length / 200;
assert.ok(anteil > .45 && anteil < .75, "Haengenbleiben ist nicht in jedem Gang");
const kurz = new Set([...Array(70).keys()].map(i => G.haarstrich(i/10, 7, 1).art));
assert.deepEqual([...kurz], ["vorne","hinten","mitte"], "auch in der kurzen Probe alle drei Bereiche");
console.log("OK  Haare vorne, hinten und in der Mitte, wechselndes Tempo, hoechstens einmal haengen, Koerper und zweite Hand identisch");

const RealDate=Date; let jetzt=Date.parse("2026-12-09T19:50:00Z");
globalThis.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[jetzt]));} static now(){return jetzt;}};
const speicher=new Map(); globalThis.localStorage={getItem:k=>speicher.get(k)??null,setItem:(k,v)=>speicher.set(k,v)};
const flaeche=()=>({width:960,height:600,parentElement:{clientWidth:960,clientHeight:600},style:{},getContext:()=>({})});
globalThis.document={createElement:flaeche,visibilityState:"visible"};globalThis.window={devicePixelRatio:1};
const haus=welt=>new G.House(flaeche(),{welt});
const tick=(h,sek)=>{jetzt+=sek*1000;h.update(Math.min(sek,.05),sek,true);};
const tagsek = d => d.hour*3600+d.min*60+d.sec;
for(const [sommer,w,f,x,werte] of [[false,"normal",1,380,mitte],[true,"weihnacht",0,784,max],[true,"normal",3,708,min]]) {
  speicher.clear();const mitternacht=RealDate.parse(sommer?"2026-07-18T00:00:00+02:00":"2026-12-09T00:00:00+01:00");
  jetzt=mitternacht+20*3600e3;assert.equal(G.berlinNow().hour,20);
  const h=haus(w);h.lx=x;h.lf=f;h.abendPlan=G.abendplan(G.abendTag(G.berlinNow()),w,werte);
  const beginn=h.abendBeginn(h.abendPlan);jetzt=mitternacht+(beginn-3)*1000;tick(h,.01);assert.ok(!h.abendAktiv);
  let bett=0,anruf=0,gestartet=0;
  for(let i=0;i<9000&&!h.asleep;i++) {
    const rest=h.shPhase?(h.shDauer(h.shPhase)??0)-h.shT:h.bettHandy?.rest??0;
    tick(h,rest>3?Math.min(rest-1,60):.05);
    if(!gestartet&&h.abendAktiv) gestartet=(jetzt-mitternacht)/1000;
    if(!bett&&h.bettHandy) bett=(jetzt-mitternacht)/1000;
    if(h.bettHandy?.phase==="anruf"&&!anruf)anruf=jetzt;
  }
  nah(gestartet,beginn,2.2);nah(bett,G.ABEND_ZIEL,4);nah((jetzt-anruf)/1000,werte.anruf,.15);
  assert.ok(h.asleep&&h.handyAmKissen);h.aufwachen();tick(h,3);assert.ok(!h.abendAktiv,"nicht zweimal automatisch");
  h.speichern();const neu=haus(w);tick(neu,2);assert.ok(!neu.abendAktiv&&!neu.asleep,"auch nach Neuladen kein Doppelstart");
  console.log(`OK  ${w}, Etage ${f}, ${sommer?"Sommerzeit":"Winterzeit"}: Bett ${Math.round(bett-G.ABEND_ZIEL)} s vom Ziel entfernt`);
}
speicher.clear();jetzt=RealDate.parse("2026-12-09T21:17:00+01:00");
let h=haus("weihnacht");tick(h,.02);assert.equal(h.bettHandy.phase,"video","später Einstieg mitten im richtigen Video");
const zeiten={...h.abendPlan.werte};h.speichern();jetzt+=600e3;h=haus("weihnacht");tick(h,.02);
assert.deepEqual(h.abendPlan.werte,zeiten);assert.equal(h.bettHandy.phase,"anruf");const schon=h.bettHandy.anrufzeit;
tick(h,35);nah(h.bettHandy.anrufzeit-schon,35,.002);
h.speichern();jetzt+=121*60e3;h=haus("weihnacht");tick(h,.02);assert.ok(h.asleep&&h.handyAmKissen);
for(const welt of ["traum","gruesel"]) {const h=haus(welt);tick(h,.01);assert.ok(!h.abendAktiv&&!h.bettHandy);}
const gespeichert=JSON.parse(speicher.get('lcp1.welt.weihnacht.v1'));assert.ok(gespeichert.abendBegonnenAm===20261209);
console.log("OK  Spaeter Einstieg, stabile Tageswahl, reale Zeit bei gedrosseltem Bild und Schlaf nach Offline-Telefonat");

speicher.clear();jetzt=RealDate.parse("2026-12-09T23:53:00+01:00");h=haus("normal");h.command("stein_ezbett");
const tagesplan={...h.abendPlan.werte};tick(h,26);h.speichern();jetzt+=65e3;h=haus("normal");tick(h,.02);
assert.ok(h.abendAktiv&&["washHair","nasswerden","washBody"].includes(h.shPhase));
document.visibilityState="hidden";tick(h,16*60);document.visibilityState="visible";
assert.ok(h.bettHandy);assert.deepEqual(h.abendPlan.werte,tagesplan,"kein Neuwuerfeln um Mitternacht");
assert.equal(h.abendBegonnenAm,20261209);assert.equal(G.berlinNow().day,10);
assert.ok(tagsek(G.berlinNow())<3600);
console.log("OK  Unterbrechung vor dem Bett und Tageswechsel waehrend eines manuell gestarteten Abends");

speicher.clear();jetzt=RealDate.parse("2026-07-18T10:00:00+02:00");h=haus("normal");h.command("stein_ezbett");tick(h,9200);
assert.ok(h.asleep&&h.abendBegonnenAm!==20260718);h.aufwachen();for(let i=0;i<40;i++)tick(h,.05);
jetzt=RealDate.parse("2026-07-18T21:16:00+02:00");tick(h,2);assert.equal(h.abendBegonnenAm,20260718);assert.equal(h.bettHandy.phase,"video");
tick(h,9200);assert.ok(h.asleep);h.aufwachen();for(let i=0;i<40;i++)tick(h,.05);
jetzt=RealDate.parse("2026-07-19T21:16:00+02:00");tick(h,2);assert.equal(h.abendBegonnenAm,20260719);assert.ok(h.abendAktiv);
globalThis.Date=RealDate;
console.log("OK  Die Vormittagsprobe verbraucht den Abend nicht, der naechste Kalendertag startet wieder selbststaendig");