/* =======================================================================
   Editor für Figuren-Gelenke (Luni-Studio)

   Hält die „übernommenen“ Verschiebungen (Delta je Gelenk) für Luni und
   den Lieferfrosch. Speicherung als Schlüssel/Wert (SD-Karten-fähig),
   getrennt je Figur und Pose. Kein React; außer localStorage keine
   Browser-Spezialität – dieselbe Struktur lässt sich 1:1 auf die Wii
   übertragen.
   ======================================================================= */

import { methanPunkte, type MethanPose } from "./lieferfrosch";
import { luniPunkte, type LuniState } from "./luni";

export type EditorFigur = "luni" | "frosch";

/** Gelenke, die der Editor anbietet. Luni und Frosch teilen dieselben Namen. */
export type EditorGelenk =
  | "handFar"
  | "handNear"
  | "elbowFar"
  | "elbowNear"
  | "footFar"
  | "footNear"
  | "kneeFar"
  | "kneeNear"
  | "head";

export const EDITOR_GLENK_LABEL: Record<EditorGelenk, string> = {
  handFar: "Hand hinten",
  handNear: "Hand vorn",
  elbowFar: "Ellbogen hinten",
  elbowNear: "Ellbogen vorn",
  footFar: "Fuß hinten",
  footNear: "Fuß vorn",
  kneeFar: "Knie hinten",
  kneeNear: "Knie vorn",
  head: "Kopf",
};

export const EDITOR_GLENKE: EditorGelenk[] = [
  "head",
  "handNear",
  "handFar",
  "elbowNear",
  "elbowFar",
  "footNear",
  "footFar",
  "kneeNear",
  "kneeFar",
];

export type EditorDelta = Partial<Record<EditorGelenk, [number, number]>>;
export type EditorPosen = Record<string, EditorDelta>;

/** Übernommene Positionen: { luni: { pose: { gelenk: [dx, dy] } }, frosch: {...} } */
export type EditorStand = Record<EditorFigur, EditorPosen>;

const SCHLUESSEL = "lcp1.studio.editor";

export function leerenEditorStand(): EditorStand {
  return { luni: {}, frosch: {} };
}

function sichern(stand: EditorStand) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
  } catch {
    /* Speicher nicht verfügbar (z. B. privater Modus) – Stand bleibt im Speicher. */
  }
}

export function ladeEditorStand(): EditorStand {
  try {
    if (typeof localStorage === "undefined") return leerenEditorStand();
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return leerenEditorStand();
    const p = JSON.parse(roh) as Partial<EditorStand>;
    return { luni: p.luni ?? {}, frosch: p.frosch ?? {} };
  } catch {
    return leerenEditorStand();
  }
}

/** Übernimmt die Deltas einer Pose dauerhaft (Schlüssel/Wert). */
export function uebernehmen(stand: EditorStand, figur: EditorFigur, pose: string, delta: EditorDelta): EditorStand {
  const naechster: EditorStand = { ...stand, [figur]: { ...stand[figur], [pose]: runde(delta) } };
  sichern(naechster);
  return naechster;
}

export function zuruecksetzen(stand: EditorStand, figur: EditorFigur, pose: string): EditorStand {
  const posen = { ...stand[figur] };
  delete posen[pose];
  const naechster: EditorStand = { ...stand, [figur]: posen };
  sichern(naechster);
  return naechster;
}

function runde(delta: EditorDelta): EditorDelta {
  const out: EditorDelta = {};
  for (const k of EDITOR_GLENKE) {
    const v = delta[k];
    if (v && (Math.abs(v[0]) > 0.01 || Math.abs(v[1]) > 0.01)) out[k] = [Math.round(v[0] * 10) / 10, Math.round(v[1] * 10) / 10];
  }
  return out;
}

/** Code-Vorschau (TypeScript), um die Positionen fest im Spiel zu verankern. */
export function editorAlsCode(stand: EditorStand, figur: EditorFigur): string {
  const posen = stand[figur];
  const zeilen: string[] = [];
  for (const [pose, delta] of Object.entries(posen)) {
    const eintraege = EDITOR_GLENKE.filter((g) => delta[g]).map((g) => `    ${g}: [${delta[g]![0]}, ${delta[g]![1]}]`);
    if (eintraege.length === 0) continue;
    zeilen.push(`  "${pose}": {\n${eintraege.join(",\n")},\n  },`);
  }
  if (zeilen.length === 0) return "// Noch keine Position übernommen.";
  return `export const ${figur.toUpperCase()}_EDITOR: Record<string, EditorDelta> = {\n${zeilen.join("\n")}\n};\n`;
}

/* ---------- Brücke zu den Zeichenfunktionen ---------- */

export interface EditorPunkt {
  gelenk: EditorGelenk;
  x: number;
  y: number;
}

/** Holt die aktuellen Gelenkpunkte (Figurenraum, Boden = 0) der gewählten Figur. */
export function figurenPunkte(figur: EditorFigur, pose: string, t: number, walk = 0): Record<EditorGelenk, [number, number]> {
  if (figur === "frosch") return methanPunkte(pose as MethanPose, t, walk, "friendly");
  return luniPunkte(pose as LuniState, t, walk);
}
