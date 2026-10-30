/* =======================================================================
   TRAUM „DER TOD SPIELT KLAVIER“

   Eine zentrale, deterministische Traumzeit treibt alles: Blase, Szene,
   Figuren, Text und Klavierzustand. Lunis Schlafzimmer und ihr Atem laufen
   unabhängig davon im Haus weiter.
   ======================================================================= */

type C = CanvasRenderingContext2D;

import { sfx } from "./audio";
import { drawPixelText, drawPixelTextCenter, pixelLines } from "./pixel";

export const W = 960;
export const H = 600;

/** Getrennte, niemals überlappende Bereiche innerhalb der Bühne. */
const IMAGE = { x: 24, y: 16, w: 912, h: 360 } as const;
const TEXT = { x: 96, y: 390, w: 768, h: 140 } as const;
const CONTROLS = { x: 96, y: 546, w: 768, h: 42 } as const;

type Scene = "ceiling" | "room" | "hall" | "music" | "white";
type Who = "gedanke" | "jonas" | "tod" | "stimme";
type Chapter = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
type Pose =
  | "lie"
  | "sit"
  | "stand"
  | "walk"
  | "reach"
  | "listen"
  | "kneel"
  | "watch"
  | "back";
type Look = "door" | "ceiling" | "bigdoor" | "woman" | "watch" | "blue" | "green" | "piano" | "backdoor";
type Shot =
  | "ceilingPov"
  | "roomWide"
  | "jonasHalf"
  | "knobClose"
  | "hallWide"
  | "hallTrack"
  | "listenProfile"
  | "musicWide"
  | "pianoHands"
  | "deathFace"
  | "twoShot"
  | "watchClose"
  | "kneelLow"
  | "doorChoice"
  | "greenDoor"
  | "whiteEnd";
type DeathPlace = "absent" | "piano" | "near";
type DoorState = "closed" | "ajar" | "roomOpen" | "greenOpening" | "greenOpen";
type Thought = "weekend" | "waiting" | "phone" | "embrace" | "fading" | "stars" | "earth" | "pianoSelf";

interface ActorPlacement {
  x: number;
  y: number;
  scale: number;
  view: "front" | "profile" | "back" | "threeQuarter";
}

interface Beat {
  /** stabile ID, auch wenn Text an Lesestellen aufgeteilt wird */
  id: string;
  chapter: Chapter;
  kind: "text" | "act";
  dur: number;
  scene: Scene;
  shot: Shot;
  pose: Pose;
  look: Look;
  death: DeathPlace;
  door: DoorState;
  jonas: ActorPlacement;
  deathActor: ActorPlacement | null;
  thought?: Thought;
  who?: Who;
  text?: string;
  /** Klavier an dieser Stelle: 1 = hörbar, 0.55 = gedämpft, 0 = aus */
  piano?: number;
  /** Zusätzliche Haltepause nach dem Text */
  hold?: number;
  /** sichtbare Aktion */
  fx?: "knock1" | "knock2" | "teleport" | "teeth" | "turn" | "kneel" | "openGreen" | "watch";
}

const words = (t: string) => t.trim().split(/\s+/).length;
const readTime = (t: string) => Math.max(4, words(t) / 3 + 1);

/* ------------------------------ Story ---------------------------------- */

const B: Beat[] = [];
let beatNo = 0;
let activeChapter: Chapter = 1;
let activeDeath: DeathPlace = "absent";
let activeDoor: DoorState = "closed";

const setChapter = (chapter: Chapter) => {
  activeChapter = chapter;
};
const setDeath = (place: DeathPlace) => {
  activeDeath = place;
};
const setDoor = (state: DoorState) => {
  activeDoor = state;
};

function defaultShot(scene: Scene, pose: Pose, look: Look, fx?: Beat["fx"]): Shot {
  if (scene === "ceiling") return "ceilingPov";
  if (scene === "white") return "whiteEnd";
  if (scene === "room" && pose === "reach") return "knobClose";
  if (scene === "room" && (pose === "lie" || pose === "sit")) return "roomWide";
  if (scene === "hall" && pose === "listen") return "listenProfile";
  if (scene === "hall" && pose === "walk") return "hallTrack";
  if (scene === "hall") return "hallWide";
  if (scene === "music" && (look === "watch" || fx === "watch")) return "watchClose";
  if (scene === "music" && fx === "teeth") return "deathFace";
  if (scene === "music" && pose === "kneel") return "kneelLow";
  if (scene === "music" && pose === "back") return "pianoHands";
  if (scene === "music" && (look === "blue" || look === "green")) return "doorChoice";
  if (scene === "music" && pose === "walk") return "greenDoor";
  if (scene === "music" && look === "woman") return "twoShot";
  return "musicWide";
}

function defaultJonas(scene: Scene, pose: Pose, look: Look): ActorPlacement {
  if (scene === "hall") return { x: pose === "walk" ? 180 : 250, y: 306, scale: pose === "walk" ? 0.92 : 0.88, view: pose === "listen" ? "profile" : "threeQuarter" };
  if (scene === "music") return { x: 390, y: 304, scale: pose === "kneel" ? 1.08 : 1, view: look === "backdoor" ? "back" : "threeQuarter" };
  return { x: 420, y: 310, scale: 1.02, view: pose === "lie" ? "profile" : "threeQuarter" };
}

function defaultDeath(place: DeathPlace): ActorPlacement | null {
  if (place === "absent") return null;
  return place === "piano"
    ? { x: 694, y: 304, scale: 1, view: "back" }
    : { x: 545, y: 322, scale: 1, view: "front" };
}
const add = (
  scene: Scene,
  pose: Pose,
  look: Look,
  text: string,
  who: Who = "gedanke",
  extra: Partial<Beat> = {},
) =>
  B.push({
    id: `beat-${String(beatNo++).padStart(3, "0")}`,
    chapter: activeChapter,
    kind: "text",
    scene,
    shot: extra.shot ?? defaultShot(scene, pose, look, extra.fx),
    pose,
    look,
    death: extra.death ?? activeDeath,
    door: extra.door ?? activeDoor,
    jonas: extra.jonas ?? defaultJonas(scene, pose, look),
    deathActor: extra.deathActor ?? defaultDeath(extra.death ?? activeDeath),
    text,
    who,
    dur: readTime(text) + (extra.hold ?? 0),
    ...extra,
  });
const act = (scene: Scene, pose: Pose, look: Look, dur: number, fx?: Beat["fx"], extra: Partial<Beat> = {}) =>
  B.push({
    id: `beat-${String(beatNo++).padStart(3, "0")}`,
    chapter: activeChapter,
    kind: "act",
    scene,
    shot: extra.shot ?? defaultShot(scene, pose, look, fx),
    pose,
    look,
    death: extra.death ?? activeDeath,
    door: extra.door ?? activeDoor,
    jonas: extra.jonas ?? defaultJonas(scene, pose, look),
    deathActor: extra.deathActor ?? defaultDeath(extra.death ?? activeDeath),
    dur,
    fx,
    ...extra,
  });

/* Kapitel 1 – Das Erwachen */
setChapter(1);
add("ceiling", "lie", "ceiling",
  "Ich wachte auf und spürte, dass ich bei Bewusstsein war. Jedoch konnte ich nichts sehen, um mich herum war alles schwarz.", "gedanke");
add("ceiling", "lie", "ceiling",
  "Ein Schwarz, das man wahrnehmen kann, wenn die Augen geschlossen sind. Mich überkam das Bedürfnis, einen tiefen Atemzug zu nehmen, als würde dieser über Leben oder Tod entscheiden.", "gedanke");
act("ceiling", "lie", "ceiling", 2.2);
add("ceiling", "lie", "ceiling",
  "Ich musste atmen, meine Zellen mit Sauerstoff anreichern – wach werden. Ich bemühte mich, meine Lungen mit Luft zu füllen und konnte spüren, wie ich zu Bewusstsein kam.", "gedanke");

/* Kapitel 2 – Der unbekannte Raum */
setChapter(2);
add("room", "lie", "ceiling",
  "Meine Augen öffneten sich und starrten an eine Decke. Eine weiße, karge Decke eines Raumes.", "gedanke");
add("room", "lie", "door",
  "Ich drehte meinen Kopf und sah mich um. Nicht viel Mobiliar stand in diesem Raum, nur eine kleine Theke, so wie sie oft vor Hotels stehen, wenn sie von den Conciergen genutzt werden. Aber niemand stand dahinter.", "gedanke");
add("room", "sit", "door",
  "Die Wände waren mit dunklem Ebenholz vertäfelt und der Boden, auf dem ich lag, war ein alter, abgenutzter Dielenboden.", "gedanke");
add("room", "sit", "door",
  "Ich blieb noch einige Sekunden liegen und fragte mich, wo ich mich befand und wie ich überhaupt hierhergekommen war.", "gedanke");
add("room", "sit", "door",
  "Meine Erinnerungen hatte ich allesamt noch, doch an was ich mich nicht erinnern konnte, war, wie ich in diesen Raum gekommen war.", "gedanke");

/* Kapitel 3 – Körperprüfung */
setChapter(3);
add("room", "stand", "door",
  "Ich rappelte mich langsam auf und begutachtete meinen Körper.", "gedanke");
add("room", "stand", "door",
  "Nicht selten kam es vor, dass ich an einem Wochenende zu viel getrunken hatte und mich am nächsten Morgen bei Freunden wiederfand. Mit einem Kater und blauen Flecken von Stürzen oder Auseinandersetzungen, die ich in meinem Rausch hatte.", "gedanke", { thought: "weekend" });
add("room", "stand", "door",
  "Allerdings fühlte ich mich nicht verkatert, ich fühlte mich nicht mal schlecht. Ich wusste nicht einmal, welche Tageszeit es war.", "gedanke");
add("room", "stand", "watch",
  "Der Raum hatte kein Fenster und es drang nirgends eine Lichtquelle durch, von der ich hätte auf die Uhrzeit schließen können. Lediglich eine Tür befand sich darin.", "gedanke");
act("room", "walk", "door", 2.4);
add("room", "reach", "door",
  "Ich trat zur Tür, legte meine Hand auf den kalten Türknauf und drehte ihn langsam eine halbe Drehung nach links. Behutsam öffnete ich die Tür und sah hinaus.", "gedanke", { door: "roomOpen" });

/* Kapitel 4 – Der Flur */
setChapter(4);
setDoor("roomOpen");
add("hall", "stand", "door",
  "Es offenbarte sich mir ein langer Flur. Dunkelroter Teppich bekleidete den Fußboden und ebenso wie in dem Raum, in dem ich aufgewacht war, zog sich eine Wandvertäfelung den gesamten Flur entlang.", "gedanke");
add("hall", "stand", "bigdoor",
  "Ich trat hinaus und sah viele weitere Türen wie meine. Alle waren sie geschlossen und neben jeder dieser Türen hing eine Fischglaslampe, aus der gelbes, gedimmtes Licht schien.", "gedanke");
add("hall", "stand", "bigdoor",
  "Am Ende des Flures befand sich eine große Tür, die doppelt so groß und heller beleuchtet war als alle anderen. Als würde sie mir zurufen: „Hier musst du hinein.“", "gedanke");
act("hall", "walk", "bigdoor", 4.5);
add("hall", "walk", "bigdoor",
  "Meine Schritte waren lautlos, als ich den Flur entlangging und ich horchte, ob ich irgendetwas Akustisches wahrnehmen konnte – doch es herrschte friedliche und bedrückende Stille zugleich.", "gedanke");

/* Kapitel 5 – Hinter der großen Tür */
setChapter(5);
act("hall", "listen", "bigdoor", 2.2, undefined, { piano: 0.55 });
add("hall", "listen", "bigdoor",
  "An der großen Tür angekommen, lauschte ich nochmals und es schien mir, als könne ich ein Klavier hören. Ich legte mein Ohr an die Tür und hörte wie jemand Klavier spielte.", "gedanke");
add("hall", "listen", "bigdoor",
  "Die Melodie war keine mir bekannte Melodie – ich glaube, es war nicht mal eine Melodie. Es hörte sich stimmig an und dennoch an manchen Stellen chaotisch. Als würde jemand ein Musikstück an manchen Stellen absichtlich falsch spielen.", "gedanke");
act("hall", "listen", "bigdoor", 1.2, "knock1");
add("hall", "reach", "bigdoor",
  "Ich klopfte an. Die Tür war so massiv, dass ich nochmal klopfte, weil es sich so dumpf anhörte, dass ich dachte, nicht gehört zu werden.", "gedanke", { fx: "knock2", piano: 0 });
act("hall", "listen", "bigdoor", 3);
add("hall", "listen", "bigdoor",
  "Das Klavierspiel stoppte, niemand sagte etwas wie „Herein“ oder „Ja, bitte“. Ich hielt einige Sekunden inne und das Klavier begann wieder zu spielen.", "gedanke", { piano: 0.55 });
act("hall", "reach", "bigdoor", 2);
setDeath("piano");
add("music", "stand", "woman",
  "Ich öffnete die Tür mit einem flauen Gefühl im Magen und sah durch den Spalt eine Frau davor sitzen. Sie war mir mit dem Rücken zugewandt und spielte weiter, ohne mich zu beachten.", "gedanke", { piano: 1 });

/* Kapitel 6 – Der Musikraum */
setChapter(6);
act("music", "stand", "backdoor", 1.6, undefined, { piano: 0 });
add("music", "stand", "woman",
  "Langsam trat ich ein und schloss die Tür hinter mir – die Frau hörte auf zu spielen.", "gedanke");
add("music", "stand", "woman",
  "Ich sagte: „Entschuldigung?“, aber sie blieb in der gleichen Position sitzen und drehte sich nicht zu mir um.", "jonas");
add("music", "back", "woman",
  "Ich sah ihr schwarzes, langes Haar am Hinterkopf, welches ihren gesamten Rücken bedeckte. Sie trug ein rosafarbenes Kleid, das wohl einst mal rot war.", "gedanke");
add("music", "back", "woman",
  "Im ganzen Raum roch es vermodert und ihrem Kleid nach zu urteilen, kam ein Teil des Geruchs davon. Es hatte Löcher und es fehlten hier und da kleine Stofffetzen.", "gedanke");
add("music", "stand", "woman",
  "Die Atmosphäre des Raumes war unheimlich. Die gleichen, gelbfarbenen Fischglaslampen hingen an den Wänden und es war kein einziges Fenster darin zu sehen.", "gedanke");
add("music", "stand", "woman",
  "Dennoch hingen Vorhänge an der Wand, die lediglich die Holzvertäfelung schmückten. Außer dem Klavier befanden sich noch zwei weitere Türen darin – eine rechts und eine links.", "gedanke");
add("music", "stand", "blue",
  "Die linke Tür hatte eine blaue Farbe und in entgegengesetzter Richtung befand sich eine grüne Tür. Beide waren verschlossen.", "gedanke");

/* Kapitel 7 – Die Frau */
setChapter(7);
add("music", "stand", "woman",
  "Leicht nervös sprach ich die Frau erneut an: „Hallo, guten Abend … oder … Tag. Ich … bin mir nicht sicher, wie viel Uhr es gerade ist.“", "jonas");
act("music", "stand", "woman", 2.4, "turn");
add("music", "stand", "woman",
  "Sie drehte sich langsam zu mir um, immer noch auf dem Hocker vor dem Klavier sitzend, und ich blickte in pechschwarze Augen. Ihre Augen hatten keinen weißen Augapfel, nur ein einziges, tiefes Schwarz.", "gedanke");
setDeath("near");
add("music", "stand", "woman",
  "Erschrocken trat ich einen Schritt zur Seite von ihr weg und mein Fluchtinstinkt wurde ausgelöst, als sie plötzlich vor mir stand.", "gedanke", { fx: "teleport" });
add("music", "stand", "woman",
  "Gerade eben saß sie noch und in der nächsten Sekunde stand sie unmittelbar vor mir, als wäre sie teleportiert.", "gedanke");
add("music", "stand", "woman",
  "Ihre Augen blieben regungslos, doch ihr Mund öffnete sich zu einem unheimlichen Lächeln. Ich bekam Angst, als ich ihre Zähne sah.", "gedanke", { fx: "teeth" });
add("music", "stand", "woman",
  "Sie hatte spitze Zähne und viel mehr davon als ich oder jeder andere Mensch. Mehrere Zahnreihen zeigten sich hintereinander, als sie den Kiefer öffnete.", "gedanke");
add("music", "stand", "woman",
  "Mit einem Atemhauch von ihr erstarrte ich an Ort und Stelle und eine Stimme in meinem Kopf erklang:", "gedanke");
add("music", "stand", "woman",
  "Du brauchst keine Angst zu haben, du bist in Sicherheit.", "stimme", { hold: 2 });

/* Kapitel 8 – Raum der Entscheidung */
setChapter(8);
add("music", "stand", "woman", "„Wo bin ich hier?“, stotterte ich gerade so heraus.", "jonas");
add("music", "stand", "woman",
  "Sie schloss ihren Mund und ihre Mimik nahm eine ausdruckslose Form an.", "gedanke");
add("music", "stand", "woman",
  "„Du bist im Raum der Entscheidung, hergekommen als Seele ohne Körper. Du fühlst keinen Schmerz, oder?“ fragte sie mich rhetorisch.", "tod");
add("music", "stand", "woman", "„Nein, ich fühle keinen Schmerz, ich fühle mich … gut.“", "jonas");
act("music", "stand", "watch", 3, "watch");
add("music", "stand", "watch",
  "Aus irgendeinem Grund sah ich auf meine Armbanduhr, vielleicht war es der gleiche Fluchtinstinkt wie vor einigen Minuten.", "gedanke");
add("music", "stand", "watch",
  "„Deine Uhr steht still“, sagte sie. „Die Zeit steht still. Du bist verstorben, Jonas.“", "tod", { hold: 2.5 });
add("music", "stand", "woman",
  "Mich überkam ein Gefühl von Traurigkeit und sofort schossen mir mehr Gedanken durch den Kopf als ich ertragen konnte.", "gedanke");

/* Kapitel 9 – Verzweiflung */
setChapter(9);
add("music", "stand", "woman",
  "„Aber ich muss noch meine Mutter abholen und mein Arbeitgeber wartet schon auf mich“, sagte ich entsetzt.", "jonas", { thought: "waiting" });
add("music", "stand", "woman",
  "Sie schaute mich immer noch mit diesem ausdruckslosen Blick an und sprach: „Dieser Raum hat keine Fenster, denn er existiert im Nichts. Eigentlich ist er genau nach deiner Fantasie gestaltet, so, wie du dir den Übergang vom Leben in den Tod vorstellst.“", "tod");
add("music", "stand", "woman",
  "Ich konnte spüren wie mir eine Träne die Wange hinunterlief und ein beengendes Gefühl von Endlichkeit durch die Brust strömte.", "gedanke");
add("music", "stand", "woman",
  "„Das war’s jetzt? Ich kann nichts mehr tun? Niemandem Bescheid sagen, keine Telefonate mehr führen? Ich kann in keins der Gesichter meiner Familie mehr schauen und nie wieder mit jemandem reden?“, schluchzte ich.", "jonas", { thought: "phone" });
add("music", "stand", "woman",
  "„Was hast du erwartet?“, fragte sie mich und schaute mich dabei fragend an, als wäre diese Frage selbstverständlich.", "tod");
act("music", "kneel", "woman", 2.2, "kneel");
add("music", "kneel", "woman", "Ich ließ meinen Körper sacken und fiel in die Knie.", "gedanke");
add("music", "kneel", "woman",
  "Meine Tränen feuchteten mein Gesicht weiter an und mir wurde bewusst, dass ich nun nichts mehr tun kann. Alle Gespräche, die ich bis hierhin geführt hatte, waren geführt.", "gedanke");
add("music", "kneel", "woman",
  "Alle Umarmungen, die ich bisher verteilt hatte, waren die letzten. Alles, was ich je getan habe, ist Geschichte.", "gedanke", { thought: "embrace" });
add("music", "kneel", "woman",
  "„Wer bist dann du, wenn das hier das Ende ist!?“, fragte ich sie wütend, ohne sie anzuschauen.", "jonas");

/* Kapitel 10 – Der Tod und die zwei Wege */
setChapter(10);
setDeath("piano");
act("music", "back", "piano", 2.2, "teleport", { piano: 1 });
add("music", "back", "piano",
  "Die Frau verschwand und saß plötzlich wieder am Klavier. Sie spielte die gleiche, chaotische Musik wie zuvor und es hörte sich immer noch falsch an, was sie spielte.", "gedanke");
add("music", "stand", "piano",
  "„Ich bin der Tod, aber meine Rolle ist nicht so wichtig wie das, was jetzt kommt. Siehst du die beiden Türen neben mir? Die blaue Tür und die grüne Tür entscheiden über deinen Weg. Du hast die Wahl.“, fuhr sie fast gleichgültig fort.", "tod");
add("music", "stand", "piano",
  "Ich sah auf zu den Türen und war immer noch wütend und fühlte mich ohnmächtig. Doch was hatte ich für eine Wahl. Ich fühlte mich wie ein Hund, dem man zwei Knochen hinwarf und der sich für einen der beiden entscheiden musste: „Wie sieht meine Auswahl denn aus?“", "jonas");
act("music", "stand", "piano", 0.1, undefined, { piano: 0 });
add("music", "stand", "piano", "Sie ließ die Tasten verstummen:", "gedanke");
add("music", "stand", "piano",
  "„Die blaue Tür führt dich hinaus ins Universum auf einen anderen, zufälligen Planeten. Du wirst als Entität wiedergeboren, wie sie auf dem jeweiligen Planeten existiert. Du steigst als neugeborenes Individuum in die Kultur und Epoche, der sich in dieser Welt befindlichen Bewohner, ein.", "tod");
add("music", "stand", "blue",
  "Nichtsahnend, dass es außer euch noch weitere Bewohner dieses Universums gibt, weit weg von deinem letzten Standort auf der Erde. Dein Gedächtnis und deine Erinnerungen werden getilgt. Du startest von Neuem.", "tod", { thought: "stars" });
add("music", "stand", "green",
  "Die grüne Tür führt dich wieder zurück auf die Erde. Du wirst als Mensch in der gleichen Epoche wiedergeboren, jedoch an einem zufälligen Standort. Dein Gedächtnis ist zurückgesetzt und du kannst die gleichen Erfahrungen machen, ohne zu wissen, sie jemals zuvor schon gemacht zu haben.", "tod", { thought: "earth" });
add("music", "stand", "green",
  "Auch hier wirst du in dem Glauben leben, dass ihr alleine im Universum seid und auch das ist ein Neuanfang. Bedenke jedoch, sobald du durch eine der Türen gehst, verlierst du deine Erinnerungen und deine Prägungen. Wähle deine Tür.“", "tod");
act("music", "stand", "green", 0.1, undefined, { piano: 1 });

/* Kapitel 11 – Verweigerung */
setChapter(11);
add("music", "stand", "piano",
  "„Was?! Wie soll ich mich da entscheiden? Keins ist besser als das andere. Ich will meine Erinnerungen behalten, sie sind alles, was mich ausmachen, alles woran ich hänge und alles was ich noch habe!“, schrie ich ihr entgegen.", "jonas");
add("music", "stand", "piano",
  "Ich wollte mich nicht entscheiden. Das Gefühl, alles zu verlieren, fraß mich von Sekunde zu Sekunde mehr auf.", "gedanke", { thought: "fading" });
act("music", "stand", "woman", 1.8, "teeth", { piano: 0 });
setDeath("near");
add("music", "stand", "woman",
  "Plötzlich stand sie wieder vor mir, wie aus dem Nichts, und riss ihren Mund weit auf. Ihre spitzen Zahnreihen traten aus ihrem Kiefer heraus und ihre Augen weiteten sich:", "gedanke");
add("music", "stand", "woman",
  "„Wählst du nichts, wird deine Seele hier enden. Du trittst an meine Stelle und verweilst in Ungewissheit, während ich mir endlich meine Tür aussuchen darf. Ich wollte meinen Tod nicht wahrhaben und wählte nichts … so weile ich hier seit endlos langer Zeit und geleite die Toten in ihre neuen Leben –", "tod");
add("music", "stand", "woman",
  "darauf wartend, dass jener dabei ist, der sich nicht entscheiden kann und mich somit ablöst. Willst du diese Aufgabe, so setze dich ans Klavier und spiele bis in alle Ewigkeit. Willst du sie nicht, so wähle JETZT!“", "tod", { hold: 1.6, thought: "pianoSelf" });

/* Kapitel 12 – Die grüne Tür */
setChapter(12);
setDeath("absent");
add("music", "stand", "blue",
  "Ich schaute erst die blaue, dann die grüne Tür an und lief hastig zur grünen Tür, obwohl ich mir nicht sicher war, wofür ich mich entscheiden sollte.", "gedanke");
act("music", "walk", "green", 3.2);
add("music", "reach", "green",
  "Dort angekommen, nahm ich den Türknauf in die Hand und drehte mich noch einmal zu ihr um. Sie war weg. Weder das Klavier wurde bespielt, noch stand sie irgendwo im Raum.", "gedanke");
setDoor("greenOpening");
act("music", "reach", "backdoor", 1.6, "openGreen");
setDoor("greenOpen");
add("white", "stand", "backdoor",
  "Ich drehte den Türknauf um und stieg in ein helles, weißes Licht. Mein letzter Gedanke war:", "gedanke");
add("white", "stand", "backdoor",
  "Bitte … lass mir ein bisschen Erinnerung.", "gedanke", { hold: 2.2 });

/* Kapitel 13 – Die letzten Worte */
setChapter(13);
add("white", "stand", "backdoor",
  "„Schon wieder hast du dich für die Reinkarnation auf der Erde entschieden, Jonas.“", "tod");
add("white", "stand", "backdoor",
  "„Nicht einmal warst du in deinen Toden bei mir und hast dich für die blaue Tür entschieden …“", "tod");
add("white", "stand", "backdoor",
  "„Als ob euch irgendwas in den Sternen an eure früheren Leben erinnere …“", "tod", { hold: 3 });

/* Lange Blöcke an Satzgrenzen teilen, damit nichts abgeschnitten wird. */
{
  const split: Beat[] = [];
  for (const b of B) {
    if (b.kind !== "text" || !b.text) {
      split.push(b);
      continue;
    }
    const sentences = b.text.match(/[^.!?…]+[.!?…]+[“"]?|[^.!?…]+$/g) ?? [b.text];
    const parts: string[] = [];
    let cur = "";
    for (const raw of sentences) {
      const sen = raw.trim();
      if (!sen) continue;
      const test = cur ? `${cur} ${sen}` : sen;
      if (cur && words(test) > 28) {
        parts.push(cur);
        cur = sen;
      } else cur = test;
    }
    if (cur) parts.push(cur);
    // Eine zweite, echte Rasterprüfung verhindert still abgeschnittene Zeilen.
    const fitted: string[] = [];
    for (const part of parts) {
      let fittedPart = "";
      for (const word of part.split(/\s+/)) {
        const test = fittedPart ? `${fittedPart} ${word}` : word;
        if (fittedPart && pixelLines(test, TEXT.w - 36, 2.25, 0.7).length > 4) {
          fitted.push(fittedPart);
          fittedPart = word;
        } else fittedPart = test;
      }
      if (fittedPart) fitted.push(fittedPart);
    }
    parts.length = 0;
    parts.push(...fitted);
    if (parts.length <= 1) {
      split.push(b);
      continue;
    }
    parts.forEach((part, i) => {
      split.push({
        ...b,
        id: `${b.id}.${i + 1}`,
        text: part,
        dur: readTime(part) + (i === parts.length - 1 ? (b.hold ?? 0) : 0),
        hold: i === parts.length - 1 ? b.hold : undefined,
        fx: i === 0 ? b.fx : undefined,
        piano: i === 0 ? b.piano : undefined,
      });
    });
  }
  B.length = 0;
  B.push(...split);
}

/* Zeitachse aufbauen */
const starts: number[] = [];
let total = 0;
const chapterStarts = new Map<Chapter, number>();
for (let i = 0; i < B.length; i++) {
  starts.push(total);
  if (!chapterStarts.has(B[i].chapter)) chapterStarts.set(B[i].chapter, total);
  total += B[i].dur;
}
export const DREAM_LENGTH = total;

/** Klavierabschnitte aus den Beats ableiten */
interface PianoSeg { from: number; to: number; level: number }
const pianoSegs: PianoSeg[] = [];
{
  let level = 0;
  let from = 0;
  for (let i = 0; i < B.length; i++) {
    const want = B[i].piano;
    if (want !== undefined && want !== level) {
      if (level > 0) pianoSegs.push({ from, to: starts[i], level });
      level = want;
      from = starts[i];
    }
  }
  if (level > 0) pianoSegs.push({ from, to: total, level });
}

/** Zustand an einer Traumzeit */
export function stateAt(t: number) {
  const time = Math.max(0, Math.min(total, t));
  let i = 0;
  while (i < B.length - 1 && starts[i + 1] <= time) i++;
  const beat = B[i];
  const into = time - starts[i];
  const seg = pianoSegs.find((s) => time >= s.from && time < s.to) ?? null;
  return {
    beat,
    index: i,
    into,
    phase: beat.dur > 0 ? Math.min(1, into / beat.dur) : 1,
    chapterInto: time - (chapterStarts.get(beat.chapter) ?? 0),
    time,
    piano: seg ? seg.level : 0,
    pianoFrom: seg?.from ?? 0,
  };
}

const rnd = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/* ------------------------------ Audio ---------------------------------- */

interface Voice {
  stop: () => void;
}

class DreamAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: Voice[] = [];
  private beatNext = 0;
  private breathNext = 0;
  private knockDone = new Set<string>();
  private droneOn = false;
  private droneStop: (() => void) | null = null;
  private noiseCache = new Map<string, AudioBuffer>();
  private lastPianoTime = 0;
  private lastPianoFrom = -1;

  /** Nutzt den vorhandenen Spiel-Audiokontext statt einen zweiten zu öffnen. */
  ensure() {
    const shared = sfx.getSharedAudio();
    if (!shared) return;
    if (this.ctx !== shared.ctx || !this.master) {
      this.stopAll();
      this.ctx = shared.ctx;
      this.master = shared.ctx.createGain();
      this.master.gain.value = 0.2;
      this.master.connect(shared.master);
    }
  }

  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  private voice(stop: () => void) {
    const v = { stop };
    this.voices.push(v);
    if (this.voices.length > 40) {
      const old = this.voices.shift();
      if (old) old.stop();
    }
    return v;
  }

  private forget(v: Voice) {
    const i = this.voices.indexOf(v);
    if (i >= 0) this.voices.splice(i, 1);
  }

  /** kurze Welle mit Hüllkurve */
  private tone(f: number, dur: number, gain: number, type: OscillatorType = "sine", f2?: number, delay = 0) {
    if (!this.ctx || !this.master || sfx.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.01 + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f), t0);
    if (f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
    const voice = this.voice(() => {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        osc.stop();
      } catch {
        /* schon beendet */
      }
    });
    osc.addEventListener('ended', () => this.forget(voice), { once: true });
  }

  private noise(dur: number, gain: number, freq: number, q = 1) {
    if (!this.ctx || !this.master || sfx.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.01;
    const key = `${dur.toFixed(3)}:${freq.toFixed(0)}`;
    let buf = this.noiseCache.get(key);
    if (!buf || buf.sampleRate !== ctx.sampleRate) {
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const v = Math.sin(i * 12.9898 + dur * 78.23) * 43758.5453;
        d[i] = (v - Math.floor(v)) * 2 - 1;
      }
      this.noiseCache.set(key, buf);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    const voice = this.voice(() => {
      try {
        src.stop();
      } catch {
        /* schon beendet */
      }
    });
    src.addEventListener('ended', () => this.forget(voice), { once: true });
  }

  /** Dumpfe Klavierähnliche Note aus additiven Sinusanteilen. */
  piano(midi: number, gain = 0.09, bright = 1) {
    if (!this.ctx || !this.master || sfx.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.01;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const parts = [1, 2, 3.01, 4.02, 5.03, 6.05];
    const amps = [1, 0.35, 0.18, 0.1, 0.06, 0.03].map((a, i) => a * (i < 3 ? 1 : bright));
    const sum = amps.reduce((a, b) => a + b, 0);
    const g = ctx.createGain();
    g.gain.value = gain;
    g.connect(this.master);
    const oscs: OscillatorNode[] = [];
    parts.forEach((p, i) => {
      const osc = ctx.createOscillator();
      const eg = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f * p;
      const a = amps[i] / sum;
      const life = i === 0 ? 2.1 : Math.max(0.16, 0.8 / (i + 0.4));
      eg.gain.setValueAtTime(0.0001, t0);
      eg.gain.exponentialRampToValueAtTime(Math.max(0.0002, a), t0 + 0.006);
      eg.gain.exponentialRampToValueAtTime(0.0001, t0 + life);
      osc.connect(eg);
      eg.connect(g);
      osc.start(t0);
      osc.stop(t0 + life + 0.03);
      oscs.push(osc);
    });
    const voice = this.voice(() => {
      for (const o of oscs) {
        try {
          o.stop();
        } catch {
          /* schon beendet */
        }
      }
    });
    oscs[0]?.addEventListener('ended', () => this.forget(voice), { once: true });
  }

  /** Grundbrummen, solange der Traum läuft. */
  startDrone() {
    if (!this.ctx || !this.master || sfx.muted || this.droneOn) return;
    this.droneOn = true;
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 4);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 45;
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 0.12;
    lg.gain.value = 2.2;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    lfo.start();
    this.droneStop = () => {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
        osc.stop(ctx.currentTime + 0.4);
        lfo.stop(ctx.currentTime + 0.4);
      } catch {
        /* schon beendet */
      }
    };
  }

  private stopDrone() {
    this.droneStop?.();
    this.droneStop = null;
    this.droneOn = false;
  }

  stopAll() {
    for (const v of [...this.voices]) v.stop();
    this.voices = [];
    this.knockDone.clear();
    this.stopDrone();
  }

  close() {
    this.stopAll();
    this.master?.disconnect();
    this.ctx = null;
    this.master = null;
    this.noiseCache.clear();
  }

  resetCursor(time: number) {
    this.beatNext = time;
    this.breathNext = time;
    this.lastPianoTime = time;
    this.lastPianoFrom = -1;
  }

  suspend() {
    // Nicht den gemeinsamen Spiel-AudioContext anhalten.
    this.stopAll();
  }

  resume() {
    this.ensure();
  }

  fx(kind: "knock" | "ping" | "breath" | "door" | "bubble") {
    if (kind === "knock") {
      this.tone(120, 0.16, 0.18, "sine", 70);
      this.noise(0.06, 0.05, 700, 0.8);
    } else if (kind === "ping") {
      this.tone(1000, 0.28, 0.08, "sine", 2400);
    } else if (kind === "breath") {
      this.noise(0.7, 0.05, 900, 0.6);
    } else if (kind === "door") {
      this.tone(92, 0.22, 0.09, "triangle", 60);
      this.noise(0.18, 0.04, 500, 1.2);
    } else {
      this.tone(520, 0.16, 0.05, "sine", 900);
    }
  }

  /** Freigabe-Set für Klopfen je Durchlauf */
  knock(key: string) {
    if (this.knockDone.has(key)) return;
    this.knockDone.add(key);
    this.fx("knock");
  }

  /** Pro Bild: Herzschlag, Atem und exakt einmalige Klavierereignisse. */
  frame(time: number, pianoLevel: number, pianoFrom: number, atmosphere: number, paused: boolean) {
    if (!this.ctx || paused) return;
    if (sfx.muted) return;
    if (atmosphere > 0.01) this.startDrone();
    else this.stopDrone();
    // Herzschlag 60 → 78 bpm in den ersten 12 s
    const bpm = 60 + 18 * Math.min(1, time / 12);
    const period = 60 / bpm;
    if (time >= this.beatNext) {
      this.tone(80, 0.16, 0.12);
      this.tone(120, 0.2, 0.06, "sine", 92, 0.15);
      this.beatNext = time + period;
    }
    if (time >= this.breathNext) {
      this.noise(2.6, 0.018, 600, 0.7);
      this.breathNext = time + 5;
    }
    if (pianoLevel <= 0) {
      this.lastPianoTime = time;
      this.lastPianoFrom = -1;
      return;
    }
    if (this.lastPianoFrom !== pianoFrom || time < this.lastPianoTime) {
      this.lastPianoFrom = pianoFrom;
      this.lastPianoTime = time;
    }
    const from = this.lastPianoTime;
    const to = time;
    const loop0 = Math.floor((from - pianoFrom) / 16);
    const loop1 = Math.floor((to - pianoFrom) / 16);
    for (let loop = Math.max(0, loop0); loop <= Math.max(0, loop1); loop++) {
      for (const note of MOTIF) {
        const at = pianoFrom + loop * 16 + note.at;
        if (at > from && at <= to + 1e-6) this.piano(note.midi, pianoLevel > 0.8 ? 0.075 : 0.03, pianoLevel);
      }
    }
    this.lastPianoTime = time;
  }
}

/** Verbindliches Motiv: 4 Takte à 4 s, mit zwei festen Timing-Fehlern. */
const MOTIF: { at: number; midi: number }[] = [];
{
  const bars: { lh: [number, number][]; rh: [number, number][] }[] = [
    { lh: [[0, 50], [2, 57]], rh: [[0.5, 62], [1.5, 65], [2.5, 69], [3.5, 64]] },
    { lh: [[0, 46], [2, 53]], rh: [[0.5, 62], [1.5, 65], [2.59, 68], [3.5, 69]] },
    { lh: [[0, 43], [2, 50]], rh: [[0.5, 58], [1.5, 62], [2.5, 65], [3.5, 61]] },
    { lh: [[0, 45], [2, 52]], rh: [[0.5, 61], [1.5, 64], [2.5, 70], [3.38, 63]] },
  ];
  bars.forEach((bar, i) => {
    bar.lh.forEach(([b, m]) => MOTIF.push({ at: i * 4 + b, midi: m }));
    bar.rh.forEach(([b, m]) => MOTIF.push({ at: i * 4 + b, midi: m }));
  });
  MOTIF.sort((a, b) => a.at - b.at);
}

/** Diagnose für Tests: 24 eindeutige Ereignisse innerhalb einer 16-s-Schleife. */
export function dreamNoteEvents() {
  return MOTIF.map((note) => ({ ...note }));
}

/* ------------------------------ Zeichnen -------------------------------- */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Sprechername und Farbe */
function whoLabel(who: Who) {
  if (who === "jonas") return { name: "JONAS", tint: "#bfe3ff" };
  if (who === "tod") return { name: "DER TOD", tint: "#ffc2d6" };
  if (who === "stimme") return { name: "GEDANKENSTIMME", tint: "#d9c7ff" };
  return { name: "JONAS · GEDANKEN", tint: "#cfe4dc" };
}

/** Stilisierter Jonas mit klar lesbaren Posen. */
function rr(c: C, x: number, y: number, w: number, h: number, r: number, fill: string) {
  const q = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + q, y);
  c.lineTo(x + w - q, y);
  c.quadraticCurveTo(x + w, y, x + w, y + q);
  c.lineTo(x + w, y + h - q);
  c.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  c.lineTo(x + q, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - q);
  c.lineTo(x, y + q);
  c.quadraticCurveTo(x, y, x + q, y);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function strokeLimb(c: C, a: [number, number], b: [number, number], d: [number, number], col: string, w: number) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(a[0], a[1]);
  c.lineTo(b[0], b[1]);
  c.lineTo(d[0], d[1]);
  c.stroke();
}

interface JonasAnchors {
  feet: [number, number];
  head: [number, number];
  leftHand: [number, number];
  rightHand: [number, number];
  watch: [number, number];
}

/** Lokale Anker der Figur: Shots kennen nur diese Punkte, keine Szenenkoordinaten. */
function jonasAnchors(pose: Pose, look: Look, t: number): JonasAnchors {
  const walk = pose === 'walk' ? Math.sin(t * 5.5) * 7 : 0;
  const reach = pose === 'reach' || pose === 'listen';
  const kneel = pose === 'kneel';
  const leftHand: [number, number] = reach ? [-26, -49] : kneel ? [-14, -39] : [-16, -38];
  const rightHand: [number, number] = look === 'watch' ? [13, -50] : reach ? [17, -47] : kneel ? [15, -39] : [16, -38];
  return {
    feet: [walk * 0.1, 0],
    head: [0, -89],
    leftHand,
    rightHand,
    watch: rightHand,
  };
}

interface DeathAnchors {
  head: [number, number];
  leftHand: [number, number];
  rightHand: [number, number];
}

function deathAnchors(mode: 'piano' | 'close' | 'scream'): DeathAnchors {
  if (mode === 'piano') return { head: [0, -94], leftHand: [-27, -77], rightHand: [27, -77] };
  return { head: [0, -108], leftHand: [-28, -33], rightHand: [28, -33] };
}

/** Frontale Dielen: wenige Reihen, versetzte Fugen, kein Fluchtliniennetz. */
function drawFloor(c: C, y: number, bottom: number, seed: number) {
  c.fillStyle = '#765035';
  c.fillRect(0, y, W, bottom - y);
  const h = 18;
  for (let row = 0; y + row * h < bottom; row++) {
    const yy = y + row * h;
    c.fillStyle = row % 2 ? 'rgba(49,29,18,.28)' : 'rgba(255,218,170,.08)';
    c.fillRect(0, yy, W, 1.6);
    const shift = ((row + seed) % 2) * 68;
    for (let x = -shift; x < W; x += 136) {
      c.fillStyle = 'rgba(49,29,18,.26)';
      c.fillRect(x, yy + 2, 1.4, Math.min(h - 2, bottom - yy));
      if ((row + Math.floor(x / 136)) % 7 === 0) {
        c.fillStyle = 'rgba(20,12,8,.35)';
        c.beginPath();
        c.arc(x + 34, yy + 9, 1.2, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}

function drawPanelWall(c: C, top: number, bottom: number) {
  c.fillStyle = '#2c1d18';
  c.fillRect(0, top, W, bottom - top);
  for (let x = 14; x < W; x += 74) {
    rr(c, x, top + 12, 62, bottom - top - 32, 2, '#482d20');
    c.strokeStyle = 'rgba(13,8,7,.55)';
    c.lineWidth = 2;
    c.strokeRect(x + 1, top + 13, 60, bottom - top - 34);
    c.strokeStyle = 'rgba(225,177,126,.10)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + 7, top + 28);
    c.quadraticCurveTo(x + 28, top + 74, x + 10, bottom - 36);
    c.moveTo(x + 50, top + 25);
    c.quadraticCurveTo(x + 33, top + 102, x + 55, bottom - 42);
    c.stroke();
  }
  c.fillStyle = '#241712';
  c.fillRect(0, bottom - 20, W, 20);
  c.fillStyle = 'rgba(255,218,170,.10)';
  c.fillRect(0, bottom - 22, W, 2);
}

function drawDoor(c: C, x: number, y: number, w: number, h: number, col: string, glow = 0, open = 0) {
  const dw = w * (1 - open * 0.78);
  c.fillStyle = '#1a100d';
  c.fillRect(x - 7, y - 8, w + 14, h + 8);
  c.fillStyle = '#806045';
  c.fillRect(x - 4, y - 5, w + 8, h + 5);
  c.fillStyle = col;
  c.fillRect(x, y, dw, h);
  c.fillStyle = 'rgba(0,0,0,.22)';
  c.fillRect(x + 5, y + 6, Math.max(0, dw - 10), h * 0.44);
  c.fillRect(x + 5, y + h * 0.55, Math.max(0, dw - 10), h * 0.37);
  c.fillStyle = 'rgba(255,255,255,.10)';
  c.fillRect(x + 2, y + 2, Math.max(0, dw - 4), 2);
  if (dw > 12) {
    c.fillStyle = '#c8d1d2';
    c.beginPath();
    c.arc(x + dw - 10, y + h * 0.55, 3, 0, Math.PI * 2);
    c.fill();
  }
  if (glow > 0) {
    const g = c.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, Math.max(w, h));
    g.addColorStop(0, `rgba(245,205,122,${glow})`);
    g.addColorStop(1, 'rgba(245,205,122,0)');
    c.fillStyle = g;
    c.fillRect(x - h * 0.5, y - h * 0.5, w + h, h * 2);
  }
}

function drawFishLamp(c: C, x: number, y: number, t: number) {
  const pulse = 0.86 + Math.sin(t * 1.4 + x) * 0.04;
  c.strokeStyle = '#846c4b';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, y - 20);
  c.lineTo(x, y - 8);
  c.stroke();
  rr(c, x - 7, y - 9, 14, 4, 1.5, '#7c6548');
  const g = c.createRadialGradient(x, y + 8, 2, x, y + 8, 58);
  g.addColorStop(0, `rgba(246,198,108,${0.34 * pulse})`);
  g.addColorStop(1, 'rgba(246,198,108,0)');
  c.fillStyle = g;
  c.fillRect(x - 58, y - 50, 116, 116);
  c.fillStyle = `rgba(246,202,122,${pulse})`;
  c.beginPath();
  c.ellipse(x, y + 7, 8, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#d4b06a';
  c.lineWidth = 1.2;
  c.stroke();
}

/** Jonas: bewusst gezeichnete Ganzkörperfigur mit Händen, Nähten und Gesicht. */
/** Lokale Jonas-Figur: Ursprung zwischen den Füßen, ohne Szenenkoordinaten. */
function drawJonas(c: C, pose: Pose, look: Look, t: number) {
  c.save();
  const breath = Math.sin(t * 1.7) * 0.45;
  const kneel = pose === 'kneel';
  const lying = pose === 'lie';
  const walk = pose === 'walk';
  const anchors = jonasAnchors(pose, look, t);
  c.fillStyle = 'rgba(0,0,0,.33)';
  c.beginPath();
  c.ellipse(0, 2, lying ? 36 : 17, 3.5, 0, 0, Math.PI * 2);
  c.fill();
  if (lying) {
    c.translate(-20, -5);
    c.rotate(-Math.PI / 2.1);
  }
  if (kneel) c.translate(0, 17);
  // Beine, Knie und Schuhe
  const stride = walk ? Math.sin(t * 5.5) * 7 : 0;
  c.fillStyle = '#303a48';
  if (kneel) {
    rr(c, -10, -30, 8, 26, 3, '#303a48');
    rr(c, 3, -30, 8, 26, 3, '#364252');
    rr(c, -20, -5, 14, 6, 3, '#1b2029');
    rr(c, 7, -5, 14, 6, 3, '#1b2029');
  } else {
    c.save();
    c.rotate(-0.06 + stride * 0.006);
    rr(c, -9, -31, 8, 30, 3, '#303a48');
    c.restore();
    c.save();
    c.rotate(0.05 - stride * 0.006);
    rr(c, 2, -31, 8, 30, 3, '#364252');
    c.restore();
    rr(c, -12 + stride * 0.2, -3, 13, 5, 2.5, '#1b2029');
    rr(c, 1 - stride * 0.2, -3, 13, 5, 2.5, '#1b2029');
  }
  c.fillStyle = 'rgba(255,255,255,.11)';
  c.fillRect(-7, -16, 5, 1);
  c.fillRect(4, -16, 5, 1);
  // Oberkörper und Saum
  rr(c, -12, -70 + breath, 24, 42, 5, '#5c675f');
  c.fillStyle = '#4b554e';
  c.fillRect(-12, -31, 24, 4);
  c.strokeStyle = 'rgba(238,230,210,.24)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-10, -62);
  c.lineTo(10, -62);
  c.moveTo(0, -66);
  c.lineTo(0, -34);
  c.stroke();
  // Arme und Hände
  const leftHand = anchors.leftHand;
  const rightHand = anchors.rightHand;
  strokeLimb(c, [-10, -65], [-18, -52], leftHand, '#5c675f', 6);
  strokeLimb(c, [10, -65], [15, -53], rightHand, '#657168', 6);
  for (const hand of [leftHand, rightHand]) {
    c.fillStyle = '#e5bd99';
    c.beginPath();
    c.arc(hand[0], hand[1], 3.2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#c99778';
    c.lineWidth = 0.7;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(hand[0] + i, hand[1] + 1);
      c.lineTo(hand[0] + i * 1.2, hand[1] + 3.2);
      c.stroke();
    }
  }
  // Uhr
  if (look === 'watch') {
    c.fillStyle = '#d9dedc';
    c.beginPath();
    c.arc(anchors.watch[0], anchors.watch[1], 3.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#52606b';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(anchors.watch[0], anchors.watch[1]);
    c.lineTo(anchors.watch[0], anchors.watch[1] - 2.4);
    c.stroke();
  }
  // Hals, Kopf, Haare, Gesicht
  rr(c, -2.5, -79, 5, 9, 1.8, '#d5a983');
  c.fillStyle = '#e8c49c';
  c.beginPath();
  c.ellipse(0, -89 + breath, 10, 11.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#392a22';
  c.beginPath();
  c.arc(0, -95 + breath, 10.5, Math.PI * 0.9, Math.PI * 2.12);
  c.fill();
  c.fillRect(-10, -95, 3, 12);
  // Gesicht abhängig vom Blick
  const faceX = look === 'door' || look === 'bigdoor' || look === 'green' ? 2.8 : look === 'blue' ? -2.8 : 0;
  c.fillStyle = '#2a3032';
  c.beginPath();
  c.arc(faceX - 3.1, -90 + breath, 1.05, 0, Math.PI * 2);
  c.arc(faceX + 3.1, -90 + breath, 1.05, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#765044';
  c.lineWidth = pose === 'kneel' ? 1.1 : 0.8;
  c.beginPath();
  c.moveTo(faceX - 2.5, -83 + breath);
  c.quadraticCurveTo(faceX, -82 + breath, faceX + 2.5, -83 + breath);
  c.stroke();
  if (pose === 'kneel') {
    c.fillStyle = 'rgba(168,210,235,.8)';
    c.beginPath();
    c.arc(faceX + 5, -84 + breath, 1.4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** Shot-Komposition setzt die lokale Figur explizit in den Raum. */
function drawJonasAt(c: C, x: number, y: number, scale: number, pose: Pose, look: Look, t: number) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  drawJonas(c, pose, look, t);
  c.restore();
}

/** Der Tod: Kleid, Haarsträhnen, Augenhöhlen und mehrere Zahnreihen. */
function drawDeath(c: C, mode: 'piano' | 'close' | 'scream') {
  const anchors = deathAnchors(mode);
  if (mode === 'piano') {
    c.save();
    c.fillStyle = 'rgba(0,0,0,.32)';
    c.beginPath();
    c.ellipse(0, 3, 21, 3.5, 0, 0, Math.PI * 2);
    c.fill();
    // Hocker
    rr(c, -20, -9, 40, 8, 3, '#2b201b');
    c.fillStyle = '#1a1412';
    c.fillRect(-15, -1, 4, 22);
    c.fillRect(11, -1, 4, 22);
    // Kleid und Rücken
    c.fillStyle = '#bd7f91';
    c.beginPath();
    c.moveTo(-24, -6);
    c.quadraticCurveTo(-17, -70, -5, -82);
    c.quadraticCurveTo(13, -78, 24, -6);
    c.closePath();
    c.fill();
    c.fillStyle = '#8f5d6e';
    c.beginPath();
    c.arc(-8, -44, 4, 0, Math.PI * 2);
    c.arc(8, -26, 3.4, 0, Math.PI * 2);
    c.fill();
    // Mehrlagiges Haar
    c.fillStyle = '#16151b';
    for (const [x, w, h] of [[-10, 12, 50], [0, 17, 61], [10, 12, 47]] as const) {
      c.beginPath();
      c.ellipse(x, -72 + h * 0.25, w, h * 0.72, 0.12 * x, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = '#40404c';
    c.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(i * 5, -92);
      c.quadraticCurveTo(i * 7, -58, i * 5 + 2, -30);
      c.stroke();
    }
    // Hände an der Tastatur
    for (const x of [anchors.leftHand[0], anchors.rightHand[0]]) {
      c.strokeStyle = '#dfc9ca';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x * 0.45, -58);
      c.lineTo(x, anchors.leftHand[1]);
      c.stroke();
      c.fillStyle = '#dfc9ca';
      for (let i = 0; i < 4; i++) c.fillRect(x - 4 + i * 2.2, anchors.leftHand[1] - 3 + (i % 2), 1.5, 7);
    }
    c.restore();
    return;
  }
  c.save();
  c.fillStyle = 'rgba(0,0,0,.34)';
  c.beginPath();
  c.ellipse(0, 3, 25, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.scale(mode === 'scream' ? 1.26 : 1.14, mode === 'scream' ? 1.26 : 1.14);
  // Kleidvolumen
  c.fillStyle = '#c68a99';
  c.beginPath();
  c.moveTo(-26, -4);
  c.quadraticCurveTo(-18, -78, 0, -87);
  c.quadraticCurveTo(18, -78, 27, -4);
  c.closePath();
  c.fill();
  c.fillStyle = '#8e5969';
  for (const [x, y, r] of [[-12, -48, 4], [7, -32, 3], [-3, -17, 4], [12, -62, 2.4]]) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = 'rgba(244,191,201,.36)';
  c.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    c.beginPath();
    c.moveTo(i * 7, -72);
    c.quadraticCurveTo(i * 10, -36, i * 8, -8);
    c.stroke();
  }
  // Arme und Finger
  strokeLimb(c, [-18, -66], [-29, -50], [-28, -33], '#d8bfc1', 5);
  strokeLimb(c, [18, -66], [29, -50], [28, -33], '#e5cdce', 5);
  for (const x of [anchors.leftHand[0], anchors.rightHand[0]]) {
    c.fillStyle = '#e5cdce';
    for (let i = 0; i < 4; i++) c.fillRect(x - 3 + i * 2, -35, 1.3, 6);
  }
  // Kopf mit Haarsträhnen
  c.fillStyle = '#e7d6d8';
  c.beginPath();
  c.ellipse(anchors.head[0], anchors.head[1], 11.8, 13, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#17161c';
  c.beginPath();
  c.arc(0, -115, 13, Math.PI * 0.85, Math.PI * 2.15);
  c.fill();
  for (let i = -3; i <= 3; i++) {
    c.fillStyle = i % 2 ? '#121218' : '#25242d';
    c.beginPath();
    c.moveTo(i * 3.3, -118);
    c.quadraticCurveTo(i * 5, -91, i * 4 + 1, -78);
    c.lineTo(i * 4 - 2, -78);
    c.quadraticCurveTo(i * 2, -101, i * 3.3, -118);
    c.closePath();
    c.fill();
  }
  // Augenhöhlen
  c.fillStyle = '#050508';
  c.beginPath();
  c.ellipse(-4.2, -109, 3.1, 3.7, 0, 0, Math.PI * 2);
  c.ellipse(4.2, -109, 3.1, 3.7, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#b98590';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-6.5, -105);
  c.quadraticCurveTo(0, -102, 6.5, -105);
  c.stroke();
  const jaw = mode === 'scream' ? 10 : 4;
  c.fillStyle = '#271418';
  c.beginPath();
  c.ellipse(0, -98, 6.8, jaw, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f3eadf';
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 7; i++) {
      const tx = -5.8 + i * 1.95;
      const ty = -100 - jaw * 0.45 + row * (jaw * 0.75);
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(tx + 1.6, ty);
      c.lineTo(tx + 0.8, ty + 2.4);
      c.closePath();
      c.fill();
    }
  }
  c.restore();
}

/** Lokale Todesfigur; Hocker- und Nahpositionen werden im Shot gesetzt. */
function drawDeathAt(c: C, x: number, y: number, scale: number, mode: 'piano' | 'close' | 'scream') {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  drawDeath(c, mode);
  c.restore();
}

function drawPiano(c: C, baseY = 304) {
  c.save();
  c.translate(654, baseY);
  // Stehendes Klavier: Korpus, Tastaturvorbau, Beine und Pedale.
  rr(c, -66, -164, 132, 104, 4, '#211815');
  c.fillStyle = '#3a281e';
  c.fillRect(-60, -158, 120, 92);
  c.fillStyle = 'rgba(245,215,166,.13)';
  c.fillRect(-58, -155, 116, 3);
  c.fillStyle = '#291b16';
  c.fillRect(-74, -76, 148, 25);
  c.fillStyle = '#f1eee3';
  c.fillRect(-69, -74, 138, 13);
  c.fillStyle = '#151416';
  for (let i = 0; i < 24; i++) c.fillRect(-65 + i * 5.7, -74, 2.4, 8);
  c.fillStyle = '#171211';
  c.fillRect(-61, -51, 9, 62);
  c.fillRect(52, -51, 9, 62);
  c.fillRect(-55, -51, 110, 8);
  c.fillStyle = '#c4a46a';
  c.fillRect(-6, 12, 4, 9);
  c.fillRect(5, 12, 4, 9);
  c.strokeStyle = 'rgba(245,215,166,.18)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-54, -148);
  c.quadraticCurveTo(-8, -139, 54, -149);
  c.stroke();
  c.restore();
}

function drawHall(c: C, t: number) {
  const ceiling = 36;
  const floor = 306;
  c.fillStyle = '#160e11';
  c.fillRect(0, 0, W, 380);
  drawPanelWall(c, ceiling, floor);
  drawFloor(c, floor, 380, 4);
  // Dunkelroter Teppich: ein waagerechtes Laufband mit abgelaufener Mitte.
  c.fillStyle = '#68252d';
  c.fillRect(0, floor + 5, W, 62);
  c.fillStyle = '#4b1a22';
  c.fillRect(0, floor + 9, W, 8);
  c.fillRect(0, floor + 56, W, 7);
  c.fillStyle = 'rgba(223,136,124,.10)';
  c.fillRect(0, floor + 25, W, 19);
  // Sichtbare Türreihe in der Rückwand, alle auf derselben Bodenlinie.
  const doors = [70, 212, 354, 496, 638];
  doors.forEach((x, i) => {
    drawDoor(c, x, 116, 82, 190, '#543625');
    drawFishLamp(c, x - 18, 156, t + i * 0.2);
  });
  // Große einzelne Endtür – höher und heller, aber nicht doppelt.
  drawDoor(c, 804, 82, 112, 224, '#8a6440', 0.32);
  drawFishLamp(c, 782, 136, t);
  // Gegenüberliegende Türreihe nur in einem ruhigen oberen Gegenstreifen.
  c.globalAlpha = 0.32;
  drawDoor(c, 140, 58, 52, 92, '#493124');
  drawDoor(c, 292, 58, 52, 92, '#493124');
  drawDoor(c, 444, 58, 52, 92, '#493124');
  c.globalAlpha = 1;
}

function drawMusicRoom(c: C, t: number, door: DoorState = 'closed', phase = 0) {
  const ceiling = 34;
  const floor = 304;
  c.fillStyle = '#1d1412';
  c.fillRect(0, 0, W, 380);
  drawPanelWall(c, ceiling, floor);
  drawFloor(c, floor, 380, 7);
  // Schwere Vorhänge hängen vor Holz, nicht vor Fenstern.
  for (const [x, w] of [[246, 94], [678, 100]] as const) {
    c.fillStyle = '#5b1d2a';
    c.beginPath();
    c.moveTo(x, 42);
    c.quadraticCurveTo(x + w * 0.22, 170, x + 6, floor - 2);
    c.lineTo(x + w - 7, floor - 2);
    c.quadraticCurveTo(x + w * 0.72, 170, x + w, 42);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(245,184,177,.17)';
    c.lineWidth = 1.4;
    for (let i = 1; i < 5; i++) {
      const fx = x + (w * i) / 5;
      c.beginPath();
      c.moveTo(fx, 47);
      c.quadraticCurveTo(fx + (i % 2 ? -7 : 7), 170, fx + (i % 2 ? -4 : 4), floor - 5);
      c.stroke();
    }
  }
  // Links blau, freie Mitte, Klavier rechts der Mitte, grün ganz rechts.
  drawDoor(c, 62, 104, 102, 200, '#3e63aa');
  const greenOpen = door === 'greenOpen' ? 1 : door === 'greenOpening' ? phase : 0;
  drawDoor(c, 826, 104, 102, 200, '#3f8a59', greenOpen > 0.1 ? 0.28 : 0, greenOpen);
  drawFishLamp(c, 188, 132, t);
  drawFishLamp(c, 566, 132, t);
  drawFishLamp(c, 790, 132, t);
  drawPiano(c);
}

function drawRoom(c: C, t: number, door: DoorState = 'closed', phase = 0) {
  // Dachgeschoss-Ausschnitt: waagerechte weiße Innendecke unter der Schräge.
  c.fillStyle = '#24212a';
  c.fillRect(0, 0, W, 380);
  const roomL = 188;
  const roomR = 794;
  const ceiling = 54;
  const floor = 310;
  c.fillStyle = '#f0f1ed';
  c.fillRect(roomL, ceiling, roomR - roomL, 18);
  c.fillStyle = 'rgba(78,75,70,.18)';
  c.fillRect(roomL, ceiling + 16, roomR - roomL, 2);
  // Dachschräge bleibt außen sichtbar, tritt aber nicht in den Raum.
  c.fillStyle = '#303a48';
  c.beginPath();
  c.moveTo(84, 128);
  c.lineTo(470, 16);
  c.lineTo(856, 128);
  c.lineTo(856, ceiling);
  c.lineTo(roomR, ceiling);
  c.lineTo(roomL, ceiling);
  c.lineTo(84, ceiling);
  c.closePath();
  c.fill();
  c.fillStyle = '#2c1d18';
  c.fillRect(roomL, ceiling + 18, roomR - roomL, floor - ceiling - 18);
  // Breite Ebenholzpaneele und Sockel.
  for (let x = roomL + 14; x < roomR - 12; x += 92) {
    rr(c, x, ceiling + 34, 76, floor - ceiling - 64, 2, '#482d20');
    c.strokeStyle = 'rgba(10,7,6,.58)';
    c.lineWidth = 2;
    c.strokeRect(x + 1, ceiling + 35, 74, floor - ceiling - 66);
    c.strokeStyle = 'rgba(225,177,126,.09)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + 12, ceiling + 55);
    c.quadraticCurveTo(x + 38, ceiling + 120, x + 18, floor - 42);
    c.stroke();
  }
  c.fillStyle = '#241712';
  c.fillRect(roomL, floor - 18, roomR - roomL, 18);
  drawFloor(c, floor, 380, 2);
  // einzige Ausgangstür links
  const open = door === 'roomOpen' ? Math.max(0.08, phase) : 0;
  drawDoor(c, roomL + 28, 112, 94, 198, '#543625', 0, open);
  // kleine leere Concierge-Theke rechts
  c.fillStyle = '#2e211b';
  c.fillRect(632, 232, 142, 78);
  c.fillStyle = '#573929';
  c.fillRect(624, 222, 158, 14);
  c.fillStyle = 'rgba(255,225,184,.16)';
  c.fillRect(628, 224, 150, 2);
  c.fillStyle = '#211712';
  c.fillRect(646, 243, 48, 67);
  c.fillRect(704, 243, 56, 67);
  c.fillStyle = 'rgba(0,0,0,.35)';
  c.fillRect(632, 309, 142, 7);
  // unauffälliges künstliches Raumlicht
  const g = c.createRadialGradient(510, 120, 8, 510, 160, 230);
  g.addColorStop(0, 'rgba(242,207,122,.18)');
  g.addColorStop(1, 'rgba(242,207,122,0)');
  c.fillStyle = g;
  c.fillRect(roomL, ceiling + 18, roomR - roomL, floor - ceiling);
  void t;
}

function drawDetailShot(c: C, st: ReturnType<typeof stateAt>, t: number) {
  const b = st.beat;
  if (b.shot === 'knobClose') {
    drawRoom(c, t, b.door, st.phase);
    c.fillStyle = 'rgba(0,0,0,.42)';
    c.fillRect(0, 0, W, 380);
    drawDoor(c, 486, 48, 270, 262, '#543625', 0, Math.max(0.08, st.phase));
    c.strokeStyle = '#66736e';
    c.lineWidth = 36;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(184, 360);
    c.lineTo(466, 212);
    c.stroke();
    c.fillStyle = '#e5bd99';
    c.beginPath();
    c.ellipse(485, 204, 31, 25, -0.42, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#bccbd0';
    c.beginPath();
    c.arc(557, 198, 15, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#6f7d83';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(557, 198, 15, -Math.PI * 0.7, Math.PI * 0.38);
    c.stroke();
    return true;
  }
  if (b.shot === 'listenProfile') {
    drawHall(c, t);
    c.fillStyle = 'rgba(0,0,0,.28)';
    c.fillRect(0, 0, W, 380);
    drawDoor(c, 690, 62, 166, 244, '#8a6440', 0.3);
    drawJonasAt(c, 605, 318, 1.55, 'listen', 'bigdoor', t);
    return true;
  }
  if (b.shot === 'watchClose') {
    drawMusicRoom(c, t, b.door, st.phase);
    c.fillStyle = 'rgba(0,0,0,.46)';
    c.fillRect(0, 0, W, 380);
    // Unterarm, Ärmelabschluss, Hand, Armband und stillstehendes Zifferblatt.
    c.strokeStyle = '#617069';
    c.lineWidth = 52;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(160, 372);
    c.lineTo(456, 190);
    c.stroke();
    c.fillStyle = '#e5bd99';
    c.beginPath();
    c.ellipse(492, 174, 40, 30, -0.38, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#26313a';
    c.fillRect(443, 145, 92, 58);
    c.fillStyle = '#d8dde0';
    c.beginPath();
    c.arc(491, 173, 42, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#52606b';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(491, 173, 36, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      c.beginPath();
      c.moveTo(491 + Math.cos(a) * 29, 173 + Math.sin(a) * 29);
      c.lineTo(491 + Math.cos(a) * 34, 173 + Math.sin(a) * 34);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(491, 173);
    c.lineTo(491, 143);
    c.stroke();
    return true;
  }
  if (b.shot === 'deathFace') {
    c.fillStyle = '#241713';
    c.fillRect(0, 0, W, 380);
    // Eine einzige Gesichtsnahaufnahme, Kopf und Schultern füllen den Bildbereich.
    drawDeathAt(c, 480, 420, 2.35, 'scream');
    return true;
  }
  if (b.shot === 'kneelLow') {
    drawMusicRoom(c, t, b.door, st.phase);
    drawJonasAt(c, 350, 360, 1.35, 'kneel', 'woman', t);
    if (b.death !== 'absent') drawDeathAt(c, 590, 350, 0.94, 'close');
    return true;
  }
  if (b.shot === 'doorChoice' || b.shot === 'greenDoor') {
    drawMusicRoom(c, t, b.door, st.phase);
    const green = b.look === 'green' || b.shot === 'greenDoor';
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(0, 0, W, 380);
    drawDoor(c, green ? 620 : 210, 62, 188, 244, green ? '#3f8a59' : '#3e63aa', 0.22, green && b.door !== 'closed' ? st.phase : 0);
    drawJonasAt(c, green ? 430 : 590, 338, 1.2, b.pose === 'walk' ? 'walk' : 'stand', b.look, t);
    return true;
  }
  if (b.shot === 'pianoHands') {
    drawMusicRoom(c, t, b.door, st.phase);
    c.fillStyle = 'rgba(0,0,0,.22)';
    c.fillRect(0, 0, W, 380);
    c.save();
    c.translate(-20, -8);
    c.scale(1.18, 1.18);
    drawPiano(c);
    drawDeathAt(c, 694, 304, 1, 'piano');
    c.restore();
    return true;
  }
  return false;
}

function drawCeiling(c: C, dreamTime = 2) {
  c.fillStyle = "#0a0a0c";
  c.fillRect(0, 0, W, 380);
  const g = c.createRadialGradient(480, 90, 38, 480, 180, 430);
  g.addColorStop(0, "#f1f3f0");
  g.addColorStop(1, "#c9cdc9");
  c.fillStyle = g;
  c.fillRect(80, 22, 800, 336);
  c.fillStyle = "rgba(0,0,0,.10)";
  for (let i = 0; i < 5; i++) c.fillRect(150 + i * 140, 22, 2, 336);
  const open = Math.max(0, Math.min(1, dreamTime / 2));
  if (open < 1) {
    c.fillStyle = `rgba(0,0,0,${1 - open})`;
    c.fillRect(0, 0, W, 380);
  }
}

/** Ruhiger weißer Schlussraum mit einer nur angedeuteten Erinnerungsspur. */
function drawWhiteEnd(c: C, t: number, index: number) {
  c.fillStyle = "#f5f7f3";
  c.fillRect(0, 0, W, 380);
  const g = c.createRadialGradient(480, 190, 40, 480, 190, 440);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.72, "rgba(255,255,255,.45)");
  g.addColorStop(1, "rgba(218,226,220,.12)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, 380);
  // Die letzte Erinnerung bleibt Spur, niemals Bestätigung ihrer Erfüllung.
  const a = 0.18 + 0.1 * Math.sin(t * 0.8 + index);
  c.globalAlpha = a;
  c.strokeStyle = "#b9c9c1";
  c.lineWidth = 10;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(405, 235);
  c.quadraticCurveTo(470, 180, 510, 226);
  c.moveTo(555, 235);
  c.quadraticCurveTo(495, 180, 455, 226);
  c.stroke();
  c.globalAlpha = 1;
}

/** Denkblase mit iriserendem Saum. */
function drawBubble(c: C, cx: number, cy: number, rx: number, ry: number, t: number) {
  const r = Math.max(rx, ry);
  const grad = c.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, r * 0.1, cx, cy, r);
  grad.addColorStop(0, "rgba(255,255,255,.05)");
  grad.addColorStop(0.82, "rgba(210,235,255,.05)");
  grad.addColorStop(1, "rgba(255,255,255,.16)");
  c.fillStyle = grad;
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  // Regenbogenrand
  const cols = ["#ffb3c7", "#ffe6a3", "#b6f0c8", "#a9d8ff", "#d9c2ff"];
  for (let i = 0; i < 5; i++) {
    c.strokeStyle = cols[i];
    c.globalAlpha = 0.5;
    c.lineWidth = 2;
    c.beginPath();
    const a0 = t * 0.15 + (i * Math.PI * 2) / 5;
    c.ellipse(cx, cy, Math.max(1, rx - 2), Math.max(1, ry - 2), 0, a0, a0 + 0.9);
    c.stroke();
  }
  c.globalAlpha = 0.8;
  c.strokeStyle = "rgba(255,255,255,.5)";
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(cx, cy, Math.max(1, rx - 0.8), Math.max(1, ry - 0.8), 0, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 1;
}

/** Vollbildzustand: nur ein schmaler irisierender Blasensaum bleibt stehen. */
function drawBubbleFrame(c: C, t: number) {
  c.save();
  const cols = ['#ffb3c7', '#ffe6a3', '#b6f0c8', '#a9d8ff', '#d9c2ff'];
  for (let i = 0; i < cols.length; i++) {
    c.strokeStyle = cols[i];
    c.globalAlpha = 0.24 + 0.08 * Math.sin(t * 0.8 + i);
    c.lineWidth = 1.2;
    c.strokeRect(IMAGE.x + 2 + i * 0.6, IMAGE.y + 2 + i * 0.6, IMAGE.w - 4 - i * 1.2, IMAGE.h - 4 - i * 1.2);
  }
  c.globalAlpha = 1;
  c.restore();
}

export interface DreamHost {
  audioOk: () => void;
  /** Mund-/Kopfanker der realen Schlafpose in Bühnenkoordinaten. */
  sleepAnchor: () => [number, number];
  onEnd: () => void;
  onWake: () => void;
}

export class Dream {
  private playing = true;
  private time = 0;
  private close = 0;
  private closeMode: "sleep" | "wake" | null = null;
  private terminal = false;
  private audio = new DreamAudio();
  private lastIndex = -1;
  private host: DreamHost;
  private seenFx = new Set<number>();
  /** Canvas-Fokus: portierbare Vorbereitung für Steuerkreuz/Bestätigen. */
  private controlFocus = -1;
  /** Statische Kulissen werden je Ansicht einmal aufgebaut. */
  private sceneCache = new Map<Scene, HTMLCanvasElement>();

  constructor(host: DreamHost) {
    this.host = host;
    this.audio.ensure();
    this.audio.fx("bubble");
    this.audio.resetCursor(0);
    this.host.audioOk();
  }

  get active() {
    return !this.terminal;
  }

  get isOpening() {
    return !this.closeMode && !this.terminal;
  }

  get paused() {
    return !this.playing;
  }

  private clearVoices() {
    this.audio.stopAll();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.audio.suspend();
  }

  resume() {
    if (this.playing) return;
    this.audio.ensure();
    this.audio.resume();
    this.audio.resetCursor(this.time);
    this.playing = true;
  }

  seek(delta: number) {
    this.time = Math.max(0, Math.min(DREAM_LENGTH, this.time + delta));
    this.clearVoices();
    this.audio.resetCursor(this.time);
    // Seek rekonstruiert ein Bild, löst aber keine einmaligen Klopfer,
    // Teleport- oder Türklänge am Ziel künstlich erneut aus.
    this.lastIndex = stateAt(this.time).index;
    this.seenFx.clear();
    this.seenFx.add(this.lastIndex);
    if (this.playing) this.audio.resume();
  }

  update(dt: number) {
    if (this.closeMode) {
      this.close += dt / (this.closeMode === "wake" ? 0.8 : 1.6);
      if (this.close >= 1) {
        const mode = this.closeMode;
        this.terminal = true;
        this.closeMode = null;
        this.clearVoices();
        if (mode === "wake") this.host.onWake();
        else this.host.onEnd();
      }
      return;
    }
    if (this.playing) {
      this.time += dt;
      if (this.time >= DREAM_LENGTH) {
        this.time = DREAM_LENGTH;
        this.endDream(false);
        return;
      }
    }
    const st = stateAt(this.time);
    if (this.playing && st.index !== this.lastIndex) {
      this.lastIndex = st.index;
      const fx = st.beat.fx;
      if (fx && !this.seenFx.has(st.index)) {
        this.seenFx.add(st.index);
        if (fx === "knock1" || fx === "knock2") this.audio.knock(`${st.beat.id}`);
        if (fx === "openGreen") this.audio.fx("door");
      }
    }
    const atmosphere = st.beat.scene === "hall" || st.beat.scene === "white" ? 0 : st.beat.scene === "ceiling" ? 0.25 : 0.45;
    this.audio.frame(this.time, st.piano, st.pianoFrom, atmosphere, !this.playing);
  }

  /** Nächster Text- oder Handlungsbeat (Klick / Enter). */
  nextBeat() {
    const st = stateAt(this.time);
    if (st.index >= B.length - 1) {
      this.endDream(false);
      return;
    }
    this.jumpTo(starts[st.index + 1]);
  }

  private jumpTo(t: number) {
    this.time = Math.max(0, Math.min(DREAM_LENGTH, t));
    this.clearVoices();
    this.audio.resetCursor(this.time);
    this.lastIndex = stateAt(this.time).index;
    this.seenFx.clear();
    this.seenFx.add(this.lastIndex);
    if (this.playing) this.audio.resume();
  }

  destroy() {
    this.audio.close();
    this.sceneCache.clear();
  }

  endDream(wake: boolean) {
    if (this.closeMode || this.terminal) return;
    this.close = 0;
    this.closeMode = wake ? "wake" : "sleep";
    this.audio.stopAll();
  }

  /** Bildregie: Traum im eigenen Bildrechteck, Text und UI bleiben getrennt. */
  draw(c: C, _houseTime: number) {
    // Alles innerhalb der Blase leitet sich ausschließlich aus der Traumzeit ab.
    void _houseTime;
    const t = this.time;
    const shrink = this.closeMode ? 1 - Math.min(1, this.close) : 1;
    const st = stateAt(this.time);
    const p = Math.min(1, Math.max(0, (this.time - 2) / 13));
    const e = p * p * (3 - 2 * p);
    const [sleepX, sleepY] = this.host.sleepAnchor();
    const cx = lerp(sleepX + 18, IMAGE.x + IMAGE.w / 2, e);
    const cy = lerp(sleepY - 20, IMAGE.y + IMAGE.h / 2, e);
    const rx = (16 + e * 470) * (this.closeMode ? Math.max(0.04, shrink) : 1);
    const ry = (14 + e * 202) * (this.closeMode ? Math.max(0.04, shrink) : 1);
    const fullMask = e > 0.96 && !this.closeMode;

    // Bildbereich bleibt ein unabhängiger, deckender Traumviewport.
    c.save();
    c.beginPath();
    c.rect(IMAGE.x, IMAGE.y, IMAGE.w, IMAGE.h);
    c.clip();
    // Hauptblase maskiert die Szene. Bei voller Größe deckt sie den ganzen Bildbereich ab.
    c.save();
    c.beginPath();
    if (fullMask) c.rect(IMAGE.x, IMAGE.y, IMAGE.w, IMAGE.h);
    else c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    c.clip();
    this.drawSceneViewport(c, st, t, e);
    c.restore();
    if (fullMask) drawBubbleFrame(c, t);
    else drawBubble(c, cx, cy, rx, ry, t);
    c.restore();

    // Kleine Verbindungsgedanken zwischen Luni und der Hauptblase.
    if (e < 0.9 && !this.closeMode) {
      for (let i = 0; i < 3; i++) {
        const q = 0.18 + i * 0.2;
        const bx = lerp(sleepX + 6, cx, q);
        const by = lerp(sleepY - 8, cy, q);
        const br = 3 + i * 5;
        c.fillStyle = 'rgba(236,246,255,.9)';
        c.beginPath();
        c.arc(bx, by, br, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,.72)';
        c.lineWidth = 1;
        c.stroke();
      }
    }

    if (this.closeMode) return;
    if (st.beat.kind === 'text' && st.beat.text) this.drawText(c, st.beat, st.into);
    else this.drawActionHint(c);
    if (this.time > 6) this.drawControls(c);
  }

  /**
   * Alte Traumkoordinaten werden unverzerrt in einen breiten Ausschnitt
   * gesetzt. So werden keine Figuren flachgedrückt, und jede Szene bleibt
   * als eigene gezeichnete Einstellung lesbar.
   */
  private drawSceneViewport(c: C, st: ReturnType<typeof stateAt>, t: number, grow: number) {
    // Inhalt und Maske wachsen gemeinsam, statt nur eine fertige Kulisse aufzudecken.
    const s = 0.38 + 0.57 * grow;
    const ox = IMAGE.x + (IMAGE.w - W * s) / 2;
    const oy = IMAGE.y + (IMAGE.h - 380 * s) / 2;
    c.save();
    c.fillStyle = st.beat.scene === 'white' ? '#f5f7f3' : st.beat.scene === 'hall' ? '#180f12' : '#17110f';
    c.fillRect(IMAGE.x, IMAGE.y, IMAGE.w, IMAGE.h);
    c.translate(ox, oy);
    c.scale(s, s);
    const special = drawDetailShot(c, st, t);
    if (!special) {
      const cacheable = st.beat.scene !== 'white' && st.beat.scene !== 'ceiling' && st.beat.door === 'closed';
      if (cacheable) c.drawImage(this.sceneBase(st.beat.scene), 0, 0);
      else if (st.beat.scene === 'ceiling') drawCeiling(c, st.time);
      else if (st.beat.scene === 'room') drawRoom(c, t, st.beat.door, st.phase);
      else if (st.beat.scene === 'hall') drawHall(c, t);
      else if (st.beat.scene === 'music') drawMusicRoom(c, t, st.beat.door, st.phase);
      else drawWhiteEnd(c, t, st.index);

      const beat = st.beat;
      if (beat.scene !== 'white') {
        const deathMode: 'piano' | 'close' | 'scream' = beat.fx === 'teeth' ? 'scream' : beat.look === 'woman' ? 'close' : 'piano';
        if (beat.scene === 'music' && beat.deathActor) {
          const d = beat.deathActor;
          drawDeathAt(c, d.x, d.y, d.scale, beat.fx === 'teeth' ? 'scream' : beat.death === 'piano' ? 'piano' : deathMode);
        }
        const jonas = { ...beat.jonas };
        // Gehen verlagert die Figur wirklich im Raum, nicht nur die Beine.
        if (beat.scene === 'hall' && beat.pose === 'walk') jonas.x = Math.min(760, 118 + st.chapterInto * 48);
        if (beat.scene === 'music' && beat.pose === 'walk') jonas.x = Math.min(760, 430 + st.phase * 310);
        if (beat.scene === 'room' && beat.pose === 'walk') jonas.x = Math.max(250, 430 - st.phase * 180);
        drawJonasAt(c, jonas.x, jonas.y, jonas.scale, beat.pose, beat.look, t);
      }
    }
    this.drawThoughtFragment(c, st.beat.thought, st.into, st.beat.dur);
    c.restore();
  }

  private sceneBase(scene: Scene) {
    const known = this.sceneCache.get(scene);
    if (known) return known;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const cc = cv.getContext('2d');
    if (!cc) throw new Error('2d context unavailable');
    if (scene === 'ceiling') drawCeiling(cc, 2);
    else if (scene === 'room') drawRoom(cc, 0);
    else if (scene === 'hall') drawHall(cc, 0);
    else if (scene === 'music') drawMusicRoom(cc, 0);
    this.sceneCache.set(scene, cv);
    return cv;
  }

  /** Kurze subjektive Erinnerungsbilder, nie neue Handlung. */
  private drawThoughtFragment(c: C, thought: Thought | undefined, into: number, dur: number) {
    if (!thought) return;
    const p = Math.min(1, Math.max(0, into / Math.max(0.01, dur)));
    const alpha = Math.min(1, p * 4, (1 - p) * 4);
    c.save();
    c.globalAlpha = 0.76 * alpha;
    c.fillStyle = 'rgba(232,239,234,.12)';
    c.beginPath();
    c.ellipse(480, 230, 190, 96, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(220,235,228,.36)';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(480, 230, 188, 94, 0, 0, Math.PI * 2);
    c.stroke();
    if (thought === 'weekend') {
      // Unsicherer früherer Morgen: Hand stützt sich am fremden Bett ab.
      c.strokeStyle = '#c5b79f';
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(415, 285);
      c.lineTo(468, 242);
      c.lineTo(510, 260);
      c.stroke();
      c.fillStyle = 'rgba(110,135,151,.55)';
      c.fillRect(390, 276, 180, 28);
    } else if (thought === 'waiting' || thought === 'phone') {
      // Wartende Verpflichtung und verlorene Telefonate.
      c.strokeStyle = '#d7d1be';
      c.lineWidth = 4;
      c.beginPath();
      c.arc(455, 232, 18, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(474, 252);
      c.lineTo(505, 284);
      c.stroke();
      c.strokeStyle = 'rgba(210,230,242,.75)';
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(520, 218);
      c.lineTo(548, 232);
      c.lineTo(528, 260);
      c.stroke();
    } else if (thought === 'embrace') {
      // Letzte Nähe: zwei Hände, die sich nicht halten können.
      c.strokeStyle = '#e9c6ad';
      c.lineWidth = 11;
      c.beginPath();
      c.moveTo(390, 245);
      c.quadraticCurveTo(452, 204, 476, 236);
      c.moveTo(570, 245);
      c.quadraticCurveTo(508, 204, 484, 236);
      c.stroke();
      c.globalAlpha = 0.25 + 0.25 * Math.sin(into * 2);
      c.fillStyle = '#071016';
      c.fillRect(475, 205, 10, 58);
    } else if (thought === 'stars') {
      // Sternenweite als bloße Vorstellung der blauen Tür.
      c.fillStyle = '#091020';
      c.fillRect(335, 150, 290, 160);
      for (let i = 0; i < 30; i++) {
        c.fillStyle = i % 3 ? '#dbe9ff' : '#aab8df';
        c.fillRect(350 + ((i * 47) % 250), 164 + ((i * 29) % 128), 1.4, 1.4);
      }
      c.fillStyle = '#596e98';
      c.beginPath();
      c.arc(540, 248, 36, 0, Math.PI * 2);
      c.fill();
    } else if (thought === 'earth') {
      // Erde / schwache Erinnerungsspur, nicht als tatsächliche Zukunft.
      c.fillStyle = '#1c4161';
      c.beginPath();
      c.arc(482, 230, 55, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#6cae8a';
      c.beginPath();
      c.ellipse(462, 214, 20, 12, -0.4, 0, Math.PI * 2);
      c.ellipse(505, 250, 16, 10, 0.6, 0, Math.PI * 2);
      c.fill();
    } else if (thought === 'pianoSelf') {
      c.fillStyle = '#241c1a';
      c.fillRect(366, 258, 228, 32);
      c.fillStyle = '#f1eee3';
      c.fillRect(386, 258, 176, 8);
      c.strokeStyle = '#c9b795';
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(430, 326);
      c.lineTo(452, 277);
      c.moveTo(534, 326);
      c.lineTo(512, 277);
      c.stroke();
    } else {
      // Verlust: bereits etablierte Erinnerung löst sich in wenigen Fetzen auf.
      c.strokeStyle = 'rgba(232,239,234,.8)';
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(404, 252);
      c.quadraticCurveTo(470, 214, 504, 244);
      c.stroke();
      c.globalAlpha *= 0.35;
      c.fillStyle = '#071016';
      for (let i = 0; i < 9; i++) c.fillRect(400 + i * 18, 206 + (i % 3) * 22, 11, 12);
    }
    c.restore();
  }

  private drawText(c: C, beat: Beat, into: number) {
    c.fillStyle = 'rgba(6,12,16,.94)';
    c.fillRect(TEXT.x, TEXT.y, TEXT.w, TEXT.h);
    c.strokeStyle = 'rgba(242,247,244,.18)';
    c.lineWidth = 1;
    c.strokeRect(TEXT.x + 0.5, TEXT.y + 0.5, TEXT.w - 1, TEXT.h - 1);
    const who = whoLabel(beat.who ?? 'gedanke');
    drawPixelText(c, who.name, TEXT.x + 18, TEXT.y + 14, 1.55, who.tint, 0.8);
    const col = beat.who === 'stimme' ? '#e6dcff' : '#eef7f2';
    const lines = pixelLines(beat.text ?? '', TEXT.w - 36, 2.25, 0.7);
    lines.forEach((line, i) => drawPixelText(c, line, TEXT.x + 18, TEXT.y + 38 + i * 22, 2.25, col, 0.7));
    const frac = Math.min(1, into / beat.dur);
    c.fillStyle = 'rgba(242,247,244,.18)';
    c.fillRect(TEXT.x + 18, TEXT.y + TEXT.h - 10, TEXT.w - 36, 2);
    c.fillStyle = who.tint;
    c.fillRect(TEXT.x + 18, TEXT.y + TEXT.h - 10, (TEXT.w - 36) * frac, 2);
  }

  private drawActionHint(c: C) {
    c.fillStyle = 'rgba(6,12,16,.94)';
    c.fillRect(TEXT.x, TEXT.y, TEXT.w, TEXT.h);
    c.fillStyle = 'rgba(242,247,244,.14)';
    c.fillRect(TEXT.x + 18, TEXT.y + TEXT.h / 2, TEXT.w - 36, 1);
  }

  private controlRects() {
    return [
      { id: 'pause', label: this.playing ? 'PAUSE' : 'WEITER', x: 96, w: 128 },
      { id: 'back', label: '-10 S', x: 240, w: 108 },
      { id: 'fwd', label: '+10 S', x: 364, w: 108 },
      { id: 'end', label: 'BEENDEN', x: 488, w: 164 },
      { id: 'wake', label: 'AUFWACHEN', x: 668, w: 196 },
    ] as const;
  }

  private drawControls(c: C) {
    c.fillStyle = 'rgba(5,9,12,.96)';
    c.fillRect(CONTROLS.x, CONTROLS.y, CONTROLS.w, CONTROLS.h);
    const controls = this.controlRects();
    for (let controlIndex = 0; controlIndex < controls.length; controlIndex++) {
      const it = controls[controlIndex];
      const focused = controlIndex === this.controlFocus;
      c.strokeStyle = 'rgba(242,247,244,.68)';
      c.lineWidth = 1;
      c.strokeRect(it.x + 0.5, CONTROLS.y + 0.5, it.w - 1, CONTROLS.h - 1);
      if (focused) {
        c.strokeStyle = '#ffd36f';
        c.lineWidth = 2;
        c.strokeRect(it.x + 2, CONTROLS.y + 2, it.w - 4, CONTROLS.h - 4);
      }
      const cy = CONTROLS.y + 10;
      if (it.id === 'pause') {
        c.fillStyle = '#f2f7f4';
        if (this.playing) {
          c.fillRect(it.x + 14, cy, 4, 16);
          c.fillRect(it.x + 22, cy, 4, 16);
        } else {
          c.beginPath();
          c.moveTo(it.x + 13, cy);
          c.lineTo(it.x + 28, cy + 8);
          c.lineTo(it.x + 13, cy + 16);
          c.closePath();
          c.fill();
        }
      } else if (it.id === 'back' || it.id === 'fwd') {
        c.fillStyle = '#f2f7f4';
        const d = it.id === 'back' ? -1 : 1;
        c.beginPath();
        c.moveTo(it.x + 20 + d * 9, cy + 1);
        c.lineTo(it.x + 20 - d * 5, cy + 8);
        c.lineTo(it.x + 20 + d * 9, cy + 15);
        c.closePath();
        c.fill();
      } else if (it.id === 'end') {
        c.fillStyle = '#f2f7f4';
        c.fillRect(it.x + 14, cy + 2, 17, 3);
        c.fillRect(it.x + 21, cy + 2, 3, 16);
      } else {
        c.strokeStyle = '#f2f7f4';
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(it.x + 21, cy + 8, 6, 0, Math.PI * 2);
        c.stroke();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          c.beginPath();
          c.moveTo(it.x + 21 + Math.cos(a) * 8, cy + 8 + Math.sin(a) * 8);
          c.lineTo(it.x + 21 + Math.cos(a) * 11, cy + 8 + Math.sin(a) * 11);
          c.stroke();
        }
      }
      drawPixelTextCenter(c, it.label, it.x + it.w / 2 + 13, CONTROLS.y + 14, 1.35, '#eef7f2', 0.5);
    }
  }

  /** Klick/Tipp: Steuerleiste, sonst Text weiter. */
  onDown(x: number, y: number): boolean {
    if (this.closeMode) return true;
    if (this.time > 6 && y >= CONTROLS.y && y <= CONTROLS.y + CONTROLS.h) {
      const controls = this.controlRects();
      const hit = controls.find((b) => x >= b.x && x <= b.x + b.w);
      this.controlFocus = hit ? controls.indexOf(hit) : -1;
      if (hit?.id === "pause") this.togglePause();
      else if (hit?.id === "back") this.seek(-10);
      else if (hit?.id === "fwd") this.seek(10);
      else if (hit?.id === "end") this.endDream(false);
      else if (hit?.id === "wake") this.endDream(true);
      return true;
    }
    // Nur die Textfläche schaltet weiter; Klicks auf die Szene tun nichts.
    if (x >= TEXT.x && x <= TEXT.x + TEXT.w && y >= TEXT.y && y <= TEXT.y + TEXT.h) this.nextBeat();
    return true;
  }

  /** Audiofreigabe durch die nächste Nutzeraktion. */
  unlock() {
    this.audio.ensure();
  }

  onKey(code: string): boolean {
    if (this.closeMode) return true;
    if (code === "Space") {
      this.togglePause();
      return true;
    }
    if (code === 'Tab') {
      this.controlFocus = (this.controlFocus + 1) % this.controlRects().length;
      return true;
    }
    if (code === "Enter") {
      const focused = this.controlRects()[this.controlFocus];
      if (focused) {
        if (focused.id === 'pause') this.togglePause();
        else if (focused.id === 'back') this.seek(-10);
        else if (focused.id === 'fwd') this.seek(10);
        else if (focused.id === 'end') this.endDream(false);
        else this.endDream(true);
        return true;
      }
      this.nextBeat();
      return true;
    }
    if (code === "ArrowLeft") {
      this.seek(-10);
      return true;
    }
    if (code === "ArrowRight") {
      this.seek(10);
      return true;
    }
    if (code === "Escape") {
      this.pause();
      return true;
    }
    return false;
  }

  togglePause() {
    if (this.playing) this.pause();
    else this.resume();
  }

  hover(x: number, y: number) {
    const control = this.time > 6 && this.controlRects().some((b) => x >= b.x && x <= b.x + b.w && y >= CONTROLS.y && y <= CONTROLS.y + CONTROLS.h);
    const text = x >= TEXT.x && x <= TEXT.x + TEXT.w && y >= TEXT.y && y <= TEXT.y + TEXT.h;
    return !this.closeMode && (control || text);
  }
}

/* --------------------------- Schlaf-Z-Partikel --------------------------- */

/** Sporadische Z-Salven aus Lunis Mund, 1–2 % bis 12–18 % der Kopfhöhe. */
export function drawSleepZ(c: C, x: number, y: number, t: number) {
  c.save();
  const cycle = Math.floor(t / 6);
  for (let n = cycle - 1; n <= cycle + 1; n++) {
    const start = n * 6 + rnd(n * 17 + 4) * 2.2;
    const life = 2.4 + rnd(n * 13 + 7) * 1.5;
    const age = t - start;
    if (age < 0 || age > life) continue;
    const count = 3 + Math.floor(rnd(n * 11 + 2) * 3);
    for (let k = 0; k < count; k++) {
      const delay = k * 0.12;
      const q = (age - delay) / life;
      if (q < 0 || q > 1) continue;
      const size = (2.2 + q * 10.5) / 7;
      const bx = x + q * (10 + rnd(n + k * 5) * 13) + Math.sin(q * 3 + k) * 1.4;
      const by = y - q * (22 + rnd(n * 3 + k) * 26) + k * 3;
      c.globalAlpha = Math.sin(q * Math.PI) * 0.82;
      drawPixelText(c, k < 2 ? "z" : "Z", bx, by, size, "#eaf6ff", 0);
    }
  }
  c.globalAlpha = 1;
  c.restore();
}
