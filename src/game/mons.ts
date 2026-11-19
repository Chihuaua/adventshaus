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
  /** Konkret angedachte Idle-Fähigkeit (nur Beschreibung, noch nicht gebaut). */
  faehigkeit: string;
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
    faehigkeit: "Blitzt zwischen zwei Pakitchus, wenn sie sich begegnen; zündet kurz die Zimmerlampe, wenn Luni sie ausschaltet.",
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
    name: "Toseblu",
    beschreibung: "Samenwesen auf vielen kleinen Wurzeln, trägt eine knospende Blüte als Kopf.",
    faehigkeit: "Öffnet seine Blüte bei Tageslicht und schließt sie nachts; lässt ein Blatt fallen, das langsam schwebt.",
    ort: "Fensterbank",
    groesse: 26,
    farben: [
      { label: "Körper", value: "#a3c98a" },
      { label: "Blüte", value: "#e896a8" },
      { label: "Blüte hell", value: "#f7c2cf" },
      { label: "Wurzeln", value: "#7a5a3c" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 1.8) * 1.2;
      // Körper als kleiner runder Samen
      oval(c, x, y - 10, 7.0, 8.6, 0, "#a3c98a");
      // Kopf mittig über dem Körper
      kreis(c, x, y - 19.6, 4.8, "#a3c98a");
      // Viele feine Wurzeln als Beine – alle unter dem Körper
      for (const [dx, dx2] of [[-4.2, -5.6], [-1.8, -2.2], [1.2, 1.6], [4.0, 4.8]] as const) {
        linie(c, x + dx, y - 3.6, x + dx2, y, "#7a5a3c", 1.7);
      }
      // Blütenblätter als Kopf-Krone (drei Blätter)
      for (const [a] of [[-0.7], [0], [0.7]] as const) {
        oval(c, x + Math.sin(a) * 4.6, y - 26.4 + wip - Math.cos(a) * 3.4, 3.4, 4.2, a * 0.7, "#e896a8");
      }
      // Blütenmitte als Gesicht
      kreis(c, x, y - 25.4 + wip, 3.2, "#f7c2cf");
      auge(c, x - 1.4, y - 26.2 + wip, 1.0, "#1d1610");
      auge(c, x + 1.4, y - 26.2 + wip, 1.0, "#1d1610");
      // kleines Lächeln
      c.strokeStyle = "#3d3a35";
      c.lineWidth = 0.7;
      c.beginPath();
      c.arc(x, y - 25.4 + wip, 1.4, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
      // zwei kleine Blätter als Arme
      oval(c, x - 6.6, y - 12.4 + wip, 3.4, 1.7, -0.55, "#4d9a66");
      oval(c, x + 6.6, y - 12.4 + wip, 3.4, 1.7, 0.55, "#4d9a66");
    },
  },
  {
    tuer: 3,
    name: "Kesselax",
    beschreibung: "Feuer-Echse mit Glimmschwanz; wärmt sich am Herd.",
    faehigkeit: "Wärmt sich am Kessel; kleine Flammen hüpfen in der Pfanne, wenn Luni kocht.",
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
    beschreibung: "Kleiner Wasser-Nix mit Flossen, Kranz und drei Blasen um den Kopf.",
    faehigkeit: "Blubbert Blasen um seinen Kopf, die aufsteigen; schiebt kleine Wasserwellen über die Wanne.",
    ort: "Badezimmer",
    groesse: 24,
    farben: [
      { label: "Körper", value: "#7ec4dc" },
      { label: "Flossen", value: "#5aa8c9" },
      { label: "Bauch", value: "#f2e6cf" },
      { label: "Blasen", value: "#eaf5fc" },
    ],
    maler: (c, x, y, t) => {
      const schweb = Math.sin(t * 2.2) * 1.2;
      const yy = y - 14 + schweb;
      // Schwanzflosse hinten
      poly(c, [[x - 6.4, yy - 1], [x - 13.4, yy - 6 + Math.sin(t * 4) * 1.6], [x - 13.4, yy + 4 + Math.sin(t * 4) * 1.6]], "#5aa8c9");
      // Körper
      oval(c, x, yy, 7.0, 7.8, 0, "#7ec4dc");
      rect2(c, x - 2.2, yy - 1.4, 6.6, 5.6, "#f2e6cf");
      // Kopf
      kreis(c, x + 4.4, yy - 7.4, 4.6, "#7ec4dc");
      // Seitenflossen
      oval(c, x - 5.4, yy - 2.4, 3.4, 1.7, -0.5, "#5aa8c9");
      oval(c, x + 5.4, yy - 2.4, 3.4, 1.7, 0.5, "#5aa8c9");
      // Rückenflosse
      poly(c, [[x - 1, yy - 7.6], [x + 1.4, yy - 7.6], [x + 0.6, yy - 12.4]], "#5aa8c9");
      // Gesicht
      auge(c, x + 3.4, yy - 8.4, 1.25, "#1d1610");
      auge(c, x + 6.4, yy - 8.2, 1.25, "#1d1610");
      // Lächeln
      c.strokeStyle = "#3d3a35";
      c.lineWidth = 0.75;
      c.beginPath();
      c.arc(x + 4.9, yy - 4.8, 2.0, Math.PI * 0.2, Math.PI * 0.8);
      c.stroke();
      // Drei Blasen um den Kopf (kern des Wasser-Mons)
      const bl = (t * 0.35) % 1;
      kreis(c, x + 10, yy - 12 - bl * 5, 2.4 - bl * 0.9, "rgba(234,245,252,.6)");
      kreis(c, x + 11.4, yy - 4 - ((bl + 0.5) % 1) * 6, 1.9 - ((bl + 0.5) % 1) * 0.7, "rgba(234,245,252,.5)");
      kreis(c, x + 8.6, yy + 2 - ((bl + 0.8) % 1) * 5, 1.4 - ((bl + 0.8) % 1) * 0.5, "rgba(234,245,252,.45)");
    },
  },
  {
    tuer: 5,
    name: "Wolpuff",
    beschreibung: "Luftballon-Wesen mit großen Augen; singt leise vor sich hin.",
    faehigkeit: "Pustet Glitzerstaub, der langsam absinkt und verglüht; schaukelt im Takt, wenn Luni Musik hört.",
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
      kreis(c, x - 9.6, y - 25.4 + wip, 1.7, "#d97fa0");
      kreis(c, x + 9.6, y - 25.4 + wip, 1.7, "#d97fa0");
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
    faehigkeit: "Spielt mit Zwockel Fangen im Flur; sitzt vor der Haustür, wenn es draußen klingelt.",
    ort: "Haustür",
    groesse: 30,
    farben: [
      { label: "Körper", value: "#d96c3f" },
      { label: "Mähne", value: "#3d2a1e" },
      { label: "Bauch", value: "#f2e0c4" },
      { label: "Kette", value: "#8a8f98" },
    ],
    maler: (c, x, y, t) => {
      const wedel = Math.sin(t * 5.5) * 2.6;
      // Körper
      oval(c, x, y - 12, 9.0, 11.4, 0, "#d96c3f");
      oval(c, x, y - 8, 5.6, 7.4, 0, "#f2e0c4");
      // Schwanz direkt an der Kruppe, wedelt mit
      c.strokeStyle = "#d96c3f";
      c.lineWidth = 3.2;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x - 8.4, y - 17);
      c.quadraticCurveTo(x - 13.4, y - 19 + wedel, x - 16.4, y - 25 + wedel * 1.4);
      c.stroke();
      // Kopf
      kreis(c, x + 2, y - 26, 6.8, "#d96c3f");
      // Schnauze
      oval(c, x + 5, y - 23.4, 3.6, 2.6, 0.1, "#f2e0c4");
      kreis(c, x + 8.4, y - 23.8, 1.5, "#231813");
      // Ohren
      dreieck(c, [x - 3, y - 30], [x - 6, y - 35.5], [x + 1.4, y - 30.5], "#3d2a1e");
      // Mähne über dem Kopf und am Nacken (ohne Idle-Bewegung)
      for (let i = 0; i < 4; i++) {
        linie(c, x - 2 + i * 1.7, y - 31.4, x - 1.3 + i * 1.7, y - 36.4, "#3d2a1e", 2.0);
      }
      for (const [mx, my] of [[-7.6, y - 17], [-8.4, y - 15], [-7.2, y - 13]] as const) {
        linie(c, mx, my, mx - 3.2, my - 3.8, "#3d2a1e", 2.0);
      }
      // Beine
      rect2(c, x - 5.4, y - 6, 4.4, 6, "#d96c3f");
      rect2(c, x + 2, y - 6, 4.4, 6, "#d96c3f");
      // Kette: Glieder mittig über der Brust ausgerichtet
      for (let i = 0; i < 4; i++) kreis(c, x + 1.4, y - 16.6 + i * 2.6, 1.2, "#8a8f98");
      // Gesicht
      auge(c, x, y - 27.4, 1.15, "#1d1610");
      auge(c, x + 4.6, y - 27.4, 1.15, "#1d1610");
    },
  },
  {
    tuer: 7,
    name: "Zwockel",
    beschreibung: "Träges Entenwesen mit Gähn-Gesicht; planscht in der Wanne.",
    faehigkeit: "Lässt die Wanne überlaufen, Wasser tropft an der Kante; gähnt und rutscht dabei ein Stück.",
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
    faehigkeit: "Mimt für einen Moment ein Möbel und verändert die Silhouette des Raums; schaut nur, wenn niemand hinsieht.",
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
    faehigkeit: "Verschiebt Kissen auf dem Sofa, um sich breiter zu machen; schläft auf Luni-Polstern ein.",
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
    faehigkeit: "Haucht Eiskristalle, die kurz an Fenstern sichtbar werden und tauen.",
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
    },
  },
  {
    tuer: 11,
    name: "Funkenfeu",
    beschreibung: "Sechs Feuerwedel; kuschelt sich gern an den warmen Herd.",
    faehigkeit: "Zündet den Herd kurz an; Flammen zucken hoch und vergehen, wenn Luni kocht.",
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
      // Sechs Feuerruten hinter dem Körper (nach hinten geschoben)
      for (let i = 0; i < 6; i++) {
        const a = -2.55 + i * 0.34;
        const lx = x - 13.4 + Math.cos(a) * 12.4;
        const ly = y - 13 + wip + Math.sin(a) * 12.4;
        linie(c, x - 6.4, y - 13 + wip, lx, ly, "#e8b34a", 2.2);
        kreis(c, lx, ly, 1.6, "#c9453a");
      }
      // Kopf
      kreis(c, x + 1.6, y - 23 + wip, 6.0, "#e8a25a");
      // Gesicht
      auge(c, x - 0.4, y - 24.4 + wip, 1.15, "#1d1610");
      auge(c, x + 3.6, y - 24.4 + wip, 1.15, "#1d1610");
      // Schnabel rot, mit Spitze nach rechts unter den Augen
      poly(c, [[x + 1.4, y - 22.4 + wip], [x + 8.6, y - 21.4 + wip], [x + 1.4, y - 20.4 + wip]], "#c9453a");
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
    faehigkeit: "Lässt Blätter fallen, die kurz im Raum schweben und vergehen; wächst bei Regen.",
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
    faehigkeit: "Schiebt Seifenblasen über die Wanne; geht rückwärts und dreht sich nie um.",
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
    name: "Triflare",
    beschreibung: "Fliegendes, goldenes Triforce aus drei schwebenden Dreiecken.",
    faehigkeit: "Schwebt langsam durchs Zockerzimmer; die drei Dreiecke trennen sich, rotieren und finden wieder zusammen.",
    ort: "Zockerzimmer",
    groesse: 22,
    farben: [
      { label: "Dreieck oben", value: "#f2d24b" },
      { label: "Dreieck unten", value: "#e8b34a" },
      { label: "Rand", value: "#c49a35" },
      { label: "Glanz", value: "#fff4d0" },
    ],
    maler: (c, x, y, t) => {
      const schweb = Math.sin(t * 1.6) * 2.4;
      const yy = y - 14 + schweb;
      // Sanfter Goldglanz
      const g = c.createRadialGradient(x, yy, 2, x, yy, 22);
      g.addColorStop(0, "rgba(255,222,140,.28)");
      g.addColorStop(1, "rgba(255,222,140,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, yy, 22, 0, Math.PI * 2);
      c.fill();
      // Drei Dreiecke: öffnen sich leicht und finden wieder zusammen
      const offen = (Math.sin(t * 1.2) * 0.5 + 0.5) * 5;
      // Oberes Dreieck
      const obenY = yy - 6 - offen * 0.4;
      poly(c, [[x, obenY - 7], [x - 7, obenY + 4], [x + 7, obenY + 4]], "#f2d24b");
      poly(c, [[x, obenY - 4.4], [x - 5, obenY + 2.4], [x + 5, obenY + 2.4]], "#fff4d0");
      c.strokeStyle = "#c49a35";
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(x, obenY - 7); c.lineTo(x - 7, obenY + 4); c.lineTo(x + 7, obenY + 4); c.closePath();
      c.stroke();
      // Unten links
      const uLx = x - 6.4 - offen, uLy = yy + 6 + offen * 0.3;
      poly(c, [[uLx - 7, uLy + 4], [uLx + 7, uLy + 4], [uLx, uLy - 7]], "#e8b34a");
      poly(c, [[uLx - 4.6, uLy + 2], [uLx + 4.6, uLy + 2], [uLx, uLy - 4.2]], "#fff4d0");
      c.beginPath();
      c.moveTo(uLx - 7, uLy + 4); c.lineTo(uLx + 7, uLy + 4); c.lineTo(uLx, uLy - 7); c.closePath();
      c.stroke();
      // Unten rechts
      const uRx = x + 6.4 + offen, uRy = yy + 6 + offen * 0.3;
      poly(c, [[uRx - 7, uRy + 4], [uRx + 7, uRy + 4], [uRx, uRy - 7]], "#e8b34a");
      poly(c, [[uRx - 4.6, uRy + 2], [uRx + 4.6, uRy + 2], [uRx, uRy - 4.2]], "#fff4d0");
      c.beginPath();
      c.moveTo(uRx - 7, uRy + 4); c.lineTo(uRx + 7, uRy + 4); c.lineTo(uRx, uRy - 7); c.closePath();
      c.stroke();
    },
  },
  {
    tuer: 15,
    name: "Traumwolki",
    beschreibung: "Weiche Wolke mit Traumsternchen; schwebt durch den Flur und macht schlapp.",
    faehigkeit: "Lässt kleine Traumsternchen fallen, die sich langsam auflösen; schwebt auf Schlapadors Bauch, wenn beide im Schlafzimmer sind.",
    ort: "Flur",
    groesse: 30,
    farben: [
      { label: "Wolke", value: "#f2f0ea" },
      { label: "Wolke Schatten", value: "#d8d3c8" },
      { label: "Wange", value: "#f5b8c4" },
      { label: "Traumstern", value: "#e8c25a" },
    ],
    maler: (c, x, y, t) => {
      const schweb = Math.sin(t * 1.5) * 2.6;
      const atem = Math.sin(t * 1.9) * 0.9;
      const yy = y - 26 + schweb;
      // Wolkenkörper in Dragonball-Form: gestufte Rundbögen mit flacher Unterseite
      poly(c, [[x - 17.4, yy + 6], [x - 14.4, yy - 2], [x - 9.4, yy - 6], [x - 2.4, yy - 8.4], [x + 5.4, yy - 6.4], [x + 11.4, yy - 2], [x + 14.4, yy + 2], [x + 17.4, yy + 6]], "#f2f0ea");
      // Innenschatten an der Unterseite für die Wölbung
      poly(c, [[x - 14.4, yy + 4], [x - 8.4, yy + 1], [x, yy - 1.4], [x + 8.4, yy + 1], [x + 14.4, yy + 4], [x + 13.4, yy + 6], [x - 13.4, yy + 6]], "#e8e3d8");
      // kleine Wölbungen oben (wie bei der DB-Wolke)
      kreis(c, x - 9.4, yy - 3.4 + atem * 0.3, 5.4, "#f2f0ea");
      kreis(c, x + 1, yy - 5.4 + atem * 0.3, 6.4, "#f2f0ea");
      kreis(c, x + 10.4, yy - 2.4 + atem * 0.3, 5.0, "#f2f0ea");
      // flache Unterseite
      rect2(c, x - 14.4, yy + 4.4, 28.8, 1.6, "#f2f0ea");
      // Schlafende Augen
      linie(c, x - 4, yy - 3 + atem * 0.3, x - 1.4, yy - 3 + atem * 0.3, "#8a6a70", 1.5);
      linie(c, x + 1.4, yy - 3 + atem * 0.3, x + 4, yy - 3 + atem * 0.3, "#8a6a70", 1.5);
      // Rosige Wangen
      kreis(c, x - 5.4, yy + 1, 1.7, "#f5b8c4");
      kreis(c, x + 5.4, yy + 1, 1.7, "#f5b8c4");
      // Kleiner offener Mund (sanftes Schnarchen)
      oval(c, x, yy + 3.4, 1.5, 1.1, 0, "#8a6a70");
      // Traumsternchen fallen
      for (let i = 0; i < 3; i++) {
        const p = ((t * 0.24 + i * 0.33) % 1 + 1) % 1;
        const sx = x - 8 + i * 8 + Math.sin(p * 4) * 2.4;
        const sy = yy + 8 + p * 22;
        const alpha = Math.sin(p * Math.PI) * 0.85;
        c.save();
        c.globalAlpha = alpha;
        stern5(c, sx, sy, 2.2 - p * 0.7, "#e8c25a");
        c.restore();
      }
      // kleine Ärmchen als Wolkenzipfel
      oval(c, x - 13.4, yy - 1, 3.0, 2.4, -0.4, "#f2f0ea");
      oval(c, x + 13.4, yy - 1, 3.0, 2.4, 0.4, "#f2f0ea");
    },
  },
  {
    tuer: 16,
    name: "Glockmun",
    beschreibung: "Schwebende Tränen-Freundin; zeichnet leise Kreise in die Luft.",
    faehigkeit: "Zeichnet mit dem Schwänzchen leuchtende Kreise in die Luft, die langsam verblassen; schwebt im Kreis um Nachtfalter im Dachgeschoss.",
    ort: "Flur hängend",
    groesse: 24,
    farben: [
      { label: "Körper", value: "#7fb3d9" },
      { label: "Schwänzchen", value: "#5c8fbf" },
      { label: "Kreise", value: "#cfe2f4" },
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
      // Schwänzchen zeichnet leuchtende Kreise in die Luft
      for (let i = 0; i < 3; i++) {
        const p = ((t * 0.32 + i * 0.33) % 1 + 1) % 1;
        c.strokeStyle = `rgba(207,226,244,${(1 - p) * 0.65})`;
        c.lineWidth = 1.1;
        c.beginPath();
        c.arc(x, yy + 13, 3.4 + p * 10, 0, Math.PI * 2);
        c.stroke();
      }
      kreis(c, x, yy + 11, 2.4, "#5c8fbf");
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
    beschreibung: "Zweiköpfiger Vogel-Sprint; beide Hälse wachsen aus einem Körper.",
    faehigkeit: "Rennt ab und zu wie von der Tarantel durchs Haus, lässt Federn zurück; gackernt, wenn es dabei stolpert.",
    ort: "Garten und Flur",
    groesse: 34,
    farben: [
      { label: "Körper", value: "#a5764a" },
      { label: "Hals", value: "#8f6339" },
      { label: "Feder", value: "#c99a63" },
      { label: "Schnabel", value: "#e8b34a" },
    ],
    maler: (c, x, y, t) => {
      const lauf = Math.sin(t * 7) * 1.6;
      // Körper
      oval(c, x, y - 16, 8.4, 11.4, 0, "#a5764a");
      // Hals 1 (vorderer Kopf): geschwungener Hals zum Kopf
      c.strokeStyle = "#8f6339";
      c.lineWidth = 3.0;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x + 3.4, y - 22);
      c.quadraticCurveTo(x + 4.4, y - 26.4, x + 3.4, y - 30);
      c.stroke();
      // Hals 2 (hinterer Kopf)
      c.beginPath();
      c.moveTo(x + 5.4, y - 20.4);
      c.quadraticCurveTo(x + 9.4, y - 23.4, x + 10.4, y - 28);
      c.stroke();
      // Kopf 1
      kreis(c, x + 3.4, y - 30, 4.4, "#a5764a");
      // Kopf 2
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
    faehigkeit: "Zieht sich in den Kellerboden zurück und taucht an anderer Stelle wieder auf.",
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
    faehigkeit: "Beschlägt den Spiegel mit Atem, der sich langsam wieder klärt; verfolgt Luni mit den Augen.",
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
      // Mund als kleines Dreieck unter der Nase
      poly(c, [[x - 0.6, y - 10.4 + wip], [x + 1.6, y - 10.4 + wip], [x + 0.5, y - 8.6 + wip]], "#3d3a35");
    },
  },
  {
    tuer: 20,
    name: "Eisblub",
    beschreibung: "Schnee-Echse; rutscht durch den verschneiten Garten.",
    faehigkeit: "Hinterlässt beim Rutschen eine kurze Eisspur, die langsam auftaut; friert bei Kälte ein.",
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
    beschreibung: "Flügel-Mon mit vier Flügeln; schwebt nachts durchs Dachgeschoss.",
    faehigkeit: "Umkreist nachts die Zimmerlampe und wirft wandernde Schatten an die Wand.",
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
      // Vier Flügel: oben und unten je Seite, rahmen den schlanken Körper ein
      oval(c, x - 10.4, yy - 3.4 - flatter * 0.3, 6.4, 4.4, -0.45, "#b58be8");
      oval(c, x - 9.0, yy + 5.0 + flatter * 0.3, 5.2, 3.6, 0.45, "#b58be8");
      oval(c, x + 10.4, yy - 3.4 - flatter * 0.3, 6.4, 4.4, 0.45, "#b58be8");
      oval(c, x + 9.0, yy + 5.0 + flatter * 0.3, 5.2, 3.6, -0.45, "#b58be8");
      // Flecken auf den oberen Flügeln
      kreis(c, x - 10.4, yy - 3.4 - flatter * 0.3, 1.7, "#e8c25a");
      kreis(c, x + 10.4, yy - 3.4 - flatter * 0.3, 1.7, "#e8c25a");
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
    beschreibung: "Steinernes Eber-Mon mit Steinhaut, Rüssel und kleinen Stoßzähnen; wühlt im Krempelraum.",
    faehigkeit: "Wühlt mit der Schnauze zwischen den Kartons und schiebt sie zur Seite; grunzt, wenn Luni vorbeigeht.",
    ort: "Krempelraum",
    groesse: 26,
    farben: [
      { label: "Körper", value: "#8a8d88" },
      { label: "Rücken", value: "#a3a6a0" },
      { label: "Rüssel", value: "#c4b8a8" },
      { label: "Stoßzahn", value: "#f2e6cf" },
    ],
    maler: (c, x, y, t) => {
      const wip = Math.sin(t * 1.4) * 0.6;
      // Körper als massiver Rumpf
      oval(c, x - 1, y - 12 + wip, 10.4, 8.4, 0, "#8a8d88");
      // Rückenbuckel
      oval(c, x - 3, y - 17 + wip, 7.0, 4.4, 0, "#a3a6a0");
      // Kopf mit Rüssel
      kreis(c, x + 8.4, y - 14 + wip, 5.4, "#8a8d88");
      oval(c, x + 13, y - 15.4 + wip, 4.4, 2.6, 0.1, "#c4b8a8");
      // Rüssellöcher
      kreis(c, x + 14.4, y - 16.4 + wip, 0.7, "#6f746f");
      kreis(c, x + 16.4, y - 15.4 + wip, 0.7, "#6f746f");
      // kleine Stoßzähne
      linie(c, x + 11.4, y - 12 + wip, x + 13.4, y - 8.4 + wip, "#f2e6cf", 1.7);
      // Ohren
      dreieck(c, [x + 6.4, y - 19 + wip], [x + 9.4, y - 24 + wip], [x + 11, y - 18 + wip], "#6f746f");
      // Beine
      rect2(c, x - 6, y - 4.4 + wip * 0.5, 4.4, 4.4, "#6f746f");
      rect2(c, x + 4.4, y - 4.4 + wip * 0.5, 4.4, 4.4, "#6f746f");
      // Schwanz mit Quaste
      linie(c, x - 10.4, y - 12 + wip, x - 14.4, y - 8.4 + wip, "#8a8d88", 1.9);
      kreis(c, x - 15.4, y - 7.4 + wip, 1.4, "#a3a6a0");
      // Gesicht
      auge(c, x + 8, y - 15.4 + wip, 1.15, "#f2e0c4");
      // Riss in der Steinhaut
      linie(c, x - 5.4, y - 6 + wip, x - 3, y - 10 + wip, "#6f746f", 1.1);
      linie(c, x - 3, y - 10 + wip, x - 4.4, y - 13.4 + wip, "#6f746f", 1.1);
    },
  },
  {
    tuer: 23,
    name: "Federkuh",
    beschreibung: "Federiges Dacher-Glück; sitzt gern auf dem Schornstein.",
    faehigkeit: "Wirbelt Dampf vom heißen Herd auf; sitzt im Dunst und Federn wirbeln auf.",
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
      // Kamm wie bei einem Hahnenkamm: vier Zacken, alle ab der Außenlinie des Kopfes
      for (let i = 0; i < 4; i++) {
        const zx = x - 3.4 + i * 2.0;
        const zy = y - 31.4 + wip + (i === 0 || i === 3 ? 1.4 : 0);
        poly(c, [[zx, zy], [zx + 2.0, zy], [zx + 1.0, zy - 3.6]], "#c9453a");
      }
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
      auge(c, x + 3.0, y - 26.4 + wip, 1.15, "#1d1610");
    },
  },
  {
    tuer: 24,
    name: "Mondenschein",
    beschreibung: "Seltenes Mond-Mon; erscheint nur, wenn alle Türchen offen sind.",
    faehigkeit: "Erscheint nur, wenn alle 24 Türchen offen sind; versammelt kurz alle Mons am Fenster.",
    ort: "Wohnzimmer (versteckt)",
    groesse: 34,
    farben: [
      { label: "Körper", value: "#e5dcf7" },
      { label: "Schweif", value: "#b49ad9" },
      { label: "Stirnstern", value: "#a688e0" },
      { label: "Auge", value: "#3d3a35" },
    ],
    maler: (c, x, y, t) => {
      const schweb = Math.sin(t * 1.4) * 3.4;
      const yy = y - 22 + schweb;
      // Umgebender violetter Mondscheinglanz
      const g = c.createRadialGradient(x, yy, 4, x, yy, 28);
      g.addColorStop(0, "rgba(180,155,225,.32)");
      g.addColorStop(1, "rgba(180,155,225,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, yy, 28, 0, Math.PI * 2);
      c.fill();
      // Schweif: das untere Ende liegt weiter hinter dem Körper, Ende und Stern violett
      c.strokeStyle = "#b49ad9";
      c.lineWidth = 2.8;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x - 5.4, yy + 9.4);
      c.quadraticCurveTo(x - 17.4, yy + 6.4, x - 14.4, yy - 8.4);
      c.stroke();
      kreis(c, x - 14.4, yy - 9.4, 2.6, "#a688e0");
      // Körper weiß
      oval(c, x, yy, 8.4, 10.4, 0, "#e5dcf7");
      // Kopf weiß
      kreis(c, x, yy - 12, 7.4, "#e5dcf7");
      // Ohren
      dreieck(c, [x - 6, yy - 16], [x - 9, yy - 23], [x - 1, yy - 17.4], "#e5dcf7");
      dreieck(c, [x + 6, yy - 16], [x + 9, yy - 23], [x + 1, yy - 17.4], "#e5dcf7");
      // Gesicht
      auge(c, x - 2.4, yy - 13, 1.4, "#3d3a35");
      auge(c, x + 2.4, yy - 13, 1.4, "#3d3a35");
      c.strokeStyle = "#3d3a35";
      c.lineWidth = 0.9;
      c.beginPath();
      c.arc(x, yy - 9.4, 2.8, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
      // Violetter Stern auf der Stirn
      stern5(c, x, yy - 17, 3.2, "#a688e0");
      // kleine Arme
      linie(c, x - 7.4, yy - 2, x - 12.4, yy + 4, "#e5dcf7", 2.3);
      linie(c, x + 7.4, yy - 2, x + 12.4, yy + 4, "#e5dcf7", 2.3);
    },
  },
];

/** Hilfsfunktionen für die Maler (lokal, damit die Datei eigenständig bleibt). */
function dreieck(c: C, p0: Pt, p1: Pt, p2: Pt, f: string) {
  poly(c, [p0, p1, p2], f);
}


/**
 * Zeichnet einen Luni-Mon nach Nummer (Türchen 1–24).
 * Ursprung ist die Bodenlinie unter dem Mon; `scale` vergrößert das ganze
 * Wesen um diesen Faktor (wichtig für den Zoom im Mons-Studio).
 */
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
  c.translate(x, y);
  c.scale(scale, scale);
  mon.maler(c, 0, 0, t, scale);
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
