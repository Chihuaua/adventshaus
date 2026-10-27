---
geometry: a4paper, margin=25mm
documentclass: article
fontsize: 11pt
mainfont: DejaVu Serif
sansfont: DejaVu Sans
monofont: DejaVu Sans Mono
colorlinks: false
header-includes: |
  \usepackage{xcolor}
  \definecolor{textgray}{rgb}{0.2,0.2,0.2}
  \definecolor{lightgray}{rgb}{0.7,0.7,0.7}
  \definecolor{headinggray}{rgb}{0.3,0.3,0.3}
  \pagecolor{white}
  \color{textgray}
--- 

% PANDOC HEADER FOR PDF EXPORT
% Run: pandoc projekt_adventshaus.md -o projekt_adventshaus.pdf --pdf-engine=xelatex

# Little Computer Luni – Das Adventshaus {#titel .unnumbered}

*Projekt-Dokumentation – Stand: 2025-10-XX*  
*Version: 1.0 – Cozy-Beobachtungsspiel mit Adventskalender-Mechanik*  


---

## Grundsätze (verbindlich für alle Teile des Projekts)

Dieses Projekt ist **das Haus als Adventskalender im Stil von Little Computer
People**. Alles Weitere in dieser Mappe ordnet sich vier Grundsätzen unter:

1. **Zuschauen statt gewinnen.** Keine Punkte, keine Bestenliste, kein Game
   Over. Luni lebt ihr Leben; der Spieler gibt Impulse und schaut zu.
2. **Echtzeit.** Uhr, Himmel, Licht und der Adventskalender folgen der echten
   Zeit (Europe/Berlin). Türchen können nachgeholt, aber nicht vorgezogen werden.
3. **Drei Zielplattformen – PC-Browser, Handy (Touch), Nintendo Wii.**
   Die Web-Version (React/Canvas) ist der Prototyp. Die Wii-Fassung
   (Homebrew, C++ mit libogc/GX) ist das Endziel. **Deshalb werden Auflösung,
   Seitenformat, Steuerung, Schriftgrößen und Technik von Anfang an so
   gewählt, dass die Portierung ohne Neuentwurf möglich ist**:
   - Spielwelt nur aus Zeichenprimitiven (Rechteck, Kreis, Polygon, Linie,
     Verlauf) – keine HTML-Elemente, keine Web-Fonts, keine Bilddateien.
   - Jede Interaktion funktioniert mit Zeiger (Maus/Finger/Wii-Remote) **und**
     mit Steuerkreuz + Bestätigungstaste. Alle Ziele sind benannte Stationen.
   - Fernseher-tauglich: Klickziele ≥ 24×24 Einheiten, Schrift ≥ 10 Einheiten,
     nichts Wichtiges in den äußeren 5 % (Overscan), keine Hover-abhängige
     Information.
   - Speicherstände als einfache Schlüssel/Wert-Daten (SD-Karten-fähig).
   - Klänge synthetisch (Oszillator, Rauschen, Hüllkurve), keine Audiodateien.
4. **Alles handgezeichnet, keine Assets.** Haus, Figur, Himmel, Wetter,
   Rauch und Deko entstehen prozedural. Das hält die Wii-Portierung
   machbar und den Build bei einer einzigen Datei.

**Offene Grundsatzentscheidung – Wii-Seitenformat:** 4:3 (640×480, wie in
Abschnitt 7.3 geplant) oder 16:9 (behält das heutige 960×600-Layout nahezu
bei). Bis zur Entscheidung: nichts Wichtiges in die äußeren 10 % links/rechts
der Bühne, damit ein Beschnitt auf 4:3 möglich bleibt.

---

## Fließtext: Das Spielkonzept

"Little Computer Luni – Das Adventshaus" ist ein **cozies Beobachtungsspiel**, in dem der Spieler das Leben einer Frau namens Luni in einem weihnachtlich dekorierten Haus begleitet. Das Spiel läuft in **Echtzeit (MEZ, 24h-Format)** und beginnt am **1. Dezember** mit dem Eintreffen eines Adventskalenders per Post. Jeden Tag kann der Spieler ein Türchen öffnen, um neue Weihnachtsdekorationen und Aktionen freizuschalten. Luni lebt dabei ihren **eigenen Tagesablauf** – sie steht auf, trinkt Kaffee, raucht, zockt, schläft – reagiert aber auf **Impulse des Spielers** (z. B. "Gehe zum Kalender", "Mach die Kerze an").

Das Spiel ist **ohne Punkte oder Bestenliste** konzipiert – stattdessen steht die **immersive Atmosphäre** im Vordergrund. Am **Silvesterabend** gibt es eine **Erinnerung an die schönsten Momente** des Dezembers. Das Haus besteht aus **drei Etagen** (Erdgeschoss, Obergeschoss, Keller mit Raucherraum) und einem **Garten**, in den die beiden Hunde (Odin und Apollo) aus dem Raucherraum rauslaufen können. Die Steuerung erfolgt **ausschließlich durch Anklicken von Objekten** – Luni läuft dann selbstständig dorthin und führt die Aktion aus (oder lehnt sie ab, wenn sie beschäftigt ist).

Das Spiel ist als **Web-Version** (React/Canvas) umgesetzt und später für die **Wii (C++/libogc)** portierbar. Die Grafik ist **vektorbasiert** (Canvas 2D) mit **CRT-Effekten** (Scanlines, Vignette) für einen retro-Charm.


---

## Projektmappe


### 1. Grundlegende Spielmechanik


#### 1.1 Zeit-System
- **Echtzeit 1:1 (MEZ, 24h-Format)**
  - Basis: `new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })`
  - **Nachholen**: Wenn der Spieler tagelang nicht spielt, kann er **mehrere Türchen auf einmal öffnen** (z. B. am 10.12. die Türchen 1–10).
  - **Kein automatisches Öffnen**: Der Spieler entscheidet, wann er welche Türchen öffnet.

- **Digitale Uhr/Datum-Anzeige**
  - **Position**: Im Wohnzimmer (gut sichtbar, passt ins Bild)
  - **Design**: Pixelige LED-Anzeige (7-Segment-Stil) mit blauem Glow
  - **Format**: `DD.MM.  HH:MM` (z. B. `06.12.  18:45`)
  - **Farbe**: Hellblau (`#63b3ff`)


#### 1.2 Haus-Layout (3 Etagen)

```
┌─────────────────────────────────────────────────────────┐
│  OBERGESCHOSS (OG)                                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────────┐ │
│  │ Schlafzimmer │  │ Badezimmer │  │   Wohnzimmer          │ │
│  │   - Bett   │  │ - Dusche   │  │ - Sofa, TV, Bücher   │ │
│  │ - Nachttisch│  │ - Waschbecken│ │ - Adventskalender    │ │
│  └───────────┘  └───────────┘  │ - Digitale Uhr       │ │
│                                    └───────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ║ Treppe
┌─────────────────────────────────────────────────────────┐
│  ERDGESCHOSS (EG)                                        │
│  ┌───────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │   Flur    │  │      Wohnzimmer       │  │    Küche     │ │
│  │ - Garderobe│  │  (optional: 2. EG)   │  │ - Kaffeemaschine │ │
│  │ - Postkorb │  │                       │  │ - Herd       │ │
│  │ - Tür ═══╪──┘                       │  │ - Tisch      │ │
│  └───────────┘  ┌───────────────────────┐  └─────────────┘ │
│                  │   Keller-Treppe        │                  │
│                  │       (↓)              │                  │
└──────────────────┴───────────────────────┴──────────────────┘
                         ║
┌─────────────────────────────────────────────────────────┐
│  KELLER                                                   │
│  ┌─────────────────┐  ┌───────────────────────────────┐ │
│  │  Krempelraum     │  │       Raucherraum             │ │
│  │ (~⅓ Breite)      │  │ - Stuhl                        │ │
│  │ - Volle Regale   │──┤ - Hundeleinen (an der Wand)  │ │
│  └─────────────────┘  │ - Jacken, Schuhe               │ │
│                         │ - Tür nach draußen (Garten)    │ │
│                         └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- **Kamera-Scrolling**:
  - Beim Betreten der Kellertreppe: **Kamera fährt eine Etage nach unten** (mit Treppengeräuschen).
  - Beim Verlassen des Kellers: **Kamera fährt nach oben** (EG).
  - **Kein Scrollen zwischen EG und OG** (beide auf einem Bildschirm sichtbar).

- **Garten/Wiese**
  - Hunde können **frei rauslaufen**, sobald die Keller-Außentür geöffnet wird.
  - **Rückkehr-Logik**:
    - Bei **schlechtem Wetter** (z. B. Regen/Schnee): Hunde kommen **schnell zurück** (nach 1–2 Minuten).
    - Bei **gutem Wetter**: Hunde bleiben **länger draußen** (bis Spieler sie ruft).
    - **Zuruf**: Spieler klickt auf Hund → Luni ruft sie (Denkblase: "🐕") → Hunde kommen zurück.


#### 1.3 Figuren

| **Figur**       | **Rolle**               | **Aussehen**                          | **Besonderheiten**                          |
|------------------|-------------------------|---------------------------------------|--------------------------------------------|
| **Luni**         | Hauptfigur             | Frau, lange Haare, weihnachtliches Outfit | Lebt ihren Alltag, reagiert auf Spieler.     |
| **Odin**         | Hund 1                  | Schwarz mit **braunen** Partien (wo Apollo weiß ist) | Kann streicheln/füttern, bellt, Denkblasen |
| **Apollo**       | Hund 2                  | Schwarz mit **weißer** Border-Collie-Färbung (Hals & Bauch) | Wie Odin |
| **Postbote**     | NPC                     | Uniform, Paket in der Hand              | Bringt Kalender, Weihnachtsbaum, Pakete. |
| **Nikolaus**     | NPC (6.12.)            | Roter Mantel, Rute, Sack              | Kommt mit Knecht Ruprecht.                |
| **Knecht Ruprecht** | NPC (6.12.)        | Dunkler Mantel, Stock, böses Lächeln  | Bringt **Rute + lustig-bösen Brief**.     |
| **Weihnachtsmann** | NPC (24.12.)      | Roter Mantel, Rucksack                | Kommt nur, wenn Bescherung ausgelöst.     |
| **Schneemann**   | Deko                    | Steht draußen (ab 1.12.)               | --                                          |

- **Kommunikation**:
  - **Nonverbal**: Nicken, Kopfschütteln, Lächeln, Grinsen, Gähnen, Seufzen.
  - **Denkblasen**: Symbole (z. B. ☕ = Kaffee, 🚬 = Rauchen, 🐕 = Hund, 🚿 = Duschen).
  - **Spieler sieht**: Über Lunis Kopf erscheint Blase mit **Symbol + Ziel** (z. B. "🚬 → Balkon").


#### 1.4 Steuerung

| **Plattform**       | **Bewegung**               | **Interaktion**               | **Pause/Menu**       |
|----------------------|-----------------------------|--------------------------------|------------------------|
| **Web (Desktop)**    | --                           | Mausklick auf Objekte        | `P` / `Esc`            |
| **Web (Touch)**      | --                           | Touch auf Objekte            | Pause-Button           |
| **Wii (Stick)**      | Steuerkreuz                 | `A`-Taste (halten)           | `Start`-Taste          |
| **Wii (Nunchuk)**    | Analog-Stick                | `C`-Taste                    | `Z`-Taste              |

- **Grundprinzip**: **Nur Objekte anklicken** → Luni läuft selbstständig dorthin und führt die Aktion aus (oder lehnt sie ab).
- **Keine direkte Steuerung** (kein freies Laufen mit Tasten/Stick).


---

### 2. Tagesablauf & Interaktionen


#### 2.1 Lunis Routine (Beispiel)

| **Zeit**       | **Aktion**               | **Dauer**       | **Priorität** |
|----------------|---------------------------|-----------------|---------------|
| 07:30–08:30    | Aufstehen, Waschen        | 20–40 Min.      | 2             |
| 08:30–09:30    | Kaffee trinken           | 10–30 Min.      | 3             |
| 09:30–12:00    | Rauchen (Balkon)          | 3–10 Min.       | 4             |
| 09:30–12:00    | Videospiele zocken        | 20–60 Min.      | 4             |
| 12:00–13:00    | Mittagessen               | 30–45 Min.      | 3             |
| 13:00–18:00    | Arbeit/Lesen             | 60–90 Min.      | 4             |
| 18:00–20:00    | Abendessen + TV          | 40–60 Min.      | 3             |
| 20:00–23:00    | Freizeit (Musik, etc.)   | 20–40 Min.      | 4             |
| 23:00–07:30    | Schlafen                  | 6–8 Std.        | 1 (höchste)   |

- **Zufällige Dauer**: Jede Aktion hat eine **zufällige Dauer** innerhalb des Zeitfensters.
- **Prioritäten**:
  1. Schlafen (Energie < 20%)
  2. Essen/Trinken (Hunger < 30%)
  3. Toilette/Dusche (Hygiene < 30%)
  4. Spieleranweisungen
  5. Freizeit


#### 2.2 Spieler-Interaktionen

| **Situation**               | **Lunis Reaktion**               | **Beispiel**                          |
|------------------------------|------------------------------------|---------------------------------------|
| **Frei**                     | Sofortige Ausführung               | Klick auf Kaffeemaschine → Luni macht Kaffee. |
| **Beschäftigt (unterbrechbar)** | Beendet Aktion, dann neue       | Luni liest → Klick auf Kalender → Luni nickt, beendet Lesen, geht zum Kalender. |
| **Beschäftigt (nicht unterbrechbar)** | Ablehnen + Denkblase | Luni schläft → Klick auf Kalender → Luni gähnt, Denkblase: 😴. |
| **Nicht in Reichweite**       | Auto-Walk + Ausführung            | Klick auf Kalender (an der Wand) → Luni läuft hin. |
| **Priorität (z. B. Schlafen)** | Ablehnen + Denkblase          | Luni müde → Klick auf Kaffeemaschine → Luni schüttelt Kopf, Denkblase: 😴. |


#### 2.3 Aktionen & Objekte

| **Aktion**          | **Ort**          | **Dauer**       | **Freigeschaltet ab** | **Effekt**                     |
|----------------------|------------------|-----------------|----------------------|--------------------------------|
| Kaffee trinken      | Küche            | 5–15 Min.       | Start               | Energie +10, Dampf-Partikel    |
| Rauchen              | Balkon / Raucherraum | 3–10 Min. | Start               | Stress −10, Rauch-Partikel     |
| Videospiele zocken   | Wohnzimmer       | 20–60 Min.      | Start               | Spaß +15                       |
| Musik hören         | Wohnzimmer       | 10–30 Min.      | 10.12.              | Stimmung +10, **Plattenauswahl** (keine Hintergrundmusik!) |
| Plätzchen backen     | Küche            | 15–40 Min.      | 21.12.              | Hunger −5, Lebkuchen auf Tisch |
| Geschenke einpacken  | Wohnzimmer       | 10–20 Min.      | 6.12. (Nikolaus)    | Geschenk unter dem Baum       |
| Schlafen             | Schlafzimmer      | 6–8 Std.        | Start               | Energie +100, Tag wechselt    |
| Duschen              | Badezimmer        | 5–15 Min.       | Start               | Hygiene +20                   |
| Kerze an/zünden      | Wohnzimmer       | --              | 1.–4. Advent        | Flamme erscheint              |
| Kerze auslöschen     | Nachttisch        | --              | Immer               | Alle Kerzen aus                |
| Tür öffnen           | Alle Türen        | --              | Immer               | Hunde können rauslaufen      |


---

### 3. Adventskalender & Events


#### 3.1 Adventskalender

- **Design**:
  - **Weltraumdorf auf einem Mond** (Hintergrund: dunkler Himmel mit Sternen, Ringplaneten, Nebeln).
  - **Vordergrund**: Schneebedeckter Mondkrater mit Tannenbaum, Schneemann, kleinen Häuschen.
  - **Türchen**: 24 zufällig angeordnete Holzklappen mit Goldzahlen (Permutation pro Jahr neu).

- **Platzierung**: **Wohnzimmer** (an der Wand).

- **Mechanik**:
  - **Ab 1.12.**: Kalender liegt im **Postkasten** (Flur).
  - **Spieler klickt auf Kalender** → **Modal-Popup** (großes Fenster, 80% Bildschirmbreite).
  - **Alle 24 Türchen sichtbar**, aktuelles leuchtet **nicht** (kein Hinweis).
  - Spieler muss **Nummer suchen und anklicken**.
  - **Belohnung pro Türchen**:
    - **Deko-Objekt** (zufällig aus Pool: Kerze, Kugel, Stern, Lametta, etc.).
    - **Neue Aktion** (zufällig aus Pool: Musik hören, Plätzchen backen, etc.).
  - **Nachholen**: Türchen können **jederzeit nachgeholt** werden (auch rückwirkend).
  - **Geheime Belohnung**: Wenn am **24.12. alle 24 Türchen in der richtigen Reihenfolge** (1–24) geöffnet wurden → **Goldener Stern** + spezielles Event (z. B. Weihnachtsmann erscheint früher).
    - **Kein Hinweis** auf diese Belohnung.


#### 3.2 Events

| **Datum**       | **Event**                     | **Ablauf**                                                                 | **Belohnung/Strafe**                          |
|-----------------|--------------------------------|-----------------------------------------------------------------------------|----------------------------------------------|
| **01.12.**      | Adventskalender kommt per Post | Postbote klingelt → Luni holt Paket → Kalender hängt im Wohnzimmer.          | Kalender an der Wand.                        |
| **01.–24.12.**  | Türchen öffnen                | Modal-Popup → Türchen klicken.                                               | Deko + neue Aktion.                          |
| **1.–4. Advent**| Kerzen am Kalender            | Spieler klickt auf Kerze → Luni zündet sie an.                               | Kerzen leuchten.                              |
| **06.12.**      | Nikolaus + Knecht Ruprecht     | Tür klingelt → Luni öffnet → Dialog.                                        | Wenn alle Türchen bis 6.12. offen: Schokolade + Aktion "Geschenke einpacken". Sonst: Knecht Ruprecht nimmt eine Kerze mit (**Rute + lustig-böser Brief**). |
| **23.12.**      | Weihnachtsbaum kommt per Post | Postbote klingelt → Luni stellt ihn auf.                                      | Baum im Wohnzimmer.                          |
| **24.12.**      | Bescherung                     | Spieler klickt auf Baum → Luni packt Geschenke aus.                         | Geschenke unter dem Baum.                    |
| **24.12. (24:00)** | Weihnachtsmann             | Wenn Bescherung ausgelöst: Weihnachtsmann erscheint.                          | Spezielle Animation + Sound.                 |
| **31.12.**      | Silvester                      | Feuerwerk (Partikel) + Countdown.                                            | Erinnerung an schönste Momente.            |


#### 3.3 Silvester: Erinnerung an schönste Momente

- **23:50 Uhr**: Luni geht zum **Balkon/Fenster** und schaut auf die **Feuerwerke** (Partikel: bunte Raketen).
- **23:59 Uhr**: **Countdown** (Denkblase: "10... 9... 8...").
- **00:00 Uhr**:
  - **Feuerwerk** (große Partikel-Explosionen).
  - **Rückblick**:
    - **Automatische Diashow** mit Screenshots der schönsten Momente (z. B. Luni beim Kalender-Öffnen, Nikolaus-Besuch, Weihnachtsbaum-Aufbau).
    - **Keine Bewertung**, nur nostalgische Erinnerungen.
  - **Neues Jahr**:
    - Deko wandert in **Weihnachtskiste** (Keller).
    - Neuer Adventskalender erscheint (ab 1.12. des nächsten Jahres).


---

### 4. Deko & Inventar


#### 4.1 Deko-Objekte (Beispiele)

| **Objekt**          | **Platzierung**       | **Effekt**                     | **Freigeschaltet ab** |
|----------------------|------------------------|--------------------------------|----------------------|
| Kerze               | Tisch, Nachttisch     | Flackernde Flamme (Partikel)  | 1.–4. Advent         |
| Weihnachtskugel     | Weihnachtsbaum        | Glitzer-Reflexionen           | 5.–8.12.             |
| Lametta             | Weihnachtsbaum        | Glänzende Partikel             | 9.–12.12.            |
| Stern               | Decke, Wände          | Leuchtet im Dunkeln           | 13.–16.12.           |
| Geschenkpapier      | Tisch                 | --                              | 17.–20.12.           |
| Lebkuchen           | Küche                 | Duft-Partikel (Herzchen)      | 21.–23.12.           |
| Weihnachtsbaum      | Wohnzimmer            | Lichter + Schnee-Effekt        | 23.12. (automatisch) |
| Nikolaus-Stiefel    | Flur                  | --                              | 6.12.                |


#### 4.2 Umdekorieren (Point & Click)

- Spieler klickt auf **Deko-Objekt** (z. B. Kerze) → **Drag-Modus** aktiviert.
- **Ziehen mit Maus/Touch** → Objekt folgt dem Cursor.
- **Loslassen** → Objekt wird an der neuen Position platziert (**Kollision prüfen**).
- **Abbrechen**: Rechtsklick oder `Esc`.


#### 4.3 Hybrid-Speicher (Deko & Aktionen bleiben erhalten)

- **Adventskalender**: Jedes Jahr **neu** (1.12. = Türchen 1).
- **Deko & Aktionen**: **Bleiben erhalten** (z. B. Kerzen, Weihnachtsbaum, Musik-Aktion).
- **Jahreswechsel (31.12.)**:
  - Alle Deko-Objekte wandern in **Weihnachtskiste** (Keller).
  - Neuer Kalender + neue Deko/Aktionen werden im neuen Jahr freigeschaltet.


---

### 5. Stress & Stimmungen


#### 5.1 Stimmungen (Vorschlag)

| **Stimmung**  | **Auslöser**                          | **Effekt**                          |
|---------------|----------------------------------------|--------------------------------------|
| **Fröhlich**   | Musik hören, Geschenke auspacken, Türchen öffnen | Lächelt oft, läuft schneller.         |
| **Entspannt**  | Kaffee trinken, Schlafen, Duschen       | Gähnt, bewegt sich langsam.          |
| **Gestresst**  | Zu lange wach, zu viele Aufgaben        | Raucht mehr, Denkblase: 😓.         |
| **Müde**       | Energie < 30%                          | Gähnt, schläft ein (wenn nicht unterbrochen). |
| **Verwirrt**   | Zu lange ohne Schlaf                   | Halluzinationen (Schneeflocken im Haus). |
| **Lustig**     | Besondere Events (Nikolaus, Weihnachtsmann) | Lacht, tanzt kurz. |

- **Stress als abgeleiteter Wert**:
  - `Stress = 100 - (Energie + Spaß + Hygiene) / 3`
  - **Energie, Spaß, Hygiene**: Bedürfnisse, die durch Aktionen beeinflusst werden.


#### 5.2 Bedürfnisse (Beispielwerte)

| **Bedürfnis** | **Startwert** | **Zerfall pro Stunde** | **Wiederherstellung**          |
|---------------|----------------|------------------------|----------------------------------|
| Energie       | 100%           | −5%                   | Schlafen (+100%), Kaffee (+10%) |
| Spaß          | 100%           | −3%                   | Zocken (+15%), Musik (+10%)     |
| Hygiene       | 100%           | −2%                   | Duschen (+20%)                  |

- **Schwäche-Effekte** (kein Tod, aber lustige Reaktionen):
  - **Hungrig**: Dünne Schatten unter den Augen.
  - **Müde**: Schläft im Stehen ein (Kopf nickt).
  - **Verwirrt**: Sieht doppelt (z. B. zwei Kaffeemaschinen).
  - **Gestresst**: Raucht im Minutentakt.
  - **Halluzination**: Schneeflocken im Haus (Partikel).


---

### 6. Sound


#### 6.1 Selbst erzeugte Klänge (WebAudio-Synth)

- **Weihnachtslieder**: Melodien wie "O Tannenbaum" als Square-Wave-Synth.
- **Ambiente**: Schnee-Knistern, Kamin-Knistern, Glöckchen, Türklopfen.
- **Figur-Sounds**: Schritte, Kaffee-Einschenken, Rauchen (Zug an der Zigarette), Bellen.


#### 6.2 Lokale Sound-Dateien (optional)

- **Format**: **MP3 oder WAV** (Browser-Kompatibilität).
- **Anforderungen**:
  - Sample-Rate: 44.1 kHz oder 48 kHz.
  - Bitrate: 128–192 kbps (MP3) oder 16-Bit (WAV).
  - Länge: Max. 10 Sekunden (für kurze Effekte).
  - Benennung: `sfx_<name>.mp3` (z. B. `sfx_nikolaus.mp3`).
- **Ordner**: `/public/sounds/`.


#### 6.3 Musik

- **Keine generelle Hintergrundmusik**.
- **Luni kann sich Platten aussuchen**:
  - Spieler klickt auf **Plattenspieler** (neues Objekt im Wohnzimmer) → Luni wählt eine **zufällige Platte** aus (z. B. "O Tannenbaum", "Stille Nacht").
  - Musik läuft **nur, solange Luni in der Nähe** ist (z. B. 5 Minuten).
  - **Stoppt automatisch**, wenn Luni den Raum verlässt.


---

### 7. Technische Details


#### 7.1 Web-Version (React/Canvas)

- **Technologie**: React 19, TypeScript, Canvas 2D API, Tailwind CSS.
- **Grafik**: Vektor-basiert (Canvas-Pfade), keine Bilder.
- **CRT-Effekte**: Scanlines, Vignette, rollender Balken.
- **Performance**: 60 FPS, Partikel-Cap bei 460.


#### 7.2 Wii-Portierung (Endziel – bestimmt die Regeln von heute)

> Siehe „Grundsätze“ am Anfang dieser Mappe. Die Wii ist kein optionaler
> Nachtrag, sondern die Zielplattform, aus der Auflösung, Seitenformat,
> Steuerung und Technikwahl abgeleitet werden.

- **Technologie**: C++ mit libogc/GX (Wii-Homebrew).
- **Steuerung**: Steuerkreuz/Analog-Stick + A/B-Tasten.
- **Grafik**: 2D-Sprites (konvertiert aus Canvas-Pfaden).
- **Sound**: Wii-Audio-API (WAV-Dateien).


#### 7.3 Layout

- **Erst Web-Format (960×600)** bauen, später auf **640×480 (4:3)** umstellen.
- **Begründung**: Einfacher zu testen, Skalierung später einfach (alle Koordinaten mit `640/960` multiplizieren).


---

### 8. Offene Punkte & Notizen


#### 8.1 Offene Entscheidungen

| **Thema**               | **Optionen**                          | **Empfehlung** | **Notizen** |
|-------------------------|---------------------------------------|----------------|-------------|
| Wetter-System           | Zufällig / Fester Zyklus             | Zufällig      |             |
| Hunde-Rückkehr-Dauer    | 1–2 Min. (schlechtes Wetter) / 5–10 Min. (gutes Wetter) | -- |             |
| Plattenauswahl          | Zufällig / Spieler wählt              | Zufällig      |             |
| Feuerwerk-Dauer         | 1 Min. / 2 Min.                       | 2 Min.        |             |
| Silvester-Diashow      | 3–5 Screenshots / Alle Momente        | 5 Screenshots |             |


#### 8.2 Regeln & Bedingungen

| **Regel**                          | **Bedingung**                          | **Effekt**               |
|------------------------------------|----------------------------------------|--------------------------|
| Türchen öffnen                     | Spieler klickt auf Türchen             | Deko + Aktion freigeschaltet |
| Kerze an/zünden                    | Spieler klickt auf Kerze               | Flamme erscheint         |
| Kerze auslöschen                   | Luni geht schlafen / verlässt Haus     | Alle Kerzen aus          |
| Hunde rauslassen                   | Spieler öffnet Keller-Außentür         | Hunde laufen raus        |
| Hunde zurückrufen                  | Spieler klickt auf Hund                | Luni ruft, Hunde kommen  |
| Luni ablehnen                      | Priorität > Spieleranweisung          | Denkblase + Ablehnung   |
| Luni akzeptieren                    | Frei oder unterbrechbar               | Aktion ausführen         |


#### 8.3 Notizen für zusätzliche Ideen

*(Leer – für deine Ergänzungen)*


---


---

## Anhang: Glossar

| **Begriff**         | **Beschreibung**                                                                 |
|----------------------|---------------------------------------------------------------------------------|
| **EG**               | Erdgeschoss (Wohnzimmer, Küche, Flur, Kellertreppe).                              |
| **OG**               | Obergeschoss (Schlafzimmer, Badezimmer, Wohnzimmer).                            |
| **Keller**           | Untergeschoss (Krempelraum, Raucherraum, Tür nach draußen).                     |
| **Modal**            | Popup-Fenster (z. B. Adventskalender in Großansicht).                          |
| **Denkblase**        | Symbol über Lunis Kopf (z. B. ☕ für Kaffee).                                  |
| **Partikel**         | Kleine Animationen (z. B. Rauch, Glitzer, Schneeflocken).                        |
| **CRT-Effekte**      | Retro-Bildschirm-Effekte (Scanlines, Vignette, Flimmern).                        |
| **MEZ**              | Mitteleuropäische Zeit (UTC+1).                                                |


---

*Dokumentende – Vielen Dank für deine Geduld!* 🎄
