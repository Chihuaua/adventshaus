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
studio-ansicht | src/StudioApp.tsx | export

---

## Noch offen (dürfen fehlen, werden gemeldet)

overflow-x | src/components/HouseView.tsx | overflow-x-hidden
ki-start | docs/KI-START.md | Die einzige Pflicht-Lektüre

## Adventskalender (Zielbild aus dem Spielkonzept)

adventskalender-datei | src/game/advent.ts | adventFrei
adventskalender-zoom | src/game/house.ts | drawAdventskalender
adventskalender-station | src/game/house.ts | "adventskalender"
adventskalender-tastatur | src/game/house.ts | adventOeffne
adventskalender-tests | tools/test-adventskalender.mjs | Türchen
adventskalender-deko | src/game/deko.ts | drawDeko
adventskalender-schliessen | src/game/house.ts | adventWarteT = 0
adventskalender-weltraum | src/game/advent-weltraum.ts | adventWeltraum
adventskalender-lampen | src/game/advent-weltraum.ts | adventLampen
adventskalender-sonntage | src/game/advent-weltraum.ts | adventsSonntage
adventskalender-rahmenzier | src/game/advent-weltraum.ts | adventBrettZier
adventskalender-schmuck | src/game/advent-schmuck.ts | adventSchmuck
adventskalender-schmuckliste | src/game/advent-schmuck.ts | ADVENT_SCHMUCK
adventskalender-ecken | src/game/advent-schmuck.ts | adventSchmuckGlanz
adventskalender-tuerchenbilder | src/game/advent-spielbilder.ts | adventBildSpiel
adventskalender-gruss | src/game/advent.ts | adventGruss
treppengelaender-kurz | src/game/house.ts | GELAENDER_HOEHE
bruestung-kurz | src/game/house.ts | BRUESTUNG_HOEHE
fenster-reif | src/game/reif.ts | fensterReif
rundfenster-reif | src/game/reif.ts | rundReif
treppenfenster-vorgelaender | src/game/house.ts | Geländer
hausdetails-tests | tools/test-hausdetails.mjs | Streben
haus-ohne-deko | src/game/house.ts | weihnachtsdeko
traumhaus-haus | src/App.tsx | welt="traum"
luni-handflaechen | src/game/luni.ts | Handflächen nach außen
luni-schulter | src/game/luni.ts | const SCHULTER_ANSATZ = 4.4
patch-download | src/game/house.ts | this.onUfo?.(PATCH_ZIP)
zimmertapeten | src/game/house.ts | ZimmerTapete
fensterkranz | src/game/fensterkranz.ts | fensterKranz
rundfensterkranz | src/game/fensterkranz.ts | rundFensterKranz
adventwand-geschmueckt | src/game/advent-wand.ts | adventWandWeihnacht
weihnachtshaus-farbkonzept | src/game/weihnachtshaus.ts | WEIHNACHTS_FARBEN
weihnachtshaus-warmes-licht | src/game/house.ts | zeichneWeihnachtsAbendlicht
weihnachtshaus-weihnachtsbaum | src/game/weihnachtshaus.ts | wohnzimmerWeihnachtsbaum
weihnachtshaus-samtvorhaenge | src/game/weihnachtshaus.ts | goldstangeMitSamt
weihnachtshaus-steppdecke | src/game/weihnachtshaus.ts | winterSteppdecke
fenster-lichtbogen | src/game/house.ts | drawFensterBogen
lavalampe-modul | src/game/lavalampe.ts | drawLavaLampe
lavalampe-station | src/game/house.ts | id: "lavalampe"
lavalampe-tests | tools/test-lavalampe.mjs | Lavalampe-Tests bestanden
frosch-denkblase | src/game/froschblase.ts | drawFroschDenkblase
frosch-denkblase-gesang | src/game/house.ts | drawFroschDenkblase

## Hunde Odin & Apollo

hunde-datei | src/game/hunde.ts | class HundeWelt
hund-odin | src/game/hunde.ts | drawOdin
hund-apollo | src/game/hunde.ts | drawApollo
hund-stationen | src/game/house.ts | "apollo"
hund-streicheln | src/game/luni.ts | case "pet"
hunde-tests | tools/test-hunde.mjs | Odin und Apollo

## Teleflauschi „Flauschi“ (Weihnachtshaus)

flauschi-datei | src/game/flauschi.ts | drawFlauschi
flauschi-einlegen | src/game/house.ts | flauschi_modul
flauschi-aktionen | src/game/house.ts | flauschiAktionAusloesen
flauschi-balken | src/game/flauschi.ts | drawFlauschiHud
flauschi-geschenke | src/game/flauschi.ts | FLAUSCHI_GESCHENKE
flauschi-kanaele | src/game/tv.ts | flauschi
flauschi-tests | tools/test-flauschi.mjs | Flauschi
flauschi-anfassen | src/game/flauschi.ts | flauschiBeruehren
flauschi-zonen | src/game/house.ts | flauschiZoneBei
flauschi-dinge | src/game/flauschi-dinge.ts | FLAUSCHI_DINGE
flauschi-figur | src/game/flauschi-figur.ts | drawFlauschi
flauschi-zimmer | src/game/flauschi-zimmer.ts | drawFlauschiSzene
flauschi-halten | src/game/house.ts | flauschiKraulenHalten
flauschi-wachstum | src/game/flauschi.ts | phasePruefen
flauschi-pakete | src/game/flauschi.ts | flauschiAuspacken
flauschi-album | src/game/flauschi.ts | drawFlauschiAlbum
flauschi-grund | src/game/flauschi-dinge.ts | Futternapf
nikolaus-figur | src/game/nikolaus-figur.ts | zeichneNikolaus
nikolaus-waldweg | src/game/nikolaus-besuch.ts | nikolausWaldweg
nikolaus-kalender | src/game/house.ts | nikolaus.kalender
nikolaus-rufstein | src/game/steine.ts | NIKOLAUS_STEIN
nikolaus-empfang | src/game/house.ts | NIKOLAUS_EMPFANG
nikolaus-studio | src/components/NikolausStudio.tsx | Figurenblatt
nikolaus-tests | tools/test-nikolaus.mjs | Berliner Mitternacht
ruprecht-figur | src/game/ruprecht-figur.ts | zeichneRuprecht
ruprecht-begleitung | src/game/house.ts | ruprechtBegleitung
ruprecht-studio | src/App.tsx | studio-ruprecht
ruprecht-tests | tools/test-ruprecht.mjs | HALBER_SCHRITT
