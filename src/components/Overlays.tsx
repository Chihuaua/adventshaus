import type { Phase, RunSummary } from "@/game/engine";
import type { ScoreEntry } from "@/game/storage";
import { Icon, type UiIcon } from "./Icons";

const GUIDE: { icon: UiIcon; name: string; what: string; color: string }[] = [
  { icon: "food", name: "FRIDGE", what: "fills hunger", color: "#ffb648" },
  { icon: "sleep", name: "BED", what: "fills energy", color: "#63b3ff" },
  { icon: "clean", name: "SHOWER", what: "fills hygiene", color: "#35d6c0" },
  { icon: "fun", name: "SOFA + TV", what: "fills fun", color: "#ff6f61" },
  { icon: "social", name: "PHONE", what: "fills social", color: "#c3e84f" },
  { icon: "book", name: "BOOKSHELF", what: "2× score for 12s", color: "#c3a2ff" },
  { icon: "coin", name: "DESK", what: "big points, costs energy", color: "#ffd166" },
  { icon: "heart", name: "CAT", what: "restores vitality", color: "#ff5d8f" },
];

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid min-w-[22px] place-items-center rounded-[5px] border-b-2 border-black/60 bg-[#1b333c] px-1.5 py-0.5 font-display text-[9px] text-mint-50 shadow-[0_1px_0_rgba(255,255,255,.08)_inset]">
      {children}
    </kbd>
  );
}

function BigButton({
  children,
  onClick,
  tone = "amber",
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "amber" | "teal" | "ghost";
  className?: string;
}) {
  const tones = {
    amber: "bg-amber-glow text-[#2a1a05] border-[#a86c14] hover:bg-[#ffc668]",
    teal: "bg-teal text-[#04211d] border-[#157f70] hover:bg-[#5ce6d2]",
    ghost: "bg-[#132a33] text-mint-200 border-[#0a1a20] hover:bg-ink-700 hover:text-mint-50",
  } as const;
  return (
    <button
      onClick={onClick}
      className={`btn-press no-select pixel-corners pointer-events-auto border-b-4 px-5 py-2.5 font-display text-[11px] tracking-[0.14em] sm:text-[13px] ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Overlays({
  phase,
  summary,
  scores,
  rank,
  name,
  newRecord,
  onName,
  onStart,
  onResume,
  onRestart,
  onMenu,
  best,
}: {
  phase: Phase;
  summary: RunSummary | null;
  scores: ScoreEntry[];
  rank: number;
  name: string;
  newRecord: boolean;
  onName: (v: string) => void;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  best: number;
}) {
  if (phase === "playing" || phase === "dying") return null;

  /* ------------------------------ START ------------------------------ */
  if (phase === "attract") {
    return (
      <div className="absolute inset-0 overflow-y-auto">
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(4,14,20,.97)_0%,rgba(4,14,20,.9)_42%,rgba(4,14,20,.35)_68%,rgba(4,14,20,0)_88%)]" />
        <div className="relative flex min-h-full w-full max-w-[620px] flex-col justify-between gap-2 p-3 sm:p-6">
          <div className="anim-slide">
            <div className="flex items-center gap-2 font-display text-[8px] tracking-[0.34em] text-teal sm:text-[10px]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral" />
              UNIT LCP-1 · DOMESTIC LIFE SIMULATOR
            </div>
            <h1 className="mt-1 font-display text-[21px] leading-[0.94] text-mint-50 text-shadow-hard xs:text-[30px] sm:text-[54px]">
              LITTLE
              <br />
              <span className="text-amber-glow">COMPUTER</span>
              <br />
              PERSON
            </h1>
            <p className="mt-2 hidden max-w-[42ch] text-[12px] leading-relaxed text-mint-200/85 xs:block sm:mt-2.5 sm:text-[14px]">
              Somebody small lives inside this machine. Steer them around the house, keep all five needs
              above zero, grant their wishes and clean up their messes — or their <b className="text-rose">vitality</b>{" "}
              drains and the signal is lost.
            </p>
          </div>

          <div className="anim-slide grid gap-1 text-[9px] text-mint-200/90 sm:grid-cols-2 sm:gap-1.5 sm:text-[12px]" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2">
              <Key>←</Key>
              <Key>→</Key>
              <span className="text-mint-400">/</span>
              <Key>A</Key>
              <Key>D</Key>
              <span>walk</span>
            </div>
            <div className="flex items-center gap-2">
              <Key>↑</Key>
              <Key>W</Key>
              <Key>SPACE</Key>
              <span>hop (stairs too)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-glow">
                <Key>E</Key>
              </span>
              <span>hold to use furniture</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="hand" size={13} className="text-teal" />
              <span>tap a room to auto-walk</span>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="anim-pop" style={{ animationDelay: "140ms" }}>
              <BigButton onClick={onStart} className="px-7 py-3.5 text-[13px] sm:text-[16px]">
                <span className="flex items-center gap-2">
                  <Icon name="play" size={14} /> POWER ON
                </span>
              </BigButton>
              <div className="mt-1.5 font-display text-[8px] tracking-[0.2em] text-mint-400/80 sm:text-[9px]">
                OR PRESS <Key>ENTER</Key>
              </div>
            </div>
            <div className="pixel-corners bg-[#08151a]/85 px-3 py-2 ring-1 ring-amber-glow/25">
              <div className="flex items-center gap-1.5 font-display text-[8px] tracking-[0.22em] text-mint-400">
                <Icon name="trophy" size={11} className="text-amber-glow" /> BEST RECORD
              </div>
              <div className="font-display text-lg text-amber-glow text-shadow-hard tabular-nums sm:text-2xl">
                {best.toLocaleString()}
              </div>
              <div className="font-display text-[8px] text-mint-200/70">{scores[0]?.name ?? "—"}</div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[46%] overflow-hidden border-t border-white/10 bg-[#04121a]/70 py-1 lg:block">
          <div className="anim-marquee flex w-max gap-8 font-display text-[9px] tracking-[0.24em] text-mint-400/70">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k} className="flex gap-8">
                {GUIDE.map((g) => (
                  <span key={g.name} className="flex items-center gap-1.5">
                    <Icon name={g.icon} size={11} style={{ color: g.color }} />
                    {g.name} — {g.what.toUpperCase()}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ PAUSE ------------------------------ */
  if (phase === "paused") {
    return (
      <div className="absolute inset-0 grid place-items-center bg-[#04121a]/82 p-3 backdrop-blur-[3px]">
        <div className="pixel-corners anim-pop w-full max-w-[560px] bg-[#0a1c23]/95 p-4 ring-1 ring-teal/30 sm:p-6">
          <div className="flex items-center gap-2 font-display text-[9px] tracking-[0.3em] text-teal">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal" /> SIMULATION HELD
          </div>
          <h2 className="mt-1 font-display text-2xl text-mint-50 text-shadow-hard xs:text-3xl sm:text-4xl">PAUSED</h2>

          <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:mt-3 sm:grid-cols-4 sm:gap-x-4">
            {GUIDE.map((g) => (
              <div key={g.name} className="flex items-center gap-1.5">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-[4px]"
                  style={{ background: `${g.color}22`, color: g.color }}
                >
                  <Icon name={g.icon} size={12} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[8px] text-mint-50">{g.name}</span>
                  <span className="block truncate text-[9px] text-mint-400">{g.what}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <BigButton onClick={onResume} tone="teal">
              <span className="flex items-center gap-2">
                <Icon name="play" size={12} /> RESUME
              </span>
            </BigButton>
            <BigButton onClick={onRestart} tone="ghost">
              <span className="flex items-center gap-2">
                <Icon name="restart" size={12} /> RESTART
              </span>
            </BigButton>
            <BigButton onClick={onMenu} tone="ghost">
              QUIT TO TITLE
            </BigButton>
          </div>
          <div className="mt-2 font-display text-[8px] tracking-[0.18em] text-mint-400/70">
            <Key>P</Key> / <Key>ESC</Key> RESUME · <Key>R</Key> RESTART
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------- GAME OVER ----------------------------- */
  const isNewBest = newRecord;
  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#04121a]/88 p-2.5 backdrop-blur-[3px] sm:p-4">
      <div className="mx-auto grid w-full max-w-[760px] gap-2 sm:grid-cols-[1.05fr_.95fr] sm:gap-3">
        <div className="pixel-corners anim-pop bg-[#0a1c23]/96 p-3.5 ring-1 ring-rose/40 sm:p-5">
          <div className="flex items-center gap-2 font-display text-[8px] tracking-[0.3em] text-rose sm:text-[10px]">
            <Icon name="skull" size={13} /> VITALS FLATLINED
          </div>
          <h2 className="mt-1 font-display text-[19px] leading-none text-mint-50 text-shadow-hard xs:text-[26px] sm:text-[40px]">
            SIGNAL
            <br />
            <span className="text-rose">LOST</span>
          </h2>
          <p className="mt-1.5 hidden max-w-[36ch] text-[11px] leading-relaxed text-mint-200/80 xs:block sm:mt-2 sm:text-[13px]">
            The little one packed their pixels and moved out. The house keeps running without them.
          </p>

          <div className="mt-3 flex items-end gap-3">
            <div>
              <div className="font-display text-[8px] tracking-[0.24em] text-mint-400">FINAL SCORE</div>
              <div className="font-display text-2xl leading-none text-amber-glow text-shadow-hard tabular-nums xs:text-3xl sm:text-5xl">
                {(summary?.score ?? 0).toLocaleString()}
              </div>
            </div>
            {isNewBest && (
              <div className="anim-blink font-display text-[10px] text-teal sm:text-xs">★ NEW RECORD</div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { l: "DAYS SURVIVED", v: summary?.day ?? 1, i: "sun" as UiIcon },
              { l: "WISHES GRANTED", v: summary?.wishes ?? 0, i: "star" as UiIcon },
              { l: "TIME ALIVE", v: `${Math.floor((summary?.time ?? 0) / 60)}:${String(Math.floor((summary?.time ?? 0) % 60)).padStart(2, "0")}`, i: "clock" as UiIcon },
            ].map((s) => (
              <div key={s.l} className="bg-[#08151a]/80 px-2 py-1.5 ring-1 ring-white/10">
                <div className="flex items-center gap-1 font-display text-[7px] tracking-[0.14em] text-mint-400 sm:text-[8px]">
                  <Icon name={s.i} size={9} /> {s.l}
                </div>
                <div className="font-display text-base text-mint-50 tabular-nums sm:text-xl">{s.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 bg-[#08151a]/85 px-2 py-1.5 ring-1 ring-white/12">
              <span className="font-display text-[8px] tracking-[0.18em] text-mint-400">NAME</span>
              <input
                value={name}
                maxLength={8}
                onChange={(e) => onName(e.target.value.toUpperCase().replace(/[^A-Z0-9!?._ -]/g, "").slice(0, 8))}
                className="pointer-events-auto w-24 bg-transparent font-display text-[12px] tracking-[0.14em] text-amber-glow outline-none placeholder:text-mint-400/40"
                placeholder="YOU"
                spellCheck={false}
              />
            </label>
            <BigButton onClick={onRestart} tone="amber">
              <span className="flex items-center gap-2">
                <Icon name="restart" size={12} /> RUN AGAIN
              </span>
            </BigButton>
            <BigButton onClick={onMenu} tone="ghost">
              TITLE
            </BigButton>
          </div>
          <div className="mt-1.5 font-display text-[8px] tracking-[0.18em] text-mint-400/70">
            PRESS <Key>R</Key> FOR INSTANT RESTART
          </div>
        </div>

        <div className="pixel-corners anim-slide bg-[#08151a]/92 p-3 ring-1 ring-amber-glow/25 sm:p-4" style={{ animationDelay: "90ms" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-display text-[9px] tracking-[0.24em] text-amber-glow sm:text-[11px]">
              <Icon name="trophy" size={13} /> HALL OF RECORDS
            </div>
            <div className="font-display text-[8px] text-mint-400">LOCAL</div>
          </div>
          <div className="mt-2 space-y-1">
            {scores.map((s, i) => {
              const isYou = rank === i;
              return (
                <div
                  key={`${s.name}-${s.ts}-${i}`}
                  className={`flex items-center gap-2 px-2 py-1 ring-1 ${
                    isYou ? "anim-pop bg-amber-glow/15 ring-amber-glow/60" : "bg-[#0d2029]/60 ring-white/8"
                  }`}
                >
                  <span className={`w-5 font-display text-[10px] ${i === 0 ? "text-amber-glow" : "text-mint-400"}`}>
                    {i + 1}
                  </span>
                  <span className={`flex-1 truncate font-display text-[11px] ${isYou ? "text-amber-glow" : "text-mint-50"}`}>
                    {s.name}
                  </span>
                  <span className="hidden font-display text-[8px] text-mint-400 sm:inline">D{s.day}</span>
                  <span className="hidden font-display text-[8px] text-mint-400 sm:inline">{s.wishes}★</span>
                  <span className="font-display text-[11px] tabular-nums text-mint-50">{s.score.toLocaleString()}</span>
                </div>
              );
            })}
            {scores.length === 0 && (
              <div className="py-6 text-center font-display text-[10px] text-mint-400">NO RECORDS YET</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
