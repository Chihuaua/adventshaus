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

export const EROEFFNUNGSTEXT = `Repository: https://github.com/Chihuaua/adventshaus
Basis: main – neuerster Commit. Verwende keinen Tag, außer ich nenne ihn ausdrücklich; Tags können hinter main zurückfallen.

Kennung: Ich adressiere dich mit KI-A: oder KI-B:. Ist die Kennung unklar oder widersprüchlich, frage nach, bevor du Dateien änderst. Nur die von mir benannte Sitzung schreibt ins Postfach. Eine Umbenennung gilt nur, wenn ich sie mit „Namensänderung KI-A: …“ oder „Namensänderung KI-B: …“ ausspreche.

Regel 0: Klone den Stand in die Sandbox-Wurzel, nicht in einen Unterordner, und führe ihn aus. Baue ihn nicht nach. Ändere nur, was ich ausdrücklich verlange: keine Texte, Erklärungen, Buttons, Styles, Größen oder neuen Komponenten um das Spiel. Keine neuen npm-Pakete. Nichts löschen oder umbenennen ohne Auftrag.

Vor der Arbeit:
  git fetch origin && git log --oneline -1 origin/main
  ADVENTS_PROJ="$PWD" bash tools/check.sh | tail -4

Ausgabe lesen: „Fehlt: 0“ ist Pflicht. „FEHLT“ heißt: eine vorhandene Funktion ist verloren – anhalten und melden, nicht weiterbauen. „Offen“ bezeichnet nur bewusst offene Punkte aus docs/FEATURES.md und ist kein Fehler.

Lies README.md vollständig, besonders Grundsätze, Regel 0 und den Arbeitsablauf. Lies docs/BERATER-INFO.md nur, wenn ich es sage. Prüfe, ob alle genannten Dateien auf main existieren; fehlt eine, frage nach, statt zu raten.

Prüfen und zeigen:
  ./node_modules/.bin/tsc --noEmit && npm run build
Niemals npx tsc. Starte den Dev-Server in der Wurzel und prüfe:
  curl -s http://localhost:5173 | grep -o '<title>[^<]*</title>'
Erwartet: Little Computer Luni · Das Adventshaus. Steht dort etwas anderes oder „Ready to build“, ist die Vorschau falsch. Zeig mir einen Screenshot der laufenden Szene und prüfe Klicks im Browser.

Arbeite klein: ein Schritt, eine Prüfung. Halte Antworten und Ausgaben kurz (tail/head); keine kompletten Protokolle. Keine Dateiinhalte zum Abtippen, sondern einen Patch.

Nicht anfassen: src/game/original.ts, src/StudioApp.tsx, src/App.tsx, der resize()-Fix in house.ts, package.json, package-lock.json, index.html, vite.config.ts, tsconfig.json, .bezel, .screen-glass, .bg-room, Canvas 960×600.
Nicht zurückholen: Kamin, PDF-Download, engine.ts, Hud.tsx, Overlays.tsx, TouchControls.tsx.
Bilder aus dem Chat sind Anhänge, keine Projektdateien. Das Projekt bleibt assetfrei; nichts davon ins Repository legen.

Basis prüfen: Ein Patch muss auf dem aktuellen origin/main aufsetzen. Weicht die Basis ab, neu aufsetzen und den alten Patch nicht einspielen. Ist eine Funktion scheinbar weg, prüfe zuerst den Aufruf und die Tageszeit, bevor du sie als fehlend meldest.

Token und Postfach: Fordere den Postfach-Token nur an, wenn ein fertiger Patch abgelegt werden soll. Ich schicke ihn in zwei Hälften; er darf nur Gists lesen und schreiben. Gib ihn nie aus, schreibe ihn nicht ins Projekt und widerrufe ihn nach Gebrauch. Zum Klonen und Lesen ist kein Token nötig.

Abschluss:
  ADVENTS_PROJ="$PWD" bash tools/check.sh | tail -4
  git diff --stat
Zeige beides. Erwartet: Fehlt 0 und ausschließlich die besprochenen Dateien. Erst nach meinem ausdrücklichen „ja“: Patch mit git format-patch -1 --stdout als aktuell.patch und die ersten 16 Zeichen von sha256 als aktuell.json ins Postfach legen, beide gemeinsam. Nie direkt ins Repository schreiben.

Aufgabe: Noch keine. Zeige mir zuerst den geklonten Stand unverändert, die Prüfergebnisse und die laufende Vorschau. Frage nach der Kennung, falls ich sie nicht genannt habe, und warte dann auf meine Aufgabe.`

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
            Ist in der Zwischenablage. In den neuen Chat einfügen (Strg+V) und abschicken – so wie er ist. Die KI
            zeigt dann den Stand und fragt nach dem Token; die eigentliche Aufgabe nennst du danach.
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
