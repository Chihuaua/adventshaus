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

    Repository: https://github.com/Chihuaua/adventshaus – Stand: Tag v0.5
    Lies README.md komplett, besonders "Grundsätze" und "Arbeitsablauf mit
    KI-Assistenten", und halte dich daran. Klone den Stand, bestätige, dass
    er baut, und zeig mir das Feature lauffähig, bevor du mir einen Patch
    gibst. Aufgabe: ...

Falls die KI kein GitHub lesen kann – einzelne Dateien als Rohtext:

    https://raw.githubusercontent.com/Chihuaua/adventshaus/main/README.md
    https://raw.githubusercontent.com/Chihuaua/adventshaus/main/src/game/house.ts

Nachher: Patch einspielen (D) → Schritt A → Schritt B.
Nie zwei Chats gleichzeitig an denselben Dateien.

----------------------------------------------------------------------

## D. Änderungen einer KI übernehmen

Normalweg – Pull Request (die KI hat ein Token für ki/-Zweige):

1. Die KI zeigt das Feature in ihrer Vorschau. Gefällt es → "ja".
2. Die KI öffnet eine Pull Request und schickt den Link.
3. Link öffnen → Reiter "Files changed" → Änderungen anschauen
   (grün = neu, rot = entfernt).
4. Reiter "Conversation" → unten "Merge pull request" → "Confirm merge".
5. Am Rechner nachziehen:   bash ~/p.sh
   Du solltest sehen:        AKTUALISIERT AUF <commit> – Typen OK, Build OK
6. Bei Meilenstein: Tag setzen (Abschnitt A).

Gefällt die PR nicht: Kommentar in der PR schreiben oder im Chat sagen –
die KI schiebt eine Korrektur auf denselben Zweig nach, die PR aktualisiert
sich von selbst. Oder "Close pull request" – dann passiert nichts.

Rückfall – Patch-Datei (KI ohne Token):

    kate ~/patch.patch   →  Strg+V  →  Strg+S  →  schließen
    cd ~/projekte/adventshaus && git am < ~/patch.patch
    Schlägt es fehl:  git am --abort   und Ausgabe in den Chat

Rückgängig (alles seit letztem Commit verwerfen):

    git checkout -- . && git clean -fd

Hinweis: Direkt nach main pushen geht nicht mehr (Schutzregel). Eigene
Änderungen ebenfalls über einen Zweig + Pull Request – oder die KI machen
lassen.

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
