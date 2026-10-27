# Merkzettel – Adventshaus sichern & weitergeben

Arbeitsordner: `~/projekte/adventshaus`
GitHub:        https://github.com/Chihuaua/adventshaus
Spiegel:       `~/sicherung/adventshaus.git`

Faustregel: Nichts passiert automatisch. Eine Änderung ist erst sicher,
wenn sie committet UND gepusht UND gespiegelt ist.

----------------------------------------------------------------------

## A. Online sichern (GitHub) – nach jeder Arbeitssitzung

    cd ~/projekte/adventshaus
    git status                      # was hat sich geändert?
    git add -A
    git commit -m "Kurz: was geändert wurde"
    git push

Bei einem Meilenstein zusätzlich (Nummer hochzählen):

    git tag -a v0.4 -m "Was dieser Stand kann"
    git push origin v0.4

Prüfen: https://github.com/Chihuaua/adventshaus → Commit-Text sichtbar?

----------------------------------------------------------------------

## B. Lokal sichern (Spiegel) – nach jedem Push

Einmalig anlegen:

    mkdir -p ~/sicherung
    git clone --mirror ~/projekte/adventshaus ~/sicherung/adventshaus.git

Ab dann aktualisieren (ein Befehl):

    git -C ~/sicherung/adventshaus.git fetch --all --prune

Kopie auf USB/externe Platte: Ordner ~/sicherung/ komplett kopieren.

Wiederherstellen (falls Arbeitsordner kaputt):

    git clone ~/sicherung/adventshaus.git ~/projekte/adventshaus
    cd ~/projekte/adventshaus && npm ci

----------------------------------------------------------------------

## C. Einer anderen KI zur Verfügung stellen

Vorher: Schritt A ausführen (push + Tag), sonst sieht die KI alten Stand.

Eröffnungstext in den neuen Chat kopieren (Tag und Aufgabe anpassen):

    Ich arbeite an einem Browserspiel (React/Vite/TypeScript, Canvas 2D).
    Repository: https://github.com/Chihuaua/adventshaus – Stand: Tag v0.3
    Lies zuerst README.md (Spiel, Codeaufbau, Regeln für Änderungen).
    docs/spielkonzept.md ist das Zielbild, nicht der Ist-Stand.
    Ich kann keine ZIPs hochladen, du kannst nicht ins Repository schreiben:
    Gib mir Änderungen als vollständige Dateien oder als Shell-Skript,
    das ich lokal ausführe. Ich teste mit
    `npx tsc --noEmit && npm run build` und committe selbst.
    Aufgabe heute: ...

Falls die KI kein GitHub lesen kann – einzelne Dateien als Rohtext:

    https://raw.githubusercontent.com/Chihuaua/adventshaus/v0.3/README.md
    https://raw.githubusercontent.com/Chihuaua/adventshaus/v0.3/src/game/house.ts

Nachher: Änderungen übernehmen → testen → Schritt A → Schritt B.
Nie zwei Chats gleichzeitig an denselben Dateien.

----------------------------------------------------------------------

## D. Änderungen einer KI übernehmen

1. Datei(en) oder Skript aus dem Chat kopieren
2. Einfügen:  kate ~/pfad/datei   →  Strg+V  →  Strg+S  (nicht vergessen!)
   Skript:    bash ~/skript.sh
3. Testen:    cd ~/projekte/adventshaus && npx tsc --noEmit && npm run build
4. Anschauen: npm run dev  →  http://localhost:5173/  →  Strg+C
5. Sichern:   Schritt A, dann B

Rückgängig (alles seit letztem Commit verwerfen):

    git checkout -- . && git clean -fd

----------------------------------------------------------------------

## E. Nie tun

- Terminal-AUSGABE zurück ins Terminal einfügen (nur Befehle aus Kästen)
- npm install <paket> / npm audit fix  ohne Absprache (ändert package-lock)
- git init  in einem anderen Ordner als ~/projekte/adventshaus
- Mittlere Maustaste im Terminal (fügt sofort ein und führt aus)

----------------------------------------------------------------------

## F. Nachschlagen

    git log --oneline            # Verlauf
    git tag                      # alle Meilensteine
    git diff                     # was ist ungesichert?  (q = verlassen)
    git show v0.2:src/game/house.ts   # alte Version einer Datei ansehen
    gh auth status               # GitHub-Anmeldung prüfen

Pfad kopieren:  Strg+Umschalt+C   Einfügen:  Strg+Umschalt+V
