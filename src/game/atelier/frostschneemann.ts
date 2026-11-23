import { faden, flocke, form, korn, kugel, licht, maske, naht, oval, rund, schatten, type C, type Zeichner } from "./stift";

function schnee(c: C, x: number, y: number, rx: number, ry: number, sa: number) {
  c.save(); c.translate(x, y);
  const g = kugel(c, -.7, -.3, Math.max(rx, ry), "#fff8e7", "#f1f1e7", "#d2e3e4", "#a8bdcd", "#91a8b9");
  form(c, g, -.07 * rx, -ry, [-rx * .66, -ry * 1.02, -rx * 1.05, -ry * .46, -rx, ry * .15],
    [-rx * 1.03, ry * .63, -rx * .73, ry * .97, -rx * .27, ry],
    [-rx * .01, ry * 1.075, rx * .55, ry * 1.01, rx * .76, ry * .75],
    [rx * 1.13, ry * .45, rx * 1.07, -ry * .3, rx * .82, -ry * .65], [rx * .58, -ry * .97, rx * .21, -ry * 1.04, -rx * .07, -ry]);
  maske(c, () => {
    for (let i = 0; i < 89; i++) {
      const xx = (korn(sa + i) * 2 - 1) * rx, yy = (korn(sa + i + 101) * 2 - 1) * ry;
      const v = .14 + korn(i + 28) * .39;
      oval(c, i % 3 ? "rgba(85,124,154,.19)" : "rgba(255,255,250,.89)", xx, yy, v * 1.26, v * .72, -.5 + korn(i + 32));
    }
    faden(c, "rgba(255,253,232,.78)", .64, -rx * .83, -ry * .36, [-rx * .64, -ry * .8, -rx * .29, -ry * .87]);
    faden(c, "rgba(140,171,192,.35)", .38, rx * .71, ry * .66, [rx * .42, ry * .95, rx * .09, ry * .94]);
  }); c.restore();
}

function schal(c: C, profil: boolean, hinten: boolean, t: number, w: number) {
  c.save(); const s = profil ? .85 : 1; c.scale(s, 1);
  const sch = 1.12 * Math.sin(t * 1.57) + w * .71;
  const stoff = licht(c, -12, -52, 25, 16, "#59456e", "#8d658b", "#694b78", "#4b4566");
  if (hinten || profil) {
    form(c, stoff, -2.37, -55.31, [4.71, -53.36], [5.48, -41.67, 12 + sch, -32.97],
      [10.8 + sch, -30.51, 6 + sch, -30.64], [1.46, -39.12, -2.37, -55.31]);
    for (let j = 0; j < 6; j++) faden(c, j % 2 ? "#a98d9f" : "#766383", .3, 6.31 + j * .91 + sch, -31.93,
      [7.56 + j * .91 + sch, -28.97 + korn(j) * .79]);
  } else {
    form(c, stoff, -8.85, -54.09, [-2.75, -54.24], [-3.55, -42.61, -2.45 + sch, -29.38],
      [-5.2 + sch, -27.43, -9 + sch, -28.49], [-10.87, -40.44, -8.85, -54.09]);
    for (let j = 0; j < 7; j++) faden(c, "#92748e", .36, -8.64 + sch + j * .88, -28.73, [-8.55 + sch + j * .88, -26.42 + korn(j) * .92]);
    flocke(c, -5.57 + sch * .64, -35.13, 2.11, "#c1b5b9", .31);
    for (let j = 0; j < 2; j++) faden(c, "#b2dfda", .52, -9 + sch, -31 + j, [-2.47 + sch, -31.6 + j]);
  }
  form(c, stoff, -13.2, -57.5, [-4.35, -55.82, 11.83, -58.38], [15.04, -56.09, 13.3, -51.23],
    [4.14, -47.96, -12.9, -51.18], [-15.3, -53.32, -13.2, -57.5]);
  maske(c, () => {
    for (let i = 0; i < 37; i++) {
      const x = -14.5 + i * .81;
      faden(c, "rgba(210,185,204,.37)", .22, x, -58.7, [x + 1.16, -53, x + 2.18, -49.92]);
    }
    faden(c, "#b4d7d2", .68, -14, -53.64, [-.3, -50.07, 15, -54.44]);
    faden(c, "#b7959e", .37, -14, -52.68, [.63, -49.09, 15.21, -53.42]);
  }); c.restore();
}

function ast(c: C, x: number, y: number, d: number, heben: number, hinten: boolean) {
  c.save(); c.translate(x, y); c.scale(d, 1); c.rotate(-heben * .91);
  const holz = licht(c, 0, -8, 15, 9, "#766b59", "#a89475", "#796451");
  faden(c, holz, 2.24, -1.15, .71, [5.44, -2.62], [8.86, -7.97], [13.29, -11.19]);
  faden(c, "#c8b598", .51, 2.7, -1.55, [5.66, -3.15], [8.17, -7.41]);
  for (const [px, py, qx, qy] of [[7.6, -5.55, 6.75, -10.66], [11.4, -9.8, 11.14, -14.52], [13.3, -11.2, 16.88, -12.16]]) {
    faden(c, holz, .99, px, py, [qx, qy]); oval(c, "#b7a48a", qx, qy, .6, .52);
  }
  faden(c, "#647784", .86, -.7, .25, [3.26, -.76, 5.22, -2.87], [7.31, -6.05, 9.16, -7.56]);
  faden(c, "#95f1df", .39, -.59, .09, [3.53, -1.06, 5.37, -3.18], [7.61, -6.57, 9.07, -7.79]);
  for (const [px, py] of [[4.9, -2.95], [8.47, -7.69]]) {
    c.save(); c.translate(px, py); c.rotate(-.68); rund(c, "#ac8968", -1.07, -1.47, 2.14, 3.05, .4);
    oval(c, "#e1c29a", .08, -.13, .44, .43); c.restore();
  }
  if (!hinten) oval(c, "#cce1dc", 11.11, -14.64, .81, .74);
  c.restore();
}

function kuehlwerk(c: C, x: number, y: number, profil: boolean, t: number) {
  c.save(); c.translate(x, y); c.scale(profil ? .66 : 1, 1);
  rund(c, "#637785", -8.8, -8.8, 17.6, 18.8, 2.86);
  rund(c, licht(c, -8, -8, 17, 16, "#c8c4bd", "#8fa4aa", "#7d929e", "#d0bfaa"), -8.36, -8.52, 16.7, 17.73, 2.54);
  rund(c, "#375868", -6.72, -6.74, 13.37, 13.9, 1.41);
  const g = licht(c, -5.6, -5, 11.8, 7, "#668f99", "#b1e0d6", "#8dbdc0", "#567d91");
  rund(c, g, -5.7, -5.67, 11.38, 11.56, 1.11);
  for (let j = 0; j < 4; j++) {
    const yy = -4.41 + j * 2.56;
    faden(c, "#786d69", 1.37, -4.09, yy, [3.29, yy + .5, 3.99, yy + 1.29], [-2.15, yy + 1.92, -4.07, yy + 2.51]);
    faden(c, "#d4aa7e", .76, -4.07, yy - .17, [3.16, yy + .36, 3.84, yy + 1.13], [-2.3, yy + 1.76, -4.08, yy + 2.33]);
  }
  for (let i = 0; i < 4; i++) oval(c, "#616f78", (i % 2 ? 1 : -1) * 7.09, i < 2 ? -7.17 : 7.67, .52, .52);
  oval(c, Math.sin(t * 1.7) > -.2 ? "#adf3d8" : "#83b7a6", 5.34, 7.69, .66, .43);
  c.restore();
}

function hut(c: C, profil: boolean, hinten: boolean, t: number) {
  c.save(); c.translate(-.65, -72.3); c.rotate(-.083);
  const w = profil ? 13.7 : 15.5;
  oval(c, "#494052", .3, .3, w, 3.21);
  oval(c, licht(c, -w, -1, w * 2, 3, "#666075", "#403d50", "#797084"), 0, -.25, w, 2.73);
  form(c, licht(c, -10.5, -11, 22, 1.4, "#353b4c", "#555368", "#3c4052", "#262f40"), -9.8, -1.75,
    [-9.5, -8.29, -11.35, -13.96], [-8.33, -17.4, 9.3, -15.28], [10.92, -14.49, 10.67, -12.51],
    [8.99, -6.23, 9.84, -1.93], [2.27, 1.14, -9.8, -1.75]);
  oval(c, "#66667a", -.38, -14.2, 10.89, 2.24, .035);
  faden(c, "#9f9caf", .32, -9.75, -14.43, [-4.56, -16.86, 7.99, -15.03]);
  naht(c, [-8.62, -12.57], [-7.8, -7.18], "#8e879c", .86, .23);
  form(c, "#8b6e86", -9.79, -6.88, [1.09, -4.37, 9.83, -6.55], [9.82, -2.32], [1.63, .25, -9.72, -2.12]);
  faden(c, "#98f1dc", .7, -9.84, -3.61, [.12, -1.16, 9.79, -3.73]);
  for (let i = 0; i < 6; i++) faden(c, "#d0adb6", .44, -7.7 + 2.62 * i, -5.13 + Math.sin(i / 5 * Math.PI) * 1.16,
    [-7.27 + 2.62 * i, -4.47 + Math.sin(i / 5 * Math.PI) * 1.12]);
  if (hinten) {
    rund(c, "#c09e83", -2.47, -5.57, 4.95, 3.89, .57); rund(c, "#554963", -1.8, -4.95, 3.6, 2.73, .38);
  } else {
    c.save(); c.translate(profil ? -6.71 : 8.92, -5.49); c.rotate(.18);
    faden(c, "#997f64", 1.12, 0, 0, [.4, -9.8], [2.49, -14.33]);
    faden(c, "#ddc49a", .43, -.25, -.71, [.19, -9.78], [2.26, -14.21]);
    oval(c, "#546776", 2.56, -14.75, 1.14, 1.19); oval(c, "#c7f4e3", 2.51, -15, .7, .8);
    const a = .2 + .12 * Math.sin(t * 1.42); oval(c, `rgba(185,250,231,${a})`, 2.52, -14.94, 2.23, 2.27);
    c.restore();
  }
  c.restore();
}

export const zeichneFrostschneemann: Zeichner = (c, { ansicht, pose, zeit: t }) => {
  const profil = ansicht === "links" || ansicht === "rechts", hinten = ansicht === "hinten";
  const w = pose === "gang" ? Math.sin(t * 2.45) : 0, gruss = pose === "aktion" ? .52 - .46 * Math.cos(t * 1.81) : 0;
  c.save(); c.lineJoin = "round"; c.lineCap = "round"; schatten(c, 23.4, 4.3);
  if (ansicht === "links" || hinten) c.scale(-1, 1);
  // Kufen statt angehaengter Menschenbeine; beim Gleiten wechselt die Last von einer zur anderen.
  for (const d of [-1, 1]) {
    const x = (profil ? 1.77 : 10.3) * d + w * (profil ? 3.4 : .43) * d, yy = -.64 - Math.max(0, d * w) * .76;
    faden(c, "#7e8191", 2.04, x - (profil ? 11.5 : 5.77), yy - .43, [x + 1.3, yy + .17, x + (profil ? 11.1 : 5.89), yy - .78], [x + (profil ? 13.62 : 7.41), yy - 2.34]);
    faden(c, "#b3e3e0", .63, x - (profil ? 11.1 : 5.5), yy - 1, [x + .3, yy -.39, x + (profil ? 11 : 5.73), yy - 1.38]);
    faden(c, "#797b82", 2.1, x - 3.63, yy - 1.56, [x - 4.2, -6.19]);
    faden(c, "#97969a", 2.1, x + 3.87, yy - 1.9, [x + 4.07, -5.96]);
  }
  c.rotate(.037 * w); schnee(c, -.64, -20.93, 21.3, 17.84, 13);
  const neigung = Math.sin(t * 1.13) * .008 + w * .014; c.translate(0, -35); c.rotate(neigung); c.translate(0, 35);
  ast(c, profil ? 2.46 : -11.42, -43.14, -1, -w * .21, hinten);
  if (profil) kuehlwerk(c, -13.8, -41.54, true, t);
  schnee(c, .47, -43.01, 15.94, 13.51, 116);
  if (!hinten) {
    const bx = profil ? 10.69 : 1.21;
    oval(c, "#8494a1", bx, -44.74, 3.22, 3.13); oval(c, "#b4aa9b", bx, -44.93, 2.86, 2.84);
    oval(c, "#436473", bx, -44.94, 2.14, 2.15); flocke(c, bx, -44.99, 1.51, "#c2f0de", .25);
    for (const [by, r] of [[-36.83, 1.86], [-29.25, 1.45]]) {
      form(c, "#475260", bx - r, by - .4, [bx - .29, by - r], [bx + r, by - .64], [bx + r * .8, by + r * .66], [bx -.6, by + r]);
      faden(c, "#78848d", .41, bx - .65, by - .47, [bx + .24, by - .93]);
    }
  } else kuehlwerk(c, .81, -43.55, false, t);
  if (!hinten) {
    const portX = profil ? 3.93 : -11.55;
    faden(c, "#76919b", 1.05, portX, -50.1, [portX - 3.21, -46.2, portX - 1.4, -42.74],
      [portX + .61, -39.68, portX + 4.43, -41.12]);
    faden(c, "#bce9dc", .43, portX + .13, -50.21, [portX - 2.88, -46.1, portX - 1.18, -42.96],
      [portX + .74, -40.06, portX + 4.47, -41.41]);
    oval(c, "#a98c74", portX + 4.49, -41.32, 1.03, .93); oval(c, "#647b89", portX + 4.5, -41.27, .53, .46);
  }
  schnee(c, profil ? 1.05 : .21, -63.94, 12.64, 11.64, 237);
  if (!hinten) {
    const bx = profil ? 5.83 : .18;
    for (const d of (profil ? [1] : [-1, 1])) {
      const x = profil ? 8.19 : bx + d * 4.81, y = -65.58 + d * .39;
      if (d < 0 || profil) {
        oval(c, "#7f8892", x, y, 3.02, 3.12); oval(c, "#495b6b", x, y, 2.57, 2.72);
        oval(c, kugel(c, x, y, 2.01, "#ccf9e5", "#86c3cb", "#5e859c"), x, y, 1.96, 2.1);
        oval(c, "#f3ffe7", x - .6, y - .61, .66, .43); oval(c, "#42606c", x + .16, y + .17, .71, .86);
      } else { oval(c, "#35414d", x, y, 1.83, 1.99, -.19); oval(c, "#aabac0", x - .47, y - .59, .47, .35); }
    }
    const nx = profil ? 11.48 : .7, ny = -62.89;
    form(c, licht(c, nx, ny - 2, 11, 5, "#dc9260", "#efb177", "#bd7755"), nx - 1.51, ny - 1.61,
      [nx + 1.42, ny - 2.87, nx + 3.44, ny - 1.36], [nx + (profil ? 12.16 : 6.82), ny + (profil ? 1.06 : 2.47)],
      [nx + 2.2, ny + 3.19, nx - 1.27, ny + 1.54], [nx - 2.29, ny + .36, nx - 1.51, ny - 1.61]);
    for (let i = 0; i < 3; i++) faden(c, "#b37e59", .3, nx + i * 1.74 + .81, ny - 1.35 + .35 * i, [nx + i * 1.74 + .48, ny - .31 + .38 * i]);
    for (let j = 0; j < 6; j++) { const u = j / 5, xx = bx - (profil ? 4.61 : 6.79) + u * (profil ? 10.19 : 13.13);
      oval(c, "#4f5960", xx, -59.83 + Math.sin(u * Math.PI) * 2.22, .64 + .25 * korn(j), .67, -.36 + u * .7); }
  }
  schal(c, profil, hinten, t, w);
  ast(c, profil ? 5.51 : 13.62, -44.83, 1, gruss + w * .17, hinten);
  hut(c, profil, hinten, t); c.restore();
};