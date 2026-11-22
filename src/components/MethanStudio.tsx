import { useState } from "react";
import { MethanStage } from "@/components/MethanStage";
import { METHAN_FARBEN, METHAN_INFO, type MethanExpr, type MethanPose } from "@/game/lieferfrosch";

const GROUPS: { title: string; items: { k: MethanPose; label: string }[] }[] = [
  {
    title: "UNTERWEGS",
    items: [
      { k: "stand", label: "Stehen" },
      { k: "walk", label: "Gehen" },
      { k: "walkCarry", label: "Gehen mit Paket" },
      { k: "run", label: "Rennen" },
    ],
  },
  {
    title: "AN DER TÜR",
    items: [
      { k: "knock", label: "Anklopfen" },
      { k: "wave", label: "Winken" },
      { k: "salute", label: "Mütze tippen" },
    ],
  },
  {
    title: "PAKET",
    items: [
      { k: "carry", label: "Tragen" },
      { k: "handover", label: "Überreichen" },
      { k: "consult", label: "Liste prüfen" },
    ],
  },
  {
    title: "PAUSE",
    items: [{ k: "sit", label: "Sitzen" }],
  },
];

const EXPRS: { k: MethanExpr; label: string }[] = [
  { k: "friendly", label: "Freundlich" },
  { k: "neutral", label: "Neutral" },
  { k: "grin", label: "Grinsen" },
  { k: "surprised", label: "Überrascht" },
  { k: "tired", label: "Müde" },
];

const PALETTE: { label: string; value: string }[] = [
  { label: "Haut", value: METHAN_FARBEN.haut },
  { label: "Haut hell", value: METHAN_FARBEN.hautHell },
  { label: "Haut dunkel", value: METHAN_FARBEN.hautDunkel },
  { label: "Bauch", value: METHAN_FARBEN.bauch },
  { label: "Uniform", value: METHAN_FARBEN.uniform },
  { label: "Uniform dunkel", value: METHAN_FARBEN.uniformDunkel },
  { label: "Knopf", value: METHAN_FARBEN.knopf },
  { label: "Tasche", value: METHAN_FARBEN.tasche },
  { label: "Paket", value: METHAN_FARBEN.paket },
  { label: "Schuh", value: METHAN_FARBEN.schuh },
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

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-[#0a1c23]/80 p-3 ring-1 ring-white/10 sm:p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[10px] tracking-[0.26em] text-teal sm:text-[11px]">{title}</h2>
        {hint && <span className="text-[10px] text-mint-400/70">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** Ausführliche Charakter-Ansicht des Methan Frogs im Luni-Studio. */
export default function MethanStudio() {
  const [pose, setPose] = useState<MethanPose>("stand");
  const [expr, setExpr] = useState<MethanExpr>("friendly");
  const [face, setFace] = useState<1 | -1>(1);
  const [zoom, setZoom] = useState(4.6);
  const [grid, setGrid] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frontPaket, setFrontPaket] = useState(true);

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
                ← LUNI-STUDIO
              </a>
              <a
                href="#editor"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                EDITOR →
              </a>
              <a
                href="#"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← ZUM HAUS
              </a>
            </div>
            <h1 className="mt-1 font-display text-[22px] leading-none text-mint-50 text-shadow-hard sm:text-[34px]">
              METHAN <span className="text-amber-glow">FROG COMPANY · LIEFERSERVICE</span>
            </h1>
            <p className="mt-1.5 max-w-[66ch] text-[12px] leading-relaxed text-mint-200/80 sm:text-[13px]">
              Methan Frog, humanoides Frosch-Maskottchen in Dienstuniform, im Stil der ursprünglichen LCP-1-Figur: weiche Flächen, keine
              harten Outlines. Breiter Froschkopf mit Kulleraugen, blaue Latzhose mit gelben Knöpfen, Mütze mit
              Schirm, Namensschild, Umhängetasche und Paket. Er bringt später die Post ins Haus; die Geh-Animation ist von Luni übernommen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={face === 1} onClick={() => setFace(1)}>
              Blick rechts
            </Chip>
            <Chip active={face === -1} onClick={() => setFace(-1)}>
              Blick links
            </Chip>
            <Chip active={grid} onClick={() => setGrid((v) => !v)}>
              Raster {grid ? "an" : "aus"}
            </Chip>
            <Chip active={paused} onClick={() => setPaused((v) => !v)}>
              {paused ? "Weiter" : "Standbild"}
            </Chip>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl bg-[#08151a] p-1.5 ring-1 ring-teal/20 sm:p-2">
            <div className="screen-glass relative h-[380px] overflow-hidden rounded-xl sm:h-[480px]">
              <MethanStage pose={pose} expr={expr} face={face} zoom={zoom} grid={grid} paused={paused} speed={speed} />
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="font-display text-[9px] tracking-[0.26em] text-teal">FRONTAL · AUF DIE TÜR ZU</span>
                  <span className="flex gap-1">
                    <Chip active={frontPaket} onClick={() => setFrontPaket(true)}>
                      Mit Paket
                    </Chip>
                    <Chip active={!frontPaket} onClick={() => setFrontPaket(false)}>
                      Ohne Paket
                    </Chip>
                  </span>
                </div>
                <div className="screen-glass relative h-[240px] overflow-hidden rounded-xl">
                  <MethanStage pose={frontPaket ? "walkCarry" : "walk"} expr={expr} face={1} zoom={4.4} grid={false} paused={paused} speed={speed} rueck={false} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="font-display text-[9px] tracking-[0.26em] text-teal">RÜCKSEITE · VON DER TÜR WEG</span>
                  <span className="text-[10px] text-mint-400/70">ohne Paket</span>
                </div>
                <div className="screen-glass relative h-[240px] overflow-hidden rounded-xl">
                  <MethanStage pose="walk" expr={expr} face={1} zoom={4.4} grid={false} paused={paused} speed={speed} rueck={true} />
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <Info label="Name" wert={METHAN_INFO.name} />
              <Info label="Firma" wert={METHAN_INFO.firma} />
              <Info label="Dienst" wert={METHAN_INFO.dienst} />
              <Info label="Größe" wert="69 Einheiten" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Panel title="POSEN" hint={`${GROUPS.flatMap((g) => g.items).length} Posen`}>
              {GROUPS.map((g) => (
                <div key={g.title} className="mb-2 last:mb-0">
                  <div className="mb-1 font-display text-[9px] tracking-[0.26em] text-mint-400/70">{g.title}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((it) => (
                      <Chip key={it.k} active={pose === it.k} onClick={() => setPose(it.k)}>
                        {it.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </Panel>

            <Panel title="AUSDRUCK" hint="Gesicht">
              <div className="flex flex-wrap gap-1.5">
                {EXPRS.map((e) => (
                  <Chip key={e.k} active={expr === e.k} onClick={() => setExpr(e.k)}>
                    {e.label}
                  </Chip>
                ))}
              </div>
            </Panel>

            <Panel title="ANZEIGE" hint="Werkzeug">
              <label className="flex items-center gap-2 text-[11px] text-mint-200/80">
                Zoom
                <input
                  type="range"
                  min={2}
                  max={9}
                  step={0.2}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-28"
                />
                <span className="w-9 text-right tabular-nums">{zoom.toFixed(1)}×</span>
              </label>
              <label className="mt-1.5 flex items-center gap-2 text-[11px] text-mint-200/80">
                Tempo
                <input
                  type="range"
                  min={0.25}
                  max={2}
                  step={0.25}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-28"
                />
                <span className="w-9 text-right tabular-nums">{speed}×</span>
              </label>
            </Panel>

            <Panel title="PALETTE" hint="Klick kopiert">
              <div className="grid grid-cols-5 gap-1.5">
                {PALETTE.map((p) => (
                  <button
                    key={p.label}
                    title={p.value}
                    onClick={() => navigator.clipboard?.writeText(p.value).catch(() => undefined)}
                    className="group flex flex-col items-center gap-1 rounded-md p-1 ring-1 ring-white/10 transition hover:bg-ink-700"
                  >
                    <span className="h-6 w-full rounded" style={{ background: p.value }} />
                    <span className="w-full truncate text-center text-[9px] text-mint-200/80 group-hover:text-mint-50">{p.label}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="STECKBRIEF">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                <dt className="text-mint-400/80">Name</dt>
                <dd className="text-mint-50">{METHAN_INFO.name}</dd>
                <dt className="text-mint-400/80">Firma</dt>
                <dd className="text-mint-50">{METHAN_INFO.firma}</dd>
                <dt className="text-mint-400/80">Dienst</dt>
                <dd className="text-mint-50">{METHAN_INFO.dienst}</dd>
                <dt className="text-mint-400/80">Größe</dt>
                <dd className="text-mint-50">{METHAN_INFO.groesse}</dd>
                <dt className="text-mint-400/80">Uniform</dt>
                <dd className="text-mint-50">{METHAN_INFO.uniform}</dd>
                <dt className="text-mint-400/80">Besonderheiten</dt>
                <dd className="text-mint-50">{METHAN_INFO.besonderheiten}</dd>
              </dl>
            </Panel>
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
