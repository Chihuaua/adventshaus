/* =======================================================================
   ODIN & APOLLO — Lunis zwei Hunde (Little-Computer-People-Stil)

   Odin   : schlanker, eleganter Bau, langer schmaler Fang, durchgehend
            schwarzes Fell (braune Stromung kommt spaeter dazu).
   Apollo : kräftiger, kompakter Bau, markant breiter Kopf mit vollen Wangen
            und Lefzen, schwarz-weiße Border-Collie-Zeichnung.

   Reine Canvas-2D-Primitive, keine externen Assets, keine Browser-APIs –
   1:1 auf die Wii übertragbar. Ursprung (0, 0) = Boden zwischen den Pfoten.
   ======================================================================= */

type C = CanvasRenderingContext2D;
type Pt = [number, number];

export type HundId = "odin" | "apollo";

export type HundPose =
  | "stand"
  | "walk"
  | "trot"
  | "sniff"
  | "sit"
  | "lie"
  | "sleep"
  | "stretch"
  | "wag"
  | "petted"
  | "bark"
  /** Schuldbewusst: Kopf gesenkt, Ohren zurück, Rute eingezogen. */
  | "schuldig";

export interface HundInfo {
  id: HundId;
  name: string;
  fang: "schmal" | "breit";
  grundfarbe: "schwarz";
  fell: "schwarz" | "schwarz-weiss";
}

export const HUNDE_INFO: Record<HundId, HundInfo> = {
  odin: { id: "odin", name: "Odin", fang: "schmal", grundfarbe: "schwarz", fell: "schwarz" },
  apollo: { id: "apollo", name: "Apollo", fang: "breit", grundfarbe: "schwarz", fell: "schwarz-weiss" },
};

/** Vollständig schwarzes Fell für Odin (braune Stromung kommt später dazu). */
export const ODIN_FARBEN = {
  fell: "#282523",
  fellHell: "#373431",
  fellSchatten: "#191818",
  brust: "#634935",
  ohr: "#29221e",
  nase: "#231813",
  auge: "#18110e",
} as const;

/**
 * Schwarzes Fell mit weißem Brustfeld für Apollo; der Kopf ist ganz schwarz.
 * Läufe und Pfoten tragen eine feine braune Stromung.
 */
/** Dunkles Lederhalsband, gemeinsam für beide Hunde. */
export const LEDER_FARBEN = {
  halsband: "#2f2521",
  marke: "#cfa25a",
} as const;

export const APOLLO_FARBEN = {
  fell: "#25272a",
  fellHell: "#3b3e40",
  fellSchatten: "#181a1d",
  brust: "#f1eee5",
  weiss: "#faf8f1",
  weissSchatten: "#d8d5cb",
  /** Braune Stromung auf den schwarzen Pfoten (siehe Zeichnung der Beine). */
  pfoteStrom: "#9d724a",
  pfoteStromMittel: "#7a5a41",
  maske: "#242427",
  lefze: "#181719",
  ohr: "#1b1d20",
  nase: "#161211",
  auge: "#18191b",
} as const;

/* ------------------------------ Helfer -------------------------------- */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function kreis(c: C, x: number, y: number, r: number, farbe: string) {
  c.fillStyle = farbe;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function oval(c: C, x: number, y: number, rx: number, ry: number, rot: number, farbe: string) {
  c.fillStyle = farbe;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fill();
}

function glied(c: C, a: Pt, b: Pt, d: Pt, farbe: string, w1: number, w2: number, pfote: string) {
  c.lineCap = "round";
  c.lineJoin = "round";
  c.strokeStyle = farbe;
  c.lineWidth = w1;
  c.beginPath();
  c.moveTo(a[0], a[1]);
  c.lineTo(b[0], b[1]);
  c.stroke();
  c.lineWidth = w2;
  c.beginPath();
  c.moveTo(b[0], b[1]);
  c.lineTo(d[0], d[1]);
  c.stroke();
  // Kleine gerundete Pfote nach vorn (+x)
  oval(c, d[0] + 0.9, d[1] - 0.5, w2 * 0.68, w2 * 0.48, 0, pfote);
}

/**
 * Feine braune Stromung an Läufen und Pfoten: hauchdünne Strähnen, die an der Pfote
 * beginnen, dem Unterlauf folgen (im Stand also senkrecht) und zum Gelenk hin auslaufen.
 * `staerke` dämpft die Zeichnung auf den abgewandten Läufen.
 */
function pfoteStromung(c: C, bein: Bein, breite: number, staerke = 1) {
  const [gx, gy] = bein.gelenk;
  const [px, py] = bein.pfote;
  const laenge = Math.hypot(gx - px, gy - py);
  if (laenge < 0.5) return;
  // Richtung Pfote -> Gelenk und die Querrichtung dazu
  const ux = (gx - px) / laenge;
  const uy = (gy - py) / laenge;
  const qx = -uy;
  const qy = ux;
  const halb = breite * 0.5;

  c.save();
  c.lineCap = "butt";
  // Je Strähne: Querversatz (Anteil der halben Laufbreite), Beginn, Ende (1 = Gelenk), Farbe.
  // Unterschiedliche Längen, damit die Stromung natürlich und nicht wie ein Raster ausläuft.
  const straehnen: [number, number, number, string][] = [
    [-0.56, 0.05, 0.74, APOLLO_FARBEN.pfoteStrom],
    [-0.2, 0.12, 1.0, APOLLO_FARBEN.pfoteStromMittel],
    [0.18, 0.02, 0.88, APOLLO_FARBEN.pfoteStrom],
    [0.56, 0.14, 0.62, APOLLO_FARBEN.pfoteStromMittel],
  ];
  const STUFEN = 5;
  for (const [quer, von, bis, farbe] of straehnen) {
    const ox = qx * quer * halb;
    const oy = qy * quer * halb;
    c.strokeStyle = farbe;
    for (let i = 0; i < STUFEN; i++) {
      const k0 = lerp(von, bis, i / STUFEN) * laenge;
      const k1 = lerp(von, bis, (i + 1) / STUFEN) * laenge;
      // Zum Gelenk hin dünner und blasser: die Strähne läuft aus.
      c.globalAlpha = staerke * lerp(0.9, 0.12, i / (STUFEN - 1));
      c.lineWidth = lerp(0.36, 0.22, i / (STUFEN - 1));
      c.beginPath();
      c.moveTo(px + ux * k0 + ox, py + uy * k0 + oy);
      c.lineTo(px + ux * k1 + ox, py + uy * k1 + oy);
      c.stroke();
    }
  }
  // Pfote: drei hauchfeine senkrechte Zehenstriche
  c.globalAlpha = staerke * 0.8;
  c.strokeStyle = APOLLO_FARBEN.pfoteStrom;
  c.lineWidth = 0.26;
  for (const [zx, oben] of [[-0.7, 1.0], [0.25, 1.25], [1.2, 0.9]]) {
    c.beginPath();
    c.moveTo(px + 0.9 + zx, py - oben);
    c.lineTo(px + 0.9 + zx, py - 0.1);
    c.stroke();
  }
  c.restore();
}

/* ------------------------------- Rig ---------------------------------- */

interface Bein {
  huefte: Pt;
  gelenk: Pt;
  pfote: Pt;
}

interface HundRig {
  kruppe: Pt;
  schulter: Pt;
  brustTiefe: number;
  taille: number;
  kopf: Pt;
  kopfNeig: number;
  maulOffen: number;
  ruteWinkel: number;
  ruteWedeln: number;
  ohrHub: number;
  augeZu: boolean;
  augeFroh: boolean;
  hintenFern: Bein;
  hintenNah: Bein;
  vornFern: Bein;
  vornNah: Bein;
  liegend: boolean;
}

function schrittPfote(basisX: number, phase: number, weite: number, hub: number): { pfote: Pt; beug: number } {
  const s = Math.sin(phase);
  const h = Math.max(0, Math.cos(phase)) * hub;
  return { pfote: [basisX + s * weite, -h], beug: h * 0.35 };
}

function baueHundRig(id: HundId, pose: HundPose, t: number, gang: number, blinzeln: boolean): HundRig {
  const breit = id === "apollo";
  const atem = Math.sin(t * 2.3) * 0.35;
  // Brust und Flanke leicht kräftiger, ohne Gangart, Größe oder Silhouette zu ändern.
  const brustBase = breit ? 10.7 : 9.0;
  const tailleBase = breit ? 8.2 : 6.8;

  // Grundhaltung: ruhiges Stehen
  const r: HundRig = {
    kruppe: [breit ? -11.4 : -11.0, -18.2 + atem * 0.25],
    schulter: [breit ? 8.8 : 8.5, (breit ? -19.6 : -19.4) + atem * 0.35],
    brustTiefe: brustBase + atem * 0.25,
    taille: tailleBase,
    kopf: [breit ? 13.8 : 13.6, (breit ? -24.2 : -24.8) + atem * 0.3],
    kopfNeig: Math.sin(t * 1.1) * 0.03,
    maulOffen: 0,
    ruteWinkel: -0.55,
    ruteWedeln: Math.sin(t * 3.8) * 0.14,
    ohrHub: 0,
    augeZu: blinzeln,
    augeFroh: false,
    hintenFern: { huefte: [-10.2, -15.5], gelenk: [-12.2, -8.5], pfote: [-10.5, -0.8] },
    hintenNah: { huefte: [-8.8, -15.2], gelenk: [-10.8, -8.2], pfote: [-8.8, -0.8] },
    vornFern: { huefte: [6.8, -14.2], gelenk: [6.6, -7.4], pfote: [7.0, -0.8] },
    vornNah: { huefte: [8.4, -14.0], gelenk: [8.3, -7.2], pfote: [8.8, -0.8] },
    liegend: false,
  };

  switch (pose) {
    case "walk":
    case "trot": {
      const trab = pose === "trot";
      const weite = trab ? 6.4 : 4.5;
      const hub = trab ? 3.8 : 2.4;
      const feder = Math.abs(Math.sin(gang)) * (trab ? 1.5 : 0.7);
      r.kruppe[1] -= feder * 0.85;
      r.schulter[1] -= feder;
      r.kopf[1] -= feder * 0.9 - Math.cos(gang * 2) * 0.45;
      r.kopf[0] += trab ? 0.8 : 0.3;
      r.kopfNeig = trab ? -0.04 : 0.04;
      r.maulOffen = trab ? 0.32 : 0;
      r.ruteWinkel = trab ? -0.82 : -0.62;
      r.ruteWedeln = Math.sin(t * (trab ? 11 : 6.5)) * (trab ? 0.28 : 0.18);
      r.ohrHub = Math.abs(Math.cos(gang)) * (trab ? 0.45 : 0.18);
      // Kreuzgang: vorn-nah + hinten-fern synchron, Gegenseite um PI versetzt
      const vn = schrittPfote(8.6, gang, weite, hub);
      const vf = schrittPfote(6.8, gang + Math.PI, weite, hub);
      const hf = schrittPfote(-10.2, gang + 0.25, weite, hub * 0.95);
      const hn = schrittPfote(-8.6, gang + Math.PI + 0.25, weite, hub * 0.95);
      r.vornNah = { huefte: [8.4, r.schulter[1] + 5.2], gelenk: [lerp(8.4, vn.pfote[0], 0.55) + 0.6, -7.4 - vn.beug], pfote: [vn.pfote[0], vn.pfote[1] - 0.8] };
      r.vornFern = { huefte: [6.8, r.schulter[1] + 5.2], gelenk: [lerp(6.8, vf.pfote[0], 0.55) + 0.5, -7.4 - vf.beug], pfote: [vf.pfote[0], vf.pfote[1] - 0.8] };
      r.hintenNah = { huefte: [-8.8, r.kruppe[1] + 3.0], gelenk: [lerp(-8.8, hn.pfote[0], 0.5) - 1.8, -8.2 - hn.beug], pfote: [hn.pfote[0], hn.pfote[1] - 0.8] };
      r.hintenFern = { huefte: [-10.2, r.kruppe[1] + 3.0], gelenk: [lerp(-10.2, hf.pfote[0], 0.5) - 1.8, -8.2 - hf.beug], pfote: [hf.pfote[0], hf.pfote[1] - 0.8] };
      break;
    }

    case "sniff": {
      const schnupper = Math.sin(t * 9.5) * 0.45;
      r.schulter[1] = -17.4 + atem * 0.2;
      r.kruppe[1] = -18.8;
      r.kopf = [breit ? 15.2 : 15.0, -10.2 + schnupper];
      r.kopfNeig = 0.62 + Math.sin(t * 5) * 0.05;
      r.ruteWinkel = -0.35;
      r.ruteWedeln = Math.sin(t * 7.5) * 0.24;
      r.ohrHub = -0.2;
      r.vornNah.pfote = [9.8, -0.8];
      r.vornFern.pfote = [7.4, -0.8];
      break;
    }

    case "sit": {
      r.kruppe = [-6.6, -8.4];
      r.schulter = [5.8, -19.6 + atem * 0.3];
      r.brustTiefe = brustBase * 0.96;
      r.taille = tailleBase * 1.15;
      r.kopf = [breit ? 10.6 : 10.2, (breit ? -25.4 : -26.0) + atem * 0.3];
      r.kopfNeig = -0.04 + Math.sin(t * 1.2) * 0.04;
      r.ruteWinkel = -0.12;
      r.ruteWedeln = Math.sin(t * 4.4) * 0.14;
      r.hintenFern = { huefte: [-6.0, -7.0], gelenk: [-1.8, -4.6], pfote: [1.4, -0.8] };
      r.hintenNah = { huefte: [-5.0, -6.4], gelenk: [-0.8, -4.2], pfote: [2.6, -0.8] };
      r.vornFern = { huefte: [5.0, -14.6], gelenk: [5.6, -7.5], pfote: [6.3, -0.8] };
      r.vornNah = { huefte: [6.6, -14.2], gelenk: [7.3, -7.2], pfote: [8.2, -0.8] };
      break;
    }

    case "wag":
    case "petted": {
      const streichel = pose === "petted";
      // Freudig sitzend (beim Streicheln) oder freudig stehend-wedelnd
      if (streichel) {
        const schmieg = Math.sin(t * 2.8) * 0.5;
        r.kruppe = [-6.6, -8.4];
        r.schulter = [6.0, -19.4 + atem * 0.3];
        r.brustTiefe = brustBase * 0.96;
        r.taille = tailleBase * 1.15;
        r.kopf = [breit ? 11.0 : 10.6, (breit ? -25.6 : -26.2) + schmieg];
        r.kopfNeig = -0.13 + schmieg * 0.04;
        r.augeFroh = true;
        r.augeZu = true;
        r.maulOffen = 0.26;
        r.ruteWinkel = -0.28;
        r.ruteWedeln = Math.sin(t * 15) * 0.38;
        r.ohrHub = 0.28;
        r.hintenFern = { huefte: [-6.0, -7.0], gelenk: [-1.8, -4.6], pfote: [1.4, -0.8] };
        r.hintenNah = { huefte: [-5.0, -6.4], gelenk: [-0.8, -4.2], pfote: [2.6, -0.8] };
        r.vornFern = { huefte: [5.0, -14.6], gelenk: [5.6, -7.5], pfote: [6.3, -0.8] };
        r.vornNah = { huefte: [6.6, -14.2], gelenk: [7.3, -7.2], pfote: [8.2, -0.8] };
      } else {
        const wipp = Math.abs(Math.sin(t * 7)) * 0.8;
        r.kruppe[1] -= wipp;
        r.kopf[1] -= 0.6;
        r.kopfNeig = -0.08;
        r.maulOffen = 0.3;
        r.ruteWinkel = -0.85;
        r.ruteWedeln = Math.sin(t * 16) * 0.46;
        r.ohrHub = 0.35;
      }
      break;
    }

    case "lie":
    case "sleep": {
      const schlaeft = pose === "sleep";
      const ruhAtem = Math.sin(t * (schlaeft ? 1.3 : 2.0)) * 0.42;
      r.liegend = true;
      r.kruppe = [-10.5, -8.4 + ruhAtem * 0.35];
      r.schulter = [7.6, -9.4 + ruhAtem * 0.45];
      r.brustTiefe = brustBase * 0.88 + ruhAtem * 0.25;
      r.taille = tailleBase * 0.95;
      r.kopf = schlaeft
        ? [breit ? 13.6 : 13.4, -5.8 + ruhAtem * 0.2]
        : [breit ? 12.6 : 12.4, -14.2 + ruhAtem * 0.25];
      r.kopfNeig = schlaeft ? 0.22 : 0.05;
      r.augeZu = schlaeft || blinzeln;
      r.ruteWinkel = 0.45;
      r.ruteWedeln = schlaeft ? 0 : Math.sin(t * 2.4) * 0.08;
      r.hintenFern = { huefte: [-10.2, -5.8], gelenk: [-6.8, -2.5], pfote: [-3.5, -0.8] };
      r.hintenNah = { huefte: [-9.0, -5.2], gelenk: [-5.0, -2.0], pfote: [-1.4, -0.8] };
      r.vornFern = { huefte: [6.8, -4.6], gelenk: [11.2, -2.0], pfote: [15.4, -0.8] };
      r.vornNah = { huefte: [8.0, -4.0], gelenk: [12.6, -1.6], pfote: [17.2, -0.8] };
      break;
    }

    case "stretch": {
      // Vorderbeine lang nach vorn gestreckt, Kruppe hoch (Spielverbeugung / Recken)
      r.kruppe = [-10.6, -20.2];
      r.schulter = [7.2, -12.2];
      r.kopf = [breit ? 12.8 : 12.6, -14.6];
      r.kopfNeig = 0.14;
      r.ruteWinkel = -0.95;
      r.ruteWedeln = Math.sin(t * 12) * 0.34;
      r.augeFroh = true;
      r.vornFern = { huefte: [6.4, -9.5], gelenk: [11.4, -4.2], pfote: [16.2, -0.8] };
      r.vornNah = { huefte: [7.8, -9.0], gelenk: [13.0, -3.6], pfote: [18.0, -0.8] };
      r.hintenFern = { huefte: [-10.0, -17.0], gelenk: [-12.0, -9.0], pfote: [-10.6, -0.8] };
      r.hintenNah = { huefte: [-8.6, -16.6], gelenk: [-10.6, -8.6], pfote: [-8.8, -0.8] };
      break;
    }

    case "schuldig": {
      r.kopf = [r.kopf[0] - 1.4, r.kopf[1] + 6.4];
      r.kopfNeig = 0.42;
      r.ohrHub = -0.38;
      r.ruteWinkel = -1.32;
      r.ruteWedeln = Math.sin(t * 1.8) * 0.02;
      break;
    }

    case "bark": {
      const stoss = Math.max(0, Math.sin(t * 14));
      r.schulter[1] -= stoss * 0.9;
      r.kopf[1] -= 0.8 + stoss * 1.1;
      r.kopfNeig = -0.18 - stoss * 0.1;
      r.maulOffen = 0.35 + stoss * 0.65;
      r.ruteWinkel = -0.8;
      r.ruteWedeln = Math.sin(t * 12) * 0.3;
      r.ohrHub = 0.4;
      break;
    }

    default:
      break;
  }

  return r;
}

/* ------------------------------ Rumpf ----------------------------------- */

/** Organischer Hunderumpf + Hals als geschlossener Pfad (für Füllung & Clip). */
function rumpfPfad(c: C, r: HundRig, breit: boolean) {
  const [kx, ky] = r.kruppe;
  const [sx, sy] = r.schulter;
  const [hx, hy] = r.kopf;
  const mx = (kx + sx) * 0.5;
  const rueckenY = lerp(ky, sy, 0.5) + (r.liegend ? 0.4 : 0.6);
  const brustX = sx + (breit ? 4.1 : 3.2);
  const brustY = Math.min(-0.9, sy + r.brustTiefe);
  // Bauchlinie folgt der Rückenneigung, damit Sitzen, Strecken und Liegen voll bleiben
  const bauchY = Math.min(-0.8, lerp(ky, sy, 0.45) + r.taille);
  const kruppeUnten = Math.min(-0.8, ky + (breit ? 7.8 : 6.8));
  const halsDicke = breit ? 4.1 : 3.0;

  c.beginPath();
  // Kruppe oben -> sanfte Rückenlinie -> Widerrist -> Nacken zum Kopf
  c.moveTo(kx - (breit ? 2.4 : 1.8), ky + 2.8);
  c.quadraticCurveTo(kx - 1.2, ky - 0.8, kx + 3.2, ky - 0.3);
  c.quadraticCurveTo(mx, rueckenY, sx - 1.2, sy - 0.4);
  c.quadraticCurveTo(sx + 1.4, sy - 1.4, hx - halsDicke, hy + 1.4);
  // Kehle -> stolze Brust -> aufgezogene Bauchlinie -> Oberschenkel -> Kruppe
  c.lineTo(hx + (breit ? 1.4 : 0.8), hy + (breit ? 4.4 : 3.6));
  c.quadraticCurveTo(brustX + 0.8, lerp(hy + 4, brustY, 0.55), brustX - 0.6, brustY);
  c.quadraticCurveTo(sx - 1.8, brustY + 1.2, mx + 1.2, bauchY);
  c.quadraticCurveTo(kx + 4.4, bauchY - 0.6, kx + 1.4, kruppeUnten);
  c.quadraticCurveTo(kx - (breit ? 2.8 : 2.1), kruppeUnten - 0.8, kx - (breit ? 2.4 : 1.8), ky + 2.8);
  c.closePath();
}

/* ------------------------------ Rute ----------------------------------- */

function zeichneRute(c: C, id: HundId, r: HundRig) {
  const breit = id === "apollo";
  const [kx, ky] = r.kruppe;
  const basisX = kx - (breit ? 1.6 : 1.2);
  const basisY = ky + 1.4;
  const wkl = Math.PI + r.ruteWinkel + r.ruteWedeln;
  const laenge = breit ? 9.5 : 11.2;
  const mitteX = basisX + Math.cos(wkl) * laenge * 0.55;
  const mitteY = basisY + Math.sin(wkl) * laenge * 0.55;
  const spitzeX = basisX + Math.cos(wkl + (breit ? 0.22 : 0.34)) * laenge;
  const spitzeY = basisY + Math.sin(wkl + (breit ? 0.22 : 0.34)) * laenge;

  c.lineCap = "round";
  c.strokeStyle = breit ? APOLLO_FARBEN.fell : ODIN_FARBEN.fell;
  c.lineWidth = breit ? 3.1 : 2.6;
  c.beginPath();
  c.moveTo(basisX, basisY);
  c.quadraticCurveTo(mitteX, mitteY, spitzeX, spitzeY);
  c.stroke();

  if (breit) {
    // Schwarze Rutenspitze als heller Schimmer auf dem schwarzen Fell.
    c.strokeStyle = APOLLO_FARBEN.fellHell;
    c.lineWidth = 1.05;
    c.beginPath();
    c.moveTo(lerp(mitteX, spitzeX, 0.62), lerp(mitteY, spitzeY, 0.62));
    c.lineTo(spitzeX, spitzeY);
    c.stroke();
  }
}

/* ----------------------------- Köpfe ----------------------------------- */

/**
 * Odin: schwarzer Schädel mit langer, schmaler Silhouette des Fangs;
 * warme braune Spuren auf Stirn und Wange verbinden Kopf und Körper.
 */
function zeichneOdinKopf(c: C, r: HundRig) {
  const F = ODIN_FARBEN;
  c.save();
  c.translate(r.kopf[0], r.kopf[1]);
  c.rotate(r.kopfNeig);

  // Hinteres Ohr, schwarz mit warmbraunem Innensaum
  c.fillStyle = F.fellSchatten;
  c.beginPath();
  c.moveTo(0.8, -3.1);
  c.quadraticCurveTo(1.8, -5.8 - r.ohrHub * 1.4, -0.8, -4.6 - r.ohrHub * 0.8);
  c.lineTo(-1.2, -2.5);
  c.closePath();
  c.fill();

  // Schlanker, edler Oberkopf
  oval(c, -0.4, -0.4, 4.6, 3.8, -0.08, F.fell);
  // Gedämpfter Schimmer auf dem schwarzen Schädel
  oval(c, -0.2, -2.1, 3.3, 1.6, -0.1, F.fellHell);

  // Unterkiefer (öffnet sich sanft beim Hecheln oder Bellen)
  const offen = r.maulOffen * 1.6;
  if (r.maulOffen > 0.12) {
    // Kleine rosa Zunge
    oval(c, 6.8, 1.9 + offen * 0.45, 2.0, 0.75, 0.18, "#e07b7e");
  }
  c.fillStyle = F.brust;
  c.beginPath();
  c.moveTo(1.6, 1.2);
  c.lineTo(9.3, 1.1 + offen);
  c.quadraticCurveTo(9.0, 2.15 + offen, 7.2, 2.25 + offen * 0.8);
  c.lineTo(1.2, 2.7);
  c.closePath();
  c.fill();

  // Langer, schmaler, fein zulaufender Fang (Odins Erkennungsmerkmal!)
  c.fillStyle = F.fell;
  c.beginPath();
  c.moveTo(2.0, -2.5);
  // Flacher, edler Stop und gerader schmaler Nasenrücken
  c.quadraticCurveTo(3.8, -1.5, 10.3, -0.55);
  c.quadraticCurveTo(11.1, 0.25, 10.0, 1.25);
  c.quadraticCurveTo(6.4, 1.55, 1.8, 1.6);
  c.closePath();
  c.fill();

  // Feine dunkle Lefzenlinie
  c.strokeStyle = F.fellHell;
  c.lineWidth = 0.65;
  c.beginPath();
  c.moveTo(3.4, 1.35);
  c.quadraticCurveTo(6.8, 1.45, 9.7, 1.05);
  c.stroke();

  // Feine dunkle Nasenspitze mit Glanzpunkt
  oval(c, 10.35, -0.05, 1.25, 0.95, 0.1, F.nase);
  kreis(c, 10.1, -0.4, 0.35, "rgba(255,255,255,.65)");

  // Ausdrucksvolles Auge
  const ax = 2.3;
  const ay = -1.15;
  if (r.augeZu) {
    c.strokeStyle = F.auge;
    c.lineWidth = 0.95;
    c.beginPath();
    if (r.augeFroh) c.arc(ax, ay + 0.4, 1.2, Math.PI * 1.15, Math.PI * 1.88);
    else c.arc(ax, ay - 0.3, 1.15, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();
  } else {
    kreis(c, ax, ay, 1.15, F.auge);
    kreis(c, ax + 0.38, ay - 0.38, 0.38, "#ffffff");
  }

  // Weich zurückgefaltetes schwarzes Ohr
  const oh = r.ohrHub * 1.3;
  c.fillStyle = F.ohr;
  c.beginPath();
  c.moveTo(-1.1, -2.9);
  c.quadraticCurveTo(-4.6, -3.5 - oh, -5.6, 0.6 - oh * 0.7);
  c.quadraticCurveTo(-4.8, 2.3 - oh * 0.5, -2.4, 1.2 - oh * 0.3);
  c.quadraticCurveTo(-1.2, -0.4, -0.4, -2.1);
  c.closePath();
  c.fill();

  c.restore();
}

/**
 * Apollo: kräftiger, breiter Kopf im Profil – er schaut wie Odin nach vorn.
 * Hoher Oberkopf mit steilem Stop, kurzer tiefer Fang mit weicher Hängelefze
 * und volles Klappohr. Der Kopf ist durchgehend schwarz, ohne weiße Zeichnung.
 */
function zeichneApolloKopf(c: C, r: HundRig) {
  const F = APOLLO_FARBEN;
  c.save();
  c.translate(r.kopf[0], r.kopf[1]);
  c.rotate(r.kopfNeig);

  const oh = r.ohrHub * 1.2;

  // Abgewandtes Ohr: schmaler dunkler Ansatz hinter dem Scheitel
  c.fillStyle = F.fellSchatten;
  c.beginPath();
  c.moveTo(1.4, -4.6);
  c.quadraticCurveTo(2.6, -7.0 - oh * 1.2, -0.6, -5.9 - oh * 0.7);
  c.lineTo(-1.2, -3.6);
  c.closePath();
  c.fill();

  // Breiter, hoher Oberkopf mit steilem Stop und voller Wange
  c.fillStyle = F.fell;
  c.beginPath();
  c.moveTo(-4.9, 1.8);
  c.quadraticCurveTo(-5.7, -2.8, -3.3, -5.1);
  c.quadraticCurveTo(-0.6, -6.7, 2.3, -5.3);
  c.quadraticCurveTo(4.1, -4.3, 4.2, -2.2);
  c.lineTo(4.0, 2.6);
  c.quadraticCurveTo(1.0, 4.5, -2.6, 3.7);
  c.quadraticCurveTo(-4.6, 3.3, -4.9, 1.8);
  c.closePath();
  c.fill();
  // Gedämpfter Schimmer auf dem Scheitel
  oval(c, -0.5, -3.9, 3.3, 1.4, -0.12, F.fellHell);

  // Unterkiefer (öffnet sich beim Hecheln oder Bellen) mit Zunge
  const offen = r.maulOffen * 1.5;
  if (r.maulOffen > 0.12) {
    oval(c, 5.6, 3.0 + offen * 0.5, 1.9, 0.85, 0.15, "#e37e82");
  }
  c.fillStyle = F.lefze;
  c.beginPath();
  c.moveTo(1.2, 2.0);
  c.lineTo(7.5, 2.1 + offen);
  c.quadraticCurveTo(7.4, 3.5 + offen, 5.6, 3.7 + offen * 0.8);
  c.lineTo(0.8, 3.9);
  c.closePath();
  c.fill();

  // Kurzer, tiefer, stumpfer Fang mit weich herabhängender Lefze (Apollos Erkennungsmerkmal)
  c.fillStyle = F.maske;
  c.beginPath();
  c.moveTo(2.6, -2.7);
  // Kurzer gerader Nasenrücken hinter dem steilen Stop
  c.quadraticCurveTo(4.8, -2.4, 7.6, -1.9);
  c.quadraticCurveTo(8.9, -1.2, 8.5, 0.6);
  // Lefze rundet sich vorn nach unten und läuft zur Wange zurück
  c.quadraticCurveTo(8.3, 2.7, 6.5, 3.0);
  c.quadraticCurveTo(4.4, 3.3, 2.2, 2.5);
  c.closePath();
  c.fill();

  // Feine Lefzenlinie
  c.strokeStyle = F.fellHell;
  c.lineWidth = 0.65;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(3.3, 1.5);
  c.quadraticCurveTo(5.9, 2.0, 8.1, 1.0);
  c.stroke();

  // Breite, kräftige Nase mit Glanzpunkt
  oval(c, 8.35, -1.15, 1.5, 1.15, 0.1, F.nase);
  kreis(c, 8.0, -1.55, 0.36, "rgba(255,255,255,.6)");

  // Kräftiger Brauenbogen über dem Auge
  oval(c, 2.3, -3.25, 1.6, 0.7, -0.22, F.fellHell);

  // Auge
  const ax = 2.45;
  const ay = -1.85;
  if (r.augeZu) {
    c.strokeStyle = F.auge;
    c.lineWidth = 0.95;
    c.beginPath();
    if (r.augeFroh) c.arc(ax, ay + 0.4, 1.18, Math.PI * 1.13, Math.PI * 1.88);
    else c.arc(ax, ay - 0.3, 1.14, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();
  } else {
    kreis(c, ax, ay, 1.14, F.auge);
    kreis(c, ax + 0.38, ay - 0.38, 0.38, "#ffffff");
  }

  // Volles Klappohr: hoch angesetzt, hängt weich an der Wange herab
  c.fillStyle = F.ohr;
  c.beginPath();
  c.moveTo(-0.9, -4.3);
  c.quadraticCurveTo(-5.2, -6.0 - oh, -6.6, 0.2 - oh * 0.7);
  c.quadraticCurveTo(-5.9, 2.7 - oh * 0.5, -3.3, 1.5 - oh * 0.3);
  c.quadraticCurveTo(-1.7, -0.6, -0.5, -3.0);
  c.closePath();
  c.fill();
  // Feine Ohrkante, damit sich das Ohr vom schwarzen Kopf abhebt
  c.strokeStyle = F.fellHell;
  c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(-0.6, -3.1);
  c.quadraticCurveTo(-1.8, -0.7, -3.3, 1.4);
  c.stroke();

  c.restore();
}

/* --------------------------- Hauptzeichnung ---------------------------- */

export interface HundZeichenOpts {
  face?: 1 | -1;
  pose?: HundPose;
  t?: number;
  gang?: number;
  blinzeln?: boolean;
  scale?: number;
  /** Bodenschatten zeichnen (in Übersichten ausgeschaltet). */
  schatten?: boolean;
  /** Abgekürzter Alias, damit Sheets denselben Namen wie bei Luni nutzen. */
  shadow?: boolean;
  /** Schuldbewusst: Kopf tief, Ohren zurück, Rute eingezogen (über jeder Pose). */
  guilty?: boolean;
}

/** Zeichnet Odin oder Apollo an Weltkoordinate (x, y = Bodenlinie). */
export function drawHund(c: C, id: HundId, x: number, y: number, opts: HundZeichenOpts = {}) {
  const {
    face = 1,
    pose = "stand",
    t = 0,
    gang = 0,
    blinzeln = false,
    scale = 1,
    schatten,
    shadow,
    guilty = false,
  } = opts;
  const zeigeSchatten = schatten ?? shadow ?? true;

  const breit = id === "apollo";
  const r = baueHundRig(id, pose, t, gang, blinzeln);
  if (guilty) {
    // Schuldbewusst: Kopf tief, Ohren zurück, Rute fest eingezogen – die
    // Beinbewegung der jeweiligen Pose bleibt erhalten.
    r.kopf = [r.kopf[0] - 1.4, r.kopf[1] + 6.4];
    r.kopfNeig += 0.42;
    r.ohrHub = -0.38;
    r.ruteWinkel = -1.32;
    r.ruteWedeln = Math.sin(t * 1.8) * 0.02;
    r.augeFroh = false;
  }

  c.save();
  c.translate(x, y);

  // Weicher Bodenschatten (wie bei Luni)
  if (zeigeSchatten) {
    c.fillStyle = "rgba(0,0,0,.24)";
    c.beginPath();
    c.ellipse(0.5 * face * scale, 1.1 * scale, (r.liegend ? 16.5 : 13.5) * scale, 2.7 * scale, 0, 0, Math.PI * 2);
    c.fill();
  }

  c.scale(scale * face, scale);

  const wOben = breit ? 4.6 : 3.7;
  const wUnten = breit ? 3.35 : 2.65;
  const fernFarbe = breit ? APOLLO_FARBEN.fellSchatten : ODIN_FARBEN.fellSchatten;
  const nahFarbe = breit ? APOLLO_FARBEN.fell : ODIN_FARBEN.fell;
  const fernPfote = breit ? APOLLO_FARBEN.fellSchatten : ODIN_FARBEN.fellSchatten;
  const nahPfote = breit ? APOLLO_FARBEN.fell : ODIN_FARBEN.fell;

  // 1. Hintere (abgewandte) Beine
  glied(c, r.hintenFern.huefte, r.hintenFern.gelenk, r.hintenFern.pfote, fernFarbe, wOben * 0.92, wUnten * 0.92, fernPfote);
  glied(c, r.vornFern.huefte, r.vornFern.gelenk, r.vornFern.pfote, fernFarbe, wOben * 0.88, wUnten * 0.88, fernPfote);
  if (breit) {
    pfoteStromung(c, r.hintenFern, wUnten * 0.86, 0.55);
    pfoteStromung(c, r.vornFern, wUnten * 0.9, 0.55);
  }

  // 2. Rute
  zeichneRute(c, id, r);

  // 3. Rumpf & Hals (inkl. Fellzeichnung)
  c.save();
  rumpfPfad(c, r, breit);
  c.fillStyle = nahFarbe;
  c.fill();
  c.clip();

  const rueckenWkl = Math.atan2(r.schulter[1] - r.kruppe[1], r.schulter[0] - r.kruppe[0]);
  const mitteX = lerp(r.kruppe[0], r.schulter[0], 0.5);
  const mitteY = lerp(r.kruppe[1], r.schulter[1], 0.5);
  if (breit) {
    // Apollo: komplett schwarzer Rumpf; weiß nur als Börte mittig auf der Brust.
    oval(c, mitteX, mitteY + 0.6, 11.5, 2.6, rueckenWkl, APOLLO_FARBEN.fellHell);
    oval(c, mitteX, mitteY + r.taille + 0.55, 10.0, 2.6, rueckenWkl, APOLLO_FARBEN.fellSchatten);
    // Mittiges Brustfeld: ca. ein Drittel der Rumpfbreite (Rumpf geht bis x = schulter + 4.1).
    const brustBreite = (breit ? 4.1 : 3.2) * 1.35;
    const brustX0 = r.schulter[0] + (breit ? 4.1 : 3.2) - brustBreite / 2;
    c.fillStyle = APOLLO_FARBEN.brust;
    c.beginPath();
    c.moveTo(brustX0, r.schulter[1] - 0.4);
    c.quadraticCurveTo(brustX0 + brustBreite / 2, r.schulter[1] - 1.6, brustX0 + brustBreite, r.schulter[1] - 0.4);
    c.lineTo(brustX0 + brustBreite, r.schulter[1] + r.brustTiefe - 1.4);
    c.quadraticCurveTo(brustX0 + brustBreite / 2, r.schulter[1] + r.brustTiefe + 0.9, brustX0, r.schulter[1] + r.brustTiefe - 1.4);
    c.closePath();
    c.fill();
    // Weiche Kante nach unten, damit die Börte nicht wie ein Aufkleber wirkt.
    c.fillStyle = APOLLO_FARBEN.weiss;
    c.beginPath();
    c.moveTo(brustX0 + 1.2, r.schulter[1] + 0.2);
    c.quadraticCurveTo(r.schulter[0] + (breit ? 4.1 : 3.2), r.schulter[1] + 2.4, brustX0 + brustBreite - 1.2, r.schulter[1] + r.brustTiefe - 1.2);
    c.lineTo(brustX0 + brustBreite - 2.4, r.schulter[1] + r.brustTiefe - 1.6);
    c.quadraticCurveTo(r.schulter[0] + (breit ? 4.1 : 3.2), r.schulter[1] + 2.0, brustX0 + 1.2, r.schulter[1] + 0.2);
    c.closePath();
    c.fill();
  } else {
    // Odin: durchgehend schwarz, nur dezente Tiefenwirkung am Bauch.
    oval(c, mitteX, mitteY + 0.4, 10.8, 2.2, rueckenWkl, ODIN_FARBEN.fellHell);
    oval(c, mitteX + 0.5, mitteY + r.taille + 0.5, 7.5, 1.2, rueckenWkl, ODIN_FARBEN.fellSchatten);
  }
  c.restore();

  // 4. Halsband mit kleiner Goldmarke
  const hbx = lerp(r.schulter[0], r.kopf[0], 0.56);
  const hby = lerp(r.schulter[1], r.kopf[1], 0.52);
  // Dunkles Lederhalsband für beide Hunde.
  c.strokeStyle = LEDER_FARBEN.halsband;
  c.lineWidth = breit ? 2.4 : 1.9;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(hbx - (breit ? 2.8 : 2.1), hby - 0.8);
  c.quadraticCurveTo(hbx + 0.5, hby + 1.8, hbx + (breit ? 3.2 : 2.5), hby + 2.6);
  c.stroke();
  kreis(c, hbx + (breit ? 2.8 : 2.2), hby + 3.5, 1.15, LEDER_FARBEN.marke);

  // 5. Vordere (zugewandte) Beine + Keulenrundung
  oval(
    c,
    r.hintenNah.huefte[0] - 0.4,
    r.hintenNah.huefte[1] + 0.4,
    breit ? 4.1 : 3.45,
    breit ? 4.7 : 3.9,
    0.2,
    nahFarbe,
  );
  glied(c, r.hintenNah.huefte, r.hintenNah.gelenk, r.hintenNah.pfote, nahFarbe, wOben, wUnten, nahPfote);
  glied(c, r.vornNah.huefte, r.vornNah.gelenk, r.vornNah.pfote, nahFarbe, wOben * 0.94, wUnten * 0.94, nahPfote);

  // Apollo: schwarze Pfoten mit feiner brauner Stromung, ohne Bein-Verformung.
  if (breit) {
    pfoteStromung(c, r.hintenNah, wUnten * 0.94);
    pfoteStromung(c, r.vornNah, wUnten);
  }

  // 6. Charakterkopf
  if (breit) zeichneApolloKopf(c, r);
  else zeichneOdinKopf(c, r);

  // 7. Feine Bellen-Schallbögen (rein grafisch, ohne Text)
  if (pose === "bark" && r.maulOffen > 0.55) {
    const mx = r.kopf[0] + (breit ? 8.5 : 12.2);
    const my = r.kopf[1] - 0.5;
    c.strokeStyle = "rgba(255,238,200,.55)";
    c.lineWidth = 1.0;
    for (const rr of [2.8, 5.2]) {
      c.beginPath();
      c.arc(mx, my, rr, -0.65, 0.65);
      c.stroke();
    }
  }

  c.restore();

  // 8. Sanfte Schlaf-Atempunkte (ohne Schrift, rein prozedural)
  if (pose === "sleep") {
    for (let i = 0; i < 2; i++) {
      const p = ((t * 0.38 + i * 0.5) % 1 + 1) % 1;
      const alpha = Math.sin(p * Math.PI) * 0.55;
      kreis(
        c,
        x + face * (12 + p * 6) * scale,
        y - (12 + p * 11) * scale,
        (0.9 + p * 0.9) * scale,
        `rgba(210,226,255,${alpha})`,
      );
    }
  }
}

export function drawOdin(c: C, x: number, y: number, opts?: HundZeichenOpts) {
  drawHund(c, "odin", x, y, opts);
}

export function drawApollo(c: C, x: number, y: number, opts?: HundZeichenOpts) {
  drawHund(c, "apollo", x, y, opts);
}

/* =======================================================================
   RUHIGES EIGENLEBEN IM HAUS UND IM GARTEN
   ======================================================================= */

const HUND_SCALE = 1.02;
const BODEN_Y = [572, 448, 324, 200] as const;
const HAUS_RECHTS = 830;
const KELLER_TUER_X = 590;
/** Offene Treppe EG (818) <-> 1. Stock (694) und Kellertreppe (413 <-> 523). */
const TREPPE_KELLER = { unten: 0, oben: 1, fussX: 413, kopfX: 523 };
const TREPPE_OG = { unten: 1, oben: 2, fussX: 818, kopfX: 694 };

type Schritt =
  | { k: "geh"; x: number; trab: boolean }
  | { k: "treppe"; von: 0 | 1 | 2; nach: 0 | 1 | 2; fussX: number; kopfX: number; keller: boolean; t: number };

export interface HundSnapshot {
  x: number;
  floor: 0 | 1 | 2;
  face: 1 | -1;
}

export interface HundZustand {
  id: HundId;
  x: number;
  floor: 0 | 1 | 2;
  face: 1 | -1;
  pose: HundPose;
  gang: number;
  t: number;
  timer: number;
  blinzeln: number;
  naechstBlinzel: number;
  schritte: Schritt[];
  /** Wie lange der Hund schon im Garten ist, und wann er von selbst heimkehrt. */
  gartenZeit: number;
  gartenMax: number;
  /** Kurze Sperre nach Heimkehr, damit er nicht sofort wieder hinausrennt. */
  gartenPause: number;
  /** Wartet auf Luni zum Streicheln oder wird gerade gestreichelt. */
  wartetAufLuni: boolean;
  wirdGestreichelt: boolean;
  /** Wurde aus dem Garten zurückgerufen. */
  gerufen: boolean;
  /** Hat vor verschlossener Gartentür schon einmal kurz gebellt. */
  tuerGebellt: boolean;
  /** Aus dem Bild gelaufen: wird nicht gezeichnet und ist nicht anklickbar. */
  weggelaufen: boolean;
  /** Läuft gerade aus dem Bild (Richtung rechter Rand). */
  renntWeg: boolean;
  /** Schuldbewusst unterwegs (Kopf tief, Rute eingezogen). */
  schuldig: boolean;
}

export interface HausUmgebung {
  hour: number;
  luniFloor: number;
  luniX: number;
  luniSchlaeft: boolean;
  gardenDoor: number;
  gardenWant: number;
  cellarDoor: number;
  smoke: number;
  schlechtesWetter: boolean;
  /** Luni raucht gerade (Raucherstuhl, Zigarette in der Hand). */
  luniRauchen?: boolean;
  /** In diesem Bildschritt hat sie gerade zu rauchen begonnen (einmalige Gelegenheit). */
  rauchNeu?: boolean;
  /** Rückruf für ein sanftes Bellen (tief = true für Apollo). */
  onWuff?: (tief: boolean) => void;
}

/** Lieblingsplätze im Erdgeschoss (Flur, Wohnzimmerteppich, Küche). */
const PLAETZE_EG = [182, 224, 296, 336, 368, 392, 456, 482, 598, 636, 668, 760];
/** Plätze im Schlafzimmer (für ruhige Abend-/Nachtstunden). */
const PLAETZE_SCHLAF = [308, 344, 378, 418];
/** Plätze im Raucherraum (Keller) und draußen im Garten. */
const PLAETZE_RAUCHER = [622, 650, 748, 792];
const PLAETZE_GARTEN = [858, 876, 896, 914];

function erzeugeHund(id: HundId, x: number, face: 1 | -1, startPose: HundPose, timer: number): HundZustand {
  return {
    id,
    x,
    floor: 1,
    face,
    pose: startPose,
    gang: 0,
    t: id === "odin" ? 0 : 2.3,
    timer,
    blinzeln: 0,
    naechstBlinzel: id === "odin" ? 3.4 : 4.9,
    schritte: [],
    gartenZeit: 0,
    gartenMax: 180,
    gartenPause: 0,
    wartetAufLuni: false,
    wirdGestreichelt: false,
    gerufen: false,
    tuerGebellt: false,
    weggelaufen: false,
    renntWeg: false,
    schuldig: false,
  };
}

export class HundeWelt {
  readonly hunde: [HundZustand, HundZustand];
  private zufall: () => number;
  private grussPause = 18;
  /** Einmalige Gelegenheiten (kein Dauerwürfeln). */
  private rauchGelegenheit = false;
  private gartenGelegenheit: Record<HundId, boolean> = { odin: false, apollo: false };

  constructor(zufall?: () => number) {
    // Stabiler Zufallsstrom: gleiche Ausgangslage, gleiche Hundetage – und
    // reproduzierbare Prüfungen. Der Strom ist trotzdem lebendig genug.
    let saat = 0x9e3779b9;
    this.zufall = zufall ?? (() => {
      saat |= 0; saat = (saat + 0x6d2b79f5) | 0;
      let t = Math.imul(saat ^ (saat >>> 15), 1 | saat);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    });
    // Start im Wohnzimmer: beide sofort gut sichtbar und im 4:3-Sicherheitsbereich.
    this.hunde = [
      erzeugeHund("odin", 336, 1, "stand", 5.5),
      erzeugeHund("apollo", 464, -1, "sit", 7.5),
    ];
  }

  get(id: HundId): HundZustand {
    return id === "odin" ? this.hunde[0] : this.hunde[1];
  }

  istImGarten(id: HundId): boolean {
    const h = this.get(id);
    return h.floor === 0 && h.x > HAUS_RECHTS + 2;
  }

  /** Trefferrechteck (≥ 38×30, fernsehtauglich) an der aktuellen Weltposition. */
  hitBox(id: HundId): [number, number, number, number] {
    const h = this.get(id);
    if (h.weggelaufen) return [-100, -100, 1, 1];
    const [wx, wy] = this.weltPos(h);
    return [Math.round(wx - 19), Math.round(wy - 30), 38, 31];
  }

  /** Aktuelle Weltkoordinate (auch mitten auf einer Treppe). */
  weltPos(h: HundZustand): Pt {
    const s = h.schritte[0];
    if (s && s.k === "treppe") {
      const unten = Math.min(s.von, s.nach);
      const oben = Math.max(s.von, s.nach);
      return [
        lerp(s.fussX, s.kopfX, s.t),
        lerp(BODEN_Y[unten], BODEN_Y[oben], s.t),
      ];
    }
    return [h.x, BODEN_Y[h.floor]];
  }

  /** Speichern als einfache Schlüssel/Wert-Zahlen. */
  snapshot(): Record<HundId, HundSnapshot> {
    const [o, a] = this.hunde;
    const sicher = (h: HundZustand): HundSnapshot => ({
      // War ein Hund gerade draußen, startet er nach Neuladen sicher im Haus
      x: Math.round(h.x > HAUS_RECHTS ? 785 : h.x),
      floor: h.floor,
      face: h.face,
    });
    return { odin: sicher(o), apollo: sicher(a) };
  }

  wiederherstellen(snap?: Partial<Record<HundId, HundSnapshot>> | null) {
    if (!snap) return;
    for (const h of this.hunde) {
      const s = snap[h.id];
      if (!s) continue;
      if (s.floor === 0 || s.floor === 1 || s.floor === 2) h.floor = s.floor;
      const minX = h.floor === 0 ? 375 : h.floor === 2 ? 286 : 134;
      const maxX = h.floor === 2 ? 478 : 808;
      if (typeof s.x === "number" && isFinite(s.x)) h.x = clamp(s.x, minX, maxX);
      h.face = s.face === -1 ? -1 : 1;
      h.schritte = [];
      h.weggelaufen = false;
      h.renntWeg = false;
      h.schuldig = false;
    }
  }

  /** Luni möchte diesen Hund streicheln: er bleibt freundlich stehen und schaut sie an. */
  erwarteStreicheln(id: HundId, luniX: number) {
    const h = this.get(id);
    h.schritte = [];
    h.wartetAufLuni = true;
    h.wirdGestreichelt = false;
    h.pose = "wag";
    h.face = luniX < h.x ? -1 : 1;
    h.timer = 14;
  }

  starteStreicheln(id: HundId, luniX: number, onWuff?: (tief: boolean) => void) {
    const h = this.get(id);
    h.schritte = [];
    h.wartetAufLuni = false;
    h.wirdGestreichelt = true;
    h.pose = "petted";
    h.face = luniX < h.x ? -1 : 1;
    h.timer = 4;
    onWuff?.(id === "apollo");
  }

  beendeStreicheln(id: HundId) {
    const h = this.get(id);
    h.wartetAufLuni = false;
    h.wirdGestreichelt = false;
    if (h.pose === "petted" || h.pose === "wag") {
      h.pose = "sit";
      h.timer = 5 + this.zufall() * 6;
    }
  }

  /** Zuruf (Spielkonzept 1.2): ruft Hunde aus dem Garten zurück ins Haus. */
  rufeZurueck(zielId?: HundId) {
    for (const h of this.hunde) {
      if (zielId && h.id !== zielId && !(h.floor === 0 && h.x > HAUS_RECHTS)) continue;
      if (h.floor === 0 && h.x > HAUS_RECHTS - 4) {
        h.gerufen = true;
        h.gartenPause = 75;
        const zielX = h.id === "odin" ? 772 : 746;
        h.schritte = [{ k: "geh", x: zielX, trab: true }];
      }
    }
  }

  /** Aus dem Bild gelaufene Hunde (leer = alle zu Hause). */
  weggelaufen(): HundId[] {
    return this.hunde.filter((h) => h.weggelaufen).map((h) => h.id);
  }

  /** Hund läuft aus dem Bild: erst zum rechten Rand, dann verschwindet er. */
  private starteWeglaufen(h: HundZustand) {
    if (h.weggelaufen || h.renntWeg) return;
    h.renntWeg = true;
    h.weggelaufen = false;
    h.schuldig = false;
    h.schritte = [{ k: "geh", x: 952, trab: true }];
    h.gartenPause = 0;
    h.pose = "trot";
    h.face = 1;
  }

  /**
   * 20 % Gelegenheit: Ein Hund, der im Garten ist, läuft einmal aus dem Bild.
   * Wird pro Rauchbeginn und pro Gartenbesuch genau einmal gewürfelt.
   */
  private verlaufeVielleicht(imGarten: readonly HundId[]) {
    // Erst wer eine Weile draußen ist, läuft auch mal aus dem Bild.
    const frei = imGarten.filter((id) => {
      const h = this.get(id);
      return !h.weggelaufen && !h.renntWeg && h.gartenZeit > 25;
    });
    if (!frei.length) return;
    if (this.zufall() >= 0.2) return;
    this.starteWeglaufen(this.get(frei[Math.floor(this.zufall() * frei.length)]));
  }

  /**
   * Luni ruft die Ausreißer zurück. Sie kommen mit schuldbewusster Haltung
   * herein und legen sich im Wohnzimmer ab.
   */
  zurueckInsWohnzimmer(ids: readonly HundId[]) {
    for (const id of ids) {
      const h = this.get(id);
      h.weggelaufen = false;
      h.renntWeg = false;
      h.schuldig = true;
      h.gerufen = true;
      h.wartetAufLuni = false;
      h.wirdGestreichelt = false;
      h.gartenZeit = 0;
      h.gartenPause = 300;
      h.tuerGebellt = false;
      h.pose = "walk";
      h.face = -1;
      h.floor = 0;
      h.x = 946;
      h.schritte = [
        { k: "geh", x: 862, trab: false },
        { k: "geh", x: 812, trab: false },
        { k: "geh", x: 600, trab: false },
        { k: "geh", x: TREPPE_KELLER.fussX, trab: false },
        { k: "treppe", von: 0, nach: 1, fussX: TREPPE_KELLER.fussX, kopfX: TREPPE_KELLER.kopfX, keller: true, t: 0 },
      ];
      // Ziel im Wohnzimmer: links bzw. rechts am Sofa vorbei, dann ablegen.
      const ziel = id === "odin" ? 330 : 420;
      h.schritte.push({ k: "geh", x: ziel, trab: false });
    }
  }

  /** Pfad zwischen Etagen 0, 1, 2 und innerhalb eines Stockwerks aufbauen. */
  schickeNach(h: HundZustand, zielFloor: 0 | 1 | 2, zielX: number, trab = false, env?: HausUmgebung) {
    // Durch geschlossene Keller-/Gartentür nicht hindurchplanen
    if (env) {
      if (zielFloor === 0 && zielX > HAUS_RECHTS && env.gardenDoor < 0.55) return false;
      if (zielFloor === 0 && zielX > KELLER_TUER_X && h.floor !== 0 && env.cellarDoor < 0.55) return false;
      if (h.floor === 0 && (h.x < KELLER_TUER_X) !== (zielX < KELLER_TUER_X) && env.cellarDoor < 0.55) return false;
    }
    const weg: Schritt[] = [];
    let fl: 0 | 1 | 2 = h.floor;
    while (fl !== zielFloor) {
      if (fl === 1 && zielFloor === 0) {
        weg.push({ k: "geh", x: TREPPE_KELLER.kopfX, trab });
        weg.push({ k: "treppe", von: 1, nach: 0, fussX: TREPPE_KELLER.fussX, kopfX: TREPPE_KELLER.kopfX, keller: true, t: 1 });
        fl = 0;
      } else if (fl === 0) {
        weg.push({ k: "geh", x: TREPPE_KELLER.fussX, trab });
        weg.push({ k: "treppe", von: 0, nach: 1, fussX: TREPPE_KELLER.fussX, kopfX: TREPPE_KELLER.kopfX, keller: true, t: 0 });
        fl = 1;
      } else if (fl === 1 && zielFloor === 2) {
        weg.push({ k: "geh", x: TREPPE_OG.fussX, trab });
        weg.push({ k: "treppe", von: 1, nach: 2, fussX: TREPPE_OG.fussX, kopfX: TREPPE_OG.kopfX, keller: false, t: 0 });
        fl = 2;
      } else {
        weg.push({ k: "geh", x: TREPPE_OG.kopfX, trab });
        weg.push({ k: "treppe", von: 2, nach: 1, fussX: TREPPE_OG.fussX, kopfX: TREPPE_OG.kopfX, keller: false, t: 1 });
        fl = 1;
      }
    }
    weg.push({ k: "geh", x: zielX, trab });
    h.schritte = weg;
    return true;
  }

  update(dt: number, env: HausUmgebung) {
    this.grussPause = Math.max(0, this.grussPause - dt);
    // 20 % pro Gelegenheit: Rauchbeginn oder ein neuer Gartenbesuch.
    if (env.rauchNeu && !this.rauchGelegenheit) {
      this.rauchGelegenheit = true;
      const draussen = this.hunde.filter((h) => h.floor === 0 && h.x > HAUS_RECHTS + 2).map((h) => h.id);
      this.verlaufeVielleicht(draussen);
    } else if (!env.luniRauchen) {
      this.rauchGelegenheit = false;
    }
    for (const h of this.hunde) {
      const imGarten = h.floor === 0 && h.x > HAUS_RECHTS + 2;
      if (!imGarten) {
        this.gartenGelegenheit[h.id] = false;
        continue;
      }
      if (h.gartenZeit < 25) continue;
      if (this.gartenGelegenheit[h.id] || h.weggelaufen || h.renntWeg) continue;
      this.gartenGelegenheit[h.id] = true;
      if (this.zufall() < 0.2) {
        // Nur ein Hund pro Gelegenheit läuft weg.
        if (!this.hunde.some((x) => x.renntWeg || x.weggelaufen)) this.starteWeglaufen(h);
      }
    }
    for (const h of this.hunde) this.updateHund(h, dt, env);

    // Begegnen sich Odin & Apollo ruhig auf derselben Etage, wedeln sie sich kurz zu
    const [o, a] = this.hunde;
    if (
      this.grussPause <= 0 &&
      o.floor === a.floor &&
      !o.schritte.length &&
      !a.schritte.length &&
      !o.wirdGestreichelt &&
      !a.wirdGestreichelt &&
      o.pose === "stand" &&
      a.pose === "stand" &&
      Math.abs(o.x - a.x) > 22 &&
      Math.abs(o.x - a.x) < 58
    ) {
      o.face = o.x < a.x ? 1 : -1;
      a.face = -o.face as 1 | -1;
      o.pose = "wag";
      a.pose = "wag";
      o.timer = 2.6;
      a.timer = 2.6;
      this.grussPause = 45 + this.zufall() * 45;
    }
  }

  private updateHund(h: HundZustand, dt: number, env: HausUmgebung) {
    h.t += dt;
    h.gartenPause = Math.max(0, h.gartenPause - dt);

    // Natürliches Blinzeln
    if (h.blinzeln > 0) {
      h.blinzeln = Math.max(0, h.blinzeln - dt);
    } else {
      h.naechstBlinzel -= dt;
      if (h.naechstBlinzel <= 0) {
        h.blinzeln = 0.14;
        h.naechstBlinzel = 2.8 + this.zufall() * 4.5;
      }
    }

    if (h.weggelaufen) return;
    if (h.renntWeg) {
      if (h.schritte.length) this.bewegeSchritt(h, dt, env);
      else {
        h.weggelaufen = true;
        h.renntWeg = false;
        h.pose = "stand";
      }
      return;
    }
    if (h.wirdGestreichelt) {
      h.pose = "petted";
      return;
    }
    if (h.wartetAufLuni) {
      h.pose = "wag";
      h.face = env.luniX < h.x ? -1 : 1;
      h.timer -= dt;
      if (h.timer <= 0) h.wartetAufLuni = false;
      return;
    }

    const imGarten = h.floor === 0 && h.x > HAUS_RECHTS + 2;

    // Garten-Rückkehr-Logik (Spielkonzept 1.2 & 8.1):
    // Schlechtes Wetter: 1–2 Min., gutes Wetter: 5–10 Min., oder bei schließender Tür sofort.
    if (imGarten) {
      h.gartenZeit += dt;
      const limit = env.schlechtesWetter ? Math.min(h.gartenMax, 90) : h.gartenMax;
      if (!h.gerufen && (h.gartenZeit >= limit || env.gardenWant < 0.5)) {
        if (env.gardenDoor > 0.55) {
          h.gerufen = true;
          h.gartenPause = 75;
          h.schritte = [{ k: "geh", x: h.id === "odin" ? 768 : 742, trab: true }];
        } else if (!h.schritte.length && Math.abs(h.x - 854) > 4) {
          // Vor die geschlossene Gartentür setzen und geduldig warten
          h.schritte = [{ k: "geh", x: 854, trab: false }];
        } else if (!h.schritte.length) {
          h.face = -1;
          if (!h.tuerGebellt) {
            h.tuerGebellt = true;
            h.pose = "bark";
            h.timer = 0.9;
            env.onWuff?.(h.id === "apollo");
          } else if (h.timer <= 0) {
            h.pose = "sit";
            h.timer = 6;
          }
        }
      }
    } else {
      h.gartenZeit = 0;
      h.tuerGebellt = false;
    }

    // Offene Gartentür entdeckt -> freudig in den Garten laufen!
    if (
      !imGarten &&
      !h.gerufen &&
      h.gartenPause <= 0 &&
      env.gardenDoor > 0.65 &&
      env.gardenWant > 0.5 &&
      !h.schritte.length &&
      (h.floor === 0 && h.x > KELLER_TUER_X + 2 || env.cellarDoor > 0.65)
    ) {
      const ziel = h.id === "odin" ? 876 : 906;
      if (this.schickeNach(h, 0, ziel, true, env)) {
        h.gartenMax = env.schlechtesWetter
          ? 60 + this.zufall() * 60
          : 300 + this.zufall() * 300;
        return;
      }
    }

    // Dichter Rauch im Raucherraum (ohne offene Gartentür): Hunde ziehen sich ins EG zurück
    if (
      h.floor === 0 &&
      h.x > KELLER_TUER_X &&
      h.x <= HAUS_RECHTS &&
      env.smoke > 0.35 &&
      env.gardenDoor < 0.5 &&
      env.cellarDoor > 0.55 &&
      !h.schritte.length
    ) {
      this.schickeNach(h, 1, h.id === "odin" ? 336 : 464, false, env);
      return;
    }

    // Aktiven Bewegungsschritt ausführen
    if (h.schritte.length > 0) {
      this.bewegeSchritt(h, dt, env);
      return;
    }

    // Aktuelle Ruhe-/Beobachtungspose abwarten
    h.timer -= dt;
    if (h.timer > 0) return;

    // Neue ruhige Entscheidung treffen
    this.naechsteAktion(h, env);
  }

  private bewegeSchritt(h: HundZustand, dt: number, env: HausUmgebung) {
    const s = h.schritte[0];
    if (s.k === "geh") {
      if (h.schuldig) h.pose = s.trab ? "trot" : "walk";
      // Geschlossene Türen respektieren
      if (h.floor === 0 && !h.schuldig) {
        if ((h.x < KELLER_TUER_X) !== (s.x < KELLER_TUER_X) && env.cellarDoor < 0.5) {
          h.schritte = [];
          h.pose = "sit";
          h.timer = 4;
          return;
        }
        if ((h.x < HAUS_RECHTS) !== (s.x < HAUS_RECHTS) && env.gardenDoor < 0.45 && !h.schuldig) {
          h.schritte = [];
          h.gerufen = false;
          h.pose = "sit";
          h.face = h.x > HAUS_RECHTS ? -1 : 1;
          h.timer = 4;
          return;
        }
      }
      const dx = s.x - h.x;
      const tempo = s.trab ? 68 : 40;
      const schritt = tempo * dt;
      h.pose = s.trab ? "trot" : "walk";
      if (Math.abs(dx) <= schritt) {
        h.x = s.x;
        h.schritte.shift();
        if (!h.schritte.length) {
          h.gerufen = false;
          if (h.schuldig) {
            // Zu Hause angekommen: im Wohnzimmer ablegen und dort bleiben.
            h.schuldig = false;
            h.pose = "lie";
            h.timer = 120 + this.zufall() * 120;
            h.face = 1;
          } else this.ankunftsPose(h, env);
        }
      } else {
        h.x += Math.sign(dx) * schritt;
        h.face = dx > 0 ? 1 : -1;
        h.gang += schritt * (s.trab ? 0.24 : 0.28);
      }
      return;
    }

    // Treppe hinauf oder hinunter
    const richtung = s.nach > s.von ? 1 : -1;
    const unten = Math.min(s.von, s.nach);
    const oben = Math.max(s.von, s.nach);
    const laenge = Math.hypot(s.kopfX - s.fussX, BODEN_Y[oben] - BODEN_Y[unten]);
    const v = 50 * dt;
    s.t += (richtung * v) / laenge;
    h.pose = "walk";
    h.face = (s.kopfX - s.fussX) * richtung > 0 ? 1 : -1;
    h.gang += v * 0.28;
    if ((richtung === 1 && s.t >= 1) || (richtung === -1 && s.t <= 0)) {
      h.floor = s.nach;
      h.x = richtung === 1 ? s.kopfX : s.fussX;
      h.schritte.shift();
      if (!h.schritte.length) {
        if (h.schuldig) {
          h.schuldig = false;
          h.pose = "lie";
          h.timer = 120 + this.zufall() * 120;
        } else this.ankunftsPose(h, env);
      }
    }
  }

  private ankunftsPose(h: HundZustand, env: HausUmgebung) {
    const nacht = env.hour >= 22 || env.hour < 6 || env.luniSchlaeft;
    const imGarten = h.floor === 0 && h.x > HAUS_RECHTS + 2;
    if (imGarten) {
      h.pose = this.zufall() < 0.65 ? "sniff" : "wag";
      h.timer = 3 + this.zufall() * 4.5;
      return;
    }
    if (nacht) {
      h.pose = "sleep";
      h.timer = 22 + this.zufall() * 35;
      return;
    }
    const z = this.zufall();
    if (z < 0.28) {
      h.pose = "sniff";
      h.timer = 2.6 + this.zufall() * 3.2;
    } else if (z < 0.56) {
      h.pose = "sit";
      h.timer = 6 + this.zufall() * 9;
    } else if (z < 0.8) {
      h.pose = "lie";
      h.timer = 10 + this.zufall() * 14;
    } else {
      h.pose = "stand";
      h.timer = 4 + this.zufall() * 6;
    }
  }

  private naechsteAktion(h: HundZustand, env: HausUmgebung) {
    const anderer = this.hunde[0] === h ? this.hunde[1] : this.hunde[0];
    const imGarten = h.floor === 0 && h.x > HAUS_RECHTS + 2;
    const nacht = env.hour >= 22 || env.hour < 6 || env.luniSchlaeft;

    // Nach langem Liegen/Schlafen erst genüsslich strecken!
    if ((h.pose === "lie" || h.pose === "sleep") && !nacht && this.zufall() < 0.45) {
      h.pose = "stretch";
      h.timer = 2.1;
      return;
    }

    // Im Garten: zwischen Gartenplätzen hin- und herschnüffeln und wedeln
    if (imGarten) {
      if (this.zufall() < 0.65) {
        const ziel = this.waehleFrei(PLAETZE_GARTEN, anderer.floor === 0 ? anderer.x : -999, 26);
        h.schritte = [{ k: "geh", x: ziel, trab: this.zufall() < 0.45 }];
      } else {
        h.pose = this.zufall() < 0.55 ? "sniff" : "stand";
        h.timer = 3 + this.zufall() * 4;
      }
      return;
    }

    // Nachts: ins Schlafzimmer oder auf den Wohnzimmerteppich rollen und schlafen
    if (nacht) {
      if (env.luniFloor === 2 && h.floor !== 2 && this.zufall() < 0.6) {
        const ziel = h.id === "odin" ? 316 : 412;
        this.schickeNach(h, 2, ziel, false, env);
        return;
      }
      if (h.pose !== "sleep") {
        const liste = h.floor === 2 ? PLAETZE_SCHLAF : [328, 368, 456];
        const ziel = this.waehleFrei(liste, anderer.floor === h.floor ? anderer.x : -999, 32);
        if (Math.abs(ziel - h.x) > 18 && h.floor !== 0) {
          this.schickeNach(h, h.floor, ziel, false, env);
          return;
        }
        h.pose = "sleep";
        h.timer = 28 + this.zufall() * 40;
        return;
      }
      h.timer = 25 + this.zufall() * 35;
      return;
    }

    // Tagsüber: wenn sie noch im Schlafzimmer oder einsam im Keller sind, gern zurück ins EG
    if (h.floor === 2 && env.luniFloor !== 2 && this.zufall() < 0.65) {
      const ziel = this.waehleFrei(PLAETZE_EG, anderer.floor === 1 ? anderer.x : -999, 34);
      this.schickeNach(h, 1, ziel, false, env);
      return;
    }
    if (h.floor === 0 && env.gardenDoor < 0.5 && env.luniFloor !== 0 && this.zufall() < 0.7) {
      if (h.x < KELLER_TUER_X || env.cellarDoor > 0.55) {
        const ziel = this.waehleFrei(PLAETZE_EG, anderer.floor === 1 ? anderer.x : -999, 34);
        this.schickeNach(h, 1, ziel, false, env);
        return;
      }
    }

    // Gern in Lunis Nähe spazieren, wenn sie im EG oder Raucherraum ist
    const z = this.zufall();
    if (z < 0.55) {
      if (h.floor === 0 && h.x > KELLER_TUER_X) {
        const ziel = this.waehleFrei(PLAETZE_RAUCHER, anderer.floor === 0 ? anderer.x : -999, 30);
        this.schickeNach(h, 0, ziel, false, env);
      } else {
        let ziel = this.waehleFrei(PLAETZE_EG, anderer.floor === 1 ? anderer.x : -999, 34);
        if (env.luniFloor === 1 && this.zufall() < 0.4) {
          const nahe = clamp(env.luniX + (h.id === "odin" ? -34 : 34), 145, 790);
          if (anderer.floor !== 1 || Math.abs(nahe - anderer.x) > 30) ziel = nahe;
        }
        this.schickeNach(h, 1, ziel, this.zufall() < 0.2, env);
      }
    } else if (z < 0.75) {
      h.pose = "sit";
      h.timer = 7 + this.zufall() * 10;
    } else if (z < 0.92) {
      h.pose = h.pose === "lie" ? "sleep" : "lie";
      h.timer = 12 + this.zufall() * 16;
    } else {
      h.pose = "sniff";
      h.timer = 3 + this.zufall() * 3;
    }
  }

  private waehleFrei(plaetze: readonly number[], besetztX: number, abstand: number): number {
    const frei = plaetze.filter((p) => Math.abs(p - besetztX) >= abstand);
    const quelle = frei.length ? frei : plaetze;
    return quelle[Math.floor(this.zufall() * quelle.length)];
  }

  /** Beide Hunde zeichnen (mit sauberem Clipping auf der Kellertreppe & im Türdurchgang). */
  draw(c: C) {
    // Apollo zuerst, Odin danach (so verdecken sie sich ruhig in fester Tiefe)
    for (const id of ["apollo", "odin"] as const) {
      const h = this.get(id);
      if (h.weggelaufen) continue;
      const s = h.schritte[0];
      const [wx, wy] = this.weltPos(h);
      const aufTreppe = !!s && s.k === "treppe";
      const kellerClip = aufTreppe && s.keller;
      // Beim Durchlaufen der Gartentür Außenwand (830..842) sauber überblenden
      const anWand = h.floor === 0 && h.x > HAUS_RECHTS - 12 && h.x < HAUS_RECHTS + 14;

      c.save();
      if (kellerClip) {
        c.beginPath();
        c.rect(350, 460, HAUS_RECHTS - 350, 112);
        c.clip();
      }
      drawHund(c, h.id, wx, wy, {
        face: h.face,
        pose: h.pose,
        t: h.t,
        gang: h.gang,
        blinzeln: h.blinzeln > 0,
        scale: HUND_SCALE,
        schatten: !aufTreppe,
        guilty: h.schuldig,
      });
      // Außenwand-Laibung über dem durchschlüpfenden Hund, damit er wirklich DURCH die Tür läuft
      if (anWand) {
        c.fillStyle = "#4a3a33";
        c.fillRect(HAUS_RECHTS, 480, 12, 4);
      }
      c.restore();
    }
  }
}
