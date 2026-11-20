/* ERZEUGT aus src/game/deko.ts mit tools/deko-bauen.mjs – nicht von Hand ändern. */
/* quelle-pruefsumme: a9e540e2 */
(function(){
/* =======================================================================
   WEIHNACHTSDEKO — 24 Stücke, eines pro Adventstürchen

   Jedes Türchen (1–24) schaltet genau ein Deko-Stück im normalen Haus frei.
   Bei 0 offenen Türchen ist das Haus ganz normal, bei 24 steht es in voller
   Pracht (Finale: der große Baum). Nur Canvas-Primitive, keine Texte,
   keine Interaktion — reines Zuschauen (KI-START Grundsatz 1).
   Der Stand kommt aus dem Adventskalender-Speicher (Schlüssel/Wert).

   DEKO_VORSCHAU_ALLE = true zeigt alles, als wären alle Türchen offen.
   ======================================================================= */
/** Vorschau: alle 24 Stücke zeigen, als wären alle Türchen schon geöffnet. */
const DEKO_VORSCHAU_ALLE = true;
/* ------------------------------ Farben -------------------------------- */
const ROT = "#b03a30";
const ROT_HELL = "#c9453a";
const GRUEN = "#2e5c40";
const GRUEN_HELL = "#3f7f52";
const GOLD = "#e8c25a";
const GOLD_TIEF = "#c49a35";
const GOLD_HELL = "#f7dfa0";
const CREME = "#f3e7cd";
const SCHNEE = "#f2f5f8";
const HOLZ_DUNKEL = "#6b4423";
const WARM = "#ffd98a";
const DEKO_STUECKE = [
    { tuer: 1, name: "Türkranz", ort: "Haustür außen", box: { x: 149, y: 412, w: 24, h: 25 } },
    { tuer: 2, name: "Fußmatte", ort: "Flur", box: { x: 138, y: 449, w: 44, h: 5 } },
    { tuer: 3, name: "Duftschale", ort: "Küchenzeile", box: { x: 672, y: 400, w: 18, h: 15 } },
    { tuer: 4, name: "Windlicht", ort: "Fensterbank Wohnzimmer", box: { x: 343, y: 376, w: 12, h: 20 } },
    { tuer: 5, name: "Goldstern-Fensterbild", ort: "Küchenfenster", box: { x: 641, y: 374, w: 16, h: 16 } },
    { tuer: 6, name: "Sofa-Set", ort: "Wohnzimmer", box: { x: 320, y: 400, w: 90, h: 35 } },
    { tuer: 7, name: "Lichterkette Fenster", ort: "Wohnzimmerfenster", box: { x: 324, y: 350, w: 76, h: 52 } },
    { tuer: 8, name: "Adventskranz", ort: "Esstisch", box: { x: 725, y: 384, w: 28, h: 38 } },
    { tuer: 9, name: "Weihnachtsstrümpfe", ort: "Regal Wohnzimmer", box: { x: 260, y: 364, w: 28, h: 22 } },
    { tuer: 10, name: "Schneekugel", ort: "Bücherregal", box: { x: 267, y: 341, w: 14, h: 15 } },
    { tuer: 11, name: "Treppengirlande", ort: "Treppe EG→OG", box: { x: 688, y: 260, w: 136, h: 142 } },
    { tuer: 12, name: "Lichtervorhang", ort: "Treppenaufgang", box: { x: 712, y: 336, w: 86, h: 76 } },
    { tuer: 13, name: "Räuchermännchen", ort: "Flur", box: { x: 122, y: 422, w: 11, h: 26 } },
    { tuer: 14, name: "Nussknacker", ort: "neben Haustür", box: { x: 111, y: 410, w: 14, h: 38 } },
    { tuer: 15, name: "Herrnhuter Stern", ort: "Flurmitte", box: { x: 194, y: 334, w: 22, h: 32 } },
    { tuer: 16, name: "Tischläufer mit Teelichtern", ort: "Esstisch", box: { x: 728, y: 398, w: 68, h: 15 } },
    { tuer: 17, name: "Bett-Set", ort: "Schlafzimmer", box: { x: 280, y: 266, w: 106, h: 42 } },
    { tuer: 18, name: "Schwibbogen", ort: "Schlafzimmerfenster", box: { x: 338, y: 250, w: 54, h: 42 } },
    { tuer: 19, name: "Bad-Set", ort: "Badezimmer", box: { x: 612, y: 278, w: 56, h: 24 } },
    { tuer: 20, name: "Regal-Lichterkette", ort: "Gaming-Zimmer", box: { x: 482, y: 122, w: 46, h: 82 } },
    { tuer: 21, name: "Klavier-Goldgirlande", ort: "Musikzimmer", box: { x: 541, y: 140, w: 52, h: 18 } },
    { tuer: 22, name: "Dachrinnen-Lichterkette", ort: "Haus außen", box: { x: 80, y: 16, w: 800, h: 120 } },
    { tuer: 23, name: "Holzkrippe", ort: "Wohnzimmerecke", box: { x: 490, y: 418, w: 34, h: 30 } },
    { tuer: 24, name: "Weihnachtsbaum", ort: "Wohnzimmer", box: { x: 400, y: 350, w: 40, h: 98 } },
];
/** Welche Stücke sind sichtbar? Vorschau zeigt alle, sonst nur geöffnete Türchen. */
function dekoSichtbar(offen) {
    if (DEKO_VORSCHAU_ALLE)
        return DEKO_STUECKE.map(() => true);
    return DEKO_STUECKE.map((s) => offen.includes(s.tuer));
}
/* ------------------------------ Helfer -------------------------------- */
function rect(c, x, y, w, h, f) {
    c.fillStyle = f;
    c.fillRect(x, y, w, h);
}
function kreis(c, x, y, r, f) {
    c.fillStyle = f;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
}
function linie(c, x0, y0, x1, y1, f, b = 1) {
    c.strokeStyle = f;
    c.lineWidth = b;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
}
function dreieck(c, p0, p1, p2, f) {
    c.fillStyle = f;
    c.beginPath();
    c.moveTo(p0[0], p0[1]);
    c.lineTo(p1[0], p1[1]);
    c.lineTo(p2[0], p2[1]);
    c.closePath();
    c.fill();
}
/** Fünfzackiger Stern. */
function stern5(c, x, y, r, f) {
    c.fillStyle = f;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 === 0 ? r : r * 0.42;
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        if (i === 0)
            c.moveTo(px, py);
        else
            c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
}
/** Kleine Tannenspitze aus drei Strichen. */
function tannZweig(c, x, y, s, dunkel = false) {
    const f = dunkel ? GRUEN : GRUEN_HELL;
    linie(c, x, y, x - s, y + s * 0.7, f, 1.4);
    linie(c, x, y, x + s, y + s * 0.7, f, 1.4);
    linie(c, x, y, x, y - s * 0.8, f, 1.4);
}
/** Rote Schleife mit goldenem Knoten. */
function schleife(c, x, y, s) {
    c.fillStyle = ROT;
    c.beginPath();
    c.ellipse(x - s * 0.8, y, s * 0.9, s * 0.5, -0.3, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(x + s * 0.8, y, s * 0.9, s * 0.5, 0.3, 0, Math.PI * 2);
    c.fill();
    kreis(c, x, y, s * 0.35, GOLD);
}
/** Kerzenflamme mit Flackern; Spitze bei (x, y). */
function flamme(c, x, y, s, t, phase) {
    const fl = 1 + Math.sin(t * 9 + phase) * 0.16;
    c.fillStyle = "#ff9f43";
    c.beginPath();
    c.ellipse(x, y, 1.15 * s, 2.6 * s * fl, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff199";
    c.beginPath();
    c.ellipse(x, y + 0.5 * s, 0.55 * s, 1.2 * s * fl, 0, 0, Math.PI * 2);
    c.fill();
}
/** Warmer Lichtschein (wird nach der Nachtabdunkelung gezeichnet). */
function schein(c, x, y, r, t, phase, stark = 0.22) {
    const a = stark * (0.72 + 0.28 * Math.sin(t * 2.6 + phase));
    const g = c.createRadialGradient(x, y, 0.5, x, y, r);
    g.addColorStop(0, `rgba(255,214,130,${a})`);
    g.addColorStop(1, "rgba(255,214,130,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
}
/** Punkte entlang einer durchhängenden Girlande. */
function bogenPunkte(x0, y0, x1, y1, durchhang, ab) {
    const p = [];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const n = Math.max(2, Math.round(Math.hypot(dx, dy) / ab));
    for (let i = 0; i <= n; i++) {
        const k = i / n;
        p.push([x0 + dx * k, y0 + dy * k + Math.sin(k * Math.PI) * durchhang]);
    }
    return p;
}
/** Glühbirnchen mit warmem Kern. */
function birne(c, x, y, r, farbe) {
    kreis(c, x, y, r + 0.9, "rgba(255,220,150,.28)");
    kreis(c, x, y, r, farbe);
    kreis(c, x - r * 0.3, y - r * 0.3, r * 0.38, "#fff6dd");
}
/* ------------------------- Lichtpunkt-Listen --------------------------- */
/* Dieselben Punkte nutzt der Körper (Birnen) und der Glanz (Scheine). */
function ketteRechteck(x, y, w, h, ab) {
    const p = [];
    for (let px = x; px <= x + w + 0.5; px += ab)
        p.push([px, y]);
    for (let py = y + ab; py <= y + h; py += ab) {
        p.push([x, py]);
        p.push([x + w, py]);
    }
    return p;
}
function ketteFensterWZ() {
    return ketteRechteck(330, 358, 64, 38, 9);
}
function kranzFlammen() {
    return [
        [731, 394],
        [745, 394],
        [731, 404],
        [745, 404],
    ];
}
function vorhangStraenge() {
    const out = [];
    for (const x of [716, 742, 768, 794]) {
        const str = [];
        for (let y = 344; y <= 406; y += 9)
            str.push([x, y]);
        out.push(str);
    }
    return out;
}
function schwibbogenKerzen() {
    // Flammenspitzen auf dem Bogen (342..388, Scheitel 266)
    const p = [];
    for (let i = 0; i < 5; i++) {
        const x = 346 + i * 9.5;
        const y = 290 - 24 * Math.sin((Math.PI * (x - 342)) / 46) - 9;
        p.push([x, y]);
    }
    return p;
}
function regalKette() {
    return ketteRechteck(486, 126, 38, 74, 9.5);
}
function dachPunkte() {
    const p = [];
    const links = [
        [86, 128],
        [470, 22],
    ];
    const rechts = [
        [470, 22],
        [854, 128],
    ];
    for (const [a, b] of [links, rechts]) {
        const n = 13;
        for (let i = 1; i < n; i++) {
            const k = i / n;
            p.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + 5 + Math.sin(k * Math.PI) * 2]);
        }
    }
    return p.filter(([x]) => x >= 100 && x <= 860);
}
const WINDLICHT_FLAMME = [349, 382];
const HERRNHUTER = [205, 356];
const TEELICHTER = [
    [736, 404],
    [784, 404],
];
const KRIPPE_KIND = [504, 441];
const BAUM = [420, 448];
function baumLichter() {
    const p = [];
    for (let i = 0; i < 12; i++) {
        const yy = 440 - i * 5.5;
        const hw = 3 + (440 - yy) * 0.27;
        p.push([BAUM[0] + (i % 2 ? hw * 0.7 : -hw * 0.7), yy]);
    }
    return p;
}
/* ------------------------------ Stücke -------------------------------- */
function d01tuerkranz(c) {
    const [x, y] = [161, 424];
    c.strokeStyle = GRUEN;
    c.lineWidth = 5.5;
    c.beginPath();
    c.arc(x, y, 9, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = GRUEN_HELL;
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(x, y, 9, -0.6, 1.8);
    c.stroke();
    kreis(c, x - 6.5, y - 6, 1.4, ROT_HELL);
    kreis(c, x + 6.5, y - 6, 1.4, ROT_HELL);
    kreis(c, x, y + 9, 1.4, ROT_HELL);
    kreis(c, x - 9, y + 1, 1, GOLD);
    kreis(c, x + 9, y + 1, 1, GOLD);
    schleife(c, x, y + 10.5, 3.4);
}
function d02fussmatte(c) {
    rect(c, 138, 449, 44, 5, "#a83a30");
    rect(c, 138, 449, 44, 1, GOLD_TIEF);
    rect(c, 138, 453, 44, 1, GOLD_TIEF);
    rect(c, 140, 450.4, 40, 0.8, "rgba(255,235,200,.25)");
}
function d03duftschale(c) {
    const [x, y] = [681, 412];
    c.fillStyle = "#7a4a28";
    c.beginPath();
    c.ellipse(x, y - 1, 9, 3.4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#5c3a20";
    c.beginPath();
    c.ellipse(x, y - 2.4, 7.4, 2.2, 0, 0, Math.PI * 2);
    c.fill();
    // Orangenscheiben
    kreis(c, x - 3.4, y - 3.4, 2, "#e07b39");
    kreis(c, x - 3.4, y - 3.4, 1, "#f2b04a");
    kreis(c, x + 3.6, y - 3.2, 1.8, "#e07b39");
    kreis(c, x + 3.6, y - 3.2, 0.9, "#f2b04a");
    // Zimtstangen
    linie(c, x - 1, y - 6.4, x + 2.4, y - 2.6, "#6b3a1e", 1.8);
    linie(c, x + 1.4, y - 6.8, x + 4.4, y - 3, "#7a4526", 1.8);
    // Tannenzapfen
    kreis(c, x - 0.5, y - 3, 1.6, "#4a2f1a");
    kreis(c, x - 0.5, y - 3.6, 0.7, "#6b4a2a");
}
function d04windlicht(c, t) {
    rect(c, 344, 384, 10, 12, "rgba(240,246,250,.35)");
    rect(c, 344, 384, 1.2, 12, "rgba(255,255,255,.5)");
    rect(c, 347, 387, 4, 9, ROT);
    rect(c, 347, 387, 4, 1.4, ROT_HELL);
    flamme(c, WINDLICHT_FLAMME[0], WINDLICHT_FLAMME[1], 1, t, 0.4);
}
function d05goldstern(c) {
    stern5(c, 649, 382, 7, GOLD);
    stern5(c, 649, 382, 3, GOLD_HELL);
}
function d06sofaSet(c) {
    rect(c, 322, 414, 26, 14, ROT);
    rect(c, 322, 414, 26, 2, ROT_HELL);
    rect(c, 356, 414, 26, 14, "#96332b");
    rect(c, 356, 414, 26, 2, ROT_HELL);
    rect(c, 322, 426, 26, 1.2, GOLD_TIEF);
    rect(c, 356, 426, 26, 1.2, GOLD_TIEF);
    // Wolldecke über der rechten Lehne
    rect(c, 393, 404, 14, 28, "#e6d6b8");
    rect(c, 393, 410, 14, 2.4, ROT);
    rect(c, 393, 424, 14, 2.4, ROT);
    for (let i = 0; i < 5; i++)
        linie(c, 394.5 + i * 2.6, 432, 394.5 + i * 2.6, 434.5, "#c9b48c", 1);
}
function d07fensterkette(c, t) {
    const p = ketteFensterWZ();
    c.strokeStyle = "rgba(46,92,64,.8)";
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    for (const [x, y] of p)
        c.lineTo(x, y);
    c.stroke();
    p.forEach(([x, y], i) => {
        const an = 0.75 + 0.25 * Math.sin(t * 2.2 + i * 1.9);
        birne(c, x, y, 1.5, an > 0.6 ? WARM : "#d9b96a");
    });
}
function d08adventskranz(c, t) {
    const [x, y] = [738, 406];
    c.strokeStyle = GRUEN;
    c.lineWidth = 6.5;
    c.beginPath();
    c.arc(x, y, 9.5, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = GRUEN_HELL;
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(x, y, 9.5, -2.4, -0.6);
    c.stroke();
    kreis(c, x - 9.5, y + 3, 1.3, ROT_HELL);
    kreis(c, x + 9.5, y - 3, 1.3, ROT_HELL);
    kreis(c, x, y - 9.5, 1.1, GOLD);
    for (const [i, [kx, ky]] of [
        [0, [731, 396]],
        [1, [745, 396]],
        [2, [731, 406]],
        [3, [745, 406]],
    ]) {
        rect(c, kx - 1.5, ky, 3, 8, ROT);
        rect(c, kx - 1.5, ky, 3, 1.4, ROT_HELL);
        flamme(c, kx, ky - 3.4, 0.9, t, i * 1.7);
    }
    schleife(c, x, y + 11.5, 3);
}
function strumpf(c, x, y, f) {
    rect(c, x, y, 9, 13, f);
    rect(c, x, y, 9, 3, CREME);
    kreis(c, x + 2.4, y + 14.5, 3.4, f);
    rect(c, x, y + 11, 7, 5.5, f);
    kreis(c, x + 7.5, y + 14.5, 1.2, GOLD);
}
function d09struempfe(c) {
    linie(c, 260, 364, 288, 364, HOLZ_DUNKEL, 1.6);
    strumpf(c, 262, 365.5, ROT);
    strumpf(c, 276, 365.5, "#96332b");
}
function d10schneekugel(c, t) {
    rect(c, 269, 353, 10, 3, "#7a5a3c");
    kreis(c, 274, 348, 5.5, "rgba(214,230,242,.55)");
    c.strokeStyle = "rgba(240,248,255,.8)";
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(274, 348, 5.5, 0, Math.PI * 2);
    c.stroke();
    dreieck(c, [274, 344.5], [271.6, 349.5], [276.4, 349.5], GRUEN_HELL);
    for (let i = 0; i < 3; i++) {
        const p = (t * 0.4 + i * 0.33) % 1;
        kreis(c, 271.5 + i * 2.4, 345 + p * 6, 0.6, "rgba(255,255,255,.9)");
    }
}
function d11treppengirlande(c) {
    // Entlang dem Treppengeländer EG→OG (Fuß 818/448, Kopf 694/324)
    const pts = bogenPunkte(812, 388, 700, 264, -7, 13);
    c.strokeStyle = "rgba(46,92,64,.9)";
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts)
        c.lineTo(x, y);
    c.stroke();
    pts.forEach(([x, y], i) => {
        tannZweig(c, x, y, 3.4, i % 2 === 0);
        if (i % 3 === 1)
            kreis(c, x + 1.5, y + 1, 1.2, ROT_HELL);
        if (i % 4 === 2)
            kreis(c, x - 1.5, y - 1, 0.9, GOLD);
    });
    schleife(c, 788, 372, 3.2);
    schleife(c, 742, 322, 3.2);
    schleife(c, 706, 276, 3.2);
}
function d12lichtervorhang(c, t) {
    for (const str of vorhangStraenge()) {
        c.strokeStyle = "rgba(120,130,140,.5)";
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(str[0][0], 338);
        c.lineTo(str[0][0], str[str.length - 1][1]);
        c.stroke();
        str.forEach(([x, y], i) => {
            const an = 0.7 + 0.3 * Math.sin(t * 2.8 + x + i * 2.1);
            birne(c, x, y, 1.3, an > 0.55 ? WARM : "#cdb27e");
        });
    }
}
function d13raeuchermaennchen(c) {
    const x = 124;
    rect(c, x, 436, 7, 12, "#8c2f26");
    rect(c, x, 436, 7, 1.4, "#c9453a");
    kreis(c, x + 3.5, 433, 3.2, "#f4c9a0");
    kreis(c, x + 3.5, 435.5, 1.6, CREME);
    dreieck(c, [x - 0.5, 431], [x + 7.5, 431], [x + 3.5, 425], GRUEN);
    kreis(c, x + 3.5, 424.4, 1, ROT_HELL);
}
function d14nussknacker(c) {
    const x = 113;
    rect(c, x, 444, 10, 4, "#20242c");
    rect(c, x, 428, 10, 16, ROT);
    rect(c, x + 4, 428, 2, 16, GOLD);
    rect(c, x, 421, 10, 7, "#f4c9a0");
    kreis(c, x + 3, 425.5, 1.4, CREME);
    kreis(c, x + 7, 425.5, 1.4, CREME);
    rect(c, x - 1, 412, 12, 9, "#20242c");
    rect(c, x - 1, 418, 12, 2, GOLD);
    kreis(c, x + 5, 414.5, 1.3, ROT_HELL);
}
function d15herrnhuter(c, t) {
    const [x, y] = HERRNHUTER;
    linie(c, x, 336, x, y - 9, "#8a6a25", 1);
    const dreh = Math.sin(t * 0.7) * 0.08;
    c.save();
    c.translate(x, y);
    c.rotate(dreh);
    c.fillStyle = ROT;
    for (const a of [0, Math.PI / 2]) {
        c.save();
        c.rotate(a);
        c.fillRect(-2.2, -9, 4.4, 18);
        c.restore();
    }
    c.save();
    c.rotate(Math.PI / 4);
    c.fillStyle = ROT_HELL;
    c.fillRect(-1.6, -7, 3.2, 14);
    c.restore();
    c.save();
    c.rotate(-Math.PI / 4);
    c.fillStyle = ROT_HELL;
    c.fillRect(-1.6, -7, 3.2, 14);
    c.restore();
    c.restore();
    kreis(c, x, y, 2.6, GOLD);
    kreis(c, x, y, 1.2, GOLD_HELL);
}
function d16tischlaeufer(c, t) {
    rect(c, 730, 410, 62, 2.5, ROT);
    rect(c, 730, 410, 62, 0.8, GOLD_TIEF);
    rect(c, 730, 411.7, 62, 0.8, GOLD_TIEF);
    for (const [i, [x, y]] of TEELICHTER.entries()) {
        rect(c, x - 2.4, y, 4.8, 3.4, "rgba(240,246,250,.5)");
        rect(c, x - 1.8, y + 1.4, 3.6, 2, ROT_HELL);
        flamme(c, x, y - 1.6, 0.8, t, i * 2.2);
    }
}
function d17bettSet(c) {
    rect(c, 330, 290, 54, 16, ROT);
    rect(c, 330, 290, 54, 2.2, ROT_HELL);
    rect(c, 330, 303.5, 54, 2.5, GOLD_TIEF);
    rect(c, 334, 292.5, 46, 1, "rgba(255,235,200,.2)");
    tannZweig(c, 286, 276, 4);
    tannZweig(c, 290, 279, 3.2, true);
    schleife(c, 288, 280.5, 2.6);
    kreis(c, 283, 274, 1.1, ROT_HELL);
}
function d18schwibbogen(c, t) {
    // Holzbogen über der Fensterbank (Scheitel 266)
    c.strokeStyle = HOLZ_DUNKEL;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(342, 290);
    c.quadraticCurveTo(365, 258, 388, 290);
    c.stroke();
    c.strokeStyle = "rgba(255,225,170,.25)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(342, 288.5);
    c.quadraticCurveTo(365, 256.5, 388, 288.5);
    c.stroke();
    rect(c, 340, 288, 4, 2.5, HOLZ_DUNKEL);
    rect(c, 386, 288, 4, 2.5, HOLZ_DUNKEL);
    const kerzen = schwibbogenKerzen();
    kerzen.forEach(([x, y], i) => {
        rect(c, x - 1.2, y, 2.4, 7, CREME);
        flamme(c, x, y - 3, 0.85, t, i * 1.4);
    });
    // Winzige Tannen im Bogen
    dreieck(c, [352, 290], [356, 290], [354, 282], GRUEN);
    dreieck(c, [374, 290], [378, 290], [376, 282], GRUEN);
}
function d19badSet(c) {
    rect(c, 614, 281, 18, 2, HOLZ_DUNKEL);
    rect(c, 615, 283, 7, 16, ROT);
    rect(c, 615, 296.5, 7, 2.5, CREME);
    rect(c, 623, 283, 7, 16, "#96332b");
    rect(c, 623, 296.5, 7, 2.5, CREME);
    tannZweig(c, 663, 282, 2.6);
    kreis(c, 665, 280.5, 0.9, ROT_HELL);
    rect(c, 649, 283, 5, 3, "#8a5a2e");
    rect(c, 649, 283, 5, 1, "#c99a5b");
}
function d20regalkette(c, t) {
    const p = regalKette();
    c.strokeStyle = "rgba(60,70,60,.8)";
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    for (const [x, y] of p)
        c.lineTo(x, y);
    c.stroke();
    const bunt = [ROT_HELL, GOLD, "#3f8f5f", "#3f6fb0"];
    p.forEach(([x, y], i) => {
        const an = 0.7 + 0.3 * Math.sin(t * 3.1 + i * 2.3);
        birne(c, x, y, 1.4, an > 0.5 ? bunt[i % 4] : "#8a8578");
    });
}
function d21klaviergirlande(c) {
    const pts = bogenPunkte(543, 147, 591, 147, 7, 7);
    c.strokeStyle = GOLD_TIEF;
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts)
        c.lineTo(x, y);
    c.stroke();
    pts.forEach(([x, y], i) => {
        if (i % 2 === 0) {
            kreis(c, x, y + 2.6, 1.1, CREME);
            linie(c, x + 1, y + 2.6, x + 1, y - 1.4, CREME, 0.8);
        }
        else {
            kreis(c, x, y + 2.2, 0.9, ROT_HELL);
        }
    });
    schleife(c, 551, 150, 2.4);
    schleife(c, 583, 150, 2.4);
}
function d22dachkette(c, t) {
    const p = dachPunkte();
    c.strokeStyle = "rgba(30,34,40,.85)";
    c.lineWidth = 0.9;
    // Zwei Flügel getrennt verbinden (First bei 470/22)
    let start = 0;
    for (let i = 1; i < p.length; i++) {
        if (p[i][0] < p[i - 1][0]) {
            verbinde(p.slice(start, i));
            start = i;
        }
    }
    verbinde(p.slice(start));
    function verbinde(q) {
        c.beginPath();
        c.moveTo(q[0][0], q[0][1] - 4);
        for (const [x, y] of q)
            c.lineTo(x, y - 4);
        c.stroke();
    }
    p.forEach(([x, y], i) => {
        linie(c, x, y - 4, x, y - 1.4, "rgba(30,34,40,.85)", 0.8);
        const an = 0.7 + 0.3 * Math.sin(t * 2.4 + i * 1.6);
        birne(c, x, y, 1.6, an > 0.5 ? WARM : "#cdb27e");
    });
}
function d23krippe(c, t) {
    // Stall: Rückwand, Pfosten, Dach mit Schnee
    rect(c, 494, 432, 26, 16, "#6b4a2a");
    rect(c, 494, 432, 2.4, 16, "#4a2f1a");
    rect(c, 517.6, 432, 2.4, 16, "#4a2f1a");
    dreieck(c, [491, 432], [523, 432], [507, 422], "#8c2f26");
    linie(c, 493.5, 429.5, 507, 422.5, SCHNEE, 1.4);
    linie(c, 507, 422.5, 520.5, 429.5, SCHNEE, 1.4);
    // Stroh
    for (let i = 0; i < 5; i++)
        linie(c, 496 + i * 4.4, 447, 497.5 + i * 4.4, 444, "#d9a83c", 1);
    // Figuren: Maria, Josef, Kind (mit warmem Glanz)
    rect(c, 499, 438, 3.6, 8, "#3f6fb0");
    kreis(c, 500.8, 436.8, 1.6, "#f4c9a0");
    rect(c, 509, 438, 3.6, 8, "#6b4a2a");
    kreis(c, 510.8, 436.8, 1.6, "#e3b288");
    kreis(c, KRIPPE_KIND[0], KRIPPE_KIND[1], 1.9, GOLD_HELL);
    kreis(c, KRIPPE_KIND[0], KRIPPE_KIND[1], 3.1, `rgba(255,214,130,${0.35 + 0.1 * Math.sin(t * 3)})`);
    stern5(c, 507, 420.5, 1.6, GOLD);
}
function d24baum(c, t) {
    const [x, f] = BAUM;
    // Geschenke am Fuß
    rect(c, 404, 438, 10, 10, ROT);
    rect(c, 408, 438, 2, 10, GOLD);
    rect(c, 426, 440, 10, 8, GOLD_TIEF);
    rect(c, 430, 440, 2, 8, ROT_HELL);
    rect(c, 404, 441, 10, 1.4, "rgba(255,255,255,.2)");
    // Stamm
    rect(c, x - 3, f - 10, 6, 10, "#5c3a20");
    // Drei Tannenstufen mit Lichtkante
    const stufen = [
        [18, 446, 416],
        [14, 420, 394],
        [10, 396, 372],
    ];
    for (const [hw, yU, yO] of stufen) {
        dreieck(c, [x - hw, yU], [x + hw, yU], [x, yO], GRUEN);
        dreieck(c, [x - hw * 0.7, yU - 2], [x + hw * 0.7, yU - 2], [x, yO + 2], GRUEN_HELL);
        linie(c, x - hw, yU, x, yO, "rgba(220,235,225,.25)", 1);
    }
    // Kugeln in Rot, Gold, Weiß
    const kugeln = [
        [-10, 436, ROT_HELL],
        [10, 436, GOLD],
        [0, 428, SCHNEE],
        [-6, 442, GOLD],
        [6, 442, ROT_HELL],
        [-6, 408, SCHNEE],
        [6, 408, ROT_HELL],
        [0, 400, GOLD],
        [-4, 388, ROT_HELL],
        [4, 388, SCHNEE],
    ];
    for (const [dx, yy, farbe] of kugeln) {
        kreis(c, x + dx, yy, 2, farbe);
        kreis(c, x + dx - 0.6, yy - 0.6, 0.7, "rgba(255,255,255,.75)");
    }
    // Lichterkette spiralförmig
    for (const [i, [lx, ly]] of baumLichter().entries()) {
        const an = 0.7 + 0.3 * Math.sin(t * 3 + i * 1.3);
        birne(c, lx, ly, 1.3, an > 0.5 ? WARM : "#cdb27e");
    }
    // Sternspitze
    stern5(c, x, 367, 5, GOLD);
    stern5(c, x, 367, 2.2, GOLD_HELL);
}
/* ------------------------------ Aufrufe -------------------------------- */
const MALER = [
    (c) => d01tuerkranz(c),
    (c) => d02fussmatte(c),
    (c) => d03duftschale(c),
    (c, t) => d04windlicht(c, t),
    (c) => d05goldstern(c),
    (c) => d06sofaSet(c),
    (c, t) => d07fensterkette(c, t),
    (c, t) => d08adventskranz(c, t),
    (c) => d09struempfe(c),
    (c, t) => d10schneekugel(c, t),
    (c) => d11treppengirlande(c),
    (c, t) => d12lichtervorhang(c, t),
    (c) => d13raeuchermaennchen(c),
    (c) => d14nussknacker(c),
    (c, t) => d15herrnhuter(c, t),
    (c, t) => d16tischlaeufer(c, t),
    (c) => d17bettSet(c),
    (c, t) => d18schwibbogen(c, t),
    (c) => d19badSet(c),
    (c, t) => d20regalkette(c, t),
    (c) => d21klaviergirlande(c),
    (c, t) => d22dachkette(c, t),
    (c, t) => d23krippe(c, t),
    (c, t) => d24baum(c, t),
];
/** Feste Körper: hinter Luni zeichnen (vor der Nachtabdunkelung). */
function drawDeko(c, sichtbar, t) {
    for (let i = 0; i < MALER.length; i++) {
        if (sichtbar[i])
            MALER[i](c, t);
    }
}
/** Ein einzelnes Stück (Türchen 1–24) in Hauskoordinaten zeichnen – für den Deko-Katalog im Studio. */
function drawDekoStueck(c, tuer, t) {
    if (tuer >= 1 && tuer <= MALER.length)
        MALER[tuer - 1](c, t);
}
/** Warme Lichtscheine: nach der Nachtabdunkelung zeichnen, damit sie leuchten. */
function drawDekoLicht(c, sichtbar, t) {
    const an = (tuer) => sichtbar[tuer - 1];
    if (an(4))
        schein(c, WINDLICHT_FLAMME[0], WINDLICHT_FLAMME[1], 13, t, 0.4);
    if (an(5))
        schein(c, 649, 382, 10, t, 1.1, 0.14);
    if (an(7))
        ketteFensterWZ().forEach(([x, y], i) => schein(c, x, y, 5.5, t, i * 1.9, 0.16));
    if (an(8))
        kranzFlammen().forEach(([x, y], i) => schein(c, x, y - 3, 9, t, i * 1.7, 0.2));
    if (an(12))
        vorhangStraenge().forEach((str, s) => str.forEach(([x, y], i) => schein(c, x, y, 4.5, t, s + i * 2.1, 0.13)));
    if (an(15))
        schein(c, HERRNHUTER[0], HERRNHUTER[1], 16, t, 2.2, 0.2);
    if (an(16))
        TEELICHTER.forEach(([x, y], i) => schein(c, x, y - 1.6, 8, t, i * 2.2, 0.2));
    if (an(18))
        schwibbogenKerzen().forEach(([x, y], i) => schein(c, x, y - 3, 8, t, i * 1.4, 0.2));
    if (an(20))
        regalKette().forEach(([x, y], i) => schein(c, x, y, 4.5, t, i * 2.3, 0.13));
    if (an(22))
        dachPunkte().forEach(([x, y], i) => schein(c, x, y, 6.5, t, i * 1.6, 0.17));
    if (an(23))
        schein(c, KRIPPE_KIND[0], KRIPPE_KIND[1], 10, t, 3.1, 0.2);
    if (an(24)) {
        baumLichter().forEach(([x, y], i) => schein(c, x, y, 5, t, i * 1.3, 0.16));
        schein(c, BAUM[0], 367, 14, t, 0.8, 0.22);
    }
}

window.Deko={DEKO_STUECKE:DEKO_STUECKE,drawDekoStueck:drawDekoStueck};
})();
