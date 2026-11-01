import { useEffect, useRef } from "react";
import { Traumhaus } from "@/game/traumhaus";
import { markiereBesuch, wechsleWelt } from "@/game/welten";

/** Entwicklungsansicht fuer die leere Hausarchitektur des Traums. */
export default function TraumhausView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    markiereBesuch("traum");
    const haus = new Traumhaus(canvas, { onWelt: wechsleWelt });
    haus.mount();
    return () => haus.destroy();
  }, []);

  return (
    <div className="bg-room grid-floor relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden p-2 sm:p-4">
      <div className="relative w-full max-w-[1140px]">
        <div className="mb-1.5 flex items-end justify-between gap-3 px-0.5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[11px] tracking-[0.28em] text-mint-50 sm:text-sm">LUNIS HAUS</span>
            <span className="hidden text-[10px] tracking-[0.18em] text-mint-400/80 sm:inline">TRAUMHAUS</span>
          </div>
        </div>
        <div className="bezel rounded-[18px] p-1.5 sm:rounded-[22px] sm:p-3">
          <div
            className="screen-glass relative mx-auto w-full overflow-hidden rounded-[10px] bg-[#04121a] sm:rounded-[13px]"
            style={{ aspectRatio: "8 / 5" }}
          >
            <canvas ref={canvasRef} className="absolute inset-0 m-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}