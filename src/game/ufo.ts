/* =======================================================================
   UFO mit den Patch-Dateien der aktuellen Sitzung

   Dreieckiges UFO (Stealth-/TR-3B-Form) oben rechts in der Luft (innerhalb
   des sicheren Bereichs: rechts bis 858 von 960, oben ab 32 von 600).
   Reine Canvas-Primitive, kein DOM, kein Bild, kein Blinken.

   Klick aufs UFO öffnet das Menü mit der ZIP-Datei; eine Zeile meldet
   den Dateinamen nach außen (onUfo). Das Herunterladen passiert in der
   GUI-Schicht; das Haus weiß nichts von React und nichts vom Dateisystem.
   ======================================================================= */

type C = CanvasRenderingContext2D;
type Pt = [number, number];

/** Schwebeposition des Dreiecks-UFOs (Mitte) und seine Trefferfläche. */
export const UFO_MITTE: Pt = [794, 66];
export const UFO_BOX = { x: 736, y: 32, w: 122, h: 58 };

/** Menü unter dem UFO: jede Zeile mindestens 24 Einheiten hoch. */
export const UFO_MENUE = { x: 596, y: 100, w: 262, hoehe: 30 };

function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.lineTo(x + w - rad, y);
  c.quadraticCurveTo(x + w, y, x + w, y + rad);
  c.lineTo(x + w, y + h - rad);
  c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  c.lineTo(x + rad, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - rad);
  c.lineTo(x, y + rad);
  c.quadraticCurveTo(x, y, x + rad, y);
  c.closePath();
}

function poly(c: C, pts: readonly Pt[], fill: string) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function strich(c: C, x1: number, y1: number, x2: number, y2: number, col: string, w = 1) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

/** true, wenn der Punkt auf dem UFO liegt. */
export function ufoTreffer(x: number, y: number): boolean {
  return x >= UFO_BOX.x && x <= UFO_BOX.x + UFO_BOX.w && y >= UFO_BOX.y && y <= UFO_BOX.y + UFO_BOX.h;
}

/** Zeilennummer im offenen Menü (0-basiert) oder -1. */
export function ufoZeileBei(x: number, y: number, anzahl: number): number {
  if (x < UFO_MENUE.x || x > UFO_MENUE.x + UFO_MENUE.w) return -1;
  const i = Math.floor((y - UFO_MENUE.y) / UFO_MENUE.hoehe);
  return i >= 0 && i < anzahl ? i : -1;
}

/**
 * Detailreiches Dreiecks-UFO mit ruhigem rotem Licht und nur minimalem
 * Schwebe-/Hover-Effekt – bewusst ohne jedes Blinken.
 */
export function drawUfo(
  c: C,
  t: number,
  offen: boolean,
  zeile: number,
  dateien: readonly string[],
  hover = false,
) {
  // Minimaler Schwebe-Effekt: sehr ruhiges Gleiten, kein Hüpfen.
  const schweb = Math.sin(t * 1.0) * 0.9;
  const neig = Math.sin(t * 0.65) * 0.01;
  const [mx, my0] = UFO_MITTE;
  const my = my0 + schweb;

  c.save();
  // Ruhiger Lichtkegel, solange das Menü offen ist
  if (offen) {
    const g = c.createLinearGradient(mx, my + 6, mx, my + 118);
    g.addColorStop(0, "rgba(235,75,75,.20)");
    g.addColorStop(1, "rgba(235,75,75,0)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(mx - 12, my + 6);
    c.lineTo(mx + 12, my + 6);
    c.lineTo(mx + 58, my + 118);
    c.lineTo(mx - 58, my + 118);
    c.closePath();
    c.fill();
  }

  c.translate(mx, my);
  c.rotate(neig);

  // Unterseitiger Rumpfschatten (3D-Tiefe)
  poly(
    c,
    [
      [-4, -15],
      [4, -15],
      [47, 9],
      [41, 14.5],
      [0, 17],
      [-41, 14.5],
      [-47, 9],
    ],
    "#131b22",
  );

  // Haupt-Rumpf in klassischer abgeschrägter Dreiecksform
  poly(
    c,
    [
      [-3.5, -18.5],
      [3.5, -18.5],
      [46, 7.5],
      [40, 12.5],
      [0, 14],
      [-40, 12.5],
      [-46, 7.5],
    ],
    "#23303b",
  );

  // Abgesetzte mittlere Panzerplatte
  poly(
    c,
    [
      [-2.4, -13.5],
      [2.4, -13.5],
      [33, 6],
      [0, 10.5],
      [-33, 6],
    ],
    "#2e3f4d",
  );

  // Vordere Sensor-/Cockpit-Abdeckung
  poly(
    c,
    [
      [-1.8, -11.5],
      [1.8, -11.5],
      [10.5, -3],
      [0, -1],
      [-10.5, -3],
    ],
    "#3a4f60",
  );
  // Dezenter Glas-Glanz auf der Kanzel
  poly(
    c,
    [
      [-1.2, -10.5],
      [1.2, -10.5],
      [6, -5],
      [0, -4],
      [-6, -5],
    ],
    "rgba(180,220,238,.22)",
  );

  // Segmentfugen / Plattenlinien (von den Ecken zur Mitte)
  strich(c, 0, -18, 0, -11.5, "rgba(12,18,24,.65)", 0.9);
  strich(c, -40, 8.5, -12, 2.5, "rgba(12,18,24,.6)", 0.8);
  strich(c, 40, 8.5, 12, 2.5, "rgba(12,18,24,.6)", 0.8);
  strich(c, -21, 12.8, 21, 12.8, "rgba(12,18,24,.55)", 0.8);

  // Lüftungsschlitze / Rippen an beiden Flügeln
  for (const sgn of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const rx = sgn * (15 + i * 3.8);
      strich(c, rx, 3.5 + i * 0.6, rx + sgn * 2.2, 6.2 + i * 0.5, "#151e26", 1.1);
    }
  }

  // Minimaler Hover-Effekt: feiner Kantenreflex ohne Blinken
  c.strokeStyle = hover ? "rgba(255,140,130,.38)" : "rgba(190,222,236,.18)";
  c.lineWidth = hover ? 1.2 : 0.9;
  c.beginPath();
  c.moveTo(-45, 7.5);
  c.lineTo(-3.5, -18.5);
  c.lineTo(3.5, -18.5);
  c.lineTo(45, 7.5);
  c.stroke();

  // Ruhiges rotes Kernlicht (konstant, kein Blinken)
  const kernR = hover || offen ? 15 : 12;
  const gKern = c.createRadialGradient(0, 3.5, 0.8, 0, 3.5, kernR);
  gKern.addColorStop(0, hover || offen ? "rgba(255,60,55,.42)" : "rgba(255,50,45,.28)");
  gKern.addColorStop(1, "rgba(255,40,40,0)");
  c.fillStyle = gKern;
  c.beginPath();
  c.arc(0, 3.5, kernR, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "#12181f";
  c.beginPath();
  c.arc(0, 3.5, 4.9, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = hover || offen ? "#ff4038" : "#d92b28";
  c.beginPath();
  c.arc(0, 3.5, 3.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ff9a92";
  c.beginPath();
  c.arc(-0.8, 2.7, 1.3, 0, Math.PI * 2);
  c.fill();

  // Drei konstante rote Positionslichter an den Dreiecksspitzen (kein Blinken)
  for (const [lx, ly] of [
    [0, -15.6],
    [-41, 8.8],
    [41, 8.8],
  ] as const) {
    c.fillStyle = "#11171e";
    c.beginPath();
    c.arc(lx, ly, 2.7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = hover || offen ? "#ff463e" : "#e22e2a";
    c.beginPath();
    c.arc(lx, ly, 1.9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ffb0aa";
    c.beginPath();
    c.arc(lx - 0.5, ly - 0.5, 0.65, 0, Math.PI * 2);
    c.fill();
  }

  c.restore();

  if (!offen) return;
  drawPatchMenue(c, zeile, dateien);
}

function drawPatchMenue(c: C, zeile: number, dateien: readonly string[]) {
  // Menü: Archiv der Sitzung
  const { x, y, w, hoehe } = UFO_MENUE;
  const h = hoehe * dateien.length;
  c.save();
  rr(c, x, y, w, h, 5);
  c.fillStyle = "rgba(8,20,26,.88)";
  c.fill();
  c.strokeStyle = "rgba(140,220,205,.35)";
  c.lineWidth = 1;
  rr(c, x + 0.5, y + 0.5, w - 1, h - 1, 5);
  c.stroke();

  c.font = '11px "Space Grotesk", sans-serif';
  c.textBaseline = "middle";
  dateien.forEach((name, i) => {
    const zy = y + i * hoehe;
    if (i === zeile) {
      rr(c, x + 2, zy + 2, w - 4, hoehe - 4, 3);
      c.fillStyle = "rgba(53,214,192,.22)";
      c.fill();
    }
    c.fillStyle = i === zeile ? "#8ff2dc" : "#eef7f2";
    c.fillText(name, x + 10, zy + hoehe / 2 + 0.5);
    // Pfeil rechts
    c.strokeStyle = c.fillStyle as string;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(x + w - 18, zy + hoehe / 2);
    c.lineTo(x + w - 11, zy + hoehe / 2);
    c.moveTo(x + w - 14, zy + hoehe / 2 - 3.2);
    c.lineTo(x + w - 11, zy + hoehe / 2);
    c.lineTo(x + w - 14, zy + hoehe / 2 + 3.2);
    c.stroke();
  });
  c.textBaseline = "alphabetic";
  c.restore();
}

/** Einzelnes Rentier im Flug nach links (lokal um [rx, ry]). */
function drawRentier(
  c: C,
  rx: number,
  ry: number,
  t: number,
  phase: number,
  fell: string,
  bauch: string,
  leitTier: boolean,
) {
  const lauf = Math.sin(t * 2.6 + phase);
  c.save();
  c.translate(rx, ry);

  // Hintere Läufe (etwas dunkler)
  const dunkel = "#4b2e1b";
  strich(c, -5, 2.5, -9 - lauf * 2.2, 8.5, dunkel, 1.5);
  strich(c, -9 - lauf * 2.2, 8.5, -11.5 - lauf * 2.8, 7.2, dunkel, 1.3);
  strich(c, 5.5, 2.5, 9 + lauf * 2.2, 8.2, dunkel, 1.5);
  strich(c, 9 + lauf * 2.2, 8.2, 11.8 + lauf * 2.5, 9.4, dunkel, 1.3);

  // Rumpf & Brust
  c.fillStyle = fell;
  c.beginPath();
  c.ellipse(0, 0.5, 8.8, 4.3, -0.06, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = bauch;
  c.beginPath();
  c.ellipse(-2.5, 2.1, 5.6, 1.9, -0.05, 0, Math.PI * 2);
  c.fill();

  // Kleines helles Schwänzchen rechts
  poly(c, [[7.8, -1.2], [11.2, -2.8], [9.6, 0.8]], "#e9decb");

  // Hals & Kopf (nach links blickend)
  poly(c, [[-5.6, -1.2], [-9.6, -8.4], [-6.2, -9.2], [-2.6, -1.6]], fell);
  c.fillStyle = fell;
  c.beginPath();
  c.ellipse(-10.2, -8.8, 4.4, 2.6, 0.22, 0, Math.PI * 2);
  c.fill();

  // Ohr
  poly(c, [[-7.2, -10.4], [-5.2, -13.2], [-5.8, -9.8]], fell);

  // Geweih (verzweigtes helles Geweih)
  strich(c, -8.4, -10.8, -7.2, -16.8, "#dec79c", 1.25);
  strich(c, -7.7, -14.2, -10.2, -16.2, "#dec79c", 1.05);
  strich(c, -7.4, -15.4, -5.0, -17.0, "#dec79c", 1.05);
  strich(c, -9.6, -10.6, -9.2, -15.2, "#cfb487", 1.05);

  // Auge
  c.fillStyle = "#181210";
  c.beginPath();
  c.arc(-10.6, -9.3, 0.75, 0, Math.PI * 2);
  c.fill();

  // Nase (Leit-Rentier mit ruhiger roter Leuchtnase, sonst dunkel)
  if (leitTier) {
    const gn = c.createRadialGradient(-14.3, -8.0, 0.3, -14.3, -8.0, 4.2);
    gn.addColorStop(0, "rgba(255,70,60,.45)");
    gn.addColorStop(1, "rgba(255,70,60,0)");
    c.fillStyle = gn;
    c.beginPath();
    c.arc(-14.3, -8.0, 4.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ef342c";
    c.beginPath();
    c.arc(-14.3, -8.0, 1.45, 0, Math.PI * 2);
    c.fill();
  } else {
    c.fillStyle = "#2b1b14";
    c.beginPath();
    c.arc(-14.2, -8.0, 1.0, 0, Math.PI * 2);
    c.fill();
  }

  // Vordere Läufe im ruhigen Galopp-Schwung
  strich(c, -6.2, 2.6, -11.2 + lauf * 2.4, 7.8, fell, 1.6);
  strich(c, -11.2 + lauf * 2.4, 7.8, -13.6 + lauf * 2.6, 6.4, fell, 1.35);
  strich(c, 5.2, 2.6, 8.8 - lauf * 2.4, 8.6, fell, 1.6);
  strich(c, 8.8 - lauf * 2.4, 8.6, 11.2 - lauf * 2.2, 9.6, fell, 1.35);

  // Rotes Brustgeschirr mit goldenem Glöckchen
  strich(c, -7.6, -5.8, -4.2, 1.6, "#c92a32", 1.5);
  c.fillStyle = "#f2cf68";
  c.beginPath();
  c.arc(-6.3, -1.6, 1.25, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

/**
 * Weihnachtsmann mit Schlitten und Rentieren am Himmel (Ersatz fürs UFO im
 * Weihnachtshaus – identische Trefferfläche, identische Menü-Funktion).
 */
export function drawWeihnachtsschlitten(
  c: C,
  t: number,
  offen: boolean,
  zeile: number,
  dateien: readonly string[],
  hover = false,
) {
  const schweb = Math.sin(t * 1.05) * 1.1;
  const neig = Math.sin(t * 0.65) * 0.012;
  const [mx, my0] = UFO_MITTE;
  const my = my0 + schweb;

  c.save();
  // Warmer goldener Lichtschein nach unten, solange das Menü offen ist
  if (offen) {
    const g = c.createLinearGradient(mx, my + 8, mx, my + 118);
    g.addColorStop(0, "rgba(245,211,108,.22)");
    g.addColorStop(1, "rgba(245,211,108,0)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(mx - 16, my + 8);
    c.lineTo(mx + 16, my + 8);
    c.lineTo(mx + 60, my + 118);
    c.lineTo(mx - 60, my + 118);
    c.closePath();
    c.fill();
  }

  c.translate(mx, my);
  c.rotate(neig);

  // Dezenter Sternenglanz hinter dem Schlitten (und stärker bei Hover)
  const glanz = c.createRadialGradient(16, 0, 2, 16, 0, hover || offen ? 38 : 28);
  glanz.addColorStop(0, hover || offen ? "rgba(255,222,130,.26)" : "rgba(255,214,120,.14)");
  glanz.addColorStop(1, "rgba(255,214,120,0)");
  c.fillStyle = glanz;
  c.beginPath();
  c.arc(16, 0, hover || offen ? 38 : 28, 0, Math.PI * 2);
  c.fill();

  // Zwei Rentiere im Gespann (links vor dem Schlitten)
  drawRentier(c, -15, -2.5, t, 1.3, "#6e462a", "#9c704d", false);
  drawRentier(c, -39, 0.5, t, 0, "#8d5b37", "#bd8f67", true);

  // Geschwungene goldene Kufen des Schlittens
  c.strokeStyle = hover || offen ? "#ffe082" : "#dfb655";
  c.lineWidth = 1.8;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(52, 12.5);
  c.lineTo(6, 12.5);
  c.quadraticCurveTo(-1.2, 12.5, -0.8, 6.2);
  c.quadraticCurveTo(-0.4, 2.2, 4.5, 2.4);
  c.stroke();
  // Stützen zwischen Kufe und Schlittenwanne
  strich(c, 12, 12.5, 13, 7.5, "#c79d3e", 1.5);
  strich(c, 28, 12.5, 28, 7.5, "#c79d3e", 1.5);
  strich(c, 43, 12.5, 42, 7.5, "#c79d3e", 1.5);

  // Geschenkesack & Päckchen hinten im Schlitten
  c.fillStyle = "#8f6339";
  c.beginPath();
  c.ellipse(39, -5.5, 8.2, 7.6, 0.2, 0, Math.PI * 2);
  c.fill();
  poly(c, [[35, -12], [39, -15.5], [43, -12.2]], "#a87749");
  strich(c, 36, -11.8, 41.8, -11.8, "#d9383a", 1.3);
  // Grünes Geschenk mit Goldband schaut aus dem Sack
  c.save();
  c.translate(31.5, -10.5);
  c.rotate(-0.14);
  rr(c, -3.5, -3.5, 7, 7, 1);
  c.fillStyle = "#2b7a45";
  c.fill();
  strich(c, 0, -3.3, 0, 3.3, "#f5d36c", 1.2);
  strich(c, -3.3, 0, 3.3, 0, "#f5d36c", 1.2);
  c.restore();

  // Weihnachtsmann im Schlitten (Oberkörper, Bart, Gesicht, Mütze)
  // Roter Mantel
  c.fillStyle = "#c9262e";
  c.beginPath();
  c.ellipse(20.5, -4.5, 6.8, 6.5, 0.08, 0, Math.PI * 2);
  c.fill();
  // Weißer Pelzkragen / Mantelleiste
  strich(c, 15.2, -8.2, 16.5, 0.5, "#f4f7fa", 2.1);
  // Gürtel
  strich(c, 14.5, -2.5, 25.5, -2.2, "#1f1c1d", 1.6);
  c.fillStyle = "#f2cf68";
  c.fillRect(16.2, -3.5, 2.2, 2.2);

  // Kopf & rosige Wange
  c.fillStyle = "#f4c9a0";
  c.beginPath();
  c.arc(19.5, -12.2, 3.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#1d1a1e";
  c.beginPath();
  c.arc(17.8, -12.7, 0.65, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(235,105,95,.45)";
  c.beginPath();
  c.arc(18.2, -11.3, 1.0, 0, Math.PI * 2);
  c.fill();

  // Weißer Vollbart
  c.fillStyle = "#f6f8fb";
  c.beginPath();
  c.moveTo(16.2, -11.2);
  c.quadraticCurveTo(13.8, -8.2, 16.4, -5.6);
  c.quadraticCurveTo(19.5, -4.8, 21.8, -7.8);
  c.quadraticCurveTo(21.5, -10.8, 19.2, -11.2);
  c.closePath();
  c.fill();

  // Rote Zipfelmütze mit weißem Pelzrand und Bommel
  poly(c, [[16.2, -14.4], [23.2, -13.8], [26.8, -16.8], [21.2, -17.8]], "#d42b33");
  strich(c, 15.8, -14.2, 23.2, -13.6, "#f6f8fb", 2.2);
  c.fillStyle = "#f6f8fb";
  c.beginPath();
  c.arc(27.2, -16.6, 1.65, 0, Math.PI * 2);
  c.fill();

  // Schlittenkorpus (tiefrot mit geschwungener Lehne und Goldleiste)
  poly(
    c,
    [
      [4, 2.2],
      [8.5, -3.5],
      [14, -1.8],
      [34, -2.2],
      [43, -8.5],
      [48.5, -6.5],
      [45.5, 8.2],
      [7, 8.2],
    ],
    "#ab1f27",
  );
  poly(
    c,
    [
      [6.5, 2.6],
      [9.5, -1.8],
      [14.5, -0.5],
      [35, -0.8],
      [43.2, -6.2],
      [45.6, -5.0],
      [43.5, 6.8],
      [8, 6.8],
    ],
    "#c92a32",
  );
  // Goldene Zierkante am Schlittenrand
  c.strokeStyle = "#f2cf68";
  c.lineWidth = 1.25;
  c.beginPath();
  c.moveTo(4.5, 2.2);
  c.lineTo(8.5, -3.4);
  c.lineTo(14, -1.8);
  c.lineTo(34, -2.2);
  c.lineTo(43, -8.4);
  c.lineTo(48.2, -6.5);
  c.stroke();

  // Arm & Handschuh des Weihnachtsmanns + goldene Zügel zu den Rentieren
  strich(c, 18.5, -7.2, 12.2, -5.4, "#c9262e", 2.4);
  c.fillStyle = "#3a261a";
  c.beginPath();
  c.arc(11.4, -5.3, 1.4, 0, Math.PI * 2);
  c.fill();

  c.strokeStyle = hover || offen ? "#ffe28a" : "rgba(242,207,104,.85)";
  c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(11.2, -5.2);
  c.quadraticCurveTo(-4, -1.5, -21, -5.2);
  c.moveTo(11.2, -5.2);
  c.quadraticCurveTo(-14, 0.5, -45, -3.5);
  c.stroke();

  // Drei ruhige goldene Sternfunken hinter dem Schlitten (konstant, kein Blinken)
  for (const [sx, sy, sr] of [
    [53, -3, 1.3],
    [57, 3, 1.0],
    [51, 5.5, 0.9],
  ] as const) {
    c.fillStyle = hover || offen ? "#ffe89e" : "#f2cf68";
    c.beginPath();
    c.arc(sx, sy, sr, 0, Math.PI * 2);
    c.fill();
  }

  c.restore();

  if (!offen) return;
  drawPatchMenue(c, zeile, dateien);
}
