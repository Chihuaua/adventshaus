/* =======================================================================
   LAVALAMPE (90er-Jahre-Doppelkegelform mit blauem Wachs)
   Steht im Gaming-Zimmer oben auf dem Spieleregal und lässt sich ein- und
   ausschalten. Reines Canvas 2D ohne externe Assets (KI-START Grundsatz 4).

   Thermik & Wachsphysik:
   - Aufwärmen (0 → 1 über WARM_DAUER): Das erstarrte Wachs wird von unten
     beleuchtet, sinkt aus seiner Erkaltungsform weich zusammen, treibt
     typische Aufwärm-Türme/Ausstülpungen nach oben, schnürt dann erste
     träge große Tropfen ab und geht mit zunehmender Wärme in lebhaftere
     Konvektion mit mehreren unterschiedlich großen Wachstropfen über.
   - Abkühlen (1 → 0 über KALT_DAUER): Die Heizlampe erlischt sofort;
     aufsteigende Tropfen verlieren Auftrieb, sinken langsam zu Boden und
     erstarren zufällig in einer von fünf typischen Erkaltungsformen.
   ======================================================================= */

export type C = CanvasRenderingContext2D;

/** Dauer in Sekunden vom kalten Zustand bis zur vollen Betriebswärme. */
export const LAVA_WARM_DAUER = 48;
/** Dauer in Sekunden von voller Betriebswärme bis zum völligen Erstarren. */
export const LAVA_KALT_DAUER = 56;

export const ERKALTUNGS_FORMEN = [
  "kuppel",
  "turm",
  "doppelkugel",
  "krater",
  "schwebend",
] as const;

export type ErkaltungsForm = (typeof ERKALTUNGS_FORMEN)[number];

export interface LavaTropfen {
  /** Horizontale Lage im Glas (-1 .. 1). */
  x: number;
  /** Vertikale Lage im Glas (0 = Heizboden, 1 = Flaschenhals). */
  y: number;
  vx: number;
  vy: number;
  /** Grundradius in Bühneneinheiten. */
  r: number;
  /** Eigene Wachstemperatur (0 = kalt/schwer, 1 = heiß/leicht). */
  temp: number;
  /** Individuelle Trägheit/Heizfaktor für abwechslungsreiche Ablösung. */
  eigen: number;
}

export interface LavaLampeStand {
  an: boolean;
  /** Gesamtwärme der Lampe (0 = völlig erkaltet, 1 = voll durchgeheizt). */
  waerme: number;
  /** Welche typische Form das Wachs im kalten Zustand annimmt. */
  form: ErkaltungsForm;
  /** Zufallskeim für Richtung und Proportionen der Erkaltungsform. */
  formSeed: number;
  /** Innere Animationszeit in Sekunden. */
  zeit: number;
  /** Position des sich ablösenden Kopfstücks bei Form „schwebend“ (0..1). */
  kopfStueckY: number;
  tropfen: LavaTropfen[];
}

/** Kompakte Schlüssel/Wert-Darstellung für HausSnapshot (SD-Karten-tauglich). */
export interface LavaSnapshot {
  an: boolean;
  waerme: number;
  form: ErkaltungsForm;
  formSeed: number;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const glatt = (v: number) => {
  const x = clamp(v, 0, 1);
  return x * x * (3 - 2 * x);
};

function pseudo(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function erzeugeTropfen(seed: number): LavaTropfen[] {
  // Fünf Wachsportions-Kerne unterschiedlicher Größe (vom Haupttropfen bis zum Satelliten)
  const radien = [2.05, 1.72, 1.45, 1.18, 0.92];
  return radien.map((r, i) => ({
    x: (pseudo(seed + i * 7.3) - 0.5) * 0.7,
    y: 0.04 + i * 0.015,
    vx: 0,
    vy: 0,
    r,
    temp: 0,
    eigen: 0.86 + pseudo(seed + i * 13.7) * 0.3,
  }));
}

export function ZufallsForm(seed: number): ErkaltungsForm {
  const idx = Math.floor(pseudo(seed) * ERKALTUNGS_FORMEN.length) % ERKALTUNGS_FORMEN.length;
  return ERKALTUNGS_FORMEN[idx];
}

export function erstelleLavaLampe(an = true, waerme = 0.08, seed = 1995): LavaLampeStand {
  const form = ZufallsForm(seed);
  const w = clamp(waerme, 0, 1);
  const tropfen = erzeugeTropfen(seed);
  if (w > 0.55) {
    tropfen.forEach((tr, i) => {
      tr.y = 0.14 + ((i * 0.21) % 0.72);
      tr.temp = 0.46 + (i % 2) * 0.22 * w;
    });
  }
  return {
    an,
    waerme: w,
    form,
    formSeed: seed,
    zeit: 0,
    kopfStueckY: form === "schwebend" ? 0.9 : 0,
    tropfen,
  };
}

/** Schaltet die Lavalampe um; beim Ausschalten aus warmem Zustand entsteht eine neue Erkaltungsform. */
export function schalteLavaLampe(s: LavaLampeStand, zufall = Math.random()): void {
  s.an = !s.an;
  if (!s.an && s.waerme > 0.22) {
    const neuSeed = Math.round((zufall * 9000 + s.zeit * 37 + s.formSeed * 1.7) % 10000) + 1;
    // Andere Form als direkt zuvor bevorzugen, damit Abwechslung sichtbar wird
    let form = ZufallsForm(neuSeed);
    if (form === s.form) {
      form = ERKALTUNGS_FORMEN[(ERKALTUNGS_FORMEN.indexOf(form) + 1 + Math.floor(zufall * 4)) % ERKALTUNGS_FORMEN.length];
    }
    s.form = form;
    s.formSeed = neuSeed;
    s.kopfStueckY = form === "schwebend" ? 0.9 : 0;
  } else if (s.an && s.waerme < 0.05 && s.form === "schwebend") {
    s.kopfStueckY = 0.9;
  }
}

/** Simulationsschritt (in kleinen Teilschritten stabil auch für größere Echtzeit-Sprünge). */
export function updateLavaLampe(s: LavaLampeStand, dtSek: number): void {
  let rest = clamp(dtSek, 0, 600);
  while (rest > 0) {
    const dt = Math.min(rest, 0.05);
    rest -= dt;
    s.zeit += dt;

    if (s.an) {
      s.waerme = clamp(s.waerme + dt / LAVA_WARM_DAUER, 0, 1);
    } else {
      s.waerme = clamp(s.waerme - dt / LAVA_KALT_DAUER, 0, 1);
    }

    const w = s.waerme;

    // Oben haftendes kaltes Wachsstück („schwebend“) löst sich beim Erwärmen und sinkt ein
    if (s.kopfStueckY > 0.06) {
      if (s.an && w > 0.26) {
        s.kopfStueckY = Math.max(0.05, s.kopfStueckY - dt * (0.35 + w * 0.9));
      } else if (!s.an && w > 0.3) {
        s.kopfStueckY = lerp(s.kopfStueckY, 0.9, dt * 0.6);
      }
    }

    // Wie viele Tropfen bei aktueller Wärme überhaupt aktiv aufsteigen können:
    // erst 1 träger Haupttropfen ab ~0.34, mit zunehmender Wärme bis zu alle 5.
    const aktivSchwelle = [0.32, 0.48, 0.62, 0.76, 0.88];

    for (let i = 0; i < s.tropfen.length; i++) {
      const tr = s.tropfen[i];
      const freigegeben = s.an && w >= aktivSchwelle[i];

      // Wärmeaustausch: unten am Heizkegel wird das Wachs heiß, oben kühlt es ab
      if (s.an && tr.y < 0.24 && freigegeben) {
        const heiz = (1 - tr.y / 0.24) * (0.32 + 0.62 * w) * tr.eigen;
        tr.temp = clamp(tr.temp + heiz * dt, 0, 1);
      } else if (tr.y > 0.66 || !s.an || !freigegeben) {
        const kuehlBasis = !s.an ? 0.42 : tr.y > 0.66 ? 0.16 + ((tr.y - 0.66) / 0.34) * (0.38 - 0.1 * w) : 0.05;
        tr.temp = clamp(tr.temp - kuehlBasis * dt, 0, 1);
      } else {
        // Auf halber Höhe nur ganz langsamer Wärmeverlust
        tr.temp = clamp(tr.temp - 0.035 * dt, 0, 1);
      }

      // Auftrieb gegen Schwerkraft (Dichteunterschied durch Temperatur)
      const neutral = 0.5;
      let kraftY: number;
      if (!s.an) {
        // Ausgeschaltet: rasch nachlassender Restauftrieb, sanftes Absinken ins Bodenwachs
        kraftY = (tr.temp - 0.62) * 0.45 - 0.22 * (1 - w * 0.4);
      } else if (!freigegeben && tr.y < 0.12) {
        // Noch zu kühl zum Ablösen: bleibt im Bodenpool
        kraftY = -0.35;
      } else {
        const beweglichkeit = 0.35 + 0.95 * w;
        kraftY = (tr.temp - neutral) * 0.95 * beweglichkeit;
        // Oberflächenspannung hält den Tropfen unten kurz fest, bis er heiß genug zum Abschnüren ist
        if (tr.y < 0.13 && tr.temp < 0.58) kraftY -= 0.18;
      }

      // Viskose Dämpfung (kaltes Wachs ist deutlich zäher als heißes)
      const zaeh = lerp(4.8, 1.85, w);
      tr.vy += (kraftY - tr.vy * zaeh) * dt;
      tr.y += tr.vy * dt;

      // Sanfte seitliche Konvektionsdrift zur Mitte beim Aufsteigen, leicht außen beim Absinken
      const zielX =
        Math.sin(s.zeit * (0.45 + i * 0.13) + i * 2.1) * (0.28 + 0.24 * w) +
        (tr.vy < -0.02 ? (i % 2 === 0 ? -0.18 : 0.18) : 0);
      tr.vx += ((zielX - tr.x) * 1.4 - tr.vx * 2.6) * dt;
      tr.x = clamp(tr.x + tr.vx * dt, -0.68, 0.68);

      // Untere und obere Begrenzung im Glas
      if (tr.y <= 0.04) {
        tr.y = 0.04;
        if (tr.vy < 0) tr.vy = 0;
      } else if (tr.y >= 0.91) {
        tr.y = 0.91;
        if (tr.vy > 0) tr.vy *= -0.15;
      }
    }
  }
}

export function lavaSnapshot(s: LavaLampeStand): LavaSnapshot {
  return {
    an: s.an,
    waerme: Math.round(s.waerme * 1000) / 1000,
    form: s.form,
    formSeed: s.formSeed,
  };
}

export function ladeLavaLampe(snap: LavaSnapshot | null | undefined, vergangeneSek = 0): LavaLampeStand {
  if (!snap || typeof snap.an !== "boolean") return erstelleLavaLampe(true, 0.08, 1995);
  const form = ERKALTUNGS_FORMEN.includes(snap.form) ? snap.form : "kuppel";
  const s = erstelleLavaLampe(snap.an, clamp(Number(snap.waerme) || 0, 0, 1), Number(snap.formSeed) || 1995);
  s.form = form;
  s.kopfStueckY = form === "schwebend" && s.waerme < 0.26 ? 0.9 : 0;
  if (vergangeneSek > 0) {
    // Bei längerer Abwesenheit den Endwert direkt nähern und kurz einschwingen
    if (vergangeneSek > 120) {
      s.waerme = s.an ? 1 : 0;
      s.kopfStueckY = !s.an && s.form === "schwebend" ? 0.9 : 0;
      updateLavaLampe(s, 8);
    } else {
      updateLavaLampe(s, vergangeneSek);
    }
  }
  return s;
}

/* ------------------------------ Zeichnen ------------------------------- */

/** Halbe Innenbreite der konischen 90er-Glasflasche auf Höhe u (0 = unten, 1 = oben). */
function glasHalbBreite(u: number): number {
  // Unten an der Einschnürung breit (±4.3), nach oben zum Hals schlank zulaufend (±2.15)
  const bauch = Math.sin(clamp(u, 0, 1) * Math.PI) * 0.35;
  return lerp(4.25, 2.1, clamp(u, 0, 1)) + bauch;
}

function glasPfad(c: C, cx: number, yUnten: number, yOben: number): void {
  const h = yUnten - yOben;
  const b0 = glasHalbBreite(0);
  const b1 = glasHalbBreite(1);
  c.beginPath();
  c.moveTo(cx - b0, yUnten);
  c.bezierCurveTo(cx - b0 - 0.35, yUnten - h * 0.34, cx - b1 - 0.45, yOben + h * 0.32, cx - b1, yOben);
  c.lineTo(cx + b1, yOben);
  c.bezierCurveTo(cx + b1 + 0.45, yOben + h * 0.32, cx + b0 + 0.35, yUnten - h * 0.34, cx + b0, yUnten);
  c.closePath();
}

function wachsTropfenPfad(c: C, x: number, y: number, rx: number, ry: number, obenSpitz = 0): void {
  c.beginPath();
  c.moveTo(x, y - ry * (1 + obenSpitz * 0.35));
  c.bezierCurveTo(x + rx * 0.95, y - ry * 0.55, x + rx * 1.05, y + ry * 0.55, x, y + ry);
  c.bezierCurveTo(x - rx * 1.05, y + ry * 0.55, x - rx * 0.95, y - ry * 0.55, x, y - ry * (1 + obenSpitz * 0.35));
  c.closePath();
}

/**
 * Zeichnet die 90er-Jahre-Lavalampe stehend auf (cx, yFuss).
 * Gesamthöhe ~25 Einheiten (Fuss bis Kappe), Breite ~9.2 Einheiten.
 */
export function drawLavaLampe(c: C, cx: number, yFuss: number, s: LavaLampeStand): void {
  const w = s.waerme;
  const licht = s.an ? 0.65 + 0.35 * w : w * 0.22;

  // Geometrie der typischen 90er-Astro-Form:
  // [yFuss - 7.4 .. yFuss]       Doppelkegel-Metallsockel mit Einschnürung
  // [yFuss - 21.2 .. yFuss - 7.4] Konische Glasflasche (Höhe 13.8)
  // [yFuss - 25.0 .. yFuss - 21.2] Gebürstete Metallkappe (Höhe 3.8)
  const yGlasUnten = yFuss - 7.4;
  const yGlasOben = yFuss - 21.2;
  const glasH = yGlasUnten - yGlasOben;
  const yTaille = yFuss - 4.1;
  const yKappeOben = yFuss - 25.0;

  c.save();

  // Sanfter blauer Raumschein hinter der Lampe, wenn sie eingeschaltet ist
  if (licht > 0.04) {
    const schein = c.createRadialGradient(cx, yGlasUnten - glasH * 0.42, 1.5, cx, yGlasUnten - glasH * 0.42, 18 + 8 * w);
    schein.addColorStop(0, `rgba(68, 164, 255, ${(0.24 * licht).toFixed(3)})`);
    schein.addColorStop(0.55, `rgba(38, 112, 224, ${(0.09 * licht).toFixed(3)})`);
    schein.addColorStop(1, "rgba(20, 70, 180, 0)");
    c.fillStyle = schein;
    c.beginPath();
    c.arc(cx, yGlasUnten - glasH * 0.42, 18 + 8 * w, 0, Math.PI * 2);
    c.fill();
  }

  // ---- 1. Glasflasche & Flüssigkeit ----
  c.save();
  glasPfad(c, cx, yGlasUnten, yGlasOben);
  c.clip();

  const fluessig = c.createLinearGradient(cx, yGlasUnten, cx, yGlasOben);
  if (s.an) {
    fluessig.addColorStop(0, "#1d5785");
    fluessig.addColorStop(0.45, "#143b63");
    fluessig.addColorStop(1, "#0d2542");
  } else {
    fluessig.addColorStop(0, "#112844");
    fluessig.addColorStop(1, "#0a192d");
  }
  c.fillStyle = fluessig;
  c.fillRect(cx - 6, yGlasOben - 1, 12, glasH + 2);

  // Heizlicht von unten durch die Flüssigkeit
  if (s.an) {
    const birne = c.createRadialGradient(cx, yGlasUnten + 0.8, 0.4, cx, yGlasUnten - 2, 7.5);
    birne.addColorStop(0, "rgba(170, 232, 255, 0.55)");
    birne.addColorStop(0.5, "rgba(64, 158, 245, 0.22)");
    birne.addColorStop(1, "rgba(30, 90, 180, 0)");
    c.fillStyle = birne;
    c.fillRect(cx - 6, yGlasOben, 12, glasH);
  }

  // ---- 2. Blaues Wachs (Erkaltungsformen, Aufwärm-Türme & Konvektionstropfen) ----
  const wachsGrad = c.createLinearGradient(cx, yGlasUnten, cx, yGlasOben);
  if (s.an) {
    wachsGrad.addColorStop(0, "#7fd4ff"); // unten von der Glühbirne hell durchleuchtet
    wachsGrad.addColorStop(0.28, "#3584f7");
    wachsGrad.addColorStop(0.72, "#1f5ad6");
    wachsGrad.addColorStop(1, "#183ea8");
  } else {
    // Kaltes/erkaltendes Wachs: dichter, matter Kobaltton
    wachsGrad.addColorStop(0, lerpFarbe("#2b5999", "#4f9be8", w));
    wachsGrad.addColorStop(0.6, lerpFarbe("#1e4073", "#2564c9", w));
    wachsGrad.addColorStop(1, lerpFarbe("#162f57", "#1b499c", w));
  }
  c.fillStyle = wachsGrad;

  const seite = pseudo(s.formSeed + 3) > 0.5 ? 1 : -1;
  const kaltAnteil = 1 - glatt((w - 0.04) / 0.34); // 1 wenn kalt, 0 sobald geschmolzen
  const turmPhase = s.an ? Math.sin(clamp((w - 0.04) / 0.34, 0, 1) * Math.PI) : 0;

  // Grundkuppel am Flaschenboden (immer vorhanden, pulsiert weich bei Wärme)
  const bodenHoehe = lerp(2.5, 1.85, w) + Math.sin(s.zeit * 1.4) * 0.18 * w;
  c.beginPath();
  c.moveTo(cx - 4.6, yGlasUnten + 0.8);
  c.lineTo(cx - 4.6, yGlasUnten - bodenHoehe * 0.55);
  const kuppelGipfelX = cx + seite * 0.7 * kaltAnteil + Math.sin(s.zeit * 0.9) * 0.45 * w;
  const kuppelGipfelY = yGlasUnten - bodenHoehe - turmPhase * 2.8;
  c.quadraticCurveTo(kuppelGipfelX, kuppelGipfelY - 0.9, cx + 4.6, yGlasUnten - bodenHoehe * 0.5);
  c.lineTo(cx + 4.6, yGlasUnten + 0.8);
  c.closePath();
  c.fill();

  // Zufällige typische Erkaltungsformen (sichtbar im kalten & halbwarmen Zustand)
  if (kaltAnteil > 0.02) {
    const k = kaltAnteil;
    if (s.form === "turm") {
      // Erstarrter schiefer Tropfstein-Turm
      const hTurm = 5.6 * k;
      c.beginPath();
      c.moveTo(cx - 2.3, yGlasUnten - 1.1);
      c.quadraticCurveTo(cx + seite * 1.5, yGlasUnten - 1.4 - hTurm * 0.6, cx + seite * 0.9, yGlasUnten - 1.4 - hTurm);
      c.quadraticCurveTo(cx + seite * 2.2, yGlasUnten - 1.2 - hTurm * 0.45, cx + 2.3, yGlasUnten - 1.0);
      c.closePath();
      c.fill();
      wachsTropfenPfad(c, cx + seite * 0.85, yGlasUnten - 1.3 - hTurm, 1.05 * (0.5 + 0.5 * k), 1.2 * k);
      c.fill();
    } else if (s.form === "doppelkugel") {
      // Gestapelte Knubbel-Kugeln, die zäh aufeinander erstarrt sind
      wachsTropfenPfad(c, cx - seite * 0.7, yGlasUnten - 2.3 * k, 1.95, 1.45 * k);
      c.fill();
      wachsTropfenPfad(c, cx + seite * 0.55, yGlasUnten - 4.1 * k, 1.35 * (0.5 + 0.5 * k), 1.25 * k);
      c.fill();
    } else if (s.form === "krater") {
      // Schräg erstarrte Wachswelle an einer Glaswand + kleine Wachsperle darüber
      c.beginPath();
      c.moveTo(cx - 4.4 * seite, yGlasUnten - 0.8);
      c.quadraticCurveTo(cx + 1.4 * seite, yGlasUnten - 1.2, cx + 3.8 * seite, yGlasUnten - 4.4 * k);
      c.lineTo(cx + 4.4 * seite, yGlasUnten + 0.5);
      c.closePath();
      c.fill();
      wachsTropfenPfad(c, cx - seite * 1.3, yGlasUnten - 3.0 * k, 0.95 * k, 0.85 * k);
      c.fill();
    } else if (s.form === "kuppel") {
      // Ruhige runde Hügellinse mit kleiner seitlicher Perle
      wachsTropfenPfad(c, cx + seite * 0.3, yGlasUnten - 2.1 * k, 2.7, 1.65 * k);
      c.fill();
    }
  }

  // Oben am Wasserspiegel haftendes Wachs-Inselchen (Form „schwebend“)
  if (s.kopfStueckY > 0.08) {
    const ky = yGlasUnten - s.kopfStueckY * glasH;
    const hb = glasHalbBreite(s.kopfStueckY) * 0.62;
    wachsTropfenPfad(c, cx + seite * 0.25, ky + 0.5, hb, 0.95);
    c.fill();
  }

  // Typische Aufwärm-Ausstülpungen (Korallen-/Stalagmiten-Finger während der Schmelzphase)
  if (turmPhase > 0.04) {
    const hFinger = turmPhase * 4.6;
    const schwank = Math.sin(s.zeit * 1.7) * 0.45;
    wachsTropfenPfad(c, cx - seite * 0.8 + schwank, yGlasUnten - 2.0 - hFinger * 0.72, 1.25, 1.1 + hFinger * 0.42, 0.45);
    c.fill();
    if (w > 0.14) {
      wachsTropfenPfad(c, cx + seite * 1.15 - schwank * 0.6, yGlasUnten - 1.6 - hFinger * 0.48, 0.95, 0.9 + hFinger * 0.28, 0.3);
      c.fill();
    }
  }

  // Bewegliche Wachstropfen (erscheinen und lösen sich mit zunehmender Wärme)
  if (w > 0.2) {
    const sicht = clamp((w - 0.2) / 0.2, 0, 1);
    for (let i = 0; i < s.tropfen.length; i++) {
      const tr = s.tropfen[i];
      if (tr.y <= 0.055 && tr.vy <= 0.005 && w < 0.45) continue;
      const hb = Math.max(0.8, glasHalbBreite(tr.y) - 0.55);
      const tx = cx + clamp(tr.x * hb, -hb + 0.5, hb - 0.5);
      const ty = yGlasUnten - tr.y * glasH;
      const rEff = tr.r * (0.55 + 0.45 * sicht);

      // Natürliche Verformung: beim Steigen länglich, oben/unten leicht abgeplattet
      const geschw = Math.abs(tr.vy);
      const randStauch = tr.y > 0.82 ? (tr.y - 0.82) / 0.1 : tr.y < 0.14 ? (0.14 - tr.y) / 0.14 : 0;
      const wabbel = Math.sin(s.zeit * 2.6 + i * 1.9) * 0.08 * w;
      const rx = rEff * (1 - geschw * 0.35 + randStauch * 0.22 + wabbel);
      const ry = rEff * (1 + geschw * 0.55 - randStauch * 0.24 - wabbel);

      // Einschnür-Faden („Necking“), solange sich der Tropfen unten ablöst oder einschmilzt
      if (tr.y < 0.24) {
        const kHals = 1 - tr.y / 0.24;
        const halsBreite = rx * 0.58 * kHals;
        const poolY = yGlasUnten - bodenHoehe * 0.7;
        if (halsBreite > 0.18 && ty < poolY) {
          c.beginPath();
          c.moveTo(tx - rx * 0.75, poolY + 0.4);
          c.quadraticCurveTo(tx - halsBreite * 0.45, (ty + poolY) * 0.5, tx - rx * 0.55, ty + ry * 0.45);
          c.lineTo(tx + rx * 0.55, ty + ry * 0.45);
          c.quadraticCurveTo(tx + halsBreite * 0.45, (ty + poolY) * 0.5, tx + rx * 0.75, poolY + 0.4);
          c.closePath();
          c.fill();
        }
      }

      wachsTropfenPfad(c, tx, ty, Math.min(rx, hb * 0.88), ry, tr.vy > 0.02 ? 0.22 : 0);
      c.fill();

      // Heller innerer Lichtschimmer an der Unterseite jedes warmen Tropfens
      if (s.an && tr.y < 0.78) {
        c.fillStyle = `rgba(165, 228, 255, ${(0.28 * (1 - tr.y) * sicht).toFixed(3)})`;
        c.beginPath();
        c.ellipse(tx - rx * 0.15, ty + ry * 0.28, rx * 0.48, ry * 0.3, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = wachsGrad;
      }
    }
  }

  // Glas-Glanzstreifen links & zarte Innenkante rechts
  c.strokeStyle = "rgba(255, 255, 255, 0.34)";
  c.lineWidth = 0.85;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(cx - glasHalbBreite(0.08) + 0.85, yGlasUnten - 1.2);
  c.quadraticCurveTo(cx - glasHalbBreite(0.5) + 0.8, yGlasUnten - glasH * 0.5, cx - glasHalbBreite(0.92) + 0.65, yGlasOben + 1.2);
  c.stroke();

  c.strokeStyle = "rgba(170, 220, 255, 0.16)";
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(cx + glasHalbBreite(0.12) - 0.6, yGlasUnten - 1.6);
  c.lineTo(cx + glasHalbBreite(0.88) - 0.5, yGlasOben + 1.6);
  c.stroke();

  c.restore(); // Ende Glas-Clip

  // Feine Glaskontur außen
  glasPfad(c, cx, yGlasUnten, yGlasOben);
  c.strokeStyle = "rgba(205, 226, 248, 0.28)";
  c.lineWidth = 0.65;
  c.stroke();

  // ---- 3. Gebürsteter 90er-Jahre-Metallsockel (Doppelkegel / Sanduhr) & Kappe ----
  const metall = c.createLinearGradient(cx - 4.6, 0, cx + 4.6, 0);
  metall.addColorStop(0, "#555c68");
  metall.addColorStop(0.28, "#d4dce6");
  metall.addColorStop(0.55, "#9aa3b0");
  metall.addColorStop(0.85, "#4d535e");
  metall.addColorStop(1, "#6c7482");

  // Obere Kelchschale (Taille -> Glasboden)
  c.fillStyle = metall;
  c.beginPath();
  c.moveTo(cx - 2.25, yTaille);
  c.lineTo(cx - 4.45, yGlasUnten);
  c.lineTo(cx + 4.45, yGlasUnten);
  c.lineTo(cx + 2.25, yTaille);
  c.closePath();
  c.fill();

  // Unterer Standkegel (Fuss -> Taille)
  c.beginPath();
  c.moveTo(cx - 4.35, yFuss - 0.5);
  c.lineTo(cx - 2.25, yTaille);
  c.lineTo(cx + 2.25, yTaille);
  c.lineTo(cx + 4.35, yFuss - 0.5);
  c.closePath();
  c.fill();

  // Schwarzer Gummifuss + Taillenring + leuchtender Lichtspalt am Kragen
  c.fillStyle = "#1d2026";
  c.fillRect(cx - 4.4, yFuss - 0.7, 8.8, 0.7);
  c.strokeStyle = "rgba(30, 34, 42, 0.55)";
  c.lineWidth = 0.65;
  c.beginPath();
  c.moveTo(cx - 2.25, yTaille);
  c.lineTo(cx + 2.25, yTaille);
  c.stroke();

  // Kleiner Kippschalter / Betriebsleuchte unten am Sockel
  c.fillStyle = s.an ? "#6ee7ff" : "#39414d";
  c.beginPath();
  c.arc(cx + 1.8, yFuss - 1.9, 0.65, 0, Math.PI * 2);
  c.fill();

  // Metallkappe oben
  c.fillStyle = metall;
  c.beginPath();
  c.moveTo(cx - 2.25, yGlasOben + 0.2);
  c.lineTo(cx - 1.45, yKappeOben + 0.5);
  c.quadraticCurveTo(cx, yKappeOben - 0.35, cx + 1.45, yKappeOben + 0.5);
  c.lineTo(cx + 2.25, yGlasOben + 0.2);
  c.closePath();
  c.fill();

  c.restore();
}

function lerpFarbe(hexA: string, hexB: string, t: number): string {
  const k = clamp(t, 0, 1);
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, k));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, k));
  const bl = Math.round(lerp(a & 255, b & 255, k));
  return `rgb(${r},${g},${bl})`;
}
