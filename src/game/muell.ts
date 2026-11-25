/* =======================================================================
   MÜLLTONNE & KELLERSÄCKE — Tapetenreste nach draußen bringen

   Abgelöste Tapetenreste und Putzbrösel werden nach dem Renovieren in
   Müllsäcke gepackt:
     • Dienstags steht die Mülltonne draußen vor dem Haus (vor der Tür).
       Luni trägt frische sowie im Keller gelagerte Säcke nach draußen.
     • An allen anderen Tagen lagern die vollen Müllsäcke unten im Keller
       (Krempelraum), bis wieder Dienstag ist.

   Nur Canvas-2D-Primitive, reine Datumshilfe auf Basis der Europe/Berlin-Uhr.
   ======================================================================= */

export type C = CanvasRenderingContext2D;

const TAU = Math.PI * 2;
const klemm = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/** Stellplatz der Mülltonne vor dem Haus (links auf Höhe der Haustür, zwischen Briefkasten und Außenwand). */
export const MUELLTONNE = { x: 87.5, y: 448, w: 16, h: 28 } as const;

/** Öffnung der Haustür (entspricht POST_TUER). */
export const MUELL_TUER = { x: 135, y: 448 - 82, w: 52, h: 82 } as const;

/** Zielkoordinate im Keller (Krempelraum) zum Abstellen/Abholen der Säcke. */
export const KELLER_MUELL_STAND = { floor: 0, x: 506, face: 1 as const };

/** Plätze der im Keller gelagerten Müllsäcke (Boden FK = 572). */
export const KELLER_SACK_PLAETZE: readonly { x: number; dy: number; skala: number; dreh: number }[] = [
  { x: 511, dy: 0, skala: 0.96, dreh: -0.05 },
  { x: 520, dy: 0, skala: 0.88, dreh: 0.08 },
  { x: 515, dy: -11, skala: 0.84, dreh: -0.03 },
  { x: 423, dy: 0, skala: 0.94, dreh: 0.06 },
  { x: 432, dy: 0, skala: 0.88, dreh: -0.07 },
  { x: 427, dy: -11, skala: 0.82, dreh: 0.04 },
  { x: 506, dy: -11, skala: 0.8, dreh: 0.09 },
  { x: 419, dy: -10, skala: 0.8, dreh: -0.08 },
  { x: 514, dy: -20, skala: 0.78, dreh: 0.02 },
] as const;

/** Höchste einzeln dargestellte Sackzahl im Keller (Rest bleibt als Stapel erkennbar). */
export const MAX_KELLER_SAECKE = 12;

/**
 * Ist heute Dienstag (Mülltag)?
 * Rechnet zeitzonenfest über das übergebene Kalenderdatum (Europe/Berlin).
 */
export function istMuellTag(datum: { year: number; month: number; day: number }): boolean {
  if (!datum.year || !datum.month || !datum.day) return false;
  return new Date(Date.UTC(datum.year, datum.month - 1, datum.day, 12)).getUTCDay() === 2;
}

/** Fortlaufende Tagesnummer (wie abendTag / tagNr). */
export function muellTagNr(datum: { year: number; month: number; day: number }): number {
  return Math.floor(Date.UTC(datum.year, datum.month - 1, datum.day) / 86400000);
}

/** Einzelner zugeknoteter grauschwarzer Müllsack. */
export function drawMuellSack(c: C, x: number, y: number, skala = 1, füllung = 1, schatten = true) {
  const f = klemm(füllung);
  if (f <= 0.02) return;
  const s = skala * (0.45 + 0.55 * f);
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (schatten) {
    c.fillStyle = "rgba(0,0,0,.26)";
    c.beginPath();
    c.ellipse(0, 0.2, 6.8, 1.8, 0, 0, TAU);
    c.fill();
  }
  // Bauchiger Sack mit unregelmäßigen Papierbeulen
  c.fillStyle = "#2b3238";
  c.beginPath();
  c.moveTo(-5.8, -0.4);
  c.quadraticCurveTo(-7.2, -5.8, -4.4, -10.2);
  c.lineTo(-1.8, -13.2);
  c.lineTo(1.9, -13.2);
  c.lineTo(4.7, -10);
  c.quadraticCurveTo(7.1, -5.4, 5.7, -0.4);
  c.closePath();
  c.fill();

  // Lichter Faltenzug für Plastikhaut
  c.fillStyle = "#3c454d";
  c.beginPath();
  c.ellipse(-1.6, -6.5, 2.7, 4.4, -0.18, 0, TAU);
  c.fill();
  c.fillStyle = "rgba(218,228,236,.16)";
  c.beginPath();
  c.ellipse(-2.3, -7.8, 1.1, 2.5, -0.22, 0, TAU);
  c.fill();

  // Kleiner Zipfel eines bunten Papierfetzenabdrucks unter der Folie
  c.fillStyle = "rgba(180,165,140,.18)";
  c.beginPath();
  c.ellipse(2.2, -5.1, 1.7, 2.2, 0.3, 0, TAU);
  c.fill();

  // Zugeknoteter Hals mit rotem/hellem Zugband
  c.fillStyle = "#d95b48";
  c.fillRect(-2.1, -13.9, 4.2, 1.3);
  // Krauser Beutelkopf über dem Knoten
  c.fillStyle = "#333b42";
  c.beginPath();
  c.moveTo(-1.8, -13.9);
  c.lineTo(-3.4, -16.8);
  c.lineTo(-0.5, -15.6);
  c.lineTo(1.2, -17.2);
  c.lineTo(3.3, -16.2);
  c.lineTo(1.9, -13.9);
  c.closePath();
  c.fill();
  c.restore();
}

/** Offener Müllsack neben Luni während des Zusammenkehrens (Füllstand 0..1). */
export function drawFegenSack(c: C, x: number, y: number, p: number) {
  const f = klemm(p);
  c.save();
  c.translate(x, y);
  // Schatten
  c.fillStyle = "rgba(0,0,0,.22)";
  c.beginPath();
  c.ellipse(0, 0.2, 7.2, 1.9, 0, 0, TAU);
  c.fill();
  const h = 7 + f * 7.5;
  // Sackwand
  c.fillStyle = "#2b3238";
  c.beginPath();
  c.moveTo(-6, -0.4);
  c.quadraticCurveTo(-6.8, -h * 0.5, -5.2, -h);
  c.lineTo(5.2, -h);
  c.quadraticCurveTo(6.8, -h * 0.5, 6, -0.4);
  c.closePath();
  c.fill();
  c.fillStyle = "#3b444c";
  c.beginPath();
  c.ellipse(-1.4, -h * 0.45, 2.3, h * 0.32, -0.1, 0, TAU);
  c.fill();
  // Öffnung oben: man sieht die eingesammelten Tapetenschnipsel
  c.fillStyle = "#181d21";
  c.beginPath();
  c.ellipse(0, -h, 5.2, 1.8, 0, 0, TAU);
  c.fill();
  if (f > 0.15) {
    c.fillStyle = "#c9bca2";
    c.beginPath();
    c.ellipse(-1.2, -h - 0.3, 2.2 * f, 1.1, -0.2, 0, TAU);
    c.fill();
    c.fillStyle = "#9d6b62";
    c.fillRect(0.6, -h - 1.1, 2.2 * f, 1.2);
  }
  // Umgekrempelter Rand
  c.strokeStyle = "#48525b";
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(0, -h, 5.3, 1.8, 0, 0, Math.PI);
  c.stroke();
  c.restore();
}

/** Stapel voller Müllsäcke unten im Keller (Krempelraum). */
export function drawKellerMuellsaecke(c: C, anzahl: number, F = 572) {
  const n = Math.max(0, Math.min(KELLER_SACK_PLAETZE.length, Math.round(anzahl)));
  if (n <= 0) return;
  for (let i = 0; i < n; i++) {
    const p = KELLER_SACK_PLAETZE[i];
    c.save();
    c.translate(p.x, F + p.dy);
    c.rotate(p.dreh);
    drawMuellSack(c, 0, 0, p.skala, 1, p.dy === 0);
    c.restore();
  }
}

/**
 * Dienstags-Mülltonne draußen vor dem Haus (auf dem Vorgarten links auf Höhe FE).
 * Steht nur Dienstags da! `deckelOffen` 0..1 öffnet den Deckel beim Einwerfen.
 */
export function drawMuellTonne(c: C, deckelOffen = 0, fuellstand = 0, schnee = true) {
  const { x, y } = MUELLTONNE;
  const auf = klemm(deckelOffen);
  c.save();
  c.translate(x, y);

  // Bodenschatten auf dem Schnee
  c.fillStyle = "rgba(18,28,38,.26)";
  c.beginPath();
  c.ellipse(0, 0.5, 9.5, 2.4, 0, 0, TAU);
  c.fill();

  // Hinteres Rad und Bodenstandfuß
  c.fillStyle = "#161a1d";
  c.beginPath();
  c.arc(5.4, -2.6, 2.8, 0, TAU);
  c.fill();
  c.fillStyle = "#525b63";
  c.beginPath();
  c.arc(5.4, -2.6, 1.1, 0, TAU);
  c.fill();
  c.fillStyle = "#1e2428";
  c.fillRect(-5.6, -2.2, 2.4, 2.2);

  // Tonnenkorpus (leicht konisch nach oben breiter)
  c.fillStyle = "#364047";
  c.beginPath();
  c.moveTo(-6, -2);
  c.lineTo(-7.2, -23.5);
  c.lineTo(7.2, -23.5);
  c.lineTo(5.8, -2);
  c.closePath();
  c.fill();

  // Rippen / Schatten links und rechts für Plastik-Plastizität
  c.fillStyle = "#48545d";
  c.beginPath();
  c.moveTo(-5.8, -22.5);
  c.lineTo(-1.2, -22.5);
  c.lineTo(-1.6, -3);
  c.lineTo(-4.8, -3);
  c.closePath();
  c.fill();

  // Oberer stabiler Wulstrand
  c.fillStyle = "#262e34";
  c.fillRect(-7.8, -24.8, 15.6, 2.2);

  // Eingeworfener Müll spitzelt heraus, wenn der Deckel hochklappt oder Tonne sehr voll ist
  if (auf > 0.1 || fuellstand > 0) {
    c.fillStyle = "#1b2024";
    c.fillRect(-6.4, -25.4, 12.8, 1.6);
    if (fuellstand > 0) {
      c.fillStyle = "#2b3238";
      c.beginPath();
      c.ellipse(-1.4, -24.8, 3.6, 1.8 * Math.min(1.3, 0.5 + fuellstand * 0.25), -0.1, Math.PI, TAU);
      c.fill();
      c.fillStyle = "#c9bca2";
      c.fillRect(1.6, -25.6, 2.3, 1.4);
    }
  }

  // Griff hinten rechts am Scharnier
  c.strokeStyle = "#262e34";
  c.lineWidth = 1.6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(6.8, -23.8);
  c.lineTo(9, -25.6);
  c.stroke();

  // Klappdeckel (schwenkt um das rechte Scharnier nach hinten oben)
  c.save();
  c.translate(7.4, -24.8);
  c.rotate(auf * 1.18);
  c.fillStyle = "#2a3238";
  c.beginPath();
  c.roundRect(-15.8, -3.2, 16.4, 3.4, 1.4);
  c.fill();
  c.fillStyle = "#414c54";
  c.fillRect(-14.6, -2.7, 13.8, 1.1);
  // Kleines Schneehäubchen auf dem Deckel
  if (schnee) {
    c.fillStyle = "#eef4fa";
    c.beginPath();
    c.roundRect(-14.6, -4.3, 14.2, 1.6, 0.8);
    c.fill();
  }
  c.restore();
  c.restore();
}

/** Offene Haustür beim Rausbringen des Müllsacks (wie Postfrosch-Haustür). */
export function drawMuellHaustuer(
  c: C,
  sky: CanvasImageSource,
  tuerOffen: number,
  sackDraussen = false,
) {
  if (tuerOffen <= 0.001) return;
  const { x, y, w, h } = MUELL_TUER;
  const FE = 448;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.drawImage(sky, 0, 0, 960, 600);
  // Verschneiter Vorgarten hinter der Türschwelle
  c.fillStyle = "#e8eff6";
  c.fillRect(x, FE - 8, w, 8);
  c.fillStyle = "#ffffff";
  c.fillRect(x, FE - 8, w, 1.6);
  // Während Luni kurz hinausreicht, sieht man im Türrahmen die Ecke des Sacks draußen
  if (sackDraussen) drawMuellSack(c, x + w * 0.56, FE - 4, 0.72, 1, false);
  // Aufschwingendes Türblatt
  const blatt = w * (1 - 0.8 * klemm(tuerOffen));
  c.fillStyle = "#6e4a2f";
  c.fillRect(x, y, blatt, h);
  c.fillStyle = "#5a3b25";
  c.fillRect(x + blatt * 0.1, y + 6, blatt * 0.8, 32);
  c.fillRect(x + blatt * 0.1, y + 44, blatt * 0.8, 32);
  c.fillStyle = "rgba(0,0,0,.3)";
  c.fillRect(x + blatt - 1.6, y, 1.6, h);
  c.restore();
}

/** Kurze Position/Füllstand beim Einwerfen in die Mülltonne. */
export function muellEinwurfStand(p: number): { tuer: number; deckel: number; sackImFreien: boolean } {
  const k = klemm(p);
  const tuer = k < 0.24 ? klemm(k / 0.24) : k < 0.76 ? 1 : klemm((1 - k) / 0.24);
  const deckel = k < 0.28 ? 0 : k < 0.44 ? klemm((k - 0.28) / 0.16) : k < 0.62 ? 1 : klemm((0.76 - k) / 0.14);
  return { tuer, deckel, sackImFreien: k >= 0.3 && k <= 0.58 };
}
