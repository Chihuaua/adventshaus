import { useRef, type ReactNode } from "react";
import { Icon } from "./Icons";

function Pad({
  onDown,
  onUp,
  children,
  className = "",
  label,
}: {
  onDown: () => void;
  onUp: () => void;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const held = useRef(false);
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    if (held.current) return;
    held.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    onDown();
  };
  const up = (e?: React.PointerEvent) => {
    e?.preventDefault();
    if (!held.current) return;
    held.current = false;
    onUp();
  };
  return (
    <button
      aria-label={label}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => up()}
      onLostPointerCapture={() => up()}
      onContextMenu={(e) => e.preventDefault()}
      className={`btn-press no-select pointer-events-auto grid touch-none place-items-center rounded-xl border-b-4 bg-[#12262e]/92 text-mint-50 ring-1 ring-teal/30 backdrop-blur-[2px] active:border-b-0 active:bg-teal/25 ${className}`}
    >
      {children}
    </button>
  );
}

export function TouchControls({
  onHold,
  onJump,
  onJumpHold,
}: {
  onHold: (k: "left" | "right" | "interact", v: boolean) => void;
  onJump: () => void;
  onJumpHold: (v: boolean) => void;
}) {
  return (
    <div className="no-select mt-2 flex items-center justify-between gap-2 rounded-[14px] bg-[#0d2029]/85 p-2 ring-1 ring-white/10 sm:mt-3 sm:p-3">
      <div className="flex items-center gap-2">
        <Pad
          label="Move left"
          onDown={() => onHold("left", true)}
          onUp={() => onHold("left", false)}
          className="h-14 w-14 border-teal/50 sm:h-16 sm:w-16"
        >
          <Icon name="left" size={24} />
        </Pad>
        <Pad
          label="Move right"
          onDown={() => onHold("right", true)}
          onUp={() => onHold("right", false)}
          className="h-14 w-14 border-teal/50 sm:h-16 sm:w-16"
        >
          <Icon name="right" size={24} />
        </Pad>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Pad
          label="Jump"
          onDown={() => {
            onJumpHold(true);
            onJump();
          }}
          onUp={() => onJumpHold(false)}
          className="h-11 w-16 border-sky/50 sm:h-12 sm:w-20"
        >
          <Icon name="up" size={20} className="text-sky" />
        </Pad>
        <span className="font-display text-[7px] tracking-[0.2em] text-mint-400/70">HOP</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-right font-display text-[7px] leading-tight tracking-[0.16em] text-mint-400/80 xs:block">
          HOLD TO
          <br />
          USE
        </span>
        <Pad
          label="Interact"
          onDown={() => onHold("interact", true)}
          onUp={() => onHold("interact", false)}
          className="h-[68px] w-[68px] rounded-full border-amber-glow/60 bg-amber-glow/18 text-amber-glow sm:h-20 sm:w-20"
        >
          <span className="flex flex-col items-center leading-none">
            <Icon name="hand" size={22} />
            <span className="mt-1 font-display text-[8px] tracking-widest">ACT</span>
          </span>
        </Pad>
      </div>
    </div>
  );
}
