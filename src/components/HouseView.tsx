import { useEffect, useRef, useState } from "react";
import { House } from "@/game/house";
import { sfx } from "@/game/audio";
import { loadMuted, saveMuted } from "@/game/storage";
import { Icon } from "@/components/Icons";



export default function HouseView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const m = loadMuted();
    setMuted(m);
    sfx.setMuted(m);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const house = new House(cv);
    house.mount();
    const onFonts = () => house.resize();
    if (document.fonts?.ready) void document.fonts.ready.then(onFonts);
    return () => house.destroy();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyM") return;
      setMuted((m) => {
        const next = !m;
        sfx.setMuted(next);
        saveMuted(next);
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleMute = () => {
    sfx.ensure();
    setMuted((m) => {
      const next = !m;
      sfx.setMuted(next);
      saveMuted(next);
      return next;
    });
  };

  return (
    <div className="bg-room grid-floor relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden p-2 sm:p-4">
      <div className="relative w-full max-w-[1140px]">
        <div className="mb-1.5 flex items-end justify-between gap-3 px-0.5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[11px] tracking-[0.28em] text-mint-50 sm:text-sm">LUNIS HAUS</span>
            <span className="hidden text-[10px] tracking-[0.18em] text-mint-400/80 sm:inline">
              LITTLE COMPUTER LUNI · DAS ADVENTSHAUS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#studio"
              className="rounded bg-[#132a33] px-2 py-1 font-display text-[8px] tracking-[0.18em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700 sm:text-[9px]"
            >
              LUNI‑STUDIO →
            </a>
            <button
              onClick={toggleMute}
              aria-label={muted ? "Ton an" : "Ton aus"}
              className="btn-press grid h-7 w-7 place-items-center rounded-md bg-[#0d2029]/92 text-mint-200 ring-1 ring-white/12 hover:bg-ink-700 hover:text-teal"
            >
              <Icon name={muted ? "mute" : "sound"} size={14} />
            </button>
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

        <p className="mt-2 px-1 text-center text-[11px] text-mint-400/80">
          Ein Möbelstück antippen oder anklicken – Luni geht hin. · <kbd className="font-display text-[9px]">M</kbd> Ton
        </p>
      </div>
    </div>
  );
}
