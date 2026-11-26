import { useEffect, useRef, useState } from "react";
import { FIGUREN, REIHENFOLGE, STUDIO_HASH, type Auswahl, type FigurId } from "@/game/atelier/figuren";
import { nachtAmKanal, studiengrund } from "@/game/atelier/prospekt";
import { korn, type Ansicht, type C, type Pose } from "@/game/atelier/stift";
import { hofprobe, type Werkprobe } from "@/game/atelier/kurierhof";
import { zeichneHofbild } from "@/game/atelier/schwebetransporter";

type Tafel = Ansicht | "blatt" | "detail" | "fahrzeug";
const ANSICHTEN: [Ansicht, string, string][] = [["vorn", "Vorn", "Vorderansicht"], ["links", "Links", "Linkes Profil"], ["rechts", "Rechts", "Rechtes Profil"], ["hinten", "Hinten", "Rückansicht"]];
const GRUPPENPOSEN: [Pose, string][] = [["ruhe", "In Ruhe"], ["gang", "Unterwegs"], ["aktion", "Begrüßung"]];
interface Wahl { id: Auswahl; tafel: Tafel; pose: Pose; pause: boolean; probe: Werkprobe; durchgang: number }
const FAHRPROBEN: [Werkprobe,string][] = [["schweben","Außenansicht"],["kabine","Fahrerausstieg"],["laderaum","Schiebetür"],["tour","Ausladen"]];
const istHund = (id: Auswahl) => id === "odin" || id === "apollo";

function figur(c: C, id: FigurId, x: number, y: number, sc: number, ansicht: Ansicht, pose: Pose, zeit: number) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  FIGUREN[id].zeichnen(c, { ansicht, pose, zeit }); c.restore();
}

function gruppenbild(c: C, w: number, h: number, t: number, pose: Pose) {
  const klein = w < 600;
  const sc = klein ? Math.min(w / 164, h * .49 / 99) : Math.min(w / 297, h * .715 / 99);
  for (let i = 0; i < 24; i++) {
    const y = (korn(i + 66) * h + t * (2.1 + 1.7 * korn(i))) % h;
    const x = (korn(i + 29) * w + Math.sin(t * .17 + i * .77) * 4.2 + w) % w;
    c.fillStyle = `rgba(245,247,240,${.24 + .28 * korn(i + 38)})`; c.beginPath(); c.arc(x, y, .55 + .59 * korn(i), 0, 2 * Math.PI); c.fill();
  }
  figur(c, "schneemann", w * (klein ? .8 : .78), h * (klein ? .663 : .804), sc * .97, "vorn", pose, t + .84);
  figur(c, "weihnachtsmann", w * .499, h * (klein ? .702 : .833), sc, "vorn", pose, t);
  figur(c, "briefkurier", w * (klein ? .194 : .222), h * (klein ? .755 : .836), sc * 1.04, "vorn", pose, t + .41);
  figur(c, "odin", w * (klein ? .262 : .357), h * (klein ? .928 : .942), sc * .99, "rechts", pose, t + 1.37);
  figur(c, "apollo", w * (klein ? .719 : .633), h * (klein ? .908 : .932), sc * 1.02, "vorn", pose === "ruhe" ? "sitzen" : pose, t + .66);
}

function studienblatt(c: C, w: number, h: number, id: FigurId, tafel: Tafel, pose: Pose, t: number) {
  const f = FIGUREN[id], hund = istHund(id);
  if (tafel === "detail") {
    const hoehe = id === "weihnachtsmann" ? 67 : id === "schneemann" ? 53 : hund ? 34 : 44;
    const sc = Math.min(w / (f.kopfBreite * 1.28), h / hoehe);
    figur(c, id, w * .5 - f.kopf[0] * sc, h * .48 - f.kopf[1] * sc, sc, "vorn", pose, t); return;
  }
  const blatt = tafel === "blatt", ansichten = blatt ? ANSICHTEN : ANSICHTEN.filter(a => a[0] === tafel);
  const zwei = blatt && w < 600, reihen = zwei ? 2 : 1, zeilenH = h / reihen;
  const rand = w < 600 ? 14 : 24, nutz = w - 2 * rand;
  // Im Profil brauchen die Hunde mehr Platz als von vorn. Der Massstab bleibt in allen Ansichten gleich.
  const anteile = !blatt ? [1] : zwei ? [.5, .5] : hund ? [.155, .345, .345, .155] : [.25, .25, .25, .25];
  const spalten = zwei ? 2 : ansichten.length;
  const breitestesFeld = nutz * (blatt ? Math.max(...anteile) : 1);
  const sc = Math.min(zeilenH * (blatt ? .718 : .766) / f.hoehe, breitestesFeld * .94 / (hund ? f.breite : f.breite + 3.4));
  const boden = zeilenH * .836;
  for (let r = 0; r < reihen; r++) {
    c.beginPath(); c.moveTo(rand, r * zeilenH + boden + .3); c.lineTo(w - rand, r * zeilenH + boden + .3);
    c.strokeStyle = "rgba(80,98,93,.16)"; c.lineWidth = .63; c.stroke();
  }
  ansichten.forEach(([blick, , label], i) => {
    const col = i % spalten, x0 = anteile.slice(0, col).reduce((sum, a) => sum + a, 0);
    const x = rand + nutz * (x0 + anteile[col] * .5), y = Math.floor(i / spalten) * zeilenH + boden;
    figur(c, id, x, y, sc, blick, pose, t);
    c.fillStyle = "#3b4b49"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = '600 11px "Space Grotesk", sans-serif'; c.fillText(label, x, y + Math.min(25, zeilenH * .085));
  });
}

function AtelierBuehne({ wahl }: { wahl: Wahl }) {
  const ref = useRef<HTMLCanvasElement>(null), auswahl = useRef(wahl);
  auswahl.current = wahl;
  useEffect(() => {
    const cv = ref.current, rahmen = cv?.parentElement, c = cv?.getContext("2d");
    if (!cv || !rahmen || !c) return;
    const papier = document.createElement("canvas"), p = papier.getContext("2d");
    let w = 1, h = 1, dpr = 1, raf = 0, zeit = 1.2, alt = performance.now(), hintergrund = "";
    let vorher: Wahl | null = null, probeZeit = 0;
    const groesse = () => {
      w = Math.max(1, rahmen.clientWidth); h = Math.max(1, rahmen.clientHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = papier.width = Math.round(w * dpr); cv.height = papier.height = Math.round(h * dpr);
      hintergrund = "";
    };
    const bild = (jetzt: number) => {
      raf = requestAnimationFrame(bild);
      const o = auswahl.current, dt = Math.max(0, Math.min(.06, (jetzt - alt) / 1000)); alt = jetzt;
      if (document.hidden) return;
      if (o.pause && vorher === o && hintergrund) return;
      if (vorher && vorher.pose !== o.pose) zeit = o.pose === "aktion" ? 2.16 : 1.2;
      if (!vorher || o.probe !== vorher.probe || o.tafel !== vorher.tafel || o.durchgang !== vorher.durchgang) {
        probeZeit = o.pause ? o.probe === "kabine" ? 1.8 : o.probe === "laderaum" ? 1.74 : o.probe === "tour" ? 10.81 : 0 : 0;
      }
      if (!o.pause) { zeit += dt; probeZeit += dt; }
      vorher = o;
      const ort = o.id === "gruppe" || o.tafel === "fahrzeug" ? "kanal" : istHund(o.id) ? "tier" : "figur";
      if (p && ort !== hintergrund) {
        p.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (ort === "kanal") nachtAmKanal(p, w, h, w < 600); else studiengrund(p, w, h, ort === "tier");
        hintergrund = ort;
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.drawImage(papier, 0, 0, w, h);
      if (o.id === "gruppe") gruppenbild(c, w, h, zeit, o.pose);
      else if (o.tafel === "fahrzeug") {
        const sc = Math.min((w - Math.min(80,w*.09))/164,h*.805/73.7);
        c.save(); c.translate((w-153*sc)/2,h*.831); c.scale(sc,sc);
        zeichneHofbild(c,0,0,hofprobe(probeZeit,o.probe)); c.restore();
      }
      else studienblatt(c, w, h, o.id, o.tafel, o.pose, zeit);
    };
    groesse(); const ro = new ResizeObserver(groesse); ro.observe(rahmen); raf = requestAnimationFrame(bild);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  const beschriftung = wahl.tafel === "fahrzeug" ? `Schwebetransporter: ${FAHRPROBEN.find(([k])=>k===wahl.probe)?.[1]}` : wahl.id === "gruppe" ? "Gemeinsames Winterbild aller fünf Studiofiguren" : `${FIGUREN[wahl.id].name}: ${wahl.tafel === "blatt" ? "Vorderansicht, beide Profile und Rückansicht" : wahl.tafel === "detail" ? "Nahansicht" : ANSICHTEN.find(a => a[0] === wahl.tafel)?.[2]}`;
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" role="img" aria-label={beschriftung} />;
}

const knopf = (aktiv: boolean) => `btn-press min-h-8 rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${aktiv ? "bg-teal text-[#04211d]" : "bg-[#132a33] text-mint-200 ring-1 ring-white/10 hover:bg-ink-700 hover:text-mint-50"}`;
const link = "btn-press rounded bg-[#132a33] px-2.5 py-1.5 text-amber-glow ring-1 ring-white/10 hover:bg-ink-700 focus-visible:outline-2 focus-visible:outline-teal";
const legende = "mb-2 font-display text-[10px] tracking-[.22em] text-mint-400";

export default function FigurenAtelier({ id, fahrzeug = false }: { id: Auswahl; fahrzeug?: boolean }) {
  const [tafel, setTafel] = useState<Tafel>(fahrzeug ? "fahrzeug" : "blatt"), [pose, setPose] = useState<Pose>("ruhe");
  const [probe,setProbe] = useState<Werkprobe>("schweben"), [durchgang,setDurchgang] = useState(0);
  const [pause, setPause] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const entwurf = id === "gruppe" ? null : FIGUREN[id];
  const namen: [Auswahl, string][] = [["gruppe", "Gruppenbild"], ...REIHENFOLGE.map((k): [Auswahl, string] => [k, FIGUREN[k].name])];
  const ansichten: [Tafel, string][] = [["blatt", "Figurenblatt"], ...ANSICHTEN.map(([a, l]): [Tafel, string] => [a, l]), ["detail", "Nahansicht"]];
  if (id === "briefkurier") ansichten.push(["fahrzeug","Transporter"]);
  const hoehe = tafel === "fahrzeug" ? "h-[clamp(235px,44vw,460px)]" : istHund(id) && tafel === "blatt" ? "h-[350px] sm:h-[clamp(300px,29vw,370px)]" : "h-[410px] sm:h-[clamp(350px,38vw,460px)]";
  return (
    <div className="bg-room grid-floor flex min-h-[100dvh] w-full items-center p-3 sm:p-6">
      <main className="relative mx-auto w-full min-w-0 max-w-[1140px]">
        <header className="mb-3.5 sm:mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 font-display text-[10px] tracking-[.19em]">
            <span className="text-teal">LITTLE COMPUTER LUNI · FIGURENSTUDIO</span>
            <nav aria-label="Studio-Navigation" className="flex gap-2 text-[9px]">
              <a className={link} href="#studio">&larr; STUDIO</a><a className={link} href="#">ZUM HAUS &rarr;</a>
            </nav>
          </div>
          <h1 className="mt-5 font-display text-[clamp(24px,6.7vw,40px)] leading-tight tracking-tight text-amber-glow">{tafel === "fahrzeug" ? "SCHWEBETRANSPORTER" : entwurf ? entwurf.name.toLocaleUpperCase("de-DE") : <><span className="text-mint-50">LUNIS </span>FIGURENATELIER</>}</h1>
          <p className="mt-1.5 max-w-[88ch] text-[13px] leading-relaxed text-mint-200">{tafel === "fahrzeug" ? "Kurierwagen 07. Seine Schwebespulen tragen noch den ersten Lack, das Heck schon das zweite Ersatzblech." : entwurf?.beschreibung ?? "Der Briefkurier, zwei Besucher aus der Neonstadt und Lunis Hunde am verschneiten Stadtkanal."}</p>
        </header>
        <nav aria-label="Figur wählen" className="mb-2.5 flex flex-wrap gap-x-4 gap-y-1 border-b border-white/10 sm:gap-x-6">
          {namen.map(([k, name]) => <a key={k} href={STUDIO_HASH(k)} aria-current={id === k ? "page" : undefined}
            className={`flex min-h-8 items-center border-b-2 pb-1 text-[12px] font-medium transition focus-visible:outline-2 focus-visible:outline-teal ${id === k ? "border-teal text-mint-50" : "border-transparent text-mint-400 hover:text-mint-50"}`}>{name}</a>)}
        </nav>
        <div className="bezel rounded-[18px] p-1.5 sm:rounded-[22px] sm:p-3">
          <div className={`screen-glass relative overflow-hidden rounded-[10px] sm:rounded-[13px] ${hoehe}`}>
            <AtelierBuehne wahl={{ id, tafel, pose, pause, probe, durchgang }} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-7 gap-y-4 sm:mt-5">
          {entwurf && <fieldset className="min-w-0"><legend className={legende}>ANSICHT</legend>
            <div className="flex flex-wrap gap-1.5">{ansichten.map(([k, name]) => <button key={k} onClick={() => setTafel(k)} aria-pressed={tafel === k} className={knopf(tafel === k)}>{name}</button>)}</div>
          </fieldset>}
          {tafel === "fahrzeug" ? <fieldset className="min-w-0"><legend className={legende}>FAHRPROBE</legend>
            <div className="flex flex-wrap gap-1.5">{FAHRPROBEN.map(([k,name]) => <button key={k} className={knopf(probe===k)} aria-pressed={probe===k} onClick={()=>{setProbe(k);setDurchgang(v=>v+1);}}>{name}</button>)}</div>
          </fieldset> : <fieldset className="min-w-0"><legend className={legende}>BEWEGUNG</legend>
            <div className="flex flex-wrap gap-1.5">{(entwurf?.posen ?? GRUPPENPOSEN).map(([k, name]) => <button key={k} onClick={() => setPose(k)} aria-pressed={pose === k} className={knopf(pose === k)}>{name}</button>)}</div>
          </fieldset>}
          <button className={`${knopf(pause)} sm:ml-auto`} aria-pressed={pause} onClick={() => setPause(!pause)}>{pause ? "Weiter" : "Standbild"}</button>
        </div>
      </main>
    </div>
  );
}