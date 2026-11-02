/* Hexenküche im Gruselhaus: gusseiserner Ofen mit bauchigem Kessel.
   Ersetzt den alten Backofen an dessen Platz (Breite 36, Korpus 38).
   Reines Canvas 2D, keine Assets. */
type C = CanvasRenderingContext2D;
type Pt = [number, number];

export const OFEN = {
  x: 690, w: 36, korpus: 38,
  /** Rohr rechts, gespiegelt zur Vorlage; endet oberhalb des Kessels. */
  rohrX: 726, rohrBreite: 5,
  /** Kessel mittig auf dem Ofen. */
  kessel: { x: 708, r: 14, hoehe: 17 },
  kesselStand: 702,
  ofenStand: 708,
} as const;

const EISEN = { dunkel: "#1e2327", mitte: "#353e45", hell: "#4d5960", kante: "#6d7a80", glanz: "#94a2a7" };

const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function rect(c: C, x: number, y: number, w: number, h: number, f: string) { c.fillStyle = f; c.fillRect(x, y, w, h); }
function rr(c: C, x: number, y: number, w: number, h: number, r: number, f: string) { c.fillStyle = f; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function ellipse(c: C, x: number, y: number, rx: number, ry: number, f: string) { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function disc(c: C, x: number, y: number, r: number, f: string) { c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function poly(c: C, pts: Pt[], f: string) { c.fillStyle = f; c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.closePath(); c.fill(); }
function line(c: C, a: number, b: number, d: number, e: number, f: string, w = 1) { c.strokeStyle = f; c.lineWidth = w; c.lineCap = "round"; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); }

/** Spitzbogen (oben gotisch, unten offen). */
function spitzbogen(c: C, x: number, y: number, w: number, h: number) {
  c.beginPath();
  c.moveTo(x, y + h); c.lineTo(x, y + h * .4);
  c.quadraticCurveTo(x + w * .22, y + h * .05, x + w / 2, y);
  c.quadraticCurveTo(x + w * .78, y + h * .05, x + w, y + h * .4);
  c.lineTo(x + w, y + h); c.closePath();
}

/** Feuer im Ofenraum. `stark` 0..1 steigt, wenn die Tür offen ist. */
function feuer(c: C, x: number, y: number, w: number, h: number, t: number, stark: number) {
  const a = .55 + stark * .45;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  rect(c, x, y, w, h, "#1a1512");
  const g = c.createRadialGradient(x + w / 2, y + h - 2, 2, x + w / 2, y + h - 2, w * .9);
  g.addColorStop(0, `rgba(255,181,72,${.62 * a})`);
  g.addColorStop(.45, `rgba(232,106,32,${.36 * a})`);
  g.addColorStop(1, "rgba(110,36,12,0)");
  c.fillStyle = g; c.fillRect(x, y, w, h);
  for (const [sx, sy] of [[x + 6, y + h - 2], [x + w - 6, y + h - 2], [x + 4, y + 5], [x + w - 4, y + 5]] as Pt[]) {
    line(c, sx, sy, sx + (sx < x + w / 2 ? 4 : -4), sy + 3, "#3a2a1e", 1.2);
  }
  for (let i = 0; i < 6; i++) {
    const wob = Math.sin(t * (5.4 + i * 1.1) + i * 2.1) * (1 + stark * 1.2);
    const fh = (7 + hash(i + Math.floor(t * 2.6)) * 7) * (.8 + stark * .35);
    const fx = x + 3.5 + i * ((w - 7) / 5) + wob * .45;
    const base = y + h - 1.2;
    poly(c, [
      [fx - 2.2, base], [fx + 2.2, base],
      [fx + 1.3 + wob * .5, base - fh * .5],
      [fx + wob * .7, base - fh],
      [fx - .9 + wob * .3, base - fh * .45],
    ], i % 2 ? `rgba(242,158,44,${.9 * a})` : `rgba(255,216,116,${.95 * a})`);
    if (stark > .5 && i % 2 === 0) {
      const sp = (t * .9 + i * .3) % 1;
      disc(c, fx + wob, base - fh - sp * 8, .55, `rgba(255,206,120,${(1 - sp) * .8})`);
    }
  }
  c.restore();
}

/** Tür: Scharniere links. Geschlossen mit Bogenfenster; offen nach links aufgeschwungen. */
function tuer(c: C, x: number, y: number, w: number, h: number, offen: number) {
  c.save(); spitzbogen(c, x, y, w, h); c.clip();
  rect(c, x, y, w, h, offen < .5 ? "rgba(30,34,38,.35)" : "rgba(10,10,12,0)");
  c.restore();
  if (offen < .98) {
    const d = Math.min(1, (1 - offen) * 1.4);
    c.save(); c.globalAlpha = d;
    // Türblatt
    spitzbogen(c, x + .4, y + .4, w - .8, h - .8);
    c.fillStyle = "#39424a"; c.fill();
    c.strokeStyle = "#5a666d"; c.lineWidth = .8; c.stroke();
    // Bogenfenster: Feuer scheint durch
    spitzbogen(c, x + 3.6, y + 4.2, w - 7.2, h - 7);
    c.fillStyle = "rgba(240,150,54,.20)"; c.fill();
    c.strokeStyle = "#69757a"; c.lineWidth = .6; c.stroke();
    c.restore();
    // Fensterkreuz und Glanz
    line(c, x + w / 2, y + 4.4, x + w / 2, y + h - 3, "rgba(115,128,132,.75)", .7);
    line(c, x + 4, y + h * .56, x + w - 4, y + h * .56, "rgba(115,128,132,.6)", .6);
    // Scharniere links
    for (const yy of [y + 3.5, y + h - 6]) {
      rr(c, x - .9, yy, 3, 3.2, 1, "#8f9a9c");
      disc(c, x + .1, yy + 1.6, .45, "#2b3236");
    }
    // Griff links unter dem Fenster
    disc(c, x + 2.4, y + h * .72, 1, "#b58b3c");
  } else {
    // ganz offen: Türblatt steht links, man sieht nur die Kante
    poly(c, [[x - 1, y + .6], [x + 1.6, y + 1.8], [x + 1.6, y + h - 1], [x - 1, y + h - .4]], "#39424a");
    for (const yy of [y + 4, y + h - 7]) disc(c, x + .3, yy, 1, "#8f9a9c");
  }
  // Türrahmen
  c.save(); spitzbogen(c, x, y, w, h); c.strokeStyle = "#59656b"; c.lineWidth = 1.1; c.stroke(); c.restore();
  // Rostspuren
  for (const [rx, ry] of [[x + 1.5, y + h - 4], [x + w - 2, y + h * .42]]) line(c, rx, ry, rx + 1, ry + 2.4, "#8a5a34", .7);
}

/** Der Ofen. `offen` 0..1 öffnet die Feuertür. */
export function drawOfen(c: C, F: number, t: number, offen: number) {
  const x = OFEN.x, w = OFEN.w, top = F - OFEN.korpus;
  ellipse(c, x + w / 2, F + 1, 22, 2.2, "rgba(12,9,7,.4)");
  // Korpus, unten breiter
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, EISEN.mitte); g.addColorStop(.28, "#465158"); g.addColorStop(.62, EISEN.mitte); g.addColorStop(1, EISEN.dunkel);
  c.fillStyle = g;
  c.beginPath(); c.moveTo(x + 1.2, top); c.lineTo(x + w - 1.2, top); c.lineTo(x + w, F - 3.4); c.lineTo(x, F - 3.4); c.closePath(); c.fill();
  c.strokeStyle = EISEN.kante; c.lineWidth = .8; c.stroke();
  // Deckplatte
  rr(c, x - 1.8, top - 3.4, w + 3.6, 3.8, 1.2, "#48535a");
  rect(c, x - 1.2, top - 3.4, w + 2.4, .9, EISEN.glanz);
  // Feuerraum
  const fx = x + 8, fy = top + 7, fw = w - 16, fh = 20;
  feuer(c, fx - 1.4, fy - 1.4, fw + 2.8, fh + 2, t, offen);
  tuer(c, fx, fy, fw, fh, offen);
  // Aschefach mit zwei Schrauben
  rr(c, x + 9.5, F - 13, w - 19, 7.2, 1.2, "#2a3136");
  rect(c, x + 9.5, F - 13, w - 19, .7, "#566168");
  for (const dx of [12.5, w - 12.5]) disc(c, x + dx, F - 9.4, .65, "#828d90");
  // Nieten und Schatten
  for (const [dx, dy] of [[3.2, top + 3.6], [w - 3.2, top + 3.6], [3.2, F - 17.5], [w - 3.2, F - 17.5]] as Pt[]) {
    disc(c, x + dx, dy, .7, "#8b979a");
    disc(c, x + dx - .2, dy - .2, .3, "#c2ccce");
  }
  line(c, x + 1, F - 3.6, x + w - 1, F - 3.6, "rgba(0,0,0,.35)", 1.2);
  // Füße
  for (const dx of [4, w - 4]) {
    c.strokeStyle = "#262c30"; c.lineWidth = 1.8; c.beginPath();
    c.moveTo(x + dx, F - 3.6); c.quadraticCurveTo(x + dx + (dx < 10 ? -1.4 : 1.4), F - .7, x + dx + (dx < 10 ? -2.8 : 2.8), F - .2);
    c.stroke();
  }
  // Rohr rechts: Steigrohr, Knick nach links, Kappe (gespiegelt zur Vorlage).
  const rx = OFEN.rohrX - OFEN.rohrBreite;
  const rohrTop = top - 25;
  rect(c, rx + .4, rohrTop + 2, OFEN.rohrBreite, top - rohrTop, "#3c474e");
  rect(c, rx + .4, rohrTop + 2, 1.3, top - rohrTop, "#78868b");
  line(c, rx + OFEN.rohrBreite - .8, rohrTop + 3, rx + OFEN.rohrBreite - .8, top - 1, "rgba(14,18,20,.55)", .8);
  // Muffe kurz über der Deckplatte
  rr(c, rx - .5, top - 9, OFEN.rohrBreite + 1, 3.4, .8, "#2b3338");
  // Knick nach links
  rr(c, rx - 10.5, rohrTop + .6, 15.5, 4.4, 1.2, "#3a444b");
  rect(c, rx - 10, rohrTop + .8, 14.6, .8, "#7b898e");
  // Kappe über dem Knickende
  poly(c, [[rx - 10.8, rohrTop + .8], [rx - 1.2, rohrTop + .8], [rx - 3.6, rohrTop - 4.4], [rx - 8.4, rohrTop - 4.4]], "#2a3237");
  rect(c, rx - 8.8, rohrTop - 4.6, 8, 1.1, "#95a2a5");
  disc(c, rx - 4.8, rohrTop - 6, 1, "#20262a");
  // Wandflansch am Steigrohr
  rr(c, x + w - 1.4, rohrTop + 8, 2.8, 5.4, .6, "#2a3136");
  rr(c, x + w - 2, rohrTop + 9.4, 3.4, 1, .4, "#556166");
}

/** Bauchiger Kessel mittig auf der Deckplatte, mit Flüssigkeit und Dampf. */
export function drawKessel(c: C, F: number, t: number) {
  const k = OFEN.kessel, top = F - OFEN.korpus - 3.4;
  const cx = k.x, rimY = top - k.hoehe;
  // Gussring unter dem Kessel, satt auf der Deckplatte
  rr(c, cx - 12, top - 2.6, 24, 4.2, 1.4, "#242a2e");
  rect(c, cx - 10.5, top - 2.4, 21, .8, "#5b6367");
  for (let i = -5; i <= 5; i += 2) rect(c, cx + i, top - 1.8, .8, 3, "#414a4f");
  // Körper: bauchig, dunkles Gusseisen
  const body = c.createLinearGradient(cx - k.r, 0, cx + k.r, 0);
  body.addColorStop(0, "#15181b"); body.addColorStop(.28, "#30383e"); body.addColorStop(.55, "#252c31"); body.addColorStop(.82, "#30383e"); body.addColorStop(1, "#121518");
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(cx - 10.4, rimY + 2.2);
  c.bezierCurveTo(cx - 17.8, rimY + 9.5, cx - 14.6, top + 1.6, cx - 7, top + 2);
  c.quadraticCurveTo(cx, top + 2.8, cx + 7, top + 2);
  c.bezierCurveTo(cx + 14.6, top + 1.6, cx + 17.8, rimY + 9.5, cx + 10.4, rimY + 2.2);
  c.closePath(); c.fill();
  c.strokeStyle = "#4a555b"; c.lineWidth = .8; c.stroke();
  // Glanzkante und Bauchnaht
  line(c, cx - 8.8, rimY + 3.6, cx - 7.4, top - 5, "rgba(178,198,203,.28)", 1.2);
  line(c, cx + 9, rimY + 5, cx + 8, top - 6, "rgba(0,0,0,.4)", .9);
  // Rand
  ellipse(c, cx, rimY + 1.2, 11.4, 3, "#3c454b");
  ellipse(c, cx, rimY + .5, 10.1, 2.4, "#0e1114");
  // Inhalt
  ellipse(c, cx, rimY + .7, 9.2, 1.95, "#255744");
  ellipse(c, cx, rimY + .7, 7.3, 1.35, "#3b8259");
  ellipse(c, cx - 1.4, rimY + .4, 2.4, .5, "#6fb27f");
  for (let i = 0; i < 4; i++) {
    const ph = (t * .5 + i * .27) % 1;
    disc(c, cx - 5 + i * 3.3 + Math.sin(t * 1.3 + i) * .9, rimY + .6 - ph * .5, .45 + ph * .8, `rgba(160,226,172,${.65 - ph * .55})`);
  }
  // Henkel
  for (const s of [-1, 1] as const) {
    c.strokeStyle = "#2d3439"; c.lineWidth = 1.7;
    c.beginPath(); c.arc(cx + s * 9.8, rimY + 3, 2.8, s > 0 ? -1.25 : 1.9, s > 0 ? 1.9 : 5.05); c.stroke();
    disc(c, cx + s * 9.5, rimY + .8, .8, "#4d585e");
  }
  // Dampf
  for (let i = 0; i < 4; i++) {
    const ph = (t * .2 + i * .26) % 1;
    c.globalAlpha = .17 * (1 - ph);
    ellipse(c, cx - 4.5 + i * 3 + Math.sin(t * .8 + i) * 3.4, rimY - 3 - ph * 17, 2 + ph * 4.2, 1.4 + ph * 2.6, "#e2eae1");
  }
  c.globalAlpha = 1;
}
