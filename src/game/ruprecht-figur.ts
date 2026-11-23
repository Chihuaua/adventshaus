/** Ruprechts Figurenblatt und sein Besuch benutzen dieselbe Zeichnung mit den Sohlen als Ursprung. */
import type { NikolausBild } from "./nikolaus-figur";

export const RUPRECHT_HOEHE = 84;
type C = CanvasRenderingContext2D;
type Farbe = string | CanvasGradient;
type Zug = [number, number] | [number, number, number, number] | [number, number, number, number, number, number];
const KREIS = Math.PI * 2;

function pfad(c: C, x: number, y: number, zuege: Zug[]) {
  c.beginPath(); c.moveTo(x, y);
  for (const z of zuege) {
    if (z.length === 2) c.lineTo(...z);
    else if (z.length === 4) c.quadraticCurveTo(...z);
    else c.bezierCurveTo(...z);
  }
}
function stoff(c: C, f: Farbe, x: number, y: number, ...z: Zug[]) {
  pfad(c, x, y, z); c.closePath(); c.fillStyle = f; c.fill();
}
function faden(c: C, f: Farbe, dicke: number, x: number, y: number, ...z: Zug[]) {
  pfad(c, x, y, z); c.strokeStyle = f; c.lineWidth = dicke; c.stroke();
}
function oval(c: C, f: Farbe, x: number, y: number, rx: number, ry: number, winkel = 0) {
  c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, winkel, 0, KREIS); c.fill();
}
function licht(c: C, x: number, y: number, dx: number, dy: number, ...farben: string[]) {
  const g = c.createLinearGradient(x, y, x + dx, y + dy);
  farben.forEach((f, i) => g.addColorStop(i / (farben.length - 1), f)); return g;
}

function schuh(c: C, x: number, hub: number, schritt: number, profil: boolean, hinten: boolean) {
  c.save(); c.translate(x, -hub); c.rotate(schritt * .052);
  const vorn = profil ? 7.8 : hinten ? 3.1 : 5.3;
  stoff(c, "#45473d", -3.6, -22, [3.2, -22], [3.6, -9.9], [-3.2, -9.3]);
  const leder = licht(c, -4, -9, 11, 3, "#3a302a", "#785842", "#534034");
  stoff(c, leder, -3.4, -14.2, [.4, -13.4, 3.8, -14.9], [2.8, -8.5, 3.2, -5.3],
    [5, -4.1, vorn, -3.6], [vorn + 1.3, -2.5, vorn + .7, -.9], [3, .1, -3.8, -.3], [-4.1, -1.9, -3.6, -4]);
  stoff(c, "#a18b6e", -3.8, -15.4, [-.4, -14.7, 3.9, -15.7], [4.4, -12.8], [1, -11.5, -3.9, -12.5]);
  for (let i = 0; i < 3; i++) {
    faden(c, "#c0ad85", .48, -2.2, -13.4 + i * 2.9, [1.9, -14.1 + i * 2.9]);
    if (!hinten) faden(c, "#b09a72", .45, 1.9, -13.5 + i * 2.9, [-1.9, -12.5 + i * 2.9]);
  }
  faden(c, "#b29873", .62, -3.4, -1.15, [.5, -.6, vorn + .4, -1.45]);
  faden(c, "#a18061", .42, .5, -5.2, [3.3, -5.3, vorn - .4, -3.6]);
  c.restore();
}

function wanderstab(c: C, x: number, y: number, w: number, boden: number) {
  c.save(); c.translate(x, y); c.rotate(-.044 + w * .066);
  const ende = boden - y;
  const holz = licht(c, -1.6, -17, 3.6, 0, "#64442f", "#b48755", "#9c7046", "#654631");
  stoff(c, holz, -1.5, -24.7, [-2.8, -19, -1.3, -15.8], [-1.7, -7.3, -1, 1.1],
    [-.3, 10.2, -.9, 20], [-1, 27, .3, ende - .7], [1.4, ende + .4, 2.05, ende - .65],
    [1.5, 28.9, 1.65, 20.1], [2.6, 10.7, 1.3, .5], [1, -12.5, 1.5, -20.8], [2.7, -24.2, 1.1, -25.4]);
  faden(c, "#d3b37b", .48, -.6, -19.3, [-1, -11.1, -.1, -6.5]);
  faden(c, "#c69c66", .38, .1, 7.3, [1.3, 15.5, .6, 24.9], [.2, 29.8, 1.2, ende - 3]);
  oval(c, "#785236", .2, 14.2, .85, 2.2, -.08);
  faden(c, "#d4b17b", .35, -.2, 12.5, [1.1, 13.9, .1, 15.5]);
  for (let j = 0; j < 8; j++) faden(c, j % 2 ? "#9c805a" : "#786044", .78, -1.25, -4.8 + j * .83, [1.38, -5.4 + j * .83]);
  // Ein kleiner geschnitzter Zaunkoenig bildet den abgeriebenen Griffabschluss.
  stoff(c, "#976a43", -1.1, -24, [-3.3, -24.3, -4.4, -26.3], [-7.2, -30.4],
    [-3.8, -29.5, -2.2, -28.1], [-.9, -30.6, 1.1, -30], [1.4, -32.6, 3.9, -32.3],
    [6, -31.9, 5.8, -29.6], [7.7, -28.9], [5.55, -28.65], [5.5, -25.8, 2.4, -24.5]);
  stoff(c, "#c59b67", -2.3, -27.3, [-.4, -29.6, 2.6, -28.2], [1.4, -26.1, -1.3, -25.8]);
  faden(c, "#dfc08d", .41, -1.25, -26.5, [.5, -27, 1.9, -28.2]);
  oval(c, "#463b2c", 4.2, -30.45, .42, .46);
  faden(c, "#ad8d62", .72, -1.7, -23.2, [-.2, -22.4, 1.5, -23.2]);
  c.restore();
}

function beutel(c: C, x: number, y: number, mass: number, pendel: number, fein: boolean) {
  c.save(); c.translate(x, y); c.rotate(pendel); c.scale(mass, mass);
  // Apfel, Tannenspitze und die schmale Webkante sind auch von hinten zu erkennen.
  faden(c, "#735b3f", .73, 1, 2.4, [4.5, -5.3, 6.1, -12.2]);
  for (let i = 0; i < 6; i++) {
    const xx = 5.6 - i * .61, yy = -10.3 + 1.78 * i;
    faden(c, "#445c49", .78, xx - .3, yy + 1.7, [xx - 1.5, yy + .5, xx - 2.1 - i * .14, yy - 2.1]);
    faden(c, "#70846a", .69, xx - .3, yy + 1.3, [xx + 2, yy - .2, xx + 2.5 + i * .13, yy - 1.9]);
  }
  oval(c, "#ae5644", -2.5, -1.4, 3.6, 3.7, -.15);
  oval(c, "#cb7c5b", -3.7, -2.4, 1.3, 1.9, .5);
  faden(c, "#68503b", .72, -2.4, -4.5, [-2.6, -6.6, -1.25, -7.4]);
  stoff(c, "#64724f", -2, -5.9, [-5.6, -8.6, -7.5, -6.7], [-5.9, -4.9, -2, -5.9]);
  const leinen = licht(c, -14, 6, 28, 6, "#806144", "#c09b69", "#d4b784", "#b09266", "#735b42");
  stoff(c, leinen, -3.1, 3.2, [-6.9, 1.7, -8.3, -2.6], [-5.8, -3.9, -3.6, -.9],
    [-.2, -2.7, 1.4, -.3], [5.8, -3.8, 7.2, -2.3], [6.4, .4, 3.5, 3.25],
    [7, 9.9, 12.5, 17.2], [18, 26, 13.1, 33.6], [6, 39.2, -8.3, 36.4],
    [-17, 35.8, -15.1, 25.2], [-14.1, 14.6, -8.1, 9.1], [-4.6, 5.5, -3.1, 3.2]);
  for (let i = 0; i < 5; i++) {
    const dx = i * 4.8 - 10;
    faden(c, "rgba(103,75,44,.33)", .67, (i - 2) * .9, 5, [dx * .77, 12, dx, 20 + (i % 2) * 3.3]);
  }
  if (fein) {
    for (let i = 0; i < 32; i++) {
      const px = -10.6 + ((i * 37) % 23) * .97, py = 17.6 + ((i * 7) % 17) * .9;
      faden(c, i % 2 ? "rgba(248,222,166,.35)" : "rgba(103,79,53,.24)", .27, px, py, [px + .2, py + .8]);
    }
    for (let j = 0; j < 3; j++) faden(c, j === 1 ? "#ba7960" : "#8d6352", j === 1 ? 1.4 : .4,
      -14.4, 27.8 + j * 1.2, [-3.7, 32.6 + j, 14.25, 28.9 + j * .6]);
    faden(c, "#e0c18d", .5, -9.4, 25.2, [-6.4, 20.8, -3.9, 19.6]);
    for (let i = 0; i < 3; i++) {
      const dx = -8.3 + i * 1.45, dy = 23.5 - i * 1.8;
      faden(c, "#e7cd9e", .53, dx, dy, [dx - 1.9, dy - .4, dx - 2, dy - 2.4]);
      faden(c, "#ddd09c", .5, dx, dy, [dx + 2.1, dy, dx + 2.7, dy - 1.6]);
    }
  }
  faden(c, "#735238", 1.55, -4.2, 3, [-1.2, 4.6, 4.5, 2.65]);
  faden(c, "#d8bc89", .74, -4.2, 2.7, [-.5, 4, 4.5, 2.35]);
  faden(c, "#b0956c", .8, 3.7, 3, [9.7, -.8, 7.6, 3.6], [6.2, 5.7, 3.7, 3],
    [5, 6.2, 6.45, 8.1], [6.9, 9, 6.3, 11.2]);
  c.restore();
}

function flicken(c: C, x: number, y: number, s: number) {
  c.save(); c.translate(x, y); c.rotate(-.25); c.scale(s, s);
  stoff(c, "#8c6c4d", -2.4, -3.7, [.5, -4.6, 2.2, -2.9], [4.1, .3, 2.45, 3.4],
    [-.3, 4.7, -2.7, 2.4], [-3.4, -.1, -2.4, -3.7]);
  for (let i = 0; i < 11; i++) {
    const a = i * KREIS / 11 + .14, b = a + .19;
    faden(c, "#dac095", .38, 2.52 * Math.cos(a), 3.57 * Math.sin(a), [2.52 * Math.cos(b), 3.57 * Math.sin(b)]);
  }
  faden(c, "#ac8864", .37, -.9, -2.1, [.1, -.3, 1.23, .9]); c.restore();
}

function rock(c: C, seite: boolean, hinten: boolean, w: number, fein: boolean) {
  c.save(); c.scale(seite ? .86 : 1, 1);
  const zipfel = w * 1.47;
  const wolle = licht(c, -18, -41, 36, 8, "#48483b", "#77735a", "#968b68", "#726951", "#45473c");
  stoff(c, "#514637", -9.2, -49, [9.7, -49], [15.9 + zipfel, -15.8], [6, -13.2, .5, -14.6],
    [-6.4, -13.8, -15.4 + zipfel, -16.4]);
  stoff(c, wolle, -5.7, -56.4, [-13.1, -56, -15.1, -50.1], [-17.1, -43.9, -13.5, -34],
    [-14.9, -25.5, -17.9 + zipfel, -17.3], [-13.9, -15, -8.3, -15.55],
    [-.7, -12.4, 6.1, -14.8], [12.6, -13.4, 17.9 + zipfel, -16.6],
    [14.1, -26.7, 12.7, -34.8], [16.9, -47.7, 11.5, -53.8], [7.8, -57.8, -5.7, -56.4]);
  stoff(c, "rgba(42,42,32,.22)", -11.5, -38.4, [-10.1, -29, -14.7 + zipfel, -16.9], [-9.1, -16.2], [-6.5, -29.4, -8.7, -37.9]);
  stoff(c, "rgba(205,190,145,.18)", .7, -36.4, [5.8, -27.7, 4.7 + zipfel, -15.5], [9.7 + zipfel, -16.1], [7.2, -26.8, 5.7, -36.1]);
  faden(c, "#b1a07a", .81, -17.2 + zipfel, -18.85, [-11.6, -16.3, -7.4, -17.3],
    [-.9, -14.6, 5.95, -16.8], [12.7, -15.3, 17.2 + zipfel, -18.2]);
  faden(c, "#4d503f", .47, -16.6 + zipfel, -20.7, [-10.1, -18.1, -7.2, -19],
    [0, -16.5, 6.1, -18.7], [13.2, -17.1, 16.8 + zipfel, -20]);
  if (fein) {
    for (let i = -5; i <= 5; i++) {
      const x = i * 2.78 + zipfel, y = -17.25 - Math.abs(i) * .29;
      faden(c, i % 2 ? "#d0b991" : "#a17b57", .43, x - .6, y - .65, [x + .55, y + .15]);
    }
    for (let i = 0; i < 24; i++) {
      const x = -11.6 + (i * 43 % 25) * .95, y = -44 + (i * 19 % 23);
      faden(c, "rgba(231,220,179,.15)", .32, x, y, [x + .36, y + 1.14]);
    }
  }
  const mitte = seite ? 7.2 : .4;
  if (!hinten) {
    faden(c, "#4d4b3c", 1.04, mitte, -46, [mitte + 1.8, -33.3, mitte + 2.8 + zipfel, -15.3]);
    faden(c, "#b2a382", .4, mitte - .9, -44, [mitte + .9, -31, mitte + 1.9 + zipfel, -15.9]);
    for (let i = 0; i < 3; i++) {
      const xx = mitte + (i + 1) * .58, yy = -43 + i * 7.65;
      oval(c, "#685039", xx, yy, 1.06, 1.12); oval(c, "#c8ab75", xx - .2, yy - .22, .8, .79);
      faden(c, "#796649", .28, xx - .39, yy - .57, [xx + .19, yy + .05]);
    }
  } else {
    faden(c, "#555747", .68, -.4, -48, [1, -35, .1 + zipfel, -16.8]);
  }
  stoff(c, "#594433", -14.25, -36.9, [-.2, -34.9, 13.9, -37.7], [13.5, -34.1], [-.5, -31.1, -14.2, -33.7]);
  faden(c, "#ab8965", .48, -13.6, -36.45, [0, -34.6, 13.3, -37.2]);
  if (!hinten) {
    const bx = mitte + 1.2;
    faden(c, "#ceb277", .88, bx - 2, -35.7, [bx + 2, -35.9], [bx + 2, -32.75], [bx - 2, -32.5], [bx - 2, -35.7]);
    faden(c, "#d4ba83", .55, bx - .2, -34.1, [bx + 2.4, -34.4]);
    if (!seite) {
      stoff(c, "#74553c", -12.2, -34.2, [-8, -34.2], [-6.4, -27.4, -9.1, -26.8], [-14.7, -25.9, -14.2, -29.7]);
      stoff(c, "#9a7854", -13.4, -33.7, [-7.9, -33.5], [-7.4, -30.7, -10.2, -30.1], [-14.1, -29.7, -13.4, -33.7]);
      oval(c, "#d7b681", -10.55, -30.9, .6, .62);
    }
  }
  const cape = licht(c, -16, -55, 31, 11, "#59624e", "#81866a", "#69745c", "#484f42");
  stoff(c, cape, -7.2, -58.5, [-15, -57.9, -19, -46.1], [-14, -43.1, -8.8, -44.8],
    [-5.3, -42.4, -1.8, -43.8], [1.2, hinten ? -39.8 : -46.8, 7.9, -45.7], [14.9, -44.6, 17.5, -47.2],
    [14.3, -56.1, 7.4, -58.3]);
  faden(c, "#b0a886", .7, -18.2, -46.3, [-13.9, -44.4, -8.8, -45.6], [-4.8, -43.1, -1.7, -44.6],
    [1.9, hinten ? -40.8 : -47.2, 7.9, -46.5], [14.6, -45.4, 17.1, -47.6]);
  c.restore();
}

function arm(c: C, sx: number, sy: number, ex: number, ey: number, hx: number, hy: number, naht: boolean, griff: boolean) {
  const aermel = (x: number, y: number, xx: number, yy: number, r: number, ende: number) => {
    const l = Math.hypot(xx - x, yy - y);
    c.save(); c.translate(x, y); c.rotate(Math.atan2(yy - y, xx - x) - Math.PI / 2);
    const wolle = licht(c, -r, 0, 2 * r, 2, "#515341", "#90876a", "#716b51");
    stoff(c, wolle, -r, .45, [-r, -r * .85, 0, -r * .88], [r, -r * .68, r, .5],
      [r + .2, l * .45, ende, l], [0, l + ende * .65, -ende, l], [-r -.45, l * .4, -r, .45]);
    c.restore();
  };
  aermel(sx, sy, ex, ey, 3.9, 3.6); aermel(ex, ey, hx, hy - .8, 3.65, 2.65);
  if (naht) flicken(c, ex + .15, ey -.15, .93);
  const winkel = Math.atan2(hy - ey, hx - ex) - Math.PI / 2;
  c.save(); c.translate(hx, hy); c.rotate(winkel);
  stoff(c, "#574c3e", -3, -4.4, [-.5, -3.8, 2.9, -4.7], [2.9, -1.3], [-.8, -.2, -3, -1.3]);
  for (let i = -2; i <= 2; i++) faden(c, "#9c886a", .34, i, -3.9, [i + .3, -1.6]);
  oval(c, "#88694e", 0, 0, 2.55, 2.6); oval(c, "#be9873", -.55, -.15, 1.65, 2.25);
  for (let i = 0; i < 3; i++) {
    oval(c, "#dfb090", -1.23 + 1.22 * i, griff ? .21 : 1.45, .8, griff ? 1.75 : 1.63, -.27 + i * .18);
  }
  oval(c, "#cc9b7a", griff ? 1.85 : -1.9, -1.04, .94, 1.72, griff ? -.69 : .51);
  c.restore();
}

function kapuze(c: C, profil: boolean, hinten: boolean, schwung: number, fein: boolean) {
  const hintenX = profil ? -16.3 : -12.7;
  const g = licht(c, -16, -79, 29, 18, "#838870", "#969780", "#69775f", "#475746");
  stoff(c, g, -12, -55.5, [-15.8, -59.8, -13.4, -67.8], [hintenX - 2, -69.7, hintenX - 4.2, -68.5 + schwung],
    [hintenX - 4.5, -74.7, -12.2, -78.6], [-8.5, -83.9, -2.7, -83.6], [4.5, -84.1, 9.8, -77.4],
    [14.4, -71.9, 12.5, -64.9], [12.7, -58, 8.8, -54.9], [1.1, -51, -12, -55.5]);
  stoff(c, "rgba(55,68,52,.26)", hintenX - 3.9, -68.9 + schwung, [hintenX + .9, -76.5, -9.7, -76.8],
    [-13, -71.6, -12.4, -65.4], [-15.3, -70.5, hintenX - 3.9, -68.9 + schwung]);
  faden(c, "#a9ad91", .62, hintenX - 2, -73, [-9.6, -81.7, -2.6, -82.6], [4.4, -83.1, 9, -77.4]);
  if (hinten) {
    stoff(c, "#61715b", -11, -67.1, [-6.9, -71.3, -4.8, -78.4], [-5.6, -65.3, 2.2, -57.9],
      [5.8, -52.4, 3.3, -48.5], [-5.9, -50.2, -9.7, -54.3], [-14.1, -61.5, -11, -67.1]);
    faden(c, "#52624d", .85, -.7, -82, [-1.2, -74.8, -4.1, -70.2], [-7.4, -62, 2.65, -50.1]);
    faden(c, "#a4a78b", .48, .15, -81.4, [-.2, -73.9, -3.35, -69.9], [-6.5, -61.7, 3.35, -50.2]);
    for (let i = 0; i < 7 && fein; i++) {
      const yy = -76 + i * 3.05, xx = -1.9 - 2.2 * Math.sin(i / 6 * Math.PI);
      faden(c, "#c1b99a", .37, xx, yy, [xx + .75, yy + .69]);
    }
    faden(c, "#c3b695", .85, -12.4, -58, [-8.3, -51.3, 3.2, -48.9], [9.7, -53, 11.7, -57.1]);
  }
}

function gesicht(c: C, profil: boolean, hinten: boolean, t: number, schwung: number, fein: boolean) {
  kapuze(c, profil, hinten, schwung, fein);
  if (hinten) return;
  const haut = licht(c, -7, -75, 18, 14, "#c79c7b", "#f0c5a1", "#dcad8d", "#c08f72");
  const bart = licht(c, -9, -63, 18, 20, "#777368", "#a29b8a", "#8f8a7e", "#686d64");
  const blinzelt = (t + .7) % 4.73 < .135;
  if (profil) {
    stoff(c, "#584c3d", -6.5, -70, [-3.3, -79, 5.1, -76.4], [10.5, -74.8, 11.6, -69.8],
      [8.15, -63.7, 4.1, -56.1], [-5.6, -53.8, -8.5, -59.2]);
    stoff(c, haut, -3.9, -72, [1.1, -76.4, 6.7, -73.3], [10.5, -71.4, 9.95, -67.7],
      [10.2, -66.8, 13.3, -64.9], [15, -62.8, 12.7, -61.9], [11.2, -61.1, 9.7, -61.8],
      [10.25, -55.5, 5.7, -54.5], [-4.1, -53.9, -5.4, -63.5]);
    oval(c, "#d49b83", 6.35, -63.9, 2.5, 1.59, -.18);
    oval(c, "#dfa98a", -4.6, -65.4, 2.35, 3.15, -.15);
    faden(c, "#ba876a", .56, -5.65, -66.4, [-3.5, -67.4, -3.9, -64.6]);
    faden(c, "#66594b", 1.18, 4.3, -70.35, [6.4, -71.9, 8.9, -70.3]);
    if (blinzelt) faden(c, "#624d41", .53, 5.55, -67.9, [7.1, -67.2, 8.2, -68]);
    else { oval(c, "#524537", 7.2, -68.1, .99, 1.12); oval(c, "#fcf2d7", 7.5, -68.49, .33, .34); }
    faden(c, "#ba967c", .39, 7.45, -65.95, [8.7, -66.3, 9.3, -66.9]);
    stoff(c, bart, -3.1, -65.6, [-1.8, -61.1, 1.4, -60.8], [5.1, -62.2, 8.4, -60.1],
      [10.4, -61.3, 11.1, -59.9], [11.7, -56.5, 9.4, -54.7], [10.3, -51.4, 7.75, -49.2],
      [7.2, -51.1, 6.6, -50.5], [5.4, -47.8, 3.1, -47.3], [3.6, -49.3, 2.45, -49.7],
      [-1.65, -48.6, -2.2, -52.5], [-7, -53.7, -5.2, -57.6], [-7.2, -61.2, -4.8, -64.3]);
    stoff(c, "#bab19d", 10, -61.65, [7.6, -62.4, 6.2, -60.6], [4.1, -59.2, 3, -60.1],
      [4.1, -56.8, 8, -58.1], [10.2, -58.8, 10.6, -60.1]);
    faden(c, "#795e51", .53, 7.8, -57.38, [9.9, -57.1, 10.8, -58]);
    stoff(c, "#85917a", -10.2, -72.8, [-7.1, -77, -1.5, -78.1],
      [-4.3, -74.9, -6.6, -69.6], [-8.7, -60.1, -4.2, -54.4],
      [-8.4, -54.45, -11.1, -58.63], [-12.8, -65.9, -10.2, -72.8]);
    faden(c, "#bfb99d", .9, -4.5, -54.6, [-11.6, -62.8, -6.1, -73],
      [-2.3, -80.1, 5.1, -76.5], [9.1, -75.4, 10.9, -71.9]);
  } else {
    oval(c, "#655746", .2, -66.1, 11.3, 12.75);
    oval(c, haut, .3, -65.45, 9.63, 10.92);
    for (const d of [-1, 1]) {
      oval(c, "#d9a386", d * 5.95, -63.8, 2.73, 1.54, d * .27);
      faden(c, "#685a49", 1.4, d * 1.7, -70.3, [d * 4.3, -72.45, d * 7.1, -70.7]);
      faden(c, "#ac9b83", .43, d * 2.3, -70.65, [d * 4.6, -71.9, d * 6.7, -70.9]);
      if (blinzelt) faden(c, "#6d5445", .5, d * 2.6, -67.9, [d * 4.3, -67.3, d * 5.8, -68.1]);
      else { oval(c, "#504435", d * 4.36, -67.87, 1.04, 1.22); oval(c, "#fff4dd", d * 4.36 + .3, -68.23, .34, .36); }
      faden(c, "#b89178", .35, d * 5.7, -65.7, [d * 7.2, -66.05, d * 7.85, -66.8]);
    }
    stoff(c, bart, -9.8, -65.6, [-8, -64.8, -7.3, -61.3], [-4.1, -61.8, -1.6, -60.2],
      [1.7, -59.4, 5.9, -61.4], [9, -62.4, 9.53, -65.7], [12, -62.6, 10.18, -59.2],
      [11.5, -55.3, 8.4, -53.2], [8.3, -50, 5.45, -49.2], [5, -50.3, 4.7, -50.7],
      [3.3, -47.8, .25, -46.8], [.9, -48.8, -.8, -49], [-4.6, -47.9, -6.5, -51.3],
      [-9.8, -51.6, -9.3, -55.5], [-12.6, -57, -10.8, -61.05]);
    faden(c, "#785e51", .62, -2.35, -57.35, [.38, -55.8, 3.38, -57.6]);
    for (const d of [-1, 1]) stoff(c, "#b8ac97", d * .2, -61.2, [d * 2.9, -63.1, d * 5.4, -61],
      [d * 7.6, -59.6, d * 8.9, -60.8], [d * 7.55, -57.1, d * 4.25, -58.4], [d * 1.9, -58.9, d * .2, -61.2]);
    oval(c, "#c18e71", .12, -63.6, 3.11, 1.99); oval(c, "#e5af8b", -.24, -63.95, 2.88, 1.92);
    oval(c, "#f0c9a5", -.95, -64.46, 1.04, .51);
    faden(c, "#c7c0a5", 1.1, -9.8, -56.9, [-14, -65.1, -9.8, -73.2],
      [-6.5, -80.3, 1.2, -77.8], [9.9, -76.3, 11.7, -69.1], [13.1, -63.1, 8.91, -56.8]);
    faden(c, "#52634f", .5, -10.9, -57.5, [-14.9, -66, -10.7, -73.7], [-7.8, -79, -2.5, -79.2]);
  }
  if (fein) {
    for (let i = 0; i < 12; i++) {
      const dx = (profil ? -3.4 : -7.48) + i * (profil ? 1.03 : 1.33);
      const yy = -58 + Math.sin(i * 1.77) * 1.72, l = 2.45 + (i % 3) * .8;
      faden(c, i % 3 === 0 ? "#cbc3ad" : i % 3 === 1 ? "#7a7c70" : "#b0ad9a", .39,
        dx, yy, [dx - 1.05, yy + 1.3, dx + .27, yy + l]);
    }
    for (let i = 0; i < 5; i++) {
      const xx = (profil ? .45 : -4.75) + i * (profil ? 1.65 : 2.15), yy = -53.9 + Math.sin(i * 2) * .84;
      faden(c, "#b5b3a1", .43, xx, yy, [xx + .78, yy + 1.9, xx - .3, yy + 3.5]);
    }
  }
}

/** Stab rechts, Beutel links: Beim Wenden wechseln die sichtbaren Ueberdeckungen. */
export function zeichneRuprecht(c: C, x: number, y: number, bild: NikolausBild) {
  const { ansicht, pose, zeit: t, skala } = bild;
  const profil = ansicht === "links" || ansicht === "rechts", hinten = ansicht === "hinten";
  const sackseite = ansicht === "links", gehen = pose === "gehen", fein = skala >= .43;
  const takt = t * 4.36 + .87, w = gehen ? Math.sin(takt) : 0;
  const nicken = pose === "gruessen" ? (.5 - .5 * Math.cos(Math.min(t, 1.55) * Math.PI / 1.55)) * (.82 + .18 * Math.sin(t * 1.38)) : 0;
  const atem = Math.sin(t * 1.35) * .22, hub = gehen ? .83 * Math.abs(Math.cos(takt)) : 0;
  const last = -.115 + (gehen ? Math.sin(takt - .78) * .089 : .013 * Math.sin(t * 1.35 - .3));
  c.save(); c.translate(x, y); c.scale(skala, skala); c.lineJoin = "round"; c.lineCap = "round";
  oval(c, "rgba(28,35,31,.145)", -.4, .15, profil ? 13.6 : 16.5, 2.7);
  oval(c, "rgba(39,36,29,.12)", .1, -.28, 9.7, 1.38);
  if (ansicht === "links" || hinten) c.scale(-1, 1);
  for (const d of [-1, 1]) schuh(c, (profil ? d * 2.2 : d * 5.45) + (profil ? d * w * 5.55 : .4 * w),
    gehen ? Math.max(0, d * Math.cos(takt)) * 2.7 : 0, w * d, profil, hinten);
  c.translate(profil ? .4 * w : .72 * w, atem - hub);
  const gx = (profil ? 20.6 : -20.1) + w * (profil ? 1.7 : .7), gy = -39.9 - Math.max(0, w) * 1.14;
  if (!sackseite && !hinten) beutel(c, profil ? -10.9 : 13.4, -54.1, profil ? .89 : .8, last, fein);
  wanderstab(c, gx, gy, w, hub - atem);
  if (sackseite) arm(c, 5.4, -50.67, 8.2, -40.95, gx, gy, false, true);
  rock(c, profil, hinten, w, fein);
  const k = profil ? 6.3 : 0;
  stoff(c, "#955440", -8.8, -56, [k, -59.4, 10.5, -56.3], [7.7, -51.4, k + 3.3, -49.9],
    [k + 6, -44, k + 3.6, -39.9], [k -.3, -41.1], [k + .3, -47.8, k - 2.3, -50.6], [-8.2, -52.2, -8.8, -56]);
  for (let i = 0; i < 3; i++) faden(c, "#c38a63", .53, k + .45, -43.2 + i * .9, [k + 3.7, -42.5 + i * .9]);
  if (!hinten) {
    faden(c, "#634a35", 1.75, profil ? -4.1 : 8.3, -55, [profil ? -8.6 : 11.9, -49.1, profil ? -11 : 13.6, -42.3]);
    faden(c, "#bda17a", .53, profil ? -4.3 : 8.1, -55, [profil ? -8.8 : 11.7, -49.4, profil ? -11.2 : 13.4, -42.3]);
  }
  if (sackseite) beutel(c, -11, -50.8, .9, last, fein);
  else arm(c, profil ? 5.2 : -11.8, -51.8, profil ? 8.3 : -15.9, -40.3, gx, gy, false, true);
  const hx = (profil ? 2.2 : 15.3) + (profil ? 5.3 * w : 0) + nicken * (profil ? 7.3 : -10.8);
  const hy = -34.3 + w * .72 - nicken * 14.1;
  arm(c, profil ? -.7 : 11.9, -51.2, (profil ? -2.7 : 15.5) + nicken * 1.5, -41.9 + nicken * 2.3, hx, hy, !hinten, false);
  if (hinten) {
    faden(c, "#624d38", 2, 6.9, -54.8, [-6.1, -49.4, -10.4, -47.3]);
    faden(c, "#ba9c70", .65, 6.9, -55.2, [-5.6, -50, -10.4, -47.7]);
    beutel(c, -5.23, -50.1, .96, last - .08, fein);
  }
  c.save(); c.translate(0, -55.8); c.rotate((profil ? .042 : .012) + (profil ? .104 : .026) * nicken + w * .013);
  c.translate(0, 55.8 + nicken * 1.03); gesicht(c, profil, hinten, t, .23 * w, fein); c.restore(); c.restore();
}