import { useState } from "react";
import { HundStage, FeinHundStage, HundVergleichStage } from "@/components/HundStage";
import { HundPoseSheet, HundPalette, HundKopfSheet } from "@/components/HundSheet";
import {
  APOLLO_FARBEN,
  HUNDE_INFO,
  LEDER_FARBEN,
  ODIN_FARBEN,
  type HundId,
  type HundPose,
} from "@/game/hunde";

const GROUPS: { title: string; items: { k: HundPose; label: string }[] }[] = [
  {
    title: "BEWEGUNG",
    items: [
      { k: "stand", label: "Stehen" },
      { k: "walk", label: "Gehen" },
      { k: "trot", label: "Traben" },
      { k: "sniff", label: "Schnüffeln" },
    ],
  },
  {
    title: "RUHE",
    items: [
      { k: "sit", label: "Sitzen" },
      { k: "lie", label: "Liegen" },
      { k: "sleep", label: "Schlafen" },
      { k: "stretch", label: "Strecken" },
    ],
  },
  {
    title: "FREUDE",
    items: [
      { k: "wag", label: "Wedeln" },
      { k: "petted", label: "Streicheln" },
      { k: "bark", label: "Bellen" },
    ],
  },
];

const ALL_POSES = GROUPS.flatMap((g) => g.items);

const ODIN_PALETTE: { label: string; value: string }[] = [
  { label: "Fell schwarz", value: ODIN_FARBEN.fell },
  { label: "Fell Schimmer", value: ODIN_FARBEN.fellHell },
  { label: "Fell Tiefenlicht", value: ODIN_FARBEN.fellSchatten },
  { label: "Brusttönen", value: ODIN_FARBEN.brust },
  { label: "Ohr", value: ODIN_FARBEN.ohr },
  { label: "Nase", value: ODIN_FARBEN.nase },
  { label: "Halsband Leder", value: LEDER_FARBEN.halsband },
  { label: "Marke Messing", value: LEDER_FARBEN.marke },
];

const APOLLO_PALETTE: { label: string; value: string }[] = [
  { label: "Fell schwarz", value: APOLLO_FARBEN.fell },
  { label: "Fell Schimmer", value: APOLLO_FARBEN.fellHell },
  { label: "Fell Tiefenlicht", value: APOLLO_FARBEN.fellSchatten },
  { label: "Brustkragen weiß", value: APOLLO_FARBEN.brust },
  { label: "Blesse weiß", value: APOLLO_FARBEN.weiss },
  { label: "Blesse Schatten", value: APOLLO_FARBEN.weissSchatten },
  { label: "Maske", value: APOLLO_FARBEN.maske },
  { label: "Ohr", value: APOLLO_FARBEN.ohr },
  { label: "Halsband Leder", value: LEDER_FARBEN.halsband },
  { label: "Marke Messing", value: LEDER_FARBEN.marke },
  { label: "Pfoten Stromung", value: APOLLO_FARBEN.pfoteStrom },
];

const BAUMASSE: Record<HundId, [string, string][]> = {
  odin: [
    ["Schulterhöhe", "29.4 Einheiten"],
    ["Spielmaßstab", "1.0 → 56 px (Hund 1.02)"],
    ["Kopfbreite", "schlank, 9.2"],
    ["Fang", "lang, schmal, zulaufend"],
    ["Brusttiefe", "9.0"],
    ["Rutenlänge", "11.2"],
  ],
  apollo: [
    ["Schulterhöhe", "29.6 Einheiten"],
    ["Spielmaßstab", "1.0 → 56 px (Hund 1.02)"],
    ["Kopfbreite", "breit, 13.8"],
    ["Fang", "kurz, breit, kantig"],
    ["Brusttiefe", "10.7"],
    ["Rutenlänge", "9.5"],
  ],
};

const MERKMALE: Record<HundId, string[]> = {
  odin: [
    "· langer, schmaler, fein zulaufender Fang",
    "· edle, gerade Nasenrückenlinie mit flachem Stop",
    "· weich zurückgefaltete Ohren",
    "· schwarzes Fell mit dezenter Tiefenwirkung am Bauch",
    "· dunkle Lefzenlinie und glänzende Nasenspitze",
  ],
  apollo: [
    "· breiter, kräftiger Kopf mit vollen Wangenbacken",
    "· steiler Oberkopf mit gerader Stirn",
    "· schmale weiße Blesse zwischen schwarzen Augenflecken",
    "· weiße Lefzen und Brustkragen (Border-Collie-Zeichnung)",
    "· kurze, kantige Schnauze mit breiter schwarzer Nase",
  ],
};

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

function HundeStudio({ id }: { id: HundId }) {
  const [ansichtModus, setAnsichtModus] = useState<"spiel" | "fein" | "vergleich">("vergleich");
  const [pose, setPose] = useState<HundPose>("stand");
  const [face, setFace] = useState<1 | -1>(1);
  const [zoom, setZoom] = useState(4.4);
  const [grid, setGrid] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const info = HUNDE_INFO[id];
  const name = info.name;
  const palette = id === "odin" ? ODIN_PALETTE : APOLLO_PALETTE;

  return (
    <div className="bg-room grid-floor min-h-[100dvh] w-full overflow-x-hidden p-3 sm:p-5">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[8px] tracking-[0.3em] text-teal sm:text-[10px]">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral" />
                LITTLE COMPUTER LUNI · HUNDEENTWURF
              </span>
              <a
                href="#studio"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← STUDIO
              </a>
              <a
                href={id === "odin" ? "#studio-apollo" : "#studio-odin"}
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                {id === "odin" ? "APOLLO-STUDIO" : "ODIN-STUDIO"}
              </a>
              <a
                href={`#studio-atelier-${id}`}
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                FIGURENATELIER &rarr;
              </a>
            </div>
            <h1 className="mt-1 font-display text-[22px] leading-none text-mint-50 text-shadow-hard sm:text-[34px]">
              {name.toUpperCase()} <span className="text-amber-glow">CHARAKTER-STUDIO</span>
            </h1>
            <p className="mt-1.5 max-w-[66ch] text-[12px] leading-relaxed text-mint-200/80 sm:text-[13px]">
              {id === "odin"
                ? "Schlanker, eleganter Bau mit langem, schmalem, fein zulaufendem Fang. Schwarzes Fell mit dezenter Tiefenwirkung, dunkle Lefzenlinie und glänzende Nasenspitze."
                : "Kräftiger, kompakter Bau mit steilem Oberkopf, breitem Kopf und vollen Wangen. Schwarz-weiße Border-Collie-Zeichnung: Blesse, Brustkragen und Lefzen weiß, kurze kantige Schnauze."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex gap-1 rounded-lg bg-[#08151a]/70 p-1 ring-1 ring-white/10">
              <Chip active={ansichtModus === "spiel"} onClick={() => setAnsichtModus("spiel")}>
                Ursprung (Spiel)
              </Chip>
              <Chip active={ansichtModus === "vergleich"} onClick={() => setAnsichtModus("vergleich")}>
                Vergleich
              </Chip>
              <Chip active={ansichtModus === "fein"} onClick={() => setAnsichtModus("fein")}>
                Aufgehübscht
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
              {ansichtModus === "vergleich" ? (
                <HundVergleichStage
                  id={id}
                  pose={pose}
                  face={face}
                  zoom={Math.min(zoom, 5)}
                  paused={paused}
                  speed={speed}
                />
              ) : ansichtModus === "fein" ? (
                <FeinHundStage
                  id={id}
                  pose={pose}
                  face={face}
                  zoom={zoom}
                  grid={grid}
                  paused={paused}
                  speed={speed}
                />
              ) : (
                <HundStage
                  id={id}
                  pose={pose}
                  face={face}
                  zoom={zoom}
                  grid={grid}
                  paused={paused}
                  speed={speed}
                />
              )}
              <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 font-display text-[9px] tracking-[0.18em] text-mint-200">
                {ansichtModus === "vergleich"
                  ? `${name.toUpperCase()} · VERGLEICH (URSPRUNG & FEIN)`
                  : ansichtModus === "fein"
                    ? `${name.toUpperCase()} (FEINZEICHNUNG) · ${ALL_POSES.find((s) => s.k === pose)?.label}`
                    : `${name.toUpperCase()} (SPIEL) · ${ALL_POSES.find((s) => s.k === pose)?.label}`}
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
            {GROUPS.map((g) => (
              <Panel key={g.title} title={g.title}>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((s) => (
                    <Chip key={s.k} active={pose === s.k} onClick={() => setPose(s.k)}>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </Panel>
            ))}

            <Panel title={`FARBEN · ${name.toUpperCase()}`}>
              <HundPalette farben={palette} />
            </Panel>

            <Panel title="MERKMALE">
              <ul className="space-y-1 text-[11px] leading-relaxed text-mint-200/80">
                {MERKMALE[id].map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Panel>

            <Panel title="BAUMASSE">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                {BAUMASSE[id].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-white/5 py-0.5">
                    <dt className="text-mint-400">{k}</dt>
                    <dd className="text-mint-50 tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          <Panel title={`KOPF · ${name.toUpperCase()}`} hint="Dreiviertelansicht live">
            <div className="overflow-hidden rounded-lg bg-[#08151a]/60">
              <HundKopfSheet id={id} />
            </div>
          </Panel>

          <Panel title={`${name.toUpperCase()} · ALLE HALTUNGEN`} hint={`${ALL_POSES.length} Animationen live`}>
            <HundPoseSheet items={ALL_POSES} id={id} />
          </Panel>
        </div>

        <div className="mt-3 grid gap-3">
          <Panel title="GESCHWISTER-STUDIO">
            <div className="flex flex-wrap gap-2">
              <a
                href={id === "odin" ? "#studio-apollo" : "#studio-odin"}
                className="btn-press rounded-md px-3 py-2 text-[11px] font-medium tracking-wide bg-[#132a33] text-mint-200 ring-1 ring-white/10 transition hover:bg-ink-700 hover:text-mint-50"
              >
                {id === "odin" ? "Apollo-Studio" : "Odin-Studio"}
              </a>
              <a
                href="#studio-mons"
                translate="no"
                className="notranslate btn-press rounded-md px-3 py-2 text-[11px] font-medium tracking-wide bg-[#132a33] text-mint-200 ring-1 ring-white/10 transition hover:bg-ink-700 hover:text-mint-50"
              >
                Luni-Mon Studio
              </a>
              <a
                href="#studio"
                className="btn-press rounded-md px-3 py-2 text-[11px] font-medium tracking-wide bg-[#132a33] text-mint-200 ring-1 ring-white/10 transition hover:bg-ink-700 hover:text-mint-50"
              >
                Studio
              </a>
            </div>
          </Panel>
        </div>

        <p className="mt-3 pb-2 text-center text-[11px] text-mint-400/60">
          {id === "odin"
            ? "Odin: schwarzes Fell, braune Stromung kommt später dazu."
            : "Apollo: schwarzes Fell, weißes Collie-Zeichnung an Blesse, Lefzen und Brust."}
        </p>
      </div>
    </div>
  );
}

export function OdinStudio() {
  return <HundeStudio id="odin" />;
}

export function ApolloStudio() {
  return <HundeStudio id="apollo" />;
}
