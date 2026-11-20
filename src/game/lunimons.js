/* ============================================================================
 * LUNI-MONS  ·  src/game/lunimons.js
 * 24 prozedurale Beobachtungswesen für den Little-Computer-Luni-Adventskalender.
 * Reines Canvas-2D, keine Assets, keine Browser-APIs, keine Fonts/Bilder/Fetch.
 *----------------------------------------------------------------------------
 * WORLD-VERTRAG (von der Spielwelt bereitgestellt, siehe createLuniMons):
 *   world = {
 *     house:   HOUSE-Layout (unten exportiert) oder eigenes,
 *     actors:  { luni:{x,y,floor,room}, hund:{...}, katze:{...} },   // nur lesen
 *     lights:  { attic:bool, bed:bool, live:bool, base:bool },       // lesen+schreiben
 *     flags:   { plant:0..1, garland:0..1, frost:0..1, tidy:0..1,
 *                flowers:0..1, cocoa:Timer, candle:Timer, tv:Timer,
 *                mail:Timer, cushion:Timer, aurora:Timer, dust:0..1 },
 *     night:   0..1,          // Dunkelheit der Welt
 *     weather: 'schnee'|'regen'|'klar',
 *     rng:     () => 0..1,    // optional, sonst Math.random
 *     events:  [],            // Modul schreibt {type:'unlock'|'pet'|'play',...}
 *   }
 * API:
 *   const mons = createLuniMons(world)
 *   mons.update(dt)            // dt in Sekunden
 *   mons.draw(ctx)             // zeichnet Mons + Partikel + Emotes
 *   mons.setUnlockedCount(n)   // 0..24 (Türchen)
 *   mons.unlockForDate(date)   // Echtzeit Europe/Berlin, nachholbar
 *   mons.unlocked              // Anzahl
 *   mons.list()                // aktive Mon-Objekte (für UI/Plaketten)
 *   mons.hitTest(x,y)          // Mon unter Punkt oder null
 *   mons.serialize()/deserialize(obj)   // KV-Speicher (SD-tauglich)
 * ==========================================================================*/

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ Haus */
export const HOUSE = {
  floors: {
    attic: { y: 210, x0: 262, x1: 786 },
    bed:   { y: 315, x0: 132, x1: 828 },
    live:  { y: 420, x0: 132, x1: 828 },
    base:  { y: 520, x0: 132, x1: 828 },
  },
  stairs: [
    { a: 'attic', b: 'bed',  x0: 250, y0: 210, x1: 150, y1: 315 },
    { a: 'bed',   b: 'live', x0: 810, y0: 315, x1: 745, y1: 420 },
    { a: 'live',  b: 'base', x0: 470, y0: 420, x1: 540, y1: 520 },
  ],
  rooms: [
    { id: 'attic',  floor: 'attic', x0: 262, x1: 786, label: 'Dachboden' },
    { id: 'schlaf', floor: 'bed',   x0: 132, x1: 470, label: 'Schlafen' },
    { id: 'bad',    floor: 'bed',   x0: 470, x1: 650, label: 'Bad' },
    { id: 'flur',   floor: 'bed',   x0: 650, x1: 828, label: 'Flur' },
    { id: 'wohn',   floor: 'live',  x0: 132, x1: 520, label: 'Wohnen' },
    { id: 'kueche', floor: 'live',  x0: 520, x1: 828, label: 'Küche' },
    { id: 'keller', floor: 'base',  x0: 132, x1: 828, label: 'Keller' },
  ],
  switches: { attic: 760, bed: 640, live: 515, base: 515 },
  props: {
    plant:     { floor: 'bed',   x: 150 },
    aquarium:  { floor: 'live',  x: 300 },
    tree:      { floor: 'live',  x: 445 },
    tv:        { floor: 'live',  x: 385 },
    sofa:      { floor: 'live',  x: 205 },
    cocoa:     { floor: 'live',  x: 610 },
    fridge:    { floor: 'live',  x: 560 },
    stove:     { floor: 'live',  x: 700 },
    windowBed: { floor: 'bed',   x: 760 },
    windowLiv: { floor: 'live',  x: 330 },
    shelf:     { floor: 'attic', x: 700 },
    piano:     { floor: 'attic', x: 600 },
    boxes:     { floor: 'base',  x: 600 },
    dust:      { floor: 'base',  x: 400 },
    mail:      { floor: 'live',  x: 140 },
    bedNap:    { floor: 'bed',   x: 200 },
    rug:       { floor: 'base',  x: 700 },
    beanbag:   { floor: 'attic', x: 330 },
  },
};

/* ------------------------------------------------------------- Spezies */
/* tier: 0 gewöhnlich · 1 ungewöhnlich · 2 selten · 3 legendär */
export const SPECIES = [
  { id:'pakitschu', name:'Pakitschu',  day:1,  tier:0, h:34, speed:24, pal:{body:'#f6d34c',belly:'#fbe9a8',accent:'#e2574c',dark:'#8a6d1f'}, idle:['ear','spark'], act:{target:'switch:auto', cd:[6,14], dur:1.6, kind:'light'} },
  { id:'schiggly',  name:'Schiggly',   day:2,  tier:0, h:30, speed:16, pal:{body:'#7fb6d9',belly:'#e8d9b0',accent:'#5a89ad',dark:'#33566e'}, idle:['shell','blink'], act:{target:'plant', cd:[26,48], dur:3.2, kind:'water'} },
  { id:'evolino',   name:'Evolino',    day:3,  tier:0, h:32, speed:18, pal:{body:'#d9b98c',belly:'#f3e6cd',accent:'#b08d5c',dark:'#7a5c33'}, idle:['fluff','nap'], act:{target:'sofa', cd:[30,55], dur:4, kind:'cuddle'} },
  { id:'flamiao',   name:'Flamiao',    day:4,  tier:0, h:28, speed:26, pal:{body:'#e2704a',belly:'#f6d9c0',accent:'#c04f2e',dark:'#8a3a20'}, idle:['pounce','tail'], act:{target:'tree', cd:[22,40], dur:3, kind:'yarn'} },
  { id:'lamball',   name:'Lamball',    day:5,  tier:0, h:30, speed:14, pal:{body:'#f2efe6',belly:'#ffffff',accent:'#d9c9a8',dark:'#a89877'}, idle:['roll','bounce'], act:{target:'sofa', cd:[28,50], dur:3, kind:'plump'} },
  { id:'magikarpfen',name:'Magikarpfen',day:6, tier:1, h:26, speed:12, pal:{body:'#e8875a',belly:'#f6d9b0',accent:'#c05a3a',dark:'#8a3a20'}, idle:['flop','bubble'], act:{target:'aquarium', cd:[14,26], dur:2.6, kind:'splash', home:'aquarium'} },
  { id:'mauzimo',   name:'Mauzimo',    day:7,  tier:0, h:32, speed:20, pal:{body:'#e6d3a8',belly:'#f6ecd4',accent:'#c9a86a',dark:'#8a6d3f'}, idle:['coin','lick'], act:{target:'tree', cd:[30,55], dur:3, kind:'coin'} },
  { id:'pingulett', name:'Pingulett',  day:8,  tier:0, h:30, speed:18, pal:{body:'#5a7fb6',belly:'#eef2f6',accent:'#3f5c8a',dark:'#2a3f63'}, idle:['waddle','slide'], act:{target:'fridge', cd:[26,46], dur:3, kind:'frost'} },
  { id:'floppi',    name:'Floppi',     day:9,  tier:0, h:32, speed:24, pal:{body:'#efe3cf',belly:'#ffffff',accent:'#d9b98c',dark:'#a8875c'}, idle:['earflop','thump'], act:{target:'mail', cd:[30,55], dur:3.4, kind:'letter'} },
  { id:'pummelu',   name:'Pummelu',    day:10, tier:1, h:30, speed:12, pal:{body:'#f2b6c9',belly:'#fbe0e8',accent:'#d98aa8',dark:'#a85c7a'}, idle:['inflate','sway'], act:{target:'sofa', cd:[30,55], dur:4, kind:'lullaby'} },
  { id:'sweeo',     name:'Sweeo',      day:11, tier:0, h:32, speed:16, pal:{body:'#f4f4f0',belly:'#ffffff',accent:'#c9c9d9',dark:'#8a8aa8'}, idle:['spin','bob'], act:{target:'dust', cd:[24,44], dur:3.4, kind:'sweep'} },
  { id:'glumander', name:'Glumander',  day:12, tier:1, h:32, speed:18, pal:{body:'#e8935a',belly:'#f6e0c0',accent:'#c06a3a',dark:'#8a4a20'}, idle:['flame','smoke'], act:{target:'piano', cd:[28,50], dur:3.2, kind:'candle'} },
  { id:'kattiva',   name:'Kattiva',    day:13, tier:0, h:30, speed:18, pal:{body:'#e8a8b6',belly:'#f6d9de',accent:'#c07a8a',dark:'#8a4a5c'}, idle:['stretch','blink'], act:{target:'boxes', cd:[26,48], dur:3.4, kind:'tidy'} },
  { id:'chillo',    name:'Chillo',     day:14, tier:1, h:28, speed:20, pal:{body:'#bcd9e8',belly:'#eef6fa',accent:'#8ab6d9',dark:'#5c8aa8'}, idle:['curl','shiver'], act:{target:'windowBed', cd:[28,50], dur:3.4, kind:'frostwin'} },
  { id:'tanzee',    name:'Tanzee',     day:15, tier:1, h:30, speed:22, pal:{body:'#8ab66a',belly:'#d9e8c0',accent:'#5c8a3f',dark:'#3f632a'}, idle:['hang','swing'], act:{target:'garland', cd:[30,55], dur:3.6, kind:'garland'} },
  { id:'entoro',    name:'Entoro',     day:16, tier:0, h:30, speed:14, pal:{body:'#e8cf7a',belly:'#f6e8c0',accent:'#c9a84a',dark:'#8a6d2a'}, idle:['headache','wobble'], act:{target:'tv', cd:[26,46], dur:3, kind:'calm'} },
  { id:'melpaka',   name:'Melpaka',    day:17, tier:0, h:40, speed:12, pal:{body:'#e6d3b6',belly:'#f6ecd9',accent:'#c9a87a',dark:'#8a6d4a'}, idle:['neck','chew'], act:{target:'sofa', cd:[32,58], dur:4, kind:'blanket'} },
  { id:'fuxparks',  name:'Fuxparks',   day:18, tier:1, h:30, speed:20, pal:{body:'#e2703a',belly:'#f6d9b0',accent:'#c04f1e',dark:'#8a3a10'}, idle:['tail','hiccup'], act:{target:'cocoa', cd:[26,46], dur:3, kind:'cocoa'} },
  { id:'killamari', name:'Killamari',  day:19, tier:2, h:32, speed:12, pal:{body:'#a88ac9',belly:'#d9c9e8',accent:'#7a5cA8',dark:'#4a3f63'}, idle:['drift','tent'], act:{target:'shelf', cd:[28,50], dur:3.6, kind:'dust', fly:true} },
  { id:'schnarcho', name:'Schnarcho',  day:20, tier:2, h:44, speed:8,  pal:{body:'#7aa8a8',belly:'#e8e0c9',accent:'#4a7a7a',dark:'#2a4a4a'}, idle:['belly','roll'], act:{target:'rug', cd:[40,70], dur:6, kind:'nap', sleepy:true} },
  { id:'daedream',  name:'Dädream',    day:21, tier:2, h:30, speed:12, pal:{body:'#c9b6e8',belly:'#e8def6',accent:'#9a7ac9',dark:'#634a8a'}, idle:['drift','sparkle'], act:{target:'bedNap', cd:[26,46], dur:4, kind:'dream', fly:true} },
  { id:'gengaru',   name:'Gengaru',    day:22, tier:2, h:34, speed:16, pal:{body:'#7a5c8a',belly:'#9a7aa8',accent:'#5c3f63',dark:'#3f2a4a'}, idle:['fade','giggle'], act:{target:'dust', cd:[24,44], dur:3, kind:'boo', ghost:true} },
  { id:'bisamoss',  name:'Bisamoss',   day:23, tier:2, h:30, speed:14, pal:{body:'#7ab68a',belly:'#c9e8d9',accent:'#4a8a5c',dark:'#2a5c3f'}, idle:['bulb','sneeze'], act:{target:'windowLiv', cd:[30,55], dur:3.4, kind:'bloom'} },
  { id:'mewdu',     name:'Mewdu',      day:24, tier:3, h:40, speed:14, pal:{body:'#d9c9e8',belly:'#f0e8f6',accent:'#a88ac9',dark:'#634a8a'}, idle:['float','glow'], act:{target:'aurora', cd:[30,60], dur:6, kind:'aurora', fly:true} },
  { id:'ufo',       name:'UFO',        day:25, tier:3, h:36, speed:16, pal:{body:'#aab4c4',belly:'#dde4ec',accent:'#7fd97f',dark:'#525c6c'}, idle:['float','glow'], act:{target:'aurora', cd:[26,52], dur:4, kind:'aurora', fly:true} },
];

/* ------------------------------------------------------- Zeichen-Helfer */
function E(ctx,x,y,rx,ry,f){ ctx.beginPath(); ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU); ctx.fillStyle=f; ctx.fill(); }
function C(ctx,x,y,r,f){ E(ctx,x,y,r,r,f); }
function RR(ctx,x,y,w,h,r,f){ r=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fillStyle=f; ctx.fill(); }
function PG(ctx,pts,f){ ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]); ctx.closePath(); ctx.fillStyle=f; ctx.fill(); }
function LN(ctx,x0,y0,x1,y1,w,c){ ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.lineWidth=w; ctx.strokeStyle=c; ctx.lineCap='round'; ctx.stroke(); }
/* Gesicht: Augen mit Blinzeln/Schlaf + Mund. look=-1..1 */
function face(ctx,m,x,y,gap,r,look){
  const p=m.pal, bl=m.blink, sl=m.sleep>0.5;
  for(const s of [-1,1]){
    const ex=x+s*gap, ey=y;
    if(sl){ LN(ctx,ex-r,ey,ex+r,ey,1.4,p.dark); }
    else if(bl>0.6){ LN(ctx,ex-r,ey,ex+r,ey,1.4,p.dark); }
    else { C(ctx,ex+look*1.2,ey,r,p.dark); C(ctx,ex+look*1.2-r*0.3,ey-r*0.3,r*0.32,'#ffffff'); }
  }
  if(sl){ C(ctx,x,y+r*1.6,r*0.5,p.dark); }
  else if(m.mouth==='o'){ C(ctx,x,y+r*1.5,r*0.6,p.dark); }
  else { ctx.beginPath(); ctx.arc(x,y+r*1.1,r*0.8,0.15*Math.PI,0.85*Math.PI); ctx.lineWidth=1.2; ctx.strokeStyle=p.dark; ctx.stroke(); }
}
/* Füße (kleine Stummel) */
function feet(ctx,m,w,y){ const p=m.pal; E(ctx,-w*0.5,y, w*0.34,3,p.accent); E(ctx,w*0.5,y, w*0.34,3,p.accent); }

/* ------------------------------------------------------- Spezies-Zeichner */
const DRAW = {
  pakitschu(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Blitz-Schweif hinter dem Körper
    PG(ctx,[[8,-h*0.3],[16,-h*0.42],[12,-h*0.5],[20,-h*0.66],[14,-h*0.6],[18,-h*0.78],[8,-h*0.5]],p.accent);
    // Ohren zuerst, Basis tief im Kopf; dunkle Spitzen als eigenes Stück
    PG(ctx,[[-6,-h*0.55],[ -14,-h*0.98],[-3,-h*0.72]],p.body); PG(ctx,[[6,-h*0.55],[14,-h*0.98],[3,-h*0.72]],p.body);
    PG(ctx,[[-12,-h*0.90],[-14,-h*0.98],[-9,-h*0.82]],p.dark); PG(ctx,[[12,-h*0.90],[14,-h*0.98],[9,-h*0.82]],p.dark);
    // Körper: Tropfenform (schmale Schultern, breite Basis)
    ctx.beginPath();
    ctx.moveTo(0,-h*0.52+b);
    ctx.bezierCurveTo(8,-h*0.50+b, 11,-h*0.30+b, 10,-h*0.12+b);
    ctx.bezierCurveTo(9,-h*0.03+b, 5,0, 0,0);
    ctx.bezierCurveTo(-5,0, -9,-h*0.03+b, -10,-h*0.12+b);
    ctx.bezierCurveTo(-11,-h*0.30+b, -8,-h*0.50+b, 0,-h*0.52+b);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); // Bauchfeld in der Silhouette
    ctx.moveTo(0,-h*0.30+b);
    ctx.bezierCurveTo(5,-h*0.30+b, 6,-h*0.14+b, 4,-h*0.05+b);
    ctx.bezierCurveTo(2,-h*0.01+b, -2,-h*0.01+b, -4,-h*0.05+b);
    ctx.bezierCurveTo(-6,-h*0.14+b, -5,-h*0.30+b, 0,-h*0.30+b);
    ctx.fillStyle=p.belly; ctx.fill();
    // Kopf als Schädel-Pfad mit Wangen
    ctx.beginPath();
    ctx.moveTo(-8,-h*0.52+b);
    ctx.bezierCurveTo(-9,-h*0.74+b, -5,-h*0.86+b, 0,-h*0.86+b);
    ctx.bezierCurveTo(5,-h*0.86+b, 9,-h*0.74+b, 8,-h*0.52+b);
    ctx.bezierCurveTo(6,-h*0.42+b, -6,-h*0.42+b, -8,-h*0.52+b);
    ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-9,-h*0.38+b],[-12,-h*0.22+b],[-8,-h*0.20+b]],p.body); // Arme
    PG(ctx,[[9,-h*0.38+b],[12,-h*0.22+b],[8,-h*0.20+b]],p.body);
    C(ctx,-6,-h*0.55+b,2.5,p.accent); C(ctx,6,-h*0.55+b,2.5,p.accent); // Wangen
    face(ctx,m,0,-h*0.63+b,3.6,1.7,m.look);
    PG(ctx,[[-8,0],[-2,0],[-4,-2.6]],p.accent); PG(ctx,[[8,0],[2,0],[4,-2.6]],p.accent); // Füße nach vorn
    if(m.idleKey==='spark'||m.actKind==='light'){ C(ctx,-6,-h*0.55+b,3.6,'rgba(255,240,150,.65)'); C(ctx,6,-h*0.55+b,3.6,'rgba(255,240,150,.65)'); }
  },
  schiggly(ctx,m){ const p=m.pal,h=m.h,b=m.bob, sh=m.idleKey==='shell'?1:0;
    PG(ctx,[[10,-h*0.22+b],[15,-h*0.30+b],[11,-h*0.12+b]],p.body); // Schwanz hinten
    PG(ctx,[[-10,-1],[-4,-3],[-3,0],[-10,0]],p.body); PG(ctx,[[10,-1],[4,-3],[3,0],[10,0]],p.body); // Flossenfüße
    // Panzer: Kuppel auf dem Rücken, Unterkante deutlich über dem Boden
    ctx.beginPath();
    ctx.moveTo(-11,-h*0.14+b);
    ctx.bezierCurveTo(-11,-h*0.50+b, -5,-h*0.64+b, 2,-h*0.63+b);
    ctx.bezierCurveTo(9,-h*0.62+b, 13,-h*0.44+b, 12,-h*0.16+b);
    ctx.bezierCurveTo(6,-h*0.10+b, -6,-h*0.09+b, -11,-h*0.14+b);
    ctx.fillStyle=p.accent; ctx.fill();
    ctx.beginPath(); // Plattenfeld nur oben auf der Kuppel
    ctx.moveTo(-6,-h*0.20+b);
    ctx.bezierCurveTo(-6,-h*0.44+b, -2,-h*0.54+b, 3,-h*0.53+b);
    ctx.bezierCurveTo(7,-h*0.52+b, 9,-h*0.40+b, 8,-h*0.22+b);
    ctx.bezierCurveTo(3,-h*0.17+b, -3,-h*0.16+b, -6,-h*0.20+b);
    ctx.fillStyle=p.belly; ctx.fill();
    LN(ctx,1,-h*0.52+b,1,-h*0.20+b,1,p.accent); LN(ctx,-5,-h*0.34+b,8,-h*0.36+b,1,p.accent);
    if(sh){
      // Eingezogen: nur eine kleine Kopfbeule lugt vorn unter dem Panzer vor
      ctx.beginPath();
      ctx.moveTo(-9,-h*0.12+b);
      ctx.bezierCurveTo(-13,-h*0.14+b, -14,-h*0.24+b, -11,-h*0.30+b);
      ctx.bezierCurveTo(-8,-h*0.33+b, -6,-h*0.24+b, -7,-h*0.14+b);
      ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
      face(ctx,m,-10,-h*0.22+b,1.8,1.1,m.look);
      return;
    }
    // Hals und Kopf ragen links aus dem Panzer, Schnauze stumpf
    PG(ctx,[[-8,-h*0.34+b],[-3,-h*0.30+b],[-4,-h*0.16+b],[-9,-h*0.18+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(-7,-h*0.38+b);
    ctx.bezierCurveTo(-10,-h*0.50+b, -14,-h*0.50+b, -16,-h*0.42+b);
    ctx.lineTo(-18,-h*0.33+b); ctx.lineTo(-16,-h*0.26+b);
    ctx.bezierCurveTo(-12,-h*0.22+b, -8,-h*0.26+b, -7,-h*0.32+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    face(ctx,m,-12,-h*0.38+b,2.3,1.3,m.look);
  },
  evolino(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Buschiger Schweif hinter dem Körper: zwei gestaffelte Fellformen mit heller Spitze
    ctx.beginPath();
    ctx.moveTo(8,-h*0.30+b);
    ctx.bezierCurveTo(16,-h*0.34+b, 18,-h*0.62+b, 13,-h*0.78+b);
    ctx.bezierCurveTo(9,-h*0.88+b, 6,-h*0.62+b, 7,-h*0.44+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12,-h*0.52+b);
    ctx.bezierCurveTo(15,-h*0.58+b, 15,-h*0.72+b, 12.5,-h*0.76+b);
    ctx.bezierCurveTo(10.5,-h*0.68+b, 10.5,-h*0.58+b, 12,-h*0.52+b);
    ctx.fillStyle=p.belly; ctx.fill();
    // Beine: vorn unter der Brust, hinten unter der Hüfte
    PG(ctx,[[-8,-h*0.30+b],[-5,-h*0.30+b],[-5.5,-2],[-5,0],[-9,0],[-7,-2]],p.accent);
    PG(ctx,[[5,-h*0.30+b],[8,-h*0.30+b],[7.5,-2],[8,0],[4,0],[6,-2]],p.accent);
    // Rumpf als Pfad
    ctx.beginPath();
    ctx.moveTo(-11,-h*0.30+b);
    ctx.bezierCurveTo(-12,-h*0.52+b, -6,-h*0.62+b, 1,-h*0.62+b);
    ctx.bezierCurveTo(8,-h*0.62+b, 12,-h*0.50+b, 11,-h*0.36+b);
    ctx.bezierCurveTo(10,-h*0.26+b, 4,-h*0.24+b, -2,-h*0.25+b);
    ctx.bezierCurveTo(-7,-h*0.25+b, -10,-h*0.26+b, -11,-h*0.30+b);
    ctx.fillStyle=p.body; ctx.fill();
    // Kopf links im Profil angesetzt: Schädel-Pfad, Schnauze, Ohren davor versiegelt
    PG(ctx,[[-15,-h*0.60+b],[-17,-h*0.86+b],[-12,-h*0.68+b]],p.body);
    PG(ctx,[[-8,-h*0.64+b],[-6,-h*0.88+b],[-3,-h*0.62+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(-6,-h*0.58+b);
    ctx.bezierCurveTo(-9,-h*0.72+b, -14,-h*0.73+b, -17,-h*0.64+b);
    ctx.lineTo(-20,-h*0.55+b); ctx.lineTo(-18,-h*0.47+b);
    ctx.bezierCurveTo(-14,-h*0.42+b, -9,-h*0.44+b, -7,-h*0.49+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-20,-h*0.56+b],[-18,-h*0.47+b],[-15,-h*0.47+b],[-17,-h*0.59+b]],p.belly); // Schnauze
    PG(ctx,[[-14,-h*0.50+b],[-10,-h*0.38+b],[-6,-h*0.50+b],[-8,-h*0.58+b]],p.belly); // Halskrause als Zackenform
    face(ctx,m,-12,-h*0.61+b,2.6,1.5,m.look);
    PG(ctx,[[-10,0],[-5,0],[-7,-2.4]],p.body); PG(ctx,[[4,0],[9,0],[7,-2.4]],p.body); // Pfoten nach vorn
  },
  flamiao(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Schwanz: geschwungene Form, die hinter dem Rumpf hochsteht
    ctx.beginPath();
    ctx.moveTo(11,-h*0.44+b);
    ctx.quadraticCurveTo(19,-h*0.52+b,18,-h*0.82+b);
    ctx.quadraticCurveTo(17,-h*0.88+b,15,-h*0.84+b);
    ctx.quadraticCurveTo(13,-h*0.64+b,9,-h*0.52+b);
    ctx.closePath(); ctx.fillStyle=p.accent; ctx.fill();
    // abgewandte Beine: nur Unterbeine, dunkler und versetzt, Pfote nur nach vorn abgeschrägt
    PG(ctx,[[-8,-h*0.34+b],[-5,-h*0.34+b],[-6,-2],[-6,0],[-9,0],[-7,-2]],p.accent);
    PG(ctx,[[8,-h*0.34+b],[11,-h*0.34+b],[10,-2],[10,0],[7,0],[9,-2]],p.accent);
    // Rumpf: tiefer Pfad mit Brust, gewölbtem Rücken und Bauchlinie
    ctx.beginPath();
    ctx.moveTo(-12,-h*0.32+b);
    ctx.bezierCurveTo(-14,-h*0.52+b, -10,-h*0.70+b, -3,-h*0.72+b);
    ctx.bezierCurveTo(4,-h*0.74+b, 11,-h*0.68+b, 13,-h*0.55+b);
    ctx.bezierCurveTo(14.5,-h*0.45+b, 12,-h*0.32+b, 7,-h*0.29+b);
    ctx.bezierCurveTo(1,-h*0.26+b, -8,-h*0.27+b, -12,-h*0.32+b);
    ctx.fillStyle=p.body; ctx.fill();
    // Bauchschattierung als schmale Sichel über der Bauchlinie
    ctx.beginPath();
    ctx.moveTo(-9,-h*0.35+b);
    ctx.bezierCurveTo(-3,-h*0.30+b, 6,-h*0.30+b, 10,-h*0.36+b);
    ctx.bezierCurveTo(5,-h*0.40+b, -5,-h*0.40+b, -9,-h*0.35+b);
    ctx.fillStyle=p.belly; ctx.fill();
    LN(ctx,-1,-h*0.71+b,0,-h*0.60+b,1.5,p.dark); LN(ctx,5,-h*0.70+b,6,-h*0.59+b,1.5,p.dark); // Rückenstreifen
    // Vorderbein (nah): sitzt unter der Schulter (x -10..-5), Pfote nur nach vorn abgeschrägt
    ctx.beginPath();
    ctx.moveTo(-10,-h*0.42+b); ctx.lineTo(-5,-h*0.42+b);
    ctx.bezierCurveTo(-6,-h*0.25+b, -6,-h*0.12+b, -6,-3);
    ctx.lineTo(-6,0); ctx.lineTo(-11,0); ctx.lineTo(-9,-2.5);
    ctx.bezierCurveTo(-9.5,-h*0.14+b, -10,-h*0.28+b, -10,-h*0.42+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    // Hinterbein (nah): große Haunche mit Sprunggelenk, dann schmaler Lauf
    ctx.beginPath();
    ctx.moveTo(4,-h*0.62+b);
    ctx.bezierCurveTo(10,-h*0.66+b, 14,-h*0.55+b, 13,-h*0.40+b);
    ctx.bezierCurveTo(12,-h*0.30+b, 10,-h*0.24+b, 10.5,-3);
    ctx.lineTo(10.5,0); ctx.lineTo(6,0); ctx.lineTo(8,-2.5);
    ctx.bezierCurveTo(7,-h*0.16+b, 6,-h*0.26+b, 6,-h*0.26+b);
    ctx.bezierCurveTo(3,-h*0.36+b, 2,-h*0.50+b, 4,-h*0.62+b);
    ctx.fillStyle=p.body; ctx.fill();
    // Ohren ZUERST: Basis liegt tief im Kopf, der Kopf (danach) versiegelt den Ansatz.
    // Rechtes Ohr komplett auf dem Schädel (Basis x -14..-8), nicht auf Hals/Rücken.
    PG(ctx,[[-18,-h*0.58+b],[-19,-h*0.93+b],[-12,-h*0.64+b]],'#d9643d');
    PG(ctx,[[-14,-h*0.62+b],[-10.5,-h*0.93+b],[-8,-h*0.60+b]],'#d9643d');
    // Kopf: Pfad mit Stirn, eckiger Schnauze und Kiefer (kein Kreis)
    ctx.beginPath();
    ctx.moveTo(-8,-h*0.62+b);
    ctx.bezierCurveTo(-11,-h*0.74+b, -16,-h*0.75+b, -19,-h*0.66+b);
    ctx.lineTo(-22,-h*0.56+b); ctx.lineTo(-20,-h*0.47+b);
    ctx.bezierCurveTo(-17,-h*0.42+b, -13,-h*0.43+b, -10,-h*0.47+b);
    ctx.bezierCurveTo(-7,-h*0.51+b, -6,-h*0.57+b, -8,-h*0.62+b);
    ctx.fillStyle='#d9643d'; ctx.fill(); // Kopf in eigenem, etwas dunklerem Rotton
    // Innenohren exakt in die sichtbare Ohrfläche eingepasst
    PG(ctx,[[-16.7,-h*0.71+b],[-17.4,-h*0.86+b],[-14.2,-h*0.72+b]],p.accent);
    PG(ctx,[[-12,-h*0.71+b],[-11,-h*0.86+b],[-9.2,-h*0.70+b]],p.accent);
    PG(ctx,[[-22,-h*0.57+b],[-20,-h*0.47+b],[-16,-h*0.46+b],[-18,-h*0.60+b]],p.belly); // Schnauzenfeld (ohne dunkles Nasen-Dreieck)
    face(ctx,m,-13,-h*0.63+b,2.5,1.45,m.look);
    LN(ctx,-20,-h*0.50+b,-22.5,-h*0.49+b,0.6,p.dark); LN(ctx,-20,-h*0.53+b,-22.5,-h*0.54+b,0.6,p.dark); // Schnurrhaare
  },
  lamball(ctx,m){ const p=m.pal,h=m.h,b=m.bob, r=m.idleKey==='roll'?m.idleT*6:0;
    if(m.idleKey==='roll'){
      // Zusammengerollt: Wollball mit Zackenrand, Gesicht vorn
      ctx.save(); ctx.translate(0,-h*0.45+b); ctx.rotate(r);
      ctx.beginPath();
      for(let i=0;i<10;i++){ const a=i/10*TAU, rr=i%2?10.5:12.5;
        const x=Math.cos(a)*rr, y=Math.sin(a)*rr;
        if(i===0) ctx.moveTo(x,y); else ctx.quadraticCurveTo(Math.cos(a-0.31)*13.5, Math.sin(a-0.31)*13.5, x, y); }
      ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,1,6.5,5.5,0,0,TAU); ctx.fillStyle=p.belly; ctx.fill();
      ctx.restore();
      C(ctx,0,-h*0.5+b,5.5,p.accent); face(ctx,m,0,-h*0.52+b,2.4,1.35,m.look);
      return;
    }
    // Stehend: Beine zuerst, dann Wollkörper mit Büschelrand oben
    PG(ctx,[[-8,-h*0.26+b],[-5,-h*0.26+b],[-5.5,-2],[-5,0],[-9,0],[-7,-2]],p.dark);
    PG(ctx,[[5,-h*0.26+b],[8,-h*0.26+b],[7.5,-2],[8,0],[4,0],[6,-2]],p.dark);
    PG(ctx,[[-3,-h*0.26+b],[0,-h*0.26+b],[0,-2],[0,0],[-4,0],[-2.5,-2]],p.dark);
    ctx.beginPath();
    ctx.moveTo(-11,-h*0.08+b);
    ctx.lineTo(-11,-h*0.42+b);
    for(let i=0;i<5;i++){ const x0=-11+i*4.6; ctx.quadraticCurveTo(x0+1.2,-h*0.66+b, x0+2.6,-h*0.52+b); ctx.quadraticCurveTo(x0+3.8,-h*0.40+b, x0+4.6,-h*0.46+b); }
    ctx.lineTo(12,-h*0.08+b);
    ctx.bezierCurveTo(6,-h*0.02+b, -6,-h*0.02+b, -11,-h*0.08+b);
    ctx.fillStyle=p.body; ctx.fill();
    // Kopf links vorn: dunkles Gesichtsfeld, Ohr, Wollschopf
    PG(ctx,[[-10,-h*0.52+b],[-14,-h*0.44+b],[-11,-h*0.38+b]],p.accent);
    ctx.beginPath();
    ctx.moveTo(-13,-h*0.30+b);
    ctx.bezierCurveTo(-15,-h*0.48+b, -12,-h*0.60+b, -8,-h*0.58+b);
    ctx.bezierCurveTo(-5,-h*0.56+b, -5,-h*0.40+b, -7,-h*0.32+b);
    ctx.bezierCurveTo(-9,-h*0.27+b, -12,-h*0.26+b, -13,-h*0.30+b);
    ctx.fillStyle=p.accent; ctx.fill();
    PG(ctx,[[-12,-h*0.58+b],[-10,-h*0.68+b],[-8,-h*0.58+b],[-6,-h*0.66+b],[-5,-h*0.55+b],[-7,-h*0.50+b],[-11,-h*0.50+b]],p.body);
    face(ctx,m,-9.5,-h*0.44+b,2.1,1.3,m.look);
  },
  magikarpfen(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    ctx.save(); ctx.translate(0,-h*0.5+b); ctx.rotate(Math.sin(m.t*3)*0.12+(m.idleKey==='flop'?0.5:0));
    // Schwanzflosse (zweilappig) hinter dem Körper
    PG(ctx,[[9,-1],[19,-8],[16,0],[19,7]],p.accent);
    // Körper: stromlinienförmige Fisch-Silhouette mit spitzer Schnauze
    ctx.beginPath();
    ctx.moveTo(-13,0);
    ctx.bezierCurveTo(-8,-7, 3,-8.5, 10,-2);
    ctx.bezierCurveTo(12,-0.5, 10,2, 3,7);
    ctx.bezierCurveTo(-4,8.5, -10,5, -13,0);
    ctx.fillStyle=p.body; ctx.fill();
    E(ctx,1,3,6.2,2.5,p.belly); // helle Bauchseite in der Silhouette
    PG(ctx,[[-2,-6],[3,-12],[7,-5]],p.accent);   // Rückenflosse
    PG(ctx,[[-2,1],[2,4.5],[-1,5]],p.accent);    // Brustflosse, klein am Körper
    // Schuppen + Kiemenlinie
    ctx.save(); ctx.globalAlpha=0.25; ctx.strokeStyle=p.dark; ctx.lineWidth=0.9;
    for(const [sx,sy] of [[2,-3],[6,-1.5],[2.5,0],[6,1]]){ ctx.beginPath(); ctx.arc(sx,sy,1.8,-0.4,1.6); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(-5.5,0,4.4,-1.1,1.1); ctx.stroke(); ctx.restore();
    C(ctx,-7,-1.5,1.9,p.dark); C(ctx,-7.6,-2.1,0.65,'#fff'); // Auge
    LN(ctx,-12.6,-0.4,-10.4,0.9,1,p.dark); // Maul
    ctx.restore();
  },
  mauzimo(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Schwanz rollt sich hinter der Hüfte ein
    ctx.beginPath(); ctx.moveTo(8,-h*0.24+b);
    ctx.bezierCurveTo(15,-h*0.26+b, 16,-h*0.48+b, 11,-h*0.52+b);
    ctx.lineWidth=3; ctx.strokeStyle=p.body; ctx.lineCap='round'; ctx.stroke();
    // Sitzfigur: breite Haunchen unten, Brust läuft zum Kopf
    ctx.beginPath();
    ctx.moveTo(-9,0);
    ctx.bezierCurveTo(-11,-h*0.30+b, -8,-h*0.52+b, -4,-h*0.60+b);
    ctx.bezierCurveTo(2,-h*0.66+b, 8,-h*0.55+b, 9,-h*0.30+b);
    ctx.bezierCurveTo(10,-h*0.12+b, 8,0, 4,0);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); // Brustfeld
    ctx.moveTo(0,-h*0.52+b);
    ctx.bezierCurveTo(4,-h*0.50+b, 5,-h*0.28+b, 3,-h*0.08+b);
    ctx.bezierCurveTo(1,-h*0.02+b, -2,-h*0.04+b, -3,-h*0.12+b);
    ctx.bezierCurveTo(-4,-h*0.30+b, -3,-h*0.50+b, 0,-h*0.52+b);
    ctx.fillStyle=p.belly; ctx.fill();
    // Ohren vor dem Kopf, Basis im Schädel
    PG(ctx,[[-6,-h*0.78+b],[-9,-h*0.98+b],[-2,-h*0.86+b]],p.body); PG(ctx,[[6,-h*0.78+b],[9,-h*0.98+b],[2,-h*0.86+b]],p.body);
    // Kopf als Schädel-Pfad
    ctx.beginPath();
    ctx.moveTo(-7,-h*0.58+b);
    ctx.bezierCurveTo(-8,-h*0.80+b, -4,-h*0.90+b, 0,-h*0.90+b);
    ctx.bezierCurveTo(4,-h*0.90+b, 8,-h*0.80+b, 7,-h*0.58+b);
    ctx.bezierCurveTo(5,-h*0.48+b, -5,-h*0.48+b, -7,-h*0.58+b);
    ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-5.5,-h*0.80+b],[-6.5,-h*0.92+b],[-3,-h*0.84+b]],p.accent); PG(ctx,[[5.5,-h*0.80+b],[6.5,-h*0.92+b],[3,-h*0.84+b]],p.accent);
    C(ctx,0,-h*0.84+b,2.5,'#e8c95a'); C(ctx,0,-h*0.84+b,1.3,'#f6e8a8'); // Münze auf der Stirn
    face(ctx,m,0,-h*0.66+b,2.9,1.5,m.look);
    LN(ctx,-6,-h*0.62+b,-10,-h*0.63+b,0.7,p.dark); LN(ctx,6,-h*0.62+b,10,-h*0.63+b,0.7,p.dark); // Schnurrhaare
    // Vorderpfoten als schmale Formen mit Pfoten nach vorn
    PG(ctx,[[-4,-h*0.22+b],[-1,-h*0.22+b],[-1.5,-2],[-1,0],[-5,0],[-3.5,-2]],p.body);
    PG(ctx,[[2,-h*0.22+b],[5,-h*0.22+b],[4.5,-2],[5,0],[1,0],[3,-2]],p.body);
  },
  pingulett(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Flossen hinter dem Körper
    PG(ctx,[[-7,-h*0.50+b],[-13,-h*0.30+b],[-7,-h*0.24+b]],p.accent);
    PG(ctx,[[7,-h*0.50+b],[13,-h*0.30+b],[7,-h*0.24+b]],p.accent);
    // Körper: Tropfen-Silhouette, Kopf geht in den Leib über
    ctx.beginPath();
    ctx.moveTo(0,-h*0.96+b);
    ctx.bezierCurveTo(7,-h*0.97+b, 10,-h*0.62+b, 9,-h*0.30+b);
    ctx.bezierCurveTo(8,-h*0.10+b, 5,-h*0.02+b, 0,-h*0.02+b);
    ctx.bezierCurveTo(-5,-h*0.02+b, -8,-h*0.10+b, -9,-h*0.30+b);
    ctx.bezierCurveTo(-10,-h*0.62+b, -7,-h*0.97+b, 0,-h*0.96+b);
    ctx.fillStyle=p.body; ctx.fill();
    // Bauchfeld folgt der Silhouette
    ctx.beginPath();
    ctx.moveTo(0,-h*0.60+b);
    ctx.bezierCurveTo(5,-h*0.60+b, 6.5,-h*0.36+b, 6,-h*0.20+b);
    ctx.bezierCurveTo(5.4,-h*0.07+b, 3,-h*0.03+b, 0,-h*0.03+b);
    ctx.bezierCurveTo(-3,-h*0.03+b, -5.4,-h*0.07+b, -6,-h*0.20+b);
    ctx.bezierCurveTo(-6.5,-h*0.36+b, -5,-h*0.60+b, 0,-h*0.60+b);
    ctx.fillStyle=p.belly; ctx.fill();
    // Gesicht + Schnabel
    face(ctx,m,0,-h*0.78+b,3.1,1.55,m.look);
    PG(ctx,[[-3.6,-h*0.69+b],[3.6,-h*0.69+b],[0,-h*0.60+b]],'#e8a84a');
    LN(ctx,-3,-h*0.69+b,3,-h*0.69+b,0.9,'#b87a28');
    // Schwimmfüße
    E(ctx,-4.5,0,4.2,1.9,'#e8a84a'); E(ctx,4.5,0,4.2,1.9,'#e8a84a');
  },
  floppi(ctx,m){ const p=m.pal,h=m.h,b=m.bob, ef=m.idleKey==='earflop'?Math.sin(m.idleT*8)*0.3:0;
    C(ctx,9,-h*0.22+b,3,p.belly); // Stummelschwanz hinten
    // Lange Ohren zuerst: schmale Pfade, Basis tief im Kopf, Innenohr als kleinerer Pfad
    for(const s of [-1,1]){
      ctx.save(); ctx.translate(s*3.6,-h*0.78+b); ctx.rotate(s*0.16+(s<0?ef:-ef));
      ctx.beginPath();
      ctx.moveTo(-2.4,2); ctx.bezierCurveTo(-3,-7, -1.6,-13, 0,-14.5);
      ctx.bezierCurveTo(1.8,-13, 3,-6, 2.4,2); ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-1,0); ctx.bezierCurveTo(-1.2,-6, -0.6,-10.5, 0.2,-11.5);
      ctx.bezierCurveTo(1.2,-9, 1.4,-4, 1,0); ctx.closePath(); ctx.fillStyle=p.accent; ctx.fill();
      ctx.restore();
    }
    // Sitzkörper als Birnen-Pfad
    ctx.beginPath();
    ctx.moveTo(-8,0);
    ctx.bezierCurveTo(-10,-h*0.34+b, -7,-h*0.55+b, 0,-h*0.57+b);
    ctx.bezierCurveTo(7,-h*0.57+b, 10,-h*0.34+b, 8,0);
    ctx.bezierCurveTo(4,-1.5, -4,-1.5, -8,0);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); // Bauchfeld
    ctx.moveTo(0,-h*0.42+b);
    ctx.bezierCurveTo(4.5,-h*0.40+b, 5.5,-h*0.18+b, 3,-h*0.05+b);
    ctx.bezierCurveTo(1,-h*0.01+b, -2,-h*0.02+b, -3.5,-h*0.07+b);
    ctx.bezierCurveTo(-5,-h*0.20+b, -4,-h*0.40+b, 0,-h*0.42+b);
    ctx.fillStyle=p.belly; ctx.fill();
    // Kopf-Pfad über dem Körperansatz
    ctx.beginPath();
    ctx.moveTo(-6.5,-h*0.55+b);
    ctx.bezierCurveTo(-7,-h*0.76+b, -3.5,-h*0.84+b, 0,-h*0.84+b);
    ctx.bezierCurveTo(3.5,-h*0.84+b, 7,-h*0.76+b, 6.5,-h*0.55+b);
    ctx.bezierCurveTo(4,-h*0.46+b, -4,-h*0.46+b, -6.5,-h*0.55+b);
    ctx.fillStyle=p.body; ctx.fill();
    face(ctx,m,0,-h*0.66+b,2.7,1.45,m.look);
    PG(ctx,[[-2,-h*0.56+b],[2,-h*0.56+b],[0,-h*0.52+b]],p.accent); // Nase
    // Hinterfüße lang nach vorn, Vorderpfoten klein davor
    PG(ctx,[[-11,0],[-3.5,0],[-5,-2.8],[-9,-2.2]],p.body); PG(ctx,[[11,0],[3.5,0],[5,-2.8],[9,-2.2]],p.body);
    PG(ctx,[[-3.5,-h*0.18+b],[-1,-h*0.18+b],[-1.6,-2],[-4.2,-0.5]],p.belly);
    PG(ctx,[[3.5,-h*0.18+b],[1,-h*0.18+b],[1.6,-2],[4.2,-0.5]],p.belly);
  },
  pummelu(ctx,m){ const p=m.pal,h=m.h,b=m.bob, inf=1+(m.idleKey==='inflate'?Math.sin(m.idleT*4)*0.08:0);
    // Arme hinter dem Ballonkörper
    PG(ctx,[[-10,-h*0.42+b],[-14,-h*0.30+b],[-10,-h*0.26+b]],p.body);
    PG(ctx,[[10,-h*0.42+b],[14,-h*0.30+b],[10,-h*0.26+b]],p.body);
    // Ballonkörper als leicht abgeflachter Pfad mit Glanzlicht-Sichel oben links
    ctx.save(); ctx.translate(0,-h*0.48+b); ctx.scale(inf,inf);
    ctx.beginPath();
    ctx.moveTo(0,-12);
    ctx.bezierCurveTo(8,-12, 12,-5, 11,2);
    ctx.bezierCurveTo(10,9, 5,12, 0,12);
    ctx.bezierCurveTo(-6,12, -11,8, -11,1);
    ctx.bezierCurveTo(-11,-6, -7,-12, 0,-12);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-7,-8); ctx.bezierCurveTo(-4,-10.5, 0,-11, 3,-9.5);
    ctx.bezierCurveTo(-1,-8, -4,-6.5, -7,-8);
    ctx.fillStyle='rgba(255,255,255,.38)'; ctx.fill();
    ctx.restore();
    // Ohren + Locke als Pfade auf dem Kopfbereich
    PG(ctx,[[-6,-h*0.88+b],[-8,-h*0.99+b],[-3,-h*0.92+b]],p.body); PG(ctx,[[6,-h*0.88+b],[8,-h*0.99+b],[3,-h*0.92+b]],p.body);
    ctx.beginPath(); ctx.moveTo(-1,-h*0.94+b); ctx.quadraticCurveTo(1,-h*1.03+b,3.4,-h*0.95+b);
    ctx.lineWidth=1.8; ctx.strokeStyle=p.accent; ctx.lineCap='round'; ctx.stroke();
    face(ctx,m,0,-h*0.52+b,3.9,2.1,m.look);
    PG(ctx,[[-7,0],[-2,0],[-4,-2.6]],p.accent); PG(ctx,[[7,0],[2,0],[4,-2.6]],p.accent); // Füße
  },
  sweeo(ctx,m){ const p=m.pal,h=m.h,b=m.bob, sp=m.idleKey==='spin'?Math.sin(m.idleT*10)*3:0;
    // Mopp-Strähnen: unterschiedlich lang, außen länger (fällt wie Fell ums Gesicht)
    const lens=[0.50,0.40,0.34,0.40,0.50];
    for(let i=-2;i<=2;i++){
      const x0=i*3.2, sway=sp*(1-Math.abs(i)*0.18), tip=x0*1.25+sway, yEnd=-h*0.52+b+h*lens[i+2];
      ctx.beginPath();
      ctx.moveTo(x0-1.7,-h*0.52+b);
      ctx.quadraticCurveTo(x0-1.2,(yEnd-h*0.52+b)/2-h*0.10+b, tip-1.3,yEnd-2);
      ctx.quadraticCurveTo(tip,yEnd+1.4, tip+1.4,yEnd-1.6);
      ctx.quadraticCurveTo(x0+1.3,(yEnd-h*0.52+b)/2-h*0.10+b, x0+1.7,-h*0.52+b);
      ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    }
    PG(ctx,[[-2.5,0],[1,0],[-0.8,-2.2]],p.dark); PG(ctx,[[3.5,0],[6.5,0],[5,-2.2]],p.dark); // Füßchen unter dem Mopp
    // Kopfkuppel als Pfad mit Gesicht
    ctx.beginPath();
    ctx.moveTo(-8,-h*0.50+b);
    ctx.bezierCurveTo(-8,-h*0.76+b, -4,-h*0.84+b, 0,-h*0.84+b);
    ctx.bezierCurveTo(4,-h*0.84+b, 8,-h*0.76+b, 8,-h*0.50+b);
    ctx.bezierCurveTo(4,-h*0.44+b, -4,-h*0.44+b, -8,-h*0.50+b);
    ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-3,-h*0.84+b],[0,-h*0.95+b],[3.4,-h*0.84+b],[0,-h*0.79+b]],p.accent); // Schopf
    C(ctx,-3,-h*0.64+b,1.6,p.dark); C(ctx,3,-h*0.64+b,1.6,p.dark);
    ctx.beginPath(); ctx.arc(0,-h*0.58+b,1.6,0.15*Math.PI,0.85*Math.PI); ctx.lineWidth=1.1; ctx.strokeStyle=p.dark; ctx.stroke();
  },
  glumander(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    const fl=1+Math.sin(m.t*9)*0.2;
    // Schwanz hinter dem Körper, Flamme als zwei Tropfen-Pfade an der Spitze
    ctx.beginPath(); ctx.moveTo(7,-h*0.26+b);
    ctx.quadraticCurveTo(14,-h*0.30+b, 15,-h*0.46+b);
    ctx.lineWidth=3.4; ctx.strokeStyle=p.body; ctx.lineCap='round'; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(15,-h*0.44+b);
    ctx.bezierCurveTo(12.5,-h*0.52+b, 13.5,-h*0.60+b, 15,-h*0.66+b);
    ctx.bezierCurveTo(16.8,-h*0.59+b, 17.2,-h*0.51+b, 15,-h*0.44+b);
    ctx.fillStyle='#e8703a'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15,-h*0.50+b);
    ctx.bezierCurveTo(14,-h*0.55+b, 14.6,-h*0.60+b, 15.2,-h*0.62+b);
    ctx.bezierCurveTo(16,-h*0.57+b, 15.8,-h*0.52+b, 15,-h*0.50+b);
    ctx.fillStyle='#f6d34c'; ctx.fill();
    // Körper: aufrechte Echsenform als Pfad
    ctx.beginPath();
    ctx.moveTo(-7,0);
    ctx.bezierCurveTo(-9,-h*0.36+b, -6,-h*0.58+b, 0,-h*0.60+b);
    ctx.bezierCurveTo(6,-h*0.60+b, 9,-h*0.36+b, 7,0);
    ctx.bezierCurveTo(3,-1.5, -3,-1.5, -7,0);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); // Bauchfeld mit zwei Segmentlinien
    ctx.moveTo(0,-h*0.48+b);
    ctx.bezierCurveTo(4,-h*0.47+b, 5,-h*0.24+b, 3,-h*0.07+b);
    ctx.bezierCurveTo(1,-h*0.02+b, -2,-h*0.03+b, -3.4,-h*0.09+b);
    ctx.bezierCurveTo(-4.6,-h*0.25+b, -3.6,-h*0.47+b, 0,-h*0.48+b);
    ctx.fillStyle=p.belly; ctx.fill();
    LN(ctx,-3.4,-h*0.30+b,3.8,-h*0.30+b,0.9,p.accent); LN(ctx,-3,-h*0.18+b,3.2,-h*0.18+b,0.9,p.accent);
    // Kopf mit Schnauze
    ctx.beginPath();
    ctx.moveTo(-7,-h*0.58+b);
    ctx.bezierCurveTo(-8,-h*0.78+b, -4,-h*0.86+b, 0,-h*0.86+b);
    ctx.bezierCurveTo(4,-h*0.86+b, 7,-h*0.80+b, 7.5,-h*0.66+b);
    ctx.bezierCurveTo(5,-h*0.55+b, -4,-h*0.52+b, -7,-h*0.58+b);
    ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-6,-h*0.62+b],[-10,-h*0.50+b],[-6,-h*0.44+b]],p.body); PG(ctx,[[6,-h*0.62+b],[10,-h*0.50+b],[6,-h*0.44+b]],p.body); // Arme
    face(ctx,m,0,-h*0.70+b,2.9,1.55,m.look);
    PG(ctx,[[-7,0],[-2,0],[-4,-2.6]],p.accent); PG(ctx,[[7,0],[2,0],[4,-2.6]],p.accent); // Füße
  },
  kattiva(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Schwanz steht hinter dem Rumpf auf und kringelt sich an der Spitze
    ctx.beginPath(); ctx.moveTo(10,-h*0.36+b);
    ctx.bezierCurveTo(16,-h*0.42+b, 17,-h*0.66+b, 13,-h*0.74+b);
    ctx.lineWidth=3; ctx.strokeStyle=p.body; ctx.lineCap='round'; ctx.stroke();
    // Beine: vorn unter der Brust, hinten unter der Hüfte
    PG(ctx,[[-8,-h*0.28+b],[-5,-h*0.28+b],[-5.5,-2],[-5,0],[-9,0],[-7,-2]],p.accent);
    PG(ctx,[[6,-h*0.28+b],[9,-h*0.28+b],[8.5,-2],[9,0],[5,0],[7,-2]],p.accent);
    // Schlanker Rumpf als Pfad
    ctx.beginPath();
    ctx.moveTo(-11,-h*0.28+b);
    ctx.bezierCurveTo(-12,-h*0.50+b, -6,-h*0.60+b, 1,-h*0.60+b);
    ctx.bezierCurveTo(8,-h*0.60+b, 12,-h*0.48+b, 11,-h*0.34+b);
    ctx.bezierCurveTo(10,-h*0.25+b, 3,-h*0.23+b, -3,-h*0.24+b);
    ctx.bezierCurveTo(-8,-h*0.24+b, -10,-h*0.25+b, -11,-h*0.28+b);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8,-h*0.30+b);
    ctx.bezierCurveTo(-2,-h*0.25+b, 5,-h*0.25+b, 9,-h*0.32+b);
    ctx.bezierCurveTo(4,-h*0.38+b, -5,-h*0.38+b, -8,-h*0.30+b);
    ctx.fillStyle=p.belly; ctx.fill();
    // Ohren versiegelt, Kopf links mit Schnauze
    PG(ctx,[[-14,-h*0.58+b],[-16,-h*0.84+b],[-11,-h*0.66+b]],p.body);
    PG(ctx,[[-7,-h*0.62+b],[-5,-h*0.86+b],[-2,-h*0.60+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(-5,-h*0.56+b);
    ctx.bezierCurveTo(-8,-h*0.71+b, -13,-h*0.72+b, -16,-h*0.63+b);
    ctx.lineTo(-19,-h*0.54+b); ctx.lineTo(-17,-h*0.46+b);
    ctx.bezierCurveTo(-13,-h*0.41+b, -8,-h*0.43+b, -6,-h*0.48+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-19,-h*0.55+b],[-17,-h*0.46+b],[-14,-h*0.46+b],[-16,-h*0.58+b]],p.belly); // Schnauze
    face(ctx,m,-11,-h*0.60+b,2.5,1.45,m.look);
    // Herz auf der Stirn: zwei Bögen + Spitze
    ctx.beginPath();
    ctx.moveTo(-11,-h*0.78+b);
    ctx.bezierCurveTo(-13,-h*0.83+b, -11.8,-h*0.88+b, -11,-h*0.84+b);
    ctx.bezierCurveTo(-10.2,-h*0.88+b, -9,-h*0.83+b, -11,-h*0.78+b);
    ctx.fillStyle=p.accent; ctx.fill();
    PG(ctx,[[-9,0],[-4,0],[-6,-2.4]],p.body); PG(ctx,[[5,0],[9,0],[7,-2.4]],p.body); // Pfoten
  },
  chillo(ctx,m){ const p=m.pal,h=m.h,b=m.bob, curl=m.idleKey==='curl'?1:0;
    if(curl){
      // Eingerollt: Körper als Bogenform, Schwanz legt sich herum, Kopf ruht vorn
      ctx.beginPath();
      ctx.moveTo(-10,-h*0.08+b);
      ctx.bezierCurveTo(-12,-h*0.42+b, -5,-h*0.62+b, 3,-h*0.58+b);
      ctx.bezierCurveTo(10,-h*0.54+b, 12,-h*0.28+b, 8,-h*0.10+b);
      ctx.bezierCurveTo(4,-h*0.02+b, -6,-h*0.01+b, -10,-h*0.08+b);
      ctx.fillStyle=p.body; ctx.fill();
      ctx.beginPath(); ctx.moveTo(7,-h*0.12+b); ctx.quadraticCurveTo(13,-h*0.16+b, 12,-h*0.34+b);
      ctx.lineWidth=3; ctx.strokeStyle=p.accent; ctx.lineCap='round'; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8,-h*0.30+b);
      ctx.bezierCurveTo(-9,-h*0.50+b, -5,-h*0.56+b, -2,-h*0.52+b);
      ctx.bezierCurveTo(1,-h*0.48+b, 1,-h*0.36+b, -2,-h*0.30+b);
      ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
      face(ctx,m,-4,-h*0.42+b,2.2,1.25,m.look);
      return;
    }
    // Langgestreckt: Schwanz hinten zuerst
    ctx.beginPath(); ctx.moveTo(10,-h*0.34+b);
    ctx.quadraticCurveTo(17,-h*0.38+b, 18,-h*0.56+b);
    ctx.lineWidth=3.6; ctx.strokeStyle=p.accent; ctx.lineCap='round'; ctx.stroke();
    C(ctx,18,-h*0.58+b,2.2,p.belly);
    // Beine kurz unter Brust und Hüfte
    PG(ctx,[[-8,-h*0.24+b],[-5,-h*0.24+b],[-5.5,-2],[-5,0],[-9,0],[-7,-2]],p.accent);
    PG(ctx,[[6,-h*0.24+b],[9,-h*0.24+b],[8.5,-2],[9,0],[5,0],[7,-2]],p.accent);
    // Körper mit gewölbtem Rücken als Pfad
    ctx.beginPath();
    ctx.moveTo(-11,-h*0.26+b);
    ctx.bezierCurveTo(-12,-h*0.48+b, -5,-h*0.58+b, 3,-h*0.57+b);
    ctx.bezierCurveTo(9,-h*0.56+b, 13,-h*0.44+b, 12,-h*0.32+b);
    ctx.bezierCurveTo(11,-h*0.23+b, 3,-h*0.20+b, -4,-h*0.21+b);
    ctx.bezierCurveTo(-8,-h*0.21+b, -10,-h*0.22+b, -11,-h*0.26+b);
    ctx.fillStyle=p.body; ctx.fill();
    LN(ctx,-4,-h*0.53+b,-3,-h*0.42+b,1,p.accent); LN(ctx,2,-h*0.54+b,3,-h*0.43+b,1,p.accent); // Rückenschuppen
    // Kopf vorn mit Horn und Schnauze
    PG(ctx,[[-13,-h*0.58+b],[-16,-h*0.74+b],[-9,-h*0.62+b]],p.accent);
    ctx.beginPath();
    ctx.moveTo(-6,-h*0.52+b);
    ctx.bezierCurveTo(-8,-h*0.64+b, -12,-h*0.65+b, -15,-h*0.57+b);
    ctx.lineTo(-17,-h*0.49+b); ctx.lineTo(-15,-h*0.42+b);
    ctx.bezierCurveTo(-11,-h*0.38+b, -7,-h*0.41+b, -6,-h*0.46+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    face(ctx,m,-11,-h*0.53+b,2.3,1.35,m.look);
    PG(ctx,[[-9,0],[-4,0],[-6,-2.2]],p.body); PG(ctx,[[5,0],[9,0],[7,-2.2]],p.body);
  },
  tanzee(ctx,m){ const p=m.pal,h=m.h,b=m.bob, sw=Math.sin(m.t*2)*0.15;
    // Greifschwanz geschwungen hinter dem Körper
    ctx.beginPath(); ctx.moveTo(6,-h*0.34+b);
    ctx.bezierCurveTo(14,-h*0.40+b, 16,-h*0.62+b, 12,-h*0.76+b);
    ctx.lineWidth=3; ctx.strokeStyle=p.accent; ctx.lineCap='round'; ctx.stroke();
    C(ctx,12,-h*0.77+b,2,p.accent);
    // Füße + lange Arme laufen außen am Rumpf zu Boden
    PG(ctx,[[-8,0],[-3,0],[-5,-3]],p.dark); PG(ctx,[[8,0],[3,0],[5,-3]],p.dark);
    ctx.save(); ctx.translate(0,-h*0.5+b); ctx.rotate(sw);
    // Arme zuerst (hinter dem Rumpf, Hände unten heraus)
    PG(ctx,[[-8,-2],[-13,7],[-10,9],[-6,3]],p.body); PG(ctx,[[8,-2],[13,7],[10,9],[6,3]],p.body);
    // Rumpf als Pfad mit Schultern und schmaler Taille
    ctx.beginPath();
    ctx.moveTo(-7,10);
    ctx.bezierCurveTo(-9,2, -8,-4, -4,-7);
    ctx.bezierCurveTo(0,-9, 5,-8, 7,-4);
    ctx.bezierCurveTo(9,1, 8,7, 6,10);
    ctx.bezierCurveTo(2,12, -4,12, -7,10);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); // Bauchfeld folgt dem Rumpf
    ctx.moveTo(0,0);
    ctx.bezierCurveTo(4.5,0, 6,5, 3.5,9.5);
    ctx.bezierCurveTo(1,11.5, -2,11, -3.8,8.5);
    ctx.bezierCurveTo(-5.5,5, -4,0.5, 0,0);
    ctx.fillStyle=p.belly; ctx.fill();
    // Ohren vor dem Kopf versiegelt, Kopf-Pfad darüber
    PG(ctx,[[-7,-h*0.30],[-10,-h*0.42],[-4,-h*0.35]],p.body); PG(ctx,[[7,-h*0.30],[10,-h*0.42],[4,-h*0.35]],p.body);
    ctx.beginPath();
    ctx.moveTo(-6.5,-h*0.16);
    ctx.bezierCurveTo(-7,-h*0.32, -3.5,-h*0.40, 0,-h*0.40);
    ctx.bezierCurveTo(3.5,-h*0.40, 7,-h*0.32, 6.5,-h*0.16);
    ctx.bezierCurveTo(4,-h*0.08, -4,-h*0.08, -6.5,-h*0.16);
    ctx.fillStyle=p.body; ctx.fill();
    face(ctx,m,0,-h*0.235,2.9,1.45,m.look);
    E(ctx,-4.4,-h*0.155,1.45,1.05,p.belly); E(ctx,4.4,-h*0.155,1.45,1.05,p.belly); // Wangen innen
    ctx.restore();
  },
  entoro(ctx,m){ const p=m.pal,h=m.h,b=m.bob, wob=m.idleKey==='headache'?Math.sin(m.idleT*6)*0.12:0;
    PG(ctx,[[-7,0],[-2,0],[-4,-2.6]],'#e8a84a'); PG(ctx,[[7,0],[2,0],[4,-2.6]],'#e8a84a'); // Füße
    ctx.save(); ctx.translate(0,-h*0.38+b); ctx.rotate(wob);
    // Flügel an den Kopfseiten (statt Kreise)
    PG(ctx,[[-8,-h*0.34],[-12,-h*0.20],[-7,-h*0.16]],p.body); PG(ctx,[[8,-h*0.34],[12,-h*0.20],[7,-h*0.16]],p.body);
    // Körper: Birnen-Pfad, Kopf geht oben in den Leib über
    ctx.beginPath();
    ctx.moveTo(0,-h*0.62);
    ctx.bezierCurveTo(7,-h*0.62, 10,-h*0.30, 9,h*0.16);
    ctx.bezierCurveTo(8,h*0.34, 4,h*0.38, 0,h*0.38);
    ctx.bezierCurveTo(-5,h*0.38, -9,h*0.32, -9,h*0.12);
    ctx.bezierCurveTo(-10,-h*0.28, -7,-h*0.62, 0,-h*0.62);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); // Bauchfeld
    ctx.moveTo(0,-h*0.05);
    ctx.bezierCurveTo(5,-h*0.05, 6.5,h*0.16, 4,h*0.30);
    ctx.bezierCurveTo(2,h*0.35, -2,h*0.35, -4,h*0.29);
    ctx.bezierCurveTo(-6.5,h*0.15, -4.5,-h*0.05, 0,-h*0.05);
    ctx.fillStyle=p.belly; ctx.fill();
    // Flacher Entenschnabel als breite Form unter den Augen
    PG(ctx,[[-5,-h*0.42],[5,-h*0.42],[3.4,-h*0.30],[-3.4,-h*0.30]],'#e8e0c9');
    LN(ctx,-3.4,-h*0.365,3.4,-h*0.365,0.9,p.dark);
    C(ctx,-3,-h*0.52,1.45,p.dark); C(ctx,3,-h*0.52,1.45,p.dark); // leere Augen
    PG(ctx,[[-2,-h*0.60],[0,-h*0.66],[2,-h*0.60]],p.accent); // kleiner Kopffleck
    ctx.restore();
  },
  melpaka(ctx,m){ const p=m.pal,h=m.h,b=m.bob, nk=Math.sin(m.t*1.5)*2;
    // Beine: vier schlanke, verjüngte Formen unter dem Leib
    PG(ctx,[[-9,-h*0.24+b],[-6,-h*0.24+b],[-6.5,-2],[-6,0],[-10,0],[-8,-2]],p.accent);
    PG(ctx,[[6,-h*0.24+b],[9,-h*0.24+b],[8.5,-2],[9,0],[5,0],[7,-2]],p.accent);
    PG(ctx,[[-4,-h*0.24+b],[-1,-h*0.24+b],[-1.5,-2],[-1,0],[-5,0],[-3,-2]],p.dark);
    // Leib mit Wollkante oben (Büschel statt Kreise)
    ctx.beginPath();
    ctx.moveTo(-12,-h*0.08+b);
    ctx.bezierCurveTo(-13,-h*0.20+b, -12.5,-h*0.30+b, -11,-h*0.36+b);
    for(let i=0;i<5;i++){ const x0=-11+i*4.8; ctx.bezierCurveTo(x0+0.8,-h*0.52+b, x0+4.0,-h*0.52+b, x0+4.8,-h*0.40+b); }
    ctx.bezierCurveTo(13.5,-h*0.28+b, 13.5,-h*0.16+b, 12,-h*0.08+b);
    ctx.bezierCurveTo(6,-h*0.01+b, -6,-h*0.01+b, -12,-h*0.08+b);
    ctx.fillStyle=p.body; ctx.fill();
    // Hals: gebogene Form von der Leibkante hoch zum Kopf (schwenkt mit nk)
    ctx.beginPath();
    ctx.moveTo(5,-h*0.34+b);
    ctx.bezierCurveTo(6,-h*0.58+b, 7+nk*0.4,-h*0.72+b, 8+nk,-h*0.80+b);
    ctx.lineTo(13+nk,-h*0.76+b);
    ctx.bezierCurveTo(12+nk,-h*0.62+b, 11,-h*0.48+b, 10,-h*0.32+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    // Kopf am Halsende: Schädel-Pfad, Schnauze, Ohren, Wollschopf
    PG(ctx,[[7+nk,-h*0.82+b],[5+nk,-h*0.94+b],[9+nk,-h*0.86+b]],p.body);
    PG(ctx,[[13+nk,-h*0.84+b],[15+nk,-h*0.94+b],[16+nk,-h*0.82+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(7+nk,-h*0.72+b);
    ctx.bezierCurveTo(7+nk,-h*0.86+b, 10+nk,-h*0.90+b, 12.5+nk,-h*0.87+b);
    ctx.bezierCurveTo(15+nk,-h*0.84+b, 16+nk,-h*0.76+b, 15+nk,-h*0.69+b);
    ctx.bezierCurveTo(12+nk,-h*0.64+b, 8+nk,-h*0.65+b, 7+nk,-h*0.72+b);
    ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[13+nk,-h*0.72+b],[16.5+nk,-h*0.70+b],[15+nk,-h*0.64+b],[12.5+nk,-h*0.65+b]],p.belly); // Schnauze
    PG(ctx,[[8+nk,-h*0.87+b],[10+nk,-h*0.95+b],[12+nk,-h*0.88+b],[10+nk,-h*0.83+b]],p.belly); // Schopf
    face(ctx,m,11+nk,-h*0.78+b,2.3,1.25,m.look);
    PG(ctx,[[-11,0],[-6,0],[-8,-2.4]],p.dark); PG(ctx,[[5,0],[10,0],[8,-2.4]],p.dark); // Füße
  },
  fuxparks(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    const fl=1+Math.sin(m.t*8)*0.18;
    // Großer Fuchsschwanz hinter dem Rumpf, Flammenspitze als innere Form
    ctx.beginPath();
    ctx.moveTo(9,-h*0.30+b);
    ctx.bezierCurveTo(16,-h*0.36+b, 18,-h*0.62+b, 14,-h*0.78+b);
    ctx.bezierCurveTo(11,-h*0.86+b, 8,-h*0.58+b, 8,-h*0.40+b);
    ctx.closePath(); ctx.fillStyle=p.accent; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13,-h*0.52+b);
    ctx.bezierCurveTo(15,-h*0.60+b, 15,-h*0.70+b, 13.4,-h*0.74+b);
    ctx.bezierCurveTo(12,-h*0.66+b, 12,-h*0.58+b, 13,-h*0.52+b);
    ctx.save(); ctx.translate(13,-h*0.60+b); ctx.scale(fl,fl); ctx.translate(-13,h*0.60-b); ctx.fillStyle='#f6d34c'; ctx.fill(); ctx.restore();
    // Beine unter Brust und Hüfte
    PG(ctx,[[-8,-h*0.28+b],[-5,-h*0.28+b],[-5.5,-2],[-5,0],[-9,0],[-7,-2]],p.dark);
    PG(ctx,[[6,-h*0.28+b],[9,-h*0.28+b],[8.5,-2],[9,0],[5,0],[7,-2]],p.dark);
    // Schlanker Fuchsrumpf als Pfad
    ctx.beginPath();
    ctx.moveTo(-11,-h*0.28+b);
    ctx.bezierCurveTo(-12,-h*0.50+b, -6,-h*0.60+b, 1,-h*0.60+b);
    ctx.bezierCurveTo(8,-h*0.60+b, 12,-h*0.48+b, 11,-h*0.34+b);
    ctx.bezierCurveTo(10,-h*0.25+b, 3,-h*0.23+b, -3,-h*0.24+b);
    ctx.bezierCurveTo(-8,-h*0.24+b, -10,-h*0.25+b, -11,-h*0.28+b);
    ctx.fillStyle=p.body; ctx.fill();
    // Ohren versiegelt, Kopf mit spitzer Schnauze links
    PG(ctx,[[-14,-h*0.58+b],[-16,-h*0.84+b],[-11,-h*0.66+b]],p.body);
    PG(ctx,[[-7,-h*0.62+b],[-5,-h*0.86+b],[-2,-h*0.60+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(-5,-h*0.56+b);
    ctx.bezierCurveTo(-8,-h*0.71+b, -13,-h*0.72+b, -16,-h*0.63+b);
    ctx.lineTo(-20,-h*0.54+b); ctx.lineTo(-18,-h*0.46+b);
    ctx.bezierCurveTo(-14,-h*0.41+b, -8,-h*0.43+b, -6,-h*0.48+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-19,-h*0.55+b],[-17,-h*0.46+b],[-13,-h*0.47+b],[-16,-h*0.59+b]],p.belly); // Schnauze, zentriert
    face(ctx,m,-11,-h*0.60+b,2.5,1.45,m.look);
    PG(ctx,[[-9,0],[-4,0],[-6,-2.4]],p.body); PG(ctx,[[5,0],[9,0],[7,-2.4]],p.body); // Pfoten
  },
  killamari(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Seitenfinnen hinter dem Mantel
    PG(ctx,[[-8,-h*0.62+b],[-13,-h*0.50+b],[-8,-h*0.42+b]],p.accent);
    PG(ctx,[[8,-h*0.62+b],[13,-h*0.50+b],[8,-h*0.42+b]],p.accent);
    // Tentakel: wellige, verjüngte Formen unterschiedlicher Länge
    for(let i=-2;i<=2;i++){
      const x0=i*3.6, len=h*(0.30+0.07*Math.abs(2-Math.abs(i))), sway=Math.sin(m.t*3+i*1.3)*1.8;
      ctx.beginPath();
      ctx.moveTo(x0-1.6,-h*0.34+b);
      ctx.quadraticCurveTo(x0-1+sway,-h*0.34+b+len*0.6, x0+sway,-h*0.34+b+len);
      ctx.quadraticCurveTo(x0+0.8+sway,-h*0.34+b+len+1.6, x0+1.7,-h*0.34+b+len*0.55);
      ctx.lineTo(x0+1.6,-h*0.34+b);
      ctx.closePath(); ctx.fillStyle=p.accent; ctx.fill();
    }
    // Mantel: spitz zulaufender Pfad statt Oval
    ctx.beginPath();
    ctx.moveTo(0,-h*0.94+b);
    ctx.bezierCurveTo(6,-h*0.88+b, 9,-h*0.62+b, 8,-h*0.40+b);
    ctx.bezierCurveTo(7,-h*0.30+b, 3,-h*0.27+b, 0,-h*0.27+b);
    ctx.bezierCurveTo(-3,-h*0.27+b, -7,-h*0.30+b, -8,-h*0.40+b);
    ctx.bezierCurveTo(-9,-h*0.62+b, -6,-h*0.88+b, 0,-h*0.94+b);
    ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-4,-h*0.80+b],[0,-h*0.66+b],[4,-h*0.80+b],[0,-h*0.72+b]],p.belly); // Mantelfleck
    face(ctx,m,0,-h*0.52+b,3.3,1.7,m.look);
  },
  schnarcho(ctx,m){ const p=m.pal,h=m.h,b=m.bob, br=Math.sin(m.t*1.2)*1.2;
    // Massive, tief liegende Gestalt: Körper als breite Tropfen-/Lastform
    PG(ctx,[[-13,0],[-6,0],[-9,-3]],p.accent); PG(ctx,[[13,0],[6,0],[9,-3]],p.accent); // Füße
    PG(ctx,[[-16,-h*0.42+b],[-20,-h*0.18+b],[-15,-h*0.10+b]],p.body); // Arme hängen außen
    PG(ctx,[[16,-h*0.42+b],[20,-h*0.18+b],[15,-h*0.10+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(-15,-h*0.04+b);
    ctx.bezierCurveTo(-17,-h*0.38+b+br*0.3, -11,-h*0.64+b, 0,-h*0.66+b);
    ctx.bezierCurveTo(11,-h*0.64+b, 17,-h*0.38+b+br*0.3, 15,-h*0.04+b);
    ctx.bezierCurveTo(8,-h*0.01+b, -8,-h*0.01+b, -15,-h*0.04+b);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); // großer Bauch, folgt der Hülle
    ctx.moveTo(0,-h*0.50+b);
    ctx.bezierCurveTo(8,-h*0.49+b, 11,-h*0.24+b, 8,-h*0.07+b);
    ctx.bezierCurveTo(4,-h*0.02+b, -4,-h*0.02+b, -8,-h*0.07+b);
    ctx.bezierCurveTo(-11,-h*0.24+b, -8,-h*0.50+b, 0,-h*0.50+b);
    ctx.fillStyle=p.belly; ctx.fill();
    // Kleiner Kopf oben aufgesetzt, Ohren versiegelt
    PG(ctx,[[-6,-h*0.82+b],[-8,-h*0.94+b],[-2,-h*0.86+b]],p.body);
    PG(ctx,[[6,-h*0.82+b],[8,-h*0.94+b],[2,-h*0.86+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(-8,-h*0.68+b);
    ctx.bezierCurveTo(-8,-h*0.86+b, -4,-h*0.90+b, 0,-h*0.90+b);
    ctx.bezierCurveTo(4,-h*0.90+b, 8,-h*0.86+b, 8,-h*0.68+b);
    ctx.bezierCurveTo(4,-h*0.62+b, -4,-h*0.62+b, -8,-h*0.68+b);
    ctx.fillStyle=p.body; ctx.fill();
    face(ctx,m,0,-h*0.77+b+br*0.15,3.4,1.55,m.look);
    LN(ctx,-3,-h*0.58+b,3,-h*0.58+b,0.9,p.accent); // Bauchlinie
  },
  daedream(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Schwebender Geist: Körper läuft unten in drei Wellen-Zipfel aus
    ctx.beginPath();
    ctx.moveTo(0,-h*0.96+b);
    ctx.bezierCurveTo(7,-h*0.94+b, 9,-h*0.68+b, 8,-h*0.42+b);
    for(let i=0;i<3;i++){
      const x0=8-i*5.3;
      ctx.quadraticCurveTo(x0-1.2,-h*0.30+b+Math.sin(m.t*3+i)*1.6, x0-2.6,-h*0.40+b);
      ctx.quadraticCurveTo(x0-4,-h*0.30+b+Math.sin(m.t*3+i+1)*1.6, x0-5.3,-h*0.42+b);
    }
    ctx.bezierCurveTo(-9,-h*0.68+b, -7,-h*0.94+b, 0,-h*0.96+b);
    ctx.fillStyle=p.body; ctx.fill();
    PG(ctx,[[-5,-h*0.88+b],[0,-h*1.04+b],[5,-h*0.88+b],[0,-h*0.82+b]],p.accent); // Mond-Zipfel
    ctx.beginPath(); // Bauchschimmer
    ctx.moveTo(0,-h*0.72+b);
    ctx.bezierCurveTo(4,-h*0.71+b, 5.5,-h*0.55+b, 3.5,-h*0.44+b);
    ctx.bezierCurveTo(1,-h*0.40+b, -2,-h*0.41+b, -3.6,-h*0.46+b);
    ctx.bezierCurveTo(-5,-h*0.56+b, -3.5,-h*0.72+b, 0,-h*0.72+b);
    ctx.fillStyle=p.belly; ctx.fill();
    face(ctx,m,0,-h*0.66+b,3,1.7,m.look);
    C(ctx,-7,-h*0.82+b,1.3,'rgba(255,255,255,.8)'); C(ctx,7,-h*0.74+b,1,'rgba(255,255,255,.7)');
    PG(ctx,[[-8,-h*0.56+b],[-11,-h*0.46+b],[-7,-h*0.42+b]],p.body); PG(ctx,[[8,-h*0.56+b],[11,-h*0.46+b],[7,-h*0.42+b]],p.body); // Ärmchen
  },
  gengaru(ctx,m){ const p=m.pal,h=m.h,b=m.bob, al=m.idleKey==='fade'?0.5+Math.sin(m.idleT*4)*0.3:0.92;
    ctx.save(); ctx.globalAlpha=al;
    // Schatten-Geist: runder Leib, unten in Zacken zerfasert
    ctx.beginPath();
    ctx.moveTo(0,-h*0.92+b);
    ctx.bezierCurveTo(8,-h*0.90+b, 12,-h*0.62+b, 11,-h*0.34+b);
    for(let i=0;i<4;i++){
      const x0=11-i*5.5;
      ctx.lineTo(x0-2,-h*0.10+b); ctx.lineTo(x0-4.5,-h*0.26+b);
    }
    ctx.bezierCurveTo(-12,-h*0.62+b, -8,-h*0.90+b, 0,-h*0.92+b);
    ctx.fillStyle=p.body; ctx.fill();
    // Spitze Ohren, tief in den Schädel eingelassen
    PG(ctx,[[-9,-h*0.72+b],[-13,-h*0.98+b],[-4,-h*0.80+b]],p.body);
    PG(ctx,[[9,-h*0.72+b],[13,-h*0.98+b],[4,-h*0.80+b]],p.body);
    PG(ctx,[[-8.5,-h*0.78+b],[-10.5,-h*0.90+b],[-6,-h*0.81+b]],p.accent);
    // Breites Grinsen als Sichel mit zwei Zähnen
    ctx.beginPath(); ctx.arc(0,-h*0.46+b,7,0.12*Math.PI,0.88*Math.PI); ctx.closePath(); ctx.fillStyle='#f6f0f6'; ctx.fill();
    PG(ctx,[[-4,-h*0.335+b],[-1,-h*0.335+b],[-2.5,-h*0.24+b]],'#f6f0f6');
    PG(ctx,[[2,-h*0.335+b],[5,-h*0.335+b],[3.5,-h*0.24+b]],'#f6f0f6');
    C(ctx,-5,-h*0.64+b,2.2,'#e2574c'); C(ctx,5,-h*0.64+b,2.2,'#e2574c');
    PG(ctx,[[-11,-h*0.44+b],[-14,-h*0.34+b],[-10,-h*0.30+b]],p.body); PG(ctx,[[11,-h*0.44+b],[14,-h*0.34+b],[10,-h*0.30+b]],p.body); // Krallenärmchen
    ctx.restore();
  },
  bisamoss(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    const bl=1+Math.sin(m.t*2)*0.05;
    // Knospen-Rücken zuerst: geschlossene Blütenform aus drei Blättern
    ctx.save(); ctx.translate(6,-h*0.58+b); ctx.scale(bl,bl); ctx.translate(-6,h*0.58-b);
    ctx.beginPath(); // runde Knospe: Bulbus mit geschwungenen Seiten
    ctx.moveTo(1,-h*0.40+b);
    ctx.bezierCurveTo(-0.5,-h*0.62+b, 2,-h*0.80+b, 5.5,-h*0.80+b);
    ctx.bezierCurveTo(9,-h*0.80+b, 10.5,-h*0.60+b, 9,-h*0.42+b);
    ctx.bezierCurveTo(6,-h*0.34+b, 3,-h*0.34+b, 1,-h*0.40+b);
    ctx.fillStyle=p.accent; ctx.fill();
    ctx.beginPath(); // inneres Blatt, folgt der Knospenform
    ctx.moveTo(3.4,-h*0.46+b);
    ctx.bezierCurveTo(3,-h*0.62+b, 4.4,-h*0.72+b, 6,-h*0.71+b);
    ctx.bezierCurveTo(7.6,-h*0.70+b, 8,-h*0.56+b, 7,-h*0.46+b);
    ctx.bezierCurveTo(5.6,-h*0.41+b, 4.2,-h*0.41+b, 3.4,-h*0.46+b);
    ctx.fillStyle=p.belly; ctx.fill();
    ctx.restore();
    // Niedriger Vierbeiner-Rumpf als Pfad
    PG(ctx,[[-9,-h*0.26+b],[-6,-h*0.26+b],[-6.5,-2],[-6,0],[-10,0],[-8,-2]],p.dark);
    PG(ctx,[[7,-h*0.26+b],[10,-h*0.26+b],[9.5,-2],[10,0],[6,0],[8,-2]],p.dark);
    ctx.beginPath();
    ctx.moveTo(-11,-h*0.24+b);
    ctx.bezierCurveTo(-12,-h*0.48+b, -6,-h*0.58+b, 1,-h*0.58+b);
    ctx.bezierCurveTo(8,-h*0.58+b, 12,-h*0.46+b, 11,-h*0.30+b);
    ctx.bezierCurveTo(10,-h*0.21+b, 2,-h*0.19+b, -4,-h*0.20+b);
    ctx.bezierCurveTo(-8,-h*0.20+b, -10,-h*0.21+b, -11,-h*0.24+b);
    ctx.fillStyle=p.body; ctx.fill();
    LN(ctx,-2,-h*0.54+b,-1,-h*0.44+b,1,p.accent); LN(ctx,4,-h*0.55+b,5,-h*0.45+b,1,p.accent); // Moosflecken
    // Kopf links mit Ohr und stumpfer Schnauze
    PG(ctx,[[-13,-h*0.56+b],[-15,-h*0.72+b],[-9,-h*0.60+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(-5,-h*0.50+b);
    ctx.bezierCurveTo(-8,-h*0.63+b, -12,-h*0.64+b, -14,-h*0.56+b);
    ctx.lineTo(-16,-h*0.47+b); ctx.lineTo(-14,-h*0.40+b);
    ctx.bezierCurveTo(-10,-h*0.37+b, -7,-h*0.40+b, -6,-h*0.44+b);
    ctx.closePath(); ctx.fillStyle=p.body; ctx.fill();
    face(ctx,m,-10,-h*0.53+b,2.3,1.3,m.look);
    PG(ctx,[[-10,0],[-5,0],[-7,-2.2]],p.body); PG(ctx,[[6,0],[10,0],[8,-2.2]],p.body); // Füße
  },
  mewdu(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    ctx.save(); ctx.globalAlpha=0.22+Math.sin(m.t*1.5)*0.08; C(ctx,0,-h*0.5+b,19,p.accent); ctx.restore();
    // Langer Schweif hinter dem Körper, endet in einer Keule
    ctx.beginPath(); ctx.moveTo(4,-h*0.24+b);
    ctx.bezierCurveTo(13,-h*0.20+b, 16,-h*0.34+b, 14,-h*0.52+b+Math.sin(m.t*2)*2);
    ctx.lineWidth=3.4; ctx.strokeStyle=p.accent; ctx.lineCap='round'; ctx.stroke();
    C(ctx,14,-h*0.54+b+Math.sin(m.t*2)*2,2.6,p.accent);
    // Schwebender Körper: Tropfen-Pfad, unten schmal
    ctx.beginPath();
    ctx.moveTo(0,-h*0.78+b);
    ctx.bezierCurveTo(7,-h*0.76+b, 9,-h*0.52+b, 6,-h*0.30+b);
    ctx.bezierCurveTo(4,-h*0.16+b, 1,-h*0.08+b, 0,-h*0.06+b);
    ctx.bezierCurveTo(-1,-h*0.08+b, -4,-h*0.16+b, -6,-h*0.30+b);
    ctx.bezierCurveTo(-9,-h*0.52+b, -7,-h*0.76+b, 0,-h*0.78+b);
    ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); // Bauchfeld
    ctx.moveTo(0,-h*0.58+b);
    ctx.bezierCurveTo(3.6,-h*0.57+b, 4.6,-h*0.36+b, 2.6,-h*0.22+b);
    ctx.bezierCurveTo(1,-h*0.15+b, -1.4,-h*0.16+b, -2.8,-h*0.24+b);
    ctx.bezierCurveTo(-4.4,-h*0.38+b, -3.2,-h*0.58+b, 0,-h*0.58+b);
    ctx.fillStyle=p.belly; ctx.fill();
    // Ärmchen seitlich
    PG(ctx,[[-7,-h*0.52+b],[-11,-h*0.40+b],[-6,-h*0.36+b]],p.body);
    PG(ctx,[[7,-h*0.52+b],[11,-h*0.40+b],[6,-h*0.36+b]],p.body);
    // Ohren lang nach oben, versiegelt; Kopf-Pfad
    PG(ctx,[[-5,-h*0.92+b],[-6,-h*1.06+b],[-1,-h*0.96+b]],p.body);
    PG(ctx,[[5,-h*0.92+b],[6,-h*1.06+b],[1,-h*0.96+b]],p.body);
    ctx.beginPath();
    ctx.moveTo(-7,-h*0.76+b);
    ctx.bezierCurveTo(-7,-h*0.94+b, -3,-h*0.99+b, 0,-h*0.99+b);
    ctx.bezierCurveTo(3,-h*0.99+b, 7,-h*0.94+b, 7,-h*0.76+b);
    ctx.bezierCurveTo(4,-h*0.68+b, -4,-h*0.68+b, -7,-h*0.76+b);
    ctx.fillStyle=p.body; ctx.fill();
    face(ctx,m,0,-h*0.84+b,3,1.75,m.look);
    // Schwebende Fußstummel
    PG(ctx,[[-4,-h*0.08+b],[0,-h*0.08+b],[-2,1.5]],p.body); PG(ctx,[[4,-h*0.08+b],[0,-h*0.08+b],[2,1.5]],p.body);
  },
  ufo(ctx,m){ const p=m.pal,h=m.h,b=m.bob;
    // Schwebe-Glow unter dem Teller (sanfte Atmung)
    ctx.save(); ctx.globalAlpha=0.16+Math.sin(m.t*1.6)*0.07; C(ctx,0,-h*0.34+b,21,p.accent); ctx.restore();
    // Landegestell: drei Beine, mittleres kürzer
    LN(ctx,-h*0.30,-h*0.14+b,-h*0.40,-0.5,2.4,p.dark); LN(ctx,h*0.30,-h*0.14+b,h*0.40,-0.5,2.4,p.dark);
    LN(ctx,0,-h*0.10+b,0,-1,2.2,p.dark);
    // Discus-Teller: breite, flache Untertasse mit heller Oberseite
    ctx.beginPath(); ctx.ellipse(0,-h*0.30+b, h*0.58, h*0.20, 0, 0, TAU); ctx.fillStyle=p.body; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0,-h*0.36+b, h*0.50, h*0.13, 0, 0, TAU); ctx.fillStyle=p.belly; ctx.fill();
    // Kuppel oben, grünlich schimmernd
    ctx.beginPath(); ctx.arc(0,-h*0.40+b, h*0.27, Math.PI, 0); ctx.closePath();
    ctx.fillStyle=p.accent; ctx.save(); ctx.globalAlpha=0.85; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0,-h*0.40+b, h*0.27, Math.PI, 0); ctx.lineWidth=1.4; ctx.strokeStyle=p.dark; ctx.stroke();
    // Gesicht in der Kuppel
    face(ctx,m,0,-h*0.50+b,3.2,1.7,m.look);
    // Antenne mit Glühkugel
    LN(ctx,0,-h*0.66+b,0,-h*0.84+b,1.6,p.dark);
    C(ctx,0,-h*0.86+b,2.6+Math.sin(m.t*4)*0.5,p.accent);
    // Lichterreihe am Tellerrand, im Idle „glow“ pulsierend
    const glow=m.idleKey==='glow'?0.6+Math.sin(m.t*6)*0.4:0.55;
    for(let i=-2;i<=2;i++){ ctx.save(); ctx.globalAlpha=glow; C(ctx,i*h*0.20,-h*0.16+b,2.6,p.accent); ctx.restore(); }
  },
};

/* ------------------------------------------------------------- Partikel */
function drawParticle(ctx,p){
  const a=Math.max(0,Math.min(1,p.life/p.max));
  ctx.save(); ctx.globalAlpha=a;
  switch(p.kind){
    case 'spark': LN(ctx,p.x-3,p.y,p.x+3,p.y,1.6,'#f6d34c'); LN(ctx,p.x,p.y-3,p.x,p.y+3,1.6,'#f6d34c'); break;
    case 'star': PG(ctx,[[p.x,p.y-4],[p.x+1.4,p.y-1.4],[p.x+4,p.y],[p.x+1.4,p.y+1.4],[p.x,p.y+4],[p.x-1.4,p.y+1.4],[p.x-4,p.y],[p.x-1.4,p.y-1.4]],'#f6e8a8'); break;
    case 'drop': C(ctx,p.x,p.y,2,'#7fb6d9'); break;
    case 'splash': C(ctx,p.x,p.y,1.6,'#bcd9e8'); break;
    case 'bubble': ctx.beginPath(); ctx.arc(p.x,p.y,2.4,0,TAU); ctx.lineWidth=1; ctx.strokeStyle='rgba(220,240,250,.9)'; ctx.stroke(); break;
    case 'note': C(ctx,p.x,p.y,2,'#f2b6c9'); LN(ctx,p.x+2,p.y,p.x+2,p.y-7,1.4,'#f2b6c9'); LN(ctx,p.x+2,p.y-7,p.x+5,p.y-5,1.4,'#f2b6c9'); break;
    case 'zzz': ctx.fillStyle='rgba(230,236,250,.9)'; ctx.font='bold 10px sans-serif'; ctx.fillText('z',p.x,p.y); break;
    case 'heart': PG(ctx,[[p.x,p.y+3],[p.x-3.4,p.y-0.6],[p.x-2,p.y-3],[p.x,p.y-1.4],[p.x+2,p.y-3],[p.x+3.4,p.y-0.6]],'#e2574c'); break;
    case 'steam': C(ctx,p.x,p.y,2.6,'rgba(240,244,250,.6)'); break;
    case 'petal': E(ctx,p.x,p.y,2.4,1.4,'#f2b6c9'); break;
    case 'coin': C(ctx,p.x,p.y,2.6,'#e8c95a'); C(ctx,p.x,p.y,1.4,'#f6e8a8'); break;
    case 'letter': RR(ctx,p.x-4,p.y-3,8,6,1,'#f6f0e0'); LN(ctx,p.x-4,p.y-3,p.x,p.y+0.5,1,'#c9a86a'); LN(ctx,p.x+4,p.y-3,p.x,p.y+0.5,1,'#c9a86a'); break;
    case 'frost': LN(ctx,p.x-3,p.y,p.x+3,p.y,1,'#cfe6f2'); LN(ctx,p.x,p.y-3,p.x,p.y+3,1,'#cfe6f2'); LN(ctx,p.x-2,p.y-2,p.x+2,p.y+2,1,'#cfe6f2'); break;
    case 'dust': C(ctx,p.x,p.y,2,'rgba(180,175,160,.7)'); break;
    case 'crumb': C(ctx,p.x,p.y,1.2,'#c9a86a'); break;
    case 'aurora': E(ctx,p.x,p.y,6,2,'rgba(168,138,201,.5)'); break;
    case 'dream': ctx.beginPath(); ctx.arc(p.x,p.y,4,0,TAU); ctx.lineWidth=1; ctx.strokeStyle='rgba(201,182,232,.9)'; ctx.stroke(); C(ctx,p.x,p.y,1.4,'#c9b6e8'); break;
  }
  ctx.restore();
}

/* =============================================================== Factory */
export function createLuniMons(world){
  const rng = world.rng || Math.random;
  const house = world.house || HOUSE;
  const R = (a,b)=>a+rng()*(b-a);
  const RI = (a,b)=>Math.floor(R(a,b+1));
  const pick = arr=>arr[Math.floor(rng()*arr.length)];

  const mons=[]; const particles=[];
  let unlocked=0; let actBudget=0; let time=0;

  function floorOf(y){ let best='live',bd=1e9; for(const k in house.floors){ const d=Math.abs(house.floors[k].y-y); if(d<bd){bd=d;best=k;} } return best; }
  function roomAt(floor,x){ for(const r of house.rooms){ if(r.floor===floor&&x>=r.x0&&x<=r.x1) return r.id; } return house.rooms.find(r=>r.floor===floor).id; }
  function propPos(id){ const p=house.props[id]; return p?{x:p.x,y:house.floors[p.floor].y,floor:p.floor}:null; }

  function pathTo(m,tx,tf){
    const path=[]; const cf=m.floor;
    if(cf===tf){ path.push({x:tx,y:house.floors[tf].y}); }
    else {
      // finde Treppe zwischen cf und tf (ein Schritt, sonst über live)
      const order=['attic','bed','live','base'];
      let cur=cf;
      while(cur!==tf){
        const dir=order.indexOf(tf)>order.indexOf(cur)?1:-1;
        const next=order[order.indexOf(cur)+dir];
        const st=house.stairs.find(s=>(s.a===cur&&s.b===next)||(s.b===cur&&s.a===next));
        if(!st){ break; }
        const fromY=house.floors[cur].y, toY=house.floors[next].y;
        const ex = st.y0===fromY? st.x0: st.x1;
        const xx = st.y0===fromY? st.x1: st.x0;
        path.push({x:ex,y:fromY}); path.push({x:xx,y:toY,stair:true});
        cur=next;
      }
      path.push({x:tx,y:house.floors[tf].y});
    }
    m.path=path; m.state='walk';
  }

  function spawn(sp){
    const door=house.props.mail;
    const m={
      sp, id:sp.id, name:sp.name, pal:sp.pal, h:sp.h, speed:sp.speed,
      x:door.x+R(-6,6), y:house.floors[door.floor].y, floor:door.floor,
      dir:1, look:0, bob:0, blink:0, blinkT:R(1,4), sleep:0, mouth:'',
      state:'idle', timer:R(1,3), path:[], t:R(0,9), idleKey:'', idleT:0,
      actT:0, actDur:0, actKind:'', actFired:false, cd:R(2,8), emote:null, emoteT:0,
      fly:!!sp.act.fly, ghost:!!sp.act.ghost, home:sp.act.home||null,
    };
    if(m.home==='aquarium'){ const a=propPos('aquarium'); m.x=a.x; m.floor=a.floor; m.y=a.y-26; }
    mons.push(m);
    burst(m.x,m.y-m.h*0.5,'star',10);
    world.events && world.events.push({type:'unlock',id:sp.id,name:sp.name,day:sp.day,tier:sp.tier});
    return m;
  }
  function burst(x,y,kind,n){ for(let i=0;i<n;i++){ particles.push({kind,x:x+R(-8,8),y:y+R(-8,8),vx:R(-14,14),vy:R(-26,-6),life:R(.6,1.2),max:1.2,g:kind==='drop'||kind==='splash'?60:8}); } }
  function emit(kind,x,y,n,spread){ for(let i=0;i<n;i++){ particles.push({kind,x:x+R(-spread,spread),y:y+R(-spread,spread),vx:R(-8,8),vy:R(-20,-4),life:R(.7,1.4),max:1.4,g:0}); } }

  function setUnlockedCount(n){
    n=Math.max(0,Math.min(SPECIES.length,n|0));
    if(n>unlocked){ for(const sp of SPECIES){ if(sp.day>unlocked&&sp.day<=n) spawn(sp); } }
    else if(n<unlocked){ for(let i=mons.length-1;i>=0;i--){ if(mons[i].sp.day>n) mons.splice(i,1); } }
    unlocked=n;
    if(unlocked>=6) world.flags.aquarium=true;
  }
  function unlockForDate(date){
    let m,dateD;
    try{
      const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',month:'numeric',day:'numeric'});
      const parts=fmt.formatToParts(date); m=+parts.find(p=>p.type==='month').value; dateD=+parts.find(p=>p.type==='day').value;
    }catch(e){ m=date.getMonth()+1; dateD=date.getDate(); }
    setUnlockedCount(m===12?Math.min(24,dateD):0);
  }

  /* ---------------------------------------------------- Verhalten */
  function chooseIdle(m){
    m.state='idle'; m.timer=R(3.5,9); m.idleKey=pick(m.sp.idle); m.idleT=0;
    if(world.night>0.5 && (m.sp.act.sleepy||m.idleKey==='nap') && rng()<0.6){ goToNap(m); }
  }
  function goToNap(m){
    const spot=pick(['bedNap','sofa','rug','beanbag']); const p=propPos(spot);
    pathTo(m,p.x+R(-14,14),p.floor); m.nap=true;
  }
  function wander(m){
    const r=pick(house.rooms); const tx=R(r.x0+14,r.x1-14);
    pathTo(m,tx,r.floor); m.nap=false;
  }
  function tryAbility(m){
    if(actBudget>=3) return false;
    if(m.cd>0) return false;
    const a=m.sp.act; let target=a.target;
    if(target==='switch:auto'){
      const luni=world.actors&&world.actors.luni; if(!luni) return false;
      const fl=luni.floor;
      if(world.lights[fl]) return false;             // Licht schon an
      if(world.night<0.25) return false;
      target='switch:'+fl;
    }
    if(target==='aquarium'&&!world.flags.aquarium) return false;
    if(target==='garland'){ const p={x:780,y:house.floors.bed.y,floor:'bed'}; m.actTarget=p; }
    else if(target==='aurora'){ m.actTarget={x:m.x,y:m.y,floor:m.floor}; }
    else if(target.startsWith('switch:')){ const fl=target.slice(7); m.actTarget={x:house.switches[fl],y:house.floors[fl].y,floor:fl,switchFl:fl}; }
    else { const p=propPos(target); if(!p) return false; m.actTarget=p; }
    m.actKind=a.kind; m.actDur=a.dur; m.actT=0; m.actFired=false;
    pathTo(m,m.actTarget.x+R(-6,6),m.actTarget.floor);
    m.state='walk'; m.toAct=true; m.cd=R(a.cd[0],a.cd[1]);
    return true;
  }
  function fireAbility(m){
    const k=m.actKind, t=m.actTarget, F=world.flags;
    switch(k){
      case 'light': world.lights[t.switchFl]=true; burst(t.x,t.y-30,'spark',8); break;
      case 'water': F.plant=Math.min(1,(F.plant||0)+0.25); emit('drop',t.x,t.y-30,8,10); break;
      case 'cuddle': emit('heart',m.x,m.y-m.h,4,10); attractNap(m); break;
      case 'yarn': emit('crumb',t.x,t.y-10,6,14); burst(t.x,t.y-14,'star',4); break;
      case 'plump': F.cushion=3; emit('star',t.x,t.y-24,5,12); break;
      case 'splash': emit('splash',t.x,t.y-30,10,12); emit('bubble',t.x,t.y-26,4,8); break;
      case 'coin': emit('coin',t.x,t.y-8,4,10); break;
      case 'frost': emit('frost',t.x,t.y-30,6,10); break;
      case 'letter': F.mail=4; emit('letter',t.x,t.y-20,2,6); break;
      case 'lullaby': emit('note',m.x,m.y-m.h,6,12); lullaby(m); break;
      case 'sweep': F.dust=Math.max(0,(F.dust==null?1:F.dust)-0.3); emit('dust',t.x,t.y-6,8,16); break;
      case 'candle': F.candle=6; emit('steam',t.x,t.y-40,3,6); burst(t.x,t.y-40,'spark',3); break;
      case 'tidy': F.tidy=Math.min(1,(F.tidy||0)+0.25); emit('crumb',t.x,t.y-10,4,10); break;
      case 'frostwin': F.frost=Math.min(1,(F.frost||0)+0.25); emit('frost',t.x,t.y-40,8,14); break;
      case 'garland': F.garland=Math.min(1,(F.garland||0)+0.25); emit('star',780,house.floors.bed.y-40,6,16); break;
      case 'calm': F.tv=0; emit('steam',t.x,t.y-30,3,8); break;
      case 'blanket': F.cushion=4; emit('heart',t.x,t.y-24,3,10); break;
      case 'cocoa': F.cocoa=6; emit('steam',t.x,t.y-34,6,6); break;
      case 'dust': emit('dust',t.x,t.y-50,8,14); break;
      case 'nap': m.sleep=1; emit('zzz',m.x,m.y-m.h,3,6); break;
      case 'dream': emit('dream',t.x,t.y-40,4,12); break;
      case 'boo': burst(m.x,m.y-m.h*0.5,'star',6); world.lights.base=!world.lights.base; break;
      case 'bloom': F.flowers=Math.min(1,(F.flowers||0)+0.25); emit('petal',t.x,t.y-30,8,12); break;
      case 'aurora': F.aurora=6; emit('aurora',m.x,m.y-m.h,10,30); break;
    }
  }
  function attractNap(m){ for(const o of mons){ if(o!==m&&Math.abs(o.x-m.x)<60&&o.floor===m.floor&&o.state==='idle'){ o.sleep=Math.max(o.sleep,0.6); } } }
  function lullaby(m){ for(const o of mons){ if(o!==m&&Math.abs(o.x-m.x)<80&&o.floor===m.floor){ o.sleep=1; o.state='idle'; o.timer=R(4,8); } } }

  function social(m){
    for(const o of mons){
      if(o===m||o.floor!==m.floor||Math.abs(o.x-m.x)>40) continue;
      if(o.state!=='idle'||m.state!=='idle') continue;
      if(rng()<0.5){
        m.emote='heart'; m.emoteT=1.4; o.emote='heart'; o.emoteT=1.4;
        m.timer=Math.max(m.timer,1.5); o.timer=Math.max(o.timer,1.5);
        world.events&&world.events.push({type:'play',a:m.id,b:o.id});
        return true;
      }
    }
    // Haustiere begrüßen
    for(const key of ['hund','katze']){
      const pet=world.actors&&world.actors[key];
      if(pet&&pet.floor===m.floor&&Math.abs(pet.x-m.x)<40&&rng()<0.4){
        m.emote='heart'; m.emoteT=1.4; world.events&&world.events.push({type:'pet',mon:m.id,pet:key});
        return true;
      }
    }
    return false;
  }

  function updateMon(m,dt){
    m.t+=dt; m.cd-=dt; m.blinkT-=dt;
    if(m.blinkT<=0){ m.blink=1; m.blinkT=R(2,5); }
    m.blink=Math.max(0,m.blink-dt*6);
    if(m.emoteT>0){ m.emoteT-=dt; if(m.emoteT<=0)m.emote=null; }
    m.bob=Math.sin(m.t*2.2)*1.4;
    if(m.fly||m.ghost) m.bob=Math.sin(m.t*1.4)*3;

    if(m.state==='walk'){
      const node=m.path[0];
      if(!node){ m.state='idle'; m.timer=R(1,3); if(m.toAct){m.state='act';m.actT=0;actBudget++;} m.toAct=false; return; }
      const dx=node.x-m.x, dy=node.y-m.y, d=Math.hypot(dx,dy);
      const sp=m.speed*(node.stair?0.8:1);
      if(d<sp*dt){ m.x=node.x; m.y=node.y; m.path.shift(); if(node.stair)m.floor=floorOf(m.y); }
      else { m.x+=dx/d*sp*dt; m.y+=dy/d*sp*dt; m.dir=dx>=0?1:-1; m.look=m.dir*0.6; }
      m.sleep=0;
    }
    else if(m.state==='act'){
      m.actT+=dt; m.look=0;
      if(!m.actFired&&m.actT>m.actDur*0.4){ m.actFired=true; fireAbility(m); }
      if(m.actT>=m.actDur){ actBudget=Math.max(0,actBudget-1); m.state='idle'; m.timer=R(2,5); m.actKind=''; }
    }
    else if(m.state==='idle'){
      m.idleT+=dt; m.timer-=dt;
      if(m.sleep>0){ m.sleep=Math.min(1,m.sleep+dt*0.5); if(rng()<dt*0.5) emit('zzz',m.x,m.y-m.h,1,4); }
      if(m.timer<=0){
        m.sleep=0; m.idleKey='';
        if(tryAbility(m)){} else if(social(m)){} else if(rng()<0.6){ wander(m); } else chooseIdle(m);
      }
    }
    // Magikarpfen bleibt im Aquarium
    if(m.home==='aquarium'&&m.state!=='act'){ const a=propPos('aquarium'); m.x=a.x+Math.sin(m.t*0.7)*14; m.y=a.y-26+Math.sin(m.t*1.3)*3; m.floor=a.floor; }
  }

  function update(dt){
    time+=dt;
    // Pakitschu: Licht aus, wenn Luni den Raum verlässt
    const luni=world.actors&&world.actors.luni;
    if(luni){
      for(const fl in world.lights){
        if(world.lights[fl]&&luni.floor!==fl&&world.night>0.25){
          world._lightOff=world._lightOff||{}; world._lightOff[fl]=(world._lightOff[fl]||0)+dt;
          if(world._lightOff[fl]>2.5){ world.lights[fl]=false; world._lightOff[fl]=0;
            const pk=mons.find(m=>m.id==='pakitschu'); if(pk) burst(house.switches[fl],house.floors[fl].y-30,'spark',5); }
        } else if(world._lightOff) world._lightOff[fl]=0;
      }
    }
    for(const m of mons) updateMon(m,dt);
    for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=(p.g||0)*dt; if(p.life<=0)particles.splice(i,1); }
    // Timer-Flags abklingen
    for(const k of ['cocoa','candle','tv','mail','cushion','aurora']){ if(world.flags[k]>0) world.flags[k]=Math.max(0,world.flags[k]-dt); }
  }

  function drawMon(ctx,m){
    ctx.save(); ctx.translate(m.x,m.y);
    if(m.dir<0&&!m.fly) ctx.scale(-1,1);
    if(m.sleep>0.5&&m.state!=='walk'){ ctx.translate(0,2); ctx.scale(1,0.92); }
    DRAW[m.id](ctx,m);
    ctx.restore();
    if(m.emote){ ctx.save(); ctx.globalAlpha=Math.min(1,m.emoteT); drawParticle(ctx,{kind:m.emote,x:m.x,y:m.y-m.h-8,life:1,max:1}); ctx.restore(); }
  }
  function draw(ctx){
    const sorted=[...mons].sort((a,b)=>a.y-b.y);
    for(const m of sorted) drawMon(ctx,m);
    for(const p of particles) drawParticle(ctx,p);
  }
  function hitTest(x,y){
    for(let i=mons.length-1;i>=0;i--){ const m=mons[i]; if(Math.abs(x-m.x)<m.h*0.6&&y>m.y-m.h-6&&y<m.y+4) return m; }
    return null;
  }
  function serialize(){ return {unlocked, flags:world.flags}; }
  function deserialize(o){ if(!o)return; world.flags=Object.assign(world.flags,o.flags||{}); setUnlockedCount(o.unlocked||0); }

  return { update, draw, setUnlockedCount, unlockForDate, hitTest, serialize, deserialize,
           list:()=>mons, get unlocked(){return unlocked;}, SPECIES };
}
