import { ellbogen, faden, flocke, form, glied, korn, kugel, licht, maske, naht, oval, rund, schatten, type C, type Punkt, type Zeichner } from "./stift";

function stiefel(c: C, x: number, y: number, profil: boolean, hinten: boolean, d: number, w: number) {
  c.save(); c.translate(x, y); c.rotate(w * .048); if (!profil) c.scale(d, 1);
  const spitze = profil ? 8.7 : hinten ? 4.9 : 6.3;
  form(c, licht(c, -4.9, -24, 10.6, 8.7, "#252738", "#4c4751", "#302d3d"), -4.37, -28.5,
    [3.83, -30.1], [5.56, -23.65, 3.9, -15.9], [4.44, -9.56], [-3.95, -9.64], [-5.89, -18.67, -4.37, -28.5]);
  form(c, "#292d3a", -4.56, -16.37, [3.97, -17.11], [3.29, -9.88, 4.68, -6.07],
    [spitze - .3, -5.89, spitze + 1.1, -3.71], [spitze + 1.7, -.9, spitze + .7, -.44], [-5.43, -.18], [-5.81, -4.9, -4.68, -8.81]);
  form(c, "#656071", -4.7, -14.94, [3.73, -15.7], [3.29, -12.6], [-3.89, -11.85]);
  faden(c, "#ab8d76", 1, -4.81, -5.56, [-1.49, -3.98, 3.2, -4.99]);
  for (let i = 0; i < 3; i++) faden(c, "#a8a6a6", .53, -.9, -11.54 + i * 1.6, [2.43, -12.07 + i * 1.6]);
  faden(c, "#141a27", 1.52, -4.82, -1.12, [2.5, -.86, spitze + .8, -1.65]);
  faden(c, "#7edbd0", .7, 2.09, -1.64, [spitze + .75, -2.1]);
  rund(c, "#c39469", -4.06, -10.87, 1.47, 4.31, .34); c.restore();
}

function paket(c: C, x: number, y: number, w: number, h: number, f: string, band: string, a: number) {
  c.save(); c.translate(x, y); c.rotate(a);
  form(c, f, -w / 2, -h, [w / 2, -h], [w / 2, .1], [-w / 2, .1]);
  form(c, "rgba(255,241,210,.2)", -w / 2, -h, [-w / 2 + 2.4, -h - 1.7], [w / 2 + 1.8, -h - 1.2], [w / 2, -h]);
  form(c, "rgba(23,31,39,.3)", w / 2, -h, [w / 2 + 1.8, -h - 1.2], [w / 2 + 1.8, -1.23], [w / 2, .1]);
  c.fillStyle = band; c.fillRect(-w * .13, -h, 1.38, h); c.fillRect(-w / 2, -h * .52, w, .83);
  faden(c, band, .72, 0, -h, [-4.1, -h - 5.56, -4.9, -h - 2.43], [-4.52, -h, 0, -h], [3.6, -h - 4.66, 4.71, -h - 2.46], [5.1, -h -.63, 0, -h]);
  c.restore();
}

function rucksack(c: C, x: number, y: number, s: number, w: number, rueck: boolean) {
  c.save(); c.translate(x, y); c.rotate(-.087 + w * .023); c.scale(s, s);
  paket(c, -4.35, 1.4, 12.1, 11.1, "#a95562", "#dcbd81", -.19);
  paket(c, 4.94, 1.91, 10.1, 15.3, "#376d70", "#9ddcca", .12);
  faden(c, "#856244", .87, -10.22, 2.32, [-12.8, -9.2]);
  for (let i = 0; i < 5; i++) {
    const xx = -12.35 + i * .4, yy = -7.66 + i * 1.78;
    faden(c, "#6e8f77", .9, xx, yy + .71, [xx - 2.74 - i * .14, yy - 2.13]);
    faden(c, "#546f60", .86, xx, yy + .83, [xx + 1.85, yy - 2.45]);
  }
  form(c, licht(c, -13, 1, 28, 12, "#263e49", "#5e7372", "#344e58", "#263542"), -11.7, -.55,
    [-7.73, -2.98, 11.1, -.89], [14.21, 1.61, 13.01, 22.47], [8.85, 26.37, -9.85, 24.91], [-14.12, 21.98, -11.7, -.55]);
  faden(c, "#b2a28b", 1.73, -13.24, 2.52, [-15.01, 12.8, -13.7, 23.52], [-9.74, 26.5, 10.53, 25.74]);
  form(c, "#627c79", -11.54, .76, [.7, -1.23, 12.85, 1.04], [12.36, 8.59], [3.46, 12.33, -10.85, 8.55]);
  naht(c, [-10.2, 7.98], [10.73, 9.32], "#b5b1a0", 1.45, .31);
  for (const d of [-1, 1]) {
    rund(c, "#483f3f", d * 8.55 - 1.37, 1.01, 2.74, 21.8, .8);
    rund(c, "#b99b71", d * 8.55 - 1.94, 10.1, 3.88, 3.58, .54);
    rund(c, "#434852", d * 8.55 - 1.16, 10.84, 2.32, 1.96, .38);
  }
  if (rueck) {
    flocke(c, .44, 5.19, 2.99, "#bacbb6", .46);
    rund(c, "#293e49", -4.5, 14, 8.77, 5.83, .82);
    for (let i = 0; i < 4; i++) faden(c, i < 3 ? "#a4e0c8" : "#557775", .52, -3.13 + i * 1.65, 17.88, [-2.25 + i * 1.65, 15.9]);
  }
  c.restore();
}

function parka(c: C, profil: boolean, hinten: boolean) {
  c.save(); c.scale(profil ? .87 : 1, 1);
  const rot = licht(c, -21, -47, 44, 11, "#702b3f", "#ba4451", "#c75b59", "#a13d50", "#672c42");
  form(c, rot, -7.89, -60.19, [-15.5, -61.4, -19.3, -53.76], [-21.93, -47.34, -18.63, -42.4],
    [-23.2, -32.08, -22.03, -21.95], [-13, -18.31, -3.04, -20.18], [11.11, -18.2, 21.7, -22.22],
    [24.12, -36.2, 18.85, -48.4], [17.47, -58.37, 8.36, -60.78]);
  maske(c, () => {
    for (let i = 0; i < 4; i++) {
      const yy = -49.7 + i * 7;
      form(c, "rgba(67,26,46,.2)", -24.5, yy, [-13.8, yy + 5.78, -2.61, yy + 4.53], [12.76, yy + 5.55, 24, yy - .4],
        [24, yy + 1.36], [10.71, yy + 7.97, -2.87, yy + 6.06], [-13.41, yy + 7.02, -24.5, yy + 1.78]);
      faden(c, "rgba(247,158,139,.38)", .29, -23.3, yy + 1.68, [-12, yy + 7.21, -1.2, yy + 5.75], [12, yy + 6.5, 23.2, yy + 1.21]);
    }
    form(c, "#443546", -24, -46.68, [-14, -44.18], [-13.68, -32.9], [-17.8, -21.81], [-25, -23.11]);
    form(c, "#533443", 17.5, -48.3, [23.28, -50.62], [27, -20.3], [16.47, -20.13], [14.56, -29.53]);
  });
  faden(c, "#93d7d0", .83, -18.9, -45.1, [-14.83, -43.19], [-15.24, -35.51], [-18.48, -30.9]);
  naht(c, [-19.76, -27.3], [-14.03, -31.27], "#d08b7b", 1.15, .26);
  form(c, "#312d38", -20.32, -32.68, [-3.46, -29.6, 21.61, -33.44], [22.21, -28.69], [1.42, -24.61, -21.34, -28.11]);
  faden(c, "#7e6b63", .68, -20.99, -28.8, [1.9, -25.72, 21.19, -29.38]);
  const x = profil ? 8.5 : .77;
  if (!hinten) {
    rund(c, "#c49a68", x - 3.63, -32.12, 7.26, 5.99, .86); rund(c, "#514345", x - 2.52, -31.1, 5.04, 3.99, .45);
    faden(c, "#e5bd7f", .78, x - .38, -29.17, [x + 3.47, -29.35]);
    faden(c, "#5f3442", 1.05, x - 1.8, -53.49, [x + .25, -43.47, x + .4, -32.8]);
    for (let i = 0; i < 11; i++) faden(c, "#cf9d80", .38, x -.22, -45.9 + i * 1.18, [x + .72, -45.59 + i * 1.18]);
    faden(c, "#303b46", 2.59, -10.61, -56.12, [-4.2, -45.83, 7.95, -35.34]);
    naht(c, [-9.04, -53.7], [7.39, -36.46], "#9d9f95", 1.39, .29);
    for (const d of [-1, 1]) {
      faden(c, "#583944", 1.67, d * 12.2, -39.03, [d * 16.75, -34.94]);
      faden(c, "#c98f79", .46, d * 11.67, -38.92, [d * 16.09, -34.81]);
    }
    if (!profil) { flocke(c, 12.4, -47.88, 3.05, "#f1c8aa", .36); }
    // Die Lichtleiter laufen in die Naht, nicht als freischwebender Schein ueber dem Mantel.
    faden(c, "#663749", 1.6, -15.42, -38.44, [-12.77, -35.69], [-6.22, -35.69]);
    faden(c, "#9de1d2", .74, -15.42, -38.45, [-12.68, -35.81], [-6.22, -35.81]);
    faden(c, "#bb7b94", .58, -15.43, -37.02, [-13.15, -34.74], [-10.28, -34.74]);
    const px = profil ? 8.65 : 12.9;
    rund(c, "#37434e", px - 2.41, -28.86, 4.82, 4.53, .71);
    for (let i = 0; i < 3; i++) faden(c, i < 2 ? "#bce7cf" : "#687b78", .45, px - 1.33 + i * 1.06, -25.66, [px - .96 + i * 1.06, -27.59]);
  }
  // Flaum ueberlappt die Steppnaht, ohne dass eine starre Reihe von Kreisen entsteht.
  for (let i = 0; i < 25; i++) {
    const x1 = -21.54 + i * 1.78, yy = -21.91 + Math.sin(i / 24 * Math.PI) * 1.77;
    oval(c, i % 3 === 0 ? "#c3c5bd" : i % 3 === 1 ? "#e7e4d5" : "#d7d8ce", x1, yy, 1.89, 1.92 + korn(i) * .52, i * .4);
    faden(c, "#f5eedc", .25, x1 - .68, yy - .79, [x1 - .85, yy + .43, x1 - .19, yy + 1.27]);
  }
  form(c, "#d7d9ca", -9.67, -60.9, [-16.33, -62.08, -18.41, -55.76], [-13.96, -51.76, -7.63, -49.92],
    [.52, -51.31, 8.87, -50.46], [15.42, -52.55, 17.2, -56.63], [12.43, -62.78, 6.1, -60.59]);
  for (let i = 0; i < 25; i++) {
    const xx = -15.67 + korn(i + 57) * 31.18, yy = -57.3 + korn(i + 39) * 3.47;
    faden(c, i % 2 ? "#f0eddb" : "#b9c1b7", .38, xx, yy, [xx + .2, yy + 1.32, xx + .93, yy + 1.83]);
  }
  c.restore();
}

function mantelarm(c: C, s: Punkt, e: Punkt, h: Punkt, kupfer: boolean, gehoben: number, fern: boolean) {
  const rot = licht(c, s[0] - 4, s[1], 9, 8, "#783548", fern ? "#aa4753" : "#c66661", "#8f3b4b");
  glied(c, s, e, 4.83, 3.95, rot);
  if (kupfer) {
    c.save(); c.translate(...s); c.rotate(Math.atan2(e[1] - s[1], e[0] - s[0]) - Math.PI / 2);
    form(c, licht(c, -4.9, -4, 10.1, 8, "#314450", "#657079", "#464b5b", "#2d3c48"), -4.42, -1.91,
      [-3.16, -5.24, .87, -5.47, 3.92, -3.22], [5.7, -.49, 4.83, 2.85], [1.93, 4.96], [-3.88, 3.99], [-5.26, 1.19]);
    faden(c, "#a3e5d7", .72, -3.65, 2.61, [.88, 3.57], [3.82, 1.89]);
    faden(c, "#d0a3ac", .43, -3.44, 3.72, [.7, 4.5]);
    oval(c, "#ceb190", 3.21, -1.71, .57, .58); oval(c, "#655c61", 3.19, -1.71, .22, .22); c.restore();
    oval(c, "#55555e", ...e, 3.99, 3.83); oval(c, "#c39b78", e[0] -.4, e[1] -.31, 2.52, 2.62);
    oval(c, "#537781", e[0] -.42, e[1] -.41, 1.24, 1.26);
    glied(c, e, h, 3.13, 2.52, licht(c, e[0] - 3, e[1], 7.2, 5.3, "#6c5c58", "#dfb289", "#a07e69", "#705856"));
    faden(c, "#415764", 1.03, e[0] + 1.28, e[1] + 1.28, [h[0] + 1.08, h[1] - 1.12]);
    faden(c, "#a5efda", .49, e[0] + 1.28, e[1] + 1.47, [h[0] + .98, h[1] - 1.34]);
  } else {
    glied(c, e, h, 4.17, 2.98, rot);
    for (let i = 0; i < 5; i++) oval(c, i % 2 ? "#cdd0c7" : "#e5e3d7", h[0] + (i - 2) * 1.14, h[1] - 2, 1.65, 1.57);
  }
  c.save(); c.translate(...h); c.rotate(Math.atan2(h[1] - e[1], h[0] - e[0]) - Math.PI / 2 + gehoben * .14);
  const f = kupfer ? "#977a63" : "#44414c";
  oval(c, kupfer ? "#b69576" : "#403e49", 0, .48, 2.85, 3.05, -.08);
  for (let i = 0; i < 4; i++) {
    const x = -1.86 + i * 1.23, y = 3.9 + Math.sin(i / 3 * Math.PI) * .94;
    const ex = x * (1.03 + gehoben * .71);
    faden(c, f, .98, x, 1.06, [ex, y]);
    if (kupfer) { faden(c, "#d7b491", .49, x, 1.35, [ex, y - 1.23]); oval(c, "#4a5053", ex, y - .66, .45, .3); }
  }
  faden(c, f, 1.25, -2.5, -.23, [-3.77 - gehoben * .42, .74, -3.57, 2.45]); c.restore();
}

function muetze(c: C, profil: boolean, hinten: boolean, t: number) {
  const schlenker = .61 * Math.sin(t * 1.68);
  const g = licht(c, -17, -90, 30, 9, "#733343", "#c15559", "#c96962", "#8b3b4c");
  form(c, g, -11.9, -76.75, [-14.6, -84.36, -14.8, -87.68, -18.37 + schlenker, -89.12],
    [-21.6, -86.7, -22.8 + schlenker, -82.69], [-23.1, -89.98, -20.44, -95.26, -14.67, -96.41],
    [-4.1, -100.08, 3.69, -96.71, 7.67, -90.7], [12.77, -85.58, 12.11, -77.34], [1.2, -74.18, -11.9, -76.75]);
  faden(c, "#db8b7c", .67, -19.33, -92.82, [-14.5, -99.1, -7.41, -96.11], [1.94, -92.65, 4.41, -81.72]);
  naht(c, [-6.3, -94.21], [2.9, -82.3], "#e2b092", 1.19, .29);
  form(c, "#dcded0", -13, -80.52, [-2.75, -78.05, 12.45, -81.17], [13.7, -78.43, 12.71, -74.72],
    [1.23, -71.84, -12.83, -74.57], [-14.27, -77.01, -13, -80.52]);
  for (let i = 0; i < 20; i++) {
    const x = -12.14 + i * 1.28, y = -76.03 + Math.sin(i / 19 * Math.PI) * 1.63;
    faden(c, i % 3 ? "#f5efde" : "#b8c2bc", .33, x - .39, y - 2.46, [x + .58, y - 1.6, x - .03, y + .22]);
  }
  const px = -22.3 + schlenker, py = -82.17;
  oval(c, "#baaea0", px, py + .33, 3.63, 3.68);
  for (let i = 0; i < 12; i++) oval(c, i % 3 ? "#e5e3d4" : "#f3ecda", px + Math.cos(i * 2.4) * 2.03, py + Math.sin(i * 2.4) * 1.95, 1.64, 1.69);
  if (profil || hinten) flocke(c, -8.21, -85.75, 2.26, "#dcad95", .28);
}

function kopf(c: C, profil: boolean, hinten: boolean, t: number) {
  const x = profil ? 1.83 : .1;
  c.save(); c.translate(x, 0);
  const silber = licht(c, -14.2, -69.3, 29, 26, "#e9e7d8", "#f8eedc", "#dddcd3", "#acb9bc");
  form(c, silber, -11.7, -76.31, [-15.03, -73.79, -13.29, -69.48], [-16.33, -66.49, -13.78, -63.03],
    [-16.44, -58.34, -12.67, -56.81], [-13.43, -52.65, -9.26, -52.75], [-5.97, -49.74, -2.84, -52.08],
    [1.6, -48.67, 4.63, -51.89], [10.15, -50.56, 10.58, -55.21], [15.22, -54.65, 13.91, -59.77],
    [16.09, -60.77, 13.76, -65.61], [15.27, -72.95, 10.81, -76.92]);
  if (hinten) {
    for (let i = 0; i < 10; i++) { const xx = -11.21 + i * 2.41, yy = -68.8 + Math.sin(i * 1.81) * 2.02;
      faden(c, "#b4bfc0", .45, xx, yy, [xx - 2.1, yy + 3.41, xx + .66, yy + 6.22], [xx + 2.2, yy + 9.54, xx + .16, yy + 11.14]); }
    muetze(c, profil, true, t); c.restore(); return;
  }
  const bx = profil ? 4.49 : 0;
  oval(c, kugel(c, bx, -69, 11.63, "#fbd5b6", "#e7b397", "#cf917d"), bx, -68.94, profil ? 10.29 : 11.82, 11.49);
  for (const d of (profil ? [1] : [-1, 1])) {
    const xx = bx + d * 4.77;
    oval(c, "#d79784", xx + .67 * d, -64.77, 3.1, 1.86, d * .19);
    faden(c, "#e9dfcb", 1.82, xx - 2.55, -71.58, [xx + .24, -73.74, xx + 2.8, -71.91]);
    if (t % 5.13 > 4.97) faden(c, "#78574d", .62, xx - 1.43, -69.35, [xx, -68.61, xx + 1.63, -69.61]);
    else { oval(c, "#544940", xx + .16, -69.2, 1.09, 1.27); oval(c, "#fff4db", xx + .44, -69.68, .34, .36); }
    for (let i = 0; i < 2; i++) faden(c, "#c38e78", .33, xx + d * 1.67, -67.24 + i * .56, [xx + d * 2.94, -67.39 + i * .54]);
  }
  const nx = profil ? 12.99 : .49;
  oval(c, "#cb927a", nx, -65.71, 3.65, 2.47); oval(c, "#eebca0", nx - .42, -66.33, 3.16, 2.13);
  oval(c, "#f9d5b6", nx - 1.18, -66.99, 1.17, .52);
  const shift = profil ? 3.4 : 0;
  c.save(); c.translate(shift, 0); if (profil) c.scale(.88, 1);
  form(c, silber, -11.66, -65.66, [-8.97, -60.9, -6.53, -61.71], [-2.1, -64.16, 1.1, -61.53],
    [6.32, -64.29, 10.4, -62.24], [13.09, -63.18, 13.77, -65.82], [15.3, -61.7, 13.3, -58.37],
    [16.51, -54.68, 12.5, -51.53], [12.93, -46.7, 9.42, -45.4], [9.64, -42.48, 6.4, -40.54],
    [6.35, -43.18, 4.79, -42.75], [4.19, -38.87, -.53, -37.13], [.98, -40.27, -.96, -41.17],
    [-5.71, -38.68, -6.51, -43.22], [-11.67, -41.98, -10.56, -47.49], [-15.06, -48.45, -12.38, -53.15],
    [-16.15, -55.57, -13.13, -59.66], [-14.37, -63.1, -11.66, -65.66]);
  maske(c, () => {
    for (let i = 0; i < 16; i++) {
      const xx = -12 + i * 1.63, yy = -57.5 + Math.sin(i * .91) * 2.25, l = 6.5 + korn(i + 64) * 6.1;
      faden(c, i % 2 ? "#c5cdca" : "#d0d3cb", .61, xx, yy, [xx - 2.56, yy + 2.98, xx + .66, yy + l * .68], [xx + 1.72, yy + l * .85, xx - .73, yy + l]);
      faden(c, "#fff5e0", .43, xx + .69, yy - .36, [xx - 1.32, yy + 2.74, xx + 1.48, yy + l * .59]);
    }
  });
  faden(c, "#a18379", .79, profil ? 6.9 : -2.8, -59.04, [profil ? 9.5 : .4, -57.26, profil ? 11.2 : 3.5, -59.5]);
  for (const d of [-1, 1]) form(c, "#faf0dd", (profil ? 9 : 0) + d * .2, -63.62,
    [d * 4.83 + (profil ? 7 : 0), -67, d * 7.46 + (profil ? 5.3 : 0), -63], [d * 10.1 + (profil ? 3.6 : 0), -60.67, d * 12.16 + (profil ? 3 : 0), -62.64],
    [d * 10.98 + (profil ? 3.3 : 0), -56.56, d * 5.57 + (profil ? 6 : 0), -59.39], [d * 2.57 + (profil ? 7.6 : 0), -60.67, (profil ? 9 : 0) + d * .2, -63.62]);
  c.restore();
  // Ein einzelnes transparentes Leseglas: Das andere Auge bleibt frei sichtbar.
  const vx = profil ? 8.79 : -4.75;
  form(c, licht(c, vx - 4, -72, 9, 4, "rgba(33,83,111,.60)", "rgba(93,194,194,.40)", "rgba(166,236,218,.27)"),
    vx - 4.66, -72.38, [vx + 3.63, -72.1], [vx + 4.49, -70.61], [vx + 2.96, -66.99], [vx - 3.19, -66.99], [vx - 4.9, -69.1]);
  faden(c, "#385f71", .83, vx - 4.71, -72.3, [vx + 3.6, -72.1], [vx + 4.35, -70.55]);
  faden(c, "#a9f0e2", .44, vx - 3.13, -67.21, [vx + 2.91, -67.2], [vx + 4.26, -70.31]);
  faden(c, "#d8fff0", .29, vx - 3.09, -69.46, [vx - 1.96, -71.31]);
  faden(c, "#505d64", .86, vx - 4.62, -70.61, [-10.7, -71.89]);
  oval(c, "#5d5960", -11.74, -70.41, 2.09, 3.46); oval(c, "#b99670", -12.03, -70.5, 1.81, 2.88);
  faden(c, "#b2e9d6", .5, -12.35, -72.02, [-12.35, -68.98]);
  for (let i = 0; i < 3; i++) faden(c, "#d4fbef", .24, vx + 1.07 + i * .49, -68.02, [vx + 1.36 + i * .49, -68.73]);
  oval(c, "#d8b28b", -12.41, -71.93, .55, .49); oval(c, "#5b6570", -12.41, -71.93, .19, .2);
  muetze(c, profil, false, t); c.restore();
}

export const zeichneNeonweihnachtsmann: Zeichner = (c, { ansicht, pose, zeit: t }) => {
  const profil = ansicht === "links" || ansicht === "rechts", hinten = ansicht === "hinten";
  const w = pose === "gang" ? Math.sin(t * 4.04) : 0, hub = pose === "gang" ? Math.abs(Math.cos(t * 4.04)) * .87 : 0;
  const gruss = pose === "aktion" ? .5 - .5 * Math.cos(t * 1.69) : 0;
  c.save(); c.lineCap = "round"; c.lineJoin = "round"; schatten(c, 22.9, 4);
  if (hinten || ansicht === "links") c.scale(-1, 1);
  for (const d of [-1, 1]) stiefel(c, d * (profil ? 3.13 : 8.55) + (profil ? d * w * 5.7 : 0), -Math.max(0, d * w) * 2.39, profil, hinten, d, d * w);
  c.translate(0, -hub + Math.sin(t * 1.36) * .24);
  if (!hinten) rucksack(c, profil ? -18.37 : 11.68, -53.43, profil ? .9 : .91, w, false);
  const arm = (d: number, kupfer: boolean, vorn: boolean) => {
    const hubArm = kupfer ? gruss : 0;
    const a: Punkt = [profil ? (vorn ? 1.5 : 4) : d * 15.46, -54.1];
    const h: Punkt = [profil ? 5.33 + w * d * 5.63 + hubArm * 15.97 : d * (19.73 + hubArm * (9.1 + Math.sin(t * 4.5) * 1.51)), -34.19 - hubArm * 25.8];
    const e = ellbogen(a, h, 11.8, 10.95, profil ? 1 : -d);
    mantelarm(c, a, e, h, kupfer, hubArm, !vorn);
  };
  const metallVorn = ansicht !== "links";
  if (profil || hinten) arm(-1, !metallVorn, false);
  parka(c, profil, hinten);
  if (!profil && !hinten) arm(-1, !metallVorn, false);
  arm(1, metallVorn, true);
  if (hinten) rucksack(c, -1.3, -55.45, 1.07, w, true);
  c.save(); c.translate(0, -57); c.rotate(.021 * w + .031 * gruss); c.translate(0, 57 + gruss * .45);
  kopf(c, profil, hinten, t); c.restore(); c.restore();
};