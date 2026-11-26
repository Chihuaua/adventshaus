import { useEffect, useRef, useState } from "react";
import { drawLuni, luniRigBauen, LUNI_H, type LuniOpts, type LuniState } from "@/game/luni";
import { zeichneLuniFein } from "@/game/luni-fein";

type Ansicht = "blatt" | "vergleich" | "portraet" | "strick";
type Haltung = Extract<LuniState, "idle" | "walk" | "wave" | "sit" | "act" | "stretch" | "think">;
interface Wahl { ansicht: Ansicht; haltung: Haltung; richtung: 1 | -1; pause: boolean }
const ANSICHTEN: [Ansicht, string][] = [["blatt", "Figurenblatt"], ["vergleich", "Vergleich"], ["portraet", "Porträt"], ["strick", "Strickdetail"]];
const HALTUNGEN: [Haltung, string][] = [["idle", "Stehen"], ["walk", "Gehen"], ["wave", "Winken"], ["sit", "Sitzen"], ["act", "Greifen"], ["stretch", "Strecken"], ["think", "Überlegen"]];
const tinten = { schrift: "#494d45", skala: "#777d70", linie: "rgba(91,100,84,.22)" };
type C = CanvasRenderingContext2D;

/** Warmes Zeichenpapier mit feinen Fasern. Die unbewegte Flaeche entsteht nur beim Vergroessern. */
function zeichenpapier(c: C, w: number, h: number) {
  const grund = c.createLinearGradient(0, 0, w, h * 1.3);
  grund.addColorStop(0, "#f1eadc"); grund.addColorStop(.46, "#eee8dc"); grund.addColorStop(1, "#dedbcc");
  c.fillStyle = grund; c.fillRect(0, 0, w, h);
  let z = 32141;
  const korn = () => { z = (Math.imul(z, 1664525) + 1013904223) >>> 0; return z / 4294967296; };
  c.lineCap = "round";
  for (let i = 0; i < Math.min(6500, w * h / 57); i++) {
    const x = korn() * w, y = korn() * h, l = .55 + korn() * 2.9;
    c.strokeStyle = i % 3 ? "rgba(255,255,247,.26)" : "rgba(114,105,83,.09)";
    c.lineWidth = .28 + korn() * .35; c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + l * .6, y + .4, x + l, y + (korn() - .5) * 1.2); c.stroke();
  }
  c.strokeStyle = "rgba(100,103,90,.30)"; c.lineWidth = .8;
  for (const x of [17, w - 17]) for (const y of [16, h - 16]) {
    c.beginPath(); c.moveTo(x, y + (y < h / 2 ? 5 : -5)); c.lineTo(x, y);
    c.lineTo(x + (x < w / 2 ? 5 : -5), y); c.stroke();
  }
}

function boden(c: C, w: number, y: number, skala: number) {
  const x = w < 540 ? 20 : 38;
  c.save(); c.strokeStyle = tinten.linie; c.lineWidth = .7; c.beginPath();
  c.moveTo(x, y - LUNI_H * skala); c.lineTo(x, y); c.lineTo(w - x, y); c.stroke();
  c.font = '500 10px "Space Grotesk", sans-serif'; c.fillStyle = tinten.skala; c.textAlign = "left"; c.textBaseline = "middle";
  for (let k = 0; k <= LUNI_H; k += 2) {
    const yy = y - k * skala, lang = k % 10 === 0 || k === LUNI_H;
    c.beginPath(); c.moveTo(x - 1, yy); c.lineTo(x + (lang ? 6.5 : 3.1), yy); c.stroke();
    if (lang && (k === 0 || k === LUNI_H || (w > 540 && k % 20 === 0))) c.fillText(String(k), x + 10, yy);
  }
  c.restore();
}

function standflaeche(c: C, x: number, y: number, sc: number, sitzen: boolean) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  c.save(); c.scale(1, .185);
  const g = c.createRadialGradient(0, 3, 1.5, 0, 3, sitzen ? 16 : 14.7);
  g.addColorStop(0, "rgba(64,64,47,.21)"); g.addColorStop(.54, "rgba(80,79,59,.12)"); g.addColorStop(1, "rgba(93,90,65,0)");
  c.fillStyle = g; c.fillRect(-17, -15, 34, 35); c.restore();
  if (sitzen) {
    c.lineCap = "round"; c.strokeStyle = "#918571"; c.lineWidth = 1.43;
    c.beginPath(); c.moveTo(-6.1, -8.6); c.lineTo(-7.3, -.2); c.moveTo(5.6, -8.6); c.lineTo(6.4, -.2); c.stroke();
    c.fillStyle = "#ac9b80"; c.beginPath(); c.roundRect(-8, -10, 16, 2.5, 1); c.fill();
    c.strokeStyle = "#cdbea5"; c.lineWidth = .29; c.beginPath(); c.moveTo(-7.4, -9.73); c.lineTo(7.27, -9.73); c.stroke();
  }
  c.restore();
}

function FeinBuehne({ wahl }: { wahl: Wahl }) {
  const ref = useRef<HTMLCanvasElement>(null), aktuell = useRef(wahl);
  aktuell.current = wahl;
  useEffect(() => {
    const cv = ref.current, rahmen = cv?.parentElement, c = cv?.getContext("2d");
    if (!cv || !rahmen || !c) return;
    const papier = document.createElement("canvas"), pc = papier.getContext("2d");
    let w = 1, h = 1, dpr = 1, zeit = .4, schritt = .77, raf = 0, zuletzt = performance.now();
    let letzteWahl: Wahl | null = null, neu = true;
    const groesse = () => {
      w = Math.max(1, rahmen.clientWidth); h = Math.max(1, rahmen.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = papier.width = Math.round(w * dpr); cv.height = papier.height = Math.round(h * dpr);
      if (pc) { pc.setTransform(dpr, 0, 0, dpr, 0, 0); zeichenpapier(pc, w, h); }
      neu = true;
    };
    const zeichnen = (jetzt: number) => {
      raf = requestAnimationFrame(zeichnen);
      const o = aktuell.current, dt = Math.min(.05, Math.max(0, (jetzt - zuletzt) / 1000)); zuletzt = jetzt;
      if (o.pause && !neu && o === letzteWahl) return;
      if (!o.pause) { zeit += dt; if (o.haltung === "walk") schritt += dt * 7.2; }
      neu = false; letzteWahl = o;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.drawImage(papier, 0, 0, w, h);
      const vorlage: LuniOpts = { t: zeit, state: o.haltung, expr: o.haltung === "wave" ? "happy" : o.haltung === "think" ? "think" : "neutral",
        walk: schritt, phase: (zeit / 2.7) % 1, blink: zeit % 4.9 > 4.77 ? 1 : 0, face: o.richtung, shadow: false };
      if (o.ansicht === "portraet" || o.ansicht === "strick") {
        const kopf = o.ansicht === "portraet";
        const sc = Math.min(w / (kopf ? 32 : 30), h / (kopf ? 33.5 : 27.8));
        const opts = { ...vorlage, scale: sc }, r = luniRigBauen(0, 0, opts);
        const ziel = kopf ? r.headY + 3.2 : (r.shoulderY + r.hipY) / 2 - .23;
        // Die Lupe vergroessert dieselbe Pose, statt Gesicht oder Stoff ein zweites Mal nachzubauen.
        zeichneLuniFein(c, w / 2 - (r.rootX + (kopf ? r.headX : 0)) * sc * o.richtung,
          h / 2 - (ziel + r.rootY) * sc, opts);
        return;
      }
      const vergleich = o.ansicht === "vergleich", drei = !vergleich && w >= 640;
      const felder = drei ? 3 : 2, rand = w < 540 ? 18 : 52;
      const feld = (w - rand * 2) / felder;
      const sc = Math.min(h * .72 / 58.1, (feld - 7) / 35.5), y = h * .823;
      boden(c, w, y, sc);
      for (let i = 0; i < felder; i++) {
        const alt = vergleich && i === 0, ruecken = !vergleich && i === felder - 1;
        const face = ruecken || (!vergleich && drei && i === 1) ? -o.richtung as 1 | -1 : o.richtung;
        const x = rand + (i + .5) * feld + (w < 540 && i === 0 ? 4 : 0);
        standflaeche(c, x, y, sc, o.haltung === "sit");
        (alt ? drawLuni : zeichneLuniFein)(c, x, y, { ...vorlage, scale: sc, back: ruecken, backReach: ruecken && o.haltung !== "idle", face });
        const titel = vergleich ? (alt ? "Luni im Haus" : "Feinzeichnung") : ruecken ? "Rückansicht" : face === 1 ? "Blick rechts" : "Blick links";
        c.font = '600 11px "Space Grotesk", sans-serif'; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillStyle = tinten.schrift; c.fillText(titel, x, y + Math.min(25, h * .07));
      }
    };
    groesse(); const ro = new ResizeObserver(groesse); ro.observe(rahmen);
    raf = requestAnimationFrame(zeichnen);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  const titel = ANSICHTEN.find(([s]) => s === wahl.ansicht)?.[1], pose = HALTUNGEN.find(([s]) => s === wahl.haltung)?.[1];
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" role="img" aria-label={`Lunis Feinzeichnung: ${titel}, ${pose}.`} />;
}

const knopf = (an: boolean) => `btn-press min-h-8 rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${an ? "bg-teal text-[#04211d]" : "bg-[#132a33] text-mint-200 ring-1 ring-white/10 hover:bg-ink-700 hover:text-mint-50"}`;
const link = "btn-press rounded bg-[#132a33] px-2.5 py-1.5 text-amber-glow ring-1 ring-white/10 hover:bg-ink-700 focus-visible:outline-2 focus-visible:outline-teal";
const legende = "mb-2 block font-display text-[10px] tracking-[.22em] text-mint-400";

export default function LuniFeinStudio() {
  const [ansicht, setAnsicht] = useState<Ansicht>("blatt");
  const [haltung, setHaltung] = useState<Haltung>("idle");
  const [richtung, setRichtung] = useState<1 | -1>(1);
  const [pause, setPause] = useState(false);
  return (
    <div className="bg-room grid-floor flex min-h-[100dvh] w-full items-center p-3 sm:p-6">
      <main className="relative mx-auto w-full max-w-[1140px]">
        <header className="mb-4 sm:mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 font-display text-[10px] tracking-[.19em]">
            <span className="text-teal">LITTLE COMPUTER LUNI · FIGURENSTUDIO</span>
            <nav aria-label="Studio-Navigation" className="flex gap-2 text-[9px]">
              <a className={link} href="#studio">&larr; STUDIO</a><a className={link} href="#">ZUM HAUS &rarr;</a>
            </nav>
          </div>
          <h1 className="mt-5 font-display text-[28px] leading-tight tracking-tight text-mint-50 sm:text-[40px]">LUNI <span className="text-amber-glow">FEINZEICHNUNG</span></h1>
          <p className="mt-2 text-[13px] leading-relaxed text-mint-200">Lunis vertraute Silhouette mit feinen Haarsträhnen, weichem Karostrick und bunten Stricksocken.</p>
        </header>
        <div className="bezel rounded-[18px] p-1.5 sm:rounded-[22px] sm:p-3">
          <div className="screen-glass relative h-[clamp(325px,46vw,475px)] overflow-hidden rounded-[10px] sm:rounded-[13px]">
            <FeinBuehne wahl={{ ansicht, haltung, richtung, pause }} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-7 gap-y-4 sm:mt-5">
          <fieldset className="min-w-0">
            <legend className={legende}>ANSICHT</legend>
            <div className="flex flex-wrap gap-1.5">{ANSICHTEN.map(([v, label]) => <button key={v} className={knopf(v === ansicht)} aria-pressed={v === ansicht} onClick={() => setAnsicht(v)}>{label}</button>)}</div>
          </fieldset>
          <label>
            <span className={legende}>HALTUNG</span>
            <select value={haltung} onChange={(e) => setHaltung(e.target.value as Haltung)} className={`${knopf(false)} min-w-[105px] cursor-pointer`}>
              {HALTUNGEN.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </label>
          <div className="flex gap-1.5 sm:ml-auto">
            <button className={knopf(false)} onClick={() => setRichtung(richtung === 1 ? -1 : 1)}>Blick {richtung === 1 ? "rechts" : "links"}</button>
            <button className={knopf(pause)} aria-pressed={pause} onClick={() => setPause(!pause)}>{pause ? "Weiter" : "Standbild"}</button>
          </div>
        </div>
      </main>
    </div>
  );
}