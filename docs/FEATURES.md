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
gruselhaus-raeume | src/game/gruselhaus/index.ts | GRUSELRAEUME
raumstation-moebel | src/game/gruselhaus/raumstation.ts | drawRaumstationMoebel
raumstation-effekte | src/game/gruselhaus/raumstation.ts | RaumstationFx
musikzimmer-datei | src/game/gruselhaus/musikzimmer.ts | export
musikzimmer-raum | src/game/gruselhaus/musikzimmer.ts | drawMusikzimmer
musikzimmer-verbindungstuer | src/game/gruselhaus/musikzimmer.ts | drawMusiktuer

## Musikzimmer im Gruselhaus

musikzimmer-klavier | src/game/gruselhaus/musikzimmer.ts | drawPiano
musikzimmer-geist | src/game/gruselhaus/musikzimmer.ts | drawGhost
musikzimmer-stationen | src/game/gruselhaus/musikzimmer.ts | musikzimmerStationen
musikzimmer-ablauf | src/game/gruselhaus/musikzimmer-ablauf.ts | class MusikzimmerAblauf
musikzimmer-alpha | src/game/gruselhaus/musikzimmer-ablauf.ts | get alpha
musikzimmer-ton | src/game/gruselhaus/musikzimmer-ablauf.ts | class KlavierKlang
musikzimmer-haende | src/game/gruselhaus/musikzimmer-ablauf.ts | klavierHaende
luni-klavier-ausweichen | src/game/house.ts | leaveMusicPiano
luni-klavier-ablehnung | src/game/house.ts | pianoRefusal
tueren-bei-ankunft | src/game/house.ts | doorActed
tueren-sperren-weg | src/game/house.ts | barrierAhead
tueren-per-hand | src/game/house.ts | doorHand
musikzimmer-vorhaenge | src/game/gruselhaus/musikzimmer.ts | drawVorhaenge
musikzimmer-vorhang-griff | src/game/gruselhaus/musikzimmer.ts | vorhangGriff
steine-gui | src/game/house.ts | steinWechsel
musikzimmer-tests | tools/test-musikzimmer.mjs | Aufspringen

## Schlafstätte der Vampirkönigin (Raum 03)

schlafzimmer-datei | src/game/gruselhaus/schlafzimmer.ts | export
schlafzimmer-burgwand | src/game/gruselhaus/schlafzimmer.ts | drawBurgWand
schlafzimmer-sarg | src/game/gruselhaus/schlafzimmer.ts | drawSarg
schlafzimmer-nachttisch | src/game/gruselhaus/schlafzimmer.ts | drawNachttisch
schlafzimmer-schrank | src/game/gruselhaus/schlafzimmer.ts | drawSchrank
schlafzimmer-leuchter | src/game/gruselhaus/schlafzimmer.ts | drawKronleuchter
schlafzimmer-stationen | src/game/gruselhaus/schlafzimmer.ts | schlafzimmerStationen
schlafzimmer-sargdeckel | src/game/gruselhaus/schlafzimmer.ts | drawSargDeckel
schlafzimmer-totenkopf | src/game/gruselhaus/schlafzimmer.ts | drawTotenkopf
schlafzimmer-trittschemel | src/game/gruselhaus/schlafzimmer.ts | drawTrittschemel
schlafzimmer-brillenwurf | src/game/gruselhaus/schlafzimmer.ts | brillenZiel
vampir-outfits | src/game/gruselhaus/vampir.ts | VAMPIR_OUTFITS
vampir-outfitwechsel | src/game/gruselhaus/vampir.ts | naechstesOutfit
vampir-zeichnung | src/game/luni.ts | drawVampirTorso
vampir-umhang | src/game/luni.ts | drawUmhangRuecken
sarg-ablauf | src/game/house.ts | updateSarg
sarg-aufwachen | src/game/house.ts | sargAufwachen
sarg-geraeusche | src/game/audio.ts | holzDumpf
schlaf-zzz | src/game/house.ts | drawSleepZ
schlafzimmer-tests | tools/test-schlafzimmer.mjs | Outfit

## Biohazard-Bad im Gruselhaus (Raum 04)

badezimmer-datei | src/game/gruselhaus/badezimmer.ts | BIO_BAD
badezimmer-kapsel | src/game/gruselhaus/badezimmer.ts | drawBioBadAfter
badezimmer-sichtfenster | src/game/gruselhaus/badezimmer.ts | drawSichtfenster
badezimmer-kamera | src/game/gruselhaus/badezimmer.ts | drawLabMonitor
badezimmer-spind | src/game/gruselhaus/badezimmer.ts | drawLabLockerOpen
badezimmer-wc | src/game/gruselhaus/badezimmer.ts | bio_wc
badezimmer-stationen | src/game/gruselhaus/badezimmer.ts | badezimmerStationen
badezimmer-dekon-ablauf | src/game/house.ts | DEKON_SEQ
badezimmer-einmalblitz | src/game/house.ts | bioFlashed
badezimmer-haarkurve | src/game/luni.ts | drawLabTorso
badezimmer-tests | tools/test-badezimmer.mjs | badezimmerStationen

## Gruselhaus-Küche (Raum 05)

kueche-leer | src/game/house.ts | if (!gr?.kueche)
kueche-fenster | src/game/house.ts | windowRect(c, sky, 624, 364

## Holzlager in der Hexenküche (Raum 05, Zusatz)

kueche-datei | src/game/gruselhaus/kueche.ts | export
kueche-holzlager | src/game/gruselhaus/kueche.ts | drawHolzlager
kueche-stationen | src/game/gruselhaus/kueche.ts | holzlagerStationen
kueche-station | src/game/house.ts | "holzlager"
kueche-holz-tragen | src/game/house.ts | carryHolz
kueche-nachfuellen | src/game/house.ts | HOLZ_REFILL_SEK
kueche-tests | tools/test-kueche.mjs | Holzlager
kuechenwand-bruchstein | src/game/gruselhaus/kueche.ts | drawHexenkuecheRaum
kuechenwand-fenster | src/game/gruselhaus/kueche.ts | drawKuchenFenster
kuechenwand-steintreppe | src/game/gruselhaus/kueche.ts | drawSteintreppe
kuechenwand-licht | src/game/gruselhaus/kueche.ts | kuecheLichtpools
kuechenwand-flammen | src/game/gruselhaus/kueche.ts | drawKuecheFlammen
kuechenwand-verdrahtet | src/game/house.ts | drawHexenkuecheRaum(c)
kuechenwand-truhe | src/game/gruselhaus/kueche.ts | drawTruhe
kuechenwand-kerzen | src/game/gruselhaus/kueche.ts | Genau drei Kerzen
kuechenwand-truhe-aufsatz | src/game/gruselhaus/kueche.ts | Aufgeschlagenes Buch
kuechenwand-truhe-knie | src/game/gruselhaus/kueche.ts | kneeY
kuechenwand-truhe-station | src/game/house.ts | "truhe"
kuechenwand-fenstermaske | src/game/gruselhaus/kueche.ts | drawFensterMaske
kuechenwand-tests | tools/test-kueche.mjs | Küchenfenster
kuechenwand-mauerwerk | src/game/gruselhaus/kueche.ts | mauerSteine
kuechenwand-schleier | src/game/gruselhaus/kueche.ts | drawKuecheSchleier
kueche-abdeckplatte | src/game/gruselhaus/kueche.ts | platteRechts
kueche-endwand | src/game/gruselhaus/kueche.ts | wandBreite

## Wetter und Jahreszeiten

wetter-logik | src/game/wetter.ts | tickWetter
wetter-jahreszeit | src/game/wetter.ts | jahreszeitFuer
wetter-schneedecke | src/game/wetter.ts | snow
wetter-effekte | src/game/wetter.ts | drawWetter
wetterstation-datei | src/game/wetterstation.ts | drawWetterStation
wetterstation-zusatz | src/game/wetterstation.ts | Zusatz
echtwetter | src/game/wetter.ts | echtwetter
wetter-tests | tools/test-wetter.mjs | Wetterstation
hexenofen-datei | src/game/gruselhaus/hexenofen.ts | OFEN
hexenofen-zeichnung | src/game/gruselhaus/hexenofen.ts | drawOfen
hexenkessel-zeichnung | src/game/gruselhaus/hexenofen.ts | drawKessel
hexenofen-tuer | src/game/house.ts | ofenZiel
hexenofen-tests | tools/test-hexenofen.mjs | Hexenkessel

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
