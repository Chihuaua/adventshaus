/* Hexenküche im Gruselhaus: gusseiserner Ofen mit bauchigem Kessel.
   Ersetzt den alten Backofen an dessen Platz (Breite 36, Korpus 38).
   Reines Canvas 2D, keine Assets. */
type C = CanvasRenderingContext2D;
type Pt = [number, number];

export const OFEN = {
  x: 690, w: 36, korpus: 38,
  /** Rohr rechts, gespiegelt zur Vorlage; endet oberhalb des Kessels. */
  rohrX: 726, rohrBreite: 5,
  /** Kessel mittig auf dem Ofen. */
  kessel: { x: 708, r: 14, hoehe: 17 },
  kesselStand: 702,
  ofenStand: 708,
} as const;

const EISEN = { dunkel: "#1e2327", mitte: "#353e45", hell: "#4d5960", kante: "#6d7a80", glanz: "#94a2a7" };

const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function rect(c: C, x: number, y: number, w: number, h: number, f: string) { c.fillStyle = f; c.fillRect(x, y, w, h); }
function rr(c: C, x: number, y: number, w: number, h: number, r: number, f: string) { c.fillStyle = f; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function ellipse(c: C, x: number, y: number, rx: number, ry: number, f: string) { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function disc(c: C, x: number, y: number, r: number, f: string) { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function poly(c: C, pts: Pt[], f: string) { c.fillStyle = f; c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.closePath(); c.fill(); }
function line(c: C, a: number, b: number, d: number, e: number, f: string, w = 1) { c.strokeStyle = f; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); }

/** Spitzbogen (oben gotisch, unten offen). */
function spitzbogen(c: C, x: number, y: number, w: number, h: number) {
  c.beginPath();
  c.moveTo(x, y + h); c.lineTo(x, y + h * .4);
  c.quadraticCurveTo(x + w * .22, y + h * .05, x + w / 2, y);
  c.quadraticCurveTo(x + w * .78, y + h * .05, x + w, y + h * .4);
  c.lineTo(x + w, y + h); c.closePath();
}

/** Feuer im Ofenraum. `stark` 0..1 steigt, wenn die Tür offen ist. */
function feuer(c: C, x: number, y: number, w: number, h: number, t: number, stark: number) {
  const a = .55 + stark * .45;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  rect(c, x, y, w, h, "#1a1512");
  const g = c.createRadialGradient(x + w / 2, y + h - 2, 2, x + w / 2, y + h - 2, w * .9);
  g.addColorStop(0, `rgba(255,181,72,${.62 * a})`);
  g.addColorStop(.45, `rgba(232,106,32,${.36 * a})`);
  g.addColorStop(1, "rgba(110,36,12,0)");
  c.fillStyle = g; c.fillRect(x, y, w, h);
  for (const [sx, sy] of [[x + 6, y + h - 2], [x + w - 6, y + h - 2], [x + 4, y + 5], [x + w - 4, y + 5]] as Pt[]) {
    line(c, sx, sy, sx + (sx < x + w / 2 ? 4 : -4), sy + 3, "#3a2a1e", 1.2);
  }
  for (let i = 0; i < 6; i++) {
    const wob = Math.sin(t * (5.4 + i * 1.1) + i * 2.1) * (1 + stark * 1.2);
    const fh = (7 + hash(i + Math.floor(t * 2.6)) * 7) * (.8 + stark * .35);
    const fx = x + 3.5 + i * ((w - 7) / 5) + wob * .45;
    const base = y + h - 1.2;
    poly(c, [
      [fx - 2.2, base], [fx + 2.2, base],
      [fx + 1.3 + wob * .5, base - fh * .5],
      [fx + wob * .7, base - fh],
      [fx - .9 + wob * .3, base - fh * .45],
    ], i % 2 ? `rgba(242,158,44,${.9 * a})` : `rgba(255,216,116,${.95 * a})`);
    if (stark > .5 && i % 2 === 0) {
      const sp = (t * .9 + i * .3) % 1;
      disc(c, fx + wob, base - fh - sp * 8, .55, `rgba(255,206,120,${(1 - sp) * .8})`);
    }
  }
  c.restore();
}

/** Tür: Scharniere links. Geschlossen mit Bogenfenster; offen nach links aufgeschwungen. */
function tuer(c: C, x: number, y: number, w: number, h: number, offen: number) {
  c.save(); spitzbogen(c, x, y, w, h); c.clip();
  rect(c, x, y, w, h, offen < .5 ? "rgba(30,34,38,.35)" : "rgba(10,10,12,0)");
  c.restore();
  if (offen < .98) {
    const d = Math.min(1, (1 - offen) * 1.4);
    c.save(); c.globalAlpha = d;
    // Türblatt
    spitzbogen(c, x + .4, y + .4, w - .8, h - .8);
    c.fillStyle = "#39424a"; c.fill();
    c.strokeStyle = "#5a666d"; c.lineWidth = .8; c.stroke();
    // Bogenfenster: Feuer scheint durch
    spitzbogen(c, x + 3.6, y + 4.2, w - 7.2, h - 7);
    c.fillStyle = "rgba(240,150,54,.20)"; c.fill();
    c.strokeStyle = "#69757a"; c.lineWidth = .6; c.stroke();
    c.restore();
    // Fensterkreuz und Glanz
    line(c, x + w / 2, y + 4.4, x + w / 2, y + h - 3, "rgba(115,128,132,.75)", .7);
    line(c, x + 4, y + h * .56, x + w - 4, y + h * .56, "rgba(115,128,132,.6)", .6);
    // Scharniere links
    for (const yy of [y + 3.5, y + h - 6]) {
      rr(c, x - .9, yy, 3, 3.2, 1, "#8f9a9c");
      disc(c, x + .1, yy + 1.6, .45, "#2b3236");
    }
    // Griff links unter dem Fenster
    disc(c, x + 2.4, y + h * .72, 1, "#b58b3c");
  } else {
    // ganz offen: Türblatt steht links, man sieht nur die Kante
    poly(c, [[x - 1, y + .6], [x + 1.6, y + 1.8], [x + 1.6, y + h - 1], [x - 1, y + h - .4]], "#39424a");
    for (const yy of [y + 4, y + h - 7]) disc(c, x + .3, yy, 1, "#8f9a9c");
  }
  // Türrahmen
  c.save(); spitzbogen(c, x, y, w, h); c.strokeStyle = "#59656b"; c.lineWidth = 1.1; c.stroke(); c.restore();
  // Rostspuren
  for (const [rx, ry] of [[x + 1.5, y + h - 4], [x + w - 2, y + h * .42]]) line(c, rx, ry, rx + 1, ry + 2.4, "#8a5a34", .7);
}

/** Der Ofen. `offen` 0..1 öffnet die Feuertür. */
export function drawOfen(c: C, F: number, t: number, offen: number) {
  const x = OFEN.x, w = OFEN.w, top = F - OFEN.korpus;
  ellipse(c, x + w / 2, F + 1, 22, 2.2, "rgba(12,9,7,.4)");
  // Korpus, unten breiter
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, EISEN.mitte); g.addColorStop(.28, "#465158"); g.addColorStop(.62, EISEN.mitte); g.addColorStop(1, EISEN.dunkel);
  c.fillStyle = g;
  c.beginPath(); c.moveTo(x + 1.2, top); c.lineTo(x + w - 1.2, top); c.lineTo(x + w, F - 3.4); c.lineTo(x, F - 3.4); c.closePath(); c.fill();
  c.strokeStyle = EISEN.kante; c.lineWidth = .8; c.stroke();
  // Deckplatte
  rr(c, x - 1.8, top - 3.4, w + 3.6, 3.8, 1.2, "#48535a");
  rect(c, x - 1.2, top - 3.4, w + 2.4, .9, EISEN.glanz);
  // Feuerraum
  const fx = x + 8, fy = top + 7, fw = w - 16, fh = 20;
  feuer(c, fx - 1.4, fy - 1.4, fw + 2.8, fh + 2, t, offen);
  tuer(c, fx, fy, fw, fh, offen);
  // Aschefach mit zwei Schrauben
  rr(c, x + 9.5, F - 13, w - 19, 7.2, 1.2, "#2a3136");
  rect(c, x + 9.5, F - 13, w - 19, .7, "#566168");
  for (const dx of [12.5, w - 12.5]) disc(c, x + dx, F - 9.4, .65, "#828d90");
  // Nieten und Schatten
  for (const [dx, dy] of [[3.2, top + 3.6], [w - 3.2, top + 3.6], [3.2, F - 17.5], [w - 3.2, F - 17.5]] as Pt[]) {
    disc(c, x + dx, dy, .7, "#8b979a");
    disc(c, x + dx - .2, dy - .2, .3, "#c2ccce");
  }
  line(c, x + 1, F - 3.6, x + w - 1, F - 3.6, "rgba(0,0,0,.35)", 1.2);
  // Füße
  for (const dx of [4, w - 4]) {
    c.strokeStyle = "#262c30"; c.lineWidth = 1.8; c.beginPath();
    c.moveTo(x + dx, F - 3.6); c.quadraticCurveTo(x + dx + (dx < 10 ? -1.4 : 1.4), F - .7, x + dx + (dx < 10 ? -2.8 : 2.8), F - .2);
    c.stroke();
  }
  // Rohr rechts: Steigrohr, Knick nach links, Kappe (gespiegelt zur Vorlage).
  const rx = OFEN.rohrX - OFEN.rohrBreite;
  const rohrTop = top - 25;
  rect(c, rx + .4, rohrTop + 2, OFEN.rohrBreite, top - rohrTop, "#3c474e");
  rect(c, rx + .4, rohrTop + 2, 1.3, top - rohrTop, "#78868b");
  line(c, rx + OFEN.rohrBreite - .8, rohrTop + 3, rx + OFEN.rohrBreite - .8, top - 1, "rgba(14,18,20,.55)", .8);
  // Muffe kurz über der Deckplatte
  rr(c, rx - .5, top - 9, OFEN.rohrBreite + 1, 3.4, .8, "#2b3338");
  // Knick nach links
  rr(c, rx - 10.5, rohrTop + .6, 15.5, 4.4, 1.2, "#3a444b");
  rect(c, rx - 10, rohrTop + .8, 14.6, .8, "#7b898e");
  // Kappe über dem Knickende
  poly(c, [[rx - 10.8, rohrTop + .8], [rx - 1.2, rohrTop + .8], [rx - 3.6, rohrTop - 4.4], [rx - 8.4, rohrTop - 4.4]], "#2a3237");
  rect(c, rx - 8.8, rohrTop - 4.6, 8, 1.1, "#95a2a5");
  disc(c, rx - 4.8, rohrTop - 6, 1, "#20262a");
  // Wandflansch am Steigrohr
  rr(c, x + w - 1.4, rohrTop + 8, 2.8, 5.4, .6, "#2a3136");
  rr(c, x + w - 2, rohrTop + 9.4, 3.4, 1, .4, "#556166");
}

/* =======================================================================
   KESSEL · violetter Trank, Überkochen, Löffel und Zauber
   Nur Canvas-Primitive. Der Ablauf (KesselAblauf) rechnet ausschließlich mit
   dt und ist deshalb von der Bildrate unabhängig und einzeln prüfbar.
   ======================================================================= */

export type KesselPhase = "ruhig" | "steigt" | "ueberlauf" | "sinkt" | "blase";

/** Alle Zeiten in Sekunden. */
export const KESSEL_ZEIT = {
  steigen: 24,        // ruhig -> Kuppel voll: langsam ansteigend
  ueberlaufMax: 15,   // so lange läuft er höchstens über, wenn niemand rührt
  sinkenLangsam: 7,
  sinkenSchnell: 4,   // wenn der Löffel rührt
  blase: 8,           // einzelne Blase am Rand, bevor sie platzt
  platzen: 0.5,
  ruehren: 9,         // so lange rührt der Löffel nach dem Blitz
  pfuetze: 90,        // so lange verdunstet die Pfütze auf der Deckplatte
} as const;

/** Lunis Zauber: Arme ausstrecken, Blitz wächst bis zum Löffel, Zauber halten. */
export const ZAUBER_ZEIT = { arme: 0.6, blitz: 0.9, halten: 4.5, senken: 0.4 } as const;

/** Zeichenzustand des Kessels (nur lesen). */
export interface KesselFx {
  phase: KesselPhase;
  /** 0 ruhig .. 1 Kuppel voll */
  pegel: number;
  /** 0..1 Stärke des Überlaufs */
  fluss: number;
  /** 0..1 wie weit die Rinnsale am Bauch heruntergelaufen sind */
  lauf: number;
  /** 0..1 Größe der Pfütze auf der Deckplatte */
  pfuetze: number;
  /** Sekunden, seit die einzelne Blase am Rand sitzt (-1 = keine) */
  blase: number;
  /** Sekunden seit dem Platzen der Randblase (-1 = noch nicht) */
  platzt: number;
  /** 0 Löffel schräg .. 1 Löffel gerade und rührend */
  loeffel: number;
  ruehrZeit: number;
  ruehrt: boolean;
  /** Alpha der Denkblase über Lunis Kopf */
  gedanke: number;
  /** Laufzeit des Blubberns (beschleunigt mit dem Pegel) */
  blubber: number;
  /** 0..1 für Schimmer und Dampf */
  energie: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const glatt = (k: number) => { const v = clamp01(k); return v * v * (3 - 2 * v); };

export class KesselAblauf {
  phase: KesselPhase = "ruhig";
  /** Sekunden in der aktuellen Phase */
  t = 0;
  private pegel = 0;
  private fluss = 0;
  private lauf = 0;
  private pfuetze = 0;
  private blaseT = -1;
  private platzt = -1;
  private ruehrT = 0;
  private ruehrZeit = 0;
  private loeffel = 0;
  private gedanke = 0;
  private blubber = 0;
  private schnell = false;

  /**
   * Frisches Holz ist im Ofen gelandet: der Trank beginnt zu steigen.
   * Heute löst jeder Klick auf den Ofen das aus. Sobald es ein echtes
   * Nachlegen gibt (Feuer brennt herunter, Holz fliegt hinein), ruft genau
   * dieses Ereignis diese Methode auf – mehr muss sich nicht ändern.
   * Läuft er schon, ändert sich nichts.
   */
  holzNachgelegt(): boolean {
    if (this.phase !== "ruhig" && this.phase !== "blase") return false;
    this.schnell = false;
    this.wechsel("steigt");
    return true;
  }

  /** Der Löffel rührt. Steigt oder läuft der Trank, beruhigt er sich. */
  ruehren() {
    this.ruehrT = KESSEL_ZEIT.ruehren;
    if (this.phase === "steigt" || this.phase === "ueberlauf") {
      this.schnell = true;
      this.wechsel("sinkt");
    } else if (this.phase === "blase" && this.platzt < 0) {
      this.platzt = 0;
    }
  }

  private wechsel(p: KesselPhase) {
    this.phase = p;
    this.t = 0;
    if (p === "steigt") { this.blaseT = -1; this.platzt = -1; }
    if (p === "blase") { this.blaseT = 0; this.platzt = -1; }
    if (p === "ruhig") { this.blaseT = -1; this.platzt = -1; this.pegel = 0; this.fluss = 0; this.lauf = 0; }
  }

  update(dt: number) {
    this.t += dt;
    const ziel = this.ruehrT > 0 ? 1 : 0;
    const d = ziel - this.loeffel;
    this.loeffel += Math.sign(d) * Math.min(Math.abs(d), dt * 2);
    if (this.ruehrT > 0) this.ruehrT = Math.max(0, this.ruehrT - dt);
    if (this.ruehrT > 0 || this.loeffel > 0) this.ruehrZeit += dt; else this.ruehrZeit = 0;
    this.blubber += dt * (1 + 1.5 * this.pegel + (this.ruehrT > 0 ? 0.8 : 0));
    switch (this.phase) {
      case "steigt": {
        const k = Math.min(1, this.t / KESSEL_ZEIT.steigen);
        this.pegel = (1 - Math.cos(Math.PI * k)) / 2;
        if (k >= 1) this.wechsel("ueberlauf");
        break;
      }
      case "ueberlauf": {
        this.pegel = 1;
        this.fluss = Math.min(1, this.fluss + dt / 2);
        this.lauf = Math.min(1, this.lauf + dt / 3);
        if (this.lauf >= 0.85) this.pfuetze = Math.min(1, this.pfuetze + dt / 9);
        if (this.t >= KESSEL_ZEIT.ueberlaufMax) this.wechsel("sinkt");
        break;
      }
      case "sinkt": {
        const dauer = this.schnell ? KESSEL_ZEIT.sinkenSchnell : KESSEL_ZEIT.sinkenLangsam;
        this.pegel = Math.max(0, this.pegel - dt / dauer);
        this.fluss = Math.max(0, this.fluss - dt / 1.6);
        this.lauf = Math.max(0, this.lauf - dt / (this.schnell ? 1.5 : 3));
        if (this.pegel <= 0 && this.fluss <= 0) this.wechsel("blase");
        break;
      }
      case "blase": {
        this.blaseT += dt;
        if (this.platzt < 0 && this.blaseT >= KESSEL_ZEIT.blase) this.platzt = 0;
        if (this.platzt >= 0) {
          this.platzt += dt;
          if (this.platzt >= KESSEL_ZEIT.platzen) this.wechsel("ruhig");
        }
        break;
      }
      default:
        break;
    }
    // Die Pfütze verdunstet langsam, solange nichts nachläuft.
    if (this.phase !== "ueberlauf") this.pfuetze = Math.max(0, this.pfuetze - dt / KESSEL_ZEIT.pfuetze);
    const g = this.phase === "ueberlauf" ? 1 : 0;
    const dg = g - this.gedanke;
    this.gedanke += Math.sign(dg) * Math.min(Math.abs(dg), dt * (g ? 2.5 : 4));
  }

  zustand(): KesselFx {
    const ruehrt = this.ruehrT > 0;
    return {
      phase: this.phase, pegel: this.pegel, fluss: this.fluss, lauf: this.lauf, pfuetze: this.pfuetze,
      blase: this.blaseT, platzt: this.platzt, loeffel: this.loeffel, ruehrZeit: this.ruehrZeit, ruehrt,
      gedanke: this.gedanke, blubber: this.blubber,
      energie: clamp01(0.2 + 0.55 * this.pegel + 0.25 * this.fluss + (ruehrt ? 0.2 : 0)),
    };
  }
}

/* ------------------------------- Geometrie ------------------------------- */

const kesselMass = (F: number) => {
  const top = F - OFEN.korpus - 3.4;
  const cx: number = OFEN.kessel.x;
  return { cx, top, rimY: top - OFEN.kessel.hoehe };
};

/** Punkt auf der Bauchlinie des Kessels (s = -1 links, 1 rechts; u 0 Rand .. 1 Boden). */
function bauch(cx: number, rimY: number, top: number, s: number, u: number): Pt {
  const m = 1 - u;
  const a = m * m * m, b = 3 * m * m * u, d = 3 * m * u * u, e = u * u * u;
  return [
    cx + s * (a * 10.4 + b * 17.8 + d * 14.6 + e * 7) + s * 0.5,
    a * (rimY + 2.2) + b * (rimY + 9.5) + d * (top + 1.6) + e * (top + 2),
  ];
}

/* --------------------------------- Löffel -------------------------------- */

const LOEFFEL = { laenge: 37, ruhe: 0.46, schwung: 0.2, tiefe: 6.5 } as const;

function loeffelWinkel(fx: KesselFx): number {
  const e = glatt(fx.loeffel);
  return LOEFFEL.ruhe * (1 - e) + e * LOEFFEL.schwung * Math.sin(fx.ruehrZeit * 4.4);
}

function loeffelPunkt(F: number, fx: KesselFx, anteil: number): Pt {
  const { cx, rimY } = kesselMass(F);
  const w = loeffelWinkel(fx), l = LOEFFEL.laenge * anteil;
  return [cx + Math.sin(w) * l, rimY + LOEFFEL.tiefe - Math.cos(w) * l];
}

/** Ziel der Blitze: oberer Teil des Löffelstiels, folgt dem Rühren. */
export function kesselLoeffelSpitze(F: number, fx: KesselFx): Pt {
  return loeffelPunkt(F, fx, 0.88);
}

function loeffelEbenen(c: C, F: number, fx: KesselFx, vorne: boolean) {
  const { cx, rimY } = kesselMass(F);
  const w = loeffelWinkel(fx);
  const px = cx, py = rimY + LOEFFEL.tiefe;
  const [tx, ty] = loeffelPunkt(F, fx, 1);
  const nx = Math.cos(w), ny = Math.sin(w);
  c.save();
  c.beginPath();
  if (vorne) {
    // Vorderer Zug nur vorne am Kesselrand: über der Innenkante der Lippe.
    // Die Fläche ist genau so breit wie die Lippe, der Stiel ragt seitlich aus.
    c.moveTo(cx - 9.4, rimY + 1.62);
    c.lineTo(cx + 9.4, rimY + 1.62);
    c.lineTo(cx + 11.4, rimY - 0.7);
    c.lineTo(cx - 11.4, rimY - 0.7);
    c.closePath();
  } else {
    // Hinterer Zug bleibt hinter der vorderen Lippe.
    c.rect(cx - 40, rimY - 60, 80, 60.9);
  }
  c.clip();
  if (fx.loeffel > 0.05) {
    c.globalCompositeOperation = "lighter";
    line(c, px, py, tx, ty, `rgba(170,120,255,${0.3 * fx.loeffel})`, 6);
    c.globalCompositeOperation = "source-over";
  }
  line(c, px, py, tx, ty, "#24140b", 4.8);
  line(c, px, py, tx, ty, "#7d4a22", 3.4);
  line(c, px - nx * 0.8, py - ny * 0.8, tx - nx * 0.8, ty - ny * 0.8, "#b9803f", 0.9);
  line(c, px + nx * 0.9, py + ny * 0.9, tx + nx * 0.9, ty + ny * 0.9, "rgba(40,20,8,.55)", 0.8);
  for (const a of [0.76, 0.9]) {
    const [rx, ry] = loeffelPunkt(F, fx, a);
    line(c, rx - nx * 1.7, ry - ny * 1.7, rx + nx * 1.7, ry + ny * 1.7, "#3b2412", 1);
  }
  disc(c, tx, ty, 2.6, "#24140b");
  disc(c, tx, ty, 2, "#a8672f");
  disc(c, tx - 0.5, ty - 0.6, 0.7, "#e0b27a");
  c.restore();
}

function zeichneLoeffel(c: C, F: number, fx: KesselFx) {
  const { cx, rimY } = kesselMass(F);
  const w = loeffelWinkel(fx);
  // Hinterer Zug (vor der vorderen Lippe, hinter ihr in der Tiefe)
  loeffelEbenen(c, F, fx, false);
  // Einstich in den Trank: kleiner Ring auf der Oberfläche.
  const l = (LOEFFEL.tiefe - 0.7) / Math.cos(w);
  const ex = cx + Math.sin(w) * l;
  c.strokeStyle = `rgba(222,200,255,${0.55 + 0.2 * Math.sin(fx.blubber * 3)})`;
  c.lineWidth = 0.55;
  c.beginPath(); c.ellipse(ex, rimY + 0.8, 2.5, 0.75, 0, 0, Math.PI * 2); c.stroke();
}

/* --------------------------- Blasen, Kuppel, Fluss ------------------------ */

/** Durchsichtige Leuchtkugel: Verlauf, Rand, Glanzbogen und flackernde Lichtpunkte. */
function glasBlase(c: C, x: number, y: number, r: number, t: number, ph: number, stark = 1) {
  if (r < 0.25) return;
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, `rgba(240,228,255,${0.62 * stark})`);
  g.addColorStop(0.55, `rgba(176,128,250,${0.42 * stark})`);
  g.addColorStop(1, `rgba(118,72,206,${0.58 * stark})`);
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = `rgba(236,222,255,${0.85 * stark})`;
  c.lineWidth = Math.max(0.4, r * 0.13);
  c.stroke();
  c.strokeStyle = `rgba(255,255,255,${0.8 * stark})`;
  c.lineWidth = Math.max(0.35, r * 0.12);
  c.lineCap = "round";
  c.beginPath(); c.arc(x, y, r * 0.68, Math.PI * 1.08, Math.PI * 1.42); c.stroke();
  const f1 = 0.55 + 0.45 * Math.sin(t * 3.1 + ph * 9);
  const f2 = 0.55 + 0.45 * Math.sin(t * 2.3 + ph * 5 + 1.7);
  c.fillStyle = `rgba(255,255,255,${f1 * 0.9 * stark})`;
  c.beginPath(); c.arc(x + r * 0.22, y + r * 0.18, Math.max(0.3, r * 0.13), 0, Math.PI * 2); c.fill();
  c.fillStyle = `rgba(214,184,255,${f2 * 0.85 * stark})`;
  c.beginPath(); c.arc(x - r * 0.12, y + r * 0.42, Math.max(0.28, r * 0.1), 0, Math.PI * 2); c.fill();
}

/** [u, v, rmax, Periode, Versatz]: kleine Blasen steigen auf und platzen an der Oberfläche. */
const OBERFLAECHE: readonly (readonly [number, number, number, number, number])[] = [
  [-6.2, -0.2, 1.1, 2.1, 0], [-3.1, 0.5, 1.4, 2.7, 0.31], [0.4, -0.4, 1, 1.9, 0.62],
  [3.3, 0.4, 1.5, 2.5, 0.18], [6.1, -0.1, 1, 2.2, 0.77], [-1.2, 0.1, 1.2, 3.1, 0.5],
];

function oberflaechenBlasen(c: C, cx: number, rimY: number, fx: KesselFx) {
  for (const [u, v, rmax, periode, versatz] of OBERFLAECHE) {
    const ph = (fx.blubber / periode + versatz) % 1;
    const x = cx + u, y = rimY + 0.7 + v * 0.9;
    if (ph < 0.8) {
      glasBlase(c, x, y, rmax * Math.pow(ph / 0.8, 0.6), fx.blubber, versatz);
    } else {
      const k = (ph - 0.8) / 0.2;
      c.strokeStyle = `rgba(232,216,255,${(1 - k) * 0.8})`;
      c.lineWidth = 0.5;
      c.beginPath(); c.arc(x, y, rmax * (1 + k * 1.3), 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 2; i++) {
        const a = i * 3.1 + versatz * 9;
        disc(c, x + Math.cos(a) * k * 3, y - Math.abs(Math.sin(a)) * k * 2.4 - k, 0.4, `rgba(220,196,255,${1 - k})`);
      }
    }
  }
}

/** Rührwirbel auf der Oberfläche, solange der Löffel arbeitet. */
function wirbel(c: C, cx: number, rimY: number, fx: KesselFx) {
  if (fx.loeffel <= 0.05) return;
  c.strokeStyle = `rgba(214,188,255,${0.5 * fx.loeffel})`;
  c.lineWidth = 0.6;
  for (let i = 0; i < 3; i++) {
    const a = fx.ruehrZeit * 3.6 + i * 2.1;
    c.beginPath(); c.ellipse(cx, rimY + 0.7, 3 + i * 2.2, 0.6 + i * 0.34, 0, a, a + 1.5); c.stroke();
  }
}

/** [u, Höhenstufe, r, Versatz]: Kuppel aus Leuchtkugeln über dem Rand, unten zuerst. */
const KUPPEL: readonly (readonly [number, number, number, number])[] = [
  [-0.8, 0, 3.1, 0], [-0.42, 0, 3.7, 0.2], [0, 0, 4, 0.4], [0.42, 0, 3.6, 0.6], [0.8, 0, 3, 0.8],
  [-0.62, 1, 3.3, 0.1], [-0.22, 1, 3.9, 0.3], [0.24, 1, 3.7, 0.5], [0.64, 1, 3, 0.7],
  [-0.36, 2, 3.1, 0.15], [0.08, 2, 3.7, 0.45], [0.46, 2, 2.7, 0.75],
  [-0.12, 3, 2.9, 0.25], [0.3, 3, 2.4, 0.65], [0.08, 4, 2.1, 0.55],
];

interface KuppelKugel { x: number; y: number; r: number; v: number; h: number; s: number }

/** Lage und Größe aller sichtbaren Kuppelkugeln (Zeichnung und Leuchten teilen sie sich). */
function kuppelKugeln(cx: number, rimY: number, fx: KesselFx): KuppelKugel[] {
  const aus: KuppelKugel[] = [];
  KUPPEL.forEach(([u, h, r, v], i) => {
    const s = clamp01((fx.pegel - (i / KUPPEL.length) * 0.88) / 0.12);
    if (s <= 0) return;
    // Beim Überlaufen werden die Kugeln größer und breiter: sie quellen über den Rand.
    aus.push({
      x: cx + u * (9.4 + 1.8 * fx.fluss) + Math.sin(fx.blubber * 1.1 + v * 6) * 0.5 * s,
      y: rimY + 0.6 - h * 3.3 + Math.sin(fx.blubber * 1.6 + v * 9) * 0.45 * s,
      r: r * s * (1 + 0.05 * Math.sin(fx.blubber * 2.4 + v * 7)) * (1 + 0.3 * fx.fluss),
      v, h, s,
    });
  });
  return aus;
}

/** Zeichnet die Kugeln der Höhenstufen von..bis, oben (hinten) zuerst. */
function kuppel(c: C, cx: number, rimY: number, fx: KesselFx, von: number, bis: number) {
  const liste = kuppelKugeln(cx, rimY, fx).filter((k) => k.h >= von && k.h <= bis).sort((p, q) => q.h - p.h);
  for (const k of liste) glasBlase(c, k.x, k.y, k.r, fx.blubber, k.v);
}

/** Kugeln, die über den Rand quellen und am Bauch herabrutschen. */
const RAND = [[-1, 0.03, 3, 0.2], [-1, 0.17, 2.1, 0.6], [1, 0.02, 3.2, 0.4], [1, 0.15, 2.3, 0.8]] as const;

function randBlasen(c: C, cx: number, rimY: number, top: number, fx: KesselFx) {
  if (fx.fluss <= 0.02) return;
  for (const [s, u, r, v] of RAND) {
    const [x, y] = bauch(cx, rimY, top, s, u + fx.lauf * 0.06 * v);
    glasBlase(c, x + s * r * 0.5, y, r * glatt(fx.fluss), fx.blubber, v);
  }
}

/** Violette Rinnsale am Bauch und zwei an der Vorderseite. */
function rinnsale(c: C, cx: number, rimY: number, top: number, fx: KesselFx) {
  if (fx.fluss <= 0.02 || fx.lauf <= 0.02) return;
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  c.globalAlpha = clamp01(fx.fluss * 2);
  for (const s of [-1, 1] as const) {
    const ende = Math.min(0.93, fx.lauf * 0.95);
    const pts: Pt[] = [];
    for (let i = 0; i <= 12; i++) pts.push(bauch(cx, rimY, top, s, (ende * i) / 12));
    const strich = (breite: number, farbe: string) => {
      c.strokeStyle = farbe;
      c.lineWidth = breite;
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.stroke();
    };
    const w = 1 + 1 * fx.fluss;
    strich(w + 1.6, "rgba(150,96,240,.26)");
    strich(w, "rgba(104,58,200,.96)");
    strich(w * 0.38, "rgba(214,184,255,.85)");
    const e = pts[pts.length - 1];
    disc(c, e[0], e[1] + 0.3, w * 0.62, "rgba(150,100,240,.95)");
  }
  for (const [dx, laenge, v] of [[-4.6, 9.5, 0.3], [3.8, 7.5, 0.7]] as const) {
    const lip = rimY + 1.2 + 3 * Math.sqrt(1 - Math.min(1, (dx / 11.4) ** 2));
    const l = Math.min(top + 0.6 - lip, laenge * Math.pow(fx.lauf, 0.8));
    if (l <= 0.3) continue;
    const ax = cx + dx, bx = cx + dx + Math.sin(v * 5) * 0.4;
    line(c, ax, lip, bx, lip + l, "rgba(150,96,240,.22)", 1.9);
    line(c, ax, lip, bx, lip + l, "rgba(104,58,200,.85)", 0.9);
    line(c, ax - 0.25, lip, bx - 0.25, lip + l, "rgba(214,184,255,.7)", 0.4);
    disc(c, bx, lip + l + 0.2, 0.9, "rgba(150,100,240,.95)");
  }
  c.restore();
}

/** Pfütze auf der Deckplatte: wächst beim Überlaufen, verdunstet danach langsam. */
function pfuetzeZeichnen(c: C, cx: number, top: number, fx: KesselFx) {
  if (fx.pfuetze <= 0.01) return;
  const q = fx.pfuetze;
  const rx = 5 + q * 14.5, ry = 0.9 + q * 0.9, y = top + 2.1;
  const a = Math.min(1, q * 3);
  c.save();
  c.beginPath(); c.rect(OFEN.x - 1.8, top - 0.2, OFEN.w + 3.6, 4); c.clip();
  ellipse(c, cx, y, rx + 1.2, ry + 0.7, `rgba(120,70,220,${0.35 * Math.min(1, q * 2)})`);
  ellipse(c, cx, y, rx, ry, `rgba(96,52,184,${0.95 * a})`);
  ellipse(c, cx - rx * 0.25, y - ry * 0.25, rx * 0.45, ry * 0.35, `rgba(196,160,255,${0.7 * a})`);
  c.restore();
}

/** Eine einzelne Blase sitzt noch am Rand, pulst zart – dann platzt sie. */
function randBlase(c: C, cx: number, rimY: number, fx: KesselFx) {
  if (fx.blase < 0) return;
  const x = cx + 8.6, y = rimY - 0.1;
  if (fx.platzt >= 0) {
    const k = Math.min(1, fx.platzt / KESSEL_ZEIT.platzen);
    c.strokeStyle = `rgba(236,222,255,${(1 - k) * 0.9})`;
    c.lineWidth = 0.6;
    c.beginPath(); c.arc(x, y, 2.4 + k * 4, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26 + 0.4;
      disc(c, x + Math.cos(a) * (2.4 + k * 5), y + Math.sin(a) * (2.4 + k * 4) + k * k * 2, 0.55, `rgba(214,184,255,${1 - k})`);
    }
    return;
  }
  const puls = 0.5 + 0.5 * Math.sin(fx.blase * 3.2);
  const r = 2.1 + 0.35 * puls;
  disc(c, x, y, r * 2.2, `rgba(176,120,255,${0.1 + 0.12 * puls})`);
  glasBlase(c, x, y, r, fx.blase * 1.4, 0.3, 0.8 + 0.2 * puls);
}

/** Violetter Dampf über dem Kessel und feine Schwaden über der verdunstenden Pfütze. */
function dampf(c: C, cx: number, rimY: number, top: number, fx: KesselFx) {
  const staerke = 0.2 + 0.12 * fx.energie;
  const basis = rimY - 1.5 - fx.pegel * 13;
  for (let i = 0; i < 5; i++) {
    const ph = (fx.blubber / (5.2 + i * 0.8) + i * 0.23) % 1;
    const x = cx + (i - 2) * 3.1 + Math.sin(fx.blubber * 0.8 + i * 1.7) * (1.4 + ph * 3.4);
    const y = basis - ph * (17 + 9 * fx.pegel);
    c.fillStyle = `rgba(214,190,255,${(1 - ph) * Math.sin(Math.min(1, ph * 4) * Math.PI / 2) * staerke})`;
    c.beginPath(); c.ellipse(x, y, 2 + ph * 4.4, 1.4 + ph * 3, 0, 0, Math.PI * 2); c.fill();
  }
  if (fx.pfuetze > 0.03) {
    for (let i = 0; i < 4; i++) {
      const ph = (fx.blubber / (6 + i) + i * 0.31) % 1;
      const x = cx + (i - 1.5) * 8 + Math.sin(fx.blubber * 0.6 + i * 2.4) * 2;
      c.fillStyle = `rgba(206,178,255,${(1 - ph) * 0.22 * Math.min(1, fx.pfuetze * 4)})`;
      c.beginPath(); c.ellipse(x, top - ph * 11, 1.6 + ph * 3, 1 + ph * 2, 0, 0, Math.PI * 2); c.fill();
    }
  }
}

/**
 * Bauchiger Kessel mittig auf der Deckplatte. Ohne `fx` entsteht nur der feste
 * Körper (statische Ebene); mit `fx` kommen Trank, Blasen, Kuppel, Überlauf,
 * Pfütze, Löffel und Dampf dazu.
 */
export function drawKessel(c: C, F: number, _t: number, fx?: KesselFx) {
  const k = OFEN.kessel;
  const { cx, top, rimY } = kesselMass(F);
  // Gussring unter dem Kessel, satt auf der Deckplatte
  rr(c, cx - 12, top - 2.6, 24, 4.2, 1.4, "#242a2e");
  rect(c, cx - 10.5, top - 2.4, 21, .8, "#5b6367");
  for (let i = -5; i <= 5; i += 2) rect(c, cx + i, top - 1.8, .8, 3, "#414a4f");
  // Körper: bauchig, dunkles Gusseisen
  const body = c.createLinearGradient(cx - k.r, 0, cx + k.r, 0);
  body.addColorStop(0, "#15181b"); body.addColorStop(.28, "#30383e"); body.addColorStop(.55, "#252c31"); body.addColorStop(.82, "#30383e"); body.addColorStop(1, "#121518");
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(cx - 10.4, rimY + 2.2);
  c.bezierCurveTo(cx - 17.8, rimY + 9.5, cx - 14.6, top + 1.6, cx - 7, top + 2);
  c.quadraticCurveTo(cx, top + 2.8, cx + 7, top + 2);
  c.bezierCurveTo(cx + 14.6, top + 1.6, cx + 17.8, rimY + 9.5, cx + 10.4, rimY + 2.2);
  c.closePath(); c.fill();
  c.strokeStyle = "#4a555b"; c.lineWidth = .8; c.stroke();
  // Glanzkante und Bauchnaht
  line(c, cx - 8.8, rimY + 3.6, cx - 7.4, top - 5, "rgba(178,198,203,.28)", 1.2);
  line(c, cx + 9, rimY + 5, cx + 8, top - 6, "rgba(0,0,0,.4)", .9);
  // Rand
  ellipse(c, cx, rimY + 1.2, 11.4, 3, "#3c454b");
  ellipse(c, cx, rimY + .5, 10.1, 2.4, "#0e1114");
  // Inhalt: violetter Trank
  ellipse(c, cx, rimY + .7, 9.2, 1.95, "#3a1d6b");
  ellipse(c, cx, rimY + .7, 7.3, 1.35, "#6a38b4");
  ellipse(c, cx - 1.4, rimY + .4, 2.4, .5, "#b896f2");
  // Henkel
  for (const s of [-1, 1] as const) {
    c.strokeStyle = "#2d3439"; c.lineWidth = 1.7;
    c.beginPath(); c.arc(cx + s * 9.8, rimY + 3, 2.8, s > 0 ? -1.25 : 1.9, s > 0 ? 1.9 : 5.05); c.stroke();
    disc(c, cx + s * 9.5, rimY + .8, .8, "#4d585e");
  }
  if (!fx) return;
  c.save();
  // Nur der Bereich oberhalb der Deckplatte ist frei für Trank, Kuppel,
  // Löffel und Dampf. Was darunter durch den Ofen läuft, bleibt verborgen.
  c.beginPath(); c.rect(0, F - OFEN.korpus - 70, 960, OFEN.korpus + 70 - 36); c.clip();
  pfuetzeZeichnen(c, cx, top, fx);
  rinnsale(c, cx, rimY, top, fx);
  wirbel(c, cx, rimY, fx);
  oberflaechenBlasen(c, cx, rimY, fx);
  kuppel(c, cx, rimY, fx, 2, 9);
  zeichneLoeffel(c, F, fx);
  kuppel(c, cx, rimY, fx, 0, 1);
  randBlasen(c, cx, rimY, top, fx);
  randBlase(c, cx, rimY, fx);
  dampf(c, cx, rimY, top, fx);
  c.restore();
}

/**
 * Schimmer um den Kessel: additives violettes Licht, nachts deutlich stärker.
 * Wird NACH der Nachtabdunkelung gezeichnet und bleibt auf Küche und
 * Treppenhaus beschränkt.
 */
export function drawKesselSchimmer(c: C, F: number, t: number, fx: KesselFx, nacht: number) {
  const { cx, rimY, top } = kesselMass(F);
  const n = clamp01(nacht);
  const a = (0.13 + 0.36 * n) * (0.55 + 0.45 * fx.energie);
  const r = (46 + 20 * fx.pegel + 8 * fx.fluss) * (1 + 0.06 * Math.sin(t * 2.2));
  const cy = rimY + 1 - fx.pegel * 6;
  c.save();
  c.beginPath(); c.rect(562, 336, 266, 112); c.clip();
  c.globalCompositeOperation = "lighter";
  const g = c.createRadialGradient(cx, cy, 3, cx, cy, r);
  g.addColorStop(0, `rgba(176,120,255,${a})`);
  g.addColorStop(0.45, `rgba(130,84,232,${a * 0.42})`);
  g.addColorStop(1, "rgba(100,60,200,0)");
  c.fillStyle = g;
  c.fillRect(cx - r, cy - r, r * 2, r * 2);
  const l = 0.22 + 0.24 * fx.energie + 0.1 * n;
  ellipse(c, cx, rimY + 0.7, 8.2, 1.7, `rgba(196,150,255,${l * (0.8 + 0.2 * Math.sin(t * 3.4))})`);
  if (fx.pegel > 0.05) {
    const ky = rimY - 3 - fx.pegel * 5, kr = 11 + fx.pegel * 9;
    const kg = c.createRadialGradient(cx, ky, 1, cx, ky, kr);
    kg.addColorStop(0, `rgba(190,140,255,${0.07 * fx.pegel + 0.04 * n})`);
    kg.addColorStop(1, "rgba(120,70,220,0)");
    c.fillStyle = kg;
    c.fillRect(cx - kr, ky - kr, kr * 2, kr * 2);
  }
  // Eigenes Leuchten der Kugeln und der Randblase: bleibt auch nachts klar zu sehen.
  for (const k of kuppelKugeln(cx, rimY, fx)) {
    // Schwach halten: Die Kugeln überlappen sich, ihr Leuchten addiert sich sonst zu Weiß.
    const e = (0.035 + 0.07 * n) * k.s;
    const rg = c.createRadialGradient(k.x, k.y, 0, k.x, k.y, k.r * 1.6);
    rg.addColorStop(0, `rgba(190,150,255,${e})`);
    rg.addColorStop(1, "rgba(110,60,220,0)");
    c.fillStyle = rg;
    c.fillRect(k.x - k.r * 1.6, k.y - k.r * 1.6, k.r * 3.2, k.r * 3.2);
  }
  if (fx.blase >= 0) {
    const bx = cx + 8.6, by = rimY - 0.1;
    const puls = 0.5 + 0.5 * Math.sin(fx.blase * 3.2);
    const k = fx.platzt >= 0 ? Math.min(1, fx.platzt / KESSEL_ZEIT.platzen) : 0;
    const br = 6.5 + k * 4;
    const e = fx.platzt >= 0 ? (0.5 + 0.2 * n) * (1 - k) : (0.24 + 0.32 * n) * (0.55 + 0.45 * puls);
    const bg = c.createRadialGradient(bx, by, 0, bx, by, br);
    bg.addColorStop(0, `rgba(226,204,255,${e})`);
    bg.addColorStop(0.45, `rgba(160,110,245,${e * 0.45})`);
    bg.addColorStop(1, "rgba(110,60,220,0)");
    c.fillStyle = bg;
    c.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  if (fx.pfuetze > 0.01) {
    const pg = c.createRadialGradient(cx, top + 2, 1, cx, top + 2, 12 + 16 * fx.pfuetze);
    pg.addColorStop(0, `rgba(170,120,255,${(0.26 + 0.3 * n) * Math.min(1, fx.pfuetze * 2)})`);
    pg.addColorStop(1, "rgba(120,70,220,0)");
    c.fillStyle = pg;
    c.fillRect(cx - 30, top - 14, 60, 28);
  }
  c.restore();
}

/**
 * Kleiner, leicht gezackter Blitz von `von` Richtung `nach`. `laenge` 0..1 ist
 * der bereits zurückgelegte Anteil des Wegs – bei 1 trifft er das Ziel.
 */
export function drawZauberBlitz(c: C, von: Pt, nach: Pt, laenge: number, t: number, seed: number) {
  if (laenge <= 0.01) return;
  const ex = von[0] + (nach[0] - von[0]) * laenge, ey = von[1] + (nach[1] - von[1]) * laenge;
  const dx = ex - von[0], dy = ey - von[1];
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const n = Math.max(4, Math.min(12, Math.round(len / 9)));
  const bild = Math.floor(t * 22);
  const pts: Pt[] = [[von[0], von[1]]];
  for (let i = 1; i < n; i++) {
    const j = (hash(bild * 13.7 + i * 5.1 + seed * 31) - 0.5) * 2 * 2.6;
    pts.push([von[0] + dx * (i / n) + nx * j, von[1] + dy * (i / n) + ny * j]);
  }
  pts.push([ex, ey]);
  c.save();
  c.globalCompositeOperation = "lighter";
  c.lineJoin = "round";
  c.lineCap = "round";
  const bahn = () => {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.stroke();
  };
  c.strokeStyle = "rgba(126,70,236,.34)"; c.lineWidth = 4.2; bahn();
  c.strokeStyle = "rgba(188,142,255,.7)"; c.lineWidth = 2; bahn();
  c.strokeStyle = "rgba(255,255,255,.95)"; c.lineWidth = 0.9; bahn();
  for (let s = 0; s < 2; s++) {
    const p = pts[1 + Math.floor(hash(bild * 3.3 + s * 9 + seed) * (pts.length - 2))];
    const seite = hash(bild * 1.9 + s * 4 + seed * 7) > 0.5 ? 1 : -1;
    c.strokeStyle = "rgba(214,184,255,.8)";
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(p[0], p[1]);
    c.lineTo(p[0] + nx * seite * 3.2 + ux * 2.4, p[1] + ny * seite * 3.2 + uy * 2.4);
    c.stroke();
  }
  const g0 = c.createRadialGradient(von[0], von[1], 0.4, von[0], von[1], 5);
  g0.addColorStop(0, "rgba(255,255,255,.9)"); g0.addColorStop(0.4, "rgba(176,120,255,.5)"); g0.addColorStop(1, "rgba(110,60,220,0)");
  c.fillStyle = g0;
  c.beginPath(); c.arc(von[0], von[1], 5, 0, Math.PI * 2); c.fill();
  if (laenge >= 0.99) {
    const g1 = c.createRadialGradient(ex, ey, 0.5, ex, ey, 8);
    g1.addColorStop(0, "rgba(255,255,255,.95)"); g1.addColorStop(0.35, "rgba(190,140,255,.6)"); g1.addColorStop(1, "rgba(110,60,220,0)");
    c.fillStyle = g1;
    c.beginPath(); c.arc(ex, ey, 8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(240,226,255,.85)";
    c.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) {
      const a = t * 5 + i * Math.PI / 2;
      c.beginPath();
      c.moveTo(ex + Math.cos(a) * 2, ey + Math.sin(a) * 2);
      c.lineTo(ex + Math.cos(a) * (5 + 2 * hash(bild + i)), ey + Math.sin(a) * (5 + 2 * hash(bild + i)));
      c.stroke();
    }
  }
  c.restore();
}

/**
 * Denkblase über Lunis Kopf: ein Kessel, der überkocht. `kx`/`ky` = Scheitel,
 * `face` = Blickrichtung (die Blase sitzt leicht vor dem Kopf), `a` = 0..1.
 */
export function drawKesselGedanke(c: C, kx: number, ky: number, face: 1 | -1, t: number, a: number) {
  if (a <= 0.01) return;
  const e = glatt(a);
  const bx = kx + face * 11, by = ky - 24;
  c.save();
  c.globalAlpha = Math.min(1, a * 1.3);
  for (const [dx, dy, r] of [[2.5, -2.5, 1.5], [6.5, -9, 2.4]] as const) {
    disc(c, kx + face * dx, ky + dy, r + 1, "#3a2a56");
    disc(c, kx + face * dx, ky + dy, r, "#f4f1fa");
  }
  c.translate(bx, by);
  c.scale(0.55 + 0.45 * e, 0.55 + 0.45 * e);
  const kreise: readonly (readonly [number, number, number])[] = [[-11, 1, 8], [-3, -5, 10], [8, -3, 9], [12, 3, 7], [1, 5, 9]];
  for (const [x, y, r] of kreise) disc(c, x, y, r + 1.3, "#3a2a56");
  for (const [x, y, r] of kreise) disc(c, x, y, r, "#f4f1fa");
  // Mini-Kessel
  c.fillStyle = "#2b2f36";
  c.beginPath();
  c.moveTo(-8, -0.5); c.bezierCurveTo(-12, 5, -9, 11, -4.5, 11.4); c.lineTo(4.5, 11.4);
  c.bezierCurveTo(9, 11, 12, 5, 8, -0.5); c.closePath(); c.fill();
  rect(c, -6.2, 11, 2, 2.4, "#2b2f36");
  rect(c, 4.2, 11, 2, 2.4, "#2b2f36");
  ellipse(c, 0, -0.5, 9.2, 2.2, "#46505a");
  ellipse(c, 0, -0.6, 7.6, 1.6, "#6a38b4");
  line(c, -8.2, 0, -10.2, 5.4, "#7a46c8", 1.6);
  line(c, 8.2, 0, 10.2, 5.4, "#7a46c8", 1.6);
  for (let i = 0; i < 4; i++) {
    const hub = Math.abs(Math.sin(t * 2.4 + i * 1.3)) * 2.2;
    const x = -5 + i * 3.3, y = -3.4 - hub, r = 2.4 + (i % 2) * 0.5;
    disc(c, x, y, r, "rgba(176,128,250,.95)");
    c.strokeStyle = "rgba(236,222,255,.95)";
    c.lineWidth = 0.5;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
    disc(c, x - r * 0.3, y - r * 0.3, 0.5, "#ffffff");
  }
  c.restore();
}
