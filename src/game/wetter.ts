/* Wetter und Jahreszeiten – reine Logik plus Canvas-Außenwirkung.
   Echtwetter läuft in Echtzeit und wird gespeichert; Testwetter gilt bis
   Neustart oder zur nächsten Wahl und überschreibt nur diese Sitzung. */
export type Jahreszeit = "fruehling" | "sommer" | "herbst" | "winter";
export type WetterArt = "sonne" | "bewoelkt" | "regen" | "schnee" | "hagel" | "nebel" | "sturm" | "gewitter";
export type Zusatz = "blitze" | "wind" | "nebel" | "dunkel" | "frost";

export interface WetterState {
  season: Jahreszeit;
  art: WetterArt;
  zusatz: Zusatz[];
  test: boolean;
  until: number;
  snow: number;
  updated: number;
}

export const JAHRESZEITEN: readonly Jahreszeit[] = ["fruehling", "sommer", "herbst", "winter"];
export const WETTERARTEN: readonly WetterArt[] = ["sonne", "bewoelkt", "regen", "schnee", "hagel", "nebel", "sturm", "gewitter"];
export const ZUSAETZE: readonly Zusatz[] = ["blitze", "wind", "nebel", "dunkel", "frost"];
export const NAMEN = {
  fruehling: "Frühling", sommer: "Sommer", herbst: "Herbst", winter: "Winter",
  sonne: "Sonnenschein", bewoelkt: "Bewölkt", regen: "Regen", schnee: "Schnee",
  hagel: "Hagel", nebel: "Nebel", sturm: "Sturm", gewitter: "Gewitter",
  blitze: "Blitze", wind: "Wind", nebelZ: "Nebel", dunkel: "Dunkel", frost: "Frost",
} as const;

const ECHT = "lcp1.wetter.echt.v1";
const TEST = "lcp1.wetter.test.v1";
/** Testwetter nur im Speicher: überlebt Weltwechsel, nicht den Neustart. */
let testWetter: WetterState | null = null;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

export function jahreszeitFuer(d: Date): Jahreszeit {
  const m = d.getMonth();
  return m <= 1 || m === 11 ? "winter" : m <= 4 ? "fruehling" : m <= 7 ? "sommer" : "herbst";
}

export function wetterGewichtet(season: Jahreszeit, rand = Math.random): WetterArt {
  const w: Record<Jahreszeit, [WetterArt, number][]> = {
    fruehling: [["sonne", 30], ["bewoelkt", 24], ["regen", 26], ["sturm", 6], ["nebel", 6], ["gewitter", 4], ["hagel", 2], ["schnee", 2]],
    sommer: [["sonne", 46], ["bewoelkt", 22], ["regen", 12], ["gewitter", 10], ["hagel", 6], ["sturm", 4]],
    herbst: [["sonne", 16], ["bewoelkt", 24], ["regen", 28], ["nebel", 14], ["sturm", 12], ["gewitter", 4], ["hagel", 2]],
    winter: [["bewoelkt", 26], ["schnee", 26], ["sonne", 16], ["regen", 12], ["nebel", 10], ["sturm", 6], ["hagel", 4]],
  };
  const sum = w[season].reduce((a, [, n]) => a + n, 0);
  let r = rand() * sum;
  for (const [k, n] of w[season]) { r -= n; if (r <= 0) return k; }
  return w[season][0][0];
}

function neueLage(now: number, season: Jahreszeit): Pick<WetterState, "art" | "until"> {
  const hours = 5 + Math.floor(Math.random() * 50); // 5–55 Stunden, nie im Sekundentakt
  return { art: wetterGewichtet(season), until: now + hours * 3_600_000 };
}

export function echtesWetter(now = Date.now()): WetterState {
  const season = jahreszeitFuer(new Date(now));
  return { season, art: wetterGewichtet(season), zusatz: [], test: false, until: now + 8 * 3_600_000, snow: season === "winter" ? .25 : 0, updated: now };
}

export function ladeWetter(now = Date.now()): WetterState {
  try {
    if (testWetter) return testWetter;
    const raw = localStorage.getItem(ECHT);
    if (raw) {
      const s = JSON.parse(raw) as WetterState;
      if (s && s.season && s.art) {
        s.test = false;
        if (!s.zusatz) s.zusatz = [];
        return s;
      }
    }
  } catch { /* Speicher gesperrt – frisches Echtwetter */ }
  const frisch = echtesWetter(now);
  speichereWetter(frisch);
  return frisch;
}

export function speichereWetter(w: WetterState) {
  try {
    if (w.test) { testWetter = w; return; }
    testWetter = null;
    try { sessionStorage.removeItem(TEST); } catch { /* egal */ }
    localStorage.setItem(ECHT, JSON.stringify({ ...w, test: false }));
  } catch { /* Speicher voll/gesperrt: Anzeige läuft weiter */ }
}

/** Ein Schritt der Wettersimulation. Echtwetter rechnet über gespeicherte Zeit. */
export function tickWetter(w: WetterState, now = Date.now()): WetterState {
  if (w.test) return w;
  const season = jahreszeitFuer(new Date(now));
  let changed = false;
  if (now >= w.until) {
    Object.assign(w, { ...neueLage(now, season), zusatz: [], season });
    changed = true;
  }
  if (season !== w.season) { w.season = season; changed = true; }
  const dtH = clamp01((now - (Number.isFinite(w.updated) ? w.updated : now)) / 3_600_000);
  if (w.art === "schnee" || w.zusatz.includes("frost")) {
    const snow = Math.min(1, w.snow + dtH * .045);
    if (snow !== w.snow) { w.snow = snow; changed = true; }
  } else {
    const tau = season === "winter" && w.zusatz.includes("frost") ? .001 : season === "winter" ? .006 : .018;
    const snow = Math.max(0, w.snow - dtH * tau);
    if (snow !== w.snow) { w.snow = snow; changed = true; }
  }
  w.updated = now;
  if (changed) speichereWetter(w);
  return w;
}

export function waehleJahreszeit(w: WetterState, season: Jahreszeit): WetterState {
  const test = { ...w, season, test: true, zusatz: [...w.zusatz], updated: Date.now() };
  speichereWetter(test); return test;
}
export function waehleWetter(w: WetterState, art: WetterArt): WetterState {
  const test = { ...w, art, test: true, zusatz: [...w.zusatz], updated: Date.now() };
  if (art === "schnee") test.snow = Math.max(test.snow, .6);
  else if (art === "sonne" || art === "bewoelkt") test.snow = Math.min(test.snow, .15);
  speichereWetter(test); return test;
}
export function schalteZusatz(w: WetterState, z: Zusatz): WetterState {
  const aktiv = w.zusatz.includes(z);
  const zusatz = aktiv ? w.zusatz.filter((x) => x !== z) : w.zusatz.length >= 3 ? w.zusatz : [...w.zusatz, z];
  const test = { ...w, zusatz, test: true, updated: Date.now() };
  speichereWetter(test); return test;
}
export function echtwetter(_w: WetterState): WetterState {
  const neu = echtesWetter();
  testWetter = null;
  try { sessionStorage.removeItem(TEST); } catch { /* egal */ }
  speichereWetter({ ...neu, test: false });
  return { ...neu, zusatz: [] };
}

export function beschreibung(w: WetterState): string {
  const z = w.zusatz.map((x) => NAMEN[x === "nebel" ? "nebelZ" : x]);
  return `${NAMEN[w.art]}${z.length ? " + " + z.join(" + ") : ""}${w.test ? " (Test)" : ""}`;
}

const WINDOWS: readonly [number, number, number, number][] = [
  [330, 358, 64, 38], [624, 364, 50, 36], [740, 236, 44, 78],
  [334, 244, 62, 46], [330, 98, 56, 44], [704, 472, 36, 20],
];
const PALETTE: Record<Jahreszeit, [string, string]> = {
  fruehling: ["rgba(190,230,160,.20)", "rgba(255,236,170,.16)"],
  sommer: ["rgba(255,226,140,.18)", "rgba(160,220,230,.10)"],
  herbst: ["rgba(220,150,80,.22)", "rgba(255,205,120,.12)"],
  winter: ["rgba(180,210,235,.28)", "rgba(235,245,255,.18)"],
};

/* ------------------------------- Zeichenbereich ----------------------------- */

/** Fläche außerhalb des Hauses: alles, nur nicht die Haus-Silhouette. */
function aussenPfad(c: CanvasRenderingContext2D) {
  c.beginPath();
  c.rect(0, 0, 960, 600);
  // Haus mit Dach, Schornstein und Außenwänden als Aussparung
  c.moveTo(98, 600); c.lineTo(98, 128); c.lineTo(86, 128); c.lineTo(86, 118);
  c.lineTo(470, 22); c.lineTo(854, 118); c.lineTo(854, 128); c.lineTo(842, 128);
  c.lineTo(842, 600); c.closePath();
  c.rect(686, 4, 38, 126);
}
/** Nur die Fensterflächen; Wetter scheint dort durch, nicht durch Wände. */
function fensterPfad(c: CanvasRenderingContext2D) {
  c.beginPath();
  for (const [x, y, w, h] of WINDOWS) c.rect(x, y, w, h);
}

function farbton(c: CanvasRenderingContext2D, season: Jahreszeit) {
  const [a, b] = PALETTE[season];
  const g = c.createLinearGradient(0, 0, 0, 600);
  g.addColorStop(0, a); g.addColorStop(1, b);
  return g;
}

function wolken(c: CanvasRenderingContext2D, t: number, storm: boolean, dark: boolean) {
  c.globalAlpha = dark ? .5 : .3; c.fillStyle = "#56646c";
  for (let i = 0; i < 9; i++) {
    const cx = (i * 137 + t * (storm ? 8 : 2.2)) % 1060 - 60, cy = 34 + (i * 47) % 92;
    c.beginPath(); c.ellipse(cx, cy, 56 + (i % 3) * 14, 15 + (i % 2) * 5, 0, 0, Math.PI * 2);
    c.fillStyle = "rgba(206,214,214,.25)"; c.fill();
  }
  c.globalAlpha = 1;
}

function niederschlag(c: CanvasRenderingContext2D, w: WetterState, t: number, b: { x: number; y: number; w: number; h: number }, dicht: number) {
  const storm = w.art === "sturm" || w.zusatz.includes("wind");
  const schnee = w.art === "schnee";
  const hagel = w.art === "hagel";
  const n = Math.round(dicht * (b.w * b.h) / 2400);
  c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip();
  for (let i = 0; i < n; i++) {
    const sp = schnee ? 9 : hagel ? 34 : 26;
    const sx = b.x + ((hash(i * 3.1 + b.w) * b.w + t * sp + (storm ? 14 : 0) * (i % 3)) % b.w);
    const sy = b.y + ((hash(i * 7.7 + b.h) * b.h + t * (schnee ? 12 : 46)) % b.h);
    if (hagel) { c.fillStyle = "rgba(232,246,252,.9)"; c.fillRect(sx, sy, 1.8, 1.8); }
    else if (schnee) { c.fillStyle = "rgba(247,251,255,.88)"; c.beginPath(); c.arc(sx, sy, 1 + (i % 3) * .4, 0, Math.PI * 2); c.fill(); }
    else { c.strokeStyle = "rgba(182,214,230,.55)"; c.lineWidth = .9; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - (storm ? 4 : 1), sy + 7); c.stroke(); }
  }
  c.restore();
}

function wetterImFenster(c: CanvasRenderingContext2D, w: WetterState, t: number) {
  c.save(); fensterPfad(c); c.clip();
  // Jahreszeitliche Tönung der Scheiben
  c.fillStyle = farbton(c, w.season); c.globalAlpha = .5;
  for (const [x, y, ww, hh] of WINDOWS) c.fillRect(x, y, ww, hh);
  c.globalAlpha = 1;
  if (w.art === "sonne") {
    for (const [x, y, ww, hh] of WINDOWS) {
      const gg = c.createLinearGradient(x, y, x + ww, y + hh);
      gg.addColorStop(0, "rgba(255,246,205,.5)"); gg.addColorStop(1, "rgba(255,240,190,.1)");
      c.fillStyle = gg; c.fillRect(x, y, ww, hh);
    }
  }
  if (["regen", "sturm", "gewitter", "schnee", "hagel"].includes(w.art)) {
    for (const [x, y, ww, hh] of WINDOWS) niederschlag(c, w, t, { x, y, w: ww, h: hh }, 1.2);
  }
  if (w.art === "nebel" || w.zusatz.includes("nebel")) {
    c.fillStyle = "rgba(214,221,217,.28)";
    for (const [x, y, ww, hh] of WINDOWS) c.fillRect(x, y, ww, hh);
  }
  const blitz = (w.art === "gewitter" || w.zusatz.includes("blitze")) && ((t + 2) % 13) < .22;
  if (blitz) {
    c.fillStyle = "rgba(245,251,255,.62)";
    for (const [x, y, ww, hh] of WINDOWS) c.fillRect(x, y, ww, hh);
  }
  if (w.zusatz.includes("frost")) {
    c.strokeStyle = "rgba(235,248,255,.75)"; c.lineWidth = .8;
    for (const [x, y, ww, hh] of WINDOWS) {
      for (let i = 0; i < 5; i++) lineFrost(c, x + hash(i + x) * ww, y + hash(i + y) * hh);
      c.strokeStyle = "rgba(255,255,255,.55)"; c.strokeRect(x + 1, y + 1, ww - 2, hh - 2);
      c.strokeStyle = "rgba(235,248,255,.75)";
    }
  }
  if (w.snow > .02) {
    c.fillStyle = `rgba(246,250,255,${.45 + w.snow * .45})`;
    for (const [x, y, ww] of WINDOWS) c.fillRect(x, y + .6, ww, 1 + w.snow * 2.2);
  }
  c.restore();
}

/** Zeichnet das Wetter ausschließlich hinter dem Haus und in den Fenstern. */
export function drawWetter(c: CanvasRenderingContext2D, w: WetterState, t: number) {
  c.save();
  aussenPfad(c); c.clip("evenodd");
  c.fillStyle = farbton(c, w.season); c.fillRect(0, 0, 960, 600);
  const storm = w.art === "sturm" || w.zusatz.includes("wind");
  const dark = w.zusatz.includes("dunkel");
  if (w.art === "sonne") {
    const g = c.createRadialGradient(230, 70, 2, 230, 70, 190);
    g.addColorStop(0, "rgba(255,244,190,.5)"); g.addColorStop(1, "rgba(255,244,190,0)");
    c.fillStyle = g; c.fillRect(0, 0, 960, 260);
  }
  if (["bewoelkt", "regen", "sturm", "gewitter"].includes(w.art)) wolken(c, t, storm, dark);
  if (["regen", "sturm", "gewitter", "schnee", "hagel"].includes(w.art)) {
    niederschlag(c, w, t, { x: 0, y: 0, w: 960, h: 600 }, 1.6);
  }
  if (w.art === "nebel" || w.zusatz.includes("nebel")) {
    c.fillStyle = "rgba(216,222,218,.20)"; c.fillRect(0, 0, 960, 600);
    for (let i = 0; i < 6; i++) {
      const x = (i * 190 + t * 3) % 1180 - 110, y = 150 + i * 54;
      const g = c.createRadialGradient(x, y, 4, x, y, 110);
      g.addColorStop(0, "rgba(238,241,235,.20)"); g.addColorStop(1, "rgba(238,241,235,0)");
      c.fillStyle = g; c.beginPath(); c.arc(x, y, 110, 0, Math.PI * 2); c.fill();
    }
  }
  const thunder = w.art === "gewitter" || w.zusatz.includes("blitze");
  if (thunder) {
    const phase = (t + 2) % 13;
    if (phase < .22) {
      c.globalAlpha = .18 + .3 * Math.sin((phase / .22) * Math.PI);
      c.fillStyle = "#eef6ff"; c.fillRect(0, 0, 960, 600);
      c.globalAlpha = 1;
    }
  }
  if (storm) {
    for (let i = 0; i < 8; i++) {
      const x = (i * 131 + t * 32) % 1000 - 30;
      const g = c.createLinearGradient(x, 0, x + 24, 0);
      g.addColorStop(0, "rgba(220,235,235,0)"); g.addColorStop(.5, "rgba(220,235,235,.12)"); g.addColorStop(1, "rgba(220,235,235,0)");
      c.fillStyle = g; c.fillRect(x, 130 + (i % 3) * 60, 26, 180);
    }
  }
  if (w.snow > .02) {
    c.fillStyle = `rgba(244,249,255,${.25 + w.snow * .5})`;
    c.fillRect(0, 456, 350, 2 + w.snow * 5);
    c.fillRect(842, 454, 118, 2 + w.snow * 4);
    // Schnee auf dem Dach: außerhalb des Hauses liegt die Traufe frei
    for (let x = 88; x < 852; x += 9) {
      const rt = 22 + .25 * Math.abs(x - 470);
      c.fillRect(x, rt - 1, 9, 1.4 + w.snow * 2);
    }
  }
  c.restore();
  wetterImFenster(c, w, t);
}
function lineFrost(c: CanvasRenderingContext2D, x: number, y: number) {
  c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.moveTo(x, y - 3); c.lineTo(x, y + 3); c.stroke();
}
