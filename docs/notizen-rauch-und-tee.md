# Notizen · Rauch, Zigarette, Gesundheitstee

**Stand: alle sieben Punkte umgesetzt.** Basis `d656d4a` (main, PR #29).
Alle Zeitangaben sind echte Sekunden. Der Rauch wird in `updateActions(dt)`
mit dem normalen Zeitschritt gerechnet (`src/game/house.ts`).

---

## 1 · Antworten auf die Fragen des Besitzers

### Wie lange brennt eine Zigarette?

| Größe | Wert | Fundstelle |
|---|---|---|
| Brenndauer je Zigarette | **210–300 s** (3:30–5:00 min), zufällig | `newBurn()`, house.ts:3347 |
| Davon aktiv in der Hand | **20 s**, dann legt sie selbst ab und holt das Handy | `smokeIdleT >= 20`, house.ts:4341 |
| Restliche Brenndauer | glüht im Aschenbecher weiter, `burnLeft` läuft mit | house.ts:3849 |
| Zugrhythmus | 7-s-Zyklus: 3,6 s ruhen, Hand zum Mund, ziehen, ausatmen | `smokeCycle()`, luni.ts:252 |
| Wiederaufnehmen | restliche Brenndauer bleibt erhalten, sonst neue Zigarette | house.ts:4051 |

Eine Zigarette wird also nie am Stück leergeraucht: 20 s Hand, danach
Aschenbecher, und dort brennt sie die restlichen 190–280 s herunter.

### Wie schnell füllen sich die Räume?

Dichte 0 = klar, 1 = undurchsichtig.

| Zustand | Änderung je Sekunde | Zeit von 0 auf 1 |
|---|---|---|
| Luni raucht aktiv | **+0,022** | ca. 45 s |
| Zigarette glüht im Aschenbecher | **+0,007** | ca. 143 s |
| Keine Glut, Tür zu | −0,020 | 50 s bis klar |
| Gartentür offen, Raucherraum | −0,400 | 2,5 s bis klar |
| Gartentür offen, Krempelraum | −0,250 | 4 s bis klar |

Fundstellen: house.ts:3836–3877.

### Warum wirkt der linke Raum (Krempelraum) langsamer?

Zwei Ursachen, beide im Code nachweisbar:

**a) Rechnerischer Rückstand.** Bei offener Schleusentür tauschen beide Räume
mit `diff * 0,075 * Türöffnung` aus (house.ts:3864). Der linke Raum bekommt nur
das Gefälle, nie eine eigene Quelle. Solange rechts nachproduziert wird, bleibt
der Abstand dauerhaft bei Quelle ÷ 0,075:

- beim aktiven Rauchen **0,29 Dichtepunkte** Rückstand,
- bei glühender Zigarette im Aschenbecher **0,09 Punkte**.

Rechts ist beim Rauchen nach rund **78 s** voll, links steht dann bei etwa
**0,70** und braucht weitere **30 s** für 0,95. Bei einer glühenden Zigarette im
Aschenbecher allein wäre rechts erst nach etwa **270 s** voll. Die Zigarette ist
bis dahin meist erloschen, der linke Raum bleibt also merklich dünner.

**b) Schwächere Zeichnung.** Selbst bei gleicher Dichte wird links dünner
gemalt als rechts:

| | rechts (house.ts:5349) | links (house.ts:5437) |
|---|---|---|
| Schwaden | 11 | 7 |
| Radius | 38 + bis 54 | 34 + bis 40 |
| Deckkraftfaktor | 0,42 + 0,30·Sinus | 0,30 + 0,18·Sinus |
| Obergrenze | 0,92 / 0,70 | 0,80 / 0,55 |

Der Eindruck des Besitzers stimmt also doppelt: Der linke Raum ist später
dicht **und** wird bei gleicher Dichte blasser gezeichnet.

### Wie schnell wird ihr schlecht, wie schnell gesund?

| Vorgang | Wert | Fundstelle |
|---|---|---|
| Übelkeit ab Dichte 0,5 | bis +0,075/s, bei voller Dichte ca. 13 s bis ganz krank | house.ts:3900 |
| Erholung bei offener Gartentür | −0,03/s (ca. 33 s) | house.ts:3902 |
| Erholung sonst | −0,01/s (ca. 100 s) | house.ts:3904 |
| Gesundheitstee | −0,22/s, Handlung dauert 7 s | house.ts:3963 |

---

## 2 · Notierte Aufgaben (Reihenfolge offen, noch nicht umgesetzt)

### N1 · Wettermenü startet geschlossen
- **Soll:** Bei jedem Spielstart ist das Wettermenü zu.
- **Ist:** `private wetterOffen = true;` (house.ts:2553).
- **Umfang:** Startwert auf `false`. Umschalten bleibt wie es ist.

### N2 · Linker Raum füllt sich zu langsam
- **Soll:** Bei offener Schleusentür zieht der Krempelraum sichtbar mit.
- **Ist:** siehe Abschnitt 1, Ursachen a und b.
- **Offene Entscheidung des Besitzers:** Austausch beschleunigen, Angleichung
  der Zeichnung, oder beides. Noch nichts festgelegt.

### N3 · Kein Lächeln bei grünem Gesicht
- **Soll:** Ist Luni krank (grüne Haut), darf sie nicht lächeln.
- **Ist:** Die Haut wird ab `sick > 0.01` grün (luni.ts:1950), der Mund richtet
  sich aber allein nach `expr` und zeichnet bei `happy`/`grin`/`love`/`wink`
  weiter ein Lächeln (luni.ts:1328). Raucherstuhl und Tee sind beide mit
  `expr: "happy"` hinterlegt (house.ts:482, house.ts:423).

### N4 · Zigarette im Aschenbecher muss den Raum füllen
- **Soll:** Auch die abgelegte, glühende Zigarette qualmt den Raum zu.
- **Ist:** teilweise vorhanden. `glowing` erfasst den Stummel (house.ts:3836),
  er erzeugt +0,007/s und eigene Rauchfäden (`drawAshtrayButt`, house.ts:5310).
  Die Rate ist so niedrig, dass es kaum auffällt, und die Zigarette erlischt
  vorher. Beim Umsetzen prüfen: Rate, Erlöschen, sichtbare Fäden.

### N5 · Vor der Schleuse wird ausgedrückt
- **Soll:** Liegt die Zigarette glühend im Aschenbecher und Luni wird aus dem
  Raucherraum geschickt, geht sie **erst** zum Aschenbecher, nimmt die
  Zigarette und drückt sie aus.
- **Ist:** Nur wer **aktiv raucht**, legt vorher ab (house.ts:3094, `putCigarette`).
  Ein glühender Stummel im Aschenbecher wird beim Weggang ignoriert; er glüht
  unbeaufsichtigt weiter. Es gibt keinen Ablauf „nehmen und ausdrücken“,
  `startAsh("take")` nimmt immer zum Weiterrauchen auf (house.ts:4046).

### N6 · Sichtbar abbrennen, Asche wächst
- **Soll:** Die Zigarette im Aschenbecher wird kürzer, die Asche länger, bis
  sie von selbst ausgeht.
- **Ist:** Feste Länge. `drawAshtrayButt` malt immer 11 Einheiten Papier
  (house.ts:5317); `burnLeft` steuert nur die Glutfarbe. Auch `cigarette()`
  (house.ts:1625) nutzt `burn` nur für die Farbe der Spitze, nicht für die Länge.
  Erlöschen ist vorhanden: bei `burnLeft === 0` endet die Glut.

### N7 · Gesundheitstee mit Kanne und Tasse
- **Soll:** Klick auf den Tee → Luni geht hin, nimmt die **Kanne**, schüttet
  Tee in die **Tasse**, trinkt, danach geht es ihr besser.
- **Ist:** Sie geht hin und steht 7 s in der Haltung `act`, die Übelkeit sinkt
  dabei (house.ts:3963). Kanne und Tasse sind nur Möbelzeichnung
  (`teaSet`, house.ts:1036), es gibt keine Handlung damit.

---

## 3 · Merker für die Umsetzung

- Alle Punkte betreffen `src/game/`, keine React-Dateien.
- Rauch-, Glut- und Krankheitswerte liegen bereits im Speicherstand
  (`smoke`, `cigButt`, `burnLeft`, `sick`) und überstehen einen Neustart.
- Nach der Umsetzung: `check.sh` muss `Fehlt: 0` melden, Typprüfung und Build
  fehlerfrei, und nur die beauftragten Dateien im Diff.
---

## 4 · Was jetzt gilt (nach der Umsetzung)

| Punkt | Umsetzung |
|---|---|
| N1 | Wettermenü startet geschlossen (`wetterOffen = false`). |
| N2 | Austausch durch die Schleuse von 0,075 auf **0,16** angehoben, der Krempelraum wird fast gleich kräftig gezeichnet (10 Schwaden statt 7). Gemessen nach 60 s mit glühender Zigarette: rechts 0,41, links 0,37 – vorher lief links deutlich weiter hinterher. |
| N3 | Ab `sick > 0,28` wird jedes Lächeln zu einem flauen Wellenmund, die Augen kneifen nicht mehr fröhlich. |
| N4 | Glut im Aschenbecher erzeugt **+0,013/s** (vorher 0,007) und füllt den Raum in etwa 77 s. |
| N5 | Neuer Ablauf `startAsh("quench")`: Vor Schleuse, Gartentür oder einem anderen Stockwerk geht sie zum Becher, nimmt die Zigarette, drückt sie aus (1,7 s, mit Rauchschwall) und führt danach den Befehl aus. Der kalte Stummel bleibt liegen. |
| N6 | `burnTotal` wird gemerkt; Papier wird kürzer, Asche länger – in der Hand und im Becher. Bei `burnLeft = 0` erlischt die Glut von selbst. |
| N7 | Tee in sechs Schritten über 7,4 s: Kanne heben, einschenken (Tasse füllt sich sichtbar), Kanne zurück, Tasse heben, drei Schlucke, Tasse absetzen. Erst beim Trinken sinkt die Übelkeit (−0,55/s). Armhaltung wechselt dabei sichtbar. Bricht sie ab, stehen Kanne und Tasse sofort wieder auf der Zeile. |

---

## 5 · Korrekturen nach der Rückmeldung

- **Gesundheitstee:** `prop: "cup"` von der Station entfernt; beide Hände werden
  jetzt einzeln geführt. Links nimmt zuerst die Tasse, rechts nimmt die Kanne,
  gießt ein (Tasse füllt sich) und stellt die Kanne zurück; erst danach hebt
  links die Tasse für drei Schlucke (nur hier sinkt die Übelkeit) und setzt ab.
- **Abbrandgeschwindigkeit:** Filter bleibt am Mundende bzw. Aschenbecherrand
  verankert; Papier brennt linear über `burnTotal` (210–300 s) ab, gespeichert
  auch über Weltwechsel.
- **Ausdrücken & Zigarettenhaufen:** Auch eine bereits ausgegangene Zigarette
  auf dem Aschenbecherrand wird beim Verlassen des Raums ausgedrückt; jedes
  Ausdrücken vergrößert den Stummelhaufen im Aschenbecher (`ashButts`).
- **Türen:** Bloßes Öffnen/Schließen von Schleusen- oder Gartentür drückt die
  Zigarette nicht mehr aus – erst das wirkliche Verlassen des Raucherraums.
- **Raum, Tisch, Eimer, Leeren:** Raucherraum-Wand in denselben Grautönen wie
  im Krempelraum; Beistelltisch höher (`F - 30`); Ascheneimer darunter; Klicken
  auf den Eimer lässt Luni den Aschenbecher mit der rechten Hand hineinleeren.
  Sitz-Greifarm (`ashtray`) auf natürliche Ellbogenbeuge umgestellt.
- **Feuerzeug:** Neue Zigarette ist unangezündet; auf dem Stuhl holt Luni mit
  der rechten Hand ein Feuerzeug aus der Hosentasche und zündet sie an.
- **Teetrinken:** Der Griff liegt jetzt an der Henkelseite der Tasse
  (`TASSENGRIFF = [4.1, -2.8]`), die Hand schiebt sich nicht mehr zwischen
  Tasse und Hals. Mit `armeVorne` (luni.ts) werden beim Tee beide Arme vor dem
  Rumpf gezeichnet – der Arm zur Tasse bleibt sichtbar, das Artefakt links am
  Hals ist weg. Pixelprüfung: 22 von 24 Punkten am Arm zeigen die Weste.
- **Adventskalender:** Prototyp eingebaut (siehe `docs/FEATURES.md`,
  `src/game/advent.ts`): Zoom von der Wohnzimmerwand, 24 Türchen, Jahresmischung,
  Speichern, geheime 1–24-Reihenfolge. Alle Türchen sind offen; die
  Datumssperre der Finalfassung liegt fertig hinter `ADVENT_NACH_DATUM`.
