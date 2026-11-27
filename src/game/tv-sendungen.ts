/* =======================================================================
   TV-SENDUNGEN – 12 kompakte 5-Minuten-Programme fürs Wohnzimmer- & DG-TV

   Jede Sendung entwickelt sich über volle 300 Sekunden (5 Minuten) mit
   straffen Akten ohne lange Wiederholungsschleifen – ideal beim Essen.
   Tagesabhängige Variationen (Landschaft, Täter, Rätsel, Rennverlauf)
   entstehen rein aus dem Berliner Kalendertag.

   Plattformregeln: reine Canvas-2D-Primitive, keine Assets, keine Web-APIs,
   feste Bühnenfläche 320×208 (sauber skalierbar auf 40×26, 560×364, 720×300).
   ======================================================================= */

type C = CanvasRenderingContext2D;

export const SENDUNG_DAUER = 300; // 5 Minuten in Sekunden

export const TV_SENDUNGEN = [
  "malfreude",
  "zugfahrt",
  "tiefsee",
  "domino",
  "wald",
  "krimi",
  "expedition",
  "theater",
  "kochshow",
  "froschnews",
  "rennen",
  "quizshow",
] as const;

export type TVSendungId = (typeof TV_SENDUNGEN)[number];

export const TV_SENDUNG_NAMEN: Record<TVSendungId, string> = {
  malfreude: "Malfreude",
  zugfahrt: "Zugfahrt",
  tiefsee: "Tiefsee",
  domino: "Domino",
  wald: "Natur-Doku",
  krimi: "Nachtzug-Krimi",
  expedition: "Weltraum-Reise",
  theater: "Puppentheater",
  kochshow: "Kochshow",
  froschnews: "Frosch-News",
  rennen: "Retro-Rennen",
  quizshow: "Bilderrätsel",
};

const SENDUNG_SET = new Set<string>(TV_SENDUNGEN);
export function istTvSendung(id: string | null | undefined): id is TVSendungId {
  return !!id && SENDUNG_SET.has(id);
}

const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t);
const smooth = (t: number) => {
  const q = clamp(t);
  return q * q * (3 - 2 * q);
};
const seg = (t: number, a: number, b: number) => clamp((t - a) / Math.max(0.001, b - a));
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function rect(c: C, x: number, y: number, w: number, h: number, f: string) {
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
}
function rrect(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function disc(c: C, x: number, y: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.arc(x, y, Math.max(0.1, r), 0, TAU);
  c.fill();
}
function oval(c: C, x: number, y: number, rx: number, ry: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  c.fill();
}
function poly(c: C, pts: readonly [number, number][], f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fill();
}
function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
function mixCol(a: string, b: string, k: number): string {
  const t = clamp(k);
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  return `#${hex2(r1 + (r2 - r1) * t)}${hex2(g1 + (g2 - g1) * t)}${hex2(b1 + (b2 - b1) * t)}`;
}

/** Dezente Einblendung unten/oben für Kapitel oder Sender-Bauchbinde (nur wenn groß genug). */
function bauchbinde(c: C, oben: string, unten: string, gross: boolean) {
  if (!gross) return;
  rrect(c, 10, 174, 300, 26, 4, "rgba(8,20,26,.82)");
  rect(c, 10, 174, 4, 26, "#e8b94f");
  c.fillStyle = "#ffd98a";
  c.font = '700 8px "Silkscreen", monospace';
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText(oben, 20, 182);
  c.fillStyle = "#eef7f2";
  c.font = '600 9px "Space Grotesk", sans-serif';
  c.fillText(unten, 20, 193);
}

/** Kleine Tanne für Landschaften. */
function tanne(c: C, x: number, y: number, h: number, farbe: string, schnee = false) {
  rect(c, x - h * 0.08, y - h * 0.22, h * 0.16, h * 0.22, "#4a3220");
  for (let i = 0; i < 3; i++) {
    const yb = y - h * (0.18 + i * 0.25);
    const yt = yb - h * 0.36;
    const hw = h * (0.34 - i * 0.075);
    poly(c, [[x, yt], [x - hw, yb], [x + hw, yb]], farbe);
    if (schnee) poly(c, [[x, yt], [x - hw * 0.52, yt + h * 0.13], [x + hw * 0.52, yt + h * 0.13]], "#edf5fa");
  }
}

/** Kleine Wolke. */
function wolke(c: C, x: number, y: number, s: number, f = "#f7f6f0") {
  oval(c, x, y, 16 * s, 7 * s, f);
  oval(c, x - 11 * s, y + 2 * s, 10 * s, 5.5 * s, f);
  oval(c, x + 11 * s, y + 2 * s, 11 * s, 5.5 * s, f);
}

/* =========================================================================
   1. MALFREUDE – Bob-Ross-Malshow über 15 Minuten
   ========================================================================= */
const MAL_PALETTEN = [
  { name: "ALPENMORGEN", skyA: "#3c73a8", skyB: "#f2c68f", mtnA: "#586f8c", mtnB: "#3e4f68", snow: "#f5f8fc", see: "#4a789c", tree: "#1e4b34", schnee: false },
  { name: "ABENDGOLD", skyA: "#5d3b6e", skyB: "#f09459", mtnA: "#6b4768", mtnB: "#422b49", snow: "#ffe2c6", see: "#7d5370", tree: "#233a2c", schnee: false },
  { name: "WINTERSTILLE", skyA: "#223b5e", skyB: "#9dc5d8", mtnA: "#5f7a96", mtnB: "#3c536e", snow: "#f2f8ff", see: "#557d99", tree: "#1f453b", schnee: true },
  { name: "NEBELTAL", skyA: "#4d7e8a", skyB: "#d8e6dc", mtnA: "#65848c", mtnB: "#46636c", snow: "#eef5f2", see: "#5f8c96", tree: "#264d3c", schnee: false },
] as const;

function drawMalfreude(c: C, t: number, tag: number, gross: boolean) {
  const pal = MAL_PALETTEN[Math.abs(tag) % MAL_PALETTEN.length];
  // Warmes Atelier im Hintergrund
  const bg = c.createLinearGradient(0, 0, 0, 208);
  bg.addColorStop(0, "#232a30");
  bg.addColorStop(1, "#161b20");
  c.fillStyle = bg;
  c.fillRect(-140, 0, 600, 208);
  rect(c, 156, 4, 8, 204, "#6e4c2e");
  rect(c, 66, 178, 188, 9, "#7d5735");
  rect(c, 74, 187, 8, 21, "#5c3e24");
  rect(c, 238, 187, 8, 21, "#5c3e24");
  // Farbpalette links
  oval(c, 34, 152, 24, 18, "#9e7348");
  disc(c, 24, 156, 4.5, "#1a2026");
  const farben = [pal.skyA, pal.skyB, pal.mtnA, pal.tree, "#f5f8fc", "#d95b43"];
  farben.forEach((f, i) => disc(c, 22 + (i % 3) * 11, 141 + Math.floor(i / 3) * 11, 3.6, f));

  const cx = 68, cy = 14, cw = 184, ch = 162;
  rect(c, cx - 2, cy - 2, cw + 4, ch + 4, "#3b2c1d");
  rect(c, cx, cy, cw, ch, "#f4f1e8");

  c.save();
  c.beginPath(); c.rect(cx, cy, cw, ch); c.clip();

  /* ---------- Phase 1: Vorzeichnen – erst die Konturen, mit schwungvoller Hand ---------- */
  const pLinie = seg(t, 2, 96);
  const kontur = (punkte: readonly [number, number][], anteil: number, breite = 0.75, farbe = "rgba(48,42,34,.72)") => {
    if (anteil <= 0) return;
    // Länge der Linie für die organische Enthüllung (Pinsel zieht die Kontur nach)
    let len = 0;
    for (let i = 1; i < punkte.length; i++) len += Math.hypot(punkte[i][0] - punkte[i - 1][0], punkte[i][1] - punkte[i - 1][1]);
    c.save();
    c.strokeStyle = farbe; c.lineWidth = breite; c.lineCap = "round"; c.lineJoin = "round";
    c.setLineDash([len, len + 2]);
    c.lineDashOffset = len * (1 - clamp(anteil));
    c.beginPath();
    c.moveTo(punkte[0][0], punkte[0][1]);
    for (let i = 1; i < punkte.length; i++) c.lineTo(punkte[i][0], punkte[i][1]);
    c.stroke();
    c.restore();
  };
  const gebirgeFern = (): [number, number][] => [[cx, cy + 100], [cx + 34, cy + 58], [cx + 72, cy + 76], [cx + 120, cy + 44], [cx + 184, cy + 70]];
  const gebirgeNah = (): [number, number][] => [[cx, cy + 104], [cx + 48, cy + 42], [cx + 96, cy + 78], [cx + 146, cy + 50], [cx + 184, cy + 82]];
  const uferLinks = (): [number, number][] => [[cx, cy + 114], [cx + 30, cy + 119], [cx + 52, cy + 128], [cx + 56, cy + 162]];
  const uferRechts = (): [number, number][] => [[cx + 184, cy + 118], [cx + 156, cy + 124], [cx + 140, cy + 132], [cx + 136, cy + 162]];
  const huette = (): [number, number][] => [[cx + 44, cy + 134], [cx + 44, cy + 116], [cx + 59, cy + 103], [cx + 74, cy + 116], [cx + 74, cy + 134]];
  const baumKontur = (bx: number, by: number, h: number): [number, number][] => [
    [bx, by - h], [bx - h * 0.34, by - h * 0.55], [bx, by - h * 0.62], [bx - h * 0.4, by - h * 0.18], [bx + h * 0.4, by - h * 0.18], [bx, by - h * 0.62], [bx + h * 0.34, by - h * 0.55], [bx, by - h],
  ];
  const baumListe: [number, number, number][] = [
    [cx + 16, cy + 122, 34], [cx + 28, cy + 126, 44], [cx + 46, cy + 132, 30],
    [cx + 168, cy + 124, 38], [cx + 154, cy + 130, 48], [cx + 138, cy + 136, 28],
  ];
  kontur([[cx + 4, cy + 100], [cx + 180, cy + 100]], seg(pLinie, 0, 0.22));
  kontur(gebirgeFern(), seg(pLinie, 0.18, 0.42));
  kontur(gebirgeNah(), seg(pLinie, 0.36, 0.58));
  kontur([[cx + 4, cy + 108], [cx + 180, cy + 108]], seg(pLinie, 0.5, 0.62));
  kontur(uferLinks(), seg(pLinie, 0.6, 0.72)); kontur(uferRechts(), seg(pLinie, 0.62, 0.74));
  kontur(huette(), seg(pLinie, 0.7, 0.84));
  baumListe.forEach(([bx, by, h], i) => kontur(baumKontur(bx, by, h), seg(pLinie, 0.74 + i * 0.03, 0.82 + i * 0.03), 0.6));
  kontur([[cx + 68, cy + 144], [cx + 92, cy + 144], [cx + 92, cy + 147]], seg(pLinie, 0.88, 1));

  /* ---------- Phase 2: Füllen mit schwungvoller Pinselführung (kein Zeile-für-Zeile) ---------- */
  const pFuell = seg(t, 84, 244);
  // Farbfront: eine weiche, wellige Kante zieht schräg über die Leinwand.
  const front = (anteil: number, phase: number) => {
    const p = smooth(anteil);
    c.beginPath();
    c.moveTo(cx - 4, cy - 4);
    const bis = cy + ch * (1 + p) + 8;
    const nx = cx + cw * (p * 1.35 - 0.15);
    for (let y = cy - 4; y <= bis; y += 7) {
      const welle = Math.sin(y * 0.075 + phase + p * 5) * 7 + Math.sin(y * 0.19 - p * 2.4) * 3.5;
      c.lineTo(clamp(nx + welle - (y - cy) * 0.22, cx - 8, cx + cw + 8), y);
    }
    c.lineTo(cx - 4, bis);
    c.closePath();
    c.clip();
  };
  const lay = (von: number, phase: number, fn: () => void) => {
    const p = seg(pFuell, von, Math.min(1, von + 0.42));
    if (p <= 0) return;
    c.save(); front(p, phase); fn(); c.restore();
  };
  // Himmel: breite, überlappende Pinselbahnen in drei Tönen
  lay(0, 0.2, () => {
    const sg = c.createLinearGradient(0, cy, 0, cy + ch * 0.6);
    sg.addColorStop(0, pal.skyA); sg.addColorStop(1, pal.skyB);
    c.fillStyle = sg; c.fillRect(cx - 4, cy - 4, cw + 8, ch * 0.62);
    for (let i = 0; i < 5; i++) {
      const y = cy + 8 + i * 17;
      c.strokeStyle = i % 2 ? "rgba(255,255,255,.12)" : "rgba(20,40,70,.10)";
      c.lineWidth = 7; c.lineCap = "round";
      c.beginPath(); c.moveTo(cx - 6, y); c.bezierCurveTo(cx + 40, y - 5, cx + 120, y + 6, cx + cw + 6, y - 2); c.stroke();
    }
  });
  lay(0.10, 0.8, () => {
    disc(c, cx + 132, cy + 44, 14, "rgba(255,244,205,.9)");
    const wList: [number, number, number][] = [[cx + 42, cy + 32, 1.15], [cx + 108, cy + 24, 0.95], [cx + 152, cy + 38, 1.05], [cx + 76, cy + 46, 0.85]];
    wList.forEach(([wx, wy, ws], i) => { if (smooth(seg(pFuell, 0.10 + i * 0.03, 0.34 + i * 0.03)) > 0) wolke(c, wx, wy, ws, "#fff7ea"); });
  });
  lay(0.24, 1.6, () => poly(c, [...gebirgeFern(), [cx + 184, cy + 118], [cx, cy + 118]] as [number, number][], pal.mtnA));
  lay(0.36, 2.4, () => {
    poly(c, [...gebirgeNah(), [cx + 184, cy + 120], [cx, cy + 120]] as [number, number][], pal.mtnB);
    poly(c, [[cx + 48, cy + 42], [cx + 64, cy + 58], [cx + 52, cy + 61], [cx + 41, cy + 55]], pal.snow);
    poly(c, [[cx + 146, cy + 50], [cx + 160, cy + 64], [cx + 148, cy + 67], [cx + 138, cy + 60]], pal.snow);
  });
  lay(0.50, 3.1, () => {
    const seeY = cy + ch * 0.6;
    const lg = c.createLinearGradient(0, seeY, 0, cy + ch);
    lg.addColorStop(0, pal.see); lg.addColorStop(1, mixCol(pal.see, "#122230", 0.55));
    c.fillStyle = lg; c.fillRect(cx - 4, seeY - 2, cw + 8, ch * 0.42);
    c.globalAlpha = 0.28;
    poly(c, [[cx + 14, seeY], [cx + 52, seeY + 34], [cx + 94, seeY]], pal.mtnB);
    poly(c, [[cx + 114, seeY], [cx + 146, seeY + 28], [cx + 180, seeY]], pal.mtnB);
    c.globalAlpha = 0.5;
    for (let i = 0; i < 9; i++) {
      const ry = seeY + 6 + i * 6.5;
      if (ry < cy + ch) rect(c, cx + 18 + (i % 3) * 32 + Math.sin(t + i) * 2, ry, 28 + (i % 2) * 18, 1.3, "#eef6fa");
    }
    c.globalAlpha = 1;
  });
  lay(0.62, 3.9, () => {
    poly(c, [...uferLinks(), [cx, cy + ch]] as [number, number][], mixCol(pal.tree, "#524632", 0.4));
    poly(c, [...uferRechts(), [cx + 184, cy + ch]] as [number, number][], mixCol(pal.tree, "#524632", 0.4));
  });
  const pBaeume = seg(pFuell, 0.66, 0.94);
  baumListe.forEach(([bx, by, bh], i) => {
    const k = smooth((pBaeume - i * 0.055) / 0.25);
    if (k > 0) tanne(c, bx, by, bh * k, i % 2 ? pal.tree : mixCol(pal.tree, "#0c2218", 0.35), pal.schnee);
  });
  const pHuette = seg(pFuell, 0.78, 1);
  if (pHuette > 0) {
    const k = smooth(pHuette);
    const hx = cx + 44, hy = cy + 134;
    c.save(); c.globalAlpha = k;
    rect(c, hx, hy - 18, 30, 18, "#6f492a");
    for (let i = 0; i < 4; i++) rect(c, hx, hy - 16 + i * 4, 30, 1, "#4e311a");
    poly(c, [[hx - 4, hy - 18], [hx + 15, hy - 31], [hx + 34, hy - 18]], pal.schnee ? "#eef5fa" : "#4a3022");
    rect(c, hx + 21, hy - 32, 5, 11, "#6b5d56");
    rect(c, hx + 5, hy - 12, 7, 12, "#3c2616");
    rect(c, hx + 16, hy - 12, 8, 7, t > 260 ? "#ffd470" : "#25313a");
    c.restore();
  }

  /* ---------- Phase 3: Details mit lockerem Pinsel ---------- */
  const pDetails = seg(t, 232, 282);
  if (pDetails > 0) {
    const k = smooth(pDetails);
    c.globalAlpha = k;
    rect(c, cx + 68, cy + 144, 24, 3.5, "#785334");
    rect(c, cx + 74, cy + 147, 2.5, 8, "#4c321d"); rect(c, cx + 88, cy + 147, 2.5, 8, "#4c321d");
    const bx = cx + 104 + Math.sin(t * 0.6) * 2;
    poly(c, [[bx - 10, cy + 145], [bx + 10, cy + 145], [bx + 7, cy + 149], [bx - 7, cy + 149]], "#8f4e32");
    for (let i = 0; i < 4; i++) {
      const u = (t * 0.4 + i * 0.25) % 1;
      disc(c, cx + 67.5 + Math.sin(t + i) * 3 + u * 6, cy + 101 - u * 18, 2 + u * 3, `rgba(240,244,248,${(1 - u) * 0.45 * k})`);
    }
    c.strokeStyle = "#263440"; c.lineWidth = 1.1;
    for (let i = 0; i < 2; i++) {
      const vx = cx + 86 + i * 16 + Math.sin(t * 0.5 + i) * 6;
      const vy = cy + 34 + i * 7 + Math.cos(t * 1.4 + i) * 2;
      const fl = Math.sin(t * 4.5 + i) * 2.4;
      c.beginPath(); c.moveTo(vx - 4, vy + fl); c.quadraticCurveTo(vx - 2, vy - 2, vx, vy); c.quadraticCurveTo(vx + 2, vy - 2, vx + 4, vy + fl); c.stroke();
    }
    c.globalAlpha = 1;
  }
  const pSign = seg(t, 278, 298);
  if (pSign > 0) {
    c.fillStyle = `rgba(204,54,48,${smooth(pSign * 2)})`;
    c.font = '700 7px "Silkscreen", monospace'; c.textAlign = "left";
    c.fillText("L.R.", cx + 6, cy + ch - 7);
  }
  c.restore();

  /* ---------- Der Pinsel: weiche, organische Bahn mit Schwung ---------- */
  if (t < 294) {
    // Bahn aus mehreren weichen Wellen; Geschwindigkeit und Neigung folgen der Bahn.
    const u = clamp(t / 294, 0, 1);
    let px: number, py: number, nx: number, ny: number;
    if (u < 0.34) {
      // Konturphase: Pinsel wandert über die Leinwand und zeichnet
      const k = u / 0.34;
      px = cx + 12 + Math.sin(k * Math.PI * 2.2) * cw * 0.32 + k * cw * 0.55;
      py = cy + 96 - Math.sin(k * Math.PI * 1.7) * 34 - k * 42;
      nx = cx + 12 + Math.sin((k + 0.01) * Math.PI * 2.2) * cw * 0.32 + (k + 0.01) * cw * 0.55;
      ny = cy + 96 - Math.sin((k + 0.01) * Math.PI * 1.7) * 34 - (k + 0.01) * 42;
    } else {
      // Füllphase: breite Schwünge von links nach rechts, leicht abfallend
      const k = (u - 0.34) / 0.66;
      px = cx + cw * (0.1 + 0.8 * k) + Math.sin(k * 9.5) * 14;
      py = cy + 26 + ch * 0.62 * k + Math.cos(k * 7) * 10;
      nx = cx + cw * (0.1 + 0.8 * (k + 0.004)) + Math.sin((k + 0.004) * 9.5) * 14;
      ny = cy + 26 + ch * 0.62 * (k + 0.004) + Math.cos((k + 0.004) * 7) * 10;
    }
    const winkel = Math.atan2(ny - py, nx - px) + 0.35 * Math.sin(t * 2.1);
    c.save();
    c.translate(px, py);
    c.rotate(winkel);
    // leichter Farbfilm am Pinsel
    c.fillStyle = u < 0.34 ? "rgba(58,50,40,.35)" : `${pal.skyB}55`;
    c.beginPath(); c.ellipse(-2, 0, 4.5 + Math.sin(t * 5) * 0.8, 2.2, 0, 0, TAU); c.fill();
    rect(c, 0, -1.6, 5, 3.2, "#c8cfd4");
    rect(c, 5, -2.1, 24, 4.2, "#9a5d32");
    poly(c, [[-5, 0], [0, -2.2], [0, 2.2]], u < 0.34 ? "#3a332a" : pal.mtnB);
    c.restore();
    // ein paar Farbspritzer folgen dem Schwung
    for (let i = 0; i < 3; i++) {
      const q = (t * 0.8 + i * 0.33) % 1;
      disc(c, px - Math.cos(winkel) * (8 + q * 14) + Math.sin(t * 3 + i) * 3, py - Math.sin(winkel) * (8 + q * 14) + Math.cos(t * 2 + i) * 2, 0.8 + q * 0.7, i % 2 ? `${pal.skyA}aa` : `${pal.tree}88`);
    }
  }

  const phase =
    t < 96 ? "Konturen vorzeichnen"
    : t < 244 ? "Farben mit Schwung auftragen"
    : t < 282 ? "Licht, Steg und Boot"
    : "Signatur – Fertig!";
  bauchbinde(c, `MALFREUDE · ${pal.name}`, phase, gross);
}

/* =========================================================================
   2. ZUGFAHRT – 5-Minuten-Führerstandsmitfahrt
   ========================================================================= */
function drawZugfahrt(c: C, t: number, _tag: number, gross: boolean) {
  // 8 abwechslungsreiche Abschnitte über 300 s
  const kurve = Math.sin(t * 0.12) * 32 + Math.sin(t * 0.28) * 14;
  const vx = 160 + kurve;
  const vy = 96;
  const tunnel = smooth(seg(t, 112, 116)) * (1 - smooth(seg(t, 140, 144)));
  const abend = smooth(seg(t, 220, 264));
  const schnee = smooth(seg(t, 143, 152)) * (1 - smooth(seg(t, 188, 198)));
  const bruecke = smooth(seg(t, 72, 76)) * (1 - smooth(seg(t, 110, 114)));
  const speed = t < 12 ? lerp(0.15, 1, t / 12) : t > 282 ? lerp(1, 0, (t - 282) / 18) : 1;
  const dist = t * 5.2 * (t > 282 ? 0.5 : 1);

  // Himmel
  const skyTop = mixCol(mixCol("#4f8ec4", "#28395c", abend), "#0d1218", tunnel);
  const skyBot = mixCol(mixCol("#cfe4f2", "#f29c64", abend), "#151a20", tunnel);
  const sg = c.createLinearGradient(0, 0, 0, vy);
  sg.addColorStop(0, skyTop);
  sg.addColorStop(1, skyBot);
  c.fillStyle = sg;
  c.fillRect(-140, 0, 600, vy + 4);

  if (tunnel < 0.95) {
    c.save();
    c.globalAlpha = 1 - tunnel;
    // Sonne
    disc(c, 240 - kurve * 0.25, 34 + abend * 34, 14, abend > 0.4 ? "#ffba66" : "#fff5cc");
    // Wolken
    for (let i = 0; i < 4; i++) {
      const wx = ((i * 95 + t * 1.4) % 380) - 30;
      wolke(c, wx, 24 + (i % 2) * 16, 0.85, abend > 0.4 ? "#ffd3b2" : "#f7fafc");
    }
    // Berge im Hintergrund
    const bergCol = mixCol(schnee > 0.3 ? "#8ea8c4" : "#5d7d96", "#423752", abend);
    poly(c, [[-140, vy], [40, 48], [115, 72], [190, 38], [265, 68], [340, 46], [460, vy]], bergCol);
    if (schnee > 0.2) {
      c.globalAlpha = (1 - tunnel) * schnee;
      poly(c, [[190, 38], [212, 56], [194, 58], [174, 54]], "#f4f9ff");
      poly(c, [[40, 48], [58, 63], [28, 62]], "#f4f9ff");
    }
    c.restore();
  }

  // Boden / Fluss / Tunnelboden
  const boden = bruecke > 0.5
    ? "#3c7da6"
    : tunnel > 0.5
      ? "#1a1e22"
      : mixCol(schnee > 0.3 ? "#e6eff5" : "#568a4c", "#3a4f38", abend);
  rect(c, -140, vy, 600, 120, boden);

  // Gleisbett + Schwellen + Schienen in echter Perspektive
  poly(c, [[vx - 6, vy], [vx + 6, vy], [265, 208], [55, 208]], tunnel > 0.5 ? "#24282e" : "#5c534a");
  for (let i = 0; i < 18; i++) {
    const u = ((i / 18 + (dist % 1)) % 1);
    const z = u * u;
    const y = lerp(vy + 2, 206, z);
    const cx = lerp(vx, 160, z);
    const hw = lerp(4, 82, z);
    rect(c, cx - hw, y, hw * 2, Math.max(1, z * 4.5), "#3b2f26");
  }
  // Zwei Schienen
  c.strokeStyle = "#cfd8de";
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(vx - 3, vy); c.lineTo(94, 208);
  c.moveTo(vx + 3, vy); c.lineTo(226, 208);
  c.stroke();

  // Vorbeiziehende Landschaftsobjekte (Masten, Bäume, Häuser, Brückenbögen)
  for (let i = 0; i < 10; i++) {
    const u = ((i / 10 + (dist * 0.55 % 1)) % 1);
    const z = u * u;
    const y = lerp(vy + 2, 198, z);
    const sc = lerp(0.12, 1.35, z);
    const lx = lerp(vx - 14, -18, z);
    const rx = lerp(vx + 14, 338, z);
    if (tunnel > 0.5) {
      // Tunnellampen & Bogen
      c.strokeStyle = `rgba(55,62,72,${0.35 + z * 0.4})`;
      c.lineWidth = Math.max(1, sc * 5);
      c.beginPath();
      c.arc(lerp(vx, 160, z), y, lerp(16, 175, z), Math.PI, 0);
      c.stroke();
      if (i % 2 === 0) disc(c, lx + 20 * sc, y - 34 * sc, Math.max(1, 3 * sc), "#ffdc8a");
    } else if (bruecke > 0.5) {
      // Brückenstreben
      c.strokeStyle = "#5b6973";
      c.lineWidth = Math.max(1, sc * 3.5);
      c.beginPath();
      c.moveTo(lx, y); c.lineTo(lx + 10 * sc, y - 55 * sc); c.lineTo(rx - 10 * sc, y - 55 * sc); c.lineTo(rx, y);
      c.stroke();
    } else {
      // Oberleitungsmast
      rect(c, rx - 1, y - 48 * sc, Math.max(1, 2.2 * sc), 48 * sc, "#4d5860");
      rect(c, rx - 16 * sc, y - 44 * sc, 18 * sc, Math.max(1, 1.5 * sc), "#4d5860");
      if (t < 35 || t > 265) {
        // Bahnsteig & Laternen
        rect(c, lx - 24 * sc, y - 10 * sc, 28 * sc, 12 * sc, "#9aa3a8");
        rect(c, lx - 10 * sc, y - 36 * sc, Math.max(1, 2 * sc), 26 * sc, "#39444c");
        disc(c, lx - 9 * sc, y - 36 * sc, Math.max(1, 3.2 * sc), "#ffe49a");
      } else if (t < 74 || (t > 190 && t < 230)) {
        // Häuser
        const hw = 24 * sc, hh = 22 * sc;
        rect(c, lx - hw, y - hh, hw, hh, i % 2 ? "#d9ccb8" : "#c7b29c");
        poly(c, [[lx - hw - 2 * sc, y - hh], [lx - hw / 2, y - hh - 10 * sc], [lx + 2 * sc, y - hh]], "#8a3f34");
        rect(c, lx - hw * 0.65, y - hh * 0.6, hw * 0.3, hh * 0.3, abend > 0.3 || t < 54 ? "#ffd97d" : "#4b697a");
      } else {
        // Tannen links & rechts
        tanne(c, lx - 6 * sc, y, 42 * sc, "#1e4b34", schnee > 0.3);
        tanne(c, rx + 12 * sc, y, 36 * sc, "#23543b", schnee > 0.3);
      }
    }
  }

  // Schneeflocken im Gebirgsabschnitt
  if (schnee > 0.25 && tunnel < 0.2) {
    c.fillStyle = `rgba(255,255,255,${schnee * 0.8})`;
    for (let i = 0; i < 24; i++) {
      const sx = ((hash(i + 1) * 320 + Math.sin(t + i) * 18) % 320 + 320) % 320;
      const sy = ((hash(i + 40) * 180 + t * 28) % 180);
      disc(c, sx, sy, 1.3, "#ffffff");
    }
  }

  // Tunnel-Scheinwerferkegel
  if (tunnel > 0.2) {
    const cg = c.createRadialGradient(vx, vy + 18, 2, 160, 170, 120);
    cg.addColorStop(0, `rgba(255,244,200,${0.32 * tunnel})`);
    cg.addColorStop(1, "rgba(255,244,200,0)");
    c.fillStyle = cg;
    c.fillRect(0, vy - 10, 320, 120);
  }

  // Führerstand-Rahmen (unten schmal, damit freie Sicht bleibt)
  rect(c, -140, 184, 600, 24, "#1a2228");
  rect(c, 0, 184, 320, 3, "#364550");
  // Kleiner Tacho rechts im Pult
  if (gross) {
    const kmh = Math.round(speed * (tunnel > 0.5 ? 110 : bruecke > 0.5 ? 85 : 98) + Math.sin(t * 0.4) * 3);
    rrect(c, 256, 189, 54, 15, 3, "#0d1419");
    c.fillStyle = "#5fe3b2";
    c.font = '700 8px "Silkscreen", monospace';
    c.textAlign = "right";
    c.fillText(`${Math.max(0, kmh)} KM/H`, 305, 199);
    const ort =
      t < 34 ? "ABFAHRT BAHNHOF"
      : t < 74 ? "VORSTADT"
      : t < 114 ? "FLUSSBRÜCKE"
      : t < 144 ? "BERGTUNNEL"
      : t < 190 ? "SCHNEELAND"
      : t < 230 ? "BERGDORF"
      : t < 266 ? "VIADUKT ABENDLICHT"
      : "EINFAHRT ZIEL";
    c.fillStyle = "#ffd98a";
    c.textAlign = "left";
    c.fillText(`ZUG · ${ort}`, 10, 199);
  }
}

/* =========================================================================
   3. TIEFSEE – 5-Minuten-Tauchfahrt im gelben U-Boot
   ========================================================================= */
function drawTiefsee(c: C, t: number, _tag: number, gross: boolean) {
  // Tiefe: 0m -> 3200m (bei t=226s) -> 0m (bei t=300s)
  const tiefNorm = t < 226 ? smooth(t / 226) : 1 - smooth((t - 226) / 74);
  const meter = Math.round(tiefNorm * 3200);

  // Wassergradient verdunkelt sich echt mit der Tiefe
  const wTop = mixCol(mixCol("#2cb5c7", "#113868", clamp(tiefNorm * 1.5)), "#040a18", clamp((tiefNorm - 0.5) * 2));
  const wBot = mixCol(mixCol("#156d8c", "#081c3a", clamp(tiefNorm * 1.5)), "#02050c", clamp((tiefNorm - 0.5) * 2));
  const wg = c.createLinearGradient(0, 0, 0, 208);
  wg.addColorStop(0, wTop);
  wg.addColorStop(1, wBot);
  c.fillStyle = wg;
  c.fillRect(-140, 0, 600, 208);

  // Sonnenstrahlen in der oberen Zone
  if (tiefNorm < 0.35) {
    c.save();
    c.globalAlpha = (1 - tiefNorm / 0.35) * 0.22;
    for (let i = 0; i < 5; i++) {
      const rx = 20 + i * 68 + Math.sin(t * 0.6 + i) * 10;
      poly(c, [[rx, 0], [rx + 22, 0], [rx + 56, 208], [rx + 18, 208]], "#b8f5ff");
    }
    c.restore();
  }

  // Korallenriff (30..96 s)
  if (t > 30 && t < 96) {
    const k = Math.sin(seg(t, 30, 96) * Math.PI);
    const ry = 208 - k * 42;
    poly(c, [[0, 208], [50, ry + 10], [130, ry - 4], [220, ry + 12], [320, ry - 2], [320, 208]], "#1d4b5e");
    for (let i = 0; i < 6; i++) {
      const cx = 24 + i * 54;
      oval(c, cx, ry + 12, 12, 16, i % 2 ? "#e86a68" : "#e39b4f");
      oval(c, cx + 8, ry + 16, 8, 12, i % 2 ? "#f29a86" : "#88c98a");
    }
  }

  // Schiffswrack (132..188 s)
  if (t > 132 && t < 188) {
    const p = seg(t, 132, 188);
    const wx = lerp(350, -90, p);
    const wy = 160;
    poly(c, [[wx, wy], [wx + 110, wy - 10], [wx + 95, wy + 28], [wx + 14, wy + 28]], "#1c2836");
    rect(c, wx + 46, wy - 64, 5, 58, "#1c2836");
    rect(c, wx + 28, wy - 44, 42, 3.5, "#1c2836");
    disc(c, wx + 78, wy + 12, 4, "#ffd970"); // kleiner Schatzglanz
  }

  // Fische (oben) oder Leuchtquallen (Tiefsee)
  if (tiefNorm < 0.5) {
    for (let i = 0; i < 9; i++) {
      const fx = ((360 - ((t * (14 + (i % 3) * 5) + i * 54) % 400)) + 400) % 400 - 40;
      const fy = 36 + (i * 23) % 130 + Math.sin(t * 2 + i) * 5;
      const col = i % 3 === 0 ? "#ff944d" : i % 3 === 1 ? "#ffd65c" : "#80e8de";
      oval(c, fx, fy, 6.5, 3.4, col);
      poly(c, [[fx + 5, fy], [fx + 10, fy - 3.5], [fx + 10, fy + 3.5]], col);
      disc(c, fx - 3, fy - 0.6, 0.9, "#111");
    }
  } else {
    // Biolumineszierende Tiefsee-Quallen
    for (let i = 0; i < 7; i++) {
      const qx = ((i * 58 + Math.sin(t * 0.5 + i) * 24) % 300) + 10;
      const qy = ((240 - ((t * 9 + i * 47) % 260)) + 260) % 260 - 20;
      const pulse = 0.7 + 0.3 * Math.sin(t * 2.5 + i);
      const col = i % 2 ? `rgba(80,235,255,${0.7 * pulse})` : `rgba(225,105,255,${0.7 * pulse})`;
      c.fillStyle = col;
      c.beginPath();
      c.arc(qx, qy, 8 + pulse * 1.5, Math.PI, 0);
      c.fill();
      c.strokeStyle = col;
      c.lineWidth = 1;
      for (let k = -2; k <= 2; k++) {
        c.beginPath();
        c.moveTo(qx + k * 2.5, qy);
        c.quadraticCurveTo(qx + k * 3 + Math.sin(t * 3 + i + k) * 3, qy + 8, qx + k * 2.2, qy + 16);
        c.stroke();
      }
    }
  }

  // Gelbes Forschungs-U-Boot
  const ux = 112 + Math.sin(t * 0.45) * 18;
  const uy = 96 + Math.sin(t * 0.9) * 8;
  // Scheinwerferkegel (ab Dämmerzone an)
  if (tiefNorm > 0.28) {
    const cg = c.createLinearGradient(ux + 28, uy, ux + 175, uy);
    cg.addColorStop(0, `rgba(255,248,195,${Math.min(0.45, (tiefNorm - 0.25) * 0.85)})`);
    cg.addColorStop(1, "rgba(255,248,195,0)");
    c.fillStyle = cg;
    c.beginPath();
    c.moveTo(ux + 28, uy - 4); c.lineTo(ux + 175, uy - 44); c.lineTo(ux + 175, uy + 44); c.lineTo(ux + 28, uy + 6);
    c.closePath(); c.fill();
  }
  // U-Boot-Körper
  rrect(c, ux - 10, uy - 22, 16, 12, 4, "#e6b82e");
  rect(c, ux - 2, uy - 28, 3, 7, "#c99a1c");
  oval(c, ux, uy, 28, 14, "#f4c83b");
  oval(c, ux, uy + 4, 24, 6, "#d19b1e");
  // Bullaugen
  for (const dx of [-10, 4, 16]) {
    disc(c, ux + dx, uy - 1, 4.5, "#6b5520");
    disc(c, ux + dx, uy - 1, 3.2, "#a9ecff");
  }
  // Propeller & Luftblasen
  rect(c, ux - 32, uy - 1.5, 5, 3, "#6e7880");
  const propH = 3 + Math.abs(Math.sin(t * 18)) * 6;
  rect(c, ux - 34, uy - propH, 2.5, propH * 2, "#cfd8de");
  for (let i = 0; i < 6; i++) {
    const u = (t * 0.8 + i * 0.17) % 1;
    disc(c, ux - 34 - u * 26, uy - u * 30 + Math.sin(t * 4 + i) * 3, 1.2 + u * 1.8, `rgba(215,246,255,${(1 - u) * 0.7})`);
  }

  // Tiefenmesser oben rechts
  if (gross) {
    rrect(c, 232, 8, 78, 18, 4, "rgba(4,14,24,.75)");
    c.fillStyle = "#7fe8ff";
    c.font = '700 8px "Silkscreen", monospace';
    c.textAlign = "right";
    c.fillText(`${meter} M`, 304, 20);
  }
  const zone =
    t < 38 ? "Sonnenzone · Fischschwärme"
    : t < 96 ? "Korallenriff"
    : t < 134 ? "Dämmerzone · Scheinwerfer an"
    : t < 188 ? "Altes Schiffswrack"
    : t < 246 ? "Tiefsee · Leuchtquallen"
    : "Aufstieg zur Oberfläche";
  bauchbinde(c, "TIEFSEE-EXPEDITION", zone, gross);
}

/* =========================================================================
   4. DOMINO – Domino- & Kugelbahn-Rekord über 5 Minuten
   ========================================================================= */
function drawDomino(c: C, t: number, _tag: number, gross: boolean) {
  // Hallenboden
  rect(c, -140, 0, 600, 208, "#282c34");
  rect(c, -140, 74, 600, 134, "#dfd7c5");
  // Fliesenlinien
  c.strokeStyle = "rgba(120,108,90,.22)";
  c.lineWidth = 1;
  for (let x = 0; x <= 320; x += 32) { c.beginPath(); c.moveTo(x, 74); c.lineTo(x, 208); c.stroke(); }

  const steinZahl = Math.min(10000, Math.floor(seg(t, 8, 272) * 10000));
  const cols = ["#e85d50", "#f2a93b", "#f4de58", "#5ec472", "#4aa6e8", "#9b6be8"];

  if (t < 46) {
    // Abschnitt 1 & 2: Letzter Stein + zügige Regenbogen-Welle
    const n = 22;
    const fallFront = t < 7 ? -1 : seg(t, 7, 45) * (n + 4);
    for (let i = 0; i < n; i++) {
      const x = 22 + i * 13;
      const y = 148 + Math.sin(i * 0.45) * 18;
      const ang = clamp((fallFront - i) * 0.45, 0, 1.32);
      c.save();
      c.translate(x, y);
      c.rotate(ang);
      rrect(c, -3, -24, 6, 24, 1.5, cols[i % cols.length]);
      rect(c, -2, -13, 4, 1.2, "rgba(255,255,255,.55)");
      c.restore();
    }
    if (t < 9) {
      // Vorsichtige Hand setzt den ersten Stein an
      const hx = 12 + smooth(seg(t, 4, 8)) * 12;
      rrect(c, hx - 12, 118, 16, 9, 4, "#f4f6f8");
    }
  } else if (t < 112) {
    // Abschnitt 3 & 4: Holz-Kugelbahn + Pendel (schnelle Durchläufe)
    const p = (t - 46) / 66;
    const ebenen = 4;
    for (let e = 0; e < ebenen; e++) {
      const y = 52 + e * 34;
      const dir = e % 2 === 0 ? 1 : -1;
      c.strokeStyle = "#8a5c32";
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(dir > 0 ? 28 : 292, y);
      c.lineTo(dir > 0 ? 284 : 36, y + 16);
      c.stroke();
    }
    // Rollende Stahlkugel – deutlich flotter als vorher
    const eIdx = Math.min(ebenen - 1, Math.floor((p * 5) % ebenen));
    const u = (p * 5) % 1;
    const dir = eIdx % 2 === 0 ? 1 : -1;
    const kx = dir > 0 ? lerp(32, 280, u) : lerp(288, 40, u);
    const ky = 52 + eIdx * 34 + u * 16 - 7;
    disc(c, kx, ky, 6, "#a4b8c8");
    disc(c, kx - 2, ky - 2, 2, "#ffffff");
    // Pendel rechts oben
    const pang = Math.sin(t * 2.2) * 0.55;
    c.strokeStyle = "#4d5560";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(270, 12);
    c.lineTo(270 + Math.sin(pang) * 34, 12 + Math.cos(pang) * 34);
    c.stroke();
    disc(c, 270 + Math.sin(pang) * 34, 12 + Math.cos(pang) * 34, 6.5, "#e8b94f");
  } else if (t < 226) {
    // Abschnitt 5 & 6: Großes Mosaik-Bildfeld (Stern kippt zügig in Wellen)
    const p = seg(t, 112, 224);
    const colsN = 14, rowsN = 8;
    const ox = 46, oy = 46;
    for (let r = 0; r < rowsN; r++) {
      for (let q = 0; q < colsN; q++) {
        const idx = r * colsN + q;
        const gefallen = p * (colsN * rowsN) > idx;
        const dx = q - (colsN - 1) / 2, dy = r - (rowsN - 1) / 2;
        const imStern = Math.abs(dx) + Math.abs(dy) < 3.6 || (Math.abs(dx) < 1.3 && Math.abs(dy) < 3.6);
        const col = imStern ? "#ffd447" : "#3a7ec4";
        const px = ox + q * 16.5;
        const py = oy + r * 14.5;
        if (gefallen) rrect(c, px, py + 3, 12, 8, 1.5, col);
        else rrect(c, px + 2, py, 7, 11, 1.5, mixCol(col, "#ffffff", 0.25));
      }
    }
  } else {
    // Großes Finale: Konfetti & Rekordbanner
    const p = seg(t, 226, 300);
    for (let i = 0; i < 42; i++) {
      const cx = (hash(i + 5) * 300 + 10);
      const cy = ((hash(i + 99) * 180 + t * 42) % 190);
      rect(c, cx, cy, 4, 4, cols[i % cols.length]);
    }
    rrect(c, 58, 66, 204, 52, 8, "rgba(18,28,38,.92)");
    c.fillStyle = "#ffd966";
    c.font = '700 14px "Silkscreen", monospace';
    c.textAlign = "center";
    c.fillText("10.000 REKORD!", 160, 96);
    c.fillStyle = "#eef7f2";
    c.font = '600 9px "Space Grotesk", sans-serif';
    c.fillText(p > 0.5 ? "Alle Steine gefallen!" : "Finale läuft!", 160, 111);
  }

  if (gross) {
    rrect(c, 224, 8, 86, 18, 4, "rgba(10,16,22,.82)");
    c.fillStyle = "#ffcf5c";
    c.font = '700 8px "Silkscreen", monospace';
    c.textAlign = "right";
    c.fillText(`${steinZahl} STEINE`, 304, 20);
  }
  const sz =
    t < 18 ? "Aufbau · Der erste Stein"
    : t < 46 ? "Regenbogen-Kaskade"
    : t < 112 ? "Kugelbahn & Pendel"
    : t < 226 ? "Großes Sternen-Bildfeld"
    : "Rekord-Finale!";
  bauchbinde(c, "DOMINO-DAY", sz, gross);
}

/* =========================================================================
   5. NATUR-DOKU – „Ein Tag im Wald“ (Morgennebel bis Eule in 5 Minuten)
   ========================================================================= */
function drawWald(c: C, t: number, _tag: number, gross: boolean) {
  const tagP = t / SENDUNG_DAUER; // 0..1
  const regen = smooth(seg(t, 186, 196)) * (1 - smooth(seg(t, 224, 234)));
  const nacht = smooth(seg(t, 260, 294));
  const frueh = 1 - smooth(seg(t, 0, 50));

  // Himmel über den gesamten Tag
  const sTop = mixCol(mixCol(mixCol("#62a8db", "#7a8da0", regen), "#e09482", frueh * 0.6), "#121f3a", nacht);
  const sBot = mixCol(mixCol(mixCol("#dceff5", "#a8b6c2", regen), "#f7d4a8", frueh * 0.7), "#26395c", nacht);
  const sg = c.createLinearGradient(0, 0, 0, 118);
  sg.addColorStop(0, sTop); sg.addColorStop(1, sBot);
  c.fillStyle = sg;
  c.fillRect(-140, 0, 600, 122);

  // Sonne oder Mond + Sterne
  if (nacht > 0.3) {
    c.globalAlpha = nacht;
    for (let i = 0; i < 18; i++) disc(c, hash(i + 7) * 310 + 5, hash(i + 77) * 80 + 6, 1, "#fff8dc");
    disc(c, 255, 34, 11, "#f7efc6");
    c.globalAlpha = 1;
  } else {
    const sx = lerp(38, 282, tagP * 1.15);
    const sy = 96 - Math.sin(clamp(tagP * 1.15) * Math.PI) * 68;
    disc(c, sx, sy, 12, "#fff0a8");
  }

  // Regenbogen nach dem Schauer (228..266 s)
  const bogen = smooth(seg(t, 228, 238)) * (1 - smooth(seg(t, 258, 268)));
  if (bogen > 0.02) {
    c.save();
    c.globalAlpha = bogen * 0.6;
    const rc = ["#e85950", "#f2a43c", "#f4df56", "#64c46e", "#52a2e8", "#9464d8"];
    rc.forEach((col, i) => {
      c.strokeStyle = col; c.lineWidth = 3;
      c.beginPath(); c.arc(165, 134, 96 - i * 3.2, Math.PI, 0); c.stroke();
    });
    c.restore();
  }

  // Waldkulisse & Lichtung & Bach
  const wiese = mixCol(mixCol("#4f8a48", "#3d6b44", regen * 0.5), "#1b3328", nacht);
  rect(c, -140, 112, 600, 96, wiese);
  // Waldbach
  poly(c, [[105, 112], [148, 112], [230, 208], [135, 208]], mixCol("#4a96b8", "#18334a", nacht));

  // Bäume am Rand
  const tCol = mixCol("#235434", "#10241a", nacht);
  for (const [tx, ty, th] of [[24, 128, 66], [56, 122, 54], [262, 124, 62], [296, 132, 74]] as const) {
    tanne(c, tx, ty, th, tCol);
  }
  // Morgennebel
  if (frueh > 0.05) {
    rect(c, 0, 106, 320, 32, `rgba(245,248,250,${frueh * 0.42})`);
  }

  // Tiere je nach Tageszeit:
  // 1) Fuchs (42..98 s)
  if (t > 42 && t < 98) {
    const p = seg(t, 42, 98);
    const fx = lerp(24, 130, Math.min(1, p * 2.2)) - Math.max(0, p - 0.7) * 140;
    const fy = 152 + Math.sin(t * 4) * (p < 0.45 ? 1.5 : 0);
    oval(c, fx, fy, 11, 5.5, "#d96a2b");
    oval(c, fx - 12, fy - 1, 7, 3.2, "#d96a2b");
    disc(c, fx - 18, fy - 1, 2.5, "#f7f3eb");
    disc(c, fx + 10, fy - 4, 4.5, "#d96a2b");
    poly(c, [[fx + 8, fy - 7], [fx + 10, fy - 13], [fx + 12, fy - 7]], "#241d1a");
    disc(c, fx + 12, fy - 4.5, 1, "#111");
  }

  // 2) Specht am Baumstamm (94..144 s)
  if (t > 94 && t < 144) {
    rect(c, 224, 46, 22, 126, "#5a3d28");
    const klopf = Math.sin(t * 22) > 0.3 ? 3 : 0;
    oval(c, 220 + klopf, 96, 6, 9, "#22262c");
    disc(c, 220 + klopf, 87, 4.2, "#f4f4f0");
    disc(c, 219 + klopf, 84, 2.5, "#d93c34");
    poly(c, [[223 + klopf, 87], [229 + klopf, 88], [223 + klopf, 90]], "#333");
  }

  // 3) Entenfamilie am Bach (140..190 s)
  if (t > 140 && t < 190) {
    const p = seg(t, 140, 190);
    const ex = lerp(128, 200, p);
    const ey = lerp(122, 168, p);
    // Entenmama + 3 Küken
    oval(c, ex, ey, 7, 4, "#f4f2ea");
    disc(c, ex + 6, ey - 3, 3.2, "#357a4c");
    rect(c, ex + 8.5, ey - 3.5, 3, 1.5, "#f0a42e");
    for (let i = 1; i <= 3; i++) {
      oval(c, ex - i * 10, ey - i * 4.5, 3.2, 2.2, "#ffd94a");
      disc(c, ex - i * 10 + 2.5, ey - i * 4.5 - 1.5, 1.6, "#ffd94a");
    }
  }

  // 4) Regen
  if (regen > 0.05) {
    c.strokeStyle = `rgba(215,236,248,${regen * 0.7})`;
    c.lineWidth = 1;
    for (let i = 0; i < 36; i++) {
      const rx = ((hash(i + 11) * 340 - t * 35) % 340 + 340) % 340;
      const ry = ((hash(i + 51) * 208 + t * 140) % 208);
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 4, ry + 11); c.stroke();
    }
  }

  // 5) Eule & Glühwürmchen in der Dämmerung (260..300 s)
  if (t > 260) {
    const k = smooth(seg(t, 260, 272));
    c.globalAlpha = k;
    rect(c, 224, 92, 68, 5, "#422d1e");
    oval(c, 248, 82, 9, 11, "#7b624b");
    disc(c, 244.5, 77, 3, "#ffe46e");
    disc(c, 251.5, 77, 3, "#ffe46e");
    const blink = Math.sin(t * 1.4) > 0.92;
    if (!blink) { disc(c, 244.5, 77, 1.4, "#111"); disc(c, 251.5, 77, 1.4, "#111"); }
    // Glühwürmchen
    for (let i = 0; i < 10; i++) {
      const gx = 30 + hash(i + 3) * 220 + Math.sin(t * 1.1 + i) * 14;
      const gy = 120 + hash(i + 9) * 52 + Math.cos(t * 1.3 + i) * 8;
      disc(c, gx, gy, 1.4 + Math.sin(t * 5 + i) * 0.6, "#e8ff78");
    }
    c.globalAlpha = 1;
  }

  const kap =
    t < 46 ? "Morgennebel über der Lichtung"
    : t < 96 ? "Ein Fuchs auf der Pirsch"
    : t < 142 ? "Der Buntspecht klopft"
    : t < 188 ? "Entenfamilie am Waldbach"
    : t < 230 ? "Kurzer Sommerschauer"
    : t < 264 ? "Regenbogen am Nachmittag"
    : "Dämmerung · Die Eule wacht auf";
  bauchbinde(c, "NATUR-DOKU · EIN TAG IM WALD", kap, gross);
}

/* =========================================================================
   6. NACHTZUG-KRIMI – Stummfilm in 5 Akten (Täter wechselt je Tag!)
   ========================================================================= */
const KRIMI_TAETER = [
  { name: "DER GRAF", merkmal: "MONOKEL", hut: "zylinder" },
  { name: "DIE DIVA", merkmal: "FEDER", hut: "feder" },
  { name: "DER SCHAFFNER", merkmal: "PFEIFE", hut: "muetze" },
] as const;

function drawKrimi(c: C, t: number, tag: number, gross: boolean) {
  const taeter = KRIMI_TAETER[Math.abs(tag) % KRIMI_TAETER.length];
  // Sepia-Stummfilm-Grundton
  rect(c, -140, 0, 600, 208, "#241f18");

  // Zwischen-Titelkarten zu Beginn jedes Akts (knackige 5 Sekunden)
  const akt = t < 54 ? 1 : t < 114 ? 2 : t < 180 ? 3 : t < 250 ? 4 : 5;
  const aktStart = [0, 0, 54, 114, 180, 250][akt];
  const inTitel = t - aktStart < 5 && gross;

  if (inTitel) {
    rrect(c, 22, 24, 276, 152, 6, "#17140f");
    c.strokeStyle = "#d9cba8"; c.lineWidth = 2; c.strokeRect(30, 32, 260, 136);
    c.strokeStyle = "#8a7d62"; c.lineWidth = 0.8; c.strokeRect(35, 37, 250, 126);
    const titel = ["", "AKT I · DER RUBIN", "AKT II · DIE SPUR", "AKT III · VERDÄCHTIGE", "AKT IV · DAS ZUGDACH", "AKT V · ENTLARVT!"][akt];
    const sub = ["", "Im Nachtexpress erlischt das Licht…", `Ein Indiz am Boden: ${taeter.merkmal}!`, "Drei Gäste im Speisewagen…", "Flucht durch die Mondnacht!", `Der Täter war: ${taeter.name}!`][akt];
    c.fillStyle = "#efe4c8"; c.font = '700 12px "Silkscreen", monospace'; c.textAlign = "center";
    c.fillText(titel, 160, 88);
    c.fillStyle = "#c9ba98"; c.font = '600 10px "Space Grotesk", sans-serif';
    c.fillText(sub, 160, 112);
  } else if (akt === 1) {
    // Salonwagen mit leuchtendem Rubin – Licht flackert aus, Rubin verschwindet!
    const stromAus = t > 28 && t < 38;
    rect(c, 18, 22, 284, 148, stromAus ? "#12100c" : "#3a3226");
    for (const wx of [44, 128, 212]) rect(c, wx, 40, 58, 42, "#191c24");
    // Vitrine in der Mitte
    rect(c, 142, 108, 36, 56, "#5c4d3b");
    rrect(c, 144, 82, 32, 28, 2, "rgba(235,228,208,.22)");
    if (t < 33) {
      poly(c, [[160, 90], [168, 98], [160, 106], [152, 98]], "#e0584e");
    } else if (t >= 38) {
      c.fillStyle = "#f0dfb6"; c.font = '700 14px "Silkscreen", monospace'; c.textAlign = "center";
      c.fillText("WEG!", 160, 100);
    }
  } else if (akt === 2) {
    // Detektiv mit Lupe untersucht Spur auf dem Teppich
    rect(c, 18, 22, 284, 148, "#352e24");
    rect(c, 18, 134, 284, 36, "#4d4233");
    const lx = 148 + Math.sin(t * 1.4) * 28;
    // Detektiv-Silhouette links
    disc(c, lx - 36, 78, 12, "#181510");
    poly(c, [[lx - 52, 72], [lx - 20, 72], [lx - 26, 63], [lx - 46, 63]], "#181510");
    rrect(c, lx - 48, 90, 26, 56, 6, "#181510");
    // Große Lupe über der Spur
    c.strokeStyle = "#d9c9a2"; c.lineWidth = 3;
    c.beginPath(); c.arc(lx + 18, 126, 18, 0, TAU); c.stroke();
    disc(c, lx + 18, 126, 16, "rgba(240,230,198,.25)");
    // Fundstück je nach heutigem Täter
    if (taeter.merkmal === "MONOKEL") { c.strokeStyle = "#f2e2b4"; c.lineWidth = 2; c.beginPath(); c.arc(lx + 18, 126, 7, 0, TAU); c.stroke(); }
    else if (taeter.merkmal === "FEDER") { oval(c, lx + 18, 126, 10, 3.5, "#efe6cc"); }
    else { rrect(c, lx + 10, 122, 16, 7, 3, "#d8cbb0"); }
  } else if (akt === 3) {
    // Drei Verdächtige in Porträtrahmen (wechseln alle 10 s statt 30 s)
    const fokus = Math.floor((t - 114) / 10) % 3;
    KRIMI_TAETER.forEach((v, i) => {
      const px = 40 + i * 86;
      rrect(c, px, 38, 72, 108, 4, i === fokus ? "#524634" : "#2f281f");
      disc(c, px + 36, 78, 14, "#dfd4b8");
      rrect(c, px + 18, 94, 36, 44, 8, "#1e1a14");
      if (v.hut === "zylinder") { rect(c, px + 24, 50, 24, 16, "#17140f"); rect(c, px + 20, 64, 32, 3, "#17140f"); }
      else if (v.hut === "feder") { oval(c, px + 36, 64, 18, 5, "#17140f"); oval(c, px + 48, 55, 8, 3, "#efe6cc"); }
      else { rrect(c, px + 22, 58, 28, 9, 3, "#17140f"); rect(c, px + 22, 65, 28, 3, "#c4b48e"); }
      disc(c, px + 31, 77, 1.8, "#111"); disc(c, px + 41, 77, 1.8, "#111");
      if (gross) {
        c.fillStyle = i === fokus ? "#ffe29a" : "#b8ab8e";
        c.font = '700 7px "Silkscreen", monospace'; c.textAlign = "center";
        c.fillText(v.name.replace("DER ", "").replace("DIE ", ""), px + 36, 158);
      }
    });
  } else if (akt === 4) {
    // Verfolgungsjagd übers Zugdach unter riesigem Vollmond
    disc(c, 242, 48, 28, "#ece2c4");
    const wack = Math.sin(t * 6) * 2;
    for (let i = 0; i < 3; i++) {
      const wx = ((i * 124 - (t * 72 % 124)) + 372) % 372 - 60;
      rrect(c, wx, 132 + wack, 114, 54, 4, "#15120e");
      for (let k = 0; k < 4; k++) rect(c, wx + 12 + k * 24, 146 + wack, 14, 14, "#d9c28a");
    }
    // Flüchtender & Detektiv springen
    const jump = Math.abs(Math.sin(t * 4.5)) * 18;
    disc(c, 210, 106 - jump, 7, "#0e0c09");
    rrect(c, 204, 113 - jump, 12, 18, 3, "#0e0c09");
    const jump2 = Math.abs(Math.sin(t * 4.5 - 0.8)) * 16;
    disc(c, 122, 106 - jump2, 7, "#0e0c09");
    rrect(c, 116, 113 - jump2, 12, 18, 3, "#0e0c09");
  } else {
    // Akt 5: Entlarvung & glänzender Rubin zurück
    rect(c, 18, 22, 284, 148, "#3e3529");
    disc(c, 160, 78, 22, "#ebe0c4");
    poly(c, [[160, 62], [174, 78], [160, 94], [146, 78]], "#e0584e");
    if (gross) {
      c.fillStyle = "#f2e5c2"; c.font = '700 10px "Silkscreen", monospace'; c.textAlign = "center";
      c.fillText(`ÜBERFÜHRT: ${taeter.name}`, 160, 124);
      c.fillStyle = "#c8ba98"; c.font = '600 9px "Space Grotesk", sans-serif';
      c.fillText("Der Rubin ist wieder sicher! · ENDE", 160, 142);
    }
  }

  // Zarte Stummfilm-Kratzer
  c.strokeStyle = "rgba(255,245,220,.08)";
  c.lineWidth = 1;
  const kx = (hash(Math.floor(t * 12)) * 320);
  c.beginPath(); c.moveTo(kx, 0); c.lineTo(kx, 208); c.stroke();
  bauchbinde(c, `NACHTZUG-KRIMI · AKT ${akt}`, inTitel ? "Zwischentitel" : "Stummfilm in 5 Akten", gross);
}

/* =========================================================================
   7. WELTRAUM-REISE – Forschungsschiff über 5 Minuten
   ========================================================================= */
function drawExpedition(c: C, t: number, _tag: number, gross: boolean) {
  rect(c, -140, 0, 600, 208, "#070c1b");
  // Sterne ziehen vorbei
  for (let i = 0; i < 40; i++) {
    const sx = (((hash(i + 1) * 320 - t * (10 + (i % 3) * 8)) % 320) + 320) % 320;
    const sy = hash(i + 45) * 180;
    disc(c, sx, sy, i % 5 === 0 ? 1.5 : 0.9, i % 4 === 0 ? "#b8e6ff" : "#fff8e8");
  }

  const schiff = (x: number, y: number, ang = 0, schub = 1) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    if (schub > 0.1) {
      poly(c, [[-18, -5], [-18, 5], [-28 - Math.sin(t * 25) * 6, 0]], "#4ee6ff");
    }
    poly(c, [[-16, -9], [16, -4], [24, 0], [16, 4], [-16, 9]], "#e8eef2");
    poly(c, [[-14, -9], [-6, -16], [2, -8]], "#35b8a8");
    poly(c, [[-14, 9], [-6, 16], [2, 8]], "#35b8a8");
    oval(c, 8, 0, 6, 3.2, "#7fe8ff");
    c.restore();
  };

  if (t < 44) {
    // Abdocken von der Raumstation
    const p = seg(t, 0, 44);
    const rx = lerp(90, -70, p);
    c.strokeStyle = "#90a4b8"; c.lineWidth = 6;
    c.beginPath(); c.arc(rx, 92, 42, 0, TAU); c.stroke();
    rect(c, rx - 42, 90, 84, 4, "#b8cad8");
    schiff(lerp(130, 220, p), 92 + Math.sin(t) * 4, 0, 1);
  } else if (t < 98) {
    // Asteroidenfeld
    const sy = 94 + Math.sin(t * 1.1) * 44;
    for (let i = 0; i < 9; i++) {
      const ax = (((360 - ((t * (28 + (i % 3) * 10) + i * 52) % 380)) + 380) % 380) - 30;
      const ay = 26 + ((i * 39) % 136);
      const r = 8 + (i % 3) * 4;
      disc(c, ax, ay, r, "#6b6670");
      disc(c, ax - r * 0.3, ay - r * 0.2, r * 0.3, "#4e4a54");
    }
    schiff(94, sy, Math.cos(t * 1.1) * 0.22, 1);
  } else if (t < 144) {
    // Anflug auf lila Ringplanet & Landung
    const p = seg(t, 98, 144);
    const pr = lerp(22, 130, p);
    disc(c, 220, 118 + p * 60, pr, "#6d488f");
    c.strokeStyle = "rgba(235,205,150,.55)"; c.lineWidth = 4;
    c.beginPath(); c.ellipse(220, 118 + p * 60, pr * 1.45, pr * 0.3, -0.25, 0, TAU); c.stroke();
    schiff(lerp(80, 175, p), lerp(68, 128, p), 0.35 * (1 - p), 1 - p * 0.6);
  } else if (t < 252) {
    // Fremde Welt: lila Dünen, Kristallpilze, Astronaut & freundliche Leuchtwesen
    poly(c, [[0, 134], [90, 120], [210, 138], [320, 124], [320, 208], [0, 208]], "#4a3266");
    // Gelandetes Schiff links
    schiff(64, 126, -Math.PI / 2, 0);
    // Kristalle rechts
    const gesammelt = t > 216;
    if (!gesammelt) {
      poly(c, [[236, 136], [244, 108], [252, 136]], "#56f2d8");
      poly(c, [[248, 138], [258, 118], [264, 138]], "#8affea");
    }
    // Astronaut läuft zu den Kristallen und zurück
    const ax = t < 204 ? lerp(98, 210, seg(t, 144, 188)) : lerp(210, 92, seg(t, 216, 248));
    const ay = 136;
    rrect(c, ax - 5, ay - 16, 10, 13, 3, "#eef4f7");
    disc(c, ax, ay - 21, 5.5, "#eef4f7");
    oval(c, ax + 1.5, ay - 21, 3.2, 2.5, "#5ce0ff");
    if (gesammelt) disc(c, ax + 7, ay - 12, 3, "#56f2d8");
    // Drei freundliche Leuchtwesen
    for (let i = 0; i < 3; i++) {
      const wx = 170 + i * 28 + Math.sin(t * 1.5 + i * 2) * 14;
      const wy = 92 + Math.cos(t * 2 + i) * 12;
      disc(c, wx, wy, 7, "rgba(120,240,255,.25)");
      disc(c, wx, wy, 4, "#9ef6ff");
      disc(c, wx - 1.3, wy - 0.5, 0.8, "#102"); disc(c, wx + 1.3, wy - 0.5, 0.8, "#102");
    }
  } else {
    // Rückflug durch bunten Nebel zur blauen Erde
    const p = seg(t, 252, 300);
    oval(c, 120, 86, 95, 44, "rgba(150,70,190,.28)");
    oval(c, 210, 112, 85, 36, "rgba(50,190,180,.24)");
    disc(c, 258, 86, lerp(12, 38, p), "#3e92d9");
    oval(c, 250, 80, lerp(4, 12, p), lerp(3, 8, p), "#5ec27a");
    schiff(lerp(52, 210, p), 92 + Math.sin(t) * 6, 0, 1);
  }

  const kap =
    t < 44 ? "Start von der Orbitalstation"
    : t < 98 ? "Kurs durchs Asteroidenfeld"
    : t < 144 ? "Landung auf Planet Lila"
    : t < 204 ? "Begegnung mit Leuchtwesen"
    : t < 252 ? "Kristall-Probe geborgen"
    : "Heimflug zur Erde";
  bauchbinde(c, "WELTRAUM-EXPEDITION", kap, gross);
}

/* =========================================================================
   8. PUPPENTHEATER – Märchenbühne „Drache & kleiner Frosch“
   ========================================================================= */
function drawTheater(c: C, t: number, _tag: number, gross: boolean) {
  const szene = t < 42 ? 0 : t < 102 ? 1 : t < 168 ? 2 : t < 236 ? 3 : 4;
  // Pappkulisse je Szene
  if (szene === 2) rect(c, 24, 14, 272, 152, "#352e42"); // Drachenhöhle
  else if (szene === 4) rect(c, 24, 14, 272, 152, "#243b68"); // Abendfest
  else rect(c, 24, 14, 272, 152, "#92d0e8"); // Tag

  // Kulissen-Objekte
  if (szene === 0 || szene === 4) {
    // Pappschloss
    rect(c, 118, 66, 84, 88, "#d9d0be");
    rect(c, 108, 48, 22, 106, "#c7bda8");
    rect(c, 190, 48, 22, 106, "#c7bda8");
    poly(c, [[105, 48], [119, 26], [133, 48]], "#b84440");
    poly(c, [[187, 48], [201, 26], [215, 48]], "#b84440");
    rrect(c, 146, 114, 28, 40, 14, "#593d26");
  } else if (szene === 1) {
    oval(c, 92, 152, 86, 46, "#6cb05a");
    oval(c, 234, 152, 92, 54, "#589c4c");
  } else if (szene === 2) {
    disc(c, 84, 62, 12, "rgba(255,210,100,.28)");
    disc(c, 84, 62, 5, "#ffe082");
  } else {
    // Riesen-Torte in Szene 3
    rect(c, 128, 112, 64, 34, "#f7e6c4");
    rect(c, 138, 86, 44, 26, "#f7c4d0");
    rect(c, 128, 110, 64, 6, "#ffffff");
  }

  // Holzbühne
  rect(c, 0, 152, 320, 56, "#6e4728");
  rect(c, 0, 152, 320, 4, "#94653c");

  // Stabpuppen (Frosch, schüchterner Drache, Prinzessin)
  const wip = Math.sin(t * 3.8) * 3;
  // Kleiner Frosch (immer dabei!)
  const fx = szene === 1 ? 106 : szene === 3 ? 98 : 118;
  const fy = 136 + wip;
  rect(c, fx - 1, fy + 10, 2, 24, "#a6855a");
  disc(c, fx, fy, 11, "#5bb85a");
  disc(c, fx - 5, fy - 9, 4, "#eef7f2"); disc(c, fx + 5, fy - 9, 4, "#eef7f2");
  disc(c, fx - 5, fy - 9, 1.8, "#111"); disc(c, fx + 5, fy - 9, 1.8, "#111");
  // Goldkrönchen
  poly(c, [[fx - 5, fy - 12], [fx - 3, fy - 18], [fx, fy - 13], [fx + 3, fy - 18], [fx + 5, fy - 12]], "#ffd447");

  // Drache (ab Szene 1)
  if (szene >= 1) {
    const dx = szene === 1 ? 228 - smooth(seg(t, 42, 68)) * 22 : 208;
    const dy = 128 - wip;
    rect(c, dx - 1, dy + 14, 2, 28, "#a6855a");
    oval(c, dx, dy, 18, 15, "#389c6a");
    oval(c, dx - 2, dy + 4, 11, 9, "#a8e6b4");
    poly(c, [[dx + 12, dy - 12], [dx + 28, dy - 22], [dx + 22, dy - 2]], "#2d7d54");
    disc(c, dx - 12, dy - 12, 8, "#389c6a");
    disc(c, dx - 15, dy - 14, 2, "#fff"); disc(c, dx - 15, dy - 14, 1, "#111");
    // Kleine Herz-Flamme beim Backen!
    if (szene === 3 && Math.sin(t * 2.4) > 0) {
      disc(c, dx - 32, dy - 10, 6, "#ff8b4a");
      disc(c, dx - 32, dy - 10, 3, "#ffe880");
    }
  }

  // Feststerne im Finale
  if (szene === 4) {
    for (let i = 0; i < 16; i++) disc(c, 44 + hash(i + 8) * 232, ((hash(i + 22) * 140 + t * 24) % 140) + 12, 2, "#ffd966");
  }

  // Roter Samtvorhang links & rechts (öffnet am Anfang, schließt ganz am Ende)
  const vorhangOffen = smooth(seg(t, 0, 10)) * (1 - smooth(seg(t, 290, 300)));
  const vw = lerp(156, 26, vorhangOffen);
  rect(c, 0, 0, vw, 176, "#9e202a");
  rect(c, 320 - vw, 0, vw, 176, "#9e202a");
  // Goldene Vorhang-Quasten & oberer Volant
  rect(c, 0, 0, 320, 16, "#851822");
  rect(c, 0, 15, 320, 3, "#e8be56");

  const titel = [
    "Vorhang auf · Am Schloss",
    "Szene 1 · Rauch über dem Hügel",
    "Szene 2 · Der schüchterne Drache",
    "Szene 3 · Gemeinsam Torte backen",
    "Finale · Großer Applaus!",
  ][szene];
  bauchbinde(c, "PUPPENTHEATER", titel, gross);
}

/* =========================================================================
   9. KOCHSHOW – „Pfanne & Chaos“ (3-Gänge-Menü über 5 Minuten)
   ========================================================================= */
function drawKochshow(c: C, t: number, _tag: number, gross: boolean) {
  // Studio-Kachelwand
  rect(c, -140, 0, 600, 208, "#efe7d8");
  for (let y = 0; y < 120; y += 16) {
    for (let x = 0; x < 320; x += 16) {
      if ((Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0) rect(c, x, y, 16, 16, "#e3d9c5");
    }
  }
  // ON AIR Schild
  rrect(c, 250, 10, 58, 16, 4, "#b82a24");
  if (gross) {
    c.fillStyle = "#fff"; c.font = '700 8px "Silkscreen", monospace'; c.textAlign = "center";
    c.fillText("ON AIR", 279, 21);
  }

  // Fernsehkoch hinter der Theke
  const akt = t < 52 ? 0 : t < 114 ? 1 : t < 184 ? 2 : t < 246 ? 3 : 4;
  const schreck = akt === 2 && Math.sin(t * 1.4) > 0.45 ? 1 : 0;
  const cx = 152;
  const cy = 96;
  // Kochjacke & Halstuch
  rrect(c, cx - 22, cy, 44, 46, 10, "#ffffff");
  poly(c, [[cx - 8, cy], [cx + 8, cy], [cx, cy + 12]], "#d9453c");
  // Kopf & Schnauzbart
  disc(c, cx, cy - 12, 14, "#f0c6a4");
  disc(c, cx - 5, cy - 14, 1.8, "#111"); disc(c, cx + 5, cy - 14, 1.8, "#111");
  oval(c, cx - 4, cy - 8, 5, 2.2, "#4a3222"); oval(c, cx + 4, cy - 8, 5, 2.2, "#4a3222");
  // Hohe Kochmütze (hüpft beim Flambieren hoch!)
  const hutY = cy - 26 - schreck * 14;
  rect(c, cx - 12, hutY - 8, 24, 10, "#ffffff");
  disc(c, cx - 8, hutY - 12, 8, "#ffffff");
  disc(c, cx, hutY - 16, 9, "#ffffff");
  disc(c, cx + 8, hutY - 12, 8, "#ffffff");

  // Studio-Kochtheke
  rect(c, 0, 126, 320, 82, "#355c6e");
  rect(c, 0, 122, 320, 8, "#d9ccb4");

  if (akt === 0) {
    // Schnippeln auf dem Holzbrett
    rrect(c, 112, 114, 78, 10, 3, "#a87948");
    const schlag = Math.abs(Math.sin(t * 9));
    for (let i = 0; i < 5; i++) disc(c, 126 + i * 10, 117, 3.5, i % 2 ? "#e85c42" : "#f29434");
    rect(c, 152, 102 + schlag * 10, 22, 4, "#cfd8de");
  } else if (akt === 1) {
    // Kupfertopf mit Dampf & fliegenden Kräutern
    rrect(c, 124, 96, 56, 30, 6, "#c97440");
    for (let i = 0; i < 5; i++) {
      const u = (t * 0.9 + i * 0.2) % 1;
      disc(c, 134 + i * 9, 92 - u * 26, 3 + u * 4, `rgba(255,255,255,${(1 - u) * 0.65})`);
    }
    disc(c, 152 + Math.sin(t * 5) * 14, 72 - Math.abs(Math.sin(t * 5)) * 16, 2.2, "#4eb85c");
  } else if (akt === 2) {
    // Flambieren in der Pfanne mit komischer Stichflamme!
    rrect(c, 120, 114, 62, 10, 4, "#2a2f35");
    rect(c, 180, 116, 28, 4, "#5a4028");
    if (schreck > 0) {
      poly(c, [[128, 114], [174, 114], [151, 34 + Math.sin(t * 25) * 8]], "#ff7828");
      poly(c, [[136, 114], [166, 114], [151, 58]], "#fff08a");
    }
  } else if (akt === 3) {
    // Wackelnde Sahnetorte + Kirsche
    const wak = Math.sin(t * 4) * 5;
    rect(c, 126, 110, 52, 14, "#f7e8d4");
    rect(c, 132 + wak * 0.5, 94, 40, 16, "#f7c2cc");
    rect(c, 138 + wak, 80, 28, 14, "#ffffff");
    disc(c, 152 + wak, 76, 4, "#d92c34");
  } else {
    // Drei glänzende Teller auf dem Tresen
    for (const [px, col] of [[86, "#e88a42"], [160, "#c84638"], [234, "#f4b8c8"]] as const) {
      oval(c, px, 122, 26, 6, "#ffffff");
      oval(c, px, 118, 16, 5, col);
      disc(c, px + Math.sin(t * 4 + px) * 12, 108, 2, "#ffe680");
    }
  }

  const menu = [
    "Vorspeise · Blitzschnell schnippeln",
    "Suppe · Eine Prise Zauberkräuter",
    "Hauptgang · Achtung, Stichflamme!",
    "Dessert · Der wackelige Tortenturm",
    "3-Gänge-Menü fertig angerichtet!",
  ][akt];
  bauchbinde(c, "PFANNE & CHAOS · LIVE", menu, gross);
}

/* =========================================================================
   10. FROSCH-NEWS – „Frog News“ (6 Beiträge + Laufband)
   ========================================================================= */
/** Wie weit der Froschmund gerade geöffnet ist (0 = zu, 1 = weit): Silben mit kurzen Pausen. */
function sprechMund(t: number, tempo = 1): number {
  const phase = (t * tempo) % 5.2;
  if (phase > 4.3) return 0; // kleine Atempause zwischen zwei Sätzen
  const silbe = Math.abs(Math.sin(t * 9.5 * tempo)) * (0.55 + 0.45 * Math.abs(Math.sin(t * 3.1 * tempo + 0.7)));
  return clamp(silbe * 1.25);
}

/**
 * Froschkopf mit bewegtem Mund: `mund` 0..1 öffnet den Mund (dunkler Rachen, Zunge),
 * sonst liegt ein freundliches Lächeln an. Die Augen blinzeln gelegentlich.
 */
function froschKopf(c: C, x: number, y: number, s = 1, t = 0, mund = 0) {
  oval(c, x, y, 16 * s, 12 * s, "#4fb054");
  // Kehle wölbt sich beim Sprechen leicht
  if (mund > 0.05) oval(c, x, y + 10 * s, 9 * s, (2 + 2.5 * mund) * s, "#6dc46e");
  const blinzel = ((t * 0.9 + x * 0.013) % 3.7) < 0.13;
  for (const ex of [x - 8 * s, x + 8 * s]) {
    disc(c, ex, y - 10 * s, 5.5 * s, "#eef7f2");
    if (blinzel) {
      c.strokeStyle = "#1d4a22"; c.lineWidth = 1.6 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(ex - 3.2 * s, y - 9.5 * s); c.lineTo(ex + 3.2 * s, y - 9.5 * s); c.stroke();
    } else {
      disc(c, ex + Math.sin(t * 0.7) * 0.8 * s, y - 10 * s + mund * 0.6 * s, 2.4 * s, "#121a14");
      disc(c, ex - 0.8 * s, y - 11 * s, 0.7 * s, "#ffffff");
    }
  }
  const offen = clamp(mund);
  if (offen > 0.06) {
    // Geöffneter Mund mit Rachen und Zunge
    const mh = (1.4 + 4.8 * offen) * s, mw = (7.5 - 1.5 * offen) * s;
    c.fillStyle = "#3a1418";
    c.beginPath(); c.ellipse(x, y + 3.2 * s + mh * 0.35, mw, mh, 0, 0, TAU); c.fill();
    c.fillStyle = "#d9566a";
    c.beginPath(); c.ellipse(x, y + 3.6 * s + mh * 0.75, mw * 0.55, Math.max(0.4, mh * 0.4), 0, 0, TAU); c.fill();
    c.strokeStyle = "#1d4a22"; c.lineWidth = 1.3 * s;
    c.beginPath(); c.ellipse(x, y + 3.2 * s + mh * 0.35, mw, mh, 0, 0, TAU); c.stroke();
  } else {
    c.strokeStyle = "#1d4a22"; c.lineWidth = 1.6 * s; c.lineCap = "round";
    c.beginPath(); c.arc(x, y + 1 * s, 8 * s, 0.2, Math.PI - 0.2); c.stroke();
  }
  // Kleine Nasenlöcher
  disc(c, x - 2.2 * s, y - 2.5 * s, 0.7 * s, "#1d4a22");
  disc(c, x + 2.2 * s, y - 2.5 * s, 0.7 * s, "#1d4a22");
}

function drawFroschnews(c: C, t: number, _tag: number, gross: boolean) {
  const beitrag = t < 44 ? 0 : t < 100 ? 1 : t < 156 ? 2 : t < 212 ? 3 : t < 262 ? 4 : 5;
  // Blaues Nachrichtenstudio
  const bg = c.createLinearGradient(0, 0, 0, 180);
  bg.addColorStop(0, "#12325e"); bg.addColorStop(1, "#0b1e3b");
  c.fillStyle = bg; c.fillRect(-140, 0, 600, 208);

  if (beitrag === 0 || beitrag === 5) {
    // Studio-Frosch am Pult + Bild-im-Bild
    rrect(c, 198, 22, 102, 66, 4, "#24548a");
    disc(c, 249, 55, 22, "#4aa4d8");
    oval(c, 244, 52, 9, 6, "#5ec26e");
    // Moderator-Frosch im Anzug + roter Krawatte
    rrect(c, 84, 92, 56, 48, 12, "#242c38");
    poly(c, [[108, 92], [116, 92], [112, 124]], "#d93c34");
    froschKopf(c, 112, 76 + Math.sin(t * 2.2) * 0.6, 1.15, t, sprechMund(t));
    // Moderatorenpult mit Blättern und Mikrofon
    rrect(c, 22, 128, 276, 44, 8, "#1e4b80");
    rect(c, 22, 134, 276, 4, "#ffd447");
    rrect(c, 128, 136, 30, 8, 1.5, "#f4f2ea");
    rect(c, 132, 139, 18, 1, "#8a94a6"); rect(c, 132, 141.5, 14, 1, "#8a94a6");
    c.strokeStyle = "#2a3340"; c.lineWidth = 2; c.lineCap = "round";
    c.beginPath(); c.moveTo(96, 140); c.lineTo(104, 96); c.stroke();
    disc(c, 104.5, 94, 3.2, "#3b4655");
    // ON AIR Lampe pulsiert mit den Silben
    rrect(c, 232, 146, 52, 16, 3, "#8f1f1f");
    disc(c, 240, 154, 3, `rgba(255,90,80,${0.55 + 0.45 * sprechMund(t)})`);
    if (gross) {
      c.fillStyle = "#ffffff"; c.font = '700 7px "Silkscreen", monospace'; c.textAlign = "left";
      c.fillText("ON AIR", 247, 154.5);
    }
  } else if (beitrag === 1) {
    // Außenreporter im Wind & Regen
    rect(c, 0, 0, 320, 176, "#546b7d");
    rect(c, 0, 132, 320, 44, "#3b5244");
    const boe = Math.sin(t * 2.8) > 0.3 ? 1 : 0;
    rrect(c, 134, 96, 42, 48, 8, "#b89f6e");
    froschKopf(c, 155, 82 + Math.sin(t * 3) * 0.5, 1, t, sprechMund(t, 1.15));
    // Reportermikrofon mit Frog-News-Würfel in der Hand
    c.strokeStyle = "#2a3340"; c.lineWidth = 2.2; c.lineCap = "round";
    c.beginPath(); c.moveTo(140, 118); c.lineTo(148, 96); c.stroke();
    rrect(c, 144, 96, 9, 7, 1.5, "#ffd447");
    disc(c, 148.5, 93, 3.4, "#3b4655");
    // Regenschirm klappt um!
    c.strokeStyle = "#222"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(182, 108); c.lineTo(182, 56); c.stroke();
    c.fillStyle = "#e0584e";
    c.beginPath();
    if (boe) c.arc(182, 46, 22, 0, Math.PI);
    else c.arc(182, 62, 22, Math.PI, 0);
    c.fill();
    c.strokeStyle = "rgba(215,240,255,.7)"; c.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const rx = ((hash(i) * 320 - t * 60) % 320 + 320) % 320;
      const ry = ((hash(i + 20) * 170 + t * 130) % 170);
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 6, ry + 10); c.stroke();
    }
  } else if (beitrag === 2) {
    // Verkehr: Enten-Stau auf der Landstraße
    rect(c, 0, 0, 320, 176, "#6da65a");
    rect(c, 0, 74, 320, 44, "#4b525a");
    for (let x = 10; x < 320; x += 28) rect(c, x, 94, 14, 3, "#f4f2ea");
    // Wartende Autos
    for (const [ax, col] of [[24, "#d94b42"], [74, "#4a92d9"], [240, "#e6b83c"]] as const) {
      rrect(c, ax, 80, 34, 16, 4, col);
      rect(c, ax + 6, 82, 14, 6, "#aee4f2");
    }
    // Lange Entenreihe watschelt gemächlich über die Straße
    for (let i = 0; i < 6; i++) {
      const dy = ((t * 14 + i * 24) % 150) + 18;
      oval(c, 160 + Math.sin(t * 6 + i) * 2, dy, 6, 4, i === 0 ? "#f4f2ea" : "#ffd94a");
    }
  } else if (beitrag === 3) {
    // Animierte Wetterkarte
    rrect(c, 84, 18, 212, 140, 8, "#29699e");
    poly(c, [[122, 34], [218, 30], [262, 74], [244, 138], [148, 146], [110, 96]], "#6bb868");
    disc(c, 152, 62, 13, "#ffe054");
    wolke(c, 224 + Math.sin(t) * 6, 98, 1.1, "#eef5fa");
    // Wetterfrosch links mit Zeigestock
    rrect(c, 22, 92, 42, 54, 8, "#263448");
    froschKopf(c, 43, 78, 0.9, t, sprechMund(t, 0.9));
    c.strokeStyle = "#ffd966"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(60, 102); c.lineTo(140, 72 + Math.sin(t * 2) * 16); c.stroke();
  } else {
    // Sport: Teich-Weitsprung
    rect(c, 0, 0, 320, 176, "#2c82a8");
    for (const lx of [58, 156, 254]) oval(c, lx, 128, 28, 11, "#4aa854");
    const u = (t * 0.45) % 1;
    const fx = lerp(58, 254, u);
    const fy = 122 - Math.sin(u * Math.PI) * 74;
    froschKopf(c, fx, fy, 0.72);
    // Wertungstafel oben
    rrect(c, 124, 18, 72, 26, 4, "#ffffff");
    if (gross) {
      c.fillStyle = "#d93c34"; c.font = '700 13px "Silkscreen", monospace'; c.textAlign = "center";
      c.fillText("9.9 !", 160, 35);
    }
  }

  // Laufband unten
  rect(c, 0, 176, 320, 32, "#b82424");
  rect(c, 0, 176, 78, 32, "#ffd447");
  if (gross) {
    c.fillStyle = "#16202a"; c.font = '700 8px "Silkscreen", monospace'; c.textAlign = "center";
    c.fillText("FROG NEWS", 39, 195);
    const ticker = "+++ EILMELDUNG: ENTEN BLOCKIEREN TEICHBRÜCKE +++ WETTER: BESTES FLIEGENWETTER +++ SPORT: NEUER SEEROSEN-REKORD 9.9 +++ ";
    c.save();
    c.beginPath(); c.rect(80, 176, 240, 32); c.clip();
    const ox = 320 - ((t * 32) % 720);
    c.fillStyle = "#ffffff"; c.font = '600 9px "Space Grotesk", sans-serif'; c.textAlign = "left";
    c.fillText(ticker + ticker, ox, 195);
    c.restore();
  }
}

/* =========================================================================
   11. RETRO-RENNEN – 5-Runden-Grand-Prix (mit Regen, Boxenstopp, Podium!)
   ========================================================================= */
function drawRennen(c: C, t: number, tag: number, gross: boolean) {
  const regen = smooth(seg(t, 88, 98)) * (1 - smooth(seg(t, 148, 158)));
  const abend = smooth(seg(t, 198, 248));
  const runde = Math.min(5, Math.max(1, Math.floor(seg(t, 18, 264) * 5) + 1));

  if (t >= 264) {
    // Siegerehrung auf dem Podest!
    rect(c, -140, 0, 600, 208, "#1c3354");
    const colSieger = ["#e0463c", "#3e8ce0", "#f0c83c", "#4eb862"][Math.abs(tag) % 4];
    rrect(c, 124, 96, 72, 76, 4, "#d9b44a");
    rrect(c, 52, 118, 68, 54, 4, "#aeb8c2");
    rrect(c, 200, 130, 68, 42, 4, "#b87a4e");
    // Siegerauto + goldener Pokal
    rrect(c, 140, 78, 40, 18, 5, colSieger);
    disc(c, 160, 56, 10, "#ffd954");
    rect(c, 156, 65, 8, 9, "#d9a82e");
    for (let i = 0; i < 30; i++) rect(c, hash(i + 2) * 320, (hash(i + 80) * 180 + t * 38) % 180, 4, 4, ["#ff6", "#f66", "#6cf", "#6f8"][i % 4]);
    bauchbinde(c, "GRAND PRIX · SIEGEREHRUNG", "Pokal & Konfetti nach 5 Runden!", gross);
    return;
  }

  // Himmel
  const sky = mixCol(mixCol("#5da8e0", "#5a6c7d", regen), "#e08452", abend);
  rect(c, -140, 0, 600, 92, sky);
  // Berge
  poly(c, [[-140, 92], [50, 58], [130, 78], [210, 52], [300, 74], [460, 92]], mixCol("#4a6e7a", "#3c2f48", abend));
  // Wiese
  rect(c, -140, 92, 600, 116, mixCol("#4e9444", "#2c4c34", abend * 0.6));

  // Pseudo-3D Rennstrecke
  const kurve = t < 18 ? 0 : Math.sin(t * 0.42) * 44;
  const vx = 160 + kurve;
  const vy = 92;
  const fahre = t < 16 ? 0 : t * 7.8;
  for (let i = 0; i < 16; i++) {
    const u0 = i / 16, u1 = (i + 1) / 16;
    const z0 = u0 * u0, z1 = u1 * u1;
    const y0 = lerp(vy, 208, z0), y1 = lerp(vy, 208, z1);
    const c0 = lerp(vx, 160, z0), c1 = lerp(vx, 160, z1);
    const w0 = lerp(12, 136, z0), w1 = lerp(12, 136, z1);
    const streifen = (Math.floor(i + fahre) % 2) === 0;
    // Curbs rot/weiß
    poly(c, [[c0 - w0 - 5 * z0, y0], [c0 + w0 + 5 * z0, y0], [c1 + w1 + 5 * z1, y1], [c1 - w1 - 5 * z1, y1]], streifen ? "#e0463c" : "#f4f2ea");
    // Asphalt
    poly(c, [[c0 - w0, y0], [c0 + w0, y0], [c1 + w1, y1], [c1 - w1, y1]], regen > 0.4 ? "#363e48" : "#444a52");
    if (streifen) rect(c, (c0 + c1) / 2 - 2 * z1, y0, 4 * z1, y1 - y0, "rgba(255,255,255,.55)");
  }

  // Startampel (0..18 s, knackiger Start!)
  if (t < 18) {
    rrect(c, 114, 24, 92, 24, 4, "#1a1e24");
    const gruen = t >= 15.5;
    for (let i = 0; i < 5; i++) {
      const an = gruen || t > 2.5 + i * 2.4;
      disc(c, 128 + i * 16, 36, 5, gruen ? "#46e068" : an ? "#eb3a34" : "#3a2224");
    }
  }

  // Vier Rennwagen (dynamische Überholmanöver über die 5 Runden!)
  const wagen = [
    { col: "#e0463c", name: "ROT", s: 0 },
    { col: "#3e8ce0", name: "BLAU", s: 1 },
    { col: "#f0c83c", name: "GELB", s: 2 },
    { col: "#4eb862", name: "GRÜN", s: 3 },
  ];
  const sieger = Math.abs(tag) % 4;
  const geordnet = wagen.map((w) => {
    const boost = w.s === sieger ? smooth(seg(t, 200, 262)) * 0.25 : 0;
    const z = clamp(0.45 + Math.sin(t * 0.28 + w.s * 1.7 + tag) * 0.26 - boost, 0.16, 0.86);
    const spur = Math.sin(t * 0.4 + w.s * 2.1) * 0.55;
    return { ...w, z, spur };
  }).sort((a, b) => a.z - b.z);

  for (const w of geordnet) {
    const cy = lerp(vy + 8, 178, w.z);
    const cx = lerp(vx, 160, w.z) + w.spur * lerp(14, 96, w.z);
    const sc = lerp(0.32, 1.15, w.z);
    // Schatten & Reifen
    oval(c, cx, cy + 7 * sc, 18 * sc, 5 * sc, "rgba(0,0,0,.38)");
    rect(c, cx - 18 * sc, cy - 2 * sc, 6 * sc, 9 * sc, "#1a1c20");
    rect(c, cx + 12 * sc, cy - 2 * sc, 6 * sc, 9 * sc, "#1a1c20");
    // Karosserie + Heckflügel
    rrect(c, cx - 14 * sc, cy - 9 * sc, 28 * sc, 14 * sc, 4 * sc, w.col);
    rect(c, cx - 15 * sc, cy - 13 * sc, 30 * sc, 4 * sc, "#1e242a");
    disc(c, cx, cy - 6 * sc, 4.5 * sc, "#f4f6f8");
  }

  // Regenstreifen
  if (regen > 0.1) {
    c.strokeStyle = `rgba(215,240,255,${regen * 0.65})`;
    c.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const rx = (hash(i + 5) * 320);
      const ry = ((hash(i + 35) * 208 + t * 180) % 208);
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 3, ry + 12); c.stroke();
    }
  }

  if (gross) {
    rrect(c, 224, 8, 86, 18, 4, "rgba(10,16,22,.82)");
    c.fillStyle = "#ffd966"; c.font = '700 8px "Silkscreen", monospace'; c.textAlign = "right";
    c.fillText(`RUNDE ${runde}/5`, 304, 20);
  }
  const st =
    t < 18 ? "Startaufstellung · Ampel rot"
    : regen > 0.3 ? "Regen auf der Strecke!"
    : t > 154 && t < 198 ? "Boxenstopp-Phase"
    : runde === 5 ? "Letzte Runde · Fotofinish!"
    : "Kopf-an-Kopf-Rennen";
  bauchbinde(c, "RETRO-GRAND-PRIX", st, gross);
}

/* =========================================================================
   12. BILDERRÄTSEL – Quizshow (6 Runden à 50 s zum Mitraten!)
   ========================================================================= */
const QUIZ_MOTIVE = [
  { id: "leuchtturm", name: "LEUCHTTURM" },
  { id: "rakete", name: "RAKETE" },
  { id: "katze", name: "KATZE" },
  { id: "schiff", name: "SEGELSCHIFF" },
  { id: "baum", name: "TANNENBAUM" },
  { id: "krone", name: "GOLDKRONE" },
] as const;

function drawQuizMotiv(c: C, id: string, cx: number, cy: number) {
  if (id === "leuchtturm") {
    rect(c, cx - 36, cy + 20, 72, 16, "#3e88b8");
    poly(c, [[cx - 10, cy + 20], [cx - 6, cy - 22], [cx + 6, cy - 22], [cx + 10, cy + 20]], "#f4f2ea");
    rect(c, cx - 8, cy - 6, 16, 10, "#d9453c");
    rect(c, cx - 7, cy - 30, 14, 9, "#ffe678");
    poly(c, [[cx - 9, cy - 30], [cx, cy - 38], [cx + 9, cy - 30]], "#d9453c");
  } else if (id === "rakete") {
    poly(c, [[cx - 12, cy + 16], [cx - 12, cy - 12], [cx, cy - 34], [cx + 12, cy - 12], [cx + 12, cy + 16]], "#eef2f5");
    poly(c, [[cx - 12, cy + 4], [cx - 22, cy + 20], [cx - 12, cy + 18]], "#d9453c");
    poly(c, [[cx + 12, cy + 4], [cx + 22, cy + 20], [cx + 12, cy + 18]], "#d9453c");
    disc(c, cx, cy - 4, 6, "#66daf0");
  } else if (id === "katze") {
    disc(c, cx, cy + 4, 20, "#e69648");
    poly(c, [[cx - 18, cy - 8], [cx - 14, cy - 28], [cx - 3, cy - 14]], "#e69648");
    poly(c, [[cx + 18, cy - 8], [cx + 14, cy - 28], [cx + 3, cy - 14]], "#e69648");
    disc(c, cx - 7, cy, 3, "#1a1a1a"); disc(c, cx + 7, cy, 3, "#1a1a1a");
    poly(c, [[cx - 3, cy + 6], [cx + 3, cy + 6], [cx, cy + 10]], "#d95b6a");
  } else if (id === "schiff") {
    rect(c, cx - 40, cy + 16, 80, 18, "#3e88b8");
    poly(c, [[cx - 24, cy + 16], [cx + 24, cy + 16], [cx + 16, cy + 26], [cx - 16, cy + 26]], "#7a4c2a");
    rect(c, cx - 1, cy - 28, 3, 44, "#5c3a20");
    poly(c, [[cx + 2, cy - 26], [cx + 26, cy + 10], [cx + 2, cy + 10]], "#f7f4ec");
    poly(c, [[cx - 2, cy - 20], [cx - 20, cy + 10], [cx - 2, cy + 10]], "#e6e2d8");
  } else if (id === "baum") {
    tanne(c, cx, cy + 30, 62, "#2f7d47", false);
    disc(c, cx, cy - 32, 4.5, "#ffd447");
    for (const [dx, dy, col] of [[-10, 8, "#e84a42"], [10, 14, "#ffd447"], [0, -6, "#5cc8f2"]] as const) disc(c, cx + dx, cy + dy, 3, col);
  } else {
    poly(c, [[cx - 26, cy + 16], [cx - 28, cy - 16], [cx - 12, cy], [cx, cy - 22], [cx + 12, cy], [cx + 28, cy - 16], [cx + 26, cy + 16]], "#f4c438");
    for (const [dx, col] of [[-14, "#e04646"], [0, "#4ea8e8"], [14, "#58c46e"]] as const) disc(c, cx + dx, cy + 6, 3.6, col);
  }
}

function drawQuizshow(c: C, t: number, tag: number, gross: boolean) {
  // Showbühne mit Lichtern
  const bg = c.createLinearGradient(0, 0, 0, 208);
  bg.addColorStop(0, "#24184a"); bg.addColorStop(1, "#120c28");
  c.fillStyle = bg; c.fillRect(-140, 0, 600, 208);
  for (let i = 0; i < 16; i++) {
    const an = (Math.floor(t * 3) + i) % 2 === 0;
    disc(c, 16 + i * 19, 8, 2.6, an ? "#ffd966" : "#5e4c2a");
  }

  const rundeIdx = Math.min(5, Math.floor(t / 50));
  const rT = t - rundeIdx * 50;
  const motiv = QUIZ_MOTIVE[(rundeIdx + Math.abs(tag)) % QUIZ_MOTIVE.length];

  // Großer Rate-Bildschirm in der Mitte (104..216, 20..108)
  rrect(c, 100, 18, 120, 92, 6, "#14263b");
  c.save();
  c.beginPath(); c.rect(104, 22, 112, 84); c.clip();
  rect(c, 104, 22, 112, 84, "#1d3854");
  drawQuizMotiv(c, motiv.id, 160, 66);

  // 4×4 Abdeckkacheln klappen zügig nacheinander weg (0..38 s), ab 40 s Lösung frei!
  const offenZahl = rT >= 40 ? 16 : Math.min(15, Math.floor((rT / 38) * 14) + 2);
  const reihenfolge = [5, 10, 6, 9, 1, 14, 2, 13, 4, 11, 7, 8, 0, 15, 3, 12];
  const offen = new Set(reihenfolge.slice(0, offenZahl));
  for (let r = 0; r < 4; r++) {
    for (let q = 0; q < 4; q++) {
      if (offen.has(r * 4 + q)) continue;
      rrect(c, 105 + q * 28, 23 + r * 21, 26, 19, 2, "#3a4d82");
      if (gross) {
        c.fillStyle = "#b8caf0"; c.font = '700 8px "Silkscreen", monospace'; c.textAlign = "center";
        c.fillText("?", 118 + q * 28, 36 + r * 21);
      }
    }
  }
  c.restore();

  // Drei Kandidaten an leuchtenden Pulten
  const buzzer = rT > 35 ? (rundeIdx + Math.abs(tag)) % 3 : -1;
  const kCols = ["#e85950", "#4aa6e8", "#58c472"];
  for (let i = 0; i < 3; i++) {
    const px = 42 + i * 96;
    // Kandidat
    disc(c, px + 22, 128, 8, "#f0c6a4");
    rrect(c, px + 11, 136, 22, 16, 4, kCols[i]);
    // Pult
    rrect(c, px, 144, 44, 28, 4, i === buzzer ? "#ffd966" : "#2e3c5c");
    disc(c, px + 22, 146, 4, i === buzzer ? "#ff463c" : "#8a3230");
    if (i === buzzer && gross) {
      c.fillStyle = "#ffe666"; c.font = '700 10px "Silkscreen", monospace'; c.textAlign = "center";
      c.fillText("!", px + 22, 116);
    }
  }

  const info = rT >= 40 ? `Lösung: ${motiv.name}!` : rT > 35 ? "Buzzer gedrückt – was ist es?" : `Runde ${rundeIdx + 1}/6 · Rate mit!`;
  bauchbinde(c, `BILDERRÄTSEL · RUNDE ${rundeIdx + 1}/6`, info, gross);
}

/* =========================================================================
   HAUPT-AUFRUF
   ========================================================================= */

/**
 * Zeichnet eine der 12 TV-Sendungen sauber in das Rechteck (x, y, w, h).
 * `sek` ist die verstrichene Sendezeit (wird automatisch auf 0..300 s umgelegt).
 */
export function drawTvSendung(
  c: C,
  x: number,
  y: number,
  w: number,
  h: number,
  id: TVSendungId,
  sek: number,
  tag: number,
) {
  const t = ((sek % SENDUNG_DAUER) + SENDUNG_DAUER) % SENDUNG_DAUER;
  const gross = w >= 180;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  // Gleichmäßige Skalierung der 320×208-Bühne, mittig – nichts wird verzerrt.
  const sc = Math.min(w / 320, h / 208);
  const ox = x + (w - 320 * sc) / 2;
  const oy = y + (h - 208 * sc) / 2;
  c.translate(ox, oy);
  c.scale(sc, sc);

  switch (id) {
    case "malfreude": drawMalfreude(c, t, tag, gross); break;
    case "zugfahrt": drawZugfahrt(c, t, tag, gross); break;
    case "tiefsee": drawTiefsee(c, t, tag, gross); break;
    case "domino": drawDomino(c, t, tag, gross); break;
    case "wald": drawWald(c, t, tag, gross); break;
    case "krimi": drawKrimi(c, t, tag, gross); break;
    case "expedition": drawExpedition(c, t, tag, gross); break;
    case "theater": drawTheater(c, t, tag, gross); break;
    case "kochshow": drawKochshow(c, t, tag, gross); break;
    case "froschnews": drawFroschnews(c, t, tag, gross); break;
    case "rennen": drawRennen(c, t, tag, gross); break;
    case "quizshow": drawQuizshow(c, t, tag, gross); break;
  }

  // Kleine dezente Fortschritts-Uhr oben links im Vollbild (z. B. "02:15 / 05:00")
  if (gross) {
    const mm = String(Math.floor(t / 60)).padStart(2, "0");
    const ss = String(Math.floor(t % 60)).padStart(2, "0");
    rrect(c, 10, 8, 72, 16, 4, "rgba(8,20,26,.72)");
    c.fillStyle = "#eef7f2";
    c.font = '700 7px "Silkscreen", monospace';
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(`${mm}:${ss} / 05:00`, 15, 16.5);
  }
  c.restore();
}
