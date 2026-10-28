# Little Computer Luni – Das Adventshaus

Ein ruhiges Beobachtungsspiel im Stil von *Little Computer People* (1985).
Luni lebt in einem Haus mit vier Ebenen. Das Spiel läuft in **Echtzeit (MEZ)**:
Die Uhr im Wohnzimmer zeigt die echte Uhrzeit, der Himmel hinter den Fenstern
folgt der Tageszeit, abends gehen die Lampen an.

**Es gibt keine Punkte, keine Lebensbalken, keine Niederlage.** Die einzige
Steuerung: Ein Klick auf ein Objekt schickt Luni dorthin. Sie läuft selbst,
nimmt Treppen, öffnet Türen – und lehnt ab, wenn es gerade nicht passt.

Langfristiges Ziel (siehe `docs/`): ein Adventskalender ab 1. Dezember,
zwei Hunde, Besuch von Nikolaus und Postbote, Silvester-Rückblick.
**Davon ist noch nichts gebaut** – der aktuelle Stand ist das Haus und Lunis Alltag.

Die Web-Version ist der Prototyp. **Das Spiel soll am Ende auf PC, Handy und
Nintendo Wii laufen** – daraus folgen feste Grundsätze, siehe nächster Abschnitt.

---

## Grundsätze (gelten für jede Änderung)

Dieses Projekt ist **das Haus als Adventskalender im Stil von Little Computer
People**. Vier Grundsätze stehen über allem anderen und sind nicht verhandelbar:

1. **Zuschauen statt gewinnen.** Keine Punkte, keine Balken, kein Game Over,
   keine Belohnungsschleifen. Luni wird beobachtet, nicht gesteuert.
2. **Echtzeit.** Das Haus lebt nach der echten Uhr (Europe/Berlin). Der
   Adventskalender folgt dem echten Kalender.
3. **Drei Zielplattformen: PC-Browser, Handy (Touch) und Nintendo Wii.**
   Die Web-Version ist der Prototyp; die Wii-Fassung (Homebrew, C++/libogc/GX)
   ist das Endziel. Deshalb wird nichts gebaut, was sich dort nicht nachbauen
   lässt – siehe „Plattformregeln“.
4. **Alles handgezeichnet, keine Assets.** Haus, Figur, Himmel, Rauch und
   Geräusche entstehen prozedural (Canvas 2D, WebAudio). Keine Bild-, Font-
   oder Audiodateien im Spiel.

### Plattformregeln (Folgen aus Grundsatz 3)

- **Nur Canvas-Primitive in der Spielwelt** (rect, rrect, disc, poly, line,
  Gradienten, Composite-Modi). Keine DOM-Elemente, kein HTML-Text, keine
  CSS-Effekte *innerhalb* der 960×600-Bühne. Der Monitor-Rahmen drumherum
  darf Web-Technik sein – er wird nicht portiert.
- **Keine Browser-Spezialitäten in `src/game/`**: kein `fetch`, keine
  Web-Fonts, keine Bilder per URL, keine externen Dienste. Text in der
  Spielwelt wird mit Primitiven gezeichnet oder als Pixelschrift selbst
  gerastert.
- **Jede Interaktion muss ohne Maus funktionieren.** Zeiger (Maus, Finger,
  Wii-Remote) *und* Durchschalten + Bestätigen (Steuerkreuz + A). Jedes
  anklickbare Objekt ist eine **Station** in `STATIONS` – nie ein verstecktes
  Pixelziel. Ein sichtbarer Fokus-Ring ist Pflicht, sobald Tastatur-/
  Controller-Steuerung eingebaut wird.
- **Fernseher-tauglich.** Klickziele mindestens **24×24 Bühneneinheiten**,
  Schrift in der Spielwelt mindestens **10 Einheiten** hoch, keine Information
  nur über Hover (Touch und Wii haben kein Hover). Wichtiges nicht in die
  äußeren 5 % des Bildes (Overscan auf Röhrenfernsehern).
- **Seitenformat.** Die Bühne ist 960×600 (16:10). Die Wii gibt 4:3
  (640×480) oder 16:9 aus. **Diese Entscheidung ist offen** (siehe unten);
  bis dahin gilt: Nichts Wichtiges in die äußeren 10 % links/rechts
  platzieren, damit ein späterer Beschnitt auf 4:3 möglich bleibt.
- **Speicherung plattformneutral denken.** Spielstände als einfache
  Schlüssel/Wert-Struktur (`storage.ts`), die sich 1:1 auf eine SD-Karte
  schreiben lässt – kein Browser-spezifisches Format.
- **Audio bleibt synthetisch.** Alle Klänge aus `audio.ts` müssen mit
  Oszillator + Rauschen + Hüllkurve beschreibbar sein, damit sie auf der Wii
  nachgebaut werden können.

### Offene Grundsatzentscheidung

- **Wii-Seitenformat: 4:3 oder 16:9?** 4:3 entspricht dem Konzept
  (640×480), erfordert aber eine schmalere Komposition des Hauses. 16:9
  erhält das heutige Layout fast unverändert und passt zu modernen
  Fernsehern. Bis zur Entscheidung gilt die 10-%-Randregel oben.

---

## Starten

Voraussetzung: Node.js ≥ 20.19 (getestet mit 20 und 24).

```bash
npm ci          # Pakete exakt nach package-lock.json installieren
npm run dev     # Entwicklungsserver, dann http://localhost:5173/
npm run build   # erzeugt dist/index.html – eine einzige, eigenständige Datei
```

`npm run build` muss fehlerfrei durchlaufen. Zusätzlich `npx tsc --noEmit`
für die Typprüfung (Vite prüft keine Typen).

**Niemals `npm install <paket>` oder `npm audit fix` ohne Absprache** – das
verändert `package-lock.json`, und damit ist die Umgebung nicht mehr
reproduzierbar.

---

## Was das Spiel heute kann

| Bereich | Stand |
|---|---|
| Haus | Querschnitt mit 4 Ebenen: Keller (Krempelraum, Raucherraum, Garten), Erdgeschoss (Flur, Wohnzimmer, Küche), 1. Stock (Schlafzimmer, Bad mit WC), Dachgeschoss (Gaming-Ecke, Musikzimmer) |
| Grafik | Komplett in Canvas 2D gezeichnet, keine Bilddateien. Tag/Nacht-Himmel, Lampenlicht als Multiply/Additiv-Ebene, Rauch |
| Luni | ~30 Posen und Gesichtsausdrücke (`luni.ts`), Laufen, Treppen, Sitzen, Dösen, Tanzen |
| Interaktion | 32 anklickbare Stationen (plus 3 Treppen) (`STATIONS` in `house.ts`): Kaffee, Tee, Herd, Bett, Dusche, WC, Klavier, Saxophon, Plattenspieler, Gitarre, Gaming … |
| Detail-Systeme | Zigaretten stopfen → Schachtel → Raucherraum → Aschenbecher, Rauch der durch die Gartentür abzieht; WC-Tür mit Innen/Außen-Logik; Handy am Beistelltisch; Rick-Fernseher |
| Ton | WebAudio-Synth (`audio.ts`), stummschaltbar (Taste **M** oder Button), Einstellung wird gespeichert |
| Werkzeug | `#studio` in der URL öffnet das **Luni-Studio**: alle Posen/Ausdrücke nebeneinander, Vergleich mit der Ursprungsfigur |

Was Luni **nicht** tut: von selbst etwas unternehmen. Ohne Klick steht sie.
Ein eigener Tagesablauf ist in `docs/` beschrieben, aber nicht umgesetzt.

---

## Aufbau

```
src/
  main.tsx              Einstieg (React StrictMode)
  App.tsx               Weiche: "#studio" → StudioApp, sonst HouseView
  StudioApp.tsx         Figuren-Studio (Entwicklungswerkzeug, kein Spielinhalt)
  components/
    HouseView.tsx       Rahmen um das Canvas, Ton-Button, erzeugt `new House(canvas)`
    Icons.tsx           UI-Icons (derzeit nur sound/mute)
    LuniStage.tsx       Studio: einzelne Pose animiert
    LuniSheet.tsx       Studio: Übersichtsblätter
    Compare.tsx         Studio: Luni neben der Ursprungsfigur
  game/
    house.ts            DAS SPIEL. Zeichnen des Hauses, Stationen, Wegfindung,
                        Aktionen, Hauptschleife, Zustand (~4000 Zeilen)
    luni.ts             Figur: Posen, Ausdrücke, Zeichenroutine, Zzz, Husten
    audio.ts            Synth-Sounds
    storage.ts          localStorage (derzeit nur Ton an/aus)
    original.ts         Ursprungsfigur aus dem Vorgängerprojekt, nur fürs Studio
  index.css             Tailwind + CRT-Rahmen, Scanlines, Glas
docs/                   Spielkonzept (Markdown) – Zielbild, nicht Ist-Stand
build_mappe.py          erzeugt aus docs/ eine druckbare Projektmappe (optional)
```

### Wie `house.ts` tickt

- **Koordinaten:** Spielwelt ist fest 960×600 (`W`, `H`). Alles wird in
  diesen Einheiten gezeichnet und per `scale * dpr` auf das Canvas skaliert.
  Bodenlinien: `FLOOR_Y = [572, 448, 324, 200]` (Keller → Dach).
- **Statisch vs. dynamisch:** `renderStatic()` malt Himmel, Haus und Möbel
  **einmal** auf Zwischenflächen (`bg`, `sky`, `mul`, `add`) und setzt
  `dirty = false`. `draw()` kopiert sie jeden Frame und zeichnet nur
  Bewegliches darüber (Türen, Bildschirme, Uhr, Luni, Rauch, Licht, Feuer).
  Wer etwas Statisches ändert, setzt `this.dirty = true`.
- **Stationen:** `STATIONS` ist die Liste aller anklickbaren Dinge mit
  Position, Etage, Hitbox und Label. `pick()` findet die Station unter dem
  Mauszeiger, `command(id)` startet die Aktion, `updateActions()` führt sie
  über die Zeit aus, `buildPath()` plant den Weg über Treppen.
- **Zeit:** `berlinNow()` liefert die echte MEZ-Uhrzeit; `setClock()` setzt
  eine feste Zeit (für Tests und Screenshots).

---

## Arbeitsablauf mit KI-Assistenten (verbindlich)

Der Besitzer dieses Projekts (GitHub: **Chihuaua**) ist kein Programmierer.
Er arbeitet mit KI-Assistenten, die **nicht** in dieses Repository schreiben
können. Damit das trotzdem reibungslos läuft, gilt ein fester Ablauf.
Wer als KI hier mitarbeitet, hält sich daran – ohne Nachfrage.

### Regel 0: Nichts Ungefragtes

Der Assistent **klont und führt aus** – er baut nicht nach. Der geklonte Stand
ist die Wahrheit: Layout, Texte, Schriftgrößen, Hover-Labels, Rahmen, Buttons
bleiben exakt so, wie sie sind. Hinzugefügt oder verändert wird **nur**, was
die Aufgabe ausdrücklich verlangt. Keine Spielbeschreibung über dem Haus,
keine Steuerungserklärung darunter, keine „Verbesserungen“ nebenbei.
Wer etwas für verbesserungswürdig hält, schlägt es im Chat vor – als Frage,
nicht als Tat.

Beim ersten Test dieses Ablaufs hat eine KI das Haus zwar 1:1 nachgebaut,
aber ungefragt Erklärtexte, größere Hover-Labels und ein anderes Drumherum
ergänzt. Genau das soll diese Regel verhindern.

### Zwei Ansichten: Entwicklung und Spiel

| Ansicht | Start | Zeigt |
|---|---|---|
| **Entwicklung** | `npm run dev` | Spiel **plus** Leiste „ÜBERGABE“ unter dem Haus (Eröffnungstext, Token-Weg, Postfach, Freigaben) |
| **Spiel** | `npm run build` → `dist/index.html` | nur das Spiel – die Leiste ist absichtlich nicht enthalten |

Fehlt die Leiste, ist das kein Fehler, sondern der Produktionsbuild.

### Rollen

| Wer | Macht | Macht nicht |
|---|---|---|
| **Besitzer** | entscheidet, schaut an, testet lokal, committet, pusht, taggt | Code schreiben |
| **KI-Assistent** | klont das Repository in seine Umgebung, baut dort das Feature, zeigt es lauffähig, liefert einen Patch | direkt ins Repository schreiben, Dateien zum Abtippen diktieren |

### Der Ablauf in fünf Schritten

1. **Klonen, nicht raten.** Der Assistent holt sich den aktuellen Stand selbst
   (`git clone https://github.com/Chihuaua/adventshaus.git`, Tag oder Commit
   wie vom Besitzer genannt) und arbeitet in dieser Kopie. Er fragt nicht nach
   Dateiinhalten, die er selbst lesen kann.
2. **Bauen und zeigen.** Das Feature wird in der Kopie umgesetzt, mit
   `npx tsc --noEmit && npm run build` geprüft und – wo die Umgebung es
   erlaubt – **lauffähig vorgeführt** (z. B. Arena-Vorschau, Screenshot,
   headless gerendertes Bild). Der Besitzer beurteilt das Ergebnis, bevor er
   irgendetwas übernimmt. *Anschauen zuerst, Übernehmen danach.*
3. **Ins Postfach legen.** Nach Freigabe legt der Assistent die Änderung als
   Git-Patch ins **Postfach** – ein öffentlicher GitHub-Gist, siehe unten.
   Ein Feature = ein Patch = ein Commit mit deutscher Message (*was* und
   *warum*).
4. **Der Knopf.** Der Besitzer drückt auf seinem Desktop den Knopf
   „Adventshaus“. Der holt den Patch aus dem Postfach, prüft die Prüfsumme,
   spielt ihn auf einen Zweig `ki/<thema>` ein, prüft Typen und Build und
   öffnet eine Pull Request gegen `main`. Direkt nach `main` kann niemand
   pushen (Ruleset „main schuetzen“: PR erforderlich, keine Force-Pushes).
5. **Merge per Klick, dann noch ein Knopfdruck.** Der Besitzer liest die
   Änderung auf GitHub („Files changed“), klickt **Merge pull request**, drückt
   den Knopf erneut – der zieht den Rechner nach und aktualisiert den Spiegel.
   Tags setzt der Besitzer selbst, wenn ein Stand ein Meilenstein ist.

### Das Postfach – so legt ein Assistent eine Änderung ab

Das Postfach ist der Gist **`f28cc85bf67f8a7f2fa6251a2092a33c`** des Kontos
Chihuaua: https://gist.github.com/Chihuaua/f28cc85bf67f8a7f2fa6251a2092a33c
Öffentlich lesbar; beschreibbar nur mit einem Token, das **ausschließlich
Gists** darf (der Besitzer gibt es im Chat). Es kann nichts im Repository
verändern.

Dort liegen immer diese Dateien:

| Datei | Inhalt |
|---|---|
| `aktuell.patch` | der Patch, erzeugt mit `git format-patch -1 --stdout` |
| `aktuell.json` | `{"datei":"aktuell.patch","sha256":"<erste 16 Hex-Zeichen von sha256(aktuell.patch)>","titel":"<Commit-Betreff>","basis":"<kurzer Hash von origin/main>"}` |
| `install-knopf.sh` | Installer des Knopfs – nur ändern, wenn der Knopf selbst verbessert wird |
| `adventshaus-knopf.sh` | der Knopf (Referenz; der Installer bettet ihn ein) |

Ablegen per GitHub-API: `PATCH https://api.github.com/gists/<id>` mit
`files.aktuell.patch.content` und `files.aktuell.json.content` – **immer beide
gemeinsam**. Der Knopf merkt sich eingespielte Prüfsummen; derselbe Patch ein
zweites Mal bewirkt nichts.

Der Patch muss auf dem **aktuellen `origin/main`** aufsetzen. Meldet der Knopf
„Patch passt nicht“, auf den aktuellen Stand rebasen und erneut ablegen.

*Notlösung ohne Postfach-Token:* Patch im Chat liefern; der Besitzer legt ihn
als `~/patch.patch` ab und führt `cd ~/projekte/adventshaus && git am <
~/patch.patch` aus. Fehleranfällig – nur, wenn es nicht anders geht.

### Was der Assistent beim Start tut

1. `README.md` vollständig lesen – besonders „Grundsätze“ und diesen Abschnitt.
2. `docs/spielkonzept.md` (Zielbild) und `docs/merkzettel.md` (Werkzeuge des
   Besitzers) überfliegen.
3. Den genannten Stand klonen, `npm ci`, Typprüfung und Build ausführen, um
   zu bestätigen, dass die Ausgangslage sauber ist. Den Stand **unverändert**
   als Ausgangspunkt zeigen (Regel 0).
4. **Das Postfach-Token erfragen** – aktiv, bevor das Feature fertig ist.
   Der Besitzer schickt es in zwei Hälften. Ohne Token kann nichts abgelegt
   werden; dann gilt die Notlösung (Patch im Chat).
5. Kurz zusammenfassen, was er vorhat – dann bauen.
6. **Nur ein Assistent gleichzeitig** benutzt das Postfach. Laufen mehrere
   Chats parallel (z. B. Battle-Modus), legt nur der ab, den der Besitzer
   benennt – sonst überschreibt der zweite den ersten.

### Was der Assistent nie tut

- Ungefragt etwas hinzufügen oder umgestalten (Regel 0)
- Ausgaben, Befehle oder Code zum Abtippen diktieren, wenn ein Patch möglich ist
- Mehrere Dinge in einem Patch vermischen
- `package.json` / `package-lock.json` ändern (kein `npm install`, kein
  `npm audit fix`), außer der Besitzer hat es ausdrücklich freigegeben
- Dateien löschen oder umbenennen, ohne es in der Commit-Message zu begründen
- Annehmen, dass der Besitzer Terminal-Ausgaben richtig deutet – jede
  Anweisung nennt, *was zu sehen sein soll*

### Für den Besitzer: Eröffnungstext für einen neuen Chat

Am einfachsten: Spiel lokal starten (Knopf → „Spiel starten“) – unter dem Haus
liegt die Leiste **ÜBERGABE** mit „Eröffnungstext kopieren“, „Token – wo?“,
„Postfach“ und „Freigaben“ (`src/components/Uebergabe.tsx`, nur im
Entwicklungsmodus sichtbar). Der Text dort ist die gepflegte Fassung; hier
zur Sicherheit noch einmal:

> Repository: https://github.com/Chihuaua/adventshaus – Stand: main
> Lies README.md komplett, besonders „Grundsätze“, „Arbeitsablauf mit
> KI-Assistenten“ und „Regel 0“. Halte dich daran.
>
> Regel 0: Klone den Stand und führe ihn aus – baue ihn nicht nach. Ändere
> nichts, was ich nicht verlange: keine Texte, Erklärungen, Buttons, Styles
> oder Größen hinzufügen oder anpassen. Nur die Aufgabe unten.
>
> Ablauf: 1) klonen, npm ci, npx tsc --noEmit, npm run build – bestätige,
> dass es baut. 2) Frag mich nach dem Postfach-Token (ich schicke es in zwei
> Hälften). 3) Setze die Aufgabe um und zeig sie mir lauffähig. 4) Erst nach
> meinem „ja“: Patch + Prüfsumme ins Postfach, wie in der README beschrieben.
> Ich übernehme per Knopf.
>
> Aufgabe: Noch keine. Klone den Stand, zeig ihn mir unverändert, frag nach dem Token – dann sage ich dir, was zu tun ist.

Der Text ist so abschickbar. Die eigentliche Aufgabe folgt im zweiten
Schritt – erst, wenn die KI den unveränderten Stand gezeigt und nach dem
Token gefragt hat. Das trennt „kann sie das Projekt korrekt übernehmen?“
von „kann sie die Aufgabe lösen?“.

---

## Regeln für Änderungen (gelten für Menschen und KI-Assistenten)

1. **Bestehende Dateien erweitern, nicht parallel neu erfinden.** Neue
   Spielsysteme (Kalender, Hunde …) bekommen eigene Dateien in `src/game/`
   und werden von `house.ts` aufgerufen – `house.ts` nicht weiter aufblähen.
2. **Spiellogik in `src/game/`, React nur in `src/components/`.** Die
   Spielklasse `House` weiß nichts von React.
3. **Keine Bilddateien, keine externen Assets.** Alles wird gezeichnet.
   Einzige Ausnahme: die zwei Google-Fonts für den Monitor-Rahmen in
   `index.html` – sie werden nicht portiert und dürfen in der Spielwelt
   (Canvas) nicht verwendet werden.
4. **Keine neuen npm-Pakete ohne Rücksprache.**
5. **Keine Punkte, Balken, Belohnungsschleifen.** Das Spiel ist zum Zuschauen.
6. **Deutsch** in Kommentaren, Labels und Commit-Messages.
7. Vor jedem Commit: `npx tsc --noEmit && npm run build` fehlerfrei.
8. Ein Meilenstein = ein Git-Tag (`v0.1`, `v0.2` …). Wer einen Stand
   referenziert, nennt den Tag, nicht „main“.
9. **Plattformregeln einhalten** (Abschnitt „Grundsätze“): nichts in die
   Spielwelt, was auf einer Wii nicht nachbaubar ist; jede neue Station mit
   Mindestgröße und ohne Hover-Abhängigkeit.
10. **Dokumente lesen, bevor man ändert:** `README.md` (Einstieg und Regeln),
    `docs/spielkonzept.md` (Zielbild) und `docs/merkzettel.md` (Werkzeuge).
11. **Änderungen kommen über das Postfach** – siehe „Arbeitsablauf mit
    KI-Assistenten“. Vorher lauffähig zeigen, dann Patch + Prüfsumme in den
    Gist; der Besitzer drückt den Knopf.

---

## Verlauf

| Tag | Stand |
|---|---|
| `v0.1` | Ausgangsstand 27.10. – baut, aber Haus wird im Dev-Modus nicht gezeichnet |
| `v0.2` | Fix: Zwischenflächen in `resize()` unabhängig vom Haupt-Canvas skalieren (StrictMode-Doppelaufbau) |
| `v0.3` | Aufräumen: Altlasten des Vorgängerprojekts entfernt (−4 500 Zeilen), README, `docs/` |
| `v0.4` | Grundsätze und Plattformregeln (PC, Handy, Wii) in README und Spielkonzept |
| `v0.5` | Arbeitsablauf mit KI-Assistenten festgeschrieben (Klonen → Zeigen → Patch → `git am`) |
| – | PR #1: Ablauf auf Pull Requests; PR #2: Kamin entfernt (erster Durchlauf mit dem Knopf) |
| `v0.6` | Postfach (Gist) + Desktop-Knopf: Übergabe ohne Zwischenablage; Übergabe-Leiste; Doku |
| – | Erster Übergabetest mit fremder KI: Haus 1:1 nachgebaut, aber ungefragte Zusätze → Regel 0, Token-Pflicht in der Startroutine |

### Bekannte offene Punkte

- Luni hat keinen eigenen Tagesablauf
- `audio.ts` enthält noch ungenutzte Sounds des Vorgängers (jump, coin, hurt …)
- Keine Touch-Optimierung (Hitboxen sind für Maus ausgelegt); einige
  Stationen unterschreiten die 24×24-Mindestgröße (z. B. Aschenbecher 21×24)
- Keine Controller-/Tastatursteuerung (Durchschalten + Bestätigen) – für die
  Wii Pflicht, im Browser sinnvoll als Vorbereitung
- Wii-Seitenformat (4:3 oder 16:9) nicht entschieden
- Hover-Label ist die einzige Objektbeschriftung – auf Touch/Wii unsichtbar
