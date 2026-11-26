import { ZAHN_TAKTE } from "./abendzeiten";
export { ZAHN_TAKTE };

type C = CanvasRenderingContext2D;
type Pt = [number, number];
const tau = 2 * Math.PI;

export type Zahnschritt = keyof typeof ZAHN_TAKTE;
/** Kurze Probe (Bett-Stein): dieselben Schritte in wenigen Sekunden. */
export const ZAHN_PROBE: Record<Zahnschritt, number> = {
  zNehmen: 1.5, zTube: 1.3, zPaste: 1.4, zTubeZurueck: 1.3, zPutzen: 8.4,
  zGurgeln: 1.9, zSpucken: 1.6, zHahnAuf: 1.0, zWaschen: 3.0, zHahnZu: 1.0, zZurueck: 1.6,
  zHandWasser: 2.4, zMundNehmen: 1.4, zMundSpuelen: 3.2, zMundSpucken: 1.1, zMundZurueck: 1.4,
};
/**
 * Standplätze: Am Spiegelschrank steht Luni rechts vom Becher; die hintere Hand nimmt die Bürste aus dem Becher
 * (hinter ihrem Kopf), die vordere die Tube. Vor dem Bauch wechselt die Bürste in die vordere Hand, mit der sie
 * am Becken putzt und auswäscht. So greift nie ein Arm quer über den Körper oder vor das Gesicht.
 */
export const ZAHN_STAND = { schrank: 17, becken: 4 } as const;
/** Die Tube liegt im Spiegelschrank vorn rechts, in Reichweite der vorderen Hand. */
const TUBE_X = 24;
const AM_BECKEN: readonly Zahnschritt[] = ["zPutzen", "zGurgeln", "zSpucken", "zHahnAuf", "zWaschen", "zHahnZu", "zHandWasser", "zMundSpucken"];

/** Morgens: Bürste, Wasser aus der Hand, dann das mintfarbene Mundwasser – in dieser Reihenfolge. */
export const ZAHN_MORGEN: readonly string[] = [
  "zNehmen", "zTube", "zPaste", "zTubeZurueck", "zZumBecken", "zPutzen", "zSpucken",
  "zHahnAuf", "zHandWasser", "zHahnZu", "zMundNehmen", "zMundSpuelen", "zMundSpucken", "zMundZurueck", "zZurueck",
] as const;
export const ZAHN_WEG = ["zPlatz", "zNehmen", "zTube", "zPaste", "zTubeZurueck", "zZumBecken",
  "zPutzen", "zGurgeln", "zSpucken", "zHahnAuf", "zWaschen", "zHahnZu", "zZumBecher", "zZurueck"] as const;
export const istZahnschritt = (schritt: string | null): schritt is Zahnschritt =>
  schritt !== null && Object.prototype.hasOwnProperty.call(ZAHN_TAKTE, schritt);
const glatt = (p: number) => { const q = Math.min(1, Math.max(0, p)); return q * q * (3 - 2 * q); };
const weg = (a: Pt, b: Pt, p: number): Pt => { const e = glatt(p); return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]; };
const mische = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const zahl = (a: number, b: number, k: number) => a + (b - a) * k;
const dreh = ([x, y]: Pt, w: number): Pt => [x * Math.cos(w) - y * Math.sin(w), x * Math.sin(w) + y * Math.cos(w)];

/* ------------------------------ Putzprogramm ------------------------------ */

/** Bewegungen beim Putzen: links-rechts, kreisen, hintere Zähne und zwischendurch ausspucken. */
type PutzArt = "quer" | "kreise" | "hinten" | "spucken";
/** Art, Sekunden, Tempo (Bürstenstriche je Sekunde) */
type Putzschritt = readonly [PutzArt, number, number];
const PUTZ_LANG: readonly Putzschritt[] = [
  ["quer", 8, 2.4], ["kreise", 6, 1.2], ["quer", 5, 1.6], ["hinten", 7, 2.2], ["spucken", 4.5, 0],
  ["kreise", 5, 1.5], ["quer", 7, 2.9], ["hinten", 6, 1.8], ["quer", 5, 2.2], ["spucken", 4.5, 0],
];
const PUTZ_KURZ: readonly Putzschritt[] = [["quer", 2.2, 2.5], ["kreise", 1.7, 1.3], ["spucken", 1.6, 0], ["quer", 1.6, 2.8]];
/** Bürstenkopf gegenüber der Hand, wenn die Bürste nach links in den Mund zeigt (Winkel PUTZ_WINKEL). */
const PUTZ_WINKEL = -3.24;

interface PutzStand {
  art: PutzArt; tau: number; len: number; f: number; zyklen: number; spuckt: number;
  vorige: Putzschritt | null; vorigeLen: number; spuckEnde: number | null; kurz: boolean;
}

function putzStand(t: number, dauer: number, ein: number): PutzStand {
  const kurz = dauer <= 15;
  const folge = kurz ? PUTZ_KURZ : PUTZ_LANG;
  const summe = folge.reduce((s, a) => s + a[1], 0);
  const skala = kurz ? Math.max(.05, (dauer - 2 * ein) / summe) : 1;
  let rest = Math.max(0, t - ein), zyklen = 0, spuckt = 0, vorigeLen = 0, ab = ein;
  let vorige: Putzschritt | null = null, spuckEnde: number | null = null;
  for (let i = 0; ; i++) {
    const s = folge[i % folge.length], len = s[1] * skala;
    if (rest < len || (kurz && i === folge.length - 1) || i > 400) {
      const tauIn = Math.min(rest, len);
      return { art: s[0], tau: tauIn, len, f: s[2], zyklen: zyklen + tauIn * s[2], kurz,
        spuckt: spuckt + (s[0] === "spucken" && tauIn >= len * .5 ? 1 : 0), vorige, vorigeLen, spuckEnde };
    }
    rest -= len; zyklen += len * s[2]; ab += len;
    if (s[0] === "spucken") { spuckt++; spuckEnde = ab; }
    vorige = s; vorigeLen = len;
  }
}

/** Versatz der Bürstenhand gegenüber der Putzstellung am Mund. */
function putzVersatz(art: PutzArt, zeit: number, f: number): Pt {
  const w = tau * f * zeit;
  switch (art) {
    case "quer": return [1.6 * Math.sin(w), .22 * Math.sin(2 * w)];
    case "kreise": return [1.05 * (Math.cos(w) - 1), .8 * Math.sin(w)];
    case "hinten": return [-2.1 + .9 * Math.sin(w), .3];
    default: return [0, 0];
  }
}

/* ------------------------------ Zahnbild ------------------------------ */

export function zahnbild(ph: Zahnschritt, t: number, x: number, f: number, dauer: number = ZAHN_TAKTE[ph], drehung = 0) {
  const p = Math.min(1, t / dauer);
  const st = x + (AM_BECKEN.includes(ph) ? ZAHN_STAND.becken : ZAHN_STAND.schrank);
  // Ruhestellung beider Hände, je auf ihrer eigenen Körperseite, mit fast gestrecktem Arm.
  const ruheNah: Pt = [st + 6.2, f - 20.5], ruheFern: Pt = [st - 6.2, f - 20.5];
  // Am Becken hält die vordere Hand die Bürste locker an der Seite.
  const halten: Pt = [st + 6.6, f - 19.8];
  const becher: Pt = [x + 8.8, f - 53], tube: Pt = [x + TUBE_X, f - 51.7];
  // Am Schrank: die hintere Hand hält die Bürste vor dem Körper, zum Auftragen aufrecht; die Tube wird darüber gedrückt.
  // Der vordere Arm (linke Bildseite) bleibt nah an der Körpermitte, damit er nicht quer vor der Brust liegt.
  const haltenFern: Pt = [st + 1.5, f - 27], aufrecht: Pt = [st + 2, f - 26], uebergabe: Pt = [st + 3, f - 30];
  const kopfAufrecht = dreh([7.4, -3.3], -1.25);
  const druecken: Pt = [aufrecht[0] + kopfAufrecht[0] + .6, aufrecht[1] + kopfAufrecht[1] - 7.5];
  const mund: Pt = [st + .86, f - 44.1];
  const knauf: Pt = [x + 13, f - 40], strahl: Pt = [x + 17.6, f - 37.2];
  // Das mintfarbene Mundwasser steht im Spiegelschrank rechts neben der Tube.
  const flasche: Pt = [x + 26.5, f - 52.2];
  let flascheHand = false, handWasser = 0, nicken = 0;
  // r = Hand mit der Bürste, l = die andere Hand; buersteNah: Bürste im vorderen Arm (sonst im hinteren).
  let r: Pt = halten, l: Pt = ruheFern, buersteNah = true, winkel = -.35, neigung = 0, tubeWinkel = 1.45;
  let fluss = 0, schaum = 0, belag = 0, tropfen: number | null = null, strich = 0, spuckt = 0, putzt = false;
  let tropfenVon: Pt = [x + 11, f - 43.2], tropfenNach: Pt = [x + 17, f - 36.4];
  const buersteHand = (ph === "zNehmen" ? p >= .5 : ph === "zZurueck" ? p < .65 : true);
  const tubeHand = (ph === "zTube" && p >= .5) || ph === "zPaste" || (ph === "zTubeZurueck" && p < .4);
  const hoch = (a: Pt, fach: Pt, b: Pt, grenze = .5) => p < grenze ? weg(a, fach, p / grenze) : weg(fach, b, (p - grenze) / (1 - grenze));
  const abschnitt = (von: number, bis: number) => (p - von) / (bis - von);
  switch (ph) {
    case "zNehmen":
      // Die hintere Hand nimmt die Bürste aus dem Becher hinter dem Kopf.
      buersteNah = false; l = ruheNah;
      r = hoch(ruheFern, becher, haltenFern);
      winkel = -Math.PI / 2 + glatt((p - .5) * 2) * (Math.PI / 2 - .35);
      break;
    case "zTube":
      buersteNah = false;
      l = hoch(ruheNah, tube, druecken);
      r = weg(haltenFern, aufrecht, abschnitt(.3, .9));
      winkel = zahl(-.35, -1.25, glatt(abschnitt(.3, .9)));
      tubeWinkel = zahl(1.45, .18, glatt(abschnitt(.5, .75)));
      break;
    case "zPaste":
      buersteNah = false; l = druecken; r = aufrecht; winkel = -1.25; tubeWinkel = .18;
      belag = glatt((p - .25) / .48);
      break;
    case "zTubeZurueck": {
      // Tube zurück, dann wechselt die Bürste vor dem Bauch in die vordere Hand.
      belag = 1;
      tubeWinkel = zahl(.18, 1.45, glatt(abschnitt(.2, .4)));
      buersteNah = p >= .82;
      const nahWeg: Pt = p < .4 ? weg(druecken, tube, p / .4) : p < .82 ? weg(tube, uebergabe, abschnitt(.4, .8)) : weg(uebergabe, halten, abschnitt(.82, 1));
      const fernWeg: Pt = p < .4 ? aufrecht : p < .82 ? weg(aufrecht, uebergabe, abschnitt(.4, .8)) : weg(uebergabe, ruheFern, abschnitt(.82, 1));
      if (buersteNah) { r = nahWeg; l = fernWeg; } else { r = fernWeg; l = nahWeg; }
      winkel = zahl(-1.25, -.35, glatt(abschnitt(.4, .8)));
      break;
    }
    case "zPutzen": {
      const ein = Math.min(.95, dauer * .1);
      const s = putzStand(t, dauer, ein);
      const amMund = glatt(t / ein) * glatt((dauer - t) / ein);
      let v = putzVersatz(s.art, s.tau, s.f);
      if (s.vorige) {
        const uebergang = Math.min(.45, s.len * .3), k = glatt(s.tau / uebergang);
        if (k < 1) v = mische(putzVersatz(s.vorige[0], s.vorigeLen, s.vorige[2]), v, k);
      }
      // Zwischendurch ausspucken: Bürste neben dem Gesicht, über das Becken beugen, danach weiterputzen.
      let aus = 0;
      if (s.art === "spucken") {
        aus = glatt(s.tau / (s.len * .25)) * (1 - glatt((s.tau - s.len * .75) / (s.len * .25)));
        neigung = aus;
        if (s.tau >= s.len * .42 && s.tau <= s.len * .68) tropfen = (s.tau - s.len * .42) / (s.len * .26);
        tropfenVon = [st + 2.5, f - 41.5]; tropfenNach = [x + 15, f - 36.6];
      }
      const kopf = dreh([7.2, -2.1], PUTZ_WINKEL);
      const amZahn: Pt = [mund[0] - kopf[0] + v[0], mund[1] - kopf[1] + v[1]];
      // Ansetzen über die Seite, damit der Ellbogen außen bleibt.
      const seite: Pt = [st + 13.5, f - 31];
      const ziel = mische(amZahn, [st + 9.5, f - 40.5], aus);
      r = amMund < .5 ? weg(halten, seite, amMund * 2) : weg(seite, ziel, (amMund - .5) * 2);
      const wMund = PUTZ_WINKEL + .04 * Math.sin(t * 2.3) * (1 - aus);
      winkel = zahl(1.45, zahl(wMund, -1.9, aus), amMund);
      const aufbau = s.kurz ? .7 : 2.6, basis = glatt((t - ein) / aufbau);
      schaum = s.art === "spucken" ? basis * (1 - .72 * glatt((s.tau - s.len * .38) / (s.len * .14)))
        : s.spuckEnde !== null ? basis * Math.min(1, .28 + .72 * glatt((t - s.spuckEnde) / aufbau)) : basis;
      belag = 1 - .65 * schaum;
      putzt = amMund > .9 && s.art !== "spucken";
      strich = Math.floor(2 * s.zyklen);
      spuckt = s.spuckt;
      break;
    }
    case "zGurgeln": r = halten; winkel = 1.45; schaum = 1; belag = .35; break;
    case "zSpucken":
      r = halten; winkel = zahl(1.45, -.35, glatt(p / .3));
      neigung = glatt(p / .33) * (1 - glatt((p - .72) / .28));
      schaum = 1 - glatt((p - .36) / .35); belag = .35;
      if (p >= .38 && p <= .75) tropfen = (p - .38) / .37;
      break;
    case "zHahnAuf":
      // Den Hahn dreht die Hand mit der Bürste auf; die andere Hand bleibt locker an ihrer Seite.
      r = hoch(halten, [knauf[0] - 1.5, knauf[1] + 1], halten); winkel = zahl(-.35, -1.35, Math.sin(Math.PI * p));
      fluss = glatt((p - .45) / .25); belag = .35; break;
    case "zWaschen": {
      const e = glatt(p / .23) * (1 - glatt((p - .80) / .2));
      r = weg(halten, [strahl[0] + Math.sin(t * 6) * .7, strahl[1]], e);
      winkel = zahl(-.35, -.19, e); fluss = 1; belag = .35 * (1 - glatt((p - .25) / .45)); break;
    }
    case "zHahnZu":
      r = hoch(halten, [knauf[0] - 1.5, knauf[1] + 1], halten); winkel = zahl(-.35, -1.35, Math.sin(Math.PI * p));
      fluss = 1 - glatt((p - .45) / .25); break;
    case "zHandWasser": {
      // Wasser in die hohle Hand unter den Strahl, dann in den Mund; der Kopf nickt leicht.
      const fuellen = glatt(p / .34), trinken = glatt((p - .4) / .34);
      r = p < .34 ? weg(halten, [strahl[0] + 1.2, strahl[1] + 2.4], fuellen)
        : p < .74 ? weg([strahl[0] + 1.2, strahl[1] + 2.4], [mund[0] - .4, mund[1] + 1.2], trinken)
        : weg([mund[0] - .4, mund[1] + 1.2], halten, glatt((p - .74) / .26));
      fluss = p < .6 ? 1 : 1 - glatt((p - .6) / .2);
      handWasser = fuellen * (1 - glatt((p - .68) / .22));
      nicken = trinken * (1 - glatt((p - .8) / .2));
      winkel = zahl(-.35, -.05, trinken); belag = .2;
      break;
    }
    case "zMundNehmen":
      // Die vordere Hand nimmt die Flasche aus dem Schrank; die Bürste ruht in der hinteren.
      buersteNah = false; flascheHand = p >= .45;
      l = hoch(ruheNah, flasche, [st + 3.6, f - 34], .55);
      r = haltenFern;
      break;
    case "zMundSpuelen": {
      // Die hintere Hand setzt die Flasche an den Mund, der Kopf geht in den Nacken.
      const an = glatt(p / .22), halt = glatt((1 - p) / .2);
      buersteNah = false;
      l = mische([st + 3.6, f - 34], [mund[0] + 1.5, mund[1] + 1.1], an * (0.55 + 0.45 * glatt(p / .5)));
      r = [st - 1.5, f - 30];
      winkel = zahl(1.45, .55, an);
      nicken = -an * (1 - glatt((p - .82) / .18));
      handWasser = an * (1 - halt) * 0.35;
      neigung = 0;
      break;
    }
    case "zMundSpucken":
      // Über das Becken beugen und ausspucken; die Flasche bleibt in der hinteren Hand.
      l = [st - 1.5, f - 30];
      r = weg(halten, [st + 3.2, f - 39], glatt(p / .3));
      buersteNah = true;
      neigung = glatt(p / .3) * (1 - glatt((p - .7) / .3));
      flascheHand = p < .8;
      if (p >= .3 && p <= .66) tropfen = (p - .3) / .36;
      tropfenVon = [st + 2.6, f - 41]; tropfenNach = [x + 15.5, f - 36.4];
      break;
    case "zMundZurueck": {
      // Flasche zurück ins Fach, die Bürste wechselt beim Gehen nach vorn.
      buersteNah = p >= .55; flascheHand = p < .55;
      l = p < .55 ? weg([st + 3.6, f - 34], flasche, glatt(p / .55)) : ruheFern;
      r = p < .55 ? [st - 1.5, f - 30] : (buersteNah ? uebergabe : halten);
      break;
    }
    case "zZurueck": {
      // Vor dem Bauch zurück in die hintere Hand, die stellt die Bürste in den Becher hinter dem Kopf.
      buersteNah = p < .3;
      const nahWeg: Pt = p < .3 ? weg(halten, uebergabe, p / .28) : weg(uebergabe, ruheNah, abschnitt(.3, .6));
      const fernWeg: Pt = p < .3 ? weg(ruheFern, uebergabe, p / .28) : p < .65 ? weg(uebergabe, becher, abschnitt(.3, .65)) : weg(becher, ruheFern, abschnitt(.65, 1));
      if (buersteNah) { r = nahWeg; l = fernWeg; } else { r = fernWeg; l = nahWeg; }
      winkel = p < .3 ? -.35 : -.35 - (Math.PI / 2 - .35) * glatt(abschnitt(.3, .65));
      break;
    }
  }
  // Der Schaum ist bewusster sparsam: ein Drittel weniger als früher.
  const schaumWeniger = schaum * (2 / 3);
  return { r, l, p, ph, t, winkel, neigung: neigung + nicken * 0.5, buersteHand, buersteNah, tubeHand, tubeWinkel, fluss,
    schaum: schaumWeniger, belag: belag > 0 ? Math.min(belag, 1 - schaumWeniger * 0.35) : belag,
    tropfen, tropfenVon, tropfenNach, strich, spuckt, putzt,
    /** Mouthwater: Flasche in der Hand, Wasser in der hohlen Hand, Rücken zum Spieler. */
    flascheHand, handWasser, ruecken: drehung > 0.5,
    /** Beide Ellbogen knicken nach außen und unten; kein Arm greift quer über den Körper. */
    ellbogen: 1 as 1 | -1, ellbogenFrei: 1 as 1 | -1,
    frontal: (ph === "zPutzen" || ph === "zGurgeln") && drehung < 0.5 };
}
export type Zahnbild = ReturnType<typeof zahnbild>;

/* ------------------------------ Zeichnen ------------------------------ */

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
/** Mintfarbenes Mundwasser: schlanke Flasche mit hellem Etikett und Schraubkappe. */
function mundwasserFlasche(c: C, x: number, y: number, winkel: number, offen = false) {
  c.save(); c.translate(x, y); c.rotate(winkel);
  rund(c, -1.9, -3.4, 3.8, 7.4, 1.3, "#7fd8c6");
  rund(c, -1.9, -3.4, 3.8, 2.2, 1.1, "rgba(255,255,255,.55)");
  rund(c, -1.5, -.4, 3, 3.4, .9, "#a8ead9");
  rund(c, -.8, -5, 1.6, 1.9, .4, offen ? "#3f8e7c" : "#5fb9a4");
  c.fillStyle = "rgba(255,255,255,.5)"; c.fillRect(-1.5, -2.6, .5, 5.2);
  c.restore();
}
/** Kleine Tube; `offen`: Kappe ab, Öffnung zeigt nach unten (in der Hand). */
function zahnpasta(c: C, x: number, y: number, winkel: number, offen: boolean, druck = 0) {
  c.save(); c.translate(x, y); c.rotate(winkel);
  const b = 2.1 - druck * .35;
  c.fillStyle = "#f6ead4"; c.beginPath(); c.moveTo(-b, -5); c.lineTo(b, -5);
  c.lineTo(b * .78, 2.5); c.lineTo(.85, 3.9); c.lineTo(-.85, 3.9); c.lineTo(-b * .78, 2.5); c.closePath(); c.fill();
  c.fillStyle = "#df8d7b"; c.fillRect(-b, -2, b * 2, 2.6);
  rund(c, -1.1, 3.6, 2.3, 1.8, .4, offen ? "#e7d5b8" : "#b96a65");
  c.restore();
}

export function zahnfach(c: C, x: number, f: number, z: Zahnbild | null) {
  if (!z?.buersteHand) zahnbuerste(c, x + 8.8, f - 53, -Math.PI / 2, 0);
  rund(c, x + 5.3, f - 55.6, 7, 5.7, 1.4, "#73adc0");
  rund(c, x + 4.9, f - 56.1, 7.8, 1.25, .55, "#b5dce0");
  c.fillStyle = "#cee6df"; c.fillRect(x + 6.5, f - 54.5, .85, 3);
  // Die Tube liegt flach neben dem Becher, das Mundwasser rechts daneben.
  if (!z?.tubeHand) zahnpasta(c, x + TUBE_X, f - 51.7, 1.45, false);
  if (!z?.flascheHand) mundwasserFlasche(c, x + 26.5, f - 52.2, 0, !!z);
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

/** Bürste und Tube in den Händen, die Zahnpasta beim Auftragen und die Tropfen beim Ausspucken. */
/** `nah`/`fern`: die gezeichneten Hände des vorderen und des hinteren Arms. */
/** `seite`: nur die Objekte einer Hand zeichnen – die hintere Hand liegt HINTER dem Körper. */
export function zahnHandobjekte(c: C, z: Zahnbild, nah: Pt, fern: Pt, _x: number, _f: number, seite: "beide" | "vorn" | "hinten" = "beide") {
  const hand = z.buersteNah ? nah : fern, andere = z.buersteNah ? fern : nah;
  if (seite === "vorn" && z.buersteNah === false) {
    if (z.flascheHand) mundwasserFlasche(c, ...andere, z.ph === "zMundSpuelen" ? -.5 : .2, true);
    if (z.tubeHand) zahnpasta(c, ...andere, z.tubeWinkel, true, z.ph === "zPaste" ? Math.sin(Math.PI * z.p) : 0);
  }
  if (seite === "hinten") {
    if (z.buersteNah === false) return;
    if (!z.tubeHand && !z.flascheHand) return;
    c.save(); c.globalAlpha = 0.55;
    if (z.tubeHand) zahnpasta(c, ...andere, z.tubeWinkel, true, 0);
    else if (z.flascheHand) mundwasserFlasche(c, ...andere, .2, true);
    c.restore();
    return;
  }
  if (seite !== "beide") {
    if (z.buersteHand) zahnbuerste(c, ...hand, z.winkel, z.belag);
    return;
  }
  if (z.buersteHand) zahnbuerste(c, ...hand, z.winkel, z.belag);
  if (z.tubeHand) zahnpasta(c, ...andere, z.tubeWinkel, true, z.ph === "zPaste" ? Math.sin(Math.PI * z.p) : 0);
  if (z.flascheHand) mundwasserFlasche(c, ...andere, z.ph === "zMundSpuelen" ? -.5 : .2, true);
  if (z.ph === "zPaste" && z.p > .24 && z.p < .77) {
    const duese = dreh([0, 5.3], z.tubeWinkel), kopf = dreh([7.4, -3.3], z.winkel);
    c.strokeStyle = "#c4e9dc"; c.lineWidth = 1.05; c.lineCap = "round"; c.beginPath();
    c.moveTo(andere[0] + duese[0], andere[1] + duese[1]);
    c.lineTo(hand[0] + kopf[0], hand[1] + kopf[1]); c.stroke();
  }
  if (z.handWasser > 0.02) {
    const [hx, hy] = hand;
    c.save(); c.globalAlpha *= Math.min(1, z.handWasser);
    punkt(c, hx + .4, hy - 1.1, 1.5, "#9fd9e8");
    punkt(c, hx + .4, hy - 1.4, .8, "#e6f8fb");
    c.restore();
  }
  if (z.ph === "zMundSpuelen" && z.p > .18) {
    c.save(); c.globalAlpha *= .55;
    punkt(c, z.l[0] + 2.2, z.l[1] - 2.4, 1.15, "#8fe0cb");
    c.restore();
  }
  if (z.tropfen !== null) {
    const [ax, ay] = z.tropfenVon, [bx, by] = z.tropfenNach;
    for (let i = 0; i < 3; i++) {
      const k = Math.min(1, Math.max(0, (z.tropfen - i * .09) * 1.22));
      if (k > 0 && k < 1) punkt(c, ax + (bx - ax) * k, ay + (by - ay) * k * k, .72 - i * .13, "#d7e9df");
    }
  }
}
