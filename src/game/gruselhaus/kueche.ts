/* Gruselhaus, Raum 05: Hexenküche – gemauerter Holzlagerplatz neben dem
   Hexenofen. Nur Canvas-Primitive, keine Assets.

   Der Lagerplatz ist eine Nische wie die Kamineinfassung aus der Vorlage
   (zwei Quaderpfeiler, Sims, Brennholz gestapelt). Er hat exakt die Breite
   und Höhe des Ofenkorpus (36 × 38) und steht mit Abstand 4 direkt daneben.
   Luni holt dort sichtbar ein Scheit, wenn ein neuer Ofendurchgang Holz
   braucht; der Bestand füllt sich langsam wieder. */
import type { Station } from "../house";
import { OFEN } from "./hexenofen";

type C = CanvasRenderingContext2D;

/** Lagerplatz: exakt so breit und so hoch wie der Ofen, Abstand 4 links. */
export const HOLZLAGER = {
  x: 650,
  h: 38,          // wie OFEN.korpus
  stand: 668,     // Luni steht mittig davor
  abstand: 4,     // Nische links: 650..686, Ofen beginnt 690
  /** Die Abdeckplatte läuft über die ganze Küche bis zur linken Wand. */
  platteLinks: 560,
  /** Steinhöhe der Abdeckplatte – doppelt so hoch wie die übrigen Lagersteine. */
  platteHoehe: 10,
  /** Die linke Abschlusswand trägt die Platte bis auf den Boden. */
  wandBreite: 6,
  /** Endwand und Trennwand zum Wohnzimmer schließen bündig ab (560 + 6). */
  wandRechts: 566,
} as const;
export const HOLZLAGER_W = OFEN.w; // 36, exakt wie der Ofen
export const HOLZ_MAX = 9;         // 3 × 3 Scheite, sichtbar im Stapel
/** Alle fünf Minuten kommt ein Scheit nach – bis der Stapel wieder voll ist. */
export const HOLZ_REFILL_SEK = 300;

/** Truhe als eigene Station (Klick lässt sie laufen, Luni bleibt stehen). */
export function truheStation(): Station {
  return {
    id: "truhe", label: "Truhe", floor: 1, x: KUECHE_WAND.truhe.stand, face: 1,
    state: "idle", expr: "neutral", hits: [[KUECHE_WAND.truhe.x, 415, KUECHE_WAND.truhe.w, 33]],
  };
}

/** Alle Zusatzstationen der Hexenküche. */
export function kuechenStationen(stations: readonly Station[]): Station[] {
  return [...holzlagerStationen(stations), truheStation()];
}

/** Stationen des Gruselhauses erweitern (nur Kopien/neue Einträge). */
export function holzlagerStationen(stations: readonly Station[]): Station[] {
  return [
    ...stations,
    {
      id: "holzlager",
      label: "Holzlager",
      floor: 1,
      x: HOLZLAGER.stand,
      face: 1,
      state: "act",
      expr: "happy",
      hits: [[HOLZLAGER.x, 448 - HOLZLAGER.h, HOLZLAGER_W, HOLZLAGER.h]],
    },
  ];
}

/* ------------------------------ Zeichenhilfen ---------------------------- */

const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function rect(c: C, x: number, y: number, w: number, h: number, f: string) { c.fillStyle = f; c.fillRect(x, y, w, h); }
function disc(c: C, x: number, y: number, r: number, f: string) { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }

const STEIN = ["#6d5c4b", "#5f5042", "#7a6754", "#564a3d", "#695845"];
const FUGE = "#2c231b";

/** Ein Stein des Mauerwerks (auch für Tests). */
export interface Mauerstein { x: number; y: number; w: number; h: number; reihe: number; spalte: number }

/**
 * Steine im versetzten Verband. Die Fuge ist eingerechnet: Steine überlappen
 * nie und liegen vollständig im Rechteck. Schmale Pfeiler bekommen im Wechsel
 * einen ganzen Block und zwei halbe – die klassische Eckquaderung.
 */
export function mauerSteine(x0: number, y0: number, w: number, h: number, seed: number): Mauerstein[] {
  const rh = 7;
  const schmal = w < 20;
  const unit = 15;
  const out: Mauerstein[] = [];
  for (let r = 0; r * rh < h; r++) {
    const y = y0 + r * rh;
    const hh = Math.min(rh, y0 + h - y) - 1.6;
    if (hh <= 0.4) continue;
    if (schmal) {
      if (r % 2 === 0) {
        out.push({ x: x0 + 0.5, y: y + 0.8, w: w - 1, h: hh, reihe: r, spalte: 0 });
      } else {
        const bw = (w - 1.5) / 2;
        out.push({ x: x0 + 0.5, y: y + 0.8, w: bw, h: hh, reihe: r, spalte: 0 });
        out.push({ x: x0 + 0.5 + bw + 0.5, y: y + 0.8, w: bw, h: hh, reihe: r, spalte: 1 });
      }
      continue;
    }
    let start = x0 - (r % 2 ? unit / 2 : 0);
    for (let k = 0; start < x0 + w && k < 40; k++) {
      const roh = unit + (hash(seed + r * 13.7 + k * 5.9) - 0.5) * 5;
      const links = Math.max(x0, start + 0.8);
      const rechts = Math.min(x0 + w, start + roh - 0.8);
      if (rechts - links > 1.2) out.push({ x: links, y: y + 0.8, w: rechts - links, h: hh, reihe: r, spalte: k });
      start += Math.max(2.6, roh);
    }
  }
  return out;
}

/** Zeichnet das Mauerwerk; der Clip verhindert, dass ein Stein über den Rand läuft. */
function quadermauer(c: C, x0: number, y0: number, w: number, h: number, seed: number) {
  c.save();
  c.beginPath(); c.rect(x0, y0, w, h); c.clip();
  rect(c, x0, y0, w, h, FUGE);
  for (const st of mauerSteine(x0, y0, w, h, seed)) {
    const col = STEIN[Math.floor(hash(seed + st.reihe * 23.1 + st.spalte * 7.3) * STEIN.length)];
    rrFill(c, st.x, st.y, st.w, st.h, 1.1, col);
    rect(c, st.x, st.y, st.w, 0.7, "rgba(255,240,214,.13)");
    rect(c, st.x, st.y + st.h - 0.8, st.w, 0.8, "rgba(0,0,0,.28)");
  }
  c.restore();
}

/** Ein gestapeltes Scheit, von der Stirnseite gesehen. */
function scheitEnde(c: C, x: number, y: number, wobble: number) {
  const jx = Math.sin(wobble * 9) * 0.4;
  disc(c, x + jx, y, 3.4, "#4d2e14");
  disc(c, x + jx, y, 2.8, "#7c4a26");
  disc(c, x + jx, y, 2.1, "#c89a63");
  c.save();
  c.strokeStyle = "rgba(90,55,28,.75)";
  c.lineWidth = 0.45;
  c.beginPath(); c.arc(x + jx, y, 1.5, 0.4, 4.4); c.stroke();
  c.beginPath(); c.arc(x + jx, y, 0.7, 1.6, 5.6); c.stroke();
  c.restore();
}

/**
 * Die Nische neben dem Ofen. `holz` = aktueller Bestand (0..9),
 * `wobble` > 0 wackelt das oberste Scheit kurz (Luni richtet ihn beim Ablegen).
 */
export function drawHolzlager(c: C, F: number, holz: number, wobble = 0) {
  const x0 = HOLZLAGER.x;
  const w = HOLZLAGER_W;
  const top = F - HOLZLAGER.h;        // gleiche Oberkante wie der Ofenkorpus
  const pfosten = 6, sims = 4;
  // Schatten auf dem Boden, wie unter dem Ofen
  c.save();
  c.globalAlpha = 0.35;
  c.beginPath(); c.ellipse(x0 + w / 2, F + 1, 21, 2, 0, 0, Math.PI * 2); c.fillStyle = "#0c0907"; c.fill();
  c.restore();
  // Innenraum (dunkel), auf dem die Scheite liegen
  rect(c, x0 + pfosten, top + 3, w - pfosten * 2, HOLZLAGER.h - sims - 1, "#241a12");
  rect(c, x0 + pfosten, top + 3, w - pfosten * 2, 1, "rgba(255,230,190,.08)");
  // Brennholz: von unten links gestapelt, wird von oben rechts abgenommen
  const innenX = x0 + pfosten + 1;
  const innenW = w - pfosten * 2 - 2;   // 25
  const mittel = [innenX + 5.5, innenX + innenW / 2, innenX + innenW - 5.5];
  const reiheY = [F - 7.2, F - 14.2, F - 21.2];
  for (let i = 0; i < Math.min(holz, HOLZ_MAX); i++) {
    const spalte = i % 3, reihe = (i / 3) | 0;
    const istTop = i === holz - 1;
    scheitEnde(c, mittel[spalte], reiheY[reihe], istTop ? wobble : 0);
  }
  // Abdeckplatte: von der linken Küchenwand bis über den rechten Lagerpfeiler.
  // Die Steine sind doppelt so hoch wie zuvor; die Platte wächst nach oben.
  const platteLinks = HOLZLAGER.platteLinks;
  const platteRechts = x0 + w + 2;
  const platteUnten = top + sims + 1;      // Unterkante bleibt am Fach
  const platteHoehe = HOLZLAGER.platteHoehe; // 10 statt 5
  const platteOben = platteUnten - platteHoehe;
  quadermauer(c, platteLinks, platteOben, platteRechts - platteLinks, platteHoehe, 29);
  // Linke Abschlusswand: gemauert vom Boden bis unter die Platte.
  quadermauer(c, platteLinks, platteUnten, HOLZLAGER.wandBreite, F - platteUnten, 61);
  // Innere Pfeiler der Holzecke bleiben erhalten.
  quadermauer(c, x0, top + sims, pfosten, HOLZLAGER.h - sims, 13);
  quadermauer(c, x0 + w - pfosten, top + sims, pfosten, HOLZLAGER.h - sims, 47);
  // Kanten der Platte und der neuen Wand
  rect(c, platteLinks, platteOben, platteRechts - platteLinks, 1, "rgba(255,240,214,.38)");
  rect(c, platteLinks, platteUnten, platteRechts - platteLinks, 1.2, "rgba(0,0,0,.4)");
  rect(c, x0 + pfosten, platteUnten, w - pfosten * 2, 1, "rgba(255,240,214,.12)");
  rect(c, platteLinks + HOLZLAGER.wandBreite, platteOben, 0.8, platteHoehe, "rgba(255,240,214,.1)");
}

/* =======================================================================
   WÄNDE DER HEXENKÜCHE UND DES RECHTEN TREPPENHAUSES
   Dunkle Bruchsteinmauer (kühler als das Holzlager, damit sich die Nische
   abhebt), warme Lichtinseln nur dort, wo wirklich etwas brennt: Kerze in
   der Wandnische, Fackel im Treppenhaus. Alles statisch bis auf Flammen
   und Schein. Nur im Gruselhaus.
   ======================================================================= */

type Rechteck = [number, number, number, number];

/** Flächen und Fixpunkte (auch für Tests). */
export const KUECHE_WAND = {
  kueche: [560, 336, 134, 112] as Rechteck,
  treppenhaus: [694, 212, 136, 236] as Rechteck,
  /** Kreisglas des Radfensters – quadratische Hülle ist das Wetterfenster. */
  fenster: [585, 354, 46, 46] as Rechteck,
  /** Runder Steinbogen von der linken Stützwand bis zur Holzlagerwand. */
  bogen: { x0: 566, x1: 650, boden: 405, spring: 382, r: 42 } as { x0: number; x1: number; boden: number; spring: number; r: number },
  /** Untere Breite = zwei Drittel der Abdeckplatte (128 / 3 * 2 = 85,3). */
  fensterBreite: 86,
  /** Truhe zwischen linker Wand und Holzlager, mittig. */
  truhe: { x: 568, w: 80, stand: 608 },
  kerze: [621.2, 390] as [number, number],
  fackel: [808, 284] as [number, number],
  /** Geländer liegt jetzt vor dem Fenster und 4 Einheiten tiefer. */
  gelaenderHoehe: 50,
} as const;

const W2 = 960, H2 = 600;
const MAUER = ["#4a423b", "#403934", "#544940", "#463e38", "#5a4f45", "#3c3530"];
const MOERTEL = "#1d1916";

function rrPfad(c: C, x: number, y: number, w: number, h: number, r: number) {
  const q = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + q, y); c.lineTo(x + w - q, y); c.quadraticCurveTo(x + w, y, x + w, y + q);
  c.lineTo(x + w, y + h - q); c.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  c.lineTo(x + q, y + h); c.quadraticCurveTo(x, y + h, x, y + h - q);
  c.lineTo(x, y + q); c.quadraticCurveTo(x, y, x + q, y); c.closePath();
}
function rrFill(c: C, x: number, y: number, w: number, h: number, r: number, f: string) { rrPfad(c, x, y, w, h, r); c.fillStyle = f; c.fill(); }
function strich(c: C, x1: number, y1: number, x2: number, y2: number, col: string, w = 1) {
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round";
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}
function ell(c: C, x: number, y: number, rx: number, ry: number, f: string, rot = 0) {
  c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill();
}

/** Bruchsteinmauer: 10er-Reihen, Steine 16–24 breit, weiche Kanten. */
function bruchstein(c: C, x0: number, y0: number, w: number, h: number) {
  rect(c, x0, y0, w, h, MOERTEL);
  const rh = 10;
  for (let r = 0; r * rh < h; r++) {
    const y = y0 + r * rh;
    let x = x0 - 4 - hash(r * 7.3) * 14;
    let i = 0;
    while (x < x0 + w) {
      const sw = 16 + Math.floor(hash(r * 31.1 + i * 7.7) * 9);
      const dy = (hash(r * 3.9 + i * 11.3) - 0.5) * 1.2;
      const col = MAUER[Math.floor(hash(r * 13.7 + i * 5.3) * MAUER.length)];
      rrFill(c, x + 0.9, y + 0.9 + dy, sw - 1.8, rh - 1.8, 1.8, col);
      rect(c, x + 2, y + 1.3 + dy, sw - 4, 0.9, "rgba(255,235,210,.07)");
      rect(c, x + 1.5, y + rh - 2.3 + dy, sw - 3, 1.2, "rgba(0,0,0,.32)");
      if (hash(r * 2.1 + i * 9.9) > 0.8) ell(c, x + sw * 0.6, y + rh * 0.45 + dy, 1.4, 0.8, "rgba(0,0,0,.22)");
      x += sw;
      i++;
    }
  }
  // Schatten unter der Decke und am Boden
  const g = c.createLinearGradient(0, y0, 0, y0 + 16);
  g.addColorStop(0, "rgba(0,0,0,.38)"); g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g; c.fillRect(x0, y0, w, 16);
}

function pflaster(c: C, x0: number, x1: number, F: number) {
  rect(c, x0, F, x1 - x0, 6, "#211c18");
  for (let r = 0; r < 2; r++) {
    let x = x0 - (r ? 4 : 0);
    let i = 0;
    while (x < x1) {
      const sw = 7 + Math.floor(hash(i * 3.3 + r * 17) * 4);
      const col = ["#4b443d", "#3f3933", "#554c43"][Math.floor(hash(i * 7.1 + r) * 3)];
      rrFill(c, Math.max(x0, x + 0.6), F + 0.4 + r * 3, Math.min(sw - 1.2, x1 - x - 0.6), 2.6, 1, col);
      x += sw;
      i++;
    }
  }
  rect(c, x0, F, x1 - x0, 0.9, "rgba(255,235,210,.12)");
}

function kraeuter(c: C, x: number, laenge: number, art: number) {
  const top = 342;
  strich(c, x, top, x, top + 4, "#2a2018", 0.6);
  const farben = [["#6b7a3a", "#7d8f62"], ["#7a5a9a", "#5e4378"], ["#8a6a3a", "#6f5230"]][art % 3];
  for (let k = -2; k <= 2; k++) {
    const a = k * 0.16;
    const ex = x + Math.sin(a) * laenge, ey = top + 5 + Math.cos(a) * laenge;
    strich(c, x, top + 5, ex, ey, farben[(k + 2) % 2], 1.6);
    ell(c, ex, ey, 1.2, 1.9, farben[(k + 3) % 2], a);
  }
  rect(c, x - 1.6, top + 4, 3.2, 1.6, "#9b7b4a");
}




function russ(c: C) {
  const g = c.createLinearGradient(0, 392, 0, 338);
  g.addColorStop(0, "rgba(8,6,5,.62)"); g.addColorStop(0.6, "rgba(8,6,5,.32)"); g.addColorStop(1, "rgba(8,6,5,0)");
  c.fillStyle = g;
  c.beginPath(); c.moveTo(697, 392); c.lineTo(719, 392); c.lineTo(736, 338); c.lineTo(680, 338); c.closePath(); c.fill();
}

function spinnennetz(c: C, ex: number, ey: number, gr: number) {
  c.save();
  c.strokeStyle = "rgba(214,214,222,.38)"; c.lineWidth = 0.5;
  const strahlen = 6;
  for (let k = 0; k <= strahlen; k++) {
    const a = Math.PI / 2 + (Math.PI / 2) * (k / strahlen);
    c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + Math.cos(a) * gr, ey + Math.sin(a) * gr); c.stroke();
  }
  for (let ring = 1; ring <= 4; ring++) {
    const rr2 = (gr * ring) / 4.4;
    c.beginPath();
    for (let k = 0; k <= strahlen; k++) {
      const a = Math.PI / 2 + (Math.PI / 2) * (k / strahlen);
      const px = ex + Math.cos(a) * rr2, py = ey + Math.sin(a) * rr2;
      if (k === 0) c.moveTo(px, py); else c.quadraticCurveTo(ex + Math.cos(a - 0.13) * rr2 * 0.9, ey + Math.sin(a - 0.13) * rr2 * 0.9, px, py);
    }
    c.stroke();
  }
  disc(c, ex - gr * 0.42, ey + gr * 0.5, 1.3, "#171416");
  c.restore();
}

function fass(c: C, x: number, F: number) {
  const w = 22, h = 22, top = F - h;
  c.fillStyle = "#5c3e27";
  c.beginPath();
  c.moveTo(x + 2, top); c.quadraticCurveTo(x - 1.5, top + h / 2, x + 2, F);
  c.lineTo(x + w - 2, F); c.quadraticCurveTo(x + w + 1.5, top + h / 2, x + w - 2, top); c.closePath(); c.fill();
  for (let k = 1; k < 5; k++) strich(c, x + (w * k) / 5, top + 0.6, x + (w * k) / 5, F - 0.6, "rgba(30,18,10,.5)", 0.5);
  for (const yy of [top + 3, top + h / 2, F - 3]) {
    const bulge = yy === top + h / 2 ? 1.5 : 0.6;
    rect(c, x + 1 - bulge, yy - 0.9, w - 2 + bulge * 2, 1.8, "#2c2a2b");
    rect(c, x + 1 - bulge, yy - 0.9, w - 2 + bulge * 2, 0.5, "rgba(200,190,180,.25)");
  }
  rect(c, x + 3, top + 1.4, 2, h - 3, "rgba(255,220,170,.12)");
}

function fackelHalter(c: C) {
  const [fx, fy] = KUECHE_WAND.fackel;
  rect(c, fx - 2.5, fy + 14, 5, 8, "#262427");
  strich(c, fx, fy + 18, fx, fy + 12, "#262427", 1.6);
  strich(c, fx - 3, fy + 8, fx + 3, fy + 8, "#262427", 1.2);
  rect(c, fx - 1.6, fy + 2, 3.2, 12, "#4a3020");
  rect(c, fx - 2.2, fy, 4.4, 3.4, "#6b5233");
  strich(c, fx - 2.2, fy + 1.2, fx + 2.2, fy + 1.2, "rgba(30,20,10,.6)", 0.5);
}

/** Statische Ebene: Mauern, Boden und Einrichtung von Küche und Treppenhaus. */
export function drawHexenkuecheRaum(c: C) {
  c.save();
  c.beginPath();
  c.rect(560, 336, 270, 112);  // Küche (ab Durchgang) und unteres Treppenhaus
  c.rect(694, 212, 136, 112);  // oberes Treppenhaus (neben dem Bad)
  c.rect(696, 324, 134, 12);   // Lücke neben der Deckenkante des 1. Stocks
  c.clip();
  bruchstein(c, 560, 212, 270, 236);
  russ(c);
  c.restore();
  pflaster(c, 560, 830, 448);
  // Deckenbalken in der Küche
  rect(c, 564, 336, 132, 6, "#3a281c");
  rect(c, 564, 340.6, 132, 1.4, "rgba(0,0,0,.4)");
  rect(c, 564, 336, 132, 0.9, "rgba(255,230,190,.14)");
  // Die Wandfläche über der Arbeitsplatte trägt jetzt das Küchenfenster;
  // Kräuter, Kolben, Nische und Buch sitzen auf der Platte (drawTruheAufsatz).
  fass(c, 742, 448);
  fackelHalter(c);
  spinnennetz(c, 829, 213, 26);
}

/** Spitzbogenfenster aus Stein. Glas = exakt das Wetterfenster (x, y, w, h). */
/** Rundbogenlaibung und Steinsims; Glas bleibt für das Wetter frei. */
export function drawKuchenFenster(c: C, sky: CanvasImageSource) {
  const { x0, x1, boden, spring, r } = KUECHE_WAND.bogen;
  const mid = (x0 + x1) / 2, rIn = r - 9;
  const innen = () => {
    c.beginPath();
    c.moveTo(mid - rIn, boden); c.lineTo(mid - rIn, spring);
    c.arc(mid, spring, rIn, Math.PI, 0);
    c.lineTo(mid + rIn, boden); c.closePath();
  };
  // Nische (dunkel)
  innen(); c.fillStyle = "#171310"; c.fill();
  // Glas mit Himmel, blauem Schimmer, Speichenrad
  const [gx, gy, gw, gh] = KUECHE_WAND.fenster;
  const gmid = gx + gw / 2, gcy = gy + gh / 2, rad = gw / 2;
  c.save();
  c.beginPath(); c.arc(gmid, gcy, rad, 0, Math.PI * 2); c.clip();
  c.drawImage(sky, 0, 0, W2, H2);
  const gg = c.createRadialGradient(gmid, gcy, 2, gmid, gcy, rad);
  gg.addColorStop(0, "rgba(110,160,245,.45)"); gg.addColorStop(0.6, "rgba(55,100,195,.42)"); gg.addColorStop(1, "rgba(18,40,92,.75)");
  c.fillStyle = gg; c.fillRect(gx, gy, gw, gh);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.2;
    strich(c, gmid, gcy, gmid + Math.cos(a) * rad, gcy + Math.sin(a) * rad, "#101823", 1.7);
  }
  c.restore();
  c.strokeStyle = "#15181d"; c.lineWidth = 2.2;
  c.beginPath(); c.arc(gmid, gcy, rad - 1, 0, Math.PI * 2); c.stroke();
  disc(c, gmid, gcy, 4.4, "#15181d"); disc(c, gmid, gcy, 2.6, "#3d4b5e");
  // Steinband um den Bogen
  c.beginPath();
  c.moveTo(mid - r, boden); c.lineTo(mid - r, spring);
  c.arc(mid, spring, r, Math.PI, 0);
  c.lineTo(mid + r, boden); c.lineTo(mid + rIn, boden); c.lineTo(mid + rIn, spring);
  c.arc(mid, spring, rIn, 0, Math.PI, true);
  c.lineTo(mid - rIn, boden); c.closePath();
  c.fillStyle = "#5a5047"; c.fill();
  c.strokeStyle = "rgba(20,17,15,.6)"; c.lineWidth = 0.8;
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (Math.PI * i) / 12;
    strich(c, mid + Math.cos(a) * rIn, spring + Math.sin(a) * rIn, mid + Math.cos(a) * r, spring + Math.sin(a) * r, "rgba(20,17,15,.55)", 0.7);
  }
  c.strokeStyle = "rgba(255,235,210,.28)"; c.lineWidth = 0.8;
  c.beginPath(); c.arc(mid, spring, r - 0.6, Math.PI, 0); c.stroke();
  // Arbeitsplatte / Sims
  rect(c, 558, boden, 92, 4, "#6d655d");
  rect(c, 558, boden, 92, 0.9, "rgba(255,235,210,.22)");
  rect(c, 558, boden + 4, 92, 1.2, "rgba(0,0,0,.4)");
}

/** Nach dem Wetter: Stein und Nische um das runde Glas wiederherstellen. */
export function drawFensterMaske(c: C) {
  const { x0, x1, boden, spring, r } = KUECHE_WAND.bogen;
  const mid = (x0 + x1) / 2, rIn = r - 9;
  const [gx, gy, gw, gh] = KUECHE_WAND.fenster;
  const gmid = gx + gw / 2, gcy = gy + gh / 2, rad = gw / 2;
  c.save();
  c.beginPath();
  c.rect(x0 - 8, 332, x1 - x0 + 16, boden - 332);
  c.arc(gmid, gcy, rad, 0, Math.PI * 2);
  c.clip("evenodd");
  // Mauerwerk
  c.fillStyle = MOERTEL; c.fillRect(x0 - 8, 332, x1 - x0 + 16, boden - 332);
  for (let rr2 = 0; rr2 < 11; rr2++) {
    const yy = 332 + rr2 * 7;
    let xx = x0 - 8 - (rr2 % 2 ? 6 : 0), i = 0;
    while (xx < x1 + 8) {
      const sw = 11 + Math.floor(hash(rr2 * 31 + i * 7 + 3) * 5);
      c.fillStyle = MAUER[(rr2 * 3 + i * 5) % MAUER.length];
      c.fillRect(xx + 0.7, yy + 0.7, sw - 1.4, 5.6);
      c.fillStyle = "rgba(255,240,214,.16)";
      c.fillRect(xx + 0.7, yy + 0.7, sw - 1.4, 0.9);
      xx += sw; i++;
    }
  }
  // Nische dunkel
  c.beginPath();
  c.moveTo(mid - rIn, boden); c.lineTo(mid - rIn, spring);
  c.arc(mid, spring, rIn, Math.PI, 0);
  c.lineTo(mid + rIn, boden); c.closePath();
  c.fillStyle = "#171310"; c.fill();
  // Steinband
  c.beginPath();
  c.moveTo(mid - r, boden); c.lineTo(mid - r, spring);
  c.arc(mid, spring, r, Math.PI, 0);
  c.lineTo(mid + r, boden); c.lineTo(mid + rIn, boden); c.lineTo(mid + rIn, spring);
  c.arc(mid, spring, rIn, 0, Math.PI, true);
  c.lineTo(mid - rIn, boden); c.closePath();
  c.fillStyle = "#5a5047"; c.fill();
  c.strokeStyle = "rgba(20,17,15,.55)"; c.lineWidth = 0.8;
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (Math.PI * i) / 12;
    strich(c, mid + Math.cos(a) * rIn, spring + Math.sin(a) * rIn, mid + Math.cos(a) * r, spring + Math.sin(a) * r, "rgba(20,17,15,.55)", 0.7);
  }
  c.restore();
  // Rad und Eisenring über dem Wetter
  c.strokeStyle = "#15181d"; c.lineWidth = 2.2;
  c.beginPath(); c.arc(gmid, gcy, rad - 1, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.2;
    strich(c, gmid, gcy, gmid + Math.cos(a) * rad, gcy + Math.sin(a) * rad, "#101823", 1.7);
  }
  disc(c, gmid, gcy, 4.4, "#15181d"); disc(c, gmid, gcy, 2.6, "#3d4b5e");
}

/** Regen und Schnee im runden Küchenglas – eigenes Wetter, unabhängig von der Fensterliste. */
export function drawKuchenFensterWetter(c: C, art: string, t: number) {
  const [x, y, w, h] = KUECHE_WAND.fenster;
  const mid = x + w / 2, cy = y + h / 2, rad = w / 2 - 1;
  const regen = ["regen", "sturm", "gewitter"].includes(art);
  const schnee = art === "schnee" || art === "hagel";
  if (!regen && !schnee) return;
  c.save();
  c.beginPath(); c.arc(mid, cy, rad, 0, Math.PI * 2); c.clip();
  for (let i = 0; i < 14; i++) {
    const sx = mid - rad + ((hash(i * 3.1) * w + t * (schnee ? 8 : 22)) % w);
    const sy = cy - rad + ((hash(i * 7.7) * h + t * (schnee ? 10 : 40)) % h);
    if (schnee) { c.fillStyle = "rgba(247,251,255,.85)"; c.beginPath(); c.arc(sx, sy, 0.9, 0, Math.PI * 2); c.fill(); }
    else { c.strokeStyle = "rgba(190,220,240,.6)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 0.8, sy + 5); c.stroke(); }
  }
  c.restore();
}

/** Leises blaues Leuchten des Radfensters – nach der Nachtabdunkelung. */
export function drawFensterGlanz(c: C, t: number) {
  const [x, y, w, h] = KUECHE_WAND.fenster;
  const mid = x + w / 2, cy = y + h / 2, rad = w / 2;
  c.save();
  c.globalCompositeOperation = "lighter";
  const g = c.createRadialGradient(mid, cy, rad * 0.2, mid, cy, rad * 1.7);
  const a = 0.09 + 0.04 * Math.sin(t * 1.3);
  g.addColorStop(0, `rgba(120,170,255,${a})`);
  g.addColorStop(0.6, `rgba(80,120,230,${a * 0.5})`);
  g.addColorStop(1, "rgba(60,90,200,0)");
  c.fillStyle = g; c.beginPath(); c.arc(mid, cy, rad * 1.7, 0, Math.PI * 2); c.fill();
  c.restore();
}

export function drawTruhe(c: C, F: number, lauf: number, t: number, lift: number, richtung: 1 | -1, geh: number) {
  void t;
  const { x, w } = KUECHE_WAND.truhe;
  const standUnten = F - 1;
  const unten = standUnten - lift * 12;
  const oben = unten - 34;
  c.save();
  c.translate(lauf, 0);
  // Schatten
  c.save(); c.globalAlpha = lift > 0.02 ? 0.28 : 0.4;
  c.beginPath(); c.ellipse(x + w / 2, F + 1, 34 + lift * 6, 2.6, 0, 0, Math.PI * 2);
  c.fillStyle = "#0b0806"; c.fill(); c.restore();
  // Beine: stehen unsichtbar; beim Aufstehen drücken die Knie durch, dann trappeln sie.
  if (lift > 0.02) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const base = x + 6 + (i * (w - 12)) / (n - 1);
      const phase = geh > 0 ? Math.sin(geh * 9 + i * 0.85) : 0;
      const stepLift = geh > 0 ? Math.max(0, phase) * 2.6 : 0;
      const side = richtung;
      const hipY = unten;
      const footY = F - 1 - stepLift;
      const kneeY = (hipY + footY) / 2 + 2.4 - lift * 1.2;
      const push = (1 - lift) * 5;
      const kneeX = base + side * (2.2 + push) + (geh > 0 ? side * phase * 2.2 : 0);
      const footX = base + side * (geh > 0 ? phase * 2.8 : 0);
      strich(c, base, hipY, kneeX, kneeY, "#5e3c1e", 2.6);
      strich(c, kneeX, kneeY, footX, footY, "#7a4f27", 2.2);
      disc(c, kneeX, kneeY, 1.5, "#9a6a3a");
      disc(c, footX, footY, 1.4, "#4a2d15");
    }
  }
  // Korpus wie auf Bild 1: breit, dunkles Birnbaumholz, eiserne Bänder
  const holz = c.createLinearGradient(x, oben, x, unten);
  holz.addColorStop(0, "#b07a45"); holz.addColorStop(0.45, "#c9955d"); holz.addColorStop(1, "#8a5c31");
  c.fillStyle = holz;
  c.beginPath();
  c.moveTo(x, oben + 3); c.lineTo(x + w, oben + 3);
  c.lineTo(x + w - 2, unten); c.lineTo(x + 2, unten); c.closePath(); c.fill();
  c.strokeStyle = "#4b2e15"; c.lineWidth = 1.1; c.stroke();
  // Eisenbänder
  for (const dx of [8, w - 12]) {
    rect(c, x + dx, oben + 4, 3, unten - oben - 5, "#3a3a3e");
    rect(c, x + dx, oben + 4, 0.8, unten - oben - 5, "rgba(220,225,230,.25)");
    for (let k = 0; k < 4; k++) disc(c, x + dx + 1.5, oben + 8 + k * 5, 0.5, "#8a8f96");
  }
  // Felder und Schloss
  c.strokeStyle = "rgba(70,40,16,.55)"; c.lineWidth = 0.8;
  for (const dx of [18, 34, 50]) {
    c.beginPath(); c.roundRect(x + dx, oben + 9, 13, unten - oben - 14, 3); c.stroke();
  }
  rect(c, x + w / 2 - 3, oben + 12, 6, 5, "#c9b27a");
  rect(c, x + w / 2 - 2, oben + 13, 4, 3, "#5a4a2a");
  // Deckel
  c.fillStyle = "#d2a066";
  c.beginPath(); c.moveTo(x - 1, oben + 3); c.lineTo(x + w + 1, oben + 3);
  c.lineTo(x + w - 1, oben - 1); c.lineTo(x + 1, oben - 1); c.closePath(); c.fill();
  c.strokeStyle = "#4b2e15"; c.stroke();
  c.restore();
}

/** Aufsatz auf der Arbeitsplatte (bewegt sich nicht mit der Truhe). */
export function drawTruheAufsatz(c: C, t: number, itemY = 405) {
  const { x } = KUECHE_WAND.truhe;
  // Kräuter und Glaskolben hängen links bzw. stehen rechts auf der Platte
  kraeuter(c, x + 8, 11, 0);
  kraeuter(c, x + 18, 9, 1);
  // Aufgeschlagenes Buch: dunkler Einband, zwei helle Seiten, Rücken in der Mitte
  c.fillStyle = "#3f1a1f";
  c.beginPath();
  c.moveTo(x + 24, itemY); c.lineTo(x + 48, itemY);
  c.quadraticCurveTo(x + 49, itemY - 3, x + 48, itemY - 4);
  c.lineTo(x + 37, itemY - 5.2); c.lineTo(x + 26, itemY - 4);
  c.quadraticCurveTo(x + 24.6, itemY - 2.6, x + 24, itemY); c.closePath(); c.fill();
  c.fillStyle = "#ece0c2";
  c.beginPath(); c.moveTo(x + 25.4, itemY - 0.5); c.quadraticCurveTo(x + 31, itemY - 1.4, x + 36.6, itemY - 1.1); c.lineTo(x + 36.6, itemY - 4.4); c.quadraticCurveTo(x + 31, itemY - 4.6, x + 25.6, itemY - 3.6); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x + 37.4, itemY - 1.1); c.quadraticCurveTo(x + 43, itemY - 1.4, x + 47.6, itemY - 0.5); c.lineTo(x + 47.2, itemY - 3.6); c.quadraticCurveTo(x + 43, itemY - 4.6, x + 37.4, itemY - 4.4); c.closePath(); c.fill();
  for (let k = 0; k < 3; k++) {
    strich(c, x + 27, itemY - 1.6 - k * 0.7, x + 35.6, itemY - 2 - k * 0.7, "rgba(120,90,60,.45)", 0.3);
    strich(c, x + 38.4, itemY - 2 - k * 0.7, x + 46.4, itemY - 1.6 - k * 0.7, "rgba(120,90,60,.45)", 0.3);
  }
  strich(c, x + 37, itemY - 1.1, x + 37, itemY - 4.8, "rgba(90,60,30,.7)", 0.5);
  // Totenkopf
  disc(c, x + 53, itemY - 3.4, 3.2, "#e8e0cc");
  rrFill(c, x + 50.4, itemY - 2.2, 5.2, 3.1, 1.2, "#e8e0cc");
  disc(c, x + 51.6, itemY - 3.7, 0.9, "#2b2722");
  disc(c, x + 54.4, itemY - 3.7, 0.9, "#2b2722");
  // Kerzen
  // Genau drei Kerzen auf der Arbeitsplatte.
  for (const [dx, hh] of [[57, 5], [61.5, 8], [66, 6]] as const) {
    rect(c, x + dx, itemY - hh, 2.6, hh, "#e2d5b8");
    const fl = 0.84 + 0.12 * Math.sin(t * 12 + dx);
    ell(c, x + dx + 1.3, itemY - hh - 1.6, 1.3, 2.6 * fl, "#ffb347");
    ell(c, x + dx + 1.3, itemY - hh - 1.2, 0.6, 1.3 * fl, "#fff1c4");
  }
  // Glaskolben rechts am Rand
  glasKolben(c, x + 74, itemY);
}

function glasKolben(c: C, bx: number, y: number) {
  c.fillStyle = "rgba(170,190,200,.2)";
  c.beginPath(); c.roundRect(bx - 5, y - 12, 10, 12, 3); c.fill();
  c.fillStyle = "#7a4ec8";
  c.beginPath(); c.roundRect(bx - 4, y - 8, 8, 8, 3); c.fill();
  c.fillStyle = "#4f9a5e";
  c.beginPath(); c.arc(bx, y - 11, 2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(200,215,225,.6)"; c.lineWidth = 0.6;
  c.beginPath(); c.roundRect(bx - 5, y - 12, 10, 12, 3); c.stroke();
  rect(c, bx - 1.6, y - 15, 3.2, 3.2, "#7a5a3a");
}


export function drawSteintreppe(c: C, fx: number, fy: number, tx: number, ty: number) {
  const N = 11;
  c.fillStyle = "#332d29";
  c.beginPath(); c.moveTo(fx, fy + 4); c.lineTo(tx, ty + 4); c.lineTo(tx, ty + 15); c.lineTo(fx, fy + 15); c.closePath(); c.fill();
  for (let i = 1; i < N; i++) {
    const px = fx + ((tx - fx) * i) / N, py = fy + ((ty - fy) * i) / N;
    strich(c, px, py + 5, px, py + 14, "rgba(0,0,0,.35)", 0.5);
  }
  for (let i = 0; i < N; i++) {
    const xa = fx + ((tx - fx) * i) / N, xb = fx + ((tx - fx) * (i + 1)) / N;
    const y = fy + ((ty - fy) * (i + 0.5)) / N;
    const x0 = Math.min(xa, xb) - 1.5, w = Math.abs(xb - xa) + 3;
    rect(c, x0, y, w, 5, i % 2 ? "#655d55" : "#6f665d");
    rect(c, x0, y, w, 1.4, "rgba(255,240,220,.2)");
    rect(c, x0, y + 5, w, 1.5, "rgba(0,0,0,.4)");
  }
  // Eisengeländer: vor dem Fenster, Handlauf 50 über den Stufen
  const hoch = KUECHE_WAND.gelaenderHoehe;
  for (let i = 0; i <= N; i += 2) {
    const px = fx + ((tx - fx) * i) / N, py = fy + ((ty - fy) * i) / N;
    strich(c, px, py - hoch, px, py, "#1b1a1d", i === 0 ? 2.6 : 1.2);
    if (i < N) {
      const qx = fx + ((tx - fx) * (i + 1)) / N, qy = fy + ((ty - fy) * (i + 1)) / N;
      c.strokeStyle = "#1b1a1d"; c.lineWidth = 0.8;
      c.beginPath(); c.arc(qx, qy - hoch * 0.5, 2.2, 0, Math.PI * 1.6); c.stroke();
      strich(c, qx, qy - hoch, qx, qy - hoch * 0.5 - 2.2, "#1b1a1d", 0.8);
      strich(c, qx, qy - hoch * 0.5 + 2.2, qx, qy, "#1b1a1d", 0.8);
    }
  }
  disc(c, fx, fy - hoch - 1.4, 2, "#1b1a1d");
  strich(c, fx, fy - hoch, tx, ty - hoch, "#141316", 2.6);
  strich(c, fx, fy - hoch - 0.9, tx, ty - hoch - 0.9, "rgba(190,180,170,.35)", 0.6);
}

/** Eiserne Brüstung am oberen Treppenaustritt (ersetzt das Holzgeländer). */
export function drawEisenBruestung(c: C, x: number, F: number, w: number) {
  strich(c, x, F - 26, x + w, F - 26, "#141316", 2.4);
  strich(c, x, F - 26.8, x + w, F - 26.8, "rgba(190,180,170,.35)", 0.5);
  for (let px = x; px <= x + w + 0.1; px += w / 2) strich(c, px, F - 26, px, F, "#1b1a1d", 1.3);
  c.strokeStyle = "#1b1a1d"; c.lineWidth = 0.7;
  c.beginPath(); c.arc(x + w / 4, F - 13, 2, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(x + (3 * w) / 4, F - 13, 2, 0, Math.PI * 2); c.stroke();
}

/** Nachtlicht: Kerze und Fackel hellen die Multiplikationsebene auf (nur in ihrem Raum). */
export function kuecheLichtpools(m: C, a: C, staerke: number) {
  const quellen: [number, number, number, Rechteck][] = [
    [KUECHE_WAND.kerze[0], KUECHE_WAND.kerze[1], 64, KUECHE_WAND.kueche],
    [KUECHE_WAND.fackel[0], KUECHE_WAND.fackel[1], 86, KUECHE_WAND.treppenhaus],
  ];
  for (const [x, y, r, [rx, ry, rw, rh]] of quellen) {
    for (const [ctx, warm] of [[m, false], [a, true]] as const) {
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
      const r1 = r * 0.78;
      const g = ctx.createRadialGradient(x, y, 3, x, y, r1);
      if (warm) {
        g.addColorStop(0, `rgba(255,170,90,${0.3 * staerke})`);
        g.addColorStop(1, "rgba(255,170,90,0)");
      } else {
        g.addColorStop(0, `rgba(255,255,255,${0.85 * staerke})`);
        g.addColorStop(0.45, `rgba(255,255,255,${0.28 * staerke})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}

const flacker = (t: number, s: number) => 0.84 + 0.1 * Math.sin(t * 13 + s) + 0.06 * Math.sin(t * 31 + s * 2);

/** Flammen von Kerze und Fackel – vor Luni gezeichnet, sie geht davor vorbei. */
export function drawKuecheFlammen(c: C, t: number) {
  const [kx, ky] = KUECHE_WAND.kerze;
  const f = flacker(t, 0);
  ell(c, kx, ky, 1.5, 3.1 * f, "#ffb347");
  ell(c, kx, ky + 0.6, 0.8, 1.8 * f, "#fff1c4");
  const [fx, fy] = KUECHE_WAND.fackel;
  const g = flacker(t, 2);
  for (const [dx, hh, col] of [[-1.4, 8, "#e8641c"], [1.2, 9.5, "#f08a24"], [0, 11, "#ffb03a"], [0, 6.5, "#ffe39a"]] as const) {
    const wob = Math.sin(t * 9 + dx * 3) * 0.7;
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(fx + dx - 2.4, fy);
    c.quadraticCurveTo(fx + dx - 2.2 + wob, fy - hh * g * 0.55, fx + dx + wob * 1.4, fy - hh * g);
    c.quadraticCurveTo(fx + dx + 2.2 + wob, fy - hh * g * 0.55, fx + dx + 2.4, fy);
    c.closePath(); c.fill();
  }
  for (let k = 0; k < 2; k++) {
    const p = (t * 0.8 + k * 0.5) % 1;
    disc(c, fx + Math.sin(t * 3 + k * 4) * 2.5, fy - 10 - p * 12, 0.5, `rgba(255,200,120,${1 - p})`);
  }
}

/** Warmer Schein um die Flammen – nach der Nachtabdunkelung, nachts stärker. */
export function drawKuecheSchein(c: C, t: number, nacht: number) {
  const n = Math.max(0, Math.min(1, nacht));
  const quellen: [number, number, number, number, Rechteck][] = [
    [KUECHE_WAND.kerze[0], KUECHE_WAND.kerze[1] - 1, 22, 0, KUECHE_WAND.kueche],
    [KUECHE_WAND.fackel[0], KUECHE_WAND.fackel[1] - 4, 34, 2, KUECHE_WAND.treppenhaus],
  ];
  c.save();
  c.globalCompositeOperation = "lighter";
  for (const [x, y, r, s, [rx, ry, rw, rh]] of quellen) {
    c.save();
    c.beginPath(); c.rect(rx, ry, rw, rh); c.clip();
    const a = (0.07 + 0.22 * n) * flacker(t, s);
    const g = c.createRadialGradient(x, y, 0.5, x, y, r);
    g.addColorStop(0, `rgba(255,190,110,${a})`);
    g.addColorStop(1, "rgba(255,150,70,0)");
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
  }
  c.restore();
}

/**
 * Leichter lila Schleier über Küche und Treppenhaus. Er hebt die dunklen
 * Steine und das Holz an, ohne das Fensterglas zu tönen. Nachts etwas
 * stärker, damit die Einzelheiten auch bei wenig Licht lesbar bleiben.
 */
export function drawKuecheSchleier(c: C, nacht: number) {
  const n = Math.max(0, Math.min(1, nacht));
  const a = 0.075 + 0.055 * n;
  c.save();
  c.beginPath();
  for (const [x, y, w, h] of [KUECHE_WAND.kueche, KUECHE_WAND.treppenhaus] as Rechteck[]) c.rect(x, y, w, h);
  c.rect(696, 324, 134, 12);
  c.rect(...KUECHE_WAND.fenster);   // Glas bleibt ungetönt
  c.clip("evenodd");
  const g = c.createLinearGradient(0, 212, 0, 448);
  g.addColorStop(0, `rgba(162,120,244,${a})`);
  g.addColorStop(0.55, `rgba(150,110,234,${a * 0.9})`);
  g.addColorStop(1, `rgba(124,88,206,${a * 0.6})`);
  c.globalCompositeOperation = "lighter";
  c.fillStyle = g;
  c.fillRect(556, 208, 282, 244);
  c.restore();
}
