/** Tanzparam-Registry: gemeinsamer Parameter-Zustand für das Tanzstudio
 *  und die Tanzposen des Spiels. Rein datengetrieben, keine Browser-/Canvas-
 *  Abhängigkeit – die GUI liest und schreibt hier live. */

/** Tanz-Parameter (nur jene, die die Tanzposen wirklich bewegen). */
export interface TanzParams {
  /** 0.4..2 — Geschwindigkeit des Liedes in der Tanzfigur (1 = 120 BPM). */
  speed: number;
  /** 0..1.5 — Kopf nickt mit. */
  nod: number;
  /** 0..2 — Hüftbounce-Amplitude. */
  bounce: number;
  /** 0..1.5 — Seitliche Hip-Wiegen-Stärke. */
  sway: number;
  /** 0..1.5 — Arm weit nach oben. */
  armUp: number;
  /** 0..1.5 — Schritt-Amplitude (Beine). */
  legs: number;
  /** Zeigefinger hoch zur Decke. */
  finger: boolean;
}

export const TANZ_PARAM_DEFAULT: TanzParams = {
  speed: 1, nod: 1, bounce: 1, sway: 1, armUp: 1, legs: 1, finger: false,
};

/** Tanz-Kategorien für die Gruppierung im Studio. */
export type TanzGruppe = "Auf der Stelle" | "Mit Schritten" | "Specials";

export interface TanzMove {
  key: string;
  label: string;
  /** Base-LuniState, aus dem die Pose gezeichnet wird. */
  base: string;
  /** Kategorie, in der der Tanz im Studio einsortiert ist. */
  gruppe: TanzGruppe;
  /** Kurzer, einzeiliger Beschreibungstext. */
  text: string;
  params: TanzParams;
  /** Nur im Studio angelegtes custom Move (darf entfernt werden). */
  custom?: boolean;
}

const P = (p: Partial<TanzParams>): TanzParams => ({ ...TANZ_PARAM_DEFAULT, ...p });

const BASE_PARAMS: Record<string, TanzParams> = {
  danceSway:     P({ nod: 0.9, bounce: 1.0, sway: 1.0, armUp: 0.9, legs: 0.9 }),
  danceTwist:    P({ nod: 0.8, bounce: 1.2, sway: 1.3, armUp: 0.8, legs: 1.0 }),
  danceHeadnod:  P({ nod: 1.4, bounce: 0.8, sway: 1.0, armUp: 0.6, legs: 1.0 }),
  danceTap:      P({ nod: 0.7, bounce: 1.3, sway: 1.0, armUp: 0.7, legs: 1.4 }),
  danceArmUp:    P({ nod: 0.7, bounce: 1.1, sway: 1.2, armUp: 1.3, legs: 0.9 }),
  danceArmsUp:   P({ nod: 0.9, bounce: 1.2, sway: 1.0, armUp: 1.2, legs: 0.9 }),
  danceFortnite: P({ nod: 0.8, bounce: 1.2, sway: 1.5, armUp: 0.3, legs: 1.3 }),
  danceClap:     P({ nod: 1.0, bounce: 1.3, sway: 0.9, armUp: 1.0, legs: 0.8 }),
  danceRobot:    P({ nod: 1.1, bounce: 0.9, sway: 0.9, armUp: 1.0, legs: 0.7 }),
  danceWave:     P({ nod: 0.8, bounce: 1.0, sway: 1.1, armUp: 1.2, legs: 0.8 }),
  danceHeart:    P({ nod: 1.0, bounce: 1.0, sway: 1.0, armUp: 1.2, legs: 0.8 }),
  danceSchritt:  P({ nod: 1.0, bounce: 1.0, sway: 1.0, armUp: 1.0, legs: 1.2, finger: true }),
  danceStep:     P({ nod: 0.8, bounce: 1.0, sway: 1.1, armUp: 0.9, legs: 1.2 }),
  danceMoonwalk: P({ speed: 0.9, nod: 0.7, bounce: 0.8, sway: 0.9, armUp: 0.8, legs: 1.1 }),
  danceGlide:    P({ nod: 0.7, bounce: 1.1, sway: 1.0, armUp: 0.8, legs: 1.2 }),
  danceDisco:    P({ nod: 0.8, bounce: 1.2, sway: 1.0, armUp: 1.1, legs: 1.0 }),
  danceSlide:    P({ nod: 0.7, bounce: 0.6, sway: 1.2, armUp: 1.2, legs: 0.5 }),
};

export const TANZ_MOVES: TanzMove[] = [
  // --- Auf der Stelle ---
  { key: "danceSway",     label: "Wiegen",        base: "danceSway",     gruppe: "Auf der Stelle", text: "Gewicht pendelt von Bein zu Bein, die Hände schwingen vor der Brust.", params: { ...BASE_PARAMS.danceSway } },
  { key: "danceTwist",    label: "Twist",         base: "danceTwist",    gruppe: "Auf der Stelle", text: "Füße bleiben stehen, Hüfte und Knie schwingen, Fäuste gehen dagegen.", params: { ...BASE_PARAMS.danceTwist } },
  { key: "danceHeadnod",  label: "Kopfnicken",    base: "danceHeadnod",  gruppe: "Auf der Stelle", text: "Der Kopf nickt genau auf den Schlag, die Knie federn mit.", params: { ...BASE_PARAMS.danceHeadnod } },
  { key: "danceTap",      label: "Fuß tippt",     base: "danceTap",      gruppe: "Auf der Stelle", text: "Hände in den Hüften, die Ferse steht – nur die Zehen tippen.", params: { ...BASE_PARAMS.danceTap } },
  { key: "danceArmUp",    label: "Ein Arm hoch",  base: "danceArmUp",    gruppe: "Auf der Stelle", text: "Eine Faust pumpt im Takt nach oben.", params: { ...BASE_PARAMS.danceArmUp } },
  { key: "danceArmsUp",   label: "Beide Arme hoch", base: "danceArmsUp", gruppe: "Auf der Stelle", text: "Beide Arme im weiten V, sie winken von Seite zu Seite.", params: { ...BASE_PARAMS.danceArmsUp } },
  { key: "danceFortnite", label: "Floss",         base: "danceFortnite", gruppe: "Auf der Stelle", text: "Der Floss: gestreckte Arme schwingen vor und hinter dem Körper.", params: { ...BASE_PARAMS.danceFortnite } },
  { key: "danceClap",     label: "Klatschen",     base: "danceClap",     gruppe: "Auf der Stelle", text: "Ober- und Unterarme schwingen auf, Hände treffen sich auf den Schlag.", params: { ...BASE_PARAMS.danceClap } },
  { key: "danceRobot",    label: "Roboter",       base: "danceRobot",    gruppe: "Auf der Stelle", text: "Unterarme rucken im rechten Winkel hart um und rasten ein.", params: { ...BASE_PARAMS.danceRobot } },
  { key: "danceWave",     label: "Armwelle",      base: "danceWave",     gruppe: "Auf der Stelle", text: "Eine Welle läuft von Hand zu Hand durch beide Arme.", params: { ...BASE_PARAMS.danceWave } },
  { key: "danceHeart",    label: "Herz",          base: "danceHeart",    gruppe: "Auf der Stelle", text: "Beide Hände auf dem Herzen, verträumtes Wiegen im Herzschlag.", params: { ...BASE_PARAMS.danceHeart } },
  // --- Mit Schritten ---
  { key: "danceSchritt",  label: "Schritt-Tanz",  base: "danceSchritt",  gruppe: "Mit Schritten", text: "Ein Schritt je Schlag, der Finger zeigt zur Decke.", params: { ...BASE_PARAMS.danceSchritt } },
  { key: "danceStep",     label: "Step-Touch",    base: "danceStep",     gruppe: "Mit Schritten", text: "Gewicht zur Seite, der freie Fuß tippt daneben auf.", params: { ...BASE_PARAMS.danceStep } },
  { key: "danceMoonwalk", label: "Moonwalk",      base: "danceMoonwalk", gruppe: "Mit Schritten", text: "Ein Fuß steht auf der Zehe, der andere gleitet weich zurück.", params: { ...BASE_PARAMS.danceMoonwalk } },
  { key: "danceGlide",    label: "Gleiten",       base: "danceGlide",    gruppe: "Mit Schritten", text: "Wippende, langsame Tanzschritte.", params: { ...BASE_PARAMS.danceGlide } },
  // --- Specials ---
  { key: "danceDisco",    label: "Disco",         base: "danceDisco",    gruppe: "Specials", text: "Saturday Night Fever: Finger nach oben, Hand in die Hüfte.", params: { ...BASE_PARAMS.danceDisco } },
  { key: "danceSlide",    label: "Knie-Rutscher", base: "danceSlide",    gruppe: "Specials", text: "Torjubel auf beiden Knien, die Fäuste pumpen im weiten V.", params: { ...BASE_PARAMS.danceSlide } },
];

/** Die feste Reihenfolge der Kategorien im Studio. */
export const TANZ_GRUPPEN: readonly TanzGruppe[] = ["Auf der Stelle", "Mit Schritten", "Specials"];

/** Params für eine Dance-State — Merge deckt fehlende Einträge ab. */
export function tanzParamsFor(state: string): TanzParams {
  const move = TANZ_MOVES.find((m) => m.base === state);
  return move ? move.params : { ...TANZ_PARAM_DEFAULT };
}

export function setTanzParams(key: string, patch: Partial<TanzParams>) {
  const move = TANZ_MOVES.find((m) => m.key === key);
  if (!move) return;
  move.params = { ...move.params, ...patch };
}

export function addTanzMove(label: string, base: string, params: Partial<TanzParams> = {}): string {
  const key = "tanz-custom-" + Math.random().toString(36).slice(2, 8);
  TANZ_MOVES.push({
    key,
    label: label.trim() || "Neuer Tanz",
    base,
    gruppe: "Specials",
    text: "Eigener Tanz aus dem Studio.",
    params: { ...TANZ_PARAM_DEFAULT, ...(BASE_PARAMS[base] ?? {}), ...params },
    custom: true,
  });
  return key;
}

export function removeTanzMove(key: string) {
  const i = TANZ_MOVES.findIndex((m) => m.key === key);
  if (i < 0) return;
  if (!TANZ_MOVES[i].custom) return; // Build-Tanzmoves darf man nicht entfernen
  TANZ_MOVES.splice(i, 1);
}

/** Gibt die komplette Liste aller Moves (Build + custom) zurück. */
export function allTanzMoves(): TanzMove[] {
  return TANZ_MOVES.slice();
}
