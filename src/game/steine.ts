/* =======================================================================
   TRAUM- UND WACHSTEIN

   Eine gemeinsame Bühnenposition für beide Hausansichten. Die Steine sind
   sichtbare, ausreichend große Ziele; kein verstecktes Pixelportal.
   ======================================================================= */

type C = CanvasRenderingContext2D;

export const STEIN: { x: number; y: number; hit: [number, number, number, number] } = {
  x: 278,
  y: 536,
  hit: [254, 506, 48, 58],
};

function poly(c: C, pts: [number, number][], color: string) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

/** Halb eingegrabener Stein; Traumstein kühl, Wachstein warm und klar. */
export function drawStein(c: C, kind: "traum" | "wach", t = 0) {
  const { x, y } = STEIN;
  const main = kind === "traum" ? "#4e5b88" : "#758b60";
  const edge = kind === "traum" ? "#a7b5ef" : "#e6d58a";
  const glow = kind === "traum" ? "rgba(153,181,255,.2)" : "rgba(255,224,139,.18)";
  const pulse = 0.76 + Math.sin(t * 1.7) * 0.08;

  c.save();
  const g = c.createRadialGradient(x, y - 12, 2, x, y - 12, 34);
  g.addColorStop(0, glow);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y - 12, 34, 0, Math.PI * 2);
  c.fill();
  // Erdreich vor dem unteren Rand macht den Stein sichtbar halb vergraben.
  poly(c, [[x - 18, y + 13], [x - 14, y - 11], [x - 5, y - 25], [x + 10, y - 23], [x + 19, y - 7], [x + 16, y + 13]], main);
  c.strokeStyle = edge;
  c.globalAlpha = pulse;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x - 14, y - 10);
  c.quadraticCurveTo(x - 4, y - 28, x + 10, y - 22);
  c.quadraticCurveTo(x + 19, y - 7, x + 16, y + 8);
  c.stroke();
  c.globalAlpha = 1;
  c.strokeStyle = "rgba(12,16,25,.45)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 4, y - 20);
  c.lineTo(x - 1, y + 8);
  c.moveTo(x + 10, y - 17);
  c.lineTo(x + 4, y + 10);
  c.stroke();
  // Traum: liegende Mondsichel. Wach: aufrechte kleine Sonne.
  c.fillStyle = edge;
  if (kind === "traum") {
    c.beginPath();
    c.arc(x - 2, y - 8, 5.5, 0.5, Math.PI * 1.6);
    c.arc(x + 1.5, y - 9.5, 4.8, Math.PI * 1.55, 0.45, true);
    c.fill();
  } else {
    c.beginPath();
    c.arc(x, y - 9, 4.2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = edge;
    c.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * 6.2, y - 9 + Math.sin(a) * 6.2);
      c.lineTo(x + Math.cos(a) * 8.8, y - 9 + Math.sin(a) * 8.8);
      c.stroke();
    }
  }
  c.restore();
}

export function trifftStein(x: number, y: number) {
  const [hx, hy, hw, hh] = STEIN.hit;
  return x >= hx && x <= hx + hw && y >= hy && y <= hy + hh;
}