import { ellbogen, faden, form, glied, licht, misch, naht, oval, rund, sanft, schatten, type Bild, type C, type Punkt } from "./stift";

import { hosenbein, kurierGesicht, kurierHub } from "./kurier-anatomie";

/** Der menschliche Briefkurier traegt die Postfarben auch auf seiner Tour im Schwebetransporter. */
function brief(c: C, x: number, y: number, s: number, a: number) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  form(c, "#9b8c75", -5.4, -3.7, [5.5, -3.7], [5.5, 3.85], [-5.4, 3.85]);
  form(c, licht(c, -5, -4, 10, 7, "#fff5d6", "#e7dcb9"), -5.3, -3.73, [5.37, -3.73], [5.37, 3.45], [-5.3, 3.45]);
  faden(c, "#b7a98c", .25, -5.25, 3.32, [-.28, -.65], [5.27, 3.23]);
  form(c, "#f8efd5", -5.28, -3.66, [5.29, -3.66], [.35, .55, -.24, .64]);
  faden(c, "#b9a78a", .37, -5.2, -3.5, [-.15, .59], [5.2, -3.5]);
  oval(c, "#c46a4e", -.12, .63, .86, .83); oval(c, "#e5a074", -.29, .43, .38, .39);
  for (let i = 0; i < 3; i++) faden(c, "#547f83", .21, -4.49 + i * .84, 2.01, [-4.17 + i * .84, 2.01]);
  c.restore();
}

function tasche(c: C, x: number, y: number, s: number, schwingung: number, rueck: boolean) {
  c.save(); c.translate(x, y); c.rotate(-.1 + schwingung); c.scale(s, s);
  form(c, licht(c, -10, 0, 22, 9, "#6a3d31", "#ac6547", "#914d37", "#69372e"), -10.3, -.9,
    [-4, -2.05, 9.6, -.6], [11.3, 8.9, 9.5, 16.1], [2.1, 18.1, -8.7, 16.6], [-10.9, 14.3, -10.3, -.9]);
  brief(c, -4.1, -.69, .83, -.16); brief(c, 2.73, -.7, .94, .075);
  form(c, "#775039", -9.8, 1.1, [5.9, .12, 10.2, 2.32], [10.2, 9.2], [1.4, 10.9, -9.72, 8.71]);
  form(c, licht(c, -9.9, 1, 20, 8, "#d19558", "#e4ad6b", "#bd7e4c"), -10.2, -.15,
    [-3.1, 1.32, 9.8, .47], [10, 7.6], [3.3, 9.72, -9.34, 7.87]);
  naht(c, [-8.8, 7.17], [8.99, 7.8], "#f3cf91", 1.08, .23);
  for (const d of [-1, 1]) {
    rund(c, "#5a4437", d * 6.3 - .82, 7.19, 1.6, 4.9, .62);
    rund(c, "#bcaa7a", d * 6.3 - 1.37, 8.15, 2.64, 1.93, .45);
    rund(c, "#64533e", d * 6.3 - .84, 8.52, 1.66, .91, .22);
  }
  if (!rueck) {
    // Das Emblem ist ein gefalteter Papierlaeufer, keine aufgesetzte Beschriftung.
    form(c, "#f4e8bb", -4, 3.16, [4.4, 2.77], [.62, 5.7], [-.38, 4.34], [-4, 3.16]);
    faden(c, "#a88053", .25, -.38, 4.34, [3.7, 3.02]);
  }
  naht(c, [-8.84, 9.84], [-8, 15.12], "#cfa173", .97, .19);
  faden(c, "#cd9a65", .54, -8.8, 15.5, [-.8, 17.64, 8.98, 15.14]);
  faden(c, "#8e6041", .42, -6.6, 14.7, [-2.5, 12.8, .6, 13.5]);
  c.restore();
}

function poncho(c: C, profil: boolean, hinten: boolean) {
  const breite = profil ? .83 : 1; c.save(); c.scale(breite, 1);
  form(c, licht(c, -13, -44, 25, 9, "#263b47", "#466168", "#42585f", "#24363f"), -6.6, -49.9,
    [-12.4, -47.1, -13.7, -43.13], [-12.66, -33.82, -13.41, -26.15], [-4.61, -22.76, 10.9, -25.38],
    [11.4, -30, 10.23, -34.67], [12.18, -41.19, 9.73, -46.43], [5.17, -50.56, -6.6, -49.9]);
  for (let i = -2; i < 3; i++) {
    const x = i * 4.16;
    faden(c, "rgba(143,166,159,.28)", .38, x, -40.61, [x + .8, -34.1, x - .11, -27.1]);
  }
  faden(c, "#7a9993", .66, -12.51, -27.42, [-3.48, -24.72, 10.62, -26.71]);
  const ocker = licht(c, -16, -50, 31, 9, "#bd7547", "#f0b36a", "#e6a15c", "#b96f49");
  form(c, ocker, -8.22, -50.4, [-13.88, -50.33, -17.22, -41.09], [-11.3, -38.88, -7.28, -40.07],
    [1.19, -37.58, 5.25, -39.05], [10.31, -37.97, 15.26, -40.23], [13.35, -47.62, 6.38, -50.8]);
  faden(c, "#f8d79b", .68, -16.44, -41.43, [-11.29, -39.55, -7.21, -40.79], [1.7, -38.38, 5.47, -39.77], [10.89, -38.82, 14.92, -40.69]);
  for (const d of [-1, 1]) {
    naht(c, [d * 7.5, -48.71], [d * 12.7, -41.64], "#ad724b", 1.08, .22);
    faden(c, "#93ccc0", 1.04, d * 9.93, -43.42, [d * 12.94, -42.86]);
  }
  if (hinten) {
    form(c, "#e7ad68", -6.6, -50.69, [-2.1, -52.3, 7.42, -50.02], [8.66, -44.68, 2.41, -41.31], [-4.68, -41.86, -6.6, -50.69]);
    faden(c, "#aa7048", .52, -.52, -50.91, [2.12, -45.92, 2.41, -42.23]);
    naht(c, [.19, -49.61], [2.8, -43.5], "#f5d199", .86, .2);
  } else {
    faden(c, "#304652", 3.07, -9.49, -47.73, [1.79, -35.12, 10.66, -28.87]);
    faden(c, "#b0b4a2", .41, -10.13, -47.07, [.75, -35.26, 10.11, -28.46]);
    c.save(); c.translate(-.58, -38.53); c.rotate(-.71); rund(c, "#ccbd88", -1.97, -1.66, 3.94, 3.32, .42);
    rund(c, "#405761", -1.14, -.88, 2.28, 1.76, .18); c.restore();
    form(c, "#f7eed2", 5.21, -44.87, [11.31, -45.61], [7.95, -42.3], [7.12, -43.7]);
  }
  // Sortierfach am Saum: gelochte Briefkante, Reissverschlusszaehne und ein reflektierender Streifen.
  if (!hinten) {
    form(c, "#304957", -10.57, -32.84, [-3.79, -32.27], [-3.62, -27.75], [-8.64, -27.83, -10.78, -29.21]);
    faden(c, "#92b7b2", .48, -10.47, -32.86, [-3.61, -32.14]);
    for (let i = 0; i < 8; i++) faden(c, "#bfb299", .21, -10.18 + i * .76, -32.55 + i * .07, [-9.97 + i * .76, -32.07 + i * .07]);
    rund(c, "#d1a573", -5.21, -32.3, .92, 1.95, .33);
    for (let i = 0; i < 4; i++) faden(c, i < 3 ? "#a1ddd0" : "#597e85", .43, -9.72 + i * 1.02, -29.44, [-9.4 + i * 1.02, -30.39]);
  }
  c.restore();
}

function arm(c: C, s: Punkt, e: Punkt, h: Punkt, fern: boolean, mitBrief: boolean, seitlich: boolean, greifen: boolean) {
  const farbe = fern ? "#8eaa85" : "#aac199";
  glied(c, s, e, 2.9, 2.01, licht(c, s[0] - 1, s[1], 7, 8, "#344a55", "#597275", "#3c535b"));
  const bu: Punkt = [misch(e[0],h[0],.85),misch(e[1],h[1],.85)];
  glied(c, e, bu, 2.53, 1.82, licht(c,e[0]-2,e[1],5.2,4.3,"#344b54","#5b7377","#3e555d"));
  glied(c, bu, h, 1.43, 1.15, farbe);
  faden(c, "#8ea4a0", .32, e[0] - .67, e[1] + .2, [bu[0] - .51, bu[1] - .57]);
  if (!fern) {
    const bx = misch(e[0], h[0], .71), by = misch(e[1], h[1], .71);
    c.save(); c.translate(bx, by); c.rotate(Math.atan2(h[1] - e[1], h[0] - e[0]) - Math.PI / 2);
    rund(c, "#3b4a48", -2.02, -2.27, 4.04, 4.12, .64); rund(c, "#658d8b", -1.53, -1.78, 3.06, 2.86, .34);
    form(c, "#b4e4d1", -1.11, -1.29, [1.09, -1.29], [1.09, .46], [-1.11, .46]);
    faden(c, "#476b68", .18, -1.08, -1.21, [0, -.22], [1.07, -1.21]); c.restore();
  }
  if (mitBrief) brief(c, h[0] + (seitlich ? 2.7 : .3), h[1] - 3.1, 1.02, -.18);
  c.save(); c.translate(...h); c.rotate(Math.atan2(h[1]-e[1],h[0]-e[0])-Math.PI/2); c.scale(fern ? -1 : 1,1);
  oval(c,farbe,0,0,1.75,2.17,-.08);
  for (let j=0;j<4;j++) { const x=-1.28+j*.82, y=(mitBrief||greifen ? 1.86 : 3.22)+Math.sin(j/3*Math.PI)*.6;
    faden(c,farbe,.76,x*.91,.54,[x+.08,y-.92,x+.05,y]);
    faden(c,"#889f7c",.14,x-.19,1.3,[x+.15,1.38]); }
  faden(c,farbe,.9,-1.38,-.64,[-2.37,-.37,-2.4,1.19]); c.restore();
}

export interface KurierAuftrag {
  takt?: number; sitz?: number; griff?: Punkt; paket?: boolean; gruss?: number; blink?: boolean;
  uebergabe?: number; ohneSchatten?: boolean; paketZeichnen?: (c: C, mitte: Punkt) => void;
}
export function kurierPaket(c: C, [x,y]: Punkt) {
  c.save(); c.translate(x,y);
  form(c,licht(c,-8,-6,17,12,"#df7862","#bb504d","#94434a"),-8,-5.9,[7.9,-5.9],[7.9,5.9],[-8,5.9]);
  form(c,"#e39a7b",-8,-5.9,[-5.76,-7.27],[9.71,-7.27],[7.9,-5.9]);
  form(c,"#803e42",7.9,-5.9,[9.71,-7.27],[9.71,4.47],[7.9,5.9]);
  c.fillStyle="#e6c486"; c.fillRect(-1.42,-5.9,2.24,11.8); c.fillRect(-8,-.72,15.9,1.59);
  faden(c,"#f1d99c",.72,-.28,-6.06,[-5.36,-9.28,-4.2,-10.56],[-1.83,-10.59,-.28,-6.06],[2.7,-10.63,4.94,-9.41],[4.75,-7.35,-.28,-6.06]); c.restore();
}
export function zeichneBriefkurier(c: C, { ansicht, zeit: t, pose }: Bild, auftrag: KurierAuftrag = {}) {
  const profil = ansicht === "links" || ansicht === "rechts", hinten = ansicht === "hinten", taschenseite = ansicht === "links";
  const takt = auftrag.takt ?? t * 5.16, w = pose === "gang" ? Math.sin(takt) : 0, hub = kurierHub(takt,pose === "gang");
  const p = t % 6.7, reichen = pose === "aktion" ? sanft((p - .45) / 1.15) * (1 - sanft((p - 4.4) / 1.28)) : 0;
  const sitz = Math.max(0,Math.min(1,auftrag.sitz??0)), spiegel = ansicht === "links" || hinten ? -1 : 1;
  const oben = -7.7 - hub + Math.sin(t*1.67)*.17 + sitz*10.3;
  c.save(); c.lineCap = "round"; c.lineJoin = "round"; if (!auftrag.ohneSchatten) schatten(c, 14.6, 2.75);
  if (ansicht === "links" || hinten) c.scale(-1, 1);
  hosenbein(c, profil, -1, takt, pose === "gang", sitz, hub, true, hinten);
  hosenbein(c, profil, 1, takt, pose === "gang", sitz, hub, false, hinten);
  c.translate(0, oben);
  form(c,"#454e55",-8.3,-29,[8,-29],[8.2,-23.9],[2.29,-23.45],[0,-24.78],[-2.11,-23.7],[-8.56,-23.96]);
  const bx = (profil ? 10.3 : 0) + (auftrag.uebergabe??0)*4.1, by = -32.02 - (auftrag.uebergabe??0)*2.3;
  const ab: Punkt = [profil ? 1.7 : -10.1, -45.65];
  const hb: Punkt = auftrag.paket ? [bx - 6.63,by + 2.6] : [profil ? -2.5 - w * 4.37 : -12.92, -27.56];
  const eb = ellbogen(ab,hb,10.55,10.06,1);
  arm(c, ab, eb, hb, true, false, profil, !!auftrag.paket);
  if (!taschenseite && !hinten) tasche(c, profil ? -10.6 : 12.81, -32.81, .81, -.071 * w, false);
  poncho(c, profil, hinten);
  if (taschenseite || hinten) tasche(c, profil ? -9.21 : -7.7, -32.6, .88, -.08 * w, hinten);
  const sh: Punkt = [profil ? 3 : 10.69, -45.65];
  if (auftrag.paket && !hinten) (auftrag.paketZeichnen??kurierPaket)(c,[bx,by]);
  const heben = auftrag.gruss??0;
  const hand: Punkt = auftrag.griff ? [auftrag.griff[0]*spiegel,auftrag.griff[1]-oben]
    : auftrag.paket ? [bx + 6.98, by + 2.27]
    : [misch(profil ? 6.34 + w * 4.5 : 12.1, profil ? 18.3 : 19.72, reichen) + heben*2.78,
      misch(-27.95 + w, -40.6, reichen)-heben*24.65];
  const el = ellbogen(sh, hand, 10.55, 10.06, profil ? 1 : -1);
  arm(c, sh, el, hand, false, reichen > .04 && !hinten && !auftrag.paket && !auftrag.griff, profil, !!auftrag.griff||!!auftrag.paket);
  kurierGesicht(c, profil, hinten, t, w - reichen * .88, !!auftrag.blink); c.restore();
}