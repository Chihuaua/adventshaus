import { ell, kreis, poly, rand, rund, stern, strich, TAU, type C } from "./advent-weltraum";

const BORDEAUX = { grund: "#5a1a1f", bord: "#4d1b20", muster: "ruhig" } as const;

export const ZIMMER_TAPETEN = {
  gaming: BORDEAUX,
  gamingRand: BORDEAUX,
  musik: { grund: "#2c4638", bord: "#22382d", muster: "raute" },
  schlafzimmer: { grund: "#53686a", bord: "#465859", muster: "ruhig" },
  badezimmer: { grund: "#65837b", bord: "#58746e", muster: "fliesen" },
  treppenhaus: { grund: "#af987d", bord: "#99836d", muster: "ruhig" },
  flur: { grund: "#814945", bord: "#6d3e3d", muster: "ruhig" },
  wohnzimmer: { grund: "#506653", bord: "#445746", muster: "ruhig" },
  kueche: { grund: "#c8b48e", bord: "#b39e7b", muster: "ruhig" },
  keller: { grund: "#69665d", bord: "#5d594f", muster: "ruhig" },
} as const;

export type ZimmerTapete = keyof typeof ZIMMER_TAPETEN;

export const WEIHNACHTS_FARBEN = {
  blatttief: "#213a30", blatt: "#34533d", blattlicht: "#4e6a49", nadel: "#819474",
  bordeaux: "#763b41", rot: "#9c4c49", rosa: "#b66d61",
  goldtief: "#886640", gold: "#c2a16a", goldlicht: "#ead3a0",
  creme: "#e6d7bd", leinen: "#cabb9e", kerze: "#fff1cb", bernstein: "#e7ad64",
  holz: "#694a38", holztief: "#4b332b", holzlicht: "#967253",
  samt: ["#40232c", "#814047", "#662e38", "#a45854", "#4d2831"],
  decke: { licht: "#a35d56", flaeche: "#8d4649", tiefe: "#66373d", falte: "#592f38" },
  moebel: {
    sofa: { kasten: "#806b55", lehne: "#ab9476", sitz: "#b49d7e", arm: "#947a61", kissen: "#875052" },
    teppich: ["#794445", "#9c5a4f", "#bf9a76"],
    gaming: { sitzsack: "#8e645a", sitzsacklicht: "#b1816d", fernsehtisch: "#4a3b39", fach: "#65504b", bild: "#82947b" },
    buecher: ["#8f554f", "#b09368", "#627e6b", "#677b82", "#88937b", "#826b79", "#a37667", "#c0b39a"],
    garderobe: ["#9c5c54", "#b89a72", "#626f70"],
    kueche: { front: "#62726b", platte: "#ddd0b9", kuehlschrank: "#e4d8c4", tisch: "#967455" },
    bad: { helleFliese: "#69867e", dunkleFliese: ZIMMER_TAPETEN.badezimmer.grund, boden: "#62776b" },
    boeden: { holz: "#947050", fliesen: "#d9cbb5", gaming: "#5b4745", keller: "#77766a", rauchraum: "#68675e" },
    kellerregal: ["#99835f", "#758367", "#865e55", "#8b7b68"],
  },
  licht: { warm: "255,184,106", weich: "255,218,164", nacht: "255,184,112" },
} as const;

const P = WEIHNACHTS_FARBEN;

export const WEIHNACHTS_ORTE = {
  wohnzimmerLinks: 250,
  sofa: 312,
  adventskranz: 784,
  badkerze: 680,
  kellerkerze: 542,
  buch: 400,
} as const;

export const WEIHNACHTSBAUM_X = (WEIHNACHTS_ORTE.wohnzimmerLinks + WEIHNACHTS_ORTE.sofa - 6) / 2;

type Bereich = readonly [number, number, number, number];

function flaeche(c: C, x: number, y: number, w: number, h: number, farbe: string | CanvasGradient) {
  c.fillStyle = farbe;
  c.fillRect(x, y, w, h);
}

export function ruhigeWeihnachtswand(c: C, x: number, y: number, w: number, h: number, zimmer: ZimmerTapete) {
  const { grund, bord } = ZIMMER_TAPETEN[zimmer];
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  flaeche(c, x, y, w, h, grund);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "rgba(43,28,29,.09)");
  g.addColorStop(0.43, "rgba(242,211,172,.034)");
  g.addColorStop(1, "rgba(43,28,29,.14)");
  flaeche(c, x, y, w, h, g);
  // Unregelmaessige Pinselspuren statt Streifen oder Wiederholungsmuster.
  for (let i = 0; i < Math.round(w * h / 310); i++) {
    const fx = x + rand(i * 3 + 8) * w;
    const fy = y + rand(i * 3 + 9) * h;
    flaeche(c, fx, fy, 1 + rand(i * 3 + 10) * 3, 0.55, i % 2 ? "rgba(248,222,186,.043)" : "rgba(30,19,22,.038)");
  }
  const sockel = zimmer === "keller" ? 16 : 23;
  flaeche(c, x, y + h - sockel, w, sockel, bord);
  flaeche(c, x, y + h - sockel, w, 0.9, "rgba(234,211,160,.26)");
  flaeche(c, x, y + h - 2, w, 2, "rgba(37,25,21,.17)");
  c.restore();
}

function samtbahn(c: C, b: number, l: number) {
  c.moveTo(-5.8, 0);
  c.quadraticCurveTo(1, -0.9, b, 0);
  c.bezierCurveTo(b - 0.4, l * 0.26, b * 0.48, l * 0.51, -0.8, l * 0.63);
  c.bezierCurveTo(-0.1, l * 0.75, b * 0.34, l * 0.87, b * 0.65, l - 0.7);
  c.quadraticCurveTo(0.4, l + 2.1, -7.2, l - 0.3);
  c.bezierCurveTo(-6.3, l * 0.86, -5.6, l * 0.73, -6.8, l * 0.62);
  c.quadraticCurveTo(-8.6, l * 0.33, -5.8, 0);
  c.closePath();
}

/** Legt die beiden Stoffpfade an. Das Wetter benutzt exakt dieselbe Aussparung. */
export function samtvorhangPfade(c: C, x: number, y: number, w: number, h: number) {
  for (const seite of [1, -1]) {
    c.save(); c.translate(seite === 1 ? x : x + w, y - 5.3); c.scale(seite, 1);
    samtbahn(c, Math.min(11.8, w * 0.22), h + 9);
    c.restore();
  }
}

export function goldstangeMitSamt(c: C, x: number, y: number, w: number, h: number) {
  const yy = y - 6.6;
  strich(c, x - 10, yy + 0.8, x + w + 10, yy + 0.8, P.goldtief, 2.3);
  strich(c, x - 10, yy, x + w + 10, yy, P.gold, 1.5);
  for (const ende of [x - 10, x + w + 10]) {
    kreis(c, ende, yy + 0.2, 1.9, P.goldtief);
    kreis(c, ende - 0.25, yy - 0.45, 1.25, P.goldlicht);
  }
  const b = Math.min(11.8, w * 0.22), l = h + 9;
  for (const seite of [1, -1]) {
    c.save(); c.translate(seite === 1 ? x : x + w, y - 5.3); c.scale(seite, 1);
    c.beginPath(); samtbahn(c, b, l);
    const stoff = c.createLinearGradient(-7, 0, b, 0);
    P.samt.forEach((farbe, i) => stoff.addColorStop(i / (P.samt.length - 1), farbe));
    c.fillStyle = stoff; c.fill();
    c.save(); c.clip();
    for (let i = 0; i < 4; i++) {
      const u = (i + 1) / 5;
      const ob = -6 + (b + 6) * u;
      const mitte = -7 + 6.8 * u;
      const unten = -7 + (b * 0.67 + 7) * u;
      c.beginPath(); c.moveTo(ob, 0);
      c.bezierCurveTo(ob - 2, l * 0.35, mitte + 2, l * 0.55, mitte, l * 0.63);
      c.bezierCurveTo(mitte - 0.2, l * 0.77, unten - 2, l * 0.87, unten, l + 1);
      c.strokeStyle = i % 2 ? "rgba(237,165,143,.23)" : "rgba(39,17,29,.27)";
      c.lineWidth = 1.4 + (i % 2) * 0.55;
      c.stroke();
    }
    c.restore();
    strich(c, -7, l * 0.628, -0.8, l * 0.634, P.goldtief, 1.5);
    strich(c, -7, l * 0.625, -1.1, l * 0.63, P.goldlicht, 0.68);
    strich(c, -4.2, l * 0.634, -3.15, l * 0.715, P.gold, 0.75);
    ell(c, -3, l * 0.722, 0.9, 1.5, P.gold);
    c.restore();
  }
}

function warmesLicht(c: C, x: number, y: number, rx: number, ry: number, alpha: number, farbe: string = P.licht.warm) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${farbe},${alpha})`);
  g.addColorStop(0.52, `rgba(${farbe},${alpha * 0.44})`);
  g.addColorStop(1, `rgba(${farbe},0)`);
  flaeche(c, -rx, -rx, rx * 2, rx * 2, g);
  c.restore();
}

export function weihnachtsLichtfleck(c: C, bereich: Bereich, x: number, y: number, rx: number, ry: number, alpha: number, farbe: string = P.licht.warm) {
  c.save(); c.beginPath(); c.rect(...bereich); c.clip();
  warmesLicht(c, x, y, rx, ry, alpha, farbe);
  c.restore();
}

/** Der Lichtpuffer bleibt auf den jeweiligen Raum beschraenkt. */
export function weihnachtsAbendlicht(m: C, a: C, bereich: Bereich, x: number, y: number, str: number, kraft = 1) {
  const [, , w, h] = bereich;
  weihnachtsLichtfleck(m, bereich, x, y, w * 0.78, h * 0.84, str * 0.3 * kraft);
  weihnachtsLichtfleck(a, bereich, x, y, w * 0.69, h * 0.74, str * 0.095 * kraft, P.licht.nacht);
}

function schleife(c: C, x: number, y: number, s: number, farbe: string = P.rot) {
  ell(c, x - 2.0 * s, y - 0.65 * s, 2.3 * s, 1.3 * s, farbe);
  ell(c, x + 2.0 * s, y - 0.65 * s, 2.3 * s, 1.3 * s, farbe);
  poly(c, [[x - 0.5 * s, y], [x - 2.5 * s, y + 3 * s], [x - 0.7 * s, y + 2.4 * s]], farbe);
  poly(c, [[x + 0.5 * s, y], [x + 2.5 * s, y + 3 * s], [x + 0.7 * s, y + 2.4 * s]], farbe);
  kreis(c, x, y, 0.95 * s, P.goldlicht);
}

function paket(c: C, x: number, y: number, w: number, h: number, farbe: string, band: string) {
  rund(c, x, y - h, w, h, 0.85, farbe);
  flaeche(c, x + 1, y - h + 0.9, w - 2, 1.2, "rgba(255,243,214,.19)");
  flaeche(c, x + w * 0.43, y - h, w * 0.15, h, band);
  flaeche(c, x, y - h * 0.68, w, 1.2, band);
  schleife(c, x + w / 2, y - h, 0.54, band);
}

const KUGELN = [[-4, -66], [8, -57], [-10, -49], [4, -44], [14, -36], [-12, -32], [3, -27], [18, -24], [-18, -20], [-5, -17]] as const;

export function wohnzimmerWeihnachtsbaum(c: C, F: number) {
  const x = WEIHNACHTSBAUM_X;
  c.save(); c.translate(x, F);
  ell(c, 1, 0.1, 23.8, 2.75, "rgba(37,25,21,.24)");
  rund(c, -3.4, -19, 6.8, 17, 1.2, P.holz);
  ell(c, 0, -2, 8, 2.4, P.holztief);
  for (let i = 4; i >= 0; i--) {
    const y = -80 + i * 11.5, w = 8.5 + i * 3.8, unten = y + 20;
    c.fillStyle = i % 2 ? P.blatt : P.blatttief;
    c.beginPath(); c.moveTo(0, y - 4);
    c.bezierCurveTo(-w * 0.38, y + 4, -w * 0.52, unten - 9, -w, unten - 2);
    c.quadraticCurveTo(-w * 0.86, unten + 0.75, -w * 0.56, unten - 0.6);
    c.quadraticCurveTo(-w * 0.46, unten + 4.4, -w * 0.09, unten + 2.4);
    c.quadraticCurveTo(w * 0.45, unten + 4.6, w * 0.66, unten - 0.25);
    c.quadraticCurveTo(w * 0.87, unten + 1.5, w, unten - 1.4);
    c.bezierCurveTo(w * 0.51, unten - 8, w * 0.36, y + 5, 0, y - 4);
    c.closePath(); c.fill();
    c.save(); c.clip();
    c.strokeStyle = P.blattlicht; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-w * 0.91, unten - 3);
    c.quadraticCurveTo(-w * 0.35, unten - 1, 1, y + 3); c.stroke();
    for (let j = 0; j < 10; j++) {
      const a = (j - 4.5) / 5;
      const xx = a * w * (0.73 + rand(i * 13 + j) * 0.18);
      const yy = unten - 7 + rand(i * 19 + j) * 7.5;
      strich(c, xx - a * 4, yy - 3, xx, yy, j % 3 ? P.blattlicht : P.nadel, j % 3 ? 0.8 : 0.52);
    }
    c.restore();
  }
  c.lineCap = "round";
  for (const [y, w] of [[-65, 7.7], [-51, 12], [-38, 16.1], [-25, 20.8]]) {
    c.beginPath(); c.moveTo(-w, y + 2);
    c.bezierCurveTo(-w * 0.31, y + 6.9, w * 0.52, y + 5.1, w, y - 0.7);
    c.strokeStyle = P.goldtief; c.lineWidth = 1.65; c.stroke();
    c.strokeStyle = P.gold; c.lineWidth = 0.82; c.stroke();
    for (let i = 0; i < 4; i++) {
      const lx = -w * 0.8 + i * w * 0.55, ly = y + 4.4 - ((i - 1) ** 2) * 0.43;
      if (i % 2 === 0) {
        kreis(c, lx, ly, 2.4, `rgba(${P.licht.weich},.2)`);
        kreis(c, lx, ly, 0.86, P.kerze);
      } else kreis(c, lx, ly, 0.58, P.goldlicht);
    }
  }
  for (const [i, [bx, by]] of KUGELN.entries()) {
    const r = 1.42 + rand(i + 51) * 0.79;
    const farbe = [P.rot, P.gold, P.creme][i % 3];
    strich(c, bx, by - r - 1.05, bx, by, P.gold, 0.55);
    kreis(c, bx, by + 0.45, r + 0.16, P.holztief);
    kreis(c, bx, by, r, farbe);
    kreis(c, bx - 0.46, by - 0.55, 0.56, P.goldlicht);
  }
  warmesLicht(c, 0, -85.7, 14, 14, 0.29, P.licht.weich);
  stern(c, 0, -86, 5.6, P.goldtief);
  stern(c, 0, -86.4, 4.95, P.goldlicht);
  kreis(c, -0.55, -87, 1.1, P.kerze);
  paket(c, -18, -1.4, 13.8, 10.3, P.bordeaux, P.goldlicht);
  paket(c, 6.2, -0.3, 14.7, 9, P.blatt, P.creme);
  paket(c, -5.7, 0.5, 10.6, 6.4, P.leinen, P.rot);
  c.restore();
}

export function wohnzimmerBuch(c: C, x: number, y: number) {
  rund(c, x - 4.7, y - 3.2, 9.4, 4.1, 0.8, P.bordeaux);
  flaeche(c, x - 3.15, y - 1.1, 7.45, 1.25, P.creme);
  strich(c, x + 0.7, y - 1, x + 1, y + 1.7, P.gold, 0.58);
}

function tannenreisig(c: C, x: number, y: number, w: number, h: number, ringsum: boolean) {
  ell(c, x, y + 0.7, w, h, P.blatttief);
  const n = ringsum ? 24 : 12;
  for (let i = 0; i < n; i++) {
    const a = i * TAU / n;
    const xx = x + Math.cos(a) * w * 0.78, yy = y + Math.sin(a) * h * 0.66;
    c.save(); c.translate(xx, yy); c.rotate(a);
    ell(c, 0.5, 0, 2.65, 1.15, i % 2 ? P.blatt : P.blattlicht);
    strich(c, 0.3, 0, 3.35, -0.45, P.blattlicht, 0.64);
    c.restore();
  }
  if (ringsum) return;
  for (const [dx, dy] of [[-3, 0.1], [2, 0.7], [0.9, -1.2]]) kreis(c, x + dx, y + dy, 0.92, P.rot);
}

export function festzweig(c: C, x: number, y: number, breite: number) {
  tannenreisig(c, x, y, breite / 2, 1.3, false);
}

export function weihnachtsWandkranz(c: C, x: number, y: number, r: number, golden = false) {
  c.save(); c.translate(x, y); c.scale(r / 9, r / 9);
  strich(c, 0, -9.5, 0, -12, P.goldtief, 0.8);
  for (const [farbe, breite] of [[golden ? P.goldtief : P.blatttief, 4.5], [golden ? P.gold : P.blatt, 3.1]] as const) {
    c.strokeStyle = farbe; c.lineWidth = breite;
    c.beginPath(); c.arc(0, 0, 7.3, 0, TAU); c.stroke();
  }
  for (let i = 0; i < 20; i++) {
    const a = i * TAU / 20;
    const dx = Math.cos(a), dy = Math.sin(a);
    strich(c, dx * 6.3 + dy * 1.1, dy * 6.3 - dx * 1.1, dx * 9.5, dy * 9.5, golden ? P.goldlicht : P.blattlicht, 0.74);
    if (i % 5 === 1) kreis(c, dx * 7.5, dy * 7.5, 0.96, P.rot);
  }
  schleife(c, 0, 6.3, 0.92);
  for (const dx of [-1.8, 1.8]) {
    poly(c, [[dx - 0.7, 9], [dx + 0.7, 9], [dx + 1.25, 10.9], [dx - 1.25, 10.9]], P.goldlicht);
    kreis(c, dx, 11.05, 0.56, P.gold);
  }
  c.restore();
}

export function weihnachtsstrumpf(c: C, x: number, y: number, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  strich(c, -1.6, 1.2, -1.6, -1.7, P.goldtief, 0.85);
  c.fillStyle = P.rot;
  c.beginPath(); c.moveTo(-3.1, 1.8); c.lineTo(3.1, 1.8); c.lineTo(2.8, 8.5);
  c.quadraticCurveTo(2.6, 12.3, -3.2, 12.6);
  c.quadraticCurveTo(-8.8, 12.9, -8.5, 10.1);
  c.quadraticCurveTo(-8.3, 8, -3.1, 7.6); c.closePath(); c.fill();
  rund(c, -3.65, 0, 7.15, 2.85, 0.8, P.creme);
  for (const [dx, dy] of [[0, -0.6], [-0.7, 0], [0.7, 0], [0, 0.6]]) kreis(c, dx - 0.1, dy + 5.1, 0.55, P.creme);
  kreis(c, -0.1, 5.1, 0.4, P.gold);
  c.restore();
}

export function weihnachtsBettgestell(c: C, x: number, F: number) {
  c.save(); c.translate(x, F);
  // Rein seitliche Darstellung wie beim normalen Bett (kein perspektivischer Zusatz am Bettende).
  rund(c, 0, -52, 8, 52, 3, P.holztief);
  kreis(c, 4, -54, 2.4, P.holz);
  rund(c, 104, -34, 8, 34, 3, P.holztief);
  flaeche(c, 6, -18, 100, 12, P.holz);
  flaeche(c, 6, -16, 100, 1.1, P.holzlicht);
  rund(c, 8, -30, 98, 14, 5, P.leinen);

  rund(c, 9, -42.5, 21, 10, 4.4, P.leinen);
  rund(c, 12, -38, 30, 12, 5.5, P.creme);
  for (const [px, py] of [[16.5, -34.8], [21.5, -32], [27, -34.2], [33.5, -32.4]]) {
    stern(c, px, py, 0.95, P.rosa, 4, 0.47);
  }
  rund(c, 37.5, -37.4, 11, 8.8, 2.1, P.bordeaux);
  poly(c, [[43, -35.9], [40.4, -31.7], [45.6, -31.7]], P.creme);
  flaeche(c, 42.6, -32, 0.8, 1.6, P.goldlicht);
  c.restore();
}

/** Fuellt den bereits angelegten Deckenpfad, ohne seine Bewegungsgeometrie anzutasten. */
export function winterSteppdecke(c: C, x: number, y: number, w: number, h: number, gather: number) {
  const g = c.createLinearGradient(0, y - 4, 0, y + h);
  g.addColorStop(0, P.decke.licht); g.addColorStop(0.55, P.decke.flaeche); g.addColorStop(1, P.decke.tiefe);
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  c.strokeStyle = "rgba(242,204,182,.25)"; c.lineWidth = 0.56;
  const takt = 8 - gather * 2;
  c.beginPath();
  for (let p = -h; p < w + h; p += takt * 1.72) {
    c.moveTo(x + p, y - 7); c.lineTo(x + p + h + 7, y + h);
    c.moveTo(x + p, y - 7); c.lineTo(x + p - h - 7, y + h);
  }
  c.stroke();
  for (let k = 0; k < 3; k++) for (let px = x + 9 + (k % 2) * 4.5; px < x + w - 2; px += 10.5) {
    const py = y + h * (k + 0.75) / 3.7;
    if (k === 1 && Math.round(px) % 2 === 0) stern(c, px, py, 1.15, P.creme, 4, 0.39);
    else kreis(c, px, py, 0.47, P.creme);
  }
  // Helle, kleine Fellnoppen bleiben an der bewegten Nahkante.
  for (let i = 0; i <= w / 2.6; i++) {
    const px = x + i * 2.6;
    const py = y + 1.35 + Math.sin(i * 0.82) * 0.9 - gather * 2.2 * (1 - (px - x) / w);
    kreis(c, px, py, 1.17 + rand(i + 64) * 0.48, i % 3 ? P.creme : P.leinen);
  }
  c.restore();
}

function kerzenschaft(c: C, x: number, y: number, h: number, farbe: string = P.creme) {
  rund(c, x - 1.7, y - h, 3.4, h, 0.85, farbe);
  strich(c, x - 0.7, y - h + 1, x - 0.7, y - 1, "rgba(255,246,214,.31)", 0.6);
  strich(c, x, y - h, x + 0.1, y - h - 1.6, P.holztief, 0.75);
}

function flamme(c: C, x: number, y: number, t: number, s = 1) {
  const w = Math.sin(t * 4.4 + x) * 0.39;
  warmesLicht(c, x, y - 1, 9 * s, 8 * s, 0.22);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = P.bernstein;
  c.beginPath(); c.moveTo(-1.37, -0.75);
  c.quadraticCurveTo(-1.55, -2.1, w, -4.3);
  c.quadraticCurveTo(2.1, -0.85, 0, 0); c.closePath(); c.fill();
  ell(c, 0, -1.1, 0.62, 0.97, P.kerze); c.restore();
}

const KRANZ_KERZEN = [[-8, 8], [-3, 10.6], [3, 9.6], [8, 7.8]] as const;

export function esstischAdventskranz(c: C, F: number) {
  const x = WEIHNACHTS_ORTE.adventskranz, y = F - 37.5;
  ell(c, x, y + 1, 13.3, 2.7, P.holztief);
  tannenreisig(c, x, y, 12.7, 2.85, true);
  for (const [i, [dx, h]] of KRANZ_KERZEN.entries()) kerzenschaft(c, x + dx, y, h, i % 2 ? P.creme : P.bordeaux);
  schleife(c, x - 1.8, y + 1.3, 0.68);
  for (const dx of [-8.2, 5.2, 9.3]) kreis(c, x + dx, y + 1.6, 0.94, P.rosa);
}

// Positionen auf dem ovalen Ring; die Vorderseite verdeckt die Kerzenfüße.
const WOHNKERZEN = [[-19.6, -1.8, 13.0], [12.6, -2.7, 14.7], [23.6, 0.7, 11.4], [-7.8, 2.0, 12.1]] as const;

export function wohnzimmerAdventskranz(c: C, links: number, oben: number, breite: number) {
  c.save(); c.translate(links + breite / 2, oben - 4.0); c.scale(breite / 70, breite / 70);
  ell(c, 0, 3.7, 34.9, 2.5, "rgba(23,40,34,.28)");
  c.lineCap = "round";
  // Ein wirklicher Ring: Durch die Mitte bleibt das Glas der Tischplatte sichtbar.
  c.fillStyle = "#244435"; c.beginPath(); c.ellipse(0, 0, 32.9, 5.6, 0, 0, TAU);
  c.moveTo(19.5, -.55); c.ellipse(0, -.55, 19.5, 2.1, 0, 0, TAU); c.fill("evenodd");
  const zweige = (vorne: boolean) => {
    for (let i = 0; i < 54; i++) {
      const a = i * TAU / 54, s = Math.sin(a), k = Math.cos(a);
      if ((i <= 27) !== vorne) continue;
      const x = k * (25.6 + rand(i + 21) * 1.4), y = s * 3.4;
      const dx = -s * 7.2 + k * 6.7, dy = k * 1.8 + s * 2.8 - .6 * rand(i + 41);
      const laenge = Math.hypot(dx, dy), nx = -dy / laenge, ny = dx / laenge;
      const gruen = ["#3f654c", "#52765a", "#315c46", "#617e61"][i % 4];
      strich(c, x, y, x + dx, y + dy, gruen, .65);
      for (let n = 0; n < 5; n++) for (const seite of [-1, 1]) {
        const u = .05 + n * .16, f = (1.5 + rand(i * 7 + n) * 1.8) * (1 - .48 * u);
        const bx = x + dx * u, by = y + dy * u;
        const spitze = Math.max(-35, Math.min(35, bx + dx * .31 + nx * seite * f));
        poly(c, [[bx, by - .3], [bx + dx * .13 + nx * seite * f * .4, by + dy * .1 + ny * seite * f * .29],
          [spitze, by + dy * .31 + ny * seite * f * .59], [bx + .28, by + .25]],
        seite > 0 && i % 4 === 0 ? "#839c78" : gruen);
      }
    }
    if (vorne) for (const s of [-1,1]) poly(c, [[31.4*s,-.5],[35*s,-1.1],[33.1*s,.65],[30.5*s,1.1]], "#466c51");
  };
  zweige(false);
  for (const [x, y, h] of WOHNKERZEN) {
    ell(c, x, y + .4, 4.45, 1.3, P.gold); ell(c, x, y, 3.8, .92, P.goldtief);
    const wachs = c.createLinearGradient(x - 2.9, 0, x + 2.9, 0);
    wachs.addColorStop(0, "#733646"); wachs.addColorStop(.32, "#c16a63"); wachs.addColorStop(1, "#87424a");
    c.fillStyle = wachs; c.beginPath(); c.roundRect(x - 2.9, y - h, 5.8, h + .25, 1); c.fill();
    ell(c, x, y - h + .3, 2.75, .9, "#df9c88");
    strich(c, x - 1.6, y - h + .7, x - 1.6, y - h + 3.15, "#d58b7b", .77);
    strich(c, x, y - h + .25, x + .12, y - h - 1.65, "#43362b", .75);
  }
  zweige(true);
  // Schuppen auf den kleinen Zapfen, dazwischen Beeren mit einem einzelnen Glanzpunkt.
  for (const [x, y, d] of [[-25.6, 1.35, -.44], [10.2, 2.7, .35]]) {
    c.save(); c.translate(x, y); c.rotate(d);
    ell(c, 0, 0, 2.7, 1.85, "#624534");
    for (let n = 0; n < 5; n++) strich(c, -1.7 + (n % 3) * 1.4, -.7 + Math.floor(n / 3), -1.25 + (n % 3) * 1.4, -.3 + Math.floor(n / 3), "#bb926a", .68);
    c.restore();
  }
  for (const [x, y] of [[-29.8, .5], [-14, 2.8], [4.8, -2.6], [19.1, 2.7], [30.1, .9]]) {
    kreis(c, x - 1.15, y - .65, 1.05, "#934049"); kreis(c, x + .7, y, 1.25, "#b45550");
    kreis(c, x + .3, y - .4, .35, "#efb593");
  }
  c.save(); c.translate(1.7, 3.2);
  for (const s of [-1,1]) {
    c.save(); c.scale(s,1); c.fillStyle = s < 0 ? P.bordeaux : "#a15251";
    c.beginPath(); c.moveTo(.45,-.2); c.bezierCurveTo(3.1,-2.6,7.9,-3.25,7.7,-.55);
    c.bezierCurveTo(7.55,2.3,4.9,2.2,.45,.55); c.fill();
    c.fillStyle = "#69353e"; c.beginPath(); c.moveTo(1.1,.03); c.quadraticCurveTo(4.45,-.85,6.8,-.45);
    c.quadraticCurveTo(4.8,1.13,1.1,.03); c.fill(); c.restore();
  }
  poly(c, [[-.7,.5],[-2.7,4.9],[-3.8,3.7],[-5.15,4.1],[-2.6,.8]], P.bordeaux);
  poly(c, [[.5,.55],[2.9,4.6],[4.1,3.45],[5.35,3.7],[2.3,.5]], P.rot);
  strich(c, -6.7, -1.8, -1, .2, P.gold, .52); strich(c, 1, .2, 6.4, -1.65, P.gold, .52);
  ell(c, 0, .1, 1.65, 1.45, P.goldlicht); c.restore(); c.restore();
}

export function wohnzimmerKranzlicht(c: C, links: number, oben: number, breite: number, t: number, sonntage: number) {
  if (sonntage < 1) return;
  c.save(); c.translate(links + breite / 2, oben - 4.0); c.scale(breite / 70, breite / 70);
  for (const [x, y, h] of WOHNKERZEN.slice(0, sonntage)) flamme(c, x + .12, y - h - 1.3, t, .97);
  c.restore();
}

export function winterBadAblage(c: C, F: number) {
  const x = WEIHNACHTS_ORTE.badkerze, y = F - 45;
  rund(c, x - 12, y, 18, 2.2, 0.6, P.holzlicht);
  festzweig(c, x - 6.7, y - 0.9, 9.6);
  ell(c, x + 1, y - 0.45, 3.3, 0.9, P.goldtief);
  kerzenschaft(c, x + 1, y - 0.75, 6.15);
}

function kleineLichterkette(c: C, x0: number, x1: number, y: number) {
  c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y + 12, x1, y);
  c.strokeStyle = P.blatttief; c.lineWidth = 0.85; c.stroke();
  for (let i = 0; i < 7; i++) {
    const p = (i + 0.5) / 7, x = x0 + (x1 - x0) * p, yy = y + 24 * p * (1 - p) + 0.8;
    kreis(c, x, yy, 2.8, "rgba(255,210,142,.17)");
    kreis(c, x, yy, 0.9, P.goldlicht);
  }
}

export function kellerWinterdeko(c: C, F: number) {
  kleineLichterkette(c, 356, 408, F - 99);
  kleineLichterkette(c, 530, 586, F - 89);
  const x = WEIHNACHTS_ORTE.kellerkerze;
  ell(c, x, F - 92.2, 3.9, 1.1, P.goldtief);
  kerzenschaft(c, x, F - 92.3, 5.4);
  // Der aeussere Haken der Keller-Garderobe bleibt die Aufhaengung.
  weihnachtsstrumpf(c, 662, F - 78, 0.82);
}

export function weihnachtsKerzenflammen(c: C, FE: number, FO: number, FK: number, t: number, sonntage: number) {
  for (const [dx, h] of KRANZ_KERZEN.slice(0, sonntage)) flamme(c, WEIHNACHTS_ORTE.adventskranz + dx, FE - 38.8 - h, t, 0.82);
  flamme(c, WEIHNACHTS_ORTE.badkerze + 1, FO - 53.1, t, 0.75);
  flamme(c, WEIHNACHTS_ORTE.kellerkerze, FK - 99, t, 0.69);
}