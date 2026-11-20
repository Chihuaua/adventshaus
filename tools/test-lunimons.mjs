import { createLuniMons, HOUSE, SPECIES } from '../src/game/lunimons.js';

function makeCtx(){
  const grad={addColorStop(){}};
  const t={};
  return new Proxy(t,{
    get(o,p){
      if(p==='createLinearGradient'||p==='createRadialGradient') return ()=>grad;
      if(p==='measureText') return s=>({width:String(s).length*6});
      if(p in o) return o[p];
      return (...a)=>{ for(const v of a){ if(typeof v==='number'&&!isFinite(v)) throw new Error('NaN/Inf in ctx.'+String(p)); } };
    },
    set(o,p,v){ o[p]=v; return true; }
  });
}
const ctx=makeCtx();
const world={
  house:HOUSE,
  actors:{ luni:{x:300,y:420,floor:'live',room:'wohn'}, hund:{x:250,y:420,floor:'live'}, katze:{x:600,y:520,floor:'base'} },
  lights:{attic:false,bed:false,live:true,base:false},
  flags:{plant:.2,garland:0,frost:0,tidy:0,flowers:0,cocoa:0,candle:0,tv:0,mail:0,cushion:0,aurora:0,dust:1,aquarium:false},
  night:.8, weather:'schnee', events:[],
};
const m=createLuniMons(world);
const ANZAHL=SPECIES.length;
if(!SPECIES.some(s=>s.id==='ufo')) throw new Error('ufo fehlt in SPECIES');
m.setUnlockedCount(ANZAHL);
if(m.list().length!==ANZAHL) throw new Error('spawn != '+ANZAHL);
const ids=new Set(m.list().map(x=>x.id));
if(ids.size!==ANZAHL) throw new Error('duplicate ids');

let firedKinds=new Set();
for(let i=0;i<20000;i++){
  m.update(1/60);
  if(i%20===0) m.draw(ctx);
  for(const mon of m.list()){
    if(!isFinite(mon.x)||!isFinite(mon.y)) throw new Error('NaN pos '+mon.id);
    if(mon.actKind) firedKinds.add(mon.actKind);
  }
}
console.log('ability kinds seen:', [...firedKinds].sort().join(','));
m.unlockForDate(new Date('2026-12-05T12:00:00+01:00'));
if(m.unlocked!==5) throw new Error('dec5 !=5, got '+m.unlocked);
m.unlockForDate(new Date('2026-11-19T12:00:00+01:00'));
if(m.unlocked!==0) throw new Error('nov !=0');
m.setUnlockedCount(ANZAHL);
const s=m.serialize(); const m2=createLuniMons(world); m2.deserialize(s);
if(m2.unlocked!==ANZAHL) throw new Error('deserialize');
const hit=m.hitTest(m.list()[0].x, m.list()[0].y-10);
console.log('hitTest:', hit?hit.id:'null');
console.log('OK: '+ANZAHL+' Mons, 20000 Frames, keine NaN, Unlock/Serialize korrekt.');
