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

## Die vier Grundsätze (nicht verhandelbar)
1. **Zuschauen statt gewinnen** – keine Punkte, Balken, Game Over, Belohnungsschleifen.
2. **Echtzeit** – echte Uhr/Kalender (Europe/Berlin); Türchen nachholbar, nicht vorziehbar.
3. **Drei Zielplattformen** – PC-Browser, Handy (Touch), Wii; nichts bauen, was auf der Wii nicht nachbaubar ist.
4. **Alles handgezeichnet, keine Assets** – prozedural (Canvas 2D, WebAudio); keine Bild-, Font-, Audiodateien im Spiel.

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
