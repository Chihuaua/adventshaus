import { ZAHN_TAKTE } from "./abendzeiten";
export { ZAHN_TAKTE };

type C = CanvasRenderingContext2D;
type Pt = [number, number];
const tau = 2 * Math.PI;

export type Zahnschritt = keyof typeof ZAHN_TAKTE;
const AM_BECKEN: readonly Zahnschritt[] = ["zPutzen", "zGurgeln", "zSpucken", "zHahnAuf", "zWaschen", "zHahnZu"];
export const ZAHN_WEG = ["zPlatz", "zNehmen", "zTube", "zPaste", "zTubeZurueck", "zZumBecken",
  "zPutzen", "zGurgeln", "zSpucken", "zHahnAuf", "zWaschen", "zHahnZu", "zZumBecher", "zZurueck"] as const;
export const istZahnschritt = (schritt: string | null): schritt is Zahnschritt =>
  schritt !== null && Object.prototype.hasOwnProperty.call(ZAHN_TAKTE, schritt);
const glatt = (p: number) => { const q = Math.min(1, Math.max(0, p)); return q * q * (3 - 2 * q); };
const weg = (a: Pt, b: Pt, p: number): Pt => { const e = glatt(p); return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]; };

export function zahnbild(ph: Zahnschritt, t: number, x: number, f: number, dauer: number = ZAHN_TAKTE[ph]) {
  const p = Math.min(1, t / dauer);
  const stand = x + (AM_BECKEN.includes(ph) ? 4 : 17);
  const rechts: Pt = [stand - 7, f - 23], links: Pt = [stand + 8, f - 23];
  const becher: Pt = [x + 8.8, f - 53], tube: Pt = [x + 27, f - 55];
  const bereit: Pt = [stand - 3, f - 32.5], druecken: Pt = [x + 21.2, f - 43];
  const mund: Pt = [stand + .86, f - 44.1];
  const knauf: Pt = [x + 13, f - 40], strahl: Pt = [x + 17.6, f - 37.2];
  let r: Pt = bereit, l: Pt = links, winkel = -.16, neigung = 0;
  let fluss = 0, schaum = 0, belag = 0;
  const buersteHand = (ph === "zNehmen" ? p >= .5 : ph === "zZurueck" ? p < .53 : true);
  const tubeHand = (ph === "zTube" && p >= .5) || ph === "zPaste" || (ph === "zTubeZurueck" && p < .5);
  const hoch = (a: Pt, fach: Pt, b: Pt, grenze = .5) => p < grenze ? weg(a, fach, p / grenze) : weg(fach, b, (p - grenze) / (1 - grenze));
  switch (ph) {
    case "zNehmen": r = hoch(rechts, becher, bereit); winkel = -Math.PI / 2 + glatt((p - .5) * 2) * (Math.PI / 2 - .16); break;
    case "zTube": l = hoch(links, tube, druecken); break;
    case "zPaste": l = druecken; belag = glatt((p - .25) / .48); break;
    case "zTubeZurueck": l = hoch(druecken, tube, links); belag = 1; break;
    case "zPutzen": {
      const amMund = glatt(t / .95) * glatt((dauer - t) / .95);
      const hub = Math.sin(t * 14), bogen = Math.sin(amMund * Math.PI);
      winkel = -.25 - .035 * amMund * Math.sin(t * 2.1);
      // Griff auf ihrer rechten Seite (im Bild links), Borsten zum Mund. Der Oberarm bleibt unten.
      const ziel: Pt = [mund[0] - 7.5 * Math.cos(winkel) - 2.4 * Math.sin(winkel) + 1.1 * hub,
        mund[1] - 7.5 * Math.sin(winkel) + 2.4 * Math.cos(winkel) + .34 * Math.sin(t * 2.2)];
      r = weg([stand - 11.5, f - 29.5], ziel, amMund); r[0] -= bogen * 2.1;
      schaum = glatt((t - .55) / 2.6); belag = 1 - .65 * schaum; break;
    }
    case "zGurgeln": schaum = 1; belag = .35; break;
    case "zSpucken": neigung = glatt(p / .33) * (1 - glatt((p - .72) / .28)); schaum = 1 - glatt((p - .36) / .35); belag = .35; break;
    case "zHahnAuf": l = hoch(links, knauf, links); fluss = glatt((p - .45) / .25); belag = .35; break;
    case "zWaschen": {
      const e = glatt(p / .23) * (1 - glatt((p - .80) / .2));
      r = weg(bereit, [strahl[0] + Math.sin(t * 6) * .7, strahl[1]], e);
      winkel -= .03 * e; fluss = 1; belag = .35 * (1 - glatt((p - .25) / .45)); break;
    }
    case "zHahnZu": l = hoch(links, knauf, links); fluss = 1 - glatt((p - .45) / .25); break;
    case "zZurueck": r = hoch(bereit, becher, rechts, .53); winkel -= (Math.PI / 2 - .16) * glatt(p / .53); break;
  }
  const ellbogen: 1 | -1 = ph === "zPutzen" ? -1 : 1;
  return { r, l, p, ph, t, winkel, neigung, buersteHand, tubeHand, fluss, schaum, belag,
    ellbogen, frontal: ph === "zPutzen" || ph === "zGurgeln" };
}
export type Zahnbild = ReturnType<typeof zahnbild>;

function rund(c: C, x: number, y: number, w: number, h: number, r: number, farbe: string) {
  c.fillStyle = farbe; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
}
function punkt(c: C, x: number, y: number, r: number, farbe: string) {
  c.fillStyle = farbe; c.beginPath(); c.arc(x, y, r, 0, tau); c.fill();
}
function zahnbuerste(c: C, x: number, y: number, winkel: number, belag: number) {
  c.save(); c.translate(x, y); c.rotate(winkel);
  rund(c, -3.1, -.85, 11.1, 1.65, .75, "#2b847d");
  rund(c, -2.8, -.7, 4.6, .75, .35, "#bce4d7");
  rund(c, 5.6, -1.65, 3.4, 1.8, .65, "#85d6c4");
  c.fillStyle = "#f3f7ef";
  for (let i = 0; i < 4; i++) c.fillRect(5.8 + i * .75, -2.9, .52, 1.55);
  if (belag > 0) rund(c, 5.7, -3.8, 3.6 * belag, 1.2, .5, "#d6f4ed");
  c.restore();
}
function zahnpasta(c: C, x: number, y: number, kopfUnten: boolean, druck = 0) {
  c.save(); c.translate(x, y); if (kopfUnten) c.rotate(.18); else c.rotate(-.13);
  const b = 2.1 - druck * .35;
  c.fillStyle = "#f6ead4"; c.beginPath(); c.moveTo(-b, -5); c.lineTo(b, -5);
  c.lineTo(b * .78, 2.5); c.lineTo(.85, 3.9); c.lineTo(-.85, 3.9); c.lineTo(-b * .78, 2.5); c.closePath(); c.fill();
  c.fillStyle = "#df8d7b"; c.fillRect(-b, -2, b * 2, 2.6);
  rund(c, -1.1, 3.6, 2.3, 1.8, .4, kopfUnten ? "#e7d5b8" : "#b96a65");
  c.restore();
}

export function zahnfach(c: C, x: number, f: number, z: Zahnbild | null) {
  if (!z?.buersteHand) zahnbuerste(c, x + 8.8, f - 53, -Math.PI / 2, 0);
  rund(c, x + 5.3, f - 55.6, 7, 5.7, 1.4, "#73adc0");
  rund(c, x + 4.9, f - 56.1, 7.8, 1.25, .55, "#b5dce0");
  c.fillStyle = "#cee6df"; c.fillRect(x + 6.5, f - 54.5, .85, 3);
  if (!z?.tubeHand) zahnpasta(c, x + 27, f - 55, false);
}

export function zahnWasser(c: C, x: number, f: number, z: Zahnbild) {
  if (z.fluss || z.ph === "zHahnAuf" || z.ph === "zHahnZu") {
    c.save(); c.translate(x + 13, f - 40); c.rotate(-.3 - z.fluss * 1.1);
    rund(c, -.8, -2.2, 1.6, 3.7, .6, "#91aeb6"); punkt(c, 0, -1.4, .65, "#c9edf1"); c.restore();
  }
  if (!z.fluss) return;
  c.save(); c.globalAlpha *= z.fluss; c.lineCap = "round";
  c.strokeStyle = "#88c8d7"; c.lineWidth = 1.8; c.beginPath();
  c.moveTo(x + 24.6, f - 42.6); c.lineTo(x + 24.7, f - 36.6); c.stroke();
  c.strokeStyle = "#e4f8f5"; c.lineWidth = .7; c.beginPath();
  c.moveTo(x + 24.3, f - 42.5); c.lineTo(x + 24.4, f - 37.1); c.stroke();
  for (let i = 0; i < 3; i++) {
    const u = (z.t * 2.7 + i / 3) % 1;
    punkt(c, x + 24.7 + (i - 1) * u * 3.0, f - 36.5 - Math.sin(Math.PI * u) * 1.7, .55, "#c9eef0");
  }
  c.restore();
}

export function zahnHandobjekte(c: C, z: Zahnbild, hand: Pt, andere: Pt, x: number, f: number) {
  if (z.buersteHand) zahnbuerste(c, ...hand, z.winkel, z.belag);
  if (z.tubeHand) zahnpasta(c, ...andere, true, z.ph === "zPaste" ? Math.sin(Math.PI * z.p) : 0);
  if (z.ph === "zPaste" && z.p > .24 && z.p < .77) {
    c.strokeStyle = "#c4e9dc"; c.lineWidth = 1.05; c.beginPath(); c.moveTo(andere[0] - .7, andere[1] + 5);
    c.quadraticCurveTo(hand[0] + 7, hand[1] - 5, hand[0] + 7.4, hand[1] - 3.9); c.stroke();
  }
  if (z.ph === "zSpucken" && z.p >= .38 && z.p <= .75) {
    const u = (z.p - .38) / .37;
    for (let i = 0; i < 3; i++) {
      const k = Math.min(1, Math.max(0, (u - i * .09) * 1.22));
      if (k > 0 && k < 1) punkt(c, x + 11 + k * 6, f - 43.2 + 6.8 * k * k, .72 - i * .13, "#d7e9df");
    }
  }
}