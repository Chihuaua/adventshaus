/** Gemeinsame, rein datenbasierte TV-Bedienung fuer Zeiger und Steuerkreuz. */
export type TVId = "tv_e" | "tv_d";
export type TVKanal = "garten" | "musik" | "sterne" | "konsole" | "gol" | "flauschi";
export type TVInhalt = TVKanal | "cozy" | "console" | "off";
export interface TVGeraet { kanal: TVKanal | null; lautstaerke: number }
export type TVStand = Record<TVId, TVGeraet>;
export type TVBefehl = "kanal_runter" | "kanal_hoch" | "leiser" | "lauter" | "power";

export const TV_KANAL_NAMEN: Record<TVKanal, string> = {
  garten: "Garten", musik: "Musikvideo", sterne: "NMS", konsole: "Konsole", gol: "Spiel des Lebens",
  flauschi: "Teleflauschi",
};

export function neuerTVStand(): TVStand {
  return { tv_e: { kanal: null, lautstaerke: 50 }, tv_d: { kanal: null, lautstaerke: 50 } };
}

/** Das Teleflauschi-Modul hat einen eigenen Programmplatz auf dem Dachgeschoss-TV. */
export function tvKanaele(id: TVId, spielEingelegt: boolean, flauschiEingelegt = false): TVKanal[] {
  if (id === "tv_e") return ["garten", "musik", "sterne"];
  const liste: TVKanal[] = ["garten", "musik", "sterne", "konsole"];
  if (spielEingelegt) liste.push("gol");
  if (flauschiEingelegt) liste.push("flauschi");
  return liste;
}

export function tvNaechsterKanal(
  id: TVId, aktuell: TVKanal, richtung: 1 | -1, spielEingelegt: boolean, flauschiEingelegt = false,
): TVKanal {
  const liste = tvKanaele(id, spielEingelegt, flauschiEingelegt);
  const i = Math.max(0, liste.indexOf(aktuell));
  return liste[(i + richtung + liste.length) % liste.length];
}

/** Alte Speicherstaende bleiben gueltig; fehlerhafte Werte werden nicht uebernommen. */
export function leseTVStand(roh: unknown): TVStand {
  const stand = neuerTVStand();
  if (!roh || typeof roh !== "object") return stand;
  for (const id of ["tv_e", "tv_d"] as const) {
    const quelle = (roh as Partial<TVStand>)[id];
    if (!quelle || typeof quelle !== "object") continue;
    if (quelle.kanal && tvKanaele(id, true, true).includes(quelle.kanal)) stand[id].kanal = quelle.kanal;
    if (typeof quelle.lautstaerke === "number" && Number.isFinite(quelle.lautstaerke)) {
      stand[id].lautstaerke = Math.max(0, Math.min(100, Math.round(quelle.lautstaerke)));
    }
  }
  return stand;
}

export interface TVFernStation {
  id: TVBefehl; label: string; kurz: string; x: number; y: number; w: number; h: number;
}

/** Alle Tasten liegen im 4:3-/Overscan-Bereich und sind mindestens 24 x 24 gross. */
export const TV_FERN_STATIONS: readonly TVFernStation[] = [
  { id: "kanal_runter", label: "Kanal zurueck", kurz: "P -", x: 648, y: 525, w: 42, h: 30 },
  { id: "kanal_hoch", label: "Kanal weiter", kurz: "P +", x: 696, y: 525, w: 42, h: 30 },
  { id: "leiser", label: "Leiser", kurz: "VOL -", x: 744, y: 525, w: 42, h: 30 },
  { id: "lauter", label: "Lauter", kurz: "VOL +", x: 792, y: 525, w: 42, h: 30 },
  { id: "power", label: "Fernseher an / aus", kurz: "I/O", x: 808, y: 491, w: 26, h: 26 },
];

export function tvFernTreffer(x: number, y: number): TVBefehl | null {
  return TV_FERN_STATIONS.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)?.id ?? null;
}

export function drawFernbedienung(
  c: CanvasRenderingContext2D, kanal: TVKanal, lautstaerke: number, an: boolean,
  hover: TVBefehl | null, fokus: TVBefehl | null,
) {
  const flaeche = (x: number, y: number, w: number, h: number, r: number, farbe: string) => {
    c.fillStyle = farbe; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  };
  c.save();
  flaeche(636, 482, 210, 86, 13, "#080e13");
  flaeche(637, 480, 208, 85, 12, "#24333d");
  flaeche(640, 483, 202, 79, 10, "#16232c");
  c.font = '600 10px "Space Grotesk", sans-serif';
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillStyle = "#91aaa6";
  c.fillText("FERNBEDIENUNG", 649, 494);
  c.fillStyle = an ? "#e8f2e8" : "#d2a9a5";
  c.fillText(an ? TV_KANAL_NAMEN[kanal] : "Standby", 649, 510);
  c.textAlign = "right";
  c.fillStyle = "#e7ca82";
  c.fillText(lautstaerke === 0 ? "STUMM" : `${lautstaerke}%`, 797, 510);
  for (const b of TV_FERN_STATIONS) {
    const aktiv = b.id === fokus || b.id === hover;
    flaeche(b.x, b.y + 1, b.w, b.h, 5, "#070d12");
    flaeche(b.x, b.y, b.w, b.h - 1, 5, aktiv ? "#3e5b61" : b.id === "power" ? "#693b3b" : "#30434f");
    if (b.id === fokus) {
      c.strokeStyle = "#f2cf68"; c.lineWidth = 1.6;
      c.beginPath(); c.roundRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4, 6); c.stroke();
    }
    c.font = '600 10px "Space Grotesk", sans-serif';
    c.textAlign = "center"; c.fillStyle = "#eef7f2";
    c.fillText(b.kurz, b.x + b.w / 2, b.y + b.h / 2);
  }
  c.restore();
}