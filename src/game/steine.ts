/* =======================================================================
   WECHSELSTEINE

   Vier Steine, vier Hauswelten – jeder Stein sieht anders aus:
     Wachstein       (Sonne, warmes Grün)         -> normales Haus
     Traumstein      (Mondsichel, kühles Blau)    -> Traumhaus
     Horrorstein     (Totenkopf, Schwarz/Glut)    -> Gruselhaus
     Weihnachtsstein (Tannenbaum/Stern, Rot/Gold) -> Weihnachtshaus

   In jeder Welt stehen die drei Steine der jeweils anderen Welten. Sie sind
   halb in die Erde links neben dem Keller eingelassen, sichtbare und
   ausreichend große Ziele (kein verstecktes Pixelportal).
   ======================================================================= */

import type { WeltId } from "./welten";

type C = CanvasRenderingContext2D;
type Rect4 = [number, number, number, number];

export type SteinArt = "wach" | "traum" | "horror" | "weihnacht" | "bote" | "nikolaus" | "bett" | "ezbett" | "aufsteh" | "ezaufsteh" | "kaffee" | "ezkaffee";

/** Platz A: der ursprüngliche Steinplatz (unverändert). */
export const STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 278,
  y: 536,
  hit: [254, 506, 48, 58],
};

/** Platz B: links daneben, ebenfalls in der Erde. */
export const STEIN_B: { x: number; y: number; hit: Rect4 } = {
  x: 222,
  y: 540,
  hit: [198, 510, 48, 58],
};

/** Platz C: rechts daneben im Erdreich (mit Luft vor der Kellerwand). */
export const STEIN_C: { x: number; y: number; hit: Rect4 } = {
  x: 316,
  y: 541,
  hit: [303, 511, 34, 56],
};

/** Platz D: Poststein, links von Platz B im Erdreich (innerhalb der 10-%-Randregel). */
export const STEIN_D: { x: number; y: number; hit: Rect4 } = {
  x: 166,
  y: 541,
  hit: [143, 511, 46, 56],
};

/** Der Nikolausstein nutzt den freien Platz links vom Poststein, ohne ihn zu versetzen. */
export const NIKOLAUS_STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 116, y: 540, hit: [96, 509, 41, 57],
};

export const BETT_STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 222, y: 487, hit: [201, 461, 42, 43],
};

/** EZ-Bett-Stein rechts neben dem Bett-Stein: startet die Abendroutine mit ihren Echtzeit-Dauern. */
export const EZ_BETT_STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 268, y: 487, hit: [247, 461, 42, 43],
};

/**
 * Aufsteh-Steine in der Reihe des Bett-Steins (Erdreich links vom Haus).
 * Links vom Bett-Stein bleiben 23 Einheiten Luft, damit sich die Steine
 * optisch nicht berühren; alles bleibt im sicheren Bildbereich (x >= 96).
 */
export const AUFSTEH_STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 114, y: 487, hit: [98, 461, 30, 43],
};

/** EZ-Aufsteh-Stein daneben: dieselbe Routine mit ihren Echtzeit-Dauern. */
export const EZ_AUFSTEH_STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 146, y: 487, hit: [131, 461, 30, 43],
};

/** Kaffee-Stein: kurze Probe der Morgenroutine mit der Senseo (2 × Kaffee → Zigarette). */
export const KAFFEE_STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 180, y: 487, hit: [164, 461, 32, 43],
};

/** EZ-Kaffee-Stein rechts neben dem EZ-Bett-Stein: dieselbe Routine in Echtzeit. */
export const EZ_KAFFEE_STEIN: { x: number; y: number; hit: Rect4 } = {
  x: 311, y: 487, hit: [294, 461, 34, 43],
};

const ZIEL_ART: Record<WeltId, SteinArt> = {
  normal: "wach",
  traum: "traum",
  gruesel: "horror",
  weihnacht: "weihnacht",
};

export const STEIN_NAMEN: Record<SteinArt, string> = {
  wach: "Wachstein",
  traum: "Traumstein",
  horror: "Horrorstein",
  weihnacht: "Weihnachtsstein",
  bote: "Poststein",
  nikolaus: "Nikolausstein",
  bett: "Bett-Stein",
  ezbett: "EZ-Bett-Stein",
  aufsteh: "Aufsteh-Stein",
  kaffee: "Kaffee-Stein",
  ezkaffee: "EZ-Kaffee-Stein",
  ezaufsteh: "EZ-Aufsteh-Stein",
};

export interface SteinSlot {
  art: SteinArt;
  /** Hauswelt, zu der dieser Stein führt */
  ziel: WeltId;
  x: number;
  y: number;
  hit: Rect4;
  label: string;
  /** Poststein: löst statt eines Weltwechsels die Postfrosch-Zustellung aus. */
  aktion?: "post" | "nikolaus" | "abend" | "abendEZ" | "aufsteh" | "aufstehEZ" | "kaffee" | "kaffeeEZ";
}

/**
 * Die Steine einer Welt: alle Welten außer der eigenen, in fester Reihenfolge
 * (normal, traum, gruesel, weihnacht). Der erste belegt Platz A, der zweite B,
 * der dritte C. So bleiben Traumstein, Wachstein und Horrorstein an ihren
 * gewohnten Plätzen.
 */
export function steinSlots(welt: WeltId): SteinSlot[] {
  const reihenfolge: WeltId[] = ["normal", "traum", "gruesel", "weihnacht"];
  const plaetze = [STEIN, STEIN_B, STEIN_C];
  return reihenfolge
    .filter((w) => w !== welt)
    .map((ziel, i): SteinSlot => ({
      art: ZIEL_ART[ziel],
      ziel,
      x: plaetze[i].x,
      y: plaetze[i].y,
      hit: plaetze[i].hit,
      label: STEIN_NAMEN[ZIEL_ART[ziel]],
    }))
    .concat(welt !== "normal" && welt !== "weihnacht" ? [] : [{
      art: "bote",
      ziel: welt,
      x: STEIN_D.x,
      y: STEIN_D.y,
      hit: STEIN_D.hit,
      label: STEIN_NAMEN.bote,
      aktion: "post",
    }, {
      ...NIKOLAUS_STEIN,
      art: "nikolaus",
      ziel: welt,
      label: STEIN_NAMEN.nikolaus,
      aktion: "nikolaus",
    }, {
      ...BETT_STEIN, art: "bett", ziel: welt, label: STEIN_NAMEN.bett, aktion: "abend",
    }, {
      ...EZ_BETT_STEIN, art: "ezbett", ziel: welt, label: STEIN_NAMEN.ezbett, aktion: "abendEZ",
    }, {
      ...AUFSTEH_STEIN, art: "aufsteh", ziel: welt, label: STEIN_NAMEN.aufsteh, aktion: "aufsteh",
    }, {
      ...EZ_AUFSTEH_STEIN, art: "ezaufsteh", ziel: welt, label: STEIN_NAMEN.ezaufsteh, aktion: "aufstehEZ",
    }, {
      ...KAFFEE_STEIN, art: "kaffee", ziel: welt, label: STEIN_NAMEN.kaffee, aktion: "kaffee",
    }, {
      ...EZ_KAFFEE_STEIN, art: "ezkaffee", ziel: welt, label: STEIN_NAMEN.ezkaffee, aktion: "kaffeeEZ",
    }]);
}

export function steinAn(slots: SteinSlot[], x: number, y: number): SteinSlot | null {
  for (const s of slots) {
    const [hx, hy, hw, hh] = s.hit;
    if (x >= hx && x <= hx + hw && y >= hy && y <= hy + hh) return s;
  }
  return null;
}

function poly(c: C, pts: [number, number][], color: string) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

const FARBEN: Record<SteinArt, { main: string; edge: string; glow: string }> = {
  traum: { main: "#4e5b88", edge: "#a7b5ef", glow: "rgba(153,181,255,.2)" },
  wach: { main: "#758b60", edge: "#e6d58a", glow: "rgba(255,224,139,.18)" },
  horror: { main: "#2b1a26", edge: "#ff6a3c", glow: "rgba(255,98,52,.26)" },
  weihnacht: { main: "#7a242c", edge: "#f5d36c", glow: "rgba(255,210,110,.26)" },
  bote: { main: "#2c5674", edge: "#9fe0a8", glow: "rgba(150,230,170,.22)" },
  nikolaus: { main: "#805046", edge: "#f3d59a", glow: "rgba(244,202,125,.28)" },
  bett: { main: "#51465f", edge: "#dccde7", glow: "rgba(198,177,222,.18)" },
  ezbett: { main: "#33405f", edge: "#f0d68e", glow: "rgba(240,214,142,.2)" },
  aufsteh: { main: "#6b5a49", edge: "#ffe6a8", glow: "rgba(255,230,168,.2)" },
  kaffee: { main: "#5a3d6e", edge: "#e8d2ff", glow: "rgba(214,180,255,.2)" },
  ezkaffee: { main: "#3e2a4e", edge: "#ffd98a", glow: "rgba(255,217,138,.22)" },
  ezaufsteh: { main: "#4a4034", edge: "#ffd089", glow: "rgba(255,208,137,.22)" },
};

/** Halb eingegrabener Stein; Symbol und Farbe zeigen eindeutig, wohin er führt. */
export function drawStein(c: C, kind: SteinArt, t = 0, px: number = STEIN.x, py: number = STEIN.y) {
  const x = px;
  const y = py;
  const { main, edge, glow } = FARBEN[kind];
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
  c.fillStyle = edge;
  if (kind === "bett" || kind === "ezbett") {
    if (kind === "ezbett") {
      // Kleines Bett mit einer Uhr darüber: der Abend in echter Zeit.
      c.fillStyle = "#fbf1d6"; c.beginPath(); c.arc(x + 6, y - 18, 4.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#7a5b2a"; c.lineWidth = .9; c.lineCap = "round"; c.stroke();
      c.beginPath(); c.moveTo(x + 6, y - 18); c.lineTo(x + 6, y - 20.8); c.moveTo(x + 6, y - 18); c.lineTo(x + 8, y - 17); c.stroke();
    }
    c.fillStyle = "#f2ddc8";
    c.fillRect(x - 11, y - 15, 2.5, 17); c.fillRect(x + 9, y - 9, 2, 11);
    c.fillRect(x - 10, y - 4, 20, 2.2);
    c.beginPath(); c.roundRect(x - 8, y - 11, 6, 4.5, 1.8); c.fill();
    c.fillStyle = "#acc8d3";
    c.beginPath(); c.roundRect(x - 2.5, y - 11.5, 12, 7.3, 2); c.fill();
    c.fillStyle = "#eae2ef"; c.fillRect(x, y - 11, 1.3, 5.5);
  } else if (kind === "kaffee" || kind === "ezkaffee") {
    // Kleine violette Senseo mit dampfender Tasse.
    if (kind === "ezkaffee") {
      c.fillStyle = "#fbf1d6"; c.beginPath(); c.arc(x + 6.4, y - 19, 4.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#7a5b2a"; c.lineWidth = .9; c.lineCap = "round"; c.stroke();
      c.beginPath(); c.moveTo(x + 6.4, y - 19); c.lineTo(x + 6.4, y - 21.8); c.moveTo(x + 6.4, y - 19); c.lineTo(x + 8.4, y - 18); c.stroke();
    }
    c.fillStyle = "#8a5cc0";
    c.fillRect(x - 9, y - 14, 10, 3); c.fillRect(x - 3, y - 14, 4, 12); c.fillRect(x - 9, y - 3, 10, 2);
    c.fillStyle = "#f4efe6"; c.fillRect(x - 8, y - 8, 4, 5);
    c.strokeStyle = edge; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x - 6.5, y - 9.5); c.quadraticCurveTo(x - 5, y - 12, x - 6.5, y - 13.5); c.stroke();
  } else if (kind === "aufsteh" || kind === "ezaufsteh") {
    // Aufwachpfeil über einem kleinen Bett: sie steht auf und nimmt die Weste.
    if (kind === "ezaufsteh") {
      c.fillStyle = "#fbf1d6"; c.beginPath(); c.arc(x + 6.4, y - 19, 4.2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#7a5b2a"; c.lineWidth = .9; c.lineCap = "round"; c.stroke();
      c.beginPath(); c.moveTo(x + 6.4, y - 19); c.lineTo(x + 6.4, y - 21.8); c.moveTo(x + 6.4, y - 19); c.lineTo(x + 8.4, y - 18); c.stroke();
    }
    c.fillStyle = "#f2ddc8";
    c.fillRect(x - 11, y - 15, 2.5, 15); c.fillRect(x + 9, y - 9, 2, 9);
    c.fillRect(x - 10, y - 4, 20, 2.2);
    c.fillStyle = "#acc8d3";
    c.beginPath(); c.roundRect(x - 8, y - 10.5, 15, 5.5, 2); c.fill();
    c.strokeStyle = edge; c.lineWidth = 1.4; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - 1, y - 21); c.lineTo(x + 5, y - 21); c.stroke();
    c.beginPath(); c.moveTo(x + 2.4, y - 24); c.lineTo(x + 5.2, y - 21); c.lineTo(x + 2.4, y - 18); c.stroke();
  } else if (kind === "nikolaus") {
    // Kleine Emaille-Mitra mit Perlenrand und der goldenen Schnecke seines Stabs.
    poly(c, [[x - 9, y - 10], [x - 3, y - 19], [x + 3.8, y - 10.5], [x + 3, y - 2.1], [x - 8.1, y - 2.2]], "#efcc82");
    poly(c, [[x - 7.7, y - 9.7], [x - 3, y - 16.9], [x + 2.6, y - 10], [x + 1.9, y - 5.4], [x - 7.2, y - 5.5]], "#a93849");
    c.strokeStyle = "#fff0bf"; c.lineWidth = 1.15; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - 2.9, y - 13.6); c.lineTo(x - 2.9, y - 6.3);
    c.moveTo(x - 5.2, y - 10.7); c.lineTo(x - .3, y - 10.7); c.stroke();
    c.strokeStyle = "#f0cb81"; c.lineWidth = 1.35;
    c.beginPath(); c.moveTo(x + 6.1, y + .5); c.lineTo(x + 7.3, y - 12.3);
    c.bezierCurveTo(x + 7.3, y - 17.5, x + 13.4, y - 16.3, x + 12, y - 12.5);
    c.quadraticCurveTo(x + 10.2, y - 9.8, x + 9.4, y - 12.5); c.stroke();
    for (const dx of [-6.2, -3, .5]) {
      c.fillStyle = "#fff3ce"; c.beginPath(); c.arc(x + dx, y - 3.8, .65, 0, Math.PI * 2); c.fill();
    }
  } else if (kind === "bote") {
    // Briefumschlag mit Klappe und grünem Froschsiegel (Frog Company)
    c.fillStyle = "#eef3e6";
    c.fillRect(x - 6.5, y - 13.5, 13, 8.6);
    c.strokeStyle = "rgba(20,40,55,.7)";
    c.lineWidth = 0.9;
    c.strokeRect(x - 6.5, y - 13.5, 13, 8.6);
    c.beginPath();
    c.moveTo(x - 6.5, y - 13.5);
    c.lineTo(x, y - 8.4);
    c.lineTo(x + 6.5, y - 13.5);
    c.stroke();
    c.fillStyle = "#4f9a52";
    c.beginPath();
    c.arc(x, y - 8.6, 2.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#eef3e6";
    c.beginPath();
    c.arc(x - 0.8, y - 9.3, 0.55, 0, Math.PI * 2);
    c.arc(x + 0.8, y - 9.3, 0.55, 0, Math.PI * 2);
    c.fill();
  } else if (kind === "traum") {
    // liegende Mondsichel
    c.beginPath();
    c.arc(x - 2, y - 8, 5.5, 0.5, Math.PI * 1.6);
    c.arc(x + 1.5, y - 9.5, 4.8, Math.PI * 1.55, 0.45, true);
    c.fill();
  } else if (kind === "wach") {
    // aufrechte kleine Sonne
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
  } else if (kind === "weihnacht") {
    // geschmückter Tannenbaum mit goldenem Stern auf der Spitze
    c.fillStyle = "#5a3822";
    c.fillRect(x - 1.4, y - 4.2, 2.8, 3.6);
    poly(c, [[x, y - 16.5], [x - 5.2, y - 10.6], [x + 5.2, y - 10.6]], "#2f7d47");
    poly(c, [[x, y - 12.8], [x - 6.6, y - 6.8], [x + 6.6, y - 6.8]], "#276c3d");
    poly(c, [[x, y - 9.2], [x - 7.8, y - 3.6], [x + 7.8, y - 3.6]], "#215c34");
    // kleiner Goldstern an der Spitze
    c.fillStyle = edge;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? 2.5 : 1.05;
      const sx = x + Math.cos(a) * r;
      const sy = y - 17.6 + Math.sin(a) * r;
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    }
    c.closePath();
    c.fill();
    // kleine Christbaumkugeln
    for (const [bx, by, col] of [
      [x - 2.6, y - 8.4, "#ff5b52"],
      [x + 2.8, y - 6.2, "#f5d36c"],
      [x - 3.6, y - 4.8, "#f5d36c"],
      [x + 1.4, y - 11.2, "#ff5b52"],
    ] as const) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(bx, by, 1.05, 0, Math.PI * 2);
      c.fill();
    }
  } else {
    // Totenkopf mit Glutaugen
    c.fillStyle = "#e8e0cc";
    c.beginPath();
    c.arc(x, y - 11, 5.6, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(x - 3.4, y - 7);
    c.lineTo(x + 3.4, y - 7);
    c.lineTo(x + 2.8, y - 2.6);
    c.lineTo(x - 2.8, y - 2.6);
    c.closePath();
    c.fill();
    c.fillStyle = "#1a0f16";
    c.beginPath();
    c.arc(x - 2.1, y - 11.2, 1.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(x + 2.1, y - 11.2, 1.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(x, y - 9.4);
    c.lineTo(x - 0.9, y - 7.4);
    c.lineTo(x + 0.9, y - 7.4);
    c.closePath();
    c.fill();
    c.strokeStyle = "#1a0f16";
    c.lineWidth = 0.6;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(x + i * 1.5, y - 6.4);
      c.lineTo(x + i * 1.5, y - 3.2);
      c.stroke();
    }
    // Glut in den Augenhöhlen, atmet leise
    c.fillStyle = `rgba(255,106,60,${0.35 + 0.25 * Math.sin(t * 2.4)})`;
    c.beginPath();
    c.arc(x - 2.1, y - 11.2, 0.8, 0, Math.PI * 2);
    c.arc(x + 2.1, y - 11.2, 0.8, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** Alt, nur für Aufrufer von früher: Treffer auf Platz A. */
export function trifftStein(x: number, y: number) {
  const [hx, hy, hw, hh] = STEIN.hit;
  return x >= hx && x <= hx + hw && y >= hy && y <= hy + hh;
}
