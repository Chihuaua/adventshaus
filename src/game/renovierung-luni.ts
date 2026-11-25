import { fliesenArbeitsOrt, tapezierTakt, type C, type RenoWand } from "./renovierung";
import type { LuniState } from "./luni";

type Punkt = [number, number];
const klemm = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const sanft = (n: number) => { const k = klemm(n); return k * k * (3 - 2 * k); };

export interface RenoLuniPose {
  x: number;
  y: number;
  state: LuniState;
  phase: number;
  hand: Punkt;
  hand2: Punkt;
  werkzeug: "spachtel" | "papier" | "buerste" | "fliese" | "schwamm" | null;
}

/** Dieselbe Bahnphase steuert Papier, Koerper und Haende; die Fuesse stehen auf Boden oder Sprosse. */
export function renovierungsPose(w: RenoWand, p: number, t: number, fliesen = false): RenoLuniPose {
  if (fliesen) {
    const { a, tx, ty, x, y } = fliesenArbeitsOrt(w, p);
    const unten = ty > w.yBot - 24;
    const hand: Punkt = [klemm(tx, x - 15, x + 12), klemm(ty, y - 55, y - 14)];
    hand[1] += a.phase === "verfugen" ? Math.sin(t * 15) * 2.4 : Math.sin(t * 11) * 0.8;
    return {
      x, y, state: unten ? "bend" : "idle", phase: unten ? 0.4 : 0,
      hand, hand2: [x + 5, y - 29],
      werkzeug: a.phase === "verfugen" ? "schwamm" : "fliese",
    };
  }
  const a = tapezierTakt(w, p);
  const ruhe: Punkt = [a.x - 8, a.y - 23];
  const greifen = sanft((a.u - 0.2) / 0.06) * (1 - sanft((a.u - 0.79) / 0.03));
  const zug = sanft((a.u - 0.26) / 0.2);
  let hy = a.y - 50;
  let werkzeug: RenoLuniPose["werkzeug"] = null;
  if (a.u >= 0.26 && a.u < 0.46) { hy += zug * 15; werkzeug = "spachtel"; }
  else if (a.u >= 0.46 && a.u < 0.52) { hy += (1 - sanft((a.u - 0.46) / 0.06)) * 15; werkzeug = "papier"; }
  else if (a.u >= 0.52 && a.u < 0.73) { hy += a.auf * 10; werkzeug = "papier"; }
  else if (a.u >= 0.73 && a.u < 0.82) { hy += 10 + Math.sin((a.u - 0.73) / 0.09 * Math.PI) * 3; werkzeug = "buerste"; }
  const hx = a.x - 8 + (werkzeug === "buerste" ? Math.sin(t * 14) * 2 : 0);
  const gehen = a.i > 0 && a.u < 0.14;
  return {
    x: a.x, y: a.y,
    state: gehen ? "walk" : "idle", phase: 0,
    hand: [ruhe[0] + (hx - ruhe[0]) * greifen, ruhe[1] + (hy - ruhe[1]) * greifen],
    hand2: [a.x + 5 - 6 * greifen, a.y - 27 - 15 * greifen],
    werkzeug,
  };
}

/** Werkzeug sitzt an der tatsaechlich gezeichneten Hand, nicht an einer geschaetzten Weltposition. */
export function drawRenovierungsWerkzeug(c: C, art: RenoLuniPose["werkzeug"], hand: Punkt) {
  if (!art) return;
  const [x, y] = hand;
  c.save();
  c.translate(x, y);
  c.rotate(-0.18);
  if (art === "spachtel") {
    c.fillStyle = "#97714b"; c.fillRect(-1, -1, 2, 5);
    c.fillStyle = "#b8c4c6";
    c.beginPath(); c.moveTo(-1, -1); c.lineTo(-3, -6); c.lineTo(3, -6); c.lineTo(1, -1); c.closePath(); c.fill();
  } else if (art === "papier") {
    c.fillStyle = "#eee3cc";
    c.beginPath(); c.roundRect(-3.5, -2, 7, 4, 1.8); c.fill();
    c.strokeStyle = "#b6a283"; c.lineWidth = 0.65;
    c.beginPath(); c.ellipse(3, 0, 0.8, 1.6, 0, 0, Math.PI * 2); c.stroke();
  } else if (art === "buerste") {
    c.fillStyle = "#94673f"; c.fillRect(-3.8, -2.5, 7.6, 2.5);
    c.fillStyle = "#e0ceaa"; c.fillRect(-3.8, -4.5, 7.6, 2);
  } else if (art === "fliese") {
    c.fillStyle = "#ded5c2"; c.fillRect(-3.6, -4, 7.2, 7.2);
    c.fillStyle = "#69867e"; c.fillRect(-3, -4, 6.6, 6.6);
    c.fillStyle = "rgba(255,255,255,.3)"; c.fillRect(-2.4, -3.3, 5, 0.8);
  } else {
    c.fillStyle = "#b18c38"; c.fillRect(-4.5, -1, 9, 3);
    c.fillStyle = "#e8c86f";
    c.beginPath(); c.roundRect(-4.5, -3, 9, 4, 1.2); c.fill();
  }
  c.restore();
}