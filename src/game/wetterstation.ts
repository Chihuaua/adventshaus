/* Wetter- und Jahreszeitenstation oben links im Erdsteinfeld.
   Reines GUI: kein Luni-Weg. In normalem Haus und Gruselhaus sichtbar.
   Zwei Reihen über den Steinen, Bedienleiste links daneben. */
import {
  JAHRESZEITEN, NAMEN, WETTERARTEN, ZUSAETZE,
  type Jahreszeit, type WetterArt, type WetterState, type Zusatz, beschreibung,
} from "./wetter";

type C = CanvasRenderingContext2D;
export type WetterBefehl =
  | { k: "season"; v: Jahreszeit } | { k: "art"; v: WetterArt }
  | { k: "plus" } | { k: "minus" } | { k: "zusatz"; v: Zusatz } | { k: "echt" };
export interface WetterTreffer { x: number; y: number; w: number; h: number; label: string; befehl: WetterBefehl | null }

const B = 26; // Klickfläche: mind. 24×24
const FX = 6, WX = 6, YS = 458, YW = 486, YB = 514;
const COL = { grund: "rgba(18,27,23,.86)", rand: "rgba(194,178,133,.5)", text: "#eef7f2", aktiv: "#d8b25e", still: "#2f4239" };

function rr(c: C, x: number, y: number, w: number, h: number, r: number, f: string) { c.fillStyle = f; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function discS(c: C, x: number, y: number, r: number, f: string) { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function sym(c: C, art: WetterArt | "echt" | "plus" | "minus" | "fruehling", x: number, y: number, on: boolean) {
  const cx = x + B / 2, cy = y + B / 2;
  c.save(); c.lineWidth = 1.5; c.strokeStyle = on ? "#fff6d8" : "#d7e4d9"; c.fillStyle = c.strokeStyle;
  const cloud = () => { c.beginPath(); c.arc(cx - 4, cy, 3.4, 0, Math.PI * 2); c.arc(cx, cy - 2, 4.4, 0, Math.PI * 2); c.arc(cx + 4.4, cy + .6, 3.2, 0, Math.PI * 2); c.fill(); };
  switch (art) {
    case "fruehling": for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; c.beginPath(); c.ellipse(cx + Math.cos(a) * 3.6, cy + Math.sin(a) * 3.6, 2.4, 1.6, a, 0, Math.PI * 2); c.fill(); } discS(c, cx, cy, 1.7, "#f6d36b"); c.strokeStyle = "#9fbf6d"; c.beginPath(); c.moveTo(cx, cy + 2); c.quadraticCurveTo(cx - 1, cy + 6, cx - 2.6, cy + 8); c.stroke(); break;
    case "sonne": c.beginPath(); c.arc(cx, cy, 4.2, 0, Math.PI * 2); c.fill(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(cx + Math.cos(a) * 6.2, cy + Math.sin(a) * 6.2); c.lineTo(cx + Math.cos(a) * 8.8, cy + Math.sin(a) * 8.8); c.stroke(); } break;
    case "bewoelkt": cloud(); break;
    case "regen": cloud(); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(cx - 4 + i * 4, cy + 5); c.lineTo(cx - 5 + i * 4, cy + 9); c.stroke(); } break;
    case "schnee": for (let i = 0; i < 3; i++) { const px = cx - 4 + i * 4, py = cy - 1 + (i % 2) * 4; c.beginPath(); c.moveTo(px - 2.4, py); c.lineTo(px + 2.4, py); c.moveTo(px, py - 2.4); c.lineTo(px, py + 2.4); c.moveTo(px - 1.7, py - 1.7); c.lineTo(px + 1.7, py + 1.7); c.stroke(); } break;
    case "hagel": for (let i = 0; i < 4; i++) c.fillRect(cx - 5 + (i % 2) * 7, cy - 4 + Math.floor(i / 2) * 6, 2.6, 2.6); break;
    case "nebel": for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(cx - 7, cy - 3 + i * 3.3); c.bezierCurveTo(cx - 3, cy - 5 + i * 3.3, cx + 2, cy - 1 + i * 3.3, cx + 7, cy - 3 + i * 3.3); c.stroke(); } break;
    case "sturm": for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(cx - 9, cy - 4 + i * 4); c.quadraticCurveTo(cx + 4, cy - 8 + i * 4, cx + 9, cy - 4 + i * 4); c.stroke(); } break;
    case "gewitter": cloud(); c.beginPath(); c.moveTo(cx + 2, cy + 4); c.lineTo(cx - 3, cy + 10); c.lineTo(cx + 1, cy + 10); c.lineTo(cx - 4, cy + 16); c.stroke(); break;
    case "echt": c.beginPath(); c.arc(cx, cy, 8.2, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - 5); c.moveTo(cx, cy); c.lineTo(cx + 4, cy + 2); c.stroke(); break;
    case "plus": c.beginPath(); c.moveTo(cx - 6, cy); c.lineTo(cx + 6, cy); c.moveTo(cx, cy - 6); c.lineTo(cx, cy + 6); c.stroke(); break;
    case "minus": c.beginPath(); c.moveTo(cx - 6, cy); c.lineTo(cx + 6, cy); c.stroke(); break;
  }
  c.restore();
}

/** Trefferflächen. add = Zusatzauswahl; sonst zwei Reihen über den Steinen. */
export function wetterStationLayout(w: WetterState, add: "plus" | "minus" | null): WetterTreffer[] {
  const out: WetterTreffer[] = [];
  if (add) {
    ZUSAETZE.forEach((z, i) => out.push({
      x: FX + i * 30, y: 540, w: B, h: B,
      label: `${add === "plus" ? "Zusatz hinzufügen" : "Zusatz entfernen"}: ${NAMEN[z]}${w.zusatz.includes(z) ? " (aktiv)" : ""}`,
      befehl: { k: "zusatz", v: z },
    }));
    out.push({ x: FX, y: 566, w: 48, h: B, label: "Zusatzauswahl schließen", befehl: { k: "plus" } });
    return out;
  }
  JAHRESZEITEN.forEach((s, i) => out.push({ x: FX + i * 32, y: YS, w: B, h: B, label: `Jahreszeit: ${NAMEN[s]}`, befehl: { k: "season", v: s } }));
  WETTERARTEN.forEach((a, i) => out.push({ x: WX + i * 32, y: YW, w: B, h: B, label: `Wetter: ${NAMEN[a]}`, befehl: { k: "art", v: a } }));
  out.push({ x: 314, y: YS + 14, w: B, h: B, label: "Echtwetter nach Systemdatum", befehl: { k: "echt" } });
  out.push({ x: FX, y: YB, w: B, h: B, label: "Wetter-Zusatz hinzufügen", befehl: { k: "plus" } });
  out.push({ x: FX + 30, y: YB, w: B, h: B, label: "Wetter-Zusatz entfernen", befehl: { k: "minus" } });
  return out;
}

export function wetterStationHit(hits: WetterTreffer[], x: number, y: number) {
  for (const h of hits) if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
  return null;
}

const NAMN = (s: Jahreszeit) => ({ fruehling: "Frühling", sommer: "Sommer", herbst: "Herbst", winter: "Winter" }[s]);

/** Zeichnet beide Reihen und die Bedienleiste; kein Wetter darüber. */
export function drawWetterStation(c: C, w: WetterState, add: "plus" | "minus" | null, hover: WetterTreffer | null) {
  c.save();
  // Panel A: zwei Reihen, endet oberhalb der Steine (Steine ab y≈506)
  rr(c, 2, 450, 342, 60, 5, COL.grund);
  c.strokeStyle = COL.rand; c.lineWidth = 1; c.beginPath(); c.roundRect(3, 451, 340, 58, 5); c.stroke();
  // Jahreszeiten
  JAHRESZEITEN.forEach((s, i) => {
    const x = FX + i * 32, on = w.season === s;
    rr(c, x, YS, B, B, 3, on ? COL.aktiv : COL.still);
    sym(c, s === "fruehling" ? "fruehling" : s === "sommer" ? "sonne" : s === "herbst" ? "bewoelkt" : "schnee", x, YS, on);
  });
  WETTERARTEN.forEach((a, i) => {
    const x = WX + i * 32, on = w.art === a;
    rr(c, x, YW, B, B, 3, on ? COL.aktiv : COL.still);
    sym(c, a, x, YW, on);
  });
  // Echtwetter
  rr(c, 314, YS + 14, B, B, 3, w.test ? COL.still : COL.aktiv);
  sym(c, "echt", 314, YS + 14, !w.test);
  // Bedienleiste links, unterhalb der Reihen und neben den Steinen
  rr(c, 2, 510, 188, 86, 5, COL.grund);
  c.strokeStyle = COL.rand; c.beginPath(); c.roundRect(3, 511, 186, 84, 5); c.stroke();
  c.font = '600 8px "Space Grotesk", sans-serif';
  if (!add) {
    rr(c, FX, YB, B, B, 3, COL.still); sym(c, "plus", FX, YB, false);
    rr(c, FX + 30, YB, B, B, 3, COL.still); sym(c, "minus", FX + 30, YB, false);
    c.fillStyle = "#c9b98d"; c.fillText(NAMN(w.season), FX + 62, YB + 9);
    c.fillStyle = COL.text; c.fillText(beschreibung(w).slice(0, 26), FX + 62, YB + 20);
    c.fillStyle = "#9db3a5";
    c.fillText(w.test ? "Testwetter: bis Neustart" : "Systemwetter (gespeichert)", FX + 6, YB + 38);
    c.fillText("+ Zusatz   − entfernen", FX + 6, YB + 50);
  } else {
    c.fillStyle = "#c9b98d";
    c.fillText(add === "plus" ? "ZUSATZ HINZUFÜGEN" : "ZUSATZ ENTFERNEN", FX, YB + 10);
    ZUSAETZE.forEach((z, i) => {
      const x = FX + i * 30, on = w.zusatz.includes(z);
      rr(c, x, 540, B, B, 3, on ? COL.aktiv : COL.still);
      sym(c, z === "wind" ? "sturm" : z === "blitze" ? "gewitter" : z === "nebel" ? "nebel" : "schnee", x, 540, on);
    });
    rr(c, FX, 566, 48, B, 3, "#203026");
    c.fillStyle = COL.text; c.fillText("ABBRECHEN", FX + 3, 581);
    c.fillStyle = COL.text; c.fillText(beschreibung(w).slice(0, 26), FX + 52, 580);
  }
  c.restore();
  if (hover) {
    c.save(); c.font = '600 11px "Space Grotesk", sans-serif';
    const tw = c.measureText(hover.label).width + 16;
    const lx = Math.min(Math.max(hover.x + hover.w / 2 - tw / 2, 4), 960 - tw - 4);
    const ly = Math.max(hover.y - 8, 22);
    rr(c, lx, ly - 14, tw, 20, 5, "rgba(8,20,26,.88)");
    c.fillStyle = "#eef7f2"; c.fillText(hover.label, lx + 8, ly); c.restore();
  }
}
