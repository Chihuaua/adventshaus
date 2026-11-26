import { useEffect, useRef, useState } from "react";
import { zeichneNikolaus, NIKOLAUS_HOEHE, type NikolausAnsicht, type NikolausPose } from "@/game/nikolaus-figur";
import { zeichneRuprecht, RUPRECHT_HOEHE } from "@/game/ruprecht-figur";

type Ansicht = NikolausAnsicht | "blatt";
const ANSICHTEN: { wert: NikolausAnsicht; name: string; kurz: string }[] = [
  { wert: "vorn", name: "Vorderansicht", kurz: "Vorn" },
  { wert: "links", name: "Linkes Profil", kurz: "Links" },
  { wert: "rechts", name: "Rechtes Profil", kurz: "Rechts" },
  { wert: "hinten", name: "Rückansicht", kurz: "Hinten" },
];
const POSEN: { wert: NikolausPose; name: string }[] = [
  { wert: "stehen", name: "Stehen" }, { wert: "gehen", name: "Gehen" }, { wert: "gruessen", name: "Grüßen" },
];
const zufall = (i: number) => { const x = Math.sin(i * 127.1 + 17.8) * 337.36; return x - Math.floor(x); };

/** Ein ruhiger, einmal gezeichneter Prospekt; die vier Figuren stehen auf derselben Schneeflaeche. */
function winterlicht(c: CanvasRenderingContext2D, w: number, hoehe: number, zweiReihen: boolean) {
  const h = zweiReihen ? hoehe / 2 : hoehe;
  const himmel = c.createLinearGradient(0, 0, 0, h * .8);
  himmel.addColorStop(0, "#253e49"); himmel.addColorStop(.51, "#6a8183"); himmel.addColorStop(1, "#c8c5ae");
  c.fillStyle = himmel; c.fillRect(0, 0, w, hoehe);
  for (let i = 0; i < 66; i++) {
    const x = zufall(i) * w, y = zufall(i + 110) * h * .48;
    c.fillStyle = `rgba(255,245,212,${.18 + zufall(i + 74) * .5})`;
    c.beginPath(); c.arc(x, y, .3 + zufall(i + 38) * .75, 0, 2 * Math.PI); c.fill();
  }
  const mx = w * .805, my = h * .17, r = Math.min(w, h) * .05;
  const licht = c.createRadialGradient(mx, my, r * .7, mx, my, r * 5.8);
  licht.addColorStop(0, "rgba(255,234,184,.15)"); licht.addColorStop(1, "rgba(255,234,184,0)");
  c.fillStyle = licht; c.fillRect(mx - r * 6, my - r * 6, r * 12, r * 12);
  c.fillStyle = "#e6dfbd"; c.beginPath(); c.arc(mx, my, r, 0, 2 * Math.PI); c.fill();
  for (let i = 0; i < 13; i++) {
    const a = i * 2.39, d = r * .7 * zufall(i + 20);
    c.fillStyle = "rgba(168,172,151,.12)"; c.beginPath();
    c.ellipse(mx + Math.cos(a) * d, my + Math.sin(a) * d, r * .13, r * .07, a, 0, 2 * Math.PI); c.fill();
  }
  for (let j = 0; j < 3; j++) {
    const base = h * (.54 + j * .072), coul = ["#819493", "#607d7b", "#435f60"][j];
    const hauteur = (x: number) => base + h * (.052 * Math.sin(x / w * 6.1 + j * 1.6) + .023 * Math.sin(x / w * 15 + j));
    c.fillStyle = coul; c.beginPath(); c.moveTo(0, h);
    for (let x = -4; x <= w + 4; x += 4) c.lineTo(x, hauteur(x));
    c.lineTo(w, h); c.closePath(); c.fill();
    const n = Math.ceil(w / (9 + j * 3));
    for (let k = -1; k <= n + 1; k++) {
      const x = k * w / n, taille = h * (.018 + j * .009 + zufall(27 * j + k) * .056);
      const yy = hauteur(x) + 3, large = taille * (.19 + zufall(k + 40) * .07);
      c.beginPath(); c.moveTo(x, yy - taille);
      for (const d of [1, -1]) {
        if (d < 0) c.moveTo(x, yy - taille);
        for (let a = 1; a <= 4; a++) {
          const v = a / 4;
          c.lineTo(x + d * large * v, yy - taille + taille * v * .92);
          c.lineTo(x + d * large * v * .45, yy - taille + taille * v * .87);
        }
        c.lineTo(x, yy + 3); c.closePath();
      }
      c.fill();
    }
  }
  const neige = c.createLinearGradient(0, h * .69, 0, hoehe);
  neige.addColorStop(0, "#a2b6b5"); neige.addColorStop(.44, "#c6d0c8"); neige.addColorStop(1, "#d9dfd4");
  c.fillStyle = neige; c.beginPath(); c.moveTo(0, h * .72);
  c.bezierCurveTo(w * .27, h * .66, w * .63, h * .87, w, h * .69); c.lineTo(w, hoehe); c.lineTo(0, hoehe); c.closePath(); c.fill();
  c.lineCap = "round";
  for (let i = 0; i < 105; i++) {
    const x = zufall(i + 327) * w, y = h * .78 + (hoehe - h * .78) * zufall(i + 451);
    c.strokeStyle = i % 3 ? "rgba(255,255,236,.29)" : "rgba(89,121,124,.13)";
    c.lineWidth = .45 + zufall(i + 87) * .55; c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + 3.5, y - .6, x + 2 + zufall(i) * 12, y - .8); c.stroke();
  }
}

type Gast = "nikolaus" | "ruprecht";
interface Bildwahl { gast: Gast; ansicht: Ansicht; pose: NikolausPose; pause: boolean }

function Figurenblatt({ gast, ansicht, pose, pause }: Bildwahl) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wahl = useRef<Bildwahl>({ gast, ansicht, pose, pause });
  wahl.current = { gast, ansicht, pose, pause };
  useEffect(() => {
    const cv = ref.current, eltern = cv?.parentElement;
    const c = cv?.getContext("2d");
    if (!cv || !c || !eltern) return;
    const prospekt = document.createElement("canvas"), hintergrund = prospekt.getContext("2d");
    let w = 0, h = 0, dpr = 1, raf = 0, t = 0, zuletzt = performance.now();
    let neu = true, doppeltGezeichnet: boolean | null = null, letzteWahl: Bildwahl | null = null;
    const groesse = () => {
      w = eltern.clientWidth; h = eltern.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = prospekt.width = Math.max(1, Math.round(w * dpr));
      cv.height = prospekt.height = Math.max(1, Math.round(h * dpr));
      doppeltGezeichnet = null; neu = true;
    };
    const bild = (jetzt: number) => {
      raf = requestAnimationFrame(bild);
      const o = wahl.current, dt = Math.min(.06, Math.max(0, (jetzt - zuletzt) / 1000)); zuletzt = jetzt;
      if (o.pause && !neu && o === letzteWahl) return;
      if (!o.pause) t += dt;
      letzteWahl = o; neu = false;
      const liste = o.ansicht === "blatt" ? ANSICHTEN : ANSICHTEN.filter((a) => a.wert === o.ansicht);
      const doppelt = liste.length === 4 && w < 525;
      if (hintergrund && doppelt !== doppeltGezeichnet) {
        hintergrund.setTransform(dpr, 0, 0, dpr, 0, 0); winterlicht(hintergrund, w, h, doppelt);
        doppeltGezeichnet = doppelt;
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.drawImage(prospekt, 0, 0, w, h);
      const spalten = doppelt ? 2 : liste.length, reihen = doppelt ? 2 : 1;
      const feld = w / spalten, zeile = h / reihen;
      const ruprecht = o.gast === "ruprecht", zeichnen = ruprecht ? zeichneRuprecht : zeichneNikolaus;
      const hoehe = ruprecht ? RUPRECHT_HOEHE : NIKOLAUS_HOEHE;
      for (let i = 0; i < liste.length; i++) {
        const x = (i % spalten + .5) * feld, y = (Math.floor(i / spalten) + .84) * zeile;
        const sc = Math.min(zeile * (liste.length === 1 ? .73 : .67) / hoehe, feld / 69);
        zeichnen(c, x + (!ruprecht && liste[i].wert === "vorn" ? sc * 2.2 : 0), y,
          { ansicht: liste[i].wert, pose: o.pose, skala: sc, zeit: t });
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillStyle = "#354d4e";
        c.font = '600 11px "Space Grotesk", sans-serif';
        c.fillText(liste[i].name, x, y + Math.min(zeile * .09, 25));
      }
    };
    groesse(); const ro = new ResizeObserver(groesse); ro.observe(eltern);
    raf = requestAnimationFrame(bild);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  const text = ansicht === "blatt" ? "Vorderansicht, linkes und rechtes Profil, Rückansicht" : ANSICHTEN.find((a) => a.wert === ansicht)?.name;
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" role="img" aria-label={`${gast === "ruprecht" ? "Knecht Ruprecht" : "Nikolaus"}: ${text}. ${POSEN.find((p) => p.wert === pose)?.name}.`} />;
}

const knopf = (an: boolean) => `btn-press min-h-8 rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-teal ${an ? "bg-teal text-[#04211d]" : "bg-[#132a33] text-mint-200 ring-1 ring-white/10 hover:bg-ink-700 hover:text-mint-50"}`;
const link = "btn-press rounded bg-[#132a33] px-2.5 py-1.5 text-amber-glow ring-1 ring-white/10 hover:bg-ink-700 focus-visible:outline-2 focus-visible:outline-teal";

export default function NikolausStudio({ gast = "nikolaus" }: { gast?: Gast }) {
  const ruprecht = gast === "ruprecht";
  const [ansicht, setAnsicht] = useState<Ansicht>("blatt");
  const [pose, setPose] = useState<NikolausPose>("stehen");
  const [pause, setPause] = useState(false);
  return (
    <div className="bg-room grid-floor flex min-h-[100dvh] w-full items-center p-3 sm:p-6">
      <main className="relative mx-auto w-full max-w-[1140px]">
        <header className="mb-4 sm:mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 font-display text-[10px] tracking-[.19em]">
            <span className="text-teal">LITTLE COMPUTER LUNI · FIGURENSTUDIO</span>
            <nav aria-label="Studio-Navigation" className="flex flex-wrap gap-2 text-[9px]">
              <a className={link} href="#studio">&larr; STUDIO</a>
              <a className={link} href={ruprecht ? "#studio-nikolaus" : "#studio-ruprecht"}>{ruprecht ? "NIKOLAUS" : "KNECHT RUPRECHT"}</a>
              <a className={link} href="#">ZUM HAUS &rarr;</a>
            </nav>
          </div>
          <h1 className="mt-5 font-display text-[30px] leading-none tracking-tight text-amber-glow sm:text-[40px]">{ruprecht ? "KNECHT RUPRECHT" : "NIKOLAUS"}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-mint-200">{ruprecht ? "Nikolaus' Weggefährte mit dem geschnitzten Wanderstab." : "Die vier Ansichten des Besuchers vom 6. Dezember."}</p>
        </header>
        <div className="bezel rounded-[18px] p-1.5 sm:rounded-[22px] sm:p-3">
          <div className="screen-glass relative h-[440px] overflow-hidden rounded-[10px] min-[540px]:h-[clamp(310px,39vw,475px)] sm:rounded-[13px]">
            <Figurenblatt gast={gast} ansicht={ansicht} pose={pose} pause={pause} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-4 sm:mt-5">
          <fieldset className="min-w-0">
            <legend className="mb-2 font-display text-[10px] tracking-[.22em] text-mint-400">ANSICHT</legend>
            <div className="flex flex-wrap gap-1.5">
              <button className={knopf(ansicht === "blatt")} aria-pressed={ansicht === "blatt"} onClick={() => setAnsicht("blatt")}>Figurenblatt</button>
              {ANSICHTEN.map((a) => <button key={a.wert} className={knopf(ansicht === a.wert)} aria-pressed={ansicht === a.wert} onClick={() => setAnsicht(a.wert)}>{a.kurz}</button>)}
            </div>
          </fieldset>
          <fieldset className="min-w-0">
            <legend className="mb-2 font-display text-[10px] tracking-[.22em] text-mint-400">BEWEGUNG</legend>
            <div className="flex gap-1.5">{POSEN.map((p) => <button key={p.wert} className={knopf(pose === p.wert)} aria-pressed={pose === p.wert} onClick={() => setPose(p.wert)}>{p.name}</button>)}</div>
          </fieldset>
          <button className={`${knopf(pause)} sm:ml-auto`} aria-pressed={pause} onClick={() => setPause(!pause)}>{pause ? "Weiter" : "Standbild"}</button>
        </div>
      </main>
    </div>
  );
}