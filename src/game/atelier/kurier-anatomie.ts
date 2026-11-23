import { ellbogen, faden, form, glied, korn, kugel, licht, maske, misch, naht, oval, type C, type Punkt } from "./stift";

/** Bei weit auseinanderstehenden Fuessen sinkt das Becken, statt die Beine zu verlaengern. */
export const kurierHub = (takt: number, geht: boolean) => geht ? -.86 * Math.sin(takt) ** 2 : 0;

/** Menschliches Hueft-/Knie-/Knoechelmodell. Etwas Spiel in den Knien beim Abrollen der Sohle. */
export function kurierLauf(profil: boolean, seite: number, takt: number, geht: boolean, sitz: number, hub: number) {
  const sw = geht ? Math.sin(takt) * seite : 0, heben = geht ? Math.max(0, Math.cos(takt) * seite) : 0;
  const x = seite * (profil ? 2.17 : 4.99), ab = sitz * 10.3;
  const huefte: Punkt = [x, -36.48 - hub + ab];
  const fuss: Punkt = [x + (profil ? sw * 6.34 : seite * .6 + sw * .67) + sitz * (profil ? 7.87 : seite * 1.46), -heben * 2.83];
  const knoechel: Punkt = [fuss[0] - (profil ? .73 : 0), fuss[1] - 5.49];
  const knie = profil ? ellbogen(huefte, knoechel, 15.55, 15.6, -1) : lerpFront(huefte, knoechel, seite, sitz);
  return { huefte, knie, knoechel, fuss, winkel: (profil ? sw * .106 : sw * .025) };
}
function lerpFront(a: Punkt, b: Punkt, d: number, sitz: number): Punkt {
  return [misch(a[0], b[0], .51) + d * (.15 + sitz * .72), misch(a[1], b[1], .51) - sitz * 3.45];
}

export function hosenbein(c: C, profil: boolean, seite: number, takt: number, geht: boolean, sitz: number, hub: number, fern: boolean, hinten: boolean) {
  const {huefte: a, knie: k, knoechel: b, fuss, winkel} = kurierLauf(profil, seite, takt, geht, sitz, hub);
  const stoff = licht(c, a[0] - 4.1, a[1], 9.5, 7, fern ? "#38424d" : "#45545b", fern ? "#4a555d" : "#627076", "#48565e", "#35404b");
  glied(c, a, k, 4.71, 3.48, stoff); glied(c, k, b, 3.5, 2.63, stoff);
  const nahtX = (profil ? -1 : seite) * 2.67;
  naht(c, [a[0] + nahtX, a[1] + 1.3], [k[0] + nahtX * .83, k[1] - 1.43], "#a39b86", .84, .18);
  faden(c, "#35434c", .53, k[0] - 2.52, k[1] - .9, [k[0] - .2, k[1] + .43, k[0] + 2.2, k[1] - .09]);
  faden(c, "#82908f", .33, k[0] - 2.45, k[1] - .54, [k[0] + .23, k[1] + .72, k[0] + 1.86, k[1] + .29]);
  if (!fern && !hinten) {
    const x = misch(a[0], k[0], .45), y = misch(a[1], k[1], .45);
    form(c, "#3f4e57", x - 2.56, y - 1.66, [x + 2.8, y - 1.21], [x + 2.42, y + 3.08], [x - .34, y + 3.66], [x - 2.69, y + 2.71]);
    form(c, "#69797b", x - 2.78, y - 2.08, [x + 2.97, y - 1.59], [x + 2.85, y - .06], [x -.02, y + .68], [x - 2.72, y -.17]);
    oval(c, "#cbb593", x + .58, y -.18, .33, .3);
    naht(c, [x - 2.13, y + .43], [x - 2.2, y + 2.55], "#9ca59b", .61, .14);
  }
  c.save(); c.translate(...fuss); c.rotate(winkel); if (!profil) c.scale(seite, 1);
  const z = profil ? 7.03 : hinten ? 3.18 : 4.85;
  const leder = licht(c, -3.65, -9, 9.4, 5.2, "#3b3432", "#755c4d", "#59473d", "#423a37");
  form(c, leder, -3.05, -10.51, [-.36, -9.9, 3.13, -10.88], [3.01, -7.17, 2.64, -5.72],
    [3.7, -4.34, z - .95, -4.13], [z + 1.36, -3.61, z + 1.09, -1.32], [z - .48, -.53, -3.63, -.66], [-4.05, -2.78, -3.11, -6.01]);
  form(c, "#2b3037", -3.58, -2.07, [-.13, -1.59, z + 1.26, -2.23], [z + 1.36, -.61], [2.76, .18, -3.86, -.14]);
  faden(c, "#aa9674", .45, -3.71, -1.77, [1.02, -1.08, z + .88, -2]);
  form(c, "#333b40", -3.14, -10.43, [3.42, -10.67], [3.19, -8.75], [-3.13, -8.57]);
  faden(c, "#c4ab76", .64, -2.32, -9.49, [-.79, -9.59]);
  if (!hinten) {
    for (let j = 0; j < 3; j++) {
      const y = -8.08 + j * 1.21;
      faden(c, "#b29f80", .42, -.51, y, [2.31, y + .58]); faden(c, "#9c8e78", .36, 2.26, y -.21, [-.36, y + .66]);
    }
    faden(c, "#927761", .33, 2.07, -4.89, [4.19, -4.24, z - .24, -3.48]);
  } else naht(c, [-.39, -8.19], [-.39, -3.02], "#a58a6b", .88, .18);
  for (let i = 0; i < 4; i++) faden(c, "#756e63", .31, -2.73 + i * 1.78, -.74, [-2.48 + i * 1.78, -.28]);
  c.restore();
}

export function kurierGesicht(c: C, profil: boolean, hinten: boolean, t: number, neigung: number, blinzeln: boolean) {
  c.save(); c.translate(profil ? 1.36 : .21, -59.67); c.rotate(neigung * .021 + Math.sin(t * 1.37) * .012);
  const haut = licht(c, -10.2, -11, 21.2, 14, "#6e937b", "#a7bf92", "#c6cfa5", "#a5b78a", "#789779");
  form(c, "#839a77", -4.25, 4.1, [4.82, 4.06], [4.45, 8.93, 5.37, 10.98], [1.74, 13.25, -4.61, 10.67], [-3.13, 7.94, -4.25, 4.1]);
  if (!hinten) {
    for (const d of (profil ? [-1] : [-1, 1])) {
      const x = profil ? -5.48 : d * 8.88;
      oval(c, "#8da481", x, .04, 1.64, 2.84, d * .15);
      faden(c, "#647e69", .37, x - .44, -.91, [x + .74, -1.6, x + .56, .39], [x - .36, .43, x - .13, 1.21]);
    }
  }
  if (profil) {
    form(c, haut, -7.21, -3.43, [-8.54, -10.33, -4.41, -15.07, 1.25, -14.73],
      [7.95, -14.62, 9.67, -10.93, 9.14, -7.07], [8.91, -5.46, 9.93, -3.79],
      [10.47, -1.98, 12.19, -.45, 11.54, .69], [10.86, 1.52, 9.72, 1.15],
      [9.13, 1.85, 10.42, 2.89], [10.02, 3.91, 9.46, 3.92], [10.12, 5.7, 8.38, 7.74],
      [7.27, 9.02, 4.59, 8.64], [1.47, 8.65, -2.84, 5.22], [-6.55, 2.16, -7.21, -3.43]);
  } else {
    form(c, haut, -8.94, -6.95, [-9.47, -12.04, -5.85, -15.41, .25, -15.02],
      [6.93, -15.29, 10.07, -11.84, 9.53, -6.72], [10.09, -2.36, 9.25, 1.75, 7.23, 4.69],
      [5.65, 7.1, 3.5, 9.16, .53, 9.04], [-2.46, 9.28, -5.91, 6.79, -7.53, 3.75],
      [-9.94, .88, -9.56, -3.47, -8.94, -6.95]);
  }
  maske(c, () => {
    for (let i = 0; i < 40; i++) {
      const d = i % 2 ? -1 : 1, x = profil ? -2.7 + korn(i) * 6.33 : d * (5.35 + korn(i) * 4.35);
      const y = -3.55 + korn(i + 58) * 7.88;
      oval(c, i % 3 ? "rgba(63,101,77,.25)" : "rgba(231,229,171,.51)", x, y, .18 + korn(i + 26) * .37, .15 + korn(i + 97) * .23, -.28);
    }
    if (!hinten) form(c, "rgba(65,82,66,.16)", -6.49, 4.35, [-2.19, 6.18, 1.9, 7.78, 6.66, 5.91], [4.31, 9.51, -.5, 9.65], [-5.58, 7.26, -6.49, 4.35]);
  });
  if (!hinten) {
    for (const d of (profil ? [1] : [-1, 1])) {
      const x = profil ? 6.94 : d * 4.39, y = -4.04, w = profil ? 2.14 : 2.73;
      form(c, "#536d58", x - w, y - 2.19, [x - .38, y - 3.52, x + w, y - 2.48],
        [x + w + .14, y - 1.86], [x + .24, y - 2.38, x - w, y - 1.73]);
      if (blinzeln || (t + .24) % 5.6 > 5.44) faden(c, "#415d4c", .48, x-w, y+.18, [x, y+1.46, x+w, y-.01]);
      else {
        form(c, "#e1e3bb", x - w, y + .11, [x - .69, y - 2.57, x + 1.12, y - 1.74, x + w, y - .22],
          [x + 1.36, y + 1.84, x - 1.09, y + 1.79, x - w, y + .11]);
        maske(c, () => {
          oval(c, kugel(c, x+.24, y, 1.85, "#e9cc7f", "#bda35f", "#997647", "#766340"), x+.21, y, 1.82, 1.91);
          for (let j=0;j<12;j++) { const a=j*Math.PI/6; faden(c,"rgba(114,87,49,.38)",.11,x+.2+Math.cos(a)*1.35,y+Math.sin(a)*1.42,[x+.2+Math.cos(a)*1.68,y+Math.sin(a)*1.8]); }
          oval(c, "#314538", x + .33, y + .06, 1.31, .56, -.07);
          oval(c, "#faf2cf", x - .36, y - .52, .46, .38);
        });
        faden(c, "#425d50", .49, x - w, y + .08, [x - .69, y - 2.57, x + 1.12, y - 1.74, x + w, y - .22]);
        faden(c, "#819677", .23, x - w * .66, y + 1.16, [x + .06, y + 2.16, x + w * .83, y + .77]);
      }
    }
    if (!profil) {
      form(c, "rgba(99,124,90,.23)", .22, -2.9, [.57, -.87, 1.14, .51], [2.91, 1.13, 2.06, 1.94], [.37, 2.73, -1.54, 1.38], [.03, .97, .22, -2.9]);
      faden(c, "#d5d9b3", .34, -.24, -1.42, [-.35, .07, -.83, .86]);
      oval(c, "#708369", -1.14, 1.49, .55, .23); oval(c, "#708369", 1.92, 1.42, .48, .21);
    } else faden(c, "#71836c", .39, 9.79, .83, [10.63, .43, 11.06, .7]);
    const l = profil ? 3.44 : -5.41, r = profil ? 10.08 : 5.8;
    faden(c, "#647a60", .49, l, 3.49, [(l+r)/2+.47, 5.72, r, 3.46]);
    faden(c, "#c5ceaa", .34, profil ? 6.39 : -2.32, 4.97, [profil ? 8.53 : .42, 5.72, profil ? 9.48 : 3.24, 4.98]);
  }
  // Die kurze Frisur sitzt auf einem menschlichen Schaedel. Die Augen liegen unter dem Brauenbogen.
  const haar = licht(c, -9, -16, 20, 12, "#263d3d", "#415451", "#344747", "#233b3b");
  form(c, haar, -9.06, .69, [-10.11, -3.37, -11.04, -9.36, -8.04, -13.71], [-9.09, -13.83, -9.39, -13.73],
    [-6.61, -16.78, -3.83, -16.89], [-4.64, -17.6], [-.01, -18.72, 2.39, -17.64], [4.56, -18.49, 5.45, -18.19],
    [8.7, -17.08, 10.11, -14.67, 10.1, -13.11], [12.44, -13.17, 11.82, -10.63],
    [9.49, -11.25, 7.31, -9.61], [4.78, -8.38, 2.35, -9.62], [3.93, -10.02, 4.22, -11.11],
    [.25, -9.88, -3.48, -9.11], [-5.44, -8.67, -5.62, -5.21], [-6.17, -3.81, -6.82, -2.91],
    [-6.91, -4.38, -8.16, -4.07], [-9.46, -3.1, -8.84, -.47], [-8.94, 1.05, -9.06, .69]);
  if (hinten) form(c, haar, -9.17, -8.74, [1.69, -12.96, 9.45, -7.47], [9.55, -.46, 7.1, 3.09],
    [5.97, 4.87, 4.49, 5.93], [4.62, 4.81], [1.72, 6.26, -1.71, 6.1], [-4.32, 6.77, -5.86, 4.84], [-8.94, 2.38, -9.17,-8.74]);
  maske(c, () => {
    for (let i = 0; i < 23; i++) {
      const x = -10.2 + i * .89, y = -16.85 + korn(i) * 3.63;
      faden(c, i % 3 ? "rgba(150,165,144,.28)" : "rgba(15,35,38,.44)", .17 + (i % 3) * .09, x, y,
        [x + 1.47, y + 1.18, x + 2.93, y + 3.23], [x + 3.51, y + 4.23, x + 3.25, y + 5.35]);
    }
    if (hinten) for (let j=0;j<35;j++) {const x=-8.6+korn(j)*17.6,y=-6.41+korn(j+31)*12.5;faden(c,"#526760",.15,x,y,[x+.3,y+.86]);}
  });
  if (profil || !hinten) {
    const ex = profil ? -6.75 : -9.14;
    oval(c, "#31484b", ex, -.25, 1.5, 2.32, -.06); oval(c, "#a18b69", ex -.13, -.47, 1.18, 1.76, -.06);
    faden(c, "#b8e2c4", .36, ex -.28, -1.46, [ex -.24, -.09]);
    faden(c, "#4e5b54", .39, ex+.19, 1.29, [ex+1.25, 3.07, ex+3.14, 3.64]);
    oval(c,"#3c4e4b",ex+3.34,3.68,.62,.37,.22);
  }
  c.restore();
}