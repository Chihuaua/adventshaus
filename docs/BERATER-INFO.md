# BERATER-INFO

**Kein Chatprotokoll – sondern der technische Wissensstand aus der
Zusammenarbeit.**

> **LIES DIESE DATEI NUR, WENN DER BESITZER ES AUSDRÜCKLICH SAGT.**
>
> Beispiel: „Lies `docs/BERATER-INFO.md`." Ohne diese Aufforderung ist sie für
> deine Aufgabe nicht relevant. Sie ist Hintergrundwissen, keine Arbeitsanweisung.
> Verbindlich bleiben `README.md`, `docs/DARSTELLUNG.md` und
> `docs/PROJEKTSTATUS.md`.

---

## 0 · Warum hier kein wörtliches Chatprotokoll steht

Der Wunsch war, den gesamten Verlauf 1:1 zu zitieren. Das ist **nicht
umsetzbar**, und zwar aus einem Grund, der für die Qualität wichtig ist:

Ein Verlauf dieser Länge lässt sich nicht zeichengenau reproduzieren. Jeder
Versuch wäre eine **Rekonstruktion**, die als Zitat erscheint. Eine nächste KI
würde sie für authentisch halten und darauf bauen – das ist schlechter als eine
ehrliche Zusammenfassung.

**Deshalb:** technische Erkenntnisse, Entscheidungen und Fallen sind hier
festgehalten. Kein Dialog, keine Rollenspiele, keine Zwischenstände. Der
Verlauf bleibt dort, wo er war – im Chat.

**Sicherheitsregel:** In dieser Datei steht **kein** Zugangsschlüssel, kein
Tokenfragment, keine Zugangsdaten. Wenn du glaubst, einen Schlüssel zu brauchen:
frage den Besitzer. Schreibe nie einen in den Chat.

---

## 1 · Was das Projekt ist

Browser-Spiel, Canvas 2D, assetfrei. Luni lebt in einem vierstöckigen Haus im
Querschnitt; der Spieler klickt Objekte an, Luni läuft selbst hin. Keine Punkte,
kein Game Over. Zielplattformen: PC, Handy, später Nintendo Wii.

**Wichtig:** Die Adventskalender-Mechanik ist nicht implementiert. Sie ist
Zielbild, nicht Ist-Stand.

---

## 2 · Technische Lehren aus der Zusammenarbeit

### 2.1 `npx tsc` ist hier falsch

`npx tsc --noEmit` lädt bei fehlenden lokalen Abhängigkeiten das **fremde
Paket** `tsc@2.0.4` und scheitert mit „This is not the tsc command you are
looking for". Richtig ist immer:

```bash
./node_modules/.bin/tsc --noEmit && npm run build
```

Das gehört in jede Prüfung, jede Anleitung und jede Antwort an den Besitzer.

### 2.2 Der `resize()`-Fix ist essenziell

`house.ts` dimensioniert **alle** Zwischenflächen (`bg`, `sky`, `mul`, `add`)
unabhängig vom Haupt-Canvas und setzt `style.width/height` immer.

Grund: Beim doppelten Aufbau im React-StrictMode hatte das Haupt-Canvas bereits
die richtige Größe, die neuen Offscreen-Flächen aber noch 300×150. Folge: Das
Haus wurde als Briefmarke gemalt und auf Vollbild gestreckt – sichtbar blieben
nur Luni, Uhr und einzelne Objekte.

**Wer diesen Fix entfernt oder „vereinfacht", bricht die Darstellung.** Das ist
die häufigste Fehlerursache des Projekts.

### 2.3 Fehlende Objekte sind meistens eine Momentaufnahme

Wenn Luni oder ein kleines Objekt (Aschenbecher, 21 × 24 Einheiten) kurzzeitig
fehlt: erst `Strg+Shift+R`, Konsole offen lassen, neu bauen, zweiten Browser
testen. Erst wenn es **reproduzierbar** fehlt, ist es ein Codefehler. Ein „Fix"
ohne reproduzierbaren Fehler macht die Historie unklar.

### 2.4 Build und Vorschau sind zwei Prüfungen

Der Build kann grün sein, während das Haus falsch aussieht – genau das ist beim
`resize()`-Fehler passiert. **Ansehen zuerst, übernehmen danach.** Die Vorschau
entscheidet, nicht die Typprüfung.

### 2.5 Vite-Builds und Assets

`vite-plugin-singlefile` erzeugt eine einzige `dist/index.html`. PDFs lassen
sich darin nicht sinnvoll einbetten. Fehlt ein Asset, das `HouseView.tsx`
importiert, scheitert der Build mit `ENOENT`. Konsequenz: Alles, was der Build
braucht, liegt **im** Repository – keine Dateien aus Elternordnern.

---

## 3 · Darstellung: was nicht verhandelbar ist

Die Oberfläche besteht nur aus Kopfzeile, Monitorrahmen (Canvas 8:5, max.
1140 px) und der Übergabe-Leiste. Keine Spielbeschreibung darüber, keine
Steuerungserklärung darunter, kein Footer, keine zusätzlichen Panels.

Hovertexte sind **im Canvas** gezeichnet: `600 11px "Space Grotesk"`,
`#eef7f2` auf `rgba(8,20,26,.88)`, Boxhöhe 20, Radius 5, Innenabstand 8,
Bühneneinheiten 960 × 600. Nicht vergrößern, nicht durch HTML ersetzten.

Hintergrund: Bei einem Übergabetest hat eine fremde KI Haus und Luni 1:1
korrekt umgesetzt, aber ungefragt Beschreibung, Steuerungstext und größere
Hovertexte ergänzt. **Regel 0** im README entstand deshalb. Sie ist die Antwort
auf genau diesen Fall.

---

## 4 · Was bewusst entfernt wurde

| Entfernt | Grund |
|---|---|
| **Kamin** (Station, Zeichnung, Flammen, `onFireplace`) | auf Wunsch des Besitzers; die Wand ist dort jetzt schlicht |
| **PDF-Download und PDF-Asset** | Datei fehlte und blockierte den Build |
| **`engine.ts`, `Hud.tsx`, `Overlays.tsx`, `TouchControls.tsx`** | Legacy mit Punkten/Highscores, ungenutzt |

Nicht wieder einbauen. Bei Bedarf ist der alte Stand über `git show` abrufbar.

---

## 5 · Gewählter Arbeitsweg

**Weg A – Postfach.** Verbindlich, weil er das Ziel des Besitzers erfüllt: wenige
Handgriffe, kein Code-Kopieren.

```
KI klont → baut → zeigt Vorschau
  → Besitzer sagt „ja"
  → KI legt Patch + Prüfsumme ins Postfach (Gist)
  → Doppelklick „Adventshaus" → Enter
  → Merge im Browser („Merge pull request" → „Confirm merge" → „Delete branch")
  → Doppelklick „Adventshaus" → Enter
```

Der Knopf holt den Patch, prüft die Prüfsumme, legt einen `ki/`-Zweig an,
prüft Typen und Build, lädt hoch und öffnet die Pull Request. Der zweite
Doppelklick zieht `main` nach und aktualisiert den Spiegel.

**Weg B – vollständige Dateien.** Rückfall, wenn das Postfach nicht verfügbar
ist. Die KI liefert dann ganze Dateien mit Pfad; der Besitzer trägt sie über den
GitHub-Browser-Editor ein.

---

## 5b · Abläufe, die sich bewährt haben

### 5.2 Vollständige Dateien statt Fragmente

Alles, was über wenige Zeilen hinausgeht, wird als **vollständige Datei mit
Pfad** geliefert. Fragmente und „ersetze Zeile 1234" führen bei diesem Besitzer
zu Fehlern, weil er nicht programmiert.

### 5.0 Warum Übergabeknöpfe „nicht anklickbar" waren – und was jetzt gilt

Zwei Ursachen, beide in `src/components/HouseView.tsx`. Beide sind behoben.

**Ursache 1 · Das Panel wurde abgeschnitten.**

Der äußerste Rendering-Container hatte `overflow-hidden`. Das Spiel passt genau
auf den Schirm, die Leiste ist sichtbar – klappt man aber ein Panel auf, kommen
etwa 400 Zeilen Höhe hinzu. Die gingen unter den Rand und wurden weggeschnitten.
Folge: Ein Klick schien nichts zu bewirken, die Knöpfe wirkten „tot".

**Behoben:** `overflow-hidden` wird zu `overflow-x-hidden`. Die Seite scrollt
nach unten, das Panel ist erreichbar. Das Canvas bleibt durch sein eigenes
`overflow-hidden` im `.screen-glass` unberührt.

**Ursache 2 · Die Leiste war nur im Dev-Modus sichtbar.**

```tsx
{(import.meta.env.DEV || import.meta.env.VITE_UEBERGABE === "1") && <Uebergabe />}
```

Deshalb galt:

| Start | Leiste |
|---|---|
| `npm run dev` | sichtbar |
| Desktop-Knopf (baut und öffnet `dist`) | **nicht sichtbar** |

Der Besitzer drückt seinen Desktop-Knopf und wunderte sich zurecht, dass die
Übergabe-Knöpfe fehlen.

**Entschieden:** Die Bedingung wird entfernt, es steht nur noch `<Uebergabe />`.
Die Leiste erscheint **immer**, auch in der gebauten `dist/index.html`.

**Bewusster Nebeneffekt:** Die eine Datei, die man weitergeben kann, enthält
dann die Leiste mit Eröffnungstext und Links. Es stehen **keine Zugangsdaten**
darin – nur Anweisungen und URLs. Wer die Datei teilt, gibt interne Informationen
preis, aber keine Geheimnisse.

**Alternative** (falls das nicht gewollt ist): Bedingung stehen lassen, und für
die Übergabe manuell `npm run dev` starten.

### 5.0b · Desktop-Knopf und Fassung

Der Desktop-Knopf arbeitet mit der **gebauten** Fassung (`dist/index.html`), nicht
mit dem Dev-Server. Zwei Folgen, die leicht für Fehler gehalten werden:

1. Alles, was nur im Dev-Modus gerendert wird, fehlt nach dem Knopfdruck.
2. Der StrictMode-Doppelaufbau tritt **nicht** auf – der `resize()`-Fehler war
   also ein Dev-Phänomen. Im Build lief das Haus korrekt, im Dev nicht.

Deshalb gilt: **Abweichungen zwischen Dev und Build sind zuerst ein
Sichtbarkeitsproblem, kein Codefehler.**

### 5.1 Vollständige Dateien statt Fragmente

Ein Befehl, eine Kontrolle, dann der nächste. Große Blöcke werden abgeschnitten,
falsch kopiert oder in der falschen Reihenfolge ausgeführt.

### 5.3 Dateien statt Terminal-Paste

Skripte gehören in eine Datei (`bash datei.sh`), nicht mehrzeilig ins Terminal.
Beim direkten Einfügen läuft jede Zeile sofort – halbe Dateien, hängende
`cat`-Befehle und falsche Reihenfolgen waren die Folge.

### 5.4 Nach dem Übernehmen prüfen

Nach jeder Änderung: `grep` auf das erwartete Ergebnis, Build, Vorschau.
Dann committen. Nie „fertig" melden, ohne beides geprüft zu haben.

---

## 5e · Die Bett-Routine war nie weg

**Der teuerste Fehlalarm der Zusammenarbeit.**

Der Besitzer meldete: Die lange Zu-Bett-Geh-Routine (zum Schrank, umziehen, aufs
Bett setzen, Brille im hohen Bogen auf den Nachtschrank, hinlegen, zudecken, Hand
zwischen Haar und Bett) sei verschwunden.

**Befund:** Der Code existiert unverändert auf `main`.

| Funktion | Zeile in `src/game/house.ts` |
|---|---|
| `startBedRoutine()` | 4573 |
| `updateBedRoutine(dt)` | 4370 |
| Aufruf beim Klick aufs Bett | 2280 |

Auch alle Zutaten stehen: Brille (14 Treffer), Nachttisch (3), zudeck (1),
umzieh (2), Kleiderschrank (15), Bett (21).

**Warum sie nicht startete – zwei Ursachen, beide by design:**

1. **Tageszeit.** Der Aufruf ist gebunden an
   Stunde >= 20 ODER Stunde < 6 ODER krank > 0.35.
   Tagsüber tut sich beim Klick aufs Bett nichts. Das ist so gewollt.

2. **Der Traum.** Seit PR #6 gilt zusätzlich: Schläft sie bereits und läuft kein
   Traum, spielt ein Klick aufs Bett den Traum ab statt der Routine.

**Lehre:** Bevor eine Funktion als „weg" gemeldet wird, prüfen ob der **Aufruf**
noch steht – nicht nur der Funktionsname. Und: die Tageszeit testen.

**Prüfbefehl:**

```bash
grep -n "startBedRoutine\|updateBedRoutine" src/game/house.ts
grep -n 'id === "bett"' src/game/house.ts
```

---

## 5f · Das Regressionsnetz (seit 30.10.2026 in Betrieb)

Zwei Dateien, gemergt in PR #7, `main = 9030610`.

**`docs/FEATURES.md`** – eine Zeile pro Funktion im Format
`name | datei | marker`. Der Marker ist eine Zeichenkette, die im Code stehen
muss, solange die Funktion existiert. 37 Einträge, alle am echten `main`
verifiziert.

**`tools/check.sh`** – liest die Liste und prüft jede Zeile mit `grep`.

```bash
bash tools/check.sh
```

| Ausgabe | Bedeutung |
|---|---|
| Geprüft: 37, Fehlt: 2 | Normalzustand: die zwei offenen Aufgaben fehlen |
| Geprüft: 37, Fehlt: 0, ALLES VORHANDEN | Aufgabe gelungen |
| Fehlt: 3 oder mehr | Regression – die Liste nennt die Namen |

**Wirksamkeit getestet:** `startBedRoutine` umbenannt → Skript meldet sofort
`FEHLT bett-routine`. In einer Sekunde, statt in zwanzig Minuten Suche.

### Warum das Netz nötig ist

**Die Arena kann Vorschauen zeigen, und die meisten KIs deployen auch.** Der
Besitzer sieht die laufende Demo und kann vergleichen und voten. Dieser Weg
funktioniert.

Aber es gibt zwei Lücken, und beide sind heute aufgetreten:

1. **Nicht jede KI deployt.** Eine lieferte nur einen Text („Bild 1: … Bild 2: …")
   statt einer laufenden Fassung. Eine andere stand auf „Ready to build" und baute
   nichts. „Ansehen zuerst" scheitert dann, weil es nichts anzusehen gibt.

2. **Eine Vorschau zeigt, dass etwas läuft – nicht, dass nichts fehlt.** Der
   `resize()`-Fehler hatte einen grünen Build, eine laufende Vorschau und ein
   **halbes Haus**. Das Auge sieht, was da ist. Es sieht nicht, was fehlt.

**Deshalb sind beide Prüfungen nötig, und sie ersetzen sich nicht:**

| Prüfung | Fängt |
|---|---|
| Vorschau ansehen | Kaputtes Aussehen, falsches Verhalten, fehlende Knöpfe |
| `bash tools/check.sh` | Verschwundene Funktionen, gelöschte Dateien, umbenannte Marker |

Das Skript ist kein Ersatz für die Vorschau. Es ist die Prüfung, die **dort**
ansetzt, wo das Auge aufhört.

### Die verbindliche Übergabe-Ordnung

Jede KI bekommt diesen Block, und er ist nicht verhandelbar:

> **Vorher:** `bash tools/check.sh` ausführen und die Ausgabe zeigen.
> Fehlt etwas → keine Änderung machen, erst melden.
>
> **Nachher:** `bash tools/check.sh` erneut ausführen und zeigen.
> Erst dann den Patch liefern.
>
> **Außerdem:** `git diff --stat` zeigen. Erwartet: genau eine geänderte Datei.
> Bei mehr als 10 gelöschten Zeilen bei einer „drei Änderungen"-Aufgabe: stopp.

### Abnahme in einem Satz

> **Fehlt: 0 heißt gelungen. Alles andere heißt nachbessern.**

Der Besitzer muss dafür keinen Code lesen. Eine Zahl genügt.

---

## 6 · Sicherheit: was gelernt wurde

- **Zugangsdaten standen mehrfach im Chat.** Sie gelten als öffentlich und
  müssen widerrufen werden. Kein Token gehört in eine Nachricht, einen
  Screenshot oder eine Datei im Repository.
- **Ein Token, das nur Gists darf, kann das Spiel nicht verändern.** Das ist der
  einzige vertretbare Zuschnitt, falls überhaupt eines nötig ist.
- **Das Postfach braucht einen Token.** Die KI kann nur mit einem Gist-Token in
  das Postfach schreiben. Dieser Token ist für den gewählten Arbeitsweg
  (Patch → Postfach → Knopf) **notwendig**, nicht optional.
- **Nur Gists: Read and write**, Ablauf 30 Tage, **kein Repository-Zugriff**.
  Ein solcher Token kann im schlimmsten Fall ein Postfach verändern – nichts
  am Spiel. Das ist der einzige vertretbare Zuschnitt.
- **Nach erledigtem Ablegen widerrufen.** Der Token geht einmal durch den Chat;
  das ist bei diesem Aufbau unvermeidbar, weil die KI in einer Sandbox läuft
  und lokale Dateien nicht lesen kann.
- **Schutzregeln:** `main` ist geschützt (PR erforderlich, keine Force-Pushes).
  Tags dürfen nie verschoben werden – `v0.5` wurde zweimal überschrieben, seitdem
  gilt: bei Fehlern die nächste Nummer, nicht derselbe Tag.

---

## 5c · Basis-Prüfung vor jeder Übernahme

**Der Fehler, der am ehesten noch einmal passiert.**

Der Eröffnungstext sagte „Stand: neuester Tags". Der neueste Tag war `v0.5` →
Commit `314bf26`. `main` lag aber bei `06a17f59` – zwei Merges weiter. Eine KI
arbeitete korrekt nach Anweisung auf `v0.5` und baute dort ihre Änderung. Ergebnis:

- Der entfernte Kamin war auf ihrer Basis **noch vorhanden**
- Die Übergabe-Leiste existierte auf ihrer Basis **noch gar nicht**
- Ihre Änderung an `HouseView.tsx` setzte auf einer Datei auf, die es so nicht
  mehr gibt

**Regel:** Tags sind Momentaufnahmen und können **hinter** `main` zurückfallen.
Ein Tag ist nur dann die richtige Basis, wenn er ausdrücklich genannt wird.

**Im Eröffnungstext steht deshalb:**

> Basis: **main** – nimm den neuesten Commit auf main. Verwende keinen Tag,
> außer ich nenne ihn ausdrücklich; Tags können hinter main zurückfallen.

**Vor dem Übernehmen eines Patches prüfen:**

```bash
git fetch origin
git log --oneline origin/main -3        # was ist der echte Stand?
git diff --stat origin/main HEAD        # weicht die Basis ab?
```

Weicht die Basis ab, ist der Patch **nicht** zu übernehmen. Die KI muss auf
`origin/main` neu aufsetzen.

### 5c-b · Fertiger Korrekturtext für eine KI auf falscher Basis

> **Korrektur – drei Punkte, ohne Rückfrage umsetzen.**
>
> **1 · BASIS IST FALSCH.** Du arbeitest auf einem veralteten Stand. Verwende ab jetzt:
> ```
> git fetch origin
> git checkout main
> ```
> Auf `main` sind der Kamin bereits entfernt und die Übergabe-Leiste bereits eingebaut. Deine Änderungen gingen am falschen Stand an.
>
> **2 · Unbeauftragte Dateien zurücksetzen.** Alles, was ich nicht ausdrücklich verlangt habe, exakt wiederherstellen:
> ```
> git checkout origin/main -- index.html
> ```
>
> **3 · Nur die beauftragte Datei ändern.** Beginne mit der Fassung von `main`. Ändere ausschließlich das Verlangte, nichts nebenbei.
>
> **VERBOTEN:** `index.html`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `src/game/house.ts`, `src/game/luni.ts`, `src/StudioApp.tsx`, der `resize()`-Fix in `house.ts`.
>
> **Danach:** `./node_modules/.bin/tsc --noEmit && npm run build` und `git diff --stat` zeigen. Erwartet: genau eine geänderte Datei.

---

## 5d · Stand 30.10.2026 – main ist weitergelaufen

**Wichtigster Satz: Die vorbereiteten Dateien aus den Reitern „Immer sichtbar"
und „Uebergabe.tsx" sind veraltet.** Sie basieren auf `main = 06a17f59`.
Inzwischen liegt `main = 5b97c87`.

### Was seitdem dazugekommen ist

| Datei | Größe vorher | Größe jetzt |
|---|---|---|
| `src/game/house.ts` | 139.229 B | **189.960 B** |
| `src/game/luni.ts` | 38.980 B | **61.017 B** |
| `src/game/dream.ts` | – | **81.801 B** (neu) |
| `src/game/traumhaus.ts` | – | 8.550 B (neu) |
| `src/game/shower.ts`, `gol.ts`, `pixel.ts`, `steine.ts` | – | neu |
| `src/components/TraumhausView.tsx` | – | 1.509 B (neu) |
| `src/components/Uebergabe.tsx` | 5.611 B | 6.161 B (verändert) |
| `src/components/HouseView.tsx` | 3.437 B | 3.363 B (verändert) |
| `README.md` | 16.587 B | 19.155 B |
| `src/App.tsx` | 665 B | 787 B |

Merges seitdem: **PR #5** (Eröffnungstext: feste Erstaufgabe statt Platzhalter)
und **PR #6** (Traumhaus und Traumsequenz weiter ausbauen).

### Die wichtige Veränderung

`HouseView.tsx` rendert die Übergabe-Leiste **nicht mehr**. Es gibt dort keinen
`import Uebergabe` und kein `import.meta.env`. `App.tsx` hat jetzt eine
Hash-Weiche mit drei Zielen: `#studio`, `#traumhaus`, sonst das Haus.

Die Datei `src/components/Uebergabe.tsx` existiert weiter, wird aber **von
keiner Stelle aufgerufen**. Die Übergabe-Knöpfe sind damit auf `main`
funktionslos – nicht abgeschaltet, sondern gar nicht eingebunden.

### Was von den drei Aufgaben noch offen ist

| Aufgabe | Stand auf `main` |
|---|---|
| `overflow-hidden` → `overflow-x-hidden` (Zeile 54) | **offen** – steht noch drin |
| Hinweiszeile „Ein Möbelstück antippen…" (Zeile 90) | **offen** – steht noch drin |
| Übergabe-Leiste einbinden | **offen** – wird nirgends gerendert |
| `docs/BERATER-INFO.md` | **offen** – existiert nicht |
| `docs/PROJEKTSTATUS.md` | **offen** – existiert nicht |

### Regel für die Zukunft

Wenn eine Datei in den Reitern liegt und `main` sich bewegt hat: **nicht die
Datei drüberkopieren.** Dann überschreibt man fremde Arbeit. Stattdessen der KI
die **kleinstmögliche Änderung** beschreiben und sie auf dem aktuellen `main`
ausführen lassen.

Prüfen vor jedem Übernehmen:

```bash
git fetch origin
git log --oneline origin/main -3
git diff --stat origin/main <zweig>
```

---

## 6b · Widersprüche im Repository (Stand `06a17f59`)

Diese vier Stellen widersprechen sich. Wer sie nicht kennt, arbeitet gegen das
Projekt.

| # | Widerspruch | Folge |
|---|---|---|
| 1 | **Live-Eröffnungstext vs. korrigierte Fassung.** `src/components/Uebergabe.tsx` kopierte den alten Text („Stand: main", „npx tsc"). Die korrigierte Fassung existierte nur im Chat. | Behoben durch die Datei im Reiter „Uebergabe.tsx" (145 Zeilen). |
| 2 | **`npx tsc` an vier Stellen im README**, dazu im Eröffnungstext. | Installiert das fremde Paket `tsc@2.0.4`. |
| 3 | **README behauptet Tag `v0.6`**, der nicht existiert. | Wer `v0.6` anfordert, bekommt einen Fehler. |
| 4 | **Toter Verweis:** Die korrigierte Fassung verlangte `docs/DARSTELLUNG.md`. `docs/` enthält nur `merkzettel.md` und `spielkonzept.md`. | Aufgelöst: Die Positivliste steht jetzt direkt im Eröffnungstext, keine externe Datei nötig. |
| 5 | **Hinweiszeile unter dem Haus.** `HouseView.tsx` enthielt eine von einer KI ungefragt ergänzte Zeile „Ein Möbelstück antippen oder anklicken – Luni geht hin. · M Ton". | Widersprach der Positivliste „keine Steuerungserklärung darunter". Entfernt. |
| 6 | **`overflow-hidden` im äußeren Container.** Schnitt das aufgeklappte Übergabe-Panel ab. | Knöpfe wirkten tot. Behoben mit `overflow-x-hidden`. |
| 7 | **„Stand: neuester Tag" im Eröffnungstext.** Der neueste Tag (`v0.5`) lag hinter `main`. Eine KI baute auf veraltetem Stand. | Geändert zu „Basis: main – neuester Commit". Details in §5c. |
| 8 | **`index.html` ohne Auftrag geändert.** Auf `main` und `v0.5` zeichengleich, die Änderung war also echt. | Regel-0-Verstoß. Korrekturtext in §5c-b. |

**Verbindlich ist der Text, den der Knopf kopiert** – solange `Uebergabe.tsx`
nicht geändert ist.

---

## 6c · Token anlegen – fertiger Link und Checkliste

**Fertiger Link** (führt direkt zum vorausgefüllten Formular):

```
https://github.com/settings/personal-access-tokens/new?name=adventshaus-postfach&description=Nur+Gists+-+Postfach+fuer+KI-Patches&expires_in=30&gists=write
```

Der Link füllt vor: **Token name**, **Description**, **Expiration (30 Tage)** und
die Berechtigung **Gists: Read and write**.

**Was du selbst anhaken musst** – drei Punkte, die der Link nicht setzt:

| # | Feld | Anzuhaken |
|---|---|---|
| 1 | **Resource owner** | `Chihuaua` (Voreinstellung, nur prüfen) |
| 2 | **Repository access** | **Public repositories (read-only)** – nicht „All", nicht „Only select" |
| 3 | **Permissions → Repository permissions** | **jede Zeile auf „No access"**. „Metadata" bleibt automatisch read-only, das gewährt nichts. |

Danach **„Generate token"**. Der Token erscheint **einmal** – sofort in den
Passwortmanager kopieren, nicht in eine Datei im Projekt.

### Warum „kein Repository-Zugriff" nicht als eigenes Feld existiert

Es gibt keine Option mit diesem Namen. Gemeint ist: Im Block **Repository
permissions** bleibt **jede** Zeile auf **No access**. `Gists` steht **nicht**
dort, sondern im Block **Account permissions** – deshalb wird es leicht
übersehen.

### Was dieser Token kann und was nicht

| | |
|---|---|
| Gist `f28cc85b…` lesen und schreiben | ✅ |
| Patch + Prüfsumme ablegen | ✅ |
| Spiel-Repository lesen | nur öffentlich, wie jeder |
| Spiel-Repository **schreiben** | ❌ |
| Commits, PRs, Branches anlegen | ❌ |

Schlimmsten Fall kann jemand Müll ins Postfach schreiben. Am Spiel kann er nichts
ändern.

### Nach der Nutzung

**Widerrufen:** Settings → Developer settings → Personal access tokens →
Fine-grained tokens → **Delete**. Der Token geht einmal durch den Chat; das ist
bei diesem Aufbau unvermeidbar, weil die KI in einer Sandbox läuft und lokale
Dateien nicht lesen kann.

---

## 7 · Projektstand zum Zeitpunkt dieser Notiz

| | |
|---|---|
| Letzter Stand | `main` mit entferntem Kamin, Übergabe-Leiste, Regel 0 |
| Tags | **`v0.1`–`v0.5`** – `v0.6` existiert **nicht**. `v0.5` zeigt auf `314bf26`, also vor dem Kamin-Merge. Tags sind die Referenz, nicht `main`. |
| Prüfstand dieser Datei | `main = 06a17f59`, 27.10.2026 23:39 UTC, Tag `v0.5` |
| Nach der Übernahme | `main` enthält `HouseView.tsx` (92 Zeilen, `<Uebergabe />` ohne Bedingung) und `Uebergabe.tsx` (145 Zeilen, korrigierter Text). Tag **`v0.6`**. |
| Aktueller Stand | **`main = 9030610`** (nach PR #7). `docs/FEATURES.md` und `tools/check.sh` sind gemergt. Tags weiterhin nur `v0.1`–`v0.5`. |
| Offene Aufgaben | `overflow-x-hidden` fehlt · Hinweiszeile steht noch · `import Uebergabe` fehlt · `docs/BERATER-INFO.md` existiert nicht |
| Abnahme | `bash tools/check.sh` → **Fehlt: 0** |
| Offen | `docs/PROJEKTSTATUS.md`, `docs/DARSTELLUNG.md`, `docs/arbeitsablauf.md` |
| Nächster Schritt | Spielstand (JSON, `schemaVersion`, Offline-Zeit), dann Bedürfnisse |

---

## 7b · Die drei Befehle, die vor jeder Übernahme stehen

```bash
git fetch origin
git log --oneline origin/main -3
git diff --stat origin/main HEAD
```

Weicht die Basis ab oder steht eine Datei in der Änderung, die nicht beauftragt
war: **nicht übernehmen.** Korrekturtext aus §5c-b an die KI.

---

## 8 · Wie diese Datei zu behandeln ist

1. **Nicht automatisch lesen.** Nur auf ausdrückliche Aufforderung.
2. **Nicht als Arbeitsauftrag verstehen.** Sie beschreibt Erfahrung, nicht
   offene Aufgaben.
3. **Nicht ergänzen, ohne den Besitzer zu fragen.** Sie ist ein Beratungsstand,
   kein Änderungsort.
4. **Keine Zugangsdaten aufnehmen.** Niemals.

---

# ANHANG · Die Wünsche des Besitzers und die Wege dahin

Dieser Anhang ist vollständig und ungekürzt. Er hält fest, was der Besitzer
verlangt hat, welcher Weg gegangen wurde, was funktioniert hat und was nicht.
Zweck: Nie wieder von vorn anfangen.

---

## A · Die Wünsche, vollständig

| # | Wunsch | Stand |
|---|---|---|
| A1 | **Vorschau in der Arena sehen** – nicht nur Textbeschreibungen | **erreichbar, aber eine Bedingung muss erfüllt sein.** Die Arena-Vorschau bedient das **Wurzelverzeichnis** der Sandbox. Liegt das Projekt in einem Unterordner, zeigt die Vorschau das leere Template („Ready to build"). Siehe Abschnitt L. |
| A2 | **Ein Knopf, der die KI auf den neuesten Stand bringt** | nicht direkt möglich. Die KI läuft in einer eigenen Sandbox. Erreicht: Knopf **KI-Start**, der den vollständigen Anweisungstext in die Zwischenablage legt. Ein Klick, ein Einfügen. |
| A3 | **Ein Knopf, der lokal und GitHub auf einen Stand bringt** | erreicht. Knopf **Adventshaus-Sichern**. |
| A4 | **Automatische Versionsnummern**, immer mit der neuesten arbeiten, außer er wollte einen Vorgänger | erreicht. `snapshot.sh` setzt pro Lauf einen Tag `v20261030-2011`. Ältere Stände über `git checkout <tag>`. |
| A5 | **Kein dritter Knopf** | bestätigt: zwei reichen. |
| A6 | **Nie wieder ungenaue Formulierungen** wie „diesen Block einfügen" | erreicht. Ab diesem Punkt steht bei jedem Schritt der **Ort** (Terminal, Kate, Browser) und der **genate Inhalt** dabei. |
| A7 | **Nie wieder nach jeder Pause viel Arbeit** | erreicht durch `check.sh` + `snapshot.sh`. Vor der Sitzung ein Befehl, danach ein Doppelklick. |
| A8 | **Zuverlässige Übergabe an eine KI, täglich** | erreicht durch `FEATURES.md` + `check.sh`. Abnahme ist eine Zahl: `Fehlt: 0`. |
| A9 | **Kein Token in Chats** | teilweise. Vier Token-Fragmente standen im Verlauf und gelten als kompromittiert. Die Regel steht jetzt im Eröffnungstext. |
| A10 | **Kamin entfernen** | erledigt, PR #2. |
| A11 | **Eröffnungstext mit fester Erstaufgabe** statt leerem „Aufgabe:" | erledigt, PR #5. |
| A12 | **Terminal nur zur Einrichtung**, danach nur Klicks | erreicht. |

---

## B · Die Wege, die gegangen wurden

| Weg | Was er tut | Ergebnis |
|---|---|---|
| **ZIP hochladen** | Projekt als Archiv | **scheiterte** – Arena nimmt keine ZIP |
| **GitHub öffentlich + Raw-Links** | KI liest Dateien direkt | **funktioniert** |
| **Desktop-Knopf `adventshaus-knopf.sh`** | holt Patch aus dem Postfach, prüft, legt Zweig an, öffnet PR | funktioniert, braucht Gist |
| **Patch per Zwischenablage** | Block kopieren, `kate ~/patch.patch`, `git am` | **scheiterte** mehrfach – Blöcke rissen ab |
| **Gist-Postfach + Token** | KI legt Patch ab, Knopf holt ihn | funktioniert, aber Token im Chat |
| **GitHub-Browser-Editor** | Datei direkt auf GitHub ändern, Branch + PR | **zuverlässigster Weg**, kein Token |
| **`docs/FEATURES.md` + `tools/check.sh`** | prüft, ob Funktionen noch existieren | **das Netz** – fand jede Regression |
| **`tools/snapshot.sh`** | prüfen, committen, pushen, PR annehmen, taggen, spiegeln | **ein Klick** |
| **KI-Start-Knopf** | Anweisungstext in die Zwischenablage | **ein Klick** |

---

## C · Was scheiterte und warum

| # | Problem | Ursache | Lösung |
|---|---|---|---|
| C1 | Haus wurde halb gezeichnet | `resize()` dimensionierte die Zwischenflächen nicht unabhängig | Fix in `house.ts`, erhalten |
| C2 | Build scheiterte an einer PDF | Datei fehlte, importiert in `HouseView.tsx` | Import entfernt |
| C3 | Sechs parallele Projektordner | nummerierte Sicherungen statt Git | ein Ordner, Git-Historie |
| C4 | KI baute auf `v0.5` | Eröffnungstext sagte „neuester Tag", Tags hinken hinter `main` | Text sagt jetzt „Basis: main" |
| C5 | Übergabe-Knöpfe fehlten im Build | `import.meta.env.DEV`-Bedingung | Bedingung entfernt |
| C6 | Klick auf Knopf schien nichts zu tun | `overflow-hidden` schnitt das Panel ab | `overflow-x-hidden` |
| C7 | Ungefragte Texte über und unter dem Haus | Eröffnungstext sagte nicht, dass die Oberfläche fix ist | **Regel 0** + Positivliste |
| C8 | Hovertexte wurden größer | kein Soll-Wert genannt | exakte Werte im Text |
| C9 | KI fragte nach Token | eigenes Projekt beschrieb das Postfach-Token | Text + `Uebergabe.tsx` korrigiert |
| C10 | KI zeigte keine Vorschau | Projekt lag im Unterordner `adventshaus/`, die Arena bedient die Sandbox-**Wurzel**. Der eigene Dev-Server lief auf 5173 im Unterordner – für das Vorschaufenster unsichtbar. | Projekt in die Wurzel legen, Dev-Server dort starten. Siehe Abschnitt L. |
| C11 | KI stoppte nach den zwei Prüfausgaben | Text sagte „bevor du irgendetwas machst" | Text sagt jetzt: **OFFEN ist normal, weiterarbeiten** |
| C12 | Bett-Routine schien verloren | Aufruf ist an Tageszeit gebunden (ab 20:00, vor 06:00 oder krank) | Prüfen mit `grep -n startBedRoutine src/game/house.ts` |
| C13 | Blöcke rissen beim Einfügen ab | lange Blöcke in Chat und Kate | Befehle statt Dateiinhalte, `printf` statt Heredoc |
| C14 | `.desktop`-Datei ohne `Type=` | Heredoc abgeschnitten | `printf '%s\n' … > datei` |

---

## D · Die festen Regeln für Erklärungen

Diese Regeln gelten ab jetzt für jede Antwort an den Besitzer:

1. **Nie auf eine frühere Nachricht verweisen.** Alles, was gebraucht wird, steht
   an der Stelle, wo es gebraucht wird.
2. **Nie „diesen Block einfügen".** Der Inhalt steht ausgefüllt daneben.
3. **Immer den Ort nennen:** Terminal, Kate, Browser, Schreibtisch.
4. **Immer die Erwartung nennen:** was soll ausgegeben werden, und was tun, wenn
   es abweicht.
5. **Ein Schritt pro Nachricht, wenn der Besitzer überfordert wirkt.**
6. **Keine Code-Lesekenntnisse voraussetzen.** Prüfungen sind Befehle mit Zahlen.

---

## E · Terminal-Grundlagen (damit es nie wieder Unklarheit gibt)

| Aufgabe | Wie |
|---|---|
| Terminal öffnen | `Strg+Alt+T`, oder KDE-Menü → „Konsole" |
| Aus Dolphin | `F4` |
| Einfügen | **`Strg+Shift+V`** (nicht `Strg+V`) |
| Befehl abbrechen | `Strg+C` |
| Bereit für Eingabe | Prompt endet auf `$` |
| Eingabe hängt | Prompt zeigt `>` → `Strg+C` |

---

## F · Die zwei Knöpfe auf dem Schreibtisch

| Datei | Rolle |
|---|---|
| `Adventshaus-Sichern.desktop` | **Doppelklick.** Prüft, committet, pusht, legt PR an, nimmt PR an, setzt Tag, aktualisiert Spiegel |
| `Adventshaus-Sichern.sh` | das Skript dahinter – nicht anfassen |
| `KI-Start.desktop` | **Doppelklick.** Legt den Anweisungstext in die Zwischenablage |
| `KI-Start.sh` | das Skript dahinter – nicht anfassen |
| `~/ki-start.txt` | der Text, den KI-Start benutzt |

---

## G · Der Anweisungstext für eine KI (Kern)

Vollständig in `~/ki-start.txt`. Die entscheidenden Stellen:

**Basis:** `main`, neuester Commit. Kein Tag.

**PFLICHT vor der Arbeit:**
```
git fetch origin && git log --oneline -1 origin/main
bash tools/check.sh | tail 4
```

**Wie die Ausgabe zu lesen ist – das ist der wichtigste Satz:**
- `OFFEN` = Aufgabe noch nicht erledigt. **Normalzustand. Weiterarbeiten.**
- `FEHLT` = eine vorhandene Funktion ist weg. **Fehler. Anhalten und melden.**
- `Fehlt: 0` = keine echten Fehler.

**Dann:** Aufgabe umsetzen, bauen, zeigen.

**Abnahme:**
```
bash tools/check.sh | tail 4
git diff --stat
```
Erwartet: `Fehlt: 0`, `Offen: 0`, genau eine geänderte Datei.

**Erst dann:** Patch plus Prüfsumme ins Postfach.

---

## H · Verbote für eine KI

- `index.html`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`
- `src/App.tsx`
- alles in `src/game/`
- `src/StudioApp.tsx`
- `src/components/TraumhausView.tsx`
- `docs/`, `tools/`
- der `resize()`-Fix in `house.ts`
- `src/game/original.ts`
- nichts zurückholen: Kamin, PDF-Download, `engine.ts`, `Hud.tsx`,
  `Overlays.tsx`, `TouchControls.tsx`

---

## I · Die verbindliche Oberfläche

**Sichtbar, abschließend:**
1. Kopfzeile: `LUNIS HAUS`, Untertitel, `LUNI-STUDIO →`, Tonknopf
2. Monitorrahmen mit Canvas im Verhältnis 8:5, maximale Breite 1140 px
3. Übergabe-Leiste direkt darunter
4. Hintergrund `.bg-room .grid-floor`

**Verboten:**
- Spielbeschreibung oder Einleitung über dem Haus
- Steuerungserklärung, Tastenhinweise oder Fusszeile darunter
- Footer, Credits, Versionszeile
- zusätzliche Karten, Panels, Tooltips ausserhalb des Canvas
- neue Komponenten um das Spiel
- Änderungen an `.bezel`, `.screen-glass`, `.bg-room` oder der Canvas-Grösse

**Hovertexte im Canvas:** `600 11px "Space Grotesk"`, Text `#eef7f2`,
Hintergrund `rgba(8,20,26,.88)`, Boxhöhe 20, Radius 5, Innenabstand 8,
Bühneneinheiten 960 × 600. Nicht vergrössern, nicht durch HTML ersetzten.

---

## J · Stand zum Zeitpunkt dieses Anhangs

| | |
|---|---|
| `main` | `e710374` (PR #8 gemergt) |
| Tags | `v0.1`–`v0.5` plus Sicherungs-Tags `v20261030-…` |
| `check.sh` | unterscheidet OFFEN von FEHLT |
| `snapshot.sh` | legt PR an **und nimmt sie an** |
| Knöpfe | `Adventshaus-Sichern`, `KI-Start` |
| Offen | `overflow-x-hidden` fehlt · `import Uebergabe` fehlt · Hinweiszeile steht noch |
| Abnahme | `Fehlt: 0`, `Offen: 0` |

---

## K · Was der Besitzer ausdrücklich ablehnt

- Zugangsdaten in Chats, Screenshots oder dem Repository
- ungenaue Anweisungen und Verweise auf frühere Nachrichten
- mehrere parallel laufende Projektordner
- Überschreiben grosser Dateien durch eine KI
- „Verbesserungen", die nicht beauftragt waren

---

## L · Die Vorschau in der Arena – die eigentliche Bedingung

**Das war der teuerste Irrtum der Zusammenarbeit.**

Lange hiess es, eine KI könne in der Arena keine Vorschau zeigen. **Falsch.** Der
wirkliche Grund war ein Verzeichnisfehler:

| Was die Arena tut | Was die KI tat |
|---|---|
| bedient das **Wurzelverzeichnis** `/home/user/sandbox` | klonte nach `/home/user/sandbox/adventshaus/` |
| zeigt, was in der Wurzel liegt | startete `npm run dev` im Unterordner, Port 5173 |
| → leeres Template „Ready to build" | → Screenshots echt, aber im falschen Fenster |

Die Screenshots waren korrekt. Sie erreichten nur nie das Vorschaufenster.

### Die Regel, die in jede KI-Nachricht gehört

> **Dein Arbeitsverzeichnis ist die Sandbox-Wurzel. Die Arena-Vorschau bedient
> diese Wurzel. Lege das Projekt direkt dort ab – nicht in einem Unterordner –
> und starte den Dev-Server ebenfalls dort. Prüfe vor dem Melden mit
> `curl -s http://localhost:5173 | grep -o '<title>.*</title>'`, ob dort dein
> Spiel antwortet und nicht das Template.**

### Die drei Befehle, die es erzwungen haben

```bash
cd /home/user/sandbox                      # Wurzel, nicht Unterordner
cp -r adventshaus/* . 2>/dev/null          # oder direkt hierher klonen
npm run dev                                # Dev-Server in der Wurzel
curl -s http://localhost:5173 | grep -o '<title>.*</title>'
```

**Erwartet:** `Little Computer Luni · Das Adventshaus`
**Falsch:** `Ready to build` oder ein leerer Titel → die Vorschau zeigt das Template.

### Was die KI danach geliefert hat

| Prüfung | Ergebnis |
|---|---|
| Titel ausgeliefert | `Little Computer Luni · Das Adventshaus` |
| HTTP-Status | 200 |
| Konsolenfehler | keine |
| Gemalte Pixel im Canvas | 575 141 von 576 000 = 99,9 % |
| Farbige Pixel | 396 563 |
| Hover-Label „Kaffeemaschine" | 109 helle Textpixel gefunden |

**Das ist der Beweis:** Die Vorschau funktioniert. Es braucht nur die richtige
Wurzel.

### Konsequenz für den KI-Start-Text

Der Text in `~/ki-start.txt` muss diesen Absatz enthalten – **vor** der Aufgabe,
nicht danach:

> **ARBEITSVERZEICHNIS:** Deine Sandbox-Wurzel ist das, was die Vorschau bedient.
> Klone das Projekt direkt dorthin, nicht in einen Unterordner. Starte den
> Dev-Server ebenfalls dort. Prüfe mit
> `curl -s http://localhost:5173 | grep -o '<title>.*</title>'` ob dein Spiel
> antwortet. Steht dort nicht der Spieltitel, sieht der Besitzer nur das
> „Ready to build"-Template.

---

## M · Die zwei KI-Antworten zur Vorschau (vollständig übernommen)

Zwei verschiedene Modelle wurden gefragt: **Was hindert dich daran, das Spiel in
der Vorschau zu zeigen?** Beide nannten unabhängig dieselbe Ursache.

### M.1 · qwen3.8-27b – die ehrliche Antwort

> „Nichts – das lief nur bei mir nicht sauber zusammen, ich hatte die Bilder nur
> beschrieben statt sie anzuzeigen."

Ablauf seiner Reparatur:
1. Dev-Server war gestoppt → neu gestartet
2. Playwright-Browser-Cache war geleert → `npx playwright install chromium`
3. `libasound2` fehlte, Paketlisten waren geleert → `sudo apt-get update` + Install
4. Modul-Auflösung schlug fehl, weil Node am **Skript-Pfad** sucht, nicht am
   Arbeitsverzeichnis → Skript nach `/tmp/shot7/` kopiert
5. Danach: drei frische Screenshots, keine Konsolenfehler

Seine Bilder im Detail:

| Bild | Inhalt |
|---|---|
| `live_1_gesamt` | Spiel läuft, Uhr 30.10. 20:51, Sternenhimmel, Luni im Flur, Übergabe-Leiste unter dem Monitor, Hinweiszeile **weg** |
| `live_2_kaffee` | Klick auf die Kaffeemaschine → Luni läuft selbst in die Küche, Hover-Label „Kaffeemaschine" im Canvas |
| `live_3_leiste` | Übergabe-Leiste aufgeklappt, „✓ KOPIERT", Eröffnungstext sichtbar |

Sein Satz dazu:

> „Zur Frage: Nichts hat das gehindert – in den letzten Runden habe ich die
> Bilder aus Versehen nur beschrieben und nicht eingebunden. Die Dateien lagen
> die ganze Zeit in `adventshaus/vorschau/`."

Und sein Stand:

> `Fehlt: 0, Offen: 0, eine geänderte Datei (src/components/HouseView.tsx),
> Patch + Prüfsumme (2a93496b8d767121) liegen bereit in
> `aktuell.patch`/`aktuell.json`. Für das Postfach brauche ich weiterhin das
> Gist-Token in zwei Hälften.`

### M.2 · qwen3.8-max – die strukturelle Antwort

> „Der echte Hinderungsgrund war struktureller Natur: die Vorschau bedient das
> Projekt-Wurzelverzeichnis, und das Spiel lag die ganze Zeit in einem
> Unterordner `adventshaus/`."

Seine Reparatur:
1. Wurzel geprüft: `/home/user/sandbox` enthält das leere Template
   („Ready to build", violetter Kalender-Symbol)
2. Abhängigkeiten von Wurzel und Unterordner verglichen: **identisch**
3. Spiel in die Wurzel kopiert, `tsc --noEmit` + `npm run build` dort
4. `pkill -f "vite"` schlug fehl, weil die **Befehlszeile selbst „vite" enthielt**
   und die eigene Shell traf → sauberer Neustart mit `setsid nohup`
5. Dev-Server auf Port 5173 in der Wurzel gestartet
6. Prüfung: `curl -s http://localhost:5173` liefert
   `Little Computer Luni · Das Adventshaus`

Seine Messungen:

| Prüfung | Ergebnis |
|---|---|
| Ausgelieferter Titel | `Little Computer Luni · Das Adventshaus` |
| Modul | `/src/main.tsx` (Vite 7.3.2, Port 5173) |
| HTTP-Status | 200 |
| Konsolenfehler | keine |
| Gemalte Pixel (nicht schwarz) | 575 141 von 576 000 = **99,9 %** |
| Farbige Pixel | 396 563 |
| Hover-Label „Kaffeemaschine" | 109 helle Textpixel gefunden |

Sein Satz:

> „Die Vorschau bedient das Wurzelverzeichnis. Dort lag aber das leere Template.
> Das Spiel hatte ich die ganze Zeit im Unterordner geklont und dort auch
> `npm run dev` gestartet – auf Port 5173 lief also ein zweiter, vom
> Vorschaufenster getrennter Server. Meine Screenshots waren echt und korrekt,
> sie kamen aber nie in Ihrem Vorschaufenster an. Das war mein Fehler, kein
> technisches Hindernis."

Zusätzlich nannte er drei Dinge:

1. **Diese Sitzung kann keine Bilder anzeigen** (`read_file` auf PNG meldet
   „This model cannot view images"). Er prüfte deshalb pixelgenau
   programmatisch statt zu schauen.
2. **Die Sandbox leert zwischen Schritten** `.git`, `node_modules` und den
   Browser-Cache. Das kostet Zeit, blockiert aber nichts.
3. **Der Patch liegt, kommt aber nicht ins Gist** – dafür wird das Token
   gebraucht.

---

## N · Stand der HouseView-Aufgabe

**Die Aufgabe ist erledigt.** Von der KI bestätigt, von beiden Modellen
unabhängig geprüft:

| Änderung | Status |
|---|---|
| `overflow-hidden` → `overflow-x-hidden` (Zeile 54) | erledigt |
| Hinweiszeile „Ein Möbelstück antippen…" entfernt | erledigt |
| `import Uebergabe` + `<Uebergabe />` eingebaut | erledigt |

Abnahme laut KI: `Fehlt: 0`, `Offen: 0`, genau eine geänderte Datei.

**Was fehlt, ist nicht die Arbeit, sondern der Transport.**

| Was | Wo es liegt |
|---|---|
| Patch (`aktuell.patch`) | in der KI-Sandbox |
| Prüfsumme (`aktuell.json`) | in der KI-Sandbox |
| Prüfsumme | `2a93496b8d767121` |
| Im Gist-Postfach | **nichts** – dafür wird das Token gebraucht |
| Im Projekt auf dem Rechner | **noch nicht** |

**Deshalb ist die Änderung fertig, aber noch nicht übernommen.**

---

## O · Die zwei Knöpfe im Detail

Es gibt zwei Knöpfe mit **grundverschiedenen** Aufgaben. Beide liegen auf dem
Schreibtisch, beide sind eigenständig.

### O.1 · Adventshaus-Sichern

| Aspekt | Beschreibung |
|---|---|
| **Richtung** | von deinem Rechner **nach** GitHub |
| **Auslöser** | Doppelklick auf `Adventshaus-Sichern.desktop` |
| **Skript** | `~/Schreibtisch/Adventshaus-Sichern.sh` → `~/projekte/adventshaus/tools/snapshot.sh` |
| **Schritte** | 1 Funktionsprüfung · 2 Stand vergleichen · 3 committen · 4 pushen · 5 Tag setzen · 6 Spiegel |
| **Voraussetzung** | alles, was gesichert werden soll, ist **bereits auf der Festplatte** |
| **Was er committet** | alles Offene, mit `git add -A` |
| **Push** | direkt, oder bei geschütztem `main`: Zweig `ki/sicherung-…` + PR anlegen + **PR selbst annehmen** |
| **Tag** | `v<jahr><monat><tag>-<stunde><minute>`, z. B. `v20261030-2011` |
| **Spiegel** | `~/sicherung/adventshaus.git` |
| **Gist** | berührt er **nicht** |
| **Netz** | braucht keines |
| **Was er NICHT kann** | nichts aus dem Gist holen · keine KI-Arbeit übernehmen |

### O.2 · Postfach-Knopf (aus dem anderen Chat)

| Aspekt | Beschreibung |
|---|---|
| **Richtung** | aus dem Gist-Postfach **auf** deinen Rechner |
| **Auslöser** | Doppelklick auf „Adventshaus" (älteres Symbol) |
| **Quelle** | `https://gist.github.com/Chihuaua/f28cc85bf67f8a7f2fa6251a2092a33c` |
| **Dateien im Gist** | `aktuell.patch`, `aktuell.json` (mit `sha256`, `titel`, `basis`), `install-knopf.sh`, `adventshaus-knopf.sh` |
| **Schritte** | 1 Zwischenablage prüfen · 2 offene Freigaben auf GitHub prüfen · 3 Patch holen, Prüfsumme vergleichen, auf Zweig `ki/…` anwenden, Typen und Build prüfen, Pull Request öffnen |
| **Voraussetzung** | **Gist-Token** (die KI braucht es, um hineinzuschreiben) |
| **Prüfsumme** | vergleicht `sha256` aus `aktuell.json` mit dem Patch |
| **Doppelt angewendet** | wird erkannt und übersprungen |
| **Was er NICHT kann** | nichts committen, was nicht im Patch liegt · keine eigenen Tags setzen |

### O.3 · Der entscheidende Unterschied

| | Adventshaus-Sichern | Postfach-Knopf |
|---|---|---|
| Quelle der Änderung | **dein eigener** Arbeitsstand | **eine KI** hat geliefert |
| Wann läuft er | nach deiner Arbeit | nach der KI-Arbeit |
| Was er sichert | den aktuellen Stand | einen fremden Vorschlag |
| Token | keins | Gist-Token |
| Prüfung vor dem Übernehmen | `check.sh` (Fehlt muss 0 sein) | Prüfsumme + Build |

**Beide sind nötig, weil sie entgegengesetzte Richtungen bedienen.**

---

## P · Können beide Knöpfe gefahrlos genutzt werden?

**Ja – mit drei Bedingungen.**

| # | Bedingung | Warum |
|---|---|---|
| 1 | **Nie beide gleichzeitig.** Erst der eine fertig abwarten, dann der andere. | Beide schreiben in dasselbe Repository. Gleichzeitig = Konflikt. |
| 2 | **Erst KI-Arbeit übernehmen, dann sichern.** Also: Postfach-Knopf → PR mergen → Adventshaus-Sichern. | Sonst committet der Sichern-Knopf einen Stand, den du noch nicht gesehen hast. |
| 3 | **Nie auf `main` arbeiten, während eine PR offen ist.** | Die PR baut auf dem alten Stand. |

### Die Reihenfolge, die immer gilt

```
KI arbeitet
  ↓
KI legt Patch ins Gist (braucht Token)
  ↓
Doppelklick „Adventshaus" (Postfach-Knopf)
  ↓ prüft Prüfsumme, wendet an, baut, öffnet PR
Browser: Merge pull request → Confirm merge → Delete branch
  ↓
Doppelklick „Adventshaus-Sichern"
  ↓ committet Rest, setzt Tag, spiegelt
Fertig
```

### Wo die Gefahr wirklich liegt

Nicht in den Knöpfen. In diesen drei Stellen:

| Gefahr | Schutz |
|---|---|
| KI ändert eine Datei, die sie nicht darf | `git diff --stat` vor dem Merge – genau eine Datei |
| Eine Funktion geht verloren | `bash tools/check.sh` → `Fehlt: 0` |
| Der Patch passt nicht zum Stand | Prüfsumme + `basis` im Gist; notfalls `git rebase origin/main` |

### Eine Einschränkung, die ich offenlegen muss

Ich kenne den **Postfach-Knopf nur aus der Beschreibung** in deiner README und
aus seiner eigenen Ausgabe. Geprüft habe ich ihn nie. Was er nach eigenen
Angaben tut, steht in O.2 – aber erstellen oder reparieren kann ich ihn nicht,
weil er nicht in deinem Projekt liegt, sondern nur im Chat existierte.

**Mein Knopf liegt dagegen in deinem Projekt** und ist von mir getestet.

---

## Q · In welcher Form die Berater-Info ins Projekt gehört

### Q.1 · Die Form

**Als eine einzige Markdown-Datei:**

```
docs/BERATER-INFO.md
```

Warum diese Form und keine andere:

| Form | Problem |
|---|---|
| PDF | nicht diffbar, nicht durchsuchbar, riesst bei jeder Änderung |
| HTML | doppelt gepflegt, KI muss Browser-Inhalt lesen |
| viele kleine Dateien | KI weiss nicht, was zusammengehört |
| **eine `.md`** | KI liest sie mit einem Befehl · Git zeigt jede Änderung · dein Knopf sichert sie automatisch |

### Q.2 · Wie die KI sie liest

Sie steht schon an der richtigen Stelle. Ganz oben in der Datei:

> **LIES DIESE DATEI NUR, WENN DER BESITZER ES AUSDRÜCKLICH SAGT.**

Also: Die KI liest sie **auf Ansage**, nicht von selbst. Das ist gewollt.

Der Befehl dafür, im KI-Start-Text:

> Lies `docs/BERATER-INFO.md` – aber nur wenn ich es sage.

### Q.3 · Wie sie aktualisiert wird

| Weg | Möglich? | Wie |
|---|---|---|
| **Kate + Adventshaus-Sichern** | **ja** | Datei öffnen, einfügen, `Strg+S`, Doppelklick. Der Knopf committet sie. |
| **Postfach-Knopf** | **nur als Patch** | Wenn eine KI einen Patch für `docs/BERATER-INFO.md` ins Gist legt, spielt der Knopf ihn ein wie jede andere Datei. |
| **Von mir direkt** | **nein** | Ich habe keinen Schreibzugriff auf dein Repository. |

### Q.4 · Was ich kann und was nicht

| Kann | Nicht |
|---|---|
| den vollständigen Inhalt liefern, ungekürzt | in dein Repository schreiben |
| die Datei in der Vorschau zum Kopieren bereitstellen | auf deinem Rechner speichern |
| prüfen, was auf GitHub liegt | GitHub verändern |
| ein Skript bauen, das sie druckt | eine PDF-Datei erzeugen |
| den KI-Start-Text ergänzen | die KI zwingen, etwas zu lesen |

### Q.5 · Was jetzt fehlt

Die Datei ist **noch nicht** in `docs/`. Sie liegt nur in meiner Vorschau
(844 Zeilen plus dieser Anhang). Solange sie nicht in Kate gespeichert ist,
sichert dein Knopf sie nicht.

---

## R · Was in diesem Anhang neu ist

| Vorher | Jetzt |
|---|---|
| 296 Zeilen | **dieser Stand** |
| keine Arena-Analyse | zwei KI-Antworten, beide Ursachen, beide Reparaturen |
| HouseView-Aufgabe offen | erledigt, aber Patch steckt in der Sandbox |
| ein Knopf | zwei Knöpfe, im Detail verglichen |
| keine Form-Frage | Form, Aktualisierung, Können/Nicht-Können |
