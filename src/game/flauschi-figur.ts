/* =======================================================================
   TELEFLAUSCHI · FLOCKE (die Figur)
   Eine violette Fellkugel mit Pfoten und einer viel zu großen, roten
   Weihnachtsmütze. Das Fell liegt in mehreren Lagen weicher Büschel
   übereinander, obenauf feine Härchen – so setzt sich die Mütze klar ab.

   Alles handgezeichnet mit Canvas-Primitive, keine Bild- oder Fontdateien.
   Flauschis Laune zeigt sich im Verhalten: Jede Pflegeaktion, jede Berührung
   und jeder Gegenstand im Zimmer hat seine eigene kleine Bewegung.
   ======================================================================= */

import { TAU, clamp, ell, flauschiDauer, herz, kreis, linie, rnd, weich, type C } from "./flauschi-dinge";
import type { FlauschiStand } from "./flauschi";

const FELL_LICHT = "#e6d9fb";
const FELL = "#cbb6f1";
const FELL_SCHATTEN = "#ad93df";
const FELL_TIEF = "#8a6cc6";
const SCHNAUZE = "#f3ecfd";
const PFOTE = "#e9defb";
const ROSA = "#f2b3c6";
const MUETZE = "#b03a30";
const WEISS = "#f7f4ec";
const AUGEN = "#2a2440";

/** Ein Ring weicher Fellbüschel um die Körpermitte. */
function bueschel(c: C, cy: number, r: number, abstand: number, groesse: number, n: number, farbe: string, seed: number) {
  c.fillStyle = farbe;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + seed * 0.37;
    const w = rnd(i + seed * 13);
    const rr = r * (abstand + w * 0.05);
    c.beginPath();
    c.arc(Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.94, r * groesse * (0.82 + w * 0.36), 0, TAU);
    c.fill();
  }
}

/** Kleines Fellbüschel (Ohren). */
function tuff(c: C, x: number, y: number, r: number, farbe: string, n: number, seed: number) {
  c.fillStyle = farbe;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + seed;
    c.beginPath();
    c.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.42, r * (0.35 + rnd(i + seed * 7) * 0.35), 0, TAU);
    c.fill();
  }
}

/**
 * Der Fellkörper: dunkle Unterwolle, zwei Lagen Deckfell, helle Brust und
 * – sobald Flauschi groß genug im Bild ist – feine Härchen ringsum.
 */
function fell(c: C, cy: number, r: number, t: number) {
  bueschel(c, cy, r, 1.0, 0.22, 20, FELL_TIEF, 3);
  bueschel(c, cy, r, 0.93, 0.2, 24, FELL_SCHATTEN, 1);
  ell(c, 0, cy, r * 0.95, r * 0.9, FELL_SCHATTEN);
  bueschel(c, cy, r, 0.8, 0.19, 22, FELL, 2);
  ell(c, 0, cy, r * 0.82, r * 0.78, FELL);
  bueschel(c, cy - r * 0.04, r, 0.56, 0.17, 16, FELL_LICHT, 5);
  ell(c, 0, cy - r * 0.02, r * 0.6, r * 0.56, FELL_LICHT);
  // Helle Schnauze und Brust, mit weichem Büschelrand
  bueschel(c, cy + r * 0.22, r, 0.36, 0.1, 14, SCHNAUZE, 7);
  ell(c, 0, cy + r * 0.22, r * 0.44, r * 0.38, SCHNAUZE);
  if (r < 12) return;

  // Feine Härchen: kurze, leicht geschwungene Striche am Rand, die im Atem mitgehen.
  c.lineCap = "round";
  c.lineWidth = Math.max(0.5, r * 0.028);
  for (let i = 0; i < 72; i++) {
    const w = rnd(i + 91);
    const a = (i / 72) * TAU + w * 0.08;
    const wind = Math.sin(t * 1.9 + i * 0.7) * 0.05;
    const r0 = r * (1.0 + w * 0.1);
    const r1 = r0 + r * (0.13 + rnd(i + 17) * 0.13);
    const rm = (r0 + r1) / 2;
    c.strokeStyle = i % 3 === 0 ? FELL_LICHT : i % 3 === 1 ? FELL : FELL_SCHATTEN;
    c.beginPath();
    c.moveTo(Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.94);
    c.quadraticCurveTo(
      Math.cos(a + 0.05) * rm, cy + Math.sin(a + 0.05) * rm * 0.94,
      Math.cos(a + 0.12 + wind) * r1, cy + Math.sin(a + 0.12 + wind) * r1 * 0.94,
    );
    c.stroke();
  }
  // Weiche Fellstruktur: kleine Bögen im Deckfell (das Gesicht bleibt frei).
  c.strokeStyle = "rgba(138,108,198,.34)";
  c.lineWidth = Math.max(0.5, r * 0.024);
  for (let i = 0; i < 30; i++) {
    const a = rnd(i + 40) * TAU;
    const d = r * (0.5 + rnd(i + 60) * 0.42);
    const px = Math.cos(a) * d;
    const py = cy + Math.sin(a) * d * 0.92;
    if (Math.abs(px) < r * 0.56 && py > cy - r * 0.34 && py < cy + r * 0.66) continue;
    c.beginPath();
    c.arc(px, py, r * 0.09, Math.PI * 0.15, Math.PI * 0.85);
    c.stroke();
  }
  // Glanz auf dem Fell oben links
  for (let i = 0; i < 6; i++) {
    kreis(c, -r * (0.62 - i * 0.07) + rnd(i + 5) * r * 0.06, cy - r * (0.5 + rnd(i + 9) * 0.22), r * (0.05 + rnd(i) * 0.04), "rgba(255,255,255,.3)");
  }
}

/** Kleine Musiknote. */
function note(c: C, x: number, y: number, g: number, f: string) {
  ell(c, x, y, g * 0.55, g * 0.42, f);
  linie(c, x + g * 0.5, y, x + g * 0.5, y - g * 1.5, f, Math.max(0.5, g * 0.16));
  linie(c, x + g * 0.5, y - g * 1.5, x + g * 1.2, y - g * 1.15, f, Math.max(0.5, g * 0.16));
}

/**
 * Flauschi selbst. (x, y) ist die Standlinie, s der Maßstab (1 = Radius 26),
 * `blick` die Richtung, in die sie gerade schaut (z. B. zum Mini-Fernseher).
 */
export function drawFlauschi(
  c: C, x: number, y: number, s: number, t: number, z: FlauschiStand,
  blick: readonly [number, number] = [0, 0],
) {
  const schlaf = z.schlaf;
  const akt = z.aktion;
  // Wachstumsphasen: Baby ist gut halb so groß, das Kind schon fast erwachsen.
  const skala = z.phase === 1 ? 0.55 : z.phase === 2 ? 0.8 : 1;
  const k = 26 * s * skala;

  // Laufzeit der Aktion als Fortschritt 0…1
  const dauer = akt ? flauschiDauer(akt) : 0;
  const pA = dauer > 0 ? clamp(1 - z.aktionT / dauer, 0, 1) : 0;

  // Direkt angefasst
  const krault = akt === "kraulen";
  const kitzelt = akt === "kitzeln";
  const niest = akt === "nase" && !schlaf;
  const hatschi = niest && pA >= 0.4 && pA < 0.62;
  const pfote = akt === "pfote" && !schlaf;
  const bommelt = akt === "bommel";
  // Gegenstände im Zimmer
  const tanzt = akt === "grammophon" && !schlaf;
  const kaut = akt === "nussknacker" && !schlaf && pA > 0.62;
  const horcht = akt === "gloeckchen" && !schlaf;
  const lacht = (akt === "spielen" || akt === "ball") && pA > 0.6;
  const freut = !schlaf && (
    krault || pfote || akt === "pferd" || akt === "wanne"
    || (tanzt && Math.sin(t * 4.2) > 0)
    || ((akt === "baum" || akt === "blech" || akt === "kranz") && pA > 0.7)
  );

  // Überraschungen von allein: Alle ~42 Sekunden sucht sich Flauschi etwas aus –
  // eine Rolle, ein Gähnen, Hopsen, Umsehen, Niesen oder Verstecken im Papier.
  // Auswahl und Zeitpunkt fallen aus der Zykluszahl, so bleibt es unvorhersehbar.
  type Ambient = "rollen" | "gaehnen" | "hopsen" | "umsehen" | "nies" | "papier";
  let ambient: Ambient | null = null;
  let ambP = 0;
  let ambT = 0;
  if (!akt && !schlaf && z.phase > 0) {
    const arten: Ambient[] = ["rollen", "gaehnen", "hopsen", "umsehen", "nies", "papier"];
    const dauern = [2.6, 2.2, 1.8, 3.2, 3, 5];
    const zyklus = Math.floor(t / 42);
    const wahl = Math.min(5, Math.floor(rnd(zyklus * 3 + 11) * 6));
    const start = 5 + rnd(zyklus * 7 + 5) * 25;
    const lt = t - zyklus * 42 - start;
    if (lt >= 0 && lt < dauern[wahl]) {
      ambient = arten[wahl];
      ambP = lt / dauern[wahl];
      ambT = lt;
    }
  }

  const atem = Math.sin(t * 1.9);
  const wackeln = Math.sin(t * 6.3) * (schlaf ? 0 : 0.5);
  const pluster = z.funken > 0 ? 1.08 : 1;
  const koerper = (1 + atem * 0.026) * pluster;

  // Bewegung des ganzen Körpers
  let dx = 0;
  let dreh = 0;
  let hop = 0;
  if (akt === "spielen" || akt === "ball") {
    dx = pA < 0.75 ? Math.sin(pA * Math.PI * 2) * 6 * s : Math.sin(pA * 12) * 3 * s;
    if (pA > 0.62 && pA < 0.86) dreh = Math.sin(((pA - 0.62) / 0.24) * Math.PI) * -0.42;
  } else if (akt === "fuettern" || akt === "streicheln") {
    dx = Math.sin(t * 7) * 0.5 * s;
  } else if (kitzelt) {
    // Kichern: Flauschi zappelt und kugelt sich hin und her.
    dx = Math.sin(t * 31) * 1.5 * s;
    dreh = Math.sin(t * 19) * 0.12;
  } else if (krault) {
    // Schmiegt sich langsam in die streichelnde Hand.
    dreh = Math.sin(t * 3.4) * 0.06;
  } else if (niest) {
    // Luft holen … Hatschi! … und wieder fangen.
    if (pA < 0.4) dreh = -0.13 * (pA / 0.4);
    else if (pA < 0.62) { dreh = 0.2; dx = 2.5 * s; }
    else dreh = 0.2 * (1 - (pA - 0.62) / 0.38);
  } else if (tanzt) {
    dx = Math.sin(t * 4.2) * 5 * s;
    dreh = Math.sin(t * 4.2) * 0.11;
    hop = -Math.abs(Math.sin(t * 8.4)) * 4 * s;
  } else if (akt === "bahn" && !schlaf) {
    hop = -Math.abs(Math.sin(t * 6)) * 2.5 * s;
  } else if (horcht) {
    hop = -Math.sin(Math.min(1, pA * 5) * Math.PI) * 5 * s;
  } else if (akt === "wanne" && !schlaf) {
    hop = Math.sin(t * 3) * 1.2 * s;
  } else if (bommelt) {
    dreh = Math.sin(t * 9) * 0.04 * (1 - pA);
  } else if (ambient === "nies") {
    dx = ambT < 1.4 ? Math.sin(ambT * 22) * 1.4 * s : 0;
    if (ambT >= 1.4 && ambT < 1.9) dreh = -0.2;
  } else if (ambient === "rollen") {
    dreh = ambP * TAU; // eine ganze Rolle vorwärts
  } else if (ambient === "hopsen") {
    hop = -Math.abs(Math.sin(ambP * Math.PI * 3)) * 7 * s;
  }

  c.save();
  c.translate(x + dx, y);

  // Schatten am Boden (nicht in der Wanne und nicht auf dem Pferd)
  if (akt !== "wanne" && akt !== "pferd") ell(c, 0, 1 * s, k * 1.05, k * 0.2, "rgba(0,0,0,.26)");

  c.translate(0, hop);
  if (dreh) {
    c.translate(0, -k * 0.9);
    c.rotate(dreh);
    c.translate(0, k * 0.9);
  }

  const cy = -k * 0.92;
  const r = k * koerper;

  // Versteckt im Geschenkpapier: nur die Augen schauen heraus.
  if (ambient === "papier") {
    const pw = r * 2.3;
    const ph = r * 1.5;
    c.save();
    c.translate(0, -ph * 0.5);
    c.rotate(Math.sin(t * 3) * 0.04);
    c.fillStyle = "#e8c25a";
    c.beginPath();
    c.roundRect(-pw / 2, -ph / 2, pw, ph, r * 0.18);
    c.fill();
    c.fillStyle = "#b03a30";
    c.fillRect(-pw * 0.09, -ph / 2, pw * 0.18, ph);
    c.fillRect(-pw / 2, -ph * 0.12, pw, ph * 0.22);
    c.fillStyle = "#f7f4ec";
    c.beginPath();
    c.arc(0, -ph * 0.5 - r * 0.1, r * 0.2, 0, TAU);
    c.arc(-r * 0.3, -ph * 0.5 - r * 0.22, r * 0.16, 0, TAU);
    c.arc(r * 0.3, -ph * 0.5 - r * 0.22, r * 0.16, 0, TAU);
    c.fill();
    ell(c, -r * 0.3, -ph * 0.1, r * 0.13, r * 0.16, AUGEN);
    ell(c, r * 0.3, -ph * 0.1, r * 0.13, r * 0.16, AUGEN);
    kreis(c, -r * 0.26, -ph * 0.15, r * 0.05, "#ffffff");
    kreis(c, r * 0.34, -ph * 0.15, r * 0.05, "#ffffff");
    c.restore();
    c.restore();
    return;
  }

  /* ---- Das Ei: Flauschi vor dem Schlüpfen ---- */
  if (z.phase === 0) {
    const schaukel = akt === "waermen" ? Math.sin(t * 10) * 0.09 : Math.sin(t * 1.3) * (0.02 + z.wachstum * 0.012);
    c.save();
    c.translate(0, -k * 0.06);
    c.rotate(schaukel);
    // Schale mit violetten Tupfen – man ahnt schon, wer darin steckt.
    ell(c, 0, -k * 0.55, k * 0.6, k * 0.76, "#efe6d4");
    ell(c, -k * 0.12, -k * 0.68, k * 0.34, k * 0.44, "#f8f2e4");
    for (let i = 0; i < 7; i++) {
      const a = rnd(i + 21) * TAU;
      kreis(c, Math.cos(a) * k * 0.34, -k * 0.55 + Math.sin(a) * k * 0.5, k * (0.05 + rnd(i + 4) * 0.045), i % 2 ? "#cbb6f1" : "#8a6cc6");
    }
    // Mit jedem Wärmen wächst der Riss in der Schale.
    if (z.wachstum >= 1) {
      c.strokeStyle = "#8a6f4d";
      c.lineWidth = Math.max(0.6, k * 0.035);
      c.lineCap = "round";
      c.beginPath();
      const sprung = z.wachstum >= 2 ? 1 : 0.55;
      c.moveTo(-k * 0.3 * sprung, -k * 0.88);
      c.lineTo(-k * 0.12, -k * 0.74);
      c.lineTo(k * 0.06, -k * 0.9);
      c.lineTo(k * 0.2, -k * 0.76);
      if (z.wachstum >= 2) c.lineTo(k * 0.32 * sprung, -k * 0.88);
      c.stroke();
    }
    c.restore();
    if (akt === "waermen") {
      // Wärme-Herzchen steigen am Ei auf.
      for (let i = 0; i < 2; i++) {
        const ph = (t * 0.9 + i * 0.5) % 1;
        c.globalAlpha = 1 - ph;
        herz(c, (i ? 1 : -1) * k * (0.5 + ph * 0.3), -k * (0.9 + ph * 0.7), k * 0.1, "#f0a35e");
        c.globalAlpha = 1;
      }
    }
    c.restore();
    return;
  }

  /* ---- Fellkörper ---- */
  fell(c, cy, r, t);

  // Statisch aufgeladene Fusselkugel nach dem Bürsten
  if (z.funken > 0) {
    c.globalAlpha = clamp(z.funken / 5, 0, 1);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + t * 0.6;
      const r0 = r * 1.2;
      const r1 = r * (1.36 + rnd(i + 4) * 0.25);
      linie(c, Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.9, Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.9, "#9fe8ff", Math.max(0.5, k * 0.05));
      if (i % 3 === 0) {
        const fx = Math.cos(a) * r1;
        const fy = cy + Math.sin(a) * r1 * 0.9;
        linie(c, fx - k * 0.1, fy, fx + k * 0.1, fy + k * 0.12, "#d9f4ff", Math.max(0.5, k * 0.05));
      }
    }
    c.globalAlpha = 1;
  }

  /* ---- Ohren (schauen unter dem Fellrand der Mütze hervor) ---- */
  for (const seite of [-1, 1]) {
    const ex = seite * r * 0.78;
    const ey = cy - r * (horcht ? 0.6 : 0.52) + wackeln * r * 0.04;
    tuff(c, ex, ey, r * (horcht ? 0.34 : 0.3), FELL_SCHATTEN, 6, seite + 1);
    ell(c, ex - seite * r * 0.04, ey + r * 0.02, r * 0.14, r * 0.17, ROSA);
  }

  /* ---- Pfoten ---- */
  const hebe = pfote ? (pA < 0.22 ? pA / 0.22 : pA < 0.78 ? 1 : (1 - pA) / 0.22) : 0;
  for (const seite of [-1, 1]) {
    const hoch = seite === 1 ? weich(clamp(hebe, 0, 1)) : 0;
    const px = seite * r * (0.4 + hoch * 0.6);
    // Beim Kitzeln strampeln die Pfoten abwechselnd; beim Pfötchengeben hebt sie eine.
    const py = (kitzelt ? -Math.abs(Math.sin(t * 23 + seite * 1.2)) * r * 0.13 : 0) - hoch * r * 0.8;
    ell(c, px, py - r * 0.1, r * 0.26, r * 0.15, PFOTE);
    ell(c, px, py - r * 0.07, r * 0.16, r * 0.09, ROSA);
    for (let i = -1; i <= 1; i++) kreis(c, px + i * r * 0.11, py - r * 0.16, r * 0.045, ROSA);
    if (hoch > 0.9) {
      // Kleiner Stern: abgeklatscht!
      const sx = px + r * 0.34;
      const sy = py - r * 0.34;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI + t * 2;
        linie(c, sx - Math.cos(a) * r * 0.13, sy - Math.sin(a) * r * 0.13, sx + Math.cos(a) * r * 0.13, sy + Math.sin(a) * r * 0.13, "#ffe9a8", Math.max(0.5, r * 0.04));
      }
    }
  }

  /* ---- Gesicht ---- */
  const augenY = cy - r * 0.06;
  const kneift = !schlaf && (kitzelt || hatschi);
  const blinzelt = !schlaf && t % 4.3 < 0.13;
  const blickX = ambient === "umsehen" ? Math.sin(ambP * Math.PI * 2) * 0.9 : blick[0];
  const gaehnt = ambient === "gaehnen" && !schlaf;
  const bx = clamp(blickX, -1, 1) * r * 0.05;
  const by = clamp(blick[1], -1, 1) * r * 0.045;
  const gross = (horcht ? 1.18 : 1) * (z.phase === 1 ? 1.3 : z.phase === 2 ? 1.12 : 1);
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const seite of [-1, 1]) {
    const ex = seite * r * 0.34;
    c.strokeStyle = AUGEN;
    c.lineWidth = Math.max(0.6, r * 0.07);
    if (kneift) {
      // Zusammengekniffene Augen: > <
      c.beginPath();
      c.moveTo(ex + seite * r * 0.13, augenY - r * 0.11);
      c.lineTo(ex - seite * r * 0.07, augenY);
      c.lineTo(ex + seite * r * 0.13, augenY + r * 0.11);
      c.stroke();
    } else if (gaehnt) {
      c.beginPath();
      c.moveTo(ex - r * 0.12, augenY + r * 0.02);
      c.lineTo(ex + r * 0.12, augenY + r * 0.02);
      c.stroke();
    } else if (schlaf || lacht || freut) {
      // Geschlossenes Lid: oben (lachend, genießend) oder unten (schlafend)
      c.beginPath();
      if (schlaf) c.arc(ex, augenY + r * 0.06, r * 0.15, Math.PI * 1.08, Math.PI * 1.92);
      else c.arc(ex, augenY + r * 0.1, r * 0.15, Math.PI * 1.12, Math.PI * 1.88);
      c.stroke();
    } else if (blinzelt) {
      c.beginPath();
      c.moveTo(ex - r * 0.12, augenY + r * 0.02);
      c.lineTo(ex + r * 0.12, augenY + r * 0.02);
      c.stroke();
    } else {
      ell(c, ex + bx, augenY + by, r * 0.13 * gross, r * 0.155 * gross, AUGEN);
      kreis(c, ex + bx + r * 0.05, augenY + by - r * 0.055, r * 0.052 * gross, "#ffffff");
      kreis(c, ex + bx - r * 0.045, augenY + by + r * 0.06, r * 0.024, "rgba(255,255,255,.7)");
    }
  }
  // Nase
  const naseY = cy + r * 0.16;
  c.fillStyle = "#e58a95";
  c.beginPath();
  c.moveTo(-r * 0.11, naseY - r * 0.05);
  c.quadraticCurveTo(0, naseY - r * 0.12, r * 0.11, naseY - r * 0.05);
  c.quadraticCurveTo(r * 0.07, naseY + r * 0.1, 0, naseY + r * 0.11);
  c.quadraticCurveTo(-r * 0.07, naseY + r * 0.1, -r * 0.11, naseY - r * 0.05);
  c.fill();
  kreis(c, -r * 0.035, naseY - r * 0.035, r * 0.025, "rgba(255,255,255,.6)");

  // Mund
  const offen = gaehnt
    || akt === "napf" && Math.floor(t * 7) % 2 === 0
    || (akt === "fuettern" && pA > 0.45 && pA < 0.9)
    || (lacht && Math.floor(t * 6) % 2 === 0)
    || (!schlaf && (kitzelt || hatschi))
    || (tanzt && Math.floor(t * 4.2) % 2 === 0)
    || (kaut && Math.floor(t * 8) % 2 === 0);
  if (offen) {
    ell(c, 0, naseY + r * 0.24, r * 0.16, r * 0.13, "#7a3540");
    ell(c, 0, naseY + r * 0.29, r * 0.09, r * 0.05, "#e58a95");
  } else {
    c.strokeStyle = AUGEN;
    c.lineWidth = Math.max(0.5, r * 0.055);
    c.beginPath();
    c.arc(-r * 0.1, naseY + r * 0.12, r * 0.11, 0.1, Math.PI * 0.9);
    c.arc(r * 0.1, naseY + r * 0.12, r * 0.11, 0.1, Math.PI * 0.9);
    c.stroke();
  }

  // Wangen
  const rot = freut || kitzelt ? "rgba(240,140,165,.72)" : "rgba(240,150,170,.5)";
  ell(c, -r * 0.58, cy + r * 0.2, r * 0.19, r * 0.12, rot);
  ell(c, r * 0.58, cy + r * 0.2, r * 0.19, r * 0.12, rot);

  // Schnurrhaare
  for (const seite of [-1, 1]) {
    linie(c, seite * r * 0.42, cy + r * 0.18, seite * r * 0.98, cy + r * 0.1, "rgba(92,74,140,.7)", Math.max(0.4, r * 0.03));
    linie(c, seite * r * 0.42, cy + r * 0.26, seite * r * 0.98, cy + r * 0.3, "rgba(92,74,140,.7)", Math.max(0.4, r * 0.03));
  }

  /* ---- Puderzuckernase ---- */
  if (z.zucker > 0) {
    c.globalAlpha = 0.35 + 0.55 * clamp(z.zucker / 7, 0, 1);
    for (let i = 0; i < 9; i++) {
      const a = rnd(i + 2) * TAU;
      const rr = r * (0.1 + rnd(i + 9) * 0.24);
      kreis(c, Math.cos(a) * rr * 0.5, naseY + r * 0.05 + Math.sin(a) * rr * 0.35, Math.max(0.4, r * 0.05), "#ffffff");
    }
    c.globalAlpha = 1;
  }

  /* ---- Zugedeckt: karierte Minidecke bis unter die Nase ---- */
  if (schlaf && z.decke) {
    const oben = cy + r * 0.38;
    const decke = () => {
      c.beginPath();
      c.moveTo(-r * 1.14, oben + r * 0.1);
      c.quadraticCurveTo(0, oben - r * 0.18, r * 1.14, oben + r * 0.1);
      c.quadraticCurveTo(r * 1.34, -r * 0.2, r * 1.22, r * 0.05);
      c.lineTo(-r * 1.22, r * 0.05);
      c.quadraticCurveTo(-r * 1.34, -r * 0.2, -r * 1.14, oben + r * 0.1);
      c.closePath();
    };
    c.fillStyle = "#2f6b4a";
    decke();
    c.fill();
    c.save();
    decke();
    c.clip();
    const strich = Math.max(0.5, r * 0.04);
    for (let i = -5; i <= 5; i++) linie(c, i * r * 0.28, oben - r * 0.3, i * r * 0.28 + r * 0.08, r * 0.1, "rgba(243,231,205,.45)", strich);
    for (let j = 0; j < 3; j++) linie(c, -r * 1.4, oben + r * (0.22 + j * 0.2), r * 1.4, oben + r * (0.22 + j * 0.2), "rgba(201,69,58,.8)", strich);
    c.restore();
    c.strokeStyle = "#f3e7cd";
    c.lineWidth = Math.max(0.8, r * 0.1);
    c.beginPath();
    c.moveTo(-r * 1.12, oben + r * 0.1);
    c.quadraticCurveTo(0, oben - r * 0.18, r * 1.12, oben + r * 0.1);
    c.stroke();
  }

  /* ---- Die viel zu große Weihnachtsmütze ----
     Klassische Form: roter Kegel mit genau EINEM Zipfel, der zur Seite fällt,
     ein durchgehender weißer Fellrand und eine weiße Bommel am Zipfelende. */
  // Bommel angestupst: die Mütze rutscht kurz über die Augen und wird zurückgeschoben.
  const rutsch = bommelt && !schlaf ? weich(clamp((pA - 0.2) / 0.16, 0, 1)) * (1 - weich(clamp((pA - 0.7) / 0.2, 0, 1))) : 0;
  const tiefe = schlaf ? 1 : rutsch;
  const my = cy - r * (0.56 - 0.42 * tiefe); // Fellrand: auf der Stirn, im Schlaf über den Augen
  const mb = r * 0.88; // halbe Breite am Fellrand
  const wipp = schlaf ? 0
    : Math.sin(t * 2.3) * r * 0.03
      + (kitzelt ? Math.sin(t * 29) * r * 0.05 : 0)
      + (bommelt ? Math.sin(t * 17) * r * 0.2 * (1 - pA) : 0)
      + (tanzt ? Math.sin(t * 8.4) * r * 0.07 : 0);
  const zx = r * 1.42 + wipp * 0.6; // Zipfelende
  const zy = my + r * 0.1 + wipp;
  const muetze = () => {
    c.beginPath();
    c.moveTo(-mb, my);
    c.bezierCurveTo(-r * 0.8, my - r * 0.45, -r * 0.42, my - r * 1.18, r * 0.2, my - r * 1.28);
    // Die Spitze knickt um und fällt als ein satter Zipfel an der Seite herab.
    c.bezierCurveTo(r * 0.8, my - r * 1.26, r * 1.6, my - r * 0.78, zx, zy);
    c.bezierCurveTo(r * 1.22, my - r * 0.12, r * 1.02, my - r * 0.34, r * 0.9, my - r * 0.4);
    c.bezierCurveTo(r * 0.9, my - r * 0.26, mb, my - r * 0.12, mb, my);
    c.closePath();
  };
  c.fillStyle = MUETZE;
  muetze();
  c.fill();
  // Knickfalte und Lichtkante – beides bleibt innerhalb der Mützenform.
  c.save();
  muetze();
  c.clip();
  c.fillStyle = "rgba(120,32,26,.6)";
  c.beginPath();
  c.ellipse(r * 0.8, my - r * 0.69, r * 0.065, r * 0.36, -0.42, 0, TAU);
  c.fill();
  c.fillStyle = "rgba(255,255,255,.16)";
  c.beginPath();
  c.ellipse(-r * 0.36, my - r * 0.62, r * 0.1, r * 0.46, 0.5, 0, TAU);
  c.fill();
  c.restore();
  // Fellrand: ein durchgehendes, flauschiges Band (erst der Schatten, dann das Weiß).
  for (const lage of [0, 1]) {
    c.fillStyle = lage === 0 ? "#d9d2c3" : WEISS;
    for (let i = 0; i < 10; i++) {
      const p = i / 9;
      c.beginPath();
      c.arc((p * 2 - 1) * mb * 1.05, my + Math.sin(p * Math.PI) * r * 0.07 + (lage === 0 ? r * 0.055 : 0), r * 0.17, 0, TAU);
      c.fill();
    }
  }
  // Bommel: eine einzige weiße Kugel am Zipfelende.
  const bommelX = zx + r * 0.02;
  const bommelY = zy + r * 0.12;
  kreis(c, bommelX + r * 0.02, bommelY + r * 0.04, r * 0.27, "#d9d2c3");
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    kreis(c, bommelX + Math.cos(a) * r * 0.17, bommelY + Math.sin(a) * r * 0.17, r * 0.1, WEISS);
  }
  kreis(c, bommelX, bommelY, r * 0.2, WEISS);

  /* ---- Angefasst: Herzchen, Kicherstriche, Hatschi-Wolke ---- */
  if (krault) {
    for (let i = 0; i < 3; i++) {
      const ph = pA * 1.5 - i * 0.24;
      if (ph <= 0 || ph >= 1) continue;
      const hx = [-1.25, 1.95, -0.78][i] * r + Math.sin(ph * 6 + i) * r * 0.07;
      const hy = cy - r * (0.45 + ph) - (i === 2 ? r * 0.95 : 0);
      c.globalAlpha = clamp(1.3 - ph * 1.3, 0, 1);
      herz(c, hx, hy, r * (0.13 + ph * 0.05), "#f08a9c");
      c.globalAlpha = 1;
    }
  } else if (kitzelt) {
    // Kicherstriche links und rechts vom Bauch.
    for (let i = 0; i < 6; i++) {
      if ((Math.floor(t * 14) + i) % 3 === 0) continue;
      const seite = i < 3 ? -1 : 1;
      const a = ((i % 3) - 1) * 0.42;
      const x0 = seite * r * 1.3;
      const y0 = cy + r * 0.25 + ((i % 3) - 1) * r * 0.26;
      linie(c, x0, y0, x0 + seite * Math.cos(a) * r * 0.24, y0 + Math.sin(a) * r * 0.24, "#ffe9a8", Math.max(0.5, r * 0.05));
    }
    // Zwei Lachtränen, solange sie wach ist.
    if (!schlaf) {
      for (const seite of [-1, 1]) {
        const ph = (t * 2.6 + (seite > 0 ? 0.5 : 0)) % 1;
        c.globalAlpha = 1 - ph;
        kreis(c, seite * r * (0.62 + ph * 0.5), cy - r * 0.12 + (ph * ph - ph * 0.4) * r * 0.5, Math.max(0.4, r * 0.05), "#bfe6ff");
        c.globalAlpha = 1;
      }
    }
  } else if (niest && pA >= 0.4) {
    // Hatschi: eine kleine Wolke stiebt von der Nase weg.
    const ph = (pA - 0.4) / 0.6;
    c.globalAlpha = clamp(1 - ph, 0, 1);
    for (let i = 0; i < 12; i++) {
      const a = 0.25 + rnd(i + 3) * 1.1 - 0.2;
      const weit = r * (0.3 + ph * (0.9 + rnd(i + 8) * 1.1));
      kreis(c, Math.cos(a) * weit * (i % 2 ? 1 : -0.7), naseY + Math.sin(a) * weit * 0.55, r * (0.05 + rnd(i) * 0.06), "#ffffff");
    }
    c.globalAlpha = 1;
  } else if (tanzt) {
    // Zwei Noten wippen über dem Kopf mit.
    for (let i = 0; i < 2; i++) {
      const ph = (t * 0.7 + i * 0.5) % 1;
      c.globalAlpha = 1 - ph;
      note(c, (i ? 1 : -1) * r * (1.1 + ph * 0.4), cy - r * (1.0 + ph * 0.9), r * 0.16, "#ffe9a8");
      c.globalAlpha = 1;
    }
  }

  /* ---- Schnarchmelodie ---- */
  if (schlaf) {
    const ph = (t * 0.55) % 1;
    for (let i = 0; i < 3; i++) {
      const p2 = (ph + i * 0.33) % 1;
      const sx = r * (1.35 + p2 * 0.5);
      const sy = cy - r * (0.5 + p2 * 1.3);
      const gr = r * (0.07 + p2 * 0.12);
      c.globalAlpha = clamp(0.75 - p2 * 0.8, 0, 1);
      c.strokeStyle = "#dfe9f2";
      c.lineWidth = Math.max(0.4, r * 0.035);
      c.beginPath();
      c.arc(sx, sy, gr, 0, TAU);
      c.stroke();
      if (i === 2) note(c, sx - gr * 0.3, sy + gr * 0.4, gr * 0.7, "#dfe9f2");
      c.globalAlpha = 1;
    }
  }

  /* ---- Pflegeaktionen: Plätzchen, Bürste, Schneekugel ---- */
  if (akt === "fuettern" && pA > 0 && pA < 0.92) {
    const w = clamp(pA / 0.6, 0, 1);
    c.save();
    c.translate(-r * 2.6 * (1 - w), -r * 0.5 - Math.sin(w * Math.PI) * r * 0.7);
    c.rotate(w * 4);
    kreis(c, 0, 0, r * 0.3, "#d9a35a");
    kreis(c, 0, -r * 0.02, r * 0.26, "#e8b76c");
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      kreis(c, Math.cos(a) * r * 0.13, Math.sin(a) * r * 0.13, r * 0.035, "#7a4a22");
    }
    c.restore();
    if (w > 0.7) {
      for (let i = 0; i < 5; i++) {
        const f = rnd(i + Math.floor(t * 9));
        kreis(c, -r * 0.2 + f * r * 0.4, naseY + r * 0.3 + f * r * 0.4, r * 0.04, "#e8b76c");
      }
    }
  } else if ((akt === "streicheln" || akt === "buerste") && pA > 0 && pA < 1) {
    c.save();
    c.translate(Math.sin(pA * Math.PI * 3) * r * 0.7 + r * 0.3, cy - r * 1.1 + Math.sin(pA * Math.PI * 6) * r * 0.1);
    c.rotate(-0.5 + Math.sin(pA * Math.PI * 3) * 0.2);
    c.fillStyle = "#8a5a34";
    c.beginPath();
    c.roundRect(-r * 0.5, -r * 0.16, r * 1.0, r * 0.24, r * 0.08);
    c.fill();
    c.fillStyle = "#4a3220";
    c.beginPath();
    c.roundRect(-r * 0.5, 0.04 * r, r * 1.0, r * 0.2, r * 0.06);
    c.fill();
    for (let i = 0; i < 9; i++) {
      const bxx = -r * 0.45 + (i / 8) * r * 0.9;
      linie(c, bxx, r * 0.22, bxx, r * 0.4, "#e5dcc8", Math.max(0.4, r * 0.035));
    }
    c.restore();
    // Schnurren: kleine Wellen, die an beiden Seiten wegziehen.
    for (let i = 0; i < 2; i++) {
      const ph = (t * 1.6 + i * 0.5) % 1;
      c.globalAlpha = clamp(1 - ph, 0, 1) * 0.7;
      c.strokeStyle = "#ffffff";
      c.lineWidth = Math.max(0.4, r * 0.04);
      c.beginPath();
      const y0 = cy + r * (0.3 - ph * 0.6);
      const seite = i === 0 ? -1 : 1;
      const x0 = seite * r * 1.25;
      c.moveTo(x0, y0);
      for (let q = 0; q <= 8; q++) c.lineTo(x0 + seite * (q / 8) * r * 0.55, y0 + Math.sin(q * 1.6 + t * 6) * r * 0.07);
      c.stroke();
      c.globalAlpha = 1;
    }
  } else if ((akt === "spielen" || akt === "ball") && pA > 0 && pA < 1) {
    c.save();
    c.translate(r * (2.6 - pA * 4.4), -r * 0.2);
    c.rotate(t * 5);
    kreis(c, 0, 0, r * 0.36, "#cfe0ec");
    kreis(c, -r * 0.09, -r * 0.1, r * 0.28, "#f4f9fd");
    c.fillStyle = "rgba(180,205,225,.7)";
    for (let i = 0; i < 5; i++) {
      const a = rnd(i + 3) * TAU;
      c.beginPath();
      c.arc(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2, r * 0.045, 0, TAU);
      c.fill();
    }
    c.restore();
    if (pA > 0.62) {
      for (let i = 0; i < 6; i++) {
        const f = rnd(i + 7);
        kreis(c, -r * 0.6 + f * r * 1.2, -r * (0.1 + f * 0.4), r * 0.05, "#ffffff");
      }
    }
  }

  /* ---- Niesen im Leerlauf: die Schleife vom Paket fliegt weg ---- */
  if (ambient === "nies" && ambT >= 1.2) {
    const w = (ambT - 1.2) / 1.8;
    c.save();
    c.translate(r * (0.6 + w * 3.4), -r * (0.4 + w * 1.6) + w * w * r * 2.4);
    c.rotate(w * 7);
    c.globalAlpha = clamp(1 - w, 0, 1);
    c.strokeStyle = "#c9453a";
    c.lineWidth = Math.max(0.6, r * 0.11);
    c.beginPath();
    c.arc(0, 0, r * 0.3, 0.4, TAU - 0.4);
    c.stroke();
    c.strokeStyle = "#e8c25a";
    c.lineWidth = Math.max(0.5, r * 0.06);
    c.beginPath();
    c.moveTo(-r * 0.2, -r * 0.2);
    c.lineTo(r * 0.3, r * 0.3);
    c.moveTo(r * 0.2, -r * 0.2);
    c.lineTo(-r * 0.3, r * 0.3);
    c.stroke();
    c.globalAlpha = 1;
    c.restore();
    for (let i = 0; i < 7; i++) {
      const f = rnd(i + 13);
      kreis(c, r * (0.5 + f) * (1 + w), -r * (0.2 + f * 0.5) + w * r * 2 * f, r * 0.05 * (1 - w * 0.5), "rgba(255,255,255,.85)");
    }
  }

  c.restore();
}
