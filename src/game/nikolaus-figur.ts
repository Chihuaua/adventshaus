/** Dieselbe Zeichnung fuer Haus und Figurenblatt. Der Ursprung liegt zwischen den Sohlen. */
export type NikolausAnsicht = "vorn" | "links" | "rechts" | "hinten";
export type NikolausPose = "stehen" | "gehen" | "gruessen";
export const NIKOLAUS_HOEHE = 94;

type C = CanvasRenderingContext2D;
type Farbe = string | CanvasGradient;
type Zug = [number, number] | [number, number, number, number] | [number, number, number, number, number, number];
const TAU = 2 * Math.PI;

function pfad(c: C, x: number, y: number, zuege: Zug[]) {
  c.beginPath(); c.moveTo(x, y);
  for (const z of zuege) {
    if (z.length === 2) c.lineTo(...z);
    else if (z.length === 4) c.quadraticCurveTo(...z);
    else c.bezierCurveTo(...z);
  }
}
function flaeche(c: C, f: Farbe, x: number, y: number, ...z: Zug[]) {
  pfad(c, x, y, z); c.closePath(); c.fillStyle = f; c.fill();
}
function strich(c: C, f: Farbe, w: number, x: number, y: number, ...z: Zug[]) {
  pfad(c, x, y, z); c.strokeStyle = f; c.lineWidth = w; c.stroke();
}
function oval(c: C, f: Farbe, x: number, y: number, rx: number, ry: number, a = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, TAU); c.fillStyle = f; c.fill();
}
function seide(c: C, x: number, y: number, w: number, h: number, ...farben: string[]) {
  const g = c.createLinearGradient(x, y, x + w, y + h);
  farben.forEach((f, i) => g.addColorStop(i / (farben.length - 1), f));
  return g;
}
function stern(c: C, x: number, y: number, r: number, farbe: string) {
  const p: Zug[] = [];
  for (let i = 1; i < 8; i++) {
    const a = i * Math.PI / 4 - Math.PI / 2, l = i % 2 ? r * .28 : r;
    p.push([x + .8 * Math.cos(a) * l, y + Math.sin(a) * l]);
  }
  flaeche(c, farbe, x, y - r, ...p);
}

function stiefel(c: C, x: number, hub: number, weit: number, seite: boolean, hinten: boolean) {
  c.save(); c.translate(x, -hub); c.rotate(weit * .055);
  const spitze = seite ? 7.2 : hinten ? 2.8 : 4.2;
  flaeche(c, "#312824", -2.5, -12, [2.8, -12], [2.4, -4.8], [spitze, -3.7, spitze + .3, -1.8],
    [spitze + .8, -.2, spitze - .2, 0], [-2.7, 0], [-3.6, -2, -2.6, -5]);
  flaeche(c, "#80543d", -2.3, -11.2, [2.2, -11.2], [1.7, -5.2], [-1.5, -4.8]);
  strich(c, "#a48562", .55, -2.5, -1.1, [1, -.5, spitze - .1, -1]);
  strich(c, "#a57851", .55, -.6, -4.7, [2.8, -4.8, spitze - .5, -2.6]);
  c.restore();
}

function sack(c: C, x: number, y: number, groesse: number, pendel: number) {
  c.save(); c.translate(x, y); c.rotate(pendel); c.scale(groesse, groesse);
  // Ein Tannenzweig und ein kleines Paeckchen schauen aus dem Leinenbeutel.
  strich(c, "#72552e", .8, 0, 4, [4, -10]);
  for (let i = 0; i < 5; i++) {
    const yy = -7 + i * 1.7, xx = 2.9 - i * .39;
    strich(c, i % 2 ? "#486645" : "#72835a", .75, xx, yy + 1.3, [xx - 2.9, yy - 1.4]);
    strich(c, "#486b4c", .75, xx, yy + 1.2, [xx + 3.4, yy - .9]);
  }
  flaeche(c, "#bd7051", -5.1, -5.4, [-.4, -6.5], [1, -.1], [-3.8, 1.1]);
  strich(c, "#ead196", 1.1, -3.1, -5.9, [-1.6, .2]);
  const leinen = seide(c, -10, 0, 24, 8, "#795036", "#cba06a", "#ae7d4b", "#6b472f");
  flaeche(c, leinen, -2.7, 1.9, [-6.3, -.4, -5.4, -2.7], [-1.5, -1.6, 0, -3],
    [3.1, -1.5, 5.1, -2.4], [5.1, -.5, 2.3, 2.1], [9.3, 8.2, 11.4, 17.4],
    [15.1, 29.7, 5.9, 31.2], [-1.5, 33.7, -9.2, 30], [-14.4, 28, -11.3, 18.2], [-9.5, 9.6, -2.7, 1.9]);
  for (let i = 0; i < 4; i++) {
    const xx = -7.3 + i * 4.5;
    strich(c, "rgba(97,63,38,.38)", .57, -.9 + i * .65, 4.1, [xx * .83, 12.6, xx, 19.5]);
    strich(c, "rgba(255,222,163,.31)", .35, xx, 24.7, [xx + .5, 26.3, xx - .1, 28]);
  }
  strich(c, "#603d2a", 1.45, -3.4, 2, [-.4, 3.1, 3.7, 1.5]);
  strich(c, "#e2b66d", .65, -3.5, 1.6, [-.5, 2.6, 3.5, 1.2]);
  strich(c, "#e7bf77", .7, 2, 2.1, [7.3, -1.3, 6.9, 2.2], [5.8, 4.9, 2, 2.1], [5.1, 5, 4.2, 9.1]);
  c.restore();
}

function krummstab(c: C, x: number, griffY: number, schritt: number, seite: boolean) {
  c.save(); c.translate(x, griffY); c.rotate(.034 + schritt * .052);
  if (seite) c.scale(-1, 1);
  const gold = seide(c, -2, -30, 4, 0, "#865b31", "#f0d397", "#b48a4c");
  strich(c, "#775535", 1.95, 0, -23, [0, 43.7]);
  strich(c, gold, 1.45, -.1, -23, [-.1, 43.3]);
  for (let j = 0; j < 6; j++) strich(c, "#745036", .66, -.68, j - 2, [.68, j - 2.6]);
  strich(c, "#ac8144", 2.05, 0, -22.4, [1.5, -29.3, -2.9, -32.1],
    [-8.8, -35.5, -10.9, -29.9], [-12.7, -24.9, -8.5, -23.7], [-5.1, -23.1, -5, -26.3]);
  strich(c, "#f9db91", .87, -.44, -22.7, [1, -29, -3.2, -31.8],
    [-8.4, -34.3, -10.4, -29.6], [-11.4, -25.6, -8.3, -24.7], [-5.9, -24.5, -5.5, -26.3]);
  flaeche(c, "#caa55d", -.2, -26.2, [4, -30.8, 3.4, -34.1], [0, -32.5, -.2, -27.8]);
  flaeche(c, "#e8cb83", -1, -30.1, [-1.7, -33.3, -4.2, -35.6], [-5, -32.7, -1, -30.1]);
  oval(c, "#486859", -5.1, -27.1, 1.05, 1.45, -.4);
  oval(c, "#fbdf9d", 0, -21.6, 1.6, .83);
  strich(c, "#c5a66f", 1.73, 0, 41.7, [0, 43.7]);
  c.restore();
}

function mantel(c: C, seite: boolean, hinten: boolean, falte: number) {
  const s = seite ? .82 : 1;
  c.save(); c.scale(s, 1);
  const weite = 17.5, w = falte * 1.1;
  const samt = seide(c, -19, -43, 37, 5, "#6a2339", "#a43b49", "#bb4a50", "#8b3040", "#5b2638");
  const gold = seide(c, -17, -12, 35, 2, "#b58b4a", "#edce88", "#bc9655", "#f0d59b");
  flaeche(c, "#aca79b", -8, -55, [9, -55], [12.7, -7.2], [5.2, -3.9, -3.1, -5.1], [-10, -4.5, -13, -6.4]);
  flaeche(c, seide(c, -11, -30, 24, 0, "#c6bfae", "#f6efda", "#dbd4bf", "#f2e7cd"), -8.5, -54,
    [8.8, -54], [9.1, -32, 12.8, -7.8], [5, -5, -1.5, -6.1], [-8, -5.5, -12.8, -7.2]);
  for (let i = -2; i <= 2; i++) {
    strich(c, "#beb5a1", .37, i * 2.7, -30, [i * 3.2 + .7, -17, i * 3.7, -8.8]);
  }
  flaeche(c, samt, -6.6, -58, [-14.1, -57, -15.4, -49], [-16.2, -29, -weite - 1 + w, -11.4],
    [-12.4 + w, -8.2, -7, -9.5], [1.6, -7.3, 7.8, -9], [14.3, -8.1, weite + w, -11],
    [14.5, -28.1, 13, -49.3], [12, -56.1, 6.7, -58]);
  flaeche(c, "rgba(75,21,44,.34)", -10.3, -49, [-9, -26, -14.4 + w, -10.6], [-9.7 + w, -9.2], [-5.8, -33, -7, -49]);
  flaeche(c, "rgba(222,107,101,.24)", 3, -48, [6.9, -33, 6.1 + w, -10.6], [11.1 + w, -11], [10.3, -37.5, 7.1, -49.9]);
  strich(c, gold, 1.2, -17.5 + w, -13.4, [-11.1 + w, -10.3, -6.8, -11.7], [0, -9.8, 7.6, -11.2], [13.3, -10.2, 17 + w, -13]);
  strich(c, "#e3b977", .38, -17.1 + w, -15.5, [-10.1, -12.5, -5.7, -13.7], [1, -12, 7.4, -13.6], [12.9, -12.7, 16.8 + w, -14.8]);
  for (let j = -3; j <= 3; j++) {
    const x = j * 4.5 + w, y = -14.1 - Math.abs(j) * .37;
    flaeche(c, "#c6a15d", x - 1.7, y - .9, [x - 1.8, y - 2.2, x -.1, y - .25], [x + .2, y + .25]);
    flaeche(c, "#e1bd79", x, y, [x + .5, y - 2, x + 2.1, y - 1.9], [x + 1.5, y -.4, x, y]);
  }
  if (!hinten) {
    const mitte = seite ? 7 : 0;
    flaeche(c, "#eee2c4", mitte - 1.3, -48.8, [mitte + 1.7, -48.8], [mitte + 6.8, -7.2],
      [mitte + .8, -5.6, mitte - 6.7, -7.1], [mitte - 2, -24, mitte - 1.3, -48.8]);
    for (const d of [-1, 1]) {
      strich(c, "#74383c", 2.8, mitte + d * 1.2, -48.8, [mitte + d * 2.5, -28.5, mitte + d * 6.4, -7.6]);
      strich(c, gold, 1.6, mitte + d * 1.15, -48.6, [mitte + d * 2.35, -28, mitte + d * 6.15, -8]);
    }
    for (let j = 0; j < 3; j++) stern(c, mitte + .3, -31 + j * 8.7, 1.12, "#bda36e");
  } else {
    strich(c, "#c5995b", .67, -1, -47, [-.5, -28, -1.3 + w, -16]);
    strich(c, "#e1bd74", .5, 1, -47, [1.7, -28.5, .9 + w, -16.2]);
  }
  flaeche(c, seide(c, -15, -61, 28, 22, "#c45555", "#a6434d", "#762e40"), -7.5, -59,
    [-16.2, -58, -17.8, -47.5], [-12, -44.6, -6.3, -47.3], [0, hinten ? -36.7 : -47.1, 7.9, -47.1],
    [13, -45.5, 16.5, -47.9], [13.4, -58.1, 6.2, -59.4]);
  strich(c, gold, .85, -17.3, -47.6, [-12.1, -45, -6.2, -47.6], [0, hinten ? -37.2 : -47.6, 8, -47.4], [13.3, -45.9, 16.4, -48.2]);
  if (hinten) {
    stern(c, 0, -47.4, 3.2, "#e9c176");
    oval(c, "#b1884e", .7, -40.3, .8, 2);
  } else {
    oval(c, "#efcf8b", seite ? 7.9 : 0, -50.9, 2.2, 2.1);
    oval(c, "#476658", seite ? 7.9 : 0, -50.9, 1.1, 1.15);
  }
  c.restore();
}

function arm(c: C, sx: number, sy: number, hx: number, hy: number, hinten: boolean, stab: boolean) {
  const dx = hx - sx, dy = hy - sy, laenge = Math.hypot(dx, dy);
  c.save(); c.translate(sx, sy); c.rotate(Math.atan2(dy, dx) - Math.PI / 2);
  const rot = seide(c, -4, 0, 8.5, 0, "#782f3f", "#b34a50", "#923848");
  flaeche(c, rot, -2.8, -.8, [-5.6, 2.4, -4.3, laenge - 2.7], [0, laenge - 1.2, 3.8, laenge - 2.9],
    [4.3, 3.7, 2.9, .1], [0, -2.4, -2.8, -.8]);
  flaeche(c, "#e6dac1", -4.2, laenge - 4.1, [0, laenge - 2.2, 3.9, laenge - 4.1],
    [3.7, laenge - 1.2], [0, laenge + .2, -3.9, laenge - 1.3]);
  strich(c, "#c6a263", .7, -4, laenge - 4.7, [0, laenge - 2.9, 3.9, laenge - 4.7]);
  c.restore();
  oval(c, "#bba994", hx, hy + .4, 2.55, stab ? 2 : 2.6, dx * -.018);
  oval(c, "#f0e5d0", hx -.18, hy, 2.4, stab ? 1.87 : 2.5, dx * -.018);
  oval(c, "#e8d8bc", hx + (stab ? 1.8 : -1.7), hy - .6, 1.03, 1.6, stab ? -.28 : .35);
  for (let j = -1; j <= 1; j++) strich(c, "#c9bba7", .28, hx - 1.1, hy + j * .74, [hx + .2, hy + j * .66 + .25, hx + 1.2, hy + j * .67]);
  if (!hinten && !stab) {
    oval(c, "#bd9853", hx + .7, hy - .1, .86, .63);
    oval(c, "#89434d", hx + .7, hy - .12, .43, .38);
  }
}

function mitra(c: C, seite: boolean, hinten: boolean, t: number) {
  const s = seite ? .82 : 1;
  c.save(); c.scale(s, 1);
  if (seite || hinten) {
    for (const d of [-1, 1]) {
      const x = seite ? -7 + d * 1.7 : d * 5.1, w = Math.sin(t * 2.2 + d) * .64;
      flaeche(c, "#dec58a", x - 1.7, -73, [x + 1.7, -73], [x + d * 2.4 + w, -61.6, x + d * 3.6 + w, -52.1],
        [x + d * 3.5 - 2.6 + w, -52.7], [x - 1.9, -62.1, x - 1.7, -73]);
      strich(c, "#a57a45", .52, x, -71, [x + d, -61, x + d * 3 - .6 + w, -53.3]);
    }
  }
  flaeche(c, "#7d3041", -9, -72.2, [-11.2, -85, -6.6, -90.7], [-2.5, -89.9, 6.7, -78], [9.1, -72.8]);
  const rouge = seide(c, -10, -81, 21, 4, "#b94950", "#c9655b", "#a43a48", "#7d2d40");
  const pointe = seite ? 3.7 : .3;
  flaeche(c, rouge, -10.2, -73, [-11.6, -78.5, -10, -83.5], [-6.2, -89, pointe, -94],
    [7, -89.4, 10.1, -82.3], [10.5, -77.3, 9.5, -72.8], [-.5, -69.5, -10.2, -73]);
  strich(c, "#e8c179", .75, -10.3, -74, [-11.1, -79.2, -9.4, -83.4], [-5.4, -89.2, pointe, -93.5],
    [6.8, -89, 9.6, -82.2], [10.2, -77.6, 9.2, -73.1]);
  flaeche(c, "#d6af66", -10.2, -76.6, [-.5, -73.9, 9.9, -76.4], [9.5, -72.8], [-.2, -69.9, -10, -73]);
  strich(c, "#fff0bd", .43, -9.8, -73.2, [0, -70.6, 9.3, -73.2]);
  if (!hinten) {
    const xx = seite ? 3 : .2;
    strich(c, "#a37e42", 2.1, xx, -88.3, [xx, -77]);
    strich(c, "#efd58c", 1.35, xx - .2, -88.3, [xx - .2, -77.5]);
    strich(c, "#efd58c", 1.45, xx - 3, -83.9, [xx + 2.8, -83.9]);
    oval(c, "#668779", xx, -74.2, 1.35, 1.45);
    oval(c, "#f8e3ad", xx - .34, -74.5, .36, .46);
    for (const j of [-2, -1, 1, 2]) oval(c, "#ffe8b4", xx * .25 + j * 3.35, -73.65 - Math.abs(j) * .34, .47, .52);
    for (const d of [-1, 1]) {
      strich(c, "#cb9a69", .37, d * 6.4, -77.5, [d * 7.9, -81.2, d * 6.2, -84.2]);
      oval(c, "#ddb87c", d * 6.9, -80.4, .48, 1.28, d * .42);
      oval(c, "#e9c88c", d * 7.05, -83, .45, 1.06, -d * .38);
    }
  } else {
    strich(c, "#c9a064", 1.1, pointe, -92.3, [0, -80.3, -.3, -74]);
    for (const d of [-1, 1]) stern(c, 5.4 * d, -79.3, 1.4, "#d0ae6c");
  }
  c.restore();
}

function kopf(c: C, seite: boolean, hinten: boolean, t: number) {
  const haar = seide(c, -12, -71, 21, 18, "#eee7ce", "#dad8c8", "#b4bab1");
  flaeche(c, haar, -8.5, -72.6, [-13.1, -69.1, -10.8, -63.5], [-13.5, -60.8, -10.9, -58.4],
    [-13.2, -55.3, -9, -54.2], [-8.5, -50.7, -4.3, -52.4], [.8, -49.2, 4.1, -52.5],
    [9.3, -50.7, 9.8, -55.1], [13.3, -55.2, 10.8, -60], [13.1, -65.8, 9.1, -71.7]);
  if (hinten) {
    for (let i = 0; i < 7; i++) {
      const xx = -9 + 2.9 * i, yy = -64.4 + Math.sin(i) * 2;
      strich(c, "#b2b7af", .54, xx, yy, [xx - 1.9, yy + 3.8, xx + .7, yy + 6.1], [xx + 1.4, yy + 8.8, xx - .1, yy + 9.2]);
      strich(c, "#f2eddd", .57, xx + .9, yy -.5, [xx -.6, yy + 2.6, xx + 1.7, yy + 5]);
    }
    mitra(c, seite, true, t); return;
  }
  const peau = seide(c, -9, -72, 17, 16, "#dca883", "#f2c8a3", "#e9b18b", "#d19777");
  const barbe = seide(c, -9, -64, 18, 25, "#f6edd6", "#e7e5d7", "#d0d5ca", "#b3bcb3");
  const ferme = t % 5.2 > 5.02 || (t > 7 && t % 13.4 > 13.27);
  if (seite) {
    flaeche(c, peau, -4.6, -72.2, [4.4, -76.5, 8.5, -70], [10.1, -66.9, 9.2, -65.8],
      [14.9, -63, 12.6, -61.1], [11.1, -60, 9.5, -60.3], [9.8, -55.4, 4.5, -54], [-5.6, -53.8, -6.9, -63.6]);
    oval(c, "#d99880", 6.2, -61.9, 2.9, 1.5, -.2);
    oval(c, "#f2c3a1", -4.9, -64.2, 2.4, 3.5, -.1);
    strich(c, "#c68e73", .6, -5.5, -65.9, [-2.7, -66.4, -4.3, -63]);
    flaeche(c, barbe, -2.8, -63.8, [-2, -59, 1.6, -59.7], [6.3, -61.3, 10.1, -60.8],
      [12.7, -57.9, 10.8, -54.7], [13.1, -51.4, 9.9, -48.5], [10.5, -43.7, 6.7, -41.3],
      [7.9, -44.6, 5.4, -46.1], [2, -42.8, 1.1, -46.1], [-3.7, -46.5, -3.4, -51.3],
      [-7.4, -52.3, -5.9, -56.7], [-8.4, -61.2, -5.5, -63.7]);
    strich(c, "#e8dfc8", 1.48, 4.2, -68.3, [6.5, -69.7, 8.1, -68.3]);
    if (!ferme) { oval(c, "#473d35", 7, -66.1, .91, 1.18); oval(c, "#f9f3db", 7.31, -66.48, .29, .35); }
    else strich(c, "#635044", .52, 5.8, -65.8, [6.9, -65.2, 8.1, -66]);
    strich(c, "#a4916c", .43, -3.4, -66.3, [5.2, -64.9]);
    c.beginPath(); c.ellipse(7.3, -64.7, 2.5, 1.92, -.16, 0, TAU); c.strokeStyle = "#a18a5c"; c.lineWidth = .46; c.stroke();
    flaeche(c, "#f9efd9", 10.2, -61.1, [8.4, -61.9, 6.5, -60], [4.7, -58.9, 3.9, -59.9],
      [4.7, -56.9, 8.9, -58], [10.9, -58.6, 11.2, -59.7]);
    strich(c, "#9b7970", .53, 8.7, -57.6, [10.1, -57.3, 10.8, -58]);
  } else {
    oval(c, peau, 0, -66, 9.5, 10.4);
    for (const d of [-1, 1]) {
      oval(c, "#daa385", d * 9.1, -64.8, 1.8, 2.7);
      oval(c, "#e3a58c", d * 5.5, -62, 2.85, 1.65, d * .15);
      strich(c, "#ebe2ca", 1.67, d * 1.8, -68.1, [d * 4.2, -70.3, d * 6.7, -68.6]);
      if (!ferme) { oval(c, "#493e37", d * 4.1, -66.1, .91, 1.17); oval(c, "#fff6df", d * 4.1 + .26, -66.48, .3, .35); }
      else strich(c, "#6b5443", .53, d * 2.7, -65.8, [d * 4.1, -65.2, d * 5.5, -65.9]);
      c.beginPath(); c.ellipse(d * 4.4, -64.9, 3.1, 2, d * .1, 0, TAU); c.strokeStyle = "#9d895f"; c.lineWidth = .43; c.stroke();
    }
    strich(c, "#a58b61", .47, -1.5, -65, [.1, -65.9, 1.5, -65]);
    flaeche(c, barbe, -9.4, -64.7, [-7.8, -63.1, -6.8, -60.7], [-3.9, -61.8, 0, -60.4],
      [3.9, -61.7, 7.1, -60.8], [9, -62.1, 9.6, -64], [12.2, -60.8, 10.3, -57.6],
      [13.5, -54.9, 10.1, -52.6], [10.8, -48.9, 7.7, -48.5], [8.2, -44.4, 4.1, -44.1],
      [3.1, -40.6, -.5, -39.7], [.9, -42.4, -.6, -43.4], [-5.9, -41.2, -6.7, -46.4],
      [-11.2, -45.7, -10.1, -51], [-13, -51.9, -11.4, -55.3], [-13.1, -58.3, -10.3, -60.8]);
    strich(c, "#a37e70", .8, -2.3, -57.2, [.2, -55.7, 2.9, -57.5]);
    for (const d of [-1, 1]) flaeche(c, "#faf2df", d * .25, -60.8, [d * 3.4, -63.9, d * 5.9, -60.8],
      [d * 7.6, -59.3, d * 9, -60.6], [d * 8.6, -56.4, d * 4.1, -57.5], [d * 1.6, -58.1, d * .25, -60.8]);
    oval(c, "#d79478", .1, -62.6, 2.86, 1.92);
    oval(c, "#efbb96", -.25, -63.1, 2.43, 1.77);
    oval(c, "#f9d2ae", -.8, -63.6, 1, .5);
  }
  for (let i = 0; i < 5; i++) {
    const xx = (seite ? -2.9 : -7.6) + i * (seite ? 2.48 : 3.6), yy = -55.4 + Math.sin(i * 1.6) * 1.8;
    const bogen = 1.2 + .65 * Math.cos(i * 2.1), laenge = 6.1 + 1.8 * Math.sin(i * 1.24);
    strich(c, "#bdc5b9", .44, xx, yy, [xx - bogen, yy + 2.2, xx + .3, yy + 4.1], [xx + bogen, yy + 6.1, xx - .3, yy + laenge]);
    strich(c, "#f8f0dd", .54, xx + .9, yy + .1, [xx -.25, yy + 2.5, xx + 1.4, yy + 4.1]);
  }
  mitra(c, seite, false, t);
}

export interface NikolausBild {
  ansicht: NikolausAnsicht;
  pose: NikolausPose;
  zeit: number;
  skala: number;
}

export function zeichneNikolaus(c: C, x: number, y: number, bild: NikolausBild) {
  const { ansicht, pose, zeit: t, skala } = bild;
  const seite = ansicht === "links" || ansicht === "rechts", hinten = ansicht === "hinten";
  const gehen = pose === "gehen", w = gehen ? Math.sin(t * 5.1) : 0;
  const gruss = pose === "gruessen" ? .5 - .5 * Math.cos(t * 1.55) : 0;
  c.save(); c.translate(x, y); c.scale(skala, skala); c.lineJoin = "round"; c.lineCap = "round";
  oval(c, "rgba(32,34,40,.15)", .5, .15, seite ? 13.8 : 16, 2.6);
  oval(c, "rgba(32,29,34,.13)", 0, -.15, 9.9, 1.3);
  if (ansicht === "links" || hinten) c.scale(-1, 1);
  for (const d of [-1, 1]) stiefel(c, (seite ? d * 1.7 : d * 5.3) + (seite ? w * d * 5.5 : 0),
    Math.max(0, d * w) * (seite ? 2.5 : 2), d * w, seite, hinten);
  const atem = Math.sin(t * 1.65) * .18, hub = gehen ? Math.abs(Math.cos(t * 5.1)) * .82 : 0;
  c.translate(0, -hub + atem);
  const sackVorn = ansicht === "links";
  if (!hinten && !sackVorn) sack(c, seite ? -8.9 : 11.7, -53.7, seite ? .75 : .67, .15 + w * .045);
  const griffX = (seite ? 14.7 : -19.4) - w * 1.5, griffY = -44.3 - Math.max(0, w) * 1.9;
  krummstab(c, griffX, griffY, w, seite);
  if (sackVorn) arm(c, 5.5, -51.6, griffX, griffY, false, true);
  mantel(c, seite, hinten, w);
  if (sackVorn) {
    // Im linken Profil liegt die Sackseite vorn, der Stabarm hinter dem Mantel.
    strich(c, "#ab8558", 1.55, 1.3, -55.3, [-5.1, -52.9, -8.9, -46.7]);
    sack(c, -9.3, -48.8, .76, .15 + w * .045);
  } else arm(c, seite ? 5.5 : -12, -51.6, griffX, griffY, hinten, true);
  const hx = seite ? 3.1 + w * 4.8 + gruss * 13 : 14.8 + gruss * 5.4;
  const hy = -35.8 + (gehen ? w * .9 : 0) - gruss * 18.5;
  arm(c, seite ? -.9 : 11, -51.5, hx, hy, hinten, false);
  if (hinten) {
    strich(c, "#815c3c", 1.3, 6.9, -56.4, [1.1, -53.4, -6.1, -51.9]);
    strich(c, "#d6b986", .45, 6.9, -56.8, [1.1, -53.8, -6.1, -52.3]);
    sack(c, -6.8, -53, .83, -.18 + w * .045);
  }
  c.save(); c.translate(0, -57); c.rotate((seite ? .042 : .018) * gruss + w * .012); c.translate(0, 57 + gruss * .55);
  kopf(c, seite, hinten, t); c.restore(); c.restore();
}