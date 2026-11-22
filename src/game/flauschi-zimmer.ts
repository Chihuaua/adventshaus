/* =======================================================================
   TELEFLAUSCHI · FLAUSCHIS WEIHNACHTSZIMMER
   Das Bild auf der Fernseherfläche: Zimmer, Fenster mit Nachtschnee,
   Flauschi mittendrin – und rundherum ihre Gegenstände aus dem
   Adventskalender. Jeder lässt sich anklicken und hat seine eigene kleine
   Vorstellung:

     Grammophon · Schaukelpferd · Adventskranz · Glöckchen · Eisenbahn ·
     Schneekugel · Nussknacker · Mini-Fernseher · Zinkwanne ·
     Plätzchenblech · Weihnachtsbaum

   Gezeichnet wird in festen Zimmer-Einheiten (720×300), die auf die
   jeweilige Bildfläche skaliert werden: groß in der Vergrößerung, winzig
   auf dem Fernseher im Haus. Nur Canvas-Primitive, keine Dateien.
   ======================================================================= */

import {
  FLAUSCHI_DINGE, TAU, adventsKerzen, clamp, ell, flauschiDauer, flauschiDingDa, kreis, lerp, linie, rnd, weich,
  type C, type FlauschiDingId,
} from "./flauschi-dinge";
import { drawFlauschi } from "./flauschi-figur";
import type { FlauschiStand } from "./flauschi";

/** Flauschis Platz auf dem Teppich (Zimmer-Einheiten). */
const HEIM_X = 316.8;
const HEIM_Y = 234;
/** Gleisoval der Eisenbahn rund um Flauschi; `park` ist der Winkel der Abstellstelle. */
const BAHN = { x: HEIM_X, y: 242, rx: 130, ry: 16, park: 2.55 } as const;
const BAUM_X = 656;

function rr(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}

function dreieck(c: C, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.lineTo(x2, y2);
  c.closePath();
  c.fill();
}

function note(c: C, x: number, y: number, g: number, f: string) {
  ell(c, x, y, g * 0.55, g * 0.42, f);
  linie(c, x + g * 0.5, y, x + g * 0.5, y - g * 1.5, f, Math.max(0.6, g * 0.16));
  linie(c, x + g * 0.5, y - g * 1.5, x + g * 1.2, y - g * 1.15, f, Math.max(0.6, g * 0.16));
}

/* ------------------------------ Der Raum -------------------------------- */

function raum(c: C, t: number) {
  const wand = c.createLinearGradient(0, 0, 0, 198);
  wand.addColorStop(0, "#1d4530");
  wand.addColorStop(1, "#11281d");
  c.fillStyle = wand;
  c.fillRect(0, 0, 720, 198);
  c.fillStyle = "rgba(232,194,90,.45)";
  c.fillRect(0, 195, 720, 2);

  const boden = c.createLinearGradient(0, 198, 0, 300);
  boden.addColorStop(0, "#6f4726");
  boden.addColorStop(1, "#472d18");
  c.fillStyle = boden;
  c.fillRect(0, 198, 720, 102);
  c.strokeStyle = "rgba(0,0,0,.28)";
  c.lineWidth = 1.2;
  for (let i = 1; i < 45; i++) {
    c.beginPath();
    c.moveTo(i * 16, 198);
    c.lineTo(i * 16, 300);
    c.stroke();
  }

  // Fenster mit Nachtschnee
  c.fillStyle = "#0a1622";
  c.fillRect(43, 30, 187, 120);
  c.fillStyle = "#0e1f30";
  c.fillRect(45, 32, 183, 116);
  c.fillStyle = "rgba(255,255,255,.55)";
  for (let i = 0; i < 16; i++) {
    const p = (t * 0.06 + rnd(i) * 3) % 1;
    c.beginPath();
    c.arc(46 + rnd(i + 5) * 181, 33 + p * 114, 2.4, 0, TAU);
    c.fill();
  }
  c.fillStyle = "#6b4423";
  c.fillRect(40, 27, 193, 3);
  c.fillRect(40, 150, 193, 3);
  c.fillRect(40, 27, 3, 126);
  c.fillRect(230, 27, 3, 126);
  c.fillRect(135.5, 27, 2, 126);
  c.fillRect(40, 89, 193, 2);

  // Lichtergirlande oben
  c.strokeStyle = "rgba(60,90,70,.9)";
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(0, 18);
  for (let i = 0; i <= 24; i++) {
    const p = i / 24;
    c.lineTo(p * 720, 27 + Math.sin(p * Math.PI * 3) * 9);
  }
  c.stroke();
  for (let i = 0; i < 12; i++) {
    const p = (i + 0.5) / 12;
    const lx = p * 720;
    const ly = 32.4 + Math.sin(p * Math.PI * 3) * 9;
    const an = Math.sin(t * 2.4 + i) > -0.3;
    c.fillStyle = i % 3 === 0 ? "#ffd98a" : i % 3 === 1 ? "#e86a5e" : "#8fd6a8";
    c.globalAlpha = an ? 1 : 0.35;
    c.beginPath();
    c.arc(lx, ly, 3.6, 0, TAU);
    c.fill();
    if (an) {
      c.globalAlpha = 0.18;
      c.beginPath();
      c.arc(lx, ly, 10, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }
}

function teppich(c: C) {
  ell(c, HEIM_X, HEIM_Y, 216, 28.5, "#8d2b23");
  ell(c, HEIM_X, HEIM_Y - 2.4, 201.6, 25.5, "#b03a30");
  c.strokeStyle = "rgba(232,194,90,.75)";
  c.lineWidth = 1.8;
  c.beginPath();
  c.ellipse(HEIM_X, HEIM_Y - 2.4, 172.8, 21, 0, 0, TAU);
  c.stroke();
}

/* --------------------------- An Wand und Regal -------------------------- */

/** Adventskranz auf der Fensterbank: so viele Kerzen, wie der echte Advent erlaubt. */
function kranz(c: C, t: number, an: boolean) {
  const mx = 137;
  const my = 147;
  const gruen = (vorn: boolean) => {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      if (Math.sin(a) > 0 !== vorn) continue;
      kreis(c, mx + Math.cos(a) * 21, my + Math.sin(a) * 5.5, 4.4, i % 2 ? "#2f6b45" : "#3b8256");
    }
  };
  gruen(false);
  const brennen = an ? adventsKerzen(Date.now()) : 0;
  [-14, -5, 5, 14].forEach((dx, i) => {
    const hoch = 13 - (i % 2) * 2;
    rr(c, mx + dx - 1.8, my - 3 - hoch, 3.6, hoch, 1, "#c9453a");
    linie(c, mx + dx, my - 3 - hoch, mx + dx, my - 5 - hoch, "#3a2a1c", 0.7);
    if (i < brennen) {
      const fl = 1 + Math.sin(t * 11 + i * 2) * 0.12;
      kreis(c, mx + dx, my - 8 - hoch, 6.5, "rgba(255,217,138,.22)");
      ell(c, mx + dx, my - 7.5 - hoch, 1.7, 3.2 * fl, "#ffd98a");
      ell(c, mx + dx, my - 6.8 - hoch, 0.9, 1.7 * fl, "#fff6d6");
    }
  });
  gruen(true);
  kreis(c, mx - 12, my + 4, 1.5, "#c9453a");
  kreis(c, mx, my + 5.5, 1.5, "#c9453a");
  kreis(c, mx + 12, my + 4, 1.5, "#c9453a");
}

/** Goldenes Glöckchen an roter Schleife neben dem Fenster. */
function gloeckchen(c: C, t: number, p: number) {
  const schwung = p >= 0 ? Math.sin(t * 15) * 0.5 * (1 - p) : Math.sin(t * 1.3) * 0.03;
  kreis(c, 250, 43, 1.6, "#3a2a1c");
  c.save();
  c.translate(250, 44);
  c.rotate(schwung);
  ell(c, -5, 5, 5, 3, "#b03a30");
  ell(c, 5, 5, 5, 3, "#b03a30");
  kreis(c, 0, 5, 2.2, "#8d2b23");
  linie(c, -2, 7, -5, 14, "#b03a30", 2);
  linie(c, 2, 7, 5, 14, "#b03a30", 2);
  c.fillStyle = "#e8c25a";
  c.beginPath();
  c.moveTo(-10, 32);
  c.bezierCurveTo(-6, 28, -7, 13, 0, 11);
  c.bezierCurveTo(7, 13, 6, 28, 10, 32);
  c.closePath();
  c.fill();
  rr(c, -11, 31, 22, 3.2, 1.6, "#c49a35");
  ell(c, -3, 20, 1.6, 6, "rgba(255,255,255,.45)");
  kreis(c, p >= 0 ? Math.sin(t * 15 + 1) * 3 * (1 - p) : 0, 36, 2.4, "#c49a35");
  c.restore();
  if (p >= 0 && p < 0.8) {
    // Klangbögen links und rechts
    c.strokeStyle = `rgba(255,233,168,${0.8 * (1 - p)})`;
    c.lineWidth = 1.2;
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      c.arc(250, 70, 17 + i * 6 + p * 10, -0.5, 0.5);
      c.stroke();
      c.beginPath();
      c.arc(250, 70, 17 + i * 6 + p * 10, Math.PI - 0.5, Math.PI + 0.5);
      c.stroke();
    }
  }
}

function regal(c: C) {
  c.fillStyle = "rgba(0,0,0,.22)";
  c.fillRect(404, 106, 168, 3);
  for (const kx of [416, 556]) dreieck(c, kx, 105, kx + 5, 105, kx + 5, 120, "#573619");
  rr(c, 402, 100, 172, 6, 2, "#6b4423");
  c.fillStyle = "rgba(255,235,195,.2)";
  c.fillRect(403, 100.5, 170, 1.4);
}

/** Schneekugel mit Tännchen: Schütteln wirbelt den Schnee auf. */
function schneekugel(c: C, t: number, p: number) {
  const wild = p >= 0;
  c.save();
  c.translate(428, 100);
  c.rotate(wild && p < 0.25 ? Math.sin(t * 38) * 0.14 * (1 - p / 0.25) : 0);
  rr(c, -13, -9, 26, 9, 2.5, "#6b4423");
  rr(c, -13, -9, 26, 2.6, 1.3, "#a06a36");
  rr(c, -6, -5, 12, 2.4, 1.2, "#e8c25a");
  kreis(c, 0, -23, 15.5, "rgba(180,220,245,.26)");
  c.save();
  c.beginPath();
  c.arc(0, -23, 14.6, 0, TAU);
  c.clip();
  ell(c, 0, -9.5, 17, 6.5, "#eef6fb");
  dreieck(c, -6, -12, 6, -12, 0, -24, "#2b6f4c");
  dreieck(c, -4.5, -19, 4.5, -19, 0, -29, "#2b6f4c");
  kreis(c, 0, -29.5, 1.3, "#e8c25a");
  c.fillStyle = "rgba(255,255,255,.9)";
  for (let i = 0; i < 12; i++) {
    // In Ruhe liegt der Schnee unten; geschüttelt wirbelt er herum.
    const fall = wild ? (t * (0.7 + rnd(i) * 0.6) + rnd(i + 4)) % 1 : 0.86 + rnd(i) * 0.1;
    c.beginPath();
    c.arc((rnd(i + 8) * 2 - 1) * 12 + (wild ? Math.sin(t * 3 + i) * 3 : 0), -37 + fall * 27, 1, 0, TAU);
    c.fill();
  }
  c.restore();
  c.strokeStyle = "rgba(255,255,255,.55)";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, -23, 15.5, 0, TAU);
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,.8)";
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, -23, 11.5, Math.PI * 1.1, Math.PI * 1.45);
  c.stroke();
  c.restore();
}

/** Nussknacker: klappt den Kiefer auf und knackt eine Nuss. */
function nussknacker(c: C, p: number) {
  const x = 471;
  const kiefer = p >= 0.3 && p < 0.6 ? Math.abs(Math.sin(((p - 0.3) / 0.3) * Math.PI * 2)) * 3.2 : 0;
  rr(c, x - 10, 96, 20, 4, 1, "#22242e");
  rr(c, x - 6.5, 84, 5, 12, 1, "#f3efe6");
  rr(c, x + 1.5, 84, 5, 12, 1, "#f3efe6");
  rr(c, x - 7, 92, 6, 4, 1, "#22242e");
  rr(c, x + 1, 92, 6, 4, 1, "#22242e");
  rr(c, x - 9, 66, 18, 19, 2, "#b03a30");
  rr(c, x - 9, 78, 18, 2.4, 0, "#22242e");
  kreis(c, x, 79.2, 1.5, "#e8c25a");
  kreis(c, x, 70, 1, "#e8c25a");
  kreis(c, x, 74, 1, "#e8c25a");
  rr(c, x - 12.5, 67, 4, 13, 1.5, "#b03a30");
  rr(c, x + 8.5, 67, 4, 13, 1.5, "#b03a30");
  kreis(c, x - 10.5, 81, 1.8, "#f1c9a5");
  kreis(c, x + 10.5, 81, 1.8, "#f1c9a5");
  rr(c, x - 9, 65, 5, 3, 1, "#e8c25a");
  rr(c, x + 4, 65, 5, 3, 1, "#e8c25a");
  rr(c, x - 7.5, 52, 15, 14, 2, "#f1c9a5");
  rr(c, x - 9.5, 55, 3, 11, 1.2, "#f3efe6");
  rr(c, x + 6.5, 55, 3, 11, 1.2, "#f3efe6");
  kreis(c, x - 3, 56.5, 1, "#22242e");
  kreis(c, x + 3, 56.5, 1, "#22242e");
  rr(c, x - 5, 59, 10, 2, 1, "#f3efe6");
  rr(c, x - 4.5, 61.5, 9, 3 + kiefer, 0.8, "#7a2a22");
  rr(c, x - 4.5, 61.5, 9, 1.4, 0, "#f7f4ec");
  rr(c, x - 5.5, 64 + kiefer, 11, 3, 1, "#f1c9a5");
  rr(c, x - 7.5, 41, 15, 11.5, 1.5, "#22242e");
  rr(c, x - 7.5, 49.5, 15, 2.4, 0, "#e8c25a");
  kreis(c, x, 45, 1.6, "#c9453a");
}

/** Mini-Fernseher: ein Fernseher im Fernseher – mit einer winzigen Flauschi im Programm. */
function fernseher(c: C, t: number, p: number) {
  linie(c, 530, 60, 519, 47, "#b9b3a6", 1.2);
  linie(c, 530, 60, 541, 47, "#b9b3a6", 1.2);
  kreis(c, 519, 47, 1.6, "#c9453a");
  kreis(c, 541, 47, 1.6, "#c9453a");
  rr(c, 503, 96, 6, 4, 1, "#3a2a1c");
  rr(c, 551, 96, 6, 4, 1, "#3a2a1c");
  rr(c, 499, 58, 62, 40, 6, "#6b4423");
  rr(c, 501.5, 60.5, 57, 35, 4.5, "#8a5a2e");
  rr(c, 504, 63, 40, 30, 5, "#0d1418");
  kreis(c, 552, 70, 3, "#e8c25a");
  kreis(c, 552, 80, 3, "#e8c25a");
  linie(c, 552, 70, 553.6, 68.2, "#6b4423", 1);
  for (let i = 0; i < 3; i++) linie(c, 548.5, 87 + i * 2.4, 555.5, 87 + i * 2.4, "#573619", 1);
  if (p < 0) {
    linie(c, 509, 80, 520, 67, "rgba(255,255,255,.14)", 2);
    return;
  }
  c.save();
  c.beginPath();
  c.roundRect(505, 64, 38, 28, 4);
  c.clip();
  c.fillStyle = "#1a3a57";
  c.fillRect(505, 64, 38, 28);
  ell(c, 524, 93, 24, 7, "#eef6fb");
  const hup = Math.abs(Math.sin(t * 5)) * 4;
  kreis(c, 524, 84 - hup, 5.2, "#cbb6f1");
  kreis(c, 522.2, 83.4 - hup, 0.8, "#2a2440");
  kreis(c, 525.8, 83.4 - hup, 0.8, "#2a2440");
  dreieck(c, 519.5, 80.6 - hup, 528.5, 80.6 - hup, 526.5, 73 - hup, "#c9453a");
  rr(c, 519, 79.6 - hup, 10, 2, 1, "#f7f4ec");
  kreis(c, 529.5, 76 - hup, 1.5, "#f7f4ec");
  c.fillStyle = "rgba(255,255,255,.85)";
  for (let i = 0; i < 9; i++) {
    c.beginPath();
    c.arc(506 + rnd(i + 2) * 36, 64 + ((t * 9 + rnd(i) * 28) % 28), 0.8, 0, TAU);
    c.fill();
  }
  c.fillStyle = `rgba(255,255,255,${0.04 + Math.abs(Math.sin(t * 23)) * 0.04})`;
  c.fillRect(505, 64, 38, 28);
  c.restore();
  kreis(c, 524, 78, 30, "rgba(160,205,255,.07)");
}

/* ----------------------------- Auf dem Boden ---------------------------- */

/** Grammophon auf einem Tischchen: Platte dreht sich, der Trichter pulsiert. */
function grammophon(c: C, t: number, p: number) {
  const spielt = p >= 0;
  linie(c, 40, 193, 33, 210, "#573619", 3);
  linie(c, 74, 193, 81, 210, "#573619", 3);
  linie(c, 57, 195, 57, 211, "#573619", 3);
  ell(c, 57, 191, 31, 5.5, "#573619");
  ell(c, 57, 189.5, 31, 5, "#8a5a2e");
  rr(c, 37, 170, 40, 19, 2, "#6b4423");
  rr(c, 39, 172, 36, 15, 1.5, "#8a5a2e");
  rr(c, 43, 176, 28, 7, 1, "#6b4423");
  const kurbel = 174 + (spielt ? Math.sin(t * 8.4) * 2 : 0);
  linie(c, 77, 180, 85, 180, "#c49a35", 1.6);
  linie(c, 85, 180, 85, kurbel, "#c49a35", 1.6);
  kreis(c, 85, kurbel, 2, "#3a2a1c");
  ell(c, 57, 170, 18, 4.2, "#17171c");
  ell(c, 57, 170, 6, 1.5, "#c9453a");
  if (spielt) linie(c, 57, 170, 57 + Math.cos(t * 6) * 17, 170 + Math.sin(t * 6) * 3.9, "rgba(255,255,255,.35)", 0.8);
  linie(c, 72, 164, 62, 169, "#c49a35", 1.4);
  // Trichter: Hals vom Kasten hinauf, darüber die große Öffnung
  const puls = spielt ? 1 + Math.sin(t * 8.4) * 0.05 : 1;
  c.fillStyle = "#b08326";
  c.beginPath();
  c.moveTo(69, 167);
  c.lineTo(47, 151);
  c.lineTo(77, 149);
  c.lineTo(73, 167);
  c.closePath();
  c.fill();
  c.save();
  c.translate(62, 143);
  c.rotate(-0.3);
  c.scale(puls, puls);
  ell(c, 0, 0, 18, 13, "#e8c25a");
  ell(c, 0.6, 0.6, 14.5, 10, "#8a611c");
  ell(c, 1.2, 1.4, 8.5, 5.5, "#4f360e");
  c.strokeStyle = "rgba(255,246,214,.7)";
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(0, 0, 17.4, 12.4, 0, Math.PI * 1.05, Math.PI * 1.6);
  c.stroke();
  c.restore();
}

/** Schaukelpferd. Der Kopf liegt vorn – er bleibt sichtbar, wenn Flauschi aufsitzt. */
function pferd(c: C, winkel: number, vorn: boolean) {
  const holz = "#d9a066";
  c.save();
  c.translate(140, 240);
  c.rotate(winkel);
  c.translate(-140, -240);
  c.lineCap = "round";
  if (!vorn) {
    c.strokeStyle = "#8a5a2e";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(101, 230);
    c.quadraticCurveTo(140, 248, 179, 230);
    c.stroke();
    linie(c, 120, 221, 113, 236, holz, 4);
    linie(c, 128, 222, 127, 239, holz, 4);
    linie(c, 153, 222, 155, 239, holz, 4);
    linie(c, 161, 221, 168, 236, holz, 4);
    c.strokeStyle = "#6b4423";
    c.lineWidth = 4.5;
    c.beginPath();
    c.moveTo(165, 209);
    c.quadraticCurveTo(180, 212, 177, 227);
    c.stroke();
    ell(c, 140, 214, 27, 11, holz);
    ell(c, 133, 211, 14, 4.5, "rgba(255,255,255,.14)");
    rr(c, 128, 202, 26, 8, 3.5, "#b03a30");
    rr(c, 128, 207.5, 26, 2, 1, "#e8c25a");
  } else {
    c.fillStyle = holz;
    c.beginPath();
    c.moveTo(127, 216);
    c.lineTo(114, 189);
    c.lineTo(104, 196);
    c.lineTo(114, 221);
    c.closePath();
    c.fill();
    c.strokeStyle = "#6b4423";
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(114, 186);
    c.quadraticCurveTo(122, 196, 126, 212);
    c.stroke();
    c.save();
    c.translate(106, 190);
    c.rotate(-0.55);
    dreieck(c, 3.5, -5, 8.5, -4.5, 7, -11, holz);
    ell(c, 0, 0, 10.5, 6.5, holz);
    ell(c, -8, 1.5, 3.4, 3, "#c98d4f");
    kreis(c, -1, -1.6, 1.3, "#2a2440");
    linie(c, -6, -3.4, -5, 5, "#b03a30", 1.3);
    c.restore();
  }
  c.restore();
}

function gleis(c: C) {
  c.strokeStyle = "rgba(48,33,20,.8)";
  c.lineWidth = 1.2;
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * TAU;
    c.beginPath();
    c.moveTo(BAHN.x + Math.cos(a) * (BAHN.rx - 4), BAHN.y + Math.sin(a) * (BAHN.ry - 2.2));
    c.lineTo(BAHN.x + Math.cos(a) * (BAHN.rx + 4), BAHN.y + Math.sin(a) * (BAHN.ry + 2.2));
    c.stroke();
  }
  c.strokeStyle = "#c2bcae";
  c.lineWidth = 1;
  for (const d of [-2.4, 2.4]) {
    c.beginPath();
    c.ellipse(BAHN.x, BAHN.y, BAHN.rx + d, BAHN.ry + d * 0.55, 0, 0, TAU);
    c.stroke();
  }
}

/** Wartende Pakete der Szene: geöffnete Türchen ohne Türchen 6, noch nicht ausgepackt. */
function flauschiPaketeSzene(offen: number[], z: FlauschiStand): number {
  return offen.filter((tuer) => tuer !== 6 && !z.ausgepackt.includes(tuer)).length;
}

/** Wo die Lok gerade ist: ruht an der Abstellstelle oder dreht zwei Runden. */
function zugWinkel(p: number): number {
  return BAHN.park + (p >= 0 ? weich(p) * TAU * 2 : 0);
}

/** Lok (0) oder Waggon (1, 2), gezeichnet mit Blick nach rechts; die Räder stehen auf y = 0. */
function wagen(c: C, art: number, t: number, faehrt: boolean) {
  if (art === 0) {
    rr(c, -10, -12, 20, 8, 2, "#c9453a");
    rr(c, -10, -18.5, 8.5, 8.5, 1.5, "#8d2b23");
    rr(c, -8.4, -17, 5.2, 4.2, 1, "#ffe9a8");
    rr(c, 4, -17.5, 3.4, 6.5, 1, "#22242e");
    rr(c, 3, -19, 5.4, 2, 1, "#22242e");
    kreis(c, 10, -8, 1.6, "#ffd98a");
    dreieck(c, 10, -4.5, 13.5, -1.2, 10, -1.2, "#22242e");
    rr(c, -10, -5.2, 20, 2, 1, "#e8c25a");
    if (faehrt) {
      for (let i = 0; i < 3; i++) {
        const ph = (t * 1.6 + i / 3) % 1;
        kreis(c, 5.7 - ph * 9, -21 - ph * 12, 1.6 + ph * 3, `rgba(255,255,255,${0.55 * (1 - ph)})`);
      }
    }
  } else {
    rr(c, -8, -10, 16, 6.5, 1.5, art === 1 ? "#2c7450" : "#e8c25a");
    rr(c, -8, -4.5, 16, 1.6, 0.8, "#3a2a1c");
    if (art === 1) {
      rr(c, -4, -14.4, 7.5, 4.8, 1, "#c9453a");
      linie(c, -0.3, -14.4, -0.3, -9.6, "#f7f4ec", 0.9);
    } else {
      kreis(c, -3, -11, 2, "#e8b76c");
      kreis(c, 1.6, -11.3, 2, "#d9a35a");
      kreis(c, -0.6, -13, 1.8, "#e8b76c");
    }
    linie(c, 8, -5.5, 11, -5.5, "#3a2a1c", 1);
  }
  for (const rx of [-5.5, 5.5]) {
    kreis(c, rx, -2.6, 2.6, "#22242e");
    kreis(c, rx, -2.6, 1, "#e8c25a");
  }
}

/** Der Zug: Wagen auf der hinteren Gleishälfte fahren hinter Flauschi, die vorderen vor ihr. */
function zug(c: C, t: number, p: number, vorn: boolean) {
  const th = zugWinkel(p);
  for (let j = 2; j >= 0; j--) {
    const a = th - j * 0.2;
    if (Math.sin(a) > 0 !== vorn) continue;
    const g = 0.88 + Math.sin(a) * 0.12;
    c.save();
    c.translate(BAHN.x + Math.cos(a) * BAHN.rx, BAHN.y + Math.sin(a) * BAHN.ry);
    c.scale(Math.sin(a) > 0 ? -g : g, g);
    wagen(c, j, t, p >= 0);
    c.restore();
  }
}

/** Zinkwanne: hinten Innenraum und Wasser, vorn die Wand mit Schaumkrone. */
function wanne(c: C, t: number, vorn: boolean, badet: boolean) {
  if (!vorn) {
    ell(c, 506, 222, 41, 7.5, "#4f5b62");
    ell(c, 506, 223.5, 37, 5.5, "#cfe6f2");
    return;
  }
  c.fillStyle = "#9aa7ad";
  c.beginPath();
  c.moveTo(465, 222);
  c.ellipse(506, 222, 41, 7.5, 0, Math.PI, 0, true);
  c.lineTo(541, 250);
  c.quadraticCurveTo(506, 257, 471, 250);
  c.closePath();
  c.fill();
  rr(c, 476, 233, 9, 17, 4, "rgba(255,255,255,.2)");
  c.strokeStyle = "#7d8a90";
  c.lineWidth = 1.2;
  for (const dy of [0, 8]) {
    c.beginPath();
    c.moveTo(467.5 + dy * 0.2, 236 + dy);
    c.quadraticCurveTo(506, 243.5 + dy, 544.5 - dy * 0.2, 236 + dy);
    c.stroke();
  }
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(464, 232, 4, Math.PI * 0.5, Math.PI * 1.5);
  c.stroke();
  c.beginPath();
  c.arc(548, 232, 4, Math.PI * 1.5, Math.PI * 0.5);
  c.stroke();
  c.strokeStyle = "#d5dee2";
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(506, 222, 41, 7.5, 0, Math.PI, 0, true);
  c.stroke();
  // Schaumkrone am Rand – beim Baden üppiger, dazu steigen Blasen auf.
  const viel = badet ? 15 : 7;
  for (let i = 0; i < viel; i++) {
    const q = (i + 0.5) / viel;
    const sx = 470 + q * 72;
    const sy = 222 + 7.5 * Math.sqrt(Math.max(0, 1 - ((sx - 506) / 41) ** 2));
    const wog = badet ? Math.sin(t * 3 + i) * 1.2 : 0;
    kreis(c, sx, sy - 1 + wog, 3.4 + rnd(i + 3) * (badet ? 3.6 : 2), i % 3 ? "#f6fbff" : "#dcecf8");
  }
  if (badet) {
    // Der Schaum quillt links und rechts über den Rand.
    for (const [sx, sy, sr] of [[460, 224, 7.5], [455, 230, 5], [552, 224, 7.5], [557, 230, 5], [463, 233, 4], [549, 234, 4]] as const) {
      kreis(c, sx, sy, sr, "#f6fbff");
    }
    c.strokeStyle = "rgba(255,255,255,.75)";
    c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.4 + rnd(i + 1)) % 1;
      c.globalAlpha = 1 - ph;
      c.beginPath();
      c.arc(474 + rnd(i + 6) * 64 + Math.sin(t * 2 + i) * 3, 216 - ph * 70, 2 + rnd(i) * 3, 0, TAU);
      c.stroke();
      c.globalAlpha = 1;
    }
  }
}

/** Plätzchenblech auf einem Hocker: zeigt den Vorrat, beim Backen steigt Duft auf. */
function blech(c: C, t: number, vorrat: number, p: number) {
  linie(c, 563, 227, 560, 254, "#573619", 3);
  linie(c, 595, 227, 598, 254, "#573619", 3);
  linie(c, 562, 242, 596, 242, "#573619", 2);
  rr(c, 557, 222, 44, 5.5, 2, "#8a5a2e");
  rr(c, 555, 216.5, 48, 6, 2, "#33383f");
  rr(c, 557, 216.5, 44, 1.6, 0.8, "#6a727b");
  // Die frisch gebackenen Plätzchen erscheinen nach und nach.
  const fertig = p >= 0 ? Math.max(0, vorrat - 3) + Math.floor(clamp(p / 0.6, 0, 1) * 3 + 0.001) : vorrat;
  for (let i = 0; i < Math.min(vorrat, fertig); i++) {
    const kx = 561.5 + i * 7;
    kreis(c, kx, 215.4, 3, "#d9a35a");
    kreis(c, kx, 215, 2.5, "#e8b76c");
    kreis(c, kx - 0.8, 214.6, 0.5, "#7a4a22");
    kreis(c, kx + 0.9, 215.5, 0.5, "#7a4a22");
  }
  if (p < 0) return;
  c.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.5 + i / 3) % 1;
    const dx = 566 + i * 12;
    const dy = 210 - ph * 30;
    c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`;
    c.beginPath();
    c.moveTo(dx, dy);
    c.bezierCurveTo(dx + 4, dy - 6, dx - 4, dy - 12, dx, dy - 18);
    c.stroke();
  }
}

/** Platz der j-ten Kugel am Baum (fest, damit jede Kugel bleibt, wo Flauschi sie hinhängt). */
function kugelOrt(j: number): [number, number] {
  const y = 228 - (j % 8) * 15.5 - rnd(j + 3) * 6;
  const halb = 40 * ((y - 100) / 140) * 0.82;
  return [BAUM_X + (rnd(j + 50) * 2 - 1) * halb, y];
}

const KUGEL_FARBEN = ["#c9453a", "#e8c25a", "#9fd3ee", "#f7f4ec"];

/** Der große Baum: unten breit, oben schmal. Seine Kugeln hängt Flauschi selbst auf. */
function baum(c: C, t: number, kugeln: number, p: number, geschenke: number) {
  rr(c, BAUM_X - 4, 236, 8, 12, 1, "#5a3a1e");
  rr(c, BAUM_X - 11, 244, 22, 9, 2, "#8d2b23");
  rr(c, BAUM_X - 12, 243, 24, 3, 1.5, "#b8372e");
  const stufen = ["#1f4a33", "#256044", "#2e7a52"];
  for (let i = 0; i < 3; i++) {
    const oy = 240 - i * 42;
    const hw = 44 - i * 10;
    c.fillStyle = stufen[i];
    c.beginPath();
    c.moveTo(BAUM_X - hw, oy);
    c.lineTo(BAUM_X + hw, oy);
    c.lineTo(BAUM_X, oy - 58);
    c.closePath();
    c.fill();
  }
  c.strokeStyle = "rgba(232,194,90,.6)";
  c.lineWidth = 1.1;
  for (let i = 0; i < 3; i++) {
    const gy = 226 - i * 40;
    const gw = 34 - i * 9;
    c.beginPath();
    c.moveTo(BAUM_X - gw, gy);
    c.quadraticCurveTo(BAUM_X, gy + 9, BAUM_X + gw, gy - 3);
    c.stroke();
  }
  // Die jüngste Kugel fliegt gerade noch zum Baum.
  const haengt = p >= 0 && p < 0.7 ? kugeln - 1 : kugeln;
  for (let j = 0; j < haengt; j++) {
    const [kx, ky] = kugelOrt(j);
    kreis(c, kx, ky, 3.1, KUGEL_FARBEN[j % 4]);
    kreis(c, kx - 0.9, ky - 1, 0.9, "rgba(255,255,255,.7)");
  }
  // Stern auf der Spitze
  kreis(c, BAUM_X, 96, 9 + Math.sin(t * 3) * 1.5, "rgba(255,217,138,.2)");
  c.fillStyle = "#e8c25a";
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const sr = i % 2 === 0 ? 7.5 : 3.2;
    if (i === 0) c.moveTo(BAUM_X + Math.cos(a) * sr, 96 + Math.sin(a) * sr);
    else c.lineTo(BAUM_X + Math.cos(a) * sr, 96 + Math.sin(a) * sr);
  }
  c.closePath();
  c.fill();
  // Geschenke aus den offenen Türchen liegen am Fuß des Baums.
  for (let i = 0; i < Math.min(5, geschenke); i++) {
    const bw = 14 + rnd(i) * 5;
    const bh = 10 + rnd(i + 4) * 5;
    const bx = 606 + (i % 3) * 17 + (i > 2 ? 8 : 0);
    const by = 257 - Math.floor(i / 3) * 12 - bh;
    c.fillStyle = i % 3 === 0 ? "#b8372e" : i % 3 === 1 ? "#2f6b4a" : "#e8c25a";
    c.fillRect(bx, by, bw, bh);
    c.fillStyle = "rgba(255,255,255,.55)";
    c.fillRect(bx + bw * 0.42, by, bw * 0.16, bh);
    c.fillRect(bx, by + bh * 0.4, bw, bh * 0.18);
  }
}

/* --------------------------- Vor Flauschi: Effekte ------------------------ */

function noten(c: C, t: number) {
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.45 + i / 4) % 1;
    note(c, 84 + ph * 112 + Math.sin(ph * 9 + i) * 8, 138 - ph * 62, 5 + ph * 2, `rgba(255,233,168,${0.95 * (1 - ph)})`);
  }
}

function nussFlug(c: C, p: number, zx: number, zy: number) {
  const ph = (p - 0.42) / 0.24;
  if (ph <= 0 || ph >= 1) return;
  ell(c, lerp(471, zx, ph), lerp(66, zy, ph) - Math.sin(ph * Math.PI) * 34, 3.2, 2.6, "#8a5a2e");
}

function kugelFlug(c: C, t: number, p: number, j: number) {
  const [kx, ky] = kugelOrt(j);
  if (p < 0.7) {
    const ph = p / 0.7;
    const fx = lerp(HEIM_X + 34, kx, ph);
    const fy = lerp(206, ky, ph) - Math.sin(ph * Math.PI) * 46;
    kreis(c, fx, fy, 3.1, KUGEL_FARBEN[j % 4]);
    kreis(c, fx - 0.9, fy - 1, 0.9, "rgba(255,255,255,.7)");
    return;
  }
  // Angekommen: ein kurzes Funkeln
  const ph = (p - 0.7) / 0.3;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI + t * 3;
    const l = 4 + ph * 7;
    linie(c, kx - Math.cos(a) * l, ky - Math.sin(a) * l, kx + Math.cos(a) * l, ky + Math.sin(a) * l, `rgba(255,233,168,${1 - ph})`, 1);
  }
}

/** Die Schneekugel wurde geschüttelt: Es schneit kurz im ganzen Zimmer. */
function zimmerSchnee(c: C, t: number, p: number) {
  const stark = Math.sin(p * Math.PI);
  for (let i = 0; i < 46; i++) {
    const fall = (t * 26 * (0.6 + rnd(i + 9) * 0.8) + rnd(i + 20) * 300) % 300;
    kreis(c, rnd(i) * 720 + Math.sin(t + i) * 8, fall, 1.4 + rnd(i + 30) * 1.6, `rgba(255,255,255,${0.9 * stark})`);
  }
}

/* --------------------- Nest, Pakete, Grundausstattung ------------------- */

/** Flauschis Nest auf dem Teppich – von Anfang an da, noch vor jedem Türchen. */
function nest(c: C) {
  ell(c, HEIM_X, HEIM_Y + 3, 55, 13.5, "#6e4520");
  ell(c, HEIM_X, HEIM_Y + 1, 51, 11.5, "#8a5a2e");
  ell(c, HEIM_X, HEIM_Y - 1.5, 43, 9, "#5d3a1a");
  c.lineCap = "round";
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (0.08 + (i / 15) * 0.84);
    const x0 = HEIM_X + Math.cos(a) * 47;
    const y0 = HEIM_Y + 1 + Math.sin(a) * 10.5;
    linie(c, x0, y0, x0 + (rnd(i + 3) - 0.5) * 9, y0 - 2.5 - rnd(i + 8) * 2, i % 3 ? "#a06a36" : "#c99a58", 1.6);
  }
  ell(c, HEIM_X, HEIM_Y - 2, 31, 5.5, "rgba(0,0,0,.16)");
}

/**
 * Wartende Geschenke am Lieferplatz links im Zimmer. Anklicken packt das
 * älteste aus; beim Auspacken (p = Fortschritt) springt der Deckel auf.
 */
function pakete(c: C, t: number, anzahl: number, p: number) {
  if (anzahl <= 0 && p < 0) return;
  const farben = ["#b8372e", "#2f6b4a", "#3a5a8c"];
  const n = Math.max(1, Math.min(3, anzahl));
  for (let i = 0; i < n; i++) {
    if (p >= 0 && i === n - 1) continue; // das oberste Paket wird gerade geöffnet
    const bx = 24 + i * 8;
    const by = 256 - i * 13;
    c.fillStyle = farben[i % 3];
    c.fillRect(bx, by - 17, 34, 17);
    c.fillStyle = "rgba(255,255,255,.55)";
    c.fillRect(bx + 14, by - 17, 5, 17);
    c.fillRect(bx, by - 10, 34, 4);
    kreis(c, bx + 17, by - 19, 3, "#e8c25a");
  }
  if (anzahl > 3) {
    c.font = '700 9px "Silkscreen", monospace';
    c.fillStyle = "#eef7f2";
    c.fillText(`+${anzahl - 3}`, 82, 252);
  }
  if (p < 0) return;
  // Deckel fliegt, Papierfetzen und Sterne stieben heraus.
  c.save();
  c.translate(43 + p * 26, 226 - Math.sin(Math.min(1, p * 1.4) * Math.PI) * 26);
  c.rotate(-0.4 - p * 1.6);
  c.fillStyle = "#b8372e";
  c.fillRect(-18, -3, 36, 6);
  c.fillStyle = "#e8c25a";
  c.fillRect(-2.5, -3, 5, 6);
  c.restore();
  for (let i = 0; i < 12; i++) {
    const fall = p * (26 + rnd(i + 3) * 30);
    const fx = 43 + (rnd(i + 7) - 0.5) * 70 + Math.sin(t * 5 + i) * 3;
    const fy = 232 + fall - Math.sin(Math.min(1, p * 1.3) * Math.PI) * 18;
    c.save();
    c.translate(fx, fy);
    c.rotate(t * 4 + i);
    c.globalAlpha = 1 - p * 0.7;
    c.fillStyle = ["#e8c25a", "#c9453a", "#9fd3ee", "#f7f4ec"][i % 4];
    c.fillRect(-2.4, -1.4, 4.8, 2.8);
    c.restore();
    c.globalAlpha = 1;
  }
}

/** Grundausstattung: Futternapf, Spielball und die gefaltete Minidecke am Boden. */
function grundBoden(c: C, t: number, z: FlauschiStand) {
  if (z.ausgepackt.includes(1)) {
    // Futternapf mit Keksen
    ell(c, 438, 255, 17, 4.5, "rgba(0,0,0,.25)");
    c.fillStyle = "#c9453a";
    c.beginPath();
    c.moveTo(422, 244);
    c.lineTo(454, 244);
    c.quadraticCurveTo(451, 255, 438, 255);
    c.quadraticCurveTo(425, 255, 422, 244);
    c.fill();
    rr(c, 421, 242, 34, 3.4, 1.7, "#e86a5e");
    kreis(c, 432, 241.5, 3.4, "#d9a35a");
    kreis(c, 440, 240.8, 3.8, "#e8b76c");
    kreis(c, 446, 241.8, 3, "#d9a35a");
    if (z.aktion === "napf") {
      c.strokeStyle = "rgba(255,255,255,.5)";
      c.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const ph = (t * 0.8 + i * 0.5) % 1;
        c.beginPath();
        c.moveTo(432 + i * 9, 236 - ph * 12);
        c.quadraticCurveTo(435 + i * 9, 230 - ph * 12, 432 + i * 9, 224 - ph * 12);
        c.stroke();
      }
    }
  }
  if (z.ausgepackt.includes(3)) {
    // Spielball: rot-weiß gestreift, beim Spielen rollt er mit.
    const roll = z.aktion === "ball" ? t * 40 % 12.6 : 3;
    kreis(c, 406, 248, 11, "#f7f4ec");
    c.save();
    c.beginPath();
    c.arc(406, 248, 11, 0, TAU);
    c.clip();
    c.fillStyle = "#c9453a";
    for (let i = -1; i < 3; i++) c.fillRect(406 - 12 + ((i * 8 + roll) % 25), 237, 4, 22);
    kreis(c, 402, 244, 3, "rgba(255,255,255,.5)");
    c.restore();
    c.strokeStyle = "rgba(0,0,0,.25)";
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(406, 248, 11, 0, TAU);
    c.stroke();
  }
  if (z.ausgepackt.includes(4)) {
    // Gefaltete Minidecke: grün kariert mit cremefarbenem Saum.
    rr(c, 152, 246, 38, 9, 2.5, "#2f6b4a");
    rr(c, 155, 240, 32, 8, 2.5, "#35795a");
    c.strokeStyle = "rgba(243,231,205,.5)";
    c.lineWidth = 1;
    for (const dx of [160, 168, 176, 184]) linie(c, dx, 240.5, dx, 254.5, "rgba(243,231,205,.35)", 1);
    linie(c, 152, 250, 190, 250, "rgba(201,69,58,.75)", 1.2);
    rr(c, 152, 253, 38, 2.4, 1.2, "#f3e7cd");
  }
}

/** Grundausstattung an der Wand: Bürste am Haken und die Laterne am Fenster. */
function grundWand(c: C, t: number, z: FlauschiStand) {
  if (z.ausgepackt.includes(2)) {
    kreis(c, 365, 122, 1.8, "#c9c2b2");
    c.save();
    c.translate(365, 124);
    c.rotate(z.aktion === "buerste" ? Math.sin(t * 9) * 0.16 : Math.sin(t * 1.4) * 0.03);
    rr(c, -3.4, 0, 6.8, 15, 3, "#8a5a34");
    rr(c, -5, 13, 10, 8, 2, "#4a3220");
    for (let i = 0; i < 5; i++) linie(c, -3.6 + i * 1.8, 20.5, -3.6 + i * 1.8, 25, "#e5dcc8", 0.8);
    c.restore();
  }
  if (z.ausgepackt.includes(5)) {
    // Laterne an einem Haken an der Wand: Ringlein, Deckel, Glas, Boden.
    linie(c, 312, 66, 312, 73, "#3a2a1c", 1.4);
    kreis(c, 312, 75, 2, "#22242e");
    rr(c, 305, 77, 14, 3, 1.4, "#22242e");
    rr(c, 303.5, 80, 17, 3, 1.4, "#22242e");
    rr(c, 305, 83, 13, 11, 1.6, z.laterne ? "#ffd98a" : "#5a6a72");
    linie(c, 308.5, 83, 308.5, 94, "rgba(34,36,46,.55)", 1);
    linie(c, 314.5, 83, 314.5, 94, "rgba(34,36,46,.55)", 1);
    if (z.laterne) {
      kreis(c, 311.5, 89, 24 + Math.sin(t * 7) * 2, "rgba(255,217,138,.10)");
      kreis(c, 311.5, 89, 12, "rgba(255,217,138,.16)");
      ell(c, 311.5, 90, 2.2, 3.8 + Math.sin(t * 11) * 0.5, "#fff3cf");
    }
    rr(c, 303.5, 94, 17, 2.6, 1.2, "#22242e");
  }
}

/* -------------------------------- Szene --------------------------------- */

/** Wohin Flauschi schaut, wenn ein Gegenstand läuft (Zimmer-Einheiten). */
const BLICKZIEL: Partial<Record<FlauschiDingId, readonly [number, number]>> = {
  fernseher: [524, 78],
  schneekugel: [428, 78],
  nussknacker: [471, 70],
  kranz: [137, 140],
  baum: [BAUM_X, 170],
  blech: [579, 216],
  gloeckchen: [250, 62],
};

/**
 * Das ganze Bild auf der Fernseherfläche. Für die kleine Bühne im Haus genauso
 * wie für die Vergrößerung – der Maßstab folgt der Fläche.
 */
export function drawFlauschiSzene(c: C, x: number, y: number, w: number, h: number, t: number, z: FlauschiStand, offen: number[]) {
  const u = w / 720;
  const v = h / 300;
  const da = (id: FlauschiDingId) => {
    const ding = FLAUSCHI_DINGE.find((d) => d.id === id);
    return !!ding && flauschiDingDa(ding, offen) && z.ausgepackt.includes(ding.tuer);
  };
  const akt = z.aktion;
  const wach = !z.schlaf;
  const dauer = akt ? flauschiDauer(akt) : 0;
  const p = dauer > 0 ? clamp(1 - z.aktionT / dauer, 0, 1) : 0;
  /** Fortschritt eines Gegenstands (0…1), -1 wenn er gerade ruht. */
  const lauf = (id: FlauschiDingId) => (akt === id ? p : -1);

  // Flauschi sitzt auf dem Teppich – oder hüpft kurz aufs Pferd bzw. in die Wanne.
  let fx = HEIM_X;
  let fy = HEIM_Y;
  let hin = 0;
  if (wach && (akt === "pferd" || akt === "wanne")) {
    hin = weich(clamp(p / 0.14, 0, 1)) * (1 - weich(clamp((p - 0.86) / 0.14, 0, 1)));
    fx = lerp(HEIM_X, akt === "pferd" ? 140 : 506, hin);
    fy = lerp(HEIM_Y, akt === "pferd" ? 205 : 240, hin) - Math.sin(hin * Math.PI) * 30;
  }
  const wippe = akt === "pferd" && hin > 0.97 ? Math.sin(t * 4.6) * 0.12 : 0;
  const badet = akt === "wanne" && hin > 0.5;

  // Blickrichtung zum laufenden Gegenstand
  let blick: [number, number] = [0, 0];
  let ziel = akt ? BLICKZIEL[akt as FlauschiDingId] : undefined;
  if (akt === "bahn") {
    const a = zugWinkel(p);
    ziel = [BAHN.x + Math.cos(a) * BAHN.rx, BAHN.y + Math.sin(a) * BAHN.ry - 8];
  }
  if (ziel && wach) {
    const bx = ziel[0] - fx;
    const by = ziel[1] - (fy - 44);
    const l = Math.hypot(bx, by) || 1;
    blick = [bx / l, by / l];
  }

  /* ---- Hinter Flauschi ---- */
  c.save();
  c.translate(x, y);
  c.scale(u, v);
  raum(c, t);
  if (da("kranz")) kranz(c, t, z.kerzen);
  if (da("gloeckchen")) gloeckchen(c, t, lauf("gloeckchen"));
  if (da("schneekugel") || da("nussknacker") || da("fernseher")) regal(c);
  if (da("schneekugel")) schneekugel(c, t, lauf("schneekugel"));
  if (da("nussknacker")) nussknacker(c, lauf("nussknacker"));
  if (da("fernseher")) fernseher(c, t, lauf("fernseher"));
  grundWand(c, t, z);
  teppich(c);
  nest(c);
  pakete(c, t, flauschiPaketeSzene(offen, z), akt === "auspacken" ? p : -1);
  if (da("bahn")) {
    gleis(c);
    zug(c, t, lauf("bahn"), false);
  }
  grundBoden(c, t, z);
  if (da("grammophon")) grammophon(c, t, lauf("grammophon"));
  if (da("pferd")) pferd(c, wippe, false);
  if (da("wanne")) wanne(c, t, false, badet);
  if (da("blech")) blech(c, t, z.vorrat, lauf("blech"));
  if (da("baum")) baum(c, t, z.kugeln, lauf("baum"), offen.length);
  c.restore();

  /* ---- Flauschi ---- */
  c.save();
  if (wippe) {
    // Sie schaukelt mit dem Pferd um dessen Kufen.
    c.translate(x + 140 * u, y + 240 * v);
    c.rotate(wippe);
    c.translate(-(x + 140 * u), -(y + 240 * v));
  }
  if (badet) {
    // In der Wanne: Unterhalb des Wannenrands ist Flauschi im Wasser verschwunden.
    c.beginPath();
    c.rect(x, y, w, 227 * v);
    c.clip();
  }
  drawFlauschi(c, x + fx * u, y + fy * v, h / 170, t, z, blick);
  c.restore();

  /* ---- Vor Flauschi ---- */
  c.save();
  c.translate(x, y);
  c.scale(u, v);
  if (da("pferd")) pferd(c, wippe, true);
  if (da("wanne")) wanne(c, t, true, badet);
  if (da("bahn")) zug(c, t, lauf("bahn"), true);
  if (akt === "grammophon") noten(c, t);
  if (akt === "nussknacker" && wach) nussFlug(c, p, fx, fy - 34);
  if (akt === "baum" && z.kugeln > 0) kugelFlug(c, t, p, z.kugeln - 1);
  if (akt === "schneekugel") zimmerSchnee(c, t, p);
  c.restore();
}
