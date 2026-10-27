import { useEffect, useState } from "react";

/**
 * Übergabe-Leiste unter dem Spiel (nur im Entwicklungsmodus sichtbar,
 * also bei `npm run dev` – nicht in der gebauten dist/index.html).
 *
 * Drei Knöpfe, damit der Besitzer nichts suchen muss:
 *   1. Eröffnungstext für einen neuen KI-Chat kopieren
 *   2. Den Weg zum Postfach-Token öffnen (das Token selbst steht nirgends)
 *   3. Das Postfach (Gist) und die Freigaben (Pull Requests) öffnen
 *
 * Der Eröffnungstext ist die einzige Stelle, an der er gepflegt wird –
 * README und Merkzettel verweisen hierher.
 */

export const EROEFFNUNGSTEXT = `Repository: https://github.com/Chihuaua/adventshaus – Stand: main
Lies README.md komplett, besonders „Grundsätze“ und „Arbeitsablauf mit KI-Assistenten“, und halte dich daran.
Klone den Stand, bestätige, dass er baut, und zeig mir das Feature lauffähig – lege es erst nach meinem „ja“ ins Postfach (Gist-Token bekommst du von mir in zwei Hälften). Ich übernehme dann per Knopf auf dem Desktop.
Aufgabe: `;

const LINKS = {
  token: "https://github.com/settings/personal-access-tokens",
  tokenNeu:
    "https://github.com/settings/personal-access-tokens/new?name=adventshaus-postfach&description=Nur+Gists+-+Postfach+fuer+KI-Patches&expires_in=90&gists=write",
  postfach: "https://gist.github.com/Chihuaua/f28cc85bf67f8a7f2fa6251a2092a33c",
  freigaben: "https://github.com/Chihuaua/adventshaus/pulls",
  repo: "https://github.com/Chihuaua/adventshaus",
};

async function kopieren(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

const btn =
  "rounded-md px-3 py-1.5 font-display text-[9px] tracking-[0.14em] ring-1 ring-white/10 transition hover:bg-ink-700 active:scale-95";

export default function Uebergabe() {
  const [offen, setOffen] = useState<"" | "text" | "token">("");
  const [kopiert, setKopiert] = useState(false);

  useEffect(() => {
    if (!kopiert) return;
    const t = setTimeout(() => setKopiert(false), 2200);
    return () => clearTimeout(t);
  }, [kopiert]);

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-[#0a1b22]/80 p-2 text-mint-200">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="px-1 font-display text-[8px] tracking-[0.2em] text-mint-400/70">ÜBERGABE</span>
        <button
          onClick={async () => {
            setOffen(offen === "text" ? "" : "text");
            if (await kopieren(EROEFFNUNGSTEXT)) setKopiert(true);
          }}
          className={`${btn} bg-[#132a33] text-amber-glow`}
        >
          {kopiert ? "✓ KOPIERT" : "ERÖFFNUNGSTEXT KOPIEREN"}
        </button>
        <button onClick={() => setOffen(offen === "token" ? "" : "token")} className={`${btn} bg-[#132a33] text-teal`}>
          TOKEN – WO?
        </button>
        <a href={LINKS.postfach} target="_blank" rel="noopener" className={`${btn} bg-[#0d2029] text-mint-200`}>
          POSTFACH ↗
        </a>
        <a href={LINKS.freigaben} target="_blank" rel="noopener" className={`${btn} bg-[#0d2029] text-mint-200`}>
          FREIGABEN ↗
        </a>
      </div>

      {offen === "text" && (
        <div className="mt-2 rounded-md bg-black/40 p-3 text-left">
          <div className="mb-1 text-[10px] text-mint-400/80">
            Ist in der Zwischenablage. In den neuen Chat einfügen (Strg+V), Aufgabe ans Ende schreiben, dann das Token
            in zwei Hälften nachschicken.
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-mint-50">{EROEFFNUNGSTEXT}</pre>
        </div>
      )}

      {offen === "token" && (
        <div className="mt-2 rounded-md bg-black/40 p-3 text-left text-[11px] leading-relaxed">
          <div className="mb-2 text-mint-50">
            Das Token heißt <b>adventshaus-postfach</b>. Es steht nirgends im Projekt – GitHub zeigt es nur einmal beim
            Erstellen. Wenn du es nicht mehr hast: löschen und neu erstellen (1 Minute).
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-mint-200">
            <li>
              <a href={LINKS.token} target="_blank" rel="noopener" className="text-amber-glow underline">
                Token-Liste öffnen
              </a>{" "}
              – steht <b>adventshaus-postfach</b> da und ist nicht abgelaufen? Dann hast du es irgendwo notiert; sonst
              weiter.
            </li>
            <li>
              Altes Token dort <b>Delete</b>, dann{" "}
              <a href={LINKS.tokenNeu} target="_blank" rel="noopener" className="text-amber-glow underline">
                neues Token anlegen
              </a>{" "}
              (Link füllt alles vor: nur „Gists: Read and write“, <b>kein</b> Repository-Zugriff) →{" "}
              <b>Generate token</b>.
            </li>
            <li>
              Token kopieren und der KI <b>in zwei Hälften, in zwei Nachrichten</b> schicken – sonst zieht GitHubs
              Scanner es sofort zurück.
            </li>
          </ol>
          <div className="mt-2 text-mint-400/80">
            Was das Token kann: Dateien im Postfach schreiben. Was es nicht kann: irgendetwas am Spiel-Repository ändern.
          </div>
        </div>
      )}
    </div>
  );
}
