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
