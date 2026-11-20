/* LUNI-MON STUDIO (src/studio/studio.js) – Teststudio, nutzt window.LuniMons.
   Erzeugt pro Spezies eine eigene Modul-Instanz mit genau einem Mon
   (Liste wird auf das Ziel-Mon zurechtgeschnitten) und steuert dessen
   interne Zustände (state/idleKey/actKind/sleep/blink/emote) zum Testen. */
(function(){
'use strict';
const LM = window.LuniMons;
const HOUSE = LM.HOUSE;
/* Zwei Herkünfte, eine Liste: zuerst die Studio-Mons mit Verhalten (src/game/lunimons.js),
   danach die Mons des Spiels (src/game/mons.ts). Die Spiel-Mons sind reine Zeichnungen; ihr
   Maler wird unverändert über drawLuniMon des Spiels aufgerufen (siehe spawnMaler). */
const SM = window.SpielMons;
const SPECIES = LM.SPECIES.concat(SM.LUNI_MONS.map(m=>({
  maler:true, tuer:m.tuer, id:'spiel-'+String(m.tuer).padStart(2,'0')+'-'+m.name.toLowerCase(),
  name:m.name, day:m.tuer, h:m.groesse, idle:[],
  ort:m.ort, beschreibung:m.beschreibung, faehigkeit:m.faehigkeit, farben:m.farben,
})));
const N = SPECIES.length;
const $ = id => document.getElementById(id);

const STUDIO_VERSION='1.10';   /* Bei jeder Änderung hochzählen: 1.02, 1.03, … */
const TIERNAME=['gewöhnlich','ungewöhnlich','selten','legendär'];
const ABILITY={
 pakitschu:'Schaltet das Licht an, wenn Luni einen dunklen Raum betritt – und wieder aus, wenn sie geht.',
 schiggly:'Gießt die Pflanzen und füllt das Aquarium nach.',
 evolino:'Kuschel-Aura: setzt sich zu anderen und lädt zum Nickerchen ein.',
 flamiao:'Jagt Wollknäuel und angelt Geschenke vom Baum.',
 lamball:'Rollt sich über die Sofa-Kissen und plustert sie auf.',
 magikarpfen:'Lebt im Aquarium und planscht mit einem Sprung.',
 mauzimo:'Findet Münzen und legt sie unter den Baum.',
 pingulett:'Rutscht über den Boden und pustet Frost in den Kühlschrank.',
 floppi:'Bringt Briefe zur Tür – hops, hops.',
 pummelu:'Singt ein Schlaflied; Noten schweben, Nachbarn dösen ein.',
 sweeo:'Fegt Staubmäuse weg und wischt den Boden glänzend.',
 glumander:'Zündet Kerzen am Klavier an und wärmt den Raum.',
 kattiva:'Räumt Kisten im Keller und stapelt sie ordentlich.',
 chillo:'Malt Frostblumen an die Fenster.',
 tanzee:'Hängt Girlanden an die Treppe.',
 entoro:'Beruhigt flackernden Fernseher mit einem Kopf-Aua.',
 melpaka:'Breitet eine Decke aus und wird selbst zum Kissen.',
 fuxparks:'Wärmt den Kakao, bis Dampf aufsteigt.',
 killamari:'Schwebt hoch und stäubt die oberen Regale ab.',
 schnarcho:'Legt sich quer auf den Teppich und schnarcht; andere klettern über den Bauch.',
 daedream:'Schwebt über Schlafenden und schenkt Traumblasen.',
 gengaru:'Geistert durch Wände und knipst das Kellerlicht als Schabernack.',
 bisamoss:'Lässt Blumen am Fenster aufblühen.',
 mewdu:'Legendär: legt eine Aurora über das Haus und lässt ein Mon sanft schweben.',
 ufo:'Klassische fliegende Untertasse: schwebt lautlos, blinkt mit den Lichtern und zieht einen grünen Strahl herab.',
};
const VORBILD={pakitschu:'Pikachu',schiggly:'Schiggy',evolino:'Evoli',flamiao:'Flamiau',lamball:'Lamball (Palworld)',
 magikarpfen:'Karpador',mauzimo:'Mauzi',pingulett:'Pengullet (Palworld)',floppi:'Flopie (Palworld)',pummelu:'Pummeluff',
 sweeo:'Swee (Palworld)',glumander:'Glumanda',kattiva:'Cattiva (Palworld)',chillo:'Chillet (Palworld)',tanzee:'Tanzee (Palworld)',
 entoro:'Enton',melpaka:'Melpaca (Palworld)',fuxparks:'Foxparks (Palworld)',killamari:'Killamari (Palworld)',schnarcho:'Relaxo',
 daedream:'Daedream (Palworld)',gengaru:'Gengar',bisamoss:'Bisasam',mewdu:'Mewtu',ufo:'Klassisches UFO'};
const IDLE_LABEL={ear:'Ohren zucken',spark:'Wangen-Funken',shell:'Im Panzer verstecken',blink:'Blinzeln',fluff:'Schweif-Fluff',
 nap:'Nickerchen',pounce:'Sprungbereit wackeln',tail:'Schwanz',roll:'Im Kreis rollen',bounce:'Hüpfen',flop:'Zappeln',
 bubble:'Blubberblasen',coin:'Münzen-Glanz',lick:'Pfote lecken',waddle:'Watscheln',slide:'Bauch-Rutschen',
 earflop:'Ohren schlackern',thump:'Hoppeln/Klopfen',inflate:'Aufpumpen',sway:'Schaukeln',spin:'Wie ein Mopp drehen',
 bob:'Wippen',flame:'Schwanz-Flamme',smoke:'Rauchring',stretch:'Strecken',curl:'Einrollen',shiver:'Frost-Schauer',
 hang:'Am Schwanz hängen',swing:'Schaukeln',headache:'Kopf-Aua-Wackeln',wobble:'Wackeln',neck:'Hals schwenken',
 chew:'Kauen',hiccup:'Feuer-Schluckauf',drift:'Driften',tent:'Tentakel wackeln',belly:'Bauch-Atmung',roll2:'Umdrehen',
 sparkle:'Funkeln',fade:'Verblassen',giggle:'Kichern',bulb:'Knospe wackelt',sneeze:'Blüten-Niesen',float:'Schweben',glow:'Glühen'};
/* Angaben, die je nach Herkunft aus anderen Feldern kommen */
const tierText = sp => sp.maler ? 'aus dem Spiel' : TIERNAME[sp.tier];
const abilityText = sp => sp.maler ? sp.faehigkeit : (ABILITY[sp.id]||'');
const paletteOf = sp => sp.maler ? sp.farben : ['body','belly','accent','dark'].map(k=>({label:k, value:sp.pal[k]}));

/* ------------------------------------------------ Instanzen */
function makeWorld(){
  return { house:HOUSE,
    actors:{ luni:{x:300,y:420,floor:'live',room:'wohn'}, hund:{x:250,y:420,floor:'live'}, katze:{x:600,y:520,floor:'base'} },
    lights:{attic:false,bed:false,live:true,base:false},
    flags:{plant:0.2,garland:0,frost:0,tidy:0,flowers:0,cocoa:0,candle:0,tv:0,mail:0,cushion:0,aurora:0,dust:1,aquarium:true},
    night:0.8, weather:'schnee', events:[] };
}
function spawnOnly(sp){
  if(sp.maler) return spawnMaler(sp);
  const world=makeWorld();
  const inst=LM.createLuniMons(world);
  inst.setUnlockedCount(sp.day);
  const arr=inst.list();
  const mon=arr.find(m=>m.id===sp.id);
  arr.splice(0, arr.length, mon);            // nur dieses Mon behalten
  world.events.length=0;
  return {world, inst, mon};
}

/* Mon aus dem Spiel: kein Verhalten, nur die Zeit t läuft. Das Objekt trägt dieselben Felder
   wie ein Studio-Mon, damit Bühne, Karten und Export denselben Weg nehmen. */
function spawnMaler(sp){
  const mon={ sp, id:sp.id, name:sp.name, h:sp.h, x:0, y:0, floor:'–', dir:1, look:0, bob:0, blink:0, sleep:0,
              state:'idle', timer:0, path:[], t:0, idleKey:'', idleT:0, actT:0, actDur:0, actKind:'', emote:null, emoteT:0 };
  const inst={ update(dt){ mon.t+=dt; },
               draw(ctx){ SM.drawLuniMon(ctx, sp.tuer, mon.x, mon.y, mon.t, 1); } };
  return {world:{events:[]}, inst, mon};
}

/* ------------------------------------------------ Zustand */
const CX=320, BASE=250;                      // Bühnen-Anker (Weltkoordinaten)
let selIdx=0, P=null;                        // Auswahl + Preview-Instanz
let mode='idle';                             // idle | ability | walk | sleep
let idleKey=SPECIES[0].idle[0];
let zoom=4, playing=true, speedF=1, stepOnce=false;
let dirVal=1, actWait=0, walkTarget=500, studioT=0, fps=60;
const favs=new Set();
let selectedIds=[];
try{
  const saved=JSON.parse(localStorage.getItem('luni.studio.selection')||'[]');
  if(Array.isArray(saved)) selectedIds=saved.filter(id=>SPECIES.some(sp=>sp.id===id));
}catch(e){}
function saveSelection(){
  try{ localStorage.setItem('luni.studio.selection', JSON.stringify(selectedIds)); }catch(e){}
}

/* ------------------------------------------------ Preview-Steuerung */
function startAbility(){
  const sp=SPECIES[selIdx], m=P.mon;
  m.state='act'; m.actT=0; m.actDur=sp.act.dur; m.actKind=sp.act.kind; m.actFired=false;
  m.actTarget={x:m.x, y:m.y, floor:m.floor, switchFl:'live'};
  m.sleep=0;
}
function setMode(newMode, key){
  mode=newMode;
  if(key) idleKey=key;
  actWait=0;
  if(P){
    const m=P.mon;
    if(mode==='idle'){ m.state='idle'; m.timer=5; m.idleT=0; m.sleep=0; }
    if(mode==='sleep'){ m.state='idle'; m.timer=5; m.sleep=1; }
    if(mode==='walk'){ m.state='idle'; m.path=[]; walkTarget = m.x<CX?500:140; }
    if(mode==='ability'){ m.state='idle'; }
  }
  document.querySelectorAll('[data-mode]').forEach(b=>{
    b.classList.toggle('on', b.dataset.mode===mode && (mode!=='idle' || b.dataset.key===idleKey));
  });
}
function enforce(dt){
  const m=P.mon; if(!m) return;
  if(mode==='idle'){
    m.state='idle'; m.timer=Math.max(m.timer,3); m.idleKey=idleKey; m.sleep=0;
  } else if(mode==='sleep'){
    m.state='idle'; m.timer=Math.max(m.timer,3); m.sleep=1;
  } else if(mode==='ability'){
    if(m.state!=='act'){ actWait-=dt; if(actWait<=0) startAbility(); }
  } else if(mode==='walk'){
    m.sleep=0;
    if(m.state!=='walk' || !m.path || !m.path.length){
      walkTarget = (walkTarget===500)?140:500;
      m.path=[{x:walkTarget, y:BASE}]; m.state='walk';
    }
  }
}
function pinAndOrient(){
  const m=P.mon;
  if(mode!=='walk'){ m.x=CX; m.y=BASE; }
  else m.y=BASE;
  if(mode!=='walk') m.dir=dirVal;
  m.look=parseFloat($('look').value);
}

/* ------------------------------------------------ Auswahl */
function select(i, focusCard){
  selIdx=Math.max(0, Math.min(N-1, i));
  const sp=SPECIES[selIdx];
  idleKey=sp.idle[0];
  P=spawnOnly(sp);
  P.mon.x=CX; P.mon.y=BASE; P.mon.floor='live';
  buildAnimButtons();
  setMode(sp.maler?'idle':(mode==='ability'?'ability':(mode==='walk'?'walk':(mode==='sleep'?'sleep':'idle'))));
  for(const id of ['blinkBtn','emoteHeart','emoteNote','emoteZzz','dirL','dirR','look']) $(id).disabled=!!sp.maler;
  /* Detailkarte */
  $('dName').textContent=sp.name;
  $('dMeta').textContent='Nr. '+(selIdx+1)+' / '+N+' · Türchen Tag '+sp.day;
  $('dHerkunft').textContent=sp.maler?'Spiel · src/game/mons.ts':'Studio · src/game/lunimons.js';
  $('dOrt').textContent=sp.maler?sp.ort:'–';
  $('dBeschr').textContent=sp.maler?sp.beschreibung:'';
  $('dBeschr').hidden=!sp.maler;
  $('dTier').textContent=sp.maler?'–':TIERNAME[sp.tier]+' (Tier '+sp.tier+')';
  $('dId').textContent=sp.id;
  $('dVorbild').textContent=VORBILD[sp.id]||'–';
  $('dH').textContent=sp.h+' px (Original)';
  $('dSpeed').textContent=sp.maler?'–':sp.speed+' u/s';
  $('dIdle').textContent=sp.maler?'–':sp.idle.map(k=>k+' – '+(IDLE_LABEL[k]||k)).join(' · ');
  $('dAct').textContent=sp.maler?'angedacht, noch nicht gebaut':sp.act.kind+' → Ziel „'+sp.act.target+'“ · Cooldown '+sp.act.cd[0]+'–'+sp.act.cd[1]+' s · Dauer '+sp.act.dur+' s'
    +(sp.act.fly?' · fliegt':'')+(sp.act.ghost?' · Geist':'')+(sp.act.home?' · Zuhause: '+sp.act.home:'')+(sp.act.sleepy?' · schläfrig':'');
  $('dAbility').textContent=abilityText(sp);
  $('favBtn').textContent=favs.has(sp.id)?'★ Favorit':'☆ Favorit';
  /* Palette */
  const pal=$('palette'); pal.innerHTML='';
  for(const f of paletteOf(sp)){
    const b=document.createElement('button');
    b.className='swatch'; b.title='Hex kopieren';
    const chip=document.createElement('span'); chip.className='chip'; chip.style.background=f.value;
    const code=document.createElement('code'); code.textContent=f.value;
    b.appendChild(chip); b.appendChild(document.createTextNode(f.label)); b.appendChild(code);
    b.addEventListener('click',()=>copyText(f.value, 'Farbe '+f.label));
    pal.appendChild(b);
  }
  document.querySelectorAll('.card').forEach((c,ci)=>c.classList.toggle('on', ci===selIdx));
  /* Kein Scrollen zur Miniaturkarte: Bühne und Bedienleiste bleiben beim Blättern in Sicht. */
  renderSelection();
}

/* ------------------------------------------------ Animations-Buttons */
function buildAnimButtons(){
  const sp=SPECIES[selIdx], box=$('animBtns'); box.innerHTML='';
  if(sp.maler){
    const info=document.createElement('span'); info.className='sub';
    info.textContent='Mon aus dem Spiel: reine Zeichnung, nur die Zeit läuft. Zustände (Idle, Fähigkeit, Laufen, Schlafen) gibt es für dieses Mon noch nicht.';
    box.appendChild(info); return;
  }
  const mk=(label, title, fn)=>{
    const b=document.createElement('button');
    b.textContent=label; b.title=title||'';
    b.addEventListener('click',fn); box.appendChild(b); return b;
  };
  sp.idle.forEach(k=>{
    const b=mk('Idle: '+(IDLE_LABEL[k]||k), 'idleKey „'+k+'“', ()=>setMode('idle', k));
    b.dataset.mode='idle'; b.dataset.key=k;
  });
  const ab=mk('⚡ Fähigkeit: '+sp.act.kind+' (Loop)', 'actKind „'+sp.act.kind+'“, Dauer '+sp.act.dur+' s', ()=>setMode('ability'));
  ab.dataset.mode='ability';
  const wb=mk('🚶 Laufen', 'state „walk“, hin und her', ()=>setMode('walk'));
  wb.dataset.mode='walk';
  const sb=mk('💤 Schlafen', 'sleep = 1', ()=>setMode('sleep'));
  sb.dataset.mode='sleep';
}

/* ------------------------------------------------ Zwischenablage / Status */
let statusTimer=null;
function note(txt){
  $('status').textContent=txt;
  clearTimeout(statusTimer);
  statusTimer=setTimeout(()=>{ $('status').textContent='Bereit.'; }, 2600);
}
function copyText(txt, was){
  const done=()=>note(was+' kopiert: '+txt);
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done).catch(()=>fallback()); }
  else fallback();
  function fallback(){
    const ta=document.createElement('textarea');
    ta.value=txt; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); done(); }catch(e){ note('Kopieren nicht möglich: '+txt); }
    ta.remove();
  }
}

/* ------------------------------------------------ Auswahl & ZIP-Export */
function renderSelection(){
  const list=$('selList'); if(!list) return;
  list.innerHTML='';
  if(!selectedIds.length){
    const d=document.createElement('div');
    d.className='selEmpty';
    d.textContent='Noch leer. Mon auf der Bühne ansehen und „In Auswahl übernehmen“ klicken – oder unten eine Karte wählen.';
    list.appendChild(d);
  }
  selectedIds.forEach((id,pos)=>{
    const idx=SPECIES.findIndex(sp=>sp.id===id), sp=SPECIES[idx];
    const chip=document.createElement('div'); chip.className='selChip';
    const main=document.createElement('button');
    main.className='selMain small'; main.type='button';
    main.textContent=(pos+1)+'.  Nr. '+(idx+1)+' · '+sp.name;
    main.title='Auf der Bühne anzeigen';
    main.addEventListener('click',()=>select(idx,true));
    const del=document.createElement('button');
    del.className='selDel small'; del.type='button'; del.textContent='×';
    del.title=sp.name+' aus Auswahl entfernen';
    del.addEventListener('click',()=>{ selectedIds=selectedIds.filter(x=>x!==id); saveSelection(); renderSelection(); });
    chip.appendChild(main); chip.appendChild(del);
    list.appendChild(chip);
  });
  $('selCount').textContent=selectedIds.length+' von '+N+' Mons ausgewählt';
  $('zipBtn').disabled=!selectedIds.length;
  const cur=SPECIES[selIdx], inSel=selectedIds.includes(cur.id);
  const add=$('addSelBtn');
  add.textContent=inSel?'✓ '+cur.name+' ist in der Auswahl':'➕ '+cur.name+' in Auswahl übernehmen';
  add.classList.toggle('in', inSel);
  document.querySelectorAll('.card').forEach((card,ci)=>{
    const on=selectedIds.includes(SPECIES[ci].id);
    card.classList.toggle('inSel', on);
    const badge=card.querySelector('.cardSel');
    if(badge) badge.textContent=on?'✓':'';
  });
}
function addCurrentToSelection(){
  const sp=SPECIES[selIdx];
  if(selectedIds.includes(sp.id)){ note(sp.name+' ist bereits in der Auswahl.'); return; }
  selectedIds.push(sp.id); saveSelection(); renderSelection();
  note(sp.name+' zur Auswahl hinzugefügt ('+selectedIds.length+'/'+N+').');
}

/* --- PNG-Render eines Mons (Original-Zeichencode, transparent) --- */
/* Sprite-Rahmen in Einheiten: Breite, Höhe, Fußpunkt. Mons aus dem Spiel ragen bis zu 50 Einheiten
   über den Boden und bekommen deshalb einen höheren Rahmen; die Studio-Mons behalten 64×56. */
const spriteFrame = sp => sp.maler ? {w:64,h:80,ax:32,ay:68} : {w:64,h:56,ax:32,ay:48};
function monCanvas(sp, scale){
  const o=spawnOnly(sp), m=o.mon, fr=spriteFrame(sp);
  m.x=fr.ax; m.y=fr.ay; m.dir=1; m.look=0; m.t=1.1; m.bob=0; m.blink=0; m.sleep=0;
  m.state='idle'; m.idleKey=sp.idle[0]; m.idleT=0; m.emote=null; m.home=null;
  const cv=document.createElement('canvas');
  cv.width=fr.w*scale; cv.height=fr.h*scale;
  const c=cv.getContext('2d');
  c.scale(scale,scale);
  o.inst.draw(c);
  return cv;
}
function wrapCanvasText(c, text, x, y, maxW, lh){
  const words=String(text).split(' '); let line='', yy=y;
  for(const w of words){
    const test=line?line+' '+w:w;
    if(c.measureText(test).width>maxW && line){ c.fillText(line,x,yy); line=w; yy+=lh; }
    else line=test;
  }
  if(line) c.fillText(line,x,yy);
  return yy+lh;
}
function characterCard(sp, nr){
  const cv=document.createElement('canvas'); cv.width=960; cv.height=600;
  const c=cv.getContext('2d');
  const g=c.createLinearGradient(0,0,0,600);
  g.addColorStop(0,'#141c3d'); g.addColorStop(1,'#0d1226');
  c.fillStyle=g; c.fillRect(0,0,960,600);
  c.strokeStyle='#f6d34c'; c.lineWidth=6; c.strokeRect(8,8,944,584);
  c.fillStyle='#f6d34c'; c.font='800 40px sans-serif'; c.textAlign='left'; c.textBaseline='alphabetic';
  c.fillText(sp.name, 470, 92);
  c.fillStyle='#e8ecf7'; c.font='600 21px sans-serif';
  c.fillText('Nr. '+nr+' · Türchen Tag '+sp.day+' · '+tierText(sp), 470, 128);
  c.font='500 19px sans-serif'; c.fillStyle='#cdd6ee';
  const lines=sp.maler?[
    'Herkunft: Spiel (src/game/mons.ts)',
    'Höhe: '+sp.h+' px (Original)   ·   Wohnort: '+sp.ort,
  ]:[
    'ID: '+sp.id+'   ·   Vorbild: '+(VORBILD[sp.id]||'–'),
    'Höhe: '+sp.h+' px (Original)   ·   Tempo: '+sp.speed+' u/s',
    'Idle-Animationen: '+sp.idle.join(', '),
    'Fähigkeit: '+sp.act.kind+'  →  Ziel „'+sp.act.target+'“',
    'Cooldown: '+sp.act.cd[0]+'–'+sp.act.cd[1]+' s   ·   Dauer: '+sp.act.dur+' s'
      +(sp.act.fly?'   ·   fliegt':'')+(sp.act.ghost?'   ·   Geist':'')+(sp.act.home?'   ·   Zuhause: '+sp.act.home:''),
  ];
  let y=172;
  for(const ln of lines){ c.fillText(ln,470,y); y+=32; }
  if(sp.maler) y=wrapCanvasText(c, sp.beschreibung, 470, y, 440, 26)+6;
  y+=8;
  c.fillStyle='#f6e8a8'; c.font='700 19px sans-serif'; c.fillText('Fähigkeit im Spiel:',470,y); y+=28;
  c.fillStyle='#e8ecf7'; c.font='500 19px sans-serif';
  y=wrapCanvasText(c, abilityText(sp), 470, y, 440, 26);
  y+=14;
  c.fillStyle='#f6e8a8'; c.font='700 19px sans-serif'; c.fillText('Palette:',470,y); y+=12;
  for(const f of paletteOf(sp)){
    c.fillStyle=f.value; c.fillRect(470,y,26,26);
    c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=1; c.strokeRect(470,y,26,26);
    c.fillStyle='#e8ecf7'; c.font='500 18px sans-serif';
    c.fillText(f.label+': '+f.value, 506, y+19);
    y+=36;
  }
  /* Sprite groß */
  const spr=monCanvas(sp,6);
  c.fillStyle='rgba(255,255,255,.06)'; c.fillRect(30,60,400,430);
  c.strokeStyle='#2c3a75'; c.lineWidth=2; c.strokeRect(30,60,400,430);
  c.drawImage(spr, 38, 406-spriteFrame(sp).ay*6);   // Fußpunkt auf die Bodenlinie bei y=406
  c.strokeStyle='rgba(246,211,76,.75)'; c.beginPath(); c.moveTo(46,406); c.lineTo(414,406); c.stroke();
  c.fillStyle='#9aa3c0'; c.font='500 16px sans-serif';
  c.fillText('Sprite 6× · Originalhöhe '+sp.h+' px', 46, 468);
  c.fillText('Luni-Mon Studio · Charakterkarte', 30, 566);
  c.fillText(new Date().toLocaleDateString('de-DE'), 800, 566);
  return cv;
}
function contactSheet(list){
  const cols=Math.min(4,list.length), rows=Math.ceil(list.length/cols);
  const cv=document.createElement('canvas'); cv.width=cols*260; cv.height=rows*250;
  const c=cv.getContext('2d');
  c.fillStyle='#141c3d'; c.fillRect(0,0,cv.width,cv.height);
  list.forEach((sp,i)=>{
    const ox=(i%cols)*260, oy=Math.floor(i/cols)*250, nr=SPECIES.indexOf(sp)+1;
    c.strokeStyle='#2c3a75'; c.strokeRect(ox+5,oy+5,250,240);
    c.drawImage(monCanvas(sp,3), ox+34, oy+160-spriteFrame(sp).ay*3);
    c.fillStyle='#e8ecf7'; c.font='700 19px sans-serif'; c.textAlign='center';
    c.fillText(nr+'. '+sp.name, ox+130, oy+214);
    c.fillStyle='#9aa3c0'; c.font='500 15px sans-serif';
    c.fillText('Tag '+sp.day+' · '+tierText(sp)+' · '+sp.h+' px', ox+130, oy+236);
    c.textAlign='left';
  });
  return cv;
}

/* --- Download robust auslösen (Link muss im DOM hängen, sonst ignorieren ihn manche Browser) --- */
function triggerDownload(href, filename){
  const a=document.createElement('a');
  a.href=href; a.download=filename;
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>a.remove(), 500);
}
function downloadBlob(blob, filename){
  if(!window.URL || !URL.createObjectURL) throw new Error('Blob-Downloads werden von diesem Browser nicht unterstützt');
  const url=URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} }, 4000);
}

/* --- minimaler ZIP-Writer (STORE, ohne Kompression) --- */
const CRC_TABLE=(()=>{ const t=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[n]=c>>>0; } return t; })();
function crc32(bytes){ let c=0xFFFFFFFF; for(let i=0;i<bytes.length;i++) c=CRC_TABLE[(c^bytes[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function canvasBytes(cv){
  const b64=cv.toDataURL('image/png').split(',')[1];
  const bin=atob(b64); const out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}
function makeZip(files){
  const enc=new TextEncoder();
  const now=new Date();
  const dosTime=((now.getHours()&31)<<11)|((now.getMinutes()&63)<<5)|((now.getSeconds()>>1)&31);
  const dosDate=(((now.getFullYear()-1980)&127)<<9)|(((now.getMonth()+1)&15)<<5)|(now.getDate()&31);
  const chunks=[], central=[]; let offset=0;
  for(const f of files){
    const name=enc.encode(f.name), data=f.data, crc=crc32(data);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0,true);
    lh.setUint16(8,0,true); lh.setUint16(10,dosTime,true); lh.setUint16(12,dosDate,true);
    lh.setUint32(14,crc,true); lh.setUint32(18,data.length,true); lh.setUint32(22,data.length,true);
    lh.setUint16(26,name.length,true); lh.setUint16(28,0,true);
    chunks.push(new Uint8Array(lh.buffer), name, data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true);
    ch.setUint16(8,0,true); ch.setUint16(10,0,true); ch.setUint16(12,dosTime,true); ch.setUint16(14,dosDate,true);
    ch.setUint32(16,crc,true); ch.setUint32(20,data.length,true); ch.setUint32(24,data.length,true);
    ch.setUint16(28,name.length,true); ch.setUint32(42,offset,true);
    central.push(new Uint8Array(ch.buffer), name);
    offset+=30+name.length+data.length;
  }
  const centralSize=central.reduce((s,c)=>s+c.length,0);
  const end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);
  end.setUint16(8,files.length,true); end.setUint16(10,files.length,true);
  end.setUint32(12,centralSize,true); end.setUint32(16,offset,true);
  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], {type:'application/zip'});
}
function downloadSelectionZip(){
  try{ downloadSelectionZipInner(); }
  catch(e){
    console.error(e);
    note('ZIP-Fehler: '+e.message+' – Falls du das Studio in der Arena-Dateivorschau nutzt: Downloads sind dort blockiert, bitte Studio lokal oder über die Live-Vorschau öffnen.');
  }
}
function downloadSelectionZipInner(){
  if(!selectedIds.length){ note('Die Auswahl ist leer.'); return; }
  note('ZIP wird erstellt … ('+selectedIds.length+' Mons)');
  const list=selectedIds.map(id=>SPECIES.find(sp=>sp.id===id));
  const enc=new TextEncoder();
  const files=[];
  const auswahl={
    format:'luni-mons-auswahl', version:1,
    exportiertAm:new Date().toISOString(),
    anzahl:list.length,
    mons:list.map((sp,i)=>({
      position:i+1, nr:SPECIES.indexOf(sp)+1,
      species:sp, tierName:tierText(sp),
      vorbild:VORBILD[sp.id]||null, faehigkeitText:abilityText(sp),
    })),
  };
  files.push({name:'auswahl.json', data:enc.encode(JSON.stringify(auswahl,null,2))});
  const ids=list.map(sp=>"'"+sp.id+"'").join(', ');
  files.push({name:'README.md', data:enc.encode(
'# Luni-Mon Auswahl\n\n'+
'Exportiert aus dem Luni-Mon Studio am '+new Date().toLocaleString('de-DE')+'.\n'+
'Enthalten: '+list.length+' Mons: '+list.map(sp=>sp.name).join(', ')+'.\n\n'+
'## Inhalt\n'+
'- `auswahl.json` – alle Spezies-Daten (exakte SPECIES-Einträge) zum Implementieren\n'+
'- `charakterkarten/` – eine Charakterkarte pro Mon (PNG, 960×600)\n'+
'- `sprites/` – Sprite pro Mon in Originalgröße (1×) und groß (6×), transparent\n'+
'- `kontaktbogen.png` – Übersicht aller ausgewählten Mons\n\n'+
'## Ins Spiel übernehmen\n'+
'Studio-Mons liegen vollständig in `src/game/lunimons.js` (SPECIES + Zeichencode), Mons aus dem Spiel in `src/game/mons.ts` (LUNI_MONS).\n'+
'Für eine Auswahl genügt die ID-Liste, z. B.:\n\n'+
'```js\nconst AUSWAHL = ['+ids+'];\n'+
'const gewaehlt = SPECIES.filter(sp => AUSWAHL.includes(sp.id));\n```\n\n'+
'Die PNG-Sprites sind mit dem Original-Zeichencode gerendert (Idle „'+'erste Animation'+'“, statisch)\n'+
'und können alternativ als Bilder verwendet werden.\n')});
  files.push({name:'kontaktbogen.png', data:canvasBytes(contactSheet(list))});
  list.forEach(sp=>{
    const nr=String(SPECIES.indexOf(sp)+1).padStart(2,'0');
    files.push({name:'charakterkarten/'+nr+'-'+sp.id+'.png', data:canvasBytes(characterCard(sp, SPECIES.indexOf(sp)+1))});
    files.push({name:'sprites/'+nr+'-'+sp.id+'_1x.png', data:canvasBytes(monCanvas(sp,1))});
    files.push({name:'sprites/'+nr+'-'+sp.id+'_6x.png', data:canvasBytes(monCanvas(sp,6))});
  });
  const blob=makeZip(files);
  downloadBlob(blob, 'luni-mons-auswahl.zip');
  note('ZIP heruntergeladen: '+list.length+' Mons, '+files.length+' Dateien.');
}

/* --- Studio-Bundle: aktuelles Studio + alle Mons als ZIP --- */
function cleanedStudioRoot(){
  const root=document.documentElement.cloneNode(true);
  for(const sel of ['#overview','#selList','#palette','#animBtns','#dekoGrid']){
    const e=root.querySelector(sel); if(e) e.innerHTML='';
  }
  const st=root.querySelector('#status'); if(st) st.textContent='Bereit.';
  const ne=root.querySelector('#numEcho'); if(ne) ne.textContent='Nr. –';
  return root;
}
function gameModuleSource(){
  let src=$('lmGame').textContent;
  const cut=src.indexOf('window.LuniMons=');
  if(cut>0) src=src.slice(0,cut);
  src=src.replace(/^\s*\(function\(\)\{\s*/, '');
  src=src.replace('const HOUSE =', 'export const HOUSE =');
  src=src.replace('const SPECIES =', 'export const SPECIES =');
  src=src.replace('function createLuniMons(', 'export function createLuniMons(');
  return src.trim()+'\n';
}
function downloadStudioZip(){
  try{ downloadStudioZipInner(); }
  catch(e){
    console.error(e);
    note('Studio-ZIP-Fehler: '+e.message+' – Falls du das Studio in der Arena-Dateivorschau nutzt: Downloads sind dort blockiert, bitte Studio lokal oder über die Live-Vorschau öffnen.');
  }
}
function downloadStudioZipInner(){
  note('Studio-ZIP wird erstellt …');
  const enc=new TextEncoder();
  const files=[];
  const root=cleanedStudioRoot();
  files.push({name:'Luni-Mon-Studio.html', data:enc.encode('<!doctype html>\n'+root.outerHTML)});
  files.push({name:'src/game/lunimons.js', data:enc.encode(gameModuleSource())});
  files.push({name:'src/studio/studio.js', data:enc.encode($('lmStudio').textContent)});
  files.push({name:'src/studio/spiel-mons.js', data:enc.encode($('lmSpielMons').textContent)});
  files.push({name:'src/studio/deko.js', data:enc.encode($('lmDeko').textContent)});
  const styleEl=document.querySelector('style');
  if(styleEl) files.push({name:'src/studio/studio.css', data:enc.encode(styleEl.textContent)});
  const bodyClone=root.querySelector('body').cloneNode(true);
  bodyClone.querySelectorAll('script').forEach(s=>s.remove());
  files.push({name:'src/studio/body.html', data:enc.encode(bodyClone.innerHTML)});
  /* alle Mons */
  const all=SPECIES;
  const auswahl={
    format:'luni-mons-auswahl', version:1, studioVersion:STUDIO_VERSION,
    exportiertAm:new Date().toISOString(), anzahl:all.length,
    mons:all.map((sp,i)=>({ position:i+1, nr:i+1, species:sp, tierName:tierText(sp),
      vorbild:VORBILD[sp.id]||null, faehigkeitText:abilityText(sp) })),
  };
  files.push({name:'alle-mons/auswahl.json', data:enc.encode(JSON.stringify(auswahl,null,2))});
  files.push({name:'alle-mons/kontaktbogen.png', data:canvasBytes(contactSheet(all))});
  all.forEach(sp=>{
    const nr=String(SPECIES.indexOf(sp)+1).padStart(2,'0');
    files.push({name:'alle-mons/charakterkarten/'+nr+'-'+sp.id+'.png', data:canvasBytes(characterCard(sp, SPECIES.indexOf(sp)+1))});
    files.push({name:'alle-mons/sprites/'+nr+'-'+sp.id+'_1x.png', data:canvasBytes(monCanvas(sp,1))});
    files.push({name:'alle-mons/sprites/'+nr+'-'+sp.id+'_6x.png', data:canvasBytes(monCanvas(sp,6))});
  });
  files.push({name:'README.md', data:enc.encode(
'# Luni-Mon Studio – Bundle v'+STUDIO_VERSION+'\n\n'+
'Erstellt am '+new Date().toLocaleString('de-DE')+' mit dem Knopf „Luni-Mon-Studio-Bundle v'+STUDIO_VERSION+'“.\n\n'+
'## Start\n'+
'`Luni-Mon-Studio.html` einfach im Browser öffnen (Doppelklick genügt, kein Server nötig).\n'+
'Die Datei enthält alles: Studio-Code und alle '+N+' Luni-Mons.\n\n'+
'## Inhalt\n'+
'- `Luni-Mon-Studio.html` – das aktuelle Studio als Einzeldatei\n'+
'- `src/game/lunimons.js` – das Spielmodul (ES-Modul mit export, wie im Projekt)\n'+
'- `src/studio/` – Studio-Quellen (studio.js, studio.css, body.html)\n'+
'- `src/studio/spiel-mons.js` – die Mons des Spiels, erzeugt aus `src/game/mons.ts`\n'+
'- `src/studio/deko.js` – die Weihnachtsdeko, erzeugt aus `src/game/deko.ts`\n'+
'- `alle-mons/` – alle '+N+' Mons: auswahl.json, Charakterkarten, Sprites (1×/6×), Kontaktbogen\n\n'+
'## Hinweis zur Arena-Vorschau\n'+
'In der Arena-Dateivorschau läuft die Seite in einer Sandbox (nur Skripte erlaubt).\n'+
'Downloads und neue Fenster/Tabs sind dort vom Browser blockiert – das ist kein Fehler der Datei.\n'+
'Zum Herunterladen die ZIP aus dem Workspace laden oder das Studio lokal / über die Live-Vorschau öffnen.\n')});
  downloadBlob(makeZip(files), 'Luni-Mon-Studio-Bundle-v'+STUDIO_VERSION+'.zip');
  note('Studio-ZIP v'+STUDIO_VERSION+' heruntergeladen: Studio + '+N+' Mons, '+files.length+' Dateien.');
}

/* ------------------------------------------------ Übersicht (Originalgröße) */
const thumbs=[];
function buildOverview(){
  const ov=$('overview');
  SPECIES.forEach((sp,i)=>{
    const card=document.createElement('button');
    card.className='card'; card.type='button';
    card.title='Nr. '+(i+1)+': '+sp.name+' anzeigen';
    const head=document.createElement('span');
    head.className='cardHead';
    head.textContent=(i+1)+' · '+sp.name;
    const cv=document.createElement('canvas');
    cv.width=96; cv.height=80; cv.className='thumb';
    const foot=document.createElement('span');
    foot.className='cardFoot';
    foot.textContent='Tag '+sp.day+' · '+tierText(sp)+' · '+sp.h+'px';
    const fav=document.createElement('span');
    fav.className='cardFav'; fav.textContent='';
    const selBadge=document.createElement('span');
    selBadge.className='cardSel'; selBadge.textContent='';
    card.appendChild(head); card.appendChild(cv); card.appendChild(foot); card.appendChild(fav); card.appendChild(selBadge);
    card.addEventListener('click',()=>select(i,false));
    ov.appendChild(card);
    const inst=spawnOnly(sp);
    thumbs.push({sp, inst:inst.inst, mon:inst.mon, world:inst.world, ctx:cv.getContext('2d'), fav});
  });
}
function updateThumbs(dt){
  for(const th of thumbs){
    const m=th.mon;
    m.state='idle'; m.timer=Math.max(m.timer,2);
    m.idleKey=th.sp.idle[Math.floor(studioT/3)%th.sp.idle.length];
    m.sleep=0;
    th.inst.update(dt);
    th.world.events.length=0;
    m.x=48; m.y=66; m.dir=1; m.look=0;
    const c=th.ctx;
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,96,80);
    c.strokeStyle='rgba(205,214,238,.25)'; c.lineWidth=1;
    c.beginPath(); c.moveTo(4,66.5); c.lineTo(92,66.5); c.stroke();
    th.inst.draw(c);
    th.fav.textContent=favs.has(th.sp.id)?'★':'';
  }
}

/* ------------------------------------------------ Bühne zeichnen */
const stage=$('stage'), sctx=stage.getContext('2d');
function drawBackground(){
  const w=stage.width, h=stage.height, kind=$('bgSel').value;
  if(kind==='checker'){
    sctx.fillStyle='#101736'; sctx.fillRect(0,0,w,h);
    sctx.fillStyle='#141c42';
    const s=24;
    for(let y=0;y<h;y+=s) for(let x=0;x<w;x+=s) if(((x+y)/s)%2===0) sctx.fillRect(x,y,s,s);
  } else if(kind==='hell'){
    const g=sctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#7fb6d9'); g.addColorStop(1,'#cfe6f2');
    sctx.fillStyle=g; sctx.fillRect(0,0,w,h);
  } else if(kind==='nacht'){
    const g=sctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#141b33'); g.addColorStop(1,'#2a3350');
    sctx.fillStyle=g; sctx.fillRect(0,0,w,h);
    sctx.fillStyle='#eef2ff';
    for(let i=0;i<50;i++){ const x=(i*173)%w, y=(i*97)%Math.floor(h*0.6); sctx.fillRect(x,y,2,2); }
  } else if(kind==='wohn'){
    sctx.fillStyle='#4a8a9a'; sctx.fillRect(0,0,w,h);
    sctx.fillStyle='#8a6d4a'; sctx.fillRect(0,h*0.72,w,h*0.28);
    sctx.fillStyle='#2a3350'; sctx.fillRect(w*0.36,h*0.2,90,64);
    sctx.strokeStyle='#dfe6f5'; sctx.lineWidth=3; sctx.strokeRect(w*0.36,h*0.2,90,64);
  } else if(kind==='aqua'){
    const g=sctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#5a9ec9'); g.addColorStop(1,'#2a5f8a');
    sctx.fillStyle=g; sctx.fillRect(0,0,w,h);
    sctx.strokeStyle='rgba(230,245,250,.55)'; sctx.lineWidth=1.4;
    for(let i=0;i<14;i++){
      const x=(i*89+studioT*8)%w, y=h-((i*61+studioT*22)%h);
      sctx.beginPath(); sctx.arc(x,y,3+(i%3),0,Math.PI*2); sctx.stroke();
    }
  }
}
function drawStage(){
  const w=stage.width, h=stage.height, m=P.mon;
  drawBackground();
  /* Welt-Transform: Anker (CX,BASE) -> Bildschirm (w/2, h*0.70), gezoomt */
  sctx.save();
  sctx.translate(w/2, h*0.70);
  sctx.scale(zoom, zoom);
  sctx.translate(-CX, -BASE);
  const x0=CX-(w/2)/zoom-30, x1=CX+(w/2)/zoom+30, y0=BASE-(h*0.70)/zoom-30, y1=BASE+(h*0.30)/zoom+30;
  if($('optGrid').checked){
    sctx.strokeStyle='rgba(205,214,238,.16)'; sctx.lineWidth=1/zoom;
    sctx.beginPath();
    for(let gx=Math.floor(x0/20)*20; gx<=x1; gx+=20){ sctx.moveTo(gx,y0); sctx.lineTo(gx,y1); }
    for(let gy=Math.floor(y0/20)*20; gy<=y1; gy+=20){ sctx.moveTo(x0,gy); sctx.lineTo(x1,gy); }
    sctx.stroke();
  }
  if($('optGround').checked){
    sctx.strokeStyle='rgba(246,211,76,.65)'; sctx.lineWidth=1.4/zoom;
    sctx.beginPath(); sctx.moveTo(x0,BASE); sctx.lineTo(x1,BASE); sctx.stroke();
    sctx.fillStyle='rgba(246,211,76,.5)';
    for(let gx=Math.floor(x0/10)*10; gx<=x1; gx+=10) sctx.fillRect(gx, BASE, 1/zoom, 4/zoom);
  }
  P.inst.draw(sctx);
  if($('optBox').checked && m){
    sctx.strokeStyle='#e2574c'; sctx.lineWidth=1.4/zoom;
    sctx.strokeRect(m.x-m.h*0.6, m.y-m.h-6, m.h*1.2, m.h+10);
  }
  if($('optAnchor').checked && m){
    sctx.strokeStyle='#7fb6d9'; sctx.lineWidth=1.4/zoom;
    const r=6/zoom;
    sctx.beginPath();
    sctx.moveTo(m.x-r,m.y); sctx.lineTo(m.x+r,m.y);
    sctx.moveTo(m.x,m.y-r); sctx.lineTo(m.x,m.y+r);
    sctx.stroke();
  }
  sctx.restore();
  /* Maßstabs-Hinweis */
  sctx.fillStyle='rgba(232,236,247,.75)';
  sctx.font='600 12px sans-serif'; sctx.textAlign='left'; sctx.textBaseline='top';
  sctx.fillText('Zoom '+zoom+'× · Originalhöhe '+SPECIES[selIdx].h+' px → '+(SPECIES[selIdx].h*zoom)+' px', 10, 8);
}

/* ------------------------------------------------ Inspektor */
let inspCount=0;
function updateInspector(){
  if(++inspCount%5) return;
  const m=P.mon; if(!m) return;
  $('iState').textContent=SPECIES[selIdx].maler?'Zeichnung':m.state;
  $('iIdle').textContent=m.idleKey||'–';
  $('iAct').textContent=m.actKind||'–';
  $('iActT').textContent=m.state==='act' ? m.actT.toFixed(2)+' / '+m.actDur.toFixed(2)+' s' : '–';
  $('iSleep').textContent=m.sleep.toFixed(2);
  $('iBlink').textContent=m.blink.toFixed(2);
  $('iBob').textContent=m.bob.toFixed(2);
  $('iDir').textContent=m.dir<0?'links (-1)':'rechts (+1)';
  $('iLook').textContent=m.look.toFixed(2);
  $('iPos').textContent=Math.round(m.x)+', '+Math.round(m.y)+' · Etage '+m.floor;
  $('iEmote').textContent=m.emote||'–';
  $('iFps').textContent=Math.round(fps);
  const bar=$('actBar');
  if(mode==='ability' && m.state==='act' && m.actDur>0) bar.style.width=Math.min(100, m.actT/m.actDur*100)+'%';
  else if(mode==='ability') bar.style.width='0%';
  else bar.style.width='0%';
}

/* ------------------------------------------------ Hausansicht */
/* Das Studio kennt das Haus nicht. Die umgebende Seite gibt sich über den Rahmennamen
   „luni-haus“ zu erkennen; dann meldet der Knopf den Wunsch dorthin. Als Einzeldatei gibt es
   kein Haus, dann bleibt der Knopf verborgen. */
const HAT_HAUS = window.parent!==window && window.name==='luni-haus';
function goToHouse(){ window.parent.postMessage({type:'luni:ansicht', ansicht:'haus'}, '*'); }

/* ------------------------------------------------ Deko-Katalog */
/* Die 24 Weihnachtsdeko-Stücke aus src/game/deko.ts, gerendert mit dem Original-Zeichencode.
   Jedes Stück wird einmalig beim Öffnen in 4-facher Größe auf seine Karte gezeichnet
   (Ausschnitt = Hüllrechteck aus DEKO_STUECKE, fester Zeitpunkt). */
const DEKO = window.Deko;
const DEKO_MASSSTAB = 4, DEKO_ZEIT = 1.2;
let dekoAufgebaut=false;
function buildDekoKatalog(){
  if(dekoAufgebaut) return; dekoAufgebaut=true;
  const grid=$('dekoGrid');
  DEKO.DEKO_STUECKE.forEach(st=>{
    const karte=document.createElement('div'); karte.className='dekoCard';
    const kopf=document.createElement('span'); kopf.className='cardHead';
    kopf.textContent=st.tuer+' · '+st.name;
    const cv=document.createElement('canvas');
    cv.width=Math.max(1,Math.round(st.box.w*DEKO_MASSSTAB));
    cv.height=Math.max(1,Math.round(st.box.h*DEKO_MASSSTAB));
    cv.className='dekoThumb';
    const fuss=document.createElement('span'); fuss.className='cardFoot';
    fuss.textContent='Türchen '+st.tuer+' · '+st.ort;
    karte.appendChild(kopf); karte.appendChild(cv); karte.appendChild(fuss);
    grid.appendChild(karte);
    const c=cv.getContext('2d');
    c.save(); c.scale(DEKO_MASSSTAB,DEKO_MASSSTAB); c.translate(-st.box.x,-st.box.y);
    DEKO.drawDekoStueck(c, st.tuer, DEKO_ZEIT); c.restore();
  });
}
function toggleDeko(){
  const sec=$('dekoSec'), offen=sec.hidden;
  if(offen) buildDekoKatalog();
  sec.hidden=!offen;
  $('dekoBtn').textContent=offen?'🎄 Katalog schließen':'🎄 Deko-Katalog';
}

/* ------------------------------------------------ Haupt-Loop */
let last=performance.now();
function frame(now){
  let dt=Math.min(0.05,(now-last)/1000); last=now;
  if(dt>0) fps=fps*0.95+(1/Math.max(dt,0.0001))*0.05;
  let simDt=0;
  if(playing) simDt=dt*speedF;
  if(stepOnce){ simDt=(1/60)*speedF; stepOnce=false; }
  if(simDt>0 && P){
    studioT+=simDt;
    enforce(simDt);
    P.inst.update(simDt);
    P.world.events.length=0;
    pinAndOrient();
    updateThumbs(simDt);
  }
  if(P) drawStage();
  updateInspector();
  requestAnimationFrame(frame);
}

/* ------------------------------------------------ Verdrahtung */
function setZoom(z){
  zoom=Math.max(0.5, Math.min(14, z));
  $('zoom').value=zoom;
  $('zoomVal').textContent=zoom+'×';
}
$('zoom').addEventListener('input', e=>setZoom(parseFloat(e.target.value)));
document.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>setZoom(parseFloat(b.dataset.zoom))));
stage.addEventListener('wheel', e=>{ e.preventDefault(); setZoom(zoom*(e.deltaY<0?1.15:0.87)); }, {passive:false});
$('playBtn').addEventListener('click', ()=>{ playing=!playing; $('playBtn').textContent=playing?'⏸ Pause':'▶ Abspielen'; });
$('stepBtn').addEventListener('click', ()=>{ stepOnce=true; });
$('restartBtn').addEventListener('click', ()=>{
  if(!P) return;
  P.mon.idleT=0; P.mon.t=0; actWait=0;
  if(mode==='ability') startAbility();
  note('Animation neu gestartet.');
});
$('respawnBtn').addEventListener('click', ()=>{ select(selIdx,false); note(SPECIES[selIdx].name+' neu gespawnt.'); });
$('speedSel').addEventListener('change', e=>{ speedF=parseFloat(e.target.value); });
$('dirL').addEventListener('click', ()=>{ dirVal=-1; });
$('dirR').addEventListener('click', ()=>{ dirVal=1; });
$('blinkBtn').addEventListener('click', ()=>{ if(P) P.mon.blink=1; });
$('emoteHeart').addEventListener('click', ()=>{ if(P){ P.mon.emote='heart'; P.mon.emoteT=1.4; } });
$('emoteNote').addEventListener('click', ()=>{ if(P){ P.mon.emote='note'; P.mon.emoteT=1.4; } });
$('emoteZzz').addEventListener('click', ()=>{ if(P){ P.mon.emote='zzz'; P.mon.emoteT=1.4; } });
$('prevBtn').addEventListener('click', ()=>select((selIdx+N-1)%N,true));
$('nextBtn').addEventListener('click', ()=>select((selIdx+1)%N,true));
$('randomBtn').addEventListener('click', ()=>select(Math.floor(Math.random()*N),true));
$('favBtn').addEventListener('click', ()=>{
  const id=SPECIES[selIdx].id;
  if(favs.has(id)) favs.delete(id); else favs.add(id);
  $('favBtn').textContent=favs.has(id)?'★ Favorit':'☆ Favorit';
  document.querySelectorAll('.card')[selIdx].querySelector('.cardFav').textContent=favs.has(id)?'★':'';
});
$('numForm').addEventListener('submit', e=>{
  e.preventDefault();
  const v=parseInt($('numInput').value,10);
  if(v>=1&&v<=N){ select(v-1,true); $('numInput').value=''; }
});
$('snapBtn').addEventListener('click', ()=>{
  const name='luni-'+SPECIES[selIdx].id+'-'+zoom+'x.png';
  triggerDownload(stage.toDataURL('image/png'), name);
  note('PNG gespeichert: '+name);
});
$('jsonBtn').addEventListener('click', ()=>copyText(JSON.stringify(SPECIES[selIdx],null,2), 'Spezies-JSON'));
$('addSelBtn').addEventListener('click', addCurrentToSelection);
$('selAllBtn').addEventListener('click', ()=>{ selectedIds=SPECIES.map(sp=>sp.id); saveSelection(); renderSelection(); note('Alle '+N+' Mons in die Auswahl übernommen.'); });
$('selClearBtn').addEventListener('click', ()=>{ selectedIds=[]; saveSelection(); renderSelection(); note('Auswahl geleert.'); });
$('zipBtn').addEventListener('click', downloadSelectionZip);
$('studioZipBtn').addEventListener('click', downloadStudioZip);
$('houseBtn').hidden=!HAT_HAUS;
$('houseBtn').addEventListener('click', goToHouse);
$('dekoBtn').addEventListener('click', toggleDeko);

/* Nummern-Tasten 1..N + Pfeile + Zoom */
let numBuf='', numTimer=null;
window.addEventListener('keydown', e=>{
  const tag=(e.target&&e.target.tagName)||'';
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
  if(/^[0-9]$/.test(e.key)){
    numBuf+=e.key;
    $('numEcho').textContent='Nr. '+numBuf+'_';
    clearTimeout(numTimer);
    const commit=()=>{ const v=parseInt(numBuf,10); numBuf=''; $('numEcho').textContent='Nr. –'; if(v>=1&&v<=N) select(v-1,true); };
    if(numBuf.length>=2) commit();
    else if(parseInt(numBuf,10)*10>N) commit();         // mit dieser ersten Ziffer gibt es keine zweistellige Nr.
    else numTimer=setTimeout(commit, 750);              // sonst auf die 2. Ziffer warten
  }
  else if(e.key==='ArrowRight'){ select((selIdx+1)%N,true); e.preventDefault(); }
  else if(e.key==='ArrowLeft'){ select((selIdx+N-1)%N,true); e.preventDefault(); }
  else if(e.key==='+'||e.key==='='){ setZoom(zoom*1.25); }
  else if(e.key==='-'){ setZoom(zoom*0.8); }
  else if(e.key===' ' && tag!=='BUTTON'){ playing=!playing; $('playBtn').textContent=playing?'⏸ Pause':'▶ Abspielen'; e.preventDefault(); }
});

/* ------------------------------------------------ Start */
$('versionBadge').textContent=STUDIO_VERSION;
$('studioZipBtn').textContent='⬇ Luni-Mon-Studio-Bundle v'+STUDIO_VERSION+' (ZIP)';
$('studioZipBtn').title='Aktuelles Studio + alle '+N+' Luni-Mons als ZIP herunterladen';
document.querySelectorAll('.nMons').forEach(e=>{ e.textContent=N; });
$('numInput').max=N; $('numInput').placeholder='1–'+N;
buildOverview();
select(0,false);
setZoom(4);
requestAnimationFrame(frame);
})();
