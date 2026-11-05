import { useState } from "react";
import { standExport, standImport } from "@/game/stand-transfer";

/**
 * Stand-Übertragung (Osterei „Datenkoffer“).
 *
 * Liegt außerhalb der 960×600-Bühne im Monitorrahmen – dort ist Web-Technik
 * erlaubt. Drinnen im Haus bleibt alles Canvas.
 */
export default function StandTransfer({ offen, zu }: { offen: boolean; zu: () => void }) {
  const [text, setText] = useState("");
  const [meldung, setMeldung] = useState("");
  const [ton, setTon] = useState<"ok" | "fehler" | "info">("info");

  if (!offen) return null;

  const kopieren = async () => {
    const stand = standExport();
    setText(stand);
    try {
      await navigator.clipboard.writeText(stand);
      setTon("ok");
      setMeldung("Stand kopiert – in die Zwischenablage gelegt.");
      return;
    } catch {
      /* Manche Browser (z. B. per Doppelklick geöffnet) sperren die Ablage. */
    }
    // Notnagel: Textfeld markieren, dann Strg+C
    setTon("info");
    setMeldung("Bitte den Text im Feld markieren und mit Strg+C kopieren.");
  };

  const einfügen = () => {
    if (!text.trim()) {
      setTon("fehler");
      setMeldung("Bitte zuerst den kopierten Stand in das Feld einsetzen.");
      return;
    }
    const r = standImport(text);
    if (r.ok) {
      setTon("ok");
      setMeldung(`Übernommen: ${r.anzahl} Einträge. Seite neu laden, dann läuft der Stand.`);
    } else {
      setTon("fehler");
      setMeldung(r.fehler ?? "Der Stand konnte nicht übernommen werden.");
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-end justify-center p-3 sm:items-center">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-white/10 bg-[#0b1a20]/95 p-4 text-mint-100 shadow-2xl backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="font-display text-sm tracking-[0.18em] text-amber-glow">DATENKOFFER</h2>
          <button
            onClick={zu}
            aria-label="Schließen"
            className="grid h-7 w-7 place-items-center rounded-md bg-[#0d2029]/92 text-mint-200 ring-1 ring-white/12 transition hover:bg-ink-700 hover:text-teal"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
            </svg>
          </button>
        </div>

        <p className="mb-3 text-[11px] leading-relaxed text-mint-300/90">
          Der ganze Spielstand als Text. Vor einem Update hier herauskopieren, danach im neuen Haus
          wieder einsetzen – dann ist nichts verloren.
        </p>

        <div className="mb-3 flex gap-2">
          <button
            onClick={kopieren}
            className="flex-1 rounded-md bg-[#132a33] px-3 py-2 font-display text-[9px] tracking-[0.14em] text-teal ring-1 ring-white/10 transition hover:bg-ink-700 active:scale-95"
          >
            STAND KOPIEREN
          </button>
          <button
            onClick={einfügen}
            className="flex-1 rounded-md bg-[#132a33] px-3 py-2 font-display text-[9px] tracking-[0.14em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700 active:scale-95"
          >
            STAND EINSETZEN
          </button>
        </div>

        <label className="mb-1 block font-display text-[8px] tracking-[0.16em] text-mint-400/80">
          STAND-TEXT
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          spellCheck={false}
          placeholder="Hier erscheint der kopierte Stand – oder einen eingesetzten Stand hineinlegen."
          className="w-full resize-y rounded-md border border-white/10 bg-[#06131a] p-2 font-mono text-[10px] leading-relaxed text-mint-100 outline-none focus:border-teal"
        />

        {meldung && (
          <p
            className={`mt-2 text-[11px] leading-relaxed ${
              ton === "ok" ? "text-emerald-300" : ton === "fehler" ? "text-rose-300" : "text-mint-300"
            }`}
          >
            {meldung}
          </p>
        )}
      </div>
    </div>
  );
}
