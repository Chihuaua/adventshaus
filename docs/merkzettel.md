# Merkzettel – Adventshaus sichern & weitergeben

Arbeitsordner: `~/projekte/adventshaus`
GitHub:        https://github.com/Chihuaua/adventshaus
Spiegel:       `~/sicherung/adventshaus.git`

Faustregel: Nichts passiert automatisch. Eine Änderung ist erst sicher,
wenn sie committet UND gepusht UND gespiegelt ist.

----------------------------------------------------------------------

## A. Online sichern (GitHub)

Normalfall: Der Knopf erledigt das. Falls du doch einmal selbst etwas
geändert hast (Notlösung D) – main ist geschützt, also über einen Zweig:

    cd ~/projekte/adventshaus
    git status                      # was hat sich geändert?
    git add -A
    git commit -m "Kurz: was geändert wurde"
    git switch -c eigene-aenderung && git push -u origin eigene-aenderung
    gh pr create --fill && gh pr merge --merge   # dann Knopf drücken

Bei einem Meilenstein zusätzlich (Nummer hochzählen):

    git tag -a v0.4 -m "Was dieser Stand kann"
    git push origin v0.4

Prüfen: https://github.com/Chihuaua/adventshaus → Commit-Text sichtbar?

----------------------------------------------------------------------

## B. Lokal sichern (Spiegel)

Normalfall: Der Knopf aktualisiert den Spiegel bei jedem Druck.

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

Vorher: Knopf drücken (zieht alles nach), bei Meilenstein Tag setzen (A).

Eröffnungstext: Spiel starten (Knopf → Enter) → unter dem Haus Leiste
"ÜBERGABE" → "Eröffnungstext kopieren" → im neuen Chat Strg+V.
Daneben "Token – wo?" zeigt den Weg zum Token. Zur Sicherheit der Text:

    Repository: https://github.com/Chihuaua/adventshaus – Stand: main
    Lies README.md komplett, besonders "Grundsätze" und "Arbeitsablauf mit
    KI-Assistenten", und halte dich daran. Klone den Stand, bestätige, dass
    er baut, zeig mir das Feature lauffähig – und lege es erst nach meinem
    "ja" ins Postfach (Gist-Token bekommst du von mir). Ich übernehme per
    Knopf. Aufgabe: ...

Dann das Gist-Token geben: GitHub → Settings → Developer settings →
Fine-grained tokens → "adventshaus-postfach". Falls abgelaufen: neues mit
NUR "Gists: Read and write", kein Repository-Zugriff. Im Chat in zwei
Hälften schicken, damit GitHubs Scanner es nicht zurückzieht.

Nie zwei Chats gleichzeitig an denselben Dateien.

----------------------------------------------------------------------

## D. Änderungen einer KI übernehmen – der Knopf

Vorher: Die KI zeigt das Feature in ihrer Vorschau. Gefällt es → "ja".
Die KI legt es ins Postfach. Dann:

1. Doppelklick auf "Adventshaus" (Desktop)
   Du siehst:  Neu im Postfach: <Titel>  →  Enter
               Pruefsumme OK · Patch passt · Typen OK, Build OK
               Liegt zum Freigeben bereit: <Link>   (Browser öffnet sich)
2. Im Browser: Reiter "Files changed" anschauen (grün = neu, rot = weg)
   → "Merge pull request" → "Confirm merge"
3. Noch ein Doppelklick auf "Adventshaus"
   Du siehst:  + <hash> <Titel> · Typen OK, Build OK · Spiegel aktualisiert
               Spiel starten? → Enter, wenn du willst

Gefällt die Änderung im Browser doch nicht: "Close pull request" statt
Merge – dann passiert nichts. Der KI im Chat sagen, was anders soll.

Meldungen des Knopfs:

    Bereits aktuell            alles in Ordnung, nichts zu tun
    bereits eingespielt        dieser Patch wurde schon übernommen
    Postfach nicht erreichbar  kein Internet / GitHub down – später nochmal
    Pruefsumme stimmt nicht    Download abgebrochen – nochmal drücken
    Patch passt nicht          KI muss auf neuen Stand setzen – Zeile in den Chat
    ✗ FEHLER: ...              Zeile in den Chat

Knopf neu installieren oder aktualisieren (eine Zeile, Terminal):

    curl -fsSL "https://gist.githubusercontent.com/Chihuaua/f28cc85bf67f8a7f2fa6251a2092a33c/raw/install-knopf.sh?t=$(date +%s)" | bash

Notlösung ohne Postfach (KI liefert Patch im Chat):

    kate ~/patch.patch  →  einfügen  →  Strg+S
    cd ~/projekte/adventshaus && git am < ~/patch.patch
    Schlägt es fehl:  git am --abort   und Ausgabe in den Chat

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
