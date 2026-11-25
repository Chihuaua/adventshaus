type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const k = (v: number) => Math.max(0, Math.min(1, v));
/** Auspacken: Schleife löst sich, Deckel klappt auf, Kranz wird elastisch herausgezogen, Kiste rutscht vom Tisch. */
export function drawKranzPaket(c: C, x: number, boden: number, p: number, t: number) {
  const f = k(p);
  const s = 0.9;
  c.save();
  c.translate(x, boden);
  // Kiste auf dem Tisch
  const boxH = 12 * s;
  const kipp = k((f - 0.72) / 0.28);
  c.save();
  c.translate(kipp * 26, kipp * 34);
  c.rotate(kipp * 0.5);
  c.fillStyle = "#a87b44"; c.fillRect(-13 * s, -boxH, 26 * s, boxH);
  c.fillStyle = "#8a6030"; c.fillRect(-13 * s, -boxH, 26 * s, 2);
  c.fillStyle = "#e8c25a"; c.fillRect(-2, -boxH, 4, boxH);
  // Schleife: zieht sich auf und fällt nach unten weg
  const lose = k(f / 0.32);
  if (lose < 1) {
    c.strokeStyle = "#c9453a"; c.lineWidth = 1.8;
    const w = 8 * (1 - lose);
    c.beginPath(); c.ellipse(-3, -boxH - 2, w, 3.2, -0.5, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(3, -boxH - 2, w, 3.2, 0.5, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(-2, -boxH); c.lineTo(0, -boxH + 5); c.lineTo(2, -boxH); c.stroke();
  }
  // Deckel öffnet
  const offen = k((f - 0.28) / 0.26);
  c.save(); c.translate(-12 * s, -boxH); c.rotate(-offen * 1.35);
  c.fillStyle = "#b88a52"; c.fillRect(0, -2.4, 24 * s, 2.4);
  c.restore();
  // Kranz wird gummimäßig herausgezogen
  const raus = k((f - 0.4) / 0.34);
  if (raus > 0) {
    const zy = -boxH - 4 - raus * 16 + Math.sin(t * 5) * (1 - raus) * 1.5;
    const sx = 1 + (1 - raus) * 0.35;
    c.save(); c.translate(0, zy); c.scale(sx, 1);
    c.strokeStyle = "#2b5a3c"; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, 10, 4, 0, 0, TAU); c.stroke();
    c.strokeStyle = "#3f7f52"; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, -0.6, 10, 4, 0, 0, TAU); c.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      const cx = Math.cos(a) * 8, cy = Math.sin(a) * 3 - 8;
      c.fillStyle = "#f6ecd2"; c.fillRect(cx - 1, cy, 2, 7);
      if (i === 0 && f > 0.78) {
        c.fillStyle = "#ffcf6a"; c.beginPath();
        c.ellipse(cx, cy - 2.4 + Math.sin(t * 9) * 0.4, 1.4, 2.4, 0, 0, TAU); c.fill();
      }
    }
    c.fillStyle = "#c9453a"; for (let i = 0; i < 3; i++) c.fillRect(-7 + i * 5, 2 + (i % 2) * 2, 1.6, 1.6);
    c.restore();
  }
  c.restore();
  c.restore();
}

/** Fertiger Kranz auf dem Wohnzimmertisch: vier Kerzen, die erste brennt. */
export function drawKranzAufTisch(c: C, x: number, boden: number, t: number) {
  c.save(); c.translate(x, boden);
  c.strokeStyle = "#2b5a3c"; c.lineWidth = 4.2; c.beginPath(); c.ellipse(0, 0, 14, 5.2, 0, 0, TAU); c.stroke();
  c.strokeStyle = "#3f7f52"; c.lineWidth = 1.8; c.beginPath(); c.ellipse(0, -0.8, 14, 5.2, 0, 0, TAU); c.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    const cx = Math.cos(a) * 11, cy = Math.sin(a) * 3.6 - 10;
    c.fillStyle = "#f6ecd2"; c.fillRect(cx - 1.2, cy, 2.4, 9);
    c.fillStyle = "#d8c7a2"; c.fillRect(cx + 0.5, cy, 0.7, 9);
    if (i === 0) {
      const fl = 0.9 + Math.sin(t * 8) * 0.1;
      c.fillStyle = "#ffcf6a"; c.beginPath();
      c.moveTo(cx, cy - 6 * fl); c.quadraticCurveTo(cx + 2, cy - 3, cx, cy); c.quadraticCurveTo(cx - 2, cy - 3, cx, cy - 6 * fl); c.fill();
      c.fillStyle = "rgba(255,228,150,.35)"; c.beginPath(); c.arc(cx, cy - 4, 7, 0, TAU); c.fill();
    } else { c.fillStyle = "#b9a98a"; c.fillRect(cx - 1, cy - 1.6, 2, 1.6); }
  }
  c.fillStyle = "#c9453a"; for (let i = 0; i < 4; i++) c.fillRect(-9 + i * 5, 2 + (i % 2) * 2, 1.8, 1.8);
  c.restore();
}
