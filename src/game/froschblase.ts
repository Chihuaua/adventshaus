/* =======================================================================
   GESANGS-DENKBLASE („Frosch im Teich“)
   Entsteht über Lunis Kopf, während sie am Mikrofon ihr Lied singt:
   1. Zuerst wächst eine kleine Blase schräg über ihrem Kopf aus dem Nichts.
   2. Nacheinander folgen zwei weitere Bläschen, jeweils etwas größer.
   3. Danach wächst die eigentliche Comic-Denkblase heran: darin sitzt ein
      Frosch auf einem Seerosenblatt in einem ruhigen Teich.
   4. Kurz vor Liedende lösen sich Wolke und Bläschen langsam auf, sodass
      zum Ende des Liedes alles wieder vollständig verschwunden ist.

   Reines Canvas 2D ohne externe Assets (KI-START Grundsatz 4).
   ======================================================================= */

export type C = CanvasRenderingContext2D;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const glatt = (v: number) => {
  const x = clamp(v, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Weiche Aufwachs-Kurve mit dezentem Comic-Federn beim Entstehen aus dem Nichts. */
function wuchsKurve(p: number): number {
  const x = clamp(p, 0, 1);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Sanftes Anwachsen bis leicht über 1 (1.06) bei ~0.78, dann weiches Einrasten auf 1.0
  const basis = glatt(x / 0.82);
  const feder = x > 0.65 ? Math.sin(((x - 0.65) / 0.35) * Math.PI) * 0.06 : 0;
  return Math.min(1.06, basis + feder);
}

export interface BlasenStufen {
  /** 3 Vorbläschen (0 = unsichtbar, ~1 = volle Größe) */
  b1: number;
  b2: number;
  b3: number;
  /** Haupt-Denkblase (0 = unsichtbar, ~1 = volle Größe) */
  wolke: number;
  /** Deckkraft für sanftes Auflösen kurz vor Liedende (0..1) */
  deckkraft: number;
}

/**
 * Berechnet Wachstums- und Auflösungsfaktor jeder Stufe für Liedzeit `songT`
 * bei Gesamtdauer `dauer` (Standard ~30.85 s).
 */
export function froschBlasenStufen(songT: number, dauer: number): BlasenStufen {
  if (songT <= 0 || songT >= dauer || dauer <= 4) {
    return { b1: 0, b2: 0, b3: 0, wolke: 0, deckkraft: 0 };
  }

  // Entstehen nacheinander:
  // Blase 1: 0.25 .. 0.85 s
  // Blase 2: 0.80 .. 1.45 s
  // Blase 3: 1.38 .. 2.08 s
  // Hauptblase: 1.98 .. 2.95 s
  const w1 = wuchsKurve((songT - 0.25) / 0.6);
  const w2 = wuchsKurve((songT - 0.8) / 0.65);
  const w3 = wuchsKurve((songT - 1.38) / 0.7);
  const wWolke = wuchsKurve((songT - 1.98) / 0.97);

  // Kurz vor Ende (die letzten 3.6 s bis genau `dauer`) langsam auflösen:
  // Die kleinen Bläschen verwehen leicht versetzt bis zum Schluss auf 0.
  const rest = dauer - songT;
  const aufloesenStart = 3.6;
  if (rest >= aufloesenStart) {
    return { b1: w1, b2: w2, b3: w3, wolke: wWolke, deckkraft: 1 };
  }

  const a1 = glatt(clamp((rest - 0.9) / 2.2, 0, 1));
  const a2 = glatt(clamp((rest - 0.6) / 2.3, 0, 1));
  const a3 = glatt(clamp((rest - 0.35) / 2.45, 0, 1));
  const aW = glatt(clamp(rest / 3.2, 0, 1));

  return {
    b1: w1 * (0.35 + 0.65 * a1) * (a1 > 0.01 ? 1 : 0),
    b2: w2 * (0.35 + 0.65 * a2) * (a2 > 0.01 ? 1 : 0),
    b3: w3 * (0.35 + 0.65 * a3) * (a3 > 0.01 ? 1 : 0),
    wolke: wWolke * (0.45 + 0.55 * aW) * (aW > 0.01 ? 1 : 0),
    deckkraft: aW,
  };
}

function kreis(c: C, x: number, y: number, r: number, farbe: string) {
  if (r <= 0.05) return;
  c.fillStyle = farbe;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

/** Wolkiger Umriss der Haupt-Denkblase aus überlappenden Comic-Bögen (Zentrum 0,0). */
const WOLKEN_KREISE: readonly (readonly [number, number, number])[] = [
  [-17, 2, 10.5],
  [-11, -7.5, 11.5],
  [1, -9.5, 12.5],
  [13, -7, 11],
  [18, 2.5, 10],
  [11, 9.5, 9.5],
  [-1, 10.5, 10.5],
  [-12, 9, 9.5],
  [0, 0, 14],
];

function wolkenPfad(c: C, zugabe = 0) {
  for (const [wx, wy, wr] of WOLKEN_KREISE) {
    c.beginPath();
    c.arc(wx, wy, wr + zugabe, 0, Math.PI * 2);
    c.fill();
  }
}

/**
 * Zeichnet die Comic-Denkblase über Lunis Kopfscheitel (`kopfX`, `kopfScheitelY`).
 * `richtung`: -1 = schräg nach links-oben (Standard am Mikrofon, damit rechts Platz bleibt),
 * +1 = schräg nach rechts-oben.
 */
export function drawFroschDenkblase(
  c: C,
  kopfX: number,
  kopfScheitelY: number,
  songT: number,
  dauer: number,
  t: number,
  richtung: 1 | -1 = -1,
): void {
  const st = froschBlasenStufen(songT, dauer);
  if (st.b1 <= 0.01 && st.b2 <= 0.01 && st.b3 <= 0.01 && st.wolke <= 0.01) return;

  const RAND = "#2b3a44";
  const PAPIER = "#faf8f0";
  const schwebe = Math.sin(t * 1.8) * 0.7;

  // Drei aufsteigende Vorbläschen schräg über dem Kopf (wachsen nacheinander größer werdend)
  const vorblasen: readonly [number, number, number, number][] = [
    [kopfX + richtung * 7.5, kopfScheitelY - 5.5 + schwebe * 0.25, 1.75, st.b1],
    [kopfX + richtung * 13.5, kopfScheitelY - 12.0 + schwebe * 0.45, 2.55, st.b2],
    [kopfX + richtung * 20.5, kopfScheitelY - 19.8 + schwebe * 0.7, 3.55, st.b3],
  ];

  c.save();

  for (let i = 0; i < vorblasen.length; i++) {
    const [bx, by, br, faktor] = vorblasen[i];
    if (faktor <= 0.02) continue;
    // Während der Schluss-Auflösung verblassen die kleinen Bläschen weich mit
    const alpha = Math.min(1, st.deckkraft * (1.15 - i * 0.08) * Math.min(1, faktor * 1.4));
    if (alpha <= 0.02) continue;
    c.globalAlpha = alpha;
    const r = br * faktor;
    kreis(c, bx, by + 0.6, r + 1.1, "rgba(15, 28, 36, 0.18)");
    kreis(c, bx, by, r + 1.15, RAND);
    kreis(c, bx, by, r, PAPIER);
  }

  // Eigentliche Comic-Denkblase mit Teich, Seerosenblatt & Frosch
  if (st.wolke > 0.02 && st.deckkraft > 0.01) {
    const cx = kopfX + richtung * 34;
    const cy = kopfScheitelY - 40.5 + schwebe;
    c.globalAlpha = clamp(st.deckkraft * Math.min(1, st.wolke * 1.35), 0, 1);

    c.save();
    c.translate(cx, cy);
    c.scale(st.wolke, st.wolke);

    // Sanfter Schlagschatten, Comic-Kontur und cremige Wolkenfüllung
    c.save();
    c.translate(0, 1.4);
    c.fillStyle = "rgba(14, 26, 34, 0.22)";
    wolkenPfad(c, 1.3);
    c.restore();

    c.fillStyle = RAND;
    wolkenPfad(c, 1.35);
    c.fillStyle = PAPIER;
    wolkenPfad(c, 0);

    // Innenbild auf einen weichen Wolken-Ausschnitt begrenzen
    c.save();
    c.beginPath();
    c.ellipse(0, 0.5, 24.5, 16.2, 0, 0, Math.PI * 2);
    c.clip();

    // Kleiner Himmelsschimmer oben in der Blase
    const himmel = c.createLinearGradient(0, -16, 0, 2);
    himmel.addColorStop(0, "#d8eef7");
    himmel.addColorStop(1, "#eef7fa");
    c.fillStyle = himmel;
    c.fillRect(-26, -18, 52, 20);

    // Ruhiger blauer Teich im unteren Teil der Blase
    const teich = c.createLinearGradient(0, -1, 0, 17);
    teich.addColorStop(0, "#5ca9cb");
    teich.addColorStop(0.55, "#3f8ab0");
    teich.addColorStop(1, "#2c6d91");
    c.fillStyle = teich;
    c.beginPath();
    c.ellipse(0, 8.2, 26, 10.5, 0, 0, Math.PI * 2);
    c.fill();

    // Zwei Schilfhalme im Hintergrund links
    c.strokeStyle = "#4d7c4a";
    c.lineWidth = 0.9;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-15.5, 6);
    c.quadraticCurveTo(-16.5, -1, -14.8, -6.5);
    c.moveTo(-13, 6.5);
    c.quadraticCurveTo(-13.2, 0.5, -11.8, -4.5);
    c.stroke();
    c.fillStyle = "#6e472b";
    c.beginPath();
    c.ellipse(-15.1, -4.5, 0.85, 2.1, 0.12, 0, Math.PI * 2);
    c.fill();

    // Zarte konzentrische Wasserwellen um das Seerosenblatt
    const welle = (t * 0.65) % 1;
    c.strokeStyle = `rgba(225, 246, 255, ${(0.55 * (1 - welle)).toFixed(3)})`;
    c.lineWidth = 0.7;
    c.beginPath();
    c.ellipse(1, 7.2, 11.5 + welle * 5.5, 3.3 + welle * 1.6, 0, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = "rgba(225, 246, 255, 0.38)";
    c.beginPath();
    c.moveTo(-16, 10.5);
    c.lineTo(-9, 10.5);
    c.moveTo(9.5, 11.4);
    c.lineTo(15.5, 11.4);
    c.stroke();

    // Seerosenblatt mit charakteristischem Kerb-Ausschnitt rechts vorn
    const blattWipp = Math.sin(t * 2.1) * 0.35;
    const byBlatt = 6.8 + blattWipp;
    c.fillStyle = "#2b6b3f";
    c.beginPath();
    c.ellipse(1, byBlatt + 0.7, 11.2, 3.6, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#4ea058";
    c.beginPath();
    c.moveTo(1, byBlatt);
    c.ellipse(1, byBlatt, 11.0, 3.4, 0, 0.28, Math.PI * 2 - 0.12);
    c.closePath();
    c.fill();

    // Helle Blattadern auf dem Seerosenblatt
    c.strokeStyle = "rgba(158, 219, 145, 0.55)";
    c.lineWidth = 0.55;
    for (const wkl of [0.9, 1.9, 2.9, 4.1, 5.2]) {
      c.beginPath();
      c.moveTo(1, byBlatt);
      c.lineTo(1 + Math.cos(wkl) * 8.5, byBlatt + Math.sin(wkl) * 2.5);
      c.stroke();
    }

    // Kleine Seerosenblüte links am Blattrand
    c.fillStyle = "#f5b8cb";
    for (const dx of [-1.4, 0, 1.4]) {
      c.beginPath();
      c.ellipse(-8.6 + dx * 0.7, byBlatt - 0.9, 0.95, 1.6, dx * 0.28, 0, Math.PI * 2);
      c.fill();
    }
    kreis(c, -8.6, byBlatt - 0.7, 0.65, "#f7d969");

    // ---- Sitzender Frosch auf dem Seerosenblatt ----
    const fy = byBlatt - 0.4;
    // Hinterbeine (angewinkelt links und rechts)
    c.fillStyle = "#3f8d47";
    c.beginPath();
    c.ellipse(-3.6, fy - 0.8, 2.4, 1.5, -0.35, 0, Math.PI * 2);
    c.ellipse(5.2, fy - 0.8, 2.4, 1.5, 0.35, 0, Math.PI * 2);
    c.fill();

    // Runder Froschkörper + heller Bauch
    c.fillStyle = "#56b357";
    c.beginPath();
    c.ellipse(0.8, fy - 2.9, 4.5, 3.7, 0, 0, Math.PI * 2);
    c.fill();

    // Sanft atmende/quakende helle Kehle im Takt
    const kehle = 1 + Math.max(0, Math.sin(t * 5.2)) * 0.28;
    c.fillStyle = "#d9edb2";
    c.beginPath();
    c.ellipse(0.8, fy - 1.9, 2.9 * kehle, 2.2 * kehle, 0, 0, Math.PI * 2);
    c.fill();

    // Froschkopf mit zwei großen hervorspringenden Kulleraugen
    c.fillStyle = "#56b357";
    c.beginPath();
    c.ellipse(0.8, fy - 5.6, 4.7, 2.9, 0, 0, Math.PI * 2);
    c.fill();

    const blinzeln = (t + 1.3) % 4.6 < 0.14;
    for (const ex of [-1.9, 3.5]) {
      kreis(c, ex, fy - 8.1, 2.05, "#56b357");
      if (blinzeln) {
        c.strokeStyle = "#1d2c22";
        c.lineWidth = 0.75;
        c.beginPath();
        c.moveTo(ex - 1.2, fy - 8.1);
        c.lineTo(ex + 1.2, fy - 8.1);
        c.stroke();
      } else {
        kreis(c, ex, fy - 8.1, 1.45, "#ffffff");
        kreis(c, ex + 0.25, fy - 8.1, 0.78, "#18241d");
        kreis(c, ex + 0.5, fy - 8.45, 0.28, "#ffffff");
      }
    }

    // Rosa Bäckchen & zufriedenes Frosch-Lächeln
    c.fillStyle = "rgba(235, 132, 138, 0.55)";
    c.beginPath();
    c.ellipse(-2.5, fy - 5.1, 0.95, 0.55, 0, 0, Math.PI * 2);
    c.ellipse(4.1, fy - 5.1, 0.95, 0.55, 0, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "#234a28";
    c.lineWidth = 0.75;
    c.beginPath();
    c.arc(0.8, fy - 5.6, 2.3, Math.PI * 0.16, Math.PI * 0.84);
    c.stroke();

    // Kleine Vorderfüßchen vorn auf dem Blatt
    kreis(c, -1.4, fy + 0.3, 0.85, "#4ca34e");
    kreis(c, 3.0, fy + 0.3, 0.85, "#4ca34e");

    c.restore(); // Ende Innen-Clip

    // Saubere dünne Innenkontur des Wolkenrands nachziehen, damit der Clip nicht übermalt
    c.strokeStyle = "rgba(43, 58, 68, 0.22)";
    c.lineWidth = 0.65;
    c.beginPath();
    c.ellipse(0, 0.5, 24.5, 16.2, 0, 0, Math.PI * 2);
    c.stroke();

    c.restore();
  }

  c.restore();
}
