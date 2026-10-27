#!/usr/bin/env python3
"""Baut src/assets/Projekt_Adventshaus_02.pdf aus Text + Screenshots in shots/."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether,
)

INK = HexColor("#1a1a1a")
GRAY = HexColor("#4a4a4a")
LIGHT = HexColor("#8a8a8a")
RULE = HexColor("#b5b5b5")
HEAD_BG = HexColor("#e8e8e8")

OUT = "src/assets/Projekt_Adventshaus_02.pdf"
os.makedirs("src/assets", exist_ok=True)

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
    title="Little Computer Luni – Das Adventshaus (Projektmappe 02)",
    author="LCP-1 Projekt",
)

sTitle = ParagraphStyle("Title2", fontName="Helvetica-Bold", fontSize=26, leading=30, textColor=INK, alignment=TA_CENTER, spaceAfter=6)
sSub = ParagraphStyle("Sub", fontName="Helvetica", fontSize=13, leading=17, textColor=GRAY, alignment=TA_CENTER, spaceAfter=4)
sMeta = ParagraphStyle("Meta", fontName="Helvetica", fontSize=9, leading=12, textColor=LIGHT, alignment=TA_CENTER, spaceAfter=12)
sH1 = ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=INK, spaceBefore=18, spaceAfter=8)
sH2 = ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=GRAY, spaceBefore=12, spaceAfter=6)
sBody = ParagraphStyle("Body", fontName="Helvetica", fontSize=10, leading=14.5, textColor=INK, alignment=TA_JUSTIFY, spaceAfter=6)
sBullet = ParagraphStyle("Bullet", parent=sBody, leftIndent=14, bulletIndent=4, alignment=TA_LEFT)
sPrompt = ParagraphStyle("Prompt", fontName="Helvetica", fontSize=9.2, leading=13, textColor=INK, alignment=TA_JUSTIFY, spaceAfter=5)
sCap = ParagraphStyle("Cap", fontName="Helvetica-Oblique", fontSize=8.5, leading=11, textColor=GRAY, alignment=TA_CENTER, spaceAfter=10)
sCell = ParagraphStyle("Cell", fontName="Helvetica", fontSize=7.6, leading=10, textColor=INK)
sCellH = ParagraphStyle("CellH", fontName="Helvetica-Bold", fontSize=7.6, leading=10, textColor=INK)

story = []
P = story.append


def hr():
    P(HRFlowable(width="100%", thickness=0.6, color=RULE, spaceAfter=8, spaceBefore=4))


def img(path, width_pt, caption):
    P(Image(path, width=width_pt, height=width_pt * 0.625 if "haus" in path else width_pt))
    P(Paragraph(caption, sCap))


# ---------------- Deckblatt ----------------
P(Spacer(1, 4.5 * cm))
P(Paragraph("Little Computer Luni", sTitle))
P(Paragraph("Das Adventshaus", sTitle))
P(Paragraph("Projektmappe 02 – Spielstand, Technik & Rekonstruktion", sSub))
hr()
P(Paragraph("Stand: 26. Oktober 2026 · Cozy-Beobachtungsspiel ohne Punkte und Game Over · Bühne 960 × 600 · Single-File-Build", sMeta))
P(Paragraph("Diese Mappe beschreibt das komplette Projekt: Spielidee, exakte Rekonstruktionsanleitung für eine KI, Screenshots, Luni-Detailaufnahmen, Dateiliste sowie sämtliche Spielregeln und Simulationslogiken.", sBody))

# ---------------- 1. Projektbeschreibung ----------------
P(Paragraph("1 · Detaillierte Projektbeschreibung", sH1))
hr()
P(Paragraph(
    "„Little Computer Luni – Das Adventshaus“ ist ein gemütliches Beobachtungsspiel im Stil von <i>Little Computer "
    "People</i>: Die Figur <b>Luni</b> lebt in einem vierstöckigen Puppenhaus im Querschnitt – Keller, Erdgeschoss, "
    "1. Stock und Dachgeschoss –, das gleichzeitig komplett sichtbar ist. Es gibt bewusst <b>keine Punkte, keinen "
    "Score und kein Game Over</b>: Das Spiel ist zum Zuschauen, Anklicken und Verweilen da.", sBody))
P(Paragraph(
    "Der Spieler steuert Luni nicht direkt, sondern <b>klickt Möbel und Objekte an</b>: Luni geht selbstständig hin "
    "(über Treppen und Etagen hinweg) und führt dort teilanimierte Aktionen aus – auf dem Sofa sitzen und fernsehen, "
    "im Bett schlafen, duschen, Klavier und Saxophon spielen, am Plattenspieler tanzen, in der Küche werkeln, "
    "Zigaretten stopfen und rauchen, am Handy scrollen oder telefonieren. Sitzt sie gemütlich, steht sie bei einem "
    "neuen Befehl erst sichtbar auf, bevor sie losgeht.", sBody))
P(Paragraph(
    "Das Haus lebt im <b>Echtzeit-Takt (Europe/Berlin)</b>: Eine digitale Wanduhr zeigt Datum und Uhrzeit, der Himmel "
    "hinter den Fenstern sowie Sonne, Mond, Sterne und das Lampenlicht folgen der Tageszeit. Der <b>Wohnzimmer-TV</b> "
    "läuft wie ein Röhrenfernseher mit zwei Kanälen – Harvest-Spiel und Musikvideo im Wechsel, mit Umschalt-Statik "
    "und Senderkennung. Im Dachgeschoss zeigt die Konsole eine eigene Retro-Animation.", sBody))
P(Paragraph(
    "Herzstück der Simulation ist die <b>Rauch- und Zigarettenlogik</b>: Zigaretten werden gestopft, in einer "
    "Schachtel (max. 23) gesammelt und brennen je 3,5 bis 5 Minuten ab – auch im Aschenbecher. Rauch füllt das "
    "Rauchzimmer langsam, zieht durch die Schleusentür in den Nebenraum und durch die Gartentür sichtbar nach "
    "draußen ab. Bei viel Rauch hustet Luni, ihr Gesicht wird grün; frische Luft und Gesundheitstee helfen. Dazu "
    "kommen Türen mit Öffnungsanimationen (Garten-, Schleusen-, WC- und Kellertür), ein Krempelraum mit "
    "Weihnachtskiste, Hundeleinen an der Garderobe, Schnee und Garten draußen – und ein <b>Kamin im Wohnzimmer, "
    "dessen Anklicken diese Projektmappe als PDF öffnet</b>.", sBody))
P(Paragraph(
    "Technisch ist alles <b>handgeschrieben und assetfrei</b>: React 19 + Vite + TypeScript + Tailwind bilden nur die "
    "Hülle; Haus, Figur, Himmel, Rauch und sämtliche Geräusche (WebAudio-Synthesen) entstehen prozedural in Canvas "
    "2D. Der Build erzeugt eine einzige HTML-Datei. Über <i>#studio</i> in der URL-Adresse öffnet sich zusätzlich ein "
    "Figuren-Studio mit Bühne, Mimik-Kontaktbögen und Größenproben.", sBody))

# ---------------- 2. Rekonstruktions-Prompt ----------------
P(Paragraph("2 · Rekonstruktions-Prompt für eine KI", sH1))
hr()
P(Paragraph(
    "Die folgenden Abschnitte sind als Bauanleitung formuliert: Eine KI soll daraus das Projekt <b>exakt in diesem "
    "Stand</b> neu aufbauen können. Alle Zahlen, Farben, IDs und Raten sind verbindlich.", sBody))

PROMPT = [
    ("P2.1 · Projektgerüst", [
        "Lege ein Vite-Projekt mit React 19, TypeScript (strict, noUnusedLocals, noUnusedParameters), Tailwind CSS v4 "
        "(über @tailwindcss/vite) und vite-plugin-singlefile an, sodass <i>npm run build</i> genau eine "
        "dist/index.html erzeugt (ca. 350 kB).",
        "Pfad-Alias @ → src/ (vite.config.ts + tsconfig paths). Google Fonts einbinden: Silkscreen (Display) und "
        "Space Grotesk (Body). Viewport: maximum-scale=1.0, user-scalable=no, viewport-fit=cover.",
        "Theme-Farben: ink-950 #050f13, ink-900 #08151a, ink-800 #0d2029, ink-700 #143039, ink-600 #1d4450, mint-50 "
        "#eef7f2, mint-200 #b9d8cd, mint-400 #6fae9f, amber-glow #ffb648, coral #ff6f61, teal #35d6c0, lime #c3e84f, "
        "sky #63b3ff, rose #ff5d8f. Dazu CSS-Klassen .bg-room (dunkle Radial-Gradients), .grid-floor (46-px-Raster mit "
        "radialer Maske), .bezel (Monitor-Gehäuse mit Schatten), .screen-glass, .pixel-corners (abgeschnittene Ecken "
        "per clip-path), .btn-press (Tastendruck-Animation) sowie Keyframes pop-in, slide-up, score-bump, soft-blink, "
        "alarm, wobble, marquee.",
        "App.tsx enthält nur eine Hash-Weiche: URL-Hash #studio → Figuren-Studio, sonst das Spiel (HouseView mit "
        "Monitor-Rahmen im Seitenverhältnis 8:5, Titelzeile LUNIS HAUS, Mute-Button, Taste M).",
    ]),
    ("P2.2 · Bühne und Koordinaten (house.ts)", [
        "Logische Bühne W=960, H=600. Methode resize() skaliert per min(cw/W, ch/H), DPR max. 2 (mobil 1,6). "
        "Innenkanten HL=110, HR=830. Bodenlinien FLOOR_Y=[572, 448, 324, 200] für Keller, EG, 1. Stock, Dachgeschoss; "
        "SLAB=12. Keller beginnt bei CEL_X0=350 (links Erdreich #4b4a48). Dachboden beginnt bei DG_X0=262, 1. Stock "
        "endet bei OG_X1=694. Begehbare Bereiche RANGE=[[362,818],[122,818],[122,694],[264,818]]. Laufgeschwindigkeit "
        "SPEED=80, auf Treppen Faktor 0,85. LUNI_SCALE=1,08. Dachform: atticCeil(x)=130−0,25·Abstand von der Mitte "
        "(470), roofTop(x)=22+0,25·|x−470|.",
        "Hilfsfunktionen: clamp, lerp, hash(n)=frac(sin(n·127,1+311,7)·43758,5453) für deterministische Deko, mix() "
        "zur Hex-Farbmischung, Zeichenprimitiven rect/rrect/disc/poly/line/rrPath. Das gesamte Haus besteht nur aus "
        "diesen Primitiven – keine Bilddateien.",
    ]),
    ("P2.3 · Stationen (32 Stück, exakte Tabelle übernehmen)", [
        "Station = {id, label, floor 0–3, x, face ±1, state, expr, yOff?, prop?, hits:[[x,y,w,h]…], screen?, zzz?, "
        "blanket?}. Klick wählt per pick() die kleinste getroffene Hitbox. EG: Haustür(161), Garderobe(220), "
        "Bücherregal(278), Sofa&TV(372, screen tv_e), Kamin(419, idle/happy), Kellertür(413), Kühlschrank(593), "
        "Kaffeemaschine(674), Gesundheitstee(642), Herd(708), Esstisch(741), Tabak(741), Kellertreppe(523). OG: Bett "
        "(345, lie/sleep, Zzz, Decke), Nachttisch(409), Kleiderschrank(458), Dusche(521), WC-Tür(600), Waschbecken "
        "(578). DG: Gaming(338, screen tv_d), Saxophon(653), Spieleregal(504), Klavier(633), Plattenspieler(724, "
        "danceSway), Gitarre(800). Keller: Schleusentür(618), Krempel-Regale(384), Weihnachtskiste(548), Jacken & "
        "Hundeleinen(640), Stuhl(708, nur Sitzen!), Aschenbecher(726, löst Rauchen aus), Gartentür(818). Exakte "
        "Hit-Rechtecke aus STATIONS übernehmen, u. a. Kamin [[404,378,32,70]], Sofa [[306,402,96,46],[438,392,54,56]], "
        "Aschenbecher [[714,534,21,24]], Gartentür [[824,476,26,100]], WC [[578,236,56,88]], Klavier "
        "[[545,142,76,58],[620,176,28,24]].",
        "Treppen STAIRS: Keller(413→523, warp mit Durchblendung), EG→OG(818→694), OG→DG(136→264); stairPos "
        "interpoliert linear. Beim Kreuzen von x=590 im Keller öffnet die Schleusentür automatisch (bleibt offen, "
        "bis man sie schließt).",
    ]),
    ("P2.4 · Luni-Figur (luni.ts)", [
        "Maßsystem: Ursprung = Boden zwischen den Füßen, y negativ nach oben, Gesamthöhe 56 Einheiten, Maßstab 1,0 = "
        "Spielgröße. Outfit: lange glatte schwarze Haare (#191920, Glanz #3b3b48), offene braun-beige Strickjacke "
        "(#b58b63/#95704a, hell #c9a079, Knopfleiste), weißes T-Shirt (#f6f3ea), schwarze Leggings (#272b34/#343945), "
        "bunte Socken (links #ff6f61/#ffd166, rechts #35d6c0/#c3e84f), schwarze Nerd-Brille (#15151b), Haut #f4c9a0, "
        "Augen #20343c, Mund #a35f4a.",
        "29 Posen (LuniState): idle, walk, run, turn, act, think, cheer, wave, stretch, sit, doze, lie, danceSway, "
        "danceTwist, danceHop, danceSpin, handstand, cartwheel, flip, split, piano, sax, roll, smoke, ashtray, phone, "
        "call, standup, pack. 12 Mimiken (LuniExpr): happy, neutral, grin, wink, think, tired, sleep, surprised, "
        "sad, annoyed, love, focus.",
        "Prinzip: buildRig() berechnet pro Pose/Phase alle Gelenkpositionen; Gliedmaßen sind Striche mit runden "
        "Kappen. drawLuni(ctx,x,y,opts) mit {t, face, state, expr, walk, blink, scale, shadow, phase, armReach, "
        "cough, sick} gibt die Hand-Weltposition zurück (für Gegenstände). smokeCycle(t) = 7-Sekunden-Zyklus "
        "(ruhen → Hand zum Mund → ziehen → zurück → ausatmen). coughPulse(t) für Hustenstöße; sick-Parameter färbt "
        "die Haut per Farbmischung Richtung #8fae6e grün.",
    ]),
    ("P2.5 · Befehls- und Zustandslogik (Kern!)", [
        "Klick → pick() → command(id). Sitzt sie (activity raucherstuhl), steht sie erst sichtbar auf (standing, "
        "0,5 s), dann läuft der Befehl. Laufende Armbewegungen werden nicht abgebrochen, sondern übernommen "
        "(ashNext). Wege baut buildPath über Treppen; Laufen setzt activity=null (kein Rauchen unterwegs).",
        "Die VIER Zigarettenregeln (unbedingt einhalten): (1) Mit Zigarette in der Hand darf sie den Raum "
        "verlassen – kein automatisches Ablegen (der alte General-Guard ist gelöscht). (2) Wer AKTIV RAUCHT "
        "(smoking-Flag) und die Gartentür öffnen will, legt vorher sichtbar im Aschenbecher ab; wer nur trägt, "
        "nimmt sie mit hinaus. (3) Bei der Schleusentür wird NIE abgelegt, auch nicht rauchend. (4) Stehend + "
        "Zigarette + Aschenbecher-Klick = ausdrücken (Armbewegung, Stummel sichtbar, danach hinsetzen).",
        "Stuhl-Klick = nur sitzen (Handy-Idle), Rauchen startet AUSSCHLIESSLICH über Aschenbecher-Klick. "
        " neutrale Ziele löschen smokeRequested, damit sie später nicht von selbst zu rauchen beginnt.",
    ]),
    ("P2.6 · Simulationsraten (pro Sekunde)", [
        "Raumrauch: +0,022 rauchend / +0,007 Stummel, −0,02 passiv, −0,4 bei offener Gartentür; sichtbar ab ~0,3, "
        "Vollnebel ab 0,72. Symmetrischer Austausch Rauchzimmer↔Krempelraum (0,075·Differenz·Öffnung, links überholt "
        "rechts nie). Rauchstoß beim Öffnen voller Tür: smokeGust 2,8 s + ventGust 2,4 s (Schwaden in Nebenraum bzw. "
        "Garten). Zigarette: Brenndauer 210–300 s zufällig, tickt auch im Aschenbecher; kalt = keine Glut/kein Rauch.",
        "Schachtel max. 23 (PACK_MAX), Tischstapel max. 9; Stopfrunde 1,35 s → 1–3 Stück; Einpacken 1,1 s; Mitnehmen "
        "0,9 s. Handy-Idle: nach 0,9 s nehmen (62 % scrollen / 38 % telefonieren, Reaktion alle 2,6–3,4 s), nach 13 s "
        "weglegen; Rauch-Pause nach 20 s Rauchen. WC: 0,45 s Tür auf → 5,5 s drin (unsichtbar) → zu → Ende 7,2 s. "
        "Gartentür linear 1,2 s; Türen per 1−exp(−9·dt). Krankheit: Exposition >0,5 im Keller → sick steigt; "
        "Gartenluft −0,03/s; Gesundheitstee 7 s → −0,22/s; Husten + Grün ab sick>0,3.",
    ]),
    ("P2.7 · Rendering-Pipeline", [
        "Statisch (nur bei dirty neu): Himmel-Cache → drawHouse (Außenanlagen, Dach, Wände, Böden, Trennwände, "
        "Treppen, Fenster mit Himmelsspiegelung, alle Möbel inkl. Kamin-Stein/Sims/Deko). Dynamisch pro Frame: "
        "Kellertür, Schleusentür, TV-Screens, Uhr, Saxophon, Zigarettenstapel/Schachtel, Aschenbecher-Tablett, "
        "Stummel (VOR Luni, wird von ihr verdeckt), Luni (Pose/Mimik/Husten/Hand-Gegenstände), Rauch, Nebenraum- "
        "Rauch, Garten-Abzug, Nacht-Multiply, Kaminfeuer + Feuerschein (Lichtquelle, auch nachts), Hover-Label.",
        "Kamin: Steinumrandung 404–434, Feuerraum, Holzscheite, Holz-Sims mit Kerze und Minibild; Flammen als drei "
        "geschichtete, flackernde Schichten (rot-orange/orange/gelb-weiß) + Glutpunkte + Kerzenflamme + radialer "
        "Schein (lighter-Composite, flackernd).",
        "TV: tv_e-Rechteck [435,392,44,32] mit 60-s-Kanalzyklus (30 s Harvest CH1, 30 s Musikvideo CH2, je 0,6 s "
        "deterministische Umschalt-Statik per hash, OSD CH1/CH2 + ♪). Harvest: 6 Parzellen mit eigenem Wachstum, nur "
        "die Parzelle der Bäuerin ändert sich, 240-s-Jahreszeiten, Münzen. Musikvideo: Sternenhimmel mit Flares, "
        "tanzender Sänger mit Mikro, Laufband-Refrain. tv_d-Rechteck [410,137,54,34] mit Konsolen-Animation. Danach "
        "Scanlines. Konstante RICK_GIF_DATA (Base64-Data-URI): falls befüllt, läuft das echte GIF per drawImage "
        "(Cover-Fit) statt der Mini-Version.",
        "Himmel: Stützstellen-Tabelle über 24 h (top/bot/night), Sonne/Mond auf Sinus­bahn, 110 Sterne, "
        "Berg-Silhouette, 48 Tannen, Schnee. Nacht: Multiply-Layer + additive Lampen-Heatmaps (10 LAMPS).",
    ]),
    ("P2.8 · Audio, UI, Tests, Build", [
        "audio.ts: Sfx-Klasse (WebAudio, ensure/setMuted/tone/noise), Methoden step/jump/land/tick/complete/wish/coin/"
        "sparkle/pet/deny/hurt/alarm/start/over/ui/pause. Schritt = Rauschimpuls + Sinus-Bass, OHNE Echtzeit-Sperre "
        "(Takt kommt vom Aufrufer). Mute in localStorage.",
        "HouseView: Monitor-Rahmen 8:5, Canvas-Mount (new House(cv, {onFireplace})), Mute (Taste M). Kamin-Klick → "
        "Anchor mit href=PDF-Data-URI + download='Projekt_Adventshaus_02.pdf' programmatically clicken. PDF per "
        "Plain-Import aus src/assets einbinden (wird durch Singlefile-Limit als Data-URI inline gelegt); "
        "src/vite-env.d.ts mit vite/client-Referenz für die Typen.",
        "Studio (#studio-Hash): Bühne, Mimik-Kontaktbögen, Laufzyklus-Streifen, Größenprobe, Originalfigur-Vergleich. "
        "engine.ts/HUD/Overlays/Storage-Highscores sind Legacy und werden nicht geladen.",
        "Headless-Verifikation (Pflicht nach jeder Änderung): house.ts per esbuild bündeln, DOM/Canvas stubben "
        "(document.createElement, window-Maße, ResizeObserver, rAF), House instanziieren, per command()+step(1/60) "
        "szenieren und Getter asserten (getSmoke/getSmokeSpill/getSmoking/getHolding/getCigButt/getSick/getPack/"
        "getCellarDoor/getGardenDoor). Pixeltote (Left-never-overtakes-Right, kein Teleport, 31 Stationen "
        "erreichbar) sowie echte Canvas-Pixeltests (TV-Kanäle, Rauchwerte, Aschenbecher-Sichtbarkeit) mit "
        "@napi-rs/canvas (nur temporär installieren). Danach tsc + Build; dist/index.html muss die PDF als "
        "data:application/pdf enthalten.",
    ]),
]
for title, paras in PROMPT:
    P(Paragraph(title, sH2))
    for pa in paras:
        P(Paragraph(pa, sPrompt))

# ---------------- 3. Screenshots Haus ----------------
P(Paragraph("3 · Screenshots vom Haus", sH1))
hr()
P(Paragraph("Das Haus bei Tag: Luni sitzt am Sofa, der Wohnzimmer-TV läuft (Harvest-Kanal CH1).", sBody))
img("shots/haus-tag.png", 440, "Abb. 1 – Gesamtansicht bei Tag (12:00 Uhr).")
P(Paragraph("Das Haus bei Nacht: warme Lampen, dunkler Himmel, Luni liegt im Bett.", sBody))
img("shots/haus-nacht.png", 440, "Abb. 2 – Gesamtansicht bei Nacht (23:30 Uhr).")
P(Paragraph("Der Kamin im Wohnzimmer: Luni steht davor. Ein Klick öffnet diese Mappe als PDF.", sBody))
img("shots/kamin.png", 300, "Abb. 3 – Kamin mit Luni (Ausschnitt).")

# ---------------- 4. Luni ----------------
P(Paragraph("4 · Luni im Detail", sH1))
hr()
P(Paragraph("Luni im Stil der ursprünglichen LCP-1-Figur: schlanke Strichgliedmaßen, kleiner runder Kopf, lange "
            "glatte schwarze Haare, offene braun-beige Strickjacke mit Knopfleiste, weißes T-Shirt, schwarze "
            "Leggings, bunte Socken, schwarze Nerd-Brille.", sBody))
t = Table([
    [Image("shots/luni-ganz.png", width=200, height=233), Image("shots/luni-gesicht.png", width=200, height=167)],
    [Paragraph("Abb. 4 – Ganzkörper, idle/happy.", sCap), Paragraph("Abb. 5 – Gesicht, grin (Nahaufnahme).", sCap)],
], colWidths=[220, 220])
t.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
P(t)
P(Spacer(1, 6))
t2 = Table([
    [Image("shots/luni-rauchen.png", width=200, height=233), Image("shots/luni-klavier.png", width=200, height=233)],
    [Paragraph("Abb. 6 – Rauchpose (Zug zum Mund).", sCap), Paragraph("Abb. 7 – Klavierpose.", sCap)],
], colWidths=[220, 220])
t2.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
P(t2)

# ---------------- 5. Dateiliste ----------------
P(Paragraph("5 · Dateiliste", sH1))
hr()
P(Paragraph("Alle Dateien des Projekts mit Inhalt und Zweck. Pfade relativ zum Projektstamm.", sBody))
FILES = [
    ("src/game/house.ts (~3900 Zl.)", "DAS SPIEL: Konstanten, 32 Stationen, Treppen, House-Klasse (Steuerung, Simulation, komplettes Rendering)."),
    ("src/game/luni.ts (~1280 Zl.)", "Die Figur: drawLuni(), 29 Posen, 12 Mimiken, Rig-System, smokeCycle, Husten, Krankheits-Färbung."),
    ("src/game/audio.ts (172 Zl.)", "Alle Geräusche per WebAudio synthetisiert (Sfx-Klasse). Keine Audiodateien."),
    ("src/game/engine.ts (~3630 Zl.)", "Legacy: altes Arcade-Spiel mit Punkten/Wünschen. Wird nicht geladen, als Referenz behalten."),
    ("src/game/original.ts (277 Zl.)", "Ursprungsfigur als Referenz für das Figuren-Studio."),
    ("src/game/storage.ts (70 Zl.)", "localStorage: Mute-Status, alte Highscores (Legacy)."),
    ("src/assets/Projekt_Adventshaus_02.pdf", "Diese Mappe, eingebettet. Wird per Kamin-Klick geöffnet/heruntergeladen."),
    ("src/App.tsx (19 Zl.)", "Hash-Weiche: #studio → Studio, sonst Spiel."),
    ("src/StudioApp.tsx (~400 Zl.)", "Figuren-Studio (Bühne, Kontaktbögen, Vergleich). Nur über #studio erreichbar."),
    ("src/components/HouseView.tsx (93 Zl.)", "Spielansicht: Monitor-Rahmen, Canvas, Mute, PDF-Download per Kamin-Callback."),
    ("src/components/LuniStage.tsx (173 Zl.)", "Große animierte Studio-Bühne mit Zoom/Raster."),
    ("src/components/LuniSheet.tsx (361 Zl.)", "Mimik-/Posen-Kontaktbögen und Laufzyklus-Streifen."),
    ("src/components/Compare.tsx (227 Zl.)", "Seite-an-Seite-Vergleich Luni/Original."),
    ("src/components/Icons.tsx (154 Zl.)", "SVG-Iconsatz (u. a. Mute-Icon)."),
    ("src/components/Hud.tsx / Overlays.tsx / TouchControls.tsx", "Legacy-Arcade-UI, im Haus nicht geladen."),
    ("src/main.tsx (10 Zl.)", "React-Einstieg (StrictMode)."),
    ("src/index.css", "Tailwind-Theme, Fonts, Bezel-/CRT-Klassen, Animationen."),
    ("src/vite-env.d.ts", "Vite-Client-Typen (u. a. PDF-Importe)."),
    ("src/utils/cn.ts", "Klassen-Helfer (clsx + tailwind-merge)."),
    ("index.html", "Titel, Fonts (Silkscreen/Space Grotesk), Viewport, #root."),
    ("package.json / vite.config.ts / tsconfig.json", "React 19 + Vite 7 + TS strict + Singlefile-Build, @-Alias."),
    ("shots/ (7 PNG + render.mjs)", "Quellbilder dieser Mappe, headless gerendert; nicht im Build enthalten."),
    ("build_mappe.py", "Erzeugerskript dieser PDF-Datei."),
    ("pdf_output/ (alt)", "Frühere Planungsmappe (Markdown/HTML), historisch."),
    ("projekt-adventshaus.zip", "Alle Quellen + Doku als Archiv (falls im Stamm vorhanden)."),
]
rows = [[Paragraph("<b>Datei</b>", sCellH), Paragraph("<b>Inhalt und Zweck</b>", sCellH)]]
for f, d in FILES:
    rows.append([Paragraph(f, sCell), Paragraph(d, sCell)])
ft = Table(rows, colWidths=[200, 255])
ft.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), HEAD_BG),
    ("GRID", (0, 0), (-1, -1), 0.5, RULE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
]))
P(ft)

# ---------------- 6. Regeln ----------------
P(Paragraph("6 · Alle Regeln und Logiken", sH1))
hr()
RULES = [
    ("Zigaretten (4 Kernregeln)", [
        "1. Mit Zigarette in der Hand darf sie den Raum verlassen – kein automatisches Ablegen.",
        "2. Wer aktiv raucht und die Gartentür öffnen will, legt vorher sichtbar im Aschenbecher ab; wer nur trägt, nimmt sie mit hinaus.",
        "3. Bei der Schleusentür wird NIE abgelegt, auch nicht rauchend.",
        "4. Stehend + Zigarette + Aschenbecher-Klick = ausdrücken (Armbewegung, Stummel sichtbar, danach hinsetzen).",
    ]),
    ("Rauchen & Schachtel", [
        "Rauchen startet ausschließlich über Aschenbecher-Klick. Stuhl-Klick = nur sitzen (Handy-Idle).",
        "Brenndauer 210–300 s zufällig, tickt auch im Aschenbecher; kalter Stummel glimmt nicht und qualmt nicht.",
        "Abgebrannt in der Hand → automatisches Ausdrücken im Aschenbecher. Schachtel max. 23, Tischstapel max. 9; "
        "Stopfrunde 1,35 s (1–3 Stück), Einpacken 1,1 s, Mitnehmen 0,9 s. Volle Schachtel stoppt das Einpacken.",
        "Beim Hinsetzen mit Zigarette aus dem Becher wird sie wieder aufgenommen (keine neue aus der Schachtel).",
    ]),
    ("Rauch & Krankheit", [
        "Raumrauch +0,022/s rauchend, +0,007/s Stummel, −0,02/s passiv, −0,4/s bei offener Gartentür; sichtbar ab "
        "~0,3, Vollnebel ab 0,72. Symmetrischer Austausch mit dem Krempelraum (links überholt rechts nie).",
        "Rauchstoß (2,8 s) beim Öffnen voller Tür in den Nebenraum; Abzug (2,4 s) durch die Gartentür in den Garten, "
        "jeweils mit sichtbaren Schwaden.",
        "Exposition >0,5 im Keller macht krank (Husten-Animation, grünes Gesicht ab sick>0,3); Gartenluft −0,03/s, "
        "Gesundheitstee (7 s) −0,22/s.",
    ]),
    ("Türen", [
        "Gartentür jederzeit bedienbar (1,2 s Drehung), auch mitten in Aktionen; Rauchende legen vorher ab.",
        "Schleusentür jederzeit bedienbar, immer von der eigenen Seite (Türstand links/rechts der Wand x=590); "
        "öffnet beim Durchqueren automatisch, schließt nur per Klick. WC: 0,45 s auf, 5,5 s drin (unsichtbar), 7,2 s "
        "Ende. Kellertreppe mit Warp-Durchblendung.",
    ]),
    ("Handy & Idle", [
        "Sitzen ohne Rauchauftrag → nach 0,9 s Handy aus der Tasche (62 % scrollen / 38 % telefonieren), Reaktionen "
        "alle 2,6–3,4 s (lachen/kopfschütteln/schauen), nach 13 s zurück auf den Tisch. Beim Rauchen: Pause nach 20 s "
        "mit Ablegen, danach Weiterrauchen. Aufstehen immer animiert (0,5 s), Klick auf denselben Stuhl ändert nichts.",
    ]),
    ("TV & Kamin", [
        "Wohnzimmer-TV: 60-s-Zyklus (30 s Harvest CH1, 30 s Musikvideo CH2, je 0,6 s Statik, OSD CH1/CH2 + ♪). "
        "Harvest: 6 Parzellen mit eigenem Wachstum, nur die Parzelle der Bäuerin ändert sich, 240-s-Jahreszeiten. "
        "Dach-TV: Konsolen-Animation. Kamin: Klick öffnet diese PDF (Download), Luni geht hin (idle/happy).",
    ]),
    ("Uhr, Himmel, Sonstiges", [
        "Echtzeit Europe/Berlin, digitale Wanduhr, Himmel/Sonne/Mond/Sterne und Lampenlicht folgen der Tageszeit. "
        "Bewegung 80 px/s (Treppen 0,85×), Klick wählt kleinste Hitbox, Hover-Label zeigt Objektnamen. M = stumm.",
    ]),
]
for title, items in RULES:
    P(Paragraph(title, sH2))
    for it in items:
        P(Paragraph(it, sBullet, bulletText="•"))

P(PageBreak())
P(Paragraph("Ende der Projektmappe 02.", sMeta))

doc.build(story)
print("OK:", OUT, os.path.getsize(OUT), "Bytes")
