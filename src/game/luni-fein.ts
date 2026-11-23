/** Stoffe und Licht der Studio-Alternative. Die Figur selbst zeichnet weiterhin Lunis Original-Rig. */
import { drawLuni, LUNI_COLORS as K, type LuniOpts, type LuniZeichenpinsel } from "./luni";

type C = CanvasRenderingContext2D;
type Punkt = [number, number];
type Ton = CanvasGradient | string;
type Zug = [number, number] | [number, number, number, number] | [number, number, number, number, number, number];
const KREIS = 2 * Math.PI;

function pfad(c: C, x: number, y: number, z: Zug[]) {
  c.beginPath(); c.moveTo(x, y);
  for (const p of z) {
    if (p.length === 2) c.lineTo(...p);
    else if (p.length === 4) c.quadraticCurveTo(...p);
    else c.bezierCurveTo(...p);
  }
}
function linie(c: C, farbe: Ton, breite: number, x: number, y: number, ...z: Zug[]) {
  pfad(c, x, y, z); c.strokeStyle = farbe; c.lineWidth = breite; c.stroke();
}
function flaeche(c: C, farbe: Ton, x: number, y: number, ...z: Zug[]) {
  pfad(c, x, y, z); c.closePath(); c.fillStyle = farbe; c.fill();
}
function oval(c: C, farbe: Ton, x: number, y: number, rx: number, ry: number, winkel = 0) {
  c.fillStyle = farbe; c.beginPath(); c.ellipse(x, y, rx, ry, winkel, 0, KREIS); c.fill();
}
function verlauf(c: C, x: number, y: number, dx: number, dy: number, ...farben: string[]) {
  const g = c.createLinearGradient(x, y, x + dx, y + dy);
  farben.forEach((f, i) => g.addColorStop(i / (farben.length - 1), f)); return g;
}
function rund(c: C, x: number, y: number, w: number, h: number, r: number) {
  pfad(c, x + r, y, [[x + w - r, y], [x + w, y, x + w, y + r], [x + w, y + h - r],
    [x + w, y + h, x + w - r, y + h], [x + r, y + h], [x, y + h, x, y + h - r],
    [x, y + r], [x, y, x + r, y]]); c.closePath();
}

const haar: LuniZeichenpinsel["haar"] = (c, teil, l, fluss, seite) => {
  c.lineCap = "round"; c.lineJoin = "round";
  if (teil === "seite") {
    c.scale(seite, 1);
    c.fillStyle = verlauf(c, 6.3, -1, 5.1, .4, "#24232c", "#3c3840", "#292730", "#14151c");
    c.fillRect(3, -7, 15, l + 11);
    for (let i = 0; i < 7; i++) {
      const a = i / 6, x = 6.8 + a * 2.7, ende = 7.7 + a * 2.4 + fluss * .22;
      linie(c, i % 3 === 0 ? "rgba(175,157,148,.28)" : i % 2 ? "rgba(105,103,120,.43)" : "rgba(12,12,18,.6)",
        i === 2 ? .32 : .13, x, -5.8 + a, [x + 1.12, l * .22, ende - .3, l * .65, ende, l * (1 - .036 * Math.sin(i))]);
    }
    linie(c, "rgba(205,182,168,.23)", .18, 7.85, -2.1, [8.6, -.3, 8.75, 2.2]);
    return;
  }
  if (teil === "pony") {
    c.fillStyle = verlauf(c, -10, -10, 19, 5, "#1b1b22", "#39343c", "#24232a", "#302d35", "#181820");
    c.fillRect(-13, -14, 26, 20);
    for (const d of [-1, 1]) {
      for (let i = 0; i < 17; i++) {
        const v = (i + .4) / 17, ax = 2.1 + d * (.03 + .37 * v), ay = -10.35 - .31 * v;
        const ex = 2.1 + d * v * (d < 0 ? 13.6 : 9.2), ey = -4.85 + v * v * 4.35;
        const f = i % 4 === 0 ? "rgba(153,140,143,.31)" : i % 2 ? "rgba(11,12,19,.41)" : "rgba(124,119,135,.26)";
        const x1 = ax + d * (.3 + v * 3.65), x2 = ex - d * v * .84;
        const y1 = ay - .24 + (1 - v) * 1.2, y2 = ey - 3.29 - v * .5;
        const dicke = .12 + .18 * Math.sin(i * 1.4) ** 2;
        flaeche(c, f, ax, ay, [x1, y1, x2, y2, ex, ey],
          [x2 - d * dicke, y2 + dicke, x1 - d * dicke, y1 + dicke * .6, ax, ay]);
      }
    }
    flaeche(c, "rgba(187,171,165,.11)", 1.4, -10.1, [-2.9, -9.9, -6, -8.4, -8.36, -5.19],
      [-6.1, -7.63, -2.6, -8.95, .2, -9.37], [1.21, -9.62, 1.4, -10.1]);
    linie(c, "rgba(203,183,169,.31)", .15, -7.85, -5.75, [-6.69, -7.47, -4.78, -8.44, -3.08, -8.98]);
    return;
  }
  c.fillStyle = verlauf(c, -11, -5, 24, 4, "#1b1b23", "#35323a", "#28272f", "#333039", "#171820");
  c.fillRect(-19, -15, 39, l + 21);
  const scheitel = -.8;
  for (let i = 0; i < 25; i++) {
    const v = i / 24, xx = -12.2 + v * 24.4, d = xx < scheitel ? -1 : 1;
    const ab = Math.abs(xx - scheitel), sx = scheitel + (v - .5) * 2.3;
    const ey = l * (.96 + .037 * Math.sin(i * 1.3));
    const ex = xx + fluss * (.6 + .13 * Math.cos(i));
    const breite = .25 + .38 * (.5 + .5 * Math.cos(i * 2.2));
    const g = verlauf(c, 0, -10, 0, Math.max(7, ey + 10),
      "rgba(161,150,155,.02)", i % 3 ? "rgba(162,151,151,.22)" : "rgba(180,174,183,.29)",
      "rgba(122,116,135,.09)", "rgba(140,133,145,.18)", "rgba(93,88,108,.04)");
    const sy = -10.65 + Math.abs(v - .5) * .66;
    const cx = xx + d * (.7 + ab * .1), cy = -4.1;
    const my = 2.65;
    const fin: Zug[] = [[sx + d * ab * .42, sy - .2, cx, cy, xx, my],
      [xx + d * .69, my + (ey - my) * .38, ex - d * .42, my + (ey - my) * .74, ex, ey]];
    linie(c, g, breite, sx, sy, ...fin);
    linie(c, i % 3 === 0 ? "rgba(13,13,19,.5)" : "rgba(167,153,151,.16)", .115,
      sx + .26, sy + .12, [sx + d * ab * .48, sy, cx + .28, cy, xx + .35, my + .09],
      [xx + d * .82, my + (ey - my) * .48, ex + .29, ey - .8]);
  }
  const g = verlauf(c, -5.2, -1, 2.8, l * .93, "rgba(185,173,169,.03)", "rgba(155,145,153,.13)", "rgba(132,127,148,.02)");
  flaeche(c, g, -8.35, -5.2, [-6.9, -3.4, -7.48, l * .6, -7.05 + fluss, l],
    [-9 + fluss, l * .91], [-9.75, l * .63, -8.95, .82, -8.35, -5.2]);
};

/** Zwei Fadenschenkel pro Masche. Die Reihen sind im Stoff verankert, nicht auf dem Bildschirm. */
function maschen(c: C, x0: number, x1: number, y0: number, y1: number, abstand = .76) {
  const dy = abstand * .79;
  for (let lage = 0; lage < 2; lage++) {
    c.beginPath();
    for (let i = 0, x = x0; x < x1; i++, x += abstand) {
      for (let j = 0, y = y0 + (i % 2) * .18; y < y1; j++, y += dy) {
        const u = x + Math.sin(i * 1.6 + j * .67) * .035;
        c.moveTo(u + (lage ? .23 : -.23), y - .14);
        c.quadraticCurveTo(u + (lage ? .21 : -.16), y + .13, u, y + .3);
      }
    }
    c.strokeStyle = lage ? "rgba(255,249,224,.36)" : "rgba(105,80,53,.19)";
    c.lineWidth = lage ? .115 : .14; c.stroke();
  }
}

function saum(c: C, x0: number, x1: number, y: number) {
  c.fillStyle = "rgba(132,107,74,.17)"; c.fillRect(x0, y, x1 - x0, 1.65);
  for (let x = x0; x < x1; x += .56) {
    linie(c, "rgba(255,245,213,.6)", .16, x, y + .22, [x + .09, y + .92, x + .04, y + 1.55]);
    linie(c, "rgba(125,103,76,.28)", .11, x + .22, y + .25, [x + .25, y + 1.5]);
  }
  linie(c, "rgba(114,88,63,.38)", .21, x0, y, [x1, y]);
  linie(c, "#e8d8b8", .17, x0, y + .28, [x1, y + .28]);
}

const gewebe: LuniZeichenpinsel["gewebe"] = (c, teil, oben, unten, seite) => {
  c.translate(0, oben); c.lineCap = "round"; c.lineJoin = "round";
  const h = unten - oben;
  if (teil === "kragen") {
    c.fillStyle = verlauf(c, -4.4, -.8, 8.8, 2.8, "#c5b598", "#f1e5cd", "#e4d6b9", "#c9b695"); c.fillRect(-6, -3, 12, 7);
    for (let x = -4; x < 4; x += .48) {
      const y = 1.73 - x * x * .065;
      linie(c, "rgba(136,110,81,.32)", .13, x, y - 1.24, [x * 1.09, y - .33]);
    }
    return;
  }
  if (teil === "shirtsaum") {
    c.fillStyle = verlauf(c, -7, h - 2, 14, 1.6, "#d2cbbd", "#efece1", "#ddd9cb"); c.fillRect(-8, h - 4, 16, 5);
    for (let x = -6.85; x < 7; x += .69) linie(c, "#c9c3b3", .12, x, h - 3.02, [x + .37, h - 2.99]);
    return;
  }
  if (teil === "taillenbund") {
    c.fillStyle = verlauf(c, -6.8, h, 14, .7, "#24262e", "#33353f", "#292c34", "#20232c"); c.fillRect(-8, h - 4, 16, 8);
    linie(c, "#474851", .2, -7, h - 1.87, [-.7, h - 1.59, 7, h - 1.91]);
    return;
  }
  if (teil === "shirt") {
    c.fillStyle = verlauf(c, -6.6, 0, 13.3, 1.1, "#c9c6bc", K.teeShade, "#fffcf3", K.tee, "#d6d2c7");
    c.fillRect(-8, -2, 16, h + 7);
    const ombre = verlauf(c, 0, 0, 0, h, "rgba(110,91,67,.15)", "rgba(255,250,238,.01)", "rgba(115,105,89,.09)");
    c.fillStyle = ombre; c.fillRect(-8, -1, 16, h + 5);
    flaeche(c, "rgba(158,151,135,.16)", 3.5, 7.8, [3, 10.9, -.3, 13.71], [1.5, 13.2, 3, 11.4], [3.85, 9.19, 3.5, 7.8]);
    linie(c, "rgba(255,254,243,.85)", .26, -3.2, h - 4, [-.5, h - 3.4, 2.9, h - 4.6]);
    linie(c, "#bab5a5", .22, -3.28, 1.05, [-.3, 3.67, 3.62, .95]);
    linie(c, "#fffdf3", .33, -3.29, .69, [-.21, 3.01, 3.65, .61]);
    return;
  }
  if (seite) c.scale(seite, 1);
  const ruecken = teil === "ruecken", x0 = ruecken ? -8 : 2, x1 = 8;
  c.fillStyle = verlauf(c, x0, 0, x1 - x0, 1.12, "#aa9473", "#ddcaaa", "#e8d9bb", K.cardigan, "#ba9f7c");
  c.fillRect(-9, -2, 18, h + 6);
  const warm = verlauf(c, 0, 0, 0, h + 1, "rgba(108,82,59,.21)", "rgba(255,249,221,.01)", "rgba(135,108,74,.1)");
  c.fillStyle = warm; c.fillRect(-9, -2, 18, h + 7);
  for (let j = -2; j < 5; j++) {
    const x = 5.85 + j * 4.9;
    linie(c, "rgba(130,98,66,.22)", .67, x, -.9, [x - .4, h * .42, x + .13, h + 2]);
    linie(c, "rgba(248,230,196,.46)", .2, x + .62, -.9, [x + .11, h * .48, x + .76, h + 2]);
  }
  for (let j = 0; j < 5; j++) {
    const y = 3.55 + j * 4.45;
    linie(c, "rgba(130,94,60,.23)", .75, x0 - 1, y, [3.2, y + .91, x1 + .8, y + .2]);
    linie(c, "rgba(129,101,69,.31)", .19, x0 - 1, y + .9, [3.2, y + 1.74, x1 + .8, y + 1.03]);
  }
  maschen(c, x0 - .2, x1 + .3, .5, h + 2);
  saum(c, x0 - .2, x1 + .4, h + .02);
  if (ruecken) {
    linie(c, "#968565", .3, -7.2, 4.5, [.1, 6.4, 7.4, 4.5]);
    return;
  }
  // Die eingerahmte Knopfleiste und die Tasche liegen ganz im originalen Vorderteil.
  flaeche(c, "rgba(243,229,199,.67)", 2.1, -.4, [3.55, -.4], [3.45, 6, 3.73, h * .65],
    [4.49, h + 2], [3.05, h + 2], [2.14, 6.9, 2.1, -.4]);
  linie(c, "#a08766", .21, 3.58, .7, [3.38, 8, 4.41, h + .6]);
  for (let j = 0; j < 16; j++) {
    const y = .9 + j * 1.06, x = 3.2 + .64 * (y / h) ** 2;
    linie(c, "#eee0c4", .16, x, y, [x + .025, y + .54]);
  }
  if (seite < 0) {
    const yt = h - 5.15;
    flaeche(c, "#bca582", 4.47, yt, [7.65, yt - .28], [7.48, yt + 4.03], [6.21, yt + 4.59, 4.61, yt + 4.03]);
    flaeche(c, "#d3bc97", 4.58, yt + .38, [7.4, yt + .17], [7.26, yt + 3.85], [6.3, yt + 4.16, 4.79, yt + 3.78]);
    maschen(c, 4.91, 7.16, yt + .61, yt + 3.24, .56);
    linie(c, "#8d785b", .24, 4.42, yt, [6.3, yt + .12, 7.7, yt - .25]);
    linie(c, "#f1dfbb", .32, 4.49, yt + .3, [6.31, yt + .41, 7.62, yt + .07]);
    linie(c, "#918362", .15, 5.58, yt + 3.46, [5.74, yt + 2.23, 6.7, yt + 1.01]);
    for (let i = 0; i < 3; i++) {
      const px = 5.93 + i * .24, py = yt + 2.71 - i * .49;
      oval(c, i % 2 ? "#a89e77" : "#9a9572", px - .37, py - .17, .2, .43, -.82);
      oval(c, "#c6b286", px + .27, py - .28, .18, .4, .72);
    }
  } else {
    for (let i = 0; i < 3; i++) linie(c, "rgba(137,113,82,.32)", .19, 6.6, h - 4.8 + i * .46, [7.1, h - 4.3 + i * .46, 7.7, h - 4.4 + i * .46]);
  }
};

/** Zwei runde Gliedsegmente bilden genau die Maske des Originalstrichs, auch am gebeugten Gelenk. */
function kapsel(c: C, a: Punkt, b: Punkt, r: number) {
  const t = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const nx = -Math.sin(t) * r, ny = Math.cos(t) * r;
  c.moveTo(a[0] - nx, a[1] - ny); c.lineTo(b[0] - nx, b[1] - ny);
  c.arc(b[0], b[1], r, t - Math.PI / 2, t + Math.PI / 2);
  c.lineTo(a[0] + nx, a[1] + ny); c.arc(a[0], a[1], r, t + Math.PI / 2, t + 1.5 * Math.PI); c.closePath();
}

const glied: LuniZeichenpinsel["glied"] = (c, a, b, e, breite, basis, bein) => {
  const r = breite / 2, fern = basis === K.cardiganDark;
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  linie(c, basis, breite, ...a, b, e);
  c.beginPath(); kapsel(c, a, b, r); kapsel(c, b, e, r); c.clip();
  for (let i = 0; i < 2; i++) {
    const [p, q] = i ? [b, e] : [a, b];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (l < .015) continue;
    c.save(); c.translate(...p); c.rotate(Math.atan2(q[1] - p[1], q[0] - p[0]) - Math.PI / 2);
    c.fillStyle = bein ? verlauf(c, -r, 0, breite, 0, "#20222b", basis, "#3b3d47", "#33363e", "#22252d")
      : verlauf(c, -r, 0, breite, 0, fern ? "#a59172" : "#bba583", basis, fern ? "#dfcbab" : "#ebdcc0", fern ? "#bcaa8d" : "#d0b895");
    c.fillRect(-r - .1, -r, breite + .2, l + 2 * r);
    if (bein) {
      linie(c, "rgba(118,119,129,.36)", .18, -r * .69, -.1, [-r * .77, l * .49, -r * .59, l + .51]);
      linie(c, "rgba(15,18,24,.36)", .19, -r * .79, -.1, [-r * .87, l * .49, -r * .69, l + .51]);
      if (i) {
        for (let j = 0; j < 2; j++) {
          const yy = -.22 + j * .62;
          linie(c, "rgba(144,145,151,.24)", .15, -r * .72, yy, [-.4, yy + .8, r * (.52 - j * .085), yy + .34]);
          linie(c, "rgba(9,13,21,.27)", .25, -r * .71, yy + .26, [-.3, yy + .94, r * (.5 - j * .09), yy + .52]);
        }
        linie(c, "#66656d", .2, -r + .17, l - .59, [.25, l + .13, r - .16, l - .25]);
      }
    } else {
      for (let j = -1; j < 5; j++) {
        const yy = j * 3.25 + 1.8;
        linie(c, "rgba(119,87,55,.23)", .52, -r - .1, yy, [0, yy + .74, r + .1, yy + .1]);
        linie(c, "rgba(255,244,214,.43)", .18, -r - .1, yy + .48, [0, yy + 1.07, r + .1, yy + .6]);
      }
      linie(c, "rgba(124,94,64,.27)", .43, .24, -r, [.02, l * .58, .25, l + r]);
      maschen(c, -r + .1, r, -1.5, l + r, .71);
      if (i) {
        flaeche(c, "rgba(113,91,64,.18)", -r, .25, [-.28, 1.5, r * .72, .82], [0, 1.97, -r, 1.05]);
        linie(c, "rgba(250,239,208,.69)", .23, -r * .9, 1.45, [-.08, 2.3, r * .64, 1.54]);
        saum(c, -r, r, l - .55);
      }
    }
    c.restore();
  }
  c.restore();
};

const gesicht: LuniZeichenpinsel["gesicht"] = (c, expr, blink, t, brille, blick, flau, gesang) => {
  c.lineCap = "round"; c.lineJoin = "round";
  for (const d of [-1, 1]) {
    const x = d < 0 ? -5.28 : 5.79, y = d < 0 ? 3.56 : 3.48;
    const g = c.createRadialGradient(x, y, .12, x, y, 2.79);
    g.addColorStop(0, "rgba(211,123,111,.38)"); g.addColorStop(.57, "rgba(226,144,124,.21)"); g.addColorStop(1, "rgba(221,137,124,0)");
    oval(c, g, x, y, 2.78, 1.85, d * -.13);
    for (let j = 0; j < 4; j++) oval(c, "rgba(161,113,84,.37)", x - .9 + j * .55, y + .1 + .34 * Math.sin(j * 2.1 + d), .105 + (j % 2) * .032, .105);
  }
  // Beide Augen behalten die urspruenglichen Mittelpunkte ihrer Brillenglaeser.
  for (const [x, m] of [[-2.6, .94], [3.6, 1]] as const) {
    c.save(); c.translate(x, .4); c.scale(m, m);
    const muede = expr === "sleep" || expr === "tired", erstaunt = expr === "surprised", denkt = expr === "think";
    const eng = expr === "focus" || expr === "annoyed";
    const zu = blink > .5 || expr === "sleep" || (expr === "wink" && x > 0)
      || (flau < .5 && (expr === "grin" || expr === "happy"));
    const braue = erstaunt ? -3.8 : muede ? -2.7 : -3.35;
    const hub = eng ? (x > 0 ? -.61 : .61) : denkt && x > 0 ? -.43 : .04;
    flaeche(c, "#4c3b34", -1.9, braue + hub, [-1.18, braue - .59, .81, braue - .7, 1.88, braue - hub + .02],
      [1.47, braue + .2 - hub, .22, braue + .04, -.86, braue + .08], [-1.52, braue + .24, -1.9, braue + hub]);
    if (zu) {
      const sy = .31, bogen = expr === "sleep" ? 1.76 : -1.65;
      linie(c, "#6e5548", .53, -1.55, sy, [-.06, sy + bogen, 1.69, sy - .1]);
      linie(c, "#be927b", .17, -1.1, sy + .56, [.1, sy + bogen * .62 + .53, 1.21, sy + .43]);
    } else if (expr === "love") {
      flaeche(c, "#b96c70", 0, 1.5, [-2.8, -.25, -1.47, -2.06, 0, -.74], [1.93, -2.4, 2.55, .03, 0, 1.5]);
      oval(c, "#f7c6b3", -.78, -.64, .3, .16, -.26);
    } else {
      const hy = eng ? .73 : muede ? .86 : erstaunt ? 1.65 : 1.27;
      const eye: Zug[] = [[-.92, -hy * 1.45, .74, -hy * 1.27, 1.81, -.1], [1.14, hy * 1.21, -.52, hy * 1.45, -1.84, .17]];
      pfad(c, -1.84, .17, eye); c.closePath(); c.fillStyle = "#faf6e9"; c.fill();
      c.save(); c.clip(); const ix = .12 + Math.max(-1, Math.min(1, blick)) * .5 + (denkt ? .32 : 0);
      const iris = verlauf(c, ix, -1.36, .23, 2.69, K.eye, "#465755", "#78877e");
      oval(c, iris, ix, -.04, 1.17, 1.51); oval(c, "#272c2a", ix + .04, -.15, .68, .93);
      oval(c, "#fff9e9", ix - .28, -.57, .35, .33); oval(c, "#c4d0b8", ix + .42, .57, .16, .12);
      c.restore();
      linie(c, "#4d3d38", .34, -1.83, .13, [-.89, -hy * 1.42, .82, -hy * 1.22, 1.84, -.1]);
      linie(c, "#92715e", .18, -.97, hy * .8, [.42, hy * 1.34, 1.43, hy * .45]);
    }
    c.restore();
  }
  flaeche(c, "rgba(182,127,95,.28)", 1.01, .92, [1.16, 2.39, 2.11, 2.91], [2.09, 3.78, .69, 3.6],
    [.14, 3.45, .37, 3.04], [1.24, 2.49, 1.01, .92]);
  linie(c, "#f9d6b6", .24, .93, 1.67, [1.01, 2.49, 1.51, 2.82]);
  linie(c, "#bb9176", .21, .57, 3.5, [1.27, 3.83, 1.91, 3.32]);
  const mx = .8, my = 5.6, lippe = "#976354";
  if (expr === "talk" || expr === "surprised" || expr === "sleep" || (expr === "sing" && gesang > .08)) {
    const ry = expr === "talk" ? .46 + .65 * Math.abs(Math.sin(t * 6.8)) : expr === "sing" ? .33 + gesang * 1.2 : expr === "sleep" ? .52 : 1.07;
    oval(c, "#966555", mx, my, expr === "surprised" ? .89 : 1.16, ry);
    linie(c, "#edbc9d", .16, mx - .64, my + ry + .15, [mx, my + ry + .53, mx + .58, my + ry + .18]);
  } else {
    const traurig = flau >= .5 || expr === "sad" || expr === "annoyed";
    const froh = expr === "happy" || expr === "grin" || expr === "love" || expr === "wink";
    const breite = froh ? 2.66 : 1.74, bogen = traurig ? -1.25 : froh ? 2.12 : .67;
    if (expr === "grin") flaeche(c, lippe, mx - breite, my - .5, [mx, my + .2, mx + breite, my - .6], [mx + .65, my + 2.97, mx - breite, my - .5]);
    else linie(c, lippe, froh ? .6 : .47, mx - breite, my - .34, [mx + .21, my + bogen, mx + breite, my - .57]);
    linie(c, "#f4c7a8", .21, mx - .92, my + (traurig ? .49 : 1.07), [mx + .3, my + (traurig ? .35 : 1.5), mx + 1.11, my + .91]);
  }
  if (!brille) return;
  const rahmen = verlauf(c, 0, -2.5, .27, 6.05, "#171820", "#39363b", "#242328", "#17171d");
  for (const x of [-2.6, 3.6]) {
    rund(c, x - 2.7, -2, 5.4, 4.8, 1.7); c.fillStyle = "rgba(208,228,228,.12)"; c.fill();
    c.strokeStyle = rahmen; c.lineWidth = .95; c.stroke();
    c.save(); c.clip();
    flaeche(c, "rgba(250,251,241,.17)", x - 3, -.37, [x - .93, -2.4], [x + .24, -2.4], [x - 2.57, 1.5]);
    linie(c, "rgba(255,255,245,.41)", .19, x + .65, 2.49, [x + 2.25, .16]); c.restore();
    linie(c, "#8b8180", .17, x - 1.61, -2.08, [x -.45, -2.23, x + .98, -2.09]);
    linie(c, "#67656a", .15, x + 2.67, 1.26, [x + 2.41, 2.54, x + 1.28, 2.81]);
  }
  linie(c, "#242328", .85, .08, -.12, [.49, -.57, .91, -.12]);
  linie(c, "#29252a", .83, -5.28, -.41, [-7.6, -1.21]);
  oval(c, "#b9a78b", -5.42, -.42, .22, .17); oval(c, "#a49b8d", 6.36, -.4, .18, .15);
};

const PINSEL: LuniZeichenpinsel = {
  haar, gewebe, glied, gesicht,
  hautton(c, y, r, haut, schatten) {
    const g = c.createRadialGradient(-2.7, y - 3.3, r * .2, .6, y + .7, r * 1.19);
    g.addColorStop(0, "#ffe0bf"); g.addColorStop(.44, haut); g.addColorStop(.79, "#edbb98"); g.addColorStop(1, schatten); return g;
  },
  knopf(c, x, y) {
    c.save(); c.translate(x, y); oval(c, "rgba(104,76,50,.28)", .11, .14, .72, .72);
    oval(c, verlauf(c, -.5, -.6, 1.1, 1.37, "#f3e1b5", "#c6a174", "#967652"), 0, 0, .68, .65);
    oval(c, "#b49771", 0, .02, .43, .4); oval(c, "#614f3c", -.16, -.05, .11, .12); oval(c, "#614f3c", .17, .08, .11, .12);
    linie(c, "#e8d4b3", .12, -.16, -.08, [.03, -.08, .17, .09]);
    linie(c, "#f8e8c6", .1, -.42, -.33, [-.16, -.56, .16, -.48]); c.restore();
  },
  bund(c, breite) {
    const r = breite / 2;
    c.fillStyle = verlauf(c, 0, -r, 0, breite, "#bdab8c", "#eee1c5", "#d3bea0"); c.fillRect(-2, -r, 3, breite);
    for (let y = -r + .22; y <= r; y += .46) {
      linie(c, "#b9a58a", .14, -1.51, y, [-.74, y - .13, .26, y - .04]);
      linie(c, "#f3e7cd", .13, -1.51, y + .16, [-.67, y + .03, .26, y + .12]);
    }
  },
  socke(c, farben) {
    c.fillStyle = farben[0]; c.fillRect(-3, -4, 9, 5);
    flaeche(c, farben[1], 3.23, -4, [2.13, -2.18, 3.04, .4], [6.2, .4], [6.2, -4]);
    c.fillStyle = verlauf(c, 0, -3.8, .23, 4.12, "rgba(255,253,221,.25)", "rgba(255,251,228,.04)", "rgba(30,47,49,.18)");
    c.fillRect(-3, -5, 10, 6);
    for (let x = -1.82; x < 1.92; x += .59) {
      for (let y = -3.12; y < -.28; y += .59) linie(c, "rgba(255,252,219,.37)", .116, x - .18, y, [x, y + .24], [x + .18, y - .03]);
    }
    for (let j = 0; j < 6; j++) {
      const y = -3.32 + j * .57, x = 2.88 - .43 * Math.sin((j + 1) / 7 * Math.PI);
      linie(c, "rgba(90,79,60,.36)", .14, x, y, [x + .28, y + .24]);
    }
    linie(c, "rgba(255,251,216,.53)", .21, -1.77, -3.14, [-.28, -3.48, 1.33, -3.16]);
  },
  hand(c, s, spitzen, geste, handruecken) {
    const lage = [1.14, .39, -.37, -1.12];
    for (let i = 0; i < 4; i++) {
      const y = s * lage[i], lang = geste === "offen" || (geste === "zeig" && i === 0);
      if (lang && handruecken) oval(c, "rgba(255,228,202,.73)", spitzen[i] - .22, y * (geste === "offen" ? 1.1 : 1), .31, .19, y * .035);
      linie(c, "rgba(193,142,111,.46)", .105, 1.14, y -.13, [1.09, y + .07, 1.21, y + .13]);
    }
    if (!handruecken) linie(c, "rgba(191,144,112,.42)", .14, -.87, s * .64, [-.44, s * .27, .21, s * .33]);
    linie(c, "rgba(255,229,200,.72)", .15, -1.51, -.44, [-1.12, -.73, -.57, -.76]);
  },
};

export function zeichneLuniFein(c: C, x: number, y: number, opts: LuniOpts = {}) {
  return drawLuni(c, x, y, opts, PINSEL);
}