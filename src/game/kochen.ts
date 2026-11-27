/* =======================================================================
   MITTAGSKÜCHE – drei Kochroutinen für mittags

     Pfannengericht   : Speck und Spiegeleier aus der Pfanne
     Kochtopf & Pfanne: Spaghetti im Topf, Tomatensoße in der Pfanne
     Fertigpizza      : Tiefkühlpizza aus dem Backofen

   Reine Canvas-Primitive, keine Assets, keine Browser-Dienste.
   Der Ablauf (Schritte, Wege, Hände) steht in house.ts; hier liegen der
   Zustand der Küche und alles, was dafür gezeichnet wird.
   ======================================================================= */

type C = CanvasRenderingContext2D;
export type Pt = [number, number];

export type KochArt = "pfanne" | "topf" | "pizza";

export const KOCH_NAMEN: Record<KochArt, string> = {
  pfanne: "Pfannengericht",
  topf: "Kochtopf & Pfanne",
  pizza: "Fertigpizza",
};

/** Was Luni gerade in der Hand hält. */
export type KochHand =
  | "eierspeck" | "eier" | "ei" | "pfanne" | "topf" | "teller" | "nudeln" | "sosse"
  | "pizzakarton" | "pizza" | "gabel" | "stueck" | null;

export interface KochStand {
  art: KochArt | null;
  /** Gegenstand in der Hand (vordere Hand). */
  hand: KochHand;
  /** Was auf der Arbeitsplatte neben der Spüle liegt. */
  ablage: "eierspeck" | "nudeln" | "sosse" | "pizzakarton" | null;
  pfanne: "weg" | "herd";
  topf: "weg" | "herd";
  /** Glut der beiden Herdplatten 0..1 (links = Topf, rechts = Pfanne). */
  plattenL: number;
  plattenR: number;
  pfanneInhalt: "leer" | "speck" | "sosse";
  /** Aufgeschlagene Eier in der Pfanne (0..2). */
  eier: number;
  /** Garfortschritt der Pfanne 0..1. */
  gar: number;
  /** Ein Ei fällt gerade in die Pfanne 0..1 (0 = keins). */
  eiFall: number;
  topfInhalt: "leer" | "wasser" | "nudeln";
  /** Kochendes Wasser 0..1. */
  blubber: number;
  /** Garfortschritt der Nudeln 0..1. */
  nudelGar: number;
  /** Backofentür 0 zu .. 1 offen, Ofen an, Pizza darin. */
  ofen: number;
  ofenAn: boolean;
  pizza: "weg" | "ofen";
  pizzaGar: number;
  /** Teller auf dem Tisch und was darauf liegt. */
  teller: "weg" | "tisch";
  tellerInhalt: "leer" | "speckEi" | "nudeln" | "pizza";
  tellerSosse: boolean;
  /** Wie viel vom Essen noch auf dem Teller liegt (1 = voll, 0 = leer). */
  rest: number;
  /** Pfanne oder Topf in der Hand kippen (Bogenmaß). */
  kipp: number;
}

export function neuerKochStand(): KochStand {
  return {
    art: null, hand: null, ablage: null, pfanne: "weg", topf: "weg",
    plattenL: 0, plattenR: 0, pfanneInhalt: "leer", eier: 0, gar: 0, eiFall: 0,
    topfInhalt: "leer", blubber: 0, nudelGar: 0, ofen: 0, ofenAn: false,
    pizza: "weg", pizzaGar: 0, teller: "weg", tellerInhalt: "leer", tellerSosse: false, rest: 1, kipp: 0,
  };
}

/** Orte in der Küche. */
export const KOCH_ORTE = {
  platteL: 700,
  platteR: 716,
  /** Standplätze */
  standHerdL: 690,
  standHerdR: 703,
  standAblage: 641,
  standTisch: 748,
  /** Platz auf der Arbeitsplatte zwischen Spüle und Maschine. */
  ablageX: 651,
  /** Teller auf dem Küchentisch. */
  tellerX: 760,
} as const;

const TAU = Math.PI * 2;

function oval(c: C, x: number, y: number, rx: number, ry: number, f: string) {
  c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
}
function kreis(c: C, x: number, y: number, r: number, f: string) {
  c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function rund(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  c.fillStyle = f; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
}
const mix = (a: [number, number, number], b: [number, number, number], k: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;

/** Dampfwölkchen, die langsam nach oben steigen. */
export function zeichneDampf(c: C, x: number, y: number, staerke: number, t: number) {
  if (staerke <= 0.02) return;
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.55 + i * 0.25) % 1;
    c.fillStyle = `rgba(245,248,250,${(1 - u) * 0.34 * staerke})`;
    c.beginPath();
    c.arc(x + Math.sin(t * 1.7 + i * 2.1) * 2.2 + (i - 1.5) * 1.2, y - u * 15, 1.4 + u * 3.2, 0, TAU);
    c.fill();
  }
}

function herdGlut(c: C, x: number, y: number, level: number) {
  oval(c, x, y, 5.2, 1.5, `rgba(255,96,32,${0.15 + level * 0.75})`);
  oval(c, x, y, 3.2, 0.9, `rgba(255,190,90,${level * 0.7})`);
}

/** Pfanne mit Griff nach links; (x, y) = Mitte der Unterseite. `kipp` neigt sie zum Ausgießen. */
export function zeichnePfanne(c: C, x: number, y: number, inhalt: KochStand["pfanneInhalt"], eier: number, gar: number, t: number, kipp = 0) {
  c.save(); c.translate(x, y); c.rotate(kipp);
  rund(c, -16, -3.7, 10.5, 1.9, 0.9, "#5a4630");
  rund(c, -7, -4, 14, 4, 1.6, "#2a2f35");
  oval(c, 0, -4, 7.2, 1.8, "#3d444b");
  oval(c, 0, -3.9, 6.1, 1.35, "#14171b");
  if (inhalt === "speck") {
    const f = mix([226, 134, 123], [150, 62, 42], gar);
    for (const [sx, sy, w] of [[-2.2, -4.2, -0.15], [2.4, -4.0, 0.2]] as const) {
      c.save(); c.translate(sx, sy); c.rotate(w);
      rund(c, -2.4, -0.5, 4.8, 1.1, 0.5, f);
      rund(c, -2.4, -0.2, 4.8, 0.35, 0.2, "rgba(255,225,215,.7)");
      c.restore();
    }
  } else if (inhalt === "sosse") {
    oval(c, 0, -4.0, 5.7, 1.2, "#b8322a");
    for (let i = 0; i < 3; i++) {
      const u = (t * 1.3 + i * 0.37) % 1;
      kreis(c, -3 + i * 3 + Math.sin(t * 2 + i) * 0.6, -4.2 - u * 1.4, 0.5 + u * 0.4, `rgba(230,120,100,${1 - u})`);
    }
  }
  for (let i = 0; i < eier; i++) {
    const ex = i === 0 ? -1.6 : 2.5;
    c.fillStyle = mix([196, 214, 208], [250, 249, 242], gar);
    c.beginPath(); c.ellipse(ex, -4.05, 2.9, 1.0, 0, 0, TAU); c.fill();
    kreis(c, ex + 0.2, -4.35, 1.0, "#f4b52a");
    kreis(c, ex - 0.1, -4.6, 0.3, "rgba(255,255,255,.7)");
  }
  c.restore();
}

/** Kochtopf mit zwei Henkeln: Wasser, blubbernd, mit Nudeln. */
export function zeichneTopf(c: C, x: number, y: number, inhalt: KochStand["topfInhalt"], blubber: number, nudelGar: number, t: number, kipp = 0) {
  c.save(); c.translate(x, y); c.rotate(kipp);
  rund(c, -9.2, -8.4, 3, 1.5, 0.7, "#3f464b");
  rund(c, 6.2, -8.4, 3, 1.5, 0.7, "#3f464b");
  rund(c, -6.5, -10, 13, 10, 1.6, "#9aa3a8");
  rund(c, -6.5, -10, 3, 10, 1.2, "rgba(255,255,255,.28)");
  rund(c, -6.5, -2.2, 13, 2.2, 1, "#7b858a");
  oval(c, 0, -10, 6.5, 1.7, "#b9c1c5");
  oval(c, 0, -9.9, 5.6, 1.3, inhalt === "leer" ? "#2b3135" : "#7fb6c9");
  if (inhalt === "nudeln") {
    const f = mix([240, 226, 160], [232, 196, 100], nudelGar);
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = f; c.lineWidth = 0.7; c.beginPath();
      c.moveTo(-4 + i * 2, -9.5); c.quadraticCurveTo(-3 + i * 2, -10.6, -2.6 + i * 2, -9.4); c.stroke();
    }
  }
  if (inhalt !== "leer" && blubber > 0.1) {
    for (let i = 0; i < 5; i++) {
      const u = (t * 1.8 + i * 0.21) % 1;
      kreis(c, -4 + i * 2 + Math.sin(t * 3 + i) * 0.5, -10 - u * 1.7 * blubber, 0.5 + u * 0.5, `rgba(235,248,250,${(1 - u) * 0.9})`);
    }
  }
  c.restore();
}

/** Pizza von vorn, leicht flachgedrückt; `n` Stücke von sechs sind noch da. */
export function zeichnePizza(c: C, x: number, y: number, rx: number, ry: number, n: number, gar: number) {
  const kaese = mix([240, 226, 168], [226, 166, 62], gar);
  oval(c, x, y + 0.5, rx + 0.5, ry + 0.4, "#b57b32");
  for (let i = 0; i < 6; i++) {
    if (i >= n) continue;
    const a0 = i * (TAU / 6), a1 = (i + 1) * (TAU / 6);
    c.fillStyle = kaese;
    c.beginPath(); c.moveTo(x, y);
    for (let a = a0; a <= a1 + 0.001; a += 0.15) c.lineTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry);
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(160,100,40,.55)"; c.lineWidth = 0.3; c.stroke();
    const am = (a0 + a1) / 2;
    kreis(c, x + Math.cos(am) * rx * 0.58, y + Math.sin(am) * ry * 0.58, Math.max(0.5, rx * 0.1), mix([200, 86, 70], [150, 50, 36], gar));
  }
}

export function zeichneKochTeller(c: C, x: number, y: number, inhalt: KochStand["tellerInhalt"], rest: number, sosse: boolean) {
  oval(c, x, y, 10.5, 2.9, "#f1eee6");
  oval(c, x, y - 0.3, 8, 2.0, "#dedad0");
  if (rest <= 0.03 || inhalt === "leer") return;
  if (inhalt === "speckEi") {
    c.save(); c.translate(x - 3.2, y - 0.6); c.rotate(-0.1);
    rund(c, -2.4, -0.5, 4.8 * rest, 1.1, 0.5, "#a8432f"); c.restore();
    c.fillStyle = "#faf9f2"; c.beginPath(); c.ellipse(x + 1.6, y - 0.7, 4.6 * rest, 1.5 * rest, 0, 0, TAU); c.fill();
    kreis(c, x + 1.8, y - 1.1, 1.3 * rest + 0.1, "#f4b52a");
    kreis(c, x + 4.3, y - 0.9, 1.0 * rest, "#f4b52a");
  } else if (inhalt === "nudeln") {
    oval(c, x, y - 0.9, 6.6 * rest, 2.0 * rest + 0.2, "#e8cf8a");
    if (sosse) oval(c, x, y - 1.8, 4.2 * rest, 1.2 * rest, "#b8322a");
  } else if (inhalt === "pizza") {
    zeichnePizza(c, x, y - 0.6, 8.8, 2.6, Math.ceil(rest * 6 - 0.001), 1);
  }
}

/** Gegenstände auf der Arbeitsplatte (Oberkante y). */
function zeichneAblageDing(c: C, x: number, y: number, was: NonNullable<KochStand["ablage"]>) {
  if (was === "eierspeck") {
    rund(c, x - 6, y - 3.6, 9, 3.6, 1, "#d9cdb4");
    for (let i = 0; i < 3; i++) oval(c, x - 4 + i * 2.8, y - 3.9, 1.2, 1.6, "#f4ead8");
    rund(c, x + 3.4, y - 3.2, 5.6, 3.2, 0.8, "#e79a92");
    rund(c, x + 3.8, y - 2.4, 4.8, 0.8, 0.3, "#fff1ec");
  } else if (was === "nudeln") {
    rund(c, x - 3.2, y - 10, 6.4, 10, 1, "#e8c34a");
    rund(c, x - 2.2, y - 7.2, 4.4, 3.4, 0.6, "#c9453a");
  } else if (was === "sosse") {
    rund(c, x - 3, y - 8, 6, 8, 1.3, "#b8322a");
    rund(c, x - 3.4, y - 9.4, 6.8, 1.8, 0.6, "#e6e1d0");
  } else if (was === "pizzakarton") {
    rund(c, x - 8, y - 2.4, 16, 2.4, 0.5, "#c9a46a");
    rund(c, x - 8, y - 1.5, 16, 0.8, 0.2, "#c9453a");
  }
}

/** Backofen vorn am Herd (x = 690): Tür, Glut, Pizza auf dem Rost. */
function zeichneOfen(c: C, F: number, s: KochStand, t: number) {
  const x = 690;
  const innen = s.ofen > 0.02;
  if (!innen && s.ofenAn) {
    c.fillStyle = `rgba(255,140,40,${0.42 + 0.08 * Math.sin(t * 5)})`;
    c.fillRect(x + 6, F - 24, 24, 12);
  }
  if (innen) {
    c.fillStyle = s.ofenAn ? "#8a3d12" : "#2f353b";
    c.fillRect(x + 5, F - 25, 26, 16);
    c.fillStyle = s.ofenAn ? "rgba(255,150,50,.55)" : "rgba(80,90,100,.5)";
    c.fillRect(x + 6, F - 24, 24, 13);
    c.fillStyle = "#9aa1a6"; c.fillRect(x + 6, F - 14.5, 24, 1);
    if (s.pizza === "ofen") zeichnePizza(c, x + 18, F - 16.5, 10.5, 2.5, 6, s.pizzaGar);
    // Die Tür klappt nach vorn unten und liegt als schmale Fläche davor.
    const k = s.ofen;
    c.fillStyle = "#c4cacb";
    c.beginPath();
    c.moveTo(x + 4, F - 9);
    c.lineTo(x + 32, F - 9);
    c.lineTo(x + 32 + 1.5 * k, F - 9 + 6 * k);
    c.lineTo(x + 4 - 1.5 * k, F - 9 + 6 * k);
    c.closePath(); c.fill();
    c.fillStyle = "#8f989d"; c.fillRect(x + 6, F - 8.5 + 5 * k, 24, 1);
  }
}

/** Alles, was zum Kochen hinter Luni steht oder liegt (Herd, Töpfe, Teller, Ofen). */
export function zeichneKochSzene(c: C, F: number, s: KochStand, t: number) {
  const yP = F - 42;
  if (s.plattenL > 0.02) herdGlut(c, KOCH_ORTE.platteL, yP, s.plattenL);
  if (s.plattenR > 0.02) herdGlut(c, KOCH_ORTE.platteR, yP, s.plattenR);
  zeichneOfen(c, F, s, t);
  if (s.topf === "herd") {
    zeichneTopf(c, KOCH_ORTE.platteL, yP + 0.4, s.topfInhalt, s.blubber, s.nudelGar, t);
    zeichneDampf(c, KOCH_ORTE.platteL, yP - 11, s.blubber * (s.topfInhalt === "leer" ? 0 : 1), t);
  }
  if (s.pfanne === "herd") {
    zeichnePfanne(c, KOCH_ORTE.platteR, yP + 0.4, s.pfanneInhalt, s.eier, s.gar, t);
    const heiss = s.plattenR > 0.5 && s.pfanneInhalt !== "leer" ? 0.7 : 0;
    zeichneDampf(c, KOCH_ORTE.platteR, yP - 5, heiss, t);
    if (s.eiFall > 0 && s.eiFall < 1) {
      const y = (F - 62) + (yP - 5 - (F - 62)) * s.eiFall * s.eiFall;
      oval(c, KOCH_ORTE.platteR + 1, y, 1.5, 1.9, "#f4ead8");
      kreis(c, KOCH_ORTE.platteR + 1, y + 0.4, 0.9, "#f4b52a");
    }
  }
  if (s.ablage) zeichneAblageDing(c, KOCH_ORTE.ablageX, F - 40, s.ablage);
  if (s.teller === "tisch") zeichneKochTeller(c, KOCH_ORTE.tellerX, F - 38, s.tellerInhalt, s.rest, s.tellerSosse);
}

/** Der Gegenstand in Lunis Hand; `hand` ist der Griffpunkt. */
export function zeichneKochHand(c: C, hand: Pt, s: KochStand, t: number) {
  const [hx, hy] = hand;
  switch (s.hand) {
    case "eierspeck": zeichneAblageDing(c, hx + 1, hy + 4.5, "eierspeck"); break;
    case "eier":
      rund(c, hx - 5, hy + 1, 9, 3.6, 1, "#d9cdb4");
      for (let i = 0; i < 3; i++) oval(c, hx - 3.4 + i * 2.8, hy + 0.8, 1.2, 1.6, "#f4ead8");
      break;
    case "ei": oval(c, hx + 0.6, hy - 0.4, 1.6, 2.1, "#f4ead8"); break;
    case "pfanne": zeichnePfanne(c, hx + 15, hy + 3.7, s.pfanneInhalt, s.eier, s.gar, t, s.kipp); break;
    case "topf": zeichneTopf(c, hx + 8.8, hy + 8.6, s.topfInhalt, s.blubber, s.nudelGar, t, s.kipp); break;
    case "teller": zeichneKochTeller(c, hx + 1, hy + 2.2, s.tellerInhalt, s.rest, s.tellerSosse); break;
    case "nudeln": zeichneAblageDing(c, hx + 1, hy + 9, "nudeln"); break;
    case "sosse": zeichneAblageDing(c, hx + 1, hy + 8, "sosse"); break;
    case "pizzakarton": zeichneAblageDing(c, hx + 1, hy + 4, "pizzakarton"); break;
    case "pizza": zeichnePizza(c, hx + 1, hy + 2.4, 9.5, 2.8, 6, s.pizzaGar); break;
    case "gabel":
      c.strokeStyle = "#c9ced1"; c.lineWidth = 0.7; c.lineCap = "round";
      c.beginPath(); c.moveTo(hx - 1, hy + 1); c.lineTo(hx + 4.6, hy - 2.4); c.stroke();
      c.beginPath(); c.moveTo(hx + 4.6, hy - 2.4); c.lineTo(hx + 6.6, hy - 3.8); c.moveTo(hx + 4.2, hy - 1.6); c.lineTo(hx + 6.2, hy - 3.0); c.stroke();
      if (s.tellerInhalt === "nudeln") kreis(c, hx + 6.2, hy - 3.4, 1.1, "#e8cf8a");
      else if (s.tellerInhalt === "speckEi") kreis(c, hx + 6.2, hy - 3.4, 1.1, "#f6f3ea");
      break;
    case "stueck":
      c.fillStyle = "#e4a93e";
      c.beginPath(); c.moveTo(hx, hy + 1.4); c.lineTo(hx + 7, hy - 2); c.lineTo(hx + 6.4, hy + 2); c.closePath(); c.fill();
      kreis(c, hx + 4.2, hy, 0.9, "#b8322a");
      break;
    default: break;
  }
}
