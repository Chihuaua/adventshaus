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
| Interaktion | 33 anklickbare Stationen (`STATIONS` in `house.ts`): Kaffee, Tee, Herd, Bett, Dusche, WC, Klavier, Saxophon, Plattenspieler, Gitarre, Gaming … |
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
   Einzige Ausnahme: die zwei Google-Fonts in `index.html`.
4. **Keine neuen npm-Pakete ohne Rücksprache.**
5. **Keine Punkte, Balken, Belohnungsschleifen.** Das Spiel ist zum Zuschauen.
6. **Deutsch** in Kommentaren, Labels und Commit-Messages.
7. Vor jedem Commit: `npx tsc --noEmit && npm run build` fehlerfrei.
8. Ein Meilenstein = ein Git-Tag (`v0.1`, `v0.2` …). Wer einen Stand
   referenziert, nennt den Tag, nicht „main“.

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
- Keine Touch-Optimierung (Hitboxen sind für Maus ausgelegt)
