import { faden, form, korn, licht, oval, pfad, type C } from "./stift";

/** Gedruckter Winterprospekt. Architektur und Schnee werden nur beim Formatwechsel neu gezeichnet. */
export function nachtAmKanal(c: C, w: number, h: number, klein: boolean) {
  c.save(); const s = h / 400, b = w / s; c.scale(s, s);
  c.fillStyle = licht(c, 0, 0, 0, 295, "#25394e", "#586579", "#999daa", "#e3bfa7"); c.fillRect(0, 0, b, 400);
  for (let i = 0; i < 119; i++) {
    const x = korn(i) * b, y = korn(i + 77) * 170;
    oval(c, `rgba(255,246,221,${.12 + korn(i + 26) * .48})`, x, y, .28 + korn(i + 62) * .48, .28 + korn(i + 62) * .48);
  }
  const mx = b * .858, my = klein ? 39 : 48, r = 18.6;
  const schimmer = c.createRadialGradient(mx, my, r, mx, my, 94);
  schimmer.addColorStop(0, "rgba(254,211,166,.15)"); schimmer.addColorStop(1, "rgba(253,211,166,0)");
  oval(c, schimmer, mx, my, 94, 94); oval(c, "#e9d7b8", mx, my, r, r);
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, u = r * .7 * korn(i + 15);
    oval(c, "rgba(154,151,151,.11)", mx + Math.cos(a) * u, my + Math.sin(a) * u, 1.1 + korn(i) * 2.4, .66 + korn(i) * 1.1, -.4);
  }
  for (let j = 0; j < 4; j++) {
    const x = (j * .33 - .08) * b, y = 26 + korn(j + 39) * 87;
    form(c, "rgba(221,203,198,.10)", x, y, [x + 29, y - 1.7, x + 53, y - 5.14], [x + 73, y - 6.8, x + 117, y - 2.87], [x + 151, y + .48], [x + 71, y + .27, x, y]);
  }
  const horizon = klein ? 203 : 253;
  for (let reihe = 0; reihe < 3; reihe++) {
    const y = horizon - 27 + reihe * 11, d = 1 + reihe * .34;
    for (let x = -15, i = 0; x < b + 20; i++) {
      const a = 41 * reihe + i, bw = (12 + 26 * korn(a + 6)) * d;
      const bh = (18 + korn(a + 41) * 71 + (i % 9 === 3 ? 27 : 0)) * (.8 + reihe * .12), top = y - bh;
      const farbe = ["#a7a4aa", "#888e9c", "#66788a"][reihe], seite = ["#a09ea5", "#7d8798", "#596d80"][reihe];
      form(c, farbe, x, y + 5, [x, top + 4], [x + bw * .16, top + 4], [x + bw * .16, top],
        [x + bw * .77, top], [x + bw * .77, top + 3.3], [x + bw, top + 3.3], [x + bw, y + 5]);
      form(c, seite, x + bw * .74, top + 3.4, [x + bw, top + 3.4], [x + bw, y + 4], [x + bw * .74, y + 4]);
      if ((i + reihe) % 4 === 1) {
        c.fillStyle = farbe; c.fillRect(x + bw * .28, top - 6.4, bw * .37, 6.5);
        faden(c, seite, .73, x + bw * .46, top - 5.9, [x + bw * .46, top - 19.5]);
        if (reihe > 0) oval(c, "#e0b49e", x + bw * .46, top - 20, 1.1, .8);
      }
      if (reihe > 0) {
        for (let m = 0; m < Math.floor((bh - 4) / 8); m++) for (let n = 0; n < Math.floor((bw - 5) / 5.9); n++) {
          if (korn(i * 79 + m * 13 + n + reihe) < .42) continue;
          c.fillStyle = (m + n + i) % 4 ? (reihe === 1 ? "#b9b5aa" : "#b0b3ad") : (reihe === 1 ? "#d2bcaa" : "#dcc0a3");
          c.fillRect(x + 3.1 + 5.9 * n, top + 7.2 + 8 * m, reihe === 1 ? 1.66 : 2.15, 2.63);
        }
        if (i % 6 === 2) {
          faden(c, "#87b5be", .93, x + bw * .22, top + 10.67, [x + bw * .22, top + bh * .7]);
          faden(c, "#b6c8c7", .4, x + bw * .22 + 1.7, top + 11.07, [x + bw * .22 + 1.7, top + bh * .66]);
        }
      }
      x += bw + 2.1 * korn(i + 61);
    }
  }
  // Zwei alte Funkhaeuser zwischen den Neubauten: Kuehlrippen, Staffelgiebel und warme Fensterbaender.
  for (const [anteil, hoehe, breit] of [[.077, 91.8, 26.4], [.937, 97.3, 20.2]]) {
    const x = b * anteil, oben = horizon - hoehe;
    form(c, "#647586", x - breit, horizon, [x - breit, oben + 30.8], [x - breit * .68, oben + 30.8], [x - breit * .68, oben + 12.7],
      [x - breit * .31, oben + 12.7], [x - breit * .31, oben], [x + breit * .28, oben], [x + breit * .28, oben + 10.6],
      [x + breit * .55, oben + 10.6], [x + breit * .55, oben + 25.51], [x + breit, oben + 25.51], [x + breit, horizon]);
    faden(c, "#a3b9bf", .86, x - breit * .31, oben, [x + breit * .28, oben]);
    faden(c, "#b5d0c9", 1.39, x - breit * .4, oben + 17.8, [x - breit * .4, oben + 40.67], [x - breit * .67, oben + 45.66], [x - breit * .67, oben + 62.7]);
    faden(c, "#c295a7", .79, x - breit * .23, oben + 18.8, [x - breit * .23, oben + 43.26], [x - breit * .42, oben + 47.14]);
    for (let j = 0; j < 7; j++) {
      faden(c, j % 3 ? "#929da9" : "#d2b599", .81, x + 2.5, oben + 33.1 + j * 5.7, [x + breit * .75, oben + 33.1 + j * 5.7]);
    }
    faden(c, "#8698a5", .73, x, oben, [x, oben - 18.4]); oval(c, "#d3ae9d", x, oben - 18.8, .82, .78);
  }
  // Das schneebedeckte Depot und der gemauerte Viadukt stehen am gegenueberliegenden Ufer.
  const dach = horizon - 41;
  form(c, "#53687a", 0, dach + 6, [b * .105, dach - 8.3], [b * .215, dach + 5], [b * .215, horizon + 12], [0, horizon + 12]);
  faden(c, "#c6cbd0", 2.03, 0, dach + 5.1, [b * .105, dach - 8.9], [b * .215, dach + 4.6]);
  for (let i = 0; i < 7; i++) {
    const x = b * .009 + i * b * .029;
    c.fillStyle = "#a7a69e"; c.fillRect(x, dach + 12, b * .019, 10.2);
    c.fillStyle = "#cbb69c"; c.fillRect(x + 1.2, dach + 13, Math.max(1.2, b * .008 - .9), 8.2);
  }
  c.fillStyle = "#697b89"; c.fillRect(0, horizon - 6, b, 6.4);
  for (let x = -9; x < b + 16; x += 51) {
    form(c, "#667989", x, horizon - .7, [x + 51, horizon - .7], [x + 51, horizon + 23.5],
      [x + 45, horizon + 23.5], [x + 44.5, horizon + 3.1, x + 25, horizon + 3.6],
      [x + 5.91, horizon + 3.7, x + 5.42, horizon + 24.1], [x, horizon + 24.1]);
    faden(c, "#a1a9ad", .8, x + 2, horizon - 6.68, [x + 2, horizon - 11.5]);
  }
  faden(c, "#d4d6d4", 1.22, 0, horizon - 6.38, [b, horizon - 6.38]);
  faden(c, "#929ca5", .74, 0, horizon - 11.5, [b, horizon - 11.5]);
  const z = horizon + 17;
  form(c, licht(c, 0, z - 15, 0, 420 - z, "#bec9d0", "#dce0dc", "#e8e8df"), 0, z - 2,
    [b * .24, z - 10.76, b * .48, z + 9.68, b * .64, z + 1.38], [b * .84, z - 7.94, b, z - 7.73], [b, 402], [0, 402]);
  for (let i = 0; i < 170; i++) {
    const x = korn(i + 451) * b, y = z + 5.5 + korn(i + 93) * (394 - z), len = .87 + korn(i + 167) * 8.6;
    faden(c, i % 4 ? "rgba(255,255,239,.53)" : "rgba(129,151,163,.26)", .3 + korn(i) * .39,
      x, y, [x + len * .4, y - .63, x + len, y - .75]);
  }
  // Leise Lichterkette am Bildrand, ausserhalb der Figurensilhouetten.
  const mast = b * .079;
  faden(c, "#596b78", 1.5, mast, z - 2, [mast, 116]);
  faden(c, "#71808b", .81, -5, 99, [mast * .52, 131, mast, 117]);
  for (let i = 1; i <= 4; i++) {
    const k = i / 5, x = mast * k, y = (1 - k) * (1 - k) * 99 + 2 * k * (1 - k) * 131 + k * k * 117;
    faden(c, "#667682", .64, x, y, [x, y + 2.83]); oval(c, "#eac9a0", x, y + 4.02, 1.28, 1.69);
  }
  c.restore();
}

export function studiengrund(c: C, w: number, h: number, tier: boolean) {
  c.fillStyle = licht(c, 0, 0, w, h, ...(tier ? ["#eee7da", "#e6e3d7", "#dbddcf"] : ["#c2ced0", "#d6d9d0", "#e5dfcf"]));
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < Math.min(4500, w * h / 70); i++) {
    const x = korn(i) * w, y = korn(i + 85) * h;
    faden(c, i % 3 ? "rgba(255,255,247,.21)" : "rgba(103,111,105,.08)", .36, x, y, [x + .7 + korn(i + 12) * 2.7, y + korn(i + 19) * .7]);
  }
  for (const x of [16, w - 16]) for (const y of [16, h - 16]) {
    pfad(c, x, y + (y < h / 2 ? 5 : -5), [x, y], [x + (x < w / 2 ? 5 : -5), y]); c.lineWidth = .65; c.strokeStyle = "rgba(71,85,80,.37)"; c.stroke();
  }
}