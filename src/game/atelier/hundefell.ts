import { faden, form, glied, korn, kugel, licht, maske, misch, naht, oval, schatten, type Bild, type C, type Punkt } from "./stift";
import { APOLLOS_FELL as F } from "./stafford";

export type Hund = "odin" | "apollo";
export interface Lauf { wurzel: Punkt; gelenk: Punkt; sprunggelenk: Punkt; pfote: Punkt; hinten: boolean; fern: boolean }

const lerpP = (a: Punkt, b: Punkt, t: number): Punkt => [misch(a[0], b[0], t), misch(a[1], b[1], t)];



/** Beingelenke exakt nach Apollos stehender Spielsilhouette aus hunde.ts. */
export function hundeLauf(_hund: Hund, hinten: boolean, fern: boolean, bild: Bild): Lauf {
  const sitzt = bild.pose === "sitzen";
  const p = bild.zeit * 4.75 + (hinten !== fern ? Math.PI : 0);
  const w = bild.pose === "gang" ? Math.sin(p) : 0;
  const heb = bild.pose === "gang" ? Math.max(0, Math.cos(p)) : 0;
  const tiefe = fern ? -1.6 : 0;
  const bob = bild.pose === "gang" ? -.42 * Math.abs(w) : 0;

  if (hinten) {
    const wurzel: Punkt = [-8.8 + tiefe, -15.2 + bob + (sitzt ? 6.2 : 0)];
    const fuss: Punkt = [-8.8 + tiefe + w * 4.5 + (sitzt ? 4.8 : 0), -0.8 - heb * 2.3];
    const gelenk: Punkt = [-10.8 + tiefe + w * 2.0 + (sitzt ? 2.5 : 0), -8.2 + bob * 0.5 + (sitzt ? 4.0 : 0) - heb * 0.8];
    const sprung: Punkt = [-9.8 + tiefe + w * 3.2 + (sitzt ? 3.5 : 0), -4.2 - heb * 1.5];
    return { wurzel, gelenk, sprunggelenk: sprung, pfote: fuss, hinten, fern };
  } else {
    const wurzel: Punkt = [8.4 + tiefe, -14.0 + bob];
    const fuss: Punkt = [8.8 + tiefe + w * 4.5 + (sitzt ? 1.8 : 0), -0.8 - heb * 2.3];
    const gelenk: Punkt = [8.3 + tiefe + w * 2.5 + (sitzt ? 1.0 : 0), -7.2 + bob * 0.5 - heb * 0.8];
    const sprung: Punkt = [8.5 + tiefe + w * 3.5 + (sitzt ? 1.4 : 0), -4.0 - heb * 1.5];
    return { wurzel, gelenk, sprunggelenk: sprung, pfote: fuss, hinten, fern };
  }
}

/** Feine, weiche Fellstriche entlang der Konturlinien fuer den Nikolaus-Zeichenstil. */
function fell(c: C, x: number, y: number, w: number, h: number, winkel: number, laenge: number, saat: number, hell = false, menge = 45) {
  for (let i = 0; i < menge; i++) {
    const px = x + korn(i + saat) * w, py = y + korn(i + saat + 71) * h;
    const a = winkel + (korn(i + 98) - .5) * .75, l = laenge * (.48 + .68 * korn(i + 49));
    const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
    const breite = .04 + korn(i + 109) * .12;
    form(c, hell ? (i % 3 ? "rgba(142,148,145,.36)" : "rgba(255,253,238,.88)")
      : (i % 3 ? "rgba(165,160,150,.32)" : "rgba(18,22,28,.55)"), px, py,
      [px + dx * .44 - dy * .12, py + dy * .48 + dx * .1, px + dx, py + dy],
      [px + dx * .57 - dy * .12 + Math.sin(a) * breite, py + dy * .53 + dx * .1 - Math.cos(a) * breite, px, py]);
  }
}

function pfote(c: C, hund: Hund, p: Punkt, profil: boolean, fern: boolean, hinten: boolean) {
  const ap = hund === "apollo", w = 2.0, h = 1.3;
  const rechts = profil ? w * 1.4 : w;
  c.save(); c.translate(p[0], p[1]);
  form(c, licht(c, -w, -h * 2, 2 * w + 1, 2.4, fern ? "#27272f" : "#3e3e44", "#2c2d33", "#1e2128"),
    -w * .95, -.03, [-w * 1.12, -h * 1.49, -w * .42, -h * 2.13], [w * .26, -h * 2.31, rechts * .53, -h * 1.51],
    [rechts * 1.3, -h * 1.42, rechts * 1.31, -.52], [rechts, .1, .27, .08], [-w * .64, .24, -w * .95, -.03]);
  if (ap) {
    // Apollos originale braune Stromung an den Pfoten
    for (let i = 0; i < 4; i++) {
      faden(c, i % 2 ? F.pfote : F.pfoteMitte, .22, -.9 + i * .52, -1.3, [-1.15 + i * .61, -1.95, -.85 + i * .5, -2.6]);
    }
  }
  if (!hinten) {
    for (let i = 0; i < 3; i++) {
      const x = profil ? rechts * .22 + i * .56 : -w * .46 + i * w * .52;
      faden(c, "#15181f", .2, x, -.12, [x + .2, -.46, x + .02, -.95]);
      oval(c, "#8c867e", x + .26, -.16, .2, .1, -.15);
    }
  }
  c.restore();
}

function laufZeichnen(c: C, hund: Hund, b: Lauf, profil: boolean, vonHinten: boolean) {
  const ap = hund === "apollo", { wurzel: a, gelenk: e, sprunggelenk: s, pfote: p, fern, hinten } = b;
  const farbe = licht(c, a[0] - 2.5, a[1], 7.5, 6.8, fern ? "#25262c" : "#38383e",
    fern ? "#2f2f36" : ap ? "#424549" : "#494341", "#2a2b31", fern ? "#23252b" : "#3a393e");
  const oben = hinten ? 3.8 : 2.9;
  glied(c, a, e, oben, hinten ? 2.3 : 1.9, farbe);
  glied(c, e, s, hinten ? 2.35 : 1.85, 1.25, farbe);
  glied(c, s, [p[0], p[1] - 1.45], 1.28, 1.12, farbe);
  const m = lerpP(e, s, .43);
  faden(c, fern ? "rgba(155,150,140,.16)" : "rgba(175,163,149,.36)", .3,
    e[0] - .38, e[1] + .38, [m[0] - .6, m[1], s[0] - .28, s[1] - .65]);
  if (ap) {
    for (let i = 0; i < 6; i++) {
      const u = .22 + (i % 4) * .18, v = lerpP(s, p, u), dx = (i % 3 - 1) * .6;
      faden(c, fern ? "#655446" : i % 2 ? F.pfoteMitte : F.pfote, .22, v[0] + dx, v[1] + .22,
        [v[0] + dx * 1.15 + .34, v[1] - .88, v[0] + dx * .78, v[1] - 1.6]);
    }
  }
  pfote(c, hund, p, profil, fern, vonHinten);
}

function marke(c: C, x: number, y: number, ap: boolean, t: number, gang: boolean) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * (gang ? 4.6 : 1.51)) * (gang ? .2 : .05));
  c.beginPath(); c.ellipse(0, -.1, .55, .72, 0, 0, Math.PI * 2); c.lineWidth = .26; c.strokeStyle = "#c6b18a"; c.stroke();
  oval(c, licht(c, -1.2, .25, 2.6, 2.4, "#e5cc90", "#c19d65", "#967753"), 0, 1.5, 1.18, 1.22);
  oval(c, "#f2dc9f", -.38, .85, .42, .16, -.4);
  if (ap) {
    faden(c, "#7a6349", .2, -.48, 2.0, [0, .92], [.46, 2.0]);
    faden(c, "#7a6349", .15, -.24, 1.62, [.24, 1.62]);
  } else {
    c.beginPath(); c.ellipse(.01, 1.5, .38, .52, .08, 0, Math.PI * 2); c.lineWidth = .16; c.strokeStyle = "#7a6349"; c.stroke();
  }
  c.restore();
}

function halsband(c: C, hund: Hund, profil: boolean, hinten: boolean, t: number, gang: boolean) {
  const ap = hund === "apollo";
  const b = ap ? 4.8 : 4.4;
  const g = licht(c, -b, 0, b * 2, 1.1, "#362b27", "#70513a", "#5a4234", "#362e2c");
  if (profil) {
    // Halsband sitzt natuerlich am Halsuebergang
    form(c, g, -3.4, -.5, [-0.6, 1.6, 3.4, 1.3], [2.9, 2.8], [-1.0, 3.0, -3.8, 0.7]);
    naht(c, [-3.0, 0.6], [2.5, 2.3], "#b99c75", .65, .15);
    rundMetall(c, -1.6, 1.1, 1.6, 1.2);
    marke(c, 2.8, 2.7, ap, t, gang);
  } else {
    form(c, g, -b, -.45, [0, 1.3, b, -.52], [b - .22, 1.3], [.14, 2.7, -b + .1, 1.25]);
    faden(c, "#9e7f61", .2, -b + .38, .82, [.02, 2.2, b - .26, .86]);
    if (hinten) rundMetall(c, -.38, .85, 2.0, 1.5);
    else marke(c, .12, 1.45, ap, t, gang);
  }
}

function rundMetall(c: C, x: number, y: number, w: number, h: number) {
  faden(c, "#c6ab7c", .36, x - w / 2, y - h / 2, [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2], [x - w / 2, y - h / 2]);
  faden(c, "#e4c99b", .26, x + .1, y, [x + w / 2 + .1, y]);
}

function nase(c: C, x: number, y: number, w: number, profil: boolean, dunkel: string) {
  c.save(); c.translate(x, y); c.scale(w, w);
  form(c, licht(c, -1, -.6, 2.5, 1.26, "#5a5655", "#2f2c2f", dunkel), -1, -.29,
    [-.91, -.96, .18, -.96, 1, -.64], [1.22, -.11, .6, .4], [.09, .75, -.14, .72], [-.8, .26, -1, -.29]);
  oval(c, "#16181d", profil ? .43 : -.47, -.15, .28, .21, -.28);
  if (!profil) oval(c, "#16181d", .5, -.18, .28, .21, .22);
  faden(c, "#aba09a", .13, -.72, -.54, [-.08, -.88, .45, -.67]);
  for (let j = 0; j < 6; j++) {
    oval(c, "rgba(190,175,162,.22)", -.48 + (j % 3) * .36, -.53 + Math.floor(j / 3) * .21, .06, .035, -.12);
  }
  c.restore();
}

function auge(c: C, x: number, y: number, d: number, ap: boolean, blink: boolean) {
  c.save(); c.translate(x, y); c.scale(d * (ap ? 1.05 : 1), ap ? 1.02 : 1);
  if (blink) {
    faden(c, "#8a7664", .38, -1.68, -.1, [-.23, .72, 1.47, -.12]);
  } else {
    form(c, "#1a1c20", -1.86, .05, [-.4, -2.15, 1.96, -.86], [1.77, .86, -.57, 1.36], [-1.24, .87, -1.86, .05]);
    maske(c, () => {
      oval(c, kugel(c, .02, 0, 1.45, "#c2a16a", "#987747", "#5b4c38", "#302e2b"), .01, -.07, 1.39, 1.47);
      for (let i = 0; i < 14; i++) {
        const a = i * Math.PI * 2 / 14;
        faden(c, "rgba(210,179,116,.38)", .064, Math.cos(a) * .95, -.07 + Math.sin(a) * .96, [Math.cos(a) * 1.25, -.07 + Math.sin(a) * 1.34]);
      }
      oval(c, "#1b2124", .15, -.14, .68, .92);
      oval(c, "#fff3dc", -.26, -.63, .41, .32);
      oval(c, "#e3c89c", .68, .51, .2, .15);
    });
    faden(c, "#786d64", .2, -1.5, .58, [-.1, 1.66, 1.34, .55]);
  }
  form(c, "#625c55", -1.8, -1.45, [-.9, -2.44, .77, -2.32, 1.62, -1.88], [.5, -2.05, -.71, -2.0, -1.8, -1.45]);
  for (let j = 0; j < 4; j++) {
    faden(c, "#7b7164", .082, -1.4 + j * .64, -1.76 - Math.sin(j) * .17, [-1.13 + j * .64, -2.1 - Math.sin(j) * .16]);
  }
  c.restore();
}

/** Seitenkopf: Apollo mit breitem, stumpfem Fang; Odin mit laengerem, schmaler zulaufendem Fang. */
function seitenkopf(c: C, hund: Hund, t: number, _k: number) {
  const ap = hund === "apollo";
  const n = ap ? 8.35 : 10.3;
  c.save();
  const g = licht(c, -5, -7, 16, 11, ap ? F.licht : "#45403d", ap ? F.grund : "#2e2a29", F.dunkel, ap ? F.maske : "#383332");

  if (ap) {
    // Apollos originale Kopfform aus hunde.ts: kraeftiger Stop, kurzer tiefer Fang
    form(c, g, -4.9, 1.8, [-5.7, -2.8, -3.3, -5.1], [-0.6, -6.7, 2.3, -5.3], [4.1, -4.3, 4.2, -2.2],
      [2.6, -2.7], [4.8, -2.4, 7.6, -1.9], [n + 0.5, -1.2, n, 0.6],
      [n - 0.2, 2.7, 6.5, 3.0], [4.4, 3.3, 2.2, 2.5], [1.0, 4.5, -2.6, 3.7], [-4.6, 3.3, -4.9, 1.8]);
  } else {
    // Odins originale Kopfform aus hunde.ts: schmaler, flacher Stop, laengerer Fang
    form(c, g, -4.2, 1.5, [-5.0, -2.4, -2.9, -4.6], [-0.4, -5.8, 1.9, -4.6], [3.2, -3.8, 3.4, -2.0],
      [2.0, -2.5], [3.8, -1.5, n, -0.55], [n + 0.3, 0.4, n - 0.5, 1.2],
      [n - 1.2, 2.2, 5.8, 2.6], [3.8, 2.8, 1.8, 2.2], [0.8, 3.8, -2.2, 3.2], [-4.0, 2.8, -4.2, 1.5]);
  }

  maske(c, () => {
    fell(c, -5, -7, n + 7, 12, 2.5, ap ? 1.4 : 1.7, 83, false, 60);
    if (!ap) {
      // Odin: warmer Schimmer auf Stirn und Nasenruecken
      form(c, "rgba(150,118,88,.16)", 2.0, -3.5, [5.5, -2.4, n - 1.0, -1.5], [n - 1.8, -0.8], [5.0, -1.5, 2.0, -3.5]);
    }
  });

  // Klappohr: Apollo voll, Odin schlank
  if (ap) {
    form(c, F.ohr, -0.9, -4.3, [-5.2, -6.0, -6.6, 0.2], [-5.9, 2.7, -3.3, 1.5], [-1.2, -0.4, -0.4, -2.1]);
    faden(c, "#4a4440", .32, -0.9, -4.3, [-4.8, -5.4, -6.2, 0.2]);
  } else {
    form(c, "#29221e", -0.7, -3.8, [-4.4, -5.2, -5.6, 0.1], [-5.0, 2.3, -2.8, 1.3], [-1.0, -0.3, -0.3, -1.8]);
    faden(c, "#423832", .3, -0.7, -3.8, [-4.0, -4.7, -5.2, 0.1]);
  }

  // Auge
  auge(c, ap ? 2.45 : 2.0, ap ? -1.85 : -1.9, 1, ap, (t + .34) % 5.79 > 5.58);

  // Lefzenlinie
  faden(c, ap ? "#3b3836" : "#4e4238", .42, 3.0, 1.4, [5.5, 1.8, n - 0.2, 0.9]);

  // Schnurrhaarpunkte und feine Tasthaare
  for (let i = 0; i < 5; i++) {
    oval(c, ap ? "#66615a" : "#5b4e44", n - 4.0 + (i % 3) * .85, .15 + Math.floor(i / 3) * .5 + korn(i) * .2, .14, .1);
  }
  for (let i = 0; i < 3; i++) {
    faden(c, "rgba(200,188,170,.45)", .11, n - 3.4 + i * .55, .35 + i * .2,
      [n - 1.8, .7 + i * .3, n - .5 + i * .25, 1.1 + i * .4]);
  }

  // Nasenspitze
  nase(c, n - .1, ap ? -1.15 : -0.55, ap ? 1.45 : 1.25, true, ap ? F.nase : "#231813");
  c.restore();
}

/** Frontalkopf: Apollo mit markanten Wangen, Odin schlanker. */
function frontkopf(c: C, hund: Hund, hinten: boolean, t: number, _k: number) {
  const ap = hund === "apollo", b = ap ? 6.8 : 5.4;
  const g = licht(c, -b, -7, b * 2, 8.0, ap ? F.licht : "#433e3c", ap ? F.grund : "#2e2b2a", F.dunkel, ap ? F.maske : "#373331");

  // Ohren links und rechts
  for (const d of [-1, 1]) {
    form(c, g, d * (b - 1.7), -6.6, [d * (b + 1.4), -7.2, d * (b + 2.6), -4.0],
      [d * (b + 2.5), -.5, d * (b + 1.1), 1.3], [d * (b - .4), -.2, d * (b - .8), -2.4]);
    faden(c, "#5a4e48", .24, d * (b - .3), -6.4, [d * (b + 1.4), -6.0, d * (b + 2.2), -4.4]);
  }

  // Schaedel
  form(c, g, -b * .74, -6.4, [-b * .58, -8.7, -b * .18, -8.7, 0, -8.5],
    [b * .44, -8.9, b * .68, -6.8, b * .74, -4.6], [b * .86, -1.2, b * .78, 1.0, b * .55, 2.8],
    [b * .33, 4.6, -b * .15, 5.0, -b * .45, 3.6], [-b * .76, 2.8, -b * .86, -.2, -b * .74, -3.8], [-b * .72, -4.9, -b * .74, -6.4]);

  maske(c, () => {
    fell(c, -b - 1, -10, b * 2 + 2, 16.0, 1.6, 1.25, 150, false, 80);
  });

  if (hinten) {
    for (let i = 0; i < 7; i++) {
      const xx = -b + 1.0 + i * (b * 2 - 2.0) / 6;
      faden(c, "rgba(145,140,132,.22)", .2, xx * .55, -6.6, [xx * .9, -4.6, xx, -1.7], [xx * .98, .7, xx * .92, 1.6]);
    }
    return;
  }

  const blink = (t + .34) % 5.79 > 5.58;
  for (const d of [-1, 1]) auge(c, d * (ap ? 3.4 : 2.7), -3.9, d, ap, blink);

  // Fang: Apollo breiter, Odin schmaler
  const fb = ap ? 4.0 : 2.8, fy = ap ? 2.1 : 2.6;
  const fang = licht(c, -fb, -1.2, fb * 2, 2.9, ap ? F.maske : "#322e2f", ap ? F.licht : "#453f3c", ap ? F.lefze : "#272528");
  form(c, fang, -fb * .52, -2.0, [-fb * .78, -.56, -fb * 1.04, .49, -fb, fy],
    [-fb * .55, fy + 1.6, -.15, fy + .75], [fb * .35, fy + 1.6, fb * .85, fy + .58],
    [fb * 1.22, fy - .3, fb * .88, -.59, fb * .48, -1.9], [fb * .15, -2.5, -fb * .13, -2.5, -fb * .52, -2.0]);

  // Mundlinie
  faden(c, "#2e2b2f", .35, .07, fy - .62, [.02, fy + .21], [-0.95, fy + 1.45, -fb * .7, fy + .46]);
  faden(c, "#2e2b2f", .35, .02, fy + .21, [1.05, fy + 1.35, fb * .7, fy + .36]);

  // Nase
  nase(c, .05, fy - .85, ap ? 1.7 : 1.4, false, ap ? F.nase : "#231813");
}

function rute(c: C, _ap: boolean, x: number, y: number, w: number, frontal: boolean, nah: boolean) {
  c.save(); c.translate(x, y); c.rotate(w * .085);
  const laenge = frontal ? 8.2 : 9.5;
  const g = licht(c, -laenge, 0, laenge + 1, 4, "#24272e", nah ? "#3f4146" : "#323136", "#252529");
  form(c, g, .55, -1.5, [-laenge * .4, -1.4, -laenge * .48, 5.8, -laenge * .78, 6.8 + w * 1.2],
    [-laenge, 8.0 + w, -laenge - .9, 6.0 + w], [-laenge - .5, 9.4 + w, -laenge * .6, 8.3 + w * .6],
    [-laenge * .26, 7.0, -laenge * .15, 1.4, .58, 1.5]);
  faden(c, "rgba(145,140,128,.35)", .24, -1.4, -.75, [-laenge * .4, -.14, -laenge * .62, 6.2, -laenge * .8, 7.0 + w]);
  c.restore();
}

/** Rumpf in Seitenansicht: exakt die stehende Silhouette von Apollo aus hunde.ts. */
function rumpfSeite(c: C, ap: boolean, sitz: boolean, bob: number) {
  c.save(); c.translate(0, bob);
  const kx = -11.4, ky = -18.2;
  const sx = 8.8, sy = -19.6;
  const hx = 13.8, hy = -24.2;
  const mx = (kx + sx) * 0.5;
  const rueckenY = misch(ky, sy, 0.5) + 0.6;
  const brustX = sx + 4.1; // 12.9
  const brustY = sy + 10.7; // -8.9
  const bauchY = -10.8;
  const kruppeUnten = -10.4;
  const halsDicke = 4.1;

  const y = (px: number, py: number) => py + (sitz ? Math.max(0, Math.min(1, (8 - px) / 20)) * 7.5 : 0);

  c.beginPath();
  c.moveTo(kx - 2.4, y(kx - 2.4, ky + 2.8));
  c.quadraticCurveTo(kx - 1.2, y(kx - 1.2, ky - 0.8), kx + 3.2, y(kx + 3.2, ky - 0.3));
  c.quadraticCurveTo(mx, y(mx, rueckenY), sx - 1.2, y(sx - 1.2, sy - 0.4));
  c.quadraticCurveTo(sx + 1.4, y(sx + 1.4, sy - 1.4), hx - halsDicke, y(hx - halsDicke, hy + 1.4));
  c.lineTo(hx + 1.4, y(hx + 1.4, hy + 4.4));
  c.quadraticCurveTo(brustX + 0.8, y(brustX + 0.8, misch(hy + 4, brustY, 0.55)), brustX - 0.6, y(brustX - 0.6, brustY));
  c.quadraticCurveTo(sx - 1.8, y(sx - 1.8, brustY + 1.2), mx + 1.2, y(mx + 1.2, bauchY));
  c.quadraticCurveTo(kx + 4.4, y(kx + 4.4, bauchY - 0.6), kx + 1.4, y(kx + 1.4, kruppeUnten));
  c.quadraticCurveTo(kx - 2.8, y(kx - 2.8, kruppeUnten - 0.8), kx - 2.4, y(kx - 2.4, ky + 2.8));
  c.closePath();

  const g = licht(c, -11, -20, 24, 15, ap ? F.licht : "#48433e", ap ? F.grund : "#2a2726", F.dunkel, ap ? F.grund : "#322d2c");
  c.fillStyle = g;
  c.fill();

  maske(c, () => {
    // Sanfte Rueckenschattierung
    oval(c, ap ? F.licht : "#373431", mx, y(mx, rueckenY) + 0.6, 11.5, 2.6, Math.atan2(sy - ky, sx - kx));
    oval(c, ap ? F.dunkel : "#191818", mx, y(mx, bauchY) + 0.5, 10.0, 2.6, Math.atan2(sy - ky, sx - kx));

    // Weiche Fellhaare entlang der Rumpf- und Flankenlinie
    fell(c, -14, -22 + (sitz ? 4 : 0), 28, 16, 2.7, 1.8, 241, false, 120);

    if (!ap) {
      // Odin: dezente warmbraune Tiefe am Bauch und an der Kehle
      form(c, "rgba(99,73,53,.22)", brustX - 3.0, brustY - 4.0, [brustX, brustY - 1.0], [mx + 2.0, bauchY + 0.5], [sx - 1.0, brustY - 1.0]);
    }
  });

  c.restore();
}

/** Haupt-Zeichenfunktion fuer Odin und Apollo im Atelier. */
export function zeichneAtelierHund(c: C, hund: Hund, bild: Bild) {
  const { ansicht, pose, zeit: t } = bild;
  const ap = hund === "apollo";
  const profil = ansicht === "links" || ansicht === "rechts";
  const hinten = ansicht === "hinten";
  const gang = pose === "gang";
  const sitz = pose === "sitzen";
  const takt = t * 4.75;
  const w = gang ? Math.sin(takt) : 0;
  const k = pose === "aktion" ? .58 - .42 * Math.cos(t * (ap ? 1.72 : 1.24)) : 0;
  const bob = gang ? -.42 * Math.abs(w) : Math.sin(t * 1.75) * .08;
  const winkel = ap ? -.07 * k + .012 * w : .22 * k + .016 * w;
  const wedel = Math.sin(t * (k ? 6.5 : gang ? 4.0 : 2.2)) * (k ? .88 : .36);

  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  schatten(c, profil ? 18.5 : 10.5, profil ? 2.5 : 2.2);

  if (ansicht === "links" || hinten) c.scale(-1, 1);

  const laeufe = [
    hundeLauf(hund, true, true, bild),
    hundeLauf(hund, false, true, bild),
    hundeLauf(hund, true, false, bild),
    hundeLauf(hund, false, false, bild),
  ];

  if (profil) {
    // 1. Rute (im Hintergrund)
    rute(c, ap, -13.0, -16.8 + (sitz ? 7.5 : 0) + bob, wedel, false, false);

    // 2. Abgewandte Beine
    laufZeichnen(c, hund, laeufe[0], true, false);
    laufZeichnen(c, hund, laeufe[1], true, false);

    // 3. Rumpf (nach Apollos stehender Spielsilhouette)
    rumpfSeite(c, ap, sitz, bob);

    // 4. Zugewandte Beine + Keulenrundung
    oval(c, ap ? F.grund : "#2a2726", -8.8 - 0.4, -15.2 + 0.4 + (sitz ? 6.2 : 0) + bob, 3.8, 4.4, 0.2);
    laufZeichnen(c, hund, laeufe[2], true, false);
    laufZeichnen(c, hund, laeufe[3], true, false);

    // 5. Kopf mit Hals und Halsband
    c.save();
    c.translate(8.8, -19.6 + bob);
    c.rotate(winkel);
    // Hals-Ansatz
    form(c, licht(c, -2, -6, 8, 8, "#3e3d42", "#28292e", "#202126"),
      -2.0, 1.2, [1.0, -2.8, 3.2, -5.2], [5.8, -4.2, 5.0, 0.4], [3.2, 3.2, -2.0, 1.2]);
    halsband(c, hund, true, false, t, gang);
    c.translate(5.0, -4.6);
    seitenkopf(c, hund, t, k);
    c.restore();
  } else {
    // Frontal- oder Rueckansicht
    const breite = 6.8;
    const fLauf = (b: Lauf) => {
      const d = b.fern ? -1 : 1;
      const nah = hinten ? b.hinten : !b.hinten;
      const x = d * (b.hinten ? breite - .5 : breite - 2.0);
      const hub = b.pfote[1] + (b.fern ? 1.4 : .4);
      const fuss: Punkt = [x + d * (b.hinten ? .6 : .1), (nah ? -.2 : -2.0) + hub];
      const u: Lauf = {
        ...b,
        fern: !nah,
        pfote: fuss,
        wurzel: [x * .8, b.wurzel[1]],
        gelenk: [x + d * (b.hinten ? .9 : .3), b.gelenk[1]],
        sprunggelenk: [x + d * (b.hinten ? .8 : .2), fuss[1] - (b.hinten ? (sitz ? 2.5 : 4.2) : 2.8)],
      };
      laufZeichnen(c, hund, u, false, hinten);
    };

    if (!hinten) rute(c, ap, -3.2, -15.5 + (sitz ? 5.5 : 0), wedel, true, false);

    laeufe.filter((l) => l.hinten !== hinten).forEach(fLauf);

    c.save();
    c.translate(0, bob);
    const bas = sitz ? -2.8 : -8.9;
    form(c, licht(c, -breite, -19, breite * 2, 11, "#36353a", "#424147", "#28292e", "#302f34"),
      -breite + .2, -19.2,
      [-breite * 1.15, -14.5, -breite * 1.0, bas - 1.2, -breite * .45, bas],
      [breite * .1, bas + 2.1, breite * .68, bas + .8, breite, bas - 2.4],
      [breite * 1.2, -15.8, breite, -21.0],
      [breite * .45, -23.5, -breite * .62, -23.8, -breite + .2, -19.2]);

    maske(c, () => {
      fell(c, -breite, -22, breite * 2, 22, 1.6, 1.8, 412, false, 80);
    });

    if (ap && !hinten) {
      // Apollos weisses Brustfeld von vorn
      const bw = 3.6;
      form(c, licht(c, -bw, -20, bw * 2, 12, F.schatten, F.brust, F.weiss),
        -bw * .8, -20.5,
        [-bw * 1.1, -16.0, -bw * .9, -13.5],
        [-bw * .6, -11.0, 0, -9.2],
        [bw * .6, -11.0, bw * .9, -13.5],
        [bw * 1.1, -16.0, bw * .8, -20.5]);
      maske(c, () => fell(c, -bw - 0.5, -21.0, bw * 2 + 1.0, 12.0, 1.5, 1.0, 13, true, 35));
    }

    c.restore();

    laeufe.filter((l) => l.hinten === hinten).forEach(fLauf);

    if (hinten) rute(c, ap, -.6, -16.5 + (sitz ? 7.0 : 0), wedel, true, true);

    c.save();
    c.translate(w * .2 + Math.sin(t * 1.42) * k * .35, -22.5 + bob + (ap ? -.4 : 1.2) * k);
    c.rotate(Math.sin(t * 1.4) * .016 + k * (ap ? -.08 : .035));
    halsband(c, hund, false, hinten, t, gang);
    c.translate(0, -3.0 + k * (ap ? -.3 : .5));
    frontkopf(c, hund, hinten, t, k);
    c.restore();
  }

  c.restore();
}
