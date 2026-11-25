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
  werkzeug: "spachtel" | "papier" | "buerste" | "fliese" | "schwamm" | "feger" | null;
}

/** Dieselbe Bahnphase steuert Papier, Körper und Hände; die Füße stehen auf Boden oder Sprosse. */
export function renovierungsPose(w: RenoWand, p: number, t: number, fliesen = false): RenoLuniPose {
  // Badezimmer-Routine bleibt vollständig unverändert.
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

  // Durchgang 1: Bahnen grob von oben nach unten abkratzen, Luni steigt mit der Tapete nach unten
  if (a.phase === "abziehen") {
    const roh = a.klettern < 0.995;
    const handY = Math.min(a.kante + 1 + Math.sin(t * 9) * 1.2, a.y - 12);
    return {
      x: a.x, y: a.y,
      state: roh ? "walk" : a.ab < 1 ? "reachUp" : "idle",
      phase: 0,
      hand: [klemm(a.mitte + 3, a.x - 15, a.x + 16), klemm(handY, a.y - 52, a.y - 10)],
      hand2: [a.x + 5, a.y - 27],
      werkzeug: !roh && a.ab < 1 ? "spachtel" : null,
    };
  }

  // Durchgang 2: Mit der Leiter zu den verbliebenen Resten gehen und auf der jeweiligen Höhe abkratzen
  if (a.phase === "reste") {
    if (a.schritt === "bewegen") {
      // Leiter bewegen: Hände fassen seitlich an den Leiterholm
      return {
        x: a.x, y: a.y, state: "walk", phase: 0,
        hand: [a.x - 4, a.y - 29],
        hand2: [a.x + 4, a.y - 25],
        werkzeug: null,
      };
    }
    if (a.schritt === "hoch" || a.schritt === "runter") {
      const wink = Math.sin(t * 11) * 2.6;
      return {
        x: a.x, y: a.y, state: "walk", phase: 0,
        hand: [a.x - 4, a.y - 39 + wink],
        hand2: [a.x + 4, a.y - 36 - wink],
        werkzeug: null,
      };
    }
    // Auf der Höhe des Rests mit dem Spachtel abkratzen
    const hochGreifen = a.kante < a.y - 34;
    const schabX = Math.sin(t * 15) * 1.9;
    const schabY = Math.cos(t * 11) * 1.2;
    return {
      x: a.x, y: a.y,
      state: hochGreifen ? "reachUp" : "idle",
      phase: 0,
      hand: [klemm(a.mitte - 1 + schabX, a.x - 15, a.x + 15), klemm(a.kante + schabY, a.y - 52, a.y - 12)],
      hand2: [a.x + 5, a.y - 28],
      werkzeug: "spachtel",
    };
  }

  // Kurzer Moment vor dem sauberen Rohputz
  if (a.phase === "rohbau") {
    return {
      x: a.x, y: a.y, state: "idle", phase: 0,
      hand: [a.x + 7, w.yBot - 29], hand2: [a.x - 5, w.yBot - 28],
      werkzeug: null,
    };
  }

  // Durchgang 3: Tapezieren — Leiter bewegen -> hochklettern -> Tapete rollt runter -> runterklettern
  if (a.schritt === "bewegen") {
    return {
      x: a.x, y: a.y, state: "walk", phase: 0,
      hand: [a.x - 4, a.y - 29],
      hand2: [a.x + 4, a.y - 25],
      werkzeug: null,
    };
  }
  if (a.schritt === "hoch" || a.schritt === "runter") {
    const wink = Math.sin(t * 11) * 2.6;
    return {
      x: a.x, y: a.y, state: "walk", phase: 0,
      hand: [a.x - 4, a.y - 39 + wink],
      hand2: [a.x + 4, a.y - 36 - wink],
      werkzeug: a.schritt === "hoch" ? "papier" : null,
    };
  }
  // Oben auf der Leiter: Tapete oben ansetzen (papier), dann beim Abrollen/Glattstreichen (buerste)
  const setztAn = a.u < 0.56;
  const streich = Math.sin(t * 13) * 2.1;
  const zielY = klemm(a.oben + 6 + Math.min(18, a.auf * 16), a.y - 54, a.y - 18);
  const greifen = sanft((a.u - 0.44) / 0.06) * (1 - sanft((a.u - 0.74) / 0.04));
  const ruhe: Punkt = [a.x - 6, a.y - 24];
  const hx = a.x - 7 + (setztAn ? 0 : streich);
  return {
    x: a.x, y: a.y,
    state: "reachUp", phase: 0,
    hand: [ruhe[0] + (hx - ruhe[0]) * greifen, ruhe[1] + (zielY - ruhe[1]) * greifen],
    hand2: [a.x + 4 - 5 * greifen, a.y - 28 - 14 * greifen],
    werkzeug: setztAn ? "papier" : "buerste",
  };
}

/** Pose am Boden während Luni den Tapetenmüll in den Müllsack zusammenkehrt. */
export function fegenPose(x: number, boden: number, t: number, p: number): RenoLuniPose {
  const k = klemm(p);
  const schwung = Math.sin(t * 11) * 6;
  if (k > 0.84) {
    // Zum Schluss bückt sie sich kurz und schnürt den vollen Sack zu
    return {
      x, y: boden, state: "bend", phase: 0.65,
      hand: [x - 10, boden - 11], hand2: [x - 6, boden - 12],
      werkzeug: null,
    };
  }
  return {
    x, y: boden, state: "bend", phase: 0.42 + Math.sin(t * 9) * 0.08,
    hand: [x - 7 + schwung, boden - 5],
    hand2: [x - 11, boden - 13],
    werkzeug: "feger",
  };
}

/** Werkzeug sitzt an der tatsächlich gezeichneten Hand, nicht an einer geschätzten Weltposition. */
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
  } else if (art === "feger") {
    // Kleiner Handfeger mit Holzgriff und hellen Borsten
    c.fillStyle = "#9a6c3f";
    c.beginPath(); c.roundRect(-5, -1.6, 8, 2.4, 1); c.fill();
    c.fillStyle = "#e2cfb0";
    c.fillRect(-4.5, 0.6, 5.2, 3.2);
    c.fillStyle = "#beaa88";
    for (let dx = -3.8; dx <= 0; dx += 1.4) c.fillRect(dx, 1.1, 0.7, 2.7);
  } else {
    c.fillStyle = "#b18c38"; c.fillRect(-4.5, -1, 9, 3);
    c.fillStyle = "#e8c86f";
    c.beginPath(); c.roundRect(-4.5, -3, 9, 4, 1.2); c.fill();
  }
  c.restore();
}
