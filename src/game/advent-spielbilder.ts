/* =======================================================================
   ADVENTSKALENDER IM WEIHNACHTSHAUS – DIE 24 TÜRCHEN-BILDER
   Jedes geöffnete Türchen zeigt das Geschenk, das dahinter liegt – gezeichnet
   in der Bildsprache von Videospielen: ein dunkler Gegenstandsplatz mit
   goldenen Pixelecken, das Geschenk als klare Figur in der Mitte und dazu
   ein kleiner Verweis aufs Spielen (Sammelstern, Lebensanzeige, Inventar,
   Speicherpunkt, Münzen ...).

   Es werden keine geschützten Figuren, Gegenstände oder Logos nachgezeichnet,
   nur die allgemeine Bildsprache (Pixel, Rahmen, Herzen, Münzen, Fahnen).
   Die Türchen 1-5 verraten durch ihr Motiv noch nichts vom Teleflauschi-Spiel;
   erst ab Türchen 6 ist der Bezug sichtbar.

   Alles handgezeichnet mit Canvas-Grundformen, keine Bild- oder Fontdateien.
   ======================================================================= */

import {
  GOLD, GOLD_HELL, GOLD_TIEF, NACHT, ROT, ROT_TIEF, TAU, bmp, ecken, ell, flocke, funke, kreis, muenz, note, pfeil,
  poly, px, rand, rund, stern, strich, zahnrad, type C,
} from "./advent-weltraum";

/** Pixelherz (Pflege, Leben) – '+' ist der Glanzpunkt. */
const HERZ: readonly string[] = [".##.##.", "#####+#", "#######", ".#####.", "..###..", "...#..."];
const HERZ_FARBEN = { "#": "#f08a9c", "+": "#ffd0d8" } as const;
/** Pixel-Fragezeichen für den Fund in der Kiste. */
const FRAGE: readonly string[] = [".####.", "##..##", "....##", "...##.", "..##..", "......", "..##..", "..##.."];
const FRAGE_FARBEN = { "#": GOLD, "+": GOLD_HELL } as const;

/** Der Gegenstandsplatz hinter der Klappe: Nachtblau, feines Pixelraster, warmer Schein in der Mitte. */
function fach(c: C, w: number, h: number): void {
  c.fillStyle = "#111c3a";
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = "#1a2750";
  c.fillRect(-w / 2, -h / 2, w, h * 0.24);
  c.fillStyle = "#0a1024";
  c.fillRect(-w / 2, h / 2 - h * 0.26, w, h * 0.26);
  c.strokeStyle = "rgba(255,255,255,.06)";
  c.lineWidth = 0.6;
  c.beginPath();
  for (let gx = -w / 2 + 8; gx < w / 2; gx += 8) {
    c.moveTo(gx, -h / 2);
    c.lineTo(gx, h / 2);
  }
  for (let gy = -h / 2 + 8; gy < h / 2; gy += 8) {
    c.moveTo(-w / 2, gy);
    c.lineTo(w / 2, gy);
  }
  c.stroke();
  for (const [r, a] of [[30, 0.05], [22, 0.07], [14, 0.1]] as const) {
    ell(c, 0, -1, r * 1.15, r * 0.8, `rgba(255,205,130,${a})`);
  }
}

/**
 * Das Bild im geöffneten Türchen `tag` (1–24) für den Weltall-Stil des
 * Weihnachtshauses. (x, y, w, h) ist die Fläche hinter der Klappe.
 */
export function adventBildSpiel(c: C, tag: number, x: number, y: number, w: number, h: number, t: number): void {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.translate(x + w / 2, y + h / 2);
  fach(c, w, h);
  ecken(c, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, "rgba(232,194,90,.85)");
  const k = Math.min(w / 86, h / 78);
  c.scale(k, k);

  switch (((tag - 1) % 24) + 1) {
    case 1: { // Futternapf: steht bereit, darüber ein Pixelherz (Pflege)
      ell(c, 0, 15.5, 20, 4, "rgba(0,0,0,.35)");
      poly(c, [[-19, -2], [19, -2], [13, 15.5], [-13, 15.5]], "#b8372e");
      ell(c, 0, -2, 19, 6, "#d9483d");
      ell(c, 0, -1, 15, 4, "#7a4522");
      for (let i = 0; i < 7; i++) kreis(c, -10 + rand(i + 3) * 20, -2 + rand(i + 9) * 3, 2, i % 2 ? "#a8692f" : "#8a5226");
      c.fillStyle = "#f3e7cd";
      c.fillRect(-10, 4.5, 20, 3);
      strich(c, -15.5, 10, -10, 11.5, "rgba(255,255,255,.35)", 1.2);
      bmp(c, -5.2, -27 + Math.sin(t * 2.4) * 1.2, 1.5, HERZ, HERZ_FARBEN);
      break;
    }
    case 2: { // Bürste: Werkzeug-Gegenstand mit feinen Borsten
      c.save();
      c.rotate(0.6);
      rund(c, -3.6, -23, 7.2, 22, 3, "#8a5a2e");
      strich(c, -1, -21, -1, -3, "rgba(255,235,195,.35)", 0.8);
      rund(c, -8.5, -2, 17, 7.4, 1.8, "#6b4423");
      c.strokeStyle = "#f1e9dc";
      c.lineWidth = 1;
      c.lineCap = "round";
      for (let i = 0; i < 9; i++) {
        c.beginPath();
        c.moveTo(-7.4 + i * 1.85, 5.4);
        c.lineTo(-7.9 + i * 1.85, 14.5);
        c.stroke();
      }
      c.restore();
      zahnrad(c, 19, 14, 4.6, "#c9cfd8");
      funke(c, -19, -17, 2.6, "#fff3c8");
      break;
    }
    case 3: { // Spielball: Ball zwischen zwei Schlägern, oben eine Reihe Steine wie im Ballspiel
      for (let i = 0; i < 5; i++) rund(c, -26 + i * 10.6, -24, 9.2, 4.4, 1, i % 2 ? "#3a6fb0" : "#3f9d6a");
      rund(c, -30, -8, 3.4, 13, 1.4, "#eef7f2");
      rund(c, 26.6, 2, 3.4, 13, 1.4, "#eef7f2");
      const bx = Math.sin(t * 1.8) * 21;
      const by = Math.cos(t * 2.6) * 8 + 5;
      for (let i = 1; i <= 3; i++) kreis(c, bx - i * 5, by + i * 1.5, 2.4 - i * 0.5, `rgba(255,255,255,${(0.4 - i * 0.11).toFixed(3)})`);
      kreis(c, bx, by, 4.6, "#c9453a");
      kreis(c, bx + 0.8, by - 0.5, 3.4, "#e86a5e");
      kreis(c, bx - 1.2, by - 1.4, 1.1, "#ffffff");
      break;
    }
    case 4: { // Minidecke: gefaltete Decke am Rastpunkt, daneben die karierte Fahne
      rund(c, -28, -8, 37, 22, 3, "#2f6b4a");
      c.save();
      c.beginPath();
      c.roundRect(-28, -8, 37, 22, 3);
      c.clip();
      c.strokeStyle = "rgba(243,231,205,.55)";
      c.lineWidth = 1;
      for (let i = -5; i < 8; i++) {
        c.beginPath();
        c.moveTo(-28 + i * 6.4, -8);
        c.lineTo(-23.6 + i * 6.4, 14);
        c.stroke();
      }
      c.strokeStyle = "rgba(201,69,58,.85)";
      c.lineWidth = 1.2;
      for (let j = 0; j < 3; j++) {
        c.beginPath();
        c.moveTo(-28, -3 + j * 6.4);
        c.lineTo(9, -3 + j * 6.4);
        c.stroke();
      }
      c.restore();
      c.fillStyle = "#f3e7cd";
      c.fillRect(-28, -8, 37, 1.6);
      for (const fx2 of [-19, -9.5]) {
        strich(c, fx2, -8, fx2, -4, "#f3e7cd", 0.9);
        kreis(c, fx2, -3.4, 1, "#e8c25a");
      }
      strich(c, 21, 16, 21, -23, "#d8d2c4", 2);
      kreis(c, 21, -24, 1.8, GOLD);
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 4; j++) {
          c.fillStyle = (i + j) % 2 ? "#f7f4ec" : "#22242e";
          c.fillRect(22 + j * 3.2, -23 + i * 3.2, 3.2, 3.2);
        }
      }
      break;
    }
    case 5: { // Laterne: Licht-Gegenstand mit gestricheltem Lichtradius
      c.strokeStyle = "rgba(255,225,160,.55)";
      c.lineWidth = 0.8;
      c.setLineDash([2, 3.4]);
      c.beginPath();
      c.arc(0, -1, 26, 0, TAU);
      c.stroke();
      c.setLineDash([]);
      c.strokeStyle = "#2b3a33";
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, -16.5, 3.4, Math.PI, 0);
      c.stroke();
      poly(c, [[-7, -13.5], [7, -13.5], [5, -11], [-5, -11]], "#2b3a33");
      rund(c, -6.2, -11, 12.4, 21.5, 1.5, "#ffd98a");
      c.fillStyle = "#2b3a33";
      c.fillRect(-6.2, -11, 12.4, 1.4);
      c.fillRect(-0.7, -11, 1.4, 21.5);
      c.fillRect(-6.2, -1, 12.4, 1.2);
      c.fillRect(-6.2, 8.6, 12.4, 2);
      ell(c, 0, 3.6, 1.6, 3.2 * (1 + Math.sin(t * 8) * 0.1), "#fff3c8");
      funke(c, 20, -17, 2.6, "#fff3c8");
      break;
    }
    case 6: { // Das Spiel: kleine Konsole, auf dem Bildschirm das Ei, ein blinkender Start
      rund(c, -24, -17, 48, 34, 4.5, "#c9cfd8");
      c.strokeStyle = "#6f7f92";
      c.lineWidth = 1;
      c.strokeRect(-23.5, -16.5, 47, 33);
      rund(c, -15, -12.5, 30, 21, 2, "#12241c");
      c.fillStyle = "#cbb6f1";
      c.beginPath();
      c.ellipse(0, -2.2, 5.2, 6.8, 0, 0, TAU);
      c.fill();
      kreis(c, -1.7, -5, 1.4, "rgba(255,255,255,.7)");
      c.fillStyle = "#3a3f4a";
      c.fillRect(-19.5, 7.5, 9.4, 3);
      c.fillRect(-16.7, 4.6, 3, 8.8);
      kreis(c, 14.6, 9, 2.3, "#c9453a");
      kreis(c, 19.6, 6.8, 2.3, "#3f7f52");
      if (Math.sin(t * 3) > -0.2) poly(c, [[-3, 7], [2.4, 10], [-3, 13]], "#7fdc8f");
      break;
    }
    case 7: { // Plätzchenblech: Inventar-Leiste mit Plätzchen, eines ist ausgewählt
      rund(c, -29, -8.5, 58, 18.5, 3, "#1b2436");
      c.strokeStyle = GOLD_TIEF;
      c.lineWidth = 1;
      c.strokeRect(-28.5, -8, 57, 17.5);
      for (let i = 1; i < 4; i++) strich(c, -29 + i * 14.5, -8, -29 + i * 14.5, 9.5, GOLD_TIEF, 0.8);
      for (let i = 0; i < 4; i++) {
        const kx = -21.75 + i * 14.5;
        if (i === 3) {
          kreis(c, kx, 0.75, 5.3, "rgba(255,255,255,.06)");
          continue;
        }
        kreis(c, kx, 0.75, 5.5, i === 2 ? "#8a5a2e" : "#e8b76c");
        kreis(c, kx, 0.75, 4.6, i === 2 ? "#a06a36" : "#f0c98a");
        for (let q = 0; q < 4; q++) kreis(c, kx + Math.cos(q * 1.6 + i) * 2.5, 0.75 + Math.sin(q * 1.6 + i) * 2.5, 0.9, "#5a3a1e");
      }
      ecken(c, -14.5 - 6.6, -8, 13.2, 17.5, "#ffe2a0", 1.8, 5);
      break;
    }
    case 8: { // Schneekugel: Weltkugel zur Level-Auswahl, ein Stern umläuft sie
      rund(c, -12.5, 9, 25, 7.5, 2, "#6b4423");
      rund(c, -10.4, 7, 20.8, 3.2, 1.2, GOLD_TIEF);
      c.fillStyle = "rgba(170,205,238,.9)";
      c.beginPath();
      c.arc(0, -2, 14, 0, TAU);
      c.fill();
      c.save();
      c.beginPath();
      c.arc(0, -2, 13, 0, TAU);
      c.clip();
      ell(c, 0, 8, 15, 5.5, "#eef6fb");
      poly(c, [[-4.6, 3], [4.6, 3], [0, -7]], "#2b6f4c");
      poly(c, [[-3.4, -3], [3.4, -3], [0, -10.5]], "#2b6f4c");
      kreis(c, 0, -11, 1.1, "#e8c25a");
      for (let i = 0; i < 7; i++) kreis(c, -9 + rand(i + 3) * 18, -13 + ((t * 2 + rand(i) * 12) % 20), 0.8, "#ffffff");
      c.restore();
      ell(c, -5.5, -8, 3, 4.6, "rgba(255,255,255,.5)");
      c.strokeStyle = GOLD;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(0, -2, 21, 6.5, -0.3, 0, TAU);
      c.stroke();
      const oa = t * 0.9;
      const co = Math.cos(-0.3);
      const so = Math.sin(-0.3);
      const ox = 21 * Math.cos(oa);
      const oy = 6.5 * Math.sin(oa);
      stern(c, ox * co - oy * so, -2 + ox * so + oy * co, 2.9, GOLD_HELL, 5, 0.46);
      break;
    }
    case 9: { // Geschenkpapier: Paket wie eine Kiste zum Dahinterstecken, mit Fragezeichen
      rund(c, -13.5, -5, 27, 22.5, 2, "#c9453a");
      c.strokeStyle = "#8c2a22";
      c.lineWidth = 1.6;
      c.strokeRect(-12.7, -4.2, 25.4, 20.9);
      c.fillStyle = GOLD;
      c.fillRect(-2.4, -5, 4.8, 22.5);
      c.fillRect(-13.5, 5.6, 27, 4.4);
      for (let i = 0; i < 6; i++) px(c, -11.6 + (i % 3) * 9.8, 0.6 + Math.floor(i / 3) * 12.4, 1.6, "#f3e7cd");
      bmp(c, -4.5, -27 + Math.sin(t * 2.4) * 1.2, 1.5, FRAGE, FRAGE_FARBEN);
      break;
    }
    case 10: { // Paketschleife: fliegt davon wie ein Bumerang
      c.setLineDash([3, 3]);
      c.strokeStyle = "rgba(255,255,255,.45)";
      c.lineWidth = 1.1;
      c.beginPath();
      c.ellipse(0, 3, 31, 17, -0.25, Math.PI * 0.95, Math.PI * 1.95);
      c.stroke();
      c.setLineDash([]);
      c.save();
      c.translate(0, -1);
      c.rotate(-0.45 + Math.sin(t * 2) * 0.12);
      ell(c, -5.6, 0, 6.5, 3.7, ROT);
      ell(c, 5.6, 0, 6.5, 3.7, ROT);
      ell(c, -4.4, 0, 3.2, 1.6, ROT_TIEF);
      ell(c, 4.4, 0, 3.2, 1.6, ROT_TIEF);
      poly(c, [[-1.4, 1.6], [-4, 8.6], [-1, 7.6]], ROT);
      poly(c, [[1.4, 1.6], [4, 8.6], [1, 7.6]], ROT);
      kreis(c, 0, 0, 2.2, ROT_TIEF);
      kreis(c, 0, 0, 1.1, GOLD);
      c.restore();
      break;
    }
    case 11: { // Wollschal: hängt am Rüstungsständer wie ein Ausrüstungsstück
      strich(c, 0, -24, 0, 19, "#8a5a2e", 2.4);
      rund(c, -9, 18, 18, 3, 1.2, "#6b4423");
      rund(c, -16, -17.5, 32, 3, 1.4, "#8a5a2e");
      kreis(c, 0, -25, 1.8, GOLD_TIEF);
      for (const [x0, x1, unten] of [[-11.5, -4.6, 9], [4.6, 11.5, 2]] as const) {
        rund(c, x0, -16.5, x1 - x0, unten + 16.5, 1.6, ROT);
        c.strokeStyle = "rgba(140,42,34,.7)";
        c.lineWidth = 0.7;
        for (let yy = -13.5; yy < unten; yy += 2.6) {
          c.beginPath();
          c.moveTo(x0 + 0.6, yy);
          c.lineTo(x1 - 0.6, yy + 1);
          c.stroke();
        }
        c.strokeStyle = ROT;
        c.lineWidth = 1.2;
        for (let fransen = x0 + 1.4; fransen < x1; fransen += 2.6) {
          c.beginPath();
          c.moveTo(fransen, unten + 16.5);
          c.lineTo(fransen, unten + 20);
          c.stroke();
        }
      }
      poly(c, [[14, 8], [25, 8], [25, 14], [19.5, 20], [14, 14]], GOLD_TIEF);
      poly(c, [[15, 9], [24, 9], [24, 13.6], [19.5, 18.8], [15, 13.6]], "#3a6fb0");
      break;
    }
    case 12: { // Grammophon: daneben die Schallplatte, die man einsammelt
      rund(c, -24, 8, 31, 12.5, 2, "#6b4423");
      rund(c, -22, 10, 27, 8.5, 1.5, "#8a5a2e");
      ell(c, -8, 7, 10.5, 2.7, "#17171c");
      kreis(c, -8, 7, 2, "#c9453a");
      poly(c, [[-5, 6], [-11, -6], [1.5, -8.5], [-0.5, 6]], GOLD_TIEF);
      ell(c, -4.5, -13, 10.4, 7.2, GOLD);
      ell(c, -4.1, -12.6, 7.8, 5.1, "#8a611c");
      ell(c, -3.7, -12.2, 4.1, 2.6, "#4f360e");
      kreis(c, 16.5, -2, 10.8, "#17171c");
      c.strokeStyle = "rgba(255,255,255,.35)";
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(16.5, -2, 8.3, -2.4, -1.4);
      c.stroke();
      c.beginPath();
      c.arc(16.5, -2, 6.2, 0.6, 1.3);
      c.stroke();
      kreis(c, 16.5, -2, 3.7, GOLD);
      kreis(c, 16.5, -2, 1, NACHT);
      note(c, 21.5, -16, 0.9, GOLD_HELL);
      break;
    }
    case 13: { // Schaukelpferd: das Reittier, daneben auf und ab
      c.save();
      c.rotate(Math.sin(t * 3) * 0.1);
      c.strokeStyle = "#6b4423";
      c.lineWidth = 2.2;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-23, 15);
      c.quadraticCurveTo(0, 23.5, 23, 15);
      c.stroke();
      strich(c, -13, 6, -15, 16, "#8a5a2e", 1.8);
      strich(c, 12, 6, 14, 16, "#8a5a2e", 1.8);
      c.strokeStyle = "#6b4423";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-14, 0);
      c.quadraticCurveTo(-21.5, 2, -19.5, 9);
      c.stroke();
      ell(c, 0, 2, 15.5, 7.2, "#d9a066");
      c.save();
      c.translate(14.5, -6);
      c.rotate(-0.5);
      ell(c, 0, 0, 6.6, 3.9, "#d9a066");
      ell(c, 5.4, 0.6, 2.5, 1.9, "#c98d4f");
      kreis(c, 1.5, -1.2, 0.9, "#2a2440");
      poly(c, [[2.4, -3.4], [5, -6.4], [5.4, -2.6]], "#d9a066");
      c.restore();
      strich(c, 8, -8, 11.5, -11, "#b03a30", 1.6);
      rund(c, -8.5, -5.6, 13.5, 4.2, 1.8, "#b03a30");
      c.fillStyle = GOLD;
      c.fillRect(-8.5, -2.7, 13.5, 0.8);
      c.restore();
      pfeil(c, 25, -13, -1, GOLD);
      pfeil(c, 25, 11, 1, GOLD);
      break;
    }
    case 14: { // Nussknacker: eine Spielfigur mit Sprechblase
      rund(c, -4.6, 11, 3.5, 9.5, 0.6, "#22242e");
      rund(c, 1.1, 11, 3.5, 9.5, 0.6, "#22242e");
      rund(c, -6.6, -4, 13.2, 15.8, 2, ROT);
      c.fillStyle = "#22242e";
      c.fillRect(-6.6, 3.2, 13.2, 2);
      kreis(c, 0, 4.2, 1.1, GOLD);
      for (let i = 0; i < 3; i++) kreis(c, 0, -1.6 + i * 2.4, 0.8, GOLD);
      rund(c, -9, -3, 2.9, 10, 1, ROT);
      rund(c, 6.1, -3, 2.9, 10, 1, ROT);
      rund(c, -5.4, -14, 10.8, 10.2, 1.6, "#f1c9a5");
      rund(c, -6.8, -12.4, 2.7, 7.2, 1, "#f7f4ec");
      rund(c, 4.1, -12.4, 2.7, 7.2, 1, "#f7f4ec");
      kreis(c, -2.1, -10.2, 0.8, "#22242e");
      kreis(c, 2.1, -10.2, 0.8, "#22242e");
      poly(c, [[-2.7, -6.2], [2.7, -6.2], [0, -3.2]], "#f7f4ec");
      rund(c, -6.9, -23, 13.8, 8.8, 1.4, "#22242e");
      c.fillStyle = GOLD;
      c.fillRect(-6.9, -15.8, 13.8, 1.4);
      rund(c, 9.5, -25.5, 18.5, 11.5, 3, "#f7f4ec");
      poly(c, [[11.5, -14.6], [15.5, -14.6], [10.5, -10.6]], "#f7f4ec");
      for (let i = 0; i < 3; i++) {
        kreis(c, 14.6 + i * 4, -19.7, 1.2, Math.floor(t * 3) % 3 === i ? "#3a3f4a" : "rgba(58,63,74,.35)");
      }
      break;
    }
    case 15: { // Glöckchen: läutet wie Geldzeichen, dazu ein Münzstapel
      strich(c, 0, -26, 0, -15, ROT, 1.4);
      c.fillStyle = GOLD_TIEF;
      c.beginPath();
      c.moveTo(-10.5, 1);
      c.bezierCurveTo(-6.2, -3.2, -7.2, -15, 0, -15.8);
      c.bezierCurveTo(7.2, -15, 6.2, -3.2, 10.5, 1);
      c.closePath();
      c.fill();
      c.fillStyle = GOLD;
      c.beginPath();
      c.moveTo(-9, 0);
      c.bezierCurveTo(-5.4, -3.6, -6.2, -13.4, 0, -14.2);
      c.bezierCurveTo(1.6, -13.8, 2.6, -10.2, 2.5, -6.8);
      c.closePath();
      c.fill();
      rund(c, -11.5, 0.2, 23, 3, 1.2, GOLD_TIEF);
      kreis(c, 0, 4.6, 2.7, GOLD_TIEF);
      ell(c, -3.6, -6.5, 0.9, 3, "rgba(255,255,255,.6)");
      for (let i = 0; i < 3; i++) muenz(c, -13.5, 17.5 - i * 2.7, 4.8, 1.7);
      muenz(c, 10.5, 16.5, 4.8, 4.8);
      funke(c, 19, 7.5, 2.4, "#fff3c8");
      break;
    }
    case 16: { // Puderzucker-Dose: Verbrauchs-Gegenstand, streut Pixelzucker
      c.save();
      c.rotate(-0.35);
      rund(c, -8.5, -8.5, 17, 21, 3, "#f3efe6");
      c.fillStyle = "#7aa2c8";
      c.fillRect(-8.5, 1.5, 17, 3);
      for (let i = 0; i < 4; i++) kreis(c, -5.7 + i * 3.8, -3.6, 1.1, "#7aa2c8");
      c.fillStyle = "#c9cfd8";
      c.beginPath();
      c.ellipse(0, -8.5, 8.5, 3.6, 0, Math.PI, 0);
      c.fill();
      for (let i = -1; i <= 1; i++) kreis(c, i * 3.2, -10.2, 0.7, "#3a3f4a");
      c.restore();
      for (let i = 0; i < 7; i++) {
        const ph = (t * 0.9 + i * 0.37) % 1;
        px(c, 6.5 + i * 2.4 + ph * 3, -11 + ph * 31, 1.8, `rgba(255,255,255,${(1 - ph * 0.6).toFixed(3)})`);
      }
      break;
    }
    case 17: { // Adventskranz: vier Kerzen, darunter die Lebensanzeige mit vier vollen Feldern
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * TAU;
        kreis(c, Math.cos(a) * 15, -6 + Math.sin(a) * 10.5, 3.4, i % 2 ? "#2f6b45" : "#3b8256");
      }
      for (const [dx, hoch, farbe] of [[-10, 11, "#c9453a"], [-3.4, 14, "#f3efe6"], [3.4, 12, "#c9453a"], [10, 9, "#f3efe6"]] as const) {
        rund(c, dx - 1.5, -7 - hoch, 3, hoch, 0.8, farbe);
        const fl = 1 + Math.sin(t * 9 + dx) * 0.14;
        ell(c, dx, -10.4 - hoch, 1.5, 3 * fl, "#ffd98a");
        ell(c, dx, -9.8 - hoch, 0.7, 1.5 * fl, "#fff6d6");
      }
      kreis(c, -7, -3, 1.5, ROT);
      kreis(c, 0, -1, 1.5, ROT);
      kreis(c, 7, -3, 1.5, ROT);
      for (let i = 0; i < 4; i++) {
        rund(c, -13.5 + i * 7.2, 13, 6, 6, 1, "#22242e");
        rund(c, -12.7 + i * 7.2, 13.8, 4.4, 4.4, 0.7, "#f08a9c");
      }
      break;
    }
    case 18: { // Zinkwanne: Heilquelle mit Plus-Zeichen, Bläschen steigen auf
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.5 + rand(i + 2)) % 1;
        c.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - ph)).toFixed(3)})`;
        c.lineWidth = 0.9;
        c.beginPath();
        c.arc(-12 + rand(i + 9) * 24 + Math.sin(t * 2 + i) * 2, -9 - ph * 15, 1.4 + rand(i) * 2.2, 0, TAU);
        c.stroke();
      }
      poly(c, [[-23, -9], [23, -9], [17.5, 12.5], [-17.5, 12.5]], "#9aa7ad");
      c.strokeStyle = "#7d8a90";
      c.lineWidth = 0.8;
      for (let j = 0; j < 2; j++) {
        c.beginPath();
        c.moveTo(-21 + j * 1.5, -3 + j * 6);
        c.quadraticCurveTo(0, -1 + j * 6, 21 - j * 1.5, -3 + j * 6);
        c.stroke();
      }
      ell(c, 0, -9, 23, 4.6, "#cfe6f2");
      c.strokeStyle = "#7d8a90";
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-23, -9);
      c.lineTo(23, -9);
      c.stroke();
      c.beginPath();
      c.arc(-26, -10, 3, Math.PI * 0.5, Math.PI * 1.5);
      c.stroke();
      c.beginPath();
      c.arc(26, -10, 3, Math.PI * 1.5, Math.PI * 0.5);
      c.stroke();
      for (let i = 0; i < 7; i++) kreis(c, -19 + i * 6.3 + rand(i) * 2, -9 + Math.sin(t * 3 + i) * 0.8, 2 + rand(i + 3) * 1.6, i % 3 ? "#f6fbff" : "#dcecf8");
      rund(c, 14, -26, 13, 13, 3, "#3f9d6a");
      c.fillStyle = "#f7f4ec";
      c.fillRect(19, -23.6, 3, 8.2);
      c.fillRect(16.4, -21.2, 8.2, 3);
      break;
    }
    case 19: { // Kleine Eisenbahn: Lore auf Schienen mit Fahrtwind
      strich(c, -31, 18, 31, 18, "#8a6a4a", 1.6);
      strich(c, -31, 14, 31, 14, "#8a6a4a", 1.6);
      c.fillStyle = "#6b4423";
      for (let i = 0; i < 9; i++) c.fillRect(-29 + i * 7, 13, 2, 6);
      for (let i = 1; i <= 3; i++) strich(c, -35 + i * 3, -7 + i * 4, -21 + i * 3, -7 + i * 4, `rgba(255,255,255,${(0.55 - i * 0.14).toFixed(3)})`, 1.3);
      c.save();
      c.translate(Math.sin(t * 2) * 2, 0);
      rund(c, -13, -3, 25, 12.5, 2, "#c9453a");
      c.fillStyle = "#8c2a22";
      c.fillRect(-13, 7.4, 25, 2.1);
      rund(c, 4, -13, 9.5, 10.5, 1.5, "#3a6fb0");
      rund(c, 6.2, -11, 5, 4.2, 0.8, "#ffe9a8");
      rund(c, -9.6, -11.5, 4.6, 9.5, 1, "#22242e");
      for (let i = 0; i < 3; i++) kreis(c, -7.4 + i * 2.2, -15.5 - i * 1.7, 2.5 - i * 0.45, `rgba(255,255,255,${(0.6 - i * 0.17).toFixed(3)})`);
      for (const wx of [-7, 7]) {
        kreis(c, wx, 11.5, 3.5, "#22242e");
        kreis(c, wx, 11.5, 1.2, GOLD);
      }
      c.restore();
      break;
    }
    case 20: { // Mini-Fernseher: Arcade-Bildschirm mit Pixelherz, Punkteleiste und Blinkcursor
      strich(c, -7, -17, -14.5, -25, "#b9b3a6", 1.3);
      strich(c, -7, -17, 0.5, -25, "#b9b3a6", 1.3);
      kreis(c, -14.5, -25, 1.4, "#c9453a");
      kreis(c, 0.5, -25, 1.4, "#c9453a");
      rund(c, -23, -17, 46, 34.5, 4, "#6b4423");
      rund(c, -19.5, -13.5, 34.5, 26, 3, "#12241c");
      bmp(c, -6.5, -9 + Math.sin(t * 4) * 0.8, 1.5, HERZ, HERZ_FARBEN);
      for (let i = 0; i < 3; i++) px(c, -15.6 + i * 4.2, -11, 2.3, "#ffe2a0");
      if (Math.floor(t * 2) % 2 === 0) px(c, 9.4, 6.6, 2.3, "#7fdc8f");
      for (let i = 0; i < 3; i++) strich(c, 17.6, -9.5 + i * 3.2, 21, -9.5 + i * 3.2, "#4c2f18", 1);
      break;
    }
    case 21: { // Sternschnuppen-Faden: ein Geschoss mit Pixelschweif am Faden
      strich(c, -17, 20, 13, -13, "rgba(232,194,90,.45)", 0.7);
      const a = 0.72;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      for (let i = 1; i <= 7; i++) {
        const q = 1 - i / 8;
        px(c, 13 - dx * i * 5.2 - q * 2.6, -13 - dy * i * 5.2 - q * 2.6, q * 5.2, i < 3 ? "rgba(255,240,200,.95)" : `rgba(255,217,138,${(0.75 - i * 0.1).toFixed(3)})`);
      }
      stern(c, 13, -13, 7.6, GOLD, 5, 0.46);
      kreis(c, 13, -13, 2.4, "#fff6d6");
      funke(c, 4, -20, 2.6, "#fff3c8");
      funke(c, 21, -3, 2, "#fff3c8");
      break;
    }
    case 22: { // Schneestern: Eiskristall am Fenster, ein Glitzer-Fund
      c.fillStyle = "rgba(120,170,220,.12)";
      c.fillRect(-26, -25, 52, 46);
      c.strokeStyle = "rgba(200,222,240,.35)";
      c.lineWidth = 1.2;
      c.strokeRect(-26, -25, 52, 46);
      c.beginPath();
      c.moveTo(0, -25);
      c.lineTo(0, 21);
      c.stroke();
      const dreh = Math.sin(t * 0.8) * 0.12;
      for (let i = 0; i < 6; i++) {
        const a = dreh + (i * Math.PI) / 3;
        poly(c, [[0, 0], [Math.cos(a - 0.22) * 8, Math.sin(a - 0.22) * 8], [Math.cos(a) * 22, Math.sin(a) * 22], [Math.cos(a + 0.22) * 8, Math.sin(a + 0.22) * 8]], i % 2 ? "#cfe8ff" : "#9fd3ee");
      }
      kreis(c, 0, 0, 4.4, "#ffffff");
      flocke(c, 17, -15, 3.4);
      flocke(c, -18, 12, 2.8);
      funke(c, 11, 13, 2.6, "rgba(255,255,255,.95)");
      break;
    }
    case 23: { // Silberkugel: spiegelt das Zimmer wie ein Spiegel-Gegenstand
      ell(c, 0, 21, 15, 2.6, "rgba(0,0,0,.35)");
      const g = c.createRadialGradient(-8, -9, 2, 0, 0, 20);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, "#cfdce9");
      g.addColorStop(1, "#5f7085");
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, 19.5, 0, TAU);
      c.fill();
      c.save();
      c.beginPath();
      c.arc(0, 0, 18.4, 0, TAU);
      c.clip();
      c.fillStyle = "rgba(40,70,110,.5)";
      c.fillRect(-18, -8, 36, 24);
      c.fillStyle = "rgba(255,241,214,.85)";
      c.fillRect(-12.5, -4, 11, 9.5);
      poly(c, [[-9, 13], [-2, 13], [-5.5, 3.5]], "#2f6b4a");
      rund(c, 5, 4.5, 8.5, 7.5, 3, "#cbb6f1");
      c.restore();
      c.strokeStyle = "rgba(255,255,255,.5)";
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(0, 0, 19.5, 0, TAU);
      c.stroke();
      ell(c, -8, -9, 4, 2.4, "rgba(255,255,255,.9)");
      funke(c, 19, -17, 2.8, "#ffffff");
      break;
    }
    default: { // Der große Baum: das Ziel mit karierte Fahne und Konfetti
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + 0.2;
        const rr = 23 + Math.sin(t * 1.5 + i) * 2.5;
        px(c, Math.cos(a) * rr * 1.3, -6 + Math.sin(a) * rr * 0.78, 2, i % 3 === 0 ? "#e8c25a" : i % 3 === 1 ? "#f08a9c" : "#9fd3ee");
      }
      rund(c, -2.4, 12, 4.8, 7, 0.8, "#5a3a1e");
      for (let i = 0; i < 3; i++) {
        const oy = 13 - i * 9;
        const hw = 17 - i * 4;
        poly(c, [[-hw, oy], [hw, oy], [0, oy - 14]], i === 0 ? "#1f4a33" : i === 1 ? "#256044" : "#2e7a52");
      }
      for (let i = 0; i < 7; i++) {
        kreis(c, (rand(i + 31) * 2 - 1) * (11 - Math.floor(i / 3) * 2.4), 8 - rand(i + 21) * 22 - 3, 1.6, ["#c9453a", "#e8c25a", "#9fd3ee"][i % 3]);
      }
      kreis(c, 0, -18, 9 + Math.sin(t * 2.4) * 1.2, "rgba(255,217,138,.2)");
      stern(c, 0, -18, 7, GOLD, 5, 0.46);
      kreis(c, 0, -18, 1.6, "#fff6d6");
      strich(c, 22, 19, 22, -6, "#d8d2c4", 1.8);
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 4; j++) {
          c.fillStyle = (i + j) % 2 ? "#f7f4ec" : "#22242e";
          c.fillRect(23 + j * 3.2, -6 + i * 3.2, 3.2, 3.2);
        }
      }
      break;
    }
  }

  // Zwei Funken und darunter der feine Goldstrich
  const blink = 0.55 + 0.45 * Math.sin(t * 2.2 + tag);
  funke(c, 25, -21, 2.6, `rgba(255,243,200,${(blink * 0.9).toFixed(3)})`);
  funke(c, -27, 13, 2, `rgba(255,243,200,${(0.9 - blink * 0.6).toFixed(3)})`);
  strich(c, -26, 29, 26, 29, "rgba(232,194,90,.5)", 0.8);
  poly(c, [[0, 26.6], [2.2, 29], [0, 31.4], [-2.2, 29]], GOLD);
  c.restore();
}
