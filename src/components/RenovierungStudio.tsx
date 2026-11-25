import { useEffect, useRef, useState } from "react";
import { FLOOR_Y, HR, alteWand, dachschraege, weihnachtsTapete, zeichneHaus } from "@/game/house";
import {
  RENO_VORSCHLAEGE,
  altwandTeil,
  drawRenovierungVorn,
  drawRenovierungWand,
  renoVorschlag,
  type RenoId,
  type RenoWand,
} from "@/game/renovierung";

type C = CanvasRenderingContext2D;

/** Wand des Musikzimmers, genau wie house.ts sie malt. */
const WAND: RenoWand = { x0: 530, x1: HR, yTop: 30, yBot: FLOOR_Y[3], decke: dachschraege };
const SOCKEL = 30;
/** Gezeigter Ausschnitt der 960×600-Bühne (Seitenverhältnis 2:1). */
const SICHT = { x: 512, y: 44, w: 336, h: 168 };
/** Die Vorschau zeichnet dreifach fein, damit die Vergrößerung scharf bleibt. */
const FEIN = 3;
const VORLAUF = 0.7;

function ebene(lesen = false): [HTMLCanvasElement, C] {
  const cv = document.createElement("canvas");
  cv.width = SICHT.w * FEIN;
  cv.height = SICHT.h * FEIN;
  const c = cv.getContext("2d", lesen ? { willReadFrequently: true } : undefined) as C;
  c.setTransform(FEIN, 0, 0, FEIN, -SICHT.x * FEIN, -SICHT.y * FEIN);
  return [cv, c];
}

function wandBild(mal: (c: C) => void): HTMLCanvasElement {
  const [cv, c] = ebene();
  mal(c);
  return cv;
}

/** Ruhiger Wintertag für die Fenster der Hauszeichnung. */
function himmel(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 960;
  cv.height = 600;
  const c = cv.getContext("2d") as C;
  const g = c.createLinearGradient(0, 0, 0, 600);
  g.addColorStop(0, "#9cc4e4");
  g.addColorStop(1, "#e4eef2");
  c.fillStyle = g;
  c.fillRect(0, 0, 960, 600);
  return cv;
}

/**
 * Zeichenfläche, die beim Malen des Hauses die alte Musikzimmerwand durch
 * eine Schlüsselfarbe ersetzt und ihr Beiwerk (Sockel, Glanzstreifen)
 * weglässt. Die Hauszeichnung selbst bleibt unverändert.
 */
function schluesselFlaeche(ziel: C, farbe: string, treffer: { grund: number }): C {
  const gebunden = new Map<PropertyKey, unknown>();
  return new Proxy(ziel, {
    get(t, k) {
      if (k === "fillRect") {
        return (x: number, y: number, b: number, h: number) => {
          const art = altwandTeil(WAND, SOCKEL, x, y, b, h);
          if (art === "beiwerk") return;
          if (art === "grund") {
            treffer.grund++;
            const vorher = t.fillStyle;
            t.fillStyle = farbe;
            t.fillRect(x, y, b, h);
            t.fillStyle = vorher;
            return;
          }
          t.fillRect(x, y, b, h);
        };
      }
      const v = (t as unknown as Record<PropertyKey, unknown>)[k];
      if (typeof v !== "function") return v;
      let f = gebunden.get(k);
      if (!f) {
        f = (v as (...a: unknown[]) => unknown).bind(t);
        gebunden.set(k, f);
      }
      return f;
    },
    set(t, k, v) {
      (t as unknown as Record<PropertyKey, unknown>)[k] = v;
      return true;
    },
  });
}

/**
 * Alles, was vor der Wand steht (Klavier, Regal, Lampe, Decke, Boden), als
 * eigene Ebene mit durchsichtiger Wand. Das Haus wird einmal mit schwarzer
 * und einmal mit weißer Wand gemalt; aus dem Unterschied ergibt sich je
 * Bildpunkt, wie viel Wand durchscheint.
 */
function moebelEbene(): HTMLCanvasElement | null {
  try {
    const sky = himmel();
    const [dunkel, hell] = ["#000000", "#ffffff"].map((farbe) => {
      const [cv, c] = ebene(true);
      const treffer = { grund: 0 };
      zeichneHaus(schluesselFlaeche(c, farbe, treffer), sky, { open: 0 }, true, null, false, undefined, false, false, true);
      if (treffer.grund !== 1) throw new Error("Musikzimmerwand nicht gefunden");
      return c.getImageData(0, 0, cv.width, cv.height);
    });
    const d = dunkel.data, h = hell.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 255) continue;
      const frei = Math.max(h[i] - d[i], h[i + 1] - d[i + 1], h[i + 2] - d[i + 2]);
      if (frei <= 0) continue;
      const deck = 1 - frei / 255;
      if (deck <= 0.004) {
        d[i + 3] = 0;
        continue;
      }
      d[i] = Math.min(255, d[i] / deck);
      d[i + 1] = Math.min(255, d[i + 1] / deck);
      d[i + 2] = Math.min(255, d[i + 2] / deck);
      d[i + 3] = Math.round(deck * 255);
    }
    const [cv, c] = ebene();
    c.putImageData(dunkel, 0, 0);
    return cv;
  } catch {
    return null;
  }
}

const knopf = (an: boolean) =>
  `min-h-10 rounded-md px-3 font-display text-[10px] tracking-[.16em] ring-1 transition ${
    an ? "bg-amber-glow text-ink-950 ring-amber-glow" : "bg-ink-800 text-mint-200 ring-white/12 hover:bg-ink-700 hover:text-mint-50"
  }`;
const verweis = "rounded bg-ink-800 px-2 py-1.5 text-mint-200 ring-1 ring-white/10 transition hover:bg-ink-700 hover:text-mint-50";

/** Vorschläge für den Tapetenwechsel im Musikzimmer (reine Vorschau). */
export default function RenovierungStudio() {
  const flaeche = useRef<HTMLCanvasElement | null>(null);
  const regler = useRef<HTMLInputElement | null>(null);
  const [wahl, setWahl] = useState<RenoId>("bahnen");
  const [laeuft, setLaeuft] = useState(
    () => typeof window === "undefined" || !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  const [schleife, setSchleife] = useState(true);
  const [moebel, setMoebel] = useState(true);
  const z = useRef({ p: 0, warte: VORLAUF, halt: 0, wahl: "bahnen" as RenoId, laeuft, schleife: true });

  useEffect(() => { z.current.laeuft = laeuft; }, [laeuft]);
  useEffect(() => { z.current.schleife = schleife; }, [schleife]);

  useEffect(() => {
    const cv = flaeche.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const vorn = moebelEbene();
    setMoebel(vorn !== null);
    const alt = wandBild((c) => alteWand(c, WAND.x0, WAND.x1, WAND.yTop, WAND.yBot, "#9a5750", "#7e433e", SOCKEL));
    const neu = wandBild((c) => weihnachtsTapete(c, WAND.x0, WAND.x1, WAND.yTop, WAND.yBot, "musik"));
    const malAlt = (c: C) => c.drawImage(alt, SICHT.x, SICHT.y, SICHT.w, SICHT.h);
    const malNeu = (c: C) => c.drawImage(neu, SICHT.x, SICHT.y, SICHT.w, SICHT.h);

    let rahmen = 0, zuletzt = performance.now(), zeit = 0;
    const bild = (jetzt: number) => {
      const dt = Math.min(0.05, (jetzt - zuletzt) / 1000);
      zuletzt = jetzt;
      zeit += dt;
      const s = z.current;
      if (s.laeuft) {
        if (s.warte > 0) s.warte -= dt;
        else if (s.p < 1) s.p = Math.min(1, s.p + dt / renoVorschlag(s.wahl).dauer);
        else {
          s.halt += dt;
          if (s.halt > 1.8) {
            s.halt = 0;
            if (s.schleife) {
              s.p = 0;
              s.warte = VORLAUF;
            } else {
              s.laeuft = false;
              setLaeuft(false);
            }
          }
        }
      }
      if (regler.current && document.activeElement !== regler.current) regler.current.value = String(Math.round(s.p * 1000));

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.max(1, Math.round(cv.clientWidth * dpr));
      const bh = Math.max(1, Math.round((bw * SICHT.h) / SICHT.w));
      if (cv.width !== bw || cv.height !== bh) {
        cv.width = bw;
        cv.height = bh;
      }
      const k = cv.width / SICHT.w;
      ctx.setTransform(k, 0, 0, k, -SICHT.x * k, -SICHT.y * k);
      ctx.imageSmoothingQuality = "high";
      const g = ctx.createLinearGradient(0, SICHT.y, 0, SICHT.y + SICHT.h);
      g.addColorStop(0, "#9cc4e4");
      g.addColorStop(1, "#e4eef2");
      ctx.fillStyle = g;
      ctx.fillRect(SICHT.x, SICHT.y, SICHT.w, SICHT.h);
      drawRenovierungWand(ctx, s.wahl, s.p, zeit, WAND, malAlt, malNeu);
      if (vorn) ctx.drawImage(vorn, SICHT.x, SICHT.y, SICHT.w, SICHT.h);
      drawRenovierungVorn(ctx, s.wahl, s.p, zeit, WAND, SICHT);
      rahmen = requestAnimationFrame(bild);
    };
    rahmen = requestAnimationFrame(bild);
    return () => cancelAnimationFrame(rahmen);
  }, []);

  const springe = (p: number, weiter: boolean) => {
    const s = z.current;
    s.p = p;
    s.warte = weiter && p <= 0 ? VORLAUF : 0;
    s.halt = 0;
    setLaeuft(weiter);
  };
  const waehle = (id: RenoId) => {
    z.current.wahl = id;
    setWahl(id);
    springe(0, true);
  };
  const umschalten = () => {
    if (!laeuft && z.current.p >= 1) springe(0, true);
    else setLaeuft(!laeuft);
  };

  const aktiv = renoVorschlag(wahl);

  return (
    <div className="bg-room grid-floor min-h-[100dvh] w-full p-3 sm:p-6">
      <main className="relative mx-auto w-full max-w-[1140px]">
        <header className="mb-4 sm:mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 font-display text-[10px] tracking-[.19em]">
            <span className="text-teal">LITTLE COMPUTER LUNI · RENOVIERUNG</span>
            <nav aria-label="Navigation" className="flex flex-wrap gap-2 text-[9px]">
              <a href="#" className={verweis}>← HAUS</a>
              <a href="#weihnachtshaus" className={verweis}>WEIHNACHTSHAUS</a>
              <a href="#adventshaus" className={verweis}>ADVENTSHAUS</a>
            </nav>
          </div>
          <h1 className="mt-5 font-display text-[24px] leading-none tracking-tight text-amber-glow sm:text-[40px]">TAPETENWECHSEL</h1>
          <p className="mt-2 max-w-[64ch] text-[13px] leading-relaxed text-mint-200">
            Musikzimmer: von der alten Wand zur Weihnachtstapete. Sechs Vorschläge – es ändert sich nur die Tapete, alles andere bleibt stehen.
          </p>
        </header>

        <div className="bezel rounded-[18px] p-1.5 max-sm:sticky max-sm:top-2 max-sm:z-10 sm:rounded-[22px] sm:p-3">
          <div className="screen-glass relative overflow-hidden rounded-[10px] bg-[#04121a] sm:rounded-[13px]" style={{ aspectRatio: "2 / 1" }}>
            <canvas
              ref={flaeche}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={`Musikzimmer, Vorschlag „${aktiv.titel}“: ${aktiv.kurz}`}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
          <button className={`${knopf(laeuft)} w-[104px]`} onClick={umschalten} aria-pressed={laeuft}>
            {laeuft ? "PAUSE" : "ABSPIELEN"}
          </button>
          <button className={knopf(false)} onClick={() => springe(0, false)}>ALT</button>
          <input
            ref={regler}
            type="range"
            min={0}
            max={1000}
            defaultValue={0}
            aria-label="Fortschritt des Tapetenwechsels"
            className="h-10 min-w-[120px] flex-1 cursor-pointer accent-[#ffb648]"
            onInput={(e) => springe(Number(e.currentTarget.value) / 1000, false)}
          />
          <button className={knopf(false)} onClick={() => springe(1, false)}>NEU</button>
          <button className={knopf(schleife)} onClick={() => setSchleife(!schleife)} aria-pressed={schleife}>SCHLEIFE</button>
        </div>

        <h2 className="mt-6 font-display text-[10px] tracking-[.22em] text-mint-400">VORSCHLÄGE</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-3">
          {RENO_VORSCHLAEGE.map((v, i) => {
            const an = v.id === wahl;
            return (
              <button
                key={v.id}
                onClick={() => waehle(v.id)}
                aria-pressed={an}
                className={`min-w-0 rounded-xl p-3 text-left ring-1 transition ${
                  an ? "bg-ink-700 ring-amber-glow" : "bg-ink-800/80 ring-white/10 hover:bg-ink-700/80 hover:ring-white/25"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={`font-display text-[10px] tracking-[.2em] ${an ? "text-amber-glow" : "text-mint-400"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {v.empfohlen && (
                    <span className="rounded bg-amber-glow px-1.5 py-0.5 font-display text-[8px] tracking-[.12em] text-ink-950">EMPFEHLUNG</span>
                  )}
                </span>
                <span className="mt-2 block text-[14px] font-semibold leading-tight text-mint-50 sm:text-[15px]">{v.titel}</span>
                <span className="mt-1 hidden text-[12px] leading-snug text-mint-200 sm:block">{v.kurz}</span>
                <span className="mt-2 flex items-center gap-1.5 font-display text-[8px] tracking-[.16em] text-mint-400">
                  AUFWAND
                  <span className="flex gap-1" role="img" aria-label={`${v.aufwand} von 3`}>
                    {[1, 2, 3].map((n) => (
                      <span key={n} className={`h-1.5 w-3 rounded-sm ${n <= v.aufwand ? "bg-teal" : "bg-white/12"}`} />
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <section aria-live="polite" className="mt-3 rounded-xl bg-ink-800/80 p-4 ring-1 ring-white/10 sm:p-5">
          <h2 className="text-[17px] font-semibold text-amber-glow">{aktiv.titel}</h2>
          <p className="mt-1 max-w-[70ch] text-[13px] leading-relaxed text-mint-50">{aktiv.kurz} {aktiv.text}</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-display text-[9px] tracking-[.2em] text-mint-400">IN ECHTER ZEIT</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-mint-200">{aktiv.echtzeit}</dd>
            </div>
            <div>
              <dt className="font-display text-[9px] tracking-[.2em] text-mint-400">AUF DER WII</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-mint-200">{aktiv.wii}</dd>
            </div>
          </dl>
        </section>

        <p className="mt-3 text-[12px] leading-relaxed text-mint-400">
          {moebel
            ? "Die Vorschau zeigt die fest stehenden Dinge aus der Hauszeichnung: Klavier, Hocker, Saxofonständer, Plattenregal, Gitarre und Lampe. Luni, Saxofon, Plattenspieler, Lautsprecher und Mikrofon kommen erst im Spiel dazu."
            : "Die Möbel ließen sich hier nicht aus der Hauszeichnung lösen – zu sehen ist nur die Wand. Die Übergänge selbst stimmen."}
        </p>
      </main>
    </div>
  );
}
