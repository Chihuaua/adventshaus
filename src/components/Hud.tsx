import { useEffect, useRef, useState } from "react";
import { NEEDS, type HudState, type NeedKey } from "@/game/engine";
import { Icon, type UiIcon } from "./Icons";

function Meter({
  value,
  color,
  icon,
  w,
  crit,
}: {
  value: number;
  color: string;
  icon: UiIcon;
  w: number;
  crit?: boolean;
}) {
  const low = value <= 22;
  const empty = value <= 0.5;
  return (
    <span className="flex items-center gap-1" title={`${Math.round(value)}%`}>
      <span className={`grid place-items-center ${low ? "anim-blink" : ""}`} style={{ color: empty ? "#ff5d8f" : color }}>
        <Icon name={icon} size={w > 40 ? 14 : 11} />
      </span>
      <span
        className={`relative block h-[6px] overflow-hidden rounded-full bg-[#0a1a20] ring-1 ring-white/10 ${
          crit ? "anim-alarm" : ""
        }`}
        style={{ width: w }}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: empty ? "#ff5d8f" : color,
            boxShadow: low ? `0 0 7px ${color}` : "none",
          }}
        />
        <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_4px,rgba(0,0,0,.3)_4px_5px)]" />
      </span>
    </span>
  );
}

const needOf = (hud: HudState, k: NeedKey) => hud.needs.find((x) => x.key === k)?.v ?? 0;

export function Hud({
  hud,
  muted,
  onPause,
  onMute,
  live,
}: {
  hud: HudState;
  muted: boolean;
  onPause: () => void;
  onMute: () => void;
  live: boolean;
}) {
  const [bump, setBump] = useState(false);
  const lastScore = useRef(hud.score);
  useEffect(() => {
    if (hud.score > lastScore.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 220);
      lastScore.current = hud.score;
      return () => window.clearTimeout(t);
    }
    lastScore.current = hud.score;
  }, [hud.score]);

  const vital = hud.vitality;
  const vitalCrit = vital < 32;

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* ============================ TOP STRIP ============================ */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-1.5 sm:p-2.5">
        <div className="pixel-corners bg-[#08151a]/85 px-2 py-1 ring-1 ring-teal/25 backdrop-blur-[2px] sm:px-3.5 sm:py-2">
          <div className="font-display text-[6px] tracking-[0.28em] text-mint-400 sm:text-[9px]">LIFE POINTS</div>
          <div
            className={`font-display text-lg leading-none text-amber-glow text-shadow-hard tabular-nums sm:text-4xl ${
              bump ? "anim-bump" : ""
            }`}
          >
            {hud.score.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className={`font-display text-[7px] sm:text-[10px] ${hud.combo > 0 ? "text-teal" : "text-mint-400/50"}`}>
              ×{hud.mult.toFixed(1)}
            </span>
            <span className="relative block h-[4px] w-10 overflow-hidden rounded-full bg-[#0a1a20] ring-1 ring-white/10 sm:h-[5px] sm:w-20">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-teal"
                style={{ width: `${hud.comboT * 100}%`, opacity: hud.combo > 0 ? 1 : 0.25 }}
              />
            </span>
            <span className="hidden font-display text-[7px] text-mint-400/70 sm:inline sm:text-[9px]">
              {hud.combo} CHAIN
            </span>
          </div>
        </div>

        {/* desktop vitals */}
        <div className="pixel-corners hidden bg-[#08151a]/80 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur-[2px] xs:block sm:py-2">
          <div className="flex items-center gap-2.5">
            {NEEDS.map((n) => (
              <Meter key={n.key} value={needOf(hud, n.key)} color={n.color} icon={n.icon} w={34} />
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-2 border-t border-white/10 pt-1.5">
            <span
              className={`font-display text-[7px] tracking-[0.22em] sm:text-[9px] ${
                vitalCrit ? "text-rose anim-blink" : "text-mint-200"
              }`}
            >
              VITALITY
            </span>
            <Meter value={vital} color="#ff5d8f" icon="heart" w={96} crit={vitalCrit} />
            <span className={`font-display text-[9px] tabular-nums sm:text-[11px] ${vitalCrit ? "text-rose" : "text-mint-50"}`}>
              {Math.ceil(vital)}%
            </span>
          </div>
        </div>

        <div className="flex items-start gap-1 sm:gap-1.5">
          <div className="pixel-corners bg-[#08151a]/85 px-2 py-1 text-right ring-1 ring-white/10 backdrop-blur-[2px] sm:px-3 sm:py-2">
            <div className="font-display text-[6px] tracking-[0.2em] text-mint-400 sm:text-[9px]">DAY {hud.day}</div>
            <div className="flex items-center justify-end gap-1 font-display text-[8px] text-mint-50 sm:text-sm">
              <Icon name={hud.tod < 0.72 && hud.tod > 0.06 ? "sun" : "moon"} size={10} className="text-amber-glow" />
              <span className="hidden sm:inline">{hud.todLabel}</span>
            </div>
          </div>
          <button
            onClick={onMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="btn-press pointer-events-auto grid h-7 w-7 place-items-center rounded-md bg-[#0d2029]/92 text-mint-200 ring-1 ring-white/12 hover:bg-ink-700 hover:text-teal sm:h-9 sm:w-9"
          >
            <Icon name={muted ? "mute" : "sound"} size={14} />
          </button>
          <button
            onClick={onPause}
            aria-label="Pause"
            className="btn-press pointer-events-auto grid h-7 w-7 place-items-center rounded-md bg-[#0d2029]/92 text-mint-200 ring-1 ring-white/12 hover:bg-ink-700 hover:text-amber-glow sm:h-9 sm:w-9"
          >
            <Icon name={live ? "pause" : "play"} size={14} />
          </button>
        </div>
      </div>

      {/* ======================= MOBILE VITALS (1 row) ==================== */}
      <div className="absolute inset-x-1.5 top-[55px] flex items-center justify-between gap-1 xs:hidden">
        <div
          className={`pixel-corners flex items-center gap-1 bg-[#08151a]/88 px-1.5 py-[3px] ring-1 ${
            vitalCrit ? "ring-rose/70" : "ring-white/12"
          }`}
        >
          <Meter value={vital} color="#ff5d8f" icon="heart" w={40} crit={vitalCrit} />
          <span className={`font-display text-[8px] tabular-nums ${vitalCrit ? "text-rose" : "text-mint-50"}`}>
            {Math.ceil(vital)}
          </span>
        </div>
        <div className="pixel-corners flex items-center gap-1.5 bg-[#08151a]/88 px-1.5 py-[3px] ring-1 ring-white/10">
          {NEEDS.map((n) => (
            <Meter key={n.key} value={needOf(hud, n.key)} color={n.color} icon={n.icon} w={17} />
          ))}
        </div>
      </div>

      {/* ============================== WISH ============================== */}
      {hud.wish && (
        <div className="absolute left-1.5 top-[80px] w-[min(236px,68vw)] xs:left-1/2 xs:top-[88px] xs:w-[min(340px,42vw)] xs:-translate-x-1/2">
          <div className="pixel-corners anim-pop bg-[#12242c]/94 px-2 py-1 ring-2 ring-amber-glow/70 shadow-[0_0_24px_-6px_rgba(255,182,72,.65)]">
            <div className="flex items-center gap-1.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-glow/20 text-amber-glow">
                <Icon name={hud.wish.icon} size={12} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[7px] tracking-[0.14em] text-amber-glow sm:text-[10px]">
                  WISH · {hud.wish.label}
                </span>
                <span className="mt-[3px] block h-[3px] w-full overflow-hidden rounded-full bg-black/50">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${(hud.wish.t / hud.wish.max) * 100}%`,
                      background: hud.wish.t / hud.wish.max < 0.3 ? "#ff5d8f" : "#ffb648",
                    }}
                  />
                </span>
              </span>
              <span className="font-display text-[8px] text-mint-200 sm:text-[11px]">+130</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================== BUFF ============================== */}
      {hud.buff && (
        <div className="absolute right-1.5 top-[80px] xs:left-1.5 xs:top-[128px] xs:right-auto">
          <div className="pixel-corners anim-pop flex items-center gap-1.5 bg-[#1b1630]/92 px-2 py-1 ring-1 ring-[#c3a2ff]/70">
            <Icon name={hud.buff.icon} size={11} className="text-[#c3a2ff]" />
            <span className="font-display text-[7px] text-[#e2d4ff] sm:text-[10px]">{hud.buff.label}</span>
            <span className="relative block h-[3px] w-8 overflow-hidden rounded-full bg-black/50 sm:w-10">
              <span className="absolute inset-y-0 left-0 bg-[#c3a2ff]" style={{ width: `${(hud.buff.t / hud.buff.max) * 100}%` }} />
            </span>
          </div>
        </div>
      )}

      {/* ========================= PROMPT / HINT ========================== */}
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center gap-1">
        {hud.prompt && (
          <div className="pixel-corners anim-pop flex items-center gap-1.5 bg-[#08151a]/92 px-2.5 py-1 ring-1 ring-teal/50 sm:gap-2 sm:px-3">
            <Icon name={hud.prompt.icon} size={13} className="text-teal" />
            <span className="font-display text-[8px] tracking-wide text-mint-50 sm:text-[11px]">{hud.prompt.label}</span>
            <span className="hidden font-display text-[8px] text-mint-400 sm:inline">HOLD [E]</span>
            <span className="relative block h-[4px] w-14 overflow-hidden rounded-full bg-black/50 sm:h-[5px] sm:w-24">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-teal"
                style={{ width: `${Math.min(1, hud.progress) * 100}%` }}
              />
            </span>
          </div>
        )}
        {hud.hint && !hud.prompt && (
          <div className="px-2 text-center font-display text-[7px] leading-tight tracking-[0.1em] text-mint-200/90 text-shadow-hard sm:text-[11px]">
            {hud.hint}
          </div>
        )}
      </div>
    </div>
  );
}
