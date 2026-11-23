/** Gemeinsamer Staffordshire-Koerperbau nach Apollos stehender Spielsilhouette. */
export const STAFFORD = {
  schulterY: -19.6,
  huefteY: -18.2,
  huefteX: -11.4,
  schulterX: 8.8,
  brustHalb: 12.95,
  pfoteHalb: 2.91,
  schenkel: 4.6,
  oberarm: 4.26,
  unterlauf: 3.35,
  rumpfHinten: -13.8,
  rumpfVorn: 12.9,
  brustUnten: -8.9,
} as const;

/** Werte aus der tatsaechlich gezeichneten Apollo-Spielfigur (hunde.ts). */
export const APOLLOS_FELL = {
  grund: "#25272a",
  licht: "#3b3e40",
  dunkel: "#181a1d",
  brust: "#f1eee5",
  weiss: "#faf8f1",
  schatten: "#d8d5cb",
  maske: "#242427",
  lefze: "#181719",
  ohr: "#1b1d20",
  pfote: "#9d724a",
  pfoteMitte: "#7a5a41",
  nase: "#161211",
} as const;
