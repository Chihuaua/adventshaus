/* =======================================================================
   LUNI-MONS — 24 Begleiter, eines hinter jedem Adventstürchen

   Angelehnt an bekannte Sammelwesen (Pokémon, Palworld), aber eigenständig
   weiterentwickelt: eigene Namen, eigene Silhouetten, eigene Farben.
   Alles Canvas-Primitive, keine Assets, keine Browser-APIs — Wii-tauglich.

   Diese Datei enthält nur die ZEICHNUNG (Kontakt-Bogen für das Mons-Studio).
   Bewegung im Haus, Freischaltung über die Türchen und Interaktion
   kommen später, sobald alle 24 feststehen (Beschluss des Besitzers).
   ======================================================================= */

export type C = CanvasRenderingContext2D;
type Pt = [number, number];

/** Ein Luni-Mon: Name, Größe (Einheiten über Boden), Farbpalette, Maler. */
export interface LuniMon {
  /** Nummer des Türchens (1–24), über das er freigeschaltet wird. */
  tuer: number;
  name: string;
  /** Kurze Beschreibung des Wesens. */
  beschreibung: string;
  /** Wohin er später im Haus gehört. */
  ort: string;
  /** Körpergröße in Bühneneinheiten (Boden bis höchster Punkt). */
  groesse: number;
  /** Farben für die Farbtafeln im Studio. */
  farben: { label: string; value: string }[];
  /** Zeichnet das Mon stehend auf Bodenlinie y, Blick nach +x. */
  maler: (c: C, x: number, y: number, t: number, sk: number) => void;
}

/* --------------------------- Zeichen-Helfer ---------------------------- */

const kreis = (c: C, x: number, y: number, r: number, f: string) => {
  c.fillStyle = f;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
};

const oval = (c: C, x: number, y: number, rx: number, ry: number, rot: number, f: string) => {
  c.fillStyle = f;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fill();
};

const rect2 = (c: C, x: number, y: number, w: number, h: number, f: string) => {
  c.fillStyle = f;
  c.fillRect(x, y, w, h);
};

const linie = (c: C, x0: number, y0: number, x1: number, y1: number, f: string, b = 1) => {
  c.strokeStyle = f;
  c.lineWidth = b;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
};

const poly = (c: C, p: Pt[], f: string) => {
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
  c.closePath();
  c.fill();
};

const stern5 = (c: C, x: number, y: number, r: number, f: string) => {
  c.fillStyle = f;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
};

/** Auge mit weißem Glanzpunkt. */
const auge = (c: C, x: number, y: number, r: number, farbe: string) => {
  kreis(c, x, y, r, farbe);
  kreis(c, x + r * 0.35, y - r * 0.35, r * 0.35, "#ffffff");
};

/* ------------------------------ 24 Mons -------------------------------- */

export const LUNI_MONS: LuniMon[] = [
  {
    tuer: 1,
    name: "Pakitchu",
    beschreibung: "Strom-Maus mit roten Wangen; ihr Schwanz formt ein Herz.",
    ort: "Wohnzimmer",
    groesse: 22,
    farben: [
      { label: "Körper", value: "#f2d24b" },
      { label: "Wangen", value: "#d9453a" },
      { label: "Strom", value: "#3d3a35" },
      { label: "Schwanz", value: "#e0b53c" },
    ],
    maler: (c, x, y, t) => {
      const wipp = Math.sin(t * 3) * 0.8;
      // Schwanz mit Herzspitze
      c.strokeStyle = "#e0b53c";
      c.lineWidth = 2.6;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x - 5, y - 6);
      c.quadraticCurveTo(x - 12, y - 10 + wipp, x - 12, y - 18 + wipp);
      c.stroke();
      kreis(c, x - 12, y - 20 + wipp, 1.6, "#d9453a");
      // Körper
      oval(c, x, y - 9, 7.4, 8.6, 0, "#f2d24b");
      // Kopf
      kreis(c, x + 1.4, y - 19, 6.4, "#f2d24b");
      // Ohren
      dreieck(c, [x - 3, y - 22], [x - 5.4, y - 29], [x + 1.4, y - 24.5], "#f2d24b");
      dreieck(c, [x + 4.6, y - 23], [x + 8.2, y - 29.5], [x + 7.4, y - 22], "#f2d24b");
      dreieck(c, [x - 3.1, y - 23], [x - 4.7, y - 27], [x - 0.6, y - 24], "#3d3a35");
      // Wangen
      kreis(c, x - 2.6, y - 17.4, 2.1, "#d9453a");
      kreis(c, x + 5.4, y - 17.4, 2.1, "#d9453a");
      // Arme
      linie(c, x - 4.4, y - 12, x - 6.6, y - 8.4, "#f2d24b", 2.2);
      linie(c, x + 4.4, y - 12, x + 6.8, y - 8.6, "#f2d24b", 2.2);
      // Beine
      oval(c, x - 3.2, y - 1.6, 3.0, 1.8, 0, "#f2d24b");
      oval(c, x + 3.2, y - 1.6, 3.0, 1.8, 0, "#f2d24b");
      // Gesicht
      auge(c, x - 1.2, y - 20.4, 1.15, "#1d1610");
      auge(c, x + 4.2, y - 20.4, 1.15, "#1d1610");
      kreis(c, x + 1.5, y - 18.6, 0.75, "#3d3a35");
      // Blitz auf der Stirn
      poly(c, [[x + 1.4, y - 24.2], [x + 2.4, y - 21.6], [x + 1.7, y - 21.6], [x + 2.2, y - 19.6]], "#3d3a35");
    },
  },
  {
    tuer: 2,
    name: "Lunitose",
    beschreibung: "Samenkäfer mit Zwiebelknospe auf dem Rücken; Triebe wachsen nach.",
    ort: "Fensterbank",
    groesse: 26,
    farben: [
      { label: "Haut", value: "#8fbf7f" },
      { label: "Knospe", value: "#4d9a66" },
      { label: "Triebe", value: "#3f7f52" },
      { label: "Flecken", value: "#2f6b3c" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 2) * 0.7;
      // Knospe
      oval(c, x - 4, y - 26 + wip, 6.6, 6.0, -0.25, "#4d9a66");
      linie(c, x - 4, y - 20 + wip, x - 3, y - 13, "#3f7f52", 2.2);
      linie(c, x - 4.8, y - 22 + wip, x - 9, y - 16.4 + wip, "#3f7f52", 1.6);
      // Körper
      oval(c, x + 1, y - 10, 6.6, 8.8, 0, "#8fbf7f");
      // Flecken
      kreis(c, x - 0.4, y - 9, 2.0, "#2f6b3c");
      kreis(c, x + 3, y - 6, 1.6, "#2f6b3c");
      // Beine
      linie(c, x - 1.4, y - 2.4, x - 2.2, y, "#8fbf7f", 2.6);
      linie(c, x + 2.8, y - 2.4, x + 3.4, y, "#8fbf7f", 2.6);
      // Arme
      linie(c, x + 5.4, y - 11, x + 8.6, y - 8.4, "#8fbf7f", 2.2);
      // Gesicht
      auge(c, x + 2.6, y - 14.4, 1.15, "#1d1610");
      auge(c, x + 5.4, y - 13.4, 1.15, "#1d1610");
      linie(c, x + 2.8, y - 11.6, x + 5.0, y - 11.2, "#3d3a35", 0.7);
    },
  },
  {
    tuer: 3,
    name: "Kesselax",
    beschreibung: "Feuer-Echse mit Glimmschwanz; wärmt sich am Herd.",
    ort: "Küche / Herd",
    groesse: 24,
    farben: [
      { label: "Körper", value: "#e8834a" },
      { label: "Bauch", value: "#f7d9a8" },
      { label: "Flamme", value: "#ff9f43" },
      { label: "Klauen", value: "#5a3b25" },
    ],
    maler: (c, x, y, t) => {
      const fl = Math.sin(t * 8) * 1.4;
      // Schwanzflamme
      kreis(c, x - 11, y - 14, 3.1 + fl * 0.2, "#ff9f43");
      kreis(c, x - 11, y - 14.6, 1.6, "#fff199");
      linie(c, x - 6, y - 12, x - 9.4, y - 13.6, "#e8834a", 3.0);
      // Körper
      oval(c, x, y - 10, 7.0, 9.0, 0, "#e8834a");
      rect2(c, x - 3.4, y - 7, 6.6, 6.4, "#f7d9a8");
      // Kopf
      kreis(c, x + 1.6, y - 21, 5.8, "#e8834a");
      // Ohren
      dreieck(c, [x - 2.8, y - 23.6], [x - 5.0, y - 27.4], [x + 0.6, y - 24.4], "#e8834a");
      // Arme und Beine
      linie(c, x + 5.0, y - 11, x + 8.0, y - 8.6, "#e8834a", 2.3);
      linie(c, x - 1.8, y - 2.6, x - 2.6, y, "#e8834a", 2.8);
      linie(c, x + 2.6, y - 2.6, x + 3.6, y, "#e8834a", 2.8);
      kreis(c, x - 2.6, y, 1.0, "#5a3b25");
      kreis(c, x + 3.6, y, 1.0, "#5a3b25");
      // Gesicht
      auge(c, x - 0.2, y - 22.2, 1.15, "#1d1610");
      auge(c, x + 3.8, y - 22.2, 1.15, "#1d1610");
      kreis(c, x + 1.8, y - 19.8, 0.7, "#3d3a35");
    },
  },
  {
    tuer: 4,
    name: "Aquaruni",
    beschreibung: "Wasser-Schildkröte mit gepanzerter Kuppel;Planscht gern.",
    ort: "Badezimmer",
    groesse: 24,
    farben: [
      { label: "Körper", value: "#7ec4dc" },
      { label: "Panzer", value: "#b98a5a" },
      { label: "Panzerfeld", value: "#8a6238" },
      { label: "Bauch", value: "#f2e6cf" },
    ],
    maler: (c, x, y, t) => {
      void t; // Aquaruni ist statisch
      // Panzer
      oval(c, x - 2.4, y - 12, 8.2, 7.0, 0, "#b98a5a");
      kreis(c, x - 2.4, y - 12, 4.6, "#8a6238");
      // Körper
      oval(c, x + 2.4, y - 10, 5.4, 7.6, 0, "#7ec4dc");
      rect2(c, x + 0.4, y - 7, 4.2, 6, "#f2e6cf");
      // Kopf
      kreis(c, x + 4.4, y - 20, 4.8, "#7ec4dc");
      // Arme
      oval(c, x + 6.2, y - 7, 2.6, 3.4, 0.2, "#7ec4dc");
      oval(c, x - 3.0, y - 7, 2.4, 3.2, 0.2, "#7ec4dc");
      // Füße
      oval(c, x + 3.2, y - 1.6, 3.0, 1.7, 0, "#7ec4dc");
      oval(c, x - 3.4, y - 1.6, 3.0, 1.7, 0, "#7ec4dc");
      // Gesicht
      auge(c, x + 3.0, y - 21, 1.15, "#1d1610");
      auge(c, x + 6.4, y - 21, 1.15, "#1d1610");
      kreis(c, x + 4.7, y - 18.6, 0.8, "#3d3a35");
    },
  },
  {
    tuer: 5,
    name: "Wolpuff",
    beschreibung: "Luftballon-Wesen mit großen Augen; singt leise vor sich hin.",
    ort: "Sofa",
    groesse: 28,
    farben: [
      { label: "Körper", value: "#f0a8c0" },
      { label: "Ohren innen", value: "#d97fa0" },
      { label: "Augen", value: "#3d7fbf" },
      { label: "Schwämmchen", value: "#c9453a" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 2.2) * 1.2;
      // Körper (Rund)
      kreis(c, x, y - 14 + wip, 12.4, "#f0a8c0");
      // Ohren
      dreieck(c, [x - 9, y - 22 + wip], [x - 13.4, y - 32 + wip], [x - 2.4, y - 24.4 + wip], "#f0a8c0");
      dreieck(c, [x + 9, y - 22 + wip], [x + 13.4, y - 32 + wip], [x + 2.4, y - 24.4 + wip], "#f0a8c0");
      kreis(c, x - 10.6, y - 27 + wip, 1.7, "#d97fa0");
      kreis(c, x + 10.6, y - 27 + wip, 1.7, "#d97fa0");
      // Schwämmchen-Mikro
      rect2(c, x + 8, y - 30 + wip, 5, 8, "#c9453a");
      // Große Augen
      kreis(c, x - 4, y - 17 + wip, 2.6, "#f7f7f7");
      kreis(c, x + 4, y - 17 + wip, 2.6, "#f7f7f7");
      auge(c, x - 4, y - 17 + wip, 1.6, "#3d7fbf");
      auge(c, x + 4, y - 17 + wip, 1.6, "#3d7fbf");
      // Mund
      linie(c, x - 2.4, y - 9.4 + wip, x + 2.4, y - 9.4 + wip, "#8a4a5c", 1);
      // Arme
      linie(c, x - 11.4, y - 12 + wip, x - 15.4, y - 6 + wip, "#f0a8c0", 2.4);
      linie(c, x + 11.4, y - 12 + wip, x + 15.4, y - 6 + wip, "#f0a8c0", 2.4);
      // Füße
      oval(c, x - 4.4, y - 1.6, 3.4, 1.8, 0, "#f0a8c0");
      oval(c, x + 4.4, y - 1.6, 3.4, 1.8, 0, "#f0a8c0");
    },
  },
  {
    tuer: 6,
    name: "Knuffelzahn",
    beschreibung: "Wachhund-Wesen mit Streifenmähne; hütet die Haustür.",
    ort: "Haustür",
    groesse: 30,
    farben: [
      { label: "Körper", value: "#d96c3f" },
      { label: "Mähne", value: "#3d2a1e" },
      { label: "Bauch", value: "#f2e0c4" },
      { label: "Kette", value: "#8a8f98" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 3.4) * 1.2;
      // Schwanz
      linie(c, x - 10, y - 18 + wip, x - 16, y - 24 + wip, "#d96c3f", 2.8);
      // Körper
      oval(c, x, y - 12, 9.0, 11.4, 0, "#d96c3f");
      oval(c, x, y - 8, 5.6, 7.4, 0, "#f2e0c4");
      // Kopf
      kreis(c, x + 2, y - 26, 6.8, "#d96c3f");
      // Schnauze
      oval(c, x + 5, y - 23.4, 3.6, 2.6, 0.1, "#f2e0c4");
      kreis(c, x + 8.4, y - 23.8, 1.5, "#231813");
      // Ohren
      dreieck(c, [x - 3, y - 30], [x - 6, y - 35.5], [x + 1.4, y - 30.5], "#3d2a1e");
      // Mähne
      for (let i = 0; i < 4; i++) {
        linie(c, x - 2 + i * 1.6, y - 31, x - 1.4 + i * 1.6, y - 34.5 + wip, "#3d2a1e", 1.6);
      }
      // Beine
      rect2(c, x - 5.4, y - 6, 4.4, 6, "#d96c3f");
      rect2(c, x + 2, y - 6, 4.4, 6, "#d96c3f");
      // Kette
      for (let i = 0; i < 4; i++) kreis(c, x + 1.4, y - 18.6 + i * 2.6, 1.2, "#8a8f98");
      // Gesicht
      auge(c, x, y - 27.4, 1.15, "#1d1610");
      auge(c, x + 4.6, y - 27.4, 1.15, "#1d1610");
    },
  },
  {
    tuer: 7,
    name: "Zwockel",
    beschreibung: "Träges Entenwesen mit Gähn-Gesicht; planscht in der Wanne.",
    ort: "Badewanne",
    groesse: 26,
    farben: [
      { label: "Körper", value: "#f2d24b" },
      { label: "Schnabel", value: "#e8b34a" },
      { label: "Haarschopf", value: "#c9a83c" },
      { label: "Augen", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 1.6) * 0.9;
      // Körper
      oval(c, x, y - 11 + wip, 8.4, 9.6, 0, "#f2d24b");
      // Haarschopf (drei Zacken)
      linie(c, x + 1, y - 20.4 + wip, x - 0.4, y - 25.4 + wip, "#c9a83c", 1.7);
      linie(c, x + 2.4, y - 20.4 + wip, x + 2.2, y - 26 + wip, "#c9a83c", 1.7);
      linie(c, x + 3.8, y - 20 + wip, x + 5, y - 24.4 + wip, "#c9a83c", 1.7);
      // Schnabel
      oval(c, x + 5.4, y - 18 + wip, 3.6, 2.0, 0.1, "#e8b34a");
      // Arme hängen
      linie(c, x - 7.4, y - 12 + wip, x - 8.4, y - 3.4 + wip, "#f2d24b", 2.5);
      linie(c, x + 7.4, y - 12 + wip, x + 8.4, y - 3.4 + wip, "#f2d24b", 2.5);
      // Füße
      oval(c, x - 3.4, y - 1.4, 3.2, 1.6, 0, "#f2d24b");
      oval(c, x + 3.4, y - 1.4, 3.2, 1.6, 0, "#f2d24b");
      // Schlappes Gesicht
      auge(c, x - 0.4, y - 18.6 + wip, 1.2, "#1d1610");
      auge(c, x + 3.6, y - 18.6 + wip, 1.2, "#1d1610");
    },
  },
  {
    tuer: 8,
    name: "Schelmime",
    beschreibung: "Scheues Lumpenwesen; mimt einen Sack und schaut trotzdem.",
    ort: "Keller",
    groesse: 30,
    farben: [
      { label: "Lumpen", value: "#6b5a48" },
      { label: "Innen", value: "#2a1f18" },
      { label: "Arsch Tattoo", value: "#c9453a" },
      { label: "Arme", value: "#54473a" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 1.8) * 1.0;
      // Sackkörper
      poly(c, [[x - 10, y], [x - 12.4, y - 24 + wip], [x - 6, y - 29 + wip], [x + 8, y - 28 + wip], [x + 11, y - 20 + wip], [x + 9, y]], "#6b5a48");
      // Löcher als dunkle Flecken
      kreis(c, x - 6, y - 8, 2.4, "#2a1f18");
      kreis(c, x + 5, y - 4, 1.8, "#2a1f18");
      // Ohren des Lumpenwesens
      linie(c, x - 8.4, y - 26 + wip, x - 13, y - 33 + wip, "#54473a", 2.6);
      linie(c, x + 8.4, y - 26 + wip, x + 13.4, y - 33.5 + wip, "#54473a", 2.6);
      // Augen
      auge(c, x - 3, y - 20 + wip, 1.5, "#f7dfa0");
      auge(c, x + 3.6, y - 20 + wip, 1.5, "#f7dfa0");
      // Mund (gezackt)
      poly(c, [[x - 3.4, y - 15.4 + wip], [x - 1.6, y - 12.4 + wip], [x + 0.4, y - 15.4 + wip], [x + 2.4, y - 12.4 + wip], [x + 4.4, y - 15.4 + wip]], "#1a1310");
      // Lumpenarme
      linie(c, x - 11, y - 18 + wip, x - 16, y - 14 + wip, "#54473a", 2.4);
      linie(c, x + 10.4, y - 17 + wip, x + 15.4, y - 22 + wip, "#54473a", 2.4);
      // Kehlung
      kreis(c, x + 6, y - 22 + wip, 1.3, "#c9453a");
    },
  },
  {
    tuer: 9,
    name: "Schlapador",
    beschreibung: "Riesiger Kuschel-Müdemacher; schläft überall, wo es warm ist.",
    ort: "Schlafzimmer",
    groesse: 42,
    farben: [
      { label: "Körper", value: "#4d6a8f" },
      { label: "Bauch", value: "#e2d6bc" },
      { label: "Pfoten", value: "#3a5270" },
      { label: "Augen", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const atem = Math.sin(t * 1.4) * 1.1;
      // Körper
      oval(c, x, y - 18 + atem * 0.4, 15.4, 18.6, 0, "#4d6a8f");
      // Bauch
      oval(c, x + 1.4, y - 12 + atem * 0.4, 10.6, 11.4, 0, "#e2d6bc");
      // Kopf
      kreis(c, x + 3.4, y - 34 + atem * 0.4, 9.4, "#4d6a8f");
      // Ohren
      dreieck(c, [x - 3.4, y - 41 + atem * 0.4], [x - 6.4, y - 50 + atem * 0.4], [x + 2.4, y - 42 + atem * 0.4], "#4d6a8f");
      // Pfoten
      oval(c, x - 12.4, y - 3 + atem * 0.3, 4.4, 3.0, 0.2, "#3a5270");
      oval(c, x + 13.4, y - 3 + atem * 0.3, 4.4, 3.0, -0.2, "#3a5270");
      // Gesicht
      linie(c, x - 1, y - 35 + atem * 0.4, x + 1.4, y - 35 + atem * 0.4, "#1d1610", 1.4);
      linie(c, x + 3.4, y - 35 + atem * 0.4, x + 5.8, y - 35 + atem * 0.4, "#1d1610", 1.4);
      kreis(c, x + 3.4, y - 31.4 + atem * 0.4, 1.5, "#3d2a1e");
      // Zähne
      dreieck(c, [x + 0.6, y - 30.4 + atem * 0.4], [x + 2, y - 30.4 + atem * 0.4], [x + 1.3, y - 28.4 + atem * 0.4], "#ffffff");
    },
  },
  {
    tuer: 10,
    name: "Zwergfrost",
    beschreibung: "Eisglas-Mosaikelement; kühlt die Fensterbank im Dezember.",
    ort: "Fenster Dachgeschoss",
    groesse: 26,
    farben: [
      { label: "Glas", value: "#cfe2f4" },
      { label: "Eiskristall", value: "#eef6ff" },
      { label: "Kern", value: "#9fc6e8" },
      { label: "Schatten", value: "#7aa5c4" },
    ],
    maler: (c, x, y, t) => {
      const dreh = Math.sin(t * 0.9) * 0.14;
      c.save();
      c.translate(x, y - 14);
      c.rotate(dreh);
      // Eiskristall-Sechsstrahl
      c.strokeStyle = "#eef6ff";
      c.lineWidth = 2.0;
      c.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
        c.stroke();
        // kleine Queräste
        const bx = Math.cos(a) * 8;
        const by = Math.sin(a) * 8;
        c.beginPath();
        c.moveTo(bx - Math.sin(a) * 3.4, by + Math.cos(a) * 3.4);
        c.lineTo(bx + Math.sin(a) * 3.4, by - Math.cos(a) * 3.4);
        c.stroke();
      }
      c.restore();
      kreis(c, x, y - 14, 4.6, "#9fc6e8");
      kreis(c, x, y - 14, 2.6, "#eef6ff");
      // Schneefüße
      oval(c, x - 3.4, y - 1.4, 3.4, 1.6, 0, "#cfe2f4");
      oval(c, x + 3.4, y - 1.4, 3.4, 1.6, 0, "#cfe2f4");
    },
  },
  {
    tuer: 11,
    name: "Funkenfeu",
    beschreibung: "Sechs Feuerwedel; kuschelt sich gern an den warmen Herd.",
    ort: "Küche",
    groesse: 28,
    farben: [
      { label: "Körper", value: "#e8a25a" },
      { label: "Wedel", value: "#e8b34a" },
      { label: "Wedelspitze", value: "#c9453a" },
      { label: "Auge", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 3.2) * 1.0;
      // Körper
      oval(c, x, y - 11 + wip, 7.4, 9.4, 0, "#e8a25a");
      // Sechs Feuerruten
      for (let i = 0; i < 6; i++) {
        const a = -2.2 + i * 0.42;
        const lx = x - 7 + Math.cos(a) * 11;
        const ly = y - 14 + wip + Math.sin(a) * 11;
        linie(c, x - 6.4, y - 13 + wip, lx, ly, "#e8b34a", 2.2);
        kreis(c, lx, ly, 1.6, "#c9453a");
      }
      // Kopf
      kreis(c, x + 1.6, y - 23 + wip, 6.0, "#e8a25a");
      // Gesicht
      auge(c, x - 0.4, y - 24.4 + wip, 1.15, "#1d1610");
      auge(c, x + 3.6, y - 24.4 + wip, 1.15, "#1d1610");
      // Ohren
      dreieck(c, [x - 3, y - 27 + wip], [x - 5.4, y - 32.4 + wip], [x + 0.6, y - 28.4 + wip], "#e8a25a");
      // Füße
      oval(c, x - 3, y - 1.5, 3.0, 1.7, 0, "#e8a25a");
      oval(c, x + 3, y - 1.5, 3.0, 1.7, 0, "#e8a25a");
    },
  },
  {
    tuer: 12,
    name: "Moosling",
    beschreibung: "Wurzelzwerg mit Blattkrone; gießt sich selbst mit Tau.",
    ort: "Blumentopf",
    groesse: 22,
    farben: [
      { label: "Körper", value: "#8fbf7f" },
      { label: "Blätter", value: "#4d9a66" },
      { label: "Füße", value: "#5c4630" },
      { label: "Auge", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 2.4) * 0.8;
      // Körper
      oval(c, x, y - 9 + wip, 7.4, 8.6, 0, "#8fbf7f");
      // Blattkrone
      oval(c, x - 3.4, y - 20.4 + wip, 4.4, 3.0, -0.5, "#4d9a66");
      oval(c, x + 3.4, y - 20.4 + wip, 4.4, 3.0, 0.5, "#4d9a66");
      oval(c, x, y - 22.4 + wip, 3.0, 4.0, 0, "#4d9a66");
      // Gesicht
      auge(c, x - 1.4, y - 12.4 + wip, 1.15, "#1d1610");
      auge(c, x + 2.4, y - 12.4 + wip, 1.15, "#1d1610");
      kreis(c, x + 0.5, y - 9.4 + wip, 0.8, "#3d3a35");
      // Beine
      oval(c, x - 3, y - 1.5, 2.8, 1.7, 0, "#5c4630");
      oval(c, x + 3, y - 1.5, 2.8, 1.7, 0, "#5c4630");
      // Blattarme
      oval(c, x - 7.4, y - 8 + wip, 3.0, 1.6, -0.4, "#4d9a66");
      oval(c, x + 7.4, y - 8 + wip, 3.0, 1.6, 0.4, "#4d9a66");
    },
  },
  {
    tuer: 13,
    name: "Krabblicht",
    beschreibung: "Scherenkrabbler; rückwärts durchs Bad, nie vorwärts.",
    ort: "Badewanne",
    groesse: 20,
    farben: [
      { label: "Körper", value: "#e8794a" },
      { label: "Scheren", value: "#c95a35" },
      { label: "Augen", value: "#f7f7f7" },
      { label: "Pupille", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const kipp = Math.sin(t * 2.6) * 0.4;
      // Körper
      oval(c, x, y - 7, 9.4, 5.4, kipp * 0.1, "#e8794a");
      // Beine
      for (let i = -1; i <= 1; i += 2) {
        for (const dx of [-4, -1, 2]) {
          linie(c, x + dx, y - 5, x + dx + i * 3.4, y - 1.4, "#e8794a", 1.7);
        }
      }
      // Scheren
      oval(c, x - 11.4, y - 8, 3.4, 2.4, -0.3, "#c95a35");
      oval(c, x + 11.4, y - 8, 3.4, 2.4, 0.3, "#c95a35");
      // Augen auf Stielen
      linie(c, x - 1.4, y - 11, x - 2.4, y - 15.4, "#e8794a", 1.7);
      linie(c, x + 1.4, y - 11, x + 2.4, y - 15.4, "#e8794a", 1.7);
      kreis(c, x - 2.4, y - 16.4, 1.9, "#f7f7f7");
      kreis(c, x + 2.4, y - 16.4, 1.9, "#f7f7f7");
      auge(c, x - 2.4, y - 16.4, 0.85, "#1d1610");
      auge(c, x + 2.4, y - 16.4, 0.85, "#1d1610");
    },
  },
  {
    tuer: 14,
    name: "Elektroll",
    beschreibung: "Kugelwesen mit Plus-Minus-Kappe; rollt durchs Zockerzimmer.",
    ort: "Zockerzimmer",
    groesse: 18,
    farben: [
      { label: "Körper", value: "#c9453a" },
      { label: "Kappe", value: "#f2f5f8" },
      { label: "Plus", value: "#f2f5f8" },
      { label: "Auge", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const roll = t * 1.6;
      // Körper
      kreis(c, x, y - 9, 9, "#c9453a");
      // Weiße Kappe oben
      c.save();
      c.beginPath();
      c.arc(x, y - 9, 9, Math.PI * 1.15, Math.PI * 1.85);
      c.lineTo(x, y - 9);
      c.closePath();
      c.fillStyle = "#f2f5f8";
      c.fill();
      c.restore();
      // Plus-Zeichen (rotiert beim Rollen)
      c.save();
      c.translate(x, y - 9);
      c.rotate(roll);
      c.strokeStyle = "#f2f5f8";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-3, 0);
      c.lineTo(3, 0);
      c.moveTo(0, -3);
      c.lineTo(0, 3);
      c.stroke();
      c.restore();
      // Augen
      auge(c, x - 3, y - 8.4, 1.4, "#1d1610");
      auge(c, x + 3, y - 8.4, 1.4, "#1d1610");
    },
  },
  {
    tuer: 15,
    name: "Schlafmop",
    beschreibung: "Dösendes Langsamwesen; schafft es nie bis zur Treppe.",
    ort: "Flur",
    groesse: 30,
    farben: [
      { label: "Körper", value: "#e8b4b4" },
      { label: "Schwanz", value: "#c99a9a" },
      { label: "Augenlid", value: "#8a6a70" },
      { label: "Krone", value: "#e8c25a" },
    ],
    maler: (c, x, y, t) => {
      const atem = Math.sin(t * 1.2) * 1.4;
      // Körper
      oval(c, x, y - 14 + atem * 0.4, 12.4, 13.4, 0, "#e8b4b4");
      // Kopf
      kreis(c, x + 4.4, y - 29 + atem * 0.4, 8.4, "#e8b4b4");
      // Krone
      poly(c, [[x - 1.4, y - 36.4 + atem * 0.4], [x + 1.4, y - 36.4 + atem * 0.4], [x + 1.4, y - 41.4 + atem * 0.4], [x - 1.4, y - 41.4 + atem * 0.4]], "#e8c25a");
      poly(c, [[x - 2, y - 41.4 + atem * 0.4], [x + 2, y - 41.4 + atem * 0.4], [x, y - 44.4 + atem * 0.4]], "#e8c25a");
      // Schlafende Augen
      linie(c, x + 1.4, y - 29.4 + atem * 0.4, x + 3.4, y - 29.4 + atem * 0.4, "#8a6a70", 1.5);
      linie(c, x + 5.4, y - 29.4 + atem * 0.4, x + 7.4, y - 29.4 + atem * 0.4, "#8a6a70", 1.5);
      // Schwanz
      linie(c, x - 11.4, y - 14 + atem * 0.4, x - 17.4, y - 8 + atem * 0.4, "#c99a9a", 2.6);
      // Pfoten
      oval(c, x - 6, y - 1.6, 4.0, 1.8, 0, "#e8b4b4");
      oval(c, x + 6, y - 1.6, 4.0, 1.8, 0, "#e8b4b4");
      // Mund
      linie(c, x + 3, y - 25.4 + atem * 0.4, x + 5.4, y - 25.4 + atem * 0.4, "#8a6a70", 1);
    },
  },
  {
    tuer: 16,
    name: "Glockmun",
    beschreibung: "Schwebende Glöckchen-Freundin; läutet leise zum Frühstück.",
    ort: "Flur hängend",
    groesse: 24,
    farben: [
      { label: "Körper", value: "#7fb3d9" },
      { label: "Schwänzchen", value: "#5c8fbf" },
      { label: "Glöckchen", value: "#e8c25a" },
      { label: "Auge", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const schweb = Math.sin(t * 1.8) * 2.4;
      // Schwebe-Basis
      const yy = y - 12 - 12 + schweb;
      // Körper
      oval(c, x, yy, 8.4, 9.4, 0, "#7fb3d9");
      // Kopf-Kugel
      kreis(c, x, yy - 10, 7.4, "#7fb3d9");
      // Schwänzchen
      kreis(c, x, yy + 11, 2.4, "#5c8fbf");
      // Glöckchen unten
      kreis(c, x, yy + 15, 3.0, "#e8c25a");
      linie(c, x, yy + 18, x, yy + 20.4, "#c49a35", 1.2);
      // Gesicht
      auge(c, x - 2.4, yy - 11, 1.3, "#1d1610");
      auge(c, x + 2.4, yy - 11, 1.3, "#1d1610");
      c.strokeStyle = "#3d3a35";
      c.lineWidth = 0.9;
      c.beginPath();
      c.arc(x, yy - 7.4, 2.6, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
      // kleine Flügel
      oval(c, x - 10, yy - 4, 3.4, 2.0, -0.5, "#5c8fbf");
      oval(c, x + 10, yy - 4, 3.4, 2.0, 0.5, "#5c8fbf");
    },
  },
  {
    tuer: 17,
    name: "Fedorix",
    beschreibung: "Zweiköpfiger Vogel-Sprint; rennt lieber als zu fliegen.",
    ort: "Garten",
    groesse: 34,
    farben: [
      { label: "Körper", value: "#a5764a" },
      { label: "Feder", value: "#c99a63" },
      { label: "Schnäbel", value: "#e8b34a" },
      { label: "Beine", value: "#e8b34a" },
    ],
    maler: (c, x, y, t) => {
      const lauf = Math.sin(t * 7) * 1.6;
      // Körper
      oval(c, x, y - 16, 8.4, 11.4, 0, "#a5764a");
      // Zwei Köpfe
      kreis(c, x + 3.4, y - 30, 4.4, "#a5764a");
      kreis(c, x + 10.4, y - 28, 4.0, "#a5764a");
      // Schnäbel
      poly(c, [[x + 7.4, y - 30.4], [x + 13.4, y - 29.4], [x + 7.4, y - 28.4]], "#e8b34a");
      poly(c, [[x + 14, y - 28.4], [x + 20, y - 27.4], [x + 14, y - 26.4]], "#e8b34a");
      // Federschopf
      for (let i = 0; i < 3; i++) {
        linie(c, x + 2, y - 33.4, x + 0.4 + i * 1.6, y - 38.4, "#c99a63", 1.6);
      }
      // Flügel
      oval(c, x - 5.4, y - 16, 3.4, 6.4, 0.2, "#c99a63");
      // Beine (im Lauf)
      linie(c, x - 2, y - 5, x - 3.4 + lauf, y, "#e8b34a", 1.8);
      linie(c, x + 2, y - 5, x + 3.4 - lauf, y, "#e8b34a", 1.8);
      // Augen
      auge(c, x + 3.8, y - 30.4, 1.05, "#1d1610");
      auge(c, x + 11, y - 28.4, 1.05, "#1d1610");
    },
  },
  {
    tuer: 18,
    name: "Wurzelini",
    beschreibung: "Erd-Stumper; poppt aus dem Kellerboden auf und wieder weg.",
    ort: "Keller",
    groesse: 18,
    farben: [
      { label: "Körper", value: "#a5764a" },
      { label: "Hügel", value: "#7a5a3c" },
      { label: "Nase", value: "#d9a86a" },
      { label: "Auge", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 2.8) * 1.2;
      // Erdhügel
      oval(c, x, y - 1.4, 11.4, 3.4, 0, "#7a5a3c");
      // Körper (drei Viertel im Boden)
      oval(c, x, y - 8 + wip, 6.4, 7.4, 0, "#a5764a");
      // Nase
      oval(c, x + 1.4, y - 9.4 + wip, 2.6, 1.9, 0.1, "#d9a86a");
      // Gesicht
      auge(c, x - 0.8, y - 12.4 + wip, 1.15, "#1d1610");
      auge(c, x + 3, y - 12.4 + wip, 1.15, "#1d1610");
      // Blatt auf dem Kopf
      oval(c, x, y - 17.4 + wip, 3.4, 2.0, -0.4, "#4d9a66");
      linie(c, x, y - 15.4 + wip, x, y - 13.4 + wip, "#3f7f52", 1.2);
    },
  },
  {
    tuer: 19,
    name: "Glubschi",
    beschreibung: "Glotzäugiger Neugier-Nix; beobachtet alles aus der Wanne.",
    ort: "Badewanne",
    groesse: 22,
    farben: [
      { label: "Körper", value: "#f2d24b" },
      { label: "Augapfel", value: "#f7f7f7" },
      { label: "Pupille", value: "#1d1610" },
      { label: "Flossen", value: "#e8b34a" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 2.2) * 0.9;
      // Körper
      oval(c, x, y - 9 + wip, 7.4, 8.4, 0, "#f2d24b");
      // Riesige Glotzaugen
      kreis(c, x - 2.4, y - 18.4 + wip, 3.4, "#f7f7f7");
      kreis(c, x + 3.4, y - 18.4 + wip, 3.4, "#f7f7f7");
      auge(c, x - 2.4, y - 18.4 + wip, 1.5, "#1d1610");
      auge(c, x + 3.4, y - 18.4 + wip, 1.5, "#1d1610");
      // Flossenarme
      oval(c, x - 8.4, y - 7 + wip, 3.0, 1.7, -0.4, "#e8b34a");
      oval(c, x + 8.4, y - 7 + wip, 3.0, 1.7, 0.4, "#e8b34a");
      // Beine
      oval(c, x - 3, y - 1.5, 2.8, 1.6, 0, "#f2d24b");
      oval(c, x + 3, y - 1.5, 2.8, 1.6, 0, "#f2d24b");
      // Mund
      kreis(c, x + 0.5, y - 11.4 + wip, 0.9, "#3d3a35");
    },
  },
  {
    tuer: 20,
    name: "Eisblub",
    beschreibung: "Schnee-Echse; rutscht durch den verschneiten Garten.",
    ort: "Garten (Schnee)",
    groesse: 26,
    farben: [
      { label: "Körper", value: "#a5c8e8" },
      { label: "Bauch", value: "#e8f2fa" },
      { label: "Hörnchen", value: "#cfe2f4" },
      { label: "Auge", value: "#1d1610" },
    ],
    maler: (c, x, y, t) => {
      const rutsch = Math.sin(t * 1.9) * 1.4;
      // Körper (liegend, gerutscht)
      oval(c, x, y - 8 + rutsch * 0.4, 11.4, 7.4, 0, "#a5c8e8");
      rect2(c, x - 4, y - 5 + rutsch * 0.4, 9.4, 4.4, "#e8f2fa");
      // Kopf
      kreis(c, x + 9, y - 12 + rutsch * 0.5, 5.4, "#a5c8e8");
      // Hörnchen
      linie(c, x + 7, y - 16.4 + rutsch * 0.5, x + 5.4, y - 20.4 + rutsch * 0.5, "#cfe2f4", 1.7);
      linie(c, x + 10.4, y - 16.4 + rutsch * 0.5, x + 11.4, y - 20.4 + rutsch * 0.5, "#cfe2f4", 1.7);
      // Schwanz
      linie(c, x - 10, y - 8 + rutsch * 0.4, x - 17.4, y - 5 + rutsch * 0.4, "#a5c8e8", 2.6);
      // Gesicht
      auge(c, x + 8, y - 12.4 + rutsch * 0.5, 1.15, "#1d1610");
      kreis(c, x + 11.4, y - 11 + rutsch * 0.5, 0.8, "#3d3a35");
      // kleine Schneewolke beim Rutschen
      for (let i = 0; i < 3; i++) {
        kreis(c, x - 14 - i * 4, y - 1.4 - (i % 2) * 2, 1.7 - i * 0.3, "rgba(255,255,255,.7)");
      }
    },
  },
  {
    tuer: 21,
    name: "Nachtfalter",
    beschreibung: "Flügel-Mon; schwebt nachts durchs Dachgeschoss.",
    ort: "Dachgeschoss",
    groesse: 30,
    farben: [
      { label: "Körper", value: "#8a63c9" },
      { label: "Flügel", value: "#b58be8" },
      { label: "Flecken", value: "#e8c25a" },
      { label: "Fühler", value: "#3d3a35" },
    ],
    maler: (c, x, y, t) => {
      const flatter = Math.sin(t * 6) * 2.4;
      const schweb = Math.sin(t * 1.7) * 2.0;
      const yy = y - 18 + schweb;
      // Vier Flügel (oben/unten je Seite)
      oval(c, x - 9, yy - 4 - flatter * 0.3, 6.4, 4.4, -0.5, "#b58be8");
      oval(c, x - 8, yy + 4 + flatter * 0.3, 5.4, 3.8, 0.5, "#b58be8");
      oval(c, x + 9, yy - 4 - flatter * 0.3, 6.4, 4.4, 0.5, "#b58be8");
      oval(c, x + 8, yy + 4 + flatter * 0.3, 5.4, 3.8, -0.5, "#b58be8");
      // Flecken auf den Flügeln
      kreis(c, x - 9, yy - 4 - flatter * 0.3, 1.7, "#e8c25a");
      kreis(c, x + 9, yy - 4 - flatter * 0.3, 1.7, "#e8c25a");
      // Körper
      oval(c, x, yy, 3.0, 7.4, 0, "#8a63c9");
      // Kopf
      kreis(c, x, yy - 8, 3.4, "#8a63c9");
      // Fühler
      linie(c, x - 1, yy - 10.4, x - 3.4, yy - 14.4, "#3d3a35", 1.2);
      linie(c, x + 1, yy - 10.4, x + 3.4, yy - 14.4, "#3d3a35", 1.2);
      kreis(c, x - 3.4, yy - 14.8, 0.9, "#e8c25a");
      kreis(c, x + 3.4, yy - 14.8, 0.9, "#e8c25a");
      // Augen
      auge(c, x - 1, yy - 8.4, 0.85, "#1d1610");
      auge(c, x + 1, yy - 8.4, 0.85, "#1d1610");
    },
  },
  {
    tuer: 22,
    name: "Steinwutz",
    beschreibung: "Steinerne Schnauze; grunzt im Krempelraum nach alten Dingen.",
    ort: "Krempelraum",
    groesse: 26,
    farben: [
      { label: "Stein", value: "#8a8d88" },
      { label: "Stein dunkel", value: "#6f746f" },
      { label: "Schnauze", value: "#a3a6a0" },
      { label: "Auge", value: "#f2e0c4" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 1.4) * 0.6;
      // Körper (quaderartig)
      rrectP(c, x - 10, y - 16 + wip, 20, 15.4, 3, "#8a8d88");
      // Schnauze
      rrectP(c, x + 6, y - 11 + wip, 7.4, 5.4, 2, "#a3a6a0");
      kreis(c, x + 10.4, y - 8.4 + wip, 0.9, "#3d3a35");
      kreis(c, x + 10.4, y - 10.4 + wip, 0.9, "#3d3a35");
      // Steinarme
      rect2(c, x - 12.4, y - 13 + wip, 3.4, 8.4, "#6f746f");
      rect2(c, x + 9, y - 13 + wip, 3.4, 8.4, "#6f746f");
      // Beine
      rect2(c, x - 8, y - 2.4, 5.4, 2.8, "#6f746f");
      rect2(c, x + 3.4, y - 2.4, 5.4, 2.8, "#6f746f");
      // Gesicht
      linie(c, x - 3.4, y - 13.4 + wip, x - 1.4, y - 13.4 + wip, "#f2e0c4", 1.4);
      linie(c, x + 1, y - 13.4 + wip, x + 3, y - 13.4 + wip, "#f2e0c4", 1.4);
      // Riss im Stein
      linie(c, x - 4, y - 6 + wip, x - 1.4, y - 9.4 + wip, "#6f746f", 1.1);
      linie(c, x - 1.4, y - 9.4 + wip, x - 2.4, y - 12.4 + wip, "#6f746f", 1.1);
    },
  },
  {
    tuer: 23,
    name: "Federkuh",
    beschreibung: "Federiges Dacher-Glück; sitzt gern auf dem Schornstein.",
    ort: "Dach / Schornstein",
    groesse: 28,
    farben: [
      { label: "Körper", value: "#c9a86a" },
      { label: "Feder", value: "#e2cfa0" },
      { label: "Schnabel", value: "#e8b34a" },
      { label: "Kamm", value: "#c9453a" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 2.6) * 0.9;
      // Körper
      oval(c, x, y - 12 + wip, 8.4, 10.4, 0, "#c9a86a");
      // Kopf
      kreis(c, x + 1.4, y - 25 + wip, 6.4, "#c9a86a");
      // Kamm
      dreieck(c, [x - 1, y - 31 + wip], [x + 2.4, y - 31 + wip], [x + 0.7, y - 34.4 + wip], "#c9453a");
      dreieck(c, [x + 2.4, y - 30.4 + wip], [x + 5, y - 30.4 + wip], [x + 3.7, y - 33.4 + wip], "#c9453a");
      // Schnabel
      poly(c, [[x + 6.4, y - 25 + wip], [x + 12, y - 23.4 + wip], [x + 6.4, y - 22.4 + wip]], "#e8b34a");
      // Schwanzfedern
      for (let i = 0; i < 3; i++) {
        linie(c, x - 8, y - 14 + wip, x - 16.4 - i * 1.6, y - 8 - i * 3.4 + wip, "#e2cfa0", 2.0);
      }
      // Flügel
      oval(c, x - 2, y - 12 + wip, 3.0, 6.4, 0.3, "#e2cfa0");
      // Beine
      linie(c, x - 2.4, y - 2.4, x - 2.4, y, "#e8b34a", 1.8);
      linie(c, x + 2.4, y - 2.4, x + 2.4, y, "#e8b34a", 1.8);
      // Gesicht
      auge(c, x, y - 26.4 + wip, 1.15, "#1d1610");
    },
  },
  {
    tuer: 24,
    name: "Lunimeister",
    beschreibung: "Seltenes Glücks-Mon; erscheint nur, wenn alle Türchen offen sind.",
    ort: "Wohnzimmer (versteckt)",
    groesse: 34,
    farben: [
      { label: "Körper", value: "#f0a8c0" },
      { label: "Schweif", value: "#c97fb0" },
      { label: "Glückskern", value: "#e8c25a" },
      { label: "Auge", value: "#3d3a35" },
    ],
    maler: (c, x, y, t) => {
      const schweb = Math.sin(t * 1.4) * 3.4;
      const yy = y - 22 + schweb;
      // Umgebender Glanz
      const g = c.createRadialGradient(x, yy, 4, x, yy, 26);
      g.addColorStop(0, "rgba(255,214,130,.35)");
      g.addColorStop(1, "rgba(255,214,130,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, yy, 26, 0, Math.PI * 2);
      c.fill();
      // Schweif
      c.strokeStyle = "#c97fb0";
      c.lineWidth = 2.6;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x - 6, yy + 8);
      c.quadraticCurveTo(x - 16, yy + 4, x - 12, yy - 8);
      c.stroke();
      kreis(c, x - 12, yy - 8, 2.4, "#e8c25a");
      // Körper
      oval(c, x, yy, 8.4, 10.4, 0, "#f0a8c0");
      // Kopf
      kreis(c, x, yy - 12, 7.4, "#f0a8c0");
      // Ohren
      dreieck(c, [x - 6, yy - 16], [x - 9, yy - 23], [x - 1, yy - 17.4], "#f0a8c0");
      dreieck(c, [x + 6, yy - 16], [x + 9, yy - 23], [x + 1, yy - 17.4], "#f0a8c0");
      // Gesicht
      auge(c, x - 2.4, yy - 13, 1.4, "#3d3a35");
      auge(c, x + 2.4, yy - 13, 1.4, "#3d3a35");
      c.strokeStyle = "#3d3a35";
      c.lineWidth = 0.9;
      c.beginPath();
      c.arc(x, yy - 9.4, 2.8, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
      // Glückskern auf der Stirn
      stern5(c, x, yy - 17, 3.0, "#e8c25a");
      // kleine Arme
      linie(c, x - 7.4, yy - 2, x - 12.4, yy + 4, "#f0a8c0", 2.3);
      linie(c, x + 7.4, yy - 2, x + 12.4, yy + 4, "#f0a8c0", 2.3);
    },
  },
];

/** Hilfsfunktionen für die Maler (lokal, damit die Datei eigenständig bleibt). */
function dreieck(c: C, p0: Pt, p1: Pt, p2: Pt, f: string) {
  poly(c, [p0, p1, p2], f);
}

function rrectP(c: C, x: number, y: number, w: number, h: number, r: number, f: string) {
  c.fillStyle = f;
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
  c.fill();
}

/** Zeichnet einen Luni-Mon nach Nummer (Türchen 1–24). */
export function drawLuniMon(
  c: C,
  tuer: number,
  x: number,
  y: number,
  t: number,
  scale = 1,
) {
  const mon = LUNI_MONS.find((m) => m.tuer === tuer);
  if (!mon) return;
  c.save();
  mon.maler(c, x, y, t, scale);
  c.restore();
}

/** Zeichnet alle 24 in einem Raster (für den Kontakt-Bogen im Mons-Studio). */
export function drawLuniMonBogen(
  c: C,
  tueren: number[],
  startX: number,
  startY: number,
  cellW: number,
  cellH: number,
  cols: number,
  t: number,
  scale: number,
) {
  tueren.forEach((tuer, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const mon = LUNI_MONS.find((m) => m.tuer === tuer);
    if (!mon) return;
    const x = startX + col * cellW + cellW / 2;
    const bodenY = startY + row * cellH + cellH - 20;
    const sk = scale * Math.min(1, (cellH - 34) / mon.groesse);
    drawLuniMon(c, tuer, x, bodenY, t + i * 0.4, sk);
  });
}
