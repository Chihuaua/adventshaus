/* =======================================================================
   STERNENNACHT – ruhiges TV-Bild ohne Bild- oder Audiodateien

   Zwei Raumfahrer sitzen auf einer Metallplattform über einer felsigen
   Nachtlandschaft. Die Vorlage wird ausschließlich mit Canvas-Primitiven
   nachgezeichnet. Gegenüber der sehr dunklen Vorlage sind Himmel, Gestein
   und Anzüge etwas heller, damit die Formen auch auf einem Fernseher lesbar
   bleiben. Einzig die Sterne verändern langsam ihre Leuchtkraft; Kamera,
   Landschaft und Figuren bleiben in Ruhe.
   ======================================================================= */

export type C = CanvasRenderingContext2D;
type Pt = readonly [number, number];
const TAU = Math.PI * 2;

export interface SternennachtStern {
  /** Normalisierte Position, dadurch bleibt der Himmel bei jedem TV-Format gefüllt. */
  u: number;
  v: number;
  r: number;
  /** Dauer eines vollständigen, sanften Leuchtzyklus in Sekunden. */
  periode: number;
  phase: number;
  helligkeit: number;
  warm: boolean;
}

/** Wiederholbares Zufallsbild: keine Sterne springen beim Neuzeichnen. */
function zufall(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

export const STERNENNACHT_STERNE: readonly SternennachtStern[] = Object.freeze(
  Array.from({ length: 190 }, (_, i): SternennachtStern => ({
    u: zufall(i * 7 + 1),
    v: zufall(i * 7 + 2) * 0.61,
    r: 0.65 + Math.pow(zufall(i * 7 + 3), 2.4) * 2.15,
    periode: 28 + zufall(i * 7 + 4) * 38,
    phase: zufall(i * 7 + 5) * TAU,
    helligkeit: 0.34 + zufall(i * 7 + 6) * 0.62,
    warm: zufall(i * 7 + 7) > 0.82,
  })),
);

/** Sanftes Auf- und Ableuchten ohne hartes Blinken. */
export function sternenLicht(stern: SternennachtStern, t: number): number {
  const welle = 0.5 + 0.5 * Math.cos((t * TAU) / stern.periode + stern.phase);
  const weich = welle * welle * (3 - 2 * welle);
  return stern.helligkeit * (0.1 + 0.9 * weich);
}

function poly(c: C, punkte: readonly Pt[], farbe: string | CanvasGradient): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) c.lineTo(punkte[i][0], punkte[i][1]);
  c.closePath();
  c.fill();
}

function pfad(c: C, punkte: readonly Pt[]): void {
  c.beginPath();
  c.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) c.lineTo(punkte[i][0], punkte[i][1]);
  c.closePath();
}

function kreis(c: C, x: number, y: number, r: number, farbe: string): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

function ell(c: C, x: number, y: number, rx: number, ry: number, farbe: string | CanvasGradient, dreh = 0): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.ellipse(x, y, rx, ry, dreh, 0, TAU);
  c.fill();
}

function rund(c: C, x: number, y: number, w: number, h: number, r: number, farbe: string | CanvasGradient): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}

function strich(c: C, punkte: readonly Pt[], farbe: string, breite: number): void {
  c.strokeStyle = farbe;
  c.lineWidth = breite;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) c.lineTo(punkte[i][0], punkte[i][1]);
  c.stroke();
}

/** Grosser, weicher Fleck für Nebel, Bodenlicht und Helmlampen. */
function schein(c: C, x: number, y: number, rx: number, ry: number, mitte: string, aussen = "rgba(20,55,90,0)"): void {
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, mitte);
  g.addColorStop(1, aussen);
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, 1, 0, TAU);
  c.fill();
  c.restore();
}

function himmel(c: C, x: number, y: number, w: number, h: number, t: number): void {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#132a47");
  g.addColorStop(0.43, "#1a3450");
  g.addColorStop(0.7, "#142a40");
  g.addColorStop(1, "#0d1d2d");
  c.fillStyle = g;
  c.fillRect(x, y, w, h);

  // Die blauen Nebel bleiben statisch; sichtbare Bewegung kommt nur vom Sternenlicht.
  schein(c, 630, 150, 260, 105, "rgba(49,101,153,.17)");
  schein(c, 965, 115, 215, 145, "rgba(45,91,151,.15)");
  schein(c, 400, 320, 220, 72, "rgba(49,105,145,.11)");
  schein(c, 1190, 20, 180, 115, "rgba(50,96,155,.1)");
  schein(c, 150, 90, 190, 90, "rgba(47,90,135,.07)");

  const himmelH = Math.min(h, Math.max(430, h * 0.61));
  for (let i = 0; i < STERNENNACHT_STERNE.length; i++) {
    const stern = STERNENNACHT_STERNE[i];
    const sx = x + stern.u * w;
    const sy = y + (stern.v / 0.61) * himmelH;
    const alpha = sternenLicht(stern, t);
    const farbe = stern.warm ? "235,239,220" : "207,229,249";
    if (stern.r > 2.05) {
      const glanz = c.createRadialGradient(sx, sy, 0, sx, sy, stern.r * 4.8);
      glanz.addColorStop(0, `rgba(${farbe},${(alpha * 0.48).toFixed(3)})`);
      glanz.addColorStop(1, `rgba(${farbe},0)`);
      c.fillStyle = glanz;
      c.beginPath();
      c.arc(sx, sy, stern.r * 4.8, 0, TAU);
      c.fill();
    }
    kreis(c, sx, sy, stern.r, `rgba(${farbe},${alpha.toFixed(3)})`);
    if (stern.r > 2.5 && alpha > 0.6) {
      strich(c, [[sx - stern.r * 2.4, sy], [sx + stern.r * 2.4, sy]], `rgba(${farbe},${(alpha * 0.42).toFixed(3)})`, 0.65);
      strich(c, [[sx, sy - stern.r * 2.4], [sx, sy + stern.r * 2.4]], `rgba(${farbe},${(alpha * 0.42).toFixed(3)})`, 0.65);
    }
  }
}

function landschaft(c: C, links: number, unten: number, rechts: number): void {
  // Sehr ferne Grate: durch den helleren Blauwert bleiben sie vom Himmel getrennt.
  poly(c, [
    [links - 80, 475], [links - 80, 390], [-40, 350], [55, 365], [125, 322], [190, 350],
    [270, 315], [350, 350], [440, 320], [520, 357], [610, 335], [710, 375], [805, 325],
    [900, 355], [1000, 320], [1100, 350], [1210, 315], [1330, 360], [1450, 330],
    [rechts + 80, 375], [rechts + 80, 500],
  ], "#244056");

  // Linker, spitzer Fels mit kleinerem Nebengipfel.
  const lf = c.createLinearGradient(220, 160, 500, 510);
  lf.addColorStop(0, "#1a3044");
  lf.addColorStop(1, "#102334");
  poly(c, [
    [55, 545], [115, 450], [175, 390], [230, 305], [278, 210], [326, 132], [348, 202],
    [371, 295], [410, 375], [445, 334], [474, 278], [505, 305], [548, 370], [610, 425],
    [690, 475], [690, 555],
  ], lf);
  poly(c, [[326, 132], [348, 202], [371, 295], [348, 352], [323, 274], [303, 236]], "#20394d");
  poly(c, [[230, 305], [278, 210], [303, 236], [279, 337], [248, 399], [191, 435]], "#1b3549");
  poly(c, [[410, 375], [445, 334], [474, 278], [466, 354], [445, 407]], "#274154");
  strich(c, [[326, 145], [301, 228], [279, 305], [244, 382]], "rgba(104,142,167,.2)", 3);
  strich(c, [[474, 290], [458, 343], [443, 370]], "rgba(105,143,164,.17)", 2.4);

  // Rechte Felsgruppe mit den drei charakteristischen Zacken.
  const rf = c.createLinearGradient(1080, 60, 1280, 520);
  rf.addColorStop(0, "#172b3e");
  rf.addColorStop(1, "#102131");
  poly(c, [
    [725, 525], [790, 452], [855, 402], [910, 335], [958, 285], [1000, 190], [1034, 105],
    [1068, 55], [1084, 137], [1098, 198], [1130, 245], [1156, 159], [1195, 72], [1224, 82],
    [1260, 142], [1298, 165], [1338, 146], [1372, 98], [1398, 112], [1430, 184], [1460, 275],
    [1500, 340], [1575, 405], [1690, 470], [1690, 555],
  ], rf);
  poly(c, [[1068, 55], [1084, 137], [1098, 198], [1075, 237], [1054, 165]], "#21394c");
  poly(c, [[1195, 72], [1224, 82], [1260, 142], [1228, 174], [1198, 142], [1175, 205]], "#1d3548");
  poly(c, [[1372, 98], [1398, 112], [1430, 184], [1408, 235], [1384, 174]], "#20384a");
  poly(c, [[958, 285], [1000, 190], [1034, 105], [1016, 241], [980, 342], [924, 393]], "#1b3245");
  poly(c, [[1130, 245], [1156, 159], [1175, 205], [1160, 315], [1110, 385]], "#1a3042");
  strich(c, [[1066, 69], [1042, 144], [1020, 223]], "rgba(104,139,161,.16)", 2.6);
  strich(c, [[1194, 83], [1170, 150], [1157, 205]], "rgba(108,143,164,.14)", 2.3);

  // Talsohle und mehrere Felsbänder, bewusst nicht tiefschwarz.
  const tal = c.createLinearGradient(0, 390, 0, Math.max(900, unten));
  tal.addColorStop(0, "#1b3448");
  tal.addColorStop(0.5, "#142b3e");
  tal.addColorStop(1, "#102233");
  poly(c, [
    [links - 100, 410], [100, 420], [250, 455], [390, 438], [540, 480], [720, 445],
    [880, 475], [1050, 430], [1240, 455], [1430, 420], [rechts + 100, 450],
    [rechts + 100, unten + 100], [links - 100, unten + 100],
  ], tal);
  poly(c, [[-80, 525], [120, 470], [285, 488], [420, 462], [560, 505], [720, 480], [850, 510], [970, 485], [1110, 525], [1110, 580], [-80, 590]], "#1a3246");
  poly(c, [[-60, 630], [130, 560], [320, 580], [490, 535], [650, 570], [810, 540], [930, 585], [1030, 570], [1100, 625], [1050, 700], [-60, 720]], "#162d41");
  poly(c, [[70, 515], [205, 475], [330, 492], [270, 520], [155, 530]], "#203b50");
  poly(c, [[400, 555], [560, 505], [690, 520], [625, 552], [510, 575]], "#1d374b");
  poly(c, [[55, 657], [235, 590], [375, 605], [280, 650], [145, 680]], "#1b3449");

  // Vereinzelte Steinflächen und Grate; feste Positionen, kein Flackern.
  for (let i = 0; i < 48; i++) {
    const rx = -30 + zufall(i * 5 + 700) * 1110;
    const ry = 430 + zufall(i * 5 + 701) * 290;
    const rw = 10 + zufall(i * 5 + 702) * 35;
    const rh = 4 + zufall(i * 5 + 703) * 13;
    poly(c, [[rx - rw, ry + rh], [rx - rw * 0.25, ry - rh], [rx + rw, ry], [rx + rw * 0.45, ry + rh * 1.2]],
      i % 3 === 0 ? "#234056" : i % 3 === 1 ? "#1c374b" : "#193246");
    if (i % 4 === 0) strich(c, [[rx - rw * 0.25, ry - rh], [rx + rw * 0.7, ry - 1]], "rgba(101,141,164,.13)", 1.4);
  }

  // Ein wenig Bodennebel in der Senke, nicht über den hellen Sternen.
  schein(c, 510, 450, 600, 58, "rgba(76,116,143,.075)");
}

function plattform(c: C, unten: number, rechts: number): void {
  // Dicke Vorderkante.
  poly(c, [[220, 790], [795, 650], [rechts + 120, 748], [rechts + 120, unten + 120], [400, unten + 120], [220, 840]], "#101e2c");
  const deck = c.createLinearGradient(350, 690, 930, 930);
  deck.addColorStop(0, "#354c61");
  deck.addColorStop(0.5, "#293e52");
  deck.addColorStop(1, "#1c3043");
  poly(c, [[220, 790], [795, 650], [rechts + 120, 748], [rechts + 120, unten + 80], [405, unten + 80]], deck);

  c.save();
  pfad(c, [[220, 790], [795, 650], [rechts + 120, 748], [rechts + 120, unten + 80], [405, unten + 80]]);
  c.clip();
  // Plattenstöße folgen der perspektivischen Richtung der Plattform.
  for (let i = 0; i < 8; i++) {
    const y = 704 + i * 48;
    strich(c, [[160, y + 95], [1700, y - 45]], "rgba(7,20,32,.58)", 3);
    strich(c, [[160, y + 92], [1700, y - 48]], "rgba(101,132,153,.12)", 1);
  }
  for (let i = 0; i < 8; i++) {
    const x = 330 + i * 190;
    strich(c, [[x, 650], [x + 160, 1000]], "rgba(8,22,34,.55)", 3);
  }
  schein(c, 1060, 760, 430, 180, "rgba(33,100,150,.12)");
  c.restore();

  strich(c, [[224, 788], [795, 650], [rechts + 100, 746]], "rgba(131,160,180,.42)", 4);
  strich(c, [[224, 799], [224, 838], [405, unten + 60]], "rgba(52,79,99,.65)", 4);
  // Kleine Schrauben an der vorderen Kante.
  for (const [x, y] of [[286, 792], [470, 748], [660, 702], [835, 666]] as const) {
    ell(c, x, y, 4.2, 2.2, "#15293a");
    ell(c, x - 0.5, y - 0.7, 2.2, 1.1, "rgba(150,174,188,.45)");
  }
}

interface AnzugFarben {
  lampe: string;
  lampeRGB: string;
  stoff: string;
  stoffHell: string;
  schale: string;
  kante: string;
}

/** Ein sitzender Raumfahrer, Blick und Beine zeigen nach links. */
function raumfahrer(c: C, x: number, y: number, skala: number, f: AnzugFarben): void {
  c.save();
  c.translate(x, y);
  c.scale(skala, skala);

  // Weicher Schatten unmittelbar auf dem Metalldeck.
  ell(c, -110, 65, 350, 54, "rgba(4,13,23,.36)", -0.03);

  // Hinteres Bein und Stiefel.
  strich(c, [[25, 4], [-105, 62], [-255, 86], [-365, 75]], "#122333", 104);
  strich(c, [[20, -2], [-108, 51], [-255, 73], [-360, 63]], f.stoff, 84);
  strich(c, [[-70, 35], [-210, 58], [-315, 52]], "rgba(93,137,165,.3)", 5);
  c.save();
  c.translate(-390, 66);
  c.rotate(-0.08);
  rund(c, -75, -35, 123, 70, 24, "#132535");
  rund(c, -69, -30, 104, 48, 19, "#263e51");
  strich(c, [[-66, 24], [36, 24]], "#0d1c29", 10);
  for (let i = 0; i < 4; i++) strich(c, [[-42 + i * 18, -24], [-38 + i * 18, -8]], "rgba(111,143,159,.35)", 3);
  c.restore();

  // Hinterer Arm.
  strich(c, [[48, -196], [-56, -114], [-162, -123]], "#142636", 66);
  strich(c, [[45, -199], [-58, -123], [-160, -132]], f.stoff, 50);

  // Lebenserhaltungsrucksack hinter dem Rücken.
  const pack = c.createLinearGradient(65, -230, 190, 20);
  pack.addColorStop(0, "#3b5262");
  pack.addColorStop(1, "#1b2f40");
  rund(c, 62, -250, 135, 270, 30, "#122332");
  rund(c, 70, -247, 122, 254, 25, pack);
  rund(c, 103, -216, 70, 146, 14, "#22394b");
  for (let i = 0; i < 5; i++) rund(c, 115, -199 + i * 24, 47, 7, 3, "rgba(115,145,160,.23)");
  ell(c, 142, -27, 29, 22, "#142736");
  kreis(c, 142, -27, 12, "#3c5261");
  strich(c, [[183, -190], [196, -85], [181, -18]], "rgba(96,130,149,.34)", 4);

  // Torso mit blauem Licht von der linken Bildseite.
  const torso = c.createLinearGradient(-70, -180, 130, -80);
  torso.addColorStop(0, f.stoffHell);
  torso.addColorStop(0.52, f.stoff);
  torso.addColorStop(1, "#1a2e40");
  poly(c, [[-46, -218], [18, -253], [78, -229], [112, -160], [121, -62], [82, 28], [-19, 38], [-76, -47], [-72, -152]], torso);
  poly(c, [[-46, -218], [18, -253], [38, -225], [-18, -189], [-59, -102], [-72, -152]], "rgba(80,129,162,.23)");
  rund(c, -45, -16, 139, 42, 12, "#162a3b");
  rund(c, -37, -11, 121, 14, 6, "#3a5263");
  for (const bx of [-20, 15, 50]) rund(c, bx, -9, 20, 25, 4, "#233c4e");
  strich(c, [[-52, -151], [-42, -61], [-16, -29]], "rgba(117,153,171,.26)", 3);
  strich(c, [[60, -211], [82, -141], [79, -67]], "rgba(9,24,37,.55)", 4);

  // Vorderes Bein: angewinkeltes Knie und ausgestreckter unterer Teil.
  strich(c, [[-4, 5], [-118, -22], [-218, -119], [-303, -8], [-378, 51]], "#122434", 108);
  strich(c, [[-7, -3], [-120, -32], [-217, -126], [-298, -19], [-374, 39]], f.stoff, 86);
  strich(c, [[-56, -20], [-133, -48], [-189, -103]], "rgba(92,144,178,.36)", 6);
  strich(c, [[-245, -102], [-300, -27], [-351, 15]], "rgba(92,135,161,.24)", 5);
  ell(c, -217, -120, 61, 57, "#172c3e", -0.2);
  ell(c, -222, -127, 47, 42, "#34536a", -0.2);
  ell(c, -230, -136, 29, 22, "rgba(93,137,163,.24)", -0.2);
  // Vorderer Stiefel.
  c.save();
  c.translate(-402, 48);
  c.rotate(-0.12);
  rund(c, -74, -37, 123, 74, 24, "#122333");
  rund(c, -69, -32, 105, 50, 19, "#2a4357");
  strich(c, [[-68, 25], [39, 25]], "#0d1c29", 11);
  for (let i = 0; i < 4; i++) strich(c, [[-42 + i * 18, -25], [-38 + i * 18, -8]], "rgba(116,148,164,.38)", 3);
  c.restore();

  // Vorderer Arm ruht auf dem angewinkelten Knie.
  strich(c, [[4, -190], [-95, -113], [-185, -127], [-262, -112]], "#132535", 69);
  strich(c, [[1, -195], [-96, -124], [-185, -137], [-259, -121]], f.stoffHell, 51);
  strich(c, [[-32, -177], [-105, -127], [-172, -136]], "rgba(110,160,190,.38)", 5);
  ell(c, -277, -118, 43, 28, "#172c3d", -0.08);
  ell(c, -282, -124, 34, 20, "#365269", -0.08);
  for (let i = 0; i < 3; i++) strich(c, [[-301 + i * 10, -130], [-294 + i * 10, -115]], "rgba(135,160,172,.3)", 2.2);

  // Schlauch und Verschluss unter dem Helm.
  c.strokeStyle = "#0e2130";
  c.lineWidth = 16;
  c.beginPath();
  c.moveTo(64, -229);
  c.bezierCurveTo(137, -207, 121, -111, 93, -81);
  c.stroke();
  c.strokeStyle = "rgba(82,116,137,.42)";
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(67, -227);
  c.bezierCurveTo(127, -199, 114, -116, 91, -89);
  c.stroke();
  ell(c, 7, -239, 71, 25, "#132635");
  ell(c, 3, -245, 61, 18, "#496273");

  // Kuppelhelm und dunkles Visier.
  const helm = c.createRadialGradient(-45, -390, 12, 5, -340, 135);
  helm.addColorStop(0, "#49687c");
  helm.addColorStop(0.43, f.schale);
  helm.addColorStop(1, "#172b3d");
  ell(c, 4, -340, 111, 105, "#122434");
  ell(c, 0, -346, 105, 100, helm);
  // Visier liegt auf der linken, zur Landschaft gewandten Seite.
  const visier = c.createLinearGradient(-95, -400, 25, -275);
  visier.addColorStop(0, "#1c3b53");
  visier.addColorStop(0.5, "#102638");
  visier.addColorStop(1, "#0a1b2a");
  ell(c, -50, -351, 68, 80, visier, -0.13);
  c.strokeStyle = f.kante;
  c.lineWidth = 5;
  c.beginPath();
  c.ellipse(-49, -351, 70, 82, -0.13, Math.PI * 0.63, Math.PI * 1.65);
  c.stroke();
  c.strokeStyle = "rgba(137,179,199,.24)";
  c.lineWidth = 4;
  c.beginPath();
  c.arc(-16, -363, 83, Math.PI * 1.12, Math.PI * 1.75);
  c.stroke();
  // Helmpaneele und kleiner, warmer Reflexstreifen.
  strich(c, [[39, -432], [70, -398], [86, -350]], "rgba(9,26,39,.52)", 4);
  rund(c, 64, -413, 10, 78, 5, "rgba(236,239,211,.78)");
  schein(c, 69, -374, 30, 70, "rgba(238,239,199,.08)", "rgba(238,239,199,0)");

  // Blaue beziehungsweise türkise Helmlampe wie in der Vorlage.
  schein(c, -91, -367, 76, 76, `rgba(${f.lampeRGB},.34)`, `rgba(${f.lampeRGB},0)`);
  ell(c, -91, -367, 19, 23, "#142b3d", -0.25);
  ell(c, -94, -369, 12, 15, f.lampe, -0.25);
  ell(c, -98, -374, 5, 7, "rgba(231,252,255,.95)", -0.25);
  strich(c, [[-104, -357], [-91, -350]], `rgba(${f.lampeRGB},.75)`, 3);

  c.restore();
}

/**
 * Zeichnet die Szene in eine beliebige TV-Bildfläche. Die Komposition bleibt
 * proportional erhalten; bei anderen Seitenverhältnissen werden Himmel und
 * Landschaft an den Rändern fortgesetzt statt Figuren abzuschneiden.
 */
export function drawSternennacht(c: C, x: number, y: number, w: number, h: number, t: number): void {
  if (w <= 0 || h <= 0) return;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();

  const s = Math.min(w / 1600, h / 900);
  const ox = x + (w - 1600 * s) / 2;
  const oy = y + (h - 900 * s) / 2;
  c.translate(ox, oy);
  c.scale(s, s);
  const vx = (x - ox) / s;
  const vy = (y - oy) / s;
  const vw = w / s;
  const vh = h / s;
  const rechts = vx + vw;
  const unten = vy + vh;

  himmel(c, vx, vy, vw, vh, t);
  landschaft(c, vx, unten, rechts);
  plattform(c, unten, rechts);

  // Der zweite Raumfahrer sitzt etwas weiter hinten und bleibt auch bei 4:3 sichtbar.
  raumfahrer(c, 1380, 710, 0.88, {
    lampe: "#54e5ce", lampeRGB: "66,232,208", stoff: "#293f50", stoffHell: "#365b6c",
    schale: "#344f60", kante: "rgba(91,132,151,.52)",
  });
  raumfahrer(c, 1125, 745, 1.1, {
    lampe: "#42bffc", lampeRGB: "45,174,255", stoff: "#2a4358", stoffHell: "#37617e",
    schale: "#395a71", kante: "rgba(94,144,173,.55)",
  });

  // Leichte Randabdunkelung, die helleren Mitteltöne bleiben erhalten.
  const vignette = c.createRadialGradient(800, 430, 280, 800, 430, 1030);
  vignette.addColorStop(0, "rgba(3,10,19,0)");
  vignette.addColorStop(1, "rgba(3,10,19,.2)");
  c.fillStyle = vignette;
  c.fillRect(vx, vy, vw, vh);
  c.restore();
}
