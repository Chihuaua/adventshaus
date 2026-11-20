import { useEffect, useMemo, useRef } from "react";
import studioKoerper from "@/studio/body.html?raw";
import studioStil from "@/studio/studio.css?raw";
import studioCode from "@/studio/studio.js?raw";
import spielMons from "@/studio/spiel-mons.js?raw";
import studioMons from "@/game/lunimons.js?raw";
import monsQuelle from "@/game/mons.ts?raw";
import dekoJs from "@/studio/deko.js?raw";
import dekoQuelle from "@/game/deko.ts?raw";

/** Prüfsumme (FNV-1a, 32 Bit), dieselbe Rechnung wie in tools/spiel-mons-bauen.mjs. */
function pruefsumme(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Die Mons und die Deko des Spiels kommen über erzeugte Dateien ins Studio. Wurde mons.ts
    oder deko.ts danach geändert, passt die dort vermerkte Prüfsumme nicht mehr. */
const STUDIO_DATEN_VERALTET =
  /quelle-pruefsumme: ([0-9a-f]{8})/.exec(spielMons)?.[1] !== pruefsumme(monsQuelle) ||
  /quelle-pruefsumme: ([0-9a-f]{8})/.exec(dekoJs)?.[1] !== pruefsumme(dekoQuelle);

/** Setzt das Luni-Mon-Studio aus seinen Quellen in src/studio zu einem eigenständigen
    Dokument zusammen. Die vier Skriptblöcke tragen feste Kennungen, weil das Studio sich
    für seinen ZIP-Export selbst darüber ausliest. */
function studioDokument(): string {
  const spielmodul = studioMons
    .replace("export const HOUSE", "const HOUSE")
    .replace("export const SPECIES", "const SPECIES")
    .replace("export function createLuniMons", "function createLuniMons");
  const s = "script";
  return [
    "<!doctype html>",
    '<html lang="de" translate="no">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="google" content="notranslate">',
    "<title>Luni-Mon Studio</title>",
    "<style>",
    studioStil,
    "</style>",
    "</head>",
    "<body>",
    studioKoerper,
    `<${s} id="lmGame">`,
    "(function(){",
    spielmodul,
    "window.LuniMons={HOUSE:HOUSE,SPECIES:SPECIES,createLuniMons:createLuniMons};",
    "})();",
    `</${s}>`,
    `<${s} id="lmSpielMons">`,
    spielMons,
    `</${s}>`,
    `<${s} id="lmDeko">`,
    dekoJs,
    `</${s}>`,
    `<${s} id="lmStudio">`,
    studioCode,
    `</${s}>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

/** Luni-Mon-Studio: zeigt das eigenständige Studio in einem eigenen Rahmen. So bleiben
    dessen Stile, Tasten und Zeichenschleife vom restlichen Haus getrennt. */
export default function MonsStudio() {
  const rahmen = useRef<HTMLIFrameElement | null>(null);
  const dokument = useMemo(studioDokument, []);

  useEffect(() => {
    // Der Knopf „Hausansicht“ im Studio meldet sich per Nachricht; von hier geht es ins Haus.
    const on = (e: MessageEvent) => {
      if (e.source !== rahmen.current?.contentWindow) return;
      if (e.data?.type === "luni:ansicht" && e.data.ansicht === "haus") window.location.hash = "";
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);

  return (
    <div className="bg-room grid-floor flex h-[100dvh] w-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 font-display text-[8px] tracking-[0.3em] text-teal sm:px-5 sm:text-[10px]">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral" />
          LITTLE COMPUTER LUNI · MON-ENTWURF
        </span>
        <a
          href="#studio"
          className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
        >
          ← LUNI-STUDIO
        </a>
        <a
          href="#studio-odin"
          className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
        >
          ODIN-STUDIO
        </a>
        <a
          href="#studio-apollo"
          className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
        >
          APOLLO-STUDIO
        </a>
      </div>
      {STUDIO_DATEN_VERALTET && (
        <div className="bg-coral px-3 py-1.5 text-[12px] font-semibold text-[#2a0d0a] sm:px-5">
          Achtung: src/game/mons.ts oder src/game/deko.ts wurde geändert, das Studio zeigt noch den alten Stand.
          Im Terminal ausführen: node tools/spiel-mons-bauen.mjs und node tools/deko-bauen.mjs
        </div>
      )}
      {/* Der Rahmenname sagt dem Studio, dass es ein Haus gibt (Knopf „Hausansicht“). */}
      <iframe
        ref={rahmen}
        name="luni-haus"
        title="Luni-Mon Studio"
        srcDoc={dokument}
        className="min-h-0 w-full flex-1 border-0"
      />
    </div>
  );
}
