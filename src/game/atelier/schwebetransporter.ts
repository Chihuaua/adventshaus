import { zeichneBriefkurier, kurierPaket } from "./briefkurier";
import { HOF, schwebeY, type Fahrzeugstand, type Hofbild } from "./kurierhof";
import { faden, form, korn, licht, maske, naht, oval, pfad, rund, type C } from "./stift";

function niet(c: C, x: number, y: number, r = .77) {
  oval(c,"#35454a",x,y+.14,r,r*.83); oval(c,"#a3a9a0",x-.1,y-.14,r*.8,r*.63);
  faden(c,"#556166",.19,x-r*.48,y+.12,[x+r*.47,y-.28]);
}

/** Die Lackabbrueche sind fest im Blech verankert und folgen der beweglichen Tuer. */
function patina(c: C, x: number, y: number, w: number, h: number, saat: number, anzahl: number) {
  for (let i=0;i<anzahl;i++) {
    const px=x+korn(saat+i)*w, py=y+korn(i+saat+61)*h, l=.47+korn(i+67)*3.8;
    form(c,i%4?"rgba(78,81,76,.36)":"rgba(159,108,71,.57)",px,py,[px+l*.61,py-.42],[px+l,py-.38],[px+l*.34,py+.32]);
    if (i%3===0) faden(c,"rgba(232,221,189,.68)",.23,px+l*.12,py+.39,[px+l*.77,py-.08]);
  }
}

function lauflicht(c: C,x: number,y: number,w: number,t: number) {
  rund(c,"#233941",x,y,w,2.46,.72);
  rund(c,licht(c,x,y,w,.1,"#709fa6","#b3eee0","#72b8bd"),x+.71,y+.48,w-1.42,.92,.37);
  for(let i=1;i<4;i++) faden(c,"#396571",.39,x+i*w/4,y+.39,[x+i*w/4,y+1.69]);
  c.save();c.globalAlpha*=.06+.025*Math.sin(t*1.76);
  rund(c,"#a6fff0",x-1.1,y-.8,w+2.2,3.94,1.7);c.restore();
}

function spule(c:C,x:number,y:number,breite:number,t:number) {
  c.save(); c.translate(x,y);
  const g=c.createLinearGradient(0,-2,0,8);g.addColorStop(0,"rgba(115,234,221,.55)");g.addColorStop(.5,"rgba(111,224,216,.18)");g.addColorStop(1,"rgba(150,229,220,0)");
  form(c,g,-breite*.38,-1,[breite*.38,-1],[breite*.56,8.5],[-breite*.57,8.5]);
  form(c,"#25373d",-breite*.47,-11.12,[-breite*.38,-14.51],[breite*.33,-14.8],[breite*.51,-10.91],[breite*.42,-1.66],[breite*.29,.4],[-breite*.36,.28],[-breite*.52,-3.84]);
  form(c,licht(c,-breite/2,-12,breite,8,"#445b61","#6d8481","#3e565d","#273f48"),-breite*.49,-10.97,
    [-breite*.37,-13.5],[breite*.29,-13.67],[breite*.47,-10.32],[breite*.42,-5.26],[-breite*.43,-4.15]);
  for(let j=0;j<7;j++) {
    const xx=-breite*.345+j*breite*.104;
    form(c,"#263e43",xx,-11.04,[xx+1.83,-11.22],[xx+.86,-6.18],[xx-1.08,-6.03]);
    faden(c,"#8d9b8b",.31,xx+1.97,-11.13,[xx+1.09,-6.33]);
  }
  const lumi=.77+Math.sin(t*2.13+x)*.08;
  c.save();c.globalAlpha*=lumi;
  faden(c,"#9dede0",1.29,-breite*.32,-2.37,[breite*.3,-2.58]);
  faden(c,"#e5ffeb",.36,-breite*.26,-2.89,[breite*.11,-3.05]);c.restore();
  faden(c,"#b38a62",.71,-breite*.45,-4.85,[-breite*.34,-3.4],[-breite*.17,-3.41]);
  niet(c,-breite*.34,-11.95,.54);niet(c,breite*.31,-11.96,.54);c.restore();
}

function posteZeichen(c:C,x:number,y:number,s:number) {
  c.save();c.translate(x,y);c.scale(s,s);
  form(c,"#e7dec2",-13,-3.9,[13,-6.1],[.22,6.13],[-3.11,.17]);
  form(c,"#b5bca8",-3.11,.17,[11.92,-5.43],[-.69,2.51]);
  faden(c,"#ece5cb",.92,-12.6,.36,[-7.38,-.21]);faden(c,"#ece5cb",.77,-11.31,2.73,[-6.66,2.37]);c.restore();
}

function schiebetuer(c:C,k:number) {
  c.save();c.translate(-HOF.schiene*k,0);
  const kontur=()=>pfad(c,71.1,-88.7,[76.25,-95.08],[131.1,-95.13],[137.24,-89.84],[136.74,-33.53],[132.86,-28.58],[71.98,-29.24],[70.14,-34.86],[71.1,-88.7]);
  kontur();c.fillStyle=licht(c,71,-94,64,59,"#b5b4a3","#d5ceae","#b6b59e","#879893");c.fill();
  maske(c,()=>{
    form(c,"#648581",65,-73.3,[145,-78.41],[146,-58.46],[65,-53.48]);
    form(c,"#dc9b55",65,-55.8,[142,-61.27],[141,-57.13],[65,-51.97]);
    form(c,"#3f6264",67,-43.13,[143,-47.16],[144,-24],[67,-24]);
    posteZeichen(c,99.4,-64.96,.78);
    // Verwitterte, ausgesparte Wagennummer im Emaillefeld.
    faden(c,"#ebe2c5",1.35,116.01,-73.14,[112.62,-72.95],[111.91,-66.65],[115.44,-66.91],[116.01,-73.14]);
    faden(c,"#ebe2c5",1.32,118.44,-73.32,[122.37,-73.64],[118.53,-67.31]);
    patina(c,71,-94,67,65,130,50);
    faden(c,"rgba(110,105,79,.4)",.51,72.93,-83.51,[80.66,-82.06],[85.04,-82.77]);
    faden(c,"rgba(243,234,198,.8)",.35,73.57,-82.94,[80.72,-81.68],[84.61,-82.4]);
    for(let i=0;i<7;i++) faden(c,"rgba(98,97,76,.26)",.53,77.41+i*8.12,-92.07,[77.38+i*8.12,-88.32+korn(i)*2.6]);
    for(let i=0;i<4;i++) faden(c,"#8a9f99",.58,78.61,-38.8+i*1.85,[109.17,-40.48+i*1.85]);
  });
  kontur();c.strokeStyle="#435957";c.lineWidth=1.29;c.lineJoin="round";c.stroke();
  faden(c,"#eee4bd",.74,73.66,-88.94,[77.48,-93.18],[130.51,-93.45]);
  rund(c,"#56645d",74.38,-90.29,31.44,3.42,.79);rund(c,"#727e71",76.5,-89.58,26.36,1.28,.38);
  rund(c,"#334647",HOF.griff-4.92,HOF.griffY-2.86,9.84,5.72,1.22);
  rund(c,"#abaf98",HOF.griff-3.73,HOF.griffY-.94,7.46,1.95,.78);
  faden(c,"#e5d6ad",.37,HOF.griff-3.1,HOF.griffY-.6,[HOF.griff+2.9,HOF.griffY-.6]);
  for(const [x,y] of [[75.3,-85.1],[131.52,-89.43],[75.93,-33.46],[132.21,-33.35]]) niet(c,x,y,.67);
  faden(c,"#c2b7a0",.71,72.67,-31.69,[132.36,-31.11]);c.restore();
}

function kabine(c:C,o:Fahrzeugstand) {
  const loch=()=>pfad(c,144.12,-92.61,[149.9,-99.22],[168.62,-98.9],[198.66,-58.21],[199.1,-26.44],[144.73,-26.59],[144.12,-92.61]);
  loch();c.fillStyle="#1e343d";c.fill();
  maske(c,()=>{
    form(c,"#839a99",151,-91.79,[167.1,-92.81],[189.22,-62.26],[153.53,-63.62]);
    form(c,"#3a5058",144,-32.5,[201,-31.77],[201,-24],[144,-24]);
    form(c,"#53626a",149.85,-64.49,[152.83,-66.53],[157.73,-63.88],[160.94,-43.43],[173.6,-43.23],[175.87,-38.65],[151.88,-38.33]);
    naht(c,[152.52,-62.95],[156.64,-44.59],"#ab9a82",1.53,.29);
    form(c,"#2b444e",178,-57.41,[198.18,-61.21],[201,-52.68],[179.64,-51.76]);
    if(o.fahrer) {c.save();c.translate(HOF.kabine,-12.8);c.scale(1.1,1.1);zeichneBriefkurier(c,{ansicht:"rechts",zeit:o.zeit,pose:"ruhe"},{sitz:1,ohneSchatten:true,griff:[11.9,-43.8]});c.restore();}
    faden(c,"#586b70",1.45,183.33,-43.41,[181.05,-58.23]);
    faden(c,"#23363f",2.39,177.64,-55.22,[183.25,-60.87]);
    for(let j=0;j<5;j++) faden(c,j<3?"#9bddca":"#6ba2ac",.53,186.49+j*1.76,-57.2,[187.02+j*1.76,-58.47]);
    faden(c,"#b3a68d",.63,147.33,-28.52,[196.65,-28.44]);
  });
  loch();c.lineWidth=1.61;c.strokeStyle="#2b444c";c.stroke();
  const k=o.fahrertuer, a=k*1.36;
  // Scharnier vorn: Das ferne Tuerende schwenkt in die Tiefe, die Angel bleibt ortsfest.
  c.save();c.translate(198.75,-28.7);c.transform(Math.cos(a),-.235*Math.sin(a),0,1,0,0);c.translate(-198.75,28.7);
  const fenster=(neu=true)=>{if(neu)c.beginPath();c.moveTo(149.18,-89.55);c.lineTo(153.09,-94.47);c.lineTo(166.35,-94.41);
    c.lineTo(191.94,-59.74);c.lineTo(149.17,-61.61);c.closePath();};
  const karosse=licht(c,145,-93,59,58,k>.6?"#83968f":"#b5b7a1","#b5baa4","#73918a","#546f6f");
  pfad(c,144.81,-93.02,[149.47,-98.15],[168.06,-97.92],[197.91,-57.96],[198.16,-26.79],[145,-27.13]);c.closePath();
  fenster(false);c.fillStyle=karosse;c.fill("evenodd");
  // Das Glas dreht sich mit der Tuer, der Fahrer bleibt bis zum Ausstieg im unbewegten Sitz.
  fenster();c.fillStyle=licht(c,151,-93,38,40,"rgba(179,211,204,.31)","rgba(93,144,152,.20)","rgba(42,87,102,.41)");c.fill();
  fenster();c.save();c.clip();form(c,"rgba(229,245,225,.18)",145,-61.9,[169.63,-100],[177.8,-96.39],[153.85,-60.09]);c.restore();
  fenster();c.lineWidth=1.82;c.strokeStyle="#314c54";c.stroke();
  form(c,"#527879",145.67,-58.81,[194.82,-56.34],[195.61,-42.83],[145.78,-44.86]);
  form(c,"#cf9354",146,-44.12,[195.91,-42.09],[195.98,-39.46],[145.99,-41.62]);
  faden(c,"#c8c2a4",.65,147.68,-58.9,[190.29,-57.02]);
  rund(c,"#334d53",148.49,-55.46,9.4,2.65,.98);rund(c,"#bdbea5",149.11,-55.12,7.64,1.11,.46);
  form(c,"#436267",146.53,-36.3,[194.19,-33.84],[197.43,-28.57],[146.12,-29.14]);
  faden(c,"#aeb49e",.59,148.85,-31.93,[192.16,-30.35]);patina(c,148.5,-41.25,43,10,77,14);
  // Die Delle unter dem Griff hat eine schmale helle Unterkante.
  faden(c,"#536c66",.63,168.73,-41.74,[174.69,-44.54,182.83,-43.06]);
  faden(c,"#c3b698",.51,169.68,-41.14,[176.62,-43.36,182.19,-42.66]);
  c.restore();
  if(k>.01) {
    const xx=198.75-53.9*Math.cos(a), yy=-27.13+12.66*Math.sin(a);
    faden(c,"#4c6060",1.13,xx,yy,[xx-.18,yy-64.53]);
    form(c,"#a5906f",146,-25.11,[174.27,-25.23],[175.88,-25.23+k*5.81],[145.11,-25.11+k*5.81]);
    for(let j=0;j<6;j++) faden(c,"#6b6e62",.5,148.4+j*4,-24.81,[147.88+j*4,-24.81+k*4.8]);
  }
}

function laderaum(c:C,paket:boolean) {
  form(c,"#283d46",72,-92.39,[138.6,-92.6],[138.42,-28.65],[71.95,-28.87]);
  form(c,licht(c,72,-88,62,43,"#526965","#64827b","#364d52"),75.51,-88.64,[133.21,-88.86],[132.65,-41.28],[76.18,-41.17]);
  for(let j=0;j<8;j++) {const x=78.61+j*7.23;faden(c,"#344f51",.96,x,-86.1,[x-.08,-43.03]);faden(c,"#7f9690",.39,x+.93,-85.83,[x+.67,-44.13]);}
  form(c,"#8b8d7e",76.18,-41.17,[132.65,-41.28],[138.42,-29.64],[72.04,-29.71]);
  for(let j=0;j<8;j++) faden(c,"#69766e",.71,77.23+j*7.64,-40.03,[73.69+j*8.94,-30.55]);
  rund(c,"#b4a183",77.32,-89.28,53.5,2.75,.73);rund(c,"#f6dca0",78.75,-88.95,49.83,1.36,.41);
  faden(c,"#95856f",1.15,129.42,-87.3,[130.95,-72.69],[126.33,-67.9],[127.04,-47.65]);
  for(const y of [-80.55,-62.84,-52.64]) rund(c,"#40555c",126.12,y,4.6,1.77,.61);
  if(paket) {c.save();c.translate(HOF.ladegut,HOF.ladegutY);c.scale(HOF.kurierMass/HOF.mass,HOF.kurierMass/HOF.mass);kurierPaket(c,[0,0]);c.restore();}
  faden(c,"#b9ae92",1.32,72.73,-29.77,[137.67,-29.68]);
}

/** Gemeinsame Fahrzeugzeichnung fuer die echte Zustellung und die vergroesserte Studioprobe. */
export function zeichneSchwebetransporter(c:C,x:number,boden:number,o:Fahrzeugstand) {
  c.save();c.translate(x,boden);c.scale(HOF.mass,HOF.mass);c.lineJoin="round";c.lineCap="round";
  c.save();c.translate(110,.34);c.scale(1,.075);const sh=c.createRadialGradient(0,0,9,0,0,112);sh.addColorStop(0,"rgba(31,44,51,.27)");sh.addColorStop(.64,"rgba(48,59,62,.17)");sh.addColorStop(1,"rgba(60,74,77,0)");oval(c,sh,0,0,112,112);c.restore();
  c.translate(0,schwebeY(o.zeit));
  spule(c,37,-9.15,43.5,o.zeit);spule(c,175.6,-9.39,48.7,o.zeit+.61);
  form(c,"#35484e",-1.2,-78.81,[6.12,-96.16],[15.2,-100.93],[21.49,-39.41],[13.07,-24.47],[1.1,-29.15]);
  form(c,licht(c,7,-99,185,75,"#afb3a2","#d7ccad","#b2b5a0","#82938b"),4.19,-93.53,[12.24,-101.98],[142.31,-103.13],
    [153.11,-104.18],[169.07,-101.28],[207.59,-56.91],[220.37,-50.28],[224.5,-40.34],[221.35,-25.04],[211.6,-18.48],
    [28.95,-17.78],[7.83,-22.69],[3.63,-34.42],[4.19,-93.53]);
  // Leicht versetzte Dachhaut, Ersatzteil und nachtraeglich verlegte Leitung.
  form(c,"#ccd0b5",4.43,-94.24,[14.23,-105.92],[145.38,-107.45],[169.07,-101.28],[142.31,-101.05],[12.72,-99.38]);
  faden(c,"#f0dfbd",1.24,12.86,-100.36,[141.14,-101.92]);
  form(c,"#4e6b6b",6.23,-90.23,[68.21,-92.85],[69.04,-31.4],[11.39,-29.87],[5.06,-36.43]);
  form(c,"#72958b",10.26,-86.31,[62.45,-88.17],[63.03,-48.66],[10.93,-45.51]);
  form(c,"#c79055",7.19,-53.97,[65.9,-57.92],[66.07,-53.1],[7.54,-49.24]);
  form(c,"#35555a",7.47,-45.64,[66.17,-49.18],[66.52,-30.84],[14.29,-29.39],[7.49,-35.37]);
  // Das Ersatzblech am Heck hat einen anderen Lackton und eine genietete Reparaturlasche.
  form(c,"#aaa58f",12.93,-86.37,[47.57,-88.1],[49.45,-75.31],[13.1,-72.95]);
  for(let i=0;i<7;i++) {const xx=16.41+i*4.2;faden(c,"#4c6362",1.53,xx,-82.38,[xx+2.41,-78.32]);faden(c,"#e1d2ad",.46,xx+.85,-82.73,[xx+3.31,-78.71]);}
  form(c,"#7f8c80",17.81,-64.18,[31.13,-66.21],[37.1,-59.83],[22.56,-57.14]);
  for(const [xx,yy] of [[19.4,-63.66],[30.89,-64.64],[34.68,-60.21],[23.02,-58.68]]) niet(c,xx,yy,.72);
  faden(c,"#404d49",.52,13.83,-65.89,[18.47,-63.66]);faden(c,"#d0c5a2",.43,34.63,-59.15,[39.42,-57.04],[44.24,-58.01]);
  // Zurrleisten und abgewetzte Kanten statt wahllos verteiltem Rost.
  for(let j=0;j<3;j++) {
    const xx=13.77+j*17.37; rund(c,"#2d454b",xx,-40.91,12.78,4.19,.91);
    faden(c,"#afafa0",.76,xx+1.26,-38.12,[xx+11.36,-38.48]);
  }
  patina(c,9.5,-75.9,55.9,41.12,49,48);
  for(let i=0;i<5;i++) {const xx=8.71+i*13.03;niet(c,xx,-91.21,.75);
    form(c,"rgba(144,92,56,.27)",xx-.5,-89.85,[xx+1.42,-90.35],[xx+.33,-84.1+korn(i)*2.91]);}
  for(const [xx,yy] of [[14,-100.3],[59,-101.1],[112,-101.7]]) {
    form(c,"#52666a",xx,yy,[xx+1.4,yy-3.8],[xx+10,yy-3.8],[xx+10.82,yy]);
    faden(c,"#b6b49f",.6,xx+1.63,yy-3.57,[xx+9.84,yy-3.57]);
  }
  form(c,licht(c,31,-113,64,12,"#8e9990","#526d6d","#425a60"),28.5,-107.2,[33.91,-115.56],[76.32,-115.56],[84.67,-109.72],[84.23,-104.46],[29,-104.03]);
  form(c,"#aab4a6",33.91,-115.56,[38.63,-118.73],[73.68,-118.77],[76.32,-115.56]);
  rund(c,"#354d53",44.95,-112.85,19.27,5.56,.98);
  for(let i=0;i<7;i++) {
    faden(c,"#9e8872",.94,46.61+i*2.44,-111.98,[47.48+i*2.44,-108.16]);
    faden(c,"#c3ae8b",.34,46.41+i*2.44,-111.82,[46.91+i*2.44,-109.3]);
  }
  for(const xx of [39.67,67.24]) {faden(c,"#645849",2.05,xx,-104.41,[xx+.47,-114.74]);niet(c,xx+.15,-107.36,.73);}
  faden(c,"#b4afa0",1.39,16.18,-106.25,[105.72,-107.42],[114.72,-110.51],[134.82,-110.63]);
  faden(c,"#374e53",1.2,95.17,-105.63,[92.02,-110.23],[85.39,-110.11],[81.29,-107.45]);
  faden(c,"#6c6357",1.16,88.23,-107.97,[100.75,-115.9,124.44,-114.72],[130.44,-110.2]);
  for(const xx of [102.24,113.9,123.4]) {faden(c,"#435c61",1.05,xx,-115.03,[xx+.85,-112.61]);}
  laderaum(c,o.paketImWagen);
  faden(c,"#3d5055",3.38,11.54,-96.23,[137.96,-97.91]);faden(c,"#abb19c",.81,12.07,-96.81,[137.61,-98.42]);
  schiebetuer(c,o.schiebe);
  form(c,"#809797",139.61,-101.96,[150.7,-103.31],[149.55,-97.41],[141.58,-88.61],[141.43,-28.66],[137.79,-28.53],[138.11,-92.74]);
  kabine(c,o);
  // Flache Bugkante mit durchgehender Lichtsignatur und einem ausgebesserten Stossfaenger.
  form(c,"#537780",169.73,-99.01,[178.59,-94.89],[208.11,-57.25],[199.47,-58.1]);
  form(c,licht(c,174,-94,31,38,"#c8d7bd","#829f9f","#476a77"),172.43,-96.83,[176.27,-94.83],[204.2,-59.7],[200.78,-60.64]);
  form(c,"#91a59a",200.04,-56.83,[209.94,-55.03],[220.77,-48.36],[222.57,-43.38],[201.22,-45.06]);
  form(c,"#3b535c",201.15,-43.89,[223.15,-42.7],[220.37,-26.08],[211.79,-21.09],[199.53,-25.53]);
  lauflicht(c,201.44,-46.91,19.73,o.zeit);
  for(let i=0;i<4;i++) faden(c,"#82938d",.81,203.07,-39.83+i*2.58,[218.98-i*.41,-39.03+i*2.37]);
  form(c,"#35484e",2.13,-28.65,[17.95,-27.86],[24.6,-24.05],[139.4,-24.24],[142.46,-26.01],[193.93,-25.24],[200.75,-21.24],[221.03,-23.57],[217.61,-16.87],[197.88,-15.53],[191.99,-18.13],[23.58,-17.92],[4.61,-21.03]);
  faden(c,"#8f9a8c",.68,5.25,-23.37,[19.55,-22.74],[24.38,-20.23],[133.58,-20.27]);
  form(c,"#9c8060",193.12,-23.61,[199.87,-19.47],[212.2,-20.67],[209.64,-16.68],[197.96,-16.45],[191.36,-18.76]);
  patina(c,193.65,-21.85,16,3.11,328,13);
  for(let j=0;j<4;j++) faden(c,"#d7ba7c",1.25,6.83+j*2.78,-27.05,[8.65+j*2.78,-24.76]);
  for(const xx of [24.68,42.02,115.38,132.91,181.81]) niet(c,xx,-21.91,.66);
  faden(c,"#243c44",1.86,55.91,-18.56,[58.83,-14.43,63.64,-14.91],[105.93,-15.58],[110.02,-18.61]);
  faden(c,"#a08568",.66,56.64,-18.6,[60.22,-15.08,63.66,-15.44],[105.55,-16.08],[109.35,-18.61]);
  for(const xx of [66.52,84.89,100.81]) rund(c,"#51686b",xx,-18.4,2.65,4.48,.57);
  rund(c,"#603e3b",3.46,-63.14,3.88,14.56,.82);rund(c,"#d98767",4.07,-61.83,1.29,8.93,.41);
  faden(c,"#4b6265",1.3,190.95,-69.23,[196.54,-69.74],[198.79,-74.32]);rund(c,"#416169",196.76,-78.14,5.31,7.26,1.27);
  faden(c,"#aabdb0",.48,197.59,-77.31,[201.09,-77.69]);
  if(o.festlich) {
    faden(c,"#34534b",.61,12,-100.8,[55,-96.9,106,-102.41],[128,-101.7,141,-103.03]);
    for(let i=0;i<13;i++) oval(c,["#e3ab72","#df9c92","#b8d4a3"][i%3],14+i*10.3,-101.1+Math.sin(i/12*Math.PI)*1.51,1.01,.78);
  }
  c.restore();
}

export function zeichneHofbild(c:C,x:number,boden:number,b:Hofbild) {
  zeichneSchwebetransporter(c,x,boden,b.wagen);
  if(!b.bote) return;
  const f=b.bote;c.save();c.translate(x+f.x,boden+f.y);c.scale(f.skala,f.skala);
  zeichneBriefkurier(c,{ansicht:f.ansicht,pose:f.geht?"gang":"ruhe",zeit:b.wagen.zeit},
    {sitz:f.sitz,paket:f.paket,griff:f.griff,ohneSchatten:f.sitz>.02});c.restore();
}