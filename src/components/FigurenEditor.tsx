import { useState } from "react";
import { EditorStage } from "@/components/EditorStage";
import {
  EDITOR_GLENKE,
  EDITOR_GLENK_LABEL,
  editorAlsCode,
  ladeEditorStand,
  uebernehmen,
  zuruecksetzen,
  type EditorDelta,
  type EditorFigur,
  type EditorGelenk,
  type EditorStand,
} from "@/game/editor";
import { METHAN_INFO } from "@/game/lieferfrosch";
import type { LuniExpr } from "@/game/luni";

const LUNI_POSEN: { k: string; label: string }[] = [
  { k: "idle", label: "Stehen" },
  { k: "walk", label: "Gehen" },
  { k: "act", label: "Greifen" },
  { k: "wave", label: "Winken" },
  { k: "sit", label: "Sitzen" },
  { k: "danceSway", label: "Wiegen" },
  { k: "danceDisco", label: "Disco" },
];

const FROSCH_POSEN: { k: string; label: string }[] = [
  { k: "stand", label: "Stehen" },
  { k: "walk", label: "Gehen" },
  { k: "walkCarry", label: "Gehen mit Paket" },
  { k: "wave", label: "Winken" },
  { k: "carry", label: "Paket tragen" },
  { k: "handover", label: "Überreichen" },
  { k: "knock", label: "Anklopfen" },
  { k: "salute", label: "Mütze tippen" },
  { k: "consult", label: "Liste prüfen" },
  { k: "sit", label: "Sitzen" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-press rounded-md px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition ${
        active
          ? "bg-teal text-[#04211d] shadow-[0_0_14px_-4px_rgba(53,214,192,.8)]"
          : "bg-[#132a33] text-mint-200 ring-1 ring-white/10 hover:bg-ink-700 hover:text-mint-50"
      }`}
    >
      {children}
    </button>
  );
}

/** Figuren-Editor: Gelenke ziehen, „Position übernehmen“, Code-Vorschau. */
export function FigurenEditor() {
  const [stand, setStand] = useState<EditorStand>(() => ladeEditorStand());
  const [figur, setFigur] = useState<EditorFigur>("frosch");
  const [pose, setPose] = useState("stand");
  const [expr, setExpr] = useState<LuniExpr>("happy");
  const [gelenk, setGelenk] = useState<EditorGelenk | null>("handNear");
  const [zoom, setZoom] = useState(5.2);
  const [grid, setGrid] = useState(true);
  const [paused, setPaused] = useState(true);
  const [speed] = useState(1);
  const [delta, setDelta] = useState<EditorDelta>({});
  const [kopiert, setKopiert] = useState(false);

  const posen = figur === "frosch" ? FROSCH_POSEN : LUNI_POSEN;
  const uebernommen = stand[figur][pose] ?? {};

  const waehleFigur = (f: EditorFigur) => {
    setFigur(f);
    setPose(f === "frosch" ? "stand" : "idle");
    setDelta({});
    setGelenk("handNear");
  };
  const waehlePose = (k: string) => {
    setPose(k);
    setDelta(stand[figur][k] ?? {});
  };

  const uebernehmenKlick = () => {
    setStand((s) => uebernehmen(s, figur, pose, delta));
  };
  const zurueckKlick = () => {
    setStand((s) => zuruecksetzen(s, figur, pose));
    setDelta({});
  };
  const codeKopieren = async () => {
    const code = editorAlsCode(stand, figur);
    try {
      await navigator.clipboard.writeText(code);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 1600);
    } catch {
      /* Zwischenablage nicht verfügbar – Code steht in der Vorschau. */
    }
  };

  const geaendert = Object.values(delta).some((v) => v && (Math.abs(v[0]) > 0.01 || Math.abs(v[1]) > 0.01));

  return (
    <div className="bg-room grid-floor min-h-[100dvh] w-full overflow-x-hidden p-3 sm:p-5">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[8px] tracking-[0.3em] text-teal sm:text-[10px]">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral" />
                LITTLE COMPUTER LUNI · FIGURENENTWURF
              </span>
              <a
                href="#studio"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← ZUM STUDIO
              </a>
              <a
                href="#"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← ZUM HAUS
              </a>
            </div>
            <h1 className="mt-1 font-display text-[22px] leading-none text-mint-50 text-shadow-hard sm:text-[34px]">
              EDITOR <span className="text-amber-glow">FROG COMPANY · METHAN</span>
            </h1>
            <p className="mt-1.5 max-w-[66ch] text-[12px] leading-relaxed text-mint-200/80 sm:text-[13px]">
              Gelenke mit der Maus ziehen (oder Pfeiltasten, Feinschritt mit Umschalt), Gelenk durchschalten mit Tab
              oder Liste, dann <b>„Position übernehmen“</b>. Die übernommene Position gilt für diese Pose dauerhaft
              und wird im Spiel verwendet.
            </p>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          {/* Bühne */}
          <div className="rounded-2xl bg-[#08151a] p-1.5 ring-1 ring-teal/20 sm:p-2">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <div className="flex gap-1 rounded-lg bg-[#08151a]/70 p-1 ring-1 ring-white/10">
                <Chip active={figur === "frosch"} onClick={() => waehleFigur("frosch")}>
                  Methan Frog
                </Chip>
                <Chip active={figur === "luni"} onClick={() => waehleFigur("luni")}>
                  Luni
                </Chip>
              </div>
              <Chip active={grid} onClick={() => setGrid((v) => !v)}>
                Raster {grid ? "an" : "aus"}
              </Chip>
              <Chip active={paused} onClick={() => setPaused((v) => !v)}>
                {paused ? "Standbild" : "Animation"}
              </Chip>
              <label className="ml-1 flex items-center gap-1 text-[11px] text-mint-200/80">
                Zoom
                <input
                  type="range"
                  min={2}
                  max={9}
                  step={0.2}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-24"
                />
                <span className="w-8 text-right tabular-nums">{zoom.toFixed(1)}×</span>
              </label>
            </div>
            <div className="screen-glass relative h-[420px] overflow-hidden rounded-xl sm:h-[500px]">
              <EditorStage
                figur={figur}
                pose={pose}
                expr={expr}
                zoom={zoom}
                grid={grid}
                paused={paused}
                speed={speed}
                uebernommen={uebernommen}
                delta={delta}
                onDelta={setDelta}
                gelenk={gelenk}
                onGelenk={setGelenk}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {figur === "frosch" ? (
                <>
                  <Info label="Name" wert={METHAN_INFO.name} />
                  <Info label="Dienst" wert={METHAN_INFO.dienst} />
                  <Info label="Größe" wert={METHAN_INFO.groesse} />
                  <Info label="Uniform" wert="Frontal · Latzhose · Mütze" />
                </>
              ) : (
                <>
                  <Info label="Figur" wert="Luni" />
                  <Info label="Rolle" wert="Bewohnerin" />
                  <Info label="Größe" wert="56 Einheiten" />
                  <Info label="Outfit" wert="Strickjacke · T-Shirt · Leggings" />
                </>
              )}
            </div>
          </div>

          {/* Panel */}
          <div className="flex flex-col gap-3">
            <section className="rounded-xl bg-[#0a1c23]/80 p-3 ring-1 ring-white/10 sm:p-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[10px] tracking-[0.26em] text-teal sm:text-[11px]">POSE</h2>
                <span className="text-[10px] text-mint-400/70">{posen.length} Posen</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {posen.map((p) => (
                  <Chip key={p.k} active={pose === p.k} onClick={() => waehlePose(p.k)}>
                    {p.label}
                  </Chip>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-[#0a1c23]/80 p-3 ring-1 ring-white/10 sm:p-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[10px] tracking-[0.26em] text-teal sm:text-[11px]">GLENK</h2>
                <span className="text-[10px] text-mint-400/70">Tab / Klick / Pfeiltasten</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {EDITOR_GLENKE.map((g) => {
                  const d = delta[g];
                  const u = uebernommen[g];
                  const aktiv = gelenk === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setGelenk(g)}
                      className={`btn-press rounded-md px-2 py-1.5 text-left text-[11px] transition ${
                        aktiv
                          ? "bg-teal text-[#04211d] shadow-[0_0_14px_-4px_rgba(53,214,192,.8)]"
                          : "bg-[#132a33] text-mint-200 ring-1 ring-white/10 hover:bg-ink-700 hover:text-mint-50"
                      }`}
                    >
                      <div className="truncate font-medium tracking-wide">{EDITOR_GLENK_LABEL[g]}</div>
                      <div className="mt-0.5 flex gap-2 text-[10px] tabular-nums opacity-80">
                        <span>
                          {d ? `${d[0] >= 0 ? "+" : ""}${d[0]} / ${d[1] >= 0 ? "+" : ""}${d[1]}` : "0 / 0"}
                        </span>
                        {u && <span className="text-amber-glow">✓ {u[0] >= 0 ? "+" : ""}{u[0]} / {u[1] >= 0 ? "+" : ""}{u[1]}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  onClick={uebernehmenKlick}
                  disabled={!geaendert}
                  className="btn-press rounded-lg bg-amber-glow px-4 py-2 text-[12px] font-semibold tracking-wide text-[#2a1a05] shadow-[0_0_18px_-6px_rgba(255,182,72,.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ✔ Position übernehmen
                </button>
                <button
                  onClick={zurueckKlick}
                  className="btn-press rounded-lg bg-[#132a33] px-3 py-2 text-[12px] font-medium tracking-wide text-mint-200 ring-1 ring-white/10 transition hover:bg-ink-700 hover:text-mint-50"
                >
                  Zurücksetzen
                </button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-mint-400/80">
                {geaendert
                  ? "Noch nicht übernommen – die Geisterfigur zeigt die zuletzt übernommene Position."
                  : Object.keys(uebernommen).length
                    ? "Übernommene Position aktiv für diese Pose."
                    : "Noch keine Position übernommen – ziehe einen Punkt."}
              </p>
            </section>

            <section className="rounded-xl bg-[#0a1c23]/80 p-3 ring-1 ring-white/10 sm:p-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[10px] tracking-[0.26em] text-teal sm:text-[11px]">AUSDRUCK</h2>
                <span className="text-[10px] text-mint-400/70">Gesicht</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["happy", "neutral", "grin", "surprised", "tired"] as LuniExpr[]).map((e) => (
                  <Chip key={e} active={expr === e} onClick={() => setExpr(e)}>
                    {e === "happy" ? "Fröhlich" : e === "neutral" ? "Neutral" : e === "grin" ? "Grinsen" : e === "surprised" ? "Überrascht" : "Müde"}
                  </Chip>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-[#0a1c23]/80 p-3 ring-1 ring-white/10 sm:p-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-[10px] tracking-[0.26em] text-teal sm:text-[11px]">CODE</h2>
                <button
                  onClick={codeKopieren}
                  className="btn-press rounded bg-[#132a33] px-2 py-1 text-[10px] tracking-[0.15em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
                >
                  {kopiert ? "Kopiert ✓" : "Kopieren"}
                </button>
              </div>
              <pre className="max-h-40 overflow-auto rounded-lg bg-[#050d11] p-2 text-[10px] leading-relaxed text-mint-200/90">
                {editorAlsCode(stand, figur)}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="rounded-lg bg-[#0a1c23]/80 px-2.5 py-1.5 ring-1 ring-white/10">
      <div className="font-display text-[8px] tracking-[0.26em] text-teal">{label}</div>
      <div className="truncate text-[11px] text-mint-50">{wert}</div>
    </div>
  );
}
