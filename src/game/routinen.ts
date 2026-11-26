/* =======================================================================
   ROUTINEN-KATALOG – feste Nummern für kurze Anweisungen im Chat

   Blöcke mit Lücken für Zuwachs (Nummer bleibt dauerhaft stabil):
     1000er Luni – Grundhaltungen, Gang, Mimik, Tanzen, Turnen
     2000er Morgen & Küche (Aufwachen, Bett, Socken, Senseo, Automat, Stopfen, Tee)
     3000er Bad & Abend (Dusche + alle Einzelstriche, Zähne, Brillenwurf, Umziehen, Schlafen)
     4000er Keller, Rauchen, Türen & Müll
     5000er Wohnen, Musik, Gaming & Renovierung
     6000er Hunde (Odin & Apollo)
     7000er Gäste & Wesen (Postbote/Lieferfrosch, Nikolaus, Ruprecht, Atelier, Mons)
     8000er Fertige Ketten
     9000er Eigene Ketten (nur lokal gespeichert, nicht hier)

   Reines Datenmodul: kein DOM, kein fetch, keine Browser-Dienste.
   Speichern (lcp1.studio.ketten) und Kopieren liegen in der React-Schicht.
   ======================================================================= */

import type { LuniState, LuniExpr } from "./luni";
import type { DuschTat } from "./duschprogramm";

/** Wo läuft die Nummer ab? Figur = Luni-Bühne, Haus = Probehaus-Bühne. */
export type RoutinenArt = "figur" | "haus" | "kette";

export interface Routine {
  nummer: number;
  name: string;
  kategorie: string;
  unter: string;
  art: RoutinenArt;
  /** Haus-Befehl (Stations-ID, z. B. "kaffee", "stein_aufsteh"). */
  befehl?: string;
  /** Figuren-Haltung auf der Luni-Bühne. */
  luni?: LuniState;
  /** Mimik dazu (nur Figur). */
  mimik?: LuniExpr;
  /** Einzelne Duschbewegung (läuft auf der Figur-Bühne als Schleife). */
  dusch?: DuschTat;
  /** Kiesel-Farbe je Kategorie (Studio-DOM, nicht Spielwelt). */
  farbe: string;
  /** Zeichen im Stein (sichtbar, nicht nur Hover). */
  symbol: string;
  /** Kurze Erklärung für die Liste. */
  hinweis?: string;
  /** Nur Ketten: Nummern in Reihenfolge. */
  kette?: number[];
  /** Einzelschritt einer internen Hauskette (probeSchritt). */
  ketteKey?: string;
  schritt?: string;
  /** Aufwach-Pose einzeln (probeAufwach). */
  aufwach?: "aufsetzen" | "schieben" | "umsetzen" | "strecken" | "aufstehen";
  /** Gast oder Ereignis sofort auslösen (probeEreignis). */
  ereignis?: string;
  /** Anzeigedauer auf der Figur-Bühne in Sekunden. */
  dauer?: number;
}

const F = {
  luni: "#2f6f6a",
  morgen: "#7b5fb0",
  bad: "#3f8fb5",
  keller: "#6b5a44",
  wohnen: "#b07a3f",
  hunde: "#4f7a3a",
  gaeste: "#a04f5a",
  ketten: "#c9a13a",
} as const;

function r(
  nummer: number,
  name: string,
  kategorie: string,
  unter: string,
  art: RoutinenArt,
  farbe: string,
  symbol: string,
  extra: Partial<Routine> = {},
): Routine {
  return { nummer, name, kategorie, unter, art, farbe, symbol, ...extra };
}

/** Fester Katalog. Neue Einträge nur in Lücken, nie Nummern verschieben. */
export const ROUTINEN: readonly Routine[] = [
  // ---- 1000er Luni: Grund ----
  r(1001, "Stehen", "Luni", "Grundhaltungen", "figur", F.luni, "●", { luni: "idle", mimik: "happy" }),
  r(1002, "Gehen", "Luni", "Grundhaltungen", "figur", F.luni, "➜", { luni: "walk" }),
  r(1003, "Rennen", "Luni", "Grundhaltungen", "figur", F.luni, "≫", { luni: "run" }),
  r(1004, "Umdrehen", "Luni", "Grundhaltungen", "figur", F.luni, "↺", { luni: "turn" }),
  r(1005, "Greifen", "Luni", "Grundhaltungen", "figur", F.luni, "✋", { luni: "act" }),
  r(1006, "Überlegen", "Luni", "Grundhaltungen", "figur", F.luni, "?", { luni: "think", mimik: "think" }),
  r(1007, "Winken", "Luni", "Grundhaltungen", "figur", F.luni, "👋", { luni: "wave" }),
  r(1008, "Strecken", "Luni", "Grundhaltungen", "figur", F.luni, "↕", { luni: "stretch" }),
  r(1009, "Freuen", "Luni", "Grundhaltungen", "figur", F.luni, "♥", { luni: "cheer", mimik: "happy" }),
  r(1010, "Sitzen", "Luni", "Grundhaltungen", "figur", F.luni, "■", { luni: "sit" }),
  r(1011, "Eindösen", "Luni", "Grundhaltungen", "figur", F.luni, "z", { luni: "doze", mimik: "tired" }),
  r(1012, "Liegen", "Luni", "Grundhaltungen", "figur", F.luni, "▬", { luni: "lie", mimik: "sleep" }),
  // ---- 1000er Mimik ----
  r(1021, "Fröhlich", "Luni", "Mimik", "figur", F.luni, "☺", { luni: "idle", mimik: "happy" }),
  r(1022, "Neutral", "Luni", "Mimik", "figur", F.luni, "😐", { luni: "idle", mimik: "neutral" }),
  r(1023, "Grinsen", "Luni", "Mimik", "figur", F.luni, "😁", { luni: "idle", mimik: "grin" }),
  r(1024, "Zwinkern", "Luni", "Mimik", "figur", F.luni, "😉", { luni: "idle", mimik: "wink" }),
  r(1025, "Verliebt", "Luni", "Mimik", "figur", F.luni, "♥", { luni: "idle", mimik: "love" }),
  r(1026, "Singen", "Luni", "Mimik", "figur", F.luni, "♪", { luni: "idle", mimik: "sing" }),
  r(1027, "Nachdenklich", "Luni", "Mimik", "figur", F.luni, "…", { luni: "think", mimik: "think" }),
  r(1028, "Konzentriert", "Luni", "Mimik", "figur", F.luni, "◉", { luni: "idle", mimik: "focus" }),
  r(1029, "Müde", "Luni", "Mimik", "figur", F.luni, "z", { luni: "doze", mimik: "tired" }),
  r(1030, "Schlafen", "Luni", "Mimik", "figur", F.luni, "Z", { luni: "lie", mimik: "sleep" }),
  r(1031, "Überrascht", "Luni", "Mimik", "figur", F.luni, "!", { luni: "idle", mimik: "surprised" }),
  r(1032, "Traurig", "Luni", "Mimik", "figur", F.luni, "☹", { luni: "idle", mimik: "sad" }),
  r(1033, "Genervt", "Luni", "Mimik", "figur", F.luni, "×", { luni: "idle", mimik: "annoyed" }),
  // ---- 1000er Tanzen ----
  r(1041, "Wiegen", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceSway" }),
  r(1042, "Twist", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceTwist" }),
  r(1043, "Disco", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceDisco" }),
  r(1044, "Moonwalk", "Luni", "Tanzen", "figur", F.luni, "☾", { luni: "danceMoonwalk" }),
  r(1045, "Step-Touch", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceStep" }),
  r(1046, "Knie-Rutscher", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceSlide" }),
  r(1047, "Kopfnicken", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceHeadnod" }),
  r(1048, "Fuß tippt", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceTap" }),
  r(1049, "Ein Arm hoch", "Luni", "Tanzen", "figur", F.luni, "↑", { luni: "danceArmUp" }),
  r(1050, "Beide Arme hoch", "Luni", "Tanzen", "figur", F.luni, "⇑", { luni: "danceArmsUp" }),
  r(1051, "Floss", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceFortnite" }),
  r(1052, "Klatschen", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceClap" }),
  r(1053, "Roboter", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceRobot" }),
  r(1054, "Armwelle", "Luni", "Tanzen", "figur", F.luni, "≈", { luni: "danceWave" }),
  r(1055, "Herz", "Luni", "Tanzen", "figur", F.luni, "♥", { luni: "danceHeart" }),
  r(1056, "Schritt-Tanz", "Luni", "Tanzen", "figur", F.luni, "♫", { luni: "danceSchritt" }),
  // ---- 1000er Turnen ----
  r(1061, "Handstand", "Luni", "Turnen", "figur", F.luni, "▽", { luni: "handstand" }),
  r(1062, "Rad", "Luni", "Turnen", "figur", F.luni, "◯", { luni: "cartwheel" }),
  r(1063, "Salto", "Luni", "Turnen", "figur", F.luni, "◎", { luni: "flip" }),
  r(1064, "Spagat", "Luni", "Turnen", "figur", F.luni, "⬔", { luni: "split" }),

  // ---- 2000er Morgen & Küche ----
  r(2001, "Bett ansehen", "Morgen & Küche", "Bett", "haus", F.morgen, "🛏", { befehl: "bett", hinweis: "Luni geht zum Bett." }),
  r(2002, "Aufsteh-Stein", "Morgen & Küche", "Bett", "haus", F.morgen, "☀", { befehl: "stein_aufsteh" }),
  r(2003, "EZ-Aufsteh", "Morgen & Küche", "Bett", "haus", F.morgen, "☀", { befehl: "stein_ezaufsteh" }),
  r(2004, "Socken aus dem Schrank", "Morgen & Küche", "Bett", "haus", F.morgen, "🧦", { befehl: "kleiderschrank", hinweis: "Teil der Morgenkette: Schrank → Bettkante → anziehen." }),
  r(2005, "Weste anziehen", "Morgen & Küche", "Schrank", "haus", F.morgen, "🦺", { ereignis: "weste", hinweis: "Vom Schrank holen, überstreifen, Schrank zu." }),
  r(2006, "Brille holen", "Morgen & Küche", "Schrank", "haus", F.morgen, "👓", { befehl: "brille" }),
  r(2007, "Handy am Bett", "Morgen & Küche", "Bett", "haus", F.morgen, "📱", { befehl: "nachttisch" }),
  r(2008, "Senseo-Kaffee", "Morgen & Küche", "Kaffee", "haus", F.morgen, "☕", { befehl: "kaffee" }),
  r(2009, "Kaffee-Stein", "Morgen & Küche", "Kaffee", "haus", F.morgen, "☕", { befehl: "stein_kaffee" }),
  r(2010, "EZ-Kaffee", "Morgen & Küche", "Kaffee", "haus", F.morgen, "☕", { befehl: "stein_ezkaffee" }),
  r(2011, "Alter Automat", "Morgen & Küche", "Kaffee", "haus", F.morgen, "🫖", { befehl: "kaffee", hinweis: "Je nach Haus: Automat statt Senseo." }),
  r(2012, "Zigaretten stopfen", "Morgen & Küche", "Küche", "haus", F.morgen, "🚬", { befehl: "tabak" }),
  r(2013, "Gesundheitstee", "Morgen & Küche", "Küche", "haus", F.morgen, "🍵", { befehl: "tee" }),
  r(2014, "Hundenäpfe", "Morgen & Küche", "Küche", "haus", F.morgen, "🦴", { befehl: "naepfe" }),
  r(2015, "Kühlschrank", "Morgen & Küche", "Küche", "haus", F.morgen, "❄", { befehl: "kuehlschrank" }),
  r(2016, "Herd", "Morgen & Küche", "Küche", "haus", F.morgen, "🍳", { befehl: "herd" }),
  r(2017, "Esstisch", "Morgen & Küche", "Küche", "haus", F.morgen, "🍽", { befehl: "esstisch" }),

  // ---- 3000er Bad & Abend ----
  r(3001, "Dusche komplett", "Bad & Abend", "Dusche", "haus", F.bad, "🚿", { befehl: "dusche" }),
  r(3011, "Kopf in den Nacken", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "nacken", luni: "wash" }),
  r(3012, "Wasser aus dem Gesicht", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "gesicht", luni: "wash" }),
  r(3013, "Haare nach hinten", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "streifen", luni: "wash" }),
  r(3014, "Wasser auf/zu", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "hahn", luni: "wash" }),
  r(3015, "Flasche greifen", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🧴", { dusch: "greifen", luni: "wash" }),
  r(3016, "Auf die Hand geben", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🧴", { dusch: "auftragen", luni: "wash" }),
  r(3017, "Flasche zurück", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🧴", { dusch: "abstellen", luni: "wash" }),
  r(3018, "Haare oben", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "haare", luni: "wash" }),
  r(3019, "Haare hinten", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "haareHinten", luni: "wash" }),
  r(3020, "Haare seitlich", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "haareSeiten", luni: "wash" }),
  r(3021, "Haare ausspülen", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "kopfAbspuelen", luni: "wash" }),
  r(3022, "Arm links vorn", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "💪", { dusch: "armLinks", luni: "wash" }),
  r(3023, "Arm rechts vorn", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "💪", { dusch: "armRechts", luni: "wash" }),
  r(3024, "Arm links hoch", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "💪", { dusch: "armLinksHoch", luni: "wash" }),
  r(3025, "Arm rechts hoch", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "💪", { dusch: "armRechtsHoch", luni: "wash" }),
  r(3026, "Körper einseifen", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🧼", { dusch: "koerper", luni: "wash" }),
  r(3027, "Knie heben (vorn)", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🦵", { dusch: "knieNah", luni: "wash" }),
  r(3028, "Knie heben (hinten)", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🦵", { dusch: "knieFern", luni: "wash" }),
  r(3029, "Vorgebeugt: Beine", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🦵", { dusch: "beine", luni: "wash" }),
  r(3030, "Arme hoch abspülen", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "armeHoch", luni: "wash" }),
  r(3031, "Körper abspülen", "Bad & Abend", "Dusche einzeln", "figur", F.bad, "🚿", { dusch: "abspuelen", luni: "wash" }),
  r(3051, "Zähne putzen", "Bad & Abend", "Waschbecken", "haus", F.bad, "🪥", { befehl: "spiegelschrank" }),
  r(3052, "Mundwasser", "Bad & Abend", "Waschbecken", "haus", F.bad, "💧", { befehl: "spiegelschrank" }),
  r(3053, "Brillenwurf", "Bad & Abend", "Spiegel", "haus", F.bad, "👓", { befehl: "spiegelschrank", hinweis: "Brille fliegt in den offenen Spiegelschrank." }),
  r(3054, "Haarbürste", "Bad & Abend", "Spiegel", "haus", F.bad, "💇", { befehl: "buerste" }),
  r(3055, "Umziehen", "Bad & Abend", "Abend", "haus", F.bad, "👚", { befehl: "kleiderschrank" }),
  r(3056, "Schlafen gehen", "Bad & Abend", "Abend", "haus", F.bad, "🌙", { befehl: "bett" }),
  r(3057, "Bett-Stein", "Bad & Abend", "Abend", "haus", F.bad, "🌙", { befehl: "stein_bett" }),
  r(3058, "EZ-Bett", "Bad & Abend", "Abend", "haus", F.bad, "🌙", { befehl: "stein_ezbett" }),
  r(3059, "Nachttisch", "Bad & Abend", "Abend", "haus", F.bad, "🛋", { befehl: "nachttisch" }),

  // ---- 4000er Keller, Rauchen, Türen & Müll ----
  r(4001, "Kellertür", "Keller & Türen", "Türen", "haus", F.keller, "🚪", { befehl: "kellertuer" }),
  r(4002, "Krempel-Regale", "Keller & Türen", "Keller", "haus", F.keller, "📦", { befehl: "krempel" }),
  r(4003, "Schleusentür", "Keller & Türen", "Türen", "haus", F.keller, "🚪", { befehl: "zimmertuer" }),
  r(4004, "Jacken & Leinen", "Keller & Türen", "Keller", "haus", F.keller, "🧥", { befehl: "leinen" }),
  r(4005, "Raucherstuhl", "Keller & Türen", "Rauchen", "haus", F.keller, "🪑", { befehl: "raucherstuhl" }),
  r(4006, "Aschenbecher", "Keller & Türen", "Rauchen", "haus", F.keller, "🚬", { befehl: "aschenbecher" }),
  r(4007, "Eimer", "Keller & Türen", "Rauchen", "haus", F.keller, "🪣", { befehl: "eimer" }),
  r(4008, "Tür zum Garten", "Keller & Türen", "Türen", "haus", F.keller, "🌳", { befehl: "aussentuer" }),
  r(4009, "Haustür", "Keller & Türen", "Türen", "haus", F.keller, "🏠", { befehl: "haustuer" }),
  r(4010, "Kellertreppe", "Keller & Türen", "Türen", "haus", F.keller, "🪜", { befehl: "kellertreppe" }),
  r(4011, "Datenkoffer", "Keller & Türen", "Keller", "haus", F.keller, "💼", { befehl: "datenkoffer" }),

  // ---- 5000er Wohnen, Musik, Gaming & Renovierung ----
  r(5001, "Sofa & Fernseher", "Wohnen & Musik", "Wohnen", "haus", F.wohnen, "📺", { befehl: "sofa" }),
  r(5002, "Gaming-Ecke", "Wohnen & Musik", "Gaming", "haus", F.wohnen, "🎮", { befehl: "gaming" }),
  r(5003, "Spiel des Lebens", "Wohnen & Musik", "Gaming", "haus", F.wohnen, "🎲", { befehl: "gol_game" }),
  r(5004, "Spieleregal", "Wohnen & Musik", "Gaming", "haus", F.wohnen, "📚", { befehl: "spielregal" }),
  r(5005, "Klavier", "Wohnen & Musik", "Musik", "haus", F.wohnen, "🎹", { befehl: "klavier" }),
  r(5006, "Saxophon", "Wohnen & Musik", "Musik", "haus", F.wohnen, "🎷", { befehl: "saxophon" }),
  r(5007, "Mikrofon", "Wohnen & Musik", "Musik", "haus", F.wohnen, "🎤", { befehl: "mikrofon" }),
  r(5008, "Plattenspieler", "Wohnen & Musik", "Musik", "haus", F.wohnen, "💿", { befehl: "platten" }),
  r(5009, "Gitarre", "Wohnen & Musik", "Musik", "haus", F.wohnen, "🎸", { befehl: "gitarre" }),
  r(5010, "Kerzen", "Wohnen & Musik", "Wohnen", "haus", F.wohnen, "🕯", { befehl: "kerzen" }),
  r(5011, "Lavalampe", "Wohnen & Musik", "Wohnen", "haus", F.wohnen, "💡", { befehl: "lavalampe" }),
  r(5012, "Teleflauschi", "Wohnen & Musik", "Gaming", "haus", F.wohnen, "👾", { befehl: "flauschi_modul" }),
  r(5013, "Adventskalender", "Wohnen & Musik", "Wohnen", "haus", F.wohnen, "🎄", { befehl: "adventskalender" }),
  r(5014, "Bücherregal", "Wohnen & Musik", "Wohnen", "haus", F.wohnen, "📖", { befehl: "buecher" }),
  r(5015, "Weihnachtskiste", "Wohnen & Musik", "Wohnen", "haus", F.wohnen, "🎁", { befehl: "xmaskiste" }),
  r(5021, "Renovieren: Musikzimmer", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_musikzimmer" }),
  r(5022, "Renovieren: Gaming", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_gaming" }),
  r(5023, "Renovieren: Schlafzimmer", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_schlafzimmer" }),
  r(5024, "Renovieren: Bad", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_badezimmer" }),
  r(5025, "Renovieren: Treppenhaus", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_treppenhaus" }),
  r(5026, "Renovieren: Flur", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_flur" }),
  r(5027, "Renovieren: Wohnzimmer", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_wohnzimmer" }),
  r(5028, "Renovieren: Küche", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_kueche" }),
  r(5029, "Renovieren: Keller", "Wohnen & Musik", "Renovierung", "haus", F.wohnen, "🛠", { befehl: "stein_keller" }),

  // ---- 6000er Hunde ----
  r(6001, "Odin streicheln", "Hunde", "Odin & Apollo", "haus", F.hunde, "🐕", { befehl: "odin" }),
  r(6002, "Apollo streicheln", "Hunde", "Odin & Apollo", "haus", F.hunde, "🐕", { befehl: "apollo" }),
  r(6003, "Füttern: Näpfe", "Hunde", "Versorgung", "haus", F.hunde, "🦴", { befehl: "naepfe" }),
  r(6004, "Auslass: Leinen", "Hunde", "Versorgung", "haus", F.hunde, "🦮", { befehl: "leinen" }),
  r(6005, "Zuruf: Garten", "Hunde", "Rufen", "haus", F.hunde, "📢", { befehl: "aussentuer", hinweis: "Luni ruft vom Garten aus." }),

  // ---- 7000er Gäste & Wesen ----
  r(7001, "Postbote an der Tür", "Gäste & Wesen", "Post", "haus", F.gaeste, "📦", { befehl: "haustuer", hinweis: "Paket liegt vor der Tür, Luni holt es." }),
  r(7002, "Lieferfrosch", "Gäste & Wesen", "Post", "haus", F.gaeste, "🐸", { befehl: "haustuer" }),
  r(7003, "Nikolaus rufen", "Gäste & Wesen", "Nikolaus", "haus", F.gaeste, "🎅", { befehl: "stein_nikolaus" }),
  r(7004, "Nikolaus begrüßen", "Gäste & Wesen", "Nikolaus", "haus", F.gaeste, "🤝", { befehl: "nikolaus_empfang" }),
  r(7005, "Knecht Ruprecht", "Gäste & Wesen", "Nikolaus", "haus", F.gaeste, "🌲", { befehl: "nikolaus_empfang" }),
  r(7006, "Kranz auspacken", "Gäste & Wesen", "Kranz", "haus", F.gaeste, "🌿", { befehl: "stein_kranz" }),
  r(7007, "Atelier-Figuren", "Gäste & Wesen", "Atelier", "haus", F.gaeste, "🎭", { befehl: "haustuer", hinweis: "Vorschau im Figurenatelier." }),
  r(7008, "Luni-Mons", "Gäste & Wesen", "Atelier", "haus", F.gaeste, "👾", { befehl: "sofa", hinweis: "Vorschau im Luni-Mon Studio." }),

  // ---- 8000er Fertige Ketten ----
  r(8001, "Morgenkette", "Fertige Ketten", "Ketten", "kette", F.ketten, "☀", { kette: [2002, 2005, 2103, 2104, 2006, 2009], hinweis: "Aufstehen → Weste → auf die Matratze setzen → Socken anziehen → Brille → Kaffee." }),
  r(8002, "Abendkette", "Fertige Ketten", "Ketten", "kette", F.ketten, "🌙", { kette: [3001, 3053, 3054, 3055, 3057], hinweis: "Dusche → Brillenwurf → Bürste → Umziehen → Bett." }),
  r(8003, "Kaffeekette", "Fertige Ketten", "Ketten", "kette", F.ketten, "☕", { kette: [2008, 2017, 2012], hinweis: "Kaffee → Esstisch → Stopfen." }),
  r(8004, "Nikolausbesuch", "Fertige Ketten", "Ketten", "kette", F.ketten, "🎅", { kette: [7003, 7004, 5012], hinweis: "Rufen → Begrüßen → Teleflauschi." }),
  r(8005, "Postpaket", "Fertige Ketten", "Ketten", "kette", F.ketten, "📦", { kette: [7001, 4009, 4002], hinweis: "Post → Haustür → Keller." }),
];

/* =======================================================================
   EINZELSCHRITTE DER INTERNEN KETTEN
   Jeder Schritt, der bisher nur innerhalb einer Kette lief, bekommt eine
   eigene feste Nummer und ist damit einzeln abspielbar. Die Reihenfolge
   unten legt die Nummer fest (Basis + Platz), Lücken bleiben für Zuwachs.
   ======================================================================= */

export interface ProbeKetteDef {
  key: string;
  titel: string;
  kategorie: string;
  unter: string;
  basis: number;
  farbe: string;
  symbol: string;
  schritte: readonly string[];
}

export const PROBE_KETTEN: readonly ProbeKetteDef[] = [
  {
    key: "socken", titel: "Socken", kategorie: "Morgen & Küche", unter: "Socken einzeln", basis: 2100, farbe: F.morgen, symbol: "🧦",
    schritte: ["zumSchrankSocken", "sockenNehmen", "zumBettSocken", "sockenSetzen", "sockenAnziehen", "sockenAufstehen"],
  },
  {
    key: "kaffee", titel: "Senseo", kategorie: "Morgen & Küche", unter: "Senseo einzeln", basis: 2200, farbe: F.morgen, symbol: "☕",
    schritte: [
      "zumTisch", "stopfen", "zumPausenstuhl", "pauseFenster", "pauseAufstehen", "zurMaschine", "tankNehmen", "zumHahn",
      "hahnAuf", "fuellen", "hahnZu", "zurueckZurMaschine", "tankEinsetzen", "zumSchrank", "schrankAuf", "doseNehmen",
      "zurMaschine2", "doseAbstellen", "doseAuf", "deckelAuf", "padRaus", "zumMuell", "muellAuf", "padWeg", "muellZu",
      "zurMaschine3", "padNehmen", "padEinlegen", "deckelZu", "doseZu", "zumSchrank2", "doseZurueck", "tasseHolen",
      "zurMaschine4", "tasseUnter", "power", "zumSchrank3", "schrankZu", "zurMaschine5", "aufheizen", "zurMaschine6",
      "knopfLinks", "vibrierZurueck1", "vibrierZurueck2", "vibrierZurueck3", "vibrierAnstarren", "beimBruehen",
      "durchlaufen", "zurMaschine7", "tasseRaus", "tasseAbstellen", "zumKuehl", "kuehlAuf", "milchNehmen", "kuehlZu",
      "zurTasse", "eingiessen", "zumKuehl2", "kuehlAuf2", "milchZurueck", "kuehlZu2", "zurTasse2", "tasseNehmen",
      "kaffeeSchluck", "kurzWarten", "zurGartentuer", "gartentuerAuf", "zumRaucherraum", "tasseKeller", "rauchen",
      "zumTischchen", "tassenHolen", "zurSpuele", "spuelHahnAuf", "ausspuelen", "spuelHahnZu", "nebenSpuele",
      "tuerFuerHunde", "hundeRufen", "gartentuerZu", "schleuseMerken",
    ],
  },
  {
    key: "automat", titel: "Automat", kategorie: "Morgen & Küche", unter: "Automat einzeln", basis: 2400, farbe: F.morgen, symbol: "🫖",
    schritte: [
      "zumSchrank", "schrankAuf", "tasseHolen", "schrankZu", "zumAutomat", "tasseUnter", "knopf",
      "stopfenAufstehen", "zurSeite", "aufVibrationWarten", "schrittZurueck1", "schrittZurueck2", "blickZurMaschine",
      "zuschauen", "zumAutomat2", "tasseRaus", "zurTasse", "zoegern", "schluck", "angeekelt",
      "durchatmen", "schluck2", "traurig", "kameraSchulterzucken",
      "zumGartentuer", "gartentuerAuf", "zumRaucherraum", "tasseKeller", "rauchen", "zumTischchen", "tassenHolen", "tasseWeg", "zurSpuele",
      "spuelHahnAuf", "ausspuelen", "spuelHahnZu", "nebenSpuele", "fertig",
    ],
  },
  {
    key: "tee", titel: "Tee", kategorie: "Morgen & Küche", unter: "Tee einzeln", basis: 2500, farbe: F.morgen, symbol: "🍵",
    schritte: ["schrankAuf", "schrankZu", "zurKanne", "kanneNehmen", "kanneRein", "zumSchrank", "kanneHolen", "kanneAbstellen", "tee"],
  },
  {
    key: "morgen", titel: "Am Bett", kategorie: "Morgen & Küche", unter: "Handy & Brille einzeln", basis: 2600, farbe: F.morgen, symbol: "📱",
    schritte: ["zumKopfende", "handyNehmen", "zumNachttisch", "handyAblegen", "brilleNehmen", "brilleAufsetzen"],
  },
  {
    key: "zaehne", titel: "Zähne & Brille", kategorie: "Bad & Abend", unter: "Zähne & Wurf einzeln", basis: 2700, farbe: F.bad, symbol: "🪥",
    schritte: [
      "zumBadZaehne", "zahnZumBecken", "zPutzen", "zGurgeln", "zSpucken", "zHahnAuf", "zWaschen", "zHahnZu",
      "zHandWasser", "zMundSpuelen", "zMundSpucken", "zahnFertig", "brilleAb", "spiegelAuf", "rueckenZumSchrank",
      "brilleWerfen", "schritt1ZurDusche", "schritt1Halten", "schritt2ZurDusche", "schritt2Halten",
      "schritt3ZurDusche", "schritt3Halten", "wurfLandet", "spiegelZu",
    ],
  },
];

/** Deutsche Namen für die Schritt-Kennungen der Hausketten. */
const SCHRITT_NAMEN: Record<string, string> = {
  zumSchrankSocken: "Zum Schrank", sockenNehmen: "Socken nehmen", zumBettSocken: "Zum Bett",
  sockenSetzen: "Auf die Bettkante setzen", sockenAnziehen: "Socken anziehen", sockenAufstehen: "Aufstehen",
  zumTisch: "Zum Küchentisch", stopfen: "Zigaretten stopfen", zumPausenstuhl: "Zum Pausenstuhl",
  pauseFenster: "Pause am Fenster", pauseAufstehen: "Vom Stuhl aufstehen", zurMaschine: "Zur Maschine",
  tankNehmen: "Wassertank nehmen", zumHahn: "Zum Wasserhahn", hahnAuf: "Hahn auf", fuellen: "Tank füllen",
  hahnZu: "Hahn zu", zurueckZurMaschine: "Zurück zur Maschine", tankEinsetzen: "Tank einsetzen",
  zumSchrank: "Zum Küchenschrank", schrankAuf: "Schrank auf", doseNehmen: "Paddose nehmen",
  doseAbstellen: "Dose abstellen", doseAuf: "Dose auf", deckelAuf: "Maschinendeckel auf", padRaus: "Altes Pad heraus",
  zumMuell: "Zum Mülleimer", muellAuf: "Mülleimer auf", padWeg: "Pad wegwerfen", muellZu: "Mülleimer zu",
  padNehmen: "Neues Pad nehmen", padEinlegen: "Pad einlegen", deckelZu: "Deckel zu", doseZu: "Dose zu",
  doseZurueck: "Dose zurück", tasseHolen: "Tasse holen", tasseUnter: "Tasse unterstellen", power: "Einschalten",
  schrankZu: "Schrank zu", aufheizen: "Aufheizen warten", knopfLinks: "Knopf drücken",
  vibrierZurueck1: "Schritt zurück 1", vibrierZurueck2: "Schritt zurück 2", vibrierZurueck3: "Schritt zurück 3",
  vibrierAnstarren: "Maschine anstarren", beimBruehen: "Beim Brühen stehen", durchlaufen: "Durchlaufen lassen",
  tasseRaus: "Tasse heraus", tasseAbstellen: "Tasse abstellen", zumKuehl: "Zum Kühlschrank", kuehlAuf: "Kühlschrank auf",
  milchNehmen: "Milch nehmen", kuehlZu: "Kühlschrank zu", zurTasse: "Zur Tasse", eingiessen: "Milch eingießen",
  milchZurueck: "Milch zurück", tasseNehmen: "Tasse nehmen", kaffeeSchluck: "Erster Schluck", kurzWarten: "Kurz warten",
  zurGartentuer: "Zur Gartentür", gartentuerAuf: "Gartentür auf", zumRaucherraum: "In den Raucherraum",
  tasseKeller: "Tasse absetzen", rauchen: "Rauchen", zumTischchen: "Zum Tischchen", tassenHolen: "Tassen holen",
  zurSpuele: "Zur Spüle", spuelHahnAuf: "Spülhahn auf", ausspuelen: "Tasse ausspülen", spuelHahnZu: "Spülhahn zu",
  nebenSpuele: "Tasse neben die Spüle", tuerFuerHunde: "Tür für die Hunde", hundeRufen: "Hunde rufen",
  gartentuerZu: "Gartentür zu", schleuseMerken: "Schleuse merken", zumAutomat: "Zum Automaten", knopf: "Knopf drücken",
  stopfenAufstehen: "Vom Tisch aufstehen", zurSeite: "Links neben Automat",
  aufVibrationWarten: "Auf Vibration warten", schrittZurueck1: "Schritt zurück 1",
  schrittZurueck2: "Schritt zurück 2", blickZurMaschine: "Skeptisch schauen",
  zuschauen: "Zuschauen", zoegern: "Zögern", schluck: "Erster Schluck",
  angeekelt: "Angeekelt", traurig: "Traurig", durchatmen: "Durchatmen",
  schluck2: "Zweiter Schluck", kameraSchulterzucken: "Schulterzucken zur Kamera", tasseWeg: "Tasse wegstellen", fertig: "Fertig",
  zurKanne: "Zur Teekanne", kanneNehmen: "Kanne nehmen", kanneRein: "Kanne in den Schrank",
  kanneHolen: "Kanne holen", kanneAbstellen: "Kanne abstellen", tee: "Tee aufgießen",
  zumKopfende: "Zum Kopfende", handyNehmen: "Handy nehmen", zumNachttisch: "Zum Nachttisch",
  handyAblegen: "Handy ablegen", brilleNehmen: "Brille nehmen", brilleAufsetzen: "Brille aufsetzen",
  zumBadZaehne: "Ins Bad", zahnZumBecken: "Ans Becken", zPutzen: "Zähne putzen", zGurgeln: "Gurgeln",
  zSpucken: "Ausspucken", zHahnAuf: "Hahn auf", zWaschen: "Bürste waschen", zHahnZu: "Hahn zu",
  zHandWasser: "Wasser in die Hand", zMundSpuelen: "Mund spülen", zMundSpucken: "Mund ausspucken",
  zahnFertig: "Schrank schließen", brilleAb: "Brille abnehmen", spiegelAuf: "Spiegelschrank auf",
  rueckenZumSchrank: "Rücken zum Schrank", brilleWerfen: "Brille werfen", wurfLandet: "Wurf landet",
  spiegelZu: "Spiegelschrank zu", schritt1ZurDusche: "Schritt 1 zur Dusche", schritt1Halten: "Schritt 1 halten",
  schritt2ZurDusche: "Schritt 2 zur Dusche", schritt2Halten: "Schritt 2 halten",
  schritt3ZurDusche: "Schritt 3 zur Dusche", schritt3Halten: "Schritt 3 halten",
};

/** Aus camelCase einen lesbaren Namen machen, falls keine Übersetzung hinterlegt ist. */
export function schrittName(was: string): string {
  return SCHRITT_NAMEN[was] ?? was.replace(/([a-zäöü])([A-Z0-9])/g, "$1 $2").replace(/^z /, "Zähne: ");
}

/** Aufwach-Posen einzeln (Block 2300). */
export const AUFWACH: readonly Routine[] = [
  r(2301, "Aufsetzen", "Morgen & Küche", "Aufwachen einzeln", "haus", F.morgen, "🛏", { aufwach: "aufsetzen", dauer: 2.2 }),
  r(2302, "Decke schieben", "Morgen & Küche", "Aufwachen einzeln", "haus", F.morgen, "🛏", { aufwach: "schieben", dauer: 1.7 }),
  r(2303, "Beine umsetzen", "Morgen & Küche", "Aufwachen einzeln", "haus", F.morgen, "🛏", { aufwach: "umsetzen", dauer: 1.6 }),
  r(2304, "Recken & Gähnen", "Morgen & Küche", "Aufwachen einzeln", "haus", F.morgen, "🥱", { aufwach: "strecken", dauer: 3.4 }),
  r(2305, "Aufstehen", "Morgen & Küche", "Aufwachen einzeln", "haus", F.morgen, "🧍", { aufwach: "aufstehen", dauer: 1.5 }),
];

/** Dusch-Phasen im Haus und Gäste sofort (Block 3100 / 7100). */
export const EREIGNISSE: readonly Routine[] = [
  r(3101, "Dusche: Nass werden", "Bad & Abend", "Dusche im Haus", "haus", F.bad, "🚿", { ereignis: "nasswerden" }),
  r(3102, "Dusche: Haare waschen", "Bad & Abend", "Dusche im Haus", "haus", F.bad, "🧴", { ereignis: "washHair" }),
  r(3103, "Dusche: Körper waschen", "Bad & Abend", "Dusche im Haus", "haus", F.bad, "🧼", { ereignis: "washBody" }),
  r(3104, "Dusche: Abspülen", "Bad & Abend", "Dusche im Haus", "haus", F.bad, "🚿", { ereignis: "rinse" }),
  r(7101, "Postbote kommt sofort", "Gäste & Wesen", "Sofort auslösen", "haus", F.gaeste, "📯", { ereignis: "post" }),
  r(7102, "Nikolaus kommt sofort", "Gäste & Wesen", "Sofort auslösen", "haus", F.gaeste, "🎅", { ereignis: "nikolaus" }),
  r(7103, "Kranzpaket sofort", "Gäste & Wesen", "Sofort auslösen", "haus", F.gaeste, "🌿", { ereignis: "kranz" }),
  r(7104, "Hunde füttern sofort", "Hunde", "Versorgung", "haus", F.hunde, "🍖", { ereignis: "hundefuettern" }),
];

/**
 * Alle Einzelschritte einer Kette als eigene Nummern.
 * `gefunden` kommt vom echten Probehaus (probeSchritte) – so erscheint auch
 * jeder Schritt, der hier noch nicht eingetragen ist.
 */
export function kettenBausteine(def: ProbeKetteDef, gefunden: readonly string[]): Routine[] {
  const liste: Routine[] = [];
  def.schritte.forEach((was, i) => {
    liste.push(r(def.basis + i, `${def.titel}: ${schrittName(was)}`, def.kategorie, def.unter, "haus", def.farbe, def.symbol, {
      ketteKey: def.key, schritt: was, hinweis: `Einzelschritt „${was}“ aus der ${def.titel}-Kette.`,
    }));
  });
  const bekannt = new Set(def.schritte);
  gefunden.filter((w) => !bekannt.has(w)).slice(0, 18).forEach((was, i) => {
    liste.push(r(def.basis + 80 + i, `${def.titel}: ${schrittName(was)}`, def.kategorie, def.unter, "haus", def.farbe, def.symbol, {
      ketteKey: def.key, schritt: was, hinweis: `Zusätzlicher Schritt „${was}“, live aus dem Haus gelesen.`,
    }));
  });
  return liste;
}

/** Grundliste ohne die live gelesenen Kettenschritte. */
export function basisRoutinen(): Routine[] {
  const alle = [...ROUTINEN, ...AUFWACH, ...EREIGNISSE];
  for (const def of PROBE_KETTEN) alle.push(...kettenBausteine(def, []));
  return alle.sort((a, b) => a.nummer - b.nummer);
}

/** Kategorien in fester Reihenfolge für die rechte Übersicht. */
export function routinenKategorien(liste: readonly Routine[]): { kategorie: string; eintraege: Routine[] }[] {
  const reihenfolge = ["Luni", "Morgen & Küche", "Bad & Abend", "Keller & Türen", "Wohnen & Musik", "Hunde", "Gäste & Wesen", "Fertige Ketten"];
  const gruppen = new Map<string, Routine[]>();
  for (const e of liste) {
    const arr = gruppen.get(e.kategorie) ?? [];
    arr.push(e);
    gruppen.set(e.kategorie, arr);
  }
  return reihenfolge.filter((k) => gruppen.has(k)).map((k) => ({ kategorie: k, eintraege: gruppen.get(k) ?? [] }));
}

/** Ein Schritt der Kettenleiste: Nummer, eigenes Tempo, Pause danach. */
export interface KettenGlied {
  n: number;
  tempo?: number;
  pause?: number;
}

/** Kurzcode: KETTE [Name]: 2001 > 2015@0.5 > +2s > 3018 */
export function ketteKurzcode(name: string, glieder: readonly KettenGlied[]): string {
  const sauber = name.trim() || "Ohne Namen";
  const teile: string[] = [];
  for (const g of glieder) {
    teile.push(g.tempo && g.tempo !== 1 ? `${g.n}@${g.tempo}` : String(g.n));
    if (g.pause && g.pause > 0) teile.push(`+${g.pause}s`);
  }
  return `KETTE [${sauber}]: ${teile.join(" > ")}`;
}

/** Kurzcode zurücklesen (tolerant: Komma, Pfeil, Leerzeichen, @Tempo, +Pause). */
export function ketteAusKurzcode(text: string, bekannt: ReadonlySet<number>): KettenGlied[] {
  const teil = text.includes(":") ? text.split(":").slice(1).join(":") : text;
  const glieder: KettenGlied[] = [];
  for (const roh of teil.split(/[>,;]+/)) {
    const stueck = roh.trim();
    if (!stueck) continue;
    const pause = stueck.match(/^\+?\s*(\d+(?:\.\d+)?)\s*s$/i);
    if (pause && glieder.length) {
      glieder[glieder.length - 1].pause = Number(pause[1]);
      continue;
    }
    const m = stueck.match(/(\d{3,4})(?:\s*@\s*(\d+(?:\.\d+)?))?/);
    if (!m) continue;
    const n = Number(m[1]);
    if (!bekannt.has(n)) continue;
    glieder.push({ n, tempo: m[2] ? Number(m[2]) : 1 });
  }
  return glieder;
}
