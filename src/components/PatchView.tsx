import { useRef, useState } from "react";
import { PATCH_DATEIEN, PATCH_TXT, PATCH_ZIP, type PatchDatei } from "@/game/patch";
import { zipErzeugen } from "@/game/zip";

function herunterladen(bytes: Uint8Array | string, dateiname: string, mime: string) {
  const blob =
    typeof bytes === "string"
      ? new Blob([bytes], { type: mime })
      : new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dateiname;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function patchZipHerunterladen(dateiname = PATCH_ZIP) {
  if (!PATCH_DATEIEN.some((d: PatchDatei) => d.inhalt)) return;
  herunterladen(zipErzeugen(PATCH_DATEIEN), dateiname, "application/zip");
}

export function patchTxtHerunterladen(dateiname = PATCH_TXT) {
  const patch = PATCH_DATEIEN.find((d: PatchDatei) => d.name === "aktuell.patch")?.inhalt ?? "";
  if (!patch) return;
  herunterladen(patch, dateiname, "text/plain;charset=utf-8");
}

export default function PatchView() {
  const patchText = PATCH_DATEIEN.find((d) => d.name === "aktuell.patch")?.inhalt ?? "";
  const jsonText = PATCH_DATEIEN.find((d) => d.name === "aktuell.json")?.inhalt ?? "";
  const feldRef = useRef<HTMLTextAreaElement | null>(null);
  const [kopiert, setKopiert] = useState<"patch" | "json" | null>(null);

  const kopiere = async (text: string, art: "patch" | "json") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = feldRef.current;
      if (el && art === "patch") {
        el.focus();
        el.select();
        document.execCommand("copy");
      }
    }
    setKopiert(art);
    window.setTimeout(() => setKopiert(null), 2200);
  };

  return (
    <div className="bg-room grid-floor min-h-[100dvh] w-full overflow-x-hidden p-3 sm:p-5">
      <div className="mx-auto w-full max-w-[1140px] space-y-3">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-display text-[9px] tracking-[0.26em] text-teal sm:text-[10px]">
              <span>ADVENTSHAUS · PATCH-AUSGABE</span>
              <a
                href="#"
                className="rounded bg-[#132a33] px-2.5 py-1 tracking-[0.18em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← ZUM HAUS
              </a>
              <a
                href="#weihnachtshaus"
                className="rounded bg-[#132a33] px-2.5 py-1 tracking-[0.18em] text-mint-200 ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← WEIHNACHTSHAUS
              </a>
            </div>
            <h1 className="mt-1 font-display text-[20px] leading-none text-mint-50 sm:text-[28px]">
              PATCH &amp; <span className="text-amber-glow">ZIP-DOWNLOAD</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void kopiere(patchText, "patch")}
              className="btn-press rounded-lg bg-teal px-3.5 py-2 text-[12px] font-semibold tracking-wide text-[#04211d] shadow-[0_0_16px_-4px_rgba(53,214,192,.8)] transition hover:brightness-110"
            >
              {kopiert === "patch" ? "✓ Patch-Code kopiert!" : "Patch-Code kopieren (für „Patch holen“)"}
            </button>
            <button
              onClick={() => patchTxtHerunterladen(PATCH_TXT)}
              className="btn-press rounded-lg bg-[#132a33] px-3.5 py-2 text-[12px] font-semibold tracking-wide text-mint-50 ring-1 ring-white/15 transition hover:bg-ink-700"
            >
              TXT herunterladen ({PATCH_TXT})
            </button>
            <button
              onClick={() => patchZipHerunterladen(PATCH_ZIP)}
              className="btn-press rounded-lg bg-amber-glow px-3.5 py-2 text-[12px] font-semibold tracking-wide text-[#2a1a02] transition hover:brightness-110"
            >
              ZIP herunterladen ({PATCH_ZIP})
            </button>
          </div>
        </header>

        <section className="rounded-xl bg-[#0a1c23]/90 p-3 ring-1 ring-white/10 sm:p-4">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-[10px] tracking-[0.22em] text-teal">
              aktuell.json (Prüfsumme 16 Hex + Basis)
            </span>
            <button
              onClick={() => void kopiere(jsonText, "json")}
              className="rounded bg-[#132a33] px-2.5 py-1 text-[11px] text-mint-200 ring-1 ring-white/10 hover:bg-ink-700"
            >
              {kopiert === "json" ? "✓ JSON kopiert" : "JSON kopieren"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-[#061116] p-2.5 font-mono text-[12px] text-mint-100 ring-1 ring-white/10">
            {jsonText.trim() || "(leer)"}
          </pre>
        </section>

        <section className="rounded-xl bg-[#0a1c23]/90 p-3 ring-1 ring-white/10 sm:p-4">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-[10px] tracking-[0.22em] text-teal">
              aktuell.patch · TXT-Code (erste Zeile beginnt mit „diff --git“)
            </span>
            <span className="text-[11px] text-mint-400">
              {patchText ? `${patchText.split("\n").length - 1} Zeilen` : "leer"}
            </span>
          </div>
          <textarea
            ref={feldRef}
            readOnly
            value={patchText}
            onClick={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
            spellCheck={false}
            className="h-[58dvh] w-full resize-y rounded-lg bg-[#061116] p-3 font-mono text-[11.5px] leading-relaxed text-mint-100 ring-1 ring-white/10 outline-none focus:ring-teal/50"
          />
        </section>
      </div>
    </div>
  );
}
