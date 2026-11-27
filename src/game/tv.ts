/** Gemeinsame, rein datenbasierte TV-Bedienung fuer Zeiger und Steuerkreuz. */
import { TV_SENDUNGEN, TV_SENDUNG_NAMEN, type TVSendungId } from "./tv-sendungen";

export type TVId = "tv_e" | "tv_d";
export type TVKanal = "musik" | "sterne" | TVSendungId | "konsole" | "gol" | "flauschi";
export type TVInhalt = TVKanal | "cozy" | "console" | "off";
export interface TVGeraet { kanal: TVKanal | null; lautstaerke: number; /** null = Standard je Kanal (NMS & CH1 mit Ton, Sendungen stumm). */ stumm?: boolean | null }
export type TVStand = Record<TVId, TVGeraet>;
export type TVBefehl = "kanal_runter" | "kanal_hoch" | "leiser" | "lauter" | "stumm" | "power";

export const TV_KANAL_NAMEN: Record<TVKanal, string> = {
  musik: "Musikvideo",
  sterne: "NMS",
  ...TV_SENDUNG_NAMEN,
  konsole: "Konsole",
  gol: "Spiel des Lebens",
  flauschi: "Teleflauschi",
};

export function neuerTVStand(): TVStand {
  // Alle Sendungen starten stumm; die Mute-Taste der Fernbedienung schaltet den Ton frei.
  return { tv_e: { kanal: null, lautstaerke: 50, stumm: null }, tv_d: { kanal: null, lautstaerke: 50, stumm: null } };
}

/** Länge einer Musikvideo-Schleife (CH1): sie läuft automatisch höchstens dreimal. */
export const TV_CH1_SCHLEIFE = 17.2;

/** Ist dieser Inhalt von Haus aus stumm? Sendungen ja, NMS und CH1 nein. */
export function tvStandardStumm(kanal: TVKanal | null | undefined): boolean {
  return !!kanal && TV_SENDUNGEN.includes(kanal as TVSendungId);
}

/** Ein Block der täglichen TV-Routine: ein Kanal und wie lange sie ihn schaut. */
export interface TvBlock { kanal: TVKanal; dauer: number }

/**
 * Tägliche, immer andere Fernseh-Routine. Manche Tage zappt Luni viel (kurze
 * Blöcke), an anderen schaut sie Sendungen fast ganz. NMS ist überproportional
 * vertreten (zum Essen bevorzugt), CH1 (Musikvideo) höchstens drei Schleifen.
 */
export function tvTagesplan(tag: number, saatExtra = 0): TvBlock[] {
  let saat = (Math.imul(tag | 0, 2246822519) ^ (saatExtra >>> 0)) >>> 0;
  const w = () => { saat = (Math.imul(saat, 1664525) + 1013904223) >>> 0; return saat / 4294967296; };
  const zappig = w() < 0.45;            // zapprige Tage: viele kurze Blöcke
  const nmsAnteil = 0.2 + w() * 0.2;    // NMS ist deutlich häufiger dran
  const bloecke: TvBlock[] = [];
  // Sie schaltet mit CH1 ein – aber nur bis zu drei Schleifen.
  bloecke.push({ kanal: "musik", dauer: Math.min(3 * TV_CH1_SCHLEIFE, 30 + w() * 45) });
  for (let i = 0; i < 18; i++) {
    const r = w();
    let kanal: TVKanal;
    if (r < nmsAnteil) kanal = "sterne";
    else if (r < nmsAnteil + 0.07) kanal = "musik";
    else kanal = TV_SENDUNGEN[Math.floor(w() * TV_SENDUNGEN.length)];
    const dauer = zappig ? 20 + w() * 65 : 100 + w() * 230;
    bloecke.push({ kanal, dauer });
  }
  // Mindestens ein Viertel des Abends gehört NMS – sie macht ihn gern beim Essen an.
  const minimum = Math.ceil((bloecke.length - 1) * 0.25);
  let nms = bloecke.filter((b, i) => i > 0 && b.kanal === "sterne").length;
  for (let i = 1; nms < minimum && i < bloecke.length; i++) {
    if (bloecke[i].kanal !== "sterne" && bloecke[i].kanal !== "musik") {
      bloecke[i] = { kanal: "sterne", dauer: bloecke[i].dauer };
      nms++;
    }
  }
  return bloecke;
}
export function tvKanaele(id: TVId, spielEingelegt: boolean, flauschiEingelegt = false): TVKanal[] {
  if (id === "tv_e") return ["musik", "sterne", ...TV_SENDUNGEN];
  const liste: TVKanal[] = ["musik", "sterne", ...TV_SENDUNGEN, "konsole"];
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
    // Alte Stände: „NMS 2“ wird NMS, der entfernte Garten-Kanal (mit Spiel) wird zum Musikvideo.
    const gespeichert = quelle.kanal as string | null;
    const kanal = (gespeichert === "sterne_hell" ? "sterne" : gespeichert === "garten" ? "musik" : gespeichert) as TVKanal | null;
    if (kanal && tvKanaele(id, true, true).includes(kanal)) stand[id].kanal = kanal;
    if (typeof quelle.lautstaerke === "number" && Number.isFinite(quelle.lautstaerke)) {
      stand[id].lautstaerke = Math.max(0, Math.min(100, Math.round(quelle.lautstaerke)));
    }
    // Ohne gespeicherte Angabe gilt der Standard je Kanal (NMS & CH1 mit Ton, Sendungen stumm).
    stand[id].stumm = typeof quelle.stumm === "boolean" ? quelle.stumm : null;
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
  { id: "stumm", label: "Ton stumm / an", kurz: "MUTE", x: 744, y: 491, w: 56, h: 26 },
  { id: "power", label: "Fernseher an / aus", kurz: "I/O", x: 808, y: 491, w: 26, h: 26 },
];

export function tvFernTreffer(x: number, y: number): TVBefehl | null {
  return TV_FERN_STATIONS.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)?.id ?? null;
}

export function drawFernbedienung(
  c: CanvasRenderingContext2D, kanal: TVKanal, lautstaerke: number, an: boolean,
  hover: TVBefehl | null, fokus: TVBefehl | null, stumm = true,
) {
  const flaeche = (x: number, y: number, w: number, h: number, r: number, farbe: string) => {
    c.fillStyle = farbe; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  };
  c.save();
  flaeche(616, 482, 230, 86, 13, "#080e13");
  flaeche(617, 480, 228, 85, 12, "#24333d");
  flaeche(620, 483, 222, 79, 10, "#16232c");
  const still = stumm || lautstaerke === 0;
  // Kopfzeile: Beschriftung links, Tonstatus rechts (vor den Tasten)
  c.font = '600 9px "Space Grotesk", sans-serif';
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillStyle = "#91aaa6";
  c.fillText("FERNBEDIENUNG", 629, 494);
  c.textAlign = "right";
  c.fillStyle = still ? "#d2a9a5" : "#e7ca82";
  c.fillText(still ? "STUMM" : `${lautstaerke}%`, 740, 494);
  // Senderzeile: Name (auf Breite gekürzt) und Lautsprecher-Symbol
  c.font = '600 10px "Space Grotesk", sans-serif';
  c.textAlign = "left";
  c.fillStyle = an ? "#e8f2e8" : "#d2a9a5";
  let name = an ? TV_KANAL_NAMEN[kanal] : "Standby";
  while (name.length > 4 && c.measureText(name).width > 92) name = name.slice(0, -2) + "…";
  c.fillText(name, 629, 510);
  const sx = 730, sy = 510;
  c.fillStyle = still ? "#d2a9a5" : "#e7ca82";
  c.beginPath(); c.moveTo(sx, sy - 2.2); c.lineTo(sx + 2.4, sy - 2.2); c.lineTo(sx + 5.2, sy - 4.6);
  c.lineTo(sx + 5.2, sy + 4.6); c.lineTo(sx + 2.4, sy + 2.2); c.lineTo(sx, sy + 2.2); c.closePath(); c.fill();
  c.strokeStyle = still ? "#e26a62" : "#e7ca82"; c.lineWidth = 1.2; c.lineCap = "round";
  if (still) { c.beginPath(); c.moveTo(sx + 7, sy - 3.4); c.lineTo(sx + 12, sy + 3.4); c.stroke(); }
  else { c.beginPath(); c.arc(sx + 6, sy, 4.2, -0.8, 0.8); c.stroke(); c.beginPath(); c.arc(sx + 6, sy, 6.6, -0.8, 0.8); c.stroke(); }
  for (const b of TV_FERN_STATIONS) {
    const aktiv = b.id === fokus || b.id === hover;
    const muteAktiv = b.id === "stumm" && stumm;
    flaeche(b.x, b.y + 1, b.w, b.h, 5, "#070d12");
    flaeche(b.x, b.y, b.w, b.h - 1, 5, aktiv ? "#3e5b61" : b.id === "power" ? "#693b3b" : muteAktiv ? "#7a3a3a" : "#30434f");
    if (b.id === fokus) {
      c.strokeStyle = "#f2cf68"; c.lineWidth = 1.6;
      c.beginPath(); c.roundRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4, 6); c.stroke();
    }
    c.font = '600 10px "Space Grotesk", sans-serif';
    c.textAlign = "center"; c.fillStyle = muteAktiv ? "#ffe1dc" : "#eef7f2";
    c.fillText(b.kurz, b.x + b.w / 2, b.y + b.h / 2);
    // Kleine Status-LED auf der Mute-Taste: rot = stumm, mint = Ton an
    if (b.id === "stumm") {
      c.fillStyle = stumm ? "#ff6f61" : "#35d6c0";
      c.beginPath(); c.arc(b.x + b.w - 6, b.y + 5, 1.8, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
}