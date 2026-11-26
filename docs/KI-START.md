# KI-START – Little Computer Luni · Das Adventshaus

**Die einzige Pflicht-Lektüre für jede KI-Sitzung.** Schlank gehalten; README,
Berater-Info, Spielkonzept und Merkzettel nur bei Bedarf. Diese Datei ist die führende
Quelle; der Eröffnungstext der Projektmanager-GUI wird daraus erzeugt.

- **Repo:** https://github.com/Chihuaua/adventshaus
- **Basis:** neuester Commit auf `main`. Kein Tag, außer ausdrücklich genannt (Tags hinken hinterher).
- **Eröffnungstext:** nur im Projektmanager („Eröffnungstext kopieren“). Im Spiel gibt es keine Übergabe-Leiste mehr.

## Projekt in einem Satz
Ruhiges Beobachtungsspiel im Stil von *Little Computer People* (1985). Luni lebt in
einem Haus (4 Ebenen) in Echtzeit (Europe/Berlin). Web ist der Prototyp, **Wii ist das
Endziel**. Zielbild (Adventskalender, zwei Hunde, Nikolaus/Postbote, Silvester) ist noch
nicht gebaut.

## Welten und Ausbau

Standardhaus ist **immer das Adventshaus** (leerer Hash oder unbekannte Adresse). Das normale Haus liegt auf `#haus`.

Welten: normal, traum, gruesel, weihnacht, adventshaus. Das Adventshaus (Hash `#adventshaus`,
Adventsstein rechts im Erdreich, in jeder Welt am selben Platz) ist die Zielwelt: ein Klon des Traumhauses, der über den
Adventskalender Stück für Stück zum fertigen Haus wird. Alle anderen Häuser sind
Entwicklungshäuser und landen nicht im Zielprojekt.

Der Ausbauplan liegt in `src/game/adventshaus-ausbau.ts`: 24 Stufen, eine pro Türchen
(Deko, Gegenstand, Bewohner, Ablauf, Ereignis). Echtes Datum, nachholbar, nie vorziehbar.
Eigene Schlüssel: `lcp1.welt.adventshaus.*` und `lcp1.advent.adventshaus.*`.
Vorschau einer Ausbaustufe ohne Speicheränderung: `#adventshaus/12`.
In allen anderen Welten ist jeder Schalter offen – ihr Verhalten bleibt unverändert.

STEINGRUPPEN (src/game/steine.ts): Alle Steine sind in jedem Haus sichtbar und haben die
Form und Größe der Renovierungssteine (flacher Kiesel, 24×26). Anordnung thematisch:
Ereignisse (Kranz, Post, Nikolaus) oben im Kies, darunter die neun Räume im Raster;
Routinen (Bett, EZ-Bett, Aufsteh, EZ-Aufsteh, Kaffee, EZ-Kaffee) dicht in einer Reihe
im Erdreich, darunter die Weltsteine. Haare: beim Bücken kurz (Gesicht bleibt frei),
nur beim Haarebürsten fallen sie wieder lang.

Renovierung: Für alle 9 Räume des Hauses liegt die Wand-Renovierung in `src/game/renovierung.ts` (`RENO_RAEUME`):
8 Tapetenräume wechseln „Bahn für Bahn“ (Leiter + Kleistereimer), das Badezimmer nutzt eine eigene
Fliesen-Methode („Fliese für Fliese“ von unten nach oben mit gekämmtem Kleber, Fliesenkreuzen,
Mörtelkübel/Zahnspachtel, Fliesenstapel und anschließendem Verfugen mit Fliesenschwamm).
Im normalen Haus und im Adventshaus liegen alle 9 Raum-Steine im 3×3-Raster auf dem linken Kiesteil
(`KIES_PLAETZE`, `RAUM_STEINE`). Vorschau der Stile weiterhin unter `#studio-renovierung`.

Luni renoviert Tapetenraeume in drei Durchgaengen: 1) Alte Tapetenbahnen grob abkratzen und
eingerollt nach unten tragen — unregelmaessige typische Tapetenreste bleiben kleben. 2) Mit der
Leiter zu den Resten gehen und jeden auf seiner Hoehe abkratzen. 3) Je neuer Bahn: Leiter
bewegen → hochklettern → Tapete rollt runter → runterklettern → Leiter weiterbewegen.
Viel Dreck bleibt am Boden liegen, bis Luni ihn mit dem Handfeger in einen Muellsack kehrt.
Abgeloeste Papierreste lagern in Muellsaecken unten im Keller (`src/game/muell.ts`,
`lcp1.welt.*.v1`); **nur Dienstags** steht die Muelltonne vor dem Haus, und Luni bringt
frische wie im Keller gelagerte Saecke durch die Haustuer hinaus. Badfliesen bleiben fix.
Fertige Waende/Badfliesen benutzen exakt die Maler des Weihnachtshauses (`zeichneHausWaende`,
Vergleich in `tools/test-renovierung.mjs`). Der Wohnzimmer-Stein renoviert zuerst den
Eingangsbereich und dann das Wohnzimmer. Moebel, Boeden und Spieloberflaeche bleiben unveraendert.

## Die vier Grundsätze (nicht verhandelbar)
1. **Zuschauen statt gewinnen** – keine Punkte, Balken, Game Over, Belohnungsschleifen.
2. **Echtzeit** – echte Uhr/Kalender (Europe/Berlin); Türchen nachholbar, nicht vorziehbar.
3. **Drei Zielplattformen** – PC-Browser, Handy (Touch), Wii; nichts bauen, was auf der Wii nicht nachbaubar ist.
4. **Alles handgezeichnet, keine Assets** – prozedural (Canvas 2D, WebAudio); keine Bild-, Font-, Audiodateien im Spiel.

## Türlogik (dauerhaft, nicht verhandelbar)

Luni öffnet und schließt alle Türen von sich aus – Schleuse, Gartentür, Verbindungstür,
Bad- und Haustür. Nur wenn sie **direkt vom Spieler** geschickt wird, kümmert er sich um die
Türen: sie öffnet dann höchstens, was in ihrem Weg steht, und lässt es offen. Ausnahmen sind
die bereits festgelegten Werte (vergessene Tür, vergessene Tasse, Zigaretten-Regeln, offene
Schleuse wird nicht noch einmal geöffnet). Die Markierung `tuerAuftrag` im Haus entscheidet
darüber; sie erlischt, sobald Luni stillsteht und nichts mehr vorhat.

## Plattformregeln
- Nur Canvas-Primitive in der 960×600-Bühne; kein DOM/HTML-Text/CSS in der Spielwelt.
- Keine Browser-Spezialitäten in `src/game/` (kein fetch, keine Web-Fonts/Bild-URLs/externen Dienste).
- Jede Interaktion ohne Maus: Zeiger **und** Durchschalten + Bestätigen; Ziele sind benannte Stationen in `STATIONS`; sichtbarer Fokus-Ring.
- Fernsehtauglich: Klickziele ≥ 24×24, Schrift ≥ 10 Einheiten, keine Info nur über Hover.
- **Wii: 4:3 UND 16:9 müssen beide unterstützt werden.** Nichts Wichtiges in den äußeren 10 % links/rechts (4:3-Beschnitt), äußere 5 % frei (Overscan).
- Speicherung als Schlüssel/Wert (SD-Karten-fähig); Audio nur synthetisch.

## Verbindliche Oberfläche im Spiel (nur diese Elemente)
- Kopfzeile (`LUNIS HAUS`, Untertitel, `LUNI-STUDIO →`, Tonknopf) · Monitorrahmen (Canvas 8:5, max. 1140 px) · Hintergrund `.bg-room .grid-floor`.
- **Keine Übergabe-Leiste im Spiel.** Eröffnungstext, Postfach und Freigaben liegen im Projektmanager.
- **Verboten:** Spielbeschreibung darüber, Steuerungserklärung/Fußzeile darunter, Footer/Credits/Versionszeile, zusätzliche Panels/Karten, neue Komponenten ums Spiel, Änderungen an `.bezel`/`.screen-glass`/`.bg-room`/Canvas-Größe.
- **Hovertexte im Canvas exakt:** `600 11px "Space Grotesk"`, Text `#eef7f2`, Hintergrund `rgba(8,20,26,.88)`, Boxhöhe 20, Radius 5, Innenabstand 8 – nicht vergrößern, nicht durch HTML ersetzen.

## Regel 0 – Nichts Ungefragtes
Klonen und ausführen, nicht nachbauen. Layout, Texte, Schriftgrößen, Hover-Labels,
Rahmen, Buttons bleiben exakt. Geändert wird nur, was die Aufgabe ausdrücklich verlangt.
Verbesserungen nur als Frage im Chat, nicht als Tat. Nichts löschen oder umbenennen ohne Auftrag.

## Arbeitsablauf / Postfach
- **Kein Token im Chat, Screenshot oder Repo.** Kein Token anfordern. Der Besitzer legt die Patch-Dateien selbst ins Postfach. Die KI liefert den Patch als Datei/ZIP.
- Basis = neuester `main`-Commit, kein Tag.
- Jede beauftragte Änderung erhält einen neuen Patch mit der nächsten freien Versionsnummer aus dem aktuellen Projektstand. Die Nummer ohne Rückfrage vergeben; ausdrücklich genannte Nummern beachten.
- Ablauf: klonen → bauen → zeigen → „ja“ → Patch als Datei/ZIP → Besitzer legt ins Postfach → Knopf → PR-Merge im Browser → Knopf (nachziehen + spiegeln).
- `main` ist geschützt (PR-Pflicht, keine Force-Pushes); Tags nie verschieben.
- Nur eine KI gleichzeitig ins Postfach; im Battle-Modus nur die benannte. Kennung KI-A/KI-B, jede Antwort mit Kennung; Umbenennung nur durch ausdrückliche Besitzer-Nachricht. Ist die Kennung unklar, vor Dateiänderungen fragen.

## Vor der Arbeit / Abnahme
- `git fetch origin && git log --oneline -1 origin/main`
- `ADVENTS_PROJ="$PWD" bash tools/check.sh | tail -4`
- **FEHLT** = Funktion weg → echter Fehler, anhalten und melden. **OFFEN** = geplante Aufgabe noch offen → Normalzustand, weiterarbeiten.
- Hartes Kriterium: **`Fehlt: 0`**. `Offen: 0` nur, wenn die Aufgabe genau diese offenen Punkte erledigt.
- Nach der Änderung erneut `check.sh | tail -4` und `git diff --stat` zeigen: nur die beauftragten Dateien, keine zusätzlichen.
- Ist eine Funktion scheinbar weg, zuerst Aufruf und Tageszeit prüfen, bevor sie als fehlend gemeldet wird.

## Prüfen und zeigen
- `./node_modules/.bin/tsc --noEmit && npm run build` fehlerfrei. **Niemals `npx tsc`.**
- Dev-Server in der Sandbox-Wurzel starten; `curl -s http://localhost:5173 | grep -o '<title>[^<]*</title>'` erwartet `Little Computer Luni · Das Adventshaus`, nicht `Ready to build`.
- Bei jeder aktualisierten Vorschau das UFO-ZIP aus genau diesem Stand neu erzeugen. Dateiname: `LCL-<kurzer Inhalt>-<laufende Nummer, zweistellig>.zip`, z. B. `LCL-weste-05.zip`; darin `aktuell.patch` und `aktuell.json`. Das UFO selbst bleibt außerhalb des Spielpatches.
- Laufende Szene zeigen und Klicks im Browser prüfen. Arbeite klein: ein Schritt, eine Prüfung; Antworten/Ausgaben kurz (tail/head), keine kompletten Protokolle.
- Keine Dateiinhalte zum Abtippen, sondern einen Patch. Bilder aus dem Chat sind Anhänge, keine Projektdateien; nichts davon ins Repository legen.

## Technik-Schutzplanken (dauerhaft)
- Config nicht ohne Absprache: `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts` (kein `npm install`, kein `npm audit fix`).
- `resize()`-Fix in `house.ts` nicht anfassen.
- Entfernte Altlasten nicht zurückholen: Kamin, PDF-Download, `engine.ts`, `Hud.tsx`, `Overlays.tsx`, `TouchControls.tsx`.
- Spiellogik in `src/game/`, React nur in `src/components/`; `House` weiß nichts von React.
- Deutsch in Kommentaren, Labels, Commit-Messages.
- Alle anderen Dateien sind im Rahmen der Aufgabe änderbar.

## Kommunikation mit dem Besitzer
- Besitzer ist kein Programmierer; keine Code-Lesekenntnisse voraussetzen – Prüfungen sind Befehle mit Zahlen.
- Nie auf frühere Nachrichten verweisen; alles Nötige steht an Ort und Stelle.
- Immer Ort (Terminal/Editor/Browser/Schreibtisch) + erwartetes Ergebnis nennen; ein Schritt pro Nachricht bei Überforderung.
- Vorschau muss aus der Sandbox-Wurzel laufen (nicht Unterordner), sonst zeigt Arena das leere Template.

## Ausdrücklich abgelehnt
Zugangsdaten in Chat/Screenshot/Repo · ungenaue Anweisungen · mehrere parallele Projektordner · Überschreiben großer Dateien durch KI · ungefragte „Verbesserungen“.
