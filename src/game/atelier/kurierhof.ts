import { misch, sanft, type Ansicht, type Punkt } from "./stift";

/** Alle Tueren, Griffe, Paketmitte und Trittstufen teilen dieselbe Fahrzeug-Zeichnung. */
export const HOF = {
  mass: .58, laenge: 224, kabine: 169, ausstieg: 178, griff: 126, schiene: 58, griffY: -57,
  ladegut: 105, ladegutY: -44, griffAbstand: 10.2, kurierMass: .76, boden: 4.6,
  ausstiegSek: 3.35, schiebeSek: 1.8,
} as const;
export const schwebeY = (zeit: number) => -.91 + Math.sin(zeit * 1.47) * .72 + Math.sin(zeit * 2.37 + .3) * .13;
export function frachtGriff(schiebe: number, zeit: number): Punkt {
  return [(HOF.griff - HOF.schiene * schiebe) * HOF.mass, (HOF.griffY + schwebeY(zeit)) * HOF.mass];
}
export interface Botenstand { x: number; y: number; skala: number; sitz: number; ansicht: Ansicht; geht: boolean; paket: boolean; griff?: Punkt }
export interface Fahrzeugstand { zeit: number; fahrertuer: number; schiebe: number; paketImWagen: boolean; fahrer: boolean; festlich?: boolean }
export interface Hofbild { wagen: Fahrzeugstand; bote: Botenstand | null }
export type Werkprobe = "schweben" | "kabine" | "laderaum" | "tour";

/** Der Fahrer ist entweder im Sitz oder draussen. Kein zweites Bild hinter dem Kabinenfenster. */
export function fahrerWechsel(anteil: number, zeit: number) {
  const k = Math.min(1,Math.max(0,anteil));
  const tuer = sanft(k / .25) * (1 - sanft((k - .77) / .23));
  const schritt = sanft((k - .27) / .48), fahrer = k <= .27;
  const sitzY = (-12.8 + schwebeY(zeit))*HOF.mass;
  const bote: Botenstand | null = fahrer ? null : {
    x: misch(HOF.kabine,HOF.ausstieg,schritt)*HOF.mass, y: misch(sitzY,HOF.boden,schritt)-Math.sin(Math.PI*schritt)*1.11,
    skala: misch(HOF.mass*1.1,HOF.kurierMass,schritt), sitz:1-schritt, ansicht:schritt<.45?"rechts":"vorn", geht:false, paket:false,
  };
  return { tuer, fahrer, bote };
}
export function schieber(anteil: number, schliessen = false) {
  const k = sanft((anteil - .15) / .76); return schliessen ? 1 - k : k;
}
export function frachtHalten(zeit: number, schiebe: number): Botenstand {
  const griff = frachtGriff(schiebe,zeit);
  return { x:griff[0]+HOF.griffAbstand, y:HOF.boden, skala:HOF.kurierMass, sitz:0, ansicht:"links", geht:schiebe>.001&&schiebe<.999, paket:false,
    griff:[-HOF.griffAbstand/HOF.kurierMass,(griff[1]-HOF.boden)/HOF.kurierMass] };
}
export const PROBE_DAUER = 14.8;
export function hofprobe(zeit: number, modus: Werkprobe): Hofbild {
  const t = Math.max(0,zeit), p = modus==="tour" ? Math.min(t,PROBE_DAUER) : modus==="schweben" ? 0 : modus==="kabine" ? Math.min(t,3.36)+.8 : 6.7+Math.min(t,3.15);
  const wagen: Fahrzeugstand = {zeit:t, fahrertuer:0, schiebe:0,paketImWagen:true,fahrer:true};
  if(modus==="schweben") return {wagen:{...wagen,fahrer:false},bote:{x:145,y:HOF.boden,skala:HOF.kurierMass,sitz:0,ansicht:"vorn",geht:false,paket:false}};
  if (p < .8) return {wagen,bote:null};
  if (p < .8 + HOF.ausstiegSek) {
    const s = fahrerWechsel((p-.8)/HOF.ausstiegSek,t); return {wagen:{...wagen,fahrer:s.fahrer,fahrertuer:s.tuer},bote:s.bote};
  }
  wagen.fahrer=false;
  const a = HOF.ausstieg*HOF.mass, zu=HOF.griff*HOF.mass+HOF.griffAbstand, auf=(HOF.griff-HOF.schiene)*HOF.mass+HOF.griffAbstand;
  const bote: Botenstand = {x:a,y:HOF.boden,skala:HOF.kurierMass,sitz:0,ansicht:"links",geht:false,paket:false};
  if (p<6.7) { bote.x=misch(a,zu,sanft((p-4.15)/2.55)); bote.geht=p>4.17; }
  else if(p<8.5) {wagen.schiebe=schieber((p-6.7)/1.8);return {wagen,bote:frachtHalten(t,wagen.schiebe)};}
  else if(p<11.1) {
    wagen.schiebe=1; bote.x=misch(auf,HOF.ladegut*HOF.mass+10.3*HOF.kurierMass,sanft((p-8.5)/1.15));bote.geht=p<9.65;
    if(p>9.65&&p<10.38) bote.griff=[(HOF.ladegut*HOF.mass-bote.x)/bote.skala,((HOF.ladegutY+schwebeY(t))*HOF.mass-bote.y)/bote.skala];
    if(p>=10.38){wagen.paketImWagen=false;bote.paket=true;}
  } else {
    wagen.schiebe=1;wagen.paketImWagen=false;bote.paket=true;bote.ansicht="rechts";bote.geht=p<13.8;
    bote.x=misch(HOF.ladegut*HOF.mass+10.3*HOF.kurierMass,145,sanft((p-11.1)/2.7));
  }
  return {wagen,bote};
}