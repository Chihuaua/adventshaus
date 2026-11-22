/* =======================================================================
   ADVENTSKALENDER IM WEIHNACHTSHAUS – WELTRAUM
   Die große Kalendertafel schwebt im Nachthimmel. Dieses Modul hält die
   gemeinsamen Zeichen-Helfer für die Kalender-Module des Weihnachtshauses
   sowie den Himmel, die geschnitzte Rahmenzier und die 24 Lampen am Innenrand.

   Alles handgezeichnet mit Canvas-Grundformen, keine Bild- oder Fontdateien.
   Das normale Haus behält seinen bisherigen Kalender (advent.ts, Stil "klassisch").
   ======================================================================= */

export type C = CanvasRenderingContext2D;
export type Rect = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];

export const TAU = Math.PI * 2;
const W = 960;
const H = 600;

export const GOLD = "#e8c25a";
export const GOLD_HELL = "#f7dfa0";
export const GOLD_TIEF = "#c49a35";
export const ROT = "#c9453a";
export const ROT_TIEF = "#8c2a22";
export const CREME = "#f3e7cd";
export const NACHT = "#0c1330";

/* ------------------------------ Helfer -------------------------------- */

/** Deterministisches Rauschen aus einer Zahl: gleiche Zahl, gleicher Wert. */
export function rand(i: number): number {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function kreis(c: C, x: number, y: number, r: number, farbe: string): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.arc(x, y, Math.max(0.01, r), 0, TAU);
  c.fill();
}

export function ell(c: C, x: number, y: number, rx: number, ry: number, farbe: string): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU);
  c.fill();
}

export function strich(c: C, x0: number, y0: number, x1: number, y1: number, farbe: string, breite = 1): void {
  c.strokeStyle = farbe;
  c.lineWidth = breite;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
}

export function poly(c: C, punkte: readonly Pt[], farbe: string): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) c.lineTo(punkte[i][0], punkte[i][1]);
  c.closePath();
  c.fill();
}

/** Gefülltes Rechteck mit runden Ecken. */
export function rund(c: C, x: number, y: number, w: number, h: number, r: number, farbe: string): void {
  c.fillStyle = farbe;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}

/** Ein Pixel: kleines, scharfes Quadrat – die Grundform für Videospiele-Anklänge. */
export function px(c: C, x: number, y: number, s: number, farbe: string): void {
  c.fillStyle = farbe;
  c.fillRect(x, y, s, s);
}

/** Kleines Pixelbild aus Textzeilen: jedes Zeichen steht für eine Farbe in `pal`. */
export function bmp(c: C, x: number, y: number, s: number, zeilen: readonly string[], pal: Readonly<Record<string, string>>): void {
  zeilen.forEach((zeile, j) => {
    for (let i = 0; i < zeile.length; i++) {
      const farbe = pal[zeile[i]];
      if (farbe) px(c, x + i * s, y + j * s, s, farbe);
    }
  });
}

/** Stern mit `spitzen` Zacken; `innen` ist das Verhältnis der inneren Radius. */
export function stern(c: C, x: number, y: number, r: number, farbe: string, spitzen = 5, innen = 0.46, dreh = -Math.PI / 2): void {
  c.fillStyle = farbe;
  c.beginPath();
  for (let i = 0; i < spitzen * 2; i++) {
    const a = dreh + (i * Math.PI) / spitzen;
    const rr = i % 2 === 0 ? r : r * innen;
    const px2 = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px2, py);
    else c.lineTo(px2, py);
  }
  c.closePath();
  c.fill();
}

/** Vierstrahliger Glitzerstern (schmales Kreuz). */
export function funke(c: C, x: number, y: number, r: number, farbe: string): void {
  const b = r * 0.26;
  poly(c, [[x, y - r], [x + b, y], [x, y + r], [x - b, y]], farbe);
  poly(c, [[x - r, y], [x, y - b], [x + r, y], [x, y + b]], farbe);
}

/** Sechsstrahlige Schneeflocke. */
export function flocke(c: C, x: number, y: number, r: number): void {
  c.strokeStyle = "rgba(244,249,255,.95)";
  c.lineWidth = 0.9;
  c.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3 + 0.3;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    c.beginPath();
    c.moveTo(x - dx * r, y - dy * r);
    c.lineTo(x + dx * r, y + dy * r);
    c.stroke();
    for (const s of [-1, 1]) {
      const bx = x + dx * r * 0.6 * s;
      const by = y + dy * r * 0.6 * s;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + Math.cos(a + 0.8 * s) * r * 0.3, by + Math.sin(a + 0.8 * s) * r * 0.3);
      c.stroke();
    }
  }
}

/** Achtelnote mit Fähnchen; (x, y) ist die Notenkugel. */
export function note(c: C, x: number, y: number, s: number, farbe: string): void {
  c.save();
  c.translate(x, y);
  ell(c, 0, 0, 2.3 * s, 1.6 * s, farbe);
  strich(c, 2 * s, 0, 2 * s, -8.5 * s, farbe, 0.9 * s);
  c.strokeStyle = farbe;
  c.lineWidth = 0.9 * s;
  c.beginPath();
  c.moveTo(2 * s, -8.5 * s);
  c.quadraticCurveTo(5.5 * s, -7 * s, 4.6 * s, -3.6 * s);
  c.stroke();
  c.restore();
}

/** Vier goldene Pixelecken: der Auswahlrahmen eines Gegenstandsplatzes. */
export function ecken(c: C, x: number, y: number, w: number, h: number, farbe: string, d = 2.4, l = 9): void {
  c.fillStyle = farbe;
  c.fillRect(x, y, l, d);
  c.fillRect(x, y, d, l);
  c.fillRect(x + w - l, y, l, d);
  c.fillRect(x + w - d, y, d, l);
  c.fillRect(x, y + h - d, l, d);
  c.fillRect(x, y + h - l, d, l);
  c.fillRect(x + w - l, y + h - d, l, d);
  c.fillRect(x + w - d, y + h - l, d, l);
}

/** Zahnrad: steht für Werkzeug. */
export function zahnrad(c: C, x: number, y: number, r: number, farbe: string): void {
  c.fillStyle = farbe;
  for (let i = 0; i < 8; i++) {
    c.save();
    c.translate(x, y);
    c.rotate((i * Math.PI) / 4);
    c.fillRect(r - 0.6, -1.5, 3.2, 3);
    c.restore();
  }
  kreis(c, x, y, r, farbe);
  kreis(c, x, y, r * 0.38, NACHT);
}

/** Kleiner Pfeil, nach oben (−1) oder unten (+1). */
export function pfeil(c: C, x: number, y: number, richtung: -1 | 1, farbe: string): void {
  poly(c, [[x - 3.2, y], [x + 3.2, y], [x, y + richtung * 5.2]], farbe);
}

/** Münze: flach liegend (rx > ry) oder stehend (rx = ry). */
export function muenz(c: C, x: number, y: number, rx: number, ry: number): void {
  ell(c, x, y, rx, ry, GOLD_TIEF);
  ell(c, x, y, rx - 0.8, ry - 0.8, GOLD);
  if (Math.abs(rx - ry) < 0.01) {
    c.strokeStyle = GOLD_TIEF;
    c.lineWidth = 0.7;
    c.beginPath();
    c.arc(x, y, rx - 2, 0, TAU);
    c.stroke();
  }
  ell(c, x - rx * 0.3, y - ry * 0.35, rx * 0.25, ry * 0.25, GOLD_HELL);
}

/* ------------------------------ Advent -------------------------------- */

const BERLIN_TAG = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
});

/**
 * Wie viele der vier Adventssonntage an `jetzt` schon erreicht sind (0–4),
 * nach dem echten Kalender in Europe/Berlin. Der 4. Advent ist der letzte
 * Sonntag vor dem 25. Dezember. Wer später kommt, findet sie erreicht.
 */
export function adventsSonntage(jetzt: number): number {
  const [jahr, monat, tag] = BERLIN_TAG.format(jetzt).split("-").map(Number);
  const vierter = 24 - new Date(Date.UTC(jahr, 11, 24)).getUTCDay();
  const heute = Date.UTC(jahr, monat - 1, tag);
  let zahl = 0;
  for (let i = 0; i < 4; i++) if (heute >= Date.UTC(jahr, 11, vierter - 21 + i * 7)) zahl++;
  return zahl;
}

/** Außenkante des Holzrahmens und seine Mitte. */
export function kanten(r: Rect) {
  return { x0: r.x - 20, y0: r.y - 20, x1: r.x + r.w + 20, y1: r.y + r.h + 20, mx: r.x + r.w / 2, my: r.y + r.h / 2 };
}

/**
 * 24 Lampen am Innenrand der Tafel, ringförmig im Uhrzeigersinn: oben links
 * beginnend, dann rechts, unten und links. Mit jedem geöffneten Türchen
 * leuchtet eine weitere – der Level-Fortschritt des Kalenders.
 */
export function adventLampen(r: Rect): Pt[] {
  const oben: Pt[] = [];
  for (let i = 0; i < 8; i++) oben.push([r.x + 22 + (i * (r.w - 44)) / 7, r.y + 4]);
  for (let i = 0; i < 4; i++) oben.push([r.x + r.w - 4, r.y + (r.h * (i + 0.5)) / 4]);
  for (let i = 0; i < 8; i++) oben.push([r.x + r.w - 22 - (i * (r.w - 44)) / 7, r.y + r.h - 4]);
  for (let i = 0; i < 4; i++) oben.push([r.x + 4, r.y + r.h - (r.h * (i + 0.5)) / 4]);
  return oben;
}

/* ------------------------------- Himmel -------------------------------- */

/**
 * Weltall: tiefes Nachtblau, ein zarter Band wie eine Milchstraße, Sterne in
 * drei Schichten und wenige goldene Glitzersterne. Die Sterne wandern langsam
 * weiter – so ruhig wie der bisherige Schnee.
 */
export function adventWeltraum(c: C, t: number): void {
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0d1a36");
  bg.addColorStop(0.55, "#081126");
  bg.addColorStop(1, "#040814");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Milchstraße: ein zarter, warmer Band quer durch das Bild
  const neig = -0.62;
  const cn = Math.cos(neig);
  const sn = Math.sin(neig);
  for (let i = 0; i < 30; i++) {
    const u = (i / 29 - 0.5) * 1500;
    const breite = 54 - Math.abs(i - 14.5) * 2.2;
    c.save();
    c.translate(W / 2 + u * cn, H / 2 - 40 + u * sn);
    c.rotate(neig);
    c.fillStyle = i % 2 ? "rgba(196,210,248,.024)" : "rgba(255,238,218,.02)";
    c.beginPath();
    c.ellipse(0, 0, 60, breite, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  // Sterne in drei Schichten: ferne klein und zart, nahe größer und heller.
  const schichten = [
    { n: 120, r: 0.6, alpha: 0.42, tempo: 1.3 },
    { n: 52, r: 0.95, alpha: 0.62, tempo: 2.6 },
    { n: 20, r: 1.5, alpha: 0.85, tempo: 4.4 },
  ] as const;
  schichten.forEach((s, ebene) => {
    for (let i = 0; i < s.n; i++) {
      const x = (((rand(i * 7 + ebene * 977) * (W + 40) + t * s.tempo) % (W + 40)) + W + 40) % (W + 40) - 20;
      const y = rand(i * 13 + ebene * 523) * H;
      const funkeln = 0.78 + 0.22 * Math.sin(t * 1.1 + i * 1.7 + ebene);
      c.fillStyle = `rgba(236,242,255,${(s.alpha * funkeln).toFixed(3)})`;
      c.beginPath();
      c.arc(x, y, s.r, 0, TAU);
      c.fill();
    }
  });

  // Sternenstaub entlang der Milchstraße
  for (let i = 0; i < 70; i++) {
    const u = (rand(i * 3 + 41) - 0.5) * 1500;
    const v = (rand(i * 5 + 17) - 0.5) * (34 + 30 * rand(i + 9));
    c.fillStyle = `rgba(225,232,255,${(0.2 + rand(i + 61) * 0.35).toFixed(3)})`;
    c.beginPath();
    c.arc(W / 2 + u * cn - v * sn, H / 2 - 40 + u * sn + v * cn, 0.55, 0, TAU);
    c.fill();
  }

  // Wenige große, goldene Glitzersterne neben der Tafel und über ihr, ganz ruhig.
  const goldsterne: readonly (readonly [number, number, number])[] = [
    [58, 250, 5], [62, 430, 3.6], [899, 214, 4.6], [902, 462, 3.8], [196, 46, 3.8], [258, 70, 2.8], [716, 48, 3.8], [782, 70, 2.8],
  ];
  goldsterne.forEach(([x, y, r], i) => {
    const glanz = 0.62 + 0.3 * Math.sin(t * 0.9 + i * 1.9);
    funke(c, x, y, r * (0.9 + glanz * 0.1), `rgba(232,194,90,${glanz.toFixed(3)})`);
    kreis(c, x, y, 1, `rgba(255,246,214,${(glanz + 0.25).toFixed(3)})`);
  });
}

/* ----------------------------- Rahmenzier ------------------------------ */

/**
 * Geschnitzte goldene Ranken in den vier Rahmenecken und eingelassene Sterne
 * an den Seitenmitten: die Handwerkskante der Tafel, vom ersten Tag an da.
 * Der Schmuck außerhalb der Tafel kommt dafür erst mit den Türchen dazu.
 */
export function adventBrettZier(c: C, r: Rect, t: number): void {
  const o = kanten(r);
  const eckenListe: readonly (readonly [number, number, number, number])[] = [
    [o.x0, o.y0, 1, 1], [o.x1, o.y0, -1, 1], [o.x0, o.y1, 1, -1], [o.x1, o.y1, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of eckenListe) {
    c.save();
    c.translate(cx, cy);
    c.scale(sx, sy);
    c.lineCap = "round";
    c.lineJoin = "round";
    for (const [farbe, dx, dy, breite] of [[GOLD_TIEF, 0.7, 0.8, 1.9], [GOLD_HELL, 0, 0, 1.1]] as const) {
      c.strokeStyle = farbe;
      c.lineWidth = breite;
      // Ranke entlang der Oberkante und der Seitenkante, mit eingerollter Spitze
      c.beginPath();
      c.moveTo(5, 6);
      c.bezierCurveTo(14, 2, 22, 10, 27.5, 5.6);
      c.stroke();
      c.beginPath();
      c.moveTo(6, 5);
      c.bezierCurveTo(2, 14, 10, 22, 5.6, 27.5);
      c.stroke();
      c.beginPath();
      c.arc(29.6, 4.4, 1.9, Math.PI * 0.9, Math.PI * 2.6);
      c.stroke();
      c.beginPath();
      c.arc(4.4, 29.6, 1.9, Math.PI * 1.4, Math.PI * 3.1);
      c.stroke();
      // Blättchen an der Ranke
      c.fillStyle = farbe;
      for (const [lx, ly, dreh] of [[13.5, 8.6, 0.55], [21.5, 3.2, -0.55], [8.6, 13.5, -0.55], [3.2, 21.5, 0.55]] as const) {
        c.beginPath();
        c.ellipse(lx + dx * 0.3, ly + dy * 0.3, 3, 1.25, dreh, 0, TAU);
        c.fill();
      }
      // Perle in der Ecke
      c.beginPath();
      c.arc(5.4 + dx, 5.4 + dy, 1.9, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  // Eingelassene Sterne an den vier Seitenmitten; sie funkeln ganz ruhig.
  const glanz = 0.72 + 0.22 * Math.sin(t * 1.2);
  for (const [x, y] of [[o.mx, o.y0 + 4], [o.mx, o.y1 - 4], [o.x0 + 4, o.my], [o.x1 - 4, o.my]] as const) {
    funke(c, x, y, 3.6, `rgba(247,223,160,${glanz.toFixed(3)})`);
  }
}
