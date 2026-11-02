/* Gruselhaus, Raum 04: Biohazard-Bad. Nur Canvas, keine Assets. */
import type { Station } from "../house";

type C = CanvasRenderingContext2D;
type Pt = [number, number];

export const BIO_BAD = {
  links: 491, rechts: 693, decke: 212, boden: 324,
  kapsel: { x: 500, y: 232, w: 46, h: 92, augeY: 274 },
  panel: { x: 550, y: 258, w: 13, h: 29, knopf: [555.5, 271] as Pt, stand: 558 },
  hazmat: { x: 555, y: 295 },
  wc: { x: 571, y: 272, w: 44, h: 52, hebel: [610, 278] as Pt, stand: 619 },
  becken: { x: 630, y: 284, w: 38, h: 40 },
  crt: { x: 627, y: 234, w: 39, h: 32 },
  spind: { x: 667, y: 243, w: 23, h: 36, stand: 677 },
} as const;

/** Nur Gruselhaus-Kopien der Stationen anpassen. */
export function badezimmerStationen(stations: readonly Station[]): Station[] {
  const changes: Record<string, Partial<Station>> = {
    dusche: { label: "Dekon-Kapsel", x: BIO_BAD.panel.stand, face: -1,
      hits: [[499, 234, 48, 88], [546, 256, 24, 33]] },
    spiegelschrank: { label: "Laborspind", x: BIO_BAD.spind.stand, face: 1,
      hits: [[665, 240, 28, 40]] },
    buerste: { label: "Haarbürste", x: BIO_BAD.spind.stand, face: 1,
      hits: [[665, 249, 28, 30]] },
    brille: { x: 633, hits: [[630, 279, 27, 25]] },
  };
  return [
    ...stations.map((st) => changes[st.id] ? { ...st, ...changes[st.id] } : st),
    { id: "bio_wc", label: "Verbrennungs-WC", floor: 2, x: BIO_BAD.wc.stand,
      face: -1, state: "act", expr: "focus", hits: [[573, 266, 46, 56]] },
  ];
}

const rect = (c: C, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};
const line = (c: C, x: number, y: number, xx: number, yy: number, color: string, w = 1) => {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.stroke();
};
const disc = (c: C, x: number, y: number, r: number, color: string) => {
  c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
};
const ellipse = (c: C, x: number, y: number, rx: number, ry: number, color: string) => {
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
};
const round = (c: C, x: number, y: number, w: number, h: number, r: number, color: string) => {
  c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
};
const clipBad = (c: C) => { c.beginPath(); c.rect(491, 212, 202, 112); c.clip(); };

function rohr(c: C, x: number, y: number, xx: number, yy: number, w = 3) {
  line(c, x + .7, y + .7, xx + .7, yy + .7, "#151f21", w + 1.8);
  line(c, x, y, xx, yy, "#654c3b", w);
  line(c, x - .55, y - .6, xx - .55, yy - .6, "rgba(202,132,85,.38)", .65);
}

/** Wettergegerbte Labor-Kacheln, Rohre, hängende Kabel und kalte Deckenleuchte. */
export function drawBioBadWall(c: C) {
  c.save(); clipBad(c);
  rect(c, 491, 212, 202, 112, "#263338");
  for (let y = 212, row = 0; y < 324; y += 12, row++) {
    for (let x = 491 - (row % 2) * 8; x < 693; x += 16) {
      const col = ["#304147", "#39474a", "#314043", "#41504c", "#293c40"][(row * 7 + x * 3) % 5];
      rect(c, x + .55, y + .55, 15, 11, col);
      rect(c, x + 1.2, y + 1, 12, .6, "rgba(209,224,211,.12)");
      if ((row + x) % 5 === 0) line(c, x + 4, y + 8, x + 9, y + 8.5, "rgba(79,37,24,.4)", .8);
      if ((row * 3 + x) % 7 === 0) disc(c, x + 11, y + 5, 1.2, "rgba(14,24,24,.31)");
    }
  }
  rect(c, 491, 212, 202, 5, "#1b272b");
  rect(c, 491, 318, 202, 6, "#2b3637");
  for (let x = 499; x < 693; x += 18) line(c, x, 318, x - 2, 324, "#162326", .65);

  rohr(c, 497, 224, 689, 224, 4.3);
  for (const x of [515, 576, 626, 681]) {
    rect(c, x - 2, 220, 4, 9, "#343937");
    disc(c, x, 222, 1.2, "#936c4b");
  }
  rohr(c, 576, 224, 576, 264, 2.2);
  rohr(c, 610, 224, 610, 270, 2.4);
  for (const x of [578, 613]) {
    line(c, x, 221, x + 3, 238, "#121d20", .9);
    line(c, x + 3, 238, x + 1, 249, "#3a3532", .9);
  }
  // Kaltes Dauerlicht, keine blinkende Deckenlampe.
  round(c, 579, 213, 45, 5, 1.5, "#172225");
  rect(c, 581, 216, 41, 1.5, "#91b9aa");
  c.restore();
}

function schlauch(c: C, x: number, y: number, xx: number, yy: number, bend: number) {
  c.lineWidth = 5;
  c.strokeStyle = "#20272a";
  c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + bend, y + 5, xx + bend, yy - 9, xx, yy); c.stroke();
  c.lineWidth = 2.6;
  c.strokeStyle = "#484c40"; c.stroke();
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    const mt = 1 - t;
    const bx = mt ** 3 * x + 3 * mt ** 2 * t * (x + bend) + 3 * mt * t * t * (xx + bend) + t ** 3 * xx;
    const by = mt ** 3 * y + 3 * mt ** 2 * t * (y + 5) + 3 * mt * t * t * (yy - 9) + t ** 3 * yy;
    line(c, bx - 2, by - 1.3, bx + 2, by + 1.3, "#191f21", .85);
  }
}

function drawCapsuleBack(c: C) {
  const p = BIO_BAD.kapsel;
  round(c, p.x - 3, p.y - 3, p.w + 6, p.h + 4, 12, "#6a6241");
  round(c, p.x, p.y, p.w, p.h, 11, "#8b803f");
  round(c, p.x + 3, p.y + 4, p.w - 6, p.h - 10, 8, "#18252a");
  rect(c, p.x + 7, p.y + 7, p.w - 14, p.h - 19, "#253438");
  for (const x of [p.x + 8, p.x + p.w - 8]) {
    line(c, x, p.y + 11, x, p.y + p.h - 12, "#717761", 1.2);
    for (let i = 0; i < 8; i++) {
      const y = p.y + 16 + i * 8.3;
      disc(c, x, y, 1.55, "#9ca6a2"); disc(c, x, y, .65, "#263135");
    }
  }
  // Plattenrillen und Bodenteller der Kapsel.
  for (let y = 250; y < 314; y += 8) line(c, p.x + 10, y, p.x + p.w - 10, y, "rgba(187,218,205,.14)", .65);
  ellipse(c, p.x + p.w / 2, 320, 17, 2, "#717460");
  rect(c, p.x + 2, 319, p.w - 4, 4, "#6e633c");
  line(c, p.x + 1, 321, p.x + p.w - 1, 321, "#e3ce83", .8);
  // Beidseitig dicke, geriffelte Versorgungsschläuche.
  schlauch(c, p.x + 4, p.y + 28, 497, 313, -8);
  schlauch(c, p.x + p.w - 4, p.y + 26, 548, 306, 9);
}

/** Drei Bögen und drei Kreise, rein geometrisch gezeichnetes Biohazard-Zeichen. */
function biohazard(c: C, x: number, y: number, radius: number) {
  c.save(); c.translate(x, y); c.fillStyle = "#111612";
  for (let i = 0; i < 3; i++) {
    c.save(); c.rotate(i * (Math.PI * 2 / 3));
    c.beginPath();
    c.arc(0, -radius * .54, radius * .52, .15, Math.PI - .15);
    c.arc(0, -radius * .54, radius * .24, Math.PI - .1, .1, true);
    c.closePath(); c.fill(); c.restore();
  }
  disc(c, 0, 0, radius * .28, "#111612");
  disc(c, 0, 0, radius * .12, "#b4a55d");
  c.restore();
}

/** Mechanisches Bedienfeld neben der Tür; Luni muss den Knopf selbst drücken. */
function drawPanel(c: C, press = 0) {
  const p = BIO_BAD.panel;
  round(c, p.x - 1, p.y - 1, p.w + 2, p.h + 2, 2, "#222827");
  rect(c, p.x + 1, p.y + 2, p.w - 2, p.h - 5, "#555849");
  rect(c, p.x + 3, p.y + 5, p.w - 6, 4, "#172723");
  line(c, p.x + 4, p.y + 7, p.x + 7, p.y + 7, "#95bd7f", .8);
  disc(c, p.knopf[0], p.knopf[1], 2.6, press ? "#dc8b3a" : "#bcb097");
  disc(c, p.knopf[0], p.knopf[1], 1.4, press ? "#f9de8f" : "#433d32");
  for (const y of [p.y + 20, p.y + 25]) { line(c, p.x + 3, y, p.x + 9, y, "#8b8570", .6); disc(c, p.x + 4, y, .45, "#1e2727"); }
  line(c, p.x + p.w / 2, p.y + p.h, p.x + p.w / 2 + 1, 317, "#a66343", 1.3);
}

function drawHazmat(c: C, hung: boolean) {
  const p = BIO_BAD.hazmat;
  line(c, p.x - 7, p.y - 15, p.x + 7, p.y - 15, "#72533f", 2.4);
  line(c, p.x - 6, p.y - 15, p.x - 6, p.y - 7, "#72533f", 1.3);
  line(c, p.x + 6, p.y - 15, p.x + 6, p.y - 7, "#72533f", 1.3);
  ellipse(c, p.x, p.y - 7, 7.5, 4, "#a8b0a1");
  ellipse(c, p.x, p.y - 7, 4, 2.7, "#647064");
  ellipse(c, p.x, p.y - 7, 1.1, 1.1, "#303b38");
  for (let i = -5; i <= 5; i += 2) line(c, p.x + i, p.y - 10, p.x + i + 1.3, p.y - 5, "rgba(42,67,61,.35)", .65);
  if (hung) drawHazmatVlies(c, p.x, p.y - 5);
}

/** Dasselbe Schutzvlies am Rollhalter und in Lunis Hand. */
export function drawHazmatVlies(c: C, x: number, y: number) {
  rect(c, x - 4.5, y, 9, 11, "#b6beb0");
  line(c, x - 3, y + 1, x - 3, y + 10, "#758379", .7);
  line(c, x - 4, y + 10, x + 4, y + 10, "#c6cbbb", .8);
  for (const dx of [-1.3, 2]) line(c, x + dx, y + 2, x + dx, y + 9, "rgba(77,93,87,.22)", .5);
}

function drawWC(c: C) {
  const t = BIO_BAD.wc;
  round(c, t.x + 8, t.y, 25, 17, 3, "#596066");
  round(c, t.x + 11, t.y + 2, 19, 10, 2, "#383f42");
  rect(c, t.x + 9, t.y + 16, 23, 2, "#8c9089");
  round(c, t.x + 4, t.y + 26, 34, 25, 5, "#646c6b");
  c.fillStyle = "#141719"; c.beginPath(); c.ellipse(t.x + 21, t.y + 26, 17, 6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#9ba9a5"; c.lineWidth = 2.3; c.stroke();
  ellipse(c, t.x + 21, t.y + 27, 12, 3, "#24211d");
  rect(c, t.x + 11, t.y + 38, 20, 12, "#565e60");
  rect(c, t.x + 8, t.y + 49, 26, 2.5, "#343e40");
  for (const [x, y] of [[t.x + 11, t.y + 19], [t.x + 33, t.y + 39], [t.x + 19, t.y + 46]]) {
    line(c, x, y, x + 4, y + 1, "#926646", .9);
  }
  line(c, t.hebel[0], t.hebel[1] + 2, t.hebel[0], t.hebel[1] - 2, "#9aa2a1", 1.4);
  disc(c, t.hebel[0], t.hebel[1] - 2, 2, "#9da7a5");
  line(c, 591, 321, 608, 321, "rgba(235,240,229,.28)", .6);
}

function drawSpind(c: C) {
  const s = BIO_BAD.spind;
  round(c, s.x, s.y, s.w, s.h, 1.5, "#252c2e");
  rect(c, s.x + 2, s.y + 2, s.w - 4, s.h - 4, "#576166");
  for (const y of [s.y + 7, s.y + 9, s.y + 11]) line(c, s.x + 5, y, s.x + 13, y, "#2a3738", .7);
  rect(c, s.x + 17, s.y + 17, 1.2, 5, "#b5b7a3");
  line(c, s.x + 2, s.y + 1, s.x + 20, s.y + 1, "#a6a99c", .65);
  line(c, s.x + 3, s.y + 31, s.x + 6, s.y + 32, "#946c51", .8);
}

/** Dieselbe Bürste im Spind und in Lunis Hand; keine springende Requisite. */
export function drawLabBrush(c: C, x: number, y: number, rot = 0, face: 1 | -1 = 1) {
  c.save(); c.translate(x, y); c.scale(face, 1); c.rotate(rot);
  round(c, -1.2, -9, 2.4, 10, 1, "#8eaaa1");
  round(c, -2.6, 0, 5.2, 7.6, 1.7, "#b2bcb1");
  for (let yy = 1; yy <= 7; yy += 1.4) line(c, 2.4, yy, 4, yy, "#202523", .75);
  c.restore();
}

/** Laborspind für die bestehende Schrank- und Bürstenroutine. */
export function drawLabLockerOpen(c: C, open: number, brushInside: boolean) {
  if (open <= .01) return;
  const s = BIO_BAD.spind;
  c.save(); clipBad(c);
  round(c, s.x + 2, s.y + 2, s.w - 4, s.h - 4, 1, "#202a2b");
  rect(c, s.x + 3, s.y + 19, s.w - 6, 1.2, "#8b9182");
  // Auf dem Fach liegt sie genau an der Position von Lunis Greifhand.
  if (brushInside) drawLabBrush(c, s.x + 17.5, s.y + 27, -.7);
  round(c, s.x - 4 * open, s.y + 1, Math.max(3, 19 * (1 - open)), s.h - 2, 1, "#576166");
  line(c, s.x - 4 * open + 2, s.y + 4, s.x - 4 * open + 2, s.y + s.h - 4, "rgba(206,212,197,.3)", .8);
  c.restore();
}

function drawSink(c: C) {
  const b = BIO_BAD.becken;
  rect(c, b.x + 12, b.y + 10, 12, b.h - 10, "#4c5459");
  rect(c, b.x + 13, b.y + 10, 2, b.h - 11, "#a3aba9");
  round(c, b.x, b.y, b.w, 10, 3, "#939d9a");
  round(c, b.x + 3, b.y + 1.5, b.w - 6, 6, 2, "#3f4a49");
  ellipse(c, b.x + b.w / 2, b.y + 4, 12, 2, "#202d2f");
  disc(c, b.x + b.w / 2, b.y + 4.4, 1.1, "#888e83");
  line(c, b.x + 8, b.y + 2, b.x + 13, b.y + 2, "rgba(242,239,224,.5)", .8);
  line(c, b.x + 16, b.y + 1, b.x + 16, b.y - 7, "#9da6a0", 2);
  line(c, b.x + 16, b.y - 7, b.x + 24, b.y - 7, "#9da6a0", 1.5);
  line(c, b.x + 31, b.y + 8, b.x + 36, b.y + 8, "#915d42", 1.2);
}

function drawCamera(c: C) {
  rohr(c, 675, 225, 664, 234, 1.3);
  round(c, 668, 225, 14, 7, 1, "#564b43");
  round(c, 671, 227, 8, 4, 1, "#899089");
  disc(c, 670, 230, 2.1, "#202a28"); disc(c, 669.6, 229.5, .8, "#628e72");
  line(c, 679, 226, 683, 219, "#443f36", 1.1);
  line(c, 666, 230, 661, 236, "#523e32", 1);
}

function drawCRTFrame(c: C) {
  const m = BIO_BAD.crt;
  round(c, m.x - 1, m.y - 2, m.w + 2, m.h + 4, 3, "#151b1c");
  rect(c, m.x + 2, m.y + 1, m.w - 4, m.h - 4, "#3f4640");
  round(c, m.x + 4, m.y + 4, m.w - 8, 20, 3, "#0d1f1a");
  rect(c, m.x + 2, m.y + 27, m.w - 4, 1.2, "#66756c");
  disc(c, m.x + 7, m.y + 30, 1, "#7d9a6c");
  line(c, m.x + 22, m.y + 30, m.x + 32, m.y + 30, "#1b2621", 1.4);
  for (const [dx, dy] of [[6, 4], [31, 23], [35, 27]]) {
    line(c, m.x + dx, m.y + dy, m.x + dx + 3, m.y + dy + 1.2, "#805238", .7);
  }
}

/** Kleine grünstichige Canvas-Kameraansicht, keine echte Webcam. */
export function drawLabMonitor(c: C, t: number, capsuleInside: boolean) {
  const m = BIO_BAD.crt;
  c.save(); clipBad(c);
  c.beginPath(); c.roundRect(m.x + 4, m.y + 4, m.w - 8, 20, 3); c.clip();
  const flicker = 0.91 + 0.04 * Math.sin(t * 8.3) + 0.02 * Math.sin(t * 17.1);
  c.globalAlpha = flicker;
  rect(c, m.x + 4, m.y + 4, m.w - 8, 20, "#172d25");
  line(c, m.x + 6, m.y + 20, m.x + 33, m.y + 20, "#457d58", .9);
  rect(c, m.x + 7, m.y + 10, 8, 11, "#3d6c4c");
  rect(c, m.x + 8, m.y + 12, 5, 8, "#12251c");
  if (capsuleInside) { disc(c, m.x + 10.5, m.y + 15, 1, "#96c58e"); line(c, m.x + 10.5, m.y + 16, m.x + 10.5, m.y + 19, "#96c58e", .75); }
  rect(c, m.x + 22, m.y + 15, 6, 6, "#3e6350");
  line(c, m.x + 18, m.y + 6, m.x + 18, m.y + 21, "#50755a", .45);
  for (let yy = m.y + 5; yy < m.y + 24; yy += 3) line(c, m.x + 4, yy, m.x + 35, yy, "rgba(192,229,157,.11)", .55);
  rect(c, m.x + 5 + ((t * 7) % 29), m.y + 5, .5, 17, "rgba(235,255,219,.28)");
  c.restore();
}

/** Alles, was beim Zeichnen des Hauses einmalig hinter Luni liegt. */
export function drawBioBadStatic(c: C) {
  c.save(); clipBad(c);
  drawCapsuleBack(c);
  drawPanel(c);
  drawHazmat(c, false);
  drawWC(c);
  drawSink(c);
  drawCRTFrame(c);
  drawCamera(c);
  drawSpind(c);
  c.restore();
}

export interface BioBadFx {
  door: number;
  inside: boolean;
  mist: number;
  flash: number;
  flush: number;
  panelPress: number;
  towel: boolean;
  time: number;
}

/** Hinter Luni: Monitorbild, WC-Glut, aufleuchtender Bedienknopf. */
export function drawBioBadBefore(c: C, fx: BioBadFx) {
  c.save(); clipBad(c);
  drawLabMonitor(c, fx.time, fx.inside);
  // Außerhalb der Kapsel läuft Luni vor dem Türblatt vorbei.
  if (!fx.inside) {
    drawDoors(c, fx.door);
    drawSichtfenster(c, fx.door);
  }
  if (fx.flush > 0.01) {
    const w = BIO_BAD.wc;
    c.globalAlpha = Math.min(.95, fx.flush);
    const g = c.createRadialGradient(w.x + 21, w.y + 26, 1, w.x + 21, w.y + 26, 12);
    g.addColorStop(0, "#e7782d"); g.addColorStop(.5, "#b64a1b"); g.addColorStop(1, "rgba(105,31,15,0)");
    c.fillStyle = g; c.fillRect(w.x + 9, w.y + 14, 24, 22);
    ellipse(c, w.x + 21, w.y + 27, 10, 2.3, "#cf571c");
    c.globalAlpha = 1;
  }
  if (fx.panelPress > 0) drawPanel(c, fx.panelPress);
  drawHazmat(c, fx.towel);
  c.restore();
}

function drawDoors(c: C, open: number) {
  const p = BIO_BAD.kapsel;
  const o = Math.max(0, Math.min(1, open));
  const dw = 22 * (1 - o) + 2;
  const g = c.createLinearGradient(p.x, 0, p.x + p.w, 0);
  g.addColorStop(0, "#96833f"); g.addColorStop(.32, "#cfb964");
  g.addColorStop(.67, "#d7c276"); g.addColorStop(1, "#8e7c3f");
  c.save(); c.beginPath(); c.roundRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2, 8); c.clip();
  c.fillStyle = g;
  c.beginPath(); c.roundRect(p.x + 1, p.y + 1, dw, p.h - 2, [8, 0, 0, 8]); c.fill();
  c.beginPath(); c.roundRect(p.x + p.w - 1 - dw, p.y + 1, dw, p.h - 2, [0, 8, 8, 0]); c.fill();
  for (const x of [p.x + 2, p.x + p.w - 2]) line(c, x, p.y + 11, x, p.y + p.h - 11, "rgba(19,30,28,.54)", 1.2);
  if (o < .85) {
    for (const x of [p.x + 8, p.x + p.w - 8]) {
      line(c, x, p.y + 15, x + .7, p.y + 28, "rgba(74,70,43,.31)", .7);
      line(c, x, p.y + 53, x - 1, p.y + 69, "rgba(74,70,43,.28)", .7);
    }
    c.save(); c.globalAlpha = (1 - o) * .9;
    biohazard(c, p.x + p.w / 2, p.y + 62, 11);
    c.restore();
  }
  c.restore();
  c.strokeStyle = "#615b36"; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(p.x - 1, p.y - 1, p.w + 2, p.h + 1, 10); c.stroke();
  line(c, p.x + p.w / 2, p.y + 12, p.x + p.w / 2, p.y + p.h - 5, "rgba(25,32,27,.32)", .7 * (1 - o));
}

function drawMist(c: C, fx: BioBadFx) {
  if (fx.mist <= .015) return;
  c.save();
  const p = BIO_BAD.kapsel;
  for (let i = 0; i < 17; i++) {
    const k = (fx.time * .21 + i * .229) % 1;
    const side = i % 2 ? -1 : 1;
    const x = p.x + p.w / 2 + side * (20 + k * (6 + i % 5)) + Math.sin(fx.time * .9 + i * 2) * 3;
    const y = p.y + p.h - 9 - k * (49 + i % 11);
    c.globalAlpha = fx.mist * (1 - k) * (fx.door > .5 ? .33 : .26);
    ellipse(c, x, y, 2 + k * 4.2, 1.7 + k * 3.4, i % 3 ? "#bdd2bf" : "#a7b59e");
  }
  c.restore();
}

function drawSichtfenster(c: C, open: number, drawEyes?: () => void) {
  if (open >= .45) return;
  const p = BIO_BAD.kapsel;
  const wy = p.augeY - 3;
  round(c, p.x + 6, wy - 1, p.w - 12, 8, 2, "#101d1d");
  if (drawEyes) {
    c.save(); c.beginPath(); c.rect(p.x + 8, wy, p.w - 16, 5); c.clip();
    drawEyes(); c.restore();
  }
  rect(c, p.x + 7, wy + 5, p.w - 14, .8, "#929675");
  line(c, p.x + 9, wy, p.x + 19, wy, "rgba(197,216,191,.32)", .65);
}

/** Vor Luni: zweiteilige Türen; bei geschlossener Kapsel nur ihre Augen im Sichtschlitz. */
export function drawBioBadAfter(c: C, fx: BioBadFx, drawEyes: () => void) {
  c.save(); clipBad(c);
  if (fx.inside) {
    drawDoors(c, fx.door);
    drawSichtfenster(c, fx.door, drawEyes);
  }
  if (fx.flash > 0) {
    // Ein einziger kurzer Blitz nach dem Schließen, auf die Kammer begrenzt.
    const p = BIO_BAD.kapsel;
    const a = Math.min(.74, fx.flash * .58);
    c.globalAlpha = a;
    round(c, p.x + 4, p.y + 5, p.w - 8, p.h - 11, 7, "#f8ffff");
    c.globalAlpha = a * .85;
    rect(c, p.x + 7, p.augeY - 3, p.w - 14, 6, "#ffffff");
    c.globalAlpha = 1;
  }
  drawMist(c, fx);
  c.restore();
}