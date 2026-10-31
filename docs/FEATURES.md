# FUNKTIONEN · Inventar

**Zweck:** Jede Zeile ist eine Funktion, die existieren muss. Das Skript
`tools/check.sh` liest diese Datei und meldet alles, was fehlt.

**Format:** `name | datei | marker`

Der `marker` ist eine Zeichenkette, die genau dann im Code stehen muss, wenn
die Funktion existiert. `grep` prüft das.

**Wenn eine Funktion wirklich entfernt werden soll:** Zeile hier löschen **und**
im Commit sagen, warum. Sonst meldet das Skript einen Fehler.

---

## Kern

haus-grundriss | src/game/house.ts | drawHouse
figur-luni | src/game/house.ts | drawLuni
figur-posen | src/game/luni.ts | LuniState
figur-mimik | src/game/luni.ts | LuniExpr
husten | src/game/luni.ts | coughPulse
rauchzyklus | src/game/house.ts | smokeCycle
resize-fix | src/game/house.ts | Zwischenflächen
hover-label | src/game/house.ts | drawHoverLabel
echtzeit-uhr | src/game/house.ts | berlinNow

## Stationen

station-bett | src/game/house.ts | "bett"
station-raucherstuhl | src/game/house.ts | raucherstuhl
station-aschenbecher | src/game/house.ts | aschenbecher
station-kellertuer | src/game/house.ts | kellertuer
station-gartentuer | src/game/house.ts | aussentuer
station-kleiderschrank | src/game/house.ts | kleiderschrank
station-garderobe | src/game/house.ts | garderobe
station-dusche | src/game/house.ts | dusche
station-klavier | src/game/house.ts | klavier
station-saxophon | src/game/house.ts | saxophon
station-tabak | src/game/house.ts | tabak

## Routinen

bett-routine | src/game/house.ts | startBedRoutine
bett-routine-update | src/game/house.ts | updateBedRoutine
dusche-routine | src/game/house.ts | startSh

## Neue Systeme (seit PR #6)

traumhaus-datei | src/game/traumhaus.ts | export
traum-datei | src/game/dream.ts | export
dusche-datei | src/game/shower.ts | export
gol-datei | src/game/gol.ts | export
pixel-datei | src/game/pixel.ts | export
steine-datei | src/game/steine.ts | export
traumhaus-ansicht | src/components/TraumhausView.tsx | export

## Hauswelten und Wechselsteine

welten-datei | src/game/welten.ts | export
welten-speicher | src/game/welten.ts | speichereSnapshot
welten-wechsel | src/game/welten.ts | wechsleWelt
wechselsteine | src/game/steine.ts | steinSlots
horrorstein | src/game/steine.ts | horror
gruselhaus-route | src/App.tsx | #gruselhaus

## Ton und Speicher

audio-synth | src/game/audio.ts | class Sfx
speicher-mute | src/game/storage.ts | loadMuted

## Oberfläche

haus-ansicht | src/components/HouseView.tsx | HouseView
uebergabe-datei | src/components/Uebergabe.tsx | EROEFFNUNGSTEXT
studio-ansicht | src/StudioApp.tsx | export

---

## Noch offen (dürfen fehlen, werden gemeldet)

uebergabe-eingebaut | src/components/HouseView.tsx | import Uebergabe
overflow-x | src/components/HouseView.tsx | overflow-x-hidden
