import { useState } from "react";
import { LuniStage } from "@/components/LuniStage";
import { ExprSheet, PoseSheet, WalkStrip, ScaleCheck } from "@/components/LuniSheet";
import { LUNI_COLORS, type LuniExpr, type LuniState } from "@/game/luni";
import { Compare, OrigPoseSheet } from "@/components/Compare";
import { ORIG_COLORS, type OrigState } from "@/game/original";

const GROUPS: { title: string; items: { k: LuniState; label: string }[] }[] = [
  {
    title: "ALLTAG",
    items: [
      { k: "idle", label: "Stehen" },
      { k: "walk", label: "Gehen" },
      { k: "run", label: "Rennen" },
      { k: "turn", label: "Umdrehen" },
      { k: "act", label: "Greifen" },
      { k: "think", label: "Überlegen" },
      { k: "wave", label: "Winken" },
      { k: "stretch", label: "Strecken" },
      { k: "cheer", label: "Freuen" },
      { k: "sit", label: "Sitzen" },
      { k: "doze", label: "Eindösen" },
      { k: "lie", label: "Liegen" },
    ],
  },
  {
    title: "TANZEN",
    items: [
      { k: "danceSway", label: "Wiegen" },
      { k: "danceTwist", label: "Twist" },
      { k: "danceHop", label: "Hüpfen" },
      { k: "danceSpin", label: "Drehen" },
    ],
  },
  {
    title: "TURNEN",
    items: [
      { k: "handstand", label: "Handstand" },
      { k: "cartwheel", label: "Rad" },
      { k: "flip", label: "Salto" },
      { k: "split", label: "Spagat" },
    ],
  },
];

const ALL_POSES = GROUPS.flatMap((g) => g.items);

const EXPRS: { k: LuniExpr; label: string }[] = [
  { k: "happy", label: "Fröhlich" },
  { k: "neutral", label: "Neutral" },
  { k: "grin", label: "Grinsen" },
  { k: "wink", label: "Zwinkern" },
  { k: "love", label: "Verliebt" },
  { k: "think", label: "Nachdenklich" },
  { k: "focus", label: "Konzentriert" },
  { k: "tired", label: "Müde" },
  { k: "sleep", label: "Schlafen" },
  { k: "surprised", label: "Überrascht" },
  { k: "sad", label: "Traurig" },
  { k: "annoyed", label: "Genervt" },
];

const ORIG_POSES: { k: OrigState; label: string }[] = [
  { k: "idle", label: "Stehen" },
  { k: "walk", label: "Gehen" },
  { k: "air", label: "Sprung" },
  { k: "act", label: "Greifen" },
  { k: "cheer", label: "Freuen" },
  { k: "sit", label: "Sitzen" },
  { k: "lie", label: "Im Bett" },
  { k: "down", label: "Umgefallen" },
];

const ORIG_PALETTE: { label: string; value: string }[] = [
  { label: "Haut", value: ORIG_COLORS.skin },
  { label: "Haare", value: ORIG_COLORS.hair },
  { label: "Shirt", value: ORIG_COLORS.shirt },
  { label: "Shirt dunkel", value: ORIG_COLORS.shirtDark },
  { label: "Hose", value: ORIG_COLORS.pants },
  { label: "Schuhe", value: ORIG_COLORS.shoe },
];

const PALETTE: { label: string; value: string }[] = [
  { label: "Haut", value: LUNI_COLORS.skin },
  { label: "Haare", value: LUNI_COLORS.hair },
  { label: "Strickjacke", value: LUNI_COLORS.cardigan },
  { label: "Jacke dunkel", value: LUNI_COLORS.cardiganDark },
  { label: "T-Shirt", value: LUNI_COLORS.tee },
  { label: "Leggings", value: LUNI_COLORS.leggings },
  { label: "Socke links", value: LUNI_COLORS.sockL[0] },
  { label: "Socke rechts", value: LUNI_COLORS.sockR[0] },
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

export default function StudioApp() {
  const [state, setState] = useState<LuniState>("idle");
  const [expr, setExpr] = useState<LuniExpr>("happy");
  const [face, setFace] = useState<1 | -1>(1);
  const [zoom, setZoom] = useState(4.4);
  const [grid, setGrid] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<"luni" | "original" | "compare">("compare");
  const [origState, setOrigState] = useState<OrigState>("idle");

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
                href="#"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← ZUM HAUS
              </a>
            </div>
            <h1 className="mt-1 font-display text-[22px] leading-none text-mint-50 text-shadow-hard sm:text-[34px]">
              LUNI <span className="text-amber-glow">CHARAKTER-STUDIO</span>
            </h1>
            <p className="mt-1.5 max-w-[66ch] text-[12px] leading-relaxed text-mint-200/80 sm:text-[13px]">
              Im Stil der ursprünglichen LCP-1-Figur: schlanke Gliedmaßen, kleiner runder Kopf, weiche
              Flächen, keine harten Outlines. Lange glatte schwarze Haare, offene braun-beige Strickjacke
              mit Knopfleiste, weißes T-Shirt, schwarze Leggings, bunte Socken, schwarze Nerd-Brille.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex gap-1 rounded-lg bg-[#08151a]/70 p-1 ring-1 ring-white/10">
              <Chip active={view === "original"} onClick={() => setView("original")}>
                Ursprungsfigur
              </Chip>
              <Chip active={view === "compare"} onClick={() => setView("compare")}>
                Vergleich
              </Chip>
              <Chip active={view === "luni"} onClick={() => setView("luni")}>
                Luni
              </Chip>
            </div>
            <Chip active={grid} onClick={() => setGrid((v) => !v)}>
              Raster {grid ? "an" : "aus"}
            </Chip>
            <Chip active={paused} onClick={() => setPaused((v) => !v)}>
              {paused ? "Weiter" : "Standbild"}
            </Chip>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          {/* Bühne */}
          <div className="rounded-2xl bg-[#08151a] p-1.5 ring-1 ring-teal/20 sm:p-2">
            <div className="screen-glass relative h-[380px] overflow-hidden rounded-xl sm:h-[480px]">
              {view === "compare" ? (
                <Compare zoom={Math.min(zoom, 5)} paused={paused} />
              ) : (
                <LuniStage
                  state={view === "original" ? "walk" : state}
                  expr={expr}
                  face={face}
                  zoom={zoom}
                  grid={grid}
                  paused={paused}
                  speed={speed}
                  variant={view === "original" ? "original" : "luni"}
                  origState={origState}
                />
              )}
              <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 font-display text-[9px] tracking-[0.18em] text-mint-200">
                {view === "compare"
                  ? "GEGENÜBERSTELLUNG · beide gehen"
                  : view === "original"
                    ? `URSPRUNG · ${ORIG_POSES.find((s) => s.k === origState)?.label}`
                    : `${ALL_POSES.find((s) => s.k === state)?.label} · ${EXPRS.find((e) => e.k === expr)?.label}`}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 px-1 pb-1">
              <Chip active={false} onClick={() => setFace((f) => (f === 1 ? -1 : 1))}>
                ↔ Blick {face === 1 ? "rechts" : "links"}
              </Chip>
              <label className="flex min-w-[170px] flex-1 items-center gap-2 text-[11px] text-mint-400">
                Zoom
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-ink-700 accent-teal"
                />
                <span className="w-9 text-right tabular-nums text-mint-200">{zoom.toFixed(1)}×</span>
              </label>
              <label className="flex min-w-[150px] items-center gap-2 text-[11px] text-mint-400">
                Tempo
                <input
                  type="range"
                  min={0.15}
                  max={1.6}
                  step={0.05}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-ink-700 accent-amber-glow"
                />
                <span className="w-9 text-right tabular-nums text-mint-200">{speed.toFixed(2)}×</span>
              </label>
              <Chip active={false} onClick={() => setZoom(1)}>
                Spielgröße
              </Chip>
            </div>
          </div>

          {/* Steuerung */}
          <div className="space-y-3">
            {view === "original" ? (
              <>
                <Panel title="HALTUNGEN" hint="alles, was die Ursprungsfigur konnte">
                  <div className="flex flex-wrap gap-1.5">
                    {ORIG_POSES.map((s) => (
                      <Chip key={s.k} active={origState === s.k} onClick={() => setOrigState(s.k)}>
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </Panel>

                <Panel title="FARBEN · URSPRUNG">
                  <div className="grid grid-cols-3 gap-2">
                    {ORIG_PALETTE.map((c) => (
                      <div key={c.label} className="text-center">
                        <div
                          className="mx-auto h-8 w-full rounded-md ring-1 ring-white/15"
                          style={{ background: c.value }}
                        />
                        <div className="mt-1 truncate text-[9px] text-mint-400">{c.label}</div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="MERKMALE">
                  <ul className="space-y-1 text-[11px] leading-relaxed text-mint-200/80">
                    <li>· Kopf als einfacher Kreis, Radius 9,4</li>
                    <li>· kurze braune Haare als Halbkreis + Koteletten-Rechteck</li>
                    <li>· oranges Shirt = ein abgerundetes Rechteck</li>
                    <li>· Arme und Beine sind Striche mit runden Kappen</li>
                    <li>· Augen = zwei Punkte, Mund = ein Bogen</li>
                    <li>· keine Brille, keine Jacke, kein Gesichtsdetail</li>
                  </ul>
                </Panel>

                <Panel title="WAS LUNI ERBT">
                  <ul className="space-y-1 text-[11px] leading-relaxed text-mint-200/80">
                    <li>· gleiche Höhe (56) und gleicher Kopfradius</li>
                    <li>· gleiche Schulter- und Hüftlinie</li>
                    <li>· Strichgliedmaßen statt Outline-Flächen</li>
                    <li>· gleiche Haut-, Augen- und Mundfarbe</li>
                  </ul>
                </Panel>
              </>
            ) : (
              <>
                {GROUPS.map((g) => (
                  <Panel key={g.title} title={g.title}>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((s) => (
                        <Chip key={s.k} active={state === s.k} onClick={() => setState(s.k)}>
                          {s.label}
                        </Chip>
                      ))}
                    </div>
                  </Panel>
                ))}

                <Panel title="MIMIK" hint="nonverbale Kommunikation">
                  <div className="flex flex-wrap gap-1.5">
                    {EXPRS.map((e) => (
                      <Chip key={e.k} active={expr === e.k} onClick={() => setExpr(e.k)}>
                        {e.label}
                      </Chip>
                    ))}
                  </div>
                </Panel>

                <Panel title="FARBEN">
                  <div className="grid grid-cols-4 gap-2">
                    {PALETTE.map((c) => (
                      <div key={c.label} className="text-center">
                        <div
                          className="mx-auto h-8 w-full rounded-md ring-1 ring-white/15"
                          style={{ background: c.value }}
                        />
                        <div className="mt-1 truncate text-[9px] text-mint-400">{c.label}</div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="BAUMASSE">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    {[
                      ["Gesamthöhe", "56 Einheiten"],
                      ["Spielmaßstab", "1.0 → 56 px"],
                      ["Kopfradius", "9.2"],
                      ["Schulterlinie", "y = −36"],
                      ["Hüftlinie", "y = −19"],
                      ["Haarlänge", "30 ab Kopfmitte"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-white/5 py-0.5">
                        <dt className="text-mint-400">{k}</dt>
                        <dd className="text-mint-50 tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Panel>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          {view !== "luni" && (
            <Panel title="URSPRUNGSFIGUR · ALLE HALTUNGEN" hint="8 Zustände aus dem ersten Spiel">
              <OrigPoseSheet items={ORIG_POSES} />
            </Panel>
          )}

          <Panel title="LUNI · ALLE HALTUNGEN" hint="20 Animationen live">
            <PoseSheet items={ALL_POSES} />
          </Panel>

          <Panel title="LUNI · MIMIK-KONTAKTBOGEN" hint="12 Gesichter">
            <ExprSheet items={EXPRS} />
          </Panel>

          <Panel title="LAUFZYKLUS" hint="8 Phasen · aktive hervorgehoben">
            <WalkStrip />
          </Panel>

          <Panel title="GRÖSSENPROBE IM RAUM" hint="Maßstab 1.0 · Tür, Sofa, Tisch, Hund">
            <div className="overflow-hidden rounded-lg">
              <ScaleCheck />
            </div>
          </Panel>
        </div>

        <p className="mt-3 pb-2 text-center text-[11px] text-mint-400/60">
          Nach deiner Freigabe: Feinschliff an Haaren/Outfit, dann Odin &amp; Apollo im selben Stil.
        </p>
      </div>
    </div>
  );
}
