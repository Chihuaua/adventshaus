/* =======================================================================
   STERNENNACHT – ruhiges TV-Bild auf Kanal „NMS“

   EIN Raumfahrer sitzt auf dem Holzdeck und schaut über die Felsen in den
   Sternenhimmel. Auf dem Rücken trägt er einen kantigen Gerätekasten; Gurt
   und Schlauch verbinden ihn sichtbar mit Anzug und Helm, damit er nicht
   wie eine zweite Gestalt wirkt. Im Bild gibt es genau einen Helm.

   Aufbau und Farben folgen der ausgemessenen hellen Vorlage; alle
   Grundflächen liegen bewusst eine Stufe heller als dort, damit das Bild
   auf dem Fernseher nicht absäuft. Alles ist mit Canvas-Grundformen
   gezeichnet, ohne Bild- oder Audiodateien. Die Sterne leuchten an festen
   Orten. Nur der Staub zieht mit der Luft durch das Bild.
   ======================================================================= */

type C = CanvasRenderingContext2D;
type Pt = readonly [number, number];
type Farbe = string | CanvasGradient;
const TAU = Math.PI * 2;

/** Bezugsfläche: in diesen Maßen wurde die helle Vorlage ausgemessen. */
const BW = 1568;
const BH = 876;

export interface SternennachtStern {
  /** Lage im Himmel, jeweils 0 bis 1; so bleibt der Himmel bei jedem TV-Format gefüllt. */
  u: number;
  v: number;
  r: number;
  /** Dauer eines vollständigen, sanften Leuchtzyklus in Sekunden. */
  periode: number;
  phase: number;
  helligkeit: number;
  warm: boolean;
}

/** Grundfarben; die Tests prüfen, dass sie heller sind als die Vorlage. */
export const STERNENNACHT_FARBEN = {
  himmelLinks: "#5876a6",
  himmelMitte: "#49689f",
  himmelRechts: "#2f4c8a",
  dunst: "#34528c",
  berg: "#1b2c50",
  bergLicht: "#2c4678",
  boden: "#223b64",
  deck: "#2d4274",
  deckRand: "#3f5c9c",
} as const;
const F = STERNENNACHT_FARBEN;

/** Wiederholbarer Zufall: beim Neuzeichnen springt nichts. */
function zufall(i: number): number {
  const s = Math.sin(i * 91.7 + 47.3) * 43758.5453123;
  return s - Math.floor(s);
}

/**
 * Die Sterne sind so groß gewählt, dass sie auch auf der verkleinerten
 * TV-Fläche als Lichtpunkte erkennbar bleiben.
 */
export const STERNENNACHT_STERNE: readonly SternennachtStern[] = Object.freeze(
  Array.from({ length: 250 }, (_, i): SternennachtStern => {
    const groesse = zufall(i * 9 + 3);
    const zusatz = zufall(i * 9 + 8);
    return {
      u: zufall(i * 9 + 1),
      v: zufall(i * 9 + 2),
      r: groesse > 0.93 ? 3.8 + zusatz * 1.6 : groesse > 0.68 ? 2.5 + zusatz : 1.6 + zusatz * 0.8,
      periode: 28 + zufall(i * 9 + 4) * 38,
      phase: zufall(i * 9 + 5) * TAU,
      helligkeit: 0.55 + zufall(i * 9 + 6) * 0.45,
      warm: zufall(i * 9 + 7) > 0.84,
    };
  }),
);

/** Der eine auffällige Stern links über der Felsnadel. */
const LEITSTERN: SternennachtStern = { u: 0, v: 0, r: 5.4, periode: 44, phase: 0.9, helligkeit: 1, warm: false };

/** Sanftes Auf- und Ableuchten ohne hartes Blinken. */
export function sternenLicht(stern: SternennachtStern, t: number): number {
  const welle = 0.5 + 0.5 * Math.cos((t * TAU) / stern.periode + stern.phase);
  const sanft = welle * welle * (3 - 2 * welle);
  return stern.helligkeit * (0.1 + 0.9 * sanft);
}

/* ------------------------------ Helfer -------------------------------- */

function polyPfad(c: C, p: readonly Pt[]): void {
  c.beginPath();
  c.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
  c.closePath();
}

function poly(c: C, p: readonly Pt[], farbe: Farbe): void {
  polyPfad(c, p);
  c.fillStyle = farbe;
  c.fill();
}

/** Geschlossene, weich gerundete Form durch die Stützpunkte. */
function weichPfad(c: C, p: readonly Pt[]): void {
  const n = p.length;
  c.beginPath();
  c.moveTo((p[n - 1][0] + p[0][0]) / 2, (p[n - 1][1] + p[0][1]) / 2);
  for (let i = 0; i < n; i++) {
    const q = p[(i + 1) % n];
    c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + q[0]) / 2, (p[i][1] + q[1]) / 2);
  }
  c.closePath();
}

function weich(c: C, p: readonly Pt[], farbe: Farbe): void {
  weichPfad(c, p);
  c.fillStyle = farbe;
  c.fill();
}

function kreis(c: C, x: number, y: number, r: number, farbe: Farbe): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

function ell(c: C, x: number, y: number, rx: number, ry: number, farbe: Farbe, dreh = 0): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.ellipse(x, y, rx, ry, dreh, 0, TAU);
  c.fill();
}

function rund(c: C, x: number, y: number, w: number, h: number, r: number, farbe: Farbe): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}

function linie(c: C, p: readonly Pt[], farbe: string, breite: number): void {
  c.strokeStyle = farbe;
  c.lineWidth = breite;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
  c.stroke();
}

function bogen(c: C, x: number, y: number, r: number, von: number, bis: number, farbe: string, breite: number): void {
  c.strokeStyle = farbe;
  c.lineWidth = breite;
  c.lineCap = "round";
  c.beginPath();
  c.arc(x, y, r, von, bis);
  c.stroke();
}

/** Weicher Lichtfleck; `rgb` als "r,g,b". */
function schein(c: C, x: number, y: number, rx: number, ry: number, rgb: string, alpha: number): void {
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(${rgb},${alpha.toFixed(3)})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, 1, 0, TAU);
  c.fill();
  c.restore();
}

/* ------------------------------- Himmel -------------------------------- */

/** Wolkenfelder der Vorlage: Mitte und Halbachsen. */
const WOLKEN: readonly (readonly [number, number, number, number])[] = [
  [630, 125, 88, 42], [705, 222, 82, 34], [960, 105, 64, 36], [1068, 76, 42, 28], [925, 22, 64, 24],
  [1545, 52, 48, 40], [75, 92, 72, 22], [590, 318, 112, 26], [850, 238, 62, 18],
];

function himmel(c: C, vx: number, vy: number, vw: number, vh: number, t: number): void {
  // Links helles Stahlblau, nach rechts tieferes Blau – wie in der Vorlage, nur lichter.
  const quer = c.createLinearGradient(0, 0, BW, 0);
  quer.addColorStop(0, F.himmelLinks);
  quer.addColorStop(0.52, F.himmelMitte);
  quer.addColorStop(0.8, "#38558f");
  quer.addColorStop(1, F.himmelRechts);
  c.fillStyle = quer;
  c.fillRect(vx, vy, vw, vh);

  // Oben etwas tiefer, zum Horizont hin ein heller Dunstschleier.
  const hoch = c.createLinearGradient(0, -40, 0, 440);
  hoch.addColorStop(0, "rgba(16,30,72,.24)");
  hoch.addColorStop(0.5, "rgba(16,30,72,0)");
  hoch.addColorStop(1, "rgba(160,195,240,.2)");
  c.fillStyle = hoch;
  c.fillRect(vx, vy, vw, 440 - vy);

  // Wolken: kräftiger blaue, weiche Flecken; sie stehen still.
  for (const [wx, wy, rx, ry] of WOLKEN) {
    for (let k = 0; k < 5; k++) {
      const dx = (zufall(wx + k * 3.1) - 0.5) * rx * 1.5;
      const dy = (zufall(wy + k * 5.7) - 0.5) * ry * 1.1;
      const gr = 0.55 + zufall(wx + wy + k) * 0.5;
      schein(c, wx + dx, wy + dy, rx * gr, ry * gr, "78,122,214", 0.3);
    }
    schein(c, wx, wy - ry * 0.25, rx * 0.8, ry * 0.5, "146,182,242", 0.14);
  }

  // Auch die hellen Sterne bleiben fest; nur ihre Leuchtkraft variiert.
  const stern = (s: SternennachtStern, sx: number, sy: number): void => {
    const a = Math.min(1, 0.16 + sternenLicht(s, t));
    const rgb = s.warm ? "255,236,214" : "226,238,255";
    if (s.r > 2.4) schein(c, sx, sy, s.r * 4.2, s.r * 4.2, rgb, a * 0.34);
    kreis(c, sx, sy, s.r, `rgba(${rgb},${a.toFixed(3)})`);
    if (s.r > 3.7) {
      const l = s.r * 3.2;
      const strahl = `rgba(${rgb},${(a * 0.5).toFixed(3)})`;
      linie(c, [[sx - l, sy], [sx + l, sy]], strahl, 1.3);
      linie(c, [[sx, sy - l], [sx, sy + l]], strahl, 1.3);
    }
  };
  for (const s of STERNENNACHT_STERNE) stern(s, vx + s.u * vw, vy + s.v * (455 - vy));
  stern(LEITSTERN, 232, 229);
}

/* -------------------------------- Berge -------------------------------- */

function berge(c: C): void {
  // Ferner Dunststreifen am Horizont trennt Himmel und Felsen.
  poly(c, [
    [-600, 348], [-200, 340], [60, 336], [250, 346], [420, 338], [560, 330], [700, 336], [860, 346],
    [1000, 350], [2400, 352], [2400, 480], [-600, 480],
  ], F.dunst);

  // Linke Gruppe: flache Kuppen am Rand, kleiner Fels, hohe Felsnadel mit Nebengipfel.
  weich(c, [
    [-620, 460], [-520, 372], [-420, 338], [-330, 356], [-240, 326], [-150, 352], [-70, 334], [-10, 322],
    [40, 306], [84, 328], [106, 376], [112, 460],
  ], F.berg);
  poly(c, [[106, 414], [122, 352], [138, 316], [152, 298], [166, 306], [184, 338], [202, 378], [216, 414]], F.berg);
  poly(c, [[152, 298], [138, 316], [122, 352], [112, 394], [136, 372], [148, 330]], F.bergLicht);
  poly(c, [
    [186, 430], [215, 392], [248, 318], [272, 250], [296, 188], [314, 146], [322, 131], [331, 148],
    [346, 196], [366, 252], [388, 300], [410, 322], [432, 288], [452, 267], [472, 278], [492, 312],
    [520, 330], [585, 372], [660, 416], [660, 480], [186, 480],
  ], F.berg);
  poly(c, [[322, 131], [314, 146], [296, 188], [272, 250], [248, 318], [228, 362], [262, 344], [286, 274], [304, 214], [318, 166]], F.bergLicht);
  poly(c, [[322, 131], [331, 148], [346, 196], [366, 252], [388, 300], [374, 322], [352, 264], [335, 202]], "#16254a");
  poly(c, [[452, 267], [432, 288], [412, 320], [436, 318], [446, 292]], F.bergLicht);
  linie(c, [[318, 172], [306, 236], [296, 300]], "rgba(8,14,40,.22)", 3);

  // Vorgelagerter Rücken vor der Nadel und die runde Kuppe in der Bildmitte.
  weich(c, [
    [150, 470], [236, 396], [326, 358], [420, 340], [505, 322], [562, 336], [618, 380], [668, 418],
    [712, 452], [712, 540], [150, 540],
  ], "#20365d");
  weich(c, [
    [670, 420], [728, 356], [776, 326], [830, 296], [874, 304], [918, 334], [968, 354], [1020, 380],
    [1020, 470], [670, 470],
  ], "#1c2e53");

  // Rechtes Massiv mit zwei Kuppen, davor die schlanke Felsnadel mit ihrem Hang.
  poly(c, [
    [930, 440], [960, 330], [1000, 255], [1030, 200], [1085, 150], [1112, 160], [1140, 112], [1165, 76],
    [1185, 63], [1208, 78], [1245, 120], [1290, 150], [1325, 116], [1355, 90], [1380, 104], [1410, 160],
    [1440, 230], [1470, 290], [1510, 345], [1570, 398], [1700, 470], [2400, 640], [2400, 700], [930, 700],
  ], "#18284b");
  poly(c, [[1185, 63], [1165, 76], [1140, 112], [1116, 162], [1142, 150], [1164, 106]], "#243a68");
  poly(c, [[1355, 90], [1325, 116], [1298, 152], [1322, 142], [1341, 113]], "#243a68");
  linie(c, [[1208, 84], [1228, 160], [1222, 240]], "rgba(8,14,40,.2)", 3);
  linie(c, [[1380, 110], [1392, 190], [1420, 270]], "rgba(8,14,40,.2)", 3);
  poly(c, [
    [880, 430], [900, 392], [928, 330], [965, 270], [996, 214], [1018, 160], [1036, 108], [1050, 60],
    [1058, 96], [1070, 138], [1088, 152], [1105, 182], [1122, 240], [1138, 300], [1156, 430],
  ], "#1d3057");
  poly(c, [[1050, 60], [1036, 108], [1018, 160], [996, 214], [965, 270], [938, 322], [972, 302], [1002, 248], [1026, 188], [1042, 122]], F.bergLicht);
  linie(c, [[1052, 74], [1060, 150], [1082, 240], [1096, 320]], "rgba(8,14,40,.22)", 3);
}

/* -------------------------------- Boden -------------------------------- */

/** Start im Bild (0..1), Luftstrom in Bildeinheiten/Sekunde und Lichtfarbe. */
const STAUB: readonly (readonly [number, number, number, number, string])[] = [
  [0.378, 0.77, 4.8, -0.65, "255,96,110"], [0.136, 0.80, 3.8, -0.82, "255,96,110"],
  [0.328, 0.53, -3.2, 0.46, "236,90,120"], [0.009, 0.58, 4.3, 0.58, "255,128,112"],
  [0.344, 0.71, 5.0, -0.98, "220,236,112"], [0.490, 0.68, 4.1, 0.37, "220,236,112"],
  [0.976, 0.47, 3.5, -0.43, "96,216,255"], [0.384, 0.45, -2.9, -0.54, "96,216,255"],
];

function boden(c: C): void {
  const g = c.createLinearGradient(0, 400, 0, 900);
  g.addColorStop(0, F.boden);
  g.addColorStop(0.5, "#1b3057");
  g.addColorStop(1, "#152548");
  poly(c, [
    [-600, 440], [60, 422], [200, 432], [420, 412], [640, 430], [820, 418], [1000, 436], [1280, 440],
    [1280, 1400], [-600, 1400],
  ], g);

  // Felsrücken von hinten nach vorn, abwechselnd im Licht und im Schatten.
  weich(c, [
    [-600, 500], [-200, 452], [40, 432], [170, 414], [300, 436], [430, 410], [560, 446], [700, 424],
    [850, 452], [1010, 434], [1180, 476], [1280, 560], [1280, 660], [-600, 660],
  ], "#27436f");
  weich(c, [
    [-600, 610], [-150, 548], [60, 524], [240, 546], [420, 506], [600, 550], [780, 516], [950, 558],
    [1110, 546], [1250, 610], [1280, 780], [-600, 780],
  ], "#1f375f");
  weich(c, [
    [-600, 730], [-100, 650], [120, 614], [300, 646], [470, 606], [640, 654], [800, 626], [930, 690],
    [980, 880], [-600, 880],
  ], "#1a2f56");
  weich(c, [
    [-600, 880], [-150, 790], [60, 744], [200, 774], [330, 748], [440, 806], [480, 1400], [-600, 1400],
  ], "#15274b");

  // Gesteinsflächen: helle und dunkle Schuppen geben dem Boden Struktur.
  for (let i = 0; i < 96; i++) {
    const fx = -320 + zufall(i * 4 + 500) * 1520;
    const fy = 425 + zufall(i * 4 + 501) * 450;
    const rx = 14 + zufall(i * 4 + 502) * 46;
    const ry = 4 + zufall(i * 4 + 503) * 11;
    ell(c, fx, fy, rx, ry, i % 2 === 0 ? "rgba(104,146,212,.15)" : "rgba(7,13,38,.2)", -0.28 + zufall(i * 4 + 504) * 0.32);
  }
  // Lichtkanten auf den Rücken.
  linie(c, [[40, 436], [170, 418], [300, 438], [430, 414], [560, 448]], "rgba(125,168,232,.2)", 3);
  linie(c, [[700, 428], [850, 454], [1010, 438]], "rgba(125,168,232,.17)", 3);
  linie(c, [[60, 528], [240, 549], [420, 510], [600, 553]], "rgba(125,168,232,.14)", 3);
  linie(c, [[120, 618], [300, 649], [470, 610], [640, 657]], "rgba(125,168,232,.12)", 3);
}

function lichtpartikel(c: C, t: number, links: number, oben: number, w: number, h: number, nah: boolean): void {
  // Der Umlauf liegt jenseits des gesamten Lichtsaums, auch im breiten Dachgeschoss-TV.
  const saum = 32, breite = w + 2 * saum, hoehe = h + 2 * saum;
  const umlauf = (n: number, laenge: number) => n - laenge * Math.floor(n / laenge);
  for (let i = 0; i < STAUB.length; i++) {
    const [u, v, dx, dy, rgb] = STAUB[i];
    const vorn = Math.abs(dx) > 4.6;
    if (vorn !== nah) continue;
    const phase = i * 2.4;
    const x = u * breite + t * dx + 5 * Math.sin(t * 0.031 + phase);
    const y = v * hoehe + t * dy + 12 * Math.sin(t * 0.026 + phase) + 4 * Math.sin(t * 0.047 - phase);
    const px = links - saum + umlauf(x, breite), py = oben - saum + umlauf(y, hoehe);
    const r = vorn ? 3.1 : 2.4;
    schein(c, px, py, r * 5.5, r * 5.5, rgb, vorn ? 0.48 : 0.38);
    kreis(c, px, py, r, `rgba(${rgb},.95)`);
  }
}

/* ------------------------------ Plattform ------------------------------ */

/** Hintere Deckkante (läuft nach rechts oben) und linke Vorderkante. */
const fern = (x: number): number => 772 - 0.2089 * (x - 246);
const nah = (y: number): number => 246 + (y - 772) / 0.394;
/** Abstand der n-ten Plankenfuge von der hinteren Kante; vorn werden die Planken breiter. */
const fuge = (n: number): number => 31 + n * 30 + n * n * 1.15;

function plattform(c: C): void {
  const R = 2400;
  const U = 1400;

  // Seitenwand unter der linken Vorderkante.
  poly(c, [[231, 784], [231, U], [nah(U), U], [262, 779]], "#0f1b3c");
  linie(c, [[231, 790], [231, U]], "rgba(86,128,210,.3)", 2.5);

  const aussen = (zu: boolean): void => {
    c.beginPath();
    c.moveTo(R, fern(R));
    c.lineTo(272, fern(272));
    c.quadraticCurveTo(238, 773, 270, 782);
    c.lineTo(nah(U), U);
    if (zu) {
      c.lineTo(R, U);
      c.closePath();
    }
  };
  const innen = (zu: boolean): void => {
    c.beginPath();
    c.moveTo(R, fern(R) + 31);
    c.lineTo(350, fern(350) + 31);
    c.quadraticCurveTo(318, 788, 344, 797);
    c.lineTo(nah(U) + 37, U);
    if (zu) {
      c.lineTo(R, U);
      c.closePath();
    }
  };

  // Umlaufender Rand: breites Holzband, im Himmelslicht kräftig blau.
  const rand = c.createLinearGradient(240, 0, BW, 0);
  rand.addColorStop(0, "#4c6cb0");
  rand.addColorStop(0.35, F.deckRand);
  rand.addColorStop(1, "#2a3f76");
  aussen(true);
  c.fillStyle = rand;
  c.fill();

  // Deckfläche mit Planken parallel zur hinteren Kante.
  const deck = c.createLinearGradient(250, 0, BW, 0);
  deck.addColorStop(0, "#3a5286");
  deck.addColorStop(0.4, F.deck);
  deck.addColorStop(1, "#2a3f72");
  innen(true);
  c.fillStyle = deck;
  c.fill();
  c.save();
  innen(true);
  c.clip();
  for (let i = 0; i < 44; i++) {
    const x0 = 300 + zufall(i * 3 + 800) * 1250;
    const v = 44 + zufall(i * 3 + 801) * 620;
    const l = 70 + zufall(i * 3 + 802) * 170;
    linie(c, [[x0, fern(x0) + v], [x0 + l, fern(x0 + l) + v]], "rgba(150,182,242,.055)", 2.2);
  }
  for (let n = 1; fuge(n) < 900; n++) {
    const v = fuge(n);
    linie(c, [[200, fern(200) + v], [R, fern(R) + v]], "rgba(9,15,44,.5)", 2.6);
    linie(c, [[200, fern(200) + v + 3.2], [R, fern(R) + v + 3.2]], "rgba(135,170,238,.1)", 1.5);
    // Stoßfugen quer zur Planke, in Richtung der Vorderkante.
    for (const x of [380 + zufall(n * 7 + 900) * 520, 930 + zufall(n * 7 + 901) * 520]) {
      const dx = (v - fuge(n - 1)) / 0.6029;
      linie(c, [[x, fern(x) + fuge(n - 1)], [x + dx, fern(x + dx) + v]], "rgba(9,15,44,.42)", 2.2);
    }
  }
  c.restore();

  // Kanten: blaue Lichtkante außen, dunkle Nut innen.
  c.lineJoin = "round";
  aussen(false);
  c.strokeStyle = "#5c90ea";
  c.lineWidth = 3.6;
  c.stroke();
  innen(false);
  c.strokeStyle = "rgba(8,14,40,.6)";
  c.lineWidth = 3.2;
  c.stroke();

  // Gebogene Schiene vor dem Stiefel.
  for (const [farbe, breite, dy] of [["rgba(6,10,30,.5)", 16, 9], ["#415d9c", 13, 0], ["rgba(128,168,242,.55)", 3, -4]] as const) {
    c.strokeStyle = farbe;
    c.lineWidth = breite;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(630, 768 + dy);
    c.bezierCurveTo(650, 792 + dy, 780, 818 + dy, 1040, 892 + dy);
    c.stroke();
  }

  // Rechter Aufbau mit dem warmen Lichtband der Vorlage.
  poly(c, [[1490, 514], [R, fern(R) - 6], [R, fern(R) + 86], [1490, 598]], "#434f78");
  linie(c, [[1490, 516], [R, fern(R) - 4]], "rgba(150,182,242,.42)", 3);
  linie(c, [[1494, 580], [R, fern(R) + 66]], "rgba(255,232,160,.28)", 16);
  linie(c, [[1494, 580], [R, fern(R) + 66]], "#f4e9b4", 5);
}

/* ----------------------------- Raumfahrer ------------------------------ */

function anzugteil(c: C, kontur: readonly Pt[], farbe: Farbe, kante: string, breite = 3): void {
  weich(c, kontur, farbe);
  c.strokeStyle = kante;
  c.lineWidth = breite;
  c.lineJoin = "round";
  c.stroke();
}

function naht(c: C, a: Pt, b: Pt, d: Pt, farbe: string, breite: number): void {
  c.beginPath();
  c.moveTo(...a);
  c.quadraticCurveTo(...b, ...d);
  c.strokeStyle = farbe;
  c.lineWidth = breite;
  c.lineCap = "round";
  c.stroke();
}

function eingeklappterStiefel(c: C): void {
  // Der hohe Schaft endet hinter dem linken Knie. Vom rechten Bein sieht man nur den Stiefel.
  const leder = c.createLinearGradient(920, 684, 942, 772);
  leder.addColorStop(0, "#29435b");
  leder.addColorStop(0.65, "#27324f");
  leder.addColorStop(1, "#161d35");
  anzugteil(c, [
    [916, 668], [963, 669], [975, 695], [984, 720], [1001, 730], [1017, 745], [1019, 778],
    [1008, 790], [863, 793], [844, 776], [850, 758], [881, 744], [910, 733], [925, 718],
  ], leder, "#10182d", 4);
  for (let j = 0; j < 3; j++) naht(c, [925, 698 + j * 6], [944, 701 + j * 6], [974, 695 + j * 7], "#20344d", 3);
  naht(c, [854, 761], [885, 739], [926, 733], "#496384", 3);
  naht(c, [911, 736], [942, 707], [980, 738], "#384763", 5);
  naht(c, [921, 738], [947, 722], [972, 738], "#151e34", 4);

  // Auf 1568 x 876 umgerechnet: Profil etwa x=847..1019, unterster Stollen bei y=833.
  const sohle: readonly Pt[] = [
    [848, 763], [863, 756], [883, 760], [903, 755], [916, 755], [937, 762], [957, 766],
    [977, 759], [996, 759], [1018, 763], [1019, 778], [1017, 794], [1009, 801], [1003, 819],
    [996, 820], [989, 817], [963, 819], [950, 819], [931, 826], [927, 833], [920, 833],
    [915, 828], [899, 829], [886, 823], [870, 815], [854, 801], [846, 790],
  ];
  c.save();
  anzugteil(c, sohle, "#18213a", "#0e162b", 3);
  c.clip();
  // Getrennte Profilfelder an Ballen und Ferse, dazwischen die schmalere Brücke.
  for (let j = 0; j < 4; j++) {
    const y = 763 + 13 * j;
    poly(c, [[842, y], [879, y + 2], [907, y], [917, y + 3], [922, y + 10], [887, y + 9], [843, y + 7]], "#2c3751");
    naht(c, [846, y], [872, y + 4], [907, y + 1], "#44506b", 2);
    poly(c, [[963, y + 4], [982, y], [1022, y + 1], [1023, y + 9], [981, y + 9], [964, y + 12]], "#29334b");
    naht(c, [967, y + 4], [991, y + 1], [1019, y + 2], "#3e4a64", 1.8);
  }
  poly(c, [[916, 772], [957, 775], [964, 786], [919, 785]], "#303b55");
  poly(c, [[920, 798], [958, 797], [958, 812], [938, 816], [918, 813]], "#253049");
  linie(c, [[870, 815], [885, 805], [899, 808]], "#131c30", 3);
  c.restore();
}

function rumpf(c: C): void {
  const g = c.createLinearGradient(1090, 0, 1300, 0);
  g.addColorStop(0, "#2c3d66");
  g.addColorStop(0.45, "#212849");
  g.addColorStop(1, "#1b1934");
  const form: readonly Pt[] = [
    [1118, 476], [1178, 442], [1250, 452], [1292, 505], [1302, 600], [1296, 718], [1272, 792], [1182, 806],
    [1112, 778], [1084, 704], [1098, 604], [1094, 524],
  ];
  weich(c, form.map(([x, y]): Pt => [x - 3, y + 4]), "#0d1530");
  weich(c, form, g);
  // Dunkelroter Schimmer des Stoffs am unteren Rücken.
  ell(c, 1224, 640, 50, 96, "rgba(84,30,70,.15)");
  linie(c, [[1112, 560], [1128, 640], [1118, 716]], "rgba(110,150,225,.2)", 3);
}

function vorderesBein(c: C): void {
  const stoff = c.createLinearGradient(1080, 616, 1035, 789);
  stoff.addColorStop(0, "#435372");
  stoff.addColorStop(0.56, "#34425f");
  stoff.addColorStop(1, "#28344e");
  const hose: readonly Pt[] = [
    [886, 616], [912, 590], [949, 589], [991, 603], [1045, 608], [1090, 622], [1128, 649],
    [1168, 666], [1190, 689], [1185, 706], [1205, 711], [1218, 729], [1264, 741], [1267, 773],
    [1247, 795], [1203, 812], [1155, 829], [1134, 825], [1098, 802], [1062, 784], [1018, 769],
    [994, 751], [971, 727], [951, 710], [926, 699], [902, 677], [880, 648],
  ];
  c.save();
  anzugteil(c, hose, stoff, "#162138", 4);
  c.clip();
  weich(c, [[882, 592], [972, 595], [959, 635], [950, 676], [929, 697], [892, 660]], "#242b43");
  anzugteil(c, [[979, 604], [1048, 623], [1033, 644], [1008, 680], [981, 712], [953, 692], [959, 647]], "#3c4b69", "#293750");
  anzugteil(c, [[1052, 628], [1094, 637], [1168, 687], [1182, 702], [1164, 738], [1124, 791], [1099, 790], [1024, 761], [992, 736], [1017, 690]], "#384664", "#29354e");
  naht(c, [1056, 634], [1112, 650], [1166, 691], "#4b5975", 2.5);
  naht(c, [1169, 702], [1151, 751], [1118, 784], "#50607a", 2);
  naht(c, [974, 688], [997, 660], [1015, 623], "#29364f", 3);
  naht(c, [1084, 798], [1125, 793], [1155, 809], "#23324a", 3.4);
  c.restore();

  const wade = c.createLinearGradient(831, 653, 866, 746);
  wade.addColorStop(0, "#405679");
  wade.addColorStop(0.5, "#293853");
  wade.addColorStop(1, "#34455f");
  anzugteil(c, [[876, 614], [903, 611], [932, 640], [951, 679], [941, 701], [908, 720],
    [871, 743], [832, 757], [801, 765], [781, 757], [767, 738], [759, 705], [766, 682],
    [790, 669], [822, 655], [853, 637]], wade, "#141e35", 4);
  weich(c, [[782, 714], [812, 696], [854, 671], [879, 651], [903, 662], [915, 682],
    [886, 709], [846, 735], [816, 751], [799, 752]], "#435470");
  for (let j = 0; j < 3; j++) {
    const x = 803 + 27 * j, y = 710 - 16 * j;
    naht(c, [x, y], [x + 5, y + 12], [x + 18, y + 17], "#33445e", 3);
  }
  naht(c, [783, 693], [824, 660], [859, 644], "#536f95", 4);

  // Der unter dem Handschuh zusammengedrückte Faltenbalg sitzt im breiten Kniering.
  anzugteil(c, [[882, 618], [901, 602], [939, 601], [958, 611], [950, 643], [940, 677],
    [929, 684], [901, 657]], "#2b2e47", "#1d233b");
  for (let j = 0; j < 3; j++) naht(c, [897 + j * 7, 615 + j * 14], [917 + j * 4, 627 + j * 15], [951 - j * 4, 620 + j * 16], "#1b2338", 3.5);
  anzugteil(c, [[869, 629], [878, 617], [890, 613], [889, 634], [899, 655], [921, 678],
    [947, 686], [951, 694], [940, 701], [914, 691], [889, 671], [874, 650]], "#435773", "#202e48");
  naht(c, [878, 630], [881, 669], [938, 692], "#6c83a3", 3.2);

  const stiefel = c.createLinearGradient(710, 709, 736, 790);
  stiefel.addColorStop(0, "#334867");
  stiefel.addColorStop(0.6, "#212d49");
  stiefel.addColorStop(1, "#161f35");
  anzugteil(c, [[650, 735], [656, 717], [669, 707], [680, 712], [683, 720], [714, 714],
    [749, 708], [764, 695], [779, 689], [785, 719], [800, 746], [811, 758], [809, 781],
    [792, 790], [753, 792], [703, 787], [676, 780], [661, 762]], stiefel, "#101a30", 4);
  naht(c, [664, 751], [660, 731], [673, 716], "#52668a", 3);
  naht(c, [678, 758], [716, 767], [782, 746], "#3b4b68", 3);
  for (let j = 0; j < 3; j++) naht(c, [698 + j * 21, 720 - j * 3], [687 + j * 21, 733 - j * 3], [689 + j * 21, 744 - j * 3], "#1a2740", 5);
  weich(c, [[661, 751], [680, 767], [718, 777], [764, 780], [806, 768], [809, 782],
    [789, 790], [744, 790], [696, 784], [670, 774]], "#161d32");
  anzugteil(c, [[768, 683], [777, 677], [782, 680], [777, 699], [780, 724], [793, 748],
    [805, 757], [798, 765], [780, 757], [769, 738], [761, 709]], "#354a69", "#18243c");
  naht(c, [769, 691], [761, 725], [791, 756], "#637fa5", 3);
}

function arm(c: C): void {
  // Die Gürteltasche liegt unter dem Arm.
  rund(c, 1188, 738, 88, 56, 11, "#0d1530");
  rund(c, 1191, 741, 82, 50, 9, "#222e4e");
  linie(c, [[1193, 760], [1271, 760]], "rgba(8,12,30,.5)", 3);
  linie(c, [[1196, 745], [1268, 745]], "rgba(118,152,222,.3)", 2.5);

  // Oberarm und Unterarm, im Licht der blauen Helmlampe.
  linie(c, [[1180, 512], [1105, 540], [1035, 562]], "#0e1733", 84);
  linie(c, [[1180, 510], [1105, 537], [1035, 559]], "#27437c", 68);
  linie(c, [[1152, 496], [1092, 517], [1042, 536]], "rgba(124,172,250,.5)", 6);
  linie(c, [[1035, 562], [985, 572], [945, 578]], "#0e1733", 74);
  linie(c, [[1035, 559], [985, 569], [945, 575]], "#213768", 58);
  linie(c, [[1030, 540], [990, 548], [958, 553]], "rgba(124,172,250,.42)", 5);

  // Manschette am Handgelenk.
  c.save();
  c.translate(948, 575);
  c.rotate(0.12);
  rund(c, -19, -38, 38, 76, 13, "#0e1733");
  rund(c, -16, -35, 32, 70, 11, "#2f4d8a");
  rund(c, -12, -31, 8, 62, 4, "rgba(146,186,252,.5)");
  c.restore();

  // Handschuh hängt locker über dem Knie.
  c.save();
  c.translate(893, 590);
  c.rotate(0.18);
  ell(c, 0, 1, 52, 33, "#0c1430");
  ell(c, -2, -3, 45, 26, "#1f2b4c");
  for (let i = 0; i < 3; i++) linie(c, [[-30 + i * 14, -13], [-34 + i * 14, 12]], "rgba(8,12,30,.6)", 3);
  bogen(c, -2, -3, 36, Math.PI * 1.1, Math.PI * 1.6, "rgba(124,164,236,.4)", 3);
  c.restore();

  // Schulterpanzer.
  kreis(c, 1186, 507, 62, "#0e1733");
  const s = c.createRadialGradient(1166, 484, 6, 1184, 504, 56);
  s.addColorStop(0, "#4b78c8");
  s.addColorStop(0.5, "#2a4682");
  s.addColorStop(1, "#1a2a54");
  kreis(c, 1184, 504, 55, s);
  bogen(c, 1184, 504, 44, Math.PI * 1.08, Math.PI * 1.6, "rgba(150,190,255,.45)", 4);
}

/**
 * Der Rucksack ist ein kantiger Gerätekasten mit liegendem Tank. Er hat
 * bewusst keine Kugel und kein „Gesicht“: nichts daran soll wie ein zweiter
 * Helm oder eine zweite Gestalt aussehen. Schlauch und Gurte binden ihn an
 * den Raumfahrer.
 */
function rucksack(c: C): void {
  // Leuchtstab am Tank, hinter dem Helm.
  linie(c, [[1318, 356], [1306, 238]], "rgba(240,244,228,.2)", 22);
  linie(c, [[1318, 356], [1306, 238]], "#f4f5ec", 7.5);

  const form: readonly Pt[] = [
    [1292, 420], [1306, 398], [1500, 398], [1516, 420], [1514, 560], [1502, 668], [1484, 770], [1462, 802],
    [1326, 806], [1300, 782], [1288, 690], [1286, 560],
  ];
  poly(c, form.map(([x, y]): Pt => [x + 4, y + 5]), "#0a1128");
  const g = c.createLinearGradient(1284, 0, 1517, 0);
  g.addColorStop(0, "#2b3e67");
  g.addColorStop(0.5, "#233357");
  g.addColorStop(1, "#1b2949");
  poly(c, form, g);
  c.save();
  polyPfad(c, form);
  c.clip();
  schein(c, 1480, 400, 120, 80, "50,230,205", 0.2);
  const unten = c.createLinearGradient(0, 600, 0, 810);
  unten.addColorStop(0, "rgba(6,10,28,0)");
  unten.addColorStop(1, "rgba(6,10,28,.42)");
  c.fillStyle = unten;
  c.fillRect(1280, 600, 240, 210);
  c.restore();

  // Rahmenleiste oben mit Nieten.
  rund(c, 1300, 400, 210, 24, 6, "#374b74");
  rund(c, 1305, 403, 200, 5, 2.5, "rgba(150,184,244,.32)");
  for (const [nx, ny] of [[1312, 444], [1424, 444], [1310, 730], [1484, 716]] as const) {
    kreis(c, nx, ny, 4, "rgba(150,184,244,.42)");
  }

  // Rechte Seitenplatte.
  rund(c, 1440, 434, 66, 150, 14, "#101a36");
  rund(c, 1443, 437, 60, 144, 12, "#2c3f69");
  rund(c, 1449, 444, 48, 10, 5, "rgba(146,180,242,.32)");
  for (let i = 0; i < 3; i++) rund(c, 1452, 474 + i * 30, 42, 12, 5, "rgba(10,16,40,.5)");

  // Tiefer Schacht in der Mitte.
  rund(c, 1319, 459, 110, 252, 50, "#3c5280");
  rund(c, 1324, 464, 100, 242, 46, "#090e22");
  rund(c, 1350, 492, 50, 186, 24, "#161f3e");
  rund(c, 1358, 500, 12, 170, 6, "rgba(118,152,222,.2)");
  for (let i = 0; i < 3; i++) rund(c, 1350, 540 + i * 44, 50, 6, 3, "rgba(8,12,30,.7)");

  // Runde Düse unten.
  kreis(c, 1376, 748, 54, "#0b1228");
  kreis(c, 1376, 748, 49, "#30426b");
  kreis(c, 1376, 748, 39, "#1b2544");
  kreis(c, 1376, 748, 30, "#0a0f22");
  bogen(c, 1376, 748, 17, 0, TAU, "#2b3b62", 4);
  kreis(c, 1376, 748, 6, "#1d2949");
  bogen(c, 1376, 748, 49, Math.PI * 1.05, Math.PI * 1.55, "rgba(146,180,246,.55)", 3.6);

  // Haken an der rechten Seite.
  bogen(c, 1501, 640, 17, 0, TAU, "#0d1530", 12);
  bogen(c, 1501, 640, 17, 0, TAU, "#2c3d67", 7);
  bogen(c, 1501, 640, 17, Math.PI * 1.1, Math.PI * 1.7, "rgba(146,180,246,.5)", 2.5);

  // Liegender Tank quer über dem Kasten, mit zwei Spannbändern.
  rund(c, 1310, 350, 198, 52, 26, "#0c1430");
  const tank = c.createLinearGradient(0, 352, 0, 400);
  tank.addColorStop(0, "#66a2c8");
  tank.addColorStop(0.45, "#3f7298");
  tank.addColorStop(1, "#243c5e");
  rund(c, 1313, 353, 192, 46, 23, tank);
  rund(c, 1334, 359, 146, 6, 3, "rgba(176,214,242,.32)");
  for (const bx of [1356, 1448]) rund(c, bx, 352, 10, 48, 4, "#16233f");

  // Grünes Kontrolllicht am rechten Tankende.
  rund(c, 1478, 361, 20, 32, 8, "#123c4a");
  ell(c, 1488, 377, 5.5, 11, "#7ff5e4");
  ell(c, 1487, 374, 3, 6.5, "#eafffb");

  // Geriffelter Schlauch vom Tank zum Helm: beides gehört sichtbar zusammen.
  linie(c, [[1330, 382], [1306, 386], [1282, 394]], "#0c1430", 20);
  linie(c, [[1330, 382], [1306, 386], [1282, 394]], "#2a3d66", 13);
  for (let i = 0; i < 4; i++) {
    linie(c, [[1324 - i * 10, 376 + i * 1.6], [1322 - i * 10, 390 + i * 1.6]], "rgba(8,12,30,.6)", 2.5);
  }

  // Tragegurt über die Schulter und Hüftgurt: der Kasten hängt am Raumfahrer.
  for (const [farbe, breite] of [["#0c1430", 20], ["#2a3b62", 13]] as const) {
    c.strokeStyle = farbe;
    c.lineWidth = breite;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(1308, 434);
    c.bezierCurveTo(1270, 440, 1236, 446, 1202, 452);
    c.bezierCurveTo(1168, 458, 1140, 482, 1126, 522);
    c.stroke();
    c.beginPath();
    c.moveTo(1298, 726);
    c.bezierCurveTo(1278, 734, 1258, 740, 1238, 744);
    c.stroke();
  }
}

function helm(c: C): void {
  const form: readonly Pt[] = [
    [1099, 302], [1124, 258], [1176, 241], [1242, 246], [1283, 281], [1297, 340], [1289, 402], [1256, 434],
    [1180, 442], [1124, 432], [1097, 402], [1089, 350],
  ];
  weich(c, form.map(([x, y]): Pt => [x + 3, y + 4]), "#0c1430");
  const g = c.createLinearGradient(0, 240, 0, 445);
  g.addColorStop(0, "#2d7db2");
  g.addColorStop(0.3, "#2a5e92");
  g.addColorStop(0.62, "#27406b");
  g.addColorStop(1, "#1b2a4a");
  weich(c, form, g);

  c.save();
  weichPfad(c, form);
  c.clip();
  // Die rechte Seite liegt im Schatten, links fällt das Lampenlicht auf die Schale.
  const schatten = c.createLinearGradient(1120, 0, 1300, 0);
  schatten.addColorStop(0, "rgba(8,14,40,0)");
  schatten.addColorStop(1, "rgba(8,14,40,.45)");
  c.fillStyle = schatten;
  c.fillRect(1080, 230, 230, 220);
  schein(c, 1105, 292, 130, 130, "70,160,255", 0.42);
  // Dunkle Sichtöffnung vorn unten und der Nackenring.
  poly(c, [[1084, 366], [1116, 384], [1152, 438], [1110, 442], [1084, 412]], "#0c1330");
  linie(c, [[1108, 425], [1180, 437], [1268, 429]], "#0e1733", 13);
  linie(c, [[1112, 416], [1180, 428], [1264, 420]], "rgba(118,156,228,.32)", 2.5);
  c.restore();

  // Nähte der Helmschale und die hintere Platte.
  c.strokeStyle = "rgba(8,14,40,.5)";
  c.lineWidth = 3;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(1122, 268);
  c.bezierCurveTo(1168, 262, 1214, 284, 1232, 302);
  c.bezierCurveTo(1256, 296, 1278, 302, 1292, 320);
  c.stroke();
  rund(c, 1226, 318, 54, 74, 14, "rgba(10,18,44,.42)");
  c.strokeStyle = "rgba(118,156,228,.3)";
  c.lineWidth = 2.5;
  c.beginPath();
  c.roundRect(1226, 318, 54, 74, 14);
  c.stroke();

  // Große runde Ohrmuschel.
  kreis(c, 1160, 362, 46, "#0e1733");
  kreis(c, 1160, 362, 41, "#283f6c");
  kreis(c, 1160, 362, 30, "#1c2d52");
  kreis(c, 1160, 362, 13, "#2e4878");
  kreis(c, 1160, 362, 5, "#101a36");
  bogen(c, 1160, 362, 41, Math.PI * 1.05, Math.PI * 1.6, "rgba(140,182,252,.6)", 3.2);

  // Kamm oben und die blaue Lampe vorn – die einzige Helmlampe im Bild.
  poly(c, [[1110, 270], [1126, 244], [1150, 246], [1138, 272]], "#3172a4");
  c.save();
  c.translate(1105, 292);
  c.rotate(-0.3);
  rund(c, -17, -21, 34, 42, 12, "#14305a");
  ell(c, 0, 0, 11, 15, "#8fe4ff");
  ell(c, -2, -3, 6, 9, "#ecfdff");
  c.restore();
}

function raumfahrer(c: C): void {
  // Schatten auf dem Deck.
  ell(c, 1080, 838, 470, 62, "rgba(6,10,30,.28)");
  eingeklappterStiefel(c);
  rumpf(c);
  vorderesBein(c);
  arm(c);
  rucksack(c);
  helm(c);
  // Lichthöfe: kräftig an der Helmlampe, klein am Kontrolllicht des Tanks.
  schein(c, 1105, 292, 80, 80, "80,175,255", 0.6);
  schein(c, 1105, 292, 28, 28, "200,240,255", 0.75);
  schein(c, 1488, 377, 48, 48, "60,235,210", 0.45);
  schein(c, 1488, 377, 16, 16, "210,255,248", 0.65);
}

/* ------------------------------ Gesamtbild ----------------------------- */

/**
 * Zeichnet die Szene in eine beliebige TV-Bildfläche. Die Vorlage bleibt
 * vollständig sichtbar; bei anderen Seitenverhältnissen laufen Himmel,
 * Felsen und Deck an den Rändern weiter, statt etwas abzuschneiden.
 */
export function drawSternennacht(c: C, x: number, y: number, w: number, h: number, t: number): void {
  if (w <= 0 || h <= 0) return;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();

  const s = Math.min(w / BW, h / BH);
  const ox = x + (w - BW * s) / 2;
  const oy = y + (h - BH * s) / 2;
  c.translate(ox, oy);
  c.scale(s, s);
  const vx = (x - ox) / s;
  const vy = (y - oy) / s;
  const vw = w / s;
  const vh = h / s;

  himmel(c, vx, vy, vw, vh, t);
  berge(c);
  boden(c);
  lichtpartikel(c, t, vx, vy, vw, vh, false);
  plattform(c);
  raumfahrer(c);
  lichtpartikel(c, t, vx, vy, vw, vh, true);

  // Nur ein Hauch Randabdunkelung; die Mitte bleibt hell.
  const rand = c.createRadialGradient(BW * 0.5, BH * 0.46, 420, BW * 0.5, BH * 0.46, 1150);
  rand.addColorStop(0, "rgba(5,9,26,0)");
  rand.addColorStop(1, "rgba(5,9,26,.08)");
  c.fillStyle = rand;
  c.fillRect(vx, vy, vw, vh);
  c.restore();
}
