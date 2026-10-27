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
| Grafik | Komplett in Canvas 2D gezeichnet, keine Bilddateien. Tag/Nacht-Himmel, Lampenlicht als Multiply/Additiv-Ebene, Kaminfeuer, Rauch |
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
    `docs/spielkonzept.md` (Zielbild) und `docs/merkzettel.md` (Arbeitsablauf).

---

## Verlauf

| Tag | Stand |
|---|---|
| `v0.1` | Ausgangsstand 27.10. – baut, aber Haus wird im Dev-Modus nicht gezeichnet |
| `v0.2` | Fix: Zwischenflächen in `resize()` unabhängig vom Haupt-Canvas skalieren (StrictMode-Doppelaufbau) |
| `v0.3` | Aufräumen: Altlasten des Vorgängerprojekts entfernt (−4 500 Zeilen), README, `docs/` |

### Bekannte offene Punkte

- Kamin-Klick hat keine Funktion (früher PDF-Download, entfernt)
- Luni hat keinen eigenen Tagesablauf
- `audio.ts` enthält noch ungenutzte Sounds des Vorgängers (jump, coin, hurt …)
- Keine Touch-Optimierung (Hitboxen sind für Maus ausgelegt); einige
  Stationen unterschreiten die 24×24-Mindestgröße (z. B. Aschenbecher 21×24)
- Keine Controller-/Tastatursteuerung (Durchschalten + Bestätigen) – für die
  Wii Pflicht, im Browser sinnvoll als Vorbereitung
- Wii-Seitenformat (4:3 oder 16:9) nicht entschieden
- Hover-Label ist die einzige Objektbeschriftung – auf Touch/Wii unsichtbar
