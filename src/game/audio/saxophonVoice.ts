type Note = {pitch:number; velocity:number; dur:number};
/** Identische mathematische Tonerzeugung wie Klangprobe 7, festes Dirty-Preset. */
function renderNote(ctx: BaseAudioContext,n: Note): AudioBuffer {
 const hold=Math.max(.001,Math.min(n.dur,20)),release=0,mono=true;
 const sr=ctx.sampleRate,count=Math.ceil((hold+release)*sr),buf=ctx.createBuffer(1,count,sr),out=buf.getChannelData(0);
 const f=440*Math.pow(2,(n.pitch-69)/12),bright=.31,air=.50,vib=.32,rough=true;
 const cfg={slope:.99,c1:530,c2:1180,c3:2300,hi:.19,base:1400,range:1650,transient:.028,drive:1.40,air:1.1,att:.052};
 const grit=.42;
 const vel=n.velocity/127,N=Math.min(38,Math.floor(sr*.44/f)),weights: number[]=[];
 // Broad resonances stay at roughly fixed absolute frequencies as pitch changes.
 const bump=(hz: number,center: number,width: number)=>Math.exp(-.5*Math.pow(Math.log(hz/center)/width,2));
 let energy=0;
 for(let k=1;k<=N;k++){
  const hz=k*f,source=Math.pow(k,-cfg.slope);
  const body=.20+1.20*bump(hz,cfg.c1,.48)+.86*bump(hz,cfg.c2,.30)+(cfg.hi+bright*cfg.hi*1.44)*bump(hz,cfg.c3,.31);
  const cutoff=Math.exp(-Math.pow(hz/(cfg.base+bright*cfg.range+vel*400),1.35));
  const reed=(k%2===0?1.04:.94),amp=source*body*cutoff*reed;
  weights.push(amp);energy+=amp*amp*.5;
 }
 const normal=.40/Math.sqrt(Math.max(.01,energy));
 const att=Math.min(cfg.att,hold*.34);let phase=0,seed=(n.pitch*65537+n.velocity*53+12345)>>>0,nlow=0,nslow=0,jitter=0;
 const phases=weights.map((_,i)=>.11*Math.sin(i*1.8));
 const phaseSin=phases.map(Math.sin),phaseCos=phases.map(Math.cos),slow=new Float64Array(N).fill(1);
 for(let i=0;i<count;i++){
  const t=i/sr,fade=mono?Math.min(1,Math.max(0,(hold-t)/Math.min(.006,hold*.25))):(t<hold?1:Math.exp(-(t-hold)*49)),attack=1-Math.exp(-t/(att*.30));
  const vibramp=Math.max(0,Math.min(1,(t-.17)/.23));
  const cents=(-11*Math.exp(-t/.042))+(vib*24*vibramp*Math.sin(2*Math.PI*5.25*t)) + grit*(4*Math.sin(2*Math.PI*18.7*t)+2.5*Math.sin(2*Math.PI*27.1*t)) + 1.4*Math.sin(2*Math.PI*1.73*t)+.7*Math.sin(2*Math.PI*11.9*t);
  phase+=2*Math.PI*f*Math.pow(2,cents/1200)/sr;if(phase>Math.PI*2)phase-=Math.PI*2;
  // Bright transient settles into a darker sustained reed tone.
  const transient=Math.exp(-t/.095);let tone=0;
  if((i&127)===0)for(let k=1;k<=N;k++)slow[k-1]=1+(rough?.045:.018)*Math.sin(2*Math.PI*(2.1+k*.17)*t+k);
  // Throat-like modulation adds irregular sidebands, distinct from ordinary pitch vibrato.
  const throatPhase=2*Math.PI*34.7*t+.55*Math.sin(2*Math.PI*2.3*t)+.22*Math.sin(2*Math.PI*7.1*t);
  const throat=Math.sin(throatPhase);
  const reedPhase=phase+grit*(.19*throat+.055*Math.sin(throatPhase*1.91));
  const sn=Math.sin(reedPhase),cs=Math.cos(reedPhase);let hs=sn,hc=cs;
  for(let k=1;k<=N;k++){
   const spectral=(1+transient*Math.min(k,10)*cfg.transient)*slow[k-1];
   tone+=weights[k-1]*spectral*(hs*phaseCos[k-1]+hc*phaseSin[k-1]);
   const ns=hs*cs+hc*sn;hc=hc*cs-hs*sn;hs=ns;
  }
  seed=(seed*1664525+1013904223)>>>0;const white=seed/2147483648-1;
  nlow+=.23*(white-nlow);nslow+=.045*(white-nslow);const breath=nlow-nslow;
  jitter+=.0035*(white-jitter);
  const onset=1-Math.exp(-t/.045);
  const flutter=1+(rough?.035:.012)*Math.sin(2*Math.PI*32*t)+grit*onset*(.22*throat+.07*Math.sin(throatPhase*.53)+.25*jitter);
  const reedTone=tone*normal*cfg.drive;
  // Mild asymmetric reed saturation; the output high-pass removes its DC component.
  const shaped=(Math.tanh(reedTone+grit*.13*reedTone*reedTone))*flutter;
  const blown=breath*air*cfg.air*(.16+.24*Math.exp(-t/.06));
  out[i]=(shaped+blown)*attack*fade*(.96+.015*Math.sin(2*Math.PI*3.3*t));
 }
 return buf;
}

import { SAX_NOTES, SAX_TICKS_PER_SECOND, SAX_DURATION_SECONDS } from './saxophonNotes';

export const SAX_PRESET = Object.freeze({model:'dirty', brightness:31, breath:50, vibrato:32, extraGrowl:0, volume:55, monophonic:true, room:false});
// Reglerwerte wurden aus dem Screenshot angenähert; dort waren keine Zahlen sichtbar.

type Voice = {source: AudioBufferSourceNode; nodes: AudioNode[]};
/** An VORHANDENEN AudioContext und bestehenden Master anschließen. Kein eigener Context. */
export class SaxophonMusic {
  private readonly output: GainNode;
  private buffers: AudioBuffer[] = [];
  private preparation: Promise<void> | null = null;
  private active = new Set<Voice>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private anchor = 0;
  private cursor = 0;
  private playing = false;
  private position = 0;
  private disposed = false;
  public readonly duration = SAX_DURATION_SECONDS;

  constructor(private readonly ctx: AudioContext, master: AudioNode) {
    this.output = ctx.createGain();
    // Preview-Lautstärke 55%, interner Pegel .38 und Dry-Anteil .86.
    this.output.gain.value = .55 * .38 * .86;
    this.output.connect(master);
  }

  /** Vor dem zeitkritischen Szenenstart ausführen und abwarten. Keine Dateiladevorgänge. */
  public prepare(onProgress?: (fraction:number)=>void): Promise<void> {
    if(this.disposed) return Promise.reject(new Error('SaxophonMusic bereits freigegeben'));
    if(this.preparation) return this.preparation;
    this.preparation = (async()=>{
      const rendered: AudioBuffer[] = [];
      const cache = new Map<string,AudioBuffer>();
      for(let i=0;i<SAX_NOTES.length;i++){
        if(this.disposed) throw new Error('Vorbereitung abgebrochen');
        const [,ticks,pitch,velocity] = SAX_NOTES[i];
        const key = `${ticks}:${pitch}:${velocity}`;
        let buffer = cache.get(key);
        if(!buffer){buffer=renderNote(this.ctx,{pitch,velocity,dur:ticks/SAX_TICKS_PER_SECOND});cache.set(key,buffer);}
        rendered.push(buffer);
        onProgress?.((i+1)/SAX_NOTES.length);
        if(i%4===3) await new Promise<void>(resolve=>setTimeout(resolve,0));
      }
      if(this.disposed) throw new Error('Vorbereitung abgebrochen');
      this.buffers=rendered;
    })().catch(error=>{this.preparation=null;throw error;});
    return this.preparation;
  }

  /**
   * audioTime = EXAKTER Startzeitpunkt auf ctx.currentTime-Zeitachse, Sekunden.
   * offsetSeconds = lokale Musikzeit, etwa nach ±10-s-Sprung.
   * Nach prepare(), bei laufendem Context aufrufen. 50–100 ms im Voraus planen.
   * Kein versteckter Countdown; frühere Zeitpunkte holen nur die passende Bufferposition nach.
   */
  public playAt(audioTime:number, offsetSeconds=0): void {
    if(this.disposed) throw new Error('SaxophonMusic bereits freigegeben');
    if(this.buffers.length!==SAX_NOTES.length) throw new Error('Zuerst await music.prepare()');
    if(this.ctx.state!=='running') throw new Error('Vorher vorhandenen AudioContext per Nutzergeste fortsetzen');
    if(!Number.isFinite(audioTime)||!Number.isFinite(offsetSeconds)) throw new Error('Ungültige Startzeit');
    this.stop();
    this.position=Math.max(0,Math.min(this.duration,offsetSeconds));
    if(this.position>=this.duration)return;
    this.anchor=audioTime-this.position;
    this.cursor=0;
    while(this.cursor<SAX_NOTES.length){
      const [tick,length]=SAX_NOTES[this.cursor];
      if((tick+length)/SAX_TICKS_PER_SECOND>this.position)break;
      this.cursor++;
    }
    this.playing=true;
    this.schedule();
    if(this.playing)this.timer=setInterval(()=>this.schedule(),25);
  }

  public get currentTime(): number {
    return this.playing ? Math.min(this.duration,Math.max(this.position,this.ctx.currentTime-this.anchor)) : this.position;
  }

  public pause(): number {
    const position=this.currentTime;
    this.stop();
    this.position=position;
    return position;
  }

  /** Für Seek: playAt(gemeinsamerAudioZeitpunkt, neueLokaleMusikzeit). */
  public stop(): void {
    this.playing=false;
    if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
    for(const voice of this.active){
      try{voice.source.stop();}catch{/* bereits beendet */}
      for(const node of voice.nodes)node.disconnect();
    }
    this.active.clear();
    this.position=0;
  }

  public dispose(): void {
    this.disposed=true;
    this.stop();
    this.output.disconnect();
    this.buffers=[];
    this.preparation=null;
  }

  private schedule(): void {
    if(!this.playing)return;
    const now=this.ctx.currentTime;
    const horizon=now+.12;
    while(this.cursor<SAX_NOTES.length){
      const index=this.cursor;
      const [tick,ticks,pitch,velocity]=SAX_NOTES[index];
      const when=this.anchor+tick/SAX_TICKS_PER_SECOND;
      if(when>horizon)break;
      this.cursor++;
      const end=when+ticks/SAX_TICKS_PER_SECOND;
      if(end<=now)continue;
      const source=this.ctx.createBufferSource();
      const hp=this.ctx.createBiquadFilter();
      const lp=this.ctx.createBiquadFilter();
      const gain=this.ctx.createGain();
      source.buffer=this.buffers[index];
      hp.type='highpass';hp.frequency.value=65;hp.Q.value=.5;
      lp.type='lowpass';lp.Q.value=.55;
      const f=440*Math.pow(2,(pitch-69)/12);
      lp.frequency.value=Math.min(this.ctx.sampleRate*.43,1400+.31*1650+f*1.4);
      gain.gain.value=.22*Math.pow(velocity/127,.8);
      source.connect(hp);hp.connect(lp);lp.connect(gain);gain.connect(this.output);
      const voice:Voice={source,nodes:[source,hp,lp,gain]};
      this.active.add(voice);
      source.onended=()=>{for(const node of voice.nodes)node.disconnect();this.active.delete(voice);};
      // Kein willkürlicher Startaufschlag. Bei spätem Scheduler an korrekter Position fortsetzen.
      const actualStart=Math.max(now,when);
      source.start(actualStart,Math.max(0,actualStart-when));
      source.stop(end);
    }
    if(now>=this.anchor+this.duration){
      this.stop();
      this.position=this.duration;
    }
  }
}
